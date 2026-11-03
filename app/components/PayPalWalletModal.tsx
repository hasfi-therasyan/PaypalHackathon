'use client';

import React, { useState } from 'react';

interface PayPalWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PayPalWalletModal({ isOpen, onClose }: PayPalWalletModalProps) {
  const [balance, setBalance] = useState(500.0);
  const [selectedFunding, setSelectedFunding] = useState<'balance' | 'visa' | 'mastercard'>('balance');
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);

  if (!isOpen) return null;

  function handleTopUp(amount: number) {
    setIsToppingUp(true);
    setTimeout(() => {
      setBalance((prev) => prev + amount);
      setIsToppingUp(false);
    }, 600);
  }

  function handleCopyCredentials() {
    navigator.clipboard.writeText('Email: sb-buyer@personal.example.com\nPassword: SandboxPassword123!');
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-6 text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-600/30">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">PayPal Sandbox Wallet</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">sb-buyer@personal.example.com</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Balance Card */}
        <div className="p-5 bg-gradient-to-br from-slate-800/80 to-slate-900 border border-slate-700/80 rounded-xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Available PayPal Balance</span>
          <div className="flex justify-between items-baseline">
            <p className="text-3xl font-extrabold text-white tracking-tight">
              ${balance.toFixed(2)}{' '}
              <span className="text-sm font-semibold text-indigo-400 font-mono">USD (sandbox)</span>
            </p>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Verified Buyer
            </span>
          </div>

          {/* Quick Top-Up Simulation */}
          <div className="pt-2 flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px]">Simulate Top-Up via Card:</span>
            <button
              onClick={() => handleTopUp(25)}
              disabled={isToppingUp}
              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded font-mono text-[11px] font-bold transition-colors disabled:opacity-50"
            >
              +$25
            </button>
            <button
              onClick={() => handleTopUp(50)}
              disabled={isToppingUp}
              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded font-mono text-[11px] font-bold transition-colors disabled:opacity-50"
            >
              +$50
            </button>
            <button
              onClick={() => handleTopUp(100)}
              disabled={isToppingUp}
              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded font-mono text-[11px] font-bold transition-colors disabled:opacity-50"
            >
              +$100
            </button>
          </div>
        </div>

        {/* Linked Funding Sources */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Linked Payment Methods</span>
          
          <div className="space-y-2 text-xs">
            {/* Option 1: PayPal Balance */}
            <div
              onClick={() => setSelectedFunding('balance')}
              className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                selectedFunding === 'balance'
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">💰</span>
                <div>
                  <p className="font-bold text-white">PayPal Balance</p>
                  <p className="text-slate-400 text-[11px] font-mono">${balance.toFixed(2)} USD Available</p>
                </div>
              </div>
              <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedFunding === 'balance' ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600'}`}>
                {selectedFunding === 'balance' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
            </div>

            {/* Option 2: Visa Debit */}
            <div
              onClick={() => setSelectedFunding('visa')}
              className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                selectedFunding === 'visa'
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-4 bg-blue-700 text-white text-[9px] font-black rounded flex items-center justify-center italic">
                  VISA
                </div>
                <div>
                  <p className="font-bold text-white">Visa Debit Card •••• 4242</p>
                  <p className="text-slate-400 text-[11px]">Primary Linked Card · Exp 12/28</p>
                </div>
              </div>
              <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedFunding === 'visa' ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600'}`}>
                {selectedFunding === 'visa' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
            </div>

            {/* Option 3: Mastercard Credit */}
            <div
              onClick={() => setSelectedFunding('mastercard')}
              className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                selectedFunding === 'mastercard'
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-4 bg-orange-600 text-white text-[9px] font-black rounded flex items-center justify-center">
                  MC
                </div>
                <div>
                  <p className="font-bold text-white">Mastercard Credit •••• 8888</p>
                  <p className="text-slate-400 text-[11px]">Backup Card · Exp 08/29</p>
                </div>
              </div>
              <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedFunding === 'mastercard' ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600'}`}>
                {selectedFunding === 'mastercard' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
            </div>
          </div>
        </div>

        {/* Judge & Test Buyer Credentials Card */}
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-300">PayPal Sandbox Buyer Login:</span>
            <button
              onClick={handleCopyCredentials}
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600 hover:text-white transition-colors"
            >
              {copiedCreds ? '✓ Copied' : 'Copy Credentials'}
            </button>
          </div>
          <div className="font-mono text-slate-400 text-[11px] space-y-0.5">
            <p>Email: <span className="text-white">sb-buyer@personal.example.com</span></p>
            <p>Password: <span className="text-white">SandboxPassword123!</span></p>
          </div>
          <p className="text-[10px] text-slate-500 pt-1">
            When you approve a pledge, PayPal checkout will authenticate with your sandbox buyer profile to authorize the hold.
          </p>
        </div>

        {/* Close Button */}
        <div>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

