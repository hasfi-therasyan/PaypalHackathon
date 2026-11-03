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
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
    },
    ACTIVE: {
      label: 'Hold Active',
      badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      dot: 'bg-indigo-600 animate-pulse',
    },
    APPEAL_WINDOW_OPEN: {
      label: 'Appeal Open',
      badge: 'bg-orange-50 text-orange-800 border-orange-200',
      dot: 'bg-orange-500 animate-pulse',
    },
    SUCCEEDED: {
      label: 'Succeeded (Voided)',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    CAPTURED: {
      label: 'Hold Captured',
      badge: 'bg-rose-50 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
    },
    PAID_OUT: {
      label: 'Paid Out',
      badge: 'bg-slate-100 text-slate-800 border-slate-300',
      dot: 'bg-slate-500',
    },
    CANCELLED: {
      label: 'Grace Cancelled',
      badge: 'bg-slate-100 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
    },
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative text-center py-12 sm:py-16 max-w-3xl mx-auto px-4">
        {/* Glow backdrop */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="w-[360px] h-[240px] bg-indigo-500/10 rounded-full blur-3xl transform -translate-y-6" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>PayPal AI Hackathon 2026</span>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-indigo-600">intent: AUTHORIZE</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
          Put money where <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-800">
            your promise is.
          </span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto font-normal">
          A high-trust commitment-contract platform. A PayPal authorization hold backs your sprint,
          an automated referee verifies your proof against a SHA-256 frozen rubric, and a friend has final appeal say.
        </p>

        {/* Hero CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-3">
          <Link
            href="/new"
            className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Create Commitment Pledge</span>
            <span>→</span>
          </Link>
          <Link
            href="/stats"
            className="w-full sm:w-auto px-5 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl shadow-sm transition-all"
          >
            View Reliability Stats
          </Link>
          <Link
            href="/admin/demo"
            className="w-full sm:w-auto px-4 py-3.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 font-semibold text-sm rounded-xl transition-all"
          >
            Admin Demo Console
          </Link>
        </div>

        {/* 3 Value Pillars */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-900">PayPal Authorization Hold</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Funds are held, not charged. Succeeded sprints immediately void the hold. Capped at 50.00 USD (sandbox).
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Two-Signal Verification</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              GitHub commit filtering (merges dropped) or photo challenge codes evaluated with Levenshtein distance ≤ 1.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-900">SHA-256 Chained Ledger</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Every decision and PayPal ID is chained from 64 zeros. Append-only triggers prevent any tampering.
            </p>
          </div>
        </div>
      </section>

      {/* Sprints Board */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Sprints & Commitment Contracts</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status of contracts locked under PayPal honor periods
            </p>
          </div>
          <Link
            href="/new"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
          >
            + New Pledge
          </Link>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading commitments...
          </div>
        ) : pledges.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm space-y-4 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-slate-700">No commitment contracts found</p>
              <p className="text-xs text-slate-400 mt-1">
                Create your first sprint pledge or seed realistic demo contracts for instant evaluation.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <Link
                href="/new"
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Create Pledge
              </Link>
              <Link
                href="/admin/demo"
                className="px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold"
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
                badge: 'bg-slate-100 text-slate-700 border-slate-200',
                dot: 'bg-slate-400',
              };

              return (
                <div
                  key={p.id}
                  className="p-5 border border-slate-200/90 rounded-2xl hover:border-indigo-300 hover:shadow-sm transition-all bg-slate-50/40 space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${cfg.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                    <span className="font-extrabold text-sm text-indigo-700 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                      {formatted}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">{p.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      Beneficiary: <span className="font-medium text-slate-700">{p.beneficiary_name}</span> ({p.beneficiary_paypal_email})
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
                    <Link
                      href={`/pledges/${p.id}`}
                      className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      Sprint Details →
                    </Link>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/pledges/${p.id}/ledger`}
                        className="text-slate-500 hover:text-slate-800 font-mono text-[11px] bg-white px-2 py-1 rounded border border-slate-200"
                      >
                        Ledger 📜
                      </Link>
                      {p.status === 'APPEAL_WINDOW_OPEN' && (
                        <Link
                          href={`/referee/${p.id}`}
                          className="text-orange-700 hover:text-orange-900 font-semibold text-[11px] bg-orange-50 px-2 py-1 rounded border border-orange-200"
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
