# Module 7 — Approved Audit Specification

**Course:** AIMT Head Spa Certification Course
**Module:** 7
**Approved module title:** Equipment & Room Setup (kept — see "Approved module identity")
**Source reviewed:** `module-07-source.md`
**Audit date:** August 10, 2026
**Status:** Approved for controlled implementation
**Production source of truth:** `headspa-mastery.html`

This document is the approved implementation specification for Module 7. It replaces the empty external-audit scaffold and becomes the controlling Module 7 content authority.

It does not authorize changes to authentication, entitlements, payments, database policies, certificate issuance, Modules 0–6, Module 8, the future Module 12 Final Exam, or the monolithic course-file architecture. Nothing in this document authorizes implementation, image generation, or downloadable production — those are separate, later tasks, and this specification does not begin any of them.

Module 5 taught the student to adapt a service; Module 6 taught the student to interpret what they're looking at. Module 7 teaches the student to build the physical and procedural system the rest of the course happens inside — not by listing equipment, but by teaching what a setup needs to accomplish (access, comfort, safety, consistency, speed) and what happens when it doesn't.

---

## Research and evidence sources

Only claims that materially affect a setup, positioning, or safety decision were checked. This is not a literature review.

1. **Beauty parlor stroke syndrome (BPSS) / vertigo and ischemic stroke after cervical hyperextension.** A rare but well-documented phenomenon in which sustained hyperextension of the neck — most commonly at a salon shampoo-bowl edge — compresses or, in rarer cases, dissects the vertebral artery at the atlanto-occipital junction, disrupting posterior-circulation blood flow. First described by neurologist Michael Weintraub (1993); a 2022 case report and literature review (Yılmaz et al., *Vertigo and Ischemic Stroke after Hyperextension (Beauty Parlour Stroke syndrome)*, PMC9799011) documents the mechanism and explicitly recommends that "employees of beauty salons, barbers and hairdressers should be informed about the related syndrome while receiving vocational training." A 2024 case-series review in *The American Journal of Emergency Medicine* identified 54 documented cases over five decades, 42 of them salon-originated, across a wide age range including healthy younger clients, not only older or already-compromised individuals. The Professional Beauty Association's own trade guidance recommends upright/funnel-style shampooing as an option for at-risk clients (seniors, clients with neck or back conditions) and names one-sided facial drooping/weakness and slurred speech as the highest-priority stroke warning signs requiring immediate emergency response, not a wait-and-see approach. **This directly changes Module 7's client-positioning curriculum** — see "Required corrections" #10 and the revised Section 7.4 below. The module's existing "neck naturally relaxed — not extended, not flexed" instruction already avoids the highest-risk position; what was missing is *why* that instruction matters and what to watch for if something is wrong. This is added as a brief, factual safety note — not a disclaimer section — consistent with the governing standard that safety is a guardrail, not the dominant tone.
2. **Ergonomic reach-zone principles** (general industrial/workplace ergonomics — Cisco-Eagle, BOSTONtec, and comparable workstation-ergonomics references converge on the same model). A worker's usable space divides into a **primary/"golden" zone** (shoulder-to-waist height, directly in front, no reach or step required — for items used constantly), a **secondary zone** (a short reach or turn away — for items used once or twice per task), and a **tertiary/extended zone** (requires stepping or bending — for backup stock, not active-service items). This is general ergonomic design knowledge, not head-spa-specific, but it directly supplies the organizing logic Module 7's current cart/tray content lacks (see "Treatment station / cart setup teaching standard" below) — it changes a setup decision (what goes where on the cart) and is therefore in scope per the governing evidence standard.
3. **NIOSH-recognized musculoskeletal risk in cosmetology/salon work** (OSHA's own published salon-hazard guidance and multiple ergonomics-of-hairdressing analyses converge): sustained forward neck flexion, shoulder abduction/flexion above shoulder height, and prolonged standing are documented, elevated-risk postures for this occupation. This supports — but does not require rewriting — the module's existing "reduce unnecessary reaching" framing in the pressure-test callout; no new claim was added on this basis, since the current copy is already directionally correct and does not overstate anything. Recorded here so the reasoning is traceable, not because a correction was needed.

No source was found — and none was needed — to verify a single "correct" head spa bed model, brand, or configuration as universally required. The armrest-comfort claim in current Section 7.1 is a practitioner-preference/comfort observation, not a documented ergonomic or safety requirement; it is corrected below from an unqualified rule to a clearly labeled preference (see "Required corrections" #9 and "Treatment-bed teaching standard").

---

## Approved module identity

**Title: kept — "Equipment & Room Setup."** The hero eyebrow, home-row title, and `MODULE_TITLES[7]` already match exactly (no drift, unlike Modules 5–6 at extraction time), and the title accurately names what the module covers: the physical equipment, the room, and the procedural system built around both. A rename was considered — something like "Building Your Service System" — to foreground workflow/ergonomics/positioning over static equipment, but rejected: the module's actual content (a bed, tools, a prep sequence, positioning) is still organized around physical setup, and the deeper "system, not shopping list" framing this audit adds can live in the hero/section copy without requiring a new title. Renaming without a structural reason would violate the "do not rename merely to sound newer" rule.

**Hero eyebrow:** "Module 7 · Equipment & Room Setup" — kept verbatim.

**Hero headline:** "Before the service starts, your setup is already speaking." — kept verbatim. Strong, accurate framing; no correction needed.

**Hero description:** kept verbatim — kept as approved copy, with the only change being removal of the hard-coded `<br>` (see "Required corrections" #13 / "Responsive/mobile requirements").

**Relationship to Module 6:** no change required. Module 6's own completion card already accurately previews Module 7 ("equipment, tools, room design, and how to build a workspace that makes everything else possible"). Module 7's hero opening a self-contained frame rather than referencing Module 6's "interpret before you treat" theme is appropriate — Module 7's subject (physical/procedural readiness) does not need to causally follow Module 6's interpretive theme, and forcing a callback sentence would be artificial. No correction needed.

**Transition to Module 8:** the completion card's existing Module 8 preview text ("The full 17-step service map...") is retained. Module 8 has not been audited, so this specification cannot independently verify the preview's accuracy against Module 8's eventual approved content — it is retained because nothing in this audit found reason to doubt it, not because it was independently confirmed. Flag for the Module 8 audit to double back and confirm this preview once Module 8 itself is specified.

---

## Approved outcomes

By the end of Module 7, the student should be able to:

1. Evaluate a head spa bed against function-based decision categories (support, access, water management, stability, cleaning compatibility, space) rather than by appearance — and correctly identify when a feature is a strong preference versus a hard requirement.
2. Prepare a treatment station in a consistent, repeatable sequence, and explain why sequence — not just item count — is what makes a station feel "ready" to a client.
3. Arrange tools and products on a cart or station by service sequence and frequency of use — not by category alone — reducing mid-service reaching, backtracking, and stepping away.
4. Position a client using three concrete physical checks (halo alignment, shoulder position, occipital support) and correctly identify when one of the three is wrong before water starts.
5. Recognize the observable signs that a setup is not ready or a positioning is incorrect — in someone else's station, not only their own.
6. State why sustained neck hyperextension against a hard basin edge is avoided, and what to watch for and do if a client reports strain, dizziness, or discomfort mid-service.
7. Distinguish equipment/tools that are required for a professional head spa service from those that are useful upgrades or genuinely optional, and explain the actual problem each retained category solves.
8. Demonstrate this judgment through two applied open-response checkpoints that test genuinely different competencies (pre-service planning reasoning, and live in-service adjustment).

Avoid outcomes that merely say the student will "learn about equipment" or "understand room setup" — every outcome above names something the student can evaluate, arrange, position, recognize, or say differently.

---

## Keep unchanged

- Technical module ID `7`.
- Wrapper ID `module7Wrap`.
- Checkpoint IDs `m7cp1`, `m7cp2`.
- Completion-card ID `m7Complete`.
- Two required open-response checkpoints (see "Are both checkpoints necessary?" below).
- Module 6 as the prerequisite; Module 8 as the next module.
- Existing students who have already passed either checkpoint remain passed.
- The core equipment-selection principle that comfort/performance should outweigh appearance — accurate and valuable, kept, with its supporting claim relabeled as a preference rather than a rule (see correction #9).
- The tool philosophy in 7.2: more tools does not equal a better service; hands create the experience; essentials-first, upgrades-later. This is genuinely useful practitioner judgment and stays.
- The four tool categories (linens & comfort, service tools, sanitation supplies, ambient experience) and their essential/upgrade split — reviewed and found accurate; no item added, removed, or reclassified.
- The core prep-consistency argument in 7.3 (a client notices inconsistency even without being able to name it) — accurate and well-stated, kept.
- The ten prep-checklist items' content — reviewed individually; all ten are accurate, specific, and genuinely useful. No item removed. See "Station-prep checklist audit" for what changes is the checklist's *behavior* and framing, not its content.
- The three positioning checks in 7.4 (halo alignment, shoulder position, occipital support) — the underlying instructions are correct and stay; they gain a "why it matters" and a "signs something's off" layer (see corrections #10–11).
- The "pressure test your setup" key-point callout — a strong, actionable self-check; kept verbatim.
- Module 4's observation-versus-conclusion discipline as an implicit model for the new signature interaction (see below), without re-teaching it.

Do not rename the module ID, checkpoint IDs, completion-card ID, progress keys, or stored checkpoint keys merely to normalize implementation.

Do not add a third required checkpoint.

---

## Required corrections

1. **Fix `m7cp1` displayed/evaluated question mismatch.** Make `M7.questions.m7cp1` byte-identical to the displayed `.body-text` string (em dash retained — see "Checkpoint specification").
2. **Fix `m7cp2` displayed/evaluated question mismatch.** Make `M7.questions.m7cp2` byte-identical to the displayed string (contractions retained, not expanded).
3. **Replace the shared `M7.system` rubric with `M7.systems.m7cp1` / `M7.systems.m7cp2`**, matching the per-checkpoint structure used in Modules 1–4 and (post-audit) Modules 5–6.
4. **Add module-specific checkpoint network-error text** — `submitM7CP` currently passes no 5th `errorMessage` argument. Add the approved text (see "Checkpoint specification").
5. **Correct Cadence's old course name and personal-experience claims** — `M7.system` ("instructor of HeadSpa Mastery") and `MODULE_GUIDE_SYSTEMS[7]` ("a mentor built from nearly two decades in the head spa industry"). See "Cadence behavior" for approved replacement copy.
6. **Correct Section 7.1's visible, student-facing Cadence note.** The current note ("One of the earliest mistakes I made was prioritizing what looked impressive in photos...") is a first-person autobiographical claim rendered directly in the lesson body — a more visible instance of the personal-experience-claim problem than the hidden system prompt, since students read it directly. Cadence may say guidance was built from the instructor's applied experience; it may not claim that experience as its own. See "Final replacement copy" for the corrected note.
7. **Resolve the tool-category accordion.** See "Tools and supplies teaching standard" — retained as an accessible content-organization disclosure, not claimed as a learning interaction (it does not count toward interaction density).
8. **Resolve the prep checklist's reset-and-completion-language mismatch.** The checklist's silent reset on every reopen is *correct* behavior for an ungraded practice tool (per the governing standard, ungraded interactions must not persist or gate anything) — the defect is that the completion card asserts "Your prep sequence is locked" unconditionally, implying the checklist was used and remembered. Fix the completion-card copy, not the checklist's reset behavior. See "Station-prep checklist audit" and "Completion behavior."
9. **Relabel the bed-armrest recommendation as a preference, not a rule.** "Prioritize models without confining armrests" is retained as practitioner-preference guidance (real, useful, and consistent with the module's own comfort-over-appearance argument) but is not supported by an external ergonomic or safety source as a universal requirement — see "Research and evidence sources." Reframe from an unqualified instruction to a clearly labeled preference within a broader function-based bed-evaluation framework (see "Treatment-bed teaching standard").
10. **Add the missing safety context to client positioning.** Section 7.4 currently states the three correct-positioning checks with no explanation of *why* neck extension is avoided and no guidance on what to watch for or do if something is wrong mid-service. Add a brief, factual "why this matters" note grounded in the BPSS research and a short "signs to watch for, and what to do" callout. See "Client positioning — approved teaching content" below. This is a safety-relevant correction under the governing evidence standard, not a stylistic addition.
11. **Make the mid-service response sequence visible curriculum, not hidden-only.** The "stop, adjust, communicate, resume" sequence `m7cp2` is graded against currently exists only in the hidden `M7.system` rubric — never taught to the student. Per the governing checkpoint standard, no required checkpoint may grade hidden curriculum. Add this sequence explicitly to Section 7.4's new safety callout (see below), then keep it in the checkpoint rubric now that it is actually taught.
12. **Add cart/tray organization logic.** Section 7.2 currently lists tools by category with no arrangement guidance; Section 7.3's checklist references a "cart" and "product dishes" with no layout logic. Add a short, evidence-grounded reach-zone framework (see "Treatment station / cart setup teaching standard").
13. **Remove the hard-coded hero `<br>`.** Let the hero title wrap naturally at all viewport widths instead of forcing a fixed break point.
14. **Fix accessibility gaps:** add `aria-label="Speak your answer"` to both voice buttons and `aria-label="Send response to Cadence"` to both submit buttons; add `aria-live="polite"` to both `.cp-response` regions; convert the tool-category rows and prep-checklist rows to native, keyboard-operable controls with correct ARIA state (see "Accessibility requirements").
15. **Add a correct-vs-incorrect positioning comparison.** Section 7.4 currently has two "Correct Positioning" placeholders and no incorrect example. See "Visual asset plan" for the full required photo specification.
16. **Fix the completion-card overclaim.** "Your prep sequence is locked" is corrected to language that does not assert the checklist was used (see "Completion behavior").

---

## Section-by-section approved structure

The approved sequence keeps the existing four-section shape — it is sound and does not need reordering — and adds targeted content within it rather than new numbered sections, to avoid unnecessary structural churn. One new element (the signature interaction) is added between 7.4 and the checkpoints.

**7.1 → 7.2 (expanded) → 7.3 → 7.4 (expanded) → Signature interaction (new) → `m7cp1` → `m7cp2` → completion**

Checkpoint placement changes from "both at the very end, back to back" to **`m7cp1` immediately after the signature interaction, `m7cp2` at the very end** — giving the module one checkpoint after the full instructional/diagnostic arc (planning reasoning) and one final checkpoint that synthesizes everything including positioning (live adjustment), rather than two undifferentiated checkpoints in a row with nothing between them.

### 7.1 — The treatment bed

**Purpose:** teach function-based bed evaluation, not brand/model shopping.

**Key teaching points:** basin/head relationship, neck/head support, client entry/exit, practitioner reach and working height, water management, stability, cleaning/sanitation compatibility, space requirements — organized as evaluation categories, not a feature list. The armrest-comfort point is retained as one labeled preference within this framework, not the section's only claim.

**Required copy/content changes:** reorganize around the function-based categories (see "Treatment-bed teaching standard"); relabel the armrest claim as a preference (correction #9); correct the Cadence note (correction #6).

**Interaction requirements:** none — instructional/reference content.

**Visual requirements:** required bed-setup photo (see "Visual asset plan").

**Before moving on, the student should:** be able to name at least three functional categories they'd actually evaluate a bed against, beyond "how it looks."

### 7.2 — Tools & supplies

**Purpose:** teach essentials-vs-upgrades tool judgment and — newly — how those tools get organized for service.

**Key teaching points:** unchanged tool philosophy and four categories; new "arranging your cart" content teaching reach-zone-based placement (frequently-used items in the golden zone closest to the practitioner's working side; occasional items a step away; backup stock off the working surface).

**Required copy/content changes:** add a short new subsection at the end of 7.2, "Arranging your cart," applying the reach-zone framework directly to the categories already taught (see "Treatment station / cart setup teaching standard").

**Interaction requirements:** the tool-category accordion is retained as an accessible content-organization disclosure only (see "Tools and supplies teaching standard") — not a graded or judgment-requiring interaction.

**Visual requirements:** none new for this section (the station-prep photo in 7.3 covers the assembled result).

**Before moving on, the student should:** be able to state which items they'd keep in reach and why, for their own most common service.

### 7.3 — Station prep sequence

**Purpose:** teach a repeatable pre-client prep routine and give the ten-step list explicit sequencing logic.

**Key teaching points:** unchanged ten-item content; a new one-sentence clarification of what the numbered order actually represents (sanitation and structural setup first, client-facing comfort/ambient elements last, so nothing has to be assembled while the room is being sanitized or the client is present).

**Required copy/content changes:** add one clarifying sentence after the section intro explaining that the numbered order reflects a logical build sequence (sanitation/structure → product/tool staging → comfort → ambient), not an arbitrary checklist.

**Interaction requirements:** the prep checklist is retained as an ungraded, accessible, ticked-and-reset practice tool (see "Station-prep checklist audit").

**Visual requirements:** required station-prep photo, now explicitly demonstrating reach-zone-organized cart placement (see "Visual asset plan").

**Before moving on, the student should:** be able to explain why halo flush happens before ambient setup, not just recite the list in order.

### 7.4 — Client positioning

**Purpose:** the module's highest-value section — teach positioning based on observable outcomes, add the safety context currently missing, and make the mid-service response sequence visible curriculum.

**Key teaching points:** unchanged three positioning checks (halo alignment, shoulder position, occipital support); new "why this matters" note on cervical positioning grounded in the BPSS research; new "signs to watch for, and what to do" callout teaching stop → adjust → communicate → resume explicitly.

**Required copy/content changes:** see "Client positioning — approved teaching content" below for exact new copy.

**Interaction requirements:** the three position cards remain static (correctly non-interactive — nothing here should be a reveal).

**Visual requirements:** required correct/incorrect side-view positioning pair; optional top-view correct-only image (see "Visual asset plan").

**Before moving on, the student should:** be able to identify, from a description or image, which of the three positioning checks is wrong — and state what to do if a client reports discomfort mid-service.

### Signature interaction — "Find the setup mistakes" (new)

Placed here because it synthesizes 7.1–7.4 together. See "Signature learning moment" below.

### `m7cp1` — moved to directly follow the signature interaction

Tests planning/sequencing reasoning, now reinforced by having just practiced spotting setup errors. See "Checkpoint specification."

### `m7cp2` — remains the final section

Synthesizes bed comfort, prep, and — now visibly taught — the stop/adjust/communicate/resume response to a live positioning/comfort problem. See "Checkpoint specification."

### Completion card — `m7Complete`

See "Completion behavior."

---

## Treatment-bed teaching standard

Section 7.1 is corrected from a single "avoid confining armrests" instruction plus rationale into a short function-based evaluation framework, with each category doing real teaching work:

- **Basin/head relationship and neck/head support** — required. The headrest curve must actually support the occipital bone in a relaxed, non-extended position (ties directly into 7.4).
- **Client entry/exit and stability** — required. A bed a client can get on and off safely, and that doesn't shift or wobble under normal movement.
- **Practitioner reach and working height** — required. Affects the practitioner's own posture and access across an entire shift (Source 3).
- **Water management** — required. How water is contained/drained affects both service flow and sanitation.
- **Cleaning/sanitation compatibility** — required. Surfaces and seams that can actually be disinfected between clients.
- **Space requirements** — practitioner-preference/business-context dependent, not universal — noted as such.
- **Armrest configuration (comfort)** — **labeled preference, not requirement.** Retain the existing observation (armrests that "tuck in" larger/taller clients are a commonly reported comfort complaint) but state plainly that this is a preference many experienced practitioners share, not a documented safety or ergonomic requirement, and that the deciding factor is always how it performs for the practitioner's actual clientele.

Do not imply there is one universal required bed model — there isn't, and no evidence supports that claim. The section teaches evaluation criteria a student can apply to any bed they're actually offered or can afford, which is more useful than a single recommended model would be.

---

## Tools and supplies teaching standard

Reviewed category by category; no item found redundant, commercially biased, or unsupported. Essential/Upgrade/Optional labeling is already correctly applied and is kept as-is. Each retained category solves a stated problem:

- **Linens & comfort** — solves client thermal comfort and perceived cleanliness (fresh sheets/towels per service).
- **Service tools** — solves the actual mechanics of product application, sectioning, and drying.
- **Sanitation supplies** — solves cross-contamination risk between clients; the existing "never mix" clean/dirty bin instruction is accurate standard cosmetology-sanitation practice and is kept unchanged.
- **Ambient experience** — solves the experiential/perceptual half of the service (kept, correctly scoped as lower-priority than the other three, all marked with upgrade-tier options).

**Tool-category accordion — decision: retain, not as a graded interaction.** With up to nine items per category across four categories, flattening everything into one long always-visible list would hurt scannability more than the current click-to-expand mechanic hurts accessibility, once the accessibility gap itself is fixed. The correction is to convert `.tool-category` from a plain `<div onclick>` with zero semantics to a native, keyboard-operable disclosure control (`<button>` with `aria-expanded`/`aria-controls`, or equivalent native `<details>/<summary>` semantics) — an accessible way to organize reference content, not a pedagogical interaction. It is explicitly **not counted** in this module's interaction-density total, the same way a well-labeled accordion of reference material wouldn't be counted as a "lesson interaction" in any other module. It requires no observation, decision, or judgment, and does not claim to.

---

## Treatment station / cart setup teaching standard

This directly resolves the gap the source extraction flagged: Module 7 references a rolling cart and product dishes but gives no actual arrangement logic.

**New content, added to the end of Section 7.2 ("Arranging your cart"):** teach a simple three-zone reach framework (Source 2), applied directly to the tools already taught:

- **Within-reach zone (shoulder-to-waist height, no step required):** the three product dishes, applicator brush, and anything touched during nearly every step of the service. This is what makes "can I reach everything without stepping away?" (the existing pressure-test callout) actually achievable — the two ideas are now explicitly connected.
- **One-step zone:** items used once or twice per service — comb/detangling brush, sectioning clips, blow dryer, spa wrap/robe.
- **Off the working surface / reserve zone:** backup linens, upgrade-tier tools not in use for this service, sanitation concentrate stock. Keeping these off the immediate working surface reduces clutter and keeps the sanitation-relevant clean/dirty separation clean and visible.

**Sequence-follows-service, not category-follows-alphabet:** state plainly that arrangement should follow the order items are actually used in the service, not the four labeled categories from earlier in the section — the categories are for learning what to buy; placement on the cart is for how fast the practitioner can work once the client is there.

**Sanitation separation:** restate the existing clean/dirty bin instruction as part of this arrangement logic, not just a supply-list item — the separation only does its job if it's maintained during the live service, not just set up before it.

**7.3's numbered order clarified as a build sequence:** add one sentence (per "Section-by-section approved structure" above) stating that the ten-step order reflects sanitation-and-structure first, then staging, then comfort, then ambiance — resolving the source's open question about whether the numbering is prescriptive.

No invented universal layout diagram or fixed "always put X on the left" rule is added — the evidence supports a reach-zone *principle*, not one specific spatial arrangement, and the module should teach the principle so students can apply it to their own station.

---

## Client positioning — approved teaching content

The module's highest-priority correction. New copy for Section 7.4, added after the existing three position cards:

**"Why this matters" note (new, brief, factual, non-alarmist):**

> A relaxed, neutral neck position isn't just about comfort — sustained hyperextension against a hard basin edge is a documented, if rare, safety concern. Keeping the neck supported and unextended, as the three checks above describe, is the setup detail most directly within a practitioner's control to reduce that risk — not a guarantee against it.

**"If something's off" callout (new, standalone, always visible — not gated behind any interaction):**

> **Watch for:** the client reports neck strain, dizziness, or discomfort at any point, or the chin is visibly lifting. Some discomfort signals are only about comfort; if a client ever reports dizziness, visual changes, or slurred speech, stop immediately and treat it as a medical concern, not a positioning fix.
>
> **What to do:** stop the service, adjust the positioning or temperature issue, communicate what you're doing and check in with the client, then resume only once she confirms she's comfortable. Never adjust silently or push through to a "natural" stopping point.

This directly resolves both the missing safety context (correction #10) and the hidden-curriculum problem (correction #11) — `m7cp2`'s rubric can now grade the stop/adjust/communicate/resume sequence because it is taught, not implied.

**Distinguishing universal / equipment-specific / preference, per the governing evidence standard:**

- **Universally useful principle:** avoid sustained neck hyperextension against a hard edge; stop and adjust if a client reports discomfort rather than pushing through.
- **Equipment-specific adjustment:** the exact headrest curve and the 1–2 inch shoulder measurement are specific to a halo/wet-bed configuration and may vary slightly by bed model — stated as such, not as a universal body-mechanics law.
- **Practitioner preference, not fact:** none of the three positioning checks themselves are preference — they are functional access/support requirements. What is preference is *how* a practitioner physically executes the adjustment (e.g., exact hand placement while repositioning).

No new biomechanical or medical claim beyond what Source 1 documents is made. The module does not attempt to teach vertebral-artery anatomy, differential diagnosis, or any content beyond what a practitioner actually needs to recognize and respond to.

---

## Signature learning moment — "Find the setup mistakes" (new)

**Instructional purpose:** require the student to apply the full module's setup competency — bed, tools, prep, and positioning — in one diagnostic exercise, rather than only recalling isolated facts. This is the module's real practitioner competency: reducing trial-and-error by learning to *spot* a setup problem, in someone else's station as well as their own.

**Placement:** after Section 7.4, before `m7cp1`.

**Exact task:** the student reads a short, written walkthrough of a station "as another practitioner left it before their shift" — deliberately not an image, so the interaction does not depend on future photography and can ship without blocking on new assets. The walkthrough describes 8–10 discrete, observable conditions (a mix of genuine mistakes and things that are actually fine), spanning all four sections: e.g., the cart positioned across the room rather than within reach; product dishes stacked rather than pre-portioned; the halo hose left unwrapped; the client's shoulders four-plus inches from the bed edge rather than 1–2; the occipital resting on the flat headrest pad rather than its curve; fresh linens staged (fine); ambient music already playing (fine); the clean/dirty tool bins mixed together.

**Choices/actions:** the student selects (multi-select, toggle-style) every condition they believe is a genuine setup mistake from the full list.

**Feedback:** per-item, text-based, specific — not just "correct/incorrect." Each selected-correctly item explains *why* it's a problem in one sentence; each correctly-left-alone item (if selected) explains why it's actually fine. Never color-only.

**Retry behavior:** unlimited; selections can be freely changed.

**Graded/ungraded status:** ungraded. No `APP_STATE` write, no persistence across reopen, no completion gate — consistent with the governing standard that ungraded interactions must not pretend to prove competence.

**Progress behavior:** resets on every module open, same as the module's other two interactions.

**Accessibility:** native toggle/checkbox-style controls, each with an accessible name describing the specific condition, `aria-pressed` or equivalent checked-state semantics, live-region announcement of per-item feedback, no color-only correctness indication.

**Why distinct from Modules 5 and 6:** Module 5's signature interaction was protocol *adaptation* (choosing a service direction for a given presentation); Module 6's was triage (proceed/modify/refer). Module 7's is setup *diagnosis* — evaluating a completed physical/procedural setup for errors before a service even begins, a distinct observe-and-distinguish skill neither prior module required.

If future real tray/cart photography becomes available, a photo-based version of this same exercise (spot the mistake in an actual image) is a reasonable future upgrade — see "Visual asset plan" — but the text-based version specified here is the required, ship-now version and is not blocked on that asset.

---

## Are both checkpoints necessary?

**Yes — retained as two required checkpoints, now more clearly distinguished by placement and content.** `m7cp1` tests pre-service planning reasoning (why prep order matters, tested right after the student has just practiced spotting setup errors); `m7cp2` tests live in-service adjustment under a real, unfolding problem, now grounded in the visibly-taught stop/adjust/communicate/resume sequence. These are genuinely different competencies — planning versus real-time response — and collapsing them into one would lose one of the two.

---

## Checkpoint specification

### Shared technical requirements

Preserve: IDs `m7cp1` and `m7cp2`; stored passed state; voice input; Enter to submit; Shift+Enter for a new line; Review Mode's unsaved behavior; Module 8 gating only after both checkpoints pass.

Add: checkpoint-specific rubrics; exact displayed/evaluated question equality; module-specific network-error text; accessible control labels; polite live feedback; focused revision feedback; immediate correction of unsafe or dismissive claims.

Do not require exact wording or a minimum sentence count. Do not fail an answer for grammar, spelling, brevity, accent, or non-native phrasing when the reasoning is competent.

### Approved network-error text

> Cadence couldn't review your response. Check your connection and try again.

---

### `m7cp1` — Prep-sequence reasoning

**Exact question (displayed and evaluated, byte-identical):**

> A new student is setting up their first head spa room from scratch. What would you tell them to do first — and why does the order of prep matter?

**Competency assessed:** the student can explain a logical, repeatable prep order and articulate why sequence matters — not just recite the checklist.

**Pass when the answer demonstrates all of the following, in any natural wording:**

1. Identifies that sanitation/structural setup (e.g., the halo flush) comes before comfort or ambient elements, because building around a not-yet-sanitized or not-yet-set-up system creates avoidable rework.
2. States that client-facing comfort and ambient elements should be ready and running before the client enters, not assembled during the appointment.
3. Explains *why* this order matters — consistency, avoiding a scrambled first impression, or avoiding rework — not just what the order is.
4. Gives a reasoned explanation of dependency between steps, not only a restatement of checklist items.

**Incomplete when:** the answer lists correct first steps with no reasoning about why order matters, or gives reasoning with no concrete example of what happens first or last.

**Focused revision examples (one per response, not both):**

- "You listed strong first steps. Now explain briefly why doing them in this order matters — what would go wrong if you reversed it?"
- "Good reasoning about why order matters. Now give at least one concrete example of what should happen first and why."

**Immediate correction triggers:** any answer stating that order doesn't matter or that any step can be skipped without consequence; any answer treating sanitation as optional or lower priority than ambiance.

---

### `m7cp2` — Mid-service positioning and comfort adjustment

**Exact question (displayed and evaluated, byte-identical):**

> You've just begun the halo rinse phase. Your client mentions her neck feels strained and she's a little cold. The service has just started. Walk through how you respond — what you adjust and in what order.

**Competency assessed:** the student can apply the stop/adjust/communicate/resume sequence to a live scenario involving two distinct problems (a positioning issue and a comfort/temperature issue) without conflating or ignoring either.

**Pass when the answer demonstrates all of the following, in any natural wording:**

1. Addresses both problems — the neck strain (positioning) and the cold (comfort/temperature) — rather than only one.
2. States that the practitioner pauses the service before adjusting, rather than pushing through or waiting for a natural break.
3. Adjusts positioning specifically, referencing the relevant physical check (shoulder position, occipital support, or reducing extension) rather than only addressing temperature.
4. Communicates with the client during the adjustment — says what's changing and checks in — rather than silently fixing it.
5. Resumes only after confirming comfort, not immediately.

**Incomplete when:** the answer addresses only one of the two problems; adjusts without any client communication; or skips explicitly stopping/pausing first.

**Focused revision examples (one per response, not both):**

- "You addressed the temperature well. Add specifically how you'd check and adjust her neck and shoulder position."
- "Good positioning fix. Add what you'd actually say to her while making the adjustment."

**Immediate correction triggers:** any answer that continues the service without pausing or adjusting; any answer that dismisses the discomfort as unimportant or minor; any answer that ignores the neck-strain complaint entirely and addresses only temperature.

---

## Approved interactions — full audit

| Interaction | Decision | Instructional job |
|---|---|---|
| Tool-category accordion (`.tool-category`) | **Retain, reclassified as accessible content-organization disclosure — not a graded/counted interaction.** Convert to native keyboard-operable semantics. | None claimed — reference organization only. |
| Station prep checklist (`.prep-item`) | **Retain unchanged in behavior** (ungraded, resets on reopen — this is correct, not a defect); convert to accessible native controls; fix the completion-card copy that implied it was used. | Self-directed practice / apply. |
| Position cards + photo pair (7.4) | **Retain as static**, correctly non-interactive. Photo pair gains a required incorrect-positioning counterpart (see "Visual asset plan"). | Observe (via the new required imagery). |
| Signature interaction — "Find the setup mistakes" (new) | **Add.** | Observe, distinguish, decide. |

**Resulting graded/ungraded interaction count: three** — the tool-category disclosure (utility, not counted as a learning interaction), the prep checklist (ungraded practice), and the new signature interaction (ungraded, decide-and-apply) — plus the two required checkpoints. Density is **light-to-moderate**, appropriate to Module 7's procedural, operational subject matter, which does not require the same reveal/comparison density Module 6's interpretive content did.

---

## Cadence behavior

### Module-opening greeting

> Equipment and room setup feel like logistics, but they directly shape the service. A well-designed station removes friction before the first step even begins. Ask me anything.

### Guide system

> You are Cadence, AIMT's curriculum-grounded guide for the Head Spa Certification Course. The student is in Module 7, Equipment & Room Setup — bed selection, tool organization, station prep, and client positioning. Help the student reason through equipment trade-offs, station organization, and positioning decisions using the module's function-based framework, not brand or product recommendations. If a student reports a client discomfort scenario, reinforce the stop, adjust, communicate, resume sequence. Do not state that any single bed model or brand is required. Your guidance is built from AIMT's approved curriculum and the instructor's applied experience; you do not claim that experience as your own. Be direct, warm, practical, and concise. 3-5 sentences, no bullet points.

### Approved quick prompts

1. `What should I actually prioritize when choosing a bed?`
2. `How do I know if a client's positioning needs adjusting mid-service?`
3. `What's the one prep step I should never skip?`

(Prompt 2 replaces the original "How do I set up for back-to-back clients?" — that question is reasonable but lower-value than reinforcing the module's highest-priority safety content; back-to-back-client logistics can still be answered by Cadence if asked, just not promoted as a headline prompt.)

### Cadence response requirements

Cadence should help the student:

- reason through equipment trade-offs using the function-based framework, not brand preference;
- organize a station by service sequence and reach zones;
- decide whether a described positioning is correct, and what to adjust if not;
- apply the stop/adjust/communicate/resume sequence to a described discomfort scenario;
- communicate a setup or positioning adjustment to a client.

Cadence must not:

- use the old course name;
- present itself as a human practitioner or claim personal industry experience, including any "mistakes I made" framing;
- state that one specific bed model, brand, or configuration is universally required;
- invent equipment requirements not present in the approved curriculum;
- treat a described or illustrative setup as a diagnosis of anything beyond the setup itself.

Persistent Cadence threads remain deferred.

---

## Practitioner insider value

- **A setup that looks good can still create poor reach.** An attractively arranged cart organized by category rather than sequence forces backtracking mid-service — the client never sees this, but the practitioner feels it every appointment.
- **A "comfortable-looking" bed can still leave the neck unsupported.** Visual comfort (padding, upholstery) is not the same as functional support (occipital curve, neutral angle) — beginners commonly conflate the two.
- **Positioned "close enough" is not positioned correctly.** A few inches of shoulder-position error, or a slightly lifted chin, is invisible to a casual glance but is exactly the difference between a supported and an unsupported neck.
- **More equipment can create more friction, not more capability.** Every upgrade-tier item added to the working surface is one more thing to reach past.
- **Prep steps get forgotten when they're staged reactively** rather than run the same way every time — the value of a fixed sequence isn't ritual, it's error prevention.
- **The mistake this knowledge prevents:** a practitioner who has to stop and improvise mid-service because something wasn't within reach, wasn't sanitized in time, or wasn't checked before the water started — all avoidable with a system built in advance, not skill applied in the moment.

---

## Distinct learning rhythm

Compared to Module 5 (decision-led, service adaptation) and Module 6 (interpretation-led, distinguishing overlapping presentations):

**Module 7 is system-led.** Its dominant learning mode is applying a small number of durable evaluation frameworks (function-based bed evaluation, reach-zone cart organization, three-point positioning check) to a physical, procedural setup — not distinguishing ambiguous presentations or adapting a protocol.

- **Interaction density:** light-to-moderate, and appropriately so — the subject is procedural, not interpretive; three interactions (one utility disclosure, one ungraded practice tool, one ungraded diagnostic exercise), each with a distinct job.
- **Checkpoint placement:** `m7cp1` immediately follows the signature interaction (planning reasoning, right after practicing error-spotting); `m7cp2` closes the module (live adjustment, synthesizing everything).
- **Where independent reasoning happens:** the signature interaction (spot the setup mistakes) and both checkpoints.
- **Where Cadence adds value:** equipment trade-off reasoning, station organization, and — distinctly from Modules 5–6 — real-time positioning/comfort troubleshooting.
- **Curiosity/payoff structure:** "spot what's wrong before it becomes a problem" — a diagnostic, before-the-fact payoff, distinct from Module 6's after-the-fact interpretive payoff.
- **What prevents this from repeating the template:** Module 7 is the first module built around evaluating a *system* the student will build and rebuild before every single client, rather than interpreting or adapting to something a client presents.

---

## Insider value and acceleration payoff

The module's accelerated-mastery payoff: a student who works through this module has a repeatable evaluation framework for equipment, a cart-organization system, and a positioning check — the kind of operational fluency that otherwise takes months of trial, backtracking, and client discomfort to accumulate on the job. The signature interaction compresses that trial-and-error into one deliberate exercise: spotting the mistakes *before* they become the student's own habits.

---

## Guided completion structure

**Estimated attentive learning time:** approximately **10–13 minutes** for the instructional content — shorter and denser than Module 6, reflecting Module 7's more procedural (less interpretive/reveal-heavy) content.

**Estimated checkpoint time:** approximately **6–9 minutes** total for both open-response checkpoints, excluding retries or network delay.

**Suggested hands-on practice:** Module 7 justifies more hands-on practice than Modules 5–6, since its competency is physical, not purely conversational. Approximately **20–30 minutes**:

1. Physically run the ten-step prep sequence and time it.
2. Arrange (or rearrange) an actual cart using the reach-zone framework.
3. Practice positioning a partner or mannequin and self-check against the three-point framework.
4. Practice saying the stop/adjust/communicate/resume sequence out loud in response to a simulated discomfort report.

Not a required progress gate in the current implementation.

**Competency demonstrated:** the student can evaluate a bed against functional criteria, organize a station by service sequence, position a client correctly and recognize when positioning is wrong, and respond appropriately to a live setup or comfort problem.

**Earlier concepts to revisit:**
- Module 1: referral/stop-service language, applied here to a comfort/safety pause rather than a scope boundary.
- Module 4: observation versus conclusion, applied here to spotting setup errors rather than scalp presentations.

**Suggested course-path position:** immediately after Module 6 and before Module 8. The practitioner interprets what they see (Module 6), builds the room and system the service happens inside (Module 7), then learns the service choreography itself (Module 8) — setup necessarily comes before the step-by-step service map.

---

## Listen Mode notes

**Narration suitability:** most of Module 7's prose narrates well — 7.1–7.3's reasoning, the tool categories, the prep sequence, and both checkpoint prompts are linear text. Section 7.4's positioning content is the exception.

**Approximate narration length:** **8–11 minutes**, excluding checkpoint and interaction time.

**Visual-review cues:** narration should direct the listener to review the screen at the required bed photo (7.1), the station-prep photo (7.3), and — critically — the correct/incorrect positioning comparison in 7.4, since spatial/postural alignment is difficult to fully convey by ear alone even with careful narration.

**Screen-required content:** the correct/incorrect positioning comparison; the signature "Find the setup mistakes" interaction; both checkpoints.

**Content needing visual review:** the three positioning checks can be narrated accurately, but confirming *correct execution* against them is inherently visual — Listen Mode should make clear that audio narration teaches the checks, not proof that a student can apply them.

**Screen-required interaction content:** the tool-category disclosure and prep checklist both gate their item text behind activation by default; a narration script must read every category's full item list and all ten prep steps explicitly, not only what's visible by default.

Listening alone must never be treated as proof of setup competence — checkpoints and the signature interaction still require typed or spoken response, and positioning specifically cannot be verified through audio alone.

---

## Downloadable resource opportunity

**Recommended.**

**Title:** AIMT Station & Positioning Quick Reference

**Practical use:** a single-page, station-side reference combining the ten-step prep sequence, the three positioning checks plus the "watch for / what to do" safety note, and the reach-zone cart-organization framework — exactly the kind of thing meant to be glanced at (or laminated and taped inside a station cabinet) before every single client, rather than reopening the full lesson. This is the module whose content the practitioner will actually reference on a daily, per-client basis, more than almost any other module in the course.

**Format:** single-page PDF, printable and mobile-viewable.

**Content:** the corrected ten-step prep sequence; the three positioning checks and the safety callout, verbatim; the reach-zone framework summary.

**Lesson placement:** referenced (not embedded) near the end of Section 7.3, alongside the completion card.

**Future centralized Resources Library location:** setup/workflow reference category, alongside Module 5's "AIMT Regional Service Adaptation Guide" and Module 6's "AIMT Scalp Presentation & Referral Quick Reference."

This resource is not created or linked by this task. Production remains deferred, matching the governing downloadable-resource policy (selective, not mandatory) and existing Module 5/6 precedent.

---

## Visual asset plan

**Required and high priority**, per instruction. Every existing placeholder receives an explicit, final disposition; no placeholder is carried forward unresolved.

### Disposition of the four existing placeholders

| # | Current placeholder | Decision | Replacement |
|---|---|---|---|
| 1 | Section 7.1 — "Halo Wet Bed — Setup Photo" | **Replace with a required photograph** | Bed-setup photo (below) |
| 2 | Section 7.3 — "Fully Prepped Station — Photo" | **Replace with a required photograph** | Station/cart photo (below) |
| 3 | Section 7.4 — "Correct Positioning — Side View" | **Replace with the "correct" half of a required correct/incorrect pair** | Positioning photo A (below) |
| 4 | Section 7.4 — "Correct Positioning — Top View" | **Downgrade to optional** | Positioning photo C (below) — not blocking |

No placeholder is left unresolved.

### Required for initial implementation

#### Visual 1 — Treatment bed, setup photo (REQUIRED)

- **Required or optional:** Required.
- **Quantity:** 1.
- **Type:** photography.
- **Exact section:** 7.1.
- **Teaching purpose:** show what a properly configured halo wet bed actually looks like ready for service — supports the function-based evaluation content rather than illustrating one specific "must-have" model.
- **What must visibly be demonstrated:** the halo/basin assembly in place, clean linens on the bed, headrest visible and unobstructed.
- **Composition:** three-quarter angle showing the head/basin end and enough of the bed length to convey the working relationship between them.
- **Camera angle:** eye-level or slightly elevated, three-quarter (not a flat side elevation).
- **Landscape/portrait:** landscape.
- **Crop:** full bed visible, headrest/basin area given the most compositional weight.
- **Should the actual AIMT/ATRIUM bed reference be used:** yes, when produced — this is the module's own equipment and gives the photo real (not generic-stock) authority.
- **Caption:** "A configured head spa bed, ready for service."
- **Alt-text intent:** describe the visible setup (basin/halo assembly, clean linens, unobstructed headrest) without naming a brand as required equipment.
- **Caution/label:** none needed — not a comparison or safety-sensitive image.

#### Visual 2 — Station/cart, fully prepped photo (REQUIRED)

- **Required or optional:** Required.
- **Quantity:** 1.
- **Type:** photography.
- **Exact section:** 7.3.
- **Teaching purpose:** the module's real teaching opportunity here — not just "the room is ready," but a **visible demonstration of the new reach-zone cart-organization content from Section 7.2.** This is the strongest candidate in the module for the user's real assembled-tray/cart reference photograph.
- **What must visibly be demonstrated:** product dishes and applicator brush within immediate reach; one-step-zone items (comb, clips, dryer) visibly organized but slightly further; nothing from the reserve/backup zone cluttering the working surface; if capturable, visible separation between clean and in-use tools.
- **Composition:** angled or overhead-leaning shot of the cart/tray that makes the near-to-far zone arrangement legible at a glance — not a straight-on product-shot angle.
- **Camera angle:** elevated three-quarter, close enough that individual items are identifiable.
- **Landscape/portrait:** landscape.
- **Crop:** cart/tray fills most of the frame; background station context visible but secondary.
- **Should the real assembled tray/cart reference be used:** **yes — this is exactly what that reference photograph should demonstrate.** If the real reference tray does not already reflect the reach-zone arrangement taught in Section 7.2, it should be reorganized before the photo is taken (a staging note for whoever produces the final asset, not an instruction to generate or alter anything in this task).
- **Caption:** "A station set up in reach order — the items used most, closest."
- **Alt-text intent:** describe the visible near-to-far organization, not just "a prepped cart."
- **Caution/label:** none needed.

#### Visual 3 — Positioning photo A + B: correct vs. incorrect (side view) (REQUIRED — the module's single highest-priority asset)

This is the module's most important visual and the one place a photograph teaches something copy genuinely cannot: the difference between a supported and an unsupported neck is visually obvious but hard to fully convey in text.

- **Required or optional:** **Required.** Per the governing instruction, implementation of Section 7.4's positioning content should not be considered complete without this pair.
- **Quantity:** 2 (a matched pair — correct and incorrect).
- **Type:** photography.
- **Exact section:** 7.4.
- **Teaching purpose:** make the "why this matters" safety content and the shoulder/occipital positioning checks immediately, visually verifiable — not just described.
- **What must visibly be demonstrated:**
  - **Correct (A):** occipital resting in the headrest's curve, neck visibly relaxed/neutral (not extended), shoulders approximately 1–2 inches off the bed edge, chin level (not lifted).
  - **Incorrect (B):** chin visibly lifted, neck extended back toward/against the basin edge rather than supported by the headrest curve, and/or shoulders positioned noticeably too far from the edge. The error must be **immediately obvious without reading the caption** — a realistic but clearly wrong position, not a subtle few-degree variance.
- **Camera angle:** side view (profile), consistent between both images — this is the angle that makes the cervical alignment legible.
- **Amount of bed/body visible:** head, neck, shoulders, and the upper portion of the bed/basin — enough to show the head-to-basin relationship, not a full-body shot.
- **Body landmarks that must be visible:** jawline/chin angle, the back of the neck/occipital-to-headrest contact point, the shoulder-to-bed-edge gap.
- **Landscape/portrait:** landscape.
- **Crop:** tight enough that the neck/shoulder relationship is the clear compositional subject, not a wide room shot.
- **Same client/bed/room required:** **yes, required** — both images must use the same model, bed, and framing so the only variable is the positioning itself; this is what makes the comparison controlled and instructive rather than two disconnected photos.
- **Non-medical framing:** soft, spa-editorial lighting and tone matching the course's existing approved photography style (e.g., Module 5's installed assets) — not clinical, not harshly lit, not staged to look like an injury photo. The incorrect image shows a setup mistake, not a medical emergency.
- **Caption (A):** "Correct: occipital supported, neck relaxed, shoulders clear of the edge."
- **Caption (B):** "Incorrect: chin lifted, neck extended over the basin edge — the exact position to avoid."
- **Alt-text intent (A):** describe the supported, neutral position and the visible landmarks.
- **Alt-text intent (B):** describe the extended/unsupported position and name it as the setup mistake being illustrated, not a depiction of injury or distress.
- **Caution/label:** the incorrect image must not be captioned or framed in a way that implies medical harm is occurring in the photo itself — it illustrates a setup error, consistent with the module's non-alarmist safety framing.
- **Should the actual AIMT/ATRIUM bed reference be used:** yes, when produced, for the same reason as Visual 1.

#### Visual 4 — Positioning photo C: correct, top view (OPTIONAL)

- **Required or optional:** **Optional, non-blocking.** Implementation may proceed and pass acceptance without it.
- **Quantity:** 1.
- **Type:** photography.
- **Exact section:** 7.4.
- **Teaching purpose:** show halo-centering, a simpler, largely binary check that is adequately taught through text ("adjust the client's position, not the halo") — this image is a nice-to-have visual confirmation, not a load-bearing teaching asset the way Visual 3 is.
- **Composition/angle:** directly overhead or high three-quarter, client centered under the halo.
- **Landscape/portrait:** landscape.
- **Caption:** "Centered under the halo — water reaches the scalp evenly."
- **Alt-text intent:** describe the centered relationship between client and halo.
- **No incorrect counterpart is required** — an off-center "incorrect" top-view photo was considered and rejected as low marginal value; the mistake it would show is simple and already covered in text.

### Optional — future addendum only (not authorized, not required, not blocking)

#### Visual 5 — Reach-zone diagram (OPTIONAL)

- **Required or optional:** Optional.
- **Type:** illustration/diagram, not photography — a simple overlay of golden/secondary/reserve zones on a station layout communicates the Section 7.2 concept more clearly than a photo could, and doesn't require new photography to produce.
- **Exact section:** 7.2, alongside the new "Arranging your cart" content.
- **Teaching purpose:** visually reinforce the reach-zone framework.
- **Caption:** label the three zones in plain language ("within reach," "one step away," "off the working surface").
- **Alt-text intent:** describe the zone structure, not a specific product placement as mandatory.

**Other potential visuals evaluated and not recommended:** an overhead full-room layout (redundant with Visual 2 once the cart photo demonstrates reach-zone organization); a dedicated close-up neck-alignment image (redundant with Visual 3, which already frames tightly on the neck/shoulder relationship); a room-flow illustration (low value for a single-station scope); a dedicated sanitation-staging diagram (adequately covered by text plus whatever clean/dirty separation Visual 2 happens to show); a standalone practitioner working-position image (nice-to-have, not essential — recommending it would add image count without a teaching gap it uniquely fills).

### Do not

- Do not carry any of the four current placeholder boxes into the approved implementation unchanged or as an unresolved marker.
- Do not fabricate or imply clinical/medical photography — Visual 3's incorrect image illustrates a setup mistake, not a medical event.
- Do not caption or frame any image as proof of a required brand or bed model.
- Do not use different clients, beds, or rooms across the Visual 3 pair — the comparison must be controlled.

### Implementation blocking status

**Implementation cannot be considered complete without Visual 3 (the correct/incorrect positioning pair).** It is the module's highest-priority correction and the specific asset that makes Section 7.4's new safety content verifiable rather than merely described. Visuals 1 and 2 are also required but are lower-stakes if temporarily delayed. Visuals 4 and 5 are optional and never block.

---

## Accessibility requirements

- Convert `.tool-category` and `.prep-item` from plain `<div onclick>` elements to native, keyboard-operable controls (`<button type="button">` with `aria-expanded`/`aria-controls` for the accordion; a checkbox-equivalent control with clear checked-state semantics for the prep items).
- Add `aria-label="Speak your answer"` to both checkpoint voice buttons and `aria-label="Send response to Cadence"` to both submit buttons.
- Add `aria-live="polite"` to both `.cp-response` regions and to the signature interaction's feedback region.
- The signature interaction's toggle controls need accessible names describing the specific setup condition, not just "item 3."
- No meaning communicated by color alone anywhere in the module — the prep checklist's existing glyph-plus-color pattern is correct and should be the model applied to the signature interaction's feedback states.
- Visible focus on every interactive control, including the newly-semantic accordion and checklist items.
- Meaningful alt text on all required images per "Visual asset plan" above.
- `prefers-reduced-motion` override for the accordion's expand/collapse transition and the checklist's done-state transition.
- Mobile stacking: the tool-category list, prep checklist, and signature interaction's toggle list all remain single-column (already the case); the Visual 3 positioning pair uses the shared `.photo-pair` mobile collapse rule already used elsewhere in the course.
- No horizontal overflow at any viewport width.

Do not claim manual assistive-technology QA is complete — none has been performed as part of this specification.

---

## Responsive/mobile requirements

- Remove the hero's hard-coded `<br>`; let the title wrap naturally via CSS at all widths (correction #13).
- The Visual 3 correct/incorrect pair must stack cleanly to a single column at 375px-class widths using the same `.photo-pair` collapse rule already applied to Modules 5 and 6's photo pairs, with both images remaining legible (not so small the neck/shoulder distinction becomes illegible) at that width.
- Tool-category and prep-checklist lists remain single-column with no dedicated mobile override needed, consistent with their current (already overflow-free) behavior.
- The new signature interaction's toggle list stacks single-column at 375px with no horizontal scroll.
- No component in this module may introduce horizontal overflow at 375×812.

---

## Completion behavior

**Required checkpoint state:** both `m7cp1` and `m7cp2` graded `passed`. No read-percentage minimum — consistent with every other module.

**Does the checklist/signature interaction gate completion:** no. Both remain ungraded; neither writes progress nor is checked at completion time.

**Approved completion-card competency language** (replaces the current overclaiming sub-line):

> **Module complete.**
> You can evaluate a setup, prepare a station, and position a client correctly — and now know what to do if something's off. Next: the service itself.

This replaces "Your station is built. Your prep sequence is locked," which unconditionally asserted the ungraded checklist had been used and remembered. The new copy names the actual demonstrated competency (both checkpoints passed) without implying anything about the checklist.

**Module 8 unlock:** unchanged — `APP_STATE.canAccessModule(8)` still requires `isModuleComplete(7)` (both checkpoints passed).

**Review Mode:** unchanged — routes through the existing shared unsaved-test-submission path.

---

## Semantic design

Use the course's existing shared semantic tokens — no new styling system.

- **Correct/accepted:** existing green success styling, applied to correctly-identified setup mistakes and correctly-passed checkpoints.
- **Incorrect:** existing red/error styling, applied to missed or wrongly-flagged items in the signature interaction.
- **Caution:** the "watch for" safety callout in 7.4 uses the course's existing neutral/caution treatment (not alarm-red) — this is guidance, not an error state.
- **Neutral/informational:** the tool-category disclosure and prep-checklist default states.
- **Completion:** existing completion-card styling, unchanged structurally.

Meaning is never communicated by color alone anywhere in this module — every state above pairs color with a text label or glyph.

---

## Implementation acceptance criteria

Implementation is not complete until all of the following are verifiable:

1. Sections remain 7.1–7.4 with no renumbering; the signature interaction appears between 7.4 and `m7cp1`, matching the approved structure.
2. Hero eyebrow, title, and description are unchanged except for removal of the hard-coded `<br>`.
3. Section 7.1 is reorganized around the function-based bed-evaluation categories, with the armrest claim explicitly labeled a preference, not a requirement.
4. Section 7.2 gains the new "Arranging your cart" reach-zone content; no existing tool-category content is removed.
5. Section 7.3 gains the one-sentence build-sequence clarification; all ten checklist items' content is unchanged.
6. Section 7.4 gains the "why this matters" safety note and the "watch for / what to do" callout, both always visible, not gated behind any interaction.
7. `.cp-q`/`.body-text` displayed question and `M7.questions.m7cp1`/`m7cp2` are byte-identical for both checkpoints (verified programmatically, not by inspection).
8. `M7.systems.m7cp1` and `M7.systems.m7cp2` exist as separate rubrics; the single shared `M7.system` function no longer exists.
9. `submitM7CP` passes the approved 5th `errorMessage` argument.
10. Both checkpoint voice buttons carry `aria-label="Speak your answer"`; both submit buttons carry `aria-label="Send response to Cadence"`; both `.cp-response` regions carry `aria-live="polite"`.
11. `.tool-category` is a native, keyboard-focusable, Enter/Space-activatable control with `aria-expanded` state — verified by real keyboard activation, not just markup inspection.
12. `.prep-item` is a native, keyboard-operable control with correct checked-state semantics — verified by real keyboard activation.
13. `M7.system`/`MODULE_GUIDE_SYSTEMS[7]` no longer contain "HeadSpa Mastery" or the "nearly two decades" personal-experience claim.
14. Section 7.1's visible Cadence note no longer contains a first-person autobiographical claim.
15. The signature "Find the setup mistakes" interaction is implemented per its full specification (task, feedback, retry, accessibility, no persistence, no progress write, no completion gate).
16. Module 8 unlock behavior is unaffected (still requires both `m7cp1` and `m7cp2` passed).
17. The completion card no longer contains "Your prep sequence is locked" and instead uses the approved replacement copy.
18. Both checkpoints' immediate-correction triggers are verified to fire on at least one mocked unsafe/dismissive answer each.
19. No regression to Modules 0–6: reopening each confirms byte-identical content and unaffected checkpoint/progress state.
20. Mobile viewport (375×812) shows no horizontal overflow across the tool-category list, prep checklist, signature interaction, and the required Visual 3 positioning pair.
21. Review Mode continues to route Module 7 checkpoint test submissions through the existing unsaved test path.
22. None of the four original placeholder boxes remains in its original decorative-placeholder form.

### Required visual assets — implementation is not complete without these

23. Visual 3 (correct/incorrect side-view positioning pair) exists, uses the same client/bed/room for both images, and matches the full specification in "Visual asset plan" (framing, captions, alt text, non-medical tone). **Implementation may not advance to manual QA without this asset.**
24. Visual 1 (bed-setup photo) and Visual 2 (station/cart photo) exist and match their specifications. **Implementation may not advance to manual QA without these assets** — Section 7.1 and 7.3 currently ship with zero real imagery and this specification requires both be resolved before this module is considered implementation-complete, not merely "acceptable to ship placeholder-only" the way the initial extraction found them.
25. Visual 4 (optional top-view photo) and Visual 5 (optional reach-zone diagram) do not block manual QA if absent.

No implementation task may mark Module 7 "Implemented" while acceptance items 23–24 remain unmet.

---

## Implementation notes

- The "Find the setup mistakes" signature interaction is deliberately text/scenario-based rather than photo-based so that implementation is not blocked on new tray/cart photography — a photo-based version is a reasonable future upgrade once real assets exist, but is not required or specified here.
- The reach-zone framework added to Section 7.2 is general ergonomic principle, not head-spa-specific research — cited transparently as such in "Research and evidence sources," not overstated as domain-specific literature.
- The bed-armrest preference (correction #9) should not be silently strengthened back into an unqualified rule during implementation — the labeling as "a preference many practitioners share" is a deliberate audit decision, not an oversight to be "cleaned up."
- The BPSS-informed safety content in Section 7.4 is intentionally brief and non-alarmist, consistent with the governing principle that safety is a guardrail, not the module's dominant tone — implementation should not expand this into a longer disclaimer section.
- Do not begin Module 8 extraction, implementation, or any certificate/completion-flow work as a result of this specification. Implementation of this specification is a separate, later task, and is explicitly blocked from advancing to manual QA until the required visual assets (acceptance items 23–24) exist.
