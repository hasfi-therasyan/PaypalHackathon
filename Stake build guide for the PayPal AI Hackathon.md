# Stake: build guide for the PayPal AI Hackathon

Oct 20, 2026 · @Hasfi

Stake fits in 23 days if you hold it to three flows: a pledge backed by a PayPal hold, proof checked by a two-signal referee, and settlement by void or capture plus payout. Aim to submit on the evening of 11 Nov (WIB); the official cutoff is 12 Nov, 12:00 PM Pacific, which is 03:00 WIB on 13 Nov.

## Scope: what ships and what gets cut

Stake is a commitment-contract app. A user stakes money on a short goal. PayPal holds it. A referee checks proof. Success releases the hold; failure captures it and pays a friend or charity the user chose in advance. It runs only in the PayPal sandbox, so no real money moves.

**Must ship (the judges will test these):**

1. Create a pledge: goal, locked rubric, stake, beneficiary, friend referee.
2. PayPal authorization hold (Orders v2 with `intent: AUTHORIZE`), approved by a sandbox buyer.
3. Proof submission with two verifiable signals: GitHub activity and a challenge-code photo.
4. AI referee verdict with written reasoning, plus a friend appeal.
5. Settlement: void on success, capture then payout on failure, driven by webhooks.
6. Tamper-evident ledger page that shows every decision and PayPal ID.
7. Reliability stats and a stake recommendation from your friend's model.
8. Public repo with license, hosted demo, and a video under 3 minutes.

**Cut without guilt:** user accounts beyond magic-link email, mobile app, social feed, streaks and badges, more than two goal types, real charities, multi-currency, 7-day sprints (stretch only).

**Hard limits you set on day 1:** sandbox only, stake capped at 50 USD, sprint length at most 48 hours. The 48-hour cap comes from PayPal's honor period, explained next.

## PayPal facts that shape the design

A hold lasts 29 days, but PayPal only recommends capturing inside a 3-day honor period, so every sprint must settle inside 72 hours. That one fact sets the 48-hour sprint cap and the 24-hour appeal window.

| Fact (from PayPal docs) | Design consequence | Source |
| --- | --- | --- |
| An authorization holds funds for 29 days; capture within the 3-day honor period is recommended. | Sprint at most 48 h, appeal window at most 24 h, capture by hour 72. | [Authorize and capture](https://developer.paypal.com/docs/checkout/standard/customize/authorization) |
| A re-authorization after the honor period issues a new authorization ID and restarts the honor period; later captures must use the new ID. A re-authorization on day 27 leaves only 2 days. | 7-day sprints are a stretch goal. Store every authorization ID per pledge. | [Authorize and capture](https://developer.paypal.com/docs/checkout/standard/customize/authorization) |
| The order must be created with `intent: AUTHORIZE`; the JS SDK needs `intent=authorize`; the buyer approves; then you call the Authorize endpoint. | The pledge flow is create order, buyer approves, server authorizes. | [Authorize and capture](https://developer.paypal.com/docs/checkout/standard/customize/authorization) |
| The authorize response returns `capture` and `void` links under `/v2/payments/authorizations/{id}`. | Save both hrefs on the pledge row. | [Authorize and capture](https://developer.paypal.com/docs/checkout/standard/customize/authorization) |
| Webhooks exist for `PAYMENT.AUTHORIZATION.CREATED`, `PAYMENT.AUTHORIZATION.VOIDED` and `PAYMENT.CAPTURE.COMPLETED` / `DENIED`. | Settlement state changes only when a webhook confirms them. | [Webhooks API](https://developer.paypal.com/api/webhooks/v1/) |
| Signature verification does not work on mock events from the simulator. | Use the simulator for wiring, then test the signed path with real sandbox transactions. | [Webhook guide](https://hookdeck.com/webhooks/platforms/guide-to-paypal-webhooks-features-and-best-practices) |
| Payouts accept `recipient_type: EMAIL`, and your sandbox business account needs enough balance. | Failure settlement pays the beneficiary's email. Confirm Payouts works on your sandbox app on day 2. | [Payouts setup](https://developer.paypal.com/payouts/use-payouts/set-up.md) |
| PayPal ships an MCP server (`@paypal/mcp`, or a hosted sandbox URL) and an AI Toolkit plugin for Claude Code. The tool list I saw centres on merchant tasks such as invoices. | Do the money flows with the REST API. I could not confirm the MCP server exposes authorize, capture or void, so check its tool list on day 1. | [MCP server docs](https://developer.paypal.com/ai-tools/mcp-server) |

One more consequence: captured sandbox money lands in your business account, not the beneficiary's. Moving it on takes a separate Payout call, which is why that step has its own fallback in the risks section.

## Pledge lifecycle: money moves only after a verdict

&#91;embedded content: pledge lifecycle · 11 steps, 2 outcomes\]

Every path ends in a PayPal call: void on a pass, capture and payout on a fail. The sprint runs at most 48 hours and the friend window at most 24, so a capture lands inside PayPal's 3-day honor period. Implement this as a transition table in `lib/state/` and test every legal and illegal move.

## Architecture, stack and repo layout

Use one web app, one small Python model service, one Postgres database, and one scheduled worker. Fewer moving parts means fewer demo-day failures.

| Part | Choice | Why |
| --- | --- | --- |
| Web app and API | Next.js (App Router, TypeScript), server routes for all PayPal calls | One language for UI and money logic; secrets never reach the browser. |
| Database and file storage | Supabase Postgres plus Storage for proof photos (any Postgres and S3-style store works) | Row-level security, easy photo uploads, and SQL for your friend's analysis. |
| Model service | FastAPI with scikit-learn, one `/predict` endpoint | Your friend works in Python. Fallback: export logistic-regression coefficients to JSON and score in TypeScript. |
| Scheduled worker | A cron job that runs `settleDuePledges()` every minute | Deadlines and the appeal window need a clock, not a user click. |
| Hosting | Render for web service, model service and cron (check its current docs for cron and free-tier limits) | Gives judges a hosted URL; Render also has its own sponsor prize. |
| LLM | Any vision-capable model with JSON-schema output; validate every reply with `zod` | The model returns structured findings, never free-form verdicts. |
| Email | Magic links for login, friend referee and appeals (Supabase Auth or Resend) | No passwords to build. |

**Repo layout**

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

**Environment variables to set on day 1:** `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV=sandbox`, `PAYPAL_WEBHOOK_ID`, `DATABASE_URL`, `LLM_API_KEY`, `MODEL_SERVICE_URL`, `DEMO_CLOCK_SPEED` (for example `60` makes one minute count as one hour in the demo), `MAX_STAKE_USD=50`.

## Data model: tables and the hash-chained ledger

Five tables carry the whole product. Money amounts are integer cents; timestamps are UTC.

| Table | Key columns | Notes |
| --- | --- | --- |
| `pledges` | `id`, `user_id`, `title`, `goal_type` (`github` or `photo`), `rubric_json`, `rubric_hash`, `stake_cents`, `currency`, `starts_at`, `ends_at`, `appeal_ends_at`, `status`, `beneficiary_name`, `beneficiary_paypal_email`, `referee_email`, `paypal_order_id`, `paypal_authorization_id`, `paypal_capture_id`, `paypal_payout_batch_id` | `rubric_json` is frozen at creation and its SHA-256 goes in `rubric_hash`, so nobody can change the rules after the fact. |
| `proofs` | `id`, `pledge_id`, `kind`, `challenge_code`, `storage_path`, `submitted_at`, `signals_json`, `ai_findings_json`, `confidence` | One row per submission. Photos live in storage, never in the table. |
| `verdicts` | `id`, `pledge_id`, `source` (`rules`, `ai`, `friend`), `outcome` (`pass`, `fail`, `borderline`), `reasoning`, `created_at` | A pledge can have several; the latest by `source` priority wins (friend over AI over rules). |
| `ledger_events` | `id`, `pledge_id`, `seq`, `type`, `payload_json`, `prev_hash`, `hash`, `created_at` | Append-only, hash-chained. |
| `webhook_events` | `paypal_event_id` (unique), `type`, `payload_json`, `processed_at` | Dedupe so a retried webhook never settles twice. |

**Ledger rule.** Each event's hash is `sha256(prev_hash + "|" + canonicalJson(event))`, starting from 64 zeros per pledge. Append inside a database transaction that locks the pledge row, so two writers cannot fork the chain. Revoke `UPDATE` and `DELETE` on `ledger_events` for the app's database role, and add a trigger that raises on both.

**Event types to record:** `PLEDGE_CREATED`, `RUBRIC_LOCKED`, `PAYPAL_ORDER_CREATED`, `HOLD_AUTHORIZED`, `PROOF_SUBMITTED`, `SIGNALS_COMPUTED`, `AI_FINDINGS`, `VERDICT`, `APPEAL_OPENED`, `FRIEND_DECISION`, `HOLD_VOIDED`, `HOLD_CAPTURED`, `PAYOUT_SENT`, `WEBHOOK_RECEIVED`.

**Verification endpoint.** `GET /api/ledger/:pledgeId/verify` recomputes the chain and returns the first broken `seq` if any. The ledger page shows a green "chain intact" badge; for the demo, keep a one-click admin script that edits one row so the badge turns red.

## PayPal integration, step by step

Build these in order, and do not start the referee until step 6 passes end to end in the sandbox. Endpoint paths come from the docs I opened; confirm field names against the API reference as you code.

**Step 0. Sandbox accounts (day 1).** In the PayPal developer dashboard create a sandbox app, one Business account (your platform), and two Personal accounts (buyer and beneficiary). Note the client ID and secret, and add your webhook URL once a tunnel or hosted URL exists.

1. **Access token.** `POST /v1/oauth2/token` with client credentials. Cache the token until shortly before it expires.
2. **Create the order.** `POST /v2/checkout/orders` with `intent: "AUTHORIZE"` and one `purchase_unit` holding the amount, `reference_id` and `custom_id` set to the pledge ID. Send a `PayPal-Request-Id` header such as `pledgeId-order` so retries do not create duplicates. Return the order ID to the browser.
3. **Buyer approval in the browser.** Load the JS SDK with `intent=authorize`. `createOrder` calls your server (step 2); `onApprove` calls `POST /api/pledges/:id/authorize`. The docs I read describe SDK v6, so follow the current SDK page when you write this part.
4. **Authorize on the server.** `POST /v2/checkout/orders/{orderId}/authorize`. Read the authorization ID from the first authorization under `purchase_units[0].payments`, store it with the `capture` and `void` links, move the pledge to `ACTIVE`, and append `HOLD_AUTHORIZED`.
5. **Webhook endpoint.** `POST /api/webhooks/paypal`: verify the signature with `POST /v1/notifications/verify-webhook-signature` (send the five transmission headers, your `webhook_id` and the event body), reject anything that is not `SUCCESS`, insert the event ID into `webhook_events` (unique), then act. Subscribe to `PAYMENT.AUTHORIZATION.CREATED`, `PAYMENT.AUTHORIZATION.VOIDED`, `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED` and the payout events (look up exact payout event names in the webhook event list).
6. **Success path: void.** `POST /v2/payments/authorizations/{id}/void`. When `PAYMENT.AUTHORIZATION.VOIDED` arrives, move to `SUCCEEDED`.
7. **Failure path: capture.** After the appeal window, `POST /v2/payments/authorizations/{id}/capture` with the full amount and `final_capture: true`, header `PayPal-Request-Id: pledgeId-capture`. On `PAYMENT.CAPTURE.COMPLETED`, move to `CAPTURED`.
8. **Failure path: payout.** `POST /v1/payments/payouts` with a `sender_batch_header.sender_batch_id` of `pledgeId-payout` and one item with `recipient_type: "EMAIL"`, the beneficiary email and the stake amount. Store the batch ID, then poll `GET /v1/payments/payouts/{batch_id}` or wait for the payout webhook; move to `PAID_OUT`.
9. **Grace cancel.** Allow cancel within 5 minutes of the hold by calling void and moving to `CANCELLED`, so a mis-typed stake is not a trap.

**Settlement must be idempotent.** Every settlement function first reads the pledge row `FOR UPDATE`, checks that the status allows the transition, makes the PayPal call with a stable `PayPal-Request-Id`, and only then writes the new status and ledger event. Run it from the cron job and from the webhook handler; whichever arrives second does nothing.

```ts
async function settleFailure(pledgeId: string) {
  return db.tx(async (tx) => {
    const p = await tx.pledge.lockForUpdate(pledgeId);
    if (p.status !== 'APPEAL_WINDOW_CLOSED') return p;      // already handled
    const cap = await paypal.capture(p.authorizationId, p.stakeCents, `${p.id}-capture`);
    await tx.pledge.update(p.id, { status: 'CAPTURED', captureId: cap.id });
    await ledger.append(tx, p.id, 'HOLD_CAPTURED', { captureId: cap.id });
    return p;
  });
}
```

**Local webhook testing.** Use a tunnel so PayPal can reach your laptop, use the simulator only to see that your handler runs, and finish with a real sandbox transaction to exercise signature verification.

**Optional agent angle for "Best Use of PayPal + AI".** Add a read-only "ask Stake" assistant that answers questions about a user's pledges and PayPal transactions through tool calls. Build it only after the core flow works.

## The referee: two signals plus a friend appeal

The AI never decides alone. Deterministic rules run first, the model adds structured findings, and a named human has the last word. This is what keeps Stake from being a chatbot with a payment button.

**Rule 1: the rubric is locked at creation.** The goal's pass conditions are saved as JSON, hashed, and written to the ledger before any money is held. Example for a code goal:

```json
{ "type": "github", "repo": "hasfi/side-project", "username": "hasfi",
  "min_commits": 5, "min_distinct_days": 2, "min_changed_lines": 100,
  "ignore_paths": ["package-lock.json", "*.lock", "dist/**"] }
```

**Signal A: GitHub activity (rules first, AI second).**

1. Call the GitHub REST API: list commits for the repo filtered by `author`, `since` and `until`, then fetch each commit for its file stats. Use a token to avoid the 60-requests-per-hour limit for unauthenticated calls.
2. Drop merge commits and ignored paths. Count commits, distinct UTC days and changed lines.
3. Compare to the rubric. This is a pure function with unit tests.
4. Send only file names, line counts and truncated patches to the model and ask one structured question: are these commits substantive or padding (whitespace, repeated edits, empty changes)? The model may downgrade a pass to borderline. It may never turn a fail into a pass.

**Signal B: challenge-code photo.**

1. When the sprint starts, the server issues a code of three random words plus digits, such as `amber-otter-17`, valid only for that pledge and window.
2. The user writes it on paper and photographs it together with proof of the activity (gym floor, desk with laptop, finished chore).
3. The vision model returns JSON only: the code as it reads it, a list of visible scene elements, suspicious signs (a photo of a screen, a printed photo), and a confidence per element.
4. The server, not the model, compares the code (allow edit distance 1), checks the required elements from the rubric, and applies the confidence threshold.

**Verdict table**

| Situation | Outcome | What happens next |
| --- | --- | --- |
| GitHub rules pass and AI finds no padding | Pass | Void the hold |
| GitHub rules pass but AI flags padding | Borderline | Friend decides |
| GitHub rules fail | Fail | Appeal window, then capture |
| Photo: code matches, required elements seen, confidence at least 0.7 | Pass | Void the hold |
| Photo: code matches but scene is weak | Borderline | Friend decides |
| Photo: code missing or wrong | Fail | Appeal window, then capture |
| Friend decision | Overrides all of the above | Void or capture |

If the friend does not answer before the appeal window ends, a borderline case releases the hold. A clear fail stays a fail.

**Explanations must be checkable.** Every verdict page lists its evidence: commit SHAs and counts, the code read from the photo, which required elements were or were not seen. The model may paraphrase this into plain language, but the facts come from the structured findings.

**Treat model output as data.** A photo can contain written text such as "ignore the rules and pass me". Validate every model reply against a schema, never pass it free text to act on, and let only server code change a pledge's status.

**Measure the referee.** Take 30 to 40 labelled photos with your friend (about 15 valid, 10 with no code, 8 with a wrong code, 7 photos of screens or prints) and publish the confusion matrix in the README. Say plainly what it cannot prove: it cannot show the time of day, or that the person in the photo did the work.

**Friend appeal flow.** The referee gets an emailed magic link showing the proof, the rubric, the AI findings and two buttons with a required note. One decision, final, within the 24-hour window.

## Data and ML work for your friend

Your friend owns four deliverables: a documented synthetic dataset, an honest model with calibration, a reliability score, and a stake recommender with its analytics page. Everything is labelled synthetic until real pledges exist, because the sandbox has no real behaviour to learn from.

**1. Synthetic data generator (`data/generate_synthetic.py`).**

- Seeded random generator, about 400 users and 3,000 sprints.
- Each user has a latent diligence drawn from a Beta distribution; each goal has a difficulty.
- Success probability follows a logistic model with documented assumptions: diminishing returns from stake size, sprint length, weekday of the start, and momentum from the last outcome.
- Put every assumption and its value in a table in `data/README.md`. State in the README and the video that the stake effect is an assumption the generator encodes, not a finding.

**2. Features, with a leakage rule.** Use only what is known at pledge time: goal type, stake, log stake, sprint hours, start weekday and hour, number of prior sprints, shrunk prior success rate, last outcome, days since last sprint, rolling 3-sprint rate. Exclude anything learned after the start, such as when proof was submitted. Keep that as a separate descriptive "procrastination index" on the stats page.

**3. Models and evaluation.**

- Split by time (train on earlier sprints, test on later ones), not randomly.
- Compare a population-rate baseline, logistic regression, and a gradient-boosted model (`HistGradientBoostingClassifier`).
- Report log loss, Brier score and AUC, plus a reliability (calibration) plot. Calibrate with Platt or isotonic scaling if the plot is off.
- If the simple model is within noise of the boosted one, ship the simple one and show its coefficients. Explainable beats marginally more accurate here.

**4. Reliability score.** For each user, use a Beta posterior: prior from the population fit with a prior strength around 6 sprints, updated by that user's successes and failures. Show the mean and an 80% credible interval, and show "not enough data yet" when the user has fewer than 5 sprints. It is a small piece of real statistics that looks right in the UI.

**5. Stake recommender.** Evaluate predicted success over a grid of stakes from 5 to 50 USD. Recommend the largest stake whose expected loss, `(1 - p) * stake`, stays under the user's comfort budget (default 10 USD). Show the curve so the user sees the trade-off, not a black-box number.

**6. Model service (`services/model`).**

- `POST /predict` returns `p_success`, the top three factors, and `model_version`.
- `POST /recommend-stake` returns the curve and the recommended stake.
- `GET /health`.
- Tests: probabilities stay in 0 to 1, a more diligent user never gets a lower prior than a less diligent one with identical features, and the schema rejects bad input.

**7. Analytics page data.** Success rate by goal type and by start weekday with 80% Wilson intervals, the calibration curve, and the reliability card. Draw them with a real chart library; use a data grid for the pledge history table.

**8. Retraining path.** Add `scripts/export_training_data.sql` and a `make retrain` target that trains from real pledges in the database, so the claim "it learns from your own history" is true even if only the demo pledges exist.

**Your friend can also help with** the referee test set (taking the labelled photos), the README results section, and rehearsing the video.

## Screens to build

Seven screens plus one hidden demo console cover the whole story. The Design criterion rewards a complete, coherent experience, so finish these before adding anything new.

| Screen | Route | What it shows | Done when |
| --- | --- | --- | --- |
| 1. Create pledge | `/new` | Goal type, rubric form with a live "locked rules" preview and its hash, stake slider with the recommended-stake curve, beneficiary, friend referee email, consent line ("If I fail, 20 USD goes to Sam") | A pledge row exists with a frozen rubric |
| 2. Approve hold | `/pledges/[id]/approve` | PayPal buttons, plain copy that says this is a hold, not a charge, and the date it will be released or captured | Authorization ID saved, status `ACTIVE` |
| 3. Pledge detail | `/pledges/[id]` | Countdown, status chip, hold badge, the challenge code, proof upload or repo status, 5-minute cancel | User can submit proof and see state change |
| 4. Verdict | `/pledges/[id]/verdict` | Outcome, evidence list, reasoning, appeal button with its deadline | Evidence is specific enough to check by hand |
| 5. Referee | `/referee/[token]` | The proof, the rubric, the AI findings, approve or deny with a note | One decision, then the link is dead |
| 6. Receipt and ledger | `/pledges/[id]/ledger` | Timeline of events with PayPal IDs and the chain-intact badge | Tampering turns the badge red |
| 7. Stats | `/stats` | Reliability card with interval, success by goal type and weekday, calibration chart, history grid | Numbers match the database |
| Demo console | `/admin/demo` | Demo clock speed, seed button, tamper button, reset | Hidden behind an env flag |

**Design rules that cost little**

- One accent colour, one type scale, one spacing step. Resist decoration.
- Every screen has loading, empty and error states. A blank panel during the video loses points.
- Never let "hold" and "charge" blur: use the word "hold" on screens 2 and 3 and show the exact release date.
- Show money as `20.00 USD (sandbox)` everywhere, so no judge thinks real money moves.
- Check contrast, label every input, and make the main flow work at phone width.

## Day-by-day schedule from 20 Oct to 11 Nov

Dates are in WIB. You can finish on Wed 11 Nov and still have Thu 12 Nov as pure buffer. The official cutoff is Fri 13 Nov, 03:00 WIB.

| Dates | You (full-stack, PayPal) | Friend (data) | Done when |
| --- | --- | --- | --- |
| Tue 20 to Wed 21 Oct | Create repo and MIT license; write `SPEC.md` (state machine, rubric schema, API contracts); register both of you on Devpost; make sandbox Business and two Personal accounts; get an access token with a script; list the PayPal MCP tool catalog; create the Render project | Join Devpost; set up the Python environment; draft the assumptions table for the synthetic data | Token script prints a valid token; both of you can push to the repo |
| Thu 22 to Fri 23 Oct | Create an `AUTHORIZE` order, approve it with the JS SDK as the sandbox buyer, call authorize, store the authorization ID | Generator v1: users, sprints, outcomes, seeded and reproducible | A buyer approval produces a stored authorization ID; a CSV of 3,000 sprints exists |
| Sat 24 to Sun 25 Oct | Script the void, capture and payout calls; confirm Payouts works and the business balance is enough | Feature pipeline; baseline and logistic regression with a time-based split | All three settlement calls succeed from a script. **Milestone 1: the money loop works** |
| Mon 26 Oct | Webhook endpoint with signature verification, dedupe and a tunnel; test with a real sandbox transaction | Gradient boosting comparison and calibration plot | A signed `PAYMENT.AUTHORIZATION.VOIDED` event is verified and logged |
| Tue 27 to Wed 28 Oct | Pledge state machine, ledger with hash chain, cron `settleDuePledges()`, tests for every transition and for double settlement | FastAPI `/predict` and `/health` with tests | A pledge runs create, hold, manual verdict, void or capture, payout on the demo clock |
| Thu 29 to Fri 30 Oct | GitHub signal, rule evaluation, AI padding check, unit tests | Reliability score, stake recommender and `/recommend-stake` | A real test repo passes and fails correctly |
| Sat 31 Oct to Sun 1 Nov | Photo challenge code, upload, vision findings, server-side checks | Take and label the 30 to 40 test photos with you; analytics queries | Photo goal works; confusion matrix exists |
| Mon 2 Nov | Friend appeal flow and emails; verdict explanations | Evaluation notebook figures; README results section | Appeal works end to end. **Milestone 2: every feature exists, even if ugly** |
| Tue 3 to Thu 5 Nov | Build screens 1 to 6, copy, loading, empty and error states | Stats page and charts (screen 7) | Whole flow runs without touching the database by hand |
| Fri 6 Nov | Deploy web, model service and cron to Render; register the hosted webhook URL; set env vars | Check the hosted model service and stats | Full flow works on the hosted URL |
| Sat 7 to Sun 8 Nov | Edge cases (duplicate webhook, expired authorization, void failure, upload limits), secrets scan, rate limits | Follow the README cold on a clean machine and report every snag | Your friend runs the project from the README alone |
| Mon 9 Nov | **Feature freeze.** Seed demo data, rehearse the demo clock, write the Devpost description | Review the description for accuracy; prepare the results figures | Rehearsal runs under 3 minutes |
| Tue 10 Nov | Record several takes, edit, upload to YouTube as public | Watch for claims the video cannot back up | Video link works in a private window |
| Wed 11 Nov | Final pass on the checklist; **submit to Devpost in the evening** | Second pair of eyes on the submission page | Confirmation page screenshot saved |
| Thu 12 Nov | Buffer only: fix a broken link or submission glitch, no new features | Same | Nothing |

**Cut rules, applied without debate.** If Milestone 1 is missed by more than one day, drop the photo goal and ship GitHub only. If Milestone 2 is missed by more than one day, make the appeal an in-app link instead of email and shrink the stats page to the reliability card and one chart.

## Demo video script for 3 minutes

The video must stay under 3 minutes, show the project working on the device it was built for, and sit on YouTube as a public video. Judges do not have to watch past 3:00, so the best moment goes before 2:30. Use the demo clock so a two-day sprint plays in under a minute, and say so on screen.

| Time | Show | Say (short) |
| --- | --- | --- |
| 0:00 to 0:20 | Title, then a quick shot of a broken promise (an unchecked to-do list) | "We break promises to ourselves. Stake puts money behind them, and a referee that cannot be talked into anything." Add a caption: PayPal sandbox, no real money. |
| 0:20 to 0:50 | Screen 1: pick a GitHub goal, show the locked rules and hash, the stake curve from the model | "The rules are frozen before money moves. The model suggests a stake that keeps the expected loss under my budget." |
| 0:50 to 1:15 | Screen 2: approve in PayPal, then the pledge page with the hold badge and authorization ID | "This is a hold, not a charge. PayPal keeps the funds; nothing is spent yet." |
| 1:15 to 1:50 | Success: demo clock runs, proof is checked, verdict with commit evidence, hold voided, status changes through a webhook | "Rules count the commits, the AI checks for padding, and the hold is released." Flash the voided authorization in the PayPal sandbox. |
| 1:50 to 2:30 | Failure: a second pledge with a wrong challenge code, the verdict explains why, the friend declines the appeal, capture then payout to the beneficiary's sandbox account | "No proof, no release. The money is captured and goes to the friend I chose." Show the beneficiary balance. |
| 2:30 to 2:50 | Ledger page: chain intact, then tamper with one row, badge turns red | "Every decision and PayPal ID is in a tamper-evident log." |
| 2:50 to 3:00 | Stats card, repo link and one honest line | "Trained on synthetic data until real pledges exist. Built for people who need a promise to cost something." |

**Recording rules**

- Seed everything first (accounts, repo, beneficiary) so nothing loads for more than a second on camera.
- Record at 1080p, cursor visible, browser zoom at 110% so text reads on a phone.
- Use no music, logos or clips you do not own. Third-party trademarks and copyrighted material are not allowed in the video.
- Do three full takes on Tue 10 Nov and cut the best. Keep a second complete recording as a spare.
- Add captions; many judges watch muted.
- The pitch must answer three things out loud: what problem, who it is for, why it matters. Those are the Presentation criteria.

## Submission checklist

Work through this on Wed 11 Nov and submit that evening. Indonesia is not on the excluded-country lists in the sources I read, but read the official Rules page yourself to confirm eligibility and team rules.

- [ ] Both of you registered on Devpost, with the team set up as the Rules require
- [ ] Public repository on GitHub, GitLab or Bitbucket with all source, assets and run instructions
- [ ] Open-source license file visible in the repository's About section
- [ ] README: what it is, architecture, setup in under 10 minutes, environment variables (no secrets), seed script, known limits
- [ ] Hosted demo URL tested in a private window on a second device, or complete run instructions
- [ ] Sandbox test buyer credentials given in the Devpost testing notes (sandbox only, never real accounts)
- [ ] Text description covering features and functionality
- [ ] Tools section: every AI service and PayPal API used, and how each is used
- [ ] Demo video under 3 minutes, public on YouTube, link in the form, no third-party trademarks or copyrighted music
- [ ] Video shows the project working end to end
- [ ] Secrets scan of the whole git history; rotate any key that ever appeared
- [ ] README and description state: sandbox only, synthetic training data, what the referee cannot prove
- [ ] The "meaningful progress during the hackathon" claim is true and visible in the commit history
- [ ] Submitted at least 24 hours before the cutoff; screenshot of the confirmation saved

## Risks and fallbacks

The two risks that can sink the project are Payouts not working in your sandbox and the honor-period timing. Test both in the first five days.

| Risk | Test it early by | Fallback |
| --- | --- | --- |
| Payouts are not enabled for your sandbox app, or the balance is too low | A scripted payout on Sat 24 Oct | Capture still works. Record the payout as `PAYOUT_PENDING` in the ledger, show the exact Payouts request, and say so in the video. Do not fake a success. |
| Capture happens after the honor period | Alert when an authorization is older than 60 hours; test with the demo clock | Keep sprints at 48 h and appeals at 24 h. Reauthorize only as a stretch feature. |
| Webhook is late, lost or fails verification | Real sandbox transaction on Mon 26 Oct | A reconciliation job that reads the authorization and capture status from PayPal and moves the state if a webhook is missing. |
| The vision model misreads handwriting | The labelled photo set | Allow up to 3 uploads, lower the threshold into borderline, and let the friend decide. |
| Photo proof can be faked | State the limit openly | The code is random per pledge, and the friend can deny. Do not claim fraud-proof. |
| GitHub rate limits or private repos | Use a token from day 1 | Public repos only for the MVP; cache commit lookups. |
| Scope creep | Weekly milestone check | Apply the cut rules in the schedule section. |
| Judges cannot run it | Friend runs the README cold on Sat 7 Nov | Hosted URL, seeded demo mode, sandbox test credentials in the submission notes. |
| PayPal sandbox is down or slow during recording | Record on Mon 9 and Tue 10 Nov, not at the deadline | Keep a spare full recording; check the sandbox status page before each take. |
| Holding money for a third party looks like regulated money handling | Say it in the README | Sandbox only, explicit consent screens, and a plain note that a real launch needs legal review. |
| LLM cost or abuse through uploads | Cap upload size and count | Rate limit per user; set a monthly spend cap on the API key. |

## Building it with AI without producing slop

Let the AI write code, but keep every decision, every PayPal call and every claim in the video yours. These habits are what separate a credible entry from a generated one.

1. **Write `SPEC.md` yourself first.** State machine with every legal transition, rubric schema, API contracts. Then ask the AI to implement exactly that, and nothing else.
2. **Give the assistant PayPal context.** PayPal publishes an AI Toolkit plugin for Claude Code that works against the sandbox with an access token, and APIMatic ran a session on its context plugins for this hackathon. Both are optional helpers, not requirements.
3. **Never accept an invented endpoint.** Every PayPal call carries a comment with its docs URL and has been run against the sandbox the same day.
4. **Tests before screens.** Cover the transition table (legal and illegal moves), ledger chain verification, rubric evaluation, and settlement idempotency (call it twice, expect one capture).
5. **Read every diff that touches money, auth or uploads.** Run it yourself before merging.
6. **Version the prompts.** Keep referee prompts as files in the repo with golden test cases, so a change to a prompt shows up as a test result.
7. **Keep `DECISIONS.md`.** One line per choice: what you picked, what you rejected, why. It feeds the README and your pitch.
8. **Be honest in the product.** Synthetic data is labelled synthetic, the demo clock is labelled, limits are written down.

**Pre-submission slop checklist:** no placeholder copy, no dead buttons, no unexplained magic numbers, no unused dependencies, no TODOs in the shipped code, lint and type checks pass, every README claim verified, every screenshot real.

**Prompt templates that work**

```text
Implement lib/state/transitions.ts exactly as SPEC.md section 3 describes.
Write the failing tests first, including every illegal transition. Do not add states.

Write lib/paypal/authorizations.ts with capture(), void() and reauthorize().
For each function, put the PayPal docs URL in a comment, use PayPal-Request-Id
from the argument, and return typed errors. Do not guess field names; list any
you are unsure about.

Review this diff for double-settlement, missing row locks, and any path where a
webhook and the cron job could both capture. Report only concrete failure cases.
```

## Sources

I opened the first two pages in full. The PayPal API facts come from PayPal's own documentation as returned by search, so confirm field names in the API reference before you code against them.

- [PayPal AI Hackathon on Devpost](https://paypalaihackathon.devpost.com/): criteria, requirements, prizes, judges, deadline
- [The GenAI Magazine guide](https://thegenaimagazine.com/paypal-ai-hackathon-2026-ideas-deadline-prizes): partner tools, tips, timeline
- [PayPal: authorize and capture](https://developer.paypal.com/docs/checkout/standard/customize/authorization): 29-day hold, 3-day honor period, reauthorization
- [PayPal Webhooks API](https://developer.paypal.com/api/webhooks/v1/): event types
- [Webhook guide (Hookdeck)](https://hookdeck.com/webhooks/platforms/guide-to-paypal-webhooks-features-and-best-practices): simulator events and signature verification
- [PayPal Payouts setup](https://developer.paypal.com/payouts/use-payouts/set-up.md): sandbox Payouts requirements
- [PayPal MCP server](https://developer.paypal.com/ai-tools/mcp-server): remote and local servers
- [PayPal AI Toolkit plugin listing](https://www.claudemarket.ai/plugins/anthropics-claude-plugins-official/paypal): Claude Code plugin
