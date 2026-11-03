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
    <div className="bg-[#003087] text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 shadow-xs">
      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
      <span>PayPal AI Hackathon 2026</span>
      <span className="opacity-50">·</span>
      <span>Verified Sandbox Authorization Escrow</span>
      <span className="opacity-50">·</span>
      <span className="font-mono bg-blue-900/60 px-2 py-0.5 rounded text-[11px] text-blue-100">
        Orders v2 Intent: AUTHORIZE
      </span>
    </div>
  );
}

