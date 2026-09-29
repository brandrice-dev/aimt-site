// AIMT Education Operations v1 — deterministic tests for the generic
// page renderer (functions/_lib/education-ops/education-page-renderer.mjs).
// PURE, no network, no model call. Focused on the JSON-LD correction:
// HTML-entity escaping is not JSON string serialization, and reusing it
// inside <script type="application/ld+json"> previously produced
// literal "&amp;"/"&quot;" INSIDE the JSON string values.
//
// Run: node tests/education-page-renderer.test.mjs

import { renderEducationPageHtml, GENERATION_MARKER_META_NAME } from '../functions/_lib/education-ops/education-page-renderer.mjs';

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

// ─────────────────────────────────────────────────────────────────────────
// EMPTY-SECTION CORRECTION: a real generated Page Plan (alopecia-areata,
// AIMT Education Publish Run #2) persisted a "human-side" section with
// zero units -- the renderer used to emit the empty heading/section
// anyway, and its TOC link, producing a visible defect on the live
// page. The Page Plan itself is allowed to keep the zero-unit section
// as an auditable artifact; only the RENDERED HTML/TOC must omit it.
// ─────────────────────────────────────────────────────────────────────────
function planWithEmptySection(overrides = {}) {
  return baselinePlan({
    sections: [
      { section_id: 'overview', heading: 'Overview', units: [unit('PARAPHRASE', 'A neighboring, non-empty section.', ['c1'], ['Follicles cycle through phases.'])] },
      { section_id: 'human-side', heading: 'The Human Side of a Visible Condition', units: [] },
    ],
    ...overrides,
  });
}

(function testZeroUnitSectionHeadingAndBodyAreAbsent() {
  const html = renderEducationPageHtml(planWithEmptySection());
  check('EMPTY_SECTION', '1. zero-unit section heading is absent', !html.includes('The Human Side of a Visible Condition'));
  check('EMPTY_SECTION', '2. zero-unit section body/tag is absent (no id="human-side" section at all)', !html.includes('id="human-side"'));
})();

(function testZeroUnitSectionTocLinkIsAbsent() {
  const html = renderEducationPageHtml(planWithEmptySection());
  check('EMPTY_SECTION', '3. zero-unit section TOC link is absent', !html.includes('<a href="#human-side">'));
})();

(function testNeighboringNonEmptySectionsStillRender() {
  const html = renderEducationPageHtml(planWithEmptySection());
  check('EMPTY_SECTION', '4. neighboring non-empty section heading renders', html.includes('Overview'));
  check('EMPTY_SECTION', '4. neighboring non-empty section body renders', html.includes('A neighboring, non-empty section.'));
  check('EMPTY_SECTION', '4. neighboring non-empty section TOC link renders', html.includes('<a href="#overview">Overview</a>'));
})();

(function testUnrelatedPageOutputRemainsUnchangedWithAnEmptySection() {
  const withEmpty = renderEducationPageHtml(planWithEmptySection());
  const withoutEmptySectionAtAll = renderEducationPageHtml(planWithEmptySection({
    sections: [{ section_id: 'overview', heading: 'Overview', units: [unit('PARAPHRASE', 'A neighboring, non-empty section.', ['c1'], ['Follicles cycle through phases.'])] }],
  }));
  check('EMPTY_SECTION', '5. output is byte-identical whether the zero-unit section is present in the plan or omitted entirely from it', withEmpty === withoutEmptySectionAtAll);
  check('EMPTY_SECTION', 'scope/limitations still render', withEmpty.includes('This page describes normal cycling only.'));
  check('EMPTY_SECTION', 'key takeaways still render', withEmpty.includes('Key takeaways'));
  check('EMPTY_SECTION', 'sources still render', withEmpty.includes('A Reference'));
  check('EMPTY_SECTION', 'related links still render', withEmpty.includes('Education Library'));
  check('EMPTY_SECTION', 'canonical link still renders', withEmpty.includes('<link rel="canonical"'));
})();

(function testAllSectionsEmptyOmitsEveryOneButKeepsRestOfPage() {
  const html = renderEducationPageHtml(baselinePlan({ sections: [{ section_id: 'human-side', heading: 'The Human Side of a Visible Condition', units: [] }] }));
  check('EMPTY_SECTION', 'a plan whose ONLY section is empty renders zero <section> tags for it', !html.includes('id="human-side"') && !html.includes('The Human Side of a Visible Condition'));
  check('EMPTY_SECTION', 'the rest of the page (scope/takeaways/sources) still renders', html.includes('Key takeaways') && html.includes('A Reference'));
})();

(function testDefaultModeIsUnaffectedByTheNewOptionsParameter() {
  const html = renderEducationPageHtml(baselinePlan());
  check('LAUNCH_READY', 'default (no options) keeps the preview noindex tag exactly as before', html.includes('<meta name="robots" content="noindex, nofollow">'));
  check('LAUNCH_READY', 'default (no options) never emits a generation marker when no hash was given', !html.includes(GENERATION_MARKER_META_NAME));
})();

(function testLaunchReadyOmitsNoindex() {
  const html = renderEducationPageHtml(baselinePlan(), { launchReady: true });
  check('LAUNCH_READY', 'launchReady:true omits the noindex tag', !html.includes('noindex'));
  check('LAUNCH_READY', 'launchReady:true still renders a canonical link', html.includes('<link rel="canonical"'));
})();

(function testGenerationMarkerEmbedsExactHashInBothModes() {
  const previewHtml = renderEducationPageHtml(baselinePlan(), { generationSourceHash: 'abc123' });
  const launchHtml = renderEducationPageHtml(baselinePlan(), { launchReady: true, generationSourceHash: 'abc123' });
  check('GENERATION_MARKER', 'preview mode embeds the marker when a hash is supplied', previewHtml.includes(`<meta name="${GENERATION_MARKER_META_NAME}" content="abc123">`));
  check('GENERATION_MARKER', 'launch-ready mode ALSO embeds the same marker', launchHtml.includes(`<meta name="${GENERATION_MARKER_META_NAME}" content="abc123">`));
  check('GENERATION_MARKER', 'preview mode with a marker still keeps noindex (marker is independent of launchReady)', previewHtml.includes('noindex'));
})();

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
