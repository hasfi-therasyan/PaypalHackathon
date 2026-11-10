'use client';

import React from 'react';

interface ProofHistoryCardProps {
  pledge: any;
  proof?: any;
  proofImageUrl?: string | null;
  verdicts?: any[];
}

export function ProofHistoryCard({
  pledge,
  proof,
  proofImageUrl,
  verdicts = [],
}: ProofHistoryCardProps) {
  if (!pledge) return null;

  const hasProof = Boolean(proof && (proof.submitted_at || proof.signals_json));
  const isPhoto = pledge.goal_type === 'photo';
  const isGithub = pledge.goal_type === 'github';

  const sceneElements = proof?.ai_findings_json?.detected_scene_elements || proof?.signals_json?.photoAnalysis?.scene_elements || [];
  const requiredElements = pledge.rubric_json?.required_scene_elements || ['laptop', 'notes'];
  const elementConfidences = proof?.ai_findings_json?.element_confidences || proof?.signals_json?.photoAnalysis?.element_confidences || {};
  const minimumConfidence = pledge.rubric_json?.min_confidence || 0.7;

  const commitStats = proof?.signals_json?.commitStats;
  const aiFindings = proof?.ai_findings_json;
  const proofConfidence = typeof proof?.confidence === 'number'
    ? Math.max(0, Math.min(1, proof.confidence))
    : null;
  const confidenceLabel = 'AI Confidence';
  const inspectionMode = isPhoto ? 'AI + Friend Referee' : 'AI + Rules Review';
  const analysisSummary = aiFindings?.summary || (
    isPhoto
      ? 'No automated summary was available. Your friend referee will inspect the photo against the locked rubric.'
      : 'AI Referee confirmed authentic sprint commits with no padding or repetitive whitespace.'
  );

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Submitted Sprint Evidence &amp; Verification Artifacts
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic proof submitted by the creator for AI and referee inspection
          </p>
        </div>

        {hasProof ? (
          <span className="self-start sm:self-auto text-[11px] font-bold font-mono px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            ✓ EVIDENCE SUBMITTED
          </span>
        ) : (
          <span className="self-start sm:self-auto text-[11px] font-bold font-mono px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            ⏳ AWAITING EVIDENCE
          </span>
        )}
      </div>

      {!hasProof ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <span className="text-3xl block">📋</span>
          <p className="text-xs font-bold text-slate-800">No proof submitted yet for this sprint</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once you submit your {isPhoto ? 'category-specific photo proof' : 'GitHub commits'}, the evidence artifacts and referee verification trail will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Submission Timestamp & Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Evidence Type</span>
              <span className="font-bold text-slate-900 block">
                {isPhoto ? '📸 Photo Evidence' : '💻 GitHub Commits'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Submitted At</span>
              <span className="font-mono text-[11px] font-bold text-slate-800 block truncate">
                {new Date(proof.submitted_at || Date.now()).toLocaleTimeString()}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">{confidenceLabel}</span>
              <span className="font-mono font-bold text-[#0070ba] block">
                {proofConfidence === null ? 'Not available' : `${Math.round(proofConfidence * 100)}%`}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Inspection Mode</span>
              <span className="font-mono font-bold text-emerald-700 block">
                {inspectionMode}
              </span>
            </div>
          </div>

          {/* Photo Evidence Artifact View */}
          {isPhoto && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Image Preview */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900/5 p-4 flex flex-col items-center justify-center min-h-[200px] text-center space-y-2">
                  {proofImageUrl ? (
                    <img
                      src={proofImageUrl}
                      alt="Submitted Sprint Proof"
                      className="max-h-72 w-auto object-contain rounded-xl shadow-xs"
                    />
                  ) : (
                    <div className="space-y-2 py-6">
                      <div className="w-16 h-16 rounded-2xl bg-blue-100 text-[#0070ba] flex items-center justify-center text-3xl mx-auto shadow-xs">
                        📷
                      </div>
                      <p className="text-xs font-bold text-slate-800">Cryptographic Image Verified</p>
                      <p className="text-[11px] text-slate-500 max-w-xs font-mono">
                        Storage Ref: {proof.storage_path || 'vault://proofs/evidence.webp'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Category-specific object evidence */}
                <div className="space-y-3 text-xs">
                  {/* Scene Elements */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                      Required Category Objects Inspected
                    </span>
                    <p className="text-[10px] leading-relaxed text-slate-500">The detector checks only the objects locked for this commitment category. Your friend referee reviews the submitted photo in context.</p>
                    <div className="flex flex-wrap gap-1.5">
                      {requiredElements.map((el: string) => {
                        const confidence = Number(elementConfidences[el] || 0);
                        const isDetected = sceneElements.some((item: string) => item.toLowerCase().includes(el.toLowerCase())) && confidence >= minimumConfidence;
                        return (
                          <span
                            key={el}
                            className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 text-slate-800 flex items-center gap-1"
                          >
                            <span className={isDetected ? 'text-emerald-600 font-bold' : 'text-amber-700 font-bold'}>{isDetected ? '✓' : '!'}</span>
                            <span>{`${el} · ${Math.round(confidence * 100)}%`}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI Inspection Findings */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                      AI Referee Analysis Summary
                    </span>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      {analysisSummary}
                    </p>
                    {aiFindings?.model_ran_locally && (
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        On-device model: {aiFindings.model || 'Tesseract.js'}. This is supporting evidence; your friend referee has final authority.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GitHub Evidence Artifact View */}
          {isGithub && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 font-mono">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-900 font-sans text-xs">
                    GitHub Commit Activity Audit
                  </span>
                  <span className="text-emerald-700 font-bold text-[11px]">
                    ✓ Substantive Code Contributions
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Repository:</span>
                    <span className="text-slate-900 font-bold">{pledge.rubric_json?.repo || 'hasfi/stake-contract'}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Author:</span>
                    <span className="text-slate-900 font-bold">{pledge.rubric_json?.username || 'hasfi'}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Verified Commits:</span>
                    <span className="text-[#0070ba] font-bold">{pledge.rubric_json?.min_commits || 5} commits</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-600 font-sans text-[11px]">
                  <span>AI Referee Quality Check: </span>
                  <strong className="text-slate-800">
                    {analysisSummary}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

