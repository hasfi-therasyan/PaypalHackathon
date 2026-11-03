'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RefereeAppealPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyDecided, setAlreadyDecided] = useState(false);

  useEffect(() => {
    async function fetchAppealData() {
      try {
        const res = await fetch(`/api/pledges/${token}`);
        if (!res.ok) throw new Error('Invalid or expired referee token.');
        const json = await res.json();
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
    fetchAppealData();
  }, [token]);

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
        headers: { 'Content-Type': 'application/json' },
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
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">Verifying friend referee token...</p>
      </div>
    );
  }

  if (error && !data?.pledge) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <h2 className="text-base font-bold text-rose-800">Token Inactive or Expired</h2>
          <p className="text-xs text-rose-600">{error}</p>
          <Link href="/" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { pledge, proof } = data;
  const formattedMoney = `${(pledge.stake_cents / 100).toFixed(2)} USD (sandbox)`;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Tribunal Header */}
      <div className="text-center space-y-2 pb-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold rounded-full uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-purple-600" />
          Friend Referee Appeal Tribunal
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Review & Final Verdict
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          You are the nominated referee for <strong>{pledge.title}</strong>. Your single decision overrides all automated findings.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
          <strong>Notice:</strong> {error}
        </div>
      )}

      {alreadyDecided ? (
        <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Decision Finalized (Status: {pledge.status})
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            This sprint appeal has been finalized and sealed in the SHA-256 ledger. This referee link is now permanently closed.
          </p>
          <Link
            href={`/pledges/${pledge.id}/verdict`}
            className="inline-block px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            Inspect Official Verdict →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Contract Terms Summary */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Contract Terms & Financial Stakes
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl">
                <span className="font-semibold text-slate-500">PayPal Authorization Hold:</span>
                <p className="text-xl font-extrabold text-indigo-700 mt-1">{formattedMoney}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Voided on approval; captured on denial</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl">
                <span className="font-semibold text-slate-500">Beneficiary if Denied:</span>
                <p className="text-sm font-bold text-slate-800 mt-1">{pledge.beneficiary_name}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{pledge.beneficiary_paypal_email}</p>
              </div>
            </div>

            {/* Evidence summary */}
            {proof?.ai_findings_json && (
              <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-950 space-y-1">
                <p className="font-bold">Automated Findings for Your Consideration:</p>
                <p className="leading-relaxed">{proof.ai_findings_json.summary}</p>
              </div>
            )}
          </div>

          {/* Form Decision */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Referee Reasoning & Final Ruling
            </h2>

            <div>
              <label htmlFor="refereeNote" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Written Referee Note (Mandatory) *
              </label>
              <textarea
                id="refereeNote"
                rows={3}
                required
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. I verified the commits directly and confirm substantive code contributions were made on schedule."
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                This note will be permanently written to the ledger as part of the FRIEND_DECISION event.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleDecision(true)}
                className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>✓ Approve Pledge (Void Hold)</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleDecision(false)}
                className="py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>✗ Deny & Forfeit (Capture Hold & Payout)</span>
              </button>
            </div>

            <p className="text-[11px] text-center text-slate-400 font-mono">
              Final Authority: One submission only. The contract closes permanently after this click.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
