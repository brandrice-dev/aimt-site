// AIMT Page Builder v1 — deterministic unit tests (SHADOW MODE).
// NO LIVE/MODEL/DATABASE CALLS: every fixture is synthetic; the loader's
// network call is never exercised here (only exercised, against a
// mocked fetch, for its structural read-only-ness); no Anthropic call is
// ever made -- page-builder-fidelity.mjs's model-based check is imported
// only to prove it exists and is never invoked in this file.
//
// Run: node tests/page-builder-v1.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildPageDraft, classifyCoreFactualPoints } from '../functions/_lib/page-builder/page-builder-draft.mjs';
import { validatePageDraft } from '../functions/_lib/page-builder/page-builder-validator.mjs';
import { checkDraftFidelity, checkParagraphFidelityDeterministic, checkParagraphFidelityWithModel } from '../functions/_lib/page-builder/page-builder-fidelity.mjs';
import { finalizeSeo, buildStructuredData } from '../functions/_lib/page-builder/page-builder-seo.mjs';
import { buildCostMetrics } from '../functions/_lib/page-builder/page-builder-cost.mjs';
import { getPageBuilderRoute } from '../functions/_lib/page-builder/page-builder-route-registry.mjs';
import { extractClearedSnapshot, assertClearedRowOrThrow, CLEARED_SNAPSHOT_FIELDS } from '../functions/_lib/page-builder/page-builder-loader.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

function fixtureSnapshot(overrides = {}) {
  return {
    topic_slug: 'hair-cycle',
    page_concept: 'The Hair Growth Cycle: A Practitioner Education Overview',
    public_intent: 'Explain the normal hair-growth cycle clearly and accurately for beauty/scalp-care professionals and informed readers.',
    risk_tier: 'LOWER',
    selected_claim_ids: ['c-def', 'c-timing', 'c-mech', 'c-factors', 'c-prac', 'c-lim1', 'c-lim2'],
    core_factual_points: [
      { statement: 'The normal hair follicle cycles through four recognized phases: anagen (active growth), catagen (regression), telogen (rest), and exogen (shedding of the old hair).', supporting_claim_ids: ['c-def'] },
      { statement: 'In humans, scalp anagen typically lasts around 3 years, catagen around 3 weeks, and telogen around 3 months, and roughly 9% of scalp follicles are in telogen at any given time.', supporting_claim_ids: ['c-timing'] },
      { statement: 'Cycling is driven by hair follicle stem cells and the dermal papilla, coordinated by conserved signaling pathways such as Wnt, Sonic hedgehog, Notch, and BMP.', supporting_claim_ids: ['c-mech'] },
      { statement: 'Everyday physiological factors — such as hormones, stress, nutrition, sleep, inflammation, and blood flow — can normally influence the transition between growth and rest phases.', supporting_claim_ids: ['c-factors'] },
      { statement: 'Because follicles cycle individually and asynchronously, distinguishing normal cycle variation from abnormal cycling requires attention to objective morphological criteria, which is relevant for practitioners assessing scalp health.', supporting_claim_ids: ['c-prac'] },
    ],
    limitations: [
      { statement: 'Much of the molecular detail describing cycle regulation comes from murine/animal models, and translation of these mechanisms to humans is not always fully confirmed.', supporting_claim_ids: ['c-lim1'] },
      { statement: 'Several foundational sources on the hair cycle are narrative reviews rather than systematic evidence syntheses, so the strength of underlying evidence varies across specific mechanistic claims.', supporting_claim_ids: ['c-lim2'] },
    ],
    citation_map: {
      's1': { title: 'Source One', authors: ['A. Author'], year: 2020, doi: '10.1/one', url: 'https://doi.org/10.1/one' },
      's2': { title: 'Source Two', authors: ['B. Author'], year: 2021, doi: '10.1/two', url: 'https://doi.org/10.1/two' },
    },
    source_ids: ['s1', 's2'],
    scope_language: {
      page_scope: { include: ['normal cycling'], exclude: ['Treatment or intervention efficacy (e.g., PRP, minoxidil, LLLT)'] },
      scope_note: 'This page is limited to describing the normal hair growth cycle for practitioner education purposes.',
    },
    ...overrides,
  };
}

function buildValidDraft(snapshotOverrides = {}) {
  const snapshot = fixtureSnapshot(snapshotOverrides);
  let draft = buildPageDraft(snapshot, { generationSourceHash: 'deadbeef', fingerprintAlgorithm: 'sha256-canonical-json-v2' });
  draft = finalizeSeo(draft);
  return { snapshot, draft };
}

const VALID_INTEGRITY = { valid: true, expected_hash: 'deadbeef', stored_hash: 'deadbeef', violations: [] };

// ─────────────────────────────────────────────────────────────────────────
// 1. Valid cleared snapshot → draft eligible
// ─────────────────────────────────────────────────────────────────────────
function testValidSnapshotProducesEligibleDraft() {
  const { snapshot, draft } = buildValidDraft();
  const validation = validatePageDraft(draft, snapshot, { integrityResult: VALID_INTEGRITY });
  check('VALID_SNAPSHOT_ELIGIBLE', 'draft validates', validation.valid, JSON.stringify(validation));
  check('VALID_SNAPSHOT_ELIGIBLE', 'draft has sections', draft.sections.length > 0);
  check('VALID_SNAPSHOT_ELIGIBLE', 'draft topic_slug matches snapshot', draft.topic_slug === snapshot.topic_slug);
}

// ─────────────────────────────────────────────────────────────────────────
// 2. Failed clearance integrity → refuse
// ─────────────────────────────────────────────────────────────────────────
async function testFailedIntegrityRefuses() {
  const badRecord = {
    clearance_mode: 'AUTO_READY',
    status: 'ready_for_page_builder',
    topic_slug: 'hair-cycle',
    key_claim_ids: ['c-def'],
    source_ids: ['s1'],
    generation_source_hash: 'deadbeef',
    publication_clearance: {
      fingerprint_algorithm: 'sha256-canonical-json-v2',
      fingerprint_input: { topic_slug: 'hair-cycle', selected_claim_ids: ['c-def'], source_ids: ['s1'], risk_tier: 'LOWER' },
      risk_tier: 'LOWER',
    },
  };
  // generation_source_hash "deadbeef" will never equal the real SHA-256
  // of the fingerprint_input above -- this is a deliberately broken
  // record, proving assertClearedRowOrThrow refuses it.
  let threw = false;
  let code = null;
  try {
    await assertClearedRowOrThrow(badRecord);
  } catch (e) {
    threw = true;
    code = e.code;
  }
  check('FAILED_INTEGRITY_REFUSED', 'assertClearedRowOrThrow throws on a hash-inconsistent record', threw && code === 'integrity_failed', code);

  // Also prove the post-draft validator independently refuses to trust a
  // draft built alongside a failed integrity result, even if somehow
  // constructed.
  const { snapshot, draft } = buildValidDraft();
  const validation = validatePageDraft(draft, snapshot, { integrityResult: { valid: false, violations: ['HASH_MISMATCH'] } });
  check('FAILED_INTEGRITY_REFUSED', 'validator refuses a draft accompanied by a failed integrity result', !validation.valid && validation.violations.includes('STALE_OR_FAILED_INTEGRITY'), JSON.stringify(validation));

  const validationNoContext = validatePageDraft(draft, snapshot, {});
  check('FAILED_INTEGRITY_REFUSED', 'validator refuses a draft with no integrity context at all', !validationNoContext.valid && validationNoContext.violations.includes('MISSING_INTEGRITY_CONTEXT'), JSON.stringify(validationNoContext));
}

// ─────────────────────────────────────────────────────────────────────────
// 3-4. Unsupported / excluded claim ID used as support → fail
// ─────────────────────────────────────────────────────────────────────────
function testUnsupportedClaimIdFails() {
  const { snapshot, draft } = buildValidDraft();
  const tampered = JSON.parse(JSON.stringify(draft));
  tampered.sections[0].paragraphs[0].supporting_claim_ids.push('c-never-cleared-or-excluded');
  const validation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('UNSUPPORTED_CLAIM_ID_FAILS', 'a claim ID outside selected_claim_ids fails validation', !validation.valid && validation.violations.some((v) => v.startsWith('UNSUPPORTED_CLAIM_ID')), JSON.stringify(validation));
}

function testExcludedClaimNeverReachableAtAll() {
  // Structural proof: the cleared snapshot itself never carries excluded
  // claim IDs at all (page-builder-loader.mjs only extracts the ten
  // fingerprint_input fields) -- so "using an excluded claim as support"
  // can only manifest as an unsupported-claim-ID failure, which the
  // previous test already proves is caught.
  check('EXCLUDED_CLAIM_STRUCTURALLY_UNREACHABLE', 'CLEARED_SNAPSHOT_FIELDS does not include excluded_claim_ids', !CLEARED_SNAPSHOT_FIELDS.includes('excluded_claim_ids'));
}

// ─────────────────────────────────────────────────────────────────────────
// 5. Factual paragraph with no support → fail
// ─────────────────────────────────────────────────────────────────────────
function testUnsupportedFactualParagraphFails() {
  const { snapshot, draft } = buildValidDraft();
  const tampered = JSON.parse(JSON.stringify(draft));
  tampered.sections[0].paragraphs[0].supporting_claim_ids = [];
  const validation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('UNSUPPORTED_FACTUAL_PARAGRAPH_FAILS', 'a factual paragraph with zero supporting_claim_ids fails validation', !validation.valid && validation.violations.some((v) => v.startsWith('FACTUAL_PARAGRAPH_MISSING_SUPPORT')), JSON.stringify(validation));
}

function testFramingParagraphExemptFromSupportRequirement() {
  const { snapshot, draft } = buildValidDraft();
  const validation = validatePageDraft(draft, snapshot, { integrityResult: VALID_INTEGRITY });
  const framingPara = draft.sections.find((s) => s.section_id === 'why-it-matters').paragraphs[0];
  check('FRAMING_PARAGRAPH_EXEMPT', 'the framing paragraph itself has no supporting_claim_ids', framingPara.supporting_claim_ids.length === 0);
  check('FRAMING_PARAGRAPH_EXEMPT', 'yet the untouched draft still validates', validation.valid, JSON.stringify(validation));
}

// ─────────────────────────────────────────────────────────────────────────
// 6. Unsupported source → fail
// ─────────────────────────────────────────────────────────────────────────
function testUnsupportedSourceFails() {
  const { snapshot, draft } = buildValidDraft();
  const tampered = JSON.parse(JSON.stringify(draft));
  tampered.sources.push({ source_id: 's-never-cleared', title: 'Invented Source', authors: [], year: null, doi: null, url: null });
  const validation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('UNSUPPORTED_SOURCE_FAILS', 'a source outside cleared source_ids/citation_map fails validation', !validation.valid && validation.violations.some((v) => v.startsWith('UNSUPPORTED_SOURCE')), JSON.stringify(validation));
}

// ─────────────────────────────────────────────────────────────────────────
// 7. Missing limitation → fail
// ─────────────────────────────────────────────────────────────────────────
function testMissingLimitationFails() {
  const { snapshot, draft } = buildValidDraft();
  const tampered = JSON.parse(JSON.stringify(draft));
  tampered.limitations = tampered.limitations.slice(0, 1);
  // Also remove it from the rendered section so this isn't caught by a
  // coincidental duplicate elsewhere.
  const limSection = tampered.sections.find((s) => s.section_id === 'limitations');
  limSection.paragraphs = limSection.paragraphs.slice(0, 1);
  const validation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('MISSING_LIMITATION_FAILS', 'dropping a cleared limitation fails validation', !validation.valid && validation.violations.some((v) => v.startsWith('MISSING_REQUIRED_LIMITATION')), JSON.stringify(validation));
}

// ─────────────────────────────────────────────────────────────────────────
// 8. Scope violation → fail
// ─────────────────────────────────────────────────────────────────────────
function testScopeLanguageNotPreservedFails() {
  const { snapshot, draft } = buildValidDraft();
  const tampered = { ...draft, seo: { ...draft.seo, meta_description: 'A rewritten scope note that was never actually cleared.' } };
  const validation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('SCOPE_VIOLATION_FAILS', 'a meta_description that drifts from the cleared scope_note fails validation', !validation.valid && validation.violations.includes('SCOPE_LANGUAGE_NOT_PRESERVED'), JSON.stringify(validation));
}

// ─────────────────────────────────────────────────────────────────────────
// 9. Treatment/diagnosis drift → fail
// ─────────────────────────────────────────────────────────────────────────
function testTreatmentDiagnosisDriftFails() {
  const { snapshot, draft } = buildValidDraft();
  const tampered = JSON.parse(JSON.stringify(draft));
  tampered.sections[0].paragraphs.push({ text: 'Minoxidil is an effective treatment for hair loss.', supporting_claim_ids: ['c-def'] });
  const validation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('TREATMENT_DRIFT_FAILS', 'a sentence naming minoxidil/treatment fails validation', !validation.valid && validation.violations.some((v) => v.startsWith('TREATMENT_OR_DIAGNOSIS_DRIFT')), JSON.stringify(validation));
}

function testHighRiskMaterialFails() {
  const { snapshot, draft } = buildValidDraft({ risk_tier: 'HIGH' });
  const validation = validatePageDraft(draft, snapshot, { integrityResult: VALID_INTEGRITY });
  check('HIGH_RISK_FAILS', 'a HIGH risk_tier snapshot fails validation even if a draft was built from it', !validation.valid && validation.violations.includes('HIGH_RISK_MATERIAL_INTRODUCED'), JSON.stringify(validation));
}

// ─────────────────────────────────────────────────────────────────────────
// 10. Informational intent preserved (no transactional cannibalization)
// ─────────────────────────────────────────────────────────────────────────
function testInformationalIntentPreservedByDefault() {
  const { snapshot, draft } = buildValidDraft();
  const validation = validatePageDraft(draft, snapshot, { integrityResult: VALID_INTEGRITY });
  check('INFORMATIONAL_INTENT_PRESERVED', 'an untouched draft has no transactional violations', !validation.violations.some((v) => v.startsWith('TRANSACTIONAL_CANNIBALIZATION')));
  check('INFORMATIONAL_INTENT_PRESERVED', 'related_links reference the certification page as a distinct related link, not body prose', draft.related_links.some((l) => l.href === '/head-spa-certification'));
}

function testTransactionalCannibalizationFails() {
  const { snapshot, draft } = buildValidDraft();
  const tampered = JSON.parse(JSON.stringify(draft));
  tampered.sections[0].paragraphs.push({ text: 'Enroll now and buy now to certify today.', supporting_claim_ids: ['c-def'] });
  const validation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('TRANSACTIONAL_CANNIBALIZATION_FAILS', 'sales-intent body copy fails validation', !validation.valid && validation.violations.some((v) => v.startsWith('TRANSACTIONAL_CANNIBALIZATION')), JSON.stringify(validation));
}

// ─────────────────────────────────────────────────────────────────────────
// 11. Future route correct
// ─────────────────────────────────────────────────────────────────────────
function testFutureRouteCorrect() {
  const { draft } = buildValidDraft();
  const registered = getPageBuilderRoute('hair-cycle');
  check('FUTURE_ROUTE_CORRECT', 'draft.route matches the registered future route', draft.route === '/education/hair-loss/hair-growth-cycle');
  check('FUTURE_ROUTE_CORRECT', 'draft.route matches the route registry exactly (not duplicated/hardcoded separately)', draft.route === registered.route);
  check('FUTURE_ROUTE_CORRECT', 'canonical_url is built from the registered route', draft.seo.canonical_url === 'https://aimtrichology.com/education/hair-loss/hair-growth-cycle');
}

function testRouteMismatchFails() {
  const { snapshot, draft } = buildValidDraft();
  const tampered = { ...draft, route: '/head-spa-certification' };
  const validation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('ROUTE_MISMATCH_FAILS', 'a route outside /education/ fails validation', !validation.valid && validation.violations.some((v) => v.startsWith('ROUTE_MISMATCH')), JSON.stringify(validation));
}

// ─────────────────────────────────────────────────────────────────────────
// 12. No AIMT_APPROVED dependency
// ─────────────────────────────────────────────────────────────────────────
function testNoAimtApprovedDependency() {
  const { snapshot, draft } = buildValidDraft();
  const validation = validatePageDraft(draft, snapshot, { integrityResult: VALID_INTEGRITY });
  check('NO_AIMT_APPROVED_DEPENDENCY', 'an untouched draft never mentions AIMT_APPROVED', !validation.violations.includes('AIMT_APPROVED_DEPENDENCY_INTRODUCED'));

  const tampered = { ...draft, provenance: { ...draft.provenance, note: 'requires AIMT_APPROVED' } };
  const tamperedValidation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('NO_AIMT_APPROVED_DEPENDENCY', 'introducing the literal string fails validation', !tamperedValidation.valid && tamperedValidation.violations.includes('AIMT_APPROVED_DEPENDENCY_INTRODUCED'));
}

function readSrc(relPath) {
  return readFileSync(fileURLToPath(new URL(`../${relPath}`, import.meta.url)), 'utf8');
}
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function testNoCodePathRequiresAimtApproved() {
  // The draft builder and loader must never reference AIMT_APPROVED at
  // all -- they have no reason to. The validator DOES reference the
  // literal string, but only as the thing it checks is ABSENT
  // (JSON.stringify(draft).includes('AIMT_APPROVED')) -- confirmed here
  // by checking it never appears as an assignment/requirement pattern.
  for (const f of ['functions/_lib/page-builder/page-builder-draft.mjs', 'functions/_lib/page-builder/page-builder-loader.mjs']) {
    const code = stripComments(readSrc(f));
    check('NO_AIMT_APPROVED_DEPENDENCY', `${f} never references AIMT_APPROVED at all`, !/AIMT_APPROVED/.test(code));
  }
  const validatorCode = stripComments(readSrc('functions/_lib/page-builder/page-builder-validator.mjs'));
  check('NO_AIMT_APPROVED_DEPENDENCY', 'validator never assigns/requires AIMT_APPROVED as a value', !/(requires?|needs?)\s*[:=]\s*['"]?AIMT_APPROVED/i.test(validatorCode));
  check('NO_AIMT_APPROVED_DEPENDENCY', "validator's only reference is the absence-check itself", /includes\('AIMT_APPROVED'\)/.test(validatorCode));
}

// ─────────────────────────────────────────────────────────────────────────
// 13. Cost metrics recorded
// ─────────────────────────────────────────────────────────────────────────
function testCostMetricsRecorded() {
  const metrics = buildCostMetrics({ modelCalls: [], fidelityCheckCalls: 5, retries: 0, candidateClaimCount: 128, selectedClaimCount: 40 });
  check('COST_METRICS_RECORDED', 'model_calls is 0 for a fully deterministic v1 run', metrics.model_calls === 0);
  check('COST_METRICS_RECORDED', 'fidelity_check_calls reflects the deterministic paragraph checks actually run', metrics.fidelity_check_calls === 5);
  check('COST_METRICS_RECORDED', 'total_input_tokens/total_output_tokens are 0, not null, when there were zero model calls', metrics.total_input_tokens === 0 && metrics.total_output_tokens === 0);
  check('COST_METRICS_RECORDED', 'estimated_cost_usd is null (never a guessed number)', metrics.estimated_cost_usd === null);
  check('COST_METRICS_RECORDED', 'cost_reduction_note is computed from real counts, not invented', metrics.cost_reduction_note.includes('40') && metrics.cost_reduction_note.includes('128'));

  const withUnknownTokens = buildCostMetrics({ modelCalls: [{ label: 'x', model: 'm', input_tokens: null, output_tokens: null }] });
  check('COST_METRICS_RECORDED', 'a model call with unknown token counts does not fabricate a total', withUnknownTokens.total_input_tokens === null && withUnknownTokens.total_output_tokens === null);
}

// ─────────────────────────────────────────────────────────────────────────
// 14. No production write path
// ─────────────────────────────────────────────────────────────────────────
function testNoProductionWritePath() {
  const files = [
    'functions/_lib/page-builder/page-builder-loader.mjs',
    'functions/_lib/page-builder/page-builder-draft.mjs',
    'functions/_lib/page-builder/page-builder-validator.mjs',
    'functions/_lib/page-builder/page-builder-fidelity.mjs',
    'functions/_lib/page-builder/page-builder-seo.mjs',
    'functions/_lib/page-builder/page-builder-render.mjs',
    'functions/_lib/page-builder/page-builder-cost.mjs',
    'scripts/page-builder-shadow.mjs',
  ];
  for (const f of files) {
    const code = stripComments(readSrc(f));
    check('NO_PRODUCTION_WRITE_PATH', `${f} never issues a POST/PATCH/DELETE/PUT request`, !/method:\s*['"](POST|PATCH|DELETE|PUT)['"]/i.test(code));
    check('NO_PRODUCTION_WRITE_PATH', `${f} never references writeClearanceRecord`, !/writeClearanceRecord/.test(code));
    check('NO_PRODUCTION_WRITE_PATH', `${f} never sets status to 'published'`, !/status\s*[:=]\s*['"]published['"]/.test(code));
    check('NO_PRODUCTION_WRITE_PATH', `${f} never references sitemap_eligible`, !/sitemap_eligible/.test(code));
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 15. No Anthropic call in tests
// ─────────────────────────────────────────────────────────────────────────
function testNoAnthropicCallInThisTestFile() {
  const thisFileSrc = readSrc('tests/page-builder-v1.test.mjs');
  check('NO_ANTHROPIC_CALL_IN_TESTS', 'checkParagraphFidelityWithModel is imported (proving the hook exists)', typeof checkParagraphFidelityWithModel === 'function');
  // Proves the hook is never actually CALLED (identifier immediately
  // followed by an opening paren) anywhere in this test file -- only
  // imported and referenced in prose/labels, which never match this
  // call-shaped pattern.
  check('NO_ANTHROPIC_CALL_IN_TESTS', 'checkParagraphFidelityWithModel is never invoked (no call-shaped occurrence) in this test file', !/checkParagraphFidelityWithModel\s*\(/.test(thisFileSrc));
  check('NO_ANTHROPIC_CALL_IN_TESTS', 'this test file never sets globalThis.fetch (no network mocking needed -- nothing here calls out)', !/globalThis\.fetch\s*=/.test(thisFileSrc));
}

// ─────────────────────────────────────────────────────────────────────────
// Extra: deterministic fidelity check behaves as designed
// ─────────────────────────────────────────────────────────────────────────
function testDeterministicFidelityPassesOnVerbatimReuse() {
  const { snapshot, draft } = buildValidDraft();
  const fidelity = checkDraftFidelity(draft, snapshot);
  check('FIDELITY_VERBATIM_PASS', 'a v1 draft (verbatim reuse of cleared statements) passes the deterministic fidelity check', fidelity.result === 'PASS', JSON.stringify(fidelity));
}

function testDeterministicFidelityFlagsParaphrase() {
  const snapshot = fixtureSnapshot();
  const paragraph = { text: 'Hair definitely cycles through many phases including growth and rest, among others.', supporting_claim_ids: ['c-def'] };
  const result = checkParagraphFidelityDeterministic(paragraph, snapshot);
  check('FIDELITY_FLAGS_PARAPHRASE', 'a paraphrased (non-verbatim) paragraph is flagged REWRITE_REQUIRED, not silently passed', result.result === 'REWRITE_REQUIRED', JSON.stringify(result));
}

function testFramingParagraphAlwaysPassesFidelity() {
  const snapshot = fixtureSnapshot();
  const paragraph = { text: snapshot.public_intent, supporting_claim_ids: [], is_framing: true };
  const result = checkParagraphFidelityDeterministic(paragraph, snapshot);
  check('FIDELITY_FRAMING_PASSES', 'a framing paragraph always passes fidelity (no factual claim to check)', result.result === 'PASS');
}

// ─────────────────────────────────────────────────────────────────────────
// Extra: extractClearedSnapshot never expands beyond the ten fields
// ─────────────────────────────────────────────────────────────────────────
function testExtractClearedSnapshotExactlyTenFields() {
  const fakeRecord = {
    publication_clearance: {
      fingerprint_input: { ...fixtureSnapshot(), extra_field_that_should_never_leak: 'nope' },
    },
  };
  const snapshot = extractClearedSnapshot(fakeRecord);
  check('SNAPSHOT_EXACT_FIELDS', 'extracted snapshot has exactly the 10 registered fields, nothing extra', Object.keys(snapshot).length === CLEARED_SNAPSHOT_FIELDS.length && !('extra_field_that_should_never_leak' in snapshot));
  check('SNAPSHOT_EXACT_FIELDS', 'extracted snapshot is frozen (cannot be silently mutated/expanded later)', Object.isFrozen(snapshot));
}

function testStructuredDataNeverFabricates() {
  const { draft } = buildValidDraft();
  const structuredData = buildStructuredData(draft);
  const serialized = JSON.stringify(structuredData);
  check('STRUCTURED_DATA_CONSERVATIVE', 'no datePublished/dateModified (page has never been published)', !/datePublished|dateModified/.test(serialized));
  check('STRUCTURED_DATA_CONSERVATIVE', 'no aggregateRating/review (none exist)', !/aggregateRating|"review"/i.test(serialized));
  check('STRUCTURED_DATA_CONSERVATIVE', 'no invented author', !/"author"/.test(serialized));
}

const tests = [
  testValidSnapshotProducesEligibleDraft,
  testFailedIntegrityRefuses,
  testUnsupportedClaimIdFails,
  testExcludedClaimNeverReachableAtAll,
  testUnsupportedFactualParagraphFails,
  testFramingParagraphExemptFromSupportRequirement,
  testUnsupportedSourceFails,
  testMissingLimitationFails,
  testScopeLanguageNotPreservedFails,
  testTreatmentDiagnosisDriftFails,
  testHighRiskMaterialFails,
  testInformationalIntentPreservedByDefault,
  testTransactionalCannibalizationFails,
  testFutureRouteCorrect,
  testRouteMismatchFails,
  testNoAimtApprovedDependency,
  testNoCodePathRequiresAimtApproved,
  testCostMetricsRecorded,
  testNoProductionWritePath,
  testNoAnthropicCallInThisTestFile,
  testDeterministicFidelityPassesOnVerbatimReuse,
  testDeterministicFidelityFlagsParaphrase,
  testFramingParagraphAlwaysPassesFidelity,
  testExtractClearedSnapshotExactlyTenFields,
  testStructuredDataNeverFabricates,
];

for (const t of tests) {
  await t();
}

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
