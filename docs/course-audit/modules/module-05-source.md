# Module 5 — Source Extraction (Pre-Audit)

**Course:** AIMT Head Spa Certification Course
**Module:** 5 — student-facing title varies by surface (see §1)
**Status:** Extracted for external audit. Not audited, not approved, not implemented.
**Production source of truth:** `headspa-mastery.html`, `assets/js/headspa-state.js`
**Source commit at extraction time:** `b4ee09906d238c57119b9331b678e448e21408a6`
**Branch:** `course-audit-build`

This document is a neutral, verbatim record of the current Module 5 experience as it exists in production code today. It does not propose replacement curriculum, approved outcomes, final copy, or implementation instructions — see `module-05.md` for the (currently empty) external-audit scaffold. Nothing in this document has been implemented, corrected, or approved. No production file was modified to produce this extraction.

---

## 1. Module identity

| Field | Value | Source |
|---|---|---|
| Technical module number | `5` | `MODULE_CHECKPOINTS['5']`, `M5`, `module5Wrap`, `data-module-id="5"` |
| Student-facing title (home-screen row) | **Module 5 — Scalp Types & Protocols** | `headspa-mastery.html:2360` |
| Student-facing title (`MODULE_TITLES[5]`, used for the lesson nav-bar title) | **Module 5 — Scalp Types & Protocols** | `headspa-mastery.html:6118` |
| Dashboard subtitle (home-screen row) | **Neutral, oily, dry, combination, sensitive** | `headspa-mastery.html:2360` |
| Hero eyebrow | **Module 5 · Scalp Types & Treatment Protocols** | `headspa-mastery.html:2908` — note this reads "Treatment Protocols," not "Protocols" as in the home-row title and `MODULE_TITLES[5]`; see §9 for this inconsistency flagged, not resolved |
| Hero title | **What the scalp is telling you — and how to respond.** | `headspa-mastery.html:2909` |
| Hero description | "Module 5 builds directly on your assessment skills from Module 4. Now that you know how to look, this module teaches you what to do with what you see. Five scalp types. Five treatment approaches. No rigid formulas — just a clear framework you can adapt to every client." | `headspa-mastery.html:2910` |
| Wrapper ID | `module5Wrap` — standard hidden-template pattern (matches Module 4's pattern, not the Module-3-style default-capture outlier) | `headspa-mastery.html:2903` |
| JavaScript identifiers | `M5` (questions + shared `system` function), `submitM5CP(id)`, `m5cpKey(e,id)`, `window._m5cpsDone` | `headspa-mastery.html:6748, 7324, 7327, 7023` |
| Checkpoint IDs | `m5cp1`, `m5cp2` — standard `mNcpX` pattern | `headspa-mastery.html:3229, 3263`; `MODULE_CHECKPOINTS['5']` at `headspa-mastery.html:6086` |
| Completion-card ID | `m5Complete` | `headspa-mastery.html:3282` |
| Routing entry | `openModuleById(5)` (home row and Module 4's completion-card "Start Module 5 →" button); `STATIC_MODULES[5]` in `openModuleById()` copies `#module5Wrap`'s innerHTML into `.lesson-wrap` and resets `window._m5cpsDone = 0` | `headspa-mastery.html:2358, 3945, 7023` |
| Module 4 prerequisite | `APP_STATE.canAccessModule(5)` returns `isModuleComplete(4)` (both `m4cp1` and `m4cp2` passed) unless Course Review Mode is active | `assets/js/headspa-state.js:628–636` |
| Module 6 unlock | Module 5's completion card links to `openModuleById(6)`; `APP_STATE.canAccessModule(6)` requires `isModuleComplete(5)` (both `m5cp1` and `m5cp2` passed, no read-percentage minimum) | `headspa-mastery.html:3290`; `assets/js/headspa-state.js:628–636, 583–593` |
| Special-case behavior | None found. Module 5 uses the same generic `openModuleById`/`STATIC_MODULES`/`submitCheckpoint`/`restoreLessonState` machinery as every other standard-template module (0–2, 4, 6–11). It is **not** a structural outlier the way Module 3 is (no bare `cp1`/`cp2` IDs, no default-capture pattern). `window._m5cpsDone` is set to `0` on every module-5 open but **is never read anywhere else in the file** — it appears to be dead/vestigial state, unlike Module 4's analogous `window._m4cpsDone`/`_m4ClassifyAnswered`, which are actually used by that module's classification interaction. Module 5 has no interaction that would use a counter like this. | `headspa-mastery.html:7023` (grep for `_m5cpsDone` returns only this one assignment) |

---

## 2. Complete student-facing curriculum (verbatim, in student encounter order)

Reproduced exactly as it appears in `headspa-mastery.html:2903–3295` (the full `#module5Wrap` block). Wording is unedited; only structural/HTML scaffolding is summarized where it does not change what the student reads.

### Hero

> **Module 5 · Scalp Types & Treatment Protocols**
> **What the scalp is telling you — and how to respond.**
> Module 5 builds directly on your assessment skills from Module 4. Now that you know how to look, this module teaches you what to do with what you see. Five scalp types. Five treatment approaches. No rigid formulas — just a clear framework you can adapt to every client.

### Intro — "Before you treat, you have to decide"

> **Observation without action is incomplete.**
>
> By this point you've learned how to observe the scalp and recognize what a healthy environment looks like. Now comes the part that actually changes your service: deciding what to do with what you're seeing.
>
> Not every scalp behaves the same way. Your job is not to label. Your job is to recognize patterns, understand what matters most, and adjust your service accordingly. Because the difference between a relaxing service and a skilled one is this: your treatment changes based on what you see.

**Info card — "The reality most people miss":**

> Scalp analysis is rarely clean. Most clients will not fall into one category. You will see oil in one area, dryness in another, buildup sitting on top of a compromised barrier, and sensitivity layered over everything. If you treat the scalp as one uniform condition, you will overcorrect some areas, ignore others, and create new problems. Strong practitioners adjust within the service.

### Visual reference — "The five scalp types at a glance"

> Before reading through each type in depth, this reference gives you the pattern at a glance. You'll return to this visual instinctively once you've seen each type under the microscope enough times.

**Photo pair** (both placeholder graphics — see §7): "Oily Scalp — Microscopy" / "Visible sebum, shiny, congestion at follicles" and "Dry Scalp — Microscopy" / "Matte surface, fine flakes, minimal oil."

**Interaction hint text:** "↓ Tap each type to see the protocol" — see §3 for why this is misleading; the grid below is not tappable.

**Five-card scalp-type grid** (`.scalp-type-grid`, static, non-interactive despite the hint text above):

| Card | Look | Goal |
|---|---|---|
| Neutral | "Slight natural sheen. Soft pink underglow. Faint translucency at roots." | Preserve |
| Oily | "Shiny or greasy at follicles. Wet or slick roots. Possible yellowish tinge or waxy buildup." | Clarify & balance |
| Dry | "Matte surface. Little visible sebum. Fine white powdery flaking. Lacks reflective sheen." | Restore barrier |
| Combination | "Oily or congested in some zones. Dry or flaky in others. Read the whole scalp." | Balance both |
| Sensitive | "Larger areas of redness. Fragile barrier. Stinging, burning, itching, or tightness reported." | Soothe only |

### Scalp type 1 — "The neutral scalp"

Placeholder photo: "Neutral Scalp — Microscopy" / "Balanced sheen, clear follicles, soft pink tone."

> A neutral scalp is the ideal — not because it requires no attention, but because it has achieved equilibrium. The hydrolipid film is intact, sebum production is balanced, and the follicle environment is healthy. You'll see a slight natural reflection or sheen across the scalp surface. Not greasy, not dull — just quietly balanced.
>
> Three things to look for under the microscope: a slight natural sheen from the intact hydrolipid film, a soft pink underglow that indicates healthy circulation and adequate blood flow to the follicles, and a faint translucency through the upper skin layers meaning you can see the roots beneath — no heavy buildup blocking that clarity. If the scalp appears opaque or matte rather than clear, something is disrupting that translucency.

**Clinical note — "In practice":**

> Clients with a neutral scalp typically don't feel oily between washes and don't experience tightness or flaking. They may not even have a scalp concern — they're there for the experience. That's actually useful information. It tells you the service focus is relaxation and maintenance, not correction.

**Treatment protocol — neutral** (badge: "Preserve"; sub: "Preservation over correction"):

| Row | Value |
|---|---|
| Approach | Gentle, non-disruptive formulations. Support what's already working. |
| Exfoliation | Mild exfoliant occasionally if minor buildup is visible. Not routine. |
| If goal is relaxation | Soothing, hydrating treatments. No exfoliation needed. |
| If goal is vitality | Incorporate circulation-supporting products and massage techniques. |
| Key principle | You are maintaining, not fixing. Adjust to the client's goals, not a formula. |

### Scalp type 2 — "The oily scalp"

Placeholder photo: "Oily Scalp — Microscopy" / "Visible sebum, shiny, yellowish buildup at follicles."

> An oily scalp appears shiny or greasy around and within the hair follicles. In some cases sebum accumulates visibly at the follicle opening — small pools of oil sitting at the base of the hair shafts. The roots often look wet or slick, and the scalp may take on a slight yellowish tinge from excess sebum concentration.
>
> Left unaddressed, that excess oil mixes with dead skin cells and product residue to form what's called **follicular congestion** — a thicker, waxy yellowish buildup around and within the follicle. This is one of the most common things you'll see under the microscope on a client who washes infrequently or uses heavy products. If the congestion is significant enough to obstruct the follicle opening, it begins to compromise the environment needed for healthy hair growth.

**Key point:**

> **Ask about heat exposure.** Sebum production rises approximately 10% for every 1.8°F increase in temperature. A client who works in a kitchen, exercises daily, or spends hours outdoors in warm weather will have structurally higher oil production. This isn't a hygiene issue — it's physiology. Understanding their environment changes how you recommend home care.

> Other common causes: diet high in fried, spicy, or sugary foods can stimulate the sebaceous glands through hormonal fluctuations and systemic inflammation. Hormonal changes — particularly postpartum shifts or other imbalances — can also suddenly increase oil production in someone who previously had a normal scalp.

**Treatment protocol — oily** (badge: "Clarify"; sub: "Clarify without over-stripping"):

| Row | Value |
|---|---|
| Key ingredients | Salicylic acid, zinc, or clay-based formulations to manage sebum production. |
| Cleansing | Regular shampooing with oil-controlling but not harsh surfactants. |
| Exfoliation | Occasional scalp exfoliation to break down waxy follicular congestion. |
| Steam | Steam treatments can help soften and loosen buildup before cleansing. |
| Caution | Over-stripping triggers the sebaceous gland to produce more oil as compensation. Gentle is still the word — even here. |

### Scalp type 3 — "The dry scalp"

Placeholder photo: "Dry Scalp — Microscopy" / "Matte surface, fine white flakes, depleted barrier."

> A dry scalp appears more matte and lacks the reflective quality of a neutral scalp — because the hydrolipid film that produces that sheen is depleted or compromised. About 60 to 90 percent of follicles will show no visible sebum under the microscope. There may also be flaking — fine, white, powdery flakes that shed as dry dead skin cells accumulate on the surface. Clients with dry scalps often won't feel greasy even after two to three days without washing.
>
> Common causes include aging (sebaceous gland activity naturally decreases over time), seasonal changes particularly in colder or drier weather, and chemical processes like perming or color treatments that strip the moisture barrier. Over-cleansing and harsh products are among the most common and most correctable causes — a client washing daily with a sulfate-heavy shampoo may simply be undoing their own barrier every time they shower.

**Cadence note:**

> "Gentle exfoliation for a dry scalp sounds counterintuitive — but it's often necessary. You have to lift away the buildup of dead cells before hydrating products can actually penetrate. The mistake is using anything too aggressive. The goal is creating a clean surface for moisture to absorb into, not stripping what little barrier is left."

> For home care recommendations: a gentle, moisturizing cleanser every two to three days. Avoid over-washing and high heat directed at the scalp. Foods rich in omega-3 fatty acids — fish, flaxseeds, walnuts — support internal hydration. Vitamins E and A are relevant for barrier health.

**Treatment protocol — dry** (badge: "Restore"; sub: "Restore the hydrolipid barrier"):

| Row | Value |
|---|---|
| First step | Gentle exfoliation to lift dead cell buildup — only if scalp is not also sensitive. |
| Treatment | Hydrating, barrier-repairing treatments after exfoliation. Seal moisture in. |
| Ingredients | Hyaluronic acid, ceramides, plant oils, panthenol — anything that repairs and retains moisture. |
| Home care | Gentle moisturizing cleanser every 2–3 days. Minimize heat styling at the scalp. |
| Ultimate goal | Repair and restore the hydrolipid film so the scalp can hold onto its own moisture long-term. |

### Scalp type 4 — "The combination scalp"

Photo pair: "Combination — Crown Zone" / "Oily or congested at crown" and "Combination — Hairline Zone" / "Dry or flaky at sides and hairline."

> A combination scalp is one of the most commonly misread presentations — precisely because you have to resist the instinct to categorize it based on the first thing you notice. A client may appear oily at the crown or roots while the hairline or sides appear dry and flaky. In some cases, excess sebum is present overall but the surface skin is still dehydrated because the hydrolipid barrier has been compromised — meaning oiliness and dryness can genuinely coexist.
>
> The mistake is treating the entire scalp as one type. If you see oiliness and treat accordingly — clarifying shampoo, oil-controlling products across the board — you may dehydrate the areas that were already dry and make the problem worse. Assess the scalp as a whole. Document what you're seeing in each region. Build a treatment that addresses both concerns intentionally.

**Clinical note — "Common pattern to watch for":**

> Combination scalps are often created by product behavior — a client who uses a heavy leave-in conditioner at the ends but a dry shampoo at the roots, or who over-cleanses the top but neglects the sides. Asking about their routine usually reveals the cause faster than the microscope alone.

**Treatment protocol — combination** (badge: "Balance"; sub: "Adaptive — address both without overcorrecting"):

| Row | Value |
|---|---|
| Exfoliation | Gentle exfoliation where buildup is visible. Avoid aggressive application over dry or sensitive areas. |
| Cleanser | Mild, balancing cleanser — removes excess oil without stripping moisture. Avoid harsh degreasers. |
| During treatment | Soothing massage for circulation. Lightweight scalp treatments that support the hydrolipid barrier. |
| Home care | Consistent cleansing routine — regular but not excessive. Balancing shampoos only. |
| Mindset | The goal is to normalize scalp function over time — not force immediate oil removal or aggressive hydration. |

### Scalp type 5 — "The sensitive scalp"

Placeholder photo: "Sensitive Scalp — Microscopy" / "Redness, fragile barrier, reactive areas."

> A sensitive scalp often presents as larger areas of visible redness and a thinner, more fragile skin barrier. Clients may report stinging, burning, itching, or tightness — sensations that arise during or after product use, heat exposure, or even gentle manipulation. Importantly, sensitivity can occur on any scalp type — an oily scalp can also be sensitive, and a dry scalp almost always is to some degree.
>
> Redness on a sensitive scalp is not always the same thing. Some redness reflects chronic sensitivity or barrier damage. Some is triggered by a recent stressor, lack of sleep, or a product reaction. Bacterial overgrowth on a compromised scalp can present as inflamed areas with small visible red dots. Your job is not to diagnose the cause — but to recognize that a reactive scalp needs a very different approach than a stable one.

**Key point:**

> **When in doubt, do less.** A sensitive scalp that is over-stimulated, over-treated, or exposed to harsh products or excessive heat can spiral quickly. The conservative approach is always the right one here. If you're uncertain about the degree of sensitivity, adjust the service to be gentler before proceeding — not after you've already caused a reaction.

**Treatment protocol — sensitive** (badge: "Soothe"; sub: "Soothe. Do not stimulate."):

| Row | Value |
|---|---|
| Primary rule | Minimize stimulation. No aggressive massage, exfoliation, heat, or strong actives. |
| Products | Fragrance-free, minimal-ingredient formulations. Botanical calming agents like chamomile and licorice root. |
| Massage | Gentle, slow, and limited. Watch for any change in redness during the service. |
| Temperature | Cooler water. Avoid hot rinsing. Avoid steam on highly reactive scalps. |
| If unsure | Default to the most conservative approach. You can always add — you can't undo a reaction. |

### "Priority matters more than category" — "What matters most right now?"

> Identifying the scalp type is not enough. When multiple concerns are present — and they usually are — you have to decide what to address first. Use this priority order in real time.

**Four-step priority timeline** (see §7 for the color-token finding on these dots):

1. **Sensitivity / inflammation — first** (`pd-3`, red): "If the scalp is reactive, reduce stimulation before anything else. Sensitivity overrides every other concern."
2. **Barrier condition — second** (`pd-2`, amber): "If the scalp is dry or compromised, avoid stripping it further. Don't address buildup at the cost of what little barrier remains."
3. **Buildup and congestion — third** (`pd-4`, accent/gold): "Address once the scalp can tolerate it. Exfoliation and clarifying work belong here — after inflammation and barrier are accounted for."
4. **Oil control — last** (`pd-1`, green): "Oil is often a response, not the root problem. If you ignore the order above, you can choose the 'right' product and still get the wrong result."

**Info card — "Real-world decision training":**

> **Scenario 1 — flakes, shine, slight redness:** Weak approach: treat dryness. Stronger approach: mixed presentation — reduce irritation first, gently clear buildup, avoid overcorrection.
>
> **Scenario 2 — heavy oil, visible buildup, no redness:** Approach: clarify and reset. Support consistent cleansing.
>
> **Scenario 3 — redness, sensitivity, minimal buildup:** Approach: reduce stimulation, avoid aggressive treatment, focus on calming. Two people can look at the same scalp and make completely different decisions. The difference is not knowledge — it's interpretation.

### Checkpoint 1 (`m5cp1`) — "Check your understanding"

See §4 for full checkpoint detail. Displayed question, placed here in encounter order:

> "A client sits down and you see oiliness at the crown with what looks like waxy buildup around the follicles — but as you assess the sides and hairline you notice flaking and a more matte appearance. How do you approach this service, and what's the mistake you're specifically trying to avoid?"

### Recap — "Scalp analysis should always guide treatment"

> The five scalp types covered in this module each have their own visual cues, underlying causes, and treatment priorities. Neutral scalps need preservation. Oily scalps need clarification without over-stripping. Dry scalps need gentle exfoliation followed by barrier repair. Combination scalps need adaptive approaches that address both concerns without overcorrecting. Sensitive scalps need restraint above everything else.
>
> The pattern that runs through all of them is this: accurate identification changes the service. Not the technique — the intention behind it. The more precisely you read what the scalp is communicating, the more intentional, effective, and professional every service becomes.

**Cadence note:**

> "The most common mistake I see is treating the scalp you expected to see rather than the one in front of you. Dandruff is driven by excess oil — Malassezia yeast feeds on sebum, so an oily scalp environment is usually underneath it. But a client who says they have 'dandruff' may have misidentified their own condition entirely and actually have a dry scalp. Those two things require opposite approaches. A client who looks oily at the crown may be dry everywhere else. Every appointment is a fresh assessment. This module is about building the observational instinct that makes that possible."

### Checkpoint 2 (`m5cp2`) — "Final check"

See §4 for full checkpoint detail. Displayed question, placed here in encounter order:

> "A client comes in, you complete your assessment, and you determine it's a sensitive scalp. But she's asking for a full deep-cleanse and exfoliation treatment — 'the works.' How do you handle that conversation while keeping the client happy and doing right by her scalp?"

### Completion card (`m5Complete`)

> **Module complete.**
> You can identify patterns and match them to protocols. That's the foundation of every good service decision.
>
> **Up next — Module 6**
> Now you need to understand the specific conditions your clients will actually come in with and ask you about. Dandruff, seborrheic dermatitis, Malassezia — the ones that get misread most often and mishandled most consistently.
>
> [Start Module 6 →] [Back to course]

---

## 3. Existing learning interactions

Module 5 has **no genuinely interactive learning component** beyond its two required checkpoints. Everything else is static instructional content, laid out sequentially, with no student input, toggle, or state change.

### "Tap each type to see the protocol" hint (decorative claim, no actual interaction)

- **What the student sees:** the interaction-hint line `↓ Tap each type to see the protocol` immediately above the five-card scalp-type grid.
- **What the student must do:** nothing — the five cards (`.scalp-card`) have no `onclick`, no `tabindex`, no button/link semantics, and no JS event listener anywhere in the file targets `.scalp-card`. Confirmed by grepping the full file for `scalp-card` and for any click handler referencing it: none exists.
- **Judgment vs. decorative:** the hint text implies a tap-to-reveal interaction that does not exist in the code. The "protocols" it refers to are simply the next five sections of static content the student scrolls to normally. This is a genuine content/behavior mismatch, not a design choice — flagged in §13 as Confirmed.
- **Feedback/reset/retry:** none — there is nothing to interact with.
- **Progress write:** none.
- **Gates completion:** no.
- **Accessibility:** N/A (static text and static cards).
- **Mobile behavior:** the grid uses `.scalp-type-grid` (not inspected further since there is no interactive behavior to verify at any viewport).
- **Related functions/state:** none. No JS function is associated with `.scalp-card` or `.scalp-type-grid`.

### Checkpoints `m5cp1` and `m5cp2`

These are the only elements in Module 5 that accept student input, write progress, or gate completion. Full detail in §4 (Checkpoints and grading) since the task's checkpoint fields overlap heavily with the interaction fields. Summary here for completeness:

- **What the student sees:** an open-response prompt, a growable textarea, a voice-input button, a submit button, and a feedback region.
- **What the student must do:** type or speak a free-text answer and submit it for AI evaluation.
- **Judgment vs. decorative:** genuine judgment — each question requires synthesizing scalp-type recognition with a service decision.
- **Feedback behavior:** AI-generated pass/fail feedback rendered into `#m5cp1Res`/`#m5cp2Res`; on fail, the input re-enables and the button relabels "Retry."
- **Reset/retry:** unlimited retries on a "Needs revision" (`retry`) result; once passed, the input and button are permanently disabled for that student (`applyCheckpointInputState`).
- **Progress write:** yes — `APP_STATE.setCheckpointResult(5, cpId, {...})` on every submission; `captureCheckpointMemory(5, cpId)` on pass (see §5 for the resulting memory tags).
- **Gates completion:** yes — both `m5cp1` and `m5cp2` must be `passed` for `isModuleComplete(5)` to return true (no read-percentage minimum).
- **Accessibility:** see §10 — confirmed missing `aria-label` on both voice buttons and both submit buttons, and missing `aria-live` on both `.cp-res` feedback regions, unlike the already-corrected Modules 0, 1, and 4.
- **Mobile behavior:** shares the generic `.checkpoint`/`.cp-input`/`.cp-btn` styling used everywhere else in the file; nothing module-5-specific was found that would change mobile behavior.
- **Related functions/state:** `submitM5CP(id)` → `submitCheckpoint(5, id, M5.system, M5.questions[id])` (note: no 5th `errorMessage` argument — see §4); `m5cpKey(e,id)` (Enter submits, Shift+Enter default newline); `evaluateCheckpointAnswer()`; `APP_STATE.setCheckpointResult`/`captureCheckpointMemory`/`_checkModuleComplete`; `restoreLessonState(5)` on module (re)open.

---

## 4. Checkpoints and grading

### `m5cp1`

- **Displayed question** (`.cp-q`, `headspa-mastery.html:3234`):
  > "A client sits down and you see oiliness at the crown with what looks like waxy buildup around the follicles — but as you assess the sides and hairline you notice flaking and a more matte appearance. How do you approach this service, and what's the mistake you're specifically trying to avoid?"
- **Question sent to the evaluator** (`M5.questions.m5cp1`, `headspa-mastery.html:6750`):
  > "A client has oiliness and waxy buildup at the crown but flaking and matte appearance at the sides and hairline. How do you approach this service, and what mistake are you specifically trying to avoid?"
- **Byte-identical?** **No — confirmed mismatch.** The displayed and evaluated strings differ in wording throughout (e.g., "A client sits down and you see..." vs. "A client has...", "what's the mistake you're specifically trying to avoid?" vs. "what mistake are you specifically trying to avoid?"). This is the same class of defect already identified and corrected in Modules 1, 2, and 3 before their implementation passes, and in Module 4 (Step 23). Module 5 has not yet received this correction.

### `m5cp2`

- **Displayed question** (`.cp-q`, `headspa-mastery.html:3268`):
  > "A client comes in, you complete your assessment, and you determine it's a sensitive scalp. But she's asking for a full deep-cleanse and exfoliation treatment — 'the works.' How do you handle that conversation while keeping the client happy and doing right by her scalp?"
- **Question sent to the evaluator** (`M5.questions.m5cp2`, `headspa-mastery.html:6751`):
  > "You assess a sensitive scalp but the client is asking for a full deep-cleanse and exfoliation treatment. How do you handle that conversation?"
- **Byte-identical?** **No — confirmed mismatch.** The evaluator string is a materially shorter paraphrase; it drops "you complete your assessment," "keeping the client happy," and "doing right by her scalp" entirely.

### Evaluator system / rubric

Module 5 uses **one shared function for both checkpoints** — `M5.system(q)` — not checkpoint-specific rubrics:

> "You are Cadence, instructor of HeadSpa Mastery. Module 5 (Scalp Types & Protocols) checkpoint. Question: '\{q\}'. Key concepts: Five types: neutral (preserve), oily (clarify without over-stripping), dry (restore barrier), combination (adaptive — address both zones), sensitive (soothe only). Combination scalp is misread by treating dominant feature only. Over-stripping oily scalp triggers compensatory oil production. Sensitive scalp: when unsure, do less. Client education is part of the job. 3-5 sentences, direct and warm, no bullet points."

This is passed into the shared `submitCheckpoint()`/`evaluateCheckpointAnswer()` pipeline, which appends `CADENCE_RESPONSE_CONSISTENCY_ANCHOR`, `CADENCE_SELECTIVE_MEMORY_INSTRUCTION`, `APP_STATE.getCadenceMemoryContext(5,'checkpoint')`, `CADENCE_CHECKPOINT_TONE`, `CADENCE_FEEDBACK_MICRO_RULES`, and `CHECKPOINT_EVAL_FORMAT` (the `{"pass":true|false,"feedback":"..."}` JSON contract) before the call. This part of the pipeline is shared code, identical to every other module, and was not modified for this extraction.

- **Required concepts (as written into the shared rubric, not itemized per checkpoint):** the five scalp-type labels and their one-word goals; that combination scalp is misread by treating only the dominant feature; that over-stripping an oily scalp "triggers compensatory oil production" (see §8 — this is the same unsupported rebound-oil claim that Module 4's audit explicitly required removing); that a sensitive scalp calls for doing less when unsure; that client education is part of the job.
- **Checkpoint-specific vs. shared grading behavior:** **fully shared.** Unlike Modules 1, 2, 3, and 4 after their respective implementation passes (each of which moved to a `MN.systems.mNcpX` structure with a rubric, immediate-correction list, and revision-focus examples specific to each checkpoint), Module 5 still uses the single-function-for-all-checkpoints pattern that those modules had **before** their corrections. `m5cp1` (a pattern-reading/mistake-avoidance question) and `m5cp2` (a client-communication/negotiation question) are evaluated against the exact same generic rubric text with no checkpoint-specific required elements, immediate-correction triggers, or revision-focus guidance.
- **Completion dependency:** both `m5cp1` and `m5cp2` must reach `status: 'passed'` for `_checkModuleComplete(5)`/`isModuleComplete(5)` to return true. No read-percentage minimum. `m5cp1` does not lock the rest of the lesson (the recap, Cadence note, and `m5cp2` all remain visible and scrollable regardless of `m5cp1`'s status) — same non-locking behavior already established for every other module's midpoint checkpoint.
- **Voice-button behavior:** `startVoice('m5cp1In', this)` / `startVoice('m5cp2In', this)` — the shared voice-input function used by every checkpoint in the file; not module-5-specific. Its accessible-name gap is noted in §10.
- **Enter/Shift+Enter behavior:** `m5cpKey(e, id)` — Enter without Shift submits (`submitM5CP(id)`); Shift+Enter is not intercepted, so the textarea's default newline behavior applies. This matches the behavior of every other module's `cpKey`-style handler.
- **Feedback and live-region behavior:** feedback is rendered into `#m5cp1Res`/`#m5cp2Res` via the shared `submitCheckpoint()` pipeline. **Neither `.cp-res` element carries `aria-live="polite"`** — confirmed absent by direct inspection of `headspa-mastery.html:3244` and `3278`, in contrast to `cp1Res`/`cp2Res` (Module 3), `m0cp1Res`, `m1cp1Res`/`m1cp2Res`, and `m4cp1Res`/`m4cp2Res`, which all carry it. See §10.
- **Saved progress behavior:** identical to every other module — `APP_STATE.setCheckpointResult(5, cpId, {passed, feedback, answer})` on every submission (pass or fail); `captureCheckpointMemory(5, cpId)` only on pass, which derives memory tags and a summary sentence (see §5); `restoreLessonState(5)` re-applies the stored `passed`/`retry` status, disables the input/button appropriately, and re-renders the stored feedback (or a generic "Checkpoint completed in a previous session." string if no feedback text was stored) when the student reopens the module.

### `submitM5CP` error-message parameter

`submitM5CP(id)` calls `submitCheckpoint(5, id, M5.system, M5.questions[id])` — **four arguments, no 5th `errorMessage` argument.** `submitCheckpoint()`'s optional 5th parameter (added during the Welcome Module work specifically so each module could show its own network-failure text) is not supplied for Module 5, so a network/API failure on either checkpoint falls back to the shared generic text: *"Cadence didn't respond — check your connection and try again."* This is the same "not yet given a module-specific error message" state Modules 0–4 were all in before their own implementation passes.

---

## 5. Cadence

- **Module 5 checkpoint identity:** `M5.system` — see §4 for the full string. Refers to itself as "Cadence, instructor of HeadSpa Mastery."
- **Guide system** (`MODULE_GUIDE_SYSTEMS[5]`, `headspa-mastery.html:6811`):
  > "You are Cadence — a mentor built from nearly two decades in the head spa industry. The student is in Module 5 (Scalp Types & Protocols): neutral, oily, dry, combination, sensitive. Match treatment to condition. If the student has product knowledge from salon or esthetics work, acknowledge how it applies specifically to scalp protocol selection in a head spa context. Combination scalp is the most commonly misread — emphasize that. 3-5 sentences. No bullet points."
- **Quick prompts** (`MODULE_QUICK_PROMPTS[5]`, `headspa-mastery.html:6826`):
  1. "How do I identify combination scalp?"
  2. "What causes compensatory oil production?"
  3. "How do I redirect a client who wants the wrong treatment?"
- **Module-opening greeting** (`greetings[5]` inside `openModuleById()`, `headspa-mastery.html:7065`):
  > "Scalp types is where assessment becomes action. If Module 4 taught you how to look, Module 5 teaches you what to do with what you see."
- **Memory tags:** `MODULE_MEMORY_TAGS[5] = ['protocol-matching', 'barrier-thinking', 'client-guidance']` (`assets/js/headspa-state.js:137`). `getCheckpointMemoryTags(5, answer)` (`assets/js/headspa-state.js:323–326`) additionally derives, from the student's own passed-checkpoint answer text: `protocol-matching` if the answer matches `/\b(combination|both zones|adapt|different areas)\b/i`; `barrier-thinking` if it matches `/\b(barrier|over-strip|sensitive|do less)\b/i`; `client-guidance` if it matches `/\b(educate|tell the client|explain|handle that conversation)\b/i` (or, as a fallback shared by every module, if the answer simply contains the word "client"). `getCheckpointMemorySummary()` turns these tags into one of the fixed summary sentences (e.g., `protocol-matching` → "Matched protocol decisions to what the scalp actually needed rather than treating the loudest symptom.").
- **References to the old course name:** **yes, confirmed.** `M5.system` opens with "You are Cadence, instructor of **HeadSpa Mastery**" — the old course name that Modules 0, 1, 2, and 4's checkpoint/guide prompts have already had removed per the approved "Head Spa Certification Course" rename (`00-global-decisions.md`, "Course name"). This appears in an AI system prompt (never rendered as UI copy), same category of string as the Module 0–3 instances already corrected.
- **Any claim that Cadence has personal human experience:** **yes, confirmed, in two places.** `MODULE_GUIDE_SYSTEMS[5]` opens "You are Cadence — **a mentor built from nearly two decades in the head spa industry**" — phrased as Cadence's own personal professional history, not the instructor's. This is the exact pattern Modules 0, 1, 2, and 4's `MODULE_GUIDE_SYSTEMS` entries were rewritten to avoid ("Your guidance was built from the instructor's nearly two decades of applied experience; you do not claim that experience as your own or present yourself as a human practitioner"). `M5.system`'s "instructor of HeadSpa Mastery" framing is a milder version of the same issue — it does not explicitly disclaim personal experience the way the corrected modules' checkpoint prompts do.
- **Any content inconsistency between the curriculum and Cadence guidance:** yes — see §8 for the "compensatory oil production" claim, which appears in the curriculum body text (§2, Oily scalp section), in `M5.system`'s rubric, and as a standalone Module 5 quick prompt ("What causes compensatory oil production?") — meaning the unsupported physiological claim is reinforced in three separate places a future audit would need to touch consistently, not just one.
- **Duplicated or conflicting prompt sources:** none found for Module 5 specifically. Unlike Module 3 (which had two different, inconsistent quick-prompt sets before its correction), Module 5 has exactly one `MODULE_QUICK_PROMPTS[5]` array and no hardcoded duplicate set in the static HTML.

---

## 6. Completion and progression

- **Exact completion requirement:** `m5cp1` and `m5cp2` both graded `passed` (`MODULE_CHECKPOINTS['5'] = ['m5cp1','m5cp2']`; `_hasAllRequiredCheckpoints(5)` requires every listed ID to have `status === 'passed'`). No read-percentage/`maxReadPercent` minimum is checked anywhere in the completion path.
- **Completion-card copy:** see §2 for the full verbatim text (`#m5Complete`). Title: "Module complete." Sub: "You can identify patterns and match them to protocols. That's the foundation of every good service decision." Next-module label: "Up next — Module 6," with next-module preview text and a "Start Module 6 →" primary button plus a "Back to course" secondary button.
- **Competency language:** the completion card names a general capability ("identify patterns and match them to protocols") but, unlike Module 4's completion card (which lists four specific demonstrated competencies as a distinct line), Module 5's card does not have a separate itemized competency-naming line — the one sentence in `.lc-sub` is the entire competency statement.
- **Module 6 unlock behavior:** the completion card's primary button calls `openModuleById(6)` directly; independently, `APP_STATE.canAccessModule(6)` (used for the home-screen module list and any direct navigation) requires `isModuleComplete(5)`, which in turn requires both checkpoints passed — so the two unlock paths are consistent with each other.
- **Persistence behavior:** identical to every other module — `APP_STATE.save()` is the sole write choke point; `checkpointMeta`, `checkpoints[]`, `complete`, and `completedAt` are stored per-module in `localStorage['levo_app']` (or skipped entirely while Course Review Mode is active, per the existing Review Mode guard — unmodified and unaffected by anything in this extraction).
- **Review Mode behavior:** Module 5's checkpoints route through the same `submitCheckpoint()` → `submitCheckpointReviewMode()` branch as every other module when `window.ReviewMode.isActive()` is true — test submissions reuse the real question and `M5.system` rubric, are labeled "Review Mode test — not saved," and never call `setCheckpointResult`/`captureCheckpointMemory`/`_checkModuleComplete`. Nothing module-5-specific overrides this.
- **Mismatch between visible completion and stored state:** none found. `restoreLessonState(5)` reconciles `#m5cp1Res`/`#m5cp2Res` display, input/button disabled state, and the "Accepted"/"Needs revision" status pill against the stored `checkpointMeta` on every module open, using the same shared logic every other module uses.

---

## 7. Assets and downloadables

**Module 5 currently contains zero real media assets.** Every "photo" slot in the module (§2) renders `.clinical-photo.placeholder` — a dashed-border box (`border: 1.5px dashed #cdc8bc`) containing a generic decorative camera/crop SVG icon (`.cp-placeholder-icon`, 32×32px, 35% opacity) and a small caps-lock label (`.cp-placeholder-label`), sometimes with a secondary sub-label (`.cp-placeholder-sub`). There is no `<img>` tag, no `background-image`, and no reference to any file under `assets/images/` anywhere inside `#module5Wrap`. This is confirmed by (a) direct reading of the full block and (b) grepping the file for `.clinical-photo img` styling, which exists as a CSS rule (proving the component *can* render a real photo) but is never actually used inside Module 5's markup.

Full inventory of placeholder slots (all illustrative-only, decorative, none authenticated or real):

| # | Placement | Label | Sub-label |
|---|---|---|---|
| 1 | Visual-reference photo pair, left | "Oily Scalp — Microscopy" | "Visible sebum, shiny, congestion at follicles" (caption below the box, not inside it) |
| 2 | Visual-reference photo pair, right | "Dry Scalp — Microscopy" | "Matte surface, fine flakes, minimal oil" (caption below the box) |
| 3 | Scalp type 1 (Neutral) | "Neutral Scalp — Microscopy" | "Balanced sheen, clear follicles, soft pink tone" |
| 4 | Scalp type 2 (Oily) | "Oily Scalp — Microscopy" | "Visible sebum, shiny, yellowish buildup at follicles" |
| 5 | Scalp type 3 (Dry) | "Dry Scalp — Microscopy" | "Matte surface, fine white flakes, depleted barrier" |
| 6 | Scalp type 4 (Combination), left | "Combination — Crown Zone" | "Oily or congested at crown" (caption below) |
| 7 | Scalp type 4 (Combination), right | "Combination — Hairline Zone" | "Dry or flaky at sides and hairline" (caption below) |
| 8 | Scalp type 5 (Sensitive) | "Sensitive Scalp — Microscopy" | "Redness, fragile barrier, reactive areas" |

- **Inline SVGs:** only the generic placeholder camera-icon SVG reused identically across all eight slots (same `<svg>` markup each time — not eight distinct icons).
- **Video blocks:** none.
- **Downloadable resources:** none.
- **Broken or missing references:** none — there is nothing to be "missing," since no image path is referenced at all; the placeholders are intentional CSS/SVG constructs, not broken `<img src>` links.
- **File formats / dimensions:** N/A — no image files exist for Module 5.
- **Alt text and captions:** N/A for alt text (no `<img>` elements exist to carry it). Visible captions exist as plain text (`.cp-placeholder-label`, `.cp-placeholder-sub`, `.photo-pair-label`) and are readable by assistive technology as ordinary text content, not as image alternatives.
- **Illustrative / authenticated / unverified / decorative:** every slot is purely decorative placeholder scaffolding — none is illustrative-of-content the way Module 4's labeled microscopy images are (Module 4's images are actual generated illustrations with a "not a clinical diagnosis" disclaimer; Module 5 currently has no image content at all behind its labels, real or generated).

Because there are no actual image, diagram, video, or downloadable assets currently in Module 5 to inventory beyond this placeholder-scaffold description, a separate `module-05-assets.md` file was **not** created for this extraction, per the task's instruction not to create an empty asset file. If real Module 5 imagery is produced during a future audit (mirroring the Module 3/Module 4 asset-intake steps in `implementation-log.md`), that would be the point to create `module-05-assets.md`.

---

## 8. Claims and technical-content inventory

Verbatim wording is quoted; classification follows the task's three-way split (module claim / code implication / uncertain-external-review).

### Scalp types generally

- **What the module explicitly claims:** "Not every scalp behaves the same way... your treatment changes based on what you see" (intro); the five-type framework (Neutral/Oily/Dry/Combination/Sensitive) is presented as the operative classification system for the entire module, each with a fixed "Goal" (Preserve/Clarify & balance/Restore barrier/Balance both/Soothe only).
- **What the code implies:** the five-card grid (§2, §3) visually presents these as five discrete, tappable categories (via the "Tap each type" hint), even though the module's own body text elsewhere argues "most clients will not fall into one category" — an internal tension between the grid's presentation and the surrounding prose's caveat.
- **Uncertain / requires external review:** whether presenting five named "types" (as opposed to Module 4's "appearance examples" framing, which was explicitly adopted specifically to avoid teaching mutually-exclusive scalp "types" — see `module-04.md` §"Replace the five 'scalp types' with observation language") is consistent with the corrected Module 4 approach, or represents unresolved terminology drift between the two adjacent modules. Flagged, not resolved, here — see §9.

### Oil production / "compensatory" oil production

- **What the module explicitly claims:** "Over-stripping triggers the sebaceous gland to produce more oil as compensation. Gentle is still the word — even here." (Oily protocol card, "Caution" row.)
- **What the code implies:** this same claim is repeated as a fixed rubric fact in `M5.system` ("Over-stripping oily scalp triggers compensatory oil production") and surfaced to the student directly as a Module 5 quick prompt ("What causes compensatory oil production?") — so the claim is reinforced in curriculum body text, AI grading rubric, and a student-facing suggested question, all three treating it as settled fact.
- **Uncertain / requires external review — flagged explicitly, not corrected here:** Module 4's approved audit spec (`module-04.md`, "Required corrections" §7, "Remove unsupported rebound-oil certainty") already required removing this exact claim from Module 4, stating: "Remove the claim that over-stripping automatically causes sebaceous glands to produce more oil as compensation... Do not teach rebound sebum production as a guaranteed physiological response." Module 5 currently contains the same claim Module 4 was explicitly told to remove, presented with equal certainty and no hedging. This is a direct, confirmed content overlap/contradiction between an already-corrected module and an unaudited one — see §9.

### Barrier function / dehydration

- **What the module explicitly claims:** "the hydrolipid film that produces that sheen is depleted or compromised" (dry scalp); "the surface skin is still dehydrated because the hydrolipid barrier has been compromised" (combination scalp); repair language throughout the dry-scalp protocol ("Repair and restore the hydrolipid film").
- **What the code implies:** barrier condition is treated as directly diagnosable from microscopy appearance alone ("About 60 to 90 percent of follicles will show no visible sebum under the microscope" as a defining dry-scalp criterion).
- **Uncertain / requires external review:** whether stating a specific percentage range ("60 to 90 percent") as a diagnostic visual criterion is accurate/supportable, or an invented-sounding precision that should be softened — flagged, not resolved.

### Sensitivity / inflammation

- **What the module explicitly claims:** "Bacterial overgrowth on a compromised scalp can present as inflamed areas with small visible red dots." "Your job is not to diagnose the cause — but to recognize that a reactive scalp needs a very different approach than a stable one." "When in doubt, do less."
- **What the code implies:** the module does explicitly disclaim diagnosis in this one paragraph ("Your job is not to diagnose the cause"), which is a stronger scope-awareness statement than exists elsewhere in the module — the sensitive-scalp section is comparatively more careful about this than the oily/dry sections.
- **Uncertain / requires external review:** whether naming "bacterial overgrowth" as a specific possible cause (even while disclaiming diagnosis) crosses into suggesting a medical mechanism the practitioner isn't positioned to identify — flagged for review, consistent with Module 4's approved caution around not letting a cosmetic observation imply a specific medical cause.

### Dandruff / detoxification / follicular congestion

- **What the module explicitly claims:** "Left unaddressed, that excess oil mixes with dead skin cells and product residue to form what's called **follicular congestion**... If the congestion is significant enough to obstruct the follicle opening, it begins to compromise the environment needed for healthy hair growth." (Oily scalp section.) The Cadence recap note also states as fact: "Dandruff is driven by excess oil — Malassezia yeast feeds on sebum, so an oily scalp environment is usually underneath it."
- **What the code implies:** "follicular congestion" is taught as an established, nameable mechanism with a causal link to compromised "healthy hair growth" — i.e., a hair-growth outcome claim tied to a cosmetic observation.
- **Uncertain / requires external review:** Module 4's approved spec explicitly instructs (§"Resolve 'Oily / congested' versus 'Congested'"): "Do not use `congestion` as though it were a diagnosis or proven follicular obstruction. Do not say a follicle is `clogged` from appearance alone." Module 5 currently teaches follicular congestion/obstruction as a definite mechanism with a hair-growth consequence, which is the same category of claim Module 4 was specifically corrected to avoid. This is a second confirmed direct overlap with an already-corrected Module 4 requirement (alongside compensatory oil production above) — flagged for the eventual Module 5 audit, not resolved here.

### Hair growth

- **What the module explicitly claims:** "it begins to compromise the environment needed for healthy hair growth" (oily/congestion section) is the only explicit hair-growth linkage found in Module 5.
- **Uncertain / requires external review:** whether any hair-growth claim belongs in Module 5 at all, consistent with Module 3's approved correction removing unsupported hair-growth/circulation claims, and Module 1's approved correction removing hair-growth claims from service-outcome language.

### Diagnosis / treatment / cure / universal protocol rules / contraindications / referral

- **What the module explicitly claims:** no explicit diagnosis language ("this is X condition") is used — the module stays in descriptive/protocol language throughout. No explicit contraindication or "stop and refer" section exists anywhere in Module 5 (contrast with Module 4's dedicated §4.8 "When not to proceed," and Module 1's referral-language sections).
- **What the code implies:** the module's only safety-adjacent framing is the sensitive-scalp "when in doubt, do less" key point and the priority-order section's "sensitivity overrides every other concern" — there is no explicit guidance anywhere in Module 5 about when a finding is outside cosmetic scope entirely and the practitioner should stop and refer, unlike Module 1 (referral script) and Module 4 (§4.8, full do-not-proceed section with an approved referral script).
- **Uncertain / requires external review:** whether Module 5, as a protocol-selection module immediately following Module 4's assessment module, needs its own explicit referral/stop-service language, or whether that responsibility is intentionally left entirely to Module 4 (already covers it) and Module 6 (conditions/disorders, not yet extracted) — a structural question for §9/external audit, not resolved here.

---

## 9. Relationship to adjacent modules

- **Material repeated from Module 4:** the hero description explicitly frames Module 5 as continuing directly from Module 4 ("Module 5 builds directly on your assessment skills from Module 4... If Module 4 taught you how to look, Module 5 teaches you what to do with what you see" — also echoed in the Cadence module-open greeting). However, the underlying frameworks are **not** aligned: Module 4 (as corrected) explicitly moved away from "five scalp types" language toward "appearance examples" and an observation-first vocabulary specifically to avoid mutually-exclusive diagnostic-sounding categories (`module-04.md`, "Required corrections" §2). Module 5, unaudited, still opens with "Five scalp types" as its organizing structure and a tap-to-select grid. The handoff language Module 4's own approved completion card uses — "Module 4 taught you how to gather and describe the evidence. Module 5 teaches you how to translate appropriate findings into a cosmetic treatment direction without collapsing the entire scalp into one label" — sets an explicit expectation ("without collapsing the entire scalp into one label") that Module 5's current five-type-grid framing does not yet clearly satisfy, even though its own prose elsewhere cautions against "labeling."
- **Material that appears to belong in Module 6:** the recap's Cadence note draws an explicit dry-vs-dandruff distinction ("A client who says they have 'dandruff' may have misidentified their own condition entirely and actually have a dry scalp. Those two things require opposite approaches") — this is exactly the subject matter Module 6 is titled for ("Conditions & Disorders," home-row subtitle "Dandruff, Malassezia, seborrheic dermatitis," per `headspa-mastery.html:2365`) and that `M6`'s own checkpoint questions test directly (`M6.questions.m6cp1`/`m6cp2`, `headspa-mastery.html:6759-6760`, contrasting "fine white powdery flakes, minimal oil" dry scalp against "yellowish clumped flakes, visible oil, mild redness... spreads to eyebrows and hairline" dandruff/seborrheic dermatitis). Module 5 previews this distinction in its recap before Module 6 formally teaches it.
- **Missing transitions from Module 4:** Module 4's own approved intro/handoff language (§ above) is more specific and more corrected than anything Module 5 currently says back to it — Module 5's hero and greeting reference Module 4 only in general terms ("your assessment skills from Module 4") and do not carry forward Module 4's specific approved vocabulary (five-point scan stations, five observation lenses, "appearance examples," preserve/modify/avoid/refer decision framework). A future Module 5 audit would need to decide how much of Module 4's now-corrected framework Module 5 should explicitly reuse rather than reintroducing its own parallel five-type system.
- **References to unaudited later modules:** Module 5's completion card previews Module 6 by name and topic ("Dandruff, seborrheic dermatitis, Malassezia — the ones that get misread most often and mishandled most consistently") — Module 6 itself has not been extracted or audited, so this preview's accuracy against Module 6's actual current content is unverified as part of this task.
- **Dependencies on concepts not yet taught:** none identified that would block a student — Module 5 does not appear to require any concept from Module 6 or later to be understood.

This overlap is being flagged, not resolved, per the task's explicit instruction not to resolve module boundaries during extraction.

---

## 10. Accessibility and responsive inventory

Only what can be confirmed from the source is reported below; nothing here was verified in a real browser, screen reader, or physical touch device as part of this extraction (see §13).

- **Headings:** Module 5 uses the same non-semantic heading pattern as every other module in the file — section titles are styled `<div>`s (`.sec-eyebrow`, `.sec-title`), not real `<h1>`–`<h6>` elements. This is an existing, file-wide pattern, not something specific to Module 5.
- **Semantic controls:** the two checkpoint submit buttons and two voice buttons are real `<button>` elements (good). The five-card scalp-type grid and the priority-order timeline are plain `<div>`s with no interactive semantics — appropriate, since (confirmed in §3) they are not actually interactive despite the "Tap each type" hint text.
- **Keyboard access:** the only keyboard-operable elements in Module 5 are the two checkpoint textareas/voice buttons/submit buttons, which inherit the same keyboard behavior as every other module's checkpoints (native `<button>`/`<textarea>` semantics, `m5cpKey` Enter-to-submit). No custom keyboard trap or off-pattern behavior was found.
- **Focus visibility:** not evaluated separately from the file-wide `.checkpoint`/`.cp-btn`/`.voice-btn` focus styles already used everywhere else; nothing module-5-specific overrides them.
- **Labels and accessible names:** **confirmed gaps.** `m5cp1In`/`m5cp2In`'s voice buttons carry only `title="Speak your answer"` — **no `aria-label`** (contrast with `m0cp1In`, `m1cp1In`/`m1cp2In`, and `m4cp1In`/`m4cp2In`'s voice buttons, all of which carry both `title` and `aria-label="Speak your answer"`). `m5cp1Btn`/`m5cp2Btn` carry **no `aria-label` at all** (contrast with `m0cp1Btn`, `m1cp1Btn`, and `m4cp1Btn`, which all carry `aria-label="Send response to Cadence"`).
- **Live regions:** **confirmed gap.** `#m5cp1Res` and `#m5cp2Res` (`headspa-mastery.html:3244, 3278`) carry no `aria-live` attribute, unlike `cp1Res`/`cp2Res` (Module 3), `m0cp1Res`, `m1cp1Res`/`m1cp2Res`, and `m4cp1Res`/`m4cp2Res`, all of which carry `aria-live="polite"`.
- **Color-only meaning:** the four-step priority timeline's dots (`pd-1`–`pd-4`) carry a numbered label (1/2/3/4) inside each dot in addition to color, so priority order is not color-only. However, the dot-color-to-meaning mapping reuses Module 3's `pd-1`–`pd-4` classes (originally the anagen/catagen/telogen/exogen hair-cycle sequence colors) for an unrelated "priority urgency" meaning here, and — separately — `pd-3` (used for "Sensitivity — first") resolves to `#c0392b`/`#fde8e8`, the pre-Step-25 red literal that Modules 0–4 have since moved away from in favor of the Module-1-baseline `#7a3030`/`#f0e8e8` pair (see `implementation-log.md` Step 25). Module 5 was explicitly confirmed untouched by Step 25's re-sweep, so this is expected, not a regression — but it means Module 5's one red-toned element does not yet match the now-established cross-module baseline.
- **Reduced motion:** no `@media (prefers-reduced-motion: reduce)` rule references anything inside `#module5Wrap`, and no animation/transition was found applied to any Module 5 element in the CSS scanned. Nothing to disable — not a gap, just an absence of motion in the first place.
- **Image enlargement:** N/A — there are no real images to enlarge (§7).
- **Touch targets:** not manually measured against a specific minimum; the checkpoint buttons reuse the same shared `.cp-btn`/`.voice-btn` sizing used everywhere else in the file, not a Module-5-specific value.
- **Responsive layout / horizontal overflow:** not verified in a real or simulated viewport as part of this extraction (see §13, deferred to manual/browser QA). `.photo-pair` has an existing `@media (max-width:600px)` rule collapsing it to a single column, which would apply to Module 5's two photo-pairs (currently placeholders) the same as it does elsewhere in the file.
- **Duplicate IDs:** none found specific to Module 5 in a targeted check (`m5cp1`, `m5cp1In`, `m5cp1Btn`, `m5cp1Res`, `m5cp2`, `m5cp2In`, `m5cp2Btn`, `m5cp2Res`, `m5Complete`, `module5Wrap` each appear exactly once in the file). A repository-wide duplicate-ID scan across the whole document is still pending as part of this task's validation step (§ Validation in the accompanying commit) and is not limited to Module 5.

---

## 11. Listen Mode and Guided Completion Path notes

Per instruction, this section documents only what can be inferred from the current curriculum — it does not implement or design either feature.

- **Approximate narration suitability:** the large majority of Module 5 is linear prose (intro, five scalp-type write-ups, priority-order section, recap) that would narrate reasonably well in sequence. Estimated narration length, based on word count and pacing comparable to the Module 1–4 extractions' estimates: roughly **12–15 minutes** for the full instructional text (hero through recap), not counting the two checkpoints.
- **Visual material that would require an audio cue:** the five-card scalp-type grid's "Look" descriptions and "Goal" labels are already present as readable text and would narrate directly; no chart, diagram, or image conveys information only visually (since, per §7, there are no real images — the placeholder graphics carry no information beyond their text captions, which already narrate as text). The four-dot priority timeline's color coding (§10) is redundant with its numbered/text labels, so it would not lose meaning in audio-only form.
- **Interactions or checkpoints that prevent audio-only completion:** the two open-response checkpoints (`m5cp1`, `m5cp2`) require typed or spoken free-text input either way (the module already has a voice-input button), so they are not a barrier specific to audio narration. The "Tap each type" grid is not an actual interaction (§3), so it does not block audio-only completion either — there is nothing to "tap." In short, nothing currently in Module 5 appears to block a Listen-Mode-style pass, more so than most other modules extracted so far.
- **Likely position in the later Guided Completion Path:** immediately after Module 4 in sequence (per the approved course sequence — Modules 1–11 instructional, Module 12 Final Exam) — no basis was found in the current content for reordering Module 5 relative to its neighbors.

---

## 12. Source map

| Component | File | Location |
|---|---|---|
| Home-screen module row | `headspa-mastery.html` | lines 2358–2362 |
| Full curriculum block (`#module5Wrap`) | `headspa-mastery.html` | lines 2903–3295 |
| Checkpoint 1 markup (`m5cp1`) | `headspa-mastery.html` | lines 3229–3245 |
| Checkpoint 2 markup (`m5cp2`) | `headspa-mastery.html` | lines 3263–3279 |
| Completion card markup (`m5Complete`) | `headspa-mastery.html` | lines 3282–3292 |
| `MODULE_CHECKPOINTS['5']` | `headspa-mastery.html` | line 6086 |
| `MODULE_TITLES[5]` | `headspa-mastery.html` | line 6118 |
| `M5` object (questions + system) | `headspa-mastery.html` | lines 6748–6754 |
| `MODULE_GUIDE_SYSTEMS[5]` | `headspa-mastery.html` | line 6811 |
| `MODULE_QUICK_PROMPTS[5]` | `headspa-mastery.html` | line 6826 |
| `openModuleById()` — `STATIC_MODULES[5]` routing | `headspa-mastery.html` | line 7023 |
| `openModuleById()` — Module 5 greeting | `headspa-mastery.html` | line 7065 |
| `submitM5CP(id)` | `headspa-mastery.html` | lines 7324–7326 |
| `m5cpKey(e,id)` | `headspa-mastery.html` | lines 7327–7329 |
| Shared checkpoint pipeline (`submitCheckpoint`, `evaluateCheckpointAnswer`, `normalizeCheckpointEvaluation`, `restoreLessonState`, `applyCheckpointInputState`, `renderCheckpointOutcomeLabel`) | `headspa-mastery.html` | lines 6266–6486 |
| `.clinical-photo` / `.clinical-photo.placeholder` / `.photo-pair` CSS | `headspa-mastery.html` | lines 1921–1965 |
| `.scalp-card` CSS | `headspa-mastery.html` | line 616 |
| `.phase-dot`/`.pd-1`–`.pd-4` CSS | `headspa-mastery.html` | lines 357–365 |
| `canAccessModule`, `wouldBeLockedWithoutReview`, `setCurrentModule` | `assets/js/headspa-state.js` | lines 628–669 |
| `getRequiredCheckpointIds`, `reconcileModuleState`, `_hasAllRequiredCheckpoints` | `assets/js/headspa-state.js` | lines 556–593 |
| `markModuleComplete`, `_checkModuleComplete` | `assets/js/headspa-state.js` | lines 722–760 (approx.) |
| `MODULE_MEMORY_TAGS[5]` | `assets/js/headspa-state.js` | line 137 |
| `getCheckpointMemoryTags` (moduleId === 5 branch) | `assets/js/headspa-state.js` | lines 323–326 |
| `getCheckpointMemorySummary`, `getModuleFocusTags`, `scoreMemoryItemForModule` | `assets/js/headspa-state.js` | lines 356–382 |

State keys touched by Module 5 (all shared, generic per-module state — no module-5-specific key names): `progress['5'].checkpoints`, `progress['5'].checkpointMeta.m5cp1`/`m5cp2`, `progress['5'].complete`, `progress['5'].completedAt`, `progress['5'].startedAt`/`lastVisitedAt`/`lastScrollY`/`maxReadPercent`, `student.cadenceMemory.notableAnswers` (entries tagged `moduleId: 5`), `student.cadenceMemory.patterns.strengths`/`focusAreas` (populated with Module 5's tags on pass/retry).

Selectors: `#module5Wrap`, `#m5cp1`, `#m5cp1In`, `#m5cp1Btn`, `#m5cp1Res`, `#m5cp2`, `#m5cp2In`, `#m5cp2Btn`, `#m5cp2Res`, `#m5Complete`, `.scalp-type-grid`, `.scalp-card` (`.neutral`/`.oily`/`.dry`/`.combo`/`.sensitive`), `.protocol-card`, `.phase-timeline`/`.phase-item`/`.phase-dot`, `[data-module-id="5"]`.

---

## 13. Confirmed findings and assumptions

### Confirmed (proven directly from the code)

1. `m5cp1` and `m5cp2` displayed (`.cp-q`) and evaluated (`M5.questions`) question strings are **not** byte-identical (§4) — same defect class already corrected in Modules 1–4.
2. `M5.system` is one shared function used for both checkpoints — Module 5 has not yet moved to the per-checkpoint `MN.systems.mNcpX` structure Modules 1–4 now use.
3. `submitM5CP` does not pass a 5th `errorMessage` argument to `submitCheckpoint()`, so Module 5 has no module-specific network-error text yet.
4. Both checkpoint voice buttons lack `aria-label`; both submit buttons lack `aria-label`; both `.cp-res` feedback regions lack `aria-live` — confirmed present in already-corrected Modules 0, 1, and 4, confirmed absent here.
5. `M5.system` still says "instructor of **HeadSpa Mastery**" (old course name); `MODULE_GUIDE_SYSTEMS[5]` still frames Cadence as personally "a mentor built from nearly two decades in the head spa industry," the personal-experience-claim pattern already corrected out of Modules 0, 1, 2, and 4.
6. The "over-stripping triggers compensatory oil production" claim, and the "follicular congestion... compromise the environment needed for healthy hair growth" claim, both appear in Module 5's current curriculum, rubric, and (the former) a quick prompt — and both are claims Module 4's approved audit spec explicitly required removing from Module 4 for lacking support.
7. The "↓ Tap each type to see the protocol" hint text has no corresponding interactive behavior anywhere in the code — the five-card grid is fully static.
8. `window._m5cpsDone` is set on every module-5 open but is never read anywhere else in the file — dead state.
9. Module 5 has zero real image/diagram/video/downloadable assets — every "photo" is a decorative placeholder graphic with no underlying file.
10. The hero eyebrow ("...Treatment Protocols") does not match the home-row title and `MODULE_TITLES[5]` ("...Protocols") word-for-word.
11. Module 5's priority-timeline `pd-3` (red) dot still resolves to the pre-Step-25 red literal (`#c0392b`/`#fde8e8`), not the Module-1-baseline red (`#7a3030`/`#f0e8e8`) now used across Modules 0–4 — expected, since Step 25 explicitly did not touch Module 5, but a real inconsistency a future Module 5 audit would need to address.
12. Module 5 has no explicit stop-service/refer-out section, unlike Module 1 and Module 4.

### Assumptions or external-review questions (not verified here; require further work)

- **Medical or dermatological verification:** every physiological claim in §8 (compensatory oil production, follicular congestion causing impaired hair growth, the "60 to 90 percent of follicles" dry-scalp criterion, the heat-exposure/sebum-percentage claim, the bacterial-overgrowth mention, the Malassezia/dandruff mechanism in the Cadence note) needs subject-matter review before any correction is written.
- **Legal or scope review:** whether Module 5's protocol language (e.g., specific active-ingredient recommendations like salicylic acid, zinc, hyaluronic acid, ceramides) stays within the same "cosmetic, not medical" framing established for Modules 1 and 4, or needs the same scope-hedging treatment.
- **Live-model testing:** how the current shared `M5.system` rubric actually grades real student answers — not evaluated here (no live API call was made as part of this documentation-only extraction).
- **Screen-reader testing:** VoiceOver/NVDA behavior around the confirmed missing `aria-label`/`aria-live` attributes (§10) was not tested with an actual screen reader — the gaps are confirmed from source, not from an assistive-technology session.
- **Physical-keyboard testing:** native `<button>`/`<textarea>` semantics should guarantee normal keyboard operability, consistent with every other module's checkpoints, but was not physically tested here.
- **Real touch-device testing:** not performed; no touch-target sizing was measured.
- **Visual manual QA:** rendering of the five-card grid, protocol cards, priority timeline, and placeholder photo boxes at desktop and mobile widths was not visually confirmed in a browser as part of this extraction.
