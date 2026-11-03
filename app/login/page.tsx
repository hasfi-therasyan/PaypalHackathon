'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/lib/auth-context';

export default function AuthPage() {
  const router = useRouter();
  const { login, signup } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPayPal, setLoadingPayPal] = useState(false);

  const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'AfnJQQtVSngJ6DVwD7Mz2RgDS1vQZp0SQ0HxUpl5wcFbB-2ttuWTN3hF1uG8woYaMW6D7vC-EIPOp9KL';
  const REDIRECT_URI = process.env.NEXT_PUBLIC_PAYPAL_REDIRECT_URI || 'http://localhost:3000/api/paypal/oauth';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        const ok = await login(email, password);
        if (!ok) {
          setError('Invalid email or password. Please verify your credentials or register a new account.');
          setSubmitting(false);
          return;
        }

        // Route to appropriate view according to credentials
        const normalized = email.trim().toLowerCase();
        if (normalized === 'hasfirasya02@gmail.com') {
          router.push('/admin');
        } else if (normalized.includes('referee')) {
          router.push('/referee');
        } else {
          router.push('/dashboard');
        }
      } else {
        // Sign up
        if (!name.trim()) {
          setError('Please provide your full name.');
          setSubmitting(false);
          return;
        }

        await signup(email, name, password);
        setSuccessMsg('Account created successfully! Admin can verify and assign permissions.');
        setTimeout(() => {
          router.push('/dashboard');
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayPalOAuth = () => {
    setLoadingPayPal(true);
    const oauthUrl = `https://www.sandbox.paypal.com/signin/authorize?client_id=${PAYPAL_CLIENT_ID}&response_type=code&scope=openid profile email https://uri.paypal.com/services/paypalattributes&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    window.location.href = oauthUrl;
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#0070ba] text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-xs">
            P
          </div>
          <h1 className="text-2xl font-black text-[#003087]">
            {mode === 'signin' ? 'Sign In to Stake' : 'Create an Account'}
          </h1>
          <p className="text-xs text-slate-500">
            {mode === 'signin'
              ? 'Enter your email and password to access your commitments desk.'
              : 'Sign up to create contracts. Admin can verify or assign role privileges.'}
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
              setSuccessMsg(null);
            }}
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
            onClick={() => {
              setMode('signup');
              setError(null);
              setSuccessMsg(null);
            }}
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

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
            {successMsg}
          </div>
        )}

        {/* Clean Credentials Form */}
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
              placeholder="name@example.com"
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
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba] text-slate-900 bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#0070ba] hover:bg-[#003087] text-white font-bold rounded-xl text-sm transition-all shadow-xs disabled:opacity-50"
          >
            {submitting
              ? 'Authenticating…'
              : mode === 'signin'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>

        {/* Single Row Divider */}
        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap shrink-0">
            Or Connect with PayPal
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* PayPal OpenID OAuth Button */}
        <div>
          <button
            type="button"
            onClick={handlePayPalOAuth}
            disabled={loadingPayPal}
            className="w-full py-3 px-4 bg-[#003087] hover:bg-[#002244] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50"
          >
            <span className="w-4 h-4 rounded-full bg-white text-[#003087] text-[10px] font-black flex items-center justify-center">
              P
            </span>
            <span>{loadingPayPal ? 'Connecting…' : 'Log In with PayPal Sandbox'}</span>
          </button>
          <p className="text-[11px] text-center text-slate-400 mt-1.5">
            Instant authorization with sandbox buyer profile
          </p>
        </div>

        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>Looking to explore the demo? </span>
          <Link href="/dashboard" className="font-bold text-[#0070ba] hover:underline">
            View Commitments Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
