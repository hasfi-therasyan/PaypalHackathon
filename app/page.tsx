'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/lib/auth-context';
import { LandingHeader } from './components/LandingHeader';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* 1. Header with clear, friendly in-page navigation */}
      <LandingHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-20 text-[#0b192c]">
        {/* 2. HERO: Warm, clear, human value proposition */}
        <section id="hero" className="bg-white border border-[#e2e8f0] rounded-3xl p-8 sm:p-14 shadow-xs relative">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#eef6fc] border border-[#bee3f8] text-[#003087] text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-[#0d7a53] animate-pulse" />
              <span>PAYPAL AI HACKATHON 2026 · SANDBOX DEMO</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-[#002244] tracking-tight leading-tight">
              Stick to your goals. <br />
              <span className="text-[#0070ba]">Risk nothing when you succeed.</span>
            </h1>

            <p className="text-base sm:text-xl text-[#475569] leading-relaxed max-w-2xl font-normal">
              Most goals fail because there are no real consequences for procrastinating.
              Stake lets you set a personal challenge and back it with a temporary PayPal hold.
              Complete your goal on time, and your money is instantly returned—no fees, no catches.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              {user ? (
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-7 py-3.5 bg-[#0070ba] hover:bg-[#003087] text-white font-bold rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <span>Go to My Dashboard</span>
                  <span>→</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto px-7 py-3.5 bg-[#0070ba] hover:bg-[#003087] text-white font-bold rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-2"
                  >
                    <span>Get Started</span>
                    <span>→</span>
                  </Link>
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-2xs"
                  >
                    <span>See Demo Commitments</span>
                  </Link>
                </>
              )}
            </div>

            {/* Clear guarantees in plain human English */}
            <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-[#64748b] font-medium">
              <span className="flex items-center gap-1.5">
                <span className="text-[#0d7a53] font-bold">✓</span>
                <span>It's a temporary hold, not an upfront charge</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#0d7a53] font-bold">✓</span>
                <span>5-minute cancellation window if you change your mind</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#0d7a53] font-bold">✓</span>
                <span>Choose a friend as referee to make the final call</span>
              </span>
            </div>
          </div>
        </section>

        {/* 3. HOW IT WORKS: Conversational 3 Steps */}
        <section id="how-it-works" className="space-y-6 scroll-mt-24">
          <div className="space-y-1">
            <span className="text-xs font-bold font-mono uppercase text-[#0070ba] tracking-wider">
              Simple Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002244] tracking-tight">
              How Stake Works in 3 Simple Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 bg-white border border-[#e2e8f0] rounded-2xl shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#eef6fc] text-[#0070ba] font-mono font-bold text-sm flex items-center justify-center border border-[#bee3f8]">
                01
              </div>
              <h3 className="font-bold text-base text-[#003087]">Set Your Goal &amp; Stake</h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Choose what you want to accomplish (e.g. 5 GitHub commits, hitting the gym, or finishing a project). Choose how much you want to stake ($0 up to $50) and a deadline within 48 hours.
              </p>
            </div>

            <div className="p-6 bg-white border border-[#e2e8f0] rounded-2xl shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#eafbf3] text-[#0d7a53] font-mono font-bold text-sm flex items-center justify-center border border-[#a7f3d0]">
                02
              </div>
              <h3 className="font-bold text-base text-[#003087]">Approve the Hold</h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Log in with PayPal Sandbox and approve a temporary authorization hold. <strong>No money is taken from your balance</strong>—it is simply reserved in escrow while you work on your goal.
              </p>
            </div>

            <div className="p-6 bg-white border border-[#e2e8f0] rounded-2xl shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#fff8eb] text-[#9a4d00] font-mono font-bold text-sm flex items-center justify-center border border-[#fbd38d]">
                03
              </div>
              <h3 className="font-bold text-base text-[#003087]">Submit Proof &amp; Unlock</h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Upload your evidence before the deadline. Once verified, the PayPal hold is canceled immediately and your funds are 100% untouched. If you give up, the stake goes to your chosen friend or charity.
              </p>
            </div>
          </div>
        </section>

        {/* 4. ROLES: Who is involved */}
        <section id="roles" className="bg-white border border-[#e2e8f0] rounded-3xl p-8 sm:p-12 shadow-xs space-y-8 scroll-mt-24">
          <div className="space-y-1 max-w-xl">
            <span className="text-xs font-bold font-mono uppercase text-[#0070ba] tracking-wider">
              Who It's For
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002244] tracking-tight">
              Three Roles, One Fair System
            </h2>
            <p className="text-xs sm:text-sm text-[#475569]">
              Every account has its own tailored view so the process is clear, transparent, and fair for everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">For Goal Setters</span>
                <span className="font-mono text-[10px] bg-blue-50 text-[#0070ba] px-2 py-0.5 rounded font-bold border border-blue-200">YOU</span>
              </div>
              <h4 className="font-bold text-base text-[#003087]">User Dashboard</h4>
              <p className="text-[#475569] leading-relaxed">
                Track all your active goals in one clean view. See your protected funds, attach GitHub commits or photo evidence, and celebrate completed milestones.
              </p>
              <Link href="/dashboard" className="inline-block font-bold text-[#0070ba] hover:underline pt-1">
                Explore Dashboard →
              </Link>
            </div>

            <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">For Accountability</span>
                <span className="font-mono text-[10px] bg-emerald-50 text-[#0d7a53] px-2 py-0.5 rounded font-bold border border-emerald-200">FRIEND</span>
              </div>
              <h4 className="font-bold text-base text-[#003087]">Referee Panel</h4>
              <p className="text-[#475569] leading-relaxed">
                Appoint a trusted friend or mentor to review your evidence. If automated verification isn't sure, your referee has the final word to approve your success.
              </p>
              <Link href="/referee" className="inline-block font-bold text-[#0d7a53] hover:underline pt-1">
                See Referee Panel →
              </Link>
            </div>

            <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">For Transparency</span>
                <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold border border-slate-300">AUDIT</span>
              </div>
              <h4 className="font-bold text-base text-[#003087]">Admin &amp; Verification</h4>
              <p className="text-[#475569] leading-relaxed">
                Every transaction and decision is recorded in an open ledger with verifiable PayPal transaction IDs, so you always know your money was handled honestly.
              </p>
              <Link href="/admin" className="inline-block font-bold text-[#003087] hover:underline pt-1">
                View Admin Suite →
              </Link>
            </div>
          </div>
        </section>

        {/* 5. SAFETY GUARANTEE: Easy to understand peace of mind */}
        <section id="security" className="bg-[#f8fafc] border border-[#e2e8f0] rounded-3xl p-8 sm:p-12 shadow-xs space-y-6 scroll-mt-24">
          <div className="space-y-1 max-w-xl">
            <span className="text-xs font-bold font-mono uppercase text-[#0070ba] tracking-wider">
              Safety First
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002244] tracking-tight">
              Why Your Money is Always Safe
            </h2>
            <p className="text-xs sm:text-sm text-[#475569]">
              We built Stake using PayPal's official authorization API so you stay completely in control.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-2">
              <span className="text-[#003087] font-bold text-sm block">Funds Never Leave Until a Verdict</span>
              <p className="text-[#475569] leading-relaxed">
                Unlike apps that take your money upfront and make you wait for a refund, PayPal authorization simply places a temporary hold on your account. The moment you succeed, the hold vanishes.
              </p>
            </div>
            <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-2">
              <span className="text-[#003087] font-bold text-sm block">Clear &amp; Unbreakable Rules</span>
              <p className="text-[#475569] leading-relaxed">
                Your goals and success criteria are locked in before the sprint starts. No one can move the goalposts or change the rules halfway through your challenge.
              </p>
            </div>
          </div>
        </section>

        {/* 6. FRIENDLY CALL TO ACTION FOOTER */}
        <section className="bg-[#002244] text-white rounded-3xl p-8 sm:p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to crush your next challenge?
            </h3>
            <p className="text-blue-200 text-xs sm:text-sm max-w-lg">
              Set up your first goal in less than a minute. Try it risk-free using our simulated PayPal Sandbox.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              href="/new"
              className="px-6 py-3.5 bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
            >
              Start a Commitment
            </Link>
            <Link
              href="/login"
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-colors border border-white/20"
            >
              Sign In
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
