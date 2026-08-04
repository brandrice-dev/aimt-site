# Module 1 — Approved Audit Specification

**Course:** AIMT Head Spa Certification Course  
**Module:** 1  
**Approved module title:** Role of the Head Spa Technician  
**Source reviewed:** `module-01-source.md`  
**Status:** Approved for controlled implementation  
**Production source of truth:** `headspa-mastery.html`

This document is the approved implementation specification for Module 1. It does not authorize changes to authentication, entitlements, payments, database policies, certificate issuance, unrelated modules, the Guided Completion Path UI, Listen Mode, or the future Module 12 Final Exam.

---

## Approved outcomes

By the end of Module 1, the student should be able to:

1. Describe a head spa as a structured, scalp-focused cosmetic and wellness service rather than a medical treatment.
2. Understand that “head spa technician” describes the professional role performed during the service; it is not a separate state license or medical credential.
3. Distinguish professional observation from medical diagnosis.
4. Use client-facing language that accurately describes visible findings without naming a medical condition or claiming certainty that is outside scope.
5. Recognize when new, persistent, severe, painful, spreading, or otherwise concerning findings require referral to a qualified medical professional.
6. Explain the realistic benefits and limitations of a head spa service without promising treatment, cure, diagnosis, or hair regrowth.
7. Understand that legal scope depends on the student’s existing license, state law, establishment rules, equipment, and the services actually performed.
8. Explain what separates a practitioner who leads the complete client experience from someone who only follows service steps.

Module 1 is the professional-boundary foundation for the course. It should not attempt to teach detailed scalp-condition recognition, anatomy, consultation flow, or service protocol content that belongs in later modules.

---

## Keep unchanged

The current module is conceptually strong and should remain substantially intact. Do not rewrite it merely to make it sound different.

Keep the following:

- The overall eight-section structure and sequence.
- The hero concept: `Know what you are. Know what you are not.`
- The definition of a head spa as both a structured scalp-focused service and a sensory, relaxing experience.
- The emphasis that the practitioner is responsible for the complete experience, not merely the physical sequence.
- The central distinction between observation and diagnosis.
- The use of practical client-language examples.
- The referral framing: referral is part of professional judgment, not a failure.
- The scope, limitations, licensing, client-positioning, and common-mistakes sections.
- The two required open-response checkpoints.
- Existing checkpoint IDs `m1cp1` and `m1cp2`.
- Existing technical module ID `1`, wrapper ID `module1Wrap`, `M1`, progress keys, state identifiers, and Module 2 unlock relationship.
- Existing students who already passed either Module 1 checkpoint must remain passed.
- Module 1 remains student-facing **Module 1**. Do not renumber it.
- Module 2 remains the next module.

---

## Required corrections

### 1. Correct the visible course name and Cadence identity

Replace student-facing and Cadence-prompt references to:

- `HeadSpa Mastery`
- `Headspa Mastery`
- `Head Spa Mastery`

with:

**Head Spa Certification Course**

Cadence must not claim that she personally spent nearly two decades working in the industry.

She may accurately say that she is AIMT’s curriculum-grounded guide and that her guidance was built from the instructor’s nearly two decades of hands-on experience.

Do not rename technical slugs, files, routes, entitlement identifiers, database values, localStorage keys, API values, or progress identifiers.

### 2. Explain that “head spa technician” is a role, not a license

The current module can be read as though “head spa technician” is a legally recognized license category.

Add a clear statement that:

- the term describes the role performed during a head spa service;
- AIMT certification does not create a new state license;
- the services a student may legally perform come from the license or authorization they already hold and the rules where they practice.

### 3. Stop presenting scope lists as universal

The current “Within scope” list is too absolute for a course serving students across different states and license types.

The same head spa activity may be permitted for one license type and prohibited for another.

Reframe the card as examples that **may** fall within scope only when authorized by:

- the student’s license;
- state and local law;
- establishment rules;
- equipment and sanitation requirements;
- the exact service being performed.

The “Outside scope” card may remain firm regarding diagnosis, prescription, disease-treatment claims, and medical procedures because this course does not authorize them.

### 4. Remove or narrow hair-growth claims

Replace:

> A healthier environment that supports hair growth.

This is too easy to interpret as a claim that a head spa service promotes or restores hair growth.

Use language limited to cosmetic and comfort outcomes:

- improved cleansing;
- removal of cosmetic buildup when appropriate;
- cosmetic hydration and conditioning;
- relaxation and comfort;
- a cleaner, more comfortable scalp environment.

The module should explicitly say that a head spa service does not diagnose the cause of shedding, treat hair-loss disorders, reverse genetic hair loss, or regrow hair.

### 5. Remove “circulation” as a promised service outcome

Replace the card:

> Massage & circulation — The therapeutic core of the service.

with:

> Massage & relaxation — The sensory core of the service.

The course may teach safe massage technique and relaxation benefits. It should not use circulation as a promised clinical outcome or imply that scalp massage treats hair loss.

### 6. Tighten the flaking script

The existing flaking script says visible findings can be “consistent with dandruff.” Although it includes a disclaimer, the phrasing still steers the client toward a named condition.

Replace it with observation-first language that describes flaking and oil without proposing a cause.

### 7. Strengthen referral guidance

The current referral language is directionally correct but too general.

Include referral for findings such as:

- new or unexplained heavy shedding;
- sudden or rapidly changing hair loss;
- severe, persistent, spreading, painful, bleeding, or worsening symptoms;
- broken or visibly compromised skin;
- signs that may indicate infection or inflammation;
- anything the practitioner cannot safely address within cosmetic scope.

Do not imply that a practitioner should continue a cosmetic service over visibly compromised skin or a suspected infection.

### 8. Align the displayed checkpoint questions with the questions sent to Cadence

Both Module 1 checkpoints currently display a detailed question but send a shorter paraphrase to the evaluator.

The student and evaluator must receive the same exact question.

Do not maintain separate shortened versions.

### 9. Add explicit checkpoint rubrics

Each checkpoint needs its own required elements.

Cadence should evaluate demonstrated understanding, not keyword matching.

A response should not fail because of:

- grammar;
- spelling;
- informal language;
- concise wording;
- missing technical vocabulary when the underlying concept is correct;
- English not being the student’s first language;
- a valid answer that differs from sample wording.

When an answer is incomplete, Cadence should name the single most important missing element and invite a focused revision.

Safety-critical misinformation must be corrected immediately.

### 10. Improve accessibility

For both checkpoints:

- Add `aria-label="Speak your answer"` to the voice-input button.
- Add an accessible name to the submit button, such as `aria-label="Send response to Cadence"`.
- Use an appropriate live region for thinking, error, revision, accepted, and feedback states.
- Do not rely only on an SVG, color, or `title` attribute.
- Preserve Enter-to-submit and Shift+Enter-for-new-line behavior.
- Ensure the ungraded practice interaction is fully usable by keyboard and communicates selected/correct states without color alone.

### 11. Add one meaningful ungraded practice interaction

Module 1 currently moves directly from static scope examples into required graded checkpoints.

Add one low-stakes interaction that asks the student to classify realistic client language as:

- **Professional observation**
- **Outside scope**

The interaction should give immediate explanatory feedback, remain ungraded, and have no effect on module completion.

### 12. Name the demonstrated competencies at completion

The completion card should separately identify what the student demonstrated:

- professional observation and client language;
- scope and referral judgment;
- understanding of the technician’s responsibility for the full experience.

### 13. Preserve progress and system integrity

This implementation must not:

- invalidate previously passed `m1cp1` or `m1cp2`;
- add a new required checkpoint;
- make the practice interaction a completion requirement;
- change Module 2 content;
- change authentication, entitlements, payment, progress synchronization, certificate logic, or Review Mode;
- implement the Guided Completion Path, Listen Mode, or Module 12.

---

## Final replacement copy

Only the copy listed below is approved for replacement or addition. All other Module 1 curriculum remains unchanged.

### A. Module identity

**Home-screen title:**

> Module 1 — Role of the Head Spa Technician

**Home-screen subtitle:**

> Professional role, scope, limitations, and licensing

**Hero eyebrow:**

> Module 1 · Role, Scope & Professional Boundaries

**Hero title:**

> Know what you are.  
> Know what you are not.

**Hero description:**

> Professionalism begins before the service does—with how you observe, explain, adapt, and stay within scope.

### B. Section 1.1 card correction

Replace:

> Massage & circulation  
> The therapeutic core of the service.

with:

> Massage & relaxation  
> The sensory core of the service.

All other 1.1 cards may remain unchanged.

### C. Section 1.2 role clarification

Add this paragraph after the first paragraph in Section 1.2:

> In this course, “head spa technician” describes the role you perform during a head spa service. It is not a separate state license. Your legal scope comes from the license or authorization you already hold, the laws where you practice, and the specific services you perform. AIMT certification documents course completion; it does not expand that legal scope.

Replace the clinical note with:

**Clinical note label:**

> The work behind the calm

**Clinical note copy:**

> The service should feel effortless to the client. Behind that calm, the practitioner is observing, communicating, adjusting pressure and pacing, protecting scope, recognizing when to simplify or stop, and maintaining control from beginning to end.

### D. Section 1.3 safe-language scripts

Keep the heading and introduction.

Replace the “Language that keeps you in scope” scripts with:

| Situation | Approved script |
|---|---|
| Buildup | “I’m seeing visible buildup around parts of the scalp. Today I would focus on gentle, thorough cleansing and adjust the service based on how the scalp responds.” |
| Flaking | “I’m seeing flaking and oil around the root area. I can describe what is visible and adjust today’s cosmetic service, but I can’t determine the cause from appearance alone.” |
| Irritation | “I’m seeing redness and irritation in this area. I would avoid aggressive exfoliation or stimulation here and explain when medical evaluation would be appropriate.” |
| Shedding or thinning | “I can document the shedding or thinning pattern I can see, but I can’t determine the cause or diagnose hair loss. Because this is new or concerning to you, a dermatologist or other qualified medical professional is the appropriate next step.” |

Keep the “Language that takes you out of scope” examples, but replace the explanations with:

| Situation | Outside-scope statement and explanation |
|---|---|
| Diagnosis | “This is seborrheic dermatitis.” — A visible pattern is not a medical diagnosis. |
| Cause | “This is fungal.” — Appearance alone cannot establish the cause. |
| Hair loss | “This is alopecia.” — Hair-loss diagnosis requires medical evaluation. |
| Prescription | “You should use this medicated or prescription product.” — Do not prescribe or direct medical treatment. |

Replace the paragraph after the cards with:

> This distinction protects the client and your credibility. Experience should make your language more precise—not more certain than the evidence allows. Stay grounded in what you can observe, what your license permits, and when referral is the correct next step.

### E. Section 1.3 referral copy

Replace the current “When to refer out” paragraph with:

> Refer when the concern is new, unexplained, severe, persistent, spreading, painful, bleeding, rapidly changing, or outside cosmetic scope. New or heavy shedding, sudden changes in density, broken or visibly compromised skin, and signs that may indicate infection or significant inflammation require caution and appropriate medical evaluation. You are not expected to determine the diagnosis. You are expected to recognize when a cosmetic service is not the answer and respond professionally.

### F. Section 1.4 scope framing

**Replace the heading:**

> What may be permitted. What this course never authorizes.

**Replace the introduction:**

> Scope is determined by the license or authorization you hold, the laws where you practice, the establishment in which you work, and the specific services and equipment you use. A service that is permitted for one license type or state may be prohibited for another. The mistake is assuming that course certification creates permission it cannot create.

**Replace protocol card 1 title:**

> May fall within scope—verify first

**Badge:**

> License dependent

**Card 1 list:**

- Cleansing the scalp and hair
- Cosmetic product application
- Massage and manual techniques
- Cosmetic exfoliation
- Use of devices or equipment
- Observation and description of visible findings
- Non-prescription cosmetic product guidance

Add this line beneath the list:

> Each item is permitted only when it is allowed by your existing license, state and local rules, establishment requirements, and the manufacturer’s directions.

**Replace protocol card 2 title:**

> Never authorized by this course

**Badge:**

> Outside course scope

**Card 2 list:**

- Diagnosing a medical condition
- Prescribing or directing prescription treatment
- Claiming to cure, reverse, or treat disease
- Performing a medical procedure
- Presenting scanner, microscopy, or AI output as a medical diagnosis
- Practicing beyond the license or authorization you hold

### G. Section 1.5 service limitations

**Replace “What a head spa can support” list with:**

- Improved cosmetic cleansing and removal of buildup when appropriate
- Cosmetic hydration and conditioning
- Scalp comfort and relaxation
- A cleaner, more comfortable scalp environment
- A consistent routine of professional cosmetic scalp care

**Replace “What a head spa cannot do” list with:**

- Diagnose or treat disease
- Determine the cause of shedding or thinning
- Reverse genetic hair loss
- Cure dandruff, dermatitis, infection, or inflammation
- Regrow hair on its own
- Replace evaluation or treatment by a qualified medical professional

**Replace the key point with:**

> Position the service accurately. Language such as “This service can support cosmetic scalp cleansing, comfort, and conditioning” is responsible. Language that promises treatment, diagnosis, or hair regrowth is not. The service can provide meaningful cosmetic and relaxation benefits without being presented as a medical solution.

### H. Section 1.6 licensing

Replace the full section body with:

> Before offering a head spa service, verify what your existing license or authorization permits in the state and location where you practice. Review rules for cleansing and shampooing, scalp and body massage, exfoliation, cosmetic product application, devices, water systems, sanitation, establishment licensing, and the body areas you may legally treat.
>
> Do not assume every head spa service is permitted under every beauty license. The exact combination of services matters. This course provides professional education and best practices; it does not override law, create a license, or expand your legal scope.

### I. Section 1.7 practitioner insight

Replace the first paragraph with:

> Most clients arrive because the service looks relaxing, someone recommended it, or they are curious about their scalp. You are shaping their expectations in real time. If you position yourself as someone who diagnoses or fixes medical conditions, clients will expect results you cannot responsibly promise. If you position yourself as someone who observes carefully, works within scope, customizes the cosmetic service, and refers appropriately, you build trust without overclaiming.

Replace the Cadence note with:

> “Your language teaches the client what this service is. They do not need certainty you cannot support. They need clear observation, responsible expectations, and confidence that you will know when to proceed, when to adjust, and when to refer.”

### J. Section 1.8 scope mistake

Replace only the first mistake card:

**Title:**

> Blurring observation with diagnosis

**Text:**

> One of the most consequential mistakes is turning a visible finding into a medical conclusion. Recognizing patterns can inform your cosmetic service. Diagnosis does not belong to this role. Know the rules that apply to your license and keep your language on the correct side of that boundary.

All other mistake cards may remain unchanged.

### K. Module-open Cadence greeting

Replace with:

> Module 1 establishes the professional boundary for everything that follows. Read the scope and client-language sections carefully. Strong practitioners do not sound more certain than the evidence or their license allows.

### L. Cadence guide system

Replace `MODULE_GUIDE_SYSTEMS[1]` with:

> You are Cadence, AIMT’s curriculum-grounded guide for the Head Spa Certification Course. Your guidance was built from the instructor’s nearly two decades of hands-on experience; you do not claim that experience as your own or present yourself as a human practitioner. The student is in Module 1: the role of the head spa technician, observation versus diagnosis, safe client language, realistic service limitations, licensing variation, and referral judgment. Respond directly to the student’s actual question using only the course’s professional and cosmetic scope. Do not diagnose, prescribe, interpret visible findings as medical fact, or imply that AIMT certification expands legal scope. When laws or license permissions are involved, tell the student to verify the rules that apply to their license and jurisdiction. Use 3–5 concise sentences and no bullet points.

### M. Suggested Cadence prompts

Use:

- `How do I describe what I see without diagnosing?`
- `When should I pause or refer a client?`
- `How do I verify whether a service is within my license?`

### N. Checkpoint 1 copy

**Label:**

> Apply the boundary

**Question:**

> A client says her hair has been shedding heavily for two months and asks whether she has alopecia. Explain exactly how you would respond. Include what you can safely say, what you must avoid saying, and the professional next step you would recommend.

**Placeholder:**

> Write the response you would give the client, then explain the next step…

**Submit-button accessible name:**

> Send response to Cadence

**Voice-button accessible name:**

> Speak your answer

**Network error:**

> Cadence couldn’t evaluate your response. Check your connection and try again.

### O. Checkpoint 2 copy

**Label:**

> Demonstrate the role

**Question:**

> Explain the difference between a head spa technician and someone who only knows the service steps. Give one specific example of how that difference changes the client’s experience, safety, or trust.

**Placeholder:**

> Explain the difference and give one real service example…

**Submit-button accessible name:**

> Send response to Cadence

**Voice-button accessible name:**

> Speak your answer

**Network error:**

> Cadence couldn’t evaluate your response. Check your connection and try again.

### P. Completion card

**Eyebrow:**

> Module 1 complete

**Title:**

> Professional boundaries demonstrated.

**Competency line:**

> You demonstrated observation-first language, scope and referral judgment, and an understanding of the technician’s responsibility for the complete client experience.

**Next-up label:**

> Up next — Module 2

**Next-up text:**

> With the professional boundary established, Module 2 moves into the client experience before the scalp service begins: intake, first contact, communication, and the opening moments that establish trust.

**Primary button:**

> Start Module 2 →

**Secondary button:**

> Back to course

---

## Checkpoint specification

Both existing checkpoints remain required. Do not add a third required checkpoint.

### Checkpoint 1 — `m1cp1`

Use the exact student-facing question listed in Final Replacement Copy. The exact same string must be supplied to Cadence for evaluation.

#### Competency evaluated

The student can respond to a hair-loss concern without diagnosing and can direct the client toward an appropriate professional next step.

#### Required elements for a pass

A passing response must demonstrate all of the following:

1. The student does not confirm, deny, or name alopecia as the client’s diagnosis.
2. The student uses observation-based language or clearly explains that they can only describe what is visible.
3. The student avoids claiming that a head spa can diagnose, treat, reverse, or regrow hair.
4. The student recommends evaluation by a dermatologist or another appropriately qualified medical professional because the shedding is heavy, persistent, and concerning.
5. The response is written in a way that could reasonably be communicated to a real client.

The student does not need to use an exact script or the words “dermatologist” and “diagnosis” if the same professional meaning is clearly demonstrated.

#### Immediate safety corrections

Cadence must immediately correct statements that:

- diagnose alopecia or another condition;
- attribute the shedding to a specific medical cause;
- prescribe medicated or prescription treatment;
- promise that a head spa service will stop shedding or regrow hair;
- advise the client to ignore or delay appropriate medical evaluation.

#### Revision behavior

When the response is almost complete, Cadence should identify only the most important missing element and ask one focused follow-up.

Examples:

- The student avoids diagnosis but gives no next step: ask who should evaluate persistent heavy shedding.
- The student recommends referral but uses diagnostic language: ask them to rewrite the client-facing sentence using observation language.
- The student gives safe language but implies the service can treat the cause: correct the claim and ask them to restate the service limitation.

### Checkpoint 2 — `m1cp2`

Use the exact student-facing question listed in Final Replacement Copy. The exact same string must be supplied to Cadence for evaluation.

#### Competency evaluated

The student understands that a head spa technician leads the complete service through judgment, communication, observation, adaptation, scope protection, and client care—not merely physical sequence execution.

#### Required elements for a pass

A passing response must demonstrate:

1. A meaningful distinction between leading the complete experience and simply following steps.
2. At least one practitioner responsibility beyond physical technique, such as observation, communication, pacing, adaptation, comfort, scope, safety, or referral.
3. One specific example of how that difference affects the client’s experience, safety, or trust.

The student does not need to list every responsibility.

#### Revision behavior

If one part is missing, Cadence should ask only for that part.

Examples:

- Clear distinction but no example: ask for one moment in a real service where leadership changes the outcome.
- Example provided but no underlying distinction: ask what the practitioner is deciding or observing beyond the sequence.
- Generic statement such as “one is more professional”: ask what the professional is actually doing differently.

### Shared grading rules for both checkpoints

Cadence should:

- evaluate meaning rather than exact vocabulary;
- accept concise answers that demonstrate the full competency;
- ignore minor grammar and spelling errors;
- avoid generic praise;
- reference one specific part of the student’s answer;
- explain why the demonstrated reasoning matters in practice;
- return one focused revision request when incomplete;
- pass the checkpoint as soon as the required competency is present.

The evaluator must continue returning the existing valid JSON contract. Do not change stored checkpoint IDs or previously passed state.

---

## Approved interactions

### One ungraded practice interaction: “Where is the line?”

**Placement:** After Section 1.4 and before Section 1.5.

**Purpose:** Give the student a low-stakes opportunity to distinguish observation-based professional language from diagnosis, prescription, or unsupported causation before the required checkpoints.

**Heading:**

> Where is the line?

**Instruction:**

> Read each statement and decide whether it is professional observation or outside scope.

Present one statement at a time or as four accessible cards. For each, the student chooses:

- `Professional observation`
- `Outside scope`

#### Scenario 1

> “I’m seeing redness in this area. I would avoid aggressive exfoliation here and explain when medical evaluation would be appropriate.”

**Correct:** Professional observation

**Feedback:**

> This describes what is visible, adjusts the cosmetic service, and recognizes when referral may be appropriate without naming a condition.

#### Scenario 2

> “This is seborrheic dermatitis. You should use a medicated shampoo twice a week.”

**Correct:** Outside scope

**Feedback:**

> This names a diagnosis and directs treatment. A head spa technician may describe visible findings and recommend medical evaluation, but should not diagnose or prescribe.

#### Scenario 3

> “I can document the flaking I see, adjust today’s service, and explain that appearance alone cannot determine the cause.”

**Correct:** Professional observation

**Feedback:**

> This keeps the practitioner grounded in observation and service adjustment without presenting a medical conclusion.

#### Scenario 4

> “Your follicles are clogged, and that is why your hair is thinning.”

**Correct:** Outside scope

**Feedback:**

> This presents an unverified cause as fact. The practitioner may document visible buildup or thinning, but cannot determine the medical cause from appearance alone.

#### Completion message

> Good professional language is specific about what is visible and restrained about what it cannot establish.

#### Interaction rules

- Ungraded.
- No effect on checkpoint state, module completion, progress, or certification.
- No Supabase or persistent progress write is required.
- The student may change answers and repeat the interaction.
- Immediate feedback must explain the boundary, not only say correct or incorrect.
- Buttons must be real keyboard-accessible controls.
- Selected, correct, and revision states must not rely on color alone.
- Review Mode may exercise the interaction normally because it does not affect progress.

Do not add additional interactions to Module 1 in this implementation.

---

## Cadence behavior

Cadence’s role in Module 1 is to strengthen professional judgment and language, not to serve as a diagnostic assistant.

Cadence should:

- keep every answer grounded in cosmetic head spa practice;
- distinguish observation from diagnosis;
- avoid naming a likely condition based on symptoms or images;
- avoid prescribing products, medications, or treatment protocols;
- recommend verification of state and license rules when legal scope is asked;
- recommend appropriate medical evaluation when findings are new, severe, persistent, painful, spreading, rapidly changing, or otherwise concerning;
- respond in a warm, direct, professional tone;
- use one practical example when it improves clarity;
- correct safety-critical misinformation immediately;
- avoid implying that AI, microscopy, scanners, or photographs can establish a medical diagnosis;
- avoid saying that certification grants permission to practice.

Cadence may explain course concepts. She should not answer by merely repeating “check your local laws” when the student is asking about the course’s general professional standard. She should explain the standard first, then identify where local verification is necessary.

---

## Acceptance criteria

Module 1 is approved only when all of the following are true:

### Naming and identity

- The student-facing course name is **Head Spa Certification Course**.
- `M1.system` no longer says `HeadSpa Mastery`.
- Cadence does not claim personal work experience.
- Module 1 remains student-facing `Module 1`.
- Technical IDs and route paths remain unchanged.

### Curriculum and scope

- The term “head spa technician” is visibly explained as a role descriptor, not a state license.
- Universal “within scope” claims are replaced with license-dependent language.
- The module explicitly states that AIMT certification does not expand legal scope.
- Hair-growth support is not presented as a head spa outcome.
- Massage is framed around relaxation and sensory experience rather than a promised clinical circulation outcome.
- Flaking language does not suggest a named diagnosis.
- Referral guidance includes new or heavy shedding and visibly concerning findings.
- The course does not diagnose, prescribe, claim treatment, or promise regrowth.

### Checkpoints

- The displayed and evaluated question strings match exactly for both checkpoints.
- Both existing checkpoint IDs remain unchanged.
- Previously passed checkpoint states remain valid.
- Strong applied answers pass.
- Partial answers receive one focused revision request.
- Grammar, spelling, concise wording, or non-native English do not unfairly cause failure.
- Diagnostic, prescriptive, treatment, or regrowth claims are immediately corrected.
- The network error message is clear and actionable.
- Review Mode test submissions remain unsaved.

### Interaction

- “Where is the line?” appears in the approved location.
- All four scenarios use the approved wording and feedback.
- The interaction is ungraded and does not write completion state.
- It works by mouse, touch, and keyboard.
- Feedback and selected states are understandable without color alone.
- It causes no mobile overflow.

### Accessibility

- Both voice buttons have accessible names.
- Both submit buttons have accessible names.
- Feedback/status regions use appropriate live-region behavior.
- Shift+Enter still creates a new line.
- Enter submission behavior remains consistent with the course.
- Focus is restored appropriately after errors or revision requests.

### Completion and regression

- The completion card names the demonstrated competencies.
- Module 2 unlocks only after both required checkpoints pass in normal mode.
- Module 2 content is unchanged.
- Welcome Module behavior is unchanged.
- Review Mode remains intact.
- Authentication, entitlements, payments, progress sync, and certificate logic are unchanged.
- No duplicate IDs, broken HTML, JavaScript errors, or mobile overflow are introduced.

---

## Guided completion structure

### Estimated learning time

**15–20 minutes** for an attentive read and the ungraded practice interaction.

The two required checkpoints may add approximately **8–15 minutes**, depending on reflection and revision needs.

These remain planning estimates until measured with real students.

### Estimated hands-on or application time

**10 minutes** of spoken or written client-language rehearsal.

No physical head spa technique is required for this module.

### Competency demonstrated

The student can:

- use observation-first client language;
- avoid diagnosis and unsupported claims;
- identify when referral is appropriate;
- explain the professional responsibilities that exist beyond service steps.

### Suggested practice or application task

Ask the student to write and speak a 30-second response to each of these:

1. A client asks whether visible flaking is dermatitis.
2. A client asks whether a head spa will regrow thinning hair.
3. A client reports new, heavy shedding.

The practice is complete when the response:

- describes only what can be observed;
- explains the service limitation;
- gives the appropriate next step;
- sounds natural enough to use with a real client.

This is guided practice, not a certification checkpoint.

### Earlier concepts to revisit

- Welcome Module: led service versus performed service.
- Welcome Module: observation comes before assumption.
- Welcome Module: certification does not replace licensure or expand scope.

### Guided Completion Path position

**Foundation block — immediately after the Welcome Module.**

The Guided Completion Path should frame this module as the professional-boundary prerequisite for all later assessment, condition, equipment, and service-protocol content.

Do not implement the Guided Completion Path interface in this module task.

---

## Listen Mode notes

### Narration suitability

Module 1 is a strong candidate for optional audio narration because it is primarily conceptual and client-language based.

### Approximate narration length

Approximately **8–10 minutes** for the curriculum body at a calm instructional pace.

Do not include checkpoint answers in the narration.

### Visual-review cues

Insert a brief audio cue before:

- the safe-language versus outside-scope scripts;
- the license-dependent versus never-authorized scope cards;
- the can-support versus cannot-do service limitations.

Suggested cue:

> “This section includes a side-by-side reference you may want to review on screen later.”

### Content that should remain video-only

None of the current Module 1 content requires a physical demonstration video.

A short module-introduction video may still be useful, but full narration should remain optional.

### Listen Mode completion rules

Listening must not:

- pass either checkpoint;
- mark the module complete;
- replace the ungraded practice interaction;
- replace the student’s responsibility to verify local scope;
- encourage screen interaction while driving.

Do not implement Listen Mode in this module task.

---

## Implementation notes

1. Apply only the approved replacements and additions in this specification.
2. Preserve all existing technical IDs and stored checkpoint state.
3. Do not add or remove required checkpoints.
4. Use the exact displayed checkpoint question as the evaluator question.
5. Prefer a Module-1-specific evaluator configuration rather than changing grading behavior for every module.
6. Reuse the accessibility and checkpoint patterns already approved and implemented for the Welcome Module where appropriate.
7. Reuse existing visual tokens and interaction components. Do not introduce a new design system.
8. Do not alter unrelated module content while replacing shared old-name text.
9. Do not remove dead code during this implementation.
10. Do not implement permanent Cadence threads, Guided Completion Path UI, Listen Mode, Module 12, or certificate changes.
11. Update `docs/course-audit/implementation-log.md` after implementation.
12. Set the Module 1 status to `Implemented — awaiting manual QA` only after the acceptance criteria have been tested.
13. Authoritative audit basis: medical diagnosis of hair loss belongs with a qualified medical professional, and head-spa permissions vary by jurisdiction and license type. The production copy should therefore avoid universal scope claims and unsupported hair-growth promises.

