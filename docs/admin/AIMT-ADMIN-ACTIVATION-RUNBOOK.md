# AIMT Admin — Owner Activation Runbook

**Audience:** Brandon (owner), for the first real activation of Admin MVP on
a Cloudflare Pages branch preview. This is an operational runbook, not a
design document — it describes exactly what to click/run and exactly what
the code does at each step, sourced directly from `functions/api/admin/index.js`,
`functions/_lib/admin/auth.mjs`, `functions/_lib/certification/auth.mjs`,
`admin.html`, and `supabase/migrations/20260905_create_admin_mvp.sql`.

Nothing in this runbook was executed as part of producing it. No migration
was applied, no environment variable was set, and no owner account was
bootstrapped by the session that wrote this document.

---

## 0. Before you start

- This is for a **branch preview**, not production, unless you explicitly
  intend otherwise. Cloudflare Pages branch previews get their own
  environment variable scope separate from the production (main) deployment
  — set variables on the specific preview environment you're testing.
- You will need: access to the Supabase project's SQL editor, access to the
  Cloudflare Pages dashboard for this project's environment variables, and
  an AIMT account email you're willing to bootstrap as the first owner.
  **The intended first owner is `brandon@aimtrichology.com`** — see §2.

---

## 0.1 A branch preview is NOT an isolated database — read this first

**A Cloudflare Pages branch preview only isolates the web app.** It does
not isolate the database. This repo currently points at exactly **one**
Supabase project (`aimt`) for every environment — production and every
branch preview alike. There is no separate staging Supabase project today.

This means: applying the migration (§1), bootstrapping an owner (§3/§4),
creating an AIMT account, creating an entitlement, revoking an entitlement,
reactivating one, or writing an `admin_audit_log` row from a *branch-preview*
`/admin.html` are **real, permanent mutations against the one production
Supabase project** — not sandboxed test data in some parallel database.
"Preview" in the URL describes which build of the front-end code you're
looking at, not which database it talks to.

Consequences:

- Read-only steps (SQL `select`s, the Overview/Students/Activity Log tabs,
  checking which button does/doesn't render) are safe regardless of preview
  vs. production, because they mutate nothing.
- Any **mutating** step — §1 (migration), §3/§4 (bootstrap), §8 (grant), §12
  (revoke), §13 (reactivate) — is a real production-database change the
  moment it runs, on a preview URL exactly as much as on `main`. Treat it
  with the same care as a production action, because it is one.
- A genuinely isolated Admin test (one where mutations don't touch real
  data) would require a **separate staging Supabase project**, which does
  not exist yet. Until it does, "test on the branch preview first" reduces
  *front-end* risk (bad code, a broken button, a rendering bug) but does
  **not** reduce *data* risk. Do not read this runbook's steps as if it
  does.
- "Categorization: what needs whose hands" below (bucket C especially)
  already requires the owner's explicit, in-the-moment approval before any
  mutating step — this section explains *why* that requirement applies just
  as fully on a preview as on production, and is not relaxed by the word
  "preview."

---

## 0.2 The first controlled Admin validation sequence: Brandon → Cady

This runbook's steps (§3 onward) are written generically ("the owner," "a
test account"). The intended **first real sequence**, made explicit here so
there is one unambiguous plan rather than an implied one, is:

1. **Owner** — `brandon@aimtrichology.com` bootstraps as the first `owner`
   row (§3/§4) and signs into `/admin.html`.
2. Brandon grants a **controlled staff enrollment** (`source: 'staff'`) to a
   test account referred to throughout this runbook as **"Cady"** — a
   dedicated test email Brandon controls, not a real student (§8).
3. Brandon verifies, for Cady's account specifically:
   - normal AIMT account/course access works (she can sign in via password
     recovery and land in the course, §9's live-check framing, §13 of the
     spec);
   - **zero** artificial progress exists (§10);
   - checkpoints are **not** passed (§10);
   - the final assessment/certificate remain gated exactly as for a paying
     student (§15 — verified from source/tests, not a live POST; see §15's
     own note);
   - the `admin_audit_log` entry for the grant is correct (§11).
4. Brandon **revokes** Cady's manual access (§12), then **reactivates** it
   (§13), confirming each step's audit trail and confirming Cady's access
   behaves correctly on both sides of that round-trip.

**Explicit clarification, easy to get wrong:** granting Cady a staff
enrollment through this flow does **not** make Cady an Admin. It inserts one
row into `course_entitlements` — nothing else. Adding Cady to `admin_users`
(so she could sign into `/admin.html` herself) would be a wholly separate,
later, and much more sensitive action, requiring its own explicit owner
decision — it is not a side effect of §8 and this sequence does not perform
it.

Per §0.1, every mutating step in this sequence (1, 2, and 4 above) is a real
production-Supabase mutation the moment it runs, on a preview or on
production. Nothing in this sequence was executed by the session that wrote
this document — this section only makes explicit what the first live run
should do, once the owner is ready and gives the go-ahead called for in
"Categorization: what needs whose hands" (bucket C) below.

---

## 1. Apply the migration (manual, Supabase SQL editor)

This repo never auto-runs migrations — committing
`supabase/migrations/20260905_create_admin_mvp.sql` to the repo does nothing
by itself.

1. Open the Supabase project's **SQL Editor**.
2. Paste the full contents of
   `supabase/migrations/20260905_create_admin_mvp.sql` and run it.
3. What it creates (additive only — no existing table is touched):
   - `public.admin_users` — `user_id` (PK, FK to `auth.users`), `role`
     (`owner` / `admin` / `support`, CHECK-constrained), `active` boolean
     (default `true`), timestamps. RLS is **enabled with zero client
     policies** — by design, this table is only ever read/written by the
     Cloudflare Pages Function using the Supabase **service role** key.
     There is no path for a browser to read or write this table directly.
   - `public.admin_audit_log` — the authoritative, append-only privileged
     action log (`actor_*`, `action`, `target_*`, `course_slug`, `details`
     jsonb). Same RLS posture: enabled, no client policies, service-role-only.
   - Indexes on both tables (`admin_users(active, role)`,
     `admin_audit_log(created_at desc)`, `admin_audit_log(action)`,
     `admin_audit_log(target_user_id)`) and an `updated_at` touch trigger on
     `admin_users`.
4. Confirm both tables exist (Table Editor or `select 1 from
   public.admin_users limit 1;` / same for `admin_audit_log` — both should
   return zero rows, not an error).

---

## 2. Set the server-side `AIMT_OWNER_EMAIL` environment variable

1. Cloudflare dashboard → Pages project → the **preview** environment you're
   testing (not production, unless that's deliberately what you're
   activating) → **Environment variables**.
2. Add `AIMT_OWNER_EMAIL=brandon@aimtrichology.com`. **The intended first
   owner is Brandon's AIMT account, `brandon@aimtrichology.com`** — set the
   variable to that exact value, not a placeholder. It is matched
   case-insensitively and trimmed (`normalizeEmail()` in
   `functions/_lib/admin/auth.mjs`), but set it to the real value anyway.
3. Confirm `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are already present
   on that same environment (they're required by other functions already,
   e.g. the webhook and claim endpoints — this runbook doesn't set them, only
   confirms they're there).
4. Redeploy the branch preview if the platform requires a redeploy to pick up
   new environment variables (Cloudflare Pages usually does, on the next
   build/deploy of that branch).

**Do not** set `AIMT_OWNER_EMAIL` on production/main unless you specifically
intend to bootstrap a production owner right now — see "Categorization:
what needs whose hands" (bucket B/C) and the closing section of this
runbook (corrected reference — the original draft of this document pointed
here to "§11 below", which is the audit-log verification step and contains
no such warning).

---

## 3. First-owner bootstrap — exactly what the code does

This is not a separate signup step. It happens automatically, server-side,
the first time the designated owner email hits `/api/admin` while
`admin_users` is empty. From `functions/_lib/admin/auth.mjs`
(`resolveAdmin` → `bootstrapOwnerIfAllowed`):

1. `resolveAdmin` resolves the caller's identity from the `Authorization:
   Bearer <token>` header via `resolveUser()` (a real Supabase Auth call —
   `GET {SUPABASE_URL}/auth/v1/user` with the caller's own token). No token,
   or an invalid/expired one → **401** (`"Sign in required."` /
   `"Session expired — sign in again."`), before anything else runs.
2. It looks for an existing `admin_users` row for that `user_id`
   (`readAdminRow`). If found, that row is authoritative from here on —
   bootstrap is skipped entirely.
3. If no row is found, `bootstrapOwnerIfAllowed(env, user)` runs:
   - Compares the caller's normalized email to normalized
     `env.AIMT_OWNER_EMAIL`. **Any mismatch → bootstrap refused, returns
     `null`.**
   - Calls `countAdminRows(env)` (a `HEAD`-style count against
     `admin_users` with `Prefer: count=exact`). **If the count is anything
     other than exactly `0` → refused.** This includes the fail-closed case:
     if the count query itself errors, `countAdminRows` returns `null`, and
     `null !== 0` is `true`, so it refuses rather than silently bootstrapping
     on an unknown state.
   - Only if both checks pass: inserts one `admin_users` row —
     `{ user_id: user.id, role: 'owner', active: true }` — and that row is
     what the rest of the request uses as `actor.admin`.
4. After that row exists (bootstrapped or not), the final gate is: `admin &&
   admin.active === true && allowedRoles.includes(admin.role)`. Anyone else
   (no row, inactive row, or a role not in the endpoint's allowed list) gets
   **403** (`"Admin access required."`).

**In practice:** the very first authenticated request to `/admin.html` (or
directly to `/api/admin?view=me`) from the `AIMT_OWNER_EMAIL` account, made
while `admin_users` is empty, silently creates that one owner row and lets
the request through in the same call. No separate "bootstrap" button exists
or is needed.

---

## 4. Sign in to `/admin.html`

1. Navigate to `/admin.html` on the branch preview.
2. Sign in with the email/password of the `AIMT_OWNER_EMAIL` account —
   `brandon@aimtrichology.com` (same AIMT Auth account used for
   `student-access.html` — Admin MVP reuses the same Supabase Auth, just
   gated by the `admin_users` row).
3. On success, the page calls `GET /api/admin?view=me`, which is what
   actually triggers bootstrap (step 3 above) if this is the first call.
4. If sign-in succeeds but `/api/admin?view=me` still fails, the sidebar
   won't show and the login screen reappears with the server's error
   message (`admin.html`'s `verifyAdmin()` catches any error from `api()`
   and displays `e.message` in `#loginNotice` — this is generic, so it
   surfaces whatever the server returned, not just a 403). Two distinct
   causes look identical on screen:
   - **403 "Admin access required."** — either `AIMT_OWNER_EMAIL` doesn't
     match the signed-in account's email exactly (it should be signed in as
     `brandon@aimtrichology.com`), or `admin_users` already had rows before
     this account tried to bootstrap.
   - **503 "Admin service is not configured."** — `resolveAdmin()`
     (`functions/_lib/admin/auth.mjs:52-54`) returns this immediately,
     before even checking the token, if `env.SUPABASE_URL` or
     `env.SUPABASE_SERVICE_ROLE_KEY` is missing on this environment. Unlike
     `functions/api/claim-course-access.js` and
     `functions/api/create-checkout-session.js`, the admin surface has **no
     hardcoded `SUPABASE_URL` fallback** — if you skipped confirming step 2
     item 3 on this specific preview environment, this is what you'll see.

---

## 5. Confirm the owner row exists

In the Supabase SQL editor:

```sql
select user_id, role, active, created_at from public.admin_users;
```

Expect exactly one row: `role = 'owner'`, `active = true`, `user_id`
matching the AIMT Auth user id for the `AIMT_OWNER_EMAIL` account —
`brandon@aimtrichology.com` (cross check in **Authentication → Users**).

---

## 6. Validate the Overview page

After sign-in, the Overview tab calls `GET /api/admin?view=dashboard`
(`handleDashboard` in `functions/api/admin/index.js`). It reads
`course_entitlements`, `course_progress`, `completions`,
`certification_attempts`, `certification_review_requests`,
`certification_educator_requests`, and the Auth admin user list — all
read-only, all scoped to `course_slug = 'headspa-mastery'`. Confirm:

- The five metric tiles (Enrolled, Active · 30d, Certified, Open reviews,
  Educator requests) render numbers, not an error notice.
- "Recent students" lists real students if any exist yet on this
  environment's Supabase project, or a clean "No enrollments yet." empty
  state if not — either is correct, it just reflects what's actually in the
  database for this preview/project.

---

## 7. Student lookup flow

1. Go to the **Students** tab. It calls `GET
   /api/admin?view=students&q=<term>` (`handleStudents`), matching against
   normalized email or display name, read-only, capped at 100 results.
2. Search for a known test student's email or name and confirm the row
   appears with correct Access (Paid/Manual pills), Progress %,
   Certification status pill, and Last activity date.
3. Click the student's name to open the detail drawer. That calls `GET
   /api/admin?view=student&userId=…` or `…&email=…` (`handleStudent`) and
   renders account info, entitlements, certification attempts, and
   review/remediation/educator-request history — all direct reads, no
   admin-side transformation of scores or decisions.

---

## 8. Grant Staff access to a test account

Per §0.2, this runbook refers to the test account throughout as **"Cady"**.

1. Click **Grant course access** (top right). Fill in a **test email you
   control** (Cady's) — do not use a real student's email for this
   validation pass.
2. Enrollment source: pick **Staff**.
3. Submit. This calls `POST /api/admin` with `{ action: 'grant_access',
   email, firstName, lastName, source: 'staff' }` → `grantAccess()` in
   `functions/api/admin/index.js`:
   - Requires `actor.admin.role` to be `owner` or `admin` (`requireAdminRole`)
     — **403** otherwise, checked server-side before anything else in the
     function runs.
   - Validates the email shape and that `source` is one of `staff`,
     `complimentary`, `scholarship`, `manual` — 400 otherwise.
   - `ensureAuthUser()` — finds an existing AIMT Auth account by email, or
     creates one (`email_confirm: true`, no password set).
   - Inserts exactly **one** new row into `course_entitlements`:
     `{ checkout_session_id: 'admin-grant-staff-<uuid>', course_slug:
     'headspa-mastery', purchaser_email, user_id }`. This is the **only**
     table this function writes a course-access row to.
   - Writes one `admin_audit_log` row (`grant_course_access`) via
     `writeAdminAudit()` with the full actor/target/detail fields.
4. Confirm the response notice matches: if a new account was created, it
   tells you to have the student use **Student Access → "Forgot your
   password?"** to set a password (Admin MVP never sets or exposes student
   passwords — there is no password field anywhere in `admin.html` or
   `functions/api/admin/index.js`).

**Manual-grant onboarding email — implemented and tested (correction: an
earlier draft of this section described this as a future, not-yet-landed
gap; re-reading `functions/_lib/admin/manual-grant-invite-email.mjs` and
`functions/api/admin/index.js` directly confirms it has since shipped).**
`grantAccess()` now calls `sendManualGrantInviteEmail()`
(`functions/_lib/admin/manual-grant-invite-email.mjs`) whenever — and only
whenever — the grant creates a brand-new AIMT Auth account
(`account.created === true`); a grant that binds to an existing account
never sends one (`data.inviteEmail` is `null` in that case). The email is
sent via Resend, renders the branded template at
`docs/email-templates/custom-resend/invite-manual-grant.html` (inlined into
the `.mjs` file — this repo has no build step to import HTML text at
request time), and is keyed for idempotency as `admin-grant/<grantId>`,
deduped by scanning `admin_audit_log` for a prior `grant_course_access` row
whose `details.inviteEmail.idempotencyKey` already matches with `sent:
true`, before ever calling Resend. Covered end-to-end by
`tests/admin-manual-grant-invite.test.mjs` (8 tests, all passing), which
runs the real `onRequestPost`/`grantAccess` handler against a mocked
Supabase + Resend surface — no live network call is made by that suite.
The three properties this section originally asked for are now verified,
not merely planned:

- **Entitlement creation stays independent of competency, and independent
  of the email too.** `grantAccess()` performs the `course_entitlements`
  insert (step 3 above) *before* attempting the invite send — the
  entitlement is already committed either way. Tests `granting access to
  an existing account never sends a new-account invite` and `missing
  RESEND_API_KEY is handled safely — entitlement is still created, no send
  is attempted` both assert `state.entitlements.length === 1`.
- **Sending the email never creates progress or certification state.**
  `sendManualGrantInviteEmail()` only ever calls the Resend API and reads
  `admin_audit_log` for the dedupe check — no code path into
  `course_progress`, `certification_attempts`, or `completions`. Test `the
  manual grant + invite flow never touches course_progress, completions,
  or certification_attempts` asserts `touchedProtectedTables(state)`
  deep-equals `[]`, the same guarantee §10 established for the grant path
  itself.
- **A send failure does not roll back the entitlement.** `grantAccess()`
  wraps the invite call in try/catch and never re-throws; a Resend
  rejection or a thrown network error is folded into the JSON response and
  the audit row as a `warning` field, and the entitlement is preserved
  either way. Tests `a failed Resend send preserves the entitlement and
  surfaces a warning…` and `a network-level throw from the send attempt
  also preserves the entitlement and is caught, not raised` both assert
  `state.entitlements.length === 1` alongside the failure detail.

The step-4 `setupInstruction` text (Student Access → "Forgot your
password?") is still returned in every grant response regardless of invite
outcome — it remains the actual fallback message an admin should relay to
the student if the invite email's delivery status is ever in doubt, exactly
as originally intended once the feature landed.

---

## 9. Verify a normal (unrelated) student's access is unaffected

Pick a different, pre-existing student (ideally one with real progress) and
confirm before/after the grant in step 8:

- Their `course_entitlements` row(s), `course_progress.state`, any
  `completions` row, and any `certification_attempts` rows are byte-for-byte
  unchanged — easiest check is `select updated_at` on their
  `course_progress` row before and after, or just re-open their student
  drawer in `/admin.html` and confirm nothing changed.
- This is structural, not just a spot check: `grantAccess()` performs
  exactly one Auth lookup/insert and one `course_entitlements` insert. It
  has no code path that reads or writes `course_progress`, `completions`,
  `certification_attempts`, or any other student's row — there is no
  student identifier in the function body except the one email/account being
  granted.

---

## 10. Verify ZERO artificial progress/checkpoint/certification is granted

This is the most important safety property of Admin MVP and is worth
checking directly against the test account you just granted in step 8, not
just taking the code's word for it:

- Open the test account's student drawer in `/admin.html`. **Course
  progress** should read "Not started", **Certificate** should read "Not
  issued".
- In Supabase, confirm no `course_progress` row, no `completions` row, and
  no `certification_attempts` row exists for that `user_id`. `grantAccess()`
  only ever issues one `POST` to `course_entitlements` — by construction,
  and by two layers of automated test (corrected citation — the original
  draft of this runbook misattributed these):
  - **Static scan**, `tests/admin-mvp.test.mjs:52-60` (test `Enrollment
    path does not mutate progress, attempts, or completion records`) —
    slices out the `grantAccess` function body and asserts the strings
    `course_progress`, `certification_attempts`, and `completions` do not
    appear in it at all.
  - **Runtime assertion**, `tests/admin-mvp-behavior.test.mjs:378` (inside
    test `grant_access creates a new account, entitlement, and complete
    audit row`) — `assert.deepEqual(touchedProtectedTables(state), [], …)`
    runs the real `grantAccess()` handler against a mocked Supabase REST
    surface and asserts **zero actual HTTP calls** were made to
    `course_progress`, `certification_attempts`, or `completions` during
    that real execution — not just that the source text is clean.
- The only way that test account gets real progress, a real certificate, or
  a real certification result is by actually going through
  `headspa-mastery.html` and earning it — exactly like a paying student.
  Signing them in (via password reset) and confirming they land on Module 1
  with zero progress is the strongest version of this check.

---

## 11. Verify `admin_audit_log` records the actions

After the grant in step 8:

```sql
select created_at, actor_email, actor_role, action, target_email,
       course_slug, details
from public.admin_audit_log
order by created_at desc
limit 5;
```

Expect one `grant_course_access` row with your admin account as
`actor_email`/`actor_role`, the test account as `target_email`,
`course_slug = 'headspa-mastery'`, and `details` containing `source`,
`grantId`, and `accountCreated`. This table has no client RLS policies at
all — it is written only by the server (`writeAdminAudit`) using the service
role key, so this row is authoritative, not something a browser could have
forged.

You can also confirm it in the UI: the **Activity Log** tab calls `GET
/api/admin?view=audit` and should show the same entry, with a **Reactivate
access** button next to any `revoke_manual_course_access` entry (see §13).

---

## 12. Revoke access

1. Reopen the test account's drawer (Students tab → click their name).
2. Under **Course access**, find the manual entitlement row (labeled
   "Manual / staff access") and click **Revoke manual access**. Confirm the
   browser `confirm()` dialog.
3. This calls `POST /api/admin` with `{ action: 'revoke_manual_access',
   grantId }` → `revokeManualAccess()`:
   - Two gates, not one, and they return different statuses (corrected —
     the original draft of this runbook collapsed these into one 403
     claim): `resolveAdmin()` runs first for every `/api/admin` request
     (called at the top of `onRequestPost`) and already rejects an
     unauthenticated caller with **401** before `revokeManualAccess` (or
     any action handler) is even reached. A caller with an active
     `admin_users` row whose role is `support` *does* pass `resolveAdmin`'s
     own check (its default `allowedRoles` includes `support`), reaches
     `revokeManualAccess`, and is then rejected there by the stricter
     `requireAdminRole(actor, ['owner', 'admin'])` gate — **403**. So:
     no token → 401 from `resolveAdmin`; signed in as `support` → 403 from
     `requireAdminRole` inside the handler.
   - **Rejects (400) any `grantId` that doesn't start with
     `admin-grant-`** — this is the hard boundary that makes Stripe-paid
     entitlements structurally unrevokable through this endpoint. A
     Stripe `checkout_session_id` never has that prefix.
   - Looks the row up first (404 if it's already gone), then issues exactly
     one `DELETE` against `course_entitlements` for that
     `checkout_session_id` only.
   - Writes a `revoke_manual_course_access` audit row with the same
     actor/target field completeness as grant.
   - It never touches the AIMT Auth account itself — only the entitlement
     row is deleted, the student's login and any progress/certification
     history (if they'd started using their access) stay intact.
4. Confirm: the entitlement row is gone from `course_entitlements`, the
   audit log has the new row, and — if the student had made real course
   progress before revoke — their `course_progress`/`completions`/
   `certification_attempts` rows are **still there**, untouched (revoke only
   ever deletes from `course_entitlements`).

---

## 13. Reactivate access

1. Go to **Activity Log**. Find the `revoke manual course access` entry you
   just created and click **Reactivate access**. Confirm the dialog (it
   explicitly states this creates a *new* entitlement, does not restore
   progress/checkpoints/certification, and never affects Stripe access).
2. This calls `POST /api/admin` with `{ action: 'reactivate_manual_access',
   grantId: <the original admin-grant-… id> }` → `reactivateManualAccess()`:
   - Same owner/admin gate, same `admin-grant-` prefix check as revoke.
   - Looks up the original grant **only** via `admin_audit_log` — it scans
     for a `revoke_manual_course_access` row whose `details.grantId` matches
     the id you clicked. If none is found (e.g. you tried to "reactivate" an
     id that was never actually revoked through this admin surface), it's a
     **404**, not a silent success. This is the guard that stops the action
     from being usable as a disguised "grant access to anyone."
   - If the student already has an active manual entitlement (edge case:
     someone re-granted it a different way in the meantime), it **no-ops
     safely** — returns `{ ok: true, alreadyActive: true }`, writes no new
     row and no new audit entry.
   - Otherwise it performs the exact same steps as `grantAccess()`
     (resolve-or-create the Auth account, insert **one new**
     `admin-grant-<source>-<uuid>` row, write a
     `reactivate_manual_course_access` audit row). It never resurrects the
     deleted row or its old ID — it structurally cannot `UPDATE` or `DELETE`
     `course_entitlements`, only `POST` a brand-new row.
3. Confirm: a new `course_entitlements` row exists for the student, a new
   audit row exists, and — again — no progress/completion/certification row
   was created or altered.

---

## 14. Confirm Stripe-paid entitlements are protected throughout

Cross-check against a real (or seeded test) Stripe purchase row in
`course_entitlements` (any `checkout_session_id` **not** prefixed
`admin-grant-`):

- Its student drawer shows **no "Revoke manual access" button** —
  `admin.html` only renders that button when `e.source === 'manual'`
  (derived from the `admin-grant-` prefix), so the control doesn't even
  appear for a Stripe row.
- Even if `revoke_manual_access` were called directly against that
  `checkout_session_id` (bypassing the UI), the server-side prefix check in
  `revokeManualAccess()` rejects it with 400 before any `DELETE` is issued.
- `reactivate_manual_access` has the identical prefix check, so it can't be
  pointed at a Stripe id either.
- Nothing in `grantAccess()`, `revokeManualAccess()`, or
  `reactivateManualAccess()` ever performs an `UPDATE` against
  `course_entitlements` — only `POST` (insert) or `DELETE` by exact
  `checkout_session_id`. A Stripe row is never modified in place by any
  admin action, under any code path in this file.

**Known quirk worth knowing before you test this (not a bug):** three
pre-existing `course_entitlements` rows have `checkout_session_id`s like
`staff-grant-brandmrice` — inserted directly by
`supabase/migrations/20260706_create_completions.sql`, from before the
`admin-grant-` prefix convention existed. `buildStudentSummaries()`
(`functions/api/admin/index.js`, `entitlement.checkout_session_id.startsWith(MANUAL_PREFIX)`)
classifies anything not starting with `admin-grant-` as `'stripe'` for
display and revoke-protection purposes, so these three rows show up in
`/admin.html` labeled "Stripe purchase" and — correctly, if
conservatively — **cannot** be revoked or reactivated through Admin MVP,
even though they were never a real payment. This is fail-safe, not a
defect, but it means: (a) don't be surprised if one of those three accounts
appears in Students with no visible "Revoke" button, and (b) if you want a
non-Stripe way to exercise this section's checks without touching a real
purchase, one of those three rows is a legitimate stand-in for "a
protected, non-manual entitlement" — you don't strictly need a live Stripe
checkout to validate this section.

**Also worth knowing (corrected — an earlier draft of this section
described pre-fix behavior):** the **Grant course access** button in
`admin.html` is now *hidden* for a `support`-role actor, not merely
disabled after the fact. `canMutate()` (`admin.html`:
`function canMutate(){return !!(actor&&actor.role!=='support');}`) gates
`$('grantBtn').style.display`, and the identical guard hides the student
drawer's "Revoke manual access" button and the Activity Log's "Reactivate
access" button. If you sign in as a `support`-role test account, **none**
of the three mutation controls should render at all — confirm this
visually as part of §4, since it's now a UI-correctness property worth
checking, not an accepted rough edge. Static coverage:
`tests/admin-mvp.test.mjs` ("Support role does not see
grant/revoke/reactivate mutation controls…") asserts the `canMutate()`
gating is present in the markup for all three controls.

This is UX polish only — the **server-side**
`requireAdminRole(actor, ['owner', 'admin'])` check
(`functions/api/admin/index.js`, checked first in `grantAccess()`,
`revokeManualAccess()`, and `reactivateManualAccess()`) remains the actual
authorization boundary regardless of what the UI shows or hides. This is
proven independently of the UI by `tests/admin-mvp-behavior.test.mjs`
("support role can read (view=me) but cannot grant or revoke access"),
which calls the real handlers directly — bypassing `admin.html` entirely —
and asserts a 403 and zero state mutation. If a mutation control is ever
visibly rendered for a support-role sign-in on a live environment, treat
that as a real UI bug to report, not as expected behavior the server will
"catch anyway."

---

## 15. Confirm certification/credential issuance stays gated regardless of admin grants

This is not exercised by any step above, but it's the single most important
guarantee for the whole feature: an admin grant must never be a backdoor to
a real credential. Verified directly against `functions/api/issue-certificate.js`
(`POST /api/issue-certificate`, called from `headspa-mastery.html`, not from
`admin.html` — Admin MVP has no code path that calls this endpoint or writes
to `completions` at all):

1. **Entitlement check** (line 84-94): any row in `course_entitlements` for
   this user/email satisfies this gate — an admin-granted row and a Stripe
   row are equally valid here, by design (both mean "enrolled"). This gate
   alone proves nothing about completion.
2. **Idempotency check** (line 96-113): if a non-revoked `completions` row
   already exists, it's returned as-is. Admin MVP never creates a
   `completions` row (§10 above), so this cannot trigger from an admin
   grant.
3. **Real progress gate** (line 115-130): reads `course_progress.progress_score`
   server-side and requires `>= 1200` (all modules 0-11 complete). Admin MVP
   never writes `course_progress` (§9, §10). A freshly admin-granted account
   has no `course_progress` row at all, so `score` defaults to `0` and this
   returns **409** ("Course not yet complete…").
4. **Real certification-exam gate** (line 132-151): separately requires a
   `certification_attempts` row with `certification_decision = 'pass'`,
   computed server-side by `functions/api/certification/finalize-assessment.js`
   from the student's actual exam responses — never trusted from the client.
   Admin MVP never writes `certification_attempts` (§9, §10), so a
   freshly-granted account has none, and this returns **409** even if
   `course_progress` were somehow non-zero.

**Conclusion, verifiable from source alone:** an admin grant satisfies gate
1 and nothing else. Gates 3 and 4 can only ever be satisfied by the student
actually completing modules and passing the Module 12 assessment through
`headspa-mastery.html` — exactly the check already described in §10.

**This runbook deliberately does not include a live `POST
/api/issue-certificate` attempt as a verification step, and that is a
correction from an earlier draft.** An earlier version of this document
treated that call as safe/read-only on the theory that it's "expected to
fail with 409 either way." That reasoning is wrong: `/api/issue-certificate`
is a real mutating endpoint that can create certificate/completion state if
its gates unexpectedly pass (a bug, a race, a data mismatch, a future
regression in any of the four gates above) — there is no version of "attempt
a POST to a certificate-issuing endpoint" that is passive by construction,
so it must never be categorized as read-only/low-risk. Between (a) omitting
the live POST entirely and relying on source-reading + the existing
automated test suite + UI gating, or (b) keeping it behind explicit owner
approval and a freshly-confirmed-locked-out test account, this runbook
chooses **(a)**: the four-gate walkthrough above is fully verifiable from
source alone (§9/§10's static-scan-plus-runtime-zero-call test coverage
already proves gates 3 and 4 can never be satisfied by an admin grant), so a
live POST adds confirmatory value that doesn't justify the risk of a
mutating call against real Supabase data (see §0.1). If a live check of this
gate is ever wanted, it should be a deliberate, separately-approved QA step
against `functions/api/issue-certificate.js` directly — not folded into this
runbook as if it were routine verification.

---

## Categorization: what needs whose hands

**A. Read-only / passive verification — safe regardless of preview vs.
production, because these steps only ever read whatever Supabase project
this environment points at (per §0.1, there is only one), never write to
it. Doable without asking first once §1-§2 are already done:**
- §4 (signing in with the owner's own credentials — a login, not a
  mutation of any admin-owned data).
- §5, §6, §7, §9, §11, §14 as **read/inspection** steps (SQL `select`
  queries, the Overview and Students tabs, the Activity Log tab, checking
  which button does/doesn't render).
- §10 and §15 as **inspection** steps — reading the student drawer,
  reading `course_progress`/`completions`/`certification_attempts` rows to
  confirm they're empty. **Correction from an earlier draft:** §15's *live*
  `POST /api/issue-certificate` attempt is intentionally **not** listed
  here, and is not part of this runbook at all — see §15's own note on why
  a live POST to a certificate-issuing endpoint can never be categorized as
  passive/read-only, regardless of how confident the gate walkthrough is.
- Reading/reviewing this runbook, the migration file, and the source it
  cites — pure inspection, zero side effects.

**B. Affects production Supabase/environment — owner's own hands, not an
agent's, regardless of preview vs. production:**
- §1 — applying `supabase/migrations/20260905_create_admin_mvp.sql` in the
  Supabase SQL editor. This repo never auto-runs migrations (see
  `CLAUDE.md`); no agent session can or should do this.
- §2 — setting `AIMT_OWNER_EMAIL` (to `brandon@aimtrichology.com` — the
  intended first owner) and confirming `SUPABASE_URL` /
  `SUPABASE_SERVICE_ROLE_KEY`, in the Cloudflare Pages dashboard, for
  **any** environment, preview or production. Environment variables are
  outside this repo and outside what a coding session can set.
- Repeating §1-§2 against **production** (main) specifically, once the
  owner is ready to go live with Admin MVP for real.

**C. Requires the owner's explicit, in-the-moment approval before
proceeding, even on a preview environment and even against a
throwaway/test account — these are real mutations, not reads:**
- §3/§4 — the actual first-owner bootstrap. It happens automatically on
  the first authenticated request from the `AIMT_OWNER_EMAIL` account
  while `admin_users` is empty (§3 explains the exact mechanism) — but
  that first request should be made deliberately by the owner signing in
  themselves, not triggered on their behalf, since it permanently
  determines which account becomes `owner` for that Supabase project.
- §8 (grant), §12 (revoke), §13 (reactivate) as **action** steps — each
  one creates or deletes a real row (a real AIMT Auth account, a real
  `course_entitlements` row, a real `admin_audit_log` row) in whatever
  Supabase project this is pointed at. Using an obviously-fake-looking
  test email (§8 step 1) makes the *consequences* low-risk and reversible,
  but it is not, on its own, the owner's authorization to proceed — get an
  explicit "go ahead, use test account X" before each one, every time.
- Anything that would touch a **real student's** account, entitlement, or
  progress data, on any environment — this runbook's checks are designed
  to use throwaway test accounts specifically so this never comes up, but
  if a step ever seems to require touching a real student row, stop and
  ask first.
- Any repetition of this runbook against **production** — see the closing
  section below; this is called out again deliberately because it's the
  one mistake that can't be undone by re-running a migration.

---

## 16. Post-activation verification sequence (in order)

A consolidated, checkable walk-through — each item cites the exact code
that provides the guarantee, or says plainly that it needs a live
environment to confirm. All of these assume §1-§2 (bucket B, owner-only)
are already done on the environment under test.

1. **Sign into `/admin.html`** — §4. Needs a live environment; code path is
   `admin.html`'s login form → `supabaseClient.auth.signInWithPassword()` →
   `verifyAdmin()`.
2. **Confirm owner authorization succeeded** — §3, §5. Code-verifiable
   mechanism: `resolveAdmin()` → `bootstrapOwnerIfAllowed()`
   (`functions/_lib/admin/auth.mjs:35-49`), covered by 5 passing tests
   (owner-bootstrap success/refused-nonempty/refused-wrong-email, plus the
   fail-closed `count !== 0` behavior). Confirming a **specific** account
   actually became owner on a **specific** Supabase project needs the live
   `select … from public.admin_users` query in §5 — not verifiable from
   source alone.
3. **Overview page loads with real data** — §6. Code:
   `handleDashboard()` (`functions/api/admin/index.js:137-152`), read-only
   against 6 tables + Auth admin list. No automated test exercises this
   view's response shape today (flagged as an open item in
   `docs/admin/AIMT-ADMIN-MVP-AUDIT-2026-09-15.md`, "Student visibility /
   reads" table) — needs a live check.
4. **Student search works** — §7. Code: `handleStudents()`
   (`functions/api/admin/index.js:154-161`). Also untested by automation
   today (same audit-doc caveat) — needs a live check.
5. **Granting Staff access to a test account works** — §8. Fully
   code-verified: `grantAccess()` logic + `tests/admin-mvp-behavior.test.mjs`
   test `grant_access creates a new account, entitlement, and complete
   audit row` (asserts the created account, the single entitlement row, and
   every audit field). Still worth one live run to see the real UI/response
   text end to end.
6. **An ordinary/untouched student account's access is completely
   unaffected** — §9. Code-verified by construction: `grantAccess()`
   (`functions/api/admin/index.js:211-249`) contains no reference to any
   other user's identifier, and touches exactly `course_entitlements` (one
   insert) and `admin_audit_log` (one insert) — nothing else. No dedicated
   automated test targets a *second, unrelated* account specifically
   (the existing tests check the granted account only), so a live
   before/after check on a real second student, per §9, is the only way to
   confirm end to end.
7. **Granting access creates ZERO artificial module/checkpoint
   completion or progress** — §10, and now also §15's gate walkthrough.
   Strongest guarantee in this whole runbook: both a static source scan
   (`tests/admin-mvp.test.mjs:52-60`) **and** a runtime zero-HTTP-call
   assertion (`tests/admin-mvp-behavior.test.mjs:378`,
   `touchedProtectedTables(state)` deep-equals `[]`) confirm `grantAccess()`
   never touches `course_progress`, `certification_attempts`, or
   `completions`. Fully code-verifiable; a live drawer/SQL check (as §10
   describes) is confirmatory, not load-bearing.
8. **Certification/credential issuance remains correctly locked/gated
   regardless of admin grants** — §15. Fully code-verifiable from
   `functions/api/issue-certificate.js`'s four sequential gates,
   cross-referenced against what Admin MVP does and does not write, plus
   the existing automated test coverage referenced in §9/§10. This runbook
   deliberately does not call for a live `POST /api/issue-certificate`
   attempt (see §15's note) — that call is a real mutation, not a passive
   check, so it is out of scope here rather than treated as routine
   verification.
9. **An `admin_audit_log` row was written for the grant action** — §11.
   Code-verified: `writeAdminAudit()` call inside `grantAccess()`
   (`functions/api/admin/index.js:233-238`), asserted field-by-field by the
   same behavioral test named in item 5. Live confirmation is the SQL
   query / Activity Log tab in §11.
10. **Revoke works** — §12. Code-verified: `revokeManualAccess()`
    (`functions/api/admin/index.js:251-274`) plus tests
    `revoke_manual_access deletes exactly the targeted manual entitlement
    and writes a complete audit row` and `…rejects any id not prefixed
    admin-grant- and deletes nothing` (the latter asserts zero DELETE calls
    for a non-manual id). Live click-through per §12 confirms the UI path.
11. **Reactivate works** — §13. Code-verified:
    `reactivateManualAccess()` (`functions/api/admin/index.js:291-364`) plus
    5 tests covering success, the 404-if-never-revoked guard, the
    Stripe-id rejection, and the already-active no-op. Live click-through
    per §13 confirms the UI path.
12. **A real Stripe-paid entitlement cannot be destroyed or downgraded by
    any admin action** — §14. Code-verified across all three mutating
    actions: `grantAccess()` only ever `POST`s a new row (never touches an
    existing one); `revokeManualAccess()` and `reactivateManualAccess()`
    both hard-require `checkout_session_id`/`grantId` to start with
    `admin-grant-` before doing anything, rejecting with 400 otherwise; no
    function in `functions/api/admin/index.js` ever issues a `PATCH`/
    `UPDATE` against `course_entitlements` under any code path (confirmed
    by grep — the only verbs used against that table across all three
    functions are `POST` and one targeted `DELETE` in `revokeManualAccess`
    alone). This is a source-level guarantee, not just a test result — the
    absence of an `UPDATE` code path is structural. Live confirmation (no
    "Revoke" button rendered for a Stripe/legacy row, per the §14 note on
    the three grandfathered `staff-grant-*` rows) is confirmatory only.

---

## What this runbook intentionally does not cover

- Desktop/phone UI QA (layout, focus order, dialog dismissal) — manual,
  out of scope here, tracked separately per spec §12/§13.
- Production activation — this runbook is written for a branch preview.
  Repeat only intentionally, on production, following the same steps, with
  full owner awareness that step 1 (migration) and step 2 (env var) are
  irreversible-in-effect once real accounts start relying on them.
- Anything about Cadence, Listen Mode, or course content — entirely
  unrelated systems.
