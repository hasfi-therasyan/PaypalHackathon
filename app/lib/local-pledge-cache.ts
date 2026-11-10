const CACHE_KEY = 'stake_demo_pledges_v1';

type CachedPledge = Record<string, any> & { id: string; user_id?: string };

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || 'user@example.com';
}

function readCache(): CachedPledge[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id) : [];
  } catch {
    return [];
  }
}

function writeCache(pledges: CachedPledge[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(pledges.slice(0, 50)));
  } catch {
    // Browser storage is only a continuity fallback; the database remains the source of truth.
  }
}

/**
 * Retains a browser-local copy of a pledge created in this session. This keeps
 * the demo legible when a serverless deployment has not been connected to its
 * shared Supabase database yet; it never replaces the server response.
 */
export function cachePledge(pledge: CachedPledge) {
  const existing = readCache();
  const next = [pledge, ...existing.filter((item) => item.id !== pledge.id)];
  writeCache(next);
}

export function patchCachedPledge(id: string, updates: Record<string, any>) {
  const existing = readCache();
  const next = existing.map((pledge) => (
    pledge.id === id ? { ...pledge, ...updates, updated_at: new Date().toISOString() } : pledge
  ));
  writeCache(next);
}

export function getCachedPledges(email?: string | null): CachedPledge[] {
  const owner = normalizeEmail(email);
  return readCache()
    .filter((pledge) => normalizeEmail(pledge.user_id) === owner)
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
}

/** A browser-only ledger projection for an unconfigured serverless demo. */
export function getCachedPool(email?: string | null) {
  const pledges = getCachedPledges(email);
  let heldCents = 0;
  let capturedCents = 0;
  let activeHoldsCount = 0;

  for (const pledge of pledges) {
    const stakeCents = Number(pledge.stake_cents || 0);
    if (pledge.status === 'ACTIVE' || pledge.status === 'APPEAL_WINDOW_OPEN') {
      heldCents += stakeCents;
      activeHoldsCount += 1;
    } else if (pledge.status === 'CAPTURED') {
      capturedCents += stakeCents;
    }
  }

  if (!heldCents && !capturedCents) return null;
  const heldBalance = Number((heldCents / 100).toFixed(2));
  const capturedBalance = Number((capturedCents / 100).toFixed(2));
  return {
    balance: Number(Math.max(0, 500 - heldBalance - capturedBalance).toFixed(2)),
    startingBalance: 500,
    heldBalance,
    capturedBalance,
    activeHoldsCount,
  };
}
