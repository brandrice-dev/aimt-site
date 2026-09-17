#!/usr/bin/env node
// Automated preflight for every Listen Mode ElevenLabs batch payload
// (docs/course-audit/listen-mode/tts-final/module-NN/*.txt). Rejects (exit
// code 1) any batch that violates the locked pronunciation/production
// rules -- run this before every real ElevenLabs call, not just once.
//
// Checks:
//   1. Under the 5,000-char hard ceiling, with a safety margin (< 4,500).
//   2. No standalone "AIMT" anywhere in the payload.
//   3. No hyphenated "A-I-M-T" anywhere in the payload.
//   4. No un-narrated editorial/structural brackets ([SECTION PAUSE],
//      [VISUAL CUE], [CHECKPOINT STOP...], [PLAY ONLY AFTER...], chunk-id
//      style brackets) -- these are production metadata, never spoken.
//   5. No literal chunk IDs (e.g. "M1-04", "m8cp1") embedded in running
//      prose outside of a deliberate quoted checkpoint question.
//   6. No directional "answer above" (or equivalent "your answer is
//      above" / "respond above" / "response above") phrasing anywhere in
//      a checkpoint-adjacent payload. The student's response text area is
//      always BELOW the checkpoint prompt on screen, never above it --
//      saying "above" tells the student to look in the wrong direction.
//      Added after this was found live in Module 7's old v1 narration
//      (and, on inspection, in several other already-shipped modules'
//      scripts/audio -- see the Module 7 fidelity coverage audit for the
//      full list). The only acceptable directional cue is exactly "Take
//      your time and answer below." -- or no directional cue at all.
//
// Usage: node scripts/aimt-listen-tts-preflight.mjs [tts-final-dir]
// Exits 1 and prints every violation if anything fails; exits 0 and
// prints a summary otherwise.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] || 'docs/course-audit/listen-mode/tts-final';
const SAFE_CEILING = 4500;
const HARD_CEILING = 5000;

const STRUCTURAL_BRACKETS = [
  /\[SECTION PAUSE\]/i,
  /\[VISUAL CUE\]/i,
  /\[CHECKPOINT STOP[^\]]*\]/i,
  /\[PLAY ONLY AFTER[^\]]*\]/i,
  /\[SHORT PAUSE\]/i,
  /\[EMPHASIZE\]/i,
  /\[LET THIS LAND\]/i,
  /\[WARM\]/, // all-caps structural leftover, not the valid lowercase [warmly] tag
  /\[SLOW SLIGHTLY\]/i
];

// Directional "above" phrasing pointing the student at the response field
// -- always wrong, since the response field is below the prompt in the
// live player. Matches "answer above" / "answers above" / "your answer is
// above" / "respond above" / "response above" (case-insensitive, optional
// trailing words like "in your own words" don't prevent a match).
const DIRECTIONAL_ABOVE = [
  /\banswer(?:s)?\s+above\b/i,
  /\byour\s+answer\s+is\s+above\b/i,
  /\brespond(?:s)?\s+above\b/i,
  /\bresponse\s+above\b/i
];

function findBatchFiles(root) {
  const files = [];
  for (const entry of readdirSync(root)) {
    const full = path.join(root, entry);
    if (statSync(full).isDirectory()) {
      for (const f of readdirSync(full)) {
        if (f.endsWith('.txt')) files.push(path.join(full, f));
      }
    }
  }
  return files;
}

function checkFile(file) {
  const text = readFileSync(file, 'utf8');
  const errors = [];

  if (text.length >= HARD_CEILING) errors.push(`over hard ceiling: ${text.length} chars >= ${HARD_CEILING}`);
  else if (text.length >= SAFE_CEILING) errors.push(`over safety margin: ${text.length} chars >= ${SAFE_CEILING} (hard ceiling ${HARD_CEILING})`);

  if (/\bAIMT\b/.test(text)) errors.push('unnormalized standalone "AIMT" present');
  if (/\bA-I-M-T\b/.test(text)) errors.push('hyphenated "A-I-M-T" present (must be "A I M T")');

  for (const re of STRUCTURAL_BRACKETS) {
    if (re.test(text)) errors.push(`un-narrated structural/editorial bracket matches ${re}`);
  }

  if (/\bM\d+-\d+[a-z]?\b/.test(text)) errors.push('literal chunk ID found in payload text');

  for (const re of DIRECTIONAL_ABOVE) {
    if (re.test(text)) errors.push(`directional "answer above"-style phrasing found (response field is BELOW the prompt, not above) matches ${re}`);
  }

  return errors;
}

function main() {
  const files = findBatchFiles(ROOT);
  if (files.length === 0) {
    console.error(`No .txt batch files found under ${ROOT}`);
    process.exit(1);
  }
  let failCount = 0;
  for (const file of files) {
    const errors = checkFile(file);
    if (errors.length) {
      failCount++;
      console.error(`FAIL ${file}`);
      for (const e of errors) console.error(`  - ${e}`);
    }
  }
  console.log(`\nChecked ${files.length} batch payloads. ${failCount === 0 ? 'All passed.' : `${failCount} FAILED.`}`);
  process.exit(failCount === 0 ? 0 : 1);
}

main();
