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

## Current launch plan status
Full audit lives in the owner's records (AIMT-Launch-Audit.md, 22 items).
- ✅ Session 1 (built, deploying): stripe-webhook.js, claim price validation,
  course_progress migration + aimt-progress-sync.js, hardened Cadence Worker.
  Instructions: `DEPLOY-NOTES.md` (Session 1 zip).
- ⏳ Session 2 (next): `completions` table + verifiable certificate credential
  IDs + public /verify page; legal pages (terms/privacy/refunds) in the site
  design system; remove STAFF_EMAIL_ALLOWLIST from client HTML (staff access
  moves to entitlement rows / Worker env).
- ⏳ Session 3: "My AIMT" student dashboard (extends student-access.html:
  enrolled courses + progress, downloads via Supabase Storage signed URLs,
  certificate re-download); SEO (meta descriptions, canonicals, robots.txt,
  sitemap.xml, favicon); Coming Soon cards on courses.html.
- ⏳ Rolling: Vimeo IDs into STEP_VIDEO_IDS (12 slots, Module 8); optimized
  images (WebP) replacing the 6.9MB hero PNG.
