import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyChain } from '@/app/lib/ledger/chain';

/**
 * Admin demo endpoint to deliberately tamper with one row in the ledger
 * to demonstrate the tamper-evident SHA-256 verification turning red.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const events = await db.ledger.listByPledge(params.id);
    if (events.length === 0) {
      return NextResponse.json({ error: 'No ledger events found to tamper.' }, { status: 400 });
    }

    const targetSeq = events.length > 1 ? 2 : 1;
    await db.ledger.tamperEvent(params.id, targetSeq, {
      tampered_by: 'admin_demo_hack',
      unauthorized_status: 'PLEDGE_FORGED',
    });

    const verifyResult = await verifyChain(params.id);
    return NextResponse.json({
      message: `Event #${targetSeq} successfully tampered.`,
      verification: verifyResult,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

