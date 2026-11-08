// app/api/pledges/[id]/authorize/route.ts
import { NextResponse } from 'next/server';
import { authorizeOrder } from '@/app/lib/paypal/orders';
import { db } from '@/app/lib/db';
import { appendLedgerEvent, LEDGER_EVENT_TYPES } from '@/app/lib/ledger/chain';
import { transitionOrThrow } from '@/app/lib/state/transitions';

/**
 * POST endpoint that receives a PayPal `orderId` after the user approves checkout.
 * It authorizes the order via PayPal, stores the `authorizationId` on the pledge
 * and starts the pledge in the single, valid `ACTIVE` state.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { orderId } = await request.json();
  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
  }

  try {
    const pledge = await db.pledges.get(params.id);
    if (!pledge) return NextResponse.json({ error: 'Pledge not found' }, { status: 404 });
    if (pledge.status !== 'RUBRIC_LOCKED') {
      return NextResponse.json({ error: `Pledge cannot be authorized from ${pledge.status}.` }, { status: 409 });
    }
    const result = await authorizeOrder(orderId, params.id);
    transitionOrThrow(pledge.status, 'ACTIVE');
    await db.pledges.update(params.id, {
      paypal_authorization_id: result.authorizationId,
      paypal_order_id: orderId,
      status: 'ACTIVE',
    });
    await appendLedgerEvent(params.id, LEDGER_EVENT_TYPES.HOLD_AUTHORIZED, {
      authorizationId: result.authorizationId,
      orderId,
      paypalStatus: result.status,
    });
    return NextResponse.json({ authorizationId: result.authorizationId, status: 'ACTIVE' });
  } catch (err: any) {
    console.error('Authorize order failed', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
