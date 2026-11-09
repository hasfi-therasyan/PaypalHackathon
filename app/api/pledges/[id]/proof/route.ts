import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { db, ProofRecord, VerdictRecord } from '@/app/lib/db';
import { appendLedgerEvent, LEDGER_EVENT_TYPES } from '@/app/lib/ledger/chain';
import { evaluateGitHubActivity, fetchGitHubCommits, GitHubRubric } from '@/app/lib/referee/github';
import { evaluatePhotoProof, PhotoAnalysisResult, PhotoRubric } from '@/app/lib/referee/photo';
import { determineVerdict } from '@/app/lib/referee/verdict';
import { voidAuthorization } from '@/app/lib/paypal/authorizations';
import { compressAndStoreProofImage, ProofUploadError } from '@/app/lib/proofs/storage';
import { transitionOrThrow } from '@/app/lib/state/transitions';
import { getViewer, requirePledgeAccess } from '@/app/lib/access';
import { analyzeProofPhoto } from '@/app/lib/referee/vision';

const OnDeviceVisionFindingSchema = z.object({
  provider: z.literal('transformers.js'),
  model: z.string().min(1).max(200),
  ran_locally: z.literal(true),
  analyzed_at: z.string().datetime(),
  scene_elements: z.array(z.string().min(1).max(120)).max(30),
  element_confidences: z.record(z.number().min(0).max(1)),
  confidence: z.number().min(0).max(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pledge = await db.pledges.get(params.id);
    if (!pledge) {
      return NextResponse.json({ error: 'Pledge not found' }, { status: 404 });
    }
    if (!requirePledgeAccess(pledge, getViewer(request), ['owner', 'admin']).allowed) {
      return NextResponse.json({ error: 'Only the commitment creator can submit proof.' }, { status: 403 });
    }

    if (pledge.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Cannot submit proof for pledge in '${pledge.status}' status. Must be ACTIVE.` },
        { status: 400 }
      );
    }
    if (new Date(pledge.ends_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'This sprint has ended; the settlement worker will resolve it.' }, { status: 409 });
    }

    const proofId = crypto.randomUUID();
    let body: Record<string, any> = {};
    let storagePath: string | null = null;
    let signalsJson: any = {};
    let aiFindingsJson: any = {};
    let confidence = 1.0;
    let evalReasons: string[] = [];
    let isPassed = false;
    let isBorderline = false;

    // 1. GITHUB PROOF EVALUATION
    if (pledge.goal_type === 'github') {
      body = await request.json();
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
      const formData = await request.formData();
      const proofPhoto = formData.get('proof_photo');
      if (!(proofPhoto instanceof File)) {
        return NextResponse.json(
          { error: 'A photo proof is required.' },
          { status: 400 }
        );
      }

      const storedImage = await compressAndStoreProofImage(pledge.id, proofId, proofPhoto);
      storagePath = storedImage.path;
      body = {
        ocr_code: String(formData.get('ocr_code') || ''),
        ocr_confidence: Number(formData.get('ocr_confidence') || 0),
      };

      const expectedCode = pledge.rubric_json.challenge_code || 'amber-otter-17';
      const rubric: PhotoRubric = {
        required_scene_elements: pledge.rubric_json.required_scene_elements || ['laptop', 'notes'],
        min_confidence: pledge.rubric_json.min_confidence || 0.70,
      };

      const rawOnDeviceFinding = formData.get('vision_findings');
      let onDeviceFinding: z.infer<typeof OnDeviceVisionFindingSchema> | null = null;
      if (typeof rawOnDeviceFinding === 'string' && rawOnDeviceFinding) {
        try {
          const parsed = OnDeviceVisionFindingSchema.safeParse(JSON.parse(rawOnDeviceFinding));
          if (parsed.success) onDeviceFinding = parsed.data;
        } catch {
          // Client-side inference is optional evidence. Invalid payloads never
          // block a proof submission or substitute for the human referee.
        }
      }

      let photoAnalysis: PhotoAnalysisResult;
      let visionMethod = 'on_device_tesseract_ocr';
      if (onDeviceFinding) {
        // This output is intentionally treated as supplemental evidence: a
        // browser client can be modified, so a referee—not this payload—has
        // final settlement authority.
        const confidences = Object.fromEntries(
          rubric.required_scene_elements.map((element) => [
            element,
            onDeviceFinding?.element_confidences[element] ?? 0,
          ])
        );
        photoAnalysis = {
          code_read: body.ocr_code,
          scene_elements: rubric.required_scene_elements.filter((element) => (confidences[element] || 0) >= 0.5),
          suspicious_signs: [],
          element_confidences: confidences,
          confidence: Math.max(onDeviceFinding.confidence, Math.max(0, Math.min(1, body.ocr_confidence))),
        };
        visionMethod = 'on_device_transformersjs_zero_shot';
      } else {
        try {
          // A configured vision service evaluates the private, short-lived URL.
          // Browser OCR remains a useful fallback and never decides settlement.
          photoAnalysis = await analyzeProofPhoto({
            storagePath: storedImage.path,
            expectedCode,
            requiredSceneElements: rubric.required_scene_elements,
          });
          visionMethod = process.env.VISION_REFEREE_URL ? 'vision_service_with_ocr_fallback' : visionMethod;
        } catch (error) {
          console.warn('Vision analysis unavailable; retaining OCR evidence for referee review.', error);
          photoAnalysis = {
            code_read: '',
            scene_elements: [],
            suspicious_signs: ['Vision analysis was unavailable; referee review is required.'],
            element_confidences: {},
            confidence: 0,
          };
        }
      }

      if (!photoAnalysis.code_read && body.ocr_code) {
        photoAnalysis.code_read = body.ocr_code;
      }
      photoAnalysis.confidence = Math.max(
        photoAnalysis.confidence || 0,
        Math.max(0, Math.min(1, body.ocr_confidence))
      );

      const evaluation = evaluatePhotoProof(expectedCode, photoAnalysis, rubric);
      // OCR is an evidentiary signal, not an automated verdict. A trusted
      // referee must review each photo proof before any PayPal settlement.
      isPassed = false;
      isBorderline = true;
      evalReasons = [...evaluation.reasons, 'Photo proof requires a final referee decision.'];
      signalsJson = {
        photoAnalysis,
        codeMatch: evaluation.code_match,
        image: storedImage,
      };
      aiFindingsJson = {
        method: visionMethod,
        model: onDeviceFinding?.model || null,
        model_ran_locally: onDeviceFinding?.ran_locally || false,
        model_analyzed_at: onDeviceFinding?.analyzed_at || null,
        code_read: photoAnalysis.code_read,
        ocr_confidence: photoAnalysis.confidence,
        detected_scene_elements: photoAnalysis.scene_elements,
        element_confidences: photoAnalysis.element_confidences,
        missing_scene_elements: evaluation.missing_elements,
        suspicious_signs: photoAnalysis.suspicious_signs,
        summary: evaluation.reasons.join(' '),
        automatic_settlement: false,
        trust_boundary: 'Client-side AI output is supplemental evidence only; the assigned friend referee makes the final decision.',
      };
      confidence = photoAnalysis.confidence;
    }

    // Save proof record
    const proofRecord: ProofRecord = {
      id: proofId,
      pledge_id: pledge.id,
      kind: pledge.goal_type,
      challenge_code: pledge.goal_type === 'photo' ? (pledge.rubric_json.challenge_code || null) : null,
      storage_path: storagePath,
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
      if (!pledge.paypal_authorization_id) {
        return NextResponse.json({ error: 'The PayPal authorization is missing.' }, { status: 409 });
      }
      await voidAuthorization(pledge.paypal_authorization_id, pledge.stake_cents, pledge.user_id);
      transitionOrThrow(pledge.status, 'SUCCEEDED');
      await db.pledges.update(pledge.id, { status: 'SUCCEEDED' });
      await appendLedgerEvent(pledge.id, LEDGER_EVENT_TYPES.HOLD_VOIDED, {
        authorizationId: pledge.paypal_authorization_id,
      });
    } else {
      // Borderline or fail -> Open appeal window (24h)
      transitionOrThrow(pledge.status, 'APPEAL_WINDOW_OPEN');
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
    if (error instanceof ProofUploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to submit proof' },
      { status: 500 }
    );
  }
}

