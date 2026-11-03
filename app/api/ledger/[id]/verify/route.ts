import { NextRequest, NextResponse } from 'next/server';
import { verifyChain } from '@/app/lib/ledger/chain';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await verifyChain(params.id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
