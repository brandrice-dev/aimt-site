# AIMT paid-content protection — controlled cutover

**Status: IMPLEMENTED IN DRAFT, NOT DEPLOYED, NOT VERIFIED.** PR #170 is a branch preview only; Brandon must review and approve the completed release. Main and the public production site remain unchanged. Do not merge until private storage is populated, Cloudflare routing is verified, and representative enrollment tests pass.

## What the draft branch now contains

- The public `headspa-mastery.html` is a sales-page shell. Full module content, final assessment, Cadence curriculum and its scripts are kept out of the newly published public HTML. `tests/paid-content-media.test.mjs` checks for former paid markup markers.
- `assets/js/aimt-paid-course-loader.js` requests `/api/course-session`, then `/api/course-material?resource=course-app` **only after** Supabase user authentication and server-side course-entitlement verification. It restores the legacy `?enter=1` bootstrap for the private app, preserving the existing same-origin course lifecycle. `my-aimt.html` continues to link to `/head-spa-certification?enter=1`.
- `functions/api/course-material.js` allowlists the private course app and six approved downloads. The My AIMT dashboard downloads private files with an authenticated bearer-token fetch, not an unauthenticated `<a download>`.
- Native premium `/assets/images/course/*` and `/assets/audio/listen/headspa-mastery/*` are routed to private media Functions. Media requests require a short-lived `Secure; HttpOnly; SameSite=Strict` cookie plus **fresh** server-side enrollment verification; no arbitrary bucket key or Supabase service role is exposed. Public marketing images and general site scripts remain static.
- `scripts/paid-course-cutover.mjs` reads a pinned, SHA-verified **pre-split Git revision** and prepares the private app plus paid-media manifest without recommitting full paid source to this branch. `--inventory` is read-only; `--verify` is read-only against configured Storage; `--upload` requires an explicit maximum byte authorization and refuses public buckets.
- `supabase/migrations/20261119_aimt_private_paid_content_bucket.sql` is a **manual-only** additive migration to create a private `aimt-paid-content` Storage bucket. Committing the SQL does not execute it.

## What is known about the actual environment

- As checked on November 19, Supabase project `epcnkncyxqgscrejinwr` has only the existing **private `founder-review-materials`** bucket. It has **no `aimt-paid-content` bucket or uploaded course assets**.
- Existing entitlement and progress records are not zero: eight course entitlements (one $1 paid live checkout, one sandbox checkout entry, six manually granted), three saved progress rows and one completion/certificate. These must not be changed or deleted as part of the migration. The $1 live Stripe entitlement is unlinked and carries no progress.
- The GitHub repo is currently public; its prior commits and possible forks already exposed the old paid course. Switching to private (if approved and Cloudflare deployment integration verified) limits future public repository access but cannot guarantee recall of historic copies.
- Stripe's connected account provides Live Mode **read-only** access; the Sandbox connection is not available here. A complete sandbox checkout and enrollment test cannot be claimed yet.
- Meta Pixel ID, Cloudflare CAPI secret and the final Meta Test Events verification are pending. None of that is required to upload private content, and missing Meta secrets must not prevent checkout.

## One-time staging transfer through GitHub Actions (prepared; not executed)

The existing **AIMT Growth Funnel Validation** workflow now contains a separate, **manual-dispatch-only** job named `Manually stage paid assets in private Supabase Storage`. It is guarded to run only when the workflow is explicitly dispatched on `review/aimt-security-meta-2026-11-19`; ordinary PR CI skips it. The job uses a `300000000` byte ceiling (verified read-only manifest: 251 objects, 294176692 bytes), a pinned course source commit/blob, and SHA-256 verification for all uploaded/downloaded bytes. The workflow never deploys the website and does not update student database rows.

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
