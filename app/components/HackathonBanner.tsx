'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export function HackathonBanner() {
  const pathname = usePathname();

  // Hide banner on the landing page (/)
  if (pathname === '/') {
    return null;
  }

  return (
    <div className="bg-[#003087] text-white text-[11px] sm:text-xs py-1.5 sm:py-2 px-3 sm:px-4 text-center font-medium flex items-center justify-center gap-1.5 sm:gap-2 shadow-xs">
      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 inline-block animate-pulse shrink-0" />
      <span className="font-bold tracking-tight">PayPal AI Hackathon 2026</span>
      <span className="opacity-40">·</span>
      <span className="hidden sm:inline">Verified Sandbox Authorization Escrow</span>
      <span className="hidden sm:inline opacity-40">·</span>
      <span className="font-mono bg-blue-900/80 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] text-blue-100 font-bold border border-blue-400/20 shrink-0">
        Orders v2: AUTHORIZE
      </span>
    </div>
  );
}

