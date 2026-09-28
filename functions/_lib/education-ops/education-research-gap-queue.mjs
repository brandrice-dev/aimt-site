/* ═══════════════════════════════════════════════════════════════
   AIMT Research-Gap Feedback Loop v1 — publication_evidence_gap lane
   ---------------------------------------------------------------
   WHY THIS EXISTS: Education Operations Run #7 selected alopecia-areata
   and Publication Editor returned a VALID governed result --
   HUMAN_REVIEW / model_declared_human_review /
   human_review_justification.reason_code = EVIDENCE_INSUFFICIENCY. That
   is not a validator defect and not a scientific/safety exception; it
   is ordinary "the research library doesn't have enough evidence for
   this page yet" -- routine evidence acquisition that should route to
   Rick (the Grok research harvester), not to the owner's human-review
   queue.

   This module owns ONE narrow operational lane on the EXISTING
   public.research_verification_queue table (supabase/migrations/
   20260920_create_research_library.sql §6 -- deliberately free-form:
   no CHECK constraint on lane/status, so this is additive, not a schema
   change): lane = 'publication_evidence_gap'. It NEVER reads or writes
   any other lane, and never touches research_claims/research_sources/
   research_public_pages/course/Cadence/Stripe/auth data.

   contract: education-research-gap-v1 (see buildResearchGapExtras()).
   queue_id is DETERMINISTIC per topic (`publication_evidence_gap:
   <topic_slug>`) -- there is at most ONE row per topic in this lane,
   ever; it cycles through pending -> claimed -> research_received ->
   (resolved | back to pending) over its lifetime rather than
   accumulating duplicate rows (see computeGapUpsertPayload below).

   PURE vs I/O, same split this codebase already uses everywhere else
   (see education-freshness-monitor.mjs's own header comment): every
   decision function here (computeGapUpsertPayload, the determine-
   Transition helpers, isTopicHeldByResearchGap) is pure and
   exhaustively unit-tested directly; the I/O wrappers (the load/list/
   upsert/mark/resolve functions below) are thin fetch() calls exercised
   only by shape/injection at the orchestrator and MCP-tool call sites,
   never by mocking global fetch.
   ═══════════════════════════════════════════════════════════════ */

export const RESEARCH_GAP_CONTRACT_VERSION = 'education-research-gap-v1';
export const RESEARCH_GAP_LANE = 'publication_evidence_gap';
export const RESEARCH_GAP_ITEM_TYPE = 'education_page';

export const RESEARCH_GAP_STATUS = Object.freeze({
  PENDING: 'pending',
  CLAIMED: 'claimed',
  RESEARCH_RECEIVED: 'research_received',
  RESOLVED: 'resolved',
});

// Statuses that count as "an active gap exists" -- i.e. NOT resolved.
const ACTIVE_STATUSES = Object.freeze([RESEARCH_GAP_STATUS.PENDING, RESEARCH_GAP_STATUS.CLAIMED, RESEARCH_GAP_STATUS.RESEARCH_RECEIVED]);
// Statuses a topic-selector hold applies to -- research_received has
// ALREADY released the topic for re-evaluation (see isTopicHeldByResearchGap).
const HOLDING_STATUSES = Object.freeze([RESEARCH_GAP_STATUS.PENDING, RESEARCH_GAP_STATUS.CLAIMED]);

export class ResearchGapQueueError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ResearchGapQueueError';
  }
}

/** Deterministic, stable id: one row per topic, for the lifetime of the
    lane. Exported so callers (MCP tools, orchestrator, tests) never
    hand-construct this string independently. */
export function buildResearchGapQueueId(topicSlug) {
  return `${RESEARCH_GAP_LANE}:${topicSlug}`;
}

function requireSupabaseEnv(env, fnName) {
  if (!env || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new ResearchGapQueueError(`${fnName}: missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY`);
  }
}

/**
 * PURE. Given the row currently on disk for this topic's gap (or null if
 * none exists yet) and the freshly-observed EVIDENCE_INSUFFICIENCY
 * details, computes the EXACT row to upsert. Never mutates `existingRow`.
 *
 * Idempotency rule (section 2 of the originating request): re-observing
 * the SAME active gap never creates a second row -- it updates the one
 * deterministic row for this topic, incrementing attempt_count. A gap
 * that was previously RESOLVED and is now recurring starts a fresh
 * cycle (attempt_count resets to 1, prior claim/research/resolve
 * timestamps are cleared) rather than silently inheriting a closed-out
 * history.
 *
 * @param {object|null} existingRow - the current queue row for this
 *   topic (as returned by the REST API: top-level columns + `extras`),
 *   or null if no row exists yet.
 * @param {{
 *   topicSlug: string, cluster: string, pageConcept: string,
 *   publicIntent: string, inScopeConcepts: string[], gapSummary: string,
 *   originatingRunId: string, originatingPageIntent: object,
 *   baselineCandidateClaimIds: string[], controlledTopics: string[],
 * }} observed - `controlledTopics` (CORRECTION 1) is the page concept's
 *   own controlled research topics (`selected.concept.controlled_topics`
 *   -- deterministic from the topic_slug via PILOT_TOPIC_CONCEPTS, so it
 *   is stored "at creation time" but is simply the same value on every
 *   later re-observation too), used to gate whether a later targeted
 *   research submission is actually RELEVANT to this gap -- see
 *   hasRelevantVerifiedClaim() below.
 * @returns {object} the full row payload (top-level columns + `extras`)
 *   ready to POST as an upsert.
 */
export function computeGapUpsertPayload(existingRow, observed) {
  const queueId = buildResearchGapQueueId(observed.topicSlug);
  const priorExtras = (existingRow && existingRow.extras) || {};
  const startingFreshCycle = !existingRow || existingRow.status === RESEARCH_GAP_STATUS.RESOLVED;
  const attemptCount = startingFreshCycle ? 1 : (typeof priorExtras.attempt_count === 'number' ? priorExtras.attempt_count : 0) + 1;

  const extras = {
    contract_version: RESEARCH_GAP_CONTRACT_VERSION,
    topic_slug: observed.topicSlug,
    cluster: observed.cluster,
    page_concept: observed.pageConcept,
    public_intent: observed.publicIntent,
    in_scope_concepts: observed.inScopeConcepts,
    controlled_topics: [...(observed.controlledTopics || [])],
    gap_summary: observed.gapSummary,
    originating_run_id: observed.originatingRunId,
    originating_page_intent: observed.originatingPageIntent,
    baseline_candidate_claim_ids: [...(observed.baselineCandidateClaimIds || [])],
    attempt_count: attemptCount,
    // A re-triggered EVIDENCE_INSUFFICIENCY (or a fresh cycle after a
    // prior resolution) returns the gap to pending, unclaimed -- any
    // in-flight claim/research receipt from the PREVIOUS cycle is
    // cleared, since it was already evaluated and found insufficient.
    claimed_at: null,
    claimed_by: null,
    research_batch_id: null,
    research_received_at: null,
    resolved_at: null,
  };

  return {
    queue_id: queueId,
    lane: RESEARCH_GAP_LANE,
    item_type: RESEARCH_GAP_ITEM_TYPE,
    item_id: observed.topicSlug,
    priority: 90,
    priority_band: 'high',
    topics_raw: observed.topicSlug,
    status: RESEARCH_GAP_STATUS.PENDING,
    notes: observed.gapSummary,
    extras,
  };
}

/**
 * PURE. Decides the outcome of claiming a gap by id. Fails closed for
 * anything not cleanly "pending -> claimed": a resolved gap is a
 * governed non-success (not an error), a stale/unknown row is a
 * governed failure, and re-claiming an already-claimed gap is a no-op
 * success (idempotent -- the ORIGINAL claimed_at/claimed_by are
 * preserved, never overwritten by a later duplicate call).
 *
 * @param {object|null} existingRow
 * @param {{claimedBy: string, claimedAt: string}} args
 * @returns {{ok: boolean, reason: string, payload: object|null}}
 *   payload is the extras patch to write when ok, else null.
 */
export function determineClaimTransition(existingRow, { claimedBy, claimedAt }) {
  if (!existingRow) return { ok: false, reason: 'NOT_FOUND', payload: null };
  if (existingRow.lane !== RESEARCH_GAP_LANE) return { ok: false, reason: 'WRONG_LANE', payload: null };
  if (existingRow.status === RESEARCH_GAP_STATUS.RESOLVED) return { ok: false, reason: 'ALREADY_RESOLVED', payload: null };
  if (existingRow.status === RESEARCH_GAP_STATUS.CLAIMED) {
    // Idempotent: same active gap, already claimed -- succeed without
    // touching the original claim timestamp/owner.
    return { ok: true, reason: 'ALREADY_CLAIMED', payload: null };
  }
  if (existingRow.status !== RESEARCH_GAP_STATUS.PENDING) {
    // e.g. research_received -- not a valid source state for a fresh
    // claim; fail closed rather than guess.
    return { ok: false, reason: 'NOT_CLAIMABLE_IN_CURRENT_STATUS', payload: null };
  }
  return {
    ok: true,
    reason: 'CLAIMED',
    payload: { status: RESEARCH_GAP_STATUS.CLAIMED, extras: { ...existingRow.extras, claimed_at: claimedAt, claimed_by: claimedBy } },
  };
}

/**
 * PURE. Decides the outcome of marking a gap research_received. Only
 * fires when ingestion accepted at least some usable research material
 * (the caller decides that upstream -- see markGapResearchReceivedById's
 * own doc). Fails closed for a missing row, wrong lane, or an already-
 * resolved gap.
 */
export function determineResearchReceivedTransition(existingRow, { researchBatchId, receivedAt }) {
  if (!existingRow) return { ok: false, reason: 'NOT_FOUND', payload: null };
  if (existingRow.lane !== RESEARCH_GAP_LANE) return { ok: false, reason: 'WRONG_LANE', payload: null };
  if (existingRow.status === RESEARCH_GAP_STATUS.RESOLVED) return { ok: false, reason: 'ALREADY_RESOLVED', payload: null };
  return {
    ok: true,
    reason: 'RESEARCH_RECEIVED',
    payload: {
      status: RESEARCH_GAP_STATUS.RESEARCH_RECEIVED,
      extras: { ...existingRow.extras, research_batch_id: researchBatchId, research_received_at: receivedAt },
    },
  };
}

/**
 * PURE. Read-only eligibility check for linking a research submission
 * (MCP submit_research_batch's optional research_gap_id) to a gap --
 * never mutates anything itself. Section 8 of the originating request:
 * "verify the referenced row exists / verify lane = publication_
 * evidence_gap / verify it is not resolved" -- a failure here never
 * blocks the underlying research submission (the caller still runs the
 * EXACT existing canonical ingestion pipeline regardless), it only
 * means the batch will not be linked back to this gap_id.
 */
export function determineGapLinkVerification(existingRow) {
  if (!existingRow) return { ok: false, reason: 'NOT_FOUND' };
  if (existingRow.lane !== RESEARCH_GAP_LANE) return { ok: false, reason: 'WRONG_LANE' };
  if (existingRow.status === RESEARCH_GAP_STATUS.RESOLVED) return { ok: false, reason: 'ALREADY_RESOLVED' };
  return { ok: true, reason: 'LINKABLE' };
}

/**
 * PURE. CORRECTION 1 -- the relevant-verified-claim gate. `research_
 * received` must mean "the canonical ingestion pipeline actually
 * accepted/imported at least one claim that is BOTH relevant to this
 * gap's own controlled_topics AND at verification_status
 * CLAIM_VERIFIED" -- never merely "something, anything, was accepted in
 * the same batch." An unrelated accepted claim, an accepted source with
 * no relevant accepted claim, DISCOVERED-only material, and a relevant
 * claim that was itself quarantined/orphaned/rejected (and therefore
 * never appears in `processedClaims` at all, since that list is the
 * canonical ingestion pipeline's OWN record of what it actually
 * processed -- see importer.mjs's `claimsToProcess`) all correctly
 * return false here.
 *
 * @param {Array<{claim_id: string, topics?: string[], verification_status?: string}>|null|undefined} processedClaims
 *   -- claims the canonical ingestion pipeline actually accepted/
 *   imported this batch (never the raw submitted batch, never a
 *   rejected/quarantined/orphaned claim).
 * @param {string[]|null|undefined} controlledTopics - the gap's own
 *   `extras.controlled_topics`.
 * @returns {boolean}
 */
export function hasRelevantVerifiedClaim(processedClaims, controlledTopics) {
  if (!Array.isArray(processedClaims) || !Array.isArray(controlledTopics) || controlledTopics.length === 0) return false;
  const topicSet = new Set(controlledTopics);
  return processedClaims.some((c) => (
    c && c.verification_status === 'CLAIM_VERIFIED'
    && Array.isArray(c.topics) && c.topics.some((t) => topicSet.has(t))
  ));
}

/** PURE. Resolving is idempotent (already-resolved -> ok no-op) and
    fails closed only for a genuinely missing row. */
export function determineResolveTransition(existingRow, { resolvedAt }) {
  if (!existingRow) return { ok: false, reason: 'NOT_FOUND', payload: null };
  if (existingRow.status === RESEARCH_GAP_STATUS.RESOLVED) return { ok: true, reason: 'ALREADY_RESOLVED', payload: null };
  return {
    ok: true,
    reason: 'RESOLVED',
    payload: { status: RESEARCH_GAP_STATUS.RESOLVED, extras: { ...existingRow.extras, resolved_at: resolvedAt } },
  };
}

/**
 * PURE. The topic-selector hold check (section 4/5 of the originating
 * request). A topic is held ineligible ONLY when an active gap for it
 * is still pending/claimed AND the CURRENT candidate claim-id set is
 * IDENTICAL (as a set) to the baseline recorded when the gap was
 * created/last updated. Either a claim-id-set change (release A) or a
 * research_received status (release B) frees the topic for
 * re-evaluation -- a resolved gap, or no gap at all, never holds
 * anything.
 *
 * @param {object|null} gapRow - the active-lane row for this topic, or
 *   null/undefined if none exists.
 * @param {string[]} currentCandidateClaimIds
 * @returns {boolean} true = still held (RESEARCH_GAP_PENDING)
 */
export function isTopicHeldByResearchGap(gapRow, currentCandidateClaimIds) {
  if (!gapRow || !HOLDING_STATUSES.includes(gapRow.status)) return false;
  const baseline = (gapRow.extras && Array.isArray(gapRow.extras.baseline_candidate_claim_ids)) ? gapRow.extras.baseline_candidate_claim_ids : [];
  const currentSet = new Set(currentCandidateClaimIds || []);
  const baselineSet = new Set(baseline);
  if (currentSet.size !== baselineSet.size) return false;
  for (const id of currentSet) if (!baselineSet.has(id)) return false;
  return true;
}

/** Real (fetch-based) upsert -- POST with resolution=merge-duplicates so
    PostgREST upserts on the primary key (queue_id) automatically, same
    convention as publication-clearance-writer.mjs#writeClearanceRecord. */
async function upsertRow(env, payload) {
  requireSupabaseEnv(env, 'education-research-gap-queue upsert');
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/research_verification_queue`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new ResearchGapQueueError(`education-research-gap-queue upsert failed (${res.status}): ${errBody.slice(0, 500)}`);
  }
  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

/** Real (fetch-based) single-row read by queue_id, scoped defensively to
    this lane even though queue_id is already lane-namespaced. Returns
    null if not found. */
async function fetchRowById(env, queueId) {
  requireSupabaseEnv(env, 'education-research-gap-queue read');
  const qs = new URLSearchParams();
  qs.set('select', '*');
  qs.set('queue_id', `eq.${queueId}`);
  qs.set('lane', `eq.${RESEARCH_GAP_LANE}`);
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/research_verification_queue?${qs.toString()}`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) {
    throw new ResearchGapQueueError(`education-research-gap-queue read failed (${res.status}): ${(await res.text().catch(() => '')).slice(0, 500)}`);
  }
  const rows = await res.json();
  return rows[0] || null;
}

/**
 * Read-only: the active (non-resolved) gap for ONE topic, or null. Used
 * by the orchestrator both to feed the topic selector's hold check and
 * to decide whether a just-progressed-beyond-EVIDENCE_INSUFFICIENCY
 * result should resolve an existing gap.
 */
export async function loadActiveResearchGap(env, topicSlug) {
  const row = await fetchRowById(env, buildResearchGapQueueId(topicSlug));
  return row && ACTIVE_STATUSES.includes(row.status) ? row : null;
}

/**
 * Read-only: EVERY active (non-resolved) gap in this lane, across all
 * topics -- used to build the selector's activeResearchGapsBySlug map in
 * one query, and by the MCP list_research_gaps tool. Never reads any
 * other lane.
 */
export async function listActiveResearchGaps(env) {
  requireSupabaseEnv(env, 'listActiveResearchGaps');
  const qs = new URLSearchParams();
  qs.set('select', '*');
  qs.set('lane', `eq.${RESEARCH_GAP_LANE}`);
  qs.set('status', `in.(${ACTIVE_STATUSES.join(',')})`);
  qs.set('order', 'priority.desc,created_at.asc');
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/research_verification_queue?${qs.toString()}`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) {
    throw new ResearchGapQueueError(`listActiveResearchGaps: query failed (${res.status}): ${(await res.text().catch(() => '')).slice(0, 500)}`);
  }
  return res.json();
}

/** Convenience: listActiveResearchGaps() reshaped into a {topic_slug: row} map for the selector's hold check. */
export async function loadActiveResearchGapsBySlug(env) {
  const rows = await listActiveResearchGaps(env);
  const map = {};
  for (const row of rows) map[row.item_id] = row;
  return map;
}

/**
 * Upserts (idempotently) the evidence-insufficiency gap for one topic.
 * See computeGapUpsertPayload() for the pure decision logic this wraps.
 *
 * @returns {Promise<{row: object, action: 'QUEUED'|'UPDATED'}>}
 */
export async function upsertEvidenceInsufficiencyGap(env, observed) {
  const existingRow = await fetchRowById(env, buildResearchGapQueueId(observed.topicSlug));
  const payload = computeGapUpsertPayload(existingRow, observed);
  const row = await upsertRow(env, payload);
  return { row, action: existingRow && existingRow.status !== RESEARCH_GAP_STATUS.RESOLVED ? 'UPDATED' : 'QUEUED' };
}

/** Claims a gap by id (MCP claim_research_gap). See determineClaimTransition(). */
export async function claimResearchGapById(env, gapId, { claimedBy = 'grok-research-harvester', now = new Date().toISOString() } = {}) {
  const existingRow = await fetchRowById(env, gapId);
  const transition = determineClaimTransition(existingRow, { claimedBy, claimedAt: now });
  if (!transition.ok || !transition.payload) return { ok: transition.ok, reason: transition.reason, row: existingRow };
  const row = await upsertRow(env, { queue_id: gapId, lane: RESEARCH_GAP_LANE, item_type: existingRow.item_type, item_id: existingRow.item_id, ...transition.payload });
  return { ok: true, reason: transition.reason, row };
}

/** Marks a gap research_received by id (used by the MCP submit_research_batch extension). */
export async function markGapResearchReceivedById(env, gapId, { researchBatchId, now = new Date().toISOString() } = {}) {
  const existingRow = await fetchRowById(env, gapId);
  const transition = determineResearchReceivedTransition(existingRow, { researchBatchId, receivedAt: now });
  if (!transition.ok || !transition.payload) return { ok: transition.ok, reason: transition.reason, row: existingRow };
  const row = await upsertRow(env, { queue_id: gapId, lane: RESEARCH_GAP_LANE, item_type: existingRow.item_type, item_id: existingRow.item_id, ...transition.payload });
  return { ok: true, reason: transition.reason, row };
}

/** I/O wrapper for determineGapLinkVerification() -- see its own doc. */
export async function verifyResearchGapForSubmission(env, gapId) {
  const row = await fetchRowById(env, gapId);
  return { ...determineGapLinkVerification(row), row };
}

/** Resolves a gap by its deterministic topic-keyed id (orchestrator-side release, section 5). */
export async function resolveResearchGapByTopic(env, topicSlug, { now = new Date().toISOString() } = {}) {
  const gapId = buildResearchGapQueueId(topicSlug);
  const existingRow = await fetchRowById(env, gapId);
  const transition = determineResolveTransition(existingRow, { resolvedAt: now });
  if (!transition.ok || !transition.payload) return { ok: transition.ok, reason: transition.reason, row: existingRow };
  const row = await upsertRow(env, { queue_id: gapId, lane: RESEARCH_GAP_LANE, item_type: existingRow.item_type, item_id: existingRow.item_id, ...transition.payload });
  return { ok: true, reason: transition.reason, row };
}
