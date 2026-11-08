import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { createAuthorizeOrder } from '@/app/lib/paypal/orders';
import { appendLedgerEvent, LEDGER_EVENT_TYPES } from '@/app/lib/ledger/chain';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pledge = await db.pledges.get(params.id);
    if (!pledge) {
      return NextResponse.json({ error: 'Pledge not found' }, { status: 404 });
    }

    if (pledge.status !== 'RUBRIC_LOCKED') {
      return NextResponse.json({ error: `Pledge cannot create an order from ${pledge.status}.` }, { status: 409 });
    }

    // Reuse the existing order where possible.  This protects the buyer from
    // accidental duplicate clicks and preserves PayPal idempotency.
    if (pledge.paypal_order_id) {
      return NextResponse.json({ orderId: pledge.paypal_order_id, reused: true });
    }

    // Call PayPal Orders API with intent: AUTHORIZE
    const order = await createAuthorizeOrder(pledge.id, pledge.stake_cents, pledge.currency);

    await db.pledges.update(pledge.id, {
      paypal_order_id: order.id,
    });

    await appendLedgerEvent(pledge.id, LEDGER_EVENT_TYPES.PAYPAL_ORDER_CREATED, {
      orderId: order.id,
      amountCents: pledge.stake_cents,
      intent: 'AUTHORIZE',
    });

    return NextResponse.json({ orderId: order.id });
  } catch (error: any) {
    console.error('Failed to create PayPal order:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create PayPal order' },
      { status: 500 }
    );
  }
}

