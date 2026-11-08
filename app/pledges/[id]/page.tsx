'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { compressProofImageInBrowser } from '@/app/lib/proofs/compress-client';
import { recognizeChallengeCode, type OcrResult } from '@/app/lib/proofs/ocr-client';

export default function PledgeDetailPage() {
  const params = useParams();
  const router = useRouter();
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
  const [preparingPhoto, setPreparingPhoto] = useState(false);

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
        body = formData;
      }

      const res = await fetch(`/api/pledges/${pledgeId}/proof`, {
        method: 'POST',
        headers,
        body,
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to submit proof.');

      router.push(`/pledges/${pledgeId}/verdict`);
    } catch (err: any) {
      setError(err.message);
      setSubmittingProof(false);
    }
  }

  async function handlePhotoSelected(file: File | null) {
    setProofPhoto(null);
    setOcrResult(null);
    setCompressionNote(null);
    if (!file) return;
    setPreparingPhoto(true);
    setError(null);
    try {
      const compressed = await compressProofImageInBrowser(file);
      setProofPhoto(compressed.file);
      setCompressionNote(
        compressed.file.size < compressed.originalBytes
          ? `Compressed before upload: ${(compressed.originalBytes / 1024 / 1024).toFixed(1)} MB → ${(compressed.file.size / 1024 / 1024).toFixed(1)} MB.`
          : 'Photo is already optimized; sending a normalized JPEG.'
      );
      setOcrResult(await recognizeChallengeCode(compressed.file));
    } catch (err: any) {
      setError(err.message || 'Unable to prepare photo proof. Choose another image and try again.');
    } finally {
      setPreparingPhoto(false);
    }
  }

  async function handleGraceCancel() {
    if (!confirm('Cancel this pledge within the 15-minute grace window? Your PayPal authorization hold will be voided.')) {
      return;
    }
    setCancelling(true);
    try {
      const res = await fetch(`/api/pledges/${pledgeId}/cancel`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Grace cancellation failed.');
      }
      router.push('/');
    } catch (err: any) {
      setError(err.message);
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-500 text-xs">
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
          <Link href="/" className="inline-block px-4 py-2 bg-[#0070ba] text-white rounded-xl text-xs font-bold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { pledge, proof, verdicts } = data;
  const stakeAmount = ((pledge.stake_cents || 0) / 100).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-[#e2e8f0]">
        <div>
          <Link href="/" className="text-xs font-semibold text-[#0070ba] hover:underline mb-1 inline-block">
            ← Return to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#003087] tracking-tight">
              {pledge.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#0070ba] border border-blue-200">
              {pledge.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/pledges/${pledgeId}/ledger`}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-[#0070ba] text-xs font-bold rounded-xl transition-colors shadow-2xs"
          >
            Inspect SHA-256 Ledger
          </Link>

          {pledge.status === 'ACTIVE' && (
            <button
              onClick={handleGraceCancel}
              disabled={cancelling}
              className="px-3 py-1.5 bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 text-xs font-bold rounded-xl transition-colors"
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
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Locked Verification Rubric</h2>
              <span className="text-[11px] font-mono text-slate-500">
                SHA-256: {pledge.rubric_hash?.slice(0, 12)}...
              </span>
            </div>

            <pre className="p-4 bg-[#f8fafc] border border-slate-200 rounded-xl font-mono text-xs text-slate-800 overflow-x-auto">
              {JSON.stringify(pledge.rubric_json, null, 2)}
            </pre>
          </div>

          {/* Proof Submission Card (If Active) */}
          {pledge.status === 'ACTIVE' && (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-[#003087]">Submit Sprint Proof</h2>

              <form onSubmit={handleProofSubmit} className="space-y-4">
                {pledge.goal_type === 'github' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
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
                        className="block w-full rounded-xl border border-slate-300 bg-white p-2 text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#003087] hover:file:bg-blue-100"
                      />
                      <p id="proofPhotoHint" className="text-[11px] leading-relaxed text-slate-500">
                        JPEG, PNG, or WebP up to 10 MB. The browser compresses the image before upload; the server validates and normalizes it again before private Storage upload.
                      </p>
                      {preparingPhoto && <p className="text-[11px] text-[#0070ba]" aria-live="polite">Compressing photo and reading the challenge code locally…</p>}
                      {compressionNote && <p className="text-[11px] text-emerald-700" aria-live="polite">{compressionNote}</p>}
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1" aria-live="polite">
                      <p className="font-bold text-slate-700">On-device OCR result</p>
                      <p className="font-mono text-[#003087]">{ocrResult?.detectedCode || (preparingPhoto ? 'Reading code…' : 'No challenge code found yet')}</p>
                      <p className="text-[11px] text-slate-500">OCR is a free pre-check. Your nominated referee makes the final photo-proof decision.</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingProof || preparingPhoto || !proofPhoto}
                  className="w-full py-3 bg-[#0d7a53] hover:bg-[#085a3c] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  {submittingProof ? 'Uploading proof for referee review...' : 'Submit Photo Proof to Referee'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar Info (1 col) */}
        <div className="space-y-4">
          {/* Financial Card */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs space-y-3">
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
                <strong className="text-slate-900">{pledge.beneficiary_name}</strong>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
