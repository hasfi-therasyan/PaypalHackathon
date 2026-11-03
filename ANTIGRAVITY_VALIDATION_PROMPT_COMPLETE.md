# Antigravity AI Validation Prompt

## Paste This Prompt to Antigravity AI
You are an expert code reviewer and PayPal AI Hackathon judge. Your task is to validate the Stake commitment-contract app implementation against the build guide (Stake build guide for the PayPal AI Hackathon.md).
Project root: c:\\HASFI\\Projects\\Paypal Hackathon
DO NOT execute code, delete files, or make changes. Only READ files, inspect code, and report findings.
## Validation Scope
Validate against ALL requirements in the build guide. Categorize each finding as: PASS: Requirement fully implemented and correct; PARTIAL: Partially implemented but missing key details; FAIL: Not implemented or fundamentally wrong; MISSING: File or section does not exist
### 1. Hard Limits (MUST be enforced)
- [ ] Sandbox only: PAYPAL_ENV=sandbox in env, no live PayPal endpoints
- [ ] Stake capped at 50 USD: MAX_STAKE_USD=50, enforced in UI and API

- [ ] Stake capped at 50 USD: MAX_STAKE_USD=50, enforced in UI and API
- [ ] Sprint length at most 48 hours: UI enforces max 48h sprint duration
- [ ] All PayPal calls use sandbox URLs (api-m.sandbox.paypal.com)

### 2. Must-Ship Feature 1: Create Pledge
Route: /new
- [ ] Goal type selector: GitHub OR photo
- [ ] Goal title input
- [ ] Rubric JSON form with locked preview and SHA-256 hash display
- [ ] Stake slider (5-50 USD, integer cents)
- [ ] Beneficiary name and PayPal email fields
- [ ] Friend referee email field
- [ ] Consent line: "If I fail, X USD goes to Sam"
- [ ] Submitting creates a pledge row with frozen rubric
- [ ] Redirects to approve page after creation

### 3. Must-Ship Feature 2: PayPal AUTHORIZE Hold
Route: /pledges/[id]/approve
- [ ] Order created with `intent: "AUTHORIZE"` (POST /v2/checkout/orders)
- [ ] Purchase unit with amount, reference_id=pledge ID, custom_id=pledge ID
- [ ] PayPal-Request-Id header on order creation (`pledgeId-order`)
- [ ] JS SDK loaded with `intent=authorize`
- [ ] `createOrder` calls server endpoint; `onApprove` calls authorize endpoint
- [ ] Server calls `POST /v2/checkout/orders/{orderId}/authorize`
- [ ] Authorization ID stored from `purchase_units[0].payments.authorizations[0].id`
- [ ] Capture and void links saved on pledge row
- [ ] Pledge status moves to ACTIVE after authorization
- [ ] Ledger event `HOLD_AUTHORIZED` appended
- [ ] Screen copy says "hold, not a charge" with exact release date

### 4. Must-Ship Feature 3: Proof Submission (Two Signals)
- GitHub activity signal:
  - [ ] GitHub REST API called for commits filtered by author, since, until
  - [ ] Merge commits dropped
  - [ ] Ignored paths filtered (package-lock.json, *.lock, dist/**)
  - [ ] Count commits, distinct UTC days, changed lines
  - [ ] Pure function with unit tests for rubric comparison
  - [ ] Model may downgrade passâ†’borderline but NEVER failâ†’pass
- Photo signal:
  - [ ] Server issues 3-word challenge code (e.g., `amber-otter-17`) valid only for pledge and window
  - [ ] Photo uploaded to Supabase Storage
  - [ ] Vision model returns JSON: code read, scene elements, suspicious signs, confidence per element
  - [ ] Server compares code with edit distance â‰¤ 1
  - [ ] Server checks required scene elements from rubric
  - [ ] Server applies confidence threshold (â‰¥ 0.7)
- Proof stored in `proofs` table with `signals_json` and `ai_findings_json`

### 5. Must-Ship Feature 4: AI Referee Verdict + Friend Appeal
- Verdict table:
  - [ ] GitHub pass + AI no padding â†’ Pass â†’ Void hold
  - [ ] GitHub pass + AI flags padding â†’ Borderline â†’ Friend decides
  - [ ] GitHub fail â†’ Fail â†’ Appeal window, then capture
  - [ ] Photo pass â†’ Void hold
  - [ ] Photo code wrong â†’ Fail â†’ Appeal window, then capture
- Verdicts table: source (rules/ai/friend), outcome (pass/fail/borderline), reasoning, created_at
- Friend appeal:
  - [ ] Magic link emailed to referee (Supabase Auth or Resend)
  - [ ] Referee screen: proof, rubric, AI findings, approve/deny buttons, required note field
  - [ ] One decision only, link dead after submission
  - [ ] 24-hour appeal window
  - [ ] Friend decision overrides all other verdicts
  - [ ] No response before window: borderline releases hold, clear fail stays fail

### 6. Must-Ship Feature 5: Settlement (Void/Capture/Payout)
- Success path (void):
  - [ ] POST /v2/payments/authorizations/{id}/void
  - [ ] Webhook PAYMENT.AUTHORIZATION.VOIDED moves status to SUCCEEDED
- Failure path (capture):
  - [ ] POST /v2/payments/authorizations/{id}/capture with full amount, `final_capture: true`
  - [ ] Header `PayPal-Request-Id: pledgeId-capture`
  - [ ] Webhook PAYMENT.CAPTURE.COMPLETED moves status to CAPTURED
- Failure path (payout):
  - [ ] POST /v1/payments/payouts with sender_batch_header.sender_batch_id = `pledgeId-payout`
  - [ ] Item: recipient_type=EMAIL, beneficiary email, stake amount
  - [ ] Poll payout status or wait for webhook; move to PAID_OUT
- Idempotency:
  - [ ] Settlement reads pledge FOR UPDATE
  - [ ] Checks status allows transition before PayPal call
  - [ ] Uses stable PayPal-Request-Id
  - [ ] Only writes new status AFTER successful PayPal call
  - [ ] Cron job and webhook handler both call same function; second call does nothing
- Webhook endpoint:
  - [ ] POST /api/webhooks/paypal
  - [ ] Signature verification via POST /v1/notifications/verify-webhook-signature
  - [ ] Five transmission headers: PayPal-TRANSMISSION-ID, TS, SIG, CERT, UPDATE-ID
  - [ ] Dedupe via webhook_events table (paypal_event_id unique)
  - [ ] Subscribes to PAYMENT.AUTHORIZATION.CREATED, VOIDED, CAPTURE.COMPLETED, CAPTURE.DENIED
### 7. Must-Ship Feature 6: Tamper-Evident Ledger
Route: /pledges/[id]/ledger
- [ ] 5 tables exist: pledges, proofs, verdicts, ledger_events, webhook_events
- [ ] ledger_events hash chain: sha256(prev_hash + "|" + canonicalJson(event))
- [ ] Genesis hash: 64 zeros per pledge
- [ ] Append inside DB transaction that locks pledge row
- [ ] Event types: PLEDGE_CREATED, RUBRIC_LOCKED, PAYPAL_ORDER_CREATED, HOLD_AUTHORIZED, PROOF_SUBMITTED, SIGNALS_COMPUTED, AI_FINDINGS, VERDICT, APPEAL_OPENED, FRIEND_DECISION, HOLD_VOIDED, HOLD_CAPTURED, PAYOUT_SENT, WEBHOOK_RECEIVED
- [ ] Revoke UPDATE and DELETE on ledger_events for app database role
- [ ] Trigger that raises on UPDATE and DELETE attempts
- [ ] GET /api/ledger/:pledgeId/verify recomputes chain, returns first broken seq
- [ ] Chain-intact badge on ledger page (green if valid, red if broken)

### 8. Must-Ship Feature 7: Reliability Stats + Stake Recommender
Route: /stats
- [ ] Reliability card: Beta posterior mean + 80% credible interval
- [ ] "Not enough data yet" when user has fewer than 5 sprints
- [ ] Success rate by goal type and start weekday
- [ ] Calibration curve plot
- [ ] Stake recommender: grid 5-50 USD, expected loss = (1-p) Ã— stake under comfort budget
- [ ] Stake curve showing trade-off

### 9. Must-Ship Feature 8: Public Repo, License, Demo
- [ ] LICENSE file (MIT) visible in repo About section
- [ ] README.md with run instructions (< 10 minutes)
- [ ] SPEC.md with state machine, rubric schema, API contracts
- [ ] Hosted demo URL (Render)
- [ ] Demo video under 3 minutes on YouTube (public)
- [ ] Sandbox test buyer credentials in Devpost notes
### 10. Data Model (5 Tables)
| Table | Required Columns | Status |
|-------|-----------------|--------|
| pledges | id, user_id, title, goal_type, rubric_json, rubric_hash, stake_cents, currency, starts_at, ends_at, appeal_ends_at, status, beneficiary_name, beneficiary_paypal_email, referee_email, paypal_order_id, paypal_authorization_id, paypal_capture_id, paypal_payout_batch_id | |
| proofs | id, pledge_id, kind, challenge_code, storage_path, submitted_at, signals_json, ai_findings_json, confidence | |
| verdicts | id, pledge_id, source, outcome, reasoning, created_at | |
| ledger_events | id, pledge_id, seq, type, payload_json, prev_hash, hash, created_at | |
| webhook_events | paypal_event_id (unique), type, payload_json, processed_at | |

### 11. Screens to Build
| Screen | Route | Status |
|--------|-------|--------|
| Create pledge | /new | |
| Approve hold | /pledges/[id]/approve | |
| Pledge detail | /pledges/[id] | |
| Verdict | /pledges/[id]/verdict | |
| Referee | /referee/[token] | |
| Ledger | /pledges/[id]/ledger | |
| Stats | /stats | |
| Demo console | /admin/demo | |

### 12. Design Rules
- [ ] One accent colour throughout
- [ ] One type scale
- [ ] One spacing step
- [ ] Loading states on every screen
- [ ] Empty states on every screen
- [ ] Error states on every screen
- [ ] Word "hold" used (not "charge") on screens 2 and 3
- [ ] Money shown as "20.00 USD (sandbox)" everywhere
- [ ] All inputs labeled
- [ ] Main flow works at phone width
- [ ] Contrast check passed
### 13. Environment Variables
Set on day 1:
- [ ] PAYPAL_CLIENT_ID
- [ ] PAYPAL_CLIENT_SECRET
- [ ] PAYPAL_ENV=sandbox
- [ ] PAYPAL_WEBHOOK_ID
- [ ] DATABASE_URL
- [ ] LLM_API_KEY
- [ ] MODEL_SERVICE_URL
- [ ] DEMO_CLOCK_SPEED (e.g., 60)
- [ ] MAX_STAKE_USD=50

### 14. Repo Layout
Match build guide structure:
- [ ] LICENSE at root
- [ ] README.md at root
- [ ] SPEC.md at root
- [ ] apps/web/ with Next.js App Router
- [ ] services/model/ with FastAPI
- [ ] data/ with generate_synthetic.py
- [ ] notebooks/ with evaluation
- [ ] scripts/ with seed-demo.ts, demo-clock.ts

### 15. Submission Checklist (from build guide)
- [ ] Both developers registered on Devpost
- [ ] Public repo on GitHub/GitLab/Bitbucket
- [ ] Open-source license visible
- [ ] README: what it is, architecture, setup (< 10 min), env vars (no secrets), seed script, known limits
- [ ] Hosted demo URL tested in private window on second device
- [ ] Sandbox test buyer credentials in Devpost testing notes
- [ ] Text description covering features
- [ ] Tools section: every AI service and PayPal API used
- [ ] Demo video under 3 minutes, public on YouTube
- [ ] Video shows end-to-end working
- [ ] Secrets scan of git history
- [ ] README states: sandbox only, synthetic training data, referee limitations
- [ ] Commit history shows meaningful progress
- [ ] Submitted 24 hours before cutoff, confirmation screenshot saved

## Output Format
Return a validation report with:

### Executive Summary
- Overall status: READY / NEEDS WORK / NOT READY
- Count of PASS / PARTIAL / FAIL / MISSING items
- Top 3 blockers to fix before submission

### Detailed Findings Table
| Requirement | Status | Evidence (file:line) | Notes |

### Files to Inspect
- Root: package.json, next.config.js, tsconfig.json, LICENSE, README.md, SPEC.md
- Web: app/layout.tsx, app/globals.css, app/page.tsx, app/new/page.tsx
- API: app/api/pledges/route.ts, app/api/webhooks/route.ts, app/api/payouts/route.ts
- Lib: app/lib/db.ts, app/lib/paypal/*, app/lib/referee/*, app/lib/state/*, app/lib/ledger.ts
- Model: services/model/app.py (FastAPI), services/model/train.py
- Data: data/generate_synthetic.py, data/README.md

### Remediation Plan (ordered by priority)
1. Critical blocker #1 â†’ fix this first
2. Critical blocker #2 â†’ fix this second
3. Nice-to-have improvements

---

**Run this validation now and return the full report.**

---

## How to Use
1. Copy the entire block above into your chat with antigravity AI
2. Wait for the full validation report
3. Fix any FAIL/MISSING items before submitting to Devpost
4. Re-run validation after fixes

## Quick Self-Check
```bash
cd "c:\HASFI\Projects\Paypal Hackathon"
npx next build
ls -la LICENSE README.md SPEC.md
ls -la app/layout.tsx app/globals.css app/page.tsx app/new/page.tsx
ls -la app/api/pledges/route.ts app/api/webhooks/route.ts app/api/payouts/route.ts
```
