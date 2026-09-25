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
import { getPageBuilderRoute, getCanonicalUrl } from '../functions/_lib/page-builder/page-builder-route-registry.mjs';
import { getPageBuilderTemplate } from '../functions/_lib/page-builder/page-builder-template-registry.mjs';
import { collectRenderedFactualUnits, computeRenderedSupportClaimIds, findDuplicateFactualText } from '../functions/_lib/page-builder/page-builder-content-units.mjs';
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

function findSection(draft, sectionId) {
  return draft.sections.find((s) => s.section_id === sectionId);
}

// ─────────────────────────────────────────────────────────────────────────
// GENERALIZATION TEST (seo/education-page-2-generalization): a second,
// independently-shaped synthetic snapshot exercising the REAL registered
// telogen-effluvium template/route through the exact same generic
// buildPageDraft()/validatePageDraft()/checkDraftFidelity() pipeline
// hair-cycle uses -- proving the architecture generalizes as a matter of
// automated regression, not just a one-off live run. Deliberately a
// DIFFERENT bucket shape than hair-cycle's fixture: two FACTORS points
// (exercising resolveEditorialUnit()'s index generalization), a
// definitional statement using the "X is a Y that Z" shape (exercising
// classifyCoreFactualPoints()'s DEFINITION generalization), and no
// MECHANISM point at all (proving an empty bucket doesn't break anything).
// ─────────────────────────────────────────────────────────────────────────
function fixtureTelogenEffluviumSnapshot(overrides = {}) {
  // Shaped to match the REAL, live template's actual bucket/index wiring
  // after the non-core-conflict-narrowing re-synthesis (see publication-
  // page-intent.mjs and page-builder-template-registry.mjs's telogen-
  // effluvium entries) -- OTHER now legitimately holds TWO distinct
  // points (a re-synthesis artifact, not a hand-picked test convenience),
  // and FACTORS is legitimately empty (its two prior points either moved
  // to OTHER after re-synthesis, or were excluded as disputed evidence).
  // Order matters here: classifyCoreFactualPoints() preserves relative
  // order within a bucket, so the two OTHER-classified statements below
  // must appear in this exact sequence to land at OTHER index 0 and 1
  // respectively, matching the template's own `{ bucket: 'OTHER', index }`
  // units.
  return {
    topic_slug: 'telogen-effluvium',
    page_concept: 'Telogen Effluvium: A Practitioner Education Overview',
    public_intent: 'Explain telogen effluvium clearly and accurately for beauty/scalp-care professionals and informed readers.',
    risk_tier: 'MODERATE',
    selected_claim_ids: ['c-def', 'c-timing', 'c-other-0', 'c-prac', 'c-other-1', 'c-lim1', 'c-lim2'],
    core_factual_points: [
      { statement: 'Telogen effluvium is a temporary, diffuse shedding pattern that follows a precipitating trigger.', supporting_claim_ids: ['c-def'] },
      { statement: 'Prevalence estimates rose from about 3% to 5% in pooled analysis after a widely-studied illness event.', supporting_claim_ids: ['c-timing'] },
      { statement: 'Illness episodes on a large scale illustrate how a systemic trigger can be followed by a rise in reported cases, though the exact biological mechanism connecting the two remains unclear.', supporting_claim_ids: ['c-other-0'] },
      { statement: 'Distinguishing temporary shedding from progressive hair loss is relevant for practitioners assessing a scalp.', supporting_claim_ids: ['c-prac'] },
      { statement: 'An unusually large, synchronized group of follicles moves from an active growth stage into a resting stage, in association with general trigger categories such as illness, hormonal change, and stress.', supporting_claim_ids: ['c-other-1'] },
    ],
    limitations: [
      { statement: 'Some nutritional associations show high heterogeneity across studies and do not always reach significance.', supporting_claim_ids: ['c-lim1'] },
      { statement: 'Large epidemiological reviews have not reliably separated acute from chronic presentations.', supporting_claim_ids: ['c-lim2'] },
    ],
    citation_map: {
      's1': { title: 'Source One', authors: ['A. Author'], year: 2023, doi: '10.1/one', url: 'https://doi.org/10.1/one' },
      's2': { title: 'Source Two', authors: ['B. Author'], year: 2024, doi: '10.1/two', url: 'https://doi.org/10.1/two' },
    },
    source_ids: ['s1', 's2'],
    scope_language: {
      page_scope: { include: ['normal shedding patterns'], exclude: ['diagnosis', 'oral minoxidil dosing/prescribing'] },
      scope_note: 'This page is limited to describing telogen effluvium as a shedding pattern for practitioner education purposes.',
    },
    ...overrides,
  };
}

function buildValidTelogenEffluviumDraft(snapshotOverrides = {}) {
  const snapshot = fixtureTelogenEffluviumSnapshot(snapshotOverrides);
  let draft = buildPageDraft(snapshot, { generationSourceHash: 'feedface', fingerprintAlgorithm: 'sha256-canonical-json-v2' });
  draft = finalizeSeo(draft);
  return { snapshot, draft };
}

function testTelogenEffluviumGeneralizesCleanly() {
  const { snapshot, draft } = buildValidTelogenEffluviumDraft();
  const validation = validatePageDraft(draft, snapshot, { integrityResult: { valid: true, expected_hash: 'x', stored_hash: 'x', violations: [] } });
  check('GENERALIZATION_TELOGEN_EFFLUVIUM', 'draft validates cleanly', validation.valid, JSON.stringify(validation.violations));
  check('GENERALIZATION_TELOGEN_EFFLUVIUM', 'sections use this topic\'s own headings, not hair-cycle\'s', draft.sections.map((s) => s.section_id).join(',') === 'why-it-matters,distinguishing-te,limitations', draft.sections.map((s) => s.section_id).join(','));
  check('GENERALIZATION_TELOGEN_EFFLUVIUM', 'why-it-matters heading is topic-specific', findSection(draft, 'why-it-matters').heading === 'How the shift happens');
  check('GENERALIZATION_TELOGEN_EFFLUVIUM', 'distinguishing-te heading is topic-specific', findSection(draft, 'distinguishing-te').heading === 'Why the distinction matters');

  // Both OTHER-bucket points (index 0 and 1) are used, in two DIFFERENT
  // sections, each exactly once -- proving resolveEditorialUnit()'s index
  // support generalizes to a bucket that only became multi-point after a
  // re-synthesis, not just to a bucket authored that way from the start
  // (FACTORS, the original generalization case, is empty in this fixture
  // -- confirming an empty bucket still breaks nothing, same as MECHANISM).
  const whyItMatters = findSection(draft, 'why-it-matters');
  const distinguishing = findSection(draft, 'distinguishing-te');
  const otherInWhyItMatters = whyItMatters.paragraphs.find((p) => !p.is_framing && !/\d/.test(p.text));
  const otherInDistinguishing = distinguishing.paragraphs.filter((p) => !p.is_framing).find((p) => p.supporting_claim_ids.includes('c-other-0'));
  check('GENERALIZATION_TELOGEN_EFFLUVIUM', 'OTHER index 1 point (mechanism+triggers) renders in why-it-matters, inheriting its real supporting_claim_ids', !!otherInWhyItMatters && otherInWhyItMatters.supporting_claim_ids.includes('c-other-1'), JSON.stringify(otherInWhyItMatters));
  check('GENERALIZATION_TELOGEN_EFFLUVIUM', 'OTHER index 0 point (illness example) renders in distinguishing-te, inheriting its real supporting_claim_ids', !!otherInDistinguishing, JSON.stringify(otherInDistinguishing));
  check('GENERALIZATION_TELOGEN_EFFLUVIUM', 'the two OTHER-bucket points are distinct, not the same one rendered twice', otherInWhyItMatters && otherInDistinguishing && otherInWhyItMatters.text !== otherInDistinguishing.text);
  check('GENERALIZATION_TELOGEN_EFFLUVIUM', 'the empty FACTORS bucket did not break anything (no triggers-only section forced)', !draft.sections.some((s) => s.section_id === 'triggers'));
  check('GENERALIZATION_TELOGEN_EFFLUVIUM', 'the empty MECHANISM bucket did not break anything (no mechanism-only section forced)', !draft.sections.some((s) => s.section_id === 'mechanism'));

  const verbatimNumeric = whyItMatters.paragraphs.find((p) => !p.is_framing && /\d/.test(p.text));
  check('GENERALIZATION_TELOGEN_EFFLUVIUM', 'the digit-bearing TIMING statement is rendered VERBATIM (byte-identical), never paraphrased', !!verbatimNumeric && verbatimNumeric.text === snapshot.core_factual_points[1].statement, verbatimNumeric && verbatimNumeric.text);

  const fidelity = checkDraftFidelity(draft, snapshot);
  const statusByUnitId = new Map(collectRenderedFactualUnits(draft).map((u) => [u.unit_id, u.editorial_status]));
  const verbatimResults = fidelity.paragraph_results.filter((r) => statusByUnitId.get(r.unit_id) === 'VERBATIM');
  const paraphraseResults = fidelity.paragraph_results.filter((r) => statusByUnitId.get(r.unit_id) === 'PARAPHRASE');
  check('GENERALIZATION_TELOGEN_EFFLUVIUM', 'every VERBATIM unit passes fidelity', verbatimResults.length > 0 && verbatimResults.every((r) => r.result === 'PASS'), JSON.stringify(verbatimResults));
  check('GENERALIZATION_TELOGEN_EFFLUVIUM', 'every PARAPHRASE unit is honestly flagged, never a false PASS', paraphraseResults.length > 0 && paraphraseResults.every((r) => r.result === 'REWRITE_REQUIRED'), JSON.stringify(paraphraseResults));

  check('GENERALIZATION_TELOGEN_EFFLUVIUM', 'route resolves to this topic\'s own registered route', draft.route === '/education/hair-loss/telogen-effluvium', draft.route);
  check('GENERALIZATION_TELOGEN_EFFLUVIUM', 'no duplicate factual text', findDuplicateFactualText(draft).length === 0, JSON.stringify(findDuplicateFactualText(draft)));
}

// AIMT Education Voice v0 (Owner Correction Pass): 'stages' now interleaves
// non-factual framing bridges around its one factual (VERBATIM TIMING)
// paragraph, so a fixed paragraph index is no longer stable. Find the
// actual factual unit by property instead of assuming position.
function findFactualParagraph(section) {
  return section.paragraphs.find((p) => !p.is_framing);
}

const VALID_INTEGRITY = { valid: true, expected_hash: 'deadbeef', stored_hash: 'deadbeef', violations: [] };

function readSrc(relPath) {
  return readFileSync(fileURLToPath(new URL(`../${relPath}`, import.meta.url)), 'utf8');
}
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

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
  let threw = false;
  let code = null;
  try {
    await assertClearedRowOrThrow(badRecord);
  } catch (e) {
    threw = true;
    code = e.code;
  }
  check('FAILED_INTEGRITY_REFUSED', 'assertClearedRowOrThrow throws on a hash-inconsistent record', threw && code === 'integrity_failed', code);

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
  findFactualParagraph(findSection(tampered, 'stages')).supporting_claim_ids.push('c-never-cleared-or-excluded');
  const validation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('UNSUPPORTED_CLAIM_ID_FAILS', 'a claim ID outside selected_claim_ids fails validation', !validation.valid && validation.violations.some((v) => v.startsWith('UNSUPPORTED_CLAIM_ID')), JSON.stringify(validation));
}

function testExcludedClaimNeverReachableAtAll() {
  check('EXCLUDED_CLAIM_STRUCTURALLY_UNREACHABLE', 'CLEARED_SNAPSHOT_FIELDS does not include excluded_claim_ids', !CLEARED_SNAPSHOT_FIELDS.includes('excluded_claim_ids'));
}

// ─────────────────────────────────────────────────────────────────────────
// 5. Factual paragraph with no support → fail
// ─────────────────────────────────────────────────────────────────────────
function testUnsupportedFactualParagraphFails() {
  const { snapshot, draft } = buildValidDraft();
  const tampered = JSON.parse(JSON.stringify(draft));
  findFactualParagraph(findSection(tampered, 'stages')).supporting_claim_ids = [];
  const validation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('UNSUPPORTED_FACTUAL_PARAGRAPH_FAILS', 'a factual paragraph with zero supporting_claim_ids fails validation', !validation.valid && validation.violations.some((v) => v.startsWith('FACTUAL_PARAGRAPH_MISSING_SUPPORT')), JSON.stringify(validation));
}

function testFramingParagraphExemptFromSupportRequirement() {
  const { snapshot, draft } = buildValidDraft();
  const validation = validatePageDraft(draft, snapshot, { integrityResult: VALID_INTEGRITY });
  const framingPara = findSection(draft, 'why-it-matters').paragraphs[0];
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
  const limSection = findSection(tampered, 'limitations');
  limSection.paragraphs = limSection.paragraphs.slice(0, 1);
  const validation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('MISSING_LIMITATION_FAILS', 'dropping a cleared limitation fails validation', !validation.valid && validation.violations.some((v) => v.startsWith('MISSING_REQUIRED_LIMITATION')), JSON.stringify(validation));
}

// ─────────────────────────────────────────────────────────────────────────
// 8. Scope note vs. SEO meta description — now separate concepts
// ─────────────────────────────────────────────────────────────────────────
function testScopeNoteMissingOrChangedFails() {
  const { snapshot, draft } = buildValidDraft();
  const tamperedChanged = { ...draft, scope_note: 'A rewritten scope note that was never actually cleared.' };
  const validationChanged = validatePageDraft(tamperedChanged, snapshot, { integrityResult: VALID_INTEGRITY });
  check('SCOPE_NOTE_VIOLATION_FAILS', 'a changed scope_note fails validation', !validationChanged.valid && validationChanged.violations.includes('SCOPE_NOTE_NOT_PRESERVED'), JSON.stringify(validationChanged));

  const tamperedMissing = { ...draft, scope_note: undefined };
  const validationMissing = validatePageDraft(tamperedMissing, snapshot, { integrityResult: VALID_INTEGRITY });
  check('SCOPE_NOTE_VIOLATION_FAILS', 'a missing scope_note fails validation', !validationMissing.valid && validationMissing.violations.includes('SCOPE_NOTE_NOT_PRESERVED'), JSON.stringify(validationMissing));
}

function testMetaDescriptionNotRequiredToEqualScopeNote() {
  const { snapshot, draft } = buildValidDraft();
  check('META_DESCRIPTION_INDEPENDENT_OF_SCOPE_NOTE', 'meta_description is not byte-identical to scope_note (they are different concepts)', draft.seo.meta_description !== draft.scope_note);
  const validation = validatePageDraft(draft, snapshot, { integrityResult: VALID_INTEGRITY });
  check('META_DESCRIPTION_INDEPENDENT_OF_SCOPE_NOTE', 'the draft still validates even though the two differ', validation.valid, JSON.stringify(validation));
  check('META_DESCRIPTION_INDEPENDENT_OF_SCOPE_NOTE', 'report explicitly confirms scope_note_preserved', validation.report.scope_note_preserved === true);
}

function testMetaDescriptionSafetyConstraints() {
  const { snapshot, draft } = buildValidDraft();

  const tooLong = { ...draft, seo: { ...draft.seo, meta_description: 'x'.repeat(200) } };
  const v1 = validatePageDraft(tooLong, snapshot, { integrityResult: VALID_INTEGRITY });
  check('META_DESCRIPTION_SAFETY', 'a meta_description over 160 chars fails validation', !v1.valid && v1.violations.some((x) => x.startsWith('META_DESCRIPTION_TOO_LONG')), JSON.stringify(v1.violations));

  const withDigit = { ...draft, seo: { ...draft.seo, meta_description: 'Covers 4 stages of the cycle.' } };
  const v2 = validatePageDraft(withDigit, snapshot, { integrityResult: VALID_INTEGRITY });
  check('META_DESCRIPTION_SAFETY', 'a meta_description containing a digit fails validation (no unsupported numeric claims in framing copy)', !v2.valid && v2.violations.includes('META_DESCRIPTION_UNSUPPORTED_NUMERIC'), JSON.stringify(v2.violations));

  const withTreatment = { ...draft, seo: { ...draft.seo, meta_description: 'Learn about minoxidil and the hair cycle.' } };
  const v3 = validatePageDraft(withTreatment, snapshot, { integrityResult: VALID_INTEGRITY });
  check('META_DESCRIPTION_SAFETY', 'a meta_description naming a treatment fails validation', !v3.valid && v3.violations.some((x) => x.startsWith('META_DESCRIPTION_TREATMENT_DRIFT')), JSON.stringify(v3.violations));

  const withTransactional = { ...draft, seo: { ...draft.seo, meta_description: 'Enroll now to learn the hair cycle.' } };
  const v4 = validatePageDraft(withTransactional, snapshot, { integrityResult: VALID_INTEGRITY });
  check('META_DESCRIPTION_SAFETY', 'a meta_description with sales language fails validation', !v4.valid && v4.violations.some((x) => x.startsWith('META_DESCRIPTION_TRANSACTIONAL')), JSON.stringify(v4.violations));

  const template = getPageBuilderTemplate('hair-cycle');
  check('META_DESCRIPTION_SAFETY', "the REAL registered hair-cycle template's meta_description is <=160 chars", template.meta_description.length <= 160, `${template.meta_description.length} chars`);
}

// ─────────────────────────────────────────────────────────────────────────
// 9. Treatment/diagnosis drift → fail
// ─────────────────────────────────────────────────────────────────────────
function testTreatmentDiagnosisDriftFails() {
  const { snapshot, draft } = buildValidDraft();
  const tampered = JSON.parse(JSON.stringify(draft));
  findSection(tampered, 'stages').paragraphs.push({ text: 'Minoxidil is an effective treatment for hair loss.', supporting_claim_ids: ['c-def'] });
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
  findSection(tampered, 'stages').paragraphs.push({ text: 'Enroll now and buy now to certify today.', supporting_claim_ids: ['c-def'] });
  const validation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('TRANSACTIONAL_CANNIBALIZATION_FAILS', 'sales-intent body copy fails validation', !validation.valid && validation.violations.some((v) => v.startsWith('TRANSACTIONAL_CANNIBALIZATION')), JSON.stringify(validation));
}

// ─────────────────────────────────────────────────────────────────────────
// 11. Route / canonical / page-identity — EXACT enforcement (corrected)
// ─────────────────────────────────────────────────────────────────────────
function testFutureRouteCorrect() {
  const { snapshot, draft } = buildValidDraft();
  const registered = getPageBuilderRoute('hair-cycle');
  check('FUTURE_ROUTE_CORRECT', 'draft.route matches the registered future route', draft.route === '/education/hair-loss/hair-growth-cycle');
  check('FUTURE_ROUTE_CORRECT', 'draft.route matches the route registry exactly (not duplicated/hardcoded separately)', draft.route === registered.route);
  check('FUTURE_ROUTE_CORRECT', 'canonical_url is built from the registered route', draft.seo.canonical_url === 'https://aimtrichology.com/education/hair-loss/hair-growth-cycle');
  const validation = validatePageDraft(draft, snapshot, { integrityResult: VALID_INTEGRITY });
  check('FUTURE_ROUTE_CORRECT', 'validator report confirms route/canonical/h1/topic_slug all ok', Object.values(validation.report.route_check).every(Boolean), JSON.stringify(validation.report.route_check));
}

function testWrongRouteFailsExactCheck() {
  // The originating request's exact scenario: a route that STARTS WITH
  // "/education/" must still fail if it isn't the registered route.
  const { snapshot, draft } = buildValidDraft();
  const tampered = { ...draft, route: '/education/wrong-page' };
  const validation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('WRONG_ROUTE_FAILS_EXACT_CHECK', '/education/wrong-page fails exact route validation despite starting with /education/', !validation.valid && validation.violations.some((v) => v.startsWith('ROUTE_MISMATCH')), JSON.stringify(validation.violations));
  check('WRONG_ROUTE_FAILS_EXACT_CHECK', 'report marks route_ok=false', validation.report.route_check.route_ok === false);
}

function testWrongCanonicalFails() {
  const { snapshot, draft } = buildValidDraft();
  const tampered = { ...draft, seo: { ...draft.seo, canonical_url: 'https://aimtrichology.com/education/some-other-page' } };
  const validation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('WRONG_CANONICAL_FAILS', 'a canonical_url that does not match the registered route fails validation', !validation.valid && validation.violations.some((v) => v.startsWith('CANONICAL_URL_MISMATCH')), JSON.stringify(validation.violations));
  check('WRONG_CANONICAL_FAILS', 'report marks canonical_ok=false', validation.report.route_check.canonical_ok === false);
}

function testWrongH1PageConceptFails() {
  const { snapshot, draft } = buildValidDraft();
  const tampered = { ...draft, seo: { ...draft.seo, h1: 'A Completely Different Page Title' } };
  const validation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('WRONG_H1_FAILS', 'an h1 that does not match the cleared page_concept fails validation', !validation.valid && validation.violations.includes('H1_PAGE_CONCEPT_MISMATCH'), JSON.stringify(validation.violations));
  check('WRONG_H1_FAILS', 'report marks h1_ok=false', validation.report.route_check.h1_ok === false);
}

function testRouteMismatchStillFailsForNonEducationRoute() {
  const { snapshot, draft } = buildValidDraft();
  const tampered = { ...draft, route: '/head-spa-certification' };
  const validation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('ROUTE_MISMATCH_FAILS', 'a route outside /education/ entirely also fails (via the same exact-route check)', !validation.valid && validation.violations.some((v) => v.startsWith('ROUTE_MISMATCH')), JSON.stringify(validation.violations));
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

function testNoCodePathRequiresAimtApproved() {
  for (const f of ['functions/_lib/page-builder/page-builder-draft.mjs', 'functions/_lib/page-builder/page-builder-loader.mjs']) {
    const code = stripComments(readSrc(f));
    check('NO_AIMT_APPROVED_DEPENDENCY', `${f} never references AIMT_APPROVED at all`, !/AIMT_APPROVED/.test(code));
  }
  const validatorCode = stripComments(readSrc('functions/_lib/page-builder/page-builder-validator.mjs'));
  check('NO_AIMT_APPROVED_DEPENDENCY', 'validator never assigns/requires AIMT_APPROVED as a value', !/(requires?|needs?)\s*[:=]\s*['"]?AIMT_APPROVED/i.test(validatorCode));
  check('NO_AIMT_APPROVED_DEPENDENCY', "validator's only reference is the absence-check itself", /includes\('AIMT_APPROVED'\)/.test(validatorCode));
}

// ─────────────────────────────────────────────────────────────────────────
// 13. Cost metrics recorded — including the fixed candidate-count sourcing
// ─────────────────────────────────────────────────────────────────────────
function testCostMetricsRecorded() {
  const metrics = buildCostMetrics({ modelCalls: [], fidelityCheckCalls: 5, retries: 0, candidateClaimCount: 128, selectedClaimCount: 40, renderedSupportClaimCount: 27 });
  check('COST_METRICS_RECORDED', 'model_calls is 0 for a fully deterministic v1 run', metrics.model_calls === 0);
  check('COST_METRICS_RECORDED', 'fidelity_check_calls reflects the deterministic paragraph checks actually run', metrics.fidelity_check_calls === 5);
  check('COST_METRICS_RECORDED', 'total_input_tokens/total_output_tokens are 0, not null, when there were zero model calls', metrics.total_input_tokens === 0 && metrics.total_output_tokens === 0);
  check('COST_METRICS_RECORDED', 'estimated_cost_usd is null (never a guessed number)', metrics.estimated_cost_usd === null);
  check('COST_METRICS_RECORDED', 'cost_reduction_note is computed from real counts, not invented', metrics.cost_reduction_note.includes('40') && metrics.cost_reduction_note.includes('128'));
  check('COST_METRICS_RECORDED', 'rendered_support_claim_count is reported distinctly from selected_claim_count', metrics.rendered_support_claim_count === 27 && metrics.selected_claim_count === 40);

  const withUnknownTokens = buildCostMetrics({ modelCalls: [{ label: 'x', model: 'm', input_tokens: null, output_tokens: null }] });
  check('COST_METRICS_RECORDED', 'a model call with unknown token counts does not fabricate a total', withUnknownTokens.total_input_tokens === null && withUnknownTokens.total_output_tokens === null);
}

function testCandidateClaimCountComesFromPersistedRecordNotLiteral128() {
  const withoutCandidateCount = buildCostMetrics({ modelCalls: [], selectedClaimCount: 40, candidateClaimCount: null });
  check('CANDIDATE_COUNT_NOT_HARDCODED', 'a missing persisted candidate_claim_count reports null, never a guessed 128', withoutCandidateCount.candidate_claim_count === null);
  check('CANDIDATE_COUNT_NOT_HARDCODED', 'cost_reduction_note explains the count is unavailable rather than fabricating a percentage', withoutCandidateCount.cost_reduction_note.includes('not available'));

  const withDifferentCandidateCount = buildCostMetrics({ modelCalls: [], selectedClaimCount: 10, candidateClaimCount: 55 });
  check('CANDIDATE_COUNT_NOT_HARDCODED', 'a different real candidate_claim_count (55, not 128) is reported and used as-is', withDifferentCandidateCount.candidate_claim_count === 55 && withDifferentCandidateCount.cost_reduction_note.includes('55'));

  // Structural: the orchestrating script must read this from the real
  // record, never a bare hardcoded 128 literal passed to buildCostMetrics.
  const scriptCode = stripComments(readSrc('scripts/page-builder-shadow.mjs'));
  check('CANDIDATE_COUNT_NOT_HARDCODED', 'page-builder-shadow.mjs never passes a literal 128 to buildCostMetrics', !/candidateClaimCount:\s*128\b/.test(scriptCode));
  check('CANDIDATE_COUNT_NOT_HARDCODED', 'page-builder-shadow.mjs reads candidate_claim_count from the persisted record', /record\.publication_clearance\.candidate_claim_count/.test(scriptCode));
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
    'functions/_lib/page-builder/page-builder-content-units.mjs',
    'functions/_lib/page-builder/page-builder-template-registry.mjs',
    'functions/_lib/page-builder/page-builder-route-registry.mjs',
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
  check('NO_ANTHROPIC_CALL_IN_TESTS', 'checkParagraphFidelityWithModel is never invoked (no call-shaped occurrence) in this test file', !/checkParagraphFidelityWithModel\s*\(/.test(thisFileSrc));
  check('NO_ANTHROPIC_CALL_IN_TESTS', 'this test file never sets globalThis.fetch (no network mocking needed -- nothing here calls out)', !/globalThis\.fetch\s*=/.test(thisFileSrc));
}

// ─────────────────────────────────────────────────────────────────────────
// Rendered-content validation coverage: answer_summary + key_takeaways
// (this revision's core fix -- these used to be a blind spot)
// ─────────────────────────────────────────────────────────────────────────
function testTamperedAnswerSummarySupportFails() {
  const { snapshot, draft } = buildValidDraft();
  const tampered = JSON.parse(JSON.stringify(draft));
  tampered.answer_summary.supporting_claim_ids = [];
  const validation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('ANSWER_SUMMARY_VALIDATION', 'an answer_summary with zero supporting_claim_ids fails validation', !validation.valid && validation.violations.some((v) => v.startsWith('FACTUAL_PARAGRAPH_MISSING_SUPPORT') && v.includes('answer_summary')), JSON.stringify(validation.violations));
}

function testTamperedAnswerSummaryInventedClaimIdFails() {
  const { snapshot, draft } = buildValidDraft();
  const tampered = JSON.parse(JSON.stringify(draft));
  tampered.answer_summary.supporting_claim_ids.push('c-invented-never-cleared');
  const validation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('ANSWER_SUMMARY_VALIDATION', 'an answer_summary citing an invented claim ID fails validation', !validation.valid && validation.violations.some((v) => v.startsWith('UNSUPPORTED_CLAIM_ID')), JSON.stringify(validation.violations));
}

function testTamperedAnswerSummaryFidelityFails() {
  const { snapshot, draft } = buildValidDraft();
  const tampered = JSON.parse(JSON.stringify(draft));
  tampered.answer_summary.text = 'Hair follicles go through several stages of growth, roughly speaking.';
  const fidelity = checkDraftFidelity(tampered, snapshot);
  const answerSummaryResult = fidelity.paragraph_results.find((r) => r.unit_id === 'answer_summary');
  check('ANSWER_SUMMARY_VALIDATION', 'a paraphrased answer_summary fails the deterministic fidelity check', answerSummaryResult.result === 'REWRITE_REQUIRED', JSON.stringify(answerSummaryResult));
}

function testTamperedAnswerSummaryNumericChangeFails() {
  const { snapshot, draft } = buildValidDraft();
  const tampered = JSON.parse(JSON.stringify(draft));
  // Move the TIMING statement (which has a real number in it) into
  // answer_summary, then alter its number -- a changed numeric fact that
  // is no longer verbatim.
  tampered.answer_summary = { text: 'In humans, scalp anagen typically lasts around 5 years, catagen around 3 weeks, and telogen around 3 months, and roughly 9% of scalp follicles are in telogen at any given time.', supporting_claim_ids: ['c-timing'] };
  const validation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('ANSWER_SUMMARY_VALIDATION', 'a numeric fact altered in answer_summary fails the numeric-claim check', !validation.valid && validation.violations.some((v) => v.startsWith('UNSUPPORTED_NUMERIC_CLAIM') && v.includes('answer_summary')), JSON.stringify(validation.violations));
  const fidelity = checkDraftFidelity(tampered, snapshot);
  const r = fidelity.paragraph_results.find((x) => x.unit_id === 'answer_summary');
  check('ANSWER_SUMMARY_VALIDATION', 'the same altered numeric statement also fails fidelity (not verbatim)', r.result === 'REWRITE_REQUIRED');
}

function testTamperedKeyTakeawaySupportFails() {
  const { snapshot, draft } = buildValidDraft();
  const tampered = JSON.parse(JSON.stringify(draft));
  tampered.key_takeaways[0].supporting_claim_ids = [];
  const validation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('KEY_TAKEAWAY_VALIDATION', 'a key_takeaway with zero supporting_claim_ids fails validation', !validation.valid && validation.violations.some((v) => v.startsWith('FACTUAL_PARAGRAPH_MISSING_SUPPORT') && v.includes('key_takeaway')), JSON.stringify(validation.violations));
}

function testTamperedKeyTakeawayInventedClaimIdFails() {
  const { snapshot, draft } = buildValidDraft();
  const tampered = JSON.parse(JSON.stringify(draft));
  tampered.key_takeaways[0].supporting_claim_ids.push('c-invented-never-cleared');
  const validation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('KEY_TAKEAWAY_VALIDATION', 'a key_takeaway citing an invented claim ID fails validation', !validation.valid && validation.violations.some((v) => v.startsWith('UNSUPPORTED_CLAIM_ID')), JSON.stringify(validation.violations));
}

function testTamperedKeyTakeawayFidelityFails() {
  const { snapshot, draft } = buildValidDraft();
  const tampered = JSON.parse(JSON.stringify(draft));
  tampered.key_takeaways[0].text = 'This is a rewritten takeaway that departs from the cleared statement.';
  const fidelity = checkDraftFidelity(tampered, snapshot);
  const r = fidelity.paragraph_results.find((x) => x.unit_id === 'key_takeaway:0');
  check('KEY_TAKEAWAY_VALIDATION', 'a paraphrased key_takeaway fails the deterministic fidelity check', r.result === 'REWRITE_REQUIRED', JSON.stringify(r));
}

function testFidelityAndValidationCoverAnswerSummaryAndTakeaways() {
  const { snapshot, draft } = buildValidDraft();
  const units = collectRenderedFactualUnits(draft);
  check('RENDERED_UNITS_COVERAGE', 'collectRenderedFactualUnits includes answer_summary', units.some((u) => u.unit_id === 'answer_summary'));
  check('RENDERED_UNITS_COVERAGE', 'collectRenderedFactualUnits includes every key_takeaway', draft.key_takeaways.every((_, i) => units.some((u) => u.unit_id === `key_takeaway:${i}`)));
  const fidelity = checkDraftFidelity(draft, snapshot);
  check('RENDERED_UNITS_COVERAGE', 'checkDraftFidelity reports a result for answer_summary', fidelity.paragraph_results.some((r) => r.unit_id === 'answer_summary'));
  check('RENDERED_UNITS_COVERAGE', 'checkDraftFidelity reports a result for every key_takeaway', draft.key_takeaways.every((_, i) => fidelity.paragraph_results.some((r) => r.unit_id === `key_takeaway:${i}`)));
}

// ─────────────────────────────────────────────────────────────────────────
// Duplicate-content fix
// ─────────────────────────────────────────────────────────────────────────
function testNoDuplicateFactualTextInRealDraft() {
  const { draft } = buildValidDraft();
  const duplicates = findDuplicateFactualText(draft);
  check('NO_DUPLICATE_FACTUAL_TEXT', 'the real (untampered) draft has zero duplicate factual statements across answer_summary + body sections', duplicates.length === 0, JSON.stringify(duplicates));
  const answerSummaryText = draft.answer_summary.text;
  const bodyTexts = draft.sections.filter((s) => s.section_id !== 'why-it-matters').flatMap((s) => s.paragraphs.map((p) => p.text));
  check('NO_DUPLICATE_FACTUAL_TEXT', 'answer_summary statement is not repeated verbatim in any body section', !bodyTexts.includes(answerSummaryText));
}

function testDuplicateAnswerSummaryBodyTextFails() {
  const { snapshot, draft } = buildValidDraft();
  const tampered = JSON.parse(JSON.stringify(draft));
  // Deliberately reintroduce the answer_summary statement into a body section.
  findSection(tampered, 'stages').paragraphs.push({ text: tampered.answer_summary.text, supporting_claim_ids: tampered.answer_summary.supporting_claim_ids });
  const validation = validatePageDraft(tampered, snapshot, { integrityResult: VALID_INTEGRITY });
  check('DUPLICATE_FACTUAL_TEXT_FAILS', 'repeating the answer_summary statement verbatim in a body section fails validation', !validation.valid && validation.violations.some((v) => v.startsWith('DUPLICATE_FACTUAL_TEXT')), JSON.stringify(validation.violations));
  check('DUPLICATE_FACTUAL_TEXT_FAILS', 'report lists the duplicate text and both unit_ids', validation.report.duplicate_factual_text.length === 1 && validation.report.duplicate_factual_text[0].unit_ids.length === 2, JSON.stringify(validation.report.duplicate_factual_text));
}

function testKeyTakeawaysExemptFromDuplicateRule() {
  const { snapshot, draft } = buildValidDraft();
  // key_takeaways are ALLOWED to recap answer_summary/body facts --
  // confirm the real draft's takeaways legitimately overlap with
  // already-used statements, and that this does NOT fail validation.
  const bodyAndSummaryTexts = new Set([draft.answer_summary.text, ...draft.sections.flatMap((s) => s.paragraphs.map((p) => p.text))]);
  const overlap = draft.key_takeaways.some((t) => bodyAndSummaryTexts.has(t.text));
  check('KEY_TAKEAWAYS_MAY_RECAP', 'at least one key_takeaway legitimately recaps an already-used statement', overlap);
  const validation = validatePageDraft(draft, snapshot, { integrityResult: VALID_INTEGRITY });
  check('KEY_TAKEAWAYS_MAY_RECAP', 'that recap does not fail validation (key_takeaways are exempt from the duplicate-text rule)', validation.valid, JSON.stringify(validation.violations));
}

// ─────────────────────────────────────────────────────────────────────────
// Template-registry design: generic builder has no hardcoded hair-cycle
// presentation strings
// ─────────────────────────────────────────────────────────────────────────
function testGenericBuilderHasNoHardcodedPresentationStrings() {
  const draftCode = readSrc('functions/_lib/page-builder/page-builder-draft.mjs');
  const hardcodedHeadings = [
    'What is the hair growth cycle?',
    'Why the hair growth cycle matters',
    'The stages of the hair growth cycle',
    'Hair cycle vs. normal shedding',
  ];
  for (const heading of hardcodedHeadings) {
    check('TEMPLATE_EXTRACTION', `page-builder-draft.mjs no longer hardcodes the heading "${heading}"`, !draftCode.includes(heading));
  }
  check('TEMPLATE_EXTRACTION', 'page-builder-draft.mjs no longer hardcodes the anagen/catagen/telogen/exogen provenance note', !draftCode.includes('anagen/catagen/telogen/exogen are described jointly'));
  check('TEMPLATE_EXTRACTION', 'page-builder-draft.mjs imports the template registry (presentation now comes from there)', draftCode.includes("from './page-builder-template-registry.mjs'"));

  const templateCode = readSrc('functions/_lib/page-builder/page-builder-template-registry.mjs');
  check('TEMPLATE_EXTRACTION', 'the hair-cycle headings now live in the template registry instead', hardcodedHeadings.every((h) => templateCode.includes(h)));
}

// GENERALIZATION TEST (seo/education-page-2-generalization): this pilot
// is no longer literally "one topic" -- telogen-effluvium is now also
// registered, cleared via the governed Publication Editor pipeline. What
// stays true, and is what this fixture actually verifies, is that the
// registry remains a real, hand-authored allow-list -- an unregistered
// topic still throws rather than silently falling back to some invented
// default template.
function testTemplateRegistryIsAnExplicitAllowList() {
  let threw = false;
  try {
    getPageBuilderTemplate('some-topic-with-no-clearance-yet');
  } catch (e) {
    threw = true;
  }
  check('TEMPLATE_ONE_TOPIC_PILOT', 'getPageBuilderTemplate throws for an unregistered topic (no hypothetical template invented)', threw);
  check('TEMPLATE_ONE_TOPIC_PILOT', 'hair-cycle template resolves', !!getPageBuilderTemplate('hair-cycle'));
  check('TEMPLATE_ONE_TOPIC_PILOT', 'telogen-effluvium template resolves', !!getPageBuilderTemplate('telogen-effluvium'));
}

// ─────────────────────────────────────────────────────────────────────────
// Extra: deterministic fidelity check behaves as designed
// ─────────────────────────────────────────────────────────────────────────
// AIMT Education Voice v0 (Owner Correction Pass): the real, registered
// hair-cycle template is no longer verbatim-only -- it now also carries
// hand-authored PARAPHRASE units (see page-builder-template-registry.mjs).
// The correct, honest contract is no longer "the whole draft passes
// fidelity" -- it is "every VERBATIM unit passes, and every PARAPHRASE
// unit is truthfully flagged REWRITE_REQUIRED rather than a false PASS."
// checkDraftFidelity() itself is UNCHANGED; this test proves it is not
// silently fooled by the new paraphrase content.
function testDeterministicFidelityPassesOnVerbatimReuse() {
  const { snapshot, draft } = buildValidDraft();
  const fidelity = checkDraftFidelity(draft, snapshot);
  const statusByUnitId = new Map(collectRenderedFactualUnits(draft).map((u) => [u.unit_id, u.editorial_status]));
  const verbatimResults = fidelity.paragraph_results.filter((r) => statusByUnitId.get(r.unit_id) === 'VERBATIM');
  const paraphraseResults = fidelity.paragraph_results.filter((r) => statusByUnitId.get(r.unit_id) === 'PARAPHRASE');
  check('FIDELITY_VERBATIM_PASS', 'every VERBATIM-tagged rendered unit passes the deterministic fidelity check', verbatimResults.length > 0 && verbatimResults.every((r) => r.result === 'PASS'), JSON.stringify(verbatimResults));
  check('FIDELITY_VERBATIM_PASS', 'every PARAPHRASE-tagged rendered unit is honestly flagged REWRITE_REQUIRED, never a false PASS', paraphraseResults.length > 0 && paraphraseResults.every((r) => r.result === 'REWRITE_REQUIRED'), JSON.stringify(paraphraseResults));
  check('FIDELITY_VERBATIM_PASS', 'the overall draft fidelity result honestly reflects the paraphrase content rather than a false PASS', fidelity.result === 'REWRITE_REQUIRED', JSON.stringify(fidelity));
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
// Rendered support claim count is derived from actual content, not assumed
// ─────────────────────────────────────────────────────────────────────────
function testRenderedSupportClaimCountDerivedHonestly() {
  const { draft } = buildValidDraft();
  const renderedIds = computeRenderedSupportClaimIds(draft);
  const allSnapshotSupportIds = new Set();
  for (const p of fixtureSnapshot().core_factual_points) for (const id of p.supporting_claim_ids) allSnapshotSupportIds.add(id);
  for (const l of fixtureSnapshot().limitations) for (const id of l.supporting_claim_ids) allSnapshotSupportIds.add(id);
  check('RENDERED_SUPPORT_COUNT_HONEST', 'rendered_support_claim_ids is a real, computed subset (every ID actually traces to a rendered unit)', renderedIds.every((id) => allSnapshotSupportIds.has(id)));
  check('RENDERED_SUPPORT_COUNT_HONEST', 'rendered_support_claim_ids excludes an ID that was never attached to any rendered unit', !renderedIds.includes('c-never-rendered-anywhere'));

  // Directly prove the derivation is not "assume all selected_claim_ids
  // were rendered" -- add an extra selected_claim_id to the snapshot that
  // no rendered unit actually cites, and confirm it's correctly excluded.
  const snapshotWithExtraUnrenderedClaim = fixtureSnapshot({ selected_claim_ids: [...fixtureSnapshot().selected_claim_ids, 'c-selected-but-never-rendered'] });
  let draftForExtra = buildPageDraft(snapshotWithExtraUnrenderedClaim, {});
  draftForExtra = finalizeSeo(draftForExtra);
  const renderedForExtra = computeRenderedSupportClaimIds(draftForExtra);
  check('RENDERED_SUPPORT_COUNT_HONEST', 'a claim ID present in selected_claim_ids but never attached to any statement is correctly NOT counted as rendered', !renderedForExtra.includes('c-selected-but-never-rendered') && renderedForExtra.length < snapshotWithExtraUnrenderedClaim.selected_claim_ids.length);
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
  testScopeNoteMissingOrChangedFails,
  testMetaDescriptionNotRequiredToEqualScopeNote,
  testMetaDescriptionSafetyConstraints,
  testTreatmentDiagnosisDriftFails,
  testHighRiskMaterialFails,
  testInformationalIntentPreservedByDefault,
  testTransactionalCannibalizationFails,
  testFutureRouteCorrect,
  testWrongRouteFailsExactCheck,
  testWrongCanonicalFails,
  testWrongH1PageConceptFails,
  testRouteMismatchStillFailsForNonEducationRoute,
  testNoAimtApprovedDependency,
  testNoCodePathRequiresAimtApproved,
  testCostMetricsRecorded,
  testCandidateClaimCountComesFromPersistedRecordNotLiteral128,
  testNoProductionWritePath,
  testNoAnthropicCallInThisTestFile,
  testTamperedAnswerSummarySupportFails,
  testTamperedAnswerSummaryInventedClaimIdFails,
  testTamperedAnswerSummaryFidelityFails,
  testTamperedAnswerSummaryNumericChangeFails,
  testTamperedKeyTakeawaySupportFails,
  testTamperedKeyTakeawayInventedClaimIdFails,
  testTamperedKeyTakeawayFidelityFails,
  testFidelityAndValidationCoverAnswerSummaryAndTakeaways,
  testNoDuplicateFactualTextInRealDraft,
  testDuplicateAnswerSummaryBodyTextFails,
  testKeyTakeawaysExemptFromDuplicateRule,
  testGenericBuilderHasNoHardcodedPresentationStrings,
  testTemplateRegistryIsAnExplicitAllowList,
  testTelogenEffluviumGeneralizesCleanly,
  testDeterministicFidelityPassesOnVerbatimReuse,
  testDeterministicFidelityFlagsParaphrase,
  testFramingParagraphAlwaysPassesFidelity,
  testRenderedSupportClaimCountDerivedHonestly,
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
