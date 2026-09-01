// Cadence checkpoint-grading regression — m2cp1 fixture calibration for the
// Module 2 curriculum rebuild.
//
// Module 2's curriculum was rebuilt (course-audit-build, owner-directed:
// "AIMT — MODULE 2 CURRICULUM REBUILD + MODULE 0 LISTEN MODE ORIENTATION")
// to align with Module 8's relaxation-first doctrine: intake determines the
// plan, preparation removes uncertainty, the service executes the plan.
// The old m2cp1 question/rubric (a stressed-late-arrival, consent-before-
// every-touch scenario) directly conflicted with that doctrine and was
// replaced with a new question/rubric covering intake-to-treatment
// planning, the shoulder contact as intentional first touch, and
// protecting a mostly-quiet service without losing attentiveness. This
// file replaces the prior fixture-calibration test (written against the
// old rubric) with fixtures and checks calibrated against the real, new
// rubric.
//
// This file never hand-retypes rubric text -- it extracts the real M2
// object straight out of headspa-mastery.html (load-checkpoint-rubrics.mjs),
// the same principle every other Cadence regression test in this repo
// already follows, so it can never silently drift from what production
// actually evaluates against.
//
// No Anthropic API calls. Run: node tests/cadence-m2cp1-fixture-calibration.test.mjs

import { loadCheckpointRubrics } from '../scripts/cadence-model-regression/load-checkpoint-rubrics.mjs';
import { GRADING_DATASET } from '../scripts/cadence-model-regression/grading-dataset.mjs';
import { CHAT_DATASET } from '../scripts/cadence-model-regression/chat-dataset.mjs';
import {
  CHECKPOINT_EVAL_INSTRUCTION,
  rubricVersionTag,
  decideCheckpointOutcome,
} from '../functions/_lib/cadence/checkpoint-evaluation.mjs';
import { bankVersion, SOURCE_HASHES, knowledgeBank, caseBank, interviewBank } from '../functions/_lib/certification/content-bank.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const rubrics = loadCheckpointRubrics();
const m2cp1System = rubrics.M2.systems.m2cp1;
const competent = GRADING_DATASET.find((c) => c.id === 'm2cp1-competent');
const incomplete = GRADING_DATASET.find((c) => c.id === 'm2cp1-incomplete');
const unsafe = GRADING_DATASET.find((c) => c.id === 'm2cp1-unsafe');
const answer = competent.studentResponse;

const REQUIRED_ELEMENT_LABELS = [
  'Reviews intake without restarting from zero',
  'Removes preventable arrival/preparation uncertainty',
  'Establishes adaptations/preferences/format before treatment',
  'Shoulder contact as intentional first-touch anchor',
  'Correct handling of the aromatherapy opening',
  'Mostly-quiet default, no repeated re-permissioning',
  'In-service communication reserved for dynamic/real moments',
  'Remains responsive to a changed mind',
];

// ─────────────────────────────────────────────────────────────────────────
// A. m2cp1-competent GENUINELY DEMONSTRATES ALL EIGHT REQUIRED ELEMENTS
// ─────────────────────────────────────────────────────────────────────────
(function fixtureCompetencyTests() {
  check('FIXTURE COMPETENCY', 'm2cp1-competent is expectedDecision=pass, expectUnsafeFlag=false',
    competent.expectedDecision === 'pass' && competent.expectUnsafeFlag === false);

  check('FIXTURE COMPETENCY', 'Element 1 (reviews intake, does not restart from zero) text is present',
    /check the intake again/i.test(answer) && /dont start asking her everything all over/i.test(answer));
  check('FIXTURE COMPETENCY', 'Element 2 (removes preventable arrival/prep uncertainty) text is present',
    /where to change/i.test(answer) && /where her things go/i.test(answer) && /what happen right after/i.test(answer));
  check('FIXTURE COMPETENCY', 'Element 3 (establishes adaptations/format before treatment) text is present',
    /fragrance free or not/i.test(answer) && /area to skip/i.test(answer) && /what format we doing today/i.test(answer));
  check('FIXTURE COMPETENCY', 'Element 4 (shoulder contact as intentional first-touch anchor) text is present',
    /hand light on her shoulder first/i.test(answer) && /actual beginning of the hands on part/i.test(answer) && /on purpose/i.test(answer));
  check('FIXTURE COMPETENCY', 'Element 5 (correct aromatherapy-opening handling, both branches) text is present',
    /fragrance free i just do that/i.test(answer) && /dont bring out no scent options/i.test(answer) && /offer the three like normal/i.test(answer));
  check('FIXTURE COMPETENCY', 'Element 6 (mostly-quiet default, no repeated re-permissioning) text is present',
    /most of the time i stay quiet/i.test(answer) && /dont keep asking is this ok/i.test(answer));
  check('FIXTURE COMPETENCY', 'Element 7 (in-service communication reserved for dynamic/real moments) text is present',
    /only talk if something real happen/i.test(answer) && /temperature need check/i.test(answer));
  check('FIXTURE COMPETENCY', 'Element 8 (remains responsive to a changed mind) text is present',
    /change her mind halfway/i.test(answer) && /stop and adjust right away/i.test(answer));

  check('FIXTURE COMPETENCY', 'Given evidence matching what the fixture genuinely demonstrates (all 8 elements, nothing missing), decideCheckpointOutcome() -- the real, unchanged, pure decision function -- resolves to pass',
    decideCheckpointOutcome({
      requiredElementsDemonstrated: REQUIRED_ELEMENT_LABELS.slice(),
      requiredElementsMissing: [],
      unsafeReasoning: false,
    }).decision === 'pass');

  check('FIXTURE COMPETENCY', 'The same evidence with any one required element missing deterministically resolves to revise',
    decideCheckpointOutcome({
      requiredElementsDemonstrated: REQUIRED_ELEMENT_LABELS.slice(0, 7),
      requiredElementsMissing: [REQUIRED_ELEMENT_LABELS[7]],
      unsafeReasoning: false,
    }).decision === 'revise');
})();

// ─────────────────────────────────────────────────────────────────────────
// B. m2cp1-incomplete GENUINELY OMITS THE IN-SERVICE ELEMENTS
// ─────────────────────────────────────────────────────────────────────────
(function incompleteFixtureTests() {
  check('INCOMPLETE FIXTURE', 'm2cp1-incomplete is expectedDecision=revise, expectUnsafeFlag=false',
    incomplete.expectedDecision === 'revise' && incomplete.expectUnsafeFlag === false);
  check('INCOMPLETE FIXTURE', 'Still demonstrates intake review, arrival preparation, and the shoulder-contact anchor',
    /intake/i.test(incomplete.studentResponse) && /where to change/i.test(incomplete.studentResponse) && /shoulder/i.test(incomplete.studentResponse));
  check('INCOMPLETE FIXTURE', 'Says nothing about staying quiet, what prompts in-service communication, or responsiveness to a changed mind',
    !/quiet/i.test(incomplete.studentResponse) && !/change.{0,15}mind/i.test(incomplete.studentResponse));
  check('INCOMPLETE FIXTURE', 'Given evidence matching what this fixture demonstrates (5 of 8, in-service elements missing), decideCheckpointOutcome() resolves to revise',
    decideCheckpointOutcome({
      requiredElementsDemonstrated: REQUIRED_ELEMENT_LABELS.slice(0, 5),
      requiredElementsMissing: REQUIRED_ELEMENT_LABELS.slice(5),
      unsafeReasoning: false,
    }).decision === 'revise');
})();

// ─────────────────────────────────────────────────────────────────────────
// C. m2cp1-unsafe TRIPS THE RUBRIC'S OWN "IMMEDIATELY CORRECT" TRIGGERS
// ─────────────────────────────────────────────────────────────────────────
(function unsafeFixtureTests() {
  check('UNSAFE FIXTURE', 'm2cp1-unsafe is expectedDecision=revise, expectUnsafeFlag=true',
    unsafe.expectedDecision === 'revise' && unsafe.expectUnsafeFlag === true);
  check('UNSAFE FIXTURE', 'Treats repeatedly re-asking permission for standard steps as the preferred approach (trigger 1)',
    /can i start the massage now/i.test(unsafe.studentResponse) && /keep asking permission the whole way through/i.test(unsafe.studentResponse));
  check('UNSAFE FIXTURE', 'Overrides an established fragrance-free plan regardless of intake (trigger 2)',
    /no matter what the intake says/i.test(unsafe.studentResponse));
  check('UNSAFE FIXTURE', 'Claims the shoulder contact/aromatherapy regulates the nervous system and guarantees a relaxation response (trigger 3)',
    /nervous system/i.test(unsafe.studentResponse) && /relaxation response/i.test(unsafe.studentResponse));
  check('UNSAFE FIXTURE', 'Each rubric trigger this fixture trips is actually named in the real m2cp1System text',
    /repeatedly re-asking permission for standard, already-established steps/i.test(m2cp1System) &&
    /presents scent options when intake already established a fragrance-free plan/i.test(m2cp1System) &&
    /regulates the nervous system, forces relaxation, or guarantees a psychological or physiological response/i.test(m2cp1System));
  check('UNSAFE FIXTURE', 'decideCheckpointOutcome() treats unsafeReasoning:true as revise regardless of how many elements were otherwise demonstrated',
    decideCheckpointOutcome({
      requiredElementsDemonstrated: REQUIRED_ELEMENT_LABELS.slice(),
      requiredElementsMissing: [],
      unsafeReasoning: true,
    }).decision === 'revise');
})();

// ─────────────────────────────────────────────────────────────────────────
// D. REAL MODULE 2 CHECKPOINT (PROMPT + RUBRIC) MATCHES THE REBUILT CURRICULUM
// ─────────────────────────────────────────────────────────────────────────
(function rubricMatchesRebuildTests() {
  check('REBUILT RUBRIC', 'm2cp1 rubric text hashes to the rebuilt curriculum\'s fingerprint (rubric-a9f563f8) -- proves headspa-mastery.html\'s M2 rubric is the new, intentional text, not a stray edit',
    rubricVersionTag(m2cp1System) === 'rubric-a9f563f8');
  check('REBUILT RUBRIC', 'Rubric lists exactly eight numbered required elements',
    (m2cp1System.match(/\n[1-8]\. /g) || []).length === 8);
  check('REBUILT RUBRIC', 'Rubric element 4 names the shoulder contact as an intentional first-touch anchor',
    /shoulder hand contact as an intentional first-touch anchor/i.test(m2cp1System));
  check('REBUILT RUBRIC', 'Rubric element 6 names the mostly-quiet default without repeated re-permissioning',
    /most of the hands-on service stays quiet/i.test(m2cp1System) && /repeatedly re-asking permission for standard/i.test(m2cp1System));
  check('REBUILT RUBRIC', 'Rubric explicitly allows a response that does not address every one of the eight points in separate detail',
    /does not need to address every one of these eight points/i.test(m2cp1System));
  check('REBUILT RUBRIC', 'm2cp1 checkpoint question text matches the rebuilt curriculum\'s new scenario (intake-to-treatment transition, not the old late-arrival scenario)',
    rubrics.M2.questions.m2cp1 === 'A new client has completed their intake and is booked for your standard Head Spa service. Walk through the transition from reviewing their intake to the first few minutes of hands-on treatment. Explain what you want established before the service begins, how you remove preventable uncertainty during arrival and preparation, why the shoulder contact matters as the first-touch moment, how you handle the aromatherapy opening, and what kinds of communication still belong during the service once the plan has already been established. You do not need to reproduce a script—explain the reasoning behind your approach.');
  check('REBUILT RUBRIC', 'The full extracted M0..M11 rubric/question object set hashes to the post-rebuild fingerprint (rubric-922199df) -- only m2cp1 changed, every other checkpoint is untouched',
    rubricVersionTag(JSON.stringify(rubrics)) === 'rubric-922199df');
})();

// ─────────────────────────────────────────────────────────────────────────
// E. GENERIC FEEDBACK-GROUNDING INSTRUCTION (unaffected by the Module 2
// rebuild -- this is shared, checkpoint-agnostic infrastructure)
// ─────────────────────────────────────────────────────────────────────────
(function feedbackGroundingTests() {
  check('FEEDBACK GROUNDING', 'The shared grading instruction still requires feedback to be grounded in the supplied rubric/curriculum context',
    /grounded? .*rubric and curriculum context supplied above|ground every explanation.*rubric and curriculum context supplied above/i.test(CHECKPOINT_EVAL_INSTRUCTION));
  check('FEEDBACK GROUNDING', 'The instruction still explicitly prohibits inventing a physiological mechanism',
    /physiological mechanism/i.test(CHECKPOINT_EVAL_INSTRUCTION));
  check('FEEDBACK GROUNDING', 'The instruction still explicitly prohibits inventing a medical or diagnostic explanation',
    /medical or diagnostic explanation/i.test(CHECKPOINT_EVAL_INSTRUCTION));
  check('FEEDBACK GROUNDING', 'The instruction still explicitly prohibits an unsupported benefit',
    /unsupported benefit/i.test(CHECKPOINT_EVAL_INSTRUCTION));
  check('FEEDBACK GROUNDING', 'The fix stays generic -- the shared instruction does not name checkpoint m2cp1',
    !/m2cp1/i.test(CHECKPOINT_EVAL_INSTRUCTION));
  check('FEEDBACK GROUNDING', 'The pre-existing language-fairness clause (grammar/spelling/non-native phrasing never grounds for a missing element) is still present and untouched',
    /Grammar, spelling, phrasing style, and non-native or spoken-language patterns are never grounds to list an element here/.test(CHECKPOINT_EVAL_INSTRUCTION));
  check('FEEDBACK GROUNDING', 'The pre-existing "do not invent a requirement" clause for requiredElements is still present and untouched',
    /do not invent, add, or drop a requirement the rubric does not state/.test(CHECKPOINT_EVAL_INSTRUCTION));
})();

// ─────────────────────────────────────────────────────────────────────────
// F. NO OTHER REGRESSION FIXTURE CHANGED
// ─────────────────────────────────────────────────────────────────────────
(function noOtherFixturesChangedTests() {
  check('NO OTHER FIXTURES CHANGED', 'GRADING_DATASET still has exactly 72 cases (no case added or removed)',
    GRADING_DATASET.length === 72);
  const others = GRADING_DATASET.filter((c) => !c.id.startsWith('m2cp1-'));
  check('NO OTHER FIXTURES CHANGED', 'Every GRADING_DATASET case other than the 3 m2cp1-* cases hashes to the pre-rebuild fingerprint -- proves no other checkpoint\'s fixture text, expectedDecision, or metadata was touched',
    rubricVersionTag(JSON.stringify(others)) === 'rubric-a216c5c4');
  check('NO OTHER FIXTURES CHANGED', 'CHAT_DATASET case count unchanged (16) -- this task did not touch it',
    CHAT_DATASET.length === 16);
  check('NO OTHER FIXTURES CHANGED', 'CHAT_DATASET content hash unchanged (rubric-f774cf1a) -- this task did not touch it',
    rubricVersionTag(JSON.stringify(CHAT_DATASET)) === 'rubric-f774cf1a');
})();

// ─────────────────────────────────────────────────────────────────────────
// G. MODULE 12 UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function module12UnchangedTests() {
  check('MODULE 12 UNCHANGED', 'bankVersion unchanged',
    bankVersion === 'headspa-fe-bank-v1-2026-08-26');
  check('MODULE 12 UNCHANGED', 'SOURCE_HASHES unchanged',
    JSON.stringify(SOURCE_HASHES) === JSON.stringify({
      knowledgeBankMd: '4fb96d8f9c5c4f1f0d542f1c6965e859417af0e1cceb8d2aa77e82f2221294d5',
      appliedCasesMd: 'df60822daa285d36014b01cdbd85436ac255daa3d53cf23dc96175e281a6769d',
      interviewBankMd: 'ee76472b379a9ea3c3129389d655499dc371c7740c9ab625180b239fdc3f15c7',
    }));
  check('MODULE 12 UNCHANGED', 'Bank item counts unchanged (120 knowledge / 12 case / 9 interview)',
    knowledgeBank.length === 120 && caseBank.length === 12 && interviewBank.length === 9);
})();

// ─────────────────────────────────────────────────────────────────────────
// H. EXISTING GRADING-RECOVERY BEHAVIOR STILL INTACT
// ─────────────────────────────────────────────────────────────────────────
(function gradingRecoveryStillIntactTests() {
  check('GRADING RECOVERY INTACT', 'decideCheckpointOutcome still treats empty demonstrated + empty missing as revise (no_evidence)',
    decideCheckpointOutcome({ requiredElementsDemonstrated: [], requiredElementsMissing: [], unsafeReasoning: false }).reason === 'no_evidence');
  check('GRADING RECOVERY INTACT', 'CHECKPOINT_EVAL_INSTRUCTION still instructs the model to use the response-format contract rather than freeform prose',
    /response format is already constrained by the request/i.test(CHECKPOINT_EVAL_INSTRUCTION));
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
