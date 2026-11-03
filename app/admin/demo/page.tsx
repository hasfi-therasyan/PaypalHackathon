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
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <span className="text-[11px] font-mono uppercase bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-bold">
            Judge & Demonstrator Test Harness
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1.5">
            Demo Flight Deck
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Test harness to accelerate demo clock, populate sample pledges, and evaluate referee flows.
          </p>
        </div>
        <Link href="/" className="text-xs font-bold text-indigo-400 hover:text-indigo-300">
          ← Dashboard
        </Link>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-200 font-medium">
          {message}
        </div>
      )}

      {/* Action 1: Seed Demo Contracts */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-3 backdrop-blur-md">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">1. Instant Demo Seed</h2>
          <span className="text-xs font-mono text-purple-300 font-semibold bg-purple-950/70 border border-purple-800/80 px-2 py-0.5 rounded">
            One-Click Setup
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Seeds 3 realistic hackathon pledges: an Active GitHub sprint with live hold, a Succeeded Photo sprint with voided hold, and an Appeal-Open sprint ready for friend referee decision.
        </p>
        <button
          type="button"
          disabled={seeding}
          onClick={handleSeedDemo}
          className="py-3 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {seeding ? 'Seeding Database...' : '⚡ Seed Demo Contracts & Chained Ledgers'}
        </button>
      </div>

      {/* Action 2: Demo Clock Acceleration */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4 backdrop-blur-md">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">2. Accelerated Demo Clock</h2>
          <span className="text-xs font-mono font-bold bg-slate-950 text-indigo-400 px-2.5 py-0.5 rounded-lg border border-slate-800">
            {clockSpeed}x (1 min = {clockSpeed} mins)
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Compresses time for live hackathon video recording so 48-hour sprints and 24-hour appeal windows settle during the 3-minute video.
        </p>
        <input
          type="range"
          min={1}
          max={120}
          value={clockSpeed}
          onChange={(e) => setClockSpeed(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
          <span>Real-time (1x)</span>
          <span>Fast (60x)</span>
          <span>Hyperspeed (120x)</span>
        </div>
      </div>

      {/* Quick Navigation Panel */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-3 backdrop-blur-md">
        <h2 className="text-base font-bold text-white pb-2 border-b border-slate-800">
          3. Quick Navigation for Evaluators
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <Link href="/" className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-center font-bold text-slate-300 transition-colors">
            Home Dashboard
          </Link>
          <Link href="/new" className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-center font-bold text-slate-300 transition-colors">
            Create Pledge
          </Link>
          <Link href="/stats" className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-center font-bold text-slate-300 transition-colors">
            Reliability Stats
          </Link>
          <button
            type="button"
            onClick={handleSeedDemo}
            className="p-3 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/60 text-emerald-300 rounded-xl text-center font-bold transition-colors"
          >
            Re-run Seed
          </button>
        </div>
      </div>
    </div>
  );
}
