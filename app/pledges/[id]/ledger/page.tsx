'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function LedgerTimelinePage() {
  const params = useParams();
  const pledgeId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tampering, setTampering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadLedger() {
    try {
      const res = await fetch(`/api/pledges/${pledgeId}`);
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
    loadLedger();
  }, [pledgeId]);

  async function handleSimulateTamper() {
    if (!confirm('This will modify a ledger row in memory to simulate an unauthorized database mutation and test SHA-256 chain invalidation. Continue?')) {
      return;
    }
    setTampering(true);
    try {
      await fetch(`/api/ledger/${pledgeId}/tamper`, { method: 'POST' });
      await loadLedger();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTampering(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">Computing cryptographic SHA-256 hash chain...</p>
      </div>
    );
  }

  if (error || !data?.pledge) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <h2 className="text-base font-bold text-rose-800">Error</h2>
          <p className="text-xs text-rose-600">{error || 'Ledger not found.'}</p>
          <Link href="/" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { pledge, ledger } = data;
  const isChainValid = ledger?.valid ?? true;
  const brokenSeq = ledger?.brokenSeq;
  const events = ledger?.events || [];

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header & Verification Pill */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-mono text-slate-400">Pledge #{pledge.id.slice(0, 8)}</span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Tamper-Evident SHA-256 Ledger
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Dynamic Chain Status Badge */}
          {isChainValid ? (
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              CHAIN INTACT (SHA-256 SEALED)
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-rose-50 text-rose-800 border border-rose-300 shadow-xs animate-bounce">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              CHAIN COMPROMISED AT SEQ #{brokenSeq}
            </span>
          )}

          <Link
            href={`/pledges/${pledge.id}`}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            ← Back to Sprint
          </Link>
        </div>
      </div>

      {/* Cryptographic Spec & Tamper Test Action */}
      <div className="p-5 bg-slate-900 text-slate-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-mono shadow-sm">
        <div className="space-y-1">
          <p className="text-slate-300">
            Hash Chaining: <span className="text-emerald-400 font-bold">sha256(prev_hash + &quot;|&quot; + canonicalJson(event))</span>
          </p>
          <p className="text-slate-400 text-[11px]">
            Genesis Hash: <span className="text-slate-200 font-semibold">{'0'.repeat(16)}...</span> · Verified Events: {events.length}
          </p>
        </div>

        <button
          type="button"
          disabled={tampering || !isChainValid}
          onClick={handleSimulateTamper}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-sans font-bold shadow transition-all disabled:opacity-40 whitespace-nowrap"
        >
          {tampering ? 'Tampering...' : '⚡ Simulate Unauthorized Edit (Test Detection)'}
        </button>
      </div>

      {/* Sequential Event Timeline */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="pb-3 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900">Immutable Audit Trail</h2>
          <span className="text-xs text-slate-400 font-mono">Append-Only</span>
        </div>

        {events.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">No ledger events recorded yet.</p>
        ) : (
          <div className="relative border-l-2 border-indigo-100 ml-4 space-y-8">
            {events.map((ev: any) => {
              const isTampered = !isChainValid && brokenSeq === ev.seq;
              return (
                <div key={ev.id || ev.seq} className="relative pl-7">
                  {/* Sequence Node Indicator */}
                  <div
                    className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold border-2 ${
                      isTampered
                        ? 'bg-rose-600 text-white border-rose-700 ring-4 ring-rose-100 animate-pulse'
                        : 'bg-white text-indigo-700 border-indigo-600 shadow-xs'
                    }`}
                  >
                    #{ev.seq}
                  </div>

                  <div className={`p-5 rounded-2xl border ${isTampered ? 'border-rose-400 bg-rose-50/80 shadow-sm' : 'border-slate-200 bg-slate-50/50'} space-y-3`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        {ev.type}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(ev.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 overflow-x-auto shadow-inner leading-relaxed">
                      <pre>{JSON.stringify(ev.payload_json, null, 2)}</pre>
                    </div>

                    <div className="pt-2 text-[11px] font-mono space-y-1 text-slate-500">
                      <div className="truncate">
                        <span className="font-semibold text-slate-400">prev_hash:</span> {ev.prev_hash}
                      </div>
                      <div className="truncate text-indigo-700 font-semibold">
                        <span className="font-semibold text-slate-400">hash:</span> {ev.hash}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
