'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [pledges, setPledges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPledges() {
      try {
        const res = await fetch('/api/pledges');
        if (res.ok) {
          const data = await res.json();
          setPledges(data.pledges || []);
        }
      } catch (e) {
        console.warn('Could not load pledges list:', e);
      } finally {
        setLoading(false);
      }
    }
    loadPledges();
  }, []);

  const statusColors: Record<string, string> = {
    RUBRIC_LOCKED: 'bg-amber-100 text-amber-800 border-amber-200',
    ACTIVE: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    APPEAL_WINDOW_OPEN: 'bg-orange-100 text-orange-800 border-orange-200',
    SUCCEEDED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    CAPTURED: 'bg-rose-100 text-rose-800 border-rose-200',
    PAID_OUT: 'bg-slate-200 text-slate-800 border-slate-300',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-10 sm:py-14 max-w-3xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-semibold text-indigo-700 mb-6">
          <span className="w-2 h-2 rounded-full bg-indigo-600" />
          PayPal AI Hackathon Submission · Sandbox Only
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Put money where your promise is.
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Stake backs your commitment with a temporary PayPal sandbox authorization hold.
          An AI referee verifies proof against a tamper-evident SHA-256 rubric, while your friend holds final appeal authority.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-3">
          <Link
            href="/new"
            className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>Create Commitment Pledge</span>
            <span>→</span>
          </Link>
          <Link
            href="/stats"
            className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-sm rounded-xl shadow-sm transition-all text-center"
          >
            Reliability Analytics
          </Link>
          <Link
            href="/admin/demo"
            className="w-full sm:w-auto px-4 py-3.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-sm rounded-xl transition-all text-center"
          >
            Judge Demo Console
          </Link>
        </div>

        {/* 3 Core Guarantees Banner */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">PayPal Authorization Hold</span>
            <p className="text-sm font-semibold text-slate-900 mt-1">Hold, Not a Charge</p>
            <p className="text-xs text-slate-500 mt-1">Capped at 50.00 USD (sandbox). Released instantly upon goal success.</p>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Two-Signal Referee</span>
            <p className="text-sm font-semibold text-slate-900 mt-1">GitHub & Photo Verification</p>
            <p className="text-xs text-slate-500 mt-1">Deterministic filters, commit diff analysis & 3-word challenge codes.</p>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Tamper-Evident Ledger</span>
            <p className="text-sm font-semibold text-slate-900 mt-1">SHA-256 Hash Chained</p>
            <p className="text-xs text-slate-500 mt-1">Append-only audit trail with 64-zero genesis hash and live badge.</p>
          </div>
        </div>
      </section>

      {/* Active Pledges Dashboard */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Active & Historical Sprints</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time status of commitment contracts</p>
          </div>
          <Link
            href="/new"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            + New Pledge
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading commitments...
          </div>
        ) : pledges.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm space-y-3">
            <p>No pledges found in the database.</p>
            <div className="flex justify-center gap-3">
              <Link
                href="/new"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
              >
                Create First Pledge
              </Link>
              <Link
                href="/admin/demo"
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold"
              >
                Seed Demo Data
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pledges.map((p) => {
              const formatted = `${(p.stake_cents / 100).toFixed(2)} USD (sandbox)`;
              return (
                <div
                  key={p.id}
                  className="p-5 border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors bg-slate-50/50 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${statusColors[p.status] || 'bg-slate-100'}`}>
                      {p.status}
                    </span>
                    <span className="text-sm font-bold text-indigo-600">{formatted}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{p.title}</h3>

                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Goal Type:</span>
                      <span className="font-semibold text-slate-700 uppercase">{p.goal_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Beneficiary:</span>
                      <span className="font-semibold text-slate-700">{p.beneficiary_name}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                    <Link
                      href={`/pledges/${p.id}`}
                      className="font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      View Sprint Details →
                    </Link>
                    <Link
                      href={`/pledges/${p.id}/ledger`}
                      className="text-slate-500 hover:text-slate-800 font-mono"
                    >
                      Audit Trail 📜
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
