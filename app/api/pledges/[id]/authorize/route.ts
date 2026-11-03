// app/api/pledges/[id]/authorize/route.ts
import { NextResponse } from 'next/server';
import { authorizeOrder } from '@/app/lib/paypal/orders';
import { db } from '@/app/lib/db';

/**
 * POST endpoint that receives a PayPal `orderId` after the user approves checkout.
 * It authorizes the order via PayPal, stores the `authorizationId` on the pledge
 * and updates the pledge status to `PLEDGE_AUTHORIZED`.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { orderId } = await request.json();
  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
  }

  try {
    const result = await authorizeOrder(orderId, params.id);
    await db.pledges.update(params.id, {
      paypal_authorization_id: result.authorizationId,
      status: 'PLEDGE_AUTHORIZED',
    });
    return NextResponse.json({ authorizationId: result.authorizationId, status: result.status });
  } catch (err: any) {
    console.error('Authorize order failed', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
