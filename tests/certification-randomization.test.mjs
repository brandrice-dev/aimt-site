// Deterministic tests for the constrained assessment randomization engine.
// Run: node tests/certification-randomization.test.mjs
// Uses only Node built-ins (ESM import) plus the fixture bank — no npm deps.

import { assembleAttempt, selectPartI, selectPartIIAndIII } from '../functions/_lib/certification/randomization.mjs';
import { getCurrentAssessmentConfig } from '../functions/_lib/certification/assessment-config.mjs';
import { getFixtureBanks } from './fixtures/certification-fixture-bank.mjs';

const config = getCurrentAssessmentConfig();
const results = [];

function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

// Seeded PRNG (mulberry32) for reproducible test runs.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

(function fixtureSufficientBankAssembly() {
  const rng = mulberry32(42);
  const banks = getFixtureBanks();
  const result = assembleAttempt(banks, config, { rng });

  check('Sufficient bank assembly', 'assembleAttempt succeeds', result.ok === true, JSON.stringify(result).slice(0, 300));
  if (!result.ok) return;

  check('Sufficient bank assembly', 'Part I has exactly 40 items', result.partI.length === 40, `got ${result.partI.length}`);
  check('Sufficient bank assembly', 'Part II has exactly 4 items', result.partII.length === 4, `got ${result.partII.length}`);
  check('Sufficient bank assembly', 'Part III has exactly 3 items', result.partIII.length === 3, `got ${result.partIII.length}`);

  const modulesCovered = new Set(result.partI.map((i) => i.sourceModule));
  const allModulesPresent = config.requiredModuleCoverage.every((m) => modulesCovered.has(m));
  check('Sufficient bank assembly', 'Every module 1-11 represented in Part I', allModulesPresent, `covered=${[...modulesCovered].sort().join(',')}`);

  const allIds = [
    ...result.partI.map((i) => i.id),
    ...result.partII.map((i) => i.id),
    ...result.partIII.map((i) => i.id),
  ];
  check('Sufficient bank assembly', 'No duplicate IDs across the assembled attempt', new Set(allIds).size === allIds.length);

  const tierCounts = { foundational: 0, applied: 0, 'advanced-synthesis': 0 };
  for (const item of result.partI) tierCounts[item.difficulty] += 1;
  // Loose tolerance band around the 20/60/20 target given a 40-item draw.
  check(
    'Sufficient bank assembly',
    'Difficulty mix roughly 20/60/20 (tolerance +-6)',
    Math.abs(tierCounts.foundational - 8) <= 6 && Math.abs(tierCounts.applied - 24) <= 8 && Math.abs(tierCounts['advanced-synthesis'] - 8) <= 6,
    JSON.stringify(tierCounts)
  );

  for (const domain of config.criticalDomains) {
    const ev = result.evidenceMatrix[domain.id];
    check(
      'Sufficient bank assembly',
      `Domain ${domain.id} has >=2 total evidence points`,
      ev.total >= config.criticalDomainCoverage.minEvidencePointsPerDomain,
      JSON.stringify(ev)
    );
    check(
      'Sufficient bank assembly',
      `Domain ${domain.id} has >=1 non-Part-I evidence point`,
      ev.fromNonPartOne >= config.criticalDomainCoverage.minNonPartOneEvidencePointsPerDomain,
      JSON.stringify(ev)
    );
  }

  check('Sufficient bank assembly', 'No warnings on a healthy fixture bank', result.warnings.length === 0, JSON.stringify(result.warnings));
})();

(function fixtureInsufficientBankMissingModule() {
  const rng = mulberry32(7);
  const banks = getFixtureBanks();
  const knowledgeMissingModule11 = banks.knowledgeBank.filter((item) => item.sourceModule !== 11);
  const result = selectPartI(knowledgeMissingModule11, config, { rng, domainEvidenceFromOtherParts: {} });

  check('Insufficient bank — missing module', 'selectPartI reports insufficient_bank', result.ok === false && result.reason === 'insufficient_bank');
  check('Insufficient bank — missing module', 'Reports module 11 as missing', Array.isArray(result.missingModules) && result.missingModules.includes(11), JSON.stringify(result.missingModules));
})();

(function fixtureInsufficientBankTooFewItems() {
  const rng = mulberry32(9);
  const banks = getFixtureBanks();
  const tinyBank = banks.knowledgeBank.slice(0, 15); // fewer than target(40), but keep module coverage for this check
  const result = selectPartI(tinyBank, config, { rng, domainEvidenceFromOtherParts: {} });
  check('Insufficient bank — too few total items', 'selectPartI reports insufficient_bank when below target count', result.ok === false, JSON.stringify(result));
})();

(function retakeOverlapPrefersUnseen() {
  const rng = mulberry32(123);
  const banks = getFixtureBanks();
  // Mark every module-1 through module-5 fixture item as "seen" to force the
  // algorithm to reach into modules 6-11 and any remaining unseen module 1-5
  // items rather than repeating seen ones, given ample unseen supply exists.
  const seenIds = banks.knowledgeBank.filter((i) => i.sourceModule <= 5).map((i) => i.id);
  const result = selectPartI(banks.knowledgeBank, config, { rng, seenIds, domainEvidenceFromOtherParts: {} });

  check('Retake overlap', 'selectPartI still succeeds with a large seen set', result.ok === true);
  if (!result.ok) return;
  const seenSet = new Set(seenIds);
  const selectedSeenCount = result.items.filter((i) => seenSet.has(i.id)).length;
  // Modules 1-5 still need >=1 pick each (module coverage), so some seen items
  // are unavoidable, but the fill phase should not gratuitously pick more.
  check(
    'Retake overlap',
    'Seen items are minimized (only as many as required for module coverage), not maximized',
    selectedSeenCount <= 5 + 2, // 5 required-module picks + small slack for domain top-up
    `selectedSeenCount=${selectedSeenCount}`
  );
})();

(function domainCoverageGapFilledFromPartIWhenOtherPartsShort() {
  const rng = mulberry32(55);
  const banks = getFixtureBanks();
  // Simulate Part II/III having covered D1 and D2 already, but nothing for D3/D4.
  const domainEvidenceFromOtherParts = { D1: 1, D2: 1, D3: 0, D4: 0 };
  const result = selectPartI(banks.knowledgeBank, config, { rng, domainEvidenceFromOtherParts });
  check('Domain top-up from Part I', 'selectPartI succeeds', result.ok === true);
  if (!result.ok) return;
  const d3Count = result.items.filter((i) => (i.criticalDomainEvidence || []).includes('D3')).length;
  const d4Count = result.items.filter((i) => (i.criticalDomainEvidence || []).includes('D4')).length;
  check('Domain top-up from Part I', 'Part I tops up D3 to >=2 total', d3Count + 0 >= 2, `d3Count=${d3Count}`);
  check('Domain top-up from Part I', 'Part I tops up D4 to >=2 total', d4Count + 0 >= 2, `d4Count=${d4Count}`);
})();

(function partIIAndIIICoverAllDomainsFromFixture() {
  const rng = mulberry32(3);
  const banks = getFixtureBanks();
  const { selectedCases, selectedInterviews, uncoveredNonPartOneDomains } = selectPartIIAndIII(
    banks.caseBank,
    banks.interviewBank,
    config,
    { rng }
  );
  check('Part II/III domain coverage', 'Selects exactly 4 cases', selectedCases.length === 4, `got ${selectedCases.length}`);
  check('Part II/III domain coverage', 'Selects exactly 3 interviews', selectedInterviews.length === 3, `got ${selectedInterviews.length}`);
  check('Part II/III domain coverage', 'All four domains covered by cases/interviews in this fixture', uncoveredNonPartOneDomains.length === 0, JSON.stringify(uncoveredNonPartOneDomains));
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
  const status = failed.length === 0 ? 'PASS' : 'FAIL';
  if (failed.length > 0) anyFail = true;
  console.log(`[${status}] ${fixtureName} (${checks.length - failed.length}/${checks.length})`);
  for (const f of failed) {
    console.log(`    FAILED: ${f.label}${f.detail ? ' — ' + f.detail : ''}`);
  }
}

console.log(`\nTotal: ${results.length}, Passed: ${results.filter((r) => r.pass).length}, Failed: ${results.filter((r) => !r.pass).length}`);
if (anyFail) process.exitCode = 1;
