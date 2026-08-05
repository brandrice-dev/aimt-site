# Module 3 — Approved Audit Specification

**Course:** AIMT Head Spa Certification Course  
**Module:** 3  
**Approved module title:** Hair & Scalp Anatomy  
**Source reviewed:** `module-03-source.md`  
**Status:** Approved for controlled implementation  
**Production source of truth:** `headspa-mastery.html`

This document is the approved implementation specification for Module 3. It does not authorize changes to authentication, entitlements, payments, database policies, certificate issuance, unrelated modules, persistent Cadence threads, the Guided Completion Path interface, Listen Mode, or the future Module 12 Final Exam.

Module 3 is the first technical-science module. It should feel like the point where visible scalp clues stop looking random and begin connecting to structures, cycles, timing, and service decisions.

---

## Approved outcomes

By the end of Module 3, the student should be able to:

1. Explain why the scalp must be understood as a specialized skin environment rather than merely the surface beneath the hair.
2. Identify the five anatomical scalp layers without implying that a cosmetic head spa service selectively reaches or treats the deeper layers.
3. Distinguish the visible hair shaft from the living structures of the hair follicle.
4. Locate the major parts of the pilosebaceous unit and explain why each matters to cosmetic scalp care.
5. Explain the anagen, catagen, telogen, and exogen phases in practical client-facing language.
6. Use the delay between a triggering event and visible shedding to reason more accurately about a client’s history.
7. Recognize broad differences between delayed diffuse shedding, postpartum shedding, and hair-loss patterns that require medical evaluation without diagnosing.
8. Explain the scalp barrier and surface lipid film accurately enough to avoid reflexively over-cleansing or over-exfoliating.
9. Connect anatomy to conservative product, cleansing, exfoliation, pressure, and referral decisions.
10. Explain scalp massage honestly: as a controlled sensory and manual technique that may temporarily affect local skin blood flow and comfort, not as a proven hair-regrowth treatment.
11. Translate technical terminology into calm, useful language a client can understand.
12. Demonstrate that anatomy is operating in the background of service judgment rather than being memorized as isolated vocabulary.

---

## Keep unchanged

Preserve the following concepts and technical structures:

- Student-facing module title: **Module 3 — Hair & Scalp Anatomy**.
- Home-screen positioning as the biology behind later assessment and service decisions.
- The course transition from client experience into technical terminology.
- The central principle that anatomy should improve treatment-bed judgment rather than become academic memorization.
- Coverage of:
  - scalp structure;
  - hair follicle anatomy;
  - the hair-growth cycle;
  - delayed diffuse shedding;
  - postpartum shedding;
  - referral-worthy hair-loss patterns;
  - scalp barrier and surface lipids;
  - massage claims and limitations;
  - anatomy-to-service integration.
- Two required open-response checkpoints.
- Existing checkpoint IDs `cp1` and `cp2`.
- Existing module ID `3`.
- Existing completion-card ID `lessonComplete`.
- Existing `module3HTML` capture/routing behavior unless a narrowly scoped change is proven necessary.
- Existing stored progress and previously passed `cp1` or `cp2` state.
- Module 4 as the next module.
- The supplied image source:
  `assets/images/course/module-03/aimt-scalp-cross-section.png`

Do not rename `cp1`, `cp2`, `lessonComplete`, the module ID, or stored checkpoint keys merely to make Module 3 match later naming conventions.

The sentence **“The anatomy gives you the map”** may remain as a transition into Module 4.

---

## Required corrections

### 1. Replace the weak technical tone

Replace:

> The scalp is skin. Treat it like it.

with the approved headline:

> **The scalp is not a backdrop. It is the environment everything depends on.**

Audit all major Module 3 headlines against the same standard.

Technical headlines should:

- create a clear mental model;
- show why the terminology matters;
- feel precise, memorable, and consequential;
- use professional metaphor or comparison when it improves understanding;
- avoid generic textbook labels;
- avoid empty drama, gimmicks, or casual language.

### 2. Remove the nonfunctional video placeholder

The current “Video coming soon” block should not appear in the student experience until a real video exists.

Remove or hide the placeholder from production rendering.

Do not add an autoplay video or fabricate a temporary embed.

The future module-introduction video remains part of the later media phase.

### 3. Teach the five scalp layers accurately

The five commonly described scalp layers are:

1. Skin
2. Dense connective tissue
3. Galea aponeurotica, also called the epicranial aponeurosis
4. Loose areolar connective tissue
5. Pericranium

Replace the current six-layer/skin-cross-section framing with a concise, accessible five-layer scalp map.

Do not imply that a head spa practitioner:

- works “through” all five layers;
- directly stimulates the pericranium;
- selectively reaches deep vessels or nerves;
- drains, detoxifies, repairs, or treats individual deep layers.

The practical lesson is that the practitioner works at the surface while pressure and movement affect superficial tissues as a whole.

### 4. Use the supplied image for the correct purpose

Use:

`assets/images/course/module-03/aimt-scalp-cross-section.png`

The supplied image is visually strong and should become Module 3’s primary hair-and-follicle cross-section visual.

It must **not** be used as the sole diagram for teaching the five scalp layers because it is a simplified hair/skin illustration and does not visibly teach the complete five-layer scalp sequence.

Use it in the pilosebaceous-unit/hair-follicle section.

Add an adjacent caption that clearly states that it is a simplified illustration and does not show every scalp layer.

Do not quiz students on every label baked into the raster image.

Use standard terminology in the course copy:

- `galea aponeurotica` or `epicranial aponeurosis`, rather than treating “Aponeurotic Galea” as the preferred term;
- `dermal papilla`;
- `subcutaneous tissue`;
- `pilosebaceous unit`.

### 5. Optimize and make the image accessible

Keep the original PNG as the source asset.

Create a web-optimized derivative for production use, preferably:

`assets/images/course/module-03/aimt-scalp-cross-section.webp`

Requirements:

- preserve the original aspect ratio;
- retain enough resolution for label readability;
- substantially reduce the current multi-megabyte page weight;
- use `<picture>` with the optimized format and PNG fallback when appropriate;
- include meaningful alt text;
- include a visible “View full-size diagram” control or link for mobile users;
- prevent horizontal page overflow;
- ensure the full-size view is keyboard accessible.

Approved alt text:

> Illustrated hair-and-scalp cross-section showing hair shafts, epidermis, dermis, sebaceous glands, arrector pili muscles, hair follicles and bulbs, vessels, nerves, adipose tissue, the galea, and skull bone.

Approved caption:

> A simplified hair-and-scalp cross-section. Use it to locate the pilosebaceous unit and supporting structures; it is not a complete diagram of all five anatomical scalp layers.

### 6. Replace the current inline SVG appropriately

Remove the current large inline cross-section SVG from the student experience.

Replace its two teaching jobs with:

1. an accessible five-band scalp-layer map for the five anatomical layers; and
2. the supplied image in the pilosebaceous-unit section.

Do not retain two competing labeled cross-sections that teach different layer systems without explanation.

### 7. Correct the relationship between anatomy and service pressure

Remove language suggesting that scalp massage directly stimulates a particular deep anatomical layer.

Do not imply that the practitioner can feel or selectively influence the dermal papilla, capillary plexus, loose areolar tissue, or pericranium through routine cosmetic massage.

Use anatomy to explain:

- why the scalp can be sensitive;
- why pressure must be controlled;
- why inflamed or compromised skin changes the service;
- why the surface does not reveal the full cause of a concern.

### 8. Correct the sebaceous-gland and cleansing claims

Keep the pilosebaceous-unit connection, but use accurate wording:

- the sebaceous gland is associated with the hair follicle;
- sebum enters the upper follicular canal and reaches the skin and hair surface;
- visible material around a follicular opening may include sebum, scale, sweat, environmental material, or cosmetic product residue;
- appearance alone does not establish the cause.

Remove the claim that stripping the scalp automatically causes the sebaceous gland to produce more oil as a “defensive response.” The module may say that harsh or overly frequent cleansing can contribute to dryness, irritation, and barrier disruption.

Do not label all visible buildup as “follicular congestion.”

### 9. Clarify the scalp barrier and “hydrolipid film”

The principal permeability and protective barrier is the stratum corneum.

Sebum and other surface components contribute to lubrication and the scalp’s surface environment, but they should not replace the stratum corneum in the explanation of barrier function.

The term **hydrolipid film** may remain as a practical cosmetic shorthand only when the course explains that it refers broadly to the surface mixture of lipids, moisture, sweat, and other components.

Do not claim that most scalp imbalances trace back to one film.

Do not teach that oiliness, dryness, flaking, or sensitivity can be assigned a single cause from appearance alone.

### 10. Correct the hair-shaft and follicle framing

Replace:

> The visible hair is not the patient. The follicle is.

This is medically framed and too absolute.

Teach instead:

> The strand is the visible output. The follicle is the living system beneath it.

Explain:

- the visible shaft is made of keratinized, nonliving cells;
- shaft damage is addressed cosmetically;
- the follicle is living tissue;
- a head spa service does not directly treat the dermal papilla or diagnose internal follicle function;
- surface observation can guide cosmetic care but cannot establish the medical cause of hair loss.

### 11. Correct hair-growth-cycle certainty

Keep anagen, catagen, telogen, and exogen.

Present durations and percentages as approximate ranges that vary between individuals and sources.

Do not use a normal daily shedding number as a diagnostic cutoff.

The important practitioner insight is:

> A delayed shedding pattern can make an event from months earlier more relevant than what happened last week.

### 12. Correct the current Checkpoint 1 timeline

The current scenario says the client has been shedding for about two months but had influenza six weeks ago.

That illness occurred after the shedding began and cannot logically explain the start of the reported shedding.

Replace the scenario with an anatomically plausible delay between the trigger and visible shedding.

The checkpoint should test the student’s understanding of timing, not reward diagnosis.

### 13. Reframe telogen effluvium content

Do not teach students to diagnose telogen effluvium from a story or visual pattern.

The course may teach that diffuse shedding beginning several weeks to a few months after fever, illness, surgery, childbirth, medication change, or another major physiological stressor may be **compatible with a telogen shedding pattern**.

Use language such as:

- `compatible with`;
- `can occur after`;
- `the timing is worth noting`;
- `a medical professional can evaluate the cause`.

Remove claims that a practitioner can determine the trigger, confirm the condition, or guarantee self-resolution.

Scalp massage must not be presented as a treatment for telogen effluvium.

### 14. Reframe postpartum shedding

Postpartum shedding may be explained as a common temporary shift in hair cycling after pregnancy.

Do not guarantee that every case is normal or resolved by a fixed deadline.

Teach referral or medical evaluation when the loss is:

- severe;
- patchy;
- painful;
- accompanied by inflamed or compromised skin;
- associated with other concerning symptoms;
- continuing or worsening beyond the expected recovery period;
- distressing enough that the client wants medical answers.

Use inclusive language such as `postpartum client`, `new parent`, or `after pregnancy` where appropriate.

### 15. Strengthen pattern recognition without turning it into diagnosis

Retain practical referral clues, including:

- patchy, circular, or asymmetric loss;
- rapidly changing density;
- smooth, shiny, scar-like areas;
- loss involving brows or lashes;
- pain, burning, bleeding, pustules, crusting, or significant inflammation;
- broken or visibly compromised skin.

Teach the sequence:

1. observe;
2. document;
3. explain the limit of cosmetic assessment;
4. pause or modify the service when needed;
5. refer appropriately.

This should be concise and practitioner-useful, not the dominant tone of the module.

### 16. Correct scalp-massage and circulation claims

Replace claims that reduced follicle circulation is caused by posture, tension, stress, or tight hairstyles unless a specific evidence-based condition is being taught.

Remove claims that massage:

- delivers additional nutrients to follicles in a clinically meaningful way;
- creates a healthier growth environment over time;
- reduces traction-related thinning;
- causes hair growth;
- produces different follicle outcomes in returning clients.

The approved framing is:

- manual stimulation may temporarily increase local skin blood flow;
- massage can support comfort, relaxation, and the sensory value of the service;
- limited small studies do not justify hair-regrowth promises;
- pressure, pace, consistency, and tissue tolerance are the practical concerns.

### 17. Add a true visual learning moment

Module 3 should not be a read-and-answer textbook chapter.

Add one signature **Anatomy to Action** visual explorer tied to the supplied image.

The learner should select four structures or regions and see:

- what the structure is;
- what can be observed at the surface;
- what it changes in a cosmetic service;
- what the practitioner should not assume.

The explorer remains ungraded.

### 18. Add a predict-then-reveal timing interaction

After the hair-growth-cycle explanation, ask the student to predict when shedding associated with a major fever or illness may become noticeable.

The student must commit to an answer before the explanation appears.

This interaction should create the module’s key discovery:

> The delay is part of the clue.

It remains ungraded and does not write progress.

### 19. Place Checkpoint 1 at the midpoint

Move `cp1` to immediately after:

- the hair-growth-cycle section; and
- the timing predict-then-reveal interaction.

The second half of the module should build from demonstrated understanding of timing into pattern recognition, barrier judgment, and massage claims.

Keep `cp2` at the end.

### 20. Align visible and evaluated questions

For both `cp1` and `cp2`, the exact question shown to the student must be the exact string supplied to Cadence.

Do not maintain shortened evaluator-only versions.

### 21. Add checkpoint-specific rubrics

Use separate Module-3/checkpoint-specific evaluator systems.

Do not fail for:

- spelling;
- grammar;
- concise wording;
- informal wording;
- non-native English;
- accurate concepts expressed without exact technical terms.

Require applied reasoning rather than keyword repetition.

When incomplete, Cadence should request one focused revision.

Correct unsafe diagnostic or hair-growth claims immediately.

### 22. Correct Cadence identity and voice

Replace Module-3-specific references to the old course name with:

**Head Spa Certification Course**

Cadence must not claim personal human experience, including:

> I didn't love studying anatomy when I was in school.

Cadence may say that the curriculum was built from the instructor’s nearly two decades of applied experience.

In Module 3, Cadence should feel like a technical translator:

- structure;
- visible clue;
- practical implication;
- limit of the conclusion.

### 23. Resolve duplicate Cadence prompts

Use one authoritative `MODULE_QUICK_PROMPTS[3]` source.

Remove or neutralize the conflicting hardcoded prompt set.

Do not allow Module 3 to show different prompt sets depending on entry path.

### 24. Improve accessibility

For the new layer map, image, explorer, timing interaction, and checkpoints:

- use semantic controls;
- support keyboard operation;
- provide visible focus;
- use `aria-expanded`, `aria-controls`, or tabs only when appropriate;
- provide an accessible text equivalent for visual content;
- use live regions for dynamic feedback;
- do not rely on color alone;
- support reduced motion;
- prevent mobile overflow.

For both checkpoints:

- add `aria-label="Speak your answer"` to voice buttons;
- add `aria-label="Send response to Cadence"` to submit buttons;
- use appropriate live feedback/status behavior;
- preserve Enter-to-submit and Shift+Enter-for-new-line.

### 25. Correct the completion card

Add a separate competency line naming what the student demonstrated.

Remove the malformed hidden fragment and duplicate dead button.

### 26. Preserve progress and system integrity

Implementation must not:

- rename `cp1` or `cp2`;
- invalidate an existing passed checkpoint;
- add another completion-gating checkpoint;
- make the visual explorer or timing interaction completion-gating;
- modify Module 2 or Module 4;
- alter authentication, entitlements, payments, progress sync, certificate logic, or Review Mode;
- implement persistent Cadence threads, Guided Completion Path UI, Listen Mode, Module 12, or broad course refactoring.

---

## Final replacement copy

Use the following copy and structures for the approved Module 3 experience.

### A. Module identity

**Home-screen title:**

> Module 3 — Hair & Scalp Anatomy

**Home-screen subtitle:**

> The structures and cycles behind what you see

**Hero eyebrow:**

> Module 3 · Hair & Scalp Anatomy

**Hero title:**

> What you see is only the surface.

**Hero description:**

> This is where the course turns technical. Once you understand the structures and cycles beneath the scalp, buildup, shedding, sensitivity, and product response stop looking random.

Remove the student-facing video placeholder until a real module-introduction video exists.

---

### B. Section 3.1 — The foundation

**Eyebrow:**

> 3.1 — Read beneath the surface

**Headline:**

> The scalp is not a backdrop. It is the environment everything depends on.

**Body:**

> Every product, tool, and hand movement meets a living skin environment before it affects the hair. The scalp follows the same fundamental rules as skin elsewhere on the body, but it contains a dense concentration of follicles, sebaceous glands, nerves, and blood vessels.
>
> That changes the way an experienced practitioner thinks. Instead of reacting to one visible clue, you begin connecting surface appearance with product history, barrier condition, sebum, sensitivity, and hair-cycle timing.
>
> Anatomy is not a list of terms to memorize. It is the map behind better decisions.

**Cadence note:**

> “The advantage is not knowing the longest anatomical word. It is knowing which structure makes a visible clue matter—and which conclusions the surface cannot support.”

---

### C. Section 3.2 — The five scalp layers

**Eyebrow:**

> 3.2 — The scalp map

**Headline:**

> Five layers. One surface you can actually touch.

**Introduction:**

> The scalp is commonly described in five layers. The acronym SCALP makes the order easy to remember. Your service takes place at the surface; the deeper layers explain the tissue beneath your hands, not five separate targets to treat.

Create an accessible five-band diagram using these labels and explanations:

#### S — Skin

> The epidermis and dermis contain the surface barrier, follicles, sebaceous glands, sensory receptors, and many of the visible clues used during cosmetic assessment.

**Treatment-bed relevance:**

> Product choice, cleansing, temperature, exfoliation, and tolerance are judged at this level.

#### C — Dense connective tissue

> A firm fibrous layer containing many of the scalp’s vessels and nerves.

**Treatment-bed relevance:**

> It helps explain why the scalp is highly vascular and sensitive. It is not a layer a cosmetic service selectively targets.

#### A — Galea aponeurotica

> A broad fibrous sheet connecting the frontal and occipital muscles.

**Treatment-bed relevance:**

> It contributes to the way the scalp moves as a tissue unit. Routine massage does not isolate or “treat” the galea.

#### L — Loose areolar tissue

> A deeper glide plane that allows the upper scalp layers to move over the skull.

**Treatment-bed relevance:**

> It is anatomical context, not a cosmetic treatment target.

#### P — Pericranium

> The membrane covering the outer surface of the skull.

**Treatment-bed relevance:**

> It is not reached or treated during a head spa service.

**Key point:**

> Anatomy makes pressure more intelligent. It does not turn deeper tissue into a cosmetic claim.

---

### D. Section 3.3 — The pilosebaceous unit

**Eyebrow:**

> 3.3 — The living system beneath the strand

**Headline:**

> The strand is the output. The follicle is the living system.

**Body:**

> The visible hair shaft is made of keratinized, nonliving cells. It can be cleansed, conditioned, protected, and cosmetically damaged—but it does not heal itself.
>
> Beneath the surface, the follicle is a living mini-organ. The lower follicle contains the bulb and surrounds the dermal papilla. The associated sebaceous gland releases sebum into the upper follicular canal, while the arrector pili muscle attaches to the follicular unit.
>
> These structures explain why strand care and scalp care are related but not interchangeable. They also explain why a surface service cannot diagnose or directly treat internal follicle function.

Use the supplied image here:

`assets/images/course/module-03/aimt-scalp-cross-section.png`

Use the approved alt text and caption from Required Corrections.

Add a visible full-size control:

> View full-size diagram

---

### E. Signature visual explorer — Anatomy to Action

**Placement:** Directly beneath the supplied cross-section image.

**Eyebrow:**

> Anatomy to action

**Headline:**

> Tap the structure. See what changes at the treatment bed.

**Instruction:**

> Select each area to connect the anatomy with what you can observe, what it changes in service, and what it cannot prove.

Use four accessible selector buttons or tabs.

#### 1. Surface barrier

**What it is:**

> The stratum corneum is the scalp’s principal protective and permeability barrier.

**What you may observe:**

> Dryness, visible scale, oil, redness, product residue, or an altered surface sheen.

**What it changes in service:**

> Cleanser strength, exfoliation choice, water temperature, product load, and whether the service should be simplified.

**What not to assume:**

> One surface clue does not establish dandruff, dehydration, infection, inflammation, or the cause of sensitivity.

#### 2. Follicle opening and sebaceous gland

**What it is:**

> The sebaceous gland is part of the pilosebaceous unit and releases sebum into the upper follicular canal.

**What you may observe:**

> Material around follicular openings, surface oil, scale, or cosmetic residue.

**What it changes in service:**

> How carefully you cleanse, section, rinse, and decide whether exfoliation is appropriate.

**What not to assume:**

> Visible material does not prove that a follicle is “clogged” or identify the cause.

#### 3. Follicle, bulb, and dermal papilla

**What it is:**

> The lower follicle is living tissue involved in producing the hair shaft.

**What you may observe:**

> You cannot see the bulb or dermal papilla during a routine surface assessment.

**What it changes in service:**

> It keeps hair-growth language honest. Cosmetic care can support cleanliness and comfort at the scalp surface; it does not directly feed, repair, or restart the dermal papilla.

**What not to assume:**

> Surface appearance cannot establish why a follicle is shedding, miniaturizing, inflamed, or no longer producing hair.

#### 4. Vessels and nerves

**What it is:**

> The scalp has a rich vascular and sensory supply.

**What you may observe:**

> The client’s response to pressure, temperature, tenderness, or touch.

**What it changes in service:**

> Pressure, pace, positioning, temperature, and the decision to avoid an irritated or painful area.

**What not to assume:**

> Temporary warmth or redness does not prove that nutrients have been delivered to follicles or that growth has been stimulated.

**Completion line after all four have been viewed:**

> The expert move is not naming more structures. It is knowing what each structure allows you to conclude.

**Interaction rules:**

- Ungraded.
- No progress write.
- No completion requirement.
- Student may revisit every area.
- Keyboard and screen-reader operable.
- Content must also exist in the DOM in a form available to future narration.

---

### F. Section 3.4 — Hair growth cycle

**Eyebrow:**

> 3.4 — The hair-growth cycle

**Headline:**

> Hair loss is often a timing problem before it is a pattern problem.

**Introduction:**

> Every follicle cycles independently through growth, transition, rest, and release. That staggered timing is why normal shedding is continuous—and why a major event may not become visible in the hair until months later.

Use four phase cards:

#### Anagen — Growth

> The follicle actively produces the hair shaft. Scalp anagen lasts years, which is why scalp hair can grow long.

**Practitioner connection:**

> The length of anagen varies. A surface service cannot extend it on command.

#### Catagen — Transition

> The lower follicle regresses over a period of weeks and the growing phase ends.

**Practitioner connection:**

> Catagen is brief and represents transition, not sudden surface damage.

#### Telogen — Relative rest

> The follicle remains in a resting phase for roughly several months before the retained club hair is released.

**Practitioner connection:**

> A trigger that shifts more follicles into telogen may not produce visible shedding immediately.

#### Exogen — Release

> The club hair separates and sheds from the follicle.

**Practitioner connection:**

> Shedding is a normal part of cycling. The pattern, amount, timing, duration, and accompanying signs determine whether it deserves closer evaluation.

**Key point:**

> The event and the shedding may be separated by months. That delay is one of the most useful pieces of history a practitioner can recognize.

---

### G. Predict-then-reveal interaction — The delay tells the story

**Placement:** Immediately after the growth-cycle cards.

**Eyebrow:**

> Predict before you reveal

**Headline:**

> A client has a high fever today. When could related shedding become noticeable?

**Options:**

1. `Within the same week`
2. `About two to three weeks later`
3. `Roughly two to three months later`

**Best answer:**

> Roughly two to three months later

**Reveal copy:**

> A major physiological stressor can shift more follicles from growth toward rest. Those hairs are not released immediately. The visible shedding often appears after the cycle has moved forward—commonly several weeks to a few months later.
>
> This timing can make a past event relevant, but it does not establish a diagnosis. It tells you which history is worth documenting and discussing.

**Completion line:**

> The beginner looks at what happened this week. The informed practitioner also asks what happened months ago.

**Interaction rules:**

- Student must select an answer before the reveal appears.
- Student may change the answer afterward.
- Ungraded.
- No state or progress write.
- Correctness communicated with text, not color alone.
- Keyboard and screen-reader operable.
- Live feedback announced appropriately.

---

### H. Midpoint Checkpoint 1

Place `cp1` immediately after the timing interaction and before Section 3.5.

Use the exact copy in the Checkpoint Specification section.

---

### I. Section 3.5 — Shedding patterns

**Eyebrow:**

> 3.5 — Read the pattern

**Headline:**

> Do not start with the name. Start with the pattern.

**Introduction:**

> A client may arrive asking for a diagnosis. Your advantage is not guessing the label faster. It is noticing the timing, distribution, duration, and accompanying signs that determine the next professional step.

Use three comparison cards:

#### Delayed diffuse shedding

**Pattern:**

> Increased shedding across the scalp beginning several weeks to a few months after a major illness, high fever, surgery, medication change, rapid weight change, childbirth, or another significant physiological stressor.

**Practitioner insight:**

> The delay matters. A client may dismiss the relevant event because it did not happen recently.

**Professional move:**

> Document the timeline, describe the diffuse pattern, explain that delayed shedding can follow major body changes, and recommend medical evaluation when the shedding is heavy, persistent, worsening, or concerning.

#### Postpartum shedding

**Pattern:**

> Noticeable diffuse shedding beginning in the months after pregnancy as hair cycling shifts again.

**Practitioner insight:**

> The shedding can feel sudden because more hairs may release within a similar period rather than in their usual staggered pattern.

**Professional move:**

> Normalize that postpartum shedding is common without guaranteeing the cause or timeline. Keep the service gentle and recommend medical evaluation for patchy, painful, severe, persistent, or otherwise concerning loss.

#### Pattern requiring medical evaluation

**Pattern:**

> Patchy or asymmetric loss, rapidly changing density, smooth or shiny areas, significant redness or scale, pain, burning, bleeding, crusting, pustules, broken skin, or loss involving brows or lashes.

**Practitioner insight:**

> The most valuable decision may be not to treat the area.

**Professional move:**

> Document what is visible, explain the limit of cosmetic assessment, pause or modify the service when appropriate, and refer to a dermatologist or qualified medical professional.

**Referral script:**

> “I’m seeing a pattern that deserves a medical evaluation before we treat this area. I can document what is visible, but I can’t determine the cause from a cosmetic assessment.”

**Key point:**

> A commonly quoted daily shedding range is context—not a diagnostic test. The change from the client’s baseline, the pattern, and the timeline matter more than counting one day’s hairs.

---

### J. Section 3.6 — Barrier and surface lipids

**Eyebrow:**

> 3.6 — Barrier and surface lipids

**Headline:**

> Oil, flakes, and tightness are clues—not conclusions.

**Body:**

> The stratum corneum is the scalp’s principal protective barrier. It helps limit water loss and reduces penetration by outside irritants.
>
> Sebum, sweat, moisture, and other surface components create a thin surface environment often described in cosmetic education as the hydrolipid film. Sebum contributes lubrication, but the barrier is more than surface oil.
>
> This distinction matters because a scalp can look oily and still be irritated, or look flaky for reasons that have nothing to do with inadequate cleansing. Harsh or overly frequent cleansing may contribute to dryness and barrier disruption; it does not prove that the sebaceous glands will automatically produce more oil in response.

**Insider decision rule:**

> Before you reach for a stronger cleanser, ask three questions:
>
> 1. What does the scalp feel like—comfortable, tight, itchy, tender, or burning?
> 2. What has been used on it—clarifying shampoo, medicated products, dry shampoo, chemical services, oils, or frequent exfoliation?
> 3. What else is visible—oil, redness, adherent scale, loose flakes, residue, or broken skin?

**Cadence note:**

> “A newer practitioner sees one symptom and chooses one product. A stronger practitioner reads the combination. Flaking plus tightness plus frequent clarifying tells a different story than flaking plus heavy oil and adherent scale.”

**Key point:**

> Treat the pattern you can support cosmetically—not the diagnosis you cannot establish.

---

### K. Section 3.7 — Massage

**Eyebrow:**

> 3.7 — Massage and anatomy

**Headline:**

> Massage is technique, not mythology.

**Body:**

> Scalp massage is valuable because of how it feels and how well it can be controlled: pressure, rhythm, pace, tissue movement, warmth, and the client’s response.
>
> Manual stimulation may temporarily increase local skin blood flow. Limited small studies have explored possible changes in hair thickness, but that evidence does not support promising hair growth, nutrient delivery, follicle activation, or treatment of hair-loss conditions.
>
> The experienced practitioner does not make massage sound more medical to make it sound more valuable. The value is in precise, comfortable, repeatable technique.

**Info card title:**

> What anatomy changes in your hands

**Info card points:**

- Use pressure the client can comfortably receive.
- Adjust for tenderness, inflammation, broken skin, recent procedures, and sensitivity.
- Do not assume harder pressure reaches a deeper or more beneficial target.
- Do not massage an area that should be medically evaluated first.
- Keep the purpose clear: controlled manual care, relaxation, comfort, and a cohesive service experience.

**Cadence note:**

> “The strongest explanation is also the cleanest: massage is a skilled part of the experience. You do not need a hair-growth promise to justify doing it well.”

---

### L. Section 3.8 — Anatomy in practice

**Eyebrow:**

> 3.8 — Anatomy in practice

**Headline:**

> Anatomy should disappear into judgment.

**Body:**

> During a service, you will not silently name every layer or phase. The knowledge should run in the background.
>
> You see flakes and ask what else is present before choosing a cleanser. You hear “my hair started shedding” and ask what happened two or three months earlier. You see patchy loss or compromised skin and know that the correct next step may happen outside the treatment room.
>
> That is internalization: the science becomes a faster, calmer decision.

**Clinical note label:**

> Four questions running in the background

**Clinical note copy:**

> 1. What am I actually seeing or hearing?
> 2. Which structure, cycle, or barrier function helps explain it?
> 3. What can a cosmetic service responsibly change?
> 4. What requires a different professional or a different day?

**Closing key point:**

> You are not collecting anatomy terms. You are reducing guesswork.

---

### M. Final Checkpoint 2

Keep `cp2` at the end of Section 3.8.

Use the exact copy in the Checkpoint Specification section.

---

### N. Module-open Cadence greeting

Replace with:

> Module 3 is where the surface stops looking random. Follow every technical term to its practical payoff: what it helps you notice, what it changes in service, and what it still cannot prove.

---

### O. Cadence guide system

Replace `MODULE_GUIDE_SYSTEMS[3]` with:

> You are Cadence, AIMT’s curriculum-grounded guide for the Head Spa Certification Course. Your guidance was built from the instructor’s nearly two decades of applied experience; you do not claim that experience as your own or present yourself as a human practitioner. The student is in Module 3: five scalp layers, the pilosebaceous unit, hair-shaft versus follicle biology, the hair-growth cycle, delayed diffuse shedding, postpartum shedding, referral patterns, the stratum-corneum barrier, surface lipids, and accurate massage claims. Translate technical material through this sequence whenever useful: structure, visible clue, service implication, limit of the conclusion. Lead with practitioner insight and applied understanding rather than repeated warnings. Do not diagnose, promise hair growth, claim that massage feeds or activates follicles, or state that visible findings prove an internal cause. Use 3–5 concise sentences and no bullet points.

---

### P. Suggested Cadence prompts

Use one dynamic source with these prompts:

- `Why can shedding appear months after an illness?`
- `What can the scalp surface tell me—and what can’t it?`
- `How do I explain massage without promising hair growth?`
- `What does the scalp barrier change in product choice?`

---

### Q. Completion card

**Eyebrow:**

> Module 3 complete

**Title:**

> You can now see beneath the surface.

**Competency line:**

> You connected scalp layers, follicle biology, hair-cycle timing, barrier function, and massage claims to real service decisions.

**Next-up label:**

> Up next — Module 4

**Next-up text:**

> Anatomy gives you the map. Module 4 teaches you how to read the visible scalp in real time through assessment, microscopy, and disciplined observation.

**Primary button:**

> Start Module 4 →

**Secondary button:**

> Back to course

Remove the malformed hidden fragment and duplicate dead button.

---

## Checkpoint specification

Both existing checkpoints remain required.

Do not add a third required checkpoint.

Preserve checkpoint IDs `cp1` and `cp2`.

Previously passed state must remain valid.

### Checkpoint 1 — `cp1`

**Placement:** Midpoint, immediately after the hair-cycle timing interaction.

**Label:**

> Apply the timing

**Exact question:**

> A client reports diffuse heavy shedding that began about ten weeks after a high fever. Using the hair-growth cycle, explain why the delay matters, what pattern this timing could be compatible with, and how you would explain it without diagnosing.

The exact same string must be supplied to Cadence.

**Placeholder:**

> Connect the timing to the cycle, then explain what you would say…

**Voice-button accessible name:**

> Speak your answer

**Submit-button accessible name:**

> Send response to Cadence

**Network error:**

> Cadence couldn’t evaluate your response. Check your connection and try again.

#### Competency evaluated

The student can use hair-cycle timing to explain delayed diffuse shedding without converting a compatible pattern into a diagnosis.

#### Required elements for a pass

A passing response must demonstrate:

1. The student understands that shedding associated with a major fever or illness may appear weeks to months after the event rather than immediately.
2. The student connects the delay to more follicles moving from growth toward telogen and being released later.
3. The student describes the pattern as compatible with delayed telogen shedding or telogen effluvium without presenting it as confirmed.
4. The student gives calm client-facing language that explains the timing.
5. The student acknowledges that heavy, persistent, worsening, or concerning shedding deserves medical evaluation.

The student does not need to state exact phase percentages or use the phrase `telogen effluvium` when the timing mechanism and professional meaning are correct.

#### Immediate corrections

Cadence must correct responses that:

- confirm a diagnosis;
- say the fever six weeks ago caused shedding that began before the fever;
- promise that a head spa will stop the shedding or regrow hair;
- present massage as treatment;
- dismiss severe or persistent shedding without appropriate evaluation.

#### Revision behavior

When incomplete, identify the single most important missing element.

Examples:

- Correct pattern but no explanation of the delay: ask what happens between the trigger and release.
- Correct cycle explanation but diagnostic certainty: ask the student to restate it as a compatible pattern.
- Good explanation but no client-facing language: ask for the sentence they would actually say.

---

### Checkpoint 2 — `cp2`

**Placement:** End of module.

**Label:**

> Turn anatomy into a decision

**Exact question:**

> A client has scalp tightness and visible flaking after using a strong clarifying shampoo every day. Explain what the scalp barrier and surface lipid film do, what may have disrupted them, and one conservative change you would make to the service.

The exact same string must be supplied to Cadence.

**Placeholder:**

> Explain the barrier, connect the product history, and make one service decision…

**Voice-button accessible name:**

> Speak your answer

**Submit-button accessible name:**

> Send response to Cadence

**Network error:**

> Cadence couldn’t evaluate your response. Check your connection and try again.

#### Competency evaluated

The student can connect barrier function and product history to a conservative cosmetic service decision without diagnosing the cause of flaking.

#### Required elements for a pass

A passing response must demonstrate:

1. The stratum corneum helps protect the scalp and limit water loss.
2. Sebum and other surface components contribute lubrication and the surface environment.
3. Daily use of a strong clarifying shampoo may contribute to dryness, irritation, or barrier disruption.
4. The student chooses at least one conservative adjustment, such as:
   - gentler cleansing;
   - avoiding aggressive exfoliation;
   - reducing heat;
   - simplifying products;
   - monitoring comfort;
   - referring when redness, pain, broken skin, or persistent symptoms are present.
5. The student does not diagnose dandruff, dermatitis, infection, or another condition from the scenario.

The student does not need to use the term `hydrolipid film` if the concept is accurately explained.

#### Immediate corrections

Cadence must correct responses that:

- say the scalp should be aggressively stripped;
- claim that harsh cleansing definitely caused rebound oil production;
- diagnose the flaking;
- recommend medicated or prescription treatment;
- ignore pain, broken skin, or marked inflammation.

#### Revision behavior

Examples:

- Defines the barrier but makes no service decision: ask what they would change today.
- Chooses a gentler product but does not explain why: ask what frequent clarifying may have altered.
- Gives a diagnosis: ask them to rewrite using observation and product-history language.

---

### Shared grading rules

For both checkpoints, Cadence should:

- evaluate meaning rather than keyword matching;
- accept concise, accurate answers;
- accept non-native English and natural spoken phrasing;
- ignore minor grammar and spelling errors;
- reference one specific part of the student’s response;
- avoid generic praise;
- provide one focused revision request when incomplete;
- correct safety-critical misinformation immediately;
- pass the checkpoint as soon as the full competency is demonstrated.

Preserve the existing evaluator JSON contract.

Use Module-3/checkpoint-specific evaluator configurations rather than one generic `M3.system`.

---

## Approved interactions

Module 3 has a **moderate interaction density** with two purposeful learning interactions and two required checkpoints.

### 1. Anatomy to Action visual explorer

Approved as specified in Final Replacement Copy.

This is the module’s signature visual learning moment.

Requirements:

- Uses the supplied cross-section image.
- Four accessible structure/region controls.
- Reveals structure, visible clue, service implication, and limit.
- Student may revisit freely.
- No progress or completion write.
- No decorative animation.
- Future narration can access all text without requiring a visual click.

### 2. The delay tells the story

Approved as specified in Final Replacement Copy.

Requirements:

- Predict before reveal.
- Three answer options.
- Student must commit before the explanation.
- Student may change afterward.
- No progress or completion write.
- Text-based feedback.
- Accessible live announcement.
- No confetti, points, or punitive attempt count.

### 3. Checkpoint 1 at midpoint

`cp1` remains graded and completion-gating.

Its midpoint placement is deliberate: the student must demonstrate the hair-cycle timing concept before moving into pattern recognition and barrier judgment.

Do not lock the second half of the module behind `cp1` during this implementation unless the existing course architecture already supports that behavior safely. The checkpoint is positioned midway for learning rhythm, but module completion still depends on both checkpoints at the end.

### 4. Checkpoint 2 at end

`cp2` remains the final applied checkpoint.

No additional quiz, card sort, label drag, or decorative interaction is approved for this module.

---

## Cadence behavior

Cadence should make technical material feel usable and accelerated.

Her preferred response pattern in Module 3 is:

1. identify the relevant structure, cycle, or barrier function;
2. connect it to the visible clue or client history;
3. explain the practical service implication;
4. state what the information cannot prove only when relevant.

Cadence should:

- lead with insight rather than disclaimers;
- explain the delay between a physiological stressor and shedding;
- distinguish compatibility from diagnosis;
- explain the pilosebaceous unit accurately;
- identify the stratum corneum as the principal barrier;
- explain hydrolipid film as cosmetic shorthand rather than a single master cause;
- challenge reflexive clarifying or exfoliation decisions;
- reject hair-growth promises from massage;
- help the student translate science into natural client language;
- use specific examples from the module;
- avoid claiming personal school, clinical, or client experience;
- avoid presenting herself as a dermatologist, diagnostician, or human practitioner.

When persistent Cadence threads are implemented later, Module 3 must reopen its own saved text-message-style thread rather than a course-wide conversation.

---

## Acceptance criteria

Module 3 is approved only when all criteria below are met.

### Tone and learning value

- The approved headline “The scalp is not a backdrop. It is the environment everything depends on.” appears.
- Major headlines feel technical, memorable, and professionally written.
- The module does not read like a generic anatomy textbook.
- Every major technical section connects to a practitioner decision.
- Scope language appears as a guardrail rather than the dominant tone.
- Insider rules and trial-and-error reduction are clearly visible.

### Video and placeholders

- The nonfunctional video placeholder is absent from the student experience.
- No “Video coming soon” block remains.
- Empty clinical-photo placeholders are removed or replaced with approved instructional structures.
- No fabricated image or placeholder is added.

### Scalp-layer map

- The five layers are displayed in the correct order:
  - Skin
  - Dense connective tissue
  - Galea aponeurotica
  - Loose areolar tissue
  - Pericranium
- The layer map is responsive and accessible.
- It does not imply that a head spa selectively treats deep layers.
- The current conflicting inline SVG is removed from the student experience.

### Supplied image

- The supplied PNG is used in the pilosebaceous-unit section.
- A web-optimized derivative is used where appropriate.
- The source PNG remains available.
- Approved alt text and caption are present.
- A full-size viewing option works by keyboard.
- The image is not presented as a complete five-layer scalp diagram.
- Labels remain readable at common desktop and mobile sizes.
- Page load is not burdened by an unnecessary multi-megabyte image when an optimized format is supported.

### Anatomy to Action

- All four approved areas appear.
- Each area includes structure, observation, service implication, and limit.
- The interaction writes no progress.
- It works with mouse, keyboard, and screen reader.
- States do not rely on color.
- No horizontal overflow appears.

### Hair cycle and timing

- Anagen, catagen, telogen, and exogen are retained.
- Durations and proportions are not presented as rigid universal values.
- The timing interaction requires a prediction before reveal.
- The correct discovery is the several-week-to-several-month delay.
- The interaction does not diagnose telogen effluvium.
- No progress is written.

### Shedding content

- The current impossible flu/shedding timeline is removed.
- Delayed diffuse shedding is framed as compatible with a pattern, not confirmed diagnosis.
- Postpartum shedding is described without guaranteeing cause or recovery date.
- Massage is not presented as treatment for shedding.
- Referral-worthy patterns are concise and practical.
- Daily hair count is not treated as a diagnostic threshold.

### Barrier content

- The stratum corneum is identified as the principal barrier.
- Hydrolipid film is explained as practical cosmetic shorthand.
- Harsh cleansing is connected to possible dryness/irritation/barrier disruption.
- The module does not claim automatic rebound sebum production.
- Oil, flakes, and tightness are presented as combined clues, not diagnoses.
- The three-question decision rule appears.

### Massage content

- Massage is not framed as feeding or activating follicles.
- Unsupported causes of reduced circulation are removed.
- Limited evidence does not become a hair-growth promise.
- The practical emphasis is pressure, pace, comfort, consistency, and tissue tolerance.
- The approved “Massage is technique, not mythology” headline appears.

### Checkpoints

- `cp1` and `cp2` IDs remain unchanged.
- Previously passed state remains valid.
- `cp1` appears at the approved midpoint.
- Visible and evaluated question strings match exactly.
- Each checkpoint uses its own rubric.
- Strong applied answers pass.
- Partial answers receive one focused revision request.
- Diagnostic certainty and hair-growth claims are corrected.
- Grammar and spelling do not unfairly cause failure.
- Review Mode submissions remain unsaved.
- Network errors use the approved message.

### Cadence

- The old course name is removed from Module-3-specific prompts.
- Cadence does not claim personal human experience.
- Only one quick-prompt source is active.
- Dynamic prompts match the approved set.
- Responses follow structure → clue → implication → limit when helpful.
- Cadence does not diagnose or promise regrowth.

### Accessibility and responsive behavior

- Both checkpoint voice and submit buttons have accessible names.
- Dynamic feedback uses appropriate live regions.
- Visual content has a text equivalent.
- Focus is visible.
- Reduced-motion preferences are respected.
- Image and interactions do not create mobile overflow.
- Touch targets are reviewed during manual QA.
- Screen-reader announcements do not duplicate excessively.

### Completion and regression

- Completion card names the demonstrated competency.
- Malformed hidden completion markup is removed.
- Module 4 unlocks only after both checkpoints pass in normal mode.
- Module 2 is unchanged.
- Module 4 is unchanged.
- Review Mode is unchanged.
- Authentication, entitlements, progress sync, payment, and certificate logic are unchanged.
- No duplicate IDs, broken HTML, or console errors are introduced.

---

## Distinct learning rhythm

### Interaction density

**Moderate.**

Module 3 should feel more active than a textbook chapter but less interaction-dense than Module 2.

It contains:

1. a visual structure explorer;
2. a predict-then-reveal timing discovery;
3. a true midpoint checkpoint;
4. a final applied checkpoint.

No extra interaction should be added merely to increase the count.

### Signature learning moment

**The delay tells the story.**

The student predicts when illness-related shedding may appear and discovers why a past event can matter more than a recent one.

This is the moment that should make the hair-growth cycle feel immediately useful.

### Visual rhythm

The supplied image and Anatomy to Action explorer create the visual anchor.

The five-layer map should be concise and schematic.

The module should not open with a wall of anatomy terms.

### Checkpoint rhythm

- `cp1`: midpoint, immediately after the cycle-timing discovery.
- `cp2`: end, after barrier and massage decisions.

This makes Module 3 structurally different from Modules 0–2.

### Independent reasoning

The learner should predict the timing before Cadence or the course explains it.

The learner should also answer both checkpoints before receiving corrective feedback.

### Cadence’s role

Cadence translates technical language and corrects faulty causal assumptions.

She should not narrate every section or remove the need for the learner to reason.

### Curiosity and payoff

The module should repeatedly answer:

- Why can shedding appear months later?
- Why can flakes and oil point in different directions?
- Why can’t surface observation explain the follicle’s internal cause?
- Why is good massage still valuable without a growth promise?

---

## Insider value and acceleration payoff

### Strongest insider knowledge

1. **The delay is data.**  
   Shedding may reflect an event from months earlier.

2. **One symptom is not one diagnosis.**  
   Flaking, oil, tightness, redness, and product history must be read together.

3. **The image is not the whole anatomy.**  
   A hair-and-skin cross-section is different from the complete five-layer scalp map.

4. **The follicle is living, but it is not directly reachable from the surface.**  
   This protects students from product and massage mythology.

5. **Massage does not need a growth promise to be valuable.**  
   Technique, comfort, rhythm, and consistency are the professional payoff.

### Practical decision rules

- Ask what happened **two to three months earlier**, not only what changed this week.
- Before clarifying, check **sensation + product history + the full visible pattern**.
- Describe material around follicular openings without automatically calling it congestion.
- Treat the scalp surface conservatively when tightness, irritation, or compromised skin is present.
- Refer when the pattern is patchy, rapidly changing, painful, scar-like, or otherwise concerning.
- Do not make a deeper anatomical claim merely because the technique feels intense.

### Subtle details beginners often miss

- A trigger may precede shedding by months.
- The sebaceous gland is associated with the upper follicle, but visible buildup has multiple possible components.
- The stratum corneum—not surface oil alone—is the principal barrier.
- The provided cross-section is useful for follicular structures but does not teach every scalp layer.
- The client’s response to pressure is more useful than the practitioner’s belief that deeper is better.

### Mistakes this prevents

- Connecting shedding to an event that happened after the shedding began.
- Diagnosing telogen effluvium from a story.
- Treating every flake with stronger clarifying or exfoliation.
- Claiming rebound oil production as a certainty.
- Promising that massage nourishes follicles or grows hair.
- Teaching nonstandard or incomplete scalp-layer anatomy from one illustration.
- Overloading the student with terms that never change a service decision.

### Acceleration payoff

This module should save the student years of trial and error by giving them a repeatable internal sequence:

> **Structure → pattern → history → service implication → limit**

That sequence becomes the foundation for Module 4’s assessment and microscopy work.

---

## Guided completion structure

### Estimated attentive learning time

**25–35 minutes** for the full instructional experience, including the layer map, visual explorer, growth-cycle interaction, and applied reading.

This is an unmeasured planning estimate.

### Estimated checkpoint time

**10–16 minutes** total for both checkpoints, plus revision time where needed.

This is unmeasured.

### Estimated hands-on or application time

**10–15 minutes** of verbal practice.

Suggested rehearsal:

- explain delayed shedding to a worried client in 30 seconds;
- explain why a flaky scalp does not automatically require stronger cleansing;
- explain massage value without making a growth claim.

No physical technique assessment is required in Module 3.

### Competency demonstrated

The student can connect:

- five-layer scalp anatomy;
- pilosebaceous structure;
- hair-cycle timing;
- shedding-pattern history;
- barrier function;
- massage claims;

to conservative, explainable service decisions.

### Suggested practice task

Ask the student to complete three Anatomy to Action statements aloud:

1. `I observe ______. The structure or cycle that may help explain it is ______.`
2. `This changes my cosmetic service by ______.`
3. `It does not allow me to conclude ______.`

Use one example involving shedding, one involving flaking/tightness, and one involving massage.

This remains guided practice, not a certification checkpoint.

### Earlier concepts to revisit

- Welcome Module: observation before assumption.
- Welcome Module: led service versus performed service.
- Module 1: observation language and referral.
- Module 1: certification does not create diagnostic authority.
- Module 2: calm, concise client communication.

### Guided Completion Path position

**Technical foundation — immediately before Module 4 assessment and microscopy.**

Module 3 should be treated as a foundational technical module that deserves focused study rather than being rushed in the same session as several later modules.

Do not implement the Guided Completion Path interface in this task.

---

## Listen Mode notes

### Narration suitability

Most Module 3 prose is suitable for narration.

The five-layer map and supplied cross-section require a structured audio description rather than a simple “review this on screen” cue.

### Approximate narration length

Approximately **14–17 minutes** for the approved copy at a calm instructional pace.

Do not narrate model answers to checkpoints.

### Required visual-review cues

Add cues before:

- the five-layer scalp map;
- the supplied cross-section;
- Anatomy to Action;
- the four-phase hair-cycle sequence;
- the timing prediction.

Suggested cue:

> “This section uses a visual map. The key relationships will be described in audio, and you may also want to review the diagram on screen.”

### Content that must be seen or explicitly described

- Spatial order of the five scalp layers.
- Location of the follicle, sebaceous gland, bulb, vessels, and nerves.
- Difference between the complete scalp-layer map and the simplified follicle cross-section.

### Video-only content

None currently.

The hidden video placeholder must not be treated as existing content.

### Audio-only completion limits

Listening must not:

- complete the visual explorer;
- submit the timing prediction;
- pass `cp1` or `cp2`;
- mark Module 3 complete.

The student must return to the screen for applied work and competency submission.

Voice dictation may support checkpoint entry.

Do not implement Listen Mode in this task.

---

## Implementation notes

1. Follow this specification as the implementation authority.
2. Preserve module ID `3`, `cp1`, `cp2`, `lessonComplete`, stored state, and Module 4 gating.
3. Preserve previously passed checkpoint state.
4. Do not rename technical IDs to match later modules.
5. Keep the existing Module 3 routing/capture structure unless a change is necessary for the approved content and can be proven regression-safe.
6. Remove the malformed hidden completion fragment.
7. Resolve duplicate quick prompts by using one authoritative dynamic source.
8. Remove the student-facing video placeholder until a real embed exists.
9. Remove empty clinical-image placeholders that do not contain approved content.
10. Replace the current inline SVG with:
    - the accessible five-layer map; and
    - the supplied cross-section in the correct section.
11. Retain the original PNG and create a compressed production derivative.
12. Do not silently alter the supplied image’s baked-in labels.
13. Use the caption to clarify that the image is simplified and incomplete as a five-layer map.
14. Do not quiz students on the image’s baked-in label wording.
15. Use exact shared strings for visible and evaluated checkpoint questions.
16. Use Module-3/checkpoint-specific evaluator configurations.
17. Keep both new learning interactions ungraded and non-persistent.
18. Do not make `cp1` a lock on the second half unless a separate approved decision authorizes that behavior.
19. Reuse accessibility patterns already implemented in Modules 0–2.
20. Test the optimized image and full-size control at desktop and mobile widths.
21. Do not add persistent Cadence threads, Guided Completion Path UI, Listen Mode, Module 12, certificate changes, or broad structural refactoring.
22. Do not edit Module 2 or Module 4.
23. Update `docs/course-audit/modules/README.md` and `docs/course-audit/implementation-log.md` after implementation.
24. Set Module 3 status to `Implemented — awaiting manual QA` only after the acceptance criteria are tested.
25. Record anything that still requires:
    - live-model QA;
    - screen-reader QA;
    - physical keyboard QA;
    - real touch-device QA;
    - medical subject-matter review.
