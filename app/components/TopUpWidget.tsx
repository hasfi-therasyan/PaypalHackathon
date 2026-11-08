'use client';

import React, { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { accountRequestHeaders } from '../lib/access';

interface TopUpWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onTopUpComplete: (amount: number) => void;
}

export function TopUpWidget({ isOpen, onClose, currentBalance, onTopUpComplete }: TopUpWidgetProps) {
  const { user } = useAuth();
  const [customAmount, setCustomAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const presetAmounts = [10, 25, 50, 100];

  async function handleTopUp(amount: number) {
    if (amount <= 0 || amount > 500) return;
    setProcessing(true);
    setSuccess(null);

    try {
      const res = await fetch('/api/paypal/userinfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...accountRequestHeaders(user) },
        body: JSON.stringify({ action: 'topup', amount }),
      });
      const data = await res.json();
      if (typeof data.balance === 'number') {
        window.dispatchEvent(
          new CustomEvent('paypal_balance_updated', { detail: data.balance })
        );
      }
    } catch (e) {
      // Fallback
    }

    onTopUpComplete(amount);
    setProcessing(false);
    setSuccess(`+$${amount.toFixed(2)} USD added to sandbox balance`);
    setCustomAmount('');
    setTimeout(() => setSuccess(null), 3000);
  }

  function handleCustomTopUp() {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) return;
    handleTopUp(Math.min(amount, 500));
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Widget Card */}
      <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Blue header strip */}
        <div className="bg-gradient-to-r from-[#003087] to-[#0070ba] px-6 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-base">Top Up Sandbox</h3>
              <p className="text-blue-100 text-xs mt-0.5">Add funds to your PayPal sandbox wallet</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Current balance pill */}
          <div className="mt-3 inline-flex items-center gap-2 bg-white/15 rounded-lg px-3 py-1.5">
            <span className="text-blue-100 text-xs">Current Balance:</span>
            <span className="text-white font-bold font-mono tabular-nums text-sm">
              ${currentBalance.toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Success Message */}
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl font-medium flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </div>
          )}

          {/* Quick Amount Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Quick Add
            </label>
            <div className="grid grid-cols-4 gap-2">
              {presetAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleTopUp(amt)}
                  disabled={processing}
                  className="py-2.5 rounded-xl border border-slate-200 bg-white hover:border-[#0070ba] hover:bg-blue-50 text-sm font-bold text-slate-700 hover:text-[#003087] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  +${amt}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Custom Amount
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                <input
                  type="number"
                  min="1"
                  max="500"
                  step="0.01"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono tabular-nums text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0070ba]/20 focus:border-[#0070ba] transition-colors"
                />
              </div>
              <button
                onClick={handleCustomTopUp}
                disabled={processing || !customAmount || parseFloat(customAmount) <= 0}
                className="px-4 py-2.5 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold text-sm rounded-xl shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding…
                  </span>
                ) : (
                  'Add'
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">Maximum sandbox top-up: $500.00 per transaction</p>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-slate-600">
            <svg className="w-4 h-4 shrink-0 text-[#0070ba] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Sandbox funds are simulated and have no real monetary value.
              Top-ups are applied instantly for demo purposes.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

