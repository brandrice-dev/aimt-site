// AIMT Listen Mode — natural-cut-point finder for a multi-segment
// ElevenLabs generation piece.
//
// Given the piece's source prompt text (with known marker phrases, e.g.
// "Section 0.4 —") and its rendered audio file, estimates each marker's
// timestamp from its character offset in the prompt (proportional to
// total duration -- an approximation, not exact timing), then snaps that
// estimate to the nearest REAL detected silence (ffmpeg silencedetect),
// matching the position-anchored method used for Module 1's raw-sessions
// cut map (see docs/course-audit/listen-mode/
// module-01-pass2-raw-sessions-v2-production-log.md).
//
// Usage: node scripts/aimt-listen-cut-finder.mjs <audio.mp3> <text.txt> <marker1> [marker2 ...]
// Markers are literal substrings to search for in the text file (e.g.
// "Section 0.4 —"). Prints one cut point per marker, plus a JSON summary.

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const FFMPEG = process.env.AIMT_FFMPEG || '/Users/brand/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1';

const [, , audioPath, textPath, ...markers] = process.argv;
if (!audioPath || !textPath || markers.length === 0) {
  console.error('Usage: node aimt-listen-cut-finder.mjs <audio.mp3> <text.txt> <marker1> [marker2 ...]');
  process.exit(1);
}

const text = readFileSync(textPath, 'utf8');
const totalChars = text.length;

const out = execSync(`"${FFMPEG}" -i "${audioPath}" -af "silencedetect=noise=-32dB:d=0.4" -f null - 2>&1`, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
const durMatch = out.match(/Duration: (\d+):(\d+):([\d.]+)/);
const duration = durMatch ? (+durMatch[1] * 3600 + +durMatch[2] * 60 + +durMatch[3]) : null;
const starts = [...out.matchAll(/silence_start:\s*([\d.]+)/g)].map((m) => +m[1]);
const ends = [...out.matchAll(/silence_end:\s*([\d.]+)\s*\|\s*silence_duration:\s*([\d.]+)/g)].map((m) => ({ end: +m[1], dur: +m[2] }));
const silences = starts.map((s, i) => ({ start: s, end: ends[i] ? ends[i].end : duration, dur: ends[i] ? ends[i].dur : (duration - s) })).filter((s) => s.dur >= 0.4);

function findNearestSilence(estimateSec) {
  let best = null;
  let bestDist = Infinity;
  for (const s of silences) {
    const mid = (s.start + s.end) / 2;
    const dist = Math.abs(mid - estimateSec);
    if (dist < bestDist) { bestDist = dist; best = s; }
  }
  return best;
}

const results = [];
for (const marker of markers) {
  const idx = text.indexOf(marker);
  if (idx === -1) {
    results.push({ marker, error: 'marker not found in text' });
    continue;
  }
  const estimateSec = (idx / totalChars) * duration;
  const nearest = findNearestSilence(estimateSec);
  const cutSec = nearest ? (nearest.start + nearest.end) / 2 : estimateSec;
  results.push({
    marker,
    charOffset: idx,
    estimateSec: +estimateSec.toFixed(2),
    nearestSilence: nearest ? { start: +nearest.start.toFixed(3), end: +nearest.end.toFixed(3), dur: +nearest.dur.toFixed(3) } : null,
    cutSec: +cutSec.toFixed(2)
  });
}

console.log(JSON.stringify({ audioPath, duration, totalChars, results }, null, 1));
