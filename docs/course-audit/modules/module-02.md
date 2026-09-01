# Module 2 — Approved Audit Specification

> **⚠ Partially superseded (2026-08-31).** Module 8 later established the
> course's real governing service doctrine — intake determines the plan,
> preparation removes uncertainty, the service executes the plan — which
> conflicted with this document's repeated-permission-before-touch
> framing. Module 2 was rebuilt to align with it. See
> `module-02-curriculum-rebuild-2026-08.md` for what changed and exactly
> which sections below are superseded vs. still accurate.

**Course:** AIMT Head Spa Certification Course  
**Module:** 2  
**Approved module title:** Welcoming Your Client  
**Source reviewed:** `module-02-source.md`  
**Status:** Approved for controlled implementation  
**Production source of truth:** `headspa-mastery.html`

This document is the approved implementation specification for Module 2. It does not authorize changes to authentication, entitlements, payments, database policies, certificate issuance, unrelated modules, the Guided Completion Path interface, Listen Mode, persistent Cadence threads, or the future Module 12 Final Exam.

---

## Approved outcomes

By the end of Module 2, the student should be able to:

1. Explain why the arrival and transition into a head spa service influence comfort, trust, and the client’s ability to settle into the experience.
2. Review intake information before the service and confirm relevant changes directly with the client.
3. Give clear, respectful changing and preparation instructions without asking the client to undress more than the service requires.
4. Protect privacy, draping, choice, and client autonomy throughout the pre-service transition.
5. Offer tea, scent, and other hospitality rituals as optional experience elements rather than physiological treatments or universal requirements.
6. Obtain explicit consent before introducing touch.
7. Introduce aromatherapy or fragrance without making health claims and provide a fragrance-free path.
8. Guide a stressed or late client without shaming, rushing, or transferring schedule pressure onto them.
9. Use concise language that helps the client feel informed without overwhelming them.
10. Deliver a repeatable arrival framework while adapting respectfully to the individual client.

Module 2 should teach a professional arrival framework. It should not claim to medically regulate the nervous system, create subconscious trust, guarantee deeper relaxation, or predict rebooking behavior.

---

## Keep unchanged

Keep the following elements and concepts:

- The approved student-facing title: **Module 2 — Welcoming Your Client**.
- The core hero idea: the experience begins before hands-on service.
- The arrival-sequence structure.
- The emphasis on reviewing intake before the client enters the treatment space.
- Clear preparation instructions.
- A hospitality transition as part of the experience.
- Aromatherapy or scent selection as an optional sensory element.
- The importance of first contact and tone-setting.
- The distinction between guiding and over-explaining.
- The “What breaks the moment?” practice concept.
- The student-written aromatherapy introduction exercise with Cadence feedback.
- The consistency section, revised to preserve adaptability and client choice.
- One required open-response checkpoint.
- Existing checkpoint ID `m2cp1`.
- Technical module ID `2`, `module2Wrap`, `M2`, `m2Complete`, state keys, progress identifiers, and the Module 3 unlock relationship.
- Existing students who have already passed `m2cp1` must remain passed.
- Module 3 remains the next module.

The current feeling slider should not remain as an interactive requirement. Its strongest teaching point should be retained as a concise static contrast, as specified below.

---

## Required corrections

### 1. Correct the visible course name and Cadence identity

Replace Module-2-specific references to:

- `HeadSpa Mastery`
- `Headspa Mastery`
- `Head Spa Mastery`

with:

**Head Spa Certification Course**

Cadence must not claim that she personally has nearly two decades of industry experience. She may accurately state that she is AIMT’s curriculum-grounded guide and that her guidance was built from the instructor’s nearly two decades of hands-on experience.

Do not rename technical routes, filenames, API values, entitlement identifiers, storage keys, progress identifiers, or database values.

### 2. Remove unsupported physiological and behavioral claims

The current module repeatedly presents subjective experience language as physiological fact.

Remove or replace claims that tea, scent, touch, or the arrival sequence:

- lowers nervous-system arousal;
- physiologically calms the client;
- heightens the sense of smell;
- creates subconscious trust;
- causes the body to “follow”;
- makes touch “land” differently;
- guarantees a transformed experience;
- causes clients to rebook;
- establishes a predictable emotional response.

The module may responsibly teach that thoughtful pacing, clear communication, privacy, consent, and client choice can reduce uncertainty and help the experience feel calmer and more organized.

### 3. Require consent before first touch

The current aromatherapy sequence instructs the practitioner to place a hand on the client’s shoulder before the client closes their eyes and keep it there throughout the selection.

This must be replaced with explicit permission before touch.

The client must be able to:

- accept or decline the shoulder contact;
- keep their eyes open;
- decline aromatherapy;
- choose a fragrance-free service;
- change their mind without pressure.

Touch should never be introduced as a method of creating “subconscious trust.”

### 4. Protect privacy and choice during changing

The current copy instructs guests to remove top layers, a bra, and jewelry as though this is universal and required.

Replace this with a consent- and service-dependent preparation standard:

- Ask the client to remove only what is necessary for the legally permitted service being delivered.
- Explain what they may leave on.
- Explain how they will remain covered.
- Provide privacy while changing.
- Offer an alternative when the client does not wish to remove a garment.
- Do not perform body-area massage or exposure beyond the practitioner’s license, training, and the client’s consent.

The course must not imply that full shoulder, neck, or upper-back access is permitted for every license type.

### 5. Reframe tea as optional hospitality

Tea may remain as an example of a hospitality ritual, but it must not be described as a physiological intervention.

The course should require:

- an optional water or no-beverage path;
- clear ingredient information when herbal blends are offered;
- attention to known allergies, sensitivities, caffeine preferences, and client comfort;
- safe serving temperature;
- no health or treatment claims.

The ritual is a transition and hospitality choice—not therapy.

### 6. Reframe aromatherapy as optional scent preference

Aromatherapy should be described as an optional fragrance or sensory choice.

The course should require:

- sensitivity review;
- a fragrance-free option;
- no claim that the scent treats stress, anxiety, sleep, pain, inflammation, or another health condition;
- product use according to manufacturer directions;
- no direct skin application unless the product, license, service protocol, and client consent permit it.

### 7. Replace rigid ritual language with a consistent framework

The current module says the five moments occur “in this order, every time” and later states that nothing in the module is optional.

That conflicts with consent, allergies, accessibility, client preference, scheduling realities, and license variation.

Teach this distinction:

- **Standards remain consistent:** preparation, privacy, communication, consent, and an intentional transition.
- **Rituals may adapt:** tea, fragrance, changing, first-touch method, and exact pacing.

Safety, consent, and client choice always override a preferred ritual.

### 8. Repair section numbering

Label the five arrival-sequence steps as Sections **2.1–2.5** so the student-facing sequence flows naturally into 2.6 and 2.7.

Do not change technical IDs to accomplish this.

### 9. Align the displayed and evaluated checkpoint question

The exact checkpoint question shown to the student must be the exact question supplied to Cadence.

Do not preserve a shorter evaluator-only paraphrase.

### 10. Replace the regex-based grading exception

Module 2’s current special grading guidance is triggered by matching a phrase in the question.

Replace that fragile behavior with a Module-2/checkpoint-specific evaluator configuration for `m2cp1`.

Do not change the behavior of other modules.

### 11. Add an explicit checkpoint rubric

Cadence should evaluate applied reasoning rather than a rigid ritual checklist.

Do not fail a valid response because of:

- grammar;
- spelling;
- informal wording;
- concise wording;
- non-native English;
- a safe alternative sequence;
- omitting tea or aromatherapy when the student explains an appropriate alternative.

Safety-critical omissions or misinformation must be corrected.

When the answer is incomplete, Cadence should identify the single most important missing element and invite one focused revision.

### 12. Make the arrival timeline accessible

Replace non-interactive `<div onclick>` accordion controls with accessible buttons.

Each trigger must include:

- keyboard operation;
- `aria-expanded`;
- `aria-controls`;
- a clear accessible name;
- a persistent visible step label;
- a reduced-motion behavior.

Opening one step may continue to close the previously opened step.

### 13. Make the quiz retryable and self-explanatory

The student must be able to change their selection and review every explanation.

Do not permanently disable all options after the first answer.

Correctness must not rely on color or opacity alone. Add visible text such as:

- `Best response`
- `Try again`

The feedback region must be announced appropriately.

### 14. Strengthen and make the script builder accessible

The script builder should evaluate whether the student:

- explains the optional scent experience clearly;
- offers a fragrance-free choice;
- avoids health claims;
- does not require eye closure;
- asks permission before touch;
- keeps the language calm and concise.

Add an accessible label to the textarea and button, an appropriate live region for feedback, and a clear network-error message.

The exercise remains ungraded and non-persistent.

### 15. Replace the feeling slider with a static comparison

The current slider adds interaction without requiring meaningful decision-making and contains unsupported claims.

Replace it with a concise static contrast titled:

**Same service. Different beginning.**

Compare a rushed, unclear arrival with a guided, consent-based arrival.

This change reduces unnecessary interaction density and removes an avoidable Listen Mode blocker.

### 16. Improve checkpoint and module accessibility

For `m2cp1`:

- Add `aria-label="Speak your answer"` to the voice button.
- Add `aria-label="Send response to Cadence"` to the submit button.
- Use an appropriate live region for thinking, revision, error, accepted, and feedback states.
- Preserve Enter-to-submit and Shift+Enter-for-new-line behavior.

For the slider replacement, quiz, timeline, and script builder:

- use semantic controls;
- preserve visible focus;
- do not rely on color alone;
- prevent mobile overflow;
- respect reduced-motion preferences.

### 17. Name the demonstrated competency at completion

The completion card should identify that the student demonstrated:

- an organized arrival sequence;
- privacy, choice, and consent;
- calm client guidance under time pressure.

### 18. Standardize Module 2 error messages

Use clear, feature-specific error text that tells the student what failed and that they may try again.

Do not leave the vague script-builder message:

> Something went wrong — try again.

### 19. Preserve progress and system integrity

Implementation must not:

- invalidate a previously passed `m2cp1`;
- add another required checkpoint;
- make the timeline, quiz, script builder, or static comparison completion-gating;
- modify Module 1 or Module 3;
- alter authentication, entitlements, payments, progress sync, certificate logic, or Review Mode;
- implement Listen Mode, Guided Completion Path UI, persistent Cadence threads, or Module 12.

---

## Final replacement copy

Only the copy and structures listed below are approved for replacement or addition. Module 2 copy not addressed here may remain when it does not conflict with these corrections.

### A. Module identity

**Home-screen title:**

> Module 2 — Welcoming Your Client

**Home-screen subtitle:**

> Arrival, consent, comfort, and first contact

**Hero eyebrow:**

> Module 2 · Welcoming Your Client

**Hero title:**

> The experience begins  
> before your hands do.

**Hero description:**

> The arrival shapes whether a client feels rushed, uncertain, or guided. The goal is a calm, clear transition into the service—before hands-on work begins.

### B. Arrival-sequence introduction

**Eyebrow:**

> The arrival sequence

**Title:**

> Five moments. One adaptable framework.

**Body:**

> Open each step to understand what it protects: preparation, privacy, choice, consent, and a clear transition into the service.

**Interaction hint:**

> Select each step to expand

### C. Section 2.1 — Intake review

**Title:**

> Review before they arrive. Confirm before you begin.

**Subtitle:**

> Preparation without assumption

**Copy:**

> The intake form is preparation, not a substitute for conversation. Review it before the client enters the treatment space so you can identify sensitivities, discomfort, relevant health or service-history notes, and anything that may change your approach.
>
> At the appointment, briefly confirm whether anything has changed and clarify any answer that affects safety, products, positioning, scent, touch, or service selection. A prepared practitioner is not guessing in front of the client—but is still willing to ask.

**Callout:**

> Intake information should guide a professional conversation. It should never be used to diagnose a condition or override what the client tells you in person.

### D. Section 2.2 — Private preparation

**Title:**

> Explain what is necessary. Preserve choice and coverage.

**Subtitle:**

> Changing, privacy, and comfort

**Copy:**

> Preparation depends on the service being performed, the practitioner’s legal scope, and the client’s comfort. Explain what clothing or jewelry may interfere with the service, what the client may leave on, how they will remain covered, and where their belongings will be placed.
>
> Ask the client to remove only what is necessary. Provide privacy while they change and offer an alternative when they prefer to keep a garment on. A client should never feel pressured to expose more of the body than the service requires.

**Callout title:**

> A thoughtful detail

**Callout copy:**

> A robe, wrap, slippers, or another comfort item can make the transition feel considered. The item itself is not the standard. The standard is that it is clean, appropriate, clearly explained, and optional.

### E. Section 2.3 — Hospitality transition

**Title:**

> Create a pause without making a health claim.

**Subtitle:**

> Tea, water, or another optional ritual

**Copy:**

> An optional beverage can create a natural pause between arrival and service. At Atrium, tea is part of that hospitality ritual. In another setting, water or a different simple transition may be more appropriate.
>
> Offer the choice without presenting it as treatment. Provide ingredient information for herbal blends, account for known allergies or sensitivities, offer a no-beverage option, and serve hot drinks at a safe temperature. The purpose is hospitality and pacing—not a promise to regulate the body or treat stress.

### F. Section 2.4 — Scent preference and first contact

**Title:**

> Choice first. Consent before touch.

**Subtitle:**

> Optional scent and the first physical introduction

**Copy:**

> Scent can be offered as an optional sensory element. Review sensitivities first and make the fragrance-free option as easy to choose as any scented option.
>
> Before touching the client, explain what you would like to do and ask permission. The client may decline the touch, keep their eyes open, skip the scent selection, or change their mind. Consent is part of the experience—not an interruption to it.

**Approved example script:**

> “I can offer a few scent options, or we can keep your service fragrance-free. Would you like to sample them? You’re welcome to close your eyes while I guide you through each one, but you do not have to. Would it be okay if I rest a hand lightly on your shoulder while you choose?”

**Callout:**

> A calm first touch begins with permission. Do not use touch as a technique for creating subconscious trust.

### G. Section 2.5 — Set expectations

**Title:**

> Guide the client without briefing them on every step.

**Subtitle:**

> Clear, concise orientation

**Copy:**

> The client should know what they need to do, what will happen next, and how to communicate discomfort or a change of mind. They do not need a long explanation of the entire protocol.
>
> One clear orientation is often enough: “I’ll guide you as we go. You can let me know at any point if you want the pressure, temperature, position, scent, or any part of the service adjusted.”

### H. “What breaks the moment?” interaction

**Eyebrow:**

> Test your judgment

**Title:**

> What breaks the moment?

**Body:**

> Choose the response that does the most damage to trust at the beginning of the service. You may change your answer and review the reasoning.

Use these four options:

1. `The tea takes an extra minute to prepare.`
2. `The slippers you normally offer are unavailable.`
3. `You rush the client through changing because the previous appointment ran long.`
4. `The client declines every scent option.`

**Best response:** Option 3

**Feedback for option 1:**

> An extra minute is usually manageable when you communicate calmly. The delay matters less than how the client is treated during it.

**Feedback for option 2:**

> A missing comfort item is a minor variation. The professional standard is cleanliness, clarity, and care—not a specific accessory.

**Feedback for option 3:**

> Best response. Rushing transfers your scheduling pressure onto the client and can compromise privacy, consent, and trust before the service begins.

**Feedback for option 4:**

> Declining scent is not a problem to solve. A fragrance-free service is a valid client choice and should be supported without pressure.

**Completion message after all explanations have been viewed:**

> The strongest arrival sequence protects the client’s experience even when the preferred ritual changes.

### I. Aromatherapy script builder

**Eyebrow:**

> Your voice

**Title:**

> Introduce scent without assuming consent.

**Body:**

> Read the reference version. Then write your own concise introduction. Preserve the choice, the fragrance-free option, and permission before touch.

**Reference-card label:**

> Reference script

**Reference script:**

> “Before we begin, I can offer a few scent options, or we can keep the service fragrance-free. Would you like to sample them? You may close your eyes while I guide you through each one, but you do not have to. Before I touch your shoulder, I’ll ask your permission.”

**Student-input label:**

> Write your version

**Placeholder:**

> Use your own voice while preserving choice, consent, and a fragrance-free option…

**Button:**

> Get Cadence’s feedback →

**Pending state:**

> Cadence is reviewing your script…

**Network error:**

> Cadence couldn’t review your script. Check your connection and try again.

### J. Static replacement for the feeling slider

Remove the interactive range input and all five `FEELING_STATES` outputs from Module 2’s student experience.

Replace them with:

**Eyebrow:**

> Practitioner insight

**Title:**

> Same service. Different beginning.

**Introduction:**

> The technique may be identical. The arrival can still change how organized, safe, and personal the service feels.

**Contrast 1 heading:**

> Rushed and unclear

**Contrast 1 copy:**

> The client receives incomplete changing instructions, senses that the practitioner is behind schedule, and is touched before expectations or consent are clear. They begin the service managing uncertainty that the practitioner created.

**Contrast 2 heading:**

> Guided and consent-based

**Contrast 2 copy:**

> The practitioner reviews what matters, explains the transition, protects privacy, offers real choices, asks before touch, and gives one clear orientation. The client knows what is happening and how to speak up.

**Closing line:**

> The goal is not to manufacture a reaction. It is to remove preventable uncertainty.

### K. Section 2.6 — What goes wrong

**Eyebrow:**

> 2.6 — What goes wrong

**Title:**

> Mistakes that weaken the beginning.

**Body:**

> These problems appear when a practitioner treats the arrival as informal instead of intentional.

Use these five cards:

#### Rushing the beginning

> Schedule pressure belongs to the business, not the client. Rushing changing, intake confirmation, or consent can make the service feel transactional and may compromise professional boundaries.

#### Giving unclear instructions

> When a client does not know where to go, what to remove, what remains covered, or what happens next, they must manage uncertainty that clear guidance could have prevented.

#### Assuming consent

> Prior visits, a signed intake form, closed eyes, or silence do not replace permission for a new touch or service choice. Explain and ask.

#### Treating optional rituals as mandatory

> Tea, fragrance, changing, and shoulder contact must adapt to allergies, comfort, accessibility, scope, and preference. Consistency does not mean forcing the same ritual on every client.

#### Over-explaining

> Clients should feel informed, not briefed on every technical step. Give the information they need to participate, consent, and relax into the experience.

**Real-life example title:**

> What this looks like in practice

**Weak response:**

> “Go ahead and change. You can put your things anywhere.”

**Strong response:**

> “I’ll give you privacy to change. Remove only the items we discussed, and you may keep anything on that makes you more comfortable. Place your belongings here, and I’ll be right outside when you’re ready.”

**Closing line:**

> Clarity protects comfort and professional boundaries before the service begins.

### L. Section 2.7 — Consistency

**Eyebrow:**

> 2.7 — Consistency

**Title:**

> Repeat the standard. Adapt the ritual.

**Body:**

> A high-level arrival should be repeatable without becoming rigid. Every client should receive preparation, privacy, clear communication, meaningful choice, consent before touch, and a calm transition into the service.
>
> Tea, fragrance, changing instructions, and the exact first-contact method may vary. The framework remains consistent while the experience adapts to the client, the service, and the practitioner’s legal scope.

**Info-card title:**

> The question to ask after every service

**Info-card copy:**

> Did this client receive the same standard of clarity, privacy, choice, consent, and professional guidance as the client before them? If not, identify which standard became inconsistent. Do not judge consistency by whether every client accepted the same ritual.

### M. Module-open Cadence greeting

Replace with:

> Module 2 is where professional standards become visible to the client. Pay close attention to privacy, choice, and consent—the arrival should feel organized without becoming rigid or performative.

### N. Cadence guide system

Replace `MODULE_GUIDE_SYSTEMS[2]` with:

> You are Cadence, AIMT’s curriculum-grounded guide for the Head Spa Certification Course. Your guidance was built from the instructor’s nearly two decades of hands-on experience; you do not claim that experience as your own or present yourself as a human practitioner. The student is in Module 2: intake review, private preparation, optional hospitality, scent preference, consent before touch, concise orientation, and a repeatable but adaptable arrival framework. Keep guidance grounded in professional client experience rather than unsupported physiological or psychological claims. Do not say that tea, scent, or touch regulates the nervous system, creates subconscious trust, treats stress, guarantees relaxation, or causes rebooking. Reinforce client choice, privacy, fragrance-free options, legal scope, and explicit permission before touch. Use 3–5 concise sentences and no bullet points.

### O. Suggested Cadence prompts

Use:

- `How do I ask permission before first touch?`
- `What should changing instructions include?`
- `How do I keep the arrival consistent without making it rigid?`

### P. Script-evaluation system

Replace the independent `evaluateScript()` prompt with a Module-2-specific prompt that evaluates the approved student task.

It must check whether the script:

1. clearly introduces the optional scent experience;
2. offers a fragrance-free choice;
3. avoids medical or nervous-system claims;
4. does not require eye closure;
5. asks permission before touch;
6. stays concise and natural.

Cadence should:

- reference one specific strength;
- identify one focused correction when needed;
- avoid pass/fail language;
- use 2–3 concise sentences;
- not write to checkpoint or progress state.

### Q. Checkpoint copy

**Label:**

> Apply the arrival framework

**Question:**

> A new client arrives visibly stressed after rushing and apologizes for being two minutes late. Walk through the first five minutes in the order you would handle them. Explain how you would avoid transferring time pressure to the client, what you would confirm from the intake, how you would protect privacy and choice during preparation, how you would introduce any optional beverage or scent, when you would ask permission for first touch, and what you are trying to accomplish before the hands-on service begins.

The exact same string must be sent to Cadence.

**Placeholder:**

> Walk through the sequence and explain the purpose of each decision…

**Voice-button accessible name:**

> Speak your answer

**Submit-button accessible name:**

> Send response to Cadence

**Network error:**

> Cadence couldn’t evaluate your response. Check your connection and try again.

### R. Completion card

**Eyebrow:**

> Module 2 complete

**Title:**

> The arrival framework is yours.

**Competency line:**

> You demonstrated an organized pre-service sequence grounded in preparation, privacy, client choice, consent, and calm guidance under time pressure.

**Next-up label:**

> Up next — Module 3

**Next-up text:**

> Module 3 moves beneath the experience into the science of the hair and scalp. The goal is to understand what you are observing so later service decisions have a clear professional reason behind them.

**Primary button:**

> Start Module 3 →

**Secondary button:**

> Back to course

---

## Checkpoint specification

The existing checkpoint `m2cp1` remains the only completion-gating activity in Module 2.

### Competency evaluated

The student can adapt the arrival framework for a visibly stressed client while protecting preparation, privacy, choice, consent, and a calm transition into the service.

### Required elements for a pass

A passing response must demonstrate the following core competencies:

1. The practitioner does not shame the client or intensify the rush because of the two-minute delay.
2. The practitioner briefly confirms relevant intake information or changes before proceeding.
3. The practitioner gives clear preparation instructions that preserve privacy and do not require unnecessary undressing.
4. The practitioner presents beverage and scent as optional, or provides a reasonable alternative without treating the ritual as mandatory.
5. The practitioner obtains explicit permission before first touch.
6. The practitioner gives a concise orientation that helps the client understand what happens next and how to request an adjustment.
7. The response is sequenced and explains the purpose behind the major decisions.

A response does not need to reproduce the preferred Atrium sequence word for word.

Tea, scent, robe use, eye closure, and shoulder contact are not individually required when the student provides a safe, intentional alternative.

### Immediate corrections

Cadence must immediately correct a response that:

- touches the client without permission;
- pressures the client to remove clothing;
- presents silence, an intake form, closed eyes, or prior visits as consent;
- makes physiological, medical, or mental-health claims for tea or aromatherapy;
- treats a fragrance-free request as a problem;
- recommends ignoring an allergy or sensitivity;
- prioritizes the schedule over privacy or safe preparation.

### Revision behavior

When the response is incomplete, Cadence should identify only the most important missing element.

Examples:

- Strong sequence but no explicit touch consent: ask when and how permission would be obtained.
- Clear consent but vague preparation: ask what changing and privacy instructions the client would receive.
- Good steps but no rationale: ask what the practitioner is trying to protect before hands-on service.
- Rigid requirement for tea or scent: ask how the sequence would adapt if the client declined.

### Shared grading rules

Cadence should:

- evaluate applied judgment rather than keyword matching;
- accept safe variations in sequence;
- accept concise answers that demonstrate the full competency;
- ignore minor grammar and spelling errors;
- not penalize non-native English or natural spoken phrasing;
- reference one specific part of the student’s answer;
- avoid generic praise;
- give one focused revision request when incomplete;
- pass the checkpoint as soon as the required competency is demonstrated.

Preserve the existing evaluator JSON contract and stored checkpoint ID.

---

## Approved interactions

Module 2 may contain the following student interactions:

### 1. Accessible arrival-sequence accordion

This is a content-navigation interaction, not a graded activity.

Requirements:

- Five accessible accordion buttons labeled 2.1–2.5.
- Keyboard and screen-reader operable.
- Correct `aria-expanded` and `aria-controls`.
- One step may be open at a time.
- No progress write.
- No completion requirement.
- In Listen Mode, all five sections must be narratable without requiring the accordion to be opened.

### 2. “What breaks the moment?” judgment check

This is an ungraded practice interaction.

Requirements:

- Use the approved options and feedback.
- Student may change the answer.
- Student may view the explanation for every choice.
- Correctness is communicated with text and not color alone.
- No progress write.
- No completion requirement.
- Feedback uses a live region.
- Buttons remain keyboard accessible.

### 3. Aromatherapy introduction script

This is an ungraded applied communication exercise.

Requirements:

- Use the approved prompt and reference script.
- Cadence provides formative feedback only.
- No pass/fail status.
- No progress or completion write.
- The response is not persisted during this module implementation.
- Accessible textarea, button, pending state, feedback region, and error state.
- The student may revise and resubmit.

### Removed interaction

The feeling slider is not approved for continued implementation.

Replace it with the approved static comparison. Remove or leave unreachable only the Module-2-specific slider initialization code when it can be safely removed without affecting other modules. Do not perform unrelated cleanup.

No additional Module 2 interaction is approved in this task.

---

## Cadence behavior

Cadence’s Module 2 behavior should strengthen professional hospitality, consent, and client guidance.

Cadence should:

- distinguish a preferred service ritual from a universal requirement;
- treat tea, scent, eye closure, changing, and shoulder contact as optional or context dependent;
- explain that clear communication can reduce uncertainty without claiming a clinical nervous-system effect;
- require explicit permission before touch;
- protect fragrance-free choice;
- reinforce privacy and minimal necessary undressing;
- avoid diagnosing anxiety, stress conditions, sensory disorders, or medical contraindications;
- avoid product or scent treatment claims;
- avoid saying that a client “hands over control”;
- avoid language about subconscious manipulation;
- help the student produce natural client-facing scripts;
- explain the general professional standard before directing the student to verify license-specific rules;
- use a warm, concise, mentor-like tone.

Persistent Cadence conversation history is not part of this implementation. When that later system is built, Module 2 must reopen its own saved module-specific text thread rather than a single course-wide conversation.

---

## Acceptance criteria

Module 2 is approved only when all of the following are true.

### Naming and identity

- The course is named **Head Spa Certification Course** in Module-2-specific prompts.
- Cadence does not claim personal industry experience.
- Technical identifiers remain unchanged.
- Module 2 remains Module 2.
- Module 3 remains unchanged.

### Curriculum

- The five sequence steps are labeled 2.1–2.5.
- Intake is presented as preparation plus verbal confirmation.
- Changing instructions preserve privacy, coverage, and client choice.
- The course does not universally require bra or top-layer removal.
- Tea is optional hospitality, not a physiological treatment.
- Aromatherapy includes a fragrance-free path.
- Eye closure is optional.
- Explicit permission occurs before first touch.
- The module does not claim subconscious trust, nervous-system regulation, guaranteed transformation, or rebooking.
- Consistency is framed as a repeatable professional standard with adaptable rituals.

### Timeline

- All five accordion triggers are semantic controls.
- Keyboard and screen-reader operation works.
- `aria-expanded` updates correctly.
- Expanded content is associated with its trigger.
- Reduced-motion behavior is respected.
- Timeline content is available to future narration independent of visual expansion.

### Judgment check

- The student may change selections.
- Every option has explanatory feedback.
- Option 4 recognizes fragrance-free choice as valid.
- Correctness does not rely on color alone.
- No state is written to `APP_STATE`.
- No completion state is affected.

### Script builder

- The approved reference script is used.
- Feedback checks choice, fragrance-free access, health-claim avoidance, eye-closure choice, consent before touch, and concise tone.
- The exercise remains ungraded.
- Student may revise and resubmit.
- Feedback and error states are announced.
- No progress or checkpoint state is written.

### Static comparison

- The feeling slider is removed from the student experience.
- The approved “Same service. Different beginning.” comparison appears.
- Module 2 no longer depends on `#feelingSlider` rendering.
- No unrelated shared functionality is removed.

### Checkpoint

- The displayed and evaluator question strings match exactly.
- `m2cp1` remains unchanged as the stored ID.
- Previously passed state remains passed.
- Module-specific evaluator configuration replaces the question-regex trigger for this checkpoint.
- A complete applied answer passes.
- A safe alternate ritual passes when the professional standards are present.
- A partial answer receives one focused revision request.
- Lack of touch consent is corrected.
- Forced undressing, fragrance pressure, or medical claims are corrected.
- Grammar and spelling do not cause unfair failure.
- Review Mode submissions remain unsaved.
- The network-failure message is clear.

### Accessibility and responsive behavior

- Timeline, quiz, script builder, checkpoint controls, and feedback are keyboard accessible.
- Voice and submit buttons have accessible names.
- Live regions do not produce excessive duplicate announcements.
- Focus remains visible.
- States are understandable without color.
- No horizontal overflow appears at mobile widths.
- Touch targets are reviewed during manual QA.

### Completion and regression

- The completion card names the competency.
- Module 3 unlocks only when `m2cp1` passes in normal mode.
- Module 1 is unchanged.
- Module 3 is unchanged.
- Welcome Module is unchanged.
- Review Mode is unchanged.
- Authentication, entitlements, payments, progress sync, and certificate logic are unchanged.
- No duplicate IDs, broken HTML, or console errors are introduced.

---

## Guided completion structure

### Estimated attentive learning time

**18–25 minutes** for the curriculum, accordion, judgment check, and static comparison.

### Estimated checkpoint time

**6–10 minutes** for the initial response, plus revision time when needed.

### Estimated hands-on or application time

**10–15 minutes** for writing and speaking the scent-introduction script and rehearsing changing, consent, and orientation language.

These figures are planning estimates and have not yet been measured with students.

### Competency demonstrated

The student can:

- lead an organized arrival;
- review and confirm relevant intake information;
- protect privacy and choice;
- present hospitality and scent as optional;
- obtain permission before touch;
- orient the client calmly under time pressure.

### Suggested practice or application task

The student should rehearse a complete three-minute arrival conversation with a partner or aloud.

The rehearsal should include:

1. welcoming a client who feels rushed;
2. confirming an intake detail;
3. giving preparation and privacy instructions;
4. offering an optional beverage or scent;
5. asking permission before touch;
6. giving one concise service orientation.

Repeat the rehearsal with the client declining scent and declining shoulder contact.

This remains guided practice, not a certification checkpoint.

### Earlier concepts to revisit

- Welcome Module: led service versus performed service.
- Welcome Module: controlled does not mean rigid.
- Module 1: legal scope depends on license and jurisdiction.
- Module 1: professional language should not overstate what the practitioner can establish.
- Module 1: client safety and professional boundaries take priority over completing a preferred sequence.

### Guided Completion Path position

**Client-experience foundation — immediately after Module 1.**

Module 2 should be completed before anatomy, assessment, condition-recognition, equipment, and hands-on protocol modules because it establishes the professional client framework in which those later skills are used.

Do not implement the Guided Completion Path interface during this task.

---

## Listen Mode notes

### Narration suitability

Module 2 is suitable for optional narration after the timeline content is made available to the audio sequence independently of its collapsed visual state.

### Approximate narration length

Approximately **9–11 minutes** for the approved curriculum copy at a calm instructional pace.

Do not narrate model checkpoint answers.

### Visual-review cues

Add an audio cue before:

- the five-step arrival accordion;
- the judgment-check options;
- the reference scent script;
- the rushed-versus-guided comparison.

Suggested cue:

> “This section includes an on-screen reference or activity you may want to review when you are able to look at the course.”

### Content that should remain video-only

No current Module 2 content requires a physical technique demonstration.

A future short introduction video may model tone and pacing, but the curriculum does not depend on it.

### Audio-only completion limits

Listening may expose all instructional copy, but it must not:

- complete the judgment check;
- submit the script builder;
- pass `m2cp1`;
- mark Module 2 complete.

The student must return to the screen for applied interaction and competency submission. Voice dictation may be used for the checkpoint when available.

Do not implement Listen Mode during this task.

---

## Implementation notes

1. Apply only the approved Module 2 replacements and additions.
2. Preserve `module2Wrap`, `M2`, `m2cp1`, `m2Complete`, module ID `2`, stored progress, and Module 3 gating.
3. Preserve any existing passed `m2cp1` state.
4. Replace the displayed/evaluator question mismatch with one shared exact string.
5. Replace the phrase-matching special rubric with Module-2/checkpoint-specific evaluator configuration.
6. Do not alter evaluator behavior for unrelated modules.
7. Reuse the approved Module 0 and Module 1 accessibility and checkpoint patterns.
8. Keep the timeline, judgment check, and script builder ungraded.
9. Remove the feeling slider from the student experience and safely remove only its Module-2-specific initialization when no longer needed.
10. Do not make optional rituals completion requirements.
11. Do not add persistence to the script builder or Cadence chat in this phase.
12. Do not implement persistent Cadence threads, Guided Completion Path UI, Listen Mode, Module 12, or certificate changes.
13. Do not modify Module 1 or Module 3.
14. Update `docs/course-audit/implementation-log.md` after implementation.
15. Set Module 2 status to `Implemented — awaiting manual QA` only after testing the acceptance criteria.
16. The factual correction basis is that aromatherapy products and wellness claims must not be presented as disease treatment or body-function claims without appropriate regulatory status and evidence; essential oils may also cause irritation or other adverse effects. The approved copy therefore keeps scent optional, avoids clinical effects, and requires sensitivity review and a fragrance-free path.
17. Client touch, changing, coverage, and draping must be handled as consent and professional-boundary issues. The approved copy requires explicit permission and minimal necessary exposure rather than assuming compliance.
