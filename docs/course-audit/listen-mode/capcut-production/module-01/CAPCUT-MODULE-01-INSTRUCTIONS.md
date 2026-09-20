# CapCut pass — Module 1 (two parts, same preset)

**Update:** CapCut refuses Enhance Voice on a clip over 15:00, and the full
Module 1 master runs ~16:32 — so Module 1 now needs **two** CapCut passes
instead of one, split at the first checkpoint (after M1-07, before M1-08).
Same settings both times. The old single full-module master
(`module-01-capcut-master.wav`) is kept on disk as historical/pre-limit
evidence only — **use Part A / Part B below, not that file.**

## Part A — M1-01 through M1-07 (10:28.8)

1. Open CapCut Desktop.
2. New/blank project.
3. Import: `module-01-capcut-master-part-a.wav` (in this folder).
4. Put the entire file on the timeline as ONE audio clip.
5. Do NOT cut, trim, move, or delete silent gaps.
6. Audio > Basic:
   - Volume = **0.0 dB**
   - Fade in = **0.0s**
   - Fade out = **0.0s**
   - Normalize loudness = **ON**
7. Enhance voice = **ON**, Intensity = **75**
8. Reduce noise = **ON**
9. Isolate voice = **OFF**
10. Audio translator = **OFF**
11. No voice changer / EQ / pitch / speed / other effects.
12. Export **audio only**, lossless (**FLAC** preferred, WAV OK).
13. Save into this folder's `intake/` subfolder as:

```
docs/course-audit/listen-mode/capcut-production/module-01/intake/module-01-capcut-master-part-a-processed.flac
```

## Part B — M1-08 through M1-14 (6:01.7)

Same steps, same settings, different file:

3. Import: `module-01-capcut-master-part-b.wav` (in this folder).
13. Save into `intake/` as:

```
docs/course-audit/listen-mode/capcut-production/module-01/intake/module-01-capcut-master-part-b-processed.flac
```

## That's it

Two CapCut passes, same settings both times. No manual splitting needed —
Claude re-splits each part automatically once both processed files are in
`intake/`.
