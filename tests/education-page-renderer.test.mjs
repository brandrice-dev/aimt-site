// AIMT Education Operations v1 — deterministic tests for the generic
// page renderer (functions/_lib/education-ops/education-page-renderer.mjs).
// PURE, no network, no model call. Focused on the JSON-LD correction:
// HTML-entity escaping is not JSON string serialization, and reusing it
// inside <script type="application/ld+json"> previously produced
// literal "&amp;"/"&quot;" INSIDE the JSON string values.
//
// Run: node tests/education-page-renderer.test.mjs

import { renderEducationPageHtml } from '../functions/_lib/education-ops/education-page-renderer.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

function unit(kind, text, claimIds = [], sourceStatements = []) {
  return { kind, text, supporting_claim_ids: claimIds, source_statements: sourceStatements };
}

function baselinePlan(overrides = {}) {
  return {
    topic_slug: 'x-topic', cluster: 'hair-loss-shedding', route: '/education/hair-loss/x-topic',
    title: 'X Topic | AIMT', meta_description: 'A page about x.', h1: 'X Topic',
    answer_summary: unit('VERBATIM', 'Follicles cycle through phases.', ['c1'], ['Follicles cycle through phases.']),
    sections: [{ section_id: 'overview', heading: 'Overview', units: [unit('FRAMING', 'This matters.')] }],
    scope_note: 'This page describes normal cycling only.',
    limitations: [unit('VERBATIM', 'Evidence is limited.', ['c2'], ['Evidence is limited.'])],
    key_takeaways: [unit('VERBATIM', 'Follicles cycle through phases.', ['c1'], ['Follicles cycle through phases.'])],
    sources: [{ source_id: 's1', title: 'A Reference', authors: ['A. Author'], year: 2023, doi: '10.1/x', url: 'https://doi.org/10.1/x' }],
    related_links: [{ href: '/education', label: 'Education Library', relation: 'library_home' }],
    visual_recommendation: { recommendation: 'NONE', rationale: 'Prose is sufficient.' },
    ...overrides,
  };
}

/** Extracts and returns the parsed contents of the ld+json script block. */
function extractJsonLd(html) {
  const match = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
  if (!match) throw new Error('No ld+json script block found in rendered HTML.');
  return { raw: match[1], parsed: JSON.parse(match[1]) };
}

(function testPlainTitleRendersValidJsonLd() {
  const html = renderEducationPageHtml(baselinePlan());
  const { parsed } = extractJsonLd(html);
  const webpage = parsed['@graph'].find((n) => n['@type'] === 'WebPage');
  check('PLAIN_TITLE', 'ld+json parses as valid JSON', !!parsed);
  check('PLAIN_TITLE', 'WebPage name matches the plan h1 exactly', webpage.name === 'X Topic');
})();

(function testAmpersandAndQuotesSurviveRoundTripExactly() {
  // The specific regression this correction fixes: a title/description
  // containing "&" and quotation marks must come back from JSON.parse
  // as the LITERAL "&"/'"' characters -- never "&amp;"/"&quot;" (which
  // is what HTML-entity escaping would have produced if reused here).
  const plan = baselinePlan({
    h1: 'Hair Loss & Shedding: "The Full Picture"',
    meta_description: 'Covers "shedding" & hair loss, with "quoted" terms.',
  });
  const html = renderEducationPageHtml(plan);
  const { raw, parsed } = extractJsonLd(html);
  const webpage = parsed['@graph'].find((n) => n['@type'] === 'WebPage');

  check('AMP_AND_QUOTES', 'JSON.parse succeeds on the raw script contents', !!parsed);
  check('AMP_AND_QUOTES', 'parsed name equals the intended string with a literal "&"', webpage.name === 'Hair Loss & Shedding: "The Full Picture"', webpage.name);
  check('AMP_AND_QUOTES', 'parsed description equals the intended string with literal quotes', webpage.description === 'Covers "shedding" & hair loss, with "quoted" terms.', webpage.description);
  check('AMP_AND_QUOTES', 'the raw script text does NOT contain the HTML entity "&amp;"', !raw.includes('&amp;'), raw);
  check('AMP_AND_QUOTES', 'the raw script text does NOT contain the HTML entity "&quot;"', !raw.includes('&quot;'), raw);
})();

(function testScriptTerminationSequenceCannotEscapeTheBlock() {
  // A value containing a literal "</script>" must never be able to
  // terminate the JSON-LD script tag early -- toSafeJsonLd() escapes
  // "<" as the valid JSON escape "<" for exactly this reason.
  const plan = baselinePlan({ h1: 'Innocuous</script><script>alert(1)</script> Title' });
  const html = renderEducationPageHtml(plan);
  const { raw, parsed } = extractJsonLd(html);
  check('SCRIPT_TERMINATION', 'JSON.parse still succeeds', !!parsed);
  check('SCRIPT_TERMINATION', 'the raw script text contains no literal "<" at all', !raw.includes('<'), raw);
  const webpage = parsed['@graph'].find((n) => n['@type'] === 'WebPage');
  check('SCRIPT_TERMINATION', 'the decoded value still contains the original literal "<" (proving \\u003c round-trips correctly)', webpage.name.includes('</script>'), webpage.name);
  check('SCRIPT_TERMINATION', 'only ONE <script type="application/ld+json"> tag exists in the whole document', (html.match(/<script type="application\/ld\+json">/g) || []).length === 1);
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
