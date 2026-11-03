import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// No hardcoded fallback: without real creds, supabase client points nowhere
// and every call below throws, so the in-memory fallback kicks in (demo-safe).
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://invalid.supabase.co',
  supabaseKey || 'invalid',
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
      try {
        const { data, error } = await supabase.from('pledges').insert([pledge]).select().single();
        if (!error && data) return data as PledgeRecord;
      } catch (e) {
        console.warn('Supabase insert fallback to memory:', e);
      }
      return pledge;
    },

    async get(id: string): Promise<PledgeRecord | null> {
      try {
        const { data, error } = await supabase.from('pledges').select('*').eq('id', id).maybeSingle();
        if (!error && data) return data as PledgeRecord;
      } catch (e) {
        // fallback
      }
      return memoryStore.pledges.get(id) || null;
    },

    async update(id: string, updates: Partial<PledgeRecord>): Promise<PledgeRecord | null> {
      const existing = memoryStore.pledges.get(id);
      if (existing) {
        const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
        memoryStore.pledges.set(id, updated);
      }
      try {
        const { data, error } = await supabase
          .from('pledges')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .maybeSingle();
        if (!error && data) return data as PledgeRecord;
      } catch (e) {
        // fallback
      }
      return memoryStore.pledges.get(id) || null;
    },

    async list(): Promise<PledgeRecord[]> {
      try {
        const { data, error } = await supabase.from('pledges').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data as PledgeRecord[];
      } catch (e) {
        // fallback
      }
      return Array.from(memoryStore.pledges.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
  },

  proofs: {
    async create(proof: ProofRecord): Promise<ProofRecord> {
      memoryStore.proofs.set(proof.pledge_id, proof);
      try {
        await supabase.from('proofs').insert([proof]);
      } catch (e) {}
      return proof;
    },

    async getByPledge(pledgeId: string): Promise<ProofRecord | null> {
      try {
        const { data } = await supabase.from('proofs').select('*').eq('pledge_id', pledgeId).maybeSingle();
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
      try {
        await supabase.from('verdicts').insert([verdict]);
      } catch (e) {}
      return verdict;
    },

    async getByPledge(pledgeId: string): Promise<VerdictRecord[]> {
      try {
        const { data } = await supabase
          .from('verdicts')
          .select('*')
          .eq('pledge_id', pledgeId)
          .order('created_at', { ascending: false });
        if (data && data.length > 0) return data as VerdictRecord[];
      } catch (e) {}
      return (memoryStore.verdicts.get(pledgeId) || []).slice().reverse();
    },
  },

  ledger: {
    async listByPledge(pledgeId: string): Promise<LedgerEventRecord[]> {
      try {
        const { data } = await supabase
          .from('ledger_events')
          .select('*')
          .eq('pledge_id', pledgeId)
          .order('seq', { ascending: true });
        if (data && data.length > 0) return data as LedgerEventRecord[];
      } catch (e) {}
      return (memoryStore.ledgerEvents.get(pledgeId) || []).slice().sort((a, b) => a.seq - b.seq);
    },

    async append(event: LedgerEventRecord): Promise<LedgerEventRecord> {
      const list = memoryStore.ledgerEvents.get(event.pledge_id) || [];
      list.push(event);
      memoryStore.ledgerEvents.set(event.pledge_id, list);
      try {
        await supabase.from('ledger_events').insert([event]);
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
      try {
        const { data } = await supabase
          .from('webhook_events')
          .select('id')
          .eq('paypal_event_id', paypalEventId)
          .maybeSingle();
        return !!data;
      } catch (e) {
        return false;
      }
    },

    async recordEvent(event: WebhookEventRecord): Promise<void> {
      memoryStore.webhookEvents.set(event.paypal_event_id, event);
      try {
        await supabase.from('webhook_events').insert([event]);
      } catch (e) {}
    },
  },
};

