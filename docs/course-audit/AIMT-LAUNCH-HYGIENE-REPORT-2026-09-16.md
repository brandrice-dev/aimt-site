# AIMT Launch Hygiene Report — 2026-09-16

Session scope: documentation-only hygiene pass on `course-audit-build`.
Write scope this session: `CLAUDE.md`,
`docs/course-audit/listen-mode/00-listen-mode-editorial-standard.md`, and
this report. No code, no live pricing, no `headspa-mastery.html`, no Module 7
Listen Mode files, no Modules 1/4/5/6 audio/scripts, and no
`docs/AIMT-MASTER-LAUNCH-CHECKLIST.md` were touched.

## Task 1 — stale course price in CLAUDE.md

**Confirmed live first:** grepped `headspa-mastery.html` — `$597` appears
repeatedly in the hero/pricing/sales copy (nav CTA, price panels, final CTA,
enroll button). No `$497` anywhere in that file. `$597` is the real, current
price.

**Found:** `CLAUDE.md` line 5 read:
> First course: **HeadSpa Mastery** ($497), a head spa practitioner
> certification...

**Changed to:**
> First course: **HeadSpa Mastery** ($597), a head spa practitioner
> certification...

That was the only `$`-price mention in `CLAUDE.md`. Documentation-only edit;
no pricing code, Stripe price ID, or `headspa-mastery.html` touched.

## Task 2 — master checklist verification (read-only; not edited)

Read `docs/AIMT-MASTER-LAUNCH-CHECKLIST.md` in full. It is **stale** on
exactly the two points asked about:

- Modules 1/4/5 Listen Mode: correctly recorded as `DONE`, owner-approved.
- **Module 6 Listen Mode is not recorded as approved/done** — it's
  `READY FOR OWNER REVIEW` ("Awaiting owner listen/review before any CapCut
  cut or manifest wiring"). So "Modules 1/4/5/6 as approved/done" is only
  3-for-4 accurate as of this file's own content.
- **Module 7 is not recorded as the current owner-gate item once
  generated** — the checklist states "Module 7 explicitly not started per
  standing instruction; work resumes only after Module 6 is reviewed and
  approved." That is factually stale against the current repo state: as of
  this session, `docs/course-audit/listen-mode/module-07-listen-script.md`
  and `module-07-fidelity-coverage-audit.md` both exist with full content
  (dated today), the old v1 script is archived as
  `archive-loose-v1/module-07-listen-script-v1-REJECTED.md`, and a
  `tts-final/module-07/` batch directory exists — i.e. Module 7's rebuild
  has clearly started (and per the session's own working boundaries, another
  agent is actively finishing its audio generation right now).

Reported here per instruction, not corrected — `AIMT-MASTER-LAUNCH-CHECKLIST.md`
was left untouched for the coordinator's later reconciliation pass.

## Task 3 — "answer above" prohibition, made permanent

Read `docs/course-audit/listen-mode/00-listen-mode-editorial-standard.md` in
full first (this is the correct file — its own text already states "This
document governs how future Listen Mode scripts get written"). Added a new
locked **Section F** codifying: checkpoint-closing narration must never use
"answer above" or an equivalent implying the response field is above the
prompt; the only approved directional wording is "Take your time, and
answer below." (or an equivalent that says "below"); a cue may also be
omitted entirely.

**Verified, not assumed:** read `scripts/aimt-listen-tts-preflight.mjs` in
full. It already contains a `DIRECTIONAL_ABOVE` regex set (lines 55–60)
matching "answer(s) above," "your answer is above," "respond(s) above," and
"response above," wired into `checkFile()` (lines 91–93), which fails the
preflight (exit code 1) on any match before a batch is sent to ElevenLabs.
The script's own header comment already documents this was added after the
Module 7 v1 finding. Section F cites this mechanism as the enforcement path
for Modules 8–12.

**Also added, Section H (informational only, no rule, no fix attempted):**
noted that this session's preflight sweep found the same "answer above"
defect already present in **15 already-shipped batch files across 9
modules (00, 02, 03, 05, 06, 08, 09, 10, 11)** — including Modules 5 and 6,
whose audio is already generated/approved — citing
`module-07-fidelity-coverage-audit.md` drift row #12 as the source. Fixing
any already-shipped audio/scripts is explicitly noted as a separate,
not-yet-decided owner action; none of those files were touched.

## Task 4 — mandatory end-of-module (final-third) fidelity re-check

Added a new locked **Section G** to the same document: every future Listen
Mode module rebuild requires a dedicated second fidelity pass over the
module's final third (headline/card/list thinning, paraphrase creep, exact
completion-language match, exact checkpoint placement) before any audio
generation, documented in that module's own coverage-audit file as an
explicit "END-OF-MODULE FIDELITY CHECK" section ending in a stated
PASS/FAIL result.

Cited the real origin: `module-07-fidelity-coverage-audit.md`'s own "Why
this rebuild happened" section states the owner caught, on review, a
substantive on-screen headline silently skipped in the Module 6 rebuild even
though its body content was narrated — and that document's own
END-OF-MODULE FIDELITY CHECK section explicitly frames that Module 6
incident as a "last-item-in-a-sequence silently dropped" pattern near the
end of the module, not something the first coverage pass caught on its own.

**Verified, not assumed:** confirmed `module-07-fidelity-coverage-audit.md`
already contains a "## END-OF-MODULE FIDELITY CHECK" section (scoped to
Section 7.4 through module completion, chunks M7-05–M7-09) ending in
"**Result: PASS** (after the two fixes above were applied ... and the batch
files were regenerated from the corrected source)" — i.e. Module 7 was
genuinely the first module to apply this check, not just the first to have
it claimed in the new rule text.

## Files changed this session

- `CLAUDE.md` — one-line price correction, `$497` → `$597`.
- `docs/course-audit/listen-mode/00-listen-mode-editorial-standard.md` —
  added an addendum note plus new Sections F (directional-language rule), G
  (end-of-module fidelity check rule), and H (informational note on the 15
  already-shipped instances). No existing section content was altered or
  removed.
- `docs/course-audit/AIMT-LAUNCH-HYGIENE-REPORT-2026-09-16.md` — this file.

Nothing was committed, pushed, merged, or deployed.
