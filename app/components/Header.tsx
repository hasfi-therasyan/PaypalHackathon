'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PayPalWalletModal } from './PayPalWalletModal';
import { useAuth } from '../lib/auth-context';
import { accountRequestHeaders } from '../lib/access';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [walletOpen, setWalletOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [balance, setBalance] = useState<number>(500);

  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchBal() {
      try {
        const res = await fetch('/api/paypal/userinfo', {
          headers: accountRequestHeaders(user),
        });
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

    const handleBalanceUpdate = (e: any) => {
      if (typeof e.detail === 'number') {
        setBalance(e.detail);
      } else {
        fetchBal();
      }
    };

    window.addEventListener('paypal_balance_updated', handleBalanceUpdate);
    return () => window.removeEventListener('paypal_balance_updated', handleBalanceUpdate);
  }, [walletOpen, user]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#0070ba] to-[#003087] text-white flex items-center justify-center font-serif italic font-black text-base sm:text-lg shadow-xs group-hover:scale-105 transition-transform shrink-0">
              P
            </div>
            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-black text-[#003087] tracking-tight">Stake</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-[#0070ba] border border-blue-200/80 hidden sm:inline-block">
                  SANDBOX
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium hidden md:inline-block mt-0.5">
                Commitment Contracts
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links based on Roles */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
            <Link href="/dashboard" className={navLinkClass('/dashboard')}>
              {isActive('/dashboard') && <span className="w-1.5 h-1.5 rounded-full bg-[#0070ba]" />}
              <span>My Commitments</span>
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

            <Link href="/stats" className={navLinkClass('/stats')}>
              {isActive('/stats') && <span className="w-1.5 h-1.5 rounded-full bg-[#0070ba]" />}
              <span>Stats &amp; ML</span>
            </Link>
          </nav>

          {/* Right Action Controls: PayPal Sandbox Pill, New Commitment, Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* PayPal Sandbox Wallet Chip / Button */}
            <button
              type="button"
              onClick={() => setWalletOpen(true)}
              className="group flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2.5 pr-2.5 sm:pr-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-50/90 via-white to-blue-50/50 hover:from-blue-100/80 hover:to-blue-50/80 border border-blue-200/90 hover:border-[#0070ba] transition-all shadow-2xs hover:shadow-xs active:scale-95 text-left"
              title="Open PayPal Sandbox Escrow Wallet"
            >
              {/* PayPal Monogram */}
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-[#0070ba] group-hover:bg-[#003087] text-white flex items-center justify-center font-serif italic font-black text-xs sm:text-sm shadow-xs transition-colors shrink-0">
                P
              </div>

              {/* Label & Live Tabular Balance */}
              <div className="flex flex-col text-left leading-none">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#003087] tracking-tight uppercase">
                    PayPal
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200/80">
                    SANDBOX
                  </span>
                </div>
                <div className="flex items-baseline gap-0.5 mt-0.5">
                  <span className="text-xs sm:text-sm font-mono font-black text-slate-900 tracking-tight tabular-nums">
                    ${balance.toFixed(2)}
                  </span>
                  <span className="text-[9px] font-sans font-semibold text-slate-400 hidden xs:inline">
                    USD
                  </span>
                </div>
              </div>

              {/* Quick Arrow Indicator */}
              <span className="text-slate-300 group-hover:text-[#0070ba] text-[10px] transition-colors hidden sm:inline ml-0.5">
                ▾
              </span>
            </button>

            {/* Desktop "+ New Commitment" Action */}
            <Link
              href="/new"
              className={`hidden md:inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold rounded-xl shadow-2xs transition-all ${
                isActive('/new')
                  ? 'bg-[#003087] text-white ring-2 ring-[#003087]/20'
                  : 'bg-[#0070ba] hover:bg-[#003087] text-white hover:shadow-xs active:scale-95'
              }`}
            >
              <span className="text-sm font-black leading-none">+</span>
              <span>New Commitment</span>
            </Link>

            {/* User Profile / Auth Widget */}
            <div className="relative pl-1 sm:pl-2 border-l border-slate-200" ref={profileMenuRef}>
              {user ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                    title="Account details and settings"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-100 text-[#003087] font-bold text-xs sm:text-sm flex items-center justify-center uppercase shadow-2xs shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div className="hidden lg:flex flex-col text-left leading-none">
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[110px]">
                        {user.name}
                      </span>
                      <span className="text-[9px] font-mono font-semibold uppercase text-[#0070ba] mt-0.5">
                        [{user.role}]
                      </span>
                    </div>
                    <span className="text-slate-400 text-[10px] hidden sm:inline">▾</span>
                  </button>

                  {/* Profile Popup Widget */}
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-24px)] bg-white border border-slate-200 rounded-2xl shadow-xl py-3 z-50 animate-fadeIn">
                      {/* User Info Header */}
                      <div className="px-4 pb-3 border-b border-slate-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-blue-50 text-[#0070ba] border border-blue-200">
                            {user.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono truncate">{user.email}</p>
                      </div>

                      {/* Menu Actions */}
                      <div className="py-1 text-xs">
                        <Link
                          href="/dashboard"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#0070ba] transition-colors"
                        >
                          <span>📋</span>
                          <span>My Commitments Desk</span>
                        </Link>

                        <Link
                          href="/new"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#0070ba] transition-colors"
                        >
                          <span>➕</span>
                          <span>New Commitment</span>
                        </Link>

                        {(user.role === 'referee' || user.role === 'admin' || user.isRefereeAssigned) && (
                          <Link
                            href="/referee"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
                          >
                            <span>⚖️</span>
                            <span>Referee Tribunal</span>
                          </Link>
                        )}

                        {user.role === 'admin' && (
                          <Link
                            href="/admin"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#003087] transition-colors"
                          >
                            <span>🛡️</span>
                            <span>Admin Suite &amp; Ledger</span>
                          </Link>
                        )}

                        <Link
                          href="/stats"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#0070ba] transition-colors"
                        >
                          <span>📊</span>
                          <span>Stats &amp; ML Models</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            setWalletOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#0070ba] transition-colors text-left"
                        >
                          <span>💰</span>
                          <span>PayPal Sandbox Escrow</span>
                        </button>

                        <Link
                          href="/login"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#0070ba] transition-colors"
                        >
                          <span>🔄</span>
                          <span>Switch Account / Sign In</span>
                        </Link>
                      </div>

                      {/* Log Out Button */}
                      <div className="pt-2 px-3 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setProfileMenuOpen(false);
                            logout();
                            router.push('/login');
                          }}
                          className="w-full py-2 px-3 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                          <span>🚪</span>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-3 py-1.5 bg-[#003087] hover:bg-[#0070ba] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs shrink-0"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sticky Bottom Navigation Bar (app-like experience) */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-lg">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all ${
            isActive('/dashboard') ? 'text-[#0070ba]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span className="text-base">📋</span>
          <span>Goals</span>
        </Link>

        {(user?.role === 'referee' || user?.role === 'admin' || user?.isRefereeAssigned) ? (
          <Link
            href="/referee"
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all ${
              isActive('/referee') ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="text-base">⚖️</span>
            <span>Referee</span>
          </Link>
        ) : (
          <Link
            href="/stats"
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all ${
              isActive('/stats') ? 'text-[#0070ba]' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="text-base">📊</span>
            <span>Stats</span>
          </Link>
        )}

        {/* Center Prominent "+ New" Action */}
        <Link
          href="/new"
          className="flex flex-col items-center -mt-4 bg-gradient-to-br from-[#0070ba] to-[#003087] active:scale-95 text-white px-3.5 py-2 rounded-2xl shadow-md transition-all"
        >
          <span className="text-base font-black leading-none">+</span>
          <span className="text-[10px] font-bold">New</span>
        </Link>

        {/* Wallet trigger */}
        <button
          type="button"
          onClick={() => setWalletOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-[#0070ba] transition-all"
        >
          <span className="text-base">💰</span>
          <span>Wallet</span>
        </button>

        {/* Account / Profile toggle */}
        {user ? (
          <button
            type="button"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-all"
          >
            <span className="text-base">👤</span>
            <span>Account</span>
          </button>
        ) : (
          <Link
            href="/login"
            className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-all"
          >
            <span className="text-base">👤</span>
            <span>Sign In</span>
          </Link>
        )}
      </nav>

      {/* Wallet Modal */}
      <PayPalWalletModal
        isOpen={walletOpen}
        onClose={() => setWalletOpen(false)}
      />
    </>
  );
}
