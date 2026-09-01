# Module 2 — Listen Mode Script (v3 draft, curriculum/UX polish — NOT generated)

**Status:** Draft only, updated to match the live page after the owner's
visual/interaction correction pass (course-audit-build, "MODULE 2 +
MODULE 0 — OWNER APPROVAL GATE BEFORE ANY AUDIO PRODUCTION" task,
2026-08-31). **No audio exists for this version and none was generated
this pass — this task is a hard stop on ElevenLabs spend pending owner
approval of the rendered Module 0/2 student experience.** The v1 curriculum (repeated permission-asking, arrival-sequence
accordion, scent-script-builder) is obsolete and not reused, exactly as
before. This v3 draft is fully rewritten to match the current markup; it
supersedes the earlier v2 text but not any v2 audio, since no v2 audio
was ever produced either.
Follows the frozen Module 1 Listen Mode architecture; once approved and
generated, qaStatus stays `GENERATED`, never `APPROVED`, pending the
owner's separate CapCut pass and listen-through.

**Permanent narration rules to apply at generation time:** Cadence speaks
in first person (I/me/my/I'll), never third person about herself. "AIMT"
is spelled out letter-by-letter in TTS text (`A-I-M-T`) wherever it
appears, so Jane pronounces the letters rather than a word.

**Curriculum authority:** the rebuilt `#module2Wrap` in full — the
governing-principle intro, Sections 2.1–2.7, the "Head Spa Intake +
Service Plan" downloadable, one **6-item, one-scenario-at-a-time**
"Before service, or during service?" practitioner-judgment interaction
(reduced from 12, per the owner's visual-correction pass), one checkpoint
(`m2cp1`, preserved id and passed state), one completion card whose
`.lc-recap` now carries the module-recap substance (the recap is no
longer a separate white section — see the "Completion" note below).

**Interactive classifier (2.6):** narrated as framing only — the six
items and their correct answers are the student's own ungraded, retryable,
one-at-a-time exercise on screen, not narratable content with a single
correct reading order.

**No forward references to Module 8:** the owner's correction pass
removed "from Module 8" / "Module 8 teaches" attribution from 2.4 and 2.5
— Module 2 comes before Module 8 in the course, so crediting a module the
student hasn't reached yet was a genuine sequencing error, not just a
style note. This script never names "Module 8" either; the shoulder-
contact script and the three communication concepts are narrated as
Module 2's own teaching.

**Completion / recap placement:** the recap that used to sit in its own
white "Module recap" section (between the checkpoint and the black
completion card) now lives inside the black completion card itself
(`.lc-recap`/`.lc-recap-list`, the same pattern the frozen Module 1
reference implementation already uses for `#m1Complete`). Since that card
only reveals post-pass, the recap's narration moves into the post-pass
completion chunk too — it's no longer narrated before the checkpoint.

**Player segments (11):** Opening (briefing) → governing principle → 2.1
→ 2.2 → 2.3 + before/during → downloadable → 2.4 First Touch → 2.5
Protect the Quiet → 2.6 When Something Changes + interaction framing →
2.7 Consistency → Checkpoint (`m2cp1`) → post-pass completion + recap +
handoff.

**Reference Voice landmarks:** the full "remove preventable uncertainty"
list (2.2); the full before-service/during-service lists (2.3); the
downloadable's description and disclaimer (near-verbatim); the shoulder-
contact "why it matters" list + "not this" prohibition + the scent-
introduction line (2.4, near-verbatim); the three
communication concepts (Communication cue / Keep the flow quiet / If
they ask) (2.5); the five consistency checkpoints (2.7); the completion
card's recap lines (near-verbatim).

---

## The script

### M2-01 — Module Briefing (spoken)
**VOICE:** Teaching.

> Welcome to Module 2. The experience begins before your hands do.
>
> A Head Spa should not require a running conversation to feel attentive. Your job is to do the important thinking early: understand the client, establish the service plan, set expectations, prepare the environment, and resolve the predictable questions that could otherwise interrupt the experience later.
>
> You'll use intake to build the service plan before the client arrives, remove preventable uncertainty during the arrival, set expectations without over-explaining the protocol, understand why the shoulder contact matters as intentional first touch, and know what belongs before service versus during service.
>
> [warmly] Pay attention to this: the goal is not to ask fewer questions by guessing. It is to ask the right questions at the right time.

### M2-02 — The governing principle
**SOURCE:** the intro block between the opener and 2.1. **VOICE:** Reference for both principle lines.

> Here's the principle that governs this module, and really this entire course from here forward: intake determines the plan. Preparation removes uncertainty. The service executes the plan.
>
> A second important principle: relaxation begins with certainty. Before asking a client to settle into a quiet, hands-on service, remove as much preventable uncertainty as reasonably possible. Answer predictable logistical questions before the client has to carry them mentally. That doesn't mean giving a long speech or narrating every future technique.
>
> [slowly] The goal: prepare thoroughly, orient clearly, then let the service speak for itself.

### M2-03 — 2.1 Intake Before Arrival
**VOICE:** Teaching, Reference for the closing key-point.

> Section 2.1 — Intake before arrival. The intake should do work for you.
>
> A good intake is not paperwork you glance at while the client waits. Review it before the appointment whenever possible. By the time the client arrives, you should already understand information that could materially affect the service — sensitivities, fragrance tolerance or a fragrance-free plan, positioning needs, areas of concern, known product issues, service preferences, relevant areas to modify or avoid, and anything requiring adaptation within your professional scope.
>
> The intake is also part of expectation-setting. The client should understand the type of service they booked, and that it's a hands-on service.
>
> At arrival, don't restart the entire intake interview from zero. Confirm what genuinely needs confirming. Clarify an answer when it affects safety or the plan. Ask if something important has changed. Then move forward.
>
> [firmly] The point isn't to eliminate communication. It's to avoid discovering basic service decisions one step at a time while the client is trying to relax.

### M2-04 — 2.2 Remove Preventable Uncertainty
**SOURCE:** the full ten-item list. **VOICE:** Reference for the list.

> Section 2.2 — Remove preventable uncertainty. Relaxation begins with certainty.
>
> Before the client is expected to relax, make sure they know: what they should change into, what they may leave on, where their belongings go, how they'll remain appropriately covered, where they should go or wait once they're ready, whether you'll return to the room or meet them elsewhere, what happens immediately after they're changed and ready, the general shape of the appointment they're about to experience, roughly how the service will flow without narrating every technique, and how to communicate if temperature, pressure, positioning, or comfort needs to change.
>
> The goal is to answer the predictable questions before the client has to carry them. The more uncertainty you remove appropriately at the beginning of the appointment, the less mental work the client has to do once the service starts.
>
> We're not making a medical claim that this guarantees relaxation. We're teaching that clear preparation reduces preventable logistical uncertainty and lets the client spend less time wondering what happens next.
>
> [slowly] Prepare thoroughly. Orient clearly. Then let the service speak for itself.

### M2-05 — 2.3 Set the Plan Before the Quiet + Before/During
**SOURCE:** both full lists. **VOICE:** Reference for both.

> Section 2.3 — Set the plan before the quiet. Resolve important choices first.
>
> Before hands-on treatment begins, the client should know enough to settle into the experience without wondering what they're supposed to do. Depending on the service and intake, establish or confirm: the service format, the standard areas included, relevant areas to modify or avoid, fragrance sensitivity or a fragrance-free plan, product sensitivities, positioning and support needs, general pressure preference where useful, and how to communicate if something needs to change.
>
> Don't turn this into a ten-minute protocol briefing. The purpose is to resolve predictable decisions now so they don't repeatedly interrupt treatment later.
>
> Before service versus during service. Establish before service: fragrance tolerance or a fragrance-free plan, standard areas included in the booked service, known adaptations or omissions, product sensitivities, positioning considerations, general service expectations, relevant touch expectations, and planned service format.
>
> Manage during service: water temperature, pressure when it genuinely needs adjustment, immediate discomfort, necessary repositioning, unexpected reaction, a new safety concern, a real transition that benefits from orientation, a question the client asks, and a client changing their mind or communicating new information.
>
> [firmly] Client choice remains ongoing. Prepared service delivery never means ignoring hesitation, discomfort, or a changed decision. It means you don't repeatedly reopen decisions that have already been established unless something changes.

### M2-06 — Practitioner resource: Head Spa Intake + Service Plan
**VOICE:** Reference (near-verbatim description and disclaimer).

> There's a practitioner resource on screen here — the Head Spa Intake and Service Plan. It's a two-part fillable form: gather the information that affects service planning, then convert it into a clear practitioner plan before hands-on treatment begins. Make it your own — use it as-is, or adapt the layout and add your own branding while keeping the professional purpose behind it. And to be clear: this is a service-planning tool, not a medical-history form, a diagnosis form, or a legal waiver. You're still responsible for whatever consent, privacy, licensing, or legal documentation your own jurisdiction and business require.

### M2-07 — 2.4 First Touch
**SOURCE:** the "why it matters" list, the "not this" prohibition, and the scent line, all near-verbatim. **VOICE:** Reference throughout.

> Section 2.4 — First touch. The first touch should feel intentional.
>
> In the A-I-M-T Head Spa service, the hand at the shoulder is not an accidental gesture before the treatment begins. It's the beginning of hands-on service. Touch expectations should already have been appropriately established through the service description, intake, and pre-service conversation. As the aromatherapy opening begins, you place a hand gently at the shoulder before presenting the first scent, and maintain light contact through the selection.
>
> Why the shoulder contact matters: it marks the transition from appointment interaction into hands-on service. It anchors the beginning of the experience. It creates continuity through the scent-selection opening. It should feel confident, calm, intentional, and attentive.
>
> [firmly] Not this: it is deliberate service choreography — not a technique for subconsciously creating trust, regulating the nervous system, forcing relaxation, or guaranteeing a psychological response.
>
> If intake established a fragrance-free service, follow that plan rather than presenting irrelevant scent options. If scent is included, use a simple, consistent introduction: "I have three scent options for you today. Take a moment with each and tell me which one you're most drawn to." Present the options evenly. Don't instruct the client to close their eyes — if they naturally want to, that's fine. Remain attentive to actual hesitation or discomfort and adjust when necessary.

### M2-08 — 2.5 Protect the Quiet
**SOURCE:** the three communication concepts, near-verbatim. **VOICE:** Reference throughout.

> Section 2.5 — Protect the quiet. Explain intentionally, not continuously.
>
> The Head Spa service is relaxation-first. Most hands-on treatment should remain quiet by default. You shouldn't be repeatedly asking things like "Is this okay?", "Do you want me to do this part?", "Can I move to the next step?", "Would you like me to include this?", or "Is it okay if I touch here?" when those are already-established, standard parts of the service.
>
> Repeatedly re-deciding the service interrupts flow, creates unnecessary mental work for the client, can make you appear uncertain, and conflicts with the entire purpose of doing a strong intake beforehand.
>
> Three concepts make this possible. Communication cue: say this proactively, when the client genuinely needs information — positioning, temperature, pressure, an unfamiliar sensation, or an important transition. Keep the flow quiet: no narration needed by default — perform the step confidently and let the service continue. And if they ask: you already know how to answer a likely client question — answer briefly and accurately, then return your attention to the service.
>
> [warmly] Prepared practitioners can stay quiet because they already know what they'd say if the client needs them.

### M2-09 — 2.6 When Something Changes + interaction framing
**VOICE:** Teaching, Reference for the key-point.

> Section 2.6 — When something changes. The plan is established. Your attention stays active.
>
> A quiet service is not an inflexible service. If the client becomes uncomfortable, pulls away, reports pain, reacts unexpectedly, needs different support, changes their mind, gives new information, or presents a reason the service should be modified, paused, or stopped — respond. Pause when appropriate. Adjust within scope. Clarify when clarification is genuinely needed. Stop or refer when the service shouldn't responsibly continue.
>
> [firmly] Don't interrupt the service to solve decisions that should have been handled beforehand. Do interrupt the service when the client or situation in front of you gives you a real reason to.
>
> There's a practitioner-judgment exercise on screen — six real examples, one at a time. For each one you decide whether it belongs before the service or during it, then move to the next. It's ungraded and retryable, so take your time with it before moving on.

### M2-10 — 2.7 Consistency
**SOURCE:** the five consistency checkpoints, near-verbatim. **VOICE:** Reference throughout.

> Section 2.7 — Consistency. Build a framework you don't have to reinvent.
>
> Consistency doesn't mean every client receives an identical experience. It means your process reliably addresses the same important questions. Before they arrive: have I reviewed what could affect the service? When they arrive: do they understand what they need to do and what happens next? Before hands-on treatment: have relevant choices, adaptations, expectations, and logistics been established? At first touch: am I beginning deliberately rather than awkwardly searching for the next step? During treatment: am I protecting the flow while staying attentive enough to respond when something actually changes?
>
> [slowly] That's what makes the service repeatable without making it robotic.

### M2-11 — Checkpoint (`m2cp1`)
**SOURCE:** the checkpoint prompt only — never the grading rubric. **VOICE:** Teaching. Ends the player audio; the checkpoint stop is structural (`gateType: 'checkpoint-stop'`).

> Here's your checkpoint for this module. A new client has completed their intake and is booked for your standard Head Spa service. Walk through the transition from reviewing their intake to the first few minutes of hands-on treatment. Explain what you want established before the service begins, how you remove preventable uncertainty during arrival and preparation, why the shoulder contact matters as the first-touch moment, how you handle the aromatherapy opening, and what kinds of communication still belong during the service once the plan has already been established. You don't need to reproduce a script — explain the reasoning behind your approach.
>
> Take your time, and answer above.

### M2-12 — Post-pass continuation: completion + handoff
**SOURCE:** the `#m2Complete` completion card. **v4 update (course-wide completion-card standardization task):** Module 2's card no longer has a `.lc-recap` block — every Module 0-11 completion card converged on one shared `.lc-check`/"Module complete."/`.lc-body`/`.lc-next` architecture (see `tests/course-wide-completion-cards.test.mjs`), so this chunk's narration is trimmed to match: no separate "quick recap" list, one consolidated closing statement instead. **VOICE:** Teaching. `gateType: 'post-pass'`, `resumeAfterPass: true`.

> Module complete. You can use intake and preparation to remove preventable uncertainty, establish the service plan before treatment, and protect a quiet Head Spa experience while staying attentive to real client needs.
>
> Up next, Module 3: moving beneath the experience into the science of the hair and scalp. The goal is to understand what you're observing, so later service decisions have a clear professional reason behind them.

---

## Editorial QA (pre-generation checklist — NOT yet cleared for generation)

Parity against the rebuilt curriculum confirmed line-for-line (governing
principle, all 7 numbered sections, the downloadable, the interaction
framing, the checkpoint, the completion card's recap). Reference
completeness: the 10-item uncertainty list, both before/during lists,
the shoulder-contact why-it-matters list, the "not this" prohibition,
all 3 communication concepts, the 5 consistency checkpoints — all
present in full, visible order. No invented physiological/psychological
claims (the "not this" prohibition against subconscious trust/nervous-
system/guaranteed-relaxation carried forward verbatim in spirit). No
repeated-permission-asking language anywhere in Teaching Voice framing
(would directly contradict 2.5's own teaching). No forward references to
"Module 8" anywhere in this script (matches the live page after the
owner's correction). Correct single checkpoint location (`m2cp1`,
matching its real end-of-module position, preserved id). "AIMT" spelled
`A-I-M-T` wherever it appears (one occurrence, Section 2.4). Cadence
speaks in first person throughout. Estimated ~12 min total.

**This checklist being clear does not authorize generation.** Per the
locked approval sequence, ElevenLabs generation for Module 2 (and
Module 0) waits for explicit owner approval of the rendered student
experience.

## ElevenLabs generation plan (draft only — hold until owner approval)

| Piece | Chunks | Approx. chars |
|---|---|---:|
| A1 | briefing → governing principle → 2.1 | ~2,150 |
| A2 | 2.2 → 2.3 + before/during | ~2,500 |
| A3 | downloadable → 2.4 → 2.5 | ~3,000 |
| A4 | 2.6 → 2.7 → checkpoint | ~2,550 |
| B1 | post-pass completion + recap + handoff | ~750 |

5 generations, `Y3ZPRGOSIxbV4Rbb3WiA` / `eleven_v3`.
