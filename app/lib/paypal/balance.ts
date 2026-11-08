// app/lib/paypal/balance.ts

/** Per-account balance store for the one-click simulated Sandbox Wallet. */
const DEFAULT_SANDBOX_BALANCE = 500.0;
const balances = new Map<string, number>();

function accountKey(accountId?: string): string {
  return accountId?.trim().toLowerCase() || 'demo-anonymous';
}

function roundUsd(value: number): number {
  return parseFloat(value.toFixed(2));
}

export function getSandboxBalance(accountId?: string): number {
  return balances.get(accountKey(accountId)) ?? DEFAULT_SANDBOX_BALANCE;
}

export function hasSandboxBalanceEntry(accountId?: string): boolean {
  return balances.has(accountKey(accountId));
}

export function deductSandboxBalance(accountId: string | undefined, amountDollars: number): number {
  const key = accountKey(accountId);
  const next = roundUsd(Math.max(0, getSandboxBalance(key) - Math.max(0, amountDollars)));
  balances.set(key, next);
  return next;
}

export function topUpSandboxBalance(accountId: string | undefined, amountDollars: number): number {
  const key = accountKey(accountId);
  const next = roundUsd(getSandboxBalance(key) + Math.max(0, amountDollars));
  balances.set(key, next);
  return next;
}

export function setSandboxBalance(accountId: string | undefined, amountDollars: number): number {
  const key = accountKey(accountId);
  const next = roundUsd(Math.max(0, amountDollars));
  balances.set(key, next);
  return next;
}

