// AIMT Publication Editor v2.1 — deterministic unit tests for the
// bounded-reconciliation pure functions (functions/_lib/research/
// publication-synthesis-reconciliation.mjs). No live/model calls.
//
// Run: node tests/research-publication-synthesis-reconciliation.test.mjs

import {
  classifyValidatorViolations,
  validateReconciliationShape,
  determineReconciliationOutcome,
  mergeReconciliationIntoSynthesis,
} from '../functions/_lib/research/publication-synthesis-reconciliation.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

// ─────────────────────────────────────────────────────────────────────────
// classifyValidatorViolations (STEP 1 / STEP 7 tests 1-2)
// ─────────────────────────────────────────────────────────────────────────
(function testClassifySingleMissingDisposition() {
  const c = classifyValidatorViolations(['CLAIM_MISSING_DISPOSITION:c1']);
  check('CLASSIFY_ONE_MISSING', 'classified as repairable_accounting', c.repairable_accounting_claim_ids.length === 1 && c.repairable_accounting_claim_ids[0] === 'c1');
  check('CLASSIFY_ONE_MISSING', 'only_repairable_accounting is true', c.only_repairable_accounting === true);
  check('CLASSIFY_ONE_MISSING', 'no substantive/mechanical', c.substantive.length === 0 && c.non_repairable_mechanical.length === 0);
})();

(function testClassifyTwoMissingDispositions() {
  const c = classifyValidatorViolations(['CLAIM_MISSING_DISPOSITION:c1', 'CLAIM_MISSING_DISPOSITION:c2']);
  check('CLASSIFY_TWO_MISSING', 'both IDs extracted', c.repairable_accounting_claim_ids.length === 2
    && c.repairable_accounting_claim_ids.includes('c1') && c.repairable_accounting_claim_ids.includes('c2'), JSON.stringify(c.repairable_accounting_claim_ids));
  check('CLASSIFY_TWO_MISSING', 'only_repairable_accounting is true', c.only_repairable_accounting === true);
})();

(function testClassifySubstantiveCodes() {
  const c = classifyValidatorViolations(['HIGH_RISK_TOPIC_CANNOT_AUTO_CLEAR', 'UNRESOLVED_ISSUES_WITH_AUTO_READY']);
  check('CLASSIFY_SUBSTANTIVE', 'both classified substantive', c.substantive.length === 2, JSON.stringify(c));
  check('CLASSIFY_SUBSTANTIVE', 'only_repairable_accounting is false', c.only_repairable_accounting === false);
})();

(function testClassifyNonRepairableMechanicalCodes() {
  const c = classifyValidatorViolations([
    'SELECTED_CLAIM_NOT_IN_EVIDENCE_BUNDLE:c9',
    'CLAIM_DOUBLE_DISPOSITION:c2',
    'SELECTED_CLAIM_FAILS_CANDIDACY:c3',
    'CITED_SOURCE_UNRESOLVED:s1',
  ]);
  check('CLASSIFY_NON_REPAIRABLE', 'all classified non_repairable_mechanical', c.non_repairable_mechanical.length === 4, JSON.stringify(c));
  check('CLASSIFY_NON_REPAIRABLE', 'only_repairable_accounting is false', c.only_repairable_accounting === false);
})();

(function testClassifyMixedAccountingPlusMechanicalIsNotOnlyAccounting() {
  const c = classifyValidatorViolations(['CLAIM_MISSING_DISPOSITION:c1', 'CLAIM_DOUBLE_DISPOSITION:c2']);
  check('CLASSIFY_MIXED', 'has both buckets populated', c.repairable_accounting_claim_ids.length === 1 && c.non_repairable_mechanical.length === 1);
  check('CLASSIFY_MIXED', 'only_repairable_accounting is false (mechanical present too)', c.only_repairable_accounting === false);
})();

(function testClassifyEmptyViolationsIsNotOnlyAccounting() {
  const c = classifyValidatorViolations([]);
  check('CLASSIFY_EMPTY', 'only_repairable_accounting is false when nothing to repair', c.only_repairable_accounting === false);
})();

// ─────────────────────────────────────────────────────────────────────────
// validateReconciliationShape (STEP 2 / STEP 7 tests 7-8)
// ─────────────────────────────────────────────────────────────────────────
function validResolution(overrides = {}) {
  return {
    claim_id: 'c1',
    disposition: 'EXCLUDED',
    role: null,
    reason_code: 'OUT_OF_SCOPE_TREATMENT_OR_INTERVENTION',
    reason: 'Concerns a treatment effect.',
    materially_changes_existing_synthesis: false,
    material_change_reason: null,
    ...overrides,
  };
}

(function testShapeValidTwoResolutions() {
  const output = { resolutions: [validResolution({ claim_id: 'c1' }), validResolution({ claim_id: 'c2' })] };
  const shape = validateReconciliationShape(output, ['c1', 'c2']);
  check('SHAPE_VALID', 'valid', shape.valid, JSON.stringify(shape.errors));
})();

(function testShapeMissingExpectedClaim() {
  const output = { resolutions: [validResolution({ claim_id: 'c1' })] };
  const shape = validateReconciliationShape(output, ['c1', 'c2']);
  check('SHAPE_MISSING_EXPECTED', 'invalid', !shape.valid);
  check('SHAPE_MISSING_EXPECTED', 'names the missing claim', shape.errors.includes('RECONCILIATION_MISSING_EXPECTED_CLAIM:c2'), JSON.stringify(shape.errors));
})();

(function testShapeInventedExtraClaim() {
  const output = { resolutions: [validResolution({ claim_id: 'c1' }), validResolution({ claim_id: 'c999-hallucinated' })] };
  const shape = validateReconciliationShape(output, ['c1']);
  check('SHAPE_INVENTED_CLAIM', 'invalid', !shape.valid);
  check('SHAPE_INVENTED_CLAIM', 'names the unexpected claim', shape.errors.includes('RECONCILIATION_UNEXPECTED_CLAIM:c999-hallucinated'), JSON.stringify(shape.errors));
})();

(function testShapeDuplicateClaim() {
  const output = { resolutions: [validResolution({ claim_id: 'c1' }), validResolution({ claim_id: 'c1' })] };
  const shape = validateReconciliationShape(output, ['c1']);
  check('SHAPE_DUPLICATE', 'invalid', !shape.valid);
  check('SHAPE_DUPLICATE', 'names the duplicate', shape.errors.includes('RECONCILIATION_DUPLICATE_CLAIM:c1'), JSON.stringify(shape.errors));
})();

(function testShapeSelectedWithoutRole() {
  const output = { resolutions: [validResolution({ claim_id: 'c1', disposition: 'SELECTED', role: null, reason_code: null })] };
  const shape = validateReconciliationShape(output, ['c1']);
  check('SHAPE_SELECTED_NO_ROLE', 'invalid', !shape.valid);
  check('SHAPE_SELECTED_NO_ROLE', 'names the rule', shape.errors.includes('SELECTED_REQUIRES_VALID_ROLE:c1'), JSON.stringify(shape.errors));
})();

(function testShapeExcludedWithoutReasonCode() {
  const output = { resolutions: [validResolution({ claim_id: 'c1', disposition: 'EXCLUDED', reason_code: null })] };
  const shape = validateReconciliationShape(output, ['c1']);
  check('SHAPE_EXCLUDED_NO_REASON', 'invalid', !shape.valid);
  check('SHAPE_EXCLUDED_NO_REASON', 'names the rule', shape.errors.includes('EXCLUDED_REQUIRES_VALID_REASON_CODE:c1'), JSON.stringify(shape.errors));
})();

(function testShapeMaterialChangeWithoutReason() {
  const output = { resolutions: [validResolution({ claim_id: 'c1', materially_changes_existing_synthesis: true, material_change_reason: null })] };
  const shape = validateReconciliationShape(output, ['c1']);
  check('SHAPE_MATERIAL_NO_REASON', 'invalid', !shape.valid);
  check('SHAPE_MATERIAL_NO_REASON', 'names the rule', shape.errors.includes('MATERIAL_CHANGE_REQUIRES_REASON:c1'), JSON.stringify(shape.errors));
})();

// ─────────────────────────────────────────────────────────────────────────
// determineReconciliationOutcome
// ─────────────────────────────────────────────────────────────────────────
(function testOutcomeAllNonMaterialIsSafeMerge() {
  const outcome = determineReconciliationOutcome([
    validResolution({ claim_id: 'c1', materially_changes_existing_synthesis: false }),
    validResolution({ claim_id: 'c2', materially_changes_existing_synthesis: false }),
  ]);
  check('OUTCOME_SAFE_MERGE', 'SAFE_MERGE', outcome === 'SAFE_MERGE', outcome);
})();

(function testOutcomeAnyMaterialIsFullRetry() {
  const outcome = determineReconciliationOutcome([
    validResolution({ claim_id: 'c1', materially_changes_existing_synthesis: false }),
    validResolution({ claim_id: 'c2', materially_changes_existing_synthesis: true, material_change_reason: 'Changes a core point.' }),
  ]);
  check('OUTCOME_FULL_RETRY', 'FULL_RETRY_REQUIRED', outcome === 'FULL_RETRY_REQUIRED', outcome);
})();

// ─────────────────────────────────────────────────────────────────────────
// mergeReconciliationIntoSynthesis
// ─────────────────────────────────────────────────────────────────────────
(function testMergePreservesFramingAndAddsClaims() {
  const original = {
    recommended_disposition: 'AUTO_READY',
    confidence: 'high',
    selected_claims: [{ claim_id: 'c1', role: 'core_finding', reason: 'ok' }],
    excluded_claims: [{ claim_id: 'c2', reason_code: 'OTHER', reason: 'ok' }],
    public_framing: { core_points: [{ statement: 'x', supporting_claim_ids: ['c1'] }], limitations: [], scope_note: 'n/a' },
  };
  const resolutions = [
    validResolution({ claim_id: 'c3', disposition: 'SELECTED', role: 'supporting_context', reason_code: null }),
    validResolution({ claim_id: 'c4', disposition: 'EXCLUDED' }),
  ];
  const merged = mergeReconciliationIntoSynthesis(original, resolutions);

  check('MERGE', 'selected_claims grew by one', merged.selected_claims.length === 2);
  check('MERGE', 'excluded_claims grew by one', merged.excluded_claims.length === 2);
  check('MERGE', 'new selected claim present with correct role', merged.selected_claims.some((c) => c.claim_id === 'c3' && c.role === 'supporting_context'));
  check('MERGE', 'new excluded claim present', merged.excluded_claims.some((c) => c.claim_id === 'c4'));
  check('MERGE', 'public_framing untouched (same reference-equal object)', merged.public_framing === original.public_framing);
  check('MERGE', 'original object not mutated', original.selected_claims.length === 1 && original.excluded_claims.length === 1);
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
