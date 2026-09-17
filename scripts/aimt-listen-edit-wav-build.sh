#!/bin/bash
# Creates a lossless, CapCut-safe <base>-EDIT.wav next to every current
# owner-review RAW MP3 in AIMT-Listen-Mode-Final/ (excludes archive-loose-v1/
# subfolders -- those are rejected/historical, not current).
#
# Root cause being worked around: some ElevenLabs RAW MP3s import into
# CapCut ~10s shorter than their real length (inconsistent across files),
# while every other player plays them full-length. WAV has an explicit,
# unambiguous sample count in its header -- no VBR/Xing-header duration
# ambiguity for CapCut's importer to misread -- so converting through a
# real decoder (not a metadata copy) sidesteps the bug entirely.
#
# Decoder: macOS afconvert (Core Audio) -- this environment has no ffmpeg.
# --prime-override ? ? ? forces the decoder to treat all frames as valid
# audio, ignoring any (possibly wrong) embedded LAME/Xing gapless-playback
# priming/remainder metadata, so a bad header in the source can't cause a
# short decode here the way it seems to for CapCut's importer.
#
# Output: PCM WAV, 44.1kHz, mono, 16-bit, no other processing.

set -u
ROOT="AIMT-Listen-Mode-Final"
FAIL=0
TOTAL=0

while IFS= read -r raw; do
  TOTAL=$((TOTAL+1))
  edit="${raw%-RAW.mp3}-EDIT.wav"
  if [ -f "$edit" ]; then
    echo "SKIP (already exists): $edit"
    continue
  fi
  afconvert -f WAVE -d LEI16@44100 -c 1 --prime-override '?' '?' '?' "$raw" "$edit" 2>/tmp/aimt-afconvert-err.log
  status=$?
  if [ $status -ne 0 ] || [ ! -s "$edit" ]; then
    echo "FAIL: $raw -> $edit"
    cat /tmp/aimt-afconvert-err.log
    FAIL=$((FAIL+1))
    continue
  fi
  echo "OK: $edit"
done < <(find "$ROOT" -name "*-RAW.mp3" -not -path "*archive-loose-v1*" | sort)

echo ""
echo "Processed $TOTAL RAW files, $FAIL failures."
exit $FAIL
