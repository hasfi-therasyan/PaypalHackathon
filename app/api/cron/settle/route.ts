import { NextRequest, NextResponse } from 'next/server';
import { settleDuePledges } from '@/app/lib/settlement/due-pledges';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized cron request.' }, { status: 401 });
  }
  const result = await settleDuePledges();
  return NextResponse.json(result, { status: result.failures.length ? 207 : 200 });
}
