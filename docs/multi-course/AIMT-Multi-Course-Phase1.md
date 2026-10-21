# AIMT Multi-Course Foundation — Phase 1

Branch `feature/multi-course-foundation-phase1`, cut from `main` at `3dc70bb`
(after PR #114). Nothing has been merged or deployed, and no migration is
involved.

**Reference note:** Codex's multi-course architecture audit is not in the
repository or on any branch. This phase was scoped from the Task 2 brief and
a fresh inventory of the code. Codex should check it against the audit during
review.

## What Phase 1 adds

`functions/_lib/courses/registry.mjs` is a small, pure, frozen registry with
one entry per certification. Each entry holds:

| Field | Head Spa value (unchanged) |
|---|---|
| `slug` | `headspa-mastery` |
| `title` | `Head Spa Certification Course` (as on `verify-credential`) |
| `status` | `active` (`draft` courses are invisible to shared infrastructure) |
| `modules` | ids 0–12; 0–11 required before the final assessment; 12 = final |
| `assessment.versions` / `current` | `headspa-fe-assessment-v1` (append-only) |
| `assessment.criticalDomainConfigVersion` / `bankVersion` | `headspa-critical-domains-v1` / `headspa-fe-bank-v1-2026-08-26` |
| `resources` | `/headspa-mastery.html`, `levo_app`, credential prefix `AIMT-HS` |

**Resolution API.** `getCourse`, `resolveAssessmentConfig(slug, version)`,
`resolveCurrentAssessmentConfig(slug)`,
`requiredModulesForFinalAssessment(slug)`, `listCourses`, and
`createCourseRegistry()` for adding courses.

**Fail-closed rules:**

* An unknown, malformed or draft slug resolves to `null` / `{ ok: false }`.
* An assessment version must be stated explicitly. Unlike
  `getAssessmentConfig()`, it never defaults to V1. It must also be listed
  for that course and backed by a versioned config whose `courseSlug`
  matches.
* Construction rejects bad slugs, duplicate slugs, duplicate credential
  prefixes, versions claimed by two courses, versions with no config, and a
  `bankVersion` or critical-domain version that disagrees with the current
  config.

**Wired, all identity-preserving for Head Spa:**

| Caller | Before | After |
|---|---|---|
| `hasCompletedInstructionalModules` | loop `0..11` | registry module list. Unknown course → `false`, with no DB call |
| `start-attempt` | `getCurrentAssessmentConfig()` | `resolveCurrentAssessmentConfig(COURSE_SLUG)` |
| `get-status` | current config + `getAssessmentConfig(stored version)` | same, via registry, per course |
| `finalize-assessment` | **current** config | the attempt's **own stored** `course_slug` + `assessment_version`. Unresolvable → 409, nothing written |

The `finalize-assessment` change fixes a latent bug. Before it, adding a V2
config would have scored in-progress V1 attempts under V2 rules (standard
Section 15). Production today has 3 attempts, all scored, all V1. No stored
attempt changes outcome, and already-scored attempts return before any
version is resolved.

**Not changed:** `assessment-config.mjs` (all historical versions), weights,
thresholds, the attempt ladder, exam content, Cadence, Listen Mode, the
dashboard, `headspa-mastery.html`, the database, and every payment or
entitlement path (`create-checkout-session`, `stripe-webhook`,
`claim-course-access`, `isEntitled`).

## Tests

`tests/course-registry.test.mjs` has 16 tests:

* **Head Spa pinned.** Every identifier is checked against the module that
  already hardcodes it: `COURSE_SLUG`, `CREDENTIAL_PREFIX`, content-bank
  `bankVersion`, critical-domain version, the `verify-credential` name, the
  `levo_app` storage key and the course page.
* **Production identifiers.** Every identifier present in production data
  (read-only aggregate, 2026-10-20) resolves.
* **V1 unchanged.** It resolves to the same config object, and weights,
  minimums and attempt rules are snapshotted.
* **Fail-closed.** Malformed slugs (`__proto__`, case or whitespace variants,
  path-like strings, non-strings) resolve to nothing, and there is no default
  version.
* **Module gate.** It still requires exactly 0–11.
* **Finalize.** It refuses an unknown version, a null version or an unknown
  course, with zero writes. It still scores a V1 attempt and returns
  already-scored attempts untouched.
* **Extensibility.** A synthetic `example-course` (not Hair Loss) resolves
  independently and leaves Head Spa resolution identical. Cross-course
  version use is rejected both ways, and a draft course stays invisible.

Against `main`'s `finalize-assessment.js` and `auth.mjs`, the finalize
fail-closed and unknown-course module-gate tests fail. That confirms they
test real behaviour.

Five existing fixtures and static checks were updated to the
registry-backed shape, with the same guarantees:

* three fixtures (`certification-module12-concurrency`,
  `certification-retake-gate-integration`, `certificate-auto-issuance`) now
  give attempt rows the `assessment_version` that is NOT NULL on every real
  row;
* two static checks (`certification-results-redesign`,
  `aimt-dashboard-resources-launch`) now pin the registry call and the
  registry's `[0…11]` list instead of the old literal.

**Full suite** (with `AIMT_PGLITE_MODULE`): 595 tests, 590 pass, 3 fail,
2 skipped. The 3 failures are the same pre-existing Listen-Mode/media suites
as on `main` (579 / 574 / 3 / 2); they need gitignored local audio.

## What Phase 2 needs

These are ordered so that each step is reviewable on its own and none
activates a second course.

1. **Remaining server certification identifiers move to the registry.**
   * `CREDENTIAL_PREFIX` (`certificate-issuance.mjs`) and `COURSE_NAMES`
     (`verify-credential.js`). Unknown slugs on *existing* credentials must
     keep displaying.
   * `getProductionBanks()` and `HEAD_SPA_CRITICAL_DOMAINS` become
     per-course lookups, keyed by the registry's `bankVersion` and
     `criticalDomainConfigVersion`.
2. **Endpoints accept a course.** The certification and Cadence endpoints
   currently pin `COURSE_SLUG`. They should resolve an explicit `courseSlug`
   (request field, or the attempt row's own `course_slug`) through
   `getCourse()`, rejecting unknown or draft. Head Spa remains the only
   active course.
   * Affected: `functions/api/certification/*`, and
     `functions/api/cadence/{ask,evaluate-checkpoint,get-thread,
     evaluate-script,submit-intro}.js` together with their `_lib`.
   * Also: `cadence-worker/worker.js` (deployed separately).
3. **Payments and entitlements (needs explicit approval, CLAUDE.md rule 1).**
   * `stripe-webhook.courseSlugForPrice` and `claim-course-access` map one
     `STRIPE_PRICE_ID` to Head Spa. A second course needs a per-course
     price-to-slug map: registry `resources.stripePriceEnvVar`, with the
     values kept in env.
   * `isEntitled(env, user, null)` (Research Library) accepts any slug and
     should accept only registry courses.
   * `create-checkout-session` must refuse non-`active` courses.
4. **Client and course-page identifiers (largest surface, last).** These
   are `headspa-state.js` (`levo_app`), `aimt-progress-sync.js`,
   `module12-certification.js`, `cadence-shell.js`, Listen-Mode data/player,
   `aimt-course-resources.js` and `my-aimt.html`. A shared, generated
   client-side course manifest from the same registry avoids a second source
   of truth.
5. **Data model.** No migration is needed for Phase 2. Every course table
   already carries `course_slug`, and uniqueness is per (user, course).
   Additive `CHECK`/FK constraints tying `course_slug` to known courses could
   follow once a `courses` reference table is warranted.

**Pre-launch requirement still tracked:** checkpoint integrity (Task 1 §C:
client-supplied rubrics, client-writable progress). It is independent of this
phase. It must be resolved before a second course launches; otherwise
Hair Loss would copy the same client-rubric pattern.
