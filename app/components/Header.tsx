'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PayPalWalletModal } from './PayPalWalletModal';

export function Header() {
  const [walletOpen, setWalletOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Platform Title */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black text-white tracking-tight leading-none">Stake</span>
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  SANDBOX
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Commitment Contracts</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/70 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/stats"
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/70 transition-colors"
            >
              Reliability Stats
            </Link>
            <Link
              href="/admin/demo"
              className="hidden sm:inline-flex px-3 py-1.5 text-xs font-semibold text-purple-300 bg-purple-950/50 hover:bg-purple-900/50 rounded-lg border border-purple-800/60 transition-colors"
            >
              Demo Flight Deck
            </Link>

            {/* PayPal Wallet & Balance Pill */}
            <button
              onClick={() => setWalletOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-indigo-500/60 text-xs shadow-sm transition-all"
            >
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                P
              </span>
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-slate-400 leading-tight">PayPal Sandbox</span>
                <span className="text-white font-mono font-bold leading-tight">$500.00 USD</span>
              </div>
            </button>

            {/* Create Pledge Action */}
            <Link
              href="/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <span>+ Create Pledge</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Modal Drawer */}
      <PayPalWalletModal isOpen={walletOpen} onClose={() => setWalletOpen(false)} />
    </>
  );
}

