# Module 12 — Listen Mode Script (v1, locked-standard production)

**Status:** Ready for generation. Written against the live `COPY.stateA`
object in `assets/js/module12-certification.js` (lines ~30–107),
2026-08-31.

**Special handling — this module is NOT like Modules 0/2–11.** Module
12's real content is a scored, server-authoritative certification exam
(`renderPartI`/`renderPartII`/`renderPartIII` in
`module12-certification.js`, backed by `functions/api/certification/*.js`).
Per the task's explicit instruction, Listen Mode here is scoped to
**State A only** — the pre-exam orientation screen a student sees before
tapping "Start Final Exam." State A is pure informational copy (how the
assessment works, passing requirements, the checkpoint-history note, and
the integrity notice) — it is not scored, does not reveal exam questions
or answers, and exists entirely before any attempt is created
server-side. This narration:
- Covers **only** State A's copy, start to finish, ending on the same
  "Good luck" line the screen itself ends on, immediately before the
  Start Final Exam button.
- Has **zero checkpoints, zero gates, zero post-pass segments** — it is
  a single linear playthrough with nothing to wait on.
- Never reads, previews, or hints at any Part I/II/III question, case,
  or Cadence-conversation content, because that content does not exist
  in State A's own copy — there is nothing to inadvertently reveal.
- Is implemented as an addition to `renderStateA()` only, not to any
  scored-state renderer (`renderPartI`, `renderPartII`, `renderPartIII`,
  `renderProcessing`, `renderStateC`, `renderStateD`, or the
  remediation/review renderers) — i.e. genuinely outside the
  server-authoritative assessment state machine, confined to the one
  function that runs before any attempt exists.
- Is explicitly torn down the instant a student taps "Start Final Exam":
  `onStartExam()` now calls `window.AIMTListenMode.unmount()` before
  doing anything else, so no player state, timer, or audio can survive
  into (or overlap with) scored content.

**Curriculum authority:** `COPY.stateA` in full — opening (4 lines),
"How the assessment works" (Parts I/II/III overview), "What passing
requires" (metrics + bullets + close), "What about the checkpoints you
already completed?", "Before you begin" (integrity notice), and the
final encouragement line.

**Player segments (1):** the entire State A screen, single chunk,
`gateType: 'normal'`, no checkpoint.

**Reference Voice landmarks:** the 5 passing-metric thresholds and 5
passing bullets (near-verbatim); the integrity-notice body (near-verbatim,
including the "do not use external AI... do not reopen the course" line
and the "Part III intentionally uses Cadence" line).

---

## The script

### M12-01 — State A orientation (spoken)
**VOICE:** Teaching for framing, Reference for the passing metrics, checkpoint-history note, and integrity notice.

> Welcome to your final assessment. You've completed the instructional part of the Head Spa Certification Course and demonstrated your understanding at required checkpoints along the way. This final assessment is different. You're no longer being walked through one module at a time — you'll be asked to remember what you learned, connect ideas from across the course, and make decisions the way you would in practice. Take your time. There is no countdown clock.
>
> Here's how the assessment works, in three parts. Part one, Knowledge and Retention: forty questions, half of your final score. Questions are mixed across Modules 1 through 11 rather than grouped by module — some test foundational knowledge, most give you realistic choices and ask you to identify the strongest answer based on what A-I-M-T taught. You can move between questions, change your answers, leave and return, and review everything before you submit. Once you submit the section, those answers lock.
>
> Part two, Applied Practitioner Cases: four cases, thirty percent of your final score. This is where the course starts coming together — each case gives you a realistic situation that may involve several things at once: client communication, assessment, service adaptation, safety, sanitation, business judgment, or another part of the curriculum. Some answers will be structured, others may ask you to explain your reasoning briefly. Each case locks when you submit it.
>
> And part three, Practitioner Conversation with Cadence: three conversations, twenty percent of your final score. This last part should feel different — you'll have a short conversation with me about professional situations you could realistically encounter in practice. There's no perfect script to memorize. Answer naturally, explain what you would do and why. I evaluate your response against A-I-M-T-defined competency criteria and may ask one follow-up if there's something important I need you to clarify. You're not being graded on perfect grammar, polished writing, or sounding impressive — we want to understand how you think.
>
> [firmly] What passing requires: certification is based on demonstrated competency, not simply reaching the end of the course. You'll need 80% or higher overall, 75% or higher on Knowledge and Retention, 75% or higher on Applied Practitioner Cases, 80% or higher on the Practitioner Conversation, and all required critical competency areas cleared.
>
> A strong overall score cannot override an unresolved issue in an area involving professional scope, client safety, consent or touch authority, or sanitation and process integrity. Likewise, one missed multiple-choice question does not automatically mean you failed a critical competency — A-I-M-T looks for the actual reasoning and pattern of understanding demonstrated across the assessment.
>
> What about the checkpoints you already completed? I've been checking your understanding throughout the course, and passing those required checkpoints is part of what made you eligible to take this final assessment. Your previous checkpoint answers do not secretly add or subtract points from your final score. If you need remediation afterward, that history may help A-I-M-T identify what you already understand well and where additional review would actually be useful.
>
> [slowly] Before you begin: Parts one and two are intended to reflect your own retained knowledge and judgment. Do not use external AI to generate your answers, and don't reopen the course to search for each answer while taking those sections. Part three intentionally uses me — that's part of the assessment design. Your progress is saved, so you don't have to rush. Once you intentionally submit a section, that section locks.
>
> [warmly] You do not need a perfect score, and you do not need perfect wording. Read carefully. Trust what you learned. When a question asks for judgment, think about the whole situation rather than looking for the quickest answer.
>
> Good luck.

---

## Editorial QA (pre-generation checklist)

Parity against `COPY.stateA` confirmed line-for-line (opening, all 3
part overviews, all 5 passing metrics + bullets + close, checkpoint-
history note, integrity notice, final encouragement) — nothing added,
nothing paraphrased away, no exam content invented or previewed. Voice
correct (Reference for policy/threshold language, Teaching for framing).
No skipped items. Single-chunk, no gating, no checkpoint — confirmed
appropriate since State A itself has no checkpoint or gate. Ends exactly
on "Good luck," matching the screen's own last line before the Start
Final Exam button. Estimated ~4 min total.

## ElevenLabs generation plan

| Piece | Chunks | Approx. chars |
|---|---|---:|
| A1 | full State A orientation | ~3,550 |

1 generation, `Y3ZPRGOSIxbV4Rbb3WiA` / `eleven_v3`.
