# Module 1 — Cadence Listen Mode Narration Script (Editorial Pilot Draft)

**Status:** DRAFT — this is the **editorial pilot** for the entire AIMT Listen
Mode platform. Module 4 already has its own draft
(`module-04-listen-script-draft.md`, unchanged by this task) that will later
serve as the complexity stress test for visuals, multiple checkpoints, and
gate/resume behavior. This document exists to settle something that comes
*before* that: what Cadence sounds like when she teaches, and what a module
opening looks like under the newly locked Module Briefing architecture (see
"New module-opening architecture" below). Owner review required before any
further Listen Mode work, on either module.
**Pilot module:** Module 1 — Role of the Head Spa Technician.
**Date drafted:** 2026-08-30.
**Branch:** `course-audit-build`. **This is a documentation-only task.** No
audio was generated, no TTS/ElevenLabs API was called, no course UI,
curriculum, checkpoint, rubric, or Cadence chat/grading code was touched.

**Curriculum authority for this draft:**
- Production implementation: [`headspa-mastery.html`](../../../headspa-mastery.html) lines 4925–5211 (`module1Wrap`), read directly from the live course file — confirmed to match the approved specification below word-for-word, including every card list, script, and the completion copy.
- Approved specification: [`docs/course-audit/modules/module-01.md`](../modules/module-01.md), used to confirm intent, the approved outcomes, and the Listen Mode notes already on file for this module (Section "Listen Mode notes" — narration suitability, the three suggested visual-review cues, and the completion-rule constraints).
- Governing voice standard: [`docs/course-audit/00-cadence-character-instruction-constitution.md`](../00-cadence-character-instruction-constitution.md).
- Checkpoint questions were cross-checked against the evaluator strings in `headspa-mastery.html` (`M1.questions.m1cp1` / `m1cp2`, lines 8421–8422) and are byte-identical to the on-screen `.cp-q` text (lines 5166, 5184). No drift found — unlike Module 4, Module 1's displayed and evaluated questions already match exactly.

---

## New module-opening architecture (per this task's brief)

Default b-roll opening videos are no longer the standard plan for any AIMT
module. Every module should now open with two layers:

1. **An on-screen written Module Briefing** — visible to every student,
   whether or not they use Listen Mode.
2. **A spoken Cadence Module Briefing** — Listen Mode's opening chunk, which
   naturally expands the written briefing rather than reading it aloud.

Real video is reserved for content that genuinely needs to be *seen in
motion* — physical technique, demonstration. Module 1 has none of that (the
approved spec's own Listen Mode notes agree: "None of the current Module 1
content requires a physical demonstration video"), so no video is proposed
here at all — written briefing plus spoken briefing is the complete opening.

---

## MODULE 1 WRITTEN BRIEFING

*(Proposed on-screen text — not yet implemented; documentation only. Sits at
the top of the module, before 1.1.)*

**What this module covers:**

- What a head spa actually is — a structured, scalp-focused cosmetic
  service, not a medical treatment — and why "head spa technician" is a
  professional role, not a separate license.
- The core distinction this entire course is built on: observing what's
  visible versus diagnosing what caused it, and the exact client language
  that keeps you on the right side of that line.
- What may fall within your scope and what this course never authorizes —
  and why the answer depends on your license, your state, and the specific
  service, not on this course alone.
- The honest limits of a head spa service: what it can genuinely support,
  and what it can never promise.
- When a finding calls for referral to a medical professional — and why
  that's sound judgment, not a failure.

**Pay attention to:** the difference between describing what you see and
naming what caused it. Almost everything else in this module — and a lot of
what comes later in the course — builds directly on that one distinction.

---

## OWNER EDITORIAL REVIEW — please assess

1. Does this sound like Cadence?
2. Would I want to keep listening to her?
3. Does she sound like a teacher rather than a narrator?
4. Is she warm enough without overdoing it?
5. Is anything too textbook-like?
6. Does she add useful explanation beyond the written page?
7. Are visual references useful?
8. Do checkpoint transitions feel natural?
9. Does the closing recap feel valuable rather than repetitive?
10. Is this how AIMT should sound across future courses?

---

## How to read this document

Each numbered chunk is a standalone, independently regenerable audio unit,
with the same field structure used in the Module 4 draft: **CHUNK ID**,
**SOURCE SECTION**, **PURPOSE**, **VISUAL ON SCREEN** (if relevant),
**PERFORMANCE NOTES** (sparse, provider-agnostic — `[WARM]`, `[SHORT PAUSE]`,
etc., not ElevenLabs tags), **SPOKEN SCRIPT**, **CHECKPOINT/GATE BEHAVIOR**
(only where relevant), **SOURCE TRACEABILITY**, and **OWNER-REVIEW FLAGS**
(only where something needs your eyes specifically).

Performance tags are intentionally sparse — most sentences carry none.

---

## Chunk map

| ID | Covers | Checkpoint? |
|---|---|---|
| M1-01 | Module Briefing (spoken) | — |
| M1-02 | 1.1 What is a head spa? | — |
| M1-03 | 1.2 What is a head spa technician? | — |
| M1-04 | 1.3 Observation vs. diagnosis (safe-language scripts + referral) | — |
| M1-05 | 1.4 Scope of practice | — |
| M1-06 | Practice interaction — "Where is the line?" | — |
| M1-07 | Checkpoint 1 — `m1cp1` | **STOP** |
| M1-08 | Post-pass continuation (`m1cp1`) | resume only |
| M1-09 | 1.5 Limitations of a head spa service | — |
| M1-10 | 1.6 Licensing | — |
| M1-11 | 1.7 Practitioner insight | — |
| M1-12 | 1.8 Mistakes new practitioners make | — |
| M1-13 | Checkpoint 2 — `m1cp2` | **STOP** |
| M1-14 | Post-pass continuation (`m1cp2`) + module completion | resume only |
| M1-15 | Closing recap | — |

15 chunks — fewer than Module 4's 16, because Module 1 is a shorter,
text-and-language module with no photographic visuals and a simpler
structure. This is intentional; Module 1 was not forced to match Module 4's
count.

---

## The script

### M1-01 — Module Briefing (spoken)

**SOURCE SECTION:** Hero block (`headspa-mastery.html` lines 4928–4932) + the overall approved outcomes for Module 1 (`module-01.md`, "Approved outcomes").
**PURPOSE:** Replace the old generic-opening-video slot. Orient the student, explain why this module comes first, name the one or two distinctions worth listening for, and bridge naturally into 1.1.
**VISUAL ON SCREEN:** The written Module Briefing above, plus the hero (eyebrow, title, description).
**PERFORMANCE NOTES:** `[WARM]` open, sparse elsewhere. `[LET THIS LAND]` on the hero-title callback at the end.

**SPOKEN SCRIPT:**

> [WARM] Welcome to Module One. Before we get into it, I want to tell you honestly why this one comes first.
>
> Every other module in this course assumes you already know where your role begins and where it ends. This is the module that actually draws that line — so if you only really listen to one module in this whole course, I'd rather it be this one.
>
> [SHORT PAUSE] Here's the shape of it. We'll start with what a head spa actually is — because it's not just an elaborate shampoo, and it's also not a medical service, even though parts of it need to feel almost clinical in how deliberate they are. Then we'll spend real time on the one distinction the rest of this course leans on constantly: observing what you see, versus diagnosing what caused it. Those sound similar. They are not the same skill, and mixing them up is the single most common way new practitioners get themselves into trouble.
>
> [EMPHASIZE] From there we'll get into scope — what may actually be within your ability to perform, and what this course can never authorize, no matter how good you get. And we'll close with the honest limitations of the service itself: what it can genuinely support, and where a client's expectations need managing before they ever sit down in your chair.
>
> [CURIOUS] One thing I want you holding onto as you go: none of this is about being timid. It's about being precise. A practitioner who says "I can't diagnose that, but here's what I can do for you today" sounds more confident, not less — because they know exactly what's theirs to say and what isn't. That's the whole game in this module.
>
> [LET THIS LAND] Know what you are. Know what you are not. That's not just this module's title — it's the discipline underneath everything AIMT teaches after this.
>
> Let's get into it.

**SOURCE TRACEABILITY:** Hero eyebrow/title/description (4928–4932); framing drawn from the approved outcomes list in `module-01.md` rather than any single line of production copy.
**OWNER-REVIEW FLAGS:** This entire chunk is original narration-UX writing — there is no single "opening" block in production to adapt, since Module 1 previously had no spoken introduction at all. It asserts nothing beyond what the approved outcomes and hero copy already establish, but flagging per the standing instruction to mark genuinely new narration text, same category as Module 4's resume lines (M4-08/M4-16).

---

### M1-02 — 1.1 What is a head spa?

**SOURCE SECTION:** Section 1.1 (lines 4934–4950)
**PURPOSE:** Establish the definition and the six structural elements, then land the Cadence note's core reframe.
**VISUAL ON SCREEN:** Six service-element cards (Cleansing, Exfoliation, Massage & relaxation, Water therapy, Conditioning & treatment, Sensory elements), each a name plus one line.
**PERFORMANCE NOTES:** `[CURIOUS]` open. `[EMPHASIZE]` on the Cadence-note reframe.

**SPOKEN SCRIPT:**

> [CURIOUS] Let's start with the actual definition, because it's easy to skip. A head spa is a structured, scalp-focused service — built around scalp hygiene, comfort, and the overall condition of the scalp environment. But it's also a genuinely relaxing, sensory experience. I want to be clear: those two things aren't in tension. The relaxation is real. So is the structure holding it up underneath.
>
> Six things make up that structure, though you won't do all of them the same way every time: cleansing, the foundation of every service; exfoliation, only when it's actually appropriate, never automatically; massage and relaxation, the sensory core of what the client feels; water therapy, where temperature and immersion do real sensory work; conditioning and treatment, where your product choice follows what you actually observe; and the sensory layer wrapped around all of it — temperature, touch, sound, aromatherapy.
>
> [EMPHASIZE] Here's the thing I want you to sit with: from the client's perspective, it feels like relaxation. From yours, it should feel controlled and intentional. That's the difference. Anyone can make something feel relaxing for a moment. Very few people can deliver a consistent, high-quality experience that holds together from beginning to end.

**SOURCE TRACEABILITY:** 1.1 title + body-text (4934–4936), six `scalp-card` elements (4939–4944), Cadence note (4947–4950, quoted near-verbatim).
**OWNER-REVIEW FLAGS:** None.

---

### M1-03 — 1.2 What is a head spa technician?

**SOURCE SECTION:** Section 1.2 (lines 4954–4963)
**PURPOSE:** Teach the role-not-license distinction plainly, then land the "work behind the calm" reframe.
**VISUAL ON SCREEN:** Section title, two body paragraphs, "The work behind the calm" clinical note.
**PERFORMANCE NOTES:** `[EMPHASIZE]` on the licensing sentence — this is a legally load-bearing statement, not a stylistic one.

**SPOKEN SCRIPT:**

> [WARM] Now — what does "head spa technician" actually mean? There's a version of this job where you think: I just need to learn the steps. That works right up until something doesn't look the way you expected. Then you need to be more than someone who memorized a sequence.
>
> [EMPHASIZE] Here's something I want stated plainly, because it matters legally, not just philosophically: in this course, "head spa technician" describes the role you perform during a service. It is not a separate state license. Your legal ability to actually do any of this comes from the license or authorization you already hold, the laws where you practice, and the specific services you're performing. AIMT certification documents that you completed this course. It does not expand what you're legally allowed to do.
>
> [SHORT PAUSE] So what is the role, if it's not a license? Here's how I'd put it: the service should feel effortless to the client — that's the point, they should barely notice the work. But behind that calm, you're observing constantly, communicating, adjusting pressure and pacing in real time, protecting your own scope, recognizing the moment to simplify or stop, and holding control of the room from the first minute to the last. That's the actual job. The physical steps are just the visible part of it.

**SOURCE TRACEABILITY:** 1.2 title + both body paragraphs (4954–4958), clinical note "The work behind the calm" (4960–4963).
**OWNER-REVIEW FLAGS:** None.

---

### M1-04 — 1.3 Observation vs. diagnosis

**SOURCE SECTION:** Section 1.3 (lines 4967–5002)
**PURPOSE:** Teach the module's central distinction, deliver both language cards close to verbatim since they're operational scripts, and land the referral guidance.
**VISUAL ON SCREEN:** Two quoted-script protocol cards ("Say this" / "Never say"), a closing paragraph, and the "When to refer out" section.
**PERFORMANCE NOTES:** `[SLOW SLIGHTLY]` through both quoted-script cards — these need to work verbatim if a practitioner repeats them. `[EMPHASIZE]` on the outside-scope explanations and on the referral reframe.

**SPOKEN SCRIPT:**

> [WARM] Alright — this next part is the center of the whole module, so I want to slow down here.
>
> You will notice things. Oil imbalance, dryness, buildup, flaking patterns, irritation, early thinning — recognizing those patterns is genuinely part of your job. [EMPHASIZE] Diagnosing what caused them is not. That's the line, and almost everything else in this course sits on top of it.
>
> [VISUAL CUE] If you're looking at the screen, there's a side-by-side reference here worth coming back to later — language that keeps you in scope, right next to language that takes you out of it. If you're just listening right now, here's the version that matters most.
>
> [SLOW SLIGHTLY] For buildup: "I'm seeing visible buildup around parts of the scalp. Today I would focus on gentle, thorough cleansing and adjust the service based on how the scalp responds."
>
> For flaking: "I'm seeing flaking and oil around the root area. I can describe what is visible and adjust today's cosmetic service, but I can't determine the cause from appearance alone."
>
> For irritation: "I'm seeing redness and irritation in this area. I would avoid aggressive exfoliation or stimulation here and explain when medical evaluation would be appropriate."
>
> And for shedding or thinning — this one comes up a lot, so hold onto it: "I can document the shedding or thinning pattern I can see, but I can't determine the cause or diagnose hair loss. Because this is new or concerning to you, a dermatologist or other qualified medical professional is the appropriate next step."
>
> [EMPHASIZE] Now — what you never say, and why each one fails. "This is seborrheic dermatitis": a visible pattern is not a medical diagnosis. "This is fungal": appearance alone can't establish a cause. "This is alopecia": hair-loss diagnosis needs medical evaluation, full stop. And "you should use this medicated or prescription product": you're not prescribing or directing medical treatment, ever.
>
> [LET THIS LAND] Here's why this actually matters, beyond just staying out of trouble: this distinction protects the client, and it protects your credibility. As you get more experienced, your language should get more precise — never more certain than the evidence in front of you actually allows. Stay grounded in what you can observe, what your license permits, and when it's time to hand things off.
>
> [SHORT PAUSE] Which leads directly into referral. Refer when something is new, unexplained, severe, persistent, spreading, painful, bleeding, or rapidly changing — or when it's simply outside cosmetic scope. New or heavy shedding, a sudden change in density, broken or visibly compromised skin, anything that might signal infection or real inflammation — all of it calls for caution and a real medical evaluation. [EMPHASIZE] You are not being asked to diagnose anything. You're being asked to recognize the moment a cosmetic service isn't the answer, and to handle that moment like a professional.

**SOURCE TRACEABILITY:** 1.3 title + intro (4967–4969), "Language that keeps you in scope" card, all four rows (4971–4983), "Language that takes you out of scope" card, all four rows (4985–4997), closing paragraph (4999), "When to refer out" section (5001–5002).
**OWNER-REVIEW FLAGS:** None — both scripted cards are reproduced verbatim/near-verbatim, consistent with how Module 4 treated its live-view and consent scripts.

---

### M1-05 — 1.4 Scope of practice

**SOURCE SECTION:** Section 1.4 (lines 5006–5043)
**PURPOSE:** Teach the license-dependent framing and both scope lists.
**VISUAL ON SCREEN:** Two protocol cards ("May fall within scope — verify first" / "Never authorized by this course").
**PERFORMANCE NOTES:** `[EMPHASIZE]` on "the mistake people make" and on the conditional qualifier after the first list.

**SPOKEN SCRIPT:**

> [SHORT PAUSE] Now let's talk about scope itself — what you may actually be permitted to do.
>
> Here's the headline: scope comes from the license or authorization you hold, the laws where you practice, the establishment you work in, and the specific services and equipment you're using. The same activity can be completely fine under one license, in one state, and prohibited under another. [EMPHASIZE] The mistake people make is assuming this course's certification creates permission on its own. It can't. It never will.
>
> [VISUAL CUE] There's a two-card comparison on screen here worth reviewing directly — what may fall within scope, and what's never authorized by this course at all. Either way, here's the content.
>
> May fall within scope, verify first: cleansing the scalp and hair, cosmetic product application, massage and manual techniques, cosmetic exfoliation, use of devices or equipment, observation and description of visible findings, and non-prescription cosmetic product guidance. [EMPHASIZE] Every one of those is conditional — permitted only when your license, your state and local rules, your establishment, and the manufacturer's directions all actually allow it.
>
> Never authorized by this course, no exceptions: diagnosing a medical condition, prescribing or directing prescription treatment, claiming to cure, reverse, or treat disease, performing a medical procedure, presenting scanner, microscopy, or AI output as a medical diagnosis, and practicing beyond the license or authorization you actually hold.
>
> [LET THIS LAND] Notice the asymmetry there — one list is conditional, the other one just isn't. That's intentional, and it doesn't change no matter how advanced you get in this field.

**SOURCE TRACEABILITY:** 1.4 title + intro (5006–5008), card 1 with all seven items and the qualifier line (5010–5027), card 2 with all six items (5029–5043).
**OWNER-REVIEW FLAGS:** None.

---

### M1-06 — Practice interaction: "Where is the line?"

**SOURCE SECTION:** Practice interaction (lines 5047–5089); answers/feedback from `M1_LINE_ANSWERS` (`headspa-mastery.html` lines 9796–9799); completion message (line 9825).
**PURPOSE:** Preserve the ungraded discipline exercise as a spoken worked-example walkthrough, since Listen Mode can't wait for a click.
**VISUAL ON SCREEN:** Four statements, each with two classification buttons and immediate feedback.
**PERFORMANCE NOTES:** `[SHORT PAUSE]` after each statement, long enough for a listener to genuinely guess before the reveal.

**SPOKEN SCRIPT:**

> [CURIOUS] Before your first checkpoint, a quick practice round — no grade, no pressure, just a chance to test your ear for this before it counts.
>
> Four realistic statements. For each one, decide for yourself: is this professional observation, or is it outside scope? [SHORT PAUSE] If you've got the screen in front of you, this is a good moment to actually click through it yourself before I give you the answer.
>
> Statement one: "I'm seeing redness in this area. I would avoid aggressive exfoliation here and explain when medical evaluation would be appropriate." [SHORT PAUSE] Professional observation. It describes what's visible, adjusts the service, and recognizes when referral might matter — without ever naming a condition.
>
> Statement two: "This is seborrheic dermatitis. You should use a medicated shampoo twice a week." [SHORT PAUSE] Outside scope. That names a diagnosis and directs treatment in the same breath. You can describe findings and recommend medical evaluation. You don't get to diagnose or prescribe.
>
> Statement three: "I can document the flaking I see, adjust today's service, and explain that appearance alone cannot determine the cause." [SHORT PAUSE] Professional observation — it stays grounded in what's visible and what the service can adjust, without reaching for a medical conclusion.
>
> And statement four: "Your follicles are clogged, and that is why your hair is thinning." [SHORT PAUSE] Outside scope. That states an unverified cause as fact. You can document visible buildup or thinning. You cannot tell someone why it's happening from appearance alone.
>
> [LET THIS LAND] Good professional language is specific about what's visible, and restrained about what it can't establish. Keep that instinct sharp — you're about to use it for real.

**CHECKPOINT/GATE BEHAVIOR:** None — ungraded, non-persistent, no attempt limit on screen either.
**SOURCE TRACEABILITY:** Interaction heading + instruction (5047–5050), four `practice-scenario` statements and choice buttons (5051–5089), `M1_LINE_ANSWERS` feedback text (lines 9796–9799), completion message (line 9825).
**OWNER-REVIEW FLAGS:** This reuses the same click-to-reveal → spoken-worked-example adaptation Module 4's draft proposed for its own classification exercise (M4-06). Flagging only so the two drafts can be reviewed together and this pattern confirmed as the standard for every future ungraded classification interaction — nothing new is being introduced here beyond that reuse.

---

### M1-07 — Checkpoint 1 (`m1cp1`)

**SOURCE SECTION:** `#m1cp1` (lines 5161–5177); evaluator string `M1.questions.m1cp1` (line 8421).
**PURPOSE:** Transition naturally into the required checkpoint and deliver the exact question.
**VISUAL ON SCREEN:** The `m1cp1` checkpoint card — label "Apply the boundary," question text, text input, voice button, submit button.
**PERFORMANCE NOTES:** `[SLOW SLIGHTLY]` through the exact question.

**SPOKEN SCRIPT:**

> [WARM] Okay — this is the first place I actually want you to stop and use what we just built, not just recognize it.
>
> [SHORT PAUSE] Here's your checkpoint, exactly as written:
>
> [SLOW SLIGHTLY] "A client says her hair has been shedding heavily for two months and asks whether she has alopecia. Explain exactly how you would respond. Include what you can safely say, what you must avoid saying, and the professional next step you would recommend."
>
> [CHECKPOINT STOP — PLAYBACK PAUSES]
>
> Take whatever time you actually need. I'm not timing you.

**CHECKPOINT/GATE BEHAVIOR:** `[CHECKPOINT STOP — PLAYBACK PAUSES]`. Playback halts here. No qualifying answer is scripted. No automatic progression. Resume only via M1-08, and only after an authoritative pass from the real grading system.
**SOURCE TRACEABILITY:** `cp-q` (line 5166), verified byte-identical to `M1.questions.m1cp1` (line 8421).
**OWNER-REVIEW FLAGS:** None — question text is exact, unparaphrased.

---

### M1-08 — Post-pass continuation (`m1cp1`)

**SOURCE SECTION:** N/A (new narration-UX transition line, not existing course copy).
**PURPOSE:** A short, warm resume line — continuity, not new teaching.
**VISUAL ON SCREEN:** Whatever follows a passed `m1cp1` — Section 1.5 begins.
**PERFORMANCE NOTES:** `[WARM]`, brief.

**SPOKEN SCRIPT:**

> [PLAY ONLY AFTER AUTHORITATIVE CHECKPOINT PASS]
>
> [WARM] Good. That's exactly the shape of it — you described what's visible, you left the diagnosis to someone actually qualified to give one, and you gave her somewhere real to go next.
>
> [SHORT PAUSE] Let's keep going. There's more to this role than the boundary alone.

**CHECKPOINT/GATE BEHAVIOR:** `[PLAY ONLY AFTER AUTHORITATIVE CHECKPOINT PASS]`. Narration UX only, not grading logic — plays once the real evaluator has already returned a pass for `m1cp1`.
**SOURCE TRACEABILITY:** N/A — transitional line only.
**OWNER-REVIEW FLAGS:** Original narration-UX writing, same category as M4-08/M4-16 — flagged per instruction, though it carries no teaching claim.

---

### M1-09 — 1.5 Limitations of a head spa service

**SOURCE SECTION:** Section 1.5 (lines 5093–5128)
**PURPOSE:** Teach the honest can-support / cannot-do lists and land the positioning key point.
**VISUAL ON SCREEN:** Two protocol cards ("What a head spa can support" / "What a head spa cannot do") and a key point.
**PERFORMANCE NOTES:** `[EMPHASIZE]` through the cannot-do list — this is the list most likely to get softened in real practice.

**SPOKEN SCRIPT:**

> [WARM] Let's talk honestly about what this service can and can't do — being honest about the limits is part of what makes you trustworthy.
>
> [VISUAL CUE] Another side-by-side worth reviewing on screen when you get the chance. Here's the content either way.
>
> What a head spa can genuinely support: improved cosmetic cleansing and removal of buildup when it's appropriate, cosmetic hydration and conditioning, scalp comfort and relaxation, a cleaner and more comfortable scalp environment, and a consistent routine of professional cosmetic scalp care.
>
> [EMPHASIZE] What it cannot do — and I want this list to actually land: diagnose or treat disease, determine the cause of shedding or thinning, reverse genetic hair loss, cure dandruff, dermatitis, infection, or inflammation, regrow hair on its own, or replace evaluation or treatment by a qualified medical professional.
>
> [LET THIS LAND] Here's how to position it honestly: "This service can support cosmetic scalp cleansing, comfort, and conditioning" — that's responsible language. Promising treatment, diagnosis, or hair regrowth is not, and it never will be, no matter how well the service goes. The genuine cosmetic and relaxation benefits are real. They don't need to be dressed up as medicine to be worth offering.

**SOURCE TRACEABILITY:** 1.5 title (5093–5094), "can support" card, all five items (5096–5108), "cannot do" card, all six items (5110–5123), key point (5125–5128, near-verbatim).
**OWNER-REVIEW FLAGS:** None.

---

### M1-10 — 1.6 Licensing

**SOURCE SECTION:** Section 1.6 (lines 5132–5135)
**PURPOSE:** Deliver the licensing-verification guidance directly — this section is short and needs no restructuring.
**VISUAL ON SCREEN:** Section title and two body paragraphs.
**PERFORMANCE NOTES:** `[EMPHASIZE]` on "does not override law, create a license, or expand your legal scope."

**SPOKEN SCRIPT:**

> [SHORT PAUSE] A short but important one, on licensing.
>
> Before you ever offer this service, know what your existing license or authorization actually permits, in the exact place you practice. That means reviewing the rules for cleansing and shampooing, scalp and body massage, exfoliation, cosmetic product application, devices, water systems, sanitation, establishment licensing, and which parts of the body you're actually allowed to treat.
>
> [EMPHASIZE] Don't assume every head spa service is covered by every beauty license — the exact combination of services is what matters, not the general category. This course gives you real professional education and best practice. It does not override the law, create a license for you, or expand your legal scope. That verification is genuinely yours to do.

**SOURCE TRACEABILITY:** 1.6 title + both body paragraphs (5132–5135).
**OWNER-REVIEW FLAGS:** None.

---

### M1-11 — 1.7 Practitioner insight

**SOURCE SECTION:** Section 1.7 (lines 5139–5146)
**PURPOSE:** Land the client-expectations framing and the Cadence note.
**VISUAL ON SCREEN:** Section title, body paragraph, Cadence note.
**PERFORMANCE NOTES:** `[CURIOUS]` open, matching M4-13's "here's what experience teaches you" register.

**SPOKEN SCRIPT:**

> [CURIOUS] Here's something worth knowing early: most of your clients don't actually know what a head spa is. They showed up because it looked relaxing, someone recommended it, or they're just curious about their own scalp. You're shaping what they expect, in real time, whether you mean to or not.
>
> [EMPHASIZE] If you position yourself as someone who diagnoses or fixes medical conditions, clients will expect results you can't responsibly deliver. If you position yourself as someone who observes carefully, stays in scope, customizes the service to them, and refers out when it's appropriate — you build real trust, without ever overclaiming.
>
> [LET THIS LAND] Your language teaches the client what this service actually is. They don't need certainty you can't support. They need clear observation, honest expectations, and confidence that you'll know when to proceed, when to adjust, and when to refer.

**SOURCE TRACEABILITY:** 1.7 title + body (5139–5141), Cadence note (5143–5146, near-verbatim).
**OWNER-REVIEW FLAGS:** None.

---

### M1-12 — 1.8 Mistakes new practitioners make

**SOURCE SECTION:** Section 1.8 (lines 5150–5157)
**PURPOSE:** Close the instructional content with five concrete mistakes, then bridge into the final checkpoint.
**VISUAL ON SCREEN:** Five info cards.
**PERFORMANCE NOTES:** Brisk, matter-of-fact pace through the five, matching M4-14's closing register. `[EMPHASIZE]` only on the referral reframe.

**SPOKEN SCRIPT:**

> [WARM] Let's close the teaching out with five patterns I want you to recognize before they ever become habits.
>
> One — blurring observation with diagnosis. Turning a visible finding into a medical conclusion is one of the most consequential mistakes you can make here. Recognizing patterns can inform your service. Diagnosis simply doesn't belong to this role.
>
> Two — overpromising results. Making the service sound more powerful than it is might help you sell it once. It will cost you when expectations don't get met.
>
> Three — thinking the role is just hands-on. If you think your job is purely performing the service, you'll miss the consultation, the education, and the decision-making that actually define it.
>
> Four — copying what you see online without thinking long-term. Most people speaking outside their scope in a video online aren't thinking about consequences. Don't build your professional standard on what looks good in a reel.
>
> And five — avoiding referral because it feels uncomfortable. [EMPHASIZE] Referral is not failure. It's part of doing the job correctly. The practitioners who avoid it are usually the ones who end up in situations they could have prevented.
>
> [SHORT PAUSE] Which brings us to your last checkpoint — this one asks you to show the difference between knowing the steps and actually holding the role.

**SOURCE TRACEABILITY:** Five `info-card` blocks (5153–5157).
**OWNER-REVIEW FLAGS:** None.

---

### M1-13 — Checkpoint 2 (`m1cp2`)

**SOURCE SECTION:** `#m1cp2` (lines 5179–5195); evaluator string `M1.questions.m1cp2` (line 8422).
**PURPOSE:** Deliver the final checkpoint exactly as written.
**VISUAL ON SCREEN:** The `m1cp2` checkpoint card — label "Demonstrate the role."
**PERFORMANCE NOTES:** `[SLOW SLIGHTLY]` through the exact question.

**SPOKEN SCRIPT:**

> [SLOW SLIGHTLY] Here's your last checkpoint, exact as written:
>
> "Explain the difference between a head spa technician and someone who only knows the service steps. Give one specific example of how that difference changes the client's experience, safety, or trust."
>
> [CHECKPOINT STOP — PLAYBACK PAUSES]
>
> Think of an actual moment, if you can — a real service, even a hypothetical one, not just a definition.

**CHECKPOINT/GATE BEHAVIOR:** `[CHECKPOINT STOP — PLAYBACK PAUSES]`. No qualifying answer scripted. No automatic progression. Resume only via M1-14, and only after an authoritative pass.
**SOURCE TRACEABILITY:** `cp-q` (line 5184), verified byte-identical to `M1.questions.m1cp2` (line 8422).
**OWNER-REVIEW FLAGS:** None — question text is exact, unparaphrased.

---

### M1-14 — Post-pass continuation (`m1cp2`) + module completion

**SOURCE SECTION:** N/A transition line + completion card (lines 5197–5208).
**PURPOSE:** Affirm the pass, then deliver the completion card's competency line and Module 2 handoff.
**VISUAL ON SCREEN:** The `m1Complete` lesson-complete card.
**PERFORMANCE NOTES:** `[WARM]` throughout. `[LET THIS LAND]` on the Module 2 handoff.

**SPOKEN SCRIPT:**

> [PLAY ONLY AFTER AUTHORITATIVE CHECKPOINT PASS]
>
> [WARM] Exactly — that's the difference. Anyone can be taught the steps. What you just described is judgment, and judgment is what actually makes you a technician instead of someone reciting a sequence.
>
> [SHORT PAUSE] That's Module One. You demonstrated observation-first language, scope and referral judgment, and a real sense of what this role is responsible for beyond the physical steps.
>
> [LET THIS LAND] Up next is Module Two — and it starts even before your hands do. We'll look at the client's arrival: the first few minutes, first contact, and the moments that build trust before the service ever begins.

**CHECKPOINT/GATE BEHAVIOR:** Opening line is `[PLAY ONLY AFTER AUTHORITATIVE CHECKPOINT PASS]`. The rest plays as standard module-completion narration once `m1cp2` passes and the completion card renders.
**SOURCE TRACEABILITY:** Completion eyebrow/title/competency line (5197–5201), next-up label/text (5202–5205). Primary/secondary buttons ("Start Module 2 →" / "Back to course") are navigation controls, intentionally not narrated — see coverage map.
**OWNER-REVIEW FLAGS:** Opening sentence is original resume-line writing, same category as M1-08 — flagged for the same reason.

---

### M1-15 — Closing recap

**SOURCE SECTION:** N/A — new synthesis chunk, per this task's Section 12 instruction. Not a restatement of the completion card (already delivered in M1-14).
**PURPOSE:** Leave the student with a small number of things Cadence genuinely wants carried forward, connecting Module 1 to later modules — mentor-like, not a summary.
**VISUAL ON SCREEN:** None specific — plays after the completion card, before the student navigates onward.
**PERFORMANCE NOTES:** `[WARM]` throughout, unhurried. `[LET THIS LAND]` on the closing line.

**SPOKEN SCRIPT:**

> [WARM] Before you move on, a few things — not a recap of everything we just covered, just what I actually want you carrying forward.
>
> First: the words you use are doing more work than you think. "I'm seeing this" is not the same sentence as "this is that" — and every module after this one is going to hand you more things to see. The discipline you just practiced is the only thing that keeps that safe.
>
> Second: scope isn't a wall you memorize once. It's a question you ask every time — for your license, your state, and the specific thing you're about to do. You'll run into that same question again once we get into equipment, into closer assessment, even into the business side of this work.
>
> And third — referral is not the moment you failed. It's the moment the job worked exactly the way it's supposed to. Hold onto that, because later modules are going to put real, sometimes uncomfortable-looking findings in front of you, and I want your instinct already trained: describe it, don't diagnose it, and know who to point the client toward.
>
> [LET THIS LAND] Everything from here — the biology, the microscope, the conditions you'll learn to recognize — all of it sits on top of the boundary you just built. Good work. Let's keep going.

**CHECKPOINT/GATE BEHAVIOR:** None — plays after the completion card, does not gate module completion, progress, or the Module 2 unlock, which are already governed entirely by the real checkpoint-pass logic.
**SOURCE TRACEABILITY:** N/A — original synthesis. The forward references ("the biology, the microscope, the conditions you'll learn to recognize") are general and deliberately unspecific, but are grounded in confirmed later-module content (`MODULE_GUIDE_SYSTEMS[3]` — scalp biology; `[4]` — microscopy; `[6]` — conditions & disorders, all read directly from `headspa-mastery.html`), not invented.
**OWNER-REVIEW FLAGS:** Entire chunk is original narration-UX writing — flagged per instruction. It makes no new teaching claim; every idea in it (observation-language discipline, scope as a recurring question, referral as sound judgment) was already taught earlier in this same module.

---

## Module 1 Listen Coverage Map

| Element | Classification | Chunk |
|---|---|---|
| Hero eyebrow / title / description | Covered via spoken adaptation | M1-01 |
| 1.1 title + body-text | Covered via spoken adaptation | M1-02 |
| 1.1 six service-element cards | Covered via spoken adaptation | M1-02 |
| 1.1 Cadence note | Covered directly (near-verbatim) | M1-02 |
| 1.2 title + two body paragraphs | Covered via spoken adaptation | M1-03 |
| 1.2 clinical note ("The work behind the calm") | Covered via spoken adaptation | M1-03 |
| 1.3 title + intro | Covered via spoken adaptation | M1-04 |
| 1.3 "Language that keeps you in scope" card (4 scripts) | Covered directly (verbatim) | M1-04 |
| 1.3 "Language that takes you out of scope" card (4 items) | Covered directly (verbatim) | M1-04 |
| 1.3 closing distinction paragraph | Covered via spoken adaptation | M1-04 |
| 1.3 "When to refer out" paragraph | Covered via spoken adaptation | M1-04 |
| 1.4 title + intro | Covered via spoken adaptation | M1-05 |
| 1.4 "May fall within scope" card (7 items + qualifier) | Covered directly (verbatim list items) | M1-05 |
| 1.4 "Never authorized" card (6 items) | Covered directly (verbatim list items) | M1-05 |
| Practice interaction heading + instruction | Covered via spoken adaptation | M1-06 |
| 4 practice statements + correct answers + feedback | Covered directly (verbatim) | M1-06 |
| Practice completion message | Covered directly (verbatim) | M1-06 |
| `m1cp1` label ("Apply the boundary") | Covered via spoken adaptation | M1-07 |
| `m1cp1` exact question | Covered directly (verbatim) | M1-07 |
| `m1cp1` input placeholder text | Intentionally not narrated (UI hint, not teaching content) | — |
| 1.5 title | Covered via spoken adaptation | M1-09 |
| 1.5 "can support" list (5 items) | Covered directly (verbatim) | M1-09 |
| 1.5 "cannot do" list (6 items) | Covered directly (verbatim) | M1-09 |
| 1.5 key point | Covered directly (near-verbatim) | M1-09 |
| 1.6 title + two body paragraphs | Covered via spoken adaptation | M1-10 |
| 1.7 title + body | Covered via spoken adaptation | M1-11 |
| 1.7 Cadence note | Covered directly (near-verbatim) | M1-11 |
| 1.8 five mistake/info cards | Covered via spoken adaptation | M1-12 |
| `m1cp2` label ("Demonstrate the role") | Covered via spoken adaptation | M1-13 |
| `m1cp2` exact question | Covered directly (verbatim) | M1-13 |
| `m1cp2` input placeholder text | Intentionally not narrated | — |
| Completion eyebrow / title / competency line | Covered via spoken adaptation | M1-14 |
| Completion next-up label / text | Covered via spoken adaptation | M1-14 |
| Completion buttons ("Start Module 2 →", "Back to course") | Intentionally not narrated (navigation controls) | — |
| Module-open Cadence chat greeting (`MODULE_OPEN_GREETINGS[1]`) | Intentionally not narrated — a chat-feature string surfaced only if the student opens Ask Cadence, not lesson-body content | — |
| Suggested Cadence quick prompts (`MODULE_QUICK_PROMPTS[1]`) | Intentionally not narrated — chat feature | — |
| Decorative UI iconography (checkmark/✗ badge icons, voice/submit button SVGs) | Intentionally not narrated (no teaching content) | — |

**Result:** no required curriculum element was silently dropped. Every
teaching claim, script, list item, checkpoint question, and practice-exercise
answer traces to an exact line in production. Excluded items are UI-only text
(placeholders, navigation buttons) and chat-specific strings that never
appear in the lesson body itself.

---

## New explanatory material proposed

**None.** Every teaching claim in this draft traces directly to an exact
line in production — unlike Module 4's draft, which flagged one pending
addition, Module 1 required no new factual content at all.

Five chunks contain **original narration-UX writing** (framing and
continuity text, not curriculum), each individually flagged above:

- **M1-01** — the spoken Module Briefing itself (no prior module-opening narration existed to adapt).
- **M1-06** — the click-to-reveal → spoken-worked-example adaptation pattern, reused from Module 4's draft.
- **M1-08** and **M1-14** (opening line) — short post-checkpoint resume lines, same category as Module 4's M4-08/M4-16.
- **M1-15** — the closing recap, a genuinely new chunk type this task introduced.

None of these assert anything beyond what the module's own approved copy
already establishes.

---

## Editorial differences from existing Module 4 draft

Module 4's draft was written before this task's Module Briefing architecture
was locked, and before this task's fuller pass at Cadence's personality.
Once the owner has reviewed both drafts, Module 4 will likely need:

1. **A Module Briefing chunk added at the front.** Module 4's `M4-01`
   currently opens directly on the hero/4.1 adaptation with no distinct
   briefing framing, no "why this module now" orientation, and no on-screen
   written-briefing counterpart. This draft's M1-01 shows the intended
   shape.
2. **A dedicated closing-recap chunk.** Module 4's `M4-16` folds pass
   confirmation, completion-card copy, and the Module 5 handoff into one
   chunk, but doesn't reach for the same genuinely-forward-looking, "here's
   what I want you carrying forward" register this draft's M1-15
   establishes as its own moment.
3. **Slightly denser personality / more direct address.** Module 1 leans
   further into contractions, rhetorical questions, and direct
   second-person address ("hold onto that," "I want you holding onto...")
   than Module 4's draft did. Both are warm, but Module 1 pushes a bit
   further toward the constitution's "more mentor/tutor than lecturer"
   language.
4. **Sparser, more selective performance tags in low-stakes sections.**
   Sections like M1-10 (Licensing) carry almost no tags at all, reserving
   `[EMPHASIZE]`/`[LET THIS LAND]` specifically for genuine landing points.
   Module 4 tags slightly more evenly across nearly every chunk.
5. **Visual cues pulled from an approved source, not originated fresh.**
   This draft's three `[VISUAL CUE]` insertions (M1-04, M1-05, M1-09) reuse
   the exact three moments the approved Module 1 spec's own "Listen Mode
   notes" section already flagged for a visual-review cue. Module 4 had no
   equivalent pre-specified list, so its visual cues were originated during
   the draft itself.

No Module 4 rewrite was performed — this section only names what will need
to change once the owner confirms this is the right direction.

---

## Estimated audio experience

- **Written Module Briefing:** 5 bullets + 1 "Pay attention to" line.
- **Total spoken word count (script content only, excluding performance tags, headers, and metadata):** approximately **2,880 words** (measured directly from the script text).
- **Estimated listening duration** at a natural instructional pace (~140–150 words/minute, accounting for `[SHORT PAUSE]`/`[CHECKPOINT STOP]` markers and the two open-ended checkpoint holds): approximately **19–21 minutes** of narration, not counting time spent composing the two checkpoint answers.
- **Narration chunks:** 15 (`M1-01` through `M1-15`).
- **Visual references:** 3 explicit `[VISUAL CUE]` insertions (M1-04, M1-05, M1-09), matching the three moments the approved spec itself already flagged for visual review. Unlike Module 4, none of Module 1's visuals are photographic — every "visual" is a structured text card — so full audio coverage of their content is achievable without leaving anything screen-dependent.
- **Checkpoint stops:** 2 (`m1cp1`, `m1cp2`), each paired with its own gated post-pass resume line.
- **Owner-review flags:** 5, all narration-UX framing (M1-01, M1-06, M1-08, M1-14, M1-15) — zero flags concern new curriculum content.

**Why this runs longer than the approved spec's old 8–10 minute Listen Mode
estimate:** that estimate predates this task and was scoped only to "the
curriculum body" read at a calm pace, with no module briefing, no
checkpoint transition/resume narration, and no closing recap. This draft
adds all three as structural elements of the newly locked architecture, plus
fuller Cadence personality throughout rather than flat reading — none of
which existed in the basis for the original estimate. No effort was made to
compress toward the old number artificially.
