import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseUrl = rawUrl && rawUrl.startsWith('http') ? rawUrl : 'https://placeholder.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'placeholder_anon_key';

// Never make a network request to the placeholder client.  The app keeps a
// memory-backed demo store, so an absent or malformed Supabase configuration
// should be instant rather than waiting for a DNS/network timeout.
export const hasSupabasePersistence = Boolean(
  rawUrl?.startsWith('http') &&
  !rawUrl.includes('placeholder.supabase.co') &&
  supabaseKey !== 'placeholder_anon_key'
);

const DB_REQUEST_TIMEOUT_MS = 1_500;

function withDatabaseTimeout<T>(operation: PromiseLike<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Supabase request timed out')),
      DB_REQUEST_TIMEOUT_MS
    );
    Promise.resolve(operation).then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
}

// Demo-safe Supabase client: if placeholder/invalid, calls fall back to memoryStore
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseKey,
  { auth: { persistSession: false } }
);

export interface PledgeRecord {
  id: string;
  user_id: string;
  title: string;
  goal_type: 'github' | 'photo';
  rubric_json: Record<string, any>;
  rubric_hash: string;
  stake_cents: number;
  currency: string;
  starts_at: string;
  ends_at: string;
  appeal_ends_at: string;
  status: string;
  beneficiary_name: string;
  beneficiary_paypal_email: string;
  referee_email: string;
  paypal_order_id?: string | null;
  paypal_authorization_id?: string | null;
  paypal_capture_id?: string | null;
  paypal_payout_batch_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PledgePage {
  pledges: PledgeRecord[];
  nextCursor: string | null;
}

export interface ProofRecord {
  id: string;
  pledge_id: string;
  kind: 'github' | 'photo';
  challenge_code?: string | null;
  storage_path?: string | null;
  submitted_at: string;
  signals_json: Record<string, any>;
  ai_findings_json: Record<string, any>;
  confidence: number;
}

export interface VerdictRecord {
  id: string;
  pledge_id: string;
  source: 'rules' | 'ai' | 'friend';
  outcome: 'pass' | 'fail' | 'borderline';
  reasoning: string;
  created_at: string;
}

export interface LedgerEventRecord {
  id: string;
  pledge_id: string;
  seq: number;
  type: string;
  payload_json: Record<string, any>;
  prev_hash: string;
  hash: string;
  created_at: string;
}

export interface WebhookEventRecord {
  id: string;
  paypal_event_id: string;
  type: string;
  payload_json: Record<string, any>;
  processed_at: string;
}

// In-memory fallback repository for instant reactivity and demo stability
const memoryStore: {
  pledges: Map<string, PledgeRecord>;
  proofs: Map<string, ProofRecord>;
  verdicts: Map<string, VerdictRecord[]>;
  ledgerEvents: Map<string, LedgerEventRecord[]>;
  webhookEvents: Map<string, WebhookEventRecord>;
} = {
  pledges: new Map(),
  proofs: new Map(),
  verdicts: new Map(),
  ledgerEvents: new Map(),
  webhookEvents: new Map(),
};

export const db = {
  pledges: {
    async create(pledge: PledgeRecord): Promise<PledgeRecord> {
      memoryStore.pledges.set(pledge.id, { ...pledge });
      if (hasSupabasePersistence) {
        try {
          const { data, error } = await withDatabaseTimeout(supabase.from('pledges').insert([pledge]).select().single());
          if (error || !data) {
            throw new Error(error?.message || 'Supabase did not return the saved commitment.');
          }
          return data as PledgeRecord;
        } catch (error: any) {
          memoryStore.pledges.delete(pledge.id);
          throw new Error(`Could not save the commitment to shared storage: ${error?.message || 'unknown database error'}`);
        }
      }
      return pledge;
    },

    async get(id: string): Promise<PledgeRecord | null> {
      if (hasSupabasePersistence) {
        try {
          const { data, error } = await withDatabaseTimeout(
            supabase.from('pledges').select('*').eq('id', id).maybeSingle()
          );
          if (!error && data) return data as PledgeRecord;
        } catch {
          // Fall through to the local demo store without keeping the page loading.
        }
      }
      return memoryStore.pledges.get(id) || null;
    },

    async update(id: string, updates: Partial<PledgeRecord>): Promise<PledgeRecord | null> {
      const existing = memoryStore.pledges.get(id);
      if (existing) {
        const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
        memoryStore.pledges.set(id, updated);
      }
      if (hasSupabasePersistence) {
        try {
          const { data, error } = await withDatabaseTimeout(supabase
            .from('pledges')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .maybeSingle());
          if (error || !data) {
            throw new Error(error?.message || 'Supabase did not return the updated commitment.');
          }
          return data as PledgeRecord;
        } catch (error: any) {
          throw new Error(`Could not update the commitment in shared storage: ${error?.message || 'unknown database error'}`);
        }
      }
      return memoryStore.pledges.get(id) || null;
    },

    async list(): Promise<PledgeRecord[]> {
      if (hasSupabasePersistence) try {
        const { data, error } = await withDatabaseTimeout(supabase.from('pledges').select('*').order('created_at', { ascending: false }));
        if (!error && data && data.length > 0) return data as PledgeRecord[];
      } catch (e) {
        // fallback
      }
      return Array.from(memoryStore.pledges.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },

    async listPage(options: { limit?: number; cursor?: string | null; userId?: string } = {}): Promise<PledgePage> {
      const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);
      if (hasSupabasePersistence) try {
        let query = supabase
          .from('pledges')
          .select('id,user_id,title,goal_type,stake_cents,currency,starts_at,ends_at,appeal_ends_at,status,beneficiary_name,referee_email,paypal_authorization_id,created_at,updated_at')
          .order('created_at', { ascending: false })
          .limit(limit + 1);
        if (options.userId) query = query.eq('user_id', options.userId);
        if (options.cursor) query = query.lt('created_at', options.cursor);
        const { data, error } = await withDatabaseTimeout(query);
        if (!error && data) {
          const hasNext = data.length > limit;
          const pledges = data.slice(0, limit) as PledgeRecord[];
          return { pledges, nextCursor: hasNext ? pledges[pledges.length - 1]?.created_at ?? null : null };
        }
      } catch {
        // Local demo fallback below.
      }
      let pledges = Array.from(memoryStore.pledges.values());
      if (options.userId) {
        const normalizedUserId = options.userId.trim().toLowerCase();
        pledges = pledges.filter(
          (pledge) => pledge.user_id?.trim().toLowerCase() === normalizedUserId
        );
      }
      pledges = pledges
        .filter((pledge) => !options.cursor || pledge.created_at < options.cursor)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const page = pledges.slice(0, limit);
      return { pledges: page, nextCursor: pledges.length > limit ? page[page.length - 1]?.created_at ?? null : null };
    },

    async listDue(nowIso: string): Promise<PledgeRecord[]> {
      if (hasSupabasePersistence) try {
        const [active, appeals] = await Promise.all([
          withDatabaseTimeout(supabase.from('pledges').select('*').eq('status', 'ACTIVE').lte('ends_at', nowIso)),
          withDatabaseTimeout(supabase.from('pledges').select('*').eq('status', 'APPEAL_WINDOW_OPEN').lte('appeal_ends_at', nowIso)),
        ]);
        if (!active.error && !appeals.error) {
          return [...(active.data || []), ...(appeals.data || [])] as PledgeRecord[];
        }
      } catch {
        // Local demo fallback below.
      }
      return Array.from(memoryStore.pledges.values()).filter(
        (pledge) =>
          (pledge.status === 'ACTIVE' && pledge.ends_at <= nowIso) ||
          (pledge.status === 'APPEAL_WINDOW_OPEN' && pledge.appeal_ends_at <= nowIso)
      );
    },

    async reliability(userId: string): Promise<{ successes: number; failures: number }> {
      if (hasSupabasePersistence) try {
        const { data, error } = await withDatabaseTimeout(supabase
          .from('pledges')
          .select('status')
          .eq('user_id', userId)
          .in('status', ['SUCCEEDED', 'CAPTURED', 'PAID_OUT']));
        if (!error && data) {
          return {
            successes: data.filter((pledge) => pledge.status === 'SUCCEEDED').length,
            failures: data.filter((pledge) => pledge.status === 'CAPTURED' || pledge.status === 'PAID_OUT').length,
          };
        }
      } catch {
        // Local demo fallback below.
      }
      const normalizedUserId = userId.trim().toLowerCase();
      const pledges = Array.from(memoryStore.pledges.values()).filter(
        (pledge) => pledge.user_id?.trim().toLowerCase() === normalizedUserId
      );
      return {
        successes: pledges.filter((pledge) => pledge.status === 'SUCCEEDED').length,
        failures: pledges.filter((pledge) => pledge.status === 'CAPTURED' || pledge.status === 'PAID_OUT').length,
      };
    },
  },

  proofs: {
    async create(proof: ProofRecord): Promise<ProofRecord> {
      memoryStore.proofs.set(proof.pledge_id, proof);
      if (hasSupabasePersistence) try {
        await withDatabaseTimeout(supabase.from('proofs').insert([proof]));
      } catch (e) {}
      return proof;
    },

    async getByPledge(pledgeId: string): Promise<ProofRecord | null> {
      if (hasSupabasePersistence) try {
        const { data } = await withDatabaseTimeout(
          supabase.from('proofs').select('*').eq('pledge_id', pledgeId).maybeSingle()
        );
        if (data) return data as ProofRecord;
      } catch (e) {}
      return memoryStore.proofs.get(pledgeId) || null;
    },
  },

  verdicts: {
    async create(verdict: VerdictRecord): Promise<VerdictRecord> {
      const list = memoryStore.verdicts.get(verdict.pledge_id) || [];
      list.push(verdict);
      memoryStore.verdicts.set(verdict.pledge_id, list);
      if (hasSupabasePersistence) try {
        await withDatabaseTimeout(supabase.from('verdicts').insert([verdict]));
      } catch (e) {}
      return verdict;
    },

    async getByPledge(pledgeId: string): Promise<VerdictRecord[]> {
      if (hasSupabasePersistence) try {
        const { data } = await withDatabaseTimeout(supabase
          .from('verdicts')
          .select('*')
          .eq('pledge_id', pledgeId)
          .order('created_at', { ascending: false }));
        if (data && data.length > 0) return data as VerdictRecord[];
      } catch (e) {}
      return (memoryStore.verdicts.get(pledgeId) || []).slice().reverse();
    },
  },

  ledger: {
    async listByPledge(pledgeId: string): Promise<LedgerEventRecord[]> {
      if (hasSupabasePersistence) try {
        const { data } = await withDatabaseTimeout(supabase
          .from('ledger_events')
          .select('*')
          .eq('pledge_id', pledgeId)
          .order('seq', { ascending: true }));
        if (data && data.length > 0) return data as LedgerEventRecord[];
      } catch (e) {}
      return (memoryStore.ledgerEvents.get(pledgeId) || []).slice().sort((a, b) => a.seq - b.seq);
    },

    async append(event: LedgerEventRecord): Promise<LedgerEventRecord> {
      const list = memoryStore.ledgerEvents.get(event.pledge_id) || [];
      list.push(event);
      memoryStore.ledgerEvents.set(event.pledge_id, list);
      if (hasSupabasePersistence) try {
        await withDatabaseTimeout(supabase.from('ledger_events').insert([event]));
      } catch (e) {}
      return event;
    },

    async tamperEvent(pledgeId: string, seq: number, fakePayload: Record<string, any>): Promise<void> {
      // Only updates in-memory store (Supabase append-only trigger prevents DB tampering by design)
      const list = memoryStore.ledgerEvents.get(pledgeId) || [];
      const ev = list.find((e) => e.seq === seq);
      if (ev) {
        ev.payload_json = fakePayload;
      }
    },
  },

  webhooks: {
    async hasEvent(paypalEventId: string): Promise<boolean> {
      if (memoryStore.webhookEvents.has(paypalEventId)) return true;
      if (hasSupabasePersistence) try {
        const { data } = await withDatabaseTimeout(supabase
          .from('webhook_events')
          .select('id')
          .eq('paypal_event_id', paypalEventId)
          .maybeSingle());
        return !!data;
      } catch (e) {
        return false;
      }
    },

    async recordEvent(event: WebhookEventRecord): Promise<void> {
      memoryStore.webhookEvents.set(event.paypal_event_id, event);
      if (hasSupabasePersistence) try {
        await withDatabaseTimeout(supabase.from('webhook_events').insert([event]));
      } catch (e) {}
    },
  },
};

