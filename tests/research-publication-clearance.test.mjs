// AIMT Automated Publication Clearance — deterministic unit tests.
// NO LIVE/MODEL/DATABASE CALLS: every fixture is synthetic; the
// fingerprint uses Web Crypto locally (no network); the writer's network
// call is never exercised here -- only its pure guard
// (assertWritableClearanceRecord); the DB CHECK constraints are exercised
// via their pure JS mirror (publication-clearance-invariants.mjs), not a
// live Postgres connection.
//
// Run: node tests/research-publication-clearance.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  buildAutoReadyClearanceRecord,
  ClearanceIneligibleError,
  FORBIDDEN_CLEARANCE_FIELDS,
  CLEARANCE_MODES,
} from '../functions/_lib/research/publication-clearance.mjs';
import {
  computeEvidenceFingerprint,
  isClearanceStale,
  FINGERPRINT_ALGORITHM,
} from '../functions/_lib/research/publication-clearance-fingerprint.mjs';
import { ALLOWED_COLUMNS, assertWritableClearanceRecord } from '../functions/_lib/research/publication-clearance-writer.mjs';
import { validatePageInvariants } from '../functions/_lib/research/publication-clearance-invariants.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const TOPIC = 'hair-cycle';

function baselineBrief(overrides = {}) {
  return {
    page_concept: 'The Hair Growth Cycle',
    public_intent: 'Explain the normal hair-growth cycle.',
    approved_for_draft_claim_ids: ['c1', 'c2'],
    excluded_claim_ids: [{ claim_id: 'c3', reason_code: 'OUT_OF_SCOPE_TREATMENT_OR_INTERVENTION', reason: 'unrelated' }],
    source_ids: ['s1', 's2'],
    core_factual_points: [{ statement: 'Follicles cycle through anagen, catagen, telogen.', supporting_claim_ids: ['c1'] }],
    limitations: [{ statement: 'Timing varies by individual.', supporting_claim_ids: ['c2'] }],
    scope_language: { page_scope: { include: ['cycling'], exclude: ['treatment'] }, scope_note: 'Excludes treatment efficacy.' },
    citation_map: { s1: { title: 'Ref One', doi: '10.1/one' }, s2: { title: 'Ref Two', doi: '10.1/two' } },
    review_timestamp: '2026-09-23T00:00:00.000Z',
    risk_tier: 'LOWER',
    provenance: {
      v1_engine_version: 'publication-readiness-v1',
      synthesis_model: { provider: 'anthropic', model_name: 'claude-sonnet-5', status: 'CANDIDATE', registry_version: 'publication-editor-model-registry-v1' },
      validator_version: 'publication-synthesis-validator-v1',
    },
    ...overrides,
  };
}

function baselineV1Result(overrides = {}) {
  return {
    risk_tier: 'LOWER',
    metrics: { candidate_claim_count: 3, distinct_source_count: 2 },
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Valid AUTO_READY brief can produce a clearance record
// ─────────────────────────────────────────────────────────────────────────
async function testValidAutoReadyProducesRecord() {
  const brief = baselineBrief();
  const v1Result = baselineV1Result();
  const fingerprint = await computeEvidenceFingerprint(TOPIC, brief);
  const record = buildAutoReadyClearanceRecord({
    topicSlug: TOPIC, controlledTopic: TOPIC, v1Result,
    pipelineStatus: 'AUTO_READY', pageEvidenceBrief: brief, fingerprint,
  });
  check('VALID_AUTO_READY', 'record built', !!record);
  check('VALID_AUTO_READY', 'clearance_mode is AUTO_READY', record.clearance_mode === 'AUTO_READY', record.clearance_mode);
  check('VALID_AUTO_READY', 'status is ready_for_page_builder', record.status === 'ready_for_page_builder', record.status);
  check('VALID_AUTO_READY', 'generation_source_hash set to the fingerprint', record.generation_source_hash === fingerprint);
  check('VALID_AUTO_READY', 'key_claim_ids matches selected claims', JSON.stringify(record.key_claim_ids) === JSON.stringify(['c1', 'c2']));
  check('VALID_AUTO_READY', 'CLEARANCE_MODES includes AUTO_READY', CLEARANCE_MODES.includes('AUTO_READY'));
  check('VALID_AUTO_READY', 'fingerprint_algorithm recorded is the current v2 algorithm', record.publication_clearance.fingerprint_algorithm === FINGERPRINT_ALGORITHM && FINGERPRINT_ALGORITHM === 'sha256-canonical-json-v2', FINGERPRINT_ALGORITHM);
  check('VALID_AUTO_READY', 'DB invariant mirror accepts this record', validatePageInvariants(record).valid, JSON.stringify(validatePageInvariants(record)));
}

// ─────────────────────────────────────────────────────────────────────────
// HUMAN_REVIEW / SYNTHESIS_FAILED / HIGH-risk cannot produce a record
// ─────────────────────────────────────────────────────────────────────────
async function testHumanReviewCannotClear() {
  const brief = baselineBrief();
  const fingerprint = await computeEvidenceFingerprint(TOPIC, brief);
  let threw = false;
  try {
    buildAutoReadyClearanceRecord({ topicSlug: TOPIC, v1Result: baselineV1Result(), pipelineStatus: 'HUMAN_REVIEW', pageEvidenceBrief: brief, fingerprint });
  } catch (e) {
    threw = e instanceof ClearanceIneligibleError;
  }
  check('HUMAN_REVIEW_CANNOT_CLEAR', 'throws ClearanceIneligibleError', threw);
}

async function testSynthesisFailedCannotClear() {
  const brief = baselineBrief();
  const fingerprint = await computeEvidenceFingerprint(TOPIC, brief);
  let threw = false;
  try {
    buildAutoReadyClearanceRecord({ topicSlug: TOPIC, v1Result: baselineV1Result(), pipelineStatus: 'SYNTHESIS_FAILED', pageEvidenceBrief: brief, fingerprint });
  } catch (e) {
    threw = e instanceof ClearanceIneligibleError;
  }
  check('SYNTHESIS_FAILED_CANNOT_CLEAR', 'throws ClearanceIneligibleError', threw);
}

async function testHighRiskCannotClear() {
  const brief = baselineBrief({ risk_tier: 'HIGH' });
  const fingerprint = await computeEvidenceFingerprint('contraindications', brief);
  let threw = false;
  try {
    buildAutoReadyClearanceRecord({ topicSlug: 'contraindications', v1Result: baselineV1Result({ risk_tier: 'HIGH' }), pipelineStatus: 'AUTO_READY', pageEvidenceBrief: brief, fingerprint });
  } catch (e) {
    threw = e instanceof ClearanceIneligibleError;
  }
  check('HIGH_RISK_CANNOT_CLEAR', 'throws ClearanceIneligibleError even though pipelineStatus says AUTO_READY', threw);
}

// ─────────────────────────────────────────────────────────────────────────
// Fingerprint determinism and sensitivity (evidence categories)
// ─────────────────────────────────────────────────────────────────────────
async function testFingerprintDeterministic() {
  const brief = baselineBrief();
  const fp1 = await computeEvidenceFingerprint(TOPIC, brief);
  const fp2 = await computeEvidenceFingerprint(TOPIC, brief);
  check('FINGERPRINT_DETERMINISTIC', 'same input produces same fingerprint', fp1 === fp2, `${fp1} vs ${fp2}`);
}

async function testFingerprintChangesWithClaimSet() {
  const fp1 = await computeEvidenceFingerprint(TOPIC, baselineBrief());
  const fp2 = await computeEvidenceFingerprint(TOPIC, baselineBrief({ approved_for_draft_claim_ids: ['c1', 'c2', 'c4'] }));
  check('FINGERPRINT_CLAIM_SET_CHANGE', 'differs when selected claim set changes', fp1 !== fp2);
}

async function testFingerprintChangesWithCorePoint() {
  const fp1 = await computeEvidenceFingerprint(TOPIC, baselineBrief());
  const fp2 = await computeEvidenceFingerprint(TOPIC, baselineBrief({
    core_factual_points: [{ statement: 'A different statement entirely.', supporting_claim_ids: ['c1'] }],
  }));
  check('FINGERPRINT_CORE_POINT_CHANGE', 'differs when a core factual point changes', fp1 !== fp2);
}

async function testFingerprintChangesWithLimitation() {
  const fp1 = await computeEvidenceFingerprint(TOPIC, baselineBrief());
  const fp2 = await computeEvidenceFingerprint(TOPIC, baselineBrief({
    limitations: [{ statement: 'A different limitation.', supporting_claim_ids: ['c2'] }],
  }));
  check('FINGERPRINT_LIMITATION_CHANGE', 'differs when a limitation changes', fp1 !== fp2);
}

async function testFingerprintChangesWithCitationMap() {
  const fp1 = await computeEvidenceFingerprint(TOPIC, baselineBrief());
  const fp2 = await computeEvidenceFingerprint(TOPIC, baselineBrief({
    citation_map: { s1: { title: 'Ref One (corrected title)', doi: '10.1/one' }, s2: { title: 'Ref Two', doi: '10.1/two' } },
  }));
  check('FINGERPRINT_CITATION_MAP_CHANGE', 'differs when citation metadata changes', fp1 !== fp2);
}

async function testFingerprintChangesWithRiskTier() {
  const fp1 = await computeEvidenceFingerprint(TOPIC, baselineBrief({ risk_tier: 'LOWER' }));
  const fp2 = await computeEvidenceFingerprint(TOPIC, baselineBrief({ risk_tier: 'MODERATE' }));
  check('FINGERPRINT_RISK_TIER_CHANGE', 'differs when risk_tier changes', fp1 !== fp2);
}

async function testFingerprintChangesWithSourceSet() {
  const fp1 = await computeEvidenceFingerprint(TOPIC, baselineBrief());
  const fp2 = await computeEvidenceFingerprint(TOPIC, baselineBrief({ source_ids: ['s1', 's2', 's3'] }));
  check('FINGERPRINT_SOURCE_SET_CHANGE', 'differs when source set changes', fp1 !== fp2);
}

// ─────────────────────────────────────────────────────────────────────────
// Fingerprint sensitivity to PAGE INTENT (v2 addition)
// ─────────────────────────────────────────────────────────────────────────
async function testFingerprintChangesWithTopicSlug() {
  const brief = baselineBrief();
  const fp1 = await computeEvidenceFingerprint('hair-cycle', brief);
  const fp2 = await computeEvidenceFingerprint('a-different-topic-slug', brief);
  check('FINGERPRINT_TOPIC_SLUG_CHANGE', 'differs when topic_slug changes (same brief content)', fp1 !== fp2);
}

async function testFingerprintChangesWithPageConcept() {
  const fp1 = await computeEvidenceFingerprint(TOPIC, baselineBrief());
  const fp2 = await computeEvidenceFingerprint(TOPIC, baselineBrief({ page_concept: 'A Completely Different Page Concept' }));
  check('FINGERPRINT_PAGE_CONCEPT_CHANGE', 'differs when page_concept changes', fp1 !== fp2);
}

async function testFingerprintChangesWithPublicIntent() {
  const fp1 = await computeEvidenceFingerprint(TOPIC, baselineBrief());
  const fp2 = await computeEvidenceFingerprint(TOPIC, baselineBrief({ public_intent: 'A completely different stated public intent.' }));
  check('FINGERPRINT_PUBLIC_INTENT_CHANGE', 'differs when public_intent changes', fp1 !== fp2);
}

async function testFingerprintChangesWithScopeLanguage() {
  const fp1 = await computeEvidenceFingerprint(TOPIC, baselineBrief());
  const fp2 = await computeEvidenceFingerprint(TOPIC, baselineBrief({
    scope_language: { page_scope: { include: ['cycling', 'shedding timing'], exclude: ['treatment'] }, scope_note: 'A materially different scope note.' },
  }));
  check('FINGERPRINT_SCOPE_LANGUAGE_CHANGE', 'differs when scope language changes', fp1 !== fp2);
}

// ─────────────────────────────────────────────────────────────────────────
// Irrelevant/reordered fields do NOT change the fingerprint (page intent
// held CONSTANT here -- it is now material; only genuinely irrelevant
// fields and key/array order vary)
// ─────────────────────────────────────────────────────────────────────────
async function testFingerprintIgnoresIrrelevantAndReorderedFields() {
  const brief1 = baselineBrief();
  const brief2 = baselineBrief({
    approved_for_draft_claim_ids: ['c2', 'c1'],
    citation_map: { s2: { doi: '10.1/two', title: 'Ref Two' }, s1: { doi: '10.1/one', title: 'Ref One' } },
    review_timestamp: '2099-01-01T00:00:00.000Z',
    provenance: { v1_engine_version: 'some-other-version', synthesis_model: { provider: 'anthropic', model_name: 'claude-haiku-4-5-20251001' }, validator_version: 'v99' },
  });
  const fp1 = await computeEvidenceFingerprint(TOPIC, brief1);
  const fp2 = await computeEvidenceFingerprint(TOPIC, brief2);
  check('FINGERPRINT_IGNORES_IRRELEVANT', 'identical fingerprint despite reordering + irrelevant-field changes', fp1 === fp2, `${fp1} vs ${fp2}`);
}

// ─────────────────────────────────────────────────────────────────────────
// Stale fingerprint fails validation (isClearanceStale)
// ─────────────────────────────────────────────────────────────────────────
async function testStaleFingerprintDetected() {
  const original = baselineBrief();
  const storedFingerprint = await computeEvidenceFingerprint(TOPIC, original);
  const changed = baselineBrief({ approved_for_draft_claim_ids: ['c1', 'c2', 'c5'] });
  const result = await isClearanceStale(TOPIC, changed, storedFingerprint);
  check('STALE_FINGERPRINT', 'detected as stale', result.stale === true, JSON.stringify(result));
}

async function testFreshFingerprintNotStale() {
  const brief = baselineBrief();
  const storedFingerprint = await computeEvidenceFingerprint(TOPIC, brief);
  const result = await isClearanceStale(TOPIC, brief, storedFingerprint);
  check('FRESH_FINGERPRINT', 'not stale when unchanged', result.stale === false);
}

// ─────────────────────────────────────────────────────────────────────────
// Cannot set AIMT_APPROVED / claim public_eligible / published / sitemap
// ─────────────────────────────────────────────────────────────────────────
async function testCannotIntroduceForbiddenFields() {
  const brief = baselineBrief();
  const fingerprint = await computeEvidenceFingerprint(TOPIC, brief);
  const record = buildAutoReadyClearanceRecord({
    topicSlug: TOPIC, v1Result: baselineV1Result(), pipelineStatus: 'AUTO_READY', pageEvidenceBrief: brief, fingerprint,
  });
  const allKeys = [...Object.keys(record), ...Object.keys(record.publication_clearance)];
  for (const forbidden of FORBIDDEN_CLEARANCE_FIELDS) {
    check('NO_FORBIDDEN_FIELDS', `record never contains "${forbidden}"`, !allKeys.includes(forbidden));
  }
  check('NO_FORBIDDEN_FIELDS', 'FORBIDDEN_CLEARANCE_FIELDS includes AIMT_APPROVED-adjacent fields', FORBIDDEN_CLEARANCE_FIELDS.includes('AIMT_APPROVED') && FORBIDDEN_CLEARANCE_FIELDS.includes('public_eligible') && FORBIDDEN_CLEARANCE_FIELDS.includes('published'));
}

async function testWriterRefusesForbiddenColumns() {
  const brief = baselineBrief();
  const fingerprint = await computeEvidenceFingerprint(TOPIC, brief);
  const record = buildAutoReadyClearanceRecord({
    topicSlug: TOPIC, v1Result: baselineV1Result(), pipelineStatus: 'AUTO_READY', pageEvidenceBrief: brief, fingerprint,
  });
  // A caller (or a future bug) tries to sneak a forbidden column in.
  const tampered = { ...record, published: true, public_eligible: true, AIMT_APPROVED: true };
  let threw = false;
  try {
    assertWritableClearanceRecord(tampered);
  } catch (e) {
    threw = true;
  }
  check('WRITER_REFUSES_FORBIDDEN', 'assertWritableClearanceRecord throws on published/public_eligible/AIMT_APPROVED', threw);
  check('WRITER_REFUSES_FORBIDDEN', 'ALLOWED_COLUMNS does not include published', !ALLOWED_COLUMNS.includes('published'));
  check('WRITER_REFUSES_FORBIDDEN', 'ALLOWED_COLUMNS does not include sitemap_eligible', !ALLOWED_COLUMNS.includes('sitemap_eligible'));
  check('WRITER_REFUSES_FORBIDDEN', 'ALLOWED_COLUMNS does not include published_at', !ALLOWED_COLUMNS.includes('published_at'));
}

// ─────────────────────────────────────────────────────────────────────────
// Structural: no code path in this feature can reach research_claims/
// research_sources, or reference AIMT_APPROVED/public_eligible as an
// assignment target, at all (items 15-16).
// ─────────────────────────────────────────────────────────────────────────
function readSrc(relPath) {
  return readFileSync(fileURLToPath(new URL(`../${relPath}`, import.meta.url)), 'utf8');
}

/** Strips /* *\/ block comments and // line comments so structural checks
    below test actual CODE, not the (extensive, intentional) governance
    documentation explaining what each file deliberately does NOT do --
    which legitimately names research_claims/AIMT_APPROVED/public_eligible
    in prose without that being a real reference. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

async function testNoCodePathTouchesClaimTables() {
  const files = [
    'functions/_lib/research/publication-clearance.mjs',
    'functions/_lib/research/publication-clearance-writer.mjs',
    'functions/_lib/research/publication-clearance-fingerprint.mjs',
    'functions/_lib/research/publication-clearance-invariants.mjs',
  ];
  for (const f of files) {
    const code = stripComments(readSrc(f));
    check('NO_CLAIM_TABLE_ACCESS', `${f} never references research_claims in code (comments may explain the absence)`, !/research_claims/.test(code));
    check('NO_CLAIM_TABLE_ACCESS', `${f} never references the research_sources table endpoint in code`, !/rest\/v1\/research_sources/.test(code));
    // AIMT_APPROVED may appear as a bare forbidden-field-name STRING (a
    // thing this code refuses to write), but never as something actually
    // assigned to clearance_mode or any other key.
    check('NO_CLAIM_TABLE_ACCESS', `${f} never assigns clearance_mode = 'AIMT_APPROVED'`, !/clearance_mode\s*[:=]\s*['"]AIMT_APPROVED['"]/.test(code));
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Cannot mark the public page published in this bridge step
// ─────────────────────────────────────────────────────────────────────────
async function testCannotMarkPublished() {
  const brief = baselineBrief();
  const fingerprint = await computeEvidenceFingerprint(TOPIC, brief);
  const record = buildAutoReadyClearanceRecord({
    topicSlug: TOPIC, v1Result: baselineV1Result(), pipelineStatus: 'AUTO_READY', pageEvidenceBrief: brief, fingerprint,
  });
  check('CANNOT_PUBLISH', 'status is never "published"', record.status !== 'published', record.status);
  check('CANNOT_PUBLISH', 'status is always "ready_for_page_builder" for an AUTO_READY clearance', record.status === 'ready_for_page_builder');

  let threw = false;
  try {
    assertWritableClearanceRecord({ ...record, status: 'published' });
  } catch (e) {
    threw = true;
  }
  check('CANNOT_PUBLISH', 'writer refuses a tampered status="published" record', threw);
}

// ─────────────────────────────────────────────────────────────────────────
// DB invariants (pure JS mirror of the migration's CHECK constraints) --
// items 1-10 from the originating request's test list.
// ─────────────────────────────────────────────────────────────────────────
function invariantRow(overrides = {}) {
  return {
    status: 'ready_for_page_builder',
    clearance_mode: 'AUTO_READY',
    generation_source_hash: 'deadbeef',
    key_claim_ids: ['c1'],
    source_ids: ['s1'],
    publication_clearance: { fingerprint_algorithm: 'sha256-canonical-json-v2', risk_tier: 'LOWER' },
    ...overrides,
  };
}

async function testInvariantReadyAutoReadyValid() {
  const result = validatePageInvariants(invariantRow());
  check('INVARIANT_READY_VALID', 'ready_for_page_builder + AUTO_READY + valid fields is allowed', result.valid, JSON.stringify(result));
}

async function testInvariantReadyNullClearanceRejected() {
  const result = validatePageInvariants(invariantRow({ clearance_mode: null }));
  check('INVARIANT_READY_NULL_CLEARANCE', 'ready_for_page_builder + NULL clearance_mode is rejected', !result.valid);
  check('INVARIANT_READY_NULL_CLEARANCE', 'names the exact constraint', result.violations.includes('research_public_pages_ready_requires_clearance:clearance_mode'), JSON.stringify(result.violations));
}

async function testInvariantReadyHumanReviewRequiredRejected() {
  const result = validatePageInvariants(invariantRow({ clearance_mode: 'HUMAN_REVIEW_REQUIRED' }));
  check('INVARIANT_READY_HUMAN_REVIEW_REQUIRED', 'ready_for_page_builder + HUMAN_REVIEW_REQUIRED is rejected', !result.valid);
  check('INVARIANT_READY_HUMAN_REVIEW_REQUIRED', 'trips both the clearance-mode and review-required constraints', result.violations.includes('research_public_pages_ready_requires_clearance:clearance_mode') && result.violations.includes('research_public_pages_review_required_not_ready'), JSON.stringify(result.violations));
}

async function testInvariantReadyEmptyKeyClaimIdsRejected() {
  const result = validatePageInvariants(invariantRow({ key_claim_ids: [] }));
  check('INVARIANT_READY_EMPTY_CLAIMS', 'ready_for_page_builder with empty key_claim_ids is rejected', !result.valid);
  check('INVARIANT_READY_EMPTY_CLAIMS', 'names the exact constraint', result.violations.includes('research_public_pages_ready_requires_clearance:key_claim_ids'), JSON.stringify(result.violations));
}

async function testInvariantReadyEmptySourceIdsRejected() {
  const result = validatePageInvariants(invariantRow({ source_ids: [] }));
  check('INVARIANT_READY_EMPTY_SOURCES', 'ready_for_page_builder with empty source_ids is rejected', !result.valid);
  check('INVARIANT_READY_EMPTY_SOURCES', 'names the exact constraint', result.violations.includes('research_public_pages_ready_requires_clearance:source_ids'), JSON.stringify(result.violations));
}

async function testInvariantReadyMissingHashRejected() {
  const resultNull = validatePageInvariants(invariantRow({ generation_source_hash: null }));
  const resultEmpty = validatePageInvariants(invariantRow({ generation_source_hash: '' }));
  check('INVARIANT_READY_NO_HASH', 'ready_for_page_builder without generation_source_hash (null) is rejected', !resultNull.valid);
  check('INVARIANT_READY_NO_HASH', 'ready_for_page_builder with empty-string generation_source_hash is rejected', !resultEmpty.valid);
}

// ─────────────────────────────────────────────────────────────────────────
// Hardened this revision: a "complete" clearance also requires a real,
// non-empty publication_clearance provenance object -- for BOTH
// ready_for_page_builder and published. Items 1, 3-6 from the originating
// request's new test list.
// ─────────────────────────────────────────────────────────────────────────
async function testInvariantReadyEmptyPublicationClearanceRejected() {
  const resultEmptyObject = validatePageInvariants(invariantRow({ publication_clearance: {} }));
  const resultNull = validatePageInvariants(invariantRow({ publication_clearance: null }));
  check('INVARIANT_READY_EMPTY_CLEARANCE_PAYLOAD', 'ready_for_page_builder with publication_clearance = {} is rejected', !resultEmptyObject.valid, JSON.stringify(resultEmptyObject));
  check('INVARIANT_READY_EMPTY_CLEARANCE_PAYLOAD', 'names the exact constraint', resultEmptyObject.violations.includes('research_public_pages_ready_requires_clearance:publication_clearance'), JSON.stringify(resultEmptyObject.violations));
  check('INVARIANT_READY_EMPTY_CLEARANCE_PAYLOAD', 'ready_for_page_builder with publication_clearance = null is rejected', !resultNull.valid, JSON.stringify(resultNull));
}

async function testInvariantPublishedAutoReadyAllowed() {
  const result = validatePageInvariants(invariantRow({ status: 'published', clearance_mode: 'AUTO_READY' }));
  check('INVARIANT_PUBLISHED_AUTO_READY', 'published + AUTO_READY + hash + claims + sources + real publication_clearance is structurally allowed (not actually published anywhere in this PR)', result.valid, JSON.stringify(result));
}

async function testInvariantPublishedHumanApprovedAllowed() {
  const result = validatePageInvariants(invariantRow({ status: 'published', clearance_mode: 'HUMAN_APPROVED' }));
  check('INVARIANT_PUBLISHED_HUMAN_APPROVED', 'published + HUMAN_APPROVED + a complete clearance payload is structurally allowed', result.valid, JSON.stringify(result));
}

async function testInvariantPublishedMissingHashRejected() {
  const result = validatePageInvariants(invariantRow({ status: 'published', clearance_mode: 'AUTO_READY', generation_source_hash: null }));
  check('INVARIANT_PUBLISHED_NO_HASH', 'published + AUTO_READY but missing generation_source_hash is rejected', !result.valid);
  check('INVARIANT_PUBLISHED_NO_HASH', 'names the exact constraint', result.violations.includes('research_public_pages_published_requires_clearance:generation_source_hash'), JSON.stringify(result.violations));
}

async function testInvariantPublishedEmptyKeyClaimIdsRejected() {
  const result = validatePageInvariants(invariantRow({ status: 'published', clearance_mode: 'AUTO_READY', key_claim_ids: [] }));
  check('INVARIANT_PUBLISHED_EMPTY_CLAIMS', 'published + AUTO_READY but empty key_claim_ids is rejected', !result.valid);
  check('INVARIANT_PUBLISHED_EMPTY_CLAIMS', 'names the exact constraint', result.violations.includes('research_public_pages_published_requires_clearance:key_claim_ids'), JSON.stringify(result.violations));
}

async function testInvariantPublishedEmptySourceIdsRejected() {
  const result = validatePageInvariants(invariantRow({ status: 'published', clearance_mode: 'AUTO_READY', source_ids: [] }));
  check('INVARIANT_PUBLISHED_EMPTY_SOURCES', 'published + AUTO_READY but empty source_ids is rejected', !result.valid);
  check('INVARIANT_PUBLISHED_EMPTY_SOURCES', 'names the exact constraint', result.violations.includes('research_public_pages_published_requires_clearance:source_ids'), JSON.stringify(result.violations));
}

async function testInvariantPublishedEmptyPublicationClearanceRejected() {
  const result = validatePageInvariants(invariantRow({ status: 'published', clearance_mode: 'AUTO_READY', publication_clearance: {} }));
  check('INVARIANT_PUBLISHED_EMPTY_CLEARANCE_PAYLOAD', 'published + AUTO_READY but publication_clearance = {} is rejected', !result.valid, JSON.stringify(result));
  check('INVARIANT_PUBLISHED_EMPTY_CLEARANCE_PAYLOAD', 'names the exact constraint', result.violations.includes('research_public_pages_published_requires_clearance:publication_clearance'), JSON.stringify(result.violations));
}

async function testInvariantPublishedNullClearanceRejected() {
  const result = validatePageInvariants(invariantRow({ status: 'published', clearance_mode: null }));
  check('INVARIANT_PUBLISHED_NULL', 'published + NULL clearance is rejected', !result.valid);
  check('INVARIANT_PUBLISHED_NULL', 'names the exact constraint', result.violations.includes('research_public_pages_published_requires_clearance:clearance_mode'), JSON.stringify(result.violations));
}

async function testInvariantPublishedHumanReviewRequiredRejected() {
  const result = validatePageInvariants(invariantRow({ status: 'published', clearance_mode: 'HUMAN_REVIEW_REQUIRED' }));
  check('INVARIANT_PUBLISHED_HUMAN_REVIEW_REQUIRED', 'published + HUMAN_REVIEW_REQUIRED is rejected', !result.valid);
  check('INVARIANT_PUBLISHED_HUMAN_REVIEW_REQUIRED', 'trips both the published-clearance and review-required constraints', result.violations.includes('research_public_pages_published_requires_clearance:clearance_mode') && result.violations.includes('research_public_pages_review_required_not_ready'), JSON.stringify(result.violations));
}

async function testInvariantDraftRowsWithNullClearanceRemainAllowed() {
  // Item 10 from the originating request's new test list: this hardening
  // pass must not retroactively break ordinary, pre-clearance rows --
  // draft/in_review/approved/archived rows with no clearance decision
  // recorded yet are untouched by any of these three constraints.
  for (const status of ['draft', 'in_review', 'approved', 'archived']) {
    const result = validatePageInvariants({
      status,
      clearance_mode: null,
      generation_source_hash: null,
      key_claim_ids: [],
      source_ids: [],
      publication_clearance: {},
    });
    check('INVARIANT_DRAFT_NULL_CLEARANCE_ALLOWED', `status="${status}" with NULL clearance_mode and empty fields remains allowed`, result.valid, JSON.stringify(result));
  }
}

async function testInvariantDoesNotRequireAimtApproved() {
  // The published+AUTO_READY case above already proves this implicitly,
  // but assert it directly: the invariant module's CODE never checks
  // AIMT_APPROVED or claim-level public_eligible (its governance comment
  // explaining that omission is expected and fine -- only checked for
  // actual code references here, comments stripped first).
  const code = stripComments(readSrc('functions/_lib/research/publication-clearance-invariants.mjs'));
  check('INVARIANT_NO_AIMT_APPROVED_REQUIREMENT', 'invariants module never references AIMT_APPROVED in code', !/AIMT_APPROVED/.test(code));
  check('INVARIANT_NO_AIMT_APPROVED_REQUIREMENT', 'invariants module never references public_eligible in code', !/public_eligible/.test(code));
}

const tests = [
  testValidAutoReadyProducesRecord,
  testHumanReviewCannotClear,
  testSynthesisFailedCannotClear,
  testHighRiskCannotClear,
  testFingerprintDeterministic,
  testFingerprintChangesWithClaimSet,
  testFingerprintChangesWithCorePoint,
  testFingerprintChangesWithLimitation,
  testFingerprintChangesWithCitationMap,
  testFingerprintChangesWithRiskTier,
  testFingerprintChangesWithSourceSet,
  testFingerprintChangesWithTopicSlug,
  testFingerprintChangesWithPageConcept,
  testFingerprintChangesWithPublicIntent,
  testFingerprintChangesWithScopeLanguage,
  testFingerprintIgnoresIrrelevantAndReorderedFields,
  testStaleFingerprintDetected,
  testFreshFingerprintNotStale,
  testCannotIntroduceForbiddenFields,
  testWriterRefusesForbiddenColumns,
  testNoCodePathTouchesClaimTables,
  testCannotMarkPublished,
  testInvariantReadyAutoReadyValid,
  testInvariantReadyNullClearanceRejected,
  testInvariantReadyHumanReviewRequiredRejected,
  testInvariantReadyEmptyKeyClaimIdsRejected,
  testInvariantReadyEmptySourceIdsRejected,
  testInvariantReadyMissingHashRejected,
  testInvariantReadyEmptyPublicationClearanceRejected,
  testInvariantPublishedAutoReadyAllowed,
  testInvariantPublishedHumanApprovedAllowed,
  testInvariantPublishedMissingHashRejected,
  testInvariantPublishedEmptyKeyClaimIdsRejected,
  testInvariantPublishedEmptySourceIdsRejected,
  testInvariantPublishedEmptyPublicationClearanceRejected,
  testInvariantPublishedNullClearanceRejected,
  testInvariantPublishedHumanReviewRequiredRejected,
  testInvariantDraftRowsWithNullClearanceRemainAllowed,
  testInvariantDoesNotRequireAimtApproved,
];

for (const t of tests) {
  await t();
}

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
