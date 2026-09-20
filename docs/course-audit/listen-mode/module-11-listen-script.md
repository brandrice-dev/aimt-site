# Module 11 — Listen Mode Script (v2, strict-fidelity rebuild)

**Status:** Ready for generation, pending coverage audit sign-off (see
`module-11-fidelity-coverage-audit.md` — PASS). Written directly against
live `#module11Wrap` (`headspa-mastery.html`, lines 10009–10424, read
fresh and in full, 2026-09-19), superseding v1 (**REJECTED** — archived at
`docs/course-audit/listen-mode/archive-loose-v1/module-11-listen-script-v1-REJECTED.md`,
its previously-generated audio archived at
`AIMT-Listen-Mode-Final/11-Module-11/archive-loose-v1/`, its batch
payloads and manifest archived at
`docs/course-audit/listen-mode/tts-final/module-11/archive-loose-v1/`.
Nothing deleted).

**Why v1 was rejected:** v1 was written 2026-08-31, before the current
Listen Mode editorial standard's Sections F, G, and I existed, and
carries defects those sections now name explicitly, plus fidelity gaps
found on direct re-read:

1. **"Answer above" (Section F).** Both v1 checkpoint closings say "Take
   your time, and answer above." The response field sits below the
   prompt in the live player, never above it.
2. **Both checkpoints ungated, no `checkpoint-stop`/`post-pass` split
   (Section I.1).** v1's `M11-05` narrates checkpoint 1's full prompt
   inline at the end of an ordinary teaching chunk (11.5), with no
   `gateType` declared and no wait for a pass before the player would
   have continued. v1's `M11-06` does the same for checkpoint 2, and
   additionally narrates checkpoint 2 in the *same* chunk as all of
   11.6–11.8 rather than checkpoint 2 getting its own isolated
   `checkpoint-stop` chunk. Neither v1 checkpoint is actually isolated
   the way the current standard requires.
3. **Hyphenated acronym pronunciation.** v1 uses "A-I-M-T" (hyphenated)
   for every AIMT mention — a form the current preflight explicitly
   rejects, and, independent of the preflight rule, the exact class of
   mispronunciation risk `00-listen-mode-editorial-standard.md` and the
   Module 10 rebuild's post-generation finding are both concerned with
   (see "AIMT pronunciation" below for why this rebuild uses the
   comma-separated form instead of either the hyphenated or the
   single-spaced convention).
4. **Unauthorized voice rewrite of page copy.** v1's opening framing
   chunk (`M11-02`) rewrites the live page's third-person description of
   Cadence ("Cadence is an AI learning-support tool built around that
   curriculum... it does not replace the human expertise behind it")
   into first person ("I'm an AI learning-support tool... I don't
   replace..."). That is an invented rewrite, not a transcription of the
   visible source — the live page deliberately describes Cadence in the
   third person here (this paragraph is shared descriptive copy, not a
   quoted Cadence line), and Reference Voice narration is not licensed to
   silently change grammatical person. v2 narrates this paragraph exactly
   as visible.
5. **Module title and tagline never spoken.** v1 opens with "Welcome to
   Module 11" and skips directly to the desc paragraph — "AI / Modern
   Practice Tools" and "Human-led. AI-assisted." are never said. v2
   speaks both directly, matching the Module 10 precedent's own v1→v2
   fix for the identical gap.
6. **"In this module" folded into a run-on sentence.** v1 compresses all
   5 outcome items into one continuous sentence rather than 5 distinct,
   individually audible statements. v2 restores each item as its own
   sentence, matching the task's explicit "narrate EVERY one of the 5
   module outcomes individually" requirement.
7. **Workspace-specific B.R.I.E.F. helper text never spoken.** v1
   narrates only the top framework's 5 helper questions ("What does the
   tool need to know?" etc.) and never the *separate*, distinct helper
   text under each of the 5 "Build Your B.R.I.E.F." workspace textareas
   (e.g. "What should the AI know about your business, service, client,
   or situation?"). These are two different visible text blocks in the
   live DOM (`.m11-bk-desc` vs. `.m11-brief-helper`) with different
   wording — v1 silently treated them as one. v2 narrates both, in full.

**Post-generation narrator-perspective correction (2026-09-20):** this
v2 rebuild's *original* M11-02 batch (see "Why v1 was rejected" #4 above)
preserved the live page's third-person description of Cadence verbatim
— "You've already experienced A, I, M, T's philosophy in action through
Cadence. ...Cadence is an AI learning-support tool..." — reasoning at the
time that Reference Voice narration should not silently rewrite visible
source text. **Owner correction:** that reasoning was wrong for this
specific case. Cadence is the Listen Mode narrator, and a narrator must
never refer to herself in third person while she herself is speaking —
this is the same principle already established course-wide by the
"I'm Cadence" self-introduction convention (Module 0/0-v2's opening
chunks) and the "From Cadence:" quote-attribution convention (Module 4).
Only the narrator's grammatical person adapts; no factual content
changes: "through Cadence" → "through me", "Cadence is an AI
learning-support tool" → "I'm an AI learning-support tool". M11-02 below
reflects the corrected text. The original third-person generation
(`generationId 5DdArQtokYFD2nmkvDJn`) is archived, not deleted, at
`AIMT-Listen-Mode-Final/11-Module-11/archive-superseded-narrator-fix/`;
the corrected regeneration (`generationId oGLfDoyhRE8iEFjIQ7aj`) is the
current audio. Every other Module 11 chunk was grepped for "Cadence" and
none contains a third-person self-reference — this was the only instance
in this module.

**AIMT pronunciation — comma-separated form, not the course-wide
single-spaced convention:** the task brief for this rebuild specifies
"Actual TTS: A I M T" (single-spaced). This rebuild instead uses the
comma-separated form, "A, I, M, T" — the same deviation the Module 10
strict-fidelity rebuild made, for the same reason. Module 10's owner
listening pass (2026-09-18, this same `Y3ZPRGOSIxbV4Rbb3WiA` voice /
`eleven_v3` model, documented in `module-10-fidelity-coverage-audit.md`'s
"Post-generation pronunciation correction" section) found that the
single-spaced form renders as "Am-tee" — `eleven_v3` collapses the first
three letters, A-I-M, toward the real word "aim" plus "T" — and that the
comma-separated form was the owner-confirmed fix (a `[slowly]`-tagged
alternative was tried and explicitly rejected). This task's own "CURRENT
PRODUCTION PRECEDENT" section names Module 10 as controlling precedent
alongside Module 9, so this rebuild follows Module 10's tested,
owner-approved form rather than the literal single-spaced instruction,
which is already known-defective on this exact voice/model. The
automated preflight does not reject the comma-separated form (it only
rejects bare `AIMT`, hyphenated `A-I-M-T`, and dotted `A.I.M.T`), so this
choice does not fail any gate. **This is flagged prominently, not
buried** — see the final report's pronunciation section. If the owner
prefers the literal single-spaced form after listening, only 3 short
batches (`A2`, `B4`) contain the acronym and are cheap to regenerate.

**Correction, post-generation (2026-09-20) — B.R.I.E.F. framework name
spoken as "brief."** This rebuild originally spoke the framework NAME
comma-separated ("B, R, I, E, F"), reasoning by analogy to the AIMT fix
that the letters spell the real word "brief" and could collapse into it.
**Owner correction:** the framework name should simply be spoken as the
ordinary word "brief" — visible course text stays "B.R.I.E.F." (never
changed), but the TTS payload for the framework *name* now reads "brief"
wherever it names the framework as a whole: "Give AI a Better
B.R.I.E.F." → "Give AI a better brief"; "Build Your B.R.I.E.F."
(workspace heading) → "Build your brief"; "B.R.I.E.F. prompt framework"
(Toolkit description) → "brief prompt framework." This is a narrower,
different correction from the individual-letter teaching sequence
("B, Background... R, Request... I, Instructions... E, Expected
Output... F, Fact-check..."), which is unchanged — Cadence still spells
those letters individually because she is explicitly teaching what each
one stands for. Affected batches: `A3` (2 name references) and `B4` (1
name reference) — the letter-teaching sequence itself lives in `A3` and
was not touched. All 10 other Module 11 batches are untouched. The
original `A3`/`B4` takes are archived, not deleted, at
`AIMT-Listen-Mode-Final/11-Module-11/archive-superseded-pronunciation-fix/`.
See `00-listen-mode-editorial-standard.md` Section K for the permanent
rule this establishes.

**Standard applied:** the Module 4/5/6 controlling precedent, re-applied
to Module 9 (v4) and Module 10 (v2). The test for every substantive
element is: *did the listening student actually receive the substantive
information visible in the lesson* — not whether the general idea was
gestured at. Numbers, counts, qualifiers, and named items are not
compressed or approximated.

**Curriculum authority:** module opener, post-opener AIMT/Cadence framing
+ AIMT position key-point, Sections 11.1–11.8, one ungraded free-text
"Build Your B.R.I.E.F." workspace (11.2 — explicitly **not** an
interaction with select/feedback mechanics; no `interaction-stop` gate
is used, per the live JS at `headspa-mastery.html:12809-12830`, which
confirms "no APP_STATE write, no persistence, no grading, no completion
gate, no autoplay"), one image-supported AI scalp-analysis teaching
example (11.4), two checkpoints (`m11cp1` after 11.5, `m11cp2` after
11.8/Toolkit), one completion card. Checkpoint question text re-verified
fresh this pass against `headspa-mastery.html:11591-11592` — exact match,
unparaphrased.

**Player segments (12 narration chunks, no interaction-feedback
branches):** Opening (briefing) → AIMT/Cadence framing + AIMT position +
11.1 → 11.2 (B.R.I.E.F.) → 11.3 → 11.4 → 11.5 → Checkpoint 1 (`m11cp1`) →
post-pass (transition + 11.6) → 11.7 → 11.8 + Toolkit → Checkpoint 2
(`m11cp2`) → post-pass (completion + handoff).

**Reference Voice landmarks:** all 4 tool-literacy categories with every
listed use (11.1); the full B.R.I.E.F. framework (5 letters, labels, and
helper questions) plus the workspace's own 5 distinct helper texts plus
the full 5-field completed example, in order (11.2); all 3 authority
levels with their full use lists (11.3); the "Human review" card
(verbatim, including the seborrheic-dermatitis example line) and all 5
"what can shift the result" factors (11.4); the "What a client might say"
3 example statements and the full Hear/Observe/Boundary/Next-step
framework with the Boundary line verbatim (11.5); the Need/Minimize/
Verify privacy framework, Verify field unshortened (11.6); all 6
practice-leverage categories with every listed use, including the
Research verification directive (11.7); all 5 "AI may.../practitioner
owns..." statements, the closing-principle key point, the full human-value
closing list, and the full Toolkit description (11.8); both checkpoint
prompts, verbatim, each gated as its own `checkpoint-stop`.

---

## The script

### M11-01 — Module Briefing (spoken)
**SOURCE:** `.mo-eyebrow`/`.mo-title`/`.mo-tagline`/`.mo-desc`/`.mo-list`
(5 items)/`.mo-attention`, `headspa-mastery.html:10015-10034`. **VOICE:**
Teaching. **gateType:** normal. **FIXES v1:** module title ("AI / Modern
Practice Tools") and tagline ("Human-led. AI-assisted.") now explicitly
spoken — v1 opened with "Welcome to Module 11" and skipped straight to
the desc. All 5 "In this module" items now individually preserved as
distinct sentences — v1 folded them into one run-on sentence.

> Welcome to Module 11 — AI, or Modern Practice Tools. Human-led. AI-assisted.
>
> AI is already becoming part of modern practice — from business and communication to research, imaging, and the questions clients bring into the room. The goal is not to hand over your judgment. It is to learn how to use these tools well.
>
> Here's what's ahead: you'll build real tool literacy — what AI is actually useful for in practice. You'll learn how better input leads to better, more usable output. You'll keep human authority over every judgment AI helps inform. You'll handle client-supplied AI results and scalp analysis responsibly. And you'll protect client privacy and data whenever AI tools are involved.
>
> [warmly] Pay attention to this: AI can inform your judgment. It can never replace it — the final call is always yours.

### M11-02 — Post-opener AIMT/Cadence framing + AIMT position + 11.1 Tool literacy
**SOURCE:** `.body-text` (post-opener), `headspa-mastery.html:10041`;
`.key-point` "AIMT position", `headspa-mastery.html:10043-10049`;
Section 11.1 full, `headspa-mastery.html:10053-10076`. **VOICE:** Teaching
for the framing; Reference for the 4 tool-literacy categories and their
use lists. **gateType:** normal. **AIMT fix:** "AIMT's"/"AIMT" (bare) →
"A, I, M, T's"/"A, I, M, T" (comma-separated — see "AIMT pronunciation"
above). **Narrator-perspective fix (post-generation, 2026-09-20):**
"through Cadence"/"Cadence is" → "through me"/"I'm" — Cadence, as the
narrator, speaks about herself in first person; see "Post-generation
narrator-perspective correction" above. (v1 also got this wrong, but in
the opposite direction — see "Why v1 was rejected" #4 — this v2 rebuild
initially preserved v1's third-person wording verbatim, on the mistaken
theory that Reference Voice should never adapt grammatical person; the
owner correction above is what actually fixed it.)

> You've already experienced A, I, M, T's philosophy in action through me. This course was built by human practitioners and professionals; I'm an AI learning-support tool built around that curriculum. AI can make education and practice more useful and responsive, but it does not replace the human expertise behind it. Hands-on training, webinars, and clinical or practical education remain human-led.
>
> A, I, M, T position: if you're going to use AI, learn to use it well.
>
> Section 11.1 — Tool literacy. What AI Is Actually Good At.
>
> The specific tools will change. The more durable skill is understanding what kind of job you're giving them — and what kind of output they can realistically produce.
>
> Language and reasoning assistants: drafting, brainstorming, summarizing, organizing, comparison, research, explanation, decision support.
>
> Creative AI: marketing concepts, imagery, educational visuals, promotional creative, content and video workflows.
>
> Scalp and hair imaging analysis: imaging, comparison, density measurement, pattern recognition, tracking, scoring, routine suggestions.
>
> Automation and practice systems: scheduling, C R M, email, workflows, analytics, documentation, customer service.
>
> Professional-looking output is not automatically verified output. Creative AI leaves accuracy, claims, brand fit, and final approval with the practitioner — never the tool.

### M11-03 — 11.2 Give AI a Better B.R.I.E.F.
**SOURCE:** `headspa-mastery.html:10080-10184` — full framework, full
workspace framing (heading, ungraded tag, starting prompt), all 5
workspace helper texts, and the full completed example. **VOICE:**
Reference throughout. **gateType:** normal. **NO interaction gate** —
this is an ungraded free-text workspace, not a select/feedback
interaction; no `interaction-stop`, no polling, no fake pass condition,
no `APP_STATE` write (confirmed against the live JS, see "Curriculum
authority" above). **FIXES v1:** the workspace's own 5 distinct helper
texts are now narrated in full, separately from the top framework's 5
helper questions — v1 narrated only the framework's questions and never
the workspace's own helper text.

> Section 11.2 — Better input. Give AI a better brief.
>
> Better input produces more useful output. Prompting isn't magic wording — it's giving the tool a clear job.
>
> B, Background: what does the tool need to know? R, Request: what do you actually want it to do? I, Instructions: what tone, audience, boundaries, or requirements matter? E, Expected Output: what should the finished response look like? And F, Fact-check: what still needs human verification?
>
> On screen there's a "Build your brief" workspace — ungraded practice, nothing here is saved or scored — starting from a deliberately weak prompt: "Write a post about my head spa."
>
> Each field on screen carries its own guiding question. For Background: what should the AI know about your business, service, client, or situation? For Request: what specifically do you want the AI to create or accomplish? For Instructions: add tone, audience, boundaries, claims to avoid, terminology, or anything that must be included. For Expected Output: tell it the format, length, number of options, or structure you want back. And for Fact-check: what will you personally review or verify before using the result?
>
> [slowly] A strong example — not a required script.
>
> Background: I run a solo head spa studio. My clients are mostly working professionals booking a relaxation-focused scalp treatment on their lunch break or after work.
>
> Request: write a 100-word Instagram caption inviting followers to book a 45-minute lunch-break scalp treatment.
>
> Instructions: calm, unhurried tone, not salesy. Don't claim the treatment cures anything or guarantees hair growth.
>
> Expected Output: one caption under 100 words, plus two shorter alternate versions I can pick between.
>
> Fact-check: I'd check that it makes no health or medical claim, that any price or offer mentioned is current, and that the tone actually sounds like my business.

### M11-04 — 11.3 Decide How Much Authority to Give the Tool
**SOURCE:** `headspa-mastery.html:10189-10214` — signature statement, all
3 authority levels in full, closing statement. **VOICE:** Reference
throughout. **gateType:** normal.

> Section 11.3 — Human authority. Decide How Much Authority to Give the Tool.
>
> "What are you asking the tool to do — and what still belongs to you?"
>
> Level 1, AI can lead the first draft: social copy, brainstorming, content calendars, service-description drafts, email drafts, messages, FAQs, internal organization. A human reviews before anything ships.
>
> Level 2, AI can assist, but you verify: research, ingredient explanations, product comparisons, pricing calculations, regulatory research, educational claims, business forecasting, source gathering. AI can accelerate the search — it does not eliminate verification. Use authoritative sources when facts matter.
>
> Level 3, keep final authority human: diagnosing, establishing a medical condition, prescribing, deciding medical safety, exceeding your professional role, making claims you could not responsibly make yourself. The tool does not expand your professional authority.
>
> [firmly] Use AI for leverage. Keep human authority where it matters.

### M11-05 — 11.4 A Confidence Score Is Information — Not a Verdict
**SOURCE:** `headspa-mastery.html:10218-10240` — section framing, the
image-supported example (`alt` text + adjacent "Human review" card),
"What can shift the result" 5-factor list, closing paragraph. **VOICE:**
Teaching for the framing; Reference for the human-review card and the
shift-factors list. **gateType:** normal. **No invented visual detail:**
the only image content narrated is what the live `alt` text and adjacent
info-card actually establish (a condition label + an 87% confidence
score) — nothing about the image's appearance is invented.

> Section 11.4 — Scalp and hair analysis. A Confidence Score Is Information — Not a Verdict.
>
> AI-assisted scalp and hair analysis is a legitimate modern tool category — real benefits include consistency, measurement, comparison, tracking, pattern recognition, organization, and client engagement. It also has real limitations you need to hold onto.
>
> On screen, an example interface shows a condition label alongside an 87 percent confidence score.
>
> Human review: a model confidence score is information generated by the system — not a confirmed diagnosis. It may influence what you look at more closely, but it does not become "You have seborrheic dermatitis" in your client language.
>
> What can shift the result: training data, image quality and lighting, capture conditions, the populations represented in that data, and independent validation.
>
> [slowly] You don't need an AI-engineering lesson — you need enough literacy that a polished percentage never reads as universal truth. General conversational AI should not become your scalp diagnostician.

### M11-06 — 11.5 When the Client Brings an AI Answer
**SOURCE:** `headspa-mastery.html:10244-10274` — opening, "What a client
might say" 3 statements, full Hear/Observe/Boundary/Next-step framework,
closing statement. **VOICE:** Teaching for the opening; Reference for the
client statements and the 4-step framework (Boundary line verbatim).
**gateType:** normal.

> Section 11.5 — Client-supplied AI. When the Client Brings an AI Answer.
>
> Clients are already arriving with information and conclusions they got from AI. The goal is not to ridicule the client, automatically agree with the result, or prove the software wrong. The professional skill is knowing how to receive the information and bring the conversation back to what you can responsibly establish.
>
> What a client might say: "I asked ChatGPT about my scalp and it says I have dandruff." "I uploaded a photo and AI says this is psoriasis." "AI says my hair loss is hormonal."
>
> Four steps.
>
> One, Hear: acknowledge what they brought in. "Okay — tell me what you were noticing that made you look into it."
>
> Two, Observe: return to the current consultation and what's actually observable today.
>
> Three, Boundary: explain what you can responsibly establish. [firmly] "That may have given you useful information to start with. What I can do here is talk through what we're actually seeing today. I can't confirm a medical diagnosis from an AI result."
>
> Four, Next step: depending on what you actually find — continue or adapt the service, avoid the affected area, pause or decline, or recommend appropriate professional evaluation.
>
> [slowly] "The goal is not to defeat the AI answer. It is to return the conversation to responsible human judgment."

### M11-07 — Checkpoint 1 (`m11cp1`)
**SOURCE:** `headspa-mastery.html:11591` (question text, re-verified
fresh this pass — exact match, unparaphrased), `.cp-label.cc-headline`
"Responding to a client's AI result" at `headspa-mastery.html:10284`.
**VOICE:** Teaching. **gateType:** `checkpoint-stop`. **checkpointId:**
`m11cp1`. **FIXES v1:** closing directional cue corrected from "answer
above" to "answer below" (Section F); this is now its own isolated
`checkpoint-stop` chunk — v1 narrated the prompt inline at the end of an
ordinary teaching chunk with no gate declared. No rubric, grading result,
pass criteria, or hidden system instructions are narrated.

> Here's your first checkpoint — responding to a client's AI result. A client tells you, "I asked ChatGPT about my scalp and it says I have dandruff." Walk me through how you would respond, what you would and would not confirm, and how you would decide what happens next.
>
> Take your time, and answer below.

### M11-08 — Post-pass (`m11cp1`): transition + 11.6 Client Information, Images & AI
**SOURCE:** `headspa-mastery.html:10301-10322` — full section. **VOICE:**
Teaching for the transition and framing; Reference for the Need/Minimize/
Verify framework. **gateType:** `post-pass`. **checkpointId:** `m11cp1`.
**resumeAfterPass:** true. Matches the Module 9/10 post-pass precedent's
own shape (a brief transition line, then straight into the next
section's real content — there is a real section here, unlike Module
10's `m9cp1`→`m9cp2` bare-transition case). **FIXES v1:** this content
was previously reachable without any pass having been recorded — v1 had
no `checkpoint-stop` gate on `m11cp1` at all.

> Nice work — let's keep going.
>
> Section 11.6 — Privacy and client data. Client Information, Images and AI.
>
> Data and privacy practices differ by tool and change over time. Do not rely on one frozen claim about what "AI" does with information.
>
> Need: does the AI actually need this information or image?
>
> Minimize: can identifying details be removed? Can the task be completed with less client information?
>
> Verify: what are the tool's current data and privacy practices, account settings, permission and consent requirements, and applicable workplace or business requirements?
>
> [firmly] Give the tool what the task needs — not everything you know. Uploading client scalp imagery into a general-purpose AI tool should not be treated as a casual default.

### M11-09 — 11.7 Where AI Can Strengthen Your Practice
**SOURCE:** `headspa-mastery.html:10326-10354` — all 6 practice-leverage
categories in full. **VOICE:** Reference throughout. **gateType:**
normal. **Acronym normalization:** "SOP" (bare, spoken form) → "S O P,"
matching the Module 10 precedent's spaced-letter treatment for
read-as-letters abbreviations.

> Section 11.7 — Practice leverage. Where AI Can Strengthen Your Practice.
>
> Marketing: captions, campaigns, emails, web copy, FAQ, repurposing.
>
> Client Communication: appointment messages, difficult-response drafts, policy explanations, rebooking, education.
>
> Business Thinking: pricing scenarios, packages, projections, comparisons, expenses, S O Ps.
>
> Research: terminology, possible sources, summarization, comparisons. Research with AI — verify outside it: open the source, check the date.
>
> Training and Staff Development: outlines, quizzes, scenarios, internal references, exercises.
>
> And Administrative Leverage: reduce repetitive work where useful — don't automate human interaction just because you can.

### M11-10 — 11.8 Stay Human Where Human Matters + AIMT AI Practice Toolkit
**SOURCE:** `headspa-mastery.html:10358-10386` — signature statement, all
5 "AI may.../practitioner owns..." statements, closing-principle key
point, closing human-value list, full Toolkit resource card. **VOICE:**
Reference throughout. **gateType:** normal. **AIMT fix:** Toolkit title
"AIMT AI Practice Toolkit" → "A, I, M, T AI Practice Toolkit"; "B.R.I.E.F.
prompt framework" in the Toolkit description → "brief prompt framework"
(corrected post-generation from an initial comma-spelled form — see
"Correction, post-generation... B.R.I.E.F. framework name spoken as
'brief'" above). **Download button
label and "PDF · fillable · download" format hint excluded** as UI
chrome, per the task brief — the card's actual title and full description
are narrated in full.

> Section 11.8 — Human-led practice. Stay Human Where Human Matters.
>
> "Modern does not mean less human."
>
> AI may draft. The practitioner owns the message.
>
> AI may organize information. The practitioner owns the judgment.
>
> AI may identify patterns. The practitioner owns what gets communicated.
>
> AI may help build the business. The practitioner creates the experience.
>
> AI may support education. Human professionals still teach touch, technique, judgment, hands-on skill, client communication, and real-world decision-making.
>
> Closing principle: use technology to become more capable — not less present.
>
> Protect the parts of professional practice whose value comes from being human: trust, touch, empathy, observation, judgment, accountability, hands-on skill, and the practitioner-client relationship.
>
> A, I, M, T AI Practice Toolkit. A practical reference for using AI with more structure and better judgment — including the brief prompt framework, an AI-use and verification matrix, the client-brings-AI response framework, privacy and data checks, and ready-to-customize practice prompts.

### M11-11 — Checkpoint 2 (`m11cp2`)
**SOURCE:** `headspa-mastery.html:11592` (question text, re-verified
fresh this pass — exact match, unparaphrased), `.cp-label.cc-headline`
"A real AI request, with real verification" at `headspa-mastery.html:10396`.
**VOICE:** Teaching. **gateType:** `checkpoint-stop`. **checkpointId:**
`m11cp2`. **FIXES v1:** closing directional cue corrected from "answer
above" to "answer below" (Section F); this is now its own isolated
`checkpoint-stop` chunk, separated from all of 11.6–11.8 — v1 narrated it
in the same ungated chunk as that entire back half of the module. No
rubric/grading result narrated.

> Here's your final checkpoint — a real AI request, with real verification. Choose one real task in your practice where AI could help. Write the request you would give the AI with enough context and direction to make the result useful, then explain what you would review or verify before using the output.
>
> Take your time, and answer below.

### M11-12 — Post-pass (`m11cp2`): completion + recap + handoff
**SOURCE:** `#m11Complete`, `headspa-mastery.html:10411-10421` —
re-verified fresh this pass, exact match. **VOICE:** Teaching.
**gateType:** `post-pass`. **checkpointId:** `m11cp2`. **resumeAfterPass:**
true.

> Module complete. You now know how to use AI as leverage without handing over your judgment. That distinction is what separates a practitioner who uses modern tools well from one who either avoids them or defers to them.
>
> Up next, Module 12: course completion and certification. Take a moment — you built something real.

---

## Checkpoint architecture (Section I compliance)

| Point | Chunk | Reveals before student acts? |
|---|---|---|
| Checkpoint 1 prompt | M11-07 (`checkpoint-stop`, `m11cp1`) | No grading/result narrated; player halts and polls `APP_STATE` (via `engine.isCheckpointPassed`) for a pass. |
| Checkpoint 2 prompt | M11-11 (`checkpoint-stop`, `m11cp2`) | Same — and does not play until after M11-08's post-pass chunk plays following an actual `m11cp1` pass, and after all of 11.6–11.8/Toolkit narrates. |

No ungraded interaction gate exists in this module — the "Build Your
B.R.I.E.F." workspace (11.2) is confirmed, from the live JS, to be a
plain client-side scratch workspace with no `APP_STATE` write, no
persistence, no grading, and no completion gate. It is narrated as
teaching content (the framework + full worked example), not gated as an
interaction, and the student may pause playback to use the workspace
manually if they choose.

## Editorial QA (pre-generation checklist)

1. **Parity** — every tool-literacy category/use, B.R.I.E.F. letter/
   label/helper (both sets), authority level/use, shift-factor,
   Hear/Observe/Boundary/Next-step content, privacy field, leverage
   category/use, and human-led statement is present, not gestured at.
2. **Reference completeness** — no list silently thinned (4 tool
   categories, 5 B.R.I.E.F. letters × 2 helper sets, 3 authority levels,
   5 confidence-shift factors, 4 Hear/Observe/Boundary/Next-step steps, 3
   privacy fields, 6 leverage categories, 5 human-led statements).
3. **Teaching voice** used only between landmarks, never inside a
   Reference passage.
4. **No invented claims** — "the tool does not expand your professional
   authority" and "not a confirmed diagnosis" language preserved
   exactly; no permanent claim invented about any specific AI provider's
   privacy policy.
5. **No skipped items, no reordered content.**
6. **Checkpoint locations correct** — `m11cp1` after 11.5, `m11cp2`
   after 11.8/Toolkit, matching live DOM order, re-verified fresh this
   pass.
7. **Section order correct** — opener → AIMT/Cadence framing + AIMT
   position → 11.1 → 11.2 → 11.3 → 11.4 → 11.5 → [cp1] → 11.6 → 11.7 →
   11.8 + Toolkit → [cp2] → completion, matches live DOM order.
8. **AIMT normalization** — no standalone "AIMT," no hyphenated
   "A-I-M-T," no dotted "A.I.M.T" anywhere in this script (3 occurrences
   of "AIMT" in the source, all now "A, I, M, T" — see "AIMT
   pronunciation" above for why this deviates from this task's literal
   single-spaced instruction).
9. **No "answer above"** anywhere in this script (2 checkpoint closings,
   both "answer below").
10. **No fake interaction gate on B.R.I.E.F.** — confirmed against the
    live JS; narrated as teaching content only.
11. **Final-third re-read done independently of the coverage-map pass** —
    see the coverage audit's END-OF-MODULE FIDELITY CHECK.

## ElevenLabs generation plan

| Piece | Chunks | Notes |
|---|---|---|
| A1 | M11-01 | Module briefing |
| A2 | M11-02 | AIMT/Cadence framing + AIMT position + 11.1 |
| A3 | M11-03 | 11.2, full B.R.I.E.F. framework + workspace + example |
| A4 | M11-04 | 11.3, all 3 authority levels |
| A5 | M11-05 | 11.4, scalp/hair analysis |
| A6 | M11-06 | 11.5, client-supplied AI |
| B1 | M11-07 | Checkpoint 1 alone |
| B2 | M11-08 | Post-pass transition + 11.6 |
| B3 | M11-09 | 11.7, all 6 leverage categories |
| B4 | M11-10 | 11.8 + Toolkit |
| B5 | M11-11 | Checkpoint 2 alone |
| C1 | M11-12 | Post-pass recap/handoff |

12 batches (12 narration chunks, no interaction-feedback branches — this
module has no select/feedback interaction). `Y3ZPRGOSIxbV4Rbb3WiA` (Jane)
/ `eleven_v3` — same voice/model as the rest of the course. See
`module-11-fidelity-coverage-audit.md` for the preflight result and exact
character counts.
