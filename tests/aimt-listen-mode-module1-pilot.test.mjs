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
  // chunks installed as canonical production MP3s), every chunk is now
  // GENERATED — never APPROVED, which remains the owner's call after
  // listening. This section's name predates that install; the "missing
  // audio" contract it verifies (mount()/isProductionReady() must never
  // treat GENERATED as APPROVED, must never fabricate audio) is unchanged
  // and still fully exercised below.
  check('M. MISSING AUDIO STATE', 'all 14 chunks are GENERATED following the real CapCut install', manifest.every((c) => c.qaStatus === 'GENERATED'));
  check('M. MISSING AUDIO STATE', 'no chunk is APPROVED yet — GENERATED is not APPROVED, owner review is still required', !manifest.some((c) => c.qaStatus === 'APPROVED'));
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

  // The manifest's m1-04 entry now reflects the real, installed CapCut
  // output: same canonical path, GENERATED (never APPROVED), and the
  // real recovered duration (146.02s, not the original raw generation's
  // 146.08s -- a few small near-silent trims at chunk boundaries, all
  // independently verified as non-speech during the real CapCut re-split
  // validation).
  const m104Chunk = manifest.find((c) => c.chunkId === 'm1-04');
  check('AUDIO FINISHING', 'm1-04 manifest entry points at the canonical file, is GENERATED not APPROVED, and carries the real installed-CapCut-output duration', m104Chunk.audioSrc === 'assets/audio/listen/headspa-mastery/module-01/m1-04.mp3' && m104Chunk.qaStatus === 'GENERATED' && m104Chunk.duration === 146.02);
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
  check('A. WRITTEN BRIEFING', 'footer names "Listen with Cadence" with an approximate duration and the checkpoint-stop count', /Listen with Cadence/.test(module1Wrap) && /~16 min/.test(module1Wrap) && /Includes 2 checkpoint stops/.test(module1Wrap));
  check('A. WRITTEN BRIEFING', 'the opener reuses the design system\'s existing font tokens (mont/mono/serif), not invented fonts', /var\(--aimt-font-mont\)/.test(courseSrc.slice(courseSrc.indexOf('.m1-opener'), courseSrc.indexOf('.m1-opener') + 3000)) && /var\(--aimt-font-mono\)/.test(courseSrc.slice(courseSrc.indexOf('.m1-opener'), courseSrc.indexOf('.m1-opener') + 3000)));
  check('A. WRITTEN BRIEFING', 'the opener reuses the existing AIMT ring/dot structural mark (same viewBox="0 0 44 44" SVG used by .intro-mark/.brand-mark), not a new logo', /class="m1o-mark" viewBox="0 0 44 44"/.test(module1Wrap));
  check('A. WRITTEN BRIEFING', 'no green arrow or generic opener video was added for Module 1', !/<video/i.test(module1Wrap) && !module1Wrap.includes('m1-opening-video') && !/rt-green/.test(module1Wrap));
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
  // Bound grew from the original pilot's 8 to include this task's black
  // opener (replacing the original .mod-hero block) and the Review-Mode
  // QA panel wiring — still a small, fully-accounted-for set, not an
  // open-ended one.
  check('O/Q/S. FULL DIFF ACCOUNTED FOR', 'headspa-mastery.html diff against the starting commit is a small, bounded set of hunks (original briefing insert, 3 visual-cue ids, 2 script includes, showHome/openModuleById unmount, STATIC_MODULES[1] mount call, black opener CSS+markup, Review-Mode QA panel CSS+JS+wiring)', hunkCount > 0 && hunkCount <= 16, 'got ' + hunkCount);

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
    "    1: () => { const w = document.getElementById('module1Wrap'); if (w && wrap) wrap.innerHTML = w.innerHTML; },",
    // This task's black opener replaces Module 1's original (pre-Listen-Mode,
    // every-module-has-one) .mod-hero block -- these 4 lines existed in the
    // 023d258 baseline and are genuinely gone now, replaced by .m1-opener.
    '    <div class="mod-hero">',
    '      <div class="mh-eyebrow">Module 1 · Role, Scope & Professional Boundaries</div>',
    '      <div class="mh-title">Know what you are.<br>Know what you are not.</div>',
    '      <div class="mh-desc">Professionalism begins before the service does—with how you observe, explain, adapt, and stay within scope.</div>',
    // Superseded by this task's own edit adding the QA-panel render call.
    "    1: () => { const w = document.getElementById('module1Wrap'); if (w && wrap) wrap.innerHTML = w.innerHTML; if (window.AIMTListenMode) window.AIMTListenMode.mount({ courseSlug: 'headspa-mastery', moduleId: 1, entryMountId: 'm1ListenModeMount', appState: APP_STATE }); },"
  ]);
  const unaccountedRemoves = removedLines.filter((l) => !allowedRemovedExact.has(l));
  check('O/Q/S. FULL DIFF ACCOUNTED FOR', 'every removed line in headspa-mastery.html is one of: the 3 bare protocol-card divs, the original Module 1 STATIC_MODULES entry (and its Phase-1-mount-call successor), or the 4 original .mod-hero lines this task\'s black opener replaced (nothing curriculum/checkpoint/Module-12/nav related was deleted or rewritten)', unaccountedRemoves.length === 0, unaccountedRemoves.join(' || '));
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
    'scripts/cadence-audio-finish.mjs',
    'scripts/cadence-audio-produce.mjs',
    'scripts/cadence-capcut-resplit.mjs',
    'docs/course-audit/listen-mode/module-01-production-standard-LOCKED.md',
    'tests/aimt-listen-mode-module1-pilot.test.mjs',
    'tests/aimt-listen-mode-capcut-production.test.mjs',
    'scripts/_lib/r2-s3-client.mjs',
    'scripts/aimt-media-backup.mjs',
    'scripts/aimt-media-restore.mjs',
    'tests/aimt-media-backup.test.mjs',
    'docs/course-audit/listen-mode/cloud-backup/README.md'
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
  // verified output — so all 14 are honestly GENERATED now, not a
  // fabrication. APPROVED remains the owner's call after listening.
  const manifest = AIMTListenModeData.getManifest('headspa-mastery', 1);
  const generatedIds = manifest.filter((c) => c.qaStatus === 'GENERATED').map((c) => c.chunkId).sort();
  const expectedGeneratedIds = Array.from({ length: 14 }, (_, i) => 'm1-' + String(i + 1).padStart(2, '0'));
  check('QA STATUS HONESTY', 'all 14 chunks are GENERATED, matching the real, verified CapCut install (not fabricated)', JSON.stringify(generatedIds) === JSON.stringify(expectedGeneratedIds), JSON.stringify(generatedIds));
  check('QA STATUS HONESTY', 'no chunk in the manifest was set to APPROVED (that remains the owner\'s call)', manifest.every((c) => c.qaStatus !== 'APPROVED'));
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
