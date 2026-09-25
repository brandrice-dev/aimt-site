/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — automatic page-intent planner
   ---------------------------------------------------------------
   The first two pages (hair-cycle, telogen-effluvium) used a
   hand-registered PAGE_SYNTHESIS_INTENT entry (publication-page-
   intent.mjs) -- an owner/editorial scope decision made once per topic,
   by hand. That doesn't scale to a topic the scheduler selects itself.
   This planner produces the SAME KIND of structured intent a human
   would have hand-written, from the SAME governed inputs a human would
   have looked at -- it is choosing page SCOPE, never writing or
   inventing evidence. publication-page-intent.mjs's existing
   hand-registered entries for hair-cycle/telogen-effluvium are NOT
   touched or replaced by this planner; they remain the canonical,
   historical intent for those two already-published pages.
   ═══════════════════════════════════════════════════════════════ */

export const INTENT_PLAN_CONTRACT_VERSION = 'education-intent-planner-v1';

export const INTENT_PLAN_JSON_SCHEMA = {
  type: 'object',
  properties: {
    topic_slug: { type: 'string' },
    page_concept: { type: 'string' },
    public_intent: { type: 'string' },
    route_slug: { type: 'string' },
    in_scope_concepts: { type: 'array', items: { type: 'string' } },
    out_of_scope_concepts: { type: 'array', items: { type: 'string' } },
    practitioner_relevance: { type: 'string' },
    cluster: { type: 'string' },
    risk_context: { type: 'string' },
  },
  required: [
    'topic_slug', 'page_concept', 'public_intent', 'route_slug',
    'in_scope_concepts', 'out_of_scope_concepts', 'practitioner_relevance',
    'cluster', 'risk_context',
  ],
  additionalProperties: false,
};

/**
 * @param {{
 *   topicSlug: string, seoPageConcept: string, riskTier: string,
 *   cluster: string, routePrefix: string,
 *   candidateEvidenceInventory: Array<{claim_id: string, claim_type: string, topics: string[]}>,
 *   existingClusterPages: Array<{topic_slug: string, route: string, label: string}>
 *     -- real, trusted route+label data (education-related-links.mjs /
 *     the orchestrator's resolveTrustedSiblingPages()), CONTEXT ONLY;
 *     the planner never authors a route/href from this,
 * }} args
 */
export function buildIntentPlanningInstruction({ topicSlug, seoPageConcept, riskTier, cluster, routePrefix, candidateEvidenceInventory, existingClusterPages }) {
  return [
    `You are AIMT's Education Page Intent Planner. Your ONLY job is to define the SCOPE of one new Education page -- what it is about, what it includes, what it deliberately excludes -- for AIMT's professional beauty/scalp-care practitioner audience. You are NOT writing scientific claims and you are NOT summarizing evidence content. You are given only a candidate evidence INVENTORY (claim IDs, claim types, and topic tags -- never the claim text itself), because scope decisions must not be made by reading and paraphrasing evidence; that is a later, separately-governed step.`,
    ``,
    `TOPIC: ${topicSlug} (working SEO concept: "${seoPageConcept}")`,
    `RISK TIER (already determined, do not change): ${riskTier}`,
    `ACTIVE CLUSTER: ${cluster} (route prefix: ${routePrefix})`,
    ``,
    `EXISTING PAGES ALREADY LIVE IN THIS CLUSTER (do not duplicate their scope; your page must be genuinely distinct):`,
    JSON.stringify(existingClusterPages, null, 2),
    ``,
    `CANDIDATE EVIDENCE INVENTORY for this topic (claim_id/claim_type/topics only -- NOT the claim text):`,
    JSON.stringify(candidateEvidenceInventory, null, 2),
    ``,
    `Produce: topic_slug (echo it back exactly), page_concept (a clear working title), public_intent (one sentence describing what this page explains and for whom), route_slug (the final path segment under ${routePrefix}/, lowercase, hyphenated, no leading/trailing slash), in_scope_concepts (an array of CONCEPT AREAS this page covers -- categories of information, never specific numbers, statistics, or claims), out_of_scope_concepts (an array explicitly excluding diagnosis, treatment/medication protocols, and any other named condition this page is not about), practitioner_relevance (one sentence on why this matters for a working practitioner), cluster (echo the cluster name), risk_context (one sentence restating the risk tier and what that means for this page's posture -- observational/educational, never diagnostic or prescriptive).`,
    `Hard rules: never state a specific number, percentage, or statistic anywhere in your output -- that is evidence content, which this step does not have access to and must not invent. Never claim a treatment is effective or ineffective. Never describe this page's scope in a way that would require diagnosing an individual case. If the candidate evidence inventory looks too thin or too narrowly clustered around treatment/diagnosis claim types for a genuine practitioner-education page to be built from it, say so plainly in public_intent and keep in_scope_concepts minimal rather than inventing scope the evidence likely cannot support.`,
  ].join('\n');
}
