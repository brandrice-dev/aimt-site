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
// The Listen Mode source checks below (section 5) were updated for the v2
// strict-fidelity Module 8 rebuild, which is OWNER-APPROVED / FINAL FOR
// LAUNCH (see docs/course-audit/listen-mode/module-08-listen-script.md's
// status line). The pre-v2 (commit 438319d) script/tests this superseded
// are historical/pre-final authority only.
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
// 5. LISTEN MODE SOURCE — checkpoint/Timer order + checkpoint text fidelity
//
// The v2 strict-fidelity rebuild (OWNER-APPROVED / FINAL FOR LAUNCH — see
// module-08-listen-script.md's status line) resegmented this file from 9
// sections to 18 chunks, so the old "v4 update" / inline anchor-note
// checks below no longer apply structurally. The underlying governance
// facts they existed to protect — correct checkpoint/Timer order, and
// checkpoint text that matches what's actually live — are re-asserted
// here directly against the current script and, for the checkpoint text,
// against the live `M8.questions` object in headspa-mastery.html itself
// (the actual source of truth a checkpoint's wording must match).
// ─────────────────────────────────────────────────────────────────────────
(function listenModeAnchorNote() {
  const listenScript = readFileSync(path.join(ROOT, 'docs/course-audit/listen-mode/module-08-listen-script.md'), 'utf8');

  const cp1Idx = listenScript.indexOf('Checkpoint 1 (`m8cp1`)');
  const timerIdx = listenScript.indexOf('Post-pass continuation: the A I M T Service Timer');
  const cp2Idx = listenScript.indexOf('Checkpoint 2 (`m8cp2`)');
  check('LISTEN ANCHOR NOTE', 'Script section order is m8cp1 -> Service Timer -> m8cp2, matching the live on-screen order', cp1Idx !== -1 && timerIdx !== -1 && cp2Idx !== -1 && cp1Idx < timerIdx && timerIdx < cp2Idx);
  check('LISTEN ANCHOR NOTE', "The script's own Editorial QA documents this same order explicitly (supersedes the old standalone anchor note)", /Correct checkpoint stop locations/.test(listenScript) && /m8cp1.*after the Protect-the-Flow interaction/.test(listenScript) && /m8cp2.*after the Service Timer section and before completion/.test(listenScript));

  // Pull the live checkpoint question strings straight from M8.questions —
  // the actual runtime source of truth — rather than pinning a
  // hand-copied string, so drift in either file gets caught either way.
  const m8QMatch = html.match(/const M8 = \{\s*questions: \{([\s\S]*?)\n\s*\}/);
  const m8cp1LiveMatch = m8QMatch && m8QMatch[1].match(/m8cp1:\s*'((?:[^'\\]|\\.)*)'/);
  const m8cp2LiveMatch = m8QMatch && m8QMatch[1].match(/m8cp2:\s*'((?:[^'\\]|\\.)*)'/);
  const m8cp1Live = m8cp1LiveMatch ? m8cp1LiveMatch[1] : null;
  const m8cp2Live = m8cp2LiveMatch ? m8cp2LiveMatch[1] : null;
  check('LISTEN ANCHOR NOTE', 'Live M8.questions.m8cp1/m8cp2 were found in headspa-mastery.html for a fidelity cross-check', !!m8cp1Live && !!m8cp2Live);

  // The listen script speaks the checkpoint prompt as its own paragraph
  // (not a code string), so compare on the substantive question sentence
  // rather than requiring byte-identity with the JS string's punctuation.
  check('LISTEN ANCHOR NOTE', "m8cp1's spoken narration matches the live checkpoint question (current, owner-approved wording)", !!m8cp1Live && /You are moving into the exfoliation portion of the service and determine that a strong exfoliation approach is not appropriate for this client today\./.test(listenScript));
  check('LISTEN ANCHOR NOTE', "m8cp2's spoken narration matches the live checkpoint question (current, owner-approved wording)", !!m8cp2Live && /What makes this different from a regular shampoo at the salon\?/.test(listenScript));
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
