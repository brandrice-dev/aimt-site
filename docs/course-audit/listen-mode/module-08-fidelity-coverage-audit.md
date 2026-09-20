# Module 8 — Listen Mode Fidelity Coverage Audit (v2, strict-fidelity rebuild)

**Authority:** current live `headspa-mastery.html`, `#module8Wrap`, lines
8821–9271 (read in full), plus the masterclass chapter data `M8_CHAPTERS`
(lines 14194–14352, 9 chapters), `STEP_VIDEO_IDS` (lines 14173–14183), the
"Protect the Flow" interaction data `M8_PROTECT_ANSWERS` (lines 12883–12908),
and the checkpoint question text `M8.questions` (lines 11386–11390). This
audit supersedes `module-08-listen-script.md` (v1) as the narration source
of record — that document is retained for history only. v1 was written
against an earlier 12-chapter placeholder masterclass structure; the live
page has since been reconciled to the owner's final 9-real-video sequence
(confirmed by `M8_CHAPTERS`'s own header comment), so v1 is structurally
stale, not just editorially loose, and is not authoritative per the owner's
explicit instruction.

**Standard applied:** the same strict-fidelity standard used for the
owner-approved Modules 1/4/5/6/7 rebuilds, plus the Headline Rule (every
substantive heading gets an explicit disposition) and the mandatory
end-of-module last-third re-check (Sections F/G,
`00-listen-mode-editorial-standard.md`), both added after Module 6's review.

---

## Module 8's distinctive structure — read this before the coverage map

Module 8 is a masterclass, not a flat lesson: after the module opener and
three framing sections (phases / Core+Extended / the service map + timing
system), the bulk of the module is **9 chapters** (`M8_CHAPTERS`), one per
real installed video, each with the same seven-part internal structure,
rendered by `m8RenderChapter()` in this exact order:

1. **How to do it** (`guidance`, always present)
2. **Why we do it** (`why`, always present)
3. **How to communicate it** (`teach` — labeled "Communication cue" /
   "Keep the flow quiet" / "If they ask" entries, always present)
4. **Adapt** (`adapt` — conditionally rendered, only when non-empty; 3 of 9
   chapters have it)
5. **Notes** (`notes` — conditionally rendered, only when non-empty; 4 of 9
   chapters have it)
6. **Watch for in the demonstration:** (`watchFor`, always present — a
   viewing lens for the video that follows)
7. **VIDEO** (real installed Vimeo player — explicitly NOT narrated, per
   the owner's instruction; a screen cue only)

...followed by a one-line "Next: [continuity]" takeaway and chapter
navigation (not narrated — UI chrome). This is the "teach-first
architecture" the live page's own inline comment documents (line 8971): the
video is each chapter's demonstration/capstone, not its opener.

Each of the 9 chapters gets its own narration chunk below, following this
same internal order every time, so a listening student receives identical
structure to what a reading student sees, chapter by chapter.

---

## Full coverage map

| Live element | Content | Disposition | Chunk | Checkpoint |
|---|---|---|---|---|
| `.mod-opener` (eyebrow/title/tagline/desc) | Module identity | Narrated directly | M8-01 | — |
| "In this module" list (5 items) | Outcomes | All 5 named individually | M8-01 | — |
| `.mo-attention` | "Pay attention to" note | Narrated verbatim | M8-01 | — |
| "Think in phases, not steps" title + body | Steps vs. phases framing | Narrated closely | M8-02 | — |
| "Seven phases, at a glance" (7 `concept-card`s) | Entry & Regulation / Immersion / Treatment Work / Expansion / Reset & Cleanse / Signature Moments / Exit — each with sub-label + definition | All 7 named individually, in order, term + sub-label + full definition, none compressed | M8-02 | — |
| 8.1 title + body | Core/Extended as protocols, not just durations | Narrated closely, full | M8-03 | — |
| 2 `format-card`s (Core / Extended) | Format name, duration, all bullets each | Both named individually, every bullet point preserved (4 bullets Core, 4 bullets Extended) | M8-03 | — |
| info-card "Designed around the service, not the clock" | Core/Extended philosophy | Narrated in full | M8-03 | — |
| 8.2 title + body | Masterclass framing | Narrated closely | M8-04 | — |
| `m8-principle` ("Explain intentionally, not continuously," 2 paragraphs) | The Communication cue / Keep the flow quiet / If they ask labeling system, and where adaptations are actually decided (intake, not mid-service) | Narrated in full — this defines a labeling convention reused in every one of the 9 chapters, so it is not compressed | M8-04 | — |
| info-card "Reading the pacing markers" | Timing-pill system, pre-timer Steps 01–02, timer purpose | Narrated in full | M8-04 | — |
| **Chapter 01 — Opening Rituals + Microscopy** | guidance (4 ¶) / why (1 ¶) / teach (3 cues) / notes (1) / watchFor | All fields present narrated in full and in the fixed 7-part order; video screen-cued, not narrated | M8-05 | — |
| **Chapter 02 — Client Positioning + Comfort** | guidance (1 ¶) / why (1 ¶) / teach (2 cues) / watchFor | Narrated in full; chapter has no adapt/notes content — none invented | M8-06 | — |
| **Chapter 03 — Dry Brushing and Hair Play** | guidance (1 ¶) / why (1 ¶) / teach (1 quiet entry + if-asked) / watchFor | Narrated in full, quiet-step framing preserved (labeled "Keep the flow quiet," not silently dropped) | M8-06 | — |
| **Chapter 04 — Halo Activation + Wet Massage** | guidance (1 ¶) / why (1 ¶) / teach (1 cue + 1 quiet) / notes (1) / watchFor | Narrated in full | M8-07 | — |
| **Chapter 05 — Exfoliant + Scalp Massage** | guidance (4 ¶) / why (1 ¶) / teach (3 entries) / notes (1) / adapt (2) / watchFor | All 4 guidance ¶, both adapt items, notes, and all 3 teach entries narrated individually — this is the chapter `m8cp1` directly evaluates, so nothing here is thinned | M8-08 | — |
| **Chapter 06 — Neck and Shoulder Massage** | guidance (2 ¶, incl. scope caution) / why (1 ¶) / teach (2 cues) / watchFor | Narrated in full; scope/licensing caution preserved verbatim, not softened | M8-09 | — |
| **Chapter 07 — Shampoo + Rinse** | guidance (1 ¶) / why (1 ¶) / teach (1 quiet + if-asked) / watchFor | Narrated in full | M8-09 | — |
| **Chapter 08 — Deep Conditioning / Hand + Arm Massage** | guidance (4 items incl. scope caution) / why (1 ¶) / teach (2 cues) / notes (1) / watchFor | All 4 guidance items narrated individually (Core vs. Extended distinction, processing directions, hand/forearm technique, scope caution) | M8-10 | — |
| **Chapter 09 — Final Rinse + Halo Massage** | guidance (6 ¶) / why (2 ¶) / teach (5 entries) / adapt (1) / notes (1) / watchFor | Longest chapter — all 6 guidance ¶, both why ¶, all 5 teach entries, the adapt item, and the note narrated individually, none compressed; this is the module's true final-third content, audited twice (see last-third check below) | M8-11 / M8-12 (split across two generation chunks for length only — no content boundary crossed; see batching) | — |
| info-card "Printable Head Spa Service Maps" | Download-link framing | Screen cue only, non-instructional (a file-download action, no teaching content to narrate) | excluded | — |
| 8.3 title + body | Flow/pressure/transition framing | Narrated closely | M8-13 | — |
| 4 `info-card`s (Flow control / Pressure consistency / Temperature control / Transitions) | Definitions + fixes | All 4 named individually, full body text, real order | M8-13 | — |
| key-point "Pressure test your service" | Self-check questions | Narrated verbatim | M8-13 | — |
| "Protect the Flow" intro | Signature interaction framing, explicitly ungraded | Narrated closely | M8-14 | — |
| 3 scenarios, full setup text | Fragrance mid-service / exfoliation intensity / processing-time crunch | All 3 verbatim, real order | M8-14 | — |
| 3 scenarios × 3 options + feedback (`M8_PROTECT_ANSWERS`) | Every option's text + its feedback sentence | All 9 option/feedback pairs narrated (same "narrate every option, not just correct" precedent as Modules 5/6 signature interactions, since incorrect-choice feedback carries real teaching reasoning) | M8-14 | — |
| key-point "The protocol gives structure. Judgment keeps it appropriate." | Closing line | Narrated verbatim | M8-14 | — |
| `#m8cp1` question (from `M8.questions.m8cp1`) | Exact checkpoint text | Verbatim, unparaphrased | M8-15 | **STOP — m8cp1** |
| (transition) | — | Light narration-UX only, no source content | M8-16 | resume after m8cp1 |
| "Take the Service Into Practice" title + body | AIMT Service Timer framing | Narrated closely | M8-16 | — |
| `m8-timer-feature` intro/body ("Included with your certification" badge context, what the embedded preview is) | What the Timer is, what the Steps 01–04 preview shows | Narrated closely | M8-16 | — |
| "How to read the Timer" (4-item grid) | Service remaining / Ring & clock / Phase / Up next | All 4 named individually, term + definition | M8-16 | — |
| `m8tf-footer` text | What the full Timer covers | Narrated closely | M8-16 | — |
| Live Timer preview widget itself (countdown, ring, Pause/Resume/Back/Skip controls) | Interactive rehearsal tool | Screen cue only — genuinely interactive, time-based UI; narrating a countdown or button state would be meaningless/inaccurate on audio, per the same non-instructional-interactive-chrome exclusion used for prior modules' widgets | excluded | — |
| `#m8cp2` question (from `M8.questions.m8cp2`) | Exact checkpoint text | Verbatim, unparaphrased | M8-17 | **STOP — m8cp2** |
| `#m8Complete` title/body/next | Completion + Module 9 preview | Narrated in full | M8-18 | resume after m8cp2 |

## Headline Rule — explicit accounting of every heading

Every `sec-eyebrow`/`sms-section-label`/`ic-title`/chapter-title-equivalent
heading in `#module8Wrap` is accounted for above with an explicit
disposition (A = spoken directly, or C = excluded with a stated reason).
None were folded silently into a following sentence (no B dispositions were
needed in this module — every heading got its own announced beat). Full
list, confirmed against the live DOM: "Think in phases, not steps"; the 7
phase-card terms; "8.1 — Core and Extended"; "Designed around the service,
not the clock"; "8.2 — The service map"; "Explain intentionally, not
continuously"; "Reading the pacing markers"; all 9 chapter titles and their
internal "How to do it" / "Why we do it" / "How to communicate it" /
"Adapt" / "Notes" / "Watch for in the demonstration:" sub-labels;
"Printable Head Spa Service Maps" (excluded, reason stated); "8.3 — Flow,
pressure & transitions"; the 4 flow/pressure/temperature/transition card
titles; "Protect the Flow"; "Take the Service Into Practice"; "AIMT Service
Timer"; "How to read the Timer"; both checkpoint headlines
("Adaptation check" / "Client question").

## Excluded as non-instructional UI (with reason)

- "Listen with Cadence — coming soon · Includes 2 checkpoint stops" footer — navigation/entry-point UI, same category excluded in every prior module.
- "↓ Select the format you're studying today" interaction hint — UI instruction for a toggle, not teaching content; the actual Core/Extended substance it toggles is fully narrated at M8-03 regardless of which format is visually emphasized.
- Format-card "Selected" toggle state / `aria-pressed` — implementation detail.
- "Printable Head Spa Service Maps" download card — a file-download action, no teaching content.
- The 9 real installed Vimeo videos themselves — explicitly excluded per direct owner instruction ("do not narrate over the service videos"); each is screen-cued via its chapter's "Watch for" line instead, exactly as the live page's own teach-first architecture already treats it (video = demonstration, not narrated lecture).
- Chapter navigation ("← Previous chapter" / "Next chapter →"), the chapters drawer toggle, and per-chapter Completed/Current/Available/Locked list states — navigation/progress chrome.
- The Service Timer's live interactive preview (countdown clock, progress ring, Pause/Resume/Back/Skip, "Restart preview" / "Open the Full Service Timer" links) — genuinely interactive, real-time UI; the explanatory prose describing what the Timer is and how to read it is narrated in full at M8-16, only the live countdown/button widget itself is excluded.
- `data-choice`/`aria-pressed`/`bq-tag` styling chrome on the Protect-the-Flow options — interactive-UI mechanics; the substantive option text and feedback reasoning they gate is narrated in full at M8-14.
- "Reset this scenario" buttons — navigation control, not teaching content.
- `View full-size image` / download links, `alt` text, `id`/`class`/`onclick` attributes, inline `<script>` — implementation detail.
- "Start Module 9 →" / "Back to course" buttons — navigation controls.

No substantive teaching block was found undocumented. Coverage: **100% of
substantive Module 8 content**, all 18 chunks (Chapter 9 split across two
generation chunks for length only), both checkpoints preserved at their
real gate positions, video content correctly excluded per direct
instruction while every chapter's surrounding teaching is fully narrated.

## Checkpoint relationship (unchanged from live page, not altered by this pass)

- `m8cp1` — midpoint, immediately after the "Protect the Flow" interaction and its closing key-point, before the AIMT Service Timer section. Question, rubric, and grading system prompt (`M8.systems.m8cp1`) are untouched.
- `m8cp2` — after the Service Timer section, before the completion card. Question, rubric, and grading system prompt (`M8.systems.m8cp2`) are untouched. Per the live page's own inline comment (line 9133), the Timer's position between `m8cp1` and `m8cp2` is intentional and was already corrected on the live page in an earlier pass — this narration preserves that order exactly, does not move anything.

This pass changes narration only. No checkpoint ID, question text, rubric,
grading logic, or gating behavior was modified anywhere in this document or
in `headspa-mastery.html`.

---

## END-OF-MODULE FIDELITY CHECK

Mandatory dedicated second pass over the module's final third (Section G,
`00-listen-mode-editorial-standard.md`), performed independently of the
full coverage-map pass above, comparing the live page's final third against
the drafted narration's final third line by line before generation:

**Scope of "final third" for Module 8:** Chapter 09 (the longest, most
detail-dense chapter in the module) through the completion card — i.e.
M8-11/M8-12 through M8-18.

- **No headline skipped:** confirmed "Adapt," "Notes," and "Watch for in
  the demonstration:" all present and announced for Chapter 09 exactly as
  for every earlier chapter — no late-module shortcut taken.
- **No card/list item skipped:** Chapter 09's 6 guidance paragraphs, 2 why
  paragraphs, and 5 teach entries were each checked individually against
  the live `M8_CHAPTERS[8]` object — all present, none merged or dropped.
  Verified specifically against the pattern that caused Module 6's
  drift (a last-item-in-a-sequence drop): the *final* guidance paragraph
  ("When they return, greet them with a glass of ice water and revisit the
  microscope...") and the *final* teach entry (the treatment-close
  communication cue) are both present and narrated — neither trails off
  or gets summarized instead of stated.
- **No stronger paraphrasing than earlier sections:** Chapter 09's teach
  entries are reproduced at the same near-verbatim fidelity as Chapter 01's
  (the module's first, most carefully-drafted chapter) — spot-checked
  both side by side to confirm the back half of the script isn't
  looser than the front half.
- **Completion language matches the live page exactly:** `#m8Complete`'s
  body text and Module 9 preview text are narrated as written, not
  reworded or shortened.
- **Checkpoint placement is exact:** `m8cp2` narrated immediately after the
  Service Timer section and before the completion card, matching live DOM
  order; not moved earlier for narrative convenience.
- **No invented forward-reference:** the completion card's own "Up next —
  Module 9" text is used as-is; nothing about Module 9 was added beyond
  what the live card already states.
- **No vague synthesis replacing visible teaching:** Chapter 09's close and
  the completion card are narrated as the specific, concrete instructions
  and observations the live page contains — not compressed into a generic
  "and that's the service" summary.

**Result: PASS.**
