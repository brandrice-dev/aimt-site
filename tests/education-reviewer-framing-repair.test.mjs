// AIMT Education Operations v1 — deterministic tests for the FRAMING-
// removal repair (functions/_lib/education-ops/
// education-reviewer-framing-repair.mjs). PURE, no model call, no I/O.
//
// Run: node tests/education-reviewer-framing-repair.test.mjs

import {
  checkFramingRepairEligibility, removeSectionFramingUnits, repairReviewerFramingFailures,
  FRAMING_REPAIR_INELIGIBLE_REASON,
} from '../functions/_lib/education-ops/education-reviewer-framing-repair.mjs';
import { REVIEW_OUTCOME } from '../functions/_lib/education-ops/education-reviewer-validator.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

// ─────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────
function buildAaShapedPlan() {
  return {
    topic_slug: 'alopecia-areata', cluster: 'hair-loss-shedding', route: '/education/hair-loss/alopecia-areata',
    title: 'Alopecia Areata', meta_description: 'd', h1: 'Alopecia Areata',
    answer_summary: { kind: 'PARAPHRASE', text: 'Answer summary text.', supporting_claim_ids: ['c1'], source_statements: ['s1'] },
    sections: [
      {
        section_id: 's1', heading: 'What is alopecia areata',
        units: [
          { kind: 'FRAMING', text: 'It can feel very different from ordinary shedding, showing up as sudden patchy hair loss.', supporting_claim_ids: [], source_statements: [] },
          { kind: 'VERBATIM', text: 'Alopecia areata is characterized by patchy, non-scarring hair loss.', supporting_claim_ids: ['c1'], source_statements: ['Alopecia areata is characterized by patchy, non-scarring hair loss.'] },
          { kind: 'PARAPHRASE', text: 'The condition often follows an unpredictable disease course.', supporting_claim_ids: ['c2'], source_statements: ['s2'] },
        ],
      },
      {
        section_id: 's2', heading: 'Why it looks different',
        units: [
          { kind: 'FRAMING', text: 'Many people notice the sudden, visible patches and worry about what others will think.', supporting_claim_ids: [], source_statements: [] },
        ],
      },
    ],
    scope_note: 'This page does not diagnose or recommend treatment.',
    limitations: [{ kind: 'PARAPHRASE', text: 'Evidence on long-term course is limited.', supporting_claim_ids: ['c3'], source_statements: ['s3'] }],
    key_takeaways: [{ kind: 'PARAPHRASE', text: 'Alopecia areata differs from ordinary shedding in pattern and course.', supporting_claim_ids: ['c4'], source_statements: ['s4'] }],
    sources: [], related_links: [], visual_recommendation: { recommendation: 'NONE', rationale: 'r' },
  };
}

function run8ShapedReviewResult(overrides = {}) {
  return {
    outcome: REVIEW_OUTCOME.SUBSTANTIVE_FAIL,
    failing_paraphrases: [],
    failing_framings: [
      { location: 'sections:s1:0', verdict: 'CARRIES_SCIENCE', reason: 'Compares patchy hair loss to ordinary shedding -- a factual claim.' },
      { location: 'sections:s2:0', verdict: 'CARRIES_SCIENCE', reason: 'Describes sudden visible patches and a psychosocial implication as fact.' },
    ],
    voice_fail: false,
    scope_fail: false,
    summary: '0 paraphrase failure(s), 2 framing failure(s), voice_fail=false, scope_fail=false.',
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// A. Run #8-shaped review is eligible for repair
// ─────────────────────────────────────────────────────────────────────────
(function testRun8ShapedReviewIsEligible() {
  const result = checkFramingRepairEligibility(run8ShapedReviewResult());
  check('ELIGIBILITY_RUN8', 'eligible is true', result.eligible === true);
  check('ELIGIBILITY_RUN8', 'reason is null', result.reason === null);
})();

// ─────────────────────────────────────────────────────────────────────────
// B. framing-only CARRIES_SCIENCE removes section FRAMING units
// ─────────────────────────────────────────────────────────────────────────
(function testRemovesOnlySectionFramingUnits() {
  const plan = buildAaShapedPlan();
  const { repairedPlan, removedUnitCount } = removeSectionFramingUnits(plan);
  check('REMOVAL', 'removed exactly 2 units (one per section)', removedUnitCount === 2, removedUnitCount);
  check('REMOVAL', 'section s1 has zero FRAMING units left', repairedPlan.sections[0].units.every((u) => u.kind !== 'FRAMING'));
  check('REMOVAL', 'section s1 retains its 2 non-FRAMING units', repairedPlan.sections[0].units.length === 2);
  check('REMOVAL', 'section s2 is now empty (its only unit was FRAMING)', repairedPlan.sections[1].units.length === 0);
  check('REMOVAL', 'original plan is never mutated', plan.sections[0].units.length === 3 && plan.sections[1].units.length === 1);
})();

// ─────────────────────────────────────────────────────────────────────────
// C. VERBATIM and PARAPHRASE are untouched byte-for-byte
// ─────────────────────────────────────────────────────────────────────────
(function testVerbatimAndParaphraseUnitsAreByteIdentical() {
  const plan = buildAaShapedPlan();
  const { repairedPlan } = removeSectionFramingUnits(plan);
  const originalVerbatim = plan.sections[0].units[1];
  const originalParaphrase = plan.sections[0].units[2];
  check('UNTOUCHED_UNITS', 'VERBATIM unit is byte-for-byte identical', JSON.stringify(repairedPlan.sections[0].units[0]) === JSON.stringify(originalVerbatim));
  check('UNTOUCHED_UNITS', 'PARAPHRASE unit is byte-for-byte identical', JSON.stringify(repairedPlan.sections[0].units[1]) === JSON.stringify(originalParaphrase));
  check('UNTOUCHED_UNITS', 'no unit kind was ever converted to another kind', repairedPlan.sections[0].units.every((u) => ['VERBATIM', 'PARAPHRASE'].includes(u.kind)));
})();

// ─────────────────────────────────────────────────────────────────────────
// D. answer_summary / limitations / key_takeaways are untouched
// ─────────────────────────────────────────────────────────────────────────
(function testAnswerSummaryLimitationsKeyTakeawaysUntouched() {
  const plan = buildAaShapedPlan();
  const { repairedPlan } = removeSectionFramingUnits(plan);
  check('OUTSIDE_SECTIONS_UNTOUCHED', 'answer_summary byte-identical', JSON.stringify(repairedPlan.answer_summary) === JSON.stringify(plan.answer_summary));
  check('OUTSIDE_SECTIONS_UNTOUCHED', 'limitations byte-identical', JSON.stringify(repairedPlan.limitations) === JSON.stringify(plan.limitations));
  check('OUTSIDE_SECTIONS_UNTOUCHED', 'key_takeaways byte-identical', JSON.stringify(repairedPlan.key_takeaways) === JSON.stringify(plan.key_takeaways));
})();

// ─────────────────────────────────────────────────────────────────────────
// Composed repairReviewerFramingFailures(): eligible case
// ─────────────────────────────────────────────────────────────────────────
(function testComposedRepairEligibleCase() {
  const plan = buildAaShapedPlan();
  const outcome = repairReviewerFramingFailures(plan, run8ShapedReviewResult());
  check('COMPOSED_ELIGIBLE', 'eligible is true', outcome.eligible === true);
  check('COMPOSED_ELIGIBLE', 'removedUnitCount is 2', outcome.removedUnitCount === 2);
  check('COMPOSED_ELIGIBLE', 'reason is null', outcome.reason === null);
  check('COMPOSED_ELIGIBLE', 'repairedPlan has zero FRAMING units left anywhere in sections', outcome.repairedPlan.sections.every((s) => s.units.every((u) => u.kind !== 'FRAMING')));
})();

// ─────────────────────────────────────────────────────────────────────────
// NO_SECTION_FRAMING_UNITS_TO_REMOVE: eligible review, but nothing to
// safely remove (e.g. the reviewer's flagged units live outside any
// section) -- fails closed rather than silently doing nothing then
// wasting a Reviewer retry.
// ─────────────────────────────────────────────────────────────────────────
(function testFailsClosedWhenNoSectionFramingUnitsExist() {
  const plan = buildAaShapedPlan();
  plan.sections = plan.sections.map((s) => ({ ...s, units: s.units.filter((u) => u.kind !== 'FRAMING') }));
  const outcome = repairReviewerFramingFailures(plan, run8ShapedReviewResult());
  check('NO_UNITS_TO_REMOVE', 'eligible is false', outcome.eligible === false);
  check('NO_UNITS_TO_REMOVE', 'reason is NO_SECTION_FRAMING_UNITS_TO_REMOVE', outcome.reason === FRAMING_REPAIR_INELIGIBLE_REASON.NO_SECTION_FRAMING_UNITS_TO_REMOVE);
  check('NO_UNITS_TO_REMOVE', 'repairedPlan is unchanged', JSON.stringify(outcome.repairedPlan) === JSON.stringify(plan));
})();

// ─────────────────────────────────────────────────────────────────────────
// M. paraphrase failure is NOT repairable
// ─────────────────────────────────────────────────────────────────────────
(function testParaphraseFailureIsNotRepairable() {
  const result = checkFramingRepairEligibility(run8ShapedReviewResult({
    failing_paraphrases: [{ location: 'a', verdict: 'NUMERIC_DRIFT', reason: 'x' }],
  }));
  check('PARAPHRASE_NOT_REPAIRABLE', 'eligible is false', result.eligible === false);
  check('PARAPHRASE_NOT_REPAIRABLE', 'reason is HAS_PARAPHRASE_FAILURES', result.reason === FRAMING_REPAIR_INELIGIBLE_REASON.HAS_PARAPHRASE_FAILURES);
})();

// ─────────────────────────────────────────────────────────────────────────
// N. voice failure is NOT repairable
// ─────────────────────────────────────────────────────────────────────────
(function testVoiceFailureIsNotRepairable() {
  const result = checkFramingRepairEligibility(run8ShapedReviewResult({ voice_fail: true }));
  check('VOICE_NOT_REPAIRABLE', 'eligible is false', result.eligible === false);
  check('VOICE_NOT_REPAIRABLE', 'reason is VOICE_FAIL', result.reason === FRAMING_REPAIR_INELIGIBLE_REASON.VOICE_FAIL);
})();

// ─────────────────────────────────────────────────────────────────────────
// O. scope failure is NOT repairable
// ─────────────────────────────────────────────────────────────────────────
(function testScopeFailureIsNotRepairable() {
  const result = checkFramingRepairEligibility(run8ShapedReviewResult({ scope_fail: true }));
  check('SCOPE_NOT_REPAIRABLE', 'eligible is false', result.eligible === false);
  check('SCOPE_NOT_REPAIRABLE', 'reason is SCOPE_FAIL', result.reason === FRAMING_REPAIR_INELIGIBLE_REASON.SCOPE_FAIL);
})();

// ─────────────────────────────────────────────────────────────────────────
// P. mixed framing + paraphrase failure is NOT repairable
// ─────────────────────────────────────────────────────────────────────────
(function testMixedFramingAndParaphraseFailureIsNotRepairable() {
  const result = checkFramingRepairEligibility(run8ShapedReviewResult({
    failing_paraphrases: [{ location: 'a', verdict: 'OUTSIDE_EVIDENCE', reason: 'x' }],
  }));
  check('MIXED_NOT_REPAIRABLE', 'eligible is false', result.eligible === false);
  check('MIXED_NOT_REPAIRABLE', 'reason is HAS_PARAPHRASE_FAILURES', result.reason === FRAMING_REPAIR_INELIGIBLE_REASON.HAS_PARAPHRASE_FAILURES);
})();

// ─────────────────────────────────────────────────────────────────────────
// Additional ineligibility edges: not SUBSTANTIVE_FAIL, no framing
// failures at all, and a mixed NON_FACTUAL/CARRIES_SCIENCE framing set.
// ─────────────────────────────────────────────────────────────────────────
(function testAdditionalIneligibilityEdges() {
  const passResult = checkFramingRepairEligibility({ outcome: REVIEW_OUTCOME.PASS, failing_paraphrases: [], failing_framings: [], voice_fail: false, scope_fail: false });
  check('OTHER_INELIGIBLE', 'PASS outcome is not eligible', passResult.eligible === false && passResult.reason === FRAMING_REPAIR_INELIGIBLE_REASON.NOT_SUBSTANTIVE_FAIL);

  const noFramingResult = checkFramingRepairEligibility(run8ShapedReviewResult({ failing_framings: [] }));
  check('OTHER_INELIGIBLE', 'zero framing failures is not eligible', noFramingResult.eligible === false && noFramingResult.reason === FRAMING_REPAIR_INELIGIBLE_REASON.NO_FRAMING_FAILURES);

  const mixedVerdictResult = checkFramingRepairEligibility(run8ShapedReviewResult({
    failing_framings: [
      { location: 'a', verdict: 'CARRIES_SCIENCE', reason: 'x' },
      { location: 'b', verdict: 'NON_FACTUAL', reason: 'should not even be failing, but exercises the mixed-verdict guard' },
    ],
  }));
  check('OTHER_INELIGIBLE', 'not every failing framing is CARRIES_SCIENCE is not eligible', mixedVerdictResult.eligible === false && mixedVerdictResult.reason === FRAMING_REPAIR_INELIGIBLE_REASON.FRAMING_VERDICT_NOT_ALL_CARRIES_SCIENCE);
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
