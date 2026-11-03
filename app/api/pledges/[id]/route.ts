import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyChain } from '@/app/lib/ledger/chain';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pledge = await db.pledges.get(params.id);
    if (!pledge) {
      return NextResponse.json({ error: 'Pledge not found' }, { status: 404 });
    }

    const proof = await db.proofs.getByPledge(params.id);
    const verdicts = await db.verdicts.getByPledge(params.id);
    const chainVerification = await verifyChain(params.id);

    return NextResponse.json({
      pledge,
      proof,
      verdicts,
      ledger: {
        valid: chainVerification.valid,
        brokenSeq: chainVerification.brokenSeq,
        totalEvents: chainVerification.totalEvents,
        events: chainVerification.events,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
