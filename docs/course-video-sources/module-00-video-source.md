# Welcome Module — Video Source

## Status

**Approved for video scripting.**

- Audit: **Approved** — `docs/course-audit/modules/module-00.md` (status:
  "Approved for controlled implementation").
- Production implementation: **Implemented** (`implementation-log.md`, Step
  7, 2026-08-04) — `headspa-mastery.html` only.
- Manual QA: **Not yet marked complete.** No manual-QA-approval step exists
  in `implementation-log.md` for the Welcome Module (compare Module 2's
  Step 14 and Module 3's Step 20 — no equivalent entry exists for Module 0).
- Authority: `docs/course-audit/modules/module-00.md`.
- Unresolved dependencies: real-browser keyboard-activation testing of the
  practice interaction, live-model grading behavior for `m0cp1`,
  screen-reader (VoiceOver/NVDA) verification, and OS-level
  `prefers-reduced-motion` testing are all still outstanding per Step 7's
  "Requires manual review" list. Treat final course-interface screen
  recordings and checkpoint footage as pending until a manual-QA step is
  recorded.

## Module identity

- Module: technical module `0`
- Approved student-facing title: **Welcome Module** (never "Module 0")
- Hero line (unchanged): "Clients can feel the difference between a service
  that is being performed and one that is being led."
- Position: first in the course, before Module 1 and the eventual Module 12
  Final Exam.

## What the module is really about

The Welcome Module calibrates a new student before any technique is taught.
Its core idea is a single distinction — performing a service sequence versus
leading the complete client experience — that the rest of the course keeps
returning to. Alongside that, it establishes course mechanics (how to use
Cadence, how checkpoints work) and, critically, what the AIMT certificate
actually represents: course completion and demonstrated competency, not a
state license, medical credential, or expanded scope of practice.

## Approved outcomes

- Explain the difference between following a sequence and leading the
  complete client experience.
- Identify one observable practitioner behavior that makes a service feel
  intentional and professionally delivered.
- Understand how to move through the course and use Cadence.
- Understand what the certificate represents — and does not represent.
- Recognize that certification does not replace licensure, expand scope, or
  authorize diagnosis or treatment.

## Central practitioner payoff

Gives the student a single, repeatable professional standard — observe
before assuming, protect scope, prepare the experience, adapt responsibly,
use tools with restraint — that every later module's judgment calls trace
back to, instead of leaving "professionalism" undefined until it's tested.

## Beginner misconception or mistake corrected

That knowing the steps of a service is the same as being professionally
responsible for it. The module's whole premise is that two practitioners can
run an identical sequence and produce a completely different client
experience depending on what they notice, prepare for, and adjust.

## Insider knowledge

- Leadership is visible in what a practitioner notices, prepares,
  communicates, and adjusts — not in how premium the tools look.
- A prepared transition (explaining what's changing, checking comfort) is
  what separates a led service from a merely completed one; silence and
  waiting for the client to complain shifts responsibility onto the client.
- The certificate is real and demonstrable, but it has a hard edge: it
  documents course completion and competency, not a license or medical
  authority — local law and licensing remain controlling.

## Approved learning rhythm

Orientation-paced: no graded quiz beyond a single open-response checkpoint
(`m0cp1`), and one ungraded predict-then-reveal practice moment ("Same
steps. Different service.") placed between the course-navigation content and
the five professional principles. The module is deliberately light — it
should not attempt to teach scope, anatomy, or protocol detail that belongs
to later modules. This is the calmest, least interaction-dense module in the
course so far.

## Relationship to adjacent modules

First module in the sequence — nothing precedes it. Its own approved
completion copy states the handoff explicitly: "Next, you'll define the
professional role itself: what a head spa practitioner is responsible for,
where that responsibility ends, and why that boundary protects both the
client and the practitioner" — i.e., Module 1 turns the Welcome Module's
"lead, don't just perform" standard into a concrete professional boundary.

## Approved visual opportunities

- **Existing asset:** None — no image assets exist for the Welcome Module
  specifically (`assets/images/course/` has no `module-00/` folder).
- **Screen recording after implementation:** the course-home entry screen,
  the cinematic intro sequence, and the Cadence-guided introduction —
  hold until manual QA is recorded, since interface behavior here is still
  flagged as untested in several respects (see Status).
- **New diagram needed:** none called for by the approved spec.
- **Optional:** a simple two-frame comparison (a practitioner following
  steps mechanically vs. one who pauses to check in) to visualize the
  hero distinction without needing interface footage.
- **Not yet available:** any footage of the "Same steps. Different
  service." interaction's real on-screen behavior, since its keyboard
  activation and reduced-motion behavior are unverified in a real browser.

## Approved text-callout opportunities

- "Clients can feel the difference between a service that is being
  performed and one that is being led."
- "Observe. Ask. Confirm. Adjust."
- "A certificate documents completion. It does not license you."
- "Tools support a service. They do not replace judgment."

## Claims and language that must not be reintroduced

- The old course names: "HeadSpa Mastery," "Headspa Mastery," "Head Spa
  Mastery."
- Cadence claiming personal, hands-on service experience (she is the
  course's curriculum-grounded guide, built from the instructor's
  experience — not a practitioner herself).
- Any implication that the certificate is a state license, medical
  credential, or grants accreditation/expanded scope.
- "Name it accurately" / "observe without being told" phrasing — replaced
  with observe-ask-confirm-adjust language per the approved corrections.
- The claim that a practitioner using tools "usually does not yet trust
  their own hands."

## Presenter emphasis

Calm, assured, and orienting rather than promotional. The instructor should
frame this as the standard the entire certification is measured against —
not a warm-up or a housekeeping module. The certificate explanation should
land as honest and confidence-building, not defensive.

## Video boundaries

Preview the leading-versus-performing distinction and what certification
means. Do not narrate the full onboarding flow, the checkpoint question, or
the practice interaction's specific scenarios — leave those for the lesson.
Course-interface screen recordings and any capture of the practice
interaction or checkpoint in action must wait for a recorded manual-QA
approval.

## Production flags

- No manual-QA-approval step recorded yet — treat all interface footage as
  provisional until one exists.
- Keyboard activation of the practice interaction's buttons is unverified
  in a real browser.
- Live-model grading behavior for `m0cp1` has only been tested with mocked
  AI responses, not the real model — do not present a live Cadence
  grading exchange as a finished, accurate example without a caveat.
- Screen-reader and `prefers-reduced-motion` behavior are unaudited.
- No image assets exist for this module; any visual beyond interface
  footage or a simple illustrative comparison would need new production.

## Suggested duration

**90–120 seconds.** This is an orientation module with a light content
load — long enough to land the central distinction and the certificate
explanation, short enough to respect that it precedes eleven more modules.

## Source references

- `docs/course-audit/modules/module-00.md` — "Approved outcomes," "Final
  replacement copy" (sections A, G, H, T), "Checkpoint specification,"
  "Approved interactions," "Guided completion structure."
- `docs/course-audit/00-global-decisions.md` — "Welcome Module naming,"
  "Course sequence & Final exam (Module 12)."
