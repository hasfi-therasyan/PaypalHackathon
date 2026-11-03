'use client';

// app/pledges/new/checkout/[id]/page.tsx
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [pledge, setPledge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedFunding, setSelectedFunding] = useState<'balance' | 'card'>('balance');

  useEffect(() => {
    async function loadPledge() {
      try {
        const res = await fetch(`/api/pledges/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPledge(data.pledge);
        } else {
          setErrorMsg('Pledge commitment not found');
        }
      } catch (e: any) {
        setErrorMsg(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadPledge();
  }, [id]);

  const createOrder = async () => {
    const res = await fetch(`/api/pledges/${id}/order`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to initialize PayPal order');
    }
    return data.orderId || data.id;
  };

  const onApprove = async (data: any) => {
    try {
      const res = await fetch(`/api/pledges/${id}/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderID }),
      });
      if (res.ok) {
        router.push(`/pledges/${id}`);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to authorize hold');
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const stakeAmount = pledge ? (pledge.stake_cents / 100).toFixed(2) : '35.00';

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="border-b border-slate-100 pb-4">
          <Link href="/" className="text-xs font-semibold text-[#0070ba] hover:underline mb-2 inline-block">
            ← Return to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0070ba] text-white font-bold flex items-center justify-center text-sm">
              P
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#003087]">Authorize PayPal Commitment Hold</h1>
              <p className="text-xs text-slate-500">Sandbox Orders v2 · Intent: AUTHORIZE</p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        {/* Commitment Summary */}
        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-bold text-slate-600 uppercase">Commitment Hold Amount</span>
            <span className="text-2xl font-black text-[#003087] font-mono">${stakeAmount} USD</span>
          </div>
          <p className="text-xs text-slate-600">
            Goal: <strong className="text-slate-900">{pledge?.title || 'Hackathon Commitment'}</strong>
          </p>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-blue-100/60">
            ℹ️ This places a temporary hold on your sandbox account. No funds leave your account unless you fail the goal rubric.
          </div>
        </div>

        {/* Funding Source Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">Preferred Sandbox Payment Source</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedFunding('balance')}
              className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                selectedFunding === 'balance'
                  ? 'border-[#0070ba] bg-blue-50 text-[#003087]'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              💰 PayPal Balance
              <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Instant sandbox balance hold</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFunding('card')}
              className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                selectedFunding === 'card'
                  ? 'border-[#0070ba] bg-blue-50 text-[#003087]'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              💳 Linked Debit/Card
              <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Sandbox mock Visa 4242</span>
            </button>
          </div>
        </div>

        {/* PayPal Smart Buttons */}
        <div className="pt-2">
          <PayPalScriptProvider
            options={{
              clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? 'test',
              currency: 'USD',
              intent: 'authorize',
            }}
          >
            <PayPalButtons
              style={{
                layout: 'vertical',
                color: 'gold',
                shape: 'rect',
                label: 'pay',
                height: 44,
              }}
              createOrder={createOrder}
              onApprove={onApprove}
              fundingSource={selectedFunding === 'balance' ? undefined : 'paypal'}
            />
          </PayPalScriptProvider>
        </div>

        {/* Quick sandbox hint */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
          <span className="font-bold text-slate-800 block">Demo Credentials for Sandbox Buyer:</span>
          <p className="font-mono">sb-buyer@personal.example.com / SandboxPassword123!</p>
        </div>
      </div>
    </div>
  );
}
