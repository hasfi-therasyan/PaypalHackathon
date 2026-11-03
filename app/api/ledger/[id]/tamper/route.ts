import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/app/lib/db';
import { verifyChain, canonicalJson, GENESIS_HASH, computeEventHash } from '@/app/lib/ledger/chain';

/**
 * Admin demo endpoint that SIMULATES a tamper on ledger event #2
 * by computing what the verification result WOULD look like if the
 * payload were secretly altered. This demonstrates the cryptographic
 * detection without actually corrupting the append-only database.
 *
 * The Supabase trigger (BEFORE UPDATE OR DELETE) prevents real tampering.
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

    // We will SIMULATE tampering event #2 (or #1 if only one event)
    const targetSeq = events.length > 1 ? 2 : 1;
    const targetIdx = targetSeq - 1;

    // Build a tampered copy of the events
    const tamperedEvents = events.map((ev, i) => {
      if (i === targetIdx) {
        return {
          ...ev,
          payload_json: {
            tampered_by: 'admin_demo_hack',
            unauthorized_status: 'PLEDGE_FORGED',
            original_type: ev.type,
          },
        };
      }
      return { ...ev };
    });

    // Verify the tampered chain (recompute hashes against stored hashes)
    let valid = true;
    let brokenSeq: number | null = null;
    let expectedPrevHash = GENESIS_HASH;

    const checkedEvents = tamperedEvents.map((ev, i) => {
      if (!valid) return ev; // stop checking after first break

      if (ev.seq !== i + 1) {
        valid = false;
        brokenSeq = ev.seq;
        return ev;
      }

      if (ev.prev_hash !== expectedPrevHash) {
        valid = false;
        brokenSeq = ev.seq;
        return ev;
      }

      const recomputedHash = computeEventHash(ev.prev_hash, ev.seq, ev.type, ev.payload_json);
      if (recomputedHash !== ev.hash) {
        valid = false;
        brokenSeq = ev.seq;
        return ev;
      }

      expectedPrevHash = ev.hash;
      return ev;
    });

    return NextResponse.json({
      simulated: true,
      message: `[DEMO] Simulated tampering of event #${targetSeq}. SHA-256 chain verification detected the forgery.`,
      verification: {
        valid,
        brokenSeq,
        totalEvents: tamperedEvents.length,
        events: checkedEvents,
      },
      note: 'The Supabase append-only trigger (BEFORE UPDATE/DELETE) prevents real tampering. This is a cryptographic simulation showing how any payload mutation instantly invalidates the chain.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
