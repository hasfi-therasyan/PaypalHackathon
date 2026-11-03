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

  // Dynamically load PayPal JavaScript SDK with intent=authorize
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

  // Fallback simulator for offline or immediate testing
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

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Loading pledge details...</p>
      </div>
    );
  }

  if (error && !pledge) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
          <h2 className="text-lg font-bold text-red-800 mb-2">Pledge Not Found</h2>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <Link href="/new" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold">
            Create a New Pledge
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
    <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6">
      <div className="text-center mb-8">
        <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full uppercase tracking-wider">
          Authorization Step
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
          Approve PayPal Hold
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Place a temporary authorization hold to back your promise.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <strong>Notice:</strong> {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Commitment Summary Card */}
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 uppercase">Pledge Goal</span>
            <span className="text-xs font-mono text-slate-400">ID: {pledge.id.slice(0, 8)}</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{pledge.title}</p>
          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
            <span className="text-sm text-slate-600 font-medium">Authorization Hold:</span>
            <span className="text-xl font-extrabold text-indigo-600">{formattedMoney}</span>
          </div>
        </div>

        {/* Clear Legal Copy: "Hold, not a charge" */}
        <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-indigo-900 font-semibold text-sm">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            This is a hold, not a charge
          </div>
          <p className="text-xs text-indigo-800 leading-relaxed">
            No real money moves from your account. Your sandbox buyer account temporarily authorizes{' '}
            <strong>{formattedMoney}</strong>. When you verify your goal proof before{' '}
            <strong>{releaseDate}</strong>, the hold is instantly voided and released in full.
          </p>
        </div>

        {/* PayPal SDK Button Container */}
        <div>
          {authorizing ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-900">Authorizing hold with PayPal API...</p>
              <p className="text-xs text-slate-500 mt-1">Executing POST /v2/checkout/orders/authorize</p>
            </div>
          ) : (
            <>
              <div id="paypal-button-container" className="min-h-[50px] mb-3" />
              
              {/* Direct One-Click Sandbox Authorize Button */}
              <button
                type="button"
                onClick={handleSimulateApproval}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow transition-colors flex items-center justify-center gap-2"
              >
                <span>Authorize Hold with Sandbox API →</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
