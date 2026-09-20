# Module 4 — Source Extraction

Extracted verbatim from `headspa-mastery.html` and `assets/js/headspa-state.js`
as they exist on branch `course-audit-build`, commit `c4c44c0` (top of
history at extraction time — the Phase 1 "Add Module 4 audit assets"
commit). Wording is copied exactly — nothing here has been rewritten,
corrected, summarized, or improved. This is a record of the *current*
experience, not a proposal.

The ten proposed image assets added in Phase 1
(`assets/images/course/module-04/examination-areas/*.png`,
`assets/images/course/module-04/microscopy/*.png`) are **not referenced by
any production file today**. Their inventory lives separately in
[`module-04-assets.md`](module-04-assets.md). This document cross-references
them against the current curriculum but does not decide anything about
them.

Confirmed findings are separated from assumptions in section 16.

---

## 1. Module identity

| Field | Value |
|---|---|
| Module number | `4` |
| Student-facing title (`MODULE_TITLES[4]`) | `Module 4 — Microscopy & Scalp Assessment` |
| Home-screen dashboard subtitle (`.mr-sub` for row 4) | `How to use assessment as a service tool` |
| Module hero eyebrow (in-lesson, `.mh-eyebrow`) | `Module 4 · Microscopy & Scalp Assessment` |
| Module hero title (`.mh-title`) | `Stop assuming.<br>Start seeing.` |
| Module hero description (`.mh-desc`) | `Scalp microscopy changes the service from a relaxing treatment into a customized one. This module teaches you how to use it — not as a performance, but as a genuine decision-making tool that guides everything you do next.` |
| Wrapper ID | `module4Wrap` (`headspa-mastery.html:3251`) — a standard hidden-template div, following the same pattern as Modules 0–2 and 5–11. Module 4 is **not** the `module3HTML`-capture outlier that Module 3 is. |
| JS module identifiers | `M4` (const, questions + shared `system` function), `MODULE_GUIDE_SYSTEMS[4]`, `MODULE_QUICK_PROMPTS[4]`, `MODULE_TITLES[4]`, `MODULE_CHECKPOINTS['4']`, `MODULE_CP_COUNTS['4']`, `MODULE_MEMORY_TAGS[4]` (`headspa-state.js`) |
| Checkpoint IDs | `m4cp1`, `m4cp2` — follows the standard `mNcpX` convention (unlike Module 3's bare `cp1`/`cp2`) |
| Completion-card ID | `m4Complete` — standard `mNComplete` convention, no special-case branch needed in `getVisibleCompletionCard()` (`headspa-mastery.html:5872`–`5875`; only Module 3 has a special case) |
| Static routing entry | `STATIC_MODULES[4]` inside `openModuleById()` (`headspa-mastery.html:6646`): `() => { const w = document.getElementById('module4Wrap'); if (w && wrap) wrap.innerHTML = w.innerHTML; window._m4cpsDone = 0; }` — swaps in the hidden template's HTML and resets a `window._m4cpsDone` counter. No other module-3-style capture mechanism is used. |
| Guide quick-prompts routing | `updateGuideQuickPrompts(4)` runs inside `openModuleById(4)` and overwrites `#quickPs` with `MODULE_QUICK_PROMPTS[4]` (3 prompts). **No conflicting hardcoded prompt set exists inside `module4Wrap`'s static markup** — confirmed by a direct search of the wrapper's HTML for `quickPs`/`quick-prompt`/`qa(` patterns, none found. This is Module 4's starting state already matching the *corrected* state Module 3 only reached after its audit. |
| Special-case routing behavior | None beyond the `window._m4cpsDone = 0` reset noted above. No `data-also-id`, no dead key-handler duplicate, no malformed markup found in the wrapper (see section 16 for full detail). |

Module 4 is structurally the **most standard-shaped** module extracted so
far — it follows the same hidden-`moduleNWrap`-template, `mNcpX`-checkpoint,
`mNComplete`-completion-card conventions used by Modules 0, 1, 2, and 5–11,
without any of the structural irregularities found in Module 3.

---

## 2. Complete Module 4 curriculum

Copied exactly from `#module4Wrap .lesson-wrap`
(`headspa-mastery.html:3251`–`3607`), in student-encounter order. There is
**no video-intro block** in Module 4 (unlike Module 3's pre-audit
"Video coming soon" placeholder) — the module opens directly with the hero.

### Hero

- Eyebrow: `Module 4 · Microscopy & Scalp Assessment`
- Title: `Stop assuming.<br>Start seeing.`
- Description: `Scalp microscopy changes the service from a relaxing treatment into a customized one. This module teaches you how to use it — not as a performance, but as a genuine decision-making tool that guides everything you do next.`

### Section — Why it matters (unnumbered eyebrow: `Why it matters`)

- Title: `A microscope makes you a better observer. That's it.`
- Body 1: `Scalp microscopy lets both you and the client actually see what's happening on the scalp rather than guessing. For you it trains the eye — over time you begin recognizing patterns in oil production, buildup, follicle appearance, and density that would be invisible otherwise. For the client it often creates a moment of genuine clarity. Many clients have never seen their scalp up close. Once they do, they take your recommendations far more seriously.`
- Body 2: `That said — a microscope does not make you a medical professional. It makes you a better observer. You are using it to notice what is present, identify visible patterns, and determine whether the scalp is appropriate for treatment. You are not using it to diagnose disease or claim certainty about a medical condition. That distinction matters every single time.`
- Cadence note (`.cadence-note`), label `From Cadence`: `"The best thing microscopy does is stop you from making assumptions. A client tells you their scalp is dry — and what you see is oily congestion and seborrheic flaking. Without the microscope you might have reached for the wrong thing entirely. That's the point. It helps you stop guessing and start responding to what's actually there."`

### Section — Presenting it to the client (unnumbered eyebrow)

- Title: `Keep it calm, educational, and simple.`
- Body: `The way you introduce scalp assessment matters. You don't want the client to feel examined, judged, or alarmed. Keep the framing straightforward and positive — you're customizing their service, not searching for problems.`
- Clinical note (`.clinical-note`), label `Script to use`: `"As part of your service today, I'm going to take a look at your scalp up close so I can better understand what your scalp environment looks like and tailor the treatment accordingly."`
- Body (after script): `That language keeps it professional without sounding clinical or intimidating. You can explain you'll be looking at buildup around the follicles, visible oil production, dryness or flaking, any signs of irritation, and overall scalp balance. This helps clients understand that assessment is part of customizing — not part of diagnosing — the service.`

### Section 4.2 — Technique

- Eyebrow: `4.2 — Technique`
- Title: `The process matters more than the device.`
- Body: `Using a scalp microscope well is less about the tool and more about your approach. Poor technique produces misleading images, rushed conclusions, and weak client education. Good technique makes the entire service feel elevated and trustworthy.`
- Key point (`.key-point`, → icon): `**When to assess:** At minimum, before the treatment begins — before water, exfoliants, or products touch the scalp. Many practitioners also briefly check at the end. Clients can often see the difference in clarity and cleanliness after treatment, which reinforces the value of what you did.`

**Sub-section — Regions to assess:**

- Body: `Don't look at one section and assume it tells the whole story. The scalp is rarely uniform. Some clients show more buildup at the crown, sensitivity around the hairline, or oiliness through the top while the sides remain balanced. A thorough assessment covers multiple regions.`
- **Five-card region grid** (`.scalp-type-grid`, inline-styled 5-column layout) — each card is a small circular color indicator plus a two-line label, **no image, no photo, no diagram** — purely a colored dot and text:
  1. `Frontal<br>hairline`
  2. `Top<br>parting`
  3. `Crown<br>vertex`
  4. `Temporal<br>area`
  5. `Occipital<br>back`

  **This is the exact same five-region sequence and naming as the five
  `examination-areas/` filenames added in Phase 1** (`exam-area-01-front-
  hairline.png` through `exam-area-05-occipital-back.png`) — see section 4
  for the direct cross-reference. The current five-card grid has no
  placeholder for a real photo at all; it is a static colored-dot list.

**Sub-section — Technique essentials:**

- Body: `Part the hair cleanly so the scalp is visible. Don't press the microscope too hard into the scalp — excess pressure creates temporary redness that makes a healthy scalp look reactive. Rest the tool lightly and steadily. Hold it in one place long enough to actually interpret what you're seeing before moving on. The most common beginner mistake is moving too quickly, constantly shifting without allowing time to understand what's on the screen. The purpose is not to rush through an inspection — it's to gather useful information.`

### Section 4.3 — What you're seeing

- Eyebrow: `4.3 — What you're seeing`
- Title: `Five patterns you'll encounter most often.`
- Body: `You're looking for broad visible patterns — not trying to force a diagnosis. Your interpretation guides treatment. Here's what each pattern typically looks like and what it tells you.`

**Five protocol cards (`.protocol-card`), each containing a
`.clinical-photo.placeholder` (SVG icon only, no real image — same
component pattern documented in `module-03-source.md` §2):**

1. **Neutral / balanced** — badge `Preserve`
   - Placeholder label: `Neutral / Balanced Scalp — Microscopy`
   - Placeholder sub: `Slight sheen, clear follicle openings, calm pink tone`
   - What you see: `Slight natural sheen without greasiness. Follicle openings relatively clear. Calm, even color — soft pink tone rather than redness or dullness.`
   - What it means: `No aggressive correction needed. Focus on maintenance, preservation, and what the client's goals are rather than fixing an imbalance.`

2. **Oily / congested** — badge `Clarify`
   - Placeholder label: `Oily / Congested Scalp — Microscopy`
   - Placeholder sub: `Visible sebum at follicle openings, yellowish congestion`
   - What you see: `Shiny appearance, visible sebum surrounding follicle openings, possible oil pooling at base of hairs, yellowish congestion around follicles.`
   - Client reports: `Gets greasy quickly, feels like product sits on scalp, needs to wash often.`
   - What it means: `Protocol leans clarifying. But don't over-strip — that triggers more oil production as compensation.`

3. **Dry / depleted** — badge `Restore`
   - Placeholder label: `Dry / Depleted Scalp — Microscopy`
   - Placeholder sub: `Matte surface, fine white powdery flakes, minimal oil`
   - What you see: `Matte, less reflective surface. Little visible oil at follicle openings. Finer, drier, lighter flakes than seborrheic flaking.`
   - Client reports: `Tightness, itchiness, flaking without feeling oily.`
   - What it means: `Protocol focuses on gentle hydration and barrier support. Avoid anything stripping.`

4. **Sensitive / reactive** — badge `Soothe`
   - Placeholder label: `Sensitive / Reactive Scalp — Microscopy`
   - Placeholder sub: `Visible redness, fragile barrier, inflamed areas`
   - What you see: `Visible redness, reactivity, delicate overall appearance. May show flushing or inflamed areas.`
   - Client reports: `Stinging, burning, itching, or easy irritation from products, temperature, or friction.`
   - What it means: `Slow down. Reduce stimulation. Not every red scalp is a crisis — but redness should make you more selective about everything you do.`

5. **Congested** — badge `Clarify gently`
   - Placeholder label: `Congested Scalp — Microscopy`
   - Placeholder sub: `Buildup at follicle openings, coated surface residue`
   - What you see: `Buildup at follicle openings, residue on scalp surface, coated appearance from sebum, dead skin, product residue, or infrequent cleansing.`
   - What it means: `May benefit from exfoliation and clarifying support — as long as the scalp is not also inflamed or sensitive. Congested and sensitive can coexist.`

  **These five placeholder labels/sub-labels are, word for word, the exact
  five captions baked into the five images added under
  `assets/images/course/module-04/microscopy/` in Phase 1** — see section 4
  for the direct cross-reference and section 16 for the taxonomy
  implications (five categories here vs. the "Congested" and "Oily /
  congested" cards both existing as separate entries in this same list —
  see the existing-taxonomy note in section 5).

- Cadence note (`.cadence-note`), label `What this looks like in real time`: `"You see flaking, slight shine, and buildup at the follicle. The weak interpretation: dry scalp, needs hydration. The stronger interpretation: possible oil plus buildup with flaking — likely needs cleansing support, not just moisture. You see redness and the client says 'it's sensitive.' The weak interpretation: inflamed scalp, treat it aggressively to fix it. The stronger: reactive scalp — reduce stimulation, simplify the service, avoid overworking the area. You see clean follicles and balanced sheen. The weak interpretation: nothing to do. The stronger: maintain balance — don't overcorrect what isn't a problem. This is where most people get it wrong. They react to what's visible instead of interpreting what it means."`
- Info card (`.info-card`), title `Most scalps are not one category`: `One of the most common mistakes is trying to label a scalp too quickly. In reality you'll often see oily at the crown, dry at the hairline, buildup in one section, and sensitivity in another. If you treat the entire scalp the same way, you will overcorrect one area and under-treat another. Strong practitioners adjust within the service. Not everything needs to be uniform.`

### Section 4.4 — When not to treat

- Eyebrow: `4.4 — When not to treat`
- Title: `This is where professionalism matters most.`
- Body: `An inexperienced practitioner thinks they need to do something every time. An experienced practitioner knows when not to proceed. This section is one of the most important in the course — because restraint here protects both the client and your career.`
- Key point (⚠️ icon): `**Default rule:** If you are unsure whether something is appropriate to treat, default to caution. A referral is not a failure. It is a sign that you understand your role.`

**Five clinical notes (`.clinical-note`), each a "do not treat/continue" condition:**

1. Label `Do not treat — signs of possible infection`: `Pustules or pus-filled lesions, areas that appear actively infected, crusting with tenderness, suspicious fungal-looking patches, weeping or oozing areas. Refer to a medical professional before treatment.`
2. Label `Do not treat — open, broken, or actively injured scalp`: `Cuts, abrasions, scratched-open areas, raw or bleeding spots, recent surgical sites, unhealed wounds. Water, friction, exfoliation, and product application can all worsen these areas and increase contamination risk.`
3. Label `Do not treat — severe inflammation`: `A mildly reactive scalp may still be manageable with care. But if the scalp is intensely red, painful, hot, swollen, or clearly inflamed — that moves outside the range of a relaxing scalp service. Refer out.`
4. Label `Do not treat — suspected medical hair loss`: `Sudden patchy loss, smooth bald spots, unusual shedding patterns, shiny scar-like areas, follicle absence, or eyebrow/lash loss alongside scalp loss. These are not buildup, dryness, or poor circulation. These require medical evaluation.`
5. Label `Do not continue — if the client reports unexpected pain`: `Tenderness, burning, sharp pain, or discomfort that seems disproportionate should be taken seriously. Pain is not something to massage through just because the scalp looks okay.`

- Cadence note, label `From Cadence`: `"Don't treat the client anyway because you don't want to lose the appointment. That decision comes from insecurity, not professionalism. If the scalp looks inappropriate for treatment — you pause, you explain, you refer. The script is simple: 'Based on what I'm seeing today, I think it would be best to pause and have you seen by a dermatologist first. Once that's been evaluated, I'd love to support your scalp in a way that's appropriate.' That language protects them and protects you."`
- Key point (⚠️ icon): `**Where practitioners go wrong here:** They continue the service anyway. They downplay what they're seeing. They avoid referral because it feels uncomfortable. That is not confidence. That is avoidance. If something looks inappropriate to treat — you stop.`

### Section 4.5 — Practitioner insight

- Eyebrow: `4.5 — Practitioner insight`
- Title: `What experience actually teaches you.`
- Body: `These are the patterns that come with time — the things that are hard to teach in a classroom but easy to internalize once you know to look for them.`

**Four info cards (`.info-card`):**

1. `Flakes do not automatically mean dryness` — `Many flaky scalps are oily, congested, or yeast-driven. If the scalp is shiny and the flakes are clumped, yellowish, or sticking near the follicle — don't automatically reach for a hydrating story. Look at the whole environment.`
2. `Product buildup can mimic scalp conditions` — `Dry shampoo, styling products, root sprays, and heavy leave-ins can make a scalp look far worse than it actually is. Always consider whether what you're seeing could be residue before assuming it's a condition.`
3. `Pressure creates fake redness` — `Press too hard with the microscope and you'll create temporary redness — then potentially treat a reaction you caused. Light touch matters. Rest the tool, don't press it.`
4. `Clients believe what they can see` — `When clients visually understand their scalp they are far more likely to follow your recommendations and take home care seriously. The microscope isn't just for you — it's one of the strongest trust-building tools in the service when used correctly.`

- Key point (→ icon): `**Quick reality check:** Microscopy does not make you more advanced. Your interpretation does. Two practitioners can look at the same scalp and make completely different decisions. That is the skill you are building.`

### Checkpoint 1 (`m4cp1`) — see section 7 for full grading detail

- Label: `Check your understanding`
- Displayed question (`.cp-q`): `A client sits down and shows you a scalp that's visibly flaky. Before you reach for any products, what are the two completely different scalp situations that could be causing the flaking — and why does it matter which one it is?`
- Placeholder: `Think through what flaking can actually signal...`

### Section 4.6 — Common mistakes

- Eyebrow: `4.6 — Common mistakes`
- Title: `What to unlearn before it becomes a habit.`
- Body: `These are the patterns that show up most in new practitioners — not because of bad intentions, but because they haven't yet developed the habits that come from repetition and honest feedback.`

**Four protocol cards, each a `✗` mistake with a `The fix` row (no badge, no photo):**

1. `Assuming every flaky scalp is dry` — fix: `Look at the whole environment. Is there oil present? Are flakes clumped and yellowish or fine and powdery? Two completely different treatment paths.`
2. `Moving too fast during assessment` — fix: `Slow down enough to actually interpret what's on the screen. Assessment is not a visual sweep — it's a deliberate observation.`
3. `Using assessment as performance` — fix: `If the assessment doesn't change what you do — the protocol, the products, the referral decision — it's theater. Let it actually guide your work.`
4. `Speaking too confidently about medical issues` — fix: `Observing is fine. Educating is fine. Diagnosing is not. The moment you speak with certainty about a medical condition, you're outside your lane.`

### Checkpoint 2 (`m4cp2`) — see section 7 for full grading detail

- Label: `Final check`
- Displayed question (`.cp-q`): `You complete your assessment and notice what looks like a cluster of pus-filled lesions near the crown. The client seems unbothered and just wants their relaxing service. Walk me through exactly what you do and say.`
- Placeholder: `What's your response in this moment...`

### Completion card (`#m4Complete`)

- Gold mark: `✦`
- Title: `Module complete.`
- Subtitle: `You can see the scalp now. You know what to look for and when to stop.`
- Next-up label: `Up next — Module 5`
- Next-up text: `Module 5 tells you what to do with what you see. Five scalp types, five treatment directions, and the framework that makes every service feel intentional rather than improvised.`
- Primary button: `Start Module 5 →` → `openModuleById(5)`
- Secondary button: `Back to course` → `showHome()`
- **No malformed or dead markup found** — unlike Module 3's pre-audit
  completion card, Module 4's completion card has exactly two buttons and
  no hidden/broken fragment.

No hardcoded guide-panel quick-prompt block exists anywhere in Module 4's
static markup (see section 1).

---

## 3. Cross-reference — existing curriculum vs. the proposed Module 4 assets

This section directly answers the extraction requirement to map the
Phase-1 proposed assets against current teaching. **Nothing here is a
decision about whether to use, approve, or reject any asset.**

### `examination-areas/` (5 files) vs. the "Regions to assess" five-card grid

| Current grid card (Section 4.2) | Proposed asset | Match |
|---|---|---|
| `Frontal hairline` | `exam-area-01-front-hairline.png` | Name matches exactly |
| `Top parting` | `exam-area-02-top-parting.png` | Name matches exactly |
| `Crown vertex` | `exam-area-03-crown-vertex.png` | Name matches exactly |
| `Temporal area` | `exam-area-04-temporal-area.png` | Name matches exactly |
| `Occipital back` | `exam-area-05-occipital-back.png` | Name matches exactly |

The current five-card grid has **no image placeholder at all** — each card
is only a colored dot (`.sc-indicator`) and a two-line text label. There is
no existing placeholder these five images would "fill"; using them here
would be a new visual treatment for this section, not a drop-in replacement
of an existing placeholder. Per `module-04-assets.md`, `exam-area-04-
temporal-area.png` uses a visibly different model/framing than the other
four — this becomes directly relevant if all five are used together in this
grid, since 01/02/03/05 share one model/framing and 04 does not.

### `microscopy/` (5 files) vs. the five "What you're seeing" protocol-card placeholders

| Current placeholder (Section 4.3) | Placeholder label (baked into current SVG-icon component) | Proposed asset | Match |
|---|---|---|---|
| Card 1 — Neutral / balanced | `Neutral / Balanced Scalp — Microscopy` | `microscopy-neutral-balanced-scalp.png` | Label text matches exactly (current placeholder sub also matches the proposed image's baked-in subtitle word for word: "Slight sheen, clear follicle openings, calm pink tone") |
| Card 2 — Oily / congested | `Oily / Congested Scalp — Microscopy` | `microscopy-oily-congested-scalp.png` | Matches exactly (sub: "Visible sebum at follicle openings, yellowish congestion") |
| Card 3 — Dry / depleted | `Dry / Depleted Scalp — Microscopy` | `microscopy-dry-depleted-scalp.png` | Matches exactly (sub: "Matte surface, fine white powdery flakes, minimal oil") |
| Card 4 — Sensitive / reactive | `Sensitive / Reactive Scalp — Microscopy` | `microscopy-sensitive-reactive-scalp.png` | Matches exactly (sub: "Visible redness, fragile barrier, inflamed areas") |
| Card 5 — Congested | `Congested Scalp — Microscopy` | `microscopy-congested-scalp.png` | Matches exactly (sub: "Buildup at follicle openings, coated surface residue") |

**This is a striking, exact five-for-five match** — every current
placeholder label and sub-label in Section 4.3 is reproduced word for word
as baked-in text inside the corresponding proposed image. This strongly
suggests the five microscopy images were produced specifically to fill
these five existing placeholders. That said, per the task's standing
instruction, **this naming match does not by itself establish that the
images are anatomically or dermatologically accurate, or that the
five-category taxonomy itself is correct** — both remain open questions for
the Module 4 audit (see section 5's taxonomy-ambiguity note and
`module-04-assets.md`'s flagged "congested" vs. "oily / congested"
near-duplicate concern, which originates directly from this same five-card
list).

### Other modules' placeholder photos with overlapping labels (context only, not part of Module 4, not extracted)

A repo-wide search found `.clinical-photo.placeholder` blocks with similar
scalp-type labels inside **Module 5** (`module5Wrap`, e.g. "Oily Scalp —
Microscopy," "Dry Scalp — Microscopy," "Neutral Scalp — Microscopy,"
"Sensitive Scalp — Microscopy") and **Module 6** (`module6Wrap`, e.g. "Dry
Scalp — Microscopy," "Dandruff — Microscopy," "Mild Dandruff — Microscopy,"
"Seborrheic Dermatitis — Microscopy"). These are **not part of Module 4**,
were not extracted here, and were not edited — noted only because they show
the same five-category (and overlapping) scalp-appearance language recurs
in later modules too, which may be relevant context for the Module 4 audit
when it considers taxonomy consistency across the course. Per task scope,
Module 5 and later were not extracted or edited in this task.

---

## 4. Examination-area sequence

Extracted exactly as currently taught (Section 4.2, "Regions to assess").

- **Number of examination locations:** 5.
- **Location names, in order:** Frontal hairline, Top parting, Crown
  vertex, Temporal area, Occipital back.
- **Order:** Front-to-back, roughly following a path from the hairline
  toward the crown, out to the temple, and back to the nape — but the
  course text itself does not explicitly justify or explain this specific
  order; it is presented as a flat five-item grid, not a described
  sequence or path.
- **Left/right differentiation:** No. `Temporal area` is a single card with
  no left/right distinction, and no other region is lateralized either.
- **Is the sequence systematic?** The five regions are named and grouped,
  but the current text only says "a thorough assessment covers multiple
  regions" — it does not instruct the student to move through them in a
  specific order, does not number the steps, and does not explain why this
  particular five-region set was chosen over, say, occipital left/right or
  additional midline points.
- **Do diagrams exist for this sequence today?** No. The five-card grid
  uses only colored dots and text — no diagram, illustration, or photo of
  any kind exists in the current production markup for this section.
- **Must the student memorize the sequence?** Not explicitly tested. There
  is no interaction, quiz, or checkpoint question that asks the student to
  recall, order, or identify the five regions.
- **Does an interaction test it?** No. Neither `m4cp1` nor `m4cp2` asks
  about the five regions at all — both checkpoints focus on flaking
  differentiation (`m4cp1`) and the do-not-treat/referral scenario
  (`m4cp2`). The five-region content is currently untested.
- **Do the prepared examination-area assets match the sequence?** Yes, by
  name — see section 3's cross-reference table. All five proposed images
  correspond one-to-one with the five current region names, in the same
  order implied by their filename numbering (`01` through `05`).

---

## 5. Microscopy and scalp taxonomy

Extracted exactly as currently taught (Section 4.3, "What you're seeing").

Current taxonomy is **five categories**, presented as a flat list of
protocol cards with no stated relationship to each other (not explicitly
framed as mutually exclusive, a spectrum, or combinable) except for one
line in the "Most scalps are not one category" info card, which explicitly
says a single scalp can show multiple categories in different regions at
once.

| Category (exact student-facing name) | Technical name, if different | Observable features (as stated) | Claimed cause (as stated) | Product/treatment recommendation | Contraindication / referral language | Associated image or placeholder | Framing |
|---|---|---|---|---|---|---|---|
| Neutral / balanced | None given | Slight natural sheen, clear follicle openings, calm even pink tone | Not stated (framed as the healthy baseline) | Maintenance, preservation, follow client goals | None | `.clinical-photo.placeholder` — "Neutral / Balanced Scalp — Microscopy" | Framed as **appearance/baseline**, not a diagnosis |
| Oily / congested | None given | Shiny, visible sebum around follicle openings, possible oil pooling, yellowish congestion | Excess sebum production (implied) | Clarifying protocol, but "don't over-strip" | None stated | "Oily / Congested Scalp — Microscopy" | Framed as **appearance/scalp-type**, with an explicit caution against a reflexive treatment response (over-stripping) |
| Dry / depleted | None given | Matte, less reflective, little visible oil, finer/drier/lighter flakes than "seborrheic flaking" | Barrier compromise (implied by section title "Barrier compromise") | Gentle hydration, barrier support, avoid stripping | None stated | "Dry / Depleted Scalp — Microscopy" | Framed as **appearance/scalp-type** |
| Sensitive / reactive | None given | Visible redness, reactivity, delicate appearance, possible flushing or inflamed areas | Not stated | Slow down, reduce stimulation | Implicit — "not every red scalp is a crisis" acknowledges some redness could be more than routine sensitivity, without specifying when to refer | "Sensitive / Reactive Scalp — Microscopy" | Framed as **appearance**, with one hedge acknowledging a possible more-serious case without resolving it |
| Congested | None given | Buildup at follicle openings, residue on scalp surface, coated appearance | Sebum, dead skin, product residue, or infrequent cleansing (listed as alternatives, not narrowed) | Exfoliation and clarifying support, "as long as the scalp is not also inflamed or sensitive" | Implicit — explicitly says congestion and sensitivity "can coexist," meaning this card alone may not be sufficient to decide treatment | "Congested Scalp — Microscopy" | Framed as **appearance**, explicitly flagged as combinable with the Sensitive/reactive card |

### Flagged taxonomy ambiguity (not resolved here)

- **"Congested" and "Oily / congested" are two separate cards in the same
  five-item list**, both containing the word "congested," both describing
  buildup/residue/oil at follicle openings, with overlapping "what you see"
  language ("yellowish congestion around follicles" for Oily/congested vs.
  "coated appearance...from sebum" for Congested). The course text itself
  does not explain what distinguishes them, and this same overlap is
  independently flagged in `module-04-assets.md` for the two proposed
  images with the word "congested" in their filenames. Whether these are
  meant to be genuinely distinct categories, a spectrum (congested →
  worsening into oily/congested), or a duplicate/redundant entry is an open
  question for the Module 4 audit.
- **No category is explicitly labeled diagnosis, condition, temporary
  presentation, or unknown** — all five are implicitly treated as
  observable appearance/scalp-type categories a practitioner assigns from
  a single microscopy look, without qualifying language like "may present
  as," "compatible with," or "temporary." This is different from Module
  3's post-audit language (e.g., "compatible with a telogen shedding
  pattern") — Module 4 has not yet received that kind of hedging language
  treatment.
- **The five-region examination grid (section 4) and the five-category
  taxonomy (this section) are two separate five-item lists** that are
  never explicitly connected in the current text — the module does not say
  "check each of the five regions against these five appearance
  categories," even though that connection seems to be the practical
  intent (the "Most scalps are not one category" card implies exactly
  this: different regions showing different categories).

---

## 6. Current interactions

| Interaction | What the student does | Graded? | Persists? | Success/failure behavior | HTML IDs | Related JS |
|---|---|---|---|---|---|---|
| Read curriculum | Scroll and read | No | Read-percent tracked via scroll listener (same shared mechanism as every module) | Contributes to progress-bar weight | `#module4Wrap .lesson-wrap` sections | `setReadProgress` (shared) |
| Five-region grid | View only | No | No | Static — five colored dots and text labels, no click handler, no state | `.scalp-type-grid` cards inside module 4 | none |
| Five protocol-card placeholders | View only | No | No | Static SVG-icon placeholders, no click handler | `.clinical-photo.placeholder` × 5 | none |
| Checkpoint `m4cp1` | Free-text answer, submit | Yes (model-graded pass/fail, generic criteria only — see section 7) | Yes — `checkpointMeta.m4cp1` | Status pill `Accepted`/`Needs revision`; pass required for module completion | `m4cp1`, `m4cp1In`, `m4cp1Btn`, `m4cp1Res` | `submitM4CP`, `m4cpKey`, `submitCheckpoint`, `evaluateCheckpointAnswer` |
| Checkpoint `m4cp2` | Free-text answer, submit | Yes (model-graded pass/fail, generic criteria only) | Yes — `checkpointMeta.m4cp2` | Status pill `Accepted`/`Needs revision`; pass required for module completion | `m4cp2`, `m4cp2In`, `m4cp2Btn`, `m4cp2Res` | `submitM4CP`, `m4cpKey`, `submitCheckpoint`, `evaluateCheckpointAnswer` |
| Voice input on checkpoints | Click mic, speak answer | N/A (fills textarea) | Only once submitted | Text populates the textarea | mic buttons inside `.cp-row` | `startVoice('m4cp1In'/'m4cp2In', this)` |
| "Start Module 5 →" | Click after completion | No | Navigates + sets `currentModule` | Opens Module 5 | inside `#m4Complete` | `openModuleById(5)` |
| "Back to course" | Click after completion | No | Sets view to home | Returns to course home | inside `#m4Complete` | `showHome()` |
| Guide panel (Cadence chat) | Open panel, ask a question or tap a quick prompt | No | Chat history in-memory only, capped at 16 | Streamed response or shared error fallback | `guideBtn`, `guidePanel`, `gpMsgs`, `gpInput`, `quickPs` | `toggleGuide`, `gpSend`, `qa`, `getGuideSystem` |

### Which interactions are graded / ungraded / persistent / completion-gating

- **Completion-gating (required):** `m4cp1` and `m4cp2` — both required
  (`MODULE_CP_COUNTS['4'] === 2`).
- **Graded but not completion-gating:** none.
- **Ungraded and non-persistent:** none — like Module 3 before its audit,
  **Module 4 currently has zero ungraded practice interactions.** The
  five-region grid and the five protocol cards are both purely
  instructional/view-only (colored dots and static SVG-icon placeholders),
  not interactive components a student clicks through or engages with.
- **Persistent:** only `checkpointMeta.m4cp1` / `checkpointMeta.m4cp2` (via
  the shared checkpoint machinery) and the general read-percent/
  scroll-position tracking every module has.

Module 4's five-region grid and five-category protocol-card set are the
two most visually and structurally distinct pieces of content in the
module, and both are currently **completely static** — no click-to-reveal,
no comparison interaction, no scenario judgment, nothing that asks the
student to actively engage with either five-item list before being told
the answer.

---

## 7. Module 4 checkpoints

Two required checkpoints (`MODULE_CHECKPOINTS['4'] = ['m4cp1', 'm4cp2']` —
standard `mNcpX` naming, unlike Module 3's bare `cp1`/`cp2`).

| Field | `m4cp1` | `m4cp2` |
|---|---|---|
| Label above question | `Check your understanding` | `Final check` |
| Displayed question (`.cp-q`) | `A client sits down and shows you a scalp that's visibly flaky. Before you reach for any products, what are the two completely different scalp situations that could be causing the flaking — and why does it matter which one it is?` | `You complete your assessment and notice what looks like a cluster of pus-filled lesions near the crown. The client seems unbothered and just wants their relaxing service. Walk me through exactly what you do and say.` |
| Placeholder | `Think through what flaking can actually signal...` | `What's your response in this moment...` |

### Do the displayed and evaluated questions match?

**No, for both checkpoints** — the same displayed-vs-evaluated mismatch
pattern already found and corrected in Modules 1, 2, and 3.

`M4.questions.m4cp1` (`headspa-mastery.html:6365`):
> A client has a visibly flaky scalp. What are the two completely different causes that could explain the flaking, and why does it matter which one it is?

This is a materially shortened paraphrase of the displayed question — it
drops the framing detail "sits down and shows you," "Before you reach for
any products," and rewords "scalp situations" as "causes." The evaluator
never sees the original scenario framing the student actually read.

`M4.questions.m4cp2` (`headspa-mastery.html:6366`):
> You notice pus-filled lesions near the crown. The client wants their service. What do you do and say?

This drops "what looks like a cluster of," "The client seems unbothered
and just," and "Walk me through exactly." The evaluator's version presents
the finding with more certainty ("pus-filled lesions" stated flatly rather
than "what looks like a cluster of pus-filled lesions") and loses the
"unbothered" detail from the displayed question, which is arguably relevant
to what a strong answer should address (client pushback, not just the
referral decision itself).

### Complete grading prompt

Built in `submitCheckpoint()` from these pieces, concatenated in order —
identical composition mechanism to every module (see
`module-00-source.md` §4, §8 for the shared machinery):

1. **Base system** (`M4.system`, a function of the question `q`,
   `headspa-mastery.html:6368`):
   > You are Cadence, instructor of HeadSpa Mastery. Module 4 (Microscopy & Scalp Assessment) checkpoint. Question: "{q}". Key concepts: Microscopy is observation not diagnosis. Flaky scalp — dry/depleted (fine white powdery, no oil) vs oily/yeast-driven (clumped yellowish, near follicle). Five assessment regions: frontal, top parting, crown, temporal, occipital. Light pressure only. Do not treat: pustules/lesions, broken scalp, severe inflammation, suspected medical hair loss. Referral is professionalism. 3-5 sentences, direct and warm, no bullet points.

   `{q}` here is the shortened/mismatched `M4.questions[id]` value, not the
   displayed `.cp-q` text. The same base system is used for **both**
   `m4cp1` and `m4cp2` — there is no per-checkpoint system prompt the way
   Modules 1, 2, and 3 now have after their respective audits.
2. `CADENCE_RESPONSE_CONSISTENCY_ANCHOR`, `CADENCE_SELECTIVE_MEMORY_INSTRUCTION`,
   and `APP_STATE.getCadenceMemoryContext(4, 'checkpoint')` — shared,
   unchanged.
3. Inside `evaluateCheckpointAnswer()`: `CADENCE_CHECKPOINT_TONE` and the
   generic ambiguous/partial/generic-answer instruction. **No
   Module-4-specific criteria block exists** — confirmed by reading the
   current `evaluateCheckpointAnswer()` function in full
   (`headspa-mastery.html:6050`–`6076`).
4. `CADENCE_FEEDBACK_MICRO_RULES` and `CHECKPOINT_EVAL_FORMAT` — shared,
   unchanged.

### Pass criteria

None beyond the shared generic instructions — Module 4 has no itemized
pass checklist, no explicit "do not fail for grammar/spelling" carve-out,
and no immediate-correction list. This is the same starting state Modules
0, 1, 2, and 3 were all in before their respective audits.

### Revision / attempt / state behavior

Identical to every other module — governed entirely by the shared
`submitCheckpoint()`, `evaluateCheckpointAnswer()`,
`normalizeCheckpointEvaluation()`, `APP_STATE.setCheckpointResult()`,
`APP_STATE.captureCheckpointMemory()`, `APP_STATE._checkModuleComplete()`,
`resolveModuleCompletionUI()`, `renderCheckpointOutcomeLabel()`, and
`applyCheckpointInputState()` (full mechanics documented in
`module-00-source.md` §4). Both checkpoints use dedicated, correctly wired
handlers: `onkeydown="m4cpKey(event,'m4cp1')"` / `m4cpKey(event,'m4cp2')`
(`headspa-mastery.html:3517`, `3584`) dispatch to `m4cpKey(e, id)`
(`headspa-mastery.html:6855`–`6857`), which calls `submitM4CP(id)`
(`headspa-mastery.html:6852`–`6854`): `submitCheckpoint(4, id, M4.system,
M4.questions[id])` — **no custom `errorMessage` 5th argument**, so a
network failure shows the shared default text: `Cadence didn't respond —
check your connection and try again.` No dead/unused key-handler function
exists for Module 4 (unlike Module 3's pre-audit `cpKey_m3`) — `m4cpKey` is
the only handler defined for this module and it is the one actually wired
into the markup.

### Accessibility

Neither checkpoint has any accessibility labeling: the voice buttons rely
on `title="Speak your answer"` only (no `aria-label`), the submit buttons
have no accessible name beyond the SVG icon, and neither `.cp-res` region
has `aria-live`. Confirmed via a direct search of the wrapper markup for
`aria-`/`role=` attributes — zero matches anywhere in `module4Wrap`. Same
starting state Modules 0, 1, 2, and 3 were all in before their
accessibility corrections.

---

## 8. Cadence context

### Module-specific guide context (`MODULE_GUIDE_SYSTEMS[4]`, `headspa-mastery.html:6434`, verbatim)

> You are Cadence — a mentor built from nearly two decades in the head spa industry. The student is in Module 4 (Microscopy & Scalp Assessment): microscopy as observation, five assessment regions, dry scalp vs dandruff, when not to treat. If they come from a licensed background, connect their existing pattern-recognition skills to scalp assessment for head spa. All roads lead back to serving the scalp. 3-5 sentences. No bullet points.

This is the same "mentor built from nearly two decades in the head spa
industry" personal-experience framing already found and corrected in
Modules 2 and 3's pre-audit guide systems — Cadence claims personal
industry experience here, which conflicts with the "Cadence direction" /
course-name global decision (Cadence must not claim personal human work
experience). Not yet corrected for Module 4. Note the guide system also
says "dry scalp vs dandruff," a distinction that is **not actually taught
anywhere in Module 4's current curriculum** (dry vs. dandruff is Module 6
content, per `M6`'s questions/system at `headspa-mastery.html:6383`–6386)
— see section 16, finding 5.

Composed at call time (`getGuideSystem()`) with the same
`CADENCE_RESPONSE_CONSISTENCY_ANCHOR` + `CADENCE_SELECTIVE_MEMORY_INSTRUCTION`
+ `getCadenceMemoryContext(4, 'guide')` additions used everywhere.

### Suggested prompts — one source only (`MODULE_QUICK_PROMPTS[4]`, `headspa-mastery.html:6449`)

- `What does healthy look like under microscopy?`
- `How do I talk about what I see without diagnosing?`
- `When should I stop and refer?`

No conflicting hardcoded prompt set exists in Module 4's static markup
(confirmed — see section 1). This is Module 4's starting state already
matching the *corrected* state Module 3 only reached after its audit.

### Module-open Cadence greeting (`headspa-mastery.html:6688`)

> Module 4 is where your eye starts to develop. Microscopy sounds technical but the skill is really about slowing down and actually looking. Ask me anything as you move through it.

### Memory tags (`MODULE_MEMORY_TAGS[4]`, `assets/js/headspa-state.js:136`)

```
4: ['pattern-recognition', 'scope-awareness', 'referral-judgment']
```

### References to the old course name

`M4.system` (`headspa-mastery.html:6368`): `"You are Cadence, instructor of HeadSpa Mastery. Module 4 (Microscopy & Scalp Assessment) checkpoint..."`

`MODULE_GUIDE_SYSTEMS[4]` does not itself name the course, but (as noted
above) frames Cadence as personally having "nearly two decades in the head
spa industry."

---

## 9. Completion behavior

### Exact completion requirements

- Both required checkpoints `m4cp1` and `m4cp2` must reach `status:
  'passed'` (`MODULE_CHECKPOINTS['4'] = ['m4cp1', 'm4cp2']`).
- No read-percentage minimum.

### Completion card (`#m4Complete`)

- Gold mark: `✦`
- Title: `Module complete.`
- Subtitle: `You can see the scalp now. You know what to look for and when to stop.`

No separate eyebrow/status line and no distinct "competencies shown" line
— same pre-rewrite two-line pattern Modules 0, 1, 2, and 3 all had before
their audits.

### Next-module language

- Next-up label: `Up next — Module 5`
- Next-up text: `Module 5 tells you what to do with what you see. Five scalp types, five treatment directions, and the framework that makes every service feel intentional rather than improvised.`
- Primary button: `Start Module 5 →` → `openModuleById(5)`
- Secondary button: `Back to course` → `showHome()`
- No dead or malformed markup found (unlike Module 3's pre-audit
  completion card).

### Relevant state and functions

Same shared completion path as every module —
`setCheckpointResult` → `_checkModuleComplete` → `resolveModuleCompletionUI`.
`resolveModuleCompletionUI` calls `getVisibleCompletionCard(moduleId)`,
which uses the standard formula `'m' + moduleId + 'Complete'`
(`headspa-mastery.html:5872`–`5875`) — Module 4 needs **no special case**,
unlike Module 3. `canAccessModule(5)` requires `isModuleComplete(4)` —
Module 4 is the sole gate for unlocking Module 5.

---

## 10. Accessibility (module-wide)

- **Neither checkpoint has accessibility labels** — no `aria-label` on the
  voice or submit buttons, no `aria-live` on `.m4cp1Res`/`.m4cp2Res` (see
  section 7).
- **The five-region grid** (`.scalp-type-grid`) has no accessible text
  equivalent beyond its own visible labels — the colored `.sc-indicator`
  dots carry no semantic meaning (not even a `title` attribute), and there
  is no way for a screen-reader user to distinguish that these five items
  represent an ordered or related examination sequence versus five
  unrelated decorative cards.
- **The five `.clinical-photo.placeholder` blocks** (in the "What you're
  seeing" protocol cards) use a generic decorative SVG icon plus visible
  text labels/sub-labels — since no real `<img>` is present yet, there is
  no alt-text question to resolve today, but (same as documented for
  Module 3) this will need attention once real photos are added — the
  `.clinical-photo img` CSS rule already exists, confirming the component
  is designed to hold a real image later.
- No `aria-expanded`, `aria-controls`, `role`, or live-region attribute of
  any kind exists anywhere inside `module4Wrap` — confirmed via a direct
  search.

---

## 11. Mobile / interaction concerns visible from the implementation

- The five-column `.scalp-type-grid` is set with an inline
  `grid-template-columns: repeat(5,1fr)` — five equal columns fixed at five
  columns regardless of viewport width, with card padding of
  `0.85rem 0.5rem` and a `font-size:0.72rem` label. This has not been
  checked at mobile width in this extraction pass, but a fixed five-column
  grid at this small font size is a plausible mobile-overflow or
  label-legibility concern — flagged, not verified.
- No explicit touch-target sizing was found for any interactive element in
  this module beyond the standard checkpoint/voice/submit buttons already
  documented for other modules — not measured against a specific minimum
  in this extraction.
- No `prefers-reduced-motion` handling exists in this module (there is no
  animation in the current static presentation, so this is a non-issue
  today but would become relevant if any future interaction introduces
  motion).
- If the proposed `examination-areas/` images (square, 1254×1254, or
  landscape ~1370–1380×1140) were used inside the current fixed
  five-column grid layout, their aspect ratios and the grid's narrow
  per-card width would need reconciling — not evaluated here, flagged for
  the Module 4 audit.

---

## 12. Distinct learning-rhythm assessment

Per `00-global-decisions.md` → "Varied learning rhythm." First-pass content
assessment only — nothing here is a decision or a redesign.

- **Current interaction density:** **Light.** Same as Module 3 before its
  audit — beyond the two required checkpoints, there is no interactive
  component of any kind. The five-region grid and the five protocol cards
  are both static.
- **Current signature learning moment:** The "What you're seeing" five-card
  pattern set (Section 4.3) is the clearest candidate — it is the most
  structurally distinct, highest-density content block in the module (five
  parallel appearance/cause/action cards) and it is the direct payoff of
  the module's own framing ("stop assuming, start seeing"). The five-region
  grid (Section 4.2) is a secondary candidate but is currently the
  thinnest-content piece in the module (a colored dot and two words per
  card, no elaboration).
- **Does the module currently feel meaningfully different from Modules
  0–3?** Structurally, no — like pre-audit Module 3, it is continuous
  instructional sections with zero ungraded practice interactions.
  Experientially, Module 4's content (visual pattern recognition across
  five scalp-appearance categories) is inherently more suited to a
  comparison or visual-identification interaction than Module 3's more
  narrative anatomy content was — the five parallel protocol cards, each
  with a "what you see" / "what it means" pair, read like they were
  written to be turned into a matching or identification exercise, but
  currently are not.
- **Would a midpoint checkpoint improve learning?** `m4cp1` currently
  arrives after Section 4.3 (the five-category content) but before Section
  4.4 ("When not to treat") — already roughly at the midpoint of the
  module's content, unlike Module 3's pre-audit `cp1` which arrived much
  later. Not evaluated further here — this is a question for the approved
  spec, not a decision made in this extraction.
- **Learning-mode fit by concept (observations only):**
  - Five assessment regions: sequencing and spatial/visual — the module
    currently presents this as a flat list with no order emphasis, no
    spatial diagram, and no recall check; well suited to a spatial/visual
    interaction given the five proposed `examination-areas/` images exist.
  - Five microscopy categories: visual identification and comparison — the
    module currently presents this as parallel static cards with no
    interaction; the five proposed `microscopy/` images (each already
    captioned to match) are a natural fit for a comparison or
    identify-the-pattern interaction, not evaluated or approved here.
  - "When not to treat" referral criteria: scenario judgment — this is the
    most "decide what you'd do" content in the module (`m4cp2` already
    tests exactly this with a single scenario), and could support an
    ungraded practice interaction with additional scenarios, similar to
    Module 1's "Where is the line?" or Module 2's "What breaks the
    moment?" — not currently present.
- **Where Cadence currently adds value:** the two "From Cadence" notes
  reframe textbook observation into interpretive judgment ("the weak
  interpretation... the stronger interpretation...") and into
  referral-language modeling (the exact script for pausing a service). The
  guide panel's quick prompts also point at the module's more applied
  questions (what healthy looks like, talking about findings without
  diagnosing, when to refer).
- **Where the student should reason independently:** the module does not
  currently ask the student to reason independently before receiving an
  answer anywhere except the two checkpoints — every other concept (the
  five regions, the five categories, the referral criteria) is explained
  directly with no predict-first or judge-first framing.
- **Any interaction that feels decorative rather than educational:** none
  currently exist to evaluate — flagged as an absence, not a decorative
  interaction to remove.

---

## 13. Insider-value assessment

Per `00-global-decisions.md` → "Insider knowledge and accelerated mastery."
First-pass content assessment only — nothing here is a decision or a
rewrite.

- **Strongest current insider knowledge:** the "Pressure creates fake
  redness" info card (a genuinely non-obvious technique detail — pressing
  too hard can make you diagnose a problem you caused) and the "What this
  looks like in real time" Cadence note's weak-vs-strong interpretation
  pairs (flaking+shine+buildup ≠ automatically dry; redness+"sensitive" ≠
  automatically inflamed and in need of aggressive treatment).
- **Practical decision rules already present:** the explicit "do not
  treat" list (infection signs, broken/injured skin, severe inflammation,
  suspected medical hair loss, unexpected pain) paired with a ready-to-use
  non-alarming referral script is genuinely practitioner-useful, similar in
  quality to Module 3's referral script.
- **Subtle details a beginner would likely miss:** that two visually
  similar presentations (flaking) can have opposite correct responses
  depending on whether oil is present (`m4cp1` tests exactly this); that
  applying more pressure with the microscope tool can fabricate the
  appearance of a condition; that product residue (dry shampoo, root
  sprays, leave-ins) can visually mimic a scalp condition; that a single
  scalp is commonly multiple categories in different regions at once
  (explicitly stated in the "Most scalps are not one category" card).
- **Mistakes this module can prevent:** treating a flaky scalp as
  automatically dry/needing hydration when it may be oily/congested and
  need cleansing support instead; treating an entire scalp uniformly when
  different regions show different needs; continuing a service on a scalp
  showing signs of infection, injury, severe inflammation, or possible
  medical hair loss because stopping feels awkward or costs the
  appointment; over-stripping an oily scalp and triggering more oil
  production; misreading redness caused by the practitioner's own tool
  pressure as a client's baseline condition.
- **How this reduces trial and error:** the explicit do-not-treat list and
  matching referral script give a new practitioner an immediate decision
  framework for the single highest-stakes judgment call in this role
  (when to stop/refer), rather than needing to encounter and misjudge an
  infection or injury in a real service first. The "two different causes
  of flaking" framing (directly tested by `m4cp1`) short-circuits a very
  common beginner mistake (treating all flaking the same way).
- **Sections that currently read more like generic textbook material than
  practitioner-useful knowledge:** none identified as strongly as Module
  3's layer-by-layer anatomy inventory — Module 4's content is already
  fairly applied throughout (each concept ties to an observation and a
  service decision). The five-region grid (Section 4.2) is the closest
  candidate — it names five regions but does not yet explain *why* these
  five specifically, or what a practitioner should conclude if a pattern
  appears in one region versus another, leaving it closer to a checklist
  than a decision rule.
- **Where terminology is technical but not useful:** none strongly
  identified — Module 4 uses relatively plain, applied language throughout
  ("what you see," "what it means," "client reports") rather than dense
  anatomical vocabulary.
- **Where imagery could make a major difference:** both five-item
  lists — the examination-region grid (currently colored dots only) and
  the microscopy pattern set (currently generic SVG-icon placeholders) —
  are the two clearest candidates in the entire module for real photos to
  replace abstract description, which is exactly what the two Phase-1
  asset folders appear to target (see section 3).
- **Where the student is being asked to diagnose rather than observe:**
  the five microscopy category cards do not use diagnostic language
  directly, but as flagged in section 5, they also do not use the hedging/
  compatibility language ("may present as," "compatible with") that
  Module 3 adopted post-audit — worth the Module 4 audit's attention.
- **Where real-service decision rules are missing:** the five-region grid
  (section 4) has no stated decision rule for what to do if a pattern
  appears in one region vs. another, beyond the general "most scalps are
  not one category" note — a beginner is not told, for example, whether
  crown-only buildup should be treated differently from hairline-only
  buildup.

---

## 14. Guided Completion Path fields

Per `00-global-decisions.md` ("Guided Completion Path" → "Required fields
for every future module audit"). All time estimates below are **unmeasured
approximations derived from content volume**, not timed/tested figures.

- **Estimated attentive learning time:** Module 4's always-visible body
  text (hero, all six sections, the five-region grid, the five protocol
  cards, the five do-not-treat notes, the four insight cards, the four
  mistake cards, both Cadence notes) is approximately 2,100 words — the
  longest module extracted so far by raw word count, driven largely by the
  ten parallel five-item card sets. A careful, attentive read is roughly
  **13–17 minutes**. Unmeasured.
- **Estimated checkpoint time:** `m4cp1` asks for a two-cause
  differentiation explanation; `m4cp2` asks for a full referral-scenario
  walkthrough (what you do and say). Together, likely **7–10 minutes** to
  compose both, plus any revision time. Unmeasured.
- **Estimated hands-on or application time:** the module explicitly
  teaches a physical technique (microscope pressure, dwell time, region
  coverage) but the current curriculum contains **no structured
  hands-on practice task** — same gap already identified in Module 3.
  Given this module is specifically about a physical assessment tool, this
  gap is more consequential here than in Module 3's purely conceptual
  content.
- **Competency demonstrated:** the student can use a scalp microscope with
  correct technique (light pressure, adequate dwell time, multi-region
  coverage), differentiate at least two visually similar presentations
  (dry-type vs. oily/congested-type flaking) using observable features
  rather than assumption, and recognize and correctly respond to
  conditions that require pausing the service and referring out.
- **Suggested practice or application task:** none currently exists in the
  module. The clearest untapped candidates (not proposals, observations)
  are: (1) a hands-on or simulated microscope-technique check given how
  central "light pressure, adequate dwell time" is to the module's own
  framing, and (2) a scenario-judgment exercise across the five categories
  or five do-not-treat conditions, mirroring the practice-interaction
  pattern already established in Modules 1–3.
- **Earlier concepts that should be revisited:** Module 1's referral
  language and scope framing directly underlies this module's "when not to
  treat" section and referral script. Module 3's shedding/hair-loss
  referral criteria (patchy/asymmetric loss, scarring, eyebrow/lash
  involvement) overlaps substantially with this module's "suspected
  medical hair loss" do-not-treat item — the two modules currently repeat
  similar referral criteria independently rather than cross-referencing
  each other.
- **Suggested position in the Guided Completion Path:** fifth — follows
  the Welcome Module, Module 1, Module 2, and Module 3 (whose own closing
  section explicitly sets this module up: "Module 4 teaches you how to
  read it — in real time, on a real scalp"); precedes Module 5 (which the
  module's own completion card explicitly hands off to: "Module 5 tells
  you what to do with what you see"); precedes the Module 12 Final Exam
  that all pacing leads toward.

---

## 15. Listen Mode planning fields

First-pass content assessment only — no prior decision record defines
Listen Mode's implementation; nothing here is authorized for building.
Wording below describes the *current* module exactly as written — nothing
has been corrected or improved for this section.

- **Whether narration is appropriate:** Partially. The prose sections
  ("Why it matters," "Presenting it to the client," "Technique essentials,"
  "When not to treat," "Practitioner insight," "Common mistakes") are
  conceptual/explanatory and narrate reasonably well. The two five-item
  card sets (regions to assess, and the five microscopy patterns) are the
  clear exception — both are visual/pattern-recognition content that a
  linear narration would flatten significantly, more so than Module 3's
  phase timeline, because these are meant to be *looked at and compared*,
  not just listed.
- **Approximate narration length:** Using the ~2,100-word total and a
  ~150 words/minute pace, full narration of all currently-visible text is
  approximately **14 minutes**. This does not include the checkpoint
  questions, and is an unmeasured, word-count-derived estimate.
- **Sections requiring visual-review cues:** The five-region grid (Section
  4.2) and the five microscopy protocol cards (Section 4.3) both require a
  visual-review cue at minimum — narrating five parallel "what you
  see"/"what it means" cards in sequence loses the side-by-side comparison
  that is the section's entire point. This is a stronger case for a
  structured cue than Module 3's phase timeline, since Module 4's
  five-category content is explicitly about *visually distinguishing*
  similar-looking presentations from each other.
- **Content that must remain video-only:** None currently — Module 4 has
  no video block of any kind (unlike Module 3's pre-audit placeholder), so
  there is nothing to assess as video-only material.
- **Whether any interaction or checkpoint prevents audio-only
  completion:** The two required checkpoints (`m4cp1`, `m4cp2`) require a
  typed or voice-dictated free-text response either way, consistent with
  every other module's checkpoint pattern — this alone does not block
  audio-only progress through the instructional content. However, full
  comprehension of both the five-region grid and the five-category pattern
  set depends on seeing (or, once real photos exist, seeing images of)
  the visual differences being described — an audio-only pass would need
  each card's distinguishing features narrated explicitly and clearly
  differentiated from its neighbors to be complete, a larger lift than a
  simple visual-review-cue pattern.

---

## 16. Confirmed implementation concerns

Flagged only — nothing here has been fixed.

### Confirmed

1. **The AI grading prompt does not see the exact question the student
   read**, for both checkpoints. `m4cp1`'s evaluated question drops the
   scenario framing ("sits down and shows you," "Before you reach for any
   products") and rewords "scalp situations" as "causes." `m4cp2`'s
   evaluated question drops "what looks like a cluster of," softening a
   hedge into a flat clinical statement, and drops "The client seems
   unbothered and just" and "Walk me through exactly." Same pattern
   already flagged and corrected for Modules 1, 2, and 3.
2. **No Module-4-specific checkpoint rubric exists.** `M4.system` is one
   shared function used identically for both `m4cp1` and `m4cp2`, with no
   itemized pass checklist, no immediate-correction list, and no
   explicit "do not fail for grammar/spelling" instruction — the same
   pre-audit starting state Modules 0, 1, 2, and 3 were all in.
3. **No custom checkpoint network-error message.** `submitM4CP` calls
   `submitCheckpoint(4, id, M4.system, M4.questions[id])` with no 5th
   `errorMessage` argument, so both checkpoints show the shared generic
   fallback text rather than a module-specific message.
4. **No accessibility labels on either checkpoint** — no `aria-label` on
   the voice or submit buttons, no `aria-live` on either `.cp-res`,
   matching the pre-audit state already found and corrected in Modules 0,
   1, 2, and 3.
5. **The Cadence guide system references content Module 4 does not
   currently teach.** `MODULE_GUIDE_SYSTEMS[4]` lists "dry scalp vs
   dandruff" as something the Module 4 student is learning, but the
   dry-vs-dandruff distinction is actually Module 6 content (`M6`'s
   questions and system prompt) — Module 4's own curriculum never uses the
   word "dandruff" anywhere in its current text.
6. **Old course name present.** `M4.system`
   (`headspa-mastery.html:6368`) still says "You are Cadence, instructor
   of HeadSpa Mastery." `MODULE_GUIDE_SYSTEMS[4]` frames Cadence as
   personally having "nearly two decades in the head spa industry,"
   matching the same personal-experience-claim pattern already corrected
   in Modules 2 and 3.
7. **Completion card has no distinct competency-naming line** — same
   pre-rewrite two-line pattern (title + single subtitle) that Modules 0,
   1, 2, and 3 all had before their audits.
8. **No ungraded practice interaction exists anywhere in Module 4** (see
   section 6), despite both the five-region grid and the five-category
   pattern set being structurally well-suited to a comparison,
   identification, or scenario-judgment interaction similar to prior
   modules' practice interactions.
9. **Two of the five microscopy category cards ("Congested" and "Oily /
   congested") overlap substantially** in stated observable features and
   share the word "congested" — see section 5 for the detailed comparison.
   This mirrors an independently flagged concern about the two
   correspondingly-named proposed image assets in `module-04-assets.md`.
10. **The five-region examination grid and the five-category taxonomy are
    never explicitly connected in the current text**, despite appearing to
    be designed to work together (see section 5's closing note).
11. **`exam-area-04-temporal-area.png` uses a different model/framing**
    than the other four proposed examination-area images — see section 3
    and `module-04-assets.md` for detail. This is a proposed-asset finding
    already recorded in the asset inventory, restated here because it
    becomes directly relevant if the five images are used together to
    illustrate this module's five-region grid.

### Assumptions (not independently verified in this pass)

- It's assumed the five proposed `microscopy/` images were produced
  specifically to fill Module 4's five existing protocol-card placeholders,
  based on the exact word-for-word match between each image's baked-in
  title/subtitle and the corresponding placeholder's label/sub-label (see
  section 3). This is a strong naming correlation, not a confirmed intent
  — no commit message, code comment, or other record in this repository
  states that intent explicitly.
- It's assumed the five proposed `examination-areas/` images were produced
  specifically to illustrate Module 4's "Regions to assess" five-card grid,
  based on the same exact-name-match pattern. Not independently confirmed
  beyond the naming correlation.
- The proposed images' anatomical, dermatological, and photographic
  accuracy (e.g., whether the "congested" vs. "oily/congested" microscopy
  images actually depict two visually distinguishable states, or whether
  the model/framing inconsistency in the examination-area set matters for
  the lesson) has not been evaluated in this pass — explicitly deferred to
  the Module 4 audit, consistent with `module-04-assets.md`.
- Whether a five-column CSS grid at `font-size:0.72rem` causes readability
  or overflow problems at common mobile widths was not tested in this
  pass — flagged in section 11, not verified.

---

## 17. Source map

| Section | Source file | Line range / marker | Related functions | Related state properties |
|---|---|---|---|---|
| Module identity constants | `headspa-mastery.html` | 5742 (`MODULE_CHECKPOINTS['4']`), 5774 (`MODULE_TITLES[4]`) | — | — |
| Module 4 wrapper (hero, all 6 sections, five-region grid, five protocol cards, five do-not-treat notes, both checkpoints, completion) | `headspa-mastery.html` | 3251–3607 (`#module4Wrap`) | `STATIC_MODULES[4]` (`:6646`) | — |
| Home screen module-list row 4 | `headspa-mastery.html` | 2306–2310 | `renderHomeProgress` | `progress['4']` |
| Five-region grid | `headspa-mastery.html` | 3298–3319 (`.scalp-type-grid`) | — (no JS) | — |
| Five microscopy protocol cards | `headspa-mastery.html` | 3330–3417 (`.protocol-card` × 5) | — (no JS) | — |
| Five do-not-treat clinical notes | `headspa-mastery.html` | 3440–3463 (`.clinical-note` × 5) | — (no JS) | — |
| Checkpoint 1 markup | `headspa-mastery.html` | 3509–3525 (`#m4cp1`) | `submitM4CP`, `m4cpKey` | `checkpointMeta.m4cp1` |
| Checkpoint 2 markup | `headspa-mastery.html` | 3576–3592 (`#m4cp2`) | `submitM4CP`, `m4cpKey` | `checkpointMeta.m4cp2` |
| Completion card markup | `headspa-mastery.html` | 3594–3604 (`#m4Complete`) | `resolveModuleCompletionUI`, `getVisibleCompletionCard` | `progress['4'].complete`, `.completedAt` |
| `M4` object (questions + grading system) | `headspa-mastery.html` | 6363–6369 | — | — |
| `submitM4CP` / `m4cpKey` | `headspa-mastery.html` | 6852–6857 | — | — |
| `MODULE_GUIDE_SYSTEMS[4]` | `headspa-mastery.html` | 6434 | `getGuideSystem` | — |
| `MODULE_QUICK_PROMPTS[4]` | `headspa-mastery.html` | 6449 | `updateGuideQuickPrompts` | — |
| `updateGuideQuickPrompts` | `headspa-mastery.html` | ~6739–6747 (shared, see `module-03-source.md` for exact range) | — | — |
| `getVisibleCompletionCard` (standard formula, no module-4 special case) | `headspa-mastery.html` | 5872–5875 | `resolveModuleCompletionUI` | — |
| Module-open Cadence greeting for module 4 | `headspa-mastery.html` | 6688 (inside `openModuleById`'s `greetings` map) | `openModuleById` | — |
| `MODULE_MEMORY_TAGS[4]` | `assets/js/headspa-state.js` | 136 | `getCheckpointMemoryTags`, `getModuleFocusTags` | `student.cadenceMemory` |
| Shared checkpoint machinery (`submitCheckpoint`, `evaluateCheckpointAnswer`, `normalizeCheckpointEvaluation`, `APP_STATE.setCheckpointResult`, etc.) | `headspa-mastery.html`, `assets/js/headspa-state.js` | See `module-00-source.md` §4, §8 for exact line numbers | — | — |
| `.scalp-type-grid` / `.protocol-card` / `.clinical-photo.placeholder` / `.clinical-note` / `.cadence-note` / `.info-card` / `.key-point` CSS (shared components) | `headspa-mastery.html` | See `module-03-source.md` §7 / §14 for prior documentation of these shared component classes | — | — |
| Proposed examination-area assets (not yet referenced) | `assets/images/course/module-04/examination-areas/*.png` (5 files) | — | — | — |
| Proposed microscopy assets (not yet referenced) | `assets/images/course/module-04/microscopy/*.png` (5 files) | — | — | — |
| Asset inventory | `docs/course-audit/modules/module-04-assets.md` | — | — | — |
