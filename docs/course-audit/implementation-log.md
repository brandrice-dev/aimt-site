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
