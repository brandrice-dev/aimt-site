// Deterministic tests for the certification scoring + critical-domain gate engine.
// Run: node tests/certification-scoring.test.mjs

import {
  scoreKnowledgeResponses,
  scoreCaseSubmission,
  computeAppliedCasesComponent,
  scoreInterviewConversation,
  computeInterviewComponent,
  computeOverallWeighted,
  evaluateCriticalDomains,
  determineCertificationDecision,
} from '../functions/_lib/certification/scoring.mjs';
import { getCurrentAssessmentConfig } from '../functions/_lib/certification/assessment-config.mjs';
import { HEAD_SPA_CRITICAL_DOMAINS } from '../functions/_lib/certification/critical-domains.mjs';

const config = getCurrentAssessmentConfig();
const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

function fixtureKnowledgeItem(overrides) {
  return {
    id: 'K1',
    correctChoice: 0,
    criticalDomainEvidence: [],
    distractorPatternTags: undefined,
    ...overrides,
  };
}

// ---- 50/30/20 weighting ----
(function weightingTest() {
  const overall = computeOverallWeighted({ knowledgePercent: 1, appliedCasesPercent: 0, interviewPercent: 0 }, config.weights);
  check('Weighting', 'Knowledge alone contributes exactly its weight (0.5)', Math.abs(overall - 0.5) < 1e-9, `got ${overall}`);

  const overall2 = computeOverallWeighted({ knowledgePercent: 0.8, appliedCasesPercent: 0.8, interviewPercent: 0.8 }, config.weights);
  check('Weighting', 'Equal 0.8 across all three components yields 0.8 overall', Math.abs(overall2 - 0.8) < 1e-9, `got ${overall2}`);

  const overall3 = computeOverallWeighted({ knowledgePercent: 1, appliedCasesPercent: 1, interviewPercent: 0 }, config.weights);
  check('Weighting', '50% knowledge + 30% cases + 0% interview = 0.8', Math.abs(overall3 - 0.8) < 1e-9, `got ${overall3}`);
})();

// ---- Independent component minimums (each condition is its own gate) ----
(function independentMinimumsTest() {
  const allDomainsClear = HEAD_SPA_CRITICAL_DOMAINS.map((d) => ({ domainId: d.id, cleared: true }));

  // knowledge*0.5 + cases*0.3 + interview*0.2 = 0.6*0.5 + 1*0.3 + 1*0.2 = 0.8 (meets the
  // overall gate) while knowledge itself (0.6) is well below its own 0.75 minimum.
  const highOverallLowKnowledge = determineCertificationDecision({
    knowledgePercent: 0.6,
    appliedCasesPercent: 1,
    interviewPercent: 1,
    criticalDomainResults: allDomainsClear,
    config,
  });
  check(
    'Independent minimums',
    'A passing overall score cannot compensate for knowledge below its own 75% minimum',
    highOverallLowKnowledge.decision === 'not_yet_passed' && highOverallLowKnowledge.gates.knowledge === false && highOverallLowKnowledge.gates.overall === true,
    JSON.stringify(highOverallLowKnowledge)
  );

  // Demonstrates the gates are genuinely independent in the OTHER direction too:
  // meeting every per-component minimum exactly (0.75/0.75/0.80) still weights out
  // to 0.76 overall, below the separate 0.80 overall minimum, so it still fails.
  const exactlyAtEveryComponentMinimumButNotOverall = determineCertificationDecision({
    knowledgePercent: 0.75,
    appliedCasesPercent: 0.75,
    interviewPercent: 0.8,
    criticalDomainResults: allDomainsClear,
    config,
  });
  check(
    'Independent minimums',
    'Meeting every component minimum exactly does not guarantee the separate overall minimum is met',
    exactlyAtEveryComponentMinimumButNotOverall.decision === 'not_yet_passed' &&
      exactlyAtEveryComponentMinimumButNotOverall.gates.knowledge === true &&
      exactlyAtEveryComponentMinimumButNotOverall.gates.appliedCases === true &&
      exactlyAtEveryComponentMinimumButNotOverall.gates.interview === true &&
      exactlyAtEveryComponentMinimumButNotOverall.gates.overall === false,
    JSON.stringify(exactlyAtEveryComponentMinimumButNotOverall)
  );

  const genuinelyPassing = determineCertificationDecision({
    knowledgePercent: 0.9,
    appliedCasesPercent: 0.75,
    interviewPercent: 0.8,
    criticalDomainResults: allDomainsClear,
    config,
  });
  check(
    'Independent minimums',
    'Clearing every component minimum AND the overall minimum passes',
    genuinelyPassing.decision === 'pass',
    JSON.stringify(genuinelyPassing)
  );

  const allScoresPerfectButOneDomainUncleared = determineCertificationDecision({
    knowledgePercent: 1,
    appliedCasesPercent: 1,
    interviewPercent: 1,
    criticalDomainResults: [
      { domainId: 'D1', cleared: true },
      { domainId: 'D2', cleared: false },
      { domainId: 'D3', cleared: true },
      { domainId: 'D4', cleared: true },
    ],
    config,
  });
  check(
    'Independent minimums',
    'A perfect score everywhere still fails with one uncleared critical domain',
    allScoresPerfectButOneDomainUncleared.decision === 'not_yet_passed' && allScoresPerfectButOneDomainUncleared.gates.criticalDomains === false,
    JSON.stringify(allScoresPerfectButOneDomainUncleared)
  );
})();

// ---- Interview numeric scoring ----
(function interviewScoringTest() {
  const interviewDef = {
    id: 'INT1',
    rubricCriteria: [
      { id: 'c1', criticalDomainEvidence: [] },
      { id: 'c2', criticalDomainEvidence: [] },
      { id: 'c3', criticalDomainEvidence: [] },
      { id: 'c4', criticalDomainEvidence: [] },
      { id: 'c5', criticalDomainEvidence: [] },
    ],
  };
  const perfect = scoreInterviewConversation(interviewDef, { c1: 2, c2: 2, c3: 2, c4: 2, c5: 2 });
  check('Interview numeric scoring', '5 criteria at max (2 each) = 10/10 = 100%', perfect.maxPoints === 10 && perfect.earned === 10 && perfect.percent === 1);

  const partial = scoreInterviewConversation(interviewDef, { c1: 2, c2: 1, c3: 1, c4: 0, c5: 2 });
  check('Interview numeric scoring', '2+1+1+0+2=6 of 10 = 60%', partial.earned === 6 && Math.abs(partial.percent - 0.6) < 1e-9, `earned=${partial.earned} percent=${partial.percent}`);

  const threeConversationComponent = computeInterviewComponent([{ percent: 1 }, { percent: 0.8 }, { percent: 0.6 }]);
  check('Interview numeric scoring', 'Component score averages across 3 conversations', Math.abs(threeConversationComponent.percent - 0.8) < 1e-9, `got ${threeConversationComponent.percent}`);
})();

// ---- Critical domain gating: single wrong MCQ never fails a domain alone ----
(function singleWrongMcqNeverFailsDomainTest() {
  const items = [
    fixtureKnowledgeItem({ id: 'K1', correctChoice: 0, criticalDomainEvidence: ['D1'] }),
    fixtureKnowledgeItem({ id: 'K2', correctChoice: 0, criticalDomainEvidence: [] }),
  ];
  // Student misses the one D1-tagged question, with no distractorPatternTags configured.
  const result = scoreKnowledgeResponses(items, { K1: 1, K2: 0 });
  const domainResults = evaluateCriticalDomains(result.evidencePoints, HEAD_SPA_CRITICAL_DOMAINS);
  const d1 = domainResults.find((d) => d.domainId === 'D1');
  check(
    'Single wrong MCQ never auto-fails a domain',
    'D1 remains cleared after exactly one missed domain-evidence MCQ with no explicit unsafe/pattern signal',
    d1.cleared === true,
    JSON.stringify(d1)
  );
  check(
    'Single wrong MCQ never auto-fails a domain',
    'Part I evidence points never carry explicitUnsafe=true',
    result.evidencePoints.every((e) => e.explicitUnsafe === false)
  );
})();

// ---- Type A: explicit unsafe reasoning from a case fails immediately regardless of score ----
(function typeATriggerTest() {
  const caseDef = {
    id: 'C1',
    criticalDomainEvidence: ['D2'],
    parts: [{ id: 'p1', type: 'single-best-answer', correctAnswer: 0 }],
    criticalFlags: [{ partId: 'p1', triggerType: 'choiceEquals', value: 2, domainId: 'D2', patternTag: null }],
    scoring: { weights: [1] },
  };
  // Student picks the unsafe-flagged choice (2), which is also wrong (correctAnswer 0),
  // but even a HIGH-scoring conversation elsewhere should not matter for Type A.
  const submission = scoreCaseSubmission(caseDef, { p1: 2 });
  const domainResults = evaluateCriticalDomains(submission.evidencePoints, HEAD_SPA_CRITICAL_DOMAINS);
  const d2 = domainResults.find((d) => d.domainId === 'D2');
  check('Type A trigger', 'An explicit unsafe case flag fails the domain', d2.cleared === false && d2.failureType === 'explicit_unsafe_reasoning', JSON.stringify(d2));

  const decision = determineCertificationDecision({
    knowledgePercent: 1,
    appliedCasesPercent: 1,
    interviewPercent: 1,
    criticalDomainResults: domainResults,
    config,
  });
  check('Type A trigger', 'A perfect score cannot override a Type A critical-domain failure', decision.decision === 'not_yet_passed', JSON.stringify(decision));
})();

// ---- Type B: repeated pattern requires threshold, not a single occurrence ----
(function typeBPatternTest() {
  const items = [
    fixtureKnowledgeItem({ id: 'K1', correctChoice: 0, criticalDomainEvidence: ['D4'], distractorPatternTags: { 1: 'shortens-contact-time' } }),
    fixtureKnowledgeItem({ id: 'K2', correctChoice: 0, criticalDomainEvidence: ['D4'], distractorPatternTags: { 1: 'shortens-contact-time' } }),
    fixtureKnowledgeItem({ id: 'K3', correctChoice: 0, criticalDomainEvidence: ['D4'], distractorPatternTags: { 1: 'unrelated-tag' } }),
  ];

  // Only one occurrence of the pattern -> should NOT fail (threshold is 2).
  const oneOccurrence = scoreKnowledgeResponses(items, { K1: 1, K2: 0, K3: 0 });
  const oneOccurrenceDomains = evaluateCriticalDomains(oneOccurrence.evidencePoints, HEAD_SPA_CRITICAL_DOMAINS);
  const d4One = oneOccurrenceDomains.find((d) => d.domainId === 'D4');
  check('Type B repeated pattern', 'A single pattern occurrence does not fail the domain', d4One.cleared === true, JSON.stringify(d4One));

  // Two independent occurrences of the SAME pattern -> should fail (meets threshold 2).
  const twoOccurrences = scoreKnowledgeResponses(items, { K1: 1, K2: 1, K3: 0 });
  const twoOccurrencesDomains = evaluateCriticalDomains(twoOccurrences.evidencePoints, HEAD_SPA_CRITICAL_DOMAINS);
  const d4Two = twoOccurrencesDomains.find((d) => d.domainId === 'D4');
  check(
    'Type B repeated pattern',
    'Two independent same-pattern evidence points fail the domain (repeated_pattern)',
    d4Two.cleared === false && d4Two.failureType === 'repeated_pattern',
    JSON.stringify(d4Two)
  );

  // Two occurrences of DIFFERENT patterns should not trigger Type B.
  const differentPatterns = scoreKnowledgeResponses(items, { K1: 1, K2: 0, K3: 1 });
  const differentPatternsDomains = evaluateCriticalDomains(differentPatterns.evidencePoints, HEAD_SPA_CRITICAL_DOMAINS);
  const d4Diff = differentPatternsDomains.find((d) => d.domainId === 'D4');
  check('Type B repeated pattern', 'Two occurrences of two DIFFERENT patterns do not meet the same-pattern threshold', d4Diff.cleared === true, JSON.stringify(d4Diff));
})();

// ---- Applied cases component aggregation ----
(function appliedCasesComponentTest() {
  const caseDef1 = { id: 'C1', criticalDomainEvidence: [], parts: [{ id: 'p1', type: 'single-best-answer', correctAnswer: 0 }], scoring: { weights: [1] } };
  const caseDef2 = {
    id: 'C2',
    criticalDomainEvidence: [],
    parts: [
      { id: 'p1', type: 'multi-select', correctAnswer: [0, 2] },
      { id: 'p2', type: 'sequencing', correctAnswer: [1, 2, 3] },
    ],
    scoring: { weights: [1, 1] },
  };
  const r1 = scoreCaseSubmission(caseDef1, { p1: 0 }); // correct
  const r2 = scoreCaseSubmission(caseDef2, { p1: [2, 0], p2: [1, 2, 3] }); // multi-select correct (order-independent), sequencing correct
  check('Applied cases aggregation', 'Case 1 scores 100%', r1.percent === 1);
  check('Applied cases aggregation', 'Case 2 scores 100% (multi-select order-independent, sequencing order-dependent)', r2.percent === 1, JSON.stringify(r2.partResults));

  const wrongSequencing = scoreCaseSubmission(caseDef2, { p1: [0, 2], p2: [3, 2, 1] });
  check('Applied cases aggregation', 'Reversed sequencing order is scored incorrect', wrongSequencing.partResults.find((p) => p.partId === 'p2').correctnessScore === 0);

  const component = computeAppliedCasesComponent([r1, r2]);
  check('Applied cases aggregation', 'Component averages case percents', component.percent === 1);
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
