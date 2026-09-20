# Module 4 — Listen Mode Fidelity Coverage Audit (v6, strict-fidelity rebuild)

**Authority:** current live `headspa-mastery.html`, `#module4Wrap`, lines
6004–6685 (read in full, 2026-09-15), plus the checkpoint question text in
`const M4 = { questions: {...} }` (lines 10963–10969) and the classification
practice answer key `M4_CLASSIFY_ANSWERS` (lines 11961–11967). This audit
supersedes `module-04-listen-script.md` (v1) as the narration source of
record — that document is retained for history only, per the owner's
explicit instruction that the old narration is not authoritative and is
rejected.

**Why this rebuild happened:** the owner rejected the previous Module 4 RAW
narration. Reasons given: substantial instructional content was skipped,
narration was too loosely paraphrased, it drifted from what the student is
actually reading, and this is especially unacceptable in a scientific/
technical module. This audit exists to prove the replacement narration does
not repeat that drift, item by item, before any ElevenLabs credit is spent.

**Standard applied:** the same one used for the owner-approved Module 1
rebuild (`module-01-fidelity-coverage-audit.md`) — every substantive visible
teaching element (list, card, quote, numbered item, scope statement,
distinction) must be narrated closely enough that a listening-only student
receives the same information a reading student does. Numbers, counts, and
named items must not be compressed or approximated. Decorative/navigational
UI only may be excluded.

---

## Concrete drift found in the old (rejected v1) narration, corrected here

| # | Live element | Old narration (v1) | Live text now | Fix |
|---|---|---|---|---|
| 1 | Observation-discipline exercise (5 statements) | Old script named only two example statements ("things like X versus Y") and never revealed which of the 3 categories any statement belongs to, or why — the exercise's actual teaching resolution was dropped entirely | The page's `M4_CLASSIFY_ANSWERS` table gives a specific correct category + a specific feedback sentence for all 5 statements | M4-07 now states all 5 statements verbatim, each with its correct classification and its exact feedback reasoning |
| 2 | 4.6 Appearance examples — "Context needed" field (5 cards) | Systematically thinned: e.g. the baseline-appearing card's context field was dropped entirely; the oil-dominant card's 6-item context list ("time since washing, product use, sweating, recent heat, client sensation, and whether the same appearance exists in other regions") was compressed to "context like wash timing and product use" — 4 of 6 items silently dropped | Full 4-to-6-item context list, live and unchanged, for every one of the 5 cards | M4-10 names every context item individually for all 5 cards |
| 3 | 4.4 Five-point scan — "Technique cue" per station | Present for only 2 of 5 stations in abbreviated form (temporal's "check the opposite side"); frontal, top, crown, and occipital's technique cues ("separate hair gently...", "use the same part location...", "work with the natural swirl...", "position the hair securely...") were omitted | All 5 stations carry both a Purpose and a Technique cue in the live markup | M4-05 states Purpose and Technique cue individually for all 5 stations |
| 4 | 4.4 scan — AIMT pronunciation | Written as "A-I-M-T's baseline scan" (hyphenated form, which the locked normalization rule forbids) | N/A — pronunciation rule, not page content | M4-05 uses "A I M T's baseline scan," passes automated preflight |
| 5 | 4.3 Image integrity — step 5 ("hold the view") | Compressed into a subordinate clause inside the step-6 sentence, not given its own numbered beat | Live text gives "hold the view" its own `condition-card` (step 5 of 6), separate from "make comparisons honest" (step 6) | M4-04 narrates all 6 steps as 6 distinct numbered beats, matching the live 6-card layout |
| 6 | 4.6/"Similar image" section boundary | The 5.6-appearance-cards section and the photo-pair "similar image, different story" comparison were merged into one continuous paragraph, blurring where 4.6 ends and the comparison begins | Live page treats these as two separate visible blocks with their own `sec-eyebrow` headers | Rebuilt as two separate chunks (M4-10, M4-11), each announced on its own |

No wording was softened and no scope/safety language was changed in either
version — the drift found here is entirely coverage/compression drift, not
tone drift (unlike Module 1's drift, which included both).

---

## Full coverage map

| Live element | Content | Disposition | Chunk | Checkpoint |
|---|---|---|---|---|
| `.mod-opener` (eyebrow/title/tagline/desc) | Module identity | Narrated directly | M4-01 | — |
| `#m4WrittenBriefing`-equivalent "In this module" list (5 items) | Outcomes | All 5 named individually | M4-01 | — |
| `.mo-attention` | "Pay attention to" note | Narrated verbatim | M4-01 | — |
| 4.1 title + 3 body paragraphs | Role of magnification | Narrated closely, full | M4-02 | — |
| 4.1 key-point | "The image can sharpen the question..." | Narrated in full | M4-02 | — |
| 4.1 Cadence note | Full quote | Narrated verbatim | M4-02 | — |
| 4.2 title + body | Presenting the assessment | Narrated closely | M4-03 | — |
| 4.2 live-view script | Exact client-facing language | Verbatim, quoted | M4-03 | — |
| 4.2 image-capture consent script | Exact client-facing language | Verbatim, quoted | M4-03 | — |
| 4.2 privacy `info-card` | — | Narrated in full | M4-03 | — |
| 4.2 key-point (client-language rule) | — | Narrated in full | M4-03 | — |
| 4.3 title + body | Image integrity intro | Narrated closely | M4-04 | — |
| 4.3 six `condition-card`s | Start before treatment / ask what's on scalp / part cleanly / touch lightly / hold the view / make comparisons honest | All 6 named individually, real order, full body text | M4-04 | — |
| 4.3 sanitation `clinical-note` | — | Narrated verbatim | M4-04 | — |
| 4.3 key-point | "If the setup changes..." | Narrated in full | M4-04 | — |
| 4.4 title + body | Five-point scan intro | Narrated closely | M4-05 | — |
| 4.4 memory-line key-point | "Front. Top. Crown. Side. Back." | Narrated verbatim | M4-05 | — |
| 4.4 five stepper stations | Frontal hairline / Top parting / Crown-vertex / Temporal area / Occipital-back — each with Purpose + Technique cue | All 5 named individually with both fields, real order | M4-05 | — |
| 4.4 stepper-complete line | "A five-point scan creates the baseline..." | Narrated verbatim | M4-05 | — |
| 4.5 title + body | Five observation lenses intro | Narrated closely | M4-06 | — |
| 4.5 five lens `condition-card`s | Scalp surface / Follicular openings / Perifollicular area / Hair shafts / Distribution — each with "Look for" + "Document like this" (verbatim quote) + "Do not write"/"Limit" where present | All 5 named individually, full field detail, exact quoted documentation examples | M4-06 | — |
| 4.5 key-point | "Distribution is often more useful..." | Narrated in full | M4-06 | — |
| "Observation discipline" title + body | Classification-practice framing | Narrated closely | M4-07 | — |
| 5 classification statements + answer key | Exact quoted statements, correct category, exact feedback sentence (from `M4_CLASSIFY_ANSWERS`) | All 5 statements verbatim with resolution — practice/ungraded | M4-07 | — |
| Closing feedback line | "Strong assessment language is precise..." | Narrated verbatim | M4-07 | — |
| `#m4cp1` question (from `M4.questions.m4cp1`) | Exact checkpoint text | Verbatim, unparaphrased | M4-08 | **STOP — m4cp1** |
| (transition) | — | Light narration-UX only, no source content | M4-09 | resume after m4cp1 |
| 4.6 title + body + illustrative-examples `info-card` | Appearance-examples framing | Narrated closely, full | M4-10 | — |
| 4.6 five `protocol-card`s | Baseline-appearing / Oil-dominant / Fine-scale-dry / Visible color change / Surface residue — each with What is visible / Context needed / May change / Does not prove | All 5 named individually, **all 4 fields per card, no compression (fixes drift #2)** | M4-10 | — |
| "Similar image, different story" title + body | Photo-pair comparison framing | Narrated closely | M4-11 | — |
| 5-question comparison list | Wash timing / products at root / tightness-itching-burning-tenderness-oil return / localized-vs-diffuse / gentle-cleanse test | All 5 questions verbatim, real order | M4-11 | — |
| Closing key-point | "When two possible stories look similar..." | Narrated verbatim | M4-11 | — |
| 4.7 title + body | From image to decision intro | Narrated closely | M4-12 | — |
| 4.7 four decision `condition-card`s | Preserve / Modify conservatively / Avoid or pause an area / Stop and refer — each with full body + Action | All 4 named individually, full text, real order | M4-12 | — |
| 4.7 key-point | "The advanced decision is not always..." | Narrated in full | M4-12 | — |
| 4.8 title + body | When not to proceed intro | Narrated closely | M4-13 | — |
| 4.8 four `clinical-note` scenarios | Nonintact/draining / Marked pain / Concerning hair-loss pattern / Uncertainty outside scope — each with its Response | All 4 named individually, full text, real order | M4-13 | — |
| 4.8 referral script | Exact client-facing language | Verbatim, quoted | M4-13 | — |
| 4.8 device-contamination `kp-warn` | — | Narrated in full | M4-13 | — |
| 4.9 title + body | Practitioner insight intro | Narrated closely | M4-14 | — |
| 4.9 five `info-card`s | Pressure changes color / Dirty lens / Products imitate pathology / One image is not the scalp / Before-and-after matching | All 5 named individually, full text, real order | M4-14 | — |
| 4.9 key-point | "Microscopy does not become advanced..." | Narrated in full | M4-14 | — |
| 4.10 title + body | Common mistakes intro | Narrated closely | M4-15 | — |
| 4.10 six `protocol-card`s (mistakes + fixes) | Naming after one image / Pressing for clearer view / Turning material into cause / Saving without permission / Misleading before-and-after / Assessment that changes nothing | All 6 named individually with their Fix, real order | M4-15 | — |
| 4.10 key-point | "The microscope is not the skill..." | Narrated in full | M4-15 | — |
| `#m4cp2` question (from `M4.questions.m4cp2`) | Exact checkpoint text | Verbatim, unparaphrased | M4-16 | **STOP — m4cp2** |
| `#m4Complete` title/body/next | Completion + Module 5 preview | Narrated in full | M4-17 | resume after m4cp2 |

## Excluded as non-instructional UI (with reason)

- "Listen with Cadence — coming soon · Includes 2 checkpoint stops" footer — navigation/entry-point UI, not lesson content (same category Module 1 excluded).
- `.interaction-hint` ("Use the arrows or select an assessment point directly") — operating instruction for the on-screen stepper widget, not teaching content.
- The `m4station-btn-0..4` short button labels — navigation controls that duplicate the station names already narrated in full at M4-05.
- The repeated `cp-placeholder-label` caption "Illustrative magnified example — not a clinical diagnosis" stamped identically under all 5 appearance-example images — a static image caption reiterating the section-level disclaimer already narrated once in full at the start of M4-10; not distinct new teaching content per repetition.
- The temporal-station's photo-sourcing note ("This assessment point uses a separate location-guide photo, not the same client shown in the other four...") — a caption about the *photography asset itself* (production/consistency note for the image), not scalp-assessment teaching content.
- Checkpoint textarea placeholder strings (e.g. "Describe the two regions, explain the limit of one label, and ask for the missing context…") — input-field UI hints; the checkpoint's real question is narrated in full separately from `M4.questions`.
- `cc-headline` short labels ("Read the full scan", "Know when the image ends the service") — used as the framing lead-in to each checkpoint narration ("Here's your checkpoint — read the full scan") rather than narrated as separate standalone content.
- "Start Module 5 →" / "Back to course" buttons — navigation controls, not teaching content.
- All `View full-size image` links, `alt` text, `id`/`class`/`onclick` attributes, and inline `<script>` blocks — implementation detail, not visible to a student either way.

No substantive teaching block was found undocumented. Coverage: **100% of
substantive Module 4 content**, all 17 chunks, both checkpoints preserved at
their real gate positions (`m4cp1` after the observation-discipline exercise
and before 4.6; `m4cp2` after 4.10 and before module completion — matching
the live DOM order confirmed in this same read).

## Checkpoint relationship (unchanged from live page, not altered by this pass)

- `m4cp1` — mid-module, after "Observation discipline," before 4.6. Question,
  rubric, and grading system prompt (`M4.systems.m4cp1`) are untouched.
- `m4cp2` — end-of-module, after 4.10, before completion. Question, rubric,
  and grading system prompt (`M4.systems.m4cp2`) are untouched.

This pass changes narration only. No checkpoint ID, question text, rubric,
grading logic, or gating behavior was modified anywhere in this document or
in `headspa-mastery.html`.
