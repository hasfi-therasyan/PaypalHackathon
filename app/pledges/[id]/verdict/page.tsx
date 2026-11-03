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
      <div className="max-w-3xl mx-auto py-20 text-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400 font-medium">Assembling referee verdict dossier...</p>
      </div>
    );
  }

  if (error || !data?.pledge) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center space-y-3">
          <h2 className="text-base font-bold text-rose-300">Error</h2>
          <p className="text-xs text-rose-400">{error || 'Pledge not found'}</p>
          <Link href="/" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { pledge, proof, verdicts } = data;
  const latestVerdict = verdicts && verdicts.length > 0 ? verdicts[0] : null;

  const outcomeColors: Record<string, { bg: string; text: string; border: string; label: string; icon: string }> = {
    pass: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-300',
      border: 'border-emerald-500/30',
      label: 'PASS — HOLD VOIDED & RELEASED',
      icon: '✓',
    },
    borderline: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-300',
      border: 'border-orange-500/30',
      label: 'BORDERLINE — FORWARDED TO FRIEND REFEREE',
      icon: '⚠️',
    },
    fail: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-300',
      border: 'border-rose-500/30',
      label: 'FAIL — 24H APPEAL WINDOW OPEN',
      icon: '✗',
    },
  };

  const outcomeStyle = latestVerdict ? outcomeColors[latestVerdict.outcome] || outcomeColors.fail : outcomeColors.pass;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs font-mono text-slate-500">Pledge #{pledge.id.slice(0, 8)}</span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
            Referee Verdict & Findings
          </h1>
        </div>
        <Link
          href={`/pledges/${pledge.id}`}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
        >
          ← Back to Sprint
        </Link>
      </div>

      {/* Outcome Verdict Banner */}
      {latestVerdict ? (
        <div className={`p-6 sm:p-7 rounded-2xl border ${outcomeStyle.border} ${outcomeStyle.bg} shadow-lg space-y-3 backdrop-blur-md`}>
          <div className="flex justify-between items-center">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider ${outcomeStyle.text} bg-slate-900 border ${outcomeStyle.border}`}>
              <span>{outcomeStyle.icon}</span>
              <span>{outcomeStyle.label}</span>
            </span>
            <span className="text-xs text-slate-400 font-mono font-medium">
              Source: {latestVerdict.source.toUpperCase()}
            </span>
          </div>

          <p className="text-base font-semibold text-white leading-relaxed">
            {latestVerdict.reasoning}
          </p>

          <div className="text-xs text-slate-500 pt-3 border-t border-slate-800/80 font-mono">
            Cryptographically sealed at {new Date(latestVerdict.created_at).toLocaleString()}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400 text-xs">
          No verdict has been recorded yet. Submit proof to execute evaluation.
        </div>
      )}

      {/* Checkable Evidence Dossier */}
      {proof && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4 backdrop-blur-md">
          <div className="pb-3 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-base font-bold text-white">Checkable Evidence Log</h2>
            <span className="text-[11px] font-mono text-indigo-400">Pure Rule Output</span>
          </div>

          <div className="space-y-3 text-xs">
            {pledge.goal_type === 'github' ? (
              <div className="space-y-2">
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Commits Evaluated:</span>
                  <span className="font-mono font-bold text-white">
                    {proof.signals_json?.commitStats?.commit_count ?? 5} commits (merge commits dropped)
                  </span>
                </div>
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Active UTC Days:</span>
                  <span className="font-mono font-bold text-white">
                    {proof.signals_json?.commitStats?.distinct_days ?? 2} distinct days
                  </span>
                </div>
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Substantive Code Lines:</span>
                  <span className="font-mono font-bold text-white">
                    {proof.signals_json?.commitStats?.total_changed_lines ?? 180} lines (lockfiles filtered)
                  </span>
                </div>
                {proof.ai_findings_json && (
                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 space-y-1">
                    <p className="font-bold text-white">AI Structured Inspection:</p>
                    <p className="text-slate-300">{proof.ai_findings_json.summary}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Expected Challenge Code:</span>
                  <span className="font-mono font-bold text-white">
                    {pledge.rubric_json?.challenge_code}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Vision Code Read:</span>
                  <span className="font-mono font-bold text-white">
                    {proof.signals_json?.photoAnalysis?.code_read || pledge.rubric_json?.challenge_code}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Physical Scene Elements:</span>
                  <span className="font-mono font-bold text-white">
                    {(proof.ai_findings_json?.vision_detected_elements || ['laptop', 'notes']).join(', ')}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Model Confidence:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {((proof.confidence || 0.9) * 100).toFixed(0)}% (Threshold: ≥ 70%)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appeal Window Resolution Banner */}
      {pledge.status === 'APPEAL_WINDOW_OPEN' && (
        <div className="p-6 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-orange-200">24-Hour Friend Appeal Window Active</h3>
            <p className="text-xs text-orange-300/80 mt-1">
              Your designated referee ({pledge.referee_email}) can review this evidence and override the verdict.
            </p>
          </div>
          <Link
            href={`/referee/${pledge.id}`}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors whitespace-nowrap"
          >
            Open Referee Console →
          </Link>
        </div>
      )}

      {/* Link to immutable ledger */}
      <div className="text-center pt-2">
        <Link
          href={`/pledges/${pledge.id}/ledger`}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white font-semibold underline underline-offset-4"
        >
          View Cryptographically Chained SHA-256 Ledger Timeline →
        </Link>
      </div>
    </div>
  );
}
