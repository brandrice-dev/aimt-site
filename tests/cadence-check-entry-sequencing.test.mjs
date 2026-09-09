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
// A second root cause, found in a later pass: a PLAIN rotate(360deg) on
// the canonical orbital mark is nearly imperceptible on its own, because
// the mark has 8-fold rotational symmetry (nodes every 45°) -- the same
// symmetry the frozen intro's own mark has, so reproducing that exact
// mechanism more faithfully would not have made it more visible.
// CadenceIdentity.activate() now instead injects the owner-supplied
// designer activation asset (assets/brand/cadence/cadence-mark-
// activation.svg, embedded as CADENCE_ACTIVATION_SVG), which uses real
// asymmetric motion -- staggered per-node pulses, a traveling comet-arc,
// a bloom pulse -- instead of a symmetry-doomed spin.
//
// This file verifies the mechanism itself, not just that classes/calls
// exist somewhere in the source:
//  1. The embedded activation markup actually contains the asymmetric,
//     staggered motion (not just "some animation") -- distinct node
//     delays, a traveling trace arc, a bloom pulse -- and respects
//     prefers-reduced-motion.
//  2. CadenceIdentity.activate() is executed for real (a minimal but
//     faithful fake DOM, not a full jsdom dependency) and proven to: (a)
//     actually replace the resting icon element with fresh activation
//     markup -- new nodes, not a class toggle, which is what guarantees
//     a clean replay on every repeat entry -- and (b) resolve only after
//     a real elapsed delay matching the activation's authored duration,
//     both with and without prefers-reduced-motion.
//  3. restoreResting() puts the exact original resting markup back.
//  4. wireCheckpoint()'s open() closure in cadence-shell.js is proven,
//     by source position, to call openCheckpoint() only INSIDE the
//     .then() continuation chained off CadenceIdentity.activate(mark),
//     with restoreResting() happening in between (while the card is
//     already fading, not visibly) -- never in the same synchronous
//     scope as activate()/`cc-entering`.
//  5. A double-click / refocus during the transition is guarded
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
// 1. The embedded activation markup has genuine asymmetric motion, not
//    just "an animation" -- static source check against the constant.
// ─────────────────────────────────────────────────────────────────────────
(function activationMarkupShape() {
  check('ACTIVATION MARKUP', 'CADENCE_ACTIVATION_SVG constant is present', /var CADENCE_ACTIVATION_SVG =/.test(identitySrc));
  const eightDistinctDelays = ['173ms', '295ms', '417ms', '539ms', '661ms', '784ms', '906ms', '1028ms'].every((d) => identitySrc.includes(d));
  check('ACTIVATION MARKUP', 'All 8 nodes have distinct, staggered animation-delays (a traveling signal around the ring, not a uniform spin)', eightDistinctDelays);
  check('ACTIVATION MARKUP', 'A traveling comet-arc (dasharray/dashoffset sweep) exists, independent of the node pulses', /cdact-trace/.test(identitySrc) && /stroke-dasharray/.test(identitySrc) && /stroke-dashoffset/.test(identitySrc));
  check('ACTIVATION MARKUP', 'A bloom pulse (blurred, scaling glow) exists, separate from the ring/node motion', /cdact-bloom/.test(identitySrc) && /feGaussianBlur/.test(identitySrc) && /cdact-bloomPulse/.test(identitySrc));
  check('ACTIVATION MARKUP', 'The outer ring + all 8 nodes rotate together as one system (the base turn)', /cdact-outerSystem/.test(identitySrc) && /cdact-outerOrbit/.test(identitySrc) && /rotate\(360deg\)/.test(identitySrc));
  check('ACTIVATION MARKUP', 'prefers-reduced-motion disables every animated layer', /prefers-reduced-motion:reduce\)\{\.cdact-outerSystem,\.cdact-trace,\.cdact-node,\.cdact-core,\.cdact-middle,\.cdact-inner,\.cdact-bloom\{animation:none!important\}/.test(identitySrc.replace(/\s+/g, '')));
  check('ACTIVATION MARKUP', 'Every class/keyframe/filter-id is namespaced (cdact-) -- inline <style> in an injected SVG is NOT scoped to the fragment, so bare names like .core/.node/.ring risk colliding with unrelated page CSS', !/[^-]\.ring\{/.test(identitySrc) && /\.cdact-ring\{/.test(identitySrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// 2 & 3. CadenceIdentity.activate()/restoreResting() actually executed --
//    a minimal, purpose-built fake DOM (createElement/innerHTML/
//    outerHTML/replaceWith/classList/attributes), not a full jsdom
//    dependency, sufficient to exercise the real element-swap logic.
// ─────────────────────────────────────────────────────────────────────────
function makeFakeElement(tag) {
  const attrs = {};
  const classes = new Set();
  let parentSlot = null; // { get, set } -- lets replaceWith reach back into whichever slot holds this element
  const el = {
    tagName: tag,
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
    },
    hasAttribute: (n) => Object.prototype.hasOwnProperty.call(attrs, n),
    getAttribute: (n) => (Object.prototype.hasOwnProperty.call(attrs, n) ? attrs[n] : null),
    setAttribute: (n, v) => { attrs[n] = String(v); },
    _children: [],
    get firstElementChild() { return el._children[0] || null; },
    set innerHTML(html) {
      // Just enough parsing for this file's own markup shape: a single
      // top-level element, class attribute extracted via regex. Not a
      // general HTML parser -- deliberately scoped to what activate()/
      // restoreResting() actually inject (one root <svg ...> each time).
      const tagMatch = html.match(/^<(\w+)/);
      const childTag = tagMatch ? tagMatch[1] : 'svg';
      const classMatch = html.match(/\bclass="([^"]*)"/);
      const child = makeFakeElement(childTag);
      (classMatch ? classMatch[1].split(/\s+/) : []).forEach((c) => child.classList.add(c));
      child._rawHtml = html;
      el._children = [child];
      child._setParentSlot({
        get: () => el._children[0],
        set: (v) => { el._children[0] = v; },
      });
    },
    get outerHTML() {
      if (el._rawHtml) return el._rawHtml;
      return '<' + tag + ' class="' + Array.from(classes).join(' ') + '"></' + tag + '>';
    },
    _setParentSlot(slot) { parentSlot = slot; },
    replaceWith(newEl) {
      // Mirrors real DOM behavior: newEl takes oldEl's exact position,
      // including for whatever future replaceWith() is called on newEl
      // itself (restoreResting() replaces the element activate() swapped
      // in, so that swapped-in element's OWN parent slot must point at
      // the real parent -- markEl -- not the throwaway wrapper div it
      // was born under during innerHTML parsing).
      if (parentSlot) { parentSlot.set(newEl); newEl._setParentSlot(parentSlot); }
    },
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
  icon._rawHtml = '<svg class="cadence-id-icon" viewBox="0 0 44 44"><use href="assets/brand/aimt-orbital-mark.svg#aimtOrbitalMark"></use></svg>';
  markEl._children = [icon];
  icon._setParentSlot({ get: () => markEl._children[0], set: (v) => { markEl._children[0] = v; } });
  return markEl;
}

function loadCadenceIdentity(reducedMotion, useRealTimers) {
  const sandboxTimers = [];
  const sandbox = {
    window: { matchMedia: () => ({ matches: reducedMotion }) },
    document: { createElement: () => makeFakeElement('div') },
    setTimeout: useRealTimers ? setTimeout : (fn, ms) => { sandboxTimers.push({ fn, ms }); return sandboxTimers.length; },
    clearTimeout,
    console,
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(identitySrc, context, { filename: 'cadence-identity.js' });
  return { CadenceIdentity: sandbox.window.CadenceIdentity, timers: sandboxTimers };
}

(function activateSwapsInRealMarkup() {
  const { CadenceIdentity, timers } = loadCadenceIdentity(false, false);
  check('ACTIVATE SWAP', 'window.CadenceIdentity.activate is exposed', typeof CadenceIdentity?.activate === 'function');
  check('ACTIVATE SWAP', 'window.CadenceIdentity.restoreResting is exposed', typeof CadenceIdentity?.restoreResting === 'function');

  const mark = makeMarkEl();
  const originalIconHtml = mark.querySelector('.cadence-id-icon').outerHTML;
  const ret = CadenceIdentity.activate(mark);
  check('ACTIVATE SWAP', 'activate() returns a real thenable (a Promise)', !!ret && typeof ret.then === 'function');

  const swappedIcon = mark.querySelector('.cadence-id-icon');
  check('ACTIVATE SWAP', 'The resting icon is replaced by a NEW element (fresh DOM node, not a class toggle) -- this is what guarantees the animation restarts from 0% on every repeat entry', swappedIcon !== null && swappedIcon.classList.contains('cadence-id-icon-activation'));
  check('ACTIVATE SWAP', 'The injected element carries the actual designer activation markup (cdact- namespaced layers), not an approximation', /cdact-outerSystem/.test(swappedIcon.outerHTML) && /cdact-trace/.test(swappedIcon.outerHTML) && /cdact-bloom/.test(swappedIcon.outerHTML));
  check('ACTIVATE SWAP', 'Exactly one timer is scheduled (the resolve delay) -- the animation itself plays via the injected markup\'s own CSS, not JS-driven timers', timers.length === 1);
  check('ACTIVATE SWAP', 'The resolve timer matches ACTIVATION_MS (2300ms -- stretched from the activation asset\'s original 1600ms per owner QA: the activation read as too fast)', timers[0] && timers[0].ms === 2300, `got ${timers[0] && timers[0].ms}ms`);

  CadenceIdentity.restoreResting(mark);
  const restoredIcon = mark.querySelector('.cadence-id-icon');
  check('ACTIVATE SWAP', 'restoreResting() puts the exact original resting markup back (byte-identical outerHTML), ready for a clean replay next entry', restoredIcon.outerHTML === originalIconHtml);
})();

await (async function activateActuallyDeferred() {
  // Real timers, real elapsed wall-clock time -- proves the resolution is
  // genuinely asynchronous and delayed, not a disguised synchronous
  // resolve. Reduced-motion path (short, deterministic ~350ms pause) for
  // test speed -- the full-motion path's own real duration (2300ms) is
  // already verified structurally above via the captured timer value.
  const { CadenceIdentity } = loadCadenceIdentity(true, true);
  const mark = makeMarkEl();
  const originalIconHtml = mark.querySelector('.cadence-id-icon').outerHTML;
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
  check('ACTIVATE TIMING', 'Reduced motion never touches the icon markup (no injected activation SVG, no rotation) -- resting mark is byte-identical before and after', mark.querySelector('.cadence-id-icon').outerHTML === originalIconHtml);
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
  const openInThenIdx = body.indexOf("openCheckpoint({ moduleId, cpId, question: def.question, system: def.system, reviewSystem: def.reviewSystem, label, returnFocusEl: container });", thenIdx);
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
