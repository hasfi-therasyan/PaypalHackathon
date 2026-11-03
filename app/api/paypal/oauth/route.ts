// app/api/paypal/oauth/route.ts
import { NextResponse } from 'next/server';

/**
 * PayPal OAuth "authorization_code" flow for sandbox login.
 * This endpoint receives the `code` query parameter from PayPal,
 * exchanges it for an access token and stores the token in an
 * HttpOnly secure cookie. Afterwards the user is redirected back
 * to the front‑end (root). The cookie is used by `/api/paypal/userinfo`
 * to fetch the sandbox account balance.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const redirectUri = process.env.PAYPAL_REDIRECT_URI; // must match the value configured in PayPal app

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: 'PayPal env vars not configured' }, { status: 500 });
  }

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenRes = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=authorization_code&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}`,
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    return NextResponse.json({ error: 'Token exchange failed', details: errorText }, { status: tokenRes.status });
  }

  const tokenData = await tokenRes.json();
  const response = NextResponse.redirect(new URL('/', request.url));
  // Store token in HttpOnly cookie (secure, sameSite lax). Expiration follows PayPal's expires_in.
  response.cookies.set('paypal_access_token', tokenData.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: tokenData.expires_in ?? 3600,
    path: '/',
  });

  return response;
}

