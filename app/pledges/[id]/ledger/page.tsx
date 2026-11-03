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
    if (!confirm('This will SIMULATE an unauthorized database mutation and demonstrate how SHA-256 chain verification instantly detects the forgery. The real Supabase append-only trigger prevents actual tampering. Continue?')) {
      return;
    }
    setTampering(true);
    try {
      const res = await fetch(`/api/ledger/${pledgeId}/tamper`, { method: 'POST' });
      const tamperResult = await res.json();
      // Inject the simulated tampered verification result into our local state
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
      <div className="max-w-4xl mx-auto py-20 text-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400 font-medium">Computing cryptographic SHA-256 hash chain...</p>
      </div>
    );
  }

  if (error || !data?.pledge) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center space-y-3">
          <h2 className="text-base font-bold text-rose-300">Error</h2>
          <p className="text-xs text-rose-400">{error || 'Ledger not found.'}</p>
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
  const tamperNote = data?.tamperNote;
  const tamperMessage = data?.tamperMessage;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header & Verification Pill */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs font-mono text-slate-500">Pledge #{pledge.id.slice(0, 8)}</span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
            Tamper-Evident SHA-256 Ledger
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Dynamic Chain Status Badge */}
          {isChainValid ? (
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              CHAIN INTACT (SHA-256 SEALED)
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-rose-500/10 text-rose-300 border border-rose-500/30 shadow-lg shadow-rose-500/10 animate-bounce">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              CHAIN COMPROMISED AT SEQ #{brokenSeq}
            </span>
          )}

          <Link
            href={`/pledges/${pledge.id}`}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
          >
            ← Back to Sprint
          </Link>
        </div>
      </div>

      {/* Tamper simulation result banner */}
      {tamperMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-mono space-y-2 ${!isChainValid ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
          <p className="font-bold">{tamperMessage}</p>
          {tamperNote && <p className="text-slate-400 text-[11px]">{tamperNote}</p>}
        </div>
      )}

      {/* Cryptographic Spec & Tamper Test Action */}
      <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-mono shadow-xl">
        <div className="space-y-1">
          <p className="text-slate-300">
            Hash Chaining: <span className="text-emerald-400 font-bold">sha256(prev_hash + &quot;|&quot; + canonicalJson(event))</span>
          </p>
          <p className="text-slate-500 text-[11px]">
            Genesis Hash: <span className="text-slate-300 font-semibold">{'0'.repeat(16)}...</span> · Verified Events: {events.length}
          </p>
        </div>

        <button
          type="button"
          disabled={tampering || !isChainValid}
          onClick={handleSimulateTamper}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-sans font-bold shadow-lg shadow-rose-600/20 transition-all disabled:opacity-40 whitespace-nowrap"
        >
          {tampering ? 'Tampering...' : '⚡ Simulate Unauthorized Edit (Test Detection)'}
        </button>
      </div>

      {/* Sequential Event Timeline */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md">
        <div className="pb-3 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-base font-bold text-white">Immutable Audit Trail</h2>
          <span className="text-xs text-indigo-400 font-mono">Append-Only Database Log</span>
        </div>

        {events.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">No ledger events recorded yet.</p>
        ) : (
          <div className="relative border-l-2 border-slate-800 ml-4 space-y-8">
            {events.map((ev: any) => {
              const isTampered = !isChainValid && brokenSeq === ev.seq;
              return (
                <div key={ev.id || ev.seq} className="relative pl-7">
                  {/* Sequence Node Indicator */}
                  <div
                    className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold border-2 ${
                      isTampered
                        ? 'bg-rose-600 text-white border-rose-500 ring-4 ring-rose-500/20 animate-pulse'
                        : 'bg-slate-950 text-indigo-400 border-indigo-500/80 shadow-md'
                    }`}
                  >
                    #{ev.seq}
                  </div>

                  <div className={`p-5 rounded-2xl border ${isTampered ? 'border-rose-500/60 bg-rose-500/10 shadow-lg' : 'border-slate-800 bg-slate-950/60'} space-y-3`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                      <span className="text-sm font-bold text-white font-mono">
                        {ev.type}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(ev.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto shadow-inner leading-relaxed">
                      <pre>{JSON.stringify(ev.payload_json, null, 2)}</pre>
                    </div>

                    <div className="pt-2 text-[11px] font-mono space-y-1 text-slate-400">
                      <div className="truncate">
                        <span className="font-semibold text-slate-500">prev_hash:</span> {ev.prev_hash}
                      </div>
                      <div className="truncate text-indigo-400 font-semibold">
                        <span className="font-semibold text-slate-500">hash:</span> {ev.hash}
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
