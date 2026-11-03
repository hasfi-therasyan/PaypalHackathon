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
    if (!confirm('This will modify a ledger row in memory to simulate a malicious database edit and demonstrate SHA-256 chain invalidation. Continue?')) {
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
      <div className="max-w-4xl mx-auto py-16 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Verifying cryptographic hash chain...</p>
      </div>
    );
  }

  if (error || !data?.pledge) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
          <h2 className="text-lg font-bold text-red-800 mb-2">Error</h2>
          <p className="text-sm text-red-600 mb-4">{error || 'Ledger not found.'}</p>
          <Link href="/" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold">
            Back to Home
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
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header with Verification Badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-mono text-slate-400">Pledge #{pledge.id.slice(0, 8)}</span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">Tamper-Evident Ledger</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Dynamic Chain Status Badge */}
          {isChainValid ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              CHAIN INTACT (SHA-256 VALIDATED)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300 shadow-sm animate-bounce">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              CHAIN COMPROMISED AT SEQ #{brokenSeq}
            </span>
          )}

          <Link
            href={`/pledges/${pledge.id}`}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            ← Pledge Details
          </Link>
        </div>
      </div>

      {/* Description & Demo Tamper Action */}
      <div className="p-4 bg-slate-900 text-slate-100 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-mono">
        <div>
          <p className="text-slate-300">
            Hash Rule: <span className="text-emerald-400 font-bold">sha256(prev_hash + &quot;|&quot; + canonicalJson(event))</span>
          </p>
          <p className="text-slate-400 mt-1">
            Genesis Hash: <span className="text-slate-300">{'0'.repeat(16)}...</span> · Events: {events.length}
          </p>
        </div>

        <button
          type="button"
          disabled={tampering || !isChainValid}
          onClick={handleSimulateTamper}
          className="px-3.5 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-sans font-bold shadow transition-colors disabled:opacity-40"
        >
          {tampering ? 'Tampering...' : '⚡ Simulate Malicious Edit (Test Tamper Detection)'}
        </button>
      </div>

      {/* Timeline of Events */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-6">
          Sequential Event Audit Trail
        </h2>

        {events.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No ledger events recorded yet.</p>
        ) : (
          <div className="relative border-l-2 border-indigo-100 ml-4 space-y-6">
            {events.map((ev: any) => {
              const isTampered = !isChainValid && brokenSeq === ev.seq;
              return (
                <div key={ev.id || ev.seq} className="relative pl-6">
                  {/* Sequence Node Indicator */}
                  <div
                    className={`absolute -left-[17px] top-1.5 w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold border-2 ${
                      isTampered
                        ? 'bg-red-600 text-white border-red-700 animate-ping'
                        : 'bg-white text-indigo-700 border-indigo-600'
                    }`}
                  >
                    #{ev.seq}
                  </div>

                  <div className={`p-4 rounded-xl border ${isTampered ? 'border-red-400 bg-red-50/70' : 'border-slate-200 bg-slate-50/50'} space-y-2`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        {ev.type}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(ev.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono text-xs text-slate-700 overflow-x-auto">
                      <pre>{JSON.stringify(ev.payload_json, null, 2)}</pre>
                    </div>

                    <div className="pt-2 text-xs font-mono space-y-1 text-slate-400">
                      <div className="truncate">
                        <span className="font-semibold text-slate-500">prev_hash:</span> {ev.prev_hash}
                      </div>
                      <div className="truncate text-indigo-700 font-semibold">
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
