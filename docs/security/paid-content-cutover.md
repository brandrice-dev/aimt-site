# AIMT paid-content protection — controlled cutover plan

**Status: BLOCKED / NOT SECURED.** This review branch contains a fail-closed API boundary, but the existing public course HTML and static premium assets have **not** been moved or removed. **Do not merge or deploy for the purpose of claiming the course is protected.** Owner: Brandon. No release is authorized by this document.

## Security fact pattern (verified from `main` on November 19, 2026)

- `headspa-mastery.html` (served as `/head-spa-certification`) contains the public landing page **and** paid course HTML, JavaScript, lessons, assessment content and lesson media references in one ~1.08 MB public file. CSS-hiding modules after an auth check does not protect source text.
- `_routes.json` excludes `/head-spa-certification`, `/headspa-mastery.html` and **all** `/assets/*` from Functions. Those files are served statically without server-side enrollment checks.
- `assets/js/aimt-course-resources.js` points to public module PDFs and PNGs under `assets/images/course/`, including Module 9's enhancement guide. Dashboard filtering is display logic, not file authorization.
- The repository is public. Historical copies remain accessible through raw GitHub URLs, Git history and possible forks even if a later deployment removes the links. GitHub visibility changes alone do not retroactively erase disclosures.
- Supabase authentication, RLS-backed `course_entitlements`, Stripe signature and price verification are already present. Preserve them as the only authority for student access and payment.

## Implemented in this draft PR (prerequisite only)

- `/api/course-material?resource=<allowlisted-key>` verifies a Supabase bearer identity, then an active `headspa-mastery` entitlement, before proxying an allowlisted file from a **private** Supabase Storage bucket.
- No user-supplied storage paths or course slugs are accepted; missing bucket configuration, sign-in, enrollment or storage returns a non-cacheable denial. No access token or service role is sent to the browser.
- Tests cover anonymous, unenrolled, unsupported-path, missing-config and enrolled access scenarios against mocked backends.
- **This endpoint is not yet used by the student app or download links.** No production Supabase configuration has been changed.

## Remaining hardening work (must be done before release)

1. **Private storage, authorized migration.** Owner approves the new non-public Supabase bucket (`PAID_ASSETS_BUCKET`) and any associated cost. Upload current paid course bundle and the six listed downloadable resources to the exact allowlisted private paths. Verify checksums and RLS/storage permissions before switching links. Do **not** upload paid course source to a publicly readable bucket or a new file in this public repository.
2. **Split the sales page from the course.** Keep public curriculum descriptions, public imagery and checkout on `/head-spa-certification`. Remove **every** complete paid module body, assessment, tutor prompt and course-only script from the public HTML and JS. After authenticating and proving enrollment, load the private course app through the secure course endpoint. Preserve the current Supabase student session, APP_STATE, cloud sync, checkpoints, exam and certificate routes. Treat this as a high-risk migration, not a trivial markup move.
3. **Protect resource URLs.** Rewire the My AIMT resource registry, in-course links, Service Timer and other paid tool routes to authenticate before fetching. The browser must attach a valid bearer token or obtain a short-lived signed URL **only after server entitlement verification**. Public marketing/sample images remain public; genuine premium lesson files move to the private bucket.
4. **Remove the public originals.** Delete premium PDFs/PNGs and complete paid HTML from the deployable repository root, review the rest of `assets/images/course/`, and verify that no public build, branch preview, `/assets/*` exception or `_redirects` rewrite still serves them. Audit GitHub public history, raw URLs and any forks/caches; establish realistic mitigation since prior public content cannot be recalled from every copy.
5. **Fail-closed deployment.** Verify Cloudflare Pages Functions routing and the **actual** Pages “fail closed” setting; a static fallback must not bypass private-content checks. Purge obsolete CDN copies once an approved release is made.
6. **Regression and release gates.** Test as anonymous, unenrolled authenticated, valid enrolled, expired-token, owner/staff account and returning paid student; direct file link, cache headers and mobile/desktop. Verify purchase, account claim, progress, Review Mode, lesson checkpoints, Cadence, service resources, completion and certificate behavior. Independently audit the built public source for premium text and asset strings. Owner approves the exact preview and merge.

## Acceptance checks — all required, currently NOT MET

- Anonymous requests to public sales page source and source-linked scripts contain no protected lessons/assessments.
- Every old premium public URL responds 403/404 (not a static cached copy); no raw public GitHub copies remain in newly published trees.
- Private API returns 401 without a valid session; 403 without entitlement; returns exact file only for an enrolled student; and never leaks a storage credential.
- Supabase RLS, Stripe payment/access, My AIMT, review mode, assessment and certificate tests are independently verified in a branch preview.
- Cloudflare fail-closed behavior and private bucket settings are observed in their respective dashboards, not inferred from code.
- Explicit Brandon approval before any merge/deployment.

## Change authority and risk

**Tier 2 / consequential:** paid content, credentials, student access and payment relationships. This PR is a proposal plus non-shipping prerequisites. No Supabase migration, GitHub visibility change, production secret write, public CDN purge, paid Meta test event or production deployment is authorized by these commits. No new external spend has been approved. Independent architecture review and a representative enrolled-student pilot are required before an actual migration.
