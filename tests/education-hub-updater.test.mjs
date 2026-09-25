// AIMT Education Operations v1 — deterministic tests for the cluster
// hub card insertion (functions/_lib/education-ops/
// education-hub-updater.mjs). PURE string transform, no file I/O.
//
// Run: node tests/education-hub-updater.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildHubCardHtml, insertHubCard, HubUpdateError } from '../functions/_lib/education-ops/education-hub-updater.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const REAL_HUB_PATH = fileURLToPath(new URL('../education/hair-loss.html', import.meta.url));

(function testInsertsIntoTheRealLiveHubFile() {
  // Exercises the real, currently-live hub file (read-only -- this test
  // never writes it back), proving the matcher actually finds the real
  // markup shape, not just a synthetic fixture shaped to fit it.
  const realHub = readFileSync(REAL_HUB_PATH, 'utf8');
  const card = buildHubCardHtml({ route: '/education/hair-loss/alopecia-areata', h1: 'Alopecia Areata: A Practitioner Education Overview', meta_description: 'An overview of alopecia areata.', sourceCount: 8 });
  const updated = insertHubCard(realHub, card);
  check('REAL_HUB_FILE', 'the new card is present', updated.includes('/education/hair-loss/alopecia-areata'));
  check('REAL_HUB_FILE', 'the existing hair-growth-cycle card is preserved', updated.includes('/education/hair-loss/hair-growth-cycle'));
  check('REAL_HUB_FILE', 'the existing telogen-effluvium card is preserved', updated.includes('/education/hair-loss/telogen-effluvium'));
  check('REAL_HUB_FILE', 'exactly one grid still opens', (updated.match(/<ul class="aimt-edu-card-grid">/g) || []).length === 1);
  check('REAL_HUB_FILE', 'new card appears before the grid closes', updated.indexOf('/education/hair-loss/alopecia-areata') < updated.indexOf('</ul>'));
})();

(function testThrowsWhenGridMarkupMissing() {
  let threw = false;
  try {
    insertHubCard('<html><body>no grid here</body></html>', buildHubCardHtml({ route: '/x', h1: 'X', meta_description: 'x', sourceCount: 1 }));
  } catch (e) {
    threw = e instanceof HubUpdateError;
  }
  check('MISSING_GRID', 'throws HubUpdateError rather than silently doing nothing', threw);
})();

(function testThrowsOnDuplicateCard() {
  const hub = '<ul class="aimt-edu-card-grid">\n  <li>existing</li>\n</ul>';
  const card = buildHubCardHtml({ route: '/education/hair-loss/x', h1: 'X', meta_description: 'x', sourceCount: 1 });
  const once = insertHubCard(hub, card);
  let threw = false;
  try {
    insertHubCard(once, card);
  } catch (e) {
    threw = e instanceof HubUpdateError;
  }
  check('DUPLICATE_CARD', 'refuses to insert the exact same card twice', threw);
})();

(function testCardHtmlEscapesUserFacingText() {
  const card = buildHubCardHtml({ route: '/education/hair-loss/x', h1: 'A & B <script>', meta_description: 'Contains "quotes" & an ampersand.', sourceCount: 3 });
  check('ESCAPING', 'ampersand escaped', card.includes('A &amp; B'));
  check('ESCAPING', 'angle brackets escaped', !card.includes('<script>'));
  check('ESCAPING', 'quotes escaped in attribute-adjacent text', card.includes('&quot;quotes&quot;'));
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
