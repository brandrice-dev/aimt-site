# AIMT Admin MVP — Implementation Specification

**Project:** American Institute of Modern Trichology (AIMT)  
**Repository:** `aimt-site`  
**Branch:** `course-audit-build`  
**Production branch:** `main`  
**Status:** Implemented on audit branch — requires migration/env setup and manual QA before any production release  
**Purpose:** Secure owner-operated control plane for student access, enrollment, progress visibility, certification operations, account support, and auditable manual actions.

---

## 1. Product decision

AIMT needs a real administrative control plane rather than operational work being performed directly in Supabase or by editing Stripe-dependent records.

The governing separation is:

- **Authentication** determines who the person is.
- **Entitlement** determines which course the person may access.
- **Payment** is one source of entitlement, not the definition of entitlement.
- **Competency** determines whether the student becomes certified.

Therefore an employee, scholarship student, complimentary student, or manually enrolled student may receive the same HeadSpa Mastery learning experience without a Stripe payment, while still being required to complete the same modules, checkpoints, final assessment, and certification standard.

Admin enrollment must never be equivalent to certification.

---

## 2. Existing AIMT architecture confirmed before implementation

The MVP was designed against the actual `course-audit-build` implementation.

Existing system components preserved:

- Supabase Auth for student identity and sessions.
- `student-access.html` for returning-student sign-in and password recovery.
- `course_entitlements` for HeadSpa Mastery access.
- `course_progress` for synced course progress.
- `completions` for server-authoritative credential records.
- `certification_attempts` and related remediation/review tables for Module 12.
- server-side certificate issuance.
- existing Stripe checkout and webhook flow.
- existing student dashboard `my-aimt.html`.

Important existing behavior:

`20260706_create_completions.sql` already implemented staff course access by inserting staff rows into `course_entitlements`. The Admin MVP formalizes that practice through a secure interface rather than inventing a parallel access system.

---

## 3. Non-negotiable boundaries

- Work only on `course-audit-build` until explicit release approval.
- Do not merge or deploy to `main` as part of Admin MVP implementation.
- Do not change approved curriculum.
- Do not change checkpoint questions or rubrics.
- Do not change module completion/gating rules.
- Do not change Module 12 scoring thresholds or attempt logic.
- Do not allow an admin enrollment action to create course progress.
- Do not allow an admin enrollment action to pass checkpoints.
- Do not allow an admin enrollment action to issue a certificate.
- Do not expose Supabase service-role credentials to the browser.
- Do not trust the existence of `/admin.html` as authorization.
- Privileged authorization must occur server-side on every admin API request.
- Paid Stripe entitlements may not be revoked through Admin MVP v1.
- Admins must never be able to view or set a student's existing password.

---

## 4. MVP files

Implemented files:

- `admin.html`
- `functions/_lib/admin/auth.mjs`
- `functions/api/admin/index.js`
- `supabase/migrations/20260905_create_admin_mvp.sql`
- `docs/admin/AIMT-ADMIN-MVP-SPEC.md`

No production deployment is authorized by the presence of these files.

---

## 5. Admin authorization model

### 5.1 Authentication

Admin users sign in with the same Supabase Auth identity system already used by AIMT students.

There is no second password database and no hardcoded admin password.

### 5.2 Authorization

A new server-authoritative table is introduced:

`public.admin_users`

Fields:

- `user_id`
- `role`
- `active`
- `created_at`
- `updated_at`

Allowed roles:

- `owner`
- `admin`
- `support`

The table has RLS enabled and intentionally has no client policies. Browser code cannot use the anon/authenticated role to enumerate or modify admin principals.

Every request to `/api/admin`:

1. receives the user's Supabase bearer token;
2. resolves that token server-side against Supabase Auth;
3. reads the corresponding `admin_users` row using the service role;
4. rejects inactive or unauthorized callers;
5. applies action-specific role checks.

### 5.3 First-owner bootstrap

The public repository must not hardcode the owner's email.

The first owner may be bootstrapped only when both conditions are true:

1. `admin_users` contains zero rows; and
2. the authenticated caller's normalized email exactly matches the server-side environment variable `AIMT_OWNER_EMAIL`.

The server then creates the first `owner` row.

Once any `admin_users` row exists, the environment variable alone no longer grants access.

### 5.4 Role permissions in MVP

**Owner**

- view dashboard
- view students
- view detailed student/course/certification state
- grant manual course access
- revoke admin-created manual access
- read privileged audit history

**Admin**

- same operational permissions as Owner in MVP
- cannot bootstrap ownership

**Support**

- read dashboard/student/audit information
- cannot grant or revoke course access

Future role-management UI is deferred.

---

## 6. Audit model

Existing `aimt_logs` is not authoritative enough for privileged actions because the current table intentionally accepts client-originated inserts.

Admin MVP therefore creates:

`public.admin_audit_log`

It is service-role-only and records:

- actor user ID
- actor email
- actor role
- action
- target user ID
- target email
- course slug
- structured details
- timestamp

MVP privileged actions logged:

- `grant_course_access`
- `revoke_manual_course_access`
- `reactivate_manual_course_access` (added when reactivation shipped — see
  §7.6/§9; same service-role-only `admin_audit_log` path, no schema change)

Future admin writes must use the same privileged audit path.

---

## 7. Enrollment architecture

### 7.1 Stripe remains unchanged

Paid students continue through the existing Stripe purchase/claim path.

The Admin MVP does not edit:

- Stripe sessions
- Stripe webhook behavior
- `claim-course-access.js` purchase verification
- paid checkout requirements for normal public enrollment

### 7.2 Manual enrollment

Admin-created enrollments are inserted into the existing `course_entitlements` table because the current student experience already uses that table as the access authority.

The generated entitlement ID uses a reserved prefix:

`admin-grant-<source>-<uuid>`

Allowed manual sources:

- `staff`
- `complimentary`
- `scholarship`
- `manual`

The source is retained in the synthetic entitlement ID and in the authoritative admin audit log.

### 7.3 Account creation

When granting access:

1. Admin enters email and optional first/last name.
2. Server searches Supabase Auth for the email.
3. If an AIMT account already exists, the entitlement binds to that account.
4. If no account exists, the server creates a confirmed AIMT Auth account with no admin-visible password.
5. The entitlement binds to the created user ID and email.

For a newly created staff/manual account, the admin interface instructs the user to go to Student Access and use **Forgot your password?** to establish their password.

This preserves the existing AIMT password-recovery flow and avoids exposing temporary passwords.

### 7.4 Manual revocation

MVP supports deletion only of entitlement IDs beginning with `admin-grant-`.

A Stripe-created entitlement is protected from Admin MVP revocation even if an admin attempts to submit its ID manually.

Reason: access revocation for paid purchases has refund, dispute, legal, and support implications and should be designed separately.

### 7.5 Certification eligibility

Manual enrollment does not alter certification eligibility standards.

The student must still complete the actual instructional-module gates and the server-authoritative final assessment before certificate issuance.

### 7.6 Manual reactivation

**What this is not:** `course_entitlements` has no soft-delete column
(`revoked_at`/`status`) — revocation is a hard `DELETE` (see §7.4). At least
ten other read sites across the codebase (`my-aimt.html`,
`student-access.html`, `aimt-service-timer.html`, `headspa-mastery.html`,
the separately-deployed `cadence-worker/worker.js`,
`functions/_lib/certification/auth.mjs`, `claim-course-access.js`,
`issue-certificate.js`, `stripe-webhook.js`) read that table as pure "a row
exists → the student is entitled," with no status filtering anywhere. Adding
a soft-delete column would require auditing and patching every one of those
sites — several outside this repo's own deploy surface — to keep meaning
"not revoked" instead of "any row at all." Until/unless that broader
migration is deliberately undertaken, Admin MVP does not add a status column
to `course_entitlements`, and **reactivation therefore does not, and cannot,
restore the original deleted row.** The old row and its synthetic ID
(`admin-grant-<source>-<uuid>`) are gone permanently once revoked; that is by
design and unchanged by this feature.

**What reactivation actually does:** it performs exactly the same operations
`grantAccess` already performs and is already tested for — resolve-or-create
the AIMT Auth account, insert one new `course_entitlements` row with a fresh
`admin-grant-<source>-<uuid>` ID, write an audit record — except the action
recorded is `reactivate_manual_course_access` instead of
`grant_course_access`, and the source (`staff`/`complimentary`/`scholarship`/
`manual`) is carried over from the original grant automatically rather than
re-selected by the admin. Structurally, this makes it **impossible** for a
reactivation call to affect any existing row, Stripe or manual: the function
never issues a `DELETE` or `UPDATE` against `course_entitlements`, only a
`POST` of a brand-new row.

**How "this student previously had a revoked admin grant" is verified.**
Reactivation takes the original (now-deleted) `admin-grant-...` ID as input
— the same ID shown next to the corresponding entry in the Activity Log —
not a bare email address. The server looks that ID up in the authoritative,
service-role-only `admin_audit_log` for a `revoke_manual_course_access` row
whose recorded `details.grantId` matches. If no such record exists, the
request is rejected (404). This was chosen over "just trust the admin's
typed email + source, the same way grant already works" specifically because
the task is framed as "restore a specific wrongly-revoked grant," not "grant
this student access again" (which the existing `Grant course access` action
already does perfectly well, and remains the right tool for that). Tying
reactivation to a real, specific, previously-revoked admin-grant ID makes the
Activity Log line the single source of truth for "what can be reactivated"
and keeps `reactivate_manual_access` from silently becoming a second,
undifferentiated grant tool.

**Duplicate guard.** If the identified student already has an active
(currently existing) `admin-grant-` entitlement for this course — e.g.
because they were already re-granted access through the ordinary `Grant
course access` flow — reactivation is a safe no-op: it creates nothing, logs
no new audit row, and returns `{ ok: true, alreadyActive: true, grantId:
<the entitlement that already exists> }` so the UI can say so plainly. It is
not treated as an error, because the student already has the access being
requested.

**Authorization and blast radius**, identical to grant/revoke:

- Owner or admin only (`requireAdminRole(actor, ['owner', 'admin'])`);
  support is rejected with 403 and no state change.
- Cannot be pointed at a non-`admin-grant-` (i.e. Stripe) ID — rejected
  before any lookup is performed.
- Never writes to `course_progress`, `certification_attempts`, or
  `completions` — same structural guarantee grant and revoke already have,
  verified by both a static source scan and a runtime zero-call assertion.

No schema change and no new migration were required or made for this
feature.

---

## 8. Admin interface

Route/file:

`admin.html`

### 8.1 Sign-in state

If no Supabase session exists:

- display AIMT Admin sign-in
- accept email/password
- sign in through Supabase Auth
- immediately call the protected admin API

If a valid Supabase session exists but the user is not an active admin:

- do not display the console
- show `Admin access required`

A normal student session must not reveal operational data.

### 8.2 Overview

Dashboard metrics:

- Enrolled
- Active in last 30 days
- Certified
- Open review requests
- Outstanding educator requests

Also display recent students sorted by latest progress activity or enrollment.

### 8.3 Students

Search by:

- email
- display name derived from Auth metadata

Student list displays:

- identity
- paid/manual access indicator
- progress percentage
- certification state
- last activity/enrollment

### 8.4 Student detail

Student drawer displays:

**Account**

- account existence
- email
- name
- creation date where available
- last sign-in date where available

**Course access**

- all active HeadSpa Mastery entitlement rows
- Stripe vs manual classification
- grant date
- entitlement identifier
- revoke control only for manual entitlement IDs

**Course progress**

- synchronized progress percentage
- count of completed module records
- latest progress timestamp

**Certification**

- completion/credential status
- credential ID when issued
- revocation state
- final assessment attempts
- Knowledge score
- Applied Cases score
- Interview score
- Overall score
- final certification decision

**Review/remediation**

- review requests
- educator requests
- remediation assignments

**Account support**

- direct instruction to use existing Student Access password recovery
- no password reveal or admin-set-password function

### 8.5 Enrollment action

`Grant course access`

Fields:

- first name (optional)
- last name (optional)
- email (required)
- source (required)

The dialog explicitly states that access does not grant:

- progress
- checkpoint passes
- exam results
- certification

### 8.6 Activity log

Displays the latest privileged admin actions from `admin_audit_log`.

### 8.7 Convenience entry point from My AIMT (not a security boundary)

`my-aimt.html` shows a hidden-by-default "AIMT Admin" nav link
(`.aimt-admin-entry`, two instances — the desktop account nav and the
mobile account panel) that becomes visible only after `checkAdminEntryPoint()`
calls the real `GET /api/admin?view=me` with the signed-in student's own
bearer token and receives back a response with `actor.role` set. A
signed-out visitor, a normal student, or a failed/timed-out request all
leave the link in its default `display:none` state; nothing in
`my-aimt.html` grants, implies, or caches access on its own.

This is deliberately redundant with, not a substitute for, the server-side
gate: `/admin.html` and `/api/admin` re-run `resolveAdmin()` /
`requireAdminRole()` on every request regardless of how the visitor
arrived. The nav link's only job is to save an active admin/owner/support
user a manual navigation to `/admin.html` — it is pure UX, read-only by
construction (one `GET`, no mutation), and fails closed: any error in the
check (network failure, non-2xx, malformed body) leaves the link hidden
rather than showing it optimistically. See `my-aimt.html`'s own header
comment above `revealAdminEntry()` for the identical statement in code.

---

## 9. Admin API

Route:

`/api/admin`

### GET views

`?view=me`

- validates current admin
- returns actor email and role

`?view=dashboard`

- returns summary metrics and recent students

`?view=students&q=<term>`

- returns up to 100 matching enrolled students

`?view=student&userId=<uuid>`

or

`?view=student&email=<email>`

- returns detailed account, entitlement, progress, completion, assessment, remediation, review, and educator-request state

`?view=audit`

- returns latest privileged admin actions

### POST actions

`grant_access`

Required role: `owner` or `admin`

Input:

- email
- optional first name
- optional last name
- source

Output:

- user ID
- whether account was created
- manual grant ID
- next-step setup instruction

`revoke_manual_access`

Required role: `owner` or `admin`

Input:

- manual grant ID

Reject unless ID begins with `admin-grant-`.

`reactivate_manual_access`

Required role: `owner` or `admin`

Input:

- the original (now-deleted) manual grant ID that was revoked

Behavior (see §7.6 for full rationale):

- Reject unless the ID begins with `admin-grant-`.
- Reject (404) unless `admin_audit_log` contains a `revoke_manual_course_access` record for that exact ID — this is what proves the ID was genuinely revoked through Admin MVP rather than a fabricated or Stripe ID.
- If the student already has an active `admin-grant-` entitlement for this course, return `{ ok: true, alreadyActive: true, grantId }` and create nothing.
- Otherwise, create a brand-new `admin-grant-<source>-<uuid>` entitlement (source carried over from the original grant), resolve-or-create the AIMT account exactly as `grant_access` does, and write a `reactivate_manual_course_access` audit record.

Output (successful reactivation):

- user ID
- whether the account was (re-)created
- new manual grant ID (different from the original — the old ID is not restored)
- next-step setup instruction

Output (no-op):

- `alreadyActive: true`
- the currently-active grant ID

---

## 10. Data exposure rules

Admin API may return only data necessary for AIMT operations.

MVP intentionally does not return:

- password hashes
- password-reset tokens
- Supabase service-role keys
- Stripe secret keys
- full payment-card data
- unrelated Auth secrets

Student free-response/checkpoint transcripts are not exposed in the initial Admin MVP student panel. If educator review later requires response-level detail, it should be designed as a separate narrow review feature with explicit privacy and pedagogical rationale.

---

## 11. Operational setup required before live QA

The code alone is not sufficient for live operation.

Before branch-preview QA:

1. Apply `supabase/migrations/20260905_create_admin_mvp.sql` to the correct Supabase project.
2. Configure the Pages/Cloudflare server environment variable:
   - `AIMT_OWNER_EMAIL=<authorized owner AIMT account email>`
3. Confirm existing environment variables remain available:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Use the owner's existing AIMT Supabase account, or create one through an existing safe account path.
5. Open `/admin.html` on the branch preview.
6. Sign in as the owner.
7. Confirm the first `admin_users` owner row is created.
8. Verify a normal student receives 403 and no admin data.

Do not place `AIMT_OWNER_EMAIL` or the service-role key into public client HTML.

---

## 12. Acceptance tests

### Authorization

- [ ] unauthenticated `/api/admin` request returns 401
- [ ] authenticated non-admin returns 403
- [ ] first configured owner can bootstrap only when `admin_users` is empty
- [ ] wrong email cannot bootstrap owner
- [ ] inactive admin cannot enter
- [ ] support role cannot grant or revoke enrollment
- [ ] service-role credentials never appear in browser source

### Grant access

- [ ] existing AIMT account can receive Staff access
- [ ] new email creates AIMT account and entitlement
- [ ] staff student can complete password setup through existing recovery flow
- [ ] staff student enters the exact normal HeadSpa Mastery course experience
- [ ] grant does not mutate `course_progress`
- [ ] grant does not create checkpoint pass state
- [ ] grant does not create a certification attempt
- [ ] grant does not create a `completions` row
- [ ] action produces authoritative admin audit record

### Revocation

- [ ] manually granted entitlement can be revoked
- [ ] Stripe entitlement cannot be revoked through MVP
- [ ] revoke action produces authoritative audit record
- [ ] revoking manual entitlement does not delete the Auth account
- [ ] revoking entitlement does not delete historical course/certification records

### Reactivation

- [x] authorized (owner/admin) reactivation of a genuinely revoked manual grant succeeds and creates a new `admin-grant-` entitlement — automated
- [x] support role cannot reactivate — automated
- [x] unauthenticated caller cannot reactivate — automated
- [x] a Stripe-style ID is rejected before any lookup and cannot be reactivated/altered via this path — automated
- [x] a well-formed `admin-grant-` ID with no matching revoke record is rejected (404) — automated
- [x] reactivating when the student already has an active manual entitlement is a safe no-op (no duplicate row, no audit row) — automated
- [x] reactivation produces an authoritative `reactivate_manual_course_access` audit record with correct actor/target/course/details fields — automated
- [x] reactivation never mutates `course_progress`/`certification_attempts`/`completions` — automated (static scan + runtime zero-call assertion)
- [x] reactivation never issues a `DELETE`/`UPDATE` against `course_entitlements` — automated
- [ ] admin.html "Reactivate access" button (Activity Log) round-trips correctly against a live branch preview — manual QA, not yet performed

See `tests/admin-mvp-behavior.test.mjs` for the automated coverage above.

### Student visibility

- [ ] student search finds email
- [ ] student search finds Auth display name
- [ ] progress displayed matches server row
- [ ] certificate ID displayed matches completion row
- [ ] revoked credential is not shown as active certification
- [ ] final-assessment scores/decision match authoritative rows
- [ ] review/remediation counts and rows are truthful

### UI

- [ ] desktop layout usable
- [ ] phone layout usable
- [ ] keyboard focus visible
- [ ] dialogs/drawer can be dismissed
- [ ] no horizontal page overflow
- [ ] loading and error states are readable
- [ ] dangerous actions require an explicit confirmation

---

## 13. Manual QA scenario for staff enrollment

Use a dedicated test email rather than a real customer's account.

1. Sign into Admin as Owner.
2. Grant HeadSpa Mastery access with source `Staff`.
3. Confirm admin reports whether an account was created.
4. Confirm the student appears in Students.
5. Open student record; confirm access is `Manual / staff access`.
6. If new account, open Student Access in a separate browser/profile and request password recovery.
7. Set password and sign in.
8. Confirm My AIMT lists HeadSpa Mastery.
9. Enter the course normally.
10. Confirm module locks/checkpoints behave identically to paid enrollment.
11. Confirm no certificate exists before satisfying certification requirements.
12. After genuine completion, confirm normal server-authoritative certificate issuance works.
13. Return to Admin and confirm credential ID/status appears.

---

## 14. Explicitly deferred Admin features

Not part of MVP:

- curriculum/CMS editor
- checkpoint or score override
- manual certificate issuance bypass
- manual progress-completion toggle
- Stripe refunds
- charge/dispute management
- paid-access revocation
- bulk imports
- bulk staff enrollment
- marketing/email campaign tools
- direct student impersonation
- reading private Cadence conversations by default
- instructor grading console beyond existing review/remediation visibility
- admin-role-management UI
- advanced cohort analytics
- revenue reporting
- organization/employer accounts
- B2B seat management

---

## 15. Recommended next admin phases

### Phase 2 — Educator operations

- resolve review requests
- educator-remediation workflow
- structured notes
- attempt-4 authorization controls where governed by the certification standard

### Phase 3 — Support operations

- verified account-state diagnostics
- resend/setup tooling
- entitlement mismatch repair with explicit logs
- safe account-email change workflow

### Phase 4 — Analytics

- module drop-off
- completion time
- checkpoint revision patterns
- assessment-performance patterns
- Cadence usage/cost
- cohort comparisons

### Phase 5 — Multi-course administration

Once AIMT has additional certifications:

- course selector
- multi-course entitlements
- cross-course student profile
- certification portfolio
- staff access by course
- bundled access

---

## 16. Release status

**Implemented on `course-audit-build`.**

This does **not** mean production-approved.

Release still requires:

- migration application
- server env configuration
- static validation
- branch-preview functional QA
- normal-student authorization rejection test
- real staff test-account enrollment flow
- desktop QA
- phone QA
- explicit owner approval

Until those gates pass:

**NO MERGE. NO PRODUCTION DEPLOYMENT.**

---

## 17. Architecture review — future-proofing check (2026-09-15)

A pass was made to check whether the current Admin IA (Overview / Students /
Reviews-Certification&#8203;<sup>†</sup> / Activity Log) is accidentally
hardcoded around HeadSpa Mastery being the only course, in a way that would
force a risky rewrite once AIMT has additional certifications (§15, Phase
5). No new sections were added and no working code was changed as part of
this review — per its own instructions, this documents a finding rather
than acting on a theoretical concern.

<sup>†</sup> The implemented `admin.html` currently has three nav
destinations (Overview, Students, Activity Log); "Reviews-Certification" as
a distinct fourth tab is not yet built — review/remediation data is
currently surfaced inside the student detail drawer (§8.4) rather than as
its own top-level view. Noted here since it's relevant to how easily a
fourth tab could be added (see below): trivially, by the same pattern as
the existing three.

**Client shell (`admin.html`) — already sufficiently modular; no change
made.** Navigation is a single generic pattern: every `.nav button` carries
a `data-view="…"` attribute, one shared click handler toggles `.view`
sections by matching `id="view-<name>"`, and a small per-view dispatch
(page title text, which `load*()` function to call on activation) is the
only per-section code. Adding a future section (Courses, Credentials, AIMT
LIVE, Knowledge Library, Simulation Lab) means adding one nav button, one
`<section class="view" id="view-…">`, one `load…()` function following the
existing `loadDashboard()`/`loadStudents()`/`loadAudit()` shape, and one
extra branch in the small title/dispatch logic — not a restructure of
existing sections. The student drawer, the grant/revoke/reactivate mutation
pattern (confirm dialog → `POST /api/admin` → refresh affected views), and
the notice/error-display helpers are all already written as reusable
functions independent of any specific course, so a second course's student
detail view would reuse them rather than duplicate them.

**Server (`functions/api/admin/index.js`) — mostly centralized, with one
real single-course coupling worth flagging for Phase 5, not fixing now.**
Two things are already well-factored for future phases: authorization
(`requireAdminRole`) and audit logging (`writeAdminAudit`) are both
imported from `functions/_lib/admin/auth.mjs` and reused identically across
every mutating action (`grantAccess`, `revokeManualAccess`,
`reactivateManualAccess`) — a Phase 2/3 educator or support-operations
feature could call the exact same two helpers without any change to them.
The course slug itself is also already centralized to one constant
(`const COURSE_SLUG = 'headspa-mastery'` at the top of the file) rather than
being a magic string repeated ad hoc — every query filters by that one
symbol.

The real coupling is in the *shape* of the read/aggregation logic, not in
scattered strings: `buildStudentSummaries()` keys its `byIdentity` map by
`user.id` alone (or `email:<email>` when there's no account yet), which
implicitly assumes at most one entitlement/progress/completion record set
per student — true today only because every read is already pre-filtered
to `course_slug = COURSE_SLUG` before that map is built. Once a second
course exists, a student enrolled in both would need that map (and
`handleStudent`'s equivalent single-record reads) keyed by
`(user_id, course_slug)` instead of `user_id`, and `COURSE_SLUG` would need
to become a parameter threaded through `handleDashboard`, `handleStudents`,
`handleStudent`, `grantAccess`, `revokeManualAccess`, and
`reactivateManualAccess` rather than a module-level constant. This is a
moderate, mechanical, *additive* change when Phase 5 is actually designed
against a real second course (it does not require touching the audit log,
the `admin_users` table, or the authorization model at all) — not the "risky
entitlement redesign" category of change, and not something to speculatively
build now against a course that doesn't exist yet.

**Disposition:** no code changed for this item. `functions/api/admin/index.js`
is also outside this workstream's editable scope regardless (see the
governing task's hard boundaries), so even if a fix were judged urgent here,
it would belong to whichever future pass actually implements Phase 5. The
finding is recorded so that pass starts from an accurate map of what needs
to change (the two items above) instead of rediscovering it.

**Follow-up verification (2026-09-15, later pass) — one additional coupling
found on independent re-check.** The finding above (`COURSE_SLUG` constant
plus per-`user_id` keying in `functions/api/admin/index.js`) was
independently re-confirmed by re-reading the current file:
`buildStudentSummaries()` (~line 103) still keys `byIdentity` by `user.id`
(or `email:<email>`) alone, exactly as previously documented, and
`COURSE_SLUG` remains a single module-level constant used consistently by
every query — no drift found since the original pass.

One additional, smaller coupling was found that the original pass did not
mention, in a different layer (client-side copy, not server logic):
`admin.html`'s "Grant course access" modal hardcodes the course name
directly in its description text — `This grants the Head Spa Certification
Course without Stripe...`. Unlike `COURSE_SLUG` in the API, this string is
not sourced from any shared constant or server response; it would need to
become a parameter (or be replaced by a course selector once one exists)
for a second course's admin surface to reuse this modal without editing
markup. Same disposition as the original finding: low severity, not
urgent, no code changed — Phase 5 (§15) is the right place to address it,
alongside the server-side `COURSE_SLUG`-threading work already documented
above.
