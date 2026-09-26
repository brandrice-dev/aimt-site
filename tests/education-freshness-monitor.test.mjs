// AIMT Education Operations v1 — deterministic tests for
// computeFreshnessDelta (functions/_lib/education-ops/
// education-freshness-monitor.mjs). PURE, no network -- the I/O
// wrapper (checkTopicFreshness) is exercised only via its shape, not a
// live Supabase call.
//
// Run: node tests/education-freshness-monitor.test.mjs

import { computeFreshnessDelta, FRESHNESS_STATE, FreshnessMonitorError } from '../functions/_lib/education-ops/education-freshness-monitor.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

function baseRow(overrides = {}) {
  return {
    topic_slug: 'telogen-effluvium',
    generation_source_hash: 'abc123',
    key_claim_ids: ['c1', 'c2', 'c3'],
    publication_clearance: {
      excluded_claim_ids: [{ claim_id: 'c4', reason_code: 'OTHER', reason: 'x' }, { claim_id: 'c5', reason_code: 'OTHER', reason: 'x' }],
    },
    ...overrides,
  };
}

(function testFreshWhenNoDelta() {
  const row = baseRow();
  const delta = computeFreshnessDelta(row, ['c1', 'c2', 'c3', 'c4', 'c5']);
  check('FRESH', 'state is FRESH when current candidates exactly match considered claims', delta.state === FRESHNESS_STATE.FRESH, delta.state);
  check('FRESH', 'zero new claim ids', delta.new_claim_ids.length === 0);
  check('FRESH', 'zero removed claim ids', delta.removed_claim_ids.length === 0);
})();

(function testPotentialChangeOnNewClaim() {
  const row = baseRow();
  const delta = computeFreshnessDelta(row, ['c1', 'c2', 'c3', 'c4', 'c5', 'c6-new']);
  check('NEW_CLAIM', 'state is POTENTIAL_EVIDENCE_CHANGE', delta.state === FRESHNESS_STATE.POTENTIAL_EVIDENCE_CHANGE);
  check('NEW_CLAIM', 'new claim id reported', delta.new_claim_ids.includes('c6-new') && delta.new_claim_ids.length === 1, JSON.stringify(delta.new_claim_ids));
  check('NEW_CLAIM', 'zero removed claims', delta.removed_claim_ids.length === 0);
})();

(function testPotentialChangeOnRemovedClaim() {
  const row = baseRow();
  const delta = computeFreshnessDelta(row, ['c1', 'c2', 'c3', 'c4']); // c5 no longer a candidate
  check('REMOVED_CLAIM', 'state is POTENTIAL_EVIDENCE_CHANGE', delta.state === FRESHNESS_STATE.POTENTIAL_EVIDENCE_CHANGE);
  check('REMOVED_CLAIM', 'removed claim id reported', delta.removed_claim_ids.includes('c5') && delta.removed_claim_ids.length === 1, JSON.stringify(delta.removed_claim_ids));
  check('REMOVED_CLAIM', 'zero new claims', delta.new_claim_ids.length === 0);
})();

(function testConsidersBothSelectedAndExcluded() {
  const row = baseRow();
  const delta = computeFreshnessDelta(row, ['c1', 'c2', 'c3', 'c4', 'c5']);
  check('ACCOUNTING', 'considered_claim_count_at_clearance counts BOTH selected and excluded claims', delta.considered_claim_count_at_clearance === 5, delta.considered_claim_count_at_clearance);
})();

(function testThrowsOnMissingClearancePayload() {
  let threw = false;
  try {
    computeFreshnessDelta({ topic_slug: 'x' }, ['c1']);
  } catch (e) {
    threw = e instanceof FreshnessMonitorError;
  }
  check('MALFORMED_ROW', 'throws FreshnessMonitorError when publication_clearance is missing', threw);
})();

(function testNeverConflatesWithIntegrity() {
  // computeFreshnessDelta never inspects generation_source_hash for
  // validity, fingerprint recomputation, or anything integrity-related
  // -- that stays verifyStoredClearanceIntegrity()'s job entirely. This
  // test asserts the freshness delta is unaffected by an obviously
  // "wrong-looking" hash, proving the two concerns really are decoupled.
  const row = baseRow({ generation_source_hash: 'not-a-real-hash-at-all' });
  const delta = computeFreshnessDelta(row, ['c1', 'c2', 'c3', 'c4', 'c5']);
  check('DECOUPLED_FROM_INTEGRITY', 'freshness state is still FRESH regardless of hash validity (not this module\'s concern)', delta.state === FRESHNESS_STATE.FRESH);
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
