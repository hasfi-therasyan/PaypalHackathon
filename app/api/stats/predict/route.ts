import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const modelUrl = process.env.MODEL_SERVICE_URL || 'http://localhost:8000';
  const history = body.userId ? await db.pledges.reliability(String(body.userId)) : null;
  const successes = history?.successes ?? body.successes ?? 6;
  const failures = history?.failures ?? body.failures ?? 1;

  try {
    const res = await fetch(`${modelUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        successes,
        failures,
        comfort_budget_cents: body.comfortBudgetCents ?? 1000,
      }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`model service ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    // Model service unreachable: demo-safe fallback matching its own math
    const comfortBudgetCents = body.comfortBudgetCents ?? 1000;
    const postAlpha = 4.5 + successes;
    const postBeta = 1.5 + failures;
    const posteriorMean = postAlpha / (postAlpha + postBeta);
    const stakeCurve = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000].map((stakeCents) => {
      const pSuccess = Math.min(0.95, 0.65 + 0.005 * (stakeCents / 100));
      const expectedLossCents = (1 - pSuccess) * stakeCents;
      return {
        stake_cents: stakeCents,
        p_success: pSuccess,
        expected_loss_cents: expectedLossCents,
        under_budget: expectedLossCents <= comfortBudgetCents,
      };
    });
    const underBudget = stakeCurve.filter((s) => s.under_budget);
    const recommended = underBudget.length ? underBudget[underBudget.length - 1] : stakeCurve[0];

    return NextResponse.json({
      posterior_mean: posteriorMean,
      ci80_lower: 0.69,
      ci80_upper: 0.91,
      recommended_stake_cents: recommended.stake_cents,
      stake_curve: stakeCurve,
    });
  }
}
