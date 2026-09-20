# Module 6 — Source Extraction (Pre-Audit)

**Course:** AIMT Head Spa Certification Course
**Module:** 6 — student-facing title varies by surface (see §1)
**Status:** Extracted for external audit. Not audited, not approved, not implemented.
**Production source of truth:** `headspa-mastery.html`, `assets/js/headspa-state.js`
**Source commit at extraction time:** `b10a939921d17d1117ec835af1c45bc76f4a09cb` ("Add Module 5 video source")
**Branch:** `course-audit-build`

This document is a neutral, verbatim record of the current Module 6 experience as it exists in production code today. It does not propose replacement curriculum, approved outcomes, final copy, or implementation instructions — see `module-06.md` (not yet created) for the future external-audit scaffold. Nothing in this document has been implemented, corrected, or approved. No production file was modified to produce this extraction.

---

## 1. Module identity

| Field | Value | Source |
|---|---|---|
| Technical module number | `6` | `MODULE_CHECKPOINTS['6']`, `M6`, `module6Wrap`, `data-module-id="6"` |
| Student-facing title (home-screen row) | **Module 6 — Conditions & Disorders** | `headspa-mastery.html:2386` |
| Student-facing title (`MODULE_TITLES[6]`, lesson nav-bar title) | **Module 6 — Conditions & Disorders** | `headspa-mastery.html:6311` |
| Dashboard subtitle (home-screen row) | **Dandruff, Malassezia, seborrheic dermatitis** | `headspa-mastery.html:2386` |
| Hero eyebrow | **Module 6 · Common Conditions & Disorders** | `headspa-mastery.html:4940` — note "Common Conditions & Disorders," not "Conditions & Disorders" as in the home-row title and `MODULE_TITLES[6]`; same class of wording drift already flagged for Module 5's hero eyebrow (not resolved here) |
| Hero title | **Before you treat, you have to interpret correctly.** | `headspa-mastery.html:4941` |
| Hero description | "By this point you know how to observe the scalp and recognize scalp types. Now you're adding another layer — conditions that change how those patterns behave. Because if you misread what you're seeing, you will choose the wrong approach with confidence." | `headspa-mastery.html:4942` |
| Wrapper ID | `module6Wrap` — standard hidden-template pattern (matches Modules 0, 1, 2, 4, 5) | `headspa-mastery.html:4936` |
| JavaScript identifiers | `M6` (questions + shared `system` function), `submitM6CP(id)`, `m6cpKey(e,id)`, `toggleVsCard(cardId, detailId)`, `cycleStep(idx)`, `updateSpectrum(val)`, `toggleTrigger(el)`, `CYCLE_INSIGHTS`, `SPECTRUM_STATES`, `window._m6cpsDone` | `headspa-mastery.html:6981, 7695, 7698, 7647, 7671, 7684, 7689, 7662, 7677, 7248` |
| Checkpoint IDs | `m6cp1`, `m6cp2` — standard `mNcpX` pattern | `headspa-mastery.html:5181, 5199`; `MODULE_CHECKPOINTS['6']` at `headspa-mastery.html:6279` |
| Completion-card ID | `m6Complete` | `headspa-mastery.html:5217` |
| Routing entry | `openModuleById(6)` (home row and Module 5's completion-card "Start Module 6 →" button); `STATIC_MODULES[6]` in `openModuleById()` copies `#module6Wrap`'s innerHTML into `.lesson-wrap`, then (uniquely among all modules) runs a 100ms `setTimeout` calling `updateSpectrum(ss.value)` to populate the spectrum-slider output text on open, and resets `window._m6cpsDone = 0` | `headspa-mastery.html:2384, 3482, 7248` |
| Module 5 prerequisite | `APP_STATE.canAccessModule(6)` returns `isModuleComplete(5)` (both `m5cp1` and `m5cp2` passed) unless Course Review Mode is active — no module-6-specific override found | `assets/js/headspa-state.js:628–636` |
| Module 7 unlock | Module 6's completion card links to `openModuleById(7)`; `APP_STATE.canAccessModule(7)` requires `isModuleComplete(6)` (both `m6cp1` and `m6cp2` passed, no read-percentage minimum) | `headspa-mastery.html:5225`; `assets/js/headspa-state.js:628–636, 583–593` |
| Completion-card routing special case | `getVisibleCompletionCard(moduleId)` hardcodes only `moduleId === 3` as an exception (`'lessonComplete'`); every other module, including 6, uses the generic `'m' + moduleId + 'Complete'` pattern — confirmed Module 6 is **not** a structural outlier the way Module 3 is | `headspa-mastery.html:6407–6408` |
| Special-case behavior | The `setTimeout(... updateSpectrum(ss.value) ..., 100)` call in `STATIC_MODULES[6]` is unique to Module 6 among all `STATIC_MODULES` entries — every other module's entry is a single-line innerHTML copy (Module 4 and Module 7 also run one extra reset call each — `window._m4cpsDone = 0` and `resetPrepChecklist()` respectively — but only Module 6 combines a state reset with a timed re-render call). `window._m6cpsDone` is set to `0` on every module-6 open but, like Module 5's `window._m5cpsDone`, **is never read anywhere else in the file** — confirmed by grepping the full file for `_m6cpsDone`, which returns only this one assignment. Module 6 has no interaction that would consume a counter like this (none of its four interactions are "answer N of M items" style). | `headspa-mastery.html:7248` (grep for `_m6cpsDone` returns only this one assignment) |

---

## 2. Complete student-facing curriculum (verbatim, in student encounter order)

Reproduced exactly as it appears in `headspa-mastery.html:4936–5230` (the full `#module6Wrap` block). Wording is unedited; only structural/HTML scaffolding is summarized where it does not change what the student reads.

### Hero

> **Module 6 · Common Conditions & Disorders**
> **Before you treat, you have to interpret correctly.**
> By this point you know how to observe the scalp and recognize scalp types. Now you're adding another layer — conditions that change how those patterns behave. Because if you misread what you're seeing, you will choose the wrong approach with confidence.

### 6.1 — "Your role here"

> **Recognize. Understand. Adjust. Know when to stop.**
>
> Most clients are not intentionally mismanaging their scalp. They are guessing. They see flakes and assume dryness. They feel itching and assume dandruff. They see oil and assume they need stronger cleansing. Then they treat based on symptoms instead of cause. Your job is not to agree with their diagnosis. Your job is to interpret.
>
> In a head spa setting you will regularly encounter clients with visible scalp concerns — flaking, oil imbalance, irritation, buildup, itching, discomfort. Some of these fall well within scope. Others require referral. Your responsibility is to recognize what you're seeing, understand what may be driving it, adjust your service, and know when not to proceed.

**Note:** section numbering jumps directly from 6.1 to 6.3 — no "6.2" eyebrow, heading, or content block exists anywhere in `#module6Wrap`. Confirmed by reading the complete block and grepping for `6.2` inside it: no match. See §13.

### 6.3 — "The most important distinction in scalp care"

> **Dry scalp and dandruff are not the same thing.**
>
> They may both present with flaking. But the cause — and therefore the treatment approach — is completely different. Getting this wrong is one of the most common and most consequential mistakes in scalp care. Tap each side to understand them fully.

**Interaction hint text (first instance):** "↓ Tap each card to expand" — appears immediately after the paragraph above, but the very next element in student encounter order is the static, non-interactive photo pair below, not the tappable cards. See §3 for the interaction this hint actually describes and §13 for the sequencing/duplication finding.

**Photo pair** (both placeholder graphics — see §7):

| Slot | Label | Caption below box |
|---|---|---|
| Left | "Dry Scalp — Microscopy" | "Fine white powdery flakes, matte surface, minimal oil" |
| Right | "Dandruff — Microscopy" | "Yellowish clumped flakes, oily surface, near follicle" |

**Interaction hint text (second instance):** "↓ Tap each pattern to see what it means" — appears again, directly above the two tappable comparison cards described next. See §13 — this is the third distinct phrasing of the same "tap to learn more" idea within a few paragraphs (body text: "Tap each side to understand them fully"; first hint: "Tap each card to expand"; second hint: "Tap each pattern to see what it means").

**Dry scalp vs. dandruff comparison cards** (`.vs-card`, tappable — see §3):

*Dry scalp card* (tag: "Hydration issue"):
- Small, white, powdery flakes
- Matte, non-oily surface
- Tightness or mild itch
- Minimal visible oil
- Expand hint: "+ See why this matters"

*Dandruff card* (tag: "Biological imbalance"):
- Larger, yellowish flakes
- Oily or clumped near root
- Visible oil at scalp
- Irritation or redness
- Expand hint: "+ See why this matters"

**Expanded detail — "Dry scalp — the deeper picture"** (revealed on tap):

> Dry scalp flakes because it lacks moisture. The hydrolipid film is depleted or compromised — the scalp isn't retaining what it needs. This is a barrier issue, not a disease process. Causes include aging, seasonal changes, over-cleansing, harsh products, chemical processing. Treatment direction: gentle exfoliation to lift dead cells, then hydration and barrier repair. The goal is to restore what's missing, not suppress a biological process.

**Expanded detail — "Dandruff — the deeper picture"** (revealed on tap):

> Dandruff flakes because the scalp is functioning abnormally. Excess oil, microbial activity (primarily Malassezia yeast), inflammation, and accelerated skin cell turnover all combine to produce the flaking and irritation. This is not a hydration problem — adding moisture to an oily, inflamed scalp can make it worse. Treatment direction: cleansing support, oil control, anti-fungal supporting ingredients, anti-inflammatory botanicals. The goal is to rebalance the environment, not repair a barrier.

### 6.4 — "The cycle worth understanding"

> **Why the wrong product makes things worse.**
>
> Most clients with dry scalp end up using anti-dandruff shampoo. They see flakes, assume dandruff, reach for the strongest thing they can find. Here's what actually happens.

**Interaction hint text:** "↓ Tap each step to follow the cycle"

**Six-step cycle** (`.cycle-step`, tappable — see §3), displayed as a vertical sequence with arrows between steps:

1. "Client notices flaking on their clothing and scalp" (`active` by default on load)
2. "Assumes it must be dandruff. Buys anti-dandruff shampoo."
3. "Anti-dandruff shampoo strips the scalp of its remaining moisture and oils"
4. "Scalp becomes drier. Flaking worsens. More irritation."
5. "Client increases usage — thinks they need more of the same product"
6. "Back to step 1. The cycle continues. They arrive at your table having over-treated for months."

**Insight text shown per step when tapped** (`CYCLE_INSIGHTS`, hidden until a step is selected):

1. "This is where it starts. A client sees flakes and immediately interprets them as dandruff. The assumption is almost universal — and almost always made without any real assessment."
2. "The product choice follows the assumption. Anti-dandruff shampoos are heavily marketed, widely available, and seem like the logical solution. The mistake is reaching for the wrong one."
3. "Anti-dandruff shampoos strip oil, suppress yeast, and slow cell turnover. On a scalp that already lacks moisture, they remove what little barrier is left."
4. "The scalp responds to barrier loss by becoming drier, tighter, and more reactive. Flaking increases. The client interprets this as the condition getting worse."
5. "The logical response to a product not working is to use more of it. This accelerates the damage cycle."
6. "By the time they reach you, the scalp has been compromised repeatedly. Your first job is often to stop the damage — not start a new treatment."

**Cadence note:**

> "This is not treatment failure. It is misidentification. Flaking alone does not justify anti-dandruff treatment. Your job is to identify what type of flaking you are seeing before recommending anything. Sometimes the best thing you can do is simplify — not add more."

**Info card — "What this looks like in real time":**

> **Scenario 1 — fine white flakes, no oil, tight matte scalp:** Weak call: dandruff — treat aggressively. Stronger call: dry scalp — support barrier, reduce stripping.
>
> **Scenario 2 — yellowish flakes, oil at root, slight redness:** Correct call: dandruff pattern — support cleansing and regulation.
>
> **Scenario 3 — flakes, some oil, mild irritation (not clean):** Stronger approach: mixed presentation — avoid aggressive stripping, support balance first. This is where most people hesitate and make the wrong call.

### 6.5 & 6.6 — "Malassezia to seborrheic dermatitis"

Both section numbers share a single combined eyebrow: "6.5 & 6.6 — Malassezia to seborrheic dermatitis." No separate 6.5-only or 6.6-only heading exists — confirmed by reading the full block.

> **Not two conditions. One spectrum.**

**Photo pair** (both placeholder graphics — see §7):

| Slot | Label | Caption below box |
|---|---|---|
| Left | "Mild Dandruff — Microscopy" | "Early Malassezia activity, oily flaking" |
| Right | "Seborrheic Dermatitis — Microscopy" | "Advanced — redness, scaling beyond scalp, inflammation" |

> Malassezia is a naturally occurring yeast found on most scalps. It becomes a problem when oil production increases, the scalp environment shifts, and the yeast becomes overactive. As it progresses, it moves along a spectrum from mild dandruff to seborrheic dermatitis — the same biological process at different levels of severity.

**Interaction hint text:** "↔ Drag to move along the spectrum"

**Spectrum slider** (`#spectrumSlider`, a native `<input type="range">`, min `1`, max `4`, default value `1`, step `1` — see §3):

| Position | Label above slider | Output text shown when selected (`SPECTRUM_STATES`) |
|---|---|---|
| 1 | "Balanced" | "A balanced scalp has Malassezia present at normal levels — no visible flaking, no redness, no irritation. Sebum production is balanced." |
| 2 | "Mild dandruff" | "Early Malassezia-driven dandruff: small white to yellow flakes, slight clustering, mild oil, minimal redness. Still within scope with appropriate product choices." |
| 3 | "Moderate" | "Moderate stage — flakes more visible, oil presence notable, mild redness. Client likely notices this daily. Head spa can support — consistent home care also needed." |
| 4 | "Seborrheic dermatitis" | "Seborrheic dermatitis — larger thicker flakes, pronounced redness, flaking beyond the scalp to eyebrows, hairline, ears. If inflammation is severe, active, or painful, refer out." |

Note: position 4's output text is the only explicit referral-language sentence anywhere in Module 6's current curriculum ("If inflammation is severe, active, or painful, refer out.") — it is embedded inside a dynamically-rendered, hidden-until-interacted-with slider state, not presented as a standalone scope/referral section. See §8 and §13.

### 6.7 — "Treatment within scope"

> **You are supporting the environment. Not treating the condition.**

**Four-card treatment grid** (`.treatment-grid`, static, non-interactive):

| Card | Title | Body |
|---|---|---|
| ① | Cleansing support | "Regular cleansing reduces excess oil, buildup, and the microbial overgrowth that Malassezia feeds on. Consistency matters more than intensity." |
| ② | Anti-fungal supporting ingredients | "Zinc, ketoconazole (OTC recommendation only — not prescription), selenium sulfide. These help manage yeast activity without requiring medical oversight." |
| ③ | Anti-inflammatory botanicals | "Licorice root and chamomile calm the scalp — reducing redness, irritation, and discomfort without disrupting the barrier. Preferred over aggressive treatments in a head spa context." |
| ④ | Regular maintenance | "Irregular care leads to fluctuation in symptoms. The most effective approach is consistent support over time — not aggressive intervention when things flare." |

### 6.8 — "What makes it worse"

> **Match the trigger to what it does.**
>
> Understanding what aggravates these conditions helps you educate clients in a way that actually changes their behavior.

**Interaction hint text:** "↓ Tap each trigger to reveal its mechanism"

**Four-item trigger list** (`.trigger-item`, tappable, accordion-style, one open at a time — see §3):

| Trigger | Detail (revealed on tap) |
|---|---|
| Stress & hormonal changes | "Increases oil production and can trigger flare-ups of existing conditions. Clients who notice seasonal or cyclical worsening are often seeing a hormonal pattern. Asking about stress levels and lifestyle during intake is diagnostically useful." |
| Diet high in sugar, fried, or inflammatory foods | "Contributes to increased oil production and systemic inflammation — both of which feed Malassezia activity. Clients who clean up their diet often see scalp improvement without changing any products. Worth mentioning, not lecturing about." |
| Excess oil production | "Creates the ideal environment for Malassezia overgrowth. Temperature, hormones, and diet all influence how much oil the scalp produces. This is why warm weather flare-ups are common — sebum production rises approximately 10% per 1.8°F increase in temperature." |
| Wrong product use | "The most correctable trigger. Overly harsh or stripping products worsen both dryness and dandruff conditions. Clients often arrive already over-treating — multiple shampoos, aggressive products, inconsistent routines. Simplification is often more effective than adding more." |

**Info card — "Real-world integration — layering this on Module 5":**

> This module does not replace scalp type analysis. It layers on top of it. You are now asking: is this dry? Is this oil-driven? Is this microbial? Is this mixed? And then: what matters most right now? The practitioner who can answer those questions quickly — and correctly — is the one who makes decisions instead of guesses.

**Cadence note — "Practitioner insight":**

> "After enough clients, you start to notice: most people are treating the wrong problem. They over-cleanse, over-treat, constantly switch products. Sometimes the best move is not adding more. It's simplifying. Correct interpretation always comes before correct treatment."

### Checkpoint 1 (`m6cp1`) — "Real scenario"

See §4 for full checkpoint detail. Displayed question, placed here in encounter order:

> "A client comes in with visible flaking and says she's been using a zinc-based anti-dandruff shampoo for three months but it keeps getting worse. Under the microscope you see fine white powdery flakes, minimal oil, and a matte scalp surface. What's happening — and what do you tell her?"

### Checkpoint 2 (`m6cp2`) — "Final check"

See §4 for full checkpoint detail. Displayed question, placed here in encounter order:

> "Same client, but this time the microscope shows yellowish clumped flakes near the follicle, visible oiliness, mild redness, and the client reports it spreads to her eyebrows and hairline. How does your response change — and is this still within the scope of a head spa service?"

### Completion card (`m6Complete`)

> **Module complete.**
> You can now read the difference between dry scalp and dandruff, understand the Malassezia spectrum, and explain it to a client in plain language.
>
> **Up next — Module 7**
> Even the most knowledgeable practitioner cannot deliver a high-level experience in a poorly designed setup. Module 7 covers equipment, tools, room design, and how to build a workspace that makes everything else possible.
>
> [Start Module 7 →] [Back to course]

---

## 3. Existing learning interactions

Module 6 has **four distinct ungraded interactive components** in addition to its two required checkpoints — more interaction density than Module 5 (which had none) or Module 0/1/2's single practice interaction. None of the four write progress, gate completion, or persist state across a module reopen.

### "Dry scalp vs. dandruff" comparison-card toggle (`toggleVsCard`)

- **What the student sees:** two side-by-side cards (`#vsCardDry`, `#vsCardDandruff`), each showing a label, a one-line tag ("Hydration issue" / "Biological imbalance"), four bullet points, and a "+ See why this matters" expand hint.
- **What the student must do:** click/tap either card to reveal a longer explanatory paragraph below it (`#vsDetailDry` / `#vsDetailDandruff`).
- **Judgment vs. decorative:** genuine distinction-building — the two cards contrast diagnosis-adjacent presentations and reinforce the module's central "these are not the same thing" claim.
- **Correct/expected behavior encoded in the implementation:** `toggleVsCard(cardId, detailId)` closes every open card/detail first, then — if the clicked card was not already open — opens only the clicked card and its matching detail, and swaps that card's hint text from "+ See why this matters" to "− Close." Only one card can be expanded at a time; clicking an already-open card closes it (hint reverts to "+ See why this matters").
- **Feedback copy:** none beyond the revealed paragraph text itself — no "correct"/"incorrect" framing, since this is a compare-and-learn interaction, not a graded judgment.
- **Retry/reset behavior:** unlimited — either card can be reopened/closed freely, in any order, any number of times.
- **Progress write:** none — `toggleVsCard` contains no reference to `APP_STATE` anywhere in its implementation.
- **Persistence:** none — expanded/collapsed state is not stored; reopening the module always starts with both cards collapsed.
- **Gates completion:** no.
- **Keyboard/accessibility wiring visible in the code:** **none.** `.vs-card` is a plain `<div onclick="...">` with no `tabindex`, no `role="button"`, and no `aria-expanded`/`aria-pressed` on the card itself or the toggled detail region. Confirmed by directly inspecting the full `#module6Wrap` markup: no `tabindex` or `aria-` attribute appears anywhere in the block outside the checkpoints (which have their own separate, also-incomplete accessibility profile — see §10).

### "The wrong product cycle" step selector (`cycleStep`)

- **What the student sees:** six numbered steps in a vertical sequence connected by arrow glyphs (`↓`), the first step highlighted as `active` by default.
- **What the student must do:** click/tap any step to make it the active (highlighted) one and reveal a corresponding insight paragraph below the whole sequence.
- **Judgment vs. decorative:** borderline — the six steps are a fixed, pre-written causal chain the student reads/selects through rather than reconstructs or predicts; the "judgment" element is limited to choosing which step's insight to read next, not sequencing or deciding anything. This is closer to a guided-reveal reading aid than a "sequence the protocol" interaction.
- **Correct/expected behavior encoded in the implementation:** `cycleStep(idx)` sets `.active` on exactly the clicked step (removing it from all others) and replaces the shared `#cycleInsight` element's text with `CYCLE_INSIGHTS[idx]`, making it visible. There is no "correct" or "incorrect" step to select — every step is equally selectable and simply swaps the displayed insight text.
- **Feedback copy:** the six `CYCLE_INSIGHTS` strings (quoted in full in §2) — purely explanatory, not evaluative.
- **Retry/reset behavior:** unlimited — any step can be reselected at any time; there is no "completion" state for this interaction (e.g., no message shown after all six have been viewed, unlike Module 2's judgment-check pattern or Module 5's "What changes first?" pattern, both of which surface a distinct completion message once every option has been seen).
- **Progress write:** none — `cycleStep` contains no reference to `APP_STATE`.
- **Persistence:** none — reopening the module always resets to step 1 active, insight hidden (matches the hardcoded initial HTML state, since `cycleStep` is never called automatically on module open).
- **Gates completion:** no.
- **Keyboard/accessibility wiring visible in the code:** **none.** `.cycle-step` is a plain `<div onclick="...">` with no `tabindex`, `role`, or `aria-*` attributes.

### Malassezia-to-seborrheic-dermatitis spectrum slider (`updateSpectrum`)

- **What the student sees:** a horizontal range slider beneath four positional labels ("Balanced," "Mild dandruff," "Moderate," "Seborrheic dermatitis") and an output text box below it.
- **What the student must do:** drag the slider (or use arrow keys, since it is a native `<input type="range">`) between four discrete positions to read the corresponding explanatory text.
- **Judgment vs. decorative:** similar to the cycle-step selector — a guided-reveal reading aid across a fixed severity spectrum, not a prediction or judgment task. The interaction communicates the "spectrum, not two conditions" framing experientially rather than only through prose.
- **Correct/expected behavior encoded in the implementation:** `updateSpectrum(val)` writes `SPECTRUM_STATES[val]` into `#spectrumOutput`'s text content; called both on `oninput` (as the student drags) and once automatically, via a 100ms `setTimeout`, immediately after Module 6's HTML is injected into `.lesson-wrap` on module open — this is the only Module 6 interaction whose initial state is populated automatically rather than left empty until the first student action (see §1).
- **Feedback copy:** the four `SPECTRUM_STATES` strings (quoted in full in §2), purely explanatory except for position 4's trailing referral sentence.
- **Retry/reset behavior:** unlimited — the slider can be moved freely in either direction at any time.
- **Progress write:** none — `updateSpectrum` contains no reference to `APP_STATE`.
- **Persistence:** none — the slider's `value` attribute is hardcoded to `1` in the HTML; reopening the module always resets it to position 1 ("Balanced"), regardless of where the student last left it in the same session (a fresh copy of `#module6Wrap`'s innerHTML is injected into `.lesson-wrap` on every open, which resets the DOM element itself).
- **Gates completion:** no.
- **Keyboard/accessibility wiring visible in the code:** this is the one Module 6 interaction built on a genuinely accessible native control (`<input type="range">`), which is natively keyboard-operable (arrow keys) and exposes its value to assistive technology without any custom ARIA needed for the control itself. However, the slider carries no explicit `aria-label` (its association to "Malassezia to seborrheic dermatitis spectrum" relies on visual proximity to the heading and the four adjacent `<span>` labels, which are not programmatically linked to the input via `aria-labelledby` or similar), and the four positional `<span>` labels above the slider are plain text with no `for`/`id` relationship to the input.

### Trigger-mechanism accordion (`toggleTrigger`)

- **What the student sees:** four collapsed rows, each showing a trigger name and a `+` icon.
- **What the student must do:** click/tap a row to expand it and reveal its mechanism-explanation paragraph; the `+` icon rotates 45° (visually becoming an "×") when open.
- **Judgment vs. decorative:** similar to the comparison-card toggle — a genuine "distinguish the trigger from its mechanism" reveal, though (like the other three) it does not require the student to predict or answer before seeing the explanation.
- **Correct/expected behavior encoded in the implementation:** `toggleTrigger(el)` closes every open `.trigger-item` first, then — if the clicked item was not already open — opens only the clicked item. Only one trigger can be expanded at a time (same one-at-a-time pattern as the comparison-card toggle, different from the cycle-step selector, which always keeps exactly one step "active" rather than allowing zero).
- **Feedback copy:** the four trigger-detail paragraphs (quoted in full in §2) — explanatory, not evaluative.
- **Retry/reset behavior:** unlimited.
- **Progress write:** none — `toggleTrigger` contains no reference to `APP_STATE`.
- **Persistence:** none — reopening the module always starts with all four triggers collapsed.
- **Gates completion:** no.
- **Keyboard/accessibility wiring visible in the code:** **none.** `.trigger-item` is a plain `<div onclick="...">` with no `tabindex`, `role`, or `aria-expanded` reflecting its open/closed state.

### Checkpoints `m6cp1` and `m6cp2`

These are the only elements in Module 6 that write progress or gate completion. Full detail in §4 since the task's checkpoint fields overlap heavily with the interaction fields. Summary here for completeness:

- **What the student sees:** an open-response prompt, a growable textarea, a voice-input button, a submit button, and a feedback region — identical structural pattern to every other module's checkpoints.
- **What the student must do:** type or speak a free-text answer and submit it for AI evaluation.
- **Progress write:** yes — `APP_STATE.setCheckpointResult(6, cpId, {...})` on every submission; `captureCheckpointMemory(6, cpId)` on pass.
- **Gates completion:** yes — both `m6cp1` and `m6cp2` must be `passed` for `isModuleComplete(6)` to return true (no read-percentage minimum).
- **Accessibility:** see §10 — confirmed missing `aria-label` on both voice buttons and both submit buttons, and missing `aria-live` on both `.cp-res` feedback regions — the same gap already found (and not yet corrected) for Module 5 before its implementation pass.

---

## 4. Checkpoints and grading

### `m6cp1`

- **Displayed question** (`.cp-q`, `headspa-mastery.html:5186`):
  > "A client comes in with visible flaking and says she's been using a zinc-based anti-dandruff shampoo for three months but it keeps getting worse. Under the microscope you see fine white powdery flakes, minimal oil, and a matte scalp surface. What's happening — and what do you tell her?"
- **Question sent to the evaluator** (`M6.questions.m6cp1`, `headspa-mastery.html:6983`):
  > "Client has been using zinc anti-dandruff shampoo for 3 months with worsening results. Microscopy shows fine white powdery flakes, minimal oil, matte surface. What is happening and what do you tell her?"
- **Byte-identical?** **No — confirmed mismatch.** The evaluator string is a materially shorter paraphrase ("3 months" vs. "three months," "with worsening results" vs. "but it keeps getting worse," drops "she's been using," "comes in with visible flaking," and "you see"). This is the same class of defect already identified in Module 5 (and corrected in Modules 1–4) before their respective implementation passes. Module 6 has not received this correction.

### `m6cp2`

- **Displayed question** (`.cp-q`, `headspa-mastery.html:5204`):
  > "Same client, but this time the microscope shows yellowish clumped flakes near the follicle, visible oiliness, mild redness, and the client reports it spreads to her eyebrows and hairline. How does your response change — and is this still within the scope of a head spa service?"
- **Question sent to the evaluator** (`M6.questions.m6cp2`, `headspa-mastery.html:6984`):
  > "Same client but microscopy shows yellowish clumped flakes, visible oil, mild redness, flaking spreads to eyebrows and hairline. How does your response change and is this within scope?"
- **Byte-identical?** **No — confirmed mismatch.** The evaluator string drops "near the follicle," "the client reports," "her," and shortens "is this still within the scope of a head spa service?" to "is this within scope?"

### Evaluator system / rubric

Module 6 uses **one shared function for both checkpoints** — `M6.system(q)` — not checkpoint-specific rubrics, the same pre-correction pattern already documented (and not yet fixed) for Module 5:

> "You are Cadence, instructor of HeadSpa Mastery. Module 6 (Common Conditions & Disorders) checkpoint. Question: '\{q\}'. Key concepts: dry scalp (fine white powdery flakes, matte, minimal oil) vs dandruff (yellow oily clumped flakes, redness, Malassezia-driven). Anti-dandruff products worsen dry scalp by stripping the barrier. Seborrheic dermatitis = advanced Malassezia — flaking beyond scalp (eyebrows, hairline) plus significant inflammation warrants referral. Within-scope support: gentle cleansing, anti-inflammatory botanicals, OTC zinc recommendation, simplification. 3-5 sentences, direct and warm."

This is passed into the shared `submitCheckpoint()`/`evaluateCheckpointAnswer()` pipeline, which appends `CADENCE_RESPONSE_CONSISTENCY_ANCHOR`, `CADENCE_SELECTIVE_MEMORY_INSTRUCTION`, `APP_STATE.getCadenceMemoryContext(6,'checkpoint')`, `CADENCE_CHECKPOINT_TONE`, `CADENCE_FEEDBACK_MICRO_RULES`, and `CHECKPOINT_EVAL_FORMAT` before the call — shared code, identical to every other module, not modified for this extraction.

- **Required concepts (as written into the shared rubric, not itemized per checkpoint):** the dry-vs-dandruff visual distinction; that anti-dandruff products worsen dry scalp by stripping the barrier; that seborrheic dermatitis is "advanced Malassezia" and that flaking beyond the scalp plus significant inflammation "warrants referral" (the rubric's only explicit referral trigger); the four within-scope support categories (cleansing, anti-inflammatory botanicals, OTC zinc recommendation, simplification).
- **Checkpoint-specific vs. shared grading behavior:** **fully shared**, same as Module 5's current (uncorrected) state. `m6cp1` (a pattern-recognition/client-education question about dry scalp) and `m6cp2` (a pattern-recognition/scope-judgment question about a more severe presentation) are evaluated against the exact same generic rubric text, with no checkpoint-specific required elements, immediate-correction triggers, or revision-focus guidance — unlike Modules 1–4's post-correction `MN.systems.mNcpX` structure.
- **Completion dependency:** both `m6cp1` and `m6cp2` must reach `status: 'passed'` for `_checkModuleComplete(6)`/`isModuleComplete(6)` to return true. No read-percentage minimum. `m6cp1` does not lock the rest of the lesson (section 6.7, 6.8, and `m6cp2` all remain visible and scrollable regardless of `m6cp1`'s status) — same non-locking behavior as every other module's midpoint checkpoint.
- **Voice-button behavior:** `startVoice('m6cp1In', this)` / `startVoice('m6cp2In', this)` — the shared voice-input function used by every checkpoint in the file; not module-6-specific.
- **Enter/Shift+Enter behavior:** `m6cpKey(e, id)` — Enter without Shift submits (`submitM6CP(id)`); Shift+Enter is not intercepted, so the textarea's default newline behavior applies. Matches every other module's `cpKey`-style handler.
- **Feedback and live-region behavior:** feedback is rendered into `#m6cp1Res`/`#m6cp2Res` via the shared `submitCheckpoint()` pipeline. **Neither `.cp-res` element carries `aria-live="polite"`** — confirmed absent by direct inspection of `headspa-mastery.html:5196, 5214`, in contrast to `m0cp1Res`, `m1cp1Res`/`m1cp2Res`, and `m4cp1Res`/`m4cp2Res`, which all carry it (Module 5 shares this same gap, not yet corrected). See §10.
- **Saved progress behavior:** identical to every other module — `APP_STATE.setCheckpointResult(6, cpId, {passed, feedback, answer})` on every submission (pass or fail); `captureCheckpointMemory(6, cpId)` only on pass (see §5 for the resulting memory tags); `restoreLessonState(6)` re-applies the stored `passed`/`retry` status, disables the input/button appropriately, and re-renders the stored feedback (or a generic previously-completed string if no feedback text was stored) when the student reopens the module.

### `submitM6CP` error-message parameter

`submitM6CP(id)` calls `submitCheckpoint(6, id, M6.system, M6.questions[id])` — **four arguments, no 5th `errorMessage` argument.** `submitCheckpoint()`'s optional 5th parameter (present since the Welcome Module work, allowing each module its own network-failure text) is not supplied for Module 6, so a network/API failure on either checkpoint falls back to the shared generic text. This is the same "not yet given a module-specific error message" state Module 5 is currently in, and the state Modules 0–4 were all in before their own implementation passes.

---

## 5. Cadence

- **Module 6 checkpoint identity:** `M6.system` — see §4 for the full string. Refers to itself as "Cadence, instructor of HeadSpa Mastery."
- **Guide system** (`MODULE_GUIDE_SYSTEMS[6]`, `headspa-mastery.html:7036`):
  > "You are Cadence — a mentor built from nearly two decades in the head spa industry. The student is in Module 6 (Conditions & Disorders): dry scalp vs dandruff vs seborrheic dermatitis. Anti-dandruff shampoo worsens dry scalp. If the student has seen client scalp issues before, connect this to what they may have misread — and how head spa assessment changes their approach going forward. 3-5 sentences. No bullet points."
- **Quick prompts** (`MODULE_QUICK_PROMPTS[6]`, `headspa-mastery.html:7051`):
  1. "How do I tell dry scalp from dandruff?"
  2. "When does dandruff become seborrheic dermatitis?"
  3. "What botanicals work for inflammation?"
- **Module-opening greeting** (`greetings[6]` inside `openModuleById()`, `headspa-mastery.html:7290`):
  > "Module 6 changes how you listen to clients. Once you understand the dry vs dandruff distinction, you will hear misidentification everywhere — in what clients say, in what products they are using."
- **Memory tags:** `MODULE_MEMORY_TAGS[6] = ['pattern-recognition', 'scope-awareness', 'referral-judgment', 'barrier-thinking']` (`assets/js/headspa-state.js:138`) — four tags, one more than Module 5's three. `getCheckpointMemoryTags(6, answer)` (`assets/js/headspa-state.js:327–330`) additionally derives, from the student's own passed-checkpoint answer text: `pattern-recognition` if the answer matches `/\b(powdery|yellow|oily|matte|eyebrows|hairline|malassezia)\b/i`; `referral-judgment` if it matches `/\b(refer|within scope|not within scope)\b/i`; `barrier-thinking` if it matches `/\b(barrier|stripping|dry scalp|anti-dandruff)\b/i` (or, as a fallback shared by every module, if the answer simply contains the word "client," which also independently adds `client-guidance`). Note: `scope-awareness` is listed in `MODULE_MEMORY_TAGS[6]` but has **no corresponding regex branch** inside the `moduleId === 6` block of `getCheckpointMemoryTags` — it can never actually be derived from a Module 6 checkpoint answer, only invoked as a static module-level focus tag elsewhere (`getModuleFocusTags`). Flagged in §13 — the same static-vs-derivable-tag question is not present for any other module's tag list checked during this extraction.
- **References to the old course name:** **yes, confirmed.** `M6.system` opens with "You are Cadence, instructor of **HeadSpa Mastery**" — identical wording to Module 5's current (uncorrected) `M5.system` opening.
- **Any claim that Cadence has personal human experience:** **yes, confirmed.** `MODULE_GUIDE_SYSTEMS[6]` opens "You are Cadence — **a mentor built from nearly two decades in the head spa industry**" — phrased as Cadence's own personal professional history, word-for-word the same template sentence used in Module 5's current (uncorrected) `MODULE_GUIDE_SYSTEMS[5]`, and in Modules 7–11's guide systems (none of which have been audited yet).
- **Any content inconsistency between the curriculum and Cadence guidance:** none of the kind found in Module 5 (no claim in Module 6's Cadence prompts contradicts an already-corrected earlier module's approved spec) — but see §8 for claims within Module 6 itself that may need review regardless of Cadence-prompt consistency.
- **Duplicated or conflicting prompt sources:** none found for Module 6 specifically — one `MODULE_QUICK_PROMPTS[6]` array, no hardcoded duplicate set in the static HTML (same clean state as Module 5; contrast with Module 3's pre-correction duplicate quick-prompt sets).

---

## 6. Completion and progression

- **Exact completion requirement:** `m6cp1` and `m6cp2` both graded `passed` (`MODULE_CHECKPOINTS['6'] = ['m6cp1','m6cp2']`; `_hasAllRequiredCheckpoints(6)` requires every listed ID to have `status === 'passed'`). No read-percentage/`maxReadPercent` minimum is checked anywhere in the completion path.
- **Completion-card copy:** see §2 for the full verbatim text (`#m6Complete`). Title: "Module complete." Sub: "You can now read the difference between dry scalp and dandruff, understand the Malassezia spectrum, and explain it to a client in plain language." Next-module label: "Up next — Module 7," with next-module preview text and a "Start Module 7 →" primary button plus a "Back to course" secondary button.
- **Competency language:** the completion card names a general capability in its one `.lc-sub` sentence; like Module 5's card (and unlike Module 4's, which lists four itemized competencies on a distinct line), Module 6 has no separate itemized competency-naming line.
- **Module 7 unlock behavior:** the completion card's primary button calls `openModuleById(7)` directly; independently, `APP_STATE.canAccessModule(7)` (home-screen module list and any direct navigation) requires `isModuleComplete(6)`, which in turn requires both checkpoints passed — the two unlock paths are consistent with each other.
- **Persistence behavior:** identical to every other module — `APP_STATE.save()` is the sole write choke point; `checkpointMeta`, `checkpoints[]`, `complete`, and `completedAt` are stored per-module in `localStorage['levo_app']` (or skipped entirely while Course Review Mode is active).
- **Review Mode behavior:** Module 6's checkpoints route through the same `submitCheckpoint()` → `submitCheckpointReviewMode()` branch as every other module when `window.ReviewMode.isActive()` is true — test submissions reuse the real question and `M6.system` rubric, are labeled "Review Mode test — not saved," and never call `setCheckpointResult`/`captureCheckpointMemory`/`_checkModuleComplete`. Nothing module-6-specific overrides this.
- **Mismatch between visible completion and stored state:** none found. `restoreLessonState(6)` reconciles `#m6cp1Res`/`#m6cp2Res` display, input/button disabled state, and the status pill against the stored `checkpointMeta` on every module open, using the same shared logic every other module uses. Note: `restoreLessonState` does not re-run `updateSpectrum`, so if a student had previously moved the spectrum slider before submitting a passing checkpoint, reopening the module would still show the slider reset to position 1 with the position-1 output text (per the `STATIC_MODULES[6]` `setTimeout` behavior described in §1) — consistent with the interaction not persisting state at all (§3), not a bug specific to restoration.

---

## 7. Assets and downloadables

**Module 6 currently contains zero real media assets**, the same state already documented for Module 5. Every "photo" slot in the module (§2) renders `.clinical-photo.placeholder` — a dashed-border box containing a generic decorative camera/crop SVG icon (`.cp-placeholder-icon`) and a small caps-lock label (`.cp-placeholder-label`), with a separate caption line (`.photo-pair-label`) beneath the box for the two photo-pair instances. There is no `<img>` tag, no `background-image`, and no reference to any file under `assets/images/` anywhere inside `#module6Wrap`. Confirmed by direct reading of the full block and by grepping the file for any Module-6-scoped reference to `assets/images`: none found.

Full inventory of placeholder slots (all illustrative-only, decorative, none authenticated or real):

| # | Placement | Label | Caption below box |
|---|---|---|---|
| 1 | Section 6.3 photo pair, left | "Dry Scalp — Microscopy" | "Fine white powdery flakes, matte surface, minimal oil" |
| 2 | Section 6.3 photo pair, right | "Dandruff — Microscopy" | "Yellowish clumped flakes, oily surface, near follicle" |
| 3 | Section 6.5/6.6 photo pair, left | "Mild Dandruff — Microscopy" | "Early Malassezia activity, oily flaking" |
| 4 | Section 6.5/6.6 photo pair, right | "Seborrheic Dermatitis — Microscopy" | "Advanced — redness, scaling beyond scalp, inflammation" |

- **Inline SVGs:** only the generic placeholder camera-icon SVG, reused identically across all four slots — the same SVG markup used for Module 5's placeholder slots.
- **Video blocks:** none.
- **Downloadable resources:** none referenced anywhere in Module 6's current markup or JavaScript.
- **Broken or missing references:** none — as with Module 5, there is nothing to be "missing" since no image path is referenced at all.
- **File formats / dimensions:** N/A — no image files exist for Module 6.
- **Alt text and captions:** N/A for alt text (no `<img>` elements exist to carry it). Visible captions exist as plain text (`.cp-placeholder-label`, `.photo-pair-label`) and are readable by assistive technology as ordinary text content, not as image alternatives.
- **Illustrative / authenticated / unverified / decorative:** every slot is purely decorative placeholder scaffolding — the same category already established for Module 5, and unlike Module 4's real generated-illustration microscopy images, which carry an explicit "not a clinical diagnosis" disclaimer.

Because there are no actual image, diagram, video, or downloadable assets currently in Module 6 to inventory beyond this placeholder-scaffold description, a separate `module-06-assets.md` file was **not** created for this extraction, matching the precedent set for Module 5 (and the explicit instruction for this task not to build a visual asset plan or asset inventory file at extraction time). If real Module 6 imagery is produced during a future audit, that would be the point to create `module-06-assets.md`.

**Downloadable resource:** none currently referenced. Per the governing standard, the formal "Downloadable resource opportunity" recommendation is a decision for the external audit, not this extraction.

---

## 8. Claims and technical-content inventory

Verbatim wording is quoted; classification follows the established three-way split (module claim / code implication / uncertain-external-review). Preserved here exactly as it exists in production — not evaluated for accuracy or corrected.

### Dry scalp vs. dandruff mechanism

- **What the module explicitly claims:** "Dry scalp flakes because it lacks moisture. The hydrolipid film is depleted or compromised... This is a barrier issue, not a disease process." / "Dandruff flakes because the scalp is functioning abnormally. Excess oil, microbial activity (primarily Malassezia yeast), inflammation, and accelerated skin cell turnover all combine to produce the flaking and irritation."
- **What the code implies:** the module treats this distinction as a definitively knowable, visually diagnosable split based on flake color/size/oil/matte-vs-shine presentation alone (reinforced by the checkpoint questions, which ask the student to state "what's happening" purely from a described microscopy appearance).
- **Uncertain / requires external review:** whether stating dandruff's cause as settled biological fact ("the scalp is functioning abnormally," naming Malassezia yeast specifically as the primary driver) crosses further into clinical/diagnostic territory than Module 4's approved appearance-only framing allows, and whether this is consistent with or in tension with Module 5's current (also unaudited) dandruff/Malassezia recap language.

### Anti-dandruff shampoo / "wrong product cycle"

- **What the module explicitly claims:** the entire six-step cycle (§2, section 6.4) and its cadence note ("This is not treatment failure. It is misidentification.") present, as a definite causal mechanism, that anti-dandruff shampoo used on a dry (non-dandruff) scalp strips moisture, worsens flaking, and drives an escalating misuse cycle.
- **What the code implies:** no hedging language is used anywhere in this section — the cycle is presented as a near-universal client pattern ("Most clients with dry scalp end up using anti-dandruff shampoo").
- **Uncertain / requires external review:** whether "most clients" is a supportable claim or an invented-sounding generalization, consistent with the kind of unsupported-certainty concerns already flagged (and, in Module 4's case, corrected) in earlier module extractions.

### Ketoconazole / OTC anti-fungal recommendation

- **What the module explicitly claims:** Section 6.7's treatment grid, card ②, names specific active ingredients: "Zinc, ketoconazole (OTC recommendation only — not prescription), selenium sulfide. These help manage yeast activity without requiring medical oversight."
- **What the code implies:** the module already hedges this one instance with "(OTC recommendation only — not prescription)," a stronger and more specific scope qualifier than any single claim in Module 5's current, unaudited protocol cards.
- **Uncertain / requires external review:** whether naming ketoconazole by name (a compound available in both OTC and prescription-strength formulations) is appropriate for this course's scope even with the OTC qualifier, and whether "without requiring medical oversight" is an accurate framing — flagged for review, not resolved here.

### Referral / scope language

- **What the module explicitly claims:** the only explicit "refer out" instruction anywhere in Module 6 is embedded inside the spectrum slider's position-4 output text (§2, §3): "If inflammation is severe, active, or painful, refer out." Checkpoint 2 separately asks the student to judge "is this still within the scope of a head spa service?" without the module itself stating what the correct scope answer is anywhere in the visible curriculum — that judgment is only encoded in the hidden `M6.system` evaluator rubric (§4), which states inflammation "warrants referral" but is never shown to the student directly.
- **What the code implies:** unlike Module 1 (dedicated referral-script section) and Module 4 (dedicated §4.8 "When not to proceed" section with an approved referral script), Module 6 has **no standalone, always-visible stop-service/refer-out section** — the closest equivalent is one sentence inside an interactive element the student must actively drag to position 4 to see. This is the same absence already flagged for Module 5.
- **Uncertain / requires external review:** whether a module whose entire subject is "conditions that require judgment about scope" needs its own explicit, always-visible referral section (rather than one gated behind a specific slider position), consistent with the treatment Modules 1 and 4 already received.

### Heat/sebum-production percentage claim

- **What the module explicitly claims:** "sebum production rises approximately 10% per 1.8°F increase in temperature" (Section 6.8, "Excess oil production" trigger detail).
- **What the code implies:** this is the exact same specific percentage/temperature claim already flagged as unverified in the Module 5 extraction ("Sebum production rises approximately 10% for every 1.8°F increase in temperature," Module 5's oily-scalp "Key point" callout) — confirming the claim is repeated verbatim across two adjacent, both-unaudited modules.
- **Uncertain / requires external review:** whether this specific figure is supportable — flagged in both modules' extractions now, not resolved in either.

### Diet and stress as triggers

- **What the module explicitly claims:** "Diet high in sugar, fried, or inflammatory foods... Contributes to increased oil production and systemic inflammation — both of which feed Malassezia activity." / "Stress & hormonal changes... Increases oil production and can trigger flare-ups of existing conditions."
- **What the code implies:** both are presented as established mechanisms without qualification, similar in category to Module 5's diet/hormonal-oil-production claims (also unaudited).
- **Uncertain / requires external review:** same category of claim already flagged for Module 5's oily-scalp section — not re-litigated here, simply noted as a parallel occurrence.

### Diagnosis / treatment / cure language

- **What the module explicitly claims:** no explicit "this is definitively X condition" diagnostic language is used toward a hypothetical client — the two checkpoint scenarios ask the student what "is happening," which is framed as interpretation rather than formal diagnosis, consistent with 6.1's "Your job is not to agree with their diagnosis. Your job is to interpret" framing.
- **What the code implies:** despite that framing, the curriculum body text elsewhere states mechanisms with diagnostic-level certainty (see "Dry scalp vs. dandruff mechanism" above) — an internal tension between the stated non-diagnostic role and the certainty of some of the descriptive language, similar in kind to tensions already flagged in Module 5.
- **Uncertain / requires external review:** not resolved here, per instruction.

---

## 9. Relationship to adjacent modules

- **Material repeated from Module 5:** Section 6.8's info card explicitly frames Module 6 as continuing directly from Module 5 ("This module does not replace scalp type analysis. It layers on top of it... The practitioner who can answer those questions quickly — and correctly — is the one who makes decisions instead of guesses.") — this mirrors the same "builds on the prior module" framing already used in Module 5's hero copy relative to Module 4.
- **Confirmed forward-reference already noted in the Module 5 extraction:** Module 5's recap Cadence note ("A client who says they have 'dandruff' may have misidentified their own condition entirely and actually have a dry scalp... This module is about building the observational instinct that makes that possible") previews exactly the distinction Module 6 formally teaches in Section 6.3. Both modules currently exist side by side, unaudited, with Module 5 previewing content Module 6 then delivers — this cross-module dependency was flagged (not resolved) in `module-05-source.md` §9 and is confirmed still present from Module 6's own side of the boundary.
- **Shared/duplicated specific claims across Module 5 and Module 6:** the "sebum production rises approximately 10% per 1.8°F" figure appears verbatim in both modules (§8 above and `module-05-source.md` §8's oily-scalp section) — a confirmed direct duplication across two adjacent, both-unaudited modules, not just a thematic echo.
- **Material that appears to belong in Module 5 rather than Module 6:** none identified — Module 6's content (named conditions/disorders) stays within its own titled subject matter and does not appear to duplicate Module 5's scalp-type/protocol framework beyond the explicit "layers on top of it" callback.
- **References to unaudited later modules:** Module 6's completion card previews Module 7 by name and topic ("equipment, tools, room design") — Module 7 itself has not been extracted or audited, so this preview's accuracy against Module 7's actual current content is unverified as part of this task.
- **Dependencies on concepts not yet taught:** none identified that would block a student — Module 6 does not appear to require any concept from Module 7 or later to be understood.

This overlap is being flagged, not resolved, per the task's explicit instruction not to resolve module boundaries during extraction.

---

## 10. Accessibility and responsive inventory

Only what can be confirmed from the source is reported below; nothing here was verified in a real browser, screen reader, or physical touch device as part of this extraction (see §13).

- **Headings:** Module 6 uses the same non-semantic heading pattern as every other module in the file — section titles are styled `<div>`s (`.sec-eyebrow`, `.sec-title`), not real `<h1>`–`<h6>` elements. File-wide pattern, not specific to Module 6.
- **Semantic controls:** the two checkpoint submit buttons and two voice buttons are real `<button>` elements (good). The spectrum slider is a real `<input type="range">` (good, natively accessible). **The comparison-card toggle, the cycle-step selector, and the trigger accordion are all plain `<div onclick="...">` elements with zero keyboard/screen-reader semantics** — no `tabindex`, `role="button"`, `aria-expanded`, or `aria-pressed` anywhere in the block. Confirmed by a direct grep of the full `#module6Wrap` markup for `tabindex`, `role=`, and `aria-`: zero matches outside the checkpoints. This mirrors the exact category of gap already corrected in Module 2's arrival accordion (which was rebuilt with native `<button>`, `aria-expanded`, and `aria-controls`) and in Module 2's judgment-check quiz — Module 6 currently has three separate instances of the same unaddressed pattern.
- **Keyboard access:** the checkpoint textareas/voice buttons/submit buttons inherit the same keyboard behavior as every other module's checkpoints. The spectrum slider is keyboard-operable via native range-input arrow-key behavior. **The comparison-card toggle, cycle-step selector, and trigger accordion have no keyboard access at all** — a keyboard-only or switch-device user cannot activate any of these three interactions, since `onclick` handlers on non-interactive `<div>` elements do not receive keyboard focus or respond to Enter/Space by default.
- **Focus visibility:** not evaluated separately from file-wide `.checkpoint`/`.cp-btn`/`.voice-btn` focus styles; the three non-native-control interactions have no focus state to evaluate, since they cannot receive keyboard focus in the first place.
- **Labels and accessible names:** **confirmed gaps**, matching Module 5's current state exactly. `m6cp1In`/`m6cp2In`'s voice buttons carry only `title="Speak your answer"` — no `aria-label`. `m6cp1Btn`/`m6cp2Btn` carry no `aria-label` at all. The spectrum slider (`#spectrumSlider`) carries no `aria-label` and is not associated with its heading or the four positional `<span>` labels via `aria-labelledby`.
- **Live regions:** **confirmed gap.** `#m6cp1Res` and `#m6cp2Res` (`headspa-mastery.html:5196, 5214`) carry no `aria-live` attribute — same gap as Module 5's current state, contrasted with the already-corrected Modules 0, 1, and 4.
- **Color-only meaning:** none of Module 6's four interactions rely on color alone to convey state — the cycle-step's active state and the comparison-card/trigger open state are each accompanied by a text/layout change (revealed paragraph, hint-text swap, icon rotation), not color alone. The dry/dandruff comparison cards use distinct `dry-card`/`dandruff-card`/`dry-label`/`dandruff-label` classes for styling, but the two conditions are also distinguished by their text labels ("Dry scalp" / "Dandruff") and tags ("Hydration issue" / "Biological imbalance"), not color alone.
- **Reduced motion:** the module's `.vs-detail` reveal uses a `slideDown 0.25s ease` animation and `.cycle-insight` uses `slideDown 0.3s ease` (both shared, file-wide `@keyframes slideDown` rules, not Module-6-specific declarations) — confirmed no `@media (prefers-reduced-motion: reduce)` override exists for either of these two specific animations, meaning they would still play for a student who has requested reduced motion at the OS level. This is a different situation from Module 5, which was confirmed to have no animation at all inside `#module5Wrap`; Module 6 does have animation, and it is not currently guarded.
- **Image enlargement:** N/A — there are no real images to enlarge (§7).
- **Touch targets:** not manually measured against a specific minimum. The four interactive `<div>`s (`.vs-card`, `.cycle-step`, `.trigger-item`) use generous padding (`1.1rem`/`0.85rem`+) that appears touch-friendly on visual inspection of the CSS, but no measurement against a specific guideline (e.g., 44×44px) was performed.
- **Responsive layout / horizontal overflow:** not verified in a real or simulated viewport as part of this extraction (see §13). `.treatment-grid` has an existing `@media (max-width:600px)` rule collapsing its two-column layout to one column; `.photo-pair` has the same existing collapse rule already noted in the Module 5 extraction, which would apply to Module 6's two photo-pairs identically.
- **Duplicate IDs:** none found specific to Module 6 in a targeted check (`m6cp1`, `m6cp1In`, `m6cp1Btn`, `m6cp1Res`, `m6cp2`, `m6cp2In`, `m6cp2Btn`, `m6cp2Res`, `m6Complete`, `module6Wrap`, `vsCardDry`, `vsCardDandruff`, `vsDetailDry`, `vsDetailDandruff`, `spectrumSlider`, `spectrumOutput`, `cycleWrap`, `cycleInsight`, `cstep-0` through `cstep-5` each appear exactly once in the file). A full repository-wide duplicate-ID scan was not repeated as part of this task.

---

## 11. Listen Mode and Guided Completion Path notes

Per instruction, this section documents only what can be inferred from the current curriculum — it does not implement or design either feature.

- **Approximate narration suitability:** the majority of Module 6 is linear prose (hero, 6.1, the dry-vs-dandruff explanatory paragraphs, the cycle-step insights, the spectrum-state descriptions, the treatment-grid cards, the trigger details, recap-style info card) that would narrate reasonably well in sequence. Based on a word-count pass of the full `#module6Wrap` block (≈1,400 words, including all interaction-revealed text, both checkpoint questions, and the completion card), estimated narration length is roughly **10–13 minutes** for the full instructional text — comparable to, though on the lower end of, the 12–15 minute estimate recorded for Module 5.
- **Visual material that would require an audio cue:** none of Module 6's four interactions convey information only visually — the comparison cards, cycle steps, spectrum positions, and trigger details are all readable text once revealed (per §7, there are no real images; the placeholder graphics carry no information beyond their text captions). However, **all four interactions require an on-screen tap/click/drag to reveal their explanatory text in the first place** — unlike Module 5 (which had no interactive reveal-gated content at all), a purely audio narration pass over Module 6 as currently built would either need to narrate every hidden state regardless of interaction, or would omit the cycle insights, the two comparison-card details, the four spectrum states, and the four trigger mechanisms entirely if it only reads what is visible by default. This is a materially different Listen Mode consideration than Module 5's, and should be flagged for the external audit rather than assumed resolved.
- **Interactions or checkpoints that prevent audio-only completion:** the two open-response checkpoints (`m6cp1`, `m6cp2`) require typed or spoken free-text input either way (a voice-input button already exists), so they are not an audio-specific barrier. The reveal-gated interactions described above are the more significant open question for this module specifically.
- **Likely position in the later Guided Completion Path:** immediately after Module 5 in sequence (per the approved course sequence — Modules 1–11 instructional, Module 12 Final Exam) — no basis was found in the current content for reordering Module 6 relative to its neighbors.

---

## 12. Source map

| Component | File | Location |
|---|---|---|
| Home-screen module row | `headspa-mastery.html` | lines 2384–2388 |
| Full curriculum block (`#module6Wrap`) | `headspa-mastery.html` | lines 4936–5230 |
| Comparison-card markup (`vsCardDry`/`vsCardDandruff`/`vsDetailDry`/`vsDetailDandruff`) | `headspa-mastery.html` | lines 4974–5010 |
| Cycle-step markup (`cycleWrap`, `cstep-0`–`cstep-5`, `cycleInsight`) | `headspa-mastery.html` | lines 5020–5051 |
| Spectrum-slider markup (`spectrumSlider`, `spectrumOutput`) | `headspa-mastery.html` | lines 5089–5098 |
| Treatment-grid markup | `headspa-mastery.html` | lines 5106–5127 |
| Trigger-list markup | `headspa-mastery.html` | lines 5137–5166 |
| Checkpoint 1 markup (`m6cp1`) | `headspa-mastery.html` | lines 5181–5197 |
| Checkpoint 2 markup (`m6cp2`) | `headspa-mastery.html` | lines 5199–5215 |
| Completion card markup (`m6Complete`) | `headspa-mastery.html` | lines 5217–5227 |
| `MODULE_CHECKPOINTS['6']` | `headspa-mastery.html` | line 6279 |
| `MODULE_TITLES[6]` | `headspa-mastery.html` | line 6311 |
| `M6` object (questions + system) | `headspa-mastery.html` | lines 6981–6987 |
| `MODULE_GUIDE_SYSTEMS[6]` | `headspa-mastery.html` | line 7036 |
| `MODULE_QUICK_PROMPTS[6]` | `headspa-mastery.html` | line 7051 |
| `openModuleById()` — `STATIC_MODULES[6]` routing (unique setTimeout/`updateSpectrum` call) | `headspa-mastery.html` | line 7248 |
| `openModuleById()` — Module 6 greeting | `headspa-mastery.html` | line 7290 |
| `toggleVsCard(cardId, detailId)` | `headspa-mastery.html` | lines 7647–7660 |
| `CYCLE_INSIGHTS` | `headspa-mastery.html` | lines 7662–7669 |
| `cycleStep(idx)` | `headspa-mastery.html` | lines 7671–7675 |
| `SPECTRUM_STATES` | `headspa-mastery.html` | lines 7677–7682 |
| `updateSpectrum(val)` | `headspa-mastery.html` | lines 7684–7687 |
| `toggleTrigger(el)` | `headspa-mastery.html` | lines 7689–7693 |
| `submitM6CP(id)` | `headspa-mastery.html` | lines 7695–7697 |
| `m6cpKey(e,id)` | `headspa-mastery.html` | lines 7698–7700 |
| `getVisibleCompletionCard()` (confirms Module 6 uses the generic, non-special-cased pattern) | `headspa-mastery.html` | lines 6407–6408 |
| Shared checkpoint pipeline (`renderCheckpointOutcomeLabel`, `applyCheckpointInputState`, `restoreLessonState`, `normalizeCheckpointEvaluation`, `submitCheckpoint`, `submitCheckpointReviewMode`) | `headspa-mastery.html` | lines 6458–6683+ (shared with every module) |
| `.clinical-photo` / `.clinical-photo.placeholder` / `.photo-pair` CSS | `headspa-mastery.html` | lines 1921–1965 (shared with Module 5) |
| `.vs-card` / `.vs-detail` / `.vs-expand-hint` CSS | `headspa-mastery.html` | lines 1355–1369 |
| `.cycle-wrap` / `.cycle-step` / `.cycle-arrow` / `.cycle-insight` CSS | `headspa-mastery.html` | lines 1374–1383 |
| `.spectrum-wrap` / `.spectrum-labels` / `.spectrum-output` CSS | `headspa-mastery.html` | lines 1386–1388 |
| `.treatment-grid` / `.treat-card` CSS | `headspa-mastery.html` | lines 1391–1393 |
| `.trigger-list` / `.trigger-item` / `.trig-header` / `.trig-detail` CSS | `headspa-mastery.html` | lines 1399–1407 |
| `canAccessModule`, `wouldBeLockedWithoutReview`, `setCurrentModule` | `assets/js/headspa-state.js` | lines 628–669 (shared) |
| `getRequiredCheckpointIds`, `reconcileModuleState`, `_hasAllRequiredCheckpoints` | `assets/js/headspa-state.js` | lines 556–593 (shared) |
| `markModuleComplete`, `_checkModuleComplete` | `assets/js/headspa-state.js` | lines 722–760 approx. (shared) |
| `MODULE_MEMORY_TAGS[6]` | `assets/js/headspa-state.js` | line 138 |
| `getCheckpointMemoryTags` (moduleId === 6 branch) | `assets/js/headspa-state.js` | lines 327–330 |
| `getCheckpointMemorySummary`, `getModuleFocusTags`, `scoreMemoryItemForModule` | `assets/js/headspa-state.js` | lines 356–382 approx. (shared) |

State keys touched by Module 6 (all shared, generic per-module state — no module-6-specific key names): `progress['6'].checkpoints`, `progress['6'].checkpointMeta.m6cp1`/`m6cp2`, `progress['6'].complete`, `progress['6'].completedAt`, `progress['6'].startedAt`/`lastVisitedAt`/`lastScrollY`/`maxReadPercent`, `student.cadenceMemory.notableAnswers` (entries tagged `moduleId: 6`), `student.cadenceMemory.patterns.strengths`/`focusAreas` (populated with Module 6's tags on pass/retry).

Selectors: `#module6Wrap`, `#m6cp1`, `#m6cp1In`, `#m6cp1Btn`, `#m6cp1Res`, `#m6cp2`, `#m6cp2In`, `#m6cp2Btn`, `#m6cp2Res`, `#m6Complete`, `#vsCardDry`, `#vsCardDandruff`, `#vsDetailDry`, `#vsDetailDandruff`, `#cycleWrap`, `#cstep-0`–`#cstep-5`, `#cycleInsight`, `#spectrumSlider`, `#spectrumOutput`, `.treatment-grid`, `.treat-card`, `.trigger-list`, `.trigger-item`, `[data-module-id="6"]`.

---

## 13. Confirmed findings and assumptions

### Confirmed (proven directly from the code)

1. `m6cp1` and `m6cp2` displayed (`.cp-q`) and evaluated (`M6.questions`) question strings are **not** byte-identical (§4) — same defect class already found (and not yet corrected) in Module 5, and already corrected in Modules 1–4.
2. `M6.system` is one shared function used for both checkpoints — Module 6 has not moved to the per-checkpoint `MN.systems.mNcpX` structure Modules 1–4 use (same current state as Module 5).
3. `submitM6CP` does not pass a 5th `errorMessage` argument to `submitCheckpoint()`, so Module 6 has no module-specific network-error text (same current state as Module 5).
4. Both checkpoint voice buttons lack `aria-label`; both submit buttons lack `aria-label`; both `.cp-res` feedback regions lack `aria-live` — same gaps already confirmed for Module 5, confirmed present here too, in contrast to the already-corrected Modules 0, 1, and 4.
5. `M6.system` still says "instructor of **HeadSpa Mastery**" (old course name); `MODULE_GUIDE_SYSTEMS[6]` still frames Cadence as personally "a mentor built from nearly two decades in the head spa industry" — the same personal-experience-claim pattern already corrected out of Modules 0, 1, 2, and 4, and still present, uncorrected, in Module 5.
6. Section numbering skips "6.2" entirely — the visible sequence goes 6.1 → 6.3 → 6.4 → "6.5 & 6.6" (combined) → 6.7 → 6.8, with no content anywhere labeled 6.2.
7. Three of Module 6's four interactive components (`.vs-card` comparison toggle, `.cycle-step` selector, `.trigger-item` accordion) are plain `<div onclick>` elements with zero keyboard/ARIA semantics — no `tabindex`, `role`, or `aria-*` attributes anywhere in `#module6Wrap` outside the checkpoints. The fourth (the spectrum slider) is a native, keyboard-accessible `<input type="range">` but lacks an explicit `aria-label`.
8. The "↓ Tap each card to expand" hint (Section 6.3) is immediately followed by a static, non-interactive photo pair rather than the tappable cards it describes; a second, differently worded hint ("↓ Tap each pattern to see what it means") appears later in the same section directly before the actual tappable cards — three different phrasings of the same instruction appear within a few paragraphs of each other (body text, first hint, second hint).
9. The sebum-production "10% per 1.8°F" claim in Section 6.8 is worded near-identically to the same claim already present in Module 5's oily-scalp section — confirmed verbatim duplication across two adjacent, both-unaudited modules.
10. `MODULE_MEMORY_TAGS[6]` lists `scope-awareness` as one of Module 6's four memory tags, but `getCheckpointMemoryTags`'s `moduleId === 6` branch has no regex condition that can ever produce that tag from a checkpoint answer — the tag is declared but unreachable from checkpoint grading.
11. Module 6's only explicit referral-language sentence ("If inflammation is severe, active, or painful, refer out.") is gated behind manually dragging the spectrum slider to its fourth and final position — there is no always-visible, standalone stop-service/refer-out section comparable to Module 1's or Module 4's.
12. `window._m6cpsDone` is set on every module-6 open but is never read anywhere else in the file — dead state, the same category of finding already confirmed for Module 5's `window._m5cpsDone`.
13. Module 6 has zero real image/diagram/video/downloadable assets — every "photo" is a decorative placeholder graphic with no underlying file, the same state already confirmed for Module 5.
14. The hero eyebrow ("Common Conditions & Disorders") does not match the home-row title and `MODULE_TITLES[6]` ("Conditions & Disorders") word-for-word — the same class of title/eyebrow drift already confirmed for Module 5's hero eyebrow.
15. Two of Module 6's four interactions (`.vs-detail` reveal, `.cycle-insight` reveal) use CSS animation (`slideDown`) with no `prefers-reduced-motion` override guarding them.

### Assumptions or external-review questions (not verified here; require further work)

- **Medical or dermatological verification:** every physiological/mechanistic claim in §8 (the dry-vs-dandruff mechanism, the anti-dandruff "wrong product cycle," the ketoconazole/zinc/selenium-sulfide recommendations, the heat-exposure/sebum-percentage claim, the diet/stress-as-triggers claims, the Malassezia-spectrum framing) needs subject-matter review before any correction is written.
- **Legal or scope review:** whether naming a specific pharmaceutical-adjacent ingredient (ketoconazole) by name, even with an "OTC recommendation only" qualifier, stays within the same cosmetic/non-medical framing established for Modules 1 and 4, or needs additional hedging or removal.
- **Live-model testing:** how the current shared `M6.system` rubric actually grades real student answers — not evaluated here (no live API call was made as part of this documentation-only extraction).
- **Screen-reader testing:** VoiceOver/NVDA behavior around the confirmed missing `aria-label`/`aria-live`/keyboard-access gaps (§10) was not tested with an actual screen reader — the gaps are confirmed from source, not from an assistive-technology session.
- **Physical-keyboard testing:** the checkpoint textareas/buttons and the spectrum slider should be keyboard-operable per native semantics; the comparison-card toggle, cycle-step selector, and trigger accordion are confirmed from source to have no keyboard path at all (not merely "unverified" — this is a source-confirmed gap, listed under Confirmed above), but the exact real-world behavior (e.g., whether any global keyboard handler incidentally makes them reachable) was not physically tested.
- **Real touch-device testing:** not performed; no touch-target sizing was measured.
- **Visual manual QA:** rendering of the comparison cards, cycle steps, spectrum slider, treatment grid, trigger list, and placeholder photo boxes at desktop and mobile widths was not visually confirmed in a browser as part of this extraction.
