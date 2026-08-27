# Cadence Launch Sweep — Handoff

**Created:** August 27, 2026, at the close of the Module 12 certification-migration
task (`implementation-log.md` Step 97).
**Purpose:** Give the next major task — the full Cadence UX/architecture
modernization sweep — an accurate, verified starting map of what already
exists, what is already server-authoritative, and what is genuinely still a
gap. Nothing in this document authorizes building any of the sweep items
listed in Section 3. This document only records architectural truth.

---

## 1. Where things stand entering the sweep

**Module 12 (the final certification assessment) is closed and its backend
is verified:**

- **OWNER LOCAL QA: APPROVED** — the owner reviewed and approved the full
  Module 12 student experience (Exam Ready, Part I/II/III, Performance
  Review, Pass/Not-Yet-Passed states, Recommended Review, the Attempt
  2/3/4 ladder, remediation, the final certification close).
- **BACKEND MIGRATION: APPLIED + VERIFIED** — `supabase/migrations/20260826_create_certification_assessment.sql`
  is live against the connected `aimt` Supabase project (ref
  `epcnkncyxqgscrejinwr`). Schema, RLS, server-authoritative writes, attempt
  persistence, remediation gating, and the certificate gate were all
  verified against the real database, not only locally. See
  `docs/course-audit/modules/module-12.md`'s "Owner local QA approval +
  certification migration applied and verified" section and
  `implementation-log.md` Step 97 for the full verification record.
- **LIVE CADENCE INTEGRATION: PENDING CADENCE SWEEP** — Part III's live
  Cadence grading has never been exercised against a real
  `ANTHROPIC_API_KEY` in this environment. The engine, prompts, and
  persistence are all built and unit-tested; only the live model call is
  unverified.
- **PRODUCTION DEPLOYMENT: NOT AUTHORIZED.** No merge, no deploy.

This means the sweep below is being built on top of a **real, working,
server-authoritative persistence foundation** — not a prototype. Attempt
records, scores, critical-domain results, remediation, and certification
decisions are already fully backend-authoritative and RLS-protected. The
sweep's job is the Cadence *experience* layer (UX, conversation model,
model/provider architecture), not re-proving the trust boundary.

---

## 2. Architectural truth the sweep must inherit

### 2.1 Supabase certification attempt persistence

Table: `public.certification_attempts` (one row per attempt). Key columns:
`status` (`in_progress → part1_locked → part2_locked → part3_locked →
scored → passed/not_yet_passed`), `part1_responses`/`part2_case_state`/
`part3_conversation_state` (jsonb, one persistence blob per part),
`knowledge_score`/`applied_cases_score`/`interview_score`/`overall_score`,
`critical_domain_results` (jsonb array), `certification_decision`
(`'pass'|'not_yet_passed'|null`). `unique(user_id, course_slug,
attempt_number)` prevents attempt forgery/replay. RLS: `select`-own only,
**no client insert/update policy on any of the four certification tables**
— every write goes through the service-role key inside
`functions/api/certification/*.js`. Verified live in Step 97 (anonymous
INSERT → 401 RLS rejection; anonymous UPDATE → real no-op).

Three related tables, same trust model: `certification_remediation_assignments`
(grouped by competency/domain, not per-question), `certification_educator_requests`
(Attempt-4 unlock, MVP manual-scheduling), `certification_review_requests`
(human review/appeal, MVP).

### 2.2 Checkpoint/progress architecture (unchanged by Module 12, worth knowing)

Separate from certification: `assets/js/headspa-state.js` (`APP_STATE`,
`localStorage` key `levo_app`) is the course's per-module progress/state
engine; `assets/js/aimt-progress-sync.js` hooks `APP_STATE.save()` and syncs
to Supabase `course_progress` (`state` jsonb, `progress_score`), merge rule
**higher progress score wins** (do not weaken this rule — see `CLAUDE.md`).
This is the *instructional-module* checkpoint system (`m1cp1`, `m2cp1`,
etc.) — a different code path from certification. Module 12 eligibility
(`functions/_lib/certification/auth.mjs`'s `hasCompletedInstructionalModules()`)
reads this same `course_progress.state.progress['0'..'11'].complete`
server-side rather than trusting a client flag — the sweep should follow
this same "read the server-synced state, never trust a client flag"
pattern for any new Cadence persistence.

### 2.3 Part III interview persistence (the closest existing analog to what the sweep will build)

`functions/api/certification/get-part.js` / `submit-interview-turn.js`
implement a real, tested conversation-turn state machine: sequential,
ID-tracked interview selection (`functions/_lib/certification/interview-progression.mjs`'s
`findNextInterview()`), a max-one-follow-up rule enforced server-side, a
finalized-conversation lock (resubmission short-circuits with
`{finalized:true, alreadyFinalized:true}`), and transcript state persisted
in `certification_attempts.part3_conversation_state` (jsonb). This is a
**working reference implementation** of "persist a multi-turn AI
conversation server-authoritatively, enforce turn limits server-side, lock
once finalized" — the sweep's "transcript persistence" and "safe
unfinished-state exit/resume" items (Section 3, #6/#7) should study this
code path before designing a new one.

### 2.4 Server-authoritative grading

`functions/_lib/certification/cadence-grader.mjs` calls the Anthropic
Messages API **directly** from the Cloudflare Pages Function (fetch only,
zero npm dependencies, matching `CLAUDE.md`) — deliberately **not** routed
through the client-facing `headspa-proxy` Worker, because certification
rubrics must never reach the browser. Two entry points:
`evaluateInterviewTurn()` (Part III conversation grading — criterion-level
0/1/2 scoring against a human-authored rubric, explicit-unsafe-domain
detection, pattern-tag detection for the Type-B repeated-pattern gate, one
optional follow-up, a `transitionLine` for UX) and
`evaluateStructuredCasePart()` (Part II short-response case grading).
Neither ever lets Cadence invent new criteria — both are constrained to the
rubric passed in. **This is the existing model for "conversational
checkpoint grading"** (sweep item #2) — the sweep is extending/generalizing
this pattern to instructional-module checkpoints, not inventing grading
from scratch.

### 2.5 Remediation records

`functions/_lib/certification/attempt-ladder.mjs`'s
`collectWeakCompetencyAreas()` + `buildRemediationAssignments()` group
deficiencies by competency/domain (never one row per missed question) and
stamp `remediation_activity: 'course_review'` — the one implemented MVP
activity type. `functions/api/certification/complete-remediation.js` is the
one backend-authoritative completion action (idempotent, ownership-checked).
A reflection/application activity type remains architecturally possible
later without a schema change; none was authored (explicit "do not invent
exercises the course never taught" instruction).

### 2.6 Review Mode

`assets/js/module12-certification.js`'s `ReviewMode` renders entirely from
a local fixture set (`fixtureStatusFor()`) — by construction, not by a
server-side Review-Mode check, no authoritative attempt/certificate/
remediation/review record is ever written, and no real endpoint is ever
called. If the sweep adds any new "preview/demo" surface for the
Cadence experience, follow this same by-construction-isolated pattern
rather than a server-side flag that could be spoofed.

### 2.7 Existing Cadence APIs

Two separate live integration points, **not currently unified**:

- **`cadence-worker/worker.js`** (Cloudflare Worker, deploys separately —
  paste into the dashboard, not via Pages) — proxies client-facing,
  client-visible checkpoint chat prompts (module guide conversations,
  `m1cp1`-style checkpoint grading) to Anthropic. Model allowlist:
  `ALLOWED_MODELS = ['claude-sonnet-4-20250514']` (hardcoded in the Worker
  file).
- **`functions/_lib/certification/cadence-grader.mjs`** (Cloudflare Pages
  Function, deploys with Pages) — server-side-only certification grading,
  never reaches the browser. Model: `ALLOWED_MODEL =
  'claude-sonnet-4-20250514'` (hardcoded, independently, in this file).

**Both currently hardcode the same model string independently** — there is
no shared/centralized provider-config module. This is exactly the gap
sweep items #10–#14 (centralized provider/model config, separate chat vs.
grading models, promotion/regression tests, model/version logging,
rollback) are meant to close. Today: one env var (`ANTHROPIC_API_KEY`),
two independent hardcoded model constants, two independent call sites, no
version logging, no rollback mechanism, no "latest model" auto-switching
(which is good — sweep item #15 says keep it that way, just make it a
deliberate architectural property instead of an accident of two files
happening to agree).

### 2.8 Existing model/provider configuration

No `ANTHROPIC_API_KEY` provisioning status could be confirmed for the
Cloudflare Pages Functions runtime from this session — no available tool
inspects Pages project environment variables (only Supabase MCP tools and
general Cloudflare account tools for D1/KV/R2/Workers were available). The
Worker's copy of the same secret is a separate binding (same key value,
different place it's configured) — per `cadence-grader.mjs`'s own header
comment. **Confirm both are actually set before beginning any live-model
sweep work** — this was explicitly not blocked on by the migration task per
its instructions, but it does block real Part III grading QA and should be
the sweep's first checked item.

### 2.9 Existing transcript behavior

Part III's transcript lives in `certification_attempts.part3_conversation_state`
(jsonb) — one blob per attempt, server-authoritative, RLS-protected,
never client-writable. There is currently no cross-checkpoint or
cross-module persistent transcript — each module checkpoint's Cadence
conversation is its own short-lived exchange via the Worker, not persisted
long-term the way Part III's is. If the sweep's "full-screen persistent
text-message UX" (item #1) and "transcript persistence" (item #6) intend a
durable, resumable conversation history across the whole course (not just
inside one certification attempt), that is new schema/architecture, not an
extension of anything that exists today — treat it as new design work, not
a refactor of Part III's pattern.

### 2.10 Known gaps entering the sweep

- Two independent hardcoded model constants (Section 2.7) — no
  centralized config.
- No model/version logging or promotion/regression test framework exists
  anywhere in this codebase today.
- No mobile-native composer, voice-input architecture beyond the existing
  per-checkpoint `startVoice()`/mic-button pattern (works, but is a
  per-instance pattern, not a shared component).
- No durable cross-module transcript store (Section 2.9).
- `ANTHROPIC_API_KEY` provisioning status unconfirmed in the live
  Cloudflare Pages runtime (Section 2.8) — check this first.
- No real device-lab QA (screen-reader, physical-keyboard, real touch) has
  been performed anywhere in this course, Module 12 included — this is a
  standing gap across every module, not new to Cadence.

---

## 3. Planned Cadence sweep areas (not implemented by this handoff)

The following is the locked scope list for the sweep task. **None of this
is authorized or begun by this document** — it is recorded here only so the
sweep task starts from an agreed list rather than rediscovering it.

1. Full-screen persistent text-message UX
2. Conversational checkpoint grading
3. Mobile-native composer
4. Voice input
5. Transcript persistence
6. Retry/recovery
7. Safe unfinished-state exit/resume
8. Read-only passed-checkpoint state
9. Optional non-graded Ask Cadence
10. Server-side centralized provider/model configuration
11. Separate chat and grading models
12. Controlled model promotion/regression tests
13. Model/version logging
14. Rollback
15. No automatic "latest model" switching
16. Course-wide Cadence/checkpoint visual consistency

---

## 4. What this document does not do

This handoff does not authorize building, redesigning, or touching any of
Section 3's items, the full-screen Cadence UX, the global persistent
conversation model, Ask Cadence, voice architecture, checkpoint-wide
conversation behavior, AI provider/model strategy, chat-vs-grading model
split, model promotion/regression framework, or a global transcript system.
It is a map for the task that will do that work — not that work itself.

**Recommended first step for the sweep task:** confirm `ANTHROPIC_API_KEY`
is actually provisioned in both the Cloudflare Pages Functions runtime and
the `headspa-proxy` Worker (Section 2.8) before any live-model design or
QA work begins.
