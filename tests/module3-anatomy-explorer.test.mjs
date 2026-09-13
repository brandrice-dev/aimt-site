// Module 3 "Anatomy to Action" visual explorer — regression test.
//
// Guards against the exact bug fixed in the Modules 2-11 bulk launch-triage
// pass: the four explorer buttons called a bare global openStep(i), which
// Module 2's rebuild had already deleted (it was that module's own,
// unrelated arrival-accordion function of the same name) -- silently
// breaking the interaction with a ReferenceError on click. The fix scoped
// a new handler to Module 3's own namespace (m3OpenAnatomyStep) instead of
// reviving a bare global, specifically so this collision can't recur. This
// test locks that in: no onclick in this component may ever call a bare
// openStep(...) again, and the real handler must exist, be Module-3-scoped,
// touch only the four documented trigger/detail pairs, and never write
// progress/checkpoint/completion state (the component is explicitly
// ungraded per module-03.md).
//
// Flat-HTML site, no build step, no DOM test runner (see CLAUDE.md) -- static
// source checks against the real shipped file, same principle every other
// regex-based test in this repo already follows.
//
// Run: node tests/module3-anatomy-explorer.test.mjs

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

// ─────────────────────────────────────────────────────────────────────────
// A. NO BARE openStep(...) CALL SITES ANYWHERE
// ─────────────────────────────────────────────────────────────────────────
(function noBareOpenStep() {
  check('A. NO BARE openStep', 'No onclick anywhere calls a bare openStep(...) (the deleted Module 2 global that used to break this component)', !/onclick="openStep\(/.test(src));
  check('A. NO BARE openStep', 'No top-level "function openStep(" exists anywhere (would silently resurrect the collision this fix avoids)', !/(^|\n)function openStep\(/.test(src));
})();

// ─────────────────────────────────────────────────────────────────────────
// B. THE FOUR CONTROLS REFERENCE A REAL, MODULE-3-SCOPED HANDLER
// ─────────────────────────────────────────────────────────────────────────
(function fourControlsWired() {
  for (let i = 0; i < 4; i++) {
    check('B. FOUR CONTROLS WIRED', `Trigger ${i}: button#a2a-trigger-${i} calls m3OpenAnatomyStep(${i})`,
      new RegExp(`id="a2a-trigger-${i}"[^>]*onclick="m3OpenAnatomyStep\\(${i}\\)"`).test(src));
    check('B. FOUR CONTROLS WIRED', `Detail ${i}: div#a2a-step-${i} exists (the panel m3OpenAnatomyStep(${i}) toggles)`,
      new RegExp(`class="tl-detail" id="a2a-step-${i}"`).test(src));
  }
})();

// ─────────────────────────────────────────────────────────────────────────
// C. m3OpenAnatomyStep() ITSELF: EXISTS, IS UNGRADED, TOUCHES ONLY THIS COMPONENT
// ─────────────────────────────────────────────────────────────────────────
(function handlerBodyChecks() {
  const fnMatch = src.match(/function m3OpenAnatomyStep\(i\)\s*\{[\s\S]*?\n\}/);
  check('C. HANDLER BODY', 'function m3OpenAnatomyStep(i) exists', !!fnMatch);
  if (!fnMatch) return;
  const body = fnMatch[0];

  check('C. HANDLER BODY', 'Reads trigger/detail via the live-rendered-copy-scoped getActiveElementById() helper (not raw document.getElementById, which would resolve against the hidden template)',
    /getActiveElementById\('a2a-trigger-' \+ i\)/.test(body) && /getActiveElementById\('a2a-step-' \+ i\)/.test(body));
  check('C. HANDLER BODY', 'Only toggles the .open class + aria-expanded — no other DOM/class mutation', (body.match(/classList\.(toggle|add|remove)/g) || []).length === 2 && /setAttribute\('aria-expanded'/.test(body));
  check('C. HANDLER BODY', 'Never calls setCheckpointResult / APP_STATE.save / any progress-write API (ungraded, no progress write per module-03.md)', !/setCheckpointResult|APP_STATE\.save|markModuleComplete/.test(body));
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
