# Module 1 — Pass 2 Raw Sessions v2 Production Log

**Status:** Raw continuous sessions generated and technically verified. CapCut
masters prepared. **Not yet installed as canonical student audio** — this
run stops here per the task's own instruction (owner CapCut pass comes
next). Historical v1 raw evidence (`assets/audio/listen/headspa-mastery/
module-01/raw/*.mp3`, 14 files) is untouched.

Source script: `module-01-listen-script-draft.md` (v5, "PASS 1 OF 2"),
unmodified during generation — no rewriting/reinterpretation.

## Generation model change

Retired "one player chunk = one ElevenLabs generation." Two continuous
performances were the goal; the connector's `eleven_v3` node enforces a hard
**5,000-character-per-call limit**, discovered via two real failed attempts
(both rejected before any audio was produced — no charge, per the provider's
own accounting). Both sessions exceed that cap, so each was split into the
minimum number of sub-5,000-char pieces, cut only at already-planned
`[short pause]`/`[pause]` section-transition points (owner-approved
adjustment: never balance-optimized, checkpoint boundaries preserved as the
strongest seams). The two deliverable files are still single continuous
audio files — concatenated via `ffmpeg -c copy` (stream copy, no
re-encoding) from the pieces below, so no re-generation or re-encoding
artifact was introduced at the seams.

Voice: **Jane — Bright, Smooth and Friendly** (`Y3ZPRGOSIxbV4Rbb3WiA`).
Model: **eleven_v3**. Same voice/model for every piece — 5 independent
`eleven_v3` generations total (not the originally planned 2), all same
voice, all same source-of-truth script, all in one connector flow
(`LWDGa7tRkqYLL61ozfRj`).

Tag convention reused verbatim from the proven v1 production text
(`docs/course-audit/listen-mode/tts/module-01/*.txt`), not invented: the
v5 doc's editorial-shorthand tags (`[WARM]`, `[EMPHASIZE]`, `[SLOW
SLIGHTLY]`, `[SHORT PAUSE]`, `[LET THIS LAND]`) map to the lowercase
eleven_v3 tags already proven safe for this voice (`[warmly]`, `[firmly]`,
`[slowly]`, `[short pause]`, `[pause]`); production-only annotations
(`[VISUAL CUE]`, `[CHECKPOINT STOP — PLAYBACK PAUSES]`, `[PLAY ONLY AFTER
AUTHORITATIVE CHECKPOINT PASS]`) were stripped entirely, never sent to the
model, matching the same precedent.

## Pieces generated (all `eleven_v3`, voice `Y3ZPRGOSIxbV4Rbb3WiA`)

| Piece | Content | Chars | Duration | Credits | Cost | Generation ID |
|---|---|---:|---:|---:|---:|---|
| A1 | Opening + Section 1.1 | 2,051 | 164.40s | 2,050 | $0.338 | `gN0KmWpHHtD58p1nxdGV` |
| A2 | Section 1.2 + Section 1.3 | 3,594 | 274.32s | 3,593 | $0.593 | `h1yT7GpbZCQuADW5u2BM` |
| A3 | Section 1.4 + practice + checkpoint 1 prompt | 3,560 | 269.20s | 3,559 | $0.587 | `4od5PLDqIU2QcLXxuRrL` |
| B1 | (M1-08) + Sections 1.5–1.8 | 3,716 | 320.24s | 3,715 | $0.613 | `SBty5PkryIBpSIAtla6E` |
| B2 | checkpoint 2 prompt + closing recap | 1,302 | 105.28s | 1,301 | $0.215 | `is8FGpI3J3CzFzMaGJn3` |
| **Total** | | **14,223** | **1,133.44s** | **14,218** | **$2.346** | |

Generation timestamp: 2026-08-31 ~15:13–15:16 UTC. Flow:
https://elevenlabs.io/app/flows/LWDGa7tRkqYLL61ozfRj

## Assembled continuous sessions

| File | Content | Duration | SHA-256 |
|---|---|---:|---|
| `module-01-session-a.mp3` | Opening → 1.1 → 1.2 → 1.3 → 1.4 → practice → checkpoint 1 prompt | 11:48.05 (708.05s) | `69ef0f3d07c46c16b2505dea85611949a91850f4be29883474dd21bc36f8be0c` |
| `module-01-session-b.mp3` | (M1-08) → 1.5 → 1.6 → 1.7 → 1.8 → checkpoint 2 prompt → recap/handoff | 7:05.61 (425.61s) | `2238819eef9bb4994f416020b34c54b7f9bf3ab8dfab050fc0f97b1b1ff36311` |

Both under CapCut's 15:00 Enhance Voice limit with comfortable margin.
Source text SHA-256 (the exact concatenated prompt text per session, before
the forced 5-piece split): Session A
`8796009f229bcb9caaf3102e4c4fdcdc7601281d2eb29509c6dde232748ece9e`; Session B
`6e9d0d391183e6eae72fe77175c05ab5a536d6cd2ba6aaadab91c9151c93191b`.

Installed at:
`assets/audio/listen/headspa-mastery/module-01/raw-sessions-v2/module-01-session-a.mp3`
`assets/audio/listen/headspa-mastery/module-01/raw-sessions-v2/module-01-session-b.mp3`

## Technical quality gate (Section 8)

- Full decode integrity check (`ffmpeg -v error -f null -`): clean, zero
  errors, both files.
- Duration: matches provider-reported per-piece durations to within
  fractions of a second after concatenation; both totals land close to the
  task's own estimate (Session A ~11.5–12 min target → 11:48 actual;
  Session B ~6–6.5 min target → 7:06 actual, the difference explained by
  the v4/v5 content growth — see the script doc's own revision history for
  M1-04/M1-05's word-count increases).
- Tail check: last 2.5s of each session measured at real speech level
  (max ~-7.5dB / -4.6dB, not silence), confirming a natural trailing pause
  after genuine spoken content — not a mid-word cutoff.
- No retry was needed — both technical-failure retries were consumed by the
  5,000-char rejections (a deterministic, not flaky, failure), so per
  Section 8's "retry once with identical settings" only applies to genuine
  provider flakiness, which did not occur here.

## Natural player-cut map (Section 10, position-anchored matching)

Anchors computed from known piece-boundary timestamps (exact — real API
call boundaries) plus character-offset-based estimates within each piece
for internal boundaries, matched against real detected silences
(`ffmpeg silencedetect`, -35dB / ≥0.6s). Every anchor found a genuine,
substantial silence nearby — none required a hard-stop as ambiguous.

| # | Session | Boundary | Type | Timestamp | Silence | Confidence |
|---|---|---|---|---:|---|---|
| 1 | A | before Section 1.1 | section (internal) | 78.6s | 78.39–79.08s (0.69s) | HIGH |
| 2 | A | before Section 1.2 | section (piece cut) | 164.4s | 165.74–166.37s (0.64s) | HIGH |
| 3 | A | before Section 1.3 | section (internal) | 263.2s | 263.64–264.46s (0.82s) | HIGH |
| 4 | A | before Section 1.4 | section (piece cut) | 438.7s | 442.26–443.55s (1.29s) | MEDIUM |
| 5 | A | before practice interaction | teaching-transition (internal) | 540.4s | 536.45–537.13s (0.68s) | MEDIUM |
| 6 | A | before checkpoint 1 prompt | checkpoint (internal) | 670.8s | 672.65–674.30s (1.65s) | HIGH |
| 7 | B | before Section 1.5 | section (internal) | 26.5s | 26.73–27.33s (0.60s) | HIGH |
| 8 | B | before Section 1.6 | section (internal) | 102.8s | 100.81–102.68s (1.87s) | HIGH |
| 9 | B | before Section 1.7 | section (internal) | 151.5s | 152.52–154.45s (1.94s) | HIGH |
| 10 | B | before Section 1.8 | section (internal) | 229.1s | 229.57–231.11s (1.53s) | HIGH |
| 11 | B | before checkpoint 2 prompt | checkpoint (piece cut) | 320.2s | 318.98–319.89s (0.91s) | HIGH |

No mid-word/mid-sentence cuts anywhere in this map — every candidate sits at
a genuine paragraph-break pause, verified against the exact script text.
The two MEDIUM-confidence matches (#4, #5) are still unambiguous single
matches within the search window — the offset is larger only because
Section 1.3's `[slowly]`-tagged delivery runs slower than this map's
linear per-character pacing estimate, not because of any competing nearby
candidate.

**Player-segment proposal deferred to the post-CapCut installation step**
(Section 15) — this map documents where natural cuts *could* land; how many
technical player files Module 1 ends up with is explicitly not sacred
(Section 16) and will be proposed once the CapCut-processed FLACs are back
and the M1-08/1.5 merge decision's downstream effect on `resumeAfterPass`
gating is worked through against the real course-progress checkpoint 1 flow.

## CapCut-ready masters (Section 12)

Converted to lossless PCM (44.1kHz, mono, 16-bit) via `ffmpeg -c:a
pcm_s16le` — pure format conversion only, no EQ/loudness/dynamics/timing
touched:

- `module-01-session-a-capcut.wav` (11:48.00, 62,446,110 bytes)
- `module-01-session-b-capcut.wav` (7:05.57, 37,535,118 bytes)

Both at `assets/audio/listen/headspa-mastery/module-01/raw-sessions-v2/`.
**Not committed to git** — same "reproducible local production artifact,
not permanent history" treatment as the existing
`docs/course-audit/listen-mode/capcut-production/**/*.wav` gitignore rule
(would add ~95MB combined to history for files that get replaced by the
processed FLACs and eventually the canonical MP3s). The two raw session
MP3s are left as local working files for now too, pending the owner's
decision on when to commit — see the run's final report.

## R2 backup status (Section 17)

**Pending — R2 S3-compatible credentials
(`R2_ACCOUNT_ID`/`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`) are not set in
this environment**, so `scripts/aimt-media-backup.mjs` cannot run. No local
files were deleted or overwritten as a result — the v1 raw evidence and
the new raw-sessions-v2 files are both intact locally. (A separate
Cloudflare account connector does have general access to the same
`aimt-media-archive` R2 bucket, but the project's own checksummed
snapshot/restore-verification backup script needs the S3-compatible keys
specifically — using the general connector to upload ad hoc would skip that
verification, so this log does not attempt that as a substitute.)
