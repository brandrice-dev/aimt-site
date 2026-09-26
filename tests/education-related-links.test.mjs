// AIMT Education Operations v1 — deterministic tests for related-link
// authority (functions/_lib/education-ops/education-related-links.mjs).
// PURE, no network, no model call. Proves the model has NO way to
// influence a rendered href -- this module only ever emits the two
// fixed constants plus whatever the CALLER already resolved as trusted
// sibling-page data.
//
// Run: node tests/education-related-links.test.mjs

import { buildEducationRelatedLinks, EDUCATION_LIBRARY_HOME, RESEARCH_STANDARDS_LINK } from '../functions/_lib/education-ops/education-related-links.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

(function testAlwaysIncludesHubLibraryAndResearchStandards() {
  const links = buildEducationRelatedLinks({ clusterLabel: 'Hair Loss & Shedding', clusterRoutePrefix: '/education/hair-loss', siblingPages: [] });
  const hrefs = links.map((l) => l.href);
  check('BASELINE_LINKS', 'includes the cluster hub', hrefs.includes('/education/hair-loss'));
  check('BASELINE_LINKS', 'includes the Education Library home', hrefs.includes(EDUCATION_LIBRARY_HOME.href));
  check('BASELINE_LINKS', 'includes Research Standards', hrefs.includes(RESEARCH_STANDARDS_LINK.href));
  check('BASELINE_LINKS', 'exactly 3 links when there are no siblings', links.length === 3, JSON.stringify(hrefs));
})();

(function testSiblingPagesAppendedFromTrustedDataOnly() {
  const siblingPages = [
    { route: '/education/hair-loss/hair-growth-cycle', label: 'The Hair Growth Cycle: A Practitioner Education Overview' },
    { route: '/education/hair-loss/telogen-effluvium', label: 'Telogen Effluvium: A Practitioner Education Overview' },
  ];
  const links = buildEducationRelatedLinks({ clusterLabel: 'Hair Loss & Shedding', clusterRoutePrefix: '/education/hair-loss', siblingPages });
  check('SIBLING_LINKS', 'both siblings appear, exactly as given', siblingPages.every((s) => links.some((l) => l.href === s.route && l.label === s.label)));
  check('SIBLING_LINKS', 'sibling links are tagged related_topic', links.filter((l) => l.relation === 'related_topic').length === 2);
  check('SIBLING_LINKS', 'total is baseline (3) + siblings (2) = 5', links.length === 5, links.length);
})();

(function testFunctionHasNoParameterThatAcceptsAnArbitraryHref() {
  // The whole point of this module: there is no "extraLinks" or
  // "modelSuggestedLinks" parameter anywhere in its signature. Passing
  // something unexpected under an unrecognized key must have zero effect
  // on the output -- proving there is no side channel for an invented
  // href to enter the result.
  const links = buildEducationRelatedLinks({
    clusterLabel: 'Hair Loss & Shedding', clusterRoutePrefix: '/education/hair-loss', siblingPages: [],
    modelSuggestedLinks: [{ href: 'https://not-aimt.example/injected', label: 'Injected', relation: 'x' }],
  });
  check('NO_ARBITRARY_HREF_CHANNEL', 'an unrecognized extra field is silently ignored, never rendered', !links.some((l) => l.href.includes('not-aimt.example')));
})();

(function testEveryEmittedHrefIsAnInternalAbsolutePath() {
  const links = buildEducationRelatedLinks({
    clusterLabel: 'Hair Loss & Shedding', clusterRoutePrefix: '/education/hair-loss',
    siblingPages: [{ route: '/education/hair-loss/alopecia-areata', label: 'Alopecia Areata' }],
  });
  check('INTERNAL_HREFS_ONLY', 'every href starts with "/" (no scheme, no host)', links.every((l) => l.href.startsWith('/')), JSON.stringify(links.map((l) => l.href)));
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
