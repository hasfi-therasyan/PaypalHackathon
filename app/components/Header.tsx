'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PayPalWalletModal } from './PayPalWalletModal';
import { useAuth } from '../lib/auth-context';

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
  }, [walletOpen]);

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

            {/* User Profile / Auth Widget */}
            <div className="relative pl-2 border-l border-slate-200" ref={profileMenuRef}>
              {user ? (
                <div>
                  <button
                    onClick={() => setProfileMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100/80 transition-colors border border-transparent hover:border-slate-200"
                    title="Account details and settings"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#003087] font-bold text-xs flex items-center justify-center uppercase">
                      {user.name.charAt(0)}
                    </div>
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-[11px] font-bold text-slate-900 leading-tight">
                        {user.name}
                      </span>
                      <span className="text-[9px] font-mono font-semibold uppercase text-[#0070ba] leading-tight">
                        [{user.role}]
                      </span>
                    </div>
                    <span className="text-slate-400 text-[10px]">▼</span>
                  </button>

                  {/* Profile Popup Widget */}
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-3 z-50">
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
                  className="px-3.5 py-1.5 bg-[#003087] hover:bg-[#0070ba] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
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
      />
    </>
  );
}
