'use client';

import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if dismissed previously in this session or localStorage
    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
    if (dismissed) return;

    // Detect mobile device
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';
    const mobileCheck = Boolean(
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
      (window.innerWidth <= 768)
    );
    setIsMobile(mobileCheck);

    // Listen for PWA beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (mobileCheck) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // If mobile and not standalone app, show download banner after a short delay
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (mobileCheck && !isStandalone && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else {
      // Guidance if native browser prompt isn't directly interceptable (e.g. iOS Safari)
      alert(
        'To install Stake on iOS/Android:\n\n1. Tap the Share button (iOS) or Menu (Android)\n2. Select "Add to Home Screen"'
      );
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:max-w-sm animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#003087] to-[#0070ba] text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
              P
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-[#003087]">Install Stake App</h4>
                <span className="text-[10px] font-bold font-mono bg-blue-50 text-[#0070ba] px-1.5 py-0.5 rounded border border-blue-200">
                  PWA
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Instant access to your pledges &amp; referee alerts.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-600 p-1 text-sm rounded-lg"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Not now
          </button>
          <button
            onClick={handleInstallClick}
            className="flex-1 py-2 bg-[#0070ba] hover:bg-[#003087] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1"
          >
            <span>Download App</span>
            <span>↓</span>
          </button>
        </div>
      </div>
    </div>
  );
}

