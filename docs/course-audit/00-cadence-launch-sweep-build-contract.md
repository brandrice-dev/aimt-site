# AIMT Cadence Launch Sweep — Build Contract

**Status:** Locked implementation authority. Layered over
`docs/course-audit/00-cadence-launch-sweep-audit.md` (technical baseline)
and the owner's Cadence product direction (this document's Section 2).
**Supersedes:** nothing in the audit's findings — this document resolves
the audit's Section 20 owner decisions and adds product-direction targets
the audit didn't (and shouldn't) decide on its own.
**Scope of this task:** lock this contract, resolve owner decisions, and —
because zero genuinely-unresolved decisions block it — implement Phase 0.
Phases 1–6 are authorized in shape, not in execution, by this document.

---

## 1. Technical baseline (from the audit — not re-litigated here)

- The checkpoint grading engine is already consolidated: one
  `submitCheckpoint()`/`evaluateCheckpointAnswer()` implementation grades
  every Module 0–11 checkpoint. **Keep it.**
- Module 12 Part II/III has its own sound, server-authoritative engine.
  **Do not reopen its design.**
- A previously undocumented, already-built free-form chat (the "guide
  panel," `gpSend()`/`gpHistory`/`toggleGuide()` in `headspa-mastery.html`)
  is the de facto Ask Cadence today — ephemeral, no persistence, no
  dashboard entry point.
- The live deployed `headspa-proxy` Worker was found running a different
  model string (`claude-sonnet-4-6`) than the repo's committed copy
  (`claude-sonnet-4-20250514`) — confirmed by fetching its actual deployed
  source via the Cloudflare account. `ANTHROPIC_API_KEY` provisioning
  remains unverifiable with available tooling for both runtimes.
- Two concrete, reproducible bugs: Module 12 Part III's retry-after-failure
  path corrupts the persisted transcript (Finding L1); no concurrency guard
  exists for in-flight interview submissions (Finding L2); a cross-tab race
  in `aimt-progress-sync.js` can drop a passed checkpoint's stored feedback
  (Finding L4, not addressed by Phase 0 — see Section 15).
- No mobile safe-area/keyboard-avoidance handling exists anywhere Cadence
  appears (Finding L3, Phase 2 work, not Phase 0).

## 2. Owner product direction (locked targets, not yet built)

- Cadence becomes AIMT's persistent, curriculum-grounded conversational
  learning layer — "Human-led. AI-assisted," not a chatbot, not a quiz
  grader with chat bubbles.
- **One visible thread per module** (Module 0's thread, Module 1's thread,
  ...), not one lifetime conversation. Full history persists; only
  selected/summarized context goes to the model per call.
- **Full-screen Cadence** whenever a student intentionally opens it or a
  required checkpoint activates — restrained full-screen on desktop, a
  near-native text-message experience on mobile (safe-area, keyboard
  avoidance, auto-grow, accessible send, voice, reliable autoscroll).
- Required checkpoints keep their existing IDs/rubrics/pass rules/gates,
  but lose LMS-style Attempt-1/Attempt-2/red-fail-card presentation —
  clarification stays inside the same visible module conversation.
- One visible conversation, four internal modes (Required Checkpoint,
  Module 12 Certification Interview, Ask Cadence, Remediation) sharing
  shell/schema/persistence/composer/voice/retry/provider infrastructure,
  never sharing authority rules.
- Passed checkpoints become read-only with a clear Continue action; no
  re-interrogation.
- Safe exit/resume across refresh, browser close, logout/login, another
  device, days later — Supabase-authoritative, never `localStorage`-only.
- Ask Cadence: extend/reuse the guide panel's *capability*, not
  necessarily its current presentation.
- Centralized server-side provider config: `CADENCE_CHAT_MODEL` /
  `CADENCE_GRADING_MODEL`, no "latest," candidate → regression → approval →
  promotion → monitoring → rollback for **both** roles.
- Human-authored grading authority applies to *all* graded modes, including
  checkpoints — corrected without unnecessarily rewriting the shared engine.

---

## 3. Reconciling the audit's 10 owner decisions

| # | Decision | Classification | Resolution |
|---|---|---|---|
| 1 | Approve Phase 0 hotfixes proceeding immediately | **A** — resolved by this task's direction | Yes — Section 27/28-32 of this task explicitly authorize Phase 0 now. |
| 2 | Approve reconciling the live Worker model string with the repo | **A** — resolved, scoped down | Build the config foundation now; do **not** deploy. The live Worker stays on its currently deployed version until the owner separately authorizes and performs a redeploy. |
| 3 | Approve provisioning/confirming `ANTHROPIC_API_KEY` in both runtimes | **B** — resolved by directed approach, not a blocker | Phase 0 ships with safe approved-default fallbacks requiring no live key for local tests (Section 32/0E); live-key confirmation remains an owner action, tracked, not gating Phase 0. |
| 4 | Rule on checkpoint evaluate/decide separation before Phase 2 | **A** — resolved, deferred to Phase 1 | Owner direction Section 15 locks: move checkpoints toward the Module-12 evaluate/decide pattern, "without unnecessarily rewriting the existing shared grading engine." Implementation is Phase 1's structured-evaluation-contract work, not Phase 0. |
| 5 | Approve reusable-core-not-full-rebuild + phase order | **A** — resolved | Owner direction Section 26 explicitly ratifies: keep shared grading primitives; rebuild/extract provider config, persistence, shell, recovery/idempotency. |
| 6 | Should checkpoints adopt Module 12's evaluate/decide separation, or stay direct AI pass/fail? | **A** — resolved (same as #4) | Yes, move that direction; scoped to Phase 1, not required for Phase 0. |
| 7 | Approve building Ask Cadence as a guide-panel extension | **A** — resolved | Owner direction Section 12 locks this exactly. |
| 8 | Approve full-screen conversational checkpoint UX as a real deliverable | **A** — resolved | Owner direction Section 5 locks full-screen Cadence as the target for both intentional-open and required-checkpoint activation. Phase 2 work. |
| 9 | Confirm the real Cadence avatar asset timeline | **C** — genuinely unresolved | Not addressed by the new direction; entirely outside Phase 0's scope (no UI work in Phase 0). Remains open, tracked, non-blocking. |
| 10 | Does "no auto-latest" + regression rigor apply equally to checkpoint (chat) grading, or only certification grading? | **A** — resolved | Owner direction Section 16 names `CADENCE_CHAT_MODEL` as a governed role alongside `CADENCE_GRADING_MODEL`, and Section 19's evaluation-set requirement is explicitly framed around "checkpoint-grading" — both roles get the same governance rigor. |

**Result: zero genuinely-unresolved decisions block Phase 0.** Decision 9
(avatar asset) is the only open item, and it has no dependency on anything
in Phase 0's scope. Per this task's own instruction not to treat a trivial,
out-of-scope preference as a blocker: **Phase 0 proceeds in this task.**

No new conflicts were found between the audit and the owner direction
beyond the 10 already listed — the direction resolves rather than contests
the audit's technical findings throughout.

---

## 4. Target architecture (summary — full detail in Sections 5-13)

```
Cadence Core (Phase 1)
├── provider/model config  ── functions/_lib/cadence/model-config.mjs (Phase 0 foundation)
├── conversation shell     ── shared transcript/composer/voice/mobile-safe-area component (Phase 2)
├── message/thread schema  ── one durable Supabase table, student+course+module+mode scoped (Phase 1)
├── evaluation contract    ── structured, versioned, model-identity-stamped (Phase 1, seeded in Phase 0)
└── recovery/idempotency   ── retry-safe, concurrency-guarded (Phase 0 foundation, generalized in Phase 1)

Modes (share the above, never share authority)
├── A. Required Checkpoint        — human rubric, evaluate→decide (Phase 1/2)
├── B. Module 12 Certification    — existing engine, reused as-is (Phase 3)
├── C. Ask Cadence                — guide panel + persistence + dashboard entry (Phase 4)
└── D. Remediation                — new, targeted-competency conversation (Phase 4)
```

## 5. Cadence modes — authority table

| Mode | Grading authority | Can alter competency state? | Can reopen a passed checkpoint? |
|---|---|---|---|
| A — Required Checkpoint | AI evaluates against human rubric; server rule decides pass (Phase 1 target) | Yes, by design | No, once passed |
| B — Module 12 Interview | AI evaluates criteria; `scoring.mjs` decides (unchanged) | Yes, certification-only | No |
| C — Ask Cadence | None — never graded | **Never** | **Never** |
| D — Remediation | Targeted coaching; may re-teach, does not itself certify | Only via the existing `complete-remediation.js` completion action | No — remediation ≠ retaking a passed checkpoint |

## 6. Provider/model architecture (Phase 0 foundation, built this task)

`functions/_lib/cadence/model-config.mjs` — one versioned **registry**
exposing `CADENCE_CHAT_MODEL` and `CADENCE_GRADING_MODEL` roles.
`resolveCadenceModel(env, role)` honors an env-var override **only** when
it matches a pre-registered model for that role — an arbitrary string
(including any "latest" alias) is never trusted. This is enforced in code,
not only by policy.

Cloudflare Workers deploy by dashboard paste and cannot `import` this
module. `cadence-worker/worker.js`'s constants are a **hand-kept mirror**,
documented as such, checked for repo-internal drift by a static test. This
does not and cannot detect drift between the repo and what is actually
deployed — only a manual dashboard check (or a future deploy-automation
project, out of this sweep's scope) closes that gap. **The currently-live
Worker is not touched or redeployed by this task.**

### 6a. Model-lifecycle correction (locked, supersedes the original Phase 0 pass)

**Owner model decision (locked):** proceed with `claude-sonnet-5` as the
`CANDIDATE` for both `CADENCE_CHAT_MODEL` and `CADENCE_GRADING_MODEL` — do
not re-approve `claude-sonnet-4-20250514`; do not treat the live
`claude-sonnet-4-6` Worker drift as approved configuration. Chat and
grading promotion remain independent decisions. Required path: candidate →
its own regression suite (conversation-quality for chat, grading accuracy
for grading) → independent `APPROVED` decision per role, only on a pass →
explicit configuration/deploy. Until a role is approved, it fails safe —
this is not a temporary Phase 0 state to be relaxed informally; it is the
standing rule going forward. This matches exactly what was already built
below; the owner decision ratifies the architecture, no code changed as a
result of it.

The first Phase 0 pass of this section set both roles' approved fallback to
`claude-sonnet-4-20250514` and treated that as the new long-term baseline.
**That was wrong and has been corrected in this same build.** By the time
of the correction, that generation was already superseded — the current
Anthropic Sonnet generation for new API integrations is `claude-sonnet-5`.
Enshrining an old generation as "approved" would have been exactly the kind
of uncontrolled model authority this whole module exists to prevent.

**Every registered model now carries an explicit lifecycle status:**

| Status | Meaning |
|---|---|
| `LEGACY` | A superseded generation. Still may be technically callable via the provider, but never eligible for silent/automatic production use again without a new, explicit, recorded approval. |
| `CANDIDATE` | Registered and eligible for controlled regression testing, not yet cleared for default production traffic. |
| `APPROVED` | Cleared for default production use. A role's default resolution may point only at a model with this status. |
| `RETIRED` | No longer available from the provider at all. |

**Current registry (`cadence-model-registry-v2`):**

- `claude-sonnet-4-20250514` → `LEGACY`. AIMT's original Cadence generation.
- `claude-sonnet-5` → `CANDIDATE` for both `CADENCE_CHAT_MODEL` and
  `CADENCE_GRADING_MODEL`. Pending the AIMT grading/conversation regression
  suite (Section 13) before promotion.
- `claude-sonnet-4-6` (the string this build's audit found actually running
  on the live `headspa-proxy` Worker) is **deliberately not registered at
  all** — uncontrolled live drift does not become authoritative by being
  observed; it would have to be evaluated and registered like any other
  candidate before it could mean anything to this system.
- **Neither role has an `APPROVED` model right now.** This is the correct,
  current state of the project, not an oversight.

**Fail-safe rule (enforced in code):** `resolveCadenceModel()` throws
`CadenceModelConfigError` — never silently resolves to a `LEGACY`,
`RETIRED`, or unregistered model — whenever a role has no `APPROVED` model
and no valid override is given. Calling code (`cadence-grader.mjs`,
`cadence-worker/worker.js`'s mirror) treats this exactly like any other
evaluator failure: preserve the student's response, return a retriable
error, never fall back quietly. Concretely today: **if this branch were
deployed as-is, right now, Cadence's chat and grading paths would both
return a clear error instead of silently running on the legacy generation**
— this is intentional, and is the real operational consequence the owner
should weigh before authorizing any live deployment of this work: either
explicitly, deliberately approve a model (after regression testing clears
`claude-sonnet-5`, or as a recorded, conscious exception to keep the legacy
generation running a little longer) or accept that Cadence stays
unavailable until one is approved. Nothing in this branch is deployed —
per the standing course-audit branch rule (no merge, no deploy without
explicit approval) — so this has no live consequence today; it becomes a
real decision only once the owner authorizes deploying this work.

**Promotion (candidate → approved):** add a **new** registry version
(`cadence-model-registry-v3`, etc.) that sets a role's default to the
now-cleared model — never edit `cadence-model-registry-v2` in place, same
discipline already used by
`functions/_lib/certification/assessment-config.mjs`'s
`getAssessmentConfig(version)`. Requires the AIMT grading/conversation
regression suite (Section 13, not yet built) to have run against the
candidate first. **Chat-model and grading-model promotion are independent
decisions** — promoting one role's default does not promote the other's.

**Rollback:** add a new registry version whose `approved` field reverts to
a previously-approved model, or points `CURRENT_REGISTRY_VERSION` at an
earlier version. A shipped version is never edited in place — rollback is
always a new, explicit, dated decision, never a silent reversion. Reaching
all the way back to the `LEGACY` generation requires the same explicit
re-approval process, not an automatic capability.

**Testing:** production code never receives an implicit test fallback. A
test that needs a working resolution passes an explicit env override naming
the registered `CANDIDATE` — the same mechanism a real controlled
regression-test run uses, not a hidden separate path. See
`tests/cadence-phase0.test.mjs`'s `MODEL LIFECYCLE` and integration
sections.

## 7. Grading-authority architecture

Unchanged for Module 12 (already correct: AI evaluates, `scoring.mjs`
decides). For checkpoints, the target (Phase 1, not Phase 0) is the same
separation — AI returns structured, criterion-level evidence; a
deterministic server rule decides pass/revise — implemented as an addition
to the existing `evaluateCheckpointAnswer()`/`submitCheckpoint()` path, not
a replacement of it.

## 8. Conversation-shell target (Phase 2, not built this task)

One shared component: transcript render, composer (auto-grow, safe-area,
keyboard-avoidance), voice button (`startVoice()`, reused as-is), mounted
by the guide panel, any future full-screen checkpoint UX, and Module 12
Part III. Authority/mode logic stays outside the shell.

## 9. Checkpoint gate-map requirement (built this task — Phase 2 authority)

`docs/course-audit/00-cadence-checkpoint-gate-map.md` — built this task.
Inventories all 22 checkpoints across Modules 0–11: ID, module, competency
label, content visible before/unlocked after, persistence key, and a key
finding — **no mid-module content-hiding gate exists anywhere today**;
every checkpoint's only real effect is (a) its own resolved/read-only state
and (b) contributing to its module's completion, which gates the *next*
module's unlock. Module 9↔10's checkpoint-ID/slot mismatch (from the
historical reorder) is recorded explicitly so Phase 2 doesn't "fix" it and
break existing students' saved progress. This document does not itself
change any gating behavior — it is the map Phase 2 builds against.

## 10. Ask Cadence target (Phase 4, not built this task)

Extend the guide panel's capability (module-aware system prompt, quick
prompts, voice, tone constants — already correct) with real Supabase
persistence and a dashboard entry point. Presentation may be fully replaced
by the shared shell (Section 8); the underlying non-graded, state-isolated
capability is what's being preserved and extended, not the current floating
panel's markup.

## 11. Mobile/accessibility target (Phase 2, not built this task)

Safe-area insets, dynamic-viewport/keyboard-avoidance, reliable autoscroll,
logical tab order, Enter/Shift+Enter, screen-reader labels and live
regions, no color-only meaning, reduced motion, no horizontal overflow,
usable touch targets, composer never hidden behind the keyboard — none of
this exists today (audit Finding L3) and none of it is Phase 0 scope.

## 12. Recovery/idempotency requirements (Phase 0 foundation, built this task)

- Provider timeout / malformed output / interrupted request: preserve the
  student's response; never duplicate a persisted conversational turn on
  retry (Section 15/Phase 0B).
- Duplicate send / concurrent submission: one logical turn produces one
  authoritative evaluation (Section 15/Phase 0C).
- Certification Anthropic path: rate-limited without ever consuming an
  attempt, erasing a response, or falsely failing competency on a rejected
  call (Section 16/Phase 0D).
- Cross-tab race (Finding L4) and Supabase-write-failure recovery beyond
  what's described above are **Phase 1 generalization work**, not Phase 0
  — Phase 0 fixes the two concretely-found, reproducible bugs; it does not
  rebuild `aimt-progress-sync.js`.

## 13. Model-regression requirements (Phase 6, foundation only this task)

Phase 0 makes model identity available to logging (each graded interview
turn's persisted state now records `provider`/`modelName`/`configVersion`)
so Phase 6's evaluation harness has something real to key off of. The
actual evaluation-set/harness (clearly correct, incomplete, concise-but-
correct, grammar/spelling noise, spoken/non-native phrasing, borderline,
unsafe/diagnostic, partial, prompt injection, answer-extraction attempts)
is real future work — not fabricated or stubbed by this task.

*Progress (Cadence Launch Sweep Phase 3):* the evaluation-set/harness this
section named as "real future work" is now built —
`node scripts/run-cadence-model-regression.mjs --role=grading|chat
[--live]`, a 72-case grading dataset and a 16-case chat dataset (both
human-authored directly from the real, unmodified `M0..M11` rubric text
and `MODULE_GUIDE_SYSTEMS`, extracted at run time rather than duplicated
by hand), independent per Chat/Grading role, reusable for any future
candidate model. This session's environment has no `ANTHROPIC_API_KEY`,
so the live Sonnet 5 run itself did not happen — the harness was proven
against the deterministic decision layer only and fails safe/reports the
exact blocker rather than fabricating a result. See
`docs/course-audit/cadence-sonnet5-grading-regression.md` and
`cadence-sonnet5-chat-review.md`. Neither `CADENCE_CHAT_MODEL` nor
`CADENCE_GRADING_MODEL` was promoted as a result of this task — both
remain `CANDIDATE` in `cadence-model-registry-v2`, unchanged.

---

## 14. Implementation phases

**Phase 0 — Safety/Drift Hotfix (this task).** Model-config foundation
(no deploy); Module 12 Part III retry-after-failure fix; concurrency guard
for interview submissions; certification-path rate limiting; secret/binding
verification checklist.

**Phase 1 — Cadence Core.** Centralized provider config used everywhere
(generalize Phase 0's foundation); durable message/thread schema; structured
evaluation contract for checkpoints; model/version logging persisted
properly; idempotency/retry primitives generalized beyond Part III.

*Progress this task:* provider config confirmed used everywhere (only two
real Anthropic call sites exist, both already routed through the registry —
no gap found). The in-flight-lock primitive was extracted into
`functions/_lib/cadence/turn-lock.mjs` and `submit-interview-turn.js`
refactored to use it (proven behavior-preserving — all Phase 0 tests
unchanged). Model/version logging was extended to checkpoint (chat)
grading: the Worker exposes resolved model identity via response headers,
and `assets/js/headspa-state.js` persists it into each checkpoint's stored
`lastGradedWith`, mirroring Module 12's pattern — diagnostic only, never
authoritative for progress. A durable `cadence_threads`/`cadence_messages`
schema was drafted (`supabase/migrations/20260827_create_cadence_threads.sql`)
covering the three non-certification modes — **committed for record-keeping
only, not applied**, and deliberately not yet wired to any endpoint.
**PHASE 1 CORE: COMPLETE (follow-up task, same day).** The two items flagged
above as deliberately deferred were completed once the owner explicitly
authorized them: the structured evaluate/decide authority split for
checkpoint grading is implemented
(`functions/_lib/cadence/checkpoint-evaluation.mjs`,
`functions/api/cadence/evaluate-checkpoint.js`) — a deterministic,
human-authored `decideCheckpointOutcome()` function (never the model's own
prose) now decides pass/revise from structured evidence, gated by a
behavior-compatibility suite (8 response categories × 2 real checkpoints,
16/16 matching the existing standard, zero mismatches — see
`tests/cadence-checkpoint-authority.test.mjs`) before the live path was
rewired. `evaluateCheckpointAnswer()` (the real, non-Review-Mode path) now
calls this endpoint; Review Mode was deliberately kept on the prior
direct-to-Worker path, preserving its "never persists a result" guarantee
by construction. The `cadence_threads`/`cadence_messages` migration was
finalized (added an `idempotency_key` column + unique partial index),
reviewed for RLS/additivity, and **applied to the connected `aimt` Supabase
project** — verified live (schema, RLS policies via `pg_policies`,
anonymous REST rejection, a full isolated smoke test using existing QA
identities, cleaned up afterward). `functions/_lib/cadence/threads.mjs` and
two endpoints (`evaluate-checkpoint.js`, `get-thread.js`) implement the
core get-or-create-thread / append-message-with-idempotency /
get-messages primitives Phase 2 needs. Partial-failure recovery (student
message durable before the model call; assistant-write failure returns the
already-computed decision without re-persisting; idempotent replay via a
client-generated `requestId` caches the decision rather than re-calling
Anthropic) is implemented and tested. **Not built** (genuinely separate,
still-future work, not deferred by oversight): Ask Cadence's UI, a
remediation conversation UX, and Phase 2's full-screen shell itself — the
schema/API support these modes' data shape, nothing more, per this task's
own explicit scope boundary.

**Phase 2 — Shared Conversation Shell + Checkpoints. COMPLETE (follow-up
task, same day as Phase 1 core).** `assets/js/cadence-shell.js` +
`assets/css/cadence-shell.css` — one reusable, mode-agnostic shell
(`window.CadenceShell = {openCheckpoint, wireCheckpoint}`), presentation/
transport only, never deciding pass/revise or inventing checkpoint
content. A single new accessor, `getCadenceCheckpointDefinition()`
(placed once in `headspa-mastery.html`, right after `M11`), reads the
exact, unmodified `M0..M11` rubric/question objects and assembles the
system prompt byte-for-byte the same way `submitCheckpoint()`/
`submitCheckpointReviewMode()` always did. Because `restoreLessonState()`
already iterates `MODULE_CHECKPOINTS[String(moduleId)]` on every module
render, one added line there (`if (window.CadenceShell)
window.CadenceShell.wireCheckpoint(moduleId, checkpointId);`) wires **all
22 required checkpoints across Modules 0-11 simultaneously** — the
canary and the full migration are the same change; no per-checkpoint or
per-module special-casing was needed for any rubric shape, including
Module 3's bare ids and the Module 9<->10 historical swap. The
`headspa-mastery.html` diff is 60 insertions / 2 deletions across the
whole ~500KB file. `evaluateCheckpointAnswer()` gained one optional,
backward-compatible 6th parameter (`providedRequestId`) so the shell can
reuse Phase 1's existing idempotency key across a retry or a
resume-after-refresh, reusing the same server-side guarantee rather than
adding a second one. Historical passed checkpoints with no durable
transcript (true for every pass predating this branch) render an honest
read-only fallback from the student's actually-stored answer/feedback,
never a fabricated conversation. Review Mode gets a structurally separate
non-persisting path plus a fixture switcher covering every required QA
state. Five real bugs (a mount-point DOM-nesting trap, a CSS custom-
property fallback defeated by writing `0` instead of leaving it unset, a
`min-height` floor that then overrode the correct smaller height, a
missing flex `min-height:0` that pushed the composer off-screen on
mobile, and a z-index/stacking issue with the page's sticky nav) were
found via live-browser QA and fixed in the same task, each with a
regression test. See `implementation-log.md` Step 103 for the full
record. **Module 12 untouched** (`MODULE_CHECKPOINTS['12']` stays empty,
so the wiring line never fires there); **Ask Cadence's real migration and
a remediation mode remain Phase 4**, not built by this task.

**Phase 3 — Module 12 Live Integration.** Reuse the shared shell for Part
III's presentation only; preserve the certification state machine exactly;
live grading validation once `ANTHROPIC_API_KEY` is confirmed.

**Phase 4 — Ask Cadence + Remediation.** Persistent optional Ask Cadence
from the guide panel's capability; dashboard entry if justified; new
remediation mode; hard separation from graded state.

*Progress (Cadence Launch Sweep Phase 3, same branch, follow-up task):*
**Ask Cadence's shared-shell migration is COMPLETE; a new remediation
surface remains explicitly deferred.** The bottom-corner Cadence pill
(`headspa-mastery.html`'s `toggleGuide()`) now opens the exact same shared
shell required checkpoints use (`assets/js/cadence-shell.js`'s new
`openAskCadence()`), in a new `mode='ask_cadence'`, scoped to the
student's *current* module thread via the existing Phase 1
`cadence_threads`/`cadence_messages` schema (that schema's `mode` check
constraint already included `'ask_cadence'` from Phase 1 — no migration
change needed). The old floating `#guidePanel`/`gpSend()`/`gpHistory`
experience is deactivated (unreachable from the pill) rather than
deleted, per this file's own surgical-edit-only convention for
`headspa-mastery.html`. A new endpoint, `functions/api/cadence/ask.js`
(backed by `functions/_lib/cadence/ask-cadence.mjs`), reuses Phase 1's
thread/idempotency/rate-limit primitives and the same `CADENCE_CHAT_MODEL`
role/fail-safe resolution every other chat call site uses — it has no
decision function at all (unlike checkpoint grading), so it can never
submit a checkpoint evaluation, alter progress, or touch
`course_progress`, verified both statically (tests) and by the endpoint's
own code shape. Two guardrails were built: (1) a standing base
instruction present in every Ask Cadence system prompt that Cadence must
never hand over a checkpoint's qualifying answer, and (2) a **server-
verified** (never client-trusted) per-checkpoint reminder added only when
`course_progress` actually shows the referenced checkpoint unresolved.
Module 12 exam integrity: the pill is hidden for the entire Module 12
view client-side, and `ask.js` independently refuses (403) any request
for `moduleId: '12'` while the student's latest certification attempt is
not yet `scored` — the server guard does not depend on the client hiding
anything. Real Supabase persistence QA (isolated QA identity, cleaned up
afterward) confirmed live: one thread per module enforced by the
database's own unique constraint, idempotent duplicate-request rejection
enforced by the database's own partial unique index, RLS unchanged
(`select`-own only, no `insert`/`update` for `authenticated`/`anon`), and
no foreign-key/trigger path from `cadence_messages`/`cadence_threads` to
`course_progress` — architectural isolation, not merely a code
convention. **Not built** (deferred, not by oversight): a standalone
generalized remediation conversation mode — same-thread checkpoint
clarification and Module 12's existing course-review remediation remain
the launch-scope answer; a dashboard Cadence entry point (the owner
specifically approved the bottom-pill-only entry for this launch); and
any live-model QA of Ask Cadence's actual conversational quality (blocked
on `ANTHROPIC_API_KEY`, same blocker as Section 13's regression suite
below).

**Phase 5 — Course-Wide Migration/Cleanup.** Smaller than originally
anticipated — no sprawling legacy checkpoint implementations exist. Real
items: auto-grow-cap duplication, duplicated auth-resolution code, folding
guide-panel styling into the shared shell.

**Phase 6 — Model Validation/Launch Gate.** Evaluation suite; conversation-
quality evaluation; promotion/rollback exercised for real; device/
accessibility QA; failure/recovery drills; final certification/progress
integrity sweep.

No reordering was needed — the audit and the owner direction agree on this
shape, and Phase 0's scope was already dependency-first (config before
shell, bugs fixed before UI is built on top of them).

## 15. Stop-loss gates

- If implementation starts requiring major special-case logic per module →
  **stop and re-evaluate.** Not tripped by Phase 0.
- If Module 12 would need to weaken its certification architecture to fit
  the shared shell → **stop.** The shell adapts to certification mode, not
  the reverse. Phase 0 changes nothing about Module 12's rules, scoring,
  critical domains, or thresholds.
- If provider/grading logic is duplicated across runtimes with no shared
  source of truth → **already tripped before this task** (the model-string
  drift); Phase 0A is the direct response, not optional.
- The cross-tab race (Finding L4) and full mobile/shell work are
  **explicitly deferred, not silently dropped** — tracked in Sections 11/12
  above for Phase 1/2, so deferring them here is a scoping decision, not an
  oversight.

## 16. Launch acceptance criteria (cumulative, not just Phase 0)

- No model name in client-visible code; both roles resolve through
  `resolveCadenceModel()` or its Worker-side mirror; no "latest" alias
  reachable by any env override.
- Before live deployment: an explicit, recorded `APPROVED` model exists for
  each role the deployment actually needs — Cadence fails safe rather than
  silently running on a `LEGACY` generation if this is not yet true (Section
  6a). Deploying with no `APPROVED` model means Cadence is unavailable, not
  degraded-but-working — the owner must decide this deliberately.
- Module 12 Part III survives a simulated Anthropic failure and a retry
  without a duplicated or non-alternating transcript.
- No two concurrent submissions for the same conversation both reach
  Anthropic.
- The certification Anthropic path is rate-limited without ever costing a
  student an attempt or a response.
- `ANTHROPIC_API_KEY` confirmed present in both runtimes (owner action,
  tracked, not yet satisfied).
- 120/12/9 content counts, 141/141 traceability, and the certificate gate
  are unchanged after every phase — verified by the existing test suites
  on every change, not assumed.
- (Phase 2, complete) full-screen shell, one thread per module, safe-area/
  keyboard-avoidance mobile behavior, historical passed-state fallback,
  Review Mode fixtures — all verified via live-browser QA, not assumed.
- (Later phases) persistent Ask Cadence, a remediation mode, model
  regression suite exercised before any promotion, live-model QA once an
  `APPROVED` model exists.

## 17. Unresolved owner decisions

Only Decision 9 (the real Cadence avatar asset timeline) remains open —
carried forward from the audit, not created by this document, and not a
blocker for anything in Phase 0, Phase 1, or Phase 2. `cadence-shell.js`
documents the exact swap point (`.cshell-id`/`CADENCE_AVATAR_ASSET`
comment) so replacing the placeholder identity mark is a one-file change
whenever that asset is supplied.

## 18. Cadence character & Chat-standard recalibration (2026-08-28 addendum)

Two rounds of Chat prompt hardening after this document's original Phase 4
target (Section 10) drove `ASK_CADENCE_BASE_GUARDRAIL` toward a
**closed-corpus standard** — every substantive claim had to trace to the
literal text of the module guide paragraph, not just be accurate and
consistent with AIMT. That standard was defensible pass by pass but drifted
from the product AIMT actually wants: an instructor who can explain, not a
retrieval system.

**`docs/course-audit/00-cadence-character-instruction-constitution.md`** is
now the governing definition of who Cadence is and how much freedom she has
— a durable, cross-course platform document, not specific to HeadSpa
Mastery. It does not change Section 5's authority table above (Ask Cadence
still has **no** grading/certification authority, ever); it governs her voice
and judgment *within* that authority, replacing informal case-by-case
tightening with a stable standard: three knowledge/freedom zones (ordinary
tutoring — high freedom; high-stakes practice guidance — strict grounding;
active competency checkpoints — teach without demonstrating).

Existing evidence was **re-scored against the new standard, not re-run** —
see `cadence-sonnet5-chat-review.md`'s "STANDARDS RECALIBRATION" section for
the full rescoring and the resulting guardrail-relaxation recommendations
(not yet implemented; tracked for the next Chat task). This addendum does not
change any code, any model's lifecycle status, or Module 12/grading in any
way — it is a standards document and a re-reading of prior evidence only.

## 19. Narrow Zone B scenario-fact safety gate (2026-08-29 addendum)

The Zone A/Zone B split (Section 18, implemented in `ASK_CADENCE_BASE_GUARDRAIL`
per `implementation-log.md` Step 114) and the scenario-fact-integrity prompt
clause added afterward (Step 116) both live entirely in the system prompt —
advisory instructions with nothing upstream of the client actually verifying
Cadence followed them. Two consecutive live retests of the same case
(chat-13) showed the identical invented-scenario-fact failure with the
relevant prompt clause already present, confirming a prompt-only rule is not
sufficient for this specific failure shape on its own.

`functions/_lib/cadence/scenario-fact-gate.mjs`, wired into
`askCadenceServerSide()` (`ask-cadence.mjs`), adds a structural backstop —
not a replacement for the prompt clause, and explicitly not a general
verifier wrapping every Chat turn. It engages only when a response contains
actionable Zone B practice-authority guidance (detected deterministically);
Zone A tutoring is untouched, one generation call, same as before this
addendum. When it engages, an isolated LLM call (the same `CADENCE_CHAT_MODEL`
already generating the response) checks specifically whether the guidance
depends on a scenario fact nobody actually supplied — not general factual
correctness, not personality, not course-grounding of every sentence. An
unsupported result allows exactly one regeneration in Cadence's own voice;
a still-unsupported regeneration (or any failure of the regeneration call
itself) resolves to a fixed, deterministic clarifying-question fallback,
never a raw error and never a second regeneration attempt.

This does not change Section 5's authority table (Ask Cadence still has no
grading/certification authority), does not alter the constitution (Section
18) in any way, and makes no change to Grading, Module 12, or any checkpoint
content/rubric — verified by test (`tests/cadence-chat-scenario-gate.test.mjs`).
See `implementation-log.md` Step 117 and `cadence-sonnet5-chat-review.md`'s
"NARROW ZONE B SCENARIO-FACT SAFETY GATE" section for full detail.
