// AIMT Education Operations v1 — orchestrator state-machine tests
// (scripts/education-operations-cycle.mjs). THE SHADOW CANARY: proves
// the full decision pipeline (topic selection -> intent planning ->
// synthesis -> writer -> reviewer -> SHADOW_CANDIDATE_READY) wires
// together correctly using injected mocks -- per the originating task's
// own instruction ("Do not call Anthropic merely to prove scheduler
// plumbing if fixtures/mocks can prove it"), NO live model call, NO
// live Supabase call, NO git/GitHub action anywhere in this file.
//
// EXCEPTION: the ROUTE-COLLISION-GUARD tests for prepareGeneratedArtifacts()
// (the "existing article file" / "existing Page Plan artifact" fixtures
// near the bottom of this file) deliberately pre-create ONE stale file
// each, to prove the real filesystem check refuses to overwrite it --
// every such test cleans up in a finally block, and none of them ever
// reaches an actual write (that's the whole point: the check fires
// before prepareGeneratedArtifacts() writes anything).
//
// Run: node tests/education-operations-cycle.test.mjs

import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runDecisionPipeline, checkWeeklyCap, isAutopublishEnabled, resolveMaxPagesPerWeek,
  parseArgs, runPersistClearanceAction, prepareGeneratedArtifacts, persistRunReport,
  educationArticlePathFromRoute,
  AUTOPUBLISH_ENV_VAR, DEFAULT_MAX_PAGES_PER_WEEK,
  isResearchGapLoopEnabled, RESEARCH_GAP_LOOP_ENV_VAR,
} from '../scripts/education-operations-cycle.mjs';
import { RUN_FINAL_STATE, MAX_EDUCATION_OPS_MODEL_CALLS_PER_RUN } from '../functions/_lib/education-ops/education-run-ledger.mjs';
import { FRESHNESS_STATE } from '../functions/_lib/education-ops/education-freshness-monitor.mjs';
import { EDUCATION_OPS_API_KEY_ENV_VAR } from '../functions/_lib/education-ops/education-ops-model-config.mjs';
import { RESUME_STAGE } from '../functions/_lib/education-ops/education-candidate-bundle.mjs';
import { validateEducationPagePlan } from '../functions/_lib/education-ops/education-page-plan-validator.mjs';
import { REVIEW_OUTCOME } from '../functions/_lib/education-ops/education-reviewer-validator.mjs';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const FAKE_ENV_WITH_CRED = { [EDUCATION_OPS_API_KEY_ENV_VAR]: 'fake-not-a-real-key', SUPABASE_URL: 'https://example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fake' };

/** Every test in this file runs through this wrapper so NONE of them
    ever hits a live Supabase endpoint for the (now-live-by-default)
    published-topic-state / weekly-count / freshness reads this file's
    own header comment promises never happens -- see the runtime-wiring
    correction that introduced these three live-by-default reads. Tests
    that specifically want to exercise the live-query failure path pass
    their own `publishedTopicSlugs`/`pagesPublishedThisWeek`/`fns`
    overrides straight through `runDecisionPipeline` instead of through
    this helper.

    loadCandidateBundleFn/writeCandidateBundleFn default to a no-op,
    always-empty pair here so the pre-existing (legacy) tests in this
    file -- none of which know about durable candidate bundles at all --
    never touch the REAL filesystem under research-import/education-ops/
    candidates/. Without this, two unrelated tests reusing the same
    topic_slug (most of this file uses "androgenetic-alopecia") could
    cross-contaminate each other via a real file one test left behind.
    The durable-candidate-resume-specific tests below override both with
    an in-memory Map-backed pair instead. */
function run(env, options = {}) {
  return runDecisionPipeline(env, {
    publishedTopicSlugs: [],
    pagesPublishedThisWeek: 0,
    ...options,
    fns: {
      checkFreshnessFn: async () => [],
      loadCandidateBundleFn: () => ({ found: false, bundle: null }),
      writeCandidateBundleFn: () => {},
      ...(options.fns || {}),
    },
  });
}

/** In-memory candidate-bundle store for the durable-candidate-resume
    tests below -- never touches the real filesystem. */
function makeInMemoryCandidateStore(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    loadCandidateBundleFn: (topicSlug) => (store.has(topicSlug) ? { found: true, bundle: store.get(topicSlug) } : { found: false, bundle: null }),
    writeCandidateBundleFn: (topicSlug, bundle) => { store.set(topicSlug, bundle); },
    store,
  };
}

function makeSource(id) { return { source_id: id, title: `S ${id}`, year: 2024, doi: `10.1/${id}`, evidence_type: 'systematic_review' }; }
function makeClaim(id, topic, sourceId, overrides = {}) { return { claim_id: id, source_id: sourceId, claim_type: 'finding', claim_text: `Finding ${id}.`, topics: [topic], verification_status: 'CLAIM_VERIFIED', use_status: 'provisional', ...overrides }; }

/** A healthy evidence pool for a single cluster candidate, shaped to
    trigger NEEDS_SYNTHESIS (a safety_conclusion claim present) and pass
    every evidence-completeness gate (2 sources, a limitation claim). */
function healthyPoolForSingleTopic(topic) {
  return {
    claims: [
      makeClaim(`${topic}-c1`, topic, `${topic}-s1`),
      makeClaim(`${topic}-c2`, topic, `${topic}-s2`, { claim_type: 'limitation', claim_text: `Limitation for ${topic}.` }),
      makeClaim(`${topic}-safety`, topic, `${topic}-s1`, { claim_type: 'safety_conclusion' }),
    ],
    sources: [makeSource(`${topic}-s1`), makeSource(`${topic}-s2`)],
  };
}

function fakeIntentResult(topicSlug) {
  return {
    ok: true, usage: { input_tokens: 100, output_tokens: 100 },
    output: {
      topic_slug: topicSlug, page_concept: `${topicSlug} Overview`, public_intent: `Explain ${topicSlug}.`,
      route_slug: topicSlug, in_scope_concepts: ['general presentation'], out_of_scope_concepts: ['diagnosis of an individual case', 'treatment or medication protocols'],
      practitioner_relevance: 'Relevant for practitioners.', cluster: 'hair-loss-shedding', risk_context: 'MODERATE: observational posture.',
    },
  };
}

function fakeSynthesizeFn(topicSlug, { modelCalls = 1 } = {}) {
  return async () => ({
    status: 'AUTO_READY', stage: 'initial', reason: 'validated',
    finalOutput: {
      topic_slug: topicSlug, page_concept: `${topicSlug} Overview`, recommended_disposition: 'AUTO_READY', confidence: 'high',
      page_scope: { include: ['x'], exclude: ['treatment'] },
      selected_claims: [{ claim_id: `${topicSlug}-c1`, role: 'core_finding', reason: 'ok' }, { claim_id: `${topicSlug}-c2`, role: 'limitation', reason: 'ok' }],
      excluded_claims: [{ claim_id: `${topicSlug}-safety`, reason_code: 'OTHER', reason: 'Out of scope for a general overview.', related_conflict_claim_ids: [] }],
      resolved_synthesis_signals: [], unresolved_issues: [],
      human_review_justification: { reason_code: 'NOT_APPLICABLE', reason: 'Not applicable', related_claim_ids: [] },
      public_framing: {
        core_points: [{ statement: `Finding ${topicSlug}-c1.`, supporting_claim_ids: [`${topicSlug}-c1`] }],
        limitations: [{ statement: `Limitation for ${topicSlug}.`, supporting_claim_ids: [`${topicSlug}-c2`] }],
        scope_note: 'Scope note.',
      },
    },
    // modelCalls is deliberately injectable here so orchestrator-level
    // tests can prove the run ledger reports the TRUE actual-call count
    // (up to 3 for Publication Editor alone) -- see the model-call-
    // ceiling correction.
    metrics: { model_calls: modelCalls, reconciliation_calls: 0, full_retries: 0, total_input_tokens: 500, total_output_tokens: 500, model_info: {} },
  });
}

function fakeWriterResult(topicSlug, clearedSnapshot) {
  const u = (kind, text, ids = [], stmts = []) => ({ kind, text, supporting_claim_ids: ids, source_statements: stmts });
  return {
    ok: true, usage: { input_tokens: 1000, output_tokens: 1000 },
    output: {
      topic_slug: topicSlug, cluster: 'hair-loss-shedding', route: `/education/hair-loss/${topicSlug}`,
      title: `${topicSlug} | AIMT`, meta_description: `About ${topicSlug}.`, h1: `${topicSlug} Overview`,
      answer_summary: u('VERBATIM', `Finding ${topicSlug}-c1.`, [`${topicSlug}-c1`], [`Finding ${topicSlug}-c1.`]),
      sections: [{ section_id: 'overview', heading: 'Overview', units: [
        u('FRAMING', 'This matters for practitioners.'),
        u('PARAPHRASE', `In plain terms, that is what the underlying research actually found for ${topicSlug}.`, [`${topicSlug}-c1`], [`Finding ${topicSlug}-c1.`]),
      ] }],
      scope_note: clearedSnapshot.scope_language.scope_note,
      limitations: [u('VERBATIM', `Limitation for ${topicSlug}.`, [`${topicSlug}-c2`], [`Limitation for ${topicSlug}.`])],
      key_takeaways: [u('VERBATIM', `Finding ${topicSlug}-c1.`, [`${topicSlug}-c1`], [`Finding ${topicSlug}-c1.`])],
      // NO sources/related_links here -- matching the real Education
      // Writer's contract (EDUCATION_WRITER_OUTPUT_JSON_SCHEMA), both
      // are attached deterministically by the orchestrator itself, from
      // clearedSnapshot.citation_map and trusted route data. See the
      // source/link-authority correction.
      visual_recommendation: { recommendation: 'NONE', rationale: 'Prose is sufficient here.' },
    },
  };
}

function fakePassingReviewResult() {
  return {
    ok: true, usage: { input_tokens: 800, output_tokens: 400 },
    output: {
      paraphrase_reviews: [], framing_reviews: [{ location: 'sections:overview:0', verdict: 'NON_FACTUAL', reason: 'Pure orientation.' }],
      voice_verdict: 'PASS', voice_reason: 'Reads as AIMT voice.', scope_verdict: 'PASS', scope_reason: 'In scope.',
    },
  };
}

// ---- FRAMING-removal repair fixtures (fakeWriterResult's sections[0]
// unit[0] is the ONE FRAMING unit these fixtures target) --------------
function fakeFramingCarriesScienceReviewResult() {
  return {
    ok: true, usage: { input_tokens: 800, output_tokens: 400 },
    output: {
      paraphrase_reviews: [],
      framing_reviews: [{ location: 'sections:overview:0', verdict: 'CARRIES_SCIENCE', reason: 'States a presentation pattern as fact.' }],
      voice_verdict: 'PASS', voice_reason: 'Reads as AIMT voice.', scope_verdict: 'PASS', scope_reason: 'In scope.',
    },
  };
}

/** A SUBSTANTIVE_FAIL that is NOT framing-only (a paraphrase drift) --
    used to prove a Reviewer retry that still fails routes to
    EDITORIAL_REVIEW, and that a non-repairable verdict never retries. */
function fakeParaphraseDriftReviewResult() {
  return {
    ok: true, usage: { input_tokens: 800, output_tokens: 400 },
    output: {
      paraphrase_reviews: [{ location: 'sections:overview:1', verdict: 'OUTSIDE_EVIDENCE', reason: 'Still drifting beyond the cleared evidence.' }],
      framing_reviews: [],
      voice_verdict: 'PASS', voice_reason: 'x', scope_verdict: 'PASS', scope_reason: 'x',
    },
  };
}

/** Returns a reviewFn that plays back one result per call (repeating the
    last entry if called more times than results.length) and tracks
    callCount, without needing a separate spyFn wrapper. */
function makeSequencedReviewFn(results) {
  let i = 0;
  const fn = async (...args) => {
    const entry = results[Math.min(i, results.length - 1)];
    i += 1;
    return typeof entry === 'function' ? entry(...args) : entry;
  };
  Object.defineProperty(fn, 'callCount', { get: () => i });
  return fn;
}

// ─────────────────────────────────────────────────────────────────────────
// Weekly cap
// ─────────────────────────────────────────────────────────────────────────
(function testWeeklyCapIsACeilingNotARequirement() {
  const underCap = checkWeeklyCap(0, 4);
  check('WEEKLY_CAP', 'zero published this week is within cap', underCap.withinCap);
  const atCap = checkWeeklyCap(4, 4);
  check('WEEKLY_CAP', 'exactly at cap is NOT within cap', !atCap.withinCap);
  check('WEEKLY_CAP', 'default max is 4/week', resolveMaxPagesPerWeek({}) === DEFAULT_MAX_PAGES_PER_WEEK);
  check('WEEKLY_CAP', 'env override is honored', resolveMaxPagesPerWeek({ AIMT_EDUCATION_MAX_PAGES_PER_WEEK: '7' }) === 7);
})();

async function testWeeklyCapBlocksTheWholeRun() {
  const report = await run(FAKE_ENV_WITH_CRED, { pagesPublishedThisWeek: 4 });
  check('WEEKLY_CAP_RUN', 'final_state is NO_OP_SUCCESS when the weekly cap is reached', report.final_state === RUN_FINAL_STATE.NO_OP_SUCCESS, report.final_state);
  check('WEEKLY_CAP_RUN', 'no topic selected', report.selected_topic === null);
  check('WEEKLY_CAP_RUN', 'stopped_before_model_stage is true (never even checked the credential)', report.stopped_before_model_stage === true);
  check('WEEKLY_CAP_RUN', 'pages_published_this_week/weekly_ceiling are recorded', report.pages_published_this_week === 4 && report.weekly_ceiling === DEFAULT_MAX_PAGES_PER_WEEK);
}

async function testWeeklyCapRuntimeThresholds() {
  const underCap = await run(FAKE_ENV_WITH_CRED, { pagesPublishedThisWeek: 0, fns: { fetchEvidenceFn: async () => ({ claims: [], sources: [] }) } });
  check('WEEKLY_CAP_THRESHOLDS', '0 this week is under cap (proceeds to selection)', underCap.final_state === RUN_FINAL_STATE.NO_OP_SUCCESS && underCap.selection_reason === 'NO_ELIGIBLE_TOPIC', JSON.stringify({ state: underCap.final_state, reason: underCap.selection_reason }));

  const oneUnderCap = await run(FAKE_ENV_WITH_CRED, { pagesPublishedThisWeek: DEFAULT_MAX_PAGES_PER_WEEK - 1, fns: { fetchEvidenceFn: async () => ({ claims: [], sources: [] }) } });
  check('WEEKLY_CAP_THRESHOLDS', 'max-1 this week is under cap (proceeds to selection)', oneUnderCap.final_state === RUN_FINAL_STATE.NO_OP_SUCCESS && oneUnderCap.selection_reason === 'NO_ELIGIBLE_TOPIC');

  const atCap = await run(FAKE_ENV_WITH_CRED, { pagesPublishedThisWeek: DEFAULT_MAX_PAGES_PER_WEEK });
  check('WEEKLY_CAP_THRESHOLDS', 'exactly at max is NO_OP_SUCCESS before any model call', atCap.final_state === RUN_FINAL_STATE.NO_OP_SUCCESS && atCap.selection_reason.includes('Weekly cap reached'));

  const overCap = await run(FAKE_ENV_WITH_CRED, { pagesPublishedThisWeek: DEFAULT_MAX_PAGES_PER_WEEK + 3 });
  check('WEEKLY_CAP_THRESHOLDS', 'over max is NO_OP_SUCCESS', overCap.final_state === RUN_FINAL_STATE.NO_OP_SUCCESS);
}

async function testWeeklyCapCountQueryFailureFailsClosed() {
  const report = await runDecisionPipeline(FAKE_ENV_WITH_CRED, {
    publishedTopicSlugs: [],
    fns: {
      checkFreshnessFn: async () => [],
      countPagesPublishedThisWeekFn: async () => { throw new Error('Supabase query failed (503).'); },
    },
  });
  check('WEEKLY_CAP_QUERY_FAILS_CLOSED', 'final_state is CONFIG_BLOCKED', report.final_state === RUN_FINAL_STATE.CONFIG_BLOCKED, report.final_state);
  check('WEEKLY_CAP_QUERY_FAILS_CLOSED', 'exception names the query failure', report.exception_reason.includes('Weekly publication count query failed'), report.exception_reason);
  check('WEEKLY_CAP_QUERY_FAILS_CLOSED', 'stopped_before_model_stage is true', report.stopped_before_model_stage === true);
}

async function testPublishedTopicQueryFailureFailsClosed() {
  const report = await runDecisionPipeline(FAKE_ENV_WITH_CRED, {
    fns: { fetchPublishedTopicSlugsFn: async () => { throw new Error('Supabase query failed (500).'); } },
  });
  check('PUBLISHED_TOPIC_QUERY_FAILS_CLOSED', 'final_state is CONFIG_BLOCKED', report.final_state === RUN_FINAL_STATE.CONFIG_BLOCKED, report.final_state);
  check('PUBLISHED_TOPIC_QUERY_FAILS_CLOSED', 'exception names the query failure', report.exception_reason.includes('Published-topic state query failed'), report.exception_reason);
  check('PUBLISHED_TOPIC_QUERY_FAILS_CLOSED', 'never falls back to the PUBLISHED_TOPIC_SLUGS constant', !report.published_topics || report.published_topics.length === 0, JSON.stringify(report.published_topics));
}

// ─────────────────────────────────────────────────────────────────────────
// AUTOPUBLISH gate
// ─────────────────────────────────────────────────────────────────────────
(function testAutopublishDefaultsOff() {
  check('AUTOPUBLISH_GATE', 'absent env is not enabled', isAutopublishEnabled({}) === false);
  check('AUTOPUBLISH_GATE', '"false" string is not enabled', isAutopublishEnabled({ [AUTOPUBLISH_ENV_VAR]: 'false' }) === false);
  check('AUTOPUBLISH_GATE', 'garbage value is not enabled', isAutopublishEnabled({ [AUTOPUBLISH_ENV_VAR]: 'yes' }) === false);
  check('AUTOPUBLISH_GATE', 'exactly "true" is enabled', isAutopublishEnabled({ [AUTOPUBLISH_ENV_VAR]: 'true' }) === true);
  check('AUTOPUBLISH_GATE', '"TRUE" (case-insensitive) is enabled', isAutopublishEnabled({ [AUTOPUBLISH_ENV_VAR]: 'TRUE' }) === true);
})();

// ─────────────────────────────────────────────────────────────────────────
// CONFIG_BLOCKED: missing dedicated credential, never a silent fallback
// -- and critically, per the runtime-wiring correction, the read-only
// part of the run (published topics, weekly cap, freshness, candidate
// selection) must survive a missing credential rather than being erased.
// ─────────────────────────────────────────────────────────────────────────
async function testMissingCredentialIsConfigBlocked() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  const freshnessStub = [{ topic: 'hair-cycle', state: FRESHNESS_STATE.FRESH, new_claim_ids: [], removed_claim_ids: [] }];
  const report = await run(
    { SUPABASE_URL: 'x', SUPABASE_SERVICE_ROLE_KEY: 'x' /* no ANTHROPIC_EDUCATION_WRITER_API_KEY */ },
    { publishedTopicSlugs: ['hair-cycle', 'telogen-effluvium'], fns: { fetchEvidenceFn: async () => pool, checkFreshnessFn: async () => freshnessStub } },
  );
  check('CONFIG_BLOCKED', 'final_state is CONFIG_BLOCKED', report.final_state === RUN_FINAL_STATE.CONFIG_BLOCKED, report.final_state);
  check('CONFIG_BLOCKED', 'exception names the missing credential', report.exception_reason.includes(EDUCATION_OPS_API_KEY_ENV_VAR), report.exception_reason);
  check('CONFIG_BLOCKED', 'credential_available is false', report.credential_available === false);
  check('CONFIG_BLOCKED', 'stopped_before_model_stage is true', report.stopped_before_model_stage === true);
  check('CONFIG_BLOCKED', 'the read-only selection result is PRESERVED, not erased', report.selected_topic === topicSlug, report.selected_topic);
  check('CONFIG_BLOCKED', 'the read-only published-topic state is PRESERVED', JSON.stringify(report.published_topics) === JSON.stringify(['hair-cycle', 'telogen-effluvium']));
  check('CONFIG_BLOCKED', 'the read-only freshness scan is PRESERVED', JSON.stringify(report.freshness_scan_summary) === JSON.stringify(freshnessStub));
}

// ─────────────────────────────────────────────────────────────────────────
// Full shadow canary: healthy evidence for one candidate -> AUTO_READY
// synthesis -> valid writer plan -> passing review -> SHADOW_CANDIDATE_READY
// ─────────────────────────────────────────────────────────────────────────
async function testFullShadowCanaryReachesCandidateReady() {
  const topicSlug = 'androgenetic-alopecia'; // an eligible, unpublished, MODERATE-risk cluster member
  const pool = healthyPoolForSingleTopic(topicSlug);

  const report = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFn(topicSlug),
      writeFn: async (env, { clearedSnapshot }) => fakeWriterResult(topicSlug, clearedSnapshot),
      reviewFn: async () => fakePassingReviewResult(),
    },
  });

  check('SHADOW_CANARY', 'final_state is SHADOW_CANDIDATE_READY', report.final_state === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY, JSON.stringify({ state: report.final_state, reason: report.exception_reason }));
  check('SHADOW_CANARY', 'selected the expected topic', report.selected_topic === topicSlug, report.selected_topic);
  check('SHADOW_CANARY', 'risk_tier is MODERATE', report.risk_tier === 'MODERATE', report.risk_tier);
  check('SHADOW_CANARY', 'planned_route is under the active cluster', report.planned_route === `/education/hair-loss/${topicSlug}`, report.planned_route);
  check('SHADOW_CANARY', 'publication_editor_result reports AUTO_READY', report.publication_editor_result && report.publication_editor_result.status === 'AUTO_READY');
  check('SHADOW_CANARY', 'writer_result reports valid', report.writer_result && report.writer_result.valid === true, JSON.stringify(report.writer_result));
  check('SHADOW_CANARY', 'review_result reports PASS', report.review_result && report.review_result.outcome === 'PASS', JSON.stringify(report.review_result));
  check('SHADOW_CANARY', 'model_calls aggregated across all four roles', report.model_calls.total_calls === 4, report.model_calls.total_calls);
  check('SHADOW_CANARY', 'no exception reason on a clean success', report.exception_reason === null);
  check('SHADOW_CANARY', 'credential_available is true', report.credential_available === true);
  check('SHADOW_CANARY', 'stopped_before_model_stage is false', report.stopped_before_model_stage === false);
}

async function testShadowCanaryStopsOnHighRiskPool() {
  // Force a HIGH-risk-only situation: fetch returns evidence ONLY for
  // controlled_topics that all resolve to HIGH baseline risk within the
  // registered cluster concepts -- since no cluster member is
  // registered HIGH by default, we instead prove the safety property at
  // the selection layer directly (already covered in
  // education-topic-selector.test.mjs's RISK_ROUTING fixture) and here
  // prove the ORCHESTRATOR correctly reports NO_OP_SUCCESS (never
  // crashes, never selects) when the fetched pool is simply empty --
  // the same fail-safe outcome a HIGH-risk-only or otherwise fully
  // ineligible pool produces.
  const report = await run(FAKE_ENV_WITH_CRED, { fns: { fetchEvidenceFn: async () => ({ claims: [], sources: [] }) } });
  check('NO_ELIGIBLE_STOPS_CLEANLY', 'final_state is NO_OP_SUCCESS for an empty/ineligible pool', report.final_state === RUN_FINAL_STATE.NO_OP_SUCCESS, report.final_state);
  check('NO_ELIGIBLE_STOPS_CLEANLY', 'no topic selected', report.selected_topic === null);
  check('NO_ELIGIBLE_STOPS_CLEANLY', 'zero model calls made (never reaches intent planning)', report.model_calls.total_calls === 0);
  check('NO_ELIGIBLE_STOPS_CLEANLY', 'stopped_before_model_stage is true', report.stopped_before_model_stage === true);
  check('NO_ELIGIBLE_STOPS_CLEANLY', 'credential_available is null (never even checked)', report.credential_available === null);
}

async function testHumanReviewSynthesisStopsCleanly() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  const report = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: async () => ({
        status: 'HUMAN_REVIEW', stage: 'initial', reason: 'model_declared_human_review',
        finalOutput: { human_review_justification: { reason_code: 'UNRESOLVED_CONTRADICTION', reason: 'Two sources genuinely disagree on a core finding for this topic.', related_claim_ids: [`${topicSlug}-c1`] } },
        metrics: { model_calls: 1, reconciliation_calls: 0, full_retries: 0, total_input_tokens: 100, total_output_tokens: 100, model_info: {} },
      }),
    },
  });
  check('HUMAN_REVIEW_STOPS', 'final_state is HUMAN_REVIEW', report.final_state === RUN_FINAL_STATE.HUMAN_REVIEW, report.final_state);
  check('HUMAN_REVIEW_STOPS', 'exception_reason carries the justification', report.exception_reason.includes('UNRESOLVED_CONTRADICTION') === false && report.exception_reason.includes('disagree'), report.exception_reason);
}

async function testEditorialReviewFailClosed() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  const report = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFn(topicSlug),
      writeFn: async (env, { clearedSnapshot }) => fakeWriterResult(topicSlug, clearedSnapshot),
      reviewFn: async () => ({
        ok: true, usage: { input_tokens: 1, output_tokens: 1 },
        output: {
          paraphrase_reviews: [], framing_reviews: [{ location: 'sections:overview:0', verdict: 'CARRIES_SCIENCE', reason: 'Smuggles in a mechanism claim.' }],
          voice_verdict: 'PASS', voice_reason: 'ok', scope_verdict: 'PASS', scope_reason: 'ok',
        },
      }),
    },
  });
  check('EDITORIAL_FAIL_CLOSED', 'final_state is EDITORIAL_REVIEW, never auto-published', report.final_state === RUN_FINAL_STATE.EDITORIAL_REVIEW, report.final_state);
  check('EDITORIAL_FAIL_CLOSED', 'review_result reports SUBSTANTIVE_FAIL', report.review_result && report.review_result.outcome === 'SUBSTANTIVE_FAIL');
}

async function testWriterPlanFailingDeterministicValidationRoutesToEditorialReview() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  const report = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFn(topicSlug),
      writeFn: async (env, { clearedSnapshot }) => {
        const badPlan = fakeWriterResult(topicSlug, clearedSnapshot);
        // Introduce a genuine grounding violation: an invented claim id.
        badPlan.output.sections[0].units[1] = { kind: 'PARAPHRASE', text: 'A fabricated statement.', supporting_claim_ids: ['invented-claim-id'], source_statements: ['x'] };
        return badPlan;
      },
      reviewFn: async () => fakePassingReviewResult(),
    },
  });
  check('WRITER_VALIDATION_FAIL', 'final_state is EDITORIAL_REVIEW', report.final_state === RUN_FINAL_STATE.EDITORIAL_REVIEW, report.final_state);
  check('WRITER_VALIDATION_FAIL', 'writer_result reports invalid', report.writer_result && report.writer_result.valid === false);
  check('WRITER_VALIDATION_FAIL', 'violations name the ungrounded claim', report.writer_result.violations.some((v) => v.includes('UNGROUNDED_CLAIM_ID')), JSON.stringify(report.writer_result.violations));
}

// ─────────────────────────────────────────────────────────────────────────
// NUMERIC-FIDELITY REPAIR LANE (full orchestrator path, category H): a
// deterministically-repairable numeric Writer defect is silently fixed
// and the Reviewer IS invoked; an unrepairable one is NOT repaired and
// the Reviewer is NEVER invoked -- EDITORIAL_REVIEW as before this lane
// existed. Both fixtures share a synthesizeFn whose public_framing
// carries one digit-bearing core_factual_point.
// ─────────────────────────────────────────────────────────────────────────
function fakeSynthesizeFnWithNumericCorePoint(topicSlug) {
  return async () => ({
    status: 'AUTO_READY', stage: 'initial', reason: 'validated',
    finalOutput: {
      topic_slug: topicSlug, page_concept: `${topicSlug} Overview`, recommended_disposition: 'AUTO_READY', confidence: 'high',
      page_scope: { include: ['x'], exclude: ['treatment'] },
      selected_claims: [{ claim_id: `${topicSlug}-c1`, role: 'core_finding', reason: 'ok' }, { claim_id: `${topicSlug}-c2`, role: 'limitation', reason: 'ok' }],
      excluded_claims: [{ claim_id: `${topicSlug}-safety`, reason_code: 'OTHER', reason: 'Out of scope for a general overview.', related_conflict_claim_ids: [] }],
      resolved_synthesis_signals: [], unresolved_issues: [],
      human_review_justification: { reason_code: 'NOT_APPLICABLE', reason: 'Not applicable', related_claim_ids: [] },
      public_framing: {
        // TWO core points sharing the same claim id: the original
        // non-numeric statement (so answer_summary/key_takeaways, which
        // still cite it verbatim, stay valid) PLUS one digit-bearing
        // statement -- the exact-match repair pool only ever considers
        // digit-bearing candidates, so this stays a single, unambiguous
        // repair target.
        core_points: [
          { statement: `Finding ${topicSlug}-c1.`, supporting_claim_ids: [`${topicSlug}-c1`] },
          { statement: 'Roughly 9% of follicles are affected at any given time.', supporting_claim_ids: [`${topicSlug}-c1`] },
        ],
        limitations: [{ statement: `Limitation for ${topicSlug}.`, supporting_claim_ids: [`${topicSlug}-c2`] }],
        scope_note: 'Scope note.',
      },
    },
    metrics: { model_calls: 1, reconciliation_calls: 0, full_retries: 0, total_input_tokens: 500, total_output_tokens: 500, model_info: {} },
  });
}

async function testRepairableNumericParaphraseIsFixedAndReviewerIsInvoked() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  let reviewFnCalled = false;
  const report = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFnWithNumericCorePoint(topicSlug),
      writeFn: async (env, { clearedSnapshot }) => {
        const result = fakeWriterResult(topicSlug, clearedSnapshot);
        // A numeric PARAPHRASE whose supporting_claim_ids maps EXACTLY
        // to the one digit-bearing cleared core_factual_point above --
        // the exact scenario the real GitHub Actions run hit.
        result.output.sections[0].units[1] = {
          kind: 'PARAPHRASE', text: 'About 9% of follicles show this at once.',
          supporting_claim_ids: [`${topicSlug}-c1`], source_statements: ['Roughly 9% of follicles are affected at any given time.'],
        };
        return result;
      },
      reviewFn: async () => { reviewFnCalled = true; return fakePassingReviewResult(); },
    },
  });
  check('NUMERIC_REPAIR_ORCHESTRATOR', 'final_state is SHADOW_CANDIDATE_READY -- the repair let the run proceed', report.final_state === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY, JSON.stringify({ state: report.final_state, reason: report.exception_reason }));
  check('NUMERIC_REPAIR_ORCHESTRATOR', 'the Reviewer WAS invoked after a successful repair', reviewFnCalled === true);
  check('NUMERIC_REPAIR_ORCHESTRATOR', 'writer_result reports valid', report.writer_result && report.writer_result.valid === true, JSON.stringify(report.writer_result));
  check('NUMERIC_REPAIR_ORCHESTRATOR', 'writer_result names the repaired location and repair type', report.writer_result.deterministic_repair
    && report.writer_result.deterministic_repair.attempted === true
    && report.writer_result.deterministic_repair.repaired_locations.includes('section:overview:1')
    && report.writer_result.deterministic_repair.repair_type === 'NUMERIC_TO_CLEARED_VERBATIM', JSON.stringify(report.writer_result));
  check('NUMERIC_REPAIR_ORCHESTRATOR', 'the repaired page (via __internal.plan) carries the exact cleared VERBATIM text', report.__internal.plan.sections[0].units[1].text === 'Roughly 9% of follicles are affected at any given time.' && report.__internal.plan.sections[0].units[1].kind === 'VERBATIM', JSON.stringify(report.__internal.plan.sections[0].units[1]));
}

async function testUnrepairableNumericParaphraseStaysEditorialReviewAndReviewerIsNotInvoked() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  let reviewFnCalled = false;
  const report = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFnWithNumericCorePoint(topicSlug),
      writeFn: async (env, { clearedSnapshot }) => {
        const result = fakeWriterResult(topicSlug, clearedSnapshot);
        // A numeric PARAPHRASE whose supporting_claim_ids maps to the
        // LIMITATION claim -- but the limitation's cleared statement
        // carries no digit at all, so zero candidates can ever match:
        // NOT_REPAIRABLE, must remain EDITORIAL_REVIEW.
        result.output.sections[0].units[1] = {
          kind: 'PARAPHRASE', text: 'About 9% of follicles show this at once.',
          supporting_claim_ids: [`${topicSlug}-c2`], source_statements: [`Limitation for ${topicSlug}.`],
        };
        return result;
      },
      reviewFn: async () => { reviewFnCalled = true; return fakePassingReviewResult(); },
    },
  });
  check('NUMERIC_REPAIR_ORCHESTRATOR', 'final_state remains EDITORIAL_REVIEW -- no unique cleared match exists', report.final_state === RUN_FINAL_STATE.EDITORIAL_REVIEW, report.final_state);
  check('NUMERIC_REPAIR_ORCHESTRATOR', 'the Reviewer was NEVER invoked for an unrepaired plan', reviewFnCalled === false);
  check('NUMERIC_REPAIR_ORCHESTRATOR', 'writer_result reports invalid', report.writer_result && report.writer_result.valid === false, JSON.stringify(report.writer_result));
  check('NUMERIC_REPAIR_ORCHESTRATOR', 'violations still name the original numeric-fidelity rule', report.writer_result.violations.some((v) => v.startsWith('UNSUPPORTED_NUMERIC_CLAIM')), JSON.stringify(report.writer_result.violations));
  check('NUMERIC_REPAIR_ORCHESTRATOR', 'writer_result names the unresolved location and the NO_UNIQUE_CLEARED_STATEMENT reason', report.writer_result.deterministic_repair
    && report.writer_result.deterministic_repair.attempted === true
    && report.writer_result.deterministic_repair.unresolved_locations.includes('section:overview:1')
    && report.writer_result.deterministic_repair.reason === 'NO_UNIQUE_CLEARED_STATEMENT', JSON.stringify(report.writer_result));
}

// ─────────────────────────────────────────────────────────────────────────
// Runtime published-topic state: a dynamically-injected published set
// (simulating "Page #3 just published") is excluded from selection with
// NO CODE CHANGE -- proving the orchestrator no longer trusts the
// PUBLISHED_TOPIC_SLUGS constant as operational truth.
// ─────────────────────────────────────────────────────────────────────────
async function testDynamicPublishedTopicExclusion() {
  const pool = healthyPoolForSingleTopic('androgenetic-alopecia');
  // Includes alopecia-areata too, on top of the "real" two published
  // pages plus a simulated newly-published Page #3 (androgenetic-alopecia)
  // -- this makes EVERY remaining cluster candidate (hair-loss,
  // shedding-vs-hair-loss) cannibalized by the union as well, so the
  // ONLY way this run can resolve to NO_OP_SUCCESS is if
  // androgenetic-alopecia really is excluded directly by the LIVE
  // (injected) set rather than the PUBLISHED_TOPIC_SLUGS constant, which
  // does not contain androgenetic-alopecia or alopecia-areata at all.
  const publishedTopicSlugs = ['hair-cycle', 'telogen-effluvium', 'androgenetic-alopecia', 'alopecia-areata'];
  const report = await run(FAKE_ENV_WITH_CRED, {
    publishedTopicSlugs,
    fns: {
      fetchEvidenceFn: async () => pool,
      // Two of these four slugs (androgenetic-alopecia, alopecia-areata)
      // have neither a legacy registry entry nor a real persisted Page
      // Plan artifact -- since the FAIL-CLOSED route-resolution
      // correction, that would otherwise (correctly) stop this run as
      // INFRA_REVIEW before it ever reached topic selection. This test
      // is specifically about topic selection's own dynamic-exclusion
      // behavior, so resolution itself is mocked to succeed here;
      // fail-closed resolution has its own dedicated test coverage
      // (testTrustedRouteResolutionFailureBecomesInfraReview below).
      resolveTrustedSiblingPagesFn: (slugs) => ({ ok: true, pages: slugs.map((s) => ({ topic_slug: s, route: `/education/hair-loss/${s}`, label: s })) }),
    },
  });
  check('DYNAMIC_PUBLISHED_EXCLUSION', 'a topic in the LIVE published set is excluded even though it is NOT in the PUBLISHED_TOPIC_SLUGS constant', report.final_state === RUN_FINAL_STATE.NO_OP_SUCCESS && report.selection_reason === 'NO_ELIGIBLE_TOPIC', JSON.stringify({ state: report.final_state, reason: report.selection_reason, exception: report.exception_reason }));
  check('DYNAMIC_PUBLISHED_EXCLUSION', 'published_topics reflects the injected live set, not the hardcoded constant', JSON.stringify(report.published_topics) === JSON.stringify(publishedTopicSlugs));
}

// ─────────────────────────────────────────────────────────────────────────
// Freshness is invoked by the real orchestrator on every run, and its
// result is retained independently of the new-page lane's own outcome
// (including when that lane is CONFIG_BLOCKED on a missing credential).
// ─────────────────────────────────────────────────────────────────────────
async function testFreshnessInvokedAndIndependentOfNewPageLane() {
  let freshnessCalledWithTopics = null;
  const freshnessStub = [
    { topic: 'hair-cycle', state: FRESHNESS_STATE.FRESH, new_claim_ids: [], removed_claim_ids: [] },
    { topic: 'telogen-effluvium', state: FRESHNESS_STATE.POTENTIAL_EVIDENCE_CHANGE, new_claim_ids: ['new-c1'], removed_claim_ids: [] },
  ];
  const report = await run(FAKE_ENV_WITH_CRED, {
    publishedTopicSlugs: ['hair-cycle', 'telogen-effluvium'],
    fns: {
      checkFreshnessFn: async (env, topics) => { freshnessCalledWithTopics = topics; return freshnessStub; },
      fetchEvidenceFn: async () => ({ claims: [], sources: [] }), // new-page lane resolves to NO_OP_SUCCESS
    },
  });
  check('FRESHNESS_INDEPENDENT', 'freshness ran against the live published set', JSON.stringify(freshnessCalledWithTopics) === JSON.stringify(['hair-cycle', 'telogen-effluvium']));
  check('FRESHNESS_INDEPENDENT', 'freshness_scan_summary is attached even though the new-page lane is a plain NO_OP_SUCCESS', JSON.stringify(report.freshness_scan_summary) === JSON.stringify(freshnessStub));
  check('FRESHNESS_INDEPENDENT', 'the new-page lane final_state is unaffected by a POTENTIAL_EVIDENCE_CHANGE freshness result', report.final_state === RUN_FINAL_STATE.NO_OP_SUCCESS, report.final_state);
}

// ─────────────────────────────────────────────────────────────────────────
// Corrected CLI command semantics: --publish now runs the production
// publish state machine (runPublicationPipeline() -- see
// tests/education-publication-pipeline.test.mjs for its full behavior);
// --persist-clearance remains the separate, simpler non-public-clearance
// write, still gated behind AUTOPUBLISH_ENABLED. Neither can ever mark a
// DB row status='published' without runPublicationPipeline's own
// merge/deploy/live-verify sequence completing first.
// ─────────────────────────────────────────────────────────────────────────
(function testParseArgsRecognizesBothFlags() {
  check('CLI_SEMANTICS', '--persist-clearance parses to mode "persist-clearance"', parseArgs(['--persist-clearance']).mode === 'persist-clearance');
  check('CLI_SEMANTICS', '--publish parses to mode "publish"', parseArgs(['--publish']).mode === 'publish');
  check('CLI_SEMANTICS', '--topic=<slug> is parsed alongside --publish', parseArgs(['--publish', '--topic=alopecia-areata']).topic === 'alopecia-areata');
  check('CLI_SEMANTICS', '--from-prepared=<path> is still parsed alongside either flag', parseArgs(['--persist-clearance', '--from-prepared=/tmp/x.json']).fromPrepared === '/tmp/x.json');
})();

async function testPersistClearanceRefusesWithoutAutopublishEnabled() {
  const outcome = await runPersistClearanceAction({}, { fromPreparedPath: '/tmp/does-not-matter.json' });
  check('CLI_SEMANTICS', '--persist-clearance refuses when AUTOPUBLISH is off', outcome.ran === false && outcome.ok === false);
  check('CLI_SEMANTICS', 'refusal reason names the env var', outcome.reason.includes(AUTOPUBLISH_ENV_VAR), outcome.reason);
}

async function testPersistClearanceRefusesWithoutFromPreparedPath() {
  const outcome = await runPersistClearanceAction({ [AUTOPUBLISH_ENV_VAR]: 'true' }, {});
  check('CLI_SEMANTICS', '--persist-clearance refuses without --from-prepared even when AUTOPUBLISH is on', outcome.ran === false && outcome.ok === false);
  check('CLI_SEMANTICS', 'refusal reason names --from-prepared', outcome.reason.includes('--from-prepared'), outcome.reason);
}

async function testNoCommandCanMarkStatusPublished() {
  // --publish: with AUTOPUBLISH off, runPublicationPipeline() never even
  // reaches a write-capable io function -- proven exhaustively in
  // tests/education-publication-pipeline.test.mjs (AUTOPUBLISH_GATE
  // fixture). Not re-proven here to avoid duplicating that suite.

  // --persist-clearance: publishPreparedArtifact() (education-synthesis-
  // cache.mjs) re-verifies the artifact's OWN integrity BEFORE ever
  // calling io.writeFn -- so even a malformed/tampered prepared artifact
  // (e.g. a fake one, as here) never reaches the write layer at all.
  // The positive path -- that a GENUINE, integrity-passing artifact's
  // written record carries status='ready_for_page_builder', never
  // 'published' (enforced independently by publication-clearance-
  // writer.mjs's assertWritableClearanceRecord()) -- is proven directly
  // by tests/education-synthesis-cache.test.mjs's ROUND_TRIP fixture.
  const fs = await import('node:fs');
  const path = await import('node:path');
  const os = await import('node:os');
  const tmpPath = path.join(os.tmpdir(), `edu-ops-test-prepared-${Date.now()}.json`);
  const fakePreparedArtifact = {
    topic_slug: 'x', record: { topic_slug: 'x', status: 'ready_for_page_builder', clearance_mode: 'AUTO_READY', generation_source_hash: 'not-a-real-matching-hash', publication_clearance: {} },
    prepared_at: new Date().toISOString(),
  };
  fs.writeFileSync(tmpPath, JSON.stringify(fakePreparedArtifact));
  let writeFnCalled = false;
  const outcome = await runPersistClearanceAction({ [AUTOPUBLISH_ENV_VAR]: 'true' }, {
    fromPreparedPath: tmpPath,
    io: { writeFn: async (record) => { writeFnCalled = true; return [{ ...record }]; } },
  });
  fs.unlinkSync(tmpPath);
  check('NO_COMMAND_MARKS_PUBLISHED', '--persist-clearance ran (attempted)', outcome.ran === true);
  check('NO_COMMAND_MARKS_PUBLISHED', 'a fake/integrity-failing artifact never reaches writeFn', writeFnCalled === false);
  check('NO_COMMAND_MARKS_PUBLISHED', 'the attempt is reported as failed, not silently accepted', outcome.result.ok === false, JSON.stringify(outcome.result));
}

// ─────────────────────────────────────────────────────────────────────────
// FAIL-CLOSED PUBLISHED-ROUTE RESOLUTION: research_public_pages says a
// topic is published, but if it can't be mapped to a trusted route
// (legacy registry or a valid persisted Page Plan artifact), the whole
// run must stop as INFRA_REVIEW -- never silently continue with an
// incomplete published-route set. Unit-level coverage of the resolution
// function itself lives in tests/education-published-route-resolution.test.mjs;
// these prove the ORCHESTRATOR actually wires the failure through.
// ─────────────────────────────────────────────────────────────────────────
async function testUnresolvablePublishedTopicBecomesInfraReviewBeforeAnyModelCall() {
  const report = await run(FAKE_ENV_WITH_CRED, {
    // hair-cycle is a real published topic with NO trusted route
    // resolution available in this test (fetchPublishedTopicSlugsFn is
    // bypassed via the publishedTopicSlugs override, but resolution
    // itself is exercised for real -- no resolveTrustedSiblingPagesFn
    // override here -- against a slug this test knows will fail the
    // artifact check, since no such artifact exists on disk).
    publishedTopicSlugs: ['androgenetic-alopecia'], // real cluster member, no legacy route, no real artifact
  });
  check('UNRESOLVABLE_PUBLISHED_TOPIC', 'final_state is INFRA_REVIEW', report.final_state === RUN_FINAL_STATE.INFRA_REVIEW, JSON.stringify({ state: report.final_state, reason: report.exception_reason }));
  check('UNRESOLVABLE_PUBLISHED_TOPIC', 'exception explains the DB/trusted-route disagreement', report.exception_reason.includes('Published DB state and trusted route/artifact state disagree'), report.exception_reason);
  check('UNRESOLVABLE_PUBLISHED_TOPIC', 'exception names the specific unresolvable slug', report.exception_reason.includes('UNRESOLVABLE_PUBLISHED_ROUTE:androgenetic-alopecia'), report.exception_reason);
  check('UNRESOLVABLE_PUBLISHED_TOPIC', 'stopped_before_model_stage is true', report.stopped_before_model_stage === true);
  check('UNRESOLVABLE_PUBLISHED_TOPIC', 'credential_available is null (never even checked)', report.credential_available === null);
  check('UNRESOLVABLE_PUBLISHED_TOPIC', 'zero model calls of any kind', report.model_calls.actual_model_call_count === 0, report.model_calls.actual_model_call_count);
  check('UNRESOLVABLE_PUBLISHED_TOPIC', 'the LIVE published_topics is still preserved on the report', JSON.stringify(report.published_topics) === JSON.stringify(['androgenetic-alopecia']));
}

async function testDuplicateResolvedRouteAlsoBecomesInfraReview() {
  const report = await runDecisionPipeline(FAKE_ENV_WITH_CRED, {
    publishedTopicSlugs: ['hair-cycle', 'telogen-effluvium'],
    fns: {
      checkFreshnessFn: async () => [],
      resolveTrustedSiblingPagesFn: () => ({
        ok: false,
        violations: ['DUPLICATE_PUBLISHED_ROUTE:/education/hair-loss/hair-growth-cycle:hair-cycle,telogen-effluvium'],
      }),
    },
  });
  check('DUPLICATE_ROUTE_END_TO_END', 'final_state is INFRA_REVIEW', report.final_state === RUN_FINAL_STATE.INFRA_REVIEW, report.final_state);
  check('DUPLICATE_ROUTE_END_TO_END', 'exception names the duplicate-route rule', report.exception_reason.includes('DUPLICATE_PUBLISHED_ROUTE'), report.exception_reason);
}

// ─────────────────────────────────────────────────────────────────────────
// DYNAMIC-INTENT BRIDGE HARDENING: the real GitHub Actions shadow-run
// failure this correction fixes crashed main() BEFORE persistRunReport()
// ever ran, because the Publication Editor bridge (prepareTopicArtifact/
// runSynthesisPipeline) threw an uncaught exception instead of returning
// a governed result. runDecisionPipeline() must now catch any such
// THROWN exception and resolve to a normal, persistable run report --
// never let it propagate. A governed model OUTCOME (HUMAN_REVIEW,
// SYNTHESIS_FAILED) is a completely different code path and must NOT be
// affected by this change (covered by testHumanReviewSynthesisStopsCleanly
// and testEditorialReviewFailClosed elsewhere in this file, both still
// passing unchanged).
// ─────────────────────────────────────────────────────────────────────────
async function testThrownSynthesisExceptionBecomesGovernedInfraReview() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  let report;
  let threw = false;
  try {
    report = await run(FAKE_ENV_WITH_CRED, {
      fns: {
        fetchEvidenceFn: async () => pool,
        planIntentFn: async () => fakeIntentResult(topicSlug),
        // Simulates the EXACT real failure: an unregistered page
        // synthesis intent throwing a plain Error, uncaught, from deep
        // inside the Publication Editor bridge.
        synthesizeFn: async () => { throw new Error(`No page synthesis intent registered for "${topicSlug}". Publication Editor v2 currently has registered intent for: hair-cycle, telogen-effluvium.`); },
      },
    });
  } catch (_e) {
    threw = true;
  }
  check('THROWN_SYNTHESIS_EXCEPTION', 'runDecisionPipeline never lets the exception propagate', !threw);
  check('THROWN_SYNTHESIS_EXCEPTION', 'final_state is INFRA_REVIEW (not a crash, not silently NO_OP_SUCCESS)', report && report.final_state === RUN_FINAL_STATE.INFRA_REVIEW, report && report.final_state);
  check('THROWN_SYNTHESIS_EXCEPTION', 'exception_reason names the real thrown message', report && report.exception_reason.includes('No page synthesis intent registered'), report && report.exception_reason);
  check('THROWN_SYNTHESIS_EXCEPTION', 'selected_topic is preserved', report && report.selected_topic === topicSlug);
  check('THROWN_SYNTHESIS_EXCEPTION', 'candidate_topics ranking is preserved', report && Array.isArray(report.candidate_topics) && report.candidate_topics.length > 0, report && JSON.stringify(report.candidate_topics));
  check('THROWN_SYNTHESIS_EXCEPTION', 'published_topics is preserved', report && Array.isArray(report.published_topics));
  check('THROWN_SYNTHESIS_EXCEPTION', 'the already-known intent_planner model call is preserved', report && report.model_calls.actual_model_call_count === 1, report && report.model_calls.actual_model_call_count);

  // "run report can be persisted" -- proven for real, not just assumed.
  const reportPath = persistRunReport(report);
  check('THROWN_SYNTHESIS_EXCEPTION', 'the governed report can actually be persisted to disk', existsSync(reportPath));
  const onDisk = JSON.parse(readFileSync(reportPath, 'utf8'));
  check('THROWN_SYNTHESIS_EXCEPTION', 'the persisted report round-trips correctly', onDisk.final_state === RUN_FINAL_STATE.INFRA_REVIEW);
  unlinkSync(reportPath);
}

async function testThrownConfigErrorClassifiesAsConfigBlocked() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  const report = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: async () => {
        const err = new Error('PUBLICATION_EDITOR_SYNTHESIS_MODEL override is not a registered model.');
        err.name = 'PublicationEditorModelConfigError';
        throw err;
      },
    },
  });
  check('THROWN_CONFIG_ERROR', 'a clearly-configuration-shaped thrown error classifies as CONFIG_BLOCKED, not INFRA_REVIEW', report.final_state === RUN_FINAL_STATE.CONFIG_BLOCKED, report.final_state);
  check('THROWN_CONFIG_ERROR', 'exception_reason names the real error', report.exception_reason.includes('not a registered model'), report.exception_reason);
}

async function testGovernedHumanReviewOutcomeIsUnaffectedByTheThrowGuard() {
  // A governed HUMAN_REVIEW (a normal, tagged, non-throwing result) must
  // still resolve to HUMAN_REVIEW, never get reclassified as INFRA_REVIEW
  // by the new try/catch -- the catch only ever sees a THROWN exception.
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  const report = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: async () => ({
        status: 'HUMAN_REVIEW', stage: 'initial', reason: 'model_declared_human_review',
        finalOutput: { human_review_justification: { reason_code: 'UNRESOLVED_CONTRADICTION', reason: 'Two sources genuinely disagree.', related_claim_ids: [`${topicSlug}-c1`] } },
        metrics: { model_calls: 1, reconciliation_calls: 0, full_retries: 0, total_input_tokens: 100, total_output_tokens: 100, model_info: {} },
      }),
    },
  });
  check('THROW_GUARD_DOES_NOT_AFFECT_GOVERNED_OUTCOMES', 'a real (non-thrown) HUMAN_REVIEW result is unaffected', report.final_state === RUN_FINAL_STATE.HUMAN_REVIEW, report.final_state);
}

// ─────────────────────────────────────────────────────────────────────────
// ROUTE-COLLISION CORRECTION: a planner choosing a route_slug that
// matches a CURRENTLY LIVE page must fail cheaply (before spending a
// synthesis/writer/reviewer call), and a writer disagreeing with the
// orchestrator-computed route must fail too -- both as INFRA_REVIEW,
// never silently accepted, never merely EDITORIAL_REVIEW (this is an
// architecture-safety class of failure, not a content-quality one).
// ─────────────────────────────────────────────────────────────────────────
async function testPlannerChoosingExistingPublishedSlugFailsAsInfraReview() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  const report = await run(FAKE_ENV_WITH_CRED, {
    publishedTopicSlugs: ['hair-cycle', 'telogen-effluvium'], // resolves via the REAL Page Builder route registry
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => {
        const base = fakeIntentResult(topicSlug);
        // The planner chooses a route_slug matching telogen-effluvium's
        // REAL, live route -- for a completely different topic.
        return { ...base, output: { ...base.output, route_slug: 'telogen-effluvium' } };
      },
    },
  });
  check('ROUTE_COLLISION_PLANNER', 'final_state is INFRA_REVIEW', report.final_state === RUN_FINAL_STATE.INFRA_REVIEW, JSON.stringify({ state: report.final_state, reason: report.exception_reason }));
  // MULTI-CLUSTER REGISTRY BOUNDARY: the planner no longer chooses a
  // route at all -- a route_slug other than the registry's is rejected
  // before the route is even computed (stronger than the collision
  // guard it used to reach; that guard is still covered in
  // education-route-guard.test.mjs and
  // education-multicluster-publication.test.mjs).
  check('ROUTE_COLLISION_PLANNER', 'exception names the registry route rule', report.exception_reason.includes('ROUTE_SLUG_NOT_REGISTERED'), report.exception_reason);
  check('ROUTE_COLLISION_PLANNER', 'the colliding live route is never computed as this page\'s route', !report.exception_reason.includes('ROUTE_COLLIDES_WITH_PUBLISHED_PAGE'), report.exception_reason);
  check('ROUTE_COLLISION_PLANNER', 'caught BEFORE any synthesis/writer/reviewer call -- only the intent planner call happened', report.model_calls.actual_model_call_count === 1, report.model_calls.actual_model_call_count);
}

async function testWriterPlanRouteMismatchFailsAsInfraReviewNotEditorialReview() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  const report = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFn(topicSlug),
      writeFn: async (env, { clearedSnapshot }) => {
        const result = fakeWriterResult(topicSlug, clearedSnapshot);
        // The writer's own `route` field disagrees with the
        // orchestrator-computed route -- otherwise a perfectly valid plan.
        result.output.route = '/education/hair-loss/a-totally-different-route';
        return result;
      },
      reviewFn: async () => fakePassingReviewResult(),
    },
  });
  check('ROUTE_MISMATCH_WRITER', 'final_state is INFRA_REVIEW, not EDITORIAL_REVIEW', report.final_state === RUN_FINAL_STATE.INFRA_REVIEW, report.final_state);
  check('ROUTE_MISMATCH_WRITER', 'violations name the route mismatch', report.writer_result.violations.some((v) => v.startsWith('PLAN_ROUTE_MISMATCH')), JSON.stringify(report.writer_result.violations));
}

async function testNormalUnusedRoutePassesEndToEnd() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  const report = await run(FAKE_ENV_WITH_CRED, {
    publishedTopicSlugs: ['hair-cycle', 'telogen-effluvium'],
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFn(topicSlug),
      writeFn: async (env, { clearedSnapshot }) => fakeWriterResult(topicSlug, clearedSnapshot),
      reviewFn: async () => fakePassingReviewResult(),
    },
  });
  check('NORMAL_ROUTE_PASSES', 'a genuinely unused route reaches SHADOW_CANDIDATE_READY', report.final_state === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY, JSON.stringify({ state: report.final_state, reason: report.exception_reason }));
  check('NORMAL_ROUTE_PASSES', 'sources came from the cleared snapshot, not the (now-nonexistent) model field', report.__internal.plan.sources.length > 0);
  check('NORMAL_ROUTE_PASSES', 'related_links include the cluster hub and the two real published siblings', ['/education/hair-loss', '/education/hair-loss/hair-growth-cycle', '/education/hair-loss/telogen-effluvium'].every((href) => report.__internal.plan.related_links.some((l) => l.href === href)), JSON.stringify(report.__internal.plan.related_links));
}

// ─────────────────────────────────────────────────────────────────────────
// MODEL-CALL CEILING: the run ledger reports the TRUE actual-call count
// (max 6), never "4 conceptual roles" -- proven end-to-end, not just at
// the run-ledger unit level.
// ─────────────────────────────────────────────────────────────────────────
async function testModelCallLedgerReportsFourWhenPublicationEditorMakesOneCall() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  const report = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFn(topicSlug, { modelCalls: 1 }),
      writeFn: async (env, { clearedSnapshot }) => fakeWriterResult(topicSlug, clearedSnapshot),
      reviewFn: async () => fakePassingReviewResult(),
    },
  });
  check('LEDGER_FOUR_CALLS', 'reaches SHADOW_CANDIDATE_READY', report.final_state === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY, report.final_state);
  check('LEDGER_FOUR_CALLS', 'total_roles_invoked is 4', report.model_calls.total_roles_invoked === 4, report.model_calls.total_roles_invoked);
  check('LEDGER_FOUR_CALLS', 'actual_model_call_count is 4 (1+1+1+1)', report.model_calls.actual_model_call_count === 4, report.model_calls.actual_model_call_count);
}

async function testModelCallLedgerReportsSixWhenPublicationEditorMakesThreeCalls() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  const report = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFn(topicSlug, { modelCalls: 3 }), // worst case: initial + reconciliation + full retry
      writeFn: async (env, { clearedSnapshot }) => fakeWriterResult(topicSlug, clearedSnapshot),
      reviewFn: async () => fakePassingReviewResult(),
    },
  });
  check('LEDGER_SIX_CALLS', 'reaches SHADOW_CANDIDATE_READY', report.final_state === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY, report.final_state);
  check('LEDGER_SIX_CALLS', 'total_roles_invoked is STILL only 4 (roles, not calls)', report.model_calls.total_roles_invoked === 4);
  check('LEDGER_SIX_CALLS', 'actual_model_call_count is the TRUE 6 (1+3+1+1), never the conceptual 4', report.model_calls.actual_model_call_count === 6, report.model_calls.actual_model_call_count);
}

async function testExceedingTheCeilingCrashesRatherThanSilentlyMisreporting() {
  // Simulates an architecture change that would push Publication Editor
  // beyond its own documented bound (4 calls instead of <=3) -- the run
  // ledger's own hard ceiling (buildRunReport(), education-run-ledger.mjs)
  // must refuse to produce a report at all rather than silently reporting
  // a 7-call run as if it were normal. This proves the two layers
  // (orchestrator + ledger) are actually wired together, not just each
  // separately unit-tested.
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  let threw = false;
  let message = '';
  try {
    await run(FAKE_ENV_WITH_CRED, {
      fns: {
        fetchEvidenceFn: async () => pool,
        planIntentFn: async () => fakeIntentResult(topicSlug),
        synthesizeFn: fakeSynthesizeFn(topicSlug, { modelCalls: 4 }), // beyond Publication Editor's own documented bound of 3
        writeFn: async (env, { clearedSnapshot }) => fakeWriterResult(topicSlug, clearedSnapshot),
        reviewFn: async () => fakePassingReviewResult(),
      },
    });
  } catch (e) {
    threw = true;
    message = e.message;
  }
  check('EXCEEDS_CEILING_END_TO_END', 'the run fails closed (throws) rather than reporting a 7-call run as SHADOW_CANDIDATE_READY', threw);
  check('EXCEEDS_CEILING_END_TO_END', 'the error names the ceiling', message.includes('6'), message);
}

// ─────────────────────────────────────────────────────────────────────────
// FILE-EXISTENCE COLLISION GUARDS (prepareGeneratedArtifacts): checked
// BEFORE any write. Each test pre-creates exactly ONE stale file to
// prove the collision, and cleans it up in a finally block regardless
// of outcome.
// ─────────────────────────────────────────────────────────────────────────
async function shadowCandidateReadyReportFor(topicSlug) {
  const pool = healthyPoolForSingleTopic(topicSlug);
  return run(FAKE_ENV_WITH_CRED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFn(topicSlug),
      writeFn: async (env, { clearedSnapshot }) => fakeWriterResult(topicSlug, clearedSnapshot),
      reviewFn: async () => fakePassingReviewResult(),
    },
  });
}

async function testPrepareRefusesToOverwriteAnExistingArticleFile() {
  const topicSlug = 'alopecia-areata';
  const report = await shadowCandidateReadyReportFor(topicSlug);
  if (report.final_state !== RUN_FINAL_STATE.SHADOW_CANDIDATE_READY) {
    check('PREPARE_ARTICLE_COLLISION', 'precondition: reached SHADOW_CANDIDATE_READY', false, JSON.stringify({ state: report.final_state, reason: report.exception_reason }));
    return;
  }
  // MUST match prepareGeneratedArtifacts()'s OWN path construction
  // (educationArticlePathFromRoute) -- a hand-rolled `education${route}.html`
  // template here computes a DIFFERENT (doubled education/education/...)
  // path than the function under test actually checks/writes, which
  // silently defeats this precondition and lets a real write through
  // uncleaned. See the "Fix Education publish article path" correction.
  const articlePath = path.join(REPO_ROOT, educationArticlePathFromRoute(report.__internal.route));
  if (existsSync(articlePath)) {
    check('PREPARE_ARTICLE_COLLISION', 'precondition: no real article already exists at this route (never touch real content)', false, articlePath);
    return;
  }
  mkdirSync(path.dirname(articlePath), { recursive: true });
  writeFileSync(articlePath, '<html>a stale file from a prior, never-merged --prepare run</html>');
  try {
    let threw = false;
    let message = '';
    try {
      prepareGeneratedArtifacts(report);
    } catch (e) {
      threw = true;
      message = e.message;
    }
    check('PREPARE_ARTICLE_COLLISION', 'refuses (throws) rather than overwriting', threw);
    check('PREPARE_ARTICLE_COLLISION', 'names it as an INFRA_REVIEW-class problem', message.includes('INFRA_REVIEW'), message);
    check('PREPARE_ARTICLE_COLLISION', 'the stale file is untouched (still the original content)', readFileSync(articlePath, 'utf8').includes('stale file from a prior'));
  } finally {
    unlinkSync(articlePath);
  }
}

async function testPrepareRefusesToOverwriteAnExistingPagePlanArtifact() {
  const topicSlug = 'alopecia-areata';
  const report = await shadowCandidateReadyReportFor(topicSlug);
  if (report.final_state !== RUN_FINAL_STATE.SHADOW_CANDIDATE_READY) {
    check('PREPARE_PLAN_ARTIFACT_COLLISION', 'precondition: reached SHADOW_CANDIDATE_READY', false, JSON.stringify({ state: report.final_state, reason: report.exception_reason }));
    return;
  }
  const planArtifactPath = path.join(REPO_ROOT, 'functions/_data/education-page-plans', `${topicSlug}.json`);
  if (existsSync(planArtifactPath)) {
    check('PREPARE_PLAN_ARTIFACT_COLLISION', 'precondition: no real Page Plan artifact already exists for this topic', false, planArtifactPath);
    return;
  }
  mkdirSync(path.dirname(planArtifactPath), { recursive: true });
  writeFileSync(planArtifactPath, JSON.stringify({ stale: true }));
  try {
    let threw = false;
    let message = '';
    try {
      prepareGeneratedArtifacts(report);
    } catch (e) {
      threw = true;
      message = e.message;
    }
    check('PREPARE_PLAN_ARTIFACT_COLLISION', 'refuses (throws) rather than overwriting', threw);
    check('PREPARE_PLAN_ARTIFACT_COLLISION', 'names it as an INFRA_REVIEW-class problem', message.includes('INFRA_REVIEW'), message);
    // Also proves the article file was never written either -- the
    // artifact-existence check runs before EITHER write, not just its own.
    check('PREPARE_PLAN_ARTIFACT_COLLISION', 'the article file was never written for this run', !existsSync(path.join(REPO_ROOT, educationArticlePathFromRoute(report.__internal.route))));
  } finally {
    unlinkSync(planArtifactPath);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// DURABLE CANDIDATE PERSISTENCE + RESUME (education-candidate-bundle.mjs
// wired into runDecisionPipeline). THE FIX: real GitHub Actions Run #3
// selected alopecia-areata, Publication Editor returned AUTO_READY, the
// Writer ran, and deterministic validation stopped on a numeric defect
// (EDITORIAL_REVIEW). Run #4 selected the SAME topic and Publication
// Editor was invoked AGAIN from scratch -- nondeterministically
// returning SYNTHESIS_FAILED this time. These tests prove a valid, FRESH
// candidate is durably reused instead, at every resumable stage, and
// that a corrupt/stale/malformed candidate never resumes and never
// silently blocks or regenerates in an unsafe way.
// ─────────────────────────────────────────────────────────────────────────

function spyFn(realFn) {
  const spy = (...args) => { spy.callCount += 1; return realFn(...args); };
  spy.callCount = 0;
  return spy;
}

/** One full, successful pipeline run against a fresh in-memory candidate
    store -- the "Run A" setup step most resume tests below build on. */
async function runFullSuccessfulPipeline(topicSlug, pool, store, fnsOverrides = {}) {
  return run(FAKE_ENV_WITH_CRED, {
    fns: {
      loadCandidateBundleFn: store.loadCandidateBundleFn, writeCandidateBundleFn: store.writeCandidateBundleFn,
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFn(topicSlug),
      writeFn: async (env, { clearedSnapshot }) => fakeWriterResult(topicSlug, clearedSnapshot),
      reviewFn: async () => fakePassingReviewResult(),
      ...fnsOverrides,
    },
  });
}

async function testResumeAtNeedsWriterSkipsIntentPlannerAndPublicationEditor() {
  const topicSlug = 'androgenetic-alopecia';
  const store = makeInMemoryCandidateStore();
  const pool = healthyPoolForSingleTopic(topicSlug);

  // Run A: Publication Editor succeeds, but the Writer's OWN call fails
  // (CONFIG_BLOCKED) -- the durable bundle must already be persisted at
  // PE-only (NEEDS_WRITER) by the time this run returns.
  const runA = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      loadCandidateBundleFn: store.loadCandidateBundleFn, writeCandidateBundleFn: store.writeCandidateBundleFn,
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFn(topicSlug),
      writeFn: async () => ({ ok: false, reason: 'simulated Writer outage' }),
    },
  });
  check('RESUME_AT_WRITER', 'Run A reaches CONFIG_BLOCKED at the Writer call', runA.final_state === RUN_FINAL_STATE.CONFIG_BLOCKED, runA.final_state);
  check('RESUME_AT_WRITER', 'Run A already persisted a candidate bundle (PE succeeded)', store.store.has(topicSlug));
  check('RESUME_AT_WRITER', 'the persisted bundle has no page_plan yet', store.store.get(topicSlug).page_plan === null);

  // Run B: Intent Planner and Publication Editor must NEVER be called
  // again -- only the Writer (and, since it now succeeds, the Reviewer).
  const planIntentSpy = spyFn(async () => fakeIntentResult(topicSlug));
  const synthesizeSpy = spyFn(fakeSynthesizeFn(topicSlug));
  const runB = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      loadCandidateBundleFn: store.loadCandidateBundleFn, writeCandidateBundleFn: store.writeCandidateBundleFn,
      fetchEvidenceFn: async () => pool,
      planIntentFn: planIntentSpy,
      synthesizeFn: synthesizeSpy,
      writeFn: async (env, { clearedSnapshot }) => fakeWriterResult(topicSlug, clearedSnapshot),
      reviewFn: async () => fakePassingReviewResult(),
    },
  });
  check('RESUME_AT_WRITER', 'Intent Planner was never called on resume', planIntentSpy.callCount === 0);
  check('RESUME_AT_WRITER', 'Publication Editor was never called on resume', synthesizeSpy.callCount === 0);
  check('RESUME_AT_WRITER', 'candidate_resume reports found+reused', runB.candidate_resume.found === true && runB.candidate_resume.reused === true);
  check('RESUME_AT_WRITER', 'candidate_resume reports resumed_from_stage NEEDS_WRITER', runB.candidate_resume.resumed_from_stage === RESUME_STAGE.NEEDS_WRITER, runB.candidate_resume.resumed_from_stage);
  check('RESUME_AT_WRITER', 'final_state reaches SHADOW_CANDIDATE_READY', runB.final_state === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY, JSON.stringify({ state: runB.final_state, reason: runB.exception_reason }));
  check('RESUME_AT_WRITER', 'only 2 model calls this run (writer + reviewer, never re-deriving intent/PE)', runB.model_calls.total_calls === 2, runB.model_calls.total_calls);
}

async function testResumeAtNeedsReviewerSkipsPublicationEditorAndWriter() {
  const topicSlug = 'androgenetic-alopecia';
  const store = makeInMemoryCandidateStore();
  const pool = healthyPoolForSingleTopic(topicSlug);

  const runA = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      loadCandidateBundleFn: store.loadCandidateBundleFn, writeCandidateBundleFn: store.writeCandidateBundleFn,
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFn(topicSlug),
      writeFn: async (env, { clearedSnapshot }) => fakeWriterResult(topicSlug, clearedSnapshot),
      reviewFn: async () => ({ ok: false, reason: 'simulated Reviewer outage' }),
    },
  });
  check('RESUME_AT_REVIEWER', 'Run A reaches CONFIG_BLOCKED at the Reviewer call', runA.final_state === RUN_FINAL_STATE.CONFIG_BLOCKED, runA.final_state);
  check('RESUME_AT_REVIEWER', 'the persisted bundle already has a valid page_plan', store.store.get(topicSlug).page_plan !== null && store.store.get(topicSlug).writer_validation.valid === true);

  const planIntentSpy = spyFn(async () => fakeIntentResult(topicSlug));
  const synthesizeSpy = spyFn(fakeSynthesizeFn(topicSlug));
  const writeSpy = spyFn(async (env, { clearedSnapshot }) => fakeWriterResult(topicSlug, clearedSnapshot));
  const runB = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      loadCandidateBundleFn: store.loadCandidateBundleFn, writeCandidateBundleFn: store.writeCandidateBundleFn,
      fetchEvidenceFn: async () => pool,
      planIntentFn: planIntentSpy, synthesizeFn: synthesizeSpy, writeFn: writeSpy,
      reviewFn: async () => fakePassingReviewResult(),
    },
  });
  check('RESUME_AT_REVIEWER', 'Intent Planner never called', planIntentSpy.callCount === 0);
  check('RESUME_AT_REVIEWER', 'Publication Editor never called', synthesizeSpy.callCount === 0);
  check('RESUME_AT_REVIEWER', 'Writer never called', writeSpy.callCount === 0);
  check('RESUME_AT_REVIEWER', 'resumed_from_stage is NEEDS_REVIEWER', runB.candidate_resume.resumed_from_stage === RESUME_STAGE.NEEDS_REVIEWER, runB.candidate_resume.resumed_from_stage);
  check('RESUME_AT_REVIEWER', 'final_state reaches SHADOW_CANDIDATE_READY', runB.final_state === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY, JSON.stringify({ state: runB.final_state, reason: runB.exception_reason }));
  check('RESUME_AT_REVIEWER', 'only 1 model call this run (reviewer only)', runB.model_calls.total_calls === 1, runB.model_calls.total_calls);
}

async function testResumeAtReadyForPrepareMakesZeroModelCallsAndNeverErasesAValidFreshCandidate() {
  const topicSlug = 'androgenetic-alopecia';
  const store = makeInMemoryCandidateStore();
  const pool = healthyPoolForSingleTopic(topicSlug);

  const runA = await runFullSuccessfulPipeline(topicSlug, pool, store);
  check('RESUME_READY_FOR_PREPARE', 'Run A reaches SHADOW_CANDIDATE_READY', runA.final_state === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY, JSON.stringify({ state: runA.final_state, reason: runA.exception_reason }));

  const planIntentSpy = spyFn(async () => fakeIntentResult(topicSlug));
  // A synthesizeFn that WOULD fail if ever invoked -- proves Publication
  // Editor cannot be re-triggered for an already-valid FRESH candidate,
  // even to nondeterministically produce a worse outcome (the exact
  // Run #3 -> Run #4 regression this feature fixes: a later failed
  // synthesis must never replace an existing valid FRESH candidate).
  const synthesizeSpy = spyFn(async () => ({ status: 'SYNTHESIS_FAILED', stage: 'initial', reason: 'unresolved_mechanical_or_accounting_violation', finalOutput: null, metrics: { model_calls: 1, reconciliation_calls: 0, full_retries: 0, total_input_tokens: 1, total_output_tokens: 1, model_info: {} } }));
  const writeSpy = spyFn(async (env, { clearedSnapshot }) => fakeWriterResult(topicSlug, clearedSnapshot));
  const reviewSpy = spyFn(async () => fakePassingReviewResult());

  const bundleBefore = JSON.stringify(store.store.get(topicSlug));
  const runB = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      loadCandidateBundleFn: store.loadCandidateBundleFn, writeCandidateBundleFn: store.writeCandidateBundleFn,
      fetchEvidenceFn: async () => pool,
      planIntentFn: planIntentSpy, synthesizeFn: synthesizeSpy, writeFn: writeSpy, reviewFn: reviewSpy,
    },
  });
  check('RESUME_READY_FOR_PREPARE', 'zero model calls this run', runB.model_calls.total_calls === 0, runB.model_calls.total_calls);
  check('RESUME_READY_FOR_PREPARE', 'resumed_from_stage is READY_FOR_PREPARE', runB.candidate_resume.resumed_from_stage === RESUME_STAGE.READY_FOR_PREPARE);
  check('RESUME_READY_FOR_PREPARE', 'final_state is SHADOW_CANDIDATE_READY', runB.final_state === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY);
  check('NO_ERASURE_BY_LATER_FAILURE', 'Intent Planner never called', planIntentSpy.callCount === 0);
  check('NO_ERASURE_BY_LATER_FAILURE', 'Publication Editor never called despite being wired to fail', synthesizeSpy.callCount === 0);
  check('NO_ERASURE_BY_LATER_FAILURE', 'Writer never called', writeSpy.callCount === 0);
  check('NO_ERASURE_BY_LATER_FAILURE', 'Reviewer never called', reviewSpy.callCount === 0);
  check('NO_ERASURE_BY_LATER_FAILURE', 'the durable bundle is byte-for-byte unchanged after Run B (never overwritten by a later run)', JSON.stringify(store.store.get(topicSlug)) === bundleBefore);
}

async function testRepairedPagePlanPersistsAsTheCanonicalPlanInTheBundle() {
  const topicSlug = 'androgenetic-alopecia';
  const store = makeInMemoryCandidateStore();
  const pool = healthyPoolForSingleTopic(topicSlug);

  const runA = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      loadCandidateBundleFn: store.loadCandidateBundleFn, writeCandidateBundleFn: store.writeCandidateBundleFn,
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFnWithNumericCorePoint(topicSlug),
      writeFn: async (env, { clearedSnapshot }) => {
        const result = fakeWriterResult(topicSlug, clearedSnapshot);
        result.output.sections[0].units[1] = {
          kind: 'PARAPHRASE', text: 'About 9% of follicles show this at once.',
          supporting_claim_ids: [`${topicSlug}-c1`], source_statements: ['Roughly 9% of follicles are affected at any given time.'],
        };
        return result;
      },
      reviewFn: async () => fakePassingReviewResult(),
    },
  });
  check('REPAIRED_PLAN_PERSISTED', 'Run A reaches SHADOW_CANDIDATE_READY via repair', runA.final_state === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY, JSON.stringify({ state: runA.final_state, reason: runA.exception_reason }));

  const persisted = store.store.get(topicSlug);
  check('REPAIRED_PLAN_PERSISTED', 'the persisted page_plan carries the REPAIRED (VERBATIM) unit, never the original PARAPHRASE', persisted.page_plan.sections[0].units[1].kind === 'VERBATIM' && persisted.page_plan.sections[0].units[1].text === 'Roughly 9% of follicles are affected at any given time.', JSON.stringify(persisted.page_plan.sections[0].units[1]));
  check('REPAIRED_PLAN_PERSISTED', 'deterministic_repair is recorded on the bundle itself', persisted.deterministic_repair && persisted.deterministic_repair.attempted === true, JSON.stringify(persisted.deterministic_repair));

  // A later resumed run must reuse the REPAIRED plan verbatim (it's
  // already valid, so it resumes all the way to READY_FOR_PREPARE).
  const runB = await run(FAKE_ENV_WITH_CRED, {
    fns: { loadCandidateBundleFn: store.loadCandidateBundleFn, writeCandidateBundleFn: store.writeCandidateBundleFn, fetchEvidenceFn: async () => pool },
  });
  check('REPAIRED_PLAN_PERSISTED', 'a resumed run reuses the repaired plan as READY_FOR_PREPARE with zero model calls', runB.candidate_resume.resumed_from_stage === RESUME_STAGE.READY_FOR_PREPARE && runB.model_calls.total_calls === 0);
}

// ─────────────────────────────────────────────────────────────────────────
// Bounded FRAMING-removal repair (docs/education/AIMT-EDUCATION-
// OPERATIONS-v1.md, real Run #8/alopecia-areata shadow failure). Letters
// refer to the originating task's own lettered test list.
// ─────────────────────────────────────────────────────────────────────────

// L: fresh framing-only failure can repair in the same run.
async function testFreshFramingOnlyFailureRepairsInTheSameRun() {
  const topicSlug = 'androgenetic-alopecia';
  const store = makeInMemoryCandidateStore();
  const pool = healthyPoolForSingleTopic(topicSlug);
  const reviewFn = makeSequencedReviewFn([fakeFramingCarriesScienceReviewResult(), fakePassingReviewResult()]);

  const runA = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      loadCandidateBundleFn: store.loadCandidateBundleFn, writeCandidateBundleFn: store.writeCandidateBundleFn,
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFn(topicSlug),
      writeFn: async (env, { clearedSnapshot }) => fakeWriterResult(topicSlug, clearedSnapshot),
      reviewFn,
    },
  });
  check('FRESH_FRAMING_REPAIR_PASS', 'Reviewer was called exactly twice (initial + one retry)', reviewFn.callCount === 2, reviewFn.callCount);
  check('FRESH_FRAMING_REPAIR_PASS', 'final_state reaches SHADOW_CANDIDATE_READY via the retry', runA.final_state === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY, JSON.stringify({ state: runA.final_state, reason: runA.exception_reason }));
  check('FRESH_FRAMING_REPAIR_PASS', 'model_calls total is 5 (intent+PE+writer+2 reviewer calls), never re-deriving anything', runA.model_calls.total_calls === 5, runA.model_calls.total_calls);

  const persisted = store.store.get(topicSlug);
  check('FRESH_FRAMING_REPAIR_PASS', 'the FRAMING unit is gone from the persisted canonical plan', persisted.page_plan.sections[0].units.every((u) => u.kind !== 'FRAMING'));
  check('FRESH_FRAMING_REPAIR_PASS', 'the PARAPHRASE unit survives byte-for-byte', persisted.page_plan.sections[0].units.some((u) => u.kind === 'PARAPHRASE'));
  check('FRESH_FRAMING_REPAIR_PASS', 'reviewer_framing_repair is recorded with removed_unit_count 1 and resulting outcome PASS',
    persisted.reviewer_framing_repair && persisted.reviewer_framing_repair.attempted === true && persisted.reviewer_framing_repair.removed_unit_count === 1 && persisted.reviewer_framing_repair.resulting_review_outcome === 'PASS',
    JSON.stringify(persisted.reviewer_framing_repair));
  // E: the repaired plan is verified against the FULL deterministic
  // validator, not merely assumed valid because the retry passed.
  const revalidation = validateEducationPagePlan(persisted.page_plan, persisted.fingerprint_input, { expectedTopicSlug: topicSlug, expectedCluster: 'hair-loss-shedding', expectedRoute: persisted.route });
  check('FRESH_FRAMING_REPAIR_PASS', 'E: the persisted repaired plan independently passes validateEducationPagePlan()', revalidation.valid === true, JSON.stringify(revalidation.violations));
}

// H: one Reviewer retry FAIL -> EDITORIAL_REVIEW (fresh-run shape).
async function testFreshFramingRepairRetryStillFailsRoutesToEditorialReview() {
  const topicSlug = 'androgenetic-alopecia';
  const store = makeInMemoryCandidateStore();
  const pool = healthyPoolForSingleTopic(topicSlug);
  const reviewFn = makeSequencedReviewFn([fakeFramingCarriesScienceReviewResult(), fakeParaphraseDriftReviewResult()]);

  const runA = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      loadCandidateBundleFn: store.loadCandidateBundleFn, writeCandidateBundleFn: store.writeCandidateBundleFn,
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFn(topicSlug),
      writeFn: async (env, { clearedSnapshot }) => fakeWriterResult(topicSlug, clearedSnapshot),
      reviewFn,
    },
  });
  check('FRAMING_REPAIR_RETRY_FAIL', 'Reviewer was called exactly twice', reviewFn.callCount === 2, reviewFn.callCount);
  check('FRAMING_REPAIR_RETRY_FAIL', 'final_state is EDITORIAL_REVIEW (the retry outcome, never PASS)', runA.final_state === RUN_FINAL_STATE.EDITORIAL_REVIEW, JSON.stringify({ state: runA.final_state, reason: runA.exception_reason }));
  check('FRAMING_REPAIR_RETRY_FAIL', 'review_result reflects the SECOND (retry) verdict -- a paraphrase failure, zero framing failures', runA.review_result.failing_paraphrases.length === 1 && runA.review_result.failing_framings.length === 0, JSON.stringify(runA.review_result));

  const persisted = store.store.get(topicSlug);
  check('FRAMING_REPAIR_RETRY_FAIL', 'the repaired (framing-removed) plan is persisted as canonical even though the retry failed', persisted.page_plan.sections[0].units.every((u) => u.kind !== 'FRAMING'));
  check('FRAMING_REPAIR_RETRY_FAIL', 'reviewer_framing_repair records attempted:true with resulting_review_outcome SUBSTANTIVE_FAIL',
    persisted.reviewer_framing_repair.attempted === true && persisted.reviewer_framing_repair.resulting_review_outcome === REVIEW_OUTCOME.SUBSTANTIVE_FAIL,
    JSON.stringify(persisted.reviewer_framing_repair));

  // I: a later run must NEVER retry again for this candidate.
  const noRetrySpy = spyFn(async () => { throw new Error('reviewFn must never be called again once reviewer_framing_repair.attempted is true'); });
  const runB = await run(FAKE_ENV_WITH_CRED, {
    fns: { loadCandidateBundleFn: store.loadCandidateBundleFn, writeCandidateBundleFn: store.writeCandidateBundleFn, fetchEvidenceFn: async () => pool, reviewFn: noRetrySpy },
  });
  check('NO_ENDLESS_RETRY', 'Reviewer is never called again once attempted:true is persisted', noRetrySpy.callCount === 0);
  check('NO_ENDLESS_RETRY', 'final_state stays EDITORIAL_REVIEW, unchanged, on the later run', runB.final_state === RUN_FINAL_STATE.EDITORIAL_REVIEW, runB.final_state);
  check('NO_ENDLESS_RETRY', 'zero model calls on the later (already-attempted) run', runB.model_calls.total_calls === 0, runB.model_calls.total_calls);
}

// G/J/K: an EXISTING durable EDITORIAL_REVIEW bundle (Run #8 shape,
// repair never yet attempted) resumes with ZERO Intent Planner/
// Publication Editor/Writer calls and exactly ONE Reviewer call, and a
// retry PASS reaches SHADOW_CANDIDATE_READY.
async function testResumedDurableBundleRepairsWithOneReviewerCallAndReachesShadowCandidateReady() {
  const topicSlug = 'androgenetic-alopecia';
  const store = makeInMemoryCandidateStore();
  const pool = healthyPoolForSingleTopic(topicSlug);

  // Run A: simulate the repair's OWN retry call failing (infra outage) so
  // the one-attempt guard is never consumed -- the bundle is left stuck
  // at EDITORIAL_REVIEW with reviewer_framing_repair still null, exactly
  // like a real Run #8 that predates this repair existing at all.
  const runAReviewFn = makeSequencedReviewFn([fakeFramingCarriesScienceReviewResult(), { ok: false, reason: 'simulated retry-call outage' }]);
  const runA = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      loadCandidateBundleFn: store.loadCandidateBundleFn, writeCandidateBundleFn: store.writeCandidateBundleFn,
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFn(topicSlug),
      writeFn: async (env, { clearedSnapshot }) => fakeWriterResult(topicSlug, clearedSnapshot),
      reviewFn: runAReviewFn,
    },
  });
  check('RUN8_SETUP', 'Run A ends CONFIG_BLOCKED on the failed retry call', runA.final_state === RUN_FINAL_STATE.CONFIG_BLOCKED, runA.final_state);
  const stuckBundle = store.store.get(topicSlug);
  check('RUN8_SETUP', 'the ORIGINAL framing-only SUBSTANTIVE_FAIL review_result is durably persisted', stuckBundle.review_result.outcome === 'SUBSTANTIVE_FAIL' && stuckBundle.review_result.failing_framings.length === 1);
  check('RUN8_SETUP', 'reviewer_framing_repair was never marked attempted (the retry call itself failed)', stuckBundle.reviewer_framing_repair === null);

  // Run B: resume -- Intent Planner / Publication Editor / Writer must
  // never be called; the repair completes with exactly one Reviewer call.
  const planIntentSpy = spyFn(async () => fakeIntentResult(topicSlug));
  const synthesizeSpy = spyFn(fakeSynthesizeFn(topicSlug));
  const writeSpy = spyFn(async (env, { clearedSnapshot }) => fakeWriterResult(topicSlug, clearedSnapshot));
  const reviewSpy = spyFn(async () => fakePassingReviewResult());
  const preparedArtifactBefore = stuckBundle.prepared_artifact;

  const runB = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      loadCandidateBundleFn: store.loadCandidateBundleFn, writeCandidateBundleFn: store.writeCandidateBundleFn,
      fetchEvidenceFn: async () => pool,
      planIntentFn: planIntentSpy, synthesizeFn: synthesizeSpy, writeFn: writeSpy, reviewFn: reviewSpy,
    },
  });
  check('RESUMED_FRAMING_REPAIR', 'J: Intent Planner never called on resume', planIntentSpy.callCount === 0);
  check('RESUMED_FRAMING_REPAIR', 'J: Publication Editor never called on resume', synthesizeSpy.callCount === 0);
  check('RESUMED_FRAMING_REPAIR', 'J: Writer never called on resume', writeSpy.callCount === 0);
  check('RESUMED_FRAMING_REPAIR', 'K: exactly ONE model call this run (the Reviewer retry)', runB.model_calls.total_calls === 1, runB.model_calls.total_calls);
  check('RESUMED_FRAMING_REPAIR', 'K: that one call is a Reviewer call', reviewSpy.callCount === 1);
  check('RESUMED_FRAMING_REPAIR', 'G: retry PASS reaches SHADOW_CANDIDATE_READY', runB.final_state === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY, JSON.stringify({ state: runB.final_state, reason: runB.exception_reason }));
  check('RESUMED_FRAMING_REPAIR', 'candidate_resume reports resumed_from_stage EDITORIAL_REVIEW (the stage the bundle was actually resumed from)', runB.candidate_resume.resumed_from_stage === RESUME_STAGE.EDITORIAL_REVIEW, runB.candidate_resume.resumed_from_stage);

  // Q: Publication Editor's exact artifact is never touched by any of this.
  const persisted = store.store.get(topicSlug);
  check('RESUMED_FRAMING_REPAIR', 'Q: prepared_artifact remains the EXACT same object/reference throughout', persisted.prepared_artifact === preparedArtifactBefore);
  check('RESUMED_FRAMING_REPAIR', 'Q: prepared_artifact is byte-identical to before the repair', JSON.stringify(persisted.prepared_artifact) === JSON.stringify(preparedArtifactBefore));
}

// F: deterministic validation failure prevents a Reviewer retry.
async function testDeterministicRevalidationFailurePreventsReviewerRetry() {
  const topicSlug = 'androgenetic-alopecia';
  const store = makeInMemoryCandidateStore();
  const pool = healthyPoolForSingleTopic(topicSlug);
  const reviewFn = makeSequencedReviewFn([
    fakeFramingCarriesScienceReviewResult(),
    async () => { throw new Error('Reviewer must never be called again once deterministic revalidation fails'); },
  ]);

  const runA = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      loadCandidateBundleFn: store.loadCandidateBundleFn, writeCandidateBundleFn: store.writeCandidateBundleFn,
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFn(topicSlug),
      writeFn: async (env, { clearedSnapshot }) => fakeWriterResult(topicSlug, clearedSnapshot),
      reviewFn,
      // Forces ONLY the repair's own post-removal revalidation to fail --
      // the normal Writer-stage validation call is never routed through
      // this override (it calls validateEducationPagePlan directly), so
      // the Writer stage still succeeds normally on the unrepaired plan.
      validateEducationPagePlanFn: () => ({ valid: false, violations: ['SIMULATED_FRAMING_REVALIDATION_FAILURE'] }),
    },
  });
  check('DETERMINISTIC_REVALIDATION_BLOCKS_RETRY', 'Reviewer was called exactly once (never retried)', reviewFn.callCount === 1, reviewFn.callCount);
  check('DETERMINISTIC_REVALIDATION_BLOCKS_RETRY', 'final_state is EDITORIAL_REVIEW', runA.final_state === RUN_FINAL_STATE.EDITORIAL_REVIEW, runA.final_state);
  check('DETERMINISTIC_REVALIDATION_BLOCKS_RETRY', 'the ORIGINAL (framing) review_result is preserved, not overwritten', runA.review_result.failing_framings.length === 1);

  const persisted = store.store.get(topicSlug);
  check('DETERMINISTIC_REVALIDATION_BLOCKS_RETRY', 'the canonical page_plan is unchanged (the invalid repaired plan is never persisted as canonical)', persisted.page_plan.sections[0].units.some((u) => u.kind === 'FRAMING'));
  check('DETERMINISTIC_REVALIDATION_BLOCKS_RETRY', 'reviewer_framing_repair records attempted:true, deterministic_validation_passed:false, resulting_review_outcome:null',
    persisted.reviewer_framing_repair.attempted === true && persisted.reviewer_framing_repair.deterministic_validation_passed === false && persisted.reviewer_framing_repair.resulting_review_outcome === null,
    JSON.stringify(persisted.reviewer_framing_repair));
}

// M-style orchestrator-level sanity: a non-framing-only SUBSTANTIVE_FAIL
// never even attempts a retry (proves the wiring honors the pure
// module's eligibility gate end-to-end, not merely in isolation).
async function testNonFramingOnlyFailureNeverAttemptsARetryEndToEnd() {
  const topicSlug = 'androgenetic-alopecia';
  const store = makeInMemoryCandidateStore();
  const pool = healthyPoolForSingleTopic(topicSlug);
  const reviewSpy = spyFn(async () => fakeParaphraseDriftReviewResult());

  const runA = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      loadCandidateBundleFn: store.loadCandidateBundleFn, writeCandidateBundleFn: store.writeCandidateBundleFn,
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFn(topicSlug),
      writeFn: async (env, { clearedSnapshot }) => fakeWriterResult(topicSlug, clearedSnapshot),
      reviewFn: reviewSpy,
    },
  });
  check('NOT_REPAIRABLE_END_TO_END', 'Reviewer called exactly once, no retry attempted', reviewSpy.callCount === 1, reviewSpy.callCount);
  check('NOT_REPAIRABLE_END_TO_END', 'final_state is EDITORIAL_REVIEW', runA.final_state === RUN_FINAL_STATE.EDITORIAL_REVIEW, runA.final_state);
  check('NOT_REPAIRABLE_END_TO_END', 'reviewer_framing_repair stays null (never even attempted)', store.store.get(topicSlug).reviewer_framing_repair === null);
}

// R: model-call ceiling remains <= 6, including the compound worst case
// where Publication Editor already spent its own maximum (3 calls) this
// run -- there is no room left for the repair's one Reviewer retry, so
// it is skipped (never marked attempted) THIS run rather than exceeding
// the ceiling, and completes on a LATER resumed run for exactly 1 call.
async function testModelCallCeilingNeverExceededEvenInTheCompoundWorstCase() {
  const topicSlug = 'androgenetic-alopecia';
  const store = makeInMemoryCandidateStore();
  const pool = healthyPoolForSingleTopic(topicSlug);
  const reviewFn = makeSequencedReviewFn([
    fakeFramingCarriesScienceReviewResult(),
    async () => { throw new Error('Reviewer retry must never be attempted when it would exceed the ceiling'); },
  ]);

  const runA = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      loadCandidateBundleFn: store.loadCandidateBundleFn, writeCandidateBundleFn: store.writeCandidateBundleFn,
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFn(topicSlug, { modelCalls: 3 }), // PE's own maximum
      writeFn: async (env, { clearedSnapshot }) => fakeWriterResult(topicSlug, clearedSnapshot),
      reviewFn,
    },
  });
  check('CEILING_GUARD', 'intent(1)+PE(3)+writer(1)+reviewer(1) already totals 6 -- the ceiling itself is never exceeded', runA.model_calls.total_calls === 6, runA.model_calls.total_calls);
  check('CEILING_GUARD', 'Reviewer was called only ONCE this run -- the retry was skipped for lack of headroom', reviewFn.callCount === 1, reviewFn.callCount);
  check('CEILING_GUARD', 'final_state falls back to ordinary EDITORIAL_REVIEW this run', runA.final_state === RUN_FINAL_STATE.EDITORIAL_REVIEW, runA.final_state);
  check('CEILING_GUARD', 'reviewer_framing_repair stays null (never marked attempted, so a later run can still repair it)', store.store.get(topicSlug).reviewer_framing_repair === null);

  // A LATER run resumes and completes the SAME repair for exactly 1 call.
  const runB = await run(FAKE_ENV_WITH_CRED, {
    fns: { loadCandidateBundleFn: store.loadCandidateBundleFn, writeCandidateBundleFn: store.writeCandidateBundleFn, fetchEvidenceFn: async () => pool, reviewFn: async () => fakePassingReviewResult() },
  });
  check('CEILING_GUARD', 'the later resumed run completes the repair for exactly 1 model call', runB.model_calls.total_calls === 1, runB.model_calls.total_calls);
  check('CEILING_GUARD', 'the later resumed run reaches SHADOW_CANDIDATE_READY', runB.final_state === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY, runB.final_state);
}

async function testStaleCandidateDueToNewEvidenceDoesNotResumeAndTriggersFreshSynthesis() {
  const topicSlug = 'androgenetic-alopecia';
  const store = makeInMemoryCandidateStore();
  const poolA = healthyPoolForSingleTopic(topicSlug);
  const runA = await runFullSuccessfulPipeline(topicSlug, poolA, store);
  check('STALE_CANDIDATE', 'Run A succeeds', runA.final_state === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY, JSON.stringify({ state: runA.final_state, reason: runA.exception_reason }));

  // A NEW claim appears in the evidence pool for the same topic -- the
  // candidate claim set considered at clearance no longer matches the
  // CURRENT candidate pool: legitimate staleness, not corruption.
  const poolB = healthyPoolForSingleTopic(topicSlug);
  poolB.claims.push(makeClaim(`${topicSlug}-c-new`, topicSlug, `${topicSlug}-s1`));

  const synthesizeSpy = spyFn(fakeSynthesizeFn(topicSlug));
  const runB = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      loadCandidateBundleFn: store.loadCandidateBundleFn, writeCandidateBundleFn: store.writeCandidateBundleFn,
      fetchEvidenceFn: async () => poolB,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: synthesizeSpy,
      writeFn: async (env, { clearedSnapshot }) => fakeWriterResult(topicSlug, clearedSnapshot),
      reviewFn: async () => fakePassingReviewResult(),
    },
  });
  check('STALE_CANDIDATE', 'candidate_resume reports found but NOT reused', runB.candidate_resume.found === true && runB.candidate_resume.reused === false, JSON.stringify(runB.candidate_resume));
  check('STALE_CANDIDATE', 'freshness_state is POTENTIAL_EVIDENCE_CHANGE', runB.candidate_resume.freshness_state === FRESHNESS_STATE.POTENTIAL_EVIDENCE_CHANGE, runB.candidate_resume.freshness_state);
  check('STALE_CANDIDATE', 'Publication Editor WAS called fresh -- legitimate regeneration, never a silent block', synthesizeSpy.callCount === 1);
  check('STALE_CANDIDATE', 'the run still proceeds all the way through on the fresh synthesis', runB.final_state === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY, JSON.stringify({ state: runB.final_state, reason: runB.exception_reason }));
  check('STALE_CANDIDATE', 'model-call ceiling is still respected on a fresh regeneration', runB.model_calls.total_calls <= MAX_EDUCATION_OPS_MODEL_CALLS_PER_RUN, runB.model_calls.total_calls);
}

async function testFreshnessCheckFailureFailsClosedAsInfraReviewWithoutResumingOrRegenerating() {
  const topicSlug = 'androgenetic-alopecia';
  const store = makeInMemoryCandidateStore();
  const pool = healthyPoolForSingleTopic(topicSlug);
  const runA = await runFullSuccessfulPipeline(topicSlug, pool, store);
  check('FRESHNESS_CHECK_FAILURE', 'Run A succeeds', runA.final_state === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY);

  const synthesizeSpy = spyFn(fakeSynthesizeFn(topicSlug));
  const runB = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      loadCandidateBundleFn: store.loadCandidateBundleFn, writeCandidateBundleFn: store.writeCandidateBundleFn,
      fetchEvidenceFn: async () => pool,
      resolveCandidateResumeFreshnessFn: () => ({ state: FRESHNESS_STATE.FRESHNESS_CHECK_FAILED, reason: 'forced for test' }),
      synthesizeFn: synthesizeSpy,
    },
  });
  check('FRESHNESS_CHECK_FAILURE', 'final_state is INFRA_REVIEW', runB.final_state === RUN_FINAL_STATE.INFRA_REVIEW, runB.final_state);
  check('FRESHNESS_CHECK_FAILURE', 'candidate_resume reports the failed freshness state, never reused', runB.candidate_resume.freshness_state === FRESHNESS_STATE.FRESHNESS_CHECK_FAILED && runB.candidate_resume.reused === false);
  check('FRESHNESS_CHECK_FAILURE', 'never falls through to a fresh Publication Editor call either -- fails closed, does not regenerate in the same run', synthesizeSpy.callCount === 0);
}

async function testIntegrityFailureFailsClosedAsInfraReviewWithoutResumingOrRegenerating() {
  const topicSlug = 'androgenetic-alopecia';
  const store = makeInMemoryCandidateStore();
  const pool = healthyPoolForSingleTopic(topicSlug);
  const runA = await runFullSuccessfulPipeline(topicSlug, pool, store);
  check('INTEGRITY_FAILURE', 'Run A succeeds', runA.final_state === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY);

  // Tamper with the durable bundle's own stored hash directly -- the
  // REAL verifyCandidateBundleIntegrity() (not mocked) must catch this.
  const tampered = { ...store.store.get(topicSlug) };
  tampered.generation_source_hash = '0'.repeat(64);
  tampered.prepared_artifact = { ...tampered.prepared_artifact, record: { ...tampered.prepared_artifact.record, generation_source_hash: '0'.repeat(64) } };
  store.store.set(topicSlug, tampered);

  const synthesizeSpy = spyFn(fakeSynthesizeFn(topicSlug));
  const runB = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      loadCandidateBundleFn: store.loadCandidateBundleFn, writeCandidateBundleFn: store.writeCandidateBundleFn,
      fetchEvidenceFn: async () => pool,
      synthesizeFn: synthesizeSpy,
    },
  });
  check('INTEGRITY_FAILURE', 'final_state is INFRA_REVIEW', runB.final_state === RUN_FINAL_STATE.INFRA_REVIEW, runB.final_state);
  check('INTEGRITY_FAILURE', 'candidate_resume.integrity_valid is false', runB.candidate_resume.integrity_valid === false);
  check('INTEGRITY_FAILURE', 'never falls through to a fresh Publication Editor call -- refuses to silently regenerate over a tampered artifact', synthesizeSpy.callCount === 0);
}

async function testMalformedBundleFailsClosedAsInfraReviewWithoutResuming() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);

  const synthesizeSpy = spyFn(fakeSynthesizeFn(topicSlug));
  const runGarbage = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      loadCandidateBundleFn: () => ({ found: true, bundle: { not: 'a real bundle' } }),
      writeCandidateBundleFn: () => {},
      fetchEvidenceFn: async () => pool,
      synthesizeFn: synthesizeSpy,
    },
  });
  check('MALFORMED_BUNDLE', 'a garbage bundle object -> INFRA_REVIEW', runGarbage.final_state === RUN_FINAL_STATE.INFRA_REVIEW, runGarbage.final_state);
  check('MALFORMED_BUNDLE', 'a garbage bundle never calls Publication Editor', synthesizeSpy.callCount === 0);

  const synthesizeSpy2 = spyFn(fakeSynthesizeFn(topicSlug));
  const runParseError = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      loadCandidateBundleFn: () => ({ found: true, bundle: null, parseError: 'Unexpected token in JSON' }),
      writeCandidateBundleFn: () => {},
      fetchEvidenceFn: async () => pool,
      synthesizeFn: synthesizeSpy2,
    },
  });
  check('MALFORMED_BUNDLE', 'a JSON parse failure -> INFRA_REVIEW', runParseError.final_state === RUN_FINAL_STATE.INFRA_REVIEW, runParseError.final_state);
  check('MALFORMED_BUNDLE', 'a parse failure never calls Publication Editor either', synthesizeSpy2.callCount === 0);
  check('MALFORMED_BUNDLE', 'exception_reason mentions the parse error', runParseError.exception_reason.includes('Unexpected token in JSON'), runParseError.exception_reason);
}

async function testLegacyRunWithNoCandidateBundleStillReachesShadowCandidateReady() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  // Deliberately uses run()'s own DEFAULT loadCandidateBundleFn/
  // writeCandidateBundleFn (a no-op, always-empty pair) -- no override
  // at all -- proving the default wiring itself reproduces exactly the
  // pre-existing (legacy) behavior for a topic that has never had a
  // durable candidate bundle.
  const report = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFn(topicSlug),
      writeFn: async (env, { clearedSnapshot }) => fakeWriterResult(topicSlug, clearedSnapshot),
      reviewFn: async () => fakePassingReviewResult(),
    },
  });
  check('LEGACY_NO_BUNDLE', 'reaches SHADOW_CANDIDATE_READY exactly as before this feature existed', report.final_state === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY, JSON.stringify({ state: report.final_state, reason: report.exception_reason }));
  check('LEGACY_NO_BUNDLE', 'candidate_resume.found is false (no bundle ever existed for this topic)', report.candidate_resume.found === false);
  check('LEGACY_NO_BUNDLE', 'model_calls.total_calls is 4 (all four roles), unaffected by the resume machinery', report.model_calls.total_calls === 4, report.model_calls.total_calls);
}

function testAutopublishRemainsFalseAndPublishStillUnimplementedThroughoutResume() {
  check('SAFETY_INVARIANTS', 'AUTOPUBLISH is not enabled in the fake env every resume test above uses', isAutopublishEnabled(FAKE_ENV_WITH_CRED) === false);
}

// ─────────────────────────────────────────────────────────────────────────
// PUBLICATION EDITOR VIOLATION OBSERVABILITY (publication-violation-
// sanitizer.mjs wired into the publication_editor_result shape). THE
// FIX: real Education Operations Runs #4-#6 repeated SYNTHESIS_FAILED /
// unresolved_mechanical_or_accounting_violation for the same topic with
// zero visibility into WHICH deterministic validator rule(s) actually
// fired. These tests prove the sanitized codes now reach the run
// report, with zero raw claim IDs, and that the existing terminal-state
// mapping (SYNTHESIS_FAILED -> NO_OP_SUCCESS, HUMAN_REVIEW -> HUMAN_REVIEW)
// is completely unchanged.
// ─────────────────────────────────────────────────────────────────────────
async function testSynthesisFailedViolationsReachRunReportAsSanitizedCodes() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  const report = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: async () => ({
        status: 'SYNTHESIS_FAILED', stage: 'initial', reason: 'unresolved_mechanical_or_accounting_violation',
        finalOutput: { human_review_justification: { reason_code: 'NOT_APPLICABLE', reason: 'Not applicable', related_claim_ids: [] } },
        violations: ['LIMITATIONS_NOT_PRESERVED', `SUPPORTING_CLAIM_NOT_SELECTED:${topicSlug}-c1-super-private-id`, 'LIMITATIONS_NOT_PRESERVED'],
        metrics: { model_calls: 1, reconciliation_calls: 0, full_retries: 0, total_input_tokens: 100, total_output_tokens: 100, model_info: {} },
      }),
    },
  });
  check('PE_VIOLATION_OBSERVABILITY', 'final_state is NO_OP_SUCCESS -- the existing SYNTHESIS_FAILED mapping is unchanged', report.final_state === RUN_FINAL_STATE.NO_OP_SUCCESS, report.final_state);
  check('PE_VIOLATION_OBSERVABILITY', 'publication_editor_result.status is SYNTHESIS_FAILED', report.publication_editor_result.status === 'SYNTHESIS_FAILED');
  check('PE_VIOLATION_OBSERVABILITY', 'publication_editor_result.reason is preserved exactly', report.publication_editor_result.reason === 'unresolved_mechanical_or_accounting_violation');
  check('PE_VIOLATION_OBSERVABILITY', 'validator_violation_codes carries the sanitized, deduplicated codes in order', JSON.stringify(report.publication_editor_result.validator_violation_codes) === JSON.stringify(['LIMITATIONS_NOT_PRESERVED', 'SUPPORTING_CLAIM_NOT_SELECTED']), JSON.stringify(report.publication_editor_result.validator_violation_codes));
  check('PE_VIOLATION_OBSERVABILITY', 'no raw claim id anywhere in the serialized run report', !JSON.stringify(report).includes('super-private-id'));
  check('PE_VIOLATION_OBSERVABILITY', 'human_review_justification is still preserved exactly as before', report.publication_editor_result.human_review_justification && report.publication_editor_result.human_review_justification.reason_code === 'NOT_APPLICABLE');
}

async function testSynthesisFailedWithNoViolationsProducesAnEmptyArray() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  const report = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: async () => ({
        status: 'SYNTHESIS_FAILED', stage: 'initial', reason: 'model_call_failed',
        finalOutput: null,
        metrics: { model_calls: 1, reconciliation_calls: 0, full_retries: 0, total_input_tokens: 100, total_output_tokens: 100, model_info: {} },
      }),
    },
  });
  check('PE_VIOLATION_OBSERVABILITY', 'validator_violation_codes is [] when the underlying result carries no violations at all', Array.isArray(report.publication_editor_result.validator_violation_codes) && report.publication_editor_result.validator_violation_codes.length === 0, JSON.stringify(report.publication_editor_result.validator_violation_codes));
}

async function testHumanReviewStillMapsExactlyAsBeforeWithSanitizedCodesAlsoPresent() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  const report = await run(FAKE_ENV_WITH_CRED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: async () => ({
        status: 'HUMAN_REVIEW', stage: 'initial', reason: 'substantive_validator_violation',
        finalOutput: { human_review_justification: { reason_code: 'UNRESOLVED_CONTRADICTION', reason: 'Two sources genuinely disagree on a core finding for this topic.', related_claim_ids: [`${topicSlug}-c1`] } },
        violations: ['AUTO_READY_WITH_INCONSISTENT_HUMAN_REVIEW_JUSTIFICATION', `NON_CORE_CONFLICT_ONE_SIDED_EXCLUSION:${topicSlug}-c1->${topicSlug}-c2`],
        metrics: { model_calls: 1, reconciliation_calls: 0, full_retries: 0, total_input_tokens: 100, total_output_tokens: 100, model_info: {} },
      }),
    },
  });
  check('PE_VIOLATION_OBSERVABILITY', 'final_state is still exactly HUMAN_REVIEW, unchanged', report.final_state === RUN_FINAL_STATE.HUMAN_REVIEW, report.final_state);
  check('PE_VIOLATION_OBSERVABILITY', 'exception_reason still carries the human_review_justification.reason exactly as before', report.exception_reason.includes('Two sources genuinely disagree'), report.exception_reason);
  check('PE_VIOLATION_OBSERVABILITY', 'validator_violation_codes is ALSO populated and sanitized for a HUMAN_REVIEW outcome', JSON.stringify(report.publication_editor_result.validator_violation_codes) === JSON.stringify(['AUTO_READY_WITH_INCONSISTENT_HUMAN_REVIEW_JUSTIFICATION', 'NON_CORE_CONFLICT_ONE_SIDED_EXCLUSION']), JSON.stringify(report.publication_editor_result.validator_violation_codes));
  check('PE_VIOLATION_OBSERVABILITY', 'no raw claim id pair anywhere in the serialized run report', !JSON.stringify(report).includes(`${topicSlug}-c1->${topicSlug}-c2`));
}

// ─────────────────────────────────────────────────────────────────────────
// RESEARCH-GAP FEEDBACK LOOP v1 (education-research-gap-queue.mjs wired
// into runDecisionPipeline). THE FIX: Publication Editor's own VALID
// governed HUMAN_REVIEW / EVIDENCE_INSUFFICIENCY result for
// alopecia-areata should route to Rick (the research harvester), not to
// the owner's human-review queue -- ordinary evidence acquisition is not
// a scientific/safety/institutional exception. These tests prove: the
// loop only ever fires when explicitly enabled; only EVIDENCE_
// INSUFFICIENCY enters it (every other HUMAN_REVIEW reason_code is
// completely unaffected); and Publication Editor progressing beyond
// EVIDENCE_INSUFFICIENCY (AUTO_READY or a different reason) resolves a
// pre-existing gap.
// ─────────────────────────────────────────────────────────────────────────
const FAKE_ENV_WITH_GAP_LOOP_ENABLED = { ...FAKE_ENV_WITH_CRED, [RESEARCH_GAP_LOOP_ENV_VAR]: 'true' };

function evidenceInsufficiencySynthesizeFn(topicSlug, { reasonCode = 'EVIDENCE_INSUFFICIENCY', reason = 'Insufficient evidence for general presentation patterns.' } = {}) {
  return async () => ({
    status: 'HUMAN_REVIEW', stage: 'initial', reason: 'model_declared_human_review',
    finalOutput: { human_review_justification: { reason_code: reasonCode, reason, related_claim_ids: [] } },
    metrics: { model_calls: 1, reconciliation_calls: 0, full_retries: 0, total_input_tokens: 100, total_output_tokens: 100, model_info: {} },
  });
}

async function testEvidenceInsufficiencyWithLoopEnabledCreatesOneGap() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  let upsertArgs = null;
  const report = await run(FAKE_ENV_WITH_GAP_LOOP_ENABLED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: evidenceInsufficiencySynthesizeFn(topicSlug),
      loadActiveResearchGapsBySlugFn: async () => ({}),
      upsertEvidenceInsufficiencyGapFn: async (env, args) => {
        upsertArgs = args;
        return { row: { queue_id: `publication_evidence_gap:${topicSlug}`, extras: { attempt_count: 1 } }, action: 'QUEUED' };
      },
    },
  });
  check('EVIDENCE_INSUFFICIENCY_LOOP', 'A: final_state is RESEARCH_GAP_QUEUED', report.final_state === RUN_FINAL_STATE.RESEARCH_GAP_QUEUED, report.final_state);
  check('EVIDENCE_INSUFFICIENCY_LOOP', 'exactly one upsert call (one gap created)', !!upsertArgs);
  check('EVIDENCE_INSUFFICIENCY_LOOP', 'upsert carries the correct topic/gap summary', upsertArgs.topicSlug === topicSlug && upsertArgs.gapSummary === 'Insufficient evidence for general presentation patterns.');
  check('EVIDENCE_INSUFFICIENCY_LOOP', 'upsert carries the current candidate claim-id set as the baseline', Array.isArray(upsertArgs.baselineCandidateClaimIds) && upsertArgs.baselineCandidateClaimIds.length > 0);
  check('EVIDENCE_INSUFFICIENCY_LOOP', 'CORRECTION 1: upsert carries the page concept\'s controlled_topics for the later relevance gate', Array.isArray(upsertArgs.controlledTopics) && upsertArgs.controlledTopics.includes(topicSlug), JSON.stringify(upsertArgs.controlledTopics));
  check('EVIDENCE_INSUFFICIENCY_LOOP', 'research_gap_action reports QUEUED with the gap id and attempt_count', report.research_gap_action && report.research_gap_action.action === 'QUEUED' && report.research_gap_action.gap_id === `publication_evidence_gap:${topicSlug}` && report.research_gap_action.attempt_count === 1, JSON.stringify(report.research_gap_action));
  check('EVIDENCE_INSUFFICIENCY_LOOP', 'never stores raw model output in validator_violation_codes (empty, this is not a validator failure)', JSON.stringify(report.publication_editor_result.validator_violation_codes) === '[]');
}

async function testRepeatedEvidenceInsufficiencyUpdatesTheSameGapNoDuplicate() {
  // B, at the orchestrator level: an existing PENDING gap for this topic
  // -- the loop must call upsert (which itself is responsible for
  // updating the SAME row, tested exhaustively at the pure-logic level
  // in education-research-gap-queue.test.mjs) rather than anything that
  // looks like "create a second one".
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  let upsertCallCount = 0;
  const report = await run(FAKE_ENV_WITH_GAP_LOOP_ENABLED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: evidenceInsufficiencySynthesizeFn(topicSlug, { reason: 'Still insufficient, attempt 2.' }),
      // A gap already exists, but its baseline DIFFERS from the current
      // candidate set (otherwise the selector itself would have excluded
      // this topic as RESEARCH_GAP_PENDING before ever reaching PE) --
      // e.g. Rick submitted something that changed the pool, but it
      // still wasn't enough.
      loadActiveResearchGapsBySlugFn: async () => ({ [topicSlug]: { queue_id: `publication_evidence_gap:${topicSlug}`, status: 'pending', extras: { attempt_count: 1, baseline_candidate_claim_ids: ['some-other-claim-id'] } } }),
      upsertEvidenceInsufficiencyGapFn: async () => { upsertCallCount += 1; return { row: { queue_id: `publication_evidence_gap:${topicSlug}`, extras: { attempt_count: 2 } }, action: 'UPDATED' }; },
    },
  });
  check('REPEATED_INSUFFICIENCY_LOOP', 'exactly one upsert call, never two', upsertCallCount === 1);
  check('REPEATED_INSUFFICIENCY_LOOP', 'research_gap_action reports UPDATED with the incremented attempt_count', report.research_gap_action.action === 'UPDATED' && report.research_gap_action.attempt_count === 2, JSON.stringify(report.research_gap_action));
  check('REPEATED_INSUFFICIENCY_LOOP', 'final_state is still RESEARCH_GAP_QUEUED', report.final_state === RUN_FINAL_STATE.RESEARCH_GAP_QUEUED);
}

async function testEvidenceInsufficiencyWithLoopDisabledPreservesExistingHumanReviewBehavior() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  let upsertCalled = false;
  let loadGapsCalled = false;
  const report = await run(FAKE_ENV_WITH_CRED, { // loop NOT enabled
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: evidenceInsufficiencySynthesizeFn(topicSlug),
      loadActiveResearchGapsBySlugFn: async () => { loadGapsCalled = true; return {}; },
      upsertEvidenceInsufficiencyGapFn: async () => { upsertCalled = true; return { row: {}, action: 'QUEUED' }; },
    },
  });
  check('LOOP_DISABLED', 'C: final_state is the ordinary HUMAN_REVIEW, exactly as before this feature existed', report.final_state === RUN_FINAL_STATE.HUMAN_REVIEW, report.final_state);
  check('LOOP_DISABLED', 'exception_reason carries the human_review_justification.reason exactly as before', report.exception_reason.includes('Insufficient evidence for general presentation patterns.'), report.exception_reason);
  check('LOOP_DISABLED', 'the gap queue is never even read when the loop is disabled', loadGapsCalled === false);
  check('LOOP_DISABLED', 'the gap queue is never written when the loop is disabled', upsertCalled === false);
  check('LOOP_DISABLED', 'isResearchGapLoopEnabled(FAKE_ENV_WITH_CRED) is false', isResearchGapLoopEnabled(FAKE_ENV_WITH_CRED) === false);
}

async function testUnresolvedContradictionNeverGoesToRickEvenWithLoopEnabled() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  let upsertCalled = false;
  const report = await run(FAKE_ENV_WITH_GAP_LOOP_ENABLED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: evidenceInsufficiencySynthesizeFn(topicSlug, { reasonCode: 'UNRESOLVED_CONTRADICTION', reason: 'Two sources genuinely disagree on a core finding for this topic.' }),
      loadActiveResearchGapsBySlugFn: async () => ({}),
      upsertEvidenceInsufficiencyGapFn: async () => { upsertCalled = true; return { row: {}, action: 'QUEUED' }; },
    },
  });
  check('OTHER_REASON_CODES_STAY_HUMAN_REVIEW', 'D: UNRESOLVED_CONTRADICTION still maps to HUMAN_REVIEW, never RESEARCH_GAP_QUEUED', report.final_state === RUN_FINAL_STATE.HUMAN_REVIEW, report.final_state);
  check('OTHER_REASON_CODES_STAY_HUMAN_REVIEW', 'D: the gap queue is never written for this reason_code', upsertCalled === false);
}

async function testSafetyOrScopeConcernNeverGoesToRickEvenWithLoopEnabled() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  let upsertCalled = false;
  const report = await run(FAKE_ENV_WITH_GAP_LOOP_ENABLED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: evidenceInsufficiencySynthesizeFn(topicSlug, { reasonCode: 'SAFETY_OR_SCOPE_CONCERN', reason: 'A genuine safety/scope concern requiring owner review.' }),
      loadActiveResearchGapsBySlugFn: async () => ({}),
      upsertEvidenceInsufficiencyGapFn: async () => { upsertCalled = true; return { row: {}, action: 'QUEUED' }; },
    },
  });
  check('OTHER_REASON_CODES_STAY_HUMAN_REVIEW', 'E: SAFETY_OR_SCOPE_CONCERN still maps to HUMAN_REVIEW, never RESEARCH_GAP_QUEUED', report.final_state === RUN_FINAL_STATE.HUMAN_REVIEW, report.final_state);
  check('OTHER_REASON_CODES_STAY_HUMAN_REVIEW', 'E: the gap queue is never written for this reason_code', upsertCalled === false);
}

async function testAutoReadyResolvesAnExistingEvidenceGap() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  let resolveArgs = null;
  const report = await run(FAKE_ENV_WITH_GAP_LOOP_ENABLED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFn(topicSlug), // AUTO_READY
      writeFn: async (env, { clearedSnapshot }) => fakeWriterResult(topicSlug, clearedSnapshot),
      reviewFn: async () => fakePassingReviewResult(),
      // A gap for a DIFFERENT prior claim set exists (Rick submitted new
      // evidence, releasing the topic for re-evaluation -- see the
      // topic-selector tests for that release logic in isolation).
      loadActiveResearchGapsBySlugFn: async () => ({ [topicSlug]: { queue_id: `publication_evidence_gap:${topicSlug}`, status: 'pending', extras: { attempt_count: 2, baseline_candidate_claim_ids: ['a-stale-claim-id'] } } }),
      resolveResearchGapByTopicFn: async (env, slug) => { resolveArgs = slug; return { ok: true, reason: 'RESOLVED', row: {} }; },
    },
  });
  check('AUTO_READY_RESOLVES_GAP', 'J: resolveResearchGapByTopic was called for the selected topic', resolveArgs === topicSlug, resolveArgs);
  check('AUTO_READY_RESOLVES_GAP', 'J: research_gap_action reports RESOLVED', report.research_gap_action && report.research_gap_action.action === 'RESOLVED', JSON.stringify(report.research_gap_action));
  check('AUTO_READY_RESOLVES_GAP', 'the run continues normally all the way to SHADOW_CANDIDATE_READY', report.final_state === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY, JSON.stringify({ state: report.final_state, reason: report.exception_reason }));
}

async function testADifferentHumanReviewReasonAlsoResolvesAnExistingEvidenceGap() {
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  let resolveArgs = null;
  const report = await run(FAKE_ENV_WITH_GAP_LOOP_ENABLED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: evidenceInsufficiencySynthesizeFn(topicSlug, { reasonCode: 'OTHER_SUBSTANTIVE_EXCEPTION', reason: 'A different, genuine substantive exception this time.' }),
      loadActiveResearchGapsBySlugFn: async () => ({ [topicSlug]: { queue_id: `publication_evidence_gap:${topicSlug}`, status: 'pending', extras: { attempt_count: 1, baseline_candidate_claim_ids: ['a-stale-claim-id'] } } }),
      resolveResearchGapByTopicFn: async (env, slug) => { resolveArgs = slug; return { ok: true, reason: 'RESOLVED', row: {} }; },
    },
  });
  check('AUTO_READY_RESOLVES_GAP', 'Publication Editor progressing to a DIFFERENT HUMAN_REVIEW reason also resolves the gap', resolveArgs === topicSlug);
  check('AUTO_READY_RESOLVES_GAP', 'final_state is the ordinary HUMAN_REVIEW for the new reason, not RESEARCH_GAP_QUEUED', report.final_state === RUN_FINAL_STATE.HUMAN_REVIEW, report.final_state);
}

async function testSynthesisFailedDoesNotResolveAnActiveResearchGap() {
  // G (CORRECTION 2): a mechanical/accounting SYNTHESIS_FAILED proves
  // NOTHING about whether the original evidence insufficiency is
  // resolved -- it must NEVER resolve a pre-existing gap. The gap must
  // be preserved exactly as it was so the system does not lose the
  // research-feedback state because of model/output infrastructure
  // noise.
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  let resolveCalled = false;
  const report = await run(FAKE_ENV_WITH_GAP_LOOP_ENABLED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: async () => ({
        status: 'SYNTHESIS_FAILED', stage: 'initial', reason: 'unresolved_mechanical_or_accounting_violation',
        finalOutput: null, violations: ['LIMITATIONS_NOT_PRESERVED'],
        metrics: { model_calls: 1, reconciliation_calls: 0, full_retries: 0, total_input_tokens: 100, total_output_tokens: 100, model_info: {} },
      }),
      loadActiveResearchGapsBySlugFn: async () => ({ [topicSlug]: { queue_id: `publication_evidence_gap:${topicSlug}`, status: 'pending', extras: { attempt_count: 1, baseline_candidate_claim_ids: ['a-stale-claim-id'] } } }),
      resolveResearchGapByTopicFn: async () => { resolveCalled = true; return { ok: true, reason: 'RESOLVED', row: {} }; },
    },
  });
  check('SYNTHESIS_FAILED_PRESERVES_GAP', 'G: final_state is the ordinary NO_OP_SUCCESS for SYNTHESIS_FAILED, unchanged', report.final_state === RUN_FINAL_STATE.NO_OP_SUCCESS, report.final_state);
  check('SYNTHESIS_FAILED_PRESERVES_GAP', 'G: resolveResearchGapByTopic was NEVER called', resolveCalled === false);
  check('SYNTHESIS_FAILED_PRESERVES_GAP', 'G: research_gap_action is not set to RESOLVED (the gap is preserved, untouched)', !report.research_gap_action || report.research_gap_action.action !== 'RESOLVED', JSON.stringify(report.research_gap_action));
}

async function testGapUpsertFailureFailsClosedAsInfraReviewNotUncaughtThrow() {
  // K (CORRECTION 3): a queue WRITE failure must never escape uncaught,
  // must never be reported as if the gap were queued, and must produce
  // a governed INFRA_REVIEW with the normal run report still persistable.
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  const report = await run(FAKE_ENV_WITH_GAP_LOOP_ENABLED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: evidenceInsufficiencySynthesizeFn(topicSlug),
      loadActiveResearchGapsBySlugFn: async () => ({}),
      upsertEvidenceInsufficiencyGapFn: async () => { throw new Error('simulated Supabase upsert failure'); },
    },
  });
  check('QUEUE_WRITE_FAILURE', 'K: final_state is INFRA_REVIEW, never RESEARCH_GAP_QUEUED', report.final_state === RUN_FINAL_STATE.INFRA_REVIEW, report.final_state);
  check('QUEUE_WRITE_FAILURE', 'K: exception_reason names the upsert failure', report.exception_reason.includes('upsert failed') || report.exception_reason.includes('simulated Supabase upsert failure'), report.exception_reason);
  check('QUEUE_WRITE_FAILURE', 'K: research_gap_action was never set to a successful action (the write never actually happened)', !report.research_gap_action, JSON.stringify(report.research_gap_action));
  check('QUEUE_WRITE_FAILURE', 'K: a real, buildable run report was returned -- no uncaught throw escaped runDecisionPipeline', typeof report.run_id === 'string' && report.run_id.length > 0);
}

async function testGapResolveFailureFailsClosedAsInfraReviewNotUncaughtThrow() {
  // L (CORRECTION 3): same fail-closed guarantee for the RESOLVE path
  // (AUTO_READY release) -- and, per "No model retry", the run must stop
  // here rather than continuing on to spend a Writer/Reviewer call.
  const topicSlug = 'androgenetic-alopecia';
  const pool = healthyPoolForSingleTopic(topicSlug);
  let writeFnCalled = false;
  const report = await run(FAKE_ENV_WITH_GAP_LOOP_ENABLED, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async () => fakeIntentResult(topicSlug),
      synthesizeFn: fakeSynthesizeFn(topicSlug), // AUTO_READY
      writeFn: async (env, args) => { writeFnCalled = true; return fakeWriterResult(topicSlug, args.clearedSnapshot); },
      loadActiveResearchGapsBySlugFn: async () => ({ [topicSlug]: { queue_id: `publication_evidence_gap:${topicSlug}`, status: 'pending', extras: { attempt_count: 1, baseline_candidate_claim_ids: ['a-stale-claim-id'] } } }),
      resolveResearchGapByTopicFn: async () => { throw new Error('simulated Supabase resolve failure'); },
    },
  });
  check('QUEUE_WRITE_FAILURE', 'L: final_state is INFRA_REVIEW, never SHADOW_CANDIDATE_READY', report.final_state === RUN_FINAL_STATE.INFRA_REVIEW, report.final_state);
  check('QUEUE_WRITE_FAILURE', 'L: exception_reason names the resolve failure', report.exception_reason.includes('resolve failed') || report.exception_reason.includes('simulated Supabase resolve failure'), report.exception_reason);
  check('QUEUE_WRITE_FAILURE', 'L: no model retry -- the Writer was never called after the queue-write failure', writeFnCalled === false);
  check('QUEUE_WRITE_FAILURE', 'L: a real, buildable run report was returned -- no uncaught throw escaped runDecisionPipeline', typeof report.run_id === 'string' && report.run_id.length > 0);
}

function testResearchGapLoopSafetyInvariants() {
  check('RESEARCH_GAP_SAFETY_INVARIANTS', 'S: AUTOPUBLISH is not enabled in either fake env used by these tests', isAutopublishEnabled(FAKE_ENV_WITH_CRED) === false && isAutopublishEnabled(FAKE_ENV_WITH_GAP_LOOP_ENABLED) === false);
  check('RESEARCH_GAP_SAFETY_INVARIANTS', 'the research-gap loop flag and AUTOPUBLISH are independent -- enabling one never implies the other', isResearchGapLoopEnabled(FAKE_ENV_WITH_GAP_LOOP_ENABLED) === true && isAutopublishEnabled(FAKE_ENV_WITH_GAP_LOOP_ENABLED) === false);
}

const tests = [
  testWeeklyCapBlocksTheWholeRun,
  testWeeklyCapRuntimeThresholds,
  testWeeklyCapCountQueryFailureFailsClosed,
  testPublishedTopicQueryFailureFailsClosed,
  testMissingCredentialIsConfigBlocked,
  testFullShadowCanaryReachesCandidateReady,
  testShadowCanaryStopsOnHighRiskPool,
  testHumanReviewSynthesisStopsCleanly,
  testEditorialReviewFailClosed,
  testWriterPlanFailingDeterministicValidationRoutesToEditorialReview,
  testRepairableNumericParaphraseIsFixedAndReviewerIsInvoked,
  testUnrepairableNumericParaphraseStaysEditorialReviewAndReviewerIsNotInvoked,
  testDynamicPublishedTopicExclusion,
  testFreshnessInvokedAndIndependentOfNewPageLane,
  testPersistClearanceRefusesWithoutAutopublishEnabled,
  testPersistClearanceRefusesWithoutFromPreparedPath,
  testNoCommandCanMarkStatusPublished,
  testUnresolvablePublishedTopicBecomesInfraReviewBeforeAnyModelCall,
  testDuplicateResolvedRouteAlsoBecomesInfraReview,
  testThrownSynthesisExceptionBecomesGovernedInfraReview,
  testThrownConfigErrorClassifiesAsConfigBlocked,
  testGovernedHumanReviewOutcomeIsUnaffectedByTheThrowGuard,
  testPlannerChoosingExistingPublishedSlugFailsAsInfraReview,
  testWriterPlanRouteMismatchFailsAsInfraReviewNotEditorialReview,
  testNormalUnusedRoutePassesEndToEnd,
  testModelCallLedgerReportsFourWhenPublicationEditorMakesOneCall,
  testModelCallLedgerReportsSixWhenPublicationEditorMakesThreeCalls,
  testExceedingTheCeilingCrashesRatherThanSilentlyMisreporting,
  testPrepareRefusesToOverwriteAnExistingArticleFile,
  testPrepareRefusesToOverwriteAnExistingPagePlanArtifact,
  testResumeAtNeedsWriterSkipsIntentPlannerAndPublicationEditor,
  testResumeAtNeedsReviewerSkipsPublicationEditorAndWriter,
  testResumeAtReadyForPrepareMakesZeroModelCallsAndNeverErasesAValidFreshCandidate,
  testRepairedPagePlanPersistsAsTheCanonicalPlanInTheBundle,
  testFreshFramingOnlyFailureRepairsInTheSameRun,
  testFreshFramingRepairRetryStillFailsRoutesToEditorialReview,
  testResumedDurableBundleRepairsWithOneReviewerCallAndReachesShadowCandidateReady,
  testDeterministicRevalidationFailurePreventsReviewerRetry,
  testNonFramingOnlyFailureNeverAttemptsARetryEndToEnd,
  testModelCallCeilingNeverExceededEvenInTheCompoundWorstCase,
  testStaleCandidateDueToNewEvidenceDoesNotResumeAndTriggersFreshSynthesis,
  testFreshnessCheckFailureFailsClosedAsInfraReviewWithoutResumingOrRegenerating,
  testIntegrityFailureFailsClosedAsInfraReviewWithoutResumingOrRegenerating,
  testMalformedBundleFailsClosedAsInfraReviewWithoutResuming,
  testLegacyRunWithNoCandidateBundleStillReachesShadowCandidateReady,
  testAutopublishRemainsFalseAndPublishStillUnimplementedThroughoutResume,
  testSynthesisFailedViolationsReachRunReportAsSanitizedCodes,
  testSynthesisFailedWithNoViolationsProducesAnEmptyArray,
  testHumanReviewStillMapsExactlyAsBeforeWithSanitizedCodesAlsoPresent,
  testEvidenceInsufficiencyWithLoopEnabledCreatesOneGap,
  testRepeatedEvidenceInsufficiencyUpdatesTheSameGapNoDuplicate,
  testEvidenceInsufficiencyWithLoopDisabledPreservesExistingHumanReviewBehavior,
  testUnresolvedContradictionNeverGoesToRickEvenWithLoopEnabled,
  testSafetyOrScopeConcernNeverGoesToRickEvenWithLoopEnabled,
  testAutoReadyResolvesAnExistingEvidenceGap,
  testADifferentHumanReviewReasonAlsoResolvesAnExistingEvidenceGap,
  testSynthesisFailedDoesNotResolveAnActiveResearchGap,
  testGapUpsertFailureFailsClosedAsInfraReviewNotUncaughtThrow,
  testGapResolveFailureFailsClosedAsInfraReviewNotUncaughtThrow,
  testResearchGapLoopSafetyInvariants,
];

for (const t of tests) await t();

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
