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
