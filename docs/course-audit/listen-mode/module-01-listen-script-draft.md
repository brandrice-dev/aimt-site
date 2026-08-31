# Module 1 — Cadence Listen Mode Narration Script (Editorial Pilot Draft)

**Status:** DRAFT v5 — PASS 1 OF 2, CORRECTION ROUND: checkpoint 1 physically
relocated per locked owner override (see "Checkpoint 1 — placement decision"
below) and a real Student-Preview-reload regression fixed (see the pass's
own code diff / test suite section AD). Still Pass 1 of 2 — owner review
required before Pass 2 (regeneration). Governed by
[`00-listen-mode-editorial-standard.md`](00-listen-mode-editorial-standard.md).
The overall Listen Mode architecture (written briefing + spoken briefing +
conversational lesson adaptation + practice interaction + checkpoints +
closing recap) remains **approved and unchanged**. Module 4's draft
(`module-04-listen-script-draft.md`) is unchanged by this task.
**Pilot module:** Module 1 — Role of the Head Spa Technician.
**Date drafted:** 2026-08-30 (v1). **Date compressed:** 2026-08-30 (v2).
**Date micro-edited:** 2026-08-30 (v3 — four targeted line edits, no
compression). **Date revised:** 2026-08-31 (v4 — editorial/sync
coordination pass; v5, same day — checkpoint 1 relocation + regression fix,
this version).
**Branch:** `course-audit-build`. **This is a documentation-only task for
the script itself.** No audio was generated, no TTS/ElevenLabs API was
called this pass, no checkpoint prompt/rubric, or Cadence chat/grading
*behavior* was touched (the checkpoint's HTML *position* changed — see
below — but not its question, rubric, competency requirement, or grading
call site). (Separately, this same pass implemented non-audio player/UI/
sync code changes — labels, sync targets, layout coordination, a proven
Continue-Listening invariant, a visible recap card, the checkpoint DOM
move, and a Student Preview reload-survival fix — see the pass's own code
diff and test suite; none of that touches audio or checkpoint authority.)

**Curriculum authority for this draft:**
- Production implementation: [`headspa-mastery.html`](../../../headspa-mastery.html) lines 4925–5211 (`module1Wrap`), read directly from the live course file — confirmed to match the approved specification below word-for-word, including every card list, script, and the completion copy.
- Approved specification: [`docs/course-audit/modules/module-01.md`](../modules/module-01.md), used to confirm intent, the approved outcomes, and the Listen Mode notes already on file for this module (Section "Listen Mode notes" — narration suitability, the three suggested visual-review cues, and the completion-rule constraints).
- Governing voice standard: [`docs/course-audit/00-cadence-character-instruction-constitution.md`](../00-cadence-character-instruction-constitution.md).
- Checkpoint questions were cross-checked against the evaluator strings in `headspa-mastery.html` (`M1.questions.m1cp1` / `m1cp2`, lines 8421–8422) and are byte-identical to the on-screen `.cp-q` text (lines 5166, 5184).

---

## Revision history

**v5 (this pass, 2026-08-31):** Two corrections to v4, both owner-directed:

1. **Checkpoint 1 physically relocated.** The owner overrode v4's "flag,
   don't move" recommendation and locked the decision: `#m1cp1`'s actual
   HTML block now sits after the practice interaction and before Section
   1.5 in `headspa-mastery.html` — not just in the audio manifest, which
   already had it there. See "Checkpoint 1 — placement decision" below.
   Question, rubric, competency requirement, and grading behavior are
   unchanged — position only.
2. **A real Listen Mode regression fixed.** `enterPurchasedCourseHome()`
   unconditionally stripped the entire URL query string on its way into
   the course shell — a pre-existing cleanup for one-time entry params
   that, once Student Preview started reaching that same function (the
   prior "local purchased-student preview" round), also stripped
   `?studentpreview=1`. Since `StudentPreview.isActive()` is a flag
   re-derived from the URL only at load time, never persisted, the very
   next reload after first entering the course shell silently deactivated
   Student Preview — dropping back to requiring real entitlement, and
   with it, GENERATED-audio Listen Mode access. Root-caused live (two
   network requests for the same page, the second missing the query
   string) before any fix was written. Fixed by preserving
   `?studentpreview=1` specifically across that same `replaceState` call.
   See the pass's code diff and test suite section AD.

**v4 (2026-08-31):** Coordinated editorial/synchronization
revision, driven by the owner's real listen-through of the v3 audio.
Applies the new course-wide standard (`00-listen-mode-editorial-standard.md`)
to Module 1. Six changes:

1. **Section announcements added** to every numbered section (M1-02 through
   M1-12) — `"Section N.N — [real title]."` — plus plain-language framing
   for the non-numbered moments (opening, practice, checkpoints, recap).
   None existed in v1–v3; their absence is the single biggest contributor to
   the owner's "felt like sections were skipped" finding (see item 3 below).
2. **M1-04 (1.3) rewritten** to walk all four "keeps you in scope" card
   examples — buildup, flaking, irritation, shedding/thinning — in that
   exact visible order, in Reference Voice. v3 only spoke flaking and
   shedding/thinning (as "representative examples"), which the owner
   correctly caught as audio starting on the wrong card (flaking, not
   buildup, which is first on screen) and silently skipping irritation.
3. **M1-05 (1.4) rewritten** to teach the "May fall within scope" card
   explicitly, in Reference Voice, before moving to "Never authorized" — v3
   only narrated the five governing factors and jumped straight to the
   never-authorized side, never actually teaching the permitted card's
   content aloud at all.
4. **Checkpoint 1 placement audited, not moved.** Competency dependency
   check (governing spec `module-01.md`'s own "Required elements for a
   pass" for `m1cp1`) confirms it does not depend on Sections 1.5–1.8. The
   *audio* chunk order already reflects this — m1-07 (checkpoint 1) has sat
   between m1-06 (practice) and m1-09 (1.5) since v1, i.e. already "after
   1.4, before 1.5." No manifest/chunk reorder was needed or made. What the
   audit *did* surface: `m1cp1`'s **visible DOM position** is different —
   it sits after Section 1.8 in `headspa-mastery.html`'s actual markup, so
   the Listen Mode player's scroll-to-checkpoint (`visualTarget: 'm1cp1'`)
   jumps the screen past 1.5–1.8's unheard visible content, then jumps back
   up when 1.5's narration resumes. This is flagged, not fixed — see
   "Checkpoint 1 — placement decision" below; it's a bigger change than an
   editorial/sync fix and needs its own sign-off.
5. **Sections 1.5–1.8 audited for coverage** (see "Sections 1.5–1.8 coverage
   audit" below) — confirmed each already teaches its core competency in
   v3; the "felt skipped" experience traces to (1) and the checkpoint-1
   scroll jump in (4), not to missing content. Each section chunk gained an
   announcement, an explicit Teaching/Reference Voice tag, and (1.6/1.7/1.8
   specifically) a real synchronization target — none existed before this
   pass (see the pass's code diff: `m1VisualLicensing` /
   `m1VisualPractitionerInsight` / `m1VisualMistakes`).
6. **Section breathing room** — a short pause annotation (production note,
   never spoken) added at each major section transition, per the new
   standard's Rule B.

No chunk was removed, no checkpoint gained or lost, no chunk boundary moved
except where explicitly noted above, and no curriculum concept was added or
cut — every wording change traces to the same approved on-screen source as
v1–v3.

**v3 (2026-08-30):** Four targeted editorial micro-edits, applied
exactly as specified by the owner-approved production-pilot task — no
compression, no restructuring, no other wording changes:

- **M1-02** — closing reframe softened. Removed the grandiose "Anyone can
  make something feel relaxing for a moment. Very few people can deliver a
  consistent, high-quality experience..." in favor of "Making something feel
  relaxing is one part of the job. The real skill is delivering that
  experience consistently, while keeping the service controlled and
  intentional from beginning to end."
- **M1-11 opening** — softened from "most of your clients don't actually
  know what a head spa is" to "a lot of clients won't really know what a
  head spa is yet. They may have seen one online, had someone recommend it,
  or simply be curious about their scalp."
- **M1-12** — two edits. The over-broad "most people speaking outside their
  scope in a video aren't thinking about consequences" became "what looks
  confident online isn't automatically safe, compliant, or appropriate for
  your license." The judgmental "The practitioners who avoid it are usually
  the ones who end up in situations they could have prevented" became
  "Avoiding referral can create problems that a timely handoff would have
  prevented."
- **M1-13** — closing line de-conflicted. "Think of an actual moment, if you
  can — a real service, even a hypothetical one, not just a definition"
  (internally contradictory — "actual" vs. "hypothetical" in the same
  breath) became "Think in terms of a concrete service moment — one you've
  experienced, or a realistic hypothetical — not just a definition."

Net word-count effect is negligible (measured at −2 words under this
document's own counting method — see the recalculated total below); this
was a substitution pass, not a compression pass. No chunk boundaries,
checkpoint questions, checkpoint gate behavior, or any other wording changed.

**v1 (2026-08-30):** Initial draft, ~2,880 spoken words / ~19–21 minutes.
Achieved curriculum coverage largely by narrating nearly every safe-language
script, scope-list item, and limitation-list item aloud, on top of full
briefing/checkpoint/practice-interaction/recap content. Direction approved;
length and read-the-list approach flagged for compression.

**v2 (this pass, 2026-08-30):** Editorial compression pass. Same
architecture, same curriculum, same checkpoints, same chunk sequence except
one merge — no redesign. Changes:

- **Written Module Briefing** tightened to a scannable 5-bullet + 1-line format.
- **M1-01** shortened by roughly 30%. Removed "if you only really listen to one module in this whole course, I'd rather it be this one" (implied other modules matter less) and "mixing them up is the single most common way new practitioners get themselves into trouble" (too absolute/punitive) and the word "clinical" (risked muddying the medical/cosmetic distinction the module is about to draw). Fewer stacked landing lines.
- **M1-04** (Observation vs. diagnosis) and **M1-05** (Scope of practice) — the largest source of length reduction — rewritten from full-card enumeration to governing-principle-plus-representative-examples. The complete lists remain the on-screen written reference; this is documented as an approved coverage form, not a gap (see the updated coverage-map standard below).
- **M1-09** (Limitations) compressed and refocused specifically on what the *service* can honestly support/promise, cutting the parts that re-taught the observation/diagnosis and scope boundaries already covered in M1-04/M1-05.
- **M1-10** (Licensing) lightly trimmed to drop a third repetition of "certification doesn't expand legal scope" (already stated in M1-03 and M1-05).
- **M1-02** restructured from six sequential mini-descriptions of each service element into one flowing sentence, preserving all six.
- **M1-03, M1-06, M1-11, M1-13** preserved close to intact, per explicit instruction — these were identified as the draft's strongest existing voice/structure. Only performance-cue removal and trivial trims applied.
- **M1-14 + M1-15 merged** into one closing chunk (post-pass continuation + completion + three carry-forward ideas + Module 2 handoff) — the v1 draft effectively ended the module twice.
- **Performance cues cut from 79 stylistic tags to 8**, relying on prose and paragraph rhythm instead, per the target ElevenLabs voice needing less directive scaffolding. Structural markers (checkpoint stops, pass-gates, visual cues) are a separate category, unchanged in kind, and not counted against that figure.
- **Coverage-map vocabulary updated** to distinguish "core teaching narrated, full list remains the on-screen reference" (approved parity) from an actual coverage gap — v1 collapsed both into "covered directly (verbatim)."

No production curriculum, checkpoint question, rubric, or Cadence config was
touched — this is a script-editorial change only.

---

## New module-opening architecture (unchanged, approved in the prior pass)

Default b-roll opening videos are no longer the standard plan for any AIMT
module. Every module opens with two layers:

1. **An on-screen written Module Briefing** — visible to every student,
   whether or not they use Listen Mode.
2. **A spoken Cadence Module Briefing** — Listen Mode's opening chunk, which
   naturally expands the written briefing rather than reading it aloud.

Real video is reserved for content that genuinely needs to be *seen in
motion*. Module 1 has none of that, so no video is proposed here — written
briefing plus spoken briefing is the complete opening.

---

## MODULE 1 WRITTEN BRIEFING (v2 — tightened)

*(Proposed on-screen text — not yet implemented; documentation only. Sits at
the top of the module, before 1.1.)*

**In this module, you'll learn to:**

- Define the head spa technician's role — and its limits.
- Separate professional observation from medical diagnosis.
- Understand what depends on your license and local scope.
- Set honest expectations for what a head spa can support.
- Recognize when referral is the right professional decision.

**Pay attention to:** the language you use when describing what you see.
That distinction follows you through the rest of the course.

*(v1 comparison: the previous version carried the same five ideas across
longer, fuller sentences plus a two-sentence "pay attention" line — accurate,
but too dense for at-a-glance orientation. This version keeps the same five
ideas, cut to one line each.)*

---

## OWNER EDITORIAL REVIEW — please assess

1. Does this sound like Cadence?
2. Would I want to keep listening to her?
3. Does she sound like a teacher rather than a narrator?
4. Is she warm enough without overdoing it?
5. Is anything too textbook-like?
6. Does she add useful explanation beyond the written page?
7. Are the visual references useful — and are the *representative examples* kept in M1-04/M1-05/M1-09 the right ones to keep?
8. Do checkpoint transitions feel natural?
9. Does the closing recap feel valuable rather than repetitive?
10. Does this version still feel complete, or does the compression cut anything you actually wanted spoken aloud?

---

## How to read this document

Each numbered chunk is a standalone, independently regenerable audio unit:
**CHUNK ID**, **SOURCE SECTION**, **PURPOSE**, **VISUAL ON SCREEN** (if
relevant), **PERFORMANCE NOTES**, **SPOKEN SCRIPT**, **CHECKPOINT/GATE
BEHAVIOR** (only where relevant), **SOURCE TRACEABILITY**, and
**OWNER-REVIEW FLAGS** (only where something needs your eyes specifically).

Performance tags are now deliberately rare — see "Performance cues" in the
final estimates section for the full accounting.

---

## Chunk map (v2 — 14 chunks, was 15)

| ID | Covers | Checkpoint? |
|---|---|---|
| M1-01 | Module Briefing (spoken) | — |
| M1-02 | 1.1 What is a head spa? | — |
| M1-03 | 1.2 What is a head spa technician? | — |
| M1-04 | 1.3 Observation vs. diagnosis | — |
| M1-05 | 1.4 Scope of practice | — |
| M1-06 | Practice interaction — "Where is the line?" | — |
| M1-07 | Checkpoint 1 — `m1cp1` | **STOP** |
| M1-08 | Post-pass continuation (`m1cp1`) | resume only |
| M1-09 | 1.5 Limitations of a head spa service | — |
| M1-10 | 1.6 Licensing | — |
| M1-11 | 1.7 Practitioner insight | — |
| M1-12 | 1.8 Mistakes new practitioners make | — |
| M1-13 | Checkpoint 2 — `m1cp2` | **STOP** |
| M1-14 | Post-pass continuation (`m1cp2`) + completion + closing recap + Module 2 handoff | resume only |

---

## Checkpoint 1 — placement decision (v5 — MOVED, per locked owner override)

**Status: implemented.** The prior pass (v4) recommended this move but
left it unimplemented, flagging it as a bigger change than a typical
editorial/sync fix. The owner has since explicitly locked the decision and
requested the physical move — this version implements it.

**Dependency evidence (unchanged from v4, preserved per the owner's
instruction not to reopen it absent a technical failure):**
`docs/course-audit/modules/module-01.md`'s own "Checkpoint 1 — `m1cp1`"
section states the **competency evaluated** as *"The student can respond to
a hair-loss concern without diagnosing and can direct the client toward an
appropriate professional next step,"* with five **required elements for a
pass** — none diagnosing alopecia, observation-based language, not claiming
the service can diagnose/treat/reverse/regrow hair, recommending
dermatologist/qualified-professional evaluation, and a client-communicable
response. Every element traces to Section 1.3 (observation vs. diagnosis)
and 1.3's own referral guidance, reinforced by 1.4's scope framing and the
M1-06 practice round. None reference Sections 1.5–1.8. **No technical
dependency failure surfaced from making the move** (verified live — see
below), so this evidence stands unchanged and the decision was not reopened.

**What moved:** `#m1cp1`'s entire HTML block (question, label, textarea,
submit button, result container — content, ids, and `onclick`/`onkeydown`
handlers all byte-identical) now sits in `headspa-mastery.html` directly
after the practice interaction (`#m1LineInteraction`) and before Section
1.5's markup. Checkpoint 2 (`#m1cp2`) is untouched, still after Section 1.8.
Real written-course order is now: 1.1 → 1.2 → 1.3 → 1.4 → practice →
**checkpoint 1** → 1.5 → 1.6 → 1.7 → 1.8 → checkpoint 2 → completion.

**What did not change:** checkpoint prompt, rubric, competency requirement,
grading behavior, the `M1.questions.m1cp1` evaluator string, or the
Listen Mode manifest (`m1-07`'s `visualTarget` was always the bare id
`'m1cp1'`, which the scoped live-lookup resolves correctly regardless of
where that id currently sits in the DOM — no manifest edit was needed for
the move to take effect).

**Consequence — the prior pass's flagged scroll-jump problem is now fully
eliminated, not just mitigated.** Checkpoint 1 sits immediately adjacent to
Section 1.5 in the real DOM, so Listen Mode's scroll-to-checkpoint no
longer jumps the screen past 1.5–1.8's unheard content at all. Verified
live: mount → jump to `m1-07` → checkpoint card scrolls into view at its
new position → simulate an authoritative pass via the real
`setCheckpointResult` path → Continue Listening appears only then → click
→ resumes into `m1-08` → auto-advances into `m1-09` (Section 1.5),
immediately, with zero intervening jump.

---

## Sections 1.5–1.8 coverage audit (v4)

Owner finding: these sections were experienced as skipped or out of
sequence. Audited against the live `headspa-mastery.html` source and the
v3 script; conclusion: **the core competency of every section was already
being taught aloud in v3** — nothing was silently dropped. What was
genuinely missing, and is fixed this pass, is orientation: no section
announcement and (1.6/1.7/1.8) no synchronization target at all, so an
audio-first listener had no way to tell which section they were in, or the
screen to confirm it. Per section:

| Section | Chunk | Core purpose (already covered in v3) | Reference Voice landmark | Teaching Voice passages | Sync target (v4) |
|---|---|---|---|---|---|
| 1.5 — Limitations | M1-09 | What the service can honestly support vs. promise | The "can support" / "cannot do" card summaries | Framing + closing positioning statement | `m1VisualLimitations` (already existed) |
| 1.6 — Licensing | M1-10 | Verify-your-own-license-first guidance | None (this section is pure guidance, no card) | Entire chunk | `m1VisualLicensing` (**new this pass**) |
| 1.7 — Practitioner insight | M1-11 | Client-expectations framing; the Cadence note | The Cadence note (near-verbatim) | Everything else | `m1VisualPractitionerInsight` (**new this pass**) |
| 1.8 — Mistakes | M1-12 | Five recognizable failure patterns | The five mistake headlines, in visible card order | The "why it matters" explanation after each | `m1VisualMistakes` (**new this pass**) |

No section was re-written for content this pass (unlike 1.3/1.4) — each
gained a section announcement, an explicit voice-mode tag, and (where
missing) a sync target. See each chunk's own entry below for the exact
script change.

---

## The script

### M1-01 — Module Briefing (spoken)

**SOURCE SECTION:** Hero block (`headspa-mastery.html` lines 4928–4932) + the overall approved outcomes for Module 1 (`module-01.md`, "Approved outcomes").
**PURPOSE:** Orient the student, explain why this module comes first, name the distinction worth listening for, bridge into 1.1.
**VISUAL ON SCREEN:** The written Module Briefing above, plus the hero (eyebrow, title, description).
**VOICE MAP (v4):** Teaching throughout — this is the module's own framing, not reference material; no numbered-section announcement applies (it IS the opening).
**PERFORMANCE NOTES:** `[WARM]` open only. (v2: removed `[EMPHASIZE]`, `[CURIOUS]`, `[LET THIS LAND]` — the shorter version doesn't need them.)

**SPOKEN SCRIPT:**

> [WARM] Welcome to Module One. Before we start, here's the reason this one comes first.
>
> A lot of what you'll learn later — scalp biology, microscopy, service decisions, even the way you talk to clients — depends on knowing where your role begins and where it stops.
>
> We'll start with what a head spa actually is and what the technician's role really involves. Then we'll spend time on a distinction I want you comfortable with early: observing what you see is not the same as diagnosing what caused it. Mixing the two up is one of the easiest ways to step outside your role without realizing it.
>
> From there, we'll look at scope, the honest limits of the service, and the moments when referral is the most professional next step you can take.
>
> None of this is about making you hesitant. It's the opposite — the clearer you are about what belongs to you, the more confidently you can handle what does.
>
> Know what you are. Know what you are not. Let's start there.

**SOURCE TRACEABILITY:** Hero eyebrow/title/description (4928–4932); framing drawn from the approved outcomes list in `module-01.md`.
**OWNER-REVIEW FLAGS:** Original narration-UX writing (no single production block to adapt from), unchanged in kind from v1 — only shortened and de-absolutized. See Revision history for the specific lines removed and why.

---

### M1-02 — 1.1 What is a head spa?

**SOURCE SECTION:** Section 1.1 (lines 4934–4950)
**PURPOSE:** Establish the definition and the six structural elements as one coherent whole, then land the Cadence note's reframe.
**VISUAL ON SCREEN:** Six service-element cards (Cleansing, Exfoliation, Massage & relaxation, Water therapy, Conditioning & treatment, Sensory elements).
**VOICE MAP (v4):** Teaching throughout — no card/list reference material in this section.
**PERFORMANCE NOTES:** `[SECTION PAUSE]` before the announcement (v4, new). (v2: prose carries this chunk; no other tags needed.)

**SPOKEN SCRIPT:**

> [SECTION PAUSE]
>
> Section 1.1 — What is a head spa? A head spa is a structured, scalp-focused service — built around hygiene, comfort, and the overall scalp environment. It's also a genuinely relaxing, sensory experience, and those two things aren't in tension. The relaxation is real. So is the structure holding it up.
>
> That structure comes from six elements working together: cleansing as the foundation, exfoliation only when it's actually appropriate, massage and relaxation as the sensory core, water therapy, conditioning and treatment driven by what you observe, and the sensory layer wrapped around all of it — temperature, touch, sound, aromatherapy. The exact mix changes with the client. The structure underneath doesn't.
>
> Here's the reframe worth keeping: from the client's perspective, this feels like relaxation. From yours, it should feel controlled and intentional. Making something feel relaxing is one part of the job. The real skill is delivering that experience consistently, while keeping the service controlled and intentional from beginning to end.

**SOURCE TRACEABILITY:** 1.1 title + body-text (4934–4936), six `scalp-card` elements (4939–4944, all six named), Cadence note (4947–4950, quoted near-verbatim).
**OWNER-REVIEW FLAGS:** None. All six elements are still individually named — only the delivery changed, from six discrete mini-descriptions to one connected sentence.

---

### M1-03 — 1.2 What is a head spa technician?

**SOURCE SECTION:** Section 1.2 (lines 4954–4963)
**PURPOSE:** Teach the role-not-license distinction plainly, then land the "work behind the calm" reframe.
**VISUAL ON SCREEN:** Section title, two body paragraphs, "The work behind the calm" clinical note.
**VOICE MAP (v4):** Teaching throughout.
**PERFORMANCE NOTES:** `[SECTION PAUSE]` before the announcement (v4, new). (v2: this chunk was already identified as one of the draft's strongest voice examples — preserved near-intact otherwise.)

**SPOKEN SCRIPT:**

> [SECTION PAUSE]
>
> Section 1.2 — What is a head spa technician? Now — what does that actually mean? There's a version of this job where you think: I just need to learn the steps. That works right up until something doesn't look the way you expected. Then you need to be more than someone who memorized a sequence.
>
> Here's something I want stated plainly, because it matters legally, not just philosophically: in this course, "head spa technician" describes the role you perform during a service. It is not a separate state license. Your legal ability to actually do any of this comes from the license or authorization you already hold, the laws where you practice, and the specific services you're performing. AIMT certification documents that you completed this course. It does not expand what you're legally allowed to do.
>
> So what is the role, if it's not a license? The service should feel effortless to the client — that's the point, they should barely notice the work. But behind that calm, you're observing constantly, communicating, adjusting pressure and pacing in real time, protecting your own scope, recognizing the moment to simplify or stop, and holding control of the room from the first minute to the last. That's the actual job. The physical steps are just the visible part of it.

**SOURCE TRACEABILITY:** 1.2 title + both body paragraphs (4954–4958, full text preserved), clinical note "The work behind the calm" (4960–4963, full text preserved).
**OWNER-REVIEW FLAGS:** None.

---

### M1-04 — 1.3 Observation vs. diagnosis (v4 — full ordered card walkthrough)

**SOURCE SECTION:** Section 1.3 (`headspa-mastery.html`, `id="m1VisualScopeLanguage"` protocol card).
**PURPOSE:** Announce the section, teach the module's central distinction, then walk both protocol cards in their real visible order — all four "keeps you in scope" examples (not two), then all four "takes you out of scope" examples — and land referral guidance in full.
**VISUAL ON SCREEN:** Two quoted-script protocol cards ("Say this" / "Never say"), a closing paragraph, and "When to refer out."
**VOICE MAP:** Teaching (announcement, opening framing, bridges between cards, closing referral guidance) / **Reference** (both full card walkthroughs — near-verbatim, real visible order).
**PERFORMANCE NOTES:** `[EMPHASIZE]` once, on the module's single most safety-critical sentence. `[SLOW SLIGHTLY]` spanning each card walkthrough. `[SECTION PAUSE]` before the announcement (a few seconds of breathing room after 1.2 — not spoken).

**SPOKEN SCRIPT:**

> [SECTION PAUSE]
>
> Section 1.3 — Observation vs. diagnosis. This next part is the center of the whole module, so let's slow down here.
>
> You'll notice things — oil imbalance, dryness, buildup, flaking, irritation, early thinning. Recognizing those patterns is genuinely part of your job. [EMPHASIZE] Diagnosing what caused them is not. That's the line, and almost everything else in this course sits on top of it.
>
> [VISUAL CUE] Here's exactly what that sounds like in practice — the screen has the full reference, worth coming back to. [SLOW SLIGHTLY] For buildup: "I'm seeing visible buildup around parts of the scalp. Today I would focus on gentle, thorough cleansing and adjust the service based on how the scalp responds." For flaking: "I'm seeing flaking and oil around the root area. I can describe what is visible and adjust today's cosmetic service, but I can't determine the cause from appearance alone." For irritation: "I'm seeing redness and irritation in this area. I would avoid aggressive exfoliation or stimulation here and explain when medical evaluation would be appropriate." And for shedding or thinning — this comes up often — it sounds like: "I can document the shedding or thinning pattern I can see, but I can't determine the cause or diagnose hair loss. Because this is new or concerning to you, a dermatologist or other qualified medical professional is the appropriate next step."
>
> Notice the pattern in all four: describe what's visible, adjust what you can, and stop before naming a cause.
>
> Language that crosses the line does the opposite — naming a diagnosis, a cause, or a treatment you're not qualified to give. "This is seborrheic dermatitis." "This is fungal." "This is alopecia." "You should use this medicated or prescription product." Different words, same mistake — appearance alone can't establish any of that.
>
> Your language should get more precise as you gain experience, never more certain than the evidence allows. And that's exactly when referral matters: something new, unexplained, severe, persistent, spreading, painful, bleeding, or rapidly changing calls for a real medical evaluation, even if it's simply outside cosmetic scope. You're not being asked to diagnose anything — just to recognize the moment a cosmetic service isn't the answer, and handle it like a professional.

**SOURCE TRACEABILITY:** 1.3 title + intro, "Language that keeps you in scope" card — **all 4 items now narrated in exact visible order** (buildup, flaking, irritation, shedding/thinning — confirmed live from `headspa-mastery.html`, not assumed), "Language that takes you out of scope" card — all 4 items named in visible order (diagnosis, cause, hair loss, prescription), "When to refer out" — full referral-trigger list retained.
**OWNER-REVIEW FLAGS:** v3 narrated only 2 of the 4 "keeps you in scope" examples (flaking, shedding/thinning) and started with flaking, not buildup — the exact mismatch the owner's real listen-through caught. v4 fixes this by narrating all four in the real screen order, per the new course-wide standard's Reference Voice rule (Rule C/D) — this is a genuine word-count increase over v3 (+2 full scripts), not a further compression.

---

### M1-05 — 1.4 Scope of practice (v4 — teaches the permitted card, not just the asymmetry)

**SOURCE SECTION:** Section 1.4 (`headspa-mastery.html`, `id="m1VisualScopeCards"` protocol card).
**PURPOSE:** Announce the section, then teach BOTH cards explicitly in Reference Voice, in their real visible order — "May fall within scope" first, then "Never authorized" — with Teaching Voice explanation after each.
**VISUAL ON SCREEN:** Two protocol cards ("May fall within scope — verify first" / "Never authorized by this course").
**VOICE MAP:** Teaching (announcement, both explanatory bridges, closing principle) / **Reference** (both full card walkthroughs, in order).
**PERFORMANCE NOTES:** `[SECTION PAUSE]` before the announcement.

**SPOKEN SCRIPT:**

> [SECTION PAUSE]
>
> Section 1.4 — Scope of practice. Now let's talk about scope — what you may actually be permitted to do, and what you never are, no matter how advanced you get.
>
> [VISUAL CUE] Here's the complete list of what may fall within scope — every item on it still depends on your license, so treat this as "verify first," not "automatically yes." Cleansing the scalp and hair. Cosmetic product application. Massage and manual techniques. Cosmetic exfoliation. Use of devices or equipment. Observation and description of visible findings. And non-prescription cosmetic product guidance.
>
> Every single one of those is permitted only when your license, your state and local rules, your establishment, and the manufacturer's directions all say yes. That's genuinely variable — it's on you to verify it every time, for every service.
>
> Now here's the side that doesn't move, no matter what license you hold. Diagnosing a medical condition. Prescribing or directing prescription treatment. Claiming to cure, reverse, or treat disease. Performing a medical procedure. Presenting scanner, microscopy, or AI output as a medical diagnosis. And practicing beyond the license or authorization you actually hold.
>
> That's the whole principle. One side is conditional, and needs checking every time. The other side just isn't — not now, not later, no matter how experienced you get.

**SOURCE TRACEABILITY:** 1.4 title + intro (asymmetry framing preserved). "May fall within scope" card — **all 7 items now narrated in exact visible order** (previously zero were individually narrated — only the 5 governing factors were spoken). "Never authorized" card — all 6 items narrated individually and in order (previously 5 combined phrases).
**OWNER-REVIEW FLAGS:** v3's deepest cut — the entire "may fall within scope" activity list — is restored in full this pass, per the owner's explicit finding that skipping straight to "not permitted" is too loose for an audio-first student. This is the largest single word-count increase in the v4 pass.

---

### M1-06 — Practice interaction: "Where is the line?"

**SOURCE SECTION:** Practice interaction (lines 5047–5089); answers/feedback from `M1_LINE_ANSWERS` (`headspa-mastery.html` lines 9796–9799); completion message (line 9825).
**PURPOSE:** Preserve the ungraded discipline exercise as a spoken worked-example walkthrough — identified as one of the best uses of audio in the module, so preserved almost intact.
**VISUAL ON SCREEN:** Four statements, each with two classification buttons and immediate feedback.
**VOICE MAP (v4):** Teaching (framing, closing line) / **Reference** (all four quoted statements and their feedback — already verbatim, now explicitly tagged).
**PERFORMANCE NOTES:** Four `[SHORT PAUSE]` markers, one after each statement. These are functional to the exercise (a real pause for the listener to guess before the reveal), not decorative — see the performance-cue accounting in the final estimates section for why these are counted separately from the module's 8 stylistic cues.

**SPOKEN SCRIPT:**

> Before your first checkpoint, a quick practice round — no grade, no pressure, just a chance to test your ear for this before it counts.
>
> Four realistic statements. For each one, decide for yourself: is this professional observation, or is it outside scope? If you've got the screen in front of you, this is a good moment to click through it yourself before I give you the answer.
>
> Statement one: "I'm seeing redness in this area. I would avoid aggressive exfoliation here and explain when medical evaluation would be appropriate." [SHORT PAUSE] Professional observation. It describes what's visible, adjusts the service, and recognizes when referral might matter — without ever naming a condition.
>
> Statement two: "This is seborrheic dermatitis. You should use a medicated shampoo twice a week." [SHORT PAUSE] Outside scope. That names a diagnosis and directs treatment in the same breath. You can describe findings and recommend medical evaluation. You don't get to diagnose or prescribe.
>
> Statement three: "I can document the flaking I see, adjust today's service, and explain that appearance alone cannot determine the cause." [SHORT PAUSE] Professional observation — it stays grounded in what's visible and what the service can adjust, without reaching for a medical conclusion.
>
> And statement four: "Your follicles are clogged, and that is why your hair is thinning." [SHORT PAUSE] Outside scope. That states an unverified cause as fact. You can document visible buildup or thinning. You cannot tell someone why it's happening from appearance alone.
>
> Good professional language is specific about what's visible, and restrained about what it can't establish. Keep that instinct sharp — you're about to use it for real.

**CHECKPOINT/GATE BEHAVIOR:** None — ungraded, non-persistent.
**SOURCE TRACEABILITY:** Interaction heading + instruction (5047–5050), four `practice-scenario` statements and choice buttons (5051–5089), `M1_LINE_ANSWERS` feedback text (lines 9796–9799), completion message (line 9825). Unchanged from v1 in substance.
**OWNER-REVIEW FLAGS:** None new. (v1's note about reusing Module 4's click-to-reveal adaptation pattern still stands — unchanged in this pass.)

---

### M1-07 — Checkpoint 1 (`m1cp1`)

**SOURCE SECTION:** `#m1cp1` (lines 5161–5177); evaluator string `M1.questions.m1cp1` (line 8421).
**PURPOSE:** Transition into the required checkpoint and deliver the exact question. Preserved per explicit instruction.
**VISUAL ON SCREEN:** The `m1cp1` checkpoint card — label "Apply the boundary."
**VOICE MAP (v4):** Teaching (framing) / **Reference** (the exact checkpoint question — unparaphrased, as required).
**PERFORMANCE NOTES:** `[SHORT PAUSE]` before the reveal, `[SLOW SLIGHTLY]` through the exact question.

**SPOKEN SCRIPT:**

> Okay — this is the first place I actually want you to stop and use what we just built, not just recognize it.
>
> [SHORT PAUSE] Here's your checkpoint, exactly as written:
>
> [SLOW SLIGHTLY] "A client says her hair has been shedding heavily for two months and asks whether she has alopecia. Explain exactly how you would respond. Include what you can safely say, what you must avoid saying, and the professional next step you would recommend."
>
> [CHECKPOINT STOP — PLAYBACK PAUSES]
>
> Take whatever time you actually need. I'm not timing you.

**CHECKPOINT/GATE BEHAVIOR:** `[CHECKPOINT STOP — PLAYBACK PAUSES]`. Playback halts here. No qualifying answer scripted. Resume only via M1-08, only after an authoritative pass.
**SOURCE TRACEABILITY:** `cp-q` (line 5166), verified byte-identical to `M1.questions.m1cp1` (line 8421).
**OWNER-REVIEW FLAGS:** None — question text exact, unparaphrased. "Take whatever time you actually need. I'm not timing you." preserved verbatim per explicit instruction.

---

### M1-08 — Post-pass continuation (`m1cp1`)

**SOURCE SECTION:** N/A (narration-UX transition line).
**PURPOSE:** A short, warm resume line — continuity, not new teaching. No grading criteria scripted in.
**VISUAL ON SCREEN:** Whatever follows a passed `m1cp1` — Section 1.5 begins.
**VOICE MAP (v4):** Teaching throughout.
**PERFORMANCE NOTES:** None. (v4: closing line made slightly more explicit about where we're headed next — see below. Originally written to help re-orient a listener after a scroll jump past unheard 1.5–1.8 content; v5's checkpoint relocation eliminates that jump entirely — see "Checkpoint 1 — placement decision" above — but the clearer wording is still kept as good orientation practice on its own merits.)

**SPOKEN SCRIPT:**

> [PLAY ONLY AFTER AUTHORITATIVE CHECKPOINT PASS]
>
> Good — that's exactly the shape of it. You described what's visible, left the diagnosis to someone actually qualified to give one, and gave her somewhere real to go next.
>
> Let's keep going — back into the lesson, starting with Section 1.5. There's more to this role than the boundary alone.

**CHECKPOINT/GATE BEHAVIOR:** `[PLAY ONLY AFTER AUTHORITATIVE CHECKPOINT PASS]`. Narration UX only, not grading logic.
**SOURCE TRACEABILITY:** N/A — transitional line only.
**OWNER-REVIEW FLAGS:** Original narration-UX writing, unchanged in kind from v1.

---

### M1-09 — 1.5 Limitations of a head spa service

**SOURCE SECTION:** Section 1.5 (lines 5093–5128)
**PURPOSE:** Teach what the *service itself* can honestly support versus promise — refocused away from re-teaching the observation/diagnosis and scope boundaries already covered in M1-04/M1-05.
**VISUAL ON SCREEN:** Two protocol cards ("What a head spa can support" / "What a head spa cannot do") and a key point.
**VOICE MAP (v4):** Teaching (announcement, framing, closing positioning) / **Reference** (both card summaries).
**PERFORMANCE NOTES:** `[SECTION PAUSE]` before the announcement (v4, new — this is also the point where the screen returns from the checkpoint 1 area, so the pause and clear section name both do real orientation work here, not just rhythm).

**SPOKEN SCRIPT:**

> [SECTION PAUSE]
>
> Section 1.5 — Limitations of a head spa service. [VISUAL CUE] One more side-by-side worth knowing is on screen here — what the service itself can honestly support, and what it can't promise. The takeaway matters more than the full list.
>
> A head spa can genuinely support real things: better cosmetic cleansing, hydration and conditioning, comfort and relaxation, a cleaner scalp environment, a consistent routine of professional care. What it can't do is just as real: it doesn't diagnose or treat disease, determine the cause of shedding, reverse genetic hair loss, or regrow hair.
>
> Here's the positioning that actually works: "this service can support cosmetic scalp cleansing, comfort, and conditioning" is honest, and still valuable. Promising treatment, diagnosis, or regrowth is not — and the genuine benefits here don't need to be dressed up as medicine to be worth offering.

**SOURCE TRACEABILITY:** 1.5 title (5093–5094), "can support" card (5096–5108) — all five items represented, condensed phrasing, "cannot do" card (5110–5123) — four of six items named directly (diagnose/treat disease, determine cause of shedding, reverse genetic hair loss, regrow hair; "cure dandruff/dermatitis/infection/inflammation" and "replace medical evaluation" folded into the surrounding framing rather than named separately), key point (5125–5128, near-verbatim — this is the "strongest takeaway" this chunk is built around).
**OWNER-REVIEW FLAGS:** Compressed and refocused per this task's instruction. Two "cannot do" items are no longer individually named (still true in substance, covered by the surrounding "doesn't diagnose or treat disease... reverse... regrow" framing) — please confirm that's an acceptable cut given the same competency (a head spa cannot replace medical evaluation) is already taught directly in M1-04's referral guidance.

---

### M1-10 — 1.6 Licensing

**SOURCE SECTION:** Section 1.6 (lines 5132–5135)
**PURPOSE:** Deliver the licensing-verification guidance, trimmed of a third repetition of "certification doesn't expand legal scope."
**VISUAL ON SCREEN:** Section title and two body paragraphs.
**VOICE MAP (v4):** Teaching throughout.
**PERFORMANCE NOTES:** `[SECTION PAUSE]` before the announcement (v4, new).

**SPOKEN SCRIPT:**

> [SECTION PAUSE]
>
> Section 1.6 — Licensing. A short but important one.
>
> Before you ever offer this service, know what your existing license or authorization actually permits, in the exact place you practice — the rules for cleansing and massage, exfoliation, product application, devices, water systems, sanitation, and which parts of the body you're allowed to treat.
>
> Don't assume every head spa service is covered by every beauty license. The exact combination of services is what matters, not the general category — and that verification is genuinely yours to do.

**SOURCE TRACEABILITY:** 1.6 title + both body paragraphs (5132–5135). The closing sentence ("does not override the law, create a license, or expand your legal scope") is omitted here specifically — it's already stated in M1-03 and again as the M1-05 asymmetry; this chunk keeps the licensing-specific verification list instead, which appears nowhere else.
**OWNER-REVIEW FLAGS:** None.

---

### M1-11 — 1.7 Practitioner insight

**SOURCE SECTION:** Section 1.7 (lines 5139–5146)
**PURPOSE:** Land the client-expectations framing and the Cadence note. Identified as one of the strongest Cadence passages in the draft — preserved as a style reference for the rest of the script.
**VISUAL ON SCREEN:** Section title, body paragraph, Cadence note.
**VOICE MAP (v4):** Teaching throughout.
**PERFORMANCE NOTES:** `[SECTION PAUSE]` before the announcement (v4, new). (v2: tags removed; prose unchanged otherwise.)

**SPOKEN SCRIPT:**

> [SECTION PAUSE]
>
> Section 1.7 — Practitioner insight. Here's something worth knowing early: a lot of clients won't really know what a head spa is yet. They may have seen one online, had someone recommend it, or simply be curious about their scalp. You're shaping what they expect, in real time, whether you mean to or not.
>
> If you position yourself as someone who diagnoses or fixes medical conditions, clients will expect results you can't responsibly deliver. If you position yourself as someone who observes carefully, stays in scope, customizes the service to them, and refers out when it's appropriate — you build real trust, without ever overclaiming.
>
> Your language teaches the client what this service actually is. They don't need certainty you can't support. They need clear observation, honest expectations, and confidence that you'll know when to proceed, when to adjust, and when to refer.

**SOURCE TRACEABILITY:** 1.7 title + body (5139–5141, full text preserved), Cadence note (5143–5146, near-verbatim, full text preserved).
**OWNER-REVIEW FLAGS:** None.

---

### M1-12 — 1.8 Mistakes new practitioners make

**SOURCE SECTION:** Section 1.8 (lines 5150–5157)
**PURPOSE:** Close the instructional content with all five mistakes, each tightened to mistake → why it matters → move on, preserving the referral reframe in full.
**VISUAL ON SCREEN:** Five info cards.
**VOICE MAP (v4):** Teaching (announcement, closing bridge) / **Reference** (the five mistake headlines, in visible order — already matched the card order; now explicitly tagged).
**PERFORMANCE NOTES:** `[SECTION PAUSE]` before the announcement (v4, new).

**SPOKEN SCRIPT:**

> [SECTION PAUSE]
>
> Section 1.8 — Mistakes new practitioners make. Let's close the teaching with five patterns worth recognizing before they become habits.
>
> Blurring observation with diagnosis — turning a visible finding into a medical conclusion. Recognizing patterns can inform your service; diagnosis doesn't belong to this role.
>
> Overpromising results — making the service sound more powerful than it is might sell it once, but costs you when expectations aren't met.
>
> Treating the role as purely hands-on — miss the consultation and decision-making, and you miss what actually defines the job.
>
> Copying what you see online without thinking long-term — what looks confident online isn't automatically safe, compliant, or appropriate for your license.
>
> And avoiding referral because it feels uncomfortable. Referral is not failure — it's part of doing the job correctly. Avoiding referral can create problems that a timely handoff would have prevented.
>
> That brings us to your last checkpoint — showing the difference between knowing the steps and actually holding the role.

**SOURCE TRACEABILITY:** Five `info-card` blocks (5153–5157), all five mistakes retained, each with its core reasoning kept and its fuller elaboration trimmed.
**OWNER-REVIEW FLAGS:** None.

---

### M1-13 — Checkpoint 2 (`m1cp2`)

**SOURCE SECTION:** `#m1cp2` (lines 5179–5195); evaluator string `M1.questions.m1cp2` (line 8422).
**PURPOSE:** Deliver the final checkpoint exactly as written. Preserved per explicit instruction — no changes from v1.
**VISUAL ON SCREEN:** The `m1cp2` checkpoint card — label "Demonstrate the role."
**VOICE MAP (v4):** Teaching (framing) / **Reference** (the exact checkpoint question).
**PERFORMANCE NOTES:** `[SLOW SLIGHTLY]` through the exact question.

**SPOKEN SCRIPT:**

> [SLOW SLIGHTLY] Here's your last checkpoint, exact as written:
>
> "Explain the difference between a head spa technician and someone who only knows the service steps. Give one specific example of how that difference changes the client's experience, safety, or trust."
>
> [CHECKPOINT STOP — PLAYBACK PAUSES]
>
> Think in terms of a concrete service moment — one you've experienced, or a realistic hypothetical — not just a definition.

**CHECKPOINT/GATE BEHAVIOR:** `[CHECKPOINT STOP — PLAYBACK PAUSES]`. No qualifying answer scripted. Resume only via M1-14, only after an authoritative pass.
**SOURCE TRACEABILITY:** `cp-q` (line 5184), verified byte-identical to `M1.questions.m1cp2` (line 8422).
**OWNER-REVIEW FLAGS:** None — question text exact, unparaphrased.

---

### M1-14 — Post-pass continuation (`m1cp2`) + completion + closing recap + Module 2 handoff

**SOURCE SECTION:** N/A transition line + completion card (lines 5197–5208).
**PURPOSE:** One ending, not two. Merges what v1 split across two chunks (M1-14's pass-confirmation/completion and M1-15's separate carry-forward recap) into a single closing arc: acknowledge the pass, deliver the completion competency line, give three genuine carry-forward ideas, hand off to Module 2.
**VISUAL ON SCREEN:** The `m1Complete` lesson-complete card — now including a visible **Module Recap** block (v4, new — see the pass's code diff) listing the same three carry-forward ideas below, in the same order, so a student who reads rather than listens sees the identical takeaways.
**VOICE MAP (v4):** Teaching throughout.
**PERFORMANCE NOTES:** `[WARM]` on the pass acknowledgment. `[LET THIS LAND]` on the closing handoff — the single most "genuinely necessary" landing moment in the module, per the restraint instruction.

**SPOKEN SCRIPT:**

> [PLAY ONLY AFTER AUTHORITATIVE CHECKPOINT PASS]
>
> [WARM] Good — that's the difference. You weren't just describing the steps. You were showing the judgment behind them.
>
> That's Module One. You demonstrated observation-first language, scope and referral judgment, and an understanding of the technician's responsibility for the complete client experience.
>
> Before we move on, keep three things with you. Describe what you can actually observe, without turning it into a diagnosis. Treat scope as something you verify, not something this certification hands you. And remember that referral is part of doing the job well, not a failure to do it. You'll use all three again as the course gets more technical — the biology, the microscope, and the conditions you'll learn to recognize all sit on top of the boundary you just built.
>
> [LET THIS LAND] Next, we move into the client experience itself — the moments before the hands-on service even begins. I'll see you in Module Two.

**CHECKPOINT/GATE BEHAVIOR:** Opening line is `[PLAY ONLY AFTER AUTHORITATIVE CHECKPOINT PASS]`. Everything after plays as standard module-completion narration once `m1cp2` passes and the completion card renders. Does not gate module completion, progress, or the Module 2 unlock, which remain governed entirely by the real checkpoint-pass logic.
**SOURCE TRACEABILITY:** Completion eyebrow/title/competency line (5197–5201, competency sentence quoted verbatim). Primary/secondary buttons ("Start Module 2 →" / "Back to course") are navigation controls, intentionally not narrated. Forward references ("the biology, the microscope, and the conditions you'll learn to recognize") are grounded in confirmed later-module content (`MODULE_GUIDE_SYSTEMS[3]`, `[4]`, `[6]`, read directly from `headspa-mastery.html`), not invented.
**OWNER-REVIEW FLAGS:** Original narration-UX writing for the pass-acknowledgment, three-things framing, and handoff — same category as v1's M1-08/M1-14/M1-15. This chunk replaces v1's separate M1-14 and M1-15; confirm the merged single ending lands better than two sequential closings did.

---

## Module 1 Listen Coverage Map (v2 — updated classification standard)

**New classification added this pass:** *Core teaching narrated / full
reference remains on screen* — the governing principle and one or more
representative examples are taught aloud; the complete card or list stays
available as the detailed written reference. **This is an approved form of
curriculum parity, not a coverage gap.** It replaces cases where v1 marked
every individual list item "covered directly (verbatim)" by literally
reading the whole card.

| Element | Classification | Chunk |
|---|---|---|
| Hero eyebrow / title / description | Covered via spoken adaptation | M1-01 |
| 1.1 title + body-text | Covered via spoken adaptation | M1-02 |
| 1.1 six service-element cards | Covered via spoken adaptation — all six named | M1-02 |
| 1.1 Cadence note | Covered directly (near-verbatim) | M1-02 |
| 1.2 title + two body paragraphs | Covered directly (full text preserved) | M1-03 |
| 1.2 clinical note ("The work behind the calm") | Covered directly (full text preserved) | M1-03 |
| 1.3 title + intro | Covered via spoken adaptation | M1-04 |
| 1.3 "keeps you in scope" card — all 4 scripts (buildup, flaking, irritation, shedding/thinning) | **Covered directly (verbatim, real visible order) — v4: all 4, was 2 of 4** | M1-04 |
| 1.3 "takes you out of scope" card (4 items) | Covered directly (named, real visible order) | M1-04 |
| 1.3 closing distinction paragraph | Covered via spoken adaptation | M1-04 |
| 1.3 "When to refer out" paragraph | Covered via spoken adaptation — trigger list retained in full | M1-04 |
| 1.4 title + intro | Covered via spoken adaptation | M1-05 |
| 1.4 "May fall within scope" card — 5 determining factors | Covered directly (named) | M1-05 |
| 1.4 "May fall within scope" card — 7 specific activities | **Covered directly (named, real visible order) — v4: all 7, was 0** | M1-05 |
| 1.4 "Never authorized" card (6 items) | **Covered directly (named individually, real visible order) — v4: all 6 distinct, was 5 combined phrases** | M1-05 |
| Practice interaction heading + instruction | Covered via spoken adaptation | M1-06 |
| 4 practice statements + correct answers + feedback | Covered directly (verbatim) | M1-06 |
| Practice completion message | Covered directly (verbatim) | M1-06 |
| `m1cp1` label ("Apply the boundary") | Covered via spoken adaptation | M1-07 |
| `m1cp1` exact question | Covered directly (verbatim) | M1-07 |
| `m1cp1` input placeholder text | Intentionally not narrated (UI hint) | — |
| 1.5 title | Covered via spoken adaptation | M1-09 |
| 1.5 "can support" list (5 items) | Covered via spoken adaptation — all five represented | M1-09 |
| 1.5 "cannot do" list (6 items) | **Core teaching narrated (4 of 6 named directly) / full list remains on screen** | M1-09 |
| 1.5 key point | Covered directly (near-verbatim) | M1-09 |
| 1.6 title + two body paragraphs | Covered via spoken adaptation | M1-10 |
| 1.7 title + body | Covered directly (full text preserved) | M1-11 |
| 1.7 Cadence note | Covered directly (near-verbatim, full text preserved) | M1-11 |
| 1.8 five mistake/info cards | Covered via spoken adaptation — all five retained | M1-12 |
| `m1cp2` label ("Demonstrate the role") | Covered via spoken adaptation | M1-13 |
| `m1cp2` exact question | Covered directly (verbatim) | M1-13 |
| `m1cp2` input placeholder text | Intentionally not narrated | — |
| Completion eyebrow / title / competency line | Covered directly (competency line verbatim) | M1-14 |
| Completion next-up label / text | Covered via spoken adaptation | M1-14 |
| Completion buttons | Intentionally not narrated (navigation) | — |
| Module-open Cadence chat greeting | Intentionally not narrated — chat feature, not lesson-body content | — |
| Suggested Cadence quick prompts | Intentionally not narrated — chat feature | — |
| Decorative UI iconography | Intentionally not narrated (no teaching content) | — |

**Result:** every required competency is still taught aloud. What changed is
*how much of each card's full text* gets spoken versus left as the written
reference — three sections (M1-04, M1-05, M1-09) now teach the governing
principle plus representative examples rather than reading every list item.
No required curriculum concept was dropped; nothing here should be read as
"missing."

---

## New explanatory material proposed

**None.** Unchanged from v1 — every teaching claim in this draft traces
directly to an exact line in production. This compression pass removed
*volume*, not *substance*: no new facts, claims, or curriculum were
introduced, and no existing safety-critical teaching (the observation/
diagnosis boundary, referral triggers, the never-authorized list) was cut.

Original narration-UX writing (framing/continuity text, not curriculum) is
unchanged in kind from v1, now in four locations instead of five (M1-14 and
M1-15 merged): **M1-01** (module briefing), **M1-06** (reused pattern note,
unchanged), **M1-08** (resume line), **M1-14** (pass-acknowledgment,
carry-forward framing, and handoff).

---

## Editorial differences from existing Module 4 draft

Unchanged from v1's five points (Module Briefing chunk, dedicated closing
recap, denser personality, sparser tag use, pre-specified visual cues) — see
v1 in git history for the full list. This pass adds one more:

6. **Curriculum parity over sentence-for-sentence audio parity.** Module 4's
   draft still narrates essentially every technique card, appearance
   example, and mistake/fix pair in close to full detail (appropriate for
   that module's genuinely dense, highly visual content). Once Module 1's
   compression approach is confirmed, Module 4 should get a comparable
   pass — not necessarily as deep a cut, since more of its content is
   photographic and less redundant with itself, but the same question
   should be asked of each section: is Cadence teaching the principle, or
   just reading the card because the card has that many bullets?

No Module 4 rewrite was performed.

---

## Estimated audio experience (v4 — recalculated for this pass's additions)

- **Written Module Briefing:** unchanged from v2.
- **Total spoken word count:** **≈2,310 words** (v3's 2,088 plus this pass's additions: M1-04's two restored card examples ≈+80 words, M1-05's fully-restored permitted-card list ≈+100 words, eight new section announcements and M1-08's strengthened closing line ≈+45 words combined). This is an estimate pending a direct recount of the final text — flag any correction during review.
- **v1 → v4 net:** still a real compression overall (2,880 → 2,310, ≈−20%), even after this pass restores the two card-coverage gaps v2's deeper compression had introduced — v2/v3 over-compressed exactly the two places (1.3's four examples, 1.4's permitted card) this pass restores; the rest of v2's compression (six-sentence-to-one-paragraph rewrites, trimmed repetition) stands.
- **Estimated listening duration** at ~140–150 words/minute: **approximately 16–17 minutes** for the full module, still close to the original 14–16 minute target and well within what any single module's Listen Mode is expected to run.
- **Narration chunks:** still 14 (`M1-01` through `M1-14`) — no chunk added or removed this pass; see "New ElevenLabs continuity architecture" below for how these 14 *player* chunks now map onto far fewer *recording* sessions.
- **Performance cues (stylistic):** unchanged set from v3 (8 total), plus 8 new **`[SECTION PAUSE]`** markers (M1-02, M1-03, M1-04, M1-05, M1-09, M1-10, M1-11, M1-12) — structural (Rule B breathing room), not stylistic, so not counted against the stylistic-cue target either.
- **Visual references:** 3 `[VISUAL CUE]` insertions, unchanged from v1–v3.
- **Checkpoint stops:** 2 (`m1cp1`, `m1cp2`), unchanged — see "Checkpoint 1 — placement decision" above.
- **Synchronization targets:** now **11** chunks with a `visualTarget` (was 8) — 1.6/1.7/1.8 (`m1VisualLicensing`, `m1VisualPractitionerInsight`, `m1VisualMistakes`) gained one each this pass; see the pass's code diff.

---

## New ElevenLabs continuity architecture (Section 11)

Recording session, player chunk, and CapCut master are now three separate
concerns, per the owner's new architecture — a chunk boundary is a *player*
concept (where playback can pause/resume/seek), not a recording boundary. A
recording session can — and here, does — span multiple player chunks in one
continuous Jane performance, cut apart afterward at natural stopping points.

### Proposed Module 1 recording sessions

**Unchanged by the v5 checkpoint relocation.** The move was a DOM/HTML
position change only — checkpoint 1's *audio chunk* (`m1-07`) has sat
between the practice interaction and Section 1.5 in the manifest since v1,
which is exactly Session A's boundary below. Locking Session A at "opening
through 1.4/practice/checkpoint 1" and Session B at "1.5 through remaining
teaching/checkpoint 2/recap," per the owner's instruction, requires no
change from what v4 already proposed.

**Not the naive 3-session split** ("opening→cp1 / cp1→cp2 / recap") — the
post-final-checkpoint recap/closing is short enough (≈68–85s) that a 3rd
session isn't warranted; its content comfortably fits inside session B
without threatening any duration limit, and combining it preserves tonal
consistency across the whole post-checkpoint-1 arc — exactly the owner's
original motivation for fewer sessions in the first place.

| Session | Covers (player chunks) | Est. duration | Boundary reason |
|---|---|---|---|
| **A** | M1-01 → M1-07 (opening through the checkpoint 1 *prompt*, inclusive) | ≈11.5–12 min | Ends at checkpoint 1 — priority-1 boundary (Section 11's own ordering) |
| **B** | M1-08 → M1-14 (post-pass-1 through 1.5–1.8, checkpoint 2 prompt, post-pass-2, completion, recap, handoff) | ≈6–6.5 min | Everything after checkpoint 1 is one continuous teaching arc through to the module's natural end — no other checkpoint-or-major-teaching-break boundary strong enough to justify a second cut, and combining keeps tonal consistency across the post-checkpoint material the owner specifically flagged (M1-09 through M1-12 previously being 4 separate independent generations) |

**Down from 14 independent generations to 2 continuous performances** — the
core goal of Section 11. Both sessions land far enough under CapCut's
<15-minute Enhance Voice limit (and the ~13–14 min preferred ceiling) that
**neither needs further splitting into multiple CapCut parts** — each
session's raw recording can become its own single CapCut master directly,
simplifying Pass 2 further than the current 2-part `module-01-capcut-
production` process required.

Checkpoint 1's *prompt* (end of session A) and checkpoint 2's *prompt*
(inside session B) are recorded as part of the same continuous take as the
material before them — Jane says the question and keeps going into what
comes next in the SAME session; the PLAYER (not the recording) is what
actually pauses at those points once cut into chunks. This matches the
task's own point: recording sessions don't need to stop at every place the
*player* stops.

### Player cut map (production annotations, machine-readable intent)

Every cut below occurs at the exact chunk boundary already established in
the "Chunk map" above — no new player chunk, no removed one. Recorded here
per Section 13's request, as the explicit reasoning for why each cut is
safe.

| Cut (between) | Session | Preceding chunk ends | Following chunk begins | Cut reason | Pause type | Visual target before → after | Player label after cut |
|---|---|---|---|---|---|---|---|
| M1-01 → M1-02 | A | "...Let's start there." | "[SECTION PAUSE] Section 1.1..." | Thought-ending; new section | Section breathing room (Rule B) | `m1WrittenBriefing` → *(none)* | Module 1 · Section 1.1 |
| M1-02 → M1-03 | A | "...beginning to end." | "[SECTION PAUSE] Section 1.2..." | Thought-ending; new section | Section breathing room | *(none)* → *(none)* | Module 1 · Section 1.2 |
| M1-03 → M1-04 | A | "...just the visible part of it." | "[SECTION PAUSE] Section 1.3..." | Thought-ending; new section | Section breathing room | *(none)* → `m1VisualScopeLanguage` | Module 1 · Section 1.3 |
| M1-04 → M1-05 | A | "...handle it like a professional." | "[SECTION PAUSE] Section 1.4..." | Thought-ending; new section | Section breathing room | `m1VisualScopeLanguage` → `m1VisualScopeCards` | Module 1 · Section 1.4 |
| M1-05 → M1-06 | A | "...no matter how experienced you get." | "Before your first checkpoint..." | Thought-ending; teaching → practice transition | Section breathing room | `m1VisualScopeCards` → `m1LineInteraction` | Module 1 · Practice |
| M1-06 → M1-07 | A | "...you're about to use it for real." | "Okay — this is the first place..." | Thought-ending; major teaching break (checkpoint approaching) | Section breathing room | `m1LineInteraction` → `m1cp1` | Module 1 · Checkpoint 1 |
| M1-07 → M1-08 | A/B boundary | "...I'm not timing you." | (gated — plays only post-pass) "Good — that's exactly the shape of it." | **Checkpoint boundary — priority-1 cut, and the session A/B split point** | Player-level stop (not a recording pause — see architecture note above) | `m1cp1` → *(none)* | Module 1 · Continuing |
| M1-08 → M1-09 | B | "...starting with Section 1.5." | "[SECTION PAUSE] Section 1.5..." | Thought-ending; new section | Section breathing room | *(none)* → `m1VisualLimitations` | Module 1 · Section 1.5 |
| M1-09 → M1-10 | B | "...worth offering." | "[SECTION PAUSE] Section 1.6..." | Thought-ending; new section | Section breathing room | `m1VisualLimitations` → `m1VisualLicensing` | Module 1 · Section 1.6 |
| M1-10 → M1-11 | B | "...genuinely yours to do." | "[SECTION PAUSE] Section 1.7..." | Thought-ending; new section | Section breathing room | `m1VisualLicensing` → `m1VisualPractitionerInsight` | Module 1 · Section 1.7 |
| M1-11 → M1-12 | B | "...when to refer." | "[SECTION PAUSE] Section 1.8..." | Thought-ending; new section | Section breathing room | `m1VisualPractitionerInsight` → `m1VisualMistakes` | Module 1 · Section 1.8 |
| M1-12 → M1-13 | B | "...actually holding the role." | "Here's your last checkpoint..." | Thought-ending; major teaching break (checkpoint approaching) | Section breathing room | `m1VisualMistakes` → `m1cp2` | Module 1 · Checkpoint 2 |
| M1-13 → M1-14 | B (internal) | "...not just a definition." | (gated) "Good — that's the difference." | **Checkpoint boundary** | Player-level stop | `m1cp2` → `m1Complete` | Module 1 · Recap |

No cut falls mid-sentence, between tightly connected thoughts, or at an
arbitrary duration — every boundary above is either a checkpoint, a
section's natural start/end, or (M1-05→M1-06) a teaching-to-practice
register shift. Duration was never the deciding factor for any of them.

---

**Why this lands at 2,090 — just under the 2,100–2,300 target range:**
it fell out of the actual compression work rather than being tuned to a
number — M1-06 (the practice interaction) and M1-11 (the practitioner-
insight style reference) were both preserved close to intact on explicit
instruction, and both are content-dense chunks that resisted further
cutting without damaging what they were flagged as doing well. The number
landed inside the target range without needing to force it there.
