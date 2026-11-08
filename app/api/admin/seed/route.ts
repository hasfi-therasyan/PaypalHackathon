import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db, PledgeRecord } from '@/app/lib/db';
import { appendLedgerEvent, canonicalJson, LEDGER_EVENT_TYPES } from '@/app/lib/ledger/chain';
import { getViewer } from '@/app/lib/access';

export async function POST(request: NextRequest) {
  if (getViewer(request)?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access is required.' }, { status: 403 });
  }
  if (process.env.DEMO_MODE !== 'true') {
    return NextResponse.json({ error: 'Demo seeding is disabled outside DEMO_MODE.' }, { status: 403 });
  }
  try {
    const demoPledges = [
      {
        title: 'Ship Next.js Hackathon API & Auth',
        goal_type: 'github' as const,
        stake_cents: 3500, // 35.00 USD
        beneficiary_name: 'Alex Rivera',
        beneficiary_paypal_email: 'sb-alex@personal.example.com',
        referee_email: 'sam-referee@example.com',
        status: 'ACTIVE',
        rubric: {
          type: 'github',
          repo: 'hasfi/stake-contract',
          username: 'hasfi',
          min_commits: 5,
          min_distinct_days: 2,
          min_changed_lines: 120,
        },
      },
      {
        title: 'Morning Gym Consistency 7am',
        goal_type: 'photo' as const,
        stake_cents: 2000, // 20.00 USD
        beneficiary_name: 'Jordan Lee',
        beneficiary_paypal_email: 'sb-jordan@personal.example.com',
        referee_email: 'coach-referee@example.com',
        status: 'SUCCEEDED',
        rubric: {
          type: 'photo',
          challenge_code: 'falcon-cedar-42',
          required_scene_elements: ['gym', 'equipment'],
          min_confidence: 0.85,
        },
      },
      {
        title: 'Daily Algorithm Practice (3 Solved)',
        goal_type: 'github' as const,
        stake_cents: 1500, // 15.00 USD
        beneficiary_name: 'Taylor Swift',
        beneficiary_paypal_email: 'sb-taylor@personal.example.com',
        referee_email: 'friend-reviewer@example.com',
        status: 'APPEAL_WINDOW_OPEN',
        rubric: {
          type: 'github',
          repo: 'hasfi/leetcode-daily',
          username: 'hasfi',
          min_commits: 3,
          min_distinct_days: 1,
          min_changed_lines: 60,
        },
      },
    ];

    const created = [];

    for (const item of demoPledges) {
      const id = crypto.randomUUID();
      const canonical = canonicalJson(item.rubric);
      const rubricHash = crypto.createHash('sha256').update(canonical).digest('hex');
      const now = new Date();
      const endsAt = new Date(now.getTime() + 48 * 3600 * 1000).toISOString();
      const appealEndsAt = new Date(now.getTime() + 72 * 3600 * 1000).toISOString();

      const pledgeRecord: PledgeRecord = {
        id,
        user_id: 'user_hasfi',
        title: item.title,
        goal_type: item.goal_type,
        rubric_json: item.rubric,
        rubric_hash: rubricHash,
        stake_cents: item.stake_cents,
        currency: 'USD',
        starts_at: now.toISOString(),
        ends_at: endsAt,
        appeal_ends_at: appealEndsAt,
        status: item.status,
        beneficiary_name: item.beneficiary_name,
        beneficiary_paypal_email: item.beneficiary_paypal_email,
        referee_email: item.referee_email,
        paypal_order_id: `ORDER-${id.slice(0, 8)}`,
        paypal_authorization_id: `AUTH-${id.slice(0, 8)}`,
        paypal_capture_id: item.status === 'PAID_OUT' ? `CAP-${id.slice(0, 8)}` : null,
        paypal_payout_batch_id: item.status === 'PAID_OUT' ? `PAYOUT-${id.slice(0, 8)}` : null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      await db.pledges.create(pledgeRecord);

      // Add ledger chain events
      await appendLedgerEvent(id, LEDGER_EVENT_TYPES.PLEDGE_CREATED, {
        title: item.title,
        goal_type: item.goal_type,
        stake_cents: item.stake_cents,
      });

      await appendLedgerEvent(id, LEDGER_EVENT_TYPES.RUBRIC_LOCKED, {
        rubric_hash: rubricHash,
        rubric: item.rubric,
      });

      await appendLedgerEvent(id, LEDGER_EVENT_TYPES.HOLD_AUTHORIZED, {
        authorizationId: pledgeRecord.paypal_authorization_id,
        amountCents: item.stake_cents,
      });

      if (item.status === 'SUCCEEDED') {
        await appendLedgerEvent(id, LEDGER_EVENT_TYPES.PROOF_SUBMITTED, { kind: item.goal_type });
        await appendLedgerEvent(id, LEDGER_EVENT_TYPES.VERDICT, { outcome: 'pass', source: 'rules' });
        await appendLedgerEvent(id, LEDGER_EVENT_TYPES.HOLD_VOIDED, { authorizationId: pledgeRecord.paypal_authorization_id });
      } else if (item.status === 'APPEAL_WINDOW_OPEN') {
        await appendLedgerEvent(id, LEDGER_EVENT_TYPES.PROOF_SUBMITTED, { kind: item.goal_type });
        await appendLedgerEvent(id, LEDGER_EVENT_TYPES.VERDICT, { outcome: 'borderline', source: 'ai' });
        await appendLedgerEvent(id, LEDGER_EVENT_TYPES.APPEAL_OPENED, { appealEndsAt });
      }

      created.push(pledgeRecord);
    }

    return NextResponse.json({ success: true, seeded: created });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

