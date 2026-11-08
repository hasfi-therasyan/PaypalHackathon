// app/lib/paypal/balance.ts

/**
 * Shared in-memory store for the simulated PayPal Sandbox Money Pool.
 * Default starting sandbox pool is $500.00 USD.
 */
let currentSandboxBalance = 500.0;

export function getSandboxBalance(): number {
  return currentSandboxBalance;
}

export function deductSandboxBalance(amountDollars: number): number {
  const deduct = Math.max(0, amountDollars);
  currentSandboxBalance = Math.max(0, parseFloat((currentSandboxBalance - deduct).toFixed(2)));
  return currentSandboxBalance;
}

export function topUpSandboxBalance(amountDollars: number): number {
  const add = Math.max(0, amountDollars);
  currentSandboxBalance = parseFloat((currentSandboxBalance + add).toFixed(2));
  return currentSandboxBalance;
}

export function setSandboxBalance(amountDollars: number): number {
  currentSandboxBalance = Math.max(0, parseFloat(amountDollars.toFixed(2)));
  return currentSandboxBalance;
}

