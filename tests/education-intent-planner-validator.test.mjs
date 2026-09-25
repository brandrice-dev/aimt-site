// AIMT Education Operations v1 — deterministic tests for the intent
// planner's validator (functions/_lib/education-ops/
// education-intent-planner-validator.mjs). PURE, no model call.
//
// Run: node tests/education-intent-planner-validator.test.mjs

import { validateIntentPlan } from '../functions/_lib/education-ops/education-intent-planner-validator.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

function validPlan(overrides = {}) {
  return {
    topic_slug: 'androgenetic-alopecia',
    page_concept: 'Androgenetic Alopecia: A Practitioner Education Overview',
    public_intent: 'Explain androgenetic alopecia for practitioners.',
    route_slug: 'androgenetic-alopecia',
    in_scope_concepts: ['definition and typical presentation', 'documented risk factors'],
    out_of_scope_concepts: ['diagnosis of an individual case', 'treatment or medication protocols'],
    practitioner_relevance: 'Helps a practitioner recognize the general pattern.',
    cluster: 'hair-loss-shedding',
    risk_context: 'MODERATE risk: observational and educational posture only.',
    ...overrides,
  };
}
const context = { expectedTopicSlug: 'androgenetic-alopecia', expectedCluster: 'hair-loss-shedding' };

(function testValidPlanPasses() {
  const result = validateIntentPlan(validPlan(), context);
  check('VALID_PLAN', 'valid', result.valid, JSON.stringify(result.violations));
})();

(function testTopicSlugMismatchRejected() {
  const result = validateIntentPlan(validPlan({ topic_slug: 'wrong-topic' }), context);
  check('TOPIC_MISMATCH', 'rejected', !result.valid);
  check('TOPIC_MISMATCH', 'names the rule', result.violations.includes('TOPIC_SLUG_MISMATCH'));
})();

(function testClusterMismatchRejected() {
  const result = validateIntentPlan(validPlan({ cluster: 'some-other-cluster' }), context);
  check('CLUSTER_MISMATCH', 'rejected', !result.valid);
  check('CLUSTER_MISMATCH', 'names the rule', result.violations.includes('CLUSTER_MISMATCH'));
})();

(function testInvalidRouteSlugRejected() {
  for (const bad of ['Androgenetic Alopecia', 'androgenetic_alopecia', '/androgenetic-alopecia', 'androgenetic-alopecia/']) {
    const result = validateIntentPlan(validPlan({ route_slug: bad }), context);
    check('ROUTE_SLUG', `"${bad}" rejected`, !result.valid && result.violations.includes('ROUTE_SLUG_NOT_URL_SAFE'), JSON.stringify(result.violations));
  }
})();

(function testUnsupportedNumericScopeRejected() {
  const result = validateIntentPlan(validPlan({ public_intent: 'Affects about 30% of men by age 50.' }), context);
  check('NUMERIC_SCOPE', 'rejected -- the planner must never invent a statistic', !result.valid);
  check('NUMERIC_SCOPE', 'names the rule', result.violations.includes('UNSUPPORTED_SCOPE_CONTAINS_NUMERIC_CLAIM'));
})();

(function testMissingDiagnosisExclusionRejected() {
  const result = validateIntentPlan(validPlan({ out_of_scope_concepts: ['treatment or medication protocols'] }), context);
  check('MISSING_DIAGNOSIS_EXCLUSION', 'rejected', !result.valid);
  check('MISSING_DIAGNOSIS_EXCLUSION', 'names the rule', result.violations.includes('OUT_OF_SCOPE_MISSING_DIAGNOSIS_EXCLUSION'));
})();

(function testMissingTreatmentExclusionRejected() {
  const result = validateIntentPlan(validPlan({ out_of_scope_concepts: ['diagnosis of an individual case'] }), context);
  check('MISSING_TREATMENT_EXCLUSION', 'rejected', !result.valid);
  check('MISSING_TREATMENT_EXCLUSION', 'names the rule', result.violations.includes('OUT_OF_SCOPE_MISSING_TREATMENT_EXCLUSION'));
})();

(function testEmptyInScopeConceptsFailsShape() {
  const result = validateIntentPlan(validPlan({ in_scope_concepts: [] }), context);
  check('EMPTY_IN_SCOPE', 'shape-invalid', !result.valid && result.shapeValid === false);
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
