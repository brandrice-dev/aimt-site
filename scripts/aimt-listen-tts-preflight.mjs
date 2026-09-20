#!/usr/bin/env node
// Automated preflight for every Listen Mode ElevenLabs batch payload
// (docs/course-audit/listen-mode/tts-final/module-NN/*.txt). Rejects (exit
// code 1) any batch that violates the locked pronunciation/production
// rules -- run this before every real ElevenLabs call, not just once.
//
// Checks:
//   1. Under the 5,000-char hard ceiling, with a safety margin (< 4,500).
//   2. No standalone "AIMT" anywhere in the payload (any case).
//   3. No hyphenated "A-I-M-T" anywhere in the payload (any case).
//   3b. No dot-separated "A.I.M.T" anywhere in the payload (any case) --
//      added alongside the other two forms since it produces the same
//      spelled-out/linked mispronunciation ElevenLabs can render for
//      hyphens. The only accepted spoken payload form is the plain,
//      single-spaced "A I M T".
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
//   7. (NON-BLOCKING NOTE, not a failure) Cadence narrator-perspective
//      check (00-listen-mode-editorial-standard.md Section J): flags
//      "Cadence is"/"Cadence can"/"Cadence helps"/"through Cadence"-style
//      constructions for human review. Cadence, as narrator, must speak
//      about herself in first person -- but a legitimate third-person
//      reference to a *named feature* ("Listen with Cadence", "Ask
//      Cadence", "Practitioner Conversation with Cadence") or a quote
//      attribution ("From Cadence:") should NOT be rewritten. Because
//      that distinction requires judgment this check only prints a NOTE
//      for review -- it never auto-rewrites and never fails the build.
//   8. (NON-BLOCKING NOTE, not a failure) Letter-spelled-real-word check
//      (00-listen-mode-editorial-standard.md Section K): flags a run of
//      5+ single letters separated only by punctuation/whitespace (e.g.
//      "B, R, I, E, F", "B.R.I.E.F", "B-R-I-E-F") -- a framework name
//      that spells an ordinary word (Module 11's B.R.I.E.F. -> "brief")
//      should be spoken as that word, not letter-by-letter. This cannot
//      match the legitimate individual-letter teaching sequence ("B,
//      Background... R, Request...") because real words sit between
//      those letters, not bare punctuation -- but a human still confirms
//      the flagged run actually spells a real word before changing
//      anything, so this only NOTEs, never auto-rewrites or fails.
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

// Non-blocking: flags a possible narrator third-person self-reference for
// human review (Section J). Deliberately broad/simple -- judgment about
// whether a match is a legitimate named-feature reference ("Listen with
// Cadence", "Ask Cadence") or a quote attribution ("From Cadence:")
// happens in review, not here. Never used to fail the build.
const CADENCE_THIRD_PERSON_NOTE = [
  /\bCadence\s+is\b/,
  /\bCadence\s+can\b/,
  /\bCadence\s+helps?\b/,
  /\bthrough\s+Cadence\b/i
];

// Non-blocking: flags a run of 5+ single letters separated only by
// punctuation/whitespace (never a real word in between) -- a framework
// name written as spelled-out letters that likely spells an ordinary
// word and should be spoken as that word instead (Section K). Requires
// a separator between every letter (the plain word itself, e.g. "brief",
// has none, so it never matches). Capped at exactly 5 letters since
// that's the only real case so far (B.R.I.E.F.); extend the quantifier
// if a future module needs more.
const LETTER_SPELLED_WORD_NOTE = [
  /\b[A-Za-z][.,\-\s]+[A-Za-z][.,\-\s]+[A-Za-z][.,\-\s]+[A-Za-z][.,\-\s]+[A-Za-z]\b/
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

  if (/\bAIMT\b/i.test(text)) errors.push('unnormalized standalone "AIMT" present (must be "A I M T")');
  if (/\bA-I-M-T\b/i.test(text)) errors.push('hyphenated "A-I-M-T" present (must be "A I M T")');
  if (/\bA\.I\.M\.T\.?\b/i.test(text)) errors.push('dot-separated "A.I.M.T" present (must be "A I M T")');

  for (const re of STRUCTURAL_BRACKETS) {
    if (re.test(text)) errors.push(`un-narrated structural/editorial bracket matches ${re}`);
  }

  if (/\bM\d+-\d+[a-z]?\b/.test(text)) errors.push('literal chunk ID found in payload text');

  for (const re of DIRECTIONAL_ABOVE) {
    if (re.test(text)) errors.push(`directional "answer above"-style phrasing found (response field is BELOW the prompt, not above) matches ${re}`);
  }

  return errors;
}

function checkFileNotes(file) {
  const text = readFileSync(file, 'utf8');
  const notes = [];
  for (const re of CADENCE_THIRD_PERSON_NOTE) {
    if (re.test(text)) notes.push(`possible Cadence third-person self-reference matches ${re} -- review against Section J (narrator self-reference must be first person; a named-feature reference or quote attribution should stay as-is)`);
  }
  for (const re of LETTER_SPELLED_WORD_NOTE) {
    const m = text.match(re);
    if (m) notes.push(`possible framework name spelled letter-by-letter ("${m[0]}") -- review against Section K (if this run of letters spells an ordinary word, e.g. B.R.I.E.F. -> "brief", speak it as that word; the individual-letter teaching sequence, if this is one, is unaffected)`);
  }
  return notes;
}

function main() {
  const files = findBatchFiles(ROOT);
  if (files.length === 0) {
    console.error(`No .txt batch files found under ${ROOT}`);
    process.exit(1);
  }
  let failCount = 0;
  let noteCount = 0;
  for (const file of files) {
    const errors = checkFile(file);
    if (errors.length) {
      failCount++;
      console.error(`FAIL ${file}`);
      for (const e of errors) console.error(`  - ${e}`);
    }
    const notes = checkFileNotes(file);
    if (notes.length) {
      noteCount++;
      console.log(`NOTE ${file}`);
      for (const n of notes) console.log(`  - ${n}`);
    }
  }
  console.log(`\nChecked ${files.length} batch payloads. ${failCount === 0 ? 'All passed.' : `${failCount} FAILED.`}${noteCount ? ` ${noteCount} file(s) flagged for narrator-perspective review (non-blocking).` : ''}`);
  process.exit(failCount === 0 ? 0 : 1);
}

main();
