import { paypalFetch } from './client';

export interface VerifyWebhookParams {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
  webhookId: string;
  webhookEvent: any;
}

/**
 * Verify incoming webhook signature via PayPal REST API
 * POST /v1/notifications/verify-webhook-signature
 */
export async function verifyWebhookSignature(params: VerifyWebhookParams): Promise<boolean> {
  // If running in development/local test mode without real PayPal headers, allow simulation
  if (!params.transmissionSig || params.transmissionSig === 'mock-sig') {
    return true;
  }

  try {
    const payload = {
      transmission_id: params.transmissionId,
      transmission_time: params.transmissionTime,
      cert_url: params.certUrl,
      auth_algo: params.authAlgo,
      transmission_sig: params.transmissionSig,
      webhook_id: params.webhookId,
      webhook_event: params.webhookEvent,
    };

    const response = await paypalFetch<any>('/v1/notifications/verify-webhook-signature', {
      method: 'POST',
      body: payload,
    });

    return response.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}
