# AIMT Multi-Course — Phase 2A: Shared Certification Backend

Branch `feature/multi-course-phase2a-cert-backend`, cut from `main` at
`706c4bc` (after PR #115). Not merged or deployed, and no migration.
Production access was read-only aggregate SQL only.

**Goal:** one certification engine for many courses. The scoring,
randomization, ladder, remediation and Cadence-grading engines were already
course-agnostic, because they take banks and config as arguments. All the
Head Spa coupling sat in the endpoints (`getProductionBanks()`, the global
`COURSE_SLUG`) and in credential issuance. This phase removes that coupling.

## 1. Course-specific assessment content

`functions/_lib/courses/registry.mjs` now resolves each course's complete
assessment context:

| Resolves | From |
|---|---|
| Rules: weights, minimums, ladder, randomization, **critical domains** | versioned config, `assessment.versions` (append-only) |
| Knowledge / applied-case / interview banks | `functions/_lib/certification/bank-catalog.mjs`, `assessment.bankVersions` (append-only) |

* **`resolveAttemptContent(attemptRow)`** is for existing attempts. It uses
  only the row's persisted `course_slug`, `assessment_version`,
  `standard_version` and `bank_version`. Each must belong to that course and
  resolve to an installed config or bank. **It never falls back to
  "current".**
* **`resolveNewAttemptContent(slug)`** is for new attempts: the course's
  current config and its bank.
* **Construction rejects:** a missing bank, a bank that isn't the version it
  claims, a config whose bank isn't listed for the course, a bank or version
  claimed by two courses, and a credential prefix outside
  `verify-credential`'s `AIMT-[A-Z]{2,6}` shape.

Head Spa content is unchanged. `content-bank.mjs`, `assessment-config.mjs`,
`critical-domains.mjs` and every engine file are byte-identical to `main`.

## 2. Certification identity and isolation

| Endpoint | Course comes from |
|---|---|
| `submit-part1`, `get-part`, `submit-case`, `submit-interview-turn`, `finalize-assessment` | the student's own attempt row (`id` + `user_id`). Unresolvable → **409 `{reason}`, nothing written, no lock claimed** |
| `request-review`, `request-educator-remediation` | the attempt row's course. Entitlement is checked **for that course**, and the row is tagged with it (previously always Head Spa) |
| `start-attempt` (body), `get-status` (query) | optional `courseSlug`. **Absent → Head Spa** (today's client sends none). **Present but invalid, draft or non-string → 400**, never Head Spa. Then entitlement and module completion are checked for that course, and all reads are scoped to it |
| `issue-certificate` | optional `?courseSlug=` (query, so the request body stays unread, per the existing no-client-name guard) |

These endpoints needed no change: `save-progress` (uses no content) and
`complete-remediation` (owner-scoped).

Related fixes made along the way:
* Prior-item overlap avoidance in `start-attempt` is scoped to the course.
* `submit-interview-turn` now resolves content **before** claiming its turn
  lock, so a fail-closed rejection, or the pre-existing "content
  unavailable" 503, can never leave a lock held.

## 3. Certificate configuration

* **Prefix.** Each course's credential prefix lives in the registry.
  `ensureCertificateIssued` refuses unknown courses (`unknown_course`) and
  issues with the course's own prefix. Every gate it applies is scoped to
  that one course: entitlement, completion, the authoritative PASS, and the
  existing/revoked credential check.
* **Finalize.** It issues **only for the attempt's own course**.
* **Verification.** `verify-credential` takes its title from the registry. A
  credential whose course isn't listed still verifies, showing its stored
  slug, exactly as before.
* **Unchanged:** `AIMT-HS` credentials, the issuance rules, revocation
  ("never replaced"), verification links, the ID shape, the certificate
  artwork and the student UI.

## Tests

| Suite | Result |
|---|---|
| **New** `tests/course-registry-phase2a.test.mjs` | **20 / 20** |
| Phase 1 `tests/course-registry.test.mjs` (updated for the new fields) | 16 / 16 |
| Full suite, `main` @ 706c4bc | 595 tests: 590 pass / 3 fail / 2 skip |
| **Full suite, this branch** | **614 tests: 609 pass / 3 fail / 2 skip** |

The 3 failures are identical on both and pre-existing: Listen-Mode/media
suites that need gitignored local audio.

**What the new suite covers.** It drives the **real endpoints** against an
in-memory PostgREST mock, with a registry holding Head Spa plus a
**synthetic** `example-course`. That course has two assessment versions with
different knowledge minimums, two banks with re-prefixed items, and its own
critical domains `E1`–`E4`. It proves:

* **Head Spa unchanged.** A no-`courseSlug` request still starts a Head Spa
  V1 attempt containing only Head Spa items. Status, the `AIMT-HS` prefix and
  the verification title are unchanged. Head Spa historical attempts still
  score under V1 with domains D1–D4. Every production attempt identity
  (read-only aggregate, 2026-10-21) resolves to the same installed V1 config
  and bank objects.
* **Isolation.**
  * Entitlement is per course, in both directions.
  * Each course's status, ladder, remediation and prior items are its own.
  * Attempts can't be served or scored with another course's items: the
    item is not found, and the result is 503 with no writes.
  * `get-part` serves only the attempt's own course content.
* **Historical.**
  * An older-version attempt passes under its own v1 minimum, where the same
    scores fail under the current v2.
  * An older-bank attempt is scored from its own older bank.
* **Fail closed.** 8 bad identity combinations are each run through 5
  attempt endpoints, giving 409 with the exact reason and **zero writes**.
  The combinations are:
  * a version or bank from the other course, in both directions;
  * an unknown course;
  * a draft course;
  * a missing bank;
  * a mismatched standard version.

  Nine explicit invalid `courseSlug`s are rejected; none defaults to Head
  Spa.
* **Credentials.** An example-course pass issues `AIMT-EX-*` for that course
  only. A pass in either course cannot issue the other's credential
  (`not_passed`). `AIMT-HS`, revoked and unlisted-course credentials verify
  as before.
* **Boundaries.**
  * Remediation is tagged with the failing attempt's course.
  * An example-course educator authorization does not unlock Head Spa
    Attempt 4. A control shows the same row *does* unlock it when filed
    under Head Spa.
  * Appeals are tagged per course and need that course's enrollment.
  * An unknown-course attempt is refused, not filed under Head Spa.

**Counter-proof.** With `main`'s endpoint and issuance files restored,
**12 of the 19 then-existing tests fail.** The 7 that pass are the
behaviour-preservation checks, which should pass on both.

**Existing tests updated, with guarantees kept:**
* five fixtures now carry the NOT NULL `course_slug` / `assessment_version`
  / `bank_version` that every real attempt row has;
* two mock requests gained the `url` every real Request has;
* two static checks follow the renamed `courseSlug` argument;
* Phase 1 registry tests include the new `bankVersions` field.

## Flag for review: one test seam

`registry.mjs` exports `__useCourseRegistryForTests(registry)` so endpoint
tests can activate a synthetic second course. The production registry is a
separate constant (Head Spa only), and a test fails if any file under
`functions/` or `cadence-worker/` other than the registry references the
seam.

The alternative would be passing a registry through every endpoint. That is
more invasive, and Pages Functions have no injection point for it. Please
review whether the seam is acceptable.

## Deferred integration work (outside Phase 2A scope)

1. **Admin console** (`functions/api/admin/index.js`). It is Head Spa-only:
   listings, manual grants, and certificate recovery, which calls
   `ensureCertificateIssued` without a course and so stays Head Spa.
2. **Client.** `module12-certification.js` never sends `courseSlug`.
   Certificate artwork, `PROGRAM_NAME` (`assets/js/aimt-certificate.js`) and
   `verify.html` are fixed to Head Spa. A second course needs these
   per-course, with no redesign of Head Spa.
3. **Payments and entitlements (needs explicit approval).** Per-course Stripe
   price → slug mapping in `stripe-webhook` / `claim-course-access`;
   `isEntitled(env, user, null)` (Research Library) accepts any slug.
4. **Cadence tutoring endpoints and Worker** are still pinned to Head Spa.
   This is not certification grading, which is already course-neutral.
5. **Second-course content.** Requires a bank module plus a
   `bank-catalog.mjs` entry, a config version, and a registry entry. No
   migration is needed: every table carries `course_slug`.
6. **Pre-existing, unchanged:** `complete-remediation` checks ownership but
   not entitlement.
7. **Pre-launch requirement still tracked:** checkpoint integrity (Task 1 §C).
