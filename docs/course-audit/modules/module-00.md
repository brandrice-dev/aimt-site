# Module 0 — Approved Audit Specification

**Course:** AIMT Head Spa Certification Course  
**Module:** 0  
**Approved module title:** Course Orientation  
**Source reviewed:** `module-00-source.md`  
**Status:** Approved for controlled implementation  
**Production source of truth:** `headspa-mastery.html`

This document is the approved implementation specification for Module 0. It does not authorize changes to authentication, entitlements, payments, database policies, certificate issuance, or unrelated modules.

---

## Amendment — Welcome Module naming

**Approved decision (supersedes conflicting display text below):** the
technical module with ID `0` must be presented to students as **Welcome
Module**. Student-facing copy must not display "Module 0" — this
supersedes any "Module 0 — Course Orientation" / "Module 0 · Course
Orientation" display text elsewhere in this document (see "Module identity"
under Final replacement copy, and the "Approved module title" field above).
Where this document says the student-facing title or eyebrow should read
"Module 0 — Course Orientation" or "Module 0 · Course Orientation," the
approved student-facing text is now **Welcome Module** instead.

All technical identifiers named throughout this document are preserved
exactly as specified: module ID `0`, `module0Wrap`, `M0`, `m0cp1`, progress
keys, function names, and state identifiers. This is a display-label change
only. The next instructional module remains student-facing **Module 1**;
technical modules are not renumbered.

Full rationale: [`../00-global-decisions.md`](../00-global-decisions.md#welcome-module-naming).

---

## Approved outcomes

By the end of Module 0, the student should be able to:

1. Explain the difference between following a service sequence and leading the complete client experience.
2. Identify at least one observable practitioner behavior that makes a service feel controlled, intentional, and professionally delivered.
3. Understand how to move through the course, use Cadence, revise checkpoint responses, and progress through required modules.
4. Understand what the AIMT course certificate represents and what it does **not** represent.
5. Recognize that certification does not replace state licensure, expand scope of practice, or authorize medical diagnosis or treatment.
6. Understand the professional standard that will guide the remainder of the course: observe before assuming, protect scope, prepare the experience, adapt responsibly, and use tools with restraint.

Module 0 should orient and calibrate the student. It should not attempt to teach the detailed scope, anatomy, assessment, or service protocols covered in later modules.

---

## Keep unchanged

The current curriculum is strong and should remain substantially intact. Do not rewrite the module merely for novelty.

Keep the following concepts and overall section order:

- The hero concept that clients can feel the difference between a service being performed and one being led.
- **0.1 — Why this course exists:** most head spa education provides disconnected pieces rather than a complete working system.
- **0.2 — A framework. Not a script:** the course teaches judgment and adaptation rather than rigid imitation.
- The explicit distinction between professional observation and medical diagnosis.
- **0.3 — The person who wants more than inspiration.**
- **0.4 — The layered course path** from orientation and scope through pricing.
- The “A common mistake” card explaining that a strong service is a system, not a collection of premium parts.
- **0.6 — The five professional principles**, subject only to the exact wording corrections below.
- The overall structure of **0.7 — What makes a great technician.**
- The core scope and referral framing in **0.8 — Scope and safety.**
- The four end-of-course outcome categories in **0.9 — What success looks like**, subject to the exact scope wording below.
- **0.10 — Clients remember how it felt.**
- **0.11 — Common early mistakes.**
- The single required open-response checkpoint as the Module 0 completion gate.
- The existing checkpoint ID `m0cp1`.
- The existing Module 0 wrapper ID, progress keys, completion dependencies, and Module 1 unlock relationship.
- Existing students who have already passed `m0cp1` must remain passed after implementation.

Do not remove `APP_STATE.getResponseContext` during this implementation. It may be dead code, but removing unrelated code is outside this module scope.

---

## Required corrections

### 1. Replace the visible course name

Replace student-facing uses of:

- `HeadSpa Mastery`
- `Headspa Mastery`
- `Head Spa Mastery`

with:

**Head Spa Certification Course**

This applies to Module 0, onboarding, course-home labels, Cadence prompts, and visible buttons included in this implementation batch.

Do **not** rename:

- `headspa-mastery.html`
- route paths
- entitlement identifiers
- database values
- API values
- JavaScript keys
- localStorage keys
- progress identifiers
- Stripe identifiers

### 2. Correct Cadence’s identity

Cadence must not claim that she personally spent nearly two decades performing services.

She may accurately say that she is AIMT’s course guide and that her guidance was built from the instructor’s nearly two decades of hands-on industry experience.

Cadence should not be presented as a generic chatbot, but she also should not impersonate a human practitioner.

### 3. Separate personal reflection from certification evidence

The current checkpoint combines:

- a competency question about service leadership, and
- a personal question about where the student feels least confident.

Personal confidence is useful for personalization but should not determine whether a student passes a certification checkpoint.

The student’s starting point belongs in the ungraded onboarding introduction. The required checkpoint should evaluate only the Module 0 competency.

### 4. Explain what certification means

Add a visible explanation that:

- the student earns the course certificate by completing required curriculum and competency checkpoints;
- the certificate documents AIMT course completion;
- it is not a state license or medical credential;
- it does not expand the student’s legal scope of practice;
- local laws, licensing rules, and employer requirements remain controlling.

Do not use “accredited” or imply governmental, academic, or medical recognition that has not been established.

### 5. Correct scope-sensitive wording

Replace language that could encourage inference or diagnosis:

- `name it accurately` → `describe and document visible findings accurately`
- `observe without being told` → observe, ask, confirm, and adjust
- any implication that technology or a practitioner can diagnose a scalp disorder inside this course

### 6. Remove unnecessarily judgmental language

Replace the claim that a practitioner using tools “usually does not yet trust their own hands.”

The professional point should remain: tools support a service but do not replace touch, preparation, pacing, judgment, or client communication.

### 7. Improve first-time onboarding usability

The cinematic introduction may remain, but students need:

- a visible Skip control;
- a visible “Show full introduction” or equivalent control that immediately reveals the complete text;
- reduced-motion behavior that avoids character-by-character typing;
- a clear state while Cadence is preparing a personalized response;
- an honest fallback if personalization fails.

Do not force every student to sit through the full typing animation.

### 8. Improve accessibility

- Add a real accessible name to the voice-input button with `aria-label="Speak your answer"`.
- Add `aria-label="Send response to Cadence"` to the checkpoint submit button.
- Ensure the checkpoint status and feedback region use an appropriate live region.
- Do not rely only on color, animation, or a `title` attribute to communicate state.
- Preserve keyboard submission behavior without preventing multiline answers when Shift+Enter is used.

### 9. Name the competency at completion

The completion state should say what the student demonstrated instead of making a broad claim that they “understand what [they are] building” based on one checkpoint.

### 10. Preserve progress integrity

This module update must not:

- invalidate previously passed checkpoints;
- create new required completion fields;
- change certificate eligibility;
- change authentication, entitlement, or payment behavior;
- rewrite unrelated module state.

---

## Final replacement copy

Only the copy listed below is approved for replacement or addition. All other Module 0 curriculum remains unchanged.

### A. Intro screen brand mark

**Replace with:**

> AIMT · Head Spa Certification Course

### B. First-time Cadence introduction

Use the student’s first name naturally when available.

> Hi[, {firstName}]. I’m Cadence.
>
> I’m your guide through AIMT’s Head Spa Certification Course.
>
> My guidance was built from nearly two decades of hands-on work across cosmetology, esthetics, client experience, service design, and scalp-focused care.
>
> I’ll help you understand the science, technique, client experience, and business decisions behind a professional head spa service—not simply memorize a sequence.
>
> Your answers help me tailor examples and feedback to where you are starting and what you are working toward.
>
> Before we begin—tell me where you are starting.

### C. Student introduction prompt

**Label:**

> Tell Cadence where you’re starting

**Placeholder:**

> Your license or professional role, your experience, what you want to build, and anything you feel unsure about…

**Button:**

> Continue

This introduction remains ungraded.

### D. Intro personalization system prompt

Replace the current intro-response prompt with:

> You are Cadence, AIMT’s curriculum-grounded guide for the Head Spa Certification Course. You do not claim personal work experience or present yourself as a human instructor. Your guidance was built from the instructor’s nearly two decades of hands-on experience across cosmetology, esthetics, client experience, service design, and scalp-focused care.
>
> A student submitted this introduction: “{text}”. [Their name is {name}.]
>
> Respond in 2–3 concise sentences. Reference one specific detail the student actually shared. Connect that detail only to the head spa curriculum, professional service delivery, scalp wellness, client experience, or the business of building a head spa service. Do not invent facts about the student. Do not use generic praise, excessive enthusiasm, or therapy-like language.
>
> End by naming one useful area of the course that appears especially relevant to what the student shared. Do not evaluate or grade the introduction.

Retain the existing consistency and selective-memory rules where compatible.

### E. Intro fallback response

**Replace the generic welcome fallback with:**

> Your introduction has been saved. You can begin the course now, and Cadence will be available inside each module.

When a first name is available:

> {firstName}, your introduction has been saved. You can begin the course now, and Cadence will be available inside each module.

### F. Intro begin button

**Replace with:**

> Begin the course

### G. Course-home labels

**Course title:**

> Head Spa Certification Course

**Progress label:**

> Certification progress

**Initial resume button:**

> Begin — Module 0

### H. Module identity

**Module title:**

> Module 0 — Course Orientation

**Dashboard subtitle:**

> How the course works, what certification means, and the standard ahead

**Hero eyebrow:**

> Module 0 · Course Orientation

**Hero title:** keep unchanged.

> Clients can feel the difference between a service that is being performed and one that is being led.

**Hero description:**

> Your job is to lead it. Before technique begins, this module establishes how the course works and the professional standard behind every service decision that follows.

### I. Section 0.1 opening paragraph

Replace only the first paragraph under **Why this course exists.**

> I’m Cadence, the course guide built to help you work through AIMT’s curriculum, test your reasoning, and connect each concept to real service delivery. The course itself was built from nearly two decades of hands-on work across cosmetology, esthetics, elevated client experience, service design, and scalp-focused care. It was created to solve a problem that appears throughout head spa education: students are often given pieces, but not a complete working system.

Keep the remaining two paragraphs in section 0.1 unchanged.

### J. Add certification explainer to section 0.2

Place after the existing “What this course is not” note.

**Label:**

> What your certificate represents

**Copy:**

> Completing AIMT’s Head Spa Certification Course means you have worked through the required curriculum and demonstrated the course competencies. Your certificate documents that achievement. It is not a state license, a medical credential, or permission to work beyond the services your existing license and local laws allow. Your licensing authority, local regulations, and professional scope remain the standard you must follow.

### K. Replace section 0.5 body copy

**Heading:**

> Move through it in order. Use it actively.

**Body:**

> Each module supports the next. If you skip scope, you are more likely to overstep in consultation. If you rush anatomy, your assessment reasoning becomes weaker. If you ignore setup, the service flow breaks down.
>
> The course is self-paced, but it is not designed to be rushed. Pause for the practice moments. Answer checkpoints from your own reasoning. Use Cadence to question, clarify, and strengthen your thinking—not to write the answer for you. Physical technique still requires repetition outside the screen.

**Cadence note:**

> “As you move through the course, don’t stop at ‘what do I do here?’ Ask why it matters, what problem it solves, and what should change when the client or scalp in front of you does not match the ideal example. That is where professional judgment begins.”

### L. Section 0.6 wording corrections

#### Principle 3 — Relaxation and professionalism can coexist

> Calm does not mean careless. The service can be deeply sensory while still being prepared, well-paced, hygienic, and professionally responsible. Those qualities support one another.

#### Principle 4 — Human touch matters more than tools

> Tools can support precision, consistency, comfort, and sensory interest. They cannot replace prepared hands, attentive pacing, clear communication, or professional judgment. Tools are optional. Intentional delivery is not.

Keep Principles 1, 2, and 5 unchanged.

### M. Section 0.7 wording corrections

#### Observe

> Notice scalp appearance, client feedback, body language, temperature response, and sensitivity—then ask, confirm, and adjust instead of assuming.

#### Hold the room

> Guide the pace, comfort, transitions, and emotional tone of the service from the moment it begins.

Keep the remaining three cards unchanged.

### N. Section 0.8 professional-frame note

**Label:** keep unchanged.

> The professional frame

**Replace note copy with:**

> You are observing and documenting visible findings, working within scope, supporting comfort and scalp wellness appropriately, and recognizing when to modify, pause, or refer. A strong practitioner can say: “This is what I can see. This is how I can safely adapt within my role. This is where I would pause and recommend further evaluation.” Never communicate certainty you are not qualified to provide.

Keep the surrounding scope-and-safety paragraphs, including the reminder that laws and licensing standards vary.

### O. Section 0.9 wording corrections

#### Guide confidently

> Move a client through the complete experience—from intake to close—with a prepared flow, clear communication, and the ability to recover when something changes.

#### Assess without overstepping

> Observe and describe visible findings accurately, document what matters, and stay on your side of the professional boundary.

Keep **Adapt in real time** and **Perform repeatably** unchanged.

### P. Module-open Cadence greeting

> Module 0 establishes how this course works and the standard behind it. Start with the difference between performing a sequence and leading the complete experience; that distinction will return throughout the program.

### Q. Module 0 quick prompts

Replace with:

- `How should I use Cadence during the course?`
- `What makes a service feel led rather than performed?`
- `What does this certification represent?`

### R. Guide-chat error message

Replace:

> Something went sideways — try that again?

with:

> Cadence couldn’t respond. Check your connection and try again.

### S. Checkpoint error message

Replace:

> Cadence didn't respond — check your connection and try again.

with:

> Cadence couldn’t review your response. Your answer is still here—check your connection and try again.

### T. Module completion state

**Eyebrow or status:**

> Module 0 complete

**Title:**

> The standard is established.

**Body:**

> You demonstrated the difference between following a sequence and leading the full client experience.

**Competencies shown:**

- Course expectations
- Service leadership
- Professional boundaries

**Next-up label:**

> Up next — Module 1

**Next-up copy:**

> Next, you’ll define the professional role itself: what a head spa practitioner is responsible for, where that responsibility ends, and why that boundary protects both the client and the practitioner.

**Primary button:**

> Start Module 1 →

**Secondary button:**

> Back to course

---

## Checkpoint specification

### Checkpoint purpose

`m0cp1` should assess one competency only:

> Can the student explain the difference between executing a sequence and leading the complete client experience, then apply that distinction to one realistic service behavior?

The student’s personal confidence or insecurity must not be part of the pass/fail decision.

### Student-facing question

> Two practitioners can follow the same service sequence and create completely different experiences. In your own words, what changes when a practitioner leads the service instead of simply performing the steps? Give one specific example of what leading would look like during a head spa service.

### Placeholder

> Explain the difference and give one service example…

### Accessible button label

> Send response to Cadence

### Passing standard

Pass when the response demonstrates both of the following:

1. **The distinction:** The student explains that leading involves responsibility for the full experience—not merely remembering or completing steps. Valid ideas include preparation, observation, pacing, transitions, communication, comfort, adaptation, decision-making, consistency, or staying within scope.
2. **Application:** The student gives one relevant, specific example of what leading looks like during a head spa service.

The student does not need to use the words “led,” “performed,” “professional judgment,” or any other exact terminology.

Do not fail an otherwise correct response because of:

- grammar;
- spelling;
- informal wording;
- brevity;
- English-language fluency;
- a valid example different from the course examples.

### Responses that are not yet sufficient

Return `pass:false` when:

- the student says only that leading means “being confident,” “being professional,” or “doing a good job” without explaining the difference;
- the student describes only the service steps;
- no specific service example is provided;
- the answer is off-topic;
- the response relies on medical diagnosis or another unsafe claim.

### Revision behavior

When one required element is present and the other is missing, Cadence should ask one focused follow-up rather than repeat the entire prompt.

Examples:

- Missing application:
  > You explained the difference clearly. Give me one moment during a head spa service where the client would be able to feel that leadership.

- Missing distinction:
  > Your example works. Now tell me what responsibility the practitioner is taking in that moment beyond simply completing the next step.

- Too vague:
  > “Confidence” can be part of it, but the client experiences behavior rather than a feeling inside the practitioner. What would the practitioner actually do differently?

- Unsafe or out-of-scope:
  > Pause there: leading a service does not mean diagnosing a scalp condition. Describe what the practitioner can observe, communicate, or adjust within scope instead.

Cadence should pass the response as soon as the full competency is demonstrated. Do not require unnecessary extra turns.

### Current-build behavior

Until the later persistent-thread architecture is implemented:

- keep the existing checkpoint ID and progress schema;
- render the latest student response and Cadence feedback clearly;
- use `pass:false` feedback as the focused follow-up;
- allow the student to revise in the existing textarea;
- do not add a new database table in this module implementation;
- do not invalidate earlier passed records.

The full conversation-history and cross-device thread experience remains a separate engineering phase.

### Approved evaluator system prompt

Use this Module-0-specific evaluator instruction in addition to the shared tone and JSON-format rules:

> You are Cadence, the curriculum-grounded learning guide for AIMT’s Head Spa Certification Course. Evaluate the student’s Module 0 competency, not their writing style.
>
> The student passes only when they demonstrate both elements:
>
> 1. They explain that leading a service means taking responsibility for the complete client experience rather than merely completing memorized steps. Their explanation may reference preparation, observation, pacing, transitions, communication, comfort, adaptation, decision-making, consistency, or professional boundaries.
> 2. They give one specific, relevant example of what that leadership looks like during a head spa service.
>
> Do not require exact terminology. Do not fail for grammar, spelling, informal wording, concision, or English-language fluency when the concept is clear.
>
> If one element is demonstrated and the other is missing, return pass false and ask one focused follow-up question about only the missing element. If the response is vague, identify what makes it vague and ask for one observable practitioner behavior. If the response contains medical diagnosis or unsafe scope language, correct that immediately and ask the student to reframe the example within professional scope.
>
> If both elements are demonstrated, return pass true with a concise explanation of why the answer meets the standard and connect it to client trust, comfort, consistency, or service flow.
>
> Do not grade the student’s personal confidence, career stage, or background.

Retain the existing JSON-only response contract:

```json
{"pass": true, "feedback": "short response shown to the student"}
```

### Test cases

Claude should test the evaluator against at least these cases.

#### Clear pass

> Performing is following the checklist. Leading means watching the client and the service as a whole and adjusting without making the experience feel interrupted. For example, if the client tenses when the water temperature changes, I would notice it, check in, adjust the temperature, and keep the transition calm.

Expected: `pass:true`

#### Pass without formal terminology

> One person is just getting through the steps. The other is paying attention to how everything is landing. If I need a product that is not ready, I would keep the client comfortable and explain the transition instead of silently walking away and breaking the flow.

Expected: `pass:true`

#### Missing example

> Leading means managing the complete experience instead of only following the sequence.

Expected: `pass:false` with one request for a specific service example.

#### Vague response

> It means being more confident and professional.

Expected: `pass:false` with one request for an observable behavior.

#### Unsafe response

> Leading means diagnosing what scalp disease the client has and changing the treatment.

Expected: `pass:false` with immediate scope correction and a request to reframe using observation, communication, modification, pausing, or referral.

---

## Approved interactions

### Interaction 1 — Same steps. Different service.

**Status:** Approved for this implementation  
**Placement:** After section 0.5 and before section 0.6  
**Type:** Low-stakes predict-then-reveal  
**Graded:** No  
**Affects progress or completion:** No  
**Persistence required:** No

#### Prompt

> Both practitioners know the service sequence. Which one is leading the experience?

#### Scenario A

> The practitioner follows the sequence exactly. When the next product is out of reach, they step away without explanation, return, and continue where they left off. They do not check comfort because the client has not complained.

#### Scenario B

> The practitioner prepares the transition, tells the client what is changing, watches for tension, checks temperature and comfort, and adjusts the sequence when the client or scalp response calls for it.

#### Correct selection

Scenario B.

#### Feedback after Scenario A

> The steps may be correct, but the practitioner is reacting to the service instead of guiding it. Silence, an unprepared transition, and waiting for the client to complain all shift responsibility back to the client.

#### Feedback after Scenario B

> This service is being led. Preparation, communication, observation, and responsible adjustment keep the client inside one continuous experience.

#### Learning anchor

> Leadership is visible in what the practitioner notices, prepares, communicates, and adjusts—not in how luxurious the tools appear.

#### Interaction requirements

- The student must select an option before feedback appears.
- Both options remain reviewable after selection.
- A wrong choice receives explanatory feedback, not punishment.
- The student may change the selection and see the correct reasoning.
- Use native buttons or radio controls with keyboard and screen-reader support.
- Do not use drag-and-drop.
- Do not display points, a score, a streak, confetti, or a completion badge.
- Do not treat this practice interaction as certification evidence.

### No additional Module 0 interaction is required

The ungraded introduction already creates a personalized active moment, and the required checkpoint provides constructive practice. Adding more mechanics would make the orientation feel padded.

The student’s “least confident” area may be retained inside the onboarding introduction for Cadence personalization, but it must not be reintroduced as another required quiz.

---

## Cadence behavior

### Module 0 guide identity

Replace `MODULE_GUIDE_SYSTEMS[0]` with:

> You are Cadence, AIMT’s curriculum-grounded guide for the Head Spa Certification Course. You do not claim personal work experience or present yourself as a human instructor. Your guidance was built from the instructor’s nearly two decades of hands-on experience across cosmetology, esthetics, client experience, service design, and scalp-focused care.
>
> The student is in Module 0: Course Orientation. This module establishes the course philosophy, the difference between performing and leading a service, how to use the program, and the professional scope framing that governs the curriculum.
>
> Respond directly to the student’s actual question. Reference their background only when it materially improves the answer, and connect it only to head spa services, scalp wellness, client experience, professional practice, or the business of building a head spa service. Do not diagnose, prescribe, or imply that the course expands legal scope.
>
> Keep responses concise, warm, direct, and professional. Avoid generic praise, excessive enthusiasm, therapist-like language, or invented personal details. Usually respond in 3–5 sentences without bullet points unless the student explicitly asks for a list.

### Teaching behavior

Cadence should:

- answer course-navigation and orientation questions directly;
- ask a focused question when it helps the student reason;
- explain rather than withhold essential information;
- correct unsafe or scope-crossing claims immediately;
- refer students back to the relevant course section when appropriate;
- distinguish course education from legal, licensing, and medical authority;
- avoid turning every student question into another question;
- avoid generic statements such as “Great job,” “Amazing,” or “I’m so glad you’re here” unless the specific context genuinely calls for acknowledgment.

### Memory behavior

Cadence may use the student’s introduction to tailor examples, but must:

- reference only details the student actually provided;
- avoid repeatedly mentioning the same background detail;
- avoid implying knowledge outside stored course interactions;
- never use personal background as part of checkpoint grading;
- avoid exposing internal memory labels or summaries to the student.

### General guide conversation

The later persistent Cadence thread project should preserve guide history separately from required checkpoint threads. That work is not part of the Module 0 production patch.

---

## Acceptance criteria

Module 0 is approved only when all of the following are true.

### Naming and identity

- No student-facing Module 0 or onboarding surface displays “HeadSpa Mastery,” “Headspa Mastery,” or “Head Spa Mastery.”
- The visible name is consistently **Head Spa Certification Course**.
- Internal filenames, slugs, storage keys, entitlement keys, API values, and progress IDs remain unchanged.
- Cadence does not claim personal hands-on experience.
- Cadence is clearly presented as AIMT’s curriculum-grounded course guide.

### Curriculum and scope

- Existing curriculum remains in the current order except for the approved practice interaction and certification card.
- Only the approved copy replacements are made.
- The certification explainer is visible in Module 0.
- The explainer does not claim accreditation, licensure, medical authority, or expanded scope.
- “Name it accurately” is replaced with observation/documentation language.
- The “observe without being told” wording no longer encourages assumption.
- Tool language is professional and nonjudgmental.
- Local-law and licensing reminders remain visible.

### Onboarding

- The introduction can be skipped.
- The full introduction can be revealed without waiting for the typing animation.
- Reduced-motion users do not receive character-by-character animation.
- The student introduction remains ungraded.
- A failed personalization request produces the approved honest fallback.
- The begin button reads `Begin the course`.

### Practice interaction

- “Same steps. Different service.” appears after section 0.5.
- It works by keyboard, touch, and mouse.
- It gives specific explanatory feedback for both choices.
- It does not write progress, checkpoint, score, or completion state.
- It creates no points, streaks, confetti, or game-like reward.

### Checkpoint

- The checkpoint ID remains `m0cp1`.
- The approved question and placeholder are displayed.
- The checkpoint grades only the defined Module 0 competency.
- Both the distinction and one applied example are required.
- Correct concise answers can pass.
- Grammar and spelling do not determine pass/fail.
- Partial answers receive one focused follow-up question.
- Unsafe diagnosis language is corrected immediately.
- Existing previously passed students remain passed.
- A new pass still unlocks Module 1 through the existing completion logic.
- A failure does not unlock Module 1.
- Network failure preserves the student’s typed answer and shows the approved retry message.
- The submit button, voice button, feedback region, and status state have accessible labels.

### Completion

- The completion card names the demonstrated competency.
- It does not claim that the student has mastered the full course.
- Module 1 remains the correct next destination.
- No certificate or backend eligibility logic changes occur.

### Regression checks

- Normal authentication and entitlement behavior is unchanged.
- Existing saved Module 0 state restores correctly.
- Course-home progress renders correctly.
- Module 0 can be reopened after completion.
- Mobile layouts do not overflow.
- No duplicate element IDs are introduced.
- No new console errors appear.
- No unrelated module copy, checkpoint prompt, or styling is changed.

---

## Guided completion structure

The Welcome Module will eventually introduce the optional Guided
Completion Path (see
[`../00-global-decisions.md`](../00-global-decisions.md#guided-completion-path)).
The exact pace options and wording are **deferred** until all module
workloads have been audited — this document does not authorize building any
Guided Completion Path UI or logic yet.

Guided Completion Path fields for the Welcome Module itself (recorded here
per the same requirement now placed on every module audit; see
`modules/README.md`):

- **Estimated learning time:** not yet determined — deferred pending full
  workload audit.
- **Estimated hands-on or application time:** not yet determined — the
  Welcome Module is orientation-only and is not expected to carry hands-on
  time, but this is confirmed only after the full audit.
- **Competency demonstrated:** the student can explain the difference
  between following a service sequence and leading the complete client
  experience (see "Approved outcomes" and "Checkpoint specification"
  above).
- **Suggested practice or application task:** none beyond the approved
  "Same steps. Different service." interaction and the required checkpoint
  — the Welcome Module is orientation, not a hands-on module.
- **Earlier concepts that should be revisited:** none — this is the first
  module in the sequence.
- **Suggested position in the Guided Completion Path:** first — precedes
  Module 1 and every instructional module, and precedes the Module 12 Final
  Exam that all pacing leads toward.

---

## Implementation notes

1. Implement Course Review Mode as a separate, approved task before or alongside visual QA, but do not combine its logic with Module 0 curriculum state.
2. Keep `m0cp1`, `module0Wrap`, `m0Complete`, and existing progress keys unchanged.
3. Do not regrade or reset previously accepted Module 0 checkpoints.
4. The exact persistent text-thread checkpoint architecture is deferred. This implementation should improve the question, grading criteria, feedback, and visual clarity using the current state model.
5. The approved practice interaction should be a reusable component pattern where practical, but do not refactor all later-module interactions during this task.
6. Do not remove dead code, restructure the monolithic course file, or split production modules during the Module 0 implementation.
7. Do not edit authentication, entitlement, Stripe, Supabase policies, progress-sync architecture, or certificate issuance.
8. The general legal and licensing language in this module is educational framing, not a state-by-state legal determination. State-specific scope verification belongs in the later scope audit.
9. After implementation, update `docs/course-audit/implementation-log.md` with:
   - files changed;
   - source sections changed;
   - checkpoint prompt changes;
   - interaction added;
   - accessibility changes;
   - tests completed;
   - any approved item not implemented and why.
10. Stop after Module 0 and its directly connected onboarding surfaces. Do not continue into Module 1.
