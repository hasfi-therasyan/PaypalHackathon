import { paypalFetch } from './client';

export interface CaptureResult {
  id: string;
  status: string;
  amount: {
    currency_code: string;
    value: string;
  };
  final_capture: boolean;
}

/**
 * Success path: Void authorization hold
 * POST /v2/payments/authorizations/{id}/void
 */
export async function voidAuthorization(authorizationId: string): Promise<boolean> {
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
