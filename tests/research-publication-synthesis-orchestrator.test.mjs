// AIMT Publication Editor v2.1 — deterministic unit tests for the
// bounded synthesis orchestrator (functions/_lib/research/
// publication-synthesis-orchestrator.mjs). NO LIVE/MODEL CALLS: every
// synthesizeFn/reconcileFn/retryFn below is an injected fake returning a
// canned result, exactly the mechanism that makes the bounded-retry
// state machine testable without touching Anthropic or Supabase.
//
// Run: node tests/research-publication-synthesis-orchestrator.test.mjs

import { runSynthesisPipeline } from '../functions/_lib/research/publication-synthesis-orchestrator.mjs';
import { RISK_TIER, READINESS_STATUS } from '../functions/_lib/research/publication-readiness.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

function makeClaim(overrides = {}) {
  return {
    claim_id: 'c1', claim_text: 'text', source_id: 's1', claim_type: 'finding', direction: 'descriptive',
    population_or_scope: null, page_or_section_locator: null, claim_origin: 'primary_text',
    verification_status: 'CLAIM_VERIFIED', use_status: 'active', ...overrides,
  };
}
function makeSource(overrides = {}) {
  return {
    source_id: 's1', title: 'A Reference', authors: ['A'], year: 2022, date_published: null,
    source_venue: 'J', doi: '10.1/x', pmid: null, pmcid: null, url: null,
    evidence_type: 'narrative_review', source_role: 'synthesis', ...overrides,
  };
}
function baselineBundle() {
  return {
    claims: [
      makeClaim({ claim_id: 'c1', claim_type: 'finding', source_id: 's1' }),
      makeClaim({ claim_id: 'c2', claim_type: 'limitation', source_id: 's1' }),
      makeClaim({ claim_id: 'c3', claim_type: 'finding', source_id: 's2', direction: 'supports_effect' }),
    ],
    sources: [makeSource({ source_id: 's1' }), makeSource({ source_id: 's2', title: 'Another Reference' })],
  };
}
function baselineV1Result(overrides = {}) {
  return {
    topic_slug: 'hair-cycle',
    risk_tier: RISK_TIER.LOWER,
    readiness_status: READINESS_STATUS.NEEDS_SYNTHESIS,
    evidence_gaps: [],
    conflict_flags: ['POTENTIAL_CONFLICT_REQUIRES_SYNTHESIS'],
    synthesis_packet: {
      controlled_topics: ['hair-cycle'],
      candidate_claim_ids: ['c1', 'c2', 'c3'],
      candidate_source_ids: ['s1', 's2'],
      safety_claim_ids: [],
      synthesis_required_flags: ['POTENTIAL_CONFLICT_REQUIRES_SYNTHESIS'],
    },
    ...overrides,
  };
}
// Complete, valid output for all 3 baseline claims -- the "happy path".
function completeAiOutput(overrides = {}) {
  return {
    topic_slug: 'hair-cycle',
    page_concept: 'The Hair Growth Cycle',
    recommended_disposition: 'AUTO_READY',
    confidence: 'high',
    page_scope: { include: ['cycling'], exclude: ['treatment'] },
    selected_claims: [
      { claim_id: 'c1', role: 'core_finding', reason: 'ok' },
      { claim_id: 'c2', role: 'limitation', reason: 'ok' },
    ],
    excluded_claims: [
      { claim_id: 'c3', reason_code: 'OUT_OF_SCOPE_TREATMENT_OR_INTERVENTION', reason: 'unrelated' },
    ],
    resolved_synthesis_signals: [{ signal: 'x', resolution: 'y', claim_ids: ['c3'] }],
    unresolved_issues: [],
    human_review_justification: { reason_code: 'NOT_APPLICABLE', reason: 'Not applicable', related_claim_ids: [] },
    public_framing: {
      core_points: [{ statement: 'Cycling.', supporting_claim_ids: ['c1'] }],
      limitations: [{ statement: 'Timing varies.', supporting_claim_ids: ['c2'] }],
      scope_note: 'n/a',
    },
    ...overrides,
  };
}
// Same shape but c3 never receives a disposition -- triggers CLAIM_MISSING_DISPOSITION.
function incompleteAiOutput() {
  const out = completeAiOutput();
  out.excluded_claims = []; // c3 now has no disposition at all
  out.resolved_synthesis_signals = [{ signal: 'x', resolution: 'y', claim_ids: ['c1'] }]; // still non-empty (packet requires this)
  return out;
}

function okResult(output, usage = { input_tokens: 100, output_tokens: 100 }) {
  return { ok: true, output, modelInfo: { provider: 'anthropic', modelName: 'claude-sonnet-5', status: 'CANDIDATE' }, usage, rawText: JSON.stringify(output) };
}
function failResult(reason) {
  return { ok: false, reason, detail: null };
}

function callCounter() {
  const calls = [];
  const fn = async (...args) => { calls.push(args); return fn.__next.shift(); };
  fn.__next = [];
  fn.calls = calls;
  fn.willReturn = (r) => { fn.__next.push(r); return fn; };
  return fn;
}

// ─────────────────────────────────────────────────────────────────────────
// Baseline happy path: fully valid initial synthesis -> AUTO_READY, no
// reconciliation ever attempted.
// ─────────────────────────────────────────────────────────────────────────
async function testHappyPathNoReconciliationNeeded() {
  const synthesizeFn = callCounter().willReturn(okResult(completeAiOutput()));
  const reconcileFn = callCounter();
  const retryFn = callCounter();
  const result = await runSynthesisPipeline({}, {
    topic_slug: 'hair-cycle', v1Result: baselineV1Result(), evidenceBundle: baselineBundle(),
    fns: { synthesizeFn, reconcileFn, retryFn },
  });
  check('HAPPY_PATH', 'AUTO_READY', result.status === 'AUTO_READY', result.status);
  check('HAPPY_PATH', 'stage is initial', result.stage === 'initial', result.stage);
  check('HAPPY_PATH', 'reconcileFn never called', reconcileFn.calls.length === 0);
  check('HAPPY_PATH', 'retryFn never called', retryFn.calls.length === 0);
  check('HAPPY_PATH', 'metrics.model_calls is 1', result.metrics.model_calls === 1, result.metrics.model_calls);
}

// ─────────────────────────────────────────────────────────────────────────
// 3. Reconciliation resolves missing claim as EXCLUDED, no material change
//    -> merged output validates -> AUTO_READY
// ─────────────────────────────────────────────────────────────────────────
async function testReconciliationExcludedNoMaterialChangeMerges() {
  const synthesizeFn = callCounter().willReturn(okResult(incompleteAiOutput()));
  const reconcileFn = callCounter().willReturn(okResult({
    resolutions: [{
      claim_id: 'c3', disposition: 'EXCLUDED', role: null,
      reason_code: 'OUT_OF_SCOPE_TREATMENT_OR_INTERVENTION', reason: 'unrelated',
      materially_changes_existing_synthesis: false, material_change_reason: null,
    }],
  }));
  const retryFn = callCounter();
  const result = await runSynthesisPipeline({}, {
    topic_slug: 'hair-cycle', v1Result: baselineV1Result(), evidenceBundle: baselineBundle(),
    fns: { synthesizeFn, reconcileFn, retryFn },
  });
  check('RECONCILE_EXCLUDE_MERGE', 'AUTO_READY', result.status === 'AUTO_READY', JSON.stringify(result));
  check('RECONCILE_EXCLUDE_MERGE', 'stage is reconciliation-merge', result.stage === 'reconciliation-merge', result.stage);
  check('RECONCILE_EXCLUDE_MERGE', 'retryFn never called', retryFn.calls.length === 0);
  check('RECONCILE_EXCLUDE_MERGE', 'metrics.reconciliation_calls is 1', result.metrics.reconciliation_calls === 1);
  check('RECONCILE_EXCLUDE_MERGE', 'c3 present in final excluded_claims', result.finalOutput.excluded_claims.some((c) => c.claim_id === 'c3'));
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Reconciliation resolves the missing claim as SELECTED, no material
//    change -> merged validates when all validator rules pass.
// ─────────────────────────────────────────────────────────────────────────
async function testReconciliationSelectedNoMaterialChangeMerges() {
  const synthesizeFn = callCounter().willReturn(okResult(incompleteAiOutput()));
  const reconcileFn = callCounter().willReturn(okResult({
    resolutions: [{
      claim_id: 'c3', disposition: 'SELECTED', role: 'supporting_context',
      reason_code: null, reason: 'Adds context.',
      materially_changes_existing_synthesis: false, material_change_reason: null,
    }],
  }));
  const retryFn = callCounter();
  const result = await runSynthesisPipeline({}, {
    topic_slug: 'hair-cycle', v1Result: baselineV1Result(), evidenceBundle: baselineBundle(),
    fns: { synthesizeFn, reconcileFn, retryFn },
  });
  check('RECONCILE_SELECT_MERGE', 'AUTO_READY', result.status === 'AUTO_READY', JSON.stringify(result));
  check('RECONCILE_SELECT_MERGE', 'c3 present in final selected_claims', result.finalOutput.selected_claims.some((c) => c.claim_id === 'c3'));
}

// ─────────────────────────────────────────────────────────────────────────
// 5/6. Reconciliation signals a material change -> bounded full retry ->
//      retry validates -> AUTO_READY.
// ─────────────────────────────────────────────────────────────────────────
async function testMaterialChangeTriggersRetryWhichValidates() {
  const synthesizeFn = callCounter().willReturn(okResult(incompleteAiOutput()));
  const reconcileFn = callCounter().willReturn(okResult({
    resolutions: [{
      claim_id: 'c3', disposition: 'SELECTED', role: 'core_finding',
      reason_code: null, reason: 'Actually central.',
      materially_changes_existing_synthesis: true, material_change_reason: 'Changes a core point.',
    }],
  }));
  const retryFn = callCounter().willReturn(okResult(completeAiOutput({
    selected_claims: [
      { claim_id: 'c1', role: 'core_finding', reason: 'ok' },
      { claim_id: 'c2', role: 'limitation', reason: 'ok' },
      { claim_id: 'c3', role: 'core_finding', reason: 'reconsidered' },
    ],
    excluded_claims: [],
    public_framing: {
      core_points: [
        { statement: 'Cycling.', supporting_claim_ids: ['c1'] },
        { statement: 'Reconsidered point.', supporting_claim_ids: ['c3'] },
      ],
      limitations: [{ statement: 'Timing varies.', supporting_claim_ids: ['c2'] }],
      scope_note: 'n/a',
    },
  })));
  const result = await runSynthesisPipeline({}, {
    topic_slug: 'hair-cycle', v1Result: baselineV1Result(), evidenceBundle: baselineBundle(),
    fns: { synthesizeFn, reconcileFn, retryFn },
  });
  check('MATERIAL_CHANGE_RETRY', 'retryFn was called exactly once', retryFn.calls.length === 1);
  check('MATERIAL_CHANGE_RETRY', 'final status is AUTO_READY', result.status === 'AUTO_READY', JSON.stringify(result));
  check('MATERIAL_CHANGE_RETRY', 'stage is full_retry', result.stage === 'full_retry', result.stage);
  check('MATERIAL_CHANGE_RETRY', 'metrics.full_retries is 1', result.metrics.full_retries === 1);
}

// ─────────────────────────────────────────────────────────────────────────
// 7. Reconciliation output missing an expected ID -> SYNTHESIS_FAILED
// ─────────────────────────────────────────────────────────────────────────
async function testReconciliationMissingExpectedIdFails() {
  const synthesizeFn = callCounter().willReturn(okResult(incompleteAiOutput()));
  const reconcileFn = callCounter().willReturn(okResult({ resolutions: [] })); // never resolves c3 at all
  const retryFn = callCounter();
  const result = await runSynthesisPipeline({}, {
    topic_slug: 'hair-cycle', v1Result: baselineV1Result(), evidenceBundle: baselineBundle(),
    fns: { synthesizeFn, reconcileFn, retryFn },
  });
  check('RECONCILE_MISSING_ID', 'SYNTHESIS_FAILED', result.status === 'SYNTHESIS_FAILED', result.status);
  check('RECONCILE_MISSING_ID', 'reason names invalid reconciliation output', result.reason === 'invalid_reconciliation_output', result.reason);
  check('RECONCILE_MISSING_ID', 'retryFn never called', retryFn.calls.length === 0);
}

// ─────────────────────────────────────────────────────────────────────────
// 8. Reconciliation invents an ID -> SYNTHESIS_FAILED
// ─────────────────────────────────────────────────────────────────────────
async function testReconciliationInventedIdFails() {
  const synthesizeFn = callCounter().willReturn(okResult(incompleteAiOutput()));
  const reconcileFn = callCounter().willReturn(okResult({
    resolutions: [
      { claim_id: 'c3', disposition: 'EXCLUDED', role: null, reason_code: 'OTHER', reason: 'ok', materially_changes_existing_synthesis: false, material_change_reason: null },
      { claim_id: 'c999-invented', disposition: 'EXCLUDED', role: null, reason_code: 'OTHER', reason: 'hallucinated', materially_changes_existing_synthesis: false, material_change_reason: null },
    ],
  }));
  const retryFn = callCounter();
  const result = await runSynthesisPipeline({}, {
    topic_slug: 'hair-cycle', v1Result: baselineV1Result(), evidenceBundle: baselineBundle(),
    fns: { synthesizeFn, reconcileFn, retryFn },
  });
  check('RECONCILE_INVENTED_ID', 'SYNTHESIS_FAILED', result.status === 'SYNTHESIS_FAILED', result.status);
  check('RECONCILE_INVENTED_ID', 'retryFn never called', retryFn.calls.length === 0);
}

// ─────────────────────────────────────────────────────────────────────────
// 9. Hallucinated claim in the ORIGINAL synthesis -> does NOT enter the
//    reconciliation lane at all -> SYNTHESIS_FAILED directly.
// ─────────────────────────────────────────────────────────────────────────
async function testHallucinatedClaimInInitialNeverReconciles() {
  const badOutput = completeAiOutput({
    selected_claims: [
      { claim_id: 'c1', role: 'core_finding', reason: 'ok' },
      { claim_id: 'c2', role: 'limitation', reason: 'ok' },
      { claim_id: 'c999-hallucinated', role: 'core_finding', reason: 'invented' },
    ],
  });
  const synthesizeFn = callCounter().willReturn(okResult(badOutput));
  const reconcileFn = callCounter();
  const retryFn = callCounter();
  const result = await runSynthesisPipeline({}, {
    topic_slug: 'hair-cycle', v1Result: baselineV1Result(), evidenceBundle: baselineBundle(),
    fns: { synthesizeFn, reconcileFn, retryFn },
  });
  check('HALLUCINATED_INITIAL', 'SYNTHESIS_FAILED', result.status === 'SYNTHESIS_FAILED', result.status);
  check('HALLUCINATED_INITIAL', 'reconcileFn never called', reconcileFn.calls.length === 0);
  check('HALLUCINATED_INITIAL', 'retryFn never called', retryFn.calls.length === 0);
}

// ─────────────────────────────────────────────────────────────────────────
// 10. HIGH-risk v1 result -> HUMAN_REVIEW directly, no reconciliation.
// ─────────────────────────────────────────────────────────────────────────
async function testHighRiskGoesStraightToHumanReview() {
  const v1Result = baselineV1Result({ risk_tier: RISK_TIER.HIGH, synthesis_packet: { ...baselineV1Result().synthesis_packet } });
  const synthesizeFn = callCounter().willReturn(okResult(completeAiOutput()));
  const reconcileFn = callCounter();
  const retryFn = callCounter();
  const result = await runSynthesisPipeline({}, {
    topic_slug: 'hair-cycle', v1Result, evidenceBundle: baselineBundle(),
    fns: { synthesizeFn, reconcileFn, retryFn },
  });
  check('HIGH_RISK_DIRECT', 'HUMAN_REVIEW', result.status === 'HUMAN_REVIEW', result.status);
  check('HIGH_RISK_DIRECT', 'reconcileFn never called', reconcileFn.calls.length === 0);
}

// ─────────────────────────────────────────────────────────────────────────
// 11. Substantive unresolved issue -> HUMAN_REVIEW, no reconciliation.
// ─────────────────────────────────────────────────────────────────────────
async function testSubstantiveUnresolvedIssueGoesToHumanReview() {
  const badOutput = completeAiOutput({ unresolved_issues: ['Genuinely unclear.'] }); // AUTO_READY + unresolved_issues -> substantive violation
  const synthesizeFn = callCounter().willReturn(okResult(badOutput));
  const reconcileFn = callCounter();
  const retryFn = callCounter();
  const result = await runSynthesisPipeline({}, {
    topic_slug: 'hair-cycle', v1Result: baselineV1Result(), evidenceBundle: baselineBundle(),
    fns: { synthesizeFn, reconcileFn, retryFn },
  });
  check('SUBSTANTIVE_UNRESOLVED', 'HUMAN_REVIEW', result.status === 'HUMAN_REVIEW', result.status);
  check('SUBSTANTIVE_UNRESOLVED', 'reconcileFn never called', reconcileFn.calls.length === 0);
}

// ─────────────────────────────────────────────────────────────────────────
// GOVERNANCE FIX (seo/education-page-2-generalization pilot): a bare,
// unjustified HUMAN_REVIEW must trigger ONE bounded justification retry,
// never go straight to a final status.
// ─────────────────────────────────────────────────────────────────────────
function bareHumanReviewOutput() {
  return completeAiOutput({
    recommended_disposition: 'HUMAN_REVIEW',
    confidence: 'low',
    unresolved_issues: ['Something felt off.'],
    // left as the AUTO_READY default -- NOT_APPLICABLE -- exactly the bare case
  });
}

async function testUnjustifiedHumanReviewRetriesThenResolvesAutoReady() {
  const synthesizeFn = callCounter().willReturn(okResult(bareHumanReviewOutput()));
  const reconcileFn = callCounter();
  const retryFn = callCounter();
  const justifyRetryFn = callCounter().willReturn(okResult(completeAiOutput())); // reconsiders, resolves cleanly
  const result = await runSynthesisPipeline({}, {
    topic_slug: 'hair-cycle', v1Result: baselineV1Result(), evidenceBundle: baselineBundle(),
    fns: { synthesizeFn, reconcileFn, retryFn, justifyRetryFn },
  });
  check('UNJUSTIFIED_HR_RETRY_AUTO_READY', 'justifyRetryFn called exactly once', justifyRetryFn.calls.length === 1);
  check('UNJUSTIFIED_HR_RETRY_AUTO_READY', 'reconcileFn/retryFn never called (wrong lane)', reconcileFn.calls.length === 0 && retryFn.calls.length === 0);
  check('UNJUSTIFIED_HR_RETRY_AUTO_READY', 'final status is AUTO_READY', result.status === 'AUTO_READY', JSON.stringify(result));
  check('UNJUSTIFIED_HR_RETRY_AUTO_READY', 'stage is human_review_justification_retry', result.stage === 'human_review_justification_retry', result.stage);
  check('UNJUSTIFIED_HR_RETRY_AUTO_READY', 'metrics.full_retries is 1', result.metrics.full_retries === 1, result.metrics.full_retries);
}

async function testUnjustifiedHumanReviewRetryProducesValidJustifiedHumanReview() {
  const justifiedOutput = completeAiOutput({
    recommended_disposition: 'HUMAN_REVIEW',
    confidence: 'low',
    unresolved_issues: ['Claim c3 reports a treatment effect that cannot be safely reconciled with page scope.'],
    human_review_justification: {
      reason_code: 'UNRESOLVED_CONTRADICTION',
      reason: 'Claim c3 describes a treatment effect that conflicts with this page\'s descriptive-only scope and cannot be safely excluded without more context.',
      related_claim_ids: ['c3'],
    },
  });
  const synthesizeFn = callCounter().willReturn(okResult(bareHumanReviewOutput()));
  const justifyRetryFn = callCounter().willReturn(okResult(justifiedOutput));
  const result = await runSynthesisPipeline({}, {
    topic_slug: 'hair-cycle', v1Result: baselineV1Result(), evidenceBundle: baselineBundle(),
    fns: { synthesizeFn, reconcileFn: callCounter(), retryFn: callCounter(), justifyRetryFn },
  });
  check('UNJUSTIFIED_HR_RETRY_JUSTIFIED_HR', 'final status is HUMAN_REVIEW', result.status === 'HUMAN_REVIEW', result.status);
  check('UNJUSTIFIED_HR_RETRY_JUSTIFIED_HR', 'stage is human_review_justification_retry', result.stage === 'human_review_justification_retry', result.stage);
  check('UNJUSTIFIED_HR_RETRY_JUSTIFIED_HR', 'finalOutput carries the real justification', result.finalOutput.human_review_justification.reason_code === 'UNRESOLVED_CONTRADICTION');
}

async function testUnjustifiedHumanReviewRetryStillUnjustifiedFailsNeverLoops() {
  const synthesizeFn = callCounter().willReturn(okResult(bareHumanReviewOutput()));
  const reconcileFn = callCounter();
  const retryFn = callCounter();
  // The retry ITSELF is still a bare, unjustified HUMAN_REVIEW.
  const justifyRetryFn = callCounter().willReturn(okResult(bareHumanReviewOutput()));
  const result = await runSynthesisPipeline({}, {
    topic_slug: 'hair-cycle', v1Result: baselineV1Result(), evidenceBundle: baselineBundle(),
    fns: { synthesizeFn, reconcileFn, retryFn, justifyRetryFn },
  });
  check('UNJUSTIFIED_HR_RETRY_EXHAUSTED', 'final status is SYNTHESIS_FAILED, never a permanent unexplained HUMAN_REVIEW', result.status === 'SYNTHESIS_FAILED', result.status);
  check('UNJUSTIFIED_HR_RETRY_EXHAUSTED', 'justifyRetryFn called exactly once (no third attempt)', justifyRetryFn.calls.length === 1);
  check('UNJUSTIFIED_HR_RETRY_EXHAUSTED', 'reconcileFn/retryFn never called', reconcileFn.calls.length === 0 && retryFn.calls.length === 0);
}

// ─────────────────────────────────────────────────────────────────────────
// 12. Repeated accounting failure surviving the bounded retry ->
//     SYNTHESIS_FAILED, never a second reconciliation/retry (no loop).
// ─────────────────────────────────────────────────────────────────────────
async function testRepeatedAccountingFailureAfterRetryNeverLoops() {
  const synthesizeFn = callCounter().willReturn(okResult(incompleteAiOutput()));
  const reconcileFn = callCounter().willReturn(okResult({
    resolutions: [{
      claim_id: 'c3', disposition: 'SELECTED', role: 'core_finding',
      reason_code: null, reason: 'central after all',
      materially_changes_existing_synthesis: true, material_change_reason: 'Changes core framing.',
    }],
  }));
  // The retry ITSELF still fails to disposition c1 this time -- a fresh,
  // still-incomplete attempt (only c2 and c3 disposed).
  const retryFn = callCounter().willReturn(okResult({
    ...completeAiOutput(),
    selected_claims: [{ claim_id: 'c2', role: 'limitation', reason: 'ok' }, { claim_id: 'c3', role: 'core_finding', reason: 'ok' }],
    excluded_claims: [], // c1 never disposed
    public_framing: {
      core_points: [{ statement: 'x', supporting_claim_ids: ['c3'] }],
      limitations: [{ statement: 'y', supporting_claim_ids: ['c2'] }],
      scope_note: 'n/a',
    },
  }));
  const result = await runSynthesisPipeline({}, {
    topic_slug: 'hair-cycle', v1Result: baselineV1Result(), evidenceBundle: baselineBundle(),
    fns: { synthesizeFn, reconcileFn, retryFn },
  });
  check('NO_INFINITE_LOOP', 'final status is SYNTHESIS_FAILED, not HUMAN_REVIEW', result.status === 'SYNTHESIS_FAILED', result.status);
  check('NO_INFINITE_LOOP', 'reconcileFn called exactly once', reconcileFn.calls.length === 1);
  check('NO_INFINITE_LOOP', 'retryFn called exactly once', retryFn.calls.length === 1);
  check('NO_INFINITE_LOOP', 'metrics show bounded call counts', result.metrics.reconciliation_calls === 1 && result.metrics.full_retries === 1, JSON.stringify(result.metrics));
}

// ─────────────────────────────────────────────────────────────────────────
// Additional: model call failure at any stage never becomes AUTO_READY.
// ─────────────────────────────────────────────────────────────────────────
async function testInitialCallFailureIsSynthesisFailed() {
  const synthesizeFn = callCounter().willReturn(failResult('missing_api_key'));
  const result = await runSynthesisPipeline({}, {
    topic_slug: 'hair-cycle', v1Result: baselineV1Result(), evidenceBundle: baselineBundle(),
    fns: { synthesizeFn, reconcileFn: callCounter(), retryFn: callCounter() },
  });
  check('INITIAL_CALL_FAILURE', 'SYNTHESIS_FAILED', result.status === 'SYNTHESIS_FAILED', result.status);
  check('INITIAL_CALL_FAILURE', 'reason passed through', result.reason === 'missing_api_key', result.reason);
}

async function testReconciliationCallFailureIsSynthesisFailed() {
  const synthesizeFn = callCounter().willReturn(okResult(incompleteAiOutput()));
  const reconcileFn = callCounter().willReturn(failResult('request_failed'));
  const result = await runSynthesisPipeline({}, {
    topic_slug: 'hair-cycle', v1Result: baselineV1Result(), evidenceBundle: baselineBundle(),
    fns: { synthesizeFn, reconcileFn, retryFn: callCounter() },
  });
  check('RECONCILE_CALL_FAILURE', 'SYNTHESIS_FAILED', result.status === 'SYNTHESIS_FAILED', result.status);
}

// ---- Run all tests sequentially, then report ----
const tests = [
  testHappyPathNoReconciliationNeeded,
  testReconciliationExcludedNoMaterialChangeMerges,
  testReconciliationSelectedNoMaterialChangeMerges,
  testMaterialChangeTriggersRetryWhichValidates,
  testReconciliationMissingExpectedIdFails,
  testReconciliationInventedIdFails,
  testHallucinatedClaimInInitialNeverReconciles,
  testHighRiskGoesStraightToHumanReview,
  testSubstantiveUnresolvedIssueGoesToHumanReview,
  testUnjustifiedHumanReviewRetriesThenResolvesAutoReady,
  testUnjustifiedHumanReviewRetryProducesValidJustifiedHumanReview,
  testUnjustifiedHumanReviewRetryStillUnjustifiedFailsNeverLoops,
  testRepeatedAccountingFailureAfterRetryNeverLoops,
  testInitialCallFailureIsSynthesisFailed,
  testReconciliationCallFailureIsSynthesisFailed,
];

for (const t of tests) {
  await t();
}

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
