import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyChain } from '@/app/lib/ledger/chain';
import { getViewer, requirePledgeAccess } from '@/app/lib/access';
import { getProofStorageClient } from '@/app/lib/proofs/storage';

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
    const viewer = getViewer(request);
    const { allowed, access } = requirePledgeAccess(pledge, viewer, ['owner', 'referee', 'admin']);
    if (!allowed) {
      return NextResponse.json({ error: 'You do not have access to this commitment.' }, { status: 403 });
    }

    const [proof, verdicts, chainVerification] = await Promise.all([
      db.proofs.getByPledge(params.id),
      db.verdicts.getByPledge(params.id),
      includeLedger ? verifyChain(params.id) : Promise.resolve(null),
    ]);

    let proofImageUrl: string | null = null;
    if (proof?.storage_path) {
      try {
        const { data } = await getProofStorageClient()
          .storage
          .from('proofs')
          .createSignedUrl(proof.storage_path, 60 * 60);
        proofImageUrl = data?.signedUrl || null;
      } catch {
        // Fallback
      }
    }

    return NextResponse.json({
      pledge,
      proof,
      verdicts: verdicts || [],
      access,
      proofImageUrl,
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
