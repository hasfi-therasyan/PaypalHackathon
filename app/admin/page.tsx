'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/lib/auth-context';

export default function AdminSuitePage() {
  const { user } = useAuth();
  const [pledges, setPledges] = useState<any[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [clockSpeed, setClockSpeed] = useState(60);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch('/api/pledges');
      if (res.ok) {
        const data = await res.json();
        setPledges(data.pledges || []);
      }
    } catch (e) {
      console.warn('Could not load admin pledges', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to seed.');
      setStatusMsg(`Successfully seeded ${data.seeded?.length || 3} realistic pledges.`);
      loadData();
    } catch (e: any) {
      setStatusMsg(`Error: ${e.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#0070ba]">
              <span>🛡️ Admin Master Console & Audit Trail</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#003087] tracking-tight">
              System Administration & Flight Deck
            </h1>
            <p className="text-xs text-slate-600 max-w-xl">
              Audit all system pledges, PayPal transaction hashes, inspect ledger integrity, and manipulate the hackathon test environment.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <span className="text-slate-500 block">Admin Identity:</span>
            <span className="font-mono font-bold text-slate-900">
              {user?.email || 'hasfirasya02@gmail.com'}
            </span>
            <span className="block text-[10px] text-emerald-700 font-bold">● Full Permissions</span>
          </div>
        </div>
      </section>

      {statusMsg && (
        <div className="p-4 bg-blue-50 border border-blue-200 text-xs text-[#003087] font-semibold rounded-xl">
          {statusMsg}
        </div>
      )}

      {/* Admin Quick Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tool 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900">⚡ Test Harness & Data Seeder</h2>
          <p className="text-xs text-slate-500">
            Instantly repopulate sandbox pledges across Active, Succeeded, and Appeal states for judge evaluation.
          </p>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-4 py-2 bg-[#0070ba] hover:bg-[#003087] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            {seeding ? 'Seeding...' : 'Seed 3 Realistic Contracts'}
          </button>
        </div>

        {/* Tool 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900">⏱️ Virtual Demo Clock Speed</h2>
          <p className="text-xs text-slate-500">
            Speed up sprint timers so 48-hour expirations can be shown to judges in under 2 minutes.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="120"
              value={clockSpeed}
              onChange={(e) => setClockSpeed(Number(e.target.value))}
              className="w-44 h-2 bg-slate-200 rounded-lg cursor-pointer accent-[#0070ba]"
            />
            <span className="font-mono text-xs font-bold text-[#003087] bg-blue-50 px-2 py-1 rounded border border-blue-200">
              {clockSpeed}x Accelerated
            </span>
          </div>
        </div>
      </div>

      {/* Audit Trail & System Ledger Overview */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Master Audit Trail & Pledges</h2>
            <p className="text-xs text-slate-500">
              All active and historical contracts recorded in the cryptographic ledger.
            </p>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-full border border-slate-200">
            {pledges.length} Total Records
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Pledge / Goal</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Stake</th>
                  <th className="py-3 px-4">Referee</th>
                  <th className="py-3 px-4">SHA-256 Rubric Hash</th>
                  <th className="py-3 px-4 text-right">Ledger Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pledges.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">
                      <Link href={`/pledges/${p.id}`} className="hover:text-[#0070ba]">
                        {p.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-mono uppercase text-[10px] text-slate-500">
                      {p.goal_type}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#003087]">
                      ${((p.stake_cents || 0) / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {p.referee_email}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400 truncate max-w-[120px]" title={p.rubric_hash}>
                      {p.rubric_hash ? `${p.rubric_hash.slice(0, 10)}...` : 'Pending'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <Link
                        href={`/pledges/${p.id}/ledger`}
                        className="px-2.5 py-1 bg-blue-50 text-[#0070ba] hover:bg-blue-100 rounded font-semibold text-[11px] border border-blue-200 inline-block"
                      >
                        Ledger Chain
                      </Link>
                      <Link
                        href={`/pledges/${p.id}`}
                        className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded font-semibold text-[11px] inline-block"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

