// app/api/paypal/userinfo/route.ts
import { NextResponse } from 'next/server';
import { getSandboxBalance, topUpSandboxBalance, deductSandboxBalance, setSandboxBalance } from '@/app/lib/paypal/balance';

export const dynamic = 'force-dynamic';

/**
 * Returns current sandbox pool balance or live PayPal userinfo.
 */
export async function GET(request: Request) {
  try {
    const token = request.headers.get('cookie')?.match(/paypal_access_token=([^;]+)/)?.[1];
    const currentBalance = getSandboxBalance();

    if (!token) {
      return NextResponse.json({
        balance: currentBalance,
        currency: 'USD',
        authenticated: false,
        accountEmail: 'sb-buyer@personal.example.com',
      });
    }

    const userInfoRes = await fetch('https://api-m.sandbox.paypal.com/v1/identity/openidconnect/userinfo/?schema=paypalv1.1', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!userInfoRes.ok) {
      return NextResponse.json({
        balance: currentBalance,
        currency: 'USD',
        authenticated: true,
        accountEmail: 'sb-buyer@personal.example.com',
      });
    }

    const data = await userInfoRes.json();
    return NextResponse.json({
      balance: currentBalance,
      currency: 'USD',
      authenticated: true,
      accountEmail: data.email || 'sb-buyer@personal.example.com',
    });
  } catch (error: any) {
    console.warn('PayPal userinfo error fallback:', error);
    return NextResponse.json({
      balance: getSandboxBalance(),
      currency: 'USD',
      authenticated: false,
      accountEmail: 'sb-buyer@personal.example.com',
    });
  }
}

/**
 * POST endpoint to adjust the sandbox money pool balance (e.g. deduct for a pledge hold or top-up)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, amount } = body;
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;

    let updatedBalance = getSandboxBalance();
    if (action === 'deduct') {
      updatedBalance = deductSandboxBalance(numAmount);
    } else if (action === 'topup') {
      updatedBalance = topUpSandboxBalance(numAmount);
    } else if (action === 'set') {
      updatedBalance = setSandboxBalance(numAmount);
    }

    return NextResponse.json({
      balance: updatedBalance,
      currency: 'USD',
      success: true,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
