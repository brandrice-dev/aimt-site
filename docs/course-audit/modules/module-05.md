# Module 5 — Approved Audit Specification

**Course:** AIMT Head Spa Certification Course  
**Module:** 5  
**Approved module title:** Scalp Patterns & Service Adaptation  
**Source reviewed:** `module-05-source.md`  
**Status:** Approved for controlled implementation  
**Production source of truth:** `headspa-mastery.html`

This document is the approved implementation specification for Module 5. It replaces the empty external-audit scaffold and becomes the controlling Module 5 content authority.

It does not authorize changes to authentication, entitlements, payments, database policies, certificate issuance, unrelated modules, persistent Cadence threads, the Guided Completion Path interface, Listen Mode, Module 6, the future Module 12 Final Exam, or the monolithic course-file architecture.

Module 5 should feel like a protocol decision laboratory. Module 4 taught the student how to gather and describe evidence. Module 5 must teach the student how to translate supported observations, client-reported experience, treatment history, and regional differences into a responsible cosmetic service plan—without collapsing the scalp into one permanent label.

---

## Amendment — Module 5 visual asset addendum (approved)

**Status: Approved.** This addendum amends the implemented Module 5 spec to add real teaching photography. It does not reopen or change any approved curriculum, checkpoint, interaction, Cadence, or completion content already implemented per this document — see `implementation-log.md` for the implementation record this addendum sits on top of. File-level inventory (paths, dimensions, derivative status) lives in [`module-05-assets.md`](module-05-assets.md); this section is the content authority for placement, captions, and alt text.

### Approved source photography

Five source photographs are approved, functioning as **four visual teaching moments**:

1. **Same-client crown/hairline regional comparison pair** (two photographs — crown and hairline/temporal — of the same model, used together as one paired lesson).
2. **Targeted crown cleansing** (one photograph).
3. **Gentle hairline adaptation** (one photograph).
4. **Regional-plan client conversation** (one photograph).

### Purpose

These visuals exist to:

- preserve engagement through a module that is otherwise decision- and text-led;
- connect observation to service decisions rather than to a static appearance gallery;
- demonstrate regional adaptation as a real, visible practice;
- support client communication;
- give Module 5 its own visual rhythm, distinct from Module 4's five-point stepper and appearance-gallery format — Module 5 must **not** repeat that card-grid presentation.

### Controlling caution

Module 5 must **not** present these photographs as diagnostic or authenticated medical evidence. They are illustrative service-planning photography. Every placement below carries this caution in on-page copy, and no caption, alt text, or nearby text may imply a diagnosis or a proven medical cause.

### Approved placements, copy, and alt text

#### Visual 1 — Regional comparison case study

- **Source images:** `mixed-regional-crown-original`, `mixed-regional-hairline-original`.
- **Placement:** after Section 5.4 and before the "What changes first?" interaction.
- **Presentation:** a large editorial case-study spread — side by side on desktop, stacked in the same order on phone, treated visually as one paired lesson. No carousel, no small card thumbnails.
- **Heading:** `One scalp. Different regional needs.`
- **Crown caption:** `Crown: greater visible shine and surface coating may support more targeted cleansing.`
- **Hairline caption:** `Hairline or temporal area: a matte, fine-scale appearance may call for a gentler service direction.`
- **Shared caution:** `Illustrative service-planning example. Appearance alone does not establish cause or diagnosis.`
- **Crown alt text:** `Close view of a client's crown showing greater visible shine and surface coating than the comparison region.`
- **Hairline alt text:** `Close view of the same client's hairline or temporal region showing a more matte appearance with fine visible scale.`
- **Teaching purpose:** show why one client may require different service decisions by region.

#### Visual 2 — Targeted crown cleansing

- **Source image:** `targeted-crown-cleansing-original`.
- **Placement:** after Section 5.5, following the regional protocol builder.
- **Presentation:** a full-width (content-column-width) editorial image break — not a small card thumbnail.
- **Caption:** `Regional customization may change product placement and cleansing intensity without changing the entire service.`
- **Alt text:** `Practitioner sections the crown and applies cleansing product specifically at the roots while customizing treatment by region.`
- **Teaching purpose:** show product placement and targeted cleansing as deliberate customization.

#### Visual 3 — Gentle hairline adaptation

- **Source image:** `gentle-hairline-adaptation-original`.
- **Placement:** within or immediately after Section 5.7, "Steam, water, pressure, and time."
- **Caption:** `Lower pressure, less product, and reduced stimulation can be deliberate protocol decisions.`
- **Alt text:** `Practitioner uses light fingertip contact and minimal product at the client's hairline during a low-stimulation service adjustment.`
- **Teaching purpose:** show restraint as a skilled service modification—not a lesser service. Do not describe the client as inflamed, diseased, or medically sensitive in this caption or any nearby copy.

#### Visual 4 — Client communication

- **Source image:** `regional-plan-client-conversation-original`.
- **Placement:** within Section 5.8, "Explain the change without losing the client."
- **Caption:** `Explain what you observed, what the client reported, and why the service plan changed.`
- **Alt text:** `Practitioner explains a personalized regional scalp-service plan to a seated client in a treatment room.`
- **Teaching purpose:** connect service judgment with client trust and communication.
- **Note (recorded, not a placement change):** the source photograph's background props (a wall display and a handheld chart) carry their own stock-photography set-dressing text and a three-region layout that does not match this course's approved five-pattern framework. That prop text is incidental staging, not approved course terminology — it must not be referenced, repeated, or treated as endorsed language in the caption, alt text, or any nearby copy, and no private or real client information is depicted (the props are generic stock mockups).

### Accessibility requirements

Use semantic `<figure>`/`<figcaption>` structures where practical. Every image requires the approved alt text above (meaningful, non-diagnostic — not a repeat of the caption verbatim). Do not place essential teaching text inside the image itself; all teaching text stays in real DOM copy.

### Downloadable resource decision (retained)

The existing approved downloadable-resource decision is unchanged by this addendum:

> **AIMT Regional Service Adaptation Guide — recommended; production deferred.**

See "Downloadable resource opportunity" below for the full recorded detail. This addendum does not create, link, or produce that downloadable.

---

## Approved outcomes

By the end of Module 5, the student should be able to:

1. Explain why a cosmetic service plan should be built from current findings and client context rather than a fixed scalp-type label.
2. Carry Module 4’s five-point assessment and observation language into protocol selection.
3. Identify the safest limiting factor before choosing the strongest or most appealing service step.
4. Distinguish a baseline or maintenance presentation from an oil-dominant, fine-scale/dry-appearing, mixed-regional, or reactive presentation without presenting any of them as a diagnosis.
5. Understand that shine, scale, residue, color change, and discomfort may overlap and may have more than one possible cause.
6. Use client history—including wash timing, recent product use, chemical services, heat exposure, symptoms, and recent reactions—to interpret what the image alone cannot establish.
7. Adjust five major service levers:
   - cleansing;
   - exfoliation;
   - water and steam;
   - pressure and tempo;
   - product placement and finish.
8. Adapt one service by region rather than treating the entire scalp as though every area has the same need.
9. Preserve stable areas instead of adding unnecessary corrective steps.
10. Reduce oil and visible residue without claiming that a follicle is clogged, that hair growth is impaired, or that cleansing causes guaranteed rebound oil production.
11. Respond conservatively to reported stinging, burning, tenderness, itching, heat, or a recent reaction.
12. Explain a modified or paused service in language that protects client trust without diagnosing or sounding alarmist.
13. Recognize when Module 4’s preserve / modify / avoid / pause / refer framework overrides the client’s request for a more aggressive service.
14. Choose product and technique categories for a clear reason while following license limits, training, manufacturer directions, and applicable rules.
15. Demonstrate protocol judgment through two applied open-response checkpoints.

---

## Keep unchanged

Preserve the following concepts and technical structures:

- Technical module ID `5`.
- Wrapper ID `module5Wrap`.
- Checkpoint IDs:
  - `m5cp1`
  - `m5cp2`
- Completion-card ID `m5Complete`.
- Existing Module 5 progress keys, stored checkpoint state, routing, and Module 6 unlock relationship.
- Existing students who have already passed either Module 5 checkpoint must remain passed.
- Two required open-response checkpoints.
- Module 4 as the prerequisite.
- Module 6 as the next module.
- The central progression:
  - Module 4 teaches the student how to observe;
  - Module 5 teaches the student how to adapt the cosmetic service.
- The correct current insight that most clients do not present as one uniform category across the entire scalp.
- The principle that strong practitioners change the service based on what they observe and what the client reports.
- The principle that sensitivity or reactivity takes priority over aggressive cleansing, exfoliation, heat, or pressure.
- The principle that client education is part of responsible protocol selection.
- The ability to preserve a stable presentation rather than treating every client as a corrective project.

Do not rename the module ID, checkpoint IDs, completion-card ID, progress keys, or stored checkpoint keys merely to normalize implementation.

Do not add a third required checkpoint.

---

## Required corrections

### 1. Replace “scalp types” with current scalp patterns and service directions

The current module teaches five named scalp types as though they are stable, mutually exclusive identities.

Replace that structure with **common scalp patterns and service directions**.

Approved student-facing pattern language:

- Baseline / maintenance presentation
- Oil-dominant or residue-present presentation
- Fine-scale / dry-appearing presentation
- Mixed regional presentation
- Reactive presentation or sensitivity reported

These are not diagnoses and are not permanent client identities.

A client may show more than one pattern at the same appointment. The approved protocol model must begin with the current region, current symptoms, recent history, and safest service limit.

### 2. Rename the module

Replace:

> Module 5 — Scalp Types & Protocols

with:

> **Module 5 — Scalp Patterns & Service Adaptation**

Replace the dashboard subtitle:

> Neutral, oily, dry, combination, sensitive

with:

> **Translate regional findings into cosmetic service decisions**

Use the same approved title on the dashboard, lesson navigation, hero eyebrow, Cadence prompts, completion logic, and documentation.

Do not use `Treatment Protocols` in the title. The module teaches cosmetic service adaptation, not medical treatment.

### 3. Remove the fake interaction and all empty media placeholders

Remove:

> ↓ Tap each type to see the protocol

unless a real approved interaction is implemented in that exact location.

Remove the eight decorative “microscopy photo” placeholder boxes. They contain no real image and currently imply that visual evidence exists when it does not.

Do not replace them with fabricated clinical photographs, stock images presented as microscopy, or unlabeled generated imagery.

Module 5 may be implemented successfully without new media. The approved decision interaction and protocol cards should carry the learning value.

A future authenticated-image intake may add Module 5 imagery later, but that is not required for this implementation.

### 4. Align Module 5 with Module 4’s observation language

Module 5 must not reverse Module 4’s approved corrections.

Carry forward:

- AIMT Five-Point Scalp Assessment;
- assessment areas;
- assessment points;
- regions;
- baseline views;
- five observation lenses;
- appearance examples;
- supported observation;
- context still needed;
- what the image does not prove;
- preserve / modify / avoid / pause / refer.

Do not restore:

- `clogged follicle`;
- `proven congestion`;
- `sensitive scalp` as a conclusion from color alone;
- `dehydration` as something a magnified image proves;
- `inflammation` as a cosmetic diagnosis;
- one-label whole-scalp thinking.

### 5. Correct the baseline presentation

Remove universal claims that a balanced scalp must show:

- a soft pink tone;
- a translucent appearance;
- visible evidence of healthy circulation;
- a particular amount of shine;
- a visually provable intact hydrolipid film.

Baseline color and reflectivity vary with skin tone, pigmentation, lighting, device settings, pressure, recent heat, product, sweat, and other factors.

The approved baseline lesson is:

- compare the client with their own surrounding regions;
- look for the absence of a dominant cosmetic concern;
- confirm that the client reports comfort;
- preserve what is already working;
- do not add exfoliation, strong cleansing, or corrective products simply to make the service feel more advanced.

### 6. Correct oil and residue claims

Remove or rewrite the following claims:

- visible material proves sebum;
- visible material proves follicular congestion;
- a follicle can be declared obstructed from appearance alone;
- visible oil or residue compromises hair growth;
- over-cleansing automatically causes compensatory oil production;
- one fixed percentage increase in sebum applies to every temperature change and every client;
- fried, spicy, or sugary foods can be assigned as the cause of the client’s oil production;
- postpartum or other hormonal changes may be identified as the cause from a head-spa assessment.

Approved framing:

- diffuse shine, coating, adherent material, or slick roots may justify a more thorough or more targeted cosmetic cleanse;
- visible material may include sebum, sweat, scale, environmental material, cosmetic residue, or a combination;
- ask about wash timing, dry shampoo, root products, exercise, work environment, headwear, and recent product use;
- heat and humidity can influence sweat, perceived greasiness, and surface conditions, but the module should not teach a universal numerical rule;
- harsh or overly frequent cleansing may contribute to dryness, irritation, discomfort, and barrier disruption;
- the course must not promise or require a rebound-oil mechanism.

### 7. Correct dry-appearing and fine-scale claims

Remove:

- the unsupported “60 to 90 percent of follicles” criterion;
- claims that a matte appearance proves barrier depletion;
- claims that fine scale proves dehydration;
- claims that every dry scalp is sensitive;
- claims that exfoliation is required so hydrating products can penetrate;
- claims that a cosmetic service repairs the hydrolipid film long-term;
- dietary or vitamin advice presented as a scalp protocol.

Approved framing:

- a matte surface, fine loose scale, and little visible surface shine may support a **fine-scale / dry-appearing** description;
- ask about tightness, itching, burning, wash frequency, cleansing products, chemical services, weather, heat styling, and recent reactions;
- reduce unnecessary cleansing intensity;
- do not exfoliate reflexively because scale is present;
- use exfoliation only when allowed, tolerated, and appropriate for the visible surface and client history;
- favor comfort, controlled water temperature, gentle contact, and compatible cosmetic conditioning or hydration;
- do not diagnose dandruff, dermatitis, dehydration, or barrier disease in this module.

### 8. Correct reactive and sensitivity language

A magnified image cannot prove sensitivity, inflammation, infection, or a fragile barrier.

Use a combined evidence standard:

- visible difference from the client’s surrounding baseline;
- client-reported stinging, burning, tenderness, itching, heat, tightness, or recent reaction;
- recent chemical service, product change, scratching, friction, or heat exposure;
- visible signs that require Module 4’s pause / refer framework.

Approved service response:

- reduce stimulation;
- lower heat;
- use cooler or comfortably lukewarm water;
- avoid aggressive exfoliation;
- avoid firm massage over the area;
- use fewer, familiar, compatible products;
- pause when the client’s symptoms or visible presentation make proceeding inappropriate;
- refer when broken, bleeding, weeping, oozing, draining, pustular, severely painful, rapidly worsening, or otherwise outside cosmetic service limits.

Do not teach `botanical calming agents` as universally safe. Plant-derived ingredients can also irritate or sensitize.

### 9. Move named dandruff and Malassezia teaching to Module 6

Remove the current Cadence statement that:

> Dandruff is driven by excess oil.

That sentence is too absolute and introduces named-condition teaching before Module 6.

Module 5 may say:

> Fine scale, adherent flakes, oil, residue, and client-reported itch can overlap. Do not assign dandruff, seborrheic dermatitis, or another named condition from this module’s cosmetic pattern framework.

Detailed dandruff, Malassezia, seborrheic dermatitis, and differential-condition content belongs in Module 6 after that module is separately extracted and audited.

### 10. Replace ingredient prescriptions with formulation and technique decisions

The current protocol cards lead too heavily with individual ingredients.

Module 5 should teach the practitioner to choose a **product category and technique for a reason**, not memorize a universal active for a label.

Approved decision categories:

- gentle routine cleansing;
- targeted or more thorough cosmetic cleansing;
- optional compatible exfoliation;
- conditioning or hydration support;
- low-stimulation or minimal-product service;
- lightweight versus richer finish;
- localized application versus full-scalp application.

Any specific product or ingredient used in practice must follow:

- the practitioner’s license and legal scope;
- training;
- manufacturer directions;
- contraindications;
- patch-testing requirements when applicable;
- client allergies and sensitivities;
- service compatibility;
- local rules.

Do not turn Module 5 into a product-chemistry or medical-treatment module.

### 11. Make the service levers explicit

Teach five controllable service levers:

1. **Cleansing**  
   How thorough, how often, and where.

2. **Exfoliation**  
   Whether it belongs at all, where it belongs, how gentle it should be, and how long it remains in contact.

3. **Water and steam**  
   Temperature, duration, distance, and whether heat should be reduced or omitted.

4. **Pressure and tempo**  
   How much mechanical stimulation the client and current region can tolerate.

5. **Product placement and finish**  
   Which regions receive product, how much is used, and whether the finish should remain lightweight or more conditioning.

The student should understand that protocol adaptation is often a change in intensity, placement, duration, or omission—not an entirely different service menu.

### 12. Replace the existing priority order

Replace the current sequence beginning with “Sensitivity / inflammation” and ending with “Oil control.”

Use the approved decision order:

1. **Safety limit**  
   Is there any reason to avoid the area, pause, or refer?

2. **Client comfort and reactivity**  
   Is the client reporting stinging, burning, tenderness, itching, heat, or a recent reaction?

3. **Surface tolerance**  
   Will cleansing, exfoliation, heat, or friction likely make the current presentation less comfortable?

4. **Visible service need**  
   What oil, residue, scale, or regional difference can be addressed cosmetically and conservatively?

5. **Client preference and maintenance goal**  
   Within the limits above, what experience or maintenance outcome does the client want?

Approved memory line:

> **Limit first. Priority second. Region by region.**

Do not use color alone to communicate the order.

### 13. Add a meaningful ungraded protocol-decision interaction

Replace the dead tap hint with the approved interaction:

> **What changes first?**

This is the signature learning moment for Module 5.

The student reviews four short scenarios and chooses the first responsible service direction.

The interaction must require judgment, provide specific feedback, and allow retry.

It must not:

- write progress;
- persist;
- gate completion;
- create a score;
- award points, streaks, badges, or confetti.

The exact interaction specification appears below.

### 14. Correct checkpoints and grading

Both checkpoint questions must be identical in:

- visible course copy;
- `M5.questions`;
- Review Mode;
- grading prompt;
- implementation documentation.

Replace the shared `M5.system` rubric with checkpoint-specific rubrics.

Each rubric must:

- assess only the competency asked by that checkpoint;
- accept accurate reasoning without exact phrasing;
- ignore grammar, spelling, brevity, and natural spoken wording;
- return one focused revision request when incomplete;
- immediately correct diagnostic, unsafe, or unsupported claims;
- avoid requiring a product brand or named ingredient;
- use the correct course name;
- state that Cadence does not claim personal practitioner experience.

### 15. Correct Cadence identity

Remove:

- `instructor of HeadSpa Mastery`;
- `a mentor built from nearly two decades in the head spa industry`;
- any phrasing that assigns the instructor’s human history to Cadence.

Cadence is AIMT’s curriculum-grounded guide.

Cadence may say:

> Your guidance is built from AIMT’s approved curriculum and the instructor’s applied experience. You do not claim that experience as your own.

### 16. Correct accessibility and semantic styling

Add:

- `aria-label="Speak your answer"` to both voice controls;
- `aria-label="Send response to Cadence"` to both checkpoint submit controls;
- `aria-live="polite"` to both checkpoint feedback regions;
- visible focus;
- logical keyboard order;
- text feedback that does not rely on color;
- comfortable touch targets;
- no horizontal overflow.

Use the approved shared semantic colors:

- Green: `#3a5a3a`
- Green light: `#e8ede8`
- Red: `#7a3030`
- Red light: `#f0e8e8`
- Shared warm amber or ochre for caution
- Charcoal or taupe for neutral information

Replace the pre-baseline bright red priority dot. Do not use color as the only indicator of priority, correctness, warning, or prohibition.

### 17. Remove confirmed dead state when safe

`window._m5cpsDone` currently has one assignment and no reads.

It may be removed if repository-wide validation confirms that it has no call site, no external reference, and no progress-state function.

Do not remove any stored checkpoint or completion state.

---

# Final replacement copy

The following copy is controlling student-facing Module 5 content.

Implementation may adjust only minor punctuation, responsive line breaks, or button text required for accessibility. Do not paraphrase substantive content without updating this specification.

---

## Dashboard

**Title**

> Module 5 — Scalp Patterns & Service Adaptation

**Subtitle**

> Translate regional findings into cosmetic service decisions

---

## Hero

**Eyebrow**

> Module 5 · Scalp Patterns & Service Adaptation

**Title**

> Read the pattern.  
> Adjust the service.

**Description**

> Module 4 taught you how to gather and describe evidence. Now you will turn supported observations, client-reported experience, and regional differences into a cosmetic service plan. The goal is not to assign one permanent scalp type. The goal is to make each step earn its place.

---

## 5.1 — A protocol is a decision, not a label

**Section eyebrow**

> 5.1 · From evidence to action

**Headline**

> The scalp does not need a label. The service needs a reason.

**Body**

> A useful assessment changes what you do next. It may change how thoroughly you cleanse, whether you exfoliate, how much heat you use, where you place product, how much pressure you apply, or whether you pause the service entirely.
>
> The weak approach is to notice one feature, assign one type, and run the same protocol across the entire scalp. The stronger approach is to combine what is visible with what the client reports, what happened recently, and how each region responds.
>
> One client may show diffuse shine at the crown, fine loose scale near the hairline, and no discomfort anywhere. Another may show very little visible buildup but report burning after a recent product change. Those clients do not need the same service—and neither one can be reduced to one word.

**Decision card**

> **Ask four questions before you choose a step**
>
> 1. What is visibly present?
> 2. What does the client report?
> 3. What is the safest service limit?
> 4. What should change in this region?

**Key line**

> **Limit first. Priority second. Region by region.**

---

## 5.2 — The five service levers

**Section eyebrow**

> 5.2 · What you can actually change

**Headline**

> Most protocol changes come from five levers.

**Intro**

> Skilled customization is usually not a completely different service. It is a deliberate change in intensity, placement, duration, or omission.

### Lever 1 — Cleansing

> Decide how thorough the cleanse should be, whether one region needs more attention than another, and whether repeating a cleanse is appropriate. More lather is not the goal. A clean, comfortable finish is.

### Lever 2 — Exfoliation

> Decide whether exfoliation belongs at all. If it does, choose the region, method, intensity, and contact time carefully. Visible scale is not automatic permission to exfoliate.

### Lever 3 — Water and steam

> Adjust temperature, duration, and distance. Heat can increase comfort for some clients and increase discomfort for others. Steam is optional—not proof that the service is more advanced.

### Lever 4 — Pressure and tempo

> Adjust mechanical stimulation to the client’s comfort and the current region. Pressure is not a corrective tool. Firm massage should never be used to overpower tenderness, burning, or a reactive presentation.

### Lever 5 — Product placement and finish

> Choose where product belongs, how much is needed, and whether the finish should be lightweight, conditioning, or minimal. Whole-scalp application is not automatically more thorough.

**Info card**

> **Product comes after the decision.**
>
> Do not choose the protocol because you want to use a particular product. Choose the service direction first, then select a compatible product category within your license, training, and manufacturer instructions.

---

## 5.3 — Establish the limit before the goal

**Section eyebrow**

> 5.3 · Priority order

**Headline**

> The safest limit outranks the client’s request.

**Intro**

> Clients may ask for the deepest cleanse, the strongest exfoliation, maximum steam, or firm pressure. Their preference matters—but it does not override what the assessment and consultation tell you is appropriate today.

### 1. Safety limit

> Is there any reason to avoid the area, pause, or refer? Broken, bleeding, weeping, oozing, draining, pustular, severely painful, rapidly worsening, or otherwise concerning findings do not need a stronger cosmetic protocol.

### 2. Client comfort and reactivity

> Ask about stinging, burning, tenderness, itching, heat, tightness, recent chemical services, scratching, friction, or a recent product reaction.

### 3. Surface tolerance

> Consider whether cleansing, exfoliation, heat, or friction is likely to make the current presentation less comfortable.

### 4. Visible cosmetic need

> Decide what oil, residue, loose scale, or regional difference can be addressed conservatively within the service.

### 5. Client preference and maintenance goal

> Once the limits are clear, shape the experience around the client’s comfort, maintenance needs, and desired level of relaxation.

**Cadence note**

> The strongest service is not the one with the most steps. It is the one in which every step has a reason and nothing is added simply to prove value.

---

## 5.4 — Five common service directions

**Section eyebrow**

> 5.4 · Patterns, not permanent types

**Headline**

> Read the dominant need without forcing the whole scalp into it.

### A. Baseline / maintenance presentation

**What may be present**

> No dominant cosmetic concern, no meaningful regional difference, and no reported discomfort. The client may simply want relaxation, maintenance, and a consistent routine.

**Context still needed**

> Wash timing, recent product use, service goal, allergies, sensitivities, and any recent chemical service.

**Responsible service direction**

> Preserve. Use a gentle, non-disruptive cleanse, avoid unnecessary exfoliation, and let the service focus on comfort and maintenance.

**Do not conclude**

> That the scalp has one universal “healthy” color or that every corrective step should be added because the client paid for a premium service.

---

### B. Oil-dominant or residue-present presentation

**What may be present**

> Diffuse shine, slick roots, visible coating, adherent surface material, or heavier material in selected regions.

**Context still needed**

> Wash timing, dry shampoo, root products, exercise, sweat, work environment, headwear, recent styling products, and whether the material changes after cleansing.

**Responsible service direction**

> Cleanse thoroughly but proportionately. Use targeted product placement, repeat cleansing only when appropriate, consider compatible localized exfoliation when the surface is intact and comfortable, rinse fully, and avoid leaving an unnecessarily heavy finish.

**Do not conclude**

> That the follicles are clogged, that visible material is definitely sebum, that hair growth is being blocked, or that cleansing will trigger guaranteed compensatory oil production.

---

### C. Fine-scale / dry-appearing presentation

**What may be present**

> A matte surface, fine loose scale, little visible surface shine, or a client report of tightness.

**Context still needed**

> Itching, burning, tenderness, cleansing frequency, shampoo type, chemical services, weather, heat styling, recent product changes, and whether scale is loose or adherent.

**Responsible service direction**

> Lower unnecessary cleansing intensity, use comfortable water temperature, reduce friction, choose a compatible conditioning or hydration-supportive cosmetic product, and exfoliate only when the area is intact, comfortable, and appropriate for the product and service.

**Do not conclude**

> That the image proves dehydration, a damaged barrier, dandruff, dermatitis, or a need for exfoliation.

---

### D. Mixed regional presentation

**What may be present**

> Shine or residue in one region and fine scale, matte appearance, or greater sensitivity in another.

**Context still needed**

> Regional product placement, wash habits, dry shampoo use, chemical-service history, styling patterns, friction, and symptoms by area.

**Responsible service direction**

> Map the regions. Cleanse, exfoliate, condition, or reduce stimulation only where each decision is earned. One client may receive more thorough cleansing at the crown, a gentler approach at the hairline, and a maintenance approach elsewhere.

**Do not conclude**

> That one dominant feature should control the protocol across the entire scalp.

---

### E. Reactive presentation or sensitivity reported

**What may be present**

> A visible difference from surrounding baseline combined with client-reported stinging, burning, tenderness, itching, heat, tightness, or a recent reaction.

**Context still needed**

> Recent chemical service, product change, heat exposure, scratching, friction, known allergies, symptom severity, broken skin, drainage, pustules, crusting, or rapid worsening.

**Responsible service direction**

> Reduce stimulation. Lower heat, use cooler or comfortably lukewarm water, avoid aggressive exfoliation, avoid firm massage over the area, and use fewer familiar compatible products. Pause or refer when the presentation falls outside cosmetic service limits.

**Do not conclude**

> That visible color alone proves sensitivity, inflammation, infection, or the medical cause.

---

## Approved interaction — “What changes first?”

**Placement**

Immediately after Section 5.4 and before Section 5.5.

**Intro copy**

> **What changes first?**
>
> Choose the first responsible service direction. You are not diagnosing the scalp. You are deciding what the current evidence allows you to do next.

### Scenario 1

> The five-point assessment shows no dominant concern or meaningful regional difference. The client reports no discomfort and wants a relaxation-focused service.

**Choices**

- Add a strong exfoliation so the service feels complete
- Preserve the current presentation and customize for relaxation
- Use a clarifying protocol to prevent future buildup

**Approved answer**

> Preserve the current presentation and customize for relaxation.

**Feedback**

> Correct. A stable presentation does not need to be turned into a corrective project. Gentle cleansing, comfort, and maintenance are enough.

**Incorrect-choice feedback**

- "Add a strong exfoliation so the service feels complete" → Not quite. No finding currently earns a stronger corrective step. Adding exfoliation simply to make the service feel complete would override the evidence rather than respond to it. Try again.
- "Use a clarifying protocol to prevent future buildup" → Not quite. The current assessment does not show a need for corrective cleansing. Preserve the stable presentation instead of treating a future problem that has not been observed. Try again.

### Scenario 2

> The crown shows diffuse shine and visible surface residue. The sides and hairline look close to the client’s baseline. The client reports no burning, tenderness, or recent reaction and says they used dry shampoo this morning.

**Choices**

- Use targeted cleansing at the crown and keep the remaining regions gentle
- Exfoliate the entire scalp aggressively
- Tell the client the crown follicles are clogged

**Approved answer**

> Use targeted cleansing at the crown and keep the remaining regions gentle.

**Feedback**

> Correct. The recent dry-shampoo history and regional difference support targeted cleansing. The image does not prove clogged follicles or justify whole-scalp overcorrection.

**Incorrect-choice feedback**

- "Exfoliate the entire scalp aggressively" → Not quite. The finding is regional, and the recent dry-shampoo history gives useful context. Whole-scalp aggressive exfoliation would overcorrect areas that do not show the same need. Try again.
- "Tell the client the crown follicles are clogged" → Not quite. Visible shine and residue do not prove that follicles are clogged. Stay with what you can observe and choose a cosmetic service adjustment from that evidence. Try again.

### Scenario 3

> The hairline shows fine loose scale. The client reports burning after starting a new product three days ago.

**Choices**

- Exfoliate the scale first so hydration can penetrate
- Reduce stimulation, avoid aggressive exfoliation, and reassess whether the service should continue
- Increase steam to soften the area

**Approved answer**

> Reduce stimulation, avoid aggressive exfoliation, and reassess whether the service should continue.

**Feedback**

> Correct. The client’s burning changes the priority. Comfort and safety come before scale removal.

**Incorrect-choice feedback**

- "Exfoliate the scale first so hydration can penetrate" → Not quite. The client's burning changes the priority. Visible scale is not automatic permission to exfoliate, especially when the area is currently reactive or uncomfortable. Try again.
- "Increase steam to soften the area" → Not quite. More heat is not the responsible first move when the client is reporting burning. Reduce stimulation and reassess before adding intensity. Try again.

### Scenario 4

> One assessment area is broken, moist, and visibly draining.

**Choices**

- Avoid only that small spot and complete the rest of the service
- Clean the area thoroughly before proceeding
- Stop contact with the area, pause the service, and refer appropriately

**Approved answer**

> Stop contact with the area, pause the service, and refer appropriately.

**Feedback**

> Correct. A cosmetic protocol is not the next step when the skin is broken and draining.

**Incorrect-choice feedback**

- "Avoid only that small spot and complete the rest of the service" → Not quite. Broken, draining skin changes the service limit. This is not a situation where the practitioner simply works around the area and continues as usual. Try again.
- "Clean the area thoroughly before proceeding" → Not quite. A cosmetic head spa service should not be used to clean or treat broken, draining skin. Stop contact, pause the service, and use the appropriate referral pathway. Try again.

**Interaction behavior**

- Use semantic buttons.
- Support mouse, keyboard, and touch.
- Announce feedback in a polite live region.
- Include a reset control.
- Allow retry.
- Do not persist.
- Do not write progress.
- Do not gate completion.
- Do not show a score.
- On selection, apply state only to the selected option — the approved answer is never highlighted, tagged, or revealed until the student selects it themselves; every other option (including previously selected ones) returns to neutral on each new selection.
- An incorrect selection shows the "Not quite" state on that option and its own choice-specific feedback beginning "Not quite." — this feedback explains why that option is not the responsible first move without naming or describing the approved answer.
- A correct selection shows the "Correct answer" state on that option and its feedback beginning "Correct." followed by the approved explanation.

---

## 5.5 — Build the service by region

**Section eyebrow**

> 5.5 · One appointment, more than one approach

**Headline**

> The protocol can change without the service feeling fragmented.

**Body**

> Regional customization should feel intentional, not improvised. Use the same service structure, then adjust the levers by area.
>
> You might cleanse the crown more thoroughly, skip exfoliation near a reactive hairline, lower pressure at the temples, and use a lighter finish at the roots. The client still experiences one cohesive service. The practitioner simply stops pretending that every square inch has the same need.

**Protocol builder**

### Preserve

> Keep the steps and regions that are already appropriate. Do not remove a comfortable, effective part of the service just because another area needs modification.

### Modify

> Change intensity, placement, duration, temperature, pressure, or product amount.

### Avoid

> Omit a step that is unnecessary, incompatible, or likely to increase discomfort.

### Pause

> Stop when new symptoms, visible changes, contamination, or client discomfort make continuing inappropriate.

### Refer

> Recommend medical evaluation when the presentation is outside cosmetic assessment or service limits.

**Practitioner note**

> Document the regional decision in plain language: what you observed, what the client reported, and what you changed. Do not document a diagnosis you are not qualified to make.

---

## Midpoint checkpoint — `m5cp1`

**Visible and evaluated question — exact string**

> During the five-point assessment, the crown shows diffuse shine and visible surface residue, while the sides and hairline show fine loose scale and little visible shine. The client reports no burning, tenderness, or recent reaction. How would you adapt the service by region, and what whole-scalp mistake are you avoiding?

The full checkpoint specification appears below.

---

## 5.6 — Product choice follows the protocol decision

**Section eyebrow**

> 5.6 · Choose a function, not a fantasy

**Headline**

> The right product is the one that supports the decision you already made.

**Body**

> Product knowledge matters, but product enthusiasm can distort judgment. A practitioner who starts with the bottle often finds a reason to use it. Start with the service need instead.
>
> Choose a product category based on what the current region can tolerate and what you are trying to accomplish cosmetically.

### Gentle routine cleansing

> Appropriate when the goal is maintenance, comfort, or a non-disruptive reset.

### Targeted or more thorough cosmetic cleansing

> Appropriate when visible oil or residue and client history support a stronger cleanse in selected regions.

### Optional compatible exfoliation

> Appropriate only when the skin is intact, the client is comfortable, the method is within scope, and the product directions support its use.

### Conditioning or hydration support

> Appropriate when the goal is comfort, slip, softness, or a less stripping finish. Do not describe the product as treating a medical barrier disorder.

### Minimal-product service

> Appropriate when the client reports recent reactivity, when product history is unclear, or when adding more variables would make the response harder to interpret.

**Boundary note**

> Specific ingredients, medicated claims, and condition-directed products may carry license, labeling, contraindication, or manufacturer requirements. Follow the product—not a social-media protocol.

---

## 5.7 — Steam, water, pressure, and time

**Section eyebrow**

> 5.7 · Intensity is part of the protocol

**Headline**

> More heat, more pressure, and more time do not equal more expertise.

### Steam

> Steam may support comfort or help soften some surface product and residue, but it is optional. Reduce or omit it when the client reports heat sensitivity, burning, tenderness, or a recent reaction. Do not say steam opens pores or detoxifies the scalp.

### Water temperature

> Comfortably lukewarm is a useful default. Use cooler water when heat increases discomfort. Avoid very hot water on a reactive or uncomfortable area.

### Pressure

> Pressure should remain controlled and responsive to client feedback. Do not use firm massage as a corrective response to oil, scale, or residue.

### Time

> Longer contact is not automatically better. Follow manufacturer directions and use the shortest effective step that supports the service goal.

**Key line**

> **The protocol is not the number of steps. It is the quality of the decisions between them.**

---

## 5.8 — Explain the change without losing the client

**Section eyebrow**

> 5.8 · Client communication

**Headline**

> Redirect the method without dismissing the goal.

**Body**

> Clients often ask for intensity because they associate intensity with results. Your job is not to argue with the goal. Your job is to explain why a different method is the better fit today.

### Mixed-regional script

> “Your scalp is not presenting the same way in every area today. I’m going to cleanse the crown more thoroughly, keep the hairline gentler, and adjust the product placement so we do not overcorrect the areas that do not need it.”

### Lower-intensity script

> “You asked for the deepest version of the service. Based on what you’re feeling and what I’m observing, the stronger exfoliation, maximum steam, and firm pressure are not the best fit today. I can still give you a complete service, but I’m going to lower the heat, reduce stimulation, and focus on a gentle cleanse and comfort.”

### Pause-and-refer script

> “I’m seeing an area that is not appropriate for cosmetic treatment today. I do not want to aggravate it or guess at the cause, so I recommend having it evaluated before we continue with scalp services.”

**Cadence note**

> Client satisfaction is not created by saying yes to every requested step. It is created by giving the client a clear reason, a thoughtful alternative when one is appropriate, and a service plan you can defend.

---

## 5.9 — Common mistakes

**Section eyebrow**

> 5.9 · Errors that make protocols less intelligent

**Headline**

> The most common mistake is treating the label instead of the client.

### 1. Label first

> Choosing “oily,” “dry,” or “sensitive” before gathering regional evidence and client history.

**Better move**

> Gather the regional evidence and client context first, then choose the service direction each area actually supports.

### 2. Product first

> Building the explanation around the product you want to use instead of the need you are trying to address.

**Better move**

> Define the service need first, then choose a compatible product category that supports that decision.

### 3. Whole scalp, one intensity

> Applying the strongest regional need across every assessment area.

**Better move**

> Map the regions and adjust cleansing, exfoliation, heat, pressure, and product placement only where the evidence supports it.

### 4. Exfoliating every flake

> Treating visible scale as proof that exfoliation is required.

**Better move**

> Check comfort, skin integrity, client history, and product suitability before deciding whether exfoliation belongs at all.

### 5. Strongest means best

> Assuming maximum steam, repeated cleansing, firm pressure, or more product creates a more valuable service.

**Better move**

> Use the level of cleansing, heat, pressure, time, and product placement the current service goal actually requires—not the maximum available.

### 6. Image becomes diagnosis

> Turning shine, scale, residue, or color change into a medical conclusion.

**Better move**

> Describe what is visible, ask for the missing context, and keep the conclusion inside cosmetic observation.

### 7. Client request becomes permission

> Continuing an inappropriate step because the client asked for it.

**Better move**

> Explain the safer modification, or pause the service when the requested step exceeds the current service limit.

### 8. Improvement becomes cure

> Describing a cleaner appearance or more comfortable service as proof that a condition was treated.

**Better move**

> Describe the cosmetic change you can observe or the comfort the client reports without claiming that a condition was treated or cured.

**Summary card**

> **A strong protocol is explainable.**
>
> You should be able to name what you observed, what context changed your interpretation, what you modified, and what you intentionally left out.

---

## Final checkpoint — `m5cp2`

**Visible and evaluated question — exact string**

> A client reports stinging and tenderness, and you observe a reactive-appearing area. They still ask for the strongest exfoliation, maximum steam, and firm massage. What would you say, how would you modify or pause the service, and what would make you refer instead of proceeding?

The full checkpoint specification appears below.

---

## Completion card — `m5Complete`

**Title**

> Module complete.

**Supporting line**

> Assessment becomes skill when it changes the service responsibly.

**Primary competency statement**

> You can translate regional observations and client feedback into a cosmetic service plan without forcing the scalp into one label.

**Demonstrated competencies**

> You can identify the safest limit, choose the current priority, adapt the five service levers by region, explain a modified plan, and recognize when to avoid, pause, or refer.

**Next-module label**

> Up next — Module 6

**Next-module copy**

> Next, you will examine named scalp conditions and the presentations that are commonly confused with cosmetic patterns. The goal will remain the same: observe carefully, stay within scope, and know when medical evaluation belongs in the plan.

**Buttons**

- `Start Module 6 →`
- `Back to course`

Do not expose Module 6 content beyond this concise approved transition. Module 6 remains unaudited.

---

# Checkpoint specification

## Shared technical requirements

Preserve:

- IDs `m5cp1` and `m5cp2`;
- stored passed state;
- voice input;
- Enter to submit;
- Shift+Enter for a new line;
- Review Mode’s unsaved behavior;
- Module 6 gating only after both checkpoints pass.

Add:

- checkpoint-specific rubrics;
- exact displayed/evaluated question equality;
- module-specific network-error text;
- accessible control labels;
- polite live feedback;
- accepted / needs-revision text states;
- focused revision feedback;
- immediate correction of unsafe or diagnostic claims.

Do not require exact wording, named products, or a minimum sentence count.

### Approved network-error text

> Cadence could not review your protocol decision. Check your connection and try again.

---

## `m5cp1` — Mixed-regional protocol judgment

**Exact question**

> During the five-point assessment, the crown shows diffuse shine and visible surface residue, while the sides and hairline show fine loose scale and little visible shine. The client reports no burning, tenderness, or recent reaction. How would you adapt the service by region, and what whole-scalp mistake are you avoiding?

**Competency assessed**

The student can build a regional cosmetic plan without diagnosing or overcorrecting the entire scalp.

**Pass when the answer demonstrates all of the following, in any natural wording**

1. Recognizes a mixed regional presentation rather than one whole-scalp type.
2. Uses more thorough or targeted cleansing at the crown when appropriate.
3. Uses a gentler approach at the sides and hairline, with no automatic aggressive exfoliation.
4. Adjusts at least one additional service lever appropriately, such as product placement, heat, pressure, or finish.
5. Explicitly avoids treating the entire scalp according to the crown’s dominant feature.
6. Does not diagnose dandruff, dehydration, clogged follicles, or hair-growth obstruction.

**Acceptable reasoning examples**

- Cleanse the crown more thoroughly and keep the hairline gentler.
- Use localized exfoliation only if the crown is intact and comfortable.
- Avoid whole-scalp clarification or exfoliation.
- Use a lighter root finish and more conditioning support only where appropriate.
- Document the regional difference and reassess next visit.

**Immediate correction triggers**

Correct the student immediately if the answer:

- diagnoses dandruff, dermatitis, dehydration, infection, or a medical condition;
- says the follicles are clogged or hair growth is blocked;
- recommends aggressive whole-scalp exfoliation or strong cleansing;
- treats rebound oil as guaranteed;
- ignores the fine-scale regions entirely.

**Focused revision examples**

- “You recognized the mixed presentation. Add how the crown and hairline would receive different cleansing or exfoliation decisions.”
- “Your plan addresses the crown, but it still treats the whole scalp with one intensity. Revise the regional plan.”
- “Keep the observation cosmetic. The image does not prove clogged follicles or dandruff.”

---

## `m5cp2` — Client redirection and service limit

**Exact question**

> A client reports stinging and tenderness, and you observe a reactive-appearing area. They still ask for the strongest exfoliation, maximum steam, and firm massage. What would you say, how would you modify or pause the service, and what would make you refer instead of proceeding?

**Competency assessed**

The student can protect the service limit, communicate clearly, and distinguish a gentler modification from a pause or referral.

**Pass when the answer demonstrates all of the following, in any natural wording**

1. Acknowledges the client’s requested goal without agreeing to unsafe intensity.
2. Explains that reported stinging and tenderness lower the appropriate level of stimulation.
3. Removes or reduces aggressive exfoliation, maximum steam, and firm massage.
4. Offers a gentler compatible plan or pauses when proceeding is not appropriate.
5. Names at least one reason to refer instead of proceeding, such as broken, bleeding, weeping, oozing, draining, pustular, severely painful, rapidly worsening, or otherwise concerning findings.
6. Avoids diagnosing the cause.

**Acceptable reasoning examples**

- Explain that the strongest version is not the best fit today.
- Use cooler water, minimal heat, gentle contact, and fewer familiar products.
- Skip aggressive exfoliation and firm massage.
- Pause if discomfort increases.
- Refer when the skin is broken, draining, pustular, severely painful, or worsening.

**Immediate correction triggers**

Correct the student immediately if the answer:

- performs the requested aggressive service because the client signed consent;
- uses exfoliation to “remove inflammation” or “treat infection”;
- diagnoses the cause of the reaction;
- uses steam or firm pressure to force improvement;
- ignores broken or draining skin;
- promises a cure.

**Focused revision examples**

- “You explained why the strong service is not appropriate. Add the gentler alternative you would offer.”
- “Your modification is clear. Add what finding would make you stop and refer instead.”
- “Keep the language within scope. Describe the presentation and service limit without naming a diagnosis.”

---

# Approved Cadence behavior

## Module-opening greeting

> Module 4 taught you how to gather evidence. Module 5 is where that evidence begins changing the service. The key is not choosing one scalp label—it is deciding what to preserve, modify, avoid, pause, or refer in each region.

## Guide system

Use the following approved intent:

> You are Cadence, AIMT’s curriculum-grounded guide for the Head Spa Certification Course. The student is in Module 5, Scalp Patterns & Service Adaptation. Help the student translate supported observations, client-reported experience, and regional differences into conservative cosmetic service decisions. Use the five service levers: cleansing, exfoliation, water and steam, pressure and tempo, and product placement and finish. Reinforce the order: safety limit, client comfort/reactivity, surface tolerance, visible cosmetic need, then client preference. Do not diagnose, prescribe, claim medical treatment, claim personal practitioner experience, restore the compensatory-oil claim, call follicles clogged, imply hair-growth obstruction, or teach named dandruff/dermatitis content that belongs in Module 6. Your guidance is built from AIMT’s approved curriculum and the instructor’s applied experience; do not claim that experience as your own. Be direct, warm, practical, and concise.

## Approved quick prompts

1. `How do I build one service for a mixed regional presentation?`
2. `When should I skip exfoliation or steam?`
3. `How do I explain a gentler plan without disappointing the client?`

Remove:

- `How do I identify combination scalp?`
- `What causes compensatory oil production?`
- any prompt that restores fixed scalp-type labels or unsupported physiology.

## Cadence response requirements

Cadence should:

- ask for missing context when it changes the service decision;
- distinguish visible evidence from client-reported symptoms;
- help the student change specific service levers;
- give client-facing language when useful;
- reinforce regional adaptation;
- correct diagnostic or unsupported claims immediately;
- remain concise.

Cadence must not:

- use the old course name;
- present itself as a human practitioner;
- claim nearly two decades of personal experience;
- diagnose;
- prescribe;
- identify the cause of oil, scale, color change, or discomfort from an image;
- teach rebound oil as fact;
- describe visible material as proven congestion;
- promise hair-growth or medical outcomes;
- use Module 6’s unaudited content as current authority.

Persistent Cadence threads remain deferred.

---

# Distinct learning rhythm

Module 5 must feel different from Module 4.

Module 4 is observation-led and visual: collect views, describe what is visible, and separate evidence from conclusion.

Module 5 is decision-led: establish the service limit, choose the priority, and adjust the five service levers.

Approved rhythm:

1. Short conceptual reset: protocol is a decision, not a label.
2. Five service levers.
3. Safety and priority order.
4. Five common service directions.
5. Signature ungraded decision interaction: **What changes first?**
6. Regional protocol builder.
7. Midpoint checkpoint `m5cp1`.
8. Product and intensity decisions.
9. Client communication.
10. Common mistakes.
11. Final checkpoint `m5cp2`.
12. Competency-based completion card.

Do not add decorative clicks or a second large interaction merely to increase activity.

---

# Insider value and acceleration payoff

## Strongest practitioner knowledge

- The safest limiting factor should be identified before the treatment goal.
- The client’s scalp can require different intensity, product placement, or omission by region.
- A premium service is not defined by performing every available step.
- Product selection should follow the service decision rather than create it.
- Reported burning or tenderness can outweigh a visually minor presentation.
- Visible scale is not automatic permission to exfoliate.
- Dry shampoo and styling residue can create a different decision than oil alone.
- A complete service can remain cohesive even when the protocol changes by region.
- Client trust is protected by explaining the reason for a modification, not by performing an inappropriate requested step.

## Errors prevented

This module should prevent students from:

- forcing the whole scalp into one label;
- treating the loudest feature everywhere;
- diagnosing from shine, scale, residue, or color;
- calling follicles clogged;
- promising hair-growth effects;
- teaching compensatory oil as settled physiology;
- exfoliating every flaky presentation;
- using maximum heat or pressure as proof of value;
- choosing products before defining the need;
- continuing because the client requested intensity;
- turning a visibly cleaner result into a treatment or cure claim.

## How the module reduces trial and error

The student leaves with a reusable protocol-construction model:

> **Limit first. Priority second. Region by region.**

The five service levers turn vague customization into concrete choices. Instead of learning one fixed protocol for each label, the practitioner learns how to adjust the same service safely and intentionally across real mixed presentations.

---

# Guided Completion Path fields

Implementation of the Guided Completion Path remains deferred.

## Estimated attentive learning time

Approximately **18–24 minutes** for the instructional content and ungraded decision interaction.

This is an estimate from content volume and interaction density, not a measured completion time.

## Estimated checkpoint time

Approximately **8–12 minutes** total for both open-response checkpoints, excluding retries or network delay.

## Suggested hands-on practice

Approximately **20–30 minutes** with a model or training partner:

1. Complete the five-point assessment.
2. Record one supported observation per region.
3. Ask about symptoms, recent product use, wash timing, and recent chemical services.
4. Identify the safest limit and current priority.
5. Build a regional plan across the five service levers.
6. Explain the plan aloud without using a diagnosis.

This practice is recommended, not a required progress gate in the current implementation.

## Competency demonstrated

The student can translate regional observations and client context into a conservative cosmetic service plan, communicate a modification, and recognize when to avoid, pause, or refer.

## Earlier concepts to revisit

- Module 1:
  - observation versus diagnosis;
  - referral language;
  - license-dependent scope.
- Module 3:
  - scalp barrier and surface environment;
  - limits of massage and hair-growth claims.
- Module 4:
  - five-point assessment;
  - observation lenses;
  - appearance examples;
  - image limits;
  - preserve / modify / avoid / pause / refer.

## Suggested course-path position

Immediately after Module 4 and before Module 6.

Module 5 is the bridge between observation and named-condition education.

---

# Listen Mode notes

Listen Mode implementation remains deferred.

## Narration suitability

Most of Module 5 is suitable for narration.

Estimated narration length:

**11–14 minutes**, excluding interaction feedback and checkpoints.

This is a content-based estimate, not a measured recording duration.

## Visual-review cues

Narration should tell the listener to review the screen for:

- the five service levers;
- the five common service directions;
- the decision-priority order;
- the regional protocol builder;
- the common-mistakes list.

## Screen-required content

The following require the screen:

- the **What changes first?** interaction;
- checkpoint `m5cp1`;
- checkpoint `m5cp2`;
- any visual status or feedback state.

Listening alone must not complete or prove competency.

## Video-only content

None required.

The opening-video workflow is separate and should not delay Module 5 implementation.

---

# Downloadable resource opportunity

## Recommendation

Create one future practical resource:

> **AIMT Regional Service Adaptation Guide**

## Practical value

This module contains a true repeated-use practitioner tool. The guide would help a practitioner move from assessment notes to a treatment-room plan without reopening the full module.

## Approved contents

- safety-limit check;
- five service levers;
- baseline / oil-residue / fine-scale-dry-appearing / mixed-regional / reactive service directions;
- preserve / modify / avoid / pause / refer framework;
- brief regional planning fields;
- client communication prompts;
- reminder that the guide supports cosmetic decisions and does not diagnose.

## Format

- polished accessible PDF;
- editable source;
- elevated clinical-editorial AIMT design;
- warm neutral palette;
- generous whitespace;
- practitioner-first language;
- no generic worksheet aesthetic.

## Lesson placement

Mention after Section 5.5, after the student has learned the regional protocol builder.

## Future dashboard location

Place inside the future approved Module 5 student-resource folder.

Do not link or create an empty download button until the final approved resource file exists.

The downloadable is not required for the initial Module 5 implementation.

---

# Implementation notes

## Technical preservation

Preserve:

- module ID `5`;
- wrapper ID `module5Wrap`;
- checkpoint IDs `m5cp1` and `m5cp2`;
- completion-card ID `m5Complete`;
- routing;
- Module 4 prerequisite;
- Module 6 unlock relationship;
- existing passed checkpoint state;
- normal progress behavior;
- Review Mode’s unsaved behavior;
- authentication and entitlement behavior.

## Approved production changes

Implementation may update:

- Module 5 dashboard title and subtitle;
- Module 5 student-facing curriculum;
- Module 5 styles required by the approved structure;
- Module 5 interaction JavaScript;
- `M5.questions`;
- checkpoint-specific `M5.systems`;
- `submitM5CP`;
- Module 5 Cadence guide system;
- Module 5 quick prompts;
- Module 5 greeting;
- checkpoint accessibility;
- Module 5 completion card;
- dead Module 5-only state after validation;
- documentation required by the governing audit workflow.

## Remove from the student experience

- the eight fake microscopy placeholders;
- the dead “Tap each type” hint;
- the fixed five-type grid;
- unsupported physiological claims;
- ingredient-prescription framing;
- the absolute dandruff/Malassezia Cadence note;
- old course-name references;
- Cadence’s personal-experience claim;
- the bright pre-baseline semantic red;
- unsupported hair-growth language;
- universal pink-tone and translucency claims;
- unsupported percentage claims;
- diet and vitamin advice;
- diagnostic `congestion` language.

## Interaction implementation

The **What changes first?** interaction must:

- use real buttons;
- support keyboard and touch;
- expose current state;
- provide text feedback;
- use a polite live region;
- include reset/retry;
- remain ungraded;
- remain nonpersistent;
- never write progress;
- never gate completion;
- avoid animation that conflicts with reduced-motion preferences;
- never highlight, tag, or reveal the approved answer until the student selects it — an incorrect selection shows only that option's own "Not quite" state and choice-specific explanation, and a correct selection shows the "Correct answer" state with its approved explanation, retried and reset back to neutral on each new selection.

## Checkpoint implementation

Create:

- `M5.questions.m5cp1`
- `M5.questions.m5cp2`
- `M5.systems.m5cp1`
- `M5.systems.m5cp2`

The displayed and evaluated strings must be byte-identical.

`submitM5CP(id)` must select the matching question and rubric and pass the approved Module 5 network-error text.

Do not add a third checkpoint.

## Asset implementation

No new Module 5 media asset is required.

Do not create `module-05-assets.md` unless real assets are introduced.

Do not reuse Module 4’s illustrative microscopy images as though they are new Module 5 clinical evidence.

## Styling implementation

Use the existing AIMT course system and shared semantic tokens.

Do not perform a global redesign.

Module 5 should visually emphasize:

- decision order;
- service levers;
- regional adaptation;
- practical protocol cards;
- calm client scripts.

## Documentation

When the approved file is added to the repository and when implementation later changes project status, update as required:

- `docs/course-audit/00-aimt-current-course-status.md`
- `docs/course-audit/modules/README.md`
- `docs/course-audit/implementation-log.md`

Do not begin Module 6.

Do not merge or deploy to `main`.

---

# Acceptance criteria

## Content and sequence

- [ ] Dashboard, lesson navigation, hero, and documentation use **Scalp Patterns & Service Adaptation**.
- [ ] Module 5 no longer teaches five permanent or mutually exclusive scalp types.
- [ ] The section order matches this specification.
- [ ] The final replacement copy is fully implemented.
- [ ] No pre-audit duplicate sections remain.
- [ ] The Module 4 handoff is explicit and accurate.
- [ ] The Module 6 preview remains concise and does not implement unaudited Module 6 curriculum.

## Accuracy and scope

- [ ] No universal pink-tone baseline remains.
- [ ] No `60 to 90 percent` dry-scalp claim remains.
- [ ] No guaranteed compensatory-oil claim remains.
- [ ] No follicular-obstruction or hair-growth-compromise claim remains.
- [ ] No diet, vitamin, postpartum, or hormone cause is assigned from cosmetic assessment.
- [ ] No image is said to prove dehydration, sensitivity, inflammation, infection, dandruff, dermatitis, or barrier disease.
- [ ] No `steam opens pores` or detoxification claim appears.
- [ ] No medical treatment or cure language appears.
- [ ] Named dandruff and Malassezia teaching is deferred to Module 6.
- [ ] Referral and service-limit language remains concise, useful, and within scope.

## Interaction

- [ ] **What changes first?** contains all four approved scenarios.
- [ ] Each scenario requires a real choice.
- [ ] Feedback is specific and text-based.
- [ ] Retry/reset works.
- [ ] Keyboard and touch work.
- [ ] The interaction writes no progress.
- [ ] The interaction does not persist.
- [ ] The interaction does not gate completion.
- [ ] No dead tap hint remains.

## Checkpoints

- [ ] `m5cp1` visible and evaluated questions are byte-identical.
- [ ] `m5cp2` visible and evaluated questions are byte-identical.
- [ ] Rubrics are checkpoint-specific.
- [ ] Strong accurate answers can pass without exact phrasing.
- [ ] Weak answers receive one focused revision request.
- [ ] Grammar, spelling, brevity, non-native English, and natural voice phrasing do not cause unfair failure.
- [ ] Unsafe or diagnostic claims are corrected immediately.
- [ ] Voice input remains available.
- [ ] Enter submits.
- [ ] Shift+Enter creates a new line.
- [ ] Module-specific network-error text is wired.
- [ ] Previously passed checkpoint state restores correctly.
- [ ] Review Mode submissions remain unsaved.
- [ ] Completion appears only after both checkpoints pass.

## Cadence

- [ ] Cadence uses the correct course and module name.
- [ ] Cadence does not claim human practitioner experience.
- [ ] Cadence does not diagnose or prescribe.
- [ ] Cadence does not restore compensatory oil, clogged follicle, or hair-growth claims.
- [ ] Cadence does not teach unaudited Module 6 condition content.
- [ ] All three approved quick prompts are present.
- [ ] Responses help the student reason and adapt service levers.

## Accessibility and responsive behavior

- [ ] Voice buttons have accessible names.
- [ ] Submit buttons have accessible names.
- [ ] Feedback regions use `aria-live="polite"`.
- [ ] Focus is visible.
- [ ] Tab order is logical.
- [ ] Meaning does not depend on color.
- [ ] Approved deep red and green semantic colors are used.
- [ ] Touch targets are comfortable.
- [ ] Cards stack logically on phone.
- [ ] No text is clipped.
- [ ] No horizontal overflow occurs.
- [ ] Reduced-motion behavior is acceptable.

## Completion and regression

- [ ] `m5Complete` appears only after `m5cp1` and `m5cp2` pass.
- [ ] Completion copy names the approved competency.
- [ ] Module 6 remains locked before completion.
- [ ] Module 6 unlocks after completion.
- [ ] Start Module 6 and Back to Course buttons work.
- [ ] Module 4 still opens and functions.
- [ ] Modules 0–4 remain unchanged except for any unavoidable shared-token inheritance already approved.
- [ ] Authentication, entitlements, Review Mode, and progress remain intact.
- [ ] No Module 6 extraction, audit, or implementation begins.
- [ ] No certificate architecture changes.
- [ ] No monolith refactor begins.

---

# Deferred QA and review

Do not falsely mark the following complete unless they are actually performed:

- live-model grading QA;
- screen-reader QA;
- physical-keyboard QA;
- real touch-device QA;
- medical/dermatological review;
- legal and state-specific scope review;
- downloadable-resource production and accessibility QA;
- future authenticated clinical-image intake;
- persistent Cadence thread QA;
- Guided Completion Path QA;
- Listen Mode QA.

Static and mocked validation do not replace manual desktop and phone review.

---

# Audit evidence notes — not student-facing copy

The external audit intentionally removes or softens several claims because the extracted module presented them with more certainty than the available evidence or cosmetic scope supports.

Key evidence considerations:

- Research supports that environmental heat can influence measured sebum and perceived greasiness, but the course should not convert one study-level relationship into a universal per-degree client rule.
- Harsh surfactant exposure can irritate and disrupt skin-barrier function; this does not establish guaranteed compensatory sebum production after over-cleansing.
- Dandruff and seborrheic dermatitis involve interacting host, barrier, sebum, and microbial factors; “dandruff is driven by excess oil” is too absolute and belongs in a separately audited conditions module.
- Sensitive-scalp research supports combining subjective symptoms with objective findings; visible color alone does not prove sensitivity or its cause.
- Scalp surface material and microbiome findings do not authorize a cosmetic practitioner to infer follicular obstruction, impaired hair growth, infection, or a medical diagnosis from magnified appearance.

This evidence review supports conservative curriculum correction. It does not replace the deferred medical/dermatological or legal review.

---

## Approval decision

**Approved for controlled implementation.**

The next repository task is to replace the empty `module-05.md` scaffold with this file, update the governing status documentation, and commit the approved audit specification.

Module 5 implementation must remain a separate task.

Module 6 must not begin.


## External evidence reviewed during audit

These references informed the audit corrections only. They are not student-facing citations and do not replace the deferred medical/dermatological review.

1. Jourdain R, et al. *Exploration of scalp surface lipids reveals squalene peroxide as a potential actor in dandruff condition.* Archives of Dermatological Research. 2016. PMID: 26842231.
2. Kim S, et al. *Influence of exposure to summer environments on skin properties.* Journal of the European Academy of Dermatology and Venereology. 2019. PMID: 31199529.
3. Zhu X, et al. *Acute effects of temperature fluctuations on skin health.* 2026. PMID: 41271145.
4. Draelos ZD. *The effect of a daily facial cleanser for normal to oily skin on the skin barrier of subjects with acne.* Cutis. 2006. PMID: 16910029.
5. Branco N, et al. *Long-term repetitive sodium lauryl sulfate-induced irritation of the skin.* Contact Dermatitis. 2005. PMID: 16283906.
6. Ma L, et al. *Sensitive scalp is associated with excessive sebum and perturbed microbiome.* Journal of Cosmetic Dermatology. 2019. PMID: 30084158.
7. DeAngelis YM, et al. *Three etiologic facets of dandruff and seborrheic dermatitis: Malassezia fungi, sebaceous lipids, and individual sensitivity.* Journal of Investigative Dermatology Symposium Proceedings. 2005. PMID: 16382685.
8. Turner GA, et al. *Stratum corneum dysfunction in dandruff.* International Journal of Cosmetic Science. 2012. PMID: 22515370.
9. Birch MP, et al. *Female pattern hair loss, sebum excretion and the end-organ response to androgens.* British Journal of Dermatology. 2006. PMID: 16403099.
