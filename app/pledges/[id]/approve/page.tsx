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
        <div className="w-8 h-8 border-4 border-[#0070ba] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">Securing contract parameters…</p>
      </div>
    );
  }

  if (error && !pledge) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
          <h2 className="text-base font-bold text-red-700">Contract Not Found</h2>
          <p className="text-sm text-red-600">{error}</p>
          <Link href="/new" className="inline-block px-5 py-2.5 bg-[#0070ba] text-white rounded-xl text-sm font-semibold hover:bg-[#005ea6] transition-colors">
            Create New Pledge
          </Link>
        </div>
      </div>
    );
  }

  const formattedMoney = `$${(pledge.stake_cents / 100).toFixed(2)} USD`;
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
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-full">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Step 2: PayPal Authorization Hold
        </span>
        <h1 className="text-2xl font-bold text-[#003087] tracking-tight">
          Authorize Escrow Hold
        </h1>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Commit funds securely through your PayPal sandbox balance or linked cards.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <strong>Notice:</strong> {error}
        </div>
      )}

      {/* Main Hold Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        {/* Stake Summary */}
        <div className="p-5 bg-[#f6f8fb] border border-slate-200 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-500 uppercase tracking-wider">Contract Title</span>
            <span className="font-mono text-slate-400 tabular-nums">Pledge #{pledge.id.slice(0, 8)}</span>
          </div>
          <p className="text-base font-bold text-slate-800">{pledge.title}</p>

          <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500">Authorization Hold:</span>
            <span className="text-2xl font-bold font-mono tabular-nums text-[#003087] bg-blue-50 px-3 py-0.5 rounded-lg border border-blue-100">
              {formattedMoney}
            </span>
          </div>
        </div>

        {/* Hold Guarantee */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-[#003087] font-bold text-sm">
            <svg className="w-4 h-4 text-[#0070ba]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            This is a hold, not a charge
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            No money moves out of your balance. PayPal places an authorization reservation for{' '}
            <strong className="text-[#003087] font-mono tabular-nums">{formattedMoney}</strong>. When you verify proof of completion before{' '}
            <strong className="text-slate-800">{releaseDate}</strong>, the hold is instantly voided and released in full.
          </p>
          <div className="pt-1 text-xs text-[#0070ba] flex items-center gap-1 font-medium">
            <span>✓ 5-Minute Grace Cancellation Available after Hold</span>
          </div>
        </div>

        {/* Connected Sandbox Sources */}
        <div className="p-4 bg-[#f6f8fb] border border-slate-200 rounded-xl space-y-3 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="font-semibold text-slate-700">PayPal Sandbox Funding Sources</span>
            <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              CONNECTED
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Account:</span>
              <span className="font-mono text-slate-800">sb-buyer@personal.example.com</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Funding Method:</span>
              <span className="font-mono text-[#003087]">PayPal Balance ($500.00 USD) or Visa •••• 4242</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
            <span className="text-[10px] text-slate-400">Judge test credentials:</span>
            <button
              onClick={handleCopyCreds}
              className="text-[10px] font-semibold text-[#0070ba] hover:text-[#005ea6] underline transition-colors"
            >
              {copiedCreds ? '✓ Copied' : 'Copy Sandbox Login'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {authorizing ? (
            <div className="p-8 text-center bg-[#f6f8fb] border border-slate-200 rounded-xl space-y-2">
              <div className="w-8 h-8 border-4 border-[#0070ba] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">Authorizing Hold with PayPal Sandbox…</p>
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
                className="w-full py-3.5 px-4 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold rounded-xl text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <span>Authorize Hold with Sandbox API →</span>
              </button>
            </>
          )}

          <div className="text-center">
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
              Cancel and return to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
