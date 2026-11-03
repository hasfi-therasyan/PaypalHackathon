import { paypalFetch } from './client';

export interface PayoutResult {
  batch_header: {
    payout_batch_id: string;
    batch_status: string;
    sender_batch_header: {
      sender_batch_id: string;
    };
  };
}

/**
 * Step 8: Send payout to beneficiary on failure
 * POST /v1/payments/payouts
 */
export async function createPayout(
  pledgeId: string,
  beneficiaryEmail: string,
  amountCents: number,
  currency: string = 'USD'
): Promise<PayoutResult> {
  const amountStr = (amountCents / 100).toFixed(2);

  const payload = {
    sender_batch_header: {
      sender_batch_id: `${pledgeId}-payout`,
      email_subject: 'You received a payout from Stake commitment pledge!',
      email_message: `A commitment contract pledge was forfeited and the stake has been transferred to you.`,
    },
    items: [
      {
        recipient_type: 'EMAIL',
        amount: {
          value: amountStr,
          currency,
        },
        receiver: beneficiaryEmail,
        note: `Forfeited pledge stake: ${pledgeId}`,
        sender_item_id: `${pledgeId}-item-1`,
      },
    ],
  };

  return await paypalFetch<PayoutResult>('/v1/payments/payouts', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Poll status of payout batch
 * GET /v1/payments/payouts/{batch_id}
 */
export async function getPayoutBatch(batchId: string): Promise<any> {
  return await paypalFetch(`/v1/payments/payouts/${batchId}`, {
    method: 'GET',
  });
}
