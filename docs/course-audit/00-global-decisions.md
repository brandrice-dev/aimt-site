# Course Audit — Global Decisions

Status: **Approved decisions, recorded for the course audit/rebuild.**
This document is the governing reference for every module-level audit file
in `docs/course-audit/modules/`. It does not authorize any implementation —
see each `module-XX.md` for module-specific approved specs before anything
is built.

Related standing rules: [`docs/AIMT-AUDIT-RULES.md`](../AIMT-AUDIT-RULES.md)
already establishes a client-facing rename rule for the marketing site
(`index.html` etc.) targeting **"Head Spa Certification Course"** as the
canonical spelling. The decision below is consistent with that rule and
extends it to the course app itself (`headspa-mastery.html`) — see the
scope note.

---

## Course name

The student-facing course name is:

**Head Spa Certification Course**

The old names "HeadSpa Mastery" and "Head Spa Mastery" will eventually be
removed from student-facing copy inside the course app
(`headspa-mastery.html`) — hero text, module titles, Cadence system prompts,
completion/certificate copy, brand wordmark, etc.

**Do not rename internal technical identifiers yet**, including:
- `headspa-mastery.html` (the filename itself)
- URLs or route paths
- Course slugs (`headspa-mastery` stays the slug everywhere per `CLAUDE.md`)
- Entitlement identifiers
- Database values
- API values
- JavaScript object keys
- localStorage keys (e.g. `levo_app`)
- Progress identifiers

This is a display-copy-only rename at this stage. Nothing that touches
routing, persistence, entitlements, or the data model changes.

---

## Curriculum preservation

Keep existing curriculum unchanged when it is accurate, clear, safe,
properly sequenced, and within professional scope.

Do not rewrite curriculum merely to make it sound different. Changes to
curriculum content must be justified by one of: inaccuracy, lack of clarity,
a safety/scope problem, sequencing that doesn't work, or content outside
professional scope. "It could sound better" is not sufficient justification
on its own.

---

## Interaction standard

An interaction must require the student to do at least one of the
following:

- Observe
- Recall
- Distinguish
- Sequence
- Decide
- Explain
- Apply
- Communicate

Do not add interaction solely for movement, novelty, or visual interest.

### Approved interaction patterns

- Predict and explain
- Observe and decide
- Proceed, modify, pause, or refer
- Put a protocol in order
- Spot the unsafe or ineffective choice
- Build a client-facing response
- Short spaced-retrieval recall
- Cadence competency conversation

Multiple-choice questions may be used for ungraded practice but should not
be the primary proof of certification competency.

### Rejected mechanics

Do not implement:

- Phone-screen pressure calibration
- XP or points
- Leaderboards
- Public rankings
- Punitive streaks
- Manufactured urgency
- Infinite scroll
- Autoplay learning flows
- Confetti or game-like rewards
- Certification progress awarded merely for purchasing

---

## Cadence direction

Required checkpoints should eventually feel like persistent text
conversations.

Cadence should:

- Evaluate demonstrated understanding rather than keywords
- Ask one focused follow-up when an answer is nearly complete
- Explain concepts differently when the student is struggling
- Correct safety-critical misinformation immediately
- Pass the student as soon as the required competency is demonstrated
- Avoid failing answers for grammar, spelling, informal wording, or missing
  technical vocabulary when the concept is correct

The permanent cross-device conversation architecture is a later engineering
phase and is **not** part of this task.

---

## Welcome Module naming

The technical module with ID `0` must be presented to students as:

**Welcome Module**

Student-facing copy must not display "Module 0." This applies to titles,
eyebrows, dashboard subtitles, home-screen labels, completion copy, Cadence
references, and any other student-visible surface tied to module `0`.

**Preserve all existing technical identifiers**, including:

- Module ID `0`
- `module0Wrap`
- `M0`
- `m0cp1`
- Progress keys
- Function names
- State identifiers

The next instructional module remains student-facing **Module 1**. Do not
renumber technical modules — this is a display-label change only, applied
the same way as the course-name rename above (see "Course name").

---

## Course sequence & Final exam (Module 12)

The approved student-facing course sequence is:

- **Welcome Module** (technical module `0`)
- **Modules 1–11** — instructional curriculum
- **Module 12 — Final Exam**

Module 12 will require the student to demonstrate course-wide competency
before certification is issued.

This is a structural decision only. It does **not** authorize designing the
exam, changing certificate logic, adding a new production module, or
renumbering technical module IDs. The exact technical implementation
(whether Module 12 is a new technical module, how it maps to existing
Module 11 and the certificate flow, etc.) will be determined after the
existing Module 11 and certificate flow are audited.

Guided Completion Path pacing (below) must lead toward completion of the
Module 12 Final Exam, not merely completion of the instructional modules.

---

## Guided Completion Path

The course remains flexible and self-paced. In addition, it will include an
**optional Guided Completion Path** to improve follow-through and practical
application, leading toward completion of the Module 12 Final Exam (see
"Course sequence & Final exam" above) — not merely completion of the
instructional modules.

The final recommended course duration is **not yet decided**. That decision
is deferred until all modules are audited and their actual workload
(learning time + hands-on/application time) is known.

### Required fields for every future module audit

From this point forward, every module audit (`module-XX.md`) must document:

- Estimated learning time
- Estimated hands-on or application time
- Competency demonstrated
- Suggested practice or application task
- Earlier concepts that should be revisited
- Suggested position in the Guided Completion Path

### The eventual Guided Completion Path may include

- Suggested weekly pacing
- A student-selected target completion date
- A clear "this week" view
- Spaced review prompts
- Gentle stalled-progress reminders
- Visible progress toward certification

### It must not include

- Punitive deadlines
- Lost progress
- Anxiety-based streaks
- XP or arbitrary points
- Manufactured urgency
- Certification credit for merely opening content

---

## Varied learning rhythm

Do not force every module into the same structural template. The Welcome
Module, Module 1, and Module 2 share a similar shape because their subject
matter happened to call for it — that is not a template to replicate by
default.

**Shared standards remain consistent across every module:**

- Accessibility
- Grading integrity
- Progress behavior
- Cadence identity
- Visual system
- Completion integrity

**The student experience should vary according to the content.** Some
modules may need several interactions. Others may need one strong
interaction, or an uninterrupted instructional sequence with none at all.
Do not add an interaction merely to make a module appear interactive — this
sharpens the existing "Interaction standard" above; density is a per-module
judgment call, not a fixed quota.

### Required for every future module audit

In addition to the existing required fields, every module audit must
explicitly determine:

- The module's signature learning moment
- Appropriate interaction density: light, moderate, or high
- Whether checkpoints belong midway, at the end, or in multiple stages
- Whether the material is best learned through visual exploration,
  prediction, sequencing, comparison, scenario judgment, recall,
  explanation, or applied practice
- Where Cadence adds value
- Where the student should reason independently
- How the module creates curiosity, discovery, and payoff

---

## Insider knowledge and accelerated mastery

Professional scope and safety are essential guardrails, but they must not
become the dominant tone of the entire course. Module 1 appropriately
foregrounds scope because scope is its subject — that emphasis does not
generalize to every later module.

In later modules, the primary student value should be:

- Accumulated practitioner knowledge
- Insider observations
- Practical decision rules
- Techniques and refinements
- Details inexperienced practitioners commonly miss
- Mistakes the student can avoid
- Faster confidence and competence
- Reduced trial and error
- Knowledge that would otherwise take years to collect

Scope reminders should appear where a specific technique, product,
condition, claim, or decision requires them. They should not repeatedly
dominate unrelated instructional material.

### Required for every future module audit

Every module audit must identify:

- The insider knowledge being transferred
- The practical shortcut or decision rule
- The subtle detail a newer practitioner would likely miss
- The mistake this knowledge prevents
- How it improves the service, confidence, efficiency, client experience,
  or business result

---

## Module-specific Cadence threads

Persistent Cadence conversations remain deferred (see "Cadence direction"
above). When that architecture is eventually implemented:

- Each module must have its own saved text-message-style thread
- Returning to a module must reopen that module's conversation
- A new module begins a separate thread
- Students should not scroll through one continuous course-wide
  conversation
- Storage should be structured by student, course, and module

Do not implement this now. This is a structural decision for the future
engineering phase only.

---

## Scope reminders (from `CLAUDE.md`, restated for this audit)

- No entitlement/auth/payment/Supabase/progress-locking/certificate-logic
  changes without being explicitly asked.
- `headspa-mastery.html` gets surgical, minimal edits only when it is
  eventually touched — never reformatted or restructured wholesale.
- This audit phase (Step 2) is documentation and extraction only. No
  production files are modified.
