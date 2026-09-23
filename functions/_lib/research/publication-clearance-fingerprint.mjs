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
  const json = canonicalStringify(input);
  const bytes = new TextEncoder().encode(json);
  const digestBuffer = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digestBuffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Checks whether a previously-stored fingerprint still matches a
 * (possibly regenerated) page evidence brief -- the deterministic
 * invalidation check. Never throws; returns a structured result so a
 * caller can log/report exactly what happened.
 *
 * @param {string} topicSlug - see buildFingerprintInput()
 * @param {object} brief - the current page evidence brief
 * @param {string} storedFingerprint - the fingerprint recorded on a prior clearance
 * @returns {Promise<{stale: boolean, currentFingerprint: string}>}
 */
export async function isClearanceStale(topicSlug, brief, storedFingerprint) {
  const currentFingerprint = await computeEvidenceFingerprint(topicSlug, brief);
  return { stale: currentFingerprint !== storedFingerprint, currentFingerprint };
}
