// app/lib/paypal/balance.ts
import { db, PledgeRecord } from '@/app/lib/db';

export const DEFAULT_SANDBOX_BALANCE = 500.0;

// Persistent or in-memory manual adjustments (top-ups)
const balanceAdjustments = new Map<string, number>();

function accountKey(accountId?: string): string {
  return accountId?.trim().toLowerCase() || 'user@example.com';
}

function roundUsd(value: number): number {
  return parseFloat(value.toFixed(2));
}

export interface SandboxBalanceReport {
  balance: number;
  startingBalance: number;
  heldBalance: number;
  capturedBalance: number;
  activeHoldsCount: number;
}

/**
 * Computes live PayPal Sandbox available balance for an account by applying
 * the system escrow rules:
 * Starting Pool ($500.00)
 *   - Active Authorization Holds (pledges with status ACTIVE or APPEAL_WINDOW_OPEN)
 *   - Captured Stakes (pledges with status CAPTURED)
 *   + Manual adjustments/top-ups
 *
 * Held funds in SUCCEEDED or CANCELLED pledges are voided/released back to the pool.
 */
export async function getLiveSandboxBalance(accountId?: string): Promise<SandboxBalanceReport> {
  const normalizedAccount = accountKey(accountId);
  let pledges: PledgeRecord[] = [];

  try {
    const allPledges = await db.pledges.list();
    pledges = allPledges.filter((p) => {
      const pUserId = p.user_id?.trim().toLowerCase();
      if (pUserId === normalizedAccount) return true;
      if (normalizedAccount === 'user@example.com' && (!pUserId || pUserId === 'demo-anonymous')) return true;
      return false;
    });
  } catch (err) {
    console.warn('Could not query pledges for sandbox balance calculation:', err);
  }

  let heldCents = 0;
  let capturedCents = 0;
  let activeHoldsCount = 0;

  for (const p of pledges) {
    const stake = p.stake_cents || 0;
    if (p.status === 'ACTIVE' || p.status === 'APPEAL_WINDOW_OPEN') {
      heldCents += stake;
      activeHoldsCount++;
    } else if (p.status === 'CAPTURED') {
      capturedCents += stake;
    }
  }

  const heldDollars = roundUsd(heldCents / 100);
  const capturedDollars = roundUsd(capturedCents / 100);
  const adjustment = balanceAdjustments.get(normalizedAccount) ?? 0;

  const availableBalance = roundUsd(
    Math.max(0, DEFAULT_SANDBOX_BALANCE - heldDollars - capturedDollars + adjustment)
  );

  return {
    balance: availableBalance,
    startingBalance: DEFAULT_SANDBOX_BALANCE,
    heldBalance: heldDollars,
    capturedBalance: capturedDollars,
    activeHoldsCount,
  };
}

export function getSandboxBalance(accountId?: string): number {
  const key = accountKey(accountId);
  const adj = balanceAdjustments.get(key) ?? 0;
  return roundUsd(Math.max(0, DEFAULT_SANDBOX_BALANCE + adj));
}

export function hasSandboxBalanceEntry(accountId?: string): boolean {
  return balanceAdjustments.has(accountKey(accountId));
}

export function deductSandboxBalance(accountId: string | undefined, amountDollars: number): number {
  const key = accountKey(accountId);
  const currentAdj = balanceAdjustments.get(key) ?? 0;
  const nextAdj = roundUsd(currentAdj - Math.max(0, amountDollars));
  balanceAdjustments.set(key, nextAdj);
  return roundUsd(Math.max(0, DEFAULT_SANDBOX_BALANCE + nextAdj));
}

export function topUpSandboxBalance(accountId: string | undefined, amountDollars: number): number {
  const key = accountKey(accountId);
  const currentAdj = balanceAdjustments.get(key) ?? 0;
  const nextAdj = roundUsd(currentAdj + Math.max(0, amountDollars));
  balanceAdjustments.set(key, nextAdj);
  return roundUsd(Math.max(0, DEFAULT_SANDBOX_BALANCE + nextAdj));
}

export function setSandboxBalance(accountId: string | undefined, amountDollars: number): number {
  const key = accountKey(accountId);
  const target = roundUsd(Math.max(0, amountDollars));
  const nextAdj = roundUsd(target - DEFAULT_SANDBOX_BALANCE);
  balanceAdjustments.set(key, nextAdj);
  return target;
}
