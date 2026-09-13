// Module 11 — "signature question" / "signature takeaway" standalone
// statement lines — regression test.
//
// module-11.md specifies four standalone .m11-statement lines (11.3's
// signature question + signature takeaway, 11.5's closing line, 11.8's
// opening line) that had gone missing from the shipped page entirely,
// silently dropping approved course content with no error of any kind.
// Fixed in the Modules 2-11 bulk launch-triage pass by restoring the exact
// approved wording plus the minimal new .m11-statement CSS its markup
// depends on. This test locks the fix in: all four lines must exist,
// word-for-word, in their documented section positions, exactly once each
// (no duplication), and the CSS rule they depend on must still exist.
//
// Flat-HTML site, no build step, no DOM test runner (see CLAUDE.md) -- static
// source checks against the real shipped file, same principle every other
// regex-based test in this repo already follows.
//
// Run: node tests/module11-signature-statements.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const src = readFileSync(path.join(ROOT, 'headspa-mastery.html'), 'utf8');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

// The four approved statements, module-11.md's exact wording, in document
// order. Each must appear exactly once in the shipped page's Module 11
// template (module templates are defined once, then cloned into the live
// #lessonView copy at runtime -- this test reads the authored template
// source, not a rendered DOM).
const STATEMENTS = [
  { section: '11.3 (signature question)', text: 'What are you asking the tool to do — and what still belongs to you?' },
  { section: '11.3 (signature takeaway)', text: 'Use AI for leverage. Keep human authority where it matters.' },
  { section: '11.5 (closing line)', text: 'The goal is not to defeat the AI answer. It is to return the conversation to responsible human judgment.' },
  { section: '11.8 (opening line)', text: 'Modern does not mean less human.' },
];

// ─────────────────────────────────────────────────────────────────────────
// A. EACH STATEMENT EXISTS, EXACTLY ONCE, WITH EXACT APPROVED WORDING
// ─────────────────────────────────────────────────────────────────────────
(function statementsExistExactlyOnce() {
  for (const { section, text } of STATEMENTS) {
    const markup = `<div class="m11-statement">"${text}"</div>`;
    const occurrences = src.split(markup).length - 1;
    check('A. STATEMENT PRESENT & EXACT', `${section}: exact approved wording present, exactly once in the authored template`, occurrences === 1, occurrences === 0 ? 'not found' : `found ${occurrences} times`);
  }
})();

// ─────────────────────────────────────────────────────────────────────────
// B. DOCUMENT ORDER MATCHES module-11.md (11.3 x2, then 11.5, then 11.8)
// ─────────────────────────────────────────────────────────────────────────
(function documentOrder() {
  const positions = STATEMENTS.map(({ text }) => src.indexOf(`<div class="m11-statement">"${text}"</div>`));
  const allFound = positions.every((p) => p !== -1);
  check('B. DOCUMENT ORDER', 'All four statements found before checking order', allFound);
  if (!allFound) return;
  const inOrder = positions.every((p, i) => i === 0 || p > positions[i - 1]);
  check('B. DOCUMENT ORDER', 'Statements appear in module-11.md\'s documented order (11.3 x2 -> 11.5 -> 11.8)', inOrder, JSON.stringify(positions));
})();

// ─────────────────────────────────────────────────────────────────────────
// C. STRUCTURAL PLACEMENT — each statement sits next to its documented anchor
// ─────────────────────────────────────────────────────────────────────────
(function structuralPlacement() {
  check('C. STRUCTURAL PLACEMENT', '11.3 signature question immediately follows "Decide How Much Authority to Give the Tool" sec-title, before .m11-framework',
    /<div class="sec-title">Decide How Much Authority to Give the Tool<\/div>\s*\n\s*<div class="m11-statement">"What are you asking the tool to do/.test(src));
  check('C. STRUCTURAL PLACEMENT', '11.3 signature takeaway sits between .m11-framework\'s close and the divider into 11.4',
    /<\/div>\s*\n\s*<div class="m11-statement">"Use AI for leverage\. Keep human authority where it matters\."<\/div>\s*\n\s*<hr class="divider">/.test(src));
  check('C. STRUCTURAL PLACEMENT', '11.5 closing line sits right before the divider leading into m11cp1',
    /<div class="m11-statement">"The goal is not to defeat the AI answer\. It is to return the conversation to responsible human judgment\."<\/div>\s*\n\s*<hr class="divider">\s*\n\s*<div class="checkpoint cc-card" id="m11cp1">/.test(src));
  check('C. STRUCTURAL PLACEMENT', '11.8 opening line immediately follows "Stay Human Where Human Matters" sec-title, before the first AI-may body-text',
    /<div class="sec-title">Stay Human Where Human Matters<\/div>\s*\n\s*<div class="m11-statement">"Modern does not mean less human\."<\/div>\s*\n\s*<div class="body-text"><strong>AI may draft\.<\/strong>/.test(src));
})();

// ─────────────────────────────────────────────────────────────────────────
// D. .m11-statement CSS RULE EXISTS (the markup depends on it for typography)
// ─────────────────────────────────────────────────────────────────────────
(function cssRuleExists() {
  check('D. CSS RULE', '.m11-statement CSS rule is defined', /\.m11-statement\s*\{[^}]*\}/.test(src));
  const ruleMatch = src.match(/\.m11-statement\s*\{([^}]*)\}/);
  check('D. CSS RULE', '.m11-statement uses the serif italic pull-quote treatment (matches this course\'s existing serif-emphasis convention, not a new visual style)',
    !!ruleMatch && /font-style:\s*italic/.test(ruleMatch[1]) && /font-family:\s*var\(--aimt-font-serif\)/.test(ruleMatch[1]));
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
