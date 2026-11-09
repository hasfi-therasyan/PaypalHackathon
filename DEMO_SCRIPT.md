# Stake — 3-Minute Hackathon Demo Script

Record at 1080p with screen capture and voiceover. Keep the public YouTube video below 3:00. The main take demonstrates one complete **success** lifecycle: a photo commitment, a real PayPal Sandbox authorization through the PayPal popup, AI-assisted proof findings, a friend-referee ruling, a void, and the ledger record.

## Before recording

- Run `npm run dev` and open `http://localhost:3000`.
- Configure `.env.local` with real PayPal **Sandbox** credentials, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, and Supabase credentials. Do not record with placeholder credentials.
- Use a real PayPal Sandbox buyer account in the PayPal popup. Do **not** use the app's `PayPal Sandbox` / sandbox-balance quick action; that route is a local demo simulator, not a PayPal authorization.
- No LLM or vision API key is required. On the first photo check, keep an internet connection available so the on-device vision model can download and cache; if it is unavailable, describe the fallback accurately as OCR evidence plus human-referee review.
- For the seeded referee/ledger fallback, set `DEMO_MODE=true`, sign in as an admin, then use `/admin` to seed demo contracts. The seed data is backup footage, not proof of a live PayPal payment.
- Prepare a photo containing the pledge's generated challenge code and required scene elements. Have the referee account ready in a separate browser profile or incognito window.
- Verify the exact pledge ID before recording. Its proof, verdict, and ledger pages are under `/pledges/[id]`, `/pledges/[id]/verdict`, and `/pledges/[id]/ledger`.

## 0:00–0:18 — Problem and promise

- Open `/` and show the landing page briefly.
- Say: “Stake turns a short personal goal into a commitment contract. PayPal holds the stake in Sandbox; AI-assisted evidence review and a trusted friend decide whether that hold is released.”
- Keep the claim precise: this video shows a **PayPal Sandbox authorization**, not production money movement.

## 0:18–0:55 — Create and authorize a $35 commitment

- Open `/new`.
- Select a photo goal, enter a concrete goal, set the stake to **$35**, choose a beneficiary and enter the referee email. Keep the stake at or below $50.
- Point out the locked rubric preview and generated challenge-code concept.
- Submit to open `/pledges/new/checkout/[id]`.
- Select the **PayPal popup** option, not the instant sandbox-balance button. Log in with the Sandbox buyer and approve the order.
- Return to the pledge detail page. Show status **`ACTIVE`**, the real PayPal order/authorization IDs, and the deadline.

## 0:55–1:28 — Submit proof and show the AI-assisted finding

- On `/pledges/[id]`, show the generated challenge code and upload the prepared proof photo.
- Submit the photo. Show the returned finding: the code read, confidence, detected/missing elements, and written explanation.
- Say: “The system keeps the evidence and deterministic checks in the contract record. Ambiguous photo evidence is intentionally routed to the nominated friend rather than silently moving money.”
- Confirm the status becomes **`APPEAL_WINDOW_OPEN`** and open `/pledges/[id]/verdict` briefly to show the recorded reasoning.

## 1:28–2:05 — Friend referee makes the binding decision

- Switch to the referee browser profile and open `/referee/[pledge-id]` (the current implementation uses the pledge ID as this route parameter).
- Show the evidence and automated findings available to the referee.
- Enter a concise written reason, then click **Approve — Void Hold**.
- Return to the pledge/verdict page and show the binding friend verdict and status **`SUCCEEDED`**. Explain that the authorization was voided, so the buyer's hold is released.

## 2:05–2:35 — Audit trail and AI stake recommendation

- Open `/pledges/[id]/ledger`.
- Show the green chain-verification state, locked rubric hash, proof/verdict events, and the actual PayPal order and authorization IDs recorded for this pledge.
- Open `/stats` briefly. Adjust the comfort-budget control and show the Bayesian reliability score and suggested stake.
- Say: “Stake uses history to recommend a safe commitment amount, while the payment and decision trail remain independently auditable.”

## 2:35–3:00 — Close

- Return to the ledger or pledge summary.
- Say: “Stake makes accountability actionable: PayPal Sandbox holds the commitment, AI-assisted evidence review surfaces the facts, and a trusted human resolves the edge cases. Every decision is recorded in a tamper-evident ledger.”
- End with the hosted-demo URL and public repository name on screen.

## Optional failure-path insert — only after end-to-end verification

Use this only if a test has produced a real capture webhook and a completed Sandbox payout. Record it as a separate short insert, not the primary take:

1. Start with a separate authorized pledge already in `APPEAL_WINDOW_OPEN`.
2. Have the referee deny it with a written reason.
3. Show `CAPTURED`, then wait for the verified `PAYMENT.CAPTURE.COMPLETED` webhook.
4. Show `PAID_OUT` only after the payout batch ID is present in the ledger.

Do not label the failure path `SETTLED_FAILURE`, and do not claim payout completion from a seeded record or a local sandbox-balance authorization.

## Submission checklist

- Public GitHub/GitLab/Bitbucket repository with the MIT license and correct run instructions.
- Hosted demo URL or complete local setup instructions that a judge can follow.
- Submission description identifies the PayPal APIs/SDKs and AI tools used, including the OCR/vision configuration and the stake-recommendation model.
- Public YouTube upload, under 3 minutes, with no unlicensed music, logos, or third-party material.
