# CLAUDE.md — AIMT / aimt-site

## What this is
Production site for AIMT (American Institute of Modern Trichology) — an online
certification platform. First course: **HeadSpa Mastery** ($497), a head spa
practitioner certification with an AI tutor named **Cadence**. Owner: Brandon.
Deployed on **Cloudflare Pages** (auto-deploys on push to main).
Currently pre-launch. Target: end of July 2026.

## Architecture — respect these rules
- **Flat HTML site. No frameworks, no build step, no bundler.** Each page is a
  self-contained .html file with inline JS. Do not introduce React, Vite, npm
  packages, or a build pipeline.
- **Cloudflare Pages Functions** live in `functions/api/*.js` — plain ES
  modules, `onRequestPost(context)` pattern, **zero npm dependencies**
  (Web Crypto + fetch only). Keep it that way.
- **Backend:** Supabase (auth + Postgres with RLS) + Stripe Checkout.
  SQL migrations live in `supabase/migrations/` — they are committed for
  record-keeping but MUST be run manually in the Supabase SQL editor.
  Pushing them does NOT execute them.
- **Cadence AI tutor** calls a separate Cloudflare Worker (`headspa-proxy`)
  which proxies to the Anthropic API. The Worker's code lives in this repo
  under `cadence-worker/` for versioning but deploys separately (paste into
  the Worker in the Cloudflare dashboard, NOT via Pages).

## Key files
- `headspa-mastery.html` — sales page + entire course app in ONE ~500KB file.
  ⚠️ Handle with care: make **surgical, minimal edits only**. Never reformat,
  never restructure, never "clean up" this file. All 12 modules of course
  content, the Cadence chat, checkpoints, and certificate logic live here.
- `assets/js/headspa-state.js` — APP_STATE: progress/state engine
  (localStorage, key `levo_app`). `load()` and `save()` are the choke points.
- `assets/js/aimt-progress-sync.js` — cloud sync layer; hooks APP_STATE.save()
  and syncs to Supabase `course_progress`. Merge rule: higher progress score
  wins; timestamps only break ties. Do not weaken this rule.
- `student-access.html` — sign in / sign up / password reset.
- `success.html` — post-Stripe-checkout: account creation + entitlement claim.
- `functions/api/create-checkout-session.js` — starts Stripe Checkout.
- `functions/api/claim-course-access.js` — links a paid checkout session to a
  user account (validates payment status AND price ID).
- `functions/api/stripe-webhook.js` — `checkout.session.completed` → writes
  entitlement server-side. Verifies Stripe signatures via Web Crypto.

## Data model (Supabase)
- `course_entitlements` — (checkout_session_id PK, course_slug,
  purchaser_email, user_id nullable). Written by webhook and claim endpoint.
  RLS: users read rows matching their user_id or email.
- `course_progress` — (user_id, course_slug) PK, `state` jsonb (full APP_STATE
  blob incl. Cadence memory), `progress_score`, timestamps. RLS: own rows only.
- `aimt_logs` — observability events from functions and pages.

## Hard rules
1. **Never touch entitlement/auth/payment logic without being explicitly
   asked**, and never weaken a check to "make something work."
2. **Never commit secrets.** All keys live in Cloudflare env vars (Pages and
   Worker). If a key appears in code, stop and flag it.
3. Course slug is `headspa-mastery` everywhere. Keep it consistent.
4. Preserve the existing design system: Cormorant Garamond / dark, quiet,
   institutional aesthetic. Match existing CSS variables and patterns; do not
   invent new visual styles.
5. Prefer **new standalone files** over editing `headspa-mastery.html`. When
   that file must change, keep diffs as small as possible and show them
   before committing.
6. Migrations: additive only. Never DROP or rewrite an existing table.
7. When a task is ambiguous or conflicts with these rules, ask — don't guess.

## Deployment flow
push to main → Cloudflare Pages builds/deploys automatically.
Worker changes: manual paste in Cloudflare dashboard (separate from Pages).
Supabase changes: run SQL manually in dashboard SQL editor.

## Governing documents
`docs/` holds the source-of-truth documents for design, copy, and launch
process — treat these as governing, not just reference: `AIMT-Design-Audit-Charter.md`,
`AIMT-Art-Direction-Brief.md`, `AIMT-Copy-Claims-Audit.md`,
`AIMT-Domain-Day-Checklist.md`, `AIMT-Design-Session-Kickoff.md`, and the full
22-item `AIMT-Launch-Audit.md`.

## Current launch plan status
- ✅ Domain live at aimtrichology.com.
- ✅ Sessions 1–4 deployed: stripe-webhook.js + claim price validation +
  course_progress sync (Session 1); verifiable certificates + legal pages +
  allowlist removal (Session 2); My AIMT dashboard + SEO pack + Coming Soon
  cards (Session 3); claims hygiene + badge propagation + rename-proofing
  (Session 4).
- ✅ Legacy admin panel removed (leaked credential, nonfunctional demo data).
- ✅ Certificate accuracy sweep done (signatory, dates, claims — see b70c82e).
- ⏳ Safe Browsing review pending on the pages.dev domain.
- ⏳ Next: Pass 1 consistency audit → design elevation pass (remaining
  certificate work is visual/design-only from here).
- ⏳ Rolling: Vimeo IDs into STEP_VIDEO_IDS (12 slots, Module 8); optimized
  images (WebP) replacing the 6.9MB hero PNG.
- ⏳ Post-launch roadmap: Owner's Console — proper admin.html behind Supabase
  auth (owner account only), real enrollment/completion/revenue metrics.
  Replaces removed legacy panel.
