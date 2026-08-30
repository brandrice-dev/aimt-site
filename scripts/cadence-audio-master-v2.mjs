#!/usr/bin/env node
// CADENCE MASTER V2 — candidate surgical de-essing chain (NOT locked).
//
// Status: candidate only, pending owner listening approval. Do not treat
// LIGHT or MEDIUM as production-ready, do not wire this into any batch
// pipeline, and do not rename either preset CADENCE_AUDIO_MASTER_PRESET_V1
// until the owner picks one (see
// docs/course-audit/listen-mode/module-01-master-v2-review.md).
//
// Why this exists, distinct from scripts/cadence-audio-finish.mjs
// (CADENCE_AUDIO_FINISHING_PRESET_V1, the plain deesser+loudnorm chain):
// the owner found the plain deesser still left a bit too much sibilance,
// but rejected Auphonic's Voice AutoEQ for audibly altering articulation
// (a lisp). Auphonic's aggressiveness comes from a broad, always-on
// filtering approach; ffmpeg's `adynamicequalizer` filter instead only
// attenuates the target frequency band WHEN the detected sibilant energy
// actually spikes above a threshold -- Jane stays fully bright/open
// between sibilants, and the attenuation itself is a narrow parametric
// (`bell`) cut at the measured sibilance frequency, never a broad
// high-frequency shelf. That's the "surgical" difference this preset is
// testing.
//
// Target frequency (8500 Hz) was NOT assumed -- it comes from a bandpass
// RMS/peak sweep across this specific voice's raw M1-04 generation (see
// the review doc for the full sweep table and spectrogram). No high-pass
// filter is used: the same source shows no meaningful low-frequency
// content to remove (measured ~20dB below the broadband noise floor). No
// compressor is used: loudnorm already handles clip-to-clip loudness
// consistency, and the dynamic EQ is already a frequency-specific
// dynamics processor for the one problem being solved (sibilance) --
// adding a second, broadband dynamics stage was judged more likely to
// reintroduce the "overprocessed" quality the owner rejected in Auphonic
// than to help.
//
// Usage:
//   node scripts/cadence-audio-master-v2.mjs --in=<raw.mp3> --out=<out.mp3> --preset=light|medium
//   node scripts/cadence-audio-master-v2.mjs --help
//
// Input is never modified. This script only ever reads --in and writes
// --out -- preserving the raw generation is the caller's job, same as
// cadence-audio-finish.mjs.

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, statSync, accessSync, constants as fsConstants } from 'node:fs';
import path from 'node:path';

// ── Candidate presets (NOT locked -- see status note above) ──
// dfrequency/tfrequency: 8500 Hz, from a measured bandpass sweep of Jane's
// actual raw M1-04 sibilance peak (broadly 7.5-9.5kHz, sharpest ~8-9kHz).
// mode=cutabove: per ffmpeg's own docs, cuts the target band only while the
// DETECTED level is above threshold -- the "only duck when it spikes"
// behavior this whole preset exists to get. tftype=bell: a parametric dip
// centered on tfrequency, not a shelf -- never reduces the entire
// high-frequency band, only the measured sibilant region.
// threshold's usable range was empirically calibrated (its 0-100 scale
// isn't defined in absolute units by ffmpeg's docs): sweeping the raw
// source showed threshold=0 destroys the whole signal and everything
// above ~0.5 is nearly inert for this content, so both presets deliberately
// sit inside the narrow 0.01-0.15 working band found by that sweep.
const PRESETS = {
  light: {
    name: 'CADENCE_MASTER_V2_LIGHT (candidate)',
    dynamicEq: { threshold: 0.10, dfrequency: 8500, dqfactor: 2, tfrequency: 8500, tqfactor: 2, attack: 10, release: 100, ratio: 6, range: 12, mode: 'cutabove', dftype: 'bandpass', tftype: 'bell' },
    loudnorm: { I: -18, LRA: 7, TP: -2 },
    output: { sampleRateHz: 44100, channels: 1, codec: 'libmp3lame', bitrateKbps: 128 }
  },
  medium: {
    name: 'CADENCE_MASTER_V2_MEDIUM (candidate)',
    dynamicEq: { threshold: 0.04, dfrequency: 8500, dqfactor: 2, tfrequency: 8500, tqfactor: 2, attack: 10, release: 100, ratio: 6, range: 12, mode: 'cutabove', dftype: 'bandpass', tftype: 'bell' },
    loudnorm: { I: -18, LRA: 7, TP: -2 },
    output: { sampleRateHz: 44100, channels: 1, codec: 'libmp3lame', bitrateKbps: 128 }
  }
};

function dynamicEqFilterString(p) {
  const d = p.dynamicEq;
  return `adynamicequalizer=threshold=${d.threshold}:dfrequency=${d.dfrequency}:dqfactor=${d.dqfactor}:tfrequency=${d.tfrequency}:tqfactor=${d.tqfactor}:attack=${d.attack}:release=${d.release}:ratio=${d.ratio}:range=${d.range}:mode=${d.mode}:dftype=${d.dftype}:tftype=${d.tftype}`;
}

function resolveFfmpeg() {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    return 'ffmpeg';
  } catch (e) { /* fall through */ }
  try {
    const resolved = execFileSync('python3', ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'], { encoding: 'utf8' }).trim();
    if (resolved && existsSync(resolved)) {
      try { accessSync(resolved, fsConstants.X_OK); } catch (e) { /* not our job to chmod */ }
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
  console.log(`CADENCE MASTER V2 (candidate -- not yet approved)

Usage:
  node scripts/cadence-audio-master-v2.mjs --in=<raw.mp3> --out=<out.mp3> --preset=light|medium

Options:
  --in=PATH       Raw (unprocessed) source MP3. Required. Never modified.
  --out=PATH      Destination for the processed MP3. Required. Overwritten if it exists.
  --preset=NAME   'light' or 'medium'. Required.
  --help          Show this message.

Presets:
${Object.entries(PRESETS).map(([k, p]) => `  ${k}: ${dynamicEqFilterString(p)}`).join('\n')}
`);
}

function measureLoudness(ffmpeg, inPath, filterChainNoLoudnorm, loudnorm) {
  const filter = `${filterChainNoLoudnorm},loudnorm=I=${loudnorm.I}:LRA=${loudnorm.LRA}:TP=${loudnorm.TP}:print_format=json`;
  const result = spawnSync(ffmpeg, ['-hide_banner', '-nostats', '-i', inPath, '-af', filter, '-f', 'null', '-'], { encoding: 'utf8' });
  const raw = (result.stderr || '') + (result.stdout || '');
  const jsonMatch = raw.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse loudnorm measurement pass output. ffmpeg stderr was:\n' + (result.stderr || '(empty)'));
  }
  return JSON.parse(jsonMatch[0]);
}

function applyMastering(ffmpeg, inPath, outPath, filterChainNoLoudnorm, loudnorm, output, measured) {
  const filter = [
    filterChainNoLoudnorm,
    `loudnorm=I=${loudnorm.I}:LRA=${loudnorm.LRA}:TP=${loudnorm.TP}` +
      `:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}` +
      `:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}` +
      ':linear=true:print_format=summary'
  ].join(',');
  execFileSync(ffmpeg, [
    '-hide_banner', '-nostats', '-y',
    '-i', inPath,
    '-af', filter,
    '-ar', String(output.sampleRateHz),
    '-ac', String(output.channels),
    '-c:a', output.codec,
    '-b:a', `${output.bitrateKbps}k`,
    outPath
  ], { stdio: 'inherit' });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.in || !args.out || !args.preset) {
    printHelp();
    process.exitCode = args.help ? 0 : 1;
    return;
  }
  const preset = PRESETS[args.preset];
  if (!preset) {
    console.error(`Unknown preset "${args.preset}". Valid presets: ${Object.keys(PRESETS).join(', ')}`);
    process.exitCode = 1;
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
    console.error('No usable ffmpeg found (checked system PATH and the imageio-ffmpeg Python package).');
    process.exitCode = 1;
    return;
  }

  const filterChainNoLoudnorm = dynamicEqFilterString(preset);

  console.log(preset.name);
  console.log(`ffmpeg: ${ffmpeg}`);
  console.log(`in:     ${inPath}`);
  console.log(`out:    ${outPath}`);
  console.log(`chain:  ${filterChainNoLoudnorm}`);
  console.log('Pass 1/2: measuring loudness...');
  const measured = measureLoudness(ffmpeg, inPath, filterChainNoLoudnorm, preset.loudnorm);
  console.log('  measured_I=%s measured_TP=%s measured_LRA=%s measured_thresh=%s', measured.input_i, measured.input_tp, measured.input_lra, measured.input_thresh);
  console.log('Pass 2/2: applying dynamic EQ + loudnorm, writing output...');
  applyMastering(ffmpeg, inPath, outPath, filterChainNoLoudnorm, preset.loudnorm, preset.output, measured);

  if (!existsSync(outPath) || statSync(outPath).size === 0) {
    console.error('Output file was not created or is empty -- treat this as a failure, not a partial success.');
    process.exitCode = 1;
    return;
  }
  console.log(`Done. Wrote ${statSync(outPath).size} bytes to ${outPath}`);
}

main();
