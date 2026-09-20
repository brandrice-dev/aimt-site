#!/usr/bin/env node
// ONE-OFF, Module-8-only batch builder for the strict-fidelity rebuild --
// mirrors aimt-listen-module07-v2-build.mjs exactly (same pattern, kept
// separate so this pass cannot touch any other module's already-built
// batch files).
//
// Input: /tmp/aimt-listen-extract/module-08-v2.json (18 chunks, extracted
// from docs/course-audit/listen-mode/module-08-listen-script.md, audited
// against the live headspa-mastery.html in
// docs/course-audit/listen-mode/module-08-fidelity-coverage-audit.md).
// Output: docs/course-audit/listen-mode/tts-final/module-08/M8-BATCH-*.txt
// + manifest.json (v2). The rejected v1 batches/manifest were moved to
// this same directory's archive-loose-v1/ before this script ran.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const chunks = JSON.parse(readFileSync('/tmp/aimt-listen-extract/module-08-v2.json', 'utf8'));
const byId = Object.fromEntries(chunks.map((c) => [c.chunkId, c]));

const CHECKPOINT_META = {
  'M8-15': { gateType: 'checkpoint-stop', checkpointId: 'm8cp1' },
  'M8-16': { gateType: 'post-pass', checkpointId: 'm8cp1', resumeAfterPass: true },
  'M8-17': { gateType: 'checkpoint-stop', checkpointId: 'm8cp2' },
  'M8-18': { gateType: 'post-pass', checkpointId: 'm8cp2', resumeAfterPass: true }
};

// Module 8 is the largest module scripted to date (18 chunks / ~31.7k
// chars across 9 masterclass chapters). Batches below pack sequential
// chunks safely under scripts/aimt-listen-tts-preflight.mjs's actual
// 4,500-char safety-margin gate (a hard fail there, not merely a flag --
// confirmed by running preflight against an earlier, tighter-packed
// version of this table that put two batches at 4,606/4,882 chars and
// failed) -- never splitting a chunk, never crossing the m8cp1/m8cp2
// checkpoint boundaries. M8-05 (Chapter 1) and M8-14 (signature
// interaction, all 3 scenarios) are each large, single, tightly-coupled
// units -- neither is split further. M8-11/M8-12 (Chapter 9) are already
// a deliberate two-part split of one long chapter (guidance+why vs.
// teach+adapt+notes+watchFor) at a real internal sub-section boundary, not
// a mid-thought cut.
const BATCHES = {
  A1: ['M8-01', 'M8-02', 'M8-03'],
  A2: ['M8-04'],
  A3: ['M8-05'],
  A4: ['M8-06', 'M8-07'],
  A5: ['M8-08'],
  A6: ['M8-09'],
  A7: ['M8-10'],
  A8: ['M8-11', 'M8-12'],
  A9: ['M8-13'],
  A10: ['M8-14'],
  A11: ['M8-15'],
  B1: ['M8-16'],
  B2: ['M8-17'],
  C1: ['M8-18']
};

const OUT_DIR = 'docs/course-audit/listen-mode/tts-final/module-08';
mkdirSync(OUT_DIR, { recursive: true });

function firstLine(text) { return text.split('\n')[0].slice(0, 140); }
function lastLine(text) { const l = text.trim().split('\n').filter(Boolean); return l[l.length - 1].slice(-140); }

const manifest = { module: '08', version: 'v2-strict-fidelity', batches: [] };
let totalChars = 0;

for (const [batchId, chunkIds] of Object.entries(BATCHES)) {
  const parts = chunkIds.map((id) => {
    if (!byId[id]) throw new Error(`Missing chunk ${id}`);
    return byId[id];
  });
  const text = parts.map((p) => p.text).join('\n\n');
  const fileName = `M8-BATCH-${batchId}.txt`;
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
  normalizedChars: c.text.length,
  ...(CHECKPOINT_META[c.chunkId] || {})
}));

writeFileSync(`${OUT_DIR}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log(`Module 8 v2: ${manifest.batches.length} batches, ${totalChars} total chars`);
manifest.batches.forEach((b) => console.log(`  ${b.batchId}: ${b.normalizedChars} chars, chunks ${b.chunkIds.join(',')}, checkpoint ${b.checkpointRelationship || '--'}${b.overCeiling ? ' [FLAG: >=4500]' : ''}`));
