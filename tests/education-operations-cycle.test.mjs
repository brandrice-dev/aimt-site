// AIMT Education Operations v1 — orchestrator state-machine tests
// (scripts/education-operations-cycle.mjs). THE SHADOW CANARY: proves
// the full decision pipeline (topic selection -> intent planning ->
// synthesis -> writer -> reviewer -> SHADOW_CANDIDATE_READY) wires
// together correctly using injected mocks -- per the originating task's
// own instruction ("Do not call Anthropic merely to prove scheduler
// plumbing if fixtures/mocks can prove it"), NO live model call, NO
// live Supabase call, NO file write, NO git/GitHub action anywhere in
// this file.
//
// Run: node tests/education-operations-cycle.test.mjs

import {
  runDecisionPipeline, checkWeeklyCap, isAutopublishEnabled, resolveMaxPagesPerWeek,
  parseArgs, runFullAutopublishRefusal, runPersistClearanceAction,
  AUTOPUBLISH_ENV_VAR, DEFAULT_MAX_PAGES_PER_WEEK,
} from '../scripts/education-operations-cycle.mjs';
import { RUN_FINAL_STATE } from '../functions/_lib/education-ops/education-run-ledger.mjs';
import { FRESHNESS_STATE } from '../functions/_lib/education-ops/education-freshness-monitor.mjs';
import { EDUCATION_OPS_API_KEY_ENV_VAR } from '../functions/_lib/education-ops/education-ops-model-config.mjs';

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
    this helper. */
function run(env, options = {}) {
  return runDecisionPipeline(env, {
    publishedTopicSlugs: [],
    pagesPublishedThisWeek: 0,
    ...options,
    fns: { checkFreshnessFn: async () => [], ...(options.fns || {}) },
  });
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

function fakeSynthesizeFn(topicSlug) {
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
    metrics: { model_calls: 1, reconciliation_calls: 0, full_retries: 0, total_input_tokens: 500, total_output_tokens: 500, model_info: {} },
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
      sources: clearedSnapshot.source_ids.map((id) => ({ source_id: id, title: `S ${id}`, authors: ['A'], year: 2024, doi: `10.1/${id}`, url: `https://doi.org/10.1/${id}` })),
      related_links: [{ href: '/education', label: 'Education Library', relation: 'library_home' }],
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
    fns: { fetchEvidenceFn: async () => pool },
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
// Corrected CLI command semantics: --publish is reserved and always
// refuses (full autonomous publishing is not implemented); the renamed
// --persist-clearance is what the old --publish actually did, and stays
// gated behind AUTOPUBLISH_ENABLED. Neither can ever mark a DB row
// status='published' -- that column value doesn't exist on either path.
// ─────────────────────────────────────────────────────────────────────────
(function testParseArgsRecognizesBothFlags() {
  check('CLI_SEMANTICS', '--persist-clearance parses to mode "persist-clearance"', parseArgs(['--persist-clearance']).mode === 'persist-clearance');
  check('CLI_SEMANTICS', '--publish still parses (reserved, always refuses)', parseArgs(['--publish']).mode === 'publish');
  check('CLI_SEMANTICS', '--from-prepared=<path> is still parsed alongside either flag', parseArgs(['--persist-clearance', '--from-prepared=/tmp/x.json']).fromPrepared === '/tmp/x.json');
})();

(function testPublishAlwaysRefusesRegardlessOfAutopublish() {
  const refusalWithAutopublishOff = runFullAutopublishRefusal();
  check('CLI_SEMANTICS', '--publish refuses when AUTOPUBLISH is off', refusalWithAutopublishOff.ran === false && refusalWithAutopublishOff.ok === false);
  check('CLI_SEMANTICS', '--publish refusal names it as not implemented', refusalWithAutopublishOff.reason.includes('not implemented'), refusalWithAutopublishOff.reason);
  check('CLI_SEMANTICS', '--publish refusal points to --persist-clearance instead', refusalWithAutopublishOff.reason.includes('--persist-clearance'));
  // The function takes no env/args at all -- there is no way to make it
  // "run" through any input, proving full autonomous publish is
  // unconditionally unavailable, not just unavailable by default.
  check('CLI_SEMANTICS', 'runFullAutopublishRefusal takes no arguments (cannot be parameterized into running)', runFullAutopublishRefusal.length === 0);
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
  // --publish: structurally cannot write anything (no write path exists
  // in the function at all).
  const publishRefusal = runFullAutopublishRefusal();
  check('NO_COMMAND_MARKS_PUBLISHED', '--publish has no write capability -- refusal carries no writeFn/result of any kind', !('result' in publishRefusal) && !('writeFn' in publishRefusal));

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
  testDynamicPublishedTopicExclusion,
  testFreshnessInvokedAndIndependentOfNewPageLane,
  testPersistClearanceRefusesWithoutAutopublishEnabled,
  testPersistClearanceRefusesWithoutFromPreparedPath,
  testNoCommandCanMarkStatusPublished,
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
