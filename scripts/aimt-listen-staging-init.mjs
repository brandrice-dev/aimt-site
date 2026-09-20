#!/usr/bin/env node
// Writes a README.md into each module's owner-editing staging folder
// (AIMT-Listen-Mode-Final/<NN>-<Name>/) describing exactly which raw
// ElevenLabs batches land there once generation resumes. Safe to re-run --
// overwrites only these READMEs, never touches generated audio.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const MANIFEST_PATH = 'docs/course-audit/listen-mode/tts-final/ALL-MODULES-MANIFEST.json';
const STAGING_ROOT = 'AIMT-Listen-Mode-Final';

const FOLDER_NAMES = {
  '00': '00-Welcome', '01': '01-Module-1', '02': '02-Module-2', '03': '03-Module-3',
  '04': '04-Module-4', '05': '05-Module-5', '06': '06-Module-6', '07': '07-Module-7',
  '08': '08-Module-8', '09': '09-Module-9', '10': '10-Module-10', '11': '11-Module-11',
  '12': '12-Module-12'
};

const all = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

for (const [mod, folder] of Object.entries(FOLDER_NAMES)) {
  const m = all[mod];
  const dir = path.join(STAGING_ROOT, folder);
  if (!existsSync(dir)) throw new Error(`missing staging dir ${dir}`);

  const lines = [];
  lines.push(`# Module ${Number(mod)} -- Owner-Editing Staging`);
  lines.push('');
  lines.push(`Source: \`docs/course-audit/listen-mode/tts-final/module-${mod}/\` (tracked in git -- manifest.json + one .txt per batch, the exact validated TTS payload).`);
  lines.push('');
  lines.push('Once generation resumes, raw ElevenLabs output lands here in listening order, one file per batch:');
  lines.push('');
  for (const b of m.batches) {
    lines.push(`- \`M${Number(mod)}-BATCH-${b.batchId}-RAW.mp3\` -- chunks ${b.chunkIds.join(', ')} (${b.normalizedChars} chars${b.checkpointRelationship ? `, checkpoint: ${b.checkpointRelationship}` : ''})`);
  }
  lines.push('');
  lines.push('This directory (and the audio in it) is gitignored -- only this README travels with the repo. See `AIMT-Listen-Mode-Final/README.md` at the staging root, and `docs/course-audit/listen-mode/tts-final/RESUME.md`, for the full resume procedure.');
  lines.push('');

  writeFileSync(path.join(dir, 'README.md'), lines.join('\n'));
}

console.log('Wrote staging READMEs for all 13 modules.');
