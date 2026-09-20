# Module 10 — Listen Mode Script (v2, strict-fidelity rebuild)

**Status:** Ready for generation, pending coverage audit sign-off (see
`module-10-fidelity-coverage-audit.md` — PASS). Written directly against
live `#module10Wrap` (`headspa-mastery.html`, lines 9358–9658, read fresh
and in full, 2026-09-18), superseding v1 (**REJECTED** — archived at
`docs/course-audit/listen-mode/archive-loose-v1/module-10-listen-script-v1-REJECTED.md`,
its previously-generated audio archived at
`AIMT-Listen-Mode-Final/10-Module-10/archive-loose-v1/`, its batch
payloads and manifest archived at
`docs/course-audit/listen-mode/tts-final/module-10/archive-loose-v1/`.
Nothing deleted).

**Why v1 was rejected:** v1 was written and generated before the current
Listen Mode editorial standard's Sections F, G, and I existed, and carries
three defects those sections now name explicitly:
1. **"Answer above" (Section F).** Both v1 checkpoint closings say "Take
   your time, and answer above" — the response field sits below the
   prompt in the live player, never above it. Confirmed independently by
   `00-listen-mode-editorial-standard.md` Section H, which lists Module 10
   among the modules where this exact defect was already found shipped.
2. **Interaction answer-spoiling (Section I.2).** v1's `M10-04` narrates
   the "Reset Under Pressure" interaction's prompt and all five options,
   then immediately continues in the same unbroken chunk with "What
   actually works... What doesn't...", naming the strongest response and
   summarizing why every other option is wrong — all before an audio-only
   student could have chosen anything. This is exactly the defect pattern
   Section I.2 exists to forbid.
3. **Both checkpoints narrated together before student action (Section
   I.1).** v1's `M10-06` speaks checkpoint 1's full prompt, then
   immediately continues in the same chunk into checkpoint 2's full
   prompt, with no `checkpoint-stop` gate and no wait for a pass in
   between. A student who hasn't answered checkpoint 1 yet already hears
   checkpoint 2 read to them.

**Additional fidelity corrections made in this rebuild (not defects named
above, but found on direct re-read against the live page):** the module's
own title ("Sanitation & Reset Systems") and tagline ("Build a sanitation
system that holds up all day.") were never spoken in v1 — only the desc/
list/attention-note were. Four labeled callouts were spoken as plain
prose without their own label ever announced: "Governing sources"
(intro), "Practitioner note" (10.3), "Caution" (10.5's warning key-point),
and "Possible log fields" (10.4). All four are now spoken as explicit
labeled beats, matching the Module 9 v4 precedent's own rule: *a
substantive visible teaching landmark must be delivered before Cadence
paraphrases or adds context — the label itself is not optional.*

**Pronunciation correction, post-generation (2026-09-18):** after all 15
v2 batches were generated using the course-wide locked "A I M T"
(single-spaced letters) normalization, the owner listened to batch A1 and
reported the acronym rendered as "Am-tee" rather than four distinct
letters. Root cause: the first three letters, A-I-M, spell the real
English word "aim" — `eleven_v3`'s phonetic model pulls toward reading
that run as the word "aim" plus "T," producing the blended mispronunciation,
a collision the single-spaced convention doesn't fully guard against.
Two candidate fixes were generated and compared by ear: "A, I, M, T"
(comma-separated) and "A I M T" wrapped in a `[slowly]` delivery tag. The
owner confirmed the comma-separated form reads as four distinct letters;
the `[slowly]`-tagged form was rejected outright ("sounds crazy"). Batch
A1 (the only batch in this module containing the acronym, both
occurrences in M10-02) was regenerated with "A, I, M, T"/"A, I, M, T's" —
the only two "AIMT" mentions in this module now use this form, not the
course-wide single-spaced one. **This finding likely affects every other
module's existing "A I M T" audio (Modules 0–9, 11, 12), all generated
under the same single-spaced convention** — that is a course-wide,
cross-module implication flagged here for the owner's decision; fixing it
elsewhere is explicitly out of scope for this Module 10 task and was not
attempted.

**Standard applied:** the Module 4/5/6 controlling precedent
(`module-04-fidelity-coverage-audit.md`, `module-05-...`,
`module-06-...`), the same standard just re-applied to Module 9 (v4). The
test for every substantive element is: *did the listening student
actually receive the substantive information visible in the lesson* — not
whether the general idea was gestured at. Numbers, counts, qualifiers,
and named items are not compressed or approximated.

**Checkpoint ids on this module (`m9cp1`, `m9cp2`) carry their historical
prefix from the course-audit-build 9↔10 module reorder** — confirmed
fresh this pass at `headspa-mastery.html:9604,9627` (checkpoint element
ids), `headspa-mastery.html:12748-12753` (naming-rationale code comment:
"SANITATION CHECKPOINTS (m9cp1/m9cp2 — historically named; now belong to
student-facing Module 10... only the moduleId passed into the state
pipeline changes"), and `submitM9CP()` at `headspa-mastery.html:12754`
calling `submitCheckpoint(10, id, ...)` — moduleId `10` is the literal
argument. Not renamed, per `docs/AIMT-AUDIT-RULES.md`.

**Curriculum authority:** intro + governing-sources note, Sections
10.1–10.5, one 5-option "Reset Under Pressure" ungraded interaction, two
checkpoints (`m9cp1`, `m9cp2`) back-to-back after 10.5 (no section
between them on the live page — confirmed at `headspa-mastery.html:9602-9648`),
one completion card.

**Player segments (11 narration chunks + 5 interaction-feedback
branches):** Opening (briefing) → Building on Your Licensure + Governing
sources + 10.1 → 10.2 → 10.3 → [Reset Under Pressure: interaction-stop +
5 feedback branches] → 10.4 → 10.5 → Checkpoint 1 (`m9cp1`) → post-pass
(transition only) → Checkpoint 2 (`m9cp2`) → post-pass recap/handoff.

**Reference Voice landmarks:** the governing-sources note, verbatim
(intro); all 5 process definitions, term + sub + full def each (10.1);
all 6 sanitation-item categories in full, with their exact frequency tag
spoken for each (10.2); the full 5-step reset sequence in order (10.3);
the "Reset Under Pressure" prompt and all 5 option labels, verbatim and
unreordered, with **zero verdict/rationale narrated until after the
student has acted** (10.3 interaction); the weak/strong system comparison
and the full 7-item consistency-factors list (10.4); the full 7-item
possible-log-fields list (10.4); the blood/body-fluid caution and the
rash-response info card, both in full (10.5); both checkpoint prompts,
verbatim, each gated as its own `checkpoint-stop` (10.5 checkpoints).

---

## The script

### M10-01 — Module Briefing (spoken)
**SOURCE:** `.mo-eyebrow`/`.mo-title`/`.mo-tagline`/`.mo-desc`/`.mo-list`
(5 items)/`.mo-attention`, `headspa-mastery.html:9362-9381`. **VOICE:**
Teaching. **gateType:** normal. **FIXES v1:** module title ("Sanitation &
Reset Systems") and tagline ("Build a sanitation system that holds up all
day.") now explicitly spoken — v1 opened with "Welcome to Module 10" and
skipped straight to the desc, never naming the module itself. All 5
"In this module" items now individually preserved (v1's folded sentence
silently dropped "— every time" from item 1).

> Welcome to Module 10 — Sanitation and Reset Systems. Build a sanitation system that holds up all day.
>
> Most people treat sanitation and reset as something separate from the service. It's not. Clients may not watch you clean — but they feel freshness, organization, and readiness. And they also feel leftover clutter, damp linens, and signs of the previous client. That's what breaks a premium experience.
>
> Here's what's ahead: you'll use the right sanitation process for the right job, every time. You'll process each item correctly, not just quickly. You'll build a reset routine around what genuinely cannot be rushed. You'll design a system that holds up under pressure, before you're under pressure. And you'll know what to do when a routine reset isn't enough.
>
> [warmly] Pay attention to this: clients rarely comment on sanitation when it's right — they always notice when it's wrong.

### M10-02 — Building on Your Licensure + Governing sources + 10.1 Use the Right Process for the Job
**SOURCE:** `headspa-mastery.html:9388-9437`. **VOICE:** Teaching for the
framing; Reference for the governing-sources note and the 5 process
definitions. **gateType:** normal. **AIMT fix:** "AIMT's"/"AIMT" (bare,
spoken form) → "A, I, M, T's"/"A, I, M, T" (comma-separated, not the
course-wide single-spaced "A I M T" convention — see "Pronunciation
correction, post-generation" below for why this module deviates).
**FIXES v1:** the "Governing sources" `kp-eyebrow` label is now spoken
explicitly — v1 folded straight into the note's body text with no label
announced.

> Building on your licensure. You already know sanitation fundamentals. This module teaches you how to apply them to the specific realities of a Head Spa.
>
> This module builds on the sanitation and disinfection education you already completed for your license. A, I, M, T's focus is how those fundamentals apply to wet systems, halo equipment, reusable tools, service surfaces, linens, product handling, room reset, and workflow when the schedule is tight.
>
> Governing sources: your current state or local requirements, your disinfectant and product labels, and your equipment manufacturer's instructions remain controlling wherever they're more specific than this module. A, I, M, T teaches how those requirements apply inside a Head Spa — this course doesn't replace them.
>
> Section 10.1 — Use the Right Process for the Job. Five words. Five different actions.
>
> "Clean," "disinfect," "sanitize," and "sterile" get used interchangeably in casual conversation — but they aren't the same action, and using the wrong one in the wrong place is where real risk lives.
>
> One, Cleaning — removal, not treatment: removes soil, residue, and debris. Often required before an item can be properly disinfected.
>
> Two, Disinfection — follows the label, every time: treats an appropriate item or surface with a disinfectant according to its label — approved use, dilution where applicable, required contact time, and applicable rules. One product does not work for everything.
>
> Three, Launder, Replace, or Discard — not one path: washable porous goods, disposable single-use items, and reusable hard nonporous tools each follow a different process — they were never interchangeable.
>
> Four, Reset — preparing for what's next: preparing the cleaned, processed room, supplies, and equipment for the next service. Reset is not a substitute for disinfection.
>
> And five, Sterilization — a different standard: a higher standard than disinfection, used only where it's specifically required. Disinfected is not the same as sterile, and not every Head Spa setup requires sterilization equipment.

### M10-03 — 10.2 Process the Right Item the Right Way
**SOURCE:** `headspa-mastery.html:9441-9484` — 6 sanitation-item
categories in full, plus the instructor tip. **VOICE:** Reference for all
6 categories; Teaching for the framing and instructor tip's own framing.
**gateType:** normal. **Acronym normalization:** "SOP" (bare, spoken
form) → "S O P," matching the same spaced-letter treatment as A I M T
(both are read-as-letters abbreviations, not words).

> Section 10.2 — Process the Right Item the Right Way. Match the process to what the item actually is.
>
> Instead of one universal schedule, think item, then process. Some processing happens between clients, some follows a daily opening or closing routine, and some is periodic and manufacturer-directed. Actual frequency depends on your product label, equipment manufacturer instructions, applicable rules, service use, and your own business's S O P — not a single number this course can certify for every setup.
>
> Between clients: reusable hard, nonporous tools. Remove soil and debris. Disinfect before reuse with an appropriate labeled product. Preserve the required contact time. Keep clean and used tools separated — never together.
>
> Between clients: hard, nonporous service surfaces. Clean as needed. Disinfect with an appropriate labeled product. Respect the required wet or contact time before the surface is back in use.
>
> Between clients: linens and washable porous goods. Remove immediately after use and contain away from clean stock. Launder before reuse. Store clean linens protected from contamination.
>
> Between clients: single-use items. Discard after their intended single use. Never reprocess a single-use item as if it were reusable.
>
> Periodic, manufacturer-directed: the halo, basin, water system, and equipment. Follow your specific equipment manufacturer's cleaning, disinfection, and maintenance instructions, plus any applicable regulatory requirements. Your bed or halo system's own manual is the actual authority here — not a generic routine.
>
> Between clients: product bowls, applicators, and supplies. Clean applicators between clients. Portion and dispense hygienically. Never reuse a client's leftover product on the next client.
>
> [slowly] Instructor tip: in our own Head Spa, a whirlpool or jet-system cleaner has worked especially well for periodic cleaning of the halo and water lines. If you choose to use one, confirm first that it's compatible with your specific bed or halo system, and follow both the cleaner's label and your equipment manufacturer's instructions. This is a maintenance tip, not a required procedure — it doesn't replace any disinfection step your system actually requires.

### M10-04 — 10.3 Build a Reset Around What Cannot Be Rushed
**SOURCE:** `headspa-mastery.html:9488-9506` — the full 5-step reset
sequence + practitioner note. **VOICE:** Reference for the sequence;
Teaching for the framing and note. **gateType:** normal. **FIXES v1:**
the "Practitioner note" `kp-eyebrow` label is now spoken explicitly — v1
folded straight into the note's body with no label announced.

> Section 10.3 — Build a Reset Around What Cannot Be Rushed. Contain. Clean. Disinfect. Reset. Verify.
>
> A reliable reset isn't a race — it's a repeatable flow with one phase that sets the actual pace: whatever process time the item or equipment genuinely requires.
>
> Step one, Contain: move used linens, disposable items, and dirty implements into their correct used or dirty handling path immediately — before anything else.
>
> Step two, Clean: remove soil, product residue, and debris wherever the next required process depends on it.
>
> Step three, Disinfect or Process: start whatever disinfectant contact time, equipment cycle, or manufacturer-directed process is actually required. This step doesn't get shortened.
>
> Step four, Reset: rebuild clean linens, protected supplies, necessary products, sensory setup, and equipment — without recontaminating anything you just processed.
>
> Step five, Verify: walk the room before the next client. Confirm equipment is ready, required process time is complete, clean and used items stay separated, supplies are stocked, and nothing from the last client remains.
>
> Practitioner note: once your process is correct, practice it until it's repeatable. Then measure your actual reset time and build enough turnover into your schedule to run it without rushing anything required. Independent tasks can happen while a required contact time or equipment cycle runs — the required process itself never gets shortened because the next client is waiting.

### M10-05 — Reset Under Pressure (interaction prompt + options)
**SOURCE:** `headspa-mastery.html:9510-9521` — the interaction's prompt
and all five option labels, verbatim and unreordered. **VOICE:** Teaching
for the framing; Reference (word-for-word) for the five options — no
verdict, no hint at which option is strongest. **gateType:**
`interaction-stop`. **interactionId:** `m10RupDecision`.
**interactionOptionsSelector:** `.bq-opt` (default). **FIXES v1:** the
verdict paragraph ("What actually works... What doesn't...") that
followed the options in the same v1 chunk is removed entirely from this
chunk — it now lives only in the five separate feedback branches below,
each gated to play only after the student selects that exact option (see
"Interaction timing map" below).

> Reset Under Pressure — the room isn't fully ready, and the next client already is.
>
> The next client has arrived early. Most of the room is reset, but a reusable item or surface is still completing its required disinfectant contact time. What do you do? Five possible responses are on screen.
>
> One: let the required contact time finish undisturbed. Use another already-clean, ready item or surface if one is available, or continue other reset tasks in parallel. Delay the client's start briefly if you need to.
>
> Two: wipe the item or surface dry now since it already looks clean, to save time.
>
> Three: skip the remaining contact time — the client is already waiting.
>
> Four: grab an unprocessed backup tool or surface instead of waiting.
>
> Five: start the service anyway and finish processing the item afterward, since the schedule matters more right now.
>
> Choose the response you think best handles this.

#### M10-05-fb0 — feedback for option 1 (strongest response)
**SOURCE:** `M10_RUP_ANSWER.feedback[0]`, `headspa-mastery.html:13039`,
verbatim. **gateType:** interaction feedback branch, `optionIndex: 0`.

> This preserves the required process. The client can wait a few minutes, you can keep working on other reset tasks in parallel, or you can use an already-clean, ready alternative if one exists — the process finishes on its own schedule, not the client's.

#### M10-05-fb1 — feedback for option 2
**SOURCE:** `M10_RUP_ANSWER.feedback[1]`, verbatim. **gateType:**
interaction feedback branch, `optionIndex: 1`.

> Wiping it dry because it looks clean skips the actual requirement. Visual cleanliness is not the same as a completed disinfectant contact time or equipment process.

#### M10-05-fb2 — feedback for option 3
**SOURCE:** `M10_RUP_ANSWER.feedback[2]`, verbatim. **gateType:**
interaction feedback branch, `optionIndex: 2`.

> Skipping the remaining contact time defeats the reason the process exists. The client arriving early doesn't change what the product or equipment actually requires.

#### M10-05-fb3 — feedback for option 4
**SOURCE:** `M10_RUP_ANSWER.feedback[3]`, verbatim. **gateType:**
interaction feedback branch, `optionIndex: 3`.

> An unprocessed backup hasn't gone through cleaning or disinfection yet — using it introduces exactly the risk the reset process exists to prevent.

#### M10-05-fb4 — feedback for option 5
**SOURCE:** `M10_RUP_ANSWER.feedback[4]`, verbatim. **gateType:**
interaction feedback branch, `optionIndex: 4`.

> Starting the service before the process finishes and catching up afterward reverses the order that keeps the room and tools safe for the next step. The process comes first.

### M10-06 — 10.4 Build the System Before You're Under Pressure
**SOURCE:** `headspa-mastery.html:9528-9570` — full section, both info
cards, both lists, the key-point, and the compliance-review guidance.
**VOICE:** Teaching for the framing; Reference for both lists.
**gateType:** normal. **FIXES v1:** the "What this looks like under
pressure" info-card title is now spoken explicitly (v1 spoke only the
card's body, "you're running behind..."); "Possible log fields" is now
spoken as an explicit label (v1 folded it into "possible fields include"
without naming the card).

> Section 10.4 — Build the System Before You're Under Pressure. Reduce decisions. Not standards.
>
> Reliability doesn't come from moving faster under pressure. It comes from a system that already removed the decisions pressure would otherwise force you to make badly.
>
> Here's what this looks like under pressure: you are running behind. One client just left. The next client arrives early.
>
> A weak system looks like this: rushed cleaning, missing items, scattered tools. Next service starts unstable.
>
> A strong system looks like this: automatic reset, no thinking required, everything already in place. Next service starts controlled.
>
> The difference is not discipline in the moment — it's the system you built before the moment.
>
> Consistency comes from: clear clean and used zones. Known product label and contact-time instructions. Equipment instructions accessible. Appropriate clean backups on hand. Protected clean linens and supplies. A room-specific reset order. And adequate turnover time built into the schedule.
>
> [slowly] Pressure test your system: can I reset without thinking? Does it hold up when I'm behind? Is everything I need already within reach? If not, the system isn't finished — the pressure just revealed it.
>
> Records can support consistency, maintenance history, traceability, and review when a concern occurs. Keep any records your jurisdiction requires, plus any additional logs your own business uses to verify its procedures.
>
> Possible log fields: date and time. Product used. Dilution where applicable. Contact time. Equipment maintenance performed. Person performing the procedure. And issues or deviations.
>
> Use your current state or local requirements, and set up a recurring compliance review — not a once-a-year checkbox. Recheck whenever your regulations, equipment, disinfectants, services, or procedures change. An annual internal review is a reasonable business habit, not a guarantee of compliance on its own.

### M10-07 — 10.5 When Routine Reset Is Not Enough
**SOURCE:** `headspa-mastery.html:9574-9600` — the caution, the
rash-response guidance, and the sanitation checklist resource card.
**VOICE:** Reference throughout. **gateType:** normal. **FIXES v1:** the
"Caution" `kp-eyebrow` label is now spoken explicitly — v1 folded
straight into "Stop your normal reset flow..." with no label announced.

> Section 10.5 — When Routine Reset Is Not Enough. Blood or body fluid is not a routine reset.
>
> Blood or another potentially infectious material changes what happens next. It isn't handled with your normal between-client reset.
>
> [firmly] Caution: stop your normal reset flow. Follow your business's applicable exposure or cleanup procedure. Use appropriate protective equipment. Contain and remove visible material safely. Clean and process affected reusable items and surfaces appropriately, using products according to their labels. Handle contaminated laundry and disposables appropriately. Document and follow your workplace's and regulatory process. Employee and employer exposure requirements can depend on your applicable workplace law and business structure — know what applies to yours.
>
> A client reporting a rash the next day doesn't prove sanitation caused it, a product caused it, an allergy caused it, friction caused it, that the business is at fault, or that it isn't. Your job is to respond professionally — not to diagnose or assume a cause.
>
> How to respond: acknowledge the concern. Document exactly what the client reports. Don't diagnose. Don't assume or deny a cause. Review the service, intake, and product records. Review sanitation, equipment, linen, and process records where relevant. Identify any actual deviation. Follow your business's incident or compliance procedure. Suggest medical evaluation when it's warranted, without attempting to diagnose.
>
> There's also a downloadable Between-Client Sanitation and Reset Checklist on screen — a room-side reference for the Contain, Clean, Disinfect or Process, Reset, Verify workflow, plus a fillable page for recording your own verified product, equipment, and jurisdiction details.

### M10-08 — Checkpoint 1 (`m9cp1`)
**SOURCE:** `headspa-mastery.html:11504` (question text, re-verified
fresh this pass — exact match, unparaphrased), `.cp-label.cc-headline`
"Between-client reset reasoning" at `headspa-mastery.html:9610`.
**VOICE:** Teaching. **gateType:** `checkpoint-stop`. **checkpointId:**
`m9cp1`. **FIXES v1:** closing directional cue corrected from "answer
above" to "answer below" (Section F).

> Here's your first checkpoint — between-client reset reasoning. Walk me through your between-client reset in the order that works for your setup. Identify what you remove or contain, what you clean and disinfect, what you replace or restock, and any required contact or equipment time you would not shorten.
>
> Take your time, and answer below.

### M10-09 — Post-pass (`m9cp1`): transition only
**VOICE:** Teaching. **gateType:** `post-pass`. **checkpointId:**
`m9cp1`. **resumeAfterPass:** true. **SOURCE:** none — narration-UX only.
No section sits between `m9cp1` and `m9cp2` on the live page (confirmed
at `headspa-mastery.html:9602-9648`: one `<hr class="divider">` and
nothing else), so this chunk is a brief transition, matching the Module 9
`M9-08` post-pass precedent's own opening line for the same narration-UX
purpose. **FIXES v1:** this is a new, separate chunk — v1 had no gate
here at all; checkpoint 2's prompt played immediately and automatically
after checkpoint 1's prompt, with no wait for a pass in between.

> Nice work — let's keep going.

### M10-10 — Checkpoint 2 (`m9cp2`)
**SOURCE:** `headspa-mastery.html:11505` (question text, re-verified
fresh this pass — exact match, unparaphrased), `.cp-label.cc-headline`
"Post-service concern response" at `headspa-mastery.html:9633`.
**VOICE:** Teaching. **gateType:** `checkpoint-stop`. **checkpointId:**
`m9cp2`. **FIXES v1:** closing directional cue corrected from "answer
above" to "answer below" (Section F); this chunk did not exist as a
separate, independently-gated chunk in v1 — see M10-09 above.

> Here's your final checkpoint — post-service concern response. A client contacts you the next day and reports a rash on her neck after the service. What would you say to her, what facts would you document, and what would you review internally without diagnosing or assuming the cause?
>
> Take your time, and answer below.

### M10-11 — Post-pass (`m9cp2`): completion + recap + handoff
**SOURCE:** `#m10Complete`, `headspa-mastery.html:9648-9657` — re-verified
fresh this pass, exact match. **VOICE:** Teaching. **gateType:**
`post-pass`. **checkpointId:** `m9cp2`. **resumeAfterPass:** true.

> Module complete. You can deliver a great service. You can reset it cleanly. That discipline is what makes the experience repeatable — for every client, every time.
>
> Up next, Module 11: AI, or Modern Practice Tools. Modern practitioners are already encountering AI — this module teaches you to use it well, without losing the judgment that makes you a professional.

---

## Interaction timing map (Section I compliance)

| Point | Chunk | Reveals before student acts? |
|---|---|---|
| Reset Under Pressure prompt + 5 option labels | M10-05 (`interaction-stop`) | No — no verdict, no "what actually works," no hint which option is strongest. Player halts after this chunk and polls `#m10RupDecision`'s `.bq-opt[aria-pressed]`/`data-choice` (read-only) until a selection is made. |
| Option 1 feedback (strongest) | M10-05-fb0 | Plays only if option 0 is the one actually selected. |
| Options 2–5 feedback | M10-05-fb1..fb4 | Each plays only if that exact option is the one actually selected — never any other branch. |
| Checkpoint 1 prompt | M10-08 (`checkpoint-stop`, `m9cp1`) | No grading/result narrated; player halts and polls `APP_STATE` (via `engine.isCheckpointPassed`) for a pass. |
| Checkpoint 2 prompt | M10-10 (`checkpoint-stop`, `m9cp2`) | Same — and critically, does **not** play until after M10-09's post-pass chunk plays following an actual `m9cp1` pass. v1's defect (both checkpoints narrated back-to-back with no gate) is fixed by this chunk split. |

## Editorial QA (pre-generation checklist)

1. **Parity** — every named process, item category, reset step,
   interaction option, checkpoint, and caution item is present, not
   gestured at.
2. **Reference completeness** — no list silently thinned anywhere (all 5
   process definitions, all 6 item categories, all 5 reset steps, all 5
   interaction options, all 7 consistency factors, all 7 log fields).
3. **Teaching voice** used only between landmarks, never inside a
   Reference passage.
4. **No invented claims** — the "governing sources control" framing and
   the "don't diagnose"/"don't assume a cause" boundaries preserved
   exactly; the required-contact-time-never-shortened language never
   softened.
5. **No skipped items, no reordered option/feedback text.**
6. **Checkpoint locations correct** — `m9cp1` after 10.5, `m9cp2`
   immediately after `m9cp1`'s post-pass transition, before completion.
   Matches live DOM order, re-verified fresh this pass.
7. **Section order correct** — intro → 10.1 → 10.2 → 10.3 → [interaction]
   → 10.4 → 10.5 → [cp1] → [cp2] → completion, matches live DOM order.
8. **AIMT normalization** — no standalone "AIMT" spoken as one word, no
   hyphenated "A-I-M-T," no dotted "A.I.M.T" anywhere in this script (2
   occurrences of "AIMT" in the source, both now "A, I, M, T" — the
   comma-separated form, corrected post-generation per owner listening
   feedback; see "Pronunciation correction, post-generation" above).
9. **No "answer above"** anywhere in this script (2 checkpoint closings,
   both now "answer below" — the exact v1 defect corrected).
10. **No interaction verdict spoken before student action** — the
    "Reset Under Pressure" verdict content lives only in the 5 gated
    feedback branches, never in the prompt chunk.
11. **No two checkpoints narrated in the same ungated chunk** — `m9cp1`
    and `m9cp2` are now two separate `checkpoint-stop` chunks with a
    `post-pass` transition between them.
12. **Final-third re-read done independently of the coverage-map pass** —
    see the coverage audit's END-OF-MODULE FIDELITY CHECK.

## ElevenLabs generation plan

| Piece | Chunks | Notes |
|---|---|---|
| A1 | M10-01 → M10-02 | Briefing + licensure/governing-sources + 10.1 |
| A2 | M10-03 | 10.2, all 6 item categories |
| A3 | M10-04 | 10.3, full 5-step sequence |
| A4 | M10-05 | Reset Under Pressure — prompt + 5 options only |
| A4-fb0..fb4 | M10-05-fb0 .. M10-05-fb4 | 5 separate tiny batches, one per option's feedback |
| B1 | M10-06 | 10.4, full |
| B2 | M10-07 | 10.5, full |
| B3 | M10-08 | Checkpoint 1 alone |
| B4 | M10-09 | Post-pass transition alone (tiny) |
| B5 | M10-10 | Checkpoint 2 alone |
| C1 | M10-11 | Post-pass recap/handoff |

15 batches (10 narration + 5 interaction-feedback branches).
`Y3ZPRGOSIxbV4Rbb3WiA` (Jane) / `eleven_v3` — same voice/model as the
rest of the course. See `module-10-fidelity-coverage-audit.md` for the
preflight result and exact character counts.
