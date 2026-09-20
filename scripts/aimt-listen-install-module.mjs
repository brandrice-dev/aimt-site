#!/usr/bin/env node
// Generalized Listen Mode batch-cutter/installer — cuts each module's
// owner-CapCut-processed batch masters (AIMT-Listen-Mode-Final/<NN>/
// M<n>-BATCH-<id>-PROCESSED.{wav,WAV,MP3,...}) into individual player chunk
// mp3s and installs them at assets/audio/listen/<courseSlug>/module-<NN>/
// <chunkId>.mp3, per the schema documented in assets/js/aimt-listen-mode-data.js.
//
// Method (mirrors the already-approved Module 1 install + the position-
// anchored cut-point method in scripts/aimt-listen-cut-finder.mjs):
//   - A batch with exactly one chunk is copied/re-encoded directly -- no
//     splitting, no guessing.
//   - A batch with multiple chunks is split at each internal chunk boundary.
//     Each boundary's cut point is estimated from the character offset of
//     the next chunk's first ~40 chars (a literal marker string) within the
//     batch's validated .txt payload, scaled proportionally against the
//     batch's real total duration, then SNAPPED to the nearest real detected
//     silence (ffmpeg silencedetect, noise=-32dB:d=0.4) within a bounded
//     search window. A boundary with no plausible nearby silence is reported
//     and the script stops rather than guessing a blind cut.
//   - Every chunk is written as a WAV first (exact PCM segment, no
//     re-encoding loss), duration-measured, THEN encoded to mp3
//     (libmp3lame, -q:a 2) as the final production file.
//   - Leading/trailing natural silence is measured per installed chunk
//     (noise=-35dB:d=0.15, matching module-01-section-gap-measurements.md's
//     exact method) so transitionGapMs can be computed the same way Module 1's
//     was: target gap minus already-present natural silence, never a blind
//     flat value.
//
// This script never touches Module 1's or Module 12's existing entries, and
// never writes anything if a boundary can't be confidently located -- see
// "STOP:" messages.
//
// Usage:
//   node scripts/aimt-listen-install-module.mjs --config=<path-to-module-config.json> --outDir=<staging-dir>
//
// The config JSON shape is documented inline below (see CONFIG SHAPE).

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';

function resolveFfmpeg() {
  if (process.env.AIMT_FFMPEG && existsSync(process.env.AIMT_FFMPEG)) return process.env.AIMT_FFMPEG;
  try {
    const out = execFileSync('which', ['ffmpeg'], { encoding: 'utf8' }).trim();
    if (out) return out;
  } catch {}
  throw new Error('No ffmpeg binary found. Set AIMT_FFMPEG=<path> or put ffmpeg on PATH.');
}

function runCaptureStderr(ffmpeg, args) {
  const result = spawnSync(ffmpeg, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return result.stderr || '';
}

function getDuration(ffmpeg, filePath) {
  const stderr = runCaptureStderr(ffmpeg, ['-i', filePath]);
  const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  if (!m) throw new Error('Could not parse duration for ' + filePath + '\n' + stderr.slice(0, 500));
  return (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]);
}

function detectSilences(ffmpeg, filePath, noiseDb, minDur) {
  const stderr = runCaptureStderr(ffmpeg, [
    '-i', filePath, '-af', `silencedetect=noise=${noiseDb}dB:d=${minDur}`, '-f', 'null', '-'
  ]);
  const starts = [...stderr.matchAll(/silence_start:\s*(-?\d+\.?\d*)/g)].map((m) => parseFloat(m[1]));
  const ends = [...stderr.matchAll(/silence_end:\s*(-?\d+\.?\d*)\s*\|\s*silence_duration:\s*(-?\d+\.?\d*)/g)]
    .map((m) => ({ end: parseFloat(m[1]), duration: parseFloat(m[2]) }));
  const out = [];
  for (let i = 0; i < Math.min(starts.length, ends.length); i++) {
    out.push({ start: starts[i], end: ends[i].end, duration: ends[i].duration });
  }
  return out;
}

function findMarkerCutSec(ffmpeg, processedPath, fullText, totalDuration, marker, afterCharOffset) {
  const idx = fullText.indexOf(marker, afterCharOffset);
  if (idx === -1) return { error: `marker not found after offset ${afterCharOffset}: "${marker}"` };
  const estimateSec = (idx / fullText.length) * totalDuration;
  const silences = detectSilences(ffmpeg, processedPath, -32, 0.4);
  let best = null, bestDist = Infinity;
  for (const s of silences) {
    const mid = (s.start + s.end) / 2;
    const dist = Math.abs(mid - estimateSec);
    if (dist < bestDist) { bestDist = dist; best = s; }
  }
  const SEARCH_WINDOW_SEC = 25; // batches run up to ~3.5 min; generous window for a proportional estimate
  if (!best || bestDist > SEARCH_WINDOW_SEC) {
    return { error: `no plausible silence within ${SEARCH_WINDOW_SEC}s of estimate ${estimateSec.toFixed(2)}s for marker "${marker}"`, estimateSec, charOffset: idx };
  }
  const cutSec = (best.start + best.end) / 2;
  return { cutSec, estimateSec, charOffset: idx, silence: best };
}

function extractSegment(ffmpeg, inputPath, startSec, endSec, outPath) {
  const args = ['-y', '-i', inputPath];
  if (startSec != null) args.push('-ss', String(startSec));
  if (endSec != null) args.push('-t', String(endSec - (startSec || 0)));
  args.push('-c:a', 'pcm_s16le', outPath);
  execFileSync(ffmpeg, args, { encoding: 'utf8' });
}

function encodeMp3(ffmpeg, wavPath, mp3Path) {
  execFileSync(ffmpeg, ['-y', '-i', wavPath, '-c:a', 'libmp3lame', '-q:a', '2', mp3Path], { encoding: 'utf8' });
}

function measureLeadTrail(ffmpeg, filePath) {
  const dur = getDuration(ffmpeg, filePath);
  const sil = detectSilences(ffmpeg, filePath, -35, 0.15);
  let leading = 0, trailing = 0;
  if (sil.length) {
    const first = sil[0];
    if (first.start <= 0.05) leading = first.duration;
    const last = sil[sil.length - 1];
    if (!last.end || Math.abs(last.end - dur) <= 0.25 || last.end >= dur - 0.05) {
      trailing = dur - last.start;
    }
  }
  return { duration: dur, leading, trailing };
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

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.config) { console.error('Usage: --config=<module-config.json> --outDir=<dir>'); process.exit(1); }
  const config = JSON.parse(readFileSync(args.config, 'utf8'));
  const outDir = args.outDir || `/tmp/aimt-listen-install/module-${config.module}`;
  mkdirSync(outDir, { recursive: true });

  const ffmpeg = resolveFfmpeg();
  console.log(`ffmpeg: ${ffmpeg}`);
  console.log(`Module ${config.module} -- ${config.batches.length} batches\n`);

  const results = [];
  let stop = false;

  for (const batch of config.batches) {
    console.log(`--- Batch ${batch.batchId} (${batch.processedPath}) ---`);
    if (!existsSync(batch.processedPath)) {
      console.log(`STOP: PROCESSED file missing: ${batch.processedPath}`);
      stop = true;
      break;
    }
    const totalDuration = getDuration(ffmpeg, batch.processedPath);
    console.log(`  total duration: ${totalDuration.toFixed(3)}s, chunks: ${batch.chunks.map((c) => c.chunkId).join(', ')}`);

    if (batch.chunks.length === 1) {
      const c = batch.chunks[0];
      const wavOut = path.join(outDir, `${c.chunkId}.wav`);
      extractSegment(ffmpeg, batch.processedPath, null, null, wavOut);
      results.push({ chunkId: c.chunkId, wavOut, start: 0, end: totalDuration });
      console.log(`  ${c.chunkId}: full batch, ${totalDuration.toFixed(3)}s -> ${wavOut}`);
      continue;
    }

    const fullText = readFileSync(batch.textPath, 'utf8');
    const cutPoints = [0];
    let afterOffset = 0;
    for (let i = 1; i < batch.chunks.length; i++) {
      const marker = batch.chunks[i].marker;
      const r = findMarkerCutSec(ffmpeg, batch.processedPath, fullText, totalDuration, marker, afterOffset);
      if (r.error) {
        console.log(`  STOP: ${r.error}`);
        stop = true;
        break;
      }
      console.log(`  boundary before ${batch.chunks[i].chunkId}: estimate ${r.estimateSec.toFixed(2)}s -> snapped ${r.cutSec.toFixed(2)}s (silence ${r.silence.start.toFixed(2)}-${r.silence.end.toFixed(2)}s, dur ${r.silence.duration.toFixed(2)}s)`);
      cutPoints.push(r.cutSec);
      afterOffset = r.charOffset;
    }
    if (stop) break;
    cutPoints.push(totalDuration);

    for (let i = 0; i < batch.chunks.length; i++) {
      const c = batch.chunks[i];
      const start = cutPoints[i];
      const end = cutPoints[i + 1];
      const wavOut = path.join(outDir, `${c.chunkId}.wav`);
      extractSegment(ffmpeg, batch.processedPath, start, end, wavOut);
      results.push({ chunkId: c.chunkId, wavOut, start, end });
      console.log(`  ${c.chunkId}: ${start.toFixed(3)}s - ${end.toFixed(3)}s (${(end - start).toFixed(3)}s) -> ${wavOut}`);
    }
  }

  if (stop) {
    console.log('\nSTOPPED -- no files finalized past this point. Nothing installed to production.');
    process.exitCode = 1;
    return;
  }

  console.log('\n--- Encoding to mp3 + measuring lead/trail silence ---');
  const finalMeta = [];
  for (const r of results) {
    const mp3Out = r.wavOut.replace(/\.wav$/, '.mp3');
    encodeMp3(ffmpeg, r.wavOut, mp3Out);
    const meas = measureLeadTrail(ffmpeg, mp3Out);
    finalMeta.push({ chunkId: r.chunkId, mp3: mp3Out, duration: meas.duration, leading: meas.leading, trailing: meas.trailing });
    console.log(`  ${r.chunkId}: ${meas.duration.toFixed(3)}s (leading ${meas.leading.toFixed(3)}s, trailing ${meas.trailing.toFixed(3)}s) -> ${mp3Out}`);
  }

  const metaPath = path.join(outDir, `module-${config.module}-install-meta.json`);
  writeFileSync(metaPath, JSON.stringify(finalMeta, null, 2));
  console.log(`\nWrote ${metaPath}`);
  console.log('All chunks staged. Review before copying into assets/audio/listen/**.');
}

main();
