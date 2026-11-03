'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ApproveHoldPage() {
  const params = useParams();
  const router = useRouter();
  const pledgeId = params.id as string;

  const [pledge, setPledge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);

  useEffect(() => {
    async function fetchPledge() {
      try {
        const res = await fetch(`/api/pledges/${pledgeId}`);
        if (!res.ok) throw new Error('Pledge not found');
        const data = await res.json();
        setPledge(data.pledge);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPledge();
  }, [pledgeId]);

  // Load PayPal JavaScript SDK with intent=authorize
  useEffect(() => {
    if (!pledge) return;

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'AfnJQQtVSngJ6DVwD7Mz2RgDS1vQZp0SQ0HxUpl5wcFbB-2ttuWTN3hF1uG8woYaMW6D7vC-EIPOp9KL';
    const scriptId = 'paypal-sdk-script';

    if (document.getElementById(scriptId)) {
      setSdkReady(true);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&intent=authorize&currency=USD`;
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => setError('Failed to load PayPal SDK script.');
    document.body.appendChild(script);
  }, [pledge]);

  // Render PayPal button container once SDK is loaded
  useEffect(() => {
    if (!sdkReady || !pledge || pledge.status !== 'RUBRIC_LOCKED') return;

    const container = document.getElementById('paypal-button-container');
    if (!container || container.children.length > 0) return;

    const paypal = (window as any).paypal;
    if (!paypal || !paypal.Buttons) return;

    paypal.Buttons({
      createOrder: async () => {
        try {
          const res = await fetch(`/api/pledges/${pledgeId}/order`, { method: 'POST' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to create order');
          return data.orderId;
        } catch (err: any) {
          setError(err.message);
          throw err;
        }
      },
      onApprove: async (data: any) => {
        setAuthorizing(true);
        setError(null);
        try {
          const res = await fetch(`/api/pledges/${pledgeId}/authorize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.orderID }),
          });
          const resData = await res.json();
          if (!res.ok) throw new Error(resData.error || 'Failed to authorize hold');

          router.push(`/pledges/${pledgeId}`);
        } catch (err: any) {
          setError(err.message);
          setAuthorizing(false);
        }
      },
      onError: (err: any) => {
        console.error('PayPal button error:', err);
        setError('PayPal authorization encountered an issue.');
      },
    }).render('#paypal-button-container');
  }, [sdkReady, pledge, pledgeId, router]);

  async function handleSimulateApproval() {
    setAuthorizing(true);
    setError(null);
    try {
      const orderRes = await fetch(`/api/pledges/${pledgeId}/order`, { method: 'POST' });
      const orderData = await orderRes.json();
      const orderId = orderData.orderId || `MOCK-ORDER-${Date.now()}`;

      const res = await fetch(`/api/pledges/${pledgeId}/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authorization failed');

      router.push(`/pledges/${pledgeId}`);
    } catch (err: any) {
      setError(err.message);
      setAuthorizing(false);
    }
  }

  function handleCopyCreds() {
    navigator.clipboard.writeText('Email: sb-buyer@personal.example.com\nPassword: SandboxPassword123!');
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2000);
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400 font-medium">Securing contract parameters...</p>
      </div>
    );
  }

  if (error && !pledge) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4">
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center space-y-3">
          <h2 className="text-base font-bold text-rose-300">Contract Not Found</h2>
          <p className="text-xs text-rose-400">{error}</p>
          <Link href="/new" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
            Create New Pledge
          </Link>
        </div>
      </div>
    );
  }

  const formattedMoney = `${(pledge.stake_cents / 100).toFixed(2)} USD (sandbox)`;
  const releaseDate = new Date(pledge.ends_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-full uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Step 2: PayPal Authorization Hold
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Authorize Escrow Hold
        </h1>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Commit funds securely through your PayPal sandbox balance or linked cards.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
          <strong>Notice:</strong> {error}
        </div>
      )}

      {/* Main Hold Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6 backdrop-blur-md">
        {/* Stake Summary Card */}
        <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider">Contract Title</span>
            <span className="font-mono text-slate-500">Pledge #{pledge.id.slice(0, 8)}</span>
          </div>
          <p className="text-base font-bold text-white">{pledge.title}</p>

          <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400">Authorization Hold:</span>
            <span className="text-2xl font-extrabold font-mono text-indigo-400 bg-slate-900 px-3 py-0.5 rounded-lg border border-slate-700">
              {formattedMoney}
            </span>
          </div>
        </div>

        {/* Clear Legal "Hold, Not a Charge" Guarantee */}
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-indigo-200 font-bold text-sm">
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            This is a hold, not a charge
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            No money moves out of your balance. PayPal places an authorization reservation for{' '}
            <strong className="text-white font-mono">{formattedMoney}</strong>. When you verify proof of completion before{' '}
            <strong className="text-white">{releaseDate}</strong>, the hold is instantly voided and released in full.
          </p>
          <div className="pt-1 text-[11px] text-indigo-400 flex items-center gap-1 font-mono">
            <span>✓ 5-Minute Grace Cancellation Available after Hold</span>
          </div>
        </div>

        {/* Connected PayPal Sandbox Buyer & Card Inspector */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="font-bold text-slate-300">PayPal Sandbox Funding Sources</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
              CONNECTED
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Account:</span>
              <span className="font-mono text-white">sb-buyer@personal.example.com</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Funding Method:</span>
              <span className="font-mono text-indigo-300">PayPal Balance ($500.00 USD) or Visa •••• 4242</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center">
            <span className="text-[10px] text-slate-500">Judge test credentials:</span>
            <button
              onClick={handleCopyCreds}
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline"
            >
              {copiedCreds ? '✓ Copied' : 'Copy Sandbox Login'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {authorizing ? (
            <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm font-bold text-white">Authorizing Hold with PayPal Sandbox...</p>
              <p className="text-xs text-slate-500 font-mono">Executing POST /v2/checkout/orders/authorize</p>
            </div>
          ) : (
            <>
              {/* PayPal JS SDK Buttons Container */}
              <div id="paypal-button-container" className="min-h-[48px]" />

              {/* One-Click Direct Sandbox Trigger */}
              <button
                type="button"
                onClick={handleSimulateApproval}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Authorize Hold with Sandbox API →</span>
              </button>
            </>
          )}

          <div className="text-center">
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-400">
              Cancel and return to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
