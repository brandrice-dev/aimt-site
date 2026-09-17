#!/usr/bin/env node
// Appends one entry to docs/course-audit/listen-mode/tts-final/GENERATION-LOG.json.
// Usage: node scripts/aimt-listen-log-append.mjs '<json-entry>'
import { readFileSync, writeFileSync, statSync } from 'node:fs';

const LOG_PATH = 'docs/course-audit/listen-mode/tts-final/GENERATION-LOG.json';
const entry = JSON.parse(process.argv[2]);
if (entry.rawFile) {
  try { entry.fileBytes = statSync(entry.rawFile).size; } catch (e) { /* leave as given */ }
}
const log = JSON.parse(readFileSync(LOG_PATH, 'utf8'));
log.entries.push(entry);
writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
console.log(`Logged ${entry.module}/${entry.batchId} (${log.entries.length} total entries)`);
