// AIMT Education Operations v1 — deterministic tests for the narrow
// numeric-fidelity repair lane (functions/_lib/education-ops/
// education-page-plan-repair.mjs#repairDeterministicPagePlanViolations).
// PURE, no network, no model call, no I/O.
//
// Run: node tests/education-page-plan-repair.test.mjs

import { repairDeterministicPagePlanViolations } from '../functions/_lib/education-ops/education-page-plan-repair.mjs';
import { validateEducationPagePlan } from '../functions/_lib/education-ops/education-page-plan-validator.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

function unit(kind, text, claimIds = [], sourceStatements = []) {
  return { kind, text, supporting_claim_ids: claimIds, source_statements: sourceStatements };
}

function baselineSnapshot(overrides = {}) {
  return {
    selected_claim_ids: ['c1', 'c2', 'c3'],
    core_factual_points: [
      { statement: 'Follicles cycle through anagen, catagen, telogen.', supporting_claim_ids: ['c1'] },
      { statement: 'Roughly 9% of follicles are in telogen at any given time.', supporting_claim_ids: ['c2'] },
    ],
    limitations: [
      { statement: 'Evidence is mostly cross-sectional.', supporting_claim_ids: ['c3'] },
    ],
    scope_note: 'This page describes normal cycling only.',
    source_ids: ['s1'],
    ...overrides,
  };
}

function baselinePlan(overrides = {}) {
  return {
    topic_slug: 'x-topic', cluster: 'hair-loss-shedding', route: '/education/hair-loss/x-topic',
    title: 'X Topic | AIMT', meta_description: 'A page about x.', h1: 'X Topic',
    answer_summary: unit('VERBATIM', 'Follicles cycle through anagen, catagen, telogen.', ['c1'], ['Follicles cycle through anagen, catagen, telogen.']),
    sections: [
      { section_id: 'what-is-x', heading: 'What is X', units: [
        unit('FRAMING', 'This matters for a simple reason.'),
        // The offending unit: a numeric PARAPHRASE, not byte-identical
        // to the cleared statement it claims to support.
        unit('PARAPHRASE', 'About 9% of follicles rest at once.', ['c2'], ['Roughly 9% of follicles are in telogen at any given time.']),
      ] },
    ],
    scope_note: 'This page describes normal cycling only.',
    limitations: [unit('VERBATIM', 'Evidence is mostly cross-sectional.', ['c3'], ['Evidence is mostly cross-sectional.'])],
    key_takeaways: [unit('VERBATIM', 'Follicles cycle through anagen, catagen, telogen.', ['c1'], ['Follicles cycle through anagen, catagen, telogen.'])],
    sources: [{ source_id: 's1', title: 'A Reference', authors: ['A. Author'], year: 2023, doi: '10.1/x', url: 'https://doi.org/10.1/x' }],
    related_links: [{ href: '/education', label: 'Education Library', relation: 'library_home' }],
    visual_recommendation: { recommendation: 'NONE', rationale: 'No visual would teach this more clearly than the prose.' },
    ...overrides,
  };
}

const NUMERIC_LOCATION = 'section:what-is-x:1';

// ─────────────────────────────────────────────────────────────────────────
// A. EXACT UNIQUE MATCH
// ─────────────────────────────────────────────────────────────────────────
(function testExactUniqueMatchRepairsToVerbatimClearedText() {
  const plan = baselinePlan();
  const snapshot = baselineSnapshot();
  const validation = validateEducationPagePlan(plan, snapshot);
  check('EXACT_UNIQUE_MATCH', 'the unrepaired plan is invalid on UNSUPPORTED_NUMERIC_CLAIM', !validation.valid && validation.violations.includes(`UNSUPPORTED_NUMERIC_CLAIM:${NUMERIC_LOCATION}`), JSON.stringify(validation.violations));

  const { repairedPlan, repairReport } = repairDeterministicPagePlanViolations(plan, snapshot, validation.violations);
  const repairedUnit = repairedPlan.sections[0].units[1];
  check('EXACT_UNIQUE_MATCH', 'becomes VERBATIM', repairedUnit.kind === 'VERBATIM');
  check('EXACT_UNIQUE_MATCH', 'text is the exact cleared statement', repairedUnit.text === 'Roughly 9% of follicles are in telogen at any given time.', repairedUnit.text);
  check('EXACT_UNIQUE_MATCH', 'supporting_claim_ids is the exact cleared candidate copy', JSON.stringify(repairedUnit.supporting_claim_ids) === JSON.stringify(['c2']));
  check('EXACT_UNIQUE_MATCH', 'source_statements becomes the exact cleared statement', JSON.stringify(repairedUnit.source_statements) === JSON.stringify(['Roughly 9% of follicles are in telogen at any given time.']));
  check('EXACT_UNIQUE_MATCH', 'repair report names the repaired location', repairReport.repaired_locations.includes(NUMERIC_LOCATION), JSON.stringify(repairReport));
  check('EXACT_UNIQUE_MATCH', 'repair_type is NUMERIC_TO_CLEARED_VERBATIM', repairReport.repair_type === 'NUMERIC_TO_CLEARED_VERBATIM');
  check('EXACT_UNIQUE_MATCH', 'no unresolved locations', repairReport.unresolved_locations.length === 0);

  const revalidation = validateEducationPagePlan(repairedPlan, snapshot);
  check('EXACT_UNIQUE_MATCH', 'second full validator pass succeeds', revalidation.valid, JSON.stringify(revalidation.violations));
})();

// ─────────────────────────────────────────────────────────────────────────
// B. ZERO MATCHES
// ─────────────────────────────────────────────────────────────────────────
(function testZeroMatchesIsNotRepairable() {
  const plan = baselinePlan();
  // Support IDs that don't map uniquely to ANY digit-bearing cleared
  // statement (c3's cleared statement -- the limitation -- carries no
  // digit at all).
  plan.sections[0].units[1] = unit('PARAPHRASE', 'About 9% of follicles rest at once.', ['c3'], ['Evidence is mostly cross-sectional.']);
  const snapshot = baselineSnapshot();
  const validation = validateEducationPagePlan(plan, snapshot);
  check('ZERO_MATCHES', 'invalid before repair', !validation.valid);

  const { repairedPlan, repairReport } = repairDeterministicPagePlanViolations(plan, snapshot, validation.violations);
  check('ZERO_MATCHES', 'no location repaired', repairReport.repaired_locations.length === 0);
  check('ZERO_MATCHES', 'the location is unresolved', repairReport.unresolved_locations.includes(NUMERIC_LOCATION), JSON.stringify(repairReport));
  check('ZERO_MATCHES', 'reason is NO_UNIQUE_CLEARED_STATEMENT', repairReport.reason === 'NO_UNIQUE_CLEARED_STATEMENT', repairReport.reason);
  check('ZERO_MATCHES', 'the offending unit is left completely untouched', JSON.stringify(repairedPlan.sections[0].units[1]) === JSON.stringify(plan.sections[0].units[1]));

  const revalidation = validateEducationPagePlan(repairedPlan, snapshot);
  check('ZERO_MATCHES', 'remains invalid after the repair attempt', !revalidation.valid);
})();

// ─────────────────────────────────────────────────────────────────────────
// C. MULTIPLE MATCHES (no arbitrary choice)
// ─────────────────────────────────────────────────────────────────────────
(function testMultipleMatchesWithNoDisambiguationHintIsAmbiguous() {
  const plan = baselinePlan();
  const snapshot = baselineSnapshot({
    core_factual_points: [
      { statement: 'Follicles cycle through anagen, catagen, telogen.', supporting_claim_ids: ['c1'] },
      // TWO digit-bearing cleared statements sharing the EXACT same
      // supporting_claim_ids set as the offending unit -- genuinely
      // ambiguous, no source_statements hint available to break the tie.
      { statement: 'Roughly 9% of follicles are in telogen at any given time.', supporting_claim_ids: ['c2'] },
      { statement: 'About 8% of follicles are in telogen in a separate sub-analysis.', supporting_claim_ids: ['c2'] },
    ],
  });
  plan.sections[0].units[1] = unit('PARAPHRASE', 'About 9% of follicles rest at once.', ['c2'], ['some unrelated writer-authored sentence']);
  const validation = validateEducationPagePlan(plan, snapshot);
  check('MULTIPLE_MATCHES', 'invalid before repair', !validation.valid);

  const { repairReport } = repairDeterministicPagePlanViolations(plan, snapshot, validation.violations);
  check('MULTIPLE_MATCHES', 'no arbitrary choice is made', repairReport.repaired_locations.length === 0);
  check('MULTIPLE_MATCHES', 'the location is unresolved', repairReport.unresolved_locations.includes(NUMERIC_LOCATION));
  check('MULTIPLE_MATCHES', 'reason is AMBIGUOUS_CLEARED_STATEMENT', repairReport.reason === 'AMBIGUOUS_CLEARED_STATEMENT', repairReport.reason);
})();

// ─────────────────────────────────────────────────────────────────────────
// D. SAFE SOURCE-STATEMENT DISAMBIGUATION
// ─────────────────────────────────────────────────────────────────────────
(function testSourceStatementDisambiguatesAGenuineTie() {
  const plan = baselinePlan();
  const snapshot = baselineSnapshot({
    core_factual_points: [
      { statement: 'Follicles cycle through anagen, catagen, telogen.', supporting_claim_ids: ['c1'] },
      { statement: 'Roughly 9% of follicles are in telogen at any given time.', supporting_claim_ids: ['c2'] },
      { statement: 'About 8% of follicles are in telogen in a separate sub-analysis.', supporting_claim_ids: ['c2'] },
    ],
  });
  // Same ambiguous claim-id tie as category C, but this time the
  // Writer's OWN source_statements is byte-identical to exactly ONE of
  // the two already-authoritative (claim-id-matching) candidates.
  plan.sections[0].units[1] = unit('PARAPHRASE', 'About 9% of follicles rest at once.', ['c2'], ['Roughly 9% of follicles are in telogen at any given time.']);
  const validation = validateEducationPagePlan(plan, snapshot);

  const { repairedPlan, repairReport } = repairDeterministicPagePlanViolations(plan, snapshot, validation.violations);
  check('SAFE_DISAMBIGUATION', 'the hinted candidate alone is chosen', repairReport.repaired_locations.includes(NUMERIC_LOCATION), JSON.stringify(repairReport));
  check('SAFE_DISAMBIGUATION', 'text matches the hinted candidate, not the other tied one', repairedPlan.sections[0].units[1].text === 'Roughly 9% of follicles are in telogen at any given time.', repairedPlan.sections[0].units[1].text);

  const revalidation = validateEducationPagePlan(repairedPlan, snapshot);
  check('SAFE_DISAMBIGUATION', 'second full validator pass succeeds', revalidation.valid, JSON.stringify(revalidation.violations));
})();

// ─────────────────────────────────────────────────────────────────────────
// E. SOURCE_STATEMENT CANNOT INVENT AUTHORITY
// ─────────────────────────────────────────────────────────────────────────
(function testSourceStatementAbsentFromClearedSnapshotNeverRepairs() {
  const plan = baselinePlan();
  const snapshot = baselineSnapshot({
    core_factual_points: [
      { statement: 'Follicles cycle through anagen, catagen, telogen.', supporting_claim_ids: ['c1'] },
      { statement: 'Roughly 9% of follicles are in telogen at any given time.', supporting_claim_ids: ['c2'] },
      { statement: 'About 8% of follicles are in telogen in a separate sub-analysis.', supporting_claim_ids: ['c2'] },
    ],
  });
  // The Writer's source_statements contains a numeric sentence that is
  // NOT in the cleared snapshot at all -- it must never be treated as
  // authoritative, even though it is the Writer's only stated source.
  plan.sections[0].units[1] = unit('PARAPHRASE', 'About 9% of follicles rest at once.', ['c2'], ['A model-invented numeric sentence absent from the cleared snapshot, 9%.']);
  const validation = validateEducationPagePlan(plan, snapshot);

  const { repairReport } = repairDeterministicPagePlanViolations(plan, snapshot, validation.violations);
  check('NO_INVENTED_AUTHORITY', 'still ambiguous -- the hint never resolves it', repairReport.repaired_locations.length === 0);
  check('NO_INVENTED_AUTHORITY', 'reason is AMBIGUOUS_CLEARED_STATEMENT (the tie between real candidates is unresolved)', repairReport.reason === 'AMBIGUOUS_CLEARED_STATEMENT', repairReport.reason);
})();

// ─────────────────────────────────────────────────────────────────────────
// F. NON-NUMERIC VIOLATION -- the repair layer never touches or hides it.
// ─────────────────────────────────────────────────────────────────────────
(function testNonNumericViolationIsNeverTouchedOrHidden() {
  const plan = baselinePlan();
  // An entirely unrelated violation: an ungrounded claim id elsewhere on
  // the page, alongside the numeric defect.
  plan.limitations.push(unit('PARAPHRASE', 'A fabricated limitation.', ['c-invented'], ['x']));
  const snapshot = baselineSnapshot();
  const validation = validateEducationPagePlan(plan, snapshot);
  check('NON_NUMERIC_PRESERVED', 'both violation kinds are present before repair', validation.violations.some((v) => v.startsWith('UNSUPPORTED_NUMERIC_CLAIM')) && validation.violations.some((v) => v.startsWith('UNGROUNDED_CLAIM_ID')), JSON.stringify(validation.violations));

  // The repair function itself only ever repairs UNSUPPORTED_NUMERIC_CLAIM
  // entries passed to it -- proving it does not silently "fix" or drop
  // an unrelated violation even if handed the full violations array.
  const { repairedPlan, repairReport } = repairDeterministicPagePlanViolations(plan, snapshot, validation.violations);
  check('NON_NUMERIC_PRESERVED', 'the numeric location is still repaired on its own terms', repairReport.repaired_locations.includes(NUMERIC_LOCATION), JSON.stringify(repairReport));
  check('NON_NUMERIC_PRESERVED', 'the unrelated ungrounded-claim unit is completely unchanged', JSON.stringify(repairedPlan.limitations[1]) === JSON.stringify(plan.limitations[1]));

  const revalidation = validateEducationPagePlan(repairedPlan, snapshot);
  check('NON_NUMERIC_PRESERVED', 'the unrelated violation still fails full revalidation -- nothing was hidden', !revalidation.valid && revalidation.violations.some((v) => v.startsWith('UNGROUNDED_CLAIM_ID')), JSON.stringify(revalidation.violations));
})();

// ─────────────────────────────────────────────────────────────────────────
// G. IMMUTABILITY -- original Writer plan and cleared snapshot untouched.
// ─────────────────────────────────────────────────────────────────────────
(function testOriginalPlanAndSnapshotAreNeverMutated() {
  const plan = baselinePlan();
  const snapshot = baselineSnapshot();
  const planBefore = JSON.stringify(plan);
  const snapshotBefore = JSON.stringify(snapshot);
  const validation = validateEducationPagePlan(plan, snapshot);

  const { repairedPlan } = repairDeterministicPagePlanViolations(plan, snapshot, validation.violations);
  check('IMMUTABILITY', 'the original plan object is byte-for-byte unchanged', JSON.stringify(plan) === planBefore);
  check('IMMUTABILITY', 'the original cleared snapshot is byte-for-byte unchanged', JSON.stringify(snapshot) === snapshotBefore);
  check('IMMUTABILITY', 'the repaired plan is a different object, not the same reference', repairedPlan !== plan);
  check('IMMUTABILITY', 'mutating the repaired copy does not affect the original', (() => {
    repairedPlan.sections[0].units[1].text = 'MUTATED';
    return plan.sections[0].units[1].text === 'About 9% of follicles rest at once.';
  })());
})();

// Zero-numeric-violations input is a structural no-op (used by the
// orchestrator's "every violation eligible" gate, but proven directly
// here too): calling the repair function with no UNSUPPORTED_NUMERIC_CLAIM
// violations at all attempts nothing and returns an unmodified copy.
(function testNoNumericViolationsIsANoOp() {
  const plan = baselinePlan();
  const snapshot = baselineSnapshot();
  const { repairedPlan, repairReport } = repairDeterministicPagePlanViolations(plan, snapshot, ['SCOPE_NOTE_NOT_PRESERVED']);
  check('NO_OP', 'attempted is false', repairReport.attempted === false);
  check('NO_OP', 'repairedPlan is unchanged content', JSON.stringify(repairedPlan) === JSON.stringify(plan));
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
