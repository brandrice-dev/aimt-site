# Module 12 — Final Exam / Course Completion / Certification — Implementation Authority

**Course:** AIMT Head Spa Certification Course
**Student-facing module number:** 12
**Approved module title:** Final Certification Assessment (student-facing "Module 12 · Final Exam")
**Governed by:** `docs/course-audit/00-aimt-certification-assessment-standard.md` (AIMT Certification & Assessment Standard, Version 1 — architecture locked) and `docs/course-audit/modules/module-12-final-exam-raw-blueprint.md` (Head Spa-specific competency map, critical-domain architecture, and state design — architecture locked, exam wording still raw/unapproved).
**Audit date:** August 26, 2026
**Implementation date:** August 26, 2026 (engine); August 26, 2026 (content installation); August 26, 2026 (traceability remediation, this update)
**Implementation:** certification-assessment ENGINE + Module 12 UI architecture implemented. Production exam content is **FULLY TRACEABILITY-VERIFIED — 141/141 assessment assets (120 Knowledge, 12 Applied Cases, 9 Practitioner Conversations), 0 BLOCKED.** The three items blocked in the initial installation pass (`M02-005`, `M07-006`, `M08-012`) were replaced with owner-approved wording, each independently re-verified against the current approved Module 2/7/8 content, and are now active. See "Content status" below.
**Status:** Module 12 — 120/12/9 assessment content fully traceability-verified; pending migration, live Cadence environment, and owner manual QA. NOT manually approved. NOT launch-ready.
**Production source of truth:** `headspa-mastery.html` (`module12Wrap`, technical slot `12`, view routing) + `assets/js/module12-certification.js` (client controller) + `functions/_lib/certification/*.mjs` (engine, now including installed `content-bank.mjs`) + `functions/api/certification/*.js` (server-authoritative endpoints) + `supabase/migrations/20260826_create_certification_assessment.sql` (schema, not yet run). Content-installation source of truth: the three LOCKED markdown authority files in `docs/course-audit/modules/` (`module-12-final-knowledge-bank.md`, `module-12-final-applied-cases.md`, `module-12-final-interview-bank.md`), `scripts/build-module12-assessment-bank.mjs` (generator), and [`module-12-content-traceability.md`](module-12-content-traceability.md) (per-item audit record). Owner visual QA source of truth: `scripts/review-module12-bank.mjs --browser` (local-only real-renderer visual QA server — see "Owner visual QA," below).

This document does not authorize marking Module 12 manually approved or deploying/merging to `main`. It records what was actually built — engine, then content installation — so the next task (environment integration + owner QA) has an accurate implementation map.

---

## Content status — INSTALLED (August 26, 2026)

The raw Claude-generated wording in `module-12-final-exam-raw-blueprint.md` (80 knowledge questions, 8 applied cases, 8 interview prompts) remains **explicitly not approved for student-facing use** and was never copied into the production content bank, then or now.

Instead, the owner supplied three separate, LOCKED markdown authority files with student-facing wording frozen:

- `docs/course-audit/modules/module-12-final-knowledge-bank.md` (120 Knowledge questions)
- `docs/course-audit/modules/module-12-final-applied-cases.md` (12 Applied Practitioner Cases)
- `docs/course-audit/modules/module-12-final-interview-bank.md` (9 Practitioner Conversations)

A new deterministic generator, `scripts/build-module12-assessment-bank.mjs`, parses these three files programmatically (regex/line-based, never by hand-typing student-facing wording) into `functions/_lib/certification/content-bank.mjs`, which now ships `CONTENT_STATUS: 'INSTALLED'`, `bankVersion: 'headspa-fe-bank-v1-2026-08-26'`, and real `knowledgeBank`/`caseBank`/`interviewBank` arrays. `SOURCE_HASHES` embeds a SHA-256 of each locked source file at generation time; `tests/certification-content-bank-sync.test.mjs` fails if a locked file changes without re-running the generator.

**Traceability audit.** Every item was checked against the actual approved Module 1–11 specifications (`docs/course-audit/modules/module-0N.md`), not the raw blueprint and not from memory — see [`module-12-content-traceability.md`](module-12-content-traceability.md) for the full per-item record. Initial result: **117 of 120 Knowledge items VERIFIED and shipped `status:'approved'`; 3 BLOCKED and shipped `status:'draft'`** (`M02-005`, `M07-006`, `M08-012` — see "Traceability remediation" below for what was wrong with each and how they were fixed). All 12 Applied Cases and all 9 Practitioner Conversations VERIFIED and shipped `status:'approved'` from the start. `status:'draft'` items are excluded from any real student selection by `isApprovedForProduction()` — they are never silently rewritten or dropped, only quarantined and reported.

### Traceability remediation (August 26, 2026 — Step 91)

The owner supplied replacement wording for all three blocked Knowledge items. Per instruction, replacement wording was **not** auto-approved merely because the owner supplied it — each was independently re-verified against the current approved `module-02.md`/`module-07.md`/`module-08.md` content before being marked VERIFIED (full comparison in [`module-12-content-traceability.md`](module-12-content-traceability.md)'s "Remediation pass" section):

- **`M02-005`** — the new scenario matches checkpoint `m2cp1`'s exact documented scenario ("visibly stressed... apologizes for being two minutes late") and Section 2.6 "Rushing the beginning."
- **`M07-006`** — the new item ("A tool has to earn its place") matches Approved Outcomes #1/#3 (function-based, not appearance-based, equipment evaluation). This competency does not touch D4 (Sanitation/Process Integrity) at all, so its `Critical-Domain Evidence: D4` tag was **removed, not replaced with another domain** — no critical-domain tag was invented to preserve the old classification.
- **`M08-012`** — the new item tests the *current* controlling Module 8 content directly (the August 24, 2026 intake-determines-fragrance amendment), replacing wording that tested a superseded script.

**Result: 141/141 assessment assets VERIFIED, 0 BLOCKED.** Real-bank randomization was re-validated after M07-006's D4 removal (1000 seeded draws, zero failures, zero coverage warnings, D4's minimum evidence total across all draws never dropped below 3 — well above the required 2). `scripts/build-module12-assessment-bank.mjs`'s `BLOCKED_KNOWLEDGE_ITEMS` map is now empty; its history is recorded in a code comment rather than deleted silently.

### Owner visual QA (August 26, 2026 — Step 91)

`scripts/review-module12-bank.mjs --browser` launches a `127.0.0.1`-only local HTTP server that serves `assets/js/module12-certification.js` **completely unmodified** (the real production renderer, not a second implementation) against the real installed content bank, backed by local in-memory mock endpoints implementing the exact `/api/certification/*` REST contract (no Supabase, no Anthropic/`ANTHROPIC_API_KEY`, no attempt/certificate/remediation/review record ever created). Part II intentionally shows **all 12** cases and Part III **all 9** conversations in one session (the real exam draws only 4/3) so the owner can browse every item through the real renderer. Case/interview scoring for visual purposes uses a clearly-banner-labeled MOCK evaluator (always demonstrates the one allowed follow-up using the interview's real, human-authored follow-up text) — deterministic objective scoring (single-best-answer/multi-select/sequencing/classification) uses the real, unmodified `scoring.mjs` engine. A separate `/debug` route serves the full bank with answer keys/rubrics, visibly banner-labeled "INTERNAL OWNER QA ONLY — never publish, deploy, or embed." Verified end-to-end via real browser interaction: Part I's 40-question draw (including the markdown-bold rendering fix rendering **bold** text correctly instead of literal asterisks), all 12 Part II cases including CASE-08's classification UI, and Part III's real greeting/follow-up/first-name substitution. See `tests/certification-local-qa-tool.test.mjs` for the automated version of these checks.

**Engine extensions required (not exam-content changes).** The engine built in the prior task (against an empty bank) needed two small, necessary additions once real content revealed answer shapes it hadn't yet needed to support: a `classification` `CasePart` type (`content-schema.mjs`, `scoring.mjs` — CASE-08's "classify each item" part) and a `choiceIncludes` critical-flag trigger for multi-select parts (`scoring.mjs` — CASE-04's "flag this specific unsafe multi-select option regardless of what else was picked"). Neither changes any scoring philosophy, weighting, or gate rule from the prior task's locked design.

**Client UI extensions.** `assets/js/module12-certification.js`'s Part II renderer previously rendered every non-short-response case part as a generic checkbox list (correct only by accident for multi-select, structurally wrong for single-best-answer/sequencing/classification, and with no rendering path at all for the latter two) — this was harmless while the bank was empty but would have broken on real content. It now dispatches per part type: radio buttons for single-best-answer, checkboxes for multi-select, an accessible up/down-reorderable list for sequencing, and a per-item category selector for classification; a case's submit button is disabled with a visible hint until every part has a response, since submission permanently locks the case. Multi-line and markdown-bold-aware prompt/scenario rendering was also added — several Knowledge items and Case scenarios contain bulleted history lists, blockquoted client dialogue, or **bold** emphasis that the prior bare `esc()`-only rendering (built and only ever tested against single-line fixture content) would have collapsed into a run-on sentence with literal, unrendered asterisks.

**Real-bank validation.** 500+ seeded draws of `assembleAttempt()` against the real installed bank all succeed: exactly 40/4/3 selected, full Module 1–11 coverage, no duplicate IDs, and every one of D1–D4 meeting the ≥2-total/≥1-non-Part-I evidence rule with zero coverage warnings. `tests/certification-content-bank.test.mjs` (806 assertions) and `tests/certification-content-bank-sync.test.mjs` (4 assertions) are new; the pre-existing `tests/certification-randomization.test.mjs` (27), `tests/certification-scoring.test.mjs` (21), `tests/certification-attempt-ladder.test.mjs` (12), and the two migration suites (108 combined) all remain green — 978 total assertions, zero regressions.

**As a direct consequence of content now being installed, a real Module 12 attempt can be completed end-to-end once the remaining environment steps below are done** — but `issue-certificate.js` still correctly requires a server-authoritative passing `certification_attempts` row (see "Certificate issuance," below), and no attempt can be recorded until the Supabase migration is run and `ANTHROPIC_API_KEY` is provisioned (neither was done by this task — see "Explicitly not done," below).

---

## Module 12 state machine (implemented)

Four states, matching `module-12-final-exam-raw-blueprint.md` Part 5, resolved server-side by `GET /api/certification/get-status` and rendered by `assets/js/module12-certification.js`'s `Module12Cert.render()`:

| State | Trigger (server-derived) | UI |
|---|---|---|
| **A — Exam Ready** | Eligible, no attempts yet | Full "Final Certification Assessment" overview + Start Final Exam |
| **B — Exam In Progress** | An attempt with no `certification_decision` exists | Resumes at whichever part/sub-state the attempt's `status` column indicates |
| **C — Certification Earned** | Any attempt has `certification_decision = 'pass'` | Existing `module12Wrap` completion/certificate content, reused verbatim, preceded by a Performance Review summary |
| **D — Standard Not Yet Met** | Most recent finalized attempt is `not_yet_passed` and certification not yet earned | Performance Review + attempt-specific copy/actions per the ladder |

`module12Wrap`'s existing markup (curriculum-approved completion/certificate experience) was **not rewritten** — it stays exactly where it is in `headspa-mastery.html` (lines ~7681–7777), still `display:none` by default. `Module12Cert.render()` reads `document.getElementById('module12Wrap').innerHTML` and only injects it into the live view when state is C. A student opening Module 12 for the first time never sees it, per the master instructions' explicit requirement.

**View routing change (surgical):** `headspa-mastery.html`'s `STATIC_MODULES[12]` now calls `window.Module12Cert.render(wrap)` instead of unconditionally copying `module12Wrap`'s HTML in. A missing/failed script load falls back to the old unconditional behavior rather than breaking the page.

---

## Eligibility (implemented)

`functions/_lib/certification/auth.mjs`'s `hasCompletedInstructionalModules()` reads the student's server-synced `course_progress.state.progress['0'..'11'].complete` directly — the same fields the client's own `APP_STATE.isModuleComplete()` derives from — rather than trusting a client-submitted flag or approximating from `progress_score`. Prior checkpoint history is never re-graded into the exam; it only establishes this eligibility gate, per standard Section 6.

---

## Three-part assessment engine (implemented)

### Versioned configuration
`functions/_lib/certification/assessment-config.mjs` defines `HEAD_SPA_ASSESSMENT_CONFIG` (assessment version `headspa-fe-assessment-v1`) — weights (50/30/20), independent minimums (75/75/80, overall 80), difficulty targets (20/60/20), required module coverage (1–11), Part I/II/III target counts (40/4/3), critical-domain coverage rule, and attempt-ladder rule constants. `getAssessmentConfig(version)` looks up a frozen historical config by version string so a future revision never rewrites what an earlier attempt was actually held to (standard Section 15) — add a new entry, never mutate an existing one.

`functions/_lib/certification/critical-domains.mjs` defines the four locked Head Spa domains (D1 Professional Scope/Diagnosis/Referral, D2 Contraindication/Client Safety, D3 Consent/Touch/Bodywork Authority, D4 Sanitation/Process Integrity) as versioned configuration, each with a `typeBThreshold` (2) — never as scattered one-off conditionals.

### Content data contracts
`functions/_lib/certification/content-schema.mjs` defines the Knowledge/Case/Interview item shapes exactly per the task's suggested contracts, plus `projectKnowledgeItemForClient()` / `projectCaseForClient()` / `projectInterviewItemForClient()` — the only functions permitted to shape what reaches the browser. None of them ever include `correctChoice`, `rationale`, `correctAnswer`, `scoring`, `criticalFlags`, or rubric guidance.

### Constrained randomization
`functions/_lib/certification/randomization.mjs`:
- `selectPartIIAndIII()` — greedy set-cover selection of cases then interviews against the four critical domains, then fills remaining slots for module/variety coverage, preferring unseen items.
- `selectPartI()` — guarantees every required module gets ≥1 item, tops up critical-domain evidence to the required minimum (accounting for what Part II/III already covered), then fills the remaining slots targeting the ~20/60/20 difficulty mix.
- `assembleAttempt()` — orchestrates both, verifies no duplicate IDs across the whole attempt, and reports a per-domain evidence matrix + warnings.
- Explicitly returns `{ ok:false, reason:'insufficient_bank', ... }` rather than throwing when the bank can't satisfy coverage — this is the path production hits today.
- Tested against a synthetic fixture bank in `tests/certification-randomization.test.mjs` (27 assertions, all passing) — module coverage, difficulty mix, no-duplicate-IDs, domain coverage (≥2 total, ≥1 non-Part-I per domain), missing-module/too-small-bank failure handling, and retake-overlap minimization.

### Scoring + critical-domain gating
`functions/_lib/certification/scoring.mjs` implements the standard's Section 5.2 bar exactly:
- **A single missed multiple-choice question tagged as domain evidence never by itself fails a domain.** Part I evidence points are constructed with `explicitUnsafe` hardcoded `false` — that flag can only ever originate from a case/interview evaluator's structured output.
- **Type A (explicit unsafe reasoning)** — set only when a case's deterministic `criticalFlags` rule matches the student's choice, or when Cadence's structured interview/case evaluation explicitly returns it against a human-authored rubric criterion's `explicitUnsafeRule`.
- **Type B (repeated pattern)** — requires ≥`typeBThreshold` (2) independent evidence points sharing the same `patternTag`, which can originate from a knowledge item's optional `distractorPatternTags`, a case's evaluator output, or an interview's evaluator output.
- `determineCertificationDecision()` evaluates all five gates (overall, knowledge, appliedCases, interview, criticalDomains) completely independently — proven by a test where meeting every per-component minimum exactly (75/75/80) still fails because it weights out to 76% overall, and by a test where a perfect score everywhere still fails on one uncleared domain.
- Tested in `tests/certification-scoring.test.mjs` (21 assertions, all passing).

### Attempt ladder
`functions/_lib/certification/attempt-ladder.mjs`'s `determineNextAttemptEligibility()` is a pure function (no I/O) implementing standard Section 8's exact ladder — Attempt 1→2 with no extra gate, Attempt 2→3 gated on remediation completion, Attempt 3→4 gated on educator authorization, Attempt 4 unsuccessful → `individual_aimt_review` with no automatic Attempt 5, **plus** the domain-specific critical-domain remediation gate that applies starting after Attempt 1 independent of the numbered gates. `buildRemediationAssignments()` groups deficiencies by competency/critical-domain, never one row per missed question. Tested in `tests/certification-attempt-ladder.test.mjs` (12 assertions, all passing), including a case proving that remediating the *wrong* domain does not unlock the next attempt.

---

## Server-authoritative backend (implemented, release-blocker addressed)

Per standard Section 16, this repository's existing identity pattern (`Authorization: Bearer <supabase access token>` → `GET {SUPABASE_URL}/auth/v1/user` with the service-role key → entitlement check against `course_entitlements`) is reused exactly, factored into `functions/_lib/certification/auth.mjs`. No parallel auth system was introduced.

### Schema (additive) — `supabase/migrations/20260826_create_certification_assessment.sql`
- `certification_attempts` — one row per attempt: versioning columns (`assessment_version`, `standard_version`, `bank_version`), per-part selected IDs/responses/state, component scores, `critical_domain_results`, `certification_decision`, `decision_at`.
- `certification_remediation_assignments` — grouped by competency/domain.
- `certification_educator_requests` — MVP manual-scheduling record; an educator authorizes Attempt 4 by setting `attempt4_authorized` directly (out of band, not via a student-facing endpoint).
- `certification_review_requests` — human review/appeal MVP.

All four tables: RLS `select` policy restricted to `user_id = auth.uid()`, **no insert/update policy for `authenticated`/`anon`** — matching the existing `completions` table's trust model exactly. Every write goes through the service-role key inside `functions/api/certification/*.js`. A student cannot alter their own score, critical-domain result, or certification decision by writing to Supabase directly.

**This migration is committed for record-keeping only — it has not been run.** Per `CLAUDE.md`, it must be executed manually in the Supabase SQL editor before any of the endpoints below can function.

### Endpoints — `functions/api/certification/*.js`
`start-attempt` (resolve identity/entitlement/eligibility, enforce the ladder, assemble + persist a new attempt) · `get-part` (fetch Part II/III client-safe content for an active attempt) · `save-progress` (Part I/II autosave, locked-part writes silently ignored) · `submit-part1` (server-side knowledge scoring, locks) · `submit-case` (deterministic + Cadence-evaluated case scoring, locks a case, locks Part II once all cases are in) · `submit-interview-turn` (Cadence conversation turn, max one follow-up, locks a conversation, locks Part III once all conversations are in) · `finalize-assessment` (weighted overall + critical-domain gating + certification decision + remediation-assignment generation, idempotent) · `get-status` (the single source of truth `Module12Cert.render()` reads) · `request-educator-remediation` · `request-review`.

`functions/_lib/certification/cadence-grader.mjs` calls the Anthropic Messages API directly (fetch only, its own `ANTHROPIC_API_KEY` env var) rather than routing through the client-facing `headspa-proxy` Worker — rubrics and scoring logic must never reach the browser, and the Worker's contract is designed for client-issued, client-visible checkpoint prompts. Evaluator failures preserve the student's submitted response and return a retriable error rather than silently locking, losing the answer, or falsely scoring (task requirement #40).

### Certificate issuance hardened (release-blocker)
`functions/api/issue-certificate.js` gained one additional check (Step 4b, between the existing progress-score gate and issuance): a `certification_attempts` row with `certification_decision = 'pass'` must exist for the student/course, or issuance is refused with `409`. This is **in addition to**, not instead of, the existing modules-0–11 progress gate. Because the production content bank is empty, this check can never currently pass — certificate issuance is correctly, verifiably blocked until real exam content ships and a real student passes.

---

## Review Mode (implemented, isolated from production data)

Module 12 Review Mode does **not** call any of the endpoints above at all — it renders entirely from a local fixture set in `assets/js/module12-certification.js` (`fixtureStatusFor()`), selected via a visible dev-only state-switcher bar shown only when `window.ReviewMode.isActive()`. This guarantees, by construction rather than by a server-side Review-Mode check: no authoritative attempt record is ever written, no certificate is ever issued, no remediation/educator/review request is ever created, and no real attempt is ever consumed. All 10 required fixture states are covered: Exam Ready, Part I, Part II, Part III, Processing, Pass, Attempt 1 not passed, Attempt 2 remediation, Attempt 3 educator, Attempt 4 individual review.

---

## Accessibility (implemented, not yet manually verified)

Semantic `<fieldset>`/radio groups for Part I choices, labeled textareas for structured responses, `aria-live="polite"` on the question-progress indicator and the chat transcript, visible focus inherited from the page's existing foundation, no color-only correctness signaling (jump-grid "answered" state pairs color with an `aria-label` stating "answered"/"unanswered"), no countdown/timer anywhere, reduced-motion respected (no new animation was introduced). **Not yet verified:** screen-reader pass, physical-keyboard pass, real touch-device pass — same deferred category as every other module in this course.

---

## Deterministic tests (all passing)

`tests/certification-randomization.test.mjs` (27/27), `tests/certification-scoring.test.mjs` (21/21), `tests/certification-attempt-ladder.test.mjs` (12/12), `tests/certification-content-bank.test.mjs` (810/810 — content counts/IDs/shape/traceability-status/security/1000-seeded-draw selection), `tests/certification-content-bank-sync.test.mjs` (4/4 — locked markdown ↔ generated bank hash sync), `tests/certification-local-qa-tool.test.mjs` (27/27 — the local visual QA server never references Supabase/Anthropic/production endpoints, binds to 127.0.0.1 only, and its live responses contain zero answer-key leakage; the production client bundle embeds no bank content or scoring logic) — run via `node tests/<file>.mjs`, dependency-free (Node built-ins + ESM only). `tests/fixtures/certification-fixture-bank.mjs` contains synthetic, clearly-labeled placeholder content (never the raw blueprint's wording, never installed into `content-bank.mjs`). Pre-existing suites (`module-09-migration.test.js`, `module-11-relocation-migration.test.js`) re-run clean — **1009 total assertions, zero regressions.**

---

## Explicitly not done by this task (traceability-remediation task, August 26, 2026)

- The Supabase migration (`supabase/migrations/20260826_create_certification_assessment.sql`) was **not** run against the live database — still committed for record-keeping only, per `CLAUDE.md`.
- `ANTHROPIC_API_KEY` was **not** provisioned as a Cloudflare Pages Functions env var — `submit-case`/`submit-interview-turn` cannot actually call live Cadence until this deployment-configuration step is done. (The local visual QA server does not require it — see "Owner visual QA," above.)
- No manual QA against the live environment (desktop/phone rendering of a real attempt, live-model Cadence grading, screen-reader, physical-keyboard, real touch-device) was performed. The local visual QA tool lets the owner inspect real rendering without the live environment, but does not substitute for it.
- No student-facing wording was rewritten, paraphrased, shortened, or "improved" anywhere in the three locked banks — the three replacement items were installed exactly as owner-supplied, and every other item is unchanged from the prior installation task.
- No critical-domain tag was invented to replace M07-006's removed D4 tag — its evidence field is simply empty (`Standard`), matching what its replacement content actually teaches.
- No merge to `main`, no deployment, no push.

## Next task

**RUN THE SUPABASE MIGRATION + PROVISION `ANTHROPIC_API_KEY` + FULL OWNER MANUAL QA.** With content fully traceability-verified (141/141), the two remaining environment steps (run the migration; add the API key as a Cloudflare Pages Functions env var) unblock a real end-to-end attempt. Owner QA should then exercise every Module 12 state (A/B/C/D) — `scripts/review-module12-bank.mjs --browser` gives a localhost-only way to visually inspect the real installed content through the real renderer (all 40-question sample draws regenerable by seed, all 12 cases, all 9 conversations) without touching production data or requiring the live environment; `scripts/review-module12-bank.mjs --all`/`--seed N` (file-output mode) remains available for a static answer-key document; the existing in-browser Review Mode fixture-state switcher remains available for exercising the client UI's flow/copy across all ten states. Only after a full live-environment pass may Module 12's status become "Implemented — manual QA approved."
