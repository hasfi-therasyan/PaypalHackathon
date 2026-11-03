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
      <div className="max-w-3xl mx-auto py-16 text-center text-slate-500 text-xs">
        Assembling referee verdict dossier...
      </div>
    );
  }

  if (error || !data?.pledge) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="p-6 bg-white border border-rose-200 rounded-2xl text-center space-y-3">
          <h2 className="text-base font-bold text-rose-800">Error</h2>
          <p className="text-xs text-rose-600">{error || 'Pledge not found'}</p>
          <Link href="/" className="inline-block px-4 py-2 bg-[#0070ba] text-white rounded-xl text-xs font-bold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { pledge, proof, verdicts } = data;
  const latestVerdict = verdicts && verdicts.length > 0 ? verdicts[0] : null;

  const outcomeColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
    pass: {
      bg: 'bg-[#eafbf3]',
      text: 'text-[#0d7a53]',
      border: 'border-[#a7f3d0]',
      label: 'Pass (Hold Voided - Funds Retained)',
    },
    fail: {
      bg: 'bg-[#fef2f2]',
      text: 'text-[#b91c1c]',
      border: 'border-[#fecaca]',
      label: 'Fail (Hold Captured & Paid Out)',
    },
    borderline: {
      bg: 'bg-[#fff8eb]',
      text: 'text-[#9a4d00]',
      border: 'border-[#fbd38d]',
      label: 'Borderline (Referred to Friend Referee)',
    },
  };

  const outcome = latestVerdict?.outcome || (pledge.status === 'SUCCEEDED' ? 'pass' : pledge.status === 'CAPTURED' ? 'fail' : 'borderline');
  const style = outcomeColors[outcome] || outcomeColors.borderline;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0070ba]">
            Decision & Settlement Record
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#003087] tracking-tight mt-1">
            Referee Verdict Dossier
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official evaluation record for <strong className="text-slate-800">{pledge.title}</strong>
          </p>
        </div>
        <Link href={`/pledges/${pledgeId}`} className="text-xs font-bold text-[#0070ba] hover:underline">
          ← Pledge View
        </Link>
      </div>

      {/* Primary Verdict Card */}
      <div className={`p-6 rounded-2xl border ${style.bg} ${style.border} ${style.text} space-y-3`}>
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider">Evaluation Result</span>
          <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-white border border-current">
            Source: {latestVerdict?.source?.toUpperCase() || 'AUTOMATED'}
          </span>
        </div>

        <h2 className="text-2xl font-black">{style.label}</h2>

        <div className="p-4 bg-white/90 rounded-xl border border-current text-slate-800 text-xs leading-relaxed space-y-1">
          <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
            Written Reasoning:
          </span>
          <p>{latestVerdict?.reasoning || 'All rubric criteria confirmed satisfied. Hold released with zero fees.'}</p>
        </div>
      </div>

      {/* Counterparties & Escrow Summary */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-[#003087]">Escrow Settlement Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-[#f8fafc] border border-slate-200 rounded-xl space-y-1">
            <span className="text-slate-500 text-[11px] block">Stake Amount Protected:</span>
            <span className="text-lg font-black text-[#003087] font-tabular">
              ${((pledge.stake_cents || 0) / 100).toFixed(2)} USD
            </span>
          </div>

          <div className="p-3 bg-[#f8fafc] border border-slate-200 rounded-xl space-y-1">
            <span className="text-slate-500 text-[11px] block">Settlement Action:</span>
            <span className="text-sm font-bold text-slate-900">
              {pledge.status === 'SUCCEEDED' ? 'PayPal Void (Hold Released)' : 'PayPal Capture (Paid Out)'}
            </span>
          </div>

          <div className="p-3 bg-[#f8fafc] border border-slate-200 rounded-xl space-y-1">
            <span className="text-slate-500 text-[11px] block">Beneficiary (On Forfeit):</span>
            <span className="text-xs font-bold text-slate-900 font-mono">{pledge.beneficiary_paypal_email}</span>
          </div>

          <div className="p-3 bg-[#f8fafc] border border-slate-200 rounded-xl space-y-1">
            <span className="text-slate-500 text-[11px] block">Assigned Referee:</span>
            <span className="text-xs font-bold text-slate-900 font-mono">{pledge.referee_email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
