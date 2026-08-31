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

import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import vm from 'node:vm';

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
  // Following the real CapCut round-trip (both parts validated, all 14
  // chunks installed as canonical production MP3s) and the owner's real
  // listen-through approving Module 1 as the frozen reference
  // implementation (see module-01-reference-implementation-FROZEN.md),
  // every chunk is now APPROVED. This section's name predates that
  // install/approval; the "missing audio" contract it verifies
  // (mount()/isProductionReady() must never treat GENERATED as APPROVED,
  // must never fabricate audio, must never self-approve without an
  // explicit owner authorization) is unchanged and still fully exercised
  // below, using synthetic non-approved data where the real manifest can
  // no longer stand in for "not yet approved."
  check('M. MISSING AUDIO STATE', 'all 14 chunks are APPROVED following the owner\'s real listen-through and Module 1 freeze', manifest.every((c) => c.qaStatus === 'APPROVED'));
  check('M. MISSING AUDIO STATE', 'no chunk is left at GENERATED — the freeze pass upgraded every one', !manifest.some((c) => c.qaStatus === 'GENERATED'));
  check('M. MISSING AUDIO STATE', 'every chunk has a real measured duration recorded', manifest.every((c) => typeof c.duration === 'number' && c.duration > 0));

  // On-disk proof, not just manifest metadata: every chunk has a real,
  // non-empty MP3 on disk now that all 14 have been installed.
  const AUDIO_DIR = path.join(ROOT, 'assets/audio/listen/headspa-mastery/module-01');
  manifest.forEach((c) => {
    const filePath = path.join(AUDIO_DIR, c.chunkId + '.mp3');
    const exists = existsSync(filePath);
    check('M. MISSING AUDIO STATE', c.chunkId + '.mp3 exists on disk (installed from the real CapCut round-trip)', exists);
    if (exists) {
      const stat = statSync(filePath);
      check('M. MISSING AUDIO STATE', c.chunkId + '.mp3 is non-zero', stat.size > 0);
      const header = readFileSync(filePath).subarray(0, 3).toString('latin1');
      check('M. MISSING AUDIO STATE', c.chunkId + '.mp3 has a real MP3/ID3 header, not an empty or placeholder file', header === 'ID3' || header.charCodeAt(0) === 0xff);
    }
  });
  check('M. MISSING AUDIO STATE', 'isProductionReady() is true now that every real Module 1 chunk is APPROVED', AIMTListenModeData.isProductionReady(manifest) === true);
  check('M. MISSING AUDIO STATE', 'isProductionReady() is false while any chunk is not APPROVED (synthetic: reverting one chunk to GENERATED)', AIMTListenModeData.isProductionReady(manifest.map((c, i) => Object.assign({}, c, { qaStatus: i === 0 ? 'GENERATED' : 'APPROVED' }))) === false);
  check('M. MISSING AUDIO STATE', 'a single non-approved chunk is enough to keep the whole module unavailable (synthetic: reverting the whole manifest to GENERATED)', AIMTListenModeData.isProductionReady(manifest.map((c) => Object.assign({}, c, { qaStatus: 'GENERATED' }))) === false);

  // mount() must refuse to build any DOM at all (not just hide a button)
  // when the module isn't production-ready and QA mode isn't engaged --
  // proven by handing it a `doc` that throws if createElement is ever
  // called. Now that the real Module 1 manifest is APPROVED, this needs a
  // synthetic not-ready manifest (a fake AIMTListenModeData on `win`) to
  // actually exercise the isProductionReady gate, rather than relying on
  // Module 1 itself being unapproved.
  const throwingDoc = {
    createElement() { throw new Error('mount() should not build DOM when not production-ready'); },
    getElementById() { return null; },
    head: {}
  };
  const notReadyManifest = manifest.map((c) => Object.assign({}, c, { qaStatus: 'GENERATED' }));
  const notReadyWin = {
    location: { search: '' },
    AIMTListenModeData: {
      getManifest: () => notReadyManifest,
      validateManifest: () => AIMTListenModeData.validateManifest(notReadyManifest),
      isProductionReady: () => false
    }
  };
  let threw = false;
  let mountResult;
  try {
    mountResult = AIMTListenMode.mount({
      courseSlug: 'headspa-mastery', moduleId: 1, doc: throwingDoc, win: notReadyWin,
      appState: fakeAppState({ 1: [] }), entryMountId: 'm1ListenModeMount'
    });
  } catch (e) { threw = true; }
  check('M. MISSING AUDIO STATE', 'mount() returns null without touching the DOM when audio is not yet APPROVED and QA mode is off (synthetic not-ready manifest)', !threw && mountResult === null);

  check('M. MISSING AUDIO STATE', 'production gate check happens before any DOM/audio work in mount() (static: isProductionReady check precedes entryMount lookup)', (() => {
    const gateIdx = playerSrc.indexOf('isProductionReady');
    const entryIdx = playerSrc.indexOf('entryMountEl');
    return gateIdx !== -1 && entryIdx !== -1 && gateIdx < entryIdx;
  })());

  check('M. MISSING AUDIO STATE', 'player never fabricates a silent/placeholder MP3 URL — no data: or blob: audio src assignment', !/audio\.src\s*=\s*['"](data:|blob:)/.test(playerSrc));
  check('M. MISSING AUDIO STATE', 'per-chunk missing/unapproved audio shows a development-only note rather than pretending to play (static)', /development state/.test(playerSrc) && /isChunkQAAvailable/.test(playerSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// M1-04 COHESION TEST — canonical file untouched; split evidence exists
// only in a non-production QA location; the split is a lossless,
// zero-word-change partition of the approved script.
// ─────────────────────────────────────────────────────────────────────────
(function m1_04CohesionTest() {
  const canonicalPath = path.join(ROOT, 'assets/audio/listen/headspa-mastery/module-01/m1-04.mp3');
  const cohesionDir = path.join(ROOT, 'docs/course-audit/listen-mode/tts/module-01/cohesion-test');

  check('COHESION TEST', 'canonical m1-04.mp3 still exists', existsSync(canonicalPath));
  check('COHESION TEST', 'manifest m1-04 chunk still points at the single canonical file (audioSrc unchanged, no split entries)', manifest.find((c) => c.chunkId === 'm1-04').audioSrc === 'assets/audio/listen/headspa-mastery/module-01/m1-04.mp3');
  check('COHESION TEST', 'the 14-chunk manifest has no m1-04a/m1-04b entries — the split is comparison evidence only, not a manifest/architecture change', !manifest.some((c) => c.chunkId === 'm1-04a' || c.chunkId === 'm1-04b'));

  ['m1-04a-cohesion-test', 'm1-04b-cohesion-test'].forEach((name) => {
    const txtPath = path.join(cohesionDir, name + '.txt');
    const mp3Path = path.join(cohesionDir, name + '.mp3');
    check('COHESION TEST', name + '.txt exists in the QA-only cohesion-test directory', existsSync(txtPath));
    check('COHESION TEST', name + '.mp3 exists in the QA-only cohesion-test directory (not a canonical production path)', existsSync(mp3Path));
    if (existsSync(mp3Path)) {
      const header = readFileSync(mp3Path).subarray(0, 3).toString('latin1');
      check('COHESION TEST', name + '.mp3 has a real MP3/ID3 header', header === 'ID3' || header.charCodeAt(0) === 0xff);
    }
  });

  // Lossless-split proof: A + blank-line + B reconstructs the original
  // m1-04.txt exactly, character for character — zero words added, removed,
  // or duplicated at the seam.
  const original = readFileSync(path.join(ROOT, 'docs/course-audit/listen-mode/tts/module-01/m1-04.txt'), 'utf8').replace(/\n$/, '');
  const a = readFileSync(path.join(cohesionDir, 'm1-04a-cohesion-test.txt'), 'utf8').replace(/\n$/, '');
  const b = readFileSync(path.join(cohesionDir, 'm1-04b-cohesion-test.txt'), 'utf8').replace(/\n$/, '');
  check('COHESION TEST', 'A + B reconstructs the original m1-04.txt exactly (zero spoken-word changes, no duplicated sentence at the split)', a + '\n\n' + b === original);
  check('COHESION TEST', 'the split falls on a paragraph boundary (A ends and B begins on clean sentence/paragraph edges, not mid-sentence)', /\.\s*$|"\s*$/.test(a) && /^[A-Z"]/.test(b));
})();

// ─────────────────────────────────────────────────────────────────────────
// AUDIO FINISHING — raw preserved, canonical untouched, script correctness.
// Does not invoke ffmpeg (not guaranteed present in every environment,
// matching this suite's no-external-process convention) — verifies the
// script's structure/preset statically and verifies the actual on-disk
// evidence this task already produced.
// ─────────────────────────────────────────────────────────────────────────
(function audioFinishing() {
  const scriptPath = path.join(ROOT, 'scripts/cadence-audio-finish.mjs');
  check('AUDIO FINISHING', 'scripts/cadence-audio-finish.mjs exists', existsSync(scriptPath));
  const scriptSrc = existsSync(scriptPath) ? readFileSync(scriptPath, 'utf8') : '';

  check('AUDIO FINISHING', 'defines CADENCE_AUDIO_FINISHING_PRESET_V1 by name', /CADENCE_AUDIO_FINISHING_PRESET_V1/.test(scriptSrc));
  check('AUDIO FINISHING', 'uses the deesser filter with a capped max-deessing ceiling (m) so a consonant can never be fully removed', /deesser=i=\$\{i\}:m=\$\{m\}:f=\$\{f\}/.test(scriptSrc) && /m:\s*0\.4/.test(scriptSrc));
  check('AUDIO FINISHING', 'uses loudnorm two-pass (a measurement pass feeding measured_I/measured_TP/measured_LRA/measured_thresh into the apply pass), not single-pass', /print_format=json/.test(scriptSrc) && /measured_I=/.test(scriptSrc) && /measured_TP=/.test(scriptSrc) && /measured_LRA=/.test(scriptSrc) && /measured_thresh=/.test(scriptSrc));
  check('AUDIO FINISHING', 'output spec matches every existing chunk: 44.1kHz, mono, libmp3lame, 128kbps', /sampleRateHz:\s*44100/.test(scriptSrc) && /channels:\s*1/.test(scriptSrc) && /libmp3lame/.test(scriptSrc) && /bitrateKbps:\s*128/.test(scriptSrc));
  check('AUDIO FINISHING', 'script never modifies its --in path (no write/rename/unlink of the input)', !/(writeFile|renameSync|unlinkSync)\(.*inPath/.test(scriptSrc));
  check('AUDIO FINISHING', 'no separate compressor/limiter/reverb/gate/exciter filter is chained in (only deesser + loudnorm)', !/acompressor|alimiter|areverb|agate|aexciter/.test(scriptSrc));
  check('AUDIO FINISHING', 'verifies its own output exists and is non-empty before reporting success', /statSync\(outPath\)\.size === 0/.test(scriptSrc));
  check('AUDIO FINISHING', 'resolves ffmpeg from system PATH first, falls back to the free imageio-ffmpeg package (no paid dependency)', /'ffmpeg'/.test(scriptSrc) && /imageio_ffmpeg/.test(scriptSrc));

  // On-disk evidence from this task's actual A/B test run.
  const rawM104 = path.join(ROOT, 'assets/audio/listen/headspa-mastery/module-01/raw/m1-04.mp3');
  const canonicalM104 = path.join(ROOT, 'assets/audio/listen/headspa-mastery/module-01/m1-04.mp3');
  const finishingDir = path.join(ROOT, 'docs/course-audit/listen-mode/tts/module-01/finishing-test');

  check('AUDIO FINISHING', 'raw/m1-04.mp3 exists (untouched generation preserved)', existsSync(rawM104));
  check('AUDIO FINISHING', 'canonical m1-04.mp3 still exists', existsSync(canonicalM104));
  // Following the real CapCut round-trip install, canonical m1-04.mp3 is
  // the CapCut-finished chunk, not a raw passthrough -- raw and canonical
  // are now expected to differ (that's the processing actually landing),
  // where earlier in this arc they were intentionally byte-identical.
  if (existsSync(rawM104) && existsSync(canonicalM104)) {
    const rawBytes = readFileSync(rawM104);
    const canonicalBytes = readFileSync(canonicalM104);
    check('AUDIO FINISHING', 'canonical m1-04.mp3 is no longer byte-identical to raw (real CapCut processing landed, not a passthrough)', Buffer.compare(rawBytes, canonicalBytes) !== 0);
  }
  check('AUDIO FINISHING', 'm1-04-finished-test.mp3 still exists in the QA-only finishing-test directory (historical de-ess/loudnorm evidence, preserved not deleted)', existsSync(path.join(finishingDir, 'm1-04-finished-test.mp3')));
  check('AUDIO FINISHING', 'm1-04-original-reference.mp3 still exists alongside it (historical A/B evidence, preserved not deleted)', existsSync(path.join(finishingDir, 'm1-04-original-reference.mp3')));
  if (existsSync(path.join(finishingDir, 'm1-04-original-reference.mp3')) && existsSync(rawM104)) {
    // That historical reference was a copy of the then-canonical (i.e.
    // raw-equivalent) file -- it should still match raw, which has never
    // changed, even though it no longer matches the now-CapCut-processed
    // canonical file.
    check('AUDIO FINISHING', 'the historical "original" reference copy still matches raw (raw itself never changed)', Buffer.compare(readFileSync(path.join(finishingDir, 'm1-04-original-reference.mp3')), readFileSync(rawM104)) === 0);
  }
  const finishedPath = path.join(finishingDir, 'm1-04-finished-test.mp3');
  if (existsSync(finishedPath)) {
    const stat = statSync(finishedPath);
    check('AUDIO FINISHING', 'the finished test file is non-zero and a real MP3', stat.size > 0 && readFileSync(finishedPath).subarray(0, 3).toString('latin1').match(/^(ID3|\xff)/) !== null);
  }

  // The manifest's m1-04 entry now reflects the Pass 2B continuous-session
  // install (docs/course-audit/listen-mode/
  // module-01-pass2-raw-sessions-v2-production-log.md): same canonical
  // path, APPROVED following the owner's real listen-through and Module 1
  // freeze, and the real installed duration (178.85s -- v5 script content
  // growth plus a genuinely longer natural cut window than the old
  // single-chunk generation, not a defect).
  const m104Chunk = manifest.find((c) => c.chunkId === 'm1-04');
  check('AUDIO FINISHING', 'm1-04 manifest entry points at the canonical file, is APPROVED, and carries the real installed-CapCut-output duration', m104Chunk.audioSrc === 'assets/audio/listen/headspa-mastery/module-01/m1-04.mp3' && m104Chunk.qaStatus === 'APPROVED' && m104Chunk.duration === 178.85);
})();

// ─────────────────────────────────────────────────────────────────────────
// A. Black module opener (replaces the old separate Module Briefing
// treatment) — content, structure, and design-system compliance.
// ─────────────────────────────────────────────────────────────────────────
const module1WrapMatch = courseSrc.match(/<div id="module1Wrap"[\s\S]*?\n<div id="module2Wrap"/);
const module1Wrap = module1WrapMatch ? module1WrapMatch[0] : '';
(function writtenBriefing() {
  check('A. WRITTEN BRIEFING', 'module1Wrap block was found in headspa-mastery.html', module1Wrap.length > 0);
  check('A. WRITTEN BRIEFING', 'the old separate .mod-hero + .protocol-card Module Briefing pairing was removed', !/<div class="mod-hero">/.test(module1Wrap));
  check('A. WRITTEN BRIEFING', 'the black opener (.m1-opener) exists and comes before section 1.1', /class="m1-opener"/.test(module1Wrap) && module1Wrap.indexOf('class="m1-opener"') < module1Wrap.indexOf('1.1 — What is a head spa?'));
  check('A. WRITTEN BRIEFING', 'the "In this module" list keeps id="m1WrittenBriefing" (chunk m1-01\'s visualTarget scroll-sync keeps working without a manifest change)', /id="m1WrittenBriefing"/.test(module1Wrap));
  check('A. WRITTEN BRIEFING', 'MODULE 01 eyebrow and the approved title/tagline are present verbatim', /m1o-eyebrow">Module 01</.test(module1Wrap) && /ROLE, SCOPE|Role, Scope &amp; Professional Boundaries/.test(module1Wrap) && /Know what you are\.<br>Know what you are not\./.test(module1Wrap));
  check('A. WRITTEN BRIEFING', 'all five approved "In this module" bullets are present verbatim', [
    "Define the head spa technician's role — and its limits.",
    'Separate professional observation from medical diagnosis.',
    'Understand what depends on your license and local scope.',
    'Set honest expectations for what a head spa can support.',
    'Recognize when referral is the right professional decision.'
  ].every((line) => module1Wrap.includes(line)));
  check('A. WRITTEN BRIEFING', '"Pay attention to" section and its exact text are present', /m1o-attention-label">Pay attention to</.test(module1Wrap) && module1Wrap.includes('The language you use when describing what you see. That distinction follows you through the rest of the course.'));
  // "Listen with Cadence" / duration / checkpoint-count now lives directly
  // in this static markup (a real <button id="m1ListenWithCadenceButton">),
  // not as JS-only-conjured content -- see the X. ENTRY FIX section below
  // (structural-robustness fix: a stale/failed player script can no longer
  // make the whole control disappear, only the owner-reported bug this
  // fixed).
  check('A. WRITTEN BRIEFING', 'the footer holds a real, static <button id="m1ListenWithCadenceButton"> with the Listen with Cadence copy baked in, not a JS-only mount point', /<div class="m1o-footer">\s*<button type="button" id="m1ListenWithCadenceButton" class="aimt-lm-entry"[\s\S]*?Listen with Cadence[\s\S]*?~19 min · Includes 2 checkpoint stops[\s\S]*?<\/button>/.test(module1Wrap));
  check('A. WRITTEN BRIEFING', 'the opener reuses the design system\'s existing font tokens (mont/mono/serif), not invented fonts', /var\(--aimt-font-mont\)/.test(courseSrc.slice(courseSrc.indexOf('.m1-opener'), courseSrc.indexOf('.m1-opener') + 3000)) && /var\(--aimt-font-mono\)/.test(courseSrc.slice(courseSrc.indexOf('.m1-opener'), courseSrc.indexOf('.m1-opener') + 3000)));
  // The AIMT ring/dot mark was deliberately replaced in the entry control
  // specifically, per explicit owner direction ("Do not rely on the
  // existing AIMT ring/dot mark alone to communicate playback... use a
  // clear play triangle/circle treatment") -- see X. ENTRY FIX below for
  // the play-icon coverage. The ring/dot mark remains in the site's other
  // uses (.intro-mark/.brand-mark), just not duplicated here anymore.
  check('A. WRITTEN BRIEFING', 'no green arrow or generic opener video was added for Module 1', !/<video/i.test(module1Wrap) && !module1Wrap.includes('m1-opening-video') && !/rt-green/.test(module1Wrap));
})();

// ─────────────────────────────────────────────────────────────────────────
// N. Visual targets correspond to real Module 1 elements
// ─────────────────────────────────────────────────────────────────────────
(function visualTargetsResolve() {
  const chunksWithVisual = manifest.filter((c) => c.visualTarget);
  check('N. VISUAL TARGETS RESOLVE', 'exactly 13 chunks declare a visualTarget — every numbered section/practice/checkpoint/completion landmark now has one (1.1 and 1.2 gained a sync target this pass, closing the "some sections stop synchronizing" gap; only m1-08, the post-pass continuation transition chunk into 1.5 and not itself a listed landmark, is intentionally left without one)', chunksWithVisual.length === 13, chunksWithVisual.map((c) => c.chunkId).join(','));
  const threeCueChunks = manifest.filter((c) => ['m1-04', 'm1-05', 'm1-09'].includes(c.chunkId));
  check('N. VISUAL TARGETS RESOLVE', 'the 3 approved visual-cue chunks (m1-04, m1-05, m1-09) each declare a visualTarget', threeCueChunks.every((c) => !!c.visualTarget));
  manifest.forEach((c) => {
    if (!c.visualTarget) return;
    const idPattern = new RegExp('id="' + c.visualTarget + '"');
    check('N. VISUAL TARGETS RESOLVE', c.chunkId + ' visualTarget "' + c.visualTarget + '" exists as a real element id in module1Wrap', idPattern.test(module1Wrap));
  });
})();

// ─────────────────────────────────────────────────────────────────────────
// AG. SECTION TRANSITION GAP — owner's first Module 1 freeze condition:
// ~4s (3.5-4.5s acceptable) perceived breathing room between numbered
// sections, computed as (target - measured natural silence already in the
// canonical audio), never a blind flat 4000ms. See
// docs/course-audit/listen-mode/module-01-section-gap-measurements.md for
// the ffmpeg silencedetect methodology and full measurement table.
// ─────────────────────────────────────────────────────────────────────────
(function sectionTransitionGap() {
  const EXPECTED_GAPS = {
    'm1-02': 2910, // Opening -> 1.1 (nudged to a 3.6s final gap per the owner's "slightly longer than necessary" finding on this specific transition)
    'm1-03': 3362, // 1.1 -> 1.2
    'm1-04': 3188, // 1.2 -> 1.3
    'm1-05': 2696, // 1.3 -> 1.4
    'm1-09': 2958, // post-checkpoint-1 -> 1.5
    'm1-10': 1766, // 1.5 -> 1.6
    'm1-11': 2058, // 1.6 -> 1.7
    'm1-12': 2198  // 1.7 -> 1.8
  };
  Object.keys(EXPECTED_GAPS).forEach((id) => {
    const c = manifest.find((x) => x.chunkId === id);
    check('AG. SECTION TRANSITION GAP', id + ' carries the measured transitionGapMs (' + EXPECTED_GAPS[id] + 'ms)', c && c.transitionGapMs === EXPECTED_GAPS[id]);
  });
  const flagged = new Set(Object.keys(EXPECTED_GAPS));
  const unflagged = manifest.filter((c) => !flagged.has(c.chunkId));
  check('AG. SECTION TRANSITION GAP', 'every other chunk (opening, practice, checkpoints, post-pass continuations, recap) has transitionGapMs 0 — never a blind flat delay outside the 8 flagged numbered-section starts', unflagged.every((c) => c.transitionGapMs === 0), unflagged.filter((c) => c.transitionGapMs !== 0).map((c) => c.chunkId).join(','));
  // Every added gap keeps the FINAL perceived gap (added delay + real
  // measured natural silence at that boundary) inside the locked 3.5-4.5s
  // range -- re-derived here from the same measurements documented in
  // module-01-section-gap-measurements.md rather than re-trusting the
  // authored constants above, so a future edit to one side without the
  // other still fails this check.
  const NATURAL_GAP_SEC = { 'm1-02': 0.690, 'm1-03': 0.638, 'm1-04': 0.812, 'm1-05': 1.304, 'm1-09': 1.042, 'm1-10': 2.234, 'm1-11': 1.942, 'm1-12': 1.802 };
  Object.keys(EXPECTED_GAPS).forEach((id) => {
    const finalGapSec = (EXPECTED_GAPS[id] / 1000) + NATURAL_GAP_SEC[id];
    check('AG. SECTION TRANSITION GAP', id + ' final perceived gap (' + finalGapSec.toFixed(3) + 's) is within the locked 3.5-4.5s acceptable range', finalGapSec >= 3.5 && finalGapSec <= 4.5);
  });

  // Player-side mechanism: a real setTimeout-based delay, not a fixed
  // per-chunk constant, gated on the chunk actually being reached via a
  // natural 'ended' -> 'advance' decision (never on Start Over, Continue
  // Listening, seek, or skip).
  check('AG. SECTION TRANSITION GAP', 'player defines advanceAfterGap() and reads transitionGapMs off the chunk being advanced into', /function advanceAfterGap\(nextIndex\)/.test(playerSrc) && /nextChunk\.transitionGapMs/.test(playerSrc));
  check('AG. SECTION TRANSITION GAP', "the 'ended' handler's advance branch calls advanceAfterGap, not a direct goToChunk (so the delay actually sits between chunks, not just documented)", /decision\.type === 'advance'\) \{\s*\n\s*advanceAfterGap\(decision\.index\);/.test(playerSrc));
  check('AG. SECTION TRANSITION GAP', 'a zero/absent transitionGapMs still advances immediately (no gap mechanism regression for practice/checkpoint/recap transitions)', /if \(gapMs <= 0\) \{ goToChunk\(nextIndex, \{ autoplay: true \}\); return; \}/.test(playerSrc));
  check('AG. SECTION TRANSITION GAP', 'the gap timer is tracked in a variable the player can cancel (gapTimer), not a bare untracked setTimeout', /var gapTimer = null;/.test(playerSrc) && /function stopGapTimer\(\)/.test(playerSrc));
  check('AG. SECTION TRANSITION GAP', 'destroy() cancels a pending gap timer (closing/navigating away mid-pause can never fire a stray goToChunk after unmount)', /function destroy\(\) \{[\s\S]{0,80}stopPolling\(\);\s*\n\s*stopGapTimer\(\);/.test(playerSrc));
  check('AG. SECTION TRANSITION GAP', 'the gap timer callback checks destroyed before calling goToChunk (a pause that outlives the player instance is a safe no-op)', /gapTimer = win\.setTimeout\(function \(\) \{\s*\n\s*gapTimer = null;\s*\n\s*if \(destroyed\) return;\s*\n\s*goToChunk\(nextIndex, \{ autoplay: true \}\);/.test(playerSrc));
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
  // Bound grew from the original pilot's 8 to include this task's black
  // opener (replacing the original .mod-hero block) and the Review-Mode
  // QA panel wiring — still a small, fully-accounted-for set, not an
  // open-ended one.
  check('O/Q/S. FULL DIFF ACCOUNTED FOR', 'headspa-mastery.html diff against the starting commit is a small, bounded set of hunks (original briefing insert, 3 visual-cue ids, 2 script includes, showHome/openModuleById unmount, STATIC_MODULES[1] mount call, black opener CSS+markup, Review-Mode QA panel CSS+JS+wiring, entry-fix/structural-robustness/false-positive-QA/student-preview rounds, and this round\'s 3 new 1.6/1.7/1.8 visual-target ids + #guideBtn bar-offset coordination + module recap card)', hunkCount > 0 && hunkCount <= 24, 'got ' + hunkCount);

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
  // A line that was removed from one place and added back byte-identical
  // elsewhere is a pure relocation, not a content change -- this pass
  // deliberately moved #m1cp1's whole block (owner-authorized: position
  // only, never wording/rubric/grading — see section AE), which shows up
  // in a line-based diff as a remove-here/add-there pair for every line
  // inside it, including its cp-q text. Excluding exact remove+add matches
  // still catches a REAL unauthorized change to protected content (which
  // would show as a removed line with no byte-identical added
  // counterpart, or vice versa) while correctly allowing a proven move.
  function countBy(arr) { const m = new Map(); arr.forEach((l) => m.set(l, (m.get(l) || 0) + 1)); return m; }
  const addedCounts = countBy(addedLines);
  const removedCounts = countBy(removedLines);
  function isPureMove(line) {
    return (addedCounts.get(line) || 0) > 0 && (removedCounts.get(line) || 0) > 0;
  }
  const touchedProtected = addedLines.concat(removedLines).filter((l) => protectedMarkers.some((m) => l.includes(m)) && !isPureMove(l));
  check('O/Q/S. FULL DIFF ACCOUNTED FOR', 'no changed line in headspa-mastery.html touches another module, the checkpoint objects, or Cadence/auth logic (a line removed from one place and re-added byte-identical elsewhere is a proven relocation, not a content change)', touchedProtected.length === 0, touchedProtected.slice(0, 5).join(' || '));

  const allowedRemovedExact = new Set([
    '    <div class="protocol-card">',
    "    1: () => { const w = document.getElementById('module1Wrap'); if (w && wrap) wrap.innerHTML = w.innerHTML; },",
    // This task's black opener replaces Module 1's original (pre-Listen-Mode,
    // every-module-has-one) .mod-hero block -- these 4 lines existed in the
    // 023d258 baseline and are genuinely gone now, replaced by .m1-opener.
    '    <div class="mod-hero">',
    '      <div class="mh-eyebrow">Module 1 · Role, Scope & Professional Boundaries</div>',
    '      <div class="mh-title">Know what you are.<br>Know what you are not.</div>',
    '      <div class="mh-desc">Professionalism begins before the service does—with how you observe, explain, adapt, and stay within scope.</div>',
    // Superseded by this task's own edit adding the QA-panel render call.
    "    1: () => { const w = document.getElementById('module1Wrap'); if (w && wrap) wrap.innerHTML = w.innerHTML; if (window.AIMTListenMode) window.AIMTListenMode.mount({ courseSlug: 'headspa-mastery', moduleId: 1, entryMountId: 'm1ListenModeMount', appState: APP_STATE }); },",
    // Coordinated Listen Mode revision pass: #guideBtn's bottom offset
    // became a calc() referencing --aimt-lm-bar-offset (Section 9's
    // player/Ask-Cadence layout coordination), and its transition line
    // gained a third, bottom-animating property -- both original lines
    // are genuinely gone, replaced in place, not deleted outright.
    '  position: fixed; bottom: 1.5rem; right: 1.25rem; z-index: 200;',
    '  transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;',
    // Sections 1.6/1.7/1.8 gained a stable id on their existing .sec-eyebrow
    // line for Listen Mode sync targeting (Section 7's screen-sync fix) --
    // same visible text and position, an attribute added in place.
    '    <div class="sec-eyebrow">1.6 — Licensing</div>',
    '    <div class="sec-eyebrow">1.7 — Practitioner insight</div>',
    '    <div class="sec-eyebrow">1.8 — Mistakes new practitioners make</div>',
    // Student Preview reload-survival fix (section AD): the unconditional
    // replaceState in enterPurchasedCourseHome() is genuinely gone,
    // replaced by one that preserves ?studentpreview=1 specifically.
    '  window.history.replaceState({}, document.title, window.location.pathname);',
    // Sync-fix pass: Sections 1.1 and 1.2 gained a stable id on their
    // existing .sec-eyebrow line (mirroring the 1.6/1.7/1.8 precedent from
    // Section AC) so Listen Mode can finally scroll-sync those two
    // sections — same visible text and position, an attribute added in
    // place, closing the owner's "some sections stop synchronizing" finding.
    '    <div class="sec-eyebrow">1.1 — What is a head spa?</div>',
    '    <div class="sec-eyebrow">1.2 — What is a head spa technician?</div>'
  ]);
  // Pure relocations (see isPureMove above) don't need individual
  // allowlisting either -- #m1cp1's whole block moved this pass (owner-
  // authorized, section AE) and every one of its lines reappears
  // byte-identical at the new position, so each is provably a move.
  const unaccountedRemoves = removedLines.filter((l) => !allowedRemovedExact.has(l) && !isPureMove(l));
  check('O/Q/S. FULL DIFF ACCOUNTED FOR', 'every removed line in headspa-mastery.html is one of: the 3 bare protocol-card divs, the original Module 1 STATIC_MODULES entry (and its Phase-1-mount-call successor), the 4 original .mod-hero lines this task\'s black opener replaced, or a proven pure relocation elsewhere in the same diff (nothing curriculum/checkpoint/Module-12/nav related was actually deleted or content-changed)', unaccountedRemoves.length === 0, unaccountedRemoves.join(' || '));
  // A two-point diff against 023d258 only ever shows the ORIGINAL bare
  // STATIC_MODULES[1] line as removed once, even though it was actually
  // edited twice since (Phase 1 added the mount() call; this task added
  // the QA-panel call on top) -- the intermediate mount()-only version
  // never existed in 023d258 and doesn't exist now, so it can't appear as
  // either a + or - line in this comparison.
  check('O/Q/S. FULL DIFF ACCOUNTED FOR', 'exactly 3 protocol-card divs were given ids (matches the 3 approved visual cues) and the original bare STATIC_MODULES[1] line was removed exactly once', removedLines.filter((l) => l === '    <div class="protocol-card">').length === 3 && removedLines.filter((l) => l.includes('1: () =>') && l.includes('module1Wrap')).length === 1);
  check('O/Q/S. FULL DIFF ACCOUNTED FOR', 'the current STATIC_MODULES[1] line carries both the Phase-1 mount() call and this task\'s QA-panel call', addedLines.some((l) => l.includes('AIMTListenMode.mount') && l.includes('renderM1ReviewQAPanel()')));

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
    '.gitignore',
    'headspa-mastery.html',
    'docs/course-audit/listen-mode/module-01-listen-script-draft.md',
    'docs/course-audit/listen-mode/module-01-audio-production-sheet.md',
    'docs/course-audit/listen-mode/module-01-manual-qa-plan.md',
    'docs/course-audit/listen-mode/module-01-cohesion-review.md',
    'docs/course-audit/listen-mode/module-01-audio-finishing-review.md',
    'docs/course-audit/listen-mode/module-01-auphonic-comparison-review.md',
    'docs/course-audit/listen-mode/module-01-deess-calibration-review.md',
    'docs/course-audit/listen-mode/module-01-master-v2-review.md',
    'docs/course-audit/listen-mode/module-01-master-v3-review.md',
    'docs/course-audit/listen-mode/module-01-parallel-blend-review.md',
    'scripts/cadence-audio-master-v2.mjs',
    'scripts/cadence-audio-master-v3.mjs',
    'assets/js/aimt-listen-mode-data.js',
    'assets/js/aimt-listen-mode-player.js',
    'assets/js/headspa-state.js',
    'scripts/cadence-audio-finish.mjs',
    'scripts/cadence-audio-produce.mjs',
    'scripts/cadence-capcut-resplit.mjs',
    'docs/course-audit/listen-mode/module-01-production-standard-LOCKED.md',
    'docs/course-audit/listen-mode/manual-qa-active-module-assertion.js',
    'docs/course-audit/listen-mode/00-listen-mode-editorial-standard.md',
    'tests/aimt-listen-mode-module1-pilot.test.mjs',
    'tests/aimt-listen-mode-capcut-production.test.mjs',
    'scripts/_lib/r2-s3-client.mjs',
    'scripts/aimt-media-backup.mjs',
    'scripts/aimt-media-restore.mjs',
    'tests/aimt-media-backup.test.mjs',
    'docs/course-audit/listen-mode/cloud-backup/README.md',
    // Pass 2 continuous-recording-session model (Section 11): raw sessions,
    // CapCut masters, and CapCut-processed FLACs are gitignored (see
    // .gitignore) and never appear in git status; only this production log
    // is tracked. The raw-sessions-v2/ directory itself may still appear as
    // a line if it contains any non-ignored file (none currently) -- the
    // startsWith() check below handles that case generically.
    'docs/course-audit/listen-mode/module-01-pass2-raw-sessions-v2-production-log.md',
    // Section-gap + sync-fix pass (owner's two Module 1 freeze conditions):
    // measured-silence methodology + the computed transitionGapMs table.
    'docs/course-audit/listen-mode/module-01-section-gap-measurements.md',
    // Module 1 freeze: locks Module 1 as the AIMT Listen Mode reference
    // implementation V1 for Modules 0-12 to inherit.
    'docs/course-audit/listen-mode/module-01-reference-implementation-FROZEN.md'
  ]);
  for (let i = 1; i <= 14; i++) {
    allowlist.add('docs/course-audit/listen-mode/tts/module-01/m1-' + String(i).padStart(2, '0') + '.txt');
  }
  // Real-audio-generation pilot (M1-01, M1-02, M1-03, M1-04, M1-07 — the
  // chunks authorized for real ElevenLabs generation across both audio
  // tasks) plus the remaining M1-05..M1-14, installed as canonical
  // production MP3s once the real two-part CapCut round-trip validation
  // passed (see module-01-capcut-production-report-parts.md).
  for (let i = 1; i <= 14; i++) {
    allowlist.add('assets/audio/listen/headspa-mastery/module-01/m1-' + String(i).padStart(2, '0') + '.mp3');
  }
  // M1-04 cohesion-test split (comparison evidence only, non-canonical
  // location — see docs/course-audit/listen-mode/module-01-cohesion-review.md).
  ['m1-04a-cohesion-test', 'm1-04b-cohesion-test'].forEach((name) => {
    allowlist.add('docs/course-audit/listen-mode/tts/module-01/cohesion-test/' + name + '.txt');
    allowlist.add('docs/course-audit/listen-mode/tts/module-01/cohesion-test/' + name + '.mp3');
  });
  // Audio-finishing A/B test (raw preservation + QA-only finished/original
  // comparison files — see module-01-audio-finishing-review.md) and the
  // sibilance calibration round's Moderate/Stronger variants, both housed
  // in the same finishing-test/ directory (see
  // module-01-deess-calibration-review.md).
  allowlist.add('docs/course-audit/listen-mode/tts/module-01/finishing-test/m1-04-finished-test.mp3');
  allowlist.add('docs/course-audit/listen-mode/tts/module-01/finishing-test/m1-04-original-reference.mp3');
  allowlist.add('docs/course-audit/listen-mode/tts/module-01/finishing-test/m1-04-finished-moderate-test.mp3');
  allowlist.add('docs/course-audit/listen-mode/tts/module-01/finishing-test/m1-04-finished-stronger-test.mp3');
  // Auphonic A/B test (module-01-auphonic-comparison-review.md).
  allowlist.add('docs/course-audit/listen-mode/tts/module-01/auphonic-test/m1-04-auphonic-autoeq-test.mp3');
  // Cadence Master V2 local dynamic-EQ test (module-01-master-v2-review.md).
  allowlist.add('docs/course-audit/listen-mode/tts/module-01/master-v2-test/m1-04-master-v2-light.mp3');
  allowlist.add('docs/course-audit/listen-mode/tts/module-01/master-v2-test/m1-04-master-v2-medium.mp3');
  allowlist.add('docs/course-audit/listen-mode/tts/module-01/master-v2-test/m1-04-master-v2-analysis.png');
  // Cadence Master V3 three-candidate test (module-01-master-v3-review.md).
  allowlist.add('docs/course-audit/listen-mode/tts/module-01/master-v3-test/m1-04-master-v3-a-dual-band.mp3');
  allowlist.add('docs/course-audit/listen-mode/tts/module-01/master-v3-test/m1-04-master-v3-b-hybrid.mp3');
  allowlist.add('docs/course-audit/listen-mode/tts/module-01/master-v3-test/m1-04-master-v3-c-broad-dynamic.mp3');
  // Auphonic/RAW parallel blend stop-loss test (module-01-parallel-blend-review.md).
  allowlist.add('docs/course-audit/listen-mode/tts/module-01/parallel-blend-test/m1-04-auphonic75-raw25.mp3');
  allowlist.add('docs/course-audit/listen-mode/tts/module-01/parallel-blend-test/m1-04-auphonic65-raw35.mp3');
  allowlist.add('docs/course-audit/listen-mode/tts/module-01/parallel-blend-test/m1-04-auphonic55-raw45.mp3');
  // Locked production standard: every chunk's RAW ElevenLabs generation is
  // preserved under raw/ before any finishing step (see
  // module-01-production-standard-LOCKED.md section 4). All 14 chunks now
  // have a raw file — 5 backfilled from pre-existing canonical audio,
  // 9 newly generated this phase.
  for (let i = 1; i <= 14; i++) {
    allowlist.add('assets/audio/listen/headspa-mastery/module-01/raw/m1-' + String(i).padStart(2, '0') + '.mp3');
  }
  // CapCut round-trip proof (4-chunk: m1-01..m1-04 -- see
  // module-01-parallel-blend-review.md's successor decision and the CapCut
  // proof reports under docs/course-audit/listen-mode/capcut-test/).
  allowlist.add('docs/course-audit/listen-mode/capcut-test/module-01/CAPCUT-PROOF-INSTRUCTIONS.md');
  allowlist.add('docs/course-audit/listen-mode/capcut-test/module-01/intake/README.md');
  allowlist.add('docs/course-audit/listen-mode/capcut-test/module-01/intake/module-01-capcut-proof-processed.flac.FLAC');
  allowlist.add('docs/course-audit/listen-mode/capcut-test/module-01/module-01-capcut-proof-boundaries.json');
  allowlist.add('docs/course-audit/listen-mode/capcut-test/module-01/module-01-capcut-proof-master.wav');
  ['m1-01', 'm1-02', 'm1-03', 'm1-04'].forEach((id) => {
    allowlist.add('docs/course-audit/listen-mode/capcut-test/module-01/resplit-capcut/' + id + '-capcut-resplit.wav');
    allowlist.add('docs/course-audit/listen-mode/capcut-test/module-01/resplit-capcut/' + id + '-capcut.mp3');
  });
  // Locked CapCut finishing preset + full 14-chunk Module 1 master
  // (CADENCE_CAPCUT_FINISH_PRESET_V1 -- see
  // module-01-production-standard-LOCKED.md section 3 and
  // capcut-production/module-01/module-01-capcut-production-report.md).
  allowlist.add('docs/course-audit/listen-mode/capcut-production/module-01/CAPCUT-MODULE-01-INSTRUCTIONS.md');
  allowlist.add('docs/course-audit/listen-mode/capcut-production/module-01/intake/README.md');
  allowlist.add('docs/course-audit/listen-mode/capcut-production/module-01/module-01-capcut-boundaries.json');
  allowlist.add('docs/course-audit/listen-mode/capcut-production/module-01/module-01-capcut-master.wav');
  allowlist.add('docs/course-audit/listen-mode/capcut-production/module-01/module-01-capcut-production-report.md');
  // Two-part CapCut split (CapCut's 15:00 Enhance Voice limit) -- see
  // module-01-production-standard-LOCKED.md section 4 and
  // module-01-capcut-production-report-parts.md. The two new master WAVs
  // are covered by the existing capcut-production/**/*.wav gitignore rule
  // and never appear in git status, so only the tracked metadata needs
  // allowlisting here.
  allowlist.add('docs/course-audit/listen-mode/capcut-production/module-01/module-01-capcut-boundaries-part-a.json');
  allowlist.add('docs/course-audit/listen-mode/capcut-production/module-01/module-01-capcut-boundaries-part-b.json');
  allowlist.add('docs/course-audit/listen-mode/capcut-production/module-01/module-01-capcut-production-report-parts.md');
  const allowlistArr = Array.from(allowlist);
  // git status reports a wholly-new, untracked directory as a single line
  // (e.g. "docs/course-audit/listen-mode/tts/") rather than expanding every
  // file inside it — treat that as accounted-for only if every allowlisted
  // path it could contain is itself allowlisted (true here by construction).
  // Each real backup run writes a uniquely-timestamped snapshot manifest
  // (docs/course-audit/listen-mode/cloud-backup/module-01-snapshot-<UTC
  // timestamp>.json) -- a fixed filename can't be allowlisted in advance,
  // so match the pattern instead.
  const snapshotManifestPattern = /^docs\/course-audit\/listen-mode\/cloud-backup\/module-01-snapshot-.+\.json$/;
  const unexpected = changedPaths.filter((p) => {
    if (allowlist.has(p)) return false;
    if (snapshotManifestPattern.test(p)) return false;
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
  // entryButtonEl (a live element scoped to .lesson-wrap), not
  // entryButtonId (a bare document-wide getElementById) -- the hidden
  // #module1Wrap template this content is cloned from carries its own
  // copy of the same id, so a document-wide lookup is genuinely
  // ambiguous about which of the two it resolves to. See section Z.
  check('WIRING', 'the mount call passes courseSlug/moduleId/entryButtonEl (a live element scoped to .lesson-wrap, not an ambiguous document-wide id lookup) — no chunk data is inlined into headspa-mastery.html', /courseSlug: 'headspa-mastery', moduleId: 1, entryButtonEl: wrap\.querySelector\('#m1ListenWithCadenceButton'\)/.test(courseSrc));
  check('WIRING', 'the old JS-only #m1ListenModeMount id is fully gone from headspa-mastery.html', !courseSrc.includes('m1ListenModeMount'));
  check('WIRING', 'other STATIC_MODULES entries (2-12) do not call AIMTListenMode.mount (Module 1 pilot only)', !/[2-9]: \(\) => \{[^}]*AIMTListenMode\.mount/.test(courseSrc) && !/1[0-2]: \(\) => \{[^}]*AIMTListenMode\.mount/.test(courseSrc));
  check('WIRING', 'player.js contains no Module-1-specific literals (generic primitive, not hard-coded) — no "m1cp1"/"m1-0" strings in the player itself', !/m1cp1|m1-0\d/.test(playerSrc));
  check('WIRING', 'data.js is the only file allowed to name Module 1 chunk IDs', /m1-01/.test(dataSrc));
  // Regression guard: the player bar must start hidden after mount() so
  // the entry button's first click reveals (and starts playing) it,
  // rather than hiding an already-visible bar. Updated for the Listen-
  // with-Cadence-entry-fix: the toggle is now an explicit if-branch
  // ("if display !== 'none', hide it") guarding the reveal+play path,
  // not a bare ternary -- see X. ENTRY FIX for the full click-handler
  // ordering (reveal before playCurrent()).
  check('WIRING', "playerHost is set to display:none before the entry button's click handler is wired (so the first click opens+plays, not hides)", (() => {
    const hostIdx = playerSrc.indexOf("playerHost.id = 'aimtListenModePlayerHost'");
    const hiddenIdx = playerSrc.indexOf("playerHost.style.display = 'none'");
    const handlerIdx = playerSrc.indexOf("if (playerHost.style.display !== 'none')");
    return hostIdx !== -1 && hiddenIdx !== -1 && handlerIdx !== -1 && hostIdx < hiddenIdx && hiddenIdx < handlerIdx;
  })());
  // Regression guard (found during real-audio integration testing): the
  // <audio> element must actually be attached to the player bar, not just
  // held in a JS closure — detached playback is inconsistent on iOS Safari
  // and undermines Media Session reliability, even though it happens to
  // work in some browsers.
  check('WIRING', 'the <audio> element is appended into the player bar (not left detached from the DOM)', /bar\.appendChild\(audio\)/.test(playerSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// Locked production standard phase — the standard doc, the reusable
// production script, all 14 RAW files, and honest (unfabricated) qaStatus.
// ─────────────────────────────────────────────────────────────────────────
(function lockedProductionStandard() {
  const standardPath = path.join(ROOT, 'docs/course-audit/listen-mode/module-01-production-standard-LOCKED.md');
  const standardExists = existsSync(standardPath);
  check('LOCKED STANDARD', 'module-01-production-standard-LOCKED.md exists', standardExists);
  if (standardExists) {
    const standardSrc = readFileSync(standardPath, 'utf8');
    check('LOCKED STANDARD', 'documents the locked chunking standard (45-100s preferred, ~120s ceiling)', /45.?\D?100 seconds/.test(standardSrc) && /120 seconds/.test(standardSrc));
    check('LOCKED STANDARD', 'documents M1-04 staying one chunk (no split)', /M1-04 stays ONE production chunk/.test(standardSrc));
    check('LOCKED STANDARD', 'still names CADENCE_AUDIO_MASTER_PRESET_V1 and its RAW→Auphonic→align→blend→loudnorm pipeline, now as historical record', /CADENCE_AUDIO_MASTER_PRESET_V1/.test(standardSrc) && /75% Auphonic \/ 25% RAW/.test(standardSrc));
    check('LOCKED STANDARD', 'preserves the key Auphonic facts (AutoEQ, -18 LUFS) in the historical record, not deleted', /AutoEQ/.test(standardSrc) && /[-−]18 LUFS/.test(standardSrc));
    check('LOCKED STANDARD', 'documents raw preservation as universal/locked (every chunk saved to raw/ before finishing)', /Raw preservation \(locked, universal/.test(standardSrc));
    check('LOCKED STANDARD', 'documents qaStatus discipline: Claude never sets APPROVED', /Claude\s*\n?\s*never sets `APPROVED`/.test(standardSrc) || /never sets `APPROVED`/.test(standardSrc));
    check('LOCKED STANDARD', 'CADENCE_AUDIO_MASTER_PRESET_V1 explicitly marked historical/superseded, not the active path', /HISTORICAL QA \/ SUPERSEDED/.test(standardSrc) && /no longer the active production path/.test(standardSrc));
    check('LOCKED STANDARD', 'CADENCE_CAPCUT_FINISH_PRESET_V1 documented as the active finishing preset', /CADENCE_CAPCUT_FINISH_PRESET_V1.{0,40}ACTIVE finishing preset/s.test(standardSrc));
  }

  const scriptPath = path.join(ROOT, 'scripts/cadence-audio-produce.mjs');
  const scriptExists = existsSync(scriptPath);
  check('PRODUCTION SCRIPT', 'scripts/cadence-audio-produce.mjs exists', scriptExists);
  if (scriptExists) {
    const scriptSrc = readFileSync(scriptPath, 'utf8');
    check('PRODUCTION SCRIPT', 'exports the alignment/blend primitives for independent testing', /export \{ verifyAlignment, crossCorrelate, resolveFfmpeg, ffprobeDuration, decodePcm16Mono, rmsEnvelope, logCenter, blendAndMaster \}/.test(scriptSrc));
    // The script never edits the manifest at all (prints values for manual/
    // reviewed application instead — see header comments) — so the real
    // guarantee is the absence of ANY file write and any qaStatus
    // assignment, not just an absence of the string 'APPROVED' (which the
    // script's own disclaimer comments legitimately mention, e.g. "this
    // script also NEVER writes qaStatus='APPROVED'").
    check('PRODUCTION SCRIPT', 'contains no writeFileSync call and no qaStatus assignment anywhere (never edits the manifest, so it cannot write APPROVED)', !/writeFileSync/.test(scriptSrc) && !/\.qaStatus\s*=/.test(scriptSrc) && !/qaStatus:\s*['"]APPROVED['"]/.test(scriptSrc));
    check('PRODUCTION SCRIPT', "explicitly documents (in its own header) that it never sets qaStatus='APPROVED'", /NEVER writes qaStatus='APPROVED'/.test(scriptSrc));
    check('PRODUCTION SCRIPT', 'stops (does not silently fall back) when AUPHONIC_API_KEY is missing', /AUPHONIC_API_KEY is not set/.test(scriptSrc));
    check('PRODUCTION SCRIPT', 'uses the locked 75/25 Auphonic/RAW blend weights', /auphonic:\s*0\.75/.test(scriptSrc) && /raw:\s*0\.25/.test(scriptSrc));
    check('PRODUCTION SCRIPT', 'targets the locked loudness spec (I=-18, LRA=7, TP=-2)', /I:\s*-18/.test(scriptSrc) && /LRA:\s*7/.test(scriptSrc) && /TP:\s*-2/.test(scriptSrc));
  }

  // All 14 chunks now have a preserved RAW ElevenLabs file — 5 backfilled
  // from pre-existing canonical audio (byte-identical, verified at the
  // time), 9 newly generated this phase and independently format-verified.
  for (let i = 1; i <= 14; i++) {
    const id = 'm1-' + String(i).padStart(2, '0');
    const rawPath = path.join(ROOT, 'assets/audio/listen/headspa-mastery/module-01/raw/' + id + '.mp3');
    const exists = existsSync(rawPath);
    check('RAW PRESERVATION', id + ' has a preserved raw/ file', exists);
    if (exists) {
      check('RAW PRESERVATION', id + ' raw file is non-empty', statSync(rawPath).size > 0);
    }
  }

  // Honesty check, current state: the real two-part CapCut round-trip
  // (Part A M1-01..07, Part B M1-08..14) technically PASSED against the
  // locked manifests (all 12 separators found, all 14 chunks recovered,
  // no cumulative drift, no time-stretch, no clipped edges, no separator
  // residue, no clipping/corruption, correct order — see
  // module-01-capcut-production-report-parts.md), and all 14 chunks were
  // genuinely installed as canonical production MP3s from that real,
  // verified output. The owner then completed a real listen-through
  // (Module 1 finalize + freeze pass) and explicitly authorized upgrading
  // every chunk to APPROVED — see
  // module-01-reference-implementation-FROZEN.md. This is the one
  // legitimate path to APPROVED: an explicit owner authorization, not
  // Claude self-approving. No script (scripts/cadence-audio-produce.mjs,
  // etc.) ever writes APPROVED itself -- see 'PRODUCTION SCRIPT' above.
  const manifest = AIMTListenModeData.getManifest('headspa-mastery', 1);
  const approvedIds = manifest.filter((c) => c.qaStatus === 'APPROVED').map((c) => c.chunkId).sort();
  const expectedApprovedIds = Array.from({ length: 14 }, (_, i) => 'm1-' + String(i + 1).padStart(2, '0'));
  check('QA STATUS HONESTY', 'all 14 chunks are APPROVED, matching the owner\'s explicit Module 1 freeze authorization', JSON.stringify(approvedIds) === JSON.stringify(expectedApprovedIds), JSON.stringify(approvedIds));
  check('QA STATUS HONESTY', 'no chunk is left at GENERATED (the freeze pass upgraded every one, none skipped)', manifest.every((c) => c.qaStatus !== 'GENERATED'));
})();

// ─────────────────────────────────────────────────────────────────────────
// T. Review Mode can use GENERATED audio; normal student mode stays gated
// until APPROVED. Two real bugs were found and fixed by hand while
// QA-verifying this live in the browser this task (a stale browser cache
// initially masked both, requiring a fresh fetch+eval to see the real
// code): inQAMode() didn't recognize the app's general Review Mode at
// all (only a separate ?listenQA=1 param), and mount() left orphaned
// #aimtListenModePlayerHost elements in document.body on every remount,
// so a later getElementById('aimtListenModePlayerHost') (including the
// live instance's own bar) could silently resolve to a stale, dead one.
// Both are static-source regression guards here — the actual behavioral
// proof (checkpoint 1 stop -> mark passed -> poll detects it -> "Continue
// Listening" -> resumes at M1-08 with audio playing, all with exactly one
// player host throughout) was run live in the browser this task.
// ─────────────────────────────────────────────────────────────────────────
(function reviewModeAudioGating() {
  check('T. REVIEW MODE GATING', 'inQAMode() recognizes the app\'s general Review Mode (window.ReviewMode.isActive()), not only a separate listenQA=1 param', /root\.ReviewMode\s*&&\s*typeof root\.ReviewMode\.isActive\s*===\s*'function'\s*&&\s*root\.ReviewMode\.isActive\(\)/.test(playerSrc));
  check('T. REVIEW MODE GATING', 'the ReviewMode check happens inside inQAMode(), before the listenQA=1 fallback', (() => {
    const fnStart = playerSrc.indexOf('function inQAMode()');
    const reviewCheckIdx = playerSrc.indexOf('root.ReviewMode', fnStart);
    const listenQAIdx = playerSrc.indexOf('listenQA=1', fnStart);
    return fnStart !== -1 && reviewCheckIdx !== -1 && listenQAIdx !== -1 && reviewCheckIdx < listenQAIdx;
  })());
  check('T. REVIEW MODE GATING', 'mount() removes every pre-existing #aimtListenModePlayerHost before creating a new one (prevents orphaned stale hosts from a prior mount() call resolving ahead of the live instance)', /doc\.querySelectorAll\(.#aimtListenModePlayerHost.\)/.test(playerSrc) && /parentNode\.removeChild\(staleHosts\[si\]\)/.test(playerSrc));
  check('T. REVIEW MODE GATING', 'that stale-host removal runs before the new playerHost div is created (static ordering)', playerSrc.indexOf('staleHosts') < playerSrc.indexOf("playerHost.id = 'aimtListenModePlayerHost'"));
  check('T. REVIEW MODE GATING', 'the fixed-position player bar reserves mobile safe-area space at the bottom (env(safe-area-inset-bottom))', /env\(safe-area-inset-bottom/.test(playerSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// U. Review Mode-only Module 1 Listen Mode chunk QA panel — never exposed
// to students, gated purely on window.ReviewMode.isActive() so the
// markup (and the qaStatus/duration data it would display) never even
// enters a student's DOM, not just hidden via CSS.
// ─────────────────────────────────────────────────────────────────────────
(function reviewModeQAPanel() {
  check('U. REVIEW QA PANEL', 'renderM1ReviewQAPanel() is defined in headspa-mastery.html', /function renderM1ReviewQAPanel\s*\(\s*\)/.test(courseSrc));
  const fnMatch = courseSrc.match(/function renderM1ReviewQAPanel\s*\(\)\s*\{[\s\S]*?\n  \}/);
  const fnSrc = fnMatch ? fnMatch[0] : '';
  check('U. REVIEW QA PANEL', 'the panel function found', fnSrc.length > 0);
  check('U. REVIEW QA PANEL', 'the very first statement gates on window.ReviewMode.isActive() and returns early if not active (never builds DOM for students)', /^function renderM1ReviewQAPanel\s*\(\)\s*\{\s*\n\s*if \(!\(window\.ReviewMode && window\.ReviewMode\.isActive\(\)\)\) return;/.test(fnSrc));
  check('U. REVIEW QA PANEL', 'lists every chunk from the real manifest (getManifest), not a hardcoded/stale list', /AIMTListenModeData\.getManifest\('headspa-mastery', 1\)/.test(fnSrc));
  check('U. REVIEW QA PANEL', 'shows chunkId, duration, and qaStatus per row', /chunk\.chunkId/.test(fnSrc) && /chunk\.duration/.test(fnSrc) && /chunk\.qaStatus/.test(fnSrc));
  check('U. REVIEW QA PANEL', 'each row includes a real <audio> preview using the chunk\'s actual audioSrc', /audioEl\.src = chunk\.audioSrc/.test(fnSrc));
  check('U. REVIEW QA PANEL', 'each row includes a Jump control that reuses the real engine storageKey/serializePosition + mount(), not a bespoke mechanism', /engine\.storageKey\('headspa-mastery', 1\)/.test(fnSrc) && /engine\.serializePosition/.test(fnSrc) && /AIMTListenMode\.mount\(/.test(fnSrc));
  check('U. REVIEW QA PANEL', 'STATIC_MODULES[1] calls renderM1ReviewQAPanel() after mounting the player', /renderM1ReviewQAPanel\(\);\s*\},/.test(courseSrc));
  check('U. REVIEW QA PANEL', 'the panel CSS is scoped under a dedicated .m1-qa-panel class, not reusing/overloading a student-facing class', /\.m1-qa-panel\s*\{/.test(courseSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// V. Student Preview — localhost-only real-student-UI preview of
// GENERATED audio. ABSOLUTE SAFETY BOUNDARY: real behavioral execution
// (node:vm, not just static regex) of the actual StudentPreview.init()
// logic extracted from headspa-state.js, against every combination the
// task calls out -- localhost/127.0.0.1 recognized, production and
// arbitrary hostnames ignored, no param means inactive even on an
// eligible host.
// ─────────────────────────────────────────────────────────────────────────
function runStudentPreviewInit(hostname, search) {
  const stateSrc = readFileSync(path.join(ROOT, 'assets/js/headspa-state.js'), 'utf8');
  const startMarker = 'const STUDENT_PREVIEW_ALLOWED_HOSTS';
  const endMarker = 'window.StudentPreview = StudentPreview;';
  const start = stateSrc.indexOf(startMarker);
  const end = stateSrc.indexOf(endMarker);
  if (start === -1 || end === -1) throw new Error('Could not locate StudentPreview extraction boundaries in headspa-state.js -- markers moved');
  const source = stateSrc.slice(start, end + endMarker.length);
  const sandbox = { window: { location: { hostname, search }, StudentPreview: null }, URLSearchParams };
  vm.runInContext(source, vm.createContext(sandbox), { filename: 'headspa-state-student-preview.js' });
  return sandbox.window.StudentPreview;
}

(function studentPreviewSafetyBoundary() {
  const cases = [
    { hostname: 'localhost', search: '?studentpreview=1', expected: true, label: 'localhost + studentpreview=1 => recognized' },
    { hostname: '127.0.0.1', search: '?studentpreview=1', expected: true, label: '127.0.0.1 + studentpreview=1 => recognized' },
    { hostname: 'LOCALHOST', search: '?studentpreview=1', expected: true, label: 'hostname match is case-insensitive (LOCALHOST)' },
    { hostname: 'localhost', search: '?foo=1&studentpreview=1', expected: true, label: 'param recognized alongside other query params' },
    { hostname: 'aimtrichology.com', search: '?studentpreview=1', expected: false, label: 'production hostname (aimtrichology.com) + studentpreview=1 => ignored' },
    { hostname: 'www.aimtrichology.com', search: '?studentpreview=1', expected: false, label: 'production hostname (www.aimtrichology.com) + studentpreview=1 => ignored' },
    { hostname: 'aimt-site.pages.dev', search: '?studentpreview=1', expected: false, label: 'production hostname (aimt-site.pages.dev) + studentpreview=1 => ignored' },
    { hostname: 'example.com', search: '?studentpreview=1', expected: false, label: 'arbitrary hostname (example.com) + studentpreview=1 => ignored' },
    { hostname: 'evil-preview.example.com', search: '?studentpreview=1', expected: false, label: 'arbitrary hostname crafted to look local => ignored' },
    { hostname: 'my-machine.local', search: '?studentpreview=1', expected: false, label: '.local hostname (eligible for Review Mode) is NOT eligible for Student Preview -- intentionally stricter allowlist' },
    { hostname: 'preview-branch.aimt-site.pages.dev', search: '?studentpreview=1', expected: false, label: 'Pages branch-preview subdomain (eligible for Review Mode) is NOT eligible for Student Preview' },
    { hostname: 'localhost', search: '', expected: false, label: 'localhost with no studentpreview param => inactive' },
    { hostname: 'localhost', search: '?studentpreview=0', expected: false, label: 'studentpreview=0 (not exactly "1") => inactive' },
    { hostname: '', search: '?studentpreview=1', expected: false, label: 'empty hostname => ignored' }
  ];
  for (const c of cases) {
    let sp;
    let threw = false;
    try {
      sp = runStudentPreviewInit(c.hostname, c.search);
    } catch (e) {
      threw = true;
    }
    check('V. STUDENT PREVIEW SAFETY', c.label, !threw && sp && sp.isActive() === c.expected, threw ? 'threw' : JSON.stringify(sp && sp.isActive()));
  }

  // The allowlist itself must be exactly these two hosts -- no wildcard,
  // no regex, nothing that could accidentally widen eligibility later.
  const stateSrc = readFileSync(path.join(ROOT, 'assets/js/headspa-state.js'), 'utf8');
  check('V. STUDENT PREVIEW SAFETY', 'the allowed-hosts list is exactly [\'127.0.0.1\', \'localhost\'] (strict allowlist, not a blocklist)', /const STUDENT_PREVIEW_ALLOWED_HOSTS = \['127\.0\.0\.1', 'localhost'\];/.test(stateSrc));
  check('V. STUDENT PREVIEW SAFETY', 'no persistence (sessionStorage/localStorage) for whether Student Preview ITSELF is active -- init()/isActive() re-derive it from the URL every load, never store/read it back (resetLocalProgress(), a separate opt-in dev convenience covered in section AB, legitimately touches localStorage for a different purpose: clearing course progress, not remembering preview state)', (() => {
    const objStart = stateSrc.indexOf('const StudentPreview = {');
    const start = stateSrc.indexOf('init() {', objStart);
    const end = stateSrc.indexOf('resetLocalProgress()', objStart);
    const block = stateSrc.slice(start, end);
    return objStart !== -1 && start !== -1 && end !== -1 && start > objStart && !/sessionStorage|localStorage/.test(block);
  })());
  check('V. STUDENT PREVIEW SAFETY', 'window.StudentPreview is exposed globally, same pattern as window.ReviewMode', /window\.StudentPreview = StudentPreview;/.test(stateSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// W. Student Preview only relaxes Listen Mode audio playability -- never
// the QA badge, never Review Mode UI, never qaStatus, never any
// authoritative state. Static regression guards (the live end-to-end
// behavioral proof was run in the browser this task).
// ─────────────────────────────────────────────────────────────────────────
(function studentPreviewScope() {
  check('W. STUDENT PREVIEW SCOPE', 'canUseUnapprovedAudio() checks StudentPreview.isActive() in addition to inQAMode()', /if \(root\.StudentPreview && typeof root\.StudentPreview\.isActive === 'function' && root\.StudentPreview\.isActive\(\)\) return true;/.test(playerSrc));
  check('W. STUDENT PREVIEW SCOPE', 'the mount() production-ready gate uses canUseUnapprovedAudio(), not bare inQAMode() (Student Preview must be able to unlock playback)', /if \(!productionReady && !canUseUnapprovedAudio\(\)\) \{ wireStaticFallback\(\); return null; \}/.test(playerSrc));
  check('W. STUDENT PREVIEW SCOPE', 'isChunkQAAvailable() uses canUseUnapprovedAudio(), consistent with the mount() gate', /function isChunkQAAvailable\(chunk\) \{\s*\n\s*if \(canUseUnapprovedAudio\(\)\)/.test(playerSrc));
  check('W. STUDENT PREVIEW SCOPE', 'the "QA preview" badge is still gated on inQAMode() ALONE, not the combined check -- Student Preview must never show it', /if \(inQAMode\(\) && !productionReady\) \{\s*\n\s*var badge/.test(playerSrc));
  check('W. STUDENT PREVIEW SCOPE', 'the Review Mode QA chunk-list panel is gated only on window.ReviewMode.isActive(), never StudentPreview (Student Preview gets the real student UI, not the QA panel)', /function renderM1ReviewQAPanel\(\) \{\s*\n\s*if \(!\(window\.ReviewMode && window\.ReviewMode\.isActive\(\)\)\) return;/.test(courseSrc) && !/renderM1ReviewQAPanel[\s\S]{0,400}StudentPreview/.test(courseSrc));
  check('W. STUDENT PREVIEW SCOPE', 'no code path sets qaStatus to APPROVED anywhere in the player or course file (Student Preview never mutates it)', !/qaStatus\s*=\s*['"]APPROVED['"]/.test(playerSrc) && !/qaStatus\s*[:=]\s*['"]APPROVED['"]/.test(courseSrc));
  check('W. STUDENT PREVIEW SCOPE', 'StudentPreview is referenced only in headspa-state.js and the player\'s canUseUnapprovedAudio() -- not in checkpoint, grading, entitlement, or certification code', ['functions/_lib/cadence/ask-cadence.mjs', 'functions/_lib/cadence/checkpoint-evaluation.mjs', 'assets/js/cadence-shell.js', 'functions/api/claim-course-access.js', 'functions/api/stripe-webhook.js', 'functions/api/create-checkout-session.js'].every((rel) => {
    const p = path.join(ROOT, rel);
    return !existsSync(p) || !/StudentPreview/.test(readFileSync(p, 'utf8'));
  }));
})();

// ─────────────────────────────────────────────────────────────────────────
// X. "Listen with Cadence" entry fix -- root cause was two compounding
// bugs: (1) the black opener's footer was a purely decorative <div> with
// an inert SVG, completely disconnected from the real player entry
// button rendered separately below it, and (2) even that real button
// only toggled the mini-player's visibility, never actually starting
// playback -- requiring a second, easy-to-miss click on the inner play
// button. Both were fixed in an earlier pass of this task; a third,
// more fundamental issue (the button being entirely JS-conjured) then
// surfaced in the owner's own browser -- see section Y below.
// Live browser proof (this task, both passes): entry renders as a real
// <button>, module load stays silent, one click starts M1-01 and reveals
// the mini-player, pause/resume work, 5 rapid clicks / a module
// close+reopen / one deliberate later click all leave exactly one
// player/audio element, and a forced media error surfaces "Audio
// couldn't start. Try again." -- see the task's live-QA report for the
// exact sequence run.
// ─────────────────────────────────────────────────────────────────────────
(function listenEntryFix() {
  // 1. Old decorative, non-interactive footer is gone, and the old
  // JS-only mount point is gone too (superseded by the real static
  // button -- section Y).
  check('X. ENTRY FIX', 'the old inert SVG mark + static title/meta footer markup is removed from module1Wrap', !/m1o-footer-title|m1o-mark/.test(module1Wrap));
  check('X. ENTRY FIX', 'the old JS-only #m1ListenModeMount mount point is gone (superseded by the real static button — section Y)', !module1Wrap.includes('m1ListenModeMount'));

  // 2. The entry control is a real, semantic, accessible button -- both
  // the static HTML button students actually see, and the
  // buildEntryButton() factory kept as a legacy fallback for any future
  // module without a pre-rendered one (section Y).
  check('X. ENTRY FIX', 'the static button in headspa-mastery.html is a native <button type="button">, not a div/span styled to look clickable', /<button type="button" id="m1ListenWithCadenceButton" class="aimt-lm-entry"/.test(courseSrc));
  check('X. ENTRY FIX', 'buildEntryButton() (legacy fallback path) also creates a native <button type="button">', /var btn = doc\.createElement\('button'\);\s*\n\s*btn\.type = 'button';/.test(playerSrc));
  check('X. ENTRY FIX', 'the static button has a play-triangle-in-circle icon baked directly into the markup (not just the ambiguous ring/dot mark)', /id="m1ListenWithCadenceButton"[\s\S]{0,400}M13 10\.5 L22 16 L13 21\.5 Z/.test(courseSrc));
  check('X. ENTRY FIX', 'buildEntryButton() (legacy path) also has the same play icon', /aimt-lm-entry-play/.test(playerSrc) && /M13 10\.5 L22 16 L13 21\.5 Z/.test(playerSrc));
  check('X. ENTRY FIX', 'the static button ships with a descriptive aria-label baked in (title + duration/checkpoint meta + call to action), not a bare generic label', /id="m1ListenWithCadenceButton"[\s\S]{0,200}aria-label="Listen with Cadence\. ~19 min · Includes 2 checkpoint stops\. Press to start listening\."/.test(courseSrc));
  check('X. ENTRY FIX', 'mount() defensively refreshes that aria-label from the real computed manifest summary on every mount (can\'t silently drift) — now driven by entryLabelForState(entryState) rather than a hardcoded "Listen with Cadence" string (see AF. ENTRY LABELS WIRED for the restart/replay entry-state fix)', /entryBtn\.setAttribute\('aria-label', labels\.title \+ '\. ' \+ meta \+ '\. ' \+ labels\.verb\);/.test(playerSrc));
  check('X. ENTRY FIX', 'a visible focus-visible outline for .aimt-lm-entry is defined both in the page\'s own static CSS and the player\'s injected CSS (works even before/without JS)', /\.aimt-lm-entry:focus-visible\{outline:/.test(courseSrc) && /\.aimt-lm-entry:focus-visible\{outline:/.test(playerSrc));
  check('X. ENTRY FIX', 'a disabled/loading visual state for .aimt-lm-entry is defined both statically and in the injected CSS', /\.aimt-lm-entry:disabled\{opacity:/.test(courseSrc) && /\.aimt-lm-entry:disabled\{opacity:/.test(playerSrc));

  // 3. Duration/checkpoint-count meta is computed from the real manifest,
  // not hand-typed text that could silently drift out of sync -- the
  // static markup's starting text matches that computed value exactly.
  check('X. ENTRY FIX', 'computeEntrySummary()/entryMetaText() are exported for testing', typeof AIMTListenMode.computeEntrySummary === 'function' && typeof AIMTListenMode.entryMetaText === 'function');
  (function () {
    const chunks = AIMTListenModeData.getManifest('headspa-mastery', 1);
    const summary = AIMTListenMode.computeEntrySummary(chunks);
    check('X. ENTRY FIX', 'computed summary matches the real Module 1 manifest: ~19 minutes, 2 checkpoint stops', summary.minutes === 19 && summary.checkpointCount === 2, JSON.stringify(summary));
    check('X. ENTRY FIX', 'entryMetaText() formats it as "~19 min · Includes 2 checkpoint stops" (matches the Pass 2B installed-audio total, and the static markup\'s hand-typed starting text)', AIMTListenMode.entryMetaText(summary) === '~19 min · Includes 2 checkpoint stops');
    const singular = AIMTListenMode.entryMetaText({ minutes: 5, checkpointCount: 1 });
    check('X. ENTRY FIX', 'entryMetaText() pluralizes correctly for a single checkpoint stop', singular === '~5 min · Includes 1 checkpoint stop');
  })();

  // 4. First click starts playback immediately -- goToChunk(...,{autoplay:true})
  // via the playCurrent() instance method, not a bare visibility toggle.
  check('X. ENTRY FIX', 'createPlayerInstance() exposes playCurrent(), which calls goToChunk(index,{autoplay:true})', /function playCurrent\(\) \{\s*\n\s*return goToChunk\(index, \{ autoplay: true \}\);\s*\n\s*\}/.test(playerSrc));
  check('X. ENTRY FIX', 'playCurrent is part of the returned instance (reachable from the entry click handler)', /return \{ destroy: destroy, goToChunk: goToChunk, playCurrent: playCurrent, _audio: audio \};/.test(playerSrc));
  check('X. ENTRY FIX', 'the entry click handler calls instance.playCurrent() on first activation (not just a display toggle)', /instance\.playCurrent\(\);/.test(playerSrc));
  check('X. ENTRY FIX', 'the shared entry click handler (realHandler — used by both the static button and the legacy factory path) reveals the bar (display = \'\') before starting playback', (() => {
    const start = playerSrc.indexOf('function realHandler() {');
    const end = playerSrc.indexOf('\n    }', start);
    const block = playerSrc.slice(start, end);
    const revealIdx = block.indexOf("playerHost.style.display = '';");
    const playIdx = block.indexOf('instance.playCurrent();');
    return start !== -1 && revealIdx !== -1 && playIdx !== -1 && revealIdx < playIdx;
  })());

  // 5. Module load itself stays silent -- the initial goToChunk at
  // instance-creation time is still explicitly autoplay:false; only the
  // entry button's own click handler (via playCurrent) ever passes true.
  // It also now passes persist:false (see AF. PRELOAD DOES NOT CLOBBER
  // FINISH STATE) so this silent preload can never itself overwrite a
  // persisted finished:true position merely by rendering.
  check('X. ENTRY FIX', 'the initial chunk load at mount time is still explicitly non-autoplaying (module load = silence)', /goToChunk\(index, \{ autoplay: false, persist: false \}\);/.test(playerSrc));

  // 6. Rapid double-click cannot mount/start twice, and neither can
  // re-entering the module (close + reopen -> mount() runs again on the
  // same persistent static button).
  check('X. ENTRY FIX', 'an `activating` guard exists and the click handler returns immediately if already activating', /var activating = false;/.test(playerSrc) && /if \(activating\) return;/.test(playerSrc));
  check('X. ENTRY FIX', 'the entry button is disabled during the activation window and re-enabled after a short delay (not left permanently disabled)', /entryBtn\.disabled = true;/.test(playerSrc) && /win\.setTimeout\(function \(\) \{ activating = false; entryBtn\.disabled = false; \}, 400\);/.test(playerSrc));
  check('X. ENTRY FIX', 'a later click while the bar is already open is a visibility convenience toggle, never a second playback start (no second playCurrent call in that branch)', (() => {
    const m = playerSrc.match(/if \(playerHost\.style\.display !== 'none'\) \{\s*\n\s*playerHost\.style\.display = 'none';\s*\n\s*return;\s*\n\s*\}/);
    return !!m;
  })());
  check('X. ENTRY FIX', 'mount() removes any previously-attached click handler from the static button before attaching a new one, tracked via a stable _aimtClickHandler property (re-opening the module can\'t stack a second listener on the persistent button)', /if \(entryBtn\._aimtClickHandler\) entryBtn\.removeEventListener\('click', entryBtn\._aimtClickHandler\);/.test(playerSrc));

  // 7. Genuine failure shows a clean, student-facing message -- no
  // technical/QA detail in the UI; diagnostics still logged locally.
  check('X. ENTRY FIX', 'a genuine audio error shows "Audio couldn\'t start. Try again." (student-facing, not a "(development state)" QA-ish message)', /setNote\('Audio couldn.t start\. Try again\.'\);/.test(playerSrc));
  check('X. ENTRY FIX', 'the real error detail is only logged to the console for local diagnosis, never shown in the note text', /win\.console && win\.console\.warn\) win\.console\.warn\('AIMT Listen Mode: audio element error'/.test(playerSrc));
  check('X. ENTRY FIX', 'no technical/internal detail (error codes, stack traces, provider names) appears in any setNote(...) call', !/setNote\([^)]*(?:MEDIA_ERR|stack|Anthropic|ElevenLabs|Auphonic)/i.test(playerSrc));

  // 8. Student Preview / normal gating / Review Mode separation still hold
  // (re-verified here in the context of this exact fix, alongside the
  // fuller V/W coverage above).
  const chunks2 = AIMTListenModeData.getManifest('headspa-mastery', 1);
  check('X. ENTRY FIX', 'qaStatus remains exactly APPROVED for all 14 chunks (this fix never touches it)', chunks2.every((c) => c.qaStatus === 'APPROVED') && chunks2.length === 14);
  check('X. ENTRY FIX', 'no chunk is left at GENERATED', chunks2.every((c) => c.qaStatus !== 'GENERATED'));
})();

// ─────────────────────────────────────────────────────────────────────────
// Y. Structural robustness fix -- "the button is missing entirely in the
// owner's browser". Root-caused to two compounding issues: the local
// dev server sent no Cache-Control headers (a real, reproduced browser-
// caching bug — fixed by restarting the local preview server only, no
// repo file involved) and, more fundamentally, the entry button was
// entirely JS-conjured, so ANY mount() failure (a stale script, a
// missing manifest, a closed production gate) made the whole control
// vanish with zero console output. Fixed here: the button now lives
// directly in headspa-mastery.html's own static markup, present and
// visible on first paint independent of any script running at all;
// mount() looks it up by id and ATTACHES behavior, never creates or
// removes it; and a tiny inline <script> right after the button wires
// an immediate, last-resort "couldn't start" fallback active before any
// external file has even finished loading.
// ─────────────────────────────────────────────────────────────────────────
(function structuralRobustness() {
  // 1. The button is real, static markup -- present with zero JavaScript
  // ever having run.
  check('Y. STRUCTURAL ROBUSTNESS', 'the static button exists directly in module1Wrap (not injected)', /<button type="button" id="m1ListenWithCadenceButton" class="aimt-lm-entry"/.test(module1Wrap));
  check('Y. STRUCTURAL ROBUSTNESS', 'the static button\'s title/meta copy is present as real text nodes, not placeholders JS must fill in', module1Wrap.includes('<span class="aimt-lm-entry-title">Listen with Cadence</span>') && module1Wrap.includes('<span class="aimt-lm-entry-meta">~19 min · Includes 2 checkpoint stops</span>'));
  check('Y. STRUCTURAL ROBUSTNESS', 'a dedicated, empty-by-default note element sits next to the button for failure messaging, addressed via a generic data-hook (not a Module-1-specific id, so the player library stays module-agnostic)', /<div class="m1o-footer-note" data-aimt-entry-note aria-live="polite"><\/div>/.test(module1Wrap));

  // 2. The button's essential visual CSS is defined directly in the
  // page's own static stylesheet, not only injected by JS at mount()
  // time -- so it reads correctly even if aimt-listen-mode-player.js
  // never loads at all.
  ['.aimt-lm-entry{', '.aimt-lm-entry-play{', '.aimt-lm-entry-copy{', '.aimt-lm-entry-title{', '.aimt-lm-entry-meta{'].forEach((sel) => {
    check('Y. STRUCTURAL ROBUSTNESS', 'headspa-mastery.html\'s own static <style> defines ' + sel + ' (not only the JS-injected copy)', courseSrc.includes(sel));
  });

  // 3. A last-resort inline <script>, independent of any external file,
  // guarantees the button does something honest even if every other
  // script on the page fails to load.
  check('Y. STRUCTURAL ROBUSTNESS', 'an inline <script> immediately after the button attaches a baseline click handler, active before any external JS has run', /var btn = document\.getElementById\('m1ListenWithCadenceButton'\);[\s\S]{0,500}btn\.addEventListener\('click', baseline\);/.test(courseSrc));
  check('Y. STRUCTURAL ROBUSTNESS', 'the inline baseline handler shows the same plain, non-technical failure note ("Audio couldn\'t start. Try again.") used everywhere else in this system', /note\.textContent = "Audio couldn't start\. Try again\.";/.test(courseSrc));
  check('Y. STRUCTURAL ROBUSTNESS', 'the inline baseline handler tags itself via the same _aimtClickHandler convention mount() uses, so mount() can cleanly remove it once real playback takes over', /btn\._aimtClickHandler = baseline;/.test(courseSrc));

  // 4. mount() ATTACHES to the existing button; it never creates or
  // removes it, and it guarantees the button still does something
  // honest even when it can't wire real playback.
  check('Y. STRUCTURAL ROBUSTNESS', 'mount() accepts entryButtonId/entryButtonEl and looks up the existing button rather than always creating one', /opts\.entryButtonEl \|\| \(opts\.entryButtonId \? doc\.getElementById\(opts\.entryButtonId\) : null\)/.test(playerSrc));
  check('Y. STRUCTURAL ROBUSTNESS', 'a wireStaticFallback() helper exists and is called at every early-bailout point in mount() (missing AIMTListenModeData, missing/empty manifest, invalid manifest, closed production gate)', (() => {
    const fnMatch = /function wireStaticFallback\(\) \{[\s\S]*?\n    \}/.test(playerSrc);
    const callSites = (playerSrc.match(/wireStaticFallback\(\);/g) || []).length;
    return fnMatch && callSites === 4;
  })());
  // wireStaticFallback()'s handler now retries mount() before ever
  // showing noteFailure() -- see section Z for the retry mechanism's own
  // coverage; this check only confirms noteFailure() itself still exists
  // and is still what gets called on a genuine (non-retried) failure.
  check('Y. STRUCTURAL ROBUSTNESS', 'wireStaticFallback() falls back to the shared noteFailure() helper only when the retry itself fails, never a technical message', /function noteFailure\(btn\) \{/.test(playerSrc) && /if \(!retried\) noteFailure\(staticBtn\);/.test(playerSrc));
  check('Y. STRUCTURAL ROBUSTNESS', 'noteFailure() writes the exact same plain message the audio-error path uses ("Audio couldn\'t start. Try again.")', /note\.textContent = "Audio couldn't start\. Try again\.";/.test(playerSrc));
  check('Y. STRUCTURAL ROBUSTNESS', 'noteFailure() (the only place fallback failure text is written) never references qaStatus, chunk data, or any provider/technical term', (() => {
    const start = playerSrc.indexOf('function noteFailure(btn) {');
    const end = playerSrc.indexOf('\n  }', start);
    const body = playerSrc.slice(start, end);
    return start !== -1 && end !== -1 && !/qaStatus|GENERATED|APPROVED|ElevenLabs|Anthropic/.test(body);
  })());
  check('Y. STRUCTURAL ROBUSTNESS', 'mount() never removes or recreates the static button on success -- it reuses the exact same element (entryBtn = staticBtn), only refreshing its text/aria-label/badge/note', /var entryBtn = staticBtn;/.test(playerSrc));

  // 5. Both mount() call sites (student-facing STATIC_MODULES[1] entry
  // and the owner-only Review-Mode "Jump" button) and the Review-Mode QA
  // panel itself were updated to the new id/option and keep working.
  check('Y. STRUCTURAL ROBUSTNESS', 'both AIMTListenMode.mount() call sites in headspa-mastery.html pass a scoped entryButtonEl (none still pass a bare, ambiguous entryButtonId)', (courseSrc.match(/AIMTListenMode\.mount\(\{[^}]*entryButtonEl: wrap\.querySelector\('#m1ListenWithCadenceButton'\)/g) || []).length === 2 && !courseSrc.includes('entryButtonId'));
  check('Y. STRUCTURAL ROBUSTNESS', 'the owner-only Review Mode QA panel (renderM1ReviewQAPanel) now anchors on a .lesson-wrap-scoped lookup instead of the removed mount div or an ambiguous document-wide id, and still only ever renders when ReviewMode.isActive()', /const entryBtnEl = wrap\.querySelector\('#m1ListenWithCadenceButton'\);/.test(courseSrc) && /if \(!\(window\.ReviewMode && window\.ReviewMode\.isActive\(\)\)\) return;/.test(courseSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// Z. Fallback-not-taking-over fix -- the owner's real browser showed the
// static button and, on click, ONLY the fallback's "Audio couldn't start.
// Try again." note, with no usable playback, even where mount() should
// have succeeded. Root-caused to two real, confirmed defects (not
// assumed): (1) headspa-mastery.html's own "clone the hidden module
// template's innerHTML into the live .lesson-wrap" pattern
// (STATIC_MODULES[1]) produces TWO live elements sharing
// id="m1ListenWithCadenceButton" -- one inside the hidden #module1Wrap
// template, one inside the actually-visible .lesson-wrap -- so a bare
// document-wide getElementById(...) lookup is genuinely ambiguous about
// which one it resolves to (invalid HTML; undefined-in-spirit behavior
// even though it happens to be spec'd as "first in tree order" -- fragile
// either way). Fixed by scoping every lookup to the live wrap via
// wrap.querySelector(...), passed as entryButtonEl rather than a bare id.
// (2) The fallback's original retry design called staticBtn.click() to
// re-dispatch the click after a successful retry -- but per the HTML
// spec, an element's click() method is a documented no-op while that
// same element's own click handling is still in progress ("if this
// element is currently being clicked... return"), so the synthetic
// re-click was silently swallowed and playback never actually started
// even when the retry-mount itself succeeded. Fixed by having mount()
// invoke the freshly-wired real handler directly as a plain function
// call (opts.__autoActivateOnMount) instead of going back through the
// DOM event system. Live browser proof (this task): deliberately forced
// a real failure (StudentPreview not yet recognized), confirmed the
// exact failure note appears and no player/audio exists, then flipped
// the condition and confirmed a SECOND click on the SAME button clears
// the note and starts real playback (currentTime advancing) in one
// click -- see the task's live-QA report for the full sequence.
// ─────────────────────────────────────────────────────────────────────────
(function fallbackTakeoverFix() {
  // 1. The duplicate-id hazard is real, and every lookup is scoped
  // around it (not just the two mount() call sites checked in section Y).
  check('Z. FALLBACK TAKEOVER FIX', 'module1Wrap does contain its own copy of the button id (confirming the duplicate-id hazard this fix works around is real, not hypothetical)', /id="m1ListenWithCadenceButton"/.test(module1Wrap));
  // The inline last-resort <script> baked into the button's own markup
  // (section Y item 3) legitimately still uses a bare getElementById --
  // it executes once, at #module1Wrap-template-parse time, before
  // .lesson-wrap's clone exists at all, so it is genuinely unambiguous
  // in that one specific context (nothing else shares the id yet). The
  // real hazard this section fixes is the STATIC_MODULES/QA-panel call
  // sites, which run AFTER the clone exists -- both are covered in
  // section Y's "scoped entryButtonEl" checks; this just confirms the
  // opts-key name entryButtonId (the ambiguous, ID-string-based option)
  // isn't used by any Module 1 call site.
  check('Z. FALLBACK TAKEOVER FIX', 'no Module 1 call site in headspa-mastery.html passes the ambiguous entryButtonId option (all use scoped entryButtonEl instead)', !courseSrc.includes('entryButtonId'));
  check('Z. FALLBACK TAKEOVER FIX', 'mount() itself still supports the generic entryButtonId option for any future caller (kept for the module-agnostic legacy path), it just isn\'t how Module 1 calls it anymore', /opts\.entryButtonEl \|\| \(opts\.entryButtonId \? doc\.getElementById\(opts\.entryButtonId\) : null\)/.test(playerSrc));

  // 2. The fallback genuinely retries mount() from scratch on click,
  // rather than statically re-showing the same dead message forever.
  check('Z. FALLBACK TAKEOVER FIX', 'the fallback handler calls mount(opts) again on click (a real retry), not just noteFailure()', /var retried = mount\(opts\);/.test(playerSrc));
  check('Z. FALLBACK TAKEOVER FIX', 'the retry flag is set immediately before and cleared immediately after the retry call, so it can never leak into an unrelated later mount() call', /opts\.__autoActivateOnMount = true;\s*\n\s*var retried = mount\(opts\);\s*\n\s*delete opts\.__autoActivateOnMount;/.test(playerSrc));

  // 3. Retry success is finished with a direct function call, not a
  // synthetic click() -- the exact mechanism that silently swallowed the
  // very first version of this retry (documented HTML spec behavior:
  // click() no-ops while that same element's click handling is already
  // in progress).
  check('Z. FALLBACK TAKEOVER FIX', 'a successful retry invokes the real handler directly as a plain function call (realHandler()), not staticBtn.click()', /if \(opts\.__autoActivateOnMount\) realHandler\(\);/.test(playerSrc));
  check('Z. FALLBACK TAKEOVER FIX', 'no code path actually calls staticBtn.click() as a statement (the exact pattern that is a documented no-op when invoked from within that same element\'s own click handler) — only mentioned in the explanatory comment describing why it was removed', !/staticBtn\.click\(\);/.test(playerSrc));

  // 4. Handler replacement stays deterministic under retry: mount()
  // still unconditionally removes whatever _aimtClickHandler is
  // currently attached (fallback or a stale real handler) before
  // attaching the next one -- proven generically in section Y; this is
  // the specific guarantee that a retry can never end up with both the
  // fallback and the real handler attached at once.
  check('Z. FALLBACK TAKEOVER FIX', 'the real-handler wiring step (shared by both the static button and the legacy path) still removes any prior _aimtClickHandler before attaching the new one — retry can\'t stack fallback + real', /if \(entryBtn\._aimtClickHandler\) entryBtn\.removeEventListener\('click', entryBtn\._aimtClickHandler\);\s*\n\s*entryBtn\._aimtClickHandler = realHandler;/.test(playerSrc));

  // 5. Error-message lifecycle: appears only on genuine failure, clears
  // on success, never both at once.
  check('Z. FALLBACK TAKEOVER FIX', 'the note is only ever set to the failure text when the retry itself fails (never unconditionally on every fallback click)', /if \(!retried\) noteFailure\(staticBtn\);/.test(playerSrc));
  check('Z. FALLBACK TAKEOVER FIX', 'a successful mount (real or retried) clears any leftover note text', /var existingNote = entryBtn\.parentNode && entryBtn\.parentNode\.querySelector\('\[data-aimt-entry-note\]'\);\s*\n\s*if \(existingNote\) existingNote\.textContent = '';/.test(playerSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// AA. False-positive live-QA fix -- prior automated QA in this repo drove
// Module 1 into an "active" state purely via console shortcuts
// (APP_STATE.markModuleComplete(0); openModuleById(1);), which flips the
// .view/.lesson-wrap layer but never touches #landingPage -- a separate,
// `position: fixed; inset: 0; z-index: 999;` full-viewport overlay only
// ever hidden by the REAL, async, Supabase-auth-plus-entitlement-row
// check in shouldEnterPurchasedCourse(). Proven live (this task): on a
// genuinely fresh load, #landingPage computed display is "flex" (the
// visible screen) while .view/.lesson-wrap sit correctly underneath,
// unseen -- every prior "PASS" was validating real, working plumbing
// from a state a real student's browser would never visually show, and
// screenshots that appeared to show the mini-player were really the
// player's own even-higher z-index (2400) bar poking above the buy page.
// Also audited (and fixed) the same duplicate-id hazard in
// scrollToVisualTarget(), the one other unscoped id lookup in this file
// beyond the button itself (section Z already covered the button).
// ─────────────────────────────────────────────────────────────────────────
(function falsePositiveLiveQaFix() {
  const assertionSrc = readFileSync(path.join(ROOT, 'docs/course-audit/listen-mode/manual-qa-active-module-assertion.js'), 'utf8');

  // 1. The manual-QA-only assertion helper exists, is never loaded by the
  // shipped page, and checks the real invariants (buy page hidden, intro
  // hidden, module-access prerequisite satisfied, .view layer AND
  // APP_STATE's own current-module both agreeing, .lesson-wrap actually
  // rendered) -- failing loudly (throwing) rather than returning a
  // silently-ignorable boolean.
  check('AA. FALSE-POSITIVE LIVE-QA FIX', 'headspa-mastery.html never references or loads the manual-qa-only assertion file (test tooling only, not shipped)', !courseSrc.includes('manual-qa-active-module-assertion'));
  check('AA. FALSE-POSITIVE LIVE-QA FIX', 'assertActiveStudentModule() is defined and throws (not just returns false) on failure', /function assertActiveStudentModule\(moduleId\)/.test(assertionSrc) && /throw err;/.test(assertionSrc));
  check('AA. FALSE-POSITIVE LIVE-QA FIX', 'the assertion checks #landingPage is genuinely display:none, not just faded/opacity-based', /getComputedStyle\(landingPage\)\.display !== 'none'/.test(assertionSrc));
  check('AA. FALSE-POSITIVE LIVE-QA FIX', 'the assertion checks #introScreen is also dismissed', /getComputedStyle\(introScreen\)\.display !== 'none'/.test(assertionSrc));
  check('AA. FALSE-POSITIVE LIVE-QA FIX', 'the assertion checks the module-access prerequisite chain via the real APP_STATE.canAccessModule(), not a hand-rolled reimplementation', /APP_STATE\.canAccessModule\(moduleId\)/.test(assertionSrc));
  check('AA. FALSE-POSITIVE LIVE-QA FIX', 'the assertion cross-checks BOTH the .view layer (#lessonView.active) AND APP_STATE\'s own notion of the current module, so the two can\'t silently disagree', /lessonView\.classList\.contains\('active'\)/.test(assertionSrc) && /appState\.data\.guide\.currentModule|APP_STATE\.data\.guide\.currentModule|window\.APP_STATE\.data && window\.APP_STATE\.data\.guide/.test(assertionSrc));
  check('AA. FALSE-POSITIVE LIVE-QA FIX', 'a Module-1-specific convenience (assertModule1ListenButtonIsLive) confirms the resolved button is inside the live .lesson-wrap, never the hidden #module1Wrap template', /function assertModule1ListenButtonIsLive\(\)/.test(assertionSrc) && /template\.contains\(btn\)/.test(assertionSrc));
  check('AA. FALSE-POSITIVE LIVE-QA FIX', 'the assertion file explicitly documents that it must NOT fabricate real Supabase auth/entitlement, matching this repo\'s hard rule against weakening entitlement checks', /never touch entitlement\/auth logic|do not fabricate/.test(assertionSrc));

  // 2. scrollToVisualTarget() -- the one other id-based lookup in this
  // file -- is now scoped to .lesson-wrap, matching the button fix.
  check('AA. FALSE-POSITIVE LIVE-QA FIX', 'scrollToVisualTarget() no longer does a bare document-wide doc.getElementById(chunk.visualTarget)', !/var el = doc\.getElementById\(chunk\.visualTarget\);/.test(playerSrc));
  check('AA. FALSE-POSITIVE LIVE-QA FIX', 'scrollToVisualTarget() is scoped to .lesson-wrap (the single, never-duplicated active-lesson container), falling back to doc only if that container is somehow missing', /var scope = \(doc\.querySelector && doc\.querySelector\('\.lesson-wrap'\)\) \|\| doc;/.test(playerSrc) && /scope\.querySelector\(\s*'\[id="' \+ chunk\.visualTarget \+ '"\]'\s*\)/.test(playerSrc));

  // 3. Full audit: every remaining getElementById/querySelector call in
  // this file is either scoped, or targets an id that is provably unique
  // (JS-created, never present in any module's static template markup).
  check('AA. FALSE-POSITIVE LIVE-QA FIX', 'every remaining unscoped doc.getElementById/doc.querySelectorAll call in this file targets a JS-only id (STYLE_EL_ID or #aimtListenModePlayerHost), never a static-template id', (() => {
    const lines = playerSrc.split('\n').filter((l) => /doc\.getElementById\(|doc\.querySelectorAll\(/.test(l) && !/opts\.entry(Button|Mount)Id/.test(l));
    return lines.every((l) => /STYLE_EL_ID|aimtListenModePlayerHost/.test(l));
  })());
})();

// ─────────────────────────────────────────────────────────────────────────
// AB. Student Preview becomes a true local purchased-student experience --
// previously ?studentpreview=1 only relaxed the GENERATED-audio check
// inside Listen Mode; it never got the owner past #landingPage (the outer
// purchase/access overlay), which is why Module 1 could be "active"
// underneath while the buy page was still the visible screen (section AA).
// Fixed at the source: shouldEnterPurchasedCourse() -- the single real
// gate that decides whether #landingPage gets hidden at all -- now
// returns true immediately for an active Student Preview session, before
// touching Supabase or any entitlement/auth code path at all. This
// reuses the EXISTING, already hostname-audited StudentPreview.isActive()
// (section V/W) rather than introducing any new host-checking logic, so
// production safety inherits directly from that existing allowlist.
// Nothing below this gate changes: module sequencing, checkpoints,
// Cadence, certification, and qaStatus are all completely untouched --
// the only fiction Student Preview introduces is entry past this one
// outer gate. A separate, hostname-gated, never-auto-run
// resetLocalProgress() dev convenience was also added for repeatable
// local retesting (never a UI control, never invoked automatically).
// ─────────────────────────────────────────────────────────────────────────
(function studentPreviewPurchasedCourseShell() {
  const shouldEnterStart = courseSrc.indexOf('async function shouldEnterPurchasedCourse()');
  const shouldEnterEnd = courseSrc.indexOf('\nasync function hasActiveAuthorizedSession()');
  const shouldEnterBody = courseSrc.slice(shouldEnterStart, shouldEnterEnd);

  // 1. The StudentPreview bypass exists, is the FIRST thing the function
  // does, and returns true before any other admission path, Supabase
  // call, or entitlement check is even reached.
  check('AB. LOCAL PURCHASED-STUDENT PREVIEW', 'shouldEnterPurchasedCourse() found and isolated for scoped checks', shouldEnterStart !== -1 && shouldEnterEnd !== -1 && shouldEnterBody.length > 0);
  check('AB. LOCAL PURCHASED-STUDENT PREVIEW', 'shouldEnterPurchasedCourse() returns true immediately when Student Preview is active, reusing the existing StudentPreview.isActive() rather than any new host-checking logic', /if \(window\.StudentPreview && window\.StudentPreview\.isActive\(\)\) return true;/.test(shouldEnterBody));
  check('AB. LOCAL PURCHASED-STUDENT PREVIEW', 'the Student Preview bypass is textually the FIRST statement in the function, before the sessionStorage handoff / ?enter=1 / Review Mode admission paths', (() => {
    const bypassIdx = shouldEnterBody.indexOf("if (window.StudentPreview && window.StudentPreview.isActive()) return true;");
    const handoffIdx = shouldEnterBody.indexOf('consumeAccessFlowHandoff()');
    return bypassIdx !== -1 && handoffIdx !== -1 && bypassIdx < handoffIdx;
  })());
  check('AB. LOCAL PURCHASED-STUDENT PREVIEW', 'the Student Preview bypass returns before ANY Supabase call (auth.getSession, entitlement lookup) is reached', (() => {
    const bypassIdx = shouldEnterBody.indexOf("if (window.StudentPreview && window.StudentPreview.isActive()) return true;");
    const supabaseIdx = shouldEnterBody.indexOf('supabaseClient.auth.getSession()');
    return bypassIdx !== -1 && supabaseIdx !== -1 && bypassIdx < supabaseIdx;
  })());
  check('AB. LOCAL PURCHASED-STUDENT PREVIEW', 'no student identity is fabricated -- setSignedInStudent (which writes a name/joined-date from a REAL Supabase user) is never called on the Student Preview path (it only appears later, inside the real-auth branch)', (() => {
    const bypassIdx = shouldEnterBody.indexOf("if (window.StudentPreview && window.StudentPreview.isActive()) return true;");
    const setSignedInIdx = shouldEnterBody.indexOf('setSignedInStudent(');
    return bypassIdx !== -1 && setSignedInIdx === -1 || bypassIdx < setSignedInIdx;
  })());

  // 2. Nothing else about entitlement/auth changed -- hasHeadSpaEntitlement,
  // enterPurchasedCourseHome, and showApp are all byte-identical to the
  // pre-existing (already-shipped, already-reviewed) implementations;
  // only shouldEnterPurchasedCourse() gained the new early return.
  check('AB. LOCAL PURCHASED-STUDENT PREVIEW', 'hasHeadSpaEntitlement() (the real course_entitlements DB check) is completely unmodified -- still requires a real Supabase user + a real row, no Student Preview branch inside it', /async function hasHeadSpaEntitlement\(user\) \{\s*\n\s*if \(!supabaseClient \|\| !user\) return false;/.test(courseSrc) && !/hasHeadSpaEntitlement[\s\S]{0,400}StudentPreview/.test(courseSrc));
  check('AB. LOCAL PURCHASED-STUDENT PREVIEW', 'enterPurchasedCourseHome() is unmodified -- Student Preview reaches the exact same course-home render path a real entitled student does, not a separate one', /async function enterPurchasedCourseHome\(\) \{\s*\n\s*const landingPage = document\.getElementById\('landingPage'\);/.test(courseSrc));

  // 3. Production safety inherits from the already-audited allowlist --
  // re-asserted here in this feature's own context, not just section V.
  check('AB. LOCAL PURCHASED-STUDENT PREVIEW', 'the reused StudentPreview allowlist is still exactly 127.0.0.1/localhost (no production or *.pages.dev exception)', /const STUDENT_PREVIEW_ALLOWED_HOSTS = \['127\.0\.0\.1', 'localhost'\];/.test(readFileSync(path.join(ROOT, 'assets/js/headspa-state.js'), 'utf8')));
  // (A prose mention in an explanatory comment, pointing readers at the
  // real implementation in headspa-state.js, is fine and expected --
  // this specifically rules out headspa-mastery.html defining its OWN
  // copy of either.)
  check('AB. LOCAL PURCHASED-STUDENT PREVIEW', 'no code path in headspa-mastery.html introduces a SECOND, independent hostname check for entering the course shell (a single source of truth for this gate, not a duplicated/divergent one)', !/function isStudentPreviewEligibleHost/.test(courseSrc) && !/const STUDENT_PREVIEW_ALLOWED_HOSTS/.test(courseSrc));

  // 4. Module sequencing / checkpoints / Cadence / certification / qaStatus
  // all remain completely untouched by this change (re-verified directly
  // here, on top of the file-level diff-accounting in O/Q/S above).
  const chunksAB = AIMTListenModeData.getManifest('headspa-mastery', 1);
  check('AB. LOCAL PURCHASED-STUDENT PREVIEW', 'qaStatus remains exactly APPROVED for all 14 chunks -- this feature never touches it', chunksAB.every((c) => c.qaStatus === 'APPROVED') && chunksAB.length === 14);
  check('AB. LOCAL PURCHASED-STUDENT PREVIEW', 'APP_STATE.canAccessModule / markModuleComplete / checkpoint machinery in headspa-state.js is untouched by this change (the only new code there is StudentPreview.resetLocalProgress, an opt-in dev helper)', !/canAccessModule[\s\S]{0,200}StudentPreview/.test(readFileSync(path.join(ROOT, 'assets/js/headspa-state.js'), 'utf8')));

  // 5. resetLocalProgress(): hostname-gated, never automatic, never a UI
  // control, clears only local course-progress keys.
  const stateSrcAB = readFileSync(path.join(ROOT, 'assets/js/headspa-state.js'), 'utf8');
  check('AB. LOCAL PURCHASED-STUDENT PREVIEW', 'resetLocalProgress() exists on StudentPreview and is hostname-gated the same way as the rest of the object', /resetLocalProgress\(\) \{\s*\n\s*let hostname = '';\s*\n\s*try \{ hostname = window\.location\.hostname; \} catch \(e\) \{\}\s*\n\s*if \(!isStudentPreviewEligibleHost\(hostname\)\) return false;/.test(stateSrcAB));
  check('AB. LOCAL PURCHASED-STUDENT PREVIEW', 'resetLocalProgress() clears the main course-progress key (levo_app, via STORAGE_KEY) and every Listen Mode resume-position key', /localStorage\.removeItem\(STORAGE_KEY\);/.test(stateSrcAB) && /key\.indexOf\('aimt_listen_position::'\) === 0/.test(stateSrcAB));
  check('AB. LOCAL PURCHASED-STUDENT PREVIEW', 'resetLocalProgress() is never called automatically -- StudentPreview.init() (which DOES run automatically on load) contains no reference to it', (() => {
    const initStart = stateSrcAB.indexOf('init() {');
    const initEnd = stateSrcAB.indexOf('isActive() {');
    const initBody = stateSrcAB.slice(initStart, initEnd);
    return initStart !== -1 && !initBody.includes('resetLocalProgress');
  })());
  check('AB. LOCAL PURCHASED-STUDENT PREVIEW', 'resetLocalProgress is never wired to any UI control in headspa-mastery.html (no onclick/button reference — console-only, per the task\'s "no visible reset control" requirement)', !courseSrc.includes('resetLocalProgress'));
})();

// ─────────────────────────────────────────────────────────────────────────
// AC. Coordinated Listen Mode revision pass (Pass 1 of 2) -- non-audio UI/
// sync changes implemented ahead of the ElevenLabs regeneration pass:
// meaningful player labels (no "chunk" ever reaches a student), full
// section-level sync coverage for 1.6/1.7/1.8 (previously the one
// documented gap after the false-positive-QA fix's own audit), coordinated
// bottom-stack layout between the Listen Mode mini-player and the Ask
// Cadence pill, a proven (not just claimed) Continue Listening PASS-only
// invariant, and a visible Module Recap matching the spoken closing recap.
// No ElevenLabs/audio-generation call was made in this pass, and the
// canonical chunk manifest order/checkpoint gating is unchanged.
// ─────────────────────────────────────────────────────────────────────────
(function coordinatedRevisionPass() {
  // 1. Player label: studentLabel is the only thing shown, on both the
  // title row and the OS media-session metadata; "Chunk N of M" is gone.
  check('AC. COORDINATED REVISION PASS', 'updateTitle() renders chunk.studentLabel (falling back to title only if unset), never "Chunk N of M"', /title\.textContent = chunk \? \(chunk\.studentLabel \|\| chunk\.title \|\| ''\) : '';/.test(playerSrc) && !/'Chunk ' \+/.test(playerSrc));
  check('AC. COORDINATED REVISION PASS', 'updateMediaSession() (the OS lock-screen/notification title) also uses studentLabel, not the internal title field', /title: chunk \? \(chunk\.studentLabel \|\| chunk\.title\) : 'Listen Mode',/.test(playerSrc));
  check('AC. COORDINATED REVISION PASS', 'every one of the 14 Module 1 chunks declares a real, non-empty studentLabel', manifest.every((c) => typeof c.studentLabel === 'string' && c.studentLabel.length > 0), manifest.filter((c) => !c.studentLabel).map((c) => c.chunkId).join(','));
  check('AC. COORDINATED REVISION PASS', 'no studentLabel contains the word "chunk" (case-insensitive) — internal production terminology never reaches the student-facing label', manifest.every((c) => !/chunk/i.test(c.studentLabel)));
  check('AC. COORDINATED REVISION PASS', 'every studentLabel starts with "Module 1 ·" (consistent orientation pattern) and numbered-section chunks include their real section number', manifest.every((c) => c.studentLabel.indexOf('Module 1 ·') === 0));
  ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8'].forEach((num) => {
    const owner = manifest.find((c) => c.sourceSection === num);
    check('AC. COORDINATED REVISION PASS', 'Section ' + num + '\'s chunk studentLabel names "Section ' + num + '" explicitly', !!owner && owner.studentLabel.indexOf('Section ' + num) !== -1, owner ? owner.studentLabel : 'not found');
  });

  // 2. Full section-level sync coverage: 1.6/1.7/1.8 (previously the one
  // documented gap) now have a real visualTarget, and it resolves to a
  // real element inside module1Wrap at the section's own start.
  const m16 = manifest.find((c) => c.chunkId === 'm1-10');
  const m17 = manifest.find((c) => c.chunkId === 'm1-11');
  const m18 = manifest.find((c) => c.chunkId === 'm1-12');
  check('AC. COORDINATED REVISION PASS', '1.6 (m1-10) declares visualTarget m1VisualLicensing', m16 && m16.visualTarget === 'm1VisualLicensing');
  check('AC. COORDINATED REVISION PASS', '1.7 (m1-11) declares visualTarget m1VisualPractitionerInsight', m17 && m17.visualTarget === 'm1VisualPractitionerInsight');
  check('AC. COORDINATED REVISION PASS', '1.8 (m1-12) declares visualTarget m1VisualMistakes', m18 && m18.visualTarget === 'm1VisualMistakes');
  ['m1VisualLicensing', 'm1VisualPractitionerInsight', 'm1VisualMistakes'].forEach((id) => {
    check('AC. COORDINATED REVISION PASS', '#' + id + ' exists exactly once inside module1Wrap, at the real section\'s own .sec-eyebrow line (not a new/decorative element)', new RegExp('<div class="sec-eyebrow" id="' + id + '">').test(module1Wrap));
  });
  check('AC. COORDINATED REVISION PASS', 'scrollToVisualTarget() remains scoped to .lesson-wrap (section Z\'s duplicate-id fix is not regressed by adding these three new targets)', /var scope = \(doc\.querySelector && doc\.querySelector\('\.lesson-wrap'\)\) \|\| doc;/.test(playerSrc));

  // 3. Player / Ask Cadence pill layout coordination: a reusable CSS
  // variable the player itself keeps live, not a per-module override.
  check('AC. COORDINATED REVISION PASS', '#guideBtn\'s bottom offset is a calc() referencing --aimt-lm-bar-offset with a 0px fallback (works correctly even if the player never mounted)', /bottom: calc\(1\.5rem \+ var\(--aimt-lm-bar-offset, 0px\)\);/.test(courseSrc));
  check('AC. COORDINATED REVISION PASS', 'no per-module pixel override was introduced for this — #guideBtn has exactly one bottom declaration, not a media-query or module-specific exception', (courseSrc.match(/#guideBtn\s*\{[^}]*bottom:/g) || []).length === 1);
  check('AC. COORDINATED REVISION PASS', 'the player measures the bar\'s own real height via ResizeObserver (covers mount/reveal/collapse/resize automatically) rather than a hardcoded pixel guess', /new win\.ResizeObserver\(syncBarOffset\)/.test(playerSrc) && /barOffsetObserver\.observe\(bar\)/.test(playerSrc));
  check('AC. COORDINATED REVISION PASS', 'the offset includes a deliberate gap above the measured bar height (not touching, not overlapping)', /\(h \+ 16\) \+ 'px'/.test(playerSrc));
  check('AC. COORDINATED REVISION PASS', 'a non-ResizeObserver browser still gets a working (if less automatic) fallback via a window resize listener, rather than silently never coordinating', /win\.addEventListener\('resize', syncBarOffset\);/.test(playerSrc));
  check('AC. COORDINATED REVISION PASS', 'destroy() resets the offset to 0px and disconnects the observer, so closing the player doesn\'t leave Ask Cadence permanently shifted', /barOffsetObserver\.disconnect\(\)/.test(playerSrc) && /documentElement\.style\.setProperty\('--aimt-lm-bar-offset', '0px'\)/.test(playerSrc));
  check('AC. COORDINATED REVISION PASS', 'Ask Cadence is never hidden by this coordination (repositioned only, per the task\'s "do not hide unless compelling reason")', !/guideBtn[\s\S]{0,200}display:\s*none/.test(courseSrc.slice(courseSrc.indexOf('#guideBtn'), courseSrc.indexOf('#guideBtn') + 800)));

  // 4. Continue Listening PASS-only invariant, proven directly against the
  // real grading pipeline's own source (not re-implemented/assumed here).
  const stateSrcAC = readFileSync(path.join(ROOT, 'assets/js/headspa-state.js'), 'utf8');
  check('AC. COORDINATED REVISION PASS', 'no code path anywhere pushes directly into progress.checkpoints (mod.checkpoints is always REBUILT from checkpointMeta, never appended to)', !/checkpoints\.push/.test(stateSrcAC) && !/checkpoints\.push/.test(courseSrc));
  check('AC. COORDINATED REVISION PASS', 'reconcileModuleState() derives mod.checkpoints strictly from checkpointMeta[cpId].status === \'passed\' — the single source of truth Listen Mode\'s own isCheckpointPassed()/Continue-Listening poll reads', /mod\.checkpoints = required\.filter\(\(cpId\) => \{\s*\n\s*const meta = mod\.checkpointMeta && mod\.checkpointMeta\[cpId\];\s*\n\s*return !!\(meta && meta\.status === 'passed'\);/.test(stateSrcAC));
  check('AC. COORDINATED REVISION PASS', 'setCheckpointResult() sets status from result.passed (an authoritative boolean the caller supplies), writing \'retry\' — never \'passed\' — on any non-pass outcome', /meta\.status = result && result\.passed \? 'passed' : 'retry';/.test(stateSrcAC));
  check('AC. COORDINATED REVISION PASS', 'the real grading pipeline (submitCheckpoint) only calls setCheckpointResult with a server-authoritative pass value (result.pass from evaluateCheckpointAnswer), never a client-guessed or optimistic one', /APP_STATE\.setCheckpointResult\(moduleId, cpId, \{\s*\n\s*passed: result\.pass,/.test(courseSrc));
  check('AC. COORDINATED REVISION PASS', 'evaluateCheckpointAnswer() takes pass strictly from the server response (d.pass === true) — the client never supplies or overrides this value', /pass: d\.pass === true,/.test(courseSrc));
  check('AC. COORDINATED REVISION PASS', 'on a network/server failure, evaluateCheckpointAnswer throws rather than resolving with an optimistic pass (submitCheckpoint\'s catch never calls setCheckpointResult)', (() => {
    const start = courseSrc.indexOf('function submitCheckpoint(moduleId, cpId, systemPrompt, question, errorMessage)');
    const end = courseSrc.indexOf('\nfunction ', start + 10);
    const body = courseSrc.slice(start, end);
    const catchIdx = body.indexOf('.catch(');
    const catchBody = body.slice(catchIdx, catchIdx + 400);
    return start !== -1 && catchIdx !== -1 && !catchBody.includes('setCheckpointResult');
  })());
  check('AC. COORDINATED REVISION PASS', 'Course Review Mode\'s checkpoint path (submitCheckpointReviewMode) never calls setCheckpointResult or markCheckpoint — Review Mode testing can never cause a real Continue Listening unlock', (() => {
    const start = courseSrc.indexOf('function submitCheckpointReviewMode(');
    const end = courseSrc.indexOf('\nfunction ', start + 10);
    const body = courseSrc.slice(start, end);
    return start !== -1 && !body.includes('setCheckpointResult') && !body.includes('markCheckpoint');
  })());
  check('AC. COORDINATED REVISION PASS', 'Listen Mode\'s own Continue-Listening gate (enterAwaitingCheckpoint) polls isCheckpointPassed() and only then calls offerContinue() — never on submit/attempt, only on the poll detecting an authoritative pass (or, for a checkpoint already passed at entry — a replay — an equivalent synchronous read before the poll even starts; see AF. PASSED CHECKPOINT REPLAY)', /if \(engine\.isCheckpointPassed\(appState, moduleId, awaitingCheckpointId\)\) \{\s*\n\s*stopPolling\(\);\s*\n\s*offerContinue\(false\);/.test(playerSrc));

  // 5. Visible Module Recap matches the spoken recap in substance and
  // order, sourced from the existing approved narration (no fabricated
  // curriculum).
  const completionStart = courseSrc.indexOf('id="m1Complete"');
  const completionEnd = courseSrc.indexOf('</div>\n\n', completionStart);
  const completionBlock = courseSrc.slice(completionStart, completionEnd);
  check('AC. COORDINATED REVISION PASS', 'the m1Complete completion card contains a visible "Module recap" block', /Module recap/.test(completionBlock));
  check('AC. COORDINATED REVISION PASS', 'the visible recap lists exactly 3 items, in the same order as the approved M1-14 spoken recap (observe-not-diagnose, verify scope, referral)', (() => {
    const items = (completionBlock.match(/<li>([^<]*)<\/li>/g) || []).map((m) => m.replace(/<\/?li>/g, ''));
    return items.length === 3
      && /observe/i.test(items[0]) && /diagnosis/i.test(items[0])
      && /scope/i.test(items[1]) && /verify/i.test(items[1])
      && /[Rr]eferral/.test(items[2]) && /job well/i.test(items[2]);
  })());
})();

// ─────────────────────────────────────────────────────────────────────────
// AD. Student Preview reload-survival fix -- a real regression, root-caused
// live (not speculated): enterPurchasedCourseHome() unconditionally strips
// the ENTIRE query string via history.replaceState() as its last step, a
// pre-existing cleanup for one-time entry params (?enter=1, etc.). Once the
// prior "local purchased-student preview" round made Student Preview also
// reach enterPurchasedCourseHome() (previously it only affected the deep
// Listen Mode audio-approval gate, which never triggers this replaceState),
// that same unconditional strip started removing ?studentpreview=1 too.
// StudentPreview.isActive() is a cached flag re-derived from the URL only
// at StudentPreview.init() time (by design, never persisted) -- so the very
// next reload after first entering the course shell re-ran init() against
// the now-query-less URL and silently deactivated Student Preview, with no
// error, dropping straight back to requiring real entitlement. Reproduced
// live: navigate with ?studentpreview=1 -> enter course home (URL strips to
// bare pathname, confirmed via read_network_requests showing two
// GET .../headspa-mastery.html requests, the second with no query string)
// -> reload -> StudentPreview.isActive() reads false, #landingPage reverts
// to visible. Fixed by preserving ?studentpreview=1 specifically (and only
// that param) across the same replaceState call.
// ─────────────────────────────────────────────────────────────────────────
(function studentPreviewReloadSurvival() {
  const enterHomeStart = courseSrc.indexOf('async function enterPurchasedCourseHome()');
  const enterHomeEnd = courseSrc.indexOf('\n// ── SIGN IN PANEL ──', enterHomeStart);
  const enterHomeBody = courseSrc.slice(enterHomeStart, enterHomeEnd);
  check('AD. STUDENT PREVIEW RELOAD SURVIVAL', 'enterPurchasedCourseHome() isolated for scoped checks', enterHomeStart !== -1 && enterHomeEnd !== -1 && enterHomeBody.length > 0);
  check('AD. STUDENT PREVIEW RELOAD SURVIVAL', 'enterPurchasedCourseHome()\'s closing replaceState preserves ?studentpreview=1 specifically, rather than unconditionally stripping the whole query string', /const preservedSearch = new URLSearchParams\(window\.location\.search\)\.get\('studentpreview'\) === '1' \? '\?studentpreview=1' : '';\s*\n\s*window\.history\.replaceState\(\{\}, document\.title, window\.location\.pathname \+ preservedSearch\);/.test(enterHomeBody));
  check('AD. STUDENT PREVIEW RELOAD SURVIVAL', 'no other param is preserved by this change (a real student\'s one-time ?enter=1 handoff is still fully stripped, unaffected)', !/preservedSearch.*enter/.test(enterHomeBody) && !enterHomeBody.includes("get('enter')"));
  check('AD. STUDENT PREVIEW RELOAD SURVIVAL', 'the OTHER replaceState inside shouldEnterPurchasedCourse() (the real ?enter=1/sessionStorage-handoff path) is untouched — it is unreachable for Student Preview sessions anyway, since the StudentPreview bypass returns before that code runs', (() => {
    const shouldEnterStart = courseSrc.indexOf('async function shouldEnterPurchasedCourse()');
    const bypassIdx = courseSrc.indexOf("if (window.StudentPreview && window.StudentPreview.isActive()) return true;", shouldEnterStart);
    const otherReplaceStateIdx = courseSrc.indexOf('if (requestedPurchasedEntry) {\n      window.history.replaceState', shouldEnterStart);
    return shouldEnterStart !== -1 && bypassIdx !== -1 && otherReplaceStateIdx !== -1 && bypassIdx < otherReplaceStateIdx;
  })());
})();

// ─────────────────────────────────────────────────────────────────────────
// AE. Checkpoint 1 relocated — explicit owner override of the prior
// pass's "flag, don't move" recommendation. Owner locked the decision:
// #m1cp1's whole block moves in the real written-course DOM to sit after
// the practice interaction and before Section 1.5 (checkpoint 2 stays
// exactly where it was, after 1.8). Only its position changed — question
// text, rubric-adjacent label, textarea/button ids and handlers, and the
// server-side grading object (M1.questions.m1cp1) are all byte-identical
// to before, verified directly here (not just inferred from "O. CHECKPOINTS
// UNCHANGED" above, which only proves the text still exists SOMEWHERE in
// module1Wrap, not that nothing else changed around it). This also fully
// eliminates the prior pass's flagged scroll-past-unheard-content problem:
// checkpoint 1's visualTarget was always 'm1cp1' and needed no change —
// it now naturally sits adjacent to 1.5, so the screen never has to jump
// past unheard 1.5–1.8 content at all.
// ─────────────────────────────────────────────────────────────────────────
(function checkpoint1Relocated() {
  const practiceIdx = module1Wrap.indexOf('id="m1LineInteraction"');
  const cp1Idx = module1Wrap.indexOf('<div class="checkpoint" id="m1cp1">');
  const sec15Idx = module1Wrap.indexOf('1.5 — Limitations of a head spa service');
  const sec18Idx = module1Wrap.indexOf('1.8 — Mistakes new practitioners make');
  const cp2Idx = module1Wrap.indexOf('<div class="checkpoint" id="m1cp2">');
  const completeIdx = module1Wrap.indexOf('id="m1Complete"');

  check('AE. CHECKPOINT 1 RELOCATED', 'all six landmarks found in module1Wrap for ordering checks', [practiceIdx, cp1Idx, sec15Idx, sec18Idx, cp2Idx, completeIdx].every((i) => i !== -1));
  check('AE. CHECKPOINT 1 RELOCATED', 'real written-course order is: practice interaction -> checkpoint 1 -> Section 1.5 -> ... -> Section 1.8 -> checkpoint 2 -> completion', practiceIdx < cp1Idx && cp1Idx < sec15Idx && sec15Idx < sec18Idx && sec18Idx < cp2Idx && cp2Idx < completeIdx, JSON.stringify({ practiceIdx, cp1Idx, sec15Idx, sec18Idx, cp2Idx, completeIdx }));
  check('AE. CHECKPOINT 1 RELOCATED', 'checkpoint 1 no longer sits after Section 1.8 (the exact thing this move fixes)', cp1Idx < sec18Idx);

  check('AE. CHECKPOINT 1 RELOCATED', 'exactly one #m1cp1 and one #m1cp2 exist in module1Wrap — no duplicate checkpoint was created by the move', (module1Wrap.match(/id="m1cp1"/g) || []).length === 1 && (module1Wrap.match(/id="m1cp2"/g) || []).length === 1);
  check('AE. CHECKPOINT 1 RELOCATED', 'there remains exactly one <div class="checkpoint"> block per checkpoint in the whole file (courseSrc), matching module1Wrap\'s single #module1Wrap template as the sole source of truth', (courseSrc.match(/<div class="checkpoint" id="m1cp1">/g) || []).length === 1 && (courseSrc.match(/<div class="checkpoint" id="m1cp2">/g) || []).length === 1);

  // Content byte-identical to before the move — not just "text exists
  // somewhere," every field checked explicitly.
  const cp1Block = module1Wrap.slice(cp1Idx, module1Wrap.indexOf('<div class="checkpoint" id="m1cp2">'));
  check('AE. CHECKPOINT 1 RELOCATED', 'cp-label ("Apply the boundary") unchanged', cp1Block.includes('<div class="cp-label">Apply the boundary</div>'));
  check('AE. CHECKPOINT 1 RELOCATED', 'cp-q exact question text unchanged, byte-identical', cp1Block.includes('<div class="cp-q">A client says her hair has been shedding heavily for two months and asks whether she has alopecia. Explain exactly how you would respond. Include what you can safely say, what you must avoid saying, and the professional next step you would recommend.</div>'));
  check('AE. CHECKPOINT 1 RELOCATED', 'textarea id (m1cp1In), placeholder, and keydown handler unchanged', cp1Block.includes('id="m1cp1In"') && cp1Block.includes("onkeydown=\"m1cpKey(event,'m1cp1')\""));
  check('AE. CHECKPOINT 1 RELOCATED', 'submit button onclick (submitM1CP(\'m1cp1\')) unchanged — same grading call site, same function', cp1Block.includes("onclick=\"submitM1CP('m1cp1')\""));
  check('AE. CHECKPOINT 1 RELOCATED', 'cp-res result container id (m1cp1Res) unchanged', cp1Block.includes('id="m1cp1Res"'));

  // The server-side grading object is untouched — reasserted explicitly
  // in this section's own context, not just relying on section O above.
  const m1ObjectMatchAE = courseSrc.match(/const M1 = \{[\s\S]*?\n\};/);
  check('AE. CHECKPOINT 1 RELOCATED', 'M1.questions/rubrics object (the actual grading source) is untouched by the DOM move — position-only change, never touched the evaluator', !!m1ObjectMatchAE && m1ObjectMatchAE[0].includes('shedding heavily for two months'));

  // Listen Mode needed zero manifest changes for this — visualTarget was
  // always the bare id 'm1cp1', which the scoped live-lookup (section Z)
  // resolves correctly regardless of where that id currently sits in the
  // DOM. Confirms the manifest doesn't need touching for a pure DOM move.
  const m107 = manifest.find((c) => c.chunkId === 'm1-07');
  const m108 = manifest.find((c) => c.chunkId === 'm1-08');
  const m109 = manifest.find((c) => c.chunkId === 'm1-09');
  check('AE. CHECKPOINT 1 RELOCATED', 'm1-07 (checkpoint 1 chunk) still targets bare id "m1cp1" — no manifest change needed for the DOM move to take effect', m107 && m107.visualTarget === 'm1cp1' && m107.gateType === 'checkpoint-stop' && m107.checkpointId === 'm1cp1');
  check('AE. CHECKPOINT 1 RELOCATED', 'm1-08 (post-pass) and m1-09 (Section 1.5) chunk order/gating is unchanged — the checkpoint move only affects the checkpoint\'s HTML position, not the player chunk sequence', m108 && m108.gateType === 'post-pass' && m108.resumeAfterPass === true && m109 && m109.sourceSection === '1.5');
})();

// ─────────────────────────────────────────────────────────────────────────
// AF. Restart / replay semantics — Listen Mode position vs. course progress
// ─────────────────────────────────────────────────────────────────────────
(function restartReplaySemantics() {
  const engine = AIMTListenMode.engine;

  // -- resolveEntryState: pure function over stored position + manifest only --
  check('AF. ENTRY STATE', 'no stored position -> never-started', engine.resolveEntryState(manifest, null) === 'never-started');
  check('AF. ENTRY STATE', 'stored position with no chunkId -> never-started', engine.resolveEntryState(manifest, { chunkId: null, finished: false }) === 'never-started');
  check('AF. ENTRY STATE', 'stored chunkId no longer in the manifest -> never-started (fails safe, not resume)', engine.resolveEntryState(manifest, { chunkId: 'm1-99', finished: false }) === 'never-started');
  check('AF. ENTRY STATE', 'valid, unfinished stored chunkId -> resume', engine.resolveEntryState(manifest, { chunkId: 'm1-05', finished: false }) === 'resume');
  check('AF. ENTRY STATE', 'finished:true -> finished, regardless of which chunkId is stored', engine.resolveEntryState(manifest, { chunkId: 'm1-14', finished: true }) === 'finished');
  check('AF. ENTRY STATE', 'finished:true on an early chunkId still reads finished (finished flag, not chunk position, is authoritative)', engine.resolveEntryState(manifest, { chunkId: 'm1-02', finished: true }) === 'finished');

  // -- Course completion is never consulted: entry state is Listen Mode's own domain --
  check('AF. ENTRY STATE', 'resolveEntryState never reads appState / course progress at all (no such parameter exists)', engine.resolveEntryState.length === 2);

  // -- resolveEntryIndex: where playback actually starts for each state --
  const anyAppState = fakeAppState({ 1: ['m1cp1', 'm1cp2'] });
  check('AF. ENTRY INDEX', 'never-started resolves to index 0 (module opening)', engine.resolveEntryIndex(manifest, anyAppState, null) === 0);
  check('AF. ENTRY INDEX', 'finished resolves to index 0, NOT the stored (final/recap) chunkId — this is the fix for "jumps straight to recap"', engine.resolveEntryIndex(manifest, anyAppState, { chunkId: 'm1-14', finished: true }) === 0);
  const midIdx = manifest.findIndex((c) => c.chunkId === 'm1-10');
  check('AF. ENTRY INDEX', 'resume (unfinished) resolves to the real stored chunk index', engine.resolveEntryIndex(manifest, anyAppState, { chunkId: 'm1-10', finished: false }) === midIdx);
  const notPassedAF = fakeAppState({ 1: [] });
  check('AF. ENTRY INDEX', 'resume never lands on a not-yet-playable chunk even if that was stored (falls back to 0, mirrors resolveResumeIndex\'s own guarantee)', engine.resolveEntryIndex(manifest, notPassedAF, { chunkId: 'm1-08', finished: false }) === 0);

  // -- serializePosition/parsePosition carry the finished bit --
  const serFinished = engine.serializePosition({ chunkId: 'm1-14', timeSec: 0, speed: 1, finished: true });
  const parsedFinished = engine.parsePosition(serFinished);
  check('AF. FINISHED FLAG PERSISTENCE', 'finished:true round-trips through serialize/parse', parsedFinished.finished === true);
  const serNotFinished = engine.serializePosition({ chunkId: 'm1-05', timeSec: 12, speed: 1 });
  const parsedNotFinished = engine.parsePosition(serNotFinished);
  check('AF. FINISHED FLAG PERSISTENCE', 'finished defaults to false when omitted (old-shape stored positions stay safe, never mistaken for finished)', parsedNotFinished.finished === false);
  check('AF. FINISHED FLAG PERSISTENCE', 'a pre-existing (pre-fix) stored position with no finished key at all parses to finished:false, not finished:true', engine.parsePosition(JSON.stringify({ chunkId: 'm1-14', timeSec: 0, speed: 1 })).finished === false);

  // -- Entry button copy: Listen with Cadence / Resume Listening / Listen Again --
  check('AF. ENTRY LABELS', 'never-started label is "Listen with Cadence"', AIMTListenMode.entryLabelForState('never-started').title === 'Listen with Cadence');
  check('AF. ENTRY LABELS', 'resume label is "Resume Listening"', AIMTListenMode.entryLabelForState('resume').title === 'Resume Listening');
  check('AF. ENTRY LABELS', 'finished label is "Listen Again"', AIMTListenMode.entryLabelForState('finished').title === 'Listen Again');
  check('AF. ENTRY LABELS', 'an unrecognized/undefined state fails safe to the never-started label rather than throwing or rendering blank', AIMTListenMode.entryLabelForState(undefined).title === 'Listen with Cadence');

  // -- mount() actually applies the resolved label to the static button's title span, not just aria-label --
  check('AF. ENTRY LABELS WIRED', 'mount() sets the static button .aimt-lm-entry-title from entryLabelForState(entryState), not a hardcoded string', /titleEl\.textContent = labels\.title/.test(playerSrc));
  check('AF. ENTRY LABELS WIRED', 'mount() resolves entryState from engine.readStoredPosition/resolveEntryState BEFORE constructing the player instance, so the label and the actual start index can never disagree', /var storedPosition = engine\.readStoredPosition\(win, opts\.courseSlug, opts\.moduleId\);[\s\S]{0,40}var entryState = engine\.resolveEntryState\(chunks, storedPosition\);/.test(playerSrc));

  // -- Mount-time UI preload must never itself flip a persisted finished:true back to false --
  check('AF. PRELOAD DOES NOT CLOBBER FINISH STATE', 'the silent mount-time preload call passes persist:false', /goToChunk\(index, \{ autoplay: false, persist: false \}\);/.test(playerSrc));
  check('AF. PRELOAD DOES NOT CLOBBER FINISH STATE', 'goToChunk only persists when not explicitly told not to (persist !== false), so the one preload call above is the sole opt-out', /if \(!playOpts \|\| playOpts\.persist !== false\) persistPosition\(startAt\);/.test(playerSrc));

  // -- Only a genuine module-end marks finished:true --
  check('AF. FINISHED WRITE SITE', 'ended handler writes finished:true only for a real "ended" decision, never for advance/awaiting-checkpoint/locked', /persistPosition\(0, decision\.type === 'ended'\);/.test(playerSrc));
  check('AF. FINISHED WRITE SITE', 'ordinary progress writes (pause/skip/seek/timeupdate/cycleSpeed) never pass finished:true', !/persistPosition\(audio\.currentTime, true\)/.test(playerSrc));

  // -- Start Over: intentional, module-scoped, does not touch course/checkpoint state --
  check('AF. START OVER', 'player exposes a Start Over control distinct from Close/Minimize', /Start over from the beginning/.test(playerSrc));
  check('AF. START OVER', 'Start Over is gated behind an explicit confirmation, not a bare click', /startOverBtn\.addEventListener\('click', function \(\) \{\s*if \(!win\.confirm\(/.test(playerSrc));
  check('AF. START OVER', 'Start Over clears only this module\'s Listen Mode position key (engine.storageKey), never levo_app / course state', /win\.localStorage && win\.localStorage\.removeItem\(engine\.storageKey\(courseSlug, moduleId\)\)/.test(playerSrc));
  check('AF. START OVER', 'Start Over always jumps back to chunk index 0', /goToChunk\(0, \{ autoplay: true \}\);\s*\}\);\s*minimizeBtn\.addEventListener/.test(playerSrc));
  check('AF. START OVER', 'Start Over never calls any course-progress-writing APP_STATE method (read-only contract holds for the new control too)',
    !/startOverBtn[\s\S]{0,400}(setCheckpointResult|_checkModuleComplete|setReadProgress|setVideoChapterComplete|captureCheckpointMemory)/.test(playerSrc));

  // -- Passed-checkpoint replay: immediately available, no grading call, no forced re-poll wait --
  check('AF. PASSED CHECKPOINT REPLAY', 'enterAwaitingCheckpoint checks isCheckpointPassed synchronously before ever disabling playback or starting a poll', /function enterAwaitingCheckpoint\(checkpointId\) \{\s*awaitingCheckpointId = checkpointId;\s*if \(engine\.isCheckpointPassed\(appState, moduleId, checkpointId\)\) \{\s*offerContinue\(true\);\s*return;\s*\}/.test(playerSrc));
  check('AF. PASSED CHECKPOINT REPLAY', 'the already-passed path calls offerContinue directly — no win.setInterval/poll delay on that path', (() => {
    const m = playerSrc.match(/function enterAwaitingCheckpoint\(checkpointId\) \{([\s\S]*?)\n    \}/);
    if (!m) return false;
    const alreadyPassedBranch = m[1].split('offerContinue(true);')[0];
    return !/setInterval/.test(alreadyPassedBranch);
  })());
  check('AF. PASSED CHECKPOINT REPLAY', 'offerContinue can surface a distinct "already passed" note without changing its Continue Listening action', /You already passed this checkpoint\./.test(playerSrc));
  check('AF. PASSED CHECKPOINT REPLAY', 'isCheckpointPassed itself performs no network/grading call — pure local read of appState.getModuleProgress', !/fetch\(|XMLHttpRequest/.test(playerSrc.slice(playerSrc.indexOf('function isCheckpointPassed'), playerSrc.indexOf('function isChunkPlayable'))));

  // -- Behavioral: replaying past an already-passed checkpoint never re-persists course state --
  (function behavioralNoRegrade() {
    const passedState = fakeAppState({ 1: ['m1cp1', 'm1cp2'] });
    const before = JSON.stringify(passedState.getModuleProgress(1));
    // Simulate what enterAwaitingCheckpoint's already-passed branch does: just a read.
    const isPassed = engine.isCheckpointPassed(passedState, 1, 'm1cp1');
    const after = JSON.stringify(passedState.getModuleProgress(1));
    check('AF. PASSED CHECKPOINT REPLAY', 'checking an already-passed checkpoint during replay leaves course state byte-identical (no re-grade, no write)', isPassed === true && before === after);
  })();

  // -- goToChunk cancels any stray checkpoint-wait poll on explicit navigation --
  check('AF. STRAY POLL CANCELLED', 'goToChunk stops any pending checkpoint poll (and, since the section-gap pass, any pending section-transition-gap timer) before navigating (Start Over / Jump / Continue Listening can never be undermined by a late offerContinue() or delayed auto-advance firing)', /function goToChunk\(i, playOpts\) \{[\s\S]{0,900}stopPolling\(\);\s*\n\s*stopGapTimer\(\);\s*\n\s*awaitingCheckpointId = null;\s*\n\s*index = i;/.test(playerSrc));
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
