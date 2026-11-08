// app/api/paypal/userinfo/route.ts
import { NextResponse } from 'next/server';
import { getLiveSandboxBalance, topUpSandboxBalance, deductSandboxBalance, setSandboxBalance } from '@/app/lib/paypal/balance';
import { getViewer } from '@/app/lib/access';

export const dynamic = 'force-dynamic';

/**
 * Returns current sandbox pool balance or live PayPal userinfo, dynamically computed
 * from active authorization holds according to system escrow rules.
 */
export async function GET(request: Request) {
  try {
    const token = request.headers.get('cookie')?.match(/paypal_access_token=([^;]+)/)?.[1];
    const accountId = getViewer(request)?.email;
    const report = await getLiveSandboxBalance(accountId);

    if (!token) {
      return NextResponse.json({
        balance: report.balance,
        startingBalance: report.startingBalance,
        heldBalance: report.heldBalance,
        capturedBalance: report.capturedBalance,
        activeHoldsCount: report.activeHoldsCount,
        currency: 'USD',
        authenticated: false,
        accountEmail: accountId || 'sb-buyer@personal.example.com',
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
        balance: report.balance,
        startingBalance: report.startingBalance,
        heldBalance: report.heldBalance,
        capturedBalance: report.capturedBalance,
        activeHoldsCount: report.activeHoldsCount,
        currency: 'USD',
        authenticated: true,
        accountEmail: accountId || 'sb-buyer@personal.example.com',
      });
    }

    const data = await userInfoRes.json();
    return NextResponse.json({
      balance: report.balance,
      startingBalance: report.startingBalance,
      heldBalance: report.heldBalance,
      capturedBalance: report.capturedBalance,
      activeHoldsCount: report.activeHoldsCount,
      currency: 'USD',
      authenticated: true,
      accountEmail: data.email || accountId || 'sb-buyer@personal.example.com',
    });
  } catch (error: any) {
    console.warn('PayPal userinfo error fallback:', error);
    const accountId = getViewer(request)?.email;
    const report = await getLiveSandboxBalance(accountId);
    return NextResponse.json({
      balance: report.balance,
      startingBalance: report.startingBalance,
      heldBalance: report.heldBalance,
      capturedBalance: report.capturedBalance,
      activeHoldsCount: report.activeHoldsCount,
      currency: 'USD',
      authenticated: false,
      accountEmail: accountId || 'sb-buyer@personal.example.com',
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

    const accountId = getViewer(request)?.email;
    if (action === 'deduct') {
      deductSandboxBalance(accountId, numAmount);
    } else if (action === 'topup') {
      topUpSandboxBalance(accountId, numAmount);
    } else if (action === 'set') {
      setSandboxBalance(accountId, numAmount);
    }

    const report = await getLiveSandboxBalance(accountId);
    return NextResponse.json({
      balance: report.balance,
      startingBalance: report.startingBalance,
      heldBalance: report.heldBalance,
      capturedBalance: report.capturedBalance,
      activeHoldsCount: report.activeHoldsCount,
      currency: 'USD',
      success: true,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
