# Module 1 — Section Transition Gap Measurements

**Status:** LOCKED, implemented. Owner finding (real listen-through): breathing
room between numbered sections should read as ~4 seconds, consistently — some
transitions currently feel abrupt, one (Opening → 1.1) already reads as a
good pause, "perhaps slightly longer than necessary."

**Rule:** do not blindly add 4s of silence after every chunk. Measure the
natural trailing silence already at the end of the canonical audio file for
the section that just finished, plus the natural leading silence at the start
of the canonical audio file for the section about to begin, and add only the
remaining delay needed to reach the target. Never re-encode or regenerate the
approved v2 CapCut audio to do this — the gap is entirely a player-side
`setTimeout` inserted between the 'ended' event and the next chunk's
`autoplay`, driven by a `transitionGapMs` field on the manifest (see
`assets/js/aimt-listen-mode-data.js` and `assets/js/aimt-listen-mode-player.js`
`advanceAfterGap()`).

## Method

Measured directly against the real, currently-installed canonical mp3s at
`assets/audio/listen/headspa-mastery/module-01/*.mp3` (the v2 continuous-
session/CapCut files) using `ffmpeg`'s `silencedetect` filter
(`noise=-35dB:d=0.15`), resolved from the local `imageio-ffmpeg` Python
package (no system ffmpeg install present in this environment):

```
ffmpeg -i <chunk>.mp3 -af "silencedetect=noise=-35dB:d=0.15" -f null -
```

For each chunk: leading silence = duration of the first `silence_start`→
`silence_end` pair only if it starts at ~0s; trailing silence = duration of
the final silence segment only if it runs to end-of-file (either it has no
matching `silence_end`, meaning silence continued through EOF, or its
`silence_end` lands within 0.25s of the file's total duration).

Cross-check: these per-chunk figures are internally consistent with the
already-documented natural-cut map in
`module-01-pass2-raw-sessions-v2-production-log.md` (e.g. that log's boundary
#2, "before Section 1.2," records a detected silence window of 165.74–166.37s
= 0.64s; this measurement's m1-02 trailing (0.319s) + m1-03 leading (0.319s)
= 0.638s — the same silence window, because the chunk split point was placed
at the center of it, so it's conserved across the two resulting files, just
redistributed).

## Measured values and applied gap

Target is ~4.0s for every transition except Opening → 1.1, which is nudged to
3.6s per the owner's specific "slightly longer than necessary" finding on
that one transition (still inside the locked 3.5–4.5s acceptable range).

| # | Transition | Chunk boundary | Prev trailing | Next leading | Natural gap | Target | Added `transitionGapMs` | Final gap |
|---|---|---|---:|---:|---:|---:|---:|---:|
| 1 | Opening → 1.1 | m1-01 → m1-02 | 0.345s | 0.345s | 0.690s | 3.6s | 2910 | 3.600s |
| 2 | 1.1 → 1.2 | m1-02 → m1-03 | 0.319s | 0.319s | 0.638s | 4.0s | 3362 | 4.000s |
| 3 | 1.2 → 1.3 | m1-03 → m1-04 | 0.406s | 0.406s | 0.812s | 4.0s | 3188 | 4.000s |
| 4 | 1.3 → 1.4 | m1-04 → m1-05 | 0.655s | 0.649s | 1.304s | 4.0s | 2696 | 4.000s |
| 5 | post-checkpoint 1 → 1.5 | m1-08 → m1-09 | 0.524s | 0.518s | 1.042s | 4.0s | 2958 | 4.000s |
| 6 | 1.5 → 1.6 | m1-09 → m1-10 | 1.117s | 1.117s | 2.234s | 4.0s | 1766 | 4.000s |
| 7 | 1.6 → 1.7 | m1-10 → m1-11 | 0.971s | 0.971s | 1.942s | 4.0s | 2058 | 4.000s |
| 8 | 1.7 → 1.8 | m1-11 → m1-12 | 0.901s | 0.901s | 1.802s | 4.0s | 2198 | 4.000s |

## Transitions deliberately NOT given a locked 4s gap

Per the owner's rule, the gap applies only at true numbered-section
transitions — not inside a section, not at practice/checkpoint/recap
boundaries, which have their own semantically appropriate timing:

- **1.4 → Practice** (m1-05 → m1-06): section-to-practice, not
  section-to-section. `transitionGapMs` left at 0 (unchanged/natural).
- **Practice → Checkpoint 1 prompt** (m1-06 → m1-07): ends in
  `awaiting-checkpoint`, not an auto-advance — the checkpoint stop is already
  an indefinite pause governed by competency, per the owner's explicit rule.
  No gap timer applies to this path at all (it never reaches
  `advanceAfterGap`).
- **Checkpoint 1 pass → post-pass continuation** (m1-07 → m1-08): surfaced as
  a manual "Continue Listening" button, not an automatic transition — never
  goes through `advanceAfterGap`.
- **1.8 → Checkpoint 2 prompt** (m1-12 → m1-13): same as Practice →
  Checkpoint 1 — ends in `awaiting-checkpoint`.
- **Checkpoint 2 pass → post-pass continuation/recap** (m1-13 → m1-14): same
  as Checkpoint 1 → post-pass — manual "Continue Listening."

## Live browser verification (Part A §7 QA)

Verified end-to-end at `http://127.0.0.1:4173/headspa-mastery.html?studentpreview=1`
by driving the real player through all 8 transitions (audio played at 16×
`playbackRate` to exercise real `ended`/`playing` events quickly; the
`transitionGapMs` `setTimeout` itself runs at real wall-clock speed,
unaffected by `playbackRate`). Measured `tPlaying - tEnded` per transition,
then added the already-measured natural silence to get the true final
perceived gap:

| Transition | Measured delay | + natural silence | = final gap | Target | In range 3.5–4.5s? |
|---|---:|---:|---:|---:|---|
| Opening → 1.1 | 2957ms | 690ms | 3.647s | 3.6s | yes |
| 1.1 → 1.2 | 3396ms | 638ms | 4.034s | 4.0s | yes |
| 1.2 → 1.3 | 3227ms | 812ms | 4.039s | 4.0s | yes |
| 1.3 → 1.4 | 2727ms | 1304ms | 4.031s | 4.0s | yes |
| post-checkpoint 1 → 1.5 | 2992ms | 1042ms | 4.034s | 4.0s | yes |
| 1.5 → 1.6 | 1802ms | 2234ms | 4.036s | 4.0s | yes |
| 1.6 → 1.7 | 2097ms | 1942ms | 4.039s | 4.0s | yes |
| 1.7 → 1.8 | 2232ms | 1802ms | 4.034s | 4.0s | yes |

All 8 land within about 40ms of their target and comfortably inside the
locked 3.5–4.5s range. The measured delay consistently ran ~25–50ms above
the authored `transitionGapMs` constant — real browser audio-decode/event
overhead, not a mechanism error.

## Live browser verification — synchronization (Part A §3/§7)

All 13 numbered-section/practice/checkpoint/completion landmarks were
confirmed to bring their target into view during the same run: Opening,
1.1, 1.2, 1.3, 1.4, Practice, Checkpoint 1, 1.5, 1.6, 1.7, 1.8, Checkpoint 2,
Recap. This closes the owner's "some sections stop synchronizing" finding —
the only two gaps (1.1, 1.2) were the ones fixed in this pass (see "Sync
anchors added" below).

A real bug surfaced and was fixed during this verification: `scrollToVisualTarget()`
previously called `el.scrollIntoView({behavior:'smooth', block:'center'})`,
which centers against the *full* window height. With the Listen Mode player
bar fixed to the bottom of the viewport (~101–120px, tracked in
`--aimt-lm-bar-offset`), a tall card (e.g. `m1VisualScopeCards`,
`m1VisualScopeLanguage`, `m1VisualLimitations`) could settle with its lower
portion resting behind the bar. Fixed in `assets/js/aimt-listen-mode-player.js`
`scrollToVisualTarget()`: it now reads `--aimt-lm-bar-offset` and centers
the target within the space actually visible above the bar, via a computed
`window.scrollBy()` delta instead of the native `block:'center'`. Re-verified
after the fix — the previously-affected `1.3 → 1.4` transition (`m1VisualScopeCards`)
now settles fully in view.

## Sync anchors added

Sections 1.1 and 1.2 had no `id` on their `.sec-eyebrow` line and therefore
no `visualTarget` in the manifest — the two sections the owner's review
found "stop synchronizing." Added `id="m1VisualWhatIsHeadSpa"` (1.1) and
`id="m1VisualWhatIsTechnician"` (1.2) to `headspa-mastery.html`, mirroring
the existing 1.6/1.7/1.8 precedent, and wired them as `visualTarget` on
`m1-02`/`m1-03` in `assets/js/aimt-listen-mode-data.js`. All 14 chunks now
have a `visualTarget` except `m1-08` (the post-pass continuation chunk into
1.5, not itself a listed landmark).

## Reference Voice visual order (Part A §4)

Re-verified directly against `module-01-listen-script-draft.md` (the
approved v5 script, source of truth for wording) rather than re-deriving:
Section 1.3's "Language that keeps you in scope" card is narrated in the
exact visible row order (buildup, flaking, irritation, shedding/thinning),
and Section 1.4's two cards are narrated "May fall within scope" first,
then "Never authorized," matching visible DOM order. No divergence found —
no code change was needed for this item; both cards fall within the same
section-level scroll target already in place (`m1VisualScopeLanguage`,
`m1VisualScopeCards`), and card-level (not sub-card/timed) cueing is what
the owner's rule calls for.

## Implementation

`transitionGapMs` on a chunk is the number of additional milliseconds the
player waits, after the *previous* chunk's `ended` event resolves to
`{type: 'advance'}`, before calling `goToChunk(nextIndex, {autoplay: true})`
for *this* chunk. It is read once per auto-advance in
`advanceAfterGap()` and is never applied to manual navigation (Start Over,
Continue Listening, seek, skip, or the initial mount-time chunk load) — those
all call `goToChunk` directly and bypass this function entirely.
