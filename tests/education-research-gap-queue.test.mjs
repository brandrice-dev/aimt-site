// AIMT Research-Gap Feedback Loop v1 — deterministic tests for the
// pure decision logic in functions/_lib/education-ops/
// education-research-gap-queue.mjs. PURE, no network, no model call, no
// filesystem I/O anywhere in this file (the I/O wrappers are exercised
// only by shape/injection at the orchestrator and MCP-tool call sites
// -- see tests/education-operations-cycle.test.mjs and
// scripts/research-mcp-connector-test.mjs).
//
// Run: node tests/education-research-gap-queue.test.mjs

import {
  RESEARCH_GAP_CONTRACT_VERSION, RESEARCH_GAP_LANE, RESEARCH_GAP_STATUS,
  buildResearchGapQueueId, computeGapUpsertPayload, determineClaimTransition,
  determineResearchReceivedTransition, determineResolveTransition,
  determineGapLinkVerification, isTopicHeldByResearchGap,
} from '../functions/_lib/education-ops/education-research-gap-queue.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

function observed(overrides = {}) {
  return {
    topicSlug: 'alopecia-areata', cluster: 'hair-loss-shedding',
    pageConcept: 'Alopecia Areata Overview', publicIntent: 'Explain alopecia areata for practitioners.',
    inScopeConcepts: ['general presentation patterns'],
    gapSummary: 'Insufficient evidence for general presentation patterns and disease-course variability.',
    originatingRunId: 'run-7', originatingPageIntent: { topic_slug: 'alopecia-areata', route_slug: 'alopecia-areata' },
    baselineCandidateClaimIds: ['c1', 'c2', 'c3'],
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// buildResearchGapQueueId
// ─────────────────────────────────────────────────────────────────────────
(function testQueueIdIsDeterministicAndLaneNamespaced() {
  check('QUEUE_ID', 'deterministic for the same topic', buildResearchGapQueueId('alopecia-areata') === buildResearchGapQueueId('alopecia-areata'));
  check('QUEUE_ID', 'namespaced with the lane', buildResearchGapQueueId('alopecia-areata') === `${RESEARCH_GAP_LANE}:alopecia-areata`);
  check('QUEUE_ID', 'different for different topics', buildResearchGapQueueId('a') !== buildResearchGapQueueId('b'));
})();

// ─────────────────────────────────────────────────────────────────────────
// computeGapUpsertPayload -- B (idempotent update, no duplicate), K
// (second EVIDENCE_INSUFFICIENCY updates baseline+summary, returns to
// pending), and the fresh-cycle-after-resolution behavior.
// ─────────────────────────────────────────────────────────────────────────
(function testFreshGapHasAttemptCountOneAndCorrectShape() {
  const payload = computeGapUpsertPayload(null, observed());
  check('FRESH_GAP', 'queue_id is deterministic', payload.queue_id === buildResearchGapQueueId('alopecia-areata'));
  check('FRESH_GAP', 'lane is publication_evidence_gap', payload.lane === RESEARCH_GAP_LANE);
  check('FRESH_GAP', 'item_type is education_page', payload.item_type === 'education_page');
  check('FRESH_GAP', 'item_id is the topic_slug', payload.item_id === 'alopecia-areata');
  check('FRESH_GAP', 'status is pending', payload.status === RESEARCH_GAP_STATUS.PENDING);
  check('FRESH_GAP', 'priority_band is high', payload.priority_band === 'high');
  check('FRESH_GAP', 'attempt_count is 1', payload.extras.attempt_count === 1);
  check('FRESH_GAP', 'contract_version is set', payload.extras.contract_version === RESEARCH_GAP_CONTRACT_VERSION);
  check('FRESH_GAP', 'baseline_candidate_claim_ids copied', JSON.stringify(payload.extras.baseline_candidate_claim_ids) === JSON.stringify(['c1', 'c2', 'c3']));
  check('FRESH_GAP', 'no claim/research/resolve timestamps yet', payload.extras.claimed_at === null && payload.extras.research_batch_id === null && payload.extras.resolved_at === null);
  check('FRESH_GAP', 'never stores raw model output -- only the governed structured fields', !('finalOutput' in payload.extras) && !('rawOutput' in payload.extras));
})();

(function testRepeatedInsufficiencyUpdatesTheSameGapNoDuplicate() {
  // B: 5 repeated EVIDENCE_INSUFFICIENCY observations -> the SAME
  // deterministic queue_id every time, attempt_count incrementing, never
  // a new/different id.
  let existing = null;
  const ids = new Set();
  for (let i = 1; i <= 5; i++) {
    const payload = computeGapUpsertPayload(existing, observed({ gapSummary: `Attempt ${i} summary.` }));
    ids.add(payload.queue_id);
    existing = payload; // simulate "this is now on disk" for the next iteration
  }
  check('REPEATED_INSUFFICIENCY', 'exactly one distinct queue_id across 5 observations', ids.size === 1, [...ids].join(','));
  check('REPEATED_INSUFFICIENCY', 'attempt_count reaches 5, not reset', existing.extras.attempt_count === 5, existing.extras.attempt_count);
})();

(function testSecondObservationUpdatesBaselineAndSummaryAndReturnsToPending() {
  // K: an existing gap in a non-fresh state (claimed) -- a NEW
  // EVIDENCE_INSUFFICIENCY observation must update baseline+summary,
  // increment attempt_count, and return status to pending (never stays
  // claimed/research_received).
  const existingRow = computeGapUpsertPayload(null, observed());
  const claimedRow = { ...existingRow, status: RESEARCH_GAP_STATUS.CLAIMED, extras: { ...existingRow.extras, claimed_at: '2026-09-01T00:00:00Z', claimed_by: 'grok-research-harvester' } };

  const second = computeGapUpsertPayload(claimedRow, observed({ gapSummary: 'A new, different summary after Rick submitted more research.', baselineCandidateClaimIds: ['c1', 'c2', 'c3', 'c4-new'] }));
  check('SECOND_OBSERVATION', 'status returns to pending', second.status === RESEARCH_GAP_STATUS.PENDING, second.status);
  check('SECOND_OBSERVATION', 'attempt_count increments (2)', second.extras.attempt_count === 2, second.extras.attempt_count);
  check('SECOND_OBSERVATION', 'gap_summary is the NEW one', second.extras.gap_summary === 'A new, different summary after Rick submitted more research.');
  check('SECOND_OBSERVATION', 'baseline is the NEW candidate set', JSON.stringify(second.extras.baseline_candidate_claim_ids) === JSON.stringify(['c1', 'c2', 'c3', 'c4-new']));
  check('SECOND_OBSERVATION', 'the prior claim is cleared -- reopened as pending, unclaimed', second.extras.claimed_at === null && second.extras.claimed_by === null);
  check('SECOND_OBSERVATION', 'queue_id is unchanged (same row, not a new one)', second.queue_id === existingRow.queue_id);
})();

(function testRecurrenceAfterResolutionStartsAFreshCycle() {
  const resolvedRow = { ...computeGapUpsertPayload(null, observed()), status: RESEARCH_GAP_STATUS.RESOLVED, extras: { ...computeGapUpsertPayload(null, observed()).extras, attempt_count: 3, resolved_at: '2026-08-01T00:00:00Z' } };
  const recurrence = computeGapUpsertPayload(resolvedRow, observed({ gapSummary: 'A brand new insufficiency, months later.' }));
  check('FRESH_CYCLE_AFTER_RESOLUTION', 'attempt_count resets to 1, not 4', recurrence.extras.attempt_count === 1, recurrence.extras.attempt_count);
  check('FRESH_CYCLE_AFTER_RESOLUTION', 'resolved_at is cleared', recurrence.extras.resolved_at === null);
  check('FRESH_CYCLE_AFTER_RESOLUTION', 'status is pending', recurrence.status === RESEARCH_GAP_STATUS.PENDING);
  check('FRESH_CYCLE_AFTER_RESOLUTION', 'same deterministic queue_id (one row per topic, ever)', recurrence.queue_id === resolvedRow.queue_id);
})();

(function testComputeGapUpsertPayloadNeverMutatesTheExistingRow() {
  const existingRow = computeGapUpsertPayload(null, observed());
  const before = JSON.stringify(existingRow);
  computeGapUpsertPayload(existingRow, observed({ gapSummary: 'different' }));
  check('IMMUTABILITY', 'the existing row passed in is never mutated', JSON.stringify(existingRow) === before);
})();

// ─────────────────────────────────────────────────────────────────────────
// determineClaimTransition -- M (idempotent, fails closed, governed
// non-success for resolved).
// ─────────────────────────────────────────────────────────────────────────
(function testClaimTransitions() {
  const pendingRow = computeGapUpsertPayload(null, observed());
  const claimed = determineClaimTransition(pendingRow, { claimedBy: 'grok-research-harvester', claimedAt: '2026-09-01T00:00:00Z' });
  check('CLAIM_TRANSITION', 'pending -> claimed succeeds', claimed.ok && claimed.payload.status === RESEARCH_GAP_STATUS.CLAIMED);
  check('CLAIM_TRANSITION', 'claimed_at/claimed_by recorded', claimed.payload.extras.claimed_at === '2026-09-01T00:00:00Z' && claimed.payload.extras.claimed_by === 'grok-research-harvester');

  const alreadyClaimedRow = { ...pendingRow, status: RESEARCH_GAP_STATUS.CLAIMED, extras: { ...pendingRow.extras, claimed_at: 'ORIGINAL', claimed_by: 'grok-research-harvester' } };
  const idempotent = determineClaimTransition(alreadyClaimedRow, { claimedBy: 'grok-research-harvester', claimedAt: 'NEW-ATTEMPT' });
  check('CLAIM_TRANSITION', 'claiming an already-claimed gap is idempotent (ok, no-op)', idempotent.ok && idempotent.payload === null);

  const resolvedRow = { ...pendingRow, status: RESEARCH_GAP_STATUS.RESOLVED };
  const onResolved = determineClaimTransition(resolvedRow, { claimedBy: 'x', claimedAt: 'y' });
  check('CLAIM_TRANSITION', 'claiming a resolved gap is a governed non-success (ok:false), not a thrown error', onResolved.ok === false && onResolved.reason === 'ALREADY_RESOLVED');

  const missing = determineClaimTransition(null, { claimedBy: 'x', claimedAt: 'y' });
  check('CLAIM_TRANSITION', 'a stale/missing gap fails closed', missing.ok === false && missing.reason === 'NOT_FOUND');

  const wrongLane = determineClaimTransition({ ...pendingRow, lane: 'source_verification' }, { claimedBy: 'x', claimedAt: 'y' });
  check('CLAIM_TRANSITION', 'a row outside the publication_evidence_gap lane is refused', wrongLane.ok === false && wrongLane.reason === 'WRONG_LANE');

  const receivedRow = { ...pendingRow, status: RESEARCH_GAP_STATUS.RESEARCH_RECEIVED };
  const notClaimable = determineClaimTransition(receivedRow, { claimedBy: 'x', claimedAt: 'y' });
  check('CLAIM_TRANSITION', 'research_received is not a valid source state for a fresh claim -- fails closed rather than guessing', notClaimable.ok === false && notClaimable.reason === 'NOT_CLAIMABLE_IN_CURRENT_STATUS');
})();

// ─────────────────────────────────────────────────────────────────────────
// determineResearchReceivedTransition / determineGapLinkVerification --
// O/P (only transitions when linkable; never on a resolved gap).
// ─────────────────────────────────────────────────────────────────────────
(function testResearchReceivedTransitions() {
  const pendingRow = computeGapUpsertPayload(null, observed());
  const received = determineResearchReceivedTransition(pendingRow, { researchBatchId: 'batch-1', receivedAt: '2026-09-05T00:00:00Z' });
  check('RESEARCH_RECEIVED_TRANSITION', 'succeeds for a pending gap', received.ok && received.payload.status === RESEARCH_GAP_STATUS.RESEARCH_RECEIVED);
  check('RESEARCH_RECEIVED_TRANSITION', 'records research_batch_id/research_received_at', received.payload.extras.research_batch_id === 'batch-1' && received.payload.extras.research_received_at === '2026-09-05T00:00:00Z');

  const resolvedRow = { ...pendingRow, status: RESEARCH_GAP_STATUS.RESOLVED };
  const onResolved = determineResearchReceivedTransition(resolvedRow, { researchBatchId: 'batch-2', receivedAt: 'x' });
  check('RESEARCH_RECEIVED_TRANSITION', 'never marks an already-resolved gap research_received', onResolved.ok === false && onResolved.reason === 'ALREADY_RESOLVED');

  const missing = determineResearchReceivedTransition(null, { researchBatchId: 'x', receivedAt: 'y' });
  check('RESEARCH_RECEIVED_TRANSITION', 'a missing gap fails closed', missing.ok === false && missing.reason === 'NOT_FOUND');
})();

(function testGapLinkVerification() {
  const pendingRow = computeGapUpsertPayload(null, observed());
  check('GAP_LINK_VERIFICATION', 'a real, active, correctly-laned gap is linkable', determineGapLinkVerification(pendingRow).ok === true);
  check('GAP_LINK_VERIFICATION', 'a missing row is not linkable', determineGapLinkVerification(null).ok === false);
  check('GAP_LINK_VERIFICATION', 'a wrong-lane row is not linkable', determineGapLinkVerification({ ...pendingRow, lane: 'source_verification' }).ok === false);
  check('GAP_LINK_VERIFICATION', 'a resolved gap is not linkable', determineGapLinkVerification({ ...pendingRow, status: RESEARCH_GAP_STATUS.RESOLVED }).ok === false);
})();

// ─────────────────────────────────────────────────────────────────────────
// determineResolveTransition -- J (AUTO_READY resolves), idempotent.
// ─────────────────────────────────────────────────────────────────────────
(function testResolveTransitions() {
  const pendingRow = computeGapUpsertPayload(null, observed());
  const resolved = determineResolveTransition(pendingRow, { resolvedAt: '2026-09-10T00:00:00Z' });
  check('RESOLVE_TRANSITION', 'a pending/claimed/research_received gap resolves', resolved.ok && resolved.payload.status === RESEARCH_GAP_STATUS.RESOLVED);
  check('RESOLVE_TRANSITION', 'records resolved_at', resolved.payload.extras.resolved_at === '2026-09-10T00:00:00Z');

  const alreadyResolved = { ...pendingRow, status: RESEARCH_GAP_STATUS.RESOLVED, extras: { ...pendingRow.extras, resolved_at: 'ORIGINAL' } };
  const idempotent = determineResolveTransition(alreadyResolved, { resolvedAt: 'NEW' });
  check('RESOLVE_TRANSITION', 'resolving an already-resolved gap is idempotent (ok, no-op)', idempotent.ok === true && idempotent.payload === null);

  const missing = determineResolveTransition(null, { resolvedAt: 'x' });
  check('RESOLVE_TRANSITION', 'a missing gap fails closed (ok:false)', missing.ok === false && missing.reason === 'NOT_FOUND');
})();

// ─────────────────────────────────────────────────────────────────────────
// isTopicHeldByResearchGap -- F/G/H/I (selector hold + release conditions).
// ─────────────────────────────────────────────────────────────────────────
(function testSelectorHoldAndRelease() {
  const pendingGap = computeGapUpsertPayload(null, observed({ baselineCandidateClaimIds: ['c1', 'c2', 'c3'] }));

  check('SELECTOR_HOLD', 'F: pending gap + unchanged candidate set -> held', isTopicHeldByResearchGap(pendingGap, ['c1', 'c2', 'c3']) === true);
  check('SELECTOR_HOLD', 'unchanged set in a DIFFERENT order is still unchanged (set semantics, not array order)', isTopicHeldByResearchGap(pendingGap, ['c3', 'c1', 'c2']) === true);

  const claimedGap = { ...pendingGap, status: RESEARCH_GAP_STATUS.CLAIMED };
  check('SELECTOR_HOLD', 'claimed gap + unchanged candidate set -> also held', isTopicHeldByResearchGap(claimedGap, ['c1', 'c2', 'c3']) === true);

  check('SELECTOR_HOLD', 'H: a NEW candidate claim id releases the topic', isTopicHeldByResearchGap(pendingGap, ['c1', 'c2', 'c3', 'c4-new']) === false);
  check('SELECTOR_HOLD', 'H: a REMOVED candidate claim id also releases the topic', isTopicHeldByResearchGap(pendingGap, ['c1', 'c2']) === false);

  const receivedGap = { ...pendingGap, status: RESEARCH_GAP_STATUS.RESEARCH_RECEIVED };
  check('SELECTOR_HOLD', 'I: research_received releases the topic even with an UNCHANGED candidate set', isTopicHeldByResearchGap(receivedGap, ['c1', 'c2', 'c3']) === false);

  const resolvedGap = { ...pendingGap, status: RESEARCH_GAP_STATUS.RESOLVED };
  check('SELECTOR_HOLD', 'a resolved gap never holds anything', isTopicHeldByResearchGap(resolvedGap, ['c1', 'c2', 'c3']) === false);

  check('SELECTOR_HOLD', 'no gap at all -> never held', isTopicHeldByResearchGap(null, ['c1', 'c2', 'c3']) === false);
  check('SELECTOR_HOLD', 'undefined gap -> never held', isTopicHeldByResearchGap(undefined, []) === false);
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
