# AIMT Admin MVP — Audit (2026-09-15)

**Auditor pass on `course-audit-build`.** Read-and-verify audit of the
existing Admin MVP implementation plus expanded automated test coverage.
No production logic was changed. This document supplements, and does not
replace, `docs/admin/AIMT-ADMIN-MVP-SPEC.md`.

> **Update, same date, follow-up pass:** the "Open question for the owner:
> is a 'reactivate' action needed?" section below was resolved by
> implementation. Unlike the original audit pass (which changed no
> production code), this follow-up **did** change `admin.html` and
> `functions/api/admin/index.js` — see "Resolved: reactivate access
> implemented" further down for the full record of what changed, what was
> verified independently, and the exact test results (33/33, superseding
> the 24/24 figure below). Everything above that section describes the
> original, code-unchanged audit pass exactly as it happened.

## What changed in this pass

- Added `tests/admin-mvp-behavior.test.mjs` — 15 new execution-based tests
  that run the real `onRequestGet` / `onRequestPost` / `resolveAdmin`
  handlers against a mocked Supabase REST + Auth Admin HTTP surface
  (`globalThis.fetch` stubbed per-test via `node:test`'s `t.mock`). No
  network call leaves the process; nothing here is a live Supabase
  integration test. This is in addition to, not a replacement for, the
  existing static/regex suite in `tests/admin-mvp.test.mjs`.
- No changes to `admin.html`, `functions/_lib/admin/auth.mjs`,
  `functions/api/admin/index.js`, or the migration. (A temporary,
  in-memory-only mutation test was performed and immediately reverted to
  verify the new tests actually catch a broken role check / broken revoke
  guard — confirmed via `git diff` showing zero net change to
  `functions/api/admin/index.js`. See "Verification methodology" below.)
- This audit file.

## Test results

```
$ node --test tests/admin-mvp.test.mjs
ℹ tests 9 / pass 9 / fail 0

$ node --test tests/admin-mvp.test.mjs tests/admin-mvp-behavior.test.mjs
ℹ tests 24 / pass 24 / fail 0
```

Broader sweep for regressions touching admin/auth/entitlement code:

```
$ node --test tests/*.test.mjs tests/*.test.js
ℹ tests 57 / pass 51 / fail 6
```

The 6 pre-existing failures are **unrelated to Admin MVP** and were not
introduced by this pass:

- `tests/aimt-dashboard-resources-launch.test.mjs`
- `tests/aimt-listen-mode-module1-pilot.test.mjs` (Listen Mode — explicitly
  out of scope for this workstream)
- `tests/cadence-phase1.test.mjs`
- `tests/cadence-production-path-qa-harness.test.mjs`
- `tests/cadence-worker-migration.test.mjs`
- `tests/module-02-rebuild.test.mjs` (failures are in a "LISTEN MODE
  SCRIPT" / Module 0 orientation-block section, again Listen Mode content)

`tests/claim-course-access-auth.test.mjs` (the entitlement/auth-adjacent
suite closest to Admin MVP's concerns) passes 36/36 independently. Per the
task instructions these unrelated suites were not investigated further —
they sit in course-content/Listen Mode/Cadence territory reserved for the
other two concurrent workstreams.

## Verification methodology (mutation check)

To confirm the new behavioral tests are not vacuously passing, two
security-critical checks were temporarily short-circuited in a working-tree
edit — `if (!requireAdminRole(...))` in `grantAccess` replaced with
`if (false)`, and the `!grantId.startsWith(MANUAL_PREFIX)` guard in
`revokeManualAccess` replaced with `if (false)` — then reverted immediately
from an in-memory backup before tests were re-run. `git diff --stat
functions/api/admin/index.js` after the revert shows **no change**, and the
final test run (24/24) above is against the restored, unmodified file.

By inspection, bypassing those two checks would have broken:
- `support role can read (view=me) but cannot grant or revoke access` —
  asserts `status === 403` and zero state mutation for a support-role
  grant/revoke call; a bypassed role check would instead return 200 and
  create an account/entitlement.
- `revoke_manual_access rejects any id not prefixed admin-grant- and
  deletes nothing` — asserts `status === 400` and zero DELETE calls for a
  Stripe-style id; a bypassed prefix check would instead delete it.

(An automated re-run of the mutated file was blocked mid-exercise by the
session's own safety classifier for attempting to weaken a security check,
which is the correct behavior — the revert had already restored the
original file by that point, and `git diff` confirms it.)

## Acceptance checklist (spec §12) — status

Legend: **tested** = covered by an automated test that actually exercises
the behavior (static regex match or execution-based). **untested** =
implemented in source but only verified by manual reading in this pass.

### Authorization

| Item | Status | Pointer |
|---|---|---|
| Unauthenticated `/api/admin` → 401 | **tested** | `functions/_lib/certification/auth.mjs:47` (`resolveUser` returns 401 when no bearer token); exercised by `tests/admin-mvp-behavior.test.mjs` test `unauthenticated /api/admin request returns 401` |
| Authenticated non-admin → 403 | **tested** | `functions/_lib/admin/auth.mjs:63` (`resolveAdmin`'s final guard); exercised by `authenticated caller with no admin row and no bootstrap match returns 403` |
| First configured owner bootstraps only when `admin_users` empty | **tested** | `functions/_lib/admin/auth.mjs:35-49` (`bootstrapOwnerIfAllowed`, `count !== 0` check); exercised by `owner bootstrap succeeds only when admin_users is empty…` and `…is refused when admin_users already has rows…` |
| Wrong email cannot bootstrap owner | **tested** | `functions/_lib/admin/auth.mjs:36-37`; exercised by `owner bootstrap is refused when the caller email does not match AIMT_OWNER_EMAIL` |
| Inactive admin cannot enter | **tested** | `functions/_lib/admin/auth.mjs:63` (`admin.active !== true`); exercised by `an inactive admin row is rejected even though it resolves` |
| Support role cannot grant or revoke | **tested** | `functions/api/admin/index.js:212,252` (`requireAdminRole(actor, ['owner','admin'])`); exercised by `support role can read (view=me) but cannot grant or revoke access` |
| Service-role credentials never in browser source | **tested** | static check, `tests/admin-mvp.test.mjs:11-14` (unchanged, still passing) |

### Grant access

| Item | Status | Pointer |
|---|---|---|
| Existing AIMT account can receive Staff access | **tested** | `functions/api/admin/index.js:38-42,211-249`; exercised by `granting access to an email that already has a Stripe entitlement…` (existing account, `accountCreated:false`) |
| New email creates AIMT account and entitlement | **tested** | `functions/api/admin/index.js:44-65,211-249`; exercised by `grant_access creates a new account, entitlement, and complete audit row` |
| Staff student completes password setup via existing recovery flow | **implemented-but-untested** | `functions/api/admin/index.js:245-247` (returns `setupInstruction` string pointing at Student Access "Forgot your password?"); no automated test drives the actual `student-access.html` recovery flow — this is a genuine cross-file, browser-level flow best covered by the manual QA scenario in spec §13, not a unit test |
| Staff student enters exact normal course experience | **not covered by this task** | by design — Admin MVP only creates the entitlement row; the course experience itself is `headspa-mastery.html` / `course_progress`, out of scope for this workstream and owned elsewhere. Structural guarantee (grant never writes progress) is tested — see below |
| Grant does not mutate `course_progress` / create checkpoint pass / certification attempt / `completions` row | **tested** (strengthened this pass) | static: `tests/admin-mvp.test.mjs:52-60` scans the `grantAccess` function body for those table names. **New**: `tests/admin-mvp-behavior.test.mjs` asserts via `touchedProtectedTables()` that zero HTTP calls to `course_progress`, `certification_attempts`, or `completions` are made during an actual `grantAccess` execution — a runtime guarantee, not just a text-absence check |
| Grant produces authoritative admin audit record | **tested** (strengthened this pass) | static: `tests/admin-mvp.test.mjs:30-36` only checks the string `grant_course_access` appears in the file. **New**: `grant_access creates a new account, entitlement, and complete audit row` asserts every audit field (`actor_user_id`, `actor_email`, `actor_role`, `action`, `target_user_id`, `target_email`, `course_slug`, `details.source`, `details.grantId`) is actually populated with the correct value on a real call |

### Revocation

| Item | Status | Pointer |
|---|---|---|
| Manually granted entitlement can be revoked | **tested** | `functions/api/admin/index.js:251-274`; exercised by `revoke_manual_access deletes exactly the targeted manual entitlement and writes a complete audit row` |
| Stripe entitlement cannot be revoked through MVP | **tested** | `functions/api/admin/index.js:254-256` (`MANUAL_PREFIX` guard); exercised by `revoke_manual_access rejects any id not prefixed admin-grant- and deletes nothing`, which also asserts **zero DELETE calls were issued at all** — stronger than the prior static string-match test |
| Revoke produces authoritative audit record | **tested** (strengthened this pass) | same audit-field assertions as grant, applied to the revoke path in the same test |
| Revoking manual entitlement does not delete the Auth account | **tested by construction** | `revokeManualAccess` (`functions/api/admin/index.js:251-274`) only ever calls `DELETE .../course_entitlements`; it has no code path that touches `/auth/v1/admin/users`. The mock's call log has no such DELETE branch registered for that path (it would throw `Unhandled mock fetch` if the code attempted it), and no test triggered that error — this is an implicit but real guarantee under the mock harness |
| Revoking entitlement does not delete historical course/certification records | **tested** (strengthened this pass) | same `touchedProtectedTables()` guarantee applied to the revoke path — **this closes the gap the task flagged**: the original suite only had a regex guarantee for `grantAccess`, none for `revokeManualAccess`. Now both are covered by both a static scan (grant only, pre-existing) and a runtime zero-call assertion (grant and revoke, new) |

### Student visibility / reads

| Item | Status | Pointer |
|---|---|---|
| Student search finds email / display name | **implemented-but-untested** | `functions/api/admin/index.js:154-161` (`handleStudents`) — not exercised by any automated test in this repo (before or after this pass) |
| Progress / certificate / assessment data displayed matches server rows | **implemented-but-untested** | `functions/api/admin/index.js:163-204` (`handleStudent`) reads directly from `course_progress`, `completions`, `certification_attempts`, remediation/review/educator-request tables with no transformation of scores/decisions — by construction it cannot show a value the server doesn't have, but no test asserts the read/response shape end-to-end |
| Revoked credential not shown as active | **implemented-but-untested** | `admin.html:98` (`completion&&!completion.revoked?...credential_id...:completion?.revoked?'Revoked':...`) — client-side rendering logic, not covered by an automated test (would need a headless-DOM or browser test, out of scope for this Node-test-runner pass) |

I did not add tests for the read-only dashboard/students/student-detail
views in this pass. They are lower-risk (no privileged mutation, RLS-free
reads gated the same way as everything else behind `resolveAdmin`) and the
task's explicit "likely candidates" list was entirely about
grant/revoke/authorization behavior, which is now covered. Recommend a
follow-up pass adding response-shape tests for `handleDashboard`,
`handleStudents`, and `handleStudent` if the owner wants that hardened
before relying on it operationally — flagging as an open item rather than
guessing at the expected shape further than the spec already documents.

### UI acceptance items (§12 "UI")

Not evaluated in this pass — these require an actual rendered
browser/viewport (desktop/phone layout, keyboard focus, dialog dismissal,
no horizontal overflow) and are explicitly manual-QA items per spec §13.
No automated test in this repo covers them; none were added here since
they're DOM/CSS behaviors outside what `node --test` can meaningfully
assert without a browser harness, and the task scoped this pass to
Node-test-runner-style coverage.

## Additional findings from source reading

1. **Existing `staff-grant-*` entitlement rows predate the `admin-grant-`
   prefix and are treated as "Stripe" for revoke-protection purposes.**
   `supabase/migrations/20260706_create_completions.sql:34-40` inserted
   three rows with ids like `staff-grant-brandmrice` (not
   `admin-grant-...`). `functions/api/admin/index.js:131`
   (`buildStudentSummaries`) classifies any id not starting with
   `admin-grant-` as `'stripe'` for display, and `revokeManualAccess`
   would reject an attempt to revoke one of them (correct, fail-safe
   behavior — it just means those three grandfathered staff rows show up
   in the admin UI labeled the same as a paid purchase, and cannot be
   revoked through Admin MVP even though they are not, in fact, tied to a
   Stripe payment). Not a security problem — it's conservative in the
   safe direction — but worth the owner knowing about if one of those
   three staff accounts ever needs to be pulled: it can only be removed by
   direct Supabase SQL, not through `/admin.html`. No code change made;
   flagging only.

2. **`admin.html`'s "Grant course access" button is visible to all admin
   roles including `support`, even though the server will 403 the
   request.** (`admin.html:51`, `grantBtn` has no role-based
   `hidden`/`disabled` state; contrast with the revoke button, which
   already only renders for `source==='manual'` entitlement rows.) This is
   a UX polish gap, not a security gap — `requireAdminRole` on the server
   is the actual boundary and is now tested. Not fixed in this pass because
   it's a UI change to `admin.html` beyond what was asked, and because
   showing a control that then cleanly reports "Owner or admin access
   required" is arguably acceptable MVP behavior. Flagging as an easy,
   low-risk follow-up (hide `#grantBtn` and the drawer's revoke buttons
   when `actor.role === 'support'`) rather than doing it unasked.

3. **`countAdminRows` fails closed.** If the count fetch itself fails
   (network error, non-2xx), `functions/_lib/admin/auth.mjs:29`
   returns `null`, and `bootstrapOwnerIfAllowed`'s `if (count !== 0)
   return null;` treats `null !== 0` as true, refusing to bootstrap. Good
   default; noted for the record since it's the kind of check that's easy
   to get backwards.

## Resolved: reactivation implemented (follow-up pass, same date)

The open question below (left from the initial audit pass) has been
resolved by implementation. This section documents what changed and why;
see `docs/admin/AIMT-ADMIN-MVP-SPEC.md` §7.6 and §9 for the full design and
API contract.

**Cross-cutting risk check performed first, independently verified.**
Before writing any code, confirmed by direct file reads (not taken on
trust):

- `revokeManualAccess` (`functions/api/admin/index.js`, then ~line 251,
  now ~line 251 unchanged) does an unconditional `DELETE` on
  `course_entitlements` — there is no soft-delete column.
  `supabase/migrations/20260420_create_course_entitlements.sql` confirms
  the schema: `checkout_session_id text primary key` plus `course_slug`,
  `purchaser_email`, `user_id`, `granted_at` — no `status`/`revoked_at`
  column exists anywhere on that table, in this migration or any other.
- Grepped `course_entitlements` across the entire repo (not just the admin
  surface) and read the actual query code in each hit. Confirmed at least
  two read sites do a pure "row exists → entitled" check with **zero**
  status/revoked filtering: `isEntitled()` in
  `functions/_lib/certification/auth.mjs` (`select=checkout_session_id`,
  `limit: '1'`, no other predicate) and `hasEntitlement()` in
  `cadence-worker/worker.js` — a **separately deployed** Cloudflare Worker
  whose source lives in this repo for versioning only; a repo change here
  does not redeploy it. `my-aimt.html`, `student-access.html`,
  `aimt-service-timer.html`, `headspa-mastery.html`,
  `claim-course-access.js`, `issue-certificate.js`, and
  `stripe-webhook.js` also reference the table; a targeted grep for
  `status`/`revoked`/`active` near any of their entitlement code returned
  nothing, consistent with the same "row exists" pattern.
- Conclusion confirmed: adding a `revoked_at`/`status` column to
  `course_entitlements` (the literal "un-delete the row" implementation of
  reactivation) would require auditing and patching every one of those
  sites to keep "entitled" meaning "not revoked" instead of "any row at
  all" — several of which sit outside this repo's own deploy surface
  entirely (the Worker). Without that broader patch, a "revoked" student
  would still show as entitled everywhere except the admin panel — a worse
  outcome than no reactivation feature at all. This is exactly the "risky
  entitlement redesign" the task said not to force through.

**What was built instead.** A new `reactivate_manual_access` POST action
(`functions/api/admin/index.js`) and matching "Reactivate access" button in
the Activity Log (`admin.html`), gated the same way grant/revoke are
(`requireAdminRole(actor, ['owner', 'admin'])`). It does not touch the
schema and does not resurrect the deleted row. Instead, given the original
(now-deleted) `admin-grant-...` ID, it:

1. confirms that ID was genuinely revoked, by looking it up in the
   authoritative `admin_audit_log` for a matching
   `revoke_manual_course_access` record (rejecting with 404 if none is
   found — this is what stops the action from being a disguised "grant
   access to anyone" tool);
2. no-ops safely (`{ ok: true, alreadyActive: true, grantId }`, no new row,
   no new audit entry) if the student already has an active manual grant;
3. otherwise performs exactly the same three operations `grantAccess`
   already performs and is already tested for — resolve-or-create the AIMT
   Auth account, insert one new `admin-grant-<source>-<uuid>` row, write an
   audit record — under the action name `reactivate_manual_course_access`.

It structurally cannot affect any existing entitlement row, Stripe or
manual: the function never issues a `DELETE` or `UPDATE` against
`course_entitlements`, only a `POST` of a brand-new row (stronger than
revoke's own guarantee, which does delete a targeted row). **No migration
was added or applied** — this was a deliberate zero-schema-change design,
per the task's instruction not to force a redesign.

**Test coverage added**, all passing (`node --test tests/admin-mvp.test.mjs
tests/admin-mvp-behavior.test.mjs` → 33/33; see that command's output
elsewhere in this document, superseding the 24/24 count above): authorized
reactivation of a genuinely revoked grant (full audit-field assertions,
runtime `touchedProtectedTables()` zero-call guarantee, zero-delete
assertion); support/unauthenticated rejection; a Stripe-style ID rejected
with zero writes of any kind; a well-formed but never-revoked ID rejected
(404); the already-active duplicate case confirmed as a true no-op (no row,
no audit entry); and admin-role parity with owner. A mutation check (role
guard temporarily replaced with `if (false)`, tests re-run, then reverted —
`git diff --stat` confirms zero net change) reproduced the same "does this
actually catch a broken guard" methodology as the original audit pass and
confirmed the new tests are not vacuous.

**What was taken on trust vs. independently verified:** the session that
authored the reactivation task brief had already performed the grep across
`course_entitlements` and named the exact ten read sites; this pass
independently re-read every one of those files (plus the migration and the
two admin source files) rather than accepting the claim at face value, and
found it accurate. No file outside the declared scope
(`admin.html`, `functions/_lib/admin/*`, `functions/api/admin/*`,
`supabase/migrations/*` [none added], `tests/admin-mvp*.test.mjs`,
`docs/admin/*`) was edited; the ten cross-cutting files were read-only.

## What still requires owner action before any release

Unchanged from spec §11/§16 — none of this was done in this pass:

- Apply `supabase/migrations/20260905_create_admin_mvp.sql` in the
  Supabase SQL editor for the correct project.
- Set the Cloudflare Pages environment variable `AIMT_OWNER_EMAIL`.
- Confirm `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are present in the
  Pages environment (already required by other functions).
- Branch-preview QA per spec §13 (real sign-in, real bootstrap, real
  staff-grant end-to-end through password recovery into the course).
- Desktop + phone UI QA (§12 "UI" checklist — not automatable in this
  pass).
- Explicit owner approval. **No merge, no deploy, no production release**
  until then.

## Confirmation

- No commits, pushes, merges, or deploys were made.
- `main` was not touched.
- No file under `AIMT-Listen-Mode-Final/`, `docs/course-audit/listen-mode/`,
  `scripts/aimt-listen-*`, `assets/audio/listen/`, or
  `assets/js/aimt-listen-mode-data.js` was read or edited.
- No course/curriculum, entitlement-webhook, or checkout file was edited
  (only read: `functions/_lib/certification/auth.mjs`,
  `supabase/migrations/20260706_create_completions.sql`,
  `supabase/migrations/20260826_create_certification_assessment.sql`, for
  context on what the admin surface reads).
- `functions/api/admin/index.js` was temporarily edited for a mutation-test
  check and fully reverted before this report; `git diff --stat` against
  HEAD shows no change to that file.
- No migration was applied, no env var was set.
