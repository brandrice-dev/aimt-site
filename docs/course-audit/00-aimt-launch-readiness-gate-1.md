# AIMT Launch Readiness — Gate 1: Production Wiring + Progress/Certification Integrity

**Date:** 2026-08-29
**Branch:** `course-audit-build`, starting HEAD `5d18c3c`
**Scope:** First coordinated launch-readiness gate. Audit + verification only —
Cadence model/personality work is closed per this task's own instruction
("unless this audit finds a real production blocker" — it did not; see
Section 4's findings, which are governance/config gaps, not model-quality
regressions). **Zero code changes were made in this task.** Every finding
below was either VERIFIED sound, or is documented as a blocker for a
dedicated follow-up task, per this task's explicit boundaries (see
"Why nothing was fixed in this task" at the end).

> **Update (2026-08-29, Step 121):** P0-2 (entitlement claiming) has since
> been closed under a separate, owner-authorized, narrowly-scoped follow-up
> task. See the "RESOLUTION" note under Section 4's P0-2 finding below, and
> `implementation-log.md`'s Step 121 entry for full detail. This document's
> own findings and history are left otherwise unmodified.

> **Update (2026-08-29, Step 122):** P0-1 (Worker production authority
> split) and P1-1 (checkpoint model-role mismatch) have both since been
> closed under a separate follow-up task (Model Authority Consistency +
> Legacy Worker Exit). See the "RESOLUTION" notes under Section 4's P0-1
> and P1-1 findings below, Section 2's updated Worker classification, and
> `implementation-log.md`'s Step 122 entry for full detail. **No P0
> blockers remain as of this update.** This document's own findings and
> history are left otherwise unmodified.

> **Update (2026-08-29, Step 123):** P1-2 (Module 12 Part II had no
> in-flight lock), P2-4 (Part III's lock was a non-atomic TOCTOU claim), and
> P2-5 (`finalize-assessment.js` could insert duplicate remediation rows
> under a concurrent double-finalize) have all since been closed under a
> separate, owner-authorized follow-up task (Module 12 Certification
> Concurrency Hardening). See the "RESOLUTION" notes under Section 4's P1-2
> finding and this section's P2-4/P2-5 findings below, and
> `implementation-log.md`'s Step 123 entry for full detail. **No P0 or P1
> blockers remain from this document's findings as of this update.** This
> document's own findings and history are left otherwise unmodified.

---

## 1. What actually runs in production today — three request paths, verified by reading the live code

### 1.1 Ask Cadence
Browser: `assets/js/cadence-shell.js`'s `openAskCadence()` (bottom pill,
`headspa-mastery.html`'s `toggleGuide()`) → `POST /api/cadence/ask` →
`functions/api/cadence/ask.js` → `functions/_lib/cadence/ask-cadence.mjs`'s
`askCadenceServerSide()` → `resolveCadenceModel(env, 'CADENCE_CHAT_MODEL')`
(`functions/_lib/cadence/model-config.mjs`, registry v5, `APPROVED`:
`claude-sonnet-5`) → Anthropic directly. Persistence:
`functions/_lib/cadence/threads.mjs` → `cadence_threads`/`cadence_messages`
(diagnostic transcript only). Progress/certification authority: **none** —
`ask.js` has no import of `checkpoint-evaluation.mjs`, no write path to
`course_progress` or `certification_attempts`, verified by source shape and
test. **VERIFIED sound.**

### 1.2 M0–M11 required checkpoint grading (all 22 checkpoints)
Browser: `submitCheckpoint()` (`headspa-mastery.html:8224`) →
`evaluateCheckpointAnswer()` (`:8146`) → `POST /api/cadence/evaluate-checkpoint`
→ `functions/api/cadence/evaluate-checkpoint.js` →
`functions/_lib/cadence/checkpoint-evaluation.mjs`'s
`evaluateCheckpointServerSide()` → structured evidence returned by the
model → `decideCheckpointOutcome()` (pure, human-authored, never the
model's own prose) decides pass/revise → `resolveCadenceModel(env,
'CADENCE_CHAT_MODEL')` (**see Finding P1-1** — not `CADENCE_GRADING_MODEL`)
→ Anthropic directly. Persistence: `cadence_threads`/`cadence_messages`
(diagnostic) plus, client-side, `APP_STATE.setCheckpointResult()` →
`course_progress` via `aimt-progress-sync.js` (authoritative,
higher-score-wins merge, unchanged). **This is the real, current path —
the old browser → `headspa-proxy` Worker → client-trusts-`pass`-field
architecture the original audit found is gone for real (non-Review-Mode)
traffic.** Review Mode is the one deliberate exception — see Section 3.

### 1.3 Module 12 Part III (certification interview conversation)
Browser: `assets/js/module12-certification.js`'s `onSendInterviewTurn()` →
`POST /api/certification/submit-interview-turn` →
`functions/api/certification/submit-interview-turn.js` → resolves the
attempt (ownership-scoped: `id=eq.&attemptId&user_id=eq.&user.id`) →
`functions/_lib/certification/cadence-grader.mjs`'s
`evaluateInterviewTurn()` → `resolveCadenceModel(env,
'CADENCE_GRADING_MODEL')` (**correctly** the grading role) → Anthropic
directly, **never** through the Worker (rubrics never reach the browser,
by design). Persistence + authority: `certification_attempts.
part3_conversation_state` (jsonb), server-authoritative, RLS blocks any
client insert/update, `scoreInterviewConversation()`/`scoring.mjs` decides
pass, never the model's own prose. **VERIFIED sound**, matches the
build contract's Mode B authority table exactly.

---

## 2. cadence-worker/worker.js classification

**UPDATE (2026-08-29, Step 122): superseded — see the P0-1 RESOLUTION note
under Section 4 below.** The verdict and evidence in this section are left
unmodified as the historical record of what this document originally
found; the Worker has since been fully exited from the active student
path and is now classified **LEGACY / NOT REQUIRED FOR CURRENT STUDENT
PRODUCTION**.

**Original verdict (2026-08-29, Step 120): ACTIVE REQUIRED PRODUCTION
AUTHORITY — but only for two unmigrated features, not for Ask Cadence,
checkpoint grading, or Module 12.**

The Worker (`headspa-proxy`, deploys by manual dashboard paste, never via
Pages) was, at the time this section was originally written, genuinely
still live and required for:

- `evaluateScript()` (`headspa-mastery.html:9267`) — Module 2's
  aromatherapy-script feedback tool, unconditionally reachable in
  production.
- `submitIntro()` (`headspa-mastery.html:10883`) — the new-student
  onboarding welcome-response generator, unconditionally reachable in
  production.

Both called `callAI()` → `PROXY_URL` (`https://headspa-proxy.brandrice.workers.dev/`)
→ the Worker directly, with **no Pages Function counterpart**. Neither had
a fallback path if the Worker was unreachable or misconfigured (they
degraded gracefully — no crash — but the AI feedback was simply lost).
**Both have since been migrated onto their own Pages Function endpoints —
see the P0-1 RESOLUTION note under Section 4.**

Everything else that used to depend on the Worker had already migrated
away from it: Ask Cadence (`/api/cadence/ask`), real checkpoint grading
(`/api/cadence/evaluate-checkpoint`), and Module 12 (never used it). The
old floating guide panel (`gpSend()`) is confirmed dead code — deactivated,
unreachable, per the code's own comment and commit `e062641`. Review Mode's
checkpoint evaluator (`evaluateCheckpointAnswerReviewMode()`) also still
calls the Worker directly by deliberate design (Section 3), but it is
**hard-blocked on all production hostnames** — not a real student-facing
risk, and the one remaining legitimate reason the Worker stays in the
repository rather than being deleted.

**Original recommendation (superseded by the actual resolution): "Do not
eliminate the Worker. It is required."** That was correct at the time —
the migration this section speculated about ("too large for this audit's
surgical-fix policy") was completed as a dedicated follow-up task (Step
122), and the Worker's classification has changed accordingly. It remains
in the repository, undeleted, for Review Mode's Worker-only QA path and
historical/rollback reference — see Section 4's P0-1 resolution for the
full detail.

---

## 3. Review Mode isolation — VERIFIED, not a blocker

`window.ReviewMode` (`assets/js/headspa-state.js:31-109`) is **hard-blocked
on all production hostnames** (`aimtrichology.com`, `www.aimtrichology.com`,
`aimt-site.pages.dev`) — `init()` force-clears any stale session flag and
sets `_active = false` unconditionally before any query-param check runs.
It is purely a client-side signal; grepped every file under `functions/`
for any review/test/debug/bypass flag — **zero server-side references
exist anywhere.**

Blast radius if reached (only possible on `localhost` or a
`*.aimt-site.pages.dev` branch-preview URL):
- Checkpoints: `submitCheckpoint()` branches to `submitCheckpointReviewMode()`
  before the real endpoint is ever called; its completion handler never
  calls `APP_STATE.setCheckpointResult()` or any other mutator —
  by construction, not a flag check.
- Course progress: `APP_STATE.save()` (`headspa-state.js`) no-ops when
  Review Mode is active; `AIMT_SYNC.init()` (`aimt-progress-sync.js`)
  refuses to even initialize, so the Supabase push path is structurally
  unreachable.
- Module 12: `assets/js/module12-certification.js`'s `isReview()` guards
  every function that would otherwise call a real `/api/certification/*`
  endpoint — verified 12 separate guard sites, all short-circuiting to
  local fixture rendering before any network call. Certificate issuance is
  explicitly blocked with an alert before `showCertificate()` would POST.
- Both `certification_attempts` and `cadence_threads`/`cadence_messages`
  have **no insert/update RLS policy for the `authenticated` role at
  all** — even a hypothetical direct client write would be rejected by
  the database itself, independent of any application-level guard.

**Verdict: VERIFIED. No path from Review Mode to any authoritative write,
in any mode, anywhere in the codebase.**

---

## 4. Findings requiring owner action before launch

### P0 — MUST FIX BEFORE PRODUCTION DEPLOY

**P0-1. The `headspa-proxy` Worker's live configuration is unverified and,
per its own committed code, likely fails safe (503) for two real student
features right now.**
- *Evidence:* `cadence-worker/worker.js`'s repo-committed
  `resolveChatModel()` mirrors registry `v2` (`APPROVED_CHAT_MODEL = null`,
  `CANDIDATE_CHAT_MODEL = 'claude-sonnet-5'`). With no override it returns
  `null` (fail-safe 503) unless the Worker's **own separate** Cloudflare
  environment variable `CADENCE_CHAT_MODEL` is explicitly set to
  `claude-sonnet-5`. The original launch-sweep audit additionally found the
  **actually-deployed** Worker running an unregistered `claude-sonnet-4-6`
  string that matches none of the repo's tracked lifecycle states — that
  drift has never been reconciled or re-verified since, and this task
  cannot inspect Cloudflare bindings to check.
- *Affected:* `evaluateScript()` (Module 2 script feedback),
  `submitIntro()` (onboarding welcome response) — both unconditionally
  reachable by every real student, unlike Review Mode's parallel use of
  the same Worker.
- *User impact:* silent AI-feedback failure (degrades gracefully, no
  crash, but the feature simply does not work) on two live, unmigrated
  features, invisible to this Claude session.
- *Recommended smallest fix:* owner confirms, in the Cloudflare dashboard
  (Workers & Pages → `headspa-proxy` → Settings → Variables), that
  `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS`, `STAFF_EMAILS`, and
  `CADENCE_CHAT_MODEL=claude-sonnet-5` are all set, and reconciles the
  Worker's actually-deployed source against the repo's committed copy
  (re-paste if it still shows `claude-sonnet-4-6` or anything else
  unregistered). Longer-term: migrate these two features to Pages
  Functions (Section 2) to retire this whole dual-authority problem.
- *Code change required:* no (owner dashboard action); a follow-up
  migration task is recommended but not required to unblock this specific
  gap.
- *Verification to close:* re-fetch the Worker's live source via the
  Cloudflare API (as the original audit did) and confirm it matches the
  repo; or simply exercise `evaluateScript()`/`submitIntro()` against the
  live production URL post-deploy and confirm a real (non-503) response.

**RESOLUTION (2026-08-29, Step 122) — P0-1 CLOSED via full migration off the
Worker, not via Cloudflare config verification.** Rather than verify/
reconcile the Worker's live Cloudflare configuration (this task had no
Cloudflare access and was instructed not to touch Cloudflare secrets),
`evaluateScript()` and `submitIntro()` were migrated onto two new Pages
Function endpoints — `functions/api/cadence/evaluate-script.js` and
`functions/api/cadence/submit-intro.js` — eliminating the dual-authority
problem entirely rather than reconciling it. Both endpoints follow the
exact auth → rate-limit → entitlement → model-call shape every other
Cadence Pages Function uses (`resolveUser()`, `checkRateLimit()`,
`isEntitled()`), and resolve the model through a shared primitive,
`callCadenceChatModel()`, extracted from `functions/_lib/cadence/
ask-cadence.mjs`'s previously-internal `callAnthropicForAskCadence()` —
the same centralized `CADENCE_CHAT_MODEL` role every other Chat-role call
site already resolves, not a new or duplicated model authority. Both
endpoints accept a client-supplied `system` string, the same
"client supplies content, server supplies authority" trust boundary this
document's Section 1.1 already established for `ask.js`'s
`guideSystemPrompt` — there is no decision function in either path (no
pass/fail, no progress write), so this carries the identical
no-authority-risk shape Ask Cadence already has.

Neither feature was routed through `askCadenceServerSide()` itself
(Ask Cadence's real endpoint) because the semantics genuinely differ: no
conversation thread, no checkpoint-guardrail injection, no scenario-fact
gate applies to either (Module 2 script feedback and a one-time onboarding
welcome response are not scenario-based practice guidance). Confirmed by
reading both callers before migrating: neither graded, wrote
`course_progress`, nor persisted a transcript before this change (each
carried its own explicit "does not touch APP_STATE/progress" comment), and
neither does now — the migration changed only the transport (Worker →
Pages Function), not persistence behavior, prompt content, response shape,
or student-facing UI. `submitIntro()`'s course-unlock side effects
(`APP_STATE.setStudent({introComplete: true, ...})`,
`persistCadenceWelcomeComplete()`) already happened unconditionally,
client-side, before the AI call even in the original architecture — this
migration did not change that.

`headspa-mastery.html`'s diff is 46 insertions / 2 deletions: one new
`callCadenceFormative()` client helper (mirroring `callAI()`'s shape:
optional bearer token, POST, `{text, modelInfo}` return) plus swapping
`evaluateScript()`/`submitIntro()`'s one `callAI(...)` call each for
`callCadenceFormative('/api/cadence/evaluate-script', ...)` /
`callCadenceFormative('/api/cadence/submit-intro', ...)`. `callAI()` and
`PROXY_URL` are otherwise untouched — they remain the correct transport
for `evaluateCheckpointAnswerReviewMode()` (Review Mode, deliberately kept
off the server-authoritative endpoint by design, Section 3 above) and the
already-deprecated, unreachable legacy guide panel (`gpSend()`/`qa()`,
confirmed dead by this document's own Section 2 finding).

**Worker reachability audit (Step 122, Section 10 of the task prompt):**
searched every active server-side file (`functions/api/cadence/*.js`,
`functions/_lib/cadence/*.mjs`, `functions/_lib/certification/
cadence-grader.mjs`) and `headspa-mastery.html` for the Worker's URL,
`APPROVED_CHAT_MODEL`/`ALLOWED_MODELS` constants, and any remaining
`evaluateScript`/`submitIntro` Worker call. Result: **zero current
student-facing production paths invoke the Worker.** The only remaining
`callAI()`/`PROXY_URL` references are Review Mode (hard-blocked on all
production hostnames, Section 3) and the confirmed-dead guide panel.
`cadence-worker/worker.js` is retained in the repository (not deleted,
per this task's own "do not delete merely for neatness" instruction) and
is now classified **LEGACY / NOT REQUIRED FOR CURRENT STUDENT
PRODUCTION** — kept for Review Mode's deliberately-isolated
Worker-only QA path and historical/rollback reference, no longer an
active dual authority for any student-facing feature. Verified by
`tests/cadence-worker-migration.test.mjs` (66 assertions).

**P0-1: CLOSED. No P0 blockers remain.**

**P0-2. `claim-course-access.js` trusts a client-supplied `userId` with no
bearer-token verification binding it to the actual caller.**
- *Evidence:* `functions/api/claim-course-access.js` reads
  `body.userId` directly (`:123`) and passes it straight to
  `upsertEntitlement()` (`:96-115`, `on_conflict=checkout_session_id,
  resolution=merge-duplicates` — a later call **overwrites** an earlier
  one's `user_id`). There is no `resolveUser(env, request)` call anywhere
  in this file — every other entitlement-gated endpoint in this codebase
  (`ask.js`, `evaluate-checkpoint.js`, every `certification/*.js`)
  authenticates the caller first; this one does not.
- *User impact:* the security boundary is entirely "you supplied a real,
  paid Stripe `sessionId`" (unguessable, verified live against Stripe) —
  this is not a free-access bug. But if a real paid `sessionId` is ever
  observed by anyone other than its rightful purchaser (browser history on
  a shared device, a leaked `success.html` URL, a referrer leak), whoever
  calls this endpoint **last** with that session ID decides which account
  the paid entitlement attaches to — a real entitlement-hijack path, not
  merely theoretical, given `merge-duplicates` makes it last-write-wins
  rather than first-write-wins.
- *Recommended smallest fix:* require `resolveUser(env, request)` and use
  the caller's own authenticated `user.id`, ignoring/cross-checking any
  client-supplied `userId`, matching the pattern every other endpoint in
  this codebase already uses.
- *Code change required:* **yes — entitlement/payment logic.** Per
  `CLAUDE.md`'s hard rule 1 ("Never touch entitlement/auth/payment logic
  without being explicitly asked"), **this was deliberately NOT fixed in
  this task.** Flagged here for explicit owner authorization.
- *Verification to close:* a test proving a request with a `userId`
  mismatched from the bearer token's real identity is rejected or
  corrected to the authenticated identity, plus a live Stripe-sandbox
  checkout confirming the normal flow still works.

**RESOLUTION (2026-08-29, Step 121, owner-authorized) — P0-2 CLOSED.**
`functions/api/claim-course-access.js` now calls `resolveUser(env, request)`
(`functions/_lib/certification/auth.mjs`, the same shared bearer-token
helper every other entitlement-gated endpoint in this codebase already
uses) unconditionally, before any Stripe call. A missing or invalid/expired
token returns 401. `body.userId` was removed from the request contract
entirely — the written `user_id` is always `authenticatedUserId`, derived
only from the verified token, never a client-supplied value. This alone
closes the literal finding above (client-supplied `userId`, zero
verification).

A second layer was required because authentication alone does not stop the
entitlement-hijack scenario this finding specifically named: a signed-in
attacker who merely *observes* someone else's real, paid session ID
(shared-device browser history, a leaked confirmation link) could still
bind that stranger's purchase to their own authenticated account, since
`upsertEntitlement()`'s `merge-duplicates` semantics make the last caller's
write win. Closed by requiring the authenticated caller's own verified
email to equal the checkout session's Stripe-verified email
(`authenticatedEmail !== sessionEmail` → 403). This is not a new
invariant — it is the same "purchaser email must match Stripe truth" check
the old code already applied to a client-supplied string (weak, optional,
spoofable); every legitimate current caller already sends the signed-in
account's own email here, so no legitimate flow's behavior changed.

Verified by `tests/claim-course-access-auth.test.mjs` (36 assertions):
unauthenticated and invalid-token requests rejected 401 with no write; a
client-supplied `userId` never reaches the written row under a valid
authenticated claim; User A authenticated against User B's real paid
session is rejected 403 (with and without an accompanying spoofed
`userId`) and B's existing entitlement row is left untouched; the rightful
authenticated purchaser's own claim succeeds and writes the correct
`user_id`/email; unpaid and wrong-price sessions are still rejected 400
with no write; a duplicate/retried legitimate claim is idempotent (one
row, correct owner); an unrelated rejected claim never touches a different
account's existing row; the Supabase service-role key and Stripe secret
key never appear in any response body. All three client callers
(`success.html`, `student-access.html`, `headspa-mastery.html`) updated to
send `Authorization: Bearer <access_token>` and stop sending `userId` —
verified this is a no-op for every legitimate flow (see Step 121,
`implementation-log.md`, for the full call-site-by-call-site trace). Full
suite: 33/33 test files pass, `git diff --check` clean, zero live
Stripe/Anthropic calls. No Cadence/Module 12/curriculum file touched.

One residual, non-blocking observation from the post-fix security review:
an authenticated caller who already possesses someone else's unguessable
session ID can still distinguish 400 (unpaid/wrong price) from 403 (paid,
wrong owner) — an existence/payment-status oracle, not an access bypass
(the entitlement itself is never written or exposed), and no worse in kind
than the pre-fix code's own Stripe-error passthrough. Not fixed in this
task; noted for a future hardening pass, not launch-blocking.

### P1 — MUST COMPLETE BEFORE PUBLIC COURSE LAUNCH

**P1-1. M0–M11 checkpoint grading is bound to the `CADENCE_CHAT_MODEL`
role, not `CADENCE_GRADING_MODEL` — despite being a grading function, and
despite the entire 72-case validation program that justified
`CADENCE_GRADING_MODEL`'s approval actually testing checkpoint grading.**
- *Evidence:* `functions/_lib/cadence/checkpoint-evaluation.mjs:270` —
  `resolveCadenceModel(env, 'CADENCE_CHAT_MODEL')`. But
  `scripts/cadence-model-regression/grading-dataset.mjs` (the 72-case
  suite, the 17-case sentinel, the stability rerun — the entire evidence
  trail behind `CADENCE_GRADING_MODEL`'s promotion) is keyed by
  `checkpointId` and resolves against `CADENCE_GRADING_MODEL`
  (`scripts/run-cadence-model-regression.mjs:269`). The role that was
  *validated* for checkpoint grading is not the role checkpoint grading
  actually *uses* in production.
- *User impact today:* **none** — `claude-sonnet-5` is `APPROVED` for both
  roles with matching execution configs, so the two roles currently
  resolve identically. The gap is architectural, not behavioral, today.
- *Future risk:* the entire point of two independent roles is independent
  rollback/promotion. If `CADENCE_CHAT_MODEL` is ever rolled back (e.g. a
  future Chat-only regression) while `CADENCE_GRADING_MODEL` stays
  approved, all 22 M0–11 checkpoints would silently start failing —
  not because the validated grading model failed, but because of this
  role-binding mismatch. Conversely, a deliberate grading-only rollback
  would have **zero effect** on the very system its own evidence was
  built to validate.
- *Recommended smallest fix:* change the one line in
  `checkpoint-evaluation.mjs` to resolve `CADENCE_GRADING_MODEL` instead,
  matching `cadence-grader.mjs`'s (Module 12's) already-correct pattern.
- *Code change required:* yes, but this task's own Section 11 instruction
  ("Do NOT change Module 12. Verify only") and the DO NOT list's "do not
  reopen model selection" made this out of scope for surgical fixing here
  — deliberately **not fixed**, flagged for an explicit, owner-authorized
  follow-up.
- *Verification to close:* the existing `tests/cadence-*-promotion.test.mjs`
  pattern extended to assert checkpoint grading resolves
  `CADENCE_GRADING_MODEL`; a targeted live retest of one checkpoint to
  confirm no regression.

**RESOLUTION (2026-08-29, Step 122) — P1-1 CLOSED.**
`functions/_lib/cadence/checkpoint-evaluation.mjs`'s
`callAnthropicForCheckpoint()` now calls `resolveCadenceModel(env,
'CADENCE_GRADING_MODEL')` — the one-line fix this finding's own
"recommended smallest fix" described, with no other change to the
function. Checkpoint IDs, questions, rubrics, the structured-evidence
contract, and `decideCheckpointOutcome()`'s pure pass/revise rule are all
byte-identical to before this fix — confirmed by the full, unmodified
`tests/cadence-checkpoint-authority.test.mjs` compatibility suite (16/16
response-category matches across two real checkpoints) still passing
without modification to its expected outcomes. Zero behavioral change
today, exactly as this finding predicted (`claude-sonnet-5` is `APPROVED`
for both roles with identical execution configs), but the independent-
rollback hazard is closed: `CADENCE_CHAT_MODEL` and `CADENCE_GRADING_MODEL`
can now genuinely be rolled back independently without silently breaking
the other's already-validated behavior. Three pre-existing test files that
had encoded the old (wrong) `CADENCE_CHAT_MODEL` binding as an explicit
expectation were corrected to match reality:
`tests/cadence-grading-promotion.test.mjs`'s rollback-path static check,
and the mock `env` objects in `tests/cadence-checkpoint-authority.test.mjs`
and `tests/cadence-grading-recovery.test.mjs` (functionally inert since
`CADENCE_GRADING_MODEL` already has an `APPROVED` default, but corrected
for accuracy). Verified by `tests/cadence-worker-migration.test.mjs`'s
MODEL ROLE BINDING suite, which asserts the fix directly against the real
source (checkpoint grading resolves `CADENCE_GRADING_MODEL`, never
`CADENCE_CHAT_MODEL`; Ask Cadence still resolves `CADENCE_CHAT_MODEL`;
Module 12 still resolves `CADENCE_GRADING_MODEL`; both roles' approved
execution configs — chat adaptive/low/2048, grading adaptive/medium/4096 —
remain unchanged).

**P1-1: CLOSED.**

**P1-2. No true distributed rate limiting exists anywhere; `submit-case.js`
(Module 12 Part II) has no in-flight lock at all, the worst race window
in the codebase.**
- *Evidence:* every counting rate limiter in this codebase
  (`functions/_lib/cadence/rate-limit.mjs`'s four consumers, plus the
  Worker's separate limiter) is a bare in-memory `Map` scoped to one V8
  isolate — acknowledged in the code's own comments as a deliberate,
  documented trade-off. No Cloudflare KV, no Durable Object, no
  Supabase-table-backed limiter exists anywhere in this repo.
  `functions/api/certification/submit-interview-turn.js` has a real
  (if non-atomic, TOCTOU-vulnerable) in-flight lock
  (`functions/_lib/cadence/turn-lock.mjs`); `functions/api/certification/
  submit-case.js` — the sibling Module 12 Part II endpoint — has **no
  lock of any kind**, only a plain read-then-blind-PATCH duplicate check,
  with a race window spanning the entire Anthropic evaluation loop, not
  just one round trip.
- *User impact:* a double-tap/double-tab submission during Part II can
  cause double Anthropic spend and a last-write-wins overwrite of a
  case's score — not a security hole, but a real correctness/cost gap in
  a system whose whole purpose is trustworthy certification scoring.
- *Recommended smallest fix:* apply the exact same
  `isTurnLockActive`/`claimTurnLock`/`releaseTurnLock` pattern
  `submit-interview-turn.js` already uses (tested, proven) to
  `submit-case.js`. This is genuinely small and reuses an existing
  primitive — **deliberately not implemented in this task** per Section
  11's explicit "Do NOT change Module 12. Verify only," which overrides
  this audit's general small-fix allowance for anything touching
  certification code.
- *Verification to close:* the existing `turn-lock.mjs` unit tests extend
  trivially to a second call site; a concurrency test firing two
  `submit-case` requests for the same case and asserting only one
  Anthropic call occurs.

**RESOLUTION (2026-08-29, Step 123, owner-authorized) — P1-2 CLOSED.**
`submit-case.js` now claims a per-case in-flight lock
(`part2_case_state[caseId].evalInFlightAt`, same naming convention as
Part III's `turnInFlightAt`) *before* calling Cadence, exactly as this
finding's own "recommended smallest fix" specified — but the claim itself
was hardened beyond a plain copy of Part III's read-then-write pattern:
`functions/_lib/cadence/turn-lock.mjs` gained two small helpers,
`jsonLockFieldFilterKey()` and `casPatchSucceeded()`, that turn the claim
PATCH into a genuine PostgREST conditional filter
(`part2_case_state->{caseId}->>evalInFlightAt=is.null` or
`=eq.<the-timestamp-just-read>`) — a real Postgres `UPDATE ... WHERE`
compare-and-swap, not an in-memory isolate lock. A losing concurrent
request's conditional PATCH matches zero rows and is rejected `409
inFlight:true` *before* Cadence is ever called — the race window this
finding described (spanning the entire evaluation loop) is closed
entirely, not merely narrowed to one round trip. The lock releases on both
the success path and the Cadence-failure catch path, so a provider error
never leaves a case permanently stuck; the pre-existing
`caseState[caseId].submitted` idempotent-replay check was untouched and
still handles "the commit succeeded but the client never saw the
response" for free. No case bank, scoring, rubric, or student-facing UI
change. Verified by `tests/certification-module12-concurrency.test.mjs`
(61 assertions): two identical/differing simultaneous submissions produce
exactly one authoritative result and at most one Cadence call; a retry
after a committed result is idempotent and Cadence-call-free; a provider
failure leaves the case unsubmitted with the response preserved and the
lock released for a legitimate retry. Full detail: `implementation-log.md`
Step 123.

**P1-2: CLOSED.**

- *Distributed (cross-isolate) rate limiting generally:* classified
  **ACCEPTABLE FOR INITIAL CONTROLLED LAUNCH** — every limiter's real
  ceiling is "N per isolate the traffic happens to land on," not a hard
  global cap, but for a controlled initial launch this is a real (if
  imperfect) throttle, not an absent one. **POST-LAUNCH HARDENING:**
  a Cloudflare KV-backed counter would close this properly; not built now
  per this task's explicit "do not build an elaborate system
  automatically" instruction.

**P1-3. No exit path from inside the course back to the student dashboard.**
- *Evidence:* zero references to `my-aimt` anywhere in `headspa-mastery.html`
  (confirmed by two independent greps). Every close/back/exit control
  (`showHome()`, `closeGuide()`, `closeCert()`, `redirectToStudentAccess()`)
  stays inside the course or goes to `student-access.html` — never the
  dashboard. The only way back is the browser's own back button.
- *User impact:* a returning student who lands in the course from any
  entry point other than the dashboard's own "Continue" button (a
  bookmark, a shared link, browser history) has no in-app way back to
  their dashboard, certificate, or account.
- *Recommended smallest fix:* one link/button somewhere in the course
  shell pointing to `my-aimt.html`. **Not implemented in this task** —
  per this task's own Section 12, adding it well requires a placement/
  label design decision (nav bar vs. footer vs. modal) reserved for the
  dedicated Dashboard/Resources pass, not a context-free one-line patch.
- *Verification to close:* a live-browser click-through once the
  dedicated pass adds the link.

**P1-4. Dashboard product copy promises a feature ("Performance Review...
available from your Student Dashboard") that does not exist on the
dashboard.**
- *Evidence:* `assets/js/module12-certification.js:185` states Performance
  Review "will remain available from your Student Dashboard." `my-aimt.html`
  has no Performance Review section, link, or data anywhere (`grep -i
  "performance" my-aimt.html` → zero matches). The feature itself is real
  and fully built (`performanceReviewBlock()`,
  `module12-certification.js:1288-1356`) — only reachable from inside
  Module 12, never from the dashboard.
- *User impact:* a factually false promise in student-facing copy — low
  functional risk (the data isn't lost, just not where promised) but a
  trust/accuracy issue worth fixing before public launch.
- *Recommended smallest fix:* either add the dashboard link (same
  dedicated-pass scope as P1-3) or soften the copy to not promise a
  dashboard location until it exists. **Not implemented in this task** —
  same reasoning as P1-3, reserved for the dedicated Dashboard pass.
- *Verification to close:* re-read the copy after the dedicated pass and
  confirm it matches actual dashboard capability.

### P2 — POST-LAUNCH / NON-BLOCKING POLISH

**P2-1. Certificate access from the dashboard requires several clicks
through the course, despite the button being labeled "View certificate."**
Real, working, durable flow — just not a direct deep link. Candidate for
the same dedicated Dashboard pass as P1-3/P1-4.

**P2-2. The dashboard's "Resources" section is real for its one built item
(AIMT Service Timer) but the course-downloads "Resources Library" it's
designed to hold remains empty by design.** Already correctly documented
elsewhere (`00-aimt-current-course-status.md`'s "Do not begin" list) as
deliberately deferred, not an oversight — no new finding here, just
confirmed still accurate.

**P2-3. The three downloadable PDF worksheets (Module 9/10/11) have zero
access control, not even the client-side check other content gets.**
Consistent with — not worse than — this site's existing architectural
property that all course content is served as static HTML regardless of
entitlement (a flat-HTML site with no server-rendering layer cannot do
otherwise without real infrastructure work). Not a new or distinct gap;
noted for completeness, not a launch blocker.

**P2-4. `submit-interview-turn.js`'s in-flight lock is a non-atomic
read-then-write TOCTOU claim, not a true compare-and-swap.** It closes
most of the race window (blocks a second request once the first's claim
has already committed) but not the narrow window where two `GET`s land
before either `PATCH` commits. Real but narrow; a genuine fix requires a
conditional-update primitive Supabase's REST layer doesn't trivially
expose without a stored procedure — infrastructure work, not a one-line
patch. Deferred to post-launch hardening alongside P1-2's broader
rate-limiting story.

**RESOLUTION (2026-08-29, Step 123, owner-authorized) — P2-4 CLOSED.**
This finding's own premise turned out to be wrong in one specific way,
worth correcting for the record: PostgREST's JSON-path column filters
(`?col->key->>field=is.null`) *do* compile to a real, atomic Postgres
`UPDATE ... WHERE` — no stored procedure is required to get a genuine
conditional update. `submit-interview-turn.js`'s existing claim PATCH now
uses exactly that filter (`part3_conversation_state->{interviewId}->>
turnInFlightAt` compared against the value just read), closing the TOCTOU
window this finding described: a losing concurrent claim now matches zero
rows and is rejected before Anthropic is ever called, rather than both
requests racing to evaluate. This was a two-line diff to the existing
claim call (add the conditional filter param, check the result via the
new `casPatchSucceeded()` helper) — no transcript structure, prompt,
rubric, or grading logic touched. Verified by
`tests/certification-module12-concurrency.test.mjs`'s Part III race
tests (items E/F). Full detail: `implementation-log.md` Step 123.

**P2-4: CLOSED.**

**P2-5. `submit-part1.js`/`finalize-assessment.js` have the same
read-then-blind-write shape as the other certification endpoints, but
low risk: both paths are deterministic/idempotent, no Anthropic spend, no
non-idempotent side effect beyond a possible duplicate remediation-
assignment row on a genuine double-submit race.** Worth a follow-up test,
not a blocker.

**RESOLUTION (2026-08-29, Step 123, owner-authorized) — P2-5 CLOSED for
`finalize-assessment.js`; `submit-part1.js` reassessed and confirmed to
carry no realistic risk requiring a code change.** The concrete risk this
finding named — a duplicate remediation-assignment row from a concurrent
double-finalize — was confirmed real by a dedicated concurrency test
before the fix, then closed by making the `status: 'part3_locked' →
'scored'` transition PATCH conditional on `status=eq.part3_locked` (a
plain top-level-column filter, the simplest possible instance of the same
compare-and-swap technique used for P1-2/P2-4). Only the request that wins
this atomic transition inserts remediation rows; a losing concurrent call
re-fetches and returns the now-authoritative `certification_decision`/
`overall_score` instead. Both requests still compute the identical
decision — a deterministic function of the same already-locked component
data, never a client-submitted score — so nothing needs reconciling; the
fix is about who is allowed to *write*, not about correctness of the
computation. `submit-part1.js` was re-examined and left unchanged: its
`status !== 'in_progress'` idempotency check already returns the existing
score on any re-call, its write is a deterministic function of
already-stored `part1_responses`, and it has no non-idempotent side effect
(no remediation insert, no Anthropic spend) — a concurrent double-submit
produces the same score written twice, functionally identical to a single
write, so no compare-and-swap was added there per this task's own
"surgical, not speculative" scope. Verified by
`tests/certification-module12-concurrency.test.mjs`'s finalize tests
(items G/H/I/J/K plus a dedicated sequential-idempotency check). Full
detail: `implementation-log.md` Step 123.

**P2-5: CLOSED.**

---

## 5. Items VERIFIED sound (no action needed)

- **All 22 M0–11 checkpoints** — `MODULE_CHECKPOINTS`
  (`headspa-mastery.html:7806`) matches
  `00-cadence-checkpoint-gate-map.md`'s inventory exactly, including the
  Module 9↔10 historical ID/slot swap (`m10cp1`/`m10cp2` → slot 9,
  `m9cp1`/`m9cp2` → slot 10, checkpoint IDs never renamed). Gating
  mechanism (per-checkpoint pass → module completion → next-module
  unlock) unchanged and uniform. No mid-module content-hiding gate exists
  anywhere, confirmed still true.
- **Historical passed-checkpoint preservation** — `cadence-shell.js`
  renders an honest, read-only fallback card from the student's actually-
  stored `meta.answer`/`meta.feedback` for a pre-existing pass with no
  durable transcript, never a fabricated conversation (existing test:
  `tests/cadence-phase2-shell.test.mjs`). A passed checkpoint's input
  stays permanently locked (`status === 'passed'` guard,
  `cadence-shell.js:583`); no re-interrogation path exists.
- **Cross-device / cross-session resume** — `aimt-progress-sync.js`'s
  merge rule (higher `progress_score` wins on pull, confirmed unchanged
  at `aimt-progress-sync.js:96-97`) remains the authoritative mechanism;
  `course_progress` is genuinely server-side, never `localStorage`-only,
  matching `CLAUDE.md`'s explicit rule. Module resume
  (`getResumeModuleId()`) correctly identifies the right next/in-progress
  module and lands on the course home screen with a "Continue" button —
  never silently restarts a returning student at Module 0.
- **Module 12 / certification integrity** — `certification_attempts`
  remains the sole authority (`unique(user_id, course_slug,
  attempt_number)`); scoring structure, critical-domain gate, and attempt
  ladder untouched (verified by the existing, unmodified
  `certification-*.test.mjs` suite, all passing); Part III uses its own
  state machine, never generic `cadence_messages` authority; Ask Cadence
  is both client-hidden and server-refused (403) for `moduleId: '12'`
  while an attempt is active; **`issue-certificate.js` requires
  `certification_decision: 'eq.pass'` read directly and authoritatively
  from `certification_attempts`** (`functions/api/issue-certificate.js:140-149`)
  — course completion alone cannot trigger it, and a not-yet-passed or
  failed attempt cannot reach it.
- **Entitlement gating on every Cadence/certification endpoint except
  `claim-course-access.js`** (P0-2) — every other endpoint requiring
  identity calls `resolveUser()` + either `isEntitled()` directly or
  ownership-scoping on a row that could only have been created by an
  `isEntitled()`-gated endpoint. No server-side code anywhere trusts a
  client-supplied test/review/debug flag.
- **Content readability vs. entitlement** — the full curriculum (and the
  Service Timer's protocol content) is present in the static HTML
  regardless of auth, readable via view-source. This is an inherent
  property of a flat-HTML, no-server-rendering site (per `CLAUDE.md`'s
  own architecture), not a defect introduced by any Cadence work — what
  is actually protected, consistently, is interaction, grading,
  persistence, and certification, which is the correct trust boundary
  for this architecture.
- **Failure semantics — no false failures on infrastructure error.**
  Verified across every write path: `evaluateCheckpointAnswer()`'s
  `.catch()` re-enables the input and shows a friendly error, never marks
  a checkpoint failed; `submit-interview-turn.js`'s Anthropic-failure
  catch preserves the student's response in `pendingResponse` without
  touching the graded transcript and returns `preserved:true`;
  `submit-case.js`'s catch preserves the response with `submitted:
  false` rather than scoring on a failed evaluation; the Zone B
  scenario-fact gate (verified in the prior task) fails closed to a safe
  clarifying question, never a false pass/fail. No path anywhere marks a
  student's answer as incorrect purely because Anthropic, Supabase, or
  the network failed.

---

## 6. Tests / build gate

- `git diff --check`: clean.
- No `package.json` / build tooling exists — correct per `CLAUDE.md`'s
  "no build step, no npm packages" architecture; nothing to typecheck or
  lint.
- **Full deterministic suite: 30/30 test files pass**, including every
  Cadence suite, every `certification-*.test.mjs` file, and the progress/
  checkpoint-gate tests. Zero live Anthropic API calls made anywhere in
  this task.

---

## 7. Why nothing was fixed in this task

Every concrete defect found (P0-1 Worker config, P0-2 entitlement binding,
P1-1 checkpoint model-role mismatch, P1-2 Module 12 lock gap, P1-3/P1-4
dashboard nav/copy) falls into one of this task's own explicit
carve-outs: entitlement/payment logic (`CLAUDE.md` hard rule 1, requires
being explicitly asked), Module 12/certification code ("Do NOT change
Module 12. Verify only" — Section 11), Cadence model-role binding ("do not
reopen model selection"), Cloudflare Worker configuration ("do not touch
Cloudflare secrets," and the task's own instruction to *propose*, not
build, a Worker-elimination path), or a dashboard design decision (Section
12's own "otherwise document for the dedicated Dashboard pass"). This is
the correct, conservative outcome for an audit gate — every finding is
documented with exact evidence, impact, and a recommended smallest fix, so
the owner can authorize each one explicitly rather than have it bundled
into an unrelated commit.

---

## 8. Recommended next launch gate

A **Model-Authority Consistency** follow-up (small, explicitly authorized):
fix P1-1 (checkpoint grading → `CADENCE_GRADING_MODEL`) and reconcile P0-1
(Worker config verification, and a scoped plan to migrate
`evaluateScript()`/`submitIntro()` off the Worker). In parallel or after:
a **Module 12 Concurrency Hardening** task (owner-authorized) to close
P1-2 (`submit-case.js` lock) and P2-4/P2-5. The **Dashboard/Resources
pass** already anticipated by `00-aimt-current-course-status.md`'s own
roadmap should absorb P1-3, P1-4, and P2-1/P2-2 together, since they share
the same "student dashboard completeness" surface.

**Update (2026-08-29, Step 121):** the **Entitlement Hardening** task for
P0-2 has been completed (owner-authorized, narrowly scoped) — see the
RESOLUTION note under Section 4's P0-2 finding. **P0-1 (Worker config
verification) is now the sole remaining P0 blocker before production
deploy.**

**Update (2026-08-29, Step 122):** the **Model Authority Consistency +
Legacy Worker Exit** task has closed both remaining open findings from
this document. **P1-1** (checkpoint grading resolving `CADENCE_CHAT_MODEL`
instead of `CADENCE_GRADING_MODEL`) is fixed — see the RESOLUTION note
under Section 4's P1-1 finding. **P0-1** is closed not by verifying the
Worker's live Cloudflare configuration (never attempted; this task had no
Cloudflare access) but by fully migrating `evaluateScript()` and
`submitIntro()` onto new Pages Function endpoints, eliminating the
dual-authority problem this finding described rather than reconciling
it — see the RESOLUTION note under Section 4's P0-1 finding and Section
2's updated Worker classification. **No P0 blockers remain.** Before a
production deploy, the owner-facing items outstanding are unrelated to
this gate's findings: Cloudflare Pages' own production `ANTHROPIC_API_KEY`
and model-binding configuration (tracked since the Cadence launch-sweep
build contract, Section 20/16), and the still-open P1 items below
(Module 12 Part II lock, Dashboard exit link + Performance Review copy) —
all P1, not P0, so none block a deploy, only public course launch.

**Update (2026-08-29, Step 123):** the **Module 12 Certification
Concurrency Hardening** task (owner-authorized) has closed the remaining
Module 12 concurrency findings this section anticipated. **P1-2**
(`submit-case.js` had no in-flight lock at all) is fixed — see the
RESOLUTION note under Section 4's P1-2 finding. **P2-4** (Part III's lock
was a non-atomic TOCTOU claim) and **P2-5** (`finalize-assessment.js`
could insert duplicate remediation rows under a concurrent double-finalize)
are both fixed too — see their RESOLUTION notes above. All three reuse one
small, shared primitive (`functions/_lib/cadence/turn-lock.mjs`'s new
`jsonLockFieldFilterKey()`/`casPatchSucceeded()`), turning a PostgREST
conditional PATCH into a genuine cross-instance compare-and-swap — no
schema migration, no Cloudflare KV/Durable Object. **No P0 or P1 blockers
remain from this document's own findings.** The only items this document
originally flagged that remain open are **P1-3** (no in-course link back
to the dashboard) and **P1-4** (a Performance Review dashboard promise
that doesn't yet exist) — both explicitly reserved for the dedicated
Dashboard/Resources pass, unaffected by this concurrency-only task — plus
the non-blocking P2 polish items (P2-1, P2-2, P2-3) and the Cloudflare
Pages production `ANTHROPIC_API_KEY`/model-binding confirmation, which
remains a separate owner-side deployment prerequisite.
