import { captureAuthorization } from '@/app/lib/paypal/authorizations';
import { db, PledgeRecord } from '@/app/lib/db';
import { appendLedgerEvent, LEDGER_EVENT_TYPES } from '@/app/lib/ledger/chain';
import { transitionOrThrow } from '@/app/lib/state/transitions';

async function captureExpiredPledge(pledge: PledgeRecord, reason: string): Promise<void> {
  if (!pledge.paypal_authorization_id) {
    throw new Error(`Pledge ${pledge.id} is due but has no PayPal authorization.`);
  }
  const capture = await captureAuthorization(
    pledge.paypal_authorization_id,
    pledge.stake_cents,
    pledge.id,
    pledge.currency
  );
  transitionOrThrow(pledge.status, 'CAPTURED');
  await db.pledges.update(pledge.id, { status: 'CAPTURED', paypal_capture_id: capture.id });
  await appendLedgerEvent(pledge.id, LEDGER_EVENT_TYPES.HOLD_CAPTURED, {
    captureId: capture.id,
    amountCents: pledge.stake_cents,
    reason,
  });
}

/** Resolves overdue contracts. Payout waits for the capture-completed webhook. */
export async function settleDuePledges(now = new Date()): Promise<{ settled: string[]; failures: Array<{ id: string; error: string }> }> {
  const due = await db.pledges.listDue(now.toISOString());
  const settled: string[] = [];
  const failures: Array<{ id: string; error: string }> = [];

  for (const pledge of due) {
    try {
      if (pledge.status === 'ACTIVE') {
        await captureExpiredPledge(pledge, 'No proof submitted before sprint deadline.');
      } else if (pledge.status === 'APPEAL_WINDOW_OPEN') {
        await captureExpiredPledge(pledge, 'Appeal window expired without a referee decision.');
      }
      settled.push(pledge.id);
    } catch (error: any) {
      failures.push({ id: pledge.id, error: error?.message || 'Settlement failed' });
    }
  }
  return { settled, failures };
}
