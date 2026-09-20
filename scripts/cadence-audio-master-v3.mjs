#!/usr/bin/env node
// CADENCE MASTER V3 — three architecturally distinct candidates (NONE
// approved). See docs/course-audit/listen-mode/module-01-master-v3-review.md
// for the full owner review package this script's output feeds.
//
// Why three different *architectures*, not three strengths of the same
// filter: V2 (single dynamic-EQ band centered on Jane's measured ~8.5kHz
// sibilance peak) wasn't strong enough per the owner's listening review,
// but Auphonic's stronger, broader, always-on approach damaged
// articulation (an audible lisp). Simply cranking V2's one band harder was
// explicitly ruled out as the wrong move -- these three candidates test
// different ways to get more control *without* that failure mode:
//
//   V3-A dual-band   -- split the measured ~7.5-9.5kHz sibilance region
//                        across two independent, narrower dynamic-EQ bands
//                        (centered ~7.75kHz and ~9.25kHz) instead of one
//                        wide band. Hypothesis: distributed, moderate
//                        reduction across two focused bands controls the
//                        full harsh region without asking any single band
//                        to work hard enough to risk articulation.
//   V3-B hybrid      -- the same V2-style single dynamic-EQ band as the
//                        primary control, followed by a genuinely light
//                        conventional `deesser` pass that only mops up
//                        residual peaks the dynamic EQ's threshold didn't
//                        catch. The deesser is deliberately far gentler
//                        than the old i=0.22 single-tool preset -- it's
//                        cleanup, not the primary mechanism.
//   V3-C broad/deep  -- still one stage (simpler than V3-A), but retuned
//                        (narrower Q focused on the measured region,
//                        stronger threshold/ratio) for a materially
//                        stronger single-band result than V2 MEDIUM, with
//                        an explicit `range` ceiling as the hard
//                        articulation-protection limit.
//
// All three: no high-pass (the raw source has no meaningful low-frequency
// content to remove -- measured, not assumed), no compressor (loudnorm
// already handles clip-to-clip loudness; a second broadband dynamics stage
// wasn't shown to help and risked the same "overprocessed" quality that
// got Auphonic rejected), no brightness-restoration shelf (a small,
// physically-inherent skirt above the target bands was measured and judged
// too small, and too far from where speech intelligibility/articulation
// lives, to justify adding another stage for it).
//
// Usage:
//   node scripts/cadence-audio-master-v3.mjs --in=<raw.mp3> --out=<out.mp3> --preset=a-dual-band|b-hybrid|c-broad-dynamic
//   node scripts/cadence-audio-master-v3.mjs --help
//
// Input is never modified. This script only ever reads --in and writes
// --out -- preserving the raw generation is the caller's job.

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, statSync, accessSync, constants as fsConstants } from 'node:fs';
import path from 'node:path';

const LOUDNORM = { I: -18, LRA: 7, TP: -2 };
const OUTPUT_SPEC = { sampleRateHz: 44100, channels: 1, codec: 'libmp3lame', bitrateKbps: 128 };

function dynEq({ threshold, dfrequency, dqfactor, tfrequency, tqfactor, attack, release, ratio, range }) {
  return `adynamicequalizer=threshold=${threshold}:dfrequency=${dfrequency}:dqfactor=${dqfactor}:tfrequency=${tfrequency}:tqfactor=${tqfactor}:attack=${attack}:release=${release}:ratio=${ratio}:range=${range}:mode=cutabove:dftype=bandpass:tftype=bell`;
}

// ── Candidates (NONE approved -- see status note above) ──
const PRESETS = {
  'a-dual-band': {
    name: 'CADENCE_MASTER_V3_A_DUAL_BAND (candidate)',
    filterChain: [
      dynEq({ threshold: 0.035, dfrequency: 7750, dqfactor: 4, tfrequency: 7750, tqfactor: 4, attack: 10, release: 100, ratio: 6, range: 10 }),
      dynEq({ threshold: 0.035, dfrequency: 9250, dqfactor: 4, tfrequency: 9250, tqfactor: 4, attack: 10, release: 100, ratio: 6, range: 10 })
    ].join(',')
  },
  'b-hybrid': {
    name: 'CADENCE_MASTER_V3_B_HYBRID (candidate)',
    filterChain: [
      dynEq({ threshold: 0.04, dfrequency: 8500, dqfactor: 2, tfrequency: 8500, tqfactor: 2, attack: 10, release: 100, ratio: 6, range: 12 }),
      'deesser=i=0.19:m=0.25:f=0.5'
    ].join(',')
  },
  'c-broad-dynamic': {
    name: 'CADENCE_MASTER_V3_C_BROAD_DYNAMIC (candidate)',
    filterChain: dynEq({ threshold: 0.02, dfrequency: 8500, dqfactor: 3, tfrequency: 8500, tqfactor: 3, attack: 10, release: 120, ratio: 9, range: 16 })
  }
};

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
  console.log(`CADENCE MASTER V3 (candidates -- none approved)

Usage:
  node scripts/cadence-audio-master-v3.mjs --in=<raw.mp3> --out=<out.mp3> --preset=a-dual-band|b-hybrid|c-broad-dynamic

Options:
  --in=PATH       Raw (unprocessed) source MP3. Required. Never modified.
  --out=PATH      Destination for the processed MP3. Required. Overwritten if it exists.
  --preset=NAME   'a-dual-band', 'b-hybrid', or 'c-broad-dynamic'. Required.
  --help          Show this message.

Filter chains:
${Object.entries(PRESETS).map(([k, p]) => `  ${k}:\n    ${p.filterChain}`).join('\n')}
`);
}

function measureLoudness(ffmpeg, inPath, filterChain) {
  const filter = `${filterChain},loudnorm=I=${LOUDNORM.I}:LRA=${LOUDNORM.LRA}:TP=${LOUDNORM.TP}:print_format=json`;
  const result = spawnSync(ffmpeg, ['-hide_banner', '-nostats', '-i', inPath, '-af', filter, '-f', 'null', '-'], { encoding: 'utf8' });
  const raw = (result.stderr || '') + (result.stdout || '');
  const jsonMatch = raw.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse loudnorm measurement pass output. ffmpeg stderr was:\n' + (result.stderr || '(empty)'));
  }
  return JSON.parse(jsonMatch[0]);
}

function applyMastering(ffmpeg, inPath, outPath, filterChain, measured) {
  const filter = [
    filterChain,
    `loudnorm=I=${LOUDNORM.I}:LRA=${LOUDNORM.LRA}:TP=${LOUDNORM.TP}` +
      `:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}` +
      `:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}` +
      ':linear=true:print_format=summary'
  ].join(',');
  execFileSync(ffmpeg, [
    '-hide_banner', '-nostats', '-y',
    '-i', inPath,
    '-af', filter,
    '-ar', String(OUTPUT_SPEC.sampleRateHz),
    '-ac', String(OUTPUT_SPEC.channels),
    '-c:a', OUTPUT_SPEC.codec,
    '-b:a', `${OUTPUT_SPEC.bitrateKbps}k`,
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

  console.log(preset.name);
  console.log(`ffmpeg: ${ffmpeg}`);
  console.log(`in:     ${inPath}`);
  console.log(`out:    ${outPath}`);
  console.log(`chain:  ${preset.filterChain}`);
  console.log('Pass 1/2: measuring loudness...');
  const measured = measureLoudness(ffmpeg, inPath, preset.filterChain);
  console.log('  measured_I=%s measured_TP=%s measured_LRA=%s measured_thresh=%s', measured.input_i, measured.input_tp, measured.input_lra, measured.input_thresh);
  console.log('Pass 2/2: applying filter chain + loudnorm, writing output...');
  applyMastering(ffmpeg, inPath, outPath, preset.filterChain, measured);

  if (!existsSync(outPath) || statSync(outPath).size === 0) {
    console.error('Output file was not created or is empty -- treat this as a failure, not a partial success.');
    process.exitCode = 1;
    return;
  }
  console.log(`Done. Wrote ${statSync(outPath).size} bytes to ${outPath}`);
}

main();
