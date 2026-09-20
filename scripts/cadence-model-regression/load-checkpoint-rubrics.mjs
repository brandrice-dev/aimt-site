// Extracts the real M0..M11 checkpoint rubric/question objects directly out
// of headspa-mastery.html at run time -- never a hand-copied duplicate.
//
// headspa-mastery.html is a flat HTML file with inline JS (CLAUDE.md: no
// build step, no bundler). The M0..M11 `const M{n} = {...}` object literals
// are pure data (string concatenation only, no external references), so
// they can be safely isolated and evaluated in a throwaway vm context --
// the same "parse the real locked source, never hand-retype it" principle
// scripts/build-module12-assessment-bank.mjs already established for the
// Module 12 content banks. This keeps headspa-mastery.html the single
// source of truth for rubric text; the regression harness can never drift
// from what production actually evaluates against.
//
// Not loaded by the student browser bundle -- Node-only, scripts/ tooling.

import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML_PATH = path.join(__dirname, '..', '..', 'headspa-mastery.html');

const RUBRIC_VARS = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11'];

/**
 * Finds the `{...}` span for `const NAME = {` by brace-depth counting.
 * Comment-aware: `//` line comments in this file's own header comments
 * (e.g. "Module 3's default lesson-wrap content") legitimately contain
 * apostrophes, which would otherwise be misread as a string boundary and
 * desync the brace count -- so `//...\n` is skipped as a unit, exactly
 * like a JS tokenizer would, before string/brace tracking sees it.
 */
function extractObjectLiteralSource(html, varName) {
  const marker = `const ${varName} = {`;
  const start = html.indexOf(marker);
  if (start === -1) throw new Error(`Rubric object "${varName}" not found in headspa-mastery.html`);
  const braceStart = start + marker.length - 1; // index of the opening '{'
  let depth = 0;
  let inString = null; // "'" | '"' | null
  let i = braceStart;
  for (; i < html.length; i++) {
    const ch = html[i];
    const next = html[i + 1];
    const prev = html[i - 1];
    if (inString) {
      if (ch === inString && prev !== '\\') inString = null;
      continue;
    }
    if (ch === '/' && next === '/') {
      const nl = html.indexOf('\n', i);
      i = (nl === -1 ? html.length : nl); // resume loop at '\n' itself (outer for-loop's i++ lands after it)
      continue;
    }
    if (ch === "'" || ch === '"') { inString = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { i++; break; }
    }
  }
  return html.slice(braceStart, i); // includes surrounding braces
}

/** Evaluates one `const NAME = {...}` object literal out of headspa-mastery.html. Generic -- used for the M0..M11 rubrics and for MODULE_GUIDE_SYSTEMS/MODULE_QUICK_PROMPTS alike. */
export function extractConstObject(html, varName) {
  const objSrc = extractObjectLiteralSource(html, varName);
  const context = {};
  vm.createContext(context);
  const script = new vm.Script(`(${objSrc})`);
  return script.runInContext(context);
}

/**
 * Returns { M0, M1, ..., M11 }, each shaped exactly as authored in
 * headspa-mastery.html: { questions: {...}, system: '...' } for M0,
 * { questions: {...}, systems: {...} } for M1..M11.
 */
export function loadCheckpointRubrics(htmlPath = HTML_PATH) {
  const html = readFileSync(htmlPath, 'utf8');
  const result = {};
  for (const varName of RUBRIC_VARS) {
    result[varName] = extractConstObject(html, varName);
  }
  return result;
}

/** Returns MODULE_GUIDE_SYSTEMS keyed by numeric-string module id, exactly as authored (used for the chat-quality regression suite). */
export function loadModuleGuideSystems(htmlPath = HTML_PATH) {
  const html = readFileSync(htmlPath, 'utf8');
  return extractConstObject(html, 'MODULE_GUIDE_SYSTEMS');
}

/** Evaluates a single-line `const NAME = '...';` (or string-concatenation) string constant out of headspa-mastery.html. */
export function extractConstString(html, varName) {
  const marker = `const ${varName} = `;
  const start = html.indexOf(marker);
  if (start === -1) throw new Error(`Constant "${varName}" not found in headspa-mastery.html`);
  const exprStart = start + marker.length;
  const semiIdx = html.indexOf(";\n", exprStart);
  if (semiIdx === -1) throw new Error(`No terminating ";" found for constant "${varName}"`);
  const context = {};
  vm.createContext(context);
  const script = new vm.Script(`(${html.slice(exprStart, semiIdx)})`);
  return script.runInContext(context);
}

/** The two shared Cadence tone constants every guide/chat system prompt appends (see headspa-mastery.html's getGuideSystem()). */
export function loadSharedToneConstants(htmlPath = HTML_PATH) {
  const html = readFileSync(htmlPath, 'utf8');
  return {
    CADENCE_RESPONSE_CONSISTENCY_ANCHOR: extractConstString(html, 'CADENCE_RESPONSE_CONSISTENCY_ANCHOR'),
    CADENCE_SELECTIVE_MEMORY_INSTRUCTION: extractConstString(html, 'CADENCE_SELECTIVE_MEMORY_INSTRUCTION'),
  };
}
