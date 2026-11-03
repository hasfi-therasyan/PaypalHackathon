'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PayPalWalletModal } from './PayPalWalletModal';
import { TopUpWidget } from './TopUpWidget';
import { useAuth } from '../lib/auth-context';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [walletOpen, setWalletOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [balance, setBalance] = useState<number>(500);

  useEffect(() => {
    async function fetchBal() {
      try {
        const res = await fetch('/api/paypal/userinfo');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.balance === 'number') {
            setBalance(data.balance);
          }
        }
      } catch (e) {
        // Fallback default balance
      }
    }
    fetchBal();
  }, [walletOpen, topUpOpen]);

  // Hide the entire top bar on the root landing page (/)
  if (pathname === '/') {
    return null;
  }

  /** Returns true if the current pathname matches or starts with the given href */
  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  }

  /** Base + active classes for a nav link */
  function navLinkClass(href: string, variant: 'default' | 'referee' | 'admin' = 'default'): string {
    const active = isActive(href);
    const base = 'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1';

    if (variant === 'referee') {
      return active
        ? `${base} text-emerald-700 bg-emerald-50 border border-emerald-300 shadow-sm`
        : `${base} text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50 border border-transparent`;
    }

    if (variant === 'admin') {
      return active
        ? `${base} text-[#003087] bg-blue-50 border border-blue-300 shadow-sm`
        : `${base} text-slate-600 hover:text-[#003087] hover:bg-blue-50/50 border border-transparent`;
    }

    // default variant
    return active
      ? `${base} text-[#0070ba] bg-blue-50 border border-blue-200 shadow-sm`
      : `${base} text-slate-600 hover:text-[#0070ba] hover:bg-slate-50 border border-transparent`;
  }

  function handleTopUpComplete(amount: number) {
    setBalance((prev) => prev + amount);
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#0070ba] text-white flex items-center justify-center font-bold text-lg shadow-xs group-hover:bg-[#003087] transition-colors">
              P
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-[#003087] tracking-tight leading-none">Stake</span>
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-blue-50 text-[#0070ba] border border-blue-200">
                  SANDBOX
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Commitment Contracts</span>
            </div>
          </Link>

          {/* Navigation Links based on Roles */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <Link href="/dashboard" className={navLinkClass('/dashboard')}>
              {isActive('/dashboard') && <span className="w-1.5 h-1.5 rounded-full bg-[#0070ba]" />}
              My Commitments
            </Link>

            {/* Referee Tab visible if user is admin, appointed referee role, OR dynamically assigned on an active pledge */}
            {(user?.role === 'referee' || user?.role === 'admin' || user?.isRefereeAssigned) && (
              <Link href="/referee" className={navLinkClass('/referee', 'referee')}>
                {isActive('/referee') && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                <span>Referee Panel</span>
                {user?.isRefereeAssigned && user?.role === 'user' && (
                  <span className="text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded ml-1">
                    ASSIGNED
                  </span>
                )}
              </Link>
            )}

            {/* Admin Tab visible if user is admin */}
            {user?.role === 'admin' && (
              <Link href="/admin" className={navLinkClass('/admin', 'admin')}>
                {isActive('/admin') && <span className="w-1.5 h-1.5 rounded-full bg-[#003087]" />}
                <span>Admin Suite</span>
              </Link>
            )}

            <Link href="/stats" className={`hidden md:inline-flex ${navLinkClass('/stats')}`}>
              {isActive('/stats') && <span className="w-1.5 h-1.5 rounded-full bg-[#0070ba]" />}
              Stats &amp; ML
            </Link>

            {/* PayPal Sandbox Wallet Button */}
            <button
              onClick={() => setWalletOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 hover:border-[#0070ba] hover:bg-blue-100/60 text-xs transition-all shadow-2xs"
              title="Open PayPal Sandbox Wallet"
            >
              <span className="w-5 h-5 rounded-full bg-[#0070ba] text-white font-bold text-[10px] flex items-center justify-center">
                P
              </span>
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-[#003087] font-semibold leading-tight">PayPal Sandbox</span>
                <span className="text-slate-900 font-mono font-bold leading-tight tabular-nums">
                  ${balance.toFixed(2)} USD
                </span>
              </div>
            </button>

            {/* Create Commitment Button */}
            <Link
              href="/new"
              className={`hidden sm:inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold rounded-xl shadow-2xs transition-all ${
                isActive('/new')
                  ? 'bg-[#003087] text-white'
                  : 'bg-[#0070ba] hover:bg-[#003087] text-white'
              }`}
            >
              <span>+ New Commitment</span>
            </Link>

            {/* User Profile / Auth Switcher */}
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
              {user ? (
                <div className="flex items-center gap-1.5">
                  <Link
                    href="/login"
                    className="flex flex-col text-right hover:opacity-80 transition-opacity"
                    title="Click to Switch User Role or Account"
                  >
                    <span className="text-[11px] font-bold text-slate-900 leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[9px] font-mono font-semibold uppercase text-[#0070ba] leading-tight">
                      [{user.role}]
                    </span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      router.push('/login');
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded text-xs"
                    title="Sign Out"
                  >
                    🚪
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-3 py-1.5 bg-[#003087] text-white text-xs font-bold rounded-lg hover:bg-[#0070ba] transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Wallet Modal */}
      <PayPalWalletModal
        isOpen={walletOpen}
        onClose={() => setWalletOpen(false)}
        onTopUp={() => {
          setWalletOpen(false);
          setTopUpOpen(true);
        }}
      />

      {/* Top Up Widget */}
      <TopUpWidget
        isOpen={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        currentBalance={balance}
        onTopUpComplete={handleTopUpComplete}
      />
    </>
  );
}
