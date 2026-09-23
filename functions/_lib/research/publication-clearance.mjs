/* ═══════════════════════════════════════════════════════════════
   AIMT Automated Publication Clearance — page-level clearance record
   ---------------------------------------------------------------
   PURE. Zero I/O, zero database access. Builds the exact row this repo
   would upsert into research_public_pages for a validated AUTO_READY
   page evidence brief -- and only for one. This module is the ONLY
   place that shape is decided; publication-clearance-writer.mjs (I/O)
   allow-lists against this module's own output, never invents columns
   of its own.

   GOVERNANCE (do not weaken):
     - clearance_mode is a DIFFERENT trust signal from AIMT_APPROVED.
       AUTO_READY means "Publication Editor v1+v2's deterministic
       pipeline passed for THIS evidence brief" -- it is never written
       as, aliased to, or capable of producing AIMT_APPROVED. Nothing in
       this module ever touches research_claims/research_sources at all
       (it has no reference to either table), so it cannot set a claim's
       verification_status, public_eligible, or published under any
       circumstance.
     - Only a human, through a separate authenticated review path (not
       built here), may ever set clearance_mode = 'HUMAN_APPROVED'. This
       module's automated entry point (buildAutoReadyClearanceRecord)
       can ONLY ever produce clearance_mode = 'AUTO_READY' -- it has no
       parameter or code path that could set any other value.
     - status is set to 'ready_for_page_builder', never 'published' --
       this bridge phase does not publish anything. published/
       published_at/sitemap_eligible are never included in the record at
       all (see FORBIDDEN_CLEARANCE_FIELDS below, asserted against on
       every build).
   ═══════════════════════════════════════════════════════════════ */

// No fingerprint-computation import here by design: this module never
// computes a hash itself. It only ever consumes a pre-built
// fingerprintArtifact ({ algorithm, input, hash }) from
// publication-clearance-fingerprint.mjs#buildEvidenceFingerprintArtifact,
// so a record's persisted fingerprint_input can never diverge from the
// content that actually produced generation_source_hash (see that
// function's own header comment for why this used to be two separately-
// supplied values and why that was a problem).

export const CLEARANCE_MODES = Object.freeze(['AUTO_READY', 'HUMAN_APPROVED', 'HUMAN_REVIEW_REQUIRED']);

/* Columns/keys a clearance record must NEVER contain. Asserted on every
   build (assertNoForbiddenFields) as a self-check, not just documented --
   a future edit to this file that accidentally introduces one of these
   fails loudly rather than silently shipping. */
export const FORBIDDEN_CLEARANCE_FIELDS = Object.freeze([
  'published',
  'published_at',
  'sitemap_eligible',
  'aimt_reviewed_by',
  'aimt_reviewed_on',
  'aimt_review_notes',
  'public_eligible',
  'verification_status',
  'AIMT_APPROVED',
]);

export class ClearanceIneligibleError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ClearanceIneligibleError';
  }
}

export function assertNoForbiddenFields(record) {
  const present = Object.keys(record).filter((k) => FORBIDDEN_CLEARANCE_FIELDS.includes(k));
  if (present.length) {
    throw new Error(`buildAutoReadyClearanceRecord produced forbidden field(s): ${present.join(', ')}`);
  }
}

/**
 * The ONLY entry point in this module that produces a clearance record,
 * and it can ONLY ever produce clearance_mode = 'AUTO_READY' -- there is
 * no parameter that lets a caller ask for HUMAN_APPROVED or
 * HUMAN_REVIEW_REQUIRED from here (those are conceptual states in the DB
 * CHECK constraint for a FUTURE human-authenticated path to set; this
 * automated module never sets them).
 *
 * Refuses (throws ClearanceIneligibleError, never silently degrades) for
 * every non-AUTO_READY case:
 *   - pipelineStatus !== 'AUTO_READY' (HUMAN_REVIEW, SYNTHESIS_FAILED, or
 *     any other v2 shadow outcome)
 *   - v1Result.risk_tier === 'HIGH' (defense in depth -- should already
 *     be structurally impossible for an AUTO_READY result, but checked
 *     directly rather than trusted)
 *   - a missing page evidence brief
 *
 * @param {object} params
 * @param {string} params.topicSlug
 * @param {string|null} [params.controlledTopic] - a research_topics.topic
 *   value, if this clearance concept maps 1:1 to one (null for a
 *   multi-topic umbrella concept)
 * @param {object} params.v1Result - full assessTopicReadiness() output
 * @param {string} params.pipelineStatus - the v2 orchestrator's final
 *   `status` ('AUTO_READY' | 'HUMAN_REVIEW' | 'SYNTHESIS_FAILED')
 * @param {object} params.pageEvidenceBrief - buildPageEvidenceBrief() output
 * @param {{algorithm: string, input: object, hash: string}} params.fingerprintArtifact -
 *   the ONE trusted output of publication-clearance-fingerprint.mjs's
 *   buildEvidenceFingerprintArtifact(topicSlug, pageEvidenceBrief). Never
 *   accepts a bare hash string and a separately-reconstructed input
 *   object -- both must come from that single call, so the persisted
 *   `publication_clearance.fingerprint_input` is, by construction, the
 *   exact object that produced `generation_source_hash`.
 * @returns {object} a research_public_pages-column-shaped record, plus
 *   the extra `publication_clearance` jsonb payload column
 */
export function buildAutoReadyClearanceRecord({ topicSlug, controlledTopic = null, v1Result, pipelineStatus, pageEvidenceBrief, fingerprintArtifact }) {
  if (pipelineStatus !== 'AUTO_READY') {
    throw new ClearanceIneligibleError(
      `Cannot build a clearance record for pipeline status "${pipelineStatus}" -- only a validated AUTO_READY result is eligible for automated clearance.`
    );
  }
  if (!v1Result || v1Result.risk_tier === 'HIGH') {
    throw new ClearanceIneligibleError('Cannot build a clearance record for a HIGH risk_tier topic -- HIGH risk always requires human review, never automated clearance.');
  }
  if (!pageEvidenceBrief) {
    throw new ClearanceIneligibleError('Cannot build a clearance record without a page evidence brief.');
  }
  if (!fingerprintArtifact || !fingerprintArtifact.hash || !fingerprintArtifact.input || !fingerprintArtifact.algorithm) {
    throw new ClearanceIneligibleError('Cannot build a clearance record without a complete evidence fingerprint artifact (algorithm + input + hash from buildEvidenceFingerprintArtifact).');
  }

  const generatedAt = new Date().toISOString();

  const record = {
    topic_slug: topicSlug,
    topic: controlledTopic,
    key_claim_ids: [...pageEvidenceBrief.approved_for_draft_claim_ids],
    source_ids: [...pageEvidenceBrief.source_ids],
    summary_markdown: pageEvidenceBrief.core_factual_points.map((p) => `- ${p.statement}`).join('\n'),
    limitations_markdown: pageEvidenceBrief.limitations.map((l) => `- ${l.statement}`).join('\n'),
    practitioner_relevance_markdown: pageEvidenceBrief.scope_language.scope_note,
    status: 'ready_for_page_builder',
    clearance_mode: 'AUTO_READY',
    generation_source_hash: fingerprintArtifact.hash,
    last_generated_at: generatedAt,
    publication_clearance: {
      fingerprint_algorithm: fingerprintArtifact.algorithm,
      // The EXACT canonical object that was hashed to produce
      // generation_source_hash -- not a second, independently-assembled
      // representation. This is what a Page Builder drafts from (see
      // docs/research/AIMT-Automated-Publication-Clearance.md's
      // corrected Page Builder contract): the immutable evidence
      // snapshot that actually earned AUTO_READY, not the full
      // topic-wide candidate pool.
      fingerprint_input: fingerprintArtifact.input,
      risk_tier: v1Result.risk_tier,
      excluded_claim_ids: pageEvidenceBrief.excluded_claim_ids,
      provenance: pageEvidenceBrief.provenance,
      candidate_claim_count: v1Result.metrics.candidate_claim_count,
      distinct_source_count: v1Result.metrics.distinct_source_count,
      generated_at: generatedAt,
    },
  };

  assertNoForbiddenFields(record);
  assertNoForbiddenFields(record.publication_clearance);
  return record;
}
