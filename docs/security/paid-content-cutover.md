# AIMT paid-content protection — controlled cutover

**Status: DRAFT REVIEW, NOT APPROVED FOR PRODUCTION.** PR #170 remains unmerged. Its Cloudflare branch Preview is active; `main` and production remain unchanged. Private Storage staging and anonymous-access smoke tests passed, but Stripe Sandbox checkout and its enrollment/attribution chain remain unverified. Owner approval is required for any release.

## November 20, 2026 — Sandbox checkout price mismatch (open release blocker)

- The enrollment page advertises **$697**, while the owner's actual Stripe Embedded Checkout screen displays **$597 in TEST MODE**. The owner correctly stopped the payment test. **Do not complete a test purchase or approve the release while these amounts disagree.**
- Stripe's distinct account **AIMT sandbox** (`livemode=false`) has a newly created active **$697** Price, `price_1UdyGPKjk8tjNSVUJm9DnnDm`, set as its product default; its active webhook `we_1UdyOWKjk8tjNSVU1SjnVBx7` targets the PR's Cloudflare branch Preview.
- Read-only Cloudflare **Preview** settings display that exact `STRIPE_PRICE_ID`, while the `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET` are encrypted and cannot be independently inspected. The Stripe Sandbox connector has **no recent $697 Checkout Session**. Therefore, the on-screen $597 session is **not verified as coming from the newly configured Sandbox**.
- The last observed Cloudflare PR Preview deployment was generated **before the Preview Stripe variable changes**. Cloudflare secret bindings take effect on a *new deployment*. A new commit to this review branch triggers a new Preview deployment, never a Production deployment. Verify the deployment completes before retesting.
- Open the new branch-preview `/enroll` in a **fresh private/incognito window** to avoid reusing any old Stripe Link Checkout or tab-scoped `aimt-checkout-request-key`. Check that the Stripe iframe itself shows **$697** and TEST MODE; if it still shows $597, stop and compare the Checkout Session's exact account, line-item Price ID, discounts, and Cloudflare Preview key mode in a secure environment. Do not reveal secret values in logs or GitHub.
- Only after price agreement: complete one Sandbox test payment, confirm the webhook destination signing secret matches the deployed Preview function, validate entitlement and Admin → Growth test classification, and record QA. This preview shares an existing Supabase project, so keep test activity segmented from real revenue/student access.

**Evidence:** owner screenshot (Nov 20); Stripe Sandbox account price/webhook and absence of a recent $697 session (read-only); current Preview variable names/visible price; GitHub PR deployment history. The precise cause of the $597 session remains unverified.

## What the draft branch now contains

- The public `headspa-mastery.html` is a sales-page shell. Full module content, final assessment, Cadence curriculum and its scripts are kept out of the newly published public HTML. `tests/paid-content-media.test.mjs` checks for former paid markup markers.
- `assets/js/aimt-paid-course-loader.js` requests `/api/course-session`, then `/api/course-material?resource=course-app` **only after** Supabase user authentication and server-side course-entitlement verification. It restores the legacy `?enter=1` bootstrap for the private app, preserving the existing same-origin course lifecycle. `my-aimt.html` continues to link to `/head-spa-certification?enter=1`.
- `functions/api/course-material.js` allowlists the private course app and six approved downloads. The My AIMT dashboard downloads private files with an authenticated bearer-token fetch, not an unauthenticated `<a download>`.
- Native premium `/assets/images/course/*` and `/assets/audio/listen/headspa-mastery/*` are routed to private media Functions. Media requests require a short-lived `Secure; HttpOnly; SameSite=Strict` cookie plus **fresh** server-side enrollment verification; no arbitrary bucket key or Supabase service role is exposed. Public marketing images and general site scripts remain static.
- `scripts/paid-course-cutover.mjs` reads a pinned, SHA-verified **pre-split Git revision** and prepares the private app plus paid-media manifest without recommitting full paid source to this branch. `--inventory` is read-only; `--verify` is read-only against configured Storage; `--upload` requires an explicit maximum byte authorization and refuses public buckets.
- `supabase/migrations/20261119_aimt_private_paid_content_bucket.sql` is a **manual-only** additive migration to create a private `aimt-paid-content` Storage bucket. Committing the SQL does not execute it.

## What is known about the actual environment

- **Updated verification (Nov 19–20):** Supabase project `epcnkncyxqgscrejinwr` now has private `aimt-paid-content` (`public=false`) populated with exactly **251 verified objects / 294,176,692 bytes**, including one original course app, 244 media, and six resources. GitHub Actions upload run `44665172045` passed upload SHA verification and independent read-only recheck. Do not repeat the upload.
- Existing entitlement and progress records are not zero: eight course entitlements (one $1 paid live checkout, one sandbox checkout entry, six manually granted), three saved progress rows and one completion/certificate. These must not be changed or deleted as part of the migration. The $1 live Stripe entitlement is unlinked and carries no progress.
- The GitHub repo is currently public; its prior commits and possible forks already exposed the old paid course. Switching to private (if approved and Cloudflare deployment integration verified) limits future public repository access but cannot guarantee recall of historic copies.
- **Updated verification (Nov 20):** AIMT Live and separate AIMT Sandbox are both connected; the Sandbox contains the new $697 course Price and a test webhook. A complete $697 checkout/enrollment test remains blocked by the observed **$597 Stripe Embedded Checkout mismatch**, which must be resolved before payment.
- Meta Pixel ID, Cloudflare CAPI secret and the final Meta Test Events verification are pending. None of that is required to upload private content, and missing Meta secrets must not prevent checkout.

## One-time staging transfer through GitHub Actions (completed; retained for audit)

The **AIMT Growth Funnel Validation** workflow contains a **manual-dispatch-only** job named `Manually stage paid assets in private Supabase Storage`, guarded to run only on the exact review branch. It completed successfully on November 19 (run `44665172045`): **251 objects, 294,176,692 bytes**, SHA-verified on upload and an independent verify-only pass. No student database rows were modified. The following instructions describe the completed setup for audit, not a request to repeat migration.

Required owner-controlled setup, **before** intentionally dispatching the job:

1. In GitHub repo `brandrice-dev/aimt-site`, open **Settings → Environments** and create `aimt-private-course-staging` (exact name).
2. Under that environment's **Environment secrets**, add **`SUPABASE_SERVICE_ROLE_KEY`** using the **new Supabase Secret key (`sb_secret_...`)**, **not** the Publishable key. The migration utility accepts this modern secret using only the `apikey` header and also supports the older legacy `service_role` JWT when needed. The GitHub environment variable name remains `SUPABASE_SERVICE_ROLE_KEY` for compatibility with the existing workflow. Do not put the key in a GitHub repository file, PR comment, issue, command line or chat. Prefer environment-scoped secret rather than a repository-wide secret. Do not modify Cloudflare's existing key.
3. Verify that the Cloudflare **Preview** environment (not Production) has Text variable `PAID_ASSETS_BUCKET=aimt-paid-content` and still has its existing `SUPABASE_URL` and encrypted `SUPABASE_SERVICE_ROLE_KEY`. The owner reported Preview configuration; it has not been independently inspected through a Cloudflare management connection.
4. When ready to stage, open **Actions → AIMT Growth Funnel Validation → Run workflow**, select branch `review/aimt-security-meta-2026-11-19` and run. The private migration job first verifies source and exact byte cap, uploads **only** missing objects into bucket `aimt-paid-content` and verifies every object's SHA-256. If one object differs it refuses to overwrite it.
5. Check the named job's exit status and no-secret logs; use Supabase's `storage.objects` count and bucket `public=false` as an independent follow-up check. Do not merge this PR or mark release complete based on that run alone.

If GitHub Actions cannot provide this environment secret without unacceptable credential exposure, **stop** and use the existing trusted CLI migration in a secure execution environment instead. Neither method should copy the source bundle to a new public URL.

## Manual release path — in order

1. Have an independent technical reviewer assess this high-risk architecture, especially the sale/course separation, iframe-free `document.write` bootstrap, course progress and certificate behavior, short-lived cookie routing and original media paths. Confirm no protected curriculum leaks in linked public scripts or deployment artifacts.
2. After explicit owner release approval, **manually** apply the private-bucket SQL migration. Verify `public=false` and service-role access; configure Cloudflare Pages `PAID_ASSETS_BUCKET=aimt-paid-content` and confirm existing `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are present without exposing values.
3. From an authorized checkout of the exact repository commit, run `node scripts/paid-course-cutover.mjs --inventory` first. Review object count and total bytes, authorize a bounded migration size, then run `--upload` and `--verify` with credentials supplied **only through trusted environment variables**. Inspect SHA-256 verification receipts and verify non-public bucket access.
4. Verify the Cloudflare preview's Functions fail-closed setting and routes. A direct anonymous/unenrolled request to every prior paid media URL must deny; an enrolled student must retrieve the exact content. Check the document source and public JS for absent paid lessons and leaked credentials.
5. Exercise the branch preview as an anonymous visitor, authenticated nonstudent, owner/staff grant, expired user, and returning enrolled student. Verify course opening, reload/resume, saved progress, checkpoints, Review Mode, Cadence, private images and MP3, all six downloads, final assessment and certificate behavior on desktop and phone.
6. Connect Stripe Sandbox, complete a full $697-equivalent test checkout and entitlement claim, and verify Admin → Growth and Meta Test Events (only after privacy and Meta configuration review). Preserve historic unattributed $1 test as historic, not proof of full revenue attribution.
7. Present evidence, cost/usage receipts, rollback plan and exact preview to Brandon for explicit approval before merge or production deployment. Purge obsolete CDN cache and inspect residual old URLs only as part of a controlled release.

## Acceptance criteria (NOT YET VERIFIED)

- No full paid lesson or assessment exists in public HTML/JS or new raw Git trees.
- Old premium static media paths are intercepted by Functions and deny anonymous/unenrolled access, even with direct URLs.
- Private app/downloads respond 401 without auth, 403 without entitlement, and stream the exact expected bytes for enrolled users; responses are non-cacheable.
- The deployed private bucket exists, is `public=false` and matches the pinned SHA-256 manifest.
- No existing progress, staff grant, entitlement or certificate is removed or silently replaced.
- Complete paid checkout, progress/assessment, and Meta attribution behavior is tested in the appropriate sandbox/production preview.
- Owner review is recorded; no merge without approval.

**Rollback:** Keep the previous `main` branch untouched until approval; preserve the original protected-content source commit in Git history, and never delete Supabase student records. If preview fails, revert the candidate changes rather than make public static links accessible again.
