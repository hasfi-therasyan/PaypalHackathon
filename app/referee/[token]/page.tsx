'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/lib/auth-context';
import { accountRequestHeaders } from '@/app/lib/access';

export default function RefereeAppealPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isReady } = useAuth();
  const token = params.token as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyDecided, setAlreadyDecided] = useState(false);

  useEffect(() => {
    async function fetchAppealData() {
      if (!user) {
        setError('Sign in with the referee account assigned to this commitment.');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/pledges/${token}`, { headers: accountRequestHeaders(user) });
        if (!res.ok) throw new Error('Invalid or expired referee token.');
        const json = await res.json();
        if (json.access !== 'referee' && json.access !== 'admin') {
          throw new Error('This review is reserved for the referee assigned to the commitment.');
        }
        setData(json);

        if (json.pledge.status !== 'APPEAL_WINDOW_OPEN') {
          setAlreadyDecided(true);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (isReady) fetchAppealData();
  }, [token, isReady, user]);

  async function handleDecision(approved: boolean) {
    if (!note.trim()) {
      setError('Please provide a mandatory written explanation for your referee decision.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/pledges/${token}/appeal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...accountRequestHeaders(user) },
        body: JSON.stringify({ approved, note: note.trim() }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to submit referee decision.');

      setAlreadyDecided(true);
      router.push(`/pledges/${token}/verdict`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <div className="w-8 h-8 border-4 border-[#0070ba] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">Verifying friend referee token…</p>
      </div>
    );
  }

  if (error && !data?.pledge) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
          <h2 className="text-base font-bold text-red-700">Token Inactive or Expired</h2>
          <p className="text-sm text-red-600">{error}</p>
          <Link href="/dashboard" className="inline-block px-5 py-2.5 bg-[#0070ba] text-white rounded-xl text-sm font-semibold hover:bg-[#005ea6] transition-colors">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { pledge, proof } = data;
  const formattedMoney = `$${(pledge.stake_cents / 100).toFixed(2)} USD`;
  const aiFindings = proof?.ai_findings_json || null;
  const proofConfidence = typeof proof?.confidence === 'number'
    ? Math.max(0, Math.min(1, proof.confidence))
    : null;
  const isPhotoProof = proof?.kind === 'photo';
  const requiredElements = Array.isArray(pledge.rubric_json?.required_scene_elements)
    ? pledge.rubric_json.required_scene_elements
    : [];
  const elementConfidences = aiFindings?.element_confidences || {};
  const detectedElements = aiFindings?.detected_scene_elements || [];
  const minimumConfidence = Number(pledge.rubric_json?.min_confidence || 0.5);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 pb-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-[#003087] text-xs font-semibold rounded-full">
          <span className="w-2 h-2 rounded-full bg-[#0070ba] animate-pulse" />
          Friend Referee Appeal
        </span>
        <h1 className="text-2xl font-bold text-[#003087] tracking-tight">
          Review &amp; Final Ruling
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          You are the nominated referee for <strong className="text-slate-700">{pledge.title}</strong>. Your single decision overrides all automated findings.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <strong>Notice:</strong> {error}
        </div>
      )}

      {alreadyDecided ? (
        <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            Decision Finalized
          </h2>
          <p className="text-xs text-slate-500">
            Status: <span className="font-mono font-semibold text-slate-700 tabular-nums">{pledge.status}</span>
          </p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            This sprint appeal has been finalized and sealed in the SHA-256 ledger. This referee link is now permanently closed.
          </p>
          <Link
            href={`/pledges/${pledge.id}/verdict`}
            className="inline-block px-5 py-2.5 bg-[#0070ba] hover:bg-[#005ea6] text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            Inspect Official Verdict →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Contract Terms Summary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#003087] pb-2 border-b border-slate-200">
              Contract Terms &amp; Financial Stakes
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-[#f6f8fb] border border-slate-200 rounded-xl">
                <span className="font-semibold text-slate-500 text-xs">PayPal Authorization Hold:</span>
                <p className="text-xl font-bold font-mono tabular-nums text-[#003087] mt-1">{formattedMoney}</p>
                <p className="text-xs text-slate-500 mt-0.5">Voided on approval · captured on denial</p>
              </div>

              <div className="p-4 bg-[#f6f8fb] border border-slate-200 rounded-xl">
                <span className="font-semibold text-slate-500 text-xs">Beneficiary if Denied:</span>
                <p className="text-sm font-bold text-slate-800 mt-1">{pledge.beneficiary_name}</p>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">{pledge.beneficiary_paypal_email}</p>
              </div>
            </div>

            {/* Evidence summary */}
            {proof?.ai_findings_json && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm space-y-1">
                <p className="font-bold text-[#003087]">Automated Findings for Your Consideration:</p>
                <p className="leading-relaxed text-slate-600">
                  {proof.ai_findings_json.summary || `Challenge-code reading: ${proof.ai_findings_json.code_read || 'not detected'} (${Math.round((proof.ai_findings_json.ocr_confidence || 0) * 100)}% confidence).`}
                </p>
              </div>
            )}

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3" aria-labelledby="aiEvidenceTitle">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 id="aiEvidenceTitle" className="text-sm font-bold text-[#003087]">Private AI evidence details</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">Supporting signals only — your review remains the final authority.</p>
                </div>
                {proofConfidence !== null && (
                  <span className="rounded-full border border-blue-200 bg-white px-2.5 py-1 font-mono text-[11px] font-bold text-[#003087]">
                    Confidence {Math.round(proofConfidence * 100)}%
                  </span>
                )}
              </div>

              {!proof ? (
                <p className="text-xs text-slate-600">No evidence has been submitted yet, so there are no AI signals to review.</p>
              ) : isPhotoProof ? (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Method</span>
                      <span className="mt-1 block font-semibold text-slate-800">{aiFindings?.method?.replaceAll('_', ' ') || 'Awaiting analysis'}</span>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Proof-code OCR</span>
                      <span className="mt-1 block font-mono font-semibold text-slate-800">{aiFindings?.code_read || 'Not confidently read'}</span>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Object model</span>
                      <span className="mt-1 block font-semibold text-slate-800">{aiFindings?.model || 'Not available'}</span>
                    </div>
                  </div>
                  {requiredElements.length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="font-bold text-slate-700">Locked scene elements</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {requiredElements.map((element: string) => {
                          const confidence = Number(elementConfidences[element] || 0);
                          const detected = detectedElements.some((item: string) => item.toLowerCase() === element.toLowerCase()) && confidence >= minimumConfidence;
                          return (
                            <span key={element} className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${detected ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
                              {detected ? '✓' : '!'} {element} · {Math.round(confidence * 100)}%
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {aiFindings?.suspicious_signs?.length > 0 && <p className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-amber-900">Signal to inspect: {aiFindings.suspicious_signs.join(' ')}</p>}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                    <span className="block text-[10px] font-bold uppercase text-slate-400">Quality score</span>
                    <span className="mt-1 block font-mono font-bold text-[#003087]">{typeof aiFindings?.quality_score === 'number' ? `${Math.round(aiFindings.quality_score * 100)}%` : 'Not available'}</span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                    <span className="block text-[10px] font-bold uppercase text-slate-400">Padding signal</span>
                    <span className={`mt-1 block font-bold ${aiFindings?.padding_detected ? 'text-amber-800' : 'text-emerald-700'}`}>{aiFindings?.padding_detected ? 'Review requested' : 'None flagged'}</span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                    <span className="block text-[10px] font-bold uppercase text-slate-400">Analyzer</span>
                    <span className="mt-1 block font-semibold text-slate-800">GitHub activity rules + quality scan</span>
                  </div>
                </div>
              )}
              {aiFindings?.trust_boundary && <p className="text-[10px] leading-relaxed text-slate-500">{aiFindings.trust_boundary}</p>}
            </section>

            {data.proofImageUrl ? (
              <figure className="space-y-2">
                <figcaption className="text-xs font-bold text-slate-700">Submitted evidence photo</figcaption>
                <img
                  src={data.proofImageUrl}
                  alt={`Evidence submitted for ${pledge.title}`}
                  className="w-full max-h-[28rem] object-contain bg-slate-100 border border-slate-200 rounded-xl"
                />
                <p className="text-[11px] text-slate-500">Private evidence visible only to the assigned referee.</p>
              </figure>
            ) : proof?.kind === 'photo' ? (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
                The photo is unavailable right now. Please refresh; if it persists, check the private proof-storage configuration.
              </p>
            ) : null}
          </div>

          {/* Decision Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-[#003087] pb-2 border-b border-slate-200">
              Referee Reasoning &amp; Final Ruling
            </h2>

            <div>
              <label htmlFor="refereeNote" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Written Referee Note (Required) *
              </label>
              <textarea
                id="refereeNote"
                rows={3}
                required
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. I verified the commits directly and confirm substantive code contributions were made on schedule."
                className="w-full px-3.5 py-2.5 bg-[#f6f8fb] border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0070ba]/20 focus:border-[#0070ba] transition-colors"
              />
              <p className="text-xs text-slate-400 mt-1">
                This note will be permanently written to the ledger as part of the FRIEND_DECISION event.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleDecision(true)}
                className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                <span>Approve — Void Hold</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleDecision(false)}
                className="py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                <span>Deny — Capture &amp; Payout</span>
              </button>
            </div>

            <p className="text-xs text-center text-slate-400 font-mono tabular-nums">
              Final Authority · One submission only · Contract closes permanently after this click
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
