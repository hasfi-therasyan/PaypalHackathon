'use client';

import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
  steps?: string[];
  isOpen?: boolean;
}

const DEFAULT_STEPS = [
  'Validating commitment details...',
  'Computing SHA-256 canonical rubric hash...',
  'Registering cryptographic block to ledger...',
  'Connecting to PayPal Sandbox Checkout...',
];

export function LoadingScreen({
  title = 'Processing Commitment...',
  subtitle = 'Please wait while we secure your commitment and link your PayPal authorization hold.',
  steps = DEFAULT_STEPS,
  isOpen = true,
}: LoadingScreenProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen || steps.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1 < steps.length ? prev + 1 : prev));
    }, 1200);

    return () => clearInterval(interval);
  }, [isOpen, steps]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-6 animate-scaleIn">
        {/* Animated Brand Emblem with Spinner Ring */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          {/* Pulsing outer aura */}
          <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-30" />
          
          {/* Spinning gradient ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#0070ba] border-r-[#003087] animate-spin" />
          
          {/* Inner brand badge */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0070ba] to-[#003087] text-white flex items-center justify-center font-black text-2xl shadow-md">
            P
          </div>
        </div>

        {/* Title and Subtitle */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-[#003087] tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Dynamic Progress Steps */}
        {steps.length > 0 && (
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-left">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0070ba] animate-pulse" />
                Live Settlement Engine
              </span>
              <span className="font-mono text-[#0070ba]">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
            </div>

            {/* Current Active Step */}
            <div className="flex items-center gap-2 pt-1">
              <div className="w-4 h-4 rounded-full border-2 border-transparent border-t-[#0070ba] animate-spin shrink-0" />
              <span className="text-xs font-semibold text-slate-800 truncate">
                {steps[currentStepIndex]}
              </span>
            </div>

            {/* Mini Progress Bar */}
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-gradient-to-r from-[#0070ba] to-[#003087] h-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(100, ((currentStepIndex + 1) / steps.length) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Security & Safe Hold Note */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <span className="text-emerald-600 font-bold">🔒 PayPal Sandbox Verified</span>
          <span>·</span>
          <span>Funds remain safely held</span>
        </div>
      </div>
    </div>
  );
}

