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

## Scope reminders (from `CLAUDE.md`, restated for this audit)

- No entitlement/auth/payment/Supabase/progress-locking/certificate-logic
  changes without being explicitly asked.
- `headspa-mastery.html` gets surgical, minimal edits only when it is
  eventually touched — never reformatted or restructured wholesale.
- This audit phase (Step 2) is documentation and extraction only. No
  production files are modified.
