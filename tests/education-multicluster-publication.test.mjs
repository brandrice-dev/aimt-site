// AIMT Education Operations — governed MULTI-CLUSTER publication tests.
// Covers the authoritative publication registry
// (functions/_lib/education-ops/education-publication-registry.mjs) and
// every place it now drives: global topic selection, cluster-aware
// cannibalization, route/hub/sitemap/canonical generation, the Intent
// Planner registry boundary, the generated-diff allowlist, the research-
// gap loop, and the unchanged autonomous publisher.
//
// PURE / NO NETWORK: every evidence pool is synthetic; every model, git,
// GitHub, Supabase, Cloudflare and live-site call is an injected mock.
// Real repo files (hub pages, sitemap.xml, workflow YAML) are only ever
// READ, never written.
//
// Run: node tests/education-multicluster-publication.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  PUBLICATION_CLUSTERS, PUBLICATION_CONCEPTS, CONTROLLED_TOPIC_ACCOUNTING, validatePublicationRegistry,
  getPublicationConcept, publicationRouteFor, clusterForRoute, requirePublicationConcept,
} from '../functions/_lib/education-ops/education-publication-registry.mjs';
import { CONTROLLED_TOPICS } from '../functions/_lib/research/schema.mjs';
import { PILOT_TOPIC_CONCEPTS, selectTopicEvidenceFromRows, fetchTopicEvidenceLive, EVIDENCE_PAGE_SIZE, SOURCE_ID_CHUNK_SIZE } from '../functions/_lib/research/publication-readiness-loader.mjs';
import { selectNextTopic, checkCannibalization } from '../functions/_lib/education-ops/education-topic-selector.mjs';
import { RISK_TIER, READINESS_STATUS } from '../functions/_lib/research/publication-readiness.mjs';
import { validateIntentPlan } from '../functions/_lib/education-ops/education-intent-planner-validator.mjs';
import { buildIntentPlanningInstruction } from '../functions/_lib/education-ops/education-intent-planner-schema.mjs';
import { checkGeneratedDiffAllowlist } from '../functions/_lib/education-ops/education-diff-allowlist.mjs';
import {
  buildHubCardHtml, insertHubCard, resolveHubForRoute, isEmptyHub, hubContainsRoute, HubUpdateError, EMPTY_HUB_ROBOTS_META,
} from '../functions/_lib/education-ops/education-hub-updater.mjs';
import { insertSitemapRoute, sitemapContainsRoute } from '../functions/_lib/education-ops/education-sitemap-updater.mjs';
import { renderEducationPageHtml, GENERATION_MARKER_META_NAME } from '../functions/_lib/education-ops/education-page-renderer.mjs';
import { verifyLivePagePublication } from '../functions/_lib/education-ops/education-publish-verification.mjs';
import { checkRouteNotAlreadyPublished } from '../functions/_lib/education-ops/education-route-guard.mjs';
import { isTopicHeldByResearchGap, buildResearchGapQueueId } from '../functions/_lib/education-ops/education-research-gap-queue.mjs';
import { getPageBuilderRoute } from '../functions/_lib/page-builder/page-builder-route-registry.mjs';
import {
  runDecisionPipeline, runPublicationPipeline, resolveTrustedSiblingPages, educationArticlePathFromRoute,
  resolveMaxPagesPerWeek, isAutopublishEnabled, DEFAULT_MAX_PAGES_PER_WEEK, MAX_PAGES_PER_WEEK_ENV_VAR, AUTOPUBLISH_ENV_VAR,
} from '../scripts/education-operations-cycle.mjs';
import { RUN_FINAL_STATE } from '../functions/_lib/education-ops/education-run-ledger.mjs';
import { FRESHNESS_STATE } from '../functions/_lib/education-ops/education-freshness-monitor.mjs';
import { EDUCATION_OPS_API_KEY_ENV_VAR } from '../functions/_lib/education-ops/education-ops-model-config.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readRepo = (rel) => readFileSync(path.join(REPO_ROOT, rel), 'utf8');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

// ── Synthetic evidence ────────────────────────────────────────────────────
function makeSource(id, overrides = {}) {
  return { source_id: id, title: `Source ${id}`, year: 2024, doi: `10.1/${id}`, evidence_type: 'narrative_review', ...overrides };
}
function makeClaim(id, topics, sourceId, overrides = {}) {
  return { claim_id: id, source_id: sourceId, claim_type: 'finding', claim_text: `Finding ${id}.`, topics: Array.isArray(topics) ? topics : [topics], verification_status: 'CLAIM_VERIFIED', use_status: 'provisional', ...overrides };
}
/** Healthy NEEDS_SYNTHESIS-shaped evidence (systematic-tier source,
    limitation claim, safety_conclusion signal) tagged with `topics`. */
function evidence(prefix, topics, { sources = 2, findings = 3 } = {}) {
  const srcs = Array.from({ length: sources }, (_, i) => makeSource(`${prefix}-s${i + 1}`, i === 0 ? { evidence_type: 'systematic_review' } : {}));
  const claims = [
    makeClaim(`${prefix}-lim`, topics, srcs[0].source_id, { claim_type: 'limitation' }),
    makeClaim(`${prefix}-safety`, topics, srcs[0].source_id, { claim_type: 'safety_conclusion' }),
    ...Array.from({ length: findings }, (_, i) => makeClaim(`${prefix}-f${i}`, topics, srcs[(i + 1) % sources].source_id)),
  ];
  return { claims, sources: srcs };
}
function merge(...pools) {
  return { claims: pools.flatMap((p) => p.claims), sources: pools.flatMap((p) => p.sources) };
}
/** Shaped like the 2026-10-03 BARRIER packet once ingested: 12 sources,
    claims tagged with the controlled vocabulary (some also carrying
    practitioner-safety), a mix of CLAIM_VERIFIED and DISCOVERED. */
function barrierPacketEvidence() {
  const sources = Array.from({ length: 12 }, (_, i) => makeSource(`barrier-s${i + 1}`, i < 2 ? { evidence_type: 'systematic_review' } : {}));
  const tags = [
    ['scalp-health'], ['scalp-health', 'surfactants'], ['surfactants', 'cosmetic-ingredients'], ['cosmetic-ingredients'],
    ['scalp-health', 'practitioner-safety'], ['surfactants'], ['scalp-health'],
  ];
  const verified = tags.map((t, i) => makeClaim(`barrier-c${i + 1}`, t, sources[i % 12].source_id, i === 0 ? { claim_type: 'limitation' } : i === 1 ? { claim_type: 'safety_conclusion' } : {}));
  const discovered = [8, 9, 10].map((n) => makeClaim(`barrier-c${n}`, ['scalp-health'], sources[n % 12].source_id, { verification_status: 'DISCOVERED' }));
  // A claim tagged ONLY with practitioner-safety (outside the concept).
  const safetyOnly = makeClaim('barrier-safety-only', ['practitioner-safety'], sources[11].source_id);
  return { claims: [...verified, ...discovered, safetyOnly], sources };
}

const NONE_PUBLISHED = [];
const LIVE_HAIR_LOSS = ['hair-cycle', 'telogen-effluvium', 'alopecia-areata'];

// ═════════════════════════════════════════════════════════════════════════
// Registry
// ═════════════════════════════════════════════════════════════════════════
(function testRegistryIsValidAndAccountsForEveryControlledTopic() {
  const v = validatePublicationRegistry();
  check('REGISTRY', 'the real registry validates', v.valid, JSON.stringify(v.violations));
  // #8: every CONTROLLED_TOPICS value is deliberately accounted for.
  const unaccounted = CONTROLLED_TOPICS.filter((t) => !(CONTROLLED_TOPIC_ACCOUNTING[t] && CONTROLLED_TOPIC_ACCOUNTING[t].length > 0));
  check('REGISTRY', 'every controlled topic maps to at least one registered concept', unaccounted.length === 0, JSON.stringify(unaccounted));
  check('REGISTRY', 'registry reuses schema.mjs CONTROLLED_TOPICS (no second vocabulary)', PUBLICATION_CONCEPTS.every((c) => c.controlled_topics.every((t) => CONTROLLED_TOPICS.includes(t))));
  check('REGISTRY', 'six public clusters are registered', Object.keys(PUBLICATION_CLUSTERS).length === 6, Object.keys(PUBLICATION_CLUSTERS).join(','));
  // A dropped controlled topic is caught.
  const missing = validatePublicationRegistry(PUBLICATION_CONCEPTS.filter((c) => c.topic_slug !== 'folliculitis'));
  check('REGISTRY', 'removing the only concept for a controlled topic fails validation', !missing.valid && missing.violations.includes('CONTROLLED_TOPIC_UNACCOUNTED:folliculitis'), JSON.stringify(missing.violations));
  const invented = validatePublicationRegistry([...PUBLICATION_CONCEPTS, { topic_slug: 'scalp-detox', seo_page_concept: 'x', controlled_topics: ['scalp-detox'], cluster: 'scalp-health', route_slug: 'scalp-detox', mapping_type: 'direct', autonomously_selectable: true }]);
  check('REGISTRY', 'an uncontrolled topic in a concept fails validation', !invented.valid && invented.violations.includes('UNCONTROLLED_TOPIC:scalp-detox:scalp-detox'), JSON.stringify(invented.violations));
  const unknownCluster = validatePublicationRegistry([...PUBLICATION_CONCEPTS.filter((c) => c.topic_slug !== 'dandruff'), { ...getPublicationConcept('dandruff'), cluster: 'wellness' }]);
  check('REGISTRY', 'an unregistered cluster fails validation', !unknownCluster.valid && unknownCluster.violations.some((v) => v.startsWith('UNKNOWN_CLUSTER:dandruff')), JSON.stringify(unknownCluster.violations));
  const noRationale = validatePublicationRegistry([...PUBLICATION_CONCEPTS.filter((c) => c.topic_slug !== 'scalp-barrier-ph'), { ...getPublicationConcept('scalp-barrier-ph'), mapping_rationale: '' }]);
  check('REGISTRY', 'a constructed concept without a rationale fails validation', !noRationale.valid && noRationale.violations.includes('CONSTRUCTED_MAPPING_WITHOUT_RATIONALE:scalp-barrier-ph'));
})();

(function testPilotConceptsAreAProjectionNotACeiling() {
  check('PILOT_COMPAT', 'PILOT_TOPIC_CONCEPTS still exports the six original hair-loss concepts in order', JSON.stringify(PILOT_TOPIC_CONCEPTS.map((c) => c.topic_slug)) === JSON.stringify(['hair-loss', 'shedding-vs-hair-loss', 'androgenetic-alopecia', 'telogen-effluvium', 'alopecia-areata', 'hair-cycle']));
  check('PILOT_COMPAT', 'PILOT_TOPIC_CONCEPTS is derived from the registry (same controlled topics)', PILOT_TOPIC_CONCEPTS.every((p) => JSON.stringify(p.controlled_topics) === JSON.stringify(getPublicationConcept(p.topic_slug).controlled_topics)));
  check('PILOT_COMPAT', 'the registry holds far more concepts than the pilot list', PUBLICATION_CONCEPTS.length > PILOT_TOPIC_CONCEPTS.length + 10, PUBLICATION_CONCEPTS.length);
})();

// #1 existing Hair Loss pages/routes remain unchanged
(function testExistingHairLossRoutesUnchanged() {
  check('HAIR_LOSS_ROUTES', 'hair-cycle route unchanged', publicationRouteFor('hair-cycle') === '/education/hair-loss/hair-growth-cycle');
  check('HAIR_LOSS_ROUTES', 'telogen-effluvium route unchanged', publicationRouteFor('telogen-effluvium') === '/education/hair-loss/telogen-effluvium');
  check('HAIR_LOSS_ROUTES', 'alopecia-areata route unchanged', publicationRouteFor('alopecia-areata') === '/education/hair-loss/alopecia-areata');
  check('HAIR_LOSS_ROUTES', 'legacy Page Builder registry agrees for hair-cycle', getPageBuilderRoute('hair-cycle').route === publicationRouteFor('hair-cycle'));
  check('HAIR_LOSS_ROUTES', 'legacy Page Builder registry agrees for telogen-effluvium', getPageBuilderRoute('telogen-effluvium').route === publicationRouteFor('telogen-effluvium'));
  const aaArtifact = JSON.parse(readRepo('functions/_data/education-page-plans/alopecia-areata.json'));
  check('HAIR_LOSS_ROUTES', 'alopecia-areata persisted Page Plan route agrees with the registry', aaArtifact.plan.route === publicationRouteFor('alopecia-areata'));
  check('HAIR_LOSS_ROUTES', 'hair-loss cluster keeps route prefix /education/hair-loss and hub education/hair-loss.html', PUBLICATION_CLUSTERS['hair-loss-shedding'].route_prefix === '/education/hair-loss' && PUBLICATION_CLUSTERS['hair-loss-shedding'].hub_file === 'education/hair-loss.html');
  const sitemap = readRepo('sitemap.xml');
  for (const slug of LIVE_HAIR_LOSS) {
    check('HAIR_LOSS_ROUTES', `${slug} is still in sitemap.xml at its existing route`, sitemapContainsRoute(sitemap, publicationRouteFor(slug)));
  }
})();

// #11 / #18 scalp-barrier-ph mapping + route
(function testScalpBarrierMappingAndRoute() {
  const c = requirePublicationConcept('scalp-barrier-ph');
  check('SCALP_BARRIER', 'maps ONLY to scalp-health, cosmetic-ingredients, surfactants', JSON.stringify([...c.controlled_topics].sort()) === JSON.stringify(['cosmetic-ingredients', 'scalp-health', 'surfactants']), JSON.stringify(c.controlled_topics));
  check('SCALP_BARRIER', 'does NOT include practitioner-safety (HIGH baseline would forbid autonomy)', !c.controlled_topics.includes('practitioner-safety'));
  check('SCALP_BARRIER', 'is a constructed concept with an explicit rationale', c.mapping_type !== 'direct' && c.mapping_rationale.length > 100);
  check('SCALP_BARRIER', 'page concept seed is the governed title', c.seo_page_concept === 'Scalp Barrier and pH: A Practitioner Education Overview');
  check('SCALP_BARRIER', 'cluster is scalp-health', c.cluster === 'scalp-health');
  check('SCALP_BARRIER', '#18 route is /education/scalp-health/scalp-barrier-ph', publicationRouteFor('scalp-barrier-ph') === '/education/scalp-health/scalp-barrier-ph');
  // Evidence selection uses exactly those tags: a practitioner-safety-only
  // claim never enters the candidate pool.
  const selected = selectTopicEvidenceFromRows(c.controlled_topics, barrierPacketEvidence());
  check('SCALP_BARRIER', 'a practitioner-safety-ONLY claim is not candidate evidence', !selected.claims.some((cl) => cl.claim_id === 'barrier-safety-only'));
  check('SCALP_BARRIER', 'a claim tagged scalp-health + practitioner-safety IS candidate evidence', selected.claims.some((cl) => cl.claim_id === 'barrier-c5'));
})();

// #19 + other example routes
(function testRegistryRoutes() {
  check('ROUTES', '#19 massage-circulation -> /education/head-spa-techniques/massage-circulation', publicationRouteFor('massage-circulation') === '/education/head-spa-techniques/massage-circulation');
  check('ROUTES', 'surfactants -> /education/product-science/surfactants', publicationRouteFor('surfactants') === '/education/product-science/surfactants');
  check('ROUTES', 'infection-control -> /education/safety/infection-control', publicationRouteFor('infection-control') === '/education/safety/infection-control');
  let threw = false;
  try { publicationRouteFor('scalp-detox-secrets'); } catch (_e) { threw = true; }
  check('ROUTES', 'no route is ever computed for an unregistered topic', threw);
  check('ROUTES', 'clusterForRoute rejects a nested/unregistered path', clusterForRoute('/education/scalp-health/a/b') === null && clusterForRoute('/education/wellness/x') === null);
})();

// ═════════════════════════════════════════════════════════════════════════
// Global selection
// ═════════════════════════════════════════════════════════════════════════
(function testSelectorEvaluatesMultipleClustersAndReturnsAtMostOne() {
  const pool = merge(evidence('aga', 'androgenetic-alopecia'), evidence('mc', 'massage-circulation'), evidence('surf', 'surfactants'));
  const r = selectNextTopic(pool, { publishedTopicSlugs: LIVE_HAIR_LOSS });
  const clusters = new Set(r.candidates.map((c) => c.cluster));
  check('GLOBAL_SELECTION', '#2 candidates span more than one cluster', clusters.size >= 5, [...clusters].join(','));
  check('GLOBAL_SELECTION', '#2 every registered cluster was evaluated', r.clusters_evaluated.length === Object.keys(PUBLICATION_CLUSTERS).length);
  check('GLOBAL_SELECTION', '#3 exactly one topic selected (never more)', r.selected && typeof r.selected.topic_slug === 'string' && !Array.isArray(r.selected));
  check('GLOBAL_SELECTION', 'more than one candidate was eligible (so "one" was a choice)', r.candidates.filter((c) => c.eligible).length >= 2, r.candidates.filter((c) => c.eligible).map((c) => c.topic_slug).join(','));
  check('GLOBAL_SELECTION', 'non-selectable concepts are never candidates', !r.candidates.some((c) => c.topic_slug === 'adjacent-dermatology'));
  check('GLOBAL_SELECTION', 'opportunity signal stays labeled SEARCH_OPPORTUNITY_HEURISTIC', r.candidates.every((c) => c.opportunity.signal_type === 'SEARCH_OPPORTUNITY_HEURISTIC'));
  const r2 = selectNextTopic(pool, { publishedTopicSlugs: LIVE_HAIR_LOSS });
  check('GLOBAL_SELECTION', 'deterministic: identical input -> identical selection', r2.selected.topic_slug === r.selected.topic_slug);
})();

(function testDeterministicTieBreakAcrossClusters() {
  // Identically-shaped evidence -> identical scores -> topic_slug order.
  const pool = merge(evidence('t1', 'surfactants'), evidence('t2', 'massage-circulation'));
  const r = selectNextTopic(pool, { publishedTopicSlugs: NONE_PUBLISHED });
  const eligible = r.candidates.filter((c) => c.eligible).map((c) => c.topic_slug);
  check('TIE_BREAK', 'scores tie and lexicographic topic_slug wins (massage-circulation < scalp-barrier-ph < surfactants)', r.selected.topic_slug === [...eligible].sort()[0] || r.selected.opportunity.score > r.candidates.find((c) => c.topic_slug === [...eligible].sort()[0]).opportunity.score, `${r.selected.topic_slug} from ${eligible.join(',')}`);
})();

// #4 a Scalp Health candidate can beat a Hair Loss candidate
(function testScalpHealthBeatsHairLoss() {
  const pool = merge(evidence('aga', 'androgenetic-alopecia', { sources: 2 }), evidence('micro', 'scalp-microbiome', { sources: 8, findings: 10 }));
  const r = selectNextTopic(pool, { publishedTopicSlugs: LIVE_HAIR_LOSS });
  const aga = r.candidates.find((c) => c.topic_slug === 'androgenetic-alopecia');
  check('SCALP_BEATS_HAIR_LOSS', 'hair-loss candidate is eligible', aga.eligible, aga.ineligible_reason);
  check('SCALP_BEATS_HAIR_LOSS', 'scalp-health cluster candidate is selected over it', r.selected.cluster === 'scalp-health' && r.selected.topic_slug === 'scalp-microbiome', r.selected.topic_slug);
  check('SCALP_BEATS_HAIR_LOSS', 'selection reason names the winner and its cluster', r.selection_reason.includes('scalp-microbiome') && r.selection_reason.includes('scalp-health'));
})();

// #5 Product Science candidate can be selected
(function testProductScienceSelectable() {
  const r = selectNextTopic(evidence('cond', 'conditioning-agents', { sources: 4 }), { publishedTopicSlugs: LIVE_HAIR_LOSS });
  check('PRODUCT_SCIENCE', 'conditioning-agents (Product Science) selected', r.selected && r.selected.topic_slug === 'conditioning-agents' && r.selected.cluster === 'product-science', r.selected && r.selected.topic_slug);
})();

// #6 / #14 Head Spa Techniques candidate / massage-circulation
(function testHeadSpaSelectable() {
  // Shaped like the 2026-10-02 scalp massage / microcirculation packet.
  const r = selectNextTopic(evidence('massage', 'massage-circulation', { sources: 5 }), { publishedTopicSlugs: LIVE_HAIR_LOSS });
  const mc = r.candidates.find((c) => c.topic_slug === 'massage-circulation');
  check('HEAD_SPA', '#14 massage-circulation is an eligible concept', mc && mc.eligible && mc.v1_result.risk_tier === RISK_TIER.MODERATE, mc && mc.ineligible_reason);
  check('HEAD_SPA', '#6 it is selected in head-spa-techniques', r.selected && r.selected.topic_slug === 'massage-circulation' && r.selected.cluster === 'head-spa-techniques');
})();

// #7 HIGH risk stays ineligible
(function testHighRiskNeverAutonomous() {
  const pool = merge(
    evidence('minox', 'actives-minoxidil', { sources: 12, findings: 20 }),
    evidence('ic', 'infection-control', { sources: 12, findings: 20 }),
    evidence('ci', 'contraindications', { sources: 12, findings: 20 }),
  );
  const r = selectNextTopic(pool, { publishedTopicSlugs: LIVE_HAIR_LOSS });
  for (const slug of ['actives-minoxidil', 'infection-control', 'contraindications', 'practitioner-safety', 'actives-other']) {
    const c = r.candidates.find((x) => x.topic_slug === slug);
    check('HIGH_RISK', `${slug} is evaluated and ineligible as HIGH_RISK_NEVER_AUTONOMOUS`, c && !c.eligible && c.ineligible_reason === 'HIGH_RISK_NEVER_AUTONOMOUS', c && c.ineligible_reason);
  }
  check('HIGH_RISK', 'with only HIGH-risk evidence deep enough, nothing is selected', r.selected === null, r.selected && r.selected.topic_slug);
})();

// #8 HUMAN_REVIEW stays ineligible
(function testHumanReviewNeverAutonomous() {
  const pool = evidence('surf', 'surfactants', { sources: 6 });
  pool.claims.push(makeClaim('surf-flagged', 'surfactants', 'surf-s1', { use_status: 'needs_review' }));
  const r = selectNextTopic(pool, { publishedTopicSlugs: LIVE_HAIR_LOSS });
  const c = r.candidates.find((x) => x.topic_slug === 'surfactants');
  check('HUMAN_REVIEW', 'surfactants with a needs_review claim is HUMAN_REVIEW_NEVER_AUTONOMOUS', c.v1_result.readiness_status === READINESS_STATUS.HUMAN_REVIEW && !c.eligible && c.ineligible_reason === 'HUMAN_REVIEW_NEVER_AUTONOMOUS', c.ineligible_reason);
})();

// #9 published topic remains excluded
(function testPublishedExcluded() {
  const pool = merge(evidence('mc', 'massage-circulation'), evidence('surf', 'surfactants'));
  const r = selectNextTopic(pool, { publishedTopicSlugs: [...LIVE_HAIR_LOSS, 'massage-circulation'] });
  check('PUBLISHED_EXCLUDED', 'a published new-cluster topic never appears as a candidate', !r.candidates.some((c) => c.topic_slug === 'massage-circulation'));
  check('PUBLISHED_EXCLUDED', 'published hair-loss topics never appear either', !r.candidates.some((c) => LIVE_HAIR_LOSS.includes(c.topic_slug)));
})();

// #10 research-gap hold outside Hair Loss
(function testResearchGapHoldOutsideHairLoss() {
  const pool = merge(evidence('barrier', ['scalp-health', 'surfactants', 'cosmetic-ingredients'], { sources: 9, findings: 12 }), evidence('mc', 'massage-circulation'));
  const before = selectNextTopic(pool, { publishedTopicSlugs: LIVE_HAIR_LOSS });
  const baseline = before.candidates.find((c) => c.topic_slug === 'scalp-barrier-ph').v1_result.candidate_claim_ids;
  const gaps = { 'scalp-barrier-ph': { queue_id: buildResearchGapQueueId('scalp-barrier-ph'), status: 'pending', extras: { baseline_candidate_claim_ids: baseline } } };
  const r = selectNextTopic(pool, { publishedTopicSlugs: LIVE_HAIR_LOSS, activeResearchGapsBySlug: gaps });
  const barrier = r.candidates.find((c) => c.topic_slug === 'scalp-barrier-ph');
  check('RESEARCH_GAP_CROSS_CLUSTER', 'gap queue id is publication_evidence_gap:scalp-barrier-ph', buildResearchGapQueueId('scalp-barrier-ph') === 'publication_evidence_gap:scalp-barrier-ph');
  check('RESEARCH_GAP_CROSS_CLUSTER', 'scalp-barrier-ph is held RESEARCH_GAP_PENDING', !barrier.eligible && barrier.ineligible_reason === 'RESEARCH_GAP_PENDING', barrier.ineligible_reason);
  check('RESEARCH_GAP_CROSS_CLUSTER', 'the selector moves on to another eligible concept', r.selected && r.selected.topic_slug !== 'scalp-barrier-ph', r.selected && r.selected.topic_slug);
  // Released once the candidate claim set changes (new research arrived).
  check('RESEARCH_GAP_CROSS_CLUSTER', 'hold releases when the claim set changes', !isTopicHeldByResearchGap(gaps['scalp-barrier-ph'], [...baseline, 'new-claim']));
})();

// #12 / #13 BARRIER evidence
(function testBarrierEvidenceMakesConceptEvaluableButDoesNotBypassReadiness() {
  const pool = barrierPacketEvidence();
  const r = selectNextTopic(pool, { publishedTopicSlugs: LIVE_HAIR_LOSS });
  const barrier = r.candidates.find((c) => c.topic_slug === 'scalp-barrier-ph');
  check('BARRIER', '#12 scalp-barrier-ph is evaluated from BARRIER-style evidence', !!barrier && barrier.v1_result.metrics.candidate_claim_count >= 7, barrier && barrier.v1_result.metrics.candidate_claim_count);
  check('BARRIER', 'DISCOVERED claims never count as candidates', !barrier.v1_result.candidate_claim_ids.some((id) => ['barrier-c8', 'barrier-c9', 'barrier-c10'].includes(id)));
  check('BARRIER', 'risk is MODERATE (not HIGH)', barrier.v1_result.risk_tier === RISK_TIER.MODERATE, barrier.v1_result.risk_tier);
  check('BARRIER', 'readiness engine still decides (NEEDS_SYNTHESIS here, never auto-publish)', barrier.v1_result.readiness_status === READINESS_STATUS.NEEDS_SYNTHESIS, barrier.v1_result.readiness_status);
  check('BARRIER', 'no candidate is named after a packet title', !r.candidates.some((c) => /barrier-packet|AIMT-RF/i.test(c.topic_slug)));

  // #13: the same packet with no limitation claim -> NOT_READY, ineligible.
  const thin = barrierPacketEvidence();
  thin.claims = thin.claims.filter((c) => c.claim_type !== 'limitation');
  const r2 = selectNextTopic(thin, { publishedTopicSlugs: LIVE_HAIR_LOSS });
  const b2 = r2.candidates.find((c) => c.topic_slug === 'scalp-barrier-ph');
  check('BARRIER', '#13 BARRIER evidence alone does not bypass readiness (missing limitations -> ineligible)', !b2.eligible && ['NOT_READY_SKIP', 'EVIDENCE_GAPS_SKIP'].includes(b2.ineligible_reason), b2.ineligible_reason);
  // Single-source evidence also fails the corroboration floor.
  const oneSource = { claims: barrierPacketEvidence().claims.map((c) => ({ ...c, source_id: 'barrier-s1' })), sources: [makeSource('barrier-s1', { evidence_type: 'systematic_review' })] };
  const b3 = selectNextTopic(oneSource, { publishedTopicSlugs: LIVE_HAIR_LOSS }).candidates.find((c) => c.topic_slug === 'scalp-barrier-ph');
  check('BARRIER', 'single-source BARRIER evidence is ineligible (corroboration floor unchanged)', !b3.eligible, b3.ineligible_reason);
})();

// ═════════════════════════════════════════════════════════════════════════
// Cluster-aware cannibalization
// ═════════════════════════════════════════════════════════════════════════
(function testCrossClusterSharedEvidenceIsNotCannibalization() {
  const surfactants = getPublicationConcept('surfactants');
  const r = checkCannibalization(surfactants, [...LIVE_HAIR_LOSS, 'scalp-barrier-ph']);
  check('CANNIBALIZATION', '#15 Product Science surfactants is NOT blocked by a live Scalp Health scalp-barrier-ph page', !r.cannibalizes, JSON.stringify(r));
  check('CANNIBALIZATION', '#15 the shared evidence is reported for observability', r.shared_evidence_with.includes('scalp-barrier-ph'));
  // And the reverse: barrier is not blocked by live product-science pages.
  const barrier = getPublicationConcept('scalp-barrier-ph');
  const r2 = checkCannibalization(barrier, ['surfactants', 'cosmetic-ingredients', 'scalp-health']);
  check('CANNIBALIZATION', '#15 scalp-barrier-ph is NOT blocked by live surfactants + cosmetic-ingredients (other cluster) + scalp-health', !r2.cannibalizes, JSON.stringify(r2));
  // A direct page is never blocked by a BROADER constructed page in its cluster.
  const sh = getPublicationConcept('scalp-health');
  const r3 = checkCannibalization(sh, ['scalp-barrier-ph']);
  check('CANNIBALIZATION', 'direct scalp-health is NOT blocked by a broader live scalp-barrier-ph', !r3.cannibalizes, JSON.stringify(r3));
  // End to end through the selector.
  const pool = merge(evidence('surf', 'surfactants', { sources: 4 }));
  const sel = selectNextTopic(pool, { publishedTopicSlugs: [...LIVE_HAIR_LOSS, 'scalp-barrier-ph'] });
  check('CANNIBALIZATION', '#15 selector still selects surfactants', sel.selected && sel.selected.topic_slug === 'surfactants', sel.selected && sel.selected.topic_slug);
})();

(function testTrueSameIntentCannibalizationStillBlocks() {
  const svh = getPublicationConcept('shedding-vs-hair-loss');
  const r = checkCannibalization(svh, ['hair-cycle', 'telogen-effluvium']);
  check('CANNIBALIZATION', '#16 shedding-vs-hair-loss is still blocked (composed of two live same-cluster pages)', r.cannibalizes && r.basis === 'SAME_CLUSTER_COMPOSITION', JSON.stringify(r));
  const pool = merge(evidence('te', 'telogen-effluvium'), evidence('hc', 'hair-cycle'));
  const sel = selectNextTopic(pool, { publishedTopicSlugs: ['hair-cycle', 'telogen-effluvium'] });
  const c = sel.candidates.find((x) => x.topic_slug === 'shedding-vs-hair-loss');
  check('CANNIBALIZATION', '#16 selector marks it CANNIBALIZES_PUBLISHED', c && !c.eligible && c.ineligible_reason.startsWith('CANNIBALIZES_PUBLISHED'), c && c.ineligible_reason);
  // Identical intent registered in a different cluster (synthetic registry).
  const synthetic = [...PUBLICATION_CONCEPTS, { topic_slug: 'scalp-massage-technique', seo_page_concept: 'x', controlled_topics: ['massage-circulation'], cluster: 'scalp-health', route_slug: 'scalp-massage-technique', mapping_type: 'constructed_test', mapping_rationale: 'test', autonomously_selectable: true }];
  const r2 = checkCannibalization(synthetic.at(-1), ['massage-circulation'], { concepts: synthetic });
  check('CANNIBALIZATION', '#16 an identical controlled-topic set in ANY cluster is IDENTICAL_INTENT', r2.cannibalizes && r2.basis === 'IDENTICAL_INTENT', JSON.stringify(r2));
  check('CANNIBALIZATION', 'the registry itself refuses to register such a duplicate', !validatePublicationRegistry(synthetic).valid);
})();

// ═════════════════════════════════════════════════════════════════════════
// Hubs, sitemap, canonical, route collision, allowlist
// ═════════════════════════════════════════════════════════════════════════
function planFor(topicSlug) {
  const u = (kind, text, ids = [], stmts = []) => ({ kind, text, supporting_claim_ids: ids, source_statements: stmts });
  const concept = getPublicationConcept(topicSlug);
  return {
    topic_slug: topicSlug, cluster: concept.cluster, route: publicationRouteFor(topicSlug),
    title: `${concept.seo_page_concept} | AIMT`, meta_description: 'About it.', h1: concept.seo_page_concept,
    answer_summary: u('VERBATIM', 'A finding.', ['c1'], ['A finding.']),
    sections: [{ section_id: 'overview', heading: 'Overview', units: [u('FRAMING', 'This matters.')] }],
    scope_note: 'Scope.', limitations: [u('VERBATIM', 'Limited.', ['c2'], ['Limited.'])],
    key_takeaways: [u('VERBATIM', 'A finding.', ['c1'], ['A finding.'])],
    sources: [{ source_id: 's1', title: 'Ref', authors: ['A'], year: 2023, doi: '10.1/x', url: 'https://doi.org/10.1/x' }],
    related_links: [{ href: PUBLICATION_CLUSTERS[concept.cluster].route_prefix, label: 'Hub', relation: 'topic_hub' }],
    visual_recommendation: { recommendation: 'NONE', rationale: 'Prose.' },
  };
}

(function testHubRoutingTargetsCorrectHub() {
  const route = publicationRouteFor('scalp-barrier-ph');
  const hub = resolveHubForRoute(route);
  check('HUB', '#20 scalp-barrier-ph resolves to education/scalp-health.html', hub.hubFile === 'education/scalp-health.html' && hub.hubRoute === '/education/scalp-health' && hub.clusterKey === 'scalp-health');
  check('HUB', '#20 massage-circulation resolves to education/head-spa-techniques.html', resolveHubForRoute(publicationRouteFor('massage-circulation')).hubFile === 'education/head-spa-techniques.html');
  check('HUB', '#20 existing hair-loss route still resolves to education/hair-loss.html', resolveHubForRoute('/education/hair-loss/alopecia-areata').hubFile === 'education/hair-loss.html');
  let threw = false;
  try { resolveHubForRoute('/education/wellness/scalp-detox'); } catch (e) { threw = e instanceof HubUpdateError; }
  check('HUB', 'an unregistered route never resolves to a hub', threw);

  // Every registered hub file exists, carries its own canonical, and has the card grid.
  for (const cluster of Object.values(PUBLICATION_CLUSTERS)) {
    const html = readRepo(cluster.hub_file);
    check('HUB', `${cluster.hub_file} exists with canonical ${cluster.route_prefix}`, html.includes(`<link rel="canonical" href="https://aimtrichology.com${cluster.route_prefix}">`));
    check('HUB', `${cluster.hub_file} has the shared card grid`, html.includes('<ul class="aimt-edu-card-grid">'));
    check('HUB', `${cluster.hub_file} uses the existing Education stylesheet (no new design)`, html.includes('/assets/css/aimt-education.css'));
  }
  check('HUB', 'existing hair-loss hub is NOT marked empty/noindex', !isEmptyHub(readRepo('education/hair-loss.html')));

  // Insert into the real (read-only) Scalp Health hub contents.
  const hubHtml = readRepo('education/scalp-health.html');
  check('HUB', 'new Scalp Health hub starts empty (noindex, follow)', isEmptyHub(hubHtml));
  const card = buildHubCardHtml({ route, h1: 'Scalp Barrier and pH', meta_description: 'About the barrier.', sourceCount: 9 });
  const updated = insertHubCard(hubHtml, card, { hubRoute: hub.hubRoute });
  check('HUB', 'card inserted into the scalp-health hub', hubContainsRoute(updated, route));
  check('HUB', 'first card removes the empty-hub noindex marker (hub becomes indexable)', !isEmptyHub(updated) && !updated.includes('noindex') && !updated.includes(EMPTY_HUB_ROBOTS_META));
  let dup = false;
  try { insertHubCard(updated, card, { hubRoute: hub.hubRoute }); } catch (e) { dup = e instanceof HubUpdateError; }
  check('HUB', 'no duplicate card', dup);
  let cross = false;
  try { insertHubCard(readRepo('education/hair-loss.html'), card, { hubRoute: '/education/hair-loss' }); } catch (e) { cross = e instanceof HubUpdateError && /cross-cluster/.test(e.message); }
  check('HUB', 'no cross-cluster insertion (scalp card refused by hair-loss hub)', cross);
  let wrongFile = false;
  try { insertHubCard(readRepo('education/product-science.html'), card, { hubRoute: '/education/scalp-health' }); } catch (e) { wrongFile = e instanceof HubUpdateError && /canonical/.test(e.message); }
  check('HUB', 'a hub file whose canonical belongs to another cluster is refused', wrongFile);
})();

(function testSitemapAndCanonical() {
  const route = publicationRouteFor('scalp-barrier-ph');
  const sitemap = readRepo('sitemap.xml');
  check('SITEMAP', 'route not yet in sitemap.xml (nothing published during implementation)', !sitemapContainsRoute(sitemap, route));
  const updated = insertSitemapRoute(sitemap, route);
  check('SITEMAP', '#21 sitemap receives /education/scalp-health/scalp-barrier-ph', updated.includes('<loc>https://aimtrichology.com/education/scalp-health/scalp-barrier-ph</loc>'));
  check('SITEMAP', 'empty new hubs are not in sitemap.xml yet', Object.values(PUBLICATION_CLUSTERS).filter((c) => c.key !== 'hair-loss-shedding').every((c) => !sitemapContainsRoute(sitemap, c.route_prefix)));

  const html = renderEducationPageHtml(planFor('scalp-barrier-ph'), { launchReady: true, generationSourceHash: 'gsh-barrier' });
  check('CANONICAL', '#22 canonical uses the scalp-health route', html.includes('<link rel="canonical" href="https://aimtrichology.com/education/scalp-health/scalp-barrier-ph">'));
  check('CANONICAL', 'generation-source hash marker present', html.includes(`<meta name="${GENERATION_MARKER_META_NAME}" content="gsh-barrier">`));
  check('CANONICAL', 'launch-ready page has no noindex', !html.includes('noindex'));
  check('CANONICAL', 'repo file path follows the route', educationArticlePathFromRoute(route) === 'education/scalp-health/scalp-barrier-ph.html');

  const hubAfter = insertHubCard(readRepo('education/scalp-health.html'), buildHubCardHtml({ route, h1: 'x', meta_description: 'y', sourceCount: 1 }), { hubRoute: '/education/scalp-health' });
  const live = verifyLivePagePublication({ httpStatus: 200, html, sitemapXml: updated, hubHtml: hubAfter, expectedRoute: route, expectedGenerationSourceHash: 'gsh-barrier' });
  check('LIVE_VERIFY', 'the unchanged live verifier passes for a new-cluster page', live.ok, JSON.stringify(live.violations));
  const liveWrongHub = verifyLivePagePublication({ httpStatus: 200, html, sitemapXml: updated, hubHtml: readRepo('education/hair-loss.html'), expectedRoute: route, expectedGenerationSourceHash: 'gsh-barrier' });
  check('LIVE_VERIFY', 'live verification fails if the card is not in the correct hub', !liveWrongHub.ok && liveWrongHub.violations.includes('HUB_MISSING_ROUTE'));
})();

(function testRouteCollisionAcrossClusters() {
  const allPublished = resolveTrustedSiblingPages(LIVE_HAIR_LOSS, null);
  check('ROUTE_COLLISION', 'trusted resolution across all clusters succeeds for the live set', allPublished.ok, JSON.stringify(allPublished.violations));
  check('ROUTE_COLLISION', 'resolved pages carry their registered cluster', allPublished.ok && allPublished.pages.every((p) => p.cluster === 'hair-loss-shedding'));
  const routes = allPublished.pages.map((p) => p.route);
  check('ROUTE_COLLISION', '#23 guard blocks a live hair-loss route', !checkRouteNotAlreadyPublished('/education/hair-loss/telogen-effluvium', routes).valid);
  // A live new-cluster page (synthetic trusted artifact) blocks its route too.
  const io = { readArtifactFn: (slug) => (['massage-circulation', 'alopecia-areata'].includes(slug) ? { ok: true, route: publicationRouteFor(slug), h1: slug } : { ok: false, reason: 'missing' }) };
  const mixed = resolveTrustedSiblingPages([...LIVE_HAIR_LOSS, 'massage-circulation'], null, io);
  check('ROUTE_COLLISION', 'resolution spans clusters', mixed.ok && mixed.pages.some((p) => p.cluster === 'head-spa-techniques'), JSON.stringify(mixed));
  check('ROUTE_COLLISION', '#23 guard blocks a live head-spa route', !checkRouteNotAlreadyPublished('/education/head-spa-techniques/massage-circulation', mixed.pages.map((p) => p.route)).valid);
  check('ROUTE_COLLISION', '#23 guard allows an unused scalp-health route', checkRouteNotAlreadyPublished('/education/scalp-health/scalp-barrier-ph', mixed.pages.map((p) => p.route)).valid);
  // A live page in another cluster claiming the same route fails closed.
  const dupIo = { readArtifactFn: (slug) => ({ ok: true, route: '/education/hair-loss/telogen-effluvium', h1: slug }) };
  const dupe = resolveTrustedSiblingPages(['telogen-effluvium', 'massage-circulation'], null, dupIo);
  check('ROUTE_COLLISION', 'two published topics in different clusters sharing a route fail closed', !dupe.ok && dupe.violations.some((v) => v.startsWith('DUPLICATE_PUBLISHED_ROUTE')), JSON.stringify(dupe));
  const unresolvable = resolveTrustedSiblingPages(['massage-circulation'], null, { readArtifactFn: () => ({ ok: false, reason: 'missing' }) });
  check('ROUTE_COLLISION', 'a published new-cluster topic with no trusted route fails closed', !unresolvable.ok);
})();

(function testDiffAllowlist() {
  const legit = checkGeneratedDiffAllowlist([
    'education/scalp-health/scalp-barrier-ph.html', 'education/scalp-health.html', 'sitemap.xml',
    'functions/_data/education-page-plans/scalp-barrier-ph.json',
    'education/head-spa-techniques/massage-circulation.html', 'education/head-spa-techniques.html',
    'education/hair-loss/androgenetic-alopecia.html', 'education/hair-loss.html',
  ]);
  check('ALLOWLIST', '#27 legitimate new-cluster artifacts are allowed', legit.valid, JSON.stringify(legit.violations));
  const bad = checkGeneratedDiffAllowlist(['education/wellness/scalp-detox.html', 'education/wellness.html', 'education.html', 'education/scalp-health/nested/x.html', 'education/scalp-health/Bad_Name.html', 'assets/css/aimt-education.css']);
  check('ALLOWLIST', '#27 unregistered sections, the library index, nested paths and CSS are violations', !bad.valid && bad.violations.length === 6, JSON.stringify(bad.violations));
})();

// ═════════════════════════════════════════════════════════════════════════
// Intent Planner registry boundary
// ═════════════════════════════════════════════════════════════════════════
function intentPlan(overrides = {}) {
  return {
    topic_slug: 'scalp-barrier-ph', page_concept: 'Scalp Barrier and pH', public_intent: 'Explain the scalp barrier and surface pH for practitioners.',
    route_slug: 'scalp-barrier-ph', in_scope_concepts: ['what the acid mantle is', 'how cleansers interact with the barrier'],
    out_of_scope_concepts: ['diagnosis of an individual case', 'treatment or medication protocols'],
    practitioner_relevance: 'Helps a practitioner choose gentle cleansing.', cluster: 'scalp-health', risk_context: 'MODERATE: educational posture.',
    ...overrides,
  };
}
(function testIntentPlannerBoundary() {
  const ctx = { expectedTopicSlug: 'scalp-barrier-ph', expectedCluster: 'scalp-health' };
  const ok = validateIntentPlan(intentPlan(), ctx);
  check('INTENT_BOUNDARY', '#24 planner may plan an approved registry topic', ok.valid, JSON.stringify(ok.violations));
  const unreg = validateIntentPlan(intentPlan({ topic_slug: 'scalp-detox', route_slug: 'scalp-detox' }), { expectedTopicSlug: 'scalp-detox', expectedCluster: 'scalp-health' });
  check('INTENT_BOUNDARY', '#25 an unregistered topic is rejected', !unreg.valid && unreg.violations.includes('UNREGISTERED_PUBLICATION_CONCEPT'), JSON.stringify(unreg.violations));
  const route = validateIntentPlan(intentPlan({ route_slug: 'acid-mantle-secrets' }), ctx);
  check('INTENT_BOUNDARY', '#25 a planner-invented route is rejected', !route.valid && route.violations.includes('ROUTE_SLUG_NOT_REGISTERED'), JSON.stringify(route.violations));
  const cluster = validateIntentPlan(intentPlan({ cluster: 'wellness' }), { expectedTopicSlug: 'scalp-barrier-ph', expectedCluster: 'wellness' });
  check('INTENT_BOUNDARY', '#25 a new institutional cluster is rejected', !cluster.valid && cluster.violations.includes('CLUSTER_NOT_REGISTERED_FOR_TOPIC'), JSON.stringify(cluster.violations));
  // #26: the pre-existing deterministic rules still fail closed.
  const numeric = validateIntentPlan(intentPlan({ public_intent: 'Scalp pH is about 5.5.' }), ctx);
  check('INTENT_BOUNDARY', '#26 numeric scope still rejected', !numeric.valid && numeric.violations.includes('UNSUPPORTED_SCOPE_CONTAINS_NUMERIC_CLAIM'));
  const noDx = validateIntentPlan(intentPlan({ out_of_scope_concepts: ['treatment protocols'] }), ctx);
  check('INTENT_BOUNDARY', '#26 missing diagnosis exclusion still rejected', !noDx.valid && noDx.violations.includes('OUT_OF_SCOPE_MISSING_DIAGNOSIS_EXCLUSION'));
  const shape = validateIntentPlan({ topic_slug: 'scalp-barrier-ph' }, ctx);
  check('INTENT_BOUNDARY', '#26 malformed plan still rejected', !shape.valid && shape.shapeValid === false);
  const prompt = buildIntentPlanningInstruction({ topicSlug: 'scalp-barrier-ph', seoPageConcept: 'x', riskTier: 'MODERATE', cluster: 'scalp-health', routePrefix: '/education/scalp-health', registeredRouteSlug: 'scalp-barrier-ph', candidateEvidenceInventory: [], existingClusterPages: [] });
  check('INTENT_BOUNDARY', 'planner prompt instructs echoing the registered route_slug', prompt.includes('echo EXACTLY "scalp-barrier-ph"'));
})();

// ═════════════════════════════════════════════════════════════════════════
// Orchestrator (decision pipeline) -- fully mocked
// ═════════════════════════════════════════════════════════════════════════
const FAKE_ENV = { [EDUCATION_OPS_API_KEY_ENV_VAR]: 'fake-not-a-real-key', SUPABASE_URL: 'https://example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fake' };
const FAKE_ENV_GAP_LOOP = { ...FAKE_ENV, AIMT_RESEARCH_GAP_LOOP_ENABLED: 'true' };

function runPipeline(env, options = {}) {
  return runDecisionPipeline(env, {
    publishedTopicSlugs: LIVE_HAIR_LOSS, pagesPublishedThisWeek: 0, ...options,
    fns: {
      checkFreshnessFn: async () => [],
      loadCandidateBundleFn: () => ({ found: false, bundle: null }),
      writeCandidateBundleFn: () => {},
      ...(options.fns || {}),
    },
  });
}
function intentFromArgs(args, overrides = {}) {
  return {
    ok: true, usage: { input_tokens: 10, output_tokens: 10 },
    output: {
      topic_slug: args.topicSlug, page_concept: args.seoPageConcept, public_intent: `Explain ${args.topicSlug} for practitioners.`,
      route_slug: args.registeredRouteSlug, in_scope_concepts: ['general concepts'], out_of_scope_concepts: ['diagnosis of an individual case', 'treatment or medication protocols'],
      practitioner_relevance: 'Relevant.', cluster: args.cluster, risk_context: 'MODERATE: educational.', ...overrides,
    },
  };
}
function synthesizeFor(prefix, topicSlug) {
  return async () => ({
    status: 'AUTO_READY', stage: 'initial', reason: 'validated',
    finalOutput: {
      topic_slug: topicSlug, page_concept: `${topicSlug} Overview`, recommended_disposition: 'AUTO_READY', confidence: 'high',
      page_scope: { include: ['x'], exclude: ['treatment'] },
      selected_claims: [{ claim_id: `${prefix}-f0`, role: 'core_finding', reason: 'ok' }, { claim_id: `${prefix}-lim`, role: 'limitation', reason: 'ok' }],
      excluded_claims: [{ claim_id: `${prefix}-safety`, reason_code: 'OTHER', reason: 'Out of scope.', related_conflict_claim_ids: [] }],
      resolved_synthesis_signals: [], unresolved_issues: [],
      human_review_justification: { reason_code: 'NOT_APPLICABLE', reason: 'Not applicable', related_claim_ids: [] },
      public_framing: {
        core_points: [{ statement: `Finding ${prefix}-f0.`, supporting_claim_ids: [`${prefix}-f0`] }],
        limitations: [{ statement: `Finding ${prefix}-lim.`, supporting_claim_ids: [`${prefix}-lim`] }],
        scope_note: 'Scope note.',
      },
    },
    metrics: { model_calls: 1, reconciliation_calls: 0, full_retries: 0, total_input_tokens: 5, total_output_tokens: 5, model_info: {} },
  });
}
function writerFor(prefix, topicSlug) {
  const u = (kind, text, ids = [], stmts = []) => ({ kind, text, supporting_claim_ids: ids, source_statements: stmts });
  return async (env, { clearedSnapshot, route, cluster }) => ({
    ok: true, usage: { input_tokens: 10, output_tokens: 10 },
    output: {
      topic_slug: topicSlug, cluster, route, title: `${topicSlug} | AIMT`, meta_description: `About ${topicSlug}.`, h1: `${topicSlug} Overview`,
      answer_summary: u('VERBATIM', `Finding ${prefix}-f0.`, [`${prefix}-f0`], [`Finding ${prefix}-f0.`]),
      sections: [{ section_id: 'overview', heading: 'Overview', units: [u('FRAMING', 'This matters for practitioners.')] }],
      scope_note: clearedSnapshot.scope_language.scope_note,
      limitations: [u('VERBATIM', `Finding ${prefix}-lim.`, [`${prefix}-lim`], [`Finding ${prefix}-lim.`])],
      key_takeaways: [u('VERBATIM', `Finding ${prefix}-f0.`, [`${prefix}-f0`], [`Finding ${prefix}-f0.`])],
      visual_recommendation: { recommendation: 'NONE', rationale: 'Prose is sufficient.' },
    },
  });
}
const passingReview = async () => ({
  ok: true, usage: { input_tokens: 10, output_tokens: 10 },
  output: { paraphrase_reviews: [], framing_reviews: [{ location: 'sections:overview:0', verdict: 'NON_FACTUAL', reason: 'Orientation.' }], voice_verdict: 'PASS', voice_reason: 'ok', scope_verdict: 'PASS', scope_reason: 'ok' },
});

async function testPipelineSelectsAndRoutesAScalpHealthCandidate() {
  // Claims tagged with ONE topic each: the constructed scalp-barrier-ph
  // concept (union of all three) legitimately has the deepest evidence,
  // while each direct concept sees only its own slice.
  const prefix = 'barrier-a';
  const pool = merge(evidence('barrier-a', 'scalp-health', { sources: 3 }), evidence('barrier-b', 'surfactants', { sources: 3 }), evidence('barrier-c', 'cosmetic-ingredients', { sources: 3 }));
  let fetchedTopics = null;
  let plannerArgs = null;
  let writerArgs = null;
  const report = await runPipeline(FAKE_ENV, {
    fns: {
      fetchEvidenceFn: async (env, topics) => { fetchedTopics = topics; return pool; },
      planIntentFn: async (env, args) => { plannerArgs = args; return intentFromArgs(args); },
      synthesizeFn: synthesizeFor(prefix, 'scalp-barrier-ph'),
      writeFn: async (env, args) => { writerArgs = args; return writerFor(prefix, 'scalp-barrier-ph')(env, args); },
      reviewFn: passingReview,
    },
  });
  check('PIPELINE', 'evidence fetch spans every registered controlled topic', Array.isArray(fetchedTopics) && CONTROLLED_TOPICS.every((t) => fetchedTopics.includes(t)), fetchedTopics && fetchedTopics.length);
  check('PIPELINE', 'scalp-barrier-ph selected (deepest evidence: union of its three controlled topics)', report.selected_topic === 'scalp-barrier-ph', report.selected_topic);
  check('PIPELINE', 'reaches SHADOW_CANDIDATE_READY through the EXISTING Writer/Reviewer', report.final_state === RUN_FINAL_STATE.SHADOW_CANDIDATE_READY, JSON.stringify({ s: report.final_state, r: report.exception_reason }));
  check('PIPELINE', '#17 planned_route uses the candidate\'s cluster', report.planned_route === '/education/scalp-health/scalp-barrier-ph', report.planned_route);
  check('PIPELINE', 'planner was given the registered cluster, prefix, and route slug', plannerArgs.cluster === 'scalp-health' && plannerArgs.routePrefix === '/education/scalp-health' && plannerArgs.registeredRouteSlug === 'scalp-barrier-ph');
  check('PIPELINE', 'planner sibling context is same-cluster only (no hair-loss pages)', Array.isArray(plannerArgs.existingClusterPages) && plannerArgs.existingClusterPages.length === 0, JSON.stringify(plannerArgs.existingClusterPages));
  check('PIPELINE', 'writer gets cluster scalp-health', writerArgs.cluster === 'scalp-health' && writerArgs.route === '/education/scalp-health/scalp-barrier-ph');
  const plan = report.__internal && report.__internal.plan;
  check('PIPELINE', 'related links use the scalp-health hub as topic_hub', plan && plan.related_links.some((l) => l.relation === 'topic_hub' && l.href === '/education/scalp-health'), plan && JSON.stringify(plan.related_links));
  check('PIPELINE', 'related links never cross into another cluster (no hair-loss article links)', plan && !plan.related_links.some((l) => l.href.startsWith('/education/hair-loss')), plan && JSON.stringify(plan.related_links));
  check('PIPELINE', 'candidate list reports clusters', report.candidate_topics.every((c) => typeof c.cluster === 'string'));
}

async function testPipelinePlannerCannotInventRoute() {
  const prefix = 'mc';
  const pool = evidence(prefix, 'massage-circulation', { sources: 5 });
  let synthCalled = false;
  const report = await runPipeline(FAKE_ENV, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async (env, args) => intentFromArgs(args, { route_slug: 'scalp-massage-miracle' }),
      synthesizeFn: async () => { synthCalled = true; return {}; },
    },
  });
  check('PIPELINE_BOUNDARY', '#25 planner-invented route stops the run as INFRA_REVIEW', report.final_state === RUN_FINAL_STATE.INFRA_REVIEW && report.exception_reason.includes('ROUTE_SLUG_NOT_REGISTERED'), JSON.stringify({ s: report.final_state, r: report.exception_reason }));
  check('PIPELINE_BOUNDARY', 'no synthesis call is spent on it', !synthCalled && report.model_calls.actual_model_call_count === 1);
}

async function testPipelineRefusesStaleBundleForAnotherRoute() {
  const prefix = 'mc';
  const pool = evidence(prefix, 'massage-circulation', { sources: 5 });
  const report = await runPipeline(FAKE_ENV, {
    fns: {
      fetchEvidenceFn: async () => pool,
      loadCandidateBundleFn: () => ({ found: true, bundle: { topic_slug: 'massage-circulation', cluster: 'head-spa-techniques', route: '/education/head-spa-techniques/other-slug' } }),
      verifyCandidateBundleIntegrityFn: async () => ({ valid: true, violations: [] }),
      planIntentFn: async () => { throw new Error('must not be called'); },
    },
  });
  check('PIPELINE_BOUNDARY', 'a durable bundle targeting a non-registry route is never resumed (INFRA_REVIEW)', report.final_state === RUN_FINAL_STATE.INFRA_REVIEW && report.exception_reason.includes('publication registry'), report.exception_reason);
}

async function testResearchGapLoopWorksCrossCluster() {
  // Claims tagged with ONE topic each: the constructed scalp-barrier-ph
  // concept (union of all three) legitimately has the deepest evidence,
  // while each direct concept sees only its own slice.
  const prefix = 'barrier-a';
  const pool = merge(evidence('barrier-a', 'scalp-health', { sources: 3 }), evidence('barrier-b', 'surfactants', { sources: 3 }), evidence('barrier-c', 'cosmetic-ingredients', { sources: 3 }));
  let upsertArgs = null;
  const report = await runPipeline(FAKE_ENV_GAP_LOOP, {
    fns: {
      fetchEvidenceFn: async () => pool,
      planIntentFn: async (env, args) => intentFromArgs(args),
      synthesizeFn: async () => ({
        status: 'HUMAN_REVIEW', stage: 'initial', reason: 'model_declared_human_review',
        finalOutput: { human_review_justification: { reason_code: 'EVIDENCE_INSUFFICIENCY', reason: 'Not enough on acid mantle pH ranges.', related_claim_ids: [`${prefix}-f0`] } },
        metrics: { model_calls: 1, reconciliation_calls: 0, full_retries: 0, total_input_tokens: 5, total_output_tokens: 5, model_info: {} },
      }),
      loadActiveResearchGapsBySlugFn: async () => ({}),
      upsertEvidenceInsufficiencyGapFn: async (env, args) => { upsertArgs = args; return { row: { queue_id: buildResearchGapQueueId(args.topicSlug), extras: { attempt_count: 1 } }, action: 'QUEUED' }; },
    },
  });
  check('RESEARCH_GAP_LOOP', 'EVIDENCE_INSUFFICIENCY on scalp-barrier-ph -> RESEARCH_GAP_QUEUED', report.final_state === RUN_FINAL_STATE.RESEARCH_GAP_QUEUED, JSON.stringify({ s: report.final_state, r: report.exception_reason }));
  check('RESEARCH_GAP_LOOP', 'gap id is publication_evidence_gap:scalp-barrier-ph', report.research_gap_action && report.research_gap_action.gap_id === 'publication_evidence_gap:scalp-barrier-ph');
  check('RESEARCH_GAP_LOOP', 'gap carries the scalp-health cluster and the concept\'s exact controlled topics', upsertArgs && upsertArgs.cluster === 'scalp-health' && JSON.stringify([...upsertArgs.controlledTopics].sort()) === JSON.stringify(['cosmetic-ingredients', 'scalp-health', 'surfactants']), upsertArgs && JSON.stringify(upsertArgs.controlledTopics));
}

async function testAutopublishAndCeilingUnchanged() {
  check('LIMITS', '#29 default weekly ceiling is still 4', DEFAULT_MAX_PAGES_PER_WEEK === 4 && resolveMaxPagesPerWeek({}) === 4 && MAX_PAGES_PER_WEEK_ENV_VAR === 'AIMT_EDUCATION_MAX_PAGES_PER_WEEK');
  check('LIMITS', '#28 AUTOPUBLISH env var name and fail-closed parsing unchanged', AUTOPUBLISH_ENV_VAR === 'AIMT_EDUCATION_AUTOPUBLISH_ENABLED' && !isAutopublishEnabled({}) && !isAutopublishEnabled({ AIMT_EDUCATION_AUTOPUBLISH_ENABLED: 'yes' }) && isAutopublishEnabled({ AIMT_EDUCATION_AUTOPUBLISH_ENABLED: 'true' }));
  const capped = await runPipeline(FAKE_ENV, { pagesPublishedThisWeek: 4, fns: { fetchEvidenceFn: async () => { throw new Error('must not fetch'); } } });
  check('LIMITS', '#29 at 4/4 the run is NO_OP_SUCCESS before any selection or model call', capped.final_state === RUN_FINAL_STATE.NO_OP_SUCCESS && capped.model_calls.actual_model_call_count === 0, capped.selection_reason);
  const ops = readRepo('.github/workflows/aimt-education-operations.yml');
  const pub = readRepo('.github/workflows/aimt-education-publish.yml');
  check('LIMITS', 'weekday Education Operations schedule unchanged', ops.includes("- cron: '0 14 * * 1-5'"));
  check('LIMITS', 'workflows still read AUTOPUBLISH/MAX_PAGES from repository variables', ops.includes('${{ vars.AIMT_EDUCATION_AUTOPUBLISH_ENABLED }}') && pub.includes('${{ vars.AIMT_EDUCATION_MAX_PAGES_PER_WEEK }}'));
  check('LIMITS', '#32 exact-run workflow handoff unchanged (workflow_run from scheduled main Operations run)', pub.includes("github.event.workflow_run.name == 'AIMT Education Operations'") && pub.includes("github.event.workflow_run.event == 'schedule'") && pub.includes("github.event.workflow_run.head_branch == 'main'"));
}

// ═════════════════════════════════════════════════════════════════════════
// Publisher (unchanged) accepts a new-cluster candidate -- fully mocked
// ═════════════════════════════════════════════════════════════════════════
async function testPublisherAcceptsNewClusterWithZeroModelCalls() {
  const TOPIC = 'scalp-barrier-ph';
  const ROUTE = publicationRouteFor(TOPIC);
  const HASH = 'gsh-barrier-1';
  const HEAD = 'a'.repeat(40);
  const env = { SUPABASE_URL: 'https://example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fake', AIMT_EDUCATION_AUTOPUBLISH_ENABLED: 'true', GITHUB_REPOSITORY: 'brandrice-dev/aimt-site' };
  const bundle = {
    contract_version: 'education-candidate-bundle-v1', topic_slug: TOPIC, cluster: 'scalp-health', route: ROUTE,
    originating_run_id: 'shadow-run-1', created_at: '2026-10-03T00:00:00.000Z',
    intent_plan: { topic_slug: TOPIC, page_concept: 'Scalp Barrier and pH', cluster: 'scalp-health' },
    prepared_artifact: { topic_slug: TOPIC, record: { topic_slug: TOPIC, status: 'ready_for_page_builder', clearance_mode: 'AUTO_READY', generation_source_hash: HASH, publication_clearance: { fingerprint_input: { risk_tier: 'MODERATE' } } }, prepared_at: '2026-10-03T00:00:00.000Z' },
    generation_source_hash: HASH, fingerprint_input: { risk_tier: 'MODERATE' },
    page_plan: { topic_slug: TOPIC, route: ROUTE, h1: 'Scalp Barrier and pH', sources: [] },
    writer_validation: { valid: true }, deterministic_repair: null,
    review_result: { outcome: 'PASS', failing_paraphrases: [], failing_framings: [], voice_fail: false, scope_fail: false, summary: 'All units PASS.' },
    reviewer_framing_repair: null, freshness_basis: { selected_claim_ids: [], excluded_claim_ids: [] }, source_ids: [], selected_claim_ids: [],
  };
  const manifestStore = new Map();
  let clearanceRow = null;
  let liveFetchArgs = null;
  let siblingClusterArg = 'unset';
  const io = {
    loadCandidateBundleFn: () => ({ found: true, bundle }),
    loadPublicationManifestFn: (slug) => (manifestStore.has(slug) ? { found: true, manifest: manifestStore.get(slug) } : { found: false, manifest: null }),
    writePublicationManifestFn: (slug, m) => { manifestStore.set(slug, m); },
    fetchEvidenceFn: async () => ({ claims: [], sources: [] }),
    fetchPublishedTopicSlugsFn: async () => (clearanceRow && clearanceRow.status === 'published' ? [...LIVE_HAIR_LOSS, TOPIC] : LIVE_HAIR_LOSS),
    countPagesPublishedThisWeekFn: async () => ({ count: 0 }),
    resolveTrustedSiblingPagesFn: (slugs, clusterKey) => {
      siblingClusterArg = clusterKey;
      return { ok: true, pages: slugs.map((s) => ({ topic_slug: s, cluster: getPublicationConcept(s).cluster, route: publicationRouteFor(s), label: s })) };
    },
    verifyCandidateBundleIntegrityFn: async () => ({ valid: true, violations: [] }),
    resolveCandidateResumeFreshnessFn: () => ({ state: FRESHNESS_STATE.FRESH }),
    prepareLaunchArtifactsFn: () => ({ articlePath: educationArticlePathFromRoute(ROUTE), planArtifactPath: `functions/_data/education-page-plans/${TOPIC}.json`, hubPath: 'education/scalp-health.html', sitemapPath: 'sitemap.xml', allowlistResult: { valid: true, allowed: [], violations: [] } }),
    openLaunchPrFn: () => ({ branch: `education-ops/publish-${TOPIC}`, prNumber: 200, prUrl: 'https://github.com/brandrice-dev/aimt-site/pull/200', headRefOid: HEAD }),
    refreshLaunchPrArticleFn: async () => ({ changed: false, headRefOid: HEAD, changedPaths: [] }),
    ghPrListForBranchFn: () => null,
    ghPrViewFn: (n) => ({ number: n, state: 'OPEN', headRefOid: HEAD, files: [{ path: educationArticlePathFromRoute(ROUTE) }, { path: 'sitemap.xml' }, { path: `functions/_data/education-page-plans/${TOPIC}.json` }, { path: 'education/scalp-health.html' }] }),
    ghPrMergeFn: (n) => ({ number: n, state: 'MERGED', mergeCommitOid: 'b'.repeat(40) }),
    fetchClearanceRowFn: async () => clearanceRow,
    writeClearanceRecordFn: async (e, record) => { clearanceRow = { ...record, sitemap_eligible: false, published_at: null }; return [clearanceRow]; },
    publishClearanceRecordFn: async (e, slug, { requireCurrentHash }) => { clearanceRow = { ...clearanceRow, status: 'published', sitemap_eligible: true, published_at: '2026-10-03T00:00:00.000Z', generation_source_hash: requireCurrentHash }; return [clearanceRow]; },
    verifyStoredClearanceIntegrityFn: async () => ({ valid: true, violations: [] }),
    waitForDeploymentFn: async () => ({ ok: true, state: 'success', deploymentId: 1, violations: [] }),
    fetchLiveArtifactsFn: async (args) => {
      liveFetchArgs = args;
      return {
        httpStatus: 200,
        html: `<link rel="canonical" href="https://aimtrichology.com${ROUTE}"><meta name="${GENERATION_MARKER_META_NAME}" content="${HASH}">`,
        sitemapXml: `<loc>https://aimtrichology.com${ROUTE}</loc>`, hubHtml: `<a href="${ROUTE}">x</a>`,
      };
    },
    sleepFn: async () => {},
  };
  const report = await runPublicationPipeline(env, { topicSlug: TOPIC, io });
  check('PUBLISHER', 'the unchanged publisher reaches PUBLISHED for a Scalp Health concept', report.final_state === RUN_FINAL_STATE.PUBLISHED, JSON.stringify({ s: report.final_state, r: report.exception_reason }));
  check('PUBLISHER', '#30 publisher makes zero model calls', report.model_calls.total_calls === 0);
  check('PUBLISHER', 'live verification fetched against the scalp-health cluster', liveFetchArgs && liveFetchArgs.clusterKey === 'scalp-health' && liveFetchArgs.route === ROUTE);
  check('PUBLISHER', 'route-collision resolution spans all clusters (clusterKey null)', siblingClusterArg === null);

  // A bundle whose route disagrees with the registry is refused.
  const badIo = { ...io, loadCandidateBundleFn: () => ({ found: true, bundle: { ...bundle, route: '/education/scalp-health/some-other-slug' } }), loadPublicationManifestFn: () => ({ found: false, manifest: null }) };
  const bad = await runPublicationPipeline(env, { topicSlug: TOPIC, io: badIo });
  check('PUBLISHER', 'a bundle targeting a non-registry route is refused (INFRA_REVIEW)', bad.final_state === RUN_FINAL_STATE.INFRA_REVIEW && bad.model_calls.total_calls === 0, JSON.stringify({ s: bad.final_state, r: bad.exception_reason }));
  const unreg = await runPublicationPipeline(env, { topicSlug: 'scalp-detox', io: { ...badIo, loadCandidateBundleFn: () => ({ found: true, bundle: { ...bundle, topic_slug: 'scalp-detox' } }) } });
  check('PUBLISHER', 'an unregistered topic is never published', unreg.final_state === RUN_FINAL_STATE.INFRA_REVIEW, unreg.exception_reason);

  // #28: AUTOPUBLISH false still stops before merge, for a new cluster too.
  manifestStore.clear(); clearanceRow = null;
  let merged = 0;
  const offReport = await runPublicationPipeline({ ...env, AIMT_EDUCATION_AUTOPUBLISH_ENABLED: 'false' }, { topicSlug: TOPIC, io: { ...io, ghPrMergeFn: (n) => { merged += 1; return io.ghPrMergeFn(n); } } });
  check('PUBLISHER', '#28 AUTOPUBLISH false -> AUTOPUBLISH_GATE_CLOSED, never merged', offReport.final_state === RUN_FINAL_STATE.AUTOPUBLISH_GATE_CLOSED && merged === 0, offReport.final_state);
}

// Multi-cluster evidence fetch: paginated, GET-only, never truncated.
async function testEvidenceFetchPaginatesWithoutTruncation() {
  const total = EVIDENCE_PAGE_SIZE * 2 + 7;
  const allClaims = Array.from({ length: total }, (_, i) => ({ claim_id: `c${String(i).padStart(5, '0')}`, source_id: `s${i % 250}`, topics: ['surfactants'] }));
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), method: init && init.method });
    const u = new URL(String(url));
    if (u.pathname.endsWith('/research_claims')) {
      const offset = Number(u.searchParams.get('offset'));
      const limit = Number(u.searchParams.get('limit'));
      return { ok: true, json: async () => allClaims.slice(offset, offset + limit) };
    }
    const ids = u.searchParams.get('source_id').replace(/^in\.\(|\)$/g, '').split(',').map((x) => x.replace(/"/g, ''));
    return { ok: true, json: async () => ids.map((id) => ({ source_id: id })) };
  };
  try {
    const result = await fetchTopicEvidenceLive({ SUPABASE_URL: 'https://example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fake' }, ['surfactants', 'massage-circulation']);
    check('EVIDENCE_FETCH', 'every claim returned across pages (no truncation)', result.claims.length === total, result.claims.length);
    check('EVIDENCE_FETCH', 'all 250 distinct sources returned via chunked requests', result.sources.length === 250, result.sources.length);
    check('EVIDENCE_FETCH', 'claims pages requested in stable claim_id order', calls.filter((c) => c.url.includes('research_claims')).every((c) => c.url.includes('order=claim_id.asc')));
    check('EVIDENCE_FETCH', 'source requests are chunked', calls.filter((c) => c.url.includes('research_sources')).length === Math.ceil(250 / SOURCE_ID_CHUNK_SIZE));
    check('EVIDENCE_FETCH', 'every request is a GET (read-only)', calls.every((c) => c.method === 'GET'));
  } finally {
    globalThis.fetch = realFetch;
  }
}

const asyncTests = [
  testEvidenceFetchPaginatesWithoutTruncation,
  testPipelineSelectsAndRoutesAScalpHealthCandidate,
  testPipelinePlannerCannotInventRoute,
  testPipelineRefusesStaleBundleForAnotherRoute,
  testResearchGapLoopWorksCrossCluster,
  testAutopublishAndCeilingUnchanged,
  testPublisherAcceptsNewClusterWithZeroModelCalls,
];
for (const t of asyncTests) await t();

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
