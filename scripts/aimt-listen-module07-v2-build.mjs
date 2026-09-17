#!/usr/bin/env node
// ONE-OFF, Module-7-only batch builder for the strict-fidelity rebuild --
// mirrors aimt-listen-module05-v2-build.mjs / aimt-listen-module06-v2-build.mjs
// exactly (same pattern, kept separate so this pass cannot touch any other
// module's already-built batch files).
//
// Input: /tmp/aimt-listen-extract/module-07-v2.json (9 hand-rebuilt,
// AIMT-normalized chunks, audited against the live headspa-mastery.html
// in docs/course-audit/listen-mode/module-07-fidelity-coverage-audit.md).
// Output: docs/course-audit/listen-mode/tts-final/module-07/M7-BATCH-*.txt
// + manifest.json (v2). The rejected v1 batches/manifest were moved to
// this same directory's archive-loose-v1/ before this script ran.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const chunks = JSON.parse(readFileSync('/tmp/aimt-listen-extract/module-07-v2.json', 'utf8'));
const byId = Object.fromEntries(chunks.map((c) => [c.chunkId, c]));

// Judgment call (see audit doc): m7cp1 and m7cp2 sit back-to-back on the
// live page with no numbered section between them (confirmed by reading
// #module7Wrap in full -- the signature interaction is immediately
// followed by both checkpoint cards, then completion). Because each
// checkpoint must still be generated as its own isolated audio batch (a
// checkpoint-stop chunk can never share a batch with anything on the
// other side of its interactive gate), M7-08 carries the short "resume
// after m7cp1" transition line as its own opening sentence rather than
// spending a whole separate chunk/batch on a transition that would have
// no real section content to attach to. M7-07 (m7cp1) and M7-08 (m7cp2)
// are still two fully separate chunks and two fully separate batches --
// this only changes where the transition line lives.
const CHECKPOINT_META = {
  'M7-07': { gateType: 'checkpoint-stop', checkpointId: 'm7cp1' },
  'M7-08': { gateType: 'checkpoint-stop', checkpointId: 'm7cp2', resumesAfterCheckpoint: 'm7cp1' },
  'M7-09': { gateType: 'post-pass', checkpointId: 'm7cp2', resumeAfterPass: true }
};

// Checkpoint chunks kept in their own batch (chunking standard's
// short-checkpoint exemption + "split at a checkpoint boundary first"
// priority). M7-02 (all 7 bed-evaluation categories), M7-03 (all 4 tool
// categories + 3 reach zones, full item lists), and M7-06 (signature
// interaction, all 4 setup cards) are each kept intact within a single
// batch rather than split, since each is a single tightly-coupled unit
// under the strict-fidelity standard -- none may be divided mid-category,
// mid-list, or mid-setup.
const BATCHES = {
  A1: ['M7-01', 'M7-02'],
  A2: ['M7-03'],
  A3: ['M7-04', 'M7-05'],
  A4: ['M7-06'],
  A5: ['M7-07'],
  B1: ['M7-08'],
  C1: ['M7-09']
};

const OUT_DIR = 'docs/course-audit/listen-mode/tts-final/module-07';
mkdirSync(OUT_DIR, { recursive: true });

function firstLine(text) { return text.split('\n')[0].slice(0, 140); }
function lastLine(text) { const l = text.trim().split('\n').filter(Boolean); return l[l.length - 1].slice(-140); }

const manifest = { module: '07', version: 'v2-strict-fidelity', batches: [] };
let totalChars = 0;

for (const [batchId, chunkIds] of Object.entries(BATCHES)) {
  const parts = chunkIds.map((id) => {
    if (!byId[id]) throw new Error(`Missing chunk ${id}`);
    return byId[id];
  });
  const text = parts.map((p) => p.text).join('\n\n');
  const fileName = `M7-BATCH-${batchId}.txt`;
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
console.log(`Module 7 v2: ${manifest.batches.length} batches, ${totalChars} total chars`);
manifest.batches.forEach((b) => console.log(`  ${b.batchId}: ${b.normalizedChars} chars, chunks ${b.chunkIds.join(',')}, checkpoint ${b.checkpointRelationship || '--'}`));
