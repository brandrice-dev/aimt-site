# Module 10 — Listen Mode Fidelity Coverage Audit (v2, strict-fidelity rebuild)

**Authority:** current live `headspa-mastery.html`, `#module10Wrap`, lines
9358–9658 (read fresh and in full, 2026-09-18 — not assumed from any
prior extraction), plus the checkpoint question text in
`const M9 = { questions: {...} }` at lines 11504–11505 (re-verified fresh
this pass), the checkpoint rubrics (`M9.systems`) at lines 11508–11530,
the "Reset Under Pressure" answer/feedback key `M10_RUP_ANSWER` at lines
13036–13045 (re-verified fresh this pass), and the checkpoint-naming code
comment at lines 12748–12753. This audit supersedes
`module-10-listen-script.md` v1 (**REJECTED** — archived at
`docs/course-audit/listen-mode/archive-loose-v1/module-10-listen-script-v1-REJECTED.md`).
Nothing was deleted.

**Why v1 was rejected:** not a text-quality problem — v1's prose was
reasonably faithful to the source content on a first read. It was
rejected for three structural defects the current editorial standard
names explicitly, plus a smaller set of unspoken-label gaps found on
direct re-read:

1. **"Answer above" (Section F).** Both v1 checkpoint closings say "Take
   your time, and answer above." The response field sits below the
   prompt in the live player, never above it — confirmed independently by
   `00-listen-mode-editorial-standard.md` Section H, which lists Module
   10 among the modules already found shipped with this exact defect.
2. **Interaction answer-spoiling (Section I.2).** v1's `M10-04` chunk
   narrates the "Reset Under Pressure" prompt and all five options, then
   continues — in the same unbroken chunk, no gate — into "What actually
   works: let the required contact time finish undisturbed... What
   doesn't: wiping the item dry early... skipping the remaining contact
   time... grabbing an unprocessed backup... starting the service [early]
   and finishing the process afterward." This names the strongest option
   and characterizes every other option as wrong, before an audio-only
   student could have selected anything. This is precisely the defect
   pattern Section I.2 was added to forbid, generalized from the exact
   incident it names in the "Close Without Pressure" interaction
   (Module 9) and the `m8Protect` interaction (Module 8).
3. **Both checkpoints narrated together before student action (Section
   I.1).** v1's `M10-06` chunk speaks checkpoint 1's full prompt
   ("Here's your first checkpoint...") and, in the same chunk with no
   `checkpoint-stop` gate in between, immediately continues into
   checkpoint 2's full prompt ("And here's your second, final
   checkpoint..."). A student who has not yet answered checkpoint 1 hears
   checkpoint 2 read to them regardless.
4. **Unspoken teaching architecture** (the same failure mode the Module 9
   v3→v4 pass found and fixed): the module's own title ("Sanitation &
   Reset Systems") and tagline ("Build a sanitation system that holds up
   all day.") were never spoken — v1 opened with "Welcome to Module 10"
   and skipped straight to the desc paragraph. Four `kp-eyebrow`/`ic-title`
   labels were spoken as plain prose with their own label never announced:
   "Governing sources," "Practitioner note," "Caution," and "Possible log
   fields." All are fixed in v2 — see the script's per-chunk "FIXES v1"
   notes for exactly what changed.

**Standard applied:** the Module 4/5/6 controlling precedent
(`module-04-fidelity-coverage-audit.md`, `module-05-fidelity-coverage-audit.md`,
`module-06-fidelity-coverage-audit.md`), the same standard just re-applied
to Module 9 (v4). Every substantive visible teaching element (list, card,
quote, numbered item, scope statement, label) must be narrated closely
enough that a listening-only student receives the same information a
reading student does. Numbers, counts, and named items are not compressed
or approximated. Only true UI chrome is excluded (see the exclusion list
below).

---

## Headline inventory

Every substantive visible heading/label/eyebrow in `#module10Wrap`, in
live DOM order. "Spoken treatment" values: **exact** (read as visible
text), **close** (natural spoken adaptation, same substantive content),
**folded** (the label is worked into a framing sentence rather than
announced as its own beat, matching the Module 9 `cc-headline`
precedent).

| # | Exact visible text | DOM location | Type | Chunk | Spoken treatment |
|---|---|---|---|---|---|
| 1 | "Module 10" | `.mo-eyebrow`, L9362 | Module identity | M10-01 | close ("Module 10") |
| 2 | "Sanitation & Reset Systems" | `.mo-title`, L9363 | Module identity | M10-01 | exact (v2: spoken directly, "Welcome to Module 10 — Sanitation and Reset Systems" — v1 never spoke this) |
| 3 | "Build a sanitation system that holds up all day." | `.mo-tagline`, L9364 | Module identity | M10-01 | exact (v2: spoken directly, verbatim — v1 never spoke this) |
| 4 | "In this module" | `.mo-section-label`, L9368 | List label | M10-01 | folded ("Here's what's ahead") |
| 5 | "Pay attention to" | `.mo-attention-label`, L9379 | Callout label | M10-01 | folded ("Pay attention to this:") |
| 6 | "Building on Your Licensure" | `.sec-eyebrow`, L9388 | Section announcement | M10-02 | exact ("Building on your licensure.") |
| 7 | "You already know sanitation fundamentals. This module teaches you how to apply them to the specific realities of a Head Spa." | `.sec-title`, L9389 | Section headline | M10-02 | exact |
| 8 | "Governing sources" | `.kp-eyebrow`, L9395 | Key-point label | M10-02 | exact (v2: "Governing sources:" now spoken — v1 folded it) |
| 9 | "10.1 — Use the Right Process for the Job" | `.sec-eyebrow`, L9402 | Section announcement | M10-02 | exact |
| 10 | "Five words. Five different actions." | `.sec-title`, L9403 | Section headline | M10-02 | exact |
| 11 | "Cleaning" | `.cc-term`, L9409 | Card term | M10-02 | exact ("One, Cleaning —") |
| 12 | "Disinfection" | `.cc-term`, L9415 | Card term | M10-02 | exact ("Two, Disinfection —") |
| 13 | "Launder / Replace / Discard" | `.cc-term`, L9421 | Card term | M10-02 | exact ("Launder, Replace, or Discard") |
| 14 | "Reset" | `.cc-term`, L9427 | Card term | M10-02 | exact |
| 15 | "Sterilization" | `.cc-term`, L9433 | Card term | M10-02 | exact |
| 16 | "10.2 — Process the Right Item the Right Way" | `.sec-eyebrow`, L9441 | Section announcement | M10-03 | exact |
| 17 | "Match the process to what the item actually is." | `.sec-title`, L9442 | Section headline | M10-03 | exact |
| 18 | "Reusable hard, nonporous tools" / "Hard, nonporous service surfaces" / "Linens / washable porous goods" / "Single-use items" / "Halo / basin / water system / equipment" / "Product bowls / applicators / supplies" | `.sc-title` ×6, L9448–9473 | Card titles | M10-03 | exact, each named directly with its frequency tag spoken ("Between clients:" ×5, "Periodic, manufacturer-directed:" ×1) |
| 19 | "Instructor tip" | `.kp-eyebrow`, L9481 | Key-point label | M10-03 | exact (already spoken in v1) |
| 20 | "10.3 — Build a Reset Around What Cannot Be Rushed" | `.sec-eyebrow`, L9488 | Section announcement | M10-04 | exact |
| 21 | "Contain. Clean. Disinfect. Reset. Verify." | `.sec-title`, L9489 | Section headline | M10-04 | exact |
| 22 | "Contain" / "Clean" / "Disinfect / Process" / "Reset" / "Verify" | `.rst-title` ×5, L9493–9497 | Step titles | M10-04 | exact, each named as "Step N, [title]:" |
| 23 | "Practitioner note" | `.kp-eyebrow`, L9503 | Key-point label | M10-04 | exact (v2: "Practitioner note:" now spoken — v1 folded it) |
| 24 | "Reset Under Pressure" | `.sec-eyebrow`, L9510 | Interaction announcement | M10-05 | exact |
| 25 | "The room isn't fully ready. The next client already is." | `.sec-title`, L9511 | Interaction headline | M10-05 | exact |
| 26 | "10.4 — Build the System Before You're Under Pressure" | `.sec-eyebrow`, L9528 | Section announcement | M10-06 | exact |
| 27 | "Reduce decisions. Not standards." | `.sec-title`, L9529 | Section headline | M10-06 | exact |
| 28 | "What this looks like under pressure" | `.ic-title`, L9533 | Info-card title | M10-06 | exact (v2: spoken directly, "Here's what this looks like under pressure" — v1 spoke only the card's body) |
| 29 | "Weak system" | `.ws-label`, L9539 | Comparison label | M10-06 | exact |
| 30 | "Strong system" | `.ws-label`, L9543 | Comparison label | M10-06 | exact |
| 31 | "Consistency comes from" | `.ic-title`, L9551 | Info-card title | M10-06 | exact (already spoken in v1) |
| 32 | "Pressure test your system" | `.kp-eyebrow`, L9558 | Key-point label | M10-06 | exact (already spoken in v1) |
| 33 | "Possible log fields" | `.ic-title`, L9566 | Info-card title | M10-06 | exact (v2: "Possible log fields:" now spoken as its own label — v1 folded it into "possible fields include") |
| 34 | "10.5 — When Routine Reset Is Not Enough" | `.sec-eyebrow`, L9574 | Section announcement | M10-07 | exact |
| 35 | "Blood or body fluid is not a routine reset." | `.sec-title`, L9575 | Section headline | M10-07 | exact |
| 36 | "Caution" | `.kp-eyebrow` (`kp-warn`), L9581 | Warning label | M10-07 | exact (v2: "Caution:" now spoken — v1 folded it) |
| 37 | "How to respond" | `.ic-title`, L9589 | Info-card title | M10-07 | exact (already spoken in v1) |
| 38 | "Between-Client Sanitation & Reset Checklist" + body | `.ic-title` + `body-text`, L9594–9595 | Resource-card title + body | M10-07 | exact (title + body narrated in full; only the download button/format-hint chrome excluded) |
| 39 | "Between-client reset reasoning" | `.cp-label.cc-headline`, L9610 | Checkpoint label | M10-08 | folded ("Here's your first checkpoint — between-client reset reasoning.") |
| 40 | "Post-service concern response" | `.cp-label.cc-headline`, L9633 | Checkpoint label | M10-10 | folded ("Here's your final checkpoint — post-service concern response.") |
| 41 | "Module complete." | `.lc-title`, L9650 | Completion headline | M10-11 | exact |
| 42 | "Up next — Module 11" | `.lc-next-label`, L9653 | Completion handoff label | M10-11 | folded ("Up next, Module 11:") |

**Total substantive headings found: 42** (rows 1–42). **Excluded: 0.**
**Narrated: 42.** Zero unexplained omissions — every row is traced to a
chunk above, and four rows (2, 3, 28, 33, 36 — five, not four; see each
row's note) carry a v1→v2 fix because they were previously silent.

---

## Full coverage map (source-content inventory)

| Live element | Content | Disposition | Chunk | Checkpoint |
|---|---|---|---|---|
| `.mod-opener` (eyebrow/title/tagline/desc) | Module identity | Title + tagline now narrated directly (v2 fix); desc verbatim | M10-01 | — |
| "In this module" list (5 items) | Right process every time / process correctly not just quickly / reset routine around what can't be rushed / system before pressure / know when reset isn't enough | All 5 named individually, "— every time" restored on item 1 (v1 dropped it) | M10-01 | — |
| `.mo-attention` | "Pay attention to" note | Narrated verbatim | M10-01 | — |
| "Building on Your Licensure" title + body | Licensure-extension framing | Narrated closely | M10-02 | — |
| Governing-sources key-point | Full text, 3 controlling-source types | Narrated verbatim, label now spoken (v2 fix) | M10-02 | — |
| 10.1 title + body | 4-term interchangeable-language caution | Narrated closely | M10-02 | — |
| 10.1 concept-grid — 5 cards | Cleaning, Disinfection, Launder/Replace/Discard, Reset, Sterilization — full term+sub+def each | All 5 named individually and in full | M10-02 | — |
| 10.2 title + body | Item→process framing | Narrated closely | M10-03 | — |
| 10.2 sanit-grid — 6 cards | 5 "between clients" categories + 1 "periodic, manufacturer-directed" category, full items text each | All 6 narrated in full, frequency tag spoken for each | M10-03 | — |
| 10.2 key-point "Instructor tip" | Whirlpool/jet-system cleaner note | Narrated verbatim | M10-03 | — |
| 10.3 title + body | Reset-pace framing | Narrated closely | M10-04 | — |
| 10.3 reset-sequence — 5 steps | Contain, Clean, Disinfect/Process, Reset, Verify — full title+body each | All 5 narrated in order, in full | M10-04 | — |
| 10.3 key-point "Practitioner note" | Practice/measure/turnover guidance | Narrated verbatim, label now spoken (v2 fix) | M10-04 | — |
| "Reset Under Pressure" eyebrow/title/body | Interaction framing (scenario) | Narrated verbatim | M10-05 | — |
| `m10RupDecision` — 5 option labels | Full quoted button text | All 5, verbatim, unreordered | M10-05 | — |
| `m10RupFeedback` — 5 feedback texts | Full feedback sentences | All 5, verbatim (`M10_RUP_ANSWER.feedback[0..4]`) — **now gated to play only after selection (v2 fix; v1 spoiled all 5 up front)** | M10-05-fb0..fb4 | — |
| 10.4 title + body | System-before-pressure framing | Narrated closely | M10-06 | — |
| 10.4 info-card "What this looks like under pressure" | Title + body (running-behind scenario) | Both narrated (v2 fix — v1 spoke only the body) | M10-06 | — |
| 10.4 ws-compare — 2 cards | Weak system / Strong system, full text each | Both narrated in full | M10-06 | — |
| 10.4 info-card "Consistency comes from" | 7-item list | All 7 items narrated | M10-06 | — |
| 10.4 key-point "Pressure test your system" | 3 questions + closing line | Narrated verbatim | M10-06 | — |
| 10.4 body-text (records) | Records-support framing | Narrated closely | M10-06 | — |
| 10.4 info-card "Possible log fields" | 7-item list | All 7 items narrated, label now spoken (v2 fix) | M10-06 | — |
| 10.4 body-text (compliance review) | Recurring-review guidance | Narrated closely | M10-06 | — |
| 10.5 title + body | Blood/body-fluid framing | Narrated closely | M10-07 | — |
| 10.5 key-point "Caution" (`kp-warn`) | Full exposure/cleanup procedure text | Narrated verbatim, label now spoken (v2 fix) | M10-07 | — |
| 10.5 body-text (rash) | Non-diagnosis framing | Narrated verbatim | M10-07 | — |
| 10.5 info-card "How to respond" | Full response-steps text | Narrated verbatim | M10-07 | — |
| 10.5 info-card "Between-Client Sanitation & Reset Checklist" | Resource-card title + body | Narrated in full (download button/format-hint chrome excluded) | M10-07 | — |
| Checkpoint 1 (`m9cp1`, "Between-client reset reasoning") | Real rubric question, verbatim | Full, `cc-headline` folded into framing, now its own `checkpoint-stop` chunk | M10-08 | **STOP — m9cp1** |
| (post-pass transition) | "Nice work — let's keep going." | Narration-UX only, no source content — **new chunk (v2 fix); v1 had no gate here at all** | M10-09 | resume after m9cp1 |
| Checkpoint 2 (`m9cp2`, "Post-service concern response") | Real rubric question, verbatim | Full, `cc-headline` folded into framing, now its own `checkpoint-stop` chunk | M10-10 | **STOP — m9cp2** |
| `#m10Complete` title/body/next | Completion + Module 11 preview | Narrated in full, exact match to live copy | M10-11 | resume after m9cp2 |

## Excluded as non-instructional UI (with reason)

- **`data-choice`/`aria-pressed`/`bq-tag` interactive-widget mechanics,
  "Reset this scenario" button** — interaction chrome; the substantive
  option text and feedback it gates is narrated in full at
  M10-05/M10-05-fb0..fb4.
- **"Download Sanitation & Reset Checklist" button label and "PDF ·
  fillable · download" format hint** — the download affordance and
  file-format descriptor; the card's actual title and body text are
  narrated in full at M10-07. The PDF's own unseen internal contents
  remain correctly unnarrated — nobody on this project has read them.
- **"Listen with Cadence — coming soon · Includes 2 checkpoint stops"
  footer** — navigation/entry-point UI, not lesson content (same
  category every prior module's audit excludes).
- **Checkpoint textarea placeholders** ("Walk through your reset — what
  you contain, clean, disinfect, restock, and never shorten...", "What
  you'd say to her, what you'd document, and what you'd review
  internally...") — input-field UI hints; the checkpoint's real question
  is narrated in full separately from the rubric config.
- **`cc-eyebrow`/`cc-title`/`cc-line` state-machine labels** (Ready/In
  Progress/Done variants: "Apply what you just learned.", "Finish your
  thought.", etc.) — dynamic UI state text describing the checkpoint
  widget's own progress, not lesson content.
- **"Open Cadence Check →" buttons, voice-input mic buttons** —
  interaction controls, not teaching content.
- **"Start Module 11 →" / "Back to course" buttons** — navigation
  controls, not teaching content.
- **All `id`/`class`/`onclick` attributes, inline `<script>` blocks, and
  the module-reorder code comment at L9350–9357** — implementation
  detail, not visible to a student either way.

No substantive teaching block was found undocumented. Coverage: **100%
of substantive Module 10 content**, all 16 script units (11 narration
chunks + 5 interaction-feedback branches), both checkpoints preserved at
their real gate positions (`m9cp1` after 10.5, `m9cp2` immediately after
`m9cp1`'s post-pass transition — matching the live DOM order re-confirmed
in this same fresh read).

## Checkpoint relationship (unchanged from live page, not altered by this pass)

- `m9cp1` — after 10.5 ("When Routine Reset Is Not Enough"), immediately
  before `m9cp2` (no section between them — confirmed at
  `headspa-mastery.html:9602-9627`, one `<hr class="divider">` and
  nothing else). Question, rubric, and grading system prompt
  (`M9.systems.m9cp1`) are untouched. Real moduleId passed to grading is
  `10` (`submitCheckpoint(10, id, ...)`, verified fresh at
  `headspa-mastery.html:12754`).
- `m9cp2` — end of module, immediately after `m9cp1`, before completion.
  Question, rubric, and grading system prompt (`M9.systems.m9cp2`) are
  untouched.

This pass changes narration and gating structure only (splitting one
ungated v1 chunk into two independently-gated `checkpoint-stop` chunks
with a `post-pass` transition between them). No checkpoint ID, question
text, rubric, grading logic, or the checkpoints' real on-page adjacency
was modified anywhere in this document or in `headspa-mastery.html`.

## Interaction reveal-timing correction (Section I)

v1 combined the interaction's prompt/options and its verdict into one
ungated chunk (`M10-04`), naming the strongest response and
characterizing the other four as wrong before the student could have
acted. v2 corrects this: `M10-05` (`gateType: 'interaction-stop'`)
narrates the prompt and all five option labels only; the verdict/
rationale for whichever option the student actually selects plays only
afterward, from one of five separate `interactionFeedback` branches
(`M10-05-fb0`..`M10-05-fb4`). All five branches verified fresh this pass
against `M10_RUP_ANSWER` (`headspa-mastery.html:13036-13045`) —
byte-identical to the live source. See the script's interaction timing
map for the full option→branch mapping.

## END-OF-MODULE FIDELITY CHECK (Section G — mandatory, final third)

Scope: **10.4 through completion** (`M10-06` through `M10-11`) — chosen
over a strict chunk-count division because this is where Module 10's
highest-density multi-item lists live (10.4's 7-item consistency-factors
list and 7-item log-fields list; 10.5's caution and response-steps text)
and where both of v1's checkpoint-adjacent structural defects
(answer-above, combined-checkpoints) actually lived. Re-read side by side
against the live page's own final third (`headspa-mastery.html:9528-9658`),
independently of the full coverage-map pass above.

- **Headline/card/list thinning check:** 10.4's "Consistency comes from"
  list — 7 items, all present, none merged or dropped. 10.4's "Possible
  log fields" list — 7 items, all present, label now explicitly spoken
  (was folded in v1). 10.5's caution list and "How to respond" list —
  both compared clause-by-clause against the live page; no clause
  dropped. PASS.
- **Paraphrase creep check:** both checkpoint rubric questions
  (`m9cp1`/`m9cp2`) compared against the real config strings at
  `headspa-mastery.html:11504-11505`, re-read fresh this pass — identical,
  byte-for-byte, not paraphrased. The "Reset Under Pressure" feedback
  texts compared against `M10_RUP_ANSWER.feedback[0..4]` — identical.
  PASS.
- **Exact completion-language match against the live page:** `m10Complete`
  card's `lc-body` and `lc-next-text` compared against M10-11 — exact
  match, not a paraphrase. PASS.
- **Exact checkpoint placement (immediately after the element it gates,
  in live DOM order):** `m9cp1` narrated (M10-08) immediately follows
  10.5's content (M10-07), with only the excluded checklist-download
  chrome between them — matches `headspa-mastery.html:9600-9604`. `m9cp2`
  narrated (M10-10) immediately follows `m9cp1`'s post-pass transition
  (M10-09) — matches `headspa-mastery.html:9624-9627`, confirming the two
  checkpoints really are back-to-back on the live page with no section
  between them, which is why M10-09 is a bare transition line rather than
  new section content. PASS.
- **Stronger-paraphrase-than-earlier-sections check** (the specific
  failure mode this rule targets — the module getting looser toward the
  end): not found. Unlike Module 9's v2 (where drift concentrated in the
  back half), Module 10 v1's defects were structural (gating, directional
  wording) rather than a density gradient — the "unspoken label" gaps
  (Governing sources, Practitioner note, Caution, Possible log fields,
  What this looks like under pressure) are distributed across the whole
  module, front to back, not concentrated at the end.
- **Missing next-module handoff:** `lesson-complete`'s `lc-next` block is
  present in M10-11, in full, not dropped.
- **Interaction-spoiler and combined-checkpoint defects specifically
  re-checked** (the two defects this rebuild exists to fix, both of which
  fall inside this check's scope): confirmed fixed — see "Interaction
  reveal-timing correction" and "Checkpoint relationship" above. Neither
  defect is reproduced anywhere in the v2 script.

**END-OF-MODULE FIDELITY CHECK result: PASS.**

## TTS preflight (before generation)

`node scripts/aimt-listen-tts-preflight.mjs` run against all 15 v2 batch
payloads under `docs/course-audit/listen-mode/tts-final/module-10/`:
**PASS**, 0 failures. Specifically: 0 occurrences of bare/standalone
"AIMT" in any narration payload, 0 occurrences of hyphenated "A-I-M-T," 0
occurrences of dotted "A.I.M.T," 0 occurrences of "answer above"/"respond
above"/"your answer is above" phrasing (the exact v1 defect — confirmed
both by the preflight tool and by direct grep against all 15 batch
files), 0 un-narrated structural/editorial brackets, 0 literal chunk IDs
embedded in spoken text, and every batch comfortably under the
4,500-char safety margin. See the final report / `RESUME.md`-style log
for the exact per-batch character counts and the full preflight console
output.

## Post-generation pronunciation correction (audio QA, 2026-09-18)

Text-level preflight (above) confirms the *written* form is correct, but
it cannot catch a mispronunciation in the *rendered audio* — that
required an actual listen. After all 15 batches were generated with the
locked course-wide "A I M T" (single-spaced) form, the owner reported
batch A1's two "AIMT" mentions rendered as "Am-tee," not four distinct
letters. Diagnosis: the first three letters, A-I-M, spell the real word
"aim," and `eleven_v3` collapses the reading toward that word plus "T"
rather than four separate letter-sounds — a linguistic collision the
single-spaced convention does not fully prevent for this specific
acronym. Two fixes were generated and compared by ear against the same
real sentence: "A, I, M, T" (comma-separated) and "A I M T" wrapped in a
`[slowly]` delivery tag. The owner confirmed the comma-separated form
resolves to four distinct letters; the `[slowly]`-tagged form was
rejected. Batch A1 was regenerated with "A, I, M, T"/"A, I, M, T's" (both
occurrences, `M10-BATCH-A1.txt` and `M10-02` in the script) — this is the
only batch in Module 10 containing the acronym. The mispronounced take is
archived, not deleted, at
`AIMT-Listen-Mode-Final/10-Module-10/archive-mispronounced-aimt/`.

**Scope note:** every other already-shipped Listen Mode module uses the
same single-spaced "A I M T" convention and was generated before this
finding — this audit makes no claim about whether the same mispronunciation
occurs there (a different sentence's surrounding phonemes could render
differently), only that the identical text pattern is now confirmed
capable of producing it. Re-checking other modules' existing audio is a
separate, not-yet-decided owner action and is out of scope for this
Module 10 audit.
