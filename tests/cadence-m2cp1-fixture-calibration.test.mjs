// Cadence checkpoint-grading regression — m2cp1-competent fixture
// calibration + generic feedback-grounding.
//
// Root cause (docs/course-audit/cadence-sonnet5-grading-regression.md
// Section 11): the repaired live Sonnet 5 sentinel (17/17 completed, 0
// infra/parse failures) produced exactly one mismatch on
// m2cp1-competent (expected pass, observed revise). The model's evidence
// showed six of the real Module 2 rubric's seven required elements
// demonstrated, with only "Sequenced explanation with rationale behind
// decisions" (the rubric's own item 7) missing. The fixture's
// studentResponse text genuinely never stated the purpose behind its
// steps -- only the fixture's *notes* claimed it did. The model's revise
// call was the deterministically correct output of decideCheckpointOutcome()
// given that evidence; the fixture was mislabeled, not the model wrong.
// Separately, the model's feedback for that case illustrated the missing
// rationale with "calming the nervous system" -- a physiological framing
// Module 2 deliberately avoids -- so the generic checkpoint-evaluation
// instruction (not the m2cp1 rubric) now constrains feedback grounding.
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
const m2 = GRADING_DATASET.find((c) => c.id === 'm2cp1-competent');
const answer = m2.studentResponse;

// ─────────────────────────────────────────────────────────────────────────
// A. FIXTURE NOW GENUINELY DEMONSTRATES ALL SEVEN REQUIRED ELEMENTS
// ─────────────────────────────────────────────────────────────────────────
(function fixtureCompetencyTests() {
  check('FIXTURE COMPETENCY', 'm2cp1-competent is still expectedDecision=pass, expectUnsafeFlag=false',
    m2.expectedDecision === 'pass' && m2.expectUnsafeFlag === false);

  check('FIXTURE COMPETENCY', 'Element 1 (no shaming / no rush transfer) text is present',
    /dont make her feel bad/i.test(answer) || /two minutes is nothing/i.test(answer));
  check('FIXTURE COMPETENCY', 'Element 2 (intake confirmation) text is present',
    /intake/i.test(answer));
  check('FIXTURE COMPETENCY', 'Element 3 (privacy-preserving prep, minimal undressing) text is present',
    /private changing area/i.test(answer) && /undress/i.test(answer));
  check('FIXTURE COMPETENCY', 'Element 4 (beverage/scent presented as optional) text is present',
    /tea or water/i.test(answer) && /optional/i.test(answer));
  check('FIXTURE COMPETENCY', 'Element 5 (explicit permission before first touch) text is present',
    /before i touch her head/i.test(answer) && /is that okay/i.test(answer));
  check('FIXTURE COMPETENCY', 'Element 6 (orientation with adjustment option) text is present',
    /can say stop or adjust/i.test(answer));
  check('FIXTURE COMPETENCY', 'Element 7 (rationale/purpose behind the major decisions) text is now present -- this is what the live sentinel found missing',
    /because/i.test(answer) && /point of/i.test(answer) && /so she/i.test(answer));

  check('FIXTURE COMPETENCY', 'Element 7 rationale is tied to AIMT-approved territory (privacy/choice/consent/control/calm), not a generic aside',
    /privacy/i.test(answer) && /control/i.test(answer));

  check('FIXTURE COMPETENCY', 'Given evidence matching what the fixture now genuinely demonstrates (all 7 elements, nothing missing), decideCheckpointOutcome() -- the real, unchanged, pure decision function -- resolves to pass',
    decideCheckpointOutcome({
      requiredElementsDemonstrated: [
        'No shaming/rush transfer', 'Intake confirmation', 'Preparation instructions preserving privacy',
        'Optional beverage/scent', 'Explicit permission before first touch', 'Orientation with adjustment option',
        'Sequenced explanation with rationale behind decisions',
      ],
      requiredElementsMissing: [],
      unsafeReasoning: false,
    }).decision === 'pass');

  check('FIXTURE COMPETENCY', 'The live sentinel\'s ACTUAL captured evidence for the pre-fix fixture (6 demonstrated, rationale missing) deterministically resolves to revise -- confirming the model\'s call was correct given that evidence, and the defect was the fixture, not the decision layer',
    decideCheckpointOutcome({
      requiredElementsDemonstrated: [
        'No shaming/rush transfer', 'Intake confirmation', 'Preparation instructions preserving privacy',
        'Optional beverage/scent', 'Explicit permission before first touch', 'Orientation with adjustment option',
      ],
      requiredElementsMissing: ['Sequenced explanation with rationale behind decisions'],
      unsafeReasoning: false,
    }).decision === 'revise');
})();

// ─────────────────────────────────────────────────────────────────────────
// B. INTENTIONAL GRAMMAR / STYLE IMPERFECTIONS RETAINED
// ─────────────────────────────────────────────────────────────────────────
(function styleRetainedTests() {
  check('STYLE RETAINED', 'Category is still competent-grammar-errors',
    m2.category === 'competent-grammar-errors');
  const styleMarkers = ['i dont', 'whats optional', 'dont make her undress more then needed', 'its totally optional', 'is that okay', 'then quick explain'];
  for (const marker of styleMarkers) {
    check('STYLE RETAINED', `Original informal/non-native marker retained verbatim: "${marker}"`,
      answer.toLowerCase().includes(marker));
  }
  check('STYLE RETAINED', 'No capital "I" used for the first-person pronoun in the informal openings (style not cleaned up)',
    / i dont /.test(' ' + answer.toLowerCase() + ' '));
  check('STYLE RETAINED', 'The added rationale clauses use the same informal register (contain at least one more "dont"/"whats"-style construction beyond the original)',
    /she dont feel/i.test(answer));
})();

// ─────────────────────────────────────────────────────────────────────────
// C. REAL MODULE 2 CHECKPOINT (PROMPT + RUBRIC) UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function rubricUncahngedTests() {
  check('RUBRIC UNCHANGED', 'm2cp1 rubric text hashes to the exact value captured in the live sentinel evidence (rubric-5f2b5705) -- proves headspa-mastery.html\'s M2 rubric was not touched by this fixture-calibration task',
    rubricVersionTag(m2cp1System) === 'rubric-5f2b5705');
  check('RUBRIC UNCHANGED', 'Rubric item 7 text is exactly the pre-existing "sequenced and explains the purpose behind the major decisions" -- not rewritten to accommodate the fixture',
    m2cp1System.includes('The response is sequenced and explains the purpose behind the major decisions.'));
  check('RUBRIC UNCHANGED', 'Rubric still lists exactly seven numbered required elements',
    (m2cp1System.match(/\n[1-7]\. /g) || []).length === 7);
  check('RUBRIC UNCHANGED', 'm2cp1 checkpoint question text is unchanged',
    rubrics.M2.questions.m2cp1 === 'A new client arrives visibly stressed after rushing and apologizes for being two minutes late. Walk through the first five minutes in the order you would handle them. Explain how you would avoid transferring time pressure to the client, what you would confirm from the intake, how you would protect privacy and choice during preparation, how you would introduce any optional beverage or scent, when you would ask permission for first touch, and what you are trying to accomplish before the hands-on service begins.');
  check('RUBRIC UNCHANGED', 'The full extracted M0..M11 rubric/question object set hashes to the pre-task fingerprint -- no checkpoint content anywhere in headspa-mastery.html changed',
    rubricVersionTag(JSON.stringify(rubrics)) === 'rubric-f6f22d2b');
})();

// ─────────────────────────────────────────────────────────────────────────
// D. GENERIC FEEDBACK-GROUNDING INSTRUCTION
// ─────────────────────────────────────────────────────────────────────────
(function feedbackGroundingTests() {
  check('FEEDBACK GROUNDING', 'The shared grading instruction now requires feedback to be grounded in the supplied rubric/curriculum context',
    /grounded? .*rubric and curriculum context supplied above|ground every explanation.*rubric and curriculum context supplied above/i.test(CHECKPOINT_EVAL_INSTRUCTION));
  check('FEEDBACK GROUNDING', 'The instruction explicitly prohibits inventing a physiological mechanism',
    /physiological mechanism/i.test(CHECKPOINT_EVAL_INSTRUCTION));
  check('FEEDBACK GROUNDING', 'The instruction explicitly prohibits inventing a medical or diagnostic explanation',
    /medical or diagnostic explanation/i.test(CHECKPOINT_EVAL_INSTRUCTION));
  check('FEEDBACK GROUNDING', 'The instruction explicitly prohibits an unsupported benefit',
    /unsupported benefit/i.test(CHECKPOINT_EVAL_INSTRUCTION));
  check('FEEDBACK GROUNDING', 'The instruction explicitly prohibits any other example the supplied material does not support',
    /example the supplied rubric\/context does not support|any other example/i.test(CHECKPOINT_EVAL_INSTRUCTION));
  check('FEEDBACK GROUNDING', 'The fix is generic -- the shared instruction does not name checkpoint m2cp1',
    !/m2cp1/i.test(CHECKPOINT_EVAL_INSTRUCTION));
  check('FEEDBACK GROUNDING', 'The fix is generic -- the shared instruction does not hardcode the specific offending phrase ("nervous system")',
    !/nervous system/i.test(CHECKPOINT_EVAL_INSTRUCTION));
  check('FEEDBACK GROUNDING', 'The pre-existing language-fairness clause (grammar/spelling/non-native phrasing never grounds for a missing element) is still present and untouched',
    /Grammar, spelling, phrasing style, and non-native or spoken-language patterns are never grounds to list an element here/.test(CHECKPOINT_EVAL_INSTRUCTION));
  check('FEEDBACK GROUNDING', 'The pre-existing "do not invent a requirement" clause for requiredElements is still present and untouched',
    /do not invent, add, or drop a requirement the rubric does not state/.test(CHECKPOINT_EVAL_INSTRUCTION));
})();

// ─────────────────────────────────────────────────────────────────────────
// E. NO OTHER REGRESSION FIXTURE CHANGED
// ─────────────────────────────────────────────────────────────────────────
(function noOtherFixturesChangedTests() {
  check('NO OTHER FIXTURES CHANGED', 'GRADING_DATASET still has exactly 72 cases (no case added or removed)',
    GRADING_DATASET.length === 72);
  const others = GRADING_DATASET.filter((c) => c.id !== 'm2cp1-competent');
  check('NO OTHER FIXTURES CHANGED', 'Every GRADING_DATASET case other than m2cp1-competent hashes to the pre-task fingerprint -- proves no other fixture\'s text, expectedDecision, or metadata was touched',
    rubricVersionTag(JSON.stringify(others)) === 'rubric-e1f5005b');
  check('NO OTHER FIXTURES CHANGED', 'CHAT_DATASET case count unchanged (16) as of this task -- this file only pins that this specific (grading-fixture) task didn\'t touch it',
    CHAT_DATASET.length === 16);
  // The content hash was legitimately updated in later, unrelated tasks:
  // ("Tighten Cadence continuity and high-stakes precision") corrected
  // chat-12's and chat-15's evaluationCriteria text after verifying them
  // against the real implementation and product review; the AIMT Dashboard
  // + Resources launch pass (P1-3) then re-verified chat-12 again after
  // adding a real in-course "My AIMT" dashboard link, updating its
  // evaluationCriteria and comment to match the new implementation fact.
  // Each intentional edit is what this fingerprint now reflects; this
  // check still catches any OTHER, unintended edit to the dataset.
  check('NO OTHER FIXTURES CHANGED', 'CHAT_DATASET content hash matches the current, intentionally-updated fingerprint',
    rubricVersionTag(JSON.stringify(CHAT_DATASET)) === 'rubric-f774cf1a');
})();

// ─────────────────────────────────────────────────────────────────────────
// F. MODULE 12 UNCHANGED
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
// G. EXISTING GRADING-RECOVERY BEHAVIOR STILL INTACT
// ─────────────────────────────────────────────────────────────────────────
(function gradingRecoveryStillIntactTests() {
  check('GRADING RECOVERY INTACT', 'decideCheckpointOutcome still treats unsafeReasoning:true as revise regardless of demonstrated elements (unaffected by the instruction-text change, which is prompt-side only)',
    decideCheckpointOutcome({ requiredElementsDemonstrated: ['a', 'b'], requiredElementsMissing: [], unsafeReasoning: true }).decision === 'revise');
  check('GRADING RECOVERY INTACT', 'decideCheckpointOutcome still treats empty demonstrated + empty missing as revise (no_evidence)',
    decideCheckpointOutcome({ requiredElementsDemonstrated: [], requiredElementsMissing: [], unsafeReasoning: false }).reason === 'no_evidence');
  check('GRADING RECOVERY INTACT', 'CHECKPOINT_EVAL_INSTRUCTION still instructs the model to use the response-format contract rather than freeform prose (RESPONSE-FORMAT CONTRACT fix from the prior task is untouched)',
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
