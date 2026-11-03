import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/payouts
 * PayPal payout handler (demo mode)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Demo mode - return simulated payout
    return NextResponse.json({
      batchId: `${body.authorizationId}-payout-demo`,
      payoutId: crypto.randomUUID(),
      status: 'SCHEDULED',
      sent_to: body.beneficiaryEmail,
      amount: `${body.stakeCents} cents`,
    });
  } catch (error) {
    console.error('Payout error:', error);
    return NextResponse.json(
      { error: 'Payout handler failed' },
      { status: 500 }
    );
  }
}
