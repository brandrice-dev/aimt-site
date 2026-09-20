# Module 1 — Source Extraction

Extracted verbatim from `headspa-mastery.html` and `assets/js/headspa-state.js`
as they exist on branch `course-audit-build`, commit `9113b2c` (top of
history at extraction time). Wording is copied exactly — nothing here has
been rewritten, corrected, or summarized. This is a record of the *current*
experience, not a proposal.

Confirmed findings are separated from assumptions in section 10.

---

## 1. Module identity

| Field | Value |
|---|---|
| Module number | `1` |
| Student-facing title (`MODULE_TITLES[1]`) | `Module 1 — Role of the Head Spa Tech` |
| Home-screen dashboard subtitle (`.mr-sub` for row 1) | `Scope of practice, limitations, licensing` |
| Module hero eyebrow (in-lesson) | `Module 1 · What Is a Head Spa & The Role of the Technician` |
| Module hero title | `Know what you are.<br>Know what you are not.` |
| Module hero description | `The quality of the service doesn't start when your hands touch the scalp. It starts the moment the client walks in.` |
| Module wrapper ID | `module1Wrap` |
| JS module identifiers | `M1` (const, questions + system prompt), `MODULE_GUIDE_SYSTEMS[1]`, `MODULE_QUICK_PROMPTS[1]`, `MODULE_TITLES[1]`, `MODULE_CHECKPOINTS['1']`, `MODULE_CP_COUNTS['1']`, `MODULE_MEMORY_TAGS[1]` (headspa-state.js) |
| Checkpoint IDs | `m1cp1` (container/textarea id `m1cp1In`/button `m1cp1Btn`/result `m1cp1Res`), `m1cp2` (container/textarea id `m1cp2In`/button `m1cp2Btn`/result `m1cp2Res`) — status pills `m1cp1Status`/`m1cp2Status` created at runtime by `ensureCheckpointStatusElement` |
| Home-screen row markers | `mnum-1`, `mbadge-1` |
| Completion card ID | `m1Complete` |
| Static routing entry | `STATIC_MODULES[1]` inside `openModuleById()`: `() => { const w = document.getElementById('module1Wrap'); if (w && wrap) wrap.innerHTML = w.innerHTML; }` |

No onboarding sequence is connected to Module 1 — the cinematic intro,
student-introduction prompt, and Cadence-introduction system prompt are all
scoped to first-time entry (Module 0 / course-wide), not re-triggered when
a student reaches Module 1. This extraction covers only Module 1's own
curriculum, checkpoints, and Cadence context.

---

## 2. Module 1 curriculum

Copied exactly from `module1Wrap` (`headspa-mastery.html:4055`–`4281`), in
student-encounter order.

### Hero

- Eyebrow: `Module 1 · What Is a Head Spa & The Role of the Technician`
- Title: `Know what you are. Know what you are not.`
- Description: `The quality of the service doesn't start when your hands touch the scalp. It starts the moment the client walks in.`

### 1.1 — What is a head spa?

**Heading:** It is not just a shampoo. It is not just a massage. And it is not a medical treatment.

> A head spa is a structured, scalp-focused service designed to support scalp hygiene, comfort, and the overall scalp environment — while delivering a deeply relaxing, sensory experience. Those two things coexist. The relaxation is real. So is the structure underneath it.

Six-card grid (`.scalp-card`, dark indicator `#4d403a`):

| Card | Text |
|---|---|
| Cleansing | The foundation of every service. |
| Exfoliation | When appropriate — not automatically. |
| Massage & circulation | The therapeutic core of the service. |
| Water therapy | Temperature, immersion, sensory shift. |
| Conditioning & treatment | Product choice driven by what you observe. |
| Sensory elements | Temperature, touch, sound, aromatherapy. |

**Cadence note:**
> "From the client's perspective, it feels like relaxation. From your perspective, it should feel controlled and intentional. That's the difference. Anyone can make something feel relaxing for a moment. Very few people can deliver a consistent, high-quality experience that holds together from beginning to end."

### 1.2 — What is a head spa technician?

**Heading:** You are responsible for the full experience. Not just the steps.

> This is where most people underestimate the role. They think: "I just need the steps." That works until something doesn't look the way you expected.

**Clinical note ("The mindset that creates weak practitioners"):**
> The service should feel effortless to the client. It should not feel effortless to you. Behind the calm, there should be constant observation and decision-making. A strong technician reads the room, adjusts pressure and pacing, recognizes when to simplify, explains without overcomplicating, and maintains control from start to finish.

### 1.3 — Observation vs. diagnosis

**Heading:** Recognizing a pattern is not the same as diagnosing a condition.

> You may notice oil imbalance, dryness, buildup, flaking patterns, irritation, or early thinning. Recognizing those patterns is part of your role. Diagnosing is not.

**Protocol card 1 — "Language that keeps you in scope"** (badge: `Say this`):

| Situation | Script |
|---|---|
| Buildup | "I'm seeing some buildup around the follicles — today I'd want to focus on clarifying." |
| Flaking | "There's some flaking and oil at the root. That can sometimes be consistent with dandruff, but I can't diagnose. What I can do is adjust your service today to be more supportive." |
| Irritation | "I'm seeing some irritation here, so I'd keep things gentler today." |

**Protocol card 2 — "Language that takes you out of scope"** (badge: `Never say`):

| Situation | Script |
|---|---|
| Diagnosis | "This is seborrheic dermatitis." — You are not a dermatologist. |
| Diagnosis | "This is fungal." — You cannot determine this from visual observation. |
| Diagnosis | "This is alopecia." — Medical diagnosis. Not your lane. |

> That difference protects your credibility. Confidence tends to grow faster than scope if you're not careful. The more experienced you become, the more tempted you'll be to speak with certainty about things you're still only observing. Stay grounded in what you can actually see.

**Sub-heading:** When to refer out
> Refer when what you're seeing is severe, persistent, spreading, painful, or not responding to standard care. You are not expected to have all the answers. You are expected to recognize when something is outside your lane — and act on that recognition rather than push through it. Referral is not failure. It is part of doing the job correctly.

### 1.4 — Scope of practice

**Heading:** What you can do. What you cannot. No grey area.

> The mistake is not starting out of scope. The mistake is drifting there over time.

**Protocol card 1 — "Within scope"** (badge: `Yours to do`): Cleansing the scalp and hair; Non-medical product application; Massage and manual techniques; Tool use within licensed scope; Observation and description; Non-prescription recommendations.

**Protocol card 2 — "Outside scope"** (badge: `Not yours`): Diagnosing conditions; Prescribing or recommending prescription products; Claiming to cure or treat disease; Performing medical procedures.

### 1.5 — Limitations of a head spa service

**Heading:** Be honest about what this is. It protects everyone.

**Protocol card 1 — "What a head spa can support":** Improved scalp cleanliness and reduced buildup; Moisture balance support; Improved comfort and relaxation; A healthier environment that supports hair growth.

**Protocol card 2 — "What a head spa cannot do":** Treat disease; Reverse genetic hair loss; Cure dandruff or dermatitis; Regrow hair on its own.

**Key point:**
> If you position it incorrectly, you will attract the wrong expectations. Use language like this instead: "This can help support a healthier scalp environment." "This works best as part of a larger approach." You are not selling a miracle. You are providing a professional service with real, but specific, benefits.

### 1.6 — Licensing

**Heading:** Before offering this service, know your local requirements.

> That includes licensing requirements, sanitation standards, disinfection protocols, and equipment and water system rules. This course gives best practices. It does not override your legal responsibilities. Scope varies by license type and state — verify what applies to you before you begin offering services.

### 1.7 — Practitioner insight

**Heading:** Most clients don't actually know what a head spa is.

> They're coming in because it looks relaxing, it was recommended, or they're simply curious. You are shaping their understanding in real time. If you position yourself as someone who fixes conditions, they will expect results you cannot control. If you position yourself as someone who understands the scalp, works within scope, and customizes the service — they will trust you.

**Cadence note:**
> "Your language trains your client. The fastest way to lose credibility is to sound like you're guessing while trying to sound confident. Clients don't need you to know everything. They need you to sound grounded in what you do know. That is a very different standard — and a much more achievable one."

### 1.8 — Mistakes new practitioners make

**Heading:** Five patterns. All avoidable.

| Title | Text |
|---|---|
| Blurring observation with diagnosis | The most common and most dangerous mistake. Recognizing patterns is part of your role. Diagnosing is not. The line is clear — stay on your side of it. |
| Overpromising results | Making the service sound more powerful than it is may help you sell it once. It will hurt you long term when expectations aren't met. |
| Thinking the role is just hands-on | If you think your job is to perform the service, you will miss the consultation, education, and decision-making that actually define it. |
| Copying what you see online without thinking long-term | Most people speaking outside their scope online are not thinking about consequences. Don't build your professional standards on what looks good in a reel. |
| Avoiding referral because it feels uncomfortable | Referral is not failure. It's part of doing the job correctly. The practitioners who avoid it are the ones who end up in uncomfortable situations they could have prevented. |

No warnings (`.clinical-note` styled as alert) beyond the two clinical/note
callouts already quoted above (1.2's "mindset" note functions as the
module's cautionary note; there is no separate `.warning`-class element).
No scripts beyond the "Say this" / "Never say" protocol-card scripts quoted
in 1.3.

### Button labels used in Module 1

- Checkpoint submit (arrow icon, no text label) — `id="m1cp1Btn"`, `id="m1cp2Btn"`
- Voice input buttons — `title="Speak your answer"`, no visible text, on both checkpoints
- `Start Module 2 →`
- `Back to course`

---

## 3. Module 1 checkpoints

Two checkpoints, both required (`MODULE_CHECKPOINTS['1'] = ['m1cp1', 'm1cp2']`).

### Checkpoint 1 — `m1cp1`

| Field | Value |
|---|---|
| Label above question | `Check your understanding` (`cp-label`) |
| Exact student-facing question | `A client sits down and says her hair has been shedding heavily for two months. She's convinced she has alopecia and wants you to tell her if that's what you see. How do you handle this moment — what do you say, and what don't you say?` |
| Placeholder | `Walk me through exactly how you'd handle this...` |

### Checkpoint 2 — `m1cp2`

| Field | Value |
|---|---|
| Label above question | `Final check` (`cp-label`) |
| Exact student-facing question | `In your own words — what is the difference between a head spa technician and someone who just knows how to do the steps? And why does that difference matter to a client?` |
| Placeholder | `Think about what the client actually experiences...` |

### Complete grading prompt (both checkpoints share `M1.system`)

Built in `submitCheckpoint()` from these pieces, concatenated in order —
identical composition mechanism to every other module (see
`module-00-source.md` section 4 for the full breakdown of
`submitCheckpoint`/`evaluateCheckpointAnswer`):

1. **Base system** (`M1.system`, a function of the question `q`, `headspa-mastery.html:6375`):
   > You are Cadence, instructor of HeadSpa Mastery. Module 1 checkpoint. Question: "{q}". Key concepts: Observation vs diagnosis — describe what you see, never name a medical condition. Safe language: "I'm seeing..." not "This is...". Scope includes cleansing, non-medical products, massage, observation. Scope excludes diagnosing, prescribing, claiming to cure. A great technician guides the full experience. Referral is professionalism. Respond to what they wrote specifically. 3-5 sentences, direct and warm, no bullet points.

   Note: the `{q}` interpolated here is **`M1.questions[id]`** — the
   *short* paraphrase of the question (see below), not the longer,
   scenario-framed text actually shown to the student in `.cp-q`. See
   section 9, confirmed finding #1.
2. `CADENCE_RESPONSE_CONSISTENCY_ANCHOR`, `CADENCE_SELECTIVE_MEMORY_INSTRUCTION`, and `APP_STATE.getCadenceMemoryContext(1, 'checkpoint')` — same shared additions as every module (unchanged, not module-specific).
3. Inside `evaluateCheckpointAnswer()`: `CADENCE_CHECKPOINT_TONE`, the generic ambiguous/partial/generic-answer instruction, `CADENCE_FEEDBACK_MICRO_RULES`, and `CHECKPOINT_EVAL_FORMAT` — all shared, unchanged constants (full text already recorded in `module-00-source.md` section 4).
4. No checkpoint-specific criteria block is injected for `m1cp1` or `m1cp2` — the regex in `evaluateCheckpointAnswer()` (`/first five minutes of her experience/i`) only matches Module 2's question.

`M1.questions` (`headspa-mastery.html:6371`–`6374`), the short paraphrases
actually sent to the model as "question" (both in the interpolated system
string and in the `'Checkpoint question: ' + question + ...'` user
message):

```
m1cp1: 'A client says her hair has been shedding heavily for two months and wants you to tell her if she has alopecia. How do you handle this moment?'
m1cp2: 'What is the difference between a head spa technician and someone who just knows how to do the steps?'
```

### Pass criteria

Not module-specific beyond the "Key concepts" sentence embedded in
`M1.system` (quoted above) plus the shared, generic
`CHECKPOINT_EVAL_FORMAT` instruction: *"Set pass to true only if the
student directly answers the full question with enough specificity to
move on. If any core part is missing, shallow, vague, or off-target, set
pass to false."* There is no explicit, structured two-part pass rule like
the one now implemented for Module 0's `m0cp1` (see section 9, confirmed
finding #2) — grading is a single unstructured natural-language paragraph
of "key concepts" the model is expected to check for, with no itemized
required-elements list, no explicit grammar/spelling leniency statement,
and no explicit escalation/revision-focus instruction beyond the shared
generic rules.

### Revision / attempt / state behavior

Identical to every other module — governed entirely by the shared
`submitCheckpoint()`, `evaluateCheckpointAnswer()`,
`normalizeCheckpointEvaluation()`, `APP_STATE.setCheckpointResult()`,
`APP_STATE.captureCheckpointMemory()`, `APP_STATE._checkModuleComplete()`,
`resolveModuleCompletionUI()`, `renderCheckpointOutcomeLabel()`, and
`applyCheckpointInputState()` — see `module-00-source.md` section 4 for
the full mechanics (attempt counting, retry-mode button state, status
pill, thinking indicator, error fallback). Module 1 introduces no
per-checkpoint deviation from this shared machinery — `submitM1CP(id)`
(`headspa-mastery.html:6918`) is a thin wrapper identical in shape to
`submitM0CP` (pre-Welcome-Module-audit form): `submitCheckpoint(1, id,
M1.system, M1.questions[id])` — no custom `errorMessage` 5th argument, so
a network failure on either `m1cp1` or `m1cp2` shows the shared default
text: `Cadence didn't respond — check your connection and try again.`

`m1cpKey(e, id)` (`headspa-mastery.html:6921`) is shared by both `m1cp1`
and `m1cp2` (single handler, `id` parameter selects which checkpoint to
submit) — Enter without Shift submits, Shift+Enter inserts a newline
(same pattern as every module).

### Accessibility

Neither voice button nor either submit button has an `aria-label` — both
rely solely on `title="Speak your answer"` (voice) or no accessible name
at all beyond the SVG icon (submit buttons). Neither `.cp-res` result
region has `aria-live`. This is the same starting state Module 0 was in
before its accessibility corrections — Module 1 has not yet received
equivalent treatment. See section 9, confirmed finding #3.

---

## 4. Cadence context

### Module-specific guide context (`MODULE_GUIDE_SYSTEMS[1]`, `headspa-mastery.html:6464`, verbatim)

> You are Cadence — a mentor built from nearly two decades in the head spa industry. The student is in Module 1 (Role of the Head Spa Tech): scope of practice, observing vs diagnosing, safe client language, licensing variation, and when to refer. If the student has industry experience, connect scope boundaries to head spa specifically — a hairstylist understands client trust and scalp proximity, an esthetician understands skin barrier and sensitivity. All connections must lead back to head spa and scalp wellness — never to other service categories. 3-5 sentences. No bullet points.

Composed at call time (`getGuideSystem()`) with the same
`CADENCE_RESPONSE_CONSISTENCY_ANCHOR` + `CADENCE_SELECTIVE_MEMORY_INSTRUCTION`
+ `getCadenceMemoryContext(1, 'guide')` additions used everywhere.

### Suggested prompts (`MODULE_QUICK_PROMPTS[1]`, `headspa-mastery.html:6479`)

- `How do I talk about scope with a client?`
- `When exactly should I refer out?`
- `What language should I use vs avoid?`

### Module-open Cadence greeting (`headspa-mastery.html:6718`)

> Module 1 is the professional foundation. The scope section especially — read it slowly. The practitioners who skip past it are the ones who end up speaking with more certainty than they have earned.

This greeting says "Module 1" directly (not "the Welcome Module" style
substitution) — that is expected and correct here, since the Welcome
Module naming decision applies only to technical module `0`; Module 1's
own numeral is the approved, unchanged student-facing label per
`00-global-decisions.md` ("The next instructional module remains
student-facing **Module 1**").

### Memory tags (`MODULE_MEMORY_TAGS[1]`, `assets/js/headspa-state.js:133`)

```
1: ['scope-awareness', 'consultation-language', 'referral-judgment']
```

Used by `getCheckpointMemoryTags()`/`getModuleFocusTags()` to decide which
of a student's earlier notable answers or strength/focus-area tags are
"relevant" enough to surface in later modules' Cadence memory context
(`getCadenceMemoryContext`).

### Tone instructions / restrictions / fallback

Same shared, non-module-specific behavior as every module: direct, warm,
earned, mentor-not-manual, 3–5 sentences, no bullet points in guide/
checkpoint answers, reference specifics from the student's own words
(`CADENCE_RESPONSE_CONSISTENCY_ANCHOR`). Guide-chat failure shows the
shared (now Module-0-corrected, globally-applied) fallback: `Cadence
couldn't respond. Check your connection and try again.` Checkpoint failure
on either `m1cp1` or `m1cp2` shows the shared, uncorrected fallback:
`Cadence didn't respond — check your connection and try again.` (Module 1
does not use the new optional `errorMessage` parameter added to
`submitCheckpoint()` during the Welcome Module implementation.)

### References to the old course name

Confirmed occurrence directly inside Module 1's own code path:

- `M1.system` (`headspa-mastery.html:6375`): `"You are Cadence, instructor of HeadSpa Mastery. Module 1 checkpoint..."` — not yet corrected to "Head Spa Certification Course." `MODULE_GUIDE_SYSTEMS[1]` does not itself name the course (consistent with every module's guide-system string, which never names the course by title — only checkpoint-grading `M*.system` strings do).

---

## 5. Current interactions

| Interaction | What the student does | Graded? | Persists? | Success behavior | Failure behavior | HTML IDs | Related JS |
|---|---|---|---|---|---|---|---|
| Read curriculum (1.1–1.8) | Scroll and read | No | Read-percent tracked (`maxReadPercent`) via scroll listener | Contributes 70% of the progress-bar weight | — | `.lesson-wrap` sections, no per-section IDs | `window.addEventListener('scroll', ...)`, `setReadProgress` |
| Checkpoint `m1cp1` | Free-text answer, submit | Yes (model-graded pass/fail) | Yes — `checkpointMeta.m1cp1` | Status pill `Accepted`; contributes toward module completion | Status pill `Needs revision`; button becomes `Retry` | `m1cp1`, `m1cp1In`, `m1cp1Btn`, `m1cp1Res`, `m1cp1Status` | `submitM1CP`, `submitCheckpoint`, `evaluateCheckpointAnswer` |
| Checkpoint `m1cp2` | Free-text answer, submit | Yes (model-graded pass/fail) | Yes — `checkpointMeta.m1cp2` | Same as above | Same as above | `m1cp2`, `m1cp2In`, `m1cp2Btn`, `m1cp2Res`, `m1cp2Status` | `submitM1CP`, `submitCheckpoint`, `evaluateCheckpointAnswer` |
| Voice input on either checkpoint | Click mic, speak answer | N/A (fills textarea) | Only once submitted | Text populates the relevant textarea | — | mic buttons inside each `.cp-row` | `startVoice('m1cp1In'|'m1cp2In', this)` |
| "Start Module 2 →" | Click after completion | No | Navigates + sets `currentModule` | Opens Module 2 | — | inside `#m1Complete` | `openModuleById(2)` |
| "Back to course" | Click after completion | No | Sets view to home | Returns to course home | — | inside `#m1Complete` | `showHome()` |
| Guide panel (Cadence chat) | Open panel, ask a question or tap a quick prompt | No | Chat history in-memory only (`gpHistory`, capped at 16) | Streamed response | `Cadence couldn't respond. Check your connection and try again.` | `guideBtn`, `guidePanel`, `gpMsgs`, `gpInput`, `quickPs` | `toggleGuide`, `gpSend`, `qa`, `getGuideSystem` |

Module 1 has no bespoke interactive widget (no sliders, drag-order,
toggles, collapsible sections). All display elements — the six-card
"what's included" grid, the four protocol-cards (scope/out-of-scope,
support/cannot-do), the key-point callout, and the five info-cards
("mistakes") — are static, non-interactive markup. The only interactions
unique to Module 1 are its two checkpoints plus standard read-scroll
tracking.

---

## 6. Completion behavior

### Exact completion requirements

- Both required checkpoints `m1cp1` and `m1cp2` must reach
  `status: 'passed'` (`MODULE_CHECKPOINTS['1'] = ['m1cp1', 'm1cp2']`,
  `APP_STATE._hasAllRequiredCheckpoints(1)` requires every ID in that
  array to have `checkpointMeta[id].status === 'passed'`).
- No read-percentage minimum gates completion (same as every module —
  read-percent only affects the progress-bar display weighting, not the
  unlock logic).

### Completion message (`#m1Complete`)

- Gold mark: `✦`
- Title: `Module complete.`
- Subtitle: `You understand the role, the scope, and the language that keeps you professional and protected.`

No "competencies shown" line and no distinct eyebrow/status label exist
here — Module 1's completion card has not received the structural
addition (separate eyebrow line naming the demonstrated competency) that
Module 0's completion card received during the Welcome Module audit. See
section 9, confirmed finding #4.

### Next-module language

- Next-up label: `Up next — Module 2`
- Next-up text: `Scope is the foundation. Now we build the experience on top of it. Module 2 is where the service actually begins — before you touch the scalp, before the water runs. The intake, the first contact, the tea ritual. The things clients remember most.`
- Primary button: `Start Module 2 →` → `openModuleById(2)`
- Secondary button: `Back to course` → `showHome()`

### Relevant state and functions

Same shared completion path as every module — `setCheckpointResult` →
`_checkModuleComplete` → `resolveModuleCompletionUI`. No module-1-specific
completion code exists. `canAccessModule(2)` requires `isModuleComplete(1)`
— Module 1 is the sole gate for unlocking Module 2.

---

## 7. Guided Completion Path fields

Per `00-global-decisions.md` ("Guided Completion Path" → "Required fields
for every future module audit").

- **Estimated learning time:** not yet determined by any formal timing
  study. Rough proxy: Module 1's curriculum body text is approximately
  1,260 words across 8 sub-sections plus 6 protocol/scalp/info cards —
  comparable in length to Module 0's curriculum. A silent-reading pass at
  typical adult reading speed (~200–250 wpm) is roughly 5–7 minutes; a
  careful, attentive read (appropriate for scope/safety-critical content)
  is closer to 10–12 minutes. Two checkpoints add further time. This is
  an estimate from content volume, not a measured figure.
- **Estimated hands-on or application time:** none — Module 1 is entirely
  conceptual/scope framing with no physical technique, tool use, or
  service execution taught. No hands-on component exists in the current
  curriculum.
- **Competency demonstrated:** the student can (a) distinguish
  professional observation from medical diagnosis and use safe,
  in-scope client language, and (b) explain what separates a head spa
  technician (full-experience responsibility, judgment, referral
  awareness) from someone who only knows the steps. This maps to the two
  checkpoints (`m1cp1` = safe-language/scope-boundary application under a
  realistic client scenario; `m1cp2` = articulating the technician-vs.
  step-follower distinction).
- **Suggested practice or application task:** none currently implemented
  beyond the two required checkpoints. The "Say this / Never say" and
  "Within scope / Outside scope" protocol-cards in 1.3–1.4 are
  well-suited to a low-stakes ungraded practice interaction (e.g., a
  "spot the unsafe or ineffective choice" pattern, per the approved
  interaction patterns in `00-global-decisions.md`) if one is added during
  implementation — no such interaction currently exists in Module 1.
- **Earlier concepts that should be revisited:** the Welcome Module's
  "led vs. performed" distinction (0.6, principle 2: "Observation comes
  before assumption") directly underlies Module 1's 1.3
  observation-vs-diagnosis framing — a natural callback point. The
  Welcome Module's certification explainer (0.2, "What your certificate
  represents") is also directly reinforced by Module 1's 1.6 licensing
  section ("This course gives best practices. It does not override your
  legal responsibilities").
- **Suggested position in the Guided Completion Path:** second — directly
  follows the Welcome Module, precedes Module 2, and precedes the Module
  12 Final Exam that all pacing leads toward.

---

## 8. Listen Mode planning fields

Listen Mode is a newly introduced planning concept as of this task — no
prior decision record defines it. The fields below are a first-pass
content assessment against Module 1's current material, offered for
review, not an implementation.

- **Whether narration is appropriate:** Yes. Module 1 is entirely
  text-based conceptual and scope/safety content with no video component
  and no content that depends on watching a physical technique — a strong
  candidate for straightforward audio narration of the body text.
- **Which sections need visual-review cues:** The paired protocol-cards
  in 1.3 ("Language that keeps you in scope" / "Language that takes you
  out of scope"), 1.4 ("Within scope" / "Outside scope"), and 1.5 ("What
  a head spa can support" / "What a head spa cannot do") are structured
  side-by-side comparison lists designed to be scanned, not just heard —
  narration should flag these as "see the on-screen list" reference
  points rather than reading every line item aloud as flat prose, or the
  paired contrast (the entire pedagogical point of these cards) will be
  lost in linear audio.
- **Which content should remain video-only:** None. Module 1 contains no
  `.video-block` or other video-embedded section (unlike, for example,
  Module 3, which opens with one) — nothing in Module 1's current
  curriculum is video-only or depends on visual demonstration.
- **Approximate narration length:** Module 1's total curriculum text is
  approximately 1,260 words (measured by stripping HTML tags from
  `module1Wrap`). At a typical narration pace of ~150 words/minute, full
  verbatim narration is approximately **8–9 minutes**, not counting the
  two checkpoint questions or any pause for the visual-review cues noted
  above. This is a word-count-derived estimate, not a recorded/measured
  duration.

---

## 9. Confirmed implementation concerns

Flagged only — nothing here has been fixed.

### Confirmed

1. **The AI grading prompt does not see the question the student actually
   read.** `M1.questions.m1cp1`/`m1cp2` (the short paraphrases interpolated
   into `M1.system` and sent as the "Checkpoint question" in the grading
   call) are noticeably shorter and less specific than the `.cp-q` text
   actually displayed to the student (e.g., the displayed `m1cp1` question
   asks "what do you say, and what don't you say?" — the version sent to
   the model just says "How do you handle this moment?"). This is the same
   pattern flagged for Module 0's original checkpoint before its rewrite,
   and it still exists, unaddressed, for both of Module 1's checkpoints.
2. **No structured, itemized pass criteria.** Unlike Module 0's rewritten
   `m0cp1` (which now has an explicit two-element pass rule, a named
   revision-focus policy, and an explicit "do not fail for grammar"
   instruction), Module 1's `M1.system` gives the grading model only a
   single paragraph of loosely stated "key concepts" with no itemized
   required-elements list and no explicit leniency instruction for
   grammar/spelling/informal wording. Whether the model reliably applies
   the same leniency Module 0 now explicitly requires is unverified for
   Module 1.
3. **No accessibility labels.** Neither `m1cp1` nor `m1cp2`'s voice button
   has an `aria-label` (both rely on `title` only); neither submit button
   has an accessible name beyond the bare SVG icon; neither `.cp-res`
   result region has `aria-live`. Module 0 received exactly this class of
   fix during its audit — Module 1 has not.
4. **Completion card has no distinct competency-naming line.** Module 1's
   `#m1Complete` still uses the pre-audit two-line pattern (`Module
   complete.` + a single descriptive sentence) that Module 0's card used
   *before* its rewrite. It does not separately name the demonstrated
   competencies the way Module 0's rewritten card now does.
5. **Old course name present.** `M1.system` still says `"You are Cadence,
   instructor of HeadSpa Mastery. Module 1 checkpoint..."` — not yet
   updated to "Head Spa Certification Course."
6. **No ungraded practice interaction exists in Module 1.** The two
   "Say this / Never say" and "Within scope / Outside scope" protocol-card
   pairs are well-suited to one (per the approved interaction patterns:
   "Spot the unsafe or ineffective choice"), but no such interaction is
   currently implemented — Module 1 relies entirely on its two graded
   checkpoints for any interactivity beyond reading.

### Assumptions (not independently verified in this pass)

- It's assumed that `getCheckpointMemoryTags()`/`getModuleFocusTags()`
  (referenced in section 4) correctly map Module 1's `MODULE_MEMORY_TAGS`
  entries into later modules' Cadence memory context exactly as they do
  for other modules — this extraction did not re-trace that shared
  function's full logic specifically for Module 1's tag set, only
  confirmed the tag array itself exists and matches the pattern already
  documented for Module 0.
- The Guided Completion Path and Listen Mode estimates in sections 7–8 are
  content-volume-derived approximations, explicitly not measured/timed
  figures — flagged as such inline, restated here for emphasis.

---

## 10. Source map

| Section | Source file | Line range / marker | Related functions | Related state properties |
|---|---|---|---|---|
| Module identity constants | `headspa-mastery.html` | 5836–5849 (`MODULE_CHECKPOINTS`), 5870 (`MODULE_TITLES[1]`) | — | — |
| Module 1 wrapper + curriculum | `headspa-mastery.html` | 4055–4281 (`#module1Wrap`) | `STATIC_MODULES[1]` (`:6683`) | — |
| Checkpoint markup | `headspa-mastery.html` | 4232–4248 (`#m1cp1`), 4250–4266 (`#m1cp2`) | `submitM1CP`, `m1cpKey` | `checkpointMeta.m1cp1`, `checkpointMeta.m1cp2` |
| Completion card markup | `headspa-mastery.html` | 4268–4278 (`#m1Complete`) | `resolveModuleCompletionUI` | `progress['1'].complete`, `.completedAt` |
| `M1` object (questions + grading system) | `headspa-mastery.html` | 6370–6376 | `submitM1CP` | — |
| `submitM1CP` / `m1cpKey` | `headspa-mastery.html` | 6918–6923 | — | — |
| `MODULE_GUIDE_SYSTEMS[1]` | `headspa-mastery.html` | 6464 | `getGuideSystem` | — |
| `MODULE_QUICK_PROMPTS[1]` | `headspa-mastery.html` | 6479 | `updateGuideQuickPrompts` | — |
| Module-open Cadence greeting for module 1 | `headspa-mastery.html` | 6718 (inside `openModuleById`'s `greetings` map) | `openModuleById` | — |
| Course home markup (module list row 1) | `headspa-mastery.html` | 2273–2277 | `renderHomeProgress` | `progress['1']` |
| `MODULE_MEMORY_TAGS[1]` | `assets/js/headspa-state.js` | 133 | `getCheckpointMemoryTags`, `getModuleFocusTags` | `student.cadenceMemory` |
| Shared checkpoint machinery (`submitCheckpoint`, `evaluateCheckpointAnswer`, `normalizeCheckpointEvaluation`, `APP_STATE.setCheckpointResult`, etc.) | `headspa-mastery.html`, `assets/js/headspa-state.js` | See `module-00-source.md` §4, §8 for exact line numbers | — | — |
