'use client';

import React from 'react';
import Link from 'next/link';

export function LandingHero() {
  return (
    <div className="bg-gradient-to-b from-white to-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-12 mb-8 shadow-xs">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#003087] text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>PayPal AI Hackathon 2026 Submission</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl sm:text-5xl font-black text-[#002244] tracking-tight leading-tight">
          Achieve your goals with real skin in the game.
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Commit to coding sprints, daily habits, and personal milestones. Backed by safe
          PayPal authorization holds that release in full when you succeed.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/new"
            className="w-full sm:w-auto px-6 py-3.5 bg-[#0070ba] hover:bg-[#003087] text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span>Create a Commitment</span>
            <span>→</span>
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
          >
            <span>Sign In / Sign Up</span>
          </Link>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-slate-200 text-left">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0070ba] flex items-center justify-center font-bold text-sm mb-2">
              1
            </div>
            <h4 className="font-bold text-sm text-[#003087]">PayPal Authorization</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Funds are reserved as an authorization hold, never charged unless forfeited.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm mb-2">
              2
            </div>
            <h4 className="font-bold text-sm text-[#003087]">Verifiable Proof</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              GitHub activity and category-specific photo evidence inspected with clear reasoning.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm mb-2">
              3
            </div>
            <h4 className="font-bold text-sm text-[#003087]">Friend Referee Appeal</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Appoint a trusted friend who holds final veto authority on edge cases.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

