/* ═══════════════════════════════════════════════════════════════
   AIMT Research Harvester — MCP connector (dual-era, stateless)
   ---------------------------------------------------------------
   A minimal MCP server exposing ONE write tool, submit_research_batch,
   so Grok's research harvester can submit research batches WITHOUT ever
   receiving or storing RESEARCH_INGEST_SECRET. This endpoint then calls
   the exact same canonical validation/import pipeline
   (functions/_lib/research/ingest-request.mjs) that the direct webhook
   uses. No second ingestion implementation exists.

   Cloudflare Pages env vars required:
     MCP_CONNECTOR_SECRET        (separate from RESEARCH_INGEST_SECRET)
     SUPABASE_URL                 (existing)
     SUPABASE_SERVICE_ROLE_KEY    (existing)
   Optional:
     GROK_MCP_OAUTH_CLIENT_ID     (once set, an OAuth caller's access
                                   token must have been issued to this
                                   exact OAuth client -- see
                                   functions/_lib/mcp/auth.mjs)

   Auth: header Authorization: Bearer <token>, resolved by
   functions/_lib/mcp/auth.mjs on EVERY request before anything else is
   inspected. The bearer value is either MCP_CONNECTOR_SECRET (constant-
   time compare, e.g. for internal diagnostics/CLI use -- unchanged from
   the original implementation), OR a Supabase OAuth access token
   belonging to an authorized AIMT admin (see /oauth/consent.html and
   docs/admin's existing admin_users model) -- e.g. for Grok's web
   Custom MCP Connector, whose UI requires real OAuth rather than a
   static bearer secret. Both paths are enforced before origin-agnostic
   protocol handling begins; OAuth authorization only determines WHO may
   call this endpoint and never bypasses any research trust control
   below (quarantine, AIMT_APPROVED human-only gate, RLS).

   OAuth discovery (RFC 9728): a 401 here (missing/invalid bearer, both
   paths above having failed) carries a WWW-Authenticate header pointing
   at this resource's Protected Resource Metadata document, served by
   functions/.well-known/oauth-protected-resource/api/mcp.js -- see
   functions/_lib/mcp/discovery.mjs for both. A 403 (authenticated but
   not an authorized admin, or an OAuth client_id mismatch) never
   carries that header. Supabase remains the only authorization server;
   this endpoint does not implement one.

   ── DUAL-ERA PROTOCOL SUPPORT ──────────────────────────────────────
   Built against the official spec text (fetched directly, not assumed):
     - Modern: https://modelcontextprotocol.io/specification/2026-07-28
       (stateless-by-definition core: every request self-describes its
       protocol version/capabilities via `_meta`; no initialize
       handshake; NO Mcp-Session-Id/GET stream/DELETE -- all three were
       removed in this revision).
     - Legacy: https://modelcontextprotocol.io/specification/2025-06-18
       (handshake-based: initialize -> notifications/initialized ->
       ordinary per-connection requests). We stay stateless even for
       legacy: each legacy request re-declares its version via the
       MCP-Protocol-Version header (mandatory on every request "MUST
       include ... on all of their subsequent requests" per that spec),
       so nothing needs to be remembered between requests.

   Era classification for any non-initialize, non-notification request:
     1. `initialize` as the method            -> LEGACY handshake path.
     2. `MCP-Protocol-Version: 2026-07-28`, or body `params._meta[
        'io.modelcontextprotocol/protocolVersion'] === '2026-07-28'`
                                                -> MODERN path, fully
        validated per spec (missing/mismatched MCP-Protocol-Version /
        Mcp-Method / Mcp-Name -> HeaderMismatch; missing required
        `_meta.clientCapabilities` -> Invalid params; unrecognized
        protocol version value -> UnsupportedProtocolVersionError).
     3. `MCP-Protocol-Version: 2025-11-25` or `2025-06-18`
                                                -> LEGACY path (no
        Mcp-Method/Mcp-Name header requirement; that's a modern-only
        mechanism).
     4. Anything else (including an explicit `2024-11-05`, which this
        Streamable HTTP implementation deliberately never advertises --
        that version only exists on the deprecated HTTP+SSE transport)
                                                -> rejected with
        UnsupportedProtocolVersionError.

   Legacy `initialize` negotiates only 2025-11-25 or 2025-06-18 (never
   2026-07-28 -- a genuinely modern client has no handshake at all, so a
   request that *does* call `initialize` is by definition speaking a
   legacy version). Modern `server/discover` (spec-required: "Servers
   MUST implement server/discover") reports every version this server
   actually accepts, both eras, matching the spec's own example of an
   UnsupportedProtocolVersionError listing a mix of a modern and a
   legacy version in `supported`.

   Origin validation (BLOCKER 2): required by both spec eras ("Servers
   MUST validate the Origin header on all incoming connections"). Grok
   is a server-to-server caller and may send no Origin header at all --
   that case is allowed. An Origin header that IS present must equal the
   canonical AIMT origin or the request is rejected with 403, before any
   auth/body processing. No wildcard, no permissive CORS is added
   anywhere -- this is Origin *validation*, not CORS.

   Not implemented (spec-legal to omit, and not needed for one simple
   write tool): resources, prompts, MRTR/elicitation, subscriptions,
   x-mcp-header param mirroring, SSE responses (a single application/
   json response is explicitly one of the two spec-legal choices on
   every era of Streamable HTTP). No `Mcp-Session-Id` is ever issued.
   GET/DELETE return 401 (unauthenticated) or 405 (authenticated) --
   exactly what both spec eras say a server that offers neither a
   listen-stream nor a session may do.
   ═══════════════════════════════════════════════════════════════ */

import { resolveMcpAuth } from '../_lib/mcp/auth.mjs';
import { wwwAuthenticateHeader } from '../_lib/mcp/discovery.mjs';
import { processIngestionBatch, logIngestEvent } from '../_lib/research/ingest-request.mjs';
import {
  listActiveResearchGaps, claimResearchGapById, verifyResearchGapForSubmission, markGapResearchReceivedById,
  hasRelevantVerifiedClaim,
} from '../_lib/education-ops/education-research-gap-queue.mjs';

const SOURCE = 'api/mcp';
const SERVER_NAME = 'aimt-research-harvester';
const SERVER_VERSION = '1.0.0';

const MODERN_PROTOCOL_VERSION = '2026-07-28';
const LEGACY_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18'];
const DEFAULT_LEGACY_PROTOCOL_VERSION = '2025-11-25'; // latest legacy version we support
const ALL_SUPPORTED_VERSIONS = [MODERN_PROTOCOL_VERSION, ...LEGACY_PROTOCOL_VERSIONS];

const CANONICAL_ORIGIN = 'https://aimtrichology.com';

const SERVER_INSTRUCTIONS =
  'Use submit_research_batch to submit research sources/claims into the AIMT research library. ' +
  'Submissions are validated and imported through AIMT\'s governed trust ladder; nothing submitted ' +
  'here is ever automatically approved or published. Use list_research_gaps to check for an active, ' +
  'high-priority publication evidence-gap request before ordinary horizon-scan research, ' +
  'claim_research_gap to claim one, and submit_research_batch\'s optional research_gap_id to link a ' +
  'targeted submission back to it.';

const META_PROTOCOL_VERSION = 'io.modelcontextprotocol/protocolVersion';
const META_CLIENT_CAPABILITIES = 'io.modelcontextprotocol/clientCapabilities';
const META_CLIENT_INFO = 'io.modelcontextprotocol/clientInfo';
const META_SERVER_INFO = 'io.modelcontextprotocol/serverInfo';

const SUBMIT_TOOL = {
  name: 'submit_research_batch',
  title: 'Submit AIMT Research Batch',
  description:
    "Submits research evidence (sources and/or claims) into AIMT's governed, " +
    'trust-ladder research library for validation and import. Every source and ' +
    'claim is independently validated against AIMT\'s schema and is subject to ' +
    'the exact same checks as AIMT\'s direct ingestion pipeline: malformed ' +
    'records, records referencing an unknown source, and any record that already ' +
    'claims AIMT_APPROVED status are quarantined for human review rather than ' +
    'imported or silently dropped. Submitting research through this tool NEVER ' +
    'constitutes AIMT approval and NEVER publishes anything -- the highest ' +
    "verification status this path can ever produce is CLAIM_VERIFIED; " +
    'AIMT_APPROVED, public eligibility, and publication all remain exclusively ' +
    "human-set, through AIMT's own internal review process, never through this " +
    'tool. Re-submitting the same source_id/claim_id is safe and idempotent -- ' +
    'it updates the existing record rather than creating a duplicate.',
  inputSchema: {
    type: 'object',
    properties: {
      batch_id: {
        type: 'string',
        description: 'Unique identifier for this submission batch, e.g. a timestamp or discovery-run id. Required.'
      },
      source_system: {
        type: 'string',
        description: "Identifies the submitting system. Defaults to 'grok-research-harvester' if omitted."
      },
      sources: {
        type: 'array',
        items: { type: 'object' },
        description: 'AIMT source records (bibliographic metadata + trust/verification fields). Optional.'
      },
      claims: {
        type: 'array',
        items: { type: 'object' },
        description: 'AIMT claim records (atomic evidence statements + trust/verification fields). Optional.'
      },
      topics: {
        type: 'array',
        items: { type: 'object' },
        description: 'Optional topic catalog rows (controlled-vocabulary observations).'
      },
      relationships: {
        type: 'array',
        items: { type: 'object' },
        description: 'Optional explicit source/claim relationship rows. Never inferred -- only pass edges with real textual evidence.'
      },
      verification_queue: {
        type: 'array',
        items: { type: 'object' },
        description: 'Optional verification-lane queue rows.'
      },
      coverage: {
        type: 'array',
        items: { type: 'object' },
        description: 'Optional topic coverage rollup rows.'
      },
      research_gap_id: {
        type: 'string',
        description:
          "Optional. The gap_id (queue_id) of an AIMT publication evidence-gap request this batch is targeted at " +
          '(from list_research_gaps/claim_research_gap). Omitting this field behaves exactly as before -- an ordinary, ' +
          'un-targeted submission. When supplied, AIMT verifies the gap is real, in the publication_evidence_gap lane, ' +
          'and not already resolved; the research batch is ALWAYS processed through the exact same validation/import ' +
          'pipeline regardless of that check. Only once ingestion actually accepts (inserts or updates) at least one ' +
          'source or claim from this batch is the gap marked research_received -- a wholly rejected/quarantined batch ' +
          'never falsely marks a gap as received. This never changes any trust-ladder rule: the highest verification ' +
          'status this path can ever produce is still CLAIM_VERIFIED, and nothing here can resolve the gap itself -- ' +
          "that happens separately once Education Operations re-evaluates the topic."
      }
    },
    required: ['batch_id']
  },
  outputSchema: {
    type: 'object',
    properties: {
      batch_id: { type: 'string' },
      status: { type: 'string', description: "'ok' or 'partial' (partial = something was quarantined)." },
      accepted: { type: 'object', description: 'Counts of sources/claims that now exist in the library (inserted + updated).' },
      inserted: { type: 'object' },
      updated: { type: 'object' },
      quarantined: { type: 'object', description: 'Counts of sources/claims/orphan_claims held for human review, not imported.' },
      research_gap_transition: {
        type: 'string',
        description:
          'Only present when research_gap_id was supplied. RESEARCH_RECEIVED only if this batch actually caused the ' +
          'canonical ingestion pipeline to accept/import at least one CLAIM_VERIFIED claim relevant to the gap\'s own ' +
          'topic(s); otherwise a SKIPPED_<reason> code (e.g. SKIPPED_NOT_LINKABLE, SKIPPED_NOTHING_ACCEPTED, ' +
          'SKIPPED_NO_RELEVANT_VERIFIED_CLAIM) explaining why the batch was still processed normally but not linked -- ' +
          'an accepted but unrelated or merely-DISCOVERED claim never counts.'
      }
    },
    required: ['batch_id', 'status']
  }
};

const LIST_RESEARCH_GAPS_TOOL = {
  name: 'list_research_gaps',
  title: 'List AIMT Publication Evidence-Gap Research Requests',
  description:
    "Returns AIMT Education Operations' currently ACTIVE (not yet resolved) publication evidence-gap requests -- " +
    "topics where Publication Editor's deterministic governance validated that the research library does not yet " +
    'have sufficient evidence to complete a page, and is asking the research harvester to prioritize targeted ' +
    'research before ordinary horizon scanning. Returns ONLY what is needed for research prioritization: the gap ' +
    "id, topic, page concept/intent/in-scope concepts, a governed plain-language summary of what's missing, " +
    'priority, attempt count, status, and when it was requested. Never returns Publication Editor raw model ' +
    'output, unrelated research_verification_queue lanes, or service credentials.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  outputSchema: {
    type: 'object',
    properties: {
      gaps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            gap_id: { type: 'string' },
            topic_slug: { type: 'string' },
            page_concept: { type: 'string' },
            public_intent: { type: 'string' },
            in_scope_concepts: { type: 'array', items: { type: 'string' } },
            gap_summary: { type: 'string' },
            priority: { type: 'number' },
            attempt_count: { type: 'number' },
            status: { type: 'string' },
            requested_at: { type: 'string' }
          }
        }
      }
    },
    required: ['gaps']
  }
};

const CLAIM_RESEARCH_GAP_TOOL = {
  name: 'claim_research_gap',
  title: 'Claim an AIMT Publication Evidence-Gap Research Request',
  description:
    "Marks one publication evidence-gap request as claimed by the research harvester (grok-research-harvester), " +
    'so Education Operations knows targeted research is already underway and will not repeatedly re-attempt ' +
    'Publication Editor for that topic while it waits. Idempotent for an already-claimed gap (calling it twice is ' +
    'safe). Returns a GOVERNED, non-error result (not a tool failure) if the gap is already resolved. Fails closed ' +
    '(refuses) for an unknown/stale gap_id. Can never claim, resolve, or otherwise mutate any ' +
    'research_verification_queue row outside the publication_evidence_gap lane.',
  inputSchema: {
    type: 'object',
    properties: { gap_id: { type: 'string', description: 'The gap_id (queue_id) returned by list_research_gaps.' } },
    required: ['gap_id']
  },
  outputSchema: {
    type: 'object',
    properties: {
      ok: { type: 'boolean' },
      reason: { type: 'string' },
      gap_id: { type: 'string' },
      status: { type: 'string' }
    },
    required: ['ok', 'reason']
  }
};

const TOOLS = [SUBMIT_TOOL, LIST_RESEARCH_GAPS_TOOL, CLAIM_RESEARCH_GAP_TOOL];

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function rpcResult(id, result, status = 200) {
  return jsonResponse({ jsonrpc: '2.0', id, result }, status);
}

function rpcError(id, code, message, { data, status = 200 } = {}) {
  const error = { code, message };
  if (data !== undefined) error.data = data;
  return jsonResponse({ jsonrpc: '2.0', id: id ?? null, error }, status);
}

function headerMismatch(id, message) {
  return rpcError(id, -32020, message, { status: 400 });
}

function unsupportedProtocolVersion(id, requested) {
  return rpcError(id, -32022, 'Unsupported protocol version', {
    status: 400,
    data: { supported: ALL_SUPPORTED_VERSIONS, requested: requested ?? null }
  });
}

/* ── Origin validation (BLOCKER 2) ──
   Spec (both eras): "Servers MUST validate the Origin header on all
   incoming connections... If the Origin header is present and invalid,
   servers MUST respond with HTTP 403 Forbidden." No Origin header at all
   is NOT itself a validation failure -- Grok is a server-to-server
   caller and has no reason to send a browser-style Origin header. This
   is Origin validation, not CORS: no Access-Control-* headers are set
   anywhere, and no wildcard is used. */
function originAllowed(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true; // absent -> permitted (server-to-server caller)
  return origin === CANONICAL_ORIGIN;
}

function forbiddenOrigin() {
  return jsonResponse({ jsonrpc: '2.0', id: null, error: { code: -32000, message: 'Origin not allowed' } }, 403);
}

/* Builds the response for a resolveMcpAuth() failure. A 401 (missing/
   invalid bearer -- static secret AND OAuth token both failed) carries
   WWW-Authenticate per RFC 9728 section 5.1 / the MCP authorization
   spec's "return proper challenges" guidance, so a standards-compliant
   client (e.g. Grok Bot Desktop's AuthenticateMcpServer) can discover
   the Protected Resource Metadata document and start OAuth. A 403
   (authenticated but not an authorized admin, or an OAuth-client-id
   mismatch) is unchanged from before this header existed -- no
   WWW-Authenticate, since the caller already has a token and retrying
   the OAuth discovery flow would not fix a 403. Never sent on success. */
function mcpAuthFailureResponse(auth) {
  if (auth.status === 401) {
    return new Response('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': wwwAuthenticateHeader() } });
  }
  return new Response('Forbidden', { status: 403 });
}

/* Decodes the `=?base64?...?=` sentinel format used for header values
   that aren't plain-ASCII-safe (spec: Value Encoding). Returns the raw
   value unchanged if it isn't in that format. Uses only Web-standard
   atob/TextDecoder -- no Node Buffer, matching this repo's zero-npm-
   dependency convention for functions/api/*. */
function decodeMcpHeaderValue(raw) {
  if (raw == null) return null;
  const m = /^=\?base64\?([A-Za-z0-9+/=]+)\?=$/.exec(raw);
  if (!m) return raw;
  try {
    const binary = atob(m[1]);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch (_) {
    return raw;
  }
}

function toolTextResult(payload, isError = false) {
  return { content: [{ type: 'text', text: JSON.stringify(payload) }], structuredContent: payload, isError };
}

function modernMeta() {
  return { [META_SERVER_INFO]: { name: SERVER_NAME, version: SERVER_VERSION } };
}

/* ── The tools' actual work, shared byte-for-byte between eras ──
   "Do not change a tool's business behavior between eras" is true by
   construction: both era's tools/call handlers call these same
   functions. */
async function runSubmitResearchBatchTool(env, args) {
  const safeArgs = args && typeof args === 'object' && !Array.isArray(args) ? args : {};
  // RESEARCH-GAP FEEDBACK LOOP v1 (optional research_gap_id -- see
  // SUBMIT_TOOL's own description). Verification NEVER blocks or alters
  // the underlying ingestion call below -- it only decides whether a
  // successful batch also gets linked back to a gap afterward.
  const researchGapId = typeof safeArgs.research_gap_id === 'string' && safeArgs.research_gap_id.trim() ? safeArgs.research_gap_id.trim() : null;
  let gapRow = null;
  if (researchGapId) {
    try {
      const verification = await verifyResearchGapForSubmission(env, researchGapId);
      if (verification.ok) gapRow = verification.row;
      else await logIngestEvent(env, SOURCE, 'mcp_research_gap_link_skipped', `${researchGapId}_${verification.reason}`);
    } catch (_err) {
      gapRow = null;
      await logIngestEvent(env, SOURCE, 'mcp_research_gap_link_skipped', `${researchGapId}_VERIFICATION_FAILED`);
    }
  }

  try {
    const result = await processIngestionBatch(env, safeArgs, { triggeredBy: 'mcp-connector' });
    if (!result.ok) {
      await logIngestEvent(env, SOURCE, 'mcp_tool_call_rejected', result.error);
      return toolTextResult({ error: result.error }, true);
    }

    let researchGapTransition;
    if (researchGapId) {
      if (!gapRow) {
        researchGapTransition = 'SKIPPED_NOT_LINKABLE';
      } else if (!hasRelevantVerifiedClaim(result.processedClaims, gapRow.extras && gapRow.extras.controlled_topics)) {
        // CORRECTION 1: "research_received" must mean the canonical
        // ingestion pipeline actually accepted/imported at least one
        // claim that is BOTH relevant to this gap's own controlled_topics
        // AND CLAIM_VERIFIED -- never merely "something was accepted in
        // the same batch" (an unrelated claim, a source with no relevant
        // verified claim, DISCOVERED-only material, or a relevant claim
        // that was itself quarantined/orphaned/rejected all land here,
        // never falsely marking the gap received). result.processedClaims
        // is INTERNAL ONLY -- never included in this tool's own response
        // below. The gate is claim-based, so "accepted something" here
        // means "accepted at least one CLAIM" -- an accepted SOURCE with
        // zero accepted claims (test B) is "nothing accepted" for this
        // purpose, not "the wrong kind of claim".
        const acceptedAnyClaim = (result.accepted.claims || 0) > 0;
        researchGapTransition = acceptedAnyClaim ? 'SKIPPED_NO_RELEVANT_VERIFIED_CLAIM' : 'SKIPPED_NOTHING_ACCEPTED';
      } else {
        try {
          const marked = await markGapResearchReceivedById(env, researchGapId, { researchBatchId: result.batch_id });
          researchGapTransition = marked.ok ? 'RESEARCH_RECEIVED' : `SKIPPED_${marked.reason}`;
        } catch (_err) {
          researchGapTransition = 'SKIPPED_TRANSITION_FAILED';
        }
      }
    }

    await logIngestEvent(env, SOURCE, 'mcp_tool_call_complete', `batch_${result.batch_id}_status_${result.status}`);
    return toolTextResult({
      batch_id: result.batch_id,
      status: result.status,
      accepted: result.accepted,
      inserted: result.inserted,
      updated: result.updated,
      quarantined: result.quarantined,
      // NOTE: result.processedClaims (raw claim ids/topics) is
      // deliberately NEVER included here -- see importer.mjs's own
      // comment on why that field is internal-only.
      ...(researchGapId ? { research_gap_transition: researchGapTransition } : {})
    });
  } catch (error) {
    const message = error && error.message ? error.message : 'unknown_error';
    await logIngestEvent(env, SOURCE, 'mcp_tool_call_failure', message);
    return toolTextResult({ error: 'processing_error' }, true);
  }
}

/** list_research_gaps -- read-only, returns ONLY the fields Rick needs
    (see LIST_RESEARCH_GAPS_TOOL's own description for exactly what is
    and isn't included). Never reads any lane other than
    publication_evidence_gap (listActiveResearchGaps() itself is scoped
    to that lane only). */
async function runListResearchGapsTool(env) {
  try {
    const rows = await listActiveResearchGaps(env);
    const gaps = rows.map((row) => ({
      gap_id: row.queue_id,
      topic_slug: row.item_id,
      page_concept: (row.extras && row.extras.page_concept) || null,
      public_intent: (row.extras && row.extras.public_intent) || null,
      in_scope_concepts: (row.extras && row.extras.in_scope_concepts) || [],
      gap_summary: (row.extras && row.extras.gap_summary) || null,
      priority: row.priority,
      attempt_count: (row.extras && row.extras.attempt_count) || 0,
      status: row.status,
      requested_at: row.created_at
    }));
    return toolTextResult({ gaps });
  } catch (error) {
    const message = error && error.message ? error.message : 'unknown_error';
    await logIngestEvent(env, SOURCE, 'mcp_tool_call_failure', message);
    return toolTextResult({ error: 'processing_error' }, true);
  }
}

/** claim_research_gap -- see CLAIM_RESEARCH_GAP_TOOL's own description.
    claimResearchGapById() itself refuses (fails closed) for anything
    outside the publication_evidence_gap lane; this wrapper only maps
    its governed {ok, reason} result onto the tool response shape. */
async function runClaimResearchGapTool(env, args) {
  const gapId = args && typeof args.gap_id === 'string' ? args.gap_id.trim() : '';
  if (!gapId) return toolTextResult({ ok: false, reason: 'GAP_ID_REQUIRED' }, true);
  try {
    const result = await claimResearchGapById(env, gapId, { claimedBy: 'grok-research-harvester' });
    await logIngestEvent(env, SOURCE, 'mcp_claim_research_gap', `${gapId}_${result.reason}`);
    // ALREADY_RESOLVED is a GOVERNED non-success (a well-formed request
    // that legitimately cannot be satisfied), not a tool failure --
    // isError stays false for it and for every ok:true outcome. Only a
    // stale/invalid gap_id (NOT_FOUND/WRONG_LANE/NOT_CLAIMABLE_IN_
    // CURRENT_STATUS) fails closed as isError:true.
    const isError = !result.ok && result.reason !== 'ALREADY_RESOLVED';
    return toolTextResult({ ok: result.ok, reason: result.reason, gap_id: gapId, status: result.row ? result.row.status : null }, isError);
  } catch (error) {
    const message = error && error.message ? error.message : 'unknown_error';
    await logIngestEvent(env, SOURCE, 'mcp_tool_call_failure', message);
    return toolTextResult({ ok: false, reason: 'processing_error' }, true);
  }
}

async function runTool(env, name, args) {
  switch (name) {
    case SUBMIT_TOOL.name:
      return runSubmitResearchBatchTool(env, args);
    case LIST_RESEARCH_GAPS_TOOL.name:
      return runListResearchGapsTool(env);
    case CLAIM_RESEARCH_GAP_TOOL.name:
      return runClaimResearchGapTool(env, args);
    default:
      return null;
  }
}

/* ═══════════════════ MODERN ERA (2026-07-28) ═══════════════════ */

/* Validates the modern-era request-metadata contract before any method
   handler runs: required headers present and matching the body, a
   supported protocol version, and the required `_meta.clientCapabilities`
   field. Returns null if everything is valid, or a Response to send
   immediately otherwise. */
function validateModernRequest(request, message) {
  const id = 'id' in message ? message.id : null;
  const params = message.params || {};
  const meta = params._meta || {};

  const headerVersion = request.headers.get('mcp-protocol-version');
  const bodyVersion = meta[META_PROTOCOL_VERSION];
  if (!headerVersion) return headerMismatch(id, 'Missing required header: MCP-Protocol-Version');
  if (!bodyVersion) return rpcError(id, -32602, `Invalid params: missing required _meta.${META_PROTOCOL_VERSION}`, { status: 400 });
  if (headerVersion !== bodyVersion) {
    return headerMismatch(id, `Header mismatch: MCP-Protocol-Version header value '${headerVersion}' does not match body value '${bodyVersion}'`);
  }
  if (bodyVersion !== MODERN_PROTOCOL_VERSION) return unsupportedProtocolVersion(id, bodyVersion);

  const headerMethod = request.headers.get('mcp-method');
  if (!headerMethod) return headerMismatch(id, 'Missing required header: Mcp-Method');
  if (headerMethod !== message.method) {
    return headerMismatch(id, `Header mismatch: Mcp-Method header value '${headerMethod}' does not match body value '${message.method}'`);
  }

  if (message.method === 'tools/call') {
    const headerNameRaw = request.headers.get('mcp-name');
    if (!headerNameRaw) return headerMismatch(id, 'Missing required header: Mcp-Name');
    const headerName = decodeMcpHeaderValue(headerNameRaw);
    const bodyName = params.name;
    if (headerName !== bodyName) {
      return headerMismatch(id, `Header mismatch: Mcp-Name header value '${headerName}' does not match body value '${bodyName}'`);
    }
  }

  if (!('_meta' in params) || !(META_CLIENT_CAPABILITIES in meta)) {
    return rpcError(id, -32602, `Invalid params: missing required _meta.${META_CLIENT_CAPABILITIES}`, { status: 400 });
  }

  return null;
}

async function handleModernServerDiscover(id) {
  return rpcResult(id, {
    resultType: 'complete',
    supportedVersions: ALL_SUPPORTED_VERSIONS,
    capabilities: { tools: {} },
    _meta: modernMeta(),
    instructions: SERVER_INSTRUCTIONS,
    ttlMs: 0,
    cacheScope: 'private'
  });
}

async function handleModernToolsList(id) {
  return rpcResult(id, {
    resultType: 'complete',
    tools: TOOLS,
    _meta: modernMeta(),
    ttlMs: 0,
    cacheScope: 'private'
  });
}

async function handleModernToolsCall(env, id, params) {
  const name = params && params.name;
  const args = params && typeof params.arguments === 'object' && params.arguments !== null ? params.arguments : {};
  const toolResult = await runTool(env, name, args);
  if (!toolResult) return rpcError(id, -32602, `Unknown tool: ${JSON.stringify(name)}`);
  return rpcResult(id, { resultType: 'complete', ...toolResult, _meta: modernMeta() });
}

async function handleModernPing(id) {
  return rpcResult(id, { resultType: 'complete', _meta: modernMeta() });
}

async function dispatchModern(env, request, message) {
  const validationError = validateModernRequest(request, message);
  if (validationError) return validationError;

  const { method, params, id } = message;
  switch (method) {
    case 'server/discover':
      return handleModernServerDiscover(id);
    case 'tools/list':
      return handleModernToolsList(id);
    case 'tools/call':
      return handleModernToolsCall(env, id, params);
    case 'ping':
      return handleModernPing(id);
    default:
      /* Spec: unimplemented RPC method on the modern era -> 404, unlike
         the ordinary 200-with-JSON-RPC-error convention used elsewhere. */
      return rpcError(id, -32601, `Method not found: ${method}`, { status: 404 });
  }
}

/* ═══════════════════ LEGACY ERA (2025-11-25 / 2025-06-18) ═══════════════════
   Unchanged in spirit from the original 2025-06-18-only implementation:
   handshake-based, no Mcp-Method/Mcp-Name header requirement (that's a
   modern-only mechanism), no resultType/ttlMs/cacheScope envelope
   additions. Still fully stateless -- no session is stored; each
   request simply re-declares its (legacy) version via the
   MCP-Protocol-Version header, same as a real 2025-06-18 client MUST. */

async function handleLegacyInitialize(id, params) {
  const requested = params && typeof params.protocolVersion === 'string' ? params.protocolVersion : null;
  const protocolVersion = requested && LEGACY_PROTOCOL_VERSIONS.includes(requested) ? requested : DEFAULT_LEGACY_PROTOCOL_VERSION;
  return rpcResult(id, {
    protocolVersion,
    capabilities: { tools: {} },
    serverInfo: { name: SERVER_NAME, title: 'AIMT Research Harvester Connector', version: SERVER_VERSION },
    instructions: SERVER_INSTRUCTIONS
  });
}

async function handleLegacyToolsList(id) {
  return rpcResult(id, { tools: TOOLS });
}

async function handleLegacyToolsCall(env, id, params) {
  const name = params && params.name;
  const args = params && typeof params.arguments === 'object' && params.arguments !== null ? params.arguments : {};
  const toolResult = await runTool(env, name, args);
  if (!toolResult) return rpcError(id, -32602, `Unknown tool: ${JSON.stringify(name)}`);
  return rpcResult(id, toolResult);
}

async function dispatchLegacy(env, message) {
  const { method, params, id } = message;
  switch (method) {
    case 'initialize':
      return handleLegacyInitialize(id, params);
    case 'ping':
      return rpcResult(id, {});
    case 'tools/list':
      return handleLegacyToolsList(id);
    case 'tools/call':
      return handleLegacyToolsCall(env, id, params);
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

/* ═══════════════════ Era classification + top-level dispatch ═══════════════════ */

function classifyEra(request, message) {
  if (message.method === 'initialize') return 'legacy';

  const headerVersion = request.headers.get('mcp-protocol-version');
  const bodyVersion = message.params && message.params._meta && message.params._meta[META_PROTOCOL_VERSION];

  if (headerVersion === MODERN_PROTOCOL_VERSION || (!headerVersion && bodyVersion === MODERN_PROTOCOL_VERSION)) return 'modern';
  if (LEGACY_PROTOCOL_VERSIONS.includes(headerVersion)) return 'legacy';
  if (!headerVersion && !bodyVersion) return 'unknown';
  return 'unsupported'; // header present but not a version we recognize (e.g. 2024-11-05, 2025-03-26, garbage)
}

async function dispatch(env, request, message) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    return rpcError(null, -32600, 'Invalid Request', { status: 400 });
  }
  if (message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    return rpcError(message.id ?? null, -32600, 'Invalid Request', { status: 400 });
  }

  const isNotification = !('id' in message);
  if (isNotification) {
    /* Both eras: a notification (e.g. legacy notifications/initialized;
       modern defines no client-to-server notifications over Streamable
       HTTP at all) gets 202 Accepted with no body if the server accepts
       it -- there's no per-session state to update either way. */
    return new Response(null, { status: 202 });
  }

  const era = classifyEra(request, message);
  if (era === 'modern') return dispatchModern(env, request, message);
  if (era === 'legacy') return dispatchLegacy(env, message);
  /* 'unknown' (no version signal anywhere) or 'unsupported' (an explicit
     but unrecognized value, e.g. 2024-11-05 -- deliberately never
     advertised on this transport, or 2025-03-26, or garbage): reject
     with the same diagnostic error either way so the client can retry
     with a version we actually list. */
  const headerVersion = request.headers.get('mcp-protocol-version');
  const bodyVersion = message.params && message.params._meta && message.params._meta[META_PROTOCOL_VERSION];
  return unsupportedProtocolVersion(message.id, headerVersion || bodyVersion || null);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!originAllowed(request)) {
    await logIngestEvent(env, SOURCE, 'mcp_origin_rejected', request.headers.get('origin'));
    return forbiddenOrigin();
  }

  if (!env.MCP_CONNECTOR_SECRET || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    await logIngestEvent(env, SOURCE, 'mcp_misconfigured', 'missing_env_vars');
    return new Response('Misconfigured', { status: 500 });
  }

  const auth = await resolveMcpAuth(env, request);
  if (!auth.ok) {
    await logIngestEvent(env, SOURCE, 'mcp_auth_rejected', auth.reason);
    return mcpAuthFailureResponse(auth);
  }

  let message;
  try {
    message = await request.json();
  } catch (_) {
    return rpcError(null, -32700, 'Parse error', { status: 400 });
  }

  /* JSON-RPC batching (an array of messages in one POST body) is not
     part of either era's Streamable HTTP transport ("The body of the
     HTTP POST MUST be a single JSON-RPC request or notification");
     reject arrays rather than silently processing only the first entry. */
  if (Array.isArray(message)) {
    return rpcError(null, -32600, 'Batched requests are not supported', { status: 400 });
  }

  return dispatch(env, request, message);
}

/* Neither era offers a server-initiated stream or a session to
   terminate on this implementation (modern removed both outright;
   legacy's optional versions of them are simply not implemented here) --
   both are spec-legal to decline this way. Origin/auth are still
   enforced first so a disallowed caller learns nothing about which
   methods this endpoint does or doesn't support. */
export async function onRequestGet(context) {
  const { request, env } = context;
  if (!originAllowed(request)) return forbiddenOrigin();
  const auth = await resolveMcpAuth(env, request);
  if (!auth.ok) return mcpAuthFailureResponse(auth);
  return new Response('Method Not Allowed', { status: 405 });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!originAllowed(request)) return forbiddenOrigin();
  const auth = await resolveMcpAuth(env, request);
  if (!auth.ok) return mcpAuthFailureResponse(auth);
  return new Response('Method Not Allowed', { status: 405 });
}
