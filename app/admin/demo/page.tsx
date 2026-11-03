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
          <span className="text-[11px] font-mono uppercase bg-blue-50 text-[#0070ba] border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">
            Judge & Demonstrator Test Harness
          </span>
          <h1 className="text-3xl font-extrabold text-[#003087] tracking-tight mt-1.5">
            Admin Demo Console
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Test harness to accelerate demo clock, populate sample pledges, and evaluate referee flows.
          </p>
        </div>
        <Link href="/" className="text-xs font-bold text-[#0070ba] hover:underline">
          ← Back to User Dashboard
        </Link>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[#003087] font-medium">
          {message}
        </div>
      )}

      {/* Control 1: Demo Data Seeder */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <h2 className="text-base font-bold text-slate-900">1. Seed Realistic Hackathon Pledges</h2>
        <p className="text-xs text-slate-500">
          Populates the user dashboard with sample sprint contracts in three different lifecycles:
          1 Active Hold, 1 Succeeded (Voided), and 1 in Appeal Window with automated referee findings.
        </p>
        <button
          onClick={handleSeedDemo}
          disabled={seeding}
          className="px-4 py-2.5 bg-[#0070ba] hover:bg-[#003087] text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          {seeding ? 'Seeding Contracts...' : '⚡ Seed Demo Contracts Now'}
        </button>
      </div>

      {/* Control 2: Virtual Demo Clock */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <h2 className="text-base font-bold text-slate-900">2. Virtual Demo Clock Speed</h2>
        <p className="text-xs text-slate-500">
          Accelerate 48-hour sprint expirations during judge presentations. When clock speed is set to 60x, 1 minute of real time advances 1 hour of sprint time.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="1"
            max="120"
            value={clockSpeed}
            onChange={(e) => setClockSpeed(Number(e.target.value))}
            className="w-48 h-2 bg-slate-200 rounded-lg cursor-pointer accent-[#0070ba]"
          />
          <span className="font-mono text-xs font-bold text-[#003087] bg-blue-50 px-2 py-1 rounded border border-blue-200">
            {clockSpeed}x Speed
          </span>
        </div>
      </div>
    </div>
  );
}
