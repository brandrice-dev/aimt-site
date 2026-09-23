/* ═══════════════════════════════════════════════════════════════
   AIMT Publication Editor v2 — synthesis evidence bundle (STEP 2)
   ---------------------------------------------------------------
   PURE, READ-ONLY-BY-CONSTRUCTION. Takes a v1 synthesis packet
   (functions/_lib/research/publication-readiness.mjs's
   buildSynthesisPacket output) plus the SAME raw claims/sources arrays
   the v1 engine was run against, and projects them down to the minimum
   evidence bundle the AI synthesis layer needs: real claim text and
   citeable source metadata for exactly the packet's candidate IDs --
   nothing from the wider corpus, nothing below CLAIM_VERIFIED, nothing
   excluded/superseded.

   This performs no I/O of its own. The CLI wrapper (scripts/research-
   publication-editor-v2-shadow.mjs) already has the full claims/sources
   arrays in memory from running v1 (loaded via publication-readiness-
   loader.mjs, live or local export) -- this module only re-shapes that
   already-fetched data, it never re-queries anything.
   ═══════════════════════════════════════════════════════════════ */

/** Fields sent to the model for each candidate claim -- exactly the
    CLAIM checklist from the originating request's Step 2, using the
    real research_claims column names (see supabase/migrations/
    20260920_create_research_library.sql). claim_text is the actual
    verified content; claim_origin stands in for "origin" (there is no
    separate research_claims.verification_notes column -- that field
    lives on research_sources, not claims, and is Rick's internal
    verification methodology, not page-relevant evidence content, so it
    is deliberately not forwarded to the model). */
function projectClaim(claim) {
  return {
    claim_id: claim.claim_id,
    claim_text: claim.claim_text ?? null,
    source_id: claim.source_id,
    claim_type: claim.claim_type ?? null,
    direction: claim.direction ?? null,
    population_or_scope: claim.population_or_scope ?? null,
    page_or_section_locator: claim.page_or_section_locator ?? null,
    claim_origin: claim.claim_origin ?? null,
    verification_status: claim.verification_status,
    use_status: claim.use_status ?? null,
  };
}

/** Fields sent to the model for each candidate source -- exactly the
    SOURCE checklist from the originating request's Step 2. */
function projectSource(source) {
  return {
    source_id: source.source_id,
    title: source.title ?? null,
    authors: Array.isArray(source.authors) ? source.authors : null,
    year: source.year ?? null,
    date_published: source.date_published ?? null,
    source_venue: source.source_venue ?? null,
    doi: source.doi ?? null,
    pmid: source.pmid ?? null,
    pmcid: source.pmcid ?? null,
    url: source.url ?? null,
    evidence_type: source.evidence_type ?? null,
    source_role: source.source_role ?? null,
  };
}

/**
 * Builds the minimum evidence bundle for synthesis from a v1 synthesis
 * packet and the raw claims/sources arrays v1 was run against.
 *
 * Deliberately re-derives candidacy from the packet's own
 * candidate_claim_ids/candidate_source_ids (already the output of v1's
 * CLAIM_VERIFIED-or-better + not-excluded/superseded filter -- see
 * publication-readiness.mjs#isCandidateClaim) rather than re-filtering
 * `claims` itself, so this function can never accidentally widen the
 * candidate set beyond what v1 already decided was in-bounds.
 *
 * @param {object} packet - a NEEDS_SYNTHESIS result's `synthesis_packet`
 * @param {object[]} claims - the full claims array v1 was run against
 *   (topic-scoped, any status -- same input assessTopicReadiness received)
 * @param {object[]} sources - the full sources array v1 was run against
 * @returns {{claims: object[], sources: object[], claim_count: number, source_count: number}}
 */
export function buildSynthesisEvidenceBundle(packet, { claims = [], sources = [] } = {}) {
  if (!packet || typeof packet !== 'object') {
    throw new Error('buildSynthesisEvidenceBundle: a synthesis_packet is required (only NEEDS_SYNTHESIS results have one).');
  }
  const candidateClaimIds = new Set(packet.candidate_claim_ids || []);
  const candidateSourceIds = new Set(packet.candidate_source_ids || []);

  const bundleClaims = claims
    .filter((c) => c && candidateClaimIds.has(c.claim_id))
    .map(projectClaim);
  const bundleSources = sources
    .filter((s) => s && candidateSourceIds.has(s.source_id))
    .map(projectSource);

  return {
    claims: bundleClaims,
    sources: bundleSources,
    claim_count: bundleClaims.length,
    source_count: bundleSources.length,
  };
}

// Mirrors the literal string the v1 CLI wrapper
// (scripts/research-publication-editor-shadow.mjs) already prints in its
// own JSON report -- kept as a local constant here rather than a second
// import to avoid coupling this file to v1's CLI script.
const PUBLICATION_READINESS_ENGINE_VERSION = 'publication-readiness-v1';

/**
 * STEP 10 — assembles the machine-readable page evidence brief for an
 * AUTO_READY result. Pure: takes already-computed inputs, produces the
 * package a future Page Builder would consume. This is NOT the public
 * page and does not itself get written anywhere by this function --
 * callers (the CLI wrapper) decide where the returned object is written
 * (runtime output under gitignored research-import/ only).
 *
 * @param {object} params
 * @param {object} params.v1Result - full assessTopicReadiness() output
 * @param {object} params.pageIntent - the registered page intent (see
 *   publication-page-intent.mjs#getPageSynthesisIntent)
 * @param {{claims: object[], sources: object[]}} params.evidenceBundle
 * @param {object} params.aiOutput - validated structured synthesis output
 * @param {object} params.modelInfo - {provider, modelName, status, ...}
 *   from publication-editor-model-config.mjs
 * @param {string} params.validatorVersion
 * @returns {object} the page evidence brief
 */
export function buildPageEvidenceBrief({ v1Result, pageIntent, evidenceBundle, aiOutput, modelInfo, validatorVersion }) {
  const sourceById = new Map(evidenceBundle.sources.map((s) => [s.source_id, s]));
  const claimById = new Map(evidenceBundle.claims.map((c) => [c.claim_id, c]));

  const approvedClaimIds = aiOutput.selected_claims.map((c) => c.claim_id);
  const usedSourceIds = [...new Set(
    approvedClaimIds
      .map((id) => claimById.get(id))
      .filter(Boolean)
      .map((c) => c.source_id)
  )];

  const citationMap = {};
  for (const sourceId of usedSourceIds) {
    const s = sourceById.get(sourceId);
    if (!s) continue;
    citationMap[sourceId] = {
      title: s.title,
      authors: s.authors,
      year: s.year,
      date_published: s.date_published,
      source_venue: s.source_venue,
      doi: s.doi,
      pmid: s.pmid,
      pmcid: s.pmcid,
      url: s.url,
    };
  }

  return {
    page_concept: aiOutput.page_concept,
    public_intent: pageIntent.public_intent,
    approved_for_draft_claim_ids: approvedClaimIds,
    excluded_claim_ids: aiOutput.excluded_claims.map((c) => ({ claim_id: c.claim_id, reason_code: c.reason_code, reason: c.reason })),
    source_ids: usedSourceIds,
    core_factual_points: aiOutput.public_framing.core_points,
    limitations: aiOutput.public_framing.limitations,
    scope_language: { page_scope: aiOutput.page_scope, scope_note: aiOutput.public_framing.scope_note },
    citation_map: citationMap,
    review_timestamp: new Date().toISOString(),
    risk_tier: v1Result.risk_tier,
    provenance: {
      v1_engine_version: PUBLICATION_READINESS_ENGINE_VERSION,
      synthesis_model: modelInfo ? { provider: modelInfo.provider, model_name: modelInfo.modelName, status: modelInfo.status, registry_version: modelInfo.registryVersion } : null,
      validator_version: validatorVersion,
    },
  };
}
