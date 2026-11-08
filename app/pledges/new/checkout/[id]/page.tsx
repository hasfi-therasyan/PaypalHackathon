'use client';

// app/pledges/new/checkout/[id]/page.tsx
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/lib/auth-context';
import { accountRequestHeaders } from '@/app/lib/access';

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const { user, isReady } = useAuth();
  const [pledge, setPledge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedFunding, setSelectedFunding] = useState<'balance' | 'card'>('balance');
  const [sandboxBalance, setSandboxBalance] = useState<number>(500);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setErrorMsg('Sign in to authorize this commitment.');
        setLoading(false);
        return;
      }
      try {
        const [pledgeRes, balanceRes] = await Promise.all([
          fetch(`/api/pledges/${id}`, { headers: accountRequestHeaders(user) }),
          fetch('/api/paypal/userinfo', { headers: accountRequestHeaders(user) }),
        ]);

        if (pledgeRes.ok) {
          const pledgeData = await pledgeRes.json();
          setPledge(pledgeData.pledge);
        } else {
          setErrorMsg('Pledge commitment not found');
        }

        if (balanceRes.ok) {
          const balanceData = await balanceRes.json();
          if (typeof balanceData.balance === 'number') {
            setSandboxBalance(balanceData.balance);
          }
        }
      } catch (e: any) {
        setErrorMsg(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (isReady) loadData();
  }, [id, isReady, user]);

  const stakeDollars = pledge ? pledge.stake_cents / 100 : 35;
  const stakeAmount = stakeDollars.toFixed(2);
  const projectedBalance = Math.max(0, sandboxBalance - stakeDollars).toFixed(2);

  // 1-Click PayPal Sandbox Money Pool Payment & Hold
  const handleSandboxBalancePay = async () => {
    setAuthorizing(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/pledges/${id}/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...accountRequestHeaders(user) },
        body: JSON.stringify({ source: 'sandbox_balance' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authorize PayPal Sandbox hold');
      }

      // Notify header top bar and wallet modal of new balance
      if (typeof data.remainingBalance === 'number') {
        window.dispatchEvent(
          new CustomEvent('paypal_balance_updated', { detail: data.remainingBalance })
        );
      }

      router.push(`/pledges/${id}`);
    } catch (e: any) {
      setErrorMsg(e.message);
      setAuthorizing(false);
    }
  };

  const createOrder = async () => {
    const res = await fetch(`/api/pledges/${id}/order`, {
      method: 'POST',
      headers: accountRequestHeaders(user),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to initialize PayPal order');
    }
    return data.orderId || data.id;
  };

  const onApprove = async (data: any) => {
    setAuthorizing(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/pledges/${id}/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...accountRequestHeaders(user) },
        body: JSON.stringify({ orderId: data.orderID }),
      });
      const resData = await res.json();
      if (res.ok) {
        if (typeof resData.remainingBalance === 'number') {
          window.dispatchEvent(
            new CustomEvent('paypal_balance_updated', { detail: resData.remainingBalance })
          );
        }
        router.push(`/pledges/${id}`);
      } else {
        setErrorMsg(resData.error || 'Failed to authorize hold');
        setAuthorizing(false);
      }
    } catch (e: any) {
      setErrorMsg(e.message);
      setAuthorizing(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="border-b border-slate-100 pb-4">
          <Link href="/dashboard" className="text-xs font-semibold text-[#0070ba] hover:underline mb-2 inline-block">
            ← Return to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0070ba] text-white font-bold flex items-center justify-center text-sm shadow-xs">
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
          <div className="text-[11px] text-slate-500 pt-1 border-t border-blue-100/60 flex items-center justify-between">
            <span>Beneficiary: <strong className="text-slate-700">{pledge?.beneficiary_name || 'Selected Charity'}</strong></span>
            <span className="font-mono text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              0% FEES ON PASS
            </span>
          </div>
        </div>

        {/* Sandbox Money Pool Status */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">Available PayPal Sandbox Pool:</span>
            <span className="font-mono font-bold text-slate-900">${sandboxBalance.toFixed(2)} USD</span>
          </div>
          <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60">
            <span className="text-slate-500 font-medium">Balance After Hold Authorization:</span>
            <span className="font-mono font-bold text-[#0070ba]">${projectedBalance} USD</span>
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
                  ? 'border-[#0070ba] bg-blue-50 text-[#003087] ring-1 ring-[#0070ba]'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              💰 PayPal Balance
              <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Deduct from Sandbox pool</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFunding('card')}
              className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                selectedFunding === 'card'
                  ? 'border-[#0070ba] bg-blue-50 text-[#003087] ring-1 ring-[#0070ba]'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              💳 Linked Debit/Card
              <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Sandbox mock Visa 4242</span>
            </button>
          </div>
        </div>

        {/* Primary Action Button: "Paypal Sandbox" */}
        {selectedFunding === 'balance' ? (
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={handleSandboxBalancePay}
              disabled={authorizing || sandboxBalance < stakeDollars}
              className="w-full py-4 px-6 rounded-xl font-bold text-sm bg-[#0070ba] hover:bg-[#003087] text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-50"
            >
              <span className="w-6 h-6 rounded-full bg-white text-[#0070ba] font-black text-xs flex items-center justify-center shadow-xs">
                P
              </span>
              <span>
                {authorizing ? 'Authorizing Hold...' : `Paypal Sandbox ($${stakeAmount} USD Hold)`}
              </span>
            </button>
            <p className="text-[11px] text-center text-slate-500">
              Instantly authorizes the hold and reduces your PayPal Sandbox money pool.
            </p>

            <div className="relative py-2 flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-2 text-[10px] uppercase font-mono font-bold text-slate-400 absolute">
                or use PayPal Popup Login
              </span>
            </div>

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
              />
            </PayPalScriptProvider>
          </div>
        ) : (
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
                fundingSource="paypal"
              />
            </PayPalScriptProvider>
          </div>
        )}

        {/* Quick sandbox hint */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
          <span className="font-bold text-slate-800 block">Sandbox Verification Guarantee:</span>
          <p>
            Funds remain held in authorization state. If proof is accepted, the hold is voided with 0 fees. If forfeited, the stake is transferred to the designated beneficiary.
          </p>
        </div>
      </div>
    </div>
  );
}
