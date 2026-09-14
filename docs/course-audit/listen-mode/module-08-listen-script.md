# Module 8 — Listen Mode Script (v1, locked-standard production)

**Status:** Ready for generation. Written against live `#module8Wrap` and
the `M8_CHAPTERS` JS data array (headspa-mastery.html ~line 11864),
2026-08-31.

**v2 update (final pre-Listen-Mode video integration pass, 2026-09-13):**
Video 01 (`STEP_VIDEO_IDS[0]`, previously `null`) is now real footage —
"Opening Rituals + Microscopy," Vimeo ID `1226438466` — the last of the 9
chapters to arrive; the "video rollout... still in progress" caveat below
no longer applies to any chapter. **M8-04**'s chapter-one paragraph is
rewritten to match the real, reconciled Chapter 1 teaching (the opening
sequence now covers changing/arrival, intake completion, scalp
microscopy, and the aromatherapy ritual — not aromatherapy alone), and
**M8-02**'s phase-one label is updated to match the live page's own
`.cc-sub` text.

**v3 update (course source freeze pass, 2026-09-13):** Two changes.
(1) **M8-05**'s Chapter 9 paragraph was still narrating the *pre-*04faf79
close (cooling spray as a near-default step, no comb/temperature/Halo-
shutoff/towel-alternative/microscope-reveal/blow-dry detail) even though
`M8_CHAPTERS[8]` on the live page was already reconciled to the full
close in that commit — this doc had not caught up. Rewritten below
against the live `M8_CHAPTERS[8]` `guidance`/`why`/`teach` fields
directly; title and Vimeo ID (`STEP_VIDEO_IDS[8]`, `1214960268`)
unchanged. (2) The Module 8 chapter template was restructured on the page
(teaching content now precedes each chapter's video; "Watch for" moved to
sit immediately before it) — see the new **Video handoff /
chapter-reorder synchronization note** section below for what that means
for narration once this module gets full per-chapter audio, not just the
by-name overview these M8-04/M8-05 segments currently give it.

**v4 update (pre-audio polish pass, 2026-09-13) — visual-anchor note, no
narration rewrite.** The AIMT Service Timer section moved on the live page
from after both Module 8 checkpoints to **between them**: the on-screen
order is now `m8cp1` → Service Timer (`#m8TimerFeature`) → `m8cp2`. Nothing
in **M8-05**'s or **M8-08**'s spoken text made a positional claim, so no
line below was rewritten. What changes is anchor placement for whoever
wires this module's real per-chunk visual targets: **M8-08 currently reads
as one continuous "Checkpoint 1 + Checkpoint 2" beat, which assumed the two
checkpoints sit adjacent on screen — they no longer do.** When this module
gets real visual anchors, checkpoint 1's anchor stays at `#m8cp1` (still
right after the Protect-the-Flow scenarios), the Service Timer mention
already living in **M8-05** should anchor to `#m8TimerFeature` in its new
position, and **checkpoint 2's anchor must resolve to `#m8cp2` in its new,
post-Timer position** — i.e. after `#m8TimerFeature`, not immediately after
checkpoint 1. If M8-08 is ever split into two separate spoken beats (one
per checkpoint) rather than staying combined, the natural split point is
exactly there, with the Timer mention (or a brief re-orientation line) able
to sit between them. The **Player segments** line below is updated to
reflect this; none of its own segment audio content changed.

**Curriculum authority:** the 7-phase overview, Sections 8.1–8.3, the
9-chapter video masterclass (`M8_CHAPTERS`), a 3-scenario "Protect the
Flow" signature interaction, two checkpoints, the AIMT Service Timer
feature, one completion card.

**Screen/video-required content — narrated by reference, not
substitution:** the 9 masterclass chapters are built around real
instructional video demonstrating hands-on technique (`STEP_VIDEO_IDS` —
all 9 now real footage as of the 2026-09-13 video integration pass).
Listen Mode narrates
each chapter's **why** (the real non-visual reasoning) and its **client
communication script** where one exists (real audio-appropriate content),
but does not attempt to verbally describe hand technique, massage
motion, or positioning mechanics — that's what the video is for. Each
chapter is introduced by name so a listening student knows what's being
covered and that a video demonstration exists on screen for the technique
itself. The Service Timer (an interactive rehearsal tool, not new
teaching content) is mentioned by name and purpose, not narrated in
mechanical detail.

**Player segments (9):** Opening (briefing) → Phases overview → 8.1 →
8.2 intro + chapters 1–5 → chapters 6–9 + Service Timer → 8.3 → Protect the
Flow → Checkpoint 1 + Checkpoint 2 → post-pass recap/handoff. (On-screen
order as of the 2026-09-13 pre-audio polish pass: `m8cp1` → Service Timer →
`m8cp2` — see the **v4 update** note above for what this means for future
visual-anchor placement; the spoken segment order/content above is
unchanged.)

---

## The script

### M8-01 — Module Briefing (spoken)
**VOICE:** Teaching.

> Welcome to Module 8 — the head spa service itself. This module is about understanding how the service moves, from one technique to the next, why each part belongs, and how to adapt in real time without losing the experience.
>
> You'll learn to think in phases, not just a checklist of steps. You'll understand the difference between A-I-M-T's Core and Extended reference protocols, build a full service map you can adapt on the fly, master flow, pressure, and transitions between techniques, and take the service into practice with real adaptation scenarios.
>
> [warmly] Pay attention to this: the service is a flow, not a script. Losing the flow loses the experience, even if every step still technically happened.

### M8-02 — Think in phases, not steps
**SOURCE:** all 7 phases. **VOICE:** Reference for all 7, in order.

> Think in phases, not steps. If you think in steps, you become rigid — focused on what's next rather than what's happening now. If you think in phases, you stay aware of the full arc of the service: where you are, what the client is feeling, and what's coming, without losing presence.
>
> Seven phases. One: Entry and Regulation — opening rituals, microscopy, and dry work. Settle the client, establish rhythm, begin connection. If you feel rushed here, the rest of the service will feel rushed too.
>
> Two: Immersion — water and initial stimulation. Introduce water, deepen relaxation. Temperature inconsistency or hesitation here breaks trust immediately.
>
> Three: Treatment Work — exfoliation and scalp massage. One of the more demanding phases to execute well — continuous movement, even pressure, no stopping and starting. Pausing turns treatment into a sequence instead of an experience.
>
> Four: Expansion — neck, shoulders, extended work. Widen the experience, release tension, stay grounded and unrushed.
>
> Five: Reset and Cleanse — rinse, shampoo, treatment. Bring the scalp back to balance with smooth transitions and no break in rhythm.
>
> Six: Signature Moments — waterfall, cooling, hot towel. Create memorable peaks — controlled, intentional, slightly elevated from the rest.
>
> And seven: Exit — wrap, sit-up, transition out. This is where most practitioners fail. Rushing this moment makes the entire service feel shorter and less valuable. Gradual, calm, complete.

### M8-03 — 8.1 Core and Extended
**VOICE:** Teaching, Reference for both format summaries.

> Section 8.1 — Core and Extended. Two A-I-M-T reference protocols, one foundation.
>
> Core and Extended show how a complete service contracts or expands within a deliberately designed structure — not just two numbers on a menu. The difference is service structure, not simply less time versus more time.
>
> Core is a 60-minute reference: the complete condensed version, essential service flow preserved, scalable massage, bodywork, and sensory portions run tighter, and no hand-and-forearm massage. Extended is a 90-minute reference: a more expansive version where added time is directed intentionally toward selected massage, bodywork, and treatment portions — not spread evenly across every step — and includes hand-and-forearm massage.
>
> [firmly] Core and Extended are A-I-M-T's current reference formats, each built as its own service structure, not a formula for simply speeding up or stretching every step. A shorter service needs deliberate decisions about which components belong. A longer service should expand only where the extra time genuinely improves the experience. The goal is deciding where time adds value — not forcing the protocol to fit a number.

### M8-04 — 8.2 The service map, chapters 1–5
**SOURCE:** `M8_CHAPTERS[0..4]` — why + communication scripts, by name; no attempt to narrate physical technique. **VOICE:** Teaching for framing, Reference for each chapter's why/script.

> Section 8.2 — The service map. On screen, this masterclass walks through nine real video chapters, one technique at a time — I'll walk you through the reasoning and the client language behind each one, but the hands-on technique itself is something you need to actually watch, not just hear described.
>
> Each chapter is labeled one of three ways: "Communication cue" — say this proactively — "Keep the flow quiet" — no narration needed by default — or "If they ask" — your prepared answer. This service is relaxation-first; most of it stays quiet, not narrated step by step. And the protocol itself gets explained to the client at intake, where adaptations and preferences are identified — during treatment, communication manages comfort, pressure, temperature, and real transitions, not repeated step-by-step permission.
>
> Chapter one, Opening Rituals and Microscopy: this chapter now covers the full opening sequence, not aromatherapy alone. Help the client change into their wrap, robe, socks, and a place for jewelry, and complete intake now if it isn't already done — reviewing allergies, sensitivities, contraindications, and preferences before anything begins. From there, move into scalp microscopy: observe slowly and deliberately, and connect every observation to the treatment plan using three parts — what you saw, what you're going to do, and why. The aromatherapy ritual that follows is your first intentional physical connection with the client — one hand rests firmly on the shoulder and stays there through the whole scent selection, anchoring the client before hands-on treatment begins.
>
> Chapter two, Client Positioning and Comfort: the physical foundation for everything that follows. A fully supported client can stay settled instead of repeatedly readjusting, which protects continuity for the rest of the service.
>
> Chapter three, Dry Brushing and Hair Play: the tactile bridge between the pre-timer opening and the wet service — this is where the treatment clock itself starts. It establishes tempo and introduces sustained hands-on contact before water enters the experience. This one generally stays quiet — no narration needed.
>
> Chapter four, Halo Activation and Wet Massage: water flow, temperature, placement, touch, and massage operate as one continuous transition — never rinse, stop, massage. Temperature gets checked with your hand before any client contact, every time, regardless of what the thermostat says — equipment fails, your hand is the safeguard.
>
> And chapter five, Exfoliant and Scalp Massage — the heart of the service. Exfoliation intensity, product, and technique should match what this client's scalp is telling you today; a stronger application isn't a default you dial back only when there's a problem, it's one point on a range you select from every time. The massage itself is one of the anchors of the whole service — value comes from intentional rhythm, full coverage, continuity, and appropriate pressure, not casual rubbing and not a specific physiological outcome.

### M8-05 — 8.2 The service map, chapters 6–9 + Service Timer
**SOURCE:** `M8_CHAPTERS[5..8]` + the AIMT Service Timer feature. **VOICE:** Reference for each chapter's why/script.

> Chapter six, Neck and Shoulder Massage: the head spa experience doesn't have to stop at the hairline — this extends the relaxation beyond the scalp and helps maintain continuity between phases. [firmly] Neck, shoulder, hand, and forearm work only happens within your applicable professional scope, your training, and this client's consent for this specific service — completing this course never expands what you're licensed to perform.
>
> Chapter seven, Shampoo and Rinse: the cleansing phase of the head spa protocol, not a standard salon shampoo dropped into the service — controlled pressure, scalp focus, rhythm, and temperature awareness carry forward here. This one runs with minimal narration; the client is deeply relaxed by this point.
>
> Chapter eight, Deep Conditioning and Hand-and-Arm Massage: the conditioning portion supports the actual hair and scalp service plan, following the product's real processing requirements — and the hand-and-forearm massage makes productive use of otherwise passive processing time, wherever it fits your scope and training.
>
> And chapter nine, Final Rinse and Halo Massage: a wide-tooth comb moves through the scalp before the final rinse — that's for stimulation, not detangling. Temperature gets checked on your own skin first, confirmed with the client, then the rinse runs thorough, with real attention to the nape, around the ears, the hairline, and the crown. The Halo comes back for one more pass — low flow, the client's chest protected — into slow, broad neck-and-shoulder massage with steady contact, so this reads as a gradual release rather than an abrupt stop. Once that finishes, the water goes fully off and the Halo returns to rest before you choose one finishing element, never both: a cooling scalp spray, or a warm towel infused with the client's chosen oil, tested on your own skin first if it's the towel.
>
> Let the client know before the mask comes off, then gently squeeze — never rub — the excess moisture from the hair, wrap it loosely to one side, and step out so they can dress in privacy. When they return: a glass of ice water, and a second look through the microscope so they can actually see what changed since the first one. Finish with a controlled blow-dry — moderate heat, controlled airflow — a closing observation specific to what you actually addressed today, and any final recommendations before the appointment moves toward checkout.
>
> [warmly] The close should feel as intentional as the opening did.
>
> Once you know this service, you shouldn't have to reopen this lesson to run it. On screen there's the A-I-M-T Service Timer — a real treatment-room companion, included with your certification, that runs the full Core and Extended sequences, open to close, so you can train pacing and rehearse before a client without reopening the course.

### M8-06 — 8.3 Flow, pressure, and transitions
**SOURCE:** all 4 principles + the pressure-test question set. **VOICE:** Reference for all 4.

> Section 8.3 — Flow, pressure, and transitions. The skills most people never train explicitly.
>
> Flow control: flow is what turns technique into experience. A strong service has no long pauses, no searching, no abrupt transitions. Ask yourself during service — am I stopping anywhere? Reaching for something? Thinking too hard about what's next? If yes, flow is breaking. Fix it by thinking one step ahead and positioning tools before you need them.
>
> Pressure consistency: clients don't analyze pressure, they feel inconsistency. Consistent pressure reads as intentional; uneven pressure reads as uncertain, even when the underlying technique is sound.
>
> Temperature control: you don't guess temperature, you confirm it, every time. Water that's too hot, too cold, or inconsistent isn't a small mistake — it's a trust break. Equipment fails; your hand is the safeguard.
>
> And transitions: this is where services succeed or fail. A good transition feels like one movement leading into the next — no pause, no reset. A bad transition feels like stop, reposition, start again, and that breaks immersion immediately. Fix it by staying one step mentally ahead of your hands.
>
> [slowly] Pressure test your service: after practicing, ask — where did I hesitate? Where did flow break? Did anything feel disconnected? Did I reach for anything mid-service? Fix those points specifically. That's how you improve.

### M8-07 — Signature interaction: Protect the Flow
**SOURCE:** all 3 scenarios, framing only, choice left to the student. **VOICE:** Teaching.

> Signature interaction: protect the flow. The plan changes mid-service more often than a beginner expects. This one's ungraded — three moments where it does, and you decide how you'd preserve the service's flow and experience.
>
> Scenario one: a client who opted into fragrance at the start now asks, midway through, to skip it going forward. Scenario two: you're moving into exfoliation, and the scalp in front of you tells you a strong approach would be too aggressive today. And scenario three: the conditioning treatment needs more processing time than the format allows for today's appointment.
>
> [firmly] Across all three, the same principle applies: adjust without treating a reasonable change as a disruption, adapt technique by degree rather than switching it off entirely, and keep any recalculating calm and internal rather than visibly scrambling in front of the client. The protocol gives structure. Judgment keeps it appropriate.

### M8-08 — Checkpoint 1 + Checkpoint 2 (`m8cp1`, `m8cp2`)
**VOICE:** Teaching. **Visual anchor note (see v4 update above):** on
screen, `m8cp1` and `m8cp2` are no longer adjacent — the Service Timer
(M8-05) now sits between them. Real per-chunk visual anchors, when built,
must send `m8cp1`'s beat to `#m8cp1` and `m8cp2`'s beat to `#m8cp2` in its
new post-Timer position, not assume one contiguous on-screen block.

> Here's your first checkpoint. You're moving into the exfoliation portion of the service and determine that a strong exfoliation approach isn't appropriate for this client today. Walk through how you'd modify the treatment while preserving the service flow — what you'd change about product, pressure, technique, or intensity, and what you'd communicate to the client.
>
> Take your time, and answer above.
>
> And here's your second, final checkpoint. You're in the scalp-massage portion of the service when your client asks, "What makes this different from a regular shampoo at the salon?" What would you say in the moment, without breaking the experience?
>
> Take your time, and answer above.

### M8-09 — Post-pass continuation: completion + recap + handoff
**VOICE:** Teaching. `gateType: 'post-pass'`, `resumeAfterPass: true`.

> Module complete. You can run the full service, adapt it when conditions change, and communicate with intention — not just recite the steps.
>
> Up next, Module 9: checkout, client closing, and pricing strategy — how to close the appointment, communicate value, and price the services you now know how to perform.

---

## Video handoff / chapter-reorder synchronization note

The live page's Module 8 chapter template was restructured (course source
freeze pass, 2026-09-13): each chapter now runs **teaching content →
"Watch for [in the demonstration]" → video → chapter-complete nav**,
video last, instead of video-first. This script (M8-04/M8-05) already
narrates by chapter *name*, not as a synced per-chapter audio track, so
nothing in the script above needed to move — but this is the rule future
full per-chapter Listen Mode narration (if this module is ever produced
beyond the current by-name overview) must follow:

- Narrate the chapter's teaching (why + communication script) first, the
  same content this script already draws from `M8_CHAPTERS[n].why`/`teach`.
- Hand off to the video only after that teaching is spoken — something
  like *"now watch the demonstration and pay attention to [the chapter's
  `watchFor` cue, or a close paraphrase]"*. Vary the phrasing chapter to
  chapter; don't repeat one exact sentence nine times.
- The video itself stays non-narrated, matching the existing screen/video
  boundary above (Listen Mode has never voiced hand technique).
- Once the handoff line plays, treat the chapter as finished for audio
  purposes — no post-video narration block. This matches the page: only
  chapter status/nav and a one-line "what's next" now render after the
  video, and neither is spoken content already covered by M8-04/M8-05's
  chapter-to-chapter transitions.

## Editorial QA (pre-generation checklist)

Parity — all 7 phases, both formats, all 9 masterclass chapters (by name,
with real why/script content, video-technique deferred to the actual
video per the screen-required-content note above), all 4 flow principles,
all 3 Protect-the-Flow scenarios, both checkpoints covered. Reference
completeness confirmed against `M8_CHAPTERS`. No invented technique
description was added for any chapter — only the array's own `why`/`teach`
fields, never the `guidance` hand-motion text (deliberately left to
video). Scope language (Section 8.2's neck/shoulder/hand/forearm scope
caveat) preserved verbatim, not softened. Checkpoint locations both
confirmed at their real post-interaction position. Section order matches
the live page exactly. Estimated ~19 min total — the video-technique
deferral keeps this from running significantly longer despite covering 9
chapters.

## ElevenLabs generation plan

| Piece | Chunks | Approx. chars |
|---|---|---:|
| A1 | briefing → phases → 8.1 | ~3,150 |
| A2 | 8.2 chapters 1–5 | ~3,450 |
| A3 | 8.2 chapters 6–9 + Timer | ~2,850 |
| B1 | 8.3 → Protect the Flow → checkpoints 1+2 | ~3,450 |
| C1 | post-pass recap/handoff | ~450 |

5 generations, `Y3ZPRGOSIxbV4Rbb3WiA` / `eleven_v3`.
