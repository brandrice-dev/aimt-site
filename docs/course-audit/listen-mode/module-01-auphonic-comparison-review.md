# Module 1 — RAW vs. FFmpeg vs. Auphonic (A/B/C review)

**Status:** Evidence for the owner to review. **No winner has been chosen.**
Nothing is committed. Nothing in `assets/audio/listen/headspa-mastery/module-01/m1-04.mp3`
(the canonical production file) has changed — it's still the untouched raw
ElevenLabs generation, same as it's been since the first audio pilot.

This is the third and final leg of the M1-04 finishing comparison: RAW
ElevenLabs → the FFmpeg de-ess/loudnorm test → now Auphonic's Voice AutoEQ.
All three exist so the owner can pick the production finishing standard
before any of Module 1's remaining 9 chunks are generated.

---

## The three files

| | Path | Note |
|---|---|---|
| **A — RAW ElevenLabs** | `assets/audio/listen/headspa-mastery/module-01/raw/m1-04.mp3` | Untouched generation, byte-identical to the canonical production file |
| **B — Current FFmpeg finish** | `docs/course-audit/listen-mode/tts/module-01/finishing-test/m1-04-finished-test.mp3` | `deesser=i=0.22:m=0.4:f=0.5` + two-pass `loudnorm=I=-18:LRA=7:TP=-2` (see `module-01-audio-finishing-review.md`) |
| **C — Auphonic Voice AutoEQ** | `docs/course-audit/listen-mode/tts/module-01/auphonic-test/m1-04-auphonic-autoeq-test.mp3` | See settings and the duration caveat below |

## Open with:

```bash
open "assets/audio/listen/headspa-mastery/module-01/raw/m1-04.mp3"
open "docs/course-audit/listen-mode/tts/module-01/finishing-test/m1-04-finished-test.mp3"
open "docs/course-audit/listen-mode/tts/module-01/auphonic-test/m1-04-auphonic-autoeq-test.mp3"
```

---

## ⚠️ Read before listening to C: likely free-tier jingle

Auphonic reported the finished file's duration as **158.9 seconds** — about
**12.8 seconds longer** than the 146.08-second source. This account is on
Auphonic's free tier (2.0 recurring credits/hours). Auphonic's own
production statistics (from its built-in speech/music classifier — not a
transcription or speech-recognition pass; none was run, per instruction)
report the *detected spoken content* running from **6.4s to 152.4s** — a
146.0-second span that matches the source almost exactly — implying roughly
6.4 seconds of non-speech content before the narration starts and another
~6.5 seconds after it ends. That combination (free tier + extra bookending
audio matching Auphonic's own public "unbranded output requires a paid
plan" policy) is consistent with an appended intro/outro jingle, but this
was **not confirmed by listening or transcription** — only inferred from
duration and Auphonic's own classifier metadata. **Judge the actual Cadence
narration in the middle of the file; the first/last several seconds may not
be Jane at all.**

If the owner picks Auphonic as the standard, this jingle (if it's what it
appears to be) would need to be resolved — either an Auphonic plan upgrade,
or an automated trim step using the reported speech boundaries — before any
real batch use. See "Automation feasibility" below.

---

## Auphonic settings used (Test C)

Created via Auphonic's official REST API (`https://auphonic.com/api/`),
authenticated with `Authorization: Bearer <AUPHONIC_API_KEY>`. Exact
algorithm parameters sent, and confirmed by the API's own echo of what it
stored:

```json
{
  "filtering": true,
  "filtermethod": "autoeq",
  "leveler": true,
  "compressor_speech": "soft",
  "normloudness": true,
  "loudnesstarget": -18,
  "maxpeak": -2,
  "loudnessmethod": "dialog",
  "denoise": false,
  "deverbamount": 0,
  "debreathamount": -1,
  "silence_cutter": false,
  "filler_cutter": false,
  "cough_cutter": false,
  "music_cutter": false
}
```

- `filtermethod: "autoeq"` is Auphonic's literal name for Voice AutoEQ —
  confirmed via their published OpenAPI spec
  (`https://auphonic.com/help/openapi.yaml`), which documents it as one of
  four mutually-exclusive filter methods (`hipfilter` / `autoeq` / `bwe`
  bandwidth-extension / `studiovoice`) — so choosing `autoeq` already
  excludes Studio Voice and bandwidth extension by construction, not by a
  separate off-switch.
- `loudnessmethod: "dialog"` measures dialog/voice loudness specifically
  (vs. the default `"program"` full-mix measurement) — the more
  appropriate choice for solo narration, exactly as requested.
- `compressor_speech: "soft"` — a deliberate deviation from Auphonic's own
  default (`"auto"`), chosen to stay unambiguously on the gentle end given
  the explicit "no heavy compression" instruction; `"auto"` isn't
  necessarily aggressive, but `"soft"` removes the guesswork.
- Everything in the "keep off" list (noise reduction, dereverb, debreath,
  all four cutters) was left at, or explicitly set to, its off default —
  confirmed off in the API's own echo of the stored production.

## Output facts (recorded from the completed production)

- **Format:** MP3, 44.1kHz, mono, 128kbps — confirmed both via the API's
  `output_files` metadata and independently via `file(1)` on the
  downloaded bytes.
- **Reported duration:** 158.897s (see the jingle note above; source was
  146.08s).
- **Measured loudness:** input −20.26 LUFS → output exactly −18.0 LUFS
  (dead on target). Output true peak: −2.0 dBTP (exactly at the requested
  ceiling, no clipping). Loudness range tightened from 7.3 LU to 5.0 LU —
  a real but moderate change, not the kind of squashing "heavy
  compression" implies.
- **Credits used:** 0.05 (recurring), reported directly in the completed
  production's JSON.

---

## Owner review

Listen to all three, ideally back to back more than once.

1. Which has the least harsh "S"?
2. Does any version create a lisp?
3. Which sounds most natural?
4. Which preserves Jane's brightness?
5. Which sounds most like Cadence?
6. Which has the most comfortable volume?
7. Does Auphonic sound processed, or invisible?
8. Which would you want to hear for 15–30 minutes straight?

**Claude has not chosen a winner.** No file is marked `APPROVED`, the
manifest's M1-04 entry is untouched, and nothing has been committed.

---

## Automation feasibility (Section 6/8 — evaluated against the real API session)

| Question | Result |
|---|---|
| Auth method | `Authorization: Bearer <AUPHONIC_API_KEY>` — simple, confirmed working. No OAuth dance needed for a server-side/scripted flow. |
| Reusable presets via API | Auphonic's API exposes real Preset objects (`/api/presets.json`, `/api/preset/{uuid}.json`) with the same shape as a production's algorithm settings — this session didn't create one (wasn't needed for a single A/B test), but the endpoint existing means the settings above could be saved once and referenced by UUID for every future chunk, rather than re-sent by hand each time. |
| All needed options API-configurable | Yes, confirmed empirically — every setting in Section 3/4 of the task (AutoEQ, loudness target, true-peak ceiling, dialog loudness method, all the "off" toggles) was accepted exactly as specified and echoed back unchanged. |
| Programmatic download | Yes, confirmed — `GET /api/download/audio-result/<uuid>/<file>` 302-redirects to a signed, time-limited object-storage URL; a normal authenticated request following the redirect downloads the real file. |
| Usage/cost exposed | Yes — `used_credits` (recurring/onetime/combined) appears directly in the completed production's own JSON, no separate billing call needed. |
| **Known limitation** | **The free-tier jingle appears to still apply via the API**, not just the web UI — no algorithm field disabled it in this test. If Auphonic becomes the chosen standard, unattended batch automation would need either an Auphonic plan upgrade (to remove branding) or an automated trim step using the `music_speech` boundary timestamps Auphonic already reports — otherwise every chunk would need manual trimming, which defeats the "no manual audio-editor workflow" goal. |

**Bottom line:** technically, yes — `generate → save raw → Auphonic
upload/preset/poll/download → verify → set qaStatus` can run completely
unattended once a preset is locked in, with one open question: whether the
jingle needs a plan upgrade or an automated trim to stay fully hands-off.
Not implemented in this task — evidence and feasibility only, per
instruction.
