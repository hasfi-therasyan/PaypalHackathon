import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db, VerdictRecord } from '@/app/lib/db';
import { appendLedgerEvent, LEDGER_EVENT_TYPES } from '@/app/lib/ledger/chain';
import { applyFriendDecision } from '@/app/lib/referee/verdict';
import { voidAuthorization, captureAuthorization } from '@/app/lib/paypal/authorizations';
import { createPayout } from '@/app/lib/paypal/payouts';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pledge = await db.pledges.get(params.id);
    if (!pledge) {
      return NextResponse.json({ error: 'Pledge not found' }, { status: 404 });
    }

    if (pledge.status !== 'APPEAL_WINDOW_OPEN') {
      return NextResponse.json(
        { error: 'Appeal window is not open or already resolved.' },
        { status: 400 }
      );
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
      if (pledge.paypal_authorization_id) {
        try {
          await voidAuthorization(pledge.paypal_authorization_id);
          await appendLedgerEvent(pledge.id, LEDGER_EVENT_TYPES.HOLD_VOIDED, {
            authorizationId: pledge.paypal_authorization_id,
          });
        } catch (e) {
          console.warn('Friend approval void error:', e);
        }
      }
      await db.pledges.update(pledge.id, { status: 'SUCCEEDED' });
      return NextResponse.json({ success: true, status: 'SUCCEEDED', verdict: verdictRecord });
    } else {
      // Capture hold and initiate payout on fail
      let captureId = 'simulated_capture';
      if (pledge.paypal_authorization_id) {
        try {
          const cap = await captureAuthorization(
            pledge.paypal_authorization_id,
            pledge.stake_cents,
            pledge.id,
            pledge.currency
          );
          captureId = cap.id;
        } catch (e) {
          console.warn('Capture error:', e);
        }
      }

      await appendLedgerEvent(pledge.id, LEDGER_EVENT_TYPES.HOLD_CAPTURED, {
        captureId,
        amountCents: pledge.stake_cents,
      });

      // Payout to beneficiary
      let payoutBatchId = `${pledge.id}-payout`;
      try {
        const payout = await createPayout(
          pledge.id,
          pledge.beneficiary_paypal_email,
          pledge.stake_cents,
          pledge.currency
        );
        payoutBatchId = payout.batch_header.payout_batch_id;
      } catch (e) {
        console.warn('Payout error:', e);
      }

      await appendLedgerEvent(pledge.id, LEDGER_EVENT_TYPES.PAYOUT_SENT, {
        payoutBatchId,
        beneficiary: pledge.beneficiary_paypal_email,
        amountCents: pledge.stake_cents,
      });

      await db.pledges.update(pledge.id, {
        status: 'PAID_OUT',
        paypal_capture_id: captureId,
        paypal_payout_batch_id: payoutBatchId,
      });

      return NextResponse.json({ success: true, status: 'PAID_OUT', verdict: verdictRecord });
    }
  } catch (error: any) {
    console.error('Error handling appeal:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

