# Module 4 — Approved Audit Specification

**Course:** AIMT Head Spa Certification Course  
**Module:** 4  
**Approved module title:** Microscopy & Scalp Assessment  
**Source reviewed:** `module-04-source.md`  
**Status:** Approved for controlled implementation  
**Production source of truth:** `headspa-mastery.html`

This document is the approved implementation specification for Module 4. It does not authorize changes to authentication, entitlements, payments, database policies, certificate issuance, unrelated modules, persistent Cadence threads, the Guided Completion Path interface, Listen Mode, the future Module 12 Final Exam, or the dashboard resource-folder system.

Module 4 should feel like an observation laboratory—not a list of scalp labels. The student should leave with a repeatable collection method, a disciplined visual vocabulary, and the judgment to know when magnification should customize, simplify, pause, or stop a service.

---

## Approved outcomes

By the end of Module 4, the student should be able to:

1. Explain the purpose and limits of a scalp-magnification camera in a cosmetic head spa setting.
2. Distinguish cosmetic scalp microscopy from medical trichoscopy and avoid presenting magnification as diagnosis.
3. Introduce the assessment in language that feels calm, useful, and non-alarming.
4. Obtain consent before saving scalp images and handle captured images according to applicable policy, privacy requirements, and client permission.
5. Prepare the hair and device so the image is clear, repeatable, and not distorted by product, lens contamination, unstable positioning, or excessive pressure.
6. Perform AIMT’s five-point scalp scan in a consistent order:
   - frontal hairline;
   - top parting;
   - crown/vertex;
   - temporal area;
   - occipital/back.
7. Add targeted comparison views when the client’s concern or an asymmetry makes them useful.
8. Read each magnified image through five observation lenses:
   - scalp surface;
   - follicular openings;
   - perifollicular area;
   - hair shafts;
   - distribution.
9. Separate a supported visual observation from a working question and an unsupported conclusion.
10. Describe visible oil, scale, residue, color change, follicular material, and regional differences without converting them into a diagnosis.
11. Understand that one scalp can present differently in different regions and should not be forced into one label from one image.
12. Recognize that oil, scale, product residue, color change, and discomfort can overlap and require client history before the service is adjusted.
13. Recognize visible findings that require the practitioner to simplify, avoid an area, pause the assessment, or refer for medical evaluation.
14. Explain why an honest before-and-after comparison requires the same location, magnification, lighting, pressure, orientation, and image conditions.
15. Translate magnified observations into calm client-facing language.
16. Demonstrate that assessment is valuable only when it changes a responsible service decision.

---

## Keep unchanged

Preserve the following concepts and technical structures:

- Student-facing module title: **Module 4 — Microscopy & Scalp Assessment**.
- The hero concept:
  **Stop assuming. Start seeing.**
- The central position that magnification improves observation but does not authorize diagnosis.
- A pre-service assessment before water, exfoliants, or treatment products touch the scalp.
- A calm, educational client introduction.
- Multi-region assessment rather than one-angle judgment.
- Light device contact and adequate dwell time.
- The principle that product residue can mimic a scalp concern.
- The principle that excessive pressure can create a visual change the practitioner then misreads.
- The principle that most scalps do not look identical in every region.
- A strong do-not-proceed and referral section.
- The existing referral script concept.
- The common-mistakes section.
- Two required open-response checkpoints.
- Existing checkpoint IDs:
  - `m4cp1`
  - `m4cp2`
- Existing technical module ID `4`.
- Existing wrapper ID `module4Wrap`.
- Existing completion-card ID `m4Complete`.
- Existing `M4`, state keys, progress identifiers, and Module 5 unlock relationship.
- Existing students who have passed either Module 4 checkpoint must remain passed.
- Module 5 remains the next module.
- The ten prepared Module 4 source assets remain in the repository:
  - five examination-area images;
  - five microscopy-style images.

Do not rename `m4cp1`, `m4cp2`, `m4Complete`, the module ID, progress keys, or stored checkpoint keys merely to normalize implementation.

Module 4 should teach **how to collect and describe evidence**. Detailed scalp-type treatment frameworks belong primarily to Module 5, and named conditions/disorders belong primarily to Module 6.

---

## Required corrections

### 1. Clarify what the device is—and is not

Keep the industry-facing term `scalp microscopy`, but explain it accurately.

In this course, the scalp microscope is a cosmetic magnification camera used to improve visibility, documentation, comparison, and client education.

Medical **trichoscopy** is scalp and hair dermoscopy used by qualified clinicians as an adjunct in diagnosing and monitoring hair and scalp disorders.

Do not imply that:

- the head spa device performs medical trichoscopy;
- magnification makes the practitioner a diagnostician;
- a camera image establishes a disease, cause, or treatment;
- a software label or confidence score changes the practitioner’s scope.

### 2. Replace the five “scalp types” with observation language

Module 4 must not teach the five current cards as mutually exclusive scalp types.

Replace the current taxonomy with **appearance examples** and a structured observation process.

The approved appearance language is:

- Baseline-appearing view
- Oil-dominant appearance
- Fine-scale / dry-appearing surface
- Visible color change / reactive-appearing area
- Surface residue / buildup

These are descriptive teaching labels, not diagnoses or permanent scalp identities.

A client may show several appearances across different regions at the same appointment.

### 3. Resolve “Oily / congested” versus “Congested”

The current `Oily / congested` and `Congested` cards overlap too heavily to remain separate scalp categories.

Reframe them as two different observation emphases:

- **Oil-dominant appearance:** the primary visible feature is diffuse shine or sebum-like material.
- **Surface residue / buildup:** the primary visible feature is coating, adherent material, or product-like residue.

Teach explicitly that a magnified image often cannot determine whether visible material is sebum, scale, sweat, environmental material, cosmetic residue, or a combination.

Do not use `congestion` as though it were a diagnosis or proven follicular obstruction.

Do not say a follicle is `clogged` from appearance alone.

### 4. Correct the universal “pink tone” baseline

Remove `soft pink tone` as a universal description of a balanced scalp.

Baseline scalp color varies with:

- skin tone;
- natural pigmentation;
- lighting;
- device white balance;
- contact pressure;
- recent heat, friction, or product exposure.

Use comparison to the client’s own surrounding baseline.

Teach that a visible color change may appear:

- pink or red;
- deep red-brown;
- purple;
- gray;
- darker or lighter than surrounding skin;
- or primarily as a change in texture rather than obvious redness.

Do not rely on color alone to decide whether an area is irritated or inflamed.

### 5. Correct the “sensitive / reactive” category

A magnified image cannot prove `sensitivity`, `a fragile barrier`, or `inflammation`.

Replace the image label in student-facing course copy with:

**Visible color change / reactive-appearing area**

The practitioner should combine the image with client-reported:

- stinging;
- burning;
- tenderness;
- itching;
- heat;
- recent chemical service;
- recent product change;
- recent scratching or friction.

Use `reactive-appearing` only as cosmetic shorthand, not a medical conclusion.

### 6. Correct dry and flaky language

Fine loose scale, a matte appearance, and little visible surface shine may be compatible with a dry-appearing surface, but the image does not prove dehydration, barrier depletion, dandruff, dermatitis, or another cause.

Module 4 should not teach the dry-scalp-versus-dandruff diagnosis distinction. That deeper distinction belongs in Module 6.

Remove `seborrheic flaking` from Module 4 unless it appears only as an example of a term the student should **not** assign from this module’s cosmetic assessment.

### 7. Remove unsupported rebound-oil certainty

Remove the claim that over-stripping automatically causes sebaceous glands to produce more oil as compensation.

The course may accurately say that harsh or overly frequent cleansing can contribute to dryness, irritation, discomfort, and barrier disruption.

Do not teach rebound sebum production as a guaranteed physiological response.

### 8. Separate observation from interpretation and action

Every major visual example should teach three levels:

1. **What is visible**
2. **What context is still needed**
3. **What the practitioner may responsibly change**

The course should also identify the fourth level:

4. **What the image does not prove**

This prevents visual description from sliding into diagnosis.

### 9. Teach a standardized image protocol

Add a consistent image-collection standard:

- assess before water and treatment products;
- review recent product use and wash timing;
- part hair cleanly;
- use the same device and lens when comparing;
- use consistent magnification when possible;
- use consistent light and white-balance settings when possible;
- hold the device lightly and steadily;
- avoid compressing the skin;
- remain on one station long enough to observe;
- label saved images by region;
- use the same region and orientation for a comparison image;
- document when product, lighting, or device conditions differ.

A before-and-after image should not be called a valid comparison when the conditions are materially different.

### 10. Add device hygiene at the point of technique

Before and after each client:

- clean and disinfect reusable contact surfaces according to the device manufacturer’s instructions and applicable rules;
- use compatible products and required contact time;
- do not place the device on broken, bleeding, weeping, oozing, or visibly draining skin;
- stop using the device if contamination cannot be safely managed.

Do not invent a universal disinfectant or contact time.

Do not immerse electrical components unless the manufacturer permits it.

### 11. Add image consent and privacy

Live viewing does not automatically authorize saving, storing, transmitting, or reusing an image.

Before capture, tell the client:

- whether an image will be saved;
- why it is being saved;
- where it will be stored;
- who can access it;
- whether it may be used for comparison, education, or marketing.

Use separate permission for marketing, social media, teaching, or external sharing.

Do not save scalp images to an unapproved personal camera roll, personal cloud account, or AI/scanner service without appropriate policy, consent, and privacy review.

The module may introduce this standard briefly without turning Module 4 into the full AI/privacy module.

### 12. Convert the five regions into a repeatable protocol

The current five-region grid is a flat list.

Teach it as AIMT’s baseline **five-point scalp scan**:

1. Frontal hairline
2. Top parting
3. Crown / vertex
4. Temporal area
5. Occipital / back

Use the memory line:

> **Front. Top. Crown. Side. Back.**

The exact starting side is less important than consistent coverage and documentation.

Teach the student to:

- use the same five stations for a baseline;
- compare the opposite temple when asymmetry or a localized concern is present;
- add targeted images based on client concern;
- never assume the five baseline views are the only views needed.

### 13. Use the examination-area images as procedural guides

Use all five files under:

`assets/images/course/module-04/examination-areas/`

as numbered visual stations.

Because `exam-area-04-temporal-area.png` uses a different model/framing, present the five images as separate location guides—not as one continuous photo sequence of the same person.

Do not build a composite that implies all five images show one client.

Create optimized WebP derivatives while retaining the original PNG files.

Approved alt-text pattern:

1. `Front view of a head with the frontal hairline marked as the first scalp-magnification assessment station.`
2. `Top view of a head with the central top parting marked as the second scalp-magnification assessment station.`
3. `Upper rear view of a head with the crown or vertex marked as the third scalp-magnification assessment station.`
4. `Side view of a head with the temporal scalp marked as the fourth scalp-magnification assessment station.`
5. `Back view of a head with the occipital scalp marked as the fifth scalp-magnification assessment station.`

### 14. Treat the microscopy assets as illustrative—not clinical evidence

The prepared microscopy assets appear to be generated microscopy-style illustrations rather than authenticated clinical captures.

They may be used only when visibly labeled:

> **Illustrative magnified example — not a clinical diagnosis**

Do not call them:

- clinical photographs;
- real client microscopy;
- diagnostic images;
- proof of a condition;
- validated examples of a disease.

Do not grade visual-identification competency against these images.

Real, consented, de-identified, accurately categorized captures may replace them later.

### 15. Crop out conflicting baked-in terminology

Retain all original PNG source assets.

Create optimized production derivatives that crop to the magnified scalp image and remove the decorative poster title, subtitle, and border.

Do not change the depicted scalp content beyond:

- cropping;
- resizing;
- compression;
- standard responsive-image preparation.

Use the following production labels in HTML rather than the baked-in source labels:

- Baseline-appearing view
- Oil-dominant appearance
- Fine-scale / dry-appearing surface
- Visible color change / reactive-appearing area
- Surface residue / buildup

Suggested derivative filenames:

- `microscopy-baseline-appearing.webp`
- `microscopy-oil-dominant.webp`
- `microscopy-fine-scale.webp`
- `microscopy-visible-color-change.webp`
- `microscopy-surface-residue.webp`

If a source image cannot be cropped without damaging its educational value, retain the full source image but add a clearly visible correction caption adjacent to it.

### 16. Make the oil/residue overlap part of the lesson

Present the oil-dominant and surface-residue images together under:

> **Similar image. Different possible story.**

Teach:

- both may show shine or material near follicular openings;
- the camera cannot identify the material’s composition;
- product history, wash timing, sensation, distribution, and response to gentle cleansing provide needed context;
- the correct first move is description and questioning, not a confident label.

### 17. Add the five observation lenses

Use this simplified structure, informed by professional trichoscopy terminology but adapted to cosmetic observation:

1. **Scalp surface**  
   Color relative to baseline, sheen, scale, coating, residue, broken skin.

2. **Follicular openings**  
   Visibility of openings and visible material at or around them.

3. **Perifollicular area**  
   Color change, scale, or visible material immediately surrounding follicles.

4. **Hair shafts**  
   Visible breakage, variation, residue, and the condition of shafts in the field of view.

5. **Distribution**  
   Whether the appearance is localized, diffuse, symmetric, or different from another station.

Do not teach disease-specific trichoscopic signs in Module 4.

### 18. Add one meaningful observation interaction

Add an ungraded interaction titled:

**Say only what the image earned.**

The student classifies realistic statements as:

- `Supported observation`
- `Working question`
- `Unsupported conclusion`

The interaction must teach why each classification is correct.

It must not be completion-gating, scored, persistent, or tied to certification.

### 19. Align Module 4 with Module 5

Remove detailed protocol prescriptions from the appearance-example cards.

Module 4 should end with a controlled decision:

- Preserve
- Modify conservatively
- Avoid a region
- Pause
- Refer

Module 5 will teach the fuller treatment-direction framework.

The handoff should be:

> Module 4 teaches you how to gather and describe the evidence. Module 5 teaches you how to translate appropriate findings into a cosmetic service direction.

### 20. Strengthen the do-not-proceed section without dominating the module

Group referral concerns by visible or reported finding rather than by suspected diagnosis.

Do not treat or continue over:

- broken, bleeding, weeping, oozing, or draining skin;
- pustular or crusted lesions;
- marked swelling, heat, or severe tenderness;
- severe burning or unexpected pain;
- rapidly changing, patchy, smooth, shiny, or scar-like hair-loss patterns;
- any finding the practitioner cannot safely accommodate within cosmetic scope.

The practitioner is not required to name the condition.

### 21. Correct the checkpoints

Both displayed questions must exactly match the evaluator questions.

Use separate checkpoint-specific rubrics.

Do not fail a student for:

- grammar;
- spelling;
- concise wording;
- spoken phrasing;
- non-native English;
- accurate reasoning without exact terminology.

Correct immediately when a student:

- diagnoses;
- prescribes;
- claims the camera proves a cause;
- continues over draining, broken, pustular, or severely painful skin;
- treats a single image as the entire scalp;
- suggests using more pressure to improve the image.

### 22. Correct Cadence identity and scope

Replace the old course name with:

**Head Spa Certification Course**

Cadence must not claim personal human work experience.

Cadence may state that the curriculum was built from the instructor’s nearly two decades of applied experience.

Remove `dry scalp vs dandruff` from Module 4’s guide prompt because that is not the approved focus of this module.

Cadence should function as an observation coach:

- what is visible;
- what context is missing;
- what changes in the service;
- what cannot be concluded.

### 23. Improve accessibility and responsive behavior

For the five-point scan, visual examples, interaction, and checkpoints:

- use semantic buttons and controls;
- maintain visible focus;
- expose state with text and ARIA;
- keep meaningful content available in the DOM;
- use alt text and visible captions;
- do not rely on embedded text inside raster images;
- do not rely on color alone;
- support reduced motion;
- prevent horizontal overflow;
- provide appropriately sized touch controls;
- allow images to enlarge through an accessible full-size control when useful.

For both checkpoints:

- add `aria-label="Speak your answer"` to voice buttons;
- add `aria-label="Send response to Cadence"` to submit buttons;
- use appropriate live regions for status and feedback;
- preserve Enter-to-submit and Shift+Enter-for-new-line behavior.

### 24. Name the demonstrated competency at completion

The completion card must identify that the student demonstrated:

- standardized multi-region assessment;
- disciplined observation language;
- image-context reasoning;
- pause and referral judgment.

### 25. Preserve progress and system integrity

Implementation must not:

- rename `m4cp1` or `m4cp2`;
- invalidate existing passed checkpoint state;
- add another required checkpoint;
- make either ungraded interaction completion-gating;
- modify Modules 0–3;
- edit Module 5;
- alter authentication, entitlements, payments, progress sync, certificate logic, or Review Mode;
- implement persistent Cadence threads;
- implement Guided Completion Path UI;
- implement Listen Mode;
- create the dashboard resource folder;
- refactor the monolithic course file.

---

## Final replacement copy

Use the following copy and structures for the approved Module 4 experience.

### A. Module identity

**Home-screen title:**

> Module 4 — Microscopy & Scalp Assessment

**Home-screen subtitle:**

> A repeatable system for collecting and interpreting visible evidence

**Hero eyebrow:**

> Module 4 · Microscopy & Scalp Assessment

**Hero title:**

> Stop assuming.  
> Start seeing.

**Hero description:**

> Magnification does not hand you a diagnosis. It gives you a better view. This module teaches a repeatable five-point scan, disciplined observation, and the moment a cosmetic service should be customized, simplified, paused, or referred.

---

### B. Section 4.1 — The role of magnification

**Eyebrow:**

> 4.1 — The role of magnification

**Headline:**

> A closer view is not a final answer.

**Body:**

> A scalp camera can reveal details that are easy to miss with the unaided eye: surface shine, scale, residue, material around follicular openings, hair-shaft variation, and differences from one region to another.
>
> That does not mean the device knows what caused what you see. Medical trichoscopy is a clinical diagnostic technique interpreted alongside history, examination, and other medical information. In a head spa, scalp microscopy is a cosmetic observation and education tool.
>
> Its value is precision—not certainty. It helps you collect better evidence before you choose a cosmetic service direction.

**Key point:**

> The image can sharpen the question. It cannot answer every question.

**Cadence note:**

> “A weak assessment names the scalp too quickly. A strong assessment collects the view, compares regions, asks for context, and lets the service decision remain no more certain than the evidence.”

---

### C. Section 4.2 — Presenting the assessment

**Eyebrow:**

> 4.2 — Presenting the assessment

**Headline:**

> Make the lens feel informative—not invasive.

**Body:**

> Tell the client what the camera is for before it touches the scalp. The assessment should feel like part of customization, not a search for something wrong.

**Approved live-view script:**

> “Before we begin, I’m going to look at several areas of your scalp under magnification. I’ll use what is visible—along with what you tell me—to customize the cosmetic service. The camera helps us see detail, but it does not diagnose a scalp condition.”

**Image-capture consent script:**

> “I can use the camera for a live view without saving anything. I can also capture comparison images for your service record. Would you like me to save them, and may I explain how they will be stored and used?”

**Privacy note:**

> Permission to view is not permission to save. Permission to save for the client record is not permission to post, teach from, transmit to another service, or use in marketing.

**Client-language rule:**

> Show the image without making the client feel dirty, damaged, or alarmed. Describe the finding. Explain the cosmetic decision. State the limit when the cause cannot be determined.

---

### D. Section 4.3 — Image integrity

**Eyebrow:**

> 4.3 — Image integrity

**Headline:**

> A useful image begins before the lens touches the scalp.

**Introduction:**

> Magnification can exaggerate a poor setup. Standardize the conditions before you interpret the screen.

Use six technique cards:

#### 1. Start before treatment

> Assess before water, exfoliants, oils, masks, steam, or treatment products alter the surface.

#### 2. Ask what is already on the scalp

> Record wash timing, dry shampoo, root sprays, oils, fibers, medicated products, chemical services, and recent scratching or irritation.

#### 3. Part cleanly

> Create a clear view without scraping or repeatedly disturbing the same area.

#### 4. Touch lightly

> Rest the device steadily. Excess pressure can blanch or redden the skin and create the finding you think you discovered.

#### 5. Hold the view

> Stay long enough to inspect the image. A constant visual sweep produces motion, blur, and shallow interpretation.

#### 6. Make comparisons honest

> Match region, magnification, light, pressure, orientation, and device settings when comparing two images.

**Sanitation note:**

> Clean and disinfect reusable contact surfaces before and after each client according to the manufacturer’s instructions and applicable rules. Do not place the device on broken, bleeding, weeping, oozing, or draining skin.

**Key point:**

> If the setup changes, the image changes. Document the difference before you call it improvement.

---

### E. Section 4.4 — The five-point scalp scan

**Eyebrow:**

> 4.4 — The five-point scalp scan

**Headline:**

> Five stations prevent one-angle thinking.

**Body:**

> The scalp is not uniform. AIMT’s baseline scan uses the same five stations in the same order so the practitioner does not let one dramatic image represent the entire head.

**Memory line:**

> **Front. Top. Crown. Side. Back.**

Implement an accessible, numbered visual stepper using the prepared examination-area assets.

#### Station 1 — Frontal hairline

**Image:**

`exam-area-01-front-hairline.png`

**Purpose:**

> Establish the visible condition along the hairline, where styling products, cosmetics, tension, scale, and client concerns may be easiest to notice.

**Technique cue:**

> Separate hair gently and avoid rubbing the hairline before the image is captured.

#### Station 2 — Top parting

**Image:**

`exam-area-02-top-parting.png`

**Purpose:**

> Collect a consistent central view of the scalp surface, follicular openings, and hair distribution along the part.

**Technique cue:**

> Use the same part location when creating a future comparison.

#### Station 3 — Crown / vertex

**Image:**

`exam-area-03-crown-vertex.png`

**Purpose:**

> Compare the crown with the parting and hairline rather than assuming the central scalp presents uniformly.

**Technique cue:**

> Work with the natural swirl instead of forcing the shafts flat across the view.

#### Station 4 — Temporal area

**Image:**

`exam-area-04-temporal-area.png`

**Purpose:**

> Observe a lateral region and compare it with the central scalp.

**Technique cue:**

> Check the opposite side when asymmetry, tension, tenderness, or localized concern is reported.

#### Station 5 — Occipital / back

**Image:**

`exam-area-05-occipital-back.png`

**Purpose:**

> Include the hidden posterior scalp, which may look different from the areas the client sees and styles most often.

**Technique cue:**

> Position the hair securely so the lens remains steady and the client does not have to hold an uncomfortable posture.

**Completion line after all five stations are viewed:**

> A five-point scan creates the baseline. The client’s concern tells you where to add targeted views.

**Interaction rules:**

- Ungraded.
- No progress write.
- No completion requirement.
- Student may move forward, backward, or select a station directly.
- Current station is announced.
- All content remains available to screen readers.
- The five images are separate location guides and must not imply one shared model.
- No decorative animation is required.

---

### F. Section 4.5 — The five observation lenses

**Eyebrow:**

> 4.5 — The five observation lenses

**Headline:**

> Do not label the scalp. Read the evidence.

**Introduction:**

> Use the same five lenses at every station. They keep the assessment specific enough to be useful and restrained enough to remain honest.

Use five parallel cards:

#### 1. Scalp surface

**Look for:**

> Color relative to the client’s surrounding baseline, sheen, loose or adherent scale, visible coating, residue, and whether the skin is intact.

**Document like this:**

> “Diffuse surface shine at the crown with small areas of adherent yellow-white material.”

#### 2. Follicular openings

**Look for:**

> Whether openings are visible and whether material is present at or near them.

**Document like this:**

> “Several openings show visible material around the emerging shafts.”

**Do not write:**

> “The follicles are clogged.”

#### 3. Perifollicular area

**Look for:**

> Color change, scale, or visible material immediately surrounding a follicle.

**Document like this:**

> “Color change and fine scale are visible around several follicles in this station.”

#### 4. Hair shafts

**Look for:**

> Visible breakage, coating, residue, variation in shaft appearance, and the number of shafts visible in the field.

**Document like this:**

> “Short and longer shafts are visible in the same field; several shafts have surface residue.”

**Limit:**

> One image cannot establish the cause of breakage, thinning, or shaft variation.

#### 5. Distribution

**Look for:**

> Whether the finding is localized, diffuse, symmetric, or different from another station.

**Document like this:**

> “The crown shows more surface shine and residue than the frontal hairline.”

**Key point:**

> Distribution is often more useful than the most dramatic close-up. One image is a detail. The scan is the pattern.

---

### G. Ungraded interaction — Say only what the image earned

**Placement:** Immediately after the five observation lenses.

**Eyebrow:**

> Observation discipline

**Headline:**

> Say only what the image earned.

**Instruction:**

> Classify each statement as a supported observation, a working question, or an unsupported conclusion.

Use three classifications:

- Supported observation
- Working question
- Unsupported conclusion

#### Statement 1

> “The crown shows diffuse shine and visible yellow-white material around several follicular openings.”

**Correct:**

> Supported observation

**Feedback:**

> It describes location and appearance without claiming what the material is or why it is present.

#### Statement 2

> “Could the visible material be influenced by dry shampoo, root spray, oil, or wash timing?”

**Correct:**

> Working question

**Feedback:**

> It identifies missing context and directs the consultation without converting the image into a conclusion.

#### Statement 3

> “The client’s follicles are clogged because they do not shampoo enough.”

**Correct:**

> Unsupported conclusion

**Feedback:**

> The image cannot prove obstruction, hygiene, cause, or the client’s cleansing behavior.

#### Statement 4

> “The temporal area looks darker and the client reports burning, so I would avoid stimulation there and ask whether this is new.”

**Correct:**

> Working question

**Feedback:**

> The statement combines a visible difference with the client’s report and changes the cosmetic service without naming a condition.

#### Statement 5

> “This is seborrheic dermatitis.”

**Correct:**

> Unsupported conclusion

**Feedback:**

> A cosmetic magnification image does not establish a medical diagnosis.

**Completion line:**

> Strong assessment language is precise about what is visible and disciplined about what remains unknown.

**Interaction rules:**

- Ungraded.
- No score, points, streak, or completion badge.
- No progress or checkpoint write.
- Student may change each answer.
- Immediate explanatory feedback.
- Keyboard and screen-reader operable.
- Correctness communicated with text, not color alone.

---

### H. Midpoint Checkpoint 1

Place `m4cp1` immediately after the observation interaction.

Use the exact copy in the Checkpoint Specification section.

Do not lock the remainder of the module behind the checkpoint.

---

### I. Section 4.6 — Appearance examples

**Eyebrow:**

> 4.6 — Appearance examples

**Headline:**

> Patterns overlap. That is why labels fail.

**Introduction:**

> These images build visual vocabulary. They are illustrative magnified examples, not authenticated clinical captures and not proof of a diagnosis. Use each one to practice description, questioning, and restraint.

Add this visible notice above the gallery:

> **Illustrative examples:** Actual scalp appearance varies by client, skin tone, lighting, magnification, device, product history, and image conditions.

Use optimized cropped derivatives of the prepared images.

#### Example 1 — Baseline-appearing view

**Source:**

`microscopy-neutral-balanced-scalp.png`

**Approved production label:**

> Baseline-appearing view

**What is visible:**

> Relatively even surface appearance, visible follicular openings, minimal obvious scale or coating, and no pronounced localized color change in the field.

**Context still needed:**

> The client’s own baseline, product use, sensation, and comparison with the other four stations.

**What this may change:**

> Avoid unnecessary correction. Preserve what is working and follow the client’s cosmetic goals.

**What it does not prove:**

> That the scalp is universally “healthy,” medically normal, or free of a condition outside the camera’s view.

**Alt text:**

> Illustrative magnified scalp view with visible hair shafts, relatively clear follicular openings, and minimal obvious surface scale or residue.

#### Example 2 — Oil-dominant appearance

**Source:**

`microscopy-oily-congested-scalp.png`

**Approved production label:**

> Oil-dominant appearance

**What is visible:**

> Diffuse shine and sebum-like material at or around several follicular openings.

**Context still needed:**

> Time since washing, product use, sweating, recent heat, client sensation, and whether the same appearance exists in other regions.

**What this may change:**

> It may support a more thorough but conservative cleansing direction after the full assessment.

**What it does not prove:**

> Sebum overproduction, poor hygiene, dandruff, infection, or a clogged follicle.

**Alt text:**

> Illustrative magnified scalp view showing diffuse shine and yellow-white material around several hair shafts and follicular openings.

#### Example 3 — Fine-scale / dry-appearing surface

**Source:**

`microscopy-dry-depleted-scalp.png`

**Approved production label:**

> Fine-scale / dry-appearing surface

**What is visible:**

> A more matte surface with fine loose scale and less obvious surface shine in the field.

**Context still needed:**

> Tightness, itching, burning, cleansing frequency, recent clarifying, chemical services, weather exposure, and comparison with other regions.

**What this may change:**

> It may support a gentler, simplified service while avoiding aggressive cleansing or exfoliation.

**What it does not prove:**

> Dehydration, barrier damage, dandruff, dermatitis, or the medical cause of scale.

**Alt text:**

> Illustrative magnified scalp view showing a matte-appearing surface with fine loose light-colored scale around hair shafts.

#### Example 4 — Visible color change / reactive-appearing area

**Source:**

`microscopy-sensitive-reactive-scalp.png`

**Approved production label:**

> Visible color change / reactive-appearing area

**What is visible:**

> Color variation relative to the surrounding field, with possible scale or visible material around some follicles.

**Context still needed:**

> Pain, burning, itching, heat, recent product or chemical exposure, scratching, friction, and whether the color changed after device contact.

**What this may change:**

> Reduce pressure, heat, friction, exfoliation, and product load. Avoid the area when the client reports discomfort or the skin appears compromised.

**What it does not prove:**

> Sensitivity, inflammation, allergy, infection, or a specific condition.

**Alt text:**

> Illustrative magnified scalp view showing localized color variation around several hair shafts and follicular openings.

#### Example 5 — Surface residue / buildup

**Source:**

`microscopy-congested-scalp.png`

**Approved production label:**

> Surface residue / buildup

**What is visible:**

> A coated appearance with visible material on the scalp surface and around some hair shafts or openings.

**Context still needed:**

> Dry shampoo, root sprays, fibers, oils, styling products, medicated products, wash timing, sweating, and whether gentle cleansing changes the appearance.

**What this may change:**

> It may support careful cleansing after sensitivity, pain, skin integrity, and product history are reviewed.

**What it does not prove:**

> Follicular blockage, infrequent hygiene, sebum composition, infection, or the cause of the material.

**Alt text:**

> Illustrative magnified scalp view showing visible surface coating and light-colored material around multiple hair shafts and follicular openings.

---

### J. Oil versus residue comparison

**Eyebrow:**

> Similar image. Different possible story.

**Headline:**

> The camera shows the material. The consultation helps explain it.

Display Example 2 and Example 5 side by side at desktop and stacked on mobile.

**Copy:**

> Both images show shine or material near follicular openings. The microscope cannot determine the material’s composition from appearance alone.
>
> Before calling it oil, scale, or product buildup, ask:
>
> - When was the hair last washed?
> - What products are used at the root?
> - Is the client experiencing tightness, itching, burning, tenderness, or rapid oil return?
> - Is the appearance present across the scalp or concentrated in one region?
> - Does a gentle cleanse change what is visible?

**Key point:**

> When two possible stories look similar, ask a better question instead of choosing a stronger label.

---

### K. Section 4.7 — From image to decision

**Eyebrow:**

> 4.7 — From image to decision

**Headline:**

> The image earns its place by changing what happens next.

**Body:**

> Assessment is not a performance. It should support one of four professional decisions.

Use four decision cards:

#### Preserve

> The visible surface is intact, the client is comfortable, and no finding calls for correction.

**Action:**

> Avoid over-treating. Follow the client’s cosmetic goals.

#### Modify conservatively

> Oil, scale, residue, or regional variation is visible without broken skin, marked pain, drainage, or a concerning loss pattern.

**Action:**

> Adjust cleansing, exfoliation, temperature, pressure, and product load conservatively. Module 5 develops these treatment directions.

#### Avoid or pause an area

> A localized region shows discomfort, pronounced color change, recent irritation, tenderness, or uncertainty.

**Action:**

> Do not overwork it. Simplify, omit the area, or postpone that part of the service.

#### Stop and refer

> The scalp shows nonintact, draining, pustular, severely painful, hot, swollen, rapidly changing, patchy, smooth, shiny, or scar-like findings.

**Action:**

> Do not continue a cosmetic service over the area. Explain the limit of the assessment and recommend medical evaluation.

**Key point:**

> The advanced decision is not always a more complex treatment. Sometimes it is less treatment. Sometimes it is no treatment today.

---

### L. Section 4.8 — When not to proceed

**Eyebrow:**

> 4.8 — When not to proceed

**Headline:**

> The most important image may be the one that ends the service.

Use four grouped warning cards:

#### Nonintact or draining skin

> Broken, bleeding, weeping, oozing, pustular, crusted, or visibly draining areas.

**Response:**

> Stop camera contact and do not continue the cosmetic service over the area.

#### Marked pain or inflammatory appearance

> Heat, swelling, severe tenderness, intense burning, or pain that seems disproportionate.

**Response:**

> Do not massage through pain or use the service to test whether the area improves.

#### Concerning hair-loss pattern

> Rapidly changing density, patchy loss, smooth or shiny areas, scar-like appearance, or loss involving brows or lashes.

**Response:**

> Describe and document what is visible without naming the condition. Recommend medical evaluation.

#### Uncertainty outside cosmetic scope

> A finding may not fit a course example, or several warning signs may overlap.

**Response:**

> You do not need the diagnosis to know that the service should pause.

**Approved referral script:**

> “I’m seeing an area that should be medically evaluated before we continue a scalp service over it. I can document what is visible, but I can’t determine the cause from a cosmetic assessment. Once it has been evaluated, we can decide what kind of service is appropriate.”

**Device-contamination note:**

> If the device contacted a draining, bleeding, or otherwise compromised area, remove it from service and follow the manufacturer’s required cleaning and disinfection procedure before reuse.

---

### M. Section 4.9 — Practitioner insight

**Eyebrow:**

> 4.9 — Practitioner insight

**Headline:**

> The device can create the evidence you think you found.

Use five concise cards:

#### Pressure changes color

> Excess contact can blanch or redden the scalp. Capture the baseline before repeated contact alters it.

#### A dirty lens creates a false story

> Haze, residue, oil, or scale on the device can appear to belong to the client. Inspect and prepare the lens before the scan.

#### Products can imitate pathology

> Dry shampoo, fibers, root spray, oils, masks, and medicated products can change surface appearance. Ask before you interpret.

#### One image is not the scalp

> A dramatic crown image does not erase a calm hairline, and a clean hairline does not represent the hidden posterior scalp.

#### Before-and-after requires matching conditions

> Different light, angle, pressure, magnification, or location can create a more dramatic “result” than the service did.

**Key point:**

> Microscopy does not become advanced when the image is dramatic. It becomes advanced when the collection method is consistent and the interpretation is restrained.

---

### N. Section 4.10 — Common mistakes

**Eyebrow:**

> 4.10 — Common mistakes

**Headline:**

> What to unlearn before the camera makes it look convincing.

Use six mistake/fix cards:

#### Mistake 1 — Naming the scalp after one image

**Fix:**

> Complete the five-point scan and compare distribution before forming a working service direction.

#### Mistake 2 — Pressing for a clearer view

**Fix:**

> Improve parting, stability, focus, lighting, and lens cleanliness—not pressure.

#### Mistake 3 — Turning visible material into a cause

**Fix:**

> Describe location, color, texture, and distribution. Ask about product and wash history.

#### Mistake 4 — Saving images without clear permission

**Fix:**

> Separate consent for live view, record capture, teaching, marketing, and external sharing.

#### Mistake 5 — Creating a misleading before-and-after

**Fix:**

> Match region, magnification, light, pressure, and orientation.

#### Mistake 6 — Performing assessment that changes nothing

**Fix:**

> The image should support preserve, modify, avoid, pause, or refer. Otherwise it is theater.

**Closing line:**

> The microscope is not the skill. The collection method, language, and decision are the skill.

---

### O. Final Checkpoint 2

Keep `m4cp2` at the end of the instructional content.

Use the exact copy in the Checkpoint Specification section.

---

### P. Module-open Cadence greeting

Replace with:

> Module 4 is where observation becomes a method. Use the camera to collect a better view, then separate what is visible from what still needs context and what the image cannot prove.

---

### Q. Cadence guide system

Replace `MODULE_GUIDE_SYSTEMS[4]` with:

> You are Cadence, AIMT’s curriculum-grounded guide for the Head Spa Certification Course. Your guidance was built from the instructor’s nearly two decades of applied experience; you do not claim that experience as your own or present yourself as a human practitioner. The student is in Module 4: cosmetic scalp magnification, client introduction and image consent, device hygiene, standardized image collection, AIMT’s five-point scan, the five observation lenses, regional comparison, appearance-versus-cause reasoning, conservative service adjustment, and pause/referral judgment. Treat the scalp camera as an observation and education tool, not medical trichoscopy or a diagnostic device. When useful, structure the response as: what is visible, what context is missing, what may change in the cosmetic service, and what cannot be concluded. Do not diagnose, prescribe, claim that an image proves follicular blockage or a medical cause, or repeat a scanner-generated condition label as fact. Lead with applied observation skill rather than repeated scope warnings. Use 3–5 concise sentences and no bullet points unless the student explicitly asks for a list.

---

### R. Suggested Cadence prompts

Use one authoritative dynamic source:

- `How do I document what I see without labeling the scalp?`
- `What questions help distinguish oil from product residue?`
- `How do I make before-and-after scalp images honest?`
- `Which findings mean I should stop the service?`

---

### S. Completion card

**Eyebrow:**

> Module 4 complete

**Title:**

> You can collect evidence before making a decision.

**Competency line:**

> You demonstrated a standardized five-point scan, disciplined observation language, regional comparison, image-consent awareness, and pause/referral judgment.

**Next-up label:**

> Up next — Module 5

**Next-up text:**

> Module 4 taught you how to gather and describe the evidence. Module 5 teaches you how to translate appropriate findings into a cosmetic treatment direction without collapsing the entire scalp into one label.

**Primary button:**

> Start Module 5 →

**Secondary button:**

> Back to course

---

## Checkpoint specification

Both existing checkpoints remain required.

Do not add a third required checkpoint.

Preserve checkpoint IDs `m4cp1` and `m4cp2`.

Previously passed state must remain valid.

### Checkpoint 1 — `m4cp1`

**Placement:** Midpoint, after the five observation lenses and `Say only what the image earned`.

**Label:**

> Read the full scan

**Exact question:**

> During a five-point scan, the crown appears shiny with visible material around several follicular openings, while the frontal hairline looks matte with fine loose scale. The client reports no pain or burning. Describe what you would document, explain why one label for the entire scalp would be weak, and name one question you would ask before deciding how to adjust the service.

The exact same string must be supplied to Cadence.

**Placeholder:**

> Describe the two regions, explain the limit of one label, and ask for the missing context…

**Voice-button accessible name:**

> Speak your answer

**Submit-button accessible name:**

> Send response to Cadence

**Network error:**

> Cadence couldn’t evaluate your assessment response. Check your connection and try again.

#### Competency evaluated

The student can document regional differences, resist whole-scalp labeling, and seek relevant context before choosing a cosmetic service direction.

#### Required elements for a pass

A passing response must demonstrate:

1. Objective documentation of both regions:
   - crown shine/material around openings;
   - matte hairline/fine loose scale.
2. Recognition that the crown and hairline do not present identically.
3. Recognition that one label for the entire scalp would erase regional variation.
4. At least one relevant question, such as:
   - time since washing;
   - dry shampoo, root spray, oils, fibers, or styling products;
   - cleansing frequency;
   - tightness, itching, tenderness, or sensitivity;
   - recent chemical service;
   - whether the pattern is new;
   - whether other stations match either region.
5. No diagnosis or claim that the image proves the material’s cause.
6. A conservative statement that the service direction should follow the completed assessment and client context.

The student does not need to use `follicular`, `perifollicular`, or the exact five-lens terminology when the reasoning is accurate.

#### Immediate corrections

Cadence must correct responses that:

- diagnose dandruff, dermatitis, infection, dehydration, or another condition;
- say the follicles are definitely clogged;
- blame poor hygiene;
- treat the crown image as the whole scalp;
- recommend aggressive exfoliation without reviewing sensitivity and skin integrity;
- claim the camera identifies the material’s composition.

#### Revision behavior

When incomplete, ask for one focused correction.

Examples:

- Describes only the crown: ask what the hairline changes about the conclusion.
- Labels both regions but asks no question: ask what history is needed before choosing a service.
- Good observations but diagnostic certainty: ask the student to restate the conclusion using visible features only.
- Good regional reasoning but no service implication: ask what should remain undecided until context is gathered.

---

### Checkpoint 2 — `m4cp2`

**Placement:** End of module.

**Label:**

> Know when the image ends the service

**Exact question:**

> During the crown station, you see a cluster of raised lesions with visible fluid and crusting. The client says the area does not bother them and asks you to continue. Explain what you do with the microscope and the service, what you say to the client, and why.

The exact same string must be supplied to Cadence.

**Placeholder:**

> Explain the device response, service decision, client language, and reason…

**Voice-button accessible name:**

> Speak your answer

**Submit-button accessible name:**

> Send response to Cadence

**Network error:**

> Cadence couldn’t evaluate your assessment response. Check your connection and try again.

#### Competency evaluated

The student can stop device contact and the cosmetic service appropriately, communicate without diagnosing or alarming the client, and manage a potentially contaminated reusable device responsibly.

#### Required elements for a pass

A passing response must demonstrate:

1. Stop using the microscope on the area.
2. Do not continue a head spa service over the affected area.
3. Avoid naming or confirming an infection or diagnosis.
4. Explain that the visible finding requires medical evaluation before a cosmetic scalp service continues.
5. Use calm, professional client-facing language.
6. Remove the device from use and follow manufacturer-required cleaning and disinfection before reuse when contact or contamination may have occurred.
7. Do not allow the client’s lack of discomfort to override the visible concern.

The student does not need to name a specific disinfectant or medical condition.

#### Immediate corrections

Cadence must correct responses that:

- continue the service because the client is unbothered;
- massage around or through the lesions;
- diagnose folliculitis, fungal infection, or another disease;
- recommend prescription or medicated treatment;
- wipe the device casually and use it on another client;
- shame or alarm the client;
- state that lack of pain makes treatment safe.

#### Revision behavior

Examples:

- Stops the service but omits device handling: ask what happens to the contact device before reuse.
- Cleans the device but continues the service: ask why the visible finding changes the treatment decision.
- Refers appropriately but gives a diagnosis: ask for an observation-based version of the same client script.
- Says only “refer out”: ask for the exact calm sentence they would say.

---

### Shared grading rules

For both checkpoints, Cadence should:

- evaluate reasoning rather than keyword matching;
- accept concise, accurate answers;
- accept natural spoken language and non-native English;
- ignore minor grammar and spelling errors;
- reference one specific part of the student’s response;
- avoid generic praise;
- ask for one focused revision when incomplete;
- correct unsafe or diagnostic claims immediately;
- pass as soon as the full competency is demonstrated.

Preserve the existing evaluator JSON contract.

Use checkpoint-specific Module 4 evaluator configurations rather than one shared generic `M4.system`.

---

## Approved interactions

Module 4 has a **moderate visual and procedural interaction density**.

Approved interactions:

1. Five-point scalp scan visual stepper
2. `Say only what the image earned` classification exercise
3. Midpoint checkpoint `m4cp1`
4. Final checkpoint `m4cp2`

No additional quiz, drag-and-drop, diagnostic image test, or decorative interaction is approved.

### Five-point scalp scan

Requirements:

- Uses all five prepared examination-area images.
- Presents the five stations in order.
- Allows direct station navigation.
- Shows purpose and technique cue for each station.
- Remains ungraded and non-persistent.
- Does not claim the five source images show one client.
- Works by mouse, keyboard, touch, and screen reader.
- Writes no progress.

### Say only what the image earned

Requirements:

- Uses the five approved statements and classifications.
- Student may change answers.
- Immediate explanatory feedback.
- No score or attempt limit.
- No progress or checkpoint write.
- Accessible state and feedback.
- No color-only communication.

### Appearance gallery

The image gallery is instructional, not a quiz.

Requirements:

- Prepared microscopy images are visibly labeled illustrative.
- Cropped production derivatives remove conflicting embedded labels when feasible.
- Each example has:
  - what is visible;
  - context still needed;
  - possible cosmetic implication;
  - what it does not prove.
- Images may open full size through an accessible control.
- Students are not graded on identifying the image.

### Checkpoint placement

- `m4cp1` remains near the midpoint.
- It does not lock the rest of the lesson.
- `m4cp2` remains the final competency check.
- Both remain completion-gating.
- No new completion fields are added.

---

## Cadence behavior

Cadence should act as an observation coach rather than a diagnostic assistant.

Her preferred sequence in Module 4 is:

1. identify the visible feature;
2. identify missing context;
3. connect the finding to a conservative cosmetic decision;
4. state the limit of the image when relevant.

Cadence should:

- reinforce the five-point scan;
- help students write objective notes;
- ask about product history, wash timing, sensation, and distribution;
- distinguish visible material from its unknown composition;
- challenge whole-scalp labels based on one station;
- explain image standardization;
- reinforce separate consent for capture and external use;
- explain why before-and-after settings must match;
- support calm referral language;
- correct device-pressure and contamination mistakes;
- avoid disease names unless explaining why the practitioner cannot confirm them;
- avoid presenting the prepared illustrative images as clinical evidence;
- avoid claiming personal client or practitioner experience;
- avoid letting warnings dominate answers that are primarily about technique or observation.

When persistent Cadence threads are implemented later, Module 4 must reopen its own saved module-specific text-message thread.

---

## Acceptance criteria

Module 4 is approved only when all criteria below are met.

### Module position and tone

- The approved hero remains:
  `Stop assuming. Start seeing.`
- The module feels like an observation laboratory rather than a static textbook chapter.
- Technical language connects directly to collection, documentation, client communication, or service judgment.
- Module 4 does not duplicate Module 5’s full treatment taxonomy or Module 6’s disease instruction.
- Scope remains a guardrail rather than the dominant tone.

### Device framing

- The course distinguishes cosmetic scalp magnification from medical trichoscopy.
- The device is not presented as diagnostic.
- Scanner or software labels do not become practitioner conclusions.
- Magnification is framed around visibility, documentation, comparison, and education.

### Client communication and consent

- The approved live-view script appears.
- Live viewing and saved-image permission are separated.
- Marketing, teaching, and external sharing require separate permission.
- The module does not encourage unapproved personal storage or transmission.

### Technique and image integrity

- Pre-treatment timing appears.
- Product and wash history appear.
- Light contact and adequate dwell time appear.
- Device pressure is not used to improve focus.
- Same-condition comparison appears.
- Lens/device preparation and manufacturer-directed cleaning appear.
- No universal disinfectant or contact time is invented.
- The device is not placed on broken or draining skin.

### Five-point scan

- All five stations appear in the approved order.
- The memory line `Front. Top. Crown. Side. Back.` appears.
- All five prepared examination-area images are used.
- The temporal image’s different model is not presented as the same client.
- Opposite-side comparison is recommended when relevant.
- Targeted views may be added.
- The stepper writes no progress.
- The stepper is keyboard, touch, and screen-reader operable.
- It does not overflow on mobile.

### Observation framework

- All five observation lenses appear:
  - surface;
  - follicular openings;
  - perifollicular area;
  - hair shafts;
  - distribution.
- Documentation examples use observation language.
- `Clogged follicle` is not taught as a visually proven fact.
- Distribution receives explicit emphasis.
- Color is compared with the client’s own baseline.
- Skin-tone variation is acknowledged.

### Observation interaction

- All five statements appear.
- Each has the approved classification and explanatory feedback.
- Student may change answers.
- No points, score, attempt limit, or progress write.
- Correctness does not rely on color.
- Feedback is announced appropriately.

### Appearance examples and assets

- Original PNG source files remain.
- Optimized production derivatives are created.
- Decorative baked-in titles are cropped out when feasible.
- Every microscopy image is visibly labeled illustrative.
- No image is called an authenticated clinical photograph.
- Images are not used as diagnostic evidence.
- Images are not used for graded identification.
- Baseline copy does not require a universal pink tone.
- `Sensitive / reactive` is replaced with visible color-change language.
- Dry-appearing content does not prove barrier depletion.
- Oily and residue examples are no longer duplicate scalp categories.
- The oil-versus-residue comparison appears.
- The camera’s inability to identify material composition is explicit.
- All image alt text is meaningful.
- Embedded text is not the only source of content.
- Images remain legible and responsive.

### Service decisions

- The four decisions appear:
  - preserve;
  - modify conservatively;
  - avoid or pause an area;
  - stop and refer.
- Module 4 does not give detailed protocols that belong in Module 5.
- The module acknowledges that different regions may require different cosmetic choices.
- The advanced decision may be less treatment or no treatment.

### Do-not-proceed content

- Broken, bleeding, weeping, oozing, pustular, crusted, or draining skin is excluded from service.
- Severe pain, heat, swelling, and tenderness are included.
- Concerning hair-loss patterns are described without diagnosis.
- Client lack of discomfort does not override a concerning visible finding.
- The approved referral script appears.
- Device contamination and reprocessing are addressed.

### Checkpoints

- `m4cp1` and `m4cp2` IDs remain unchanged.
- Existing passed state remains valid.
- Visible and evaluated questions match exactly.
- Each checkpoint has its own rubric.
- Strong applied answers pass.
- Partial answers receive one focused revision request.
- Diagnostic or prescriptive answers are corrected.
- Grammar and spelling do not cause unfair failure.
- Approved network-error text appears.
- Review Mode submissions remain unsaved.
- `m4cp1` does not lock the second half.
- Both checkpoints remain required for completion.

### Cadence

- The old course name is absent from Module-4-specific prompts.
- Cadence does not claim personal human experience.
- `Dry scalp vs dandruff` is removed from the Module 4 guide system.
- Cadence uses visible feature → missing context → cosmetic implication → limit.
- Cadence does not diagnose, prescribe, or endorse scanner labels.
- Only one Module 4 quick-prompt source is active.

### Accessibility and responsive behavior

- Voice and submit buttons have approved accessible names.
- Status and feedback use appropriate live regions.
- Focus is visible.
- Controls work by keyboard and touch.
- States do not rely on color.
- Reduced-motion preferences are respected.
- Five-point images and appearance images do not overflow.
- Touch targets are manually reviewed.
- Full-size controls are keyboard accessible.
- Screen-reader users receive equivalent image and interaction content.

### Completion and regression

- Completion card names the demonstrated competencies.
- Module 5 unlocks only after both checkpoints pass in normal mode.
- Modules 0–3 remain unchanged.
- Module 5 content remains unchanged.
- Review Mode remains unchanged.
- Authentication, entitlements, payments, progress sync, and certificate logic remain unchanged.
- No duplicate IDs, malformed HTML, console errors, or mobile overflow are introduced.

---

## Distinct learning rhythm

### Interaction density

**Moderate and visual-procedural.**

Module 4 should not copy Module 3’s anatomy-explorer rhythm.

Its experience is:

1. establish the role and limits of magnification;
2. standardize image collection;
3. move through a procedural five-point scan;
4. apply five observation lenses;
5. classify observation language;
6. complete a midpoint regional-reasoning checkpoint;
7. study illustrative appearance examples;
8. apply a decision ladder;
9. complete a stop-and-refer checkpoint.

### Signature learning moment

**Five stations prevent one-angle thinking.**

The student moves through the visual scalp scan and sees how one dramatic image becomes less authoritative when compared with four other regions.

### Secondary learning moment

**Say only what the image earned.**

The student separates:

- observation;
- working question;
- unsupported conclusion.

This is the mental discipline that makes magnification professionally useful.

### Visual rhythm

- Examination-area images establish spatial sequence.
- Microscopy-style images establish visual vocabulary.
- The images are not used as a diagnostic quiz.
- The oil/residue pair demonstrates uncertainty rather than pretending the categories are perfectly separable.

### Checkpoint rhythm

- `m4cp1`: midpoint, after collection and observation language.
- `m4cp2`: end, after service-decision and do-not-proceed content.

### Independent reasoning

The student classifies statements before receiving feedback and writes both checkpoint answers from their own reasoning.

### Cadence’s role

Cadence helps the student convert a visual impression into:

- objective notes;
- better questions;
- a conservative decision;
- a clear limit.

She should not pre-label every image before the student thinks.

### Curiosity and payoff

The module should repeatedly answer:

- Why can one image mislead?
- What changes when the crown and hairline do not match?
- Why can product residue look like a scalp concern?
- How can the device create redness?
- What makes a before-and-after comparison honest?
- What finding ends the service even when the client feels fine?

---

## Insider value and acceleration payoff

### Strongest insider knowledge

1. **Pressure can manufacture the finding.**  
   The device may blanch or redden the skin and create a false baseline.

2. **The lens can be the contamination.**  
   Oil or residue on the device can appear to belong to the client.

3. **Distribution beats drama.**  
   The most dramatic close-up may be less useful than the difference between five stations.

4. **Product history changes the image.**  
   Dry shampoo, root spray, fibers, oils, and medicated products can mimic scalp findings.

5. **A comparison is only honest when the setup matches.**  
   Different magnification, light, pressure, angle, or region can exaggerate results.

6. **Oil and residue may look nearly identical.**  
   The image shows appearance; consultation and repeatable cleansing observations provide context.

7. **The camera can improve trust without creating certainty.**  
   The client benefits from seeing and understanding the cosmetic decision—not from receiving a condition label.

### Practical decision rules

- **Front. Top. Crown. Side. Back.**
- Use the same five baseline stations before adding targeted views.
- At every station, read surface, openings, perifollicular area, shafts, and distribution.
- Write what is visible before writing what it may mean.
- Ask about product and wash history before calling material oil or buildup.
- Compare to the client’s own baseline rather than a universal color.
- Match capture conditions before showing a before-and-after.
- Preserve, modify, avoid, pause, or refer.
- The lack of pain does not make pustular or draining findings appropriate to treat.

### Subtle details beginners often miss

- The temporal area may need opposite-side comparison.
- The crown swirl changes how shafts cross the image.
- A matte field does not prove dehydration.
- Visible redness may be less obvious or appear differently across skin tones.
- An apparently “clean” view does not represent the entire scalp.
- The device requires its own consent, privacy, and sanitation process.
- A saved image may become identifiable client data even when the face is not shown.

### Mistakes this prevents

- Diagnosing from a magnified image.
- Treating one station as the whole scalp.
- Calling all visible material `congestion`.
- Blaming hygiene.
- Treating generated illustrative images as clinical evidence.
- Pressing the lens harder to improve focus.
- Saving or sharing images without proper permission.
- Continuing over draining, pustular, or broken skin.
- Creating misleading before-and-after comparisons.
- Performing an impressive assessment that does not change the service.

### Acceleration payoff

The student gains a repeatable professional sequence:

> **Collect → Compare → Describe → Ask → Decide**

That sequence shortens the trial-and-error period because the practitioner no longer needs to invent an assessment method during every service.

---

## Guided completion structure

### Estimated attentive learning time

**30–40 minutes** for the full visual and instructional experience.

This includes:

- client framing;
- image-integrity rules;
- five-point scan;
- observation lenses;
- classification interaction;
- appearance gallery;
- decision framework.

This is an unmeasured planning estimate.

### Estimated checkpoint time

**10–16 minutes** total for both checkpoints, plus revision time.

This is unmeasured.

### Estimated hands-on practice

**20–30 minutes** with a scalp camera and a practice partner or mannequin.

Suggested physical practice:

1. Clean and prepare the device according to instructions.
2. Explain the assessment and obtain permission.
3. Capture the five stations in order.
4. Use the same magnification and light when possible.
5. Write one observation per station.
6. Identify one difference in distribution.
7. Repeat one station and compare whether the setup matched.
8. Clean and disinfect the device after use.

### Competency demonstrated

The student can:

- perform a standardized multi-region scalp scan;
- collect usable images without creating artifacts;
- document visible findings;
- seek relevant context;
- avoid unsupported diagnosis;
- make an appropriate cosmetic or referral decision.

### Suggested practice task

Use the five-point scan on two different practice subjects or on one subject at two different times.

For each station, complete:

- **Visible:** What can I describe?
- **Context:** What do I still need to ask?
- **Difference:** How does this station compare with the others?
- **Decision:** Preserve, modify, avoid, pause, or refer?

This remains hands-on practice, not a certification checkpoint.

### Earlier concepts to revisit

- Welcome Module: observation before assumption.
- Module 1: observation versus diagnosis and professional referral.
- Module 2: calm client communication and consent.
- Module 3: surface findings do not establish internal cause.
- Module 3: oil, scale, tightness, and color change are clues—not conclusions.

### Guided Completion Path position

**Applied technical assessment — immediately after anatomy and before scalp-type service direction.**

Module 4 should be completed with access to a scalp camera or with a plan to repeat the hands-on practice when the device is available.

Do not implement the Guided Completion Path interface in this task.

---

## Listen Mode notes

### Narration suitability

The conceptual sections are suitable for narration.

The five-point scan, observation lenses, appearance gallery, and oil/residue comparison require structured audio descriptions and a return-to-screen cue.

### Approximate narration length

Approximately **16–20 minutes** at a calm instructional pace.

Do not narrate checkpoint model answers.

### Required visual-review cues

Add cues before:

- the five-point station images;
- the five observation lenses;
- the illustrative appearance gallery;
- the oil/residue comparison;
- the observation classification interaction.

Suggested cue:

> “This section is visual. The important relationships will be described in audio, and you should return to the screen to review the images and complete the practice.”

### Content that must be seen or explicitly described

- The location of all five assessment stations.
- Differences between oil-dominant and residue-dominant appearance.
- Color and scale variation in the illustrative examples.
- The difference between one station and a distributed pattern.

### Screen-based content

The student must use the screen to:

- move through the five-point scan;
- complete the classification interaction;
- inspect the appearance images;
- complete and submit both checkpoints.

### Audio-only completion limits

Listening must not:

- complete the five-point scan interaction;
- complete the observation classification;
- pass `m4cp1` or `m4cp2`;
- mark Module 4 complete.

Voice dictation may support checkpoint entry.

Do not implement Listen Mode in this task.

---

## Downloadable resource opportunity

### Recommended

Module 4 genuinely warrants a downloadable because the assessment framework has repeated service-room value and should not require the student to reopen the full lesson during every consultation.

### Proposed resource

**AIMT Five-Point Scalp Assessment Record**

Suggested filename:

`module-04-five-point-scalp-assessment-record.pdf`

### Practical value

The resource should help the practitioner:

- follow the same five stations every time;
- record image filenames or capture numbers;
- document observations through the five lenses;
- compare regional differences;
- record product and wash history;
- separate visible findings from unsupported conclusions;
- choose preserve, modify, avoid, pause, or refer;
- document client consent for image capture;
- create repeatable future comparisons.

### Recommended format

A two-page resource supplied as:

- fillable PDF;
- print-friendly PDF.

Do not embed client images directly into the PDF unless the eventual storage workflow is reviewed for privacy and security.

### Suggested page structure

**Page 1 — Five-point scan**

- Client/date/service
- Device and magnification
- Wash timing and root-product history
- Image-capture consent
- Five numbered stations
- Space for image ID and one objective note per station

**Page 2 — Observation and decision**

- Scalp surface
- Follicular openings
- Perifollicular area
- Hair shafts
- Distribution
- Client sensation/history
- Preserve / Modify / Avoid / Pause / Refer
- Follow-up or referral note
- Comparison-condition checklist

### Lesson placement

Place the download card immediately after Section 4.5, the five observation lenses.

Do not add a dead download button before the file exists.

### Future dashboard placement

> **Student Resources → Assessment & Consultation Tools → Module 4**

The user will create and approve the resource separately.

Do not build the dashboard folder or download system during Module 4 implementation.

---

## Implementation notes

1. Treat this specification as the implementation authority.
2. Preserve `module4Wrap`, `M4`, `m4cp1`, `m4cp2`, `m4Complete`, module ID `4`, stored progress, and Module 5 gating.
3. Preserve existing passed checkpoint state.
4. Do not rename technical IDs.
5. Do not edit Module 5 production content.
6. Replace the static five-region grid with the approved accessible stepper.
7. Keep both ungraded interactions non-persistent.
8. Replace the five scalp-type protocol cards with the approved illustrative appearance gallery.
9. Use all five examination-area source images.
10. Preserve all original PNG assets.
11. Create responsive WebP derivatives for examination-area images.
12. Create cropped, responsive WebP derivatives for the microscopy-style images.
13. Do not modify the internal scalp depiction beyond crop, resize, and compression.
14. Remove or visually supersede inaccurate baked-in labels.
15. Add the visible illustrative-image notice.
16. Do not grade image identification against generated images.
17. Use the exact same strings for visible and evaluated checkpoint questions.
18. Use checkpoint-specific evaluator configurations.
19. Reuse accessibility and checkpoint patterns already implemented in Modules 0–3.
20. Use one authoritative Module 4 quick-prompt source.
21. Remove the old course name and Cadence personal-experience claim.
22. Remove `dry scalp vs dandruff` from the Module 4 guide prompt.
23. Add image-consent and privacy copy without implementing a new data-storage system.
24. Add manufacturer-directed device-cleaning language without inventing a universal protocol.
25. Do not add the proposed downloadable until the user supplies the final file.
26. Do not implement persistent Cadence threads, Guided Completion Path UI, Listen Mode, Module 12, certificate changes, or dashboard resources.
27. Do not refactor unrelated course code.
28. Update `docs/course-audit/modules/README.md` and `docs/course-audit/implementation-log.md` after implementation.
29. Set Module 4 status to `Implemented — awaiting manual QA` only after acceptance testing.
30. Record anything still requiring:
    - live-model QA;
    - screen-reader QA;
    - physical-keyboard QA;
    - real touch-device QA;
    - medical subject-matter review;
    - privacy/legal review of saved-image workflow;
    - future replacement with authenticated clinical captures.

### External verification basis for this audit

The approved corrections were informed by:

- Clinical trichoscopy literature describing it as a diagnostic adjunct and grouping findings into hair-shaft, follicular, perifollicular, scalp, and distribution patterns.
- Published trichoscopy reviews noting that some visual findings are nonspecific and may appear across multiple disorders.
- Research emphasizing variation in trichoscopic appearance across darker scalp phototypes.
- Dermatology guidance indicating that pustular, oozing, painful, rapidly changing, scar-like, or otherwise concerning findings require medical evaluation.
- CDC and FDA principles requiring reusable contact equipment to be cleaned and disinfected according to its intended use and manufacturer instructions.

The final medical and regulatory language should still receive qualified subject-matter review before public launch.
