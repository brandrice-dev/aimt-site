#!/usr/bin/env node
// ONE-OFF, Module-1-only batch builder for the strict-fidelity rebuild.
// Deliberately separate from aimt-listen-batch-build.mjs (which processes
// all 13 modules) so this pass cannot touch Module 4, Module 5, or any
// other module's already-built batch files.
//
// Input: /tmp/aimt-listen-extract/module-01-v6.json (14 hand-rebuilt,
// AIMT-normalized chunks, audited against the live headspa-mastery.html
// in docs/course-audit/listen-mode/module-01-fidelity-coverage-audit.md).
// Output: docs/course-audit/listen-mode/tts-final/module-01/M1-BATCH-*.txt
// + manifest.json (v6).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const chunks = JSON.parse(readFileSync('/tmp/aimt-listen-extract/module-01-v6.json', 'utf8'));
const byId = Object.fromEntries(chunks.map((c) => [c.chunkId, c]));

const CHECKPOINT_META = {
  'M1-07': { gateType: 'checkpoint-stop', checkpointId: 'm1cp1' },
  'M1-08': { gateType: 'post-pass', checkpointId: 'm1cp1', resumeAfterPass: true },
  'M1-13': { gateType: 'checkpoint-stop', checkpointId: 'm1cp2' },
  'M1-14': { gateType: 'post-pass', checkpointId: 'm1cp2', resumeAfterPass: true }
};

// Same 6-batch grouping as v1 -- still respects checkpoint boundaries and
// stays comfortably under the safety threshold with the new (tighter but
// more complete) char counts.
const BATCHES = {
  A1: ['M1-01', 'M1-02', 'M1-03'],
  A2: ['M1-04', 'M1-05'],
  A3: ['M1-06', 'M1-07'],
  B1: ['M1-08', 'M1-09', 'M1-10', 'M1-11'],
  B2: ['M1-12', 'M1-13'],
  C1: ['M1-14']
};

const OUT_DIR = 'docs/course-audit/listen-mode/tts-final/module-01';
mkdirSync(OUT_DIR, { recursive: true });

function firstLine(text) { return text.split('\n')[0].slice(0, 140); }
function lastLine(text) { const l = text.trim().split('\n').filter(Boolean); return l[l.length - 1].slice(-140); }

const manifest = { module: '01', version: 'v6-strict-fidelity', batches: [] };
let totalChars = 0;

for (const [batchId, chunkIds] of Object.entries(BATCHES)) {
  const parts = chunkIds.map((id) => {
    if (!byId[id]) throw new Error(`Missing chunk ${id}`);
    return byId[id];
  });
  const text = parts.map((p) => p.text).join('\n\n');
  const fileName = `M1-BATCH-${batchId}.txt`;
  writeFileSync(`${OUT_DIR}/${fileName}`, text + '\n');
  totalChars += text.length;

  manifest.batches.push({
    batchId,
    file: fileName,
    chunkIds,
    normalizedChars: text.length,
    firstSpokenLine: firstLine(parts[0].text),
    lastSpokenLine: lastLine(parts[parts.length - 1].text),
    checkpointRelationship: chunkIds.map((id) => CHECKPOINT_META[id]?.checkpointId).filter(Boolean).join(' / ') || null,
    overCeiling: text.length >= 4500
  });
}

manifest.chunkMeta = chunks.map((c) => ({
  chunkId: c.chunkId,
  title: c.title,
  normalizedChars: c.text.length,
  ...(CHECKPOINT_META[c.chunkId] || {})
}));

writeFileSync(`${OUT_DIR}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log(`Module 1 v6: ${manifest.batches.length} batches, ${totalChars} total chars`);
manifest.batches.forEach((b) => console.log(`  ${b.batchId}: ${b.normalizedChars} chars, chunks ${b.chunkIds.join(',')}, checkpoint ${b.checkpointRelationship || '--'}`));
