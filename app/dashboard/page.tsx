'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/lib/auth-context';
import { accountRequestHeaders } from '@/app/lib/access';
import { getCachedPledges } from '@/app/lib/local-pledge-cache';

export default function UserDashboardPage() {
  const { user, isReady } = useAuth();
  const [pledges, setPledges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [activeDrawer, setActiveDrawer] = useState<any | null>(null);
  const [usingBrowserBackup, setUsingBrowserBackup] = useState(false);

  useEffect(() => {
    async function loadPledges() {
      let activeUser = user;
      if (!activeUser && typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('stake_auth_user');
          if (stored) activeUser = JSON.parse(stored);
        } catch {}
      }
      const viewer = activeUser || { email: 'user@example.com', role: 'user' as const };
      const cached = getCachedPledges(viewer.email);
      try {
        const res = await fetch('/api/pledges?scope=owner', {
          headers: accountRequestHeaders(viewer),
        });
        if (res.ok) {
          const data = await res.json();
          const remote = data.pledges || [];
          const remoteIds = new Set(remote.map((pledge: any) => pledge.id));
          setPledges([...remote, ...cached.filter((pledge) => !remoteIds.has(pledge.id))]);
          setUsingBrowserBackup(Boolean(cached.length && (!data.persistence || data.persistence !== 'supabase')));
        } else {
          setPledges(cached);
          setUsingBrowserBackup(Boolean(cached.length));
        }
      } catch (e) {
        console.warn('Could not load commitments:', e);
        setPledges(cached);
        setUsingBrowserBackup(Boolean(cached.length));
      } finally {
        setLoading(false);
      }
    }
    if (isReady) loadPledges();
  }, [isReady, user]);

  const filteredPledges = pledges.filter((p) => {
    if (filter === 'active') {
      return ['RUBRIC_LOCKED', 'ACTIVE', 'APPEAL_WINDOW_OPEN'].includes(p.status);
    }
    if (filter === 'completed') {
      return ['SUCCEEDED', 'CAPTURED', 'PAID_OUT', 'CANCELLED'].includes(p.status);
    }
    return true;
  });

  const activePledges = pledges.filter((p) =>
    ['RUBRIC_LOCKED', 'ACTIVE', 'APPEAL_WINDOW_OPEN'].includes(p.status)
  );

  const totalHeldCents = activePledges.reduce(
    (sum, p) => sum + (p.stake_cents || 0),
    0
  );

  const totalReleasedCents = pledges
    .filter((p) => p.status === 'SUCCEEDED')
    .reduce((sum, p) => sum + (p.stake_cents || 0), 0);
  const appointedReferee = activePledges[0]?.referee_email || 'No active referee assigned';

  const statusStyles: Record<string, { label: string; bg: string; text: string }> = {
    RUBRIC_LOCKED: {
      label: 'Hold Authorization Needed',
      bg: 'bg-[#fff8eb] border border-[#fbd38d]',
      text: 'text-[#9a4d00]',
    },
    ACTIVE: {
      label: 'Sprint Active',
      bg: 'bg-[#eef6fc] border border-[#bee3f8]',
      text: 'text-[#0070ba]',
    },
    APPEAL_WINDOW_OPEN: {
      label: 'Referee Review Open',
      bg: 'bg-[#fef2f2] border border-[#fecaca]',
      text: 'text-[#b91c1c]',
    },
    SUCCEEDED: {
      label: 'Goal Succeeded · Hold Released',
      bg: 'bg-[#eafbf3] border border-[#a7f3d0]',
      text: 'text-[#0d7a53]',
    },
    CAPTURED: {
      label: 'Forfeited · Transferred to Beneficiary',
      bg: 'bg-slate-100 border border-slate-200',
      text: 'text-slate-700',
    },
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hallmark Macrostructure: Asymmetric Task Deck */}
      <section className="bg-white border border-[#e2e8f0] rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0070ba]" />
              <span className="text-xs font-bold text-[#003087]">
                PayPal Authorization Escrow
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b192c] tracking-tight">
              Commitment Contracts & Sprint Desk
            </h1>
            <p className="text-sm text-[#475569] leading-relaxed">
              Back your personal milestones with risk-controlled PayPal authorization holds.
              When criteria are satisfied, the temporary hold dissolves without penalty or fees.
            </p>
          </div>

          {/* Action Hub */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
            <Link
              href="/new"
              className="px-5 py-2.5 bg-[#0070ba] hover:bg-[#003087] text-white font-bold text-sm rounded-xl transition-all shadow-xs inline-flex items-center gap-2"
            >
              <span>+ Create Commitment</span>
            </Link>
            <span className="text-xs text-[#64748b]">
              Max sprint window: <strong>48 Hours</strong>
            </span>
          </div>
        </div>

        {/* Financial Flow Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-slate-100 text-xs">
          <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-200/80">
            <span className="text-[#64748b] block font-medium">Currently In Escrow Hold</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-[#003087] font-tabular">
                ${(totalHeldCents / 100).toFixed(2)}
              </span>
              <span className="text-[11px] font-bold text-[#0070ba]">USD</span>
            </div>
            <span className="text-[11px] text-[#64748b] mt-1 block">
              Orders v2 temporary hold across {activePledges.length} sprints
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-200/80">
            <span className="text-[#64748b] block font-medium">Successfully Protected & Released</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-[#0d7a53] font-tabular">
                ${(totalReleasedCents / 100).toFixed(2)}
              </span>
              <span className="text-[11px] font-bold text-[#0d7a53]">Saved</span>
            </div>
            <span className="text-[11px] text-[#64748b] mt-1 block">
              Holds released back to your PayPal balance
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-200/80">
            <span className="text-[#64748b] block font-medium">Appointed Friend Referee</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-base font-bold text-slate-900 truncate">
                {appointedReferee}
              </span>
            </div>
            <span className="text-[11px] text-[#64748b] mt-1 block">
              Final arbiter when ML verdict is borderline
            </span>
          </div>
        </div>
      </section>

      {usingBrowserBackup && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
          <strong>Browser backup active.</strong> This deployment is not reporting shared database persistence, so commitments created in this browser remain visible here. Connect Supabase before sharing the demo across browsers or devices.
        </div>
      )}

      {/* Main Commitment Records */}
      <section className="space-y-4">
        {/* Asymmetric Header with Controls */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#0b192c]">Commitment Records</h2>
            <p className="text-xs text-[#64748b]">
              Track cryptographic proof, sprint expiration, and referee verdicts.
            </p>
          </div>

          <div className="inline-flex items-center gap-1 bg-[#edf2f7] p-1 rounded-xl text-xs font-semibold">
            {(['all', 'active', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  filter === tab
                    ? 'bg-white text-[#003087] shadow-xs font-bold'
                    : 'text-[#475569] hover:text-[#0b192c]'
                }`}
              >
                {tab} ({tab === 'all' ? pledges.length : tab === 'active' ? activePledges.length : pledges.length - activePledges.length})
              </button>
            ))}
          </div>
        </div>

        {/* Commitment Items */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
            Loading commitment ledger records...
          </div>
        ) : filteredPledges.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-600 space-y-3">
            <p className="text-sm font-bold text-slate-900">No commitment records found in this view.</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Start a new goal pledge, specify your rubric, and choose your referee to begin.
            </p>
            <Link
              href="/new"
              className="inline-flex px-4 py-2 bg-[#0070ba] text-white font-bold text-xs rounded-xl"
            >
              + Create Commitment
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPledges.map((p) => {
              const style = statusStyles[p.status] || {
                label: p.status,
                bg: 'bg-slate-50 border border-slate-200',
                text: 'text-slate-700',
              };
              const stakeAmount = ((p.stake_cents || 0) / 100).toFixed(2);

              return (
                <div
                  key={p.id}
                  className="bg-white border border-[#e2e8f0] rounded-2xl p-5 hover:border-[#0070ba] transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${style.bg} ${style.text}`}
                      >
                        {style.label}
                      </span>
                      <span className="text-[11px] font-mono text-[#64748b] bg-[#f8fafc] border border-slate-200 px-2 py-0.5 rounded">
                        Category: {p.goal_type}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#0b192c]">
                      <Link href={`/pledges/${p.id}`} className="hover:text-[#0070ba]">
                        {p.title}
                      </Link>
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748b]">
                      <div>
                        <span>Referee: </span>
                        <strong className="text-slate-800 font-mono text-[11px]">{p.referee_email}</strong>
                      </div>
                      <div>
                        <span>Beneficiary: </span>
                        <strong className="text-slate-800">{p.beneficiary_name}</strong>
                      </div>
                      <div>
                        <span>Expires: </span>
                        <span className="font-mono text-slate-700">
                          {new Date(p.ends_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between md:justify-end gap-3 sm:gap-5 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <div className="flex items-center justify-between sm:block text-left md:text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] block">
                        Commitment Stake
                      </span>
                      <span className="text-lg sm:text-xl font-black text-[#003087] font-tabular">
                        ${stakeAmount}{' '}
                        <span className="text-xs font-semibold text-slate-500">USD</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/pledges/${p.id}`}
                        className="flex-1 sm:flex-initial text-center px-3 py-2 bg-[#f8fafc] hover:bg-slate-100 text-[#0b192c] font-bold text-xs rounded-xl border border-slate-200 transition-colors"
                      >
                        Ledger & Proof
                      </Link>

                      {p.status === 'RUBRIC_LOCKED' && (
                        <Link
                          href={`/pledges/new/checkout/${p.id}`}
                          className="flex-1 sm:flex-initial text-center px-3.5 py-2 bg-[#0070ba] hover:bg-[#003087] text-white font-bold text-xs rounded-xl transition-colors shadow-2xs"
                        >
                          Authorize Hold
                        </Link>
                      )}

                      {p.status === 'ACTIVE' && (
                        <Link
                          href={`/pledges/${p.id}`}
                          className="flex-1 sm:flex-initial text-center px-3.5 py-2 bg-[#0d7a53] hover:bg-[#085a3c] text-white font-bold text-xs rounded-xl transition-colors shadow-2xs"
                        >
                          Submit Proof
                        </Link>
                      )}

                      {p.status === 'APPEAL_WINDOW_OPEN' && (
                        <Link
                          href={`/pledges/${p.id}`}
                          className="flex-1 sm:flex-initial text-center px-3.5 py-2 bg-[#9a4d00] hover:bg-[#7b3d00] text-white font-bold text-xs rounded-xl transition-colors shadow-2xs"
                        >
                          Review Appeal
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

      {/* Protocol Transparency Section */}
      <section className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-[#003087]">
          The Tamper-Evident Referee Protocol
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#475569]">
          <div className="p-4 bg-[#f8fafc] rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block text-sm">1. Canonical Rubric Sealing</span>
            <p>
              Your sprint rubric is normalized into sorted canonical JSON and hashed with SHA-256 before any hold is created.
            </p>
          </div>
          <div className="p-4 bg-[#f8fafc] rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block text-sm">2. Machine Learning Verification</span>
            <p>
              Automated models evaluate commit velocity or visual signals. If borderline, authority transfers directly to your friend.
            </p>
          </div>
          <div className="p-4 bg-[#f8fafc] rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block text-sm">3. Cryptographic Chain Settlement</span>
            <p>
              Every authorization, appeal note, and void/capture event is chained with cryptographic hashes for complete transparency.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
