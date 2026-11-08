// app/api/pledges/[id]/authorize/route.ts
import { NextResponse } from 'next/server';
import { authorizeOrder } from '@/app/lib/paypal/orders';
import { db } from '@/app/lib/db';
import { appendLedgerEvent, LEDGER_EVENT_TYPES } from '@/app/lib/ledger/chain';
import { transitionOrThrow } from '@/app/lib/state/transitions';
import { deductSandboxBalance, getSandboxBalance } from '@/app/lib/paypal/balance';

/**
 * POST endpoint that authorizes a commitment hold.
 * Supports both:
 * 1. Direct PayPal Sandbox Money Pool hold (source: 'sandbox_balance')
 * 2. Standard PayPal Orders API hold (with PayPal orderId)
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { orderId, source } = body;

    const pledge = await db.pledges.get(params.id);
    if (!pledge) {
      return NextResponse.json({ error: 'Pledge not found' }, { status: 404 });
    }

    if (pledge.status !== 'RUBRIC_LOCKED') {
      return NextResponse.json(
        { error: `Pledge cannot be authorized from ${pledge.status}.` },
        { status: 409 }
      );
    }

    // Direct Sandbox Balance Hold
    if (source === 'sandbox_balance' || !orderId || orderId === 'SANDBOX_BALANCE' || orderId.startsWith('SB_')) {
      const stakeDollars = pledge.stake_cents / 100;
      const currentBal = getSandboxBalance();

      if (currentBal < stakeDollars) {
        return NextResponse.json(
          { error: `Insufficient PayPal Sandbox balance ($${currentBal.toFixed(2)} USD available, $${stakeDollars.toFixed(2)} needed). Please top up in the Sandbox Wallet.` },
          { status: 400 }
        );
      }

      // Deduct from Sandbox Money Pool
      const remainingBalance = deductSandboxBalance(stakeDollars);
      const authorizationId = `AUTH-SB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const effectiveOrderId = orderId || `ORDER-SB-${pledge.id.slice(0, 8).toUpperCase()}`;

      transitionOrThrow(pledge.status, 'ACTIVE');
      await db.pledges.update(params.id, {
        paypal_authorization_id: authorizationId,
        paypal_order_id: effectiveOrderId,
        status: 'ACTIVE',
      });

      await appendLedgerEvent(params.id, LEDGER_EVENT_TYPES.HOLD_AUTHORIZED, {
        authorizationId,
        orderId: effectiveOrderId,
        source: 'paypal_sandbox_balance',
        stakeDollars,
        remainingSandboxBalance: remainingBalance,
        paypalStatus: 'AUTHORIZED',
      });

      return NextResponse.json({
        authorizationId,
        orderId: effectiveOrderId,
        status: 'ACTIVE',
        source: 'sandbox_balance',
        remainingBalance,
      });
    }

    // Standard PayPal Orders API Authorization
    const result = await authorizeOrder(orderId, params.id);
    transitionOrThrow(pledge.status, 'ACTIVE');

    // Also deduct from simulated pool so the UI matches
    const stakeDollars = pledge.stake_cents / 100;
    const remainingBalance = deductSandboxBalance(stakeDollars);

    await db.pledges.update(params.id, {
      paypal_authorization_id: result.authorizationId,
      paypal_order_id: orderId,
      status: 'ACTIVE',
    });

    await appendLedgerEvent(params.id, LEDGER_EVENT_TYPES.HOLD_AUTHORIZED, {
      authorizationId: result.authorizationId,
      orderId,
      paypalStatus: result.status,
      remainingSandboxBalance: remainingBalance,
    });

    return NextResponse.json({
      authorizationId: result.authorizationId,
      status: 'ACTIVE',
      remainingBalance,
    });
  } catch (err: any) {
    console.error('Authorize order failed', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
