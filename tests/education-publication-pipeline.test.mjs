// AIMT Education Operations v1 — orchestrator state-machine tests for
// the PRODUCTION PUBLISH LANE (scripts/education-operations-cycle.mjs
// #runPublicationPipeline). Every gh/git/Supabase/Cloudflare/fetch call
// is injected via options.io -- NO live network call, NO real merge, NO
// real production write anywhere in this file. AUTOPUBLISH is only ever
// set to "true" on a FAKE env object passed directly to
// runPublicationPipeline() in-process; the real repository variable is
// never touched.
//
// Run: node tests/education-publication-pipeline.test.mjs

import { runPublicationPipeline } from '../scripts/education-operations-cycle.mjs';
import { RUN_FINAL_STATE } from '../functions/_lib/education-ops/education-run-ledger.mjs';
import { PUBLICATION_STATE } from '../functions/_lib/education-ops/education-publication-state.mjs';
import { FRESHNESS_STATE } from '../functions/_lib/education-ops/education-freshness-monitor.mjs';
import { GENERATION_MARKER_META_NAME } from '../functions/_lib/education-ops/education-page-renderer.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const TOPIC_SLUG = 'alopecia-areata';
const ROUTE = '/education/hair-loss/alopecia-areata';
const CLUSTER = 'hair-loss-shedding';
const HASH = 'gsh-alopecia-areata-abc123';
const HEAD_SHA = 'a'.repeat(40);
const MERGE_SHA = 'b'.repeat(40);

const FAKE_ENV_AUTOPUBLISH_OFF = { SUPABASE_URL: 'https://example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fake', AIMT_EDUCATION_AUTOPUBLISH_ENABLED: 'false', GITHUB_REPOSITORY: 'brandrice-dev/aimt-site' };
const FAKE_ENV_AUTOPUBLISH_ON = { ...FAKE_ENV_AUTOPUBLISH_OFF, AIMT_EDUCATION_AUTOPUBLISH_ENABLED: 'true' };

function spyFn(realFn) {
  const spy = (...args) => { spy.callCount += 1; spy.lastArgs = args; return realFn(...args); };
  spy.callCount = 0;
  return spy;
}

/** A minimal but real-shaped candidate bundle at READY_FOR_PREPARE
    (Reviewer PASS already persisted, matching the real Run #9 shape). */
function makeReadyBundle(overrides = {}) {
  return {
    contract_version: 'education-candidate-bundle-v1',
    topic_slug: TOPIC_SLUG, cluster: CLUSTER, route: ROUTE,
    originating_run_id: 'shadow-run-8', created_at: '2026-09-01T00:00:00.000Z',
    intent_plan: { topic_slug: TOPIC_SLUG, page_concept: 'Alopecia Areata Overview', cluster: CLUSTER },
    prepared_artifact: {
      topic_slug: TOPIC_SLUG,
      record: {
        topic_slug: TOPIC_SLUG, status: 'ready_for_page_builder', clearance_mode: 'AUTO_READY',
        generation_source_hash: HASH, publication_clearance: { fingerprint_input: { risk_tier: 'LOWER' } },
      },
      prepared_at: '2026-09-01T00:00:00.000Z',
    },
    generation_source_hash: HASH,
    fingerprint_input: { risk_tier: 'LOWER' },
    page_plan: { topic_slug: TOPIC_SLUG, route: ROUTE, h1: 'Alopecia Areata', sources: [] },
    writer_validation: { valid: true },
    deterministic_repair: null,
    review_result: { outcome: 'PASS', failing_paraphrases: [], failing_framings: [], voice_fail: false, scope_fail: false, summary: 'All units PASS.' },
    reviewer_framing_repair: { attempted: true, removed_unit_count: 3, deterministic_validation_passed: true, originating_review_summary: 's', resulting_review_outcome: 'PASS' },
    freshness_basis: { selected_claim_ids: [], excluded_claim_ids: [] },
    source_ids: [], selected_claim_ids: [],
    ...overrides,
  };
}

function liveHtmlFor(hash = HASH) {
  return `<!DOCTYPE html><html><head><link rel="canonical" href="https://aimtrichology.com${ROUTE}"><meta name="${GENERATION_MARKER_META_NAME}" content="${hash}"></head><body>ok</body></html>`;
}
function liveSitemapWithRoute() { return `<urlset><url><loc>https://aimtrichology.com${ROUTE}</loc></url></urlset>`; }
function liveHubWithRoute() { return `<ul class="aimt-edu-card-grid"><li><a href="${ROUTE}">card</a></li></ul>`; }

/** Full happy-path io -- every override below narrows this default to
    exercise one specific failure/idempotency mode. */
function makeHappyIo({ manifestStore = new Map(), bundle, existingPr = null, existingClearanceRow = null } = {}) {
  let clearanceRow = existingClearanceRow;
  return {
    loadCandidateBundleFn: () => ({ found: true, bundle }),
    loadPublicationManifestFn: (slug) => (manifestStore.has(slug) ? { found: true, manifest: manifestStore.get(slug) } : { found: false, manifest: null }),
    writePublicationManifestFn: (slug, manifest) => { manifestStore.set(slug, manifest); },
    fetchEvidenceFn: async () => ({ claims: [], sources: [] }),
    fetchPublishedTopicSlugsFn: async () => [],
    countPagesPublishedThisWeekFn: async () => ({ count: 0 }),
    resolveTrustedSiblingPagesFn: () => ({ ok: true, pages: [] }),
    verifyCandidateBundleIntegrityFn: async () => ({ valid: true, violations: [] }),
    resolveCandidateResumeFreshnessFn: () => ({ state: FRESHNESS_STATE.FRESH }),
    prepareLaunchArtifactsFn: () => ({
      articlePath: `education${ROUTE}.html`, planArtifactPath: `functions/_data/education-page-plans/${TOPIC_SLUG}.json`,
      hubPath: 'education/hair-loss.html', sitemapPath: 'sitemap.xml', allowlistResult: { valid: true, allowed: [], violations: [] },
    }),
    openLaunchPrFn: () => ({ branch: `education-ops/publish-${TOPIC_SLUG}`, prNumber: 100, prUrl: 'https://github.com/brandrice-dev/aimt-site/pull/100', headRefOid: HEAD_SHA }),
    ghPrListForBranchFn: () => existingPr,
    ghPrViewFn: (n) => ({ number: n, state: 'OPEN', headRefOid: HEAD_SHA, files: [{ path: `education${ROUTE}.html` }, { path: 'sitemap.xml' }, { path: `functions/_data/education-page-plans/${TOPIC_SLUG}.json` }, { path: 'education/hair-loss.html' }] }),
    ghPrMergeFn: (n) => ({ number: n, state: 'MERGED', mergeCommitOid: MERGE_SHA }),
    fetchClearanceRowFn: async () => clearanceRow,
    writeClearanceRecordFn: async (env, record) => { clearanceRow = { ...record, sitemap_eligible: false, published_at: null }; return [clearanceRow]; },
    publishClearanceRecordFn: async (env, topicSlug, { requireCurrentHash }) => {
      clearanceRow = { ...clearanceRow, status: 'published', sitemap_eligible: true, published_at: '2026-09-28T00:00:00.000Z', generation_source_hash: requireCurrentHash };
      return [clearanceRow];
    },
    verifyStoredClearanceIntegrityFn: async () => ({ valid: true, violations: [] }),
    waitForDeploymentFn: async () => ({ ok: true, state: 'success', deploymentId: 1, violations: [] }),
    fetchLiveArtifactsFn: async () => ({ httpStatus: 200, html: liveHtmlFor(), sitemapXml: liveSitemapWithRoute(), hubHtml: liveHubWithRoute() }),
    _getClearanceRow: () => clearanceRow,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// 24/1/26: full happy path -- PUBLISHED, zero model calls throughout.
// ─────────────────────────────────────────────────────────────────────────
async function testFullHappyPathReachesPublishedWithZeroModelCalls() {
  const bundle = makeReadyBundle();
  const io = makeHappyIo({ bundle });
  const mergeSpy = spyFn(io.ghPrMergeFn);
  io.ghPrMergeFn = mergeSpy;
  const publishSpy = spyFn(io.publishClearanceRecordFn);
  io.publishClearanceRecordFn = publishSpy;

  const report = await runPublicationPipeline(FAKE_ENV_AUTOPUBLISH_ON, { topicSlug: TOPIC_SLUG, io });

  check('HAPPY_PATH', 'test #24: final_state is PUBLISHED', report.final_state === RUN_FINAL_STATE.PUBLISHED, JSON.stringify({ state: report.final_state, reason: report.exception_reason }));
  check('HAPPY_PATH', 'test #1/#26: model_calls.total_calls is exactly 0', report.model_calls.total_calls === 0, report.model_calls.total_calls);
  check('HAPPY_PATH', 'merge was actually invoked (test #5: AUTOPUBLISH true is required for merge, and here it is honored)', mergeSpy.callCount === 1);
  check('HAPPY_PATH', 'test #22: publishClearanceRecord received the EXACT generation hash', publishSpy.lastArgs[2].requireCurrentHash === HASH);
  check('HAPPY_PATH', 'publication_action reports the PR number and merge commit', report.publication_action.pr_number === 100 && report.publication_action.merge_commit_sha === MERGE_SHA);
}

// ─────────────────────────────────────────────────────────────────────────
// 4: AUTOPUBLISH false can prepare/open PR state but cannot merge/publish.
// ─────────────────────────────────────────────────────────────────────────
async function testAutopublishOffPreparesAndOpensPrButNeverMergesOrPublishes() {
  const bundle = makeReadyBundle();
  const manifestStore = new Map();
  const io = makeHappyIo({ bundle, manifestStore });
  const mergeSpy = spyFn(io.ghPrMergeFn);
  io.ghPrMergeFn = mergeSpy;
  const writeClearanceSpy = spyFn(io.writeClearanceRecordFn);
  io.writeClearanceRecordFn = writeClearanceSpy;
  const publishSpy = spyFn(io.publishClearanceRecordFn);
  io.publishClearanceRecordFn = publishSpy;
  const deploySpy = spyFn(io.waitForDeploymentFn);
  io.waitForDeploymentFn = deploySpy;

  const report = await runPublicationPipeline(FAKE_ENV_AUTOPUBLISH_OFF, { topicSlug: TOPIC_SLUG, io });

  check('AUTOPUBLISH_GATE', 'final_state is AUTOPUBLISH_GATE_CLOSED', report.final_state === RUN_FINAL_STATE.AUTOPUBLISH_GATE_CLOSED, report.final_state);
  check('AUTOPUBLISH_GATE', 'a PR was opened (prepare/open-PR state IS allowed while the gate is closed)', manifestStore.get(TOPIC_SLUG).generated.pr_number === 100);
  check('AUTOPUBLISH_GATE', 'manifest state is PR_OPEN, never further', manifestStore.get(TOPIC_SLUG).state === PUBLICATION_STATE.PR_OPEN);
  check('AUTOPUBLISH_GATE', 'merge was NEVER called', mergeSpy.callCount === 0);
  check('AUTOPUBLISH_GATE', 'clearance write was NEVER called', writeClearanceSpy.callCount === 0);
  check('AUTOPUBLISH_GATE', 'publishClearanceRecord was NEVER called', publishSpy.callCount === 0);
  check('AUTOPUBLISH_GATE', 'Cloudflare deployment wait was NEVER called', deploySpy.callCount === 0);
  check('AUTOPUBLISH_GATE', 'model_calls stays 0 even while the gate is closed', report.model_calls.total_calls === 0);
}

// ─────────────────────────────────────────────────────────────────────────
// Crash recovery: if a PR already exists for this topic's deterministic
// branch, resume it rather than opening a duplicate.
// ─────────────────────────────────────────────────────────────────────────
async function testExistingPrIsAdoptedNeverDuplicated() {
  const bundle = makeReadyBundle();
  const existingPr = { number: 55, state: 'OPEN', headRefOid: HEAD_SHA, url: 'https://github.com/brandrice-dev/aimt-site/pull/55' };
  const io = makeHappyIo({ bundle, existingPr });
  const prepareSpy = spyFn(io.prepareLaunchArtifactsFn);
  io.prepareLaunchArtifactsFn = prepareSpy;
  const openSpy = spyFn(io.openLaunchPrFn);
  io.openLaunchPrFn = openSpy;

  const report = await runPublicationPipeline(FAKE_ENV_AUTOPUBLISH_OFF, { topicSlug: TOPIC_SLUG, io });
  check('ADOPT_EXISTING_PR', 'prepareLaunchArtifacts is never called when a PR already exists', prepareSpy.callCount === 0);
  check('ADOPT_EXISTING_PR', 'openLaunchPr (which would open a NEW PR) is never called', openSpy.callCount === 0);
  check('ADOPT_EXISTING_PR', 'the EXISTING PR number is adopted into the manifest', report.publication_action.pr_number === 55);
}

// ─────────────────────────────────────────────────────────────────────────
// 2/3: prepared artifact digest survives across separate invocations
// byte-for-byte; a genuine drift fails closed.
// ─────────────────────────────────────────────────────────────────────────
async function testPreparedArtifactDigestSurvivesAcrossRunsAndDriftFailsClosed() {
  const bundle = makeReadyBundle();
  const manifestStore = new Map();

  const runA = await runPublicationPipeline(FAKE_ENV_AUTOPUBLISH_OFF, { topicSlug: TOPIC_SLUG, io: makeHappyIo({ bundle, manifestStore }) });
  check('DIGEST_SURVIVES', 'run A opens the PR normally', runA.final_state === RUN_FINAL_STATE.AUTOPUBLISH_GATE_CLOSED);
  const digestAfterRunA = manifestStore.get(TOPIC_SLUG).prepared_artifact_digest;

  // "Separate run" -- a FRESH runPublicationPipeline() invocation reusing
  // the SAME manifestStore (simulating a downloaded GitHub Actions
  // artifact) and the SAME candidate bundle object (simulating a
  // re-downloaded candidate-bundle artifact) -- never regenerated.
  const runB = await runPublicationPipeline(FAKE_ENV_AUTOPUBLISH_OFF, { topicSlug: TOPIC_SLUG, io: makeHappyIo({ bundle, manifestStore, existingPr: { number: manifestStore.get(TOPIC_SLUG).generated.pr_number, state: 'OPEN', headRefOid: HEAD_SHA, url: 'x' } }) });
  check('DIGEST_SURVIVES', 'test #2: run B never re-derives a different digest for the SAME bundle', manifestStore.get(TOPIC_SLUG).prepared_artifact_digest === digestAfterRunA);
  check('DIGEST_SURVIVES', 'run B still resolves cleanly (no INFRA_REVIEW)', runB.final_state === RUN_FINAL_STATE.AUTOPUBLISH_GATE_CLOSED, runB.final_state);

  // Now simulate a genuinely DIFFERENT/corrupted prepared_artifact for
  // the SAME topic_slug (e.g. a stale local file from an unrelated
  // candidate) -- must fail closed, never silently continue.
  const mutatedBundle = makeReadyBundle({ prepared_artifact: { ...bundle.prepared_artifact, record: { ...bundle.prepared_artifact.record, publication_clearance: { fingerprint_input: { risk_tier: 'MODERATE' } } } } });
  const runC = await runPublicationPipeline(FAKE_ENV_AUTOPUBLISH_OFF, { topicSlug: TOPIC_SLUG, io: makeHappyIo({ bundle: mutatedBundle, manifestStore }) });
  check('DIGEST_MISMATCH', 'test #3: a genuinely different prepared_artifact fails closed as INFRA_REVIEW', runC.final_state === RUN_FINAL_STATE.INFRA_REVIEW, JSON.stringify({ state: runC.final_state, reason: runC.exception_reason }));
  check('DIGEST_MISMATCH', 'the failure names the digest mismatch', runC.exception_reason.includes('PREPARED_ARTIFACT_DIGEST_MISMATCH'), runC.exception_reason);
}

// ─────────────────────────────────────────────────────────────────────────
// 8: candidate freshness change blocks publication.
// ─────────────────────────────────────────────────────────────────────────
async function testFreshnessChangeBlocksPublication() {
  const bundle = makeReadyBundle();
  const io = makeHappyIo({ bundle });
  io.resolveCandidateResumeFreshnessFn = () => ({ state: FRESHNESS_STATE.POTENTIAL_EVIDENCE_CHANGE, new_claim_ids: ['new-1'], removed_claim_ids: [] });
  const report = await runPublicationPipeline(FAKE_ENV_AUTOPUBLISH_ON, { topicSlug: TOPIC_SLUG, io });
  check('FRESHNESS_BLOCKS', 'final_state is INFRA_REVIEW', report.final_state === RUN_FINAL_STATE.INFRA_REVIEW, report.final_state);
  check('FRESHNESS_BLOCKS', 'the reason names the stale candidate', report.exception_reason.includes('CANDIDATE_NOT_FRESH'), report.exception_reason);
}

// ─────────────────────────────────────────────────────────────────────────
// 6/7: moved PR head / unexpected diff blocks merge.
// ─────────────────────────────────────────────────────────────────────────
async function testMovedPrHeadBlocksMerge() {
  const bundle = makeReadyBundle();
  const io = makeHappyIo({ bundle });
  io.ghPrViewFn = (n) => ({ number: n, state: 'OPEN', headRefOid: 'c'.repeat(40), files: [] }); // head moved
  const mergeSpy = spyFn(io.ghPrMergeFn);
  io.ghPrMergeFn = mergeSpy;
  const report = await runPublicationPipeline(FAKE_ENV_AUTOPUBLISH_ON, { topicSlug: TOPIC_SLUG, io });
  check('MOVED_HEAD_BLOCKS_MERGE', 'test #6: final_state is PUBLISH_FAILED', report.final_state === RUN_FINAL_STATE.PUBLISH_FAILED, report.final_state);
  check('MOVED_HEAD_BLOCKS_MERGE', 'merge was never actually invoked', mergeSpy.callCount === 0);
}

async function testUnexpectedDiffBlocksMerge() {
  const bundle = makeReadyBundle();
  const io = makeHappyIo({ bundle });
  io.ghPrViewFn = (n) => ({ number: n, state: 'OPEN', headRefOid: HEAD_SHA, files: [{ path: 'functions/api/mcp.js' }] });
  const mergeSpy = spyFn(io.ghPrMergeFn);
  io.ghPrMergeFn = mergeSpy;
  const report = await runPublicationPipeline(FAKE_ENV_AUTOPUBLISH_ON, { topicSlug: TOPIC_SLUG, io });
  check('UNEXPECTED_DIFF_BLOCKS_MERGE', 'test #7: final_state is PUBLISH_FAILED', report.final_state === RUN_FINAL_STATE.PUBLISH_FAILED, report.final_state);
  check('UNEXPECTED_DIFF_BLOCKS_MERGE', 'merge was never actually invoked', mergeSpy.callCount === 0);
}

// ─────────────────────────────────────────────────────────────────────────
// 9/10: clearance idempotency and conflict.
// ─────────────────────────────────────────────────────────────────────────
async function testMatchingClearanceRowResumesIdempotently() {
  const bundle = makeReadyBundle();
  const existingRow = { topic_slug: TOPIC_SLUG, status: 'ready_for_page_builder', clearance_mode: 'AUTO_READY', generation_source_hash: HASH };
  const io = makeHappyIo({ bundle, existingClearanceRow: existingRow });
  const writeSpy = spyFn(io.writeClearanceRecordFn);
  io.writeClearanceRecordFn = writeSpy;
  const report = await runPublicationPipeline(FAKE_ENV_AUTOPUBLISH_ON, { topicSlug: TOPIC_SLUG, io });
  check('CLEARANCE_IDEMPOTENT', 'test #9: writeClearanceRecord is never called for an already-matching row', writeSpy.callCount === 0);
  check('CLEARANCE_IDEMPOTENT', 'the pipeline still proceeds all the way to PUBLISHED', report.final_state === RUN_FINAL_STATE.PUBLISHED, JSON.stringify({ state: report.final_state, reason: report.exception_reason }));
}

async function testConflictingClearanceRowFailsClosed() {
  const bundle = makeReadyBundle();
  const conflictingRow = { topic_slug: TOPIC_SLUG, status: 'ready_for_page_builder', clearance_mode: 'AUTO_READY', generation_source_hash: 'a-completely-different-hash' };
  const io = makeHappyIo({ bundle, existingClearanceRow: conflictingRow });
  const writeSpy = spyFn(io.writeClearanceRecordFn);
  io.writeClearanceRecordFn = writeSpy;
  const report = await runPublicationPipeline(FAKE_ENV_AUTOPUBLISH_ON, { topicSlug: TOPIC_SLUG, io });
  check('CLEARANCE_CONFLICT', 'test #10: final_state is INFRA_REVIEW', report.final_state === RUN_FINAL_STATE.INFRA_REVIEW, report.final_state);
  check('CLEARANCE_CONFLICT', 'never blindly overwrites the conflicting row', writeSpy.callCount === 0);
}

// ─────────────────────────────────────────────────────────────────────────
// 11: PR merge failure -> PUBLISH_FAILED.
// ─────────────────────────────────────────────────────────────────────────
async function testMergeFailureBecomesPublishFailed() {
  const bundle = makeReadyBundle();
  const io = makeHappyIo({ bundle });
  io.ghPrMergeFn = () => { throw new Error('simulated merge conflict'); };
  const deploySpy = spyFn(io.waitForDeploymentFn);
  io.waitForDeploymentFn = deploySpy;
  const report = await runPublicationPipeline(FAKE_ENV_AUTOPUBLISH_ON, { topicSlug: TOPIC_SLUG, io });
  check('MERGE_FAILURE', 'test #11: final_state is PUBLISH_FAILED', report.final_state === RUN_FINAL_STATE.PUBLISH_FAILED, report.final_state);
  check('MERGE_FAILURE', 'deployment wait never starts after a merge failure', deploySpy.callCount === 0);
}

// ─────────────────────────────────────────────────────────────────────────
// 12/13/14: Cloudflare failure/timeout/preview-not-accepted.
// ─────────────────────────────────────────────────────────────────────────
async function testDeploymentFailureTimeoutAndPreviewNotAcceptedAllFailClosed() {
  for (const [label, deployResult] of [
    ['test #12: deployment failure', { ok: false, state: 'failure', deploymentId: null, violations: ['NO_SUCCESSFUL_PRODUCTION_DEPLOYMENT:failure'] }],
    ['test #13: deployment timeout', { ok: false, state: 'timeout', deploymentId: null, violations: ['DEPLOYMENT_WAIT_TIMEOUT'] }],
    ['test #14: preview-only deployment never accepted', { ok: false, state: 'timeout', deploymentId: null, violations: ['NO_PRODUCTION_DEPLOYMENT_FOR_COMMIT'] }],
  ]) {
    const bundle = makeReadyBundle();
    const io = makeHappyIo({ bundle });
    io.waitForDeploymentFn = async () => deployResult;
    const liveVerifySpy = spyFn(io.fetchLiveArtifactsFn);
    io.fetchLiveArtifactsFn = liveVerifySpy;
    const report = await runPublicationPipeline(FAKE_ENV_AUTOPUBLISH_ON, { topicSlug: TOPIC_SLUG, io });
    check('DEPLOYMENT_FAILS_CLOSED', `${label}: final_state is PUBLISH_FAILED`, report.final_state === RUN_FINAL_STATE.PUBLISH_FAILED, report.final_state);
    check('DEPLOYMENT_FAILS_CLOSED', `${label}: live verification never starts`, liveVerifySpy.callCount === 0);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 15-20: every individual live-verification failure -> PUBLISH_FAILED,
// and DB publish is NEVER called before live verification PASS (#21).
// ─────────────────────────────────────────────────────────────────────────
async function testEveryLiveVerificationFailureBlocksDbPublish() {
  const cases = [
    ['test #15: non-200 route', { httpStatus: 404, html: liveHtmlFor(), sitemapXml: liveSitemapWithRoute(), hubHtml: liveHubWithRoute() }],
    ['test #16: wrong canonical', { httpStatus: 200, html: liveHtmlFor().replace(ROUTE, '/education/hair-loss/wrong'), sitemapXml: liveSitemapWithRoute(), hubHtml: liveHubWithRoute() }],
    ['test #17: noindex present', { httpStatus: 200, html: liveHtmlFor().replace('<body>', '<meta name="robots" content="noindex, nofollow"><body>'), sitemapXml: liveSitemapWithRoute(), hubHtml: liveHubWithRoute() }],
    ['test #18: wrong generation marker', { httpStatus: 200, html: liveHtmlFor('wrong-hash'), sitemapXml: liveSitemapWithRoute(), hubHtml: liveHubWithRoute() }],
    ['test #19: sitemap missing route', { httpStatus: 200, html: liveHtmlFor(), sitemapXml: '<urlset></urlset>', hubHtml: liveHubWithRoute() }],
    ['test #20: hub missing route', { httpStatus: 200, html: liveHtmlFor(), sitemapXml: liveSitemapWithRoute(), hubHtml: '<ul class="aimt-edu-card-grid"></ul>' }],
  ];
  for (const [label, liveArtifacts] of cases) {
    const bundle = makeReadyBundle();
    const io = makeHappyIo({ bundle });
    io.fetchLiveArtifactsFn = async () => liveArtifacts;
    const publishSpy = spyFn(io.publishClearanceRecordFn);
    io.publishClearanceRecordFn = publishSpy;
    const report = await runPublicationPipeline(FAKE_ENV_AUTOPUBLISH_ON, { topicSlug: TOPIC_SLUG, io });
    check('LIVE_VERIFY_FAILS_CLOSED', `${label}: final_state is PUBLISH_FAILED`, report.final_state === RUN_FINAL_STATE.PUBLISH_FAILED, JSON.stringify({ label, state: report.final_state, reason: report.exception_reason }));
    check('LIVE_VERIFY_FAILS_CLOSED', `${label}: test #21: publishClearanceRecord was NEVER called`, publishSpy.callCount === 0);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 23: post-write row mismatch -> PUBLISH_FAILED, never a false PUBLISHED.
// ─────────────────────────────────────────────────────────────────────────
async function testPostWriteMismatchNeverReportsFalsePublished() {
  const bundle = makeReadyBundle();
  const io = makeHappyIo({ bundle });
  let readCount = 0;
  io.fetchClearanceRowFn = async () => {
    readCount += 1;
    if (readCount === 1) return null; // pre-write: not found -> triggers a write
    if (readCount === 2) return { topic_slug: TOPIC_SLUG, status: 'ready_for_page_builder', clearance_mode: 'AUTO_READY', generation_source_hash: HASH }; // rowBeforePublish check
    // Post-write re-read: the row does NOT actually reflect a successful publish.
    return { topic_slug: TOPIC_SLUG, status: 'ready_for_page_builder', clearance_mode: 'AUTO_READY', generation_source_hash: HASH, sitemap_eligible: false, published_at: null };
  };
  const report = await runPublicationPipeline(FAKE_ENV_AUTOPUBLISH_ON, { topicSlug: TOPIC_SLUG, io });
  check('POST_WRITE_MISMATCH', 'test #23: final_state is PUBLISH_FAILED, never PUBLISHED', report.final_state === RUN_FINAL_STATE.PUBLISH_FAILED, report.final_state);
}

// ─────────────────────────────────────────────────────────────────────────
// 25: re-running an already correctly published publication is
// idempotent and never duplicates anything.
// ─────────────────────────────────────────────────────────────────────────
async function testAlreadyPublishedRunIsIdempotent() {
  const bundle = makeReadyBundle();
  const manifestStore = new Map();
  const io = makeHappyIo({ bundle, manifestStore });
  const runA = await runPublicationPipeline(FAKE_ENV_AUTOPUBLISH_ON, { topicSlug: TOPIC_SLUG, io });
  check('IDEMPOTENT_REPUBLISH', 'run A reaches PUBLISHED', runA.final_state === RUN_FINAL_STATE.PUBLISHED, JSON.stringify({ state: runA.final_state, reason: runA.exception_reason }));

  const mergeSpy = spyFn(io.ghPrMergeFn);
  io.ghPrMergeFn = mergeSpy;
  const openSpy = spyFn(io.openLaunchPrFn);
  io.openLaunchPrFn = openSpy;
  const writeClearanceSpy = spyFn(io.writeClearanceRecordFn);
  io.writeClearanceRecordFn = writeClearanceSpy;
  const publishSpy = spyFn(io.publishClearanceRecordFn);
  io.publishClearanceRecordFn = publishSpy;
  const deploySpy = spyFn(io.waitForDeploymentFn);
  io.waitForDeploymentFn = deploySpy;

  const runB = await runPublicationPipeline(FAKE_ENV_AUTOPUBLISH_ON, { topicSlug: TOPIC_SLUG, io });
  check('IDEMPOTENT_REPUBLISH', 'test #25: re-running reports PUBLISHED again, idempotently', runB.final_state === RUN_FINAL_STATE.PUBLISHED, runB.final_state);
  check('IDEMPOTENT_REPUBLISH', 'nothing is opened/merged/written/deployed a second time', openSpy.callCount === 0 && mergeSpy.callCount === 0 && writeClearanceSpy.callCount === 0 && publishSpy.callCount === 0 && deploySpy.callCount === 0);
  check('IDEMPOTENT_REPUBLISH', 'model_calls stays 0', runB.model_calls.total_calls === 0);
}

// ─────────────────────────────────────────────────────────────────────────
// Crash recovery: merged but deployment not yet confirmed -> resume at
// deployment verification (never re-opens/re-merges).
// ─────────────────────────────────────────────────────────────────────────
async function testResumesAtDeploymentWaitWhenAlreadyMergedButNotYetDeployed() {
  const bundle = makeReadyBundle();
  const manifestStore = new Map();
  // Seed a manifest that is ALREADY merged (as if a prior run merged the
  // PR and then the job died before the deployment wait completed).
  const { buildPublicationManifest, advancePublicationManifest, computePreparedArtifactDigest } = await import('../functions/_lib/education-ops/education-publication-state.mjs');
  const digest = await computePreparedArtifactDigest(bundle.prepared_artifact);
  let seeded = buildPublicationManifest({ runId: 'prior-run', topicSlug: TOPIC_SLUG, route: ROUTE, cluster: CLUSTER, generationSourceHash: HASH, preparedArtifactDigest: digest, candidateOriginatingRunId: bundle.originating_run_id });
  seeded = advancePublicationManifest(seeded, { state: PUBLICATION_STATE.PR_OPEN, generated: { branch: `education-ops/publish-${TOPIC_SLUG}`, pr_number: 100, pr_url: 'x', expected_head_sha: HEAD_SHA } });
  seeded = advancePublicationManifest(seeded, { state: PUBLICATION_STATE.CLEARANCE_PERSISTED, clearance: { persisted: true, mode: 'AUTO_READY' } });
  seeded = advancePublicationManifest(seeded, { state: PUBLICATION_STATE.MERGED, merge: { merged: true, merge_commit_sha: MERGE_SHA } });
  manifestStore.set(TOPIC_SLUG, seeded);

  const existingRow = { topic_slug: TOPIC_SLUG, status: 'ready_for_page_builder', clearance_mode: 'AUTO_READY', generation_source_hash: HASH };
  const io = makeHappyIo({ bundle, manifestStore, existingClearanceRow: existingRow });
  const openSpy = spyFn(io.openLaunchPrFn);
  io.openLaunchPrFn = openSpy;
  const mergeSpy = spyFn(io.ghPrMergeFn);
  io.ghPrMergeFn = mergeSpy;
  const deploySpy = spyFn(io.waitForDeploymentFn);
  io.waitForDeploymentFn = deploySpy;

  const report = await runPublicationPipeline(FAKE_ENV_AUTOPUBLISH_ON, { topicSlug: TOPIC_SLUG, io });
  check('RESUME_AT_DEPLOYMENT', 'never re-opens a PR', openSpy.callCount === 0);
  check('RESUME_AT_DEPLOYMENT', 'never re-merges', mergeSpy.callCount === 0);
  check('RESUME_AT_DEPLOYMENT', 'DOES wait for deployment', deploySpy.callCount === 1);
  check('RESUME_AT_DEPLOYMENT', 'reaches PUBLISHED', report.final_state === RUN_FINAL_STATE.PUBLISHED, JSON.stringify({ state: report.final_state, reason: report.exception_reason }));
}

// ─────────────────────────────────────────────────────────────────────────
// Crash recovery: deployment succeeded but DB publish failed on a PRIOR
// run -> a later run retries the DB transition ONLY after re-verifying
// the live page fresh (never trusting a stale cached verification).
// ─────────────────────────────────────────────────────────────────────────
async function testRetriesDbPublishOnlyAfterReVerifyingLivePage() {
  const bundle = makeReadyBundle();
  const manifestStore = new Map();
  const { buildPublicationManifest, advancePublicationManifest, computePreparedArtifactDigest } = await import('../functions/_lib/education-ops/education-publication-state.mjs');
  const digest = await computePreparedArtifactDigest(bundle.prepared_artifact);
  let seeded = buildPublicationManifest({ runId: 'prior-run', topicSlug: TOPIC_SLUG, route: ROUTE, cluster: CLUSTER, generationSourceHash: HASH, preparedArtifactDigest: digest, candidateOriginatingRunId: bundle.originating_run_id });
  seeded = advancePublicationManifest(seeded, { state: PUBLICATION_STATE.PR_OPEN, generated: { branch: `education-ops/publish-${TOPIC_SLUG}`, pr_number: 100, pr_url: 'x', expected_head_sha: HEAD_SHA } });
  seeded = advancePublicationManifest(seeded, { state: PUBLICATION_STATE.CLEARANCE_PERSISTED, clearance: { persisted: true, mode: 'AUTO_READY' } });
  seeded = advancePublicationManifest(seeded, { state: PUBLICATION_STATE.MERGED, merge: { merged: true, merge_commit_sha: MERGE_SHA }, deployment: { state: 'success', deployment_id: 1 } });
  // A PRIOR run already verified live once (stale) -- this must NEVER be
  // trusted for the retry; live verification must run again, fresh.
  seeded = advancePublicationManifest(seeded, { liveVerification: { passed: true, checked_at: '2026-09-27T00:00:00.000Z', checks: {} } });
  manifestStore.set(TOPIC_SLUG, seeded);

  const existingRow = { topic_slug: TOPIC_SLUG, status: 'ready_for_page_builder', clearance_mode: 'AUTO_READY', generation_source_hash: HASH };
  const io = makeHappyIo({ bundle, manifestStore, existingClearanceRow: existingRow });
  const liveVerifySpy = spyFn(io.fetchLiveArtifactsFn);
  io.fetchLiveArtifactsFn = liveVerifySpy;
  const publishSpy = spyFn(io.publishClearanceRecordFn);
  io.publishClearanceRecordFn = publishSpy;

  const report = await runPublicationPipeline(FAKE_ENV_AUTOPUBLISH_ON, { topicSlug: TOPIC_SLUG, io });
  check('RETRY_AFTER_REVERIFY', 'live verification runs AGAIN, fresh, even though the manifest already had passed:true', liveVerifySpy.callCount === 1);
  check('RETRY_AFTER_REVERIFY', 'DB publish is attempted only after that fresh re-verify', publishSpy.callCount === 1);
  check('RETRY_AFTER_REVERIFY', 'reaches PUBLISHED', report.final_state === RUN_FINAL_STATE.PUBLISHED, JSON.stringify({ state: report.final_state, reason: report.exception_reason }));
}

// ---- Report ----
const tests = [
  testFullHappyPathReachesPublishedWithZeroModelCalls,
  testAutopublishOffPreparesAndOpensPrButNeverMergesOrPublishes,
  testExistingPrIsAdoptedNeverDuplicated,
  testPreparedArtifactDigestSurvivesAcrossRunsAndDriftFailsClosed,
  testFreshnessChangeBlocksPublication,
  testMovedPrHeadBlocksMerge,
  testUnexpectedDiffBlocksMerge,
  testMatchingClearanceRowResumesIdempotently,
  testConflictingClearanceRowFailsClosed,
  testMergeFailureBecomesPublishFailed,
  testDeploymentFailureTimeoutAndPreviewNotAcceptedAllFailClosed,
  testEveryLiveVerificationFailureBlocksDbPublish,
  testPostWriteMismatchNeverReportsFalsePublished,
  testAlreadyPublishedRunIsIdempotent,
  testResumesAtDeploymentWaitWhenAlreadyMergedButNotYetDeployed,
  testRetriesDbPublishOnlyAfterReVerifyingLivePage,
];
for (const t of tests) await t();

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
