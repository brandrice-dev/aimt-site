# Module 0 — Listen Mode Script (v2, strict-fidelity rebuild)

**Status:** Owner-review staging. Rebuilt from the *current live*
`headspa-mastery.html` `#module0Wrap` (lines 6950–7255, read in full
2026-09-17), not from the rejected v1 draft or the (also stale)
`docs/course-audit/modules/module-00-source.md` extraction. Supersedes
`module-00-listen-script.md` (v1, 2026-08-31/09-13) as the narration source
of record — that document is retained for history only at
`archive-loose-v1/module-00-listen-script-v1-REJECTED.md`, per the "archive,
don't delete" convention already used for Modules 5/6/7/8.

**Why this rebuild happened (read-only audit findings, all confirmed and
fixed below):**
1. The current generated v1 audio's checkpoint closing line said "answer
   **above**" — directionally backwards (the response field sits below the
   prompt). Fixed per Editorial Standard §F: closing line is now exactly
   "Take your time, and answer below."
2. The v1 script's **M0-01b "Before you begin" chunk narrated Listen Mode
   orientation mechanics that no longer exist in `#module0Wrap`** — that
   content was relocated (not duplicated) to the standalone
   `#howAimtWorksView` orientation screen by commit `2a56bf5`
   ("Add How AIMT Works course orientation"). Confirmed directly: reading
   `#module0Wrap` end-to-end, `.mo-attention` ("Pay attention to") is
   immediately followed by `.mo-footer` — there is no "Before you begin"
   block anywhere in the live module. **M0-01b is dropped entirely in this
   rebuild.** Per instruction, this rebuild does not re-teach or duplicate
   the How AIMT Works orientation content — that is a separate, already-built
   screen with its own (unrelated) Listen Mode question.
3. The v1 script's opening chunk **loosely paraphrased** the module opener's
   real, five-item "In this module" list instead of narrating it in
   Reference Voice. The live list (`.mo-list`, verified verbatim below) is
   now named item-by-item, in visible order, per the Editorial Standard's
   Reference Voice rule (§C).
4. The v1 script folded the 0.5 "From Cadence" card into surrounding
   narration with **no first-person label adaptation** — the exact
   anti-pattern already fixed in Modules 5/6/7's rebuilds. Fixed here using
   the same pattern established there ("[warmly] Here's a note from me:
   ..." — see `module-06-listen-script.md`'s 6.4 card for the precedent).
5. Never previously received a coverage-audit process. This rebuild is
   accompanied by `module-00-fidelity-coverage-audit.md`, including the
   mandatory END-OF-MODULE FIDELITY CHECK (Editorial Standard §G).

**Curriculum authority:** `headspa-mastery.html` `#module0Wrap`
(lines 6950–7255), read in full 2026-09-17. The checkpoint question is
authoritative from `const M0 = { questions: { m0cp1: ... } }`
(`headspa-mastery.html:11097-11109`) — quoted verbatim below, never altered.
Module identity, "In this module" list, and completion copy all verified
directly against the live DOM, not any prior draft.

**Player segments (14, one fewer than v1 — M0-01b dropped):** Opening
(module briefing, incl. "In this module" + "Pay attention to") → 0.1 → 0.2 →
0.3 → 0.4 → 0.5 (+ From Cadence note) → Practice → 0.6 → 0.7 → 0.8 → 0.9 →
0.10 → 0.11 → Checkpoint (`m0cp1`) → post-pass recap/handoff.

**Reference Voice landmarks (verbatim/near-verbatim, visible order):** the
module opener's five-item "In this module" list; 0.6's five numbered
principles; 0.7's five technician-behavior cards; 0.9's four
success-behavior cards; 0.11's five common-mistake cards. All five card/list
groups are narrated in full, in real on-screen order — none compressed to
"representative examples," matching v1's own precedent (each item is short
enough that full coverage costs little runtime) and the Editorial
Standard's parity rule (§E).

**AIMT normalization:** two real occurrences of the word "AIMT" in Module
0's live text (0.1's "AIMT's curriculum" and 0.2's "Completing AIMT's Head
Spa Certification Course"). Both rendered as **"A I M T"** (space-separated
letters, per this pass's locked convention — not the hyphenated "A-I-M-T"
v1 used, which `scripts/aimt-listen-tts-preflight.mjs` now explicitly
rejects). Confirmed no other module-0 occurrence exists.

---

## The script

### M0-01 — Module Briefing (spoken)
**SOURCE:** `.mod-opener` — `.mo-tagline`, `.mo-desc`, the five-item
`.mo-list` (Reference Voice — full, verbatim-close, in visible order), and
`.mo-attention`.
**VOICE:** Teaching, moving into Reference for the five-item list.

> Welcome. I'm Cadence — I'll be your guide through this course, testing your reasoning and connecting every idea back to a real service you'll actually deliver.
>
> Clients can feel the difference between a service that's being performed and one that's being led. Your job is to lead it. Before technique begins, this module establishes how the course works and the professional standard behind every service decision that follows.
>
> In this module: you'll understand how this certification works, and what to expect from each module. You'll see who this course is built for, and what's expected of you as a practitioner. You'll learn the professional standard behind every decision you'll make with a client. You'll recognize what actually separates a great technician from an average one. And you'll see the early mistakes new practitioners make most often — before you make them.
>
> [warmly] One thing to pay attention to as you go: scope and safety come up here in Module 0 for a reason. Everything else in this course builds on staying inside it.

### M0-02 — 0.1 Welcome
**SOURCE:** Section 0.1, verbatim live text.
**VOICE:** Teaching.

> Section 0.1 — Welcome.
>
> I'm Cadence, the course guide built to help you work through A I M T's curriculum, test your reasoning, and connect each concept to real service delivery. The course itself was built from nearly two decades of hands-on work across cosmetology, esthetics, elevated client experience, service design, and scalp-focused care. It was created to solve a problem that appears throughout head spa education: students are often given pieces, but not a complete working system.
>
> You might learn what a head spa is. You might see tools. You might get a general idea of the experience. But that is not the same as knowing how to perform the service well — how to guide the client through it confidently, adjust when something feels off, and create something that feels intentional from beginning to end.
>
> That is what this course is for. A working framework built through real services on real clients — not just the order of the service, but the logic behind it. Why transitions matter. How to pace the room. How to build trust. How to make decisions in real time. This is not theory dressed up as expertise. It is a working framework built through repetition, observation, and refinement.

### M0-03 — 0.2 What this course is
**SOURCE:** Section 0.2, both `clinical-note` cards.
**VOICE:** Teaching, moving into Reference for the two boxed notes (exact framing preserved — both are deliberately-worded scope/certificate statements).

> Section 0.2 — What this course is. A framework. Not a script.
>
> This course is a complete service framework. It teaches you how to think through the head spa experience as a practitioner — not just copy movements or memorize a sequence. You will learn service structure, client flow, assessment thinking, scalp pattern recognition, treatment logic, setup, positioning, and sanitation.
>
> Just as important — you will learn how to stay in your lane. You are not being trained to diagnose or treat medical conditions. You are being trained to observe, recognize patterns, educate appropriately, and know when not to proceed. That distinction matters.
>
> What this course is not: this is not the only way to perform a head spa. Rigid systems create fragile practitioners. The goal here is understanding — not imitation — so you can adapt based on your space, your tools, your client, and your scope.
>
> What your certificate represents: completing A I M T's Head Spa Certification Course means you have worked through the required curriculum and demonstrated the course competencies. Your certificate documents that achievement. It is not a state license, a medical credential, or permission to work beyond the services your existing license and local laws allow. Your licensing authority, local regulations, and professional scope remain the standard you must follow.

### M0-04 — 0.3 Who this is for
**SOURCE:** Section 0.3, verbatim live text.
**VOICE:** Teaching.

> Section 0.3 — Who this is for. The person who wants more than inspiration.
>
> There is a difference between watching head spa content and performing a head spa service professionally. This course is built for the person who wants to know what to do, what not to do, what to look for, what to say, and how to make the service feel consistent every time.
>
> Inspiration is easy. Repetition, structure, judgment, and execution are what make a real practitioner.

### M0-05 — 0.4 What you'll learn
**SOURCE:** Section 0.4 + the "A common mistake" info-card.
**VOICE:** Teaching.

> Section 0.4 — What you'll learn. You are not just learning steps. You are learning how those steps connect.
>
> The course is structured in layers, because strong services are built — not assembled. You will move through orientation and scope, client experience, anatomy and assessment, scalp types and treatment thinking, conditions and disorders, tools and setup, full service execution, sanitation, and pricing.
>
> A common mistake worth naming early: jumping straight to the experience before understanding the structure underneath it. That leads to inconsistency. A strong service is not a collection of premium parts. It is a system.

### M0-06 — 0.5 How to use this course
**SOURCE:** Section 0.5 + the `cadence-note` card.
**VOICE:** Teaching, moving into first-person-adapted Reference for the Cadence note.

> Section 0.5 — How to use this course. Move through it in order. Use it actively.
>
> Each module supports the next. If you skip scope, you are more likely to overstep in consultation. If you rush anatomy, your assessment reasoning becomes weaker. If you ignore setup, the service flow breaks down.
>
> The course is self-paced, but it is not designed to be rushed. Pause for the practice moments. Answer checkpoints from your own reasoning. Use me — Cadence — to question, clarify, and strengthen your thinking, not to write the answer for you. Physical technique still requires repetition outside the screen.
>
> [warmly] Here's a note from me: as you move through the course, don't stop at "what do I do here?" Ask why it matters, what problem it solves, and what should change when the client or scalp in front of you does not match the ideal example. That is where professional judgment begins.

### M0-07 — Practice interaction: "Same steps. Different service."
**SOURCE:** the ungraded practice interaction.
**VOICE:** Teaching framing, Reference for both practitioner descriptions (word-for-word — the whole point of this exercise is the precise contrast).

> Practice — this one's ungraded, just for your own thinking. Same steps. Different service.
>
> Both practitioners know the service sequence. Which one is leading the experience?
>
> Practitioner A: the practitioner follows the sequence exactly. When the next product is out of reach, they step away without explanation, return, and continue where they left off. They do not check comfort because the client has not complained.
>
> Practitioner B: the practitioner prepares the transition, tells the client what is changing, watches for tension, checks temperature and comfort, and adjusts the sequence when the client or scalp response calls for it.
>
> Take a moment and decide for yourself before you move on.

### M0-08 — 0.6 The standard
**SOURCE:** Section 0.6, all five `protocol-card` principles.
**VOICE:** Teaching for the framing, Reference for all five principles — named in order, "why it matters" preserved closely.

> Section 0.6 — The standard. Five principles this course is built on.
>
> One. The service should feel controlled, not chaotic. Clients may not know why something feels off — but they feel it immediately. Sloppy transitions, hesitation, and inconsistent touch all break trust. A premium experience is the result of structure, not magic.
>
> Two. Observation comes before assumption. Strong practitioners look first, then decide. Weak practitioners decide what they think is happening before they actually look. That is how people misread scalp conditions, overuse products, and talk themselves into the wrong protocol.
>
> Three. Relaxation and professionalism can coexist. Calm does not mean careless. The service can be deeply sensory while still being prepared, well-paced, hygienic, and professionally responsible. Those qualities support one another.
>
> Four. Human touch matters more than tools. Tools can support precision, consistency, comfort, and sensory interest. They cannot replace prepared hands, attentive pacing, clear communication, or professional judgment. Tools are optional. Intentional delivery is not.
>
> Five. Restraint is part of expertise. Not every situation requires action. Some require pause. A professional knows when to adjust, when to simplify, and when to refer out. You do not prove skill by pushing through situations you should have stopped.

### M0-09 — 0.7 What makes a great technician
**SOURCE:** Section 0.7, all five `scalp-card` behaviors.
**VOICE:** Teaching for framing, Reference for all five cards in order.

> Section 0.7 — What makes a great technician. A great technician is not just someone with good hands.
>
> They know how to hold the room, observe, ask, confirm, and adjust, make decisions when things don't match expectations, explain simply, and repeat quality consistently. That last one is what builds a business.
>
> Hold the room: guide the pace, comfort, transitions, and emotional tone of the service from the moment it begins.
>
> Observe: notice scalp appearance, client feedback, body language, temperature response, and sensitivity — then ask, confirm, and adjust, instead of assuming.
>
> Make decisions: adjust within scope, simplify the protocol, or pause and refer — without freezing when something looks unexpected.
>
> Explain simply: say what you see and why you're adjusting — without sounding clinical or outside your lane.
>
> And repeat quality: anyone can have one good service. A real practitioner delivers a strong experience consistently. Clients do not come back because one moment was nice — they come back because the experience felt reliable, intentional, and worth repeating.

### M0-10 — 0.8 Scope and safety
**SOURCE:** Section 0.8 + the `clinical-note` "The professional frame" box.
**VOICE:** Teaching moving into Reference for the boxed professional-frame language (deliberately precise, client-facing script).

> Section 0.8 — Scope and safety. Take this seriously from the beginning.
>
> Head spa services involve visible scalp conditions — flaking, buildup, redness, thinning, irritation. But this is not a medical service. You are not diagnosing. You are not prescribing. You are not replacing a dermatologist.
>
> The professional frame: you are observing and documenting visible findings, working within scope, supporting comfort and scalp wellness appropriately, and recognizing when to modify, pause, or refer. A strong practitioner can say — "This is what I can see. This is how I can safely adapt within my role. This is where I would pause and recommend further evaluation." Never communicate certainty you are not qualified to provide.
>
> People get into trouble in this industry because they want to sound advanced. They start speaking with too much certainty about conditions they are not qualified to diagnose. That does not make them look experienced. It makes them look reckless. Local laws, licensing standards, and sanitation requirements vary — knowing yours is your responsibility, not an afterthought.

### M0-11 — 0.9 What success looks like
**SOURCE:** Section 0.9, all four `scalp-card` behaviors.
**VOICE:** Teaching for framing, Reference for all four cards in order.

> Section 0.9 — What success looks like. By the end of this course, you should not be guessing.
>
> You will still need practice. But you will no longer be improvising.
>
> Guide confidently: move a client through the complete experience — from intake to close — with a prepared flow, clear communication, and the ability to recover when something changes.
>
> Assess without overstepping: observe and describe visible findings accurately, document what matters, and stay on your side of the professional boundary.
>
> Adapt in real time: adjust based on what you see — not what you planned before the client sat down.
>
> And perform repeatably: deliver the same quality experience for every client — not just the ones where everything went smoothly.

### M0-12 — 0.10 Practitioner insight
**SOURCE:** Section 0.10 + `key-point`.
**VOICE:** Teaching.

> Section 0.10 — Practitioner insight. Clients remember how it felt. Not just what you did.
>
> What makes a service feel premium is your control, your pacing, your confidence, and your transitions. Most practitioners chase tools. The real difference is delivery.
>
> [slowly] The service starts feeling premium long before the signature steps begin. It starts when the client feels they are with someone who knows exactly what they are doing. That feeling is worth more than any gadget.

### M0-13 — 0.11 Common early mistakes
**SOURCE:** Section 0.11, all five `info-card` mistakes.
**VOICE:** Teaching for framing, Reference for all five in order.

> Section 0.11 — Common early mistakes. Five patterns that show up every time.
>
> Overvaluing tools: tools are secondary. Structure, flow, judgment, and touch matter more. Always.
>
> Wanting steps without understanding the foundation: without scope, setup, assessment, and client management underneath the sequence, the steps only take you so far.
>
> Performing instead of caring: when practitioners try too hard to look luxurious, they become less grounded. Clients feel when something is overly staged and under-supported.
>
> Underestimating how precise relaxation services need to be: calm magnifies sloppiness. Every break in flow becomes more obvious in a relaxation setting, not less.
>
> And starting before you are consistent: excitement is not readiness. You should not be offering a premium service you cannot yet deliver with control.

### M0-14 — Checkpoint (`m0cp1`)
**SOURCE:** the checkpoint question only, quoted verbatim from
`const M0.questions.m0cp1` (`headspa-mastery.html:11099`) — never the
grading rubric (`M0.system`).
**VOICE:** Teaching. Ends the player audio; the checkpoint stop is
structural (`gateType: 'checkpoint-stop'`), not a spoken instruction to
pause.

> Before you move on — here's the checkpoint for this module.
>
> Two practitioners can follow the same service sequence and create completely different experiences. In your own words, what changes when a practitioner leads the service instead of simply performing the steps? Give one specific example of what leading would look like during a head spa service.
>
> Take your time, and answer below.

**Directional-cue compliance (Editorial Standard §F):** closing line is
exactly "Take your time, and answer below." — never "above." This is the
one concrete fix to the material already-flagged defect in the current v1
audio.

### M0-15 — Post-pass continuation: completion + recap + handoff
**SOURCE:** the `#m0Complete` completion card, verbatim live text
(`lc-body`, `lc-next-label`, `lc-next-text` — **note: this differs from both
the v1 script and the stale `module-00-source.md` extraction**, which both
quoted an older completion copy. Live text confirmed 2026-09-17).
**VOICE:** Teaching. `gateType: 'post-pass'`, `resumeAfterPass: true` —
surfaces as "Continue Listening," never auto-plays after the pass.

> The standard is established.
>
> You can tell the difference between following a sequence and leading the full client experience — a service that feels controlled instead of chaotic, built on observation before assumption.
>
> Up next — Module 1. You'll define the professional role itself: what a head spa practitioner is responsible for, where that responsibility ends, and why that boundary protects both the client and the practitioner.

---

## Editorial QA (pre-generation checklist)

1. **Curriculum parity** — every section (0.1–0.11), the practice interaction, and the checkpoint prompt are covered; nothing invented beyond the real page content. ✓
2. **Reference Voice completeness** — the module-opener 5-item list, and all four numbered card groups (0.6 ×5, 0.7 ×5, 0.9 ×4, 0.11 ×5), named in full, in visible order, none dropped. ✓ (this is the concrete fix for defect #3 in this rebuild's "why" section above)
3. **No orphaned Listen Mode mechanics** — M0-01b ("Before you begin") fully removed; confirmed zero references to Resume Listening/Listen Again/pause-resume mechanics anywhere in this script, since that content now lives only in `#howAimtWorksView`, out of this module's scope. ✓
4. **"From Cadence" first-person adaptation** — M0-06's Cadence note is introduced as "Here's a note from me," not read in the third person. ✓
5. **No "answer above"** — grepped the full script: zero instances. Checkpoint closes with "Take your time, and answer below." ✓
6. **AIMT normalization** — both real occurrences ("A I M T's curriculum", "A I M T's Head Spa Certification Course") use space-separated letters, no hyphens, no bare "AIMT." ✓
7. **Natural Teaching Voice** — connective narration paraphrases rather than reading verbatim; only the clinical-note/cadence-note boxes and the practice-interaction scenarios are kept close to verbatim (deliberately precise/comparison language). ✓
8. **No invented claims** — no new certification claims, no outcome promises beyond what's on the page. ✓
9. **No diagnostic expansion** — 0.8's "not diagnosing / not prescribing" framing is preserved and never softened. ✓
10. **Correct checkpoint stop location** — checkpoint chunk (M0-14) is the module's only checkpoint, ends the section it evaluates (all of 0.1–0.11), matching its real on-screen position at the end of the module. ✓
11. **Correct section announcement order** — 0.1 → 0.2 → ... → 0.11 announced in that exact order, matching the live page. ✓
12. **Completion copy matches live text exactly** — verified against `#m0Complete` directly, not a stale extraction. ✓ (fixes the stale-completion-copy drift found in both the v1 script and `module-00-source.md`)

## END-OF-MODULE FIDELITY CHECK (Editorial Standard §G, mandatory)

Dedicated second pass over the module's final third (0.9 through
completion), re-read side by side with `#module0Wrap`'s live final third,
independent of the full coverage-map pass above:

- **0.9 (four cards):** all four `scalp-card` name/look pairs (Guide
  confidently / Assess without overstepping / Adapt in real time / Perform
  repeatably) present, in order, none thinned. ✓
- **0.10 (practitioner insight + key-point):** both the body text and the
  `key-point` callout narrated — not silently dropped as a "last item in a
  sequence" the way Module 6's original rebuild missed a headline. ✓
- **0.11 (five cards, the actual last numbered section):** all five
  `info-card` title/text pairs present, in order — this is the specific
  "near the end of the module" position the Editorial Standard's §G rule
  was added to protect against. Explicitly double-checked: no card
  thinned, no card reordered, no paraphrase creep on any of the five. ✓
- **Checkpoint placement:** M0-14 immediately follows 0.11 in live DOM
  order (confirmed: `</div>` closing 0.11's last info-card is directly
  followed by `<hr class="divider">` then the `#m0cp1` checkpoint block —
  no other content between them). ✓
- **Completion language exact match:** `lc-body` and `lc-next-text` quoted
  verbatim from the live `#m0Complete` card (see M0-15 source note above),
  not from either prior document. ✓
- **Directional cue:** "answer below," not "above," confirmed by direct
  grep of this file (zero "above" matches within 40 characters of
  "answer"). ✓

**Result: PASS.** No drift found in the final third; no fix required before
proceeding to TTS preflight.

## Coverage map — Headline Rule disposition (every substantive heading)

| Live element | Disposition |
|---|---|
| `.mo-eyebrow` "Module 00" | (C) decorative module-number label, not spoken (matches Module 1/4-7 convention — modules are announced by name/content, not by raw number label) |
| `.mo-title` "Welcome" | (B) folded into the opening sentence via `.mo-tagline`/`.mo-desc` framing |
| `.mo-tagline` / `.mo-desc` | (A) own announced beat in M0-01 |
| `.mo-section-label` "In this module" | (B) folded as the lead-in to the 5-item Reference Voice list in M0-01 ("In this module: ...") |
| `.mo-attention-label` "Pay attention to" | (B) folded as the lead-in to the closing M0-01 line ("One thing to pay attention to...") |
| `.mo-footer-soon` "Listen with Cadence — coming soon..." | (C) UI/player status chrome referring to Listen Mode's own availability — self-referential, not curriculum, never narrated (would be nonsensical for Cadence to narrate her own "coming soon" label while actively playing) |
| 0.1–0.11 `.sec-eyebrow`/`.sec-title` (11 sections) | (A) each gets its own announced beat, M0-02 through M0-13 |
| Practice section `.sec-eyebrow` "Practice — ungraded" | (A) own announced beat in M0-07 |
| `.clinical-note`/`.cadence-note` labels ("What this course is not," "What your certificate represents," "The professional frame," "From Cadence") | (A) each gets its own Reference Voice beat, folded into its parent section's chunk |
| `.info-card`/`.protocol-card`/`.scalp-card` titles (0.4, 0.6 ×5, 0.7 ×5, 0.9 ×4, 0.11 ×5) | (A) every one named individually, in visible order — see Reference Voice landmarks above |
| `.key-point` (0.10) | (A) own beat in M0-12 |
| `#m0cp1` checkpoint labels ("Before you move on," "Apply what you just learned," etc.) | (C) UI-state chrome (ready/progress/done labels) — not spoken; only the underlying question text is narrated, per convention (checkpoint UI states are never narrated, matching Modules 1/4-7) |
| `#m0Complete` (`lc-title`, `lc-body`, `lc-next-label`, `lc-next-text`) | (A) own beat in M0-15 |

Every substantive heading has an explicit disposition. Zero unaccounted
headings.

## ElevenLabs generation plan

Word/char counts (spoken text only, tags/headers excluded) and natural
generation seams — checkpoint boundary is the only one available in
Module 0 (one checkpoint), so seams otherwise fall at major teaching breaks,
approaching but never exceeding the 5,000-char safety margin
(`scripts/aimt-listen-tts-preflight.mjs`'s 4,500-char safe ceiling):

| Piece | Chunks | Approx. chars |
|---|---|---:|
| A1 | M0-01 → 0.1 → 0.2 | ~3,350 |
| A2 | 0.3 → 0.4 → 0.5 (+ Cadence note) → Practice | ~3,050 |
| A3 | 0.6 → 0.7 | ~2,900 |
| A4 | 0.8 → 0.9 | ~2,300 |
| A5 | 0.10 → 0.11 → checkpoint prompt | ~2,000 |
| B1 | post-pass recap/handoff | ~650 |

Total narration: ~14,250 characters across 6 batches (down from v1's
~17,000+ across 6 pieces, entirely from dropping the ~1,200-character
orphaned M0-01b chunk and tightening the opening paraphrase into a true
Reference Voice list of comparable length). Same voice/model as Modules
1/4/5/6/7 (Jane, `Y3ZPRGOSIxbV4Rbb3WiA`, `eleven_v3`), one continuous
performance per piece, cut into the 14 player segments above at natural
pauses after generation (silencedetect, same method as Modules 1/4/5/6/7).

**Generation status: NOT YET GENERATED.** See
`module-00-fidelity-coverage-audit.md` for the full pre-generation gate
(coverage audit / headline inventory / final-third check / checkpoint map /
TTS preflight, all PASS) and the exact credit/cost estimate. Per instruction,
this pass stops at owner-review staging — RAW/EDIT audio generation requires
a live ElevenLabs credential this session does not have access to (see that
document's "Generation gate" section for the full explanation). Old v1
audio (`AIMT-Listen-Mode-Final/00-Welcome/`) is left untouched, archived by
convention, not deleted.
