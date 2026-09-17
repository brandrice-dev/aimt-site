# Clean Course URL — Branch-Preview Deploy Validation Checklist

**Status:** `_redirects` routing architecture fixed and verified locally via
`wrangler pages dev` (real Cloudflare Pages edge emulation, not a plain
static server). Everything below marked "locally verified" is confirmed;
everything marked "needs preview deploy" cannot be fully proven without a
real Cloudflare Pages branch-preview URL and should be checked there before
merging to `main`. **Do not deploy without owner approval** — this checklist
is for when a preview deploy happens, not an instruction to trigger one.

## What changed and why (see `_redirects` inline comments for full detail)

1. Rule 1's rewrite destination changed from `/headspa-mastery.html` →
   `/headspa-mastery` (no extension). Cloudflare Pages automatically
   redirects `.html` URLs to their extensionless form — including a rewrite
   rule's *destination* — so the old destination caused a visible 308 leak
   to `/headspa-mastery` instead of transparently serving the clean URL.
2. New rule 4 added: `/headspa-mastery` (no `.html`) now 301s to
   `/head-spa-certification`, closing a duplicate-content gap Cloudflare's
   own extensionless serving would otherwise have left open.
3. Rule for `cadence-intro-preview.html` changed from an invalid `404`
   status (silently dropped by Cloudflare — the rule never took effect) to a
   valid `301` to `/index.html`.
4. Three non-curriculum SEO references inside `headspa-mastery.html`
   (canonical link, `og:url`, one footer self-link) now point at
   `/head-spa-certification` directly instead of the legacy filename.

## Locally verified (via `wrangler pages dev .`, real _redirects parsing)

- [x] `GET /head-spa-certification` → `200`, real page content, address bar
      unchanged (no redirect leak).
- [x] `GET /head-spa-certification/` (trailing slash) → `301` →
      `/head-spa-certification`.
- [x] `GET /headspa-mastery.html` → `301` → `/head-spa-certification`.
- [x] `GET /headspa-mastery` (no extension) → `301` → `/head-spa-certification`
      (previously served duplicate 200 content — now fixed).
- [x] `GET /cadence-intro-preview.html` → `301` → `/index.html` (previously
      an invalid, silently-dropped rule).
- [x] Query strings pass through the rewrite untouched: `?enter=1` and
      `?cert=1` both return byte-identical body content to the bare clean URL.
- [x] No redirect loop between rule 1 (rewrite) and rule 4 (new legacy
      redirect) — confirmed a rewrite destination is fetched directly and
      never re-enters `_redirects`.
- [x] Full page renders correctly in-browser at `/head-spa-certification`
      (screenshot taken, dark institutional design intact, no console errors).
- [x] `/head-spa-certification?enter=1` loads with no console errors (falls
      back to the sales page gracefully without a real authenticated
      session, as expected in local dev with no live Supabase credentials).
- [x] Spot-checked `/my-aimt.html`, `/student-access.html`, `/index.html`,
      `/courses.html` — all still serve `200` (via their own automatic
      extensionless-redirect, which is Cloudflare's site-wide default
      behavior, unrelated to and unaffected by these `_redirects` changes).
- [x] No Pages Function route intercepts `/head-spa-certification`,
      `/headspa-mastery`, `/headspa-mastery.html`, or a wildcard containing
      them. Confirmed by inspecting `functions/` directly: every function
      lives under `functions/api/*` (admin, cadence, certification, plus
      `claim-course-access.js`, `create-checkout-session.js`,
      `issue-certificate.js`, `stripe-webhook.js`, `verify-credential.js`).
      There is no catch-all `functions/[[path]].js` or any function file
      named `head-spa`/`headspa` anywhere in the tree. This matters because
      **`_redirects` rules do not apply to a route a Pages Function already
      owns** — a matching Function always wins first. Since none of these
      three routes fall under `/api/*`, there is no such interception risk
      today. Re-check this item if a future function is ever added outside
      `/api/*`.

## Needs a real Cloudflare Pages branch-preview deploy to confirm

- [ ] The exact same test matrix above, against the real
      `*.aimt-site.pages.dev` preview URL for this branch — `wrangler pages
      dev` is a very close emulation but is not guaranteed byte-identical to
      the production edge in every corner case.
- [ ] Browser back/forward and hard refresh on `/head-spa-certification`
      (should just re-request the same URL; no client-side router to
      confuse, but worth a real check).
- [ ] Full authenticated entry: log in with a real (or test) Supabase
      account, confirm `?enter=1` actually lands inside the course app (not
      just "doesn't error") and Review Mode / `?cert=1` behave as students
      expect — this needs real Supabase credentials against a preview or
      staging Supabase project, not something to fake locally.
- [ ] Confirm My AIMT (`my-aimt.html`) and student-access
      (`student-access.html`) links that point at `/head-spa-certification`
      land correctly end-to-end, not just that the URL itself resolves.
- [ ] Search-engine-facing spot checks: confirm `og:url`/canonical resolve
      to `200` (not a redirect) when fetched the way a crawler would.
- [ ] Confirm no interaction between these new rules and Cloudflare's
      dashboard-level redirect/trailing-slash settings if any are configured
      outside this repo (the dashboard can carry settings that aren't
      visible from the codebase — worth a one-time check by the owner).

## Post-production-deploy smoke test (after the eventual owner-approved merge + deploy — not before)

This is a checklist only — it does not trigger a preview or production
deploy. Run this final pass against `https://aimtrichology.com` itself once
this branch has actually been merged and deployed to production, before
considering the clean-URL rollout done:

- [ ] Clean route: `GET https://aimtrichology.com/head-spa-certification`
      returns `200` with real page content, address bar unchanged.
- [ ] Legacy redirects: `/headspa-mastery.html` and `/headspa-mastery` (no
      extension) both `301` to `/head-spa-certification`.
- [ ] Query strings: `?enter=1` and `?cert=1` on the clean route return the
      same body as the bare URL, unmodified.
- [ ] Hard refresh on `/head-spa-certification` re-requests the same URL
      cleanly (no redirect flicker, no stale service-worker/cache artifact).
- [ ] Authenticated entry: a real signed-in student hitting
      `/head-spa-certification?enter=1` actually lands inside the course app
      (not just "doesn't error"), and Review Mode / `?cert=1` behave as
      expected against production Supabase.
- [ ] `canonical`/`og:url` on the live page resolve to `200` at
      `/head-spa-certification` (not a redirect) when fetched the way a
      crawler would (no cookies, plain GET).
- [ ] Browser back/forward through `/head-spa-certification` behaves
      normally (no loop, no unexpected re-redirect).

## Known, pre-existing, out-of-scope platform behavior (not a regression)

Cloudflare Pages 308-redirects *every* `.html` URL site-wide to its
extensionless form by default (e.g. `/student-access.html` →
`/student-access`) — confirmed this already happens for pages `_redirects`
never mentions, so it predates and is unrelated to this session's changes.
It's functionally harmless (browsers follow 308s transparently, method is
preserved), just an extra hop. Flagged for awareness, not fixed here — it's
a site-wide platform default, not specific to the course URL work in scope
for this task.

## Environment-variable inventory for a branch-preview deploy (added 2026-09-15)

Not previously collected in one place. `docs/admin/AIMT-ADMIN-ACTIVATION-RUNBOOK.md`
documents `AIMT_OWNER_EMAIL` / `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` for
Admin MVP specifically, and `docs/email-templates/AIMT-EMAIL-TEMPLATES-SETUP.md`
/ `docs/stripe-and-email/AIMT-EMAIL-STRIPE-SETUP-CHECKLIST.md` document
`RESEND_API_KEY`. This is the complete set, grep-verified against every
`env.<NAME>` reference in `functions/api/**/*.js` and `functions/_lib/**/*.mjs`,
so a preview environment can be configured to behave like production before
any of the routes below are exercised.

| Env var | Required by | Purpose | Preview-specific note |
|---|---|---|---|
| `SUPABASE_URL` | `verify-credential.js`, `claim-course-access.js`, `create-checkout-session.js`, `stripe-webhook.js`, `issue-certificate.js`, `admin/index.js`, `_lib/admin/auth.mjs`, `_lib/certification/auth.mjs` | Supabase REST base URL | `claim-course-access.js` and `create-checkout-session.js` each hardcode `SUPABASE_URL_FALLBACK = 'https://epcnkncyxqgscrejinwr.supabase.co'` and fall back to it if this var is unset — so those two routes keep "working" on a preview with no `SUPABASE_URL` set, silently pointed at the production project. Every other function listed here has no fallback and fails outright without it. |
| `SUPABASE_SERVICE_ROLE_KEY` | same eight files as above | Server-side Supabase access (bypasses RLS) | No fallback anywhere. Missing → the admin surface returns `503 "Admin service is not configured."` (`functions/_lib/admin/auth.mjs`); other routes fail similarly. |
| `AIMT_OWNER_EMAIL` | `_lib/admin/auth.mjs` | Gates the one-time owner-bootstrap insert into `admin_users` | Must be set on the *same* Cloudflare Pages environment (Preview vs Production) you intend to bootstrap on — see the Activation Runbook §2. Do not set on production/main unless deliberately bootstrapping a production owner. |
| `STRIPE_SECRET_KEY` | `claim-course-access.js`, `create-checkout-session.js`, `stripe-webhook.js` | Stripe API calls (create Checkout Session, fetch/verify line items) | No fallback. |
| `STRIPE_PRICE_ID` | `claim-course-access.js`, `create-checkout-session.js`, `stripe-webhook.js` | Validates the purchased price ID matches the course before granting access | No fallback. |
| `STRIPE_WEBHOOK_SECRET` | `stripe-webhook.js` | Verifies Stripe webhook signatures | No fallback. Tied to a *specific* Stripe-dashboard-registered endpoint URL — the production webhook is registered against the production domain. A real end-to-end webhook test against a preview branch needs its own Stripe webhook endpoint (or CLI-based forwarding) pointed at that preview's exact URL; reusing the same secret value alone does not make production's webhook fire for preview events. |
| `ANTHROPIC_API_KEY` | `_lib/cadence/ask-cadence.mjs`, `_lib/cadence/checkpoint-evaluation.mjs`, `_lib/cadence/scenario-fact-gate.mjs`, `_lib/certification/cadence-grader.mjs` | Ask Cadence, checkpoint grading, interview-turn and assessment grading — direct Anthropic calls made from Pages Functions (separate from the `headspa-proxy` Worker, which is configured independently and out of scope here) | No fallback. Missing → any of those Cadence/certification calls fail on preview. |
| `ELEVENLABS_API_KEY` | `_lib/cadence/tts.mjs` | Cadence text-to-speech / Listen Mode audio | No fallback. |
| `RESEND_API_KEY` | `_lib/admin/manual-grant-invite-email.mjs` | Invite email sent by the Admin "grant access" action | No fallback, but the code is deliberately fail-open here: per the function's own header comment, a missing key "never throws and never rolls back the grant" — it folds a `warning` into the `admin_audit_log` row instead (`"RESEND_API_KEY is not configured — no invite email was sent..."`). So a preview missing this var will still complete the grant; only the email silently doesn't send. |

**Restating the single-Supabase-project fact for this inventory specifically:**
every variable above that touches Supabase (`SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`) points a preview's *Functions* at the exact same
production Supabase project as `main` — there is no second/staging Supabase
project this repo can point a preview at instead (full explanation:
`docs/admin/AIMT-ADMIN-ACTIVATION-RUNBOOK.md` §0.1). Separately, the
client-side Supabase URL + anon key used by the static pages themselves
(`student-access.html`, `my-aimt.html`, `headspa-mastery.html`, etc.) are
hardcoded directly in those HTML files, not sourced from any Cloudflare Pages
env var — so there is no env-var lever that changes which Supabase project
the *pages* talk to either. Today, Functions and pages alike always talk to
the one production project, preview or not. See
`docs/course-audit/OWNER-PREVIEW-QA-SEQUENCE.md` for what this means for
which specific QA steps are safe to run unattended versus which need
explicit owner approval first.
