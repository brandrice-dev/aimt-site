// Module 8 — pre-audio polish pass: Cadence Check CTA sizing + Service
// Timer/final-checkpoint reorder. Regression tests.
//
// Covers the two changes made in this pass:
//  1. The mobile/narrow `.checkpoint.cc-card .cp-btn` ("Open Cadence
//     Check →") CTA was a `width:100%; max-width:340px` slab that still
//     rendered edge-to-edge on real phone widths (max-width never bound,
//     since the card's own content column is under 340px there). Switched
//     to the same natural-content-width technique the .cc-resolved button
//     already used (`inline-flex` + `width:auto`, centered by the card's
//     own `text-align:center`), with a defensive max-width cap. Desktop
//     (768px+) restores `width:100%; display:flex` explicitly, unchanged
//     from before.
//  2. The AIMT Service Timer section moved from after both Module 8
//     checkpoints to between m8cp1 and the final checkpoint (m8cp2) — the
//     practitioner now receives the practical execution tool after
//     learning the full service and before the final competency check,
//     not after it. Section order only: Timer content, link, and
//     functionality, the Core/Extended framework, both checkpoint IDs/
//     questions/rubrics, and completion/gating/Module-9-unlock logic are
//     all unchanged.
//
// Run: node tests/module-08-timer-checkpoint-order.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const html = readFileSync(path.join(ROOT, 'headspa-mastery.html'), 'utf8');

// ─────────────────────────────────────────────────────────────────────────
// 1. CADENCE CHECK CTA — mobile shrink-to-fit, desktop unchanged
// ─────────────────────────────────────────────────────────────────────────
(function ctaSizing() {
  const baseMatch = html.match(/\.checkpoint\.cc-card \.cp-btn \{([^}]*)\}/);
  // Strip CSS comments before asserting on the rule body -- the rule's own
  // explanatory comment discusses the old width:100%/340px values by name
  // (as history), which would otherwise false-fail a naive substring check
  // against the live declarations.
  const baseRule = baseMatch ? baseMatch[1].replace(/\/\*[\s\S]*?\*\//g, '') : '';
  check('CTA SIZING', 'Base (mobile-first) .cp-btn rule was found', !!baseMatch);
  check('CTA SIZING', 'Base rule no longer forces width:100% (the "giant slab" regression)', !/width:\s*100%/.test(baseRule));
  check('CTA SIZING', 'Base rule shrink-wraps to content (inline-flex + width:auto), matching the .cc-resolved button\'s already-working technique', /display:\s*inline-flex/.test(baseRule) && /width:\s*auto/.test(baseRule));
  check('CTA SIZING', 'Base rule keeps a defensive max-width cap, materially narrower than the old 340px', (() => {
    const m = baseRule.match(/max-width:\s*(\d+)px/);
    return !!m && Number(m[1]) > 0 && Number(m[1]) < 340;
  })());
  check('CTA SIZING', 'Height/touch-target sizing is still comfortable (padding preserved, not shrunk to "tiny")', /padding:\s*0\.9[0-9]*rem/.test(baseRule));
  check('CTA SIZING', 'Copy, activation onclick, and aria-label are untouched (only proportion changed)', /submitM8CP\('m8cp1'\)/.test(html) && /aria-label="Open Cadence Check"/.test(html) && (html.match(/Open Cadence Check →/g) || []).length >= 2);

  const desktopMatch = html.match(/\.checkpoint\.cc-card \.cp-btn \{ width: 100%; max-width: none; display: flex;[^}]*\}/);
  check('CTA SIZING', 'Desktop (768px+) override explicitly restores width:100%/display:flex — desktop behavior unchanged', !!desktopMatch);

  // The resolved-state (already-passed) button was not touched by this pass.
  const resolvedMatch = html.match(/\.checkpoint\.cc-card\.cc-resolved \.cp-btn \{([^}]*)\}/);
  check('CTA SIZING', '.cc-resolved .cp-btn rule (the pattern this fix now mirrors) is unchanged', !!resolvedMatch && /width:\s*auto/.test(resolvedMatch[1]) && /display:\s*inline-flex/.test(resolvedMatch[1]));
})();

// ─────────────────────────────────────────────────────────────────────────
// 2. MODULE 8 END-OF-MODULE SECTION ORDER
// ─────────────────────────────────────────────────────────────────────────
(function sectionOrder() {
  const markers = ['id="m8cp1"', 'id="m8TimerFeature"', 'id="m8cp2"', 'id="m8Complete"'];
  const positions = markers.map((m) => html.indexOf(m));
  const allFound = positions.every((p) => p !== -1);
  check('SECTION ORDER', 'm8cp1, the Timer feature, m8cp2, and the completion card all exist exactly once', allFound && markers.every((m) => (html.match(new RegExp(m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length === 1));

  check('SECTION ORDER', 'New order: m8cp1 -> Service Timer -> final checkpoint (m8cp2) -> module completion', allFound && positions.every((p, i) => i === 0 || p > positions[i - 1]));

  // The specific assertion requested: Timer position < final checkpoint position.
  const timerPos = html.indexOf('id="m8TimerFeature"');
  const finalCheckpointPos = html.indexOf('id="m8cp2"');
  check('SECTION ORDER', 'Service Timer DOM position is before the final Module 8 checkpoint (m8cp2) DOM position', timerPos !== -1 && finalCheckpointPos !== -1 && timerPos < finalCheckpointPos);

  check('SECTION ORDER', 'The Timer section is not duplicated (exactly one "Take the Service Into Practice" heading in Module 8)', (html.match(/Take the Service Into Practice/g) || []).length === 1);

  // Scoped to Module 8's own wrap so this can't accidentally match another
  // module's unrelated content further down the file.
  const wrapStart = html.indexOf('<div id="module8Wrap"');
  const wrapEnd = html.indexOf('MODULE 9 CONTENT', wrapStart);
  const scoped = (wrapStart !== -1 && wrapEnd !== -1) ? html.slice(wrapStart, wrapEnd) : '';
  check('SECTION ORDER', "Module 8's own wrap was isolated for a scoped order check", scoped.length > 0);
  if (scoped) {
    const scopedPositions = markers.map((m) => scoped.indexOf(m));
    check('SECTION ORDER', "Order holds within Module 8's own wrap specifically (not a false match against another module)", scopedPositions.every((p) => p !== -1) && scopedPositions.every((p, i) => i === 0 || p > scopedPositions[i - 1]));
  }
})();

// ─────────────────────────────────────────────────────────────────────────
// 3. TIMER CONTENT / FUNCTIONALITY / FRAMEWORK — unchanged
// ─────────────────────────────────────────────────────────────────────────
(function timerUnchanged() {
  check('TIMER UNCHANGED', 'Timer badge/title/body copy present', /Included with your certification/.test(html) && /AIMT Service Timer/.test(html));
  check('TIMER UNCHANGED', 'Links to the canonical standalone Timer are present and unchanged', /href="aimt-service-timer\.html"/.test(html));
  check('TIMER UNCHANGED', 'In-page preview app markup (ring, clock, phase, timeline, back/skip) is intact', /id="m8tpRingFill"/.test(html) && /id="m8tpClock"/.test(html) && /id="m8TimerBack\(\)|m8TimerBack\(\)/.test(html) && /m8TimerSkip\(\)/.test(html));
  check('TIMER UNCHANGED', 'Auto-start-on-scroll behavior (IntersectionObserver-driven) is untouched', /function m8InitTimerAutostart/.test(html));
  const previewMatch = html.match(/const M8_TIMER_PREVIEW_STEPS = \[[\s\S]*?\n\];/);
  check('TIMER UNCHANGED', 'Core/Extended framework reference (90-minute Extended reference preview) unchanged', /Extended \(90-minute\) reference/.test(html));
  check('TIMER UNCHANGED', 'Standalone Timer Core/Extended totals unchanged (60/90) — verified against the same file the prior freeze pass checked', (() => {
    const timerHtml = readFileSync(path.join(ROOT, 'aimt-service-timer.html'), 'utf8');
    return /core:\{[\s\S]*?totalSeconds:60\*60,/.test(timerHtml) && /extended:\{[\s\S]*?totalSeconds:90\*60,/.test(timerHtml);
  })());
})();

// ─────────────────────────────────────────────────────────────────────────
// 4. CHECKPOINTS / COMPLETION / GATING — unchanged by the reorder
// ─────────────────────────────────────────────────────────────────────────
(function checkpointsAndGatingUnchanged() {
  check('GATING UNCHANGED', "MODULE_CHECKPOINTS['8'] is still exactly ['m8cp1','m8cp2'], in that order (order here is a config array, not DOM position — unaffected by the HTML move)", /'8':\s*\['m8cp1',\s*'m8cp2'\]/.test(html));
  check('GATING UNCHANGED', 'Module 8 still requires exactly 9 video chapters for completion', /MODULE_REQUIRED_VIDEO_CHAPTERS\s*=\s*\{\s*'8':\s*9\s*\}/.test(html));
  check('GATING UNCHANGED', 'm8cp1\'s question/label ("Adaptation check") and m8cp2\'s ("Client question") are both present, unchanged', /<div class="cp-label cc-headline">Adaptation check<\/div>/.test(html) && /<div class="cp-label cc-headline">Client question<\/div>/.test(html));
  check('GATING UNCHANGED', 'Both checkpoints still submit via the same submitM8CP() path, keyed by their own id', /onclick="submitM8CP\('m8cp1'\)"/.test(html) && /onclick="submitM8CP\('m8cp2'\)"/.test(html));
  check('GATING UNCHANGED', 'Module 9 unlock/handoff copy on the completion card is unchanged', /Up next — Module 9/.test(html) && /openModuleById\(9\)/.test(html));
  check('GATING UNCHANGED', '_isModuleFullyComplete()/module completion machinery in headspa-state.js was not touched by this pass (no edit made to that file)', (() => {
    const stateSrc = readFileSync(path.join(ROOT, 'assets/js/headspa-state.js'), 'utf8');
    return /_isModuleFullyComplete\(moduleId\)\s*\{/.test(stateSrc);
  })());
})();

// ─────────────────────────────────────────────────────────────────────────
// 5. LISTEN MODE SOURCE — visual-anchor note reflects the new DOM order
// ─────────────────────────────────────────────────────────────────────────
(function listenModeAnchorNote() {
  const listenScript = readFileSync(path.join(ROOT, 'docs/course-audit/listen-mode/module-08-listen-script.md'), 'utf8');
  check('LISTEN ANCHOR NOTE', 'A v4 update note records the new on-screen order (m8cp1 -> Timer -> m8cp2) without rewriting spoken narration', /v4 update/.test(listenScript) && /m8cp1.*Service Timer.*m8cp2/.test(listenScript.replace(/\n/g, ' ')));
  check('LISTEN ANCHOR NOTE', 'The note flags that m8cp1/m8cp2 are no longer visually adjacent, for whoever builds real per-chunk visual anchors', /no longer (visually )?adjacent|no longer adjacent on screen/.test(listenScript));
  check('LISTEN ANCHOR NOTE', "M8-08's own section carries the same anchor note inline, not just in the front-matter", /Visual anchor note \(see v4 update above\)/.test(listenScript));
  check('LISTEN ANCHOR NOTE', 'The actual spoken checkpoint text (both questions) is byte-unchanged by this pass', /You're moving into the exfoliation portion of the service and determine that a strong exfoliation approach isn't appropriate for this client today\./.test(listenScript) && /What makes this different from a regular shampoo at the salon\?/.test(listenScript));
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
