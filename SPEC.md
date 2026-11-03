## 2. Rubric Schema

### Rubric JSON Structure
```json
{
  "type": "github" | "photo",
  "goal_spec": string,
  // GitHub goal type:
  "repo": string,          // e.g. "hasfi/side-project"
  "username": string,      // GitHub username
  "min_commits": integer,  // minimum commits required
  "min_distinct_days": integer, // minimum distinct UTC days with commits
  "min_changed_lines": integer, // minimum total changed lines
  "ignore_paths": [string], // glob patterns to ignore
  // Photo goal type:
  "challenge_code_format": "three-words-plus-digits", // e.g. "amber-otter-17"
  "required_scene_elements": [string], // e.g. ["laptop", "notebook"]
  "min_code_confidence": number, // 0.0 to 1.0
  // Common:
  "stake_cents": integer,   // stake amount in cents
  "beneficiary_name": string,
  "beneficiary_paypal_email": string,
  "referee_email": string,
  "sprint_hours": integer,  // duration of sprint in hours (max 48)
  "created_at": timestamp,
  "locked_at": timestamp
}
```

### rubric_hash
- SHA-256 of the canonical JSON of `rubric_json` (with keys sorted alphabetically)
- Written to `pledges.rubric_hash` at creation
- Prevents anyone from changing the rules after the fact
- Verified on every state transition that depends on rubric evaluation

## 3. API Contracts

### POST /api/pledges
**Request:**
```json
{
  "goal_type": "github" | "photo",
  "goal_title": string,
  "rubric_json": object,
  "stake_cents": integer,
  "beneficiary_name": string,
  "beneficiary_paypal_email": string,
  "referee_email": string
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "CREATED",
  "rubric_hash": "sha256hex",
  "paypal_order_id": "string | null",
  "paypal_authorization_id": "string | null",
  "appeal_ends_at": "ISO-8601 timestamp",
  "starts_at": "ISO-8601 timestamp",
  "ends_at": "ISO-8601 timestamp"
}
```

### POST /api/pledges/:id/authorize
**Request:** PayPal-Request-Id: pledgeId-order

**Response:**
```json
{
  "authorization_id": "string",
  "capture_link": "https://api.paypal.com/v2/payments/authorizations/{id}",
  "void_link": "https://api.paypal.com/v2/payments/authorizations/{id}/void",
  "status": "ACTIVE"
}
```

### POST /api/pledges/:id/proof
**Request:**
```json
{
  "github_repo": string | null,
  "github_sha": string | null,
  "github_commit_count": integer,
  "github_distinct_days": integer,
  "photo_path": string,
  "challenge_code": string,
  "code_read_by_model": string,
  "scene_elements": [string],
  "element_confidences": {element: number}
}
```

**Response:**
```json
{
  "signals_pass": boolean,
  "ai_findings": object,
  "confidence": number,
  "verdict": "pass" | "borderline" | "fail"
}
```

### POST /api/pledges/:id/verdict
**Request:**
```json
{
  "source": "rules" | "ai" | "friend",
  "outcome": "pass" | "fail" | "borderline",
  "reasoning": string
}
```

**Response:**
```json
{
  "verdict": "pass" | "fail" | "borderline",
  "source": "rules" | "ai" | "friend",
  "reasoning": string
}
```

### POST /api/webhooks/paypal
**Headers required:** `PayPal-TRANSMISSION-ID`, `PayPal-TRANSMISSION-TS`, `PayPal-TRANSMISSION-SIG`, `PayPal-TRANSMISSION-CERT`, `PayPal-UPDATE-ID`

**Body (raw):** The PayPal webhook event payload.

**Process:**
1. Verify signature via `POST /v1/notifications/verify-webhook-signature` with the five transmission headers + webhook_id + body
2. If signature invalid, return 400
3. Parse event type from `event_type` field
4. Insert `paypal_event_id` into `webhook_events` (unique, dedupe)
5. Act based on event type:
   - `PAYMENT.AUTHORIZATION.CREATED` → update pledge with authorization ID
   - `PAYMENT.AUTHORIZATION.VOIDED` → move pledge to SUCCEEDED
   - `PAYMENT.CAPTURE.COMPLETED` → move pledge to CAPTURED, initiate payout
   - `PAYMENT.CAPTURE.DENIED` → move pledge to CAPTURED
   - Payout events → update payout status
```

### States
| State | Description | Transitions |
|-------|-------------|-------------|
| `CREATED` | Pledge created, rubric not yet locked | → `RUBRIC_LOCKED` |
| `RUBRIC_LOCKED` | Rubric JSON frozen with SHA-256 hash | → `ACTIVE` |
| `ACTIVE` | Hold is active, awaiting proof | → `SUCCEEDED`, → `CAPTURED` |
| `SUCCEEDED` | Hold voided, terminal | — |
| `CAPTURED` | Hold captured, payout in progress | → `PAID_OUT` |
| `PAID_OUT` | Payout sent, terminal | — |
| `CANCELLED` | Voided within 5 minutes | — |
| `APPEAL_WINDOW_OPEN` | Proof submitted, awaiting verdict | → `SUCCEEDED`, → `CAPTURED`, → `APPEAL_WINDOW_CLOSED` |
| `APPEAL_WINDOW_CLOSED` | Verdict finalized | — |