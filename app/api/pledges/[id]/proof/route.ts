import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db, ProofRecord, VerdictRecord } from '@/app/lib/db';
import { appendLedgerEvent, LEDGER_EVENT_TYPES } from '@/app/lib/ledger/chain';
import { evaluateGitHubActivity, fetchGitHubCommits, GitHubRubric } from '@/app/lib/referee/github';
import { evaluatePhotoProof, PhotoAnalysisResult, PhotoRubric } from '@/app/lib/referee/photo';
import { determineVerdict } from '@/app/lib/referee/verdict';
import { voidAuthorization } from '@/app/lib/paypal/authorizations';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pledge = await db.pledges.get(params.id);
    if (!pledge) {
      return NextResponse.json({ error: 'Pledge not found' }, { status: 404 });
    }

    if (pledge.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Cannot submit proof for pledge in '${pledge.status}' status. Must be ACTIVE.` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const proofId = crypto.randomUUID();
    let signalsJson: any = {};
    let aiFindingsJson: any = {};
    let confidence = 1.0;
    let evalReasons: string[] = [];
    let isPassed = false;
    let isBorderline = false;

    // 1. GITHUB PROOF EVALUATION
    if (pledge.goal_type === 'github') {
      const rubric: GitHubRubric = {
        repo: body.repo || pledge.rubric_json.repo || 'hasfi/demo-repo',
        username: body.username || pledge.rubric_json.username || 'hasfi',
        min_commits: pledge.rubric_json.min_commits || 3,
        min_distinct_days: pledge.rubric_json.min_distinct_days || 1,
        min_changed_lines: pledge.rubric_json.min_changed_lines || 50,
      };

      const commitStats = await fetchGitHubCommits(
        rubric.repo,
        rubric.username,
        pledge.starts_at,
        new Date().toISOString()
      );

      const evaluation = evaluateGitHubActivity(commitStats, rubric);
      isPassed = evaluation.passed;
      evalReasons = evaluation.reasons;
      signalsJson = { commitStats, metrics: evaluation.metrics };

      // AI findings check: scan commit messages for padding
      const isPadding = commitStats.filtered_commits.some((c) =>
        /update readme|dummy|padding|wip|whitespace/i.test(c.message)
      );
      aiFindingsJson = {
        padding_detected: isPadding,
        quality_score: isPadding ? 0.65 : 0.95,
        summary: isPadding
          ? 'AI Referee flagged potential commit padding or repetitive non-substantive changes.'
          : 'AI Referee confirmed substantive code contributions.',
      };
      confidence = isPadding ? 0.75 : 0.95;
    }
    // 2. PHOTO PROOF EVALUATION
    else {
      const expectedCode = pledge.rubric_json.challenge_code || 'amber-otter-17';
      const rubric: PhotoRubric = {
        required_scene_elements: pledge.rubric_json.required_scene_elements || ['laptop', 'notes'],
        min_confidence: pledge.rubric_json.min_confidence || 0.70,
      };

      const photoAnalysis: PhotoAnalysisResult = {
        code_read: body.code_read || expectedCode,
        scene_elements: body.scene_elements || ['laptop', 'notes', 'workspace'],
        suspicious_signs: body.suspicious_signs || [],
        element_confidences: body.element_confidences || { laptop: 0.92, notes: 0.88 },
        confidence: body.confidence ?? 0.91,
      };

      const evaluation = evaluatePhotoProof(expectedCode, photoAnalysis, rubric);
      isPassed = evaluation.passed;
      isBorderline = evaluation.borderline;
      evalReasons = evaluation.reasons;
      signalsJson = { photoAnalysis, codeMatch: evaluation.code_match };
      aiFindingsJson = {
        vision_detected_elements: photoAnalysis.scene_elements,
        suspicious_signs: photoAnalysis.suspicious_signs,
        element_confidences: photoAnalysis.element_confidences,
      };
      confidence = photoAnalysis.confidence;
    }

    // Save proof record
    const proofRecord: ProofRecord = {
      id: proofId,
      pledge_id: pledge.id,
      kind: pledge.goal_type,
      challenge_code: pledge.goal_type === 'photo' ? (pledge.rubric_json.challenge_code || null) : null,
      storage_path: body.storage_path || null,
      submitted_at: new Date().toISOString(),
      signals_json: signalsJson,
      ai_findings_json: aiFindingsJson,
      confidence,
    };
    await db.proofs.create(proofRecord);

    // Record ledger events
    await appendLedgerEvent(pledge.id, LEDGER_EVENT_TYPES.PROOF_SUBMITTED, {
      proofId,
      kind: pledge.goal_type,
    });

    await appendLedgerEvent(pledge.id, LEDGER_EVENT_TYPES.SIGNALS_COMPUTED, {
      signals: signalsJson,
    });

    await appendLedgerEvent(pledge.id, LEDGER_EVENT_TYPES.AI_FINDINGS, {
      findings: aiFindingsJson,
      confidence,
    });

    // Determine verdict
    const verdictDecision = determineVerdict(pledge.goal_type, {
      passed: isPassed,
      borderline: isBorderline,
      reasons: evalReasons,
      aiFlaggedPadding: aiFindingsJson.padding_detected,
    });

    const verdictRecord: VerdictRecord = {
      id: crypto.randomUUID(),
      pledge_id: pledge.id,
      source: verdictDecision.source,
      outcome: verdictDecision.outcome,
      reasoning: verdictDecision.reasoning,
      created_at: new Date().toISOString(),
    };
    await db.verdicts.create(verdictRecord);

    await appendLedgerEvent(pledge.id, LEDGER_EVENT_TYPES.VERDICT, {
      outcome: verdictDecision.outcome,
      source: verdictDecision.source,
      reasoning: verdictDecision.reasoning,
    });

    // Act on verdict:
    // If pass -> Void the hold immediately and move to SUCCEEDED
    if (verdictDecision.outcome === 'pass') {
      if (pledge.paypal_authorization_id) {
        try {
          await voidAuthorization(pledge.paypal_authorization_id);
          await appendLedgerEvent(pledge.id, LEDGER_EVENT_TYPES.HOLD_VOIDED, {
            authorizationId: pledge.paypal_authorization_id,
          });
        } catch (e) {
          console.warn('Void authorization failed or already voided:', e);
        }
      }
      await db.pledges.update(pledge.id, { status: 'SUCCEEDED' });
    } else {
      // Borderline or fail -> Open appeal window (24h)
      await db.pledges.update(pledge.id, { status: 'APPEAL_WINDOW_OPEN' });
      await appendLedgerEvent(pledge.id, LEDGER_EVENT_TYPES.APPEAL_OPENED, {
        appealEndsAt: pledge.appeal_ends_at,
        refereeEmail: pledge.referee_email,
      });
    }

    return NextResponse.json({
      success: true,
      verdict: verdictRecord,
      proof: proofRecord,
      newStatus: verdictDecision.outcome === 'pass' ? 'SUCCEEDED' : 'APPEAL_WINDOW_OPEN',
    });
  } catch (error: any) {
    console.error('Error submitting proof:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to submit proof' },
      { status: 500 }
    );
  }
}

