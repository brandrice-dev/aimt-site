# AIMT Course Audit Master Instructions

**Project:** American Institute of Modern Trichology — Head Spa Certification Course  
**Repository:** `aimt-site`  
**Required working branch:** `course-audit-build`  
**Production branch:** `main`  
**Status:** Governing audit and implementation standard

---

## Purpose

This file governs the full course-audit workflow.

Use it to keep every module audit, implementation, QA pass, handoff, and future course-system task aligned.

This file is broader than any individual module specification.

---

## Non-negotiable branch rule

Work only on:

`course-audit-build`

Do not merge, deploy, or edit `main` during the audit build.

The live site may continue showing the current production version while the audited branch is developed.

Before any production merge:

1. all intended modules in the release must be implemented;
2. the branch preview must be reviewed;
3. desktop and phone QA must be complete;
4. the user must explicitly approve the release.

---

## Course structure

- Technical Module 0 = student-facing Welcome Module
- Modules 1–11 = instructional modules
- Module 12 = planned Final Exam

Do not implement Module 12 until:

- Modules 1–11 are audited;
- Modules 1–11 are implemented and approved;
- the completion and certificate flow is audited.

---

## Source hierarchy

For each module, use this authority order:

1. `docs/course-audit/modules/module-XX.md`  
   Approved audit specification and implementation authority.

2. `docs/course-audit/00-global-decisions.md`  
   Course-wide pedagogy, interaction, Cadence, resource, Guided Completion, and Listen Mode decisions.

3. Approved implementation patterns already present in completed modules  
   Reuse only when they satisfy the current module specification.

4. `docs/course-audit/modules/module-XX-assets.md`  
   Asset inventory and source identity.

5. `docs/course-audit/modules/module-XX-source.md`  
   Pre-audit extraction used to locate existing content and technical wiring. It is not final content authority.

Never implement from an empty audit skeleton or from a pre-audit source extraction.

---

## Module lifecycle

Every module follows this order:

1. Asset intake, when applicable
2. Source extraction
3. External audit
4. Approved audit specification added to the repository
5. Implementation
6. Static and mocked validation
7. Manual QA
8. Manual approval
9. Video-source creation
10. Next module begins

Do not begin the next module before the current module clears manual QA unless an explicit project decision says otherwise.

---

## Audit philosophy

Preserve correct curriculum.

Rewrite only when content is:

- inaccurate;
- unsafe;
- unclear;
- repetitive;
- inconsistent;
- misleading;
- low-value;
- poorly sequenced;
- inaccessible;
- technically broken.

Do not rewrite merely to make copy sound different.

The audit should increase:

- practitioner judgment;
- practical usefulness;
- observation skill;
- decision quality;
- service consistency;
- confidence grounded in competence;
- client communication;
- reduction of trial and error.

---

## Safety and scope

Safety and scope are guardrails, not the hero tone of the entire course.

Module 1 may foreground professional scope.

Later modules should lead with:

- mastery;
- discovery;
- applied expertise;
- service refinements;
- practitioner observations;
- decision rules;
- common mistakes prevented;
- details beginners miss.

Do not let every module become a disclaimer lesson.

---

## Learning-rhythm standard

The course should feel coherent without becoming repetitive.

Shared elements may include:

- visual system;
- accessibility;
- grading integrity;
- progress behavior;
- Cadence identity;
- completion logic.

Student-facing rhythm should vary.

Each module audit must identify:

- signature learning moment;
- interaction density;
- checkpoint placement;
- learning mode;
- independent reasoning;
- Cadence’s role;
- curiosity and payoff;
- how the module differs from adjacent modules.

Good interactions require:

- observation;
- recall;
- distinction;
- sequencing;
- decision;
- explanation;
- application;
- communication.

Reject:

- decorative clicks;
- XP;
- leaderboards;
- punitive streaks;
- artificial urgency;
- autoplay;
- confetti;
- progress for purchase;
- interaction added only to make the page feel busy.

---

## Insider-value standard

Every audit should identify:

- strongest practitioner knowledge;
- subtle details beginners miss;
- practical decision rules;
- service refinements;
- errors prevented;
- how the module reduces trial and error;
- how the knowledge accelerates competence.

Generic textbook material should be reduced or reframed when it does not support real practitioner decisions.

---

## Checkpoint standard

Required checkpoints must:

- assess approved module competency;
- use the exact same displayed and evaluated question;
- use checkpoint-specific rubrics;
- accept accurate reasoning without requiring exact phrasing;
- not fail for grammar, spelling, concise wording, non-native English, or natural spoken phrasing;
- provide one focused revision request when incomplete;
- correct unsafe or diagnostic claims immediately;
- preserve existing checkpoint IDs and passed state where possible;
- use accessible controls and live feedback;
- preserve Review Mode’s unsaved behavior.

Do not add required checkpoints merely to increase difficulty.

Ungraded interactions must not write progress or gate completion.

---

## Cadence standard

Cadence is AIMT’s curriculum-grounded guide.

Cadence must not:

- claim personal human practitioner experience;
- diagnose;
- prescribe;
- expand scope;
- invent course content;
- state unsupported certainty;
- treat illustrative images as clinical evidence;
- use an old course name.

Cadence may say the guidance was built from the instructor’s applied experience.

Cadence should help students:

- observe;
- distinguish;
- reason;
- communicate;
- identify missing context;
- choose a responsible next step.

Persistent per-module Cadence threads are deferred until the dedicated Cadence phase.

---

## Accessibility standard

Each module implementation should account for:

- keyboard operation;
- touch operation;
- visible focus;
- semantic controls;
- appropriate accessible names;
- meaningful alt text;
- text-based status;
- no color-only meaning;
- live feedback where appropriate;
- reduced motion;
- no mobile overflow;
- readable text and touch targets;
- equivalent access to instructional content.

Static checks do not replace manual screen-reader, physical-keyboard, or real-device QA.

---

## Semantic design standard

Equivalent states should use shared semantic styling across the course.

Use consistent:

- success / correct / accepted styling;
- error / incorrect / prohibited styling;
- warning / caution styling;
- neutral informational styling.

Meaning must never rely on color alone.

Semantic color normalization is not permission for a full styling redesign.

---

## Downloadable-resource policy

Do not force a downloadable into every module.

Recommend one only when it has repeated practical value, such as:

- service-room support;
- consultation use;
- protocol reference;
- repeated documentation;
- a decision tool;
- a quick reference that avoids reopening the full lesson.

Every module audit should include a `Downloadable resource opportunity` section that may state:

- none recommended; or
- title;
- practical value;
- format;
- lesson placement;
- future dashboard location.

The resource is not linked until the final approved file exists.

---

## Guided Completion Path planning

Implementation is deferred.

Every module audit should still record:

- estimated attentive learning time;
- estimated checkpoint time;
- hands-on practice time;
- competency demonstrated;
- suggested practice;
- earlier concepts to revisit;
- course-path position.

Future Guided Completion should use:

- suggested pace;
- target date;
- this-week focus;
- spaced review;
- gentle stall reminders;
- visible progress.

Do not use punitive deadlines.

---

## Listen Mode planning

Implementation is deferred.

Every module audit should record:

- narration suitability;
- approximate narration length;
- visual-review cues;
- screen-required content;
- video-only content;
- whether interaction or checkpoint blocks audio-only completion.

Listening must never prove competency by itself.

---

## Deferred system work

Do not pull these into a module implementation unless explicitly authorized:

- completion/certificate flow audit;
- Module 12 Final Exam;
- grading and certificate trust hardening;
- progress-save hardening;
- persistent Cadence threads;
- production Cadence retry/recovery;
- Guided Completion Path;
- Listen Mode;
- final styling;
- homepage showcase;
- Stripe branding;
- Supabase email styling;
- communications audit;
- monolith refactor.

---

## Manual approval rule

A module is not approved merely because:

- Claude completed implementation;
- static checks passed;
- mocked browser assertions passed;
- the code committed successfully.

Manual QA must review:

- real visual output;
- desktop;
- phone;
- interaction behavior;
- checkpoint behavior;
- Cadence behavior;
- completion;
- next-module gating;
- semantic consistency;
- regression risk.

Only then may the module status become:

`Implemented — manual QA approved`

---

## Documentation requirements

After every approved task, update:

- `docs/course-audit/modules/README.md`
- `docs/course-audit/implementation-log.md`
- `docs/course-audit/00-aimt-current-course-status.md`

The current-status file should always identify:

- active branch;
- latest approved module;
- current task;
- current gate;
- exact next task;
- what must not begin;
- current side tracks;
- preview/deployment status.

---

## Master project order

1. Audit, implement, and manually approve Modules 1–11 one by one
2. Audit completion and certificate flow
3. Design and implement Module 12 Final Exam
4. Harden grading, certificate, and progress integrity
5. Add persistent per-module Cadence threads
6. Add production Cadence failure, retry, and recovery
7. Add Guided Completion Path
8. Add Listen Mode
9. Complete final styling and responsive pass
10. Create homepage course showcase
11. Complete Stripe, Supabase email, and student-communications work
12. Refactor the monolith only after the course is stable

---

## Stop rules

Stop and report when:

- the approved audit specification is missing;
- the active branch is wrong;
- required source files conflict;
- implementation would require touching unrelated modules or systems;
- a task would begin the next module early;
- a task would merge or deploy without approval;
- the requested change belongs to a later project phase.

Do not guess past a project gate.
