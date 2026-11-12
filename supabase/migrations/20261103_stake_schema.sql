-- Stake Database Schema for Supabase PostgreSQL
-- 5 Core Tables + Constraints + Append-Only Ledger Triggers

-- 1. PLEDGES TABLE
CREATE TABLE IF NOT EXISTS pledges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL DEFAULT 'user_demo',
    title TEXT NOT NULL,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('github', 'photo')),
    rubric_json JSONB NOT NULL,
    rubric_hash TEXT NOT NULL,
    stake_cents INTEGER NOT NULL CHECK (stake_cents >= 500), -- Minimum 5 USD, no application cap
    currency TEXT NOT NULL DEFAULT 'USD',
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ NOT NULL,
    appeal_ends_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'CREATED',
    beneficiary_name TEXT NOT NULL,
    beneficiary_paypal_email TEXT NOT NULL,
    referee_email TEXT NOT NULL,
    paypal_order_id TEXT,
    paypal_authorization_id TEXT,
    paypal_capture_id TEXT,
    paypal_payout_batch_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PROOFS TABLE
CREATE TABLE IF NOT EXISTS proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pledge_id UUID NOT NULL REFERENCES pledges(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('github', 'photo')),
    challenge_code TEXT,
    storage_path TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    signals_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    ai_findings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    confidence NUMERIC(3, 2) DEFAULT 1.00
);

-- 3. VERDICTS TABLE
CREATE TABLE IF NOT EXISTS verdicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pledge_id UUID NOT NULL REFERENCES pledges(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('rules', 'ai', 'friend')),
    outcome TEXT NOT NULL CHECK (outcome IN ('pass', 'fail', 'borderline')),
    reasoning TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. LEDGER_EVENTS TABLE (Append-Only Hash-Chained Audit Trail)
CREATE TABLE IF NOT EXISTS ledger_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pledge_id UUID NOT NULL REFERENCES pledges(id) ON DELETE CASCADE,
    seq INTEGER NOT NULL,
    type TEXT NOT NULL,
    payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    prev_hash TEXT NOT NULL,
    hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pledge_seq UNIQUE(pledge_id, seq)
);

-- Prevent UPDATE and DELETE on ledger_events to guarantee tamper-evidence
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'ledger_events is append-only: UPDATE or DELETE is strictly forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_ledger_modification ON ledger_events;
CREATE TRIGGER trg_prevent_ledger_modification
BEFORE UPDATE OR DELETE ON ledger_events
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();

-- 5. WEBHOOK_EVENTS TABLE (Idempotency and deduplication)
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paypal_event_id TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful query indexes
CREATE INDEX IF NOT EXISTS idx_pledges_status ON pledges(status);
CREATE INDEX IF NOT EXISTS idx_proofs_pledge_id ON proofs(pledge_id);
CREATE INDEX IF NOT EXISTS idx_verdicts_pledge_id ON verdicts(pledge_id);
CREATE INDEX IF NOT EXISTS idx_ledger_pledge_seq ON ledger_events(pledge_id, seq);

