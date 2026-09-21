# AIMT Production Runtime Configuration — source of truth

Audited directly from current repo code (not reconstructed from other
docs) during the 2026-09-21 password-reset/config-visibility incident,
which began with `ANTHROPIC_API_KEY` missing from aimt-site Pages
Production despite Cadence depending on it. This document exists so that
gap can't recur silently — see also the live, in-product check at
Admin → **System Health** (`GET /api/admin?view=config-health`, owner/admin
only), which checks section **A** below against the real running
environment. This document is the fuller reference; the panel is the
narrower, always-current, machine-checked slice of it
(`functions/_lib/admin/config-health.mjs`).

No secret values appear anywhere in this file.

---

## A. aimt-site — Cloudflare Pages (Production)

The primary deployment target. Auto-deploys on push to `main`. Every
variable below is read somewhere under `functions/**`.

| Variable | Status | Requirement | Feature | Behavior if absent |
|---|---|---|---|---|
| `SUPABASE_URL` | ACTIVE | P0 required | Core Supabase connectivity | Fails closed (500/503) on nearly every endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | ACTIVE | P0 required | Core Supabase connectivity | Fails closed on the same surfaces |
| `ANTHROPIC_API_KEY` | ACTIVE | P0 required | Cadence chat, checkpoint grading, Module 12 assessment | Throws a caught, fail-closed error in `ask-cadence.mjs`, `checkpoint-evaluation.mjs`, `scenario-fact-gate.mjs`, `cadence-grader.mjs` |
| `STRIPE_SECRET_KEY` | ACTIVE | P0 required | Stripe checkout, payment verification | Checkout creation fails closed (500) |
| `STRIPE_WEBHOOK_SECRET` | ACTIVE | P0 required | Stripe checkout, payment verification | Webhook signature verification impossible; all events rejected |
| `STRIPE_PRICE_ID` | ACTIVE | P0 required | Stripe checkout, payment verification | `create-checkout-session.js` fails closed. **Note:** `claim-course-access.js`'s price-match check silently *skips* (does not fail closed) if this is absent — a known inconsistency, not yet remediated |
| `RESEND_API_KEY` | ACTIVE | P1 required-for-feature | Transactional email (manual-grant invite, paid-enrollment welcome) | Degrades safely: entitlement/account action still completes, a warning is recorded, no email sends |
| `ELEVENLABS_API_KEY` | ACTIVE | P1 required-for-feature | Listen Mode narration | Throws a caught error; Listen Mode TTS fails closed, rest of course unaffected |
| `RESEARCH_INGEST_SECRET` | ACTIVE | P1 required-for-feature | Research library ingestion | Returns 500 Misconfigured |
| `RESEARCH_QUERY_SECRET` | ACTIVE | P1 required-for-feature | Research library query | Returns 500 Misconfigured |
| `AIMT_OWNER_EMAIL` | OPTIONAL | P2 | One-time owner bootstrap | Owner bootstrap is already complete for this project (`admin_users` has an owner row) — absence today has **no functional effect**. Kept as a safeguard only, in case `admin_users` is ever emptied |
| `MCP_CONNECTOR_SECRET` | OPTIONAL | P2 | MCP connector auth (static-secret path) | One of two accepted auth paths — Supabase OAuth is the alternate; absence doesn't disable the endpoint alone. **Also required** by the future harvester Worker (section D) under the same name, for a different purpose |
| `GROK_MCP_OAUTH_CLIENT_ID` | OPTIONAL | P2 | MCP OAuth client-binding narrowing | Skips the narrowing check only; doesn't disable OAuth auth for MCP |
| `CADENCE_CHAT_MODEL` | OPTIONAL | P2 | Cadence chat model override (testing only) | **Expected to be absent.** The current model registry (`cadence-model-registry-v5`) already has an approved default (`claude-sonnet-5`) for this role. This variable only matters when deliberately testing a candidate model |
| `CADENCE_GRADING_MODEL` | OPTIONAL | P2 | Cadence grading model override (testing only) | Same as above — registry already has an approved default; absence is expected and permanent, not a gap |

## B. headspa-proxy — Cloudflare Worker (legacy-scoped, **still active**)

Not fully legacy: `headspa-mastery.html`'s `callAI()`/`PROXY_URL` still
calls this Worker today, for **Review Mode** and a deactivated legacy
guide panel specifically (a narrower role than its original design — most
Cadence traffic now runs through the Pages Functions in section A
instead). Deployed by pasting `cadence-worker/worker.js` directly into the
Cloudflare dashboard (Quick Edit) — no `wrangler.toml`, no CLI deploy.

| Variable | Status | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | ACTIVE | **Same name, separate binding from section A's copy.** Setting one does not set the other. |
| `SUPABASE_URL` | ACTIVE | |
| `SUPABASE_ANON_KEY` | ACTIVE | Used to verify the caller's own session token |
| `SUPABASE_SERVICE_ROLE_KEY` | ACTIVE | For the entitlement check |
| `ALLOWED_ORIGINS` | ACTIVE | CORS allowlist |
| `STAFF_EMAILS` | ACTIVE | Staff allowlist |
| `CADENCE_CHAT_MODEL` | ACTIVE (Worker-local) | This Worker keeps its **own separate** model-override read — it does not share `functions/_lib/cadence/model-config.mjs`'s registry. A place the two Cadence architectures could drift apart. |

**Not readable by the System Health panel** — it only inspects the aimt-site Pages runtime (section A). This Worker's variables must be checked directly in the Cloudflare dashboard.

## C. Supabase dashboard — Auth/SMTP configuration (LEGACY/EXTERNAL to this repo)

Not a Cloudflare env var at all, in any deployment target — lives only in
the Supabase project dashboard. Not readable or settable by any code in
this repo, and not covered by the System Health panel.

- Custom SMTP settings (Authentication → Settings → SMTP Settings) — host `smtp.resend.com`, sender `no-reply@auth.aimtrichology.com`, a Resend API key pasted directly into that dashboard field. **This is a separate credential entry from `RESEND_API_KEY`** in section A, even though both point at the same Resend account.
- Auth Site URL / Redirect URL allowlist
- OAuth Server enable/disable state
- Registered OAuth clients
- The three branded Auth email templates (confirm-signup, reset-password, change-email)

## D. aimt-research-harvester — Cloudflare Worker (FUTURE, not deployed)

Exists only on the unmerged `research-harvester-worker` branch — **not
part of production `main`**, has never been deployed, has no Cloudflare
secrets set. `wrangler.toml` states this explicitly.

| Variable | Status | Notes |
|---|---|---|
| `HARVESTER_MODE` | FUTURE | Non-secret var, defaults to `"dry-run"` (safe-by-default) |
| `XAI_RESEARCH_MODEL` | FUTURE | Non-secret var, defaults to `"grok-4.7"` |
| `XAI_API_KEY` | FUTURE | Secret, required for live mode; not yet provisioned |
| `MCP_CONNECTOR_SECRET` | FUTURE | Secret, required for live mode. **Shares its name with section A's variable** — intended to be the same credential authenticating this future Worker against the already-live MCP connector |
| `HARVESTER_RUN_SECRET` | FUTURE | Secret, required; gates `POST /run` |

---

## Correction to prior documentation

`DEPLOY-NOTES.md` (Session 1) states `ANTHROPIC_API_KEY` belongs only to
the `headspa-proxy` Worker. **This is stale and was the direct cause of
today's Cadence outage.** Current code requires a *separate* copy of this
same-named variable on the aimt-site Pages project itself (section A) —
`functions/_lib/certification/cadence-grader.mjs`'s own header comment
has said so since it was written: *"Requires its own `ANTHROPIC_API_KEY`
env var on the Pages project (separate from the Worker's copy of the
same secret — same key value, different binding)."* Code wins over the
stale doc; both bindings must be set, independently, whenever this key
rotates.
