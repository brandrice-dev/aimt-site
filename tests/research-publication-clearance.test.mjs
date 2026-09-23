// AIMT Automated Publication Clearance — deterministic unit tests.
// NO LIVE/MODEL/DATABASE CALLS: every fixture is synthetic; the
// fingerprint uses Web Crypto locally (no network), and the writer's
// network call is never exercised here -- only its pure guard
// (assertWritableClearanceRecord).
//
// Run: node tests/research-publication-clearance.test.mjs

import {
  buildAutoReadyClearanceRecord,
  ClearanceIneligibleError,
  FORBIDDEN_CLEARANCE_FIELDS,
  CLEARANCE_MODES,
} from '../functions/_lib/research/publication-clearance.mjs';
import {
  computeEvidenceFingerprint,
  isClearanceStale,
} from '../functions/_lib/research/publication-clearance-fingerprint.mjs';
import { ALLOWED_COLUMNS, assertWritableClearanceRecord } from '../functions/_lib/research/publication-clearance-writer.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

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
  const fingerprint = await computeEvidenceFingerprint(brief);
  const record = buildAutoReadyClearanceRecord({
    topicSlug: 'hair-cycle', controlledTopic: 'hair-cycle', v1Result,
    pipelineStatus: 'AUTO_READY', pageEvidenceBrief: brief, fingerprint,
  });
  check('VALID_AUTO_READY', 'record built', !!record);
  check('VALID_AUTO_READY', 'clearance_mode is AUTO_READY', record.clearance_mode === 'AUTO_READY', record.clearance_mode);
  check('VALID_AUTO_READY', 'status is ready_for_page_builder', record.status === 'ready_for_page_builder', record.status);
  check('VALID_AUTO_READY', 'generation_source_hash set to the fingerprint', record.generation_source_hash === fingerprint);
  check('VALID_AUTO_READY', 'key_claim_ids matches selected claims', JSON.stringify(record.key_claim_ids) === JSON.stringify(['c1', 'c2']));
  check('VALID_AUTO_READY', 'CLEARANCE_MODES includes AUTO_READY', CLEARANCE_MODES.includes('AUTO_READY'));
}

// ─────────────────────────────────────────────────────────────────────────
// HUMAN_REVIEW / SYNTHESIS_FAILED / HIGH-risk cannot produce a record
// ─────────────────────────────────────────────────────────────────────────
async function testHumanReviewCannotClear() {
  const brief = baselineBrief();
  const fingerprint = await computeEvidenceFingerprint(brief);
  let threw = false;
  try {
    buildAutoReadyClearanceRecord({ topicSlug: 'hair-cycle', v1Result: baselineV1Result(), pipelineStatus: 'HUMAN_REVIEW', pageEvidenceBrief: brief, fingerprint });
  } catch (e) {
    threw = e instanceof ClearanceIneligibleError;
  }
  check('HUMAN_REVIEW_CANNOT_CLEAR', 'throws ClearanceIneligibleError', threw);
}

async function testSynthesisFailedCannotClear() {
  const brief = baselineBrief();
  const fingerprint = await computeEvidenceFingerprint(brief);
  let threw = false;
  try {
    buildAutoReadyClearanceRecord({ topicSlug: 'hair-cycle', v1Result: baselineV1Result(), pipelineStatus: 'SYNTHESIS_FAILED', pageEvidenceBrief: brief, fingerprint });
  } catch (e) {
    threw = e instanceof ClearanceIneligibleError;
  }
  check('SYNTHESIS_FAILED_CANNOT_CLEAR', 'throws ClearanceIneligibleError', threw);
}

async function testHighRiskCannotClear() {
  const brief = baselineBrief({ risk_tier: 'HIGH' });
  const fingerprint = await computeEvidenceFingerprint(brief);
  let threw = false;
  try {
    buildAutoReadyClearanceRecord({ topicSlug: 'contraindications', v1Result: baselineV1Result({ risk_tier: 'HIGH' }), pipelineStatus: 'AUTO_READY', pageEvidenceBrief: brief, fingerprint });
  } catch (e) {
    threw = e instanceof ClearanceIneligibleError;
  }
  check('HIGH_RISK_CANNOT_CLEAR', 'throws ClearanceIneligibleError even though pipelineStatus says AUTO_READY', threw);
}

// ─────────────────────────────────────────────────────────────────────────
// Fingerprint determinism and sensitivity
// ─────────────────────────────────────────────────────────────────────────
async function testFingerprintDeterministic() {
  const brief = baselineBrief();
  const fp1 = await computeEvidenceFingerprint(brief);
  const fp2 = await computeEvidenceFingerprint(brief);
  check('FINGERPRINT_DETERMINISTIC', 'same input produces same fingerprint', fp1 === fp2, `${fp1} vs ${fp2}`);
}

async function testFingerprintChangesWithClaimSet() {
  const fp1 = await computeEvidenceFingerprint(baselineBrief());
  const fp2 = await computeEvidenceFingerprint(baselineBrief({ approved_for_draft_claim_ids: ['c1', 'c2', 'c4'] }));
  check('FINGERPRINT_CLAIM_SET_CHANGE', 'differs when selected claim set changes', fp1 !== fp2);
}

async function testFingerprintChangesWithCorePoint() {
  const fp1 = await computeEvidenceFingerprint(baselineBrief());
  const fp2 = await computeEvidenceFingerprint(baselineBrief({
    core_factual_points: [{ statement: 'A different statement entirely.', supporting_claim_ids: ['c1'] }],
  }));
  check('FINGERPRINT_CORE_POINT_CHANGE', 'differs when a core factual point changes', fp1 !== fp2);
}

async function testFingerprintChangesWithLimitation() {
  const fp1 = await computeEvidenceFingerprint(baselineBrief());
  const fp2 = await computeEvidenceFingerprint(baselineBrief({
    limitations: [{ statement: 'A different limitation.', supporting_claim_ids: ['c2'] }],
  }));
  check('FINGERPRINT_LIMITATION_CHANGE', 'differs when a limitation changes', fp1 !== fp2);
}

async function testFingerprintChangesWithCitationMap() {
  const fp1 = await computeEvidenceFingerprint(baselineBrief());
  const fp2 = await computeEvidenceFingerprint(baselineBrief({
    citation_map: { s1: { title: 'Ref One (corrected title)', doi: '10.1/one' }, s2: { title: 'Ref Two', doi: '10.1/two' } },
  }));
  check('FINGERPRINT_CITATION_MAP_CHANGE', 'differs when citation metadata changes', fp1 !== fp2);
}

async function testFingerprintChangesWithRiskTier() {
  const fp1 = await computeEvidenceFingerprint(baselineBrief({ risk_tier: 'LOWER' }));
  const fp2 = await computeEvidenceFingerprint(baselineBrief({ risk_tier: 'MODERATE' }));
  check('FINGERPRINT_RISK_TIER_CHANGE', 'differs when risk_tier changes', fp1 !== fp2);
}

async function testFingerprintChangesWithSourceSet() {
  const fp1 = await computeEvidenceFingerprint(baselineBrief());
  const fp2 = await computeEvidenceFingerprint(baselineBrief({ source_ids: ['s1', 's2', 's3'] }));
  check('FINGERPRINT_SOURCE_SET_CHANGE', 'differs when source set changes', fp1 !== fp2);
}

// ─────────────────────────────────────────────────────────────────────────
// Irrelevant/reordered fields do NOT change the fingerprint
// ─────────────────────────────────────────────────────────────────────────
async function testFingerprintIgnoresIrrelevantAndReorderedFields() {
  const brief1 = baselineBrief();
  // Same materially-relevant content, but: claim IDs listed in a
  // different order, citation_map keys inserted in a different order,
  // AND every irrelevant field (timestamp, provenance, page_concept)
  // changed -- none of that should move the fingerprint.
  const brief2 = baselineBrief({
    approved_for_draft_claim_ids: ['c2', 'c1'],
    citation_map: { s2: { doi: '10.1/two', title: 'Ref Two' }, s1: { doi: '10.1/one', title: 'Ref One' } },
    review_timestamp: '2099-01-01T00:00:00.000Z',
    page_concept: 'A totally different page title',
    public_intent: 'A totally different stated intent',
    provenance: { v1_engine_version: 'some-other-version', synthesis_model: { provider: 'anthropic', model_name: 'claude-haiku-4-5-20251001' }, validator_version: 'v99' },
  });
  const fp1 = await computeEvidenceFingerprint(brief1);
  const fp2 = await computeEvidenceFingerprint(brief2);
  check('FINGERPRINT_IGNORES_IRRELEVANT', 'identical fingerprint despite reordering + irrelevant-field changes', fp1 === fp2, `${fp1} vs ${fp2}`);
}

// ─────────────────────────────────────────────────────────────────────────
// Stale fingerprint fails validation (isClearanceStale)
// ─────────────────────────────────────────────────────────────────────────
async function testStaleFingerprintDetected() {
  const original = baselineBrief();
  const storedFingerprint = await computeEvidenceFingerprint(original);
  const changed = baselineBrief({ approved_for_draft_claim_ids: ['c1', 'c2', 'c5'] });
  const result = await isClearanceStale(changed, storedFingerprint);
  check('STALE_FINGERPRINT', 'detected as stale', result.stale === true, JSON.stringify(result));
}

async function testFreshFingerprintNotStale() {
  const brief = baselineBrief();
  const storedFingerprint = await computeEvidenceFingerprint(brief);
  const result = await isClearanceStale(brief, storedFingerprint);
  check('FRESH_FINGERPRINT', 'not stale when unchanged', result.stale === false);
}

// ─────────────────────────────────────────────────────────────────────────
// Cannot set AIMT_APPROVED / claim public_eligible / published / sitemap
// ─────────────────────────────────────────────────────────────────────────
async function testCannotIntroduceForbiddenFields() {
  const brief = baselineBrief();
  const fingerprint = await computeEvidenceFingerprint(brief);
  const record = buildAutoReadyClearanceRecord({
    topicSlug: 'hair-cycle', v1Result: baselineV1Result(), pipelineStatus: 'AUTO_READY', pageEvidenceBrief: brief, fingerprint,
  });
  const allKeys = [...Object.keys(record), ...Object.keys(record.publication_clearance)];
  for (const forbidden of FORBIDDEN_CLEARANCE_FIELDS) {
    check('NO_FORBIDDEN_FIELDS', `record never contains "${forbidden}"`, !allKeys.includes(forbidden));
  }
  check('NO_FORBIDDEN_FIELDS', 'FORBIDDEN_CLEARANCE_FIELDS includes AIMT_APPROVED-adjacent fields', FORBIDDEN_CLEARANCE_FIELDS.includes('AIMT_APPROVED') && FORBIDDEN_CLEARANCE_FIELDS.includes('public_eligible') && FORBIDDEN_CLEARANCE_FIELDS.includes('published'));
}

async function testWriterRefusesForbiddenColumns() {
  const brief = baselineBrief();
  const fingerprint = await computeEvidenceFingerprint(brief);
  const record = buildAutoReadyClearanceRecord({
    topicSlug: 'hair-cycle', v1Result: baselineV1Result(), pipelineStatus: 'AUTO_READY', pageEvidenceBrief: brief, fingerprint,
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
// Cannot mark the public page published in this bridge step
// ─────────────────────────────────────────────────────────────────────────
async function testCannotMarkPublished() {
  const brief = baselineBrief();
  const fingerprint = await computeEvidenceFingerprint(brief);
  const record = buildAutoReadyClearanceRecord({
    topicSlug: 'hair-cycle', v1Result: baselineV1Result(), pipelineStatus: 'AUTO_READY', pageEvidenceBrief: brief, fingerprint,
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
  testFingerprintIgnoresIrrelevantAndReorderedFields,
  testStaleFingerprintDetected,
  testFreshFingerprintNotStale,
  testCannotIntroduceForbiddenFields,
  testWriterRefusesForbiddenColumns,
  testCannotMarkPublished,
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
