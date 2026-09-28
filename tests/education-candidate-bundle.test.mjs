// AIMT Education Operations v1 — deterministic tests for the durable
// candidate bundle contract (functions/_lib/education-ops/
// education-candidate-bundle.mjs). PURE (verifyCandidateBundleIntegrity
// is async only because it delegates to Web-Crypto hashing) -- no
// network, no real model call, no filesystem I/O anywhere in this file.
//
// Run: node tests/education-candidate-bundle.test.mjs

import {
  buildCandidateBundle, advanceCandidateBundle, validateCandidateBundleShape,
  verifyCandidateBundleIntegrity, resolveCandidateResumeFreshness, determineResumeStage,
  CANDIDATE_BUNDLE_CONTRACT_VERSION, RESUME_STAGE,
} from '../functions/_lib/education-ops/education-candidate-bundle.mjs';
import { prepareTopicArtifact } from '../functions/_lib/education-ops/education-synthesis-cache.mjs';
import { FRESHNESS_STATE } from '../functions/_lib/education-ops/education-freshness-monitor.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

// ── Fixtures: a REAL preparedArtifact, built the same way the real
//    orchestrator does (prepareTopicArtifact + a synthetic, zero-
//    network synthesizeFn) -- never a hand-typed guess at the shape,
//    so these tests exercise the same record verifyStoredClearanceIntegrity()
//    itself would receive in production. ───────────────────────────────

function baselineV1Result(overrides = {}) {
  return {
    topic_slug: 'x-topic',
    risk_tier: 'MODERATE',
    readiness_status: 'NEEDS_SYNTHESIS',
    metrics: { candidate_claim_count: 2, distinct_source_count: 2 },
    synthesis_packet: {
      controlled_topics: ['x-topic'],
      candidate_claim_ids: ['c1', 'c2'],
      candidate_source_ids: ['s1'],
      safety_claim_ids: [],
      synthesis_required_flags: [],
    },
    ...overrides,
  };
}

function baselineEvidenceRows() {
  return {
    claims: [
      { claim_id: 'c1', source_id: 's1', claim_type: 'finding', claim_text: 'A finding.', direction: 'descriptive', verification_status: 'CLAIM_VERIFIED', use_status: 'provisional', topics: ['x-topic'], population_or_scope: null, page_or_section_locator: null, claim_origin: 'primary_text' },
      { claim_id: 'c2', source_id: 's1', claim_type: 'limitation', claim_text: 'A limitation.', direction: 'descriptive', verification_status: 'CLAIM_VERIFIED', use_status: 'provisional', topics: ['x-topic'], population_or_scope: null, page_or_section_locator: null, claim_origin: 'primary_text' },
    ],
    sources: [
      { source_id: 's1', title: 'Source One', authors: ['A. Author'], year: 2023, doi: '10.1/one', evidence_type: 'systematic_review', source_role: 'primary' },
    ],
  };
}

function baselinePageIntent() {
  return { page_concept: 'X Topic Overview', public_intent: 'Explain x for practitioners.', in_scope_concepts: ['what x is'], out_of_scope_concepts: ['diagnosis of an individual case', 'treatment or medication protocols'] };
}

function autoReadyOutput() {
  return {
    topic_slug: 'x-topic', page_concept: 'X Topic Overview', recommended_disposition: 'AUTO_READY', confidence: 'high',
    page_scope: { include: ['x'], exclude: ['treatment'] },
    selected_claims: [{ claim_id: 'c1', role: 'core_finding', reason: 'ok' }, { claim_id: 'c2', role: 'limitation', reason: 'ok' }],
    excluded_claims: [],
    resolved_synthesis_signals: [], unresolved_issues: [],
    human_review_justification: { reason_code: 'NOT_APPLICABLE', reason: 'Not applicable', related_claim_ids: [] },
    public_framing: {
      core_points: [{ statement: 'A finding.', supporting_claim_ids: ['c1'] }],
      limitations: [{ statement: 'A limitation.', supporting_claim_ids: ['c2'] }],
      scope_note: 'Scope note.',
    },
  };
}

function mockSynthesizeFn(output) {
  return async () => ({
    status: 'AUTO_READY', stage: 'initial', reason: 'validated',
    finalOutput: output,
    metrics: { model_calls: 1, reconciliation_calls: 0, full_retries: 0, total_input_tokens: 500, total_output_tokens: 500, model_info: { provider: 'anthropic', modelName: 'claude-sonnet-5', status: 'CANDIDATE' } },
  });
}

async function buildRealPreparedArtifact() {
  const result = await prepareTopicArtifact({}, {
    topicSlug: 'x-topic', controlledTopic: 'x-topic', v1Result: baselineV1Result(),
    pageIntent: baselinePageIntent(), evidenceRows: baselineEvidenceRows(),
  }, { synthesizeFn: mockSynthesizeFn(autoReadyOutput()) });
  if (!result.ok) throw new Error(`Fixture setup failed: ${result.reason}`);
  return result.preparedArtifact;
}

function baselineBundleArgs(preparedArtifact) {
  return {
    runId: 'run-1', topicSlug: 'x-topic', cluster: 'hair-loss-shedding', route: '/education/hair-loss/x-topic',
    intentPlan: { topic_slug: 'x-topic', page_concept: 'X Topic Overview', public_intent: 'Explain x for practitioners.', route_slug: 'x-topic', practitioner_relevance: 'Relevant.', cluster: 'hair-loss-shedding', risk_context: 'MODERATE.', in_scope_concepts: ['what x is'], out_of_scope_concepts: ['diagnosis of an individual case', 'treatment or medication protocols'] },
    preparedArtifact,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// buildCandidateBundle / advanceCandidateBundle
// ─────────────────────────────────────────────────────────────────────────
async function testBuildCandidateBundleCopiesTheExactArtifactFields() {
  const preparedArtifact = await buildRealPreparedArtifact();
  const bundle = buildCandidateBundle(baselineBundleArgs(preparedArtifact));

  check('BUILD_BUNDLE', 'contract_version is set', bundle.contract_version === CANDIDATE_BUNDLE_CONTRACT_VERSION);
  check('BUILD_BUNDLE', 'originating_run_id is the given runId', bundle.originating_run_id === 'run-1');
  check('BUILD_BUNDLE', 'prepared_artifact is the EXACT same object, not rebuilt', bundle.prepared_artifact === preparedArtifact);
  check('BUILD_BUNDLE', 'generation_source_hash copied from the record', bundle.generation_source_hash === preparedArtifact.record.generation_source_hash);
  check('BUILD_BUNDLE', 'fingerprint_input copied from the record', JSON.stringify(bundle.fingerprint_input) === JSON.stringify(preparedArtifact.record.publication_clearance.fingerprint_input));
  check('BUILD_BUNDLE', 'selected_claim_ids copied from key_claim_ids', JSON.stringify(bundle.selected_claim_ids) === JSON.stringify(preparedArtifact.record.key_claim_ids));
  check('BUILD_BUNDLE', 'source_ids copied from the record', JSON.stringify(bundle.source_ids) === JSON.stringify(preparedArtifact.record.source_ids));
  check('BUILD_BUNDLE', 'freshness_basis.selected_claim_ids matches key_claim_ids', JSON.stringify(bundle.freshness_basis.selected_claim_ids) === JSON.stringify(preparedArtifact.record.key_claim_ids));
  check('BUILD_BUNDLE', 'page_plan/writer_validation/review_result default to null', bundle.page_plan === null && bundle.writer_validation === null && bundle.review_result === null);
}

async function testAdvanceCandidateBundlePreservesUntouchedFieldsAndNeverMutatesTheOriginal() {
  const preparedArtifact = await buildRealPreparedArtifact();
  const bundle = buildCandidateBundle(baselineBundleArgs(preparedArtifact));
  const before = JSON.stringify(bundle);

  const advanced = advanceCandidateBundle(bundle, { pagePlan: { some: 'plan' }, writerValidation: { valid: true } });
  check('ADVANCE_BUNDLE', 'original bundle object is never mutated', JSON.stringify(bundle) === before);
  check('ADVANCE_BUNDLE', 'advanced bundle is a different object', advanced !== bundle);
  check('ADVANCE_BUNDLE', 'page_plan is updated', JSON.stringify(advanced.page_plan) === JSON.stringify({ some: 'plan' }));
  check('ADVANCE_BUNDLE', 'writer_validation is updated', advanced.writer_validation.valid === true);
  check('ADVANCE_BUNDLE', 'originating_run_id/prepared_artifact/generation_source_hash are all UNCHANGED (never re-derived on advance)',
    advanced.originating_run_id === bundle.originating_run_id
    && advanced.prepared_artifact === bundle.prepared_artifact
    && advanced.generation_source_hash === bundle.generation_source_hash);

  const advancedAgain = advanceCandidateBundle(advanced, { reviewResult: { outcome: 'PASS' } });
  check('ADVANCE_BUNDLE', 'a second advance preserves the page_plan/writer_validation set by the first', JSON.stringify(advancedAgain.page_plan) === JSON.stringify({ some: 'plan' }) && advancedAgain.writer_validation.valid === true);
  check('ADVANCE_BUNDLE', 'a second advance sets review_result', advancedAgain.review_result.outcome === 'PASS');
}

// ─────────────────────────────────────────────────────────────────────────
// validateCandidateBundleShape
// ─────────────────────────────────────────────────────────────────────────
async function testValidBundlePassesShapeValidation() {
  const preparedArtifact = await buildRealPreparedArtifact();
  const bundle = buildCandidateBundle(baselineBundleArgs(preparedArtifact));
  const shape = validateCandidateBundleShape(bundle);
  check('SHAPE_VALID', 'passes', shape.valid, JSON.stringify(shape.violations));
}

function testNonObjectBundleFailsShapeValidation() {
  check('SHAPE_MALFORMED', 'null bundle', !validateCandidateBundleShape(null).valid);
  check('SHAPE_MALFORMED', 'string bundle', !validateCandidateBundleShape('not a bundle').valid);
  check('SHAPE_MALFORMED', 'empty object bundle names multiple missing fields', validateCandidateBundleShape({}).violations.length > 3);
}

async function testWrongContractVersionFailsShapeValidation() {
  const preparedArtifact = await buildRealPreparedArtifact();
  const bundle = buildCandidateBundle(baselineBundleArgs(preparedArtifact));
  bundle.contract_version = 'education-candidate-bundle-v999';
  const shape = validateCandidateBundleShape(bundle);
  check('SHAPE_WRONG_VERSION', 'rejected', !shape.valid);
  check('SHAPE_WRONG_VERSION', 'names the rule', shape.violations.includes('UNSUPPORTED_CONTRACT_VERSION'));
}

async function testHashMismatchWithPreparedArtifactFailsShapeValidation() {
  const preparedArtifact = await buildRealPreparedArtifact();
  const bundle = buildCandidateBundle(baselineBundleArgs(preparedArtifact));
  bundle.generation_source_hash = 'tampered-hash-value';
  const shape = validateCandidateBundleShape(bundle);
  check('SHAPE_HASH_DRIFT', 'rejected', !shape.valid);
  check('SHAPE_HASH_DRIFT', 'names the rule', shape.violations.includes('HASH_MISMATCH_WITH_PREPARED_ARTIFACT'));
}

async function testMissingPreparedArtifactFailsShapeValidation() {
  const preparedArtifact = await buildRealPreparedArtifact();
  const bundle = buildCandidateBundle(baselineBundleArgs(preparedArtifact));
  delete bundle.prepared_artifact;
  const shape = validateCandidateBundleShape(bundle);
  check('SHAPE_MISSING_ARTIFACT', 'rejected', !shape.valid);
  check('SHAPE_MISSING_ARTIFACT', 'names the rule', shape.violations.includes('MISSING_OR_INVALID:prepared_artifact'));
}

// ─────────────────────────────────────────────────────────────────────────
// verifyCandidateBundleIntegrity
// ─────────────────────────────────────────────────────────────────────────
async function testValidBundlePassesIntegrityVerification() {
  const preparedArtifact = await buildRealPreparedArtifact();
  const bundle = buildCandidateBundle(baselineBundleArgs(preparedArtifact));
  const integrity = await verifyCandidateBundleIntegrity(bundle);
  check('INTEGRITY_VALID', 'passes', integrity.valid, JSON.stringify(integrity.violations));
}

async function testMalformedBundleFailsIntegrityWithoutEverCallingTheHashVerifier() {
  let hashVerifierCalled = false;
  const integrity = await verifyCandidateBundleIntegrity({ not: 'a real bundle' }, {
    verifyStoredClearanceIntegrityFn: async () => { hashVerifierCalled = true; return { valid: true, violations: [] }; },
  });
  check('INTEGRITY_MALFORMED', 'rejected', !integrity.valid);
  check('INTEGRITY_MALFORMED', 'the hash verifier is never even reached for a shape failure', hashVerifierCalled === false);
}

async function testTamperedArtifactFailsIntegrityViaTheRealHashCheck() {
  const preparedArtifact = await buildRealPreparedArtifact();
  const bundle = buildCandidateBundle(baselineBundleArgs(preparedArtifact));
  // Tamper with the record's own hash AND the bundle's convenience copy
  // together (so shape validation's cross-check doesn't fire first) --
  // proving the REAL verifyStoredClearanceIntegrity() hash re-check is
  // what actually catches this, not just the shape cross-check.
  bundle.prepared_artifact.record.generation_source_hash = '0'.repeat(64);
  bundle.generation_source_hash = '0'.repeat(64);
  const integrity = await verifyCandidateBundleIntegrity(bundle);
  check('INTEGRITY_TAMPERED_ARTIFACT', 'rejected', !integrity.valid, JSON.stringify(integrity.violations));
}

async function testCorruptedIntentPlanFailsIntegrityEvenWithAValidArtifact() {
  const preparedArtifact = await buildRealPreparedArtifact();
  const bundle = buildCandidateBundle(baselineBundleArgs(preparedArtifact));
  // A stored intent plan whose out_of_scope_concepts drop the mandatory
  // diagnosis/treatment exclusions -- must fail the SAME deterministic
  // check a freshly-planned intent would have to pass.
  bundle.intent_plan = { ...bundle.intent_plan, out_of_scope_concepts: ['something unrelated'] };
  const integrity = await verifyCandidateBundleIntegrity(bundle);
  check('INTEGRITY_CORRUPT_INTENT', 'rejected even though the prepared_artifact itself is untouched', !integrity.valid);
  check('INTEGRITY_CORRUPT_INTENT', 'names the stored-intent-plan rule', integrity.violations.some((v) => v.startsWith('STORED_INTENT_PLAN_INVALID')), JSON.stringify(integrity.violations));
}

// ─────────────────────────────────────────────────────────────────────────
// resolveCandidateResumeFreshness
// ─────────────────────────────────────────────────────────────────────────
async function testUnchangedCandidateClaimSetIsFresh() {
  const preparedArtifact = await buildRealPreparedArtifact();
  const bundle = buildCandidateBundle(baselineBundleArgs(preparedArtifact));
  // The exact claim set considered at clearance: selected (c1) + excluded (none here) == candidate pool (c1, c2 minus limitation c2 which was SELECTED as a limitation, not excluded -- key_claim_ids already includes both c1 and c2 per autoReadyOutput's selected_claims).
  const freshness = resolveCandidateResumeFreshness(bundle, ['c1', 'c2']);
  check('FRESHNESS_FRESH', 'state is FRESH when the current candidate set exactly matches what was considered', freshness.state === FRESHNESS_STATE.FRESH, JSON.stringify(freshness));
}

async function testNewCandidateClaimIsPotentialEvidenceChange() {
  const preparedArtifact = await buildRealPreparedArtifact();
  const bundle = buildCandidateBundle(baselineBundleArgs(preparedArtifact));
  const freshness = resolveCandidateResumeFreshness(bundle, ['c1', 'c2', 'c3-brand-new']);
  check('FRESHNESS_CHANGED', 'state is POTENTIAL_EVIDENCE_CHANGE', freshness.state === FRESHNESS_STATE.POTENTIAL_EVIDENCE_CHANGE, JSON.stringify(freshness));
  check('FRESHNESS_CHANGED', 'names the new claim id', freshness.new_claim_ids.includes('c3-brand-new'));
}

async function testRemovedCandidateClaimIsAlsoPotentialEvidenceChange() {
  const preparedArtifact = await buildRealPreparedArtifact();
  const bundle = buildCandidateBundle(baselineBundleArgs(preparedArtifact));
  const freshness = resolveCandidateResumeFreshness(bundle, ['c1']); // c2 no longer in the current pool
  check('FRESHNESS_REMOVED', 'state is POTENTIAL_EVIDENCE_CHANGE', freshness.state === FRESHNESS_STATE.POTENTIAL_EVIDENCE_CHANGE);
  check('FRESHNESS_REMOVED', 'names the removed claim id', freshness.removed_claim_ids.includes('c2'));
}

async function testNonArrayCurrentClaimIdsFailsClosedAsFreshnessCheckFailed() {
  const preparedArtifact = await buildRealPreparedArtifact();
  const bundle = buildCandidateBundle(baselineBundleArgs(preparedArtifact));
  const freshness = resolveCandidateResumeFreshness(bundle, undefined);
  check('FRESHNESS_CHECK_FAILED_BAD_INPUT', 'fails closed', freshness.state === FRESHNESS_STATE.FRESHNESS_CHECK_FAILED);
  check('FRESHNESS_CHECK_FAILED_BAD_INPUT', 'never claims FRESH or POTENTIAL_EVIDENCE_CHANGE on unusable input', freshness.state !== FRESHNESS_STATE.FRESH && freshness.state !== FRESHNESS_STATE.POTENTIAL_EVIDENCE_CHANGE);
}

function testMalformedFreshnessBasisFailsClosed() {
  const freshness = resolveCandidateResumeFreshness({ freshness_basis: { selected_claim_ids: 'not-an-array', excluded_claim_ids: [] } }, ['c1']);
  check('FRESHNESS_CHECK_FAILED_BAD_BUNDLE', 'fails closed for a malformed freshness_basis', freshness.state === FRESHNESS_STATE.FRESHNESS_CHECK_FAILED);
}

// ─────────────────────────────────────────────────────────────────────────
// determineResumeStage
// ─────────────────────────────────────────────────────────────────────────
function testDetermineResumeStage() {
  check('RESUME_STAGE', 'no writer_validation at all -> NEEDS_WRITER', determineResumeStage({ writer_validation: null, page_plan: null, review_result: null }) === RESUME_STAGE.NEEDS_WRITER);
  check('RESUME_STAGE', 'writer_validation.valid=false -> NEEDS_WRITER (never treats a persisted FAILURE as resumable at Reviewer)', determineResumeStage({ writer_validation: { valid: false }, page_plan: null, review_result: null }) === RESUME_STAGE.NEEDS_WRITER);
  check('RESUME_STAGE', 'valid writer_validation but no page_plan -> NEEDS_WRITER (defensive: page_plan is the authority)', determineResumeStage({ writer_validation: { valid: true }, page_plan: null, review_result: null }) === RESUME_STAGE.NEEDS_WRITER);
  check('RESUME_STAGE', 'valid writer stage, no review_result -> NEEDS_REVIEWER', determineResumeStage({ writer_validation: { valid: true }, page_plan: { some: 'plan' }, review_result: null }) === RESUME_STAGE.NEEDS_REVIEWER);
  check('RESUME_STAGE', 'review_result.outcome=PASS -> READY_FOR_PREPARE', determineResumeStage({ writer_validation: { valid: true }, page_plan: { some: 'plan' }, review_result: { outcome: 'PASS' } }) === RESUME_STAGE.READY_FOR_PREPARE);
  check('RESUME_STAGE', 'review_result.outcome=SUBSTANTIVE_FAIL -> EDITORIAL_REVIEW', determineResumeStage({ writer_validation: { valid: true }, page_plan: { some: 'plan' }, review_result: { outcome: 'SUBSTANTIVE_FAIL' } }) === RESUME_STAGE.EDITORIAL_REVIEW);
}

const tests = [
  testBuildCandidateBundleCopiesTheExactArtifactFields,
  testAdvanceCandidateBundlePreservesUntouchedFieldsAndNeverMutatesTheOriginal,
  testValidBundlePassesShapeValidation,
  testNonObjectBundleFailsShapeValidation,
  testWrongContractVersionFailsShapeValidation,
  testHashMismatchWithPreparedArtifactFailsShapeValidation,
  testMissingPreparedArtifactFailsShapeValidation,
  testValidBundlePassesIntegrityVerification,
  testMalformedBundleFailsIntegrityWithoutEverCallingTheHashVerifier,
  testTamperedArtifactFailsIntegrityViaTheRealHashCheck,
  testCorruptedIntentPlanFailsIntegrityEvenWithAValidArtifact,
  testUnchangedCandidateClaimSetIsFresh,
  testNewCandidateClaimIsPotentialEvidenceChange,
  testRemovedCandidateClaimIsAlsoPotentialEvidenceChange,
  testNonArrayCurrentClaimIdsFailsClosedAsFreshnessCheckFailed,
  testMalformedFreshnessBasisFailsClosed,
  testDetermineResumeStage,
];

for (const t of tests) await t();

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
