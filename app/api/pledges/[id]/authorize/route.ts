import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { authorizeOrder } from '@/app/lib/paypal/orders';
import { appendLedgerEvent, LEDGER_EVENT_TYPES } from '@/app/lib/ledger/chain';
import { assertTransition } from '@/app/lib/state/transitions';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pledge = await db.pledges.get(params.id);
    if (!pledge) {
      return NextResponse.json({ error: 'Pledge not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const orderId = body.orderId || pledge.paypal_order_id;

    if (!orderId) {
      return NextResponse.json({ error: 'No PayPal order ID associated with this pledge.' }, { status: 400 });
    }

    assertTransition(pledge.status, 'ACTIVE');

    // Authorize order via PayPal REST API
    const authResult = await authorizeOrder(orderId, pledge.id);

    // Update pledge status to ACTIVE and store authorization details
    await db.pledges.update(pledge.id, {
      status: 'ACTIVE',
      paypal_authorization_id: authResult.authorizationId,
      starts_at: new Date().toISOString(),
    });

    // Record ledger event
    await appendLedgerEvent(pledge.id, LEDGER_EVENT_TYPES.HOLD_AUTHORIZED, {
      authorizationId: authResult.authorizationId,
      orderId,
      captureLink: authResult.captureLink,
      voidLink: authResult.voidLink,
      amountCents: pledge.stake_cents,
    });

    return NextResponse.json({
      success: true,
      status: 'ACTIVE',
      authorizationId: authResult.authorizationId,
      captureLink: authResult.captureLink,
      voidLink: authResult.voidLink,
    });
  } catch (error: any) {
    console.error('Error authorizing PayPal hold:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to authorize hold' },
      { status: 500 }
    );
  }
}

