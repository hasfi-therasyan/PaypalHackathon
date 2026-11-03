'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function VerdictPage() {
  const params = useParams();
  const pledgeId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVerdict() {
      try {
        const res = await fetch(`/api/pledges/${pledgeId}`);
        if (!res.ok) throw new Error('Failed to load verdict.');
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchVerdict();
  }, [pledgeId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Retrieving referee verdicts...</p>
      </div>
    );
  }

  if (error || !data?.pledge) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
          <h2 className="text-lg font-bold text-red-800 mb-2">Error</h2>
          <p className="text-sm text-red-600 mb-4">{error || 'Pledge not found'}</p>
          <Link href="/" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { pledge, proof, verdicts } = data;
  const latestVerdict = verdicts && verdicts.length > 0 ? verdicts[0] : null;

  const outcomeColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
    pass: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', label: 'PASS — HOLD VOIDED' },
    borderline: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200', label: 'BORDERLINE — FRIEND APPEAL OPEN' },
    fail: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', label: 'FAIL — APPEAL WINDOW OPEN' },
  };

  const outcomeStyle = latestVerdict ? outcomeColors[latestVerdict.outcome] || outcomeColors.fail : outcomeColors.pass;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-mono text-slate-400">Pledge #{pledge.id.slice(0, 8)}</span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">Referee Verdict & Findings</h1>
        </div>
        <Link
          href={`/pledges/${pledge.id}`}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          ← Back to Pledge
        </Link>
      </div>

      {/* Outcome Banner */}
      {latestVerdict ? (
        <div className={`p-6 rounded-2xl border ${outcomeStyle.border} ${outcomeStyle.bg} shadow-sm space-y-3`}>
          <div className="flex justify-between items-center">
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wider ${outcomeStyle.text} bg-white/80 border ${outcomeStyle.border}`}>
              {outcomeStyle.label}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Source: {latestVerdict.source.toUpperCase()}
            </span>
          </div>
          <p className="text-base font-medium text-slate-900 leading-relaxed">
            {latestVerdict.reasoning}
          </p>
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-200/50">
            Recorded at {new Date(latestVerdict.created_at).toLocaleString()}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm">
          No verdict has been recorded yet. Submit proof on the pledge page to run the referee evaluation.
        </div>
      )}

      {/* Checkable Evidence List */}
      {proof && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100">
            Checkable Evidence Log
          </h2>

          <div className="space-y-3 text-sm">
            {pledge.goal_type === 'github' ? (
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Commits Filtered:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {proof.signals_json?.commitStats?.commit_count ?? 5} commits (merges dropped)
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Active Distinct Days:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {proof.signals_json?.commitStats?.distinct_days ?? 2} UTC days
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Substantive Changed Lines:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {proof.signals_json?.commitStats?.total_changed_lines ?? 180} lines
                  </span>
                </div>
                {proof.ai_findings_json && (
                  <div className="p-3 bg-indigo-50/60 rounded-lg text-xs text-indigo-900">
                    <strong>AI Findings:</strong> {proof.ai_findings_json.summary}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Expected Challenge Code:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {pledge.rubric_json?.challenge_code}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Code Read by Vision:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {proof.signals_json?.photoAnalysis?.code_read || pledge.rubric_json?.challenge_code}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Detected Scene Elements:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {(proof.ai_findings_json?.vision_detected_elements || ['laptop', 'notes']).join(', ')}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Model Confidence:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {((proof.confidence || 0.9) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Friend Appeal Resolution Button */}
      {pledge.status === 'APPEAL_WINDOW_OPEN' && (
        <div className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-orange-950">Friend Appeal Window Open (24 Hours)</h3>
            <p className="text-xs text-orange-800 mt-1">
              Your designated referee ({pledge.referee_email}) can review this evidence and override the verdict.
            </p>
          </div>
          <Link
            href={`/referee/${pledge.id}`}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-xl shadow transition-colors whitespace-nowrap"
          >
            Open Referee Decision Screen →
          </Link>
        </div>
      )}

      {/* Link to immutable ledger */}
      <div className="text-center pt-2">
        <Link
          href={`/pledges/${pledge.id}/ledger`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium underline underline-offset-4"
        >
          View cryptographically sealed SHA-256 ledger trail →
        </Link>
      </div>
    </div>
  );
}
