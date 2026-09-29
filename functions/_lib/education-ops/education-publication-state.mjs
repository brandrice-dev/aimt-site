/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — production publication manifest
   ---------------------------------------------------------------
   PURE (aside from the digest helper's Web Crypto call, which has no
   side effects and no I/O -- same posture as publication-clearance-
   fingerprint.mjs). This is the small, explicit state contract the
   production publish lane (scripts/education-operations-cycle.mjs
   #runPublicationPipeline) needs to resume deterministically across
   SEPARATE GitHub Actions runs: which generated branch/PR belongs to
   which already-cleared candidate, how far the merge/deploy/live-
   verify/DB-publish sequence has gotten, and the exact identifiers
   required to prove a later run is CONTINUING the same publication
   rather than starting a new one or resuming the wrong one.

   This is deliberately NOT the run ledger (education-run-ledger.mjs)
   -- the run ledger describes one run; this manifest describes one
   IN-FLIGHT PUBLICATION, persisted durably (as a named GitHub Actions
   artifact, same mechanism as education-candidate-bundle.mjs) across
   as many runs as it takes to reach PUBLISHED or PUBLISH_FAILED.
   ═══════════════════════════════════════════════════════════════ */

export const PUBLICATION_MANIFEST_CONTRACT_VERSION = 'education-publication-manifest-v1';

// Deliberately small -- see the originating task's own "do not overbuild
// this" instruction. Exists only to make cross-run resume deterministic
// and observable, not to model every conceivable publishing detail.
export const PUBLICATION_STATE = Object.freeze({
  PREPARED: 'PREPARED', // artifacts generated locally, not yet pushed/PR'd
  PR_OPEN: 'PR_OPEN', // generated branch pushed, PR open, not yet merged
  CLEARANCE_PERSISTED: 'CLEARANCE_PERSISTED', // non-public ready_for_page_builder row written
  MERGED: 'MERGED', // PR merged into main
  DEPLOYING: 'DEPLOYING', // waiting for the Cloudflare Pages production deployment for the merge commit
  LIVE_VERIFIED: 'LIVE_VERIFIED', // production deployment confirmed AND live-route checks passed
  PUBLISHED: 'PUBLISHED', // DB row confirmed status=published, sitemap_eligible=true, post-write integrity PASS
  PUBLISH_FAILED: 'PUBLISH_FAILED', // safe terminal stop -- see module header on scripts/education-operations-cycle.mjs
});

const HEX64 = /^[0-9a-f]{64}$/;

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

/** Web Crypto SHA-256 over a UTF-8 string, lowercase hex-encoded -- same
    algorithm/encoding convention as publication-clearance-fingerprint.mjs's
    own sha256Hex, kept as a separate tiny copy here rather than importing
    a private (non-exported) helper from that module. */
async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digestBuffer = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digestBuffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Deterministic key ordering so the SAME object always hashes to the
    SAME digest regardless of property insertion order -- the exact
    concern publication-clearance-fingerprint.mjs#canonicalStringify
    exists for; duplicated here (not imported) so this module never
    depends on that module's hashing purpose for a completely different
    kind of digest (a whole prepared-artifact object, not an evidence
    fingerprint input). */
function canonicalStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => canonicalStringify(v)).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalStringify(value[k])}`).join(',')}}`;
}

/**
 * The digest a LATER publish run must match against before it will ever
 * treat a resumed publication as "the same exact prepared bytes" -- see
 * "Never reconstruct or re-synthesize them" in the originating task.
 *
 * @param {object} preparedArtifact - the EXACT prepareTopicArtifact()
 *   output already durably persisted inside the candidate bundle
 *   (bundle.prepared_artifact) -- never rebuilt from pieces.
 * @returns {Promise<string>} lowercase hex-encoded SHA-256 digest
 */
export async function computePreparedArtifactDigest(preparedArtifact) {
  return sha256Hex(canonicalStringify(preparedArtifact));
}

/**
 * Pure constructor for a BRAND NEW publication manifest -- used exactly
 * once per publication, the first time the publish pipeline verifies a
 * candidate and is about to generate its artifacts. Binds every
 * identifier the originating task requires to prove a later run is
 * continuing the SAME publication.
 *
 * @param {{
 *   runId: string, topicSlug: string, route: string, cluster: string,
 *   generationSourceHash: string, preparedArtifactDigest: string,
 *   candidateOriginatingRunId: string, createdAt?: string,
 * }} args
 * @returns {object} an education-publication-manifest-v1 manifest
 */
export function buildPublicationManifest({
  runId, topicSlug, route, cluster, generationSourceHash, preparedArtifactDigest, candidateOriginatingRunId,
  createdAt = new Date().toISOString(),
}) {
  return {
    contract_version: PUBLICATION_MANIFEST_CONTRACT_VERSION,
    topic_slug: topicSlug,
    route,
    cluster,
    generation_source_hash: generationSourceHash,
    prepared_artifact_digest: preparedArtifactDigest,
    candidate_originating_run_id: candidateOriginatingRunId,
    publish_originating_run_id: runId,
    state: PUBLICATION_STATE.PREPARED,
    generated: { branch: null, pr_number: null, pr_url: null, expected_head_sha: null, article_path: null, plan_artifact_path: null, hub_path: null, sitemap_path: null },
    merge: { merged: false, merge_commit_sha: null, merged_at: null },
    deployment: { state: null, deployment_id: null, checked_at: null },
    live_verification: { passed: null, checked_at: null, checks: null },
    clearance: { persisted: false, mode: null, persisted_at: null },
    db_publish: { attempted: false, verified: false, published_at: null },
    // The last STAGE-LEVEL failure, if any -- purely observational. Which
    // stage a resume actually continues from is ALWAYS decided by
    // determinePublicationResumeStage() below, from the sub-fields above
    // (has a PR been opened, has clearance been persisted, has it
    // merged, ...), never from `state`/`last_failure` alone -- a
    // PUBLISH_FAILED run (a deployment timeout, a failed live check, ...)
    // must remain retryable on a later run, per the fail-closed rule
    // that a failed deploy/verification "waits for a future retry/resume",
    // never a permanent park (contrast the framing-repair one-attempt
    // guard, which is deliberately NOT retryable -- publishing failures
    // here are infrastructure/timing, not a content judgment).
    last_failure: null,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

/**
 * Pure advance: merges newly-completed-stage fields onto an EXISTING
 * manifest (loaded from disk or just built this run) without touching
 * topic_slug/route/cluster/generation_source_hash/prepared_artifact_digest/
 * candidate_originating_run_id/publish_originating_run_id/created_at --
 * those describe the ONE publication this manifest is durably for, and
 * must never drift once set. Never mutates `manifest`.
 *
 * @param {object} manifest
 * @param {{state?: string, generated?: object, merge?: object, deployment?: object, liveVerification?: object, clearance?: object, dbPublish?: object, updatedAt?: string}} updates
 * @returns {object} a new manifest object
 */
export function advancePublicationManifest(manifest, updates) {
  const next = { ...manifest, updated_at: updates.updatedAt || new Date().toISOString() };
  if ('state' in updates) next.state = updates.state;
  if ('generated' in updates) next.generated = { ...manifest.generated, ...updates.generated };
  if ('merge' in updates) next.merge = { ...manifest.merge, ...updates.merge };
  if ('deployment' in updates) next.deployment = { ...manifest.deployment, ...updates.deployment };
  if ('liveVerification' in updates) next.live_verification = { ...manifest.live_verification, ...updates.liveVerification };
  if ('clearance' in updates) next.clearance = { ...manifest.clearance, ...updates.clearance };
  if ('dbPublish' in updates) next.db_publish = { ...manifest.db_publish, ...updates.dbPublish };
  if ('lastFailure' in updates) next.last_failure = updates.lastFailure;
  return next;
}

/**
 * The AUTHORITATIVE resume dispatcher -- decides which stage a run must
 * continue from purely from the manifest's own sub-fields (never from
 * `state`/`last_failure`), so a PUBLISH_FAILED manifest (a deployment
 * timeout, a failed live check, a merge that hadn't happened yet) is
 * ALWAYS retryable from exactly where it actually got to, never stuck.
 *
 * @param {object} manifest
 * @returns {string} one of PUBLICATION_STATE
 */
export function determinePublicationResumeStage(manifest) {
  if (manifest.db_publish && manifest.db_publish.verified === true) return PUBLICATION_STATE.PUBLISHED;
  if (manifest.live_verification && manifest.live_verification.passed === true) return PUBLICATION_STATE.LIVE_VERIFIED;
  if (manifest.merge && manifest.merge.merged === true) return PUBLICATION_STATE.MERGED;
  if (manifest.clearance && manifest.clearance.persisted === true) return PUBLICATION_STATE.CLEARANCE_PERSISTED;
  if (manifest.generated && Number.isInteger(manifest.generated.pr_number)) return PUBLICATION_STATE.PR_OPEN;
  return PUBLICATION_STATE.PREPARED;
}

/**
 * Deterministic shape validation -- a manifest that fails this can never
 * be resumed from. Mirrors education-candidate-bundle.mjs
 * #validateCandidateBundleShape's posture: fail closed on anything
 * unrecognized rather than guessing.
 *
 * @param {*} manifest
 * @returns {{valid: boolean, violations: string[]}}
 */
export function validatePublicationManifestShape(manifest) {
  const violations = [];
  if (!manifest || typeof manifest !== 'object') return { valid: false, violations: ['MANIFEST_NOT_AN_OBJECT'] };

  if (manifest.contract_version !== PUBLICATION_MANIFEST_CONTRACT_VERSION) violations.push('UNSUPPORTED_CONTRACT_VERSION');
  for (const key of ['topic_slug', 'route', 'cluster', 'generation_source_hash', 'candidate_originating_run_id', 'publish_originating_run_id', 'created_at', 'updated_at']) {
    if (!isNonEmptyString(manifest[key])) violations.push(`MISSING_OR_INVALID:${key}`);
  }
  if (!HEX64.test(manifest.prepared_artifact_digest || '')) violations.push('MISSING_OR_INVALID:prepared_artifact_digest');
  if (!Object.values(PUBLICATION_STATE).includes(manifest.state)) violations.push('MISSING_OR_INVALID:state');
  if (!manifest.generated || typeof manifest.generated !== 'object') violations.push('MISSING_OR_INVALID:generated');
  if (!manifest.merge || typeof manifest.merge !== 'object' || typeof manifest.merge.merged !== 'boolean') violations.push('MISSING_OR_INVALID:merge');
  if (!manifest.deployment || typeof manifest.deployment !== 'object') violations.push('MISSING_OR_INVALID:deployment');
  if (!manifest.live_verification || typeof manifest.live_verification !== 'object') violations.push('MISSING_OR_INVALID:live_verification');
  if (!manifest.clearance || typeof manifest.clearance !== 'object' || typeof manifest.clearance.persisted !== 'boolean') violations.push('MISSING_OR_INVALID:clearance');
  if (!manifest.db_publish || typeof manifest.db_publish !== 'object' || typeof manifest.db_publish.attempted !== 'boolean') violations.push('MISSING_OR_INVALID:db_publish');
  if (manifest.last_failure != null && (typeof manifest.last_failure !== 'object' || typeof manifest.last_failure.stage !== 'string')) violations.push('INVALID_LAST_FAILURE_SHAPE');

  // Once a PR is recorded as open, its identifying fields must ALL be
  // present together -- a manifest that claims PR_OPEN-or-later with a
  // half-recorded PR is corrupt, never "close enough to resume from".
  if (manifest.state && manifest.state !== PUBLICATION_STATE.PREPARED && manifest.generated) {
    if (!Number.isInteger(manifest.generated.pr_number) || !isNonEmptyString(manifest.generated.branch) || !isNonEmptyString(manifest.generated.expected_head_sha)) {
      violations.push('INCOMPLETE_GENERATED_PR_IDENTIFIERS_FOR_STATE');
    }
  }

  return { valid: violations.length === 0, violations };
}

/**
 * Pure consistency check: does this manifest actually describe the SAME
 * publication the caller is currently trying to continue? Used both to
 * detect a stale/conflicting manifest on disk (a topic_slug directory
 * reused for a genuinely different candidate) and to prove, at every
 * resume point, that nothing about the underlying candidate has drifted
 * since the manifest was created.
 *
 * @param {object} manifest
 * @param {{topicSlug: string, route: string, generationSourceHash: string, preparedArtifactDigest: string}} expected
 * @returns {{matches: boolean, violations: string[]}}
 */
export function isManifestForSameCandidate(manifest, { topicSlug, route, generationSourceHash, preparedArtifactDigest }) {
  const violations = [];
  if (manifest.topic_slug !== topicSlug) violations.push(`TOPIC_SLUG_MISMATCH:${manifest.topic_slug}!=${topicSlug}`);
  if (manifest.route !== route) violations.push(`ROUTE_MISMATCH:${manifest.route}!=${route}`);
  if (manifest.generation_source_hash !== generationSourceHash) violations.push(`GENERATION_SOURCE_HASH_MISMATCH:${manifest.generation_source_hash}!=${generationSourceHash}`);
  if (manifest.prepared_artifact_digest !== preparedArtifactDigest) violations.push(`PREPARED_ARTIFACT_DIGEST_MISMATCH:${manifest.prepared_artifact_digest}!=${preparedArtifactDigest}`);
  return { matches: violations.length === 0, violations };
}
