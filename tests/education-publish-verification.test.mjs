// AIMT Education Operations v1 — deterministic tests for the production
// publish-lane verification module (functions/_lib/education-ops/
// education-publish-verification.mjs). PURE, no I/O, no model call.
//
// Run: node tests/education-publish-verification.test.mjs

import {
  checkCandidateReadyForPublication, verifyGeneratedPrStillExpectedBeforeMerge,
  checkExistingClearanceRowConsistency, checkCloudflarePagesCheckRunSucceeded,
  verifyLivePagePublication, verifyPostWritePublishedRow,
} from '../functions/_lib/education-ops/education-publish-verification.mjs';
import { RESUME_STAGE } from '../functions/_lib/education-ops/education-candidate-bundle.mjs';
import { FRESHNESS_STATE } from '../functions/_lib/education-ops/education-freshness-monitor.mjs';
import { buildPublicationManifest } from '../functions/_lib/education-ops/education-publication-state.mjs';
import { GENERATION_MARKER_META_NAME } from '../functions/_lib/education-ops/education-page-renderer.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const ROUTE = '/education/hair-loss/alopecia-areata';
const HASH = 'gsh-abc123';

// ─────────────────────────────────────────────────────────────────────────
// checkCandidateReadyForPublication (step 2)
// ─────────────────────────────────────────────────────────────────────────
function baselineEligibilityInput(overrides = {}) {
  return {
    integrityValid: true, integrityViolations: [],
    resumeStage: RESUME_STAGE.READY_FOR_PREPARE, freshnessState: FRESHNESS_STATE.FRESH,
    bundleTopicSlug: 'alopecia-areata', expectedTopicSlug: 'alopecia-areata',
    bundleRoute: ROUTE, expectedRoute: ROUTE,
    routeAlreadyPublished: false, withinWeeklyCap: true,
    ...overrides,
  };
}

function testEligibilityPassesWhenEverythingHolds() {
  const result = checkCandidateReadyForPublication(baselineEligibilityInput());
  check('ELIGIBILITY_PASS', 'ok is true', result.ok === true);
  check('ELIGIBILITY_PASS', 'zero violations', result.violations.length === 0);
}

function testEligibilityCatchesEveryIndividualFailure() {
  check('ELIGIBILITY_FAIL', 'integrity invalid fails', checkCandidateReadyForPublication(baselineEligibilityInput({ integrityValid: false, integrityViolations: ['HASH_MISMATCH'] })).ok === false);
  check('ELIGIBILITY_FAIL', 'Reviewer PASS not persisted fails (resume stage != READY_FOR_PREPARE)', checkCandidateReadyForPublication(baselineEligibilityInput({ resumeStage: RESUME_STAGE.EDITORIAL_REVIEW })).ok === false);
  check('ELIGIBILITY_FAIL', 'stale candidate fails (freshness change blocks publication)', checkCandidateReadyForPublication(baselineEligibilityInput({ freshnessState: FRESHNESS_STATE.POTENTIAL_EVIDENCE_CHANGE })).ok === false);
  check('ELIGIBILITY_FAIL', 'topic slug mismatch fails', checkCandidateReadyForPublication(baselineEligibilityInput({ bundleTopicSlug: 'other' })).ok === false);
  check('ELIGIBILITY_FAIL', 'route already published fails', checkCandidateReadyForPublication(baselineEligibilityInput({ routeAlreadyPublished: true })).ok === false);
  check('ELIGIBILITY_FAIL', 'weekly ceiling reached fails', checkCandidateReadyForPublication(baselineEligibilityInput({ withinWeeklyCap: false })).ok === false);
}

// ─────────────────────────────────────────────────────────────────────────
// verifyGeneratedPrStillExpectedBeforeMerge (step 10)
// ─────────────────────────────────────────────────────────────────────────
function baselineManifestWithPr() {
  const manifest = buildPublicationManifest({
    runId: 'r1', topicSlug: 'alopecia-areata', route: ROUTE, cluster: 'hair-loss-shedding',
    generationSourceHash: HASH, preparedArtifactDigest: 'd'.repeat(64), candidateOriginatingRunId: 'shadow-8',
  });
  manifest.generated = { branch: 'education-ops/publish-alopecia-areata', pr_number: 42, pr_url: 'https://x/42', expected_head_sha: 'a'.repeat(40) };
  return manifest;
}

function testPrRevalidationPassesWhenUnchanged() {
  const manifest = baselineManifestWithPr();
  const prInfo = { number: 42, state: 'OPEN', headRefOid: 'a'.repeat(40), files: [{ path: 'education/hair-loss/alopecia-areata.html' }, { path: 'sitemap.xml' }] };
  const result = verifyGeneratedPrStillExpectedBeforeMerge(prInfo, manifest);
  check('PR_REVALIDATION_PASS', 'ok is true when number/head/diff all match', result.ok === true, JSON.stringify(result));
}

function testPrRevalidationFailsClosedOnDrift() {
  const manifest = baselineManifestWithPr();
  check('PR_REVALIDATION_FAIL', 'moved head SHA blocks merge (test #6)', verifyGeneratedPrStillExpectedBeforeMerge({ number: 42, state: 'OPEN', headRefOid: 'b'.repeat(40), files: [] }, manifest).ok === false);
  check('PR_REVALIDATION_FAIL', 'unexpected generated diff blocks merge (test #7)', verifyGeneratedPrStillExpectedBeforeMerge({ number: 42, state: 'OPEN', headRefOid: 'a'.repeat(40), files: [{ path: 'functions/api/mcp.js' }] }, manifest).ok === false);
  check('PR_REVALIDATION_FAIL', 'wrong PR number blocks merge', verifyGeneratedPrStillExpectedBeforeMerge({ number: 99, state: 'OPEN', headRefOid: 'a'.repeat(40), files: [] }, manifest).ok === false);
  check('PR_REVALIDATION_FAIL', 'PR no longer open blocks merge', verifyGeneratedPrStillExpectedBeforeMerge({ number: 42, state: 'CLOSED', headRefOid: 'a'.repeat(40), files: [] }, manifest).ok === false);
  check('PR_REVALIDATION_FAIL', 'a null prInfo (PR not found) blocks merge', verifyGeneratedPrStillExpectedBeforeMerge(null, manifest).ok === false);
}

// ─────────────────────────────────────────────────────────────────────────
// checkExistingClearanceRowConsistency (step 9 idempotency, tests #9/#10)
// ─────────────────────────────────────────────────────────────────────────
function testClearanceRowConsistency() {
  check('CLEARANCE_CONSISTENCY', 'no row yet -> NOT_FOUND', checkExistingClearanceRowConsistency(null, { expectedTopicSlug: 'x', expectedGenerationSourceHash: HASH }).state === 'NOT_FOUND');

  const matching = { topic_slug: 'alopecia-areata', status: 'ready_for_page_builder', clearance_mode: 'AUTO_READY', generation_source_hash: HASH };
  check('CLEARANCE_CONSISTENCY', 'matching non-public row -> MATCHES_EXPECTED (idempotent resume, test #9)', checkExistingClearanceRowConsistency(matching, { expectedTopicSlug: 'alopecia-areata', expectedGenerationSourceHash: HASH }).state === 'MATCHES_EXPECTED');

  const conflictingHash = { ...matching, generation_source_hash: 'different-hash' };
  check('CLEARANCE_CONSISTENCY', 'non-matching hash -> CONFLICT (fails closed, test #10)', checkExistingClearanceRowConsistency(conflictingHash, { expectedTopicSlug: 'alopecia-areata', expectedGenerationSourceHash: HASH }).state === 'CONFLICT');

  const alreadyPublishedSame = { ...matching, status: 'published' };
  check('CLEARANCE_CONSISTENCY', 'already published with matching hash -> ALREADY_PUBLISHED', checkExistingClearanceRowConsistency(alreadyPublishedSame, { expectedTopicSlug: 'alopecia-areata', expectedGenerationSourceHash: HASH }).state === 'ALREADY_PUBLISHED');

  const alreadyPublishedDifferent = { ...matching, status: 'published', generation_source_hash: 'different-hash' };
  check('CLEARANCE_CONSISTENCY', 'already published with a DIFFERENT hash -> CONFLICT', checkExistingClearanceRowConsistency(alreadyPublishedDifferent, { expectedTopicSlug: 'alopecia-areata', expectedGenerationSourceHash: HASH }).state === 'CONFLICT');

  const wrongTopic = { ...matching, topic_slug: 'other-topic' };
  check('CLEARANCE_CONSISTENCY', 'row for a different topic_slug -> CONFLICT', checkExistingClearanceRowConsistency(wrongTopic, { expectedTopicSlug: 'alopecia-areata', expectedGenerationSourceHash: HASH }).state === 'CONFLICT');
}

// ─────────────────────────────────────────────────────────────────────────
// checkCloudflarePagesCheckRunSucceeded (step 12, tests #12-14) -- the
// REAL signal this repository's Cloudflare Pages Git integration
// exposes: a GitHub check run named "Cloudflare Pages" from the
// "cloudflare-workers-and-pages" GitHub App, never a Deployments-API
// object.
// ─────────────────────────────────────────────────────────────────────────
function cloudflarePagesCheckRun(overrides = {}) {
  return { id: 1, name: 'Cloudflare Pages', head_sha: 'a'.repeat(40), status: 'completed', conclusion: 'success', app: { slug: 'cloudflare-workers-and-pages' }, ...overrides };
}

function testCloudflareCheckRunChecksAreExact() {
  const sha = 'a'.repeat(40);
  check('CLOUDFLARE_CHECK_RUN', 'a completed, successful Cloudflare Pages check run for the exact commit passes', checkCloudflarePagesCheckRunSucceeded([cloudflarePagesCheckRun()], sha).ok === true);
  check('CLOUDFLARE_CHECK_RUN', 'test #12: a completed Cloudflare check with conclusion=failure fails, state failure', checkCloudflarePagesCheckRunSucceeded([cloudflarePagesCheckRun({ conclusion: 'failure' })], sha).state === 'failure');
  check('CLOUDFLARE_CHECK_RUN', 'a still-in-progress Cloudflare check reports state pending (never accepted yet)', checkCloudflarePagesCheckRunSucceeded([cloudflarePagesCheckRun({ status: 'in_progress', conclusion: null })], sha).ok === false);
  check('CLOUDFLARE_CHECK_RUN', 'no check run at all for the commit fails', checkCloudflarePagesCheckRunSucceeded([], sha).ok === false);
  check('CLOUDFLARE_CHECK_RUN', 'a Cloudflare Pages check for a DIFFERENT commit SHA is never mistaken for this one', checkCloudflarePagesCheckRunSucceeded([cloudflarePagesCheckRun({ head_sha: 'b'.repeat(40) })], sha).ok === false);
  check('CLOUDFLARE_CHECK_RUN', 'test #14: a successful GENERIC (non-Cloudflare) check for the same SHA is never accepted', checkCloudflarePagesCheckRunSucceeded([{ id: 2, name: 'build', head_sha: sha, status: 'completed', conclusion: 'success', app: { slug: 'github-actions' } }], sha).ok === false);
  check('CLOUDFLARE_CHECK_RUN', 'a check with the right NAME but wrong APP is never accepted', checkCloudflarePagesCheckRunSucceeded([cloudflarePagesCheckRun({ app: { slug: 'some-other-app' } })], sha).ok === false);
  check('CLOUDFLARE_CHECK_RUN', 'a check with the right APP but wrong NAME is never accepted', checkCloudflarePagesCheckRunSucceeded([cloudflarePagesCheckRun({ name: 'Some Other Check' })], sha).ok === false);
}

// ─────────────────────────────────────────────────────────────────────────
// verifyLivePagePublication (step 13, tests #15-20)
// ─────────────────────────────────────────────────────────────────────────
function baselineLiveHtml() {
  return `<!DOCTYPE html><html><head><link rel="canonical" href="https://aimtrichology.com${ROUTE}"><meta name="${GENERATION_MARKER_META_NAME}" content="${HASH}"></head><body>ok</body></html>`;
}
function baselineLiveInput(overrides = {}) {
  return {
    httpStatus: 200, html: baselineLiveHtml(),
    sitemapXml: `<urlset><url><loc>https://aimtrichology.com${ROUTE}</loc></url></urlset>`,
    hubHtml: `<ul class="aimt-edu-card-grid"><li><a href="${ROUTE}">card</a></li></ul>`,
    expectedRoute: ROUTE, expectedGenerationSourceHash: HASH,
    ...overrides,
  };
}

function testLiveVerificationPassesWhenEverythingMatches() {
  const result = verifyLivePagePublication(baselineLiveInput());
  check('LIVE_VERIFY_PASS', 'ok is true', result.ok === true, JSON.stringify(result));
  check('LIVE_VERIFY_PASS', 'every individual check reports true', Object.values(result.checks).every(Boolean));
}

function testLiveVerificationFailsClosedOnEachIndividualCheck() {
  check('LIVE_VERIFY_FAIL', 'test #15: non-200 status fails', verifyLivePagePublication(baselineLiveInput({ httpStatus: 404 })).ok === false);
  check('LIVE_VERIFY_FAIL', 'test #16: wrong canonical fails', verifyLivePagePublication(baselineLiveInput({ html: baselineLiveHtml().replace(ROUTE, '/education/hair-loss/wrong-slug') })).violations.includes('CANONICAL_MISSING_OR_INCORRECT'));
  check('LIVE_VERIFY_FAIL', 'test #17: noindex present fails', verifyLivePagePublication(baselineLiveInput({ html: baselineLiveHtml().replace('<body>', '<meta name="robots" content="noindex, nofollow"><body>') })).violations.includes('UNEXPECTED_NOINDEX_PRESENT'));
  check('LIVE_VERIFY_FAIL', 'test #18: wrong generation marker fails', verifyLivePagePublication(baselineLiveInput({ html: baselineLiveHtml().replace(HASH, 'wrong-hash') })).violations.includes('GENERATION_MARKER_MISSING_OR_INCORRECT'));
  check('LIVE_VERIFY_FAIL', 'test #18: missing generation marker entirely fails', verifyLivePagePublication(baselineLiveInput({ html: `<html><head><link rel="canonical" href="https://aimtrichology.com${ROUTE}"></head></html>` })).violations.includes('GENERATION_MARKER_MISSING_OR_INCORRECT'));
  check('LIVE_VERIFY_FAIL', 'test #19: sitemap missing the route fails', verifyLivePagePublication(baselineLiveInput({ sitemapXml: '<urlset></urlset>' })).violations.includes('SITEMAP_MISSING_ROUTE'));
  check('LIVE_VERIFY_FAIL', 'test #20: hub missing the route fails', verifyLivePagePublication(baselineLiveInput({ hubHtml: '<ul class="aimt-edu-card-grid"></ul>' })).violations.includes('HUB_MISSING_ROUTE'));

  // A generic 404/error document masquerading as HTTP 200: no canonical,
  // no marker -- caught structurally by the SAME two checks, no separate
  // heuristic needed.
  const genericErrorDoc = '<html><head><title>Not Found</title></head><body>Nothing here</body></html>';
  const genericResult = verifyLivePagePublication(baselineLiveInput({ html: genericErrorDoc }));
  check('LIVE_VERIFY_FAIL', 'a generic error document masquerading as 200 fails both canonical and marker checks', genericResult.violations.includes('CANONICAL_MISSING_OR_INCORRECT') && genericResult.violations.includes('GENERATION_MARKER_MISSING_OR_INCORRECT'));
}

// ─────────────────────────────────────────────────────────────────────────
// verifyPostWritePublishedRow (step 15, tests #23/#24)
// ─────────────────────────────────────────────────────────────────────────
function baselinePublishedRow(overrides = {}) {
  return {
    topic_slug: 'alopecia-areata', status: 'published', sitemap_eligible: true, published_at: '2026-01-01T00:00:00.000Z',
    clearance_mode: 'AUTO_READY', generation_source_hash: HASH,
    ...overrides,
  };
}

function testPostWriteVerificationPassesOnCorrectState() {
  const result = verifyPostWritePublishedRow(baselinePublishedRow(), { expectedTopicSlug: 'alopecia-areata', expectedGenerationSourceHash: HASH, storedIntegrityValid: true });
  check('POST_WRITE_PASS', 'test #24: correct post-write state -> ok', result.ok === true, JSON.stringify(result));
}

function testPostWriteVerificationFailsClosedOnAnyMismatch() {
  check('POST_WRITE_FAIL', 'no row at all fails', verifyPostWritePublishedRow(null, { expectedTopicSlug: 'x', expectedGenerationSourceHash: HASH, storedIntegrityValid: true }).ok === false);
  check('POST_WRITE_FAIL', 'test #23: status not published fails', verifyPostWritePublishedRow(baselinePublishedRow({ status: 'ready_for_page_builder' }), { expectedTopicSlug: 'alopecia-areata', expectedGenerationSourceHash: HASH, storedIntegrityValid: true }).ok === false);
  check('POST_WRITE_FAIL', 'sitemap_eligible not true fails', verifyPostWritePublishedRow(baselinePublishedRow({ sitemap_eligible: false }), { expectedTopicSlug: 'alopecia-areata', expectedGenerationSourceHash: HASH, storedIntegrityValid: true }).ok === false);
  check('POST_WRITE_FAIL', 'null published_at fails', verifyPostWritePublishedRow(baselinePublishedRow({ published_at: null }), { expectedTopicSlug: 'alopecia-areata', expectedGenerationSourceHash: HASH, storedIntegrityValid: true }).ok === false);
  check('POST_WRITE_FAIL', 'wrong clearance_mode fails', verifyPostWritePublishedRow(baselinePublishedRow({ clearance_mode: 'HUMAN_APPROVED' }), { expectedTopicSlug: 'alopecia-areata', expectedGenerationSourceHash: HASH, storedIntegrityValid: true }).ok === false);
  check('POST_WRITE_FAIL', 'generation_source_hash mismatch fails', verifyPostWritePublishedRow(baselinePublishedRow(), { expectedTopicSlug: 'alopecia-areata', expectedGenerationSourceHash: 'different', storedIntegrityValid: true }).ok === false);
  check('POST_WRITE_FAIL', 'test #23: stored integrity check failing fails, never a false PUBLISHED', verifyPostWritePublishedRow(baselinePublishedRow(), { expectedTopicSlug: 'alopecia-areata', expectedGenerationSourceHash: HASH, storedIntegrityValid: false }).ok === false);
}

// ---- Report ----
const tests = [
  testEligibilityPassesWhenEverythingHolds,
  testEligibilityCatchesEveryIndividualFailure,
  testPrRevalidationPassesWhenUnchanged,
  testPrRevalidationFailsClosedOnDrift,
  testClearanceRowConsistency,
  testCloudflareCheckRunChecksAreExact,
  testLiveVerificationPassesWhenEverythingMatches,
  testLiveVerificationFailsClosedOnEachIndividualCheck,
  testPostWriteVerificationPassesOnCorrectState,
  testPostWriteVerificationFailsClosedOnAnyMismatch,
];
for (const t of tests) t();

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
