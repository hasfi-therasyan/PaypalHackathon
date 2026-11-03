/**
 * PayPal Sandbox API Client
 * Manages OAuth2 token lifecycle and base HTTP requests
 */

const PAYPAL_BASE_URL = 'https://api-m.sandbox.paypal.com';

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: TokenCache | null = null;

export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal Client ID or Secret is not configured in environment variables.');
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.accessToken;
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to obtain PayPal OAuth token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + (data.expires_in || 3600) * 1000,
  };

  return cachedToken.accessToken;
}

export async function paypalFetch<T = any>(
  path: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    requestId?: string;
  } = {}
): Promise<T> {
  const token = await getPayPalAccessToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  if (options.requestId) {
    headers['PayPal-Request-Id'] = options.requestId;
  }

  const url = path.startsWith('http') ? path : `${PAYPAL_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const responseText = await response.text();
  let json: any = null;
  try {
    json = responseText ? JSON.parse(responseText) : {};
  } catch (e) {
    json = { raw: responseText };
  }

  if (!response.ok) {
    const errorMsg = json?.message || json?.error_description || responseText || response.statusText;
    const err = new Error(`PayPal API Error [${response.status}] ${path}: ${errorMsg}`);
    (err as any).status = response.status;
    (err as any).data = json;
    throw err;
  }

  return json as T;
}

