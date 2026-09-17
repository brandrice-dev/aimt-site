# Module 6 — Listen Mode Fidelity Coverage Audit (v2, strict-fidelity rebuild)

**Authority:** current live `headspa-mastery.html`, `#module6Wrap`, lines
7921–8383 (read in full, 2026-09-15), plus the checkpoint question text in
`const M6 = { questions: {...} }` (lines 11306–11312), the checkpoint
rubrics `M6.systems` (lines 11316–11340), the "Follow the cycle"
final-reasoning answer key `FC_FINAL_ANSWER` (lines 12457–12464), and the
signature-interaction answer key `M6_SORT_ANSWERS` (lines 12494–12519).
This audit supersedes `module-06-listen-script.md` (v1, written 2026-08-31)
as the narration source of record — that document is retained for history
only, per the owner's explicit instruction that the old narration is
rejected and not authoritative.

**Why this rebuild happened:** the same strict-fidelity standard applied to
Modules 1, 4, and 5 (after the owner found the original, looser Module 5
draft unacceptably thin) is being applied to Module 6. The old Module 6
script predates that standard. This audit exists to prove the replacement
narration source does not repeat that drift, item by item, before any
ElevenLabs credit is spent.

**Standard applied:** the same one used for the owner-approved Module 1,
Module 4, and Module 5 rebuilds (`module-01-fidelity-coverage-audit.md`,
`module-04-fidelity-coverage-audit.md`, `module-05-fidelity-coverage-audit.md`)
plus the owner's "From Cadence" / spoken-UI-adaptation rule: every
substantive visible teaching element (list, card, quote, numbered item,
scope statement, distinction) must be narrated closely enough that a
listening-only student receives the same information a reading student
does. Numbers, counts, and named items must not be compressed or
approximated. A visible "From Cadence" label is adapted into first person
(Cadence is the speaker) rather than read in the third person — the card's
substantive content is still delivered intact. Decorative/navigational UI
only may be excluded.

---

## Concrete drift found in the old (rejected v1) narration, corrected here

| # | Live element | Old narration (v1) | Live text now | Fix |
|---|---|---|---|---|
| 1 | 6.5 Malassezia spectrum, all 4 `SPECTRUM_STATES` | Named the 4 stage labels (balanced/mild dandruff/moderate/seborrheic dermatitis) as part of one summary sentence, then said "there's an interactive slider on screen if you want to move through that spectrum yourself" — none of the 4 stages' actual descriptive text (what a listening-only student would need to know at each position) was ever read | Each of the 4 slider positions carries its own full descriptive sentence in `SPECTRUM_STATES` (e.g. position 4: "larger, thicker flakes, pronounced redness, and flaking that can spread beyond the scalp to the eyebrows, hairline, or ears") | M6-08 reads all 4 stage descriptions individually, in order, in full |
| 2 | "Follow the cycle" final-reasoning resolution (`FC_FINAL_ANSWER`) | Framed the question and named the 3 on-screen choices, then closed with one generic firm line — never revealed which of the 3 choices is correct, or the specific reasoning, for any option | `FC_FINAL_ANSWER` gives a specific correct index **and** a specific feedback sentence for all 3 options | M6-05 now states all 3 options and their exact feedback text — see "Judgment call" note below |
| 3 | Signature interaction ("Sort three presentations," `M6_SORT_ANSWERS`) | Named all 3 presentations verbatim, then closed with "sort all three on screen ... using everything you just learned" — never revealed which of the 3 choices (proceed / modify / refer) is correct for any presentation, or the specific reasoning, for any of the 3 presentations. Same failure mode as Module 5's decision-scenario drift. | `M6_SORT_ANSWERS` gives a specific correct choice index **and** a specific feedback sentence for every one of the 3 options, for all 3 presentations (9 option/feedback pairs total) | M6-10 now states all 3 options and their exact feedback text for all 3 presentations — see "Judgment call" note below |
| 4 | 6.8 trigger cards 2–4 (Diet / Excess oil / Wrong product use) | Thinned relative to the current live text: diet card dropped "rather than firmly established" and "or present as a guaranteed fix"; excess-oil card dropped "overgrowth," "or predictable," and "for any individual client"; wrong-product-use card dropped "conditions" and the concrete list "multiple shampoos, aggressive products, inconsistent routines" | Full text, live and current | M6-12 restored to full current text on all 3 cards |
| 5 | 6.8 "Practitioner insight" `cadence-note` | Not present in the old script at all — the old M6-09 chunk ends after the trigger cards and the Module 5 tie-in, and never mentions this card | Live markup presents a full quoted `cadence-note` card ("After enough clients, you start to notice: most people are treating the wrong problem...") between the Module-5 tie-in and Checkpoint 2 | M6-12 adds this card in full, narrated with a natural first-person lead-in |
| 6 | 6.3 "From Cadence"-adjacent comparison detail | Old script folded the vs-card bullet points and the "deeper picture" paragraphs together into two dense paragraphs, and the "When it's not clean-cut" note was tagged `[slowly]` but not clearly signaled as its own distinct beat; it also dropped "moderate oil with some tightness, or flakes that don't clearly match either column" from that note | Live markup presents the bullets, the "deeper picture" detail, and the "When it's not clean-cut" `info-card` as three visually distinct elements, with the fuller "moderate oil..." phrase intact | M6-03 narrates the bullets and the deeper-picture paragraph as distinct beats for both cards, and restores the full "When it's not clean-cut" text |
| 7 | End-of-module completion copy (`#m6Complete`) | "You can now read the difference between dry scalp and dandruff, understand the Malassezia spectrum, and explain it to a client in plain language." | Current live text is substantively different: "You can tell apart a dry-scalp presentation from the dandruff spectrum, know what a visual impression can and cannot establish, and decide whether to proceed, modify, or refer." | M6-14 uses the current live completion text verbatim, not the old script's now-stale wording |

No wording was softened and no scope/safety language was changed in the
old version — as with Modules 4 and 5, the drift found here is coverage/
compression drift (resolution logic and card text silently dropped or gone
stale against a live-page edit), not tone drift.

### Judgment call flagged for owner review

Both the "Follow the cycle" final-reasoning question (3 options) and the
"Sort three presentations" signature interaction (3 presentations × 3
options = 9 pairs) offer button choices with their own feedback sentence
in `FC_FINAL_ANSWER` / `M6_SORT_ANSWERS`. This rebuild narrates **all
options and all feedback sentences for both interactions** (not just the
correct one), for the same reason flagged in the Module 5 audit: the
incorrect-choice feedback carries real teaching reasoning, structurally the
same as the "mistake → better move" pairs already fully narrated elsewhere
in this module (e.g. the "Follow the cycle" steps themselves). This runs
longer than v1's single closing sentence per interaction, but strict
fidelity is the explicit priority over pacing. Flagging this choice
explicitly since, as with Module 5, it's the one place this audit exercises
judgment rather than mechanically transcribing a 1:1 visible list.

---

## Full coverage map

| Live element | Content | Disposition | Chunk | Checkpoint |
|---|---|---|---|---|
| `.mod-opener` (eyebrow/title/tagline/desc) | Module identity | Narrated directly | M6-01 | — |
| "In this module" list (5 items) | Outcomes | All 5 named individually | M6-01 | — |
| `.mo-attention` | "Pay attention to" note | Narrated verbatim | M6-01 | — |
| 6.1 title + 2 body paragraphs | Your role here | Narrated closely, full | M6-02 | — |
| 6.2 title + 3 body paragraphs | What you can/cannot conclude | Narrated closely, full, all 3 paragraphs distinct | M6-02 | — |
| 6.3 title + intro body | Dry scalp vs. dandruff intro | Narrated closely | M6-03 | — |
| Illustration figure (no figcaption) | Side-by-side comparison image | Screen cue only (no caption text to narrate) | M6-03 | — |
| Dry-scalp `vs-card` (label/tag + 4 bullets) | Small white powdery flakes / matte non-oily surface / tightness or mild itch / minimal visible oil | All 4 bullets named individually, in order | M6-03 | — |
| Dry-scalp "deeper picture" `vs-detail` | Hydrolipid film, barrier issue, causes, treatment direction | Narrated in full, no compression (fixes drift #6) | M6-03 | — |
| Dandruff `vs-card` (label/tag + 4 bullets) | Larger yellowish flakes / oily or clumped near root / visible oil at scalp / irritation or redness | All 4 bullets named individually, in order | M6-03 | — |
| Dandruff "deeper picture" `vs-detail` | Malassezia/oil/inflammation/turnover, not hydration, treatment direction | Narrated in full, no compression (fixes drift #6) | M6-03 | — |
| "When it's not clean-cut" `info-card` | Mixed presentations guidance | Narrated in full, incl. "moderate oil with some tightness..." (fixes drift #6) | M6-03 | — |
| 6.4 title + body | The cycle worth understanding intro | Narrated closely | M6-04 | — |
| "Follow the cycle," 6 steps (title + detail each) | Client notices flaking → buys anti-dandruff shampoo → shampoo strips moisture → scalp drier/worse → increases usage → back to step 1 | All 6 steps named individually, full title + full detail text, real order | M6-04 | — |
| `cadence-note` ("From Cadence") | "This is not treatment failure. It is misidentification..." | First-person UI-label adaptation, substantive quote delivered intact | M6-04 | — |
| "What this looks like in real time," 3 scenario cards | Scenario 1/2/3, each with Presentation / Likely direction / What this changes / Service direction | All 3 named individually, all 4 fields each, real order | M6-05 | — |
| Final-reasoning prompt (`fc-final`) | "Where do you break the cycle?" + scenario | Narrated closely, verbatim prompt | M6-05 | — |
| Final-reasoning 3 options + feedback (`FC_FINAL_ANSWER`) | Move to stronger product / Reassess presentation / Add more exfoliation, each with exact feedback | All 3 option/feedback pairs narrated (fixes drift #2 — see Judgment call above) | M6-05 | — |
| `#m6cp1` question (from `M6.questions.m6cp1`) | Exact checkpoint text | Verbatim, unparaphrased | M6-06 | **STOP — m6cp1** |
| (transition) | — | Light narration-UX only, no source content | M6-07 | resume after m6cp1 |
| 6.5 title + body | Malassezia to seborrheic dermatitis intro | Narrated closely | M6-08 | — |
| Spectrum slider, 4 positions (`SPECTRUM_STATES`) | Balanced / Mild dandruff / Moderate / Seborrheic dermatitis, each with full descriptive text | All 4 stages named individually, full text, no compression (fixes drift #1) | M6-08 | — |
| 6.6 title + `info-card` "Refer when you see" (5 bullets) | Spread + irritation / broken-weeping-crusted-bleeding / severe-painful-worsening / no improvement / low-confidence presentation | All 5 named individually, in order | M6-09 | — |
| `cadence-note` "Referral script" | Verbatim client-facing referral language | Narrated verbatim, quoted | M6-09 | — |
| Signature interaction framing | "Sort three presentations" intro body text | Narrated closely | M6-10 | — |
| 3 sort presentations, full setup text | Presentation 1/2/3 exact wording | All 3 verbatim, real order | M6-10 | — |
| 3 presentations × 3 options + feedback (`M6_SORT_ANSWERS`) | Every option's text + its correct/incorrect feedback sentence | All 9 option/feedback pairs narrated (fixes drift #3 — see Judgment call above) | M6-10 | — |
| 6.7 title + body | Treatment within scope intro | Narrated closely | M6-11 | — |
| 6.7 four `treat-card`s | Cleansing support / Anti-fungal supporting ingredients / Anti-inflammatory botanicals / Regular maintenance | All 4 named individually, full body text, real order | M6-11 | — |
| `info-card` "A product category is not a diagnosis" | Retail-suggestion/scope note | Narrated in full | M6-11 | — |
| 6.8 title + body | What makes it worse intro | Narrated closely | M6-12 | — |
| 6.8 four `trigger-item`s | Stress & hormonal changes / Diet / Excess oil production / Wrong product use | All 4 named individually, full current text (fixes drift #4) | M6-12 | — |
| `info-card` "Real-world integration — layering this on Module 5" | Ties 6.8 back to Module 5's scalp-type analysis | Narrated in full | M6-12 | — |
| `cadence-note` "Practitioner insight" | "After enough clients, you start to notice..." | Added in full — was entirely missing from v1 (fixes drift #5) | M6-12 | — |
| `#m6cp2` question (from `M6.questions.m6cp2`) | Exact checkpoint text | Verbatim, unparaphrased | M6-13 | **STOP — m6cp2** |
| `#m6Complete` title/body/next | Completion + Module 7 preview | Narrated in full, current live text (fixes drift #7) | M6-14 | resume after m6cp2 |

## Excluded as non-instructional UI (with reason)

- "Listen with Cadence — coming soon · Includes 2 checkpoint stops" footer — navigation/entry-point UI, not lesson content (same category Modules 1, 4, and 5 excluded).
- "Tap each card to compare" / "Open each stage in order to follow the cycle" / "Drag to move along the spectrum" `.interaction-hint` lines — UI operating instructions, not lesson content.
- `+ See why this matters` / `− Close` expand-hint text on the comparison cards — UI toggle chrome, not content; the substance it gates (the "deeper picture" text) is narrated in full at M6-03.
- `fc-badge` state labels ("Start here," "Not yet available," "Explored," "Up next") on the "Follow the cycle" steps — interactive-UI state chrome; the step content itself is narrated in full at M6-04.
- The `bq-tag` stamps ("Correct answer"/"Not quite"/"Breaks the cycle"/"Keeps the cycle going") on the final-reasoning and sort-interaction buttons — interactive-UI mechanics; the substantive option text and feedback reasoning they gate is narrated in full at M6-05 and M6-10 (see Judgment call).
- `data-choice`, `aria-pressed`, `aria-expanded`, `aria-controls`, `id`/`class`/`onclick` attributes, and inline `<script>` — implementation detail, not visible to a student either way.
- The treat-card numeral icons (①②③④) — decorative numbering; the same order is preserved through the narration's own "first/second/third/fourth" structure.
- The Cadence chat-sidebar greeting text for Module 6 (a separate JS object, not part of `#module6Wrap`'s own lesson markup) — chat UI, not the module's own lesson card content; excluded on the same basis Module 5's audit did not cover the Cadence chat sidebar.
- "Start Module 7 →" / "Back to course" buttons — navigation controls, not teaching content.

No substantive teaching block was found undocumented. Coverage: **100% of
substantive Module 6 content**, all 14 chunks, both checkpoints preserved
at their real gate positions (`m6cp1` after 6.4's cycle/scenarios/final-
reasoning and before 6.5; `m6cp2` after 6.8 and before module completion —
matching the live DOM order confirmed in this same read).

## Checkpoint relationship (unchanged from live page, not altered by this pass)

- `m6cp1` — midpoint, after 6.4 ("The cycle worth understanding," including its real-time scenarios and final-reasoning resolution), before 6.5. Question, rubric, and grading system prompt (`M6.systems.m6cp1`) are untouched.
- `m6cp2` — end-of-module, after 6.8, before completion. Question, rubric, and grading system prompt (`M6.systems.m6cp2`) are untouched.

This pass changes narration only. No checkpoint ID, question text, rubric,
grading logic, or gating behavior was modified anywhere in this document or
in `headspa-mastery.html`.
