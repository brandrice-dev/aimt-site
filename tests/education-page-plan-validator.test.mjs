// AIMT Education Operations v1 — deterministic tests for the generic
// Page Plan validator (functions/_lib/education-ops/
// education-page-plan-validator.mjs). PURE, no network, no model call.
//
// Run: node tests/education-page-plan-validator.test.mjs

import { validateEducationPagePlan, validatePagePlanShape, validatePagePlanSemantics } from '../functions/_lib/education-ops/education-page-plan-validator.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

function unit(kind, text, claimIds = [], sourceStatements = []) {
  return { kind, text, supporting_claim_ids: claimIds, source_statements: sourceStatements };
}

function baselineSnapshot(overrides = {}) {
  return {
    selected_claim_ids: ['c1', 'c2', 'c3'],
    core_factual_points: [
      { statement: 'Follicles cycle through anagen, catagen, telogen.', supporting_claim_ids: ['c1'] },
      { statement: 'Roughly 9% of follicles are in telogen at any given time.', supporting_claim_ids: ['c2'] },
    ],
    limitations: [
      { statement: 'Evidence is mostly cross-sectional.', supporting_claim_ids: ['c3'] },
    ],
    scope_note: 'This page describes normal cycling only.',
    source_ids: ['s1'],
    ...overrides,
  };
}

function baselinePlan(overrides = {}) {
  return {
    topic_slug: 'x-topic', cluster: 'hair-loss-shedding', route: '/education/hair-loss/x-topic',
    title: 'X Topic | AIMT', meta_description: 'A page about x.', h1: 'X Topic',
    answer_summary: unit('VERBATIM', 'Follicles cycle through anagen, catagen, telogen.', ['c1'], ['Follicles cycle through anagen, catagen, telogen.']),
    sections: [
      { section_id: 'why-it-matters', heading: 'Why it matters', units: [
        unit('FRAMING', 'This matters for a simple reason.'),
        unit('PARAPHRASE', 'Cross-sectional evidence limits what can be concluded.', ['c3'], ['Evidence is mostly cross-sectional.']),
      ] },
    ],
    scope_note: 'This page describes normal cycling only.',
    limitations: [unit('VERBATIM', 'Evidence is mostly cross-sectional.', ['c3'], ['Evidence is mostly cross-sectional.'])],
    key_takeaways: [unit('VERBATIM', 'Follicles cycle through anagen, catagen, telogen.', ['c1'], ['Follicles cycle through anagen, catagen, telogen.'])],
    sources: [{ source_id: 's1', title: 'A Reference', authors: ['A. Author'], year: 2023, doi: '10.1/x', url: 'https://doi.org/10.1/x' }],
    related_links: [{ href: '/education', label: 'Education Library', relation: 'library_home' }],
    visual_recommendation: { recommendation: 'NONE', rationale: 'No visual would teach this more clearly than the prose.' },
    ...overrides,
  };
}

(function testValidPlanPasses() {
  const validation = validateEducationPagePlan(baselinePlan(), baselineSnapshot());
  check('VALID_PLAN', 'shape valid', validation.shapeValid);
  check('VALID_PLAN', 'no violations', validation.valid, JSON.stringify(validation.violations));
})();

(function testMissingRequiredFieldFailsShape() {
  const plan = baselinePlan();
  delete plan.meta_description;
  const shape = validatePagePlanShape(plan);
  check('SHAPE_MISSING_FIELD', 'invalid', !shape.valid);
  check('SHAPE_MISSING_FIELD', 'names the missing field', shape.errors.includes('MISSING_OR_INVALID:meta_description'), JSON.stringify(shape.errors));
})();

(function testRouteMustBeAbsolutePath() {
  const plan = baselinePlan({ route: 'education/hair-loss/x-topic' }); // no leading slash
  const shape = validatePagePlanShape(plan);
  check('SHAPE_ROUTE', 'invalid', !shape.valid);
  check('SHAPE_ROUTE', 'names the rule', shape.errors.includes('ROUTE_NOT_ABSOLUTE_PATH'));
})();

(function testUngroundedClaimIdRejected() {
  const plan = baselinePlan();
  plan.sections[0].units[1] = unit('PARAPHRASE', 'A fabricated statement.', ['c-invented'], ['Some statement']);
  const validation = validateEducationPagePlan(plan, baselineSnapshot());
  check('UNGROUNDED_CLAIM', 'rejected', !validation.valid);
  check('UNGROUNDED_CLAIM', 'names the rule', validation.violations.some((v) => v.startsWith('UNGROUNDED_CLAIM_ID')), JSON.stringify(validation.violations));
})();

(function testFramingCarryingClaimIdsRejected() {
  const plan = baselinePlan();
  plan.sections[0].units[0] = unit('FRAMING', 'This matters for a simple reason.', ['c1'], ['Follicles cycle through anagen, catagen, telogen.']);
  const validation = validateEducationPagePlan(plan, baselineSnapshot());
  check('FRAMING_CARRIES_CLAIMS', 'rejected', !validation.valid);
  check('FRAMING_CARRIES_CLAIMS', 'names the rule', validation.violations.some((v) => v.startsWith('FRAMING_CARRIES_CLAIM_IDS')), JSON.stringify(validation.violations));
})();

(function testNumericParaphraseRejected() {
  const plan = baselinePlan();
  plan.sections[0].units[1] = unit('PARAPHRASE', 'About 9% of follicles rest at once.', ['c2'], ['Roughly 9% of follicles are in telogen at any given time.']);
  const validation = validateEducationPagePlan(plan, baselineSnapshot());
  check('NUMERIC_PARAPHRASE', 'rejected', !validation.valid);
  check('NUMERIC_PARAPHRASE', 'names the rule', validation.violations.some((v) => v.startsWith('UNSUPPORTED_NUMERIC_CLAIM')), JSON.stringify(validation.violations));
})();

(function testNumericVerbatimMustMatchClearedTextExactly() {
  const plan = baselinePlan();
  plan.sections[0].units[1] = unit('VERBATIM', 'Roughly 9% of follicles rest at once (paraphrased slightly).', ['c2'], ['Roughly 9% of follicles are in telogen at any given time.']);
  const validation = validateEducationPagePlan(plan, baselineSnapshot());
  check('NUMERIC_VERBATIM_MISMATCH', 'rejected', !validation.valid);
  check('NUMERIC_VERBATIM_MISMATCH', 'names the rule', validation.violations.some((v) => v.startsWith('VERBATIM_NUMERIC_TEXT_NOT_CLEARED')), JSON.stringify(validation.violations));
})();

(function testGenuineVerbatimNumericPasses() {
  const plan = baselinePlan();
  plan.sections[0].units[1] = unit('VERBATIM', 'Roughly 9% of follicles are in telogen at any given time.', ['c2'], ['Roughly 9% of follicles are in telogen at any given time.']);
  const validation = validateEducationPagePlan(plan, baselineSnapshot());
  check('NUMERIC_VERBATIM_OK', 'passes', validation.valid, JSON.stringify(validation.violations));
})();

(function testScopeNoteMustMatchExactly() {
  const plan = baselinePlan({ scope_note: 'This page describes something slightly different.' });
  const validation = validateEducationPagePlan(plan, baselineSnapshot());
  check('SCOPE_NOTE_DRIFT', 'rejected', !validation.valid);
  check('SCOPE_NOTE_DRIFT', 'names the rule', validation.violations.includes('SCOPE_NOTE_NOT_PRESERVED'));
})();

(function testDuplicateFactualTextRejected() {
  // Duplicating a limitations statement inside a section body (NOT
  // key_takeaways, which is an intentional, exempt recap -- same
  // exemption page-builder-content-units.mjs's findDuplicateFactualText
  // already carries) must still be rejected.
  const plan = baselinePlan();
  plan.sections[0].units.push(unit('VERBATIM', 'Evidence is mostly cross-sectional.', ['c3'], ['Evidence is mostly cross-sectional.']));
  const validation = validateEducationPagePlan(plan, baselineSnapshot());
  check('DUPLICATE_TEXT', 'rejected', !validation.valid);
  check('DUPLICATE_TEXT', 'names the rule', validation.violations.some((v) => v.startsWith('DUPLICATE_FACTUAL_TEXT')), JSON.stringify(validation.violations));
})();

(function testKeyTakeawaysMayRecap() {
  // The intentional exemption itself: a key_takeaway repeating the
  // answer_summary's exact text is NOT a violation.
  const plan = baselinePlan();
  plan.key_takeaways.push(unit('VERBATIM', 'Follicles cycle through anagen, catagen, telogen.', ['c1'], ['Follicles cycle through anagen, catagen, telogen.']));
  const validation = validateEducationPagePlan(plan, baselineSnapshot());
  check('KEY_TAKEAWAYS_RECAP', 'a key_takeaway recapping the answer_summary is valid', validation.valid, JSON.stringify(validation.violations));
})();

(function testUnclearedSourceRejected() {
  const plan = baselinePlan();
  plan.sources.push({ source_id: 's-not-cleared', title: 'Uncleared', authors: [], year: 2020, doi: '', url: '' });
  const validation = validateEducationPagePlan(plan, baselineSnapshot());
  check('UNCLEARED_SOURCE', 'rejected', !validation.valid);
  check('UNCLEARED_SOURCE', 'names the rule', validation.violations.includes('UNCLEARED_SOURCE_RENDERED:s-not-cleared'));
})();

(function testEvidenceUnitWithoutSupportRejected() {
  const plan = baselinePlan();
  plan.sections[0].units[1] = unit('PARAPHRASE', 'An unsupported claim with no claim ids.', [], ['Evidence is mostly cross-sectional.']);
  const validation = validateEducationPagePlan(plan, baselineSnapshot());
  check('NO_SUPPORT', 'rejected', !validation.valid);
  check('NO_SUPPORT', 'names the rule', validation.violations.some((v) => v.startsWith('EVIDENCE_UNIT_WITHOUT_SUPPORT')), JSON.stringify(validation.violations));
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
