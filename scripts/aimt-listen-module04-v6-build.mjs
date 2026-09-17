#!/usr/bin/env node
// ONE-OFF, Module-4-only batch builder for the strict-fidelity rebuild —
// mirrors aimt-listen-module01-v6-build.mjs exactly (same pattern, kept
// separate so this pass cannot touch any other module's already-built
// batch files).
//
// Input: /tmp/aimt-listen-extract/module-04-v6.json (17 hand-rebuilt,
// AIMT-normalized chunks, audited against the live headspa-mastery.html
// in docs/course-audit/listen-mode/module-04-fidelity-coverage-audit.md).
// Output: docs/course-audit/listen-mode/tts-final/module-04/M4-BATCH-*.txt
// + manifest.json (v6). The rejected v1 batches/manifest were moved to
// this same directory's archive-loose-v1/ before this script ran.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const chunks = JSON.parse(readFileSync('/tmp/aimt-listen-extract/module-04-v6.json', 'utf8'));
const byId = Object.fromEntries(chunks.map((c) => [c.chunkId, c]));

const CHECKPOINT_META = {
  'M4-08': { gateType: 'checkpoint-stop', checkpointId: 'm4cp1' },
  'M4-09': { gateType: 'post-pass', checkpointId: 'm4cp1', resumeAfterPass: true },
  'M4-16': { gateType: 'checkpoint-stop', checkpointId: 'm4cp2' },
  'M4-17': { gateType: 'post-pass', checkpointId: 'm4cp2', resumeAfterPass: true }
};

// Checkpoint chunks kept in their own batch (chunking standard's
// short-checkpoint exemption + Section 4's "split at a checkpoint
// boundary first" priority) -- every other batch stays comfortably under
// the 4,500-char safety ceiling despite Module 4's much denser content
// (6 image-integrity steps, 5 scan stations, 5 lenses, 5 appearance
// cards each with 4 fields, 4 decision categories, 4 when-not-to-proceed
// scenarios, 5 practitioner-insight cards, 6 mistake cards -- all named
// individually per the fidelity standard, none compressed).
const BATCHES = {
  A1: ['M4-01', 'M4-02', 'M4-03'],
  A2: ['M4-04', 'M4-05'],
  A3: ['M4-06', 'M4-07'],
  A4: ['M4-08'],
  B1: ['M4-09', 'M4-10'],
  B2: ['M4-11', 'M4-12', 'M4-13'],
  B3: ['M4-14', 'M4-15'],
  B4: ['M4-16'],
  C1: ['M4-17']
};

const OUT_DIR = 'docs/course-audit/listen-mode/tts-final/module-04';
mkdirSync(OUT_DIR, { recursive: true });

function firstLine(text) { return text.split('\n')[0].slice(0, 140); }
function lastLine(text) { const l = text.trim().split('\n').filter(Boolean); return l[l.length - 1].slice(-140); }

const manifest = { module: '04', version: 'v6-strict-fidelity', batches: [] };
let totalChars = 0;

for (const [batchId, chunkIds] of Object.entries(BATCHES)) {
  const parts = chunkIds.map((id) => {
    if (!byId[id]) throw new Error(`Missing chunk ${id}`);
    return byId[id];
  });
  const text = parts.map((p) => p.text).join('\n\n');
  const fileName = `M4-BATCH-${batchId}.txt`;
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
console.log(`Module 4 v6: ${manifest.batches.length} batches, ${totalChars} total chars`);
manifest.batches.forEach((b) => console.log(`  ${b.batchId}: ${b.normalizedChars} chars, chunks ${b.chunkIds.join(',')}, checkpoint ${b.checkpointRelationship || '--'}`));
