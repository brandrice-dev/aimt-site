// AIMT Education Operations v1 — deterministic tests for the reviewer
// output aggregation (functions/_lib/education-ops/
// education-reviewer-validator.mjs). PURE, no model call.
//
// Run: node tests/education-reviewer-validator.test.mjs

import { aggregateReviewOutcome, REVIEW_OUTCOME } from '../functions/_lib/education-ops/education-reviewer-validator.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

function baseline(overrides = {}) {
  return {
    paraphrase_reviews: [{ location: 'sections:0:1', verdict: 'ENTAILED', reason: 'Faithful.' }],
    framing_reviews: [{ location: 'sections:0:0', verdict: 'NON_FACTUAL', reason: 'Pure orientation.' }],
    voice_verdict: 'PASS', voice_reason: 'Reads as AIMT voice.',
    scope_verdict: 'PASS', scope_reason: 'Stays in scope.',
    ...overrides,
  };
}

(function testAllPassProducesPass() {
  const outcome = aggregateReviewOutcome(baseline());
  check('ALL_PASS', 'outcome is PASS', outcome.outcome === REVIEW_OUTCOME.PASS);
  check('ALL_PASS', 'zero failing paraphrases', outcome.failing_paraphrases.length === 0);
  check('ALL_PASS', 'zero failing framings', outcome.failing_framings.length === 0);
})();

(function testCarriesScienceIsAlwaysSubstantive() {
  const outcome = aggregateReviewOutcome(baseline({
    framing_reviews: [{ location: 'sections:0:0', verdict: 'CARRIES_SCIENCE', reason: 'Smuggles in a mechanism claim.' }],
  }));
  check('CARRIES_SCIENCE', 'outcome is SUBSTANTIVE_FAIL, never repairable', outcome.outcome === REVIEW_OUTCOME.SUBSTANTIVE_FAIL);
  check('CARRIES_SCIENCE', 'the failing framing unit is reported', outcome.failing_framings.length === 1);
})();

(function testEverySubstantiveParaphraseVerdictIsSubstantive() {
  for (const verdict of ['TOO_STRONG', 'OUTSIDE_EVIDENCE', 'CAUSALITY_DRIFT', 'NUMERIC_DRIFT', 'OTHER_FAIL']) {
    const outcome = aggregateReviewOutcome(baseline({
      paraphrase_reviews: [{ location: 'sections:0:1', verdict, reason: 'x' }],
    }));
    check('SUBSTANTIVE_PARAPHRASE_VERDICTS', `${verdict} is SUBSTANTIVE_FAIL, never repairable`, outcome.outcome === REVIEW_OUTCOME.SUBSTANTIVE_FAIL, outcome.outcome);
  }
})();

(function testVoiceFailIsSubstantive() {
  const outcome = aggregateReviewOutcome(baseline({ voice_verdict: 'FAIL', voice_reason: 'Reads like a journal abstract.' }));
  check('VOICE_FAIL', 'outcome is SUBSTANTIVE_FAIL', outcome.outcome === REVIEW_OUTCOME.SUBSTANTIVE_FAIL);
  check('VOICE_FAIL', 'voice_fail flag set', outcome.voice_fail === true);
})();

(function testScopeFailIsSubstantive() {
  const outcome = aggregateReviewOutcome(baseline({ scope_verdict: 'FAIL', scope_reason: 'Drifts into treatment territory.' }));
  check('SCOPE_FAIL', 'outcome is SUBSTANTIVE_FAIL', outcome.outcome === REVIEW_OUTCOME.SUBSTANTIVE_FAIL);
  check('SCOPE_FAIL', 'scope_fail flag set', outcome.scope_fail === true);
})();

(function testNoAutomaticRepairInV1() {
  // Documented v1 policy: NO paraphrase verdict is currently classified
  // repairable, so REPAIRABLE_FAIL can never actually occur yet -- any
  // failure routes straight to EDITORIAL_REVIEW. This test locks that
  // conservative default in place; enabling a repairable verdict is a
  // deliberate, documented future change, not an accident.
  const anyFailingOutcome = aggregateReviewOutcome(baseline({
    paraphrase_reviews: [{ location: 'x', verdict: 'TOO_STRONG', reason: 'x' }],
  }));
  check('NO_AUTO_REPAIR', 'REPAIRABLE_FAIL is never produced in v1', anyFailingOutcome.outcome !== REVIEW_OUTCOME.REPAIRABLE_FAIL);
})();

(function testMultipleFailuresAllReported() {
  const outcome = aggregateReviewOutcome(baseline({
    paraphrase_reviews: [
      { location: 'a', verdict: 'ENTAILED', reason: 'ok' },
      { location: 'b', verdict: 'NUMERIC_DRIFT', reason: 'bad' },
    ],
    framing_reviews: [{ location: 'c', verdict: 'CARRIES_SCIENCE', reason: 'bad' }],
  }));
  check('MULTIPLE_FAILURES', 'exactly one failing paraphrase reported', outcome.failing_paraphrases.length === 1);
  check('MULTIPLE_FAILURES', 'exactly one failing framing reported', outcome.failing_framings.length === 1);
  check('MULTIPLE_FAILURES', 'summary mentions both counts', outcome.summary.includes('1 paraphrase') && outcome.summary.includes('1 framing'), outcome.summary);
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
