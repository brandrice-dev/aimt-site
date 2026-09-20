#!/usr/bin/env node
// Builds AIMT-Listen-Mode-Final/MASTER-CAPCUT-WORKLIST.md from the real
// generation log + manifests -- one consolidated, owner-facing worklist
// (not scattered per-module docs), per the task's explicit instruction.

import { readFileSync, writeFileSync, statSync } from 'node:fs';

const LOG = JSON.parse(readFileSync('docs/course-audit/listen-mode/tts-final/GENERATION-LOG.json', 'utf8'));
const ALL = JSON.parse(readFileSync('docs/course-audit/listen-mode/tts-final/ALL-MODULES-MANIFEST.json', 'utf8'));

const FOLDER_NAMES = {
  '00': '00-Welcome', '01': '01-Module-1', '02': '02-Module-2', '03': '03-Module-3',
  '04': '04-Module-4', '05': '05-Module-5', '06': '06-Module-6', '07': '07-Module-7',
  '08': '08-Module-8', '09': '09-Module-9', '10': '10-Module-10', '11': '11-Module-11',
  '12': '12-Module-12'
};
const MODULE_TITLES = {
  '00': 'Welcome Module', '01': 'Module 1 -- Role of the Head Spa Technician',
  '02': 'Module 2 -- Welcoming Your Client', '03': 'Module 3 -- Hair & Scalp Anatomy',
  '04': 'Module 4 -- Microscopy & Scalp Assessment', '05': 'Module 5 -- Scalp Patterns & Service Adaptation',
  '06': 'Module 6 -- Conditions & Disorders', '07': 'Module 7 -- Equipment & Room Setup',
  '08': 'Module 8 -- The Head Spa Service', '09': 'Module 9 -- Checkout, Client Closing & Pricing Strategy',
  '10': 'Module 10 -- Sanitation & Reset Systems', '11': 'Module 11 -- AI / Modern Practice Tools',
  '12': 'Module 12 -- Course Completion & Certification (pre-exam orientation only)'
};

function fmtDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const entryByKey = {};
for (const e of LOG.entries) entryByKey[`${e.module}/${e.batchId}`] = e;

// Module 1 was rebuilt (strict-fidelity v6) after the original course-wide
// pass -- its real generation records live under the "01v6" log key, not
// "01" (which is the archived/rejected v1 pass). Look those up instead.
function logKeyFor(mod, batchId) {
  return mod === '01' ? `01v6/${batchId}` : `${mod}/${batchId}`;
}

const lines = [];
lines.push('# AIMT Listen Mode -- Master CapCut Worklist');
lines.push('');
lines.push('**Status: RAW generation complete (all 71 batches) and EDIT.wav conversion');
lines.push('complete (all 71 batches). Awaiting owner CapCut pass.**');
lines.push('Generated 2026-09-14; Module 1 rebuilt to the strict-fidelity standard and');
lines.push('EDIT.wav files added 2026-09-15. One consolidated worklist for every module');
lines.push('-- not scattered per-module docs, per the task\'s explicit instruction.');
lines.push('');
lines.push('## Canonical CapCut settings -- `CADENCE_CAPCUT_FINISH_PRESET_V1`');
lines.push('');
lines.push('The active, owner-locked finishing preset (see');
lines.push('`docs/course-audit/listen-mode/module-01-production-standard-LOCKED.md`');
lines.push('Section 3 -- reused verbatim here, not reinterpreted). Apply identically');
lines.push('to every RAW file below, one CapCut pass per file:');
lines.push('');
lines.push('**CapCut Basic:**');
lines.push('- Volume: 0.0 dB');
lines.push('- Fade in: 0.0 seconds');
lines.push('- Fade out: 0.0 seconds');
lines.push('- Normalize loudness: ON');
lines.push('- CapCut-displayed normalization target: -23 LUFS');
lines.push('');
lines.push('**CapCut Enhancement:**');
lines.push('- Enhance voice: ON');
lines.push('- Enhance voice intensity: 75');
lines.push('- Reduce noise: ON');
lines.push('- Isolate voice: OFF');
lines.push('- Audio translator: OFF');
lines.push('- Voice changer: OFF');
lines.push('- Speed: unchanged / 1.0x');
lines.push('');
lines.push('**No additional processing of any kind**: no EQ preset, no pitch change, no');
lines.push('reverb, no voice effect, no silence removal, no manual cuts, no fades beyond');
lines.push('the 0.0s settings above, no separate dynamics/mastering chain afterward.');
lines.push('');
lines.push('## Provenance naming convention -- three files per batch');
lines.push('');
lines.push('```');
lines.push('M<n>-BATCH-<id>-RAW.mp3        immutable ElevenLabs source -- do not edit/rename/delete');
lines.push('M<n>-BATCH-<id>-EDIT.wav       lossless CapCut input -- IMPORT THIS, not the RAW mp3');
lines.push('M<n>-BATCH-<id>-PROCESSED.wav  owner\'s CapCut export -- next pass\'s integration source');
lines.push('```');
lines.push('**Import the `-EDIT.wav` file into CapCut, never the `-RAW.mp3`.** Some RAW');
lines.push('files were found to import into CapCut roughly 10 seconds short of their');
lines.push('real length (inconsistent across files, always full-length everywhere else)');
lines.push('-- almost certainly a VBR/Xing-header duration mismatch in the source MP3');
lines.push('that CapCut\'s importer trusts over the actual audio. Every RAW file has a');
lines.push('validated, full-length `-EDIT.wav` sibling (PCM, 44.1kHz, mono, 16-bit,');
lines.push('decoded with no normalization/EQ/trimming of any kind) specifically to avoid');
lines.push('that importer bug -- see `scripts/aimt-listen-edit-wav-validate.mjs` for the');
lines.push('per-file validation against each batch\'s real ElevenLabs-reported duration.');
lines.push('RAW and EDIT files are never overwritten once a PROCESSED file exists for the');
lines.push('same batch -- keep all three side by side in the same module folder.');
lines.push('');

let totalDuration = 0, totalCost = 0, totalCredits = 0, totalBatches = 0;

// Explicit order -- Object.keys(FOLDER_NAMES) is NOT safe here: JS objects
// sort integer-index-like string keys ("10","11","12") numerically ahead of
// leading-zero keys ("00".."09"), which silently reordered this worklist
// (Module 10 first) the first time this ran with Object.keys().
const MODULE_ORDER = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

for (const mod of MODULE_ORDER) {
  const m = ALL[mod];
  const folder = FOLDER_NAMES[mod];
  lines.push('---');
  lines.push('');
  lines.push(`## ${MODULE_TITLES[mod]}`);
  lines.push('');
  lines.push(`Folder: \`AIMT-Listen-Mode-Final/${folder}/\``);
  lines.push('');
  lines.push('| Batch | Import into CapCut (EDIT.wav) | Chunks | Duration | Chars | Checkpoint | Cut order / notes |');
  lines.push('|---|---|---|---:|---:|---|---|');

  let modDuration = 0, modCost = 0;
  for (const b of m.batches) {
    const e = entryByKey[logKeyFor(mod, b.batchId)];
    if (!e) throw new Error(`Missing generation log entry for ${logKeyFor(mod, b.batchId)}`);
    modDuration += e.durationSecs;
    modCost += e.costUsd;
    totalDuration += e.durationSecs;
    totalCost += e.costUsd;
    totalCredits += e.creditsCharged;
    totalBatches++;

    const editFileName = `M${Number(mod)}-BATCH-${b.batchId}-EDIT.wav`;
    const note = b.checkpointRelationship
      ? `Cut boundary: checkpoint stop at end of this batch's last chunk (${b.checkpointRelationship}) -- natural seam, cut here.`
      : 'No checkpoint in this batch -- cut only at a clean chunk boundary if this file needs splitting.';
    lines.push(`| ${b.batchId} | \`${editFileName}\` | ${b.chunkIds.join(', ')} | ${fmtDuration(e.durationSecs)} | ${e.normalizedChars} | ${b.checkpointRelationship || '--'} | ${note} |`);
  }
  lines.push('');
  lines.push(`**Module total:** ${m.batches.length} batches, ${fmtDuration(modDuration)}, $${modCost.toFixed(2)}.`);
  lines.push('');
}

lines.push('---');
lines.push('');
lines.push('## Course-wide totals');
lines.push('');
lines.push(`- **Batches:** ${totalBatches}`);
lines.push(`- **Total raw runtime:** ${fmtDuration(totalDuration)} (${totalDuration.toFixed(1)}s)`);
lines.push(`- **Total credits charged:** ${totalCredits.toLocaleString()}`);
lines.push(`- **Total cost:** $${totalCost.toFixed(2)}`);
lines.push(`- **Voice:** Jane - Bright, Smooth and Friendly (\`Y3ZPRGOSIxbV4Rbb3WiA\`)`);
lines.push(`- **Model:** eleven_v3`);
lines.push('');
lines.push('## Cut order / processing instructions for the owner');
lines.push('');
lines.push('1. Import the `-EDIT.wav` file for each batch above into CapCut -- NOT the');
lines.push('   `-RAW.mp3` (see the CapCut import fix note above for why).');
lines.push('2. Process through CapCut using the canonical settings exactly (Section');
lines.push('   "Canonical CapCut settings") -- one CapCut action per file, same');
lines.push('   settings every time.');
lines.push('3. Export each processed file as WAV, named `M<n>-BATCH-<id>-PROCESSED.wav`,');
lines.push('   into the SAME module folder as its RAW/EDIT files -- do not delete or');
lines.push('   move either of them.');
lines.push('4. A batch spanning multiple player chunks (see the "Chunks" column) does');
lines.push('   NOT need to be split by you -- the next integration pass recovers the');
lines.push('   individual player chunks from each processed batch automatically, using');
lines.push('   the checkpoint/section boundaries already documented per module in');
lines.push('   `docs/course-audit/listen-mode/module-NN-listen-script.md`. You are only');
lines.push('   processing whole batch files, never manually cutting mid-batch.');
lines.push('5. Return the complete set of `-PROCESSED.wav` files (same folder structure) for');
lines.push('   the second integration pass. Nothing gets installed to the live course or');
lines.push('   wired into the manifest until that pass runs and you\'ve confirmed you\'re');
lines.push('   ready for it.');
lines.push('');
lines.push('## What this worklist deliberately does NOT do');
lines.push('');
lines.push('- Does not cut final player-chunk MP3s (that happens after your CapCut pass,');
lines.push('  in the second integration pass).');
lines.push('- Does not touch `assets/audio/listen/` (live production audio) or');
lines.push('  `assets/js/aimt-listen-mode-data.js` (the live manifest).');
lines.push('- Does not overwrite Module 1\'s existing, approved, live production audio --');
lines.push('  that only happens once you\'ve reviewed and approved this pass\'s Module 1');
lines.push('  replacement specifically.');
lines.push('- Does not activate any module\'s "Listen with Cadence" entry or remove any');
lines.push('  "coming soon" state.');

writeFileSync('AIMT-Listen-Mode-Final/MASTER-CAPCUT-WORKLIST.md', lines.join('\n') + '\n');
console.log(`Wrote MASTER-CAPCUT-WORKLIST.md: ${totalBatches} batches, ${fmtDuration(totalDuration)}, $${totalCost.toFixed(2)}`);
