// Cadence Check entry sequencing — regression test.
//
// Root cause this guards against: the large Cadence Check card mark's
// turn+glow (CadenceIdentity.activate()) and the checkpoint shell's own
// open (a synchronous, full-screen, position:fixed takeover) used to run
// in the SAME synchronous click-event tick. Nothing yielded to the
// browser in between, so the very first frame anyone could ever see
// already showed the shell fully open, covering the card. Fixed by
// making the whole entry a real, awaited sequence in cadence-shell.js's
// wireCheckpoint(): activate the mark, wait for CadenceIdentity.
// activate()'s Promise (resolves only once the activation has actually
// played) to resolve, THEN fade the card, THEN open the shell.
//
// A second root cause, found in a later pass, then UNDONE in a pass
// after that (explicit owner direction: "copy the same motion inputs
// used in the Cadence intro. Do not invent a substitute"): an earlier
// version of CadenceIdentity.activate() swapped the resting mark for a
// completely different, more elaborate injected SVG (staggered per-node
// pulses, a comet-trace arc, a separate blurred bloom shape), reasoning
// that a bare rotation is "nearly imperceptible" on an 8-fold-symmetric
// mark. That reasoning was backwards -- the intro's own mark has the
// identical symmetry and uses a bare turn anyway, because the turn was
// never the visible part; the color/glow brightening during it is. The
// swapped-in animation was an invented substitute for the intro's actual
// motion language, not a reproduction of it, and this file's own
// assertions (checking for the swapped SVG's cdact- markup) were
// guarding the WRONG mechanism.
//
// CadenceIdentity.activate() now reuses the intro's exact recipe (see
// runOrbitalActivation()/runThinkingTurns() in
// assets/js/aimt-cadence-intro.js): the SAME resting icon element turns
// via the CSS `rotate` property (already defined with a 2600ms
// transition on .cadence-id-icon in cadence-identity.css, copied
// verbatim from the intro's own .intro-mark-icon rule), rotation
// ACCUMULATES by +360deg per activation (never resets to 0, which is
// what guarantees the transition actually fires on every repeat entry),
// and `.is-blooming` (also already defined in cadence-identity.css) is
// toggled on/off at the intro's own ORBITAL_BLOOM_DELAY_MS/
// ORBITAL_TURN_MS. No element is ever swapped or replaced.
//
// This file verifies the mechanism itself, not just that classes/calls
// exist somewhere in the source:
//  1. The old swapped-SVG approach (CADENCE_ACTIVATION_SVG, cdact-
//     namespaced markup) is gone -- reintroducing it would be exactly
//     the "invented substitute" the owner explicitly rejected.
//  2. The intro's own timing constants (2600ms turn, 1330ms bloom delay,
//     350ms settle) are used verbatim, not re-derived or approximated.
//  3. CadenceIdentity.activate() is executed for real (a minimal but
//     faithful fake DOM, not a full jsdom dependency) and proven to: (a)
//     rotate the SAME icon element (identity-checked, never replaced),
//     (b) ACCUMULATE rotation across repeat activations (360deg, then
//     720deg, never resetting to 360 again -- the actual mechanism that
//     makes repeat entries animate at all), (c) toggle `is-blooming` at
//     the correct scheduled delays, and (d) resolve only after a real
//     elapsed delay matching the intro's own authored duration, both
//     with and without prefers-reduced-motion.
//  4. restoreResting() never touches markup (nothing was ever swapped),
//     only defensively clears `is-blooming`.
//  5. wireCheckpoint()'s open() closure in cadence-shell.js is proven,
//     by source position, to call openCheckpoint() only INSIDE the
//     .then() continuation chained off CadenceIdentity.activate(mark) --
//     never in the same synchronous scope as activate()/`cc-entering`.
//  6. A double-click / refocus during the transition is guarded
//     (`transitioning`) so it cannot restart or double-fire the sequence.
//
// Run: node tests/cadence-check-entry-sequencing.test.mjs

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

const identitySrc = readFileSync(path.join(ROOT, 'assets/js/cadence-identity.js'), 'utf8');
const shellSrc = readFileSync(path.join(ROOT, 'assets/js/cadence-shell.js'), 'utf8');

// ─────────────────────────────────────────────────────────────────────────
// 1. The old swapped-SVG approach is gone; the intro's own timing
//    constants are used verbatim -- static source checks.
// ─────────────────────────────────────────────────────────────────────────
(function activationMechanismShape() {
  check('ACTIVATION MECHANISM', 'The old swapped-in activation SVG constant is gone (CADENCE_ACTIVATION_SVG) -- reintroducing a separate injected animation would be exactly the "invented substitute" the owner explicitly rejected', !/CADENCE_ACTIVATION_SVG/.test(identitySrc));
  check('ACTIVATION MECHANISM', 'No cdact- namespaced markup remains', !/cdact-/.test(identitySrc));
  check('ACTIVATION MECHANISM', "Rotation is read back and accumulated (+360deg), never reset to a fixed value -- the actual mechanism that makes the CSS `rotate` transition fire again on every repeat entry", /\.rotate\s*\|\|/.test(identitySrc) && /\+\s*360/.test(identitySrc));
  check('ACTIVATION MECHANISM', 'ORBITAL_TURN_MS is the intro\'s own 2600ms (aimt-cadence-intro.js ORBITAL_TURN_MS), not a re-derived value', /ORBITAL_TURN_MS\s*=\s*2600/.test(identitySrc));
  check('ACTIVATION MECHANISM', 'ORBITAL_BLOOM_DELAY_MS is the intro\'s own 1330ms', /ORBITAL_BLOOM_DELAY_MS\s*=\s*1330/.test(identitySrc));
  check('ACTIVATION MECHANISM', 'ORBITAL_SETTLE_MS is the intro\'s own 350ms', /ORBITAL_SETTLE_MS\s*=\s*350/.test(identitySrc));
  check('ACTIVATION MECHANISM', "activate() toggles the SAME `.is-blooming` class the intro's own .is-blooming CSS rules use (cadence-identity.css) -- not a new/separate glow mechanism", /classList\.add\('is-blooming'\)/.test(identitySrc) && /classList\.remove\('is-blooming'\)/.test(identitySrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// 2 & 3. CadenceIdentity.activate()/restoreResting() actually executed --
//    a minimal, purpose-built fake DOM (createElement/classList/style/
//    querySelector), not a full jsdom dependency, sufficient to exercise
//    the real rotate-accumulate + class-toggle logic.
// ─────────────────────────────────────────────────────────────────────────
function makeFakeElement(tag) {
  const classes = new Set();
  const el = {
    tagName: tag,
    style: {},
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
    },
    _children: [],
    querySelector(sel) {
      const cls = sel.replace('.', '');
      if (classes.has(cls)) return el;
      for (const c of el._children) { if (c.classList.contains(cls)) return c; }
      return null;
    },
  };
  return el;
}

function makeMarkEl() {
  const markEl = makeFakeElement('span');
  markEl.classList.add('cadence-id');
  const icon = makeFakeElement('svg');
  icon.classList.add('cadence-id-icon');
  markEl._children = [icon];
  return markEl;
}

function loadCadenceIdentity(reducedMotion, useRealTimers) {
  const sandboxTimers = [];
  const sandbox = {
    window: { matchMedia: () => ({ matches: reducedMotion }) },
    // getComputedStyle is only consulted as a fallback when icon.style.rotate
    // is unset -- the fake element never has it set independently, so an
    // empty rotate here is enough to exercise the real fallback branch.
    getComputedStyle: () => ({ rotate: '0deg' }),
    setTimeout: useRealTimers ? setTimeout : (fn, ms) => { sandboxTimers.push({ fn, ms }); return sandboxTimers.length; },
    clearTimeout,
    console,
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(identitySrc, context, { filename: 'cadence-identity.js' });
  return { CadenceIdentity: sandbox.window.CadenceIdentity, timers: sandboxTimers };
}

(function activateRotatesInPlace() {
  const { CadenceIdentity, timers } = loadCadenceIdentity(false, false);
  check('ACTIVATE MECHANISM', 'window.CadenceIdentity.activate is exposed', typeof CadenceIdentity?.activate === 'function');
  check('ACTIVATE MECHANISM', 'window.CadenceIdentity.restoreResting is exposed', typeof CadenceIdentity?.restoreResting === 'function');

  const mark = makeMarkEl();
  const icon = mark.querySelector('.cadence-id-icon');
  const ret = CadenceIdentity.activate(mark);
  check('ACTIVATE MECHANISM', 'activate() returns a real thenable (a Promise)', !!ret && typeof ret.then === 'function');
  check('ACTIVATE MECHANISM', 'The SAME icon element is rotated in place -- no element is ever swapped or replaced', mark.querySelector('.cadence-id-icon') === icon);
  check('ACTIVATE MECHANISM', 'The icon is rotated a full 360deg via the CSS `rotate` property (relies on cadence-identity.css\'s own 2600ms rotate transition to animate it)', icon.style.rotate === '360deg', `got ${icon.style.rotate}`);
  check('ACTIVATE MECHANISM', 'Exactly 3 timers are scheduled per activation: add is-blooming, remove is-blooming, resolve -- the turn itself plays via the CSS transition, not a JS-driven timer', timers.length === 3, `got ${timers.length}`);
  check('ACTIVATE MECHANISM', 'is-blooming is scheduled to be added at ORBITAL_BLOOM_DELAY_MS (1330ms, just past halfway through the turn)', timers.some((t) => t.ms === 1330));
  check('ACTIVATE MECHANISM', 'is-blooming is scheduled to be removed at ORBITAL_TURN_MS (2600ms, as the turn completes)', timers.some((t) => t.ms === 2600));
  check('ACTIVATE MECHANISM', 'The resolve timer fires at ORBITAL_TURN_MS + ORBITAL_SETTLE_MS (2950ms) -- a brief quiet beat after the turn/glow finish', timers.some((t) => t.ms === 2950));

  // Actually run the scheduled bloom callbacks (fake timers just queue
  // them) to prove the class toggle really happens, not merely that a
  // timer with the right ms value was requested.
  timers.find((t) => t.ms === 1330).fn();
  check('ACTIVATE MECHANISM', "is-blooming is actually added when its scheduled callback runs", mark.classList.contains('is-blooming'));
  timers.find((t) => t.ms === 2600).fn();
  check('ACTIVATE MECHANISM', 'is-blooming is actually removed when its scheduled callback runs', !mark.classList.contains('is-blooming'));

  // A second activation (as happens on a repeat checkpoint entry) must
  // ACCUMULATE rotation rather than reset to 360deg again -- setting the
  // same value twice is a CSS no-op and would silently kill the replay.
  CadenceIdentity.activate(mark);
  check('ACTIVATE MECHANISM', 'A second activation accumulates to 720deg (not reset to 360deg) -- this is what guarantees the rotate transition fires again on repeat entries', icon.style.rotate === '720deg', `got ${icon.style.rotate}`);

  CadenceIdentity.restoreResting(mark);
  check('ACTIVATE MECHANISM', 'restoreResting() never touches markup (nothing was ever swapped) -- rotation is left accumulated, only is-blooming is defensively cleared', mark.querySelector('.cadence-id-icon') === icon && !mark.classList.contains('is-blooming'));
})();

await (async function activateActuallyDeferred() {
  // Real timers, real elapsed wall-clock time -- proves the resolution is
  // genuinely asynchronous and delayed, not a disguised synchronous
  // resolve. Reduced-motion path (short, deterministic ~350ms pause) for
  // test speed -- the full-motion path's own real duration (2950ms) is
  // already verified structurally above via the captured timer values.
  const { CadenceIdentity } = loadCadenceIdentity(true, true);
  const mark = makeMarkEl();
  const icon = mark.querySelector('.cadence-id-icon');
  const start = Date.now();
  let resolvedAt = null;
  const p = CadenceIdentity.activate(mark).then(() => { resolvedAt = Date.now(); });
  const stillPendingAfter50ms = await new Promise((resolve) => {
    setTimeout(() => resolve(resolvedAt === null), 50);
  });
  check('ACTIVATE TIMING', 'activate() has NOT resolved 50ms after being called (reduced-motion path) -- proves real deferral, not an instant/synchronous resolve', stillPendingAfter50ms);
  await p;
  const elapsed = resolvedAt - start;
  check('ACTIVATE TIMING', 'activate() eventually resolves after a real, deliberate pause (300-700ms window) rather than never or near-instantly', elapsed >= 300 && elapsed <= 700, `elapsed=${elapsed}ms`);
  check('ACTIVATE TIMING', 'Reduced motion never touches the icon at all -- no rotation, no is-blooming, resting mark stays exactly as it was', icon.style.rotate === undefined && !mark.classList.contains('is-blooming'));
})();

// ─────────────────────────────────────────────────────────────────────────
// 4. cadence-shell.js: openCheckpoint() is only ever called for the real
//    entry path (wireCheckpoint's open()) INSIDE the .then() chained off
//    CadenceIdentity.activate(mark) -- source-position check, not just
//    "does .cc-entering exist somewhere".
// ─────────────────────────────────────────────────────────────────────────
(function sequencingOrder() {
  const wireMatch = shellSrc.match(/function wireCheckpoint\([\s\S]*?\n  \}\n/);
  check('SEQUENCING ORDER', 'wireCheckpoint() is present and isolated for this check', !!wireMatch);
  if (!wireMatch) return;
  const body = wireMatch[0];

  check('SEQUENCING ORDER', 'open() re-entry is guarded (a second click/focus during the transition is a no-op)', /let transitioning = false;/.test(body) && /if \(transitioning\) return;/.test(body));

  const activateIdx = body.indexOf('window.CadenceIdentity.activate(mark)');
  const thenIdx = body.indexOf('.then(function ()', activateIdx);
  const restoreIdx = body.indexOf('restoreResting', thenIdx);
  const openInThenIdx = body.indexOf("openCheckpoint({ moduleId, cpId, question: def.question, system: def.system, reviewSystem: def.reviewSystem, label, errorMessage: def.errorMessage, returnFocusEl: container });", thenIdx);
  check('SEQUENCING ORDER', 'CadenceIdentity.activate(mark) is called', activateIdx !== -1);
  check('SEQUENCING ORDER', 'A .then() continuation immediately follows the activate() call', thenIdx !== -1 && thenIdx > activateIdx && thenIdx - activateIdx < 40, `activateIdx=${activateIdx} thenIdx=${thenIdx}`);
  check('SEQUENCING ORDER', 'openCheckpoint() for the animated entry path appears AFTER (inside) that .then() chain, not before/alongside activate() in the same synchronous scope -- the actual fix for the invisible-animation bug', openInThenIdx !== -1 && openInThenIdx > thenIdx, `thenIdx=${thenIdx} openInThenIdx=${openInThenIdx}`);

  // The card fade ("cc-leaving") must itself sit between activate()
  // resolving and openCheckpoint() firing -- not decorative CSS that's
  // merely present, but actually gating when openCheckpoint() runs.
  const leavingIdx = body.indexOf("classList.add('cc-leaving')");
  check('SEQUENCING ORDER', "The card's leave-fade (cc-leaving) is added inside the activate().then() chain, before openCheckpoint() is reached", leavingIdx !== -1 && leavingIdx > thenIdx && leavingIdx < openInThenIdx);
  check('SEQUENCING ORDER', 'restoreResting() is called after the card starts fading (cc-leaving) and before the shell opens -- the mark-swap-back happens while hidden, never as a visible snap', restoreIdx !== -1 && restoreIdx > leavingIdx && restoreIdx < openInThenIdx);

  check('SEQUENCING ORDER', 'A fallback path still opens immediately if there is no large mark to animate (e.g. unexpected markup) -- entry is never permanently blocked', /if \(!mark \|\| !window\.CadenceIdentity\) \{/.test(body));
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
