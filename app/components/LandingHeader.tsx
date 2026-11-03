'use client';

import React from 'react';
import Link from 'next/link';

export function LandingHeader() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#0070ba] text-white flex items-center justify-center font-black text-base group-hover:bg-[#003087] transition-colors">
            P
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black text-[#002244] tracking-tight">Stake</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#0070ba] border border-blue-200">
              SANDBOX
            </span>
          </div>
        </Link>

        {/* In-page Anchor Nav */}
        <nav className="hidden sm:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <button
            onClick={() => scrollTo('hero')}
            className="hover:text-[#0070ba] transition-colors"
          >
            What is Stake?
          </button>
          <button
            onClick={() => scrollTo('how-it-works')}
            className="hover:text-[#0070ba] transition-colors"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollTo('roles')}
            className="hover:text-[#0070ba] transition-colors"
          >
            Who It's For
          </button>
          <button
            onClick={() => scrollTo('security')}
            className="hover:text-[#0070ba] transition-colors"
          >
            Safety Guarantee
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-[#003087] rounded-lg transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-[#0070ba] hover:bg-[#003087] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            Open Dashboard →
          </Link>
        </div>
      </div>
    </header>
  );
}
