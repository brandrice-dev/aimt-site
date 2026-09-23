// AIMT Automated Publication Clearance — deterministic unit tests.
// NO LIVE/MODEL/DATABASE CALLS: every fixture is synthetic; the
// fingerprint uses Web Crypto locally (no network); writeClearanceRecord
// IS exercised here for its pre-network-call guards (integrity + column
// allow-list), but only ever against a mocked globalThis.fetch (same
// withMockFetch pattern as tests/cadence-chat-config.test.mjs) -- real
// network access is never reachable from this file; the DB CHECK
// constraints are exercised via their pure JS mirror
// (publication-clearance-invariants.mjs), not a live Postgres connection.
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
  buildEvidenceFingerprintArtifact,
  verifyStoredClearanceIntegrity,
  isClearanceStale,
  FINGERPRINT_ALGORITHM,
} from '../functions/_lib/research/publication-clearance-fingerprint.mjs';
import {
  ALLOWED_COLUMNS,
  assertWritableClearanceRecord,
  assertClearanceIntegrityOrThrow,
  writeClearanceRecord,
} from '../functions/_lib/research/publication-clearance-writer.mjs';
import { validatePageInvariants } from '../functions/_lib/research/publication-clearance-invariants.mjs';

async function withMockFetch(mockImpl, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = mockImpl;
  try { return await fn(); } finally { globalThis.fetch = original; }
}

function countingFetch(callCounter, responseImpl) {
  return async (...args) => {
    callCounter.count += 1;
    return (responseImpl || (async () => ({ ok: true, status: 200, json: async () => ([]) })))(...args);
  };
}

const FAKE_ENV = { SUPABASE_URL: 'https://example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fake-service-role-key-not-real' };

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
  const fingerprintArtifact = await buildEvidenceFingerprintArtifact(TOPIC, brief);
  const record = buildAutoReadyClearanceRecord({
    topicSlug: TOPIC, controlledTopic: TOPIC, v1Result,
    pipelineStatus: 'AUTO_READY', pageEvidenceBrief: brief, fingerprintArtifact,
  });
  check('VALID_AUTO_READY', 'record built', !!record);
  check('VALID_AUTO_READY', 'clearance_mode is AUTO_READY', record.clearance_mode === 'AUTO_READY', record.clearance_mode);
  check('VALID_AUTO_READY', 'status is ready_for_page_builder', record.status === 'ready_for_page_builder', record.status);
  check('VALID_AUTO_READY', 'generation_source_hash set to the fingerprint hash', record.generation_source_hash === fingerprintArtifact.hash);
  check('VALID_AUTO_READY', 'key_claim_ids matches selected claims', JSON.stringify(record.key_claim_ids) === JSON.stringify(['c1', 'c2']));
  check('VALID_AUTO_READY', 'CLEARANCE_MODES includes AUTO_READY', CLEARANCE_MODES.includes('AUTO_READY'));
  check('VALID_AUTO_READY', 'fingerprint_algorithm recorded is the current v2 algorithm', record.publication_clearance.fingerprint_algorithm === FINGERPRINT_ALGORITHM && FINGERPRINT_ALGORITHM === 'sha256-canonical-json-v2', FINGERPRINT_ALGORITHM);
  check('VALID_AUTO_READY', 'persisted fingerprint_input is the EXACT object that was hashed (item 1)', JSON.stringify(record.publication_clearance.fingerprint_input) === JSON.stringify(fingerprintArtifact.input));
  check('VALID_AUTO_READY', 'DB invariant mirror accepts this record', validatePageInvariants(record).valid, JSON.stringify(validatePageInvariants(record)));
}

// ─────────────────────────────────────────────────────────────────────────
// HUMAN_REVIEW / SYNTHESIS_FAILED / HIGH-risk cannot produce a record
// ─────────────────────────────────────────────────────────────────────────
async function testHumanReviewCannotClear() {
  const brief = baselineBrief();
  const fingerprintArtifact = await buildEvidenceFingerprintArtifact(TOPIC, brief);
  let threw = false;
  try {
    buildAutoReadyClearanceRecord({ topicSlug: TOPIC, v1Result: baselineV1Result(), pipelineStatus: 'HUMAN_REVIEW', pageEvidenceBrief: brief, fingerprintArtifact });
  } catch (e) {
    threw = e instanceof ClearanceIneligibleError;
  }
  check('HUMAN_REVIEW_CANNOT_CLEAR', 'throws ClearanceIneligibleError', threw);
}

async function testSynthesisFailedCannotClear() {
  const brief = baselineBrief();
  const fingerprintArtifact = await buildEvidenceFingerprintArtifact(TOPIC, brief);
  let threw = false;
  try {
    buildAutoReadyClearanceRecord({ topicSlug: TOPIC, v1Result: baselineV1Result(), pipelineStatus: 'SYNTHESIS_FAILED', pageEvidenceBrief: brief, fingerprintArtifact });
  } catch (e) {
    threw = e instanceof ClearanceIneligibleError;
  }
  check('SYNTHESIS_FAILED_CANNOT_CLEAR', 'throws ClearanceIneligibleError', threw);
}

async function testHighRiskCannotClear() {
  const brief = baselineBrief({ risk_tier: 'HIGH' });
  const fingerprintArtifact = await buildEvidenceFingerprintArtifact('contraindications', brief);
  let threw = false;
  try {
    buildAutoReadyClearanceRecord({ topicSlug: 'contraindications', v1Result: baselineV1Result({ risk_tier: 'HIGH' }), pipelineStatus: 'AUTO_READY', pageEvidenceBrief: brief, fingerprintArtifact });
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
// Reproducible fingerprint snapshot + stored-clearance INTEGRITY (not
// FRESHNESS -- see publication-clearance-fingerprint.mjs's header note).
// verifyStoredClearanceIntegrity() re-hashes the record's OWN persisted
// fingerprint_input and cross-checks it against the record's OWN
// top-level columns. No AI call, no regeneration, no database access --
// items 2-12 and 16 from the originating request's test list (item 1 is
// covered inline in testValidAutoReadyProducesRecord above).
// ─────────────────────────────────────────────────────────────────────────
async function buildValidRecord(overrides = {}, v1ResultOverrides = {}) {
  const brief = baselineBrief(overrides);
  const fingerprintArtifact = await buildEvidenceFingerprintArtifact(TOPIC, brief);
  return buildAutoReadyClearanceRecord({
    topicSlug: TOPIC, controlledTopic: TOPIC, v1Result: baselineV1Result(v1ResultOverrides),
    pipelineStatus: 'AUTO_READY', pageEvidenceBrief: brief, fingerprintArtifact,
  });
}

async function testStoredFingerprintInputHashesToStoredHash() {
  // Item 2: the persisted fingerprint_input, rehashed independently here
  // (via the same canonicalStringify path computeEvidenceFingerprint
  // uses), reproduces generation_source_hash exactly -- proving the
  // stored hash is not an arbitrary value but a genuine function of the
  // stored input.
  const record = await buildValidRecord();
  const rehashed = await computeEvidenceFingerprint(record.publication_clearance.fingerprint_input.topic_slug, {
    // Reconstruct a "brief" shape from fingerprint_input's own fields --
    // buildFingerprintInput just re-sorts/canonicalizes them, so feeding
    // it back its own canonical output round-trips to the same hash.
    page_concept: record.publication_clearance.fingerprint_input.page_concept,
    public_intent: record.publication_clearance.fingerprint_input.public_intent,
    scope_language: record.publication_clearance.fingerprint_input.scope_language,
    risk_tier: record.publication_clearance.fingerprint_input.risk_tier,
    approved_for_draft_claim_ids: record.publication_clearance.fingerprint_input.selected_claim_ids,
    core_factual_points: record.publication_clearance.fingerprint_input.core_factual_points,
    limitations: record.publication_clearance.fingerprint_input.limitations,
    citation_map: record.publication_clearance.fingerprint_input.citation_map,
    source_ids: record.publication_clearance.fingerprint_input.source_ids,
  });
  check('STORED_INPUT_HASHES_TO_STORED_HASH', 'independently rehashing the stored fingerprint_input reproduces generation_source_hash', rehashed === record.generation_source_hash, `${rehashed} vs ${record.generation_source_hash}`);
}

async function testUntouchedRecordPassesIntegrity() {
  // Item 3.
  const record = await buildValidRecord();
  const result = await verifyStoredClearanceIntegrity(record);
  check('INTEGRITY_UNTOUCHED_PASSES', 'an untouched, freshly-built record passes verifyStoredClearanceIntegrity', result.valid, JSON.stringify(result));
  check('INTEGRITY_UNTOUCHED_PASSES', 'expected_hash matches stored_hash', result.expected_hash === result.stored_hash && result.expected_hash === record.generation_source_hash);
}

async function testTamperedCorePointFailsIntegrity() {
  // Item 4.
  const record = await buildValidRecord();
  const tampered = JSON.parse(JSON.stringify(record));
  tampered.publication_clearance.fingerprint_input.core_factual_points[0].statement = 'A statement that was never actually cleared.';
  const result = await verifyStoredClearanceIntegrity(tampered);
  check('INTEGRITY_TAMPERED_CORE_POINT', 'a mutated core factual point fails integrity', !result.valid && result.violations.includes('HASH_MISMATCH'), JSON.stringify(result));
}

async function testTamperedSupportingClaimIdsFailsIntegrity() {
  // Item 5.
  const record = await buildValidRecord();
  const tampered = JSON.parse(JSON.stringify(record));
  tampered.publication_clearance.fingerprint_input.core_factual_points[0].supporting_claim_ids = ['c-not-really-supporting'];
  const result = await verifyStoredClearanceIntegrity(tampered);
  check('INTEGRITY_TAMPERED_SUPPORTING_CLAIMS', "a mutated core point's supporting_claim_ids fails integrity", !result.valid && result.violations.includes('HASH_MISMATCH'), JSON.stringify(result));
}

async function testTamperedLimitationFailsIntegrity() {
  // Item 6.
  const record = await buildValidRecord();
  const tampered = JSON.parse(JSON.stringify(record));
  tampered.publication_clearance.fingerprint_input.limitations[0].statement = 'A limitation that was never actually cleared.';
  const result = await verifyStoredClearanceIntegrity(tampered);
  check('INTEGRITY_TAMPERED_LIMITATION', 'a mutated limitation fails integrity', !result.valid && result.violations.includes('HASH_MISMATCH'), JSON.stringify(result));
}

async function testTamperedSelectedClaimIdsFailsIntegrity() {
  // Item 7.
  const record = await buildValidRecord();
  const tampered = JSON.parse(JSON.stringify(record));
  tampered.publication_clearance.fingerprint_input.selected_claim_ids = ['c1', 'c2', 'c-never-cleared'];
  const result = await verifyStoredClearanceIntegrity(tampered);
  check('INTEGRITY_TAMPERED_SELECTED_CLAIMS', 'mutated fingerprint_input.selected_claim_ids fails integrity', !result.valid && result.violations.includes('HASH_MISMATCH'), JSON.stringify(result));
}

async function testTamperedSourceIdsFailsIntegrity() {
  // Item 8.
  const record = await buildValidRecord();
  const tampered = JSON.parse(JSON.stringify(record));
  tampered.publication_clearance.fingerprint_input.source_ids = ['s1', 's2', 's-never-cleared'];
  const result = await verifyStoredClearanceIntegrity(tampered);
  check('INTEGRITY_TAMPERED_SOURCE_IDS', 'mutated fingerprint_input.source_ids fails integrity', !result.valid && result.violations.includes('HASH_MISMATCH'), JSON.stringify(result));
}

async function testTamperedScopeLanguageFailsIntegrity() {
  // Item 9.
  const record = await buildValidRecord();
  const tampered = JSON.parse(JSON.stringify(record));
  tampered.publication_clearance.fingerprint_input.scope_language.scope_note = 'A scope note that was never actually cleared.';
  const result = await verifyStoredClearanceIntegrity(tampered);
  check('INTEGRITY_TAMPERED_SCOPE_LANGUAGE', 'mutated fingerprint_input.scope_language fails integrity', !result.valid && result.violations.includes('HASH_MISMATCH'), JSON.stringify(result));
}

async function testTamperedHashAloneFailsIntegrity() {
  // Item 10: fingerprint_input untouched, but generation_source_hash
  // itself was changed -- proves the check compares against the ACTUAL
  // stored hash, not just re-deriving and trusting a new one.
  const record = await buildValidRecord();
  const tampered = { ...record, generation_source_hash: '0'.repeat(64) };
  const result = await verifyStoredClearanceIntegrity(tampered);
  check('INTEGRITY_TAMPERED_HASH_ALONE', 'a changed generation_source_hash alone fails integrity', !result.valid && result.violations.includes('HASH_MISMATCH'), JSON.stringify(result));
}

async function testTamperedTopLevelKeyClaimIdsFailsCrossCheck() {
  // Item 11: fingerprint_input (and therefore the hash) is untouched, but
  // the top-level convenience column key_claim_ids was mutated -- the
  // hash alone can't catch this since key_claim_ids isn't part of what's
  // hashed; the cross-check must.
  const record = await buildValidRecord();
  const tampered = { ...record, key_claim_ids: ['c1', 'c2', 'c-added-after-clearance'] };
  const result = await verifyStoredClearanceIntegrity(tampered);
  check('INTEGRITY_TOP_LEVEL_KEY_CLAIM_IDS_DRIFT', 'top-level key_claim_ids drifting from fingerprint_input.selected_claim_ids fails the cross-check', !result.valid && result.violations.includes('KEY_CLAIM_IDS_MISMATCH'), JSON.stringify(result));
  check('INTEGRITY_TOP_LEVEL_KEY_CLAIM_IDS_DRIFT', 'hash itself still matches (only the cross-check fails)', !result.violations.includes('HASH_MISMATCH'), JSON.stringify(result));
}

async function testTamperedTopLevelSourceIdsFailsCrossCheck() {
  // Item 12.
  const record = await buildValidRecord();
  const tampered = { ...record, source_ids: ['s1', 's2', 's-added-after-clearance'] };
  const result = await verifyStoredClearanceIntegrity(tampered);
  check('INTEGRITY_TOP_LEVEL_SOURCE_IDS_DRIFT', 'top-level source_ids drifting from fingerprint_input.source_ids fails the cross-check', !result.valid && result.violations.includes('SOURCE_IDS_MISMATCH'), JSON.stringify(result));
  check('INTEGRITY_TOP_LEVEL_SOURCE_IDS_DRIFT', 'hash itself still matches (only the cross-check fails)', !result.violations.includes('HASH_MISMATCH'), JSON.stringify(result));
}

async function testMissingFingerprintAlgorithmFailsIntegrity() {
  const record = await buildValidRecord();
  const tampered = JSON.parse(JSON.stringify(record));
  delete tampered.publication_clearance.fingerprint_algorithm;
  const result = await verifyStoredClearanceIntegrity(tampered);
  check('INTEGRITY_MISSING_ALGORITHM', 'a missing fingerprint_algorithm fails integrity', !result.valid && result.violations.includes('MISSING_FINGERPRINT_ALGORITHM'), JSON.stringify(result));
}

async function testUnsupportedFingerprintAlgorithmFailsIntegrity() {
  // Bug 2: a stored algorithm value that isn't the current
  // FINGERPRINT_ALGORITHM must be rejected outright -- never silently
  // hashed under the current implementation while the row claims a
  // different/unsupported algorithm.
  const record = await buildValidRecord();
  const tampered = JSON.parse(JSON.stringify(record));
  tampered.publication_clearance.fingerprint_algorithm = 'sha256-canonical-json-v999';
  const result = await verifyStoredClearanceIntegrity(tampered);
  check('INTEGRITY_UNSUPPORTED_ALGORITHM', 'fingerprint_algorithm value is checked against the current FINGERPRINT_ALGORITHM, not just presence', 'sha256-canonical-json-v999' !== FINGERPRINT_ALGORITHM);
  check('INTEGRITY_UNSUPPORTED_ALGORITHM', 'an unsupported fingerprint_algorithm value fails integrity', !result.valid && result.violations.includes('UNSUPPORTED_FINGERPRINT_ALGORITHM'), JSON.stringify(result));
  check('INTEGRITY_UNSUPPORTED_ALGORITHM', 'does not compute expected_hash for an unsupported algorithm (never silently hashes under v2 anyway)', result.expected_hash === null, JSON.stringify(result));
}

// ─────────────────────────────────────────────────────────────────────────
// Writer-level integrity gate (Bug 1 fix): writeClearanceRecord() must
// independently re-verify integrity before ANY network call, regardless
// of whether a caller already checked. globalThis.fetch is mocked
// (withMockFetch, same pattern as tests/cadence-chat-config.test.mjs) so
// a bug here would show up as an unexpected fetch call, never a real
// network request.
// ─────────────────────────────────────────────────────────────────────────
async function testWriterRefusesHashMismatch() {
  // Item 1.
  const record = await buildValidRecord();
  const tampered = { ...record, generation_source_hash: '0'.repeat(64) };
  const counter = { count: 0 };
  let threw = false;
  await withMockFetch(countingFetch(counter), async () => {
    try { await writeClearanceRecord(FAKE_ENV, tampered); } catch (e) { threw = true; }
  });
  check('WRITER_INTEGRITY_GATE', 'writer refuses a record whose stored hash does not reproduce', threw);
  check('WRITER_INTEGRITY_GATE', 'zero fetch calls when hash mismatch', counter.count === 0, `fetch called ${counter.count} time(s)`);
}

async function testWriterRefusesKeyClaimIdsDrift() {
  // Item 2.
  const record = await buildValidRecord();
  const tampered = { ...record, key_claim_ids: ['c1', 'c2', 'c-added-after-clearance'] };
  const counter = { count: 0 };
  let threw = false;
  await withMockFetch(countingFetch(counter), async () => {
    try { await writeClearanceRecord(FAKE_ENV, tampered); } catch (e) { threw = true; }
  });
  check('WRITER_INTEGRITY_GATE', 'writer refuses top-level key_claim_ids drift', threw);
  check('WRITER_INTEGRITY_GATE', 'zero fetch calls when key_claim_ids drift', counter.count === 0, `fetch called ${counter.count} time(s)`);
}

async function testWriterRefusesSourceIdsDrift() {
  // Item 3.
  const record = await buildValidRecord();
  const tampered = { ...record, source_ids: ['s1', 's2', 's-added-after-clearance'] };
  const counter = { count: 0 };
  let threw = false;
  await withMockFetch(countingFetch(counter), async () => {
    try { await writeClearanceRecord(FAKE_ENV, tampered); } catch (e) { threw = true; }
  });
  check('WRITER_INTEGRITY_GATE', 'writer refuses top-level source_ids drift', threw);
  check('WRITER_INTEGRITY_GATE', 'zero fetch calls when source_ids drift', counter.count === 0, `fetch called ${counter.count} time(s)`);
}

async function testWriterRefusesUnsupportedAlgorithm() {
  // Item 4, plus part of item 5 (zero network calls) and the "no secrets
  // in the thrown message" requirement.
  const record = await buildValidRecord();
  const tampered = JSON.parse(JSON.stringify(record));
  tampered.publication_clearance.fingerprint_algorithm = 'sha256-canonical-json-v999';
  const counter = { count: 0 };
  let threw = false;
  let errorMessage = '';
  await withMockFetch(countingFetch(counter), async () => {
    try { await writeClearanceRecord(FAKE_ENV, tampered); } catch (e) { threw = true; errorMessage = e.message; }
  });
  check('WRITER_INTEGRITY_GATE', 'writer refuses an unsupported fingerprint_algorithm', threw);
  check('WRITER_INTEGRITY_GATE', 'thrown message names the violation without leaking the service role key', errorMessage.includes('UNSUPPORTED_FINGERPRINT_ALGORITHM') && !errorMessage.includes(FAKE_ENV.SUPABASE_SERVICE_ROLE_KEY), errorMessage);
  check('WRITER_INTEGRITY_GATE', 'zero fetch calls when algorithm is unsupported', counter.count === 0, `fetch called ${counter.count} time(s)`);
}

async function testWriterAcceptsValidRecord() {
  // Item 6: a genuinely valid, untampered record must NOT be blocked by
  // the new integrity gate -- proves this is a real gate, not a
  // fail-closed-on-everything bug, and that assertClearanceIntegrityOrThrow
  // itself resolves (doesn't throw) for good input.
  const record = await buildValidRecord();
  const integrityResult = await assertClearanceIntegrityOrThrow(record);
  check('WRITER_INTEGRITY_GATE', 'assertClearanceIntegrityOrThrow resolves (does not throw) for a valid record', integrityResult.valid === true, JSON.stringify(integrityResult));

  const counter = { count: 0 };
  let threw = false;
  let result;
  await withMockFetch(countingFetch(counter, async () => ({ ok: true, status: 200, json: async () => ([{ ...record }]) })), async () => {
    try { result = await writeClearanceRecord(FAKE_ENV, record); } catch (e) { threw = true; }
  });
  check('WRITER_INTEGRITY_GATE', 'a valid, untampered record passes the writer preflight and reaches the (mocked) network call', !threw && counter.count === 1, `threw=${threw} fetchCalls=${counter.count}`);
  check('WRITER_INTEGRITY_GATE', 'writeClearanceRecord resolves with the mocked upserted row', Array.isArray(result) && result.length === 1);
}

// ─────────────────────────────────────────────────────────────────────────
// Automated writer AUTHORITY (this revision): assertWritableClearanceRecord()
// now also rejects any clearance_mode other than 'AUTO_READY', and
// assertAutomatedRiskTierAuthority() rejects any canonical
// (fingerprint_input.risk_tier) other than LOWER/MODERATE. Every scenario
// below runs writeClearanceRecord() itself against a mocked
// globalThis.fetch and asserts BOTH that it throws AND that the mock was
// never called -- proving the record never got as far as being sent
// anywhere, not just that some check somewhere returned false.
// ─────────────────────────────────────────────────────────────────────────
async function writeAndCountFetch(record) {
  const counter = { count: 0 };
  let threw = false;
  let errorMessage = '';
  await withMockFetch(countingFetch(counter), async () => {
    try { await writeClearanceRecord(FAKE_ENV, record); } catch (e) { threw = true; errorMessage = e.message; }
  });
  return { threw, errorMessage, fetchCalls: counter.count };
}

async function testWriterAcceptsValidLowerRisk() {
  // Item 1.
  const record = await buildValidRecord({ risk_tier: 'LOWER' }, { risk_tier: 'LOWER' });
  const { threw, fetchCalls } = await writeAndCountFetch(record);
  check('WRITER_AUTHORITY_VALID_RISK', 'valid AUTO_READY + LOWER risk reaches the mocked fetch exactly once', !threw && fetchCalls === 1, `threw=${threw} fetchCalls=${fetchCalls}`);
}

async function testWriterAcceptsValidModerateRisk() {
  // Item 2.
  const record = await buildValidRecord({ risk_tier: 'MODERATE' }, { risk_tier: 'MODERATE' });
  check('WRITER_AUTHORITY_VALID_RISK', 'a MODERATE-risk record is a genuinely consistent fixture (fingerprint_input and publication_clearance agree)', record.publication_clearance.fingerprint_input.risk_tier === 'MODERATE' && record.publication_clearance.risk_tier === 'MODERATE');
  const { threw, fetchCalls } = await writeAndCountFetch(record);
  check('WRITER_AUTHORITY_VALID_RISK', 'valid AUTO_READY + MODERATE risk reaches the mocked fetch exactly once', !threw && fetchCalls === 1, `threw=${threw} fetchCalls=${fetchCalls}`);
}

async function testWriterRefusesHumanApproved() {
  // Item 3.
  const record = await buildValidRecord();
  const tampered = { ...record, clearance_mode: 'HUMAN_APPROVED' };
  const { threw, errorMessage, fetchCalls } = await writeAndCountFetch(tampered);
  check('WRITER_AUTHORITY_CLEARANCE_MODE', 'a HUMAN_APPROVED record is refused by this writer', threw && errorMessage.includes('HUMAN_APPROVED'), errorMessage);
  check('WRITER_AUTHORITY_CLEARANCE_MODE', 'zero fetch calls for a HUMAN_APPROVED record', fetchCalls === 0, `fetch called ${fetchCalls} time(s)`);
}

async function testWriterRefusesHumanReviewRequired() {
  // Item 4.
  const record = await buildValidRecord();
  const tampered = { ...record, clearance_mode: 'HUMAN_REVIEW_REQUIRED' };
  const { threw, fetchCalls } = await writeAndCountFetch(tampered);
  check('WRITER_AUTHORITY_CLEARANCE_MODE', 'a HUMAN_REVIEW_REQUIRED record is refused by this writer', threw);
  check('WRITER_AUTHORITY_CLEARANCE_MODE', 'zero fetch calls for a HUMAN_REVIEW_REQUIRED record', fetchCalls === 0, `fetch called ${fetchCalls} time(s)`);
}

async function testWriterRefusesNullOrUnknownClearanceMode() {
  // Item 5.
  const record = await buildValidRecord();
  for (const badMode of [null, undefined, 'SOMETHING_MADE_UP']) {
    const tampered = { ...record, clearance_mode: badMode };
    const { threw, fetchCalls } = await writeAndCountFetch(tampered);
    check('WRITER_AUTHORITY_CLEARANCE_MODE', `clearance_mode=${JSON.stringify(badMode)} is refused by this writer`, threw);
    check('WRITER_AUTHORITY_CLEARANCE_MODE', `zero fetch calls for clearance_mode=${JSON.stringify(badMode)}`, fetchCalls === 0, `fetch called ${fetchCalls} time(s)`);
  }
}

async function testWriterRefusesHighRiskBypass() {
  // Item 6: simulates a direct caller bypassing buildAutoReadyClearanceRecord()
  // (which already refuses to build HIGH-risk records) by tampering the
  // canonical fingerprint_input directly on an otherwise-built record.
  const record = await buildValidRecord();
  const tampered = JSON.parse(JSON.stringify(record));
  tampered.publication_clearance.fingerprint_input.risk_tier = 'HIGH';
  tampered.publication_clearance.risk_tier = 'HIGH'; // keep the duplicate consistent so this is purely a risk-tier-authority test, not an incidental integrity failure
  const { threw, errorMessage, fetchCalls } = await writeAndCountFetch(tampered);
  check('WRITER_AUTHORITY_RISK_TIER', 'AUTO_READY + HIGH canonical risk_tier is refused', threw && errorMessage.includes('HIGH'), errorMessage);
  check('WRITER_AUTHORITY_RISK_TIER', 'zero fetch calls for a HIGH-risk bypass attempt', fetchCalls === 0, `fetch called ${fetchCalls} time(s)`);
}

async function testWriterRefusesMissingRiskTier() {
  // Item 7.
  const record = await buildValidRecord();
  const tampered = JSON.parse(JSON.stringify(record));
  delete tampered.publication_clearance.fingerprint_input.risk_tier;
  const { threw, fetchCalls } = await writeAndCountFetch(tampered);
  check('WRITER_AUTHORITY_RISK_TIER', 'a missing canonical risk_tier is refused', threw);
  check('WRITER_AUTHORITY_RISK_TIER', 'zero fetch calls for a missing canonical risk_tier', fetchCalls === 0, `fetch called ${fetchCalls} time(s)`);
}

async function testWriterRefusesUnknownRiskTier() {
  // Item 8.
  const record = await buildValidRecord();
  const tampered = JSON.parse(JSON.stringify(record));
  tampered.publication_clearance.fingerprint_input.risk_tier = 'SOMETHING_MADE_UP';
  tampered.publication_clearance.risk_tier = 'SOMETHING_MADE_UP';
  const { threw, fetchCalls } = await writeAndCountFetch(tampered);
  check('WRITER_AUTHORITY_RISK_TIER', 'an unrecognized canonical risk_tier is refused', threw);
  check('WRITER_AUTHORITY_RISK_TIER', 'zero fetch calls for an unrecognized canonical risk_tier', fetchCalls === 0, `fetch called ${fetchCalls} time(s)`);
}

async function testWriterRefusesDuplicateRiskTierDrift() {
  // Item 9: the risk-tier AUTHORITY check passes (fingerprint_input.risk_tier
  // is still a valid LOWER/MODERATE value), but the top-level
  // publication_clearance.risk_tier duplicate disagrees with it -- this
  // must be caught by the INTEGRITY gate (RISK_TIER_MISMATCH /
  // MISSING_RISK_TIER), not silently accepted.
  const record = await buildValidRecord({ risk_tier: 'LOWER' }, { risk_tier: 'LOWER' });
  const tampered = JSON.parse(JSON.stringify(record));
  tampered.publication_clearance.risk_tier = 'MODERATE'; // fingerprint_input.risk_tier stays LOWER
  const integrityResult = await verifyStoredClearanceIntegrity(tampered);
  check('WRITER_AUTHORITY_RISK_TIER_DUPLICATE_DRIFT', 'a drifted publication_clearance.risk_tier duplicate fails integrity directly', !integrityResult.valid && integrityResult.violations.includes('RISK_TIER_MISMATCH'), JSON.stringify(integrityResult));
  const { threw, fetchCalls } = await writeAndCountFetch(tampered);
  check('WRITER_AUTHORITY_RISK_TIER_DUPLICATE_DRIFT', 'the writer refuses a drifted publication_clearance.risk_tier duplicate', threw);
  check('WRITER_AUTHORITY_RISK_TIER_DUPLICATE_DRIFT', 'zero fetch calls for a drifted risk_tier duplicate', fetchCalls === 0, `fetch called ${fetchCalls} time(s)`);
}

async function testNoAutomatedCodePathCanPersistHumanApproved() {
  // Item 10: structural proof, not just behavioral -- no line of code in
  // this feature's build/write path ever assigns clearance_mode to
  // 'HUMAN_APPROVED'. Comments are stripped first so governance prose
  // explaining what does NOT happen doesn't produce a false match.
  const files = [
    'functions/_lib/research/publication-clearance.mjs',
    'functions/_lib/research/publication-clearance-writer.mjs',
  ];
  for (const f of files) {
    const code = stripComments(readSrc(f));
    check('NO_AUTOMATED_HUMAN_APPROVED_PATH', `${f} never assigns clearance_mode = 'HUMAN_APPROVED'`, !/clearance_mode\s*[:=]\s*['"]HUMAN_APPROVED['"]/.test(code));
  }
  // Behavioral corroboration: buildAutoReadyClearanceRecord() has no
  // parameter that could route to HUMAN_APPROVED, and the writer actively
  // refuses it even if handed one directly (proven above).
  const record = await buildValidRecord();
  check('NO_AUTOMATED_HUMAN_APPROVED_PATH', 'buildAutoReadyClearanceRecord() never produces clearance_mode = HUMAN_APPROVED', record.clearance_mode === 'AUTO_READY');
}

async function testCliCannotReachWriteAfterIntegrityFail() {
  // Item 7: structural proof that the CLI's own control flow stops
  // before writeClearanceRecord() when verifyStoredClearanceIntegrity()
  // fails (not just that the writer itself refuses -- already proven
  // above). Finds the `if (!integrity.valid) { ... }` block by brace
  // matching and asserts it (a) contains an unconditional `return;` and
  // (b) appears, in source order, before the write call site.
  const src = readSrc('scripts/research-publication-clearance-shadow.mjs');
  const guardStart = src.indexOf('if (!integrity.valid) {');
  const writeCallIndex = src.indexOf('await writeClearanceRecord(');
  check('CLI_INTEGRITY_GATE', 'shadow script has an explicit "if (!integrity.valid)" guard', guardStart !== -1);
  check('CLI_INTEGRITY_GATE', 'the write call exists in the source', writeCallIndex !== -1);
  check('CLI_INTEGRITY_GATE', 'the integrity guard appears BEFORE the write call in source order', guardStart !== -1 && writeCallIndex !== -1 && guardStart < writeCallIndex);

  let depth = 0;
  let blockEnd = -1;
  const braceStart = src.indexOf('{', guardStart);
  for (let i = braceStart; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) { blockEnd = i; break; } }
  }
  const guardBlock = blockEnd !== -1 ? src.slice(guardStart, blockEnd) : '';
  check('CLI_INTEGRITY_GATE', 'the integrity-fail guard block contains an unconditional return (not just a log)', /\breturn;/.test(guardBlock), guardBlock);
}

async function testIntegrityChecksRequireNoModelCall() {
  // Item 16: structural self-check that this whole integrity/
  // reproducibility test section never imports or calls anything that
  // would reach the Anthropic API -- verifyStoredClearanceIntegrity and
  // buildEvidenceFingerprintArtifact are pure/Web-Crypto-only by design.
  // Plain substring checks (not regex) so this assertion cannot
  // accidentally match its own source text.
  const thisFileSrc = readSrc('tests/research-publication-clearance.test.mjs');
  const forbiddenSubstrings = [
    'publication-synthesis-orchestrator.mjs',
    'cadence-anthropic-response',
    'fetchAnthropicMessages',
    'ANTHROPIC_PUBLICATION_EDITOR_API_KEY',
  ];
  for (const needle of forbiddenSubstrings) {
    const occurrences = thisFileSrc.split(needle).length - 1;
    // This very check necessarily contains each needle once, as a string
    // literal in the `forbiddenSubstrings` array above -- so 1 occurrence
    // is the "clean" baseline, not 0.
    check('INTEGRITY_NO_MODEL_CALL', `test file never actually uses "${needle}" outside this self-check`, occurrences <= 1, `found ${occurrences} occurrence(s)`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Cannot set AIMT_APPROVED / claim public_eligible / published / sitemap
// ─────────────────────────────────────────────────────────────────────────
async function testCannotIntroduceForbiddenFields() {
  const brief = baselineBrief();
  const fingerprintArtifact = await buildEvidenceFingerprintArtifact(TOPIC, brief);
  const record = buildAutoReadyClearanceRecord({
    topicSlug: TOPIC, v1Result: baselineV1Result(), pipelineStatus: 'AUTO_READY', pageEvidenceBrief: brief, fingerprintArtifact,
  });
  const allKeys = [...Object.keys(record), ...Object.keys(record.publication_clearance)];
  for (const forbidden of FORBIDDEN_CLEARANCE_FIELDS) {
    check('NO_FORBIDDEN_FIELDS', `record never contains "${forbidden}"`, !allKeys.includes(forbidden));
  }
  check('NO_FORBIDDEN_FIELDS', 'FORBIDDEN_CLEARANCE_FIELDS includes AIMT_APPROVED-adjacent fields', FORBIDDEN_CLEARANCE_FIELDS.includes('AIMT_APPROVED') && FORBIDDEN_CLEARANCE_FIELDS.includes('public_eligible') && FORBIDDEN_CLEARANCE_FIELDS.includes('published'));
}

async function testWriterRefusesForbiddenColumns() {
  const brief = baselineBrief();
  const fingerprintArtifact = await buildEvidenceFingerprintArtifact(TOPIC, brief);
  const record = buildAutoReadyClearanceRecord({
    topicSlug: TOPIC, v1Result: baselineV1Result(), pipelineStatus: 'AUTO_READY', pageEvidenceBrief: brief, fingerprintArtifact,
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
  const fingerprintArtifact = await buildEvidenceFingerprintArtifact(TOPIC, brief);
  const record = buildAutoReadyClearanceRecord({
    topicSlug: TOPIC, v1Result: baselineV1Result(), pipelineStatus: 'AUTO_READY', pageEvidenceBrief: brief, fingerprintArtifact,
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
    publication_clearance: {
      fingerprint_algorithm: 'sha256-canonical-json-v2',
      fingerprint_input: { topic_slug: 'hair-cycle', selected_claim_ids: ['c1'], source_ids: ['s1'] },
      risk_tier: 'LOWER',
    },
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

async function testInvariantReadyMissingFingerprintInputRejected() {
  // Item 13.
  const withoutInput = validatePageInvariants(invariantRow({
    publication_clearance: { fingerprint_algorithm: 'sha256-canonical-json-v2' },
  }));
  const withEmptyInput = validatePageInvariants(invariantRow({
    publication_clearance: { fingerprint_algorithm: 'sha256-canonical-json-v2', fingerprint_input: {} },
  }));
  check('INVARIANT_READY_MISSING_FINGERPRINT_INPUT', 'ready_for_page_builder with no fingerprint_input key is rejected', !withoutInput.valid, JSON.stringify(withoutInput));
  check('INVARIANT_READY_MISSING_FINGERPRINT_INPUT', 'names the exact constraint', withoutInput.violations.includes('research_public_pages_ready_requires_clearance:fingerprint_input'), JSON.stringify(withoutInput.violations));
  check('INVARIANT_READY_MISSING_FINGERPRINT_INPUT', 'ready_for_page_builder with fingerprint_input = {} is also rejected', !withEmptyInput.valid, JSON.stringify(withEmptyInput));
}

async function testInvariantReadyMissingFingerprintAlgorithmRejected() {
  const result = validatePageInvariants(invariantRow({
    publication_clearance: { fingerprint_input: { topic_slug: 'hair-cycle' } },
  }));
  check('INVARIANT_READY_MISSING_FINGERPRINT_ALGORITHM', 'ready_for_page_builder with no fingerprint_algorithm is rejected', !result.valid, JSON.stringify(result));
  check('INVARIANT_READY_MISSING_FINGERPRINT_ALGORITHM', 'names the exact constraint', result.violations.includes('research_public_pages_ready_requires_clearance:fingerprint_algorithm'), JSON.stringify(result.violations));
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

async function testInvariantPublishedMissingFingerprintInputRejected() {
  // Item 14.
  const result = validatePageInvariants(invariantRow({
    status: 'published',
    clearance_mode: 'AUTO_READY',
    publication_clearance: { fingerprint_algorithm: 'sha256-canonical-json-v2' },
  }));
  check('INVARIANT_PUBLISHED_MISSING_FINGERPRINT_INPUT', 'published + AUTO_READY with no fingerprint_input key is rejected', !result.valid, JSON.stringify(result));
  check('INVARIANT_PUBLISHED_MISSING_FINGERPRINT_INPUT', 'names the exact constraint', result.violations.includes('research_public_pages_published_requires_clearance:fingerprint_input'), JSON.stringify(result.violations));
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
  testStoredFingerprintInputHashesToStoredHash,
  testUntouchedRecordPassesIntegrity,
  testTamperedCorePointFailsIntegrity,
  testTamperedSupportingClaimIdsFailsIntegrity,
  testTamperedLimitationFailsIntegrity,
  testTamperedSelectedClaimIdsFailsIntegrity,
  testTamperedSourceIdsFailsIntegrity,
  testTamperedScopeLanguageFailsIntegrity,
  testTamperedHashAloneFailsIntegrity,
  testTamperedTopLevelKeyClaimIdsFailsCrossCheck,
  testTamperedTopLevelSourceIdsFailsCrossCheck,
  testMissingFingerprintAlgorithmFailsIntegrity,
  testUnsupportedFingerprintAlgorithmFailsIntegrity,
  testWriterRefusesHashMismatch,
  testWriterRefusesKeyClaimIdsDrift,
  testWriterRefusesSourceIdsDrift,
  testWriterRefusesUnsupportedAlgorithm,
  testWriterAcceptsValidRecord,
  testWriterAcceptsValidLowerRisk,
  testWriterAcceptsValidModerateRisk,
  testWriterRefusesHumanApproved,
  testWriterRefusesHumanReviewRequired,
  testWriterRefusesNullOrUnknownClearanceMode,
  testWriterRefusesHighRiskBypass,
  testWriterRefusesMissingRiskTier,
  testWriterRefusesUnknownRiskTier,
  testWriterRefusesDuplicateRiskTierDrift,
  testNoAutomatedCodePathCanPersistHumanApproved,
  testCliCannotReachWriteAfterIntegrityFail,
  testIntegrityChecksRequireNoModelCall,
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
  testInvariantReadyMissingFingerprintInputRejected,
  testInvariantReadyMissingFingerprintAlgorithmRejected,
  testInvariantPublishedAutoReadyAllowed,
  testInvariantPublishedHumanApprovedAllowed,
  testInvariantPublishedMissingHashRejected,
  testInvariantPublishedEmptyKeyClaimIdsRejected,
  testInvariantPublishedEmptySourceIdsRejected,
  testInvariantPublishedEmptyPublicationClearanceRejected,
  testInvariantPublishedMissingFingerprintInputRejected,
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
