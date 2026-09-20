# Module 4 — Cadence Listen Mode Narration Script (Pilot Draft)

**Status:** DRAFT — first editorially reviewed Listen Mode script for any AIMT
module. Owner review required before any further work.
**Pilot module:** Module 4 — Microscopy & Scalp Assessment.
**Date drafted:** 2026-08-30.
**Branch:** `course-audit-build`. **This is a documentation-only task.** No
audio was generated, no TTS/ElevenLabs API was called, no course UI, curriculum,
checkpoint, rubric, or Cadence chat/grading code was touched.

**Curriculum authority for this draft:**
- Production implementation: [`headspa-mastery.html`](../../../headspa-mastery.html) lines 3999–4651 (`module4Wrap`), read directly from the live course file — this is what students actually see and hear adapted, not the spec in isolation.
- Approved specification: [`docs/course-audit/modules/module-04.md`](../modules/module-04.md), used to confirm intent and fill in context (e.g., why the module is shaped this way) where the production copy alone doesn't state it.
- Governing voice standard: [`docs/course-audit/00-cadence-character-instruction-constitution.md`](../00-cadence-character-instruction-constitution.md).
- Checkpoint questions were cross-checked against the evaluator strings in `headspa-mastery.html` (`M4.questions.m4cp1` / `m4cp2`, ~line 8522–8523) and are byte-identical to the on-screen `cp-q` text. Where the approved spec's wording differs slightly from production (`m4cp2` reads "During the crown **assessment**…" in production vs. "During the crown **station**…" in the spec), **production wins** — that's what this script reads aloud.

---

## OWNER REVIEW — please assess

This is the first Listen Mode script AIMT has ever produced. Before any
technical build happens, please read the full script below (or listen to it
read aloud) and weigh in on:

1. Does this sound like Cadence?
2. Is she conversational enough?
3. Is anything too lecture-like?
4. Are the visual descriptions useful, or are they annoying / unnecessary?
5. Does she add enough value beyond just reading the page?
6. Is any section too long?
7. Does the checkpoint transition feel natural?
8. Are there places Cadence should slow down or emphasize more (or less)?
9. Does any proposed explanatory addition go farther than AIMT should teach? (See **New Explanatory Material Proposed**, near the end — there is exactly one, and it's flagged below.)

---

## How to read this document

Each numbered chunk below is a standalone, independently regenerable audio
unit. For every chunk you'll find:

- **CHUNK ID** — e.g. `M4-01`
- **SOURCE SECTION** — which part of the live module this adapts
- **APPROX PURPOSE** — what this chunk needs to accomplish
- **VISUAL ON SCREEN** — what's displayed if the student is looking
- **PERFORMANCE NOTES** — sparse, provider-agnostic delivery cues in brackets (`[WARM]`, `[SHORT PAUSE]`, etc.) — not ElevenLabs tags, just editorial direction for later translation
- **SPOKEN SCRIPT** — the actual words Cadence says
- **CHECKPOINT/GATE BEHAVIOR** — only present where relevant
- **SOURCE TRACEABILITY** — exact line numbers in `headspa-mastery.html`
- **OWNER-REVIEW FLAGS** — only present where something needs your eyes specifically

Performance tags are intentionally sparse — most sentences carry none. The
goal is a human rhythm, not a radio drama.

---

## Chunk map

| ID | Covers | Checkpoint? |
|---|---|---|
| M4-01 | Hero + 4.1 The role of magnification | — |
| M4-02 | 4.2 Presenting the assessment (consent scripts) | — |
| M4-03 | 4.3 Image integrity (six technique cards + sanitation) | — |
| M4-04 | 4.4 The five-point scalp scan (all five assessment points) | — |
| M4-05 | 4.5 The five observation lenses | — |
| M4-06 | "Say only what the image earned" (classification exercise) | — |
| M4-07 | Checkpoint 1 — `m4cp1` | **STOP** |
| M4-08 | Post-pass continuation (`m4cp1`) | resume only |
| M4-09 | 4.6 Appearance examples, part 1 (Baseline / Oil-dominant / Fine-scale) | — |
| M4-10 | 4.6 Appearance examples, part 2 (Color change / Residue) + oil-vs-residue comparison | — |
| M4-11 | 4.7 From image to decision (four decision cards) | — |
| M4-12 | 4.8 When not to proceed (warning cards + referral script) | — |
| M4-13 | 4.9 Practitioner insight (five insight cards) | — |
| M4-14 | 4.10 Common mistakes (six mistake/fix cards) | — |
| M4-15 | Checkpoint 2 — `m4cp2` | **STOP** |
| M4-16 | Post-pass continuation (`m4cp2`) + module completion | resume only |

16 chunks. None under ~350 words, none over ~750 — no 10-second fragments, no
monoliths.

---

## The script

### M4-01 — Opening: the role of magnification

**SOURCE SECTION:** Hero block + Section 4.1 (`headspa-mastery.html` lines 4002–4022)
**APPROX PURPOSE:** Set tone, establish the module's central distinction (magnification ≠ diagnosis), open with Cadence's own already-approved voice note.
**VISUAL ON SCREEN:** Module hero — eyebrow, title ("Stop assuming. Start seeing."), description.
**PERFORMANCE NOTES:** `[WARM]` open. `[EMPHASIZE]` on the trichoscopy distinction. `[LET THIS LAND]` on the key point.

**SPOKEN SCRIPT:**

> [WARM] Alright — Module Four. This is where we stop guessing and start actually looking. Stop assuming, start seeing — that's the whole idea, right in the name.
>
> [SHORT PAUSE] Here's the shift going into this module. Up to now you've been building your foundation. Now we're adding a tool: scalp magnification. And I want to be really clear about what that tool actually does for you, because it's easy to get this wrong in a way that matters.
>
> A scalp camera shows you things the naked eye misses — shine, scale, residue, material right at the follicle, how the hair shafts look, how one area compares to another. That's real, useful information.
>
> [EMPHASIZE] But here's the part I want you to hold onto: the camera doesn't tell you *why* you're seeing what you're seeing. There's a real clinical technique called trichoscopy — dermoscopy of the hair and scalp, used by qualified clinicians as part of an actual medical diagnosis, alongside history and examination. What you're doing in a head spa is not that. It's a cosmetic observation and education tool. Different purpose, different authority.
>
> So the value of this device isn't certainty. It's precision. It sharpens what you're able to see so you can make a better cosmetic decision — not so you can hand someone a diagnosis.
>
> [LET THIS LAND] The image can sharpen the question. It can't answer every question.
>
> [CURIOUS] And I'll say this early, because it's the whole philosophy of this module: a weak assessment names the scalp too quickly. A strong assessment collects the view, compares regions, asks for context, and lets the service decision stay no more certain than the evidence actually is. Keep that in your back pocket — we're coming back to it constantly.

**SOURCE TRACEABILITY:** Hero (4002–4006), body-text ×3 (4010–4012), key-point (4014–4017), Cadence note (4019–4022).
**OWNER-REVIEW FLAGS:** None.

---

### M4-02 — Presenting the assessment

**SOURCE SECTION:** Section 4.2 (lines 4026–4048)
**APPROX PURPOSE:** Teach the live-view script, the separate image-capture consent script, and the layered-consent principle.
**VISUAL ON SCREEN:** Two quoted scripts (live-view, image-capture consent), a privacy note, a client-language rule.
**PERFORMANCE NOTES:** `[SLOW SLIGHTLY]` through both quoted scripts — these need to be usable verbatim. `[EMPHASIZE]` on the separated-consent distinction.

**SPOKEN SCRIPT:**

> Before that camera ever touches a client's scalp, there's a conversation that needs to happen. Not a disclaimer — a conversation.
>
> You want the client to understand what the camera is for *before* it's anywhere near their head. Framed right, this should feel like part of customizing their service — not like you're hunting for something wrong with them.
>
> [SLOW SLIGHTLY] Here's language close to what you'd actually say, live, in the chair: "Before we begin, I'm going to look at several areas of your scalp under magnification. I'll use what is visible — along with what you tell me — to customize the cosmetic service. The camera helps us see detail, but it does not diagnose a scalp condition."
>
> That's the live-view piece. Saving an image is a separate conversation, and I want you to treat it as genuinely separate — not something you fold into the first sentence. Something like: [SLOW SLIGHTLY] "I can use the camera for a live view without saving anything. I can also capture comparison images for your service record. Would you like me to save them, and may I explain how they'll be stored and used?"
>
> [EMPHASIZE] Here's the distinction that actually matters: permission to view is not permission to save. And permission to save for the client's own record is not permission to post it, teach from it, send it to another service, or use it in marketing. Those are all separate permissions — don't collapse them into one yes.
>
> And whatever you find, when you show it to a client: describe the finding, explain the cosmetic decision it leads to, and be honest about the limit when you can't determine a cause. The goal is never to make someone feel dirty, damaged, or alarmed by their own scalp.

**SOURCE TRACEABILITY:** body-text (4028), live-view script (4030–4033), consent script (4035–4038), privacy note (4040–4043), client-language rule (4045–4048).
**OWNER-REVIEW FLAGS:** None.

---

### M4-03 — Image integrity

**SOURCE SECTION:** Section 4.3 (lines 4052–4091)
**APPROX PURPOSE:** Teach the six-point image-collection standard plus device sanitation, as a "the setup determines the result" mindset.
**VISUAL ON SCREEN:** Six technique cards, a sanitation clinical-note, a closing key point.
**PERFORMANCE NOTES:** `[EMPHASIZE]` on the pressure/technique-4 point — it's the one most likely to be skipped in real practice.

**SPOKEN SCRIPT:**

> [CURIOUS] Here's something people don't expect: most of what makes a magnified image useful or useless happens *before* the lens ever touches the scalp. Magnification doesn't fix a sloppy setup — it exaggerates it. So let's standardize the conditions first. Six things, quickly:
>
> One — assess before treatment. Before water, exfoliants, oils, masks, steam, anything that changes the surface.
>
> Two — ask what's already on the scalp. Wash timing, dry shampoo, root sprays, oils, fibers, medicated products, recent chemical services, recent scratching. All of it can change what you're about to see.
>
> Three — part cleanly. A clear view without scraping the same spot over and over.
>
> Four — touch lightly. [EMPHASIZE] This one matters more than it sounds — rest the device steadily, because excess pressure can blanch or redden the skin and create the very finding you think you just discovered.
>
> Five — hold the view. Stay on an assessment point long enough to actually look. Constant sweeping gets you motion, blur, and a shallow read.
>
> And six — if you're comparing two images, make the comparison honest. Match the region, the magnification, the light, the pressure, the orientation, the device settings. All of it.
>
> [SHORT PAUSE] One more thing that belongs right here, even though it's not glamorous: clean and disinfect the reusable contact surfaces before and after every client, following the manufacturer's instructions and whatever rules apply to you. Never place the device on skin that's broken, bleeding, weeping, oozing, or draining. We'll come back to that later in the module, because it matters a lot.
>
> [LET THIS LAND] If the setup changes, the image changes. Document the difference before you call it improvement.

**SOURCE TRACEABILITY:** intro (4054), six condition-cards (4057–4081), sanitation note (4083–4086), key point (4088–4091).
**OWNER-REVIEW FLAGS:** None.

---

### M4-04 — The five-point scalp scan

**SOURCE SECTION:** Section 4.4 (lines 4095–4184)
**APPROX PURPOSE:** Walk the student through all five baseline assessment points, verbally, in a way that stands on its own even with the screen off.
**VISUAL ON SCREEN:** The five-point stepper — one image per assessment point, each showing a marked location on a model's head.
**PERFORMANCE NOTES:** `[EMPHASIZE]` the memory line. `[VISUAL CUE]` before describing the stepper. `[LET THIS LAND]` on the closing line.

**SPOKEN SCRIPT:**

> [WARM] Okay — this next part is the backbone of the module, so let's slow down a little.
>
> The scalp isn't one uniform surface. Look at only one spot, and you'll let that one dramatic image speak for the entire head — that's exactly the mistake this module exists to prevent. So there's a baseline: the same five assessment points, in the same order, every time.
>
> Here's the memory line, and I want this one to actually stick: [EMPHASIZE] Front. Top. Crown. Side. Back.
>
> [VISUAL CUE] On screen right now there's a five-point stepper — you can move through each assessment point, and each one has a photo showing where on the head it sits, marked with an outline and a point.
>
> If you're listening without looking — picture a head from five angles: straight on at the hairline, straight down at the part, from above and behind at the crown, from the side at the temple, and from directly behind, low, at the back of the skull. These are five separate reference photos, by the way, not one continuous sequence of the same person turning their head — different models were used for different angles on purpose. Treat each one as its own location guide.
>
> Assessment point one is the frontal hairline. Often the easiest place to spot styling product, tension, scale, or whatever the client's own stated concern is. Technique-wise: separate the hair gently, and don't rub the hairline right before capturing the image — you don't want to create the finding you're about to look for.
>
> Point two is the top parting. A consistent central view — scalp surface, follicular openings, hair distribution along the part. If you ever come back for a comparison image later, use that exact same part location.
>
> Point three is the crown, or vertex. The point here is comparison — don't assume the crown looks like the parting or hairline just because they're close together. Work *with* the natural swirl instead of forcing it flat.
>
> Point four is the temporal area — the side, near the temple. A lateral read, compared against the central scalp. Practical tip: if there's asymmetry, tension, tenderness, or a localized concern reported, check the *opposite* side too.
>
> And point five is the occipital area — the back of the head, low, behind. Easy to skip, since the client never sees it themselves, but it can look genuinely different from what they style every day. Just make sure the hair's secured well enough that the lens stays steady and the client isn't stuck holding an awkward position.
>
> [LET THIS LAND] Once you've been through all five, that's your baseline. From there, the client's actual concern tells you where to add targeted views beyond the standard five.

**CHECKPOINT/GATE BEHAVIOR:** None — the on-screen stepper is ungraded and writes no progress; narration doesn't need to gate on interaction.
**SOURCE TRACEABILITY:** intro (4097–4101), all five `m4-station-panel` blocks (4117–4176), station-4's different-model note (4163), completion line (4183).
**OWNER-REVIEW FLAGS:** None — all location description stays within the approved alt-text pattern; no visual detail beyond what the course already documents was added.

---

### M4-05 — The five observation lenses

**SOURCE SECTION:** Section 4.5 (lines 4188–4235)
**APPROX PURPOSE:** Teach the five lenses as a repeatable checklist, with the documentation-language examples spoken close to verbatim since they're the whole teaching point.
**VISUAL ON SCREEN:** Five parallel cards (surface, follicular openings, perifollicular area, hair shafts, distribution).
**PERFORMANCE NOTES:** `[EMPHASIZE]` on the "do not write" and "limit" callouts — these are corrective, not descriptive.

**SPOKEN SCRIPT:**

> So now you've got five assessment points. At every single one, I want you looking through the same five lenses. This is what keeps your observations specific enough to be useful, and restrained enough to stay honest.
>
> First — scalp surface. Color relative to the client's *own* surrounding baseline, not some universal standard, plus sheen, loose or adherent scale, coating, residue, and whether the skin is intact. You'd write something like: "Diffuse surface shine at the crown with small areas of adherent yellow-white material."
>
> Second — follicular openings. Are they visible? Is there material at or around them? You'd document: "Several openings show visible material around the emerging shafts." [EMPHASIZE] What you would *not* write is "the follicles are clogged." That's a conclusion the image hasn't earned.
>
> Third — the perifollicular area, meaning the area immediately around a follicle. Color change, scale, visible material right there: "Color change and fine scale are visible around several follicles in this area."
>
> Fourth — hair shafts. Breakage, coating, residue, variation, how many shafts you can see in the field: "Short and longer shafts are visible in the same field; several shafts have surface residue." [EMPHASIZE] And the limit here is real — one image cannot establish *why* a shaft is broken or thinning. It can only tell you that it is.
>
> And fifth — distribution. Localized, diffuse, symmetric, or different from the last assessment point? "The crown shows more surface shine and residue than the frontal hairline."
>
> [LET THIS LAND] Of those five, distribution is the one people underrate. One image is a detail. The full scan — comparing what you found at each point — that's the actual pattern. And the pattern is usually more useful than the most dramatic single close-up you captured.

**SOURCE TRACEABILITY:** intro (4190), all five condition-cards (4194–4229), key point (4232–4235).
**OWNER-REVIEW FLAGS:** None.

---

### M4-06 — "Say only what the image earned"

**SOURCE SECTION:** classification interaction (lines 4239–4293; answers/feedback from `M4_CLASSIFY_ANSWERS`, ~line 9409)
**APPROX PURPOSE:** Preserve the discipline exercise as a spoken worked-example walkthrough, since the on-screen version is click-and-reveal and Listen Mode can't wait for a tap.
**VISUAL ON SCREEN:** Five statements, each with three classification buttons and immediate feedback.
**PERFORMANCE NOTES:** `[SHORT PAUSE]` after each statement, genuinely long enough for a listener to guess before the reveal.

**SPOKEN SCRIPT:**

> [CURIOUS] Before your first checkpoint, a short discipline exercise — this is Module Four in miniature. Can you tell the difference between something you actually saw, a question you still need answered, and a conclusion you haven't earned yet?
>
> Five realistic statements. For each one, decide for yourself first: supported observation, working question, or unsupported conclusion. [SHORT PAUSE] If you've got the page open, this is a great moment to actually click through it yourself before I tell you the answer.
>
> Statement one: "The crown shows diffuse shine and visible yellow-white material around several follicular openings." [SHORT PAUSE] Supported observation — it describes location and appearance without claiming what the material is or why it's there.
>
> Statement two: "Could the visible material be influenced by dry shampoo, root spray, oil, or wash timing?" [SHORT PAUSE] Working question — it names what context is missing without turning the image into a conclusion.
>
> Statement three: "The client's follicles are clogged because they don't shampoo enough." [SHORT PAUSE] Unsupported conclusion. The image can't prove obstruction, hygiene, or cause.
>
> Statement four: "The temporal area looks darker and the client reports burning, so I'd avoid stimulation there and ask whether this is new." [SHORT PAUSE] Also a working question — it combines a visible difference with something the client told you, and changes the service without naming a condition.
>
> And statement five: "This is seborrheic dermatitis." [SHORT PAUSE] Unsupported conclusion. A cosmetic magnification image doesn't establish a medical diagnosis. Full stop.
>
> [LET THIS LAND] Strong assessment language is precise about what's visible, and disciplined about what remains unknown. That's basically the thesis of this whole module.

**CHECKPOINT/GATE BEHAVIOR:** None — ungraded, non-persistent, no attempt limit on screen either.
**SOURCE TRACEABILITY:** intro (4241), five `m4-classify-block` statements (4244–4291), `M4_CLASSIFY_ANSWERS` feedback text (line ~9409–9415), completion line (4293).
**OWNER-REVIEW FLAGS:** The state → pause → reveal format is a genuine adaptation choice (turning a click-to-reveal UI exercise into a spoken worked example) rather than a wording change. It's not new *content* — every statement and every piece of feedback is quoted exactly from production — but it IS a new *format* decision that will recur in other modules with similar ungraded interactions. Worth confirming this is the right general pattern before it gets reused elsewhere.

---

### M4-07 — Checkpoint 1 (`m4cp1`)

**SOURCE SECTION:** `#m4cp1` (lines 4297–4313); evaluator string `M4.questions.m4cp1` (~line 8522)
**APPROX PURPOSE:** Transition naturally into the required checkpoint and deliver the exact question.
**VISUAL ON SCREEN:** The `m4cp1` checkpoint card — question text, text input, voice button, submit button.
**PERFORMANCE NOTES:** `[SLOW SLIGHTLY]` through the exact question — accuracy matters more than pace here.

**SPOKEN SCRIPT:**

> [WARM] Alright. You've done the scan, used the five lenses, practiced separating what you saw from what you were guessing. Now put it together yourself.
>
> [SHORT PAUSE] Here's your checkpoint, exactly as written:
>
> [SLOW SLIGHTLY] "During a five-point scan, the crown appears shiny with visible material around several follicular openings, while the frontal hairline looks matte with fine loose scale. The client reports no pain or burning. Describe what you would document, explain why one label for the entire scalp would be weak, and name one question you would ask before deciding how to adjust the service."
>
> [CHECKPOINT STOP — PLAYBACK PAUSES]
>
> Take your time. I'm not going anywhere.

**CHECKPOINT/GATE BEHAVIOR:** `[CHECKPOINT STOP — PLAYBACK PAUSES]`. Playback halts here. No qualifying answer is scripted. No automatic progression. Resume only via M4-08, and only after an authoritative pass from the real grading system.
**SOURCE TRACEABILITY:** `cp-q` (line 4302), verified byte-identical to `M4.questions.m4cp1` (line 8522).
**OWNER-REVIEW FLAGS:** None — question text is exact, unparaphrased.

---

### M4-08 — Post-pass continuation (`m4cp1`)

**SOURCE SECTION:** N/A (new narration-UX transition line, not existing course copy)
**APPROX PURPOSE:** A short, warm resume line — not new teaching, just continuity after a real pass.
**VISUAL ON SCREEN:** Whatever comes after a passed `m4cp1` — Section 4.6 begins.
**PERFORMANCE NOTES:** `[WARM]`, brief.

**SPOKEN SCRIPT:**

> [PLAY ONLY AFTER AUTHORITATIVE CHECKPOINT PASS]
>
> [WARM] Good. That's exactly the kind of thinking this device is supposed to produce — describe both regions honestly, resist collapsing them into one label, and know what question still needs an answer before you touch the service plan.
>
> Keep that instinct with you. We're about to look at what happens when the evidence points somewhere more serious.

**CHECKPOINT/GATE BEHAVIOR:** `[PLAY ONLY AFTER AUTHORITATIVE CHECKPOINT PASS]`. This is narration UX, not grading logic — it plays only once the real evaluator has already returned a pass for `m4cp1`.
**SOURCE TRACEABILITY:** N/A — transitional line only, not adapted from any specific course copy.
**OWNER-REVIEW FLAGS:** This entire chunk is original narration-UX writing (a resume line), not adapted course content — flagging per the instruction to mark genuinely new material, even though it carries no teaching claim, just tone and continuity.

---

### M4-09 — Appearance examples, part 1

**SOURCE SECTION:** Section 4.6, intro + Examples 1–3 (lines 4317–4378)
**APPROX PURPOSE:** Build visual vocabulary for baseline, oil-dominant, and fine-scale appearances using the four-level framework (visible / context needed / may change / does not prove).
**VISUAL ON SCREEN:** Illustrative-labeled gallery cards, one image each.
**PERFORMANCE NOTES:** `[VISUAL CUE]` once, before the pattern repeats across all five examples.

**SPOKEN SCRIPT:**

> [CURIOUS] Now let's build some visual vocabulary — five appearance examples. Quick thing that matters: these are illustrative magnified examples. Not real client photos, not proof of any diagnosis. Actual scalp appearance varies by client, skin tone, lighting, magnification, the device, product history — all of it. Use these to practice describing what you see and asking good questions, not to memorize five categories of scalp.
>
> [VISUAL CUE] Each example on screen shows the image itself, clearly labeled illustrative, with four things underneath: what's visible, what context is still needed, what it might change about the service, and what it does not prove.
>
> Example one: the baseline-appearing view. [SLOW SLIGHTLY] What's visible is a relatively even surface, clearly visible follicular openings, minimal obvious scale or coating, no strong localized color change. What you still need: the client's own baseline, their product habits, how it feels to them, and comparison with the other four assessment points. What this might change: not much — avoid over-correcting, follow the client's actual goals. And what it doesn't prove — this is the one people skip — is that the scalp is universally "healthy" or medically normal everywhere else. You only saw one assessment point.
>
> Example two: oil-dominant appearance. Diffuse shine and sebum-like material around several follicular openings. Context needed: time since the last wash, product use, sweating, recent heat, how it feels to the client, whether other regions show the same thing. This might support a more thorough but still conservative cleansing direction, once the full assessment is done. What it does not prove: sebum overproduction, poor hygiene, dandruff, infection, or a clogged follicle. None of those are visible facts — they're guesses dressed up as facts.
>
> Example three: fine-scale, or dry-appearing surface. A more matte surface, fine loose scale, less obvious shine. Context needed: tightness, itching, burning, cleansing frequency, recent clarifying treatments or chemical services, weather exposure, and again — comparison with the other regions. This might support a gentler, simplified service, avoiding anything aggressive. What it doesn't prove: dehydration, barrier damage, dandruff, dermatitis, or any specific medical cause of the scale. [EMPHASIZE] Dry-looking is not the same claim as dry-diagnosed.

**SOURCE TRACEABILITY:** intro + illustrative-examples note (4319–4324), Example 1 (4326–4342), Example 2 (4344–4360), Example 3 (4362–4378).
**OWNER-REVIEW FLAGS:** [OWNER REVIEW — NEW EXPLANATORY MATERIAL] — an earlier draft of this chunk included a spoken aside pointing the student to "Module Six" for the fuller dry-scalp-versus-dandruff distinction. That framing is consistent with the approved spec's own internal scoping note (`module-04.md`, Required Correction #6: *"Module 4 should not teach the dry-scalp-versus-dandruff diagnosis distinction... belongs in Module 6"*) but **does not appear anywhere in the actual student-facing Module 4 copy**, so it was removed from the script above pending your call. If you want that signpost spoken aloud to students, say so and it goes back in verbatim as: *"and by the way, the deeper dry-scalp-versus-dandruff distinction isn't something we're getting into here — that's Module Six territory."*

---

### M4-10 — Appearance examples, part 2 + oil-vs-residue comparison

**SOURCE SECTION:** Section 4.6, Examples 4–5 (lines 4380–4414) + Section J oil/residue comparison (lines 4418–4452)
**APPROX PURPOSE:** Complete the appearance gallery, then land the module's secondary signature teaching moment — two similar-looking images, two different possible stories.
**VISUAL ON SCREEN:** Examples 4 and 5, then the oil-dominant/surface-residue images shown side by side.
**PERFORMANCE NOTES:** `[VISUAL CUE]` before the side-by-side pairing. `[LET THIS LAND]` on the closing line — this is the module's stated secondary learning moment.

**SPOKEN SCRIPT:**

> Example four: visible color change, or reactive-appearing area. Color variation relative to the surrounding field, maybe some scale or material around a few follicles. Context needed: pain, burning, itching, heat, recent product or chemical exposure, scratching, friction — and whether the color changed only *after* the device made contact, which matters a lot. This might mean reducing pressure, heat, friction, and product load, or avoiding the area entirely if the client reports discomfort or the skin looks compromised. What it doesn't prove: sensitivity, inflammation, allergy, infection, or any specific condition. [EMPHASIZE] "Reactive-appearing" is cosmetic shorthand — it is not a medical conclusion.
>
> Example five: surface residue, or buildup. A coated appearance, visible material on the surface and around some shafts or openings. Context needed: dry shampoo, root sprays, fibers, oils, styling products, medicated products, wash timing, sweating — and a good practical test: whether a gentle cleanse actually changes what you're seeing. This might support careful cleansing, but only after reviewing sensitivity, skin integrity, and product history. What it doesn't prove: follicular blockage, infrequent hygiene, sebum composition, infection, or the actual cause of the material.
>
> [SHORT PAUSE] Now — I want to put examples two and five next to each other on purpose, because this is where practitioners get sloppy.
>
> [VISUAL CUE] On screen, the oil-dominant image and the surface-residue image are shown side by side.
>
> Both of those can show shine or material sitting right around the follicular openings. And the microscope genuinely cannot tell you, from appearance alone, what that material actually is. So before you call it oil, scale, or product buildup — ask. When was the hair last washed? What's being used right at the root? Is there tightness, itching, burning, tenderness, or oil coming back unusually fast? Is this across the whole scalp or just one region? And does a gentle cleanse actually change what's visible?
>
> [LET THIS LAND] When two possible stories look this similar, the move isn't to pick the more confident-sounding label. It's to ask a better question.

**SOURCE TRACEABILITY:** Example 4 (4380–4396), Example 5 (4398–4414), comparison section (4418–4452, including the five bulleted questions in the `clinical-note`).
**OWNER-REVIEW FLAGS:** None.

---

### M4-11 — From image to decision

**SOURCE SECTION:** Section 4.7 (lines 4456–4482)
**APPROX PURPOSE:** Land the four-way decision framework as the payoff of everything taught so far.
**VISUAL ON SCREEN:** Four decision cards (Preserve / Modify conservatively / Avoid or pause / Stop and refer).
**PERFORMANCE NOTES:** `[LET THIS LAND]` on the closing reframe — it's the module's clearest "aha."

**SPOKEN SCRIPT:**

> [WARM] So — what's all of this actually *for*? Assessment isn't a performance you put on for the client. Every image should point toward one of four real decisions.
>
> Preserve — the surface is intact, the client's comfortable, nothing calls for correction. Don't over-treat. Follow what the client actually wants.
>
> Modify conservatively — oil, scale, residue, or regional variation, but no broken skin, no marked pain, no drainage, no concerning loss pattern. Adjust cleansing, exfoliation, temperature, pressure, product load — conservatively. Module Five builds out the fuller version of this.
>
> Avoid or pause an area — a specific region shows discomfort, real color change, recent irritation, tenderness, or genuine uncertainty. Don't overwork it. Simplify it, skip it, or come back another day.
>
> And stop and refer — nonintact skin, drainage, pustules, severe pain, heat, swelling, rapid change, patchy or scarred-looking areas. Don't continue a cosmetic service over that. Explain the limit of what you can assess, and point them toward medical evaluation.
>
> [LET THIS LAND] Here's the mindset shift: the more advanced move isn't always a bigger, more complex treatment. Sometimes it's less treatment. Sometimes it's no treatment today. That takes more judgment than doing more — not less.

**SOURCE TRACEABILITY:** intro (4458), four condition-cards (4462–4477), key point (4479–4482). ("Module Five builds out the fuller version" reflects the card's own text: *"Module 5 develops these treatment directions."*)
**OWNER-REVIEW FLAGS:** None.

---

### M4-12 — When not to proceed

**SOURCE SECTION:** Section 4.8 (lines 4486–4514)
**APPROX PURPOSE:** Teach the four stop conditions and the exact referral script.
**VISUAL ON SCREEN:** Four warning cards, the referral script, a device-contamination note.
**PERFORMANCE NOTES:** `[SLOW SLIGHTLY]` through the referral script. `[EMPHASIZE]` on "you do not need the diagnosis."

**SPOKEN SCRIPT:**

> [SHORT PAUSE] Now let's talk about the moment the camera does its most important job — the moment it tells you to stop.
>
> Four situations, and they group by what you're seeing or hearing, not by some diagnosis you're supposed to guess at.
>
> First — nonintact or draining skin. Broken, bleeding, weeping, oozing, pustular, crusted, visibly draining. Stop camera contact immediately, and don't continue the cosmetic service over that area.
>
> Second — marked pain or an inflamed appearance. Heat, swelling, severe tenderness, intense burning, pain that seems disproportionate. Don't massage through it, and don't use the service to "test" whether it gets better.
>
> Third — a concerning hair-loss pattern. Rapidly changing density, patchy loss, smooth or shiny areas, anything scar-like, or loss involving the brows or lashes. Describe and document what you see — without naming a condition — and recommend medical evaluation.
>
> And fourth — genuine uncertainty outside your cosmetic scope. Sometimes what you're looking at just doesn't fit a course example, or a few warning signs overlap at once. [EMPHASIZE] Here's the thing to remember: you do not need the diagnosis to know the service should pause. You just need the uncertainty.
>
> When you're in this territory, here's language that actually works, close to word for word: [SLOW SLIGHTLY] "I'm seeing an area that should be medically evaluated before we continue a scalp service over it. I can document what is visible, but I can't determine the cause from a cosmetic assessment. Once it's been evaluated, we can decide what kind of service is appropriate."
>
> Calm. Honest. No diagnosis, no alarm, and a clear next step for the client.
>
> [SHORT PAUSE] One more piece that's easy to forget in the moment: if the device made contact with anything draining, bleeding, or otherwise compromised, take it out of service and follow the manufacturer's required cleaning and disinfection procedure before it touches anyone else.

**SOURCE TRACEABILITY:** four `clinical-note` warning cards (4489–4504), referral script (4506–4509), device-contamination key point (4511–4514).
**OWNER-REVIEW FLAGS:** None — referral script quoted exactly.

---

### M4-13 — Practitioner insight

**SOURCE SECTION:** Section 4.9 (lines 4518–4545)
**APPROX PURPOSE:** Insider-knowledge framing — the ways the device itself can mislead an inexperienced practitioner.
**VISUAL ON SCREEN:** Five info cards.
**PERFORMANCE NOTES:** `[CURIOUS]` open — this section is meant to feel like a genuine "here's what experience teaches you" moment.

**SPOKEN SCRIPT:**

> [CURIOUS] Let's talk about the ways the device itself can trick you — because it can, and this is what separates someone who's actually good at this from someone who just owns the equipment.
>
> Pressure changes color. Too much contact can blanch or redden the scalp, so capture your baseline before repeated contact alters what you're looking at.
>
> A dirty lens creates a false story. Haze, residue, oil, or scale on the device itself can look like it belongs to the client. Check and prep your lens before every scan.
>
> Products can imitate pathology. Dry shampoo, fibers, root spray, oils, masks, medicated products — all of it can change surface appearance in ways that look clinical if you don't ask first.
>
> One image is not the scalp. A dramatic crown image doesn't erase a calm hairline, and a clean hairline doesn't tell you anything about the hidden posterior scalp you haven't looked at yet.
>
> And before-and-after requires matching conditions. Different light, angle, pressure, magnification, or location can manufacture a more dramatic "result" than the actual service produced.
>
> [LET THIS LAND] Here's the reframe to carry forward: microscopy doesn't become advanced because the image looks dramatic. It becomes advanced when your collection method is consistent and your interpretation stays restrained.

**SOURCE TRACEABILITY:** five `info-card` blocks (4521–4540), key point (4542–4545).
**OWNER-REVIEW FLAGS:** None.

---

### M4-14 — Common mistakes

**SOURCE SECTION:** Section 4.10 (lines 4549–4615)
**APPROX PURPOSE:** Close the instructional content with six concrete mistake/fix pairs, then bridge into the final checkpoint.
**VISUAL ON SCREEN:** Six mistake/fix cards.
**PERFORMANCE NOTES:** Brisk, matter-of-fact pace through the six — this section is meant to move quickly. `[LET THIS LAND]` only on the true closing line.

**SPOKEN SCRIPT:**

> [WARM] Let's close out the teaching with the mistakes I actually want you to unlearn before they become habits.
>
> Mistake one — naming the scalp after a single image. Fix: complete the full five-point scan and compare distribution before committing to a direction.
>
> Mistake two — pressing harder for a clearer view. Fix: improve your parting, stability, focus, lighting, lens — never your pressure.
>
> Mistake three — turning visible material into a stated cause. Fix: describe location, color, texture, distribution — then ask about product and wash history.
>
> Mistake four — saving images without clear permission. Fix: keep consent separate for live viewing, record capture, teaching use, marketing, and external sharing.
>
> Mistake five — creating a misleading before-and-after. Fix: match region, magnification, light, pressure, and orientation, every time.
>
> And mistake six — running an assessment that changes absolutely nothing about the service. Fix: every image should point toward preserve, modify, avoid, pause, or refer. If it doesn't lead anywhere, it's theater, not assessment.
>
> [LET THIS LAND] The microscope was never the skill. The collection method, the language, and the decision — that's the skill.
>
> [SHORT PAUSE] Which brings us to your last checkpoint for this module — the one that matters most, because it's about knowing when to stop.

**SOURCE TRACEABILITY:** six `protocol-card` mistake/fix pairs (4552–4610), closing key point (4612–4615).
**OWNER-REVIEW FLAGS:** None.

---

### M4-15 — Checkpoint 2 (`m4cp2`)

**SOURCE SECTION:** `#m4cp2` (lines 4619–4635); evaluator string `M4.questions.m4cp2` (~line 8523)
**APPROX PURPOSE:** Deliver the final, highest-stakes checkpoint exactly as written.
**VISUAL ON SCREEN:** The `m4cp2` checkpoint card.
**PERFORMANCE NOTES:** `[SLOW SLIGHTLY]` through the exact question.

**SPOKEN SCRIPT:**

> [SLOW SLIGHTLY] Here's your final checkpoint, exact as written:
>
> "During the crown assessment, you see a cluster of raised lesions with visible fluid and crusting. The client says the area does not bother them and asks you to continue. Explain what you do with the microscope and the service, what you say to the client, and why."
>
> [CHECKPOINT STOP — PLAYBACK PAUSES]
>
> No rush. Think through the device, the service, and the client conversation separately — all three matter here.

**CHECKPOINT/GATE BEHAVIOR:** `[CHECKPOINT STOP — PLAYBACK PAUSES]`. No qualifying answer scripted. No automatic progression. Resume only via M4-16, and only after an authoritative pass.
**SOURCE TRACEABILITY:** `cp-q` (line 4624), verified byte-identical to `M4.questions.m4cp2` (line 8523). Note this differs from the approved spec doc's phrasing ("crown station" vs. production's "crown assessment") — production text used here, per the task's stated curriculum authority.
**OWNER-REVIEW FLAGS:** None — question text is exact, unparaphrased.

---

### M4-16 — Post-pass continuation (`m4cp2`) + module completion

**SOURCE SECTION:** N/A transition line + completion card (lines 4637–4648)
**APPROX PURPOSE:** Close the module — affirm the pass, then deliver the completion card's competency line and Module 5 handoff.
**VISUAL ON SCREEN:** The `m4Complete` lesson-complete card.
**PERFORMANCE NOTES:** `[WARM]` throughout. `[LET THIS LAND]` on the Module 5 handoff — it's the module's final note.

**SPOKEN SCRIPT:**

> [PLAY ONLY AFTER AUTHORITATIVE CHECKPOINT PASS]
>
> [WARM] Good — that's exactly the judgment this module is built to produce. The client's comfort doesn't override a visible finding like that. You stop, you don't diagnose out loud, you explain the limit honestly, and you handle the device responsibly before it touches anyone else.
>
> [SHORT PAUSE] That's Module Four. You built a repeatable way to collect evidence — five assessment points, five lenses, disciplined language, and the judgment to know when an image should change nothing, change the plan, or end the service outright.
>
> [LET THIS LAND] Module Five picks up right where this leaves off: you now know how to gather and describe the evidence. Next, you'll learn how to actually translate what you found into a real cosmetic treatment direction — without collapsing an entire scalp into one label.

**CHECKPOINT/GATE BEHAVIOR:** Opening line is `[PLAY ONLY AFTER AUTHORITATIVE CHECKPOINT PASS]`. The rest plays as standard module-completion narration once `m4cp2` passes and the completion card renders.
**SOURCE TRACEABILITY:** Completion eyebrow/title/competency line (4638–4641), next-up label/text (4643–4644). Primary/secondary buttons ("Start Module 5 →" / "Back to course") are navigation controls, intentionally not narrated — see coverage map.
**OWNER-REVIEW FLAGS:** The opening sentence ("that's exactly the judgment this module is built to produce…") is original resume-line writing, same category as M4-08 — flagged for the same reason: it's new narration-UX text, not adapted course copy, even though it makes no new teaching claim.

---

## Module 4 Listen Coverage Map

Every meaningful written teaching element in the production module, classified.
Design note: literal section-number announcements ("Section 4.2, Presenting
the Assessment") were deliberately **not** spoken anywhere — orientation is
handled by natural spoken transitions instead, per the task's "don't
mechanically announce numbering" instruction. Numbers appear only inside the
five-point scan ("assessment point one," etc.) where they're actually
functional wayfinding, not decorative headings.

| Element | Classification | Chunk |
|---|---|---|
| Hero eyebrow / title / description | Covered via spoken adaptation | M4-01 |
| 4.1 body text (×3 paragraphs) | Covered via spoken adaptation | M4-01 |
| 4.1 key point | Covered directly | M4-01 |
| 4.1 Cadence note | Covered directly (quoted) | M4-01 |
| 4.2 intro body | Covered via spoken adaptation | M4-02 |
| 4.2 live-view script | Covered directly (verbatim) | M4-02 |
| 4.2 image-capture consent script | Covered directly (verbatim) | M4-02 |
| 4.2 privacy note | Covered via spoken adaptation | M4-02 |
| 4.2 client-language rule | Covered via spoken adaptation | M4-02 |
| 4.3 intro | Covered via spoken adaptation | M4-03 |
| 4.3 six technique cards | Covered via spoken adaptation | M4-03 |
| 4.3 sanitation note | Covered via spoken adaptation | M4-03 |
| 4.3 key point | Covered directly | M4-03 |
| 4.4 intro (×2 paragraphs) | Covered via spoken adaptation | M4-04 |
| 4.4 memory line | Covered directly (verbatim) | M4-04 |
| 4.4 five station images (purpose + technique cue each) | Covered via spoken adaptation + visual-only described | M4-04 |
| 4.4 station-4 different-model note | Covered via spoken adaptation | M4-04 |
| 4.4 completion line | Covered via spoken adaptation | M4-04 |
| 4.5 intro | Covered via spoken adaptation | M4-05 |
| 4.5 five lenses (look-for + document-like-this + limits) | Covered directly (documentation examples verbatim) | M4-05 |
| 4.5 key point | Covered via spoken adaptation | M4-05 |
| Classification exercise intro | Covered via spoken adaptation | M4-06 |
| 5 classify statements + correct answers + feedback | Covered directly (verbatim) | M4-06 |
| Classification exercise completion line | Covered directly (verbatim) | M4-06 |
| `m4cp1` label ("Read the full scan") | Covered via spoken adaptation | M4-07 |
| `m4cp1` exact question | Covered directly (verbatim) | M4-07 |
| `m4cp1` input placeholder text | Intentionally not narrated (UI hint, not teaching content) | — |
| 4.6 intro + illustrative-examples note | Covered via spoken adaptation | M4-09 |
| Example 1 — Baseline-appearing view (4 fields + alt text) | Covered via spoken adaptation | M4-09 |
| Example 2 — Oil-dominant appearance (4 fields + alt text) | Covered via spoken adaptation | M4-09, reused M4-10 |
| Example 3 — Fine-scale/dry-appearing (4 fields + alt text) | Covered via spoken adaptation | M4-09 |
| Example 4 — Visible color change (4 fields + alt text) | Covered via spoken adaptation | M4-10 |
| Example 5 — Surface residue/buildup (4 fields + alt text) | Covered via spoken adaptation | M4-10 |
| "View full-size image" links | Intentionally not narrated (navigation only) | — |
| Oil-vs-residue comparison (eyebrow/title/body/5 questions/key point) | Covered via spoken adaptation; 5 questions covered directly | M4-10 |
| 4.7 intro + four decision cards + key point | Covered via spoken adaptation | M4-11 |
| 4.8 four warning cards | Covered via spoken adaptation | M4-12 |
| 4.8 referral script | Covered directly (verbatim) | M4-12 |
| 4.8 device-contamination key point | Covered via spoken adaptation | M4-12 |
| 4.9 five info cards | Covered via spoken adaptation | M4-13 |
| 4.9 key point | Covered via spoken adaptation | M4-13 |
| 4.10 six mistake/fix cards | Covered via spoken adaptation | M4-14 |
| 4.10 closing line | Covered directly (verbatim) | M4-14 |
| `m4cp2` label ("Know when the image ends the service") | Covered via spoken adaptation | M4-15 |
| `m4cp2` exact question | Covered directly (verbatim) | M4-15 |
| `m4cp2` input placeholder text | Intentionally not narrated | — |
| Completion eyebrow / title / competency line | Covered via spoken adaptation | M4-16 |
| Completion next-up label / text | Covered via spoken adaptation | M4-16 |
| Completion buttons ("Start Module 5 →", "Back to course") | Intentionally not narrated (navigation controls) | — |
| Decorative UI iconography (arrows, warning glyphs, checkmarks/✗, voice/submit button SVGs) | Intentionally not narrated (no teaching content) | — |

**Result:** no required curriculum element was silently dropped. Every
teaching claim, script, documentation example, checkpoint question, and
classification answer traces to an exact line in production. The only items
excluded outright are UI-only text (placeholders, "view full-size" links,
navigation buttons) and decorative iconography that carries no instructional
content on screen either.

---

## New explanatory material proposed

Exactly one item, already flagged inline above:

> **[OWNER REVIEW — NEW EXPLANATORY MATERIAL]** A candidate aside in M4-09,
> naming "Module Six" as where the dry-scalp-vs-dandruff distinction is
> actually taught. Grounded in the approved spec's internal scoping note
> (`module-04.md` Required Correction #6) but not present in the student-facing
> Module 4 copy itself. **Currently left out of the script above** pending
> your call — say the word and it's a one-line add.

Everything else in this draft is adaptation of existing approved copy:
rephrasing for speech, contractions, connective tissue between sections, and
the two short "resume" lines after each checkpoint (M4-08, M4-16 opening),
which are narration-UX continuity lines rather than curriculum content — they
assert nothing the module doesn't already establish.

---

## Estimated audio experience

- **Total spoken word count (script content only, excluding performance tags, headers, and metadata):** approximately **3,710 words** (measured directly from the script text).
- **Estimated listening duration** at a natural instructional pace (~140–150 words/minute, accounting for the built-in pauses at `[SHORT PAUSE]`/`[CHECKPOINT STOP]` markers and the two open-ended checkpoint holds): approximately **25–27 minutes** of narration, not counting however long each student actually spends composing their two checkpoint answers.
- **Audio chunks:** 16 (`M4-01` through `M4-16`).
- **Instructional visuals referenced:** 10 unique images (5 examination-area photos, 5 microscopy-style illustrative examples), referenced across 12 narrated mentions total (`microscopy-oil-dominant` and `microscopy-surface-residue` are each referenced twice — once in the individual example, once in the side-by-side comparison).
- **Decorative visuals intentionally skipped:** none of Module 4's ten course images are decorative — all ten are classified instructionally important. The only skipped visuals are small non-photographic UI iconography (arrows, a warning glyph, mistake-card ✗ marks, the voice/submit button SVGs) which carry no curriculum content.
- **Checkpoint stops:** 2 (`m4cp1`, `m4cp2`), each paired with its own gated post-pass resume line — 4 checkpoint-related narration units total.

No effort was made to compress this toward artificial brevity — the module
is genuinely dense (moderate visual/procedural rhythm, per the approved
spec's own "Distinct learning rhythm" section), and the goal was accurate,
complete, well-paced teaching, not a shorter runtime.
