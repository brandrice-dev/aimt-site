# Module 2 — Curriculum Rebuild (2026-08-31)

**Course:** AIMT Head Spa Certification Course
**Module:** 2 — Welcoming Your Client
**Status:** Implemented and tested. Supersedes conflicting portions of
`module-02.md` (the prior approved audit specification).
**Trigger:** owner-directed task, "AIMT — MODULE 2 CURRICULUM REBUILD +
MODULE 0 LISTEN MODE ORIENTATION," 2026-08-31.

## Why this rebuild happened

Module 2's original specification (`module-02.md`) taught an arrival
framework built around **explicit permission before every touch and
repeated in-the-moment consent checks** — for example, requiring the
practitioner to ask "would it be okay if I rest a hand on your shoulder"
at the point of first touch, and treating fragrance/scent selection as
something discovered live with the client rather than established at
intake.

Module 8 ("The Head Spa Service") later formalized the course's actual
governing service doctrine — a relaxation-first service where:
- intake and pre-service conversation establish the plan (fragrance,
  omissions, touch expectations, format) **before** treatment begins;
- most hands-on treatment stays quiet by default, communicated only
  proactively for genuinely dynamic moments ("Communication cue" / "Keep
  the flow quiet" / "If they ask");
- standard, already-established protocol steps are **not** repeatedly
  re-offered as live in-the-moment choices.

Module 2's original "ask permission before every step" framing directly
contradicted this. The owner's instruction was explicit: **"Module 2 must
now become the foundation for that doctrine"** — this rebuild's governing
principle is *intake determines the plan, preparation removes
uncertainty, the service executes the plan.*

## What changed

- **Full section rebuild.** The old 5-step arrival-sequence accordion
  (`.timeline-wrap`/`openStep`), the "What breaks the moment?" quiz
  (`breakAnswer`/`BQ_FEEDBACK`), the scent-script-builder exercise
  (`evaluateScript`'s UI entry point), and the "same service, different
  beginning" / "what goes wrong" condition-card sections are all retired
  from Module 2's live markup. Replaced with Sections 2.1–2.7: Intake
  Before Arrival, Remove Preventable Uncertainty, Set the Plan Before the
  Quiet (+ a Before-Service/During-Service comparison), First Touch, Protect
  the Quiet, When Something Changes (+ a new ungraded 12-item
  "Before service, or during service?" classifier), and Consistency — plus
  a new Module Recap block.
- **New downloadable**, wired into the module body and the Resource
  Library registry (`assets/js/aimt-course-resources.js`): "Head Spa
  Intake + Service Plan," a two-part fillable PDF at
  `assets/images/course/module-02/module-02-head-spa-intake-service-plan-fillable.pdf`.
  Status: **RESOURCE NEEDED — IMPLEMENTED.**
- **Checkpoint `m2cp1` rewritten** (question + rubric) to evaluate the new
  intake-to-treatment competency instead of the old late-arrival/consent
  scenario. The checkpoint id and any already-passed state for real
  students are unchanged — only the evaluated content changed, exactly as
  a normal curriculum-content edit to an existing checkpoint would.
- **Cadence Module 2 guide config** (`MODULE_GUIDE_SYSTEMS[2]` in
  `headspa-mastery.html`) rewritten to reinforce the new doctrine and
  explicitly instructed not to teach repeated permission-asking for
  standard, already-established steps as best practice, while still
  distinguishing pre-service expectation-setting from the client's
  ongoing ability to communicate or change their mind.
- **Regression fixtures updated**, not silently left stale:
  `scripts/cadence-model-regression/grading-dataset.mjs`'s three m2cp1
  cases rewritten against the new rubric;
  `tests/cadence-m2cp1-fixture-calibration.test.mjs` rewritten to
  calibrate against it;
  `tests/cadence-checkpoint-authority.test.mjs`'s synthetic m2cp1 element
  labels relabeled for accuracy (its actual assertions are rubric-content-
  agnostic, so no behavior changed); every other regression test that
  pins the full M0–M11 checkpoint-rubric fingerprint as proof of "no
  collateral change" had that pinned fingerprint advanced from
  `rubric-f6f22d2b` to `rubric-922199df` — the new, correct baseline now
  that m2cp1 has a real, intentional, documented change.
- **Listen Mode**: the prior v1 script/audio is obsolete and not reused.
  A new v2 script (`docs/course-audit/listen-mode/module-02-listen-script.md`)
  and new ElevenLabs audio were produced against the rebuilt curriculum,
  `qaStatus: 'GENERATED'` pending the owner's CapCut pass and
  listen-through — never `APPROVED` by this task.

## What this document does NOT authorize

Same boundary as `module-02.md`'s own header: no changes to
authentication, entitlements, payments, database policies, certificate
issuance, other modules' curriculum, the general Listen Mode
architecture, or Module 12's certification state machine.

## Relationship to `module-02.md`

`module-02.md` remains as a historical record of the original approved
specification and its reasoning at the time. Its **"Approved outcomes"**
and **"Keep unchanged"** sections describing repeated-consent/permission-
before-touch as the taught standard, the old arrival-sequence structure,
the "What breaks the moment?" practice concept, and the student-written
aromatherapy-introduction exercise are **superseded** by this document
and the live implementation. Everything else in `module-02.md` not in
tension with the new doctrine (privacy, appropriate preparation, calm
arrival, hospitality, adaptability, client choice, responsiveness, scope,
safe alternatives) remains intact in spirit in the rebuilt curriculum.
