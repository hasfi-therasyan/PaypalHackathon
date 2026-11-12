# Stake 💙

> **Turn a promise into a contract without charging successful effort.**

**Stake** is a commitment-contract app for short personal sprints. A creator locks a goal, verification rubric, stake, beneficiary, and trusted friend referee. They submit GitHub activity or category-specific photo evidence; automated checks provide transparent supporting signals, while the friend referee decides edge cases. Every meaningful decision is written to a tamper-evident ledger. 🔒

Built for the **PayPal AI Hackathon** using the PayPal Sandbox.

## ✨ Why Stake?

Most goals fail because the cost of quitting is invisible. Stake makes that cost explicit while keeping success fair:

1. **Make a commitment:** choose a coding, fitness, study, routine, or productivity sprint.
2. **Lock the rules:** hash the rubric before the sprint begins so nobody can move the goalposts.
3. **Place a hold:** use the local demo balance for a fast demo flow, or PayPal Sandbox checkout for an Orders v2 authorization.
4. **Submit relevant proof:** GitHub evidence for coding; object-based photo evidence for photo commitments.
5. **Settle transparently:** success voids the hold; a failed or disputed result goes to the trusted referee and recorded settlement flow.

## 🧭 What judges can explore

| Feature | Where to try it | What it demonstrates |
| --- | --- | --- |
| Create a commitment | `/new` | Locked rubric, beneficiary, referee, deadline, and stake |
| Local demo hold / PayPal Sandbox hold | Checkout after creating a pledge | Instant local hold ledger or optional Orders v2 `AUTHORIZE` checkout |
| GitHub proof | A **Developer Sprint** pledge | Commit, author, day, and changed-line checks |
| Photo proof | Fitness, study, routine, or productivity pledge | On-device, rubric-specific COCO-SSD object detection |
| Friend review | `/referee` | AI evidence details, written ruling, approve/deny decision |
| Tamper-evident ledger | `/pledges/[id]/ledger` | SHA-256 event chain and PayPal identifiers |
| Reliability advisor | `/stats` | Bayesian success estimate and recommended stake curve |
| Demo controls | `/admin/demo` | Seeded scenarios and accelerated demo clock |

## 🧠 AI that stays in its lane

Stake deliberately avoids a generic “AI says yes” experience.

- **Coding commitments** use GitHub activity analysis: required commits, active days, changed lines, and a quality check for likely padding.
- **Photo commitments** use **TensorFlow.js + COCO-SSD Lite MobileNet V2** in the browser. The model checks only the objects locked for that category. For example, a productivity pledge checks its selected workspace objects, not a coding rubric.
- **Stake Advisor** is a small **FastAPI + SciPy** Bayesian service. It uses a Beta-Binomial posterior over prior outcomes to show reliability and a budget-aware stake recommendation.
- **Friend referee wins**: every photo proof remains supporting evidence only. The assigned friend makes the final appeal decision. 🤝

## 💳 PayPal integration

Stake integrates the PayPal developer platform in Sandbox mode:

- **Orders v2** creates orders with `intent: AUTHORIZE`.
- **Authorizations API** voids a successful pledge’s hold or captures an unsuccessful one.
- **Payouts API** supports the beneficiary payout path after capture.
- **Webhooks** are designed as the settlement trigger and are recorded idempotently.
- The primary demo path also includes an explicit **local app balance** so a judge can complete the end-to-end story without external Sandbox credentials.

No real money is transferred in the demo. 🧪

## 🏗️ Architecture

| Layer | Technology | Purpose |
| --- | --- | --- |
| Web app & API | Next.js 14, React, TypeScript | App Router UI and server-side routes |
| Payments | PayPal REST APIs, `@paypal/react-paypal-js` | Sandbox authorization, void, capture, payout, webhooks |
| Data & files | Supabase Postgres + Storage | Pledges, proof, verdicts, ledger events, private evidence files |
| Vision AI | TensorFlow.js + COCO-SSD | On-device, category-specific object evidence |
| Advisor model | FastAPI, SciPy | Bayesian reliability and stake recommendation |
| Auditability | Node `crypto` SHA-256 | Canonical, hash-chained ledger events |
| UI | Tailwind CSS | Responsive interface for desktop and mobile |

## 🚀 Run locally

### 1. Prerequisites

- Node.js 18+ and npm
- A Supabase project for persistent commitments and proof storage
- PayPal Sandbox credentials if you want to use the optional PayPal checkout path
- Python 3.10+ only if you want to run the advisor service locally

### 2. Install the web app

```bash
git clone https://github.com/hasfi-therasyan/PaypalHackathon.git
cd PaypalHackathon
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the values in `.env.local`:

```env
# PayPal Sandbox (optional for the local-balance demo path)
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_ENV=sandbox
PAYPAL_WEBHOOK_ID=
NEXT_PUBLIC_PAYPAL_CLIENT_ID=

# Supabase (required for persistent, cross-device data)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Optional advisor-service URL
MODEL_SERVICE_URL=http://localhost:8000

# Protect the settlement cron endpoint
CRON_SECRET=
```

### 4. Apply database migrations

Run these SQL migrations in Supabase SQL Editor, in this order:

1. `supabase/migrations/20261103_stake_schema.sql`
2. `supabase/migrations/20261108_performance_indexes.sql`
3. `supabase/migrations/20261112_remove_stake_cap.sql`: needed for an existing database that still has the former $50 constraint.

### 5. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). 🎉

### 6. Optional: run the advisor service

```bash
cd services/model
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## 🧪 Judge quick-start

1. Open the hosted demo: **https://hackathon-stake.vercel.app**
2. Create a pledge on `/new`.
3. Use **Local app balance** in checkout for the fastest end-to-end demo. It records a temporary local hold and activates the sprint.
4. Submit either:
   - a public GitHub repository and username for a coding pledge, or
   - a photo containing the locked category objects for a photo pledge.
5. Open the pledge’s ledger, referee review, and stats pages to inspect the evidence, decision process, and audit trail.

For a real PayPal Sandbox authorization demonstration, choose **PayPal Sandbox** in checkout and sign in with your own Sandbox buyer account.

## 🔐 Trust boundaries & limitations

- The local-balance path is a transparent demo ledger, not an external PayPal buyer-wallet balance.
- Automated photo findings are supporting evidence; they never settle funds without the friend-referee flow.
- The photo model recognizes COCO object classes only. Unrecognized real-world context remains for the referee to assess.
- GitHub activity uses public API data; unavailable API calls fall back to demo-safe simulated evidence for the hackathon walkthrough.
- The advisor uses synthetic priors and historical outcomes as a decision aid, not financial advice.

## 📺 Demo assets

- **Hosted app:** https://hackathon-stake.vercel.app
- **Model service:** https://stake-model.vercel.app
- **Source code:** https://github.com/hasfi-therasyan/PaypalHackathon

## 📄 License

Released under the [MIT License](LICENSE).
