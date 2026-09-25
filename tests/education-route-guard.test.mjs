// AIMT Education Operations v1 — deterministic tests for the
// route-collision guard (functions/_lib/education-ops/
// education-route-guard.mjs). PURE, no network, no model call.
//
// Run: node tests/education-route-guard.test.mjs

import { checkRouteNotAlreadyPublished } from '../functions/_lib/education-ops/education-route-guard.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

(function testNormalUnusedRoutePasses() {
  const result = checkRouteNotAlreadyPublished('/education/hair-loss/alopecia-areata', ['/education/hair-loss/hair-growth-cycle', '/education/hair-loss/telogen-effluvium']);
  check('UNUSED_ROUTE_PASSES', 'valid', result.valid);
  check('UNUSED_ROUTE_PASSES', 'no violations', result.violations.length === 0);
})();

(function testCollidingRouteFails() {
  // The exact scenario the correction describes: a planner choosing
  // "telogen-effluvium" as the route_slug for an unrelated topic would
  // compute this exact route.
  const result = checkRouteNotAlreadyPublished('/education/hair-loss/telogen-effluvium', ['/education/hair-loss/hair-growth-cycle', '/education/hair-loss/telogen-effluvium']);
  check('COLLIDING_ROUTE_FAILS', 'invalid', !result.valid);
  check('COLLIDING_ROUTE_FAILS', 'names the exact colliding route', result.violations.some((v) => v.includes('/education/hair-loss/telogen-effluvium')), JSON.stringify(result.violations));
  check('COLLIDING_ROUTE_FAILS', 'names the rule', result.violations.some((v) => v.startsWith('ROUTE_COLLIDES_WITH_PUBLISHED_PAGE')));
})();

(function testEmptyPublishedRoutesNeverFalselyCollides() {
  const result = checkRouteNotAlreadyPublished('/education/hair-loss/anything', []);
  check('EMPTY_PUBLISHED_SET', 'valid when nothing is published yet', result.valid);
})();

(function testUndefinedPublishedRoutesTreatedAsEmpty() {
  let threw = false;
  let result;
  try { result = checkRouteNotAlreadyPublished('/education/hair-loss/anything', undefined); } catch (e) { threw = true; }
  check('UNDEFINED_PUBLISHED_SET', 'does not throw', !threw);
  check('UNDEFINED_PUBLISHED_SET', 'treated as no collision', !threw && result.valid);
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
