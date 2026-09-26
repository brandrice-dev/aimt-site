// AIMT Education Operations v1 — deterministic tests for the
// generated-diff allowlist (functions/_lib/education-ops/
// education-diff-allowlist.mjs). PURE, no shell-out.
//
// Run: node tests/education-diff-allowlist.test.mjs

import { checkGeneratedDiffAllowlist } from '../functions/_lib/education-ops/education-diff-allowlist.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

(function testOrdinaryArticleDiffPasses() {
  const result = checkGeneratedDiffAllowlist([
    'education/hair-loss/androgenetic-alopecia.html',
    'education/hair-loss.html',
    'sitemap.xml',
    'functions/_data/education-page-plans/androgenetic-alopecia.json',
  ]);
  check('ORDINARY_DIFF', 'valid', result.valid, JSON.stringify(result));
  check('ORDINARY_DIFF', 'zero violations', result.violations.length === 0);
  check('ORDINARY_DIFF', 'all four paths allowed', result.allowed.length === 4);
})();

(function testPublicationEditorSourceIsNeverAllowed() {
  const result = checkGeneratedDiffAllowlist(['functions/_lib/research/publication-synthesis-validator.mjs']);
  check('FORBIDDEN_PATHS', 'Publication Editor source triggers INFRA_REVIEW', !result.valid);
  check('FORBIDDEN_PATHS', 'names the violating path', result.violations.includes('functions/_lib/research/publication-synthesis-validator.mjs'));
})();

(function testPageBuilderSourceIsNeverAllowed() {
  const result = checkGeneratedDiffAllowlist(['functions/_lib/page-builder/page-builder-draft.mjs']);
  check('FORBIDDEN_PATHS', 'Page Builder source triggers INFRA_REVIEW', !result.valid);
})();

(function testSharedCssIsNeverAllowed() {
  const result = checkGeneratedDiffAllowlist(['assets/css/aimt-education.css']);
  check('FORBIDDEN_PATHS', 'shared CSS triggers INFRA_REVIEW', !result.valid);
})();

(function testUnrelatedSystemsAreNeverAllowed() {
  for (const path of ['functions/_lib/cadence/model-config.mjs', 'functions/api/stripe-webhook.js', 'about.html', 'headspa-mastery.html']) {
    const result = checkGeneratedDiffAllowlist([path]);
    check('FORBIDDEN_PATHS', `${path} triggers INFRA_REVIEW`, !result.valid, path);
  }
})();

(function testMixedDiffFailsOnAnySingleViolation() {
  const result = checkGeneratedDiffAllowlist([
    'education/hair-loss/androgenetic-alopecia.html', // allowed
    'functions/_lib/page-builder/page-builder-validator.mjs', // NOT allowed
  ]);
  check('MIXED_DIFF', 'invalid overall', !result.valid);
  check('MIXED_DIFF', 'the allowed path is still reported as allowed', result.allowed.includes('education/hair-loss/androgenetic-alopecia.html'));
  check('MIXED_DIFF', 'the violating path is reported', result.violations.includes('functions/_lib/page-builder/page-builder-validator.mjs'));
})();

(function testEmptyDiffIsValid() {
  const result = checkGeneratedDiffAllowlist([]);
  check('EMPTY_DIFF', 'an empty diff is trivially valid', result.valid);
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
