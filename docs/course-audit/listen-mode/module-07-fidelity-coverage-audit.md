# Module 7 — Listen Mode Fidelity Coverage Audit (v2, strict-fidelity rebuild)

**Authority:** current live `headspa-mastery.html`, `#module7Wrap`, lines
8384–8818 (read in full, 2026-09-16), plus the checkpoint question text in
`const M7 = { questions: {...} }` (lines 11347–11350), the checkpoint
rubrics `M7.systems` (lines 11354–11377), the checkpoint list `'7':
['m7cp1', 'm7cp2']` (line 10511), and the signature-interaction handlers
`m7CardAnswer()` / `m7CardNext()` (lines 12811–12848, including the
surrounding comments confirming each of the 4 setup cards has exactly one
reveal regardless of which of the two buttons the student clicks — there
is no per-choice feedback branch to narrate here, unlike Modules 5 and 6's
decision interactions). This audit supersedes `module-07-listen-script.md`
(v1, written 2026-08-31) as the narration source of record — that document
is retained for history only at
`archive-loose-v1/module-07-listen-script-v1-REJECTED.md`, per the owner's
explicit instruction that the old narration is rejected and not
authoritative.

**Why this rebuild happened:** the same strict-fidelity standard applied to
Modules 1, 4, 5, and 6 is being applied to Module 7. Module 6's rebuild had
one real quality issue the owner caught on review: a substantive on-screen
headline was skipped even though its body content was narrated — because
the fidelity map didn't force an explicit accounting of every heading. The
owner has now put a hard rule in place (the Headline Rule, applied below)
requiring every substantive heading to get an explicit disposition, plus a
mandatory dedicated last-third re-check (see the END-OF-MODULE FIDELITY
CHECK section at the end of this document) before any narration is
considered final.

**Standard applied:** the same one used for the owner-approved Module 1, 4,
5, and 6 rebuilds, plus:
- The "From Cadence" / spoken-UI-adaptation rule: a visible "From Cadence"
  label is adapted into first person (Cadence is the speaker) rather than
  read in the third person — the card's substantive content is still
  delivered intact.
- The **Headline Rule**: every substantive heading/headline gets an
  explicit disposition — (A) its own announced beat, (B) intentionally
  folded into the very next sentence (documented as such), or (C)
  documented as decorative/non-instructional with a stated reason. See the
  full coverage map below; every row states which.
- The owner's explicit, module-specific override of the base editorial
  standard's "representative examples" compression allowance: **Section
  7.2's 4 tool categories are narrated with every essential/upgrade item
  named individually (28 items total), not compressed to category-level
  coverage.** This is the single largest fidelity gap in the old v1 script
  — see drift #5 below.
- The **Checkpoint Narration Rule**: the student's response field sits
  *below* the checkpoint prompt on screen, never above it. Neither
  checkpoint in this rebuild uses "answer above" or any directional
  variant implying otherwise — both close with exactly "Take your time and
  answer below." This was grepped for explicitly (zero hits — see the
  confirmation at the end of this document) and is now also an automated,
  repeatable gate in `scripts/aimt-listen-tts-preflight.mjs` (see that
  script's check #6).

---

## Concrete drift found in the old (rejected v1) narration, corrected here

| # | Live element | Old narration (v1) | Live text now | Fix |
|---|---|---|---|---|
| 1 | 7.1 bed category 7, "Armrest configuration" | "a commonly reported comfort preference among practitioners, not a documented requirement" | "a commonly reported comfort **complaint** among **experienced** practitioners — a preference many share, not a documented **safety or ergonomic** requirement" | M7-02 restored the exact live wording, including "complaint," "experienced," and "safety or ergonomic" |
| 2 | 7.1 bed category 1, "Basin & head support" | Never mentioned the live page's explicit cross-reference forward | Live text: "...in a relaxed position — this connects directly to correct client positioning in Section 7.4." | M7-02 restores the 7.4 cross-reference |
| 3 | 7.1 "What most people get wrong" info-card | Ended after "...the entire service is affected" | Live adds a closing sentence: "Nothing will compensate for it." | M7-02 restores the closing sentence |
| 4 | 7.1 and 7.4 `cadence-note` ("From Cadence") cards | Folded into the surrounding paragraph as an unmarked `[warmly]`/plain aside, not signaled as its own distinct first-person beat | Live markup presents each as its own visible `cadence-note` card labeled "From Cadence" | Per the owner's rule, both are rebuilt as their own signaled beat with a natural first-person lead-in ("Here's a note from me:"), substantive content delivered intact |
| 5 | 7.2 Tools & supplies, all 4 tool categories | Compressed to "category-level coverage, not every single item read individually" — none of the ~28 individual essential/upgrade items were named, only the 4 category labels | Live markup lists every item individually under Essential/Upgrade for all 4 categories (Linens & comfort: 6 essential + 2 upgrade; Service tools: 6 essential + 3 upgrade; Sanitation supplies: 5 essential, 0 upgrade; Ambient experience: 3 essential + 3 upgrade — 28 items total) | M7-03 names every one of the 28 items individually, per the owner's explicit override of the base editorial standard's compression allowance for this module — see "Judgment call" note below |
| 6 | 7.2 "Within-reach zone" card | "your product dishes and applicator brush" (count dropped); the "This is what makes the pressure test below... actually achievable" sentence dropped entirely | Live: "**the three** product dishes, the applicator brush..."; the pressure-test tie-in sentence is present in full | M7-03 restores "the three product dishes" and the pressure-test tie-in sentence |
| 7 | 7.3 prep step 4, "Fresh bed linens" | "Fresh bed linens." — no further detail | Live: "Fresh bed linens — **Sheet, headrest cover, clean pillow if used**" | M7-04 restores the itemized detail |
| 8 | 7.3 prep step 9, "Massage oil and lotion" | "Massage oil and lotion ready on the cart." | Live adds "**, easily accessible**" | M7-04 restores "easily accessible" |
| 9 | 7.4 positioning photo pair | Never narrated either figcaption — jumped straight from the section title to body text | Live presents two figcaptions carrying real comparison content: "Correct: occipital supported, neck relaxed, shoulders clear of the edge." / "Incorrect: chin lifted, neck extended over the basin edge — the exact position to avoid." | M7-05 narrates both captions in full, consistent with how Module 5's own correct/incorrect case-study photo pair was handled |
| 10 | Module completion, `lc-next-text` | "the full service itself" | Live: "**The full 17-step service map. Both formats.**" | M7-09 restores "the full seventeen-step service map, in both formats" |
| 11 | Module completion, `lc-body` | Ended after "...know what to do if something's off." | Live adds: "**Next: the service itself.**" | M7-09 restores the trailing sentence |
| 12 | Both checkpoints | "Take your time, and answer above." (×2) — directionally backwards; the response field sits below the prompt, not above it | N/A — this is a narration-only defect, not a live-page drift | M7-07 and M7-08 both close with exactly "Take your time and answer below." per the owner's new Checkpoint Narration Rule. **Note:** on inspection, this same "answer above" defect was found in 15 already-shipped batch files across 9 *other* modules (00, 02, 03, 05, 06, 08, 09, 10, 11) — out of scope for this Module-7-only pass and **not touched**; flagged separately for the owner/coordinator. |
| 13 | Checkpoint structure | Both checkpoints (`m7cp1` and `m7cp2`) were narrated in a single combined chunk/batch (`M7-07`) | N/A — structural narration choice, not a live-page drift | Split into two separate chunks/batches (`M7-07` for `m7cp1` alone, `M7-08` for `m7cp2` alone), per the standing rule that each checkpoint must be its own generation batch — see "Judgment call" note below |

No wording was softened and no scope/safety language was changed in the old
version. As with prior modules, most of this drift is coverage/compression
drift (items and detail silently dropped), with one structural fix
(checkpoint batch separation) and one direct fix of the new Checkpoint
Narration Rule defect.

### Judgment call flagged for owner review

`m7cp1` and `m7cp2` sit genuinely back-to-back on the live page — confirmed
by reading `#module7Wrap` in full: the signature interaction is followed
immediately by the `m7cp1` checkpoint card, a single `<hr class="divider">`,
then the `m7cp2` checkpoint card, then module completion. No numbered
section or other instructional content separates the two checkpoints,
matching what the old v1 script's header also correctly noted.

Because each checkpoint must still be generated as its own isolated audio
batch (a checkpoint-stop batch can never share a recording with anything on
the far side of its interactive gate — see the chunking rationale in
`scripts/aimt-listen-module07-v2-build.mjs`), there is no substantive
section content available to carry a standalone "post-pass transition"
chunk after `m7cp1` resumes, the way Modules 5 and 6 each had a real next
section to transition into. Rather than inventing a freestanding
transition chunk/batch with no real content of its own, this rebuild folds
the short resume line ("Nice work. Here's your second and final checkpoint
for this module.") into `m7cp2`'s own chunk (`M7-08`) as its opening
sentence. `M7-07` (`m7cp1`) and `M7-08` (`m7cp2`) remain two fully separate
chunks and two fully separate batches — nothing here merges the two
checkpoints' actual questions together, which is what the old v1 script
did and what the "each checkpoint in its own batch" rule exists to
prevent. Flagging this explicitly since it's the one place this audit
exercises judgment rather than mechanically mirroring the exact transition
pattern used in Modules 5 and 6.

---

## Full coverage map

| Live element | Content | Disposition | Chunk | Checkpoint |
|---|---|---|---|---|
| `.mod-opener` (eyebrow "Module 07" + title "Equipment & Room Setup" + tagline + desc) | Module identity | **Headline: (A)** title/tagline spoken directly as the opening beat | M7-01 | — |
| "In this module" list (5 items) | Outcomes | All 5 named individually, full wording (incl. "not against it" / "every time," both restored vs. v1) | M7-01 | — |
| `.mo-attention-label` "Pay attention to" + text | Attention note | **Headline: (B)** label folded into the lead-in "Pay attention to this:"; text narrated verbatim | M7-01 | — |
| `sec-eyebrow` "7.1 — The treatment bed" + `sec-title` "Your most important equipment decision." | Section announcement | **Headline: (A)** both spoken as the section-announcement beat, per the course-wide "Section [N.N] — [title]" pattern | M7-02 | — |
| Figure (no distinct alt content beyond the photo) + figcaption "A configured head spa bed, ready for service." | Bed photo | Screen cue + caption narrated | M7-02 | — |
| 7.1 body, 2 paragraphs | Bed as foundation of everything / halo-equipped wet bed | Narrated closely, full, both paragraphs distinct | M7-02 | — |
| `info-card` "What most people get wrong" | Choosing by looks, not performance | **Headline: (B)** folded as a colon lead-in; full text incl. "Nothing will compensate for it" (fixes drift #3) | M7-02 | — |
| 7 `condition-card`s: bed-evaluation categories 1–7 | Basin & head support / Client entry, exit & stability / Practitioner reach & working height / Water management / Cleaning & sanitation compatibility / Space requirements (preference) / Armrest configuration (preference) | **Headline: (A)** each spoken as its own numbered beat ("One: basin and head support," etc., incl. categories 6–7's "preference, not a requirement" qualifier read as part of the heading); all 7 named individually, full body text, real order, incl. the 7.4 cross-reference (fixes drift #2) and the full armrest wording (fixes drift #1) | M7-02 | — |
| Closing "no single required bed model" sentence | Transferability principle | Narrated closely | M7-02 | — |
| `cadence-note` ("From Cadence," 7.1) | "A common early mistake is prioritizing what looks impressive in photos..." | **From Cadence Rule:** first-person adaptation ("Here's a note from me:"), substantive quote delivered intact (fixes drift #4) | M7-02 | — |
| `sec-eyebrow` "7.2 — Tools & supplies" + `sec-title` "Essentials first. Upgrades later." | Section announcement | **Headline: (A)** | M7-03 | — |
| 7.2 body, 2 paragraphs | Tools overvalued / start with essentials | Narrated closely, full | M7-03 | — |
| 4 `tool-category` headings: Linens & comfort / Service tools / Sanitation supplies / Ambient experience | Category names | **Headline: (A)** each spoken as its own beat | All 4 named individually, **all 28 essential/upgrade items across the 4 categories named individually, no compression** — the module-specific override of the base "representative examples" allowance (fixes drift #5) | M7-03 | — |
| `ic-title` "Arranging your cart" | Cart-arrangement principle | **Headline: (B)** folded as a colon lead-in | Narrated in full | M7-03 | — |
| 3 `condition-card`s: Within-reach zone / One-step zone / Reserve zone | Cart zoning by reach frequency | **Headline: (A)** each spoken as its own beat | All 3 named individually, full text incl. "the three product dishes" and the pressure-test tie-in (fixes drift #6) | M7-03 | — |
| Closing clean/dirty bin tie-back sentence | Ties sanitation supplies to live-service maintenance | Narrated closely | M7-03 | — |
| `sec-eyebrow` "7.3 — Station prep sequence" + `sec-title` "Run this before every single client." | Section announcement | **Headline: (A)** | M7-04 | — |
| Figure + figcaption "A station set up in reach order — the items used most, closest." | Reach-order photo | Screen cue + caption narrated | M7-04 | — |
| 7.3 body, 2 paragraphs | Consistency is invisible-to-you/obvious-to-client / build-sequence logic | Narrated closely, full | M7-04 | — |
| 10 `prep-item`s (bold label + detail each) | Halo flush / Product dishes / Towel warmer loaded / Fresh bed linens / Bed warmer on / Room temperature / Spa wrap, robe, slipper socks / Towel around halo hose / Massage oil and lotion / Ambient | **Headline: (A)** each spoken as its own numbered title+detail beat | All 10 named individually in order, full detail text incl. "sheet, headrest cover, clean pillow if used" (fixes drift #7) and "easily accessible" (fixes drift #8) | M7-04 | — |
| `sec-eyebrow` "7.4 — Client positioning" + `sec-title` "Three things to confirm before the water runs." | Section announcement | **Headline: (A)** | M7-05 | — |
| Photo pair, 2 figcaptions | "Correct: occipital supported..." / "Incorrect: chin lifted..." | Screen cue + **both** captions narrated in full (fixes drift #9) | M7-05 | — |
| 7.4 intro body | Positioning errors hard to correct mid-service | Narrated closely | M7-05 | — |
| 3 `pos-card`s: Halo alignment / Shoulder position / Occipital support | Three positioning checks | **Headline: (A)** each spoken as its own numbered beat | All 3 named individually, full body text, real order | M7-05 | — |
| `info-card` "Why this matters" | Hyperextension safety rationale | **Headline: (B)** folded as a colon lead-in | Narrated in full, safety language kept exact | M7-05 | — |
| `key-point kp-warn` "Watch for" + text; bold "What to do:" + text | Neck-strain/dizziness watch-for + stop/adjust/communicate/resume response | **Headline: (B)** both labels folded as their own colon lead-ins, kept as two distinct beats | Narrated in full, incl. the dizziness/visual-changes/slurred-speech medical-escalation line kept exactly as written, never softened or expanded | M7-05 | — |
| `cadence-note` ("From Cadence," 7.4) | Cover → knee bolster → blanket → eye mask sequencing | **From Cadence Rule:** first-person adaptation, substantive quote delivered intact | M7-05 | — |
| `key-point` "Pressure test your setup:" | Self-check questions | **Headline: (B)** folded as a colon lead-in | Narrated in full | M7-05 | — |
| `sec-eyebrow` "Signature interaction" + `sec-title` "Find the setup mistakes." | Non-numbered interaction intro | **Headline: (A)** — plain-language framing line, per the course-wide rule for non-numbered moments (no fabricated section number) | M7-06 | — |
| Interaction intro body | "Not every difference is a mistake..." | Narrated closely | M7-06 | — |
| 4 `m7-card`s: cart-side / far-reach items / no-armrests bed / head-neck-shoulder position | Prompt + reveal + lesson/takeaway, each | All 4 named individually, full prompt + full reveal (incl. the live page's own lead word — "Different does not...," "Yes," "Not necessarily," "Yes" — combined with the resolution badge, e.g. "Not necessarily — acceptable variation") + full lesson/takeaway text, real order. Single-reveal-per-card behavior confirmed from `m7CardAnswer()` (both buttons trigger the identical back face — no separate per-choice feedback branch exists to narrate, unlike Modules 5/6's decision interactions) | M7-06 | — |
| `#m7cp1` question (from `M7.questions.m7cp1`) | Exact checkpoint text | Verbatim, unparaphrased. Closes with "Take your time and answer below." — no "above" anywhere | M7-07 | **STOP — m7cp1** |
| `#m7cp2` question (from `M7.questions.m7cp2`) | Exact checkpoint text | Verbatim, unparaphrased (incl. dropping v1's erroneous inserted comma). Chunk opens with the m7cp1 resume transition, since no section content separates the two checkpoints on the live page — see Judgment call above. Closes with "Take your time and answer below." — no "above" anywhere | M7-08 | **STOP — m7cp2** |
| `#m7Complete` title/body/next | Completion + Module 8 preview | Narrated in full, current live text, incl. "the full seventeen-step service map, in both formats" (fixes drift #10) and "Next: the service itself." (fixes drift #11) | M7-09 | resume after m7cp2 |

## Excluded as non-instructional UI (with reason)

- "Listen with Cadence — coming soon · Includes 2 checkpoint stops" footer — navigation/entry-point UI, not lesson content (same category Modules 1, 4, 5, and 6 excluded).
- "↓ Activate each category to expand" / "↓ Activate each step to mark complete" `.interaction-hint` lines — UI operating instructions, not lesson content.
- `cc-badge` colored dot swatches on every `condition-card` (bed categories, cart zones) — decorative color-coding with no text content; the same visual order is preserved through the narration's own ordinal structure ("One... Two... Three...").
- `m7-card-progress` "Setup N of 4" — interactive progress-state UI chrome (same category as Module 6's `fc-badge` state labels); order is preserved through the narration's own "Setup one/two/three/four" structure.
- `m7-card-choices` button labels "Needs correction" / "Acceptable variation" (the pre-reveal clickable buttons themselves) — interactive-UI mechanics. Both possible outcomes are stated explicitly in the reveal narration regardless of which button a student would actually click, confirmed via `m7CardAnswer()` (idx-only handler — no per-choice branch exists in the code).
- `prep-complete` "✓ Station ready. Run this before every single client." — interactive completion-state UI that only renders after the student manually checks off all 10 steps; its text duplicates the section's own already-narrated tagline.
- Checkpoint UI chrome shared across every module's checkpoints: `cp-label cc-headline` ("Planning check" / "Final check"), the `cc-eyebrow`/`cc-title`/`cc-line` ready/progress/done state text ("Cadence Check," "Apply what you just learned," "Use Cadence to explain your reasoning and demonstrate this competency," etc.), `cp-input` placeholder text, the voice-input button, "Open Cadence Check →" — generic, course-wide interactive-checkpoint UI, not Module-7-specific instructional content (same exclusion basis Modules 5 and 6 used — those audits also narrate only the actual `M{n}.questions` text, nothing from the surrounding checkpoint chrome).
- `alt` text, `id`/`class`/`onclick`/`aria-*` attributes, and inline `<script>` — implementation detail, not visible to a student either way.
- "Start Module 8 →" / "Back to course" buttons — navigation controls, not teaching content.

No substantive teaching block was found undocumented. Coverage: **100% of
substantive Module 7 content**, all 9 chunks, both checkpoints preserved at
their real gate positions (`m7cp1` and `m7cp2` immediately back-to-back
after the signature interaction, before module completion — matching the
live DOM order confirmed in this same read, and matching what the
now-rejected v1 script's header also correctly documented about their
adjacency).

## Checkpoint relationship (unchanged from live page, not altered by this pass)

- `m7cp1` — after the signature interaction ("Find the setup mistakes"), immediately before `m7cp2` (a single `<hr class="divider">` between the two `checkpoint cc-card` blocks, no intervening section). Question, rubric, and grading system prompt (`M7.systems.m7cp1`) are untouched.
- `m7cp2` — immediately follows `m7cp1`, before module completion. Question, rubric, and grading system prompt (`M7.systems.m7cp2`) are untouched.

This pass changes narration only. No checkpoint ID, question text, rubric,
grading logic, or gating behavior was modified anywhere in this document or
in `headspa-mastery.html`. `headspa-mastery.html` was read-only throughout
this pass — no edits were made to it, and nothing in it required a proposed
patch (`docs/course-audit/pending-headspa-mastery-patches.md` was read but
not appended to).

---

## END-OF-MODULE FIDELITY CHECK

**Scope:** the final third of Module 7 — Section 7.4 (Client positioning)
through the signature interaction, both checkpoints, and module
completion (chunks M7-05 through M7-09) — re-read side by side against the
live page a second time, independently of the full coverage-map pass
above.

- **No headline skipped:** 7.4's section announcement, all 3 `pos-card`
  headings, "Why this matters," "Watch for," "What to do:," the "From
  Cadence" label, "Pressure test your setup:," the "Signature interaction"
  framing, and both checkpoints' framing lines are all present and
  disposed per the Headline Rule table above.
- **No card skipped:** all 3 positioning checks and all 4 signature-
  interaction cards present, in real order.
- **No list thinned:** the 3 positioning checks and the 4 interaction
  cards each carry their full body/reveal/lesson text, not a summary.
- **No final item omitted:** positioning check 3 (occipital support) and
  interaction card 4 (head/neck/shoulder position — the last card before
  the checkpoints) are both present in full, including card 4's closing
  "What to remember" takeaway line — this is exactly the failure mode
  (last item in a sequence silently dropped) flagged by the Module 6
  incident, and it was specifically checked here.
- **No stronger paraphrasing than earlier sections:** two genuine small
  drifts were caught on this second pass and fixed before this audit was
  finalized (both below) — this check is not a rubber stamp.
  - M7-05's "Watch for" text had picked up an inserted connective "but"
    not present in the live text ("...only about comfort; **but** if a
    client ever reports..."). Removed to match the live sentence exactly.
  - M7-06 card 3's reveal had substituted the resolution badge label
    ("Acceptable variation") for the live page's actual opening word
    ("Not necessarily."), silently dropping that word. Fixed to state
    both: "Not necessarily — acceptable variation," matching the pattern
    already used correctly for cards 2 and 4 (live opening word + badge
    label, both present).
- **Completion language matches the live page exactly:** `#m7Complete`'s
  title, body (incl. "Next: the service itself."), and next-module preview
  (incl. "the full seventeen-step service map, in both formats") all match
  current live text — see drift #10/#11.
- **Checkpoint placement exact:** `m7cp1` immediately after the signature
  interaction, `m7cp2` immediately after `m7cp1` with no section between
  them, completion immediately after `m7cp2` — matches live DOM order.
- **No invented forward-reference:** the Module 8 preview line states only
  what `#m7Complete`'s own `lc-next-text` says; nothing about Module 8 was
  added beyond that.
- **No vague synthesis replacing visible teaching:** the completion beat
  narrates the actual live completion copy, not a paraphrased summary of
  the module.

**Result: PASS** (after the two fixes above were applied to the narration
source and the batch files were regenerated from the corrected source —
confirmed by re-running `scripts/aimt-listen-module07-v2-build.mjs` and
`scripts/aimt-listen-tts-preflight.mjs` after the fix).
