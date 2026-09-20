// Deterministic tests for the attempt/remediation ladder (pure logic, no I/O).
// Run: node tests/certification-attempt-ladder.test.mjs

import { determineNextAttemptEligibility } from '../functions/_lib/certification/attempt-ladder.mjs';
import { getCurrentAssessmentConfig } from '../functions/_lib/certification/assessment-config.mjs';

const config = getCurrentAssessmentConfig();
const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const clearedDomains = ['D1', 'D2', 'D3', 'D4'].map((id) => ({ domainId: id, cleared: true }));
const oneUnclearedDomain = [
  { domainId: 'D1', cleared: true },
  { domainId: 'D2', cleared: false },
  { domainId: 'D3', cleared: true },
  { domainId: 'D4', cleared: true },
];

(function noPriorAttempts() {
  const result = determineNextAttemptEligibility({ attempts: [], config });
  check('No prior attempts', 'Attempt 1 is immediately available', result.canStartNewAttempt === true && result.nextAttemptNumber === 1, JSON.stringify(result));
})();

(function inProgressResumes() {
  const attempts = [{ attemptNumber: 1, decision: null, criticalDomainResults: [] }];
  const result = determineNextAttemptEligibility({ attempts, config });
  check('In-progress attempt', 'Resumes rather than offering a new attempt', result.canStartNewAttempt === false && result.resumeAttemptNumber === 1, JSON.stringify(result));
})();

(function alreadyCertifiedBlocksFurtherAttempts() {
  const attempts = [{ attemptNumber: 1, decision: 'pass', criticalDomainResults: clearedDomains }];
  const result = determineNextAttemptEligibility({ attempts, config });
  check('Already certified', 'No further attempt is offered once passed', result.canStartNewAttempt === false && result.alreadyCertified === true, JSON.stringify(result));
})();

(function attempt1ToAttempt2NoExtraGate() {
  const attempts = [{ attemptNumber: 1, decision: 'not_yet_passed', criticalDomainResults: clearedDomains }];
  const result = determineNextAttemptEligibility({ attempts, remediationAssignments: [], educatorRequests: [], config });
  check('Attempt 1 -> Attempt 2', 'Attempt 2 is available with no remediation/educator gate', result.canStartNewAttempt === true && result.nextAttemptNumber === 2, JSON.stringify(result));
})();

(function attempt2ToAttempt3RequiresRemediation() {
  const attempts = [
    { attemptNumber: 1, decision: 'not_yet_passed', criticalDomainResults: clearedDomains },
    { attemptNumber: 2, decision: 'not_yet_passed', criticalDomainResults: clearedDomains },
  ];
  const outstandingRemediation = [{ critical_domain: null, required_before_next_attempt: true, completed: false }];
  const blocked = determineNextAttemptEligibility({ attempts, remediationAssignments: outstandingRemediation, config });
  check('Attempt 2 -> Attempt 3', 'Blocked while remediation is outstanding', blocked.canStartNewAttempt === false && blocked.blockedReason === 'remediation_required', JSON.stringify(blocked));

  const completedRemediation = [{ critical_domain: null, required_before_next_attempt: true, completed: true }];
  const unblocked = determineNextAttemptEligibility({ attempts, remediationAssignments: completedRemediation, config });
  check('Attempt 2 -> Attempt 3', 'Unlocked once remediation is completed', unblocked.canStartNewAttempt === true && unblocked.nextAttemptNumber === 3, JSON.stringify(unblocked));
})();

(function attempt3ToAttempt4RequiresEducatorAuthorization() {
  const attempts = [
    { attemptNumber: 1, decision: 'not_yet_passed', criticalDomainResults: clearedDomains },
    { attemptNumber: 2, decision: 'not_yet_passed', criticalDomainResults: clearedDomains },
    { attemptNumber: 3, decision: 'not_yet_passed', criticalDomainResults: clearedDomains },
  ];
  const noAuth = determineNextAttemptEligibility({ attempts, remediationAssignments: [{ required_before_next_attempt: true, completed: true }], educatorRequests: [], config });
  check('Attempt 3 -> Attempt 4', 'Blocked without educator authorization', noAuth.canStartNewAttempt === false && noAuth.blockedReason === 'educator_authorization_required', JSON.stringify(noAuth));

  const authorized = determineNextAttemptEligibility({
    attempts,
    remediationAssignments: [{ required_before_next_attempt: true, completed: true }],
    educatorRequests: [{ attempt4_authorized: true }],
    config,
  });
  check('Attempt 3 -> Attempt 4', 'Unlocked once an educator authorizes it', authorized.canStartNewAttempt === true && authorized.nextAttemptNumber === 4, JSON.stringify(authorized));
})();

(function attempt4UnsuccessfulStopsAutomaticAttempts() {
  const attempts = [1, 2, 3, 4].map((n) => ({ attemptNumber: n, decision: 'not_yet_passed', criticalDomainResults: clearedDomains }));
  const result = determineNextAttemptEligibility({
    attempts,
    remediationAssignments: [{ required_before_next_attempt: true, completed: true }],
    educatorRequests: [{ attempt4_authorized: true }],
    config,
  });
  check('Attempt 4 unsuccessful', 'No automatic Attempt 5 — routed to Individual AIMT Review', result.canStartNewAttempt === false && result.blockedReason === 'individual_aimt_review', JSON.stringify(result));
})();

(function criticalDomainRemediationAppliesFromAttempt1() {
  // Standard Section 8: critical-domain remediation applies starting AFTER Attempt 1,
  // independent of the numbered remediation gate that only kicks in before Attempt 3.
  const attempts = [{ attemptNumber: 1, decision: 'not_yet_passed', criticalDomainResults: oneUnclearedDomain }];

  const blocked = determineNextAttemptEligibility({ attempts, remediationAssignments: [], config });
  check(
    'Critical-domain remediation from Attempt 1',
    'Attempt 2 is blocked until the specific uncleared domain (D2) gets targeted remediation, even though no numbered gate normally applies before Attempt 2',
    blocked.canStartNewAttempt === false && blocked.blockedReason === 'critical_domain_remediation_required' && blocked.domains.includes('D2'),
    JSON.stringify(blocked)
  );

  const wrongDomainRemediated = determineNextAttemptEligibility({
    attempts,
    remediationAssignments: [{ critical_domain: 'D4', required_before_next_attempt: true, completed: true }],
    config,
  });
  check(
    'Critical-domain remediation from Attempt 1',
    'Remediating an unrelated domain (D4) does not unlock Attempt 2 for the actual failed domain (D2)',
    wrongDomainRemediated.canStartNewAttempt === false && wrongDomainRemediated.domains.includes('D2'),
    JSON.stringify(wrongDomainRemediated)
  );

  const correctDomainRemediated = determineNextAttemptEligibility({
    attempts,
    remediationAssignments: [{ critical_domain: 'D2', required_before_next_attempt: true, completed: true }],
    config,
  });
  check(
    'Critical-domain remediation from Attempt 1',
    'Remediating the actual failed domain (D2) unlocks Attempt 2',
    correctDomainRemediated.canStartNewAttempt === true && correctDomainRemediated.nextAttemptNumber === 2,
    JSON.stringify(correctDomainRemediated)
  );
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
