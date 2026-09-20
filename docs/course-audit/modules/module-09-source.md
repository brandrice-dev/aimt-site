# Module 9 — Source Extraction (Pre-Audit)

**New curriculum identity:** Module 9 — Checkout, Client Closing & Pricing Strategy
**Status:** Extracted for external audit. Not audited, not approved, not implemented.
**Production source of truth:** `headspa-mastery.html`
**Branch:** `course-audit-build`
**Extracted:** August 24, 2026, following Module 8's final convergence pass (commit `3d3c17e`)

This document is a neutral extraction of existing source material relevant to the owner's new Module 9 curriculum identity — **Checkout, Client Closing & Pricing Strategy**. It does not propose final copy, approved outcomes, or implementation instructions. No production file was modified to produce this extraction.

---

## 1. Source reconciliation — technical vs. new curriculum identity

Per the owner's locked future module order, the technical (in-code) module numbering does **not** match the new curriculum order. Confirmed by direct inspection of `headspa-mastery.html`:

| Technical (`MODULE_TITLES` in code today) | New curriculum order (owner-stated, not yet implemented) |
|---|---|
| `9`: "Module 9 — Sanitation & Reset Systems" | → future **Module 10** — Sanitation & Reset Systems |
| `10`: "Module 10 — Pricing Strategy" | → primary source for new **Module 9** — Checkout, Client Closing & Pricing Strategy |
| `11`: "Course Completion & Certification" | → preserved for a later completion/certificate audit, **not** folded into a future AI module |
| *(no technical module 12 exists — `TOTAL_MODULES` is 12, i.e. technical `0`–`11` only)* | → future **Module 11** — AI / Modern Practice Tools (new curriculum, currently unbuilt); future **Module 12** — Final Exam (unbuilt) |

**Naming correction (this task):** the module-count constant is `TOTAL_MODULES = 12` in `headspa-mastery.html:6988` (`// 0 through 11`), read by `renderHomeProgress()`. A separately declared `MODULE_COUNT = 12` also exists, but only inside `assets/js/headspa-state.js:5` (the progress/state engine), used by its own sanitize/completion-count logic — the two are same-value, different-file constants, not one shared identifier. Both currently read `12`; neither was changed by this extraction.

**No code was changed to reflect the new order.** `MODULE_TITLES`, `TOTAL_MODULES`/`MODULE_COUNT`, routing (`openModuleById`), and every module's own "up next" copy (e.g. technical Module 8's completion card still says "Up next — Module 9: Checkout, client closing, and pricing strategy" — already corrected in Module 8's own polish pass to preview the *new* Module 9 identity, see `00-aimt-current-course-status.md` — while technical Module 10's completion card still says "Up next — Course completion," the **old** order, uncorrected) all still reflect a mix of old and newly-corrected technical order. This is the same conflict already flagged in `00-aimt-current-course-status.md`'s "Locked future module order" note (recorded August 24, 2026) — this document does not resolve it, only extracts against it.

---

## 2. Search results — course-wide sweep for new-Module-9-relevant content

A full-file search was run for: treatment close, client close, checkout, payment, gratuity, rebooking, client retention, future booking, follow-up, home-care recommendations, retail/product discussion, packages, enhancements/add-ons, service pricing, costs, margins, sustainability, positioning, market comparison, discounts, promotions, introductory pricing, price increases.

**Primary source — technical Module 10 (Pricing Strategy), lines 6677–6862.** The overwhelming majority of relevant content. See §4–§6 below for full extraction.

**Technical Module 9 (Sanitation & Reset Systems), lines 6520–6676.** Checked in full — contains **zero** checkout/closing/pricing/retail content. Purely sanitation, reset sequencing, and compliance. Confirmed as the future Module 10 source, not a new-Module-9 source.

**Technical Module 11 (Course Completion & Certification), lines 6863–6958.** Checked in full — contains **zero** checkout/closing/pricing/retail content. Purely course-completion messaging, a recap of what the student built, and the certificate reveal. No checkpoint exists in this module. Confirmed disposition: preserve as-is for the later, separate completion/certificate-flow audit named in the master instructions — do not fold it into the new Module 9 or the future AI module.

**Technical Module 8 (The Head Spa Service).** The only "client closing" language that currently exists anywhere in the course is Video 09's approved closing script (Section 8.2, Chapter 09): *"Today I focused a little more on [area or service priority you addressed]. How are you feeling?"* — deliberately scoped to the treatment-closing observation and wellbeing check only. Module 8's own governing spec (`module-08.md`) explicitly excludes retail, rebooking, pricing, checkout, and packages from this moment, stating they "belong in Module 9." **This confirms the new Module 9's job**: everything after that single closing line — the actual transition into checkout — does not exist in the codebase yet anywhere. It is new curriculum, not an extraction.

**No other module** (0–7) contains checkout/pricing/retail/rebooking content on inspection of the same keyword sweep.

**Stripe/payment code** (`functions/api/create-checkout-session.js`, `success.html`, the `lp-checkout-status` UI string at `headspa-mastery.html:2471`) is the *course's own purchase checkout* (a student buying HeadSpa Mastery) — unrelated to the new Module 9's curriculum subject (a head-spa client's in-salon checkout). Not a content source; noted only to rule it out explicitly.

---

## 3. Existing learning architecture — technical Module 10 (primary source)

**Hero:** eyebrow "Module 10 · Pricing Strategy"; title "Pricing is not just a number.<br>It controls everything."; description on how pricing controls perception, day feel, client volume, attention.

**Section order (unnumbered intro, then 10.1–10.6):**

1. *(unnumbered)* "What you are actually selling" — reframes the service as controlled experience + time/skill + environment, not products; warns against "what are others charging?" as the wrong question.
2. *(unnumbered)* "Know your real cost — not your guess" — 3-card concept grid: Fixed costs, Variable costs, Time cost ("A '1-hour service' is not 1 hour... closer to 1 hour 20–30 minutes").
3. *(unnumbered, info-card)* "A simple pricing framework" — 5-step formula: hourly target ($120–150/hr stated as "a sustainable starting point for most markets") → real service time (×1.25) → multiply → add cost buffer → adjust for market.
4. **10.1 — Build your menu.** "Three tiers. No more." Anchor (60-min) → premium (90-min/2-hour signature) → optional intro tier. Cadence note on framing premium as "the obvious one."
5. **10.2 — Know your numbers first.** Warns against competitor-based pricing. Contains the **interactive price calculator** (`#calcProduct`/`#calcOverhead`/`#calcTime`/`#calcMargin` → `calcPrice()` → `price = cost / (1 - margin/100)`, displayed to the nearest dollar). See §7a below for the exact code, output label, and a confirmed math/label discrepancy.
6. **10.3 — Add-ons.** "Enhancements, not upsells." 5 add-on cards, each with a name, an observation-framed client script, and a price range: Scalp treatment serum (+$20–35), Extended massage time (+$25–40), Deep conditioning upgrade (+$15–30), Blow dry (+$30–60, "decide in advance whether included or add-on"), Aromatherapy enhancement (+$10–20).
7. *(unnumbered)* "The real problem — fear-based pricing." Reframes underpricing as a confidence problem, not a math problem. Two info-cards: "What underpricing actually looks like" (burnout/compounding-decline framing) and "Positioning language matters" (word-swap pairs: "basic option" → "core service"; "more expensive" → "extended experience"). Key-point: signs of underpriced vs. aligned.
8. **10.4 — Positioning.** "When a client says it feels expensive." Reframes this as marketing feedback, not financial feedback — a positioning problem that started before the appointment (intake form, booking language, website, consultation). Info-card: "What positions premium correctly" (booking language, consultation-as-expertise-demonstration, closing script naming value, home-care follow-up).
9. **10.5 — Checkpoint (`m10cp1`).** "Build your three-tier service menu. Name each tier, describe what it includes, and price it. Then explain why you priced it that way." Free-text, voice-input capable, evaluated by `M10.system`.
10. **10.6 — Checkpoint (`m10cp2`).** "A client at checkout says the service was amazing but the price felt a little high. How do you respond — and what does this tell you about your positioning?" Free-text, same pipeline.
11. Completion card (`m10Complete`) — "Up next — Course completion... One final module." (stale under the new order; not corrected here, out of scope for extraction).

**Interactions/calculators found:** exactly one — the pricing calculator in §10.2 (client-side arithmetic only, no persistence, no `APP_STATE` write). No drag-and-drop, no sort, no compare-and-decide scenario exists anywhere in technical Module 10 — its interaction density is effectively zero beyond the calculator and the two checkpoints.

**Checkpoint IDs / exact questions (displayed = evaluated string, `M10.questions`):**
- `m10cp1`: *"Build your three-tier service menu. Name each tier, describe what it includes, and price it. Then explain why you priced it that way."*
- `m10cp2`: *"A client at checkout says the service was amazing but the price felt a little high. How do you respond — and what does this tell you about your positioning?"*

**Rubric (`M10.system`, single shared function — same pre-audit `system(q)` pattern already flagged and corrected in Modules 1–8):**
> "You are Cadence, instructor of HeadSpa Mastery. Module 10 (Pricing Strategy) checkpoint. Question: '[q]'. Key concepts: three tiers is optimal — too many options cause clients to choose down. Price must cover product cost per service + overhead + full time (setup and reset) + profit margin. Never price by copying competitors — their costs may not be covered. Add-ons framed as enhancements land better than upsells. 'Felt expensive' often means positioning, not price — what the client understood the value to be before they paid. A client who says this is giving you marketing feedback. 3-5 sentences, business-direct and warm."

**Existing Cadence (module-aware guide, not just checkpoint rubric):**
- `MODULE_GUIDE_SYSTEMS[10]`: *"You are Cadence — a mentor built from nearly two decades in the head spa industry. The student is in Module 10 (Pricing Strategy): three-tier menu, cost-first pricing, add-ons as enhancements, client perception. Price for the value of the head spa experience you are delivering. If the student is building a new menu or repricing, keep the conversation anchored to head spa service value — not other services. 3-5 sentences. No bullet points."*
- `MODULE_QUICK_PROMPTS[10]`: `['How do I price my anchor service?', 'What add-ons convert best?', 'How do I respond when someone says it is expensive?']`

**Visuals/resources:** none. No image, diagram, icon (beyond the shared circled-number concept-grid glyphs), or downloadable exists anywhere in technical Module 10 — confirmed by the same style of grep used for Module 8's source extraction (§6 of `module-08-source.md`), zero matches for any `module-09`/`module_09`/`module-10`-named asset path.

---

## 4. Client Closing curriculum found

**Existing:** only Module 8's single approved closing line (§2 above) — a treatment-experience observation and wellbeing check, explicitly scoped away from retail/rebooking/pricing.

**Not existing anywhere in the codebase today:** the actual transition language from "treatment is over" into "now we talk about payment, home care, and coming back" — the connective tissue between Module 8's closing line and technical Module 10's positioning/pricing content. This is new curriculum for the external audit to design, not something to extract.

---

## 5. Checkout / booking / gratuity / policies curriculum found

**Minimal.** The only checkout-adjacent material is `m10cp2`'s scenario framing ("A client at checkout says the service was amazing but the price felt a little high") and §10.4's observation that price surprise at checkout is a positioning failure that started earlier. **No content exists anywhere on:** payment methods, gratuity/tipping norms or scripting, cancellation/no-show/deposit policy, rebooking mechanics (scheduling the next appointment), or how to close out a point-of-sale transaction. All new curriculum.

---

## 6. Enhancement / add-on curriculum found

Technical Module 10 §10.3, in full (see §3 above) — 5 named add-ons with client-facing scripts and price ranges, framed as observation-triggered "enhancements" rather than menu-driven "upsells." This is the strongest existing source for the task's flagged downloadable candidate (§9 below).

---

## 7. Pricing curriculum found

The complete 5-step formula, the fixed/variable/time cost framework, the three-tier menu structure, the fear-based-underpricing reframe, and the positioning-language word-swap pairs — all in technical Module 10, fully catalogued in §3 above. No separate pricing content exists elsewhere in the course.

### 7a. Pricing calculator — exact code, labels, and a confirmed math/label discrepancy

Verified directly against `headspa-mastery.html` (reconciliation pass, this task).

**Inputs (`headspa-mastery.html:6748–6764`):** four `<input type="number">` fields, each preceded by a `<label class="calc-label">` with **no `for` attribute** — the label text and input are visually adjacent but not programmatically associated for assistive technology (see §17 below).
- `#calcProduct` — "Product cost per service ($)" — placeholder `e.g. 12`, `min="0"`, no default value
- `#calcOverhead` — "Overhead per service ($)" — placeholder `e.g. 25`, `min="0"`, no default value
- `#calcTime` — "Your time cost ($)" — placeholder `e.g. 40`, `min="0"`, no default value
- `#calcMargin` — "Target margin (%)" — placeholder `e.g. 30`, `min="0" max="90"`, **`value="30"` is a real pre-filled default**, not just a placeholder

**Formula and output — exact code (`calcPrice()`, `headspa-mastery.html:9030–9044`):**
```js
function calcPrice() {
  const product = parseFloat(document.getElementById('calcProduct').value) || 0;
  const overhead = parseFloat(document.getElementById('calcOverhead').value) || 0;
  const time = parseFloat(document.getElementById('calcTime').value) || 0;
  const margin = parseFloat(document.getElementById('calcMargin').value) || 30;
  const cost = product + overhead + time;
  const price = cost / (1 - margin / 100);
  const result = document.getElementById('calcResult');
  if (result) {
    result.innerHTML = '...Minimum price to break even...'
      + '...$' + price.toFixed(0) + '...'
      + '...Cost: $' + cost.toFixed(0) + ' · ' + margin + '% margin built in...';
    result.style.display = 'block';
  }
}
```
The rendered output label (`headspa-mastery.html:9039`) reads exactly: **"Minimum price to break even."**

**Validation/fallback behavior:** any blank or non-numeric `product`/`overhead`/`time` field silently falls back to `0` (not an error state, no user-facing message); a blank/non-numeric `margin` field falls back to `30`, not `0`. There is no minimum-input requirement, no disabled state before input, and no error/empty state distinct from "all zeros" — an all-blank submission silently computes and displays `$0`.

**Confirmed discrepancy (this is Known External-Audit Risk #8 — see §9 below):** the formula `price = cost / (1 - margin/100)` computes a price that *includes* the student's chosen profit margin (e.g., at the pre-filled 30% default, a $100 cost produces a $143 output) — this is a margin-loaded target price, not a break-even price. A genuine break-even price is simply `cost` itself (margin = 0%, since below cost is a loss and above cost is profit). Labeling the margin-inclusive output "Minimum price to break even" is a direct terminology error: the number shown is the minimum price to hit the *chosen margin*, not the minimum price to avoid a loss. The 30% margin default is also never explained or connected back to the $120–150/hr benchmark used earlier in the same section (already flagged in the pre-existing §9 "Arbitrary-reading margin defaults" risk) — both defects sit in the same UI element.

---

## 8. Existing interactions, checkpoint IDs, and Cadence — consolidated

| Element | Location | Notes |
|---|---|---|
| Price calculator | `#calcProduct`/`#calcOverhead`/`#calcTime`/`#calcMargin`, `calcPrice()` | Client-side only, no persistence, no `APP_STATE` write |
| `m10cp1` | technical Module 10 | Build-your-menu checkpoint |
| `m10cp2` | technical Module 10 | "Felt expensive" positioning checkpoint |
| `M10.system` | single shared rubric | Same pre-audit pattern (shared function, not per-checkpoint) already corrected in Modules 1–8; **not yet corrected here** |
| `MODULE_GUIDE_SYSTEMS[10]` | Cadence guide | Still uses the old "mentor built from nearly two decades in the head spa industry" personal-experience framing already corrected in Modules 0–8's guide strings |
| `MODULE_QUICK_PROMPTS[10]` | 3 prompts | See §3 |

For completeness, technical Module 9 (future Module 10, Sanitation) carries the parallel `m9cp1`/`m9cp2`/`M9.system`/`MODULE_GUIDE_SYSTEMS[9]`/`MODULE_QUICK_PROMPTS[9]` — same shared-rubric and old-persona pattern, recorded here only because it is adjacent, not because it belongs to new Module 9.

**Checkpoint submission wiring — verified (`headspa-mastery.html:8756–8769`):** `submitM9CP(id)` calls `submitCheckpoint(9, id, M9.system, M9.questions[id])`; `submitM10CP(id)` calls `submitCheckpoint(10, id, M10.system, M10.questions[id])` — both use the same shared `submitCheckpoint()` function every other module uses (`headspa-mastery.html:7341`), including the same Review Mode branch (`submitCheckpointReviewMode`, never persists, never marks passed, never completes/unlocks). Enter submits / Shift+Enter inserts a newline via `m9cpKey`/`m10cpKey`, matching the established pattern.

**Missing module-specific network-error text.** `submitCheckpoint(moduleId, cpId, systemPrompt, question, errorMessage)` accepts an optional 5th `errorMessage` argument, used by other already-corrected modules (e.g. Module 5's README entry: *"`submitM5CP` now passes the approved Module 5 network-error text"*) to show a module-tailored message on a failed grading call. **Neither `submitM9CP` nor `submitM10CP` passes this argument** — both fall back to the generic default (`'Cadence didn't respond — check your connection and try again.'`, `headspa-mastery.html:7396`). Not a defect in isolation, but it is the same class of pre-audit gap already closed in Modules 1–8; flagged here since the future Module 9 will inherit this checkpoint wiring from technical Module 10's `submitM10CP`.

**Existing visuals/resources for technical Modules 9–11:** none (confirmed above).

---

## 9. Audit risks — flagged, not corrected

Per instruction, these are recorded for the external audit's attention, not fixed in this extraction:

- **Unsupported universal pricing formula.** "$120–150/hr is a sustainable starting point for most markets" is stated as near-fact with no market-size, region, or cost-of-living qualifier — reads as a universal benchmark rather than an illustrative example.
- **Guaranteed/near-guaranteed outcome language.** "If they feel easy to say yes to, they convert" (add-on framing) implies a predictable conversion outcome from a communication technique. "The most effective add-ons are ones you recommend based on what you observed" states a causal best-practice as settled fact without qualification.
- **Borderline manipulative-selling framing.** The Cadence note on making "the premium option feel like the obvious one... a client who can afford it would feel like they're leaving something behind by not choosing it" edges toward engineered FOMO rather than transparent value communication — worth the external audit's explicit judgment call.
- **Old Cadence persona pattern, uncorrected.** `MODULE_GUIDE_SYSTEMS[9]`, `[10]`, and `[11]` all still open "You are Cadence — a mentor built from nearly two decades in the head spa industry" (personal-experience claim, old framing) — the same defect class already corrected for Modules 0–8's guide strings. Flagged for correction whenever this content is actually implemented, not fixed here.
- **Old course name, separately, in the checkpoint rubric text itself.** Distinct from the persona claim above: `M9.system` and `M10.system` (`headspa-mastery.html:7822` and `:7831` — the actual grading-rubric strings sent to the AI, not the module-aware guide strings) both still open **"You are Cadence, instructor of HeadSpa Mastery"** — the old course name (per `00-global-decisions.md`'s "Course name" rule, target is "Head Spa Certification Course"). Verified by direct comparison: every other module's checkpoint rubric (`M0` through `M8`, `headspa-mastery.html:7509–7812`) already opens with the corrected "You are Cadence, [the/AIMT's] curriculum-grounded [learning] guide for the Head Spa Certification Course" framing — `M9`/`M10` are the only two remaining holdouts of this specific old-name pattern anywhere in the checkpoint-rubric layer.
- **Shared single-function rubric.** `M10.system` (and `M9.system`) use one shared `system(q)` function for both checkpoints rather than per-checkpoint rubrics — the same pre-audit pattern already replaced with `M{n}.systems.{cpId}` for Modules 1–8.
- **Calculator mislabels a margin-loaded price as "break even."** Confirmed present — see §7a above for the full code, exact label text, and the specific math/label contradiction (`headspa-mastery.html:9030–9044`). This is Known External-Audit Risk #8 from the prior handoff; it was not previously cited with code/line evidence in this extraction and is added here.
- **No tax/legal/employment content** exists anywhere in the pricing material — pricing is discussed as if 100% of revenue is discretionary net income; no mention of self-employment tax, sales tax on services (state-dependent), or business-structure implications. Not necessarily a defect (may be intentionally out of scope for a cosmetology-certification course), but worth an explicit scope decision.
- **Arbitrary-reading margin defaults.** The calculator defaults to a 30% target margin with no explanation of why 30% versus another figure, and no connection back to the "$120–150/hr" benchmark used earlier in the same section (the two aren't mathematically reconciled for the reader).
- **Scope/safety note absent from enhancement marketing.** The "Scalp treatment serum" and "Deep conditioning upgrade" add-on scripts recommend product/treatment changes framed purely as sales language, with no cross-reference to Module 5/6's contraindication or adaptation judgment — worth checking whether an in-service upsell script could ever conflict with a genuine scalp-presentation safety reason to *not* add a product.
- **"Clients remember being seen" vs. "drives rebooking."** Module 8 already corrected an unqualified rebooking-causation claim (`module-08.md`, corrections #15) — the external audit should hold the new Module 9's rebooking-language content to the same standard: no claim that anything specific "drives" or "guarantees" rebooking.

---

## 10. Signature-learning-moment candidates for the external audit

- **Build-your-service-price exercise** — `m10cp1` already exists in this shape; could evolve into the new Module 9's checkpoint or its own applied exercise.
- **Pricing decision scenario** — a compare-and-decide interaction (matching the established `m5Decide`/`m6Sort`/Module 7/8 "Protect the Flow" pattern) testing whether a student can reason through a pricing/positioning tradeoff rather than just recall the formula. No such interaction currently exists in technical Module 10 — its interaction density (calculator + 2 checkpoints, zero scenario interactions) is the lowest of any inspected module.
- **Client-close scenario** — genuinely new: a judgment interaction on transitioning from treatment-closing (Module 8's territory) into checkout without breaking the relaxation experience just established.
- **Rebooking-language judgment** — testing a student's ability to invite a future booking without an unsupported-outcome claim (directly continuous with Module 8's own approved correction #15).
- **Enhancement-positioning exercise** — applying the 5 existing add-on scripts (or new ones) to a scenario, testing "observation-triggered recommendation" versus "menu-recitation," which the existing curriculum already names as the key distinction (§10.3).

---

## 11. Downloadable opportunity assessment

**Head Spa Enhancement Menu & Positioning Guide — strong candidate, confirmed by source material.** Technical Module 10 §10.3 already contains 5 fully-formed add-ons (name, client script, price range) — real, reusable, treatment-room-relevant content, not something that would need to be fabricated. This matches the governing downloadable-resource policy's bar (repeated practical value: consultation use, a decision tool, a quick reference avoiding reopening the full lesson) far better than Module 8's own "not recommended" finding did, since Module 8's video masterclass already outperforms a written protocol sheet — pricing/enhancement content has no equivalent video competing for the same role.

**Pricing calculator/worksheet as a second resource — not recommended as a second download.** The existing embedded, interactive `calcPrice()` calculator already serves this exact purpose inside the lesson itself. A static worksheet duplicating the same math would compete with, not complement, a tool that already works and is arguably stronger (live, no download friction). One resource (the Enhancement Guide) is likely sufficient — consistent with the governing policy's instruction not to force two downloads when one serves the need.

---

## 12. Visual asset opportunity

Technical Module 10 currently has zero images/diagrams (confirmed §3). A future Enhancement Guide downloadable would benefit from the same restrained, branded visual language already established for Module 8's Core/Extended Format Head Spa Service Maps (`assets/images/course/module-08/`) — AIMT branding, clean typographic layout, no decorative stock imagery. Not designed here; recorded as a direction for whoever builds the downloadable.

---

## 13. Guided Completion Path inputs

- **Estimated attentive learning time:** not measured in this extraction; technical Module 10's non-interactive reading content is comparable in density to Module 8's non-video estimate (15–20 min), plus calculator/checkpoint time.
- **Hands-on practice:** building an actual three-tier menu and pricing calculation for the student's own real or planned business — already implicitly the point of `m10cp1`.
- **Competency demonstrated (candidate):** the student can price a service sustainably, build a coherent tiered menu, respond to a price objection without discounting reflexively, and close a service into checkout/rebooking without an unsupported claim.
- **Earlier concepts to revisit:** Module 8's approved closing script and "clients remember being seen" correction (direct continuity point).

## 14. Listen Mode inputs

- **Narration suitability:** the pricing-framework prose, the add-on scripts, and the positioning-language guidance are all narration-suitable.
- **Screen-required content:** the interactive price calculator (numeric input) and both checkpoints.
- **Video-only content:** none currently exists for this material — no video component in technical Module 10 today.

---

## 15. Future module mapping (recorded, not implemented)

- **Future Module 10 — Sanitation & Reset Systems.** Primary source = current technical Module 9 (`headspa-mastery.html:6520–6676`), subject to its own later audit. Confirmed zero overlap with new Module 9's subject matter.
- **Future Module 11 — AI / Modern Practice Tools.** New curriculum. Confirmed **not built** — no technical module exists for this subject anywhere in `headspa-mastery.html` (`TOTAL_MODULES` is 12, i.e. technical `0`–`11` only, and technical `11` is Course Completion & Certification, not AI tools).
- **Future Module 12 — Final Exam.** Confirmed **not built** — no technical module 12 exists in code at all.
- **Completion/certification content disposition.** Current technical Module 11 (`headspa-mastery.html:6863–6958`, plus the certificate overlay markup and `showCertificate()`/cert-generation logic elsewhere in the file) is preserved exactly as-is, reserved for the separate, later completion/certificate-flow audit named in the master instructions (`00-aimt-course-audit-master-instructions.md`'s master project order, item 2) — explicitly **not** treated as a source for the future AI module, and not touched by this extraction.

---

## 16. Accessibility / technical implementation

Verified directly against `headspa-mastery.html` (reconciliation pass, this task) — not assessed in the original extraction pass.

**Checkpoint controls — foundation-consistency regression confirmed against Module 8.** Per `00-global-decisions.md`'s "Course foundation consistency" rule, the checkpoint component is explicitly named foundation and must stay consistent across approved modules. Technical Module 10's checkpoints (the primary source for new Module 9) do **not** match Module 8's (the most recently worked module) checkpoint markup:

| Element | Module 8 (`m8cp1`/`m8cp2`, current pattern) | Module 10 (`m10cp1`/`m10cp2`, pre-audit) |
|---|---|---|
| Response container class | `cp-res` | `cp-response` (different class name) |
| Response container `aria-live` | `aria-live="polite"` present | **absent** |
| Voice button `aria-label` | `aria-label="Speak your answer"` present | **absent** (only `title="Speak your answer"`) |
| Submit button `aria-label` | `aria-label="Send response to Cadence"` present | **absent** |

Technical Module 9's checkpoints (`m9cp1`/`m9cp2`) carry the identical pre-audit pattern (same `cp-response` class, same missing `aria-label`/`aria-live` trio). This means a screen-reader user gets no live announcement when Cadence's graded response arrives on either checkpoint, and the voice/submit controls have only a `title` tooltip (not reliably exposed to assistive tech) instead of an accessible name. This is the same defect class already corrected for Modules 1, 3, 5, and 8's checkpoints (confirmed present there) — Module 10 was never included in that correction pass.

**Pricing calculator inputs.** The four calculator `<label>` elements have no `for` attribute pointing at their paired `<input>`'s `id` (see §7a) — visually adjacent but not programmatically associated. `#calcResult` (the output region `calcPrice()` writes into) has no `aria-live` — a screen-reader user who activates "Calculate minimum price" gets no announcement that a result appeared. The four number inputs use native `<input type="number">` (semantically correct control type) with visible native labels, `min`/`max` attributes present on 3 of 4 fields (none on `#calcTime`).

**Reset-sequence interaction (technical Module 9, §9.2, `#resetSequence`/`startResetTimer()`)** was not deep-audited here since it belongs to future Module 10 (Sanitation), not new Module 9 — noted only because it lives in the same technical module currently reconciled as future Module 9's counterpart. Not in scope for this extraction.

**Review Mode behavior — confirmed consistent.** Both technical Modules 9 and 10 route through the same shared `submitCheckpoint()` → `submitCheckpointReviewMode()` branch as every other module (§8 above) — Review Mode's non-persisting checkpoint behavior is already correct for this content and needs no correction.

**Mobile/saved-state:** not separately verified in this pass (no rendered-browser QA was performed for this source-extraction task, per the task's read/reconciliation-only scope) — flagged as unverified rather than assumed clean.

---

## 17. No implementation performed

This extraction did not: rename any module, change `MODULE_TITLES`, change `TOTAL_MODULES`/`MODULE_COUNT`, correct any of the flagged audit risks (old Cadence persona, old course name in the checkpoint rubrics, shared rubric function, unqualified formulas, the calculator's break-even mislabel, the missing checkpoint accessibility attributes), build any new interaction, or create the Enhancement Guide downloadable. `git diff --check` on this task's full changeset confirms no production code (`headspa-mastery.html`, `assets/js/*.js`, `functions/*`) was touched by Module 9 work — only this documentation file was added/updated.
