import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { appendLedgerEvent, LEDGER_EVENT_TYPES } from '@/app/lib/ledger/chain';
import { isWithinGraceCancellation } from '@/app/lib/state/transitions';
import { voidAuthorization } from '@/app/lib/paypal/authorizations';
import { transitionOrThrow } from '@/app/lib/state/transitions';
import { getViewer, requirePledgeAccess } from '@/app/lib/access';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pledge = await db.pledges.get(params.id);
    if (!pledge) {
      return NextResponse.json({ error: 'Pledge not found' }, { status: 404 });
    }
    if (!requirePledgeAccess(pledge, getViewer(request), ['owner', 'admin']).allowed) {
      return NextResponse.json({ error: 'Only the commitment creator can cancel this hold.' }, { status: 403 });
    }

    if (pledge.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Only ACTIVE pledges can be cancelled.' },
        { status: 400 }
      );
    }

    if (!isWithinGraceCancellation(pledge.starts_at)) {
      return NextResponse.json(
        { error: '5-minute grace cancellation period has expired.' },
        { status: 400 }
      );
    }

    if (!pledge.paypal_authorization_id) return NextResponse.json({ error: 'PayPal authorization is missing.' }, { status: 409 });
    await voidAuthorization(pledge.paypal_authorization_id, pledge.stake_cents, pledge.user_id);

    transitionOrThrow(pledge.status, 'CANCELLED');
    await db.pledges.update(pledge.id, { status: 'CANCELLED' });

    await appendLedgerEvent(pledge.id, LEDGER_EVENT_TYPES.HOLD_VOIDED, {
      reason: 'Grace cancellation within 5 minutes',
      authorizationId: pledge.paypal_authorization_id,
    });

    return NextResponse.json({ success: true, status: 'CANCELLED' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

