# Module 0 — Source Extraction

Extracted verbatim from `headspa-mastery.html` and `assets/js/headspa-state.js`
as they exist on branch `course-audit-build`, commit `be33f50`. Wording is
copied exactly — nothing here has been rewritten, corrected, or summarized.
This is a record of the *current* experience, not a proposal.

Confirmed findings are separated from assumptions in section 9.

---

## 1. Module identity

| Field | Value |
|---|---|
| Module number | `0` |
| Current title (`MODULE_TITLES[0]`) | `Module 0 — Welcome & Overview` |
| Home-screen dashboard subtitle | `Introduction to the course and Cadence` |
| Module hero eyebrow (in-lesson) | `Module 0 · Introduction to Head Spa Mastery` |
| Module wrapper ID | `module0Wrap` |
| JS module identifiers | `M0` (const, questions + system prompt), `MODULE_GUIDE_SYSTEMS[0]`, `MODULE_QUICK_PROMPTS[0]`, `MODULE_TITLES[0]`, `MODULE_CHECKPOINTS['0']`, `MODULE_CP_COUNTS['0']` |
| Checkpoint IDs | `m0cp1` (container), `m0cp1In` (textarea), `m0cp1Btn` (submit button), `m0cp1Res` (result area), `m0cp1Status` (created at runtime by `ensureCheckpointStatusElement`) |
| Home-screen row markers | `mnum-0`, `mbadge-0` |
| Completion card ID | `m0Complete` |

---

## 2. First-time onboarding connected to Module 0

The onboarding sequence (`introScreen`) runs before the student ever reaches
`module0Wrap`, gated by `shouldShowIntro()` (`!student.introComplete`). It is
shared infrastructure, not Module-0-specific markup, but it is the only
onboarding a student sees and it deposits them directly onto the course home
screen with "Begin — Module 0" as the primary CTA, so it is included here in
full.

### Course introduction / cinematic opening sequence

Typed out character-by-character in `runIntroScript()`, from `buildIntroScript()`
(`INTRO_SCRIPT` at line 7348 is the static fallback; `buildIntroScript()` at
line 7389 is what actually renders and personalizes the greeting with the
student's first name if known):

> Hi[, {firstName}]. I'm Cadence.
>
> I'm the voice of nearly two decades of hands-on experience in the head spa space — distilled into a course that meets you exactly where you are.
>
> Think of me as a mentor, not a manual. I guide you through the science, the technique, the client experience, and the business of building something real.
>
> The more you share with me as we go, the more I can tailor what I teach to where you are headed.
>
> Before we begin —

Each line is typed with per-character delay (110ms after `.!?`, 80ms after
`,`, 55ms after a space, otherwise 38–66ms randomized) and paced with pauses
between segments (900–2200ms). `NEWLINE` segments insert `<br><br>`.

### Student introduction prompt

After the cinematic finishes, `showIntroInput()` reveals:
- Label: `Tell me about yourself`
- Placeholder: `Your background, where you are in your career, what brought you here…`
- Submit button label: `Continue`
- Voice input button (mic icon) with title `Speak your answer`

### Cadence introduction / response to the student's intro

On submit (`submitIntro()`), the student's raw text is sent to `callAI` with
this system prompt (verbatim, line 7491):

> You are Cadence. Your voice is calm, direct, and earned — the voice of someone who has spent nearly two decades on the floor doing this work. You do not use filler phrases like "I am glad you are here" or "Welcome to the course" or "That is wonderful." You speak like a mentor who has heard a lot of introductions and responds to the specific one in front of them.
>
> A student just wrote this introduction: "{text}".[ Their name is {name}.]
>
> Respond in 2-3 sentences. Reference something SPECIFIC they actually said — their job, their goal, their hesitation, their background — whatever stands out. Do not be generic. Do not welcome them to the course. Just respond to what they said, the way a sharp mentor would respond to someone they just met. If they have industry experience, speak to what that means for how they will move through this material. End with one sentence that tells them what they are about to get.
>
> {CADENCE_RESPONSE_CONSISTENCY_ANCHOR}
>
> CRITICAL GUARDRAIL — THIS IS NON-NEGOTIABLE: This course is HeadSpa Mastery — a certification entirely focused on head spa services and scalp wellness. No matter what background the student shares, you MUST connect it ONLY to head spa and scalp wellness. A hairstylist's years behind the chair translates to touch, client trust, and reading the scalp — not to any other service. An esthetician's skin knowledge maps directly to the hydrolipid film and scalp barrier function. A newcomer brings fresh eyes to scalp-focused work. Whatever they share, the bridge is always: how does this prepare them for head spa and scalp wellness specifically? NEVER reference, imply, or connect their background to any other service category — not permanent makeup, not lash work, not hair color, not injections, not sales, not anything outside of head spa and scalp wellness. If you cannot find a direct connection to head spa and scalp wellness, speak to the scalp science and client experience work ahead. The topic is always head spa. The destination is always scalp wellness mastery.

Begin button (shown after Cadence responds), label: **`Begin HeadSpa Mastery`**
(`introBeginBtn`, calls `introProceed()`).

### How the course works / how progression works / how checkpoints work

Not a distinct onboarding screen — this is taught inside Module 0 curriculum
section **0.5 — How to use this course** (see section 3 below) and reinforced
by the auto-greeting Cadence gives when a student opens Module 0 (see
section 6, "Module-open Cadence greeting").

### How certification is described

No dedicated certification explainer screen exists in onboarding. The only
certification framing a student sees before/around Module 0 is the course
home progress card:

- `hpc-title`: `HeadSpa Mastery — Full Certification`
- `hpc-label`: `Your progress`
- Stats line: `0 of 12 modules complete` / `0%`

### Skip, continue, loading, and fallback states

- **Skip**: `introSkip` button, label `Skip`. Calls `skipIntro()` — sets
  `introComplete: true` immediately with no response captured, fades the
  intro screen, routes to `showCourse()`.
- **Continue**: `introSendBtn`, label `Continue` (see above).
- **Begin**: `introBeginBtn`, label `Begin HeadSpa Mastery`, calls
  `introProceed()` — fades out, then `hideIntro()` + `showCourse()`.
- **Loading state**: while waiting on Cadence's response to the intro, the
  response area shows a three-dot typing indicator (`cwc-thinking` class,
  three `<span>` elements) inside `#introCadenceText`.
- **Fallback (AI call fails)**: `submitIntro()`'s `.catch()` replaces the
  response text with a hardcoded fallback and still reveals the Begin
  button:
  - With a known name: `Welcome, {firstName}. Let's get started.`
  - Without a name: `Welcome. Let's begin.`
- Resume button on course home once onboarding is done: `resumeBtn`, label
  `Begin — Module 0` before any module is complete, or
  `Continue — Module {n}` once module 0+ is done (`resumeBtn.textContent`
  logic at line 5827).
- Home module row (before any progress): `Module 0 — Welcome & Overview` /
  `Introduction to the course and Cadence`, badge `Start`.

---

## 3. Module 0 curriculum

Copied exactly from `module0Wrap` (`headspa-mastery.html:3731`–`3974`), in
student-encounter order.

### Hero

- Eyebrow: `Module 0 · Introduction to Head Spa Mastery`
- Title: `Clients can feel the difference between a service that is being performed and one that is being led.`
- Description: `Your job is to lead it. This module sets the standard before anything else begins.`

### 0.1 — Welcome

**Heading:** Why this course exists.

> I'm Cadence, and I've spent nearly two decades in cosmetology and esthetics, with a strong focus on elevated client experience, hands-on service design, and scalp-focused treatments. This course was built to solve a problem I kept seeing: most head spa education gives pieces, but not a full system.
>
> You might learn what a head spa is. You might see tools. You might get a general idea of the experience. But that is not the same as knowing how to perform the service well — how to guide the client through it confidently, adjust when something feels off, and create something that feels intentional from beginning to end.
>
> That is what this course is for. A working framework built through real services on real clients — not just the order of the service, but the logic behind it. Why transitions matter. How to pace the room. How to build trust. How to make decisions in real time. This is not theory dressed up as expertise. It is a working framework built through repetition, observation, and refinement.

### 0.2 — What this course is

**Heading:** A framework. Not a script.

> This course is a complete service framework. It teaches you how to think through the head spa experience as a practitioner — not just copy movements or memorize a sequence. You will learn service structure, client flow, assessment thinking, scalp pattern recognition, treatment logic, setup, positioning, and sanitation.
>
> Just as important — you will learn how to stay in your lane. You are not being trained to diagnose or treat medical conditions. You are being trained to observe, recognize patterns, educate appropriately, and know when not to proceed. That distinction matters.

**Note ("What this course is not"):**
> This is not the only way to perform a head spa. Rigid systems create fragile practitioners. The goal here is understanding — not imitation — so you can adapt based on your space, your tools, your client, and your scope.

### 0.3 — Who this is for

**Heading:** The person who wants more than inspiration.

> There is a difference between watching head spa content and performing a head spa service professionally. This course is built for the person who wants to know what to do, what not to do, what to look for, what to say, and how to make the service feel consistent every time.
>
> Inspiration is easy. Repetition, structure, judgment, and execution are what make a real practitioner.

### 0.4 — What you'll learn

**Heading:** You are not just learning steps. You are learning how those steps connect.

> The course is structured in layers, because strong services are built — not assembled. You will move through orientation and scope, client experience, anatomy and assessment, scalp types and treatment thinking, conditions and disorders, tools and setup, full service execution, sanitation, and pricing.

**Info card ("A common mistake"):**
> Jumping straight to the experience before understanding the structure underneath it. That leads to inconsistency. A strong service is not a collection of premium parts. It is a system.

### 0.5 — How to use this course

**Heading:** Go through it in order. All of it.

> Not because every section is exciting — but because each one supports the next. If you skip scope, you overstep in consultations. If you rush anatomy, your assessment gets weaker. If you ignore setup, your flow breaks down.

**Cadence note:**
> "As you move through the program, don't just ask 'what do I do here?' Ask: why does this matter? What problem does this solve? What would I do if this looked different? That is where skill starts."

### 0.6 — The standard

**Heading:** Five principles this course is built on.

1. **The service should feel controlled, not chaotic** — Clients may not know why something feels off — but they feel it immediately. Sloppy transitions, hesitation, and inconsistent touch all break trust. A premium experience is the result of structure, not magic.
2. **Observation comes before assumption** — Strong practitioners look first, then decide. Weak practitioners decide what they think is happening before they actually look. That is how people misread scalp conditions, overuse products, and talk themselves into the wrong protocol.
3. **Relaxation and professionalism can coexist** — Calm does not mean careless. The service can be deeply sensory while still being thoughtful, well-paced, and clinically respectful. These are not in conflict.
4. **Human touch matters more than tools** — Tools support the service. They do not replace presence. A practitioner hiding behind gadgets usually does not yet trust their own hands. Intentional touch, pacing, and comfort are not optional. Tools are.
5. **Restraint is part of expertise** — Not every situation requires action. Some require pause. A professional knows when to adjust, when to simplify, and when to refer out. You do not prove skill by pushing through situations you should have stopped.

(Each principle rendered as a `.protocol-card` with a numbered icon and one
"Why it matters" row — no separate heading/body split beyond that.)

### 0.7 — What makes a great technician

**Heading:** A great technician is not just someone with good hands.

> They know how to hold the room, observe without being told, make decisions when things don't match expectations, explain simply, and repeat quality consistently. That last one is what builds a business.

Five-card grid (`.scalp-card`, dark indicator `#4d403a`):

| Card | Text |
|---|---|
| Hold the room | Energy, pace, comfort, flow, and emotional state — from the moment the service begins. |
| Observe | Scalp condition, body language, sensitivity — without needing the client to spell it out. |
| Make decisions | Adjust within scope, simplify the protocol, or pause and refer — without freezing when something looks unexpected. |
| Explain simply | Say what you see and why you're adjusting — without sounding clinical or outside your lane. |
| Repeat quality | Anyone can have one good service. A real practitioner delivers a strong experience consistently. Clients do not come back because one moment was nice — they come back because the experience felt reliable, intentional, and worth repeating. |

### 0.8 — Scope and safety

**Heading:** Take this seriously from the beginning.

> Head spa services involve visible scalp conditions — flaking, buildup, redness, thinning, irritation. But this is not a medical service. You are not diagnosing. You are not prescribing. You are not replacing a dermatologist.

**Clinical note ("The professional frame"):**
> You are observing, working within scope, supporting the scalp appropriately, and recognizing when to refer out. A strong practitioner says: "This is what I'm seeing. This is how I'd approach it here. This is where I'd be cautious." Not certainty where it doesn't belong.

> People get into trouble in this industry because they want to sound advanced. They start speaking with too much certainty about conditions they are not qualified to diagnose. That does not make them look experienced. It makes them look reckless. Local laws, licensing standards, and sanitation requirements vary — knowing yours is your responsibility, not an afterthought.

### 0.9 — What success looks like

**Heading:** By the end of this course, you should not be guessing.

> You will still need practice. But you will no longer be improvising.

Four-card grid (`.scalp-card`, green indicator `#3a5a3a`):

| Card | Text |
|---|---|
| Guide confidently | Move a client through the full experience — intake to close — without hesitation. |
| Assess without overstepping | Observe what is visible, name it accurately, and stay on your side of the line. |
| Adapt in real time | Adjust based on what you see — not what you planned before the client sat down. |
| Perform repeatably | Deliver the same quality experience for every client — not just the ones where everything went smoothly. |

### 0.10 — Practitioner insight

**Heading:** Clients remember how it felt. Not just what you did.

> What makes a service feel premium is your control, your pacing, your confidence, and your transitions. Most practitioners chase tools. The real difference is delivery.

**Key point:**
> The service starts feeling premium long before the signature steps begin. It starts when the client feels they are with someone who knows exactly what they are doing. That feeling is worth more than any gadget.

### 0.11 — Common early mistakes

**Heading:** Five patterns that show up every time.

Five info cards:

| Title | Text |
|---|---|
| Overvaluing tools | Tools are secondary. Structure, flow, judgment, and touch matter more. Always. |
| Wanting steps without understanding the foundation | Without scope, setup, assessment, and client management underneath the sequence, the steps only take you so far. |
| Performing instead of caring | When practitioners try too hard to look luxurious, they become less grounded. Clients feel when something is overly staged and under-supported. |
| Underestimating how precise relaxation services need to be | Calm magnifies sloppiness. Every break in flow becomes more obvious in a relaxation setting, not less. |
| Starting before you are consistent | Excitement is not readiness. You should not be offering a premium service you cannot yet deliver with control. |

### Completion copy / next-module language

`#m0Complete` (`.lesson-complete`, hidden until checkpoint passes):

- Gold mark: `✦`
- Title: `Module complete.`
- Subtitle: `You understand what you're building and the standard it's held to.`
- Next-up label: `Up next — Module 1`
- Next-up text: `Now that you understand what this course is, the next step is understanding the role itself. What a head spa technician actually is, where the role ends, and why that line matters more than most people realize until they've crossed it.`
- Primary button: `Start Module 1 →` → `openModuleById(1)`
- Secondary button: `Back to course` → `showHome()`

### Button labels used in Module 0

- Checkpoint submit (arrow icon, no text label) — `id="m0cp1Btn"`
- Voice input button — `title="Speak your answer"`, no visible text
- `Start Module 1 →`
- `Back to course`

No other interaction-instruction copy appears beyond the checkpoint question
itself (section 4).

---

## 4. Module 0 checkpoint

| Field | Value |
|---|---|
| Checkpoint ID | `m0cp1` |
| Exact student-facing question | `In your own words — what is the difference between a service that is being performed and a service that is being led? And where do you currently feel least confident as you start this course?` |
| Placeholder text | `Answer in your own words...` |
| Button | Arrow-icon submit button, `id="m0cp1Btn"`; label swaps to `Retry` (with `.retry-mode` class) after a failed attempt |
| Label above question | `Before you move on` (`cp-label`) |

### Cadence grading prompt (complete, verbatim)

Built in `submitCheckpoint()` (`headspa-mastery.html:6119`) and
`evaluateCheckpointAnswer()` (`:6063`) from these pieces, concatenated in
order:

1. **Base system** (`M0.system`, a function of the question `q`):
   > You are Cadence, instructor of HeadSpa Mastery. A student just answered the opening checkpoint in Module 0. The question: "{q}". Key concepts: A performed service follows steps. A led service holds the full experience with calm certainty. Common weak spots: scope, consultation confidence, scalp knowledge, touch, flow, pricing. This is the first checkpoint in the course — respond like a mentor who just heard something real. Acknowledge specifically what they said. 3-5 sentences, no bullet points.
2. **CADENCE_RESPONSE_CONSISTENCY_ANCHOR**:
   > Response consistency anchor: reference one specific detail from the student's message and briefly connect it to real service execution or client experience. Keep tone natural, direct, and non-generic.
3. **CADENCE_SELECTIVE_MEMORY_INSTRUCTION**:
   > Reference prior student patterns only when they materially improve the response. Do not force historical callbacks.
4. **`APP_STATE.getCadenceMemoryContext(0, 'checkpoint')`** — dynamically
   injected prior-learner context (background summary, role/goal tags,
   strengths/focus-area tags, up to 1 relevant prior notable answer),
   appended only if any exists. Framed with: `Use this selectively. Do not
   force callbacks, do not repeat the same background note, and do not
   mention prior context unless it materially sharpens the current
   response.`

Then, inside `evaluateCheckpointAnswer()`, the *evaluator* system prompt
adds on top of the above:

5. Literal instruction: `Decide whether the student can pass this checkpoint right now.`
6. **CADENCE_CHECKPOINT_TONE**:
   > Tone: warm, direct, clinically aware, and grounded. Supportive without being intimate, cheesy, robotic, or therapist-like. No filler. No coddling. No phrases about this being secret, private, or "just between us."
7. `If the answer is ambiguous, partial, generic, or only addresses part of the question, return pass false.`
8. `If the answer is weak, say briefly what is missing and invite a revision in the same flow.`
9. (Checkpoint-specific criteria — only injected for the Module 2 "first five minutes" question; **does not apply to `m0cp1`**.)
10. **CADENCE_FEEDBACK_MICRO_RULES**:
    > Feedback micro-rules: reference at least one specific detail from the student answer. If pass=true, add a brief real-world anchor (how this helps service execution or client experience). If pass=false due to weakness/incompleteness, briefly state one practical in-service issue that gap can create. Keep feedback concise (typically 2-4 sentences). No filler. No generic praise.
11. **CHECKPOINT_EVAL_FORMAT**:
    > Return valid JSON only in this shape: {"pass":true|false,"feedback":"short response shown to the student"}. Set pass to true only if the student directly answers the full question with enough specificity to move on. If any core part is missing, shallow, vague, or off-target, set pass to false.

The evaluator is called via `callAI(evaluatorSystem, [{role:'user', content: 'Checkpoint question: ' + question + '\n\nStudent answer: ' + answer}], 110)`.

### Passing requirements

- Model-graded pass/fail via the JSON contract above (`normalizeCheckpointEvaluation`
  at `headspa-mastery.html:6042`).
- If the returned JSON can't be parsed, defaults to `pass: false` with
  feedback `Your answer is not complete yet. Tighten it up and answer the
  full question directly.`
- If `pass` is true but `feedback` is empty/missing, defaults to `That
  answers the checkpoint clearly enough to move forward.`
- No length minimum, no keyword list, no rubric beyond the natural-language
  instructions above — grading is entirely delegated to the model call.

### Revision requirements

- On fail (`result.pass === false`): input and button re-enable, input
  refocuses, button label becomes `Retry` with `.retry-mode` styling. No cap
  on attempt count.
- `attempts` counter increments on every submission regardless of outcome
  (`meta.attempts = Math.max(1, (meta.attempts||0)+1)`).

### Feedback rules

- Feedback is rendered as one `<p>` per non-empty line of the model's
  `feedback` string.
- A separate status pill (`m0cp1Status`, via `renderCheckpointOutcomeLabel`)
  shows `Accepted` (state `accepted`) or `Needs revision` (state `revision`)
  based on stored `checkpointMeta.status`.

### Attempt behavior

- While a request is in flight: input and button are `disabled`, result area
  shows a three-dot `cp-thinking` indicator.
- On network/API failure (`.catch` in `submitCheckpoint`): calls
  `applyCheckpointInputState` to restore correct enabled/disabled state, and
  shows: `Cadence didn't respond — check your connection and try again.`
  (muted color, no retry-mode styling applied here — the button state is
  whatever `applyCheckpointInputState` computes from stored meta).

### State fields (`APP_STATE`, per module, in `assets/js/headspa-state.js`)

`createModuleProgress()` (line 77) shape, keyed by module id `"0"` under
`APP_STATE.data.progress`:

```
{
  checkpoints: [],       // array of passed checkpoint IDs, e.g. ['m0cp1']
  checkpointMeta: {},    // { m0cp1: createCheckpointMeta() }
  complete: false,
  unlocked: true,        // module 0 always unlocked
  startedAt: null,
  lastVisitedAt: null,
  lastScrollY: 0,
  maxReadPercent: 0,
  completedAt: null
}
```

`createCheckpointMeta()` (line 11), per checkpoint:

```
{
  status: '',       // '' | 'passed' | 'retry'
  feedback: '',
  answer: '',
  attempts: 0,
  updatedAt: null
}
```

Storage key: `levo_app` (`STORAGE_KEY`, `headspa-state.js:2`), schema version `2`.

### Completion dependency

- `MODULE_CHECKPOINTS['0'] = ['m0cp1']` — the single required checkpoint.
- `APP_STATE._hasAllRequiredCheckpoints(0)` must be true (i.e.
  `checkpointMeta.m0cp1.status === 'passed'`) for `isModuleComplete(0)` to
  return true.
- `canAccessModule(1)` requires `isModuleComplete(0)` — Module 0 is the sole
  gate for unlocking Module 1.

### Submission, restoration, acceptance, and retry functions

| Function | Role |
|---|---|
| `submitM0CP(id)` (`:6742`) | Thin wrapper — calls `submitCheckpoint(0, id, M0.system, M0.questions[id])` |
| `m0cpKey(e, id)` (`:6745`) | Enter-key (no shift) submits |
| `submitCheckpoint(moduleId, cpId, systemPrompt, question)` (`:6105`) | Shared submit path for all modules: disables input, shows thinking state, builds full system prompt, calls `evaluateCheckpointAnswer`, writes result via `APP_STATE.setCheckpointResult`, captures memory on pass, updates UI, resolves module completion if applicable |
| `evaluateCheckpointAnswer(systemPrompt, question, answer)` (`:6063`) | Builds evaluator prompt, calls `callAI`, normalizes response |
| `normalizeCheckpointEvaluation(raw)` (`:6042`) | Parses JSON, applies fallback defaults |
| `APP_STATE.setCheckpointResult(moduleId, cpId, result)` (`headspa-state.js:515`) | Persists pass/retry status, feedback, answer, attempt count; recomputes module completion; saves |
| `APP_STATE.captureCheckpointMemory(moduleId, cpId)` (`:721`) | On pass only — extracts tags/summary from the answer, stores into `cadenceMemory.notableAnswers` (max 8, most recent kept) |
| `APP_STATE._checkModuleComplete(moduleId)` (`:638`) | Re-derives `complete`/`completedAt`, triggers `renderHomeProgress`, shows the completion card after a 250ms delay |
| `resolveModuleCompletionUI(moduleId)` (`:5895`) | Reveals the completion card and scrolls it into view |
| `renderCheckpointOutcomeLabel(moduleId, cpId)` (`:5936`) | Renders/updates the `Accepted` / `Needs revision` status pill |
| `applyCheckpointInputState(moduleId, checkpointId, options)` (`:5963`) | Restores correct enabled/disabled + button label on view re-entry or after an error |
| `restoreLessonState(moduleId)` (`:5993`) | Called on module open; reconciles state and resolves completion UI if already complete |

---

## 5. Cadence context

### Module-specific context (`MODULE_GUIDE_SYSTEMS[0]`, line 6323, verbatim)

> You are Cadence — a mentor built from nearly two decades of hands-on experience in the head spa industry. Your voice is direct, warm, and earned. You are not a chatbot — you are a guide who knows this student from their introduction. The student is in Module 0 (Welcome & Overview): course philosophy, why head spa education is broken, scope of practice framing. Respond to their actual question. If their background is relevant — hairstylist, esthetician, newcomer, or anything else — acknowledge it naturally and connect it ONLY to head spa and scalp wellness. IMPORTANT: Every connection you make to a student's background must tie directly back to head spa services and scalp wellness — never to any other service category. Never be generic. 3-5 sentences. No bullet points.

This is composed at call time (`getGuideSystem()`, line 6356) with the same
`CADENCE_RESPONSE_CONSISTENCY_ANCHOR` + `CADENCE_SELECTIVE_MEMORY_INSTRUCTION`
+ `getCadenceMemoryContext(moduleId, 'guide')` additions used by checkpoints.

### Suggested prompts (`MODULE_QUICK_PROMPTS[0]`, line 6338)

- `How do I get the most from this course?`
- `What makes a service feel led vs performed?`
- `What should I focus on first?`

### Tone instructions

Global, not Module-0-specific, but active whenever Cadence speaks in Module
0 (guide chat, checkpoint grading, intro response): direct, warm, earned,
mentor-not-manual, no filler, no bullet points in guide/checkpoint answers,
3–5 sentence replies, reference specifics from the student's own words
(`CADENCE_RESPONSE_CONSISTENCY_ANCHOR`).

### Restrictions

- The Module 0 guide system prompt and the intro-response prompt both carry
  an explicit "never connect background to any other service category"
  guardrail (see section 2's intro system prompt — the guardrail text is
  identical in spirit, and the Module 0 guide prompt states its own version:
  "Every connection you make to a student's background must tie directly
  back to head spa services and scalp wellness — never to any other service
  category").
- `CADENCE_CHECKPOINT_TONE` (checkpoint-only) explicitly forbids "phrases
  about this being secret, private, or 'just between us.'"

### Fallback messages

- Checkpoint AI failure: `Cadence didn't respond — check your connection and try again.`
- Intro AI failure: `Welcome, {firstName}. Let's get started.` / `Welcome. Let's begin.`
- Guide-chat AI failure (`gpSend` catch, line 6410–6413): `Something went sideways — try that again?`

### References to the old course name

Confirmed occurrences of "HeadSpa Mastery" / "Headspa Mastery" directly
touching Module 0 or shared onboarding:

- `M0.system` (line 6226): `"You are Cadence, instructor of HeadSpa Mastery..."`
- `MODULE_GUIDE_SYSTEMS[0]` does not itself say "HeadSpa Mastery" by name,
  but every other module's guide system does, and all modules share the same
  `getGuideSystem()` composition — so the name is present in the wider
  Cadence identity even where module 0's own guide string omits it.
- Intro response system prompt (line 7495): `"This course is HeadSpa Mastery — a certification entirely focused on..."`
- `Begin HeadSpa Mastery` button label (line 2151)
- Brand wordmark on course home (line 2196): `Headspa Mastery`
- Intro screen brand mark (line 2126): `AIMT · HeadSpa Mastery`
- Course home progress card title (line 2204): `HeadSpa Mastery — Full Certification`
- Module 0 hero eyebrow itself (line 3735): `Module 0 · Introduction to Head Spa Mastery`

---

## 6. Current interactions

| Interaction | What the student does | Graded? | Persists? | Success behavior | Failure behavior | HTML IDs | Related JS |
|---|---|---|---|---|---|---|---|
| Read curriculum (0.1–0.11) | Scroll and read | No | Read-percent tracked (`maxReadPercent`) via scroll listener | Contributes 70% of the progress-bar weight | — | `.lesson-wrap` sections, no per-section IDs | `window.addEventListener('scroll', ...)` (`:6197`), `setReadProgress` |
| Checkpoint `m0cp1` | Free-text answer in `m0cp1In`, submit | Yes (model-graded pass/fail) | Yes — `checkpointMeta.m0cp1` persisted to `levo_app` | Status pill `Accepted`; module marked complete; completion card shown; Module 1 unlocked | Status pill `Needs revision`; button becomes `Retry`; input stays editable | `m0cp1`, `m0cp1In`, `m0cp1Btn`, `m0cp1Res`, `m0cp1Status` | `submitM0CP`, `submitCheckpoint`, `evaluateCheckpointAnswer` |
| Voice input on checkpoint | Click mic button, speak answer | N/A (fills textarea) | Only once submitted | Text populates `m0cp1In` | — | mic button inside `.cp-row` | `startVoice('m0cp1In', this)` |
| "Start Module 1 →" | Click after completion | No | Navigates + sets `currentModule` | Opens Module 1 | — | inside `#m0Complete` | `openModuleById(1)` |
| "Back to course" | Click after completion | No | Sets view to home | Returns to course home | — | inside `#m0Complete` | `showHome()` |
| Guide panel (Cadence chat) | Open panel, ask a question or tap a quick prompt | No | Chat history not persisted across sessions (`gpHistory` is in-memory, capped at 16 messages) | Streamed response | `Something went sideways — try that again?` | `guideBtn`, `guidePanel`, `gpMsgs`, `gpInput`, `quickPs` | `toggleGuide`, `gpSend`, `qa`, `getGuideSystem` |

Module 0 itself has no bespoke interactive widgets (no sliders, drag-order,
toggles, etc. — those appear in later modules like 2, 4, 5, 6, 7). The only
interaction unique to Module 0 is the single checkpoint plus standard
read-scroll tracking.

---

## 7. Completion behavior

### Exact completion requirements

- Single required checkpoint `m0cp1` must reach `status: 'passed'`
  (`MODULE_CHECKPOINTS['0'] = ['m0cp1']`).
- No read-percentage minimum gates completion — `_hasAllRequiredCheckpoints`
  is checkpoint-only; the read-percent only affects the *progress bar
  display* (70/30 weighting), not the unlock logic.

### Completion message

- `Module complete.`
- `You understand what you're building and the standard it's held to.`

### Competencies or outcomes claimed

No explicit "you can now do X" competency statement is shown at Module 0
completion beyond the subtitle above and the forward-looking next-module
teaser. The course-wide competency claims for Module 0 live only in its
curriculum body (0.9 "What success looks like" — but that describes
end-of-course outcomes, not Module-0-specific ones) and in Module 11's
certificate copy (`"...has successfully completed the HeadSpa Mastery
professional training program..."`, line 7860 — out of scope for this
Module 0 extraction, flagged here only because it's the closest thing to an
official outcomes claim tied to the course as a whole).

### Next-module unlock behavior

- `canAccessModule(1)` returns true once `isModuleComplete(0)` is true.
- `getHighestUnlockedModule()` and `resumeBtn` text update accordingly.

### Relevant state and functions

Same as section 4's "Submission, restoration, acceptance, and retry
functions" table — completion is a side effect of `setCheckpointResult` →
`_checkModuleComplete` → `resolveModuleCompletionUI`, not a separate code
path.

---

## 8. Source map

| Section | Source file | Line range / marker | Related functions | Related state properties |
|---|---|---|---|---|
| Module identity constants | `headspa-mastery.html` | 5758–5803 (`MODULE_CHECKPOINTS`, `MODULE_CP_COUNTS`, `MODULE_TITLES`) | — | — |
| Module 0 wrapper + curriculum | `headspa-mastery.html` | 3731–3974 (`#module0Wrap`) | `STATIC_MODULES[0]` (`:6542`) | — |
| Checkpoint markup | `headspa-mastery.html` | 3943–3959 (`#m0cp1`) | `submitM0CP`, `m0cpKey` | `checkpointMeta.m0cp1` |
| Completion card markup | `headspa-mastery.html` | 3961–3971 (`#m0Complete`) | `resolveModuleCompletionUI` | `progress['0'].complete`, `.completedAt` |
| `M0` object (questions + grading system) | `headspa-mastery.html` | 6222–6227 | `submitM0CP` | — |
| `submitCheckpoint` (shared) | `headspa-mastery.html` | 6105–6161 | — | `checkpointMeta.*` |
| `evaluateCheckpointAnswer` / eval prompt pieces | `headspa-mastery.html` | 5779–5788 (constants), 6063–6098 | `normalizeCheckpointEvaluation` | — |
| `MODULE_GUIDE_SYSTEMS[0]` | `headspa-mastery.html` | 6323 | `getGuideSystem` | — |
| `MODULE_QUICK_PROMPTS[0]` | `headspa-mastery.html` | 6338 | `updateGuideQuickPrompts` | — |
| Module-open Cadence greeting for module 0 | `headspa-mastery.html` | 6577 (inside `openModuleById`'s `greetings` map) | `openModuleById` | — |
| Intro cinematic script | `headspa-mastery.html` | 7348–7409 (`INTRO_SCRIPT`, `buildIntroScript`) | `startIntro`, `runIntroScript` | `student.introComplete` |
| Intro submit + Cadence response | `headspa-mastery.html` | 7457–7512 (`submitIntro`) | `submitIntro` | `student.name`, `.background`, `.introResponse`, `.introComplete`, `.responses` |
| Skip / begin / hide intro | `headspa-mastery.html` | 7514–7535 | `introProceed`, `skipIntro`, `hideIntro` | `student.introComplete` |
| Course home markup (progress card, module list row 0) | `headspa-mastery.html` | 2162–2277 | `renderHomeProgress` (not read in full here) | `progress['0']`, `resume.moduleId` |
| `createModuleProgress` / `createCheckpointMeta` shapes | `assets/js/headspa-state.js` | 11–19, 77–89 | — | — |
| `getModuleProgress`, `reconcileModuleState`, `_hasAllRequiredCheckpoints` | `assets/js/headspa-state.js` | 460–505 | — | `data.progress['0']` |
| `setCheckpointResult` | `assets/js/headspa-state.js` | 515–538 | — | `checkpointMeta`, `resume` |
| `canAccessModule`, `isModuleComplete`, `getHighestUnlockedModule` | `assets/js/headspa-state.js` | 540–552, 665–672 | — | — |
| `addResponse`, `captureCheckpointMemory`, `getCadenceMemoryContext` | `assets/js/headspa-state.js` | 693–799 | — | `student.responses`, `student.cadenceMemory` |
| Storage key / schema version | `assets/js/headspa-state.js` | 2–5 | — | `levo_app`, `schemaVersion: 2` |

---

## 9. Confirmed implementation concerns

Flagged only — nothing here has been fixed.

### Confirmed

1. **Old course name throughout Module 0's own code path.** `M0.system`,
   the intro response prompt, the "Begin HeadSpa Mastery" button, the brand
   wordmark, the intro brand mark, and the course-home certification title
   all say "HeadSpa Mastery" / "Headspa Mastery" — none currently say "Head
   Spa Certification Course." (Directly actionable against the global
   decision in `00-global-decisions.md`.)
2. **No student-visible certification/credential explainer in onboarding.**
   The only certification-related copy a new student sees before or during
   Module 0 is the progress-card title `HeadSpa Mastery — Full
   Certification` — there's no explanation of what certification means, how
   it's earned, or what it unlocks, despite `CLAUDE.md` describing
   certificate logic as a first-class feature of the product.
3. **Single free-response checkpoint is the only proof of Module 0
   competency**, and it grades two distinct questions in one answer ("what's
   the difference between performed/led" AND "where do you feel least
   confident") with one pass/fail. A student could answer the first part
   well and dodge the second, and the grading prompt does not explicitly
   require both parts to be present (unlike the Module 2 checkpoint, which
   gets bespoke `checkpointSpecificCriteria`).
4. **No loading state distinct from "thinking" for the intro cinematic
   itself** — if `callAI` in `runIntroScript`'s downstream `submitIntro` is
   slow, the only affordance is the three-dot `cwc-thinking` indicator; there
   is no timeout or explicit "this is taking a while" state.
5. **Retry has no attempt cap and no escalation.** A student can fail
   `m0cp1` indefinitely with no alternate path (e.g., no "talk to a human,"
   no simplified re-ask after N failures) — worth checking against the
   Cadence direction in `00-global-decisions.md` ("pass the student as soon
   as the required competency is demonstrated" implies no ceiling, but there's
   also no documented floor/support behavior for a genuinely stuck student).
6. **Voice-to-text button has no visible label**, only a `title` attribute
   (`Speak your answer`) — screen-reader/accessibility support depends
   entirely on whether `title` is meaningfully exposed, which is
   inconsistent across assistive tech.
7. **Checkpoint textarea placeholder is generic** (`Answer in your own
   words...`) and identical in *pattern* to other modules' checkpoints —
   not a Module-0-specific defect, but worth noting for consistency review
   since the question itself is two-part (see #3) and the placeholder gives
   no hint that two things are being asked.
8. **`MODULE_GUIDE_SYSTEMS[0]` never names the course** — every other
   module's guide-system string is silent on the course name too (they refer
   to "the head spa industry," not the product name), so this isn't an
   inconsistency introduced by Module 0, but it means the guide chat and the
   checkpoint-grading prompt (`M0.system`, which *does* say "HeadSpa
   Mastery") are not perfectly parallel in how they refer to the course.
9. **`APP_STATE.getResponseContext` (`headspa-state.js:801`) has zero call
   sites in `headspa-mastery.html`** (verified via grep) — it duplicates
   what `getCadenceMemoryContext` does with `student.background`/`name`/
   `responses` and appears to be dead code sitting alongside the function
   that's actually used by both checkpoints and the guide chat.

### Assumptions (not confirmed by reading code — flag for verification)

- It's assumed but not verified in this pass that `callAI` (referenced
  throughout but not read line-by-line here) has its own error/timeout
  handling beyond what's visible in the `.catch()` blocks already
  documented.
- It's assumed the certificate/credential copy at `headspa-mastery.html:7860`
  is Module 11 content and therefore out of scope — it was located via grep,
  not read in context, and is mentioned above only as a pointer, not as a
  verified Module 0 concern.
