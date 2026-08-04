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
| **Status** | **Approved — awaiting implementation** |

Modules 1–11 have not been extracted yet. Source files for those modules
will be added in later audit passes. Module 12 (Final Exam) has not been
audited — its technical relationship to the existing Module 11 and
certificate flow is still to be determined.
