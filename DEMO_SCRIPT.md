# Stake — 3-Minute Demo Script

Record at 1080p, screen only + voiceover. Target: under 3:00.

## 0:00–0:20 — Hook
- Landing page `/`. Scroll past *What is Stake*, *How It Works*.
- Line: "Stake backs personal goals with a real PayPal authorization hold — succeed and it's voided, fail and it's paid to a beneficiary you chose."

## 0:20–0:55 — Create pledge ($35 sandbox hold)
- `/pledges/new`: fill goal title, pick GitHub-activity rubric, set stake to **$35**, beneficiary email, friend referee email.
- Submit → PayPal sandbox button → approve with sandbox buyer account.
- Land on `/dashboard`: new pledge card shows `AUTHORIZED`, PayPal order ID visible.

## 0:55–1:30 — Submit proof
- Open the pledge, go to proof submission.
- Show GitHub activity signal pulling in (commit count/streak) and upload a challenge-code photo.
- Submit → AI referee verdict renders with written reasoning (pass/fail/borderline).

## 1:30–2:05 — Friend referee appeal
- Switch to Referee role (`/referee`), open the pledge's appeal link (`/referee/[token]`).
- Show written appeal reasoning field, approve or override the AI verdict.
- Back on dashboard, pledge status updates to reflect the binding ruling.

## 2:05–2:35 — Settlement
- Trigger settlement (success path): hold is **voided**, $0 fees, status → `SETTLED_SUCCESS`.
- Optionally show the failure path on a second seeded pledge: capture + payout to beneficiary, status → `SETTLED_FAILURE`.

## 2:35–3:00 — Ledger audit + close
- `/admin`: open the tamper-evident ledger for the pledge, show SHA-256 chain, every PayPal ID (order/auth/capture/payout) linked to a ledger entry.
- Line: "Every decision and every dollar is hash-chained and auditable — sandboxed, capped at $50, built in one sprint."

## Before recording
- Run `npm run dev`, seed demo data: `POST http://localhost:3000/api/admin/seed` (or click "Seed Demo Contracts" in `/admin`).
- Have two PayPal sandbox buyer accounts ready (one for the success path, one for the failure path) if showing both.
- Confirm `.env.local` has real PayPal sandbox + Supabase keys before recording (see [HANDOFF.md](HANDOFF.md)).
