import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyChain } from '@/app/lib/ledger/chain';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const includeLedger = request.nextUrl.searchParams.get('includeLedger') === '1';
    const pledge = await db.pledges.get(params.id);
    if (!pledge) {
      return NextResponse.json({ error: 'Pledge not found' }, { status: 404 });
    }

    const [proof, verdicts, chainVerification] = await Promise.all([
      db.proofs.getByPledge(params.id),
      db.verdicts.getByPledge(params.id),
      includeLedger ? verifyChain(params.id) : Promise.resolve(null),
    ]);

    return NextResponse.json({
      pledge,
      proof,
      verdicts,
      ledger: {
        loaded: includeLedger,
        valid: chainVerification?.valid ?? null,
        brokenSeq: chainVerification?.brokenSeq ?? null,
        totalEvents: chainVerification?.totalEvents ?? null,
        events: chainVerification?.events ?? [],
      },
    }, { headers: { 'Cache-Control': 'private, max-age=0, s-maxage=10, stale-while-revalidate=20' } });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

