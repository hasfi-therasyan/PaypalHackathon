import { paypalFetch } from './client';

export interface CreateOrderResult {
  id: string;
  status: string;
  links: Array<{ href: string; rel: string; method: string }>;
}

export interface AuthorizeOrderResult {
  id: string;
  status: string;
  authorizationId: string;
  captureLink?: string;
  voidLink?: string;
  raw: any;
}

/**
 * Step 2: Create an order with intent: "AUTHORIZE"
 */
export async function createAuthorizeOrder(
  pledgeId: string,
  stakeCents: number,
  currency: string = 'USD'
): Promise<CreateOrderResult> {
  const amountStr = (stakeCents / 100).toFixed(2);

  const payload = {
    intent: 'AUTHORIZE',
    purchase_units: [
      {
        reference_id: pledgeId,
        custom_id: pledgeId,
        description: `Stake Commitment Pledge: ${pledgeId}`,
        amount: {
          currency_code: currency,
          value: amountStr,
        },
      },
    ],
    application_context: {
      brand_name: 'Stake',
      user_action: 'CONTINUE',
      shipping_preference: 'NO_SHIPPING',
    },
  };

  return await paypalFetch<CreateOrderResult>('/v2/checkout/orders', {
    method: 'POST',
    body: payload,
    requestId: `${pledgeId}-order`,
  });
}

/**
 * Step 4: Authorize the order on the server
 */
export async function authorizeOrder(orderId: string, pledgeId?: string): Promise<AuthorizeOrderResult> {
  const result = await paypalFetch<any>(`/v2/checkout/orders/${orderId}/authorize`, {
    method: 'POST',
    body: {},
    requestId: pledgeId ? `${pledgeId}-auth` : undefined,
  });

  const authorization = result.purchase_units?.[0]?.payments?.authorizations?.[0];
  if (!authorization) {
    throw new Error('PayPal authorization was not created in the order response.');
  }

  const captureLink = authorization.links?.find((l: any) => l.rel === 'capture')?.href;
  const voidLink = authorization.links?.find((l: any) => l.rel === 'void')?.href;

  return {
    id: result.id,
    status: result.status,
    authorizationId: authorization.id,
    captureLink,
    voidLink,
    raw: result,
  };
}

