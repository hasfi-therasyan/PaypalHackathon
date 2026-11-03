import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/app/lib/db';
import { appendLedgerEvent, LEDGER_EVENT_TYPES } from '@/app/lib/ledger/chain';
import { verifyWebhookSignature } from '@/app/lib/paypal/webhooks';
import { createPayout } from '@/app/lib/paypal/payouts';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const headers = request.headers;
    const transmissionId = headers.get('paypal-transmission-id') || '';
    const transmissionTime = headers.get('paypal-transmission-time') || '';
    const certUrl = headers.get('paypal-cert-url') || '';
    const authAlgo = headers.get('paypal-auth-algo') || '';
    const transmissionSig = headers.get('paypal-transmission-sig') || '';
    const webhookId = process.env.PAYPAL_WEBHOOK_ID || 'STAKE_DEMO_WEBHOOK_ID';

    // Verify signature
    const isValid = await verifyWebhookSignature({
      transmissionId,
      transmissionTime,
      certUrl,
      authAlgo,
      transmissionSig,
      webhookId,
      webhookEvent: event,
    });

    if (!isValid) {
      console.warn('Rejected PayPal webhook with invalid signature.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const eventId = event.id || `event-${crypto.randomUUID()}`;
    const eventType = event.event_type || 'UNKNOWN';

    // Deduplicate webhook events
    const alreadyProcessed = await db.webhooks.hasEvent(eventId);
    if (alreadyProcessed) {
      return NextResponse.json({ status: 'already_processed', eventId });
    }

    await db.webhooks.recordEvent({
      id: crypto.randomUUID(),
      paypal_event_id: eventId,
      type: eventType,
      payload_json: event,
      processed_at: new Date().toISOString(),
    });

    // Locate affected pledge by custom_id or reference_id
    const resource = event.resource || {};
    const pledgeId = resource.custom_id || resource.reference_id || resource.invoice_id;

    if (pledgeId) {
      const pledge = await db.pledges.get(pledgeId);
      if (pledge) {
        await appendLedgerEvent(pledge.id, LEDGER_EVENT_TYPES.WEBHOOK_RECEIVED, {
          eventType,
          eventId,
        });

        // Act on specific events
        if (eventType === 'PAYMENT.AUTHORIZATION.VOIDED') {
          if (pledge.status !== 'SUCCEEDED' && pledge.status !== 'CANCELLED') {
            await db.pledges.update(pledge.id, { status: 'SUCCEEDED' });
            await appendLedgerEvent(pledge.id, LEDGER_EVENT_TYPES.HOLD_VOIDED, {
              source: 'webhook',
              authorizationId: resource.id,
            });
          }
        } else if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
          if (pledge.status !== 'CAPTURED' && pledge.status !== 'PAID_OUT') {
            await db.pledges.update(pledge.id, {
              status: 'CAPTURED',
              paypal_capture_id: resource.id,
            });
            await appendLedgerEvent(pledge.id, LEDGER_EVENT_TYPES.HOLD_CAPTURED, {
              source: 'webhook',
              captureId: resource.id,
            });

            // Automatically trigger payout
            try {
              const payout = await createPayout(
                pledge.id,
                pledge.beneficiary_paypal_email,
                pledge.stake_cents,
                pledge.currency
              );
              await db.pledges.update(pledge.id, {
                status: 'PAID_OUT',
                paypal_payout_batch_id: payout.batch_header.payout_batch_id,
              });
              await appendLedgerEvent(pledge.id, LEDGER_EVENT_TYPES.PAYOUT_SENT, {
                payoutBatchId: payout.batch_header.payout_batch_id,
                beneficiary: pledge.beneficiary_paypal_email,
              });
            } catch (e) {
              console.warn('Auto-payout on capture webhook failed:', e);
            }
          }
        }
      }
    }

    return NextResponse.json({ status: 'success', eventType, eventId });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: error?.message || 'Webhook processing failed' }, { status: 500 });
  }
}
