'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/lib/auth-context';

export default function RefereeDashboardPage() {
  const { user } = useAuth();
  const [pledges, setPledges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState<{ pledge: any; approved: boolean } | null>(null);
  const [refereeNote, setRefereeNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchPledges = async () => {
    try {
      const res = await fetch('/api/pledges');
      if (res.ok) {
        const data = await res.json();
        setPledges(data.pledges || []);
      }
    } catch (e) {
      console.warn('Error fetching pledges:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPledges();
  }, []);

  // Filter pledges where this referee is assigned or show all pledges requiring appeal/referee review
  const refereeEmail = user?.email || 'referee@example.com';
  const assignedPledges = pledges.filter(
    (p) =>
      p.referee_email?.toLowerCase() === refereeEmail.toLowerCase() ||
      p.status === 'APPEAL_WINDOW_OPEN' ||
      user?.role === 'admin'
  );

  const handleDecisionSubmit = async () => {
    if (!actionModal) return;
    if (!refereeNote.trim()) {
      setStatusMsg('Please provide your referee reasoning note before confirming.');
      return;
    }

    setSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/pledges/${actionModal.pledge.id}/appeal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved: actionModal.approved,
          note: refereeNote,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit referee decision.');
      }

      setStatusMsg(
        `Decision recorded! Pledge marked as ${actionModal.approved ? 'SUCCEEDED (Hold Voided)' : 'CAPTURED (Stake Paid to Beneficiary)'}.`
      );
      setActionModal(null);
      setRefereeNote('');
      fetchPledges();
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Referee Header Banner */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <span>⚖️ Official Friend & Arbiter Panel</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#003087] tracking-tight">
              Referee & Appeal Review Console
            </h1>
            <p className="text-xs text-slate-600 max-w-xl">
              As an appointed referee, you hold the final authority. If the machine learning or automated verification model is uncertain (borderline), you cast the deciding verdict.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <span className="text-slate-500 block">Logged in as Referee:</span>
            <span className="font-mono font-bold text-slate-900">{refereeEmail}</span>
          </div>
        </div>
      </section>

      {statusMsg && (
        <div className="p-4 bg-blue-50 border border-blue-200 text-xs text-[#003087] font-semibold rounded-xl">
          {statusMsg}
        </div>
      )}

      {/* Commitments Assigned to This Referee */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Assigned Commitment Reviews</h2>
            <p className="text-xs text-slate-500">
              Review evidence submitted by creators who designated you as their trusted referee.
            </p>
          </div>
          <span className="px-2.5 py-1 bg-blue-50 text-[#0070ba] font-bold text-xs rounded-full border border-blue-200">
            {assignedPledges.length} Commitments Assigned
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#0070ba] mb-3" />
            <p className="text-sm font-semibold">Loading assigned referee commitments...</p>
          </div>
        ) : assignedPledges.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-600 space-y-3">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-700 font-bold text-xl rounded-full flex items-center justify-center mx-auto">
              ⚖️
            </div>
            <h3 className="text-base font-bold text-slate-900">No pending referee appeals</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              When a user adds your email (<code className="font-mono">{refereeEmail}</code>) as referee or a sprint enters appeal review, it will show up here immediately.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {assignedPledges.map((p) => {
              const stakeUsd = ((p.stake_cents || 0) / 100).toFixed(2);
              const needsDecision = p.status === 'APPEAL_WINDOW_OPEN';

              return (
                <div
                  key={p.id}
                  className={`bg-white border rounded-xl p-5 shadow-xs transition-all ${
                    needsDecision ? 'border-orange-300 ring-1 ring-orange-200' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {needsDecision ? (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200 animate-pulse">
                            ⚠️ Action Required: Appeal Awaiting Referee Verdict
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            Status: {p.status}
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                          {p.goal_type === 'github' ? '💻 GitHub Activity' : '📸 Photo Evidence'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">
                        <Link href={`/pledges/${p.id}`} className="hover:text-[#0070ba]">
                          {p.title}
                        </Link>
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <div>
                          <span>Creator/User: </span>
                          <strong className="text-slate-700">{p.user_id}</strong>
                        </div>
                        <div>
                          <span>Beneficiary: </span>
                          <strong className="text-slate-700">{p.beneficiary_name}</strong>
                        </div>
                        <div>
                          <span>Pledge Stake: </span>
                          <strong className="text-[#003087] font-mono">${stakeUsd} USD</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/pledges/${p.id}`}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                      >
                        Inspect Ledger & Proof
                      </Link>

                      {needsDecision && (
                        <>
                          <button
                            onClick={() => setActionModal({ pledge: p, approved: true })}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
                          >
                            ✓ Pass & Release Hold
                          </button>
                          <button
                            onClick={() => setActionModal({ pledge: p, approved: false })}
                            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
                          >
                            ✕ Deny & Capture
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Confirmation Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4 text-slate-800">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-[#003087]">
                {actionModal.approved ? 'Pass Commitment (Release Hold)' : 'Deny Appeal (Capture Hold)'}
              </h3>
              <button
                onClick={() => setActionModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              You are rendering the final arbiter verdict for{' '}
              <strong className="text-slate-900">{actionModal.pledge.title}</strong>. This decision will be permanently appended to the SHA-256 tamper-evident ledger and trigger PayPal settlement.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Referee Justification Note (Mandatory):
              </label>
              <textarea
                value={refereeNote}
                onChange={(e) => setRefereeNote(e.target.value)}
                placeholder="Explain why you approved or denied this goal based on submitted proof..."
                rows={3}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-hidden focus:border-[#0070ba]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDecisionSubmit}
                disabled={submitting}
                className={`px-4 py-2 text-white font-bold text-xs rounded-xl shadow-xs transition-colors ${
                  actionModal.approved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submitting ? 'Submitting...' : 'Confirm Referee Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

