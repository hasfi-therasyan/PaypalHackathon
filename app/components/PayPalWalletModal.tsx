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
  const [startingBalance, setStartingBalance] = useState<number>(500);
  const [heldBalance, setHeldBalance] = useState<number>(0);
  const [activeHoldsCount, setActiveHoldsCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Top Up state
  const [topUpAmount, setTopUpAmount] = useState<string>('50');
  const [toppingUp, setToppingUp] = useState(false);
  const [topUpSuccess, setTopUpSuccess] = useState<string | null>(null);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/paypal/userinfo', {
        headers: accountRequestHeaders(user),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.balance === 'number') setBalance(data.balance);
        if (typeof data.startingBalance === 'number') setStartingBalance(data.startingBalance);
        if (typeof data.heldBalance === 'number') setHeldBalance(data.heldBalance);
        if (typeof data.activeHoldsCount === 'number') setActiveHoldsCount(data.activeHoldsCount);
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
      }
      fetchBalance();
    };

    window.addEventListener('paypal_balance_updated', handleBalanceUpdate);
    return () => window.removeEventListener('paypal_balance_updated', handleBalanceUpdate);
  }, [isOpen, user]);

  async function handleTopUp(amountToAdd?: number) {
    const amount = amountToAdd ?? parseFloat(topUpAmount);
    if (!amount || isNaN(amount) || amount <= 0) return;

    setToppingUp(true);
    setTopUpSuccess(null);
    try {
      const res = await fetch('/api/paypal/userinfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...accountRequestHeaders(user) },
        body: JSON.stringify({ action: 'topup', amount }),
      });
      const data = await res.json();
      if (res.ok) {
        if (typeof data.balance === 'number') setBalance(data.balance);
        if (typeof data.startingBalance === 'number') setStartingBalance(data.startingBalance);
        window.dispatchEvent(new CustomEvent('paypal_balance_updated', { detail: data.balance }));
        setTopUpSuccess(`✓ Successfully added +$${amount.toFixed(2)} USD to your Sandbox balance!`);
        setTimeout(() => setTopUpSuccess(null), 3500);
      }
    } catch (e) {
      console.warn('Topup error:', e);
    } finally {
      setToppingUp(false);
    }
  }

  function handleCopyCredentials() {
    navigator.clipboard.writeText('Email: sb-buyer@personal.example.com\nPassword: SandboxPassword123!');
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2000);
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0070ba] flex items-center justify-center text-white font-bold text-xl shadow-xs">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#003087]">PayPal Sandbox Wallet</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  ORDERS v2 ESCROW
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">sb-buyer@personal.example.com</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-5 sm:px-6 py-4 sm:py-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {topUpSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold animate-fadeIn">
              {topUpSuccess}
            </div>
          )}

          {/* Live Balance Card with Escrow Accounting */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-50/70 to-slate-50 border border-blue-100 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#003087]">
                Available to Stake
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-white px-2.5 py-0.5 rounded-full border border-emerald-100 shadow-2xs">
                ● Live Escrow Synced
              </span>
            </div>

            <div className="flex justify-between items-baseline">
              <p className="text-3xl sm:text-4xl font-black text-[#003087] tracking-tight tabular-nums font-tabular">
                ${balance.toFixed(2)}{' '}
                <span className="text-sm font-semibold text-slate-500 font-sans">USD</span>
              </p>
              <button
                onClick={fetchBalance}
                disabled={loading}
                className="text-xs font-semibold text-[#0070ba] hover:underline"
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

            {/* Escrow Math Breakdown */}
            <div className="pt-2.5 border-t border-blue-100/70 text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between items-center">
                <span>Sandbox Starting Pool:</span>
                <span className="font-mono font-semibold text-slate-800">${startingBalance.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1 text-amber-800 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Active Authorization Holds:
                </span>
                <span className="font-mono font-bold text-amber-700">
                  -${heldBalance.toFixed(2)} USD ({activeHoldsCount} active)
                </span>
              </div>
              <div className="flex justify-between items-center font-bold text-[#003087] pt-1 border-t border-blue-100/50">
                <span>Net Available:</span>
                <span className="font-mono text-sm">${balance.toFixed(2)} USD</span>
              </div>
            </div>
          </div>

          {/* Top Up Sandbox Balance Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>➕</span> Top Up Sandbox Balance
              </span>
              <span className="text-[10px] font-mono text-[#0070ba] font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                ANY AMOUNT
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {[10, 25, 50, 100, 500].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setTopUpAmount(String(amt))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all active:scale-95 ${
                    parseFloat(topUpAmount) === amt
                      ? 'border-[#0070ba] bg-blue-50 text-[#003087] ring-1 ring-[#0070ba]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  +${amt}
                </button>
              ))}
            </div>

            {/* Custom Amount Input & Button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="Amount..."
                  className="w-full pl-6 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-hidden focus:border-[#0070ba]"
                />
              </div>

              <button
                type="button"
                onClick={() => handleTopUp()}
                disabled={toppingUp || !parseFloat(topUpAmount) || parseFloat(topUpAmount) <= 0}
                className="px-4 py-2 bg-[#0070ba] hover:bg-[#003087] text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 active:scale-95 shrink-0"
              >
                {toppingUp ? 'Adding…' : 'Top Up Pool'}
              </button>
            </div>
          </div>

          {/* Escrow Rule Note */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 block">System Escrow Rule:</span>
            <p className="leading-relaxed">
              When a commitment is authorized, the stake is held in temporary authorization (intent: AUTHORIZE). Funds remain safely in your pool but are locked until proof succeeds (voided/returned) or forfeits (captured to charity).
            </p>
          </div>

          {/* Sandbox Buyer Credentials */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-700">Sandbox Buyer Profile:</span>
              <button
                onClick={handleCopyCredentials}
                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-white text-[#0070ba] border border-slate-200 hover:bg-blue-50 transition-colors shadow-2xs"
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
        <div className="px-5 sm:px-6 pb-5 pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            Close Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
