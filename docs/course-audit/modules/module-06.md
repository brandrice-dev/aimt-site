# Module 6 — Approved Audit Specification

**Course:** AIMT Head Spa Certification Course
**Module:** 6
**Approved module title:** Conditions & Disorders
**Source reviewed:** `module-06-source.md`
**Audit date:** August 8, 2026 (initial audit); **re-audited August 8, 2026** — see "Re-audit corrections" note below
**Status:** Approved for controlled implementation
**Production source of truth:** `headspa-mastery.html`

This document is the approved implementation specification for Module 6. It replaces the empty external-audit scaffold and becomes the controlling Module 6 content authority.

**Re-audit corrections (same-day, pre-push):** four issues were corrected before this specification's commit was pushed: (1) the "10% per 1.8°F" sebum/temperature statistic was re-examined against its primary source's actual limitations and **removed** (not merely hedged further) — see "Required corrections" #9; (2) the ketoconazole OTC/prescription evidence was upgraded from commercial retail sources to primary DailyMed/FDA labeling, and the module's product-recommendation copy now carries an explicit "this is not a diagnosis or a prescription" scope statement — see "Required corrections" #7 and "Research and evidence sources" #5; (3) the visual asset plan was re-opened and now gives each of the four existing placeholder slots an explicit, final disposition (two replaced with a required non-diagnostic illustration, two removed) rather than an open-ended future recommendation — see "Visual asset plan"; (4) interaction density was re-checked against the governing learning-rhythm standard, and two of the four original interactions (the cycle-step selector and the trigger accordion) were simplified to static content because they revealed information without requiring judgment — see "Approved interactions — full audit." No curriculum content was lost in any of these corrections; all four are reasoned audit decisions, not wording changes.

It does not authorize changes to authentication, entitlements, payments, database policies, certificate issuance, unrelated modules, persistent Cadence threads, the Guided Completion Path interface, Listen Mode, Module 7, the future Module 12 Final Exam, or the monolithic course-file architecture. Nothing in this document authorizes implementation — implementation is a separate, later task.

Module 4 taught the student to gather and describe evidence. Module 5 taught the student to translate that evidence into a cosmetic service plan across five service levers. Module 6 teaches the student to **interpret** — specifically, to tell apart two presentations that are commonly confused (dry scalp and the dandruff-to-seborrheic-dermatitis spectrum), to know what a visual impression can and cannot establish, and to decide whether the responsible next step is to proceed, modify, or refer. This is the first module whose entire subject matter is a scope-adjacent judgment call, so its referral guardrail is a structural section, not a footnote.

---

## Research and evidence sources

Used to verify the module's factual/clinical claims before writing corrections below. Recorded so a future reviewer can check these decisions without re-deriving them. This is not a literature review — only claims that materially affect curriculum accuracy or safety were checked.

1. **American Academy of Dermatology**, "Seborrheic dermatitis: Overview," aad.org/public/diseases/a-z/seborrheic-dermatitis-overview — dandruff and seborrheic dermatitis are treated as the same underlying process at different severities/locations, not two unrelated conditions.
2. Borda LJ, Wikramanayake TC, "Seborrheic Dermatitis and Dandruff: A Comprehensive Review," *J Clin Investig Dermatol* 2015 (PMC4852869) — confirms the continuum framing; also documents that etiology is multifactorial (Malassezia yeast, sebum, individual barrier/immune susceptibility), not a single linear oil→yeast mechanism.
3. **DermNet NZ**, "Seborrhoeic dermatitis" — clinical presentation, differential diagnosis (psoriasis, tinea capitis, atopic and contact dermatitis can mimic it), and standard treatment categories (antifungal, keratolytic, anti-inflammatory).
4. Cunliffe WJ, Burton JL, Shuster S, "The effect of local temperature variations on the sebum excretion rate," *British Journal of Dermatology* 1970;83:650–654 — **re-examined on re-audit and found insufficient to support a student-facing numeric rule.** This is the only source located for a specific temperature/sebum percentage, and on closer reading it does not transfer cleanly to a scalp-service teaching point: the study measured **9 subjects**; the measurement site was **forehead skin**, not the scalp; the outcome measured was **surface sebum excretion**, not glandular production; and the authors themselves state the observed change **may not represent actual sebum production** and propose **temperature-dependent sebum viscosity/collection** as an alternative explanation for their own result. A 9-subject, non-scalp, methodologically-hedged 1970 finding is not strong enough evidence to teach practitioners a specific percentage-per-degree rule, and the number is not actionable — no service decision changes based on knowing whether the figure is 8% or 12%. Per the insider-value standard, only knowledge that changes a practitioner's decision belongs in the curriculum; the underlying qualitative pattern (client-reported oiliness commonly increases in warmer conditions) is worth keeping as an intake-conversation prompt, but the specific number is removed. See "Required corrections" #9.
5. **DailyMed (U.S. National Library of Medicine) FDA drug labels** for ketoconazole shampoo — replaces the commercial retail sources (GoodRx, Drugs.com) used in the initial audit pass, per re-audit direction to cite primary regulatory labeling. Confirms: **ketoconazole shampoo 1%** (e.g., Nizoral Anti-Dandruff, DailyMed setid `f5c8c5b4-49bd-4dc7-8c29-8f1317c6ef88`; generic 1% listings including setid `286c5fbb-74c0-7de3-e063-6394a90a0973`) is a **Human OTC Drug** labeled for "control of symptoms of dandruff and/or seborrheic dermatitis," external use only. **Ketoconazole shampoo 2%** (DailyMed setid `1f5cd9f4-0db4-4062-b5ec-c33611265e02`) is labeled **"Rx only"** and is FDA-indicated for both seborrheic dermatitis/dandruff and tinea versicolor under clinical-trial support in the label — this corrects the initial audit pass's imprecise note (sourced from a retail summary) that 2% is approved only for tinea versicolor. The OTC/prescription line is concentration, not the ingredient: **1% only** is the OTC, cosmetic-service-compatible strength; 2% requires a prescription and is out of this course's scope to reference by name to a client. See "Required corrections" #7 for the resulting copy correction and the explicit scope/prescribing boundary added alongside it.
6. General dermatology consensus (AAD, DermNet, and the sources above) on dandruff-vs-seborrheic-dermatitis differential diagnosis: appearance alone (flake color, oiliness, redness) is suggestive, not conclusive — several other conditions (psoriasis, tinea capitis, contact/atopic dermatitis) can present similarly, particularly when the presentation spreads beyond the scalp. This directly informs the "what can and cannot be concluded from appearance alone" correction below.
7. Diet and stress as contributing factors: stress is reasonably well documented as flare-associated (immune/inflammatory pathway, not purely "more oil"); diet evidence is comparatively weak and mostly individual/anecdotal rather than an established mechanism. Both claims in the current module are corrected to reflect this difference in evidence strength.

These sources support **keeping** the module's central dry-scalp-vs-dandruff-spectrum framework — it is accurate, not a fabrication — while correcting specific claims that were stated with more certainty or precision than the evidence supports, and while adding the observation-limits and referral content the current extraction lacks.

---

## Approved outcomes

By the end of Module 6, the student should be able to:

1. Distinguish a dry-scalp-pattern presentation from a dandruff-spectrum presentation using multiple observable cues together (flake color, size, oiliness, redness, distribution) — not a single cue in isolation — and state plainly when a presentation is ambiguous or mixed rather than forcing it into one category.
2. Explain, without diagnosing, why matching an anti-dandruff/anti-fungal product to a dry-scalp presentation can worsen it, and use that reasoning to redirect a client who has been self-treating incorrectly.
3. Place a dandruff-spectrum presentation along a continuum from mild to more involved using observable features (extent, redness, thickness/adherence of scale, spread beyond the scalp margin) — without presenting that placement as a confirmed medical diagnosis.
4. State, from memory and without needing to trigger any single interactive element, the referral criteria for this module's subject matter (spread beyond the scalp with active redness, broken/weeping/crusted skin, severe or rapidly worsening symptoms, no improvement despite reasonable care).
5. Choose a within-scope service and product-category response — cleansing support, an OTC-only (1%-strength) anti-fungal/zinc/selenium-sulfide category recommendation, anti-inflammatory botanical support, or simplification of an over-treated routine — appropriate to a described presentation.
6. Communicate an observation and a service adjustment to a client in language that does not diagnose, does not promise a cure, and corrects a client's own self-diagnosis without contradicting or embarrassing them.
7. Apply Module 4's observation-versus-conclusion discipline and Module 4/5's preserve/modify/avoid/pause/refer framework to a conditions-related presentation, rather than treating condition recognition as a separate memorization task.
8. Demonstrate this judgment through two applied open-response checkpoints that test genuinely different competencies (identification-and-correction, and scope/referral judgment).

Avoid outcomes that merely say the student will "learn about" dandruff or "understand" the Malassezia spectrum — every outcome above names something the student can observe, distinguish, decide, or say differently.

---

## Keep unchanged

Preserve the following concepts, technical structures, and content:

- Technical module ID `6`.
- Wrapper ID `module6Wrap`.
- Checkpoint IDs `m6cp1`, `m6cp2`.
- Completion-card ID `m6Complete`.
- Two required open-response checkpoints (see "Checkpoint specification" for why both remain justified).
- Module 5 as the prerequisite; Module 7 as the next module.
- Existing students who have already passed either checkpoint remain passed.
- The core, evidence-supported distinction that dry scalp is fundamentally a barrier/moisture presentation and the dandruff-to-seborrheic-dermatitis spectrum is fundamentally an oil/yeast/inflammation presentation (Source 1–2 above) — this is accurate and stays, with hedging added per "Required corrections" below.
- The insight that the dandruff-to-seborrheic-dermatitis relationship is a continuum rather than two unrelated conditions (Source 1–2) — this is scientifically supported and stays, with its causal framing softened.
- The "wrong product cycle" narrative's core teaching value: that a client who misreads dry-scalp flaking as dandruff and reaches for anti-dandruff shampoo can worsen their own presentation. This is a genuinely useful, memorable practitioner insight.
- The three applied "what this looks like in real time" scenarios in the current Section 6.4 info card.
- The four trigger categories (stress/hormonal, diet, excess oil/heat, wrong product), with hedging corrections applied individually below — all four remain worth knowing for intake conversations.
- The relationship framing to Module 5 ("layers on top of it," "you are now asking: is this dry? is this oil-driven? is this microbial? is this mixed?").
- Both checkpoint scenarios' core client narratives (dry-scalp/product-misuse; more-involved/spreading presentation) — realistic, well-constructed applied scenarios.
- Module 4's five-point assessment, observation lenses, and preserve/modify/avoid/pause/refer vocabulary as the framework Module 6 builds on rather than re-teaches.

Do not rename the module ID, checkpoint IDs, completion-card ID, progress keys, or stored checkpoint keys merely to normalize implementation.

Do not add a third required checkpoint.

---

## Required corrections

### 1. Resolve the section-6.2 gap

Section numbering currently skips from 6.1 to 6.3. Add a real **Section 6.2 — "What you can and cannot conclude from appearance alone"** (see "Section-by-section approved structure" below) rather than renumbering around the gap. This is not a cosmetic fix — Module 6 is the first module whose entire subject is a scope-adjacent interpretive judgment, and it currently has no section establishing the limits of visual observation before it starts making distinctions. Placing this immediately after 6.1 and before the dry-vs-dandruff comparison gives the student the "appearance is suggestive, not conclusive" frame before they need it.

### 2. Resolve the title/eyebrow mismatch

The home-row title and `MODULE_TITLES[6]` read "Conditions & Disorders"; the hero eyebrow reads "Common Conditions & Disorders." Standardize on **"Conditions & Disorders"** everywhere (drop "Common" — it adds nothing and the module does not attempt encyclopedic coverage; see "Conditions/disorders teaching standard" below for the deliberately narrow scope). Do not introduce a new title; the existing one is accurate to what the module now covers.

### 3. Remove the duplicated tap hint

Section 6.3 currently shows "↓ Tap each card to expand" immediately before a static, non-interactive photo pair, then "↓ Tap each pattern to see what it means" immediately before the actual tappable comparison cards — three phrasings of the same instruction (including the body-text "Tap each side to understand them fully") within a few paragraphs. Keep exactly **one** hint, worded consistently with every other module's interaction hints, placed immediately before the actual tappable comparison cards. Remove the other two instances.

### 4. Correct the dry-vs-dandruff mechanism language

Keep the core distinction (Sources 1–2), but:

- Soften "Dandruff flakes because the scalp is functioning abnormally" — this reads as diagnostic certainty. Reframe as a description of the typical dandruff-spectrum mechanism (oil, Malassezia activity, inflammation, turnover) without asserting it as the confirmed cause of any individual client's presentation.
- Add an explicit statement, at the end of the comparison section, that these two presentations can overlap or look ambiguous in practice, and that when a presentation does not clearly match one pattern, the responsible move is to ask about history and favor the gentler service direction — not to force a label. (See "Distinction quality" below.)

### 5. Correct the "wrong product cycle" certainty language

"Most clients with dry scalp end up using anti-dandruff shampoo" is stated as near-universal fact with no support. Replace with language that presents this as a common, avoidable pattern rather than a majority-of-clients claim (e.g., "This is a common, avoidable pattern" rather than "Most clients... end up..."). The six-step causal chain itself (assumption → wrong product → stripping → worsening → escalation → arrival at your table) is a legitimate and well-sequenced teaching device and stays, including the Cadence note ("This is not treatment failure. It is misidentification.").

### 6. Reframe the Malassezia spectrum's causal claim

"Not two conditions. One spectrum" is directionally correct (Source 1–2) but overstates a single linear oil-driven mechanism. Replace the framing that Malassezia "becomes a problem when oil production increases" as the sole driver with language that names oil, yeast activity, and individual variation in inflammatory/immune response together, consistent with the multifactorial etiology documented in Source 2. Do not remove the spectrum concept — it is accurate and pedagogically valuable — only correct its stated mechanism.

### 7. Correct the ketoconazole/product recommendation and make the scope boundary explicit

Section 6.7's treatment card currently reads: "Zinc, ketoconazole (OTC recommendation only — not prescription), selenium sulfide. These help manage yeast activity without requiring medical oversight." Per Source 5 (DailyMed/FDA labeling), the OTC/prescription line for ketoconazole is **concentration**, not the ingredient itself: **1%** is a Human OTC Drug labeled for dandruff/seborrheic-dermatitis symptom control; **2% is Rx only** and is also indicated for tinea versicolor. Correct to specify **1%-strength** ketoconazole, zinc pyrithione, and 1% selenium sulfide as the OTC category being referenced. Never name or imply the 2% strength — it is outside cosmetic-service scope by definition (prescription-only).

Remove "without requiring medical oversight" — that phrase overstates the practitioner's authority regardless of concentration.

**Make the scope/prescribing boundary explicit, not implied.** Naming an OTC product *category* the client could choose to purchase for themselves is retail-product literacy, not a medical act — but the module must be unambiguous that this is different from diagnosing a condition and then directing its treatment. Add a direct statement to Section 6.7: recommending an OTC product category is not a diagnosis and not a prescription; it is pointing to a widely available retail option, alongside the same boundaries as every other Module 5/6 product decision (manufacturer directions, patch-testing where applicable, client allergies, and referral instead of a product recommendation whenever Section 6.6's referral criteria apply). This same boundary is carried into the checkpoint rubrics and Cadence's prohibited-behavior list below, so a student cannot pass either checkpoint or receive Cadence guidance that frames "here is what you have, use this to treat it" as an appropriate cosmetic-service response.

### 8. Correct the diet and stress trigger claims

- **Diet:** "Contributes to increased oil production and systemic inflammation — both of which feed Malassezia activity" is stated as established mechanism; per Source 7 the evidence here is comparatively weak and largely individual. Soften to something like: "May contribute for some clients, though the evidence is largely individual rather than firmly established. Worth asking about as part of intake — not something to lecture the client about or present as a guaranteed fix." (The source extraction's existing "worth mentioning, not lecturing about" line is good and should be kept/extended, not replaced.)
- **Stress & hormonal changes:** "Increases oil production and can trigger flare-ups" states a single mechanism with too much confidence. Reframe as: stress and hormonal shifts are associated with flare-ups of existing conditions, most likely through a combination of immune/inflammatory response and changes in oil production — not oil production alone.

### 9. Remove the numeric heat/sebum claim; keep only qualitative, actionable language

**Audit decision (re-evaluated): remove the "10% per 1.8°F" figure from student-facing curriculum. Do not replace it with any other numeric rule.** The initial audit pass retained this claim with hedging on the basis that it was consistent with a real, citable study (Cunliffe et al. 1970). On closer reading of that source, the claim does not survive the insider-value standard:

- The study population was **9 subjects** — too small to generalize into a practitioner rule.
- The measurement site was **forehead skin**, not scalp — a different sebaceous environment.
- The outcome measured was **surface sebum excretion**, which the study's own authors distinguish from actual glandular **production** — they explicitly note the measured change may not represent production at all, and propose **temperature-dependent viscosity/collection differences** as an alternative explanation for their own finding.
- Most importantly: the specific number does not change any service decision. A practitioner does not do anything differently knowing the figure is approximately 10% versus some other value — it is decorative precision, not applied knowledge, which fails the governing "does this improve practitioner judgment" test.

**This is a curriculum-value decision, not a wording preference.** Removing an unsupported number is different from softening its confidence — the correction here is deletion, not further hedging.

**Approved replacement (qualitative only, no numeric claim):** in Section 6.8's "Excess oil production" trigger item, replace the sentence containing the percentage with:

> "Warmer weather, humidity, and hormonal shifts are commonly associated with a client noticing more oil between washes, though the relationship isn't precise or predictable enough to apply as a fixed rule for any individual client. Ask about recent heat exposure, exercise, and seasonal changes as part of intake rather than assuming a specific cause."

This keeps temperature as a legitimate, evidence-consistent intake-conversation topic (broadly recognized in cosmetic dermatology that warmer/humid conditions are associated with oilier-feeling skin and scalp) while removing the specific figure that the primary source cannot actually support at the level of certainty the module implied. Module 5's own unaudited copy of this same numeric claim is out of scope for this task (Module 5 is already implemented and manually approved) — flagged in "Implementation notes" for a future Module 5 consistency pass; this audit does not authorize touching Module 5.

### 10. Add the missing standalone referral section

Module 6 currently has exactly one referral sentence in its entire curriculum, and it is gated behind manually dragging the spectrum slider to its fourth position — the same absence already identified (and not yet corrected) in Module 5. Given that Module 6's entire subject is a scope-adjacent judgment call, this is the single most important correction in this specification. Add a new, always-visible **Section 6.6 — "When to pause or refer"** (see below) with an explicit, standalone list of referral triggers and an approved client-facing script. The spectrum slider's position-4 text is corrected to point to this section rather than being the sole carrier of referral information.

### 11. Fix the unreachable `scope-awareness` memory tag

`MODULE_MEMORY_TAGS[6]` lists `scope-awareness`, but `getCheckpointMemoryTags`'s Module 6 branch has no regex condition that can ever produce it — it is declared but unreachable. Rather than inventing a new regex branch that would functionally duplicate the existing `referral-judgment` tag (`/\b(refer|within scope|not within scope)\b/i`), **remove `scope-awareness` from `MODULE_MEMORY_TAGS[6]`**. The remaining three tags (`pattern-recognition`, `referral-judgment`, `barrier-thinking`) already have working regex branches and adequately cover this module's competencies.

### 12. Correct checkpoint question parity and grading structure

Both checkpoints' displayed (`.cp-q`) and evaluated (`M6.questions`) strings must be byte-identical — see "Checkpoint specification" below for the exact approved strings (unchanged from the current displayed text, which is already strong). Replace the single shared `M6.system` rubric with checkpoint-specific rubrics (`M6.systems.m6cp1` / `M6.systems.m6cp2`), matching the structure already used in Modules 1–4.

### 13. Add module-specific checkpoint network-error text

`submitM6CP` currently supplies no 5th `errorMessage` argument to `submitCheckpoint()`. Add the approved text (see "Checkpoint specification").

### 14. Fix accessibility gaps

- Add `aria-label="Speak your answer"` to both voice buttons and `aria-label="Send response to Cadence"` to both submit buttons.
- Add `aria-live="polite"` to both `.cp-res` feedback regions.
- Add an explicit `aria-label` (or `aria-labelledby` pointing to the section heading and positional labels) to `#spectrumSlider`.
- Convert `.vs-card`, `.cycle-step`, and `.trigger-item` from plain `<div onclick>` elements to native, keyboard-operable controls (`<button type="button">` with `aria-expanded`/`aria-pressed` as appropriate), matching the pattern already used to correct Module 2's arrival accordion and judgment-check quiz.
- Add a `prefers-reduced-motion` override for the `.vs-detail` and `.cycle-insight` `slideDown` animations, matching the pattern already established elsewhere in the file.

### 15. Correct Cadence identity

Remove "instructor of HeadSpa Mastery" from `M6.system` and "a mentor built from nearly two decades in the head spa industry" from `MODULE_GUIDE_SYSTEMS[6]` — the same course-name and personal-experience-claim corrections already applied to Modules 0, 1, 2, and 4. See "Cadence behavior" below for the approved replacement language.

### 16. Do not silently correct claims that need no correction

The following claims were checked against the research above and found accurate; they should **not** be flagged or hedged further than specified:

- Zinc pyrithione, 1% ketoconazole, and 1% selenium sulfide as OTC-appropriate anti-fungal-supporting categories (Source 5, with the concentration correction in item 7 above).
- Licorice root and chamomile as anti-inflammatory botanical categories (general cosmetic-ingredient knowledge; no medical claim is made about them beyond "calm the scalp," which is appropriately modest).
- The dandruff-to-seborrheic-dermatitis continuum concept itself (Source 1–2).

---

## Section-by-section approved structure

The approved sequence resolves the 6.2 gap, adds the standalone referral section, and places both checkpoints at natural competency boundaries rather than clustering them at the end.

**6.1 → 6.2 (new) → 6.3 → 6.4 → `m6cp1` → 6.5 → 6.6 (new) → Signature interaction → 6.7 → 6.8 → `m6cp2` → completion**

### 6.1 — Your role here

**Purpose:** Set the module's interpretive frame before any content.

**Key teaching points:** Clients guess at causes from symptoms; the practitioner's job is to interpret, not to agree with the client's self-diagnosis or to diagnose in return.

**Content changes:** None required — keep verbatim. This section already frames the module correctly.

**Interaction/visual requirements:** None.

**Before moving on, the student should:** Understand that the module's goal is interpretation and appropriate response, not diagnosis.

### 6.2 — What you can and cannot conclude from appearance alone (NEW)

**Purpose:** Establish the observation-limits frame that Module 6 currently lacks, directly building on Module 4's observation-versus-conclusion discipline.

**Key teaching points:**
- Flake color, size, oiliness, and redness are suggestive, not conclusive.
- Several conditions can look similar at a glance — dry scalp, early dandruff, product buildup, and (at the more involved end) presentations that resemble psoriasis, tinea capitis, or contact/atopic dermatitis (Source 3, Source 6). A cosmetic assessment cannot rule these look-alikes out.
- When a presentation is ambiguous or mixed, the responsible move is to ask about history (product use, wash timing, recent changes, symptoms) and favor the gentler service direction — not to force a label.
- This section does not teach the student to name or rule out any of the look-alike conditions; it teaches the student that they exist, so the student does not over-trust a confident-sounding visual read.

**Content changes:** New section — no prior copy to preserve.

**Interaction/visual requirements:** None (text section). Sets up Section 6.3's comparison and Section 6.6's referral criteria.

**Before moving on, the student should:** Be able to state, in their own words, that appearance alone does not establish cause, and name at least one reason a confident-looking visual read could still be wrong.

### 6.3 — The most important distinction in scalp care

**Purpose:** Teach the dry-scalp-vs-dandruff-spectrum distinction as the module's central, high-value skill.

**Key teaching points:** Same core mechanism content as today (Source 1–2 support it), corrected per "Required corrections" #4 above; the four-bullet comparison cards; the "expanded detail" paragraphs for each side; a new closing note that presentations can overlap and appearance alone is not always conclusive.

**Required copy/content changes:** Single consistent tap hint (correction #3); softened "functioning abnormally" language (correction #4); new closing overlap/ambiguity note.

**Interaction/visual requirements:** The `.vs-card` comparison-card toggle — **retained, revised** (see "Approved interactions"). Photo pair — see "Visual asset plan."

**Before moving on, the student should:** Be able to state at least two observable features that distinguish a typical dry-scalp presentation from a typical dandruff-spectrum presentation, and recognize when a presentation doesn't clearly fit either.

### 6.4 — The cycle worth understanding

**Purpose:** Teach the causal chain of client self-misdiagnosis → wrong product → worsening presentation, and why this matters for client communication.

**Key teaching points:** The six-step cycle (unchanged content, corrected certainty language per correction #5); the three "what this looks like in real time" scenarios; the Cadence note.

**Required copy/content changes:** "Most clients... end up..." → softened per correction #5.

**Interaction/visual requirements:** The six-step cycle is presented as a **static, always-visible sequential display** (numbered steps 1–6 with their insight text already visible, connected by the existing arrow glyphs) — the `.cycle-step` click-to-reveal interactivity is **removed** per the interaction-density re-check (see "Approved interactions — full audit" below). No interaction remains at this location; the content itself is fully preserved.

**Before moving on, the student should:** Be able to explain to a client, in plain language, why an anti-dandruff product made their dry scalp worse instead of better.

### Checkpoint 1 — `m6cp1`

Placed here because it directly tests Sections 6.2–6.4: recognizing a dry-scalp presentation, correcting a client's product-misuse pattern, and communicating that without diagnosing. See "Checkpoint specification."

### 6.5 — Malassezia to seborrheic dermatitis: one spectrum

**Purpose:** Teach the dandruff-to-seborrheic-dermatitis continuum as a severity spectrum, not two unrelated conditions.

**Key teaching points:** Corrected multifactorial framing (correction #6); the four-position spectrum concept retained.

**Required copy/content changes:** "Not two conditions. One spectrum" retained but its stated mechanism corrected; position-4 output text revised to reference Section 6.6 rather than being the module's only referral sentence.

**Interaction/visual requirements:** The spectrum slider — **retained, revised** (see "Approved interactions"). Photo pair — see "Visual asset plan."

**Before moving on, the student should:** Understand that dandruff and seborrheic dermatitis sit on the same continuum and that severity, not a hard category boundary, is what changes the appropriate response.

### 6.6 — When to pause or refer (NEW, standalone)

**Purpose:** Give Module 6 the always-visible, non-interaction-gated referral section every other conditions-adjacent module (1, 4) already has.

**Key teaching points:**

> **Refer when you see:**
> - Redness or scaling that spreads beyond the scalp — to the eyebrows, hairline, or ears — combined with active irritation.
> - Broken, weeping, crusted, or bleeding skin.
> - Symptoms the client describes as severe, painful, or rapidly worsening.
> - No improvement despite reasonable home care and product changes.
> - Any presentation you are not confident matches a typical dry-scalp or dandruff-spectrum pattern — including anything that could resemble a different condition (see Section 6.2).

**Approved client-facing referral script (adapted from Module 4's approved pattern):**

> "I'm seeing something today that goes beyond what a head spa service is designed to address. I don't want to guess at the cause or risk making it worse, so I'd recommend having it evaluated before we continue with scalp services."

**Required copy/content changes:** New section — no prior copy to preserve, though its content is drawn directly from the spectrum slider's existing position-4 sentence and Module 4's already-approved referral pattern.

**Interaction/visual requirements:** None — always visible, no interaction required to see it.

**Before moving on, the student should:** Be able to list the referral triggers from memory, without needing to have interacted with the spectrum slider at all.

### Signature interaction — "Sort three presentations" (NEW)

Placed here because it applies Sections 6.2, 6.3, 6.5, and 6.6 together. See "Signature learning moment" below for the full specification.

### 6.7 — Treatment within scope

**Purpose:** Teach the within-scope service and product-category response.

**Key teaching points:** Cleansing support; anti-fungal-supporting OTC categories (corrected per correction #7); anti-inflammatory botanicals; regular maintenance; the explicit scope note that recommending an OTC product category is not a diagnosis and not a prescription.

**Required copy/content changes:** Ketoconazole card corrected per correction #7 (1%-strength specificity only, remove "without requiring medical oversight"). Add a closing scope note to this section: "Recommending a product category is a retail suggestion within a cosmetic service — not a diagnosis and not a prescription. If a presentation meets any of Section 6.6's referral criteria, refer instead of recommending a product."

**Interaction/visual requirements:** Static four-card grid, unchanged structurally.

**Before moving on, the student should:** Be able to name at least two within-scope product categories and explain why they're appropriate at a cosmetic level rather than a medical one.

### 6.8 — What makes it worse

**Purpose:** Teach the four contributing-factor categories as intake-conversation material, not diagnostic causes.

**Key teaching points:** Stress/hormonal, diet, excess oil/heat, wrong product use — each corrected per corrections #8–9. The "layering on Module 5" info card and the Cadence "practitioner insight" note fold into this section's close rather than becoming their own numbered section (matching the precedent set by Module 5's manual-QA removal of its own standalone recap section — a closing insight works better as supporting copy than as a separate section).

**Required copy/content changes:** Diet and stress items softened per correction #8; heat/sebum item's numeric claim **removed and replaced with qualitative language** per correction #9; "wrong product use" item unchanged (already appropriately hedged and directly actionable).

**Interaction/visual requirements:** The four trigger items are presented as a **static list** (all four visible with clear visual separation, no click-to-expand required) — the `.trigger-item` accordion interactivity is **removed** per the interaction-density re-check (see "Approved interactions — full audit" below). All four items' content is fully preserved.

**Before moving on, the student should:** Be able to ask a client at least two relevant intake questions informed by this section (e.g., about recent product changes, wash frequency, or reported stress) rather than assuming a single cause.

### Checkpoint 2 — `m6cp2`

Placed at the end because it synthesizes the full module: spectrum placement, referral judgment, and scope-appropriate response for a more involved presentation. See "Checkpoint specification."

### Completion card — `m6Complete`

See "Completion behavior" below.

---

## Conditions/disorders teaching standard applied

Per the governing standard, Module 6 does not attempt encyclopedic condition coverage. It covers exactly the presentations that materially change a head-spa service decision:

### Dry scalp

- **May be visibly observable:** fine, white, powdery flakes; matte surface; minimal oil; possible tightness.
- **Can look similar to:** early/mild dandruff-spectrum flaking, especially before oil and redness become pronounced.
- **Must not conclude from appearance alone:** that the barrier is "damaged," that a specific cause (weather, product, aging) applies to this client, or that this is a formal diagnosis.
- **May affect service modification:** reduce cleansing intensity/frequency; favor hydration-supportive product categories; avoid anti-dandruff/anti-fungal actives.
- **Defer/refer when:** combined with broken skin, or no improvement despite reasonable, appropriate home care.
- **Responsible client language:** "What I'm seeing looks more like a moisture pattern than a yeast-driven one — let's simplify your routine rather than add another strong product."

### Dandruff (mild end of the spectrum)

- **May be visibly observable:** yellowish, clumped flakes; oil at the root; mild redness, contained to the scalp.
- **Can look similar to:** product buildup, a mild reaction to a new product, or early presentations further along the spectrum.
- **Must not conclude from appearance alone:** that this is confirmed "dandruff" as a medical diagnosis, or that Malassezia is definitively the cause for this specific client.
- **May affect service modification:** cleansing support; OTC-category (1%-strength) anti-fungal/zinc/selenium-sulfide recommendation; simplification of an over-treating routine.
- **Defer/refer when:** no improvement after a reasonable trial, or symptoms worsen.
- **Responsible client language:** "This pattern is common and usually responds to a simpler, more consistent routine — let's start there."

### Seborrheic dermatitis (more involved end of the spectrum)

- **May be visibly observable:** thicker, greasier, more adherent scale; more pronounced redness; spread beyond the scalp margin to eyebrows, hairline, or ears; possible discomfort.
- **Can look similar to:** psoriasis, tinea capitis, contact dermatitis, or atopic dermatitis (Source 3, Source 6) — appearance alone cannot rule these out.
- **Must not conclude from appearance alone:** a confirmed diagnosis of seborrheic dermatitis or any other named condition.
- **May affect service modification:** gentle cosmetic support only if the presentation is mild and the client is comfortable; otherwise pause.
- **Defer/refer when:** spread beyond the scalp with active redness; broken/weeping/crusted skin; severe discomfort; rapid worsening; any uncertainty about whether this could be a different condition.
- **Responsible client language:** the Section 6.6 referral script.

Memorization-heavy pathology content (formal differential-diagnosis criteria, additional named conditions) is intentionally excluded — it would not change a cosmetic service decision and is outside this course's scope.

---

## Distinction quality — dry scalp vs. dandruff

The current comparison is accurate (Source 1–2) and stays, but it currently presents as a clean binary with no acknowledgment that real presentations can overlap. Per correction #4, add an explicit closing note to Section 6.3:

> **When it's not clean-cut:** some clients show features of both — moderate oil with some tightness, or flakes that don't clearly match either column. When that happens, don't force a label. Ask about recent products, wash frequency, and how long the pattern has been present, and favor the gentler service direction until the picture is clearer.

This is the specific mechanism by which the module avoids teaching false diagnostic confidence from a single visual cue, per the governing audit standard.

---

## Malassezia content — audit decision

**Retain, redesign (not remove).** The spectrum/continuum concept is scientifically supported (Source 1–2) and is one of the module's most valuable insights — it prevents students from treating dandruff and seborrheic dermatitis as two unrelated things requiring separate mental models. What must change:

- The stated mechanism (correction #6) — multifactorial, not single-variable oil-driven.
- The interaction's accessibility (aria-label, aria-labelledby — correction #14).
- Position-4's referral text, which now points to Section 6.6 rather than carrying the module's only referral information.

What the student should learn from it, once corrected: that severity is a continuum driven by more than one factor, that a "worse" presentation is not a different disease requiring different vocabulary, and that severity — not category — is what should change the service response.

---

## "Wrong product cycle" — audit decision

**Retain the content. Remove the interactivity — re-evaluated on the interaction-density re-check.** The six-step causal chain itself is a genuinely useful, memorable practitioner insight and is well-sequenced pedagogically; none of that content is cut. What changes is the delivery mechanism: the current `.cycle-step` interaction lets the student click any of the six steps in any order to reveal its insight text. On re-examination against the governing interaction standard (observe / recall / distinguish / sequence / decide / explain / apply / communicate), this interaction does not actually require any of those — the student is not asked to sequence, predict, or judge anything; they simply choose which pre-written paragraph to read next. Worse, because the content is an inherently causal, ordered chain (step 1 causes step 2 causes step 3...), letting the student jump to any step in any order works *against* the causal-chain teaching point rather than reinforcing it.

The corrected approach presents all six steps and their insight text as a **static, always-visible sequential display** — the same numbered-steps-with-arrows visual, but with nothing gated behind a click. This preserves 100% of the teaching content, removes a decorative-click mechanic that wasn't earning its interactivity, and — as a secondary benefit — removes one of the module's reveal-gated Listen Mode obstacles (see "Listen Mode notes").

---

## Trigger content — audit decision

**Retain all four items' content; remove the accordion interactivity.** "Trigger" is retained as the section framing (it is understood colloquially and the section does not claim precise causal proof for any one item). Each item's certainty is corrected individually:

- Stress & hormonal changes — retain, correct mechanism per correction #8.
- Diet — retain, correct evidence-strength framing per correction #8.
- Excess oil production / heat — retain the qualitative point, **numeric claim removed** per correction #9 (no citable per-degree rule survives re-audit).
- Wrong product use — retain unchanged; already appropriately hedged and the most directly actionable of the four for a service decision.

None of the four items' content is removed — each maps to a concrete intake question, which is the bar for retention per the governing standard ("retain only material that improves professional judgment"). What is removed is the `.trigger-item` accordion's click-to-expand mechanic (see "Approved interactions — full audit"): on re-examination, opening one of four independent, parallel items to read a paragraph does not require the student to observe, distinguish, decide, sequence, explain, or apply anything — it is a plain information reveal with a UI wrapper. A static list with clear visual separation between the four items communicates the same content with equal or better scannability, without implying an interaction is doing instructional work it isn't.

---

## Practitioner insider value

- **Misleading similarity:** a "clean-looking" set of gentle flakes can still be early dandruff, and a red, irritated-looking presentation isn't automatically seborrheic dermatitis — it could be a reaction to a new product. Appearance alone under-determines the answer.
- **Why visible flakes don't automatically identify a condition:** size, color, and oiliness are suggestive, not conclusive; product and wash history often matters more than the visual alone.
- **What changes the service decision:** the combination of oil + redness + spread, weighed against the client's own product history — not any single feature in isolation.
- **Where product choice worsens an already-reactive presentation:** strong anti-dandruff/anti-fungal surfactants used on a barrier-compromised, dry-pattern scalp.
- **What's useful even when the cause is uncertain:** simplifying an over-treated routine is almost always a safe, responsible first move, regardless of the exact underlying cause.
- **Language that protects client trust:** correcting a client's self-diagnosis gently ("what you've been treating as dandruff might actually be...") rather than contradicting them outright.
- **Common beginner mistake this prevents:** reaching for the strongest, most medicated-seeming product because the presentation "looks serious," when simplification is usually the better first move — and knowing when "looks serious" actually does warrant referral instead of a stronger product.

---

## Signature learning moment — "Sort three presentations" (NEW)

**Instructional purpose:** Require the student to apply the full proceed/modify/refer judgment the module builds toward, in one applied exercise — distinct from Module 5's signature interaction, which was about adapting service levers rather than triaging whether to proceed at all.

**Placement:** After Section 6.6 ("When to pause or refer"), before Section 6.7.

**Exact student task:** Three short, text-based client presentations are shown, one at a time or side by side. For each, the student chooses one of three responses: **Proceed as usual**, **Proceed with modification**, or **Pause and refer**.

**Scenarios:**

1. Fine white powdery flakes, matte surface, minimal oil, mild tightness, no redness. → Approved answer: **Proceed with modification** (dry-scalp-supportive direction; simplify an over-treating routine if one is reported).
2. Yellowish, clumped flakes, visible oil at the root, mild redness, contained to the scalp, no spread. → Approved answer: **Proceed with modification** (cleansing support, OTC-category product recommendation, monitor).
3. Scale and redness spreading to the eyebrows and hairline, client reports significant discomfort, pattern has persisted for months despite drugstore treatments. → Approved answer: **Pause and refer**.

**Decision required:** The student must weigh multiple observable cues together (not one feature) and recognize when a presentation crosses from "adjust the service" into "this needs medical evaluation" — directly rehearsing the judgment `m6cp2` will assess.

**Feedback behavior:** On selection, apply state only to the selected option (matching Module 5's approved pattern — the correct answer is never pre-highlighted). A correct selection shows a "Correct answer" state with feedback beginning "Correct," explaining which combination of cues supported that decision. An incorrect selection shows a "Not quite" state with feedback beginning "Not quite," explaining what the chosen response overlooks — without revealing or describing the approved answer.

**Retry/reset:** Unlimited; changing a selection returns other options to neutral, matching Module 5's approved interaction behavior.

**Graded or ungraded:** Ungraded — it must not write progress, persist, gate completion, or produce a score, consistent with the governing interaction standard.

**Why it belongs in Module 6:** It is the only point in the module where the student must weigh identification, spectrum placement, and referral judgment together in one decision, rather than practicing each skill in isolation — which is exactly the compound judgment a real client interaction requires.

---

## Approved interactions — full audit

### Interaction-density re-check (governs the decisions below)

Re-evaluated once, in full, against the governing learning-rhythm standard (every interaction must require observe / recall / distinguish / sequence / decide / explain / apply / communicate — not movement, novelty, or the appearance of activity). The initial audit pass retained and revised all four existing interactions plus the new signature interaction (five total). On re-examination, two of the four existing interactions do not survive this test, and two do:

- **`.vs-card` comparison toggle — survives.** The mechanic (choose one of two sides to expand) requires the student to actively select which presentation to examine and reinforces a genuine two-way distinction. Distinct instructional job: **distinguish**.
- **`#spectrumSlider` — survives.** The mechanic (continuous drag across four graduated positions) is isomorphic to the concept it teaches — a severity continuum, not discrete categories — in a way a static list or card grid could not communicate as directly. Distinct instructional job: **observe** a continuous variable experientially.
- **`.cycle-step` selector — does not survive.** Clicking any of six steps in any order to reveal pre-written text requires no observation, distinction, sequencing, decision, explanation, or application — and because the underlying content is an inherently ordered causal chain, letting the student jump to any step in any order actively works against the content's own logic. **Simplified: converted to a static, always-visible sequential display** (see Section 6.4 above). Content fully retained; interactivity removed.
- **`.trigger-item` accordion — does not survive.** Opening one of four independent, parallel items to read a paragraph is a plain reveal with no directed task attached. **Simplified: converted to a static list** (see Section 6.8 above). Content fully retained; interactivity removed.
- **New signature interaction ("Sort three presentations") — added, clearly justified.** Requires the student to weigh multiple observable cues together and choose between proceed / modify / refer — the module's one genuine **decide**-and-**apply** task, and the only point where identification, spectrum placement, and referral judgment are exercised together.

**Resulting interaction count: three ungraded interactions** (`.vs-card`, `#spectrumSlider`, the new signature interaction) plus the two required checkpoints — down from the initial pass's five. This is not an arbitrary cut: two interactions were removed specifically because they were revealing information rather than requiring judgment, per the explicit governing test, while their content was fully preserved as static copy. The remaining three each have a distinct, non-overlapping instructional job (distinguish / observe a continuum / decide-and-apply), so the final density is intentional, not incidental — and the reduction has the secondary benefit of shrinking Module 6's Listen Mode reveal-gating problem (see "Listen Mode notes") and its custom-control accessibility surface area (see "Acceptance criteria").

### 1. Dry-scalp-vs-dandruff comparison toggle (`.vs-card`)

**Decision: Retain, revise.**

Genuine distinction-building value; the defect is purely accessibility and the duplicated-hint/mis-sequenced-hint issue.

- **Instructions:** the single approved hint, "Tap each card to compare," placed immediately before the cards.
- **Controls:** two cards (`#vsCardDry`, `#vsCardDandruff`), each a native `<button type="button">` with `aria-expanded` reflecting open/closed state.
- **Choices/states:** open/closed, one at a time (unchanged behavior — opening one closes the other).
- **Feedback:** the existing expanded-detail paragraphs, with the Section 6.3 overlap/ambiguity note added as a closing line visible regardless of which card (if either) is open.
- **Retry/reset:** unlimited, unchanged.
- **Keyboard requirements:** native button semantics — Enter/Space activates; visible focus required.
- **Touch requirements:** existing padding is adequate; no measured minimum change required.
- **Accessible state communication:** `aria-expanded` on each button; the detail region gets `aria-live="polite"` is not required (it is triggered directly by the user's own action, not an async event) but should be programmatically associated via `aria-controls`.
- **Persistence:** none — matches current behavior.
- **Progress written:** none.

### 2. "Wrong product cycle" step display (`.cycle-step`)

**Decision: Simplify — remove the interaction, keep all content as static copy.** See "Interaction-density re-check" above for the full reasoning. No control, keyboard, touch, or accessible-state-communication spec applies here anymore, since there is no longer an interactive element — the six steps and their insight text render together, in order, with no `onclick` handler, no `tabindex`, and no ARIA state needed. This removes an entire item from the accessibility acceptance checklist rather than adding one, and removes one of the module's Listen Mode reveal-gating obstacles.

### 3. Malassezia-to-seborrheic-dermatitis spectrum slider (`#spectrumSlider`)

**Decision: Retain, revise.**

- **Instructions:** existing "Drag to move along the spectrum" hint, unchanged.
- **Controls:** native `<input type="range">`, min 1, max 4, step 1 — unchanged control type (already the most accessible of the four interactions).
- **Choices/states:** four positions, unchanged.
- **Feedback:** the four `SPECTRUM_STATES` strings, with position 4's text revised to reference Section 6.6 rather than being the module's only referral sentence (correction #10).
- **Retry/reset:** unlimited, unchanged.
- **Keyboard requirements:** already native (arrow keys) — no change needed beyond labeling.
- **Touch requirements:** native range-input touch behavior — no change needed.
- **Accessible state communication:** add `aria-label` (correction #14) describing the control's purpose; associate the four positional labels via `aria-labelledby` or equivalent.
- **Persistence:** none — resets to position 1 on reopen, matching current (and Module 5's) behavior; do not change this to persist, consistent with every other ungraded interaction in the course.
- **Progress written:** none.

### 4. Trigger list (`.trigger-item`)

**Decision: Simplify — remove the interaction, keep all four items' content as a static list.** See "Interaction-density re-check" above for the full reasoning. No control, keyboard, touch, or accessible-state-communication spec applies here anymore — the four items render together with clear visual separation (heading + paragraph per item), with no `onclick` handler and no ARIA expand/collapse state needed.

### 5. Signature interaction — "Sort three presentations" (new)

**Decision: Add.** Full specification in "Signature learning moment" above; ARIA/keyboard/touch/persistence requirements are specified there, not repeated here.

**Summary:** Of the module's original four interactions, two survive re-examination with genuine, distinct instructional jobs (`.vs-card` — distinguish; `#spectrumSlider` — observe a continuum), and two are simplified to static content because they were revealing information rather than requiring judgment (`.cycle-step`, `.trigger-item`) — no content is lost, only the decorative click mechanic. Combined with the new signature interaction, Module 6's final ungraded-interaction count is **three** (down from the initial audit pass's five), each with a distinct, non-overlapping instructional job. This is intentionally lighter than the initial pass, not because fewer interactions are inherently better, but because a click that isn't doing instructional work should not be counted as density — see "Distinct learning rhythm" below for how this compares to Modules 4 and 5.

---

## Checkpoint specification

### Shared technical requirements

Preserve: IDs `m6cp1` and `m6cp2`; stored passed state; voice input; Enter to submit; Shift+Enter for a new line; Review Mode's unsaved behavior; Module 7 gating only after both checkpoints pass.

Add: checkpoint-specific rubrics; exact displayed/evaluated question equality; module-specific network-error text; accessible control labels; polite live feedback; focused revision feedback; immediate correction of unsafe or diagnostic claims.

Do not require exact wording, named products, or a minimum sentence count. Do not fail an answer for grammar, spelling, brevity, accent, or non-native phrasing when the reasoning is competent.

### Approved network-error text

> Cadence could not review your interpretation. Check your connection and try again.

---

### `m6cp1` — Dry-scalp identification and correction

**Exact question (displayed and evaluated, byte-identical):**

> A client comes in with visible flaking and says she's been using a zinc-based anti-dandruff shampoo for three months but it keeps getting worse. Under the microscope you see fine white powdery flakes, minimal oil, and a matte scalp surface. What's happening — and what do you tell her?

**Competency assessed:** The student can recognize a dry-scalp presentation being misidentified and mistreated as dandruff, and can correct it responsibly.

**Pass when the answer demonstrates all of the following, in any natural wording:**

1. Identifies the presentation as consistent with a dry-scalp pattern (matte, minimal oil, powdery flakes) rather than dandruff.
2. Explains, without absolute "always" framing, that anti-dandruff/anti-fungal shampoo can strip a barrier-compromised scalp further and worsen dryness.
3. Offers a within-scope alternative direction — simplifying the routine, gentler/less-frequent cleansing, a hydration-supportive product category — rather than a specific medical treatment claim.
4. Communicates this to the client without diagnosing a medical condition, without contradicting her harshly, and without implying she was foolish for self-treating.

**Incomplete when:** the answer identifies the pattern correctly but offers no client-facing language, or offers client language but never explains why the current product is the problem.

**Focused revision examples (one per response, not both):**

- "You correctly identified the dry-scalp pattern. Add what you would actually say to redirect her away from the anti-dandruff shampoo."
- "Your client language is good. Add why the anti-dandruff shampoo made this worse instead of better."

**Immediate correction triggers:** diagnoses a specific medical skin condition (e.g., states this is "eczema" or "psoriasis" as fact); promises the recommended product will "cure" or permanently fix the presentation; recommends a prescription-strength product by name; dismisses or belittles the client's self-care attempt.

---

### `m6cp2` — Spectrum placement and referral judgment

**Exact question (displayed and evaluated, byte-identical):**

> Same client, but this time the microscope shows yellowish clumped flakes near the follicle, visible oiliness, mild redness, and the client reports it spreads to her eyebrows and hairline. How does your response change — and is this still within the scope of a head spa service?

**Competency assessed:** The student can place a more involved presentation on the spectrum, recognize the referral-relevant features, and respond appropriately — without diagnosing.

**Pass when the answer demonstrates all of the following, in any natural wording:**

1. Recognizes the presentation as more consistent with the more-involved end of the dandruff spectrum than simple dry scalp, without naming it as a confirmed diagnosis (e.g., does not assert "this is seborrheic dermatitis").
2. Identifies that spread beyond the scalp combined with redness is a referral-relevant finding (per Section 6.6).
3. Gives a reasonable scope decision tied to the described severity — proceeding conservatively, modifying, pausing, or referring — rather than defaulting to "proceed as normal."
4. If recommending any service action at all, stays within already-approved within-scope categories (cleansing support, OTC-only 1%-strength anti-fungal/zinc/selenium-sulfide category, botanicals) rather than inventing a new treatment.
5. Gives client-facing language that explains the change or the referral without alarming the client or stating a diagnosis.

**Incomplete when:** the answer correctly identifies the presentation as more severe but never states whether or how the scope decision changes, or recommends referral with no client-facing language for how to say it.

**Focused revision examples (one per response, not both):**

- "You recognized this is more involved. State clearly whether you would proceed, modify, pause, or refer — and why."
- "Your scope decision is right. Add what you would actually say to the client."

**Immediate correction triggers:** diagnoses seborrheic dermatitis or another named medical condition as confirmed fact; recommends a prescription-strength product by name; promises the head-spa service will resolve or cure the spreading presentation; fails to mention referral or scope limits at all despite the scenario's spread-with-redness description (a required element for this specific scenario).

---

### Are both checkpoints necessary?

**Yes — retained as two required checkpoints.** They assess genuinely different competencies: `m6cp1` tests identification-and-correction of a common misidentification pattern; `m6cp2` tests spectrum placement and referral/scope judgment for a more involved presentation. Collapsing them into one checkpoint would either lose one of these two distinct competencies or produce a single overloaded question that cannot be graded against a focused rubric. This is not "two because two exist today" — it is two because two distinct things need to be demonstrated.

---

# Approved Cadence behavior

## Module-opening greeting

> Module 5 taught you how to adapt a service. Module 6 teaches you how to interpret what you're looking at before you decide anything — because the same flakes can mean two very different things, and treating the wrong one usually makes it worse.

## Guide system

> You are Cadence, AIMT's curriculum-grounded guide for the Head Spa Certification Course. The student is in Module 6, Conditions & Disorders. Help the student distinguish a dry-scalp presentation from the dandruff-to-seborrheic-dermatitis spectrum, recognize that appearance alone does not establish cause, and decide whether to proceed, modify, or refer. Reinforce that spread beyond the scalp combined with redness, broken or weeping skin, severe symptoms, or no improvement with reasonable care are referral-relevant findings. Do not diagnose, prescribe, name a specific medical condition as confirmed fact, claim personal practitioner experience, or treat any illustrative image as clinical proof. Your guidance is built from AIMT's approved curriculum and the instructor's applied experience; you do not claim that experience as your own. Be direct, warm, practical, and concise.

## Approved quick prompts

1. `How do I tell dry scalp from dandruff?`
2. `When should a flaking presentation raise more concern?`
3. `What botanicals work for inflammation?`

(Prompt 2 is revised from "When does dandruff become seborrheic dermatitis?" — the original phrasing implies a diagnostic progression the student is not qualified to declare. The revised prompt asks the actionable, in-scope question instead: when should concern/referral-thinking increase.)

## Cadence response requirements

Cadence should:

- help the student reason through ambiguous or overlapping presentations;
- distinguish visible evidence from client-reported history;
- help the student decide between proceeding, modifying, pausing, or referring;
- give client-facing language when useful, including how to correct a client's self-diagnosis gently;
- correct diagnostic or unsupported claims immediately;
- remain concise.

Cadence must not:

- use the old course name;
- present itself as a human practitioner or claim personal industry experience;
- diagnose or name a specific medical condition as confirmed for a described client, and then direct or imply a treatment for it — naming an OTC product category is retail literacy, not diagnosis-and-prescription, and Cadence must never chain the two together;
- prescribe or recommend a prescription-strength (2%) product;
- treat an illustrative image or diagram as clinical proof of anything;
- state a specific numeric temperature/sebum relationship — this claim was removed from the approved curriculum on re-audit (see "Required corrections" #9) and must not be reintroduced by Cadence;
- expand scope beyond what this module's approved curriculum covers.

Persistent Cadence threads remain deferred.

---

# Acceptance criteria

Implementation is not complete until all of the following are verifiable:

1. Section numbering runs 6.1–6.8 with no gap and no combined "6.5 & 6.6" heading.
2. Hero eyebrow, home-row title, and `MODULE_TITLES[6]` all read "Conditions & Disorders" with no "Common" variant remaining anywhere.
3. Exactly one tap-interaction hint appears in Section 6.3, placed immediately before the tappable comparison cards.
4. `.cp-q` and `M6.questions.m6cp1`/`m6cp2` are byte-identical (verified programmatically, not by inspection).
5. `M6.systems.m6cp1` and `M6.systems.m6cp2` exist as separate rubrics; the single shared `M6.system` function no longer exists.
6. `submitM6CP` passes the approved 5th `errorMessage` argument.
7. Both checkpoint voice buttons carry `aria-label="Speak your answer"`; both submit buttons carry `aria-label="Send response to Cadence"`; both `.cp-res` regions carry `aria-live="polite"`.
8. `#spectrumSlider` carries an explicit `aria-label` or `aria-labelledby` association.
9. `.vs-card` is a native, keyboard-focusable, `Enter`/`Space`-activatable control with `aria-expanded` state — verified by real keyboard activation, not just markup inspection. `.cycle-step` and `.trigger-item` no longer exist as interactive controls — the cycle content and trigger content render as static markup with no `onclick`, `tabindex`, or ARIA state (verified by confirming no click handlers remain on either).
10. `.vs-detail`'s reveal animation respects `prefers-reduced-motion`. (`.cycle-insight`'s animation no longer applies — the cycle content is static and always visible, so there is no reveal to animate.)
11. `MODULE_MEMORY_TAGS[6]` no longer includes `scope-awareness`.
12. `M6.system`/`MODULE_GUIDE_SYSTEMS[6]` no longer contain "HeadSpa Mastery" or the "nearly two decades" personal-experience claim.
13. A standalone, always-visible Section 6.6 referral list and script exists and does not require any interaction to view.
14. The spectrum slider's position-4 text no longer functions as the module's only referral information.
15. The new signature "Sort three presentations" interaction is implemented per its full specification (feedback, retry, accessibility, no persistence, no progress write, no completion gate).
16. Section 6.4's six-step cycle renders as static, always-visible content — no click required to read any of the six insight paragraphs, and no residual `.cycle-step`/`cycleStep()` interactive code remains.
17. Ketoconazole card specifies 1%-strength only (never 2%) and no longer states "without requiring medical oversight"; Section 6.7 includes the new explicit scope note that a product-category recommendation is not a diagnosis or a prescription.
18. Diet and stress trigger items reflect the corrected certainty language. The "excess oil production" trigger item **contains no numeric percentage or per-degree claim** — verified by confirming the string "10%" (and any other specific percentage tied to temperature) does not appear anywhere in Module 6's rendered copy.
19. Section 6.3 includes the overlap/ambiguity closing note.
20. Both checkpoints' immediate-correction triggers are verified to fire on at least one mocked unsafe/diagnostic answer each, including at least one mocked answer that recommends or names a prescription-strength (2%) product.
21. No regression to Modules 0–5: reopening each confirms byte-identical content and unaffected checkpoint/progress state.
22. Mobile viewport (375×812) shows no horizontal overflow across the three ungraded interactions, the new referral section, and the required Visual 1 illustration.
23. Review Mode continues to route Module 6 checkpoint test submissions through the existing unsaved test path.
24. Module 7 unlock behavior is unaffected by these changes (still requires both `m6cp1` and `m6cp2` passed).
25. None of the four original placeholder boxes ("Dry Scalp — Microscopy," "Dandruff — Microscopy," "Mild Dandruff — Microscopy," "Seborrheic Dermatitis — Microscopy") remains in the implemented module in its original decorative-placeholder form — Section 6.3 shows the required Visual 1 illustration per its full specification; Section 6.5's two placeholders are removed with no replacement required.

---

# Distinct learning rhythm

Compared to Module 4 (observation-led, visual, five-point stepper, appearance gallery) and Module 5 (decision-led, five-service-lever adaptation, one large signature protocol-choice interaction):

**Module 6 is interpretation-led.** Its dominant learning mode is distinguishing between overlapping presentations and recognizing the limits of a confident-looking visual read.

- **Interaction density:** light-to-moderate, and deliberately so after re-audit — three ungraded interactions, each with a distinct instructional job: the comparison-card toggle (distinguish), the spectrum slider (observe a continuum experientially), and the new signature "Sort three presentations" interaction (decide/apply). Two originally-planned interactions (the cycle-step selector and the trigger accordion) were simplified to static content because they were revealing information rather than requiring judgment — see "Approved interactions — full audit." This is lighter than Module 5's single large signature interaction in click count, but the signature interaction carries comparable decision-making weight; the difference from Module 5 is that Module 6 also keeps two lightweight comparison/observation interactions because its content specifically benefits from active comparison, not because more clicks were needed to fill space.
- **Checkpoint placement:** two-stage, at natural competency boundaries (mid-module after the identification/correction content, end-of-module after the full spectrum-and-referral content) — different from Module 4's placement rationale and Module 5's end-loaded final checkpoint placement, but consistent with the general "checkpoint after the content it tests" principle both those modules also follow.
- **Where independent reasoning happens:** the signature "Sort three presentations" interaction and both checkpoints.
- **Where Cadence adds value:** ambiguous/overlapping presentations, referral-timing judgment, and client-communication scripts — a distinctly diagnostic-adjacent-reasoning role, different from Module 5's protocol-construction role.
- **Curiosity/payoff structure:** the "spectrum, not two conditions" reveal and the "wrong product cycle" causal chain give Module 6 a detective/investigative feel — figuring out what's really going on — that is distinct from Module 4's careful-observation feel and Module 5's protocol-building feel.
- **What prevents this from feeling like the same template again:** Module 6 is the first module built around telling apart two things that look similar, rather than building a single skill in one direction (observe carefully; adapt a protocol). Its signature interaction is a triage decision (proceed/modify/refer), not a scenario-selection decision like Module 5's.

---

# Guided completion structure

## Estimated attentive learning time

Approximately **14–18 minutes** for the instructional content and the four ungraded reveal interactions. This is an estimate from content volume (roughly 1,400 words in the current extraction, plus the new Section 6.2 and Section 6.6 content), not a measured completion time.

## Estimated checkpoint time

Approximately **8–12 minutes** total for both open-response checkpoints, excluding retries or network delay.

## Suggested hands-on practice

Approximately **15–20 minutes** with a model, training partner, or reference photography:

1. Practice describing two or three real or reference presentations using only observable features (not a diagnosis).
2. Identify at least one referral-relevant feature per presentation, if present.
3. Draft the client-facing language for one correction (a client who has been mistreating a dry-scalp presentation as dandruff).
4. Draft the referral script for one presentation that would warrant it.

Not a required progress gate in the current implementation.

## Competency demonstrated

The student can distinguish overlapping scalp presentations using multiple observable cues, place a presentation on the dandruff-to-seborrheic-dermatitis continuum without diagnosing, decide whether to proceed, modify, or refer, and communicate that decision to a client responsibly.

## Earlier concepts to revisit

- Module 1: referral language; license-dependent scope.
- Module 4: observation versus conclusion; the five observation lenses; preserve/modify/avoid/pause/refer.
- Module 5: the five service levers; product-category-follows-decision reasoning; client-communication scripts for a modified service.

## Suggested course-path position

Immediately after Module 5 and before Module 7. Module 6 is the bridge between service adaptation (Module 5) and the physical environment the practitioner will build in Module 7 — interpretation and judgment come before workspace design.

---

# Listen Mode notes

## Narration suitability

Most of Module 6's prose narrates well — 6.1, the new 6.2, the dry-vs-dandruff explanatory paragraphs, the cycle insights, the spectrum-state descriptions, the new Section 6.6 referral script, the treatment-grid cards, and the trigger details are all readable sequential text.

**Approximate narration length:** **11–14 minutes**, excluding checkpoint and interaction time. Content-based estimate, not a measured recording duration.

## Visual-review cues

Narration should direct the listener to review the screen at:

- Section 6.3's comparison cards;
- Section 6.5's spectrum slider;
- Section 6.6's referral list (even though it is text, its always-visible standalone presentation is part of its teaching value);
- the signature "Sort three presentations" interaction.

Sections 6.4 and 6.8 no longer need a visual-review cue for their own sake — both are now static, always-visible content and narrate directly like any other prose section.

## Screen-required content

The following require the screen and cannot be proven through audio alone:

- the signature "Sort three presentations" interaction;
- checkpoint `m6cp1`;
- checkpoint `m6cp2`;
- any visual/interactive feedback state across the four ungraded interactions.

## Content that must not be treated as audio-only competency

Unlike Module 5 (no reveal-gated content), **two of Module 6's three ungraded interactions still gate explanatory text behind a tap/click/drag** — the comparison-card toggle and the spectrum slider. (The cycle-step and trigger-item content, per the interaction-density re-check above, is now static and visible by default, so it no longer poses this problem — narrating it requires no special handling.) A narration script must still explicitly narrate the comparison-card details and the four spectrum states rather than only reading what is visible by default, or an audio-only pass would omit that content. This is a smaller version of the same consideration flagged in the initial audit pass — the re-check's interaction simplification directly reduced Module 6's Listen Mode obstacle from four gated elements to two.

Listening alone must never be treated as proof of competency — checkpoints still require typed or spoken free-text response either way.

---

# Downloadable resource opportunity

**Recommended.**

**Title:** AIMT Scalp Presentation & Referral Quick Reference

**Practical use:** a one-page, consultation-room-usable reference distinguishing dry-scalp and dandruff-spectrum presentations by observable feature, listing within-scope product categories, and listing the Section 6.6 referral triggers and script — the kind of thing a practitioner would want to glance at during an actual intake rather than reopening the full lesson.

**Format:** single-page PDF, printable and mobile-viewable.

**What it contains:** the corrected comparison table from Section 6.3; the four within-scope product categories from Section 6.7; the Section 6.6 referral trigger list and script, verbatim.

**Lesson placement:** referenced (not embedded) near the end of Section 6.6, alongside the completion card.

**Future centralized Resources Library location:** conditions-and-referral reference category, alongside Module 5's approved (also-deferred) "AIMT Regional Service Adaptation Guide."

This resource is not created or linked by this task. Production remains deferred, matching the existing Module 5 downloadable decision and the governing downloadable-resource policy (selective, not mandatory).

---

# Visual asset plan

**Re-audited to a complete, unambiguous per-placeholder decision.** The initial audit pass left this unresolved — it said no new imagery was required for implementation while also describing future recommended photography, without instructing what implementation should actually do with the four existing placeholder slots today. That is corrected below: every one of the four current placeholders has an explicit, final disposition. None is left as a generic, unresolved production marker.

## Disposition of the four existing placeholders

| # | Current placeholder | Decision | Replacement |
|---|---|---|---|
| 1 | Section 6.3, left — "Dry Scalp — Microscopy" | **Replace with a required non-diagnostic illustration** | Left panel of Visual 1 (below) |
| 2 | Section 6.3, right — "Dandruff — Microscopy" | **Replace with a required non-diagnostic illustration** | Right panel of Visual 1 (below) |
| 3 | Section 6.5, left — "Mild Dandruff — Microscopy" | **Remove — does not add enough teaching value** | None required; optional future Visual 2 (below) may occupy this space |
| 4 | Section 6.5, right — "Seborrheic Dermatitis — Microscopy" | **Remove — does not add enough teaching value** | Folded into the same disposition as #3 |

No placeholder is left unresolved. Implementation must not carry any of the four current decorative placeholder boxes forward unchanged.

## Required for initial implementation

### Visual 1 — Dry scalp vs. dandruff comparative illustration (REQUIRED)

This directly replaces placeholders #1 and #2. Unlike the initial audit pass's deferred "real photography, someday" recommendation, this is a required, achievable-now asset — a non-diagnostic illustration does not require sourcing consented clinical photography and does not block implementation.

- **Required or optional:** **Required** for initial implementation.
- **Quantity:** 1 two-panel diagram (or two matched single-panel illustrations presented as a pair) — one panel per pattern.
- **Type:** **non-diagnostic illustration/diagram** — explicitly not styled as clinical microscopy and not photography. A simple, clearly-illustrated schematic representation of flake size, color, matte-vs-oily sheen, and distribution for each pattern.
- **Exact placement:** Section 6.3, positioned alongside (not replacing) the existing `.vs-card` comparison cards — the cards carry the text distinction; the illustration supports it visually.
- **Teaching purpose:** give the student a visual anchor for the size/color/oiliness distinction already described in the text, without claiming photographic or clinical authority the module cannot back up.
- **Orientation/crop:** two panels side by side (stacked on mobile), identical scale and framing between them.
- **Caption/visible label:** panel labels "Dry-scalp pattern (illustrative)" / "Dandruff-spectrum pattern (illustrative)"; a shared caption beneath both reading "Illustrative comparison — not a clinical or diagnostic image."
- **Alt-text intent:** describe only the illustrated features (e.g., "illustration comparing fine, matte, powdery flakes with minimal oil to larger, yellowish, oily flakes near the root"); never a diagnostic conclusion.
- **Comparison consistency required:** **yes** — identical illustration style, scale, and framing for both panels.
- **Non-diagnostic caution required:** **yes**, explicit and required — state plainly that this is an illustrative schematic, not a clinical or diagnostic photograph, and that appearance alone does not establish cause (directly reinforcing Section 6.2).

## Optional — future addendum only (not authorized, not required, not blocking)

### Visual 2 — Dandruff-to-seborrheic-dermatitis gradient (OPTIONAL)

- **Required or optional:** **Optional.** Not required for initial implementation; implementation must proceed and pass acceptance without it.
- **Quantity:** 1, if produced.
- **Type:** non-diagnostic **illustrative gradient/diagram**, not photography, and not a two-photo pair — a continuous gradient correctly represents "one spectrum," where two discrete photographs (the current placeholder approach) would misleadingly imply a hard category boundary the module explicitly teaches against.
- **Exact placement:** Section 6.5, in the space vacated by removed placeholders #3 and #4.
- **Teaching purpose:** visually reinforce "one spectrum, not two conditions."
- **Orientation/crop:** N/A (diagram).
- **Caption/visible label:** label the gradient's endpoints in plain, non-diagnostic language ("milder presentation" → "more involved presentation").
- **Alt-text intent:** describe the diagram's structure and endpoints only, never a medical conclusion.
- **Comparison consistency required:** N/A — single diagram, not a comparison pair.
- **Non-diagnostic caution required:** **yes**, same standard as Visual 1, if produced.

### If real presentation photography is pursued at any future point (optional, not the current plan)

Real, authenticated, consented, de-identified photography for Section 6.3 remains a conceivable long-term upgrade over Visual 1's illustration, mirroring Module 5's real-photography addendum precedent — but it is explicitly **not** the required or recommended near-term path for Module 6, given the consent/authentication overhead and given Visual 1's illustration adequately serves the teaching purpose without it. If pursued at any point, the caption and alt text **must explicitly state that the photography is an illustrative example of visible features and not diagnostic evidence** — the same non-diagnostic caution standard applied throughout this plan, worded no less strongly for being a photograph rather than a diagram.

### Section 6.6 (referral)

No imagery required or recommended — the section's value is the text list and script, matching how Module 4's referral section carries its weight through language, not imagery.

## Do not

- Do not carry any of the four current placeholder boxes into the approved implementation unchanged or as an "unresolved" marker.
- Do not fabricate clinical photographs, stock images presented as microscopy, or unlabeled generated imagery.
- Do not present Visual 1 or Visual 2 as more clinically authoritative than an illustration/diagram actually is.
- Do not reuse Module 4 or Module 5 imagery in a way that would create confusing repetition.
- Do not imply, through caption, alt text, or nearby copy, that any image or diagram proves a diagnosis.

---

# Implementation notes

- The heat/sebum temperature claim's specific numeric figure ("10% per 1.8°F") is **removed** from Module 6 on re-audit, not merely hedged — see "Required corrections" #9 for the full reasoning (small non-scalp study population, surface-excretion-not-production measurement, the source authors' own alternative explanation, and the number's lack of practical actionability). Module 5 currently contains a verbatim, unhedged copy of the same claim — that is a pre-existing Module 5 defect, out of scope for this task since Module 5 is already implemented and manually approved. Flagged here for a future Module 5 consistency/polish pass, not resolved by this document. That future pass should apply the same reasoning recorded here (removal, not further hedging) rather than re-deriving it from scratch.
- Section 6.8's "Real-world integration — layering this on Module 5" info card and the closing Cadence "practitioner insight" note are folded into Section 6.8's close rather than kept as separate numbered content, consistent with the precedent set by Module 5's own manual-QA removal of its standalone recap section (Step 32 in `implementation-log.md`) — a closing insight reads better as supporting copy than as its own section.
- The new Section 6.6 referral script is adapted from Module 4's already-approved referral-script pattern for internal consistency across the course, not invented independently.
- `window._m6cpsDone` (set on every module-6 open, never read anywhere in the file) may be removed if repository-wide validation at implementation time confirms zero call sites and zero external references — same conditional-removal standard already applied to Module 5's `window._m5cpsDone`.
- This specification does not address Module 7's accuracy of the "equipment, tools, room design" preview in the current completion card — Module 7 has not been extracted or audited; that preview's accuracy is Module 7's own audit's concern, not this task's.
- Do not begin Module 7 extraction, implementation, or any certificate/completion-flow work as a result of this specification. Implementation of this specification is a separate, later task.
