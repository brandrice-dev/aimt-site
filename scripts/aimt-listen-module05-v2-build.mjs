#!/usr/bin/env node
// ONE-OFF, Module-5-only batch builder for the strict-fidelity rebuild --
// mirrors aimt-listen-module04-v6-build.mjs exactly (same pattern, kept
// separate so this pass cannot touch any other module's already-built
// batch files).
//
// Input: /tmp/aimt-listen-extract/module-05-v2.json (15 hand-rebuilt,
// AIMT-normalized chunks, audited against the live headspa-mastery.html
// in docs/course-audit/listen-mode/module-05-fidelity-coverage-audit.md).
// Output: docs/course-audit/listen-mode/tts-final/module-05/M5-BATCH-*.txt
// + manifest.json (v2). The rejected v1 batches/manifest were moved to
// this same directory's archive-loose-v1/ before this script ran.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const chunks = JSON.parse(readFileSync('/tmp/aimt-listen-extract/module-05-v2.json', 'utf8'));
const byId = Object.fromEntries(chunks.map((c) => [c.chunkId, c]));

const CHECKPOINT_META = {
  'M5-08': { gateType: 'checkpoint-stop', checkpointId: 'm5cp1' },
  'M5-09': { gateType: 'post-pass', checkpointId: 'm5cp1', resumeAfterPass: true },
  'M5-14': { gateType: 'checkpoint-stop', checkpointId: 'm5cp2' },
  'M5-15': { gateType: 'post-pass', checkpointId: 'm5cp2', resumeAfterPass: true }
};

// Checkpoint chunks kept in their own batch (chunking standard's
// short-checkpoint exemption + "split at a checkpoint boundary first"
// priority). M5-05 (5 full patterns) and M5-06 (signature interaction,
// all 12 option/feedback pairs) are each kept intact in their own batch
// rather than split, since both are single tightly-coupled units under
// the strict-fidelity standard -- neither may be divided mid-pattern or
// mid-scenario.
const BATCHES = {
  A1: ['M5-01', 'M5-02'],
  A2: ['M5-03', 'M5-04'],
  A3: ['M5-05'],
  A4: ['M5-06'],
  A5: ['M5-07'],
  A6: ['M5-08'],
  B1: ['M5-09', 'M5-10'],
  B2: ['M5-11', 'M5-12'],
  B3: ['M5-13'],
  B4: ['M5-14'],
  C1: ['M5-15']
};

const OUT_DIR = 'docs/course-audit/listen-mode/tts-final/module-05';
mkdirSync(OUT_DIR, { recursive: true });

function firstLine(text) { return text.split('\n')[0].slice(0, 140); }
function lastLine(text) { const l = text.trim().split('\n').filter(Boolean); return l[l.length - 1].slice(-140); }

const manifest = { module: '05', version: 'v2-strict-fidelity', batches: [] };
let totalChars = 0;

for (const [batchId, chunkIds] of Object.entries(BATCHES)) {
  const parts = chunkIds.map((id) => {
    if (!byId[id]) throw new Error(`Missing chunk ${id}`);
    return byId[id];
  });
  const text = parts.map((p) => p.text).join('\n\n');
  const fileName = `M5-BATCH-${batchId}.txt`;
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
console.log(`Module 5 v2: ${manifest.batches.length} batches, ${totalChars} total chars`);
manifest.batches.forEach((b) => console.log(`  ${b.batchId}: ${b.normalizedChars} chars, chunks ${b.chunkIds.join(',')}, checkpoint ${b.checkpointRelationship || '--'}`));
