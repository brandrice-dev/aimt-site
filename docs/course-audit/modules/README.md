# Module Audit Index

Tracks per-module audit progress. Each module gets a `module-XX-source.md`
(verbatim extraction) and a `module-XX.md` (approved specification, filled
in only after external audit). See [`../00-global-decisions.md`](../00-global-decisions.md)
for the decisions every module spec must be checked against.

## Approved student-facing course sequence

Per [`../00-global-decisions.md`](../00-global-decisions.md#course-sequence--final-exam-module-12):

- **Welcome Module** (technical module ID `0`)
- **Modules 1–11** — instructional curriculum
- **Module 12 — Final Exam** — demonstrates course-wide competency before
  certification is issued

Technical module IDs, wrapper IDs, and state keys are not renumbered by this
sequence — only student-facing labels change. Module 12's technical
implementation is undetermined until Module 11 and the certificate flow are
audited.

## Required fields for every future module audit

Per [`../00-global-decisions.md`](../00-global-decisions.md#guided-completion-path),
every `module-XX.md` from this point forward must document a "Guided
completion structure" section containing:

- Estimated learning time
- Estimated hands-on or application time
- Competency demonstrated
- Suggested practice or application task
- Earlier concepts that should be revisited
- Suggested position in the Guided Completion Path

Pacing recorded in these fields must lead toward completion of the Module 12
Final Exam, not merely completion of the instructional modules.

Every `module-XX.md` from this point forward must also document a "Listen
Mode notes" section (introduced starting with the Module 1 audit)
containing: whether narration is appropriate, which sections need
visual-review cues, which content should remain video-only, and an
approximate narration length. No Listen Mode UI or logic is authorized by
documenting these fields — see each module's source file for the
first-pass content assessment.

## Module 0 — Welcome Module (technical module ID `0`)

| Field | Value |
|---|---|
| Student-facing name | **Welcome Module** (never displayed as "Module 0") |
| Source file | [`module-00-source.md`](module-00-source.md) |
| Approved specification file | [`module-00.md`](module-00.md) |
| Wrapper ID | `module0Wrap` |
| Checkpoint IDs | `m0cp1` |
| Current completion requirement | Single checkpoint `m0cp1` must be graded `passed` (no read-percentage minimum) |
| Guided completion structure | Recorded in `module-00.md` — position: first, precedes Module 1 and the Module 12 Final Exam |
| **Status** | **Implemented — awaiting manual QA** |

## Module 1 — Role of the Head Spa Technician

| Field | Value |
|---|---|
| Student-facing name | **Module 1** (unchanged — Welcome Module naming applies only to technical module `0`) |
| Source file | [`module-01-source.md`](module-01-source.md) |
| Approved specification file | [`module-01.md`](module-01.md) |
| Wrapper ID | `module1Wrap` |
| Checkpoint IDs | `m1cp1`, `m1cp2` |
| Current completion requirement | Both checkpoints must be graded `passed` (no read-percentage minimum) |
| Guided completion structure | Recorded in `module-01.md` — position: foundation block, immediately after the Welcome Module |
| Listen Mode notes | Recorded in `module-01.md` — narration approved as a strong candidate, ~8–10 minutes |
| **Status** | **Implemented — awaiting manual QA** |

## Module 2 — Welcoming Your Client

| Field | Value |
|---|---|
| Student-facing name | **Module 2** (unchanged — Welcome Module naming applies only to technical module `0`) |
| Source file | [`module-02-source.md`](module-02-source.md) |
| Approved specification file | [`module-02.md`](module-02.md) |
| Wrapper ID | `module2Wrap` |
| Checkpoint IDs | `m2cp1` |
| Current completion requirement | Single checkpoint `m2cp1` must be graded `passed` (no read-percentage minimum) |
| Guided completion structure | Recorded in `module-02.md` — position: client-experience foundation, immediately after Module 1 |
| Listen Mode notes | Recorded in `module-02.md` — narration approved as a partial candidate (after timeline content is made available independent of accordion state), ~9–11 minutes |
| **Status** | **Implemented — manual QA approved** |

Implemented per `module-02.md`. Module 2 has three ungraded interactive
components beyond its required checkpoint (accessible arrival accordion
labeled 2.1–2.5, a retryable "what breaks the moment" judgment check, and
an AI-evaluated script builder) plus a static "Same service. Different
beginning." comparison that replaced the removed feeling slider — see
`module-02.md` for the approved behavior and `module-02-source.md` §5 and
§11 for the prior-state accessibility/interaction concerns that were
corrected.

## Module 3 — Hair & Scalp Anatomy

| Field | Value |
|---|---|
| Student-facing name | **Module 3** (unchanged — Welcome Module naming applies only to technical module `0`) |
| Source file | [`module-03-source.md`](module-03-source.md) |
| Approved specification file | [`module-03.md`](module-03.md) |
| Wrapper ID | **None** — Module 3 is the default `.lesson-wrap` content captured into `module3HTML` at page load, not a hidden `moduleNWrap` template like every other module (see the source extraction, §1) |
| Checkpoint IDs | `cp1`, `cp2` — bare IDs, not the `mNcpX` pattern every other module uses |
| Current completion requirement | Both checkpoints must be graded `passed` (no read-percentage minimum) |
| Guided completion structure | Recorded in `module-03.md` — position: fourth, technical foundation immediately before Module 4 assessment and microscopy |
| Listen Mode notes | Recorded in `module-03.md` — narration approved for most prose, ~14–17 minutes; the five-layer map and supplied cross-section require structured visual-review cues |
| **Status** | **Approved — awaiting implementation** |

Approved per `module-03.md`. Notable approved corrections: the approved
headline "The scalp is not a backdrop. It is the environment everything
depends on."; a corrected five-layer scalp map (skin, dense connective
tissue, galea aponeurotica, loose areolar tissue, pericranium) replacing
the current inline SVG; the supplied
`assets/images/course/module-03/aimt-scalp-cross-section.png` used in the
pilosebaceous-unit section (with a web-optimized derivative, approved alt
text/caption, and a full-size viewing control) rather than as a complete
five-layer diagram; a new ungraded "Anatomy to Action" visual explorer and
a predict-then-reveal hair-cycle timing interaction; `cp1` moved to the
module's midpoint with `cp2` remaining at the end, both with aligned
displayed/evaluated questions and separate checkpoint-specific evaluator
rubrics; removal of the nonfunctional video placeholder, the dead
`cpKey_m3` function, the duplicate/conflicting quick-prompt sets, and the
malformed hidden completion markup; and the same course-name/Cadence-
identity/accessibility corrections already applied to the Welcome Module
and Modules 1–2. See `module-03-source.md` §13 for the full list of
pre-existing findings this specification resolves.

Modules 4–11 have not been extracted yet. Source files for those modules
will be added in later audit passes. Module 12 (Final Exam) has not been
audited — its technical relationship to the existing Module 11 and
certificate flow is still to be determined.
