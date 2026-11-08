import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { db, PledgeRecord } from '@/app/lib/db';
import { appendLedgerEvent, canonicalJson, LEDGER_EVENT_TYPES } from '@/app/lib/ledger/chain';
import { generateChallengeCode } from '@/app/lib/referee/photo';
import { getViewer } from '@/app/lib/access';

const MIN_STAKE_CENTS = 0;    // Allows from $0.01 cents upwards with no upper limit
const MAX_SPRINT_HOURS = 48;  // 48 hours sprint limit

const CreatePledgeSchema = z.object({
  goal_type: z.enum(['github', 'photo']),
  goal_title: z.string().min(3, 'Goal title must be at least 3 characters'),
  rubric_json: z.record(z.any()),
  stake_cents: z.number().int().min(MIN_STAKE_CENTS), // No upper limit capacity
  beneficiary_name: z.string().min(1, 'Beneficiary name is required'),
  beneficiary_paypal_email: z.string().email('Valid beneficiary PayPal email required'),
  referee_email: z.string().email('Valid referee email required'),
  sprint_hours: z.number().int().min(1).max(MAX_SPRINT_HOURS).default(48),
  user_email: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const validated = CreatePledgeSchema.safeParse(rawBody);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.format() },
        { status: 400 }
      );
    }

    const body = validated.data;
    const viewer = getViewer(request);
    const creatorEmail = viewer?.email || body.user_email || 'user@example.com';
    const pledgeId = crypto.randomUUID();

    // Attach challenge code to photo rubric if photo goal
    const rubricToLock = { ...body.rubric_json };
    if (body.goal_type === 'photo' && !rubricToLock.challenge_code) {
      rubricToLock.challenge_code = generateChallengeCode();
    }

    // Freeze rubric JSON and compute SHA-256 hash from canonical representation
    const canonicalRubric = canonicalJson(rubricToLock);
    const rubricHash = crypto.createHash('sha256').update(canonicalRubric).digest('hex');

    const now = new Date();
    const endsAt = new Date(now.getTime() + body.sprint_hours * 60 * 60 * 1000).toISOString();
    const appealEndsAt = new Date(new Date(endsAt).getTime() + 24 * 60 * 60 * 1000).toISOString();

    const pledgeRecord: PledgeRecord = {
      id: pledgeId,
      user_id: creatorEmail,
      title: body.goal_title,
      goal_type: body.goal_type as any,
      rubric_json: rubricToLock,
      rubric_hash: rubricHash,
      stake_cents: body.stake_cents,
      currency: 'USD',
      starts_at: now.toISOString(),
      ends_at: endsAt,
      appeal_ends_at: appealEndsAt,
      status: body.stake_cents === 0 ? 'ACTIVE' : 'RUBRIC_LOCKED',
      beneficiary_name: body.beneficiary_name,
      beneficiary_paypal_email: body.beneficiary_paypal_email,
      referee_email: body.referee_email,
      paypal_order_id: null,
      paypal_authorization_id: null,
      paypal_capture_id: null,
      paypal_payout_batch_id: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    // Save to database
    await db.pledges.create(pledgeRecord);

    // Record initial ledger events
    await appendLedgerEvent(pledgeId, LEDGER_EVENT_TYPES.PLEDGE_CREATED, {
      title: body.goal_title,
      goal_type: body.goal_type,
      stake_cents: body.stake_cents,
      beneficiary: body.beneficiary_name,
      referee: body.referee_email,
    });

    await appendLedgerEvent(pledgeId, LEDGER_EVENT_TYPES.RUBRIC_LOCKED, {
      rubric_hash: rubricHash,
      rubric_json: rubricToLock,
    });

    return NextResponse.json(pledgeRecord, { status: 201 });
  } catch (error: any) {
    console.error('Error creating pledge:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create pledge' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || 20);
    const cursor = searchParams.get('cursor');
    const scope = searchParams.get('scope') || 'owner';
    const viewer = getViewer(request);
    if (!viewer) {
      return NextResponse.json({ error: 'Sign in to view commitments.' }, { status: 401 });
    }

    if (scope === 'owner') {
      const page = await db.pledges.listPage({ limit, cursor, userId: viewer.email });
      return NextResponse.json(page, {
        headers: { 'Cache-Control': 'private, max-age=0, s-maxage=15, stale-while-revalidate=30' },
      });
    }

    if (scope === 'referee') {
      const page = await db.pledges.listPage({ limit: 50, cursor });
      const pledges = page.pledges.filter(
        (pledge) => viewer.role === 'admin' || pledge.referee_email.toLowerCase() === viewer.email
      );
      return NextResponse.json({ pledges, nextCursor: null }, {
        headers: { 'Cache-Control': 'private, max-age=0, s-maxage=15, stale-while-revalidate=30' },
      });
    }

    return NextResponse.json({ error: 'Unknown commitment scope.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
