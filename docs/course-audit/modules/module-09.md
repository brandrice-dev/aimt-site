# Module 9 — Approved Audit Specification

**Course:** AIMT Head Spa Certification Course
**Student-facing module number:** 9
**Approved module title:** Checkout, Client Closing & Pricing Strategy
**Primary curriculum source:** technical Module 10 (Pricing Strategy), `headspa-mastery.html:6677–6862`
**Source reviewed:** `module-09-source.md`
**External audit:** approved for controlled specification creation (prior task)
**Specification review:** **approved in substance** — five narrow amendments applied plus a saved-state migration-plan requirement (this task, August 24, 2026)
**Audit date:** August 24, 2026 (specification drafted); August 24, 2026 (specification reviewed and amended)
**Status:** **Approved curriculum specification — implementation blocked pending migration-plan approval.** Curriculum and content direction are locked (see "Module 9 core direction — locked" below); the only remaining gate before implementation authority is external review and explicit approval of the saved-state migration plan (`module-09-reorder-migration-plan.md`). This is **not** `Approved for implementation`.
**Production source of truth:** `headspa-mastery.html`

**Specification review corrections (this task, not a reopened audit):** the external reviewer examined the drafted specification itself (not just the source extraction) and approved it in substance, requiring five narrow corrections before it can become implementation authority: (1) resolved a genuine internal contradiction over whether the five existing enhancement examples' old dollar ranges may appear as illustrative student-facing content — they may not; they are source-history evidence only (see "Enhancement price ranges — source-history only" below); (2) replaced clinical-sounding diagnostic terminology describing the price-feedback review process with plain "multi-factor business review" language; (3) qualified the underpricing/burnout language so it states a possible contribution rather than an automatic causal guarantee; (4) made the migration-plan review gate strictly sequential and unambiguous — no reorder code may be written before the migration plan is externally reviewed and approved, full stop, not "reviewed within implementation"; (5) locked the eventual Sanitation-slot completion handoff to explicitly name Module 11 — AI / Modern Practice Tools as the next identity, while being explicit that no live functional route into that nonexistent module may be built. A sixth narrow wording cleanup softened one absolute claim ("damages" → "can disrupt"). None of these corrections reopens or weakens the approved curriculum direction — see "Module 9 core direction — locked" below.

This document converts the approved external audit into the controlling content and technical authority for future Module 9. It does not itself authorize implementation, does not touch any production file, and does not begin the technical reorder it requires — see "Critical technical requirement" below, which is a blocking pre-implementation investigation, not a decision made by this document.

It does not authorize changes to authentication, entitlements, payments, database policies, certificate issuance, Module 8, Module 10's future Sanitation audit, Module 11's future AI curriculum, the Module 12 Final Exam, persistent Cadence threads, the Guided Completion Path interface, Listen Mode, or the monolithic course-file architecture.

Module 8 ends deliberately at the treatment close. Module 9 begins with everything that happens after — reorienting the client, closing the appointment without breaking the relaxation experience, and pricing the business from real numbers rather than pressure or guesswork. This is the first module whose subject is explicitly business judgment rather than technique, so its governing tension is different from every prior module: the existing source material is directionally useful but was written with a sales-psychology voice this course does not want. The audit's job — and this specification's job — is to keep the real business content and remove the manipulation.

---

## Basis for corrections

Unlike Modules 3, 4, and 6 (which required primary medical/dermatological literature to verify clinical claims), Module 9's corrections rest on **curriculum-integrity and scope-accuracy grounds**, not third-party research citations — there is no clinical claim to verify here. Three kinds of evidence support each correction below:

1. **Mathematical fact**, verified directly against the calculator's own code (`calcPrice()`, `headspa-mastery.html:9030–9044`) — the break-even mislabel is not a judgment call, it is a checkable contradiction between a formula and its own output label (see `module-09-source.md` §7a).
2. **Internal consistency with this course's own already-approved standards** — e.g., the old course name and "nearly two decades" Cadence persona claim are corrected here for exactly the same reason they were already corrected in Modules 0–8 (see `00-global-decisions.md`'s "Course name" and Cadence direction sections).
3. **The owner's explicit business-ethics judgment**, recorded in the external audit itself, on where the existing sales-psychology framing crosses from legitimate positioning language into engineered pressure. This document does not re-litigate that judgment; it implements it.

---

## Approved outcomes

By the end of Module 9, the student should be able to:

1. Transition from treatment closing into checkout without abruptly shifting into sales mode.
2. Communicate what was done during the service without diagnosing or exaggerating outcomes.
3. Invite future booking or service options without pressure.
4. Identify the actual cost components required to deliver a Head Spa service.
5. Include full practitioner time — not hands-on treatment time alone.
6. Calculate a target selling price from a chosen margin without confusing margin, markup, and break-even.
7. Use competitor pricing as market context rather than as the primary pricing formula.
8. Design a concise service menu whose differences are easy for a client to understand.
9. Evaluate whether an enhancement genuinely belongs in a client's service plan.
10. Respond professionally when a client says the price felt high.
11. Distinguish among a cost problem, pricing problem, menu problem, positioning problem, delivery problem, or market-fit problem before deciding what to change.

Avoid outcomes that merely say the student will "learn about" pricing or "understand" client closing — every outcome above names something the student can do, decide, or say differently.

---

## Keep unchanged

Preserve the following concepts and technical structures:

- Checkpoint IDs `m10cp1` and `m10cp2` — **do not rename them to `m9cp1`/`m9cp2`** merely because the student-facing module number becomes 9. `m9cp1`/`m9cp2` already belong to Sanitation's own checkpoints in the current persisted-state architecture (`MODULE_CHECKPOINTS['9']`, `headspa-mastery.html:7000`); reusing those IDs for different competencies would corrupt existing `checkpointMeta` semantics. Any ID migration must be explicit, reviewed, and separate from this specification.
- The shared `submitCheckpoint()` → Review-Mode-aware pipeline every other module uses (`headspa-mastery.html:7341`) — no new checkpoint architecture is needed.
- The interactive pricing calculator as a concept and as the module's signature applied tool — corrected, not replaced (see "Pricing calculator — required correction" below).
- The core, evidence-independent business content: real cost components, full practitioner time, cost-first pricing, competitor pricing as context, enhancements as genuine service additions, and professional handling of price feedback.
- Review Mode's unsaved checkpoint-testing behavior.
- The existing `submitCheckpoint(moduleId, cpId, systemPrompt, question, errorMessage)` 5-argument signature — Module 9 should finally pass its own `errorMessage` (see "Checkpoint foundation" below), closing the gap already flagged in `module-09-source.md` §8.

Do not add a third required checkpoint. Do not rename `m10cp1`/`m10cp2`, the calculator's element IDs, or any other stable identifier as a side effect of implementing this specification — identifier changes belong to the reorder migration (see "Critical technical requirement"), not to content corrections.

---

## Remove or replace

Explicitly remove or rewrite the following from the primary source (technical Module 10):

- `$120–150/hr is a sustainable starting point for most markets` — a universal, uncertified regional benchmark. See "Remove the universal hourly benchmark" below.
- `Three tiers. No more.` and the rubric-level claim that "three tiers is optimal — too many options cause clients to choose down" — no basis for one universal service-count rule. See "Menu design" below.
- The Cadence note that the premium option should be framed so a client "would feel like they're leaving something behind by not choosing it" — engineered FOMO. Removed entirely, not softened.
- `If they feel easy to say yes to, they convert` and any other claim that a specific framing technique produces a predictable sales outcome.
- The unqualified `"felt expensive" = positioning problem` framing — replaced with a multi-factor business-review approach to price feedback (see "Price feedback" below).
- Fear/confidence treated as the primary explanation for underpricing — replaced with a broader set of causes, evidence-based and business-grounded.
- The unexplained 30% margin default (`#calcMargin value="30"`, `headspa-mastery.html:6764`) — the student must now choose a margin deliberately.
- The "Minimum price to break even" mislabel (`headspa-mastery.html:9039`) — a confirmed math/label contradiction (see `module-09-source.md` §7a and "Pricing calculator — required correction" below).
- The old course name in `M10.system` ("instructor of HeadSpa Mastery," `headspa-mastery.html:7831`) and the "nearly two decades" Cadence persona claim in `MODULE_GUIDE_SYSTEMS[10]` (`headspa-mastery.html:7849`) — the same corrections already applied to Modules 0–8.
- The shared single-function `M10.system` rubric — replaced with per-checkpoint rubrics, matching Modules 1–8's pattern.
- Enhancement-script language that implies diagnosis (e.g., framing a recommendation around "what the scalp needs") or ignores the contraindication/adaptation judgment taught in Modules 5–6.
- The five existing enhancement examples' old dollar ranges (e.g., "+$20–35") as shipped student-facing content anywhere — lesson, downloadable guide, Cadence, or checkpoints. See "Enhancement price ranges — source-history only" below.

---

## Core module thesis

**Close the experience as intentionally as you opened it. Price from real numbers, not pressure or guesswork.**

Module 9 is a **Business Decision Lab**, not a sales lesson. It should feel like the module where the student stops performing a script and starts reasoning like a business owner — the same shift Module 5 made from "recite the protocol" to "adapt the protocol," applied here to money and client communication instead of technique.

---

## Module 9 core direction — locked

The specification review confirmed the following as approved curriculum direction, **not reconsidered or weakened** by this task's five amendments. This task is a narrow correction pass, not a second external audit:

- Title: **Checkout, Client Closing & Pricing Strategy.**
- Business Decision Lab learning rhythm.
- Relaxation-first closing.
- Client autonomy.
- Financial clarity.
- Real cost + full practitioner time.
- Margin vs. markup (Section 9.3).
- The corrected Cost Base → Target Price calculator.
- No universal `$120–150/hr` benchmark.
- No unexplained 30% margin default.
- No break-even mislabel.
- Competitor pricing as context, not formula.
- No universal three-tier menu rule.
- No premium FOMO framing.
- Enhancements must earn their place.
- No predictable conversion/rebooking claims.
- Multi-factor price-feedback review (see "Amendment 2" correction above — now named without diagnostic terminology).
- **Close Without Pressure** as the only new ungraded interaction.
- `m10cp1` and `m10cp2` preserved as stable competency IDs.
- Per-checkpoint rubrics.
- Cadence as business-decision/client-closing coach.
- Head Spa Enhancement Menu & Positioning Guide as the approved downloadable opportunity.
- Calculator + one ungraded interaction + two checkpoints as the approved interaction density.

---

## Section-by-section approved structure

**9.1 → Close Without Pressure (interaction) → 9.2 → 9.3 → 9.4 → 9.5 → 9.6 → 9.7 → `m10cp1` → 9.8 → 9.9 → `m10cp2` → completion**

### 9.1 — From treatment close to checkout

**Purpose:** Build the connective curriculum that does not currently exist anywhere in the course — the transition from Module 8's single approved closing line into checkout.

**Key teaching points:**

- Module 8 ends with: *"Today I focused a little more on [area or service priority you addressed]. How are you feeling?"* Module 9 teaches what happens after that moment.
- A flexible closing flow, taught as a shape, not a script: **reorient → briefly recap → answer/recommend where relevant → invite future options without pressure → complete checkout.** State explicitly that this is not a rigid or exact universal order.
- Give the client a moment to reorient before speaking further; speak at a normal, calm pace — the client should not go from a quiet service directly into a rapid sales pitch.
- Recap only what was genuinely addressed during the service. Do not diagnose. Do not exaggerate results.
- Do not unload every possible recommendation at once — answer questions clearly, but a recommendation should have a specific reason tied to the service just delivered, not exist because it's on the menu.
- Declining retail, enhancements, or rebooking should not create awkwardness — the closing flow must work cleanly for a client who says no to everything.

**Rebooking:** present as an available next step, not proof the practitioner successfully "closed." Approved framing: *"If the client wants to plan another visit, help them choose the service or timing that makes sense for their goals, preferences, and schedule."* Do not teach a universal treatment frequency merely to manufacture a future booking.

**Checkout mechanics (platform-neutral):** confirm what the client is paying for; communicate the total clearly; process payment through the business's own normal system; provide a receipt/confirmation as appropriate; keep any gratuity presentation neutral if the business accepts gratuity. **Do not** teach a specific POS platform (Square, Stripe, Toast, Vagaro, or any other) — this is a certification course, not software training. **Do not** teach a universal gratuity percentage or imply gratuity is mandatory.

**Content changes:** entirely new — nothing in the current source covers this transition (confirmed in `module-09-source.md` §4–§5: zero existing content on payment methods, gratuity, cancellation/deposit policy, rebooking mechanics, or point-of-sale closeout).

**Before moving on, the student should:** be able to describe the five-part closing shape in their own words and explain why skipping the reorientation step can disrupt the relaxation-first experience the entire course has built toward.

### Close Without Pressure — new ungraded interaction

Placed immediately after 9.1. Full specification below (see "Close Without Pressure — new ungraded interaction").

### 9.2 — Know the real cost

**Purpose:** Preserve and strengthen the existing cost framework, replacing the single `×1.25` universal time multiplier with a fuller, more honest practitioner-time accounting.

**Key teaching points — four practical inputs, taught as a deliberate framework, not a rigid formula:**

1. **Direct / variable service costs** — products, consumables, laundry or disposables where relevant, payment-processing or other directly attributable costs where the business chooses to model them.
2. **Allocated overhead** — rent, utilities, software, insurance, shared supplies, other business overhead. State explicitly that there is no single universally correct allocation method; a student's actual allocation approach is a business decision, not a course requirement.
3. **Practitioner time — broader than treatment time alone.** Relevant time may include setup, consultation, treatment, transitions, cleanup/reset, checkout, and required documentation. Preserve the source's useful underlying principle — a "60-minute service" can require meaningfully more than 60 minutes of practitioner capacity — but **remove the universal `×1.25` multiplier**; teach the student to account for their *own* full time, not apply someone else's ratio.
4. **Desired profitability / margin** — taught as a deliberate business input the student chooses, not a course-prescribed number.

**Content changes:** retain the existing fixed/variable/time-cost concept-grid framing (`headspa-mastery.html:6699–6716`) as a strong teaching device; remove the `×1.25` step from "A simple pricing framework" (`headspa-mastery.html:6725–6731`) and reframe Steps 1–5 as a method rather than a formula that outputs one correct number (see "Remove the universal hourly benchmark" below for Step 1 specifically).

**Before moving on, the student should:** be able to list all four cost components from memory and explain, in their own words, why counting only hands-on treatment time understates true cost.

### 9.3 — Margin vs. markup (new)

**Purpose:** Prevent the common practitioner confusion between markup (calculated from cost) and margin (calculated from selling price) before the student uses the calculator, where this distinction becomes load-bearing.

**Key teaching points:**

- **Markup** is calculated from cost: a 30% markup on a $100 cost is $130.
- **Margin** is calculated from selling price: a 30% margin means 30% of the *selling price* is profit, which requires solving `price = cost / (1 - margin)` — at 30% margin, a $100 cost produces a ~$143 price, not $130.
- State plainly: *"30% markup" and "30% margin" do not produce the same selling price. Know which one you're using — this course's calculator uses margin."*
- This is not an accounting course — the section exists solely to prevent the student from misreading the calculator's output, not to teach broader financial literacy.

**Content changes:** entirely new — no equivalent content exists in the current source.

**Interaction/visual requirements:** a short worked side-by-side example (same $100 cost, both a 30% markup result and a 30% margin result, shown as plain numbers) is sufficient; no interactive component is required for this section.

**Before moving on, the student should:** be able to state which of the two the calculator (9.4) uses, and explain in one sentence why the two terms produce different prices from the same starting numbers.

### 9.4 — Price your service: cost base → target price

**Purpose:** Keep the interactive calculator as the module's signature applied tool, corrected per "Pricing calculator — required correction" below.

**Content changes:** full correction — see the dedicated section below for the exact required behavior, labels, and accessibility requirements. This is the single most technically detailed correction in this specification.

**Before moving on, the student should:** have entered at least one set of real or illustrative numbers and correctly identify, from the calculator's own labels, which number is the cost base and which is the resulting target price.

### 9.5 — Market context, not copycat pricing

**Purpose:** Preserve the source's strongest existing pricing lesson — **competitor prices are context, not your cost structure** — while correcting it against the opposite extreme.

**Key teaching points:**

- A competitor's price may not cover their own actual costs; copying it risks copying a model that's already losing money. Look at the local market only *after* understanding your own economics, not instead of it.
- Market context may legitimately inform client expectations, positioning, local price ranges, service comparison, demand, and business model — it is not irrelevant, just secondary.
- Avoid the opposite extreme: pricing is not taught as though cost alone determines what the market will support. Final price sits at the intersection of **cost structure + service design + capacity + market context + business positioning** — state this explicitly as a closing frame for the section.

**Content changes:** retain the existing "know your numbers first" competitor-pricing caution (`headspa-mastery.html:6734–6738`) largely as-is — it survives the audit unchanged in substance — and add the five-factor intersection framing as new closing content.

**Before moving on, the student should:** be able to explain why checking competitor prices first, before knowing your own costs, is backwards — and also name at least one legitimate use for market context once your own numbers are known.

### 9.6 — Design your menu

**Purpose:** Replace "Three tiers. No more." with a principle the student can actually apply to their own business shape.

**Key teaching points:**

- Remove the fixed rule; replace with: **"Make the menu easy to understand."** A concise menu is generally easier for a client to navigate.
- Two or three clearly differentiated Head Spa options may be a useful structure for some businesses — but the number of services should follow the actual business and protocol design, not a universal rule.
- **Require meaningful differentiation.** Different menu options should change something real: treatment time, massage/bodywork, processing, included enhancements, service scope, sensory work, or another deliberate component.
- **Do not** teach students to engineer an artificial "premium" difference merely to establish an anchor, and do not teach making the higher-priced option feel like the "obvious" choice — this is the specific manipulative framing the audit requires removed (see "Remove or replace" above).
- **Module 8 continuity note, explicit:** Core and Extended are AIMT's own reference-format teaching labels from Module 8's masterclass — they are not required menu names. A business may name and package its own services differently. State this plainly so the student does not mistake Module 8's internal teaching vocabulary for a mandatory client-facing menu structure.

**Content changes:** replace the "Build your menu" section (`headspa-mastery.html:6743–6750`) title and content per the above; remove "Three tiers. No more." verbatim and the Cadence FOMO note (`headspa-mastery.html:6746–6748`) verbatim.

**Before moving on, the student should:** be able to explain what "meaningful differentiation" means using a non-time-based example (e.g., an included enhancement or a different sensory component), not just "the expensive one is longer."

### 9.7 — Enhancements that earn their place

**Purpose:** Preserve the source's useful "enhancement, not automatic upsell" distinction while strengthening the reasoning behind it.

**Key teaching points:**

- An enhancement should have: a distinct purpose; a real service difference; a time effect where applicable; a cost effect; clear client-facing positioning; and an appropriate place in the client journey.
- Recommendations should be based on the established service plan, the client's goals/preferences, practitioner observation *within scope*, product directions, contraindications or modifications already identified (direct continuity with Modules 5–6), training, and available appointment time.
- **Do not** imply "what the scalp needs" — that phrasing crosses into diagnosis. **Do not** recommend an enhancement merely because it exists on the menu. **Do not** claim an enhancement "converts" because of how it is presented.
- Retain the five existing add-on examples' **service concepts, client-positioning structure, and client-facing scripts** (Scalp treatment serum, Extended massage time, Deep conditioning upgrade, Blow dry, Aromatherapy enhancement — `headspa-mastery.html:6752–6756`) — these are otherwise strong and observation-framed. **Do not retain their old dollar ranges as shipped student-facing content** — see "Enhancement price ranges — source-history only" below for the full, unambiguous rule.
- Add an explicit scope cross-reference: an in-service enhancement recommendation must never override a genuine scalp-presentation safety reason (from Module 5/6's adaptation and contraindication judgment) not to add a product. If a presentation calls for restraint, restraint wins over the sale.

**Content changes:** retain the five add-on examples' service concepts, structure, and client-facing script language; **remove the old dollar ranges from the shipped lesson** (see "Enhancement price ranges — source-history only" below — they are source-history evidence, not illustrative or AIMT-recommended student-facing figures); add the scope cross-reference sentence to the section's close.

**Before moving on, the student should:** be able to describe, for one enhancement example, what observation would make it appropriate to offer and what observation would make it inappropriate to offer.

### Checkpoint 1 — `m10cp1`

Placed here because it synthesizes Sections 9.2–9.7: cost awareness, practitioner time, deliberate margin reasoning, and meaningful menu differentiation. See "Checkpoint specification" below.

### 9.8 — When a client says the price felt high

**Purpose:** Replace the unqualified "felt expensive = positioning problem" framing with a multi-factor business-review approach that treats price feedback as genuinely ambiguous evidence — one client comment does not prove one cause. This is ordinary business analysis, not a clinical diagnostic process, and should not borrow diagnostic terminology.

**Key teaching points:**

- Remove the automatic conclusion. "That felt expensive" may indicate: price/market mismatch; unclear expectations; unclear inclusions; poor menu differentiation; weak positioning; a service-delivery mismatch; genuine affordability; an isolated client's preference; a repeated feedback pattern; or — explicitly — that no change is necessary at all. **The practitioner should not diagnose the business problem from one sentence.**
- **In the moment:** acknowledge; stay calm; do not argue; do not immediately discount; do not lecture the client on value; answer a genuine question clearly; preserve client autonomy. Approved model response (explicitly *a* model, not a mandatory script): *"Thank you for telling me. I'm glad you enjoyed the service. Our pricing reflects the time and components included, and I'm happy to explain what was included or help you compare options for a future visit."*
- **Afterward:** review evidence rather than react. Ask: Was the price clear before booking? Were the inclusions clear? Does the price cover the business's real cost structure? Does the menu communicate meaningful differences? Is this feedback recurring? Does the service experience support the intended positioning? Is the price appropriate for the actual market being served? **Do not assume the client is wrong. Do not assume the price is wrong.**

**Content changes:** rewrite the existing "When a client says it feels expensive" section (`headspa-mastery.html:6759–6764`) per the above, replacing the single-cause positioning framing with the multi-factor review checklist.

**Before moving on, the student should:** be able to name at least three distinct possible causes of the same client statement, and articulate the difference between the in-the-moment response and the afterward review.

### 9.9 — Why pricing really goes wrong

**Purpose:** Replace "fear-based pricing" as the primary explanation for underpricing with a broader, more accurate set of causes — this is a required correction, not a stylistic softening (see "Remove fear-based pricing as a universal diagnosis" below).

**Key teaching points:** a practitioner may underprice because of incomplete cost data, poor overhead allocation, inaccurate time assumptions, competitor copying, an intentional launch strategy, market constraints, weak service differentiation, lack of pricing knowledge, *or* fear — fear is one cause among several, not the default explanation. **Confidence is not a financial model.** Preserve the source's useful underlying observation, **stated as a qualified relationship, not a guaranteed outcome**: persistent underpricing *can contribute to* financial strain, unsustainable workload, overbooking, or inconsistent delivery over time. Do not claim underpricing *automatically causes* burnout or service decline — ground the *diagnosis* in business evidence, not psychology alone, and do not overstate the certainty of the consequence either.

**Content changes:** rewrite "The real problem — fear-based pricing" (`headspa-mastery.html:6758–6768`) per the above; retain the substance of the "what underpricing actually looks like" observation but **rewrite it as a qualified contributing relationship, not a causal guarantee** (see the approved key-teaching-points wording above) — the source's current phrasing risks reading as "underpricing automatically causes burnout/decline," which overstates certainty even though the underlying pattern is real and worth teaching; retain the positioning-language word-swap pairs ("basic option" → "core service"; "more expensive" → "extended experience") as legitimate, non-manipulative language guidance — these describe accurate framing, not engineered pressure, and are not on the "remove or replace" list.

**Before moving on, the student should:** be able to name at least three possible causes of underpricing beyond "not enough confidence."

### Checkpoint 2 — `m10cp2`

Placed at the end because it synthesizes price-feedback judgment and client-closing communication — the module's full arc. See "Checkpoint specification" below.

### Completion card

See "Completion and gating" below.

---

## Close Without Pressure — new ungraded interaction

**Working title:** Close Without Pressure

**Placement:** immediately after Section 9.1.

**Purpose:** Test whether the student can preserve the relaxation-first service experience while moving into checkout — the practical, applied version of Section 9.1's taught closing shape.

**Exact student task:** a realistic post-treatment scenario is presented (e.g., a client has just finished an Extended-format service and is sitting up, reorienting). The student is shown several candidate closing responses and selects the one that best preserves the experience while moving toward checkout.

**The strongest response should:**

- acknowledge the client's experience;
- give a concise, truthful recap of what was actually done;
- allow the client a moment to reorient before further conversation;
- offer help with questions or future options rather than pushing them;
- avoid jumping immediately into rebooking, upgrades, or retail.

**Distractors should demonstrate, one issue per distractor (not stacked):**

- immediate sales pressure (jumping straight to rebooking/upsell before the client has reoriented);
- overexplaining (narrating the entire service back to the client instead of a concise recap);
- diagnostic language (stating a conclusion about the client's scalp/hair condition rather than describing what was done);
- stacking several recommendations at once (retail + rebooking + enhancement all offered in one breath);
- awkward urgency (implying the client should decide immediately or lose an opportunity).

**Feedback behavior:** on selection, apply state only to the selected option (matching the established `m5Decide`/`m6Sort`/Module 8 "Protect the Flow" pattern — the correct answer is never pre-highlighted). Feedback is text-based, never color-only, and explains specifically what the chosen response does well or overlooks, referencing the five closing-shape elements from 9.1.

**Retry/reset:** unlimited; changing a selection returns other options to neutral.

**Classification:** **ungraded.** Writes nothing to `APP_STATE`, does not persist between module visits, and does not gate module completion — consistent with the governing interaction standard and with the audit's explicit instruction that the calculator and this interaction must not gate completion.

**Interaction density note:** this is the module's only new ungraded interaction, alongside the calculator. Do not add more interactions simply to increase activity — the audit is explicit that sales games, conversion scoring, simulated revenue rewards, XP, artificial urgency, or multiple redundant closing scenarios are all rejected. Two applied tools (calculator, Close Without Pressure) plus two required checkpoints is the approved density for this module.

---

## Enhancement price ranges — source-history only

**Final authority (resolves a contradiction the specification review found between Section 9.7 and the downloadable-resource section below — both now say the same thing).**

**Preserve:** the five enhancement examples; their service concepts; their client-positioning structure and script language where otherwise approved per Section 9.7.

**Do not preserve in any shipped student-facing surface:** the old dollar ranges themselves (e.g., "+$20–35" for a scalp treatment serum). These figures are **source-history only** — they may remain visible in `module-09-source.md` as extracted evidence of what the pre-audit curriculum said, but they must not appear as AIMT-recommended or illustrative student-facing ranges in:

- the implemented Module 9 lesson (Section 9.7's rendered copy);
- the Head Spa Enhancement Menu & Positioning Guide (the downloadable — see "Downloadable resource opportunity" below);
- Cadence (guide responses or checkpoint rubrics);
- either checkpoint (`m10cp1` or `m10cp2`).

Every actual price the student sees or produces should come from their own numbers, or — only where necessary to teach the math (e.g., the margin-vs-markup worked example in 9.3) — an explicitly labeled hypothetical figure, never a figure presented as AIMT's recommendation.

---

## Remove the universal hourly benchmark

Remove **"$120–150/hr is a sustainable starting point for most markets"** as an AIMT pricing rule (`headspa-mastery.html:6729`, Step 1 of "A simple pricing framework"). AIMT does not have sufficient basis to certify one universal revenue-per-hour benchmark across regions, rent structures, staffing models, commission models, booth rental, solo practice, service mix, local demand, or client demographics.

If an illustrative example is useful anywhere in this module (e.g., in the margin-vs-markup worked example, or as a sample calculator input), the numbers must be **explicitly labeled hypothetical** — e.g., "for example, if your hourly target were $X..." — never presented as a course-certified figure. The lesson teaches the *method* (know your costs, choose a deliberate target, price for full time and margin) — it does not prescribe the student's final price.

---

## Pricing calculator — required correction

Keep the interactive calculator; it remains one of the module's signature applied tools. Rename and reframe it around **Cost Base → Target Price**.

### What must change

1. **Remove the "Minimum price to break even" label entirely.** Per `module-09-source.md` §7a, the current formula `price = cost / (1 - margin/100)` computes a price that includes the student's chosen margin — a margin-loaded target price, not a break-even price. A true break-even price is simply the cost base itself (margin = 0%). This is a confirmed math/label contradiction, not a wording preference.

2. **Display three distinct, clearly labeled values:**
   - **Modeled cost base** — the sum of the cost inputs (product + overhead + time), labeled as a cost, not a price.
   - **Selected target margin** — the percentage the student deliberately entered, displayed back to them.
   - **Calculated target price** — the selling price required by the model to produce the selected margin at the modeled cost base.

3. **Do not pre-fill 30% as an unexplained default.** Require the student to choose or intentionally enter a margin. The `#calcMargin` field's `value="30"` attribute must be removed — an empty/unset margin field, not a silent 30% assumption, is the correct default state.

4. **0% margin must mathematically return the modeled cost base.** This is the built-in check that the calculator's own math now matches its own claims — at margin = 0, `price = cost / (1 - 0) = cost`, which is genuinely the break-even price. Do not special-case this; it should fall out of the corrected formula naturally.

5. **Do not silently convert a blank margin to 30% (or to any other value).** The current fallback (`parseFloat(...) || 30`, `headspa-mastery.html:9034`) must be replaced with explicit handling — a blank or invalid margin should produce a visible prompt to enter a value, not a silent default calculation. See "Calculator accessibility" below for the full validation requirement.

6. **No silent all-zero success state.** An all-blank submission today silently computes and displays `$0` with no distinction from a genuine zero-cost result (`module-09-source.md` §7a). Add a visible, non-error-styled prompt state for "no inputs entered yet" distinct from a computed $0 result.

### What survives unchanged

- The three cost inputs (`#calcProduct`, `#calcOverhead`, `#calcTime`) and their underlying summation into a cost base — this part of the model is accurate and was never in question.
- The calculator's role as the module's primary applied pricing tool — no second calculator or duplicate mechanic should be added.

### Do not

- Do not introduce a second downloadable pricing worksheet — the live calculator is the stronger tool, and the governing downloadable-resource policy already instructs against forcing a redundant download when one tool already serves the need (see "Downloadable opportunity" below).

---

## Calculator accessibility

Per the audit's explicit accessibility requirement and the technical findings recorded in `module-09-source.md` §16:

- Every `<label>` must be programmatically associated with its input (a `for` attribute matching the input's `id` — currently absent on all four fields, confirmed in `module-09-source.md` §7a).
- All four inputs must have accessible names (native `<label for>` association satisfies this; no separate `aria-label` is required once `for` is added).
- Appropriate numeric constraints on all four fields — `#calcTime` currently has no `min`/`max` at all (confirmed in `module-09-source.md` §16) and must gain at minimum a `min="0"`, matching the other three fields.
- Explicit handling of missing/invalid values (see calculator correction item 5 above) — replacing the current silent `|| 0` / `|| 30` fallbacks with a visible prompt state.
- No silent all-zero success state (see calculator correction item 6 above).
- The calculator result region must be announced using an appropriate live region — `#calcResult` currently has no `aria-live` at all (confirmed in `module-09-source.md` §16); add `aria-live="polite"`.
- Keyboard operable — the four native `<input type="number">` fields and the "Calculate" button are already natively keyboard-operable; no change needed there beyond the labeling fix above.
- Phone-friendly, no horizontal overflow — verify at 375×812 as part of implementation validation.

---

## Checkpoint foundation

Bring Module 9 onto the approved Modules 5–8 checkpoint foundation, correcting the gaps `module-09-source.md` §8 and §16 confirmed present in the current technical Module 10 checkpoints:

- Exact displayed/evaluated question parity (verified programmatically, not by inspection) — already true today (`M10.questions`, `headspa-mastery.html:7826–7830`) and must remain true.
- Checkpoint-specific systems/rubrics — `M10.systems.m10cp1` / `M10.systems.m10cp2` replace the single shared `M10.system` function.
- Voice input where intended — already present, unchanged.
- Enter submits / Shift+Enter creates a new line — already present via `m10cpKey`, unchanged.
- Loading state — already present via the shared `submitCheckpoint()` pipeline, unchanged.
- **Module-appropriate network-error text** — `submitM10CP` currently passes no 5th `errorMessage` argument (confirmed in `module-09-source.md` §8); add one. Approved text: *"Cadence couldn't review your pricing. Check your connection and try again."*
- **`aria-live="polite"` on the response region** — currently absent; the region also currently uses class `cp-response` rather than the corrected `cp-res` class Modules 1, 3, 5, and 8 already use (confirmed in `module-09-source.md` §16). Align to the current foundation pattern.
- **Explicit accessible labels** — `aria-label="Speak your answer"` on both voice buttons and `aria-label="Send response to Cadence"` on both submit buttons, currently absent on both (confirmed in `module-09-source.md` §16).
- Review Mode's unsaved behavior — already correctly wired via the shared pipeline; no change needed.
- Previously passed state preserved where technically safe — see "Critical technical requirement" below for how this interacts with the reorder.
- Competency-based completion — both checkpoints must pass; no read-percentage minimum.

Do not fail students for grammar, spelling, concise wording, natural spoken language, or non-native English phrasing.

---

## Checkpoint specification

### `m10cp1` — Pricing and menu reasoning

**Exact question (displayed and evaluated, byte-identical):**

> Build or evaluate a Head Spa service menu for your business. For each service, name what it includes and its price. Then explain the real costs and practitioner time behind the pricing and why the differences between the options are clear to a client.

**Competency assessed:** the student can build a coherent, differentiated service menu grounded in real cost and time reasoning — not a memorized formula or an arbitrary tier count.

**Pass when the answer demonstrates, in any natural wording:**

- real cost awareness (product/consumable costs where relevant, overhead);
- full practitioner time, not treatment time alone;
- deliberate profitability/margin reasoning (a chosen number with some rationale, not a default accepted uncritically);
- clear, meaningful differences between the service options offered;
- prices supported by business logic rather than an unexplained figure;
- competitor prices not used as the sole pricing formula.

**Do not require:** one specific dollar amount; the removed $120–150/hour figure; a 30% margin; exactly three services; exact terminology (e.g., the student does not need to say "margin" verbatim if the reasoning is sound).

**Incomplete when:** the answer lists prices with no cost/time reasoning behind them, or explains the reasoning but never states what makes the options different from a client's perspective.

**Focused revision examples (one per response, not both):**

- "Your cost and time reasoning is solid. Add what makes each option genuinely different for a client — not just the price."
- "Your menu is clearly differentiated. Add the real cost and practitioner-time reasoning behind at least one price."

**Immediate correction triggers:** cites the removed $120–150/hr figure as a required or "correct" benchmark; cites one of the source's historical enhancement dollar ranges (e.g., "+$20–35") as a required or AIMT-recommended figure rather than reasoning from the student's own numbers; states a specific price as the only right answer; treats a client choosing a lower-priced option as a failure or something to be prevented through framing; recommends copying a competitor's price without any own-cost reasoning.

**Use a checkpoint-specific rubric** (`M10.systems.m10cp1`) — see "Approved Cadence behavior" below for its content requirements.

### `m10cp2` — Price feedback and client closing

**Exact question (displayed and evaluated, byte-identical):**

> At checkout, a client says, "I loved the service, but the price felt high." What would you say in the moment, and what would you review afterward before deciding whether anything about your pricing, menu, or positioning should change?

**Competency assessed:** the student can respond to price feedback calmly and non-defensively in the moment, and reason about it as ambiguous business evidence afterward rather than jumping to a conclusion.

**Pass when the answer demonstrates, in any natural wording:**

- acknowledging the client;
- calm, non-defensive communication;
- no immediate discount reflex;
- no pressure or guilt directed at the client;
- no argument that the client simply failed to understand the value;
- an appropriate explanation if the client asks a genuine question;
- recognition that several distinct business factors may need review, not a single assumed cause;
- willingness to look for a *pattern* across clients rather than drawing a conclusion from one comment.

**Strong answers may mention (not all required):** cost structure, the actual price, client expectations, menu clarity/inclusions, positioning, service delivery, market fit, repeated client feedback.

**Do not require:** every listed factor; a specific number of "afterward" review questions; that the student conclude the price should or should not change.

**Incomplete when:** the in-the-moment response is calm and professional but the "afterward" reasoning jumps to a single assumed cause, or the afterward reasoning is thoughtful but the in-the-moment response is defensive, discounts immediately, or argues with the client.

**Focused revision examples (one per response, not both):**

- "Your in-the-moment response is calm and appropriate. Add what you would actually review afterward before deciding anything should change."
- "Your afterward reasoning considers several real factors. Add what you would say to the client in the actual moment."

**Immediate correction triggers:** offers an immediate discount as the default response; argues with or lectures the client about value; concludes with certainty from one comment that the price is wrong (or that it definitely isn't); treats the client's feedback as something to be talked out of or overridden through persuasion rather than genuinely considered.

**Use a checkpoint-specific rubric** (`M10.systems.m10cp2`).

### Are both checkpoints necessary?

**Yes.** `m10cp1` tests constructive business reasoning (building a menu from real numbers); `m10cp2` tests reactive judgment under a specific social/business pressure (a client pushing back at checkout). These are genuinely different competencies — collapsing them into one checkpoint would lose one or produce a single overloaded question no focused rubric could grade cleanly.

---

## Approved Cadence behavior

### New role

Cadence's Module 9 role: **business-decision and client-closing coach.** Cadence should help students distinguish, before suggesting any change: **cost problem → pricing problem → menu problem → positioning problem → service-delivery problem → market-fit problem.**

### Guide system requirements

`MODULE_GUIDE_SYSTEMS[9]` (technically `[10]` until the reorder — see "Critical technical requirement") must:

- open with the corrected, current course-name framing already used in Modules 0–8 (e.g., "You are Cadence, AIMT's curriculum-grounded guide for the Head Spa Certification Course...") — **remove** "a mentor built from nearly two decades in the head spa industry" entirely;
- frame the student's current module as business-decision reasoning: cost, pricing, menu, positioning, service-delivery, and market-fit as distinct categories to check before recommending a change;
- reinforce that competitor prices are context, not a formula;
- reinforce full practitioner time, not treatment time alone;
- reinforce that price feedback is not automatically a positioning problem.

### Checkpoint rubric requirements

`M10.systems.m10cp1` and `M10.systems.m10cp2` (replacing the single shared `M10.system`) must each:

- open with the same corrected course-name framing (**remove** "instructor of HeadSpa Mastery," `headspa-mastery.html:7831`);
- reference only this specification's approved key concepts for that specific checkpoint — not the removed universal benchmark, not the removed FOMO framing, not the removed fear-as-primary-cause diagnosis.

### Prohibited content — remove entirely

- "nearly two decades" persona claim;
- old "HeadSpa Mastery" course identity;
- guaranteed conversion language ("if they feel easy to say yes to, they convert" or equivalent);
- guaranteed rebooking language;
- "premium should feel obvious" / FOMO framing;
- any claim that confidence alone solves pricing resistance;
- citing the pre-audit source's specific historical enhancement dollar ranges (e.g., "+$20–35") as an AIMT-recommended or illustrative figure — Cadence should reference only the student's own entered numbers or an explicitly hypothetical figure, per "Enhancement price ranges — source-history only."

### Out of scope for Cadence

Cadence must not provide: tax advice; legal advice; state-specific pricing compliance guidance; bookkeeping advice presented as professional accounting guidance. See "Financial and legal scope" below for the corresponding student-facing boundary note.

### Approved quick prompts

1. `How do I know what my service really costs?`
2. `How do I make my menu easier to understand?`
3. `What do I say when someone thinks the price is high?`

(All three replace the current `MODULE_QUICK_PROMPTS[10]` set, which currently reads "How do I price my anchor service?", "What add-ons convert best?", and "How do I respond when someone says it is expensive?" — the second prompt in particular invites exactly the conversion-framing this specification removes.)

Persistent Cadence threads remain deferred, per `00-global-decisions.md`.

---

## Financial and legal scope

Do not turn Module 9 into an accounting or tax course. A short boundary note is sufficient, placed near the calculator (Section 9.4) or the module's close:

> The pricing calculator is a planning tool. A business may also need to account for items such as taxes, payroll burden, payment-processing costs, insurance, locally required charges, and other operating expenses, depending on business structure and jurisdiction. AIMT does not prescribe state-specific tax treatment or business/legal structure.

This note is descriptive, not a disclaimer wall — one placement is sufficient; do not repeat it at every section.

---

## Interaction density

Approved: the pricing calculator; one **Close Without Pressure** ungraded interaction; two required checkpoints. That is sufficient.

Do not add: sales games; conversion scoring; simulated revenue rewards; XP; artificial urgency; multiple redundant scenarios beyond the one approved interaction.

---

## Signature learning moment

**Price a service from the inside out.**

The student should experience the difference between *"What are other people charging?"* and *"What does this actually cost me to deliver, what price supports the business, and can the client understand what they're paying for?"* The corrected calculator (Section 9.4) plus `m10cp1`'s menu-and-reasoning checkpoint should make this shift visible and demonstrable, not just stated.

---

## Downloadable resource opportunity

**Recommended.**

**Title:** Head Spa Enhancement Menu & Positioning Guide

**Practical value:** Section 9.7's five enhancement examples already constitute real, reusable, treatment-room-relevant content — a consultation-room reference a practitioner would want to glance at rather than reopening the full lesson. This matches the governing downloadable-resource policy's bar for a genuinely useful download (repeated practical value, a decision tool, a quick reference).

**Suggested fields (per enhancement entry):** enhancement name; what it adds; best-fit situation; when it does not make sense; added treatment time; business cost considerations; **student-entered price** (not a certified AIMT figure); client-facing explanation; best point in the client journey to offer it; scope/training/product-direction note.

**Do not populate with the source's old dollar ranges.** Per "Enhancement price ranges — source-history only" above, the pre-audit price ranges (e.g., "+$20–35" for a scalp treatment serum) are source-history evidence only — they may inform the guide's *structure* (which fields to include) but must not appear anywhere in the shipped guide as an AIMT-recommended, illustrative, or default figure. Every price field the student sees in the guide should be their own entered number.

**Format:** single-page or short multi-page PDF, printable and mobile-viewable, editable/fillable where practical.

**Lesson placement:** referenced near Section 9.7, alongside the completion card — not embedded inline.

**Future centralized Resources Library location:** business/pricing reference category.

**Not recommended as a second resource:** a static pricing worksheet. The corrected, live `calcPrice()` calculator already performs that job, and does it better (no download friction, always current). One resource — the Enhancement Guide — is sufficient.

This resource is not created or linked by this specification. Production remains deferred, matching the existing Module 5/6 downloadable-decision precedent and the governing downloadable-resource policy (selective, not mandatory).

---

## Guided completion structure

**Estimated attentive learning time:** 25–35 minutes for the instructional content (9.1 through 9.9, including the new closing/margin-vs-markup content).

**Estimated checkpoint/calculator time:** 15–25 minutes, depending on whether the student uses real business numbers or illustrative ones.

**Suggested hands-on practice:**

1. Price one real or planned service using the corrected calculator with the student's own numbers.
2. Review the student's current (or planned) menu for clarity and meaningful differentiation.
3. Practice one post-treatment closing conversation aloud, using the 9.1 closing shape.

Not a required progress gate in the current implementation.

**Competency demonstrated:** the student can close a Head Spa appointment professionally and price/menu the service using real business reasoning rather than unsupported formulas or sales pressure.

**Earlier concepts to revisit:** Module 8's treatment close and approved closing script; Module 5/6's contraindication and adaptation judgment (directly relevant to enhancement recommendations); Module 8's service-format design (Core/Extended as reference labels, not required menu names).

**Suggested course-path position:** immediately after Module 8, before Module 10 (Sanitation & Reset Systems) — see "Critical technical requirement" below for why this ordering is currently a blocking technical question, not yet a settled fact in the codebase.

---

## Listen Mode notes

**Narration-suitable:** client-closing principles (9.1); pricing philosophy and the four cost inputs (9.2); the margin-vs-markup distinction (9.3, though the worked numeric example benefits from a visual-review cue); market-positioning discussion (9.5); menu-design guidance (9.6); enhancement guidance (9.7); price-feedback guidance (9.8); the underpricing-causes discussion (9.9).

**Screen-required content:** the pricing calculator (Section 9.4, numeric input and output); the Close Without Pressure interaction; both checkpoints; the margin-vs-markup worked numeric example (9.3).

**Video-only content:** none — no video component exists in this module's source material.

Audio-only completion must not prove competency — checkpoints still require typed or spoken free-text response either way.

---

## Completion and gating

Module 9 completion requires: `m10cp1` passed; `m10cp2` passed. The calculator and the Close Without Pressure interaction do not gate completion — consistent with the governing rule that ungraded interactions never write progress or gate completion.

**Next-module handoff:** Module 10 — Sanitation & Reset Systems. Do not route directly to course completion (the current technical Module 10 completion card's stale "Up next — Course completion" text, confirmed in `module-09-source.md` §3, must be corrected as part of implementation).

Review Mode remains unsaved.

---

## Critical technical requirement — module reorder and saved-state migration

**This is a blocking pre-implementation investigation requirement, not a decision made by this specification.** It must be resolved, reviewed, and explicitly documented before any implementation task touches `headspa-mastery.html` or `assets/js/headspa-state.js` for this module.

### Required sequence — strictly ordered, no ambiguity

The specification review found a timing contradiction between this section (which correctly required review before reorder code) and an earlier version of "Implementation notes" (which described migration-plan review as happening "within implementation"). That ambiguity is resolved here, once, as the single governing sequence for the rest of this document:

1. Finalize the Module 9 curriculum specification (this document).
2. Produce the saved-state migration plan (`module-09-reorder-migration-plan.md`).
3. External review and **explicit approval** of the migration plan.
4. **Only then** may production implementation/reorder work begin.
5. Static/mocked validation of the implementation.
6. Manual QA.
7. Approval.

**No production reorder code may be written before step 3 clears.** Every other reference to migration-plan review anywhere in this specification — including "Implementation notes" and the acceptance criteria — means step 3 of this sequence and nothing else. There is no interpretation under which the migration plan is reviewed "during" or "as part of" implementation; review and approval are steps 2–3, strictly prior to step 4.

### The constraint, verified directly against the current architecture

The current technical/persisted-state architecture is more tightly coupled to numeric module position than a simple relabeling can accommodate. Verified by direct code inspection during this specification task:

1. **Module unlock order is strictly sequential by numeric technical ID — there is no independent display-order concept.** `assets/js/headspa-state.js:550`: `mod.unlocked = i === 0 || this.isModuleComplete(i - 1)`. `canAccessModule()` (`headspa-state.js:740–748`) and `wouldBeLockedWithoutReview()` (`headspa-state.js:753–758`) both gate purely on `isModuleComplete(id - 1)`. **This means a genuine reorder — reaching Pricing/Closing content before Sanitation content — requires the Pricing content to physically occupy the lower numeric technical slot.** A label-only swap (changing `MODULE_TITLES[9]`'s text to describe Pricing while `module9Wrap` still contains Sanitation's actual HTML) is not architecturally possible without inventing a new display-order abstraction that does not exist anywhere in the codebase today — and inventing one is a significantly larger, riskier change than a direct content/slot swap.

2. **Which checkpoint IDs are "required" for a given slot is driven by a separate, swappable map, not hardcoded to content.** `MODULE_CHECKPOINTS` (`headspa-mastery.html:6990–7003`) currently reads `'9': ['m9cp1', 'm9cp2']` and `'10': ['m10cp1', 'm10cp2']`. `getRequiredCheckpointIds()` (`headspa-state.js:580–584`) reads this map by slot number. This is the mechanism that makes preserving `m10cp1`/`m10cp2` as unrenamed checkpoint IDs *while* moving their content to slot 9 technically coherent: swapping the map's two entries (`'9': ['m10cp1','m10cp2']`, `'10': ['m9cp1','m9cp2']`) repoints slot 9's completion requirement to the Pricing checkpoints without renaming any checkpoint ID string.

3. **Persisted student progress is keyed by numeric slot as a string, not by content identity.** `createDefaults()` (`headspa-state.js:183–187`) builds `progress[String(i)]` for each technical module index; `setCheckpointResult`, `checkpointMeta`, `complete`, and `unlocked` all live inside that per-slot object (`createModuleProgress()`, `headspa-state.js:163–181`). **A student (including QA/Review Mode local state, and — pre-launch — potentially early real students once the site is live) who has any existing `progress["9"]` or `progress["10"]` data has that data keyed to the *current* content assignment.** If the reorder physically swaps content between slots 9 and 10 without also migrating the corresponding progress objects, a returning student's old Sanitation-slot completion state would incorrectly appear to apply to the new Pricing-slot content occupying that position (or vice versa) — exactly the risk the external audit's §28 flags: *"a student who previously completed old technical Module 9 Sanitation... appear[s] to have completed new Module 9 Pricing—or... old Pricing completion... satisf[ies] future Sanitation."*

### What a correct migration must do (for the implementation task to design and have reviewed, not for this specification to build)

A structurally sound migration — consistent with `MODULE_CHECKPOINTS` swapping in item 2 above — would need to:

- Swap the `MODULE_CHECKPOINTS['9']` / `MODULE_CHECKPOINTS['10']` array values (not the checkpoint ID strings themselves).
- Swap the two slots' actual HTML content (`module9Wrap` ↔ `module10Wrap`), understanding that this will leave slot 9's markup containing `m10cp1`/`m10cp2`-prefixed element IDs and slot 10's markup containing `m9cp1`/`m9cp2`-prefixed element IDs — a real, disclosed mismatch between wrapper number and checkpoint-ID prefix that must be documented as intentional in the implementation's own commit/log record, not left looking like an unexplained bug for a future maintainer.
- Swap the two slots' entire persisted `progress["9"]` / `progress["10"]` objects (not just the `complete` flag) for any existing saved state, so a returning student's actual checkpoint answers and pass/fail history travel with the correct content.
- **Recompute, never blindly copy, the `complete`/`unlocked`/`completedAt` fields after any swap** — `reconcileModuleState()` (`headspa-state.js:586–605`) already derives `complete` from `checkpointMeta` cross-referenced against `getRequiredCheckpointIds()`, so calling it for both slots after a swap is the self-correcting mechanism, not a blind copy of the old `complete` boolean.
- Swap `MODULE_TITLES['9']`/`['10']` text and every "up next" completion-card handoff string that currently assumes the old order (Module 8's completion card was already corrected to preview the new Module 9 identity in a prior task — see `00-aimt-current-course-status.md` — but technical Module 10's own completion card still says "Up next — Course completion" and must be corrected to point at the relocated Sanitation content).
- Fail closed rather than falsely unlocking new content — if any part of this migration cannot be verified safe for a given persisted-state shape, the implementation must not guess a permissive default.

### Explicit stop condition

**If the existing state engine cannot safely support this reorder within the scope of the Module 9 implementation task, the implementation task must stop and report before writing a destructive migration.** This specification does not authorize a permissive fallback, a best-effort migration, or silently discarding existing progress data as an acceptable resolution. This is not optional polish — it is the single highest-risk item in implementing this specification, because it is the only correction here that can silently corrupt a real student's saved progress rather than merely being wrong curriculum content.

---

## Structural reindex boundary

A controlled structural move is authorized **only** as required to place Checkout, Client Closing & Pricing Strategy in the student-facing Module 9 position, per "Critical technical requirement" above.

- Existing Sanitation curriculum may be moved intact into the student-facing Module 10 slot as a structural dependency of this move.
- **Do not** externally audit, rewrite, or otherwise substantively touch Sanitation's own curriculum content during Module 9 implementation — it moves as-is; its own audit is a separate, later task.
- **Do not** begin any AI/Modern Practice Tools (future Module 11) curriculum work during this task — it does not yet exist as a technical module and is out of scope entirely. Sanitation's own relocated completion card (see acceptance criterion 22) may **name** Module 11 as the locked next course identity, but must not build a live functional route into it — no working launch control, no placeholder content page — since no gate or content exists for it yet.
- **Do not** touch technical Module 11 (Course Completion & Certification) beyond what the slot-swap mechanically requires (it is not involved in the 9/10 swap and should be unaffected) — its content remains reserved for the separate, later completion/certificate-flow audit named in the master instructions.

---

## Accessibility

Use the established, currently-approved course foundation (confirmed against Module 8's checkpoint markup as the most recently corrected reference — see `module-09-source.md` §16):

- Checkpoint live regions (`aria-live="polite"` on the response container).
- Button accessible names (`aria-label` on voice and submit buttons).
- Calculator label/input associations (`for`/`id` pairing on all four fields).
- Calculator result announcement (`aria-live="polite"` on `#calcResult`).
- Visible focus on every interactive control, including the new Close Without Pressure interaction's response options.
- Full keyboard operability for the calculator, the checkpoints, and the new interaction.
- Mobile sizing and touch targets — verify at 375×812.
- No horizontal overflow anywhere in the module, including the calculator's four-field grid.

Semantic meaning must not rely on color alone anywhere in this module.

---

## Remove/replace list (consolidated)

Explicitly remove or rewrite, cross-referenced to where each is specified above:

1. `$120–150/hr` universal benchmark — see "Remove the universal hourly benchmark."
2. "Three tiers. No more." — see Section 9.6.
3. "Three tiers is optimal" rubric claim — see "Approved Cadence behavior."
4. "Premium option should feel obvious" — see Section 9.6 and "Remove or replace."
5. "Leaving something behind" FOMO language — see "Remove or replace."
6. "If they feel easy to say yes to, they convert" — see "Remove or replace."
7. Universal "felt expensive = positioning problem" framing — see Section 9.8.
8. Fear/confidence as the primary explanation for underpricing — see Section 9.9.
9. Unexplained 30% margin default — see "Pricing calculator — required correction," item 3.
10. Break-even mislabel — see "Pricing calculator — required correction," item 1.
11. Old "HeadSpa Mastery" identity — see "Approved Cadence behavior."
12. "Nearly two decades" Cadence persona — see "Approved Cadence behavior."
13. Shared one-rubric-for-both-checkpoints architecture — see "Checkpoint foundation."
14. Enhancement recommendations that imply diagnosis or ignore adaptation/scope — see Section 9.7.
15. The five enhancement examples' old dollar ranges as shipped student-facing content in the lesson, downloadable guide, Cadence, or checkpoints — see "Enhancement price ranges — source-history only."

---

## Preserve list (consolidated)

Preserve and improve, cross-referenced to where each is specified above:

- Real-cost framework — Section 9.2.
- Fixed / variable / time-cost thinking — Section 9.2.
- Full practitioner-time concept (corrected away from the universal `×1.25` multiplier) — Section 9.2.
- Cost-first pricing — Section 9.2, 9.5.
- Competitor pricing as secondary context — Section 9.5.
- Calculator as an applied tool (corrected) — Section 9.4, "Pricing calculator — required correction."
- Clear menu differentiation (corrected away from a fixed tier count) — Section 9.6.
- Enhancements as meaningful additions rather than automatic upsells — Section 9.7.
- Professional response to price feedback (corrected away from a single-cause diagnosis) — Section 9.8.
- Existing pricing checkpoint IDs (`m10cp1`/`m10cp2`) — "Keep unchanged."
- Review Mode unsaved behavior — "Keep unchanged."
- Shared course checkpoint/accessibility foundation — "Checkpoint foundation," "Accessibility."

---

## Acceptance criteria

Implementation is not complete until all of the following are verifiable. Items 1–14 are content/UI corrections; items 15–24 are the reorder/migration requirement, which is the highest-risk category and must be verified with particular care.

1. Sections render in the order 9.1 → Close Without Pressure → 9.2 → 9.3 → 9.4 → 9.5 → 9.6 → 9.7 → `m10cp1` → 9.8 → 9.9 → `m10cp2` → completion, with no gap or renumbering error.
2. The string "$120–150" (and any other specific universal hourly figure presented as an AIMT benchmark) does not appear anywhere in the module's rendered copy.
3. "Three tiers. No more." and "three tiers is optimal" do not appear anywhere in rendered copy or in `M10.systems.m10cp1`'s rubric text.
4. The Cadence FOMO note ("...would feel like they're leaving something behind...") no longer exists anywhere in the file.
5. "If they feel easy to say yes to, they convert" no longer exists anywhere in the file.
6. The "felt expensive" section (9.8) presents multiple possible causes, not a single automatic conclusion — verified by direct text inspection.
7. The underpricing section (9.9) presents multiple possible causes including but not limited to fear/confidence — verified by direct text inspection.
8. `#calcMargin` has no `value` attribute pre-filling 30% (or any other number).
9. `calcPrice()`'s output no longer contains the string "break even" anywhere; the result region displays cost base, selected margin, and target price as three distinct labeled values.
10. Entering `margin = 0` with any nonzero cost inputs produces a target price mathematically equal to the cost base (verified by direct calculation, not just visual inspection).
11. A blank or non-numeric margin input produces a visible prompt, not a silent computed result.
12. An all-blank calculator submission produces a visible "no inputs yet" state, not a silently displayed `$0`.
13. All four calculator `<label>` elements have a `for` attribute matching their paired input's `id`; `#calcResult` has `aria-live="polite"`; `#calcTime` has a `min` attribute.
14. `M10.system`/`MODULE_GUIDE_SYSTEMS[9]` (or `[10]`, per the reorder's final slot — see items 15–24) no longer contain "HeadSpa Mastery" or the "nearly two decades" claim; `M10.systems.m10cp1` and `M10.systems.m10cp2` exist as separate rubrics and the single shared `M10.system` function no longer exists; `submitM10CP` passes the approved module-specific `errorMessage` argument; both checkpoints' voice/submit buttons carry the approved `aria-label`s and both response regions carry `aria-live="polite"` using the `cp-res` class (not `cp-response`).

### Reorder / migration acceptance (highest risk — verify with particular care)

15. Steps 1–3 of "Critical technical requirement" → "Required sequence" are complete — a documented migration plan exists and was **explicitly approved by external review** — before step 4 (any code implementing the reorder) begins. This is a hard precondition, not a parallel or overlapping task.
16. `MODULE_CHECKPOINTS['9']` resolves to the Pricing/Closing checkpoint IDs (`m10cp1`, `m10cp2`) and `MODULE_CHECKPOINTS['10']` resolves to the Sanitation checkpoint IDs (`m9cp1`, `m9cp2`) post-reorder — checkpoint ID strings themselves are unchanged from their pre-reorder names.
17. `MODULE_TITLES['9']` reads the new Module 9 identity (Checkout, Client Closing & Pricing Strategy) and `MODULE_TITLES['10']` reads Sanitation & Reset Systems.
18. A fresh student (no existing `progress` data) who completes slot 9 sees Pricing/Closing content and Pricing/Closing checkpoints, and unlocking slot 10 reveals Sanitation content — verified end-to-end.
19. A simulated **pre-reorder** saved-state fixture (representing a student who had completed old technical Module 9 Sanitation, old technical Module 10 Pricing, neither, or both) is constructed and run through the migration; the resulting post-reorder state is verified by direct inspection to correctly reflect that student's actual demonstrated competencies under the *new* slot assignment — not a blind carry-over of the old `complete` booleans.
20. No fixture produces a state where a student appears to have completed content they never actually engaged with (fail-closed verified, not just fail-open avoided).
21. Module 8's completion-card handoff (already corrected in a prior task to preview the new Module 9 identity) still resolves correctly to the reordered slot 9.
22. **Corrected during specification review — this criterion previously mislabeled which completion card it meant.** Two distinct completion-card corrections are required, not one: (a) Pricing's own completion card (currently technical Module 10, relocating to slot 9) currently says "Up next — Course completion" (`headspa-mastery.html`, Module 10's `lc-next` markup) — per "Completion and gating" above, this must instead hand off to Module 10 — Sanitation & Reset Systems, the module now immediately following it. (b) Sanitation's own completion card (currently technical Module 9, relocating to slot 10) currently says "Up next — Module 10 / Pricing strategy, menu design..." — this is now stale after the reorder and must be corrected to hand off to **Module 11 — AI / Modern Practice Tools** by name, per the locked future course sequence. Because Module 11 does not exist as a technical module yet, this handoff must **not** create a live functional route (e.g., no working "Start Module 11 →" button that opens content) — it may name Module 11 as the next course identity while remaining visibly locked/unavailable until Module 11 is actually built and gated, consistent with how the course already communicates an upcoming-but-unbuilt module elsewhere.
23. Regression: Modules 0–8 are confirmed byte-identical in content and unaffected in checkpoint/progress state after the reorder.
24. `git diff --check` and a full inline-`<script>` syntax check (`node --check` per block, matching the validation pattern used for every prior module) both pass on the actual implementation changeset.

---

## Distinct learning rhythm

Compared to Module 8 (technique-led, video masterclass, minimal interaction density) and the pre-audit source's own zero-scenario-interaction density (`module-09-source.md` §3: "its interaction density is effectively zero beyond the calculator and the two checkpoints"):

**Module 9 is decision-led, not technique-led.** Its dominant learning mode is applying a numeric/business framework to the student's own real or planned business, and rehearsing a specific social moment (price pushback) under calm, non-defensive judgment.

- **Interaction density:** light-to-moderate and deliberate — the calculator (apply a framework to real numbers) and Close Without Pressure (decide/communicate under a specific social pressure) are each doing a distinct job; no interaction exists merely to increase activity.
- **Checkpoint placement:** two-stage, at natural competency boundaries — `m10cp1` after the full cost/pricing/menu/enhancement teaching (9.2–9.7), `m10cp2` after the price-feedback and underpricing-causes teaching (9.8–9.9) — mirroring the "checkpoint after the content it tests" principle already used in Modules 6 and 8.
- **Where independent reasoning happens:** the calculator (the student's own numbers, not a worked example), Close Without Pressure, and both checkpoints.
- **Where Cadence adds value:** distinguishing cost/pricing/menu/positioning/delivery/market-fit problems from each other — a diagnostic-reasoning role distinct from Module 8's service-flow coaching role.
- **Curiosity/payoff structure:** "price a service from the inside out" — the shift from copying competitor numbers to deriving a defensible price from the student's own real costs is the module's central reveal, mirroring how Module 6's "not two conditions, one spectrum" reveal reframes a familiar assumption.
- **What prevents this from feeling like a repeat of Module 8:** Module 9 is the course's first module about money and business judgment rather than physical technique — its signature tension is honesty (real numbers, real client communication) rather than skill execution.

---

## Implementation notes

- This specification does not resolve the technical reorder — see "Critical technical requirement" for the full blocking investigation this implementation must complete and have reviewed before writing any migration code.
- The five existing enhancement examples' old dollar ranges (Section 9.7) are source-history only — see "Enhancement price ranges — source-history only" for the complete, unambiguous rule. They may inform the downloadable Enhancement Guide's structure but must not appear anywhere in the shipped module, the downloadable, Cadence, or either checkpoint as an AIMT-recommended or illustrative figure — every price the student sees in the lesson, calculator, guide, or menu checkpoint should be their own entered number or an explicitly labeled hypothetical.
- The margin-vs-markup worked example (9.3) should reuse whatever hypothetical cost figure the implementation settles on elsewhere in the module for consistency, rather than introducing a third unrelated example number.
- Do not begin Module 10's (Sanitation) own external audit as a result of implementing this specification — its content moves intact per "Structural reindex boundary" and receives its own audit later.
- Do not begin any Module 11 (AI / Modern Practice Tools) curriculum work as a result of implementing this specification — it does not exist yet.
- Do not implement production Module 9 in the same task that reviews/accepts this specification — per the master instructions' module lifecycle, specification acceptance and implementation are separate, sequential steps. The reorder's migration plan (see "Critical technical requirement" → "Required sequence") must be externally reviewed and **explicitly approved before implementation begins** — this review happens strictly prior to any reorder code being written, never "within" or "during" implementation, and never folded silently into a single implementation pass.
