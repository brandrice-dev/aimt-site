# AIMT Cadence Launch Sweep — System Audit

**Status:** Audit complete. Implementation not begun, not authorized by this document.
**Branch:** `course-audit-build` (HEAD at audit start: `6d672e7`)
**Scope:** Repository-grounded audit of the entire current Cadence system, per
`docs/course-audit/00-cadence-launch-sweep-handoff.md`. This document is the
final implementation architecture the sweep will build against. It does not
modify runtime code, Supabase, or model configuration, and does not deploy.
**Method:** Direct reading of every file cited below (line numbers verified
against the actual file contents at audit time, not inferred), plus live
inspection of the deployed `headspa-proxy` Cloudflare Worker via the
Cloudflare account's Workers API (name/existence and live source code only —
no environment-variable or secret inspection capability was available). All
12 existing deterministic test suites were re-run and confirmed green before
this audit's conclusions were finalized.

---

## 0. Executive summary

Two things are true at once, and the sweep should hold both:

1. **The grading engine is already well-consolidated.** There are not twelve
   different checkpoint implementations. One shared function
   (`submitCheckpoint()` / `evaluateCheckpointAnswer()`) grades every
   checkpoint in Modules 0–11; Module 12 has its own, separately
   well-built, server-authoritative engine. The "unify twelve bespoke
   systems" problem the handoff worried about does **not** exist at the
   grading-logic layer.
2. **The provider/persistence/presentation layers around that engine are
   genuinely fragmented, and one piece of that fragmentation has already
   drifted in production.** This audit found the **live deployed
   `headspa-proxy` Worker is running a different model string
   (`claude-sonnet-4-6`) than the one committed in this repository's copy of
   that same file (`claude-sonnet-4-20250514`)** — a real, current,
   undocumented divergence between what's live and what's in git, found by
   fetching the Worker's actual deployed source via the Cloudflare account.
   This is the clearest possible evidence for why Section 6's centralized,
   version-logged provider configuration is not a nice-to-have.

This audit also found a genuine, reproducible bug in Module 12 Part III's
failure-retry path (Section 14/Finding L1), a real cross-tab race condition
that can silently drop a passed checkpoint's stored Cadence feedback
(Finding L4), and an existing, currently undocumented, already-built
free-form Cadence surface — the "guide panel" floating chat — that is the
natural foundation for "Ask Cadence" (Section 17) rather than something to
build from scratch.

**Recommendation in one sentence:** build one shared server-side provider
config and one shared client conversation shell *underneath* the grading
logic that already works, rather than rebuilding the grading logic itself —
see Section 15 for the full reusable-core-vs-incremental analysis.

---

## 1. Current architecture map

```
┌─────────────────────────────────────────────────────────────────────┐
│ BROWSER (headspa-mastery.html, one file, inline JS)                  │
│                                                                       │
│  Required checkpoint (M0–M11)     Guide panel ("Ask Cadence" today)  │
│  .cp-input / .cp-btn / .cp-res    #guidePanel / gpSend() / gpHistory │
│  submitM{N}CP(id)                 floating, module-aware, ephemeral  │
│       │                                  │                           │
│       └──────────────┬───────────────────┘                           │
│                       ▼                                              │
│              submitCheckpoint() / evaluateCheckpointAnswer()         │
│              or gpSend() → callAI(system, messages, maxTokens)       │
│                       │                                              │
│                       ▼                                              │
│              fetch(PROXY_URL, { Authorization: Bearer <supabase JWT>,│
│                                  model, max_tokens, system, messages})│
└───────────────────────┼──────────────────────────────────────────────┘
                         ▼
     ┌───────────────────────────────────────────────┐
     │ Cloudflare Worker: headspa-proxy                │
     │ (cadence-worker/worker.js, deploy = paste)       │
     │  verifySupabaseToken() → hasEntitlement() →      │
     │  rateLimited() → clamp model to ALLOWED_MODELS → │
     │  fetch api.anthropic.com/v1/messages             │
     │  LIVE: ALLOWED_MODELS=['claude-sonnet-4-6']      │
     │  REPO: ALLOWED_MODELS=['claude-sonnet-4-20250514']│
     └───────────────────────┬───────────────────────────┘
                              ▼
                    Anthropic Messages API
                              │
                              ▼  {pass, feedback} or free text
     back to browser → APP_STATE.setCheckpointResult() →
     APP_STATE.save() → aimt-progress-sync.js (wrapped save,
     3s debounce) → Supabase course_progress (upsert, score-wins merge)


┌─────────────────────────────────────────────────────────────────────┐
│ BROWSER — Module 12 Part III (assets/js/module12-certification.js)   │
│  renderPartIII() composer → onSendInterviewTurn()                    │
└───────────────────────┼───────────────────────────────────────────────┘
                         ▼
              POST /api/certification/submit-interview-turn
              (Authorization: Bearer <supabase JWT>)
                         ▼
     ┌───────────────────────────────────────────────────┐
     │ Cloudflare Pages Function                          │
     │ functions/api/certification/submit-interview-turn.js│
     │  resolveUser() [auth.mjs, separate impl from Worker]│
     │  → load certification_attempts row (service role)  │
     │  → evaluateInterviewTurn() [cadence-grader.mjs]     │
     │       fetch api.anthropic.com/v1/messages directly  │
     │       model = 'claude-sonnet-4-20250514' (hardcoded)│
     │  → merge criterionScores/explicitUnsafeDomains      │
     │  → PATCH certification_attempts.part3_conversation_ │
     │            state (server-authoritative, RLS-blocked │
     │            from client insert/update)                │
     └───────────────────────┬───────────────────────────┘
                              ▼
                 back to client → render transcript,
                 next conversation or finalize → /finalize-assessment
                 → scoring.mjs / attempt-ladder.mjs (deterministic,
                   human-authored rules) → certification_decision
```

Two Anthropic call sites exist. They are architecturally correct to be
separate (certification rubrics must never reach the browser — the Worker's
contract is for client-visible checkpoint prompts, `cadence-grader.mjs`'s is
not), but they are **operationally disconnected**: no shared config module,
no shared auth helper (two independent `resolveUser`/`verifySupabaseToken`
implementations that must be kept in sync by hand), and — as this audit
found — no mechanism that would have caught the live model drift before a
sweep audit happened to fetch the Worker's real source and diff it against
git.

---

## 2. Every Cadence surface found

| # | Surface | File(s) | Grading? | Persisted? | Notes |
|---|---|---|---|---|---|
| 1 | Required checkpoints (M0–M11) | `headspa-mastery.html:8161` `submitCheckpoint()`, per-module wrappers `submitM{N}CP` | Yes, AI decides pass/fail directly | Single answer+feedback pair per checkpoint, `APP_STATE`, synced | Already unified — comment at line 8156 says "Replaces 9 near-identical functions" |
| 2 | Passed-checkpoint state | `applyCheckpointInputState()` :8028, `renderCheckpointOutcomeLabel()` :8001 | N/A | Read-only once resolved | Input+button disabled; matches Section 12's target already |
| 3 | Failed/retry checkpoint state | same `submitCheckpoint()` path | Re-gradeable | Overwrites previous answer/feedback; only `attempts` counter survives | No history of prior wrong attempts anywhere |
| 4 | Module 12 Part III (Practitioner Interview) | `assets/js/module12-certification.js` `renderPartIII()`, `functions/api/certification/submit-interview-turn.js`, `functions/_lib/certification/cadence-grader.mjs` | Yes, criterion-level, server-authoritative decision separate from AI (`scoring.mjs`) | Full transcript, `certification_attempts.part3_conversation_state`, RLS-protected | The one real reference implementation of durable multi-turn persistence |
| 5 | "Guide panel" floating chat (**existing de facto Ask Cadence**) | `headspa-mastery.html` `toggleGuide()` :8834, `gpSend()` :8849, `gpHistory` :8809, `MODULE_GUIDE_SYSTEMS` :8770, `MODULE_QUICK_PROMPTS` :8792 | No — never touches `APP_STATE` | **None — fully ephemeral**, wiped on module nav (`gpHistory = []` at :8947, :8960) and page reload | Not mentioned in the handoff doc; this audit found it live in the codebase. Module-aware system prompt, quick-prompt suggestions, voice input, fake word-by-word streaming. This is the seed for Section 17. |
| 6 | Dashboard/Cadence entry point | `my-aimt.html` | — | — | **None found.** Zero references to Cadence anywhere in the dashboard file. |
| 7 | Voice input | `startVoice()` :11001 (single global, Web Speech API) | N/A | N/A | One implementation, reused identically by every checkpoint, the guide panel, and Module 12 Part III via `voiceButtonHtml()` (`module12-certification.js:388`) checking `window.startVoice` presence |
| 8 | Transcript persistence | `APP_STATE` (`headspa-state.js`), `certification_attempts` (Supabase) | — | See Section 11 | Three distinct persistence models, no shared abstraction |
| 9 | Retry/error behavior | `submitCheckpoint()`'s `.catch()` :8214, `submit-interview-turn.js`'s `catch` :65 | — | — | Checkpoints: safe. Module 12 Part III: **a real bug** — see Finding L1 |
| 10 | Course-progress integration | `aimt-progress-sync.js`, `functions/_lib/certification/auth.mjs`'s `hasCompletedInstructionalModules()` | — | — | Server reads server-synced state for Module 12 eligibility; correct pattern |

**Every module checkpoint uses the same engine.** `submitM0CP` through
`submitM11CP` (plus `submitCP` for Module 3's originally bare IDs) are thin
wrappers supplying `(moduleId, cpId, systemPrompt, question, errorMessage)`
to the one shared `submitCheckpoint()`. The per-checkpoint rubric strings
(`M0`..`M11` config objects, `headspa-mastery.html:8325` onward) are the only
real per-module content; the mechanics are not duplicated. One historical
drift was found already self-corrected: `.cp-box` is explicitly commented as
a retired pattern ("Module 8 was corrected to match... Do not use `.cp-box`
for new checkpoints," `headspa-mastery.html:475-476`) — evidence that
foundation drift *has* happened before and was caught manually, which is
exactly the risk a shared component (Section 7/18) would remove structurally
instead of by vigilance.

---

## 3. Full request-path trace

### 3.1 A normal required checkpoint (e.g., `m4cp1`)

1. Student types in `<textarea class="cp-input" id="m4cp1In">`, optionally
   using the mic button (`startVoice('m4cp1In', this)`,
   `headspa-mastery.html:11001`) — voice output lands in the same textarea
   the typed path uses; there is no separate voice pipeline.
2. Enter or the send button calls `submitM4CP('m4cp1')` (`:9207`) →
   `submitCheckpoint(4, 'm4cp1', M4.systems.m4cp1, M4.questions.m4cp1, errMsg)`
   (`:8161`).
3. `submitCheckpoint()` disables the input/button, shows a thinking
   indicator, assembles the system prompt: the module's human-authored
   rubric + `CADENCE_RESPONSE_CONSISTENCY_ANCHOR` +
   `CADENCE_SELECTIVE_MEMORY_INSTRUCTION` +
   `APP_STATE.getCadenceMemoryContext(4, 'checkpoint')` (compressed prior
   context only — see Finding from memory audit, Section 11).
4. `evaluateCheckpointAnswer()` (`:8128`) appends
   `CADENCE_CHECKPOINT_TONE` + `CADENCE_FEEDBACK_MICRO_RULES` +
   `CHECKPOINT_EVAL_FORMAT` (the `{"pass":true|false,"feedback":"..."}`
   contract) and calls `callAI(system, messages, 110)` (`:10172`).
5. `callAI()` reads the current Supabase access token
   (`supabaseClient.auth.getSession()`) and `fetch`es `PROXY_URL`
   (`https://headspa-proxy.brandrice.workers.dev/`, `:7791`) with
   `{model: 'claude-sonnet-4-20250514', max_tokens, system, messages}` —
   note the **client sends a model string**, but it is not authoritative
   (next step).
6. `headspa-proxy` Worker (`cadence-worker/worker.js`) verifies the Bearer
   token against Supabase (`verifySupabaseToken`), checks
   `course_entitlements` (`hasEntitlement`), applies a 20/min + 300/day
   per-user rate limit, **clamps the model to its own `ALLOWED_MODELS`
   allowlist regardless of what the client requested**
   (`ALLOWED_MODELS.includes(body.model) ? body.model : ALLOWED_MODELS[0]`),
   and calls `https://api.anthropic.com/v1/messages` directly with the
   Worker's `ANTHROPIC_API_KEY`.
7. Response streams back through the Worker unmodified; client parses
   `d.content[0].text`, `normalizeCheckpointEvaluation()` (`:8107`)
   extracts `{pass, feedback}` — defaulting safely to `pass:false` with a
   generic message if the model's JSON is unparseable (never fails open).
8. On pass: `APP_STATE.setCheckpointResult()` (`headspa-state.js:930`)
   overwrites `checkpointMeta[cpId]` with `{status:'passed', feedback,
   answer, attempts++, updatedAt}`; `captureCheckpointMemory()` derives a
   ≤150-char summary into `cadenceMemory.notableAnswers[]`; module
   completion is checked and the UI updates.
9. `APP_STATE.save()` fires — wrapped by `aimt-progress-sync.js`'s
   `AIMT_SYNC.init()` — which debounces 3s (`PUSH_DEBOUNCE_MS`) then
   upserts the whole state blob to Supabase `course_progress` (score-wins
   merge on pull, last-write-wins on push — see Finding L4).
10. On failure (network/timeout/Worker error): the `.catch()` at `:8214`
    re-enables the input/button, shows a friendly inline error. The
    student's typed text is never cleared, so nothing is lost — this path
    is safe.

### 3.2 Module 12 Part III (one interview turn)

1. `renderPartIII()` draws the composer (`module12-certification.js:1193`,
   the same `.cp-input`/`.cp-btn` pattern, wrapped in `.m12x-composer`).
   `onSendInterviewTurn()` (`:1212`) optimistically appends the student's
   turn to the **client-local** transcript and re-renders with the
   composer disabled before any network call starts.
2. `POST /api/certification/submit-interview-turn` with
   `{attemptId, interviewId, studentResponse}`, Bearer Supabase token.
3. `submit-interview-turn.js` (`:29`): resolves the user (`auth.mjs`'s own
   `resolveUser`, a **separate implementation** from the Worker's
   `verifySupabaseToken` — same overall pattern, different `apikey` header
   used, no shared code), loads the attempt row via service role, checks
   `attempt.status === 'part2_locked'` and that the interview ID belongs to
   this attempt's selection, checks whether this conversation is already
   `finalized` (the **only** idempotency guard that exists — see Finding
   L1/L2), and calls `evaluateInterviewTurn()`.
4. `cadence-grader.mjs`'s `evaluateInterviewTurn()` builds a rubric-bound
   system prompt from the interview's human-authored `rubricCriteria`,
   calls Anthropic directly (`ALLOWED_MODEL = 'claude-sonnet-4-20250514'`,
   hardcoded independently of the Worker's constant), and extracts the
   first JSON object from the reply.
5. `submit-interview-turn.js` merges `criterionScores`/
   `explicitUnsafeDomains`/`patternTags`, appends the turn, and — depending
   on `needsFollowUp` — either PATCHes a follow-up state or, once all three
   selected interviews are finalized, computes `interview_score` via
   `scoreInterviewConversation()` and locks Part III. Every write goes
   through the service-role key; RLS blocks any client insert/update on
   `certification_attempts` directly (confirmed live in Step 97, see
   `module-12.md`).
6. Client renders the follow-up or, on full completion, moves to
   Processing → `POST /finalize-assessment` (idempotent — checks
   `attempt.status === 'scored'` and short-circuits, `finalize-assessment.js:46`).

**Resume-after-refresh** is correct: `get-status.js` returns the
in-progress attempt's `status`; `get-part.js` (part=3) never grades
anything — it only reads `attempt.part3_conversation_state`, resolves the
next unfinished interview via the pure `findNextInterview()` helper, and
returns the transcript-so-far for the client to redraw. A refresh mid-turn
never re-triggers grading. What is **not** preserved is an unsent,
still-being-typed draft (no autosave for Part III, unlike Part I's
`save-progress` autosave) — dropped on refresh, a real but minor gap.

---

## 4. Provider/model configuration — live findings

**Provider:** Anthropic only, via raw `fetch` (no SDK), consistent with
`CLAUDE.md`'s zero-npm-dependency rule for both the Worker and Pages
Functions.

**Model configuration is scattered across four independent locations, one of
which has already drifted from git:**

| Location | Value | Authority |
|---|---|---|
| `cadence-worker/worker.js:26` (repo copy) | `claude-sonnet-4-20250514` | Committed, not deployed as-is |
| **Live deployed `headspa-proxy` Worker** (fetched via Cloudflare API this audit) | `claude-sonnet-4-6` | **Actually running in production** |
| `functions/_lib/certification/cadence-grader.mjs:12` | `claude-sonnet-4-20250514` | Deploys with Pages, matches repo |
| `headspa-mastery.html:10187` (`callAI()`, client) | `claude-sonnet-4-20250514` sent in the request body | **Not authoritative** — the Worker's allowlist silently overrides whatever the client sends |

The client-sent model string being overridden is *correct* behavior (model
authority should be server-side), but it means **the client's hardcoded
string is dead weight that nobody will notice is wrong** — exactly what
happened to the Worker's own committed copy. Nothing in this repository
would have caught the live/repo divergence found today; it was only visible
by fetching the Worker's actual deployed source through the Cloudflare
account.

**Chat vs. grading models:** conceptually "the same model" today, but
configured as two independently-named constants (`ALLOWED_MODELS` array in
the Worker, `ALLOWED_MODEL` singular in `cadence-grader.mjs`) with no shared
source. A future intentional change to one has no mechanism to propagate to
(or even flag disagreement with) the other.

**Client-side vs. server-side authority:** correctly server-side for both
call sites — the client never holds `ANTHROPIC_API_KEY`, and the Worker's
allowlist is the real gate. The gap is not *where* authority lives; it's
that there is no single source of truth for *what the authoritative value
currently is*, and no record of when/why it last changed (the Worker
deploys by dashboard paste, per `CLAUDE.md`, with no git history for that
specific edit).

**Model/version logging:** none. `certification_attempts` already has
`assessment_version`/`standard_version`/`bank_version` columns (a real,
working precedent for versioned auditability — see
`assessment-config.mjs`'s `getAssessmentConfig(version)` pattern, which
freezes historical configs by version string) but **no column records which
Anthropic model actually graded a given attempt or turn.** This is a
concrete, fillable gap against the Standard's own Section 15 auditability
requirement.

**Rollback:** none exists for either call site today; a Worker rollback
today would mean re-pasting an older version by hand with no diff tooling.

**`ANTHROPIC_API_KEY` provisioning — still cannot be verified from this
session.** This audit's Cloudflare account access confirmed the
`headspa-proxy` Worker script genuinely exists and is live (`workers_list`
returned it, last modified 2026-07-07), and could fetch its real deployed
source (which is how the model drift above was found) — but **no tool
available in this environment can list or inspect environment-variable or
secret bindings** for either the Worker or the `aimt-site` Cloudflare Pages
project. This narrows, but does not close, the gap the handoff document
flagged.

**Exact owner action required:** in the Cloudflare dashboard, confirm (do
not paste values anywhere):
- **Workers & Pages → `headspa-proxy` → Settings → Variables:**
  `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS`, `STAFF_EMAILS` are all
  set, encrypted where marked secret.
- **Workers & Pages → `aimt-site` (Pages project) → Settings → Environment
  variables → Production:** `ANTHROPIC_API_KEY` is set (this is a
  *separate* binding from the Worker's copy — same key value, different
  place, per `cadence-grader.mjs`'s own header comment).
- While there: reconcile the Worker's live `ALLOWED_MODELS` value
  (`claude-sonnet-4-6`) against the intended production model before doing
  any live-model QA, since the repo's committed `cadence-worker/worker.js`
  does not currently match what is deployed.

---

## 5. Target provider architecture (recommendation)

A single server-side module, imported by both runtimes wherever that's
possible and mirrored with an explicit sync-check where it isn't (the
Worker deploys by paste and cannot `import` from this repo at deploy time —
that constraint doesn't go away, so the design must account for it, not
wish it away):

```js
// functions/_lib/cadence/model-config.mjs (Pages Function side, importable)
export const CADENCE_MODEL_CONFIG = {
  version: 'cadence-model-config-v1',
  roles: {
    CADENCE_CHAT_MODEL:      { approved: 'claude-sonnet-4-...', candidate: null },
    CADENCE_GRADING_MODEL:   { approved: 'claude-sonnet-4-...', candidate: null },
  },
  // frozen historical entries, same pattern as assessment-config.mjs's
  // getAssessmentConfig(version) — never mutate an existing version
};
```

- **`CADENCE_CHAT_MODEL`** — checkpoints + guide panel (currently the
  Worker's `ALLOWED_MODELS`).
- **`CADENCE_GRADING_MODEL`** — Module 12 Part II/III (currently
  `cadence-grader.mjs`'s `ALLOWED_MODEL`).
- Do **not** add `CADENCE_REMEDIATION_MODEL`/`CADENCE_RESEARCH_MODEL` yet —
  nothing in the current system calls a model for either purpose; adding
  the role now would be speculative config with no caller, which is exactly
  the kind of premature abstraction `CLAUDE.md` and this project's own
  conventions reject. Add them when a real remediation-conversation or
  research feature is actually being built.
- **The Worker-side sync problem is real and needs a process fix, not just
  a code fix**: since `cadence-worker/worker.js` can't import this module
  at Cloudflare's deploy-by-paste boundary, the practical answer is (a)
  the Worker's `ALLOWED_MODELS` constant becomes a single-line value that a
  script can generate/verify against `model-config.mjs` before every manual
  paste, and (b) `tests/` gains a static check that fails CI-equivalent
  local test runs if the repo's `cadence-worker/worker.js` constant and
  `cadence-grader.mjs`'s constant disagree without an explicit, recorded
  reason — this at least catches repo-internal drift immediately, even
  though it can't see the live-deployed value. A documented manual
  "confirm deployed Worker matches repo before flipping the approved
  version" step closes the rest.
- **Promotion workflow:** `approved` is what's live; `candidate` is what's
  being regression-tested (Section 21). Promotion = moving `candidate` to
  `approved` in a new versioned config entry, then manually re-pasting the
  Worker and redeploying the Pages Function — never automatic, never
  "latest."
- **Version logging:** add `model_provider`/`model_name` (not a full
  semantic version — Anthropic model strings already encode this) to
  `certification_attempts.part3_conversation_state`'s per-turn record and to
  a new lightweight `checkpoint_attempts` log (Section 8) if one is built.
  This is additive-only, matching the migrations policy in `CLAUDE.md`.
- **Rollback:** because config is versioned by string (matching
  `assessment-config.mjs`'s existing precedent), rollback is "point
  `approved` at the previous version's string" — no schema change needed,
  ever.

This directly answers the "challenge the current architecture" instruction:
the current pattern (two independent hardcoded constants) is not simpler
than a shared config — it's actually *more* fragile, since simplicity was
never the reason it exists; it exists because nobody has needed to touch
model config since launch prep began. It should change.

---

## 6. Checkpoint UX audit

**Current container:** every checkpoint is an inline `.cp-box`-descended
region embedded directly in the lesson content flow — not a dedicated
full-screen view. Structure is consistent: `.cp-head` (avatar dot + label) →
`.cp-q` (question) → `.cp-input-row` (textarea + voice + send) → `.cp-res`
(single feedback block, `aria-live="polite"`). This is a **single-turn**
pattern — one question, one answer, one feedback block — not a scrolling
multi-message transcript. There is no rendered history of a failed attempt
once a retry succeeds.

**The guide panel is the only place with an actual multi-message,
scrolling chat transcript today** (`.gp-msgs`, `gpStream()`'s
word-by-word fake-typing render). It is not full-screen either — a
slide-up panel over the lesson content, closable, `max-width` constrained.

**Cadence identity:** the breathing-dot + "CADENCE" wordmark badge
(`.gp-av`/`.gp-av-dot`/`.gp-av-label`) is the one real, approved, site-wide
identity mark, reused by Module 12 Part III's placeholder badge per the
prior task's owner-authorized decision. **No avatar image asset exists in
the repository** (confirmed by this task's own search — no new file found
beyond the two unrelated screenshots already recorded in `module-12.md`).
This remains a known, carried-forward launch-asset gap — this audit does
not generate a replacement, per instruction.

**Message history:** none for checkpoints (single Q→A pair only); real for
the guide panel (session-only); real and durable for Module 12 Part III.

**Composer:** identical `.cp-input`/`.cp-btn`/`.voice-btn` markup pattern
reused everywhere (checkpoints, guide panel, Module 12 Part III) — this
part is already consistent. Auto-grow (`grow()`/`autoGrow()`) is
implemented twice with slightly different caps (100px in the shared
`grow()`, 120px in Module 12's local `autoGrow()`, 200px as `startVoice()`'s
own fallback when `oninput` isn't wired the same way) — cosmetic, not a
functional bug, but real duplication a shared component would remove.

**Voice:** one implementation, `startVoice()`, Web Speech API
(`SpeechRecognition`/`webkitSpeechRecognition`), reused identically
everywhere via either direct `onclick="startVoice(...)"` markup or the
`voiceButtonHtml()` helper's `window.startVoice` presence check. Typed and
dictated text enter the exact same textarea and therefore the exact same
grading call — there is no separate voice grading pathway anywhere in the
codebase. This already satisfies Section 15's requirement.

**Mobile / safe-area / keyboard behavior — a real, repo-wide gap.** This
audit grepped the entire codebase (`headspa-mastery.html`,
`module12-certification.js`, all associated CSS) for `safe-area`,
`env(safe-area-inset...)`, `100vh`/`dvh`/`svh`, `visualViewport`, and found
**none** anywhere Cadence appears. The only responsive behavior present is
a few `@media (max-width: ...)` layout breakpoints and JS-driven textarea
auto-grow. On iOS Safari/Android Chrome this is a known failure mode: a
composer can end up hidden behind the on-screen keyboard or the
home-indicator safe area, with nothing in this codebase mitigating it
today, in any of the three chat-like surfaces.

**Retry:** every surface shows a friendly inline error and re-enables input
without losing typed text — except Module 12 Part III's retry path, which
has the real bug documented in Finding L1 below.

**Resume:** checkpoints resume correctly via `restoreLessonState()`
re-reading `APP_STATE`; Module 12 resumes correctly via server transcript
re-fetch; the guide panel does not resume (by design/accident — it's fully
ephemeral, see Section 8).

**Can one reusable shell power all four modes?** Yes, for the
*presentation* layer (transcript rendering, composer, voice button, mobile
safe-area handling) — the composer markup is already nearly identical
everywhere. **No**, not for the *authority* layer without deliberate
per-mode gating — checkpoints currently let the AI's own `{pass,feedback}`
decide the outcome directly, while Module 12 separates AI evaluation from a
deterministic decision layer (`scoring.mjs`). See Section 12 for why this
distinction matters and needs an explicit owner ruling, not a silent
default.

---

## 7. Cadence modes — evaluation

| Mode | Exists today? | Current implementation | Gap vs. target |
|---|---|---|---|
| A — Required checkpoint | Yes | `submitCheckpoint()`, direct AI pass/fail | No criterion-level structure, no follow-up-limit concept (checkpoints allow unlimited retries by design — different from certification's max-one-follow-up rule, and that's a *correct*, intentional difference, not a bug) |
| B — Module 12 certification interview | Yes, fully built | `evaluateInterviewTurn()` + `scoring.mjs` | Retry-after-failure bug (L1); no rate limiting on this path (Worker has it, this doesn't) |
| C — Ask Cadence | **De facto yes** (guide panel), not named/positioned as such | `gpSend()`/`toggleGuide()` | Fully ephemeral, no dashboard entry point, no explicit "never touches graded state" contract beyond "it just doesn't call those functions" (true today, but implicit, not enforced by construction the way Review Mode's isolation is) |
| D — Remediation | No | — | `remediation_activity` is `'course_review'` only (open a module, click "Mark Review Complete") — no conversational remediation mode exists anywhere yet |

**Shared vs. separate, concretely:**
- **UI shell**: shareable now (composer/voice/transcript rendering are
  already near-identical).
- **Message schema**: shareable — `{role, content}` pairs are already the
  de facto shape in both `gpHistory` and `part3_conversation_state`.
  transcripts; a shared schema is a documentation exercise more than a
  rewrite.
- **Provider layer**: shareable once Section 5's config module exists.
- **Retry logic**: shareable once Finding L1/L2 are fixed generically
  rather than per-surface.
- **Authority rules**: must stay separate and explicit per mode — this is
  the one thing that should never be unified, per Section 12/19.

---

## 8. Conversational naturalness

Checkpoints do not have a "canned bridge" problem today, because they are
single-turn (one question, one AI-generated response per submission) — the
repetitive-chatbot risk the task describes doesn't have anywhere to
manifest yet in that surface.

**Module 12 Part III had exactly this problem, and it was already found and
partially fixed** (`module-12.md`, "Pre-migration completion pass," Step
95): a single hardcoded lead-in sentence was replaced with `pickBridge()`, a
6-variant pool per bridge type (`nextBridges`/`followUpBridges`) that
re-rolls on an immediate repeat, with production preferring a real
Cadence-generated `transitionLine` (already asked for in
`cadence-grader.mjs`'s prompt, `:81`) and falling back to the library only
when absent. Verified by construction: bridge text is never sent to the
grader (`onSendInterviewTurn()` posts only
`{attemptId, interviewId, studentResponse}`).

**This is the right pattern to generalize**, not replace: a small
human-authored pool of connective phrases, randomly selected with
no-immediate-repeat, that never touches scoring — safe because it's
presentation-only by construction (the grader never sees it), not because
of a runtime check that could be bypassed. The same approach applied to
checkpoint feedback transitions (if/when checkpoints grow multi-turn
follow-ups) would need the same construction: bridge selection must happen
entirely client-side or in a layer that cannot influence
`evaluateCheckpointAnswer()`'s system prompt.

---

## 9. Cadence identity

No change from the handoff's recorded status: the owner has an approved
avatar asset not yet in the repository. Current treatment (breathing-dot +
wordmark badge) is a deliberate, owner-authorized placeholder, reused
consistently between the guide panel and Module 12. **This audit records
one clear swap point requirement for the eventual sweep implementation**:
whatever shared conversation shell gets built (Section 6) should render the
identity mark from one single component/partial, so the eventual real-asset
swap is a one-file change — today it would require editing the badge markup
in at least two places (guide panel header markup, Module 12's
`m12x-cadence-id` badge).

---

## 10. Transcript persistence — data model found

| Data | Where | Durable? | Shape |
|---|---|---|---|
| Checkpoint answer + feedback | `APP_STATE.data.progress[moduleId].checkpointMeta[cpId]`, localStorage `levo_app`, synced to Supabase `course_progress.state` | Yes, but **single pair only** — overwritten every submit | `{status, feedback, answer, attempts, updatedAt}` (fixed 5-key shape, reconstructed by `sanitizeProgress()` on every load — extra fields cannot survive) |
| Cross-module Cadence "memory" | `APP_STATE.data.student.cadenceMemory.notableAnswers[]` | Yes, capped at last 8 | `{moduleId, checkpointId, summary (≤150-220 chars, derived, never raw), tags, updatedAt}` — **never the raw answer text** |
| Guide panel chat | `gpHistory` (plain JS array) | **No — memory-only**, wiped on module navigation and page reload | `{role, content}[]`, capped at last 16 in memory |
| Module 12 Part III | `certification_attempts.part3_conversation_state` (Supabase jsonb) | Yes, server-authoritative, RLS-protected | Per-interview `{transcript, followUpUsed, finalized, criterionScores, explicitUnsafeDomains, patternTags, finalizedAt}` |

**What belongs where, going forward:**
- **Supabase** — anything that must survive across devices/sessions and be
  authoritative for competency (any future full-screen, resumable
  checkpoint conversation; any future Ask Cadence history the student
  should be able to return to). Module 12's `part3_conversation_state`
  pattern is the direct template: one jsonb blob per (student, module,
  surface), server-authoritative writes only, RLS `select`-own.
- **Browser/localStorage** — cosmetic session state only (scroll position,
  "in progress" hints, flag-for-review toggles) — already the pattern in
  use (`APP_STATE`'s non-competency fields, the Part I session-local
  flag-for-review toggle documented in `module-12.md`).
- **Session-only** — anything genuinely disposable, matching the guide
  panel's current behavior — acceptable for a true "ask a quick question
  and move on" mode, but **not** acceptable if Ask Cadence is meant to be
  something a student returns to (Section 13's target), which requires
  moving it into the Supabase tier.

**`localStorage` is correctly never treated as authoritative competency
state today** (checkpoints write to it, but the pass/fail *decision* is
made by the AI response and reconciled to Supabase, and Module 12 never
uses `localStorage` for scoring at all) — this matches the sweep's stated
principle already, no correction needed.

---

## 11. Passed checkpoint state

Already close to the target described in Section 12 of the task. On
`checkpointResolved` (`applyCheckpointInputState()`, `:8028`): input and
button are disabled, `renderCheckpointOutcomeLabel()` shows "Accepted."
Student can see the prompt (`.cp-q`, always rendered), their stored answer
and Cadence's stored feedback (both held in `checkpointMeta[cpId]`, though
this audit did not find explicit UI that *redisplays* the stored answer
text after a page reload — it's present in state but whether it's rendered
back into the textarea on restore should be verified in implementation,
not assumed). A passed required checkpoint cannot be resubmitted through
the normal UI path (`checkpointResolved` gate blocks it) — Review Mode is
the only path that re-exercises the grading call without touching this
state, by construction (Section 2.6 of the handoff, reconfirmed directly:
`ReviewMode.isActive()` short-circuits at both the UI level and inside
`APP_STATE.save()` itself, a genuine belt-and-suspenders guard, not just a
UI-level check).

---

## 12. Human-authored grading authority — a real inconsistency found

**Module 12 already implements "Cadence evaluates, AIMT rules decide"
correctly and completely**: `evaluateInterviewTurn()`/
`evaluateStructuredCasePart()` return structured, criterion-level evidence;
`scoring.mjs`'s `determineCertificationDecision()` — a separate,
deterministic, human-authored function — makes every pass/fail/gate
decision. The AI's JSON output is *evidence*, never the decision itself.

**Required checkpoints do not have this separation.** `evaluateCheckpointAnswer()`
returns `{pass: boolean, feedback: string}`, and `pass` is used
**directly** as the outcome — there is no deterministic layer between "what
the AI said" and "whether the checkpoint is marked passed." This is a real,
current architectural difference between the two graded surfaces, and it
is worth being explicit that it is not automatically a defect: checkpoints
are formative (unlimited retries, no certification weight), and a simpler
direct-decision model may be a deliberate, acceptable choice for
lower-stakes gates. But **it should be a deliberate choice, not a silent
accident of checkpoints having been built before Module 12 established the
"evaluate vs. decide" pattern.** This needs an explicit owner ruling before
Phase 2 (Section 16) — see Owner Decision 6 in Section 20.

---

## 13. Structured grading output — current contracts

**Checkpoints:** `{pass: boolean, feedback: string}`
(`normalizeCheckpointEvaluation()`, `:8107`) — defaults safely to
`pass:false` with a generic message if the model's output is unparseable,
never fails open. No criterion breakdown, no model/version stamp, no rubric
version stamp.

**Module 12 interviews:** `{criterionScores: {id: 0|1|2}, explicitUnsafeDomains: string[], patternTags: {domain: tag}, needsFollowUp: boolean, followUpPrompt?: string, transitionLine?: string}` — already criterion-level, already validated server-side (`typeof parsed.criterionScores !== 'object'` throws rather than silently accepting garbage).

**Module 12 cases:** `{correctnessScore: 0-1, explicitUnsafe: boolean, patternTag: string|null}`.

**Neither contract carries `modelProvider`/`modelName`/`modelVersion`.**
Recommended smallest addition, not the task prompt's full example schema
verbatim:

```
{
  decision: "pass" | "fail" | "needs_follow_up",   // checkpoints: derived from `pass`; interviews: from needsFollowUp
  criteriaEvidence: { [criterionId]: 0 | 1 | 2 },   // interviews only; checkpoints don't have named criteria today
  criticalFlags: string[],                          // interviews/cases only
  feedback: string,
  modelName: string,                                // NEW — from Section 5's config, not re-derived per call
  rubricVersion: string                              // NEW for checkpoints (M0..M11 rubric strings currently have no version stamp at all — a real gap for auditability if a rubric is ever edited)
}
```

Checkpoints should gain a `rubricVersion` concept even before criterion-level
scoring is decided, because right now there is **no way to tell which
version of a checkpoint's rubric graded a given stored `answer`/`feedback`
pair** if the rubric text in `headspa-mastery.html` is ever edited later —
a real, currently-invisible gap against the Standard's own auditability
principle (Section 15 of the certification standard), even though that
standard is nominally about certification, not checkpoints.

---

## 14. Model regression/promotion — none exists

No evaluation set, no comparison harness, no promotion workflow exists
anywhere in this codebase today for either checkpoint grading or
certification grading. `tests/certification-*.test.mjs` test the
*deterministic* layers (scoring math, randomization, attempt ladder)
thoroughly (1219/1219 assertions), but **zero tests exercise a real
Anthropic call** — every test uses `mockEvaluateStructuredCasePart`-style
fixtures. This is appropriate for CI (no live API dependency, no flakiness,
no cost) but means there is currently no artifact anywhere that could
answer "would candidate model X grade the same fixed evaluation set the
same way as the approved model?" Section 5's config module is a
prerequisite for this; the evaluation-set/harness itself is real,
non-trivial future work, not something this audit fabricates.

---

## 15. Reusable core vs. incremental — the actual recommendation

**Do not rebuild the grading engine.** `submitCheckpoint()` /
`evaluateCheckpointAnswer()` and `evaluateInterviewTurn()` /
`evaluateStructuredCasePart()` are both already sound, already tested
(indirectly, via the deterministic layers around them), and already follow
the "human rubric in, AI evidence out" principle Module 12 correctly
established. Migrating twelve checkpoints onto a "new" grading primitive
that does the same thing the current one does would be pure churn.

**Do build one shared layer beneath the presentation/provider/persistence
seams that are genuinely fragmented today:**

1. A server-side model-config module (Section 5) — closes the drift already
   found in production.
2. A shared client conversation shell (transcript render, composer, voice
   button, mobile safe-area handling) that the guide panel, any future
   full-screen checkpoint UX, and Module 12 Part III all mount — built once,
   used by all three, instead of the current three near-identical composer
   implementations with slightly different auto-grow caps.
3. An optional durable-transcript Supabase table for any surface that needs
   multi-turn persistence beyond the single answer/feedback pair
   checkpoints keep today — modeled directly on
   `certification_attempts.part3_conversation_state`, not invented fresh.
4. A shared auth-resolution helper — `auth.mjs`'s `resolveUser()` and the
   Worker's `verifySupabaseToken()` do the same thing with two independently
   maintained implementations (and, as this audit found, the Worker has
   per-user rate limiting that the certification path does not — a real gap
   worth closing in the same pass).

**Verdict: extend the reusable core into the seams, keep the grading
primitives as-is.** This is neither "leave everything exactly as it is" nor
"tear down and rebuild" — it's building the one missing layer (provider
config + shared shell + shared persistence pattern) underneath
already-correct grading logic, and fixing the concrete bugs this audit found
along the way because they block launch regardless of the larger redesign's
timeline.

---

## 16. Implementation phases (accepting the proposed shape, reordered slightly)

**Phase 0 — Pre-sweep hotfixes (new, not in the original phase list — these
are launch blockers independent of any redesign):**
- Reconcile the live Worker's `ALLOWED_MODELS` value against the repo and
  against the intended approved model (owner action + a matching repo
  commit, not silent).
- Fix Module 12 Part III's retry-after-failure transcript corruption
  (Finding L1) — this can strand a student mid-certification-interview on
  any transient Anthropic error today.
- Confirm `ANTHROPIC_API_KEY` provisioning in both runtimes (owner action).

**Phase 1 — Cadence Core.** Provider config (Section 5), shared message
schema, the durable-transcript table pattern, the smallest viable grading
contract addition (Section 13), idempotency fix generalized from Finding
L2, shared auth-resolution helper.

**Phase 2 — Required Checkpoints.** Decide and implement Owner Decision 6
(evaluate/decide separation or not); shared full-screen UX if approved
(Section 6/7); progress integration (already correct, extend rather than
rewrite); passed-state (already correct, extend); resume/retry (extend
Finding L2's fix here too); voice/composer (already shared, add mobile
safe-area handling here — the one universally-missing piece found in this
audit).

**Phase 3 — Module 12 Integration.** Reuse the Phase 1/2 shell for Part
III's presentation only; preserve every certification rule untouched (no
scoring/gating/rubric change — this audit found nothing wrong with that
layer); apply Finding L1's fix; live grading verification once
Phase 0's key confirmation lands.

**Phase 4 — Ask Cadence / Remediation.** **Ask Cadence should be built by
giving the existing guide panel real persistence and a dashboard entry
point, not by building a new surface** — it already has the right tone
constants, module-awareness, quick prompts, and voice input; it is missing
only durability and discoverability. Remediation (Mode D) is genuinely new
work — no conversational remediation exists today, only "open the module
and click Mark Complete."

**Phase 5 — Course-Wide Migration/Cleanup.** Given this audit's actual
findings, this phase is smaller than the handoff anticipated: there is no
sprawling set of legacy checkpoint implementations to migrate (Section 2).
The real cleanup items are the auto-grow-cap inconsistency (Section 6), the
duplicated auth-resolution code (Section 15 point 4), and folding the guide
panel's ad hoc styling into the shared shell.

**Phase 6 — Model Validation/Launch Gate.** Evaluation suite (Section 14 —
build from scratch, nothing exists), promotion/rollback per Section 5, live
environment QA (blocked on Phase 0's key confirmation).

---

## 17. Stop-loss / rearchitecture gates — evaluated against real findings

- *"If more than N incompatible checkpoint implementations exist"* — **not
  tripped.** One implementation, twelve thin wrappers. Do not rearchitect
  the grading engine on this basis.
- *"If the current persistence model cannot support safe resume"* — **not
  tripped for checkpoints or Module 12** (both resume correctly today).
  **Would be tripped** if Ask Cadence is built by extending `gpHistory`
  as-is without adding real persistence — that data model cannot support
  resume by construction (it's wiped on navigation). This is the one
  concrete case in this audit where "just extend what exists" would need a
  genuine new piece (Supabase persistence), not a patch.
- *"If provider/grading logic is duplicated across multiple runtimes"* —
  **already tripped, confirmed live in this audit** (the model-string
  drift). This alone justifies Section 5's centralized config as
  non-optional Phase 1 work, not a nice-to-have.
- *"If Module 12 and normal checkpoints require fundamentally different
  state machines"* — **partially true, and that's fine.** The
  *surrounding* assessment machinery (part-locking, attempt ladder,
  critical-domain gates) is legitimately different and should stay separate
  — Module 12's complexity is earned by what it certifies. The *AI-turn*
  primitive underneath (send message, get structured evidence back) can
  still be shared. Do not use this gate to justify rebuilding Module 12's
  certification state machine; do use it to keep certification-specific
  gating logic out of the shared shell.

---

## 18. Launch blockers found by this audit

1. **Live Worker model-string drift** (`claude-sonnet-4-6` deployed vs.
   `claude-sonnet-4-20250514` committed) — undocumented, no review record.
2. **`ANTHROPIC_API_KEY` provisioning still unconfirmed** for both the
   Worker and the Pages Functions runtime — narrowed by this audit
   (Worker's existence and live source are now confirmed) but not closed;
   no available tool inspects env-var/secret bindings.
3. **Module 12 Part III retry-after-failure bug (Finding L1)** — a
   transient Anthropic failure causes the server to persist the student's
   turn, then the client silently reverts its own view and re-offers the
   same text; the retry appends a second consecutive user-role message to
   the stored transcript, which will very likely fail identically against
   Anthropic's role-alternation requirement — a student can get stuck in a
   repeating failure loop mid-certification-interview with no visible way
   out except abandoning the attempt.
4. **No true idempotency guard for concurrent Part III submissions
   (Finding L2)** — the only check covers post-finalization resubmits, not
   concurrent in-flight requests before either write lands.
5. **Cross-tab race condition (Finding L4)** — two open tabs can cause a
   passed checkpoint's stored Cadence feedback text to be silently
   overwritten by a stale push from the other tab, because
   `aimt-progress-sync.js`'s score-based reconciliation only runs once at
   `init()`, not before every push.
6. **No mobile safe-area/keyboard-avoidance handling anywhere** Cadence
   appears — a repo-wide, not surface-specific, gap.
7. **No real Cadence avatar asset** — carried forward, not new, not
   resolved by this audit per instruction.
8. **No device-lab QA anywhere in the course** — carried forward, standing
   gap across every module, not new to Cadence.
9. **No rate limiting on the certification Anthropic call path**
   (`submit-interview-turn.js`) — the Worker has one, `cadence-grader.mjs`'s
   caller does not; a plausible cost/abuse gap for a server-authoritative
   path, even though it's not client-reachable except through a
   logged-in, entitled, authenticated user.

---

## 19. Ask Cadence — recommendation

**Build it by extending the guide panel, not by building a new surface.**
It already has: module-aware system prompts, a working quick-prompt
library, voice input, the correct tone constants, and — critically — it
already never touches `APP_STATE`/progress/scoring (confirmed: zero calls
to `setCheckpointResult`, `captureCheckpointMemory`, or any progress-writing
function anywhere in `gpSend()`'s path). The only real gaps are (a) no
persistence — needs a Supabase table modeled on
`certification_attempts.part3_conversation_state`, scoped per
(student, course, and optionally module, per the "module-specific Cadence
threads" decision already recorded in `00-global-decisions.md`) — and (b)
no dashboard entry point (`my-aimt.html` currently has none at all).

**Simplest useful launch implementation:** add persistence (one new table,
additive migration, RLS `select`/`insert own`-only matching every other
Cadence-adjacent table's trust model) and a dashboard entry point that
opens the same guide panel already built, scoped to the student's
last-active module or a general thread. Do not build a new chat UI for
this — the guide panel already is one.

**Guardrails already effectively in place, worth making explicit/enforced
rather than incidental:** Ask Cadence must never call
`setCheckpointResult`/`captureCheckpointMemory`/any certification endpoint —
true today by omission, should become true by construction (a lint-style
static test, mirroring the existing static tests that confirm Review Mode
and the local QA harness never touch production endpoints).

---

## 20. Owner decisions required before implementation

1. **Approve or reject Phase 0's hotfixes proceeding immediately**, ahead
   of the larger sweep redesign (recommended: yes — these are concrete bugs
   independent of any architecture decision).
2. **Approve reconciling the live Worker model string** with the repo
   (requires an owner-performed dashboard check/redeploy, since this task
   is not authorized to change Cloudflare configuration or deploy).
3. **Approve provisioning/confirming `ANTHROPIC_API_KEY`** in both runtimes
   as a hard precondition for any live-model QA (owner action, Cloudflare
   dashboard).
4. **Rule on Owner Decision 6 below** before Phase 2 begins — this changes
   checkpoint grading's architecture, not just its UI.
5. **Approve the reusable-core-not-full-rebuild recommendation** (Section
   15) and the phase order in Section 16.
6. **Should required checkpoints adopt Module 12's evaluate/decide
   separation** (structured criterion evidence + a deterministic pass rule
   layer), or remain a direct AI pass/fail decision, given checkpoints are
   formative/unlimited-retry rather than certifying? (Section 12 —
   recommend keeping direct-decision for checkpoints as a deliberate,
   documented choice, reserving the heavier evaluate/decide separation for
   graded/certifying surfaces, but this is the owner's call, not this
   audit's to make unilaterally.)
7. **Approve building Ask Cadence as an extension of the existing guide
   panel** (Section 19) rather than a new surface.
8. **Approve full-screen conversational checkpoint UX** (Section 7) as an
   actual Phase 2 deliverable, or confirm the current inline `.cp-box`
   pattern is acceptable for launch with only the mobile-safe-area gap
   closed — this is a real scope decision, not a small one.
9. **Confirm the real Cadence avatar asset timeline** — carried forward
   from the prior task, still unresolved, still not this document's to
   invent.
10. **Decide whether the "no automatic latest-model" and
    promotion/regression rigor (Sections 5/14) should apply equally to
    checkpoint grading**, or only to certification grading, given the
    stakes differ materially between the two.

---

## 21. Baseline test results

All 12 existing deterministic suites re-run clean immediately before this
audit's conclusions were finalized:

```
certification-attempt-ladder.test.mjs          12/12
certification-content-bank-sync.test.mjs         4/4
certification-content-bank.test.mjs            810/810
certification-local-qa-tool.test.mjs            27/27
certification-part3-cadence-and-remediation.test.mjs  63/63
certification-part3-progression.test.mjs        54/54
certification-randomization.test.mjs            27/27
certification-review-retake.test.mjs            52/52
certification-scoring.test.mjs                  21/21
certification-ui-refactor.test.mjs              41/41
module-09-migration.test.js                     74 assertions, 20/20 fixtures
module-11-relocation-migration.test.js          34 assertions, 10/10 fixtures

TOTAL: 1219/1219 assertions, zero regressions — identical to the
       documented pre-sweep baseline in module-12.md.
```

No test in this suite exercises a live Anthropic call (all use fixtures/mocks
for the model layer) — this is appropriate for CI but means these numbers
say nothing about live-model grading quality, which remains genuinely
unverified pending `ANTHROPIC_API_KEY` confirmation (Finding above,
Section 4).

---

## Detailed findings reference (L-numbers cited above)

**L1 — Module 12 Part III retry-after-failure transcript corruption.**
`functions/api/certification/submit-interview-turn.js` (catch block,
~line 65-82) persists the student's turn to
`part3_conversation_state[interviewId].transcript` even when the Anthropic
call fails, and returns `502`. `module12-certification.js`'s
`onSendInterviewTurn()` (~line 1233-1237) then pops that same turn back off
the **client's local** transcript and restores the typed text as a draft —
so the student sees no evidence anything was sent, and resending appends a
**second, consecutive user-role message** to the server's already-persisted
transcript with no assistant turn between them, which will likely fail
Anthropic's role-alternation requirement identically on retry, repeating
indefinitely.

**L2 — No concurrency guard for in-flight Part III submissions.** The only
idempotency check (`submit-interview-turn.js`, `if (state.finalized) return
...`) covers only a fully-finalized conversation. Two near-simultaneous
requests before either PATCH lands both read the same pre-write state, both
call Anthropic independently, and the second write silently wins — no
version/`If-Match` check exists on the PATCH.

**L3 — Mobile safe-area/keyboard-avoidance is absent everywhere.**
Confirmed by direct grep across `headspa-mastery.html` and
`module12-certification.js` for `safe-area`, `env(safe-area-inset...)`,
`100vh`/`dvh`/`svh`, `visualViewport` — zero matches in any Cadence-adjacent
CSS or JS.

**L4 — Cross-tab race can drop a passed checkpoint's stored feedback.**
`aimt-progress-sync.js`'s `doPush()` always upserts the tab's full current
snapshot (last-write-wins at the Supabase row level); the score-based
merge/reconciliation (`pullAndMerge()`) only runs once, at `AIMT_SYNC.init()`
time, not before every push. A second tab with a stale in-memory snapshot
(triggered by any unrelated `save()`, e.g. a scroll-position update) can
overwrite a first tab's just-passed checkpoint's stored answer/feedback text
in Supabase.

**L5 — Two independent, hand-maintained auth-resolution implementations.**
`functions/_lib/certification/auth.mjs`'s `resolveUser()` and
`cadence-worker/worker.js`'s `verifySupabaseToken()` implement the same
Bearer-token-to-Supabase-user pattern independently, with one concrete
divergence already present (different `apikey` header value used) and no
shared code path keeping them in sync.

---

## Confirmation

No runtime application code, Supabase schema, model configuration, or
Cloudflare deployment was modified by this task. This document and the
corresponding update to `00-aimt-current-course-status.md` are the only
changes made.
