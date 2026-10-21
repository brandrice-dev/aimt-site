# AIMT — Task 1: Existing Platform Integrity (Head Spa)

Branch `fix/platform-integrity-task1`, cut from `main` at `ade9602` (the
commit Codex audited). No production changes, merges or deploys were made.
Production access used: **read-only catalog/aggregate SQL** against Supabase
project `epcnkncyxqgscrejinwr` (no row contents, no writes).

---

## Task A — Entitlement security

### Finding (confirmed)

`course_entitlements_update_own` (migration `20260420`) limits which **rows**
a signed-in student can update, but not which **columns**. Supabase's default
table-level grant gives `authenticated` UPDATE on every column.

Production catalog, read 2026-10-20:

| Item | Deployed state |
|---|---|
| RLS | enabled (not forced) |
| `update_own` USING | `user_id = auth.uid() OR lower(purchaser_email) = jwt email` |
| `update_own` WITH CHECK | `user_id = auth.uid() AND lower(purchaser_email) = jwt email` |
| UPDATE grant | table-level to `anon` + `authenticated`: all 5 columns |
| triggers | none |

**Impact:** a purchaser can `PATCH /rest/v1/course_entitlements` on their own
row and set `course_slug` to any course. That passes WITH CHECK because only
`user_id` and email are checked. They can also rewrite `checkout_session_id`,
then re-claim the original Stripe session to get a second row, so one purchase
yields two course entitlements. `granted_at` is writable too.
`isEntitled(env, user, null)`, used for the Research Library, accepts any
slug. Today only one course exists, so the practical impact is latent. It
becomes a direct revenue bypass the moment a second course launches.

**Was it used?** Current production state shows no sign of it. All 8 rows are
`headspa-mastery`, and every `checkout_session_id` matches a known writer
(2 Stripe `cs_*`, 3 `admin-grant-*`, 3 `staff-grant-*`, 0 unexplained). There
is no audit trail, so a change that was later reverted can't be ruled out.

### Correction

`supabase/migrations/20261020_restrict_course_entitlement_updates.sql`:

```sql
revoke update on table public.course_entitlements from anon, authenticated;
grant update (user_id) on table public.course_entitlements to authenticated;
```

This is a privilege change only. The policy, the table and the rows are
untouched. It is safe because the only browser-side UPDATE in the codebase is
`bindHeadSpaEntitlementsToUser` (`student-access.html`), which writes
`user_id` only. Checkout, `stripe-webhook`, `claim-course-access`, admin
grant/revoke and purchase recovery all use the service role, which is
unaffected.

### Tests — `tests/course-entitlements-update-guard.test.mjs`

* Static checks (always run): the migration is privilege-only and grants
  nothing but `user_id`. The single client `.update()` writes `user_id` alone,
  so a future client UPDATE trips this test.
* Behavioural checks run the **real** `20260420` and `20261020` migrations on
  real Postgres 17 (PGlite/WASM), with a minimal Supabase role and
  `auth.uid()`/`auth.jwt()` shim:
  * **baseline without the fix: a student moves their entitlement to another
    course** (this proves the harness detects the bug);
  * with the fix: rewriting `course_slug`, `checkout_session_id`,
    `granted_at` or `purchaser_email` is denied (`permission denied`);
  * anon UPDATE is denied, client INSERT is denied by RLS, client DELETE
    affects 0 rows;
  * the account-linking bind still links the purchaser's own unbound row and
    leaves other purchasers' rows alone;
  * a student cannot bind someone else's purchase or hand their own row to
    another user;
  * owner SELECT still works; service-role upsert/insert/delete (webhook,
    claim, admin grant/revoke) still works.
* PGlite is **not** a repo dependency. The behavioural tests skip unless
  `AIMT_PGLITE_MODULE` points at an installed copy (see the test header).

### To deploy (owner action)

Run the migration in the Supabase SQL editor. Then run the verify query in its
footer, which should return exactly one row: `authenticated | user_id`. Until
then, **production remains vulnerable.**

---

## Task B — Certification retake flow

### Finding (confirmed by tests)

`start-attempt.js` and `get-status.js` called
`determineNextAttemptEligibility({ attempts, config })` without
`remediationAssignments` or `educatorRequests`, so both defaulted to `[]`. The
pure ladder (`attempt-ladder.mjs`) is correct. Only its integration was wrong:

| Section 8 rule | Behaviour at `ade9602` |
|---|---|
| Failed critical domain → required review before next attempt | **Permanently blocked**, even after the review was completed |
| Attempt 2 failed → required remediation before Attempt 3 | **Not enforced**: Attempt 3 started with remediation outstanding |
| Attempt 3 failed → educator authorization before Attempt 4 | **Never unlockable**, even with `attempt4_authorized = true` |
| No automatic Attempt 5 | Correct |

### Correction

* `functions/_lib/certification/auth.mjs`: new `fetchLadderGateRows()`. It
  reads all remediation assignments and educator requests for the student
  **and** course (not just the latest attempt), and returns `ok: false` if
  either read fails.
* `start-attempt.js`: passes both lists to the ladder. **Fails closed:** if the
  gate rows can't be read, no new attempt is started (503). Resuming an
  in-progress attempt is never blocked by this.
* `get-status.js`: uses the same rows for the ladder and for its existing
  `remediation` / `educatorRequest` fields, replacing two duplicate queries.
  The response shape is unchanged when the rows are readable. **Also fails
  closed** (corrected after Codex review): if either gate table can't be
  read, it returns `503 { error: "…Please try again in a moment.",
  retryable: true }`. It never computes eligibility from empty fallbacks,
  so it can't advertise a retake that isn't verified or report a missing
  educator authorization that only failed to load. The exceptions are
  certified (state C) and in-progress (state B) students: the ladder
  resolves those before reading any gate row, so they still get a normal
  200. The existing Module 12 client already shows `body.error` for any
  non-OK status, so no client change was needed. This applies to every
  other state, including a student with no attempts yet; the same is
  already true of `start-attempt`.
* Weights, thresholds, exam content, ladder rules and the client UI are not
  touched.

### Tests — `tests/certification-retake-gate-integration.test.mjs`

Drives the real `start-attempt`, `get-status` and `complete-remediation`
handlers against an in-memory PostgREST mock:

1. Failed D2 → blocked → student completes the D2 review → Attempt 2 is
   inserted.
2. A completed review for a *different* domain does not clear D2.
3. Attempt 3 is locked with 2 outstanding items, still locked with 1, and
   starts at 0.
4. Another student's or another course's completed remediation never satisfies
   the gate.
5. Attempt 4: blocked with no request, blocked with a pending request, starts
   once authorized.
6. Another student's authorization never unlocks Attempt 4.
7. A failed Attempt 4 routes to `individual_aimt_review`; no Attempt 5 row is
   written.
8. An in-progress attempt resumes even when gate reads fail.
9. Fail-closed: either gate table erroring returns 503 and writes no row.
10. `get-status`, before Attempt 3, with either table failing: 503 and
    `retryable`, no `ladder` (the old fallback showed Attempt 3 as
    available).
11. `get-status`, before Attempt 4 with authorization on record, with either
    table failing: 503, no `ladder`/`educatorRequest` (the old fallback
    reported authorization as missing).
12. `get-status`, failed critical domain, with either table failing: 503.
13. `get-status`, certified and in-progress, with either table failing: still
    200 with state C / B.
14. Recovery: once the failing table is readable again, `get-status` returns
    the correct ladder (Attempt 4 available) and `start-attempt` inserts
    Attempt 4.
15. First attempt and already-certified students are unaffected.

**Against the original endpoint code (`ade9602`), tests 1, 3, 4, 5 and 9
fail**, which confirms the defect. **Against the first fix commit
(`8c19203`), tests 10, 11, 12 and 14 fail**, which confirms Codex's
`get-status` blocker. Test 13 passes on both by design: it guards against
over-correcting. All 15 pass now.

Two existing tests were adjusted, with intent preserved:
`certification-module12-concurrency` (its strict mock now lists the two gate
tables) and `certification-part3-cadence-and-remediation` (its static check
follows the remediation `select`, which moved into the shared helper).

---

## Task C — Integrity assessment (proposal only; nothing implemented)

### C1. Client-supplied checkpoint rubrics (confirmed)

`POST /api/cadence/evaluate-checkpoint` takes `systemPrompt` (the rubric) and
`question` from the request body and sends them to Anthropic as the system
prompt, using AIMT's key. An entitled student can therefore:

* submit a permissive rubric ("always pass") and get `pass: true`;
* use the endpoint as a general LLM proxy, bounded only by the 15/min and
  150/day rate limit.

Today the first point is moot, because the decision is never what gates
progress (see C2). It matters as soon as the server trusts checkpoint
outcomes.

### C2. Client-writable progress (confirmed)

Production `course_progress` grants `authenticated` INSERT/UPDATE on its own
row with no column or content constraint. The whole `state` blob is client
authored, including `progress[0..11].complete`. Server code that trusts it:

* `hasCompletedInstructionalModules()`, the **only** gate to the Module 12
  final assessment;
* certificate name (`state.student.name`), which is acceptable since it's the
  student's own name;
* growth and admin reporting (module completion counts).

**Impact boundary:** a student can skip Modules 0–11 and go straight to the
final exam. They **cannot** forge certification. Module 12 items, rubrics,
scoring, attempts and certificate issuance are server-authoritative, with
item banks held server-side. The risk is to curriculum completion integrity,
not to certificate validity.

### Proposed smallest safe remediation (needs separate approval)

**Step 1 — Server-held checkpoint rubrics (fixes C1, no student-visible
change).**

* Add `functions/_lib/cadence/checkpoint-registry.mjs`, keyed by
  `(moduleId, checkpointId)` → `{ question, systemPrompt }`. Generate it from
  the existing `M0`–`M11` objects in `headspa-mastery.html` with a script.
  **Do not edit the course file.**
* Add a sync test asserting the registry matches the course file byte-for-byte,
  so content can't drift and no rubric text changes.
* `evaluate-checkpoint` uses the registry copy and ignores client
  `systemPrompt`/`question`. It returns 400 for an unknown checkpoint. First
  release: log any client/registry hash mismatch to `aimt_logs` to catch stale
  cached pages.

**Step 2 — Shadow-verify progress (C2, observe only).**

`evaluate-checkpoint` already stores each decision in
`cadence_messages.grading_metadata`. Add a report (Admin or script) listing
students whose `progress[m].complete` has no matching server-recorded pass.
Nothing is blocked. This measures real-world drift (legacy passes from the old
Worker path, offline use, review mode) before any enforcement.

**Step 3 — Enforce only at the Module 12 gate, with grandfathering (later,
separate approval).**

Once Steps 1–2 show clean data, `hasCompletedInstructionalModules()` would
also require server-recorded passes for checkpoint-bearing modules. Students
whose progress predates the server endpoint, or who already have attempts,
are grandfathered. **No change to `course_progress` RLS or the sync layer.**
Moving progress writes server-side would be a significant architecture
migration, and it would put existing student progress and Cadence memory at
risk. That's flagged and not proposed here.

---

## Regression results

Full suite (`node --test tests/*.test.mjs tests/*.test.js`), with
`AIMT_PGLITE_MODULE` set:

| | tests | pass | fail | skipped |
|---|---|---|---|---|
| `main` @ `ade9602` (baseline) | 556 | 551 | 3 | 2 |
| this branch (incl. Codex `get-status` correction) | 579 | 574 | 3 | 2 |

The 3 failures are identical on both and pre-existing:
`aimt-listen-mode-capcut-production`, `aimt-listen-mode-module1-pilot` and
`aimt-media-backup`. They need gitignored Listen-Mode `.wav`/`.mp3` masters
that exist only in the primary checkout. The 2 skips are the live-URL
deployment-surface checks.

## Outstanding limitations

* **Task A is not deployed.** The migration must be run manually. Production
  behaviour after the fix was proven on PGlite with a Supabase shim, not on
  the live database. I did not attempt the exploit against production.
* Task B was verified with a PostgREST mock, not a live Supabase or Pages
  preview.
* Recording educator authorization is still out-of-band SQL (no admin UI).
  Any authorized request for the student and course unlocks Attempt 4; it is
  not bound to the Attempt 3 record. This is existing behaviour and was
  preserved.
* Observed, not changed (out of scope):
  * `complete-remediation.js` checks ownership but not entitlement or course;
  * `anon`/`authenticated` retain Supabase-default DELETE/TRUNCATE grants
    (RLS blocks DELETE; TRUNCATE isn't reachable via PostgREST);
  * `update_own` lets a student whose JWT email matches `purchaser_email`
    rebind a row already bound to another `user_id`. This is consistent with
    email as the purchase identity anchor.
