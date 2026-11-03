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
        if (!res.ok) throw new Error('Invalid or expired referee link.');
        const json = await res.json();
        setData(json);

        // Check if friend decision was already recorded or pledge is settled
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
      setError('Please provide a mandatory note explaining your referee decision.');
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
      <div className="max-w-3xl mx-auto py-16 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading referee evaluation console...</p>
      </div>
    );
  }

  if (error && !data?.pledge) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
          <h2 className="text-lg font-bold text-red-800 mb-2">Referee Link Expired</h2>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <Link href="/" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold">
            Return to Stake Home
          </Link>
        </div>
      </div>
    );
  }

  const { pledge, proof, verdicts } = data;
  const formattedMoney = `${(pledge.stake_cents / 100).toFixed(2)} USD (sandbox)`;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="text-center pb-4 border-b border-slate-200">
        <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full uppercase tracking-wider">
          Friend Referee Authority
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
          Final Decision: Referee Review
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          You are the chosen referee for <strong>{pledge.title}</strong>. Your single decision overrides all automated findings.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <strong>Notice:</strong> {error}
        </div>
      )}

      {alreadyDecided ? (
        <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</span>
          <h2 className="text-xl font-bold text-slate-900">
            Decision Finalized (Status: {pledge.status})
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            This appeal has already been resolved or the 24-hour window has ended. The decision is permanent and cryptographically recorded in the ledger.
          </p>
          <Link
            href={`/pledges/${pledge.id}/verdict`}
            className="inline-block mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold shadow hover:bg-indigo-700"
          >
            View Official Verdict →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pledge & Evidence Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Contract Terms & Evidence
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium">Hold at Risk:</span>
                <p className="text-base font-bold text-indigo-600 mt-1">{formattedMoney}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 font-medium">Beneficiary if Denied:</span>
                <p className="text-sm font-bold text-slate-800 mt-1">{pledge.beneficiary_name} ({pledge.beneficiary_paypal_email})</p>
              </div>
            </div>

            {/* AI Findings Summary */}
            {proof?.ai_findings_json && (
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-900 space-y-1">
                <p className="font-bold">Automated Referee Findings:</p>
                <p>{proof.ai_findings_json.summary || JSON.stringify(proof.ai_findings_json)}</p>
              </div>
            )}
          </div>

          {/* Decision Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Your Written Reasoning & Verdict
            </h2>

            <div>
              <label htmlFor="refereeNote" className="block text-xs font-semibold text-slate-700 mb-1">
                Referee Note (Mandatory explanation required by rubric) *
              </label>
              <textarea
                id="refereeNote"
                rows={3}
                required
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. I inspected the commits and can confirm the work was authentic and substantive despite the formatting changes."
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleDecision(true)}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>✓ Approve Pledge (Void Hold)</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleDecision(false)}
                className="py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>✗ Deny & Forfeit (Capture & Payout)</span>
              </button>
            </div>
            <p className="text-xs text-center text-slate-400">
              One decision only. Submitting seals the contract and renders this referee link permanently inactive.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
