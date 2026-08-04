# Course Audit — Implementation Log

Chronological record of work done under the course audit/rebuild. Entries
are added as steps are completed — this is a log, not a plan.

---

## 2026-08-03 — Step 2: Audit workspace + Module 0 source extraction

Created the audit workspace (`docs/course-audit/00-global-decisions.md`,
`docs/course-audit/implementation-log.md`,
`docs/course-audit/modules/README.md`,
`docs/course-audit/modules/module-00-source.md`,
`docs/course-audit/modules/module-00.md`) and extracted the complete current
Module 0 experience (curriculum, checkpoint, Cadence prompts, onboarding
sequence, completion behavior, state model, source map, confirmed
implementation concerns) into `module-00-source.md`.

This was documentation and extraction only. No production files were
modified — `headspa-mastery.html`, `assets/js/headspa-state.js`, and all
other production code are untouched. Work was done on branch
`course-audit-build`, created in Step 1 as a restore point off `main`
(clean at commit `be33f50`).

Modules 1–11 were not touched. `module-00.md` (the approved-spec file) was
created with empty headings only, pending external audit.

---

## 2026-08-03 — Step 3: Approved Module 0 specification added

The externally-reviewed approved specification was placed into
`docs/course-audit/modules/module-00.md`, populating all nine required
sections (Approved outcomes, Keep unchanged, Required corrections, Final
replacement copy, Checkpoint specification, Approved interactions, Cadence
behavior, Acceptance criteria, Implementation notes). `modules/README.md`
was updated to reflect Module 0 status as **Approved — awaiting
implementation**.

This was a documentation update only — the specification authorizes future
implementation but nothing was implemented. No production files were
modified. Work remains on branch `course-audit-build`.

---

## 2026-08-03 — Step 4: Guided completion audit structure

Recorded two newly approved course decisions, documentation-only:

1. **Welcome Module naming** — the technical module with ID `0` is now
   presented to students as "Welcome Module" instead of "Module 0." All
   technical identifiers (module ID `0`, `module0Wrap`, `M0`, `m0cp1`,
   progress keys, function names, state identifiers) are explicitly
   preserved. Module 1 remains the next student-facing module; no technical
   renumbering occurred. Recorded in `00-global-decisions.md`
   ("Welcome Module naming"), `modules/module-00.md` (new "Amendment —
   Welcome Module naming" section), and `modules/README.md`.
2. **Guided Completion Path** — approved as an optional, self-paced
   addition (not a redesign of the core self-paced model) to improve
   follow-through and practical application, with an explicit list of
   allowed and disallowed mechanics. Final course duration is deferred
   until all modules are audited. Every future `module-XX.md` must now
   document six new fields (estimated learning time, estimated hands-on/
   application time, competency demonstrated, suggested practice/
   application task, earlier concepts to revisit, suggested position in the
   Guided Completion Path). Recorded in `00-global-decisions.md`
   ("Guided Completion Path"), `modules/module-00.md` (new "Guided
   completion structure" section, with the six fields filled in for the
   Welcome Module), and `modules/README.md` (new "Required fields for
   every future module audit" section).

Also recorded the approved student-facing course sequence — Welcome Module,
Modules 1–11 (instructional), Module 12 (Final Exam, demonstrates
course-wide competency before certification is issued) — in
`00-global-decisions.md` ("Course sequence & Final exam (Module 12)") and
`modules/README.md`. Guided Completion Path pacing now explicitly targets
completion of the Module 12 Final Exam, not just the instructional modules.
No exam design, certificate-logic change, new production module, or
technical module renumbering was performed — Module 12's technical
implementation is deferred until the existing Module 11 and certificate
flow are audited.

This was a documentation-only update. No production files were modified.
Work remains on branch `course-audit-build`.

---

## 2026-08-04 — Step 5: Audit-only Course Review Mode

Implemented a minimal, audit-only Course Review Mode so the course owner can
inspect every module without completing checkpoints or touching real
student progress. This is the first Step in this audit that changes
production files.

**Files changed:**
- `assets/js/headspa-state.js` — added the `ReviewMode` object (hostname
  allow/block logic, `sessionStorage`-backed activation, `applyUI()`,
  `exit()`); guarded `APP_STATE.save()` to skip the `localStorage['levo_app']`
  write while Review Mode is active; guarded `APP_STATE.canAccessModule()`
  to allow any valid module while active; added
  `APP_STATE.wouldBeLockedWithoutReview()` (a read-only helper so the UI can
  still show which modules would be locked for a real student).
- `assets/js/aimt-progress-sync.js` — `AIMT_SYNC.init()` now no-ops
  (logs and returns) when Review Mode is active, so `save()` is never
  wrapped and no Supabase push/pull ever occurs during a review session.
- `headspa-mastery.html` — added the review-mode banner markup/CSS and
  `#reviewModeBanner`/`.review-mode-active` styles; call
  `ReviewMode.applyUI()` before `showApp()` on `DOMContentLoaded`; added a
  "Review" badge branch in `renderHomeProgress()` for modules that would
  otherwise show "Locked"; added `submitCheckpointReviewMode()` (reuses the
  real checkpoint question and Cadence grading prompt for functional
  testing, labels results "Review Mode test — not saved", never calls
  `setCheckpointResult`/`captureCheckpointMemory`/`_checkModuleComplete`);
  `submitCheckpoint()` now routes to it when Review Mode is active; added an
  early guard in `showCertificate()` that shows "Certificate issuance is
  disabled in Course Review Mode." and returns before the completion check,
  `markModuleComplete(11)`, or the `/api/issue-certificate` fetch.

**Activation:** `?review=1` in the URL, only on a non-production hostname
(see Production safeguards). Stored in `sessionStorage['aimt_review_mode']`
(not `localStorage`), so it survives a refresh in the same tab but clears
when the tab closes or `Exit Review Mode` is used.

**Production safeguards:** `ReviewMode.init()` hard-blocks activation (and
clears any stale session flag) on an exact-match production hostname —
`aimtrichology.com`, `www.aimtrichology.com`, or the bare Cloudflare Pages
production alias `aimt-site.pages.dev` — identified from `sitemap.xml`,
`robots.txt`, `CLAUDE.md`, and `docs/AIMT-Domain-Day-Checklist.md`. Eligible
hosts are `localhost`, `127.0.0.1`, `*.local`, and Cloudflare Pages
branch-preview subdomains matching `<branch>.aimt-site.pages.dev`. Verified
this correctly rejects spoofing attempts like
`aimt-site.pages.dev.evil.com`. Normal authentication and entitlement
checks (`shouldEnterPurchasedCourse`, etc.) are untouched — Review Mode only
changes locking/persistence *after* a student would already be let in.

**Progress-isolation behavior:** `APP_STATE.save()` is the single choke
point for all local persistence (resume location, module visits, read
percentage, checkpoint state, completion, unlock state); it no-ops entirely
while Review Mode is active, so `localStorage['levo_app']` is never written.
`AIMT_SYNC.init()` no-ops while active, so `save()` is never wrapped and no
Supabase `course_progress` push/pull ever happens. Checkpoint test
submissions run through a separate `submitCheckpointReviewMode()` path that
never calls the functions that mark a checkpoint passed, complete a module,
or unlock the next one — feedback is shown but labeled "Review Mode test —
not saved." Certificate issuance is blocked before any state mutation or
network call.

**Exit:** the persistent banner's "Exit Review Mode" button (`ReviewMode.exit()`)
clears the session flag and reloads without `?review=1`, restoring normal
locking immediately (verified: a previously-open module reverted to
"Locked" and became unclickable again).

**Tests performed (all passed):** normal mode unchanged; hostname
allow/block matrix (12 cases incl. spoofing); activation on `127.0.0.1`;
all modules clickable in Review Mode including normally-locked ones;
`localStorage['levo_app']` byte-identical before/after review navigation;
checkpoint test submission left `checkpointMeta` empty in memory and
storage and labeled "Review Mode test — not saved"; `AIMT_SYNC.init()`
confirmed skipped via console log; certificate `alert()` fired with the
exact required text, no `/api/issue-certificate` request was made, module
11 completion untouched; refresh (with and without `?review=1` in the URL)
preserved Review Mode via the session flag; Exit restored normal
Locked/non-clickable state; mobile viewport (375×812) showed no horizontal
overflow; no console errors at any point. Tested using a local static
server against the file directly — real Supabase auth/entitlement was not
exercised end-to-end since no test credentials are available in this
environment, but `shouldEnterPurchasedCourse()` and related gating code
were not modified.

Module 12 Final Exam was not added. The Welcome Module rename was not
implemented. Module 1 was not extracted. Certificate backend logic was not
modified.

---

## 2026-08-04 — Step 6: Fix — review mode broke authenticated preview access

**Bug report:** an authenticated, entitled user on the branch-preview host
signed in, entered the course, then added `?review=1` to the exact
course-page URL and reloaded — and was routed to the purchase/landing page
instead of staying in the course.

**Root cause (confirmed, not caused by Review Mode's own access/persistence
logic):** `shouldEnterPurchasedCourse()` (`headspa-mastery.html`, course
entry gate) requires one of two "admission triggers" on *every* page load,
checked before it ever looks at the Supabase session: a one-time
`sessionStorage` handoff flag set by `student-access.html` — deleted the
instant `consumeAccessFlowHandoff()` reads it — or an explicit `?enter=1`
query param. On successful entry, `history.replaceState(...,
window.location.pathname)` strips all query params (including `enter=1`)
from the visible URL. So by the time the user manually added `?review=1`
and reloaded, both admission triggers were already gone (handoff consumed,
`enter=1` stripped) — `shouldEnterPurchasedCourse()` returned `false` before
ever checking auth or entitlement, and `showApp()` fell through to the
landing page. This isn't a hard redirect (the URL keeps `?review=1`); it's
the landing/purchase view being shown in place. This would happen with any
manually-added query param on a reload, not something specific to
`review=1` — Review Mode's own code (`canAccessModule`, `save()` guard,
etc.) never even got a chance to run, because the user never got past this
pre-existing one-time entry gate.

Also investigated and ruled out per the debugging checklist: the
`workers.dev` hostname question (the only `workers.dev` host in this repo
is the unrelated Cadence AI proxy, `headspa-proxy.brandrice.workers.dev`;
there is no `workers.dev` page hosting, and the real Cloudflare Pages
branch-preview hostname format, `<branch>.aimt-site.pages.dev`, was already
matched correctly by `ReviewMode`'s existing hostname regex); and whether
auth/session state is domain/path/reload-dependent (it isn't — the Supabase
session itself persists fine across reloads; only the separate one-time
entry-trigger gate was the problem).

**Fix (smallest possible — one function, one file):**
`headspa-mastery.html`, `shouldEnterPurchasedCourse()` — added
`window.ReviewMode.isActive()` as a third admission trigger alongside the
existing `enter=1` and handoff-flag checks:

```js
const requestedPurchasedEntry = params.get('enter') === '1' ||
  !!(window.ReviewMode && window.ReviewMode.isActive());
```

This is safe because: `ReviewMode.init()` (in `headspa-state.js`) always
runs synchronously at script-parse time, before `shouldEnterPurchasedCourse()`
is ever called (from `showApp()`, on `DOMContentLoaded`), so `isActive()` is
reliably resolved first. `ReviewMode.isActive()` is hard-blocked on every
production hostname (verified in Step 5's hostname matrix), so on
production this change is a no-op — `requestedPurchasedEntry` computes
identically to before. It adds an admission *trigger*, not an entitlement
*bypass* — the real `supabaseClient.auth.getSession()` and
`hasHeadSpaEntitlement()` checks immediately below still run unchanged and
still gate final entry. No hostname allowlist was touched.

**Testing performed** (local static server, mocking Supabase since no real
test credentials are available in this environment — `supabaseClient` is a
top-level `const` so its `auth.getSession` method was patched in place
rather than the binding replaced, to test the real, unmodified
`shouldEnterPurchasedCourse()` function directly):
- Isolated gate-logic comparison under the exact reported repro URL (bare
  `?review=1`, no `enter=1`, handoff already consumed): old logic — gate
  fails (reproduces the bug); fixed logic — gate passes.
- Full function call, same repro URL, mocked authenticated + entitled
  session: `shouldEnterPurchasedCourse()` now returns `true`,
  `setSignedInStudent()` is called, no blocked-access event is logged — the
  user is correctly let into the course.
- Same repro URL, mocked authenticated but **not entitled** session:
  `shouldEnterPurchasedCourse()` still returns `false`,
  `setSignedInStudent()` is **not** called, and
  `headspa_blocked_access_no_entitlement` is still logged — confirms
  entitlement is still fully enforced, not bypassed.
- Normal load with zero triggers (no `review`, `enter`, handoff, or active
  Review Mode) and an entitled user: still correctly returns `false` —
  confirms no regression to the pre-existing, intentional default-denied
  behavior for ordinary page loads.
- No console errors introduced.

Progress-isolation and certificate protections (Step 5) were not touched
and remain unchanged. No curriculum, no new features, no hostname allowlist
changes.

---

## 2026-08-04 — Step 7: Welcome Module implementation

Implemented the approved Welcome Module and student-facing course rename
per `docs/course-audit/00-global-decisions.md` and
`docs/course-audit/modules/module-00.md`. No other module was audited or
edited.

**Files changed:** `headspa-mastery.html` only (180 insertions, 58
deletions). `headspa-state.js` and `aimt-progress-sync.js` were not
touched — no changes were needed to Review Mode, persistence, or sync
logic for this implementation.

**Course-name rename** (student-facing only; `headspa-mastery.html`
filename, `headspa-mastery` slug, all technical identifiers unchanged):
intro screen brand mark, intro begin button, course-home brand wordmark,
`.hpc-title`/`.hpc-label`, resume button, Module 0 guide-identity prompt,
intro personalization prompt — all now read "Head Spa Certification
Course" instead of "HeadSpa Mastery" / "Headspa Mastery".

**Welcome Module naming** (technical module ID `0`, `module0Wrap`, `M0`,
`m0cp1`, progress keys unchanged): `MODULE_TITLES[0]`, the course-home
module-list row title/subtitle, the module hero eyebrow, the resume
button, the module-open Cadence greeting, and the completion-card eyebrow
all now read "Welcome Module" and never "Module 0". The two AI system
prompts that reference "Module 0" (`M0.system`, the Module 0
`MODULE_GUIDE_SYSTEMS[0]` guide identity) were left exactly as approved in
`module-00.md`'s verbatim blocks — those strings are sent to the model as
internal instructions, never rendered as UI copy, so the naming rule
(which governs student-facing copy) doesn't apply to them.

**Source sections changed** (all per the "Final replacement copy" items
A–T in `module-00.md`; everything else in Module 0's curriculum — 0.3,
0.4, 0.6 principles 1/2/5, 0.7's other three cards, 0.8's surrounding
paragraphs, 0.9's other two cards, 0.10, 0.11 — was left verbatim):
intro cinematic script, student-intro label/placeholder, intro
personalization prompt, intro fallback, intro begin button, course-home
labels, module hero eyebrow/description, 0.1's opening paragraph (other
two paragraphs unchanged), a new certification explainer added to 0.2
after the existing "What this course is not" note, 0.5's heading/body/
Cadence note, 0.6 principles 3 and 4, 0.7's intro paragraph ("observe
without being told" → "observe, ask, confirm, and adjust") and its
"Observe"/"Hold the room" cards, 0.8's professional-frame note, 0.9's
"Guide confidently"/"Assess without overstepping" cards, the module-open
Cadence greeting, the guide-chat error message, and the completion card
(eyebrow, title, body naming the demonstrated competency, next-step copy).

**Checkpoint (`m0cp1`) changes:** new two-part question (leadership
distinction + one applied example), new placeholder, new accessible
button label ("Send response to Cadence"), `aria-label="Speak your
answer"` added to the voice button, `aria-live="polite"` added to the
feedback region (the status pill already had it from Review Mode work).
`M0.system` replaced with the approved evaluator prompt that grades only
the two required elements, explicitly instructs the model not to fail for
grammar/spelling/informal wording, and asks one focused follow-up when
only one element is present. `submitCheckpoint()` gained an optional 5th
`errorMessage` parameter (default unchanged, so every other module's
checkpoint error text is byte-identical to before) so only `m0cp1` shows
the approved "Cadence couldn't review your response..." fallback.

**Interaction added:** "Same steps. Different service." — an ungraded,
two-option predict-then-reveal interaction placed after section 0.5 and
before 0.6, using native `<button type="button">` elements with
`aria-pressed`, no persistence, no scoring, no completion/unlock effect
(`selectM0Practice()` never touches `APP_STATE`). Both options remain
reviewable and the selection can be changed after picking either one.

**Accessibility changes:** aria-labels on the checkpoint voice and submit
buttons; `aria-live="polite"` on the checkpoint feedback region; a new
"Show full intro" control (`showFullIntro()`) that immediately reveals
the complete cinematic text; a `prefers-reduced-motion` check in
`startIntro()` that skips the character-by-character animation entirely
for users who request it (same code path as "Show full intro"); a
reduced-motion CSS override for the intro cursor blink; keyboard
submission (Enter submits, Shift+Enter inserts a newline) was already
correct pre-existing behavior in `m0cpKey`, unchanged.

**Tests completed:** normal course entry (verified via
`enterPurchasedCourseHome()`); Review Mode still activates correctly, its
"Review" badges and locked-module access still work, and its checkpoint
test path still shows "Review Mode test — not saved" without touching
stored progress; an existing pre-implementation "passed" `m0cp1` record
was seeded into `localStorage['levo_app']` and confirmed to survive a
reload as "Accepted" with Module 1 still unlocked; new students see
"Welcome Module" everywhere (nav title, hero eyebrow, home row, resume
button, completion card) and never "Module 0"; Module 1's own title is
untouched; a mocked strong answer passes and unlocks Module 1; a mocked
partial answer returns "Needs revision" with one focused follow-up and
does not complete the module; a mocked network failure preserves the
student's typed answer and shows the approved fallback text; the practice
interaction was exercised with real native clicks (not just direct
function calls) — selecting either option updates `aria-pressed`,
applies/removes the `selected`/`is-correct` classes, shows the correct
feedback, and the selection can be changed afterward; full-page text
extraction confirmed every curriculum section renders in the correct
order with no duplicated or missing content; mobile viewport (375×812)
showed no horizontal overflow; console stayed error-free throughout.
`git diff` was scanned for any reference to another module's wrapper ID,
`MN` object, or title string and found none outside intentional "Module
1" forward-references in Module 0's own completion copy.

**Requires manual review (could not be fully verified in this
environment):**
- Enter/Space keyboard activation of the new practice-interaction buttons.
  They are genuine `<button type="button">` elements with no interfering
  keydown handlers, which guarantees native activation in a real browser,
  but this sandbox's synthetic key-event delivery did not trigger a click
  during testing (a real mouse click did work correctly, and a manually
  dispatched `KeyboardEvent` correctly did *not* trigger activation either
  — expected behavior, since synthetic events never fire native UA
  actions). Recommend a real-browser keyboard pass.
- The live Claude model's actual leniency on grammar/spelling/informal
  wording against the new evaluator prompt — checkpoint pass/fail/
  revision flows were verified with mocked AI responses (since this
  environment has no reachable API credentials), not the real model.
- Screen-reader verification (VoiceOver/NVDA) of the new `aria-live` and
  `aria-pressed` behavior — implemented per spec, not audited with an
  actual screen reader.
- `prefers-reduced-motion` behavior was verified by code review (the
  `startIntro()` branch is straightforward) but not exercised with an
  actual OS-level reduced-motion setting.

Guided Completion Path UI, Listen Mode, persistent checkpoint threads, and
Module 12 were not added, per instruction. No other module was audited or
edited.

---

## 2026-08-04 — Step 8: Module 1 source extraction

Created `docs/course-audit/modules/module-01-source.md` (full verbatim
extraction of Module 1's curriculum, both checkpoints and their complete
grading prompts, Cadence guide context and quick prompts, the module-open
greeting, interactions, completion behavior, source map, Guided Completion
Path fields, Listen Mode planning fields, and confirmed implementation
concerns separated from assumptions) and
`docs/course-audit/modules/module-01.md` (empty headings only, including
the two new "Guided completion structure" and "Listen Mode notes" headings
alongside the existing Module 0 spec headings).

This was documentation and extraction only — no production files were
modified, and Module 1's actual curriculum, checkpoints, or Cadence prompts
were not touched. `docs/course-audit/modules/README.md` was updated with a
Module 1 entry (status **Awaiting external audit**) and a note that every
future module audit must now also document Listen Mode fields alongside
the existing Guided Completion Path fields.

Notable findings recorded in the extraction (not fixed): Module 1's
checkpoint grading prompts interpolate a shorter paraphrase of each
question than what the student actually sees in `.cp-q`; Module 1 has no
structured/itemized pass criteria the way Module 0's rewritten `m0cp1`
now does; neither checkpoint has accessibility labels; the completion card
has no distinct competency-naming line; `M1.system` still says "HeadSpa
Mastery"; and no ungraded practice interaction exists in Module 1 despite
its "Say this / Never say" and "Within scope / Outside scope" content
being well-suited to one.

Work remains on branch `course-audit-build`. Module 1 was not implemented
or edited — only extracted.

---

## 2026-08-04 — Step 9: Approved Module 1 specification added

The externally-reviewed approved specification was placed into
`docs/course-audit/modules/module-01.md`, populating all eleven required
sections (Approved outcomes, Keep unchanged, Required corrections, Final
replacement copy, Checkpoint specification, Approved interactions,
Cadence behavior, Acceptance criteria, Guided completion structure,
Listen Mode notes, Implementation notes). Notable approved corrections:
aligning the displayed and evaluated checkpoint questions (currently
mismatched — see the Module 1 extraction), reframing "within scope" from
universal claims to license-dependent language, removing hair-growth and
circulation outcome claims, tightening the flaking script and referral
guidance, adding an ungraded "Where is the line?" practice interaction
between sections 1.4 and 1.5, and the same course-name/Cadence-identity/
accessibility corrections already applied to the Welcome Module.
`modules/README.md` was updated to reflect Module 1 status as **Approved
— awaiting implementation**.

This was a documentation update only — the specification authorizes
future implementation but nothing was implemented. No production files
were modified. Work remains on branch `course-audit-build`.

---

## 2026-08-04 — Step 10: Module 1 implementation

Implemented the approved Module 1 audit specification
(`docs/course-audit/modules/module-01.md`). No other module was audited
or edited.

**Files changed:** `headspa-mastery.html` only (204 insertions, 63
deletions). No changes to `headspa-state.js` or `aimt-progress-sync.js`.

**Copy and behavior implemented:**
- Course name / Cadence identity corrections applied to `M1.systems` and
  `MODULE_GUIDE_SYSTEMS[1]` (no more "HeadSpa Mastery"; Cadence no longer
  claims personal work experience).
- Module identity: home-screen title/subtitle, hero eyebrow/description
  (hero title and `module1Wrap`/`M1`/`m1cp1`/`m1cp2`/module ID `1`
  unchanged, as required).
- License-dependent scope framing in 1.4 (heading, intro, both protocol
  cards reframed from universal "within/outside scope" to "may fall
  within scope—verify first" / "never authorized by this course").
- "Head spa technician is a role, not a license" clarification added to
  1.2, with a replaced clinical note ("The work behind the calm").
- Hair-growth and circulation claims removed: 1.1's card ("Massage &
  relaxation"), 1.5's can-support/cannot-do lists, and the 1.5 key point
  all rewritten to cosmetic/comfort language only.
- Strengthened referral guidance in 1.3 and a fourth "Shedding or
  thinning" row added to the safe-language script card; the out-of-scope
  card gained a fourth "Prescription" row.
- 1.6 (licensing), 1.7 (practitioner insight + Cadence note), and 1.8's
  first mistake card rewritten per spec; 1.8's other four cards, and all
  of 1.1/1.3's non-replaced content, left untouched.
- New ungraded "Where is the line?" interaction added between 1.4 and
  1.5 — four scenarios, native `<button>` choices, immediate textual
  feedback ("Correct."/"Not quite." prefix, not color-only), a
  completion message after all four are answered, and no `APP_STATE`
  access anywhere in `selectM1Line()`.
- Checkpoint questions realigned: `M1.questions.m1cp1`/`m1cp2` now use
  the exact same string shown in `.cp-q` (verified programmatically in
  testing, not just by inspection).
- `M1` restructured from one shared `system` function to `M1.systems`
  keyed by checkpoint ID, each carrying its own itemized pass rubric,
  immediate-correction rules, and revision-focus examples per
  `module-01.md`'s "Checkpoint specification". `submitM1CP` passes
  `M1.systems[id]` and a Module-1-specific `errorMessage` (via the
  optional 5th parameter added to `submitCheckpoint()` during the
  Welcome Module work) — no shared function signature changed, so no
  other module's checkpoint behavior is affected.
- Accessibility: `aria-label` added to both voice buttons and both
  submit buttons; `aria-live="polite"` added to both `.cp-res` regions;
  the practice interaction's choice buttons are native, keyboard-focusable
  `<button>` elements with `aria-pressed` and no color-only state.
- Completion card: new eyebrow ("Module 1 complete"), new title
  ("Professional boundaries demonstrated."), and a competency-naming
  body line, following the same `.lc-next-label`-reuse pattern used for
  the Welcome Module's completion card.

**Tests completed** (local static server, mocking `callAI` since no live
API credentials are reachable in this environment):
normal Module 1 entry; Review Mode entry with the rewritten checkpoints
(test submission correctly labeled "Review Mode test — not saved" and
did not touch the stored answer); an existing pre-rewrite "passed" state
for both `m1cp1` and `m1cp2` was seeded and confirmed to survive a reload
as "Accepted" with Module 2 still unlocked; both checkpoints' displayed
`.cp-q` text was verified programmatically equal to `M1.questions`; a
mocked strong `m1cp1` answer passed; a mocked partial `m1cp1` answer
(avoids diagnosis, no referral) returned "Needs revision" with the
approved focused-follow-up pattern; a mocked unsafe `m1cp1` answer
(names alopecia, promises regrowth) was correctly rejected with an
immediate-correction-style message; a mocked strong `m1cp2` answer
passed and completed the module, unlocking Module 2, with the exact
approved completion-card text; a mocked generic `m1cp2` answer returned
the approved vague-answer follow-up; the network-failure fallback
preserved the typed answer and showed the exact approved text; all four
"Where is the line?" scenarios were exercised with real `.click()`
calls — correct/incorrect selection, textual "Correct."/"Not quite."
feedback, changing an answer after selecting, and the completion message
appearing only after all four are answered; `localStorage['levo_app']`
key structure was diffed before/after the interaction and confirmed
unchanged; mobile viewport (375×812) showed no horizontal overflow; a
full-page text extraction confirmed every section renders in the correct
order with no stray or duplicate content; the Welcome Module and Module 2
were both re-opened and confirmed byte-for-byte unchanged; a duplicate-ID
scan showed the new interaction/checkpoint elements follow the exact same
pre-existing hidden-template-plus-live-copy pattern already present for
every module (no new duplication introduced); console stayed error-free
throughout; `git diff` was scanned for references to any other module's
wrapper ID, `MN` object, or title string and found none outside the
intentional "Module 2" forward-reference in Module 1's own completion
copy.

**Requires manual review (could not be fully verified in this
environment):**
- Enter/Space keyboard activation of the "Where is the line?" choice
  buttons — same tooling limitation already noted for the Welcome
  Module's practice interaction (native `<button>` semantics guarantee
  activation in a real browser; this sandbox's synthetic key-event
  delivery did not trigger it during testing).
- The live Claude model's actual behavior against the new per-checkpoint
  rubrics — grading flows were verified with mocked AI responses, not
  the real model. In particular, whether the model reliably applies the
  "do not fail for grammar/spelling/informal wording/non-native English"
  instruction, and whether it correctly identifies the single most
  important missing element rather than restating the whole prompt, can
  only be confirmed with live-model testing.
- Screen-reader verification (VoiceOver/NVDA) of the new `aria-live` and
  `aria-pressed` behavior on the checkpoints and the practice interaction.
- Touch-target sizing was not measured against a specific minimum (e.g.
  44×44px) — the practice-choice buttons reuse standard padding already
  used elsewhere in the app, not a value chosen or verified against a
  touch-target guideline.

Guided Completion Path UI, Listen Mode, persistent checkpoint threads,
and Module 12 were not built, per instruction. Module 2 was not extracted
or edited.
