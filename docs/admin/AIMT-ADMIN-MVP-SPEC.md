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
