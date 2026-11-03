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
    if (!confirm('Are you sure you want to cancel this pledge within the 5-minute grace period? The PayPal hold will be voided.')) {
      return;
    }
    setCancelling(true);
    setError(null);

    try {
      const res = await fetch(`/api/pledges/${pledgeId}/cancel`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Cancellation failed.');

      // Refresh
      const refreshRes = await fetch(`/api/pledges/${pledgeId}`);
      setData(await refreshRes.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading pledge dashboard...</p>
      </div>
    );
  }

  if (error && !data?.pledge) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
          <h2 className="text-lg font-bold text-red-800 mb-2">Error</h2>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <Link href="/" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { pledge, proof, verdicts, ledger } = data;
  const formattedStake = `${(pledge.stake_cents / 100).toFixed(2)} USD (sandbox)`;

  // Calculate 5-minute grace cancellation eligibility
  const startsAtTime = new Date(pledge.starts_at).getTime();
  const now = Date.now();
  const canCancel = pledge.status === 'ACTIVE' && now - startsAtTime < 5 * 60 * 1000;

  const statusColors: Record<string, string> = {
    RUBRIC_LOCKED: 'bg-amber-100 text-amber-800 border-amber-200',
    ACTIVE: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    APPEAL_WINDOW_OPEN: 'bg-orange-100 text-orange-800 border-orange-200',
    SUCCEEDED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    CAPTURED: 'bg-rose-100 text-rose-800 border-rose-200',
    PAID_OUT: 'bg-slate-200 text-slate-800 border-slate-300',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${statusColors[pledge.status] || 'bg-slate-100'}`}>
              {pledge.status}
            </span>
            <span className="text-xs text-slate-500 font-mono">Pledge #{pledge.id.slice(0, 8)}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">{pledge.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/pledges/${pledge.id}/ledger`}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <span>📜 Audit Ledger</span>
            {ledger?.valid ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            )}
          </Link>

          {verdicts && verdicts.length > 0 && (
            <Link
              href={`/pledges/${pledge.id}/verdict`}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              View Verdict Details →
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <strong>Notice:</strong> {error}
        </div>
      )}

      {/* Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase">Hold Amount</span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{formattedStake}</p>
          <p className="text-xs text-slate-400 mt-1">PayPal sandbox hold</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase">Sprint Deadline</span>
          <p className="text-sm font-bold text-slate-900 mt-2">
            {new Date(pledge.ends_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-slate-400 mt-1">48-hour max honor period</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase">Friend Referee</span>
          <p className="text-sm font-bold text-slate-900 mt-2 truncate">{pledge.referee_email}</p>
          <p className="text-xs text-slate-400 mt-1">24h appeal override authority</p>
        </div>
      </div>

      {/* Active Challenge Code Card (if photo goal) */}
      {pledge.goal_type === 'photo' && (
        <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Issued Challenge Code
            </div>
            <p className="text-2xl font-mono font-extrabold text-amber-950 mt-1">
              {pledge.rubric_json?.challenge_code || 'falcon-cedar-42'}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Write this code clearly on paper next to your workspace/activity proof.
            </p>
          </div>
          <span className="px-3 py-1 bg-white/80 border border-amber-200 rounded-lg font-mono text-xs text-amber-900 font-semibold">
            Levenshtein ≤ 1 allowed
          </span>
        </div>
      )}

      {/* Proof Submission Section (if ACTIVE) */}
      {pledge.status === 'ACTIVE' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">Submit Verification Proof</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluate against the locked rubric with two verifiable referee signals.
            </p>
          </div>

          <form onSubmit={handleProofSubmit} className="space-y-4">
            {pledge.goal_type === 'github' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="repoInput" className="block text-xs font-semibold text-slate-700 mb-1">
                    GitHub Repo
                  </label>
                  <input
                    id="repoInput"
                    type="text"
                    required
                    value={githubRepoInput}
                    onChange={(e) => setGithubRepoInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="authorInput" className="block text-xs font-semibold text-slate-700 mb-1">
                    Author Username
                  </label>
                  <input
                    id="authorInput"
                    type="text"
                    required
                    value={githubAuthorInput}
                    onChange={(e) => setGithubAuthorInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="codeReadInput" className="block text-xs font-semibold text-slate-700 mb-1">
                    Challenge Code Read
                  </label>
                  <input
                    id="codeReadInput"
                    type="text"
                    required
                    value={photoCodeInput}
                    onChange={(e) => setPhotoCodeInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submittingProof}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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

          {/* 5-minute Grace Cancellation */}
          {canCancel && (
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span>Mistyped your stake? Cancel within 5 minutes of activation:</span>
              <button
                type="button"
                onClick={handleGraceCancel}
                disabled={cancelling}
                className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
              >
                {cancelling ? 'Cancelling...' : '5-Min Grace Cancel'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Direct Friend Appeal / Referee Link Card (for testing & verification) */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <p className="text-xs font-bold text-slate-700 uppercase">Friend Referee Magic Link</p>
          <p className="text-xs text-slate-500">
            For demonstration and appeal resolution, use the direct referee token link:
          </p>
        </div>
        <Link
          href={`/referee/${pledge.id}`}
          className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:border-indigo-500 text-xs font-semibold rounded-lg shadow-sm"
        >
          Open Friend Referee Review Screen →
        </Link>
      </div>
    </div>
  );
}
