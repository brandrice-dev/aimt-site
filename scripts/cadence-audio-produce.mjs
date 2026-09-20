#!/usr/bin/env node
// CADENCE_AUDIO_MASTER_PRESET_V1 — the LOCKED production pipeline.
// See docs/course-audit/listen-mode/module-01-production-standard-LOCKED.md
// for the full decision record this script implements.
//
// Pipeline (per chunk):
//   raw ElevenLabs MP3 (already on disk, this script does NOT call
//   ElevenLabs -- that step needs the agent's own Creative-connector tool
//   access, not a plain Node process)
//     -> Auphonic conservative Voice AutoEQ finish (REST API, exact locked
//        settings, never reinterpreted)
//     -> local alignment check (envelope cross-correlation, pure Node, no
//        Python/numpy dependency -- verifies a single constant offset with
//        no nonlinear drift before allowing a blend)
//     -> 75% Auphonic / 25% RAW blend (amix, normalize=0, explicit linear
//        weights -- not default auto-gain)
//     -> two-pass loudness normalization (I=-18 LUFS, LRA=7, TP=-2 dBTP)
//     -> canonical production MP3 (44.1kHz, mono, 128kbps)
//
// This script deliberately does NOT edit assets/js/aimt-listen-mode-data.js.
// It prints the exact duration/status values a chunk earned so the agent
// can apply them with a normal, reviewed text edit -- the manifest is
// course-progress-adjacent data, and a mis-fired regex patch across 14
// differently-shaped chunk definitions is a worse risk than one extra
// manual step. This script also NEVER writes qaStatus='APPROVED' anywhere,
// for the same reason it never touches the manifest: approval is the
// owner's call, not this script's.
//
// Secrets: AUPHONIC_API_KEY is read from the environment only. Never
// printed, logged, or written anywhere by this script. If it's missing,
// every chunk in the run is skipped with a clear, single-line reason --
// this script will not silently fall back to a non-Auphonic finish.
//
// Usage:
//   node scripts/cadence-audio-produce.mjs --chunk=m1-05
//   node scripts/cadence-audio-produce.mjs --chunks=m1-05,m1-06,m1-09
//   node scripts/cadence-audio-produce.mjs --help

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, statSync, accessSync, readFileSync, constants as fsConstants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const COURSE_SLUG = 'headspa-mastery';
const MODULE_DIR = path.join(ROOT, 'assets/audio/listen', COURSE_SLUG, 'module-01');
const RAW_DIR = path.join(MODULE_DIR, 'raw');

// ── Locked Auphonic settings (Section 4 of the Master V1 task) -- do not
// reinterpret; this is the exact config from the approved reference. ──
const AUPHONIC_ALGORITHMS = {
  filtering: true, filtermethod: 'autoeq',
  leveler: true, compressor_speech: 'soft',
  normloudness: true, loudnesstarget: -18, maxpeak: -2,
  loudnessmethod: 'dialog',
  denoise: false, deverbamount: 0, debreathamount: -1,
  silence_cutter: false, filler_cutter: false,
  cough_cutter: false, music_cutter: false
};
const LOUDNORM = { I: -18, LRA: 7, TP: -2 };
const OUTPUT_SPEC = { sampleRateHz: 44100, channels: 1, codec: 'libmp3lame', bitrateKbps: 128 };
const BLEND_WEIGHTS = { auphonic: 0.75, raw: 0.25 };

function resolveFfmpeg() {
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return 'ffmpeg'; } catch (e) { /* fall through */ }
  try {
    const resolved = execFileSync('python3', ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'], { encoding: 'utf8' }).trim();
    if (resolved && existsSync(resolved)) {
      try { accessSync(resolved, fsConstants.X_OK); } catch (e) { /* not our job to chmod */ }
      return resolved;
    }
  } catch (e) { /* fall through */ }
  return null;
}

function ffprobeDuration(ffmpeg, filePath) {
  const result = spawnSync(ffmpeg, ['-hide_banner', '-i', filePath], { encoding: 'utf8' });
  const m = (result.stderr || '').match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  if (!m) throw new Error(`Could not read duration of ${filePath}`);
  return (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
}

// ── Alignment: pure-Node envelope cross-correlation (no numpy) ──
function decodePcm16Mono(ffmpeg, filePath, sampleRate) {
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-i', filePath, '-ar', String(sampleRate), '-ac', '1', '-f', 's16le', '-'], { encoding: 'buffer', maxBuffer: 1024 * 1024 * 200 });
  if (result.status !== 0) throw new Error(`ffmpeg PCM decode failed for ${filePath}: ${(result.stderr || '').toString()}`);
  const buf = result.stdout;
  const n = Math.floor(buf.length / 2);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = buf.readInt16LE(i * 2);
  return out;
}

function rmsEnvelope(samples, winSamples) {
  const n = Math.floor(samples.length / winSamples);
  const env = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    const base = i * winSamples;
    for (let j = 0; j < winSamples; j++) { const v = samples[base + j]; sum += v * v; }
    env[i] = Math.sqrt(sum / winSamples + 1e-9);
  }
  return env;
}

function logCenter(env) {
  const out = new Float64Array(env.length);
  let mean = 0;
  for (let i = 0; i < env.length; i++) { out[i] = Math.log(env[i] + 1e-6); mean += out[i]; }
  mean /= env.length;
  for (let i = 0; i < out.length; i++) out[i] -= mean;
  return out;
}

// Correlate `seg` against `search`, sliding seg across search; returns
// { bestIndex, bestCorr (normalized -1..1) }.
function crossCorrelate(search, seg) {
  let bestIdx = 0, bestScore = -Infinity, bestNorm = 0;
  const segEnergy = seg.reduce((s, v) => s + v * v, 0);
  const maxStart = search.length - seg.length;
  for (let start = 0; start <= maxStart; start++) {
    let dot = 0, winEnergy = 0;
    for (let j = 0; j < seg.length; j++) {
      const w = search[start + j];
      dot += w * seg[j];
      winEnergy += w * w;
    }
    if (dot > bestScore) {
      bestScore = dot;
      bestIdx = start;
      const norm = Math.sqrt(segEnergy * winEnergy);
      bestNorm = norm > 0 ? dot / norm : 0;
    }
  }
  return { bestIndex: bestIdx, normCorr: bestNorm };
}

// Verifies a single constant offset (no nonlinear drift) between rawPath
// and auphonicPath by checking 4 segments spread across the file. Returns
// { offsetSec, correlations: number[] } or throws if the offset isn't
// consistent (drift) or correlation is too weak to trust.
function verifyAlignment(ffmpeg, rawPath, auphonicPath) {
  const SR = 16000;
  const WIN_MS = 20;
  const winSamples = Math.round(SR * WIN_MS / 1000);
  const envRate = 1000 / WIN_MS;

  const rawPcm = decodePcm16Mono(ffmpeg, rawPath, SR);
  const aupPcm = decodePcm16Mono(ffmpeg, auphonicPath, SR);
  const rawEnv = logCenter(rmsEnvelope(rawPcm, winSamples));
  const aupEnv = logCenter(rmsEnvelope(aupPcm, winSamples));

  const rawDurSec = rawPcm.length / SR;
  const segLenSec = 12;
  const candidates = [0.10, 0.30, 0.55, 0.80].map((frac) => Math.max(1, Math.min(rawDurSec - segLenSec - 1, frac * rawDurSec)));

  const results = [];
  for (const segStart of candidates) {
    const segStartIdx = Math.round(segStart * envRate);
    const segLenIdx = Math.round(segLenSec * envRate);
    if (segStartIdx + segLenIdx > rawEnv.length) continue;
    const seg = rawEnv.slice(segStartIdx, segStartIdx + segLenIdx);
    // Search the whole Auphonic envelope -- offset is unknown a priori for a fresh chunk.
    const { bestIndex, normCorr } = crossCorrelate(aupEnv, seg);
    const offsetSec = (bestIndex / envRate) - segStart;
    results.push({ segStart, offsetSec, normCorr });
  }

  if (results.length < 3) throw new Error('Not enough valid segments to verify alignment (file too short?)');

  const offsets = results.map((r) => r.offsetSec);
  const spread = Math.max(...offsets) - Math.min(...offsets);
  const weakest = Math.min(...results.map((r) => r.normCorr));

  return {
    offsetSec: offsets[0],
    perSegment: results,
    consistent: spread < 0.15, // under 150ms spread across the file = treated as one constant offset, not drift
    strong: weakest > 0.6,     // a real, confident match, not noise
    spread,
    weakest
  };
}

// ── Auphonic REST API ──
async function auphonicRequest(apiKey, method, url, { json, formFile } = {}) {
  const headers = { Authorization: `Bearer ${apiKey}` };
  let body;
  if (json) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(json); }
  if (formFile) {
    const fd = new FormData();
    const bytes = readFileSync(formFile.path);
    fd.append(formFile.field, new Blob([bytes]), path.basename(formFile.path));
    body = fd;
  }
  const res = await fetch(url, { method, headers, body });
  const data = await res.json();
  if (data.status_code && data.status_code !== 200) {
    throw new Error(`Auphonic API error (${url}): ${data.error_message || JSON.stringify(data.form_errors)}`);
  }
  return data.data !== undefined ? data.data : data;
}

async function auphonicProcess(apiKey, rawPath, title) {
  const created = await auphonicRequest(apiKey, 'POST', 'https://auphonic.com/api/productions.json', {
    json: { title, algorithms: AUPHONIC_ALGORITHMS, output_files: [{ format: 'mp3', bitrate: 128 }] }
  });
  const uuid = created.uuid;
  await auphonicRequest(apiKey, 'POST', `https://auphonic.com/api/production/${uuid}/upload.json`, {
    formFile: { field: 'input_file', path: rawPath }
  });
  await auphonicRequest(apiKey, 'POST', `https://auphonic.com/api/production/${uuid}/start.json`, {});

  const start = Date.now();
  const timeoutMs = 5 * 60 * 1000;
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 5000));
    const status = await auphonicRequest(apiKey, 'GET', `https://auphonic.com/api/production/${uuid}/status.json`);
    if (status.status_string === 'Done') break;
    if (status.status_string && /Error|Incomplete/i.test(status.status_string) && status.error_message) {
      throw new Error(`Auphonic production ${uuid} failed: ${status.error_message}`);
    }
  }
  const full = await auphonicRequest(apiKey, 'GET', `https://auphonic.com/api/production/${uuid}.json`);
  if (full.status_string !== 'Done') throw new Error(`Auphonic production ${uuid} did not complete within timeout (last status: ${full.status_string})`);
  const outFile = (full.output_files || [])[0];
  if (!outFile || !outFile.download_url) throw new Error(`Auphonic production ${uuid} has no downloadable output`);
  return { uuid, downloadUrl: outFile.download_url, usedCredits: full.used_credits };
}

async function downloadFile(url, apiKey, destPath) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` }, redirect: 'follow' });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await import('node:fs/promises').then((fs) => fs.writeFile(destPath, buf));
}

// ── Blend + loudnorm ──
function measureLoudness(ffmpeg, filterComplex, outLabel, auphonicPath, rawPath) {
  const args = ['-hide_banner', '-nostats', '-i', auphonicPath, '-i', rawPath, '-filter_complex', filterComplex, '-map', `[${outLabel}]`, '-f', 'null', '-'];
  const result = spawnSync(ffmpeg, args, { encoding: 'utf8' });
  const raw = (result.stderr || '') + (result.stdout || '');
  const m = raw.match(/\{[\s\S]*?\}/);
  if (!m) throw new Error('Could not parse loudnorm measurement pass output:\n' + raw.slice(-2000));
  return JSON.parse(m[0]);
}

function blendAndMaster(ffmpeg, auphonicAlignedPath, rawPath, outPath, offsetSec, rawDurationSec) {
  const trim = `atrim=start=${offsetSec.toFixed(3)}:duration=${rawDurationSec.toFixed(3)},asetpts=PTS-STARTPTS`;
  const mix = `[0:a]${trim}[auph];[auph][1:a]amix=inputs=2:duration=first:weights='${BLEND_WEIGHTS.auphonic} ${BLEND_WEIGHTS.raw}':normalize=0[mixed]`;

  const measureChain = `${mix};[mixed]loudnorm=I=${LOUDNORM.I}:LRA=${LOUDNORM.LRA}:TP=${LOUDNORM.TP}:print_format=json[out]`;
  const measured = measureLoudness(ffmpeg, measureChain, 'out', auphonicAlignedPath, rawPath);

  const applyChain = `${mix};[mixed]loudnorm=I=${LOUDNORM.I}:LRA=${LOUDNORM.LRA}:TP=${LOUDNORM.TP}` +
    `:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}` +
    `:linear=true:print_format=summary[out]`;
  execFileSync(ffmpeg, [
    '-hide_banner', '-nostats', '-y', '-i', auphonicAlignedPath, '-i', rawPath,
    '-filter_complex', applyChain, '-map', '[out]',
    '-ar', String(OUTPUT_SPEC.sampleRateHz), '-ac', String(OUTPUT_SPEC.channels),
    '-c:a', OUTPUT_SPEC.codec, '-b:a', `${OUTPUT_SPEC.bitrateKbps}k`,
    outPath
  ], { stdio: 'inherit' });
  return measured;
}

// ── Per-chunk pipeline ──
async function produceChunk(chunkId, { apiKey, ffmpeg, tmpDir }) {
  const rawPath = path.join(RAW_DIR, `${chunkId}.mp3`);
  const canonicalPath = path.join(MODULE_DIR, `${chunkId}.mp3`);
  console.log(`\n=== ${chunkId} ===`);

  if (!existsSync(rawPath)) {
    console.log(`  SKIP: no raw file at ${rawPath} (generate it first -- this script does not call ElevenLabs)`);
    return { chunkId, ok: false, reason: 'missing raw' };
  }
  const rawDuration = ffprobeDuration(ffmpeg, rawPath);
  console.log(`  raw: ${rawPath} (${rawDuration.toFixed(2)}s)`);

  console.log('  Auphonic: creating production...');
  const { uuid, downloadUrl, usedCredits } = await auphonicProcess(apiKey, rawPath, `AIMT ${chunkId} production`);
  console.log(`  Auphonic: done (uuid=${uuid}, credits=${JSON.stringify(usedCredits)})`);

  const auphonicTmpPath = path.join(tmpDir, `${chunkId}-auphonic-raw.mp3`);
  await downloadFile(downloadUrl, apiKey, auphonicTmpPath);
  console.log(`  Auphonic output downloaded: ${auphonicTmpPath}`);

  console.log('  Verifying alignment...');
  const alignment = verifyAlignment(ffmpeg, rawPath, auphonicTmpPath);
  console.log(`  alignment: offset=${alignment.offsetSec.toFixed(3)}s spread=${alignment.spread.toFixed(3)}s weakest_corr=${alignment.weakest.toFixed(3)}`);
  if (!alignment.strong || !alignment.consistent) {
    console.log(`  SKIP: alignment not trustworthy (consistent=${alignment.consistent}, strong=${alignment.strong}) -- refusing to blend a possibly-misaligned pair`);
    return { chunkId, ok: false, reason: 'alignment failed', alignment };
  }

  console.log('  Blending 75% Auphonic / 25% RAW + two-pass loudnorm...');
  const measured = blendAndMaster(ffmpeg, auphonicTmpPath, rawPath, canonicalPath, alignment.offsetSec, rawDuration);

  const finalDuration = ffprobeDuration(ffmpeg, canonicalPath);
  const sizeBytes = statSync(canonicalPath).size;
  if (sizeBytes === 0) throw new Error(`Output for ${chunkId} is empty`);
  console.log(`  DONE: ${canonicalPath} (${finalDuration.toFixed(2)}s, ${sizeBytes} bytes)`);
  console.log(`  Manifest values to apply (NOT written automatically): duration: ${finalDuration.toFixed(2)}, qaStatus: 'GENERATED'`);

  return { chunkId, ok: true, duration: finalDuration, alignment, usedCredits, canonicalPath };
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
  console.log(`CADENCE_AUDIO_MASTER_PRESET_V1 production pipeline

Usage:
  node scripts/cadence-audio-produce.mjs --chunk=m1-05
  node scripts/cadence-audio-produce.mjs --chunks=m1-05,m1-06,m1-09

Requires:
  - raw/<chunk>.mp3 already present (generate via the ElevenLabs Creative
    connector first -- this script does not and cannot call it)
  - AUPHONIC_API_KEY in the environment (never printed/logged)

Never modifies assets/js/aimt-listen-mode-data.js and never sets
qaStatus='APPROVED' -- prints the values earned so they can be applied by
hand/agent review.
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.chunk && !args.chunks)) { printHelp(); process.exitCode = args.help ? 0 : 1; return; }

  const apiKey = process.env.AUPHONIC_API_KEY;
  if (!apiKey) {
    console.error('AUPHONIC_API_KEY is not set. Per the locked production standard, this script will not fall back to a non-Auphonic finish -- stopping before processing anything.');
    process.exitCode = 1;
    return;
  }

  const ffmpeg = resolveFfmpeg();
  if (!ffmpeg) { console.error('No usable ffmpeg found.'); process.exitCode = 1; return; }

  const chunkIds = args.chunk ? [args.chunk] : args.chunks.split(',').map((s) => s.trim()).filter(Boolean);
  const tmpDir = path.join(ROOT, '.tmp-audio-produce');
  await import('node:fs/promises').then((fs) => fs.mkdir(tmpDir, { recursive: true }));

  const results = [];
  for (const chunkId of chunkIds) {
    try {
      results.push(await produceChunk(chunkId, { apiKey, ffmpeg, tmpDir }));
    } catch (e) {
      console.error(`  FAILED: ${chunkId}: ${e.message}`);
      results.push({ chunkId, ok: false, reason: e.message });
    }
  }

  console.log('\n=== Summary ===');
  for (const r of results) console.log(`  ${r.chunkId}: ${r.ok ? `OK (${r.duration.toFixed(2)}s)` : `FAILED (${r.reason})`}`);
  if (results.some((r) => !r.ok)) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();

// Exported for testing (verifyAlignment in particular -- the one genuinely
// new, non-trivial piece of logic in this script) without running the CLI.
export { verifyAlignment, crossCorrelate, resolveFfmpeg, ffprobeDuration, decodePcm16Mono, rmsEnvelope, logCenter, blendAndMaster };
