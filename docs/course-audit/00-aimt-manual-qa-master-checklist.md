# AIMT Manual QA Master Checklist

Use this checklist before approving any implemented module.

Add module-specific acceptance checks from the approved `module-XX.md`.

A module is not approved solely because code validation passed.

---

## 1. Environment

- [ ] Confirm branch preview is for `course-audit-build`
- [ ] Confirm the live production site is not being used for branch QA
- [ ] Confirm latest implementation/polish commits are pushed
- [ ] Confirm browser cache is not showing an older build
- [ ] Confirm Review Mode is used only where intended

---

## 2. Desktop visual review

Review at a representative desktop width.

- [ ] Hero copy and hierarchy are correct
- [ ] Section order matches the approved specification
- [ ] No old pre-audit sections remain
- [ ] Spacing feels intentional
- [ ] Text width is readable
- [ ] Cards and callouts are visually distinct
- [ ] Images are sharp
- [ ] Images are not stretched or misleadingly cropped
- [ ] Captions and labels are correct
- [ ] No accidental AI/clinical implication
- [ ] Semantic success, error, warning, and neutral styles are consistent
- [ ] No black or decorative status icon contradicts the semantic system
- [ ] No visible layout jump or overlap
- [ ] No horizontal overflow

---

## 3. Phone visual review

Review on a real phone when possible.

- [ ] Hero remains readable
- [ ] Section headings do not wrap awkwardly
- [ ] Cards stack correctly
- [ ] Images fit the viewport
- [ ] Full-size image controls work
- [ ] Comparison layouts stack logically
- [ ] Touch targets are comfortable
- [ ] No clipped text
- [ ] No horizontal overflow
- [ ] Sticky or fixed elements do not block content
- [ ] Checkpoint controls remain usable
- [ ] Completion card fits cleanly

---

## 4. Interaction review

For every ungraded interaction:

- [ ] Instructions are clear
- [ ] Controls work by click/tap
- [ ] Keyboard behavior is logical
- [ ] Current state is visible
- [ ] Correctness uses text, not color alone
- [ ] Feedback is specific
- [ ] Student may revise where approved
- [ ] No score, XP, streak, or artificial reward appears
- [ ] No progress is written
- [ ] Completion is not gated
- [ ] Returning to the module does not create misleading saved state

---

## 5. Checkpoint review

For every required checkpoint:

- [ ] Displayed question matches the approved specification
- [ ] Evaluated question matches the displayed question exactly
- [ ] Voice control is present where intended
- [ ] Submit control works
- [ ] Enter submits
- [ ] Shift+Enter creates a new line
- [ ] Loading state is clear
- [ ] Network failure shows approved text
- [ ] Weak answer receives one focused revision request
- [ ] Strong answer can pass
- [ ] Grammar/spelling does not cause unfair failure
- [ ] Unsafe or diagnostic answer is corrected
- [ ] Feedback references the student’s actual answer
- [ ] Previously passed state restores correctly
- [ ] Review Mode remains unsaved
- [ ] Completion appears only after all required checkpoints pass

---

## 6. Cadence review

Test every approved quick prompt.

Confirm Cadence:

- [ ] Uses the correct course name
- [ ] Does not claim personal human experience
- [ ] Does not diagnose
- [ ] Does not prescribe
- [ ] Does not expand scope
- [ ] Does not restore removed claims
- [ ] Does not reference another module as though it were current
- [ ] Uses the approved module framing
- [ ] Gives concise, useful guidance
- [ ] Helps the student reason rather than merely restating the lesson
- [ ] Does not treat illustrative imagery as clinical evidence

---

## 7. Completion review

- [ ] Completion card appears only at the correct time
- [ ] Competency language matches the approved specification
- [ ] Next-module handoff is accurate
- [ ] Primary button works
- [ ] Back-to-course button works
- [ ] Next module remains locked before completion
- [ ] Next module unlocks after completion
- [ ] No dead or malformed button remains

---

## 8. Accessibility review

Manual checks:

- [ ] Visible focus
- [ ] Logical tab order
- [ ] Keyboard operation
- [ ] Touch operation
- [ ] Accessible names
- [ ] Live feedback is announced where appropriate
- [ ] Meaning does not depend on color
- [ ] Images have meaningful alt text
- [ ] Embedded image text is not the only source of content
- [ ] Reduced-motion behavior is acceptable
- [ ] No hidden instructional content is inaccessible

Deferred checks must be recorded honestly:

- [ ] Screen-reader QA
- [ ] Physical-keyboard QA
- [ ] Real touch-device QA

Do not mark deferred checks complete unless actually performed.

---

## 9. Regression review

- [ ] Previous approved modules still open
- [ ] Previous module interactions still function
- [ ] Global navigation still works
- [ ] Progress display remains correct
- [ ] Authentication remains intact
- [ ] Entitlements remain intact
- [ ] Review Mode remains intact
- [ ] No unrelated module copy changed
- [ ] No Module 5+ work began early
- [ ] No certificate or progress architecture changed unintentionally

---

## 10. Approval decision

### Approve when

- visual review passes;
- functional review passes;
- module-specific acceptance criteria pass;
- no blocking issue remains.

Update status to:

`Implemented — manual QA approved`

### Do not approve when

- a visible defect remains;
- grading is materially inconsistent;
- a required interaction fails;
- mobile overflow exists;
- misleading terminology remains;
- an image implies something unapproved;
- next-module gating fails;
- a regression appears.

Record the blocking issue and run a focused polish task.

---

## 11. Post-approval actions

- [ ] Update `modules/README.md`
- [ ] Update `implementation-log.md`
- [ ] Update `00-aimt-current-course-status.md`
- [ ] Create or update the module video-source file
- [ ] Confirm exact next module
- [ ] Confirm no merge to `main` unless the release preview is approved
