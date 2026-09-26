// AIMT Education Operations v1 — deterministic tests for the fail-closed
// trusted published-route resolution (scripts/education-operations-cycle.mjs
// #resolveTrustedSiblingPages). research_public_pages is the runtime
// authority that a topic is published; if a published, active-cluster
// topic cannot be mapped to a trusted route, the whole resolution must
// fail closed rather than silently omitting that topic -- an incomplete
// published-route set would otherwise feed route-collision protection,
// related-link generation, and the Writer's sibling context with wrong
// data. NO network, NO real filesystem I/O in this file -- every
// scenario injects getPageBuilderRouteFn/readArtifactFn.
//
// Run: node tests/education-published-route-resolution.test.mjs

import { resolveTrustedSiblingPages } from '../scripts/education-operations-cycle.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const CLUSTER_KEY = 'hair-loss-shedding';

/** A legacy registry stub that only knows about the two real pages. */
function legacyRegistryStub(known = { 'hair-cycle': '/education/hair-loss/hair-growth-cycle', 'telogen-effluvium': '/education/hair-loss/telogen-effluvium' }) {
  return (slug) => {
    if (!known[slug]) throw new Error(`No Page Builder route registered for "${slug}".`);
    return { route: known[slug] };
  };
}

/** An artifact reader stub driven by an in-memory map of slug -> result. */
function artifactStub(map) {
  return (slug) => map[slug] || { ok: false, reason: 'not in the legacy Page Builder route registry and no persisted Page Plan artifact exists' };
}

// ─────────────────────────────────────────────────────────────────────────
// 1. legacy published topic resolves normally
// ─────────────────────────────────────────────────────────────────────────
(function testLegacyTopicResolvesNormally() {
  const result = resolveTrustedSiblingPages(['hair-cycle'], CLUSTER_KEY, {
    getPageBuilderRouteFn: legacyRegistryStub(),
    readArtifactFn: artifactStub({}),
  });
  check('LEGACY_RESOLVES', 'ok', result.ok);
  check('LEGACY_RESOLVES', 'resolves the real legacy route', result.pages[0].route === '/education/hair-loss/hair-growth-cycle', JSON.stringify(result));
})();

// ─────────────────────────────────────────────────────────────────────────
// 2. future generated published topic resolves from Page Plan artifact
// ─────────────────────────────────────────────────────────────────────────
(function testGeneratedTopicResolvesFromArtifact() {
  const result = resolveTrustedSiblingPages(['alopecia-areata'], CLUSTER_KEY, {
    getPageBuilderRouteFn: legacyRegistryStub(),
    readArtifactFn: artifactStub({ 'alopecia-areata': { ok: true, route: '/education/hair-loss/alopecia-areata', h1: 'Alopecia Areata Overview' } }),
  });
  check('ARTIFACT_RESOLVES', 'ok', result.ok);
  check('ARTIFACT_RESOLVES', 'resolves the route/h1 from the artifact', result.pages[0].route === '/education/hair-loss/alopecia-areata' && result.pages[0].label === 'Alopecia Areata Overview', JSON.stringify(result));
})();

// ─────────────────────────────────────────────────────────────────────────
// 3. published active-cluster topic with missing artifact fails
// ─────────────────────────────────────────────────────────────────────────
(function testMissingArtifactFailsClosed() {
  const result = resolveTrustedSiblingPages(['androgenetic-alopecia'], CLUSTER_KEY, {
    getPageBuilderRouteFn: legacyRegistryStub(),
    readArtifactFn: artifactStub({}), // no entry at all -- defaults to the "not found" reason
  });
  check('MISSING_ARTIFACT_FAILS', 'not ok', !result.ok);
  check('MISSING_ARTIFACT_FAILS', 'names the unresolvable slug', result.violations.some((v) => v.startsWith('UNRESOLVABLE_PUBLISHED_ROUTE:androgenetic-alopecia')), JSON.stringify(result.violations));
})();

// ─────────────────────────────────────────────────────────────────────────
// 4. malformed artifact fails
// ─────────────────────────────────────────────────────────────────────────
(function testMalformedArtifactFailsClosed() {
  const result = resolveTrustedSiblingPages(['alopecia-areata'], CLUSTER_KEY, {
    getPageBuilderRouteFn: legacyRegistryStub(),
    readArtifactFn: artifactStub({ 'alopecia-areata': { ok: false, reason: 'persisted Page Plan artifact is not valid JSON (Unexpected token)' } }),
  });
  check('MALFORMED_ARTIFACT_FAILS', 'not ok', !result.ok);
  check('MALFORMED_ARTIFACT_FAILS', 'names the reason', result.violations.some((v) => v.includes('not valid JSON')), JSON.stringify(result.violations));
})();

// ─────────────────────────────────────────────────────────────────────────
// 5. artifact missing route fails
// ─────────────────────────────────────────────────────────────────────────
(function testArtifactMissingRouteFailsClosed() {
  const result = resolveTrustedSiblingPages(['alopecia-areata'], CLUSTER_KEY, {
    getPageBuilderRouteFn: legacyRegistryStub(),
    readArtifactFn: artifactStub({ 'alopecia-areata': { ok: false, reason: 'persisted Page Plan artifact has no valid `plan.route`' } }),
  });
  check('MISSING_ROUTE_FAILS', 'not ok', !result.ok);
  check('MISSING_ROUTE_FAILS', 'names the reason', result.violations.some((v) => v.includes('plan.route')), JSON.stringify(result.violations));
})();

// ─────────────────────────────────────────────────────────────────────────
// 6. artifact missing h1 fails
// ─────────────────────────────────────────────────────────────────────────
(function testArtifactMissingH1FailsClosed() {
  const result = resolveTrustedSiblingPages(['alopecia-areata'], CLUSTER_KEY, {
    getPageBuilderRouteFn: legacyRegistryStub(),
    readArtifactFn: artifactStub({ 'alopecia-areata': { ok: false, reason: 'persisted Page Plan artifact has no valid `plan.h1`' } }),
  });
  check('MISSING_H1_FAILS', 'not ok', !result.ok);
  check('MISSING_H1_FAILS', 'names the reason', result.violations.some((v) => v.includes('plan.h1')), JSON.stringify(result.violations));
})();

// ─────────────────────────────────────────────────────────────────────────
// 7. artifact topic mismatch fails where applicable
// ─────────────────────────────────────────────────────────────────────────
(function testArtifactTopicMismatchFailsClosed() {
  const result = resolveTrustedSiblingPages(['alopecia-areata'], CLUSTER_KEY, {
    getPageBuilderRouteFn: legacyRegistryStub(),
    readArtifactFn: artifactStub({ 'alopecia-areata': { ok: false, reason: 'artifact topic_slug "androgenetic-alopecia" does not match the published slug "alopecia-areata"' } }),
  });
  check('TOPIC_MISMATCH_FAILS', 'not ok', !result.ok);
  check('TOPIC_MISMATCH_FAILS', 'names the mismatch', result.violations.some((v) => v.includes('does not match the published slug')), JSON.stringify(result.violations));
})();

// ─────────────────────────────────────────────────────────────────────────
// 8. duplicate resolved published route fails
// ─────────────────────────────────────────────────────────────────────────
(function testDuplicateResolvedRouteFailsClosed() {
  // Two DIFFERENT published, active-cluster slugs somehow resolving to
  // the exact same route -- e.g. an artifact hand-edited to a route the
  // legacy registry already owns.
  const result = resolveTrustedSiblingPages(['hair-cycle', 'alopecia-areata'], CLUSTER_KEY, {
    getPageBuilderRouteFn: legacyRegistryStub(),
    readArtifactFn: artifactStub({ 'alopecia-areata': { ok: true, route: '/education/hair-loss/hair-growth-cycle', h1: 'A Duplicate' } }),
  });
  check('DUPLICATE_ROUTE_FAILS', 'not ok', !result.ok);
  check('DUPLICATE_ROUTE_FAILS', 'names the rule and the colliding route', result.violations.some((v) => v.startsWith('DUPLICATE_PUBLISHED_ROUTE:/education/hair-loss/hair-growth-cycle')), JSON.stringify(result.violations));
})();

// ─────────────────────────────────────────────────────────────────────────
// 9. published topic outside the active cluster may be ignored normally
// ─────────────────────────────────────────────────────────────────────────
(function testTopicOutsideActiveClusterIgnoredNormally() {
  const result = resolveTrustedSiblingPages(['some-other-cluster-topic'], CLUSTER_KEY, {
    getPageBuilderRouteFn: () => { throw new Error('should never even be consulted for an out-of-cluster topic'); },
    readArtifactFn: () => { throw new Error('should never even be consulted for an out-of-cluster topic'); },
  });
  check('OUT_OF_CLUSTER_IGNORED', 'ok (no violation just for being out of cluster)', result.ok, JSON.stringify(result));
  check('OUT_OF_CLUSTER_IGNORED', 'resolves to zero pages, not an error', result.pages.length === 0);
})();

// ─────────────────────────────────────────────────────────────────────────
// 12. current hair-cycle + telogen-effluvium fixture passes (both
//     legacy, together, exactly the current production state)
// ─────────────────────────────────────────────────────────────────────────
(function testCurrentProductionFixturePasses() {
  const result = resolveTrustedSiblingPages(['hair-cycle', 'telogen-effluvium'], CLUSTER_KEY, {
    getPageBuilderRouteFn: legacyRegistryStub(),
    readArtifactFn: artifactStub({}),
  });
  check('CURRENT_PRODUCTION_FIXTURE', 'ok', result.ok, JSON.stringify(result));
  check('CURRENT_PRODUCTION_FIXTURE', 'both real routes resolved', result.pages.length === 2
    && result.pages.some((p) => p.route === '/education/hair-loss/hair-growth-cycle')
    && result.pages.some((p) => p.route === '/education/hair-loss/telogen-effluvium'));
})();

(function testMixedLegacyAndGeneratedResolveTogether() {
  // hair-cycle/telogen-effluvium via the legacy registry, a THIRD
  // published topic via a valid persisted artifact -- proves both
  // trusted sources compose correctly in one resolution.
  const result = resolveTrustedSiblingPages(['hair-cycle', 'telogen-effluvium', 'alopecia-areata'], CLUSTER_KEY, {
    getPageBuilderRouteFn: legacyRegistryStub(),
    readArtifactFn: artifactStub({ 'alopecia-areata': { ok: true, route: '/education/hair-loss/alopecia-areata', h1: 'Alopecia Areata Overview' } }),
  });
  check('MIXED_SOURCES', 'ok', result.ok, JSON.stringify(result));
  check('MIXED_SOURCES', 'all three resolved', result.pages.length === 3);
})();

(function testRealDefaultsResolveTodaysActualProductionState() {
  // NO io overrides at all -- this exercises the REAL Page Builder route
  // registry and the REAL (disk-reading) artifact reader default, not a
  // stub, proving today's two actual published pages still resolve.
  const result = resolveTrustedSiblingPages(['hair-cycle', 'telogen-effluvium'], CLUSTER_KEY);
  check('REAL_DEFAULTS_PRODUCTION', 'ok against the real registry', result.ok, JSON.stringify(result));
  check('REAL_DEFAULTS_PRODUCTION', 'both real production routes resolved', result.pages.length === 2
    && result.pages.some((p) => p.route === '/education/hair-loss/hair-growth-cycle')
    && result.pages.some((p) => p.route === '/education/hair-loss/telogen-effluvium'), JSON.stringify(result));
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
