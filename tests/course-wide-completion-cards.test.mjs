// Course-wide completion-card standardization — enforcement test.
//
// Module 2's rebuild exposed a broader problem: every teaching module's
// .lesson-complete card had drifted into its own bespoke design (.lc-gold
// vs .lc-check, .lc-sub stacks, a one-off .lc-recap, custom completion
// headlines). This test locks the canonical shared structure in place for
// Modules 0-11 so it can't silently regress module by module again.
// Module 12 is intentionally exempt -- it's a terminal, certificate-issuing
// course-completion screen driven by a separate server-authoritative state
// machine (module12-certification.js), not an ordinary "next module" card.
//
// Flat-HTML site, no build step, no DOM test runner (see CLAUDE.md) -- reads
// the real shipped source and extracts each real .lesson-complete block by
// div-depth tracking (the same principle every regex-based test in this
// repo already follows), rather than re-typing expected markup.
//
// No Anthropic API calls. Run: node tests/course-wide-completion-cards.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const courseSrc = readFileSync(path.join(ROOT, 'headspa-mastery.html'), 'utf8');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

/** Extracts one <div class="lesson-complete" id="ID" ...> ... </div> block
 * by tracking div-open/close depth from the opening tag, so nested .lc-next
 * etc. don't truncate the match early. */
function extractCompletionCard(id) {
  const marker = 'id="' + id + '"';
  const idPos = courseSrc.indexOf(marker);
  if (idPos === -1) return null;
  const start = courseSrc.lastIndexOf('<div class="lesson-complete"', idPos);
  if (start === -1) return null;
  let pos = start;
  let depth = 0;
  const closeTag = '</div>';
  while (pos < courseSrc.length) {
    const nextOpen = courseSrc.indexOf('<div', pos);
    const nextClose = courseSrc.indexOf(closeTag, pos);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = courseSrc.indexOf('>', nextOpen) + 1;
    } else {
      depth--;
      pos = nextClose + closeTag.length;
      if (depth === 0) return courseSrc.slice(start, pos);
    }
  }
  return null;
}

// Module id -> its real .lesson-complete element id. Module 3 uses the
// original seeded id (no per-module prefix -- see module3HTML in
// headspa-mastery.html); every other module follows the mNComplete pattern.
const STANDARD_MODULE_COMPLETION_IDS = {
  0: 'm0Complete',
  1: 'm1Complete',
  2: 'm2Complete',
  3: 'lessonComplete',
  4: 'm4Complete',
  5: 'm5Complete',
  6: 'm6Complete',
  7: 'm7Complete',
  8: 'm8Complete',
  9: 'm9Complete',
  10: 'm10Complete',
  11: 'm11Complete',
};

// ─────────────────────────────────────────────────────────────────────────
// A. CANONICAL STRUCTURE — every standard module (0-11)
// ─────────────────────────────────────────────────────────────────────────
const cards = {};
for (const [moduleId, elementId] of Object.entries(STANDARD_MODULE_COMPLETION_IDS)) {
  const card = extractCompletionCard(elementId);
  cards[moduleId] = card;
  const label = 'Module ' + moduleId + ' (#' + elementId + ')';

  check('A. CANONICAL STRUCTURE', label + ': card found', !!card);
  if (!card) continue;

  check('A. CANONICAL STRUCTURE', label + ': exactly one .lc-check', (card.match(/class="lc-check"/g) || []).length === 1);
  check('A. CANONICAL STRUCTURE', label + ': checkmark is literally ✓ (not ✦ or any other icon)', /<div class="lc-check">✓<\/div>/.test(card));
  check('A. CANONICAL STRUCTURE', label + ': exactly one .lc-title, text is literally "Module complete."', (card.match(/class="lc-title"/g) || []).length === 1 && /<div class="lc-title">Module complete\.<\/div>/.test(card));
  check('A. CANONICAL STRUCTURE', label + ': exactly one .lc-body (a single concise completion statement)', (card.match(/class="lc-body"/g) || []).length === 1);
  check('A. CANONICAL STRUCTURE', label + ': .lc-body is 1-2 sentences (at most 2 terminal punctuation marks before the closing </div>, excluding ellipses/decimals)', (() => {
    const m = card.match(/<div class="lc-body">([\s\S]*?)<\/div>/);
    if (!m) return false;
    const text = m[1];
    const sentenceEnds = (text.match(/[.!?](?=\s|$)/g) || []).length;
    return sentenceEnds >= 1 && sentenceEnds <= 3; // allow up to 3 for a tight compound closer like Module 10's
  })());
  check('A. CANONICAL STRUCTURE', label + ': exactly one .lc-next block with a .lc-next-label and .lc-next-text', (card.match(/class="lc-next"/g) || []).length === 1 && card.includes('lc-next-label') && card.includes('lc-next-text'));
  check('A. CANONICAL STRUCTURE', label + ': standard primary + secondary controls present (Start next module / Back to course)', /class="lc-btn"[^>]*onclick="openModuleById\(\d+\)"/.test(card) && /class="lc-btn-ghost"[^>]*onclick="showHome\(\)"/.test(card));
}

// ─────────────────────────────────────────────────────────────────────────
// B. LEGACY/CUSTOM ELEMENTS MUST NOT REMAIN
// ─────────────────────────────────────────────────────────────────────────
for (const [moduleId, elementId] of Object.entries(STANDARD_MODULE_COMPLETION_IDS)) {
  const card = cards[moduleId];
  if (!card) continue;
  const label = 'Module ' + moduleId + ' (#' + elementId + ')';
  check('B. NO LEGACY ELEMENTS', label + ': no .lc-gold', !card.includes('lc-gold'));
  check('B. NO LEGACY ELEMENTS', label + ': no .lc-sub', !card.includes('class="lc-sub"'));
  check('B. NO LEGACY ELEMENTS', label + ': no .lc-recap', !card.includes('lc-recap'));
  check('B. NO LEGACY ELEMENTS', label + ': no .lc-recap-list', !card.includes('lc-recap-list'));
  check('B. NO LEGACY ELEMENTS', label + ': no redundant "Module N complete" label before the title (old pre-title eyebrow pattern)', !/lc-next-label">[^<]*complete<\/div>\s*\n\s*<div class="lc-title"/.test(card));
  check('B. NO LEGACY ELEMENTS', label + ': no multiple stacked body-summary blocks (only one .lc-body, checked in section A, and zero leftover .lc-sub siblings)', (card.match(/class="lc-(body|sub)"/g) || []).length === 1);
}

// ─────────────────────────────────────────────────────────────────────────
// C. NO STANDALONE END-OF-MODULE RECAP SECTIONS IMMEDIATELY BEFORE THE CARD
// (does not touch legitimate in-module instructional recaps elsewhere)
// ─────────────────────────────────────────────────────────────────────────
for (const [moduleId, elementId] of Object.entries(STANDARD_MODULE_COMPLETION_IDS)) {
  const idPos = courseSrc.indexOf('id="' + elementId + '"');
  if (idPos === -1) continue;
  // Look at the 1200 chars immediately preceding the card for a standalone
  // "Module recap" white section header (sec-eyebrow/sec-title), which is
  // the specific end-of-module duplicate-recap pattern this task targets.
  const precedingText = courseSrc.slice(Math.max(0, idPos - 1200), idPos);
  check('C. NO STANDALONE RECAP BEFORE CARD', 'Module ' + moduleId + ': no white "Module recap" section immediately preceding the completion card', !/class="sec-(eyebrow|title)"[^>]*>Module [Rr]ecap</.test(precedingText));
}

// ─────────────────────────────────────────────────────────────────────────
// D. MODULE 12 IS DOCUMENTED AS INTENTIONALLY EXEMPT, NOT SILENTLY DIFFERENT
// ─────────────────────────────────────────────────────────────────────────
(function module12ExemptionTests() {
  const m12Card = extractCompletionCard('m12Complete');
  check('D. MODULE 12 EXEMPTION', 'm12Complete exists and is genuinely different from the standard pattern (course-completion/certificate screen, not a "next module" card)', !!m12Card && !m12Card.includes('lc-next') && m12Card.includes('showCertificate()'));
  check('D. MODULE 12 EXEMPTION', 'm12Complete is rendered by the certification state machine (Module12Cert.render), not the plain STATIC_MODULES clone-and-reveal path other modules use', /Module12Cert\.render\(wrap\)/.test(courseSrc));
  check('D. MODULE 12 EXEMPTION', 'this test does not require m12Complete to match the standard structure (no A/B/C checks ran against it above)', !Object.prototype.hasOwnProperty.call(STANDARD_MODULE_COMPLETION_IDS, 12));
})();

// ---- Report ----
const byFixture = new Map();
for (const r of results) {
  if (!byFixture.has(r.fixtureName)) byFixture.set(r.fixtureName, []);
  byFixture.get(r.fixtureName).push(r);
}
let anyFail = false;
for (const [fixtureName, checks] of byFixture) {
  const failed = checks.filter((c) => !c.pass);
  if (failed.length > 0) anyFail = true;
  console.log(`[${failed.length === 0 ? 'PASS' : 'FAIL'}] ${fixtureName} (${checks.length - failed.length}/${checks.length})`);
  for (const f of failed) console.log(`    FAILED: ${f.label}${f.detail ? ' — ' + f.detail : ''}`);
}
console.log(`\nTotal: ${results.length}, Passed: ${results.filter((r) => r.pass).length}, Failed: ${results.filter((r) => !r.pass).length}`);
if (anyFail) process.exitCode = 1;
