'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PledgeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pledgeId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Proof input states
  const [githubRepoInput, setGithubRepoInput] = useState('');
  const [githubAuthorInput, setGithubAuthorInput] = useState('');
  const [photoCodeInput, setPhotoCodeInput] = useState('');
  const [photoElementsInput, setPhotoElementsInput] = useState('laptop, notes');

  useEffect(() => {
    async function fetchPledge() {
      try {
        const res = await fetch(`/api/pledges/${pledgeId}`);
        if (!res.ok) throw new Error('Failed to load pledge.');
        const json = await res.json();
        setData(json);

        if (json.pledge) {
          setGithubRepoInput(json.pledge.rubric_json?.repo || '');
          setGithubAuthorInput(json.pledge.rubric_json?.username || '');
          setPhotoCodeInput(json.pledge.rubric_json?.challenge_code || '');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPledge();
  }, [pledgeId]);

  async function handleProofSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingProof(true);
    setError(null);

    try {
      const payload: any = {};
      if (data.pledge.goal_type === 'github') {
        payload.repo = githubRepoInput;
        payload.username = githubAuthorInput;
      } else {
        payload.code_read = photoCodeInput;
        payload.scene_elements = photoElementsInput.split(',').map((s) => s.trim()).filter(Boolean);
      }

      const res = await fetch(`/api/pledges/${pledgeId}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Failed to submit proof.');

      router.push(`/pledges/${pledgeId}/verdict`);
    } catch (err: any) {
      setError(err.message);
      setSubmittingProof(false);
    }
  }

  async function handleGraceCancel() {
    if (!confirm('Cancel this sprint under the 5-minute grace period? The PayPal authorization hold will be voided.')) {
      return;
    }
    setCancelling(true);
    setError(null);

    try {
      const res = await fetch(`/api/pledges/${pledgeId}/cancel`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Cancellation failed.');

      const refreshRes = await fetch(`/api/pledges/${pledgeId}`);
      setData(await refreshRes.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  }

  function handleCopyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading sprint command console...</p>
      </div>
    );
  }

  if (error && !data?.pledge) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <h2 className="text-base font-bold text-rose-800">Error</h2>
          <p className="text-xs text-rose-600">{error}</p>
          <Link href="/" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { pledge, proof, verdicts, ledger } = data;
  const formattedStake = `${(pledge.stake_cents / 100).toFixed(2)} USD (sandbox)`;

  const startsAtTime = new Date(pledge.starts_at).getTime();
  const now = Date.now();
  const canCancel = pledge.status === 'ACTIVE' && now - startsAtTime < 5 * 60 * 1000;

  const statusConfig: Record<string, { label: string; badge: string; dot: string }> = {
    RUBRIC_LOCKED: { label: 'Rubric Locked', badge: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
    ACTIVE: { label: 'Hold Active', badge: 'bg-indigo-50 text-indigo-800 border-indigo-200', dot: 'bg-indigo-600 animate-pulse' },
    APPEAL_WINDOW_OPEN: { label: 'Appeal Window Open', badge: 'bg-orange-50 text-orange-800 border-orange-200', dot: 'bg-orange-500 animate-pulse' },
    SUCCEEDED: { label: 'Succeeded (Voided)', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
    CAPTURED: { label: 'Hold Captured', badge: 'bg-rose-50 text-rose-800 border-rose-200', dot: 'bg-rose-500' },
    PAID_OUT: { label: 'Paid Out to Beneficiary', badge: 'bg-slate-100 text-slate-800 border-slate-300', dot: 'bg-slate-500' },
    CANCELLED: { label: 'Grace Cancelled', badge: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  };

  const statusCfg = statusConfig[pledge.status] || {
    label: pledge.status,
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header with Navigation & Live Badges */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 text-xs font-bold rounded-full border ${statusCfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
            <span className="text-xs text-slate-400 font-mono">Pledge #{pledge.id.slice(0, 8)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{pledge.title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/pledges/${pledge.id}/ledger`}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>📜 Audit Ledger</span>
            {ledger?.valid ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse" />
            )}
          </Link>

          {verdicts && verdicts.length > 0 && (
            <Link
              href={`/pledges/${pledge.id}/verdict`}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              View Verdict →
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
          <strong>Notice:</strong> {error}
        </div>
      )}

      {/* Contract Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PayPal Hold Amount</span>
          <p className="text-2xl font-extrabold text-indigo-700 mt-1">{formattedStake}</p>
          <p className="text-xs text-slate-400 mt-1 font-mono">Authorization Escrow</p>
        </div>

        <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sprint Honor Period</span>
          <p className="text-sm font-bold text-slate-900 mt-2">
            {new Date(pledge.ends_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-slate-400 mt-1">48-hour maximum honor window</p>
        </div>

        <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Beneficiary Counterparty</span>
          <p className="text-sm font-bold text-slate-900 mt-2 truncate">{pledge.beneficiary_name}</p>
          <p className="text-xs text-slate-400 mt-1 truncate">{pledge.beneficiary_paypal_email}</p>
        </div>
      </div>

      {/* Issued Challenge Code Card (if photo goal) */}
      {pledge.goal_type === 'photo' && (
        <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900">
              <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Cryptographic Challenge Code
            </div>
            <p className="text-2xl font-mono font-extrabold text-amber-950">
              {pledge.rubric_json?.challenge_code || 'falcon-cedar-42'}
            </p>
            <p className="text-xs text-amber-800">
              Write this code on paper and include it in your physical activity photograph.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleCopyCode(pledge.rubric_json?.challenge_code || 'falcon-cedar-42')}
            className="px-3.5 py-2 bg-white hover:bg-amber-100/50 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>{copiedCode ? '✓ Copied' : '📋 Copy Code'}</span>
          </button>
        </div>
      )}

      {/* Proof Submission Console (if ACTIVE) */}
      {pledge.status === 'ACTIVE' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Submit Verification Proof</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated rules run first; structured findings second; friend referee has final say.
            </p>
          </div>

          <form onSubmit={handleProofSubmit} className="space-y-4">
            {pledge.goal_type === 'github' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="repoInput" className="block text-xs font-semibold text-slate-700 mb-1">
                    GitHub Repo (owner/repo)
                  </label>
                  <input
                    id="repoInput"
                    type="text"
                    required
                    value={githubRepoInput}
                    onChange={(e) => setGithubRepoInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="authorInput" className="block text-xs font-semibold text-slate-700 mb-1">
                    Commit Author Username
                  </label>
                  <input
                    id="authorInput"
                    type="text"
                    required
                    value={githubAuthorInput}
                    onChange={(e) => setGithubAuthorInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="codeReadInput" className="block text-xs font-semibold text-slate-700 mb-1">
                    Challenge Code Read from Photo
                  </label>
                  <input
                    id="codeReadInput"
                    type="text"
                    required
                    value={photoCodeInput}
                    onChange={(e) => setPhotoCodeInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="elementsReadInput" className="block text-xs font-semibold text-slate-700 mb-1">
                    Detected Scene Elements
                  </label>
                  <input
                    id="elementsReadInput"
                    type="text"
                    required
                    value={photoElementsInput}
                    onChange={(e) => setPhotoElementsInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submittingProof}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submittingProof ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Computing Signals & AI Verification...</span>
                </>
              ) : (
                <span>Submit Proof & Trigger Referee Verdict →</span>
              )}
            </button>
          </form>

          {/* 5-minute Grace Cancellation Action */}
          {canCancel && (
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-slate-500">
              <span>Mistyped your commitment stake? Cancel within 5 minutes of activation:</span>
              <button
                type="button"
                onClick={handleGraceCancel}
                disabled={cancelling}
                className="px-3 py-1.5 text-xs font-bold text-rose-700 hover:text-rose-800 border border-rose-200 bg-rose-50 rounded-lg transition-colors"
              >
                {cancelling ? 'Cancelling...' : '5-Min Grace Cancel'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Referee Appeal Console Link Banner */}
      <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Friend Referee Authority</p>
          <p className="text-xs text-slate-500">
            Designated referee: <strong className="text-slate-700">{pledge.referee_email}</strong> (24h appeal override)
          </p>
        </div>
        <Link
          href={`/referee/${pledge.id}`}
          className="px-4 py-2 bg-white border border-slate-200 hover:border-indigo-400 text-slate-800 hover:text-indigo-600 text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          Open Friend Referee Review Screen →
        </Link>
      </div>
    </div>
  );
}
