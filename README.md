# Stake — Commitment-Contract App with PayPal Sandbox Authorization Hold

> **PayPal AI Hackathon Submission** · Created by Hasfi  
> *Put money where your promise is.*

Stake is a commitment-contract application. A user stakes money behind a short, verifiable goal (up to 48 hours). PayPal places an **authorization hold** (never an immediate charge). A two-signal referee (GitHub activity REST filters or challenge-code photo analysis) evaluates the proof against a locked, SHA-256 hashed rubric. Goal success immediately voids the hold; failure captures the stake and pays a chosen beneficiary via PayPal Payouts. A trusted friend referee has final 24-hour appeal override authority. Every state transition is permanently recorded in a tamper-evident SHA-256 hash-chained ledger.

---

## 8 Must-Ship Features Evaluated by Judges

1. **Create Pledge (`/new`):** Select goal type (GitHub / Photo), title, dynamic rubric with live JSON preview and SHA-256 hash calculation, stake slider ($5–$50 USD), beneficiary name + PayPal email, referee email, and dynamic consent line.
2. **PayPal Authorization Hold (`/pledges/[id]/approve`):** Orders v2 with `intent: "AUTHORIZE"`, purchase units with reference & custom ID, idempotent headers, and explicit "hold, not a charge" copy showing release date.
3. **Two-Signal Proof Submission (`/pledges/[id]`):**
   - **GitHub Activity:** REST commits filtered by author, since, and until; merge commits dropped; lockfiles ignored; commit and day thresholds evaluated.
   - **Photo Challenge:** Server issues 3-word plus digit code (`falcon-cedar-42`); code matched with Levenshtein edit distance ≤ 1; required scene elements checked with confidence threshold (≥ 0.70).
4. **AI Referee Verdict & Friend Appeal (`/pledges/[id]/verdict` and `/referee/[token]`):** Deterministic rules run first, structured findings second. Borderline cases and appeals go to the friend referee whose single decision overrides all automated findings.
5. **Settlement (Void, Capture, Payout):**
   - **Success:** `POST /v2/payments/authorizations/{id}/void` releases funds.
   - **Failure:** `POST /v2/payments/authorizations/{id}/capture` captures funds, followed by `POST /v1/payments/payouts` to the beneficiary.
6. **Tamper-Evident Ledger (`/pledges/[id]/ledger`):** Every event is chained via `sha256(prev_hash + "|" + canonicalJson(event))` starting from 64 zeros. Features a live green "Chain Intact" / red "Chain Compromised" badge with a one-click tamper simulation button.
7. **Reliability Stats & Stake Recommender (`/stats`):** Bayesian Beta posterior reliability score with 80% credible interval; expected-loss stake optimization grid over comfort budgets.
8. **Admin Demo Console (`/admin/demo`):** Accelerated demo clock controller (1x to 120x) and one-click demo data seeding for judge evaluations.

---

## Architecture & Technology Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend & API** | Next.js 14 (App Router, TypeScript) | Unified UI, server routes for PayPal API calls (secrets never reach client) |
| **Database & Storage** | Supabase PostgreSQL & Storage | 5 tables (`pledges`, `proofs`, `verdicts`, `ledger_events`, `webhook_events`) with append-only triggers |
| **Payments** | PayPal REST APIs (Sandbox) | Orders v2 (`intent: AUTHORIZE`), Authorizations (`void`/`capture`), Payouts, Webhooks |
| **Ledger Engine** | Pure TypeScript (`crypto`) | Deterministic canonical JSON and SHA-256 recursive hash chaining |
| **Styling** | TailwindCSS | Strict single accent (`indigo-600`), type scale, and WCAG AA contrast compliance |

---

## Quick Start (Run Locally in < 5 Minutes)

### 1. Prerequisites
- Node.js v18+ (tested on Node v22)
- npm v9+

### 2. Clone & Install Dependencies
```bash
git clone <repo-url>
cd "Paypal Hackathon"
npm install
```

### 3. Configure Environment Variables
Create `.env.local` in the project root:
```env
# PayPal Sandbox Credentials
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
PAYPAL_ENV=sandbox
PAYPAL_WEBHOOK_ID=STAKE_DEMO_WEBHOOK_ID
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_sandbox_client_id

# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL=https://ogfbncbbfqzlbfjrsjfa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# Hard Constraints
MAX_STAKE_USD=50
DEMO_CLOCK_SPEED=60
```

### 4. Build and Run
```bash
# Build production bundle
npm run build

# Start local server
npm run start
# Or development mode:
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Seed Demo Data
Visit [http://localhost:3000/admin/demo](http://localhost:3000/admin/demo) and click **"Seed Demo Pledges"** to immediately populate active, succeeded, and appeal-open contracts.

---

## Testing & Judge Credentials

- **PayPal Environment:** Sandbox (`api-m.sandbox.paypal.com`)
- **Default Currency:** USD
- **Stake Limits:** $5.00 min — $50.00 max (strictly enforced in UI and API)
- **Sprint Duration:** Max 48 hours (PayPal 3-day honor period compliant)
- **Appeal Window:** 24 hours

---

## Known Limitations & Disclaimers

1. **Sandbox Only:** Stake operates strictly within the PayPal Sandbox environment. No real currency is transferred. Money is explicitly formatted throughout as `XX.00 USD (sandbox)`.
2. **Referee Limitations:** Automated referee signals cannot verify the identity of the person performing the activity or absolute real-world time of day. This design intentionally places final appeal authority in the hands of a trusted friend referee.
3. **Synthetic Analytics Data:** Analytics and reliability curves on `/stats` are calibrated using Bayesian Beta priors and synthetic distributions for demonstration purposes.

---

## License

This project is licensed under the MIT License — see the [LICENSE](file:///c:/HASFI/Projects/Paypal%20Hackathon/LICENSE) file for details.
