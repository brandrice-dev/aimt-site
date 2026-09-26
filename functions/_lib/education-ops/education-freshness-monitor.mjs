/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — freshness monitor (v1, no model call)
   ---------------------------------------------------------------
   IMPORTANT DISTINCTION (see the originating task's own emphasis):
     verifyStoredClearanceIntegrity() answers "does the stored page
     still match what was cleared?" -- a question about the PERSISTED
     ROW's own internal consistency, already answered elsewhere
     (publication-clearance-fingerprint.mjs).
     FRESHNESS answers a completely different question: "has the
     relevant research corpus materially changed SINCE that clearance
     was computed?" -- a question about the corpus, not the row. This
     module never touches or re-derives clearance integrity; it is
     read-only against research_claims/research_sources plus the
     already-persisted clearance row, and produces an entirely separate
     signal.

   v1 makes NO model call. It reconstructs the CURRENT candidate claim
   set for a published topic (the same deterministic
   assessTopicReadiness() candidate_claim_ids the topic selector uses)
   and compares it against the claim set the clearance actually
   considered (selected + excluded, both recorded on the persisted
   row). A delta means "this page should be CONSIDERED for
   re-synthesis" -- explicitly NOT "this page is wrong". Nothing here
   ever triggers a re-synthesis automatically.
   ═══════════════════════════════════════════════════════════════ */

import { PILOT_TOPIC_CONCEPTS, selectTopicEvidenceFromRows, fetchTopicEvidenceLive } from '../research/publication-readiness-loader.mjs';
import { assessTopicReadiness } from '../research/publication-readiness.mjs';

export const FRESHNESS_STATE = Object.freeze({
  FRESH: 'FRESH',
  POTENTIAL_EVIDENCE_CHANGE: 'POTENTIAL_EVIDENCE_CHANGE',
  FRESHNESS_CHECK_FAILED: 'FRESHNESS_CHECK_FAILED',
});

export class FreshnessMonitorError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FreshnessMonitorError';
  }
}

/**
 * PURE comparison step. Given the persisted clearance row's own
 * recorded evidence accounting and the CURRENT candidate claim id set,
 * classify freshness. No I/O.
 *
 * @param {object} clearanceRow - a research_public_pages row (must carry
 *   generation_source_hash and publication_clearance.excluded_claim_ids)
 * @param {string[]} currentCandidateClaimIds
 * @returns {{
 *   state: string, new_claim_ids: string[], removed_claim_ids: string[],
 *   considered_claim_count_at_clearance: number, current_candidate_claim_count: number
 * }}
 */
export function computeFreshnessDelta(clearanceRow, currentCandidateClaimIds) {
  if (!clearanceRow || !clearanceRow.publication_clearance) {
    throw new FreshnessMonitorError('computeFreshnessDelta: clearanceRow is missing publication_clearance.');
  }
  const selectedIds = Array.isArray(clearanceRow.key_claim_ids) ? clearanceRow.key_claim_ids : [];
  const excludedIds = Array.isArray(clearanceRow.publication_clearance.excluded_claim_ids)
    ? clearanceRow.publication_clearance.excluded_claim_ids.map((e) => e.claim_id)
    : [];
  const consideredAtClearance = new Set([...selectedIds, ...excludedIds]);
  const currentSet = new Set(currentCandidateClaimIds);

  const newClaimIds = currentCandidateClaimIds.filter((id) => !consideredAtClearance.has(id));
  const removedClaimIds = [...consideredAtClearance].filter((id) => !currentSet.has(id));

  const state = (newClaimIds.length === 0 && removedClaimIds.length === 0)
    ? FRESHNESS_STATE.FRESH
    : FRESHNESS_STATE.POTENTIAL_EVIDENCE_CHANGE;

  return {
    state,
    new_claim_ids: newClaimIds,
    removed_claim_ids: removedClaimIds,
    considered_claim_count_at_clearance: consideredAtClearance.size,
    current_candidate_claim_count: currentCandidateClaimIds.length,
  };
}

/**
 * I/O wrapper: fetches the current candidate evidence for a published
 * topic (read-only) and the persisted clearance row (read-only), then
 * delegates to computeFreshnessDelta(). Never writes anything.
 *
 * @param {Object} env - SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * @param {string} topicSlug - must have a PILOT_TOPIC_CONCEPTS entry
 * @returns {Promise<object>} a freshness report (see FRESHNESS_STATE);
 *   FRESHNESS_CHECK_FAILED with a `reason` field on any fetch/shape error
 */
export async function checkTopicFreshness(env, topicSlug) {
  const checkedAt = new Date().toISOString();
  try {
    const concept = PILOT_TOPIC_CONCEPTS.find((c) => c.topic_slug === topicSlug);
    if (!concept) {
      return { topic: topicSlug, state: FRESHNESS_STATE.FRESHNESS_CHECK_FAILED, reason: `No PILOT_TOPIC_CONCEPTS entry for "${topicSlug}".`, checked_at: checkedAt };
    }

    const clearanceRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/research_public_pages?topic_slug=eq.${encodeURIComponent(topicSlug)}&select=*`,
      { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }
    );
    if (!clearanceRes.ok) {
      return { topic: topicSlug, state: FRESHNESS_STATE.FRESHNESS_CHECK_FAILED, reason: `Clearance read failed (${clearanceRes.status}).`, checked_at: checkedAt };
    }
    const [clearanceRow] = await clearanceRes.json();
    if (!clearanceRow) {
      return { topic: topicSlug, state: FRESHNESS_STATE.FRESHNESS_CHECK_FAILED, reason: 'No persisted clearance row found.', checked_at: checkedAt };
    }

    const { claims, sources } = await fetchTopicEvidenceLive(env, concept.controlled_topics);
    const { claims: candidateClaims } = selectTopicEvidenceFromRows(concept.controlled_topics, { claims, sources });
    const v1Result = assessTopicReadiness({
      topic_slug: concept.topic_slug,
      seo_page_concept: concept.seo_page_concept,
      controlled_topics: concept.controlled_topics,
      claims: candidateClaims,
      sources,
    });

    const delta = computeFreshnessDelta(clearanceRow, v1Result.candidate_claim_ids);
    return {
      topic: topicSlug,
      published_hash: clearanceRow.generation_source_hash,
      ...delta,
      checked_at: checkedAt,
    };
  } catch (err) {
    return { topic: topicSlug, state: FRESHNESS_STATE.FRESHNESS_CHECK_FAILED, reason: err.message, checked_at: checkedAt };
  }
}

/**
 * Runs the freshness check for every currently-published topic.
 * Read-only. Never triggers re-synthesis -- callers decide what (if
 * anything) to do with POTENTIAL_EVIDENCE_CHANGE results.
 */
export async function checkAllPublishedTopicsFreshness(env, publishedTopicSlugs) {
  const results = [];
  for (const slug of publishedTopicSlugs) {
    results.push(await checkTopicFreshness(env, slug));
  }
  return results;
}
