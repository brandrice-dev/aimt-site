#!/usr/bin/env node
// Validates every *-EDIT.wav against: (a) correct PCM format (mono, 16-bit,
// 44.1kHz), (b) its corresponding batch's ElevenLabs-reported duration in
// GENERATION-LOG.json, flagging any EDIT.wav that decoded meaningfully
// shorter/longer than the source generation actually was.

import { readFileSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';

const log = JSON.parse(readFileSync('docs/course-audit/listen-mode/tts-final/GENERATION-LOG.json', 'utf8'));

// Map rawFile path -> logged durationSecs, using the LATEST log entry for
// that exact rawFile path (the log is append-only and Module 1's v1 batches
// share no path with v6 since v1 audio was archived to a different path).
const byRawFile = {};
for (const e of log.entries) {
  if (e.rawFile) byRawFile[e.rawFile] = e;
}

function wavInfo(path) {
  // Minimal WAV header parse: find 'fmt ' and 'data' chunks.
  const buf = readFileSync(path);
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('not a RIFF/WAVE file');
  }
  let offset = 12;
  let fmt = null, dataSize = null;
  while (offset + 8 <= buf.length) {
    const chunkId = buf.toString('ascii', offset, offset + 4);
    const chunkSize = buf.readUInt32LE(offset + 4);
    if (chunkId === 'fmt ') {
      fmt = {
        audioFormat: buf.readUInt16LE(offset + 8),
        channels: buf.readUInt16LE(offset + 10),
        sampleRate: buf.readUInt32LE(offset + 12),
        bitsPerSample: buf.readUInt16LE(offset + 22)
      };
    } else if (chunkId === 'data') {
      dataSize = chunkSize;
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }
  if (!fmt || dataSize === null) throw new Error('missing fmt or data chunk');
  const bytesPerFrame = fmt.channels * (fmt.bitsPerSample / 8);
  const durationSec = dataSize / bytesPerFrame / fmt.sampleRate;
  return { ...fmt, dataSize, durationSec };
}

const editFiles = execSync(`find AIMT-Listen-Mode-Final -name "*-EDIT.wav" -not -path "*archive-loose-v1*"`).toString().trim().split('\n').sort();

let failCount = 0;
console.log(`Validating ${editFiles.length} EDIT.wav files...\n`);

for (const editPath of editFiles) {
  const rawPath = editPath.replace(/-EDIT\.wav$/, '-RAW.mp3');
  const errors = [];
  let info;
  try {
    info = wavInfo(editPath);
  } catch (e) {
    console.log(`FAIL ${editPath}: ${e.message}`);
    failCount++;
    continue;
  }
  if (info.channels !== 1) errors.push(`channels=${info.channels}, expected 1`);
  if (info.bitsPerSample !== 16) errors.push(`bitsPerSample=${info.bitsPerSample}, expected 16`);
  if (info.sampleRate !== 44100) errors.push(`sampleRate=${info.sampleRate}, expected 44100`);
  if (info.audioFormat !== 1) errors.push(`audioFormat=${info.audioFormat}, expected 1 (PCM)`);

  const logEntry = byRawFile[rawPath];
  if (logEntry) {
    const diff = Math.abs(info.durationSec - logEntry.durationSecs);
    if (diff > 1.0) {
      errors.push(`duration mismatch vs generation log: EDIT.wav=${info.durationSec.toFixed(2)}s, ElevenLabs reported=${logEntry.durationSecs}s, diff=${diff.toFixed(2)}s`);
    }
  } else {
    errors.push(`no matching GENERATION-LOG.json entry for ${rawPath} (could not cross-check duration)`);
  }

  if (errors.length) {
    console.log(`FAIL ${editPath}:`);
    errors.forEach((e) => console.log(`  - ${e}`));
    failCount++;
  } else {
    console.log(`OK   ${editPath} (${info.durationSec.toFixed(2)}s, matches source within ${Math.abs(info.durationSec - logEntry.durationSecs).toFixed(2)}s)`);
  }
}

console.log(`\n${editFiles.length - failCount}/${editFiles.length} passed.`);
process.exit(failCount === 0 ? 0 : 1);
