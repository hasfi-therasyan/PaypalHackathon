-- Existing deployments created the pledge stake constraint with a $50 cap.
-- Keep the $5 minimum while removing the application-level maximum.
ALTER TABLE pledges
  DROP CONSTRAINT IF EXISTS pledges_stake_cents_check;

ALTER TABLE pledges
  ADD CONSTRAINT pledges_stake_cents_check
  CHECK (stake_cents >= 500);
