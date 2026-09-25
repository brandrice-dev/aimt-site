// AIMT Education Operations v1 — deterministic tests proving the
// Phase 4 fix: prepareTopicArtifact() calls synthesis EXACTLY ONCE, and
// publishPreparedArtifact() can NEVER trigger a new synthesis call --
// it has no synthesize-capable parameter at all. This is the fix for
// the exact defect found during telogen-effluvium development (preview
// and --write independently re-synthesizing, so the validated artifact
// was not necessarily the persisted one).
//
// NO LIVE/MODEL/DATABASE CALLS: synthesizeFn is always a synthetic
// mock with a call counter; writeFn is always a synthetic mock.
//
// Run: node tests/education-synthesis-cache.test.mjs

import { prepareTopicArtifact, publishPreparedArtifact } from '../functions/_lib/education-ops/education-synthesis-cache.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const FAKE_ENV = {};

function baselineV1Result(overrides = {}) {
  return {
    topic_slug: 'x-topic',
    risk_tier: 'MODERATE',
    readiness_status: 'NEEDS_SYNTHESIS',
    metrics: { candidate_claim_count: 2, distinct_source_count: 2 },
    synthesis_packet: {
      controlled_topics: ['x-topic'],
      candidate_claim_ids: ['c1', 'c2'],
      candidate_source_ids: ['s1', 's2'],
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
      { source_id: 's2', title: 'Source Two', authors: ['B. Author'], year: 2023, doi: '10.1/two', evidence_type: 'narrative_review', source_role: 'primary' },
    ],
  };
}

function baselinePageIntent() {
  return { page_concept: 'X Topic Overview', public_intent: 'Explain x.', in_scope_concepts: ['x'], out_of_scope_concepts: ['treatment', 'diagnosis'] };
}

function autoReadyOutput() {
  return {
    topic_slug: 'x-topic', page_concept: 'X Topic Overview', recommended_disposition: 'AUTO_READY', confidence: 'high',
    page_scope: { include: ['x'], exclude: ['treatment'] },
    selected_claims: [{ claim_id: 'c1', role: 'core_finding', reason: 'ok' }, { claim_id: 'c2', role: 'limitation', reason: 'ok' }],
    excluded_claims: [],
    resolved_synthesis_signals: [],
    unresolved_issues: [],
    human_review_justification: { reason_code: 'NOT_APPLICABLE', reason: 'Not applicable', related_claim_ids: [] },
    public_framing: {
      core_points: [{ statement: 'A finding.', supporting_claim_ids: ['c1'] }],
      limitations: [{ statement: 'A limitation.', supporting_claim_ids: ['c2'] }],
      scope_note: 'Scope note.',
    },
  };
}

function mockSynthesizeFn(counter, output) {
  return async () => {
    counter.count += 1;
    return {
      status: 'AUTO_READY', stage: 'initial', reason: 'validated',
      finalOutput: output,
      metrics: { model_calls: 1, reconciliation_calls: 0, full_retries: 0, total_input_tokens: 500, total_output_tokens: 500, model_info: { provider: 'anthropic', modelName: 'claude-sonnet-5', status: 'CANDIDATE' } },
    };
  };
}

// ─────────────────────────────────────────────────────────────────────────
// prepareTopicArtifact calls synthesis EXACTLY ONCE
// ─────────────────────────────────────────────────────────────────────────
async function testPrepareCallsSynthesisExactlyOnce() {
  const counter = { count: 0 };
  const result = await prepareTopicArtifact(FAKE_ENV, {
    topicSlug: 'x-topic', controlledTopic: 'x-topic', v1Result: baselineV1Result(),
    pageIntent: baselinePageIntent(), evidenceRows: baselineEvidenceRows(),
  }, { synthesizeFn: mockSynthesizeFn(counter, autoReadyOutput()) });

  check('PREPARE_ONCE', 'synthesis called exactly once', counter.count === 1, `count=${counter.count}`);
  check('PREPARE_ONCE', 'result ok', result.ok, JSON.stringify(result));
  check('PREPARE_ONCE', 'status AUTO_READY', result.status === 'AUTO_READY');
  check('PREPARE_ONCE', 'preparedArtifact has a record', !!(result.preparedArtifact && result.preparedArtifact.record));
  check('PREPARE_ONCE', 'preparedArtifact integrity is valid', result.preparedArtifact.integrity.valid === true, JSON.stringify(result.preparedArtifact.integrity));
}

async function testPrepareStillCallsOnceOnHumanReview() {
  const counter = { count: 0 };
  const humanReviewSynthesize = async () => {
    counter.count += 1;
    return {
      status: 'HUMAN_REVIEW', stage: 'initial', reason: 'model_declared_human_review',
      finalOutput: { ...autoReadyOutput(), recommended_disposition: 'HUMAN_REVIEW', human_review_justification: { reason_code: 'EVIDENCE_INSUFFICIENCY', reason: 'Genuinely insufficient methodological detail to resolve safely.', related_claim_ids: ['c1'] } },
      metrics: { model_calls: 1, reconciliation_calls: 0, full_retries: 0, total_input_tokens: 400, total_output_tokens: 300, model_info: {} },
    };
  };
  const result = await prepareTopicArtifact(FAKE_ENV, {
    topicSlug: 'x-topic', controlledTopic: 'x-topic', v1Result: baselineV1Result(),
    pageIntent: baselinePageIntent(), evidenceRows: baselineEvidenceRows(),
  }, { synthesizeFn: humanReviewSynthesize });

  check('PREPARE_HUMAN_REVIEW', 'synthesis still called exactly once (no automatic retry inside this module)', counter.count === 1, `count=${counter.count}`);
  check('PREPARE_HUMAN_REVIEW', 'result not ok', !result.ok);
  check('PREPARE_HUMAN_REVIEW', 'status HUMAN_REVIEW', result.status === 'HUMAN_REVIEW');
  check('PREPARE_HUMAN_REVIEW', 'no prepared artifact produced', result.preparedArtifact === null);
  check('PREPARE_HUMAN_REVIEW', 'justification surfaced', result.humanReviewJustification && result.humanReviewJustification.reason_code === 'EVIDENCE_INSUFFICIENCY');
}

// ─────────────────────────────────────────────────────────────────────────
// publishPreparedArtifact NEVER triggers synthesis (it has no such
// parameter at all -- structural, not disciplinary)
// ─────────────────────────────────────────────────────────────────────────
async function testFullRoundTripCallsSynthesisExactlyOnceTotal() {
  const counter = { count: 0 };
  const prepareResult = await prepareTopicArtifact(FAKE_ENV, {
    topicSlug: 'x-topic', controlledTopic: 'x-topic', v1Result: baselineV1Result(),
    pageIntent: baselinePageIntent(), evidenceRows: baselineEvidenceRows(),
  }, { synthesizeFn: mockSynthesizeFn(counter, autoReadyOutput()) });

  let writeCallCount = 0;
  let writtenRecord = null;
  const publishResult = await publishPreparedArtifact(prepareResult.preparedArtifact, {
    writeFn: async (record) => { writeCallCount += 1; writtenRecord = record; return [{ ...record }]; },
  });

  check('ROUND_TRIP', 'synthesis called exactly once across the WHOLE prepare+publish round trip', counter.count === 1, `count=${counter.count}`);
  check('ROUND_TRIP', 'write called exactly once', writeCallCount === 1);
  check('ROUND_TRIP', 'publish succeeded', publishResult.ok, JSON.stringify(publishResult));
  check('ROUND_TRIP', 'the EXACT prepared record is what got written (same generation_source_hash)', writtenRecord.generation_source_hash === prepareResult.preparedArtifact.record.generation_source_hash);
}

async function testPublishRefusesATamperedArtifact() {
  const counter = { count: 0 };
  const prepareResult = await prepareTopicArtifact(FAKE_ENV, {
    topicSlug: 'x-topic', controlledTopic: 'x-topic', v1Result: baselineV1Result(),
    pageIntent: baselinePageIntent(), evidenceRows: baselineEvidenceRows(),
  }, { synthesizeFn: mockSynthesizeFn(counter, autoReadyOutput()) });

  const tampered = { ...prepareResult.preparedArtifact, record: { ...prepareResult.preparedArtifact.record, generation_source_hash: '0'.repeat(64) } };
  let writeCallCount = 0;
  const publishResult = await publishPreparedArtifact(tampered, { writeFn: async (record) => { writeCallCount += 1; return [record]; } });

  check('TAMPER_REFUSED', 'publish refuses a tampered artifact', !publishResult.ok);
  check('TAMPER_REFUSED', 'zero writes for a tampered artifact', writeCallCount === 0);
  check('TAMPER_REFUSED', 'synthesis was NOT re-invoked to try to fix it', counter.count === 1, `count=${counter.count}`);
}

async function testPublishRefusesWithNoArtifact() {
  let writeCallCount = 0;
  const result = await publishPreparedArtifact(null, { writeFn: async () => { writeCallCount += 1; return []; } });
  check('NO_ARTIFACT', 'refuses', !result.ok);
  check('NO_ARTIFACT', 'zero writes', writeCallCount === 0);
}

const tests = [
  testPrepareCallsSynthesisExactlyOnce,
  testPrepareStillCallsOnceOnHumanReview,
  testFullRoundTripCallsSynthesisExactlyOnceTotal,
  testPublishRefusesATamperedArtifact,
  testPublishRefusesWithNoArtifact,
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
