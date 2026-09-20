# Module 11 — Listen Mode Fidelity Coverage Audit (v2, strict-fidelity rebuild)

**Authority:** current live `headspa-mastery.html`, `#module11Wrap`, lines
10009–10424 (read fresh and in full, 2026-09-19 — not assumed from any
prior extraction), plus the checkpoint question text in
`const M11 = { questions: {...} }` at lines 11591–11592 (re-verified
fresh this pass), the checkpoint rubrics/system prompts (`M11.systems`)
at lines 11595–11624, the checkpoint-label DOM at lines 10284/10396, the
"Build Your B.R.I.E.F." JS at lines 12809–12830 (confirms no
`APP_STATE` write, no persistence, no grading, no completion gate — an
ungraded free-text workspace, not a select/feedback interaction), and
`submitM11CP()`/`m11cpKey()` at lines 12772–12778. This audit supersedes
`module-11-listen-script.md` v1 (**REJECTED** — archived at
`docs/course-audit/listen-mode/archive-loose-v1/module-11-listen-script-v1-REJECTED.md`).
Nothing was deleted.

**Why v1 was rejected:** structural defects the current editorial
standard names explicitly, plus unspoken-label/paraphrase gaps found on
direct re-read. Full account in the script doc's "Why v1 was rejected"
section; summary:

1. **"Answer above" (Section F).** Both v1 checkpoint closings say "Take
   your time, and answer above."
2. **Both checkpoints ungated (Section I.1).** v1 narrates checkpoint
   1's prompt inline at the end of an ordinary 11.5 teaching chunk with
   no `gateType` declared, and narrates checkpoint 2 in the same chunk
   as the rest of 11.6–11.8, rather than each checkpoint getting its own
   isolated `checkpoint-stop` chunk with a `post-pass` transition
   between them.
3. **Hyphenated "A-I-M-T"** — a form the current preflight explicitly
   rejects.
4. **Unauthorized voice rewrite.** v1 rewrites the page's third-person
   Cadence description into first person ("I'm an AI learning-support
   tool...") — an invented rewrite of visible source text, not a
   transcription of it.
5. **Module title/tagline never spoken** — v1 opens with "Welcome to
   Module 11" and skips straight to the desc paragraph.
6. **"In this module" folded into one run-on sentence** rather than 5
   individually audible items.
7. **Workspace-specific B.R.I.E.F. helper text never spoken** — v1
   narrates only the top framework's 5 helper questions, never the
   workspace's own 5 distinct per-field helper texts (a different DOM
   block with different wording).

**Standard applied:** the Module 4/5/6 controlling precedent, the same
standard re-applied to Module 9 (v4) and Module 10 (v2). Every
substantive visible teaching element (list, card, quote, numbered item,
label, statement, framework field) must be narrated closely enough that
a listening-only student receives the same information a reading student
does. Numbers, named items, and exact client-facing/professional
language are not compressed or approximated. Only true UI chrome is
excluded (see the exclusion list below).

---

## Headline inventory

Every substantive visible heading/label/eyebrow in `#module11Wrap`, in
live DOM order. "Spoken treatment" values: **exact** (read as visible
text, allowing only slash→"and"/"or" and AIMT/B.R.I.E.F.
comma-letter-spelling normalization), **close** (natural spoken
adaptation, same substantive content), **folded** (the label is worked
into a framing sentence rather than announced as its own beat, matching
the Module 9/10 `cc-headline` precedent).

| # | Exact visible text | DOM location | Type | Chunk | Spoken treatment |
|---|---|---|---|---|---|
| 1 | "Module 11" | `.mo-eyebrow`, L10015 | Module identity | M11-01 | close ("Welcome to Module 11") |
| 2 | "AI / Modern Practice Tools" | `.mo-title`, L10016 | Module identity | M11-01 | close ("AI, or Modern Practice Tools" — matches the exact phrasing Module 10's own completion handoff already used for this title) |
| 3 | "Human-led. / AI-assisted." | `.mo-tagline`, L10017 | Module identity | M11-01 | exact |
| 4 | "In this module" | `.mo-section-label`, L10021 | List label | M11-01 | folded ("Here's what's ahead") |
| 5 | 5 "In this module" list items | `.mo-list li` ×5, L10023-10027 | Outcome list | M11-01 | all 5 narrated individually as distinct sentences (v1 fix — see "Why v1 was rejected" #6) |
| 6 | "Pay attention to" | `.mo-attention-label`, L10032 | Callout label | M11-01 | folded ("Pay attention to this:") |
| 7 | Post-opener Cadence/AIMT paragraph | `.body-text`, L10041 | Framing paragraph | M11-02 | close — narrator-person adapted to first person ("through me"/"I'm"), all facts preserved (post-generation owner correction, see addendum below) |
| 8 | "AIMT position" | `.kp-eyebrow`, L10046 | Key-point label | M11-02 | exact ("A, I, M, T position:") |
| 9 | "11.1 — Tool literacy" | `.sec-eyebrow`, L10053 | Section announcement | M11-02 | exact |
| 10 | "What AI Is Actually Good At" | `.sec-title`, L10054 | Section headline | M11-02 | exact |
| 11 | 4 tool-literacy category terms + use-lists | `.cc-term`/`.cc-sub` ×4, L10059-10073 | Card terms | M11-02 | all 4 named individually, full use-list each, slash→"and" |
| 12 | "Professional-looking output is not automatically verified output." + practitioner-ownership sentence | `.body-text`, L10076 | Closing statement | M11-02 | exact |
| 13 | "11.2 — Better input" | `.sec-eyebrow`, L10080 | Section announcement | M11-03 | exact |
| 14 | "Give AI a Better B.R.I.E.F." | `.sec-title`, L10081 | Section headline | M11-03 | close — framework name spoken as the ordinary word "brief" ("Give AI a better brief"), owner-corrected post-generation; see script doc |
| 15 | 5 framework letter/label/helper triples (B/R/I/E/F) | `.m11-bk-item` ×5, L10086-10109 | Framework labels | M11-03 | all 5 narrated individually, in full |
| 16 | "Build Your B.R.I.E.F." | `.m11-brief-heading`, L10114 | Workspace heading | M11-03 | exact |
| 17 | "Ungraded practice · nothing here is saved or scored" | `.m11-brief-tag`, L10115 | Workspace tag | M11-03 | exact substance |
| 18 | Starting weak prompt `"Write a post about my head spa."` | `.m11-brief-start`, L10117 | Worked example | M11-03 | exact, verbatim |
| 19 | 5 workspace field labels + their own distinct helper text | `.m11-brief-label`/`.m11-brief-helper` ×5, L10119-10172 | Field labels+helpers | M11-03 | all 5 narrated individually, in full (v1 fix — see #7) |
| 20 | "See a completed example" | button, L10174 | UI control | — | **excluded** — button label chrome; the reveal's content is narrated in full below |
| 21 | "A strong example — not a required script" | `.cn-label`, L10176 | Example label | M11-03 | exact |
| 22 | Completed B.R.I.E.F. example, 5 fields (B/R/I/E/F) | `.cn-text`, L10178-10182 | Worked example | M11-03 | all 5 fields narrated individually, in full, in order |
| 23 | "11.3 — Human authority" | `.sec-eyebrow`, L10189 | Section announcement | M11-04 | exact |
| 24 | "Decide How Much Authority to Give the Tool" | `.sec-title`, L10190 | Section headline | M11-04 | exact |
| 25 | Signature statement `"What are you asking the tool to do — and what still belongs to you?"` | `.m11-statement`, L10192 | Statement | M11-04 | exact, verbatim |
| 26 | Level 1 / Level 2 / Level 3 labels, titles, and full use-lists | `.m11-framework-col` ×3, L10197-10209 | Framework cols | M11-04 | all 3 narrated individually, full use-list each |
| 27 | Closing statement `"Use AI for leverage. Keep human authority where it matters."` | `.m11-statement`, L10214 | Statement | M11-04 | exact, verbatim |
| 28 | "11.4 — Scalp & hair analysis" | `.sec-eyebrow`, L10218 | Section announcement | M11-05 | exact |
| 29 | "A Confidence Score Is Information — Not a Verdict" | `.sec-title`, L10219 | Section headline | M11-05 | exact |
| 30 | Image `alt` text (condition label + 87% confidence score) | `img[alt]`, L10225 | Image-supported example | M11-05 | close — narrated only what the alt text/caption establishes, nothing visual invented |
| 31 | "Human review" + full body (incl. the seborrheic-dermatitis example line) | `.ic-title`+body, L10230-10231 | Info-card | M11-05 | exact, verbatim, label spoken |
| 32 | "What can shift the result" + 5-factor list | `.ic-title`+list, L10236-10237 | Info-card | M11-05 | exact, all 5 factors, label spoken |
| 33 | Closing paragraph (AI-engineering-lesson / scalp diagnostician) | `.body-text`, L10240 | Closing statement | M11-05 | exact, verbatim |
| 34 | "11.5 — Client-supplied AI" | `.sec-eyebrow`, L10244 | Section announcement | M11-06 | exact |
| 35 | "When the Client Brings an AI Answer" | `.sec-title`, L10245 | Section headline | M11-06 | exact |
| 36 | "What a client might say" + 3 example statements | `.ic-title`+body, L10249-10250 | Info-card | M11-06 | exact, all 3 statements verbatim, label spoken |
| 37 | HEAR/OBSERVE/BOUNDARY/NEXT STEP — 4 numbered steps | `.m11-hear-step` ×4, L10256-10269 | Framework steps | M11-06 | all 4 narrated individually, full content, Boundary line verbatim |
| 38 | Closing statement `"The goal is not to defeat the AI answer..."` | `.m11-statement`, L10274 | Statement | M11-06 | exact, verbatim |
| 39 | "Responding to a client's AI result" | `.cp-label.cc-headline`, L10284 | Checkpoint label | M11-07 | folded ("Here's your first checkpoint — responding to a client's AI result.") |
| 40 | "11.6 — Privacy & client data" | `.sec-eyebrow`, L10301 | Section announcement | M11-08 | exact |
| 41 | "Client Information, Images & AI" | `.sec-title`, L10302 | Section headline | M11-08 | exact |
| 42 | Need / Minimize / Verify — 3 labels + full body each | `.m11-framework-col` ×3, L10308-10318 | Framework cols | M11-08 | all 3 narrated individually, in full, Verify field unshortened |
| 43 | Closing statement (give the tool what the task needs / scalp-imagery warning) | `.body-text`, L10322 | Statement | M11-08 | exact, verbatim |
| 44 | "11.7 — Practice leverage" | `.sec-eyebrow`, L10326 | Section announcement | M11-09 | exact |
| 45 | "Where AI Can Strengthen Your Practice" | `.sec-title`, L10327 | Section headline | M11-09 | exact |
| 46 | 6 leverage category terms + full use-lists | `.cc-term`/`.cc-sub` ×6, L10331-10352 | Card terms | M11-09 | all 6 narrated individually, full use-list each, incl. the Research verify-outside-it directive |
| 47 | "11.8 — Human-led practice" | `.sec-eyebrow`, L10358 | Section announcement | M11-10 | exact |
| 48 | "Stay Human Where Human Matters" | `.sec-title`, L10359 | Section headline | M11-10 | exact |
| 49 | Statement `"Modern does not mean less human."` | `.m11-statement`, L10361 | Statement | M11-10 | exact, verbatim |
| 50 | 5 "AI may.../practitioner owns..." statements | `.body-text` ×5, L10363-10367 | Statements | M11-10 | all 5 narrated individually, in full |
| 51 | "Closing principle" | `.kp-eyebrow`, L10372 | Key-point label | M11-10 | exact |
| 52 | Closing human-value list (trust/touch/empathy/observation/judgment/accountability/hands-on skill/practitioner-client relationship) | `.body-text`, L10377 | Closing list | M11-10 | exact, full 8-item list, none dropped |
| 53 | "AIMT AI Practice Toolkit" + full body description | `.ic-title`+body, L10380-10381 | Info-card | M11-10 | exact, full description, "A, I, M, T" |
| 54 | "A real AI request, with real verification" | `.cp-label.cc-headline`, L10396 | Checkpoint label | M11-11 | folded ("Here's your final checkpoint — a real AI request, with real verification.") |
| 55 | "Module complete." + full body | `.lc-title`+body, L10413-10414 | Completion headline | M11-12 | exact |
| 56 | "Up next — Module 12" + full next-module text | `.lc-next-label`+text, L10416-10417 | Completion handoff | M11-12 | folded ("Up next, Module 12:") |

**Total substantive headings/labels found: 56** (rows 1–56, several rows
representing narrated groups of individually-preserved items — see the
full coverage map below for the item-by-item breakdown of every grouped
row). **Excluded: 1** (row 20, a UI reveal-button label — its content is
narrated in full). **Narrated: 55 of 56 rows, 0 unexplained omissions.**

---

## Full coverage map (source-content inventory)

| Live element | Content | Disposition | Chunk | Checkpoint |
|---|---|---|---|---|
| `.mod-opener` (eyebrow/title/tagline/desc) | Module identity | Title + tagline now narrated directly (v2 fix); desc verbatim | M11-01 | — |
| "In this module" list (5 items) | Tool literacy / better input / human authority / client-supplied AI & scalp analysis / privacy | All 5 named individually as distinct sentences (v1 fix) | M11-01 | — |
| `.mo-attention` | "Pay attention to" note | Narrated verbatim | M11-01 | — |
| Post-opener Cadence/AIMT paragraph | Cadence description | Narrated with narrator-person adapted to first person (post-generation owner correction — see addendum below); all facts preserved | M11-02 | — |
| "AIMT position" key-point | "If you're going to use AI, learn to use it well." | Narrated verbatim, label spoken | M11-02 | — |
| 11.1 title + body | Durable-skill framing | Narrated closely | M11-02 | — |
| 11.1 concept-grid — 4 cards | Language/reasoning, Creative AI, Scalp/hair imaging, Automation/practice — full use-list each | All 4 named individually and in full | M11-02 | — |
| 11.1 closing statement | "Professional-looking output..." + ownership sentence | Narrated verbatim | M11-02 | — |
| 11.2 title + body | Better-input framing | Narrated closely | M11-03 | — |
| B.R.I.E.F. framework — 5 letters | Background/Request/Instructions/Expected Output/Fact-check, each with its helper question | All 5 named individually, in full | M11-03 | — |
| "Build Your B.R.I.E.F." workspace framing | Heading, ungraded tag, starting weak prompt | Narrated in full | M11-03 | — |
| Workspace's own 5 field helper texts | Distinct wording from the framework's 5 helper questions | All 5 narrated individually, in full (v1 fix) | M11-03 | — |
| "A strong example" reveal — 5 completed B.R.I.E.F. fields | Solo-studio Background / 100-word caption Request / calm-tone-no-claims Instructions / one-caption-plus-two-alts Expected Output / full fact-check items | All 5 narrated individually, in full, not thinned | M11-03 | — |
| 11.3 title + body + signature statement | Human-authority framing | Narrated verbatim | M11-04 | — |
| Authority framework — 3 levels | Full title + use-list each (AI-leads / AI-assists-you-verify / keep-human) | All 3 named individually, full use-list each | M11-04 | — |
| 11.3 closing statement | "Use AI for leverage..." | Narrated verbatim | M11-04 | — |
| 11.4 title + body | Scalp/hair analysis framing + benefits list | Narrated closely, full benefits list preserved | M11-05 | — |
| Image-supported example + "Human review" card | Condition label + 87% confidence score; full human-review body | Narrated per alt text/caption only; card body verbatim | M11-05 | — |
| "What can shift the result" — 5 factors | Training data / image quality-lighting / capture conditions / populations represented / independent validation | All 5 narrated individually | M11-05 | — |
| 11.4 closing paragraph | AI-literacy / not-a-diagnostician framing | Narrated verbatim | M11-05 | — |
| 11.5 title + body | Client-supplied-AI framing | Narrated verbatim | M11-06 | — |
| "What a client might say" — 3 statements | ChatGPT/dandruff, uploaded photo/psoriasis, hormonal hair loss | All 3 narrated verbatim | M11-06 | — |
| Hear/Observe/Boundary/Next-step — 4 steps | Full content each; Boundary line verbatim | All 4 narrated individually, in full | M11-06 | — |
| 11.5 closing statement | "The goal is not to defeat the AI answer..." | Narrated verbatim | M11-06 | — |
| Checkpoint 1 (`m11cp1`, "Responding to a client's AI result") | Real rubric question, verbatim | Full, `cc-headline` folded into framing, its own `checkpoint-stop` chunk | M11-07 | **STOP — m11cp1** |
| (post-pass transition) | "Nice work — let's keep going." | Narration-UX only, no source content — new chunk (v2 fix; v1 had no gate here at all) | M11-08 | resume after m11cp1 |
| 11.6 title + body | Privacy framing | Narrated verbatim | M11-08 | — |
| Need/Minimize/Verify — 3 fields | Full body each, Verify unshortened | All 3 narrated individually, in full | M11-08 | — |
| 11.6 closing statement | "Give the tool what the task needs..." + scalp-imagery warning | Narrated verbatim | M11-08 | — |
| 11.7 title + concept-grid — 6 cards | Marketing / Client Communication / Business Thinking / Research (+ verify-outside-it directive) / Training & Staff Development / Administrative Leverage | All 6 narrated individually, full use-list each | M11-09 | — |
| 11.8 title + signature statement | "Modern does not mean less human." | Narrated verbatim | M11-10 | — |
| 5 "AI may.../practitioner owns..." statements | Draft/message, organize/judgment, patterns/communicated, build business/experience, education/human-taught skills | All 5 narrated individually, in full | M11-10 | — |
| "Closing principle" key-point | "Use technology to become more capable — not less present." | Narrated verbatim, label spoken | M11-10 | — |
| Closing human-value list | Trust, touch, empathy, observation, judgment, accountability, hands-on skill, practitioner-client relationship | All 8 items narrated, none dropped | M11-10 | — |
| "AIMT AI Practice Toolkit" info-card | Title + full description (5 listed contents) | Narrated in full (download button/format-hint chrome excluded) | M11-10 | — |
| Checkpoint 2 (`m11cp2`, "A real AI request, with real verification") | Real rubric question, verbatim | Full, `cc-headline` folded into framing, its own `checkpoint-stop` chunk | M11-11 | **STOP — m11cp2** |
| `#m11Complete` title/body/next | Completion + Module 12 preview | Narrated in full, exact match to live copy | M11-12 | resume after m11cp2 |

## Excluded as non-instructional UI (with reason)

- **"See a completed example" button label / `aria-expanded` toggle
  mechanics** — reveal-control chrome; the reveal's actual content (the
  full completed B.R.I.E.F. example) is narrated in full at M11-03.
- **The 5 `.m11-brief-input` textareas themselves and their placeholder
  text** ("e.g. I run a solo head spa studio...", etc.) — per the task
  brief, these are UI mechanics/examples; their substance is already
  covered by the framework + workspace helper text, which is narrated in
  full. Textarea placeholders are illustrative chrome, not required
  curriculum, and narrating them verbatim would duplicate the completed
  example that already covers the same ground more completely.
- **"View full-size example" link** — image-viewer chrome, not lesson
  content.
- **Voice-input mic buttons, "Open Cadence Check →" buttons** —
  interaction controls, not teaching content.
- **`cc-eyebrow`/`cc-title`/`cc-line` state-machine labels** (Ready/In
  Progress/Done variants: "Apply what you just learned.", "Finish your
  thought.", etc.) — dynamic UI state text describing the checkpoint
  widget's own progress, not lesson content (same category every prior
  module's audit excludes).
- **"Download AI Practice Toolkit" button label and "PDF · fillable ·
  download" format hint** — download affordance and file-format
  descriptor; the card's actual title and full body description are
  narrated in full at M11-10. The PDF's own unseen internal contents
  remain correctly unnarrated — nobody on this project has read them,
  and the task brief explicitly excludes them.
- **"Listen with Cadence — coming soon · Includes 2 checkpoint stops"
  footer** — navigation/entry-point UI, not lesson content.
- **"Start Module 12 →" / "Back to course" buttons** — navigation
  controls, not teaching content.
- **All `id`/`class`/`onclick` attributes, inline `<script>` blocks** —
  implementation detail, not visible to a student either way.

No substantive teaching block was found undocumented. Coverage: **100%
of substantive Module 11 content**, all 12 script units (12 narration
chunks, 0 interaction-feedback branches — this module has no
select/feedback interaction), both checkpoints preserved at their real
gate positions (`m11cp1` after 11.5, `m11cp2` after 11.8/Toolkit —
matching the live DOM order re-confirmed in this same fresh read).

## Checkpoint relationship (unchanged from live page, not altered by this pass)

- `m11cp1` — after 11.5 ("When the Client Brings an AI Answer"),
  immediately before 11.6 (confirmed at `headspa-mastery.html:10276-10301`:
  one `<hr class="divider">` and nothing else between the checkpoint card
  and 11.6's section eyebrow). Question, rubric, and grading system
  prompt (`M11.systems.m11cp1`) are untouched. `submitM11CP()` calls
  `submitCheckpoint(11, id, M11.systems[id], M11.questions[id], ...)` —
  moduleId `11` is the literal argument, matching this module's own
  native technical slot (confirmed fresh at `headspa-mastery.html:12772-12774`).
- `m11cp2` — after 11.8 and the Toolkit card, immediately before
  `#m11Complete` (confirmed at `headspa-mastery.html:10388-10411`). Question,
  rubric, and grading system prompt (`M11.systems.m11cp2`) are untouched.

This pass changes narration and gating structure only (splitting two
previously-ungated v1 chunks into two independently-gated
`checkpoint-stop` chunks, each followed by its own `post-pass`
continuation). No checkpoint ID, question text, rubric, grading logic, or
either checkpoint's real on-page position was modified anywhere in this
document or in `headspa-mastery.html`.

## No-fake-interaction-gate confirmation (Section I scope check)

The "Build Your B.R.I.E.F." workspace (11.2) was checked directly against
its live JS (`headspa-mastery.html:12809-12830`) before scripting. It is
explicitly commented in the source as "Purely client-side: no APP_STATE
write, no persistence, no grading, no completion gate, no autoplay" — a
plain five-textarea scratch pad plus one reveal toggle, not the
`.bq-opt`/`interactionFeedback` select-with-feedback pattern Section I.2
governs. Accordingly, M11-03 uses `gateType: normal`, not
`interaction-stop` — no polling, no fake pass condition, no invented
feedback branches, and no requirement that the student fill any field
before narration continues, per the task brief's explicit instruction.

## END-OF-MODULE FIDELITY CHECK (Section G — mandatory, final third)

Scope: **11.6 through completion** (`M11-08` through `M11-12`) — chosen
because this is where Module 11's highest-density remaining multi-item
content lives (11.7's 6 leverage categories, 11.8's 5 human-led
statements and 8-item closing list, and the full Toolkit description),
where the second checkpoint and the Module 12 handoff both live, and
because Section G's own governing incident (Module 6/7) was specifically
a **last-item-in-a-sequence** drop near the end of a module. Re-read side
by side against the live page's own final third
(`headspa-mastery.html:10301-10421`), independently of the full
coverage-map pass above.

- **Headline/card/list thinning check:** 11.6's Need/Minimize/Verify
  framework — all 3 fields present, Verify field's full text ("current
  data and privacy practices, account settings, permission and consent
  requirements, and applicable workplace or business requirements")
  unshortened. 11.7's 6 leverage categories — all 6 present, all use-list
  items preserved, including the Research category's verify-outside-it
  directive ("open the source, check the date"), which is easy to drop
  as a trailing clause and was specifically checked. 11.8's 5 "AI
  may.../practitioner owns..." statements — all 5 present in order, item
  5's different sentence structure (not a "practitioner owns" pattern)
  preserved exactly rather than forced into the other four's template.
  The closing human-value list — compared word-by-word against the live
  page: trust, touch, empathy, observation, judgment, accountability,
  hands-on skill, practitioner-client relationship — all 8 present, last
  item ("the practitioner-client relationship") specifically confirmed
  not dropped. The full Toolkit description's 5 listed contents (B.R.I.E.F.
  framework, AI-use and verification matrix, client-brings-AI response
  framework, privacy/data checks, ready-to-customize practice prompts) —
  all 5 present, last item confirmed not dropped. PASS.
- **Paraphrase creep check:** `m11cp2`'s rubric question compared against
  the real config string at `headspa-mastery.html:11592`, re-read fresh
  this pass — identical, byte-for-byte, not paraphrased. The Toolkit
  card's body text compared clause-by-clause against
  `headspa-mastery.html:10381` — identical. PASS.
- **Exact completion-language match against the live page:** `#m11Complete`'s
  `lc-body` and `lc-next-text` compared against M11-12 — exact match, not
  a paraphrase, including the specific phrase "Take a moment — you built
  something real." PASS.
- **Exact checkpoint placement (immediately after the element it gates,
  in live DOM order):** `m11cp1` narrated (M11-07) immediately follows
  11.5's content (M11-06), matching `headspa-mastery.html:10274-10278`.
  `m11cp2` narrated (M11-11) immediately follows the Toolkit card
  (M11-10), matching `headspa-mastery.html:10386-10390`. Both re-verified
  fresh this pass. PASS.
- **Stronger-paraphrase-than-earlier-sections check** (the specific
  failure mode this rule targets — the module getting looser toward the
  end): not found. The back half (11.6–11.8 + Toolkit) is narrated at the
  same Reference Voice density as the front half (11.1–11.5) — every
  category/field/list item named individually throughout, front to back.
- **Missing next-module handoff:** `#m11Complete`'s `lc-next` block is
  present in M11-12, in full, not dropped.
- **Combined-checkpoint and answer-above defects specifically re-checked**
  (two of the three defects this rebuild exists to fix, both of which
  fall inside this check's scope): confirmed fixed — `m11cp2` is now its
  own isolated `checkpoint-stop` chunk (M11-11), separated from all of
  11.6–11.8/Toolkit by the `m11cp1` post-pass chunk (M11-08) and the
  intervening normal-gate chunks (M11-09, M11-10); both checkpoint
  closings in this final-third scope read "answer below," never "answer
  above."

**END-OF-MODULE FIDELITY CHECK result: PASS.**

## TTS preflight (before generation)

`node scripts/aimt-listen-tts-preflight.mjs` run against the full
`docs/course-audit/listen-mode/tts-final/` tree (125 batch payloads
course-wide): **8 pre-existing failures, all in other modules** (Modules
00, 02, 03 ×2, 05 ×2, 06 ×2 — the exact already-documented "answer above"
defects named in `00-listen-mode-editorial-standard.md` Section H,
unrelated to this task and explicitly out of scope for a Module 11
rebuild). **All 12 of this module's `M11-BATCH-*.txt` payloads pass with
zero failures**: 0 occurrences of bare/standalone "AIMT," 0 occurrences
of hyphenated "A-I-M-T," 0 occurrences of dotted "A.I.M.T," 0 occurrences
of "answer above"/"respond above"/"your answer is above" phrasing, 0
un-narrated structural/editorial brackets, 0 literal chunk IDs embedded
in spoken text, and every batch comfortably under the 4,500-char safety
margin — the largest batch (`A3`, the full B.R.I.E.F. section) is 1,871
characters, well under half the ceiling. Total module (current,
post-corrections): 12 batches, 10,958 characters.

| Batch | Chunk | Chars | Gate |
|---|---|---:|---|
| A1 | M11-01 | 815 | normal |
| A2 | M11-02 | 1,377 | normal |
| A3 | M11-03 | 1,871 | normal |
| A4 | M11-04 | 999 | normal |
| A5 | M11-05 | 1,049 | normal |
| A6 | M11-06 | 1,337 | normal |
| B1 | M11-07 | 304 | checkpoint-stop (m11cp1) |
| B2 | M11-08 | 751 | post-pass (m11cp1) |
| B3 | M11-09 | 708 | normal |
| B4 | M11-10 | 1,090 | normal |
| B5 | M11-11 | 338 | checkpoint-stop (m11cp2) |
| C1 | M11-12 | 319 | post-pass (m11cp2) |

**AIMT pronunciation note:** this module uses the comma-separated "A, I,
M, T" form (3 occurrences: philosophy/position/Toolkit title) rather
than the literal single-spaced instruction, matching Module 10's
owner-confirmed fix. Neither form is rejected by the automated preflight.
See the script doc's "AIMT pronunciation" section for the full reasoning.

**B.R.I.E.F. pronunciation — corrected post-generation, see addendum
below.** The framework NAME (not the individual-letter teaching
sequence) is now spoken as the ordinary word "brief," per owner
correction — see the second addendum below for the full account.

## Addendum (2026-09-20): narrator-perspective correction — narrow, not a re-audit

Scope note: this addendum documents one targeted correction found and
fixed after the pre-generation gates above already passed and audio
generation was underway. It is **not** a re-run of the coverage-map or
end-of-module fidelity passes above — those results stand unchanged. The
only thing corrected is grammatical narrator person in one paragraph;
zero substantive/factual content changed anywhere in this module.

**Defect:** M11-02's post-opener paragraph originally preserved the live
page's third-person description of Cadence verbatim ("...through
Cadence. ...Cadence is an AI learning-support tool..."). At the time this
audit was first written, that was treated as a *fix* — reasoning that
Reference Voice should transcribe visible source text without
grammatical-person changes, and that rewriting it (as v1 had, in the
opposite direction) was an invented rewrite. **Owner correction:** that
reasoning does not apply here. Cadence is Listen Mode's own narrator, and
a narrator must never refer to herself in third person while speaking —
the same principle already governing the course-wide "I'm Cadence"
self-introduction (Module 0/0-v2) and "From Cadence:" quote-attribution
(Module 4) conventions. Only narrator grammatical person adapts; no fact
changes.

**Correction applied:** "through Cadence" → "through me"; "Cadence is an
AI learning-support tool" → "I'm an AI learning-support tool". The
sentence "AI can make education and practice more useful and responsive,
but it does not replace the human expertise behind it" is unchanged —
"it" there refers to AI generically, not to Cadence by name, so no
narrator-person issue applies.

**Scope check performed:** every other Module 11 chunk (M11-01, M11-03
through M11-12) was grepped fresh for "Cadence" — no other occurrence
exists in this module. Course-wide, every other module's "Cadence"
mention was also checked: all are either already first person ("I'm
Cadence"), a named-feature reference ("Listen with Cadence", "Ask
Cadence", "Practitioner Conversation with Cadence"), or a quote
attribution ("From Cadence:") — none are narrator self-reference in
third person. This module's original M11-02 was the only defect found
course-wide.

**Batches affected:** only `A2` (chunk M11-02). All 11 other Module 11
batches are untouched — confirmed byte-identical before and after this
correction.

**Audio disposition:** `A2`'s original generation (`generationId
5DdArQtokYFD2nmkvDJn`, third-person, already downloaded/converted/logged
before this correction) is archived, not deleted, at
`AIMT-Listen-Mode-Final/11-Module-11/archive-superseded-narrator-fix/`.
The corrected regeneration (`generationId oGLfDoyhRE8iEFjIQ7aj`,
first-person, 114.0s, 1377 chars, $0.227205) is the current `A2` audio,
validated (`EDIT.wav` decodes 114.05s, within 0.05s of the ElevenLabs-
reported duration) and logged in `GENERATION-LOG.json` with `"pass":
"v2-strict-fidelity-narrator-person-fix"`, cross-referencing the
superseded generation ID.

## Addendum 2 (2026-09-20): B.R.I.E.F. framework-name pronunciation correction — narrow, not a re-audit

Scope note, same as Addendum 1: this documents one targeted
pronunciation correction found after audio generation was complete. Not
a re-run of the coverage-map or end-of-module fidelity passes above —
those results stand. Zero substantive/factual content changed; visible
course text (`headspa-mastery.html`) was not touched anywhere.

**Defect:** the framework NAME was originally spoken comma-separated
("B, R, I, E, F"), reasoning by analogy to the AIMT fix that the letters
spell the real word "brief" and could collapse into it if left as
"B.R.I.E.F." **Owner correction:** the framework name should simply be
spoken as the ordinary word "brief" — there is no collision risk to
guard against here the way there was with "AIMT" (which risked
collapsing into "aim" plus "T," a *different* word than intended);
"B.R.I.E.F." spells "brief" exactly, so the natural word *is* the
correct pronunciation, not a defect to avoid.

**Correction applied (framework NAME only):** "Give AI a Better
B.R.I.E.F." → "Give AI a better brief"; "Build Your B.R.I.E.F." (workspace
heading) → "Build your brief"; "B.R.I.E.F. prompt framework" (Toolkit
description) → "brief prompt framework." **Explicitly not touched:** the
individual-letter teaching sequence in M11-03 ("B, Background... R,
Request... I, Instructions... E, Expected Output... F, Fact-check...")
— Cadence still spells these letters individually because she is
teaching what each one stands for, a different narration purpose than
naming the framework as a whole.

**Scope check performed:** grepped fresh for every "B, R, I, E, F" /
"B.R.I.E.F." / "BRIEF" spelling across all 12 current Module 11 batches.
Found in exactly 2 batches, 3 occurrences total (2 in `A3`, 1 in `B4`).
No other batch references the framework name. The letter-teaching
sequence (also in `A3`) was confirmed byte-identical before and after —
only the 2 name references in that same batch changed.

**Batches affected:** `A3` (chunk M11-03) and `B4` (chunk M11-10). All
10 other Module 11 batches are untouched — confirmed byte-identical
before and after this correction (char counts unchanged: A1 815, A2
1,377, A4 999, A5 1,049, A6 1,337, B1 304, B2 751, B3 708, B5 338, C1
319).

**Audio disposition:** `A3`'s original generation (`generationId
AnGkq1s90wXh7kjkSRiz`, comma-spelled, 155.92s, 1,888 chars) and `B4`'s
original generation (`generationId WoMAL3MiGfQ1eqMe5MHB`, comma-spelled,
102.88s, 1,099 chars) are both archived, not deleted, at
`AIMT-Listen-Mode-Final/11-Module-11/archive-superseded-pronunciation-fix/`.
The corrected regenerations — `A3` (`generationId gB9MqHbBwbgCiGZLmyl0`,
160.64s, 1,871 chars, $0.308715) and `B4` (`generationId
QT3zz1cbMFvB8mRvU6PK`, 96.56s, 1,090 chars, $0.17985) — are the current
audio, both validated (`EDIT.wav` decodes within 0.04s of the
ElevenLabs-reported duration) and logged in `GENERATION-LOG.json` with
`"pass": "v2-strict-fidelity-brief-pronunciation-fix"`, cross-referencing
their respective superseded generation IDs. Additional cost for this
correction: $0.488565 (two regenerations).

**Permanent rule added:** see `00-listen-mode-editorial-standard.md`
Section K.
