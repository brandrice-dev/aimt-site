// Phase 2 regression tests — AIMT Cadence Launch Sweep.
// See docs/course-audit/00-cadence-launch-sweep-build-contract.md Section 8
// and docs/course-audit/00-cadence-checkpoint-gate-map.md.
//
// Covers the Phase 2 slice built this session:
//  1. Static wiring: the shared shell's mount point, stylesheet/script
//     includes, and the one-line restoreLessonState() hook that wires
//     every Module 0-11 required checkpoint to it generically (no
//     per-checkpoint bespoke code).
//  2. A regression guard for a real bug found and fixed during this task:
//     the shell's mount point must NOT land inside #module12Wrap (a
//     display:none template whose own markup runs to the end of <body>
//     without an earlier closing point -- confirmed live in-browser).
//  3. getCadenceCheckpointDefinition() resolves the exact, unmodified
//     rubric/question for all 22 real checkpoints across every rubric
//     "shape" found in the audit (M0's singular `system`, per-checkpoint
//     `systems{}` elsewhere, Module 3's bare cp1/cp2 ids, and the
//     Module 9<->10 historical id/slot swap) -- evaluated for real in a
//     vm sandbox, not just regex-matched.
//  4. evaluateCheckpointAnswer()'s new optional requestId parameter is
//     backward-compatible (existing 5-arg call sites unaffected).
//  5. cadence-shell.js: window.CadenceShell shape, Review Mode isolation
//     (mirrors the existing submitCheckpointReviewMode() guarantee: the
//     shell's own Review Mode path never reaches the real endpoints),
//     and that a pass/revise commit calls the exact same APP_STATE
//     sequence submitCheckpoint() always has.
//  6. Module 12 is untouched: MODULE_CHECKPOINTS['12'] stays empty, so
//     restoreLessonState() never wires the shell into Module 12, and
//     module12-certification.js is not referenced anywhere in the new file.
//
// Run: node tests/cadence-phase2-shell.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const html = readFileSync(path.join(ROOT, 'headspa-mastery.html'), 'utf8');
const shellSrc = readFileSync(path.join(ROOT, 'assets/js/cadence-shell.js'), 'utf8');
const shellCss = readFileSync(path.join(ROOT, 'assets/css/cadence-shell.css'), 'utf8');

// ─────────────────────────────────────────────────────────────────────────
// 1. STATIC WIRING — headspa-mastery.html
// ─────────────────────────────────────────────────────────────────────────
(function staticWiring() {
  check('SHELL WIRING', 'Loads the shell stylesheet', /<link rel="stylesheet" href="assets\/css\/cadence-shell\.css">/.test(html));
  check('SHELL WIRING', 'Loads the shell script (deferred, so it runs after the inline script defines M0..M11/APP_STATE-dependent globals)', /<script src="assets\/js\/cadence-shell\.js" defer><\/script>/.test(html));
  check('SHELL WIRING', 'Mounts #cadenceShellRoot exactly once', (html.match(/id="cadenceShellRoot"/g) || []).length === 1);
  check('SHELL WIRING', "restoreLessonState()'s per-checkpoint loop wires every checkpoint to the shell generically (one call site, not per-module)", /if \(window\.CadenceShell\) window\.CadenceShell\.wireCheckpoint\(moduleId, checkpointId\);/.test(html));
  check('SHELL WIRING', 'getCadenceCheckpointDefinition() is defined and exposed on window', /function getCadenceCheckpointDefinition\(moduleId, cpId\)/.test(html) && /window\.getCadenceCheckpointDefinition = getCadenceCheckpointDefinition;/.test(html));
  check('SHELL WIRING', 'The Module 9<->10 historical swap is preserved explicitly in the checkpoint-config source map', /9: M10, 10: M9,/.test(html));

  // Regression guard for the real bug found this task: the mount point
  // must sit BEFORE module12Wrap opens, not after (module12Wrap's own
  // markup runs to end-of-body without an earlier close, so mounting
  // after it silently nests the shell in a display:none subtree).
  const mountIdx = html.indexOf('id="cadenceShellRoot"');
  const module12Idx = html.indexOf('id="module12Wrap"');
  check('SHELL WIRING', 'Mount point is placed before #module12Wrap opens (regression guard -- see cadence-shell.js header comment)', mountIdx !== -1 && module12Idx !== -1 && mountIdx < module12Idx);

  check('SHELL WIRING', 'evaluateCheckpointAnswer() gained an optional 6th requestId param, backward-compatible', /async function evaluateCheckpointAnswer\(moduleId, checkpointId, systemPrompt, question, answer, providedRequestId\)/.test(html));
  check('SHELL WIRING', "Existing 5-arg call site (submitCheckpoint's production path) is untouched", /evaluateCheckpointAnswer\(moduleId, cpId, system, question, text\)/.test(html));
})();

// ─────────────────────────────────────────────────────────────────────────
// 2. MODULE 12 UNTOUCHED
// ─────────────────────────────────────────────────────────────────────────
(function module12Untouched() {
  check('MODULE 12 ISOLATION', "MODULE_CHECKPOINTS['12'] stays empty (no required checkpoints -- restoreLessonState() never wires the shell into Module 12)", /'12':\s*\[\]/.test(html));
  // Documentation comments (this file's own header, and the module12-
  // certification.js:398 cross-file-access precedent cited in the
  // supabaseClient guard comment) legitimately mention Module 12 by
  // name -- what must never exist is a functional reference: an import,
  // a fetch/API call, or a read of certification-only state.
  check('MODULE 12 ISOLATION', 'cadence-shell.js never fetches/imports certification_attempts, part3_conversation_state, or /api/certification/*', !/certification_attempts|part3_conversation_state|\/api\/certification\//.test(shellSrc));
  check('MODULE 12 ISOLATION', "cadence-shell.js never calls window.Module12Cert or anything from module12-certification.js's public API", !/Module12Cert\./.test(shellSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// 3. getCadenceCheckpointDefinition() — real evaluation, all 22 checkpoints
// ─────────────────────────────────────────────────────────────────────────
function loadCheckpointDefinitions() {
  const startMarker = 'const CADENCE_CHECKPOINT_TONE';
  const endMarker = 'window.getCadenceCheckpointDefinition = getCadenceCheckpointDefinition;';
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start === -1 || end === -1) throw new Error('Could not locate extraction boundaries -- markers moved');
  const source = html.slice(start, end + endMarker.length);

  const memoryContextCalls = [];
  const sandbox = {
    console,
    // The extracted range incidentally includes an unrelated top-level
    // `window.addEventListener('scroll', ...)` registration (a lesson-
    // progress listener) that sits between the CADENCE_* constants and
    // M0..M11 in the real file -- harmless to actually register here
    // since nothing in this sandbox ever fires a scroll event.
    window: { addEventListener() {}, removeEventListener() {} },
    APP_STATE: {
      getCadenceMemoryContext(moduleId, mode) {
        memoryContextCalls.push({ moduleId, mode });
        return '[[MEMORY CONTEXT MARKER]]';
      },
    },
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(source, context, { filename: 'headspa-mastery-checkpoint-defs.js' });
  return { getCadenceCheckpointDefinition: sandbox.window.getCadenceCheckpointDefinition, memoryContextCalls };
}

(function checkpointDefinitionResolution() {
  let loaded;
  try {
    loaded = loadCheckpointDefinitions();
  } catch (e) {
    check('CHECKPOINT DEFINITIONS', 'Extraction and vm evaluation succeeds', false, e.message);
    return;
  }
  const { getCadenceCheckpointDefinition } = loaded;
  check('CHECKPOINT DEFINITIONS', 'window.getCadenceCheckpointDefinition is callable after evaluation', typeof getCadenceCheckpointDefinition === 'function');

  // All 22 real checkpoints across every rubric shape found in the audit.
  const allCheckpoints = [
    [0, 'm0cp1'], [1, 'm1cp1'], [1, 'm1cp2'], [2, 'm2cp1'],
    [3, 'cp1'], [3, 'cp2'], [4, 'm4cp1'], [4, 'm4cp2'],
    [5, 'm5cp1'], [5, 'm5cp2'], [6, 'm6cp1'], [6, 'm6cp2'],
    [7, 'm7cp1'], [7, 'm7cp2'], [8, 'm8cp1'], [8, 'm8cp2'],
    [9, 'm10cp1'], [9, 'm10cp2'], [10, 'm9cp1'], [10, 'm9cp2'],
    [11, 'm11cp1'], [11, 'm11cp2'],
  ];
  const resolved = allCheckpoints.map(([moduleId, cpId]) => ({ moduleId, cpId, def: getCadenceCheckpointDefinition(moduleId, cpId) }));
  const allResolved = resolved.every((r) => r.def && typeof r.def.question === 'string' && r.def.question.length > 20 && typeof r.def.system === 'string' && r.def.system.length > 50 && typeof r.def.reviewSystem === 'string');
  check('CHECKPOINT DEFINITIONS', 'All 22 required checkpoints resolve a real question + system + reviewSystem (no per-checkpoint special-casing needed)', allResolved, JSON.stringify(resolved.filter((r) => !r.def).map((r) => r.cpId)));

  check('CHECKPOINT DEFINITIONS', 'An unknown checkpoint id returns null rather than throwing or fabricating content', getCadenceCheckpointDefinition(4, 'not-a-real-checkpoint') === null);
  check('CHECKPOINT DEFINITIONS', 'An unknown module id returns null', getCadenceCheckpointDefinition(99, 'm0cp1') === null);

  // Module 9<->10 historical swap (docs/course-audit/00-cadence-checkpoint-gate-map.md,
  // footnote 1): slot 9 lists m10cp1/m10cp2 (M10's config); slot 10 lists
  // m9cp1/m9cp2 (M9's config). Verify by content, not just structurally --
  // m10cp1's real question text is about pricing/closing (M9/M10's actual
  // subjects were swapped along with the ids).
  const m10cp1AtSlot9 = getCadenceCheckpointDefinition(9, 'm10cp1');
  const m9cp1AtSlot10 = getCadenceCheckpointDefinition(10, 'm9cp1');
  check('CHECKPOINT DEFINITIONS', 'Slot 9 (m10cp1) resolves pricing/closing content, not sanitation', /pric/i.test(m10cp1AtSlot9.question) || /clos/i.test(m10cp1AtSlot9.question));
  check('CHECKPOINT DEFINITIONS', 'Slot 10 (m9cp1) resolves sanitation/reset content, not pricing', /sanitat|reset|disinfect|clean/i.test(m9cp1AtSlot10.question));
  check('CHECKPOINT DEFINITIONS', 'Swapped ids do NOT also resolve at the wrong slot (m10cp1 absent from slot 10, m9cp1 absent from slot 9)', getCadenceCheckpointDefinition(10, 'm10cp1') === null && getCadenceCheckpointDefinition(9, 'm9cp1') === null);

  check('CHECKPOINT DEFINITIONS', "M0's singular `system` (not `systems{}`) resolves the same as every other module's per-checkpoint shape", (() => {
    const d = getCadenceCheckpointDefinition(0, 'm0cp1');
    return !!(d && d.system);
  })());

  check('CHECKPOINT DEFINITIONS', 'The production `system` includes the memory-context call; the Review Mode `reviewSystem` deliberately does not (mirrors submitCheckpoint() vs submitCheckpointReviewMode() exactly)', (() => {
    const d = getCadenceCheckpointDefinition(4, 'm4cp1');
    return d.system.includes('[[MEMORY CONTEXT MARKER]]') && !d.reviewSystem.includes('[[MEMORY CONTEXT MARKER]]');
  })());
  check('CHECKPOINT DEFINITIONS', 'getCadenceMemoryContext was called with mode "checkpoint" (matches the production path, not "guide")', loaded.memoryContextCalls.some((c) => c.mode === 'checkpoint'));
})();

// ─────────────────────────────────────────────────────────────────────────
// 4. cadence-shell.js — shape, Review Mode isolation, authority glue
// ─────────────────────────────────────────────────────────────────────────
(function shellShapeAndIsolation() {
  check('SHELL MODULE', 'Exposes window.CadenceShell with openCheckpoint + wireCheckpoint', /window\.CadenceShell = \{ openCheckpoint, wireCheckpoint \};/.test(shellSrc));
  check('SHELL MODULE', 'Escapes untrusted text before injecting into innerHTML (student answers and model feedback are both external input)', /function escapeHtml/.test(shellSrc) && /function multilineHtml/.test(shellSrc));

  // Review Mode isolation: the production send path calls
  // window.evaluateCheckpointAnswer (-> /api/cadence/evaluate-checkpoint);
  // the Review Mode send path must call ONLY
  // window.evaluateCheckpointAnswerReviewMode, mirroring
  // submitCheckpointReviewMode()'s existing guarantee.
  const sendReviewMatch = shellSrc.match(/async function sendReviewMessage\([\s\S]*?\n  \}\n/);
  check('SHELL MODULE', 'sendReviewMessage() is present and isolated for this static check', !!sendReviewMatch);
  if (sendReviewMatch) {
    const body = sendReviewMatch[0];
    check('SHELL MODULE', "Review Mode's send path calls evaluateCheckpointAnswerReviewMode()", /evaluateCheckpointAnswerReviewMode\(/.test(body));
    check('SHELL MODULE', "Review Mode's send path never calls the server-authoritative evaluate-checkpoint endpoint", !/evaluate-checkpoint/.test(body));
    check('SHELL MODULE', "Review Mode's send path never calls APP_STATE (never persists)", !/APP_STATE/.test(body));
  }

  const renderFixtureMatch = shellSrc.match(/function renderFixture\(key\) \{[\s\S]*?\n  \}\n/);
  check('SHELL MODULE', 'renderFixture() (Review Mode fixtures) never calls get-thread or evaluate-checkpoint', !!renderFixtureMatch && !/get-thread|evaluate-checkpoint/.test(renderFixtureMatch[0]));

  check('SHELL MODULE', 'Production loadProductionThread() calls the real get-thread endpoint', /fetch\('\/api\/cadence\/get-thread/.test(shellSrc));
  check('SHELL MODULE', 'Production submitEvaluation() calls the real evaluateCheckpointAnswer (server-authoritative)', /window\.evaluateCheckpointAnswer\(session\.moduleId, session\.cpId, session\.system, session\.question, text, requestId\)/.test(shellSrc));

  // Authority glue: commitCheckpointPass/Revise must call the exact same
  // APP_STATE sequence the pre-Phase-2 submitCheckpoint() always called --
  // this file never invents a new progress-writing path.
  const passMatch = shellSrc.match(/function commitCheckpointPass\([\s\S]*?\n  \}\n/);
  check('SHELL MODULE', 'commitCheckpointPass() calls setCheckpointResult, captureCheckpointMemory, addResponse, and _checkModuleComplete -- the same sequence submitCheckpoint() always used', !!passMatch && ['setCheckpointResult', 'captureCheckpointMemory', 'addResponse', '_checkModuleComplete'].every((fn) => passMatch[0].includes(fn)));
  const reviseMatch = shellSrc.match(/function commitCheckpointRevise\([\s\S]*?\n  \}\n/);
  check('SHELL MODULE', 'commitCheckpointRevise() calls setCheckpointResult but never captureCheckpointMemory/addResponse/_checkModuleComplete (matches the pre-Phase-2 fail branch exactly)', !!reviseMatch && reviseMatch[0].includes('setCheckpointResult') && !/captureCheckpointMemory|addResponse|_checkModuleComplete/.test(reviseMatch[0]));

  // Historical passed-state fallback (build contract Section 7): must
  // read the student's actually-stored answer/feedback, never fabricate.
  check('SHELL MODULE', 'The historical-passed fallback reads meta.answer/meta.feedback and never invents conversation content', /meta\.answer/.test(shellSrc) && /meta\.feedback/.test(shellSrc) && /Completed in a previous session/.test(shellSrc));

  // Idempotent resume (Section 14): a dangling turn is only auto-resent
  // when a locally-owned pending marker matches, never for an unexplained
  // dangling turn from another device/session.
  check('SHELL MODULE', 'A dangling user turn with no matching local pending marker is never auto-resent (manual retry only)', /hasDanglingUserTurn && pending && pending\.requestId && pending\.text === lastMsg\.content/.test(shellSrc));

  // Duplicate-send guard.
  check('SHELL MODULE', 'The composer refuses a second send while one is in flight (session.busy guard)', /if \(!session \|\| session\.busy\) return;/.test(shellSrc));

  // Accessibility.
  check('SHELL MODULE', 'Dialog semantics + focus trap + Escape-to-close are present', /role="dialog"/.test(shellSrc) && /function trapFocus/.test(shellSrc) && /e\.key === 'Escape'/.test(shellSrc));
  check('SHELL MODULE', 'Voice reuses the single existing global implementation (no second voice pipeline)', /window\.startVoice\(/.test(shellSrc) && !/SpeechRecognition/.test(shellSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// 5. Mobile / safe-area (Section 21) and z-index hierarchy (regression
//    guard for the lesson-nav bleed-through bug found and fixed live)
// ─────────────────────────────────────────────────────────────────────────
(function mobileAndStacking() {
  check('SHELL CSS', 'Uses env(safe-area-inset-*) for the header and composer', /env\(safe-area-inset-top/.test(shellCss) && /env\(safe-area-inset-bottom/.test(shellCss));
  check('SHELL CSS', 'Reduced-motion is respected for the breathing dot and typing indicator', /@media \(prefers-reduced-motion: reduce\)/.test(shellCss));
  check('SHELL CSS', 'The transcript pane has min-height:0 (regression guard -- without it, a flex item defaults to content-based min-height and can push the composer below the viewport fold on mobile; confirmed via 375x812 QA)', /\.cshell-transcript \{[\s\S]*?min-height: 0;/.test(shellCss));
  // Bounded to the actual .cshell{...} declaration block (stops at the
  // first closing brace), with CSS comments stripped first -- the block
  // legitimately *discusses* `min-height: 100vh` inside a comment
  // explaining why it was removed, which would otherwise false-fail a
  // naive substring check.
  const cshellBlockMatch = shellCss.match(/\.cshell \{([^}]*)\}/);
  const cshellBlockNoComments = cshellBlockMatch ? cshellBlockMatch[1].replace(/\/\*[\s\S]*?\*\//g, '') : '';
  check('SHELL CSS', 'No `min-height: 100vh` floor on .cshell (regression guard -- this was tried and found to override the smaller review-banner-adjusted height, overflowing the composer past the viewport bottom; confirmed via 375x812 QA)', !!cshellBlockMatch && !/min-height:\s*100vh/.test(cshellBlockNoComments));
  check('SHELL CSS', 'Shell overlay/panel z-index sits above the page lesson-nav (100) and guide panel (300), confirmed via live stacking QA', /z-index: 2490;/.test(shellCss) && /z-index: 2500;/.test(shellCss));
  check('SHELL JS', 'Height is derived from visualViewport but only when a real (non-zero) reading is available -- setting it to "0px" would defeat the CSS var() fallback to 100dvh', /if \(!vv \|\| !vv\.height\) \{ dom\.shell\.style\.removeProperty\('--cshell-vh'\); return; \}/.test(shellSrc));
  check('SHELL JS', 'The shell is offset below the review-mode banner when present, measured live rather than hardcoded', /getPageChromeOffsetTop/.test(shellSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// Report
// ─────────────────────────────────────────────────────────────────────────
const byFixture = {};
results.forEach((r) => {
  byFixture[r.fixtureName] = byFixture[r.fixtureName] || [];
  byFixture[r.fixtureName].push(r);
});
let totalPass = 0;
Object.entries(byFixture).forEach(([name, rs]) => {
  const passed = rs.filter((r) => r.pass).length;
  totalPass += passed;
  console.log(`[${passed === rs.length ? 'PASS' : 'FAIL'}] ${name} (${passed}/${rs.length})`);
  rs.filter((r) => !r.pass).forEach((r) => console.log(`    FAILED: ${r.label}${r.detail ? ' -- ' + r.detail : ''}`));
});
console.log(`\nTotal: ${results.length}, Passed: ${totalPass}, Failed: ${results.length - totalPass}`);
if (totalPass !== results.length) process.exitCode = 1;
