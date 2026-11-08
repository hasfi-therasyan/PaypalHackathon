'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { accountRequestHeaders } from '../lib/access';

interface PayPalWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PayPalWalletModal({ isOpen, onClose }: PayPalWalletModalProps) {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(500);
  const [loading, setLoading] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/paypal/userinfo', {
        headers: accountRequestHeaders(user),
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(typeof data.balance === 'number' ? data.balance : 500);
      }
    } catch (e) {
      console.warn('Failed to fetch balance', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBalance();
    }

    const handleBalanceUpdate = (e: any) => {
      if (typeof e.detail === 'number') {
        setBalance(e.detail);
      } else {
        fetchBalance();
      }
    };

    window.addEventListener('paypal_balance_updated', handleBalanceUpdate);
    return () => window.removeEventListener('paypal_balance_updated', handleBalanceUpdate);
  }, [isOpen, user]);

  function handleCopyCredentials() {
    navigator.clipboard.writeText('Email: sb-buyer@personal.example.com\nPassword: SandboxPassword123!');
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2000);
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0070ba] flex items-center justify-center text-white font-bold text-xl shadow-sm">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#003087]">PayPal Sandbox Wallet</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  VERIFIED
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">sb-buyer@personal.example.com</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Balance Card */}
          <div className="p-5 bg-gradient-to-br from-blue-50/70 to-slate-50 border border-blue-100 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#003087]">
                Available PayPal Balance
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-white px-2 py-0.5 rounded-full border border-emerald-100">
                ● Ready for Stakes
              </span>
            </div>

            <div className="flex justify-between items-baseline">
              <p className="text-3xl font-extrabold text-[#003087] tracking-tight tabular-nums">
                ${balance.toFixed(2)}{' '}
                <span className="text-sm font-semibold text-slate-600 font-sans">USD</span>
              </p>
              <button
                onClick={fetchBalance}
                disabled={loading}
                className="text-xs font-semibold text-[#0070ba] hover:underline"
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

          </div>

          {/* Linked Funding Sources */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Sandbox funding is managed in PayPal Developer
            </span>
            <div className="space-y-2 text-xs">
              {/* PayPal Balance */}
              <div className="p-3 rounded-xl border border-blue-300 bg-blue-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">💳</span>
                  <div>
                    <p className="font-bold text-[#003087]">PayPal Balance</p>
                    <p className="text-slate-500 text-[11px] font-mono tabular-nums">${balance.toFixed(2)} USD Available</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0070ba] text-white">
                  Default
                </span>
              </div>

            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Stake cannot top up or withdraw Sandbox funds. Approving a commitment creates a PayPal Sandbox authorization hold; the buyer account shows the hold and its release or capture.
          </p>

          {/* Sandbox Buyer Credentials */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-700">Sandbox Buyer Credentials:</span>
              <button
                onClick={handleCopyCredentials}
                className="px-2 py-1 rounded text-[11px] font-bold bg-white text-[#0070ba] border border-slate-200 hover:bg-blue-50 transition-colors shadow-xs"
              >
                {copiedCreds ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div className="font-mono text-slate-600 text-[11px] space-y-0.5">
              <p>Email: <span className="text-slate-900 font-semibold">sb-buyer@personal.example.com</span></p>
              <p>Password: <span className="text-slate-900 font-semibold">SandboxPassword123!</span></p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
          >
            Close Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
