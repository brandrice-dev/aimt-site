// AIMT Publication Editor — deterministic tests for the violation-code
// sanitizer (functions/_lib/research/publication-violation-sanitizer.mjs).
// PURE, no network, no model call.
//
// Run: node tests/publication-violation-sanitizer.test.mjs

import { sanitizePublicationValidatorViolations } from '../functions/_lib/research/publication-violation-sanitizer.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

// A. strips claim IDs after the first colon.
(function testStripsClaimIdSuffix() {
  const out = sanitizePublicationValidatorViolations([
    'CLAIM_MISSING_DISPOSITION:abc',
    'SUPPORTING_CLAIM_NOT_SELECTED:def',
    'LIMITATIONS_NOT_PRESERVED',
  ]);
  check('STRIP_SUFFIX', 'matches the exact example from the spec', JSON.stringify(out) === JSON.stringify(['CLAIM_MISSING_DISPOSITION', 'SUPPORTING_CLAIM_NOT_SELECTED', 'LIMITATIONS_NOT_PRESERVED']), JSON.stringify(out));
})();

(function testStripsEverythingAfterTheFirstColonEvenWithASecondColonOrArrow() {
  // NON_CORE_CONFLICT_ONE_SIDED_EXCLUSION:claimId->relatedClaimId -- only
  // the FIRST colon matters; nothing after it, including a second
  // "claim id" embedded past an arrow, may survive.
  const out = sanitizePublicationValidatorViolations(['NON_CORE_CONFLICT_ONE_SIDED_EXCLUSION:c-047->c-102']);
  check('STRIP_SUFFIX', 'strips everything after the FIRST colon, including a second embedded id', out[0] === 'NON_CORE_CONFLICT_ONE_SIDED_EXCLUSION', out[0]);
  check('STRIP_SUFFIX', 'no fragment of either private id survives', !out.some((c) => c.includes('c-047') || c.includes('c-102')));
})();

(function testCodeWithNoColonPassesThroughUnchanged() {
  const out = sanitizePublicationValidatorViolations(['LIMITATIONS_NOT_PRESERVED', 'AUTO_READY_WITH_INCONSISTENT_HUMAN_REVIEW_JUSTIFICATION']);
  check('STRIP_SUFFIX', 'a bare code with no colon is returned exactly as-is', JSON.stringify(out) === JSON.stringify(['LIMITATIONS_NOT_PRESERVED', 'AUTO_READY_WITH_INCONSISTENT_HUMAN_REVIEW_JUSTIFICATION']));
})();

// B. deduplicates codes.
(function testDeduplicatesRepeatedCodes() {
  const out = sanitizePublicationValidatorViolations([
    'SUPPORTING_CLAIM_NOT_SELECTED:c-1',
    'SUPPORTING_CLAIM_NOT_SELECTED:c-2',
    'SUPPORTING_CLAIM_NOT_SELECTED:c-3',
    'LIMITATIONS_NOT_PRESERVED',
  ]);
  check('DEDUPLICATE', 'the repeated code appears exactly once', out.filter((c) => c === 'SUPPORTING_CLAIM_NOT_SELECTED').length === 1, JSON.stringify(out));
  check('DEDUPLICATE', 'the distinct code is also present', out.includes('LIMITATIONS_NOT_PRESERVED'));
  check('DEDUPLICATE', 'total length reflects deduplication (2, not 4)', out.length === 2, out.length);
})();

// C. preserves stable (first-occurrence) order.
(function testPreservesFirstOccurrenceOrder() {
  const out = sanitizePublicationValidatorViolations([
    'LIMITATIONS_NOT_PRESERVED',
    'SUPPORTING_CLAIM_NOT_SELECTED:c-1',
    'CLAIM_MISSING_DISPOSITION:c-2',
    'SUPPORTING_CLAIM_NOT_SELECTED:c-3', // repeat, must not move the code
  ]);
  check('STABLE_ORDER', 'order matches first occurrence, not alphabetical or reversed', JSON.stringify(out) === JSON.stringify(['LIMITATIONS_NOT_PRESERVED', 'SUPPORTING_CLAIM_NOT_SELECTED', 'CLAIM_MISSING_DISPOSITION']), JSON.stringify(out));
})();

(function testOrderIsDeterministicAcrossRepeatedCalls() {
  const input = ['B_CODE:x', 'A_CODE:y', 'B_CODE:z', 'C_CODE'];
  const first = sanitizePublicationValidatorViolations(input);
  const second = sanitizePublicationValidatorViolations(input);
  check('STABLE_ORDER', 'two calls on the same input produce identical output', JSON.stringify(first) === JSON.stringify(second));
})();

// Defensive / edge-case input handling.
(function testEmptyAndMissingInputProduceAnEmptyArray() {
  check('EDGE_CASES', 'empty array in -> empty array out', JSON.stringify(sanitizePublicationValidatorViolations([])) === '[]');
  check('EDGE_CASES', 'null -> empty array, never throws', JSON.stringify(sanitizePublicationValidatorViolations(null)) === '[]');
  check('EDGE_CASES', 'undefined -> empty array, never throws', JSON.stringify(sanitizePublicationValidatorViolations(undefined)) === '[]');
  check('EDGE_CASES', 'a non-array -> empty array, never throws', JSON.stringify(sanitizePublicationValidatorViolations('not an array')) === '[]');
})();

(function testNonStringEntriesAreIgnoredRatherThanCrashing() {
  const out = sanitizePublicationValidatorViolations(['LIMITATIONS_NOT_PRESERVED', null, 42, { code: 'X' }, undefined]);
  check('EDGE_CASES', 'non-string entries are silently skipped', JSON.stringify(out) === JSON.stringify(['LIMITATIONS_NOT_PRESERVED']), JSON.stringify(out));
})();

(function testResultOnlyEverContainsStrings() {
  const out = sanitizePublicationValidatorViolations(['CODE_A:id1', 'CODE_B:id2']);
  check('STRINGS_ONLY', 'every entry in the output is a string', out.every((c) => typeof c === 'string'));
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
