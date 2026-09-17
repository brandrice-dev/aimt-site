#!/usr/bin/env node
// Groups extracted/normalized Listen Mode chunks into ElevenLabs generation
// batches (player chunks != ElevenLabs batches -- see
// docs/course-audit/listen-mode/00-listen-mode-editorial-standard.md and
// the course-wide production log for the established pattern this reuses),
// writes one .txt payload file per batch, and emits a manifest.
//
// Input: per-module chunk JSON (chunkId, title, text) from
// aimt-listen-source-extract.mjs (or hand-built for Module 1 / the
// restructured Module 8), plus a hardcoded batch-grouping + checkpoint-
// metadata table below (built from each module's own "ElevenLabs
// generation plan" and chunk-map tables in its script doc).
//
// Output: docs/course-audit/listen-mode/tts-final/module-NN/
//   M<n>-BATCH-<id>.txt   (exact TTS payload, one file per generation)
//   manifest.json          (batch -> chunk -> checkpoint mapping, char counts)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const EXTRACT_DIR = process.argv[2];
const OUT_DIR = process.argv[3];

if (!EXTRACT_DIR || !OUT_DIR) {
  console.error('Usage: node scripts/aimt-listen-batch-build.mjs <extract-dir> <out-dir>');
  process.exit(1);
}

// gateType/checkpointId/resumeAfterPass per chunk, module by module --
// transcribed from each module's own script doc (checkpoint sections are
// explicit there); 'normal' is the default and omitted below.
const CHUNK_META = {
  '00': {
    'M0-14': { gateType: 'checkpoint-stop', checkpointId: 'm0cp1' },
    'M0-15': { gateType: 'post-pass', checkpointId: 'm0cp1', resumeAfterPass: true }
  },
  '01': {
    'M1-07': { gateType: 'checkpoint-stop', checkpointId: 'm1cp1' },
    'M1-08': { gateType: 'post-pass', checkpointId: 'm1cp1', resumeAfterPass: true },
    'M1-13': { gateType: 'checkpoint-stop', checkpointId: 'm1cp2' },
    'M1-14': { gateType: 'post-pass', checkpointId: 'm1cp2', resumeAfterPass: true }
  },
  '02': {
    'M2-11': { gateType: 'checkpoint-stop', checkpointId: 'm2cp1' },
    'M2-12': { gateType: 'post-pass', checkpointId: 'm2cp1', resumeAfterPass: true }
  },
  '03': {
    'M3-06': { gateType: 'checkpoint-stop', checkpointId: 'cp1' },
    'M3-07': { gateType: 'post-pass', checkpointId: 'cp1', resumeAfterPass: true },
    'M3-10': { gateType: 'checkpoint-stop', checkpointId: 'cp2' },
    'M3-11': { gateType: 'post-pass', checkpointId: 'cp2', resumeAfterPass: true }
  },
  '04': {
    'M4-05': { gateType: 'checkpoint-stop', checkpointId: 'm4cp1' },
    'M4-06': { gateType: 'post-pass', checkpointId: 'm4cp1', resumeAfterPass: true },
    'M4-10': { gateType: 'checkpoint-stop', checkpointId: 'm4cp2' },
    'M4-11': { gateType: 'post-pass', checkpointId: 'm4cp2', resumeAfterPass: true }
  },
  '05': {
    'M5-06': { gateType: 'checkpoint-stop', checkpointId: 'm5cp1' },
    'M5-07': { gateType: 'post-pass', checkpointId: 'm5cp1', resumeAfterPass: true },
    'M5-10': { gateType: 'checkpoint-stop', checkpointId: 'm5cp2' },
    'M5-11': { gateType: 'post-pass', checkpointId: 'm5cp2', resumeAfterPass: true }
  },
  '06': {
    'M6-05': { gateType: 'checkpoint-stop', checkpointId: 'm6cp1' },
    'M6-06': { gateType: 'post-pass', checkpointId: 'm6cp1', resumeAfterPass: true },
    'M6-09': { gateType: 'checkpoint-stop', checkpointId: 'm6cp2' },
    'M6-10': { gateType: 'post-pass', checkpointId: 'm6cp2', resumeAfterPass: true }
  },
  '07': {
    'M7-07': { gateType: 'checkpoint-stop', checkpointId: 'm7cp1,m7cp2' },
    'M7-08': { gateType: 'post-pass', checkpointId: 'm7cp2', resumeAfterPass: true }
  },
  '08': {
    'M8-08a': { gateType: 'checkpoint-stop', checkpointId: 'm8cp1' },
    'M8-08b': { gateType: 'post-pass', checkpointId: 'm8cp1', resumeAfterPass: true },
    'M8-08c': { gateType: 'checkpoint-stop', checkpointId: 'm8cp2' },
    'M8-09': { gateType: 'post-pass', checkpointId: 'm8cp2', resumeAfterPass: true }
  },
  '09': {
    'M9-06': { gateType: 'checkpoint-stop', checkpointId: 'm10cp1' },
    'M9-07': { gateType: 'post-pass', checkpointId: 'm10cp1', resumeAfterPass: true },
    'M9-08': { gateType: 'checkpoint-stop-then-post-pass', checkpointId: 'm10cp2' },
    'M9-09': { gateType: 'post-pass', checkpointId: 'm10cp2', resumeAfterPass: true }
  },
  '10': {
    'M10-06': { gateType: 'checkpoint-stop', checkpointId: 'm9cp1,m9cp2' },
    'M10-07': { gateType: 'post-pass', checkpointId: 'm9cp2', resumeAfterPass: true }
  },
  '11': {
    'M11-05': { gateType: 'checkpoint-stop-then-post-pass', checkpointId: 'm11cp1' },
    'M11-06': { gateType: 'post-pass-then-checkpoint-stop', checkpointId: 'm11cp1,m11cp2' },
    'M11-07': { gateType: 'post-pass', checkpointId: 'm11cp2', resumeAfterPass: true }
  },
  '12': {}
};

const BATCHES = {
  '00': { A1a: ['M0-01', 'M0-01b', 'M0-02'], A1b: ['M0-03', 'M0-04'], A2: ['M0-05', 'M0-06', 'M0-07', 'M0-08'], A3: ['M0-09', 'M0-10', 'M0-11'], A4: ['M0-12', 'M0-13', 'M0-14'], B1: ['M0-15'] },
  '01': { A1: ['M1-01', 'M1-02', 'M1-03'], A2: ['M1-04', 'M1-05'], A3: ['M1-06', 'M1-07'], B1: ['M1-08', 'M1-09', 'M1-10', 'M1-11'], B2: ['M1-12', 'M1-13'], C1: ['M1-14'] },
  '02': { A1: ['M2-01', 'M2-02', 'M2-03'], A2: ['M2-04', 'M2-05'], A3: ['M2-06', 'M2-07', 'M2-08'], A4: ['M2-09', 'M2-10', 'M2-11'], B1: ['M2-12'] },
  '03': { A1: ['M3-01', 'M3-02', 'M3-03'], A2: ['M3-04'], A3: ['M3-05', 'M3-06'], B1: ['M3-07', 'M3-08'], B2: ['M3-09', 'M3-10'], C1: ['M3-11'] },
  '04': { A1: ['M4-01', 'M4-02'], A2: ['M4-03'], A3: ['M4-04', 'M4-05'], B1: ['M4-06'], B2: ['M4-07', 'M4-08'], B3: ['M4-09', 'M4-10'], C1: ['M4-11'] },
  '05': { A1: ['M5-01', 'M5-02'], A2: ['M5-03', 'M5-04'], A3: ['M5-05', 'M5-06'], B1: ['M5-07', 'M5-08'], B2: ['M5-09', 'M5-10'], C1: ['M5-11'] },
  '06': { A1: ['M6-01', 'M6-02'], A2: ['M6-03'], A3: ['M6-04', 'M6-05'], B1: ['M6-06', 'M6-07'], B2: ['M6-08', 'M6-09'], C1: ['M6-10'] },
  '07': { A1: ['M7-01', 'M7-02'], A2: ['M7-03', 'M7-04'], A3: ['M7-05', 'M7-06', 'M7-07'], B1: ['M7-08'] },
  '08': { A1: ['M8-01', 'M8-02', 'M8-03'], A2: ['M8-04'], A3: ['M8-05'], B1: ['M8-06', 'M8-07', 'M8-08a'], B2: ['M8-08b', 'M8-08c'], C1: ['M8-09'] },
  '09': { A1: ['M9-01', 'M9-02'], A2: ['M9-03'], A3: ['M9-04', 'M9-05', 'M9-06'], B1: ['M9-07'], B2: ['M9-08'], C1: ['M9-09'] },
  '10': { A1: ['M10-01', 'M10-02'], A2: ['M10-03'], A3: ['M10-04'], B1: ['M10-05'], B2: ['M10-06'], C1: ['M10-07'] },
  '11': { A1: ['M11-01', 'M11-02'], A2: ['M11-03'], A3: ['M11-04'], B1: ['M11-05'], B2: ['M11-06'], C1: ['M11-07'] },
  '12': { A1: ['M12-01'] }
};

function firstLine(text) {
  return text.split('\n')[0].slice(0, 140);
}
function lastLine(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  return lines[lines.length - 1].slice(-140);
}

function processModule(mod) {
  const jsonPath = path.join(EXTRACT_DIR, `module-${mod}${mod === '08' ? '-restructured' : ''}.json`);
  const chunks = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const byId = Object.fromEntries(chunks.map((c) => [c.chunkId, c]));
  const modDir = path.join(OUT_DIR, `module-${mod}`);
  mkdirSync(modDir, { recursive: true });

  const batches = BATCHES[mod];
  const meta = CHUNK_META[mod] || {};
  const manifest = { module: mod, batches: [] };

  for (const [batchId, chunkIds] of Object.entries(batches)) {
    const parts = chunkIds.map((id) => {
      if (!byId[id]) throw new Error(`Module ${mod}: chunk ${id} not found in ${jsonPath}`);
      return byId[id];
    });
    const text = parts.map((p) => p.text).join('\n\n');
    const fileName = `M${Number(mod)}-BATCH-${batchId}.txt`;
    writeFileSync(path.join(modDir, fileName), text + '\n');

    manifest.batches.push({
      batchId,
      file: fileName,
      chunkIds,
      normalizedChars: text.length,
      firstSpokenLine: firstLine(parts[0].text),
      lastSpokenLine: lastLine(parts[parts.length - 1].text),
      checkpointRelationship: chunkIds.map((id) => meta[id]?.checkpointId).filter(Boolean).join(' / ') || null,
      overCeiling: text.length >= 4500
    });
  }

  manifest.chunkMeta = chunks.map((c) => ({
    chunkId: c.chunkId,
    title: c.title,
    normalizedChars: c.text.length,
    ...(meta[c.chunkId] || {})
  }));

  writeFileSync(path.join(modDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}

const modules = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const all = {};
for (const mod of modules) {
  all[mod] = processModule(mod);
  console.log(`module-${mod}: ${all[mod].batches.length} batches, ${all[mod].batches.reduce((s, b) => s + b.normalizedChars, 0)} total chars`);
}
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(path.join(OUT_DIR, 'ALL-MODULES-MANIFEST.json'), JSON.stringify(all, null, 2));
