// AIMT Education Operations v1 — deterministic tests for sitemap route
// insertion (functions/_lib/education-ops/education-sitemap-updater.mjs).
// PURE, no I/O.
//
// Run: node tests/education-sitemap-updater.test.mjs

import { insertSitemapRoute, sitemapContainsRoute, SitemapUpdateError } from '../functions/_lib/education-ops/education-sitemap-updater.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const BASE_SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://aimtrichology.com/</loc></url>
  <url><loc>https://aimtrichology.com/education/hair-loss/hair-growth-cycle</loc></url>
</urlset>
`;

function testInsertsANewRoute() {
  const updated = insertSitemapRoute(BASE_SITEMAP, '/education/hair-loss/alopecia-areata');
  check('INSERT', 'contains the new route', updated.includes('<loc>https://aimtrichology.com/education/hair-loss/alopecia-areata</loc>'));
  check('INSERT', 'existing routes untouched', updated.includes('<loc>https://aimtrichology.com/education/hair-loss/hair-growth-cycle</loc>'));
  check('INSERT', 'still a well-formed closing tag', updated.trim().endsWith('</urlset>'));
}

function testRefusesADuplicateRoute() {
  let threw = false;
  try {
    insertSitemapRoute(BASE_SITEMAP, '/education/hair-loss/hair-growth-cycle');
  } catch (err) {
    threw = err instanceof SitemapUpdateError;
  }
  check('DUPLICATE', 'throws SitemapUpdateError rather than inserting a duplicate', threw);
}

function testRefusesWhenMarkupIsUnexpected() {
  let threw = false;
  try {
    insertSitemapRoute('<not-a-sitemap></not-a-sitemap>', '/x');
  } catch (err) {
    threw = err instanceof SitemapUpdateError;
  }
  check('MALFORMED', 'throws rather than guessing when </urlset> is missing', threw);
}

function testSitemapContainsRoute() {
  check('CONTAINS_ROUTE', 'true for a route already present', sitemapContainsRoute(BASE_SITEMAP, '/education/hair-loss/hair-growth-cycle') === true);
  check('CONTAINS_ROUTE', 'false for a route not present', sitemapContainsRoute(BASE_SITEMAP, '/education/hair-loss/alopecia-areata') === false);
  check('CONTAINS_ROUTE', 'false (never throws) for non-string input', sitemapContainsRoute(null, '/x') === false);
}

for (const t of [testInsertsANewRoute, testRefusesADuplicateRoute, testRefusesWhenMarkupIsUnexpected, testSitemapContainsRoute]) t();

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
