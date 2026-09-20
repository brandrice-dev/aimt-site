# AIMT Head Spa Mastery — Course Seat-Time Ledger

**Purpose:** a real, evidence-based inventory of what is actually known about
how long HeadSpa Mastery takes to complete, versus what is still pending —
so a future pass can responsibly propose an "approximately X hours" buy-page
claim instead of guessing. **This document does not itself propose a number
for publication**, and nothing on the buy page, marketing copy, or any live
duration claim was touched to produce it.

**Labeling convention (per task instruction — never blurred):**
- **ACTUAL MEASURED** — a real number pulled from a file, with the exact
  source cited.
- **ESTIMATED** — a human judgment call, labeled as such, with reasoning
  given.

Compiled 2026-09-16, from the `course-audit-build` branch working tree.
**Updated 2026-09-17** to add Modules 7 (now owner-approved) and 8 (now
generated, awaiting owner review) — see §0 and §1.

---

## 0. Important scope note found during research

The task brief that produced this ledger stated "Modules 1, 4, 5, 6 are
owner-approved [audio]." As of the 2026-09-17 update, **Module 7 joins that
owner-approved group** (owner confirmation received the same session Module
8 generation began), and **Module 8 has been generated but is explicitly
NOT yet owner-approved** — it is awaiting the owner's review, same as 1/4/5/6
were before their approval. Research below confirms Modules 1/4/5/6/7's
**scripts** each passed a "strict-fidelity" content audit (see
`docs/course-audit/listen-mode/module-0{1,4,5,6,7}-fidelity-coverage-audit.md`),
and real ElevenLabs audio has been generated against the corrected scripts.
But the **audio itself** is not uniformly "approved and live":

- `docs/course-audit/listen-mode/tts-final/module-05/manifest.json` →
  `generationSummary.ownerAudioReviewPending: true` — Module 5's regenerated
  audio explicitly says owner review of the *audio* (not just the script) is
  still pending, as of this file.
- Module 1's audio is more complex still: the **currently live, student-facing**
  Module 1 Listen Mode audio (`qaStatus: 'APPROVED'` for all 14 chunks in
  `assets/js/aimt-listen-mode-data.js`, per
  `docs/course-audit/listen-mode/module-01-reference-implementation-FROZEN.md`,
  "APPROVED and FROZEN," 2026-08-31) is a **different, older recording**
  (measured 18:53.66 total — see Module 1 below) than the new September 2026
  "v6 strict-fidelity rebuild" this ledger also reports (measured 17:12.72).
  `docs/course-audit/listen-mode/tts-final/RESUME.md` confirms the new
  regeneration pass explicitly overrode Module 1's FROZEN status "for this
  run only" and states nothing gets wired into the live course "until the
  owner explicitly confirms processed audio is ready for that second
  integration pass" — i.e. the new rebuild is staged, not yet live.
- No equivalent explicit "audio review pending" flag exists in the Module 1,
  4, or 6 manifests, but they are part of the same in-progress regeneration
  effort, use the same staging location (gitignored
  `AIMT-Listen-Mode-Final/`), and per RESUME.md's blanket statement nothing
  from this pass has been wired into `assets/js/aimt-listen-mode-data.js`
  for any of them yet.

**Bottom line carried through this ledger:** for Modules 1, 4, 5, 6, 7 this
document reports the real, measured duration of the **most current
regenerated ("strict-fidelity") pass**, clearly labeled as such — but that is
distinct from "confirmed live in production." Only Module 1's *old* Aug-31
recording is actually live for students today. Module 8's real, measured
duration is reported too, labeled explicitly as **generated, not yet
owner-approved** — a distinct, earlier status than 1/4/5/6/7.

**Data-integrity correction (2026-09-17, updated same day):** this
document's §1 originally stated Module 5's final-pass entries were *absent*
from `GENERATION-LOG.json`. Discovered during the Module 7 log-bookkeeping
repair: Module 5's log entries were not absent — they were **present but
stale**, matching the archived, rejected v1 audio (confirmed by exact
`fileBytes` match against `archive-loose-v1/`) rather than the current
approved v2 audio, the identical defect just repaired for Module 7.
**Module 5's log has since been repaired** using the same verified method
(stale entries annotated in place, not deleted; 11 correct entries appended,
sourced directly from `module-05/manifest.json`'s own embedded per-batch
`generation` records — real `generationId`s recovered this time, not just
duration/cost). All 11 Module 5 batches now validate cleanly against their
actual approved audio (0.00s difference). This ledger's Module 5 duration
figure (§1) was unaffected throughout, since it was always sourced from
`module-05/manifest.json` directly, never from the log.

**Read-only integrity check, Modules 1/4/6 (2026-09-17):** these three logs
also carry orphaned entries from an even earlier, now fully-superseded
generation pass (predating the `archive-loose-v1/` audio itself — their
logged `fileBytes` match neither current nor archived audio). Unlike
Module 5/7, this is **not currently causing any validation failure**:
Modules 1 and 4's correct data lives under distinct module tags (`"01v6"`,
`"04v6"`) that coexist harmlessly alongside the orphaned `"01"`/`"04"`
entries; Module 6's correct entries are simply the later of two array
entries per batch, and duration-matching already resolves to them
correctly. Confirmed via a full validator run: **94/94 EDIT.wav files pass
across every module in the repository**, including 1, 4, and 6. Left
untouched — messy but not broken, and out of scope for the task that found
it.

---

## 1. Listen Mode audio — measured, module by module

Source of truth for raw per-batch durations:
`docs/course-audit/listen-mode/tts-final/GENERATION-LOG.json` (97 real
ElevenLabs generation entries), cross-checked against each module's own
`docs/course-audit/listen-mode/tts-final/module-NN/manifest.json`. One gap
found: **Module 5's final-pass entries are absent from `GENERATION-LOG.json`
entirely** — its real per-batch durations live only inside
`module-05/manifest.json`'s embedded `generation` blocks. This is itself a
documentation gap worth closing before publish (see §7).

A first full draft pass (71 batches, "AA raw" generation) was run across
**all 13 modules** Sept 13–15, 2026 (see
`docs/course-audit/listen-mode/tts-final/RESUME.md` and
`ALL-MODULES-MANIFEST.json`). Modules 1, 4, and 6 then went through a second
"strict-fidelity rebuild" pass (`01v6`, `04v6`, module "06" tagged
`pass: "v2-strict-fidelity"` in the log) after a content-fidelity audit found
issues in the first draft; Module 5's rebuild (`v2-strict-fidelity`) is
documented only in its own manifest, not the top-level log. The **original
draft-pass batches for 1/4/6 are superseded** (archived under each module's
`archive-loose-v1/`) and are not counted below.

| Module | Status | Duration | Source |
|---|---|---|---|
| 0 — Welcome | PENDING FINAL AUDIO | — | No fidelity-rebuild pass; see draft note below |
| 1 | Most-current rebuild pass measured (not yet confirmed live — see §0) | **ACTUAL MEASURED: 1032.72s = 17m 12.7s** | `GENERATION-LOG.json`, module `"01v6"`, 6 batches (A1–C1), sum of `durationSecs`, all `status:"ok"` |
| — Module 1, separately: currently-**live** production audio | ACTUAL MEASURED (different recording, in production today) | **1133.66s = 18m 53.7s** | `docs/course-audit/listen-mode/module-01-pass2-raw-sessions-v2-production-log.md` — `module-01-session-a.mp3` 708.05s + `module-01-session-b.mp3` 425.61s; matches `qaStatus:'APPROVED'` ×14 in `assets/js/aimt-listen-mode-data.js` |
| 2 | PENDING FINAL AUDIO | — | No fidelity-rebuild pass; see draft note below |
| 3 | PENDING FINAL AUDIO | — | No fidelity-rebuild pass; see draft note below |
| 4 | Most-current rebuild pass measured (not yet confirmed live) | **ACTUAL MEASURED: 1742.96s = 29m 3.0s** | `GENERATION-LOG.json`, module `"04v6"`, 9 batches (A1–C1), `pass:"v6-strict-fidelity"`, real `costUsd`/`fileBytes`/`generationId` per batch (no explicit `status` key, but all fields indicate a completed real generation) |
| 5 | Most-current rebuild pass measured (owner audio review explicitly PENDING) | **ACTUAL MEASURED: 1813.002s = 30m 13.0s** | `docs/course-audit/listen-mode/tts-final/module-05/manifest.json`, `generationSummary.totalDurationSecs` (11 batches, `version:"v2-strict-fidelity"`); same file sets `ownerAudioReviewPending: true` |
| 6 | Most-current rebuild pass measured (not yet confirmed live) | **ACTUAL MEASURED: 1481.20s = 24m 41.2s** | `GENERATION-LOG.json`, module `"06"` entries tagged `pass:"v2-strict-fidelity"` (11 batches: A1–A5, B1–B5, C1) — distinct from the 6 earlier, superseded `"06"` entries with no `pass` tag |
| 7 | **Owner-approved** (2026-09-17), most-current rebuild pass measured (not yet confirmed live in production) | **ACTUAL MEASURED: 1074.964s = 17m 55.0s** | `GENERATION-LOG.json`, module `"07"` entries tagged `pass:"v2-strict-fidelity"` (7 batches: A1–A5, B1, C1) — reconstructed 2026-09-17 from the current `*-EDIT.wav` files (decoded duration) and Module 7's own final owner-review report (cost); the log previously carried 4 stale entries matching the archived, rejected v1 audio, now annotated and superseded — see §0 |
| 8 | **Generated, awaiting owner review** — NOT yet owner-approved | **ACTUAL MEASURED: 2374.4s = 39m 34.4s** | `GENERATION-LOG.json`, module `"08"` entries tagged `pass:"v2-strict-fidelity"` (14 batches: A1–A11, B1, B2, C1), logged in real time during generation with real `generationId`/`sessionId`/`costUsd` per batch |
| 9 | PENDING FINAL AUDIO | — | No fidelity-rebuild pass; see draft note below |
| 10 | PENDING FINAL AUDIO | — | No fidelity-rebuild pass; see draft note below |
| 11 | PENDING FINAL AUDIO | — | No fidelity-rebuild pass; see draft note below |
| 12 | PENDING FINAL AUDIO | — | No fidelity-rebuild pass; see draft note below |

**Draft/unreviewed audio exists for the PENDING modules** (real ElevenLabs
output from the same Sept 13–15 first pass, but never fidelity-audited,
never rebuilt, not wired into the live course, explicitly **not** counted
toward any "final" total per the task's instruction not to treat pending
modules as done). Reported here only because it is real, measured data and
the task asked for full transparency about what's known:

| Module | Draft duration (ACTUAL MEASURED, unreviewed) | Source |
|---|---|---|
| 0 — Welcome | 1092.64s = 18m 12.6s | `GENERATION-LOG.json`, module `"00"`, 6 batches |
| 2 | 894.72s = 14m 54.7s | `GENERATION-LOG.json`, module `"02"`, 5 batches |
| 3 | 1196.16s = 19m 56.2s | `GENERATION-LOG.json`, module `"03"`, 6 batches |
| 9 | 816.32s = 13m 36.3s | `GENERATION-LOG.json`, module `"09"`, 6 batches |
| 10 | 947.68s = 15m 47.7s | `GENERATION-LOG.json`, module `"10"`, 6 batches |
| 11 | 858.24s = 14m 18.2s | `GENERATION-LOG.json`, module `"11"`, 6 batches |
| 12 | 278.40s = 4m 38.4s | `GENERATION-LOG.json`, module `"12"`, 1 batch |

Do not sum these draft rows into any publishable total — they are
unreviewed, pre-fidelity-audit recordings that may be re-cut, re-scripted,
or discarded, exactly like the now-superseded original 1/4/6 drafts were.

---

## 2. Required hosted video — measured structure, unknown duration

Searched `headspa-mastery.html` for `STEP_VIDEO_IDS`, `vimeo`, `<iframe>`,
`<video>`, and `.mp4`. Result: **only two places in the entire course embed
a required hosted video.**

1. **Welcome Module** — one Vimeo embed, hardcoded iframe at
   `headspa-mastery.html:6963`, video ID `1226441055` ("AIMT Head Spa
   Certification — Welcome Module opening video").
2. **Module 8** — nine Vimeo videos via `STEP_VIDEO_IDS`
   (`headspa-mastery.html:14171-14181`). The code comment at line 14164-14169
   states these are the "owner-authoritative final sequence... All 9 now
   have real footage" (most recently Video 01, added September 2026). IDs:
   `1226438466`, `1214280975`, `1213974160`, `1213975936`, `1213972891`,
   `1213970537`, `1214855873`, `1214959378`, `1214960268` (Videos 01–09,
   opening rituals through final rinse/close).

No other module (0 excepted for its one video, 1–7, 9–12) contains any
`<iframe>`, `<video>`, Vimeo reference, or `.mp4` reference.

**Duration: UNKNOWN — requires owner/Vimeo-dashboard lookup, confirmed
2026-09-17 that it cannot be obtained any other way.** No cached duration,
runtime metadata, or Vimeo API response is stored anywhere in this
repository for any of the 10 required videos.

**Attempted 2026-09-17:** queried Vimeo's public oEmbed endpoint
(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/<id>`) directly
for the Welcome video (`1226441055`) and Module 8's Video 01
(`1226438466`) as a sample. Both returned `"domain_status_code": 403` with
no `duration`, `title`, or `description` field present at all — Vimeo
deliberately withholds this metadata for domain-restricted videos when the
request doesn't originate from the whitelisted embed domain
(`aimtrichology.com`). This is the owner's own privacy/embed-restriction
setting working as intended for paid course content, not a bug or a gap to
route around — no attempt was made to spoof a referrer or otherwise
circumvent it. Same result expected for all 10 videos (only 2 of 10 tested,
to avoid redundant calls once the systematic pattern was confirmed). Do not
estimate a duration in its place; the only reliable path is the owner's own
Vimeo dashboard (which sees full metadata for videos on their own account,
domain restriction notwithstanding) or the owner explicitly supplying the
runtimes.

One easily-confused adjacent number, explicitly **excluded** from this
figure: Module 8's UI shows pacing pills like "Core: ~45 min left" /
"Extended: ~75 min left" (`headspa-mastery.html:8945`, and per-chapter
`tCore`/`tExtended` fields at `headspa-mastery.html:14209` onward), and the
sales copy states "Core 60-minute and Extended 90-minute reference formats"
(`headspa-mastery.html:4099`). **This is a real-world head-spa-service
timing reference for the AIMT Service Timer tool** (a live countdown a
practitioner runs during an actual client appointment), not a measurement of
how long the nine training videos take to watch. Do not conflate the two.

---

## 3. Required checkpoints per module — measured

Directly knowable and fully authoritative:
`headspa-mastery.html:10503-10529`, the `MODULE_CHECKPOINTS` object (also
mirrored by the 22 real `class="checkpoint cc-card" id="..."` DOM elements
found in the file, plus one `aria-hidden="true"` decorative example with no
`id` in the "how checkpoints work" explainer section — that one is not
real/gating and is excluded from the count).

```
MODULE_CHECKPOINTS = {
  '0':  ['m0cp1'],                    // 1
  '1':  ['m1cp1', 'm1cp2'],           // 2
  '2':  ['m2cp1'],                    // 1
  '3':  ['cp1', 'cp2'],               // 2
  '4':  ['m4cp1', 'm4cp2'],           // 2
  '5':  ['m5cp1', 'm5cp2'],           // 2
  '6':  ['m6cp1', 'm6cp2'],           // 2
  '7':  ['m7cp1', 'm7cp2'],           // 2
  '8':  ['m8cp1', 'm8cp2'],           // 2
  '9':  ['m10cp1', 'm10cp2'],         // 2 (Checkout/Pricing content — historically named "m10")
  '10': ['m9cp1', 'm9cp2'],           // 2 (Sanitation/Reset content — historically named "m9")
  '11': ['m11cp1', 'm11cp2'],         // 2
  '12': []                            // 0 (Final Certification Assessment — not checkpoint-gated)
}
```
**ACTUAL MEASURED total: 22 required checkpoints across the course.**

Note on IDs: `headspa-mastery.html:10513-10527` documents a course-audit-build
Module 9↔10 content reorder — checkpoint ID strings keep their historical
`m9`/`m10` prefixes even though the *slot* numbering changed. The counts
above are already reconciled to the current live slot numbering.

---

## 4. Checkpoint-response allowance — ESTIMATED

**This section is an estimate, not measured data.** Reasoning:

- Every checkpoint follows the same real, measured UI pattern: a `textarea`
  prompt plus a `voice-btn` (`headspa-mastery.html`, e.g. lines 6000, 6241,
  6598, 6926, 7233, 7497, 7588, 7900, 8182, 8360, 8774, 8797, 9122, 9249,
  and the module-9/10/11 equivalents) wired to `startVoice('<id>In', this)`
  — **voice input is offered as an alternative to typing at every single
  checkpoint** (24 `voice-btn`/`startVoice` occurrences found — the 22 real
  checkpoints plus 2 extra I did not further trace, likely template/demo
  markup). This matters for the estimate: voice answers are typically faster
  to produce than typed ones for open-ended reasoning.
- Checkpoint prompts are open-ended, reasoning-style questions, not
  multiple-choice — e.g. "Explain how you would adapt the service by region,
  and the whole-scalp mistake you're avoiding…" (`m5cp1`), "Walk through
  your reset — what you contain, clean, disinfect, restock, and never
  shorten..." (`m9cp1`/slot 10), "Your menu — what each service includes,
  its price, and your cost/time reasoning..." (`m10cp1`/slot 9). These read
  as expecting roughly a paragraph (a few sentences) of reasoning, not a
  one-line answer.
- The product's own explainer copy (`headspa-mastery.html:5053`) states
  Cadence evaluates the response and "if something's missing, it asks a
  focused follow-up rather than starting you over" — meaning a checkpoint
  is not always a single exchange; some fraction of attempts will involve at
  least one additional round before passing.

**Estimated allowance: 3–6 minutes per checkpoint**, accounting for reading
the prompt (~15–30s), composing a several-sentence typed or spoken response
(~1.5–3 min), and Cadence's evaluation/possible one-round follow-up
(~1–2.5 min). At 22 required checkpoints, that is **≈66–132 minutes
(1.1–2.2 hours)** of estimated checkpoint time course-wide. This is a
judgment call, not a measurement — a real number would require timing actual
students.

---

## 5. Module 12 — Final Certification Assessment

**Real, measured structure** (not the marketing-copy version — pulled
directly from the server-authoritative config and content bank, which is
what actually gates a passing attempt):

- `functions/_lib/certification/assessment-config.mjs` — three parts,
  independently gated (not averaged together):
  - **Part I — Knowledge & Retention**: `targetCount: 40` questions per
    attempt, drawn from a real installed bank of **120** multiple-choice
    items (`functions/_lib/certification/content-bank.mjs`,
    `knowledgeBank`, 120 top-level `id` entries counted directly, IDs
    `M01-001` etc.), `minPerModule: 1` across required modules 1–11,
    weight 0.5, minimum pass 75%.
  - **Part II — Applied Practitioner Cases**: `targetCount: 4` cases per
    attempt, from a real bank of **12** (`content-bank.mjs`, `caseBank`,
    top-level IDs `CASE-01`…`CASE-12`). Each case has multiple parts (seen
    directly in `CASE-01`: a multi-select item plus a structured
    short-response item scored against an 8-point rubric asking for
    "3–5 sentences"). Weight 0.3, minimum pass 75%.
  - **Part III — Practitioner Conversation with Cadence**: `targetCount: 3`
    conversations per attempt, from a real bank of **9**
    (`content-bank.mjs`, `interviewBank`, top-level IDs `INT-01`…`INT-09`),
    `typicalCriteriaPerConversation: 5`, `maxFollowUpsPerConversation: 1`.
    Weight 0.2, minimum pass 80%.
  - **Overall minimum: 80%**, gates independent (all three must individually
    pass, not just the weighted average).
  - `bankVersion: 'headspa-fe-bank-v1-2026-08-26'` and
    `content-bank.mjs`'s own `CONTENT_STATUS = 'INSTALLED'` — the production
    content bank is real and installed, not placeholder/pending, as of this
    check.
- **Untimed, confirmed directly in code**: `assets/js/module12-certification.js:42`
  — literal copy string `'Take your time. There is no countdown clock.'`
  There is no time-limit/duration config anywhere in
  `functions/api/certification/*.js` or `assets/js/module12-certification.js`
  (searched for `timeLimit`, `duration`, `countdown`, `deadline` — the only
  hit is the "no countdown clock" copy itself).

**Estimated completion-time allowance (ESTIMATED, not measured):**
reasoning from the measured structure above — 40 multiple-choice knowledge
questions at roughly 30–60s each (reading + choosing) ≈ 20–40 min; 4
multi-part applied cases combining a multi-select item and a 3–5-sentence
written response each, more involved than a single MC question, at roughly
6–12 min each ≈ 24–48 min; 3 Cadence practitioner conversations (~5 rubric
criteria each, up to 1 follow-up per conversation) at roughly 6–15 min each
≈ 18–45 min. **Estimated total: 60–130 minutes (1–2.2 hours)** for a single
attempt at typical pace. This does not account for remediation between
attempts (`attemptRules` in the same config define a remediation-then-
educator-authorization ladder starting at attempt 3) — a retake is a
realistic outcome for some students and would add materially more time, but
is out of scope for a single "completion" estimate.

---

## 6. Other required (gating) interactive time

**Finding: none beyond the 22 checkpoints already counted in §3.**

The course contains several other interactive elements — "Practice"
exercises (two-option compare-and-explain, e.g. `m0PracticeInteraction`,
`m1LineInteraction`, `m3TimingInteraction`), a drag slider
(`#spectrumSlider`, Module 6, "Malassezia to seborrheic dermatitis
spectrum"), and "Signature interaction" sort/triage exercises (e.g. Module
6's "Sort three presentations," Module 7's "visual judgment cards"). All of
these are **explicitly, verifiably ungraded and non-gating**:

- Product copy directly above the first Practice/Cadence-Check pair states
  the distinction plainly: "Practice — Ungraded... Practice never writes
  completion progress; it's there to reinforce, not to test," versus
  "Cadence Check — Required... Passing contributes to that module's
  completion requirement." (`headspa-mastery.html:5032-5053`)
- The Module 6 sort interaction's own code comment confirms this in the
  implementation: `"Sort three presentations" — new signature interaction
  (ungraded, retryable triage decision). Does not touch APP_STATE, progress,
  checkpoints, or completion.` (`headspa-mastery.html:12491-12493`)

Because none of these gate progress or are required to complete a module,
they add **no required seat time** by definition, even though a genuinely
engaged student would likely spend some voluntary time on them. Not
counted, per the task's instruction not to invent categories that aren't
actually required.

---

## 7. Total measured runtime currently known

Two honest ways to sum "final" Listen Mode audio, both given so nothing is
hidden (see §0 for why there are two):

**(a) Currently live, student-facing today:** Module 1 only — **18m 53.7s**
(1133.66s). Every other module has zero Listen Mode audio wired into
`assets/js/aimt-listen-mode-data.js` right now.

**(b) Most-current regenerated pass for the 5 owner-approved modules (1, 4,
5, 6, 7), per §1** — sum of `01v6` + `04v6` + `05` (`v2-strict-fidelity`) +
`06` (`v2-strict-fidelity`) + `07` (`v2-strict-fidelity`):

```
1032.72 + 1742.96 + 1813.002 + 1481.20 + 1074.964 = 7144.846s = 119m 4.8s ≈ 1h 59m 5s
```

**(c) (b) plus Module 8, generated but explicitly NOT yet owner-approved** —
included separately so it is never silently counted as part of the
approved total:

```
7144.846 + 2374.4 = 9519.246s = 158m 39.2s ≈ 2h 38m 39s (owner-approved + pending-review combined)
```

Neither (a), (b), nor (c) is "the" answer — (a) is what a student actually
experiences today; (b) is the owner-approved-but-not-yet-live audio for
those 5 modules; (c) additionally includes Module 8's real measured
duration while making clear it has not received owner approval yet. **Video
runtime is entirely unknown (§2). Checkpoint and Module 12 time are
estimates only, not measurements (§4, §5). Modules 0, 2, 3, 9–12 have no
final Listen Mode audio at all (§1).**

There is currently **no module, and no combination of modules, for which
every seat-time category (audio + video + checkpoints + assessment) is
simultaneously both complete and fully measured.** A defensible whole-course
"X hours" figure cannot be built from measured data alone today.

### Everything still unknown or pending, and what closes each gap

| Gap | What's needed |
|---|---|
| Modules 0, 2, 3, 9, 10, 11, 12 Listen Mode audio | Run each through the same content fidelity-coverage audit already done for 1/4/5/6/7, regenerate if needed, get explicit owner audio sign-off, wire into `assets/js/aimt-listen-mode-data.js`. |
| Module 8 Listen Mode audio — owner review and approval | Generated 2026-09-16 (39m 34.4s, §1) but explicitly not yet reviewed/approved by the owner — same next step 1/4/5/6/7 already went through. |
| Modules 1, 4, 5, 6, 7 Listen Mode audio — owner sign-off on the actual regenerated audio, then production wiring | Owner needs to review the CapCut-processed output (`AIMT-Listen-Mode-Final/MASTER-CAPCUT-WORKLIST.md` exists as the next-step worklist) and explicitly confirm before any of it is cut into player chunks or wired into `assets/js/aimt-listen-mode-data.js`; Module 5's manifest still flags its audio review as outstanding even though its script/content passed audit. |
| Module 5's `GENERATION-LOG.json` entries are stale (match archived v1 audio, not the approved v2 audio) | Same class of bookkeeping defect just repaired for Module 7 (§0) — not fixed here, out of scope for the task that produced this note. A future pass can reuse the same reconstruction method: decode real durations from the current `*-EDIT.wav` files, cross-reference `module-05/manifest.json` for chars, annotate the stale entries rather than deleting them. |
| Welcome Module video duration (1 video) | Vimeo dashboard lookup (video ID `1226441055`) or owner-supplied runtime. |
| Module 8 video durations (9 videos) | Vimeo dashboard lookup (video IDs listed in §2) or owner-supplied runtimes. |
| Checkpoint response time (22 checkpoints) | Currently an estimate (§4); real data would require timing actual students/beta testers. |
| Module 12 completion time | Currently an estimate (§5); real data would require timing actual attempts (all three parts, including realistic retake scenarios per the attempt ladder). |

### Provisional range (NOT for publication — internal planning only)

Built only from what's measured today plus the clearly-labeled rough
estimates above; explicitly not a claim anyone should put on the buy page:

- **Audio (using the live-today figure, (a) above):** 18m 53.7s **measured**
  for Module 1 + **PENDING** for the other 12 modules — i.e. audio alone is
  not yet a complete, measurable number for the whole course.
- **Audio (using the owner-approved-regen figure, (b) above, for reference):**
  ≈1h 59m measured across 5 of 13 modules (1/4/5/6/7), + PENDING for the
  other 8.
- **Audio (additionally including Module 8, generated but not yet
  owner-approved — (c) above):** ≈2h 39m measured across 6 of 13 modules,
  + PENDING for the other 7.
- **Video:** UNKNOWN (10 required videos, 0 with known duration).
- **Checkpoints:** ≈1.1–2.2 hours, ESTIMATED (22 checkpoints × 3–6 min).
- **Module 12:** ≈1.0–2.2 hours, ESTIMATED.

Rough illustrative floor-to-ceiling, **only if** every pending module's
audio eventually lands somewhere in the same 15–30-minute range the four
completed modules did (an assumption, explicitly not evidence — modules
vary in length and this is not a substitute for measuring the rest), plus
video treated as a placeholder 60–90 minutes based on the Module 8 Core/
Extended service-length reference (again, an assumption about video length,
not a measurement — see §2's explicit warning not to conflate service
pacing with video runtime): course total would land very roughly in a
**5–8 hour range**. This range is intentionally wide and should not be
narrowed, refined, or published until the real gaps below are closed.

### What must be finalized before AIMT can responsibly publish an "approximately X hours" claim

1. Final, owner-approved Listen Mode audio for all 13 modules (currently 0
   of 13 fully live; at most 4 of 13 have real-but-unconfirmed rebuild
   audio; Module 1's live audio is a different, older take than the newest
   measured one).
2. Actual runtime for all 10 required hosted videos (Welcome + Module 8's
   nine chapters) — a Vimeo dashboard lookup, not something derivable from
   this repository.
3. Either real observed checkpoint-completion timing from students/beta
   testers, or an owner-reviewed and explicitly-labeled estimate standing in
   for it.
4. Either real observed Module 12 attempt timing, or an owner-reviewed and
   explicitly-labeled estimate standing in for it — ideally accounting for
   the realistic chance of a remediation/retake cycle.
5. A decision on which "kind" of number the claim represents (e.g. median
   first-pass completion vs. a generous top-end) once real data exists, so
   the eventual number is defensible against student and regulatory
   scrutiny, not just internally consistent.
