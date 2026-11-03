'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AdminDemoConsolePage() {
  const [seeding, setSeeding] = useState(false);
  const [clockSpeed, setClockSpeed] = useState(60);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSeedDemo() {
    setSeeding(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to seed demo data.');
      setMessage(`Successfully seeded ${data.seeded?.length || 3} realistic sprint contracts across Active, Succeeded, and Appeal-Open states.`);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
        <div>
          <span className="text-[11px] font-mono uppercase bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full font-bold">
            Judge & Demonstrator Test Harness
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            Demo Flight Deck
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Test harness to accelerate demo clock, populate sample pledges, and evaluate referee flows.
          </p>
        </div>
        <Link href="/" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
          ← Dashboard
        </Link>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 font-medium">
          {message}
        </div>
      )}

      {/* Action 1: Seed Demo Contracts */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">1. Instant Demo Seed</h2>
          <span className="text-xs font-mono text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded">
            One-Click Setup
          </span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Seeds 3 realistic hackathon pledges: an Active GitHub sprint with live hold, a Succeeded Photo sprint with voided hold, and an Appeal-Open sprint ready for friend referee decision.
        </p>
        <button
          type="button"
          disabled={seeding}
          onClick={handleSeedDemo}
          className="py-3 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {seeding ? 'Seeding Database...' : '⚡ Seed Demo Contracts & Chained Ledgers'}
        </button>
      </div>

      {/* Action 2: Demo Clock Acceleration */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">2. Accelerated Demo Clock</h2>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200">
            {clockSpeed}x (1 min = {clockSpeed} mins)
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Compresses time for live hackathon video recording so 48-hour sprints and 24-hour appeal windows settle during the 3-minute video.
        </p>
        <input
          type="range"
          min={1}
          max={120}
          value={clockSpeed}
          onChange={(e) => setClockSpeed(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
          <span>Real-time (1x)</span>
          <span>Fast (60x)</span>
          <span>Hyperspeed (120x)</span>
        </div>
      </div>

      {/* Quick Navigation Panel */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
          3. Quick Navigation for Evaluators
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <Link href="/" className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 rounded-xl text-center font-bold text-slate-700 transition-colors">
            Home Dashboard
          </Link>
          <Link href="/new" className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 rounded-xl text-center font-bold text-slate-700 transition-colors">
            Create Pledge
          </Link>
          <Link href="/stats" className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 rounded-xl text-center font-bold text-slate-700 transition-colors">
            Reliability Stats
          </Link>
          <button
            type="button"
            onClick={handleSeedDemo}
            className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-center font-bold transition-colors"
          >
            Re-run Seed
          </button>
        </div>
      </div>
    </div>
  );
}
