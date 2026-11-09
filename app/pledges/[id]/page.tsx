'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { compressProofImageInBrowser } from '@/app/lib/proofs/compress-client';
import { recognizeChallengeCode, type OcrResult } from '@/app/lib/proofs/ocr-client';
import { useAuth } from '@/app/lib/auth-context';
import { accountRequestHeaders } from '@/app/lib/access';
import { LoadingScreen } from '@/app/components/LoadingScreen';
import { SettlementReceiptCard } from '@/app/components/SettlementReceiptCard';
import { ProofHistoryCard } from '@/app/components/ProofHistoryCard';
import type { OnDeviceVisionFinding } from '@/app/lib/proofs/on-device-vision';

const OnDeviceVisionCheck = dynamic(
  () => import('@/app/components/OnDeviceVisionCheck').then((module) => module.OnDeviceVisionCheck),
  { ssr: false }
);

function Requirement({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-[#f8fafc] border border-slate-200 rounded-xl">
      <span className="block text-[11px] font-semibold text-slate-500">{label}</span>
      <span className="block mt-1 font-bold text-slate-800 break-words">{value}</span>
    </div>
  );
}

export default function PledgeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isReady } = useAuth();
  const pledgeId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Proof inputs
  const [githubRepoInput, setGithubRepoInput] = useState('');
  const [githubAuthorInput, setGithubAuthorInput] = useState('');
  const [photoCodeInput, setPhotoCodeInput] = useState('');
  const [photoElementsInput, setPhotoElementsInput] = useState('laptop, notes');
  const [proofPhoto, setProofPhoto] = useState<File | null>(null);
  const [compressionNote, setCompressionNote] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'reading' | 'complete' | 'unavailable'>('idle');
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [visionFinding, setVisionFinding] = useState<OnDeviceVisionFinding | null>(null);

  useEffect(() => {
    async function fetchPledge() {
      let activeUser = user;
      if (!activeUser && typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('stake_auth_user');
          if (stored) activeUser = JSON.parse(stored);
        } catch (e) {}
      }

      try {
        const res = await fetch(`/api/pledges/${pledgeId}`, {
          headers: accountRequestHeaders(activeUser),
        });
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
  }, [pledgeId, user]);

  async function handleProofSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingProof(true);
    setError(null);

    let activeUser = user;
    if (!activeUser && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('stake_auth_user');
        if (stored) activeUser = JSON.parse(stored);
      } catch (e) {}
    }

    try {
      let body: BodyInit;
      let headers: HeadersInit | undefined;
      if (data.pledge.goal_type === 'github') {
        headers = { 'Content-Type': 'application/json' };
        body = JSON.stringify({ repo: githubRepoInput, username: githubAuthorInput });
      } else {
        if (!proofPhoto) {
          throw new Error('Select a photo to submit as proof.');
        }
        const formData = new FormData();
        formData.append('proof_photo', proofPhoto);
        formData.append('ocr_code', ocrResult?.detectedCode || '');
        formData.append('ocr_confidence', String(ocrResult?.confidence || 0));
        if (visionFinding) {
          formData.append('vision_findings', JSON.stringify(visionFinding));
        }
        body = formData;
      }

      const res = await fetch(`/api/pledges/${pledgeId}/proof`, {
        method: 'POST',
        headers: { ...headers, ...accountRequestHeaders(activeUser) },
        body,
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to submit proof.');

      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setSubmittingProof(false);
    }
  }

  async function handlePhotoSelected(file: File | null) {
    setProofPhoto(file);
    setOcrResult(null);
    setOcrStatus(file ? 'reading' : 'idle');
    setCompressionNote(null);
    setVisionFinding(null);
    if (!file) return;

    setPreparingPhoto(true);
    setError(null);

    try {
      let imageToUpload = file;
      try {
        const compressed = await compressProofImageInBrowser(file);
        imageToUpload = compressed.file;
        setCompressionNote(
          compressed.file.size < compressed.originalBytes
            ? `Compressed: ${(compressed.originalBytes / 1024 / 1024).toFixed(1)} MB → ${(compressed.file.size / 1024 / 1024).toFixed(1)} MB`
            : 'Photo ready for referee review.'
        );
      } catch (cErr) {
        setCompressionNote('Using original image.');
      }

      setProofPhoto(imageToUpload);
      setPreparingPhoto(false);

      Promise.race([
        recognizeChallengeCode(imageToUpload),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
      ])
        .then((ocr) => {
          if (ocr) {
            setOcrResult(ocr);
            setOcrStatus('complete');
          }
        })
        .catch(() => setOcrStatus('unavailable'));
    } catch (err: any) {
      console.warn('Photo processing fallback:', err);
      setPreparingPhoto(false);
    }
  }

  async function handleGraceCancel() {
    if (!confirm('Cancel this pledge within the 15-minute grace window? Your PayPal authorization hold will be voided.')) {
      return;
    }
    setCancelling(true);
    try {
      const res = await fetch(`/api/pledges/${pledgeId}/cancel`, {
        method: 'POST',
        headers: accountRequestHeaders(user),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Grace cancellation failed.');
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-500 text-xs">
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-[#0070ba] animate-spin mx-auto mb-3" />
        Loading commitment contract...
      </div>
    );
  }

  if (error && !data?.pledge) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="p-6 bg-white border border-rose-200 rounded-2xl text-center space-y-3">
          <h2 className="text-base font-bold text-rose-800">Error</h2>
          <p className="text-xs text-rose-600">{error}</p>
          <Link href="/dashboard" className="inline-block px-4 py-2 bg-[#0070ba] text-white rounded-xl text-xs font-bold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { pledge, proof, verdicts } = data;
  const stakeAmount = ((pledge.stake_cents || 0) / 100).toFixed(2);
  return (
    <>
      {/* Full-screen Loading Overlay for Proof Submission */}
      <LoadingScreen
        isOpen={submittingProof}
        title="Evaluating Sprint Proof..."
        subtitle="Uploading evidence, running referee verification checks, and updating the immutable SHA-256 ledger..."
        steps={[
          'Uploading sprint proof evidence securely...',
          'Verifying challenge code & rubric requirements...',
          'Computing AI referee evaluation...',
          'Recording immutable verdict on the ledger chain...',
        ]}
      />

      <div className="max-w-4xl mx-auto py-4 sm:py-6 px-3 sm:px-4 space-y-6 sm:space-y-8 pb-24 md:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-[#e2e8f0]">
          <div>
            <Link href="/dashboard" className="text-xs font-semibold text-[#0070ba] hover:underline mb-1 inline-flex items-center gap-1">
              ← Return to Dashboard
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#003087] tracking-tight">
                {pledge.title}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#0070ba] border border-blue-200">
                {pledge.status}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Link
              href={`/pledges/${pledgeId}/ledger`}
              className="flex-1 sm:flex-initial text-center px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:text-[#0070ba] text-xs font-bold rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5"
            >
              <span>🔍</span>
              <span>Inspect SHA-256 Ledger &amp; Receipts</span>
            </Link>

            {pledge.status === 'ACTIVE' && (
              <button
                onClick={handleGraceCancel}
                disabled={cancelling}
                className="px-3 py-2 bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 text-xs font-bold rounded-xl transition-colors"
              >
                {cancelling ? 'Cancelling...' : 'Grace Cancel (Void)'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Contract & Escrow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Details (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            {/* Rubric Card */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 sm:p-6 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 pb-2 border-b border-slate-100">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Locked Verification Rubric</h2>
                <span className="text-[11px] font-mono text-slate-500 truncate">
                  SHA-256: {pledge.rubric_hash?.slice(0, 16)}...
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {pledge.goal_type === 'github' ? (
                  <>
                    <Requirement label="Repository" value={pledge.rubric_json?.repo || 'Not specified'} />
                    <Requirement label="Contributor" value={pledge.rubric_json?.username || 'Not specified'} />
                    <Requirement label="Minimum commits" value={`${pledge.rubric_json?.min_commits || 0} commits`} />
                    <Requirement label="Work across" value={`${pledge.rubric_json?.min_distinct_days || 1} day(s)`} />
                    <Requirement label="Code changed" value={`${pledge.rubric_json?.min_changed_lines || 0}+ lines`} />
                  </>
                ) : (
                  <>
                    <Requirement label="Challenge code" value={pledge.rubric_json?.challenge_code || 'Issued after commitment is created'} />
                    <Requirement label="Your photo must show" value={(pledge.rubric_json?.required_scene_elements || ['laptop', 'notes']).join(', ')} />
                    <Requirement label="Recognition target" value={`${Math.round((pledge.rubric_json?.min_confidence || 0.7) * 100)}% confidence`} />
                  </>
                )}
              </div>
            </div>

            {/* Authorization Hold Needed Banner (If Rubric Locked) */}
            {pledge.status === 'RUBRIC_LOCKED' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <h2 className="text-sm sm:text-base font-bold text-amber-900">Step 2: PayPal Authorization Hold Required</h2>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Your commitment rubric is locked and hashed into the ledger. To activate the sprint and start submitting proof, authorize the safe PayPal sandbox hold.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Link
                    href={`/pledges/new/checkout/${pledgeId}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#0070ba] hover:bg-[#003087] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <span>Authorize with PayPal Sandbox (${stakeAmount} USD Hold) &rarr;</span>
                  </Link>
                  <Link
                    href={`/pledges/${pledgeId}/approve`}
                    className="text-xs font-semibold text-[#0070ba] hover:underline text-center sm:text-left"
                  >
                    or view PayPal SDK Checkout
                  </Link>
                </div>
              </div>
            )}

            {/* Proof Submission Form (Only when sprint is ACTIVE) */}
            {pledge.status === 'ACTIVE' && (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-[#003087]">Submit Sprint Proof</h2>

                <form onSubmit={handleProofSubmit} className="space-y-4">
                  {pledge.goal_type === 'github' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Repository (owner/repo)</label>
                        <input
                          type="text"
                          value={githubRepoInput}
                          onChange={(e) => setGithubRepoInput(e.target.value)}
                          required
                          className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Author Username</label>
                        <input
                          type="text"
                          value={githubAuthorInput}
                          onChange={(e) => setGithubAuthorInput(e.target.value)}
                          required
                          className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-900"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs">
                      <div className="space-y-1.5">
                        <label htmlFor="proofPhoto" className="font-bold text-slate-700">
                          Evidence Photo
                        </label>
                        <input
                          id="proofPhoto"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          required
                          onChange={(e) => handlePhotoSelected(e.target.files?.[0] || null)}
                          aria-describedby="proofPhotoHint"
                          className="block w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#003087] hover:file:bg-blue-100"
                        />
                        <p id="proofPhotoHint" className="text-[11px] leading-relaxed text-slate-500">
                          JPEG, PNG, or WebP. Your challenge code must be visible in the image.
                        </p>
                        {preparingPhoto && <p className="text-[11px] text-[#0070ba]" aria-live="polite">Preparing photo…</p>}
                        {compressionNote && <p className="text-[11px] text-emerald-700 font-medium" aria-live="polite">✓ {compressionNote}</p>}
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1" aria-live="polite">
                        <p className="font-bold text-slate-700">Challenge-code OCR</p>
                        <p className="font-mono text-xs text-[#003087]">
                          {ocrResult?.detectedCode ? `Detected code: ${ocrResult.detectedCode}` : 'Code reading will run after the photo is prepared.'}
                        </p>
                        <p className="text-[11px] text-slate-500">OCR is one evidence signal; it never settles money by itself.</p>
                      </div>

                      <OnDeviceVisionCheck
                        image={proofPhoto}
                        expectedCode={pledge.rubric_json?.challenge_code || ''}
                        ocrResult={ocrResult}
                        ocrStatus={ocrStatus}
                        onFinding={setVisionFinding}
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingProof || (pledge.goal_type !== 'github' && !proofPhoto)}
                    className="w-full py-4 bg-[#0d7a53] hover:bg-[#085a3c] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    {submittingProof ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>Submitting Proof to Referee…</span>
                      </>
                    ) : (
                      <span>{pledge.goal_type === 'github' ? 'Submit GitHub Proof to Referee' : 'Submit Photo Proof to Referee'} &rarr;</span>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Submitted Proof Evidence History Card */}
            <ProofHistoryCard
              pledge={pledge}
              proof={proof}
              proofImageUrl={data.proofImageUrl}
              verdicts={verdicts}
            />

            {/* Official PayPal Settlement Receipt Card */}
            <SettlementReceiptCard
              pledge={pledge}
              proof={proof}
              verdicts={verdicts}
              proofImageUrl={data.proofImageUrl}
            />
          </div>

          {/* Sidebar Info (1 col) */}
          <div className="space-y-4">
            {/* Financial Card */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 sm:p-6 shadow-xs space-y-3">
              <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider block">
                Authorization Hold
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#003087] font-tabular">
                  ${stakeAmount}
                </span>
                <span className="text-xs font-bold text-[#0070ba]">USD</span>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span>Beneficiary:</span>
                  <strong className="text-slate-900 truncate max-w-[150px]">{pledge.beneficiary_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Referee:</span>
                  <strong className="text-slate-900 font-mono text-[11px] truncate max-w-[140px]" title={pledge.referee_email}>
                    {pledge.referee_email}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Expiration:</span>
                  <span className="font-mono text-slate-700">{new Date(pledge.ends_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span>Status:</span>
                  <span className="font-mono font-bold text-[#0070ba]">{pledge.status}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
              <span className="font-bold text-slate-800 block">Audit Links</span>
              <Link
                href={`/pledges/${pledgeId}/ledger`}
                className="block p-2 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-[#0070ba] transition-colors border border-slate-200/80 font-medium text-slate-700"
              >
                🔐 Cryptographic SHA-256 Ledger
              </Link>
              <Link
                href={`/stats`}
                className="block p-2 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-[#0070ba] transition-colors border border-slate-200/80 font-medium text-slate-700"
              >
                📊 AI Stake Recommender &amp; Stats
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
