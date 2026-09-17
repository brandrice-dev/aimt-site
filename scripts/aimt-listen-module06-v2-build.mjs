#!/usr/bin/env node
// ONE-OFF, Module-6-only batch builder for the strict-fidelity rebuild --
// mirrors aimt-listen-module05-v2-build.mjs exactly (same pattern, kept
// separate so this pass cannot touch any other module's already-built
// batch files).
//
// Input: /tmp/aimt-listen-extract/module-06-v2.json (14 hand-rebuilt,
// AIMT-normalized chunks, audited against the live headspa-mastery.html
// in docs/course-audit/listen-mode/module-06-fidelity-coverage-audit.md).
// Output: docs/course-audit/listen-mode/tts-final/module-06/M6-BATCH-*.txt
// + manifest.json (v2). The rejected v1 batches/manifest were moved to
// this same directory's archive-loose-v1/ before this script ran.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const chunks = JSON.parse(readFileSync('/tmp/aimt-listen-extract/module-06-v2.json', 'utf8'));
const byId = Object.fromEntries(chunks.map((c) => [c.chunkId, c]));

const CHECKPOINT_META = {
  'M6-06': { gateType: 'checkpoint-stop', checkpointId: 'm6cp1' },
  'M6-07': { gateType: 'post-pass', checkpointId: 'm6cp1', resumeAfterPass: true },
  'M6-13': { gateType: 'checkpoint-stop', checkpointId: 'm6cp2' },
  'M6-14': { gateType: 'post-pass', checkpointId: 'm6cp2', resumeAfterPass: true }
};

// Checkpoint chunks kept in their own batch (chunking standard's
// short-checkpoint exemption + "split at a checkpoint boundary first"
// priority). M6-03 (both full comparison profiles), M6-04 (all 6 cycle
// steps), M6-05 (3 scenarios + final-reasoning resolution), and M6-10
// (signature interaction, all 9 option/feedback pairs) are each kept
// intact in their own batch rather than split, since each is a single
// tightly-coupled unit under the strict-fidelity standard -- none may be
// divided mid-card, mid-step, mid-scenario, or mid-presentation.
const BATCHES = {
  A1: ['M6-01', 'M6-02'],
  A2: ['M6-03'],
  A3: ['M6-04'],
  A4: ['M6-05'],
  A5: ['M6-06'],
  B1: ['M6-07', 'M6-08'],
  B2: ['M6-09', 'M6-10'],
  B3: ['M6-11'],
  B4: ['M6-12'],
  B5: ['M6-13'],
  C1: ['M6-14']
};

const OUT_DIR = 'docs/course-audit/listen-mode/tts-final/module-06';
mkdirSync(OUT_DIR, { recursive: true });

function firstLine(text) { return text.split('\n')[0].slice(0, 140); }
function lastLine(text) { const l = text.trim().split('\n').filter(Boolean); return l[l.length - 1].slice(-140); }

const manifest = { module: '06', version: 'v2-strict-fidelity', batches: [] };
let totalChars = 0;

for (const [batchId, chunkIds] of Object.entries(BATCHES)) {
  const parts = chunkIds.map((id) => {
    if (!byId[id]) throw new Error(`Missing chunk ${id}`);
    return byId[id];
  });
  const text = parts.map((p) => p.text).join('\n\n');
  const fileName = `M6-BATCH-${batchId}.txt`;
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
console.log(`Module 6 v2: ${manifest.batches.length} batches, ${totalChars} total chars`);
manifest.batches.forEach((b) => console.log(`  ${b.batchId}: ${b.normalizedChars} chars, chunks ${b.chunkIds.join(',')}, checkpoint ${b.checkpointRelationship || '--'}`));
