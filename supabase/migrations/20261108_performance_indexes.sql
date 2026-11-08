-- Fast dashboard pages and minute-by-minute settlement queries.
CREATE INDEX IF NOT EXISTS idx_pledges_user_created
  ON pledges (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pledges_status_ends
  ON pledges (status, ends_at);
CREATE INDEX IF NOT EXISTS idx_pledges_status_appeal_ends
  ON pledges (status, appeal_ends_at);
CREATE INDEX IF NOT EXISTS idx_verdicts_pledge_created
  ON verdicts (pledge_id, created_at DESC);
