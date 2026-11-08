'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/lib/auth-context';
import { accountRequestHeaders } from '@/app/lib/access';

export default function LedgerTimelinePage() {
  const params = useParams();
  const pledgeId = params.id as string;
  const { user, isReady } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tampering, setTampering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadLedger() {
    if (!user) {
      setError('Sign in to view this ledger.');
      setLoading(false);
      return;
    }
    try {
        const res = await fetch(`/api/pledges/${pledgeId}?includeLedger=1`, {
          headers: accountRequestHeaders(user),
        });
      if (!res.ok) throw new Error('Failed to load ledger.');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isReady) loadLedger();
  }, [pledgeId, isReady, user]);

  async function handleSimulateTamper() {
    if (!confirm('This will SIMULATE an unauthorized database modification and demonstrate how the SHA-256 chain verification instantly flags the broken hash. Continue?')) {
      return;
    }
    setTampering(true);
    try {
      const res = await fetch(`/api/ledger/${pledgeId}/tamper`, {
        method: 'POST',
        headers: accountRequestHeaders(user),
      });
      const tamperResult = await res.json();
      if (tamperResult.verification) {
        setData((prev: any) => ({
          ...prev,
          ledger: tamperResult.verification,
          tamperNote: tamperResult.note,
          tamperMessage: tamperResult.message,
        }));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTampering(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-500 text-xs">
        Verifying SHA-256 cryptographic chain...
      </div>
    );
  }

  if (error || !data?.pledge) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="p-6 bg-white border border-rose-200 rounded-2xl text-center space-y-3">
          <h2 className="text-base font-bold text-rose-800">Ledger Error</h2>
          <p className="text-xs text-rose-600">{error || 'Ledger records not found.'}</p>
          <Link href="/dashboard" className="inline-block px-4 py-2 bg-[#0070ba] text-white rounded-xl text-xs font-bold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { pledge, ledger, tamperNote, tamperMessage } = data;
  const isChainValid = ledger?.valid !== false;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-8">
      {/* Hallmark Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-[#e2e8f0]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0070ba]">
            Audit & Cryptographic Security
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#003087] tracking-tight mt-1">
            Tamper-Evident SHA-256 Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Chained state transitions sealed with canonical JSON representations. Every transition verifiable by judges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/pledges/${pledgeId}`}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-[#0070ba] text-xs font-bold rounded-xl transition-colors"
          >
            ← Commitment View
          </Link>
          {user?.role === 'admin' && (
            <button
              onClick={handleSimulateTamper}
              disabled={tampering}
              className="px-3.5 py-1.5 bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 text-xs font-bold rounded-xl transition-colors"
            >
              {tampering ? 'Simulating...' : '⚡ Simulate Forgery Tamper'}
            </button>
          )}
        </div>
      </div>

      {/* Verification Status Banner */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isChainValid
            ? 'bg-[#eafbf3] border-[#a7f3d0] text-[#0d7a53]'
            : 'bg-[#fef2f2] border-[#fecaca] text-[#b91c1c]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-base bg-white shadow-2xs">
              {isChainValid ? '✓' : '⚠️'}
            </span>
            <div>
              <h2 className="text-base font-extrabold">
                {isChainValid ? 'Cryptographic Chain Valid & Intact' : 'TAMPER DETECTED: Chain Verification Failed'}
              </h2>
              <p className="text-xs opacity-90 mt-0.5">
                {isChainValid
                  ? `${ledger?.totalEvents || 0} sequential events verified against canonical SHA-256 genesis.`
                  : `Hash mismatch at sequence #${ledger?.brokenSeq}. Stored signature does not match canonical payload calculation.`}
              </p>
            </div>
          </div>

          <div className="font-mono text-xs bg-white/80 px-3 py-1.5 rounded-xl border border-current font-bold self-start sm:self-auto">
            Status: {isChainValid ? 'VERIFIED' : 'COMPROMISED'}
          </div>
        </div>
      </div>

      {tamperNote && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
          <span className="font-bold block">⚠️ Test Simulation Active:</span>
          <p>{tamperNote}</p>
          <p className="font-mono text-[11px] text-amber-800">{tamperMessage}</p>
        </div>
      )}

      {/* Sealed Rubric Genesis Snapshot */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h2 className="text-sm font-bold text-[#003087]">Locked Rubric Genesis (Canonical SHA-256)</h2>
          <span className="text-[11px] font-mono bg-blue-50 text-[#0070ba] px-2 py-0.5 rounded font-bold">
            IMMUTABLE
          </span>
        </div>
        <div className="p-3 bg-[#f8fafc] border border-slate-200 rounded-xl font-mono text-xs text-slate-700 break-all space-y-1">
          <span className="text-[11px] text-slate-500 block">SHA-256 Root Hash:</span>
          <span className="font-bold text-[#003087]">{pledge.rubric_hash}</span>
        </div>
      </div>

      {/* Chained Events Timeline */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">Event Hash Sequence</h2>

        <div className="space-y-3 font-mono text-xs">
          {ledger?.events?.map((evt: any) => (
            <div
              key={evt.id || evt.seq}
              className="p-4 rounded-xl border border-slate-200 bg-[#f8fafc] hover:border-[#0070ba] transition-colors space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">
                  #{evt.seq} · {evt.type}
                </span>
                <span className="text-[11px] text-slate-500 font-sans">
                  {new Date(evt.created_at).toLocaleTimeString()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px]">PREV HASH:</span>
                  <span className="truncate block font-tabular">{evt.prev_hash}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">CURRENT HASH:</span>
                  <span className="truncate block text-[#0070ba] font-bold font-tabular">{evt.hash}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 font-sans text-xs text-slate-700">
                <span className="font-bold text-slate-800 text-[11px]">Payload Snapshot: </span>
                <code className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
                  {JSON.stringify(evt.payload_json)}
                </code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
