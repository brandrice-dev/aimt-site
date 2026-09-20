#!/usr/bin/env node
// CADENCE_AUDIO_FINISHING_PRESET_V1
//
// One reusable, scriptable finishing step for every Cadence Listen Mode
// ElevenLabs generation (Jane / eleven_v3). Applies gentle de-essing plus
// consistent loudness normalization via ffmpeg -- nothing else. The owner
// should never need to open an audio editor; this is the one automatic
// step between "raw ElevenLabs generation" and "canonical production MP3."
//
// PRESET STATUS: proposed, pending one owner-reviewed A/B test on M1-04
// (see docs/course-audit/listen-mode/module-01-audio-finishing-review.md).
// Do not treat these constants as locked/final until that review approves
// them, and do not run this script over the rest of the Module 1 batch
// until then -- this file is infrastructure for that future step, not an
// instruction to use it yet.
//
// What it does, in order:
//   1. De-ess (ffmpeg's own `deesser` filter) -- gently reduces harsh
//      sibilance. Capped (`m`) so it can never fully remove the consonant
//      (no lisping), and set low enough (`i`) that it stays inaudible as
//      "processing" -- calibrated against a near-silent extraction of the
//      isolated ess signal at several intensities before landing here.
//   2. Two-pass EBU R128 loudness normalization (ffmpeg's own `loudnorm`
//      filter) -- brings every chunk to the same target integrated
//      loudness so clips don't sound louder/quieter next to each other.
//      Two-pass (measure, then apply using the real measured stats) is
//      more accurate than loudnorm's single-pass real-time mode and is
//      ffmpeg's own recommended usage.
//   3. Re-encode to the exact production spec: MP3, 44.1kHz, mono,
//      128kbps -- matching every existing Listen Mode chunk.
//
// Explicitly NOT included, per the owner's "subtle, not radio/podcast"
// instruction: no separate compressor/limiter, no EQ coloration beyond
// what de-essing itself does, no reverb, no noise gate, no
// exciter/enhancer. loudnorm may fall back to its own "dynamic" (rather
// than pure-linear) internal correction when a source's peaks are close
// to the ceiling -- that is loudnorm protecting against clipping, not a
// separate mastering effect layered on top.
//
// Usage:
//   node scripts/cadence-audio-finish.mjs --in=<raw.mp3> --out=<finished.mp3>
//   node scripts/cadence-audio-finish.mjs --help
//
// Input is never modified. Preserving the raw generation before calling
// this script (e.g. copying it into a module's raw/ subfolder) is the
// caller's job -- this script only ever reads --in and writes --out.

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, statSync, accessSync, constants as fsConstants } from 'node:fs';
import path from 'node:path';

// ── CADENCE_AUDIO_FINISHING_PRESET_V1 (proposed -- see status note above) ──
const PRESET = {
  name: 'CADENCE_AUDIO_FINISHING_PRESET_V1',
  deesser: { i: 0.22, m: 0.4, f: 0.5 }, // intensity, max-deessing ceiling, frequency
  loudnorm: { I: -18, LRA: 7, TP: -2 }, // integrated target LUFS, loudness-range target, true-peak ceiling dBTP
  output: { sampleRateHz: 44100, channels: 1, codec: 'libmp3lame', bitrateKbps: 128 }
};

function deesserFilterString() {
  const { i, m, f } = PRESET.deesser;
  return `deesser=i=${i}:m=${m}:f=${f}`;
}

function resolveFfmpeg() {
  // Prefer a real system ffmpeg (Homebrew, MacPorts, apt, etc.) if present.
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    return 'ffmpeg';
  } catch (e) { /* fall through */ }

  // Fall back to the free, MIT-licensed static binary bundled by the
  // imageio-ffmpeg PyPI package (`pip3 install --user imageio-ffmpeg`) --
  // no paid dependency, no Homebrew required.
  try {
    const resolved = execFileSync('python3', ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'], { encoding: 'utf8' }).trim();
    if (resolved && existsSync(resolved)) {
      try { accessSync(resolved, fsConstants.X_OK); } catch (e) { /* chmod not our job here */ }
      return resolved;
    }
  } catch (e) { /* fall through */ }

  return null;
}

function parseArgs(argv) {
  const args = {};
  for (const arg of argv) {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
    else if (arg === '--help' || arg === '-h') args.help = true;
  }
  return args;
}

function printHelp() {
  console.log(`${PRESET.name}

Usage:
  node scripts/cadence-audio-finish.mjs --in=<raw.mp3> --out=<finished.mp3>

Options:
  --in=PATH    Raw (unprocessed) source MP3. Required. Never modified.
  --out=PATH   Destination for the finished MP3. Required. Overwritten if it exists.
  --help       Show this message.

Preset (see the constants at the top of this file to change/tune):
  de-ess:    ${deesserFilterString()}
  loudnorm:  I=${PRESET.loudnorm.I} LRA=${PRESET.loudnorm.LRA} TP=${PRESET.loudnorm.TP} (two-pass)
  output:    ${PRESET.output.sampleRateHz}Hz, ${PRESET.output.channels === 1 ? 'mono' : PRESET.output.channels + 'ch'}, ${PRESET.output.codec}, ${PRESET.output.bitrateKbps}kbps
`);
}

function measureLoudness(ffmpeg, inPath) {
  // ffmpeg writes all of its logging -- including loudnorm's JSON stats --
  // to stderr, never stdout, regardless of exit code. execFileSync only
  // exposes stderr on a thrown (non-zero-exit) error, so spawnSync is used
  // here instead: it always returns {stdout, stderr, status}, success or not.
  const filter = `${deesserFilterString()},loudnorm=I=${PRESET.loudnorm.I}:LRA=${PRESET.loudnorm.LRA}:TP=${PRESET.loudnorm.TP}:print_format=json`;
  const result = spawnSync(ffmpeg, ['-hide_banner', '-nostats', '-i', inPath, '-af', filter, '-f', 'null', '-'], { encoding: 'utf8' });
  const raw = (result.stderr || '') + (result.stdout || '');
  const jsonMatch = raw.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse loudnorm measurement pass output. ffmpeg stderr was:\n' + (result.stderr || '(empty)'));
  }
  return JSON.parse(jsonMatch[0]);
}

function applyFinishing(ffmpeg, inPath, outPath, measured) {
  const filter = [
    deesserFilterString(),
    `loudnorm=I=${PRESET.loudnorm.I}:LRA=${PRESET.loudnorm.LRA}:TP=${PRESET.loudnorm.TP}` +
      `:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}` +
      `:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}` +
      ':linear=true:print_format=summary'
  ].join(',');
  execFileSync(ffmpeg, [
    '-hide_banner', '-nostats', '-y',
    '-i', inPath,
    '-af', filter,
    '-ar', String(PRESET.output.sampleRateHz),
    '-ac', String(PRESET.output.channels),
    '-c:a', PRESET.output.codec,
    '-b:a', `${PRESET.output.bitrateKbps}k`,
    outPath
  ], { stdio: 'inherit' });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.in || !args.out) {
    printHelp();
    process.exitCode = args.help ? 0 : 1;
    return;
  }

  const inPath = path.resolve(args.in);
  const outPath = path.resolve(args.out);

  if (!existsSync(inPath)) {
    console.error(`Input file not found: ${inPath}`);
    process.exitCode = 1;
    return;
  }

  const ffmpeg = resolveFfmpeg();
  if (!ffmpeg) {
    console.error('No usable ffmpeg found (checked system PATH and the imageio-ffmpeg Python package). Install one before running this script -- see the task report for how this was resolved.');
    process.exitCode = 1;
    return;
  }

  console.log(`${PRESET.name}`);
  console.log(`ffmpeg: ${ffmpeg}`);
  console.log(`in:     ${inPath}`);
  console.log(`out:    ${outPath}`);
  console.log('Pass 1/2: measuring loudness...');
  const measured = measureLoudness(ffmpeg, inPath);
  console.log('  measured_I=%s measured_TP=%s measured_LRA=%s measured_thresh=%s', measured.input_i, measured.input_tp, measured.input_lra, measured.input_thresh);
  console.log('Pass 2/2: applying de-ess + loudnorm, writing output...');
  applyFinishing(ffmpeg, inPath, outPath, measured);

  if (!existsSync(outPath) || statSync(outPath).size === 0) {
    console.error('Output file was not created or is empty -- treat this as a failure, not a partial success.');
    process.exitCode = 1;
    return;
  }
  console.log(`Done. Wrote ${statSync(outPath).size} bytes to ${outPath}`);
}

main();
