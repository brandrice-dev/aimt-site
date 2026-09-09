// Cadence Check entry sequencing — regression test.
//
// Root cause this guards against: the large Cadence Check card mark's
// turn+glow (CadenceIdentity.activate()) and the checkpoint shell's own
// open (a synchronous, full-screen, position:fixed takeover) used to run
// in the SAME synchronous click-event tick. Nothing yielded to the
// browser in between, so the very first frame anyone could ever see
// already showed the shell fully open, covering the card -- the mark's
// turn was applied to the DOM and would show up in any synchronous
// inspection (data-cadence-turns, .cc-entering, .is-blooming), but was
// never actually painted on screen. Fixed by making the whole entry a
// real, awaited sequence in cadence-shell.js's wireCheckpoint(): activate
// the mark, wait for CadenceIdentity.activate()'s Promise (which itself
// only resolves once the turn+glow has visibly played and settled) to
// resolve, THEN fade the card, THEN open the shell.
//
// This file verifies the DEFERRAL itself, not just that the relevant
// classes/calls exist somewhere in the source:
//  1. CadenceIdentity.activate() is executed for real (not regex-matched)
//     and proven to resolve asynchronously, after a real elapsed delay --
//     never on the same tick/microtask it was called on -- both with and
//     without prefers-reduced-motion.
//  2. wireCheckpoint()'s open() closure in cadence-shell.js is proven, by
//     source position, to call openCheckpoint() only INSIDE the
//     .then() continuation chained off CadenceIdentity.activate(mark),
//     never in the same synchronous scope as activate()/`cc-entering`.
//  3. A double-click / refocus during the transition is guarded
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
// 1. CadenceIdentity.activate() actually executed -- proves the deferral
//    mechanism itself, not just that it's referenced.
// ─────────────────────────────────────────────────────────────────────────
function makeMarkEl() {
  const icon = {
    attrs: {},
    style: {},
    getAttribute(name) { return this.attrs[name] ?? null; },
    setAttribute(name, val) { this.attrs[name] = String(val); },
  };
  const classes = new Set();
  return {
    icon,
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
    },
    querySelector(sel) { return sel === '.cadence-id-icon' ? icon : null; },
  };
}

function loadCadenceIdentity(reducedMotion) {
  const sandboxTimers = [];
  const sandbox = {
    window: {
      matchMedia: () => ({ matches: reducedMotion }),
    },
    setTimeout: (fn, ms) => { sandboxTimers.push({ fn, ms }); return sandboxTimers.length; },
    console,
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(identitySrc, context, { filename: 'cadence-identity.js' });
  return { CadenceIdentity: sandbox.window.CadenceIdentity, timers: sandboxTimers };
}

(function activatePromiseShape() {
  const { CadenceIdentity, timers } = loadCadenceIdentity(false);
  check('ACTIVATE PROMISE', 'window.CadenceIdentity.activate is exposed', typeof CadenceIdentity?.activate === 'function');
  const mark = makeMarkEl();
  const ret = CadenceIdentity.activate(mark);
  check('ACTIVATE PROMISE', 'activate() returns a real thenable (a Promise), not undefined/void', !!ret && typeof ret.then === 'function');
  check('ACTIVATE PROMISE', 'The turn (rotate) is applied synchronously -- the mark visibly starts turning the instant activate() is called', mark.icon.style.rotate === '360deg' && mark.icon.getAttribute('data-cadence-turns') === '1');
  check('ACTIVATE PROMISE', 'The bloom/settle timers are scheduled via setTimeout, not fired synchronously -- .is-blooming is NOT yet set the instant activate() returns', !mark.classList.contains('is-blooming'));
  check('ACTIVATE PROMISE', 'Exactly 3 timers scheduled (bloom-add, bloom-remove, resolve) matching runOrbitalActivation()\'s own 3-timer structure', timers.length === 3);
  const resolveTimer = timers[timers.length - 1];
  check('ACTIVATE PROMISE', 'The resolve timer is scheduled for TURN_MS + SETTLE_MS (2600 + 350 = 2950ms) -- matching the intro\'s own ORBITAL_TURN_MS/ORBITAL_SETTLE_MS, not an arbitrary shorter delay that would let the caller advance before the glow visibly finishes', resolveTimer.ms === 2950, `got ${resolveTimer.ms}ms`);
})();

await (async function activateActuallyDeferred() {
  // Real timers, real elapsed wall-clock time -- proves the resolution is
  // genuinely asynchronous and delayed, not a disguised synchronous
  // resolve (e.g. Promise.resolve()) that would let a caller's .then()
  // fire on the very next microtask.
  const { CadenceIdentity } = loadCadenceIdentityRealTimers(true); // reduced-motion path: short, deterministic ~350ms pause
  const mark = makeMarkEl();
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
})();

function loadCadenceIdentityRealTimers(reducedMotion) {
  const sandbox = {
    window: { matchMedia: () => ({ matches: reducedMotion }) },
    setTimeout,
    clearTimeout,
    console,
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(identitySrc, context, { filename: 'cadence-identity.js' });
  return { CadenceIdentity: sandbox.window.CadenceIdentity };
}

// ─────────────────────────────────────────────────────────────────────────
// 2. cadence-shell.js: openCheckpoint() is only ever called for the real
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
  const openInThenIdx = body.indexOf("openCheckpoint({ moduleId, cpId, question: def.question, system: def.system, reviewSystem: def.reviewSystem, label, returnFocusEl: container });", thenIdx);
  check('SEQUENCING ORDER', 'CadenceIdentity.activate(mark) is called', activateIdx !== -1);
  check('SEQUENCING ORDER', 'A .then() continuation immediately follows the activate() call', thenIdx !== -1 && thenIdx > activateIdx && thenIdx - activateIdx < 40, `activateIdx=${activateIdx} thenIdx=${thenIdx}`);
  check('SEQUENCING ORDER', 'openCheckpoint() for the animated entry path appears AFTER (inside) that .then() chain, not before/alongside activate() in the same synchronous scope -- the actual fix for the invisible-animation bug', openInThenIdx !== -1 && openInThenIdx > thenIdx, `thenIdx=${thenIdx} openInThenIdx=${openInThenIdx}`);

  // The card fade ("cc-leaving") must itself sit between activate()
  // resolving and openCheckpoint() firing -- not decorative CSS that's
  // merely present, but actually gating when openCheckpoint() runs.
  const leavingIdx = body.indexOf("classList.add('cc-leaving')");
  check('SEQUENCING ORDER', "The card's leave-fade (cc-leaving) is added inside the activate().then() chain, before openCheckpoint() is reached", leavingIdx !== -1 && leavingIdx > thenIdx && leavingIdx < openInThenIdx);

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
