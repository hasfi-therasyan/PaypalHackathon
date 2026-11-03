'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, UserRole } from '@/app/lib/auth-context';

export default function AuthPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('hasfirasya02@gmail.com');
  const [password, setPassword] = useState('rasya123');
  const [name, setName] = useState('Rasya Hasfi');
  const [role, setRole] = useState<UserRole>('admin');
  const [error, setError] = useState<string | null>(null);
  const [loadingPayPal, setLoadingPayPal] = useState(false);

  const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'AfnJQQtVSngJ6DVwD7Mz2RgDS1vQZp0SQ0HxUpl5wcFbB-2ttuWTN3hF1uG8woYaMW6D7vC-EIPOp9KL';
  const REDIRECT_URI = process.env.NEXT_PUBLIC_PAYPAL_REDIRECT_URI || 'http://localhost:3000/api/paypal/oauth';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate admin credentials
    if (email === 'hasfirasya02@gmail.com') {
      if (password !== 'rasya123') {
        setError('Invalid admin credentials. Please enter the correct password.');
        return;
      }
      login(email, 'admin');
      router.push('/admin');
      return;
    }

    // Standard referee or user registration / login
    login(email, role);
    if (role === 'referee') {
      router.push('/referee');
    } else {
      router.push('/');
    }
  };

  const selectPreset = (targetEmail: string, targetPass: string, targetRole: UserRole) => {
    setEmail(targetEmail);
    setPassword(targetPass);
    setRole(targetRole);
    setError(null);
  };

  const handlePayPalOAuth = () => {
    setLoadingPayPal(true);
    // Real PayPal sandbox OAuth identity endpoint
    const oauthUrl = `https://www.sandbox.paypal.com/signin/authorize?client_id=${PAYPAL_CLIENT_ID}&response_type=code&scope=openid profile email https://uri.paypal.com/services/paypalattributes&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    window.location.href = oauthUrl;
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#0070ba] text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-xs">
            P
          </div>
          <h1 className="text-2xl font-black text-[#003087]">
            {mode === 'signin' ? 'Sign In to Stake' : 'Create Your Stake Account'}
          </h1>
          <p className="text-xs text-slate-500">
            {mode === 'signin'
              ? 'Enter your credentials or choose a pre-configured demo account.'
              : 'Register to create commitments, stake holds, or referee peers.'}
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-white text-[#003087] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-white text-[#003087] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Real PayPal Connect Button */}
        <div>
          <button
            type="button"
            onClick={handlePayPalOAuth}
            disabled={loadingPayPal}
            className="w-full py-3 px-4 bg-[#003087] hover:bg-[#002244] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <span className="w-4 h-4 rounded-full bg-white text-[#003087] text-[10px] font-black flex items-center justify-center">
              P
            </span>
            <span>{loadingPayPal ? 'Connecting to PayPal…' : 'Log In with PayPal Account'}</span>
          </button>
          <p className="text-[11px] text-center text-slate-400 mt-1.5">
            Connects securely to PayPal Sandbox OpenID
          </p>
        </div>

        {/* Single Row Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap shrink-0">
            Or Use Role Account
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Demo Account Presets */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            ⚡ Quick-Switch Demo Accounts:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => selectPreset('hasfirasya02@gmail.com', 'rasya123', 'admin')}
              className={`p-2 rounded-xl border text-center text-xs font-bold transition-all ${
                role === 'admin' && email === 'hasfirasya02@gmail.com'
                  ? 'border-[#0070ba] bg-blue-50 text-[#003087]'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Admin
              <span className="block text-[9px] font-normal text-slate-500 mt-0.5">Full Audit</span>
            </button>

            <button
              type="button"
              onClick={() => selectPreset('referee@example.com', 'password123', 'referee')}
              className={`p-2 rounded-xl border text-center text-xs font-bold transition-all ${
                role === 'referee'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Referee
              <span className="block text-[9px] font-normal text-slate-500 mt-0.5">Appeals</span>
            </button>

            <button
              type="button"
              onClick={() => selectPreset('hasfi@personal.example.com', 'password123', 'user')}
              className={`p-2 rounded-xl border text-center text-xs font-bold transition-all ${
                role === 'user' && email !== 'hasfirasya02@gmail.com'
                  ? 'border-[#0070ba] bg-blue-50 text-[#003087]'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              User
              <span className="block text-[9px] font-normal text-slate-500 mt-0.5">Pledges</span>
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba] text-slate-900 bg-white"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba] text-slate-900 bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba] text-slate-900 bg-white"
            />
          </div>

          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Assign Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba] text-slate-900 bg-white"
              >
                <option value="user">User (Create &amp; Track Pledges)</option>
                <option value="referee">Referee (Verify Friend Commitments)</option>
                <option value="admin">Administrator (Audit &amp; System Logs)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-[#0070ba] hover:bg-[#003087] text-white font-bold rounded-xl text-sm transition-all shadow-xs"
          >
            {mode === 'signin' ? 'Sign In with Role' : 'Create Account & Enter'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>Need help? Check out the </span>
          <Link href="/" className="font-bold text-[#0070ba] hover:underline">
            Home Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
