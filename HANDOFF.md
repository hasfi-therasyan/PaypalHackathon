# Stake — Project Handoff & Developer Guide

**Project Name:** Stake — Commitment Contracts Powered by PayPal  
**Event:** PayPal AI Hackathon 2026  
**Tech Stack:** Next.js 14.1 (App Router, TypeScript), Tailwind CSS (Hallmark Design System), PayPal Orders v2 Sandbox, Supabase Postgres, Node.js crypto.

---

## 1. Project Overview & Current State

Stake allows users to lock in personal goals (coding milestones, habit consistency, workouts) backed by **safe PayPal authorization holds**.
- **Success:** The authorization hold is instantly **voided** with 0 fees.
- **Failure:** The hold is **captured** and transferred to a nominated beneficiary via PayPal Payouts.
- **Disputed/Uncertain Verdicts:** Escalated to a nominated **Friend Referee** with final veto power.
- **Auditability:** Every transaction, status transition, and verdict is hashed and sealed into an immutable **SHA-256 ledger**.

### What Is Already Completed & Working:
1. **Hallmark Design System (Anti-AI-Slop):**
   - Palette based on PayPal Enterprise Navy (`#002244`, `#003087`), PayPal Blue (`#0070ba`), and clean slate cards (`#f8fafc`, `#e2e8f0`).
   - Clean, human-friendly typography with `tabular-nums` for all financial figures and hashes.
   - PWA support with mobile download banner and custom dynamic `/icon`.
2. **Landing Page (`/`):**
   - In-page navigation bar that smoothly scrolls to *What is Stake*, *How It Works*, *Who It's For*, and *Safety Guarantee*.
   - Standalone layout separated from application dashboard clutter.
3. **User Dashboard (`/dashboard`):**
   - Displays real-time escrow totals, succeeded stakes, commitment cards with status badges, filters, and drawer inspectors.
4. **Role-Based Auth System (`/login`):**
   - Supports 3 roles: **User**, **Referee**, and **Admin**.
   - Admin preset: `hasfirasya02@gmail.com` / `rasya123`.
   - Single-line divider with instant demo account switchers.
5. **Referee Tribunal (`/referee` & `/referee/[token]`):**
   - Friend appeal interface with written explanation requirement and approve/deny actions.
6. **Admin Suite (`/admin` & `/admin/demo`):**
   - Cryptographic SHA-256 ledger inspector, webhook simulation triggers, demo seed tools, and system health checks.
7. **PayPal Sandbox Integration:**
   - Orders v2 initialization with `intent: AUTHORIZE`.
   - Direct sandbox approval flows with `@paypal/react-paypal-js`.
   - Floating adjustable **Top-Up Sandbox Widget**.

---

## 2. Next Steps / Your Part of the Deal

Here are the remaining items to take this to 100% submission-ready:

### Task 1: Supabase Live Database Sync (Optional Persistence)
- Currently, [`app/lib/db.ts`](file:///c:/HASFI/Projects/Paypal%20Hackathon/app/lib/db.ts) uses a high-performance in-memory fallback map that persists while the server runs.
- Schema migrations exist in [`supabase/migrations/20261103_stake_schema.sql`](file:///c:/HASFI/Projects/Paypal%20Hackathon/supabase/migrations/20261103_stake_schema.sql).
- To enable persistent storage across restarts:
  1. Create a project at [supabase.com](https://supabase.com).
  2. Paste the SQL migration into Supabase SQL Editor.
  3. Update `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env.local`.

### Task 2: FastAPI ML Model Service (`/services/model`)
- The project guide outlines a lightweight FastAPI service for Bayesian stake recommendations.
- Needs:
  - Simple `/predict` endpoint returning success probability and recommended stake.
  - Wire it up to [`app/stats/page.tsx`](file:///c:/HASFI/Projects/Paypal%20Hackathon/app/stats/page.tsx) (endpoint currently displays mock distributions).

### Task 3: Production Deployment & PayPal Live Webhook
- Deploy the web service to **Render** or **Vercel**.
- Set environment variables in the host dashboard:
  - `PAYPAL_CLIENT_ID`
  - `PAYPAL_CLIENT_SECRET`
  - `PAYPAL_REDIRECT_URI=https://<your-domain>/api/paypal/oauth`
  - `PAYPAL_WEBHOOK_ID`
- In your PayPal Developer Sandbox Dashboard:
  - Add `https://<your-domain>/api/paypal/oauth` to your app's **Log In with PayPal Return URL** (HTTPS is required by PayPal).
  - Register `https://<your-domain>/api/webhooks/paypal` for webhook notifications.

### Task 4: Hackathon Video & Demo Run
- Prepare a 3-minute screen recording showcasing:
  1. Creating a commitment with a $35 USD sandbox authorization hold.
  2. Submitting proof (GitHub commits or photo).
  3. Referee appeal review.
  4. Instant void settlement & ledger audit trail inspection.

---

## 3. Local Development Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
# App will run at http://localhost:3000

# 3. Seed demo contracts
# Navigate to http://localhost:3000/admin and click "Seed Demo Contracts",
# or run in terminal:
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/seed" -Method POST
```

---

## 4. Key Files Reference

| File | Purpose |
|---|---|
| `app/page.tsx` | Landing page (human-friendly copy, anchor navigation) |
| `app/dashboard/page.tsx` | Committer dashboard (active sprints, ledger drawer) |
| `app/referee/page.tsx` | Friend Referee panel (appeals and verdicts) |
| `app/admin/page.tsx` | Admin audit suite (SHA-256 chain verification) |
| `app/lib/paypal/` | PayPal client, Orders v2, and Payouts helpers |
| `app/lib/auth-context.tsx` | Client-side 3-role auth state & demo accounts |
| `.env.local` | Sandbox credentials and environment configuration |
