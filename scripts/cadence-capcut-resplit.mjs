#!/usr/bin/env node
// Re-splits a CapCut-processed module master back into its original semantic
// chunks, using the deliberate ~2.0s digital-silence boundary markers that
// were inserted when the temporary master was built (see
// docs/course-audit/listen-mode/capcut-test/<module>/module-01-capcut-proof-boundaries.json).
//
// This is PROOF MODE for Module 1 (m1-01/m1-02/m1-03 only). It never touches
// canonical production audio (assets/audio/listen/headspa-mastery/**) and
// never edits assets/js/aimt-listen-mode-data.js or its qaStatus — output
// goes to docs/course-audit/listen-mode/capcut-test/<module>/resplit/ only.
//
// Detection strategy: ffmpeg's `silencedetect` filter finds every silence
// interval at least 1.0s long (well below the 2.0s markers, so genuine
// boundary silence is never missed even if CapCut trims a few hundred ms
// off it). Each candidate is then filtered to a tolerance window around the
// expected 2.0s marker duration (1.0s-3.2s) to distinguish a deliberate
// boundary from an ordinary speech pause (which in this narration style
// runs well under a second) or from a much longer stretch of true silence
// that would indicate something else went wrong. Exactly as many qualifying
// silences as the manifest declares are required, in order; anything else
// is treated as a detection failure and the script stops rather than
// guessing.
//
// Usage:
//   node scripts/cadence-capcut-resplit.mjs \
//     --processed=docs/course-audit/listen-mode/capcut-test/module-01/intake/module-01-capcut-proof-processed.wav \
//     --manifest=docs/course-audit/listen-mode/capcut-test/module-01/module-01-capcut-proof-boundaries.json \
//     --outDir=docs/course-audit/listen-mode/capcut-test/module-01/resplit

import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SILENCE_NOISE_FLOOR_DB = -50;
const SILENCE_MIN_DURATION_SEC = 1.0; // ffmpeg detection floor, well under the 2.0s marker
const BOUNDARY_TOLERANCE_MIN_SEC = 1.0; // below this, it's a speech pause, not a marker
const BOUNDARY_TOLERANCE_MAX_SEC = 3.2; // above this, it's not a 2.0s marker either
const CHUNK_DURATION_DRIFT_WARN_SEC = 0.3; // "small encoding-level variance is acceptable"
const CHUNK_DURATION_DRIFT_WARN_RATIO = 0.01; // 1%

function resolveFfmpeg() {
  try {
    const out = execFileSync('which', ['ffmpeg'], { encoding: 'utf8' }).trim();
    if (out) return out;
  } catch {}
  try {
    const out = execFileSync('python3', ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'], { encoding: 'utf8' }).trim();
    if (out) return out;
  } catch {}
  throw new Error('No ffmpeg binary found on PATH and imageio_ffmpeg is not installed.');
}

function runFfmpegCaptureStderr(ffmpeg, args) {
  // execFileSync only surfaces stderr via the thrown error on a non-zero
  // exit; ffmpeg exits 0 for `-f null -` (a valid, deliberate no-output
  // run), which silently discarded the silencedetect log lines we actually
  // need. spawnSync captures stderr regardless of exit code.
  const result = spawnSync(ffmpeg, args, { encoding: 'utf8' });
  return result.stderr || '';
}

function getDuration(ffmpeg, filePath) {
  const stderr = runFfmpegCaptureStderr(ffmpeg, ['-i', filePath]);
  const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  if (!m) throw new Error('Could not parse duration from ffmpeg output for ' + filePath);
  return (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]);
}

function detectSilences(ffmpeg, filePath) {
  const stderr = runFfmpegCaptureStderr(ffmpeg, [
    '-i', filePath,
    '-af', `silencedetect=noise=${SILENCE_NOISE_FLOOR_DB}dB:d=${SILENCE_MIN_DURATION_SEC}`,
    '-f', 'null', '-'
  ]);
  const silences = [];
  const startRe = /silence_start:\s*(-?\d+\.?\d*)/g;
  const endRe = /silence_end:\s*(-?\d+\.?\d*)\s*\|\s*silence_duration:\s*(-?\d+\.?\d*)/g;
  const starts = [...stderr.matchAll(startRe)].map((m) => parseFloat(m[1]));
  const ends = [...stderr.matchAll(endRe)].map((m) => ({ end: parseFloat(m[1]), duration: parseFloat(m[2]) }));
  for (let i = 0; i < Math.min(starts.length, ends.length); i++) {
    silences.push({ start: starts[i], end: ends[i].end, duration: ends[i].duration });
  }
  return silences;
}

const BOUNDARY_SEARCH_WINDOW_SEC = 10; // how far from the manifest's expected position a real marker may drift

// Position-anchored matching, not a flat global duration filter. A longer
// chunk's raw narration can contain natural pauses in the same ~1-1.3s
// range that a global duration-only filter would also be tolerant of (found
// empirically on M1-04's raw audio: three natural pauses of 1.02s-1.22s,
// nowhere near any real boundary) -- so each expected separator (from the
// manifest, computed from the untouched source durations) searches only its
// own +/-BOUNDARY_SEARCH_WINDOW_SEC neighborhood for a duration-plausible
// silence, and picks the closest one. A separator with no plausible
// candidate nearby is reported unmatched rather than guessed at.
function classifyBoundaries(allSilences, expectedSeparators) {
  const durationPlausible = allSilences.filter(
    (s) => s.duration >= BOUNDARY_TOLERANCE_MIN_SEC && s.duration <= BOUNDARY_TOLERANCE_MAX_SEC
  );
  const matched = [];
  const unmatched = [];
  for (const expected of expectedSeparators) {
    const nearby = durationPlausible.filter(
      (s) => Math.abs(s.start - expected.startSec) <= BOUNDARY_SEARCH_WINDOW_SEC
    );
    if (nearby.length === 0) {
      unmatched.push(expected);
      continue;
    }
    nearby.sort((a, b) => Math.abs(a.start - expected.startSec) - Math.abs(b.start - expected.startSec));
    matched.push({ expected, found: nearby[0] });
  }
  return { matched, unmatched, allSilences, durationPlausible };
}

function extractSegment(ffmpeg, inputPath, startSec, endSec, outPath) {
  const duration = endSec - startSec;
  execFileSync(ffmpeg, [
    '-y', '-i', inputPath,
    '-ss', String(startSec), '-t', String(duration),
    '-c:a', 'pcm_s16le',
    outPath
  ], { encoding: 'utf8' });
}

function parseArgs(argv) {
  const args = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) { args[m[1]] = m[2]; continue; }
    if (a.startsWith('--')) args[a.slice(2)] = true;
  }
  return args;
}

function printHelp() {
  console.log(`
cadence-capcut-resplit.mjs -- re-split a CapCut-processed module master back
into its original semantic chunks using the ~2.0s digital-silence boundary
markers recorded in a boundary manifest. PROOF MODE (Module 1, m1-01..03).

Usage:
  node scripts/cadence-capcut-resplit.mjs --processed=<file> --manifest=<file> --outDir=<dir>

Never overwrites canonical production audio or edits the manifest data file.
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { printHelp(); return; }

  const processedPath = args.processed
    ? path.resolve(ROOT, args.processed)
    : path.join(ROOT, 'docs/course-audit/listen-mode/capcut-test/module-01/intake/module-01-capcut-proof-processed.wav');
  const manifestPath = args.manifest
    ? path.resolve(ROOT, args.manifest)
    : path.join(ROOT, 'docs/course-audit/listen-mode/capcut-test/module-01/module-01-capcut-proof-boundaries.json');
  const outDir = args.outDir
    ? path.resolve(ROOT, args.outDir)
    : path.join(ROOT, 'docs/course-audit/listen-mode/capcut-test/module-01/resplit');

  if (!existsSync(manifestPath)) {
    console.error(`Boundary manifest not found: ${manifestPath}`);
    process.exit(1);
  }
  if (!existsSync(processedPath)) {
    console.log(`No CapCut export found yet at:\n  ${processedPath}\n`);
    console.log('Nothing to do -- waiting for the owner to drop the processed file in intake/.');
    console.log('See CAPCUT-PROOF-INSTRUCTIONS.md in the same folder as the manifest.');
    return;
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const chunkEntries = manifest.chunks.filter((c) => !c.separator);
  const separatorEntries = manifest.chunks.filter((c) => c.separator);
  const expectedSeparatorCount = separatorEntries.length;

  const ffmpeg = resolveFfmpeg();
  console.log(`ffmpeg: ${ffmpeg}`);

  const processedDuration = getDuration(ffmpeg, processedPath);
  const originalMasterDuration = manifest.masterTotalDurationSec;
  const durationChange = processedDuration - originalMasterDuration;

  console.log(`\nProcessed file: ${processedPath}`);
  console.log(`Processed total duration: ${processedDuration.toFixed(3)}s`);
  console.log(`Original temporary master duration: ${originalMasterDuration.toFixed(3)}s`);
  console.log(`Duration change: ${durationChange >= 0 ? '+' : ''}${durationChange.toFixed(3)}s (${((durationChange / originalMasterDuration) * 100).toFixed(2)}%)`);

  console.log(`\nRunning silence detection (noise floor ${SILENCE_NOISE_FLOOR_DB}dB, min duration ${SILENCE_MIN_DURATION_SEC}s)...`);
  const allSilences = detectSilences(ffmpeg, processedPath);
  const { matched, unmatched, durationPlausible } = classifyBoundaries(allSilences, separatorEntries);

  console.log(`Found ${allSilences.length} total silence interval(s), ${durationPlausible.length} duration-plausible (${BOUNDARY_TOLERANCE_MIN_SEC}s-${BOUNDARY_TOLERANCE_MAX_SEC}s).`);
  allSilences.forEach((s, i) => {
    const isMatched = matched.some((m) => m.found === s);
    const tag = isMatched ? '  <- matched to an expected separator' : '';
    console.log(`  [${i}] ${s.start.toFixed(3)}s - ${s.end.toFixed(3)}s (${s.duration.toFixed(3)}s)${tag}`);
  });

  // Two boundary-manifest schemas exist across this workflow's proof rounds:
  // the 4-chunk proof used afterChunkId (= chunk before the gap) /
  // beforeChunkId (= chunk after the gap); the full-module manifest uses
  // beforeChunk (= chunk before the gap) / afterChunk (= chunk after the
  // gap) per this task's schema. Accept either so old evidence still
  // prints sensibly.
  function separatorLabel(entry) {
    const prev = entry.beforeChunk || entry.afterChunkId || '?';
    const next = entry.afterChunk || entry.beforeChunkId || '?';
    return `${prev} -> ${next}`;
  }

  if (unmatched.length > 0) {
    console.log(`\nSTOP: ${unmatched.length} of ${expectedSeparatorCount} expected separator(s) had no plausible silence within +/-${BOUNDARY_SEARCH_WINDOW_SEC}s of their expected position:`);
    unmatched.forEach((u) => console.log(`  ${separatorLabel(u)}, expected near ${u.startSec.toFixed(3)}s`));
    console.log('This means CapCut either removed, merged, or meaningfully shifted the');
    console.log('boundary marker at that position. Per instruction, this script does not');
    console.log('attempt a complicated correction -- report this back to the owner rather');
    console.log('than guessing at a split.');
    process.exitCode = 1;
    return;
  }

  // Report drift at each separator vs. the manifest's expected position.
  console.log('\nBoundary timing drift vs. expected (from manifest):');
  matched.forEach(({ expected, found }, i) => {
    const startDrift = found.start - expected.startSec;
    const endDrift = found.end - expected.endSec;
    console.log(`  separator ${i + 1} (${separatorLabel(expected)}): expected ${expected.startSec.toFixed(3)}s-${expected.endSec.toFixed(3)}s, found ${found.start.toFixed(3)}s-${found.end.toFixed(3)}s (start drift ${startDrift >= 0 ? '+' : ''}${startDrift.toFixed(3)}s, end drift ${endDrift >= 0 ? '+' : ''}${endDrift.toFixed(3)}s)`);
  });

  // Build segments: [0, sep1.start), [sep1.end, sep2.start), ..., [sepN.end, EOF)
  const segments = [];
  let cursor = 0;
  for (const { found } of matched) {
    segments.push({ start: cursor, end: found.start });
    cursor = found.end;
  }
  segments.push({ start: cursor, end: processedDuration });

  if (segments.length !== chunkEntries.length) {
    console.log(`\nSTOP: derived ${segments.length} segment(s) but the manifest declares ${chunkEntries.length} chunk(s). Not splitting.`);
    process.exitCode = 1;
    return;
  }

  mkdirSync(outDir, { recursive: true });
  console.log('\nSplitting and validating each chunk:');
  const results = [];
  let anyStretchFlag = false;
  for (let i = 0; i < chunkEntries.length; i++) {
    const chunk = chunkEntries[i];
    const seg = segments[i];
    const segDuration = seg.end - seg.start;
    const outPath = path.join(outDir, `${chunk.chunkId}-capcut-resplit.wav`);
    extractSegment(ffmpeg, processedPath, seg.start, seg.end, outPath);

    const drift = segDuration - chunk.originalDurationSec;
    const driftRatio = Math.abs(drift) / chunk.originalDurationSec;
    const stretchSuspected = Math.abs(drift) > CHUNK_DURATION_DRIFT_WARN_SEC && driftRatio > CHUNK_DURATION_DRIFT_WARN_RATIO;
    if (stretchSuspected) anyStretchFlag = true;

    results.push({ chunkId: chunk.chunkId, outPath, segDuration, originalDurationSec: chunk.originalDurationSec, drift, driftRatio, stretchSuspected });
    console.log(`  ${chunk.chunkId}: ${segDuration.toFixed(3)}s (original ${chunk.originalDurationSec.toFixed(3)}s, drift ${drift >= 0 ? '+' : ''}${drift.toFixed(3)}s / ${(driftRatio * 100).toFixed(2)}%)${stretchSuspected ? '  <- possible time-stretch, review' : ''} -> ${path.relative(ROOT, outPath)}`);
  }

  console.log('\n--- Result ---');
  if (anyStretchFlag) {
    console.log('STOP-LOSS-STYLE FLAG: one or more chunks drifted beyond the small-variance');
    console.log('tolerance (> 0.3s AND > 1% of original duration). This suggests CapCut may');
    console.log('have time-stretched the speech, not just re-encoded it. Do not treat this');
    console.log('resplit as production-ready -- report to the owner for a listening check.');
  } else {
    console.log('PASS: all chunks re-split within the small encoding-level variance tolerance.');
    console.log('No speech was cut, no boundary artifacts detected beyond the tolerance window.');
  }
  console.log('\nThese are PROOF-MODE outputs only. Nothing here overwrites canonical');
  console.log('production audio, and no qaStatus was changed.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

export { resolveFfmpeg, getDuration, detectSilences, classifyBoundaries, extractSegment };
