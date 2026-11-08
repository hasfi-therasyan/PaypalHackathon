import { paypalFetch } from './client';
import { topUpSandboxBalance } from './balance';
import crypto from 'crypto';

export interface CaptureResult {
  id: string;
  status: string;
  amount: {
    currency_code: string;
    value: string;
  };
  final_capture: boolean;
}

export function isSandboxBalanceAuthorization(authorizationId: string): boolean {
  return authorizationId.startsWith('AUTH-SB-');
}

/**
 * Success path: Void authorization hold
 * POST /v2/payments/authorizations/{id}/void
 */
export async function voidAuthorization(
  authorizationId: string,
  amountCents?: number,
  accountId?: string
): Promise<boolean> {
  if (isSandboxBalanceAuthorization(authorizationId)) {
    // AUTH-SB IDs belong to Stake's local Sandbox Wallet—not PayPal Orders.
    // Release the simulated hold locally and never send that synthetic ID to
    // PayPal, where it correctly returns a 404.
    if (amountCents) topUpSandboxBalance(accountId, amountCents / 100);
    return true;
  }
  await paypalFetch(`/v2/payments/authorizations/${authorizationId}/void`, {
    method: 'POST',
    body: {},
  });
  return true;
}

/**
 * Failure path: Capture authorization hold
 * POST /v2/payments/authorizations/{id}/capture
 */
export async function captureAuthorization(
  authorizationId: string,
  amountCents: number,
  pledgeId: string,
  currency: string = 'USD'
): Promise<CaptureResult> {
  const amountStr = (amountCents / 100).toFixed(2);

  if (isSandboxBalanceAuthorization(authorizationId)) {
    return {
      id: `CAP-SB-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`,
      status: 'COMPLETED',
      amount: { currency_code: currency, value: amountStr },
      final_capture: true,
    };
  }

  const payload = {
    amount: {
      currency_code: currency,
      value: amountStr,
    },
    final_capture: true,
  };

  return await paypalFetch<CaptureResult>(`/v2/payments/authorizations/${authorizationId}/capture`, {
    method: 'POST',
    body: payload,
    requestId: `${pledgeId}-capture`,
  });
}

