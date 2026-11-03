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
        console.warn('Could not load pledges:', e);
      } finally {
        setLoading(false);
      }
    }
    loadPledges();
  }, []);

  const statusConfig: Record<string, { label: string; badge: string; dot: string }> = {
    RUBRIC_LOCKED: {
      label: 'Rubric Locked',
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      dot: 'bg-amber-400',
    },
    ACTIVE: {
      label: 'Hold Active',
      badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
      dot: 'bg-indigo-400 animate-pulse',
    },
    APPEAL_WINDOW_OPEN: {
      label: 'Appeal Open',
      badge: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
      dot: 'bg-orange-400 animate-pulse',
    },
    SUCCEEDED: {
      label: 'Succeeded (Voided)',
      badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      dot: 'bg-emerald-400',
    },
    CAPTURED: {
      label: 'Hold Captured',
      badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
      dot: 'bg-rose-400',
    },
    PAID_OUT: {
      label: 'Paid Out',
      badge: 'bg-slate-800 text-slate-300 border-slate-700',
      dot: 'bg-slate-400',
    },
    CANCELLED: {
      label: 'Grace Cancelled',
      badge: 'bg-slate-800 text-slate-400 border-slate-700',
      dot: 'bg-slate-500',
    },
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative text-center py-10 sm:py-16 max-w-3xl mx-auto px-4">
        {/* Glow backdrop */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
          <div className="w-[450px] h-[280px] bg-indigo-600/15 rounded-full blur-[100px] transform -translate-y-6" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-slate-900/90 border border-slate-800 rounded-full text-xs font-semibold text-slate-300 shadow-lg mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>PayPal Authorization Hold Escrow</span>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-indigo-400">Orders v2</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
          Put money where <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-emerald-400">
            your promise is.
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl mx-auto font-normal">
          Back your goals with a temporary PayPal authorization hold. An automated referee verifies proof against a SHA-256 sealed rubric, while your friend holds final appeal authority.
        </p>

        {/* Hero Actions */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-3">
          <Link
            href="/new"
            className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            <span>Create Commitment Pledge</span>
            <span>→</span>
          </Link>
          <Link
            href="/stats"
            className="w-full sm:w-auto px-5 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-sm rounded-xl shadow-md transition-all"
          >
            Reliability Analytics
          </Link>
          <Link
            href="/admin/demo"
            className="w-full sm:w-auto px-4 py-3.5 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800/60 font-semibold text-sm rounded-xl transition-all"
          >
            Judge Flight Deck
          </Link>
        </div>

        {/* 3 Core Pillars */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="p-5 bg-slate-900/70 border border-slate-800/80 rounded-2xl backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 border border-indigo-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-white">PayPal Hold Escrow</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Funds are held on your PayPal balance or linked Visa card. Succeeded goals void the hold immediately. Capped at 50.00 USD (sandbox).
            </p>
          </div>

          <div className="p-5 bg-slate-900/70 border border-slate-800/80 rounded-2xl backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-white">Two-Signal Referee</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              GitHub commit filtering (merges dropped) or photo challenge codes evaluated with Levenshtein distance ≤ 1.
            </p>
          </div>

          <div className="p-5 bg-slate-900/70 border border-slate-800/80 rounded-2xl backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3 border border-purple-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-white">SHA-256 Chained Ledger</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Every transition and PayPal ID is chained from 64 zeros. Append-only triggers prevent any database mutation.
            </p>
          </div>
        </div>
      </section>

      {/* Sprints Board */}
      <section className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Sprints & Commitment Contracts</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live status of contracts locked under PayPal honor periods
            </p>
          </div>
          <Link
            href="/new"
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 rounded-xl transition-colors"
          >
            + New Pledge
          </Link>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading commitments...
          </div>
        ) : pledges.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm space-y-4 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-white">No active commitments yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Create a pledge or seed realistic demo contracts to explore the complete referee and PayPal hold flow.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <Link
                href="/new"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30"
              >
                Create Pledge
              </Link>
              <Link
                href="/admin/demo"
                className="px-4 py-2 bg-purple-950/70 hover:bg-purple-900/70 text-purple-300 border border-purple-800/80 rounded-xl text-xs font-bold"
              >
                Seed Demo Sprints
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pledges.map((p) => {
              const formatted = `${(p.stake_cents / 100).toFixed(2)} USD (sandbox)`;
              const cfg = statusConfig[p.status] || {
                label: p.status,
                badge: 'bg-slate-800 text-slate-300 border-slate-700',
                dot: 'bg-slate-400',
              };

              return (
                <div
                  key={p.id}
                  className="p-5 border border-slate-800/80 rounded-2xl hover:border-indigo-500/40 hover:bg-slate-850/60 transition-all bg-slate-900/60 space-y-4 shadow-md"
                >
                  <div className="flex justify-between items-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${cfg.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                    <span className="font-mono font-extrabold text-sm text-indigo-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      {formatted}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-base leading-snug">{p.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      Beneficiary: <span className="font-medium text-slate-300">{p.beneficiary_name}</span> ({p.beneficiary_paypal_email})
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <Link
                      href={`/pledges/${p.id}`}
                      className="font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      Sprint Details →
                    </Link>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/pledges/${p.id}/ledger`}
                        className="text-slate-400 hover:text-white font-mono text-[11px] bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800"
                      >
                        Ledger 📜
                      </Link>
                      {p.status === 'APPEAL_WINDOW_OPEN' && (
                        <Link
                          href={`/referee/${p.id}`}
                          className="text-orange-300 hover:text-orange-200 font-semibold text-[11px] bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/30"
                        >
                          Review Appeal ⚖️
                        </Link>
                      )}
                    </div>
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
