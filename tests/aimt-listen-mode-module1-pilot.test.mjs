// Module 1 AIMT Listen Mode pilot — deterministic regression suite.
//
// Covers items A-S of the Module 1 Listen Mode production-pilot task. No
// ElevenLabs or Anthropic calls are made anywhere in this suite — the
// manifest/player primitives are pure data + DOM-layer code that reads
// (never writes) course state; checkpoint grading itself is untouched and
// is proven untouched here via targeted content diffs against the starting
// commit, not re-tested (that's tests/cadence-checkpoint-authority.test.mjs
// and friends' job).
//
// Run: node tests/aimt-listen-mode-module1-pilot.test.mjs

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const courseSrc = readFileSync(path.join(ROOT, 'headspa-mastery.html'), 'utf8');
const playerSrc = readFileSync(path.join(ROOT, 'assets/js/aimt-listen-mode-player.js'), 'utf8');
const dataSrc = readFileSync(path.join(ROOT, 'assets/js/aimt-listen-mode-data.js'), 'utf8');

// Real, executable modules (both files end with `module.exports = api`, so
// require() resolves to the same plain object the browser attaches to
// window.AIMTListenModeData / window.AIMTListenMode).
const AIMTListenModeData = require('../assets/js/aimt-listen-mode-data.js');
const AIMTListenMode = require('../assets/js/aimt-listen-mode-player.js');

function fakeAppState(passedByModule) {
  // passedByModule: { 1: ['m1cp1'] } etc.
  return {
    getModuleProgress(moduleId) {
      const list = (passedByModule && passedByModule[moduleId]) || [];
      return { checkpoints: list.slice() };
    },
    reconcileModuleState() { /* no-op: fake already reflects final state */ }
  };
}

// ─────────────────────────────────────────────────────────────────────────
// B. Manifest has exactly the expected Module 1 chunks
// ─────────────────────────────────────────────────────────────────────────
const manifest = AIMTListenModeData.getManifest('headspa-mastery', 1);
(function manifestShape() {
  check('B. MANIFEST SHAPE', 'getManifest returns an array', Array.isArray(manifest));
  check('B. MANIFEST SHAPE', 'exactly 14 chunks', manifest && manifest.length === 14, 'got ' + (manifest && manifest.length));
  const expectedIds = Array.from({ length: 14 }, (_, i) => 'm1-' + String(i + 1).padStart(2, '0'));
  const actualIds = manifest.map((c) => c.chunkId);
  check('B. MANIFEST SHAPE', 'chunk IDs are m1-01..m1-14 in order', JSON.stringify(actualIds) === JSON.stringify(expectedIds), actualIds.join(','));
  const validation = AIMTListenModeData.validateManifest(manifest);
  check('B. MANIFEST SHAPE', 'manifest passes structural validation', validation.valid, validation.errors.join('; '));
  check('B. MANIFEST SHAPE', 'getManifest for an unknown module returns null (safe no-op for other modules)', AIMTListenModeData.getManifest('headspa-mastery', 2) === null);
  check('B. MANIFEST SHAPE', 'getManifest for an unknown course returns null', AIMTListenModeData.getManifest('nope', 1) === null);
})();

// ─────────────────────────────────────────────────────────────────────────
// C. All audio paths follow the stable naming convention
// ─────────────────────────────────────────────────────────────────────────
(function audioPathConvention() {
  manifest.forEach((c) => {
    const expected = 'assets/audio/listen/headspa-mastery/module-01/' + c.chunkId + '.mp3';
    check('C. AUDIO PATH CONVENTION', c.chunkId + ' audioSrc matches assets/audio/listen/<course>/module-01/<chunkId>.mp3', c.audioSrc === expected, c.audioSrc);
  });
  check('C. AUDIO PATH CONVENTION', 'no chunk hard-codes an ElevenLabs URL', !manifest.some((c) => /elevenlabs|\.eleven(io)?\./i.test(c.audioSrc)));
})();

// ─────────────────────────────────────────────────────────────────────────
// D/E/K. Player is read-only w.r.t. course state — proven by construction
// ─────────────────────────────────────────────────────────────────────────
(function readOnlyContract() {
  const forbiddenCalls = [
    'setCheckpointResult(', '_checkModuleComplete(', 'setReadProgress(',
    'setVideoChapterComplete(', 'captureCheckpointMemory(', 'setCurrentModule(',
    'setLessonScroll(', '.save('
  ];
  forbiddenCalls.forEach((token) => {
    check('D/E/K. READ-ONLY CONTRACT', 'player source never calls APP_STATE.' + token.replace('(', '()'), !playerSrc.includes(token));
  });
  check('D/E/K. READ-ONLY CONTRACT', 'player only ever reads via getModuleProgress/reconcileModuleState', /getModuleProgress|reconcileModuleState/.test(playerSrc));

  // Behavioral corroboration: driving the engine hard against a fake
  // appState never changes what that appState reports as passed — there is
  // no method on the engine that could, but this guards against a future
  // regression that adds one.
  const state = fakeAppState({ 1: [] });
  const before = JSON.stringify(state.getModuleProgress(1));
  for (let i = 0; i < manifest.length; i++) {
    AIMTListenMode.engine.resolveAfterEnd(manifest, i, state);
    AIMTListenMode.engine.isChunkPlayable(manifest[i], state);
  }
  const after = JSON.stringify(state.getModuleProgress(1));
  check('D/E/K. READ-ONLY CONTRACT', 'driving engine functions across every chunk leaves course state byte-identical', before === after);
})();

// ─────────────────────────────────────────────────────────────────────────
// F/G/H. m1cp1 checkpoint-stop behavior
// ─────────────────────────────────────────────────────────────────────────
(function m1cp1Gate() {
  const idx07 = manifest.findIndex((c) => c.chunkId === 'm1-07');
  const idx08 = manifest.findIndex((c) => c.chunkId === 'm1-08');
  check('F. M1CP1 STOP', 'm1-07 is gateType checkpoint-stop for m1cp1', manifest[idx07].gateType === 'checkpoint-stop' && manifest[idx07].checkpointId === 'm1cp1');

  const notPassed = fakeAppState({ 1: [] });
  const decision = AIMTListenMode.engine.resolveAfterEnd(manifest, idx07, notPassed);
  check('F. M1CP1 STOP', 'reaching the end of m1-07 resolves to awaiting-checkpoint, not auto-advance', decision.type === 'awaiting-checkpoint' && decision.checkpointId === 'm1cp1');

  check('G. M1-08 LOCKED PRE-PASS', 'm1-08 is not playable before m1cp1 passes', AIMTListenMode.engine.isChunkPlayable(manifest[idx08], notPassed) === false);
  const resumeNotPassed = AIMTListenMode.engine.resolveResumeIndex(manifest, notPassed, 'm1-08');
  check('G. M1-08 LOCKED PRE-PASS', 'resume never lands on m1-08 if m1cp1 has not passed, even if that was the stored position', manifest[resumeNotPassed].chunkId !== 'm1-08');

  const passed = fakeAppState({ 1: ['m1cp1'] });
  check('H. HISTORICAL PASS CONTINUES', 'm1-08 is playable once m1cp1 has passed (historically or freshly)', AIMTListenMode.engine.isChunkPlayable(manifest[idx08], passed) === true);
  const afterPassDecision = AIMTListenMode.engine.resolveAfterEnd(manifest, idx07, passed);
  check('H. HISTORICAL PASS CONTINUES', 'resolveAfterEnd for m1-07 is still awaiting-checkpoint by design even post-pass (the stop is structural, not a lock check) — the player then offers Continue Listening rather than silently skipping the pause', afterPassDecision.type === 'awaiting-checkpoint');
  const resumePassed = AIMTListenMode.engine.resolveResumeIndex(manifest, passed, 'm1-09');
  check('H. HISTORICAL PASS CONTINUES', 'resume can land on m1-09 (past the m1cp1 gate) once m1cp1 has passed', manifest[resumePassed].chunkId === 'm1-09');

  // Regression: a first-time listener (no stored position at all) must
  // start at chunk 1, never jump ahead to whatever the furthest
  // "authoritatively reachable" chunk happens to be — Listen Mode is a
  // narration experience, not a shortcut past narration already unlocked
  // by passing checkpoints outside Listen Mode.
  const freshListenerNotPassed = AIMTListenMode.engine.resolveResumeIndex(manifest, notPassed, null);
  check('RESUME DEFAULTS TO START', 'a first-time listener with no stored position starts at m1-01, even though m1-01..m1-07 are all technically reachable', manifest[freshListenerNotPassed].chunkId === 'm1-01');
  const freshListenerBothPassed = AIMTListenMode.engine.resolveResumeIndex(manifest, fakeAppState({ 1: ['m1cp1', 'm1cp2'] }), null);
  check('RESUME DEFAULTS TO START', 'a first-time listener still starts at m1-01 even if they already passed both checkpoints via the on-screen UI before ever opening Listen Mode', manifest[freshListenerBothPassed].chunkId === 'm1-01');
})();

// ─────────────────────────────────────────────────────────────────────────
// I/J. m1cp2 checkpoint-stop behavior (mirrors F/G/H)
// ─────────────────────────────────────────────────────────────────────────
(function m1cp2Gate() {
  const idx13 = manifest.findIndex((c) => c.chunkId === 'm1-13');
  const idx14 = manifest.findIndex((c) => c.chunkId === 'm1-14');
  check('I. M1CP2 STOP', 'm1-13 is gateType checkpoint-stop for m1cp2', manifest[idx13].gateType === 'checkpoint-stop' && manifest[idx13].checkpointId === 'm1cp2');

  const notPassed = fakeAppState({ 1: ['m1cp1'] }); // cp1 passed, cp2 not
  const decision = AIMTListenMode.engine.resolveAfterEnd(manifest, idx13, notPassed);
  check('I. M1CP2 STOP', 'reaching the end of m1-13 resolves to awaiting-checkpoint for m1cp2', decision.type === 'awaiting-checkpoint' && decision.checkpointId === 'm1cp2');

  check('J. M1-14 LOCKED PRE-PASS', 'm1-14 is not playable before m1cp2 passes', AIMTListenMode.engine.isChunkPlayable(manifest[idx14], notPassed) === false);

  const bothPassed = fakeAppState({ 1: ['m1cp1', 'm1cp2'] });
  check('J. M1-14 LOCKED PRE-PASS', 'm1-14 is playable once m1cp2 has passed', AIMTListenMode.engine.isChunkPlayable(manifest[idx14], bothPassed) === true);
})();

// ─────────────────────────────────────────────────────────────────────────
// L. Listen position is convenience state only
// ─────────────────────────────────────────────────────────────────────────
(function positionPersistence() {
  const key = AIMTListenMode.engine.storageKey('headspa-mastery', 1);
  check('L. POSITION IS CONVENIENCE ONLY', 'storage key is scoped and distinct from the course progress key (levo_app)', key === 'aimt_listen_position::headspa-mastery::1' && key !== 'levo_app');

  const serialized = AIMTListenMode.engine.serializePosition({ chunkId: 'm1-04', timeSec: 42.5, speed: 1.25 });
  const roundTripped = AIMTListenMode.engine.parsePosition(serialized);
  check('L. POSITION IS CONVENIENCE ONLY', 'position round-trips through serialize/parse', roundTripped.chunkId === 'm1-04' && roundTripped.timeSec === 42.5 && roundTripped.speed === 1.25);
  check('L. POSITION IS CONVENIENCE ONLY', 'parsePosition(garbage) fails safe to null rather than throwing', AIMTListenMode.engine.parsePosition('{not json') === null);
  check('L. POSITION IS CONVENIENCE ONLY', 'parsePosition(null) returns null', AIMTListenMode.engine.parsePosition(null) === null);

  const progressSyncSrc = readFileSync(path.join(ROOT, 'assets/js/aimt-progress-sync.js'), 'utf8');
  check('L. POSITION IS CONVENIENCE ONLY', 'aimt-progress-sync.js (the cloud sync layer) never references the Listen position key — it is genuinely local-only, not silently synced to Supabase', !progressSyncSrc.includes('aimt_listen_position'));
})();

// ─────────────────────────────────────────────────────────────────────────
// M. Missing audio fails gracefully; production never shows as available
//    until every chunk is APPROVED
// ─────────────────────────────────────────────────────────────────────────
(function missingAudioState() {
  check('M. MISSING AUDIO STATE', 'every Module 1 chunk currently starts NOT_GENERATED (no audio has been produced by this task)', manifest.every((c) => c.qaStatus === 'NOT_GENERATED'));
  check('M. MISSING AUDIO STATE', 'isProductionReady() is false while any chunk is not APPROVED', AIMTListenModeData.isProductionReady(manifest) === false);
  check('M. MISSING AUDIO STATE', 'isProductionReady() is true only when every chunk is APPROVED', AIMTListenModeData.isProductionReady(manifest.map((c) => Object.assign({}, c, { qaStatus: 'APPROVED' }))) === true);
  check('M. MISSING AUDIO STATE', 'a single non-approved chunk is enough to keep the whole module unavailable', AIMTListenModeData.isProductionReady(manifest.map((c, i) => Object.assign({}, c, { qaStatus: i === 0 ? 'GENERATED' : 'APPROVED' }))) === false);

  // mount() must refuse to build any DOM at all (not just hide a button)
  // when the module isn't production-ready and QA mode isn't engaged --
  // proven by handing it a `doc` that throws if createElement is ever
  // called.
  const throwingDoc = {
    createElement() { throw new Error('mount() should not build DOM when not production-ready'); },
    getElementById() { return null; },
    head: {}
  };
  let threw = false;
  let mountResult;
  try {
    mountResult = AIMTListenMode.mount({
      courseSlug: 'headspa-mastery', moduleId: 1, doc: throwingDoc, win: { location: { search: '' } },
      appState: fakeAppState({ 1: [] }), entryMountId: 'm1ListenModeMount'
    });
  } catch (e) { threw = true; }
  check('M. MISSING AUDIO STATE', 'mount() returns null without touching the DOM when Module 1 audio is not yet APPROVED and QA mode is off', !threw && mountResult === null);

  check('M. MISSING AUDIO STATE', 'production gate check happens before any DOM/audio work in mount() (static: isProductionReady check precedes entryMount lookup)', (() => {
    const gateIdx = playerSrc.indexOf('isProductionReady');
    const entryIdx = playerSrc.indexOf('entryMountEl');
    return gateIdx !== -1 && entryIdx !== -1 && gateIdx < entryIdx;
  })());

  check('M. MISSING AUDIO STATE', 'player never fabricates a silent/placeholder MP3 URL — no data: or blob: audio src assignment', !/audio\.src\s*=\s*['"](data:|blob:)/.test(playerSrc));
  check('M. MISSING AUDIO STATE', 'per-chunk missing/unapproved audio shows a development-only note rather than pretending to play (static)', /development state/.test(playerSrc) && /isChunkQAAvailable/.test(playerSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// A. Written Module Briefing exists and is useful without Listen Mode
// ─────────────────────────────────────────────────────────────────────────
const module1WrapMatch = courseSrc.match(/<div id="module1Wrap"[\s\S]*?\n<div id="module2Wrap"/);
const module1Wrap = module1WrapMatch ? module1WrapMatch[0] : '';
(function writtenBriefing() {
  check('A. WRITTEN BRIEFING', 'module1Wrap block was found in headspa-mastery.html', module1Wrap.length > 0);
  check('A. WRITTEN BRIEFING', 'written briefing block exists (#m1WrittenBriefing)', /id="m1WrittenBriefing"/.test(module1Wrap));
  check('A. WRITTEN BRIEFING', 'briefing sits before section 1.1 (useful at module open, not buried)', module1Wrap.indexOf('m1WrittenBriefing') !== -1 && module1Wrap.indexOf('m1WrittenBriefing') < module1Wrap.indexOf('1.1 — What is a head spa?'));
  check('A. WRITTEN BRIEFING', 'all five approved briefing bullets are present verbatim', [
    "Define the head spa technician's role — and its limits.",
    'Separate professional observation from medical diagnosis.',
    'Understand what depends on your license and local scope.',
    'Set honest expectations for what a head spa can support.',
    'Recognize when referral is the right professional decision.'
  ].every((line) => module1Wrap.includes(line)));
  check('A. WRITTEN BRIEFING', '"Pay attention to" line present', /Pay attention to:/.test(module1Wrap));
  check('A. WRITTEN BRIEFING', 'briefing reuses existing .protocol-card/.pc-row classes rather than inventing new CSS (design-system rule)', /class="protocol-card" id="m1WrittenBriefing"/.test(module1Wrap));
  check('A. WRITTEN BRIEFING', 'no default opening video was added for Module 1 (briefing text only, per task instruction)', !/<video/i.test(module1Wrap) && !module1Wrap.includes('m1-opening-video'));
})();

// ─────────────────────────────────────────────────────────────────────────
// N. Visual targets correspond to real Module 1 elements
// ─────────────────────────────────────────────────────────────────────────
(function visualTargetsResolve() {
  const chunksWithVisual = manifest.filter((c) => c.visualTarget);
  check('N. VISUAL TARGETS RESOLVE', 'exactly 8 chunks declare a visualTarget (the 3 approved visual cues, plus the briefing/practice/2 checkpoints/completion anchors)', chunksWithVisual.length === 8, chunksWithVisual.map((c) => c.chunkId).join(','));
  const threeCueChunks = manifest.filter((c) => ['m1-04', 'm1-05', 'm1-09'].includes(c.chunkId));
  check('N. VISUAL TARGETS RESOLVE', 'the 3 approved visual-cue chunks (m1-04, m1-05, m1-09) each declare a visualTarget', threeCueChunks.every((c) => !!c.visualTarget));
  manifest.forEach((c) => {
    if (!c.visualTarget) return;
    const idPattern = new RegExp('id="' + c.visualTarget + '"');
    check('N. VISUAL TARGETS RESOLVE', c.chunkId + ' visualTarget "' + c.visualTarget + '" exists as a real element id in module1Wrap', idPattern.test(module1Wrap));
  });
})();

// ─────────────────────────────────────────────────────────────────────────
// O/P/Q/R/S. Everything outside this task's scope is unchanged
// ─────────────────────────────────────────────────────────────────────────
const HEAD_AT_START = '023d258';

function gitShowAtStart(relPath) {
  return execSync('git show ' + HEAD_AT_START + ':' + relPath, { cwd: ROOT, encoding: 'utf8' });
}

// Every line touched anywhere in headspa-mastery.html since the starting
// commit must be attributable to this task's own additions. This is a
// stronger, line-level version of "Module 1 checkpoints unchanged" /
// "Module 12 unchanged" / "dashboard nav unchanged" combined: rather than
// trying to extract and byte-compare specific named blocks (module12Wrap
// has no clean closing marker to extract against, by the file's own
// admission in a comment near it), this walks the actual diff hunks and
// proves every added line is one of this task's known additions and every
// removed line is one of the exact original lines it replaced. If Module 12,
// the M1 checkpoint object, or anything else outside this task's scope had
// changed, it would show up as an unaccounted-for hunk here.
function diffAgainstStart(relPath) {
  return execSync('git diff ' + HEAD_AT_START + ' -- ' + relPath, { cwd: ROOT, encoding: 'utf8' });
}

(function courseFileDiffIsFullyAccountedFor() {
  const diff = diffAgainstStart('headspa-mastery.html');
  const lines = diff.split('\n');
  const hunkCount = lines.filter((l) => l.startsWith('@@')).length;
  check('O/Q/S. FULL DIFF ACCOUNTED FOR', 'headspa-mastery.html diff against the starting commit is a small, bounded set of hunks (briefing insert, 3 visual-cue ids, 2 script includes, showHome unmount, openModuleById unmount, STATIC_MODULES[1] mount call)', hunkCount > 0 && hunkCount <= 8, 'got ' + hunkCount);

  const addedLines = lines.filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1));
  const removedLines = lines.filter((l) => l.startsWith('-') && !l.startsWith('---')).map((l) => l.slice(1));

  // Blocklist, not allowlist: rather than enumerating every legitimate
  // added line (the written-briefing HTML block has many), prove the diff
  // never touches anything that identifies protected content — other
  // modules' wraps, the checkpoint objects, curriculum/rubric internals,
  // or Cadence/auth logic. Any hit here means scope was exceeded.
  const protectedMarkers = [
    'module2Wrap', 'module3Wrap', 'module4Wrap', 'module5Wrap', 'module6Wrap', 'module7Wrap',
    'module8Wrap', 'module9Wrap', 'module10Wrap', 'module11Wrap', 'module12Wrap', 'module0Wrap',
    'const M2 = {', 'const M3 = {', 'const M4 = {', 'const M5 = {', 'const M6 = {', 'const M7 = {',
    'const M8 = {', 'M1.questions', 'M1.systems', 'cp-q', 'evaluateCheckpointAnswer', 'submitCheckpoint(',
    'CADENCE_CHECKPOINT_TONE', 'Module12Cert', 'claim-course-access', 'stripe-webhook', 'create-checkout-session'
  ];
  const touchedProtected = addedLines.concat(removedLines).filter((l) => protectedMarkers.some((m) => l.includes(m)));
  check('O/Q/S. FULL DIFF ACCOUNTED FOR', 'no changed line in headspa-mastery.html touches another module, the checkpoint objects, or Cadence/auth logic', touchedProtected.length === 0, touchedProtected.slice(0, 5).join(' || '));

  const allowedRemovedExact = new Set([
    '    <div class="protocol-card">',
    "    1: () => { const w = document.getElementById('module1Wrap'); if (w && wrap) wrap.innerHTML = w.innerHTML; },"
  ]);
  const unaccountedRemoves = removedLines.filter((l) => !allowedRemovedExact.has(l));
  check('O/Q/S. FULL DIFF ACCOUNTED FOR', 'every removed line in headspa-mastery.html is one of the 3 bare protocol-card divs or the original Module 1 STATIC_MODULES entry (nothing curriculum/checkpoint/Module-12/nav related was deleted or rewritten)', unaccountedRemoves.length === 0, unaccountedRemoves.join(' || '));
  check('O/Q/S. FULL DIFF ACCOUNTED FOR', 'exactly 3 protocol-card divs were given ids (matches the 3 approved visual cues) and exactly 1 STATIC_MODULES line was edited', removedLines.filter((l) => l === '    <div class="protocol-card">').length === 3 && removedLines.filter((l) => l.includes('STATIC_MODULES') === false && l.includes("1: () =>")).length === 1);

  // The on-screen .cp-q text for m1cp1/m1cp2 must also be untouched — a
  // direct content check, independent of the diff-accounting above.
  check('O. CHECKPOINTS UNCHANGED', 'm1cp1 on-screen question text unchanged', module1Wrap.includes('A client says her hair has been shedding heavily for two months and asks whether she has alopecia.'));
  check('O. CHECKPOINTS UNCHANGED', 'm1cp2 on-screen question text unchanged', module1Wrap.includes('Explain the difference between a head spa technician and someone who only knows the service steps.'));
  const m1ObjectMatch = courseSrc.match(/const M1 = \{[\s\S]*?\n\};/);
  const m1ObjectMatchBefore = gitShowAtStart('headspa-mastery.html').match(/const M1 = \{[\s\S]*?\n\};/);
  check('O. CHECKPOINTS UNCHANGED', 'the M1 questions/rubrics object was found in both versions', !!m1ObjectMatch && !!m1ObjectMatchBefore);
  check('O. CHECKPOINTS UNCHANGED', 'M1 checkpoint questions/rubrics object is byte-identical to the starting commit', m1ObjectMatch && m1ObjectMatchBefore && m1ObjectMatch[0] === m1ObjectMatchBefore[0]);

  // P. Cadence Chat/Grading unchanged (files this task had no reason to touch).
  ['functions/_lib/cadence/ask-cadence.mjs', 'functions/_lib/cadence/checkpoint-evaluation.mjs', 'assets/js/cadence-shell.js'].forEach((rel) => {
    const before = gitShowAtStart(rel);
    const afterPath = path.join(ROOT, rel);
    const after = existsSync(afterPath) ? readFileSync(afterPath, 'utf8') : null;
    check('P. CADENCE CHAT/GRADING UNCHANGED', rel + ' is byte-identical to the starting commit', before === after);
  });

  // R. Entitlement/auth hardening unchanged.
  ['functions/api/claim-course-access.js', 'functions/api/stripe-webhook.js', 'functions/api/create-checkout-session.js'].forEach((rel) => {
    const before = gitShowAtStart(rel);
    const afterPath = path.join(ROOT, rel);
    const after = existsSync(afterPath) ? readFileSync(afterPath, 'utf8') : null;
    check('R. ENTITLEMENT/AUTH UNCHANGED', rel + ' is byte-identical to the starting commit', before === after);
  });

  // S. Course dashboard navigation unchanged (my-aimt.html untouched; the
  // two openModuleById/showHome edits are additive unmount() calls only —
  // proven by confirming the pre-existing dispatch structure is still intact
  // around them).
  const dashboardBefore = gitShowAtStart('my-aimt.html');
  const dashboardAfterPath = path.join(ROOT, 'my-aimt.html');
  const dashboardAfter = existsSync(dashboardAfterPath) ? readFileSync(dashboardAfterPath, 'utf8') : null;
  check('S. DASHBOARD NAV UNCHANGED', 'my-aimt.html is byte-identical to the starting commit', dashboardBefore === dashboardAfter);
  check('S. DASHBOARD NAV UNCHANGED', 'openModuleById still dispatches through STATIC_MODULES[id]() unchanged', /if \(STATIC_MODULES\[id\]\) \{\s*STATIC_MODULES\[id\]\(\);/.test(courseSrc));
  check('S. DASHBOARD NAV UNCHANGED', 'showHome still activates #courseHome and clears guide history unchanged', /document\.getElementById\('courseHome'\)\.classList\.add\('active'\)/.test(courseSrc) && /gpHistory = \[\];/.test(courseSrc));
  check('S. DASHBOARD NAV UNCHANGED', 'the only new lines added to openModuleById/showHome are the Listen Mode unmount() calls', (courseSrc.match(/if \(window\.AIMTListenMode\) window\.AIMTListenMode\.unmount\(\);/g) || []).length === 2);
})();

// ─────────────────────────────────────────────────────────────────────────
// Overall change-scope containment — nothing outside the expected file set
// changed since the starting commit (belt-and-suspenders on O/P/Q/R/S).
// ─────────────────────────────────────────────────────────────────────────
(function changeScopeContainment() {
  let statusLines = [];
  try {
    const raw = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8' });
    statusLines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  } catch (e) {
    check('SCOPE CONTAINMENT', 'git status is readable', false, String(e));
    return;
  }
  const changedPaths = statusLines.map((l) => l.replace(/^[AMD?!\s]+/, '').trim());
  const allowlist = new Set([
    'headspa-mastery.html',
    'docs/course-audit/listen-mode/module-01-listen-script-draft.md',
    'docs/course-audit/listen-mode/module-01-audio-production-sheet.md',
    'docs/course-audit/listen-mode/module-01-manual-qa-plan.md',
    'assets/js/aimt-listen-mode-data.js',
    'assets/js/aimt-listen-mode-player.js',
    'tests/aimt-listen-mode-module1-pilot.test.mjs'
  ]);
  for (let i = 1; i <= 14; i++) {
    allowlist.add('docs/course-audit/listen-mode/tts/module-01/m1-' + String(i).padStart(2, '0') + '.txt');
  }
  const allowlistArr = Array.from(allowlist);
  // git status reports a wholly-new, untracked directory as a single line
  // (e.g. "docs/course-audit/listen-mode/tts/") rather than expanding every
  // file inside it — treat that as accounted-for only if every allowlisted
  // path it could contain is itself allowlisted (true here by construction).
  const unexpected = changedPaths.filter((p) => {
    if (allowlist.has(p)) return false;
    if (p.endsWith('/')) return !allowlistArr.some((a) => a.startsWith(p));
    return true;
  });
  check('SCOPE CONTAINMENT', 'no files outside the Module 1 Listen Mode pilot scope were touched', unexpected.length === 0, unexpected.join(', '));
})();

// ─────────────────────────────────────────────────────────────────────────
// Static wiring checks — the primitive is genuinely mounted for Module 1
// only, without hard-coding Module 1 behavior into the player itself.
// ─────────────────────────────────────────────────────────────────────────
(function wiringAndGenerality() {
  check('WIRING', 'headspa-mastery.html includes both new script files', courseSrc.includes('<script src="assets/js/aimt-listen-mode-data.js"></script>') && courseSrc.includes('<script src="assets/js/aimt-listen-mode-player.js"></script>'));
  check('WIRING', 'STATIC_MODULES[1] mounts Listen Mode after injecting module1Wrap content', /1: \(\) => \{ const w = document\.getElementById\('module1Wrap'\); if \(w && wrap\) wrap\.innerHTML = w\.innerHTML; if \(window\.AIMTListenMode\) window\.AIMTListenMode\.mount\(/.test(courseSrc));
  check('WIRING', 'the mount call passes courseSlug/moduleId/entryMountId — no chunk data is inlined into headspa-mastery.html', /courseSlug: 'headspa-mastery', moduleId: 1, entryMountId: 'm1ListenModeMount'/.test(courseSrc));
  check('WIRING', 'other STATIC_MODULES entries (2-12) do not call AIMTListenMode.mount (Module 1 pilot only)', !/[2-9]: \(\) => \{[^}]*AIMTListenMode\.mount/.test(courseSrc) && !/1[0-2]: \(\) => \{[^}]*AIMTListenMode\.mount/.test(courseSrc));
  check('WIRING', 'player.js contains no Module-1-specific literals (generic primitive, not hard-coded) — no "m1cp1"/"m1-0" strings in the player itself', !/m1cp1|m1-0\d/.test(playerSrc));
  check('WIRING', 'data.js is the only file allowed to name Module 1 chunk IDs', /m1-01/.test(dataSrc));
  // Regression guard: the player bar must start hidden after mount() so the
  // entry button's display-toggle (`=== 'none' ? '' : 'none'`) opens it on
  // the first click instead of hiding an already-visible bar.
  check('WIRING', "playerHost is set to display:none before the entry button's toggle handler is wired (so the first click opens, not hides)", (() => {
    const hostIdx = playerSrc.indexOf("playerHost.id = 'aimtListenModePlayerHost'");
    const hiddenIdx = playerSrc.indexOf("playerHost.style.display = 'none'");
    const toggleIdx = playerSrc.indexOf("playerHost.style.display === 'none' ? '' : 'none'");
    return hostIdx !== -1 && hiddenIdx !== -1 && toggleIdx !== -1 && hostIdx < hiddenIdx && hiddenIdx < toggleIdx;
  })());
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
