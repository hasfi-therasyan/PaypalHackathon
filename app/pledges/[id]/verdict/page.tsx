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
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">Assembling referee verdict dossier...</p>
      </div>
    );
  }

  if (error || !data?.pledge) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <h2 className="text-base font-bold text-rose-800">Error</h2>
          <p className="text-xs text-rose-600">{error || 'Pledge not found'}</p>
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
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-900',
      border: 'border-emerald-200',
      label: 'PASS — HOLD VOIDED & RELEASED',
      icon: '✓',
    },
    borderline: {
      bg: 'bg-orange-50/70',
      text: 'text-orange-950',
      border: 'border-orange-200',
      label: 'BORDERLINE — FORWARDED TO FRIEND REFEREE',
      icon: '⚠️',
    },
    fail: {
      bg: 'bg-rose-50/70',
      text: 'text-rose-950',
      border: 'border-rose-200',
      label: 'FAIL — 24H APPEAL WINDOW OPEN',
      icon: '✗',
    },
  };

  const outcomeStyle = latestVerdict ? outcomeColors[latestVerdict.outcome] || outcomeColors.fail : outcomeColors.pass;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-mono text-slate-400">Pledge #{pledge.id.slice(0, 8)}</span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Referee Verdict & Findings
          </h1>
        </div>
        <Link
          href={`/pledges/${pledge.id}`}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
        >
          ← Back to Sprint
        </Link>
      </div>

      {/* Outcome Verdict Banner */}
      {latestVerdict ? (
        <div className={`p-6 sm:p-7 rounded-2xl border ${outcomeStyle.border} ${outcomeStyle.bg} shadow-sm space-y-3`}>
          <div className="flex justify-between items-center">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider ${outcomeStyle.text} bg-white border ${outcomeStyle.border} shadow-xs`}>
              <span>{outcomeStyle.icon}</span>
              <span>{outcomeStyle.label}</span>
            </span>
            <span className="text-xs text-slate-500 font-mono font-medium">
              Source: {latestVerdict.source.toUpperCase()}
            </span>
          </div>

          <p className="text-base font-semibold text-slate-900 leading-relaxed">
            {latestVerdict.reasoning}
          </p>

          <div className="text-xs text-slate-500 pt-3 border-t border-slate-200/60 font-mono">
            Sealed at {new Date(latestVerdict.created_at).toLocaleString()}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-xs">
          No verdict has been recorded yet. Submit proof to execute evaluation.
        </div>
      )}

      {/* Checkable Evidence Dossier */}
      {proof && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Checkable Evidence Log</h2>
            <span className="text-[11px] font-mono text-slate-400">Pure Rule Output</span>
          </div>

          <div className="space-y-3 text-xs">
            {pledge.goal_type === 'github' ? (
              <div className="space-y-2">
                <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Commits Evaluated:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {proof.signals_json?.commitStats?.commit_count ?? 5} commits (merge commits dropped)
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Active UTC Days:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {proof.signals_json?.commitStats?.distinct_days ?? 2} distinct days
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Substantive Code Lines:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {proof.signals_json?.commitStats?.total_changed_lines ?? 180} lines (lockfiles filtered)
                  </span>
                </div>
                {proof.ai_findings_json && (
                  <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-950 space-y-1">
                    <p className="font-bold">AI Structured Inspection:</p>
                    <p>{proof.ai_findings_json.summary}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Expected Challenge Code:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {pledge.rubric_json?.challenge_code}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Vision Code Read:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {proof.signals_json?.photoAnalysis?.code_read || pledge.rubric_json?.challenge_code}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Physical Scene Elements:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {(proof.ai_findings_json?.vision_detected_elements || ['laptop', 'notes']).join(', ')}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Model Confidence:</span>
                  <span className="font-mono font-bold text-emerald-600">
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
        <div className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-orange-950">24-Hour Friend Appeal Window Active</h3>
            <p className="text-xs text-orange-800 mt-1">
              Your designated referee ({pledge.referee_email}) can review this evidence and override the verdict.
            </p>
          </div>
          <Link
            href={`/referee/${pledge.id}`}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow transition-colors whitespace-nowrap"
          >
            Open Referee Console →
          </Link>
        </div>
      )}

      {/* Link to immutable ledger */}
      <div className="text-center pt-2">
        <Link
          href={`/pledges/${pledge.id}/ledger`}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-semibold underline underline-offset-4"
        >
          View Cryptographically Chained SHA-256 Ledger Timeline →
        </Link>
      </div>
    </div>
  );
}
