/* ═══════════════════════════════════════════════════════════════
   AIMT Automated Publication Clearance — evidence-brief fingerprint (v2)
   ---------------------------------------------------------------
   PURE (aside from Web Crypto's digest call, which has no side effects
   and is deterministic for a given input -- the same posture this repo
   already takes toward stripe-webhook.js's signature verification).
   Zero I/O, zero database access, zero network calls.

   CRITICAL FINGERPRINT RULE (per the originating request): an AUTO_READY
   clearance applies to ONE EXACT evidence brief FOR ONE EXACT PAGE. If
   any of the following materially change, the prior clearance is stale
   and must not silently authorize a new page:
     - the page identity/intent itself (topic_slug, page_concept,
       public_intent, scope language) -- added in v2, see below
     - selected claims
     - core factual points
     - limitations
     - citation map
     - risk tier
     - source set

   CONTRACT CHANGE FROM v1 (bumped FINGERPRINT_ALGORITHM to
   'sha256-canonical-json-v2', never silently kept the old name once the
   canonical input changed): v1's fingerprint covered only the evidence
   CONTENT categories. That under-specified what a page-level clearance
   actually authorizes -- the same 128-claim evidence bundle could in
   principle be resynthesized for a DIFFERENT page question or a
   different practitioner-scope framing and still hash identically under
   v1, silently reusing a clearance that was never actually issued for
   that framing. v2 adds `topic_slug` (the stable page-concept
   identifier), `page_concept`, `public_intent`, and `scope_language` to
   the canonical input specifically so changing the intended page
   question or scope framing invalidates the prior clearance and forces
   a fresh Publication Editor pass.

   Everything else on a page evidence brief (review_timestamp, provenance/
   model-version metadata, excluded-claim reasons) is deliberately
   EXCLUDED from the fingerprint input -- it can differ between two runs
   of the same underlying evidence/intent without either having
   materially changed. This is also what makes two semantically-identical
   briefs with reordered/extra fields hash identically: canonicalization
   only ever extracts the named categories before hashing anything.

   KNOWN LIMITATION (documented per the originating request's own
   instruction to distinguish enforceable-now from speculative): a
   change in the synthesis MODEL or its version is NOT reflected in this
   fingerprint, only a change in the evidence/page-intent content itself.
   A future phase could fold `provenance.synthesis_model` into a
   *separate* staleness signal if AIMT decides a model/version change
   alone should also invalidate a prior clearance -- not implemented here
   because nothing in the current evidence-brief shape marks that
   distinction as materially relevant on its own, and speculative
   invalidation rules are explicitly out of scope for this phase.

   ── INTEGRITY vs. FRESHNESS -- these are two DIFFERENT questions, and
   this module deliberately keeps them separate (per architectural review
   after the initial version of this module conflated them):

   INTEGRITY asks: "Is this stored clearance artifact exactly the
   artifact AIMT cleared?" Answered by verifyStoredClearanceIntegrity()
   below: hash the PERSISTED fingerprint_input, compare to the PERSISTED
   generation_source_hash. No AI call, no regeneration, no network I/O.
   This is the ORDINARY check a Page Builder runs before drafting from an
   AUTO_READY row -- see docs/research/AIMT-Automated-Publication-
   Clearance.md's corrected Page Builder contract.

   FRESHNESS asks: "Has the underlying research changed enough that AIMT
   should run Publication Editor again?" That is a separate, NOT-YET-BUILT
   research-update/invalidation process, and it is NOT solved by silently
   rerunning synthesis every time a page is read. Publication Editor's
   synthesis step is NONDETERMINISTIC by design (an LLM call) -- the same
   unchanged evidence has already produced different, independently valid
   AUTO_READY briefs (different selected-claim counts) across separate
   runs of this repo's own hair-cycle pilot. Regenerating the brief and
   recomputing its fingerprint therefore CANNOT be used as a routine
   integrity check: a fingerprint mismatch there would not prove the
   stored clearance is invalid, only that the model produced a different
   (possibly equally valid) brief this time. isClearanceStale() below
   still exists for the FRESHNESS case -- comparing a stored fingerprint
   against a NEW brief that a human or process has intentionally, already
   generated via a fresh Publication Editor run -- but it must never be
   invoked by a Page Builder as its routine "is this still good" check.
   ═══════════════════════════════════════════════════════════════ */

export const FINGERPRINT_ALGORITHM = 'sha256-canonical-json-v2';

/** Recursively sorts object keys and array-of-primitive/records so two
    structurally-equivalent-but-differently-ordered inputs canonicalize
    identically. Never mutates the input. */
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = canonicalize(value[key]);
    return out;
  }
  return value;
}

/** Sorts an array of canonicalizable records by their own canonical JSON
    string, so array ORDER (e.g. core_factual_points listed in a
    different sequence) never changes the fingerprint on its own. */
function sortRecordsCanonically(records) {
  return records
    .map(canonicalize)
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

function sortStrings(values) {
  return [...(values || [])].sort();
}

/**
 * Extracts exactly the page-identity + materially-relevant evidence
 * categories from a page evidence brief (functions/_lib/research/
 * publication-synthesis-evidence.mjs#buildPageEvidenceBrief's output
 * shape) into a canonical object ready to be stringified and hashed.
 * Exported on its own (not just computeEvidenceFingerprint) so tests and
 * callers can inspect exactly what did/didn't feed the hash.
 *
 * `topicSlug` is taken as an explicit parameter, not read off the brief
 * -- buildPageEvidenceBrief() doesn't carry it, and the clearance layer
 * (which already knows the topic slug it's building a record for) is a
 * more honest source of truth for "which page is this clearance for"
 * than trusting it to be embedded in the brief itself.
 *
 * @param {string} topicSlug - the stable page-concept identifier this
 *   clearance is being issued for
 * @param {object} brief - a page evidence brief
 * @returns {object} canonical fingerprint input
 */
export function buildFingerprintInput(topicSlug, brief) {
  return {
    topic_slug: topicSlug,
    page_concept: brief.page_concept,
    public_intent: brief.public_intent,
    scope_language: canonicalize(brief.scope_language || {}),
    risk_tier: brief.risk_tier,
    selected_claim_ids: sortStrings(brief.approved_for_draft_claim_ids),
    core_factual_points: sortRecordsCanonically(
      (brief.core_factual_points || []).map((p) => ({ statement: p.statement, supporting_claim_ids: sortStrings(p.supporting_claim_ids) }))
    ),
    limitations: sortRecordsCanonically(
      (brief.limitations || []).map((p) => ({ statement: p.statement, supporting_claim_ids: sortStrings(p.supporting_claim_ids) }))
    ),
    citation_map: canonicalize(brief.citation_map || {}),
    source_ids: sortStrings(brief.source_ids),
  };
}

/** Deterministic JSON string for a canonicalized value -- same string in,
    same string out, regardless of input key/array order. */
export function canonicalStringify(value) {
  return JSON.stringify(canonicalize(value));
}

/** Web Crypto SHA-256 over a UTF-8 string, lowercase hex-encoded. The
    ONLY place this module hashes anything -- both computeEvidenceFingerprint
    and buildEvidenceFingerprintArtifact route through this single
    function so the hash algorithm/encoding can never drift between them. */
async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digestBuffer = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digestBuffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Computes the deterministic SHA-256 fingerprint of a page evidence
 * brief's page-identity + materially-relevant content. Uses Web Crypto
 * (globalThis.crypto.subtle), matching this repo's "Web Crypto + fetch
 * only" convention (functions/api/stripe-webhook.js's signature
 * verification) so the same function runs identically in a Cloudflare
 * Pages Function, a Cloudflare Worker, or a local Node script (Node's
 * global crypto.subtle) without a dependency.
 *
 * @param {string} topicSlug - see buildFingerprintInput()
 * @param {object} brief - a page evidence brief
 * @returns {Promise<string>} lowercase hex-encoded SHA-256 digest
 */
export async function computeEvidenceFingerprint(topicSlug, brief) {
  const input = buildFingerprintInput(topicSlug, brief);
  return sha256Hex(canonicalStringify(input));
}

/**
 * Builds the ONE atomic artifact a clearance record is ever built from:
 * the canonical fingerprint input, the algorithm that will hash it, and
 * the resulting hash -- computed from that SAME input object, in one
 * call. Exists specifically so a clearance record's persisted
 * `publication_clearance.fingerprint_input` can never diverge from the
 * content that actually produced `generation_source_hash`: callers
 * (buildAutoReadyClearanceRecord) take this whole artifact, never a
 * separately-supplied hash string and a separately-reconstructed input
 * object that could disagree with each other.
 *
 * @param {string} topicSlug - see buildFingerprintInput()
 * @param {object} brief - a page evidence brief
 * @returns {Promise<{algorithm: string, input: object, hash: string}>}
 */
export async function buildEvidenceFingerprintArtifact(topicSlug, brief) {
  const input = buildFingerprintInput(topicSlug, brief);
  const hash = await sha256Hex(canonicalStringify(input));
  return { algorithm: FINGERPRINT_ALGORITHM, input, hash };
}

/**
 * FRESHNESS check (see the header note above) -- checks whether a
 * previously-stored fingerprint still matches a NEW, already-generated
 * page evidence brief. This is for the case where a human or process has
 * intentionally re-run Publication Editor and produced a new validated
 * brief, and something needs to confirm whether that new brief actually
 * differs from what's currently cleared. It is NOT a routine integrity
 * check, and a Page Builder must never call this as its "is the stored
 * clearance still good" check -- Publication Editor's synthesis step is
 * nondeterministic, so simply regenerating a brief and refingerprinting
 * it can legitimately produce a different (not necessarily invalid)
 * result even when nothing about the underlying research changed. Use
 * verifyStoredClearanceIntegrity() for that instead. Never throws;
 * returns a structured result so a caller can log/report exactly what
 * happened.
 *
 * @param {string} topicSlug - see buildFingerprintInput()
 * @param {object} brief - a NEW page evidence brief, already generated
 * @param {string} storedFingerprint - the fingerprint recorded on a prior clearance
 * @returns {Promise<{stale: boolean, currentFingerprint: string}>}
 */
export async function isClearanceStale(topicSlug, brief, storedFingerprint) {
  const currentFingerprint = await computeEvidenceFingerprint(topicSlug, brief);
  return { stale: currentFingerprint !== storedFingerprint, currentFingerprint };
}

function arraysEqualAsSets(a, b) {
  const sa = [...(a || [])].sort();
  const sb = [...(b || [])].sort();
  return sa.length === sb.length && sa.every((v, i) => v === sb[i]);
}

/**
 * INTEGRITY check (see the header note above) -- the ORDINARY check a
 * Page Builder (or anything else reading a cleared row) runs before
 * trusting a `research_public_pages` row's clearance. PURE + Web Crypto
 * only: no AI call, no database write, no regeneration of anything.
 * Re-hashes the row's OWN persisted `publication_clearance.fingerprint_input`
 * and compares against the row's OWN persisted `generation_source_hash`
 * -- proving the stored evidence snapshot is exactly the snapshot that
 * was hashed when clearance was issued, nothing more.
 *
 * Also cross-checks that the top-level convenience columns
 * (`key_claim_ids`, `source_ids`) and `publication_clearance.risk_tier`
 * (kept duplicated outside `fingerprint_input` for at-a-glance reading)
 * haven't drifted from the canonical `fingerprint_input` they were
 * derived from -- a hash match alone wouldn't catch a bug that mutated
 * only the convenience columns after the fact, since those columns
 * aren't part of what's hashed.
 *
 * ALGORITHM ENFORCEMENT: a row's `fingerprint_algorithm` must equal this
 * module's own `FINGERPRINT_ALGORITHM` exactly. If a row claims an
 * algorithm this code doesn't recognize (missing, or e.g. a future/typo'd
 * `sha256-canonical-json-v999`), this function refuses to hash the input
 * under the v2 implementation and pretend that proves anything --
 * hashing under an algorithm the row doesn't actually claim would
 * silently validate a claim this code has no basis for. A future
 * algorithm version should add explicit per-version dispatch here, not
 * assume every stored row means "v2."
 *
 * @param {object} record - a research_public_pages-shaped row (or
 *   candidate record before write)
 * @returns {Promise<{valid: boolean, expected_hash: string|null, stored_hash: string|null, violations: string[]}>}
 */
export async function verifyStoredClearanceIntegrity(record) {
  const violations = [];
  const clearance = record.publication_clearance;
  const storedHash = record.generation_source_hash ?? null;

  const algorithm = clearance && typeof clearance === 'object' ? clearance.fingerprint_algorithm : null;
  if (!algorithm) {
    violations.push('MISSING_FINGERPRINT_ALGORITHM');
    return { valid: false, expected_hash: null, stored_hash: storedHash, violations };
  }
  if (algorithm !== FINGERPRINT_ALGORITHM) {
    violations.push('UNSUPPORTED_FINGERPRINT_ALGORITHM');
    return { valid: false, expected_hash: null, stored_hash: storedHash, violations };
  }

  const input = clearance && typeof clearance === 'object' ? clearance.fingerprint_input : null;
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length === 0) {
    violations.push('MISSING_FINGERPRINT_INPUT');
    return { valid: false, expected_hash: null, stored_hash: storedHash, violations };
  }

  const expectedHash = await sha256Hex(canonicalStringify(input));
  if (expectedHash !== storedHash) {
    violations.push('HASH_MISMATCH');
  }
  if (record.topic_slug !== input.topic_slug) {
    violations.push('TOPIC_SLUG_MISMATCH');
  }
  if (!arraysEqualAsSets(record.key_claim_ids, input.selected_claim_ids)) {
    violations.push('KEY_CLAIM_IDS_MISMATCH');
  }
  if (!arraysEqualAsSets(record.source_ids, input.source_ids)) {
    violations.push('SOURCE_IDS_MISMATCH');
  }
  if (clearance.risk_tier !== undefined && clearance.risk_tier !== input.risk_tier) {
    violations.push('RISK_TIER_MISMATCH');
  }

  return { valid: violations.length === 0, expected_hash: expectedHash, stored_hash: storedHash, violations };
}
