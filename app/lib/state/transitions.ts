/**
 * Stake Pledge State Machine & Transition Engine
 */

export const PLEDGE_STATES = {
  CREATED: 'CREATED',
  RUBRIC_LOCKED: 'RUBRIC_LOCKED',
  ACTIVE: 'ACTIVE',
  APPEAL_WINDOW_OPEN: 'APPEAL_WINDOW_OPEN',
  APPEAL_WINDOW_CLOSED: 'APPEAL_WINDOW_CLOSED',
  SUCCEEDED: 'SUCCEEDED', // Hold voided
  CAPTURED: 'CAPTURED',   // Hold captured
  PAID_OUT: 'PAID_OUT',   // Payout completed
  CANCELLED: 'CANCELLED', // 5-minute grace cancellation
} as const;

export type PledgeState = keyof typeof PLEDGE_STATES;

export const ALLOWED_TRANSITIONS: Record<PledgeState, PledgeState[]> = {
  CREATED: ['RUBRIC_LOCKED'],
  RUBRIC_LOCKED: ['ACTIVE'],
  ACTIVE: ['APPEAL_WINDOW_OPEN', 'SUCCEEDED', 'CANCELLED'],
  APPEAL_WINDOW_OPEN: ['SUCCEEDED', 'CAPTURED', 'APPEAL_WINDOW_CLOSED'],
  APPEAL_WINDOW_CLOSED: ['CAPTURED', 'SUCCEEDED'],
  CAPTURED: ['PAID_OUT'],
  SUCCEEDED: [], // Terminal
  PAID_OUT: [],  // Terminal
  CANCELLED: [], // Terminal
};

export function canTransition(current: string, next: string): boolean {
  const allowed = ALLOWED_TRANSITIONS[current as PledgeState];
  if (!allowed) return false;
  return allowed.includes(next as PledgeState);
}

export function assertTransition(current: string, next: string): void {
  if (!canTransition(current, next)) {
    throw new Error(`Illegal state transition: Cannot transition pledge from '${current}' to '${next}'.`);
  }
}

/**
 * 5-minute grace cancellation check
 */
export function isWithinGraceCancellation(startsAtIso: string): boolean {
  const start = new Date(startsAtIso).getTime();
  const now = Date.now();
  const fiveMinutesMs = 5 * 60 * 1000;
  return now - start <= fiveMinutesMs;
}

