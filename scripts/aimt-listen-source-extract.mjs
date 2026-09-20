#!/usr/bin/env node
// Extracts spoken-script chunk text from a Listen Mode script doc
// (docs/course-audit/listen-mode/module-NN-listen-script.md) and applies
// the locked AIMT TTS pronunciation normalization ("AIMT" / "A-I-M-T" ->
// "A I M T", spoken as four letters, never a word and never hyphen-read).
//
// Chunk boundary: a "### M<n>-<nn>[a-z]? — <title>" heading, followed by
// zero or more **Bold:** metadata lines, then the blockquote block (lines
// starting with "> ") that IS the spoken text for that chunk. Stops at the
// next "###" heading or a "---" rule.
//
// This only handles the plain lowercase-tag convention used by Modules
// 0, 2-12 ([warmly]/[firmly]/[slowly], valid eleven_v3 delivery tags, left
// untouched). Module 1's older ALL-CAPS structural-cue convention and
// Module 8's checkpoint/Timer restructuring are handled by hand, not this
// script -- see docs/course-audit/listen-mode/tts-final/ for those.
//
// Usage: node scripts/aimt-listen-source-extract.mjs <script.md>
// Prints JSON: [{ chunkId, title, text, rawChars, normalizedChars }, ...]

import { readFileSync } from 'node:fs';

function normalizeAimt(text) {
  return text
    .replace(/\bA-I-M-T\b/g, 'A I M T')
    .replace(/\bAIMT\b/g, 'A I M T');
}

function extractChunks(md) {
  const lines = md.split('\n');
  const chunks = [];
  let current = null;
  let inQuote = false;

  const headingRe = /^### (M\d+-\d+[a-z]?)\s*—\s*(.+)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(headingRe);
    if (headingMatch) {
      if (current) chunks.push(current);
      current = { chunkId: headingMatch[1], title: headingMatch[2].trim(), quoteLines: [] };
      inQuote = false;
      continue;
    }
    if (line.trim() === '---') {
      if (current) { chunks.push(current); current = null; }
      inQuote = false;
      continue;
    }
    if (!current) continue;
    if (line.startsWith('>')) {
      inQuote = true;
      current.quoteLines.push(line.replace(/^>\s?/, ''));
    } else if (inQuote && line.trim() === '') {
      // blank line inside/after quote block -- keep as paragraph break
      current.quoteLines.push('');
    }
  }
  if (current) chunks.push(current);

  return chunks.map((c) => {
    // Collapse the collected quote lines into paragraphs, drop leading/
    // trailing blank paragraphs, join paragraphs with a blank line.
    const text = c.quoteLines.join('\n').trim().replace(/\n{3,}/g, '\n\n');
    const normalized = normalizeAimt(text);
    return {
      chunkId: c.chunkId,
      title: c.title,
      text: normalized,
      rawChars: text.length,
      normalizedChars: normalized.length
    };
  });
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/aimt-listen-source-extract.mjs <script.md>');
    process.exit(1);
  }
  const md = readFileSync(file, 'utf8');
  const chunks = extractChunks(md);
  console.log(JSON.stringify(chunks, null, 2));
}

main();
