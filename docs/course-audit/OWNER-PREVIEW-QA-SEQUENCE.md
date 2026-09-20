# Owner Preview QA Sequence — `course-audit-build` branch preview

**Audience:** Brandon (owner), to run by hand against the real Cloudflare
Pages branch-preview URL for `course-audit-build`. Nothing in this document
was executed while writing it — no branch preview was deployed, no build was
triggered, no Supabase data was touched, per this session's scope.

## Read this first — a branch preview is NOT an isolated database

This repo points at exactly **one** Supabase project for every environment —
production and every branch preview alike (see
`docs/admin/AIMT-ADMIN-ACTIVATION-RUNBOOK.md` §0.1, and the environment-variable
inventory added to `docs/course-audit/CLEAN-URL-PREVIEW-DEPLOY-CHECKLIST.md`).
**Do not assume "this is just a preview" means an action is safe to run.**
Signing in is safe. Loading a page that reads data is safe. Anything that
*writes* a row — a new account, an entitlement, an admin row, a progress row,
an audit-log row — is a real, permanent write against the one production
database, indistinguishable from a production write once committed. Every
step below states its mutation risk explicitly; steps marked **REQUIRES
EXPLICIT OWNER APPROVAL BEFORE RUNNING** should not be run as part of a
routine pass without a deliberate go-ahead, ideally using an account created
specifically for test purposes rather than a real student's.

Each step lists: the exact action, the exact expected result, whether it
needs a real Supabase login, and its Supabase mutation risk.

---

### 1. Confirm environment variables, then deploy/confirm the branch preview
- **Action:** In the Cloudflare Pages dashboard, on the **Preview**
  environment (not Production), confirm every variable in the "Environment-
  variable inventory" table in `CLEAN-URL-PREVIEW-DEPLOY-CHECKLIST.md` is set
  — `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`,
  `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `ANTHROPIC_API_KEY`,
  `ELEVENLABS_API_KEY`, `RESEND_API_KEY`, and (only if you intend to run step
  13 below) `AIMT_OWNER_EMAIL`. Then push/confirm the `course-audit-build`
  branch has a completed Pages deployment, and get its exact
  `course-audit-build.aimt-site.pages.dev`-style preview URL from the
  Deployments tab.
- **Expected result:** Build succeeds; the preview URL loads `index.html`
  with no build-time errors in the Cloudflare deploy log.
- **Requires real Supabase login:** No.
- **Supabase mutation risk:** No — setting env vars and building is
  configuration only, it does not touch any table by itself.

### 2. Clean course URL — route behavior
- **Action:** On the preview URL, `GET /head-spa-certification` directly
  (type it in the address bar, not a link click).
- **Expected result:** `200`, real course sales-page content renders, address
  bar still shows `/head-spa-certification` (no visible redirect). Matches
  the locally-verified behavior already documented in
  `CLEAN-URL-PREVIEW-DEPLOY-CHECKLIST.md`; this step is the real-edge
  confirmation of that local result, not a new test.
- **Requires real Supabase login:** No.
- **Supabase mutation risk:** No.

### 3. Legacy URL redirects
- **Action:** `GET /headspa-mastery.html`, then `GET /headspa-mastery` (no
  extension), then `GET /cadence-intro-preview.html`, all on the preview
  host.
- **Expected result:** First two both `301` to `/head-spa-certification`.
  Third `301`s to `/index.html`. No redirect loops.
- **Requires real Supabase login:** No.
- **Supabase mutation risk:** No.

### 4. Hard refresh and back/forward on the clean URL
- **Action:** With `/head-spa-certification` loaded, hard-refresh
  (Cmd+Shift+R / Ctrl+Shift+R), then navigate away to `/index.html` and use
  the browser Back button, then Forward.
- **Expected result:** Hard refresh re-requests the same clean URL with no
  redirect flicker or stale content. Back/Forward moves between
  `/head-spa-certification` and `/index.html` cleanly, no loop, no
  unexpected extra redirect hop.
- **Requires real Supabase login:** No.
- **Supabase mutation risk:** No.

### 5. Buy page — sales page, pricing, revenue calculator
- **Action:** On `/head-spa-certification` (signed out), scroll through the
  sales-page (`.lp-*`) sections: confirm the `$597` one-time-tuition price
  block renders, exercise the Module 10 "explore the revenue potential"
  calculator sliders (`#lpEconPrice` and its siblings — illustrative-only,
  explicitly disclosed as such), and click one **Begin Enrollment** /
  **Explore The Course →** button only far enough to confirm it redirects to
  a real Stripe Checkout page (`create-checkout-session.js` responding
  successfully). **Do not enter payment details or complete the checkout.**
- **Expected result:** Price and calculator render and respond correctly;
  clicking enrollment lands on a genuine Stripe-hosted Checkout page for
  $597, confirming `create-checkout-session.js` and its Stripe/Supabase env
  vars are wired correctly on preview.
- **Requires real Supabase login:** No.
- **Supabase mutation risk:** No, **provided you stop at the Stripe Checkout
  page and go no further.** Completing a real checkout (even initiating a
  test-mode payment, if Stripe test mode is ever configured here) triggers
  `stripe-webhook.js` on `checkout.session.completed`, which writes a real
  `course_entitlements` row and — if it proceeds through `success.html` —
  creates a real Supabase Auth account. A full purchase-flow test is
  **REQUIRES EXPLICIT OWNER APPROVAL BEFORE RUNNING** and is out of scope for
  a routine pass; it also involves real money unless Stripe test mode is
  confirmed active, which this session did not verify.

### 6. Certificate verification (`verify.html`)
- **Action:** Navigate to `/verify.html` on the preview host and enter any
  credential ID (a real one if you have one, or an obviously-fake one like
  `AIMT-HS-2026-TEST01`).
- **Expected result:** A "Credential Not Found" message for a fake/unknown
  ID, or the real record (name/course/completion date) for a valid one.
  `functions/api/verify-credential.js` is a public, unauthenticated `GET`
  that only ever reads `public.completions` — confirmed in source, no write
  path exists in that function at all.
- **Requires real Supabase login:** No.
- **Supabase mutation risk:** No — this endpoint has no write path.

### 7. Sign in (`student-access.html`)
- **Action:** Navigate to `/student-access.html` and sign in with a real
  test/owner AIMT account's email + password (ideally an account created
  specifically for this QA pass, not a real paying student's).
- **Expected result:** Successful sign-in redirects to `/my-aimt.html` (the
  default landing target when no `?next=` is present).
- **Requires real Supabase login:** Yes.
- **Supabase mutation risk:** No — signing in is a Supabase Auth session
  action, not a write to any of the app's own tables
  (`course_entitlements`, `course_progress`, `admin_users`,
  `admin_audit_log`).

### 8. My AIMT dashboard load
- **Action:** On `/my-aimt.html`, signed in, confirm the dashboard renders
  entitlements, course progress, and completions for the signed-in account.
- **Expected result:** Dashboard populates from real, RLS-scoped reads
  against `course_entitlements` / `course_progress` / `completions` for this
  user only (confirmed as `SELECT`-only calls in `my-aimt.html`'s script).
- **Requires real Supabase login:** Yes.
- **Supabase mutation risk:** No — read-only queries.

### 9. Authenticated course entry (`?enter=1`) — HIGH RISK
- **Action:** From My AIMT, click the course's **Continue** link (goes to
  `head-spa-certification?enter=1`), OR type that URL directly while signed
  in.
- **Expected result:** Lands inside the actual course app at the student's
  current position (not the sales page), per the app's `?enter=1` handoff
  logic in `headspa-mastery.html`.
- **Requires real Supabase login:** Yes.
- **Supabase mutation risk: YES — REQUIRES EXPLICIT OWNER APPROVAL BEFORE
  RUNNING.** Confirmed in source, not hypothetical: once inside, the page
  calls `AIMT_SYNC.init()` (`assets/js/aimt-progress-sync.js`), which — for
  an account with no existing `course_progress` row, or one that's behind on
  the score/timestamp merge rule — immediately calls `schedulePush(0)` and
  **upserts a real `course_progress` row for this account**, before the
  student clicks anything. This is a genuine write against the single shared
  Supabase project, not a "just looking" action, and CLAUDE.md's own
  description of this file's merge rule ("higher progress score wins") means
  a careless preview visit from an account with real prior progress could
  also *overwrite* that account's true progress if the preview's local
  browser state is stale or different. Use a disposable test account for
  this step, and get owner sign-off first regardless.

### 10. Review Mode pass — the safe alternative for exercising course content
- **Action:** On the preview host (a `*.aimt-site.pages.dev` branch-preview
  subdomain — confirmed eligible in `assets/js/headspa-state.js`'s
  `REVIEW_MODE_PRODUCTION_HOSTS` exclusion list, which only blocks the bare
  production hostnames), navigate to `/head-spa-certification?review=1`.
  Confirm the "Course Review Mode — progress is not being recorded" banner
  appears, then use it to inspect Module 12's final-assessment display,
  checkpoints, and the Ask Cadence panel.
- **Expected result:** Full course content, checkpoints, and Module 12
  preview render and respond exactly as they would for a real student, the
  Review Mode banner stays visible throughout, and any checkpoint submission
  shows the "Review Mode test — not saved" label instead of a real grade.
- **Requires real Supabase login:** No — Review Mode needs no account at
  all.
- **Supabase mutation risk:** No. `AIMT_SYNC.init()` explicitly checks
  `ReviewMode.isActive()` first and returns immediately without ever calling
  Supabase (`assets/js/aimt-progress-sync.js`), and certificate issuance is
  hard-blocked with an alert in this mode. This is the preferred way to QA
  Module 12 / final-assessment display on a preview without the risk in
  step 9.

### 11. Service Timer `?next=` return path
- **Action:** Signed out, navigate to `/aimt-service-timer.html`. Confirm
  it redirects to `/student-access.html?next=aimt-service-timer.html`. Then
  sign in with a real test account.
- **Expected result:** After successful sign-in, the browser lands back on
  `/aimt-service-timer.html` (not the default `/my-aimt.html`), completing
  the loop. This logic already has a passing unit test
  (`tests/service-timer-login-next-route.test.mjs`) that verifies the
  extracted routing function directly against the shipped source — this step
  is the live-preview confirmation of already-tested code, not something to
  re-implement or re-derive here.
- **Requires real Supabase login:** Yes, for the second half (completing the
  loop). The redirect-out half (signed-out visit to the Timer) needs no
  login.
- **Supabase mutation risk:** No — signing in is not a table write (see
  step 7). The Timer itself does not touch `course_progress` or
  entitlements.

### 12. Admin entry link visibility (non-admin account)
- **Action:** Signed in on `/my-aimt.html` as a real but **non-admin**
  account, confirm the hidden "AIMT Admin" link (`.aimt-admin-entry`) stays
  hidden.
- **Expected result:** Link stays `display:none`. `checkAdminEntryPoint()`
  calls `GET /api/admin?view=me`; for a non-admin the server returns a
  non-`ok` response and `revealAdminEntry()` never runs.
- **Requires real Supabase login:** Yes (any real, non-admin account).
- **Supabase mutation risk:** No — `view=me` for an account with an existing
  (non-empty) `admin_users` table is a pure read. (Contrast with step 13,
  where the *first-ever* call to this same view can itself be a write — see
  below.)

### 13. Admin access behavior (`/admin.html` as owner) — HIGH RISK
- **Action:** Set `AIMT_OWNER_EMAIL` on the preview environment to the
  intended owner account's email (see the Activation Runbook §2), sign in to
  `/admin.html` with that exact account.
- **Expected result:** If this is the very first authenticated hit to
  `/api/admin?view=me` while `admin_users` is empty, the request itself
  bootstraps that account as `role: 'owner'` and the sidebar/dashboard load.
  On any later visit (row already exists), it's a normal read-only admin
  session.
- **Requires real Supabase login:** Yes, and specifically the
  `AIMT_OWNER_EMAIL` account.
- **Supabase mutation risk: YES on first run — REQUIRES EXPLICIT OWNER
  APPROVAL BEFORE RUNNING.** Per `functions/_lib/admin/auth.mjs`
  (`bootstrapOwnerIfAllowed`, documented step-by-step in
  `docs/admin/AIMT-ADMIN-ACTIVATION-RUNBOOK.md` §3), the first qualifying
  request **inserts a real, permanent row into `admin_users`** against the
  one shared Supabase project — this is exactly the kind of "just signing in
  to look" action that is deceptively easy to run without realizing it
  mutates data. Do not run this step until the owner has confirmed they want
  that bootstrap to happen on this environment right now. Any subsequent use
  of the admin UI's **grant / revoke / reactivate manual access** actions
  (`functions/api/admin/index.js`'s `onRequestPost`) are separately and
  obviously mutating (`course_entitlements` writes, plus an
  `admin_audit_log` row each time) and are not covered by "just looking" at
  all — do not exercise those without separate explicit approval, and they
  are out of scope for this QA pass regardless per the task's boundaries.

### 14. Phone QA pass (mobile viewport)
- **Action:** At a 375×812 mobile viewport, re-run steps 2, 3, 5 (view-only
  portion), 6, and 10 (Review Mode) — clean URL, legacy redirects, buy page
  rendering, credential verification, and Review Mode/Module 12 — checking
  for layout breakage, unreadable text, or tap targets that don't register.
- **Expected result:** Same pass/fail outcomes as the desktop runs of those
  steps, with no mobile-specific layout regression (per CLAUDE.md's design
  system, the dark/institutional aesthetic should hold at mobile width too).
- **Requires real Supabase login:** No — this pass is deliberately scoped to
  the no-login steps above; re-running the authenticated steps (7–9, 11–13)
  on mobile is optional and, if done, carries the same mutation risk noted
  in each of those steps individually.
- **Supabase mutation risk:** No, for the scope described above.

### 15. Keyboard-only QA pass
- **Action:** Using Tab / Shift+Tab / Enter / Space only (no mouse),
  navigate the buy page's enrollment CTA far enough to confirm it's
  reachable and activatable by keyboard (stop before Stripe as in step 5),
  submit the `verify.html` credential lookup via Enter (its `keydown`
  handler explicitly supports this), and step through a Module 12 Review
  Mode checkpoint via keyboard only.
- **Expected result:** Every interactive element reached in a logical order
  with visible focus states; Enter activates the credential-verify button
  and Review Mode checkpoint controls exactly as a click would.
- **Requires real Supabase login:** No — scoped to Review Mode and the
  public verify endpoint, matching the safe steps above.
- **Supabase mutation risk:** No, for the scope described above.

### 16. Crawler/canonical and robots/sitemap checks
- **Action:** From a plain `curl` (no cookies) against the preview host,
  `GET /head-spa-certification` and inspect the `canonical` link tag and
  `og:url` meta tag in the returned HTML. Separately, fetch `/robots.txt`
  and `/sitemap.xml` and confirm every URL they list is the production
  domain (`aimtrichology.com`), never the preview host.
- **Expected result:** `canonical`/`og:url` both resolve to
  `https://aimtrichology.com/head-spa-certification` with a `200` (not a
  redirect) when fetched this way. `robots.txt`/`sitemap.xml` reference only
  the production domain — nothing about a branch-preview URL should ever be
  crawler-facing or indexable.
- **Requires real Supabase login:** No.
- **Supabase mutation risk:** No.

---

## Summary — grouped by mutation risk

### (a) No database mutation risk (safe to run anytime, no login needed)
Steps 1, 2, 3, 4, 6, 10, 11 (redirect-out half only), 14, 15, 16.

### (b) Requires a real Supabase login, but no mutation risk
Steps 5 (stopping before Stripe Checkout completion), 7, 8, 11 (sign-in half
to complete the loop), 12.

### (c) Could mutate Supabase — REQUIRES EXPLICIT OWNER APPROVAL BEFORE RUNNING
- **Step 5, if extended past the Stripe Checkout redirect** — a completed
  purchase writes a real `course_entitlements` row (webhook) and a real
  Supabase Auth account (`success.html`), and may involve real money.
- **Step 9 — authenticated course entry (`?enter=1`)** — confirmed in source
  to upsert a real `course_progress` row on entry for accounts with no
  existing row (or one behind on the merge rule); use a disposable test
  account and get sign-off first.
- **Step 13 — Admin access, first run** — confirmed in source to insert a
  real `admin_users` owner row on the first qualifying request; any
  grant/revoke/reactivate action taken inside the admin UI afterward is a
  further, separately-approved mutation and is out of scope for this pass
  regardless.

No step in this document should be read as safe merely because it runs
against a "preview" — buckets (b) and (c) above are the ones that touch the
one real, shared Supabase project, and (c) specifically is the one that
writes to it.
