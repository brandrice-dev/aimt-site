# AIMT Module Workflow Master Prompt

Use this reusable structure for every course module.

Replace bracketed values and add module-specific requirements only where needed.

---

## Claude Code task

Audit and implement AIMT Module `[MODULE NUMBER]`.

### Repository

`aimt-site`

### Required branch

`course-audit-build`

Do not work on `main`.

### Current module status

[STATE THE CURRENT STATUS ACCURATELY]

### Required source files

Read completely:

- `docs/course-audit/00-aimt-course-audit-master-instructions.md`
- `docs/course-audit/00-global-decisions.md`
- `docs/course-audit/00-aimt-current-course-status.md`
- `docs/course-audit/modules/README.md`
- `docs/course-audit/implementation-log.md`
- `[MODULE SOURCE PATHS]`

### Stop conditions

Stop without implementing when:

- the branch is not `course-audit-build`;
- the approved audit specification is missing;
- the audit file is an empty skeleton;
- the audit status is not approved;
- source files conflict materially;
- implementation would require beginning the next module;
- the task would touch `main`;
- the task would alter unrelated global systems.

Do not implement from `module-XX-source.md`.

---

# Phase A — Source extraction

Use only when the module has not yet been extracted.

Create:

- `docs/course-audit/modules/module-XX-source.md`
- `docs/course-audit/modules/module-XX.md` as an empty audit skeleton
- asset inventory when applicable

Capture:

- module identity;
- complete student-facing copy;
- visuals;
- interactions;
- checkpoints;
- Cadence;
- completion;
- accessibility;
- mobile concerns;
- learning rhythm;
- insider value;
- Guided Completion fields;
- Listen Mode fields;
- downloadable-resource opportunity;
- confirmed concerns;
- source map.

Update status to:

`Awaiting external audit`

Commit:

`Add Module XX audit source`

Stop.

---

# Phase B — External audit

This phase is completed outside Claude Code.

The approved `module-XX.md` must contain:

- Approved outcomes
- Keep unchanged
- Required corrections
- Final replacement copy
- Checkpoint specification
- Approved interactions
- Cadence behavior
- Acceptance criteria
- Distinct learning rhythm
- Insider value and acceleration payoff
- Guided completion structure
- Listen Mode notes
- Downloadable resource opportunity
- Implementation notes

Do not implement until this approved file replaces the empty skeleton.

---

# Phase C — Implementation

Use the approved `module-XX.md` as the primary authority.

Preserve:

- module ID;
- checkpoint IDs;
- stored passed state;
- progress behavior;
- Review Mode;
- adjacent module gating.

Implement:

- approved copy;
- approved interactions;
- checkpoint alignment;
- checkpoint-specific rubrics;
- Cadence corrections;
- accessibility;
- responsive behavior;
- assets;
- completion-card competencies.

Do not:

- change unrelated modules;
- add unapproved required checkpoints;
- write progress from ungraded practice;
- begin the next module;
- implement deferred project systems;
- refactor the monolith.

Update status to:

`Implemented — awaiting manual QA`

Commit:

`Implement Module XX approved audit`

Stop.

---

# Phase D — Focused polish

Use only when manual review identifies a narrow issue.

The prompt must specify:

- exact issue;
- exact allowed files;
- exact prohibited changes;
- validation;
- commit name.

Do not use a focused polish pass as permission for a redesign.

---

# Phase E — Manual QA

Use:

`docs/course-audit/00-aimt-manual-qa-master-checklist.md`

Add module-specific checks from the approved audit specification.

Manual QA must review the branch preview on desktop and phone.

When approved:

- update README;
- update implementation log;
- update current status;
- mark:
  `Implemented — manual QA approved`

Do not begin the next module before approval.

---

# Phase F — Video-source creation

After module approval, create:

`docs/course-video-sources/module-XX-video-source.md`

Use the approved audit specification as authority.

Include:

- status;
- module identity;
- what the module is really about;
- approved outcomes;
- practitioner payoff;
- beginner misconception;
- insider knowledge;
- learning rhythm;
- adjacent-module relationship;
- visual opportunities;
- text-callout opportunities;
- prohibited claims;
- presenter emphasis;
- video boundaries;
- production flags;
- suggested duration;
- source references.

Do not copy implementation details unless they affect video production.

---

# Standard final report

Report:

1. preflight;
2. files changed;
3. work completed;
4. interactions;
5. checkpoints;
6. Cadence;
7. accessibility;
8. assets;
9. validation;
10. deferred QA;
11. documentation status;
12. commit hash;
13. push result;
14. active branch;
15. working-tree status.

Stop after the report.
