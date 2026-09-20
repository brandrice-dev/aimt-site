// AIMT Listen Mode — interaction-stop gate regression suite.
//
// Proves the "never reveal an answer or resolution before the student
// acts" rule (docs/course-audit/listen-mode/00-listen-mode-editorial-
// standard.md, Section I) for UNGRADED, no-APP_STATE-write interactive
// scenarios — the m5Decide/m8Protect/m9Cwp/m10RupSelect-family
// single-select-with-per-option-feedback pattern already used sitewide in
// headspa-mastery.html. Required Cadence Checks (graded checkpoints) were
// already covered by tests/aimt-listen-mode-module1-pilot.test.mjs's
// checkpoint-stop/post-pass suites; this file only adds the new
// interaction-stop gate type.
//
// Deliberately uses a synthetic fixture manifest, not any real module's
// data — no ElevenLabs/Anthropic calls, no real audio, no change to any
// shipped module's manifest entry (Modules 1/4/5/6/7 untouched; Module 8
// untouched and out of scope entirely). The fixture's DOM contract
// (aria-pressed + data-choice on .bq-opt buttons inside a scoped container)
// mirrors the real, already-shipped markup in headspa-mastery.html's own
// interaction handlers verbatim (see e.g. m8Protect()/m10RupSelect()) — a
// structural proof that the mechanism matches how these interactions
// actually render and get selected, without generating any new audio or
// touching a real module's manifest to do it.
//
// Run: node tests/aimt-listen-mode-interaction-gate.test.mjs

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const AIMTListenModeData = require(path.join(ROOT, 'assets/js/aimt-listen-mode-data.js'));
const AIMTListenMode = require(path.join(ROOT, 'assets/js/aimt-listen-mode-player.js'));

const results = [];
function check(group, label, condition, detail) {
  results.push({ group, label, pass: !!condition, detail: detail || '' });
}

// ── Minimal fake DOM, same spirit as the module1-pilot suite's fakeAppState ──
// A "button" is just a plain object with getAttribute(); a "container" is a
// plain object with querySelectorAll(selector) that ignores the selector
// (the fixture only ever holds one kind of option element, exactly like the
// real page's single '.bq-opt' convention) and returns the button list.
function fakeInteractionContainer(buttons) {
  return {
    querySelectorAll() { return buttons; }
  };
}
function fakeOption(dataChoice, pressed) {
  return {
    getAttribute(name) {
      if (name === 'aria-pressed') return pressed ? 'true' : 'false';
      if (name === 'data-choice') return String(dataChoice);
      return null;
    }
  };
}

// ── A. engine.resolveSelectedOption reads real aria-pressed/data-choice shape ──
(function selectedOptionReading() {
  const noneSelected = fakeInteractionContainer([fakeOption(0, false), fakeOption(1, false), fakeOption(2, false)]);
  check('A. SELECTED OPTION READING', 'no selection yet -> null', AIMTListenMode.engine.resolveSelectedOption(noneSelected, '.bq-opt') === null);

  const secondSelected = fakeInteractionContainer([fakeOption(0, false), fakeOption(1, true), fakeOption(2, false)]);
  check('A. SELECTED OPTION READING', 'option index 1 selected -> resolves to 1', AIMTListenMode.engine.resolveSelectedOption(secondSelected, '.bq-opt') === 1);

  check('A. SELECTED OPTION READING', 'null container -> null (never throws)', AIMTListenMode.engine.resolveSelectedOption(null, '.bq-opt') === null);
  check('A. SELECTED OPTION READING', 'container missing querySelectorAll -> null (never throws)', AIMTListenMode.engine.resolveSelectedOption({}, '.bq-opt') === null);

  const badIndex = fakeInteractionContainer([{ getAttribute(n) { return n === 'aria-pressed' ? 'true' : 'not-a-number'; } }]);
  check('A. SELECTED OPTION READING', 'non-numeric data-choice on the pressed option -> null, not NaN/crash', AIMTListenMode.engine.resolveSelectedOption(badIndex, '.bq-opt') === null);
})();

// ── B. engine.resolveAfterEnd gates on interaction-stop the same shape as checkpoint-stop ──
(function resolveAfterEndGate() {
  const chunks = [
    { chunkId: 'x-01', gateType: 'normal' },
    {
      chunkId: 'x-02', gateType: 'interaction-stop', interactionId: 'fixtureInteraction1',
      interactionOptionsSelector: '.bq-opt',
      interactionFeedback: [
        { optionIndex: 0, chunkId: 'x-02-fb0', audioSrc: 'assets/audio/listen/fixture/module-99/x-02-fb0.mp3', duration: 5, version: 1, qaStatus: 'APPROVED' },
        { optionIndex: 1, chunkId: 'x-02-fb1', audioSrc: 'assets/audio/listen/fixture/module-99/x-02-fb1.mp3', duration: 5, version: 1, qaStatus: 'APPROVED' }
      ]
    },
    { chunkId: 'x-03', gateType: 'normal' }
  ];
  const decision = AIMTListenMode.engine.resolveAfterEnd(chunks, 1, null);
  check('B. RESOLVE AFTER END', 'interaction-stop chunk ending resolves to awaiting-interaction (not a silent auto-advance)', decision.type === 'awaiting-interaction');
  check('B. RESOLVE AFTER END', 'awaiting-interaction carries the interactionId to poll', decision.interactionId === 'fixtureInteraction1');
  check('B. RESOLVE AFTER END', 'awaiting-interaction carries the correct afterIndex to resume at once resolved', decision.afterIndex === 2);

  const normalDecision = AIMTListenMode.engine.resolveAfterEnd(chunks, 0, null);
  check('B. RESOLVE AFTER END', 'an ordinary normal chunk before it is completely unaffected (still a plain advance)', normalDecision.type === 'advance' && normalDecision.index === 1);
})();

// ── C. validateManifest enforces the interaction-stop contract ──
(function manifestValidation() {
  function baseChunk(overrides) {
    return Object.assign({
      courseSlug: 'headspa-mastery', moduleId: 99, chunkId: 'x-01', title: 't', studentLabel: 't',
      sourceSection: 's', audioSrc: 'assets/audio/listen/headspa-mastery/module-99/x-01.mp3',
      visualTarget: null, checkpointId: null, gateType: 'normal', resumeAfterPass: false,
      duration: 5, version: 1, qaStatus: 'APPROVED', transitionGapMs: 0,
      interactionId: null, interactionOptionsSelector: null, interactionFeedback: null
    }, overrides);
  }

  const validInteraction = baseChunk({
    chunkId: 'x-02', gateType: 'interaction-stop', interactionId: 'fixtureInteraction1',
    interactionOptionsSelector: '.bq-opt',
    interactionFeedback: [
      { optionIndex: 0, chunkId: 'x-02-fb0', audioSrc: 'assets/audio/listen/headspa-mastery/module-99/x-02-fb0.mp3', duration: 4, version: 1, qaStatus: 'APPROVED' },
      { optionIndex: 1, chunkId: 'x-02-fb1', audioSrc: 'assets/audio/listen/headspa-mastery/module-99/x-02-fb1.mp3', duration: 4, version: 1, qaStatus: 'APPROVED' }
    ]
  });
  const okResult = AIMTListenModeData.validateManifest([baseChunk({}), validInteraction]);
  check('C. MANIFEST VALIDATION', 'a well-formed interaction-stop chunk passes validation', okResult.valid, okResult.errors.join('; '));

  const missingId = AIMTListenModeData.validateManifest([baseChunk({ chunkId: 'x-02', gateType: 'interaction-stop', interactionFeedback: validInteraction.interactionFeedback })]);
  check('C. MANIFEST VALIDATION', 'interaction-stop with no interactionId is rejected', !missingId.valid && missingId.errors.some((e) => /no interactionId/.test(e)));

  const missingFeedback = AIMTListenModeData.validateManifest([baseChunk({ chunkId: 'x-02', gateType: 'interaction-stop', interactionId: 'fixtureInteraction1' })]);
  check('C. MANIFEST VALIDATION', 'interaction-stop with no interactionFeedback entries is rejected (would stall the player forever)', !missingFeedback.valid && missingFeedback.errors.some((e) => /no interactionFeedback entries/.test(e)));

  const dupIndex = AIMTListenModeData.validateManifest([baseChunk({
    chunkId: 'x-02', gateType: 'interaction-stop', interactionId: 'fixtureInteraction1',
    interactionFeedback: [
      { optionIndex: 0, chunkId: 'a', audioSrc: 'assets/audio/listen/headspa-mastery/module-99/a.mp3', qaStatus: 'APPROVED' },
      { optionIndex: 0, chunkId: 'b', audioSrc: 'assets/audio/listen/headspa-mastery/module-99/b.mp3', qaStatus: 'APPROVED' }
    ]
  })]);
  check('C. MANIFEST VALIDATION', 'duplicate optionIndex across feedback entries is rejected', !dupIndex.valid && dupIndex.errors.some((e) => /duplicate optionIndex/.test(e)));

  const badAudioSrc = AIMTListenModeData.validateManifest([baseChunk({
    chunkId: 'x-02', gateType: 'interaction-stop', interactionId: 'fixtureInteraction1',
    interactionFeedback: [{ optionIndex: 0, chunkId: 'a', audioSrc: 'wrong/path/a.mp3', qaStatus: 'APPROVED' }]
  })]);
  check('C. MANIFEST VALIDATION', 'a feedback entry with a non-conforming audioSrc is rejected', !badAudioSrc.valid && badAudioSrc.errors.some((e) => /audioSrc does not follow/.test(e)));

  const badQaStatus = AIMTListenModeData.validateManifest([baseChunk({
    chunkId: 'x-02', gateType: 'interaction-stop', interactionId: 'fixtureInteraction1',
    interactionFeedback: [{ optionIndex: 0, chunkId: 'a', audioSrc: 'assets/audio/listen/headspa-mastery/module-99/a.mp3', qaStatus: 'BOGUS' }]
  })]);
  check('C. MANIFEST VALIDATION', 'a feedback entry with an invalid qaStatus is rejected', !badQaStatus.valid && badQaStatus.errors.some((e) => /invalid qaStatus/.test(e)));
})();

// ── D. isProductionReady requires every feedback branch APPROVED, not just the stop chunk ──
(function productionReadiness() {
  function baseChunk(overrides) {
    return Object.assign({
      courseSlug: 'headspa-mastery', moduleId: 99, chunkId: 'x-01', audioSrc: 'a', gateType: 'normal', qaStatus: 'APPROVED',
      interactionId: null, interactionFeedback: null
    }, overrides);
  }

  const allApproved = [
    baseChunk({}),
    baseChunk({
      chunkId: 'x-02', gateType: 'interaction-stop', interactionId: 'i1',
      interactionFeedback: [{ optionIndex: 0, qaStatus: 'APPROVED' }, { optionIndex: 1, qaStatus: 'APPROVED' }]
    })
  ];
  check('D. PRODUCTION READINESS', 'a module whose stop chunk AND every feedback branch are APPROVED is production-ready', AIMTListenModeData.isProductionReady(allApproved) === true);

  const oneBranchNotApproved = [
    baseChunk({}),
    baseChunk({
      chunkId: 'x-02', gateType: 'interaction-stop', interactionId: 'i1',
      interactionFeedback: [{ optionIndex: 0, qaStatus: 'APPROVED' }, { optionIndex: 1, qaStatus: 'GENERATED' }]
    })
  ];
  check('D. PRODUCTION READINESS', 'the stop chunk alone being APPROVED is NOT enough if one option\'s feedback branch is only GENERATED — a real student could reach that exact option and hit unfinished audio', AIMTListenModeData.isProductionReady(oneBranchNotApproved) === false);

  const noFeedbackAtAll = [
    baseChunk({}),
    baseChunk({ chunkId: 'x-02', gateType: 'interaction-stop', interactionId: 'i1', interactionFeedback: null })
  ];
  check('D. PRODUCTION READINESS', 'an interaction-stop chunk with no feedback array at all is never production-ready', AIMTListenModeData.isProductionReady(noFeedbackAtAll) === false);
})();

// ── E. Player source: the shared 'ended' handler resolves a feedback detour before re-consulting resolveAfterEnd ──
(function endedHandlerOrdering() {
  const fs = require('node:fs');
  const playerSrc = fs.readFileSync(path.join(ROOT, 'assets/js/aimt-listen-mode-player.js'), 'utf8');
  const endedBody = playerSrc.slice(playerSrc.indexOf("audio.addEventListener('ended'"), playerSrc.indexOf("audio.addEventListener('error'"));
  // Search for the real call site (`var decision = engine.resolveAfterEnd(`),
  // not the bare function name -- this handler's own explanatory comment
  // mentions "engine.resolveAfterEnd(...)" in prose above the actual check,
  // which would otherwise false-positive-fail this ordering assertion.
  check('E. ENDED HANDLER ORDERING', 'pendingInteractionResumeIndex is checked before engine.resolveAfterEnd is called', endedBody.indexOf('pendingInteractionResumeIndex !== null') < endedBody.indexOf('var decision = engine.resolveAfterEnd('));
  check('E. ENDED HANDLER ORDERING', 'the awaiting-interaction decision branch calls enterAwaitingInteraction', /decision\.type === 'awaiting-interaction'\) \{\s*\n\s*enterAwaitingInteraction\(/.test(endedBody));
  check('E. ENDED HANDLER ORDERING', 'goToChunk resets awaitingInteraction and pendingInteractionResumeIndex on every explicit navigation, same as awaitingCheckpointId', /awaitingCheckpointId = null;\s*\n\s*awaitingInteraction = null;\s*\n\s*pendingInteractionResumeIndex = null;/.test(playerSrc));
})();

// ── report ──
const failed = results.filter((r) => !r.pass);
const byGroup = {};
for (const r of results) {
  byGroup[r.group] = byGroup[r.group] || { pass: 0, total: 0 };
  byGroup[r.group].total++;
  if (r.pass) byGroup[r.group].pass++;
}
for (const [group, { pass, total }] of Object.entries(byGroup)) {
  console.log(`[${pass === total ? 'PASS' : 'FAIL'}] ${group} (${pass}/${total})`);
}
for (const r of failed) {
  console.log(`    FAILED: ${r.label}${r.detail ? ' -- ' + r.detail : ''}`);
}
console.log(`\nTotal: ${results.length}, Passed: ${results.length - failed.length}, Failed: ${failed.length}`);
process.exit(failed.length === 0 ? 0 : 1);
