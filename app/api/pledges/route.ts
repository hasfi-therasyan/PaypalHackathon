import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { db, PledgeRecord } from '@/app/lib/db';
import { appendLedgerEvent, canonicalJson, LEDGER_EVENT_TYPES } from '@/app/lib/ledger/chain';
import { generateChallengeCode } from '@/app/lib/referee/photo';

const MAX_STAKE_CENTS = 5000; // $50.00 USD hard limit
const MIN_STAKE_CENTS = 0;     // $0.00 USD minimum as requested by user
const MAX_SPRINT_HOURS = 48;  // 48 hours sprint limit

const CreatePledgeSchema = z.object({
  goal_type: z.string().min(1, 'Goal type is required'),
  goal_title: z.string().min(3, 'Goal title must be at least 3 characters'),
  rubric_json: z.record(z.any()),
  stake_cents: z.number().int().min(MIN_STAKE_CENTS).max(MAX_STAKE_CENTS),
  beneficiary_name: z.string().min(1, 'Beneficiary name is required'),
  beneficiary_paypal_email: z.string().email('Valid beneficiary PayPal email required'),
  referee_email: z.string().email('Valid referee email required'),
  sprint_hours: z.number().int().min(1).max(MAX_SPRINT_HOURS).default(48),
  user_email: z.string().optional(),
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
      user_id: body.user_email || 'hasfi@personal.example.com',
      title: body.goal_title,
      goal_type: body.goal_type as any,
      rubric_json: rubricToLock,
      rubric_hash: rubricHash,
      stake_cents: body.stake_cents,
      currency: 'USD',
      starts_at: now.toISOString(),
      ends_at: endsAt,
      appeal_ends_at: appealEndsAt,
      status: 'RUBRIC_LOCKED',
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

export async function GET() {
  try {
    const list = await db.pledges.list();
    return NextResponse.json({ pledges: list });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
