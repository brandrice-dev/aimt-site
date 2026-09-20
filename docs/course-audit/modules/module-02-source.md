# Module 2 — Source Extraction

Extracted verbatim from `headspa-mastery.html` and `assets/js/headspa-state.js`
as they exist on branch `course-audit-build`, commit `67d4426` (top of
history at extraction time). Wording is copied exactly — nothing here has
been rewritten, corrected, summarized, or improved. This is a record of the
*current* experience, not a proposal.

Confirmed findings are separated from assumptions in section 11.

---

## 1. Module identity

| Field | Value |
|---|---|
| Module number | `2` |
| Student-facing title (`MODULE_TITLES[2]`) | `Module 2 — Welcoming Your Client` |
| Home-screen dashboard subtitle (`.mr-sub` for row 2) | `Intake, rituals, first contact` |
| Module hero eyebrow (in-lesson) | `Module 2 · Welcoming Your Client` |
| Module hero title | `The experience begins<br>before your hands do.` |
| Module hero description | `Everything in this module happens before the scalp is touched. That's the point. The first five minutes shape how the client receives every minute that follows.` |
| Module wrapper ID | `module2Wrap` |
| JS module identifiers | `M2` (const, questions + system prompt), `MODULE_GUIDE_SYSTEMS[2]`, `MODULE_QUICK_PROMPTS[2]`, `MODULE_TITLES[2]`, `MODULE_CHECKPOINTS['2']`, `MODULE_CP_COUNTS['2']`, `MODULE_MEMORY_TAGS[2]` (headspa-state.js) |
| Checkpoint ID | `m2cp1` (container/textarea id `m2cp1In`/button `m2cp1Btn`/result `m2cp1Res`) — status pill `m2cp1Status` created at runtime by `ensureCheckpointStatusElement` |
| Home-screen row markers | `mnum-2`, `mbadge-2` |
| Completion card ID | `m2Complete` |
| Static routing entry | `STATIC_MODULES[2]` inside `openModuleById()`: `() => { const w = document.getElementById('module2Wrap'); if (w && wrap) wrap.innerHTML = w.innerHTML; setTimeout(() => { const fs = document.getElementById('feelingSlider'); if (fs) updateFeeling(fs.value); }, 100); }` — the only module routing entry that runs extra post-render JS (initializing the feeling-slider output text) |

Module 2 is the most interaction-dense module extracted so far: in addition
to its one required checkpoint, it contains four distinct ungraded/
semi-graded interactive components (interactive timeline, "what breaks the
moment" quiz, an AI-evaluated script-writing exercise, and a feeling
slider) — documented in full in section 5.

---

## 2. Module 2 curriculum

Copied exactly from `module2Wrap` (`headspa-mastery.html:4360`–`4573`), in
student-encounter order.

### Hero

- Eyebrow: `Module 2 · Welcoming Your Client`
- Title: `The experience begins before your hands do.`
- Description: `Everything in this module happens before the scalp is touched. That's the point. The first five minutes shape how the client receives every minute that follows.`

### The arrival sequence (interactive timeline)

- Eyebrow: `The arrival sequence`
- Title: `Five moments. In this order. Every time.`
- Body: `Tap each step to understand why it exists — not just what it is.`
- Interaction hint: `↓ Tap each step to expand`

Five collapsible timeline items (`.timeline-item` + `.tl-detail`), each
collapsed by default (`display:none` until `.open` is toggled):

**01 — Intake form** (subtitle: `Before they arrive`)
> The intake form is not paperwork. It is preparation — for both of you. When a client fills it out, they begin thinking about their scalp, their habits, and what they want from the service. They arrive more engaged. You arrive knowing what to adjust before they walk in. Review it before they enter the treatment space. Look for sensitivities, scalp discomfort notes, stress levels, anything that changes your approach. That level of preparation is what separates a reactive service from a controlled one.

**02 — Physical preparation** (subtitle: `Spa attire, access, comfort`)
> Guests change into a spa wrap and warm robe. Top layers, bra, and intrusive jewelry are removed — giving you full access to the shoulders, neck, and upper back. Without this, massage work becomes restricted and the service loses fluidity. But this step is also psychological. When you guide it clearly and calmly, the client feels taken care of rather than unsure of what to do next. Uncertainty at this stage creates tension that follows them into the service.

Highlight callout (`.tld-highlight`):
> The sock detail — each guest receives a complimentary pair of fuzzy slipper socks. Low cost. Consistent emotional response. It signals thoughtfulness and sets this apart from a standard appointment before the service has started.

**03 — The tea ritual** (subtitle: `Calming the nervous system`)
> A curated tea menu featuring calming herbal blends. Not aesthetic — physiological. Holding a warm beverage slows the body, lowers nervous system arousal, and creates a moment of pause. For first-time guests especially, there is underlying uncertainty. They don't fully know what to expect. This moment allows them to transition out of that uncertainty and into the experience. You are not just preparing the body. You are preparing the state of mind. A mentally settled client responds better to touch, relaxes more deeply, and perceives the service as more immersive.

**04 — First contact** (subtitle: `Aromatherapy & touch introduction`)
> This is the most important and most overlooked moment in the entire pre-service sequence. A head spa is intimate. Some clients feel uneasy being touched by someone they don't yet know. If you don't manage this intentionally, the first part of your service can feel abrupt.

Highlight callout (`.tld-highlight`):
> The aromatherapy process: present three clearly different essential oil blends — earthy, fresh, mint-forward. Use the intake form to remove anything the client is sensitive to. Ask them to close their eyes. Then — before they close them — gently place your hand on their shoulder. That hand stays there through the entire selection. It is not removed until they choose. This introduces touch gradually, creates grounding, and builds subconscious trust. By the time hands-on work begins, your touch already feels familiar.

**05 — Setting the tone** (subtitle: `Guide, don't overwhelm`)
> During this phase your job is to guide — not explain. You do not need to walk the client through every step before it happens. Clients should feel informed, comfortable, and guided — but not overloaded. One simple statement is usually enough: "I'll walk you through everything as we go, but this is a fully guided service — you can just relax and let me take care of everything." That language builds trust and reduces tension. Then you begin.

### "What breaks the moment?" (quiz interaction)

- Eyebrow: `Test yourself`
- Title: `What breaks the moment?`
- Body: `Each of these scenarios happens at the start of the service. Tap the one that does the most damage to the experience.`

Four options (`.bq-opt`, real `<button>` elements), one marked correct in
the `onclick` handler's second argument:

1. `You take 90 seconds longer than usual getting the tea ready` — incorrect
2. `You forget to offer the slipper socks` — incorrect
3. `You rush the client through changing because the previous appointment ran long` — **correct**
4. `You only have two essential oil options instead of three` — incorrect

Feedback (`#bqFeedback`), shown after any option is picked:
- If correct: `Exactly right. Rushing the beginning is the most damaging mistake because it creates a feeling of being processed rather than welcomed. Everything that follows is colored by it.`
- If incorrect: `The right answer is rushing the client through changing. The other options are minor imperfections — they do not fundamentally change how the client feels. But rushing signals to the nervous system that this is transactional.`

### The aromatherapy script (AI-evaluated writing exercise)

- Eyebrow: `Your voice`
- Title: `The aromatherapy script — in your own words.`
- Body: `This is the script used at Atrium. Read it. Then scroll down and write your own version — your voice, your phrasing, the same intent.`

Reference script card (`.script-card`), label `Atrium script`:
> "Before we begin your session, we're going to sample a few essential oil blends. Whichever one you enjoy most will be used throughout your service for your aromatherapy. I'm going to have you close your eyes to help heighten your sense of smell, and I'll guide you through each option."

Student input area, label `Write yours`:
- Placeholder: `Same intention, your voice. How would you say this?`
- Button: `Get Cadence's feedback →`
- Feedback region: `#scriptFeedback`, shows `Reading your script...` while pending

### Practitioner insight (feeling slider)

- Eyebrow: `Practitioner insight`
- Title: `The client decides before you start.`
- Body: `They don't remember exactly what you did first. They remember how they felt in the first five minutes. Slide to see how the beginning shapes the whole service.`

Slider (`#feelingSlider`, range 1–5, default value 3), labels: `Rushed`,
`Uncertain`, `Neutral`, `Guided`, `Immersed`. Output text
(`FEELING_STATES`, `headspa-mastery.html:6869`):

| Value | Label | Text |
|---|---|---|
| 1 | Rushed | When the beginning feels rushed — the client carries that into the entire service. Their nervous system stays elevated. Touch does not land the same way. They leave satisfied but not transformed. |
| 2 | Uncertain | When the beginning feels uncertain — the client spends the first part of the service figuring out what is happening rather than experiencing it. |
| 3 | Neutral | A neutral beginning is fine. The client is not uncomfortable. But they are also not yet in the experience. |
| 4 | Guided | When the beginning feels guided — the client hands over control early. Their body follows. By the time your hands are on the scalp, they are already partially in the experience. |
| 5 | Immersed | When the beginning feels immersive — the client forgets the outside world exists before the service has technically started. These are the clients who rebook before they leave. |

### 2.6 — What goes wrong

- Eyebrow: `2.6 — What goes wrong`
- Title: `Mistakes that break the beginning.`
- Body: `These are not rare. They happen in real services when practitioners treat the pre-service sequence as casual instead of structured.`

Four condition cards (`.condition-card`, red badge `#c0392b`):

| Title | Text |
|---|---|
| Rushing the beginning | The most damaging mistake. When the beginning feels rushed, the client's nervous system stays elevated. Touch doesn't land the same way. They leave satisfied but not transformed. |
| Giving unclear instructions | If a client hesitates — wondering where to go, what to remove, what happens next — the experience already feels less controlled. Uncertainty at this stage follows them into the service. |
| Skipping first contact | Moving straight into the service without establishing touch makes the first contact feel abrupt. The client may stay slightly guarded for the first several minutes — and you can't recover that lost ground. |
| Over-explaining | Clients should feel guided, not briefed. Long explanations create cognitive load. They come to relax — not to process information. One clear sentence beats five hesitant ones. |

Info card, title `What this looks like in real life`:
> A client walks in and isn't sure where to go.
>
> **Weak response:** "Yeah just go ahead and change, you can put your stuff anywhere."
>
> **Strong response:** "Go ahead and change into the wrap, remove your top layers and any jewelry, and take your time. I'll be right outside when you're ready." Clarity removes tension immediately — before the service has started.

### 2.7 — Consistency

- Eyebrow: `2.7 — Consistency`
- Title: `You are not improvising. You are delivering.`
- Body: `Everything in this module should be repeatable. That is the point. Intake, changing, tea, aromatherapy, first contact, tone of voice — when these steps are consistent, clients feel safe, taken care of, and confident in your process. Consistency is what allows a service to scale, whether that means building a team or simply delivering a high-level experience every time.`

Info card, title `The question to ask yourself after every service`:
> Could my next client walk in right now and have the exact same pre-service experience as the one who just left? If the answer is no — something in this sequence is being treated as optional. Nothing in this module is optional.

No numbered sections 2.1–2.5 exist as `.sec-eyebrow` labels — the module
goes straight from the hero into the unlabeled interactive timeline/quiz/
script/slider sequence, then resumes numbering at **2.6**. There is no
content gap; this is simply how the section numbering is structured in the
source (see section 11, confirmed finding).

### Button labels used in Module 2

- `Get Cadence's feedback →` (script builder)
- Checkpoint submit (arrow icon, no text label) — `id="m2cp1Btn"`
- Voice input button — `title="Speak your answer"`, no visible text
- `Start Module 3 →`
- `Back to course`

---

## 3. Module 2 checkpoint

Single required checkpoint (`MODULE_CHECKPOINTS['2'] = ['m2cp1']`).

| Field | Value |
|---|---|
| Label above question | `Check your understanding` (`cp-label`) |
| Exact displayed question (`.cp-q`) | `A new client arrives visibly stressed — she's been rushing and apologizes for being two minutes late. Walk me through the first five minutes of her experience. What do you do, in what order, and what specifically are you trying to accomplish with each step?` |
| Placeholder | `Walk me through it step by step...` |

### Do the displayed and evaluated questions match?

**No.** `M2.questions.m2cp1` (`headspa-mastery.html:6483`) — the string
actually interpolated into `M2.system` and sent as `'Checkpoint question:
...'` in the evaluator's user message — reads:

> A new client arrives visibly stressed after rushing. Walk through the first five minutes of her experience.

This is shorter than the displayed question and omits the "apologizes for
being two minutes late," "what do you do, in what order," and "what
specifically are you trying to accomplish with each step" framing. This is
the same displayed-vs-evaluated mismatch pattern confirmed for Module 1
before its rewrite (see `module-01-source.md` §9, finding #1).

### Complete grading prompt

Built in `submitCheckpoint()` from these pieces, concatenated in order —
identical composition mechanism to every module:

1. **Base system** (`M2.system`, a function of the question `q`, `headspa-mastery.html:6485`):
   > You are Cadence, instructor of HeadSpa Mastery. Module 2 checkpoint. Question: "{q}". Key concepts: arrival sequence is intake review, physical prep with spa attire, tea ritual to lower the nervous system, aromatherapy with intentional first touch, guided tone-setting. Each step has a physiological or psychological purpose. The beginning shapes everything. Respond specifically to what they wrote. 3-5 sentences, warm and direct.

   `{q}` here is `M2.questions.m2cp1` (the short version above).
2. `CADENCE_RESPONSE_CONSISTENCY_ANCHOR`, `CADENCE_SELECTIVE_MEMORY_INSTRUCTION`, and `APP_STATE.getCadenceMemoryContext(2, 'checkpoint')` — shared, unchanged.
3. Inside `evaluateCheckpointAnswer()`: `CADENCE_CHECKPOINT_TONE`, the generic ambiguous/partial/generic-answer instruction — **plus a Module-2-specific criteria block, unique among all checkpoints extracted so far**:

   > Checkpoint-specific criteria (first five minutes): pass answers that clearly sequence the opening experience and show applied judgment, including most of the following: intentional pacing, physical transition into the space, client regulation/nervous-system downshift, minimal grounded communication, intentional first touch or clear transition into service, and why each step matters.
   > Do not require exact wording or a rigid ritual checklist if the reasoning is strong and practice-ready.
   > Still fail answers that are generic, unordered, shallow, or limited to broad comfort language without operational detail.

   This block (`headspa-mastery.html:6225`–`6232`, inside `evaluateCheckpointAnswer()`) is injected only `if (/first five minutes of her experience/i.test(question || ''))` — a regex match against the question text, not a module-ID check. `M2.questions.m2cp1` contains that exact phrase, so it fires reliably for Module 2's checkpoint. No other module's question currently matches this regex.
4. `CADENCE_FEEDBACK_MICRO_RULES` and `CHECKPOINT_EVAL_FORMAT` — shared, unchanged.

### Pass criteria

Module 2 is the only module (besides the rewritten Module 0/1) with any
itemized pass guidance at all — the checkpoint-specific criteria block
above lists five soft-required elements ("most of the following"), an
explicit instruction not to require exact wording, and an explicit
instruction to still fail generic/shallow answers. There is no explicit
"do not fail for grammar/spelling" instruction specific to Module 2 (only
the shared, generic instructions apply).

### Revision / attempt / state behavior

Identical to every other module — governed entirely by the shared
`submitCheckpoint()`, `evaluateCheckpointAnswer()`,
`normalizeCheckpointEvaluation()`, `APP_STATE.setCheckpointResult()`,
`APP_STATE.captureCheckpointMemory()`, `APP_STATE._checkModuleComplete()`,
`resolveModuleCompletionUI()`, `renderCheckpointOutcomeLabel()`, and
`applyCheckpointInputState()` (full mechanics documented in
`module-00-source.md` §4). `submitM2CP(id)`
(`headspa-mastery.html:6896`) is a thin wrapper:
`submitCheckpoint(2, id, M2.system, M2.questions[id])` — no custom
`errorMessage` 5th argument, so a network failure shows the shared default
text: `Cadence didn't respond — check your connection and try again.`

`m2cpKey(e, id)` (`headspa-mastery.html:6899`): Enter without Shift
submits, Shift+Enter inserts a newline (same pattern as every module).

### Accessibility

The voice button relies on `title="Speak your answer"` only (no
`aria-label`); the submit button has no accessible name beyond the SVG
icon; `.cp-res` has no `aria-live`. Same starting state as Module 1 before
its accessibility corrections.

---

## 4. Cadence context

### Module-specific guide context (`MODULE_GUIDE_SYSTEMS[2]`, `headspa-mastery.html:6567`, verbatim)

> You are Cadence — a mentor built from nearly two decades in the head spa industry. The student is in Module 2 (Welcoming Your Client): intake, spa attire prep, tea ritual, aromatherapy with first intentional touch, tone-setting. The beginning shapes everything. If the student has a service background, connect this to how the head spa arrival sequence differs from and elevates what they already know — always in the context of scalp wellness and head spa. 3-5 sentences. No bullet points.

Composed at call time (`getGuideSystem()`) with the same
`CADENCE_RESPONSE_CONSISTENCY_ANCHOR` + `CADENCE_SELECTIVE_MEMORY_INSTRUCTION`
+ `getCadenceMemoryContext(2, 'guide')` additions used everywhere.

### Suggested prompts (`MODULE_QUICK_PROMPTS[2]`, `headspa-mastery.html:6582`)

- `Why does the tea ritual matter?`
- `How does the first touch work?`
- `What if a client skips the intake?`

### Module-open Cadence greeting (`headspa-mastery.html:6821`)

> Module 2 is some of my favorite material to teach because the details here are what clients actually remember. The beginning of a service shapes everything that follows.

### Memory tags (`MODULE_MEMORY_TAGS[2]`, `assets/js/headspa-state.js:134`)

```
2: ['service-flow', 'client-calming', 'client-guidance']
```

### Script-evaluation system prompt (separate from checkpoint grading)

`evaluateScript()` (`headspa-mastery.html:6882`) builds its own,
independent system prompt — it does **not** go through
`submitCheckpoint()`/`evaluateCheckpointAnswer()`, has no pass/fail JSON
contract, and never touches `APP_STATE`:

> You are Cadence, instructor of HeadSpa Mastery. A student just wrote their own version of the aromatherapy introduction script for Module 2. The original script: "Before we begin your session, we are going to sample a few essential oil blends. Whichever one you enjoy most will be used throughout your service for your aromatherapy. I am going to have you close your eyes to help heighten your sense of smell, and I will guide you through each option." Evaluate the student's version. Does it: 1) set up the experience clearly, 2) invite the client to close their eyes, 3) stay calm and guided in tone, 4) avoid over-explaining? Give specific, warm feedback in 2-3 sentences.

Followed by `CADENCE_RESPONSE_CONSISTENCY_ANCHOR`. Called via
`callAI(sys, [{ role: 'user', content: text }], 300)` — raw text response,
not JSON, rendered directly into `#scriptFeedback`.

### Tone instructions / restrictions / fallback

Same shared behavior as every module for the guide panel and the required
checkpoint. The script-builder feedback has its own, narrower fallback:
`Something went wrong — try again.` (`headspa-mastery.html:6892` — distinct
from both the shared checkpoint fallback and the shared guide-chat
fallback).

### References to the old course name

Confirmed occurrences directly inside Module 2's own code path:

- `M2.system` (`headspa-mastery.html:6485`): `"You are Cadence, instructor of HeadSpa Mastery. Module 2 checkpoint..."`
- `evaluateScript()`'s inline system prompt (`headspa-mastery.html:6888`): `"You are Cadence, instructor of HeadSpa Mastery. A student just wrote their own version..."`

`MODULE_GUIDE_SYSTEMS[2]` does not itself name the course (consistent with
every module's guide-system string).

---

## 5. Current interactions

| Interaction | What the student does | Graded? | Persists? | Success/failure behavior | HTML IDs | Related JS |
|---|---|---|---|---|---|---|
| Read curriculum | Scroll and read | No | Read-percent tracked via scroll listener | Contributes 70% of progress-bar weight | `.lesson-wrap` sections | `setReadProgress` |
| Interactive timeline (5 steps) | Tap a step to expand/collapse its detail | No | No — resets every time the module is (re)opened; no state stored anywhere | Only one step open at a time (opening a new one closes the previous); no pass/fail | `#timeline`, `.timeline-item`, `#step-0`…`#step-4` (`.tl-detail`) | `openStep(idx)` |
| "What breaks the moment?" quiz | Tap one of four options | Ungraded (no completion/progress effect), but has a single correct answer with distinct feedback | No | Correct: green-ish styling + affirming feedback text. Incorrect: all options disabled/dimmed, feedback explains the correct answer. **No retry** — all four buttons are disabled (`opts.forEach(o => { o.disabled = true; ... })`) the instant any option is clicked, so the student cannot change their answer or try again | `#breakQuiz`, `.bq-opt` (×4), `#bqFeedback` | `breakAnswer(btn, isCorrect)` |
| Aromatherapy script builder | Write a free-text script, click "Get Cadence's feedback" | Ungraded — no pass/fail, no JSON contract, no completion/progress effect | No | AI-generated freeform feedback (2–3 sentences) rendered into the page; on failure, generic error text | `#scriptInput`, `#scriptFeedback`, button `.sb-btn` | `evaluateScript()` |
| Feeling slider | Drag a 1–5 range input | No | No | Updates `#feelingOutput` text live via `oninput`; defaults to value 3 ("Neutral") on module load via the `STATIC_MODULES[2]` post-render `setTimeout` | `#feelingSlider`, `#feelingOutput` | `updateFeeling(val)`, `FEELING_STATES` |
| Checkpoint `m2cp1` | Free-text answer, submit | Yes (model-graded pass/fail, with Module-2-specific criteria injected) | Yes — `checkpointMeta.m2cp1` | Status pill `Accepted`/`Needs revision`; pass required for module completion | `m2cp1`, `m2cp1In`, `m2cp1Btn`, `m2cp1Res`, `m2cp1Status` | `submitM2CP`, `submitCheckpoint`, `evaluateCheckpointAnswer` |
| Voice input on checkpoint | Click mic, speak answer | N/A (fills textarea) | Only once submitted | Text populates the textarea | mic button inside `.cp-row` | `startVoice('m2cp1In', this)` |
| "Start Module 3 →" | Click after completion | No | Navigates + sets `currentModule` | Opens Module 3 | inside `#m2Complete` | `openModuleById(3)` |
| "Back to course" | Click after completion | No | Sets view to home | Returns to course home | inside `#m2Complete` | `showHome()` |
| Guide panel (Cadence chat) | Open panel, ask a question or tap a quick prompt | No | Chat history in-memory only, capped at 16 | Streamed response or shared error fallback | `guideBtn`, `guidePanel`, `gpMsgs`, `gpInput`, `quickPs` | `toggleGuide`, `gpSend`, `qa`, `getGuideSystem` |

### Which interactions are graded / ungraded / persistent / completion-gating

- **Completion-gating (required):** checkpoint `m2cp1` only.
- **Graded but not completion-gating:** none — the "what breaks the moment"
  quiz has a correct/incorrect answer but does not write any state and has
  no effect on progress or completion.
- **Ungraded and non-persistent:** interactive timeline, feeling slider,
  aromatherapy script builder (AI feedback is generated but not scored
  pass/fail and not stored).
- **Persistent:** only `checkpointMeta.m2cp1` (via the shared checkpoint
  machinery) and the general read-percent/scroll-position tracking that
  every module has.

---

## 6. Completion behavior

### Exact completion requirements

- The single required checkpoint `m2cp1` must reach `status: 'passed'`
  (`MODULE_CHECKPOINTS['2'] = ['m2cp1']`).
- No read-percentage minimum, and none of the four ungraded interactions
  (timeline, quiz, script builder, slider) are required — a student could
  pass `m2cp1` without ever opening a timeline step, answering the quiz,
  writing a script, or moving the slider.

### Completion message (`#m2Complete`)

- Gold mark: `✦`
- Title: `Module complete.`
- Subtitle: `You know how to receive a client. Now you need to understand what's underneath your hands.`

No separate eyebrow/status line and no distinct "competencies shown" line
exist here — same pre-rewrite structure Module 0 and Module 1 both had
before their audits.

### Next-module language

- Next-up label: `Up next — Module 3`
- Next-up text: `Module 3 is the science — hair structure, scalp anatomy, the growth cycle. Once it clicks, every decision you make at the treatment bed will have a reason behind it that you can explain to a client in plain language.`
- Primary button: `Start Module 3 →` → `openModuleById(3)`
- Secondary button: `Back to course` → `showHome()`

### Relevant state and functions

Same shared completion path as every module —
`setCheckpointResult` → `_checkModuleComplete` → `resolveModuleCompletionUI`.
`canAccessModule(3)` requires `isModuleComplete(2)` — Module 2 is the sole
gate for unlocking Module 3.

---

## 7. Accessibility behavior (module-wide)

- **Timeline items are `<div class="timeline-item" onclick="openStep(idx)">`
  — not buttons.** No `tabindex`, no `role="button"`, no keyboard handler,
  no `aria-expanded` on the item and no `aria-hidden`/live-region
  relationship to its `.tl-detail` panel. A keyboard-only or
  screen-reader user has no way to discover or activate these five
  accordion triggers through normal means (see section 11).
- **The quiz options (`.bq-opt`) are real `<button>` elements** — keyboard
  focusable and activatable by default. However, correct/incorrect state
  is communicated primarily through color and opacity
  (`.bq-opt.correct` / `.bq-opt.wrong`), with the fuller explanation
  living only in the separate `#bqFeedback` paragraph below the buttons,
  not on the button itself (no textual "Correct"/"Incorrect" label on the
  button, unlike the Welcome Module's and Module 1's rewritten practice
  interactions).
- **The script-builder textarea and button have no `aria-label`** beyond
  their visible text/placeholder; the feedback region (`#scriptFeedback`)
  has no `aria-live`, so a screen-reader user would not be automatically
  notified when AI feedback arrives.
- **The feeling slider (`<input type="range">`) has no `aria-label`**
  beyond its visual labels row, and `#feelingOutput` has no `aria-live`,
  so a screen-reader user moving the slider would not be automatically
  notified of the updated description text.
- **The checkpoint** has the same gaps documented in section 3
  (Accessibility).

---

## 8. Mobile / interaction concerns visible from the implementation

- The timeline's five detail panels use `animation: slideDown 0.25s ease`
  on open — no `prefers-reduced-motion` handling exists anywhere in this
  module (consistent with the rest of the app prior to the Welcome
  Module's reduced-motion work, which was scoped only to the intro
  cinematic).
- The quiz's "no retry" behavior (all four options permanently disabled
  after one click) is a meaningfully different interaction pattern than
  the "student may change the selection and see the correct reasoning"
  requirement the Welcome Module and Module 1's approved practice
  interactions were built to satisfy — see section 11.
- No explicit touch-target sizing was found for the timeline items, quiz
  buttons, or slider thumb; all reuse standard padding already used
  elsewhere in the app (not measured against a specific minimum in this
  extraction).

---

## 9. Guided Completion Path fields

Per `00-global-decisions.md` ("Guided Completion Path" → "Required fields
for every future module audit"). All time estimates below are **unmeasured
approximations derived from content volume**, not timed/tested figures.

- **Estimated attentive learning time:** Module 2's curriculum body text
  (including all five timeline details, the quiz options, the script-card
  reference text, and the feeling-slider states) is approximately 1,270
  words. A careful, attentive read — appropriate given the operational
  detail in this module — is roughly **8–10 minutes** for the always-visible
  text; opening and reading all five timeline steps adds their content on
  top of that (already included in the word count, since the extraction
  captured the DOM regardless of open/closed state). Unmeasured.
- **Estimated checkpoint time:** the single checkpoint asks the student to
  walk through a five-step sequence with reasoning for each step — likely
  **5–8 minutes** to compose a complete answer, plus any revision time.
  Unmeasured.
- **Estimated hands-on or application time:** none required by the current
  curriculum — the module is entirely about the pre-service arrival
  sequence, not a physical scalp technique. The script-writing exercise
  (2–3 minutes to write, plus reading AI feedback) is the closest thing to
  an applied task, and it is ungraded.
- **Competency demonstrated:** the student can sequence and justify the
  five-step client arrival ritual (intake, physical preparation, tea
  ritual, first contact/aromatherapy, tone-setting) and explain the
  physiological/psychological purpose behind each step, particularly under
  a time-pressure/stressed-client scenario (the checkpoint's specific
  framing).
- **Suggested practice or application task:** the aromatherapy script
  builder already functions as this — writing a client-facing script in
  the student's own voice and receiving AI feedback. It is currently
  ungraded and could be documented explicitly as the module's guided
  practice task without changing its ungraded status.
- **Earlier concepts that should be revisited:** the Welcome Module's
  "led vs. performed" distinction (0.6, principle 1: "the service should
  feel controlled, not chaotic") directly underlies this module's "you are
  not improvising, you are delivering" framing (2.7). Module 1's referral
  and scope-of-practice framing is not directly revisited in Module 2's
  current content.
- **Suggested position in the Guided Completion Path:** third — follows
  the Welcome Module and Module 1, precedes Module 3, and precedes the
  Module 12 Final Exam that all pacing leads toward.

---

## 10. Listen Mode planning fields

First-pass content assessment only — no prior decision record defines
Listen Mode's implementation; nothing here is authorized for building.

- **Whether narration is appropriate:** Partially. The always-visible
  curriculum text (arrival-sequence intro, quiz framing, script-card
  reference text, feeling-slider framing, 2.6/2.7 sections) is narratable.
  However, this module leans more heavily on interaction than Modules 0–1,
  so narration alone would omit a meaningful share of the module's actual
  content unless the student also interacts with each component (see next
  field and the "audio-only completion" field below).
- **Approximate narration length:** Using the same ~1,270-word total and a
  ~150 words/minute pace, full narration of all currently-visible-in-DOM
  text (including all five timeline details, whether or not the student
  has tapped them) is approximately **8–9 minutes**. This does not include
  the checkpoint question or the quiz options/feedback, and is an
  unmeasured, word-count-derived estimate.
- **Sections requiring visual-review cues:** The interactive timeline is
  the clearest case — narration would need to either read all five steps
  linearly (defeating the "tap to explore" design) or explicitly cue the
  listener to open each step visually. The "What breaks the moment?" quiz
  needs a visual-review cue since it requires reading four distinct
  options and selecting one. The feeling slider's five labeled positions
  (Rushed/Uncertain/Neutral/Guided/Immersed) are also better reviewed
  visually as a spectrum than narrated linearly.
- **Content that should remain video-only:** None of Module 2's current
  content is a `.video-block` or otherwise flagged as requiring physical
  demonstration — the arrival-sequence content is procedural/conversational,
  not a technique that needs to be watched.
- **Whether any interaction or checkpoint prevents audio-only completion:**
  **Yes, meaningfully more than any module extracted so far.** The
  interactive timeline's five detail panels are `display:none` until
  clicked — an audio-only student would never hear this content unless
  Listen Mode explicitly surfaces it independent of the click interaction.
  The aromatherapy script builder requires writing free text — inherently
  not completable by audio alone. The feeling slider requires a drag
  gesture, though its five text states could be narrated directly without
  requiring the slider itself. The required checkpoint (`m2cp1`) requires
  a typed or voice-dictated free-text response either way, consistent with
  every other module's checkpoint pattern.

---

## 11. Confirmed implementation concerns

Flagged only — nothing here has been fixed.

### Confirmed

1. **The AI grading prompt does not see the question the student actually
   read.** `M2.questions.m2cp1` is shorter and omits several details
   present in the displayed `.cp-q` text (see section 3). Same pattern
   already flagged and corrected for Module 1.
2. **Timeline accordion items are not keyboard- or screen-reader-accessible.**
   `<div onclick>` with no `tabindex`, `role`, keyboard handler, or
   `aria-expanded`/`aria-controls` relationship. A keyboard-only user
   cannot open any of the five steps through normal tab/enter navigation.
3. **The "What breaks the moment?" quiz cannot be retried or changed.**
   Once any option is clicked, all four buttons are permanently disabled
   for the rest of that module-view session (`opts.forEach(o => {
   o.disabled = true; ... })` runs on every click, regardless of
   correctness). This differs from the "student may change the selection
   and see the correct reasoning" pattern already established as approved
   for the Welcome Module and Module 1's practice interactions.
4. **Quiz correctness relies primarily on color/opacity**
   (`.bq-opt.correct` vs `.bq-opt.wrong`, the latter also at `opacity:0.6`)
   with the actual explanation living in a separate feedback paragraph,
   not stated on the button itself.
5. **No accessible names on the script builder or slider.** Neither
   `#scriptInput`/`.sb-btn` nor `#feelingSlider` has an `aria-label`; the
   script-feedback and slider-output regions have no `aria-live`.
6. **No accessibility labels on the checkpoint**, matching the pre-audit
   state already found and corrected in Modules 0 and 1: no `aria-label`
   on the voice or submit buttons, no `aria-live` on `.cp-res`.
7. **Old course name present in two places**: `M2.system` and
   `evaluateScript()`'s inline system prompt both still say "HeadSpa
   Mastery."
8. **Completion card has no distinct competency-naming line** — same
   pre-rewrite two-line pattern (title + single subtitle) that Modules 0
   and 1 both had before their audits.
9. **Section numbering skips 2.1–2.5.** The module goes hero → (unlabeled
   timeline/quiz/script/slider sequence) → **2.6** → 2.7. This may be
   intentional (the interactive components substitute for the numbered
   sub-sections) or may reflect content that was renumbered/removed at
   some point — flagged for clarification, not assumed either way.
10. **The script builder's error fallback text is unique to this feature**
    (`Something went wrong — try again.`) — distinct from both the shared
    checkpoint fallback and the shared guide-chat fallback, meaning there
    are now (at least) three different network-failure message patterns
    active across the app depending on which feature fails.

### Assumptions (not independently verified in this pass)

- It's assumed the `STATIC_MODULES[2]` routing's extra `setTimeout(() =>
  { ... updateFeeling(fs.value) ... }, 100)` reliably fires after the
  DOM swap on every module entry (including via Review Mode navigation and
  via direct `openModuleById(2)` calls) — this was read in the source but
  not independently re-traced against every possible entry path in this
  extraction pass.
- It's assumed no other module's checkpoint question text coincidentally
  matches the `/first five minutes of her experience/i` regex — this was
  checked only informally by recalling the other modules' question text
  documented in `module-00-source.md`/`module-01-source.md`, not by
  re-reading all ten remaining modules' checkpoint questions in this pass.
- The Guided Completion Path and Listen Mode estimates in sections 9–10
  are content-volume-derived approximations, explicitly not measured/timed
  figures — restated here for emphasis.

---

## 12. Source map

| Section | Source file | Line range / marker | Related functions | Related state properties |
|---|---|---|---|---|
| Module identity constants | `headspa-mastery.html` | 5915 (`MODULE_CHECKPOINTS['2']`), 5947 (`MODULE_TITLES[2]`) | — | — |
| Module 2 wrapper + curriculum | `headspa-mastery.html` | 4360–4573 (`#module2Wrap`) | `STATIC_MODULES[2]` (`:6780`) | — |
| Interactive timeline | `headspa-mastery.html` | 4375–4437 (`#timeline`) | `openStep(idx)` (`:6844`) | — (no state) |
| "What breaks the moment" quiz | `headspa-mastery.html` | 4446–4454 (`#breakQuiz`) | `breakAnswer(btn, isCorrect)` (`:6855`) | — (no state) |
| Aromatherapy script builder | `headspa-mastery.html` | 4463–4473 | `evaluateScript()` (`:6882`) | — (no state) |
| Feeling slider | `headspa-mastery.html` | 4482–4492 | `updateFeeling(val)` (`:6877`), `FEELING_STATES` (`:6869`) | — (no state) |
| Checkpoint markup | `headspa-mastery.html` | 4542–4558 (`#m2cp1`) | `submitM2CP`, `m2cpKey` | `checkpointMeta.m2cp1` |
| Completion card markup | `headspa-mastery.html` | 4560–4570 (`#m2Complete`) | `resolveModuleCompletionUI` | `progress['2'].complete`, `.completedAt` |
| `M2` object (questions + grading system) | `headspa-mastery.html` | 6481–6486 | `submitM2CP` | — |
| Module-2-specific checkpoint criteria | `headspa-mastery.html` | 6225–6232 (inside `evaluateCheckpointAnswer`) | `evaluateCheckpointAnswer` | — |
| `submitM2CP` / `m2cpKey` | `headspa-mastery.html` | 6896–6901 | — | — |
| `MODULE_GUIDE_SYSTEMS[2]` | `headspa-mastery.html` | 6567 | `getGuideSystem` | — |
| `MODULE_QUICK_PROMPTS[2]` | `headspa-mastery.html` | 6582 | `updateGuideQuickPrompts` | — |
| Module-open Cadence greeting for module 2 | `headspa-mastery.html` | 6821 (inside `openModuleById`'s `greetings` map) | `openModuleById` | — |
| Course home markup (module list row 2) | `headspa-mastery.html` | 2294–2297 | `renderHomeProgress` | `progress['2']` |
| `MODULE_MEMORY_TAGS[2]` | `assets/js/headspa-state.js` | 134 | `getCheckpointMemoryTags`, `getModuleFocusTags` | `student.cadenceMemory` |
| Timeline/quiz/script/slider CSS | `headspa-mastery.html` | 1271–1333 | — | — |
| Shared checkpoint machinery (`submitCheckpoint`, `evaluateCheckpointAnswer`, `normalizeCheckpointEvaluation`, `APP_STATE.setCheckpointResult`, etc.) | `headspa-mastery.html`, `assets/js/headspa-state.js` | See `module-00-source.md` §4, §8 for exact line numbers | — | — |
