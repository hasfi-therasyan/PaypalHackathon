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
      setMessage(`Successfully seeded ${data.seeded?.length || 3} realistic pledges across different sprint states.`);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-mono uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">
            Judge & Admin Tool
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            Demo Control Console
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Test harness to accelerate demo clock, populate sample pledges, and test tamper detection.
          </p>
        </div>
        <Link href="/" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
          ← Back to App
        </Link>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-sm text-indigo-900 font-medium">
          {message}
        </div>
      )}

      {/* Action 1: Seed Demo Contracts */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-900">1. Instant Demo Seed</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Seeds 3 realistic hackathon pledges: an Active GitHub sprint, a Succeeded Photo sprint with voided hold, and an Appeal-Open sprint ready for referee decision.
        </p>
        <button
          type="button"
          disabled={seeding}
          onClick={handleSeedDemo}
          className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs shadow transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {seeding ? 'Seeding Database...' : '⚡ Seed Demo Pledges & Hash-Chained Ledgers'}
        </button>
      </div>

      {/* Action 2: Demo Clock Acceleration */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900">2. Accelerated Demo Clock</h2>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
            {clockSpeed}x (1 min = {clockSpeed} mins)
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Compresses time for live hackathon demonstration so 48-hour sprints and 24-hour appeal windows settle during the 3-minute video.
        </p>
        <input
          type="range"
          min={1}
          max={120}
          value={clockSpeed}
          onChange={(e) => setClockSpeed(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>Real-time (1x)</span>
          <span>Fast (60x)</span>
          <span>Hyperspeed (120x)</span>
        </div>
      </div>

      {/* Quick Navigation Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-900">3. Quick Flow Navigation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <Link href="/" className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-center font-semibold text-slate-700">
            Landing Page
          </Link>
          <Link href="/new" className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-center font-semibold text-slate-700">
            Create Pledge
          </Link>
          <Link href="/stats" className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-center font-semibold text-slate-700">
            Reliability Stats
          </Link>
          <button
            type="button"
            onClick={handleSeedDemo}
            className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-center font-semibold"
          >
            Run Seed Again
          </button>
        </div>
      </div>
    </div>
  );
}
