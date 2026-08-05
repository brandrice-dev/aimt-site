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
| Guided completion structure | Recorded in `module-03-source.md` §11 (extraction only — not yet an approved spec) |
| Listen Mode notes | Recorded in `module-03-source.md` §12 (extraction only — not yet an approved spec) |
| **Status** | **Awaiting external audit** |

Extracted without production changes. Module 3 is structurally the
outlier among the modules extracted so far — no wrapper ID, bare
checkpoint IDs, a video-intro placeholder no other module has, and a
hand-authored inline SVG scalp/hair cross-section diagram (not an image
file) with 14 labeled callouts. It is also the first extracted module with
**zero** ungraded practice interactions. A proposed raster replacement for
the cross-section diagram was added to the repo at
`assets/images/course/module-03/aimt-scalp-cross-section.png` but is not
yet referenced by any production file and has not been verified for
anatomical or label accuracy — see `module-03-source.md` §2 and the
2026-08-04 Step 15 implementation-log entry. See `module-03-source.md` §13
for the full list of confirmed findings (displayed/evaluated checkpoint
question mismatches on both checkpoints, dead code, a hardcoded-vs-dynamic
quick-prompts discrepancy, vestigial markup, and more), none of which have
been fixed.

Modules 4–11 have not been extracted yet. Source files for those modules
will be added in later audit passes. Module 12 (Final Exam) has not been
audited — its technical relationship to the existing Module 11 and
certificate flow is still to be determined.
