/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — durable candidate bundle (resume)
   ---------------------------------------------------------------
   WHY THIS EXISTS (real GitHub Actions shadow behavior): Run #3
   selected alopecia-areata, Publication Editor returned AUTO_READY,
   Education Writer ran, and deterministic validation stopped on a
   numeric Writer defect (EDITORIAL_REVIEW). Run #4 selected the SAME
   topic against the SAME underlying published/freshness context, but
   Publication Editor was invoked AGAIN from scratch -- and this time
   returned SYNTHESIS_FAILED. Publication Editor's synthesis step is
   INTENTIONALLY NONDETERMINISTIC (see publication-clearance-
   fingerprint.mjs's own header); a later, different synthesis result
   must never erase a previously-valid, unchanged clearance candidate.

   This module is PURE (verifyCandidateBundleIntegrity is async only
   because it delegates to Web-Crypto hashing, never network/DB I/O) --
   it never reads or writes a file itself. scripts/education-operations-
   cycle.mjs owns the actual disk read/write (research-import/education-
   ops/candidates/<topic_slug>/candidate.json, gitignored locally,
   uploaded/downloaded as a GitHub Actions artifact across runs) and
   calls into this module for every decision about whether a loaded
   bundle can be trusted and where to resume from.

   INTEGRITY vs FRESHNESS stay exactly as separate as everywhere else in
   this codebase (see publication-clearance-fingerprint.mjs's own
   header): integrity asks "is this stored artifact exactly the artifact
   Publication Editor produced?" (a hash re-check, deterministic).
   Freshness asks "has the underlying research changed since?" (a
   claim-set comparison against the CURRENT candidate pool). Neither one
   is a proxy for the other.
   ═══════════════════════════════════════════════════════════════ */

import { computeFreshnessDelta, FRESHNESS_STATE } from './education-freshness-monitor.mjs';
import { verifyStoredClearanceIntegrity } from '../research/publication-clearance-fingerprint.mjs';
import { validateIntentPlan } from './education-intent-planner-validator.mjs';

export const CANDIDATE_BUNDLE_CONTRACT_VERSION = 'education-candidate-bundle-v1';

export const RESUME_STAGE = Object.freeze({
  // Publication Editor's exact AUTO_READY artifact is persisted, but no
  // valid Writer plan exists yet -- resume by calling the Writer only.
  NEEDS_WRITER: 'NEEDS_WRITER',
  // A valid (post-repair, if repair was needed) Page Plan is persisted,
  // but no Reviewer verdict exists yet -- resume by calling the
  // Reviewer only.
  NEEDS_REVIEWER: 'NEEDS_REVIEWER',
  // The Reviewer's PASS verdict is persisted -- the candidate is ready
  // for --prepare with ZERO further model calls, unless freshness
  // invalidates it first.
  READY_FOR_PREPARE: 'READY_FOR_PREPARE',
  // The Reviewer's verdict is persisted and it was NOT a PASS -- a
  // governed content outcome, preserved as-is. Never auto-retried.
  EDITORIAL_REVIEW: 'EDITORIAL_REVIEW',
});

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * Pure constructor for a BRAND NEW candidate bundle -- used exactly
 * once per topic, the first time Publication Editor produces an
 * AUTO_READY artifact for it with no prior bundle on disk. Every later
 * advance to the SAME candidate (Writer done, Reviewer done) must go
 * through advanceCandidateBundle() instead, which preserves
 * originating_run_id/created_at/prepared_artifact untouched -- those
 * describe the run that actually produced Publication Editor's exact
 * artifact, never the run that merely resumed from it.
 *
 * @param {{
 *   runId: string, topicSlug: string, cluster: string, route: string,
 *   intentPlan: object, preparedArtifact: object,
 *   pagePlan?: object|null, writerValidation?: object|null,
 *   deterministicRepair?: object|null, reviewResult?: object|null,
 *   reviewerFramingRepair?: object|null,
 *   createdAt?: string,
 * }} args
 * @returns {object} a education-candidate-bundle-v1 bundle
 */
export function buildCandidateBundle({
  runId, topicSlug, cluster, route, intentPlan, preparedArtifact,
  pagePlan = null, writerValidation = null, deterministicRepair = null, reviewResult = null,
  reviewerFramingRepair = null,
  createdAt = new Date().toISOString(),
}) {
  const record = preparedArtifact.record;
  return {
    contract_version: CANDIDATE_BUNDLE_CONTRACT_VERSION,
    topic_slug: topicSlug,
    cluster,
    route,
    originating_run_id: runId,
    created_at: createdAt,
    intent_plan: intentPlan,
    // The EXACT artifact prepareTopicArtifact() produced -- never
    // rebuilt from pieces, never re-derived. See module header.
    prepared_artifact: preparedArtifact,
    generation_source_hash: record.generation_source_hash,
    fingerprint_input: record.publication_clearance.fingerprint_input,
    page_plan: pagePlan,
    writer_validation: writerValidation,
    deterministic_repair: deterministicRepair,
    review_result: reviewResult,
    // Bounded FRAMING-removal repair state (education-reviewer-framing-
    // repair.mjs) -- a SEPARATE field from deterministic_repair (the
    // Writer numeric-fidelity repair above): different repair lane,
    // different failure class, never overwrites or is overwritten by it.
    reviewer_framing_repair: reviewerFramingRepair,
    // Self-contained freshness inputs -- deliberately copied out of
    // prepared_artifact.record here (rather than reached into later)
    // so a future bundle-shape change to how PE artifacts are stored
    // can never silently break freshness resolution.
    freshness_basis: {
      selected_claim_ids: [...(record.key_claim_ids || [])],
      excluded_claim_ids: (record.publication_clearance.excluded_claim_ids || []).map((e) => e.claim_id),
    },
    source_ids: [...(record.source_ids || [])],
    selected_claim_ids: [...(record.key_claim_ids || [])],
  };
}

/**
 * Pure advance: merges newly-completed-stage fields onto an EXISTING
 * bundle (loaded from disk or just built this run) without touching
 * originating_run_id/created_at/intent_plan/prepared_artifact/
 * generation_source_hash/fingerprint_input/freshness_basis/source_ids/
 * selected_claim_ids -- those all describe Publication Editor's one
 * exact artifact and must never be re-derived once set. Never mutates
 * `bundle`.
 *
 * @param {object} bundle
 * @param {{pagePlan?: object|null, writerValidation?: object|null, deterministicRepair?: object|null, reviewResult?: object|null, reviewerFramingRepair?: object|null}} updates
 * @returns {object} a new bundle object
 */
export function advanceCandidateBundle(bundle, updates) {
  const next = { ...bundle };
  if ('pagePlan' in updates) next.page_plan = updates.pagePlan;
  if ('writerValidation' in updates) next.writer_validation = updates.writerValidation;
  if ('deterministicRepair' in updates) next.deterministic_repair = updates.deterministicRepair;
  if ('reviewResult' in updates) next.review_result = updates.reviewResult;
  if ('reviewerFramingRepair' in updates) next.reviewer_framing_repair = updates.reviewerFramingRepair;
  return next;
}

/**
 * Deterministic shape validation -- a bundle that fails this can never
 * be resumed from, REGARDLESS of what verifyStoredClearanceIntegrity()
 * would say about its nested prepared_artifact.record (which this
 * function never even reaches if the surrounding shape is already
 * wrong). Also cross-checks the bundle's own top-level convenience
 * copies (generation_source_hash, fingerprint_input, topic_slug) never
 * drifted from the prepared_artifact.record they were copied from at
 * construction time -- the same "never trust a convenience column
 * harder than the artifact it was copied from" posture
 * verifyStoredClearanceIntegrity() itself takes for
 * key_claim_ids/source_ids.
 *
 * @param {*} bundle
 * @returns {{valid: boolean, violations: string[]}}
 */
export function validateCandidateBundleShape(bundle) {
  const violations = [];
  if (!bundle || typeof bundle !== 'object') return { valid: false, violations: ['BUNDLE_NOT_AN_OBJECT'] };

  if (bundle.contract_version !== CANDIDATE_BUNDLE_CONTRACT_VERSION) violations.push('UNSUPPORTED_CONTRACT_VERSION');
  for (const key of ['topic_slug', 'cluster', 'route', 'originating_run_id', 'created_at', 'generation_source_hash']) {
    if (!isNonEmptyString(bundle[key])) violations.push(`MISSING_OR_INVALID:${key}`);
  }
  if (!bundle.intent_plan || typeof bundle.intent_plan !== 'object') violations.push('MISSING_OR_INVALID:intent_plan');
  if (!bundle.prepared_artifact || typeof bundle.prepared_artifact !== 'object' || !bundle.prepared_artifact.record || typeof bundle.prepared_artifact.record !== 'object') {
    violations.push('MISSING_OR_INVALID:prepared_artifact');
  }
  if (!bundle.fingerprint_input || typeof bundle.fingerprint_input !== 'object') violations.push('MISSING_OR_INVALID:fingerprint_input');
  if (!Array.isArray(bundle.selected_claim_ids)) violations.push('MISSING_OR_INVALID:selected_claim_ids');
  if (!Array.isArray(bundle.source_ids)) violations.push('MISSING_OR_INVALID:source_ids');
  if (!bundle.freshness_basis || !Array.isArray(bundle.freshness_basis.selected_claim_ids) || !Array.isArray(bundle.freshness_basis.excluded_claim_ids)) {
    violations.push('MISSING_OR_INVALID:freshness_basis');
  }
  if (bundle.page_plan !== null && bundle.page_plan !== undefined && typeof bundle.page_plan !== 'object') violations.push('INVALID_PAGE_PLAN_SHAPE');
  if (bundle.writer_validation != null && (typeof bundle.writer_validation !== 'object' || typeof bundle.writer_validation.valid !== 'boolean')) violations.push('INVALID_WRITER_VALIDATION_SHAPE');
  if (bundle.review_result != null && (typeof bundle.review_result !== 'object' || typeof bundle.review_result.outcome !== 'string')) violations.push('INVALID_REVIEW_RESULT_SHAPE');
  if (bundle.reviewer_framing_repair != null && (typeof bundle.reviewer_framing_repair !== 'object' || typeof bundle.reviewer_framing_repair.attempted !== 'boolean')) violations.push('INVALID_REVIEWER_FRAMING_REPAIR_SHAPE');

  if (bundle.prepared_artifact && bundle.prepared_artifact.record && typeof bundle.prepared_artifact.record === 'object') {
    const record = bundle.prepared_artifact.record;
    if (isNonEmptyString(bundle.generation_source_hash) && bundle.generation_source_hash !== record.generation_source_hash) {
      violations.push('HASH_MISMATCH_WITH_PREPARED_ARTIFACT');
    }
    if (record.publication_clearance && bundle.fingerprint_input
      && JSON.stringify(bundle.fingerprint_input) !== JSON.stringify(record.publication_clearance.fingerprint_input)) {
      violations.push('FINGERPRINT_INPUT_MISMATCH_WITH_PREPARED_ARTIFACT');
    }
    if (isNonEmptyString(bundle.topic_slug) && record.topic_slug !== bundle.topic_slug) {
      violations.push('TOPIC_SLUG_MISMATCH_WITH_PREPARED_ARTIFACT');
    }
  }

  return { valid: violations.length === 0, violations };
}

/**
 * Shape + the SAME hash-based integrity check every other reader of a
 * clearance artifact in this codebase uses
 * (publication-clearance-fingerprint.mjs#verifyStoredClearanceIntegrity)
 * + a defense-in-depth re-validation of the stored intent plan against
 * the deterministic intent validator a freshly-planned intent would
 * also have to pass. A malformed bundle, a hash mismatch, or a
 * corrupted intent plan all refuse the SAME way: no resume, no fallback
 * regeneration -- the caller decides what "no resume" means for the run
 * (see scripts/education-operations-cycle.mjs, INFRA_REVIEW).
 *
 * @param {*} bundle
 * @param {{verifyStoredClearanceIntegrityFn?: Function, validateIntentPlanFn?: Function}} [io] test-only overrides
 * @returns {Promise<{valid: boolean, violations: string[]}>}
 */
export async function verifyCandidateBundleIntegrity(bundle, io = {}) {
  const shape = validateCandidateBundleShape(bundle);
  if (!shape.valid) return { valid: false, violations: shape.violations };

  const verifyFn = io.verifyStoredClearanceIntegrityFn || verifyStoredClearanceIntegrity;
  const integrity = await verifyFn(bundle.prepared_artifact.record);
  if (!integrity.valid) return { valid: false, violations: integrity.violations };

  const validateIntentFn = io.validateIntentPlanFn || validateIntentPlan;
  const intentValidation = validateIntentFn(bundle.intent_plan, { expectedTopicSlug: bundle.topic_slug, expectedCluster: bundle.cluster });
  if (!intentValidation.valid) return { valid: false, violations: intentValidation.violations.map((v) => `STORED_INTENT_PLAN_INVALID:${v}`) };

  return { valid: true, violations: [] };
}

/**
 * PURE freshness comparison for a durable candidate -- reuses
 * education-freshness-monitor.mjs's own computeFreshnessDelta() (never
 * a second, independently-written comparison) by adapting
 * bundle.freshness_basis into the clearanceRow shape that function
 * expects. Never throws to the caller; a comparison that cannot be
 * performed (missing/malformed input) reports FRESHNESS_CHECK_FAILED --
 * fail closed, exactly like a live freshness I/O failure does.
 *
 * @param {object} bundle
 * @param {string[]} currentCandidateClaimIds - the CURRENT candidate
 *   claim id set for the same topic (e.g. selected.v1_result.candidate_claim_ids
 *   from this same run's own topic-selection step -- no second evidence
 *   fetch needed).
 * @returns {{state: string, new_claim_ids?: string[], removed_claim_ids?: string[], reason?: string}}
 */
export function resolveCandidateResumeFreshness(bundle, currentCandidateClaimIds) {
  if (!Array.isArray(currentCandidateClaimIds)) {
    return { state: FRESHNESS_STATE.FRESHNESS_CHECK_FAILED, reason: 'No current candidate claim id set available for freshness comparison.' };
  }
  if (!bundle || !bundle.freshness_basis || !Array.isArray(bundle.freshness_basis.selected_claim_ids) || !Array.isArray(bundle.freshness_basis.excluded_claim_ids)) {
    return { state: FRESHNESS_STATE.FRESHNESS_CHECK_FAILED, reason: 'Candidate bundle has no usable freshness_basis.' };
  }
  try {
    const pseudoClearanceRow = {
      key_claim_ids: bundle.freshness_basis.selected_claim_ids,
      publication_clearance: { excluded_claim_ids: bundle.freshness_basis.excluded_claim_ids.map((id) => ({ claim_id: id })) },
    };
    return computeFreshnessDelta(pseudoClearanceRow, currentCandidateClaimIds);
  } catch (err) {
    return { state: FRESHNESS_STATE.FRESHNESS_CHECK_FAILED, reason: err.message };
  }
}

/**
 * PURE stage classification -- see RESUME_STAGE above for what each
 * value means. Assumes the bundle has already passed
 * verifyCandidateBundleIntegrity() and a FRESH freshness check; calling
 * this on an unverified bundle is a caller bug, not something this
 * function tries to detect (it has no way to re-derive integrity).
 *
 * @param {object} bundle
 * @returns {string} one of RESUME_STAGE
 */
export function determineResumeStage(bundle) {
  if (!bundle.writer_validation || bundle.writer_validation.valid !== true || !bundle.page_plan) {
    return RESUME_STAGE.NEEDS_WRITER;
  }
  if (!bundle.review_result) {
    return RESUME_STAGE.NEEDS_REVIEWER;
  }
  if (bundle.review_result.outcome === 'PASS') {
    return RESUME_STAGE.READY_FOR_PREPARE;
  }
  return RESUME_STAGE.EDITORIAL_REVIEW;
}
