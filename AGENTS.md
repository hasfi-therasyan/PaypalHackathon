## Analysis — Completed

**Project:** Stake — PayPal AI Hackathon submission

**Current State:**
- Greenfield project: only 3 files exist (AGENTS.md, build guide, senior-developer SKILL.MD)
- No code written yet
- Supabase and PayPal MCP servers connected
- User has installed skills on Cline

**Key Constraints (from build guide):**
1. Sandbox only, stake capped at 50 USD, sprint at most 48 hours
2. Must ship 8 core features for judges
3. Tech stack: Next.js + Supabase + FastAPI + Render
4. 23-day schedule from Oct 20 to Nov 11, 2026

**Key Constraints (from build guide):**
1. Sandbox only, stake capped at 50 USD, sprint at most 48 hours
2. Must ship 8 core features for judges
3. Tech stack: Next.js + Supabase + FastAPI + Render
4. 23-day schedule from Oct 20 to Nov 11, 2026

**Must Ship (8 items judges test):**
1. Create pledge: goal, locked rubric, stake, beneficiary, friend referee
2. PayPal authorization hold (Orders v2 with `intent: AUTHORIZE`), approved by sandbox buyer
3. Proof submission with two verifiable signals: GitHub activity and challenge-code photo
4. AI referee verdict with written reasoning, plus a friend appeal
5. Settlement: void on success, capture then payout on failure, driven by webhooks
6. Tamper-evident ledger page showing every decision and PayPal ID
7. Reliability stats and a stake recommendation from friend's model
8. Public repo with license, hosted demo, and video under 3 minutes

**Cut without guilt:**
- User accounts beyond magic-link email
- Mobile app, social feed, streaks and badges
- More than two goal types, real charities, multi-currency
- 7-day sprints (stretch only)

**Hard limits (day 1):**
- Sandbox only
- Stake capped at 50 USD
- Sprint length at most 48 hours

**Tech Stack:**
- Web app and API: Next.js (App Router, TypeScript), server routes for all PayPal calls
- Database and file storage: Supabase Postgres plus Storage for proof photos
- Model service: FastAPI with scikit-learn, one `/predict` endpoint
- Scheduled worker: Cron job that runs `settleDuePledges()` every minute
- Hosting: Render for web service, model service and cron
- LLM: Any vision-capable model with JSON-schema output; validate every reply with `zod`
- Email: Magic links for login, friend referee and appeals (Supabase Auth or Resend)

**Repo Layout (from build guide):**
```text
stake/
  LICENSE                 # MIT, visible in the repo About section
  README.md               # run instructions judges can follow in 10 minutes
  SPEC.md                 # state machine, rubric schema, API contracts (write this first)
  apps/web/               # Next.js app
    app/api/pledges/      # create, authorize, proof, appeal
    app/api/webhooks/paypal/route.ts
    lib/paypal/           # token, orders, authorizations, payouts, verifyWebhook
    lib/referee/          # github.ts, photo.ts, rubric.ts, verdict.ts
    lib/ledger/           # append(), verifyChain()
    lib/state/            # pledge state machine + transition tests
  services/model/         # FastAPI app, train.py, predict.py
  data/                   # generate_synthetic.py, README on assumptions
  notebooks/              # evaluation: calibration, AUC, Brier score
  scripts/                # seed-demo.ts, demo-clock.ts
```

**Environment Variables to set on day 1:**
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV=sandbox`
- `PAYPAL_WEBHOOK_ID`
- `DATABASE_URL`
- `LLM_API_KEY`
- `MODEL_SERVICE_URL`
- `DEMO_CLOCK_SPEED` (for example `60` makes one minute count as one hour in the demo)
- `MAX_STAKE_USD=50`

## Analysis — Completed