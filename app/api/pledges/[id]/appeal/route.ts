import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db, VerdictRecord } from '@/app/lib/db';
import { appendLedgerEvent, LEDGER_EVENT_TYPES } from '@/app/lib/ledger/chain';
import { applyFriendDecision } from '@/app/lib/referee/verdict';
import { voidAuthorization, captureAuthorization, isSandboxBalanceAuthorization } from '@/app/lib/paypal/authorizations';
import { deductSandboxBalance, hasSandboxBalanceEntry } from '@/app/lib/paypal/balance';
import { createPayout } from '@/app/lib/paypal/payouts';
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
    if (!requirePledgeAccess(pledge, getViewer(request), ['referee', 'admin']).allowed) {
      return NextResponse.json({ error: 'Only the nominated referee can make this decision.' }, { status: 403 });
    }

    if (pledge.status !== 'APPEAL_WINDOW_OPEN') {
      return NextResponse.json(
        { error: 'Appeal window is not open or already resolved.' },
        { status: 400 }
      );
    }
    if (new Date(pledge.appeal_ends_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'The appeal window has expired.' }, { status: 409 });
    }

    const body = await request.json();
    const approved = Boolean(body.approved);
    const note = body.note || (approved ? 'Approved by referee.' : 'Denied by referee.');

    const decision = applyFriendDecision(approved, note);

    // Save friend verdict
    const verdictRecord: VerdictRecord = {
      id: crypto.randomUUID(),
      pledge_id: pledge.id,
      source: 'friend',
      outcome: decision.outcome,
      reasoning: decision.reasoning,
      created_at: new Date().toISOString(),
    };
    await db.verdicts.create(verdictRecord);

    await appendLedgerEvent(pledge.id, LEDGER_EVENT_TYPES.FRIEND_DECISION, {
      approved,
      note,
      outcome: decision.outcome,
    });

    if (approved) {
      // Void hold on pass
      if (!pledge.paypal_authorization_id) return NextResponse.json({ error: 'PayPal authorization is missing.' }, { status: 409 });
      await voidAuthorization(pledge.paypal_authorization_id, pledge.stake_cents, pledge.user_id);
      transitionOrThrow(pledge.status, 'SUCCEEDED');
      await db.pledges.update(pledge.id, { status: 'SUCCEEDED' });
      await appendLedgerEvent(pledge.id, LEDGER_EVENT_TYPES.HOLD_VOIDED, { authorizationId: pledge.paypal_authorization_id });
      return NextResponse.json({ success: true, status: 'SUCCEEDED', verdict: verdictRecord });
    } else {
      // Capture hold and initiate payout on fail
      if (!pledge.paypal_authorization_id) return NextResponse.json({ error: 'PayPal authorization is missing.' }, { status: 409 });
      const cap = await captureAuthorization(
        pledge.paypal_authorization_id,
        pledge.stake_cents,
        pledge.id,
        pledge.currency
      );
      const captureId = cap.id;

      // Normally the sandbox balance was reserved when the hold was created.
      // When an older pledge survives a server restart, restore that missing
      // reservation at capture time so a denied commitment never displays the
      // untouched $500.00 default to its creator.
      if (
        isSandboxBalanceAuthorization(pledge.paypal_authorization_id) &&
        !hasSandboxBalanceEntry(pledge.user_id)
      ) {
        deductSandboxBalance(pledge.user_id, pledge.stake_cents / 100);
      }

      await appendLedgerEvent(pledge.id, LEDGER_EVENT_TYPES.HOLD_CAPTURED, {
        captureId,
        amountCents: pledge.stake_cents,
      });

      transitionOrThrow(pledge.status, 'CAPTURED');
      await db.pledges.update(pledge.id, {
        status: 'CAPTURED',
        paypal_capture_id: captureId,
      });
      // The verified PAYMENT.CAPTURE.COMPLETED webhook creates the payout. It
      // is the source of truth for moving from CAPTURED to PAID_OUT.
      return NextResponse.json({ success: true, status: 'CAPTURED', verdict: verdictRecord });
    }
  } catch (error: any) {
    console.error('Error handling appeal:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

