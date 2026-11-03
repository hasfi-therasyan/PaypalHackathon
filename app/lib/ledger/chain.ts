import crypto from 'crypto';
import { db, LedgerEventRecord } from '../db';

export const GENESIS_HASH = '0'.repeat(64);

export const LEDGER_EVENT_TYPES = {
  PLEDGE_CREATED: 'PLEDGE_CREATED',
  RUBRIC_LOCKED: 'RUBRIC_LOCKED',
  PAYPAL_ORDER_CREATED: 'PAYPAL_ORDER_CREATED',
  HOLD_AUTHORIZED: 'HOLD_AUTHORIZED',
  PROOF_SUBMITTED: 'PROOF_SUBMITTED',
  SIGNALS_COMPUTED: 'SIGNALS_COMPUTED',
  AI_FINDINGS: 'AI_FINDINGS',
  VERDICT: 'VERDICT',
  APPEAL_OPENED: 'APPEAL_OPENED',
  FRIEND_DECISION: 'FRIEND_DECISION',
  HOLD_VOIDED: 'HOLD_VOIDED',
  HOLD_CAPTURED: 'HOLD_CAPTURED',
  PAYOUT_SENT: 'PAYOUT_SENT',
  WEBHOOK_RECEIVED: 'WEBHOOK_RECEIVED',
} as const;

export type LedgerEventType = keyof typeof LEDGER_EVENT_TYPES;

/**
 * Sort all object keys alphabetically for deterministic canonical JSON serialization
 */
export function canonicalJson(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalJson(item)).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const entries = sortedKeys.map((key) => `${JSON.stringify(key)}:${canonicalJson(obj[key])}`);
  return '{' + entries.join(',') + '}';
}

/**
 * Calculate SHA-256 hash of an event: sha256(prev_hash + "|" + canonicalJson(event_data))
 */
export function computeEventHash(prevHash: string, seq: number, type: string, payload: Record<string, any>): string {
  const dataToHash = `${prevHash}|${canonicalJson({ seq, type, payload })}`;
  return crypto.createHash('sha256').update(dataToHash).digest('hex');
}

/**
 * Append an immutable event to the hash chain
 */
export async function appendLedgerEvent(
  pledgeId: string,
  type: LedgerEventType | string,
  payload: Record<string, any>
): Promise<LedgerEventRecord> {
  const existingEvents = await db.ledger.listByPledge(pledgeId);
  const nextSeq = existingEvents.length + 1;
  const prevHash = existingEvents.length === 0 ? GENESIS_HASH : existingEvents[existingEvents.length - 1].hash;
  const hash = computeEventHash(prevHash, nextSeq, type, payload);

  const eventRecord: LedgerEventRecord = {
    id: crypto.randomUUID(),
    pledge_id: pledgeId,
    seq: nextSeq,
    type,
    payload_json: payload,
    prev_hash: prevHash,
    hash,
    created_at: new Date().toISOString(),
  };

  return await db.ledger.append(eventRecord);
}

/**
 * Recompute and verify the entire hash chain for a pledge
 * Returns whether the chain is intact and the first broken sequence number if tampered
 */
export async function verifyChain(pledgeId: string): Promise<{
  valid: boolean;
  brokenSeq: number | null;
  totalEvents: number;
  events: LedgerEventRecord[];
}> {
  const events = await db.ledger.listByPledge(pledgeId);
  if (events.length === 0) {
    return { valid: true, brokenSeq: null, totalEvents: 0, events: [] };
  }

  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];

    // Check sequence continuity
    if (ev.seq !== i + 1) {
      return { valid: false, brokenSeq: ev.seq, totalEvents: events.length, events };
    }

    // Check link to previous hash
    if (ev.prev_hash !== expectedPrevHash) {
      return { valid: false, brokenSeq: ev.seq, totalEvents: events.length, events };
    }

    // Recompute current hash
    const recomputedHash = computeEventHash(ev.prev_hash, ev.seq, ev.type, ev.payload_json);
    if (recomputedHash !== ev.hash) {
      return { valid: false, brokenSeq: ev.seq, totalEvents: events.length, events };
    }

    expectedPrevHash = ev.hash;
  }

  return { valid: true, brokenSeq: null, totalEvents: events.length, events };
}

