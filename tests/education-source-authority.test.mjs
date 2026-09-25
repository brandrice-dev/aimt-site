// AIMT Education Operations v1 — deterministic tests for source
// authority (functions/_lib/education-ops/education-source-authority.mjs).
// PURE, no network, no model call. Proves the model has NO way to
// influence rendered source metadata -- this module derives it
// entirely from the cleared snapshot's own citation_map.
//
// Run: node tests/education-source-authority.test.mjs

import { buildTrustedSources } from '../functions/_lib/education-ops/education-source-authority.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

(function testDerivesRealMetadataFromCitationMap() {
  const snapshot = {
    source_ids: ['s1', 's2'],
    citation_map: {
      s1: { title: 'Real Title One', authors: ['A. Author'], year: 2022, doi: '10.1/one', url: 'https://doi.org/10.1/one' },
      s2: { title: 'Real Title Two', authors: [], year: 2019, doi: null, url: null },
    },
  };
  const sources = buildTrustedSources(snapshot);
  check('DERIVES_REAL_METADATA', 'returns exactly the cleared source_ids, in order', JSON.stringify(sources.map((s) => s.source_id)) === JSON.stringify(['s1', 's2']));
  check('DERIVES_REAL_METADATA', 's1 title matches the citation_map, not anything else', sources[0].title === 'Real Title One');
  check('DERIVES_REAL_METADATA', 's1 url matches the citation_map', sources[0].url === 'https://doi.org/10.1/one');
  check('DERIVES_REAL_METADATA', 's2 (sparse metadata) still resolves without throwing', sources[1].title === 'Real Title Two' && sources[1].doi === null && sources[1].url === null);
})();

(function testModelCannotInjectFakeMetadataForARealSourceId() {
  // The whole point of this module: even if a "model output" object
  // existed alongside a real, cleared source_id, this function has NO
  // parameter through which that model output could ever reach the
  // returned metadata -- it reads ONLY clearedSnapshot.citation_map.
  const snapshot = {
    source_ids: ['s1'],
    citation_map: { s1: { title: 'The Real, Cleared Title', authors: ['Real Author'], year: 2021, doi: '10.1/real', url: 'https://doi.org/10.1/real' } },
  };
  // Simulate what an untrusted model MIGHT have wanted to inject --
  // this object is never passed to buildTrustedSources at all.
  const hypotheticalModelClaim = { source_id: 's1', title: 'A Completely Fabricated Title', url: 'https://not-a-real-domain.example/fake' };
  const sources = buildTrustedSources(snapshot);
  check('NO_MODEL_INJECTION_PATH', 'the real cleared title is used', sources[0].title === 'The Real, Cleared Title');
  check('NO_MODEL_INJECTION_PATH', 'the fabricated title never appears anywhere in the result', sources[0].title !== hypotheticalModelClaim.title);
  check('NO_MODEL_INJECTION_PATH', 'the real cleared url is used, never the fabricated one', sources[0].url === 'https://doi.org/10.1/real' && sources[0].url !== hypotheticalModelClaim.url);
})();

(function testMissingCitationMapEntryFallsBackToSourceIdNeverBlank() {
  const snapshot = { source_ids: ['s-untracked'], citation_map: {} };
  const sources = buildTrustedSources(snapshot);
  check('MISSING_CITATION_ENTRY', 'falls back to the source_id itself as the title, never null/blank', sources[0].title === 's-untracked');
  check('MISSING_CITATION_ENTRY', 'authors defaults to an empty array', Array.isArray(sources[0].authors) && sources[0].authors.length === 0);
  check('MISSING_CITATION_ENTRY', 'year/doi/url default to null, never a fabricated value', sources[0].year === null && sources[0].doi === null && sources[0].url === null);
})();

(function testEmptySourceIdsProducesEmptyArray() {
  const sources = buildTrustedSources({ source_ids: [], citation_map: {} });
  check('EMPTY_SOURCES', 'returns an empty array, not null/throw', Array.isArray(sources) && sources.length === 0);
})();

(function testMissingCitationMapEntirelyDoesNotThrow() {
  const sources = buildTrustedSources({ source_ids: ['s1'] });
  check('MISSING_CITATION_MAP', 'does not throw when citation_map is absent entirely', sources.length === 1 && sources[0].source_id === 's1');
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
