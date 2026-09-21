/* ═══════════════════════════════════════════════════════════════
   AIMT Research Harvester — MCP connector (Streamable HTTP, stateless)
   ---------------------------------------------------------------
   A minimal MCP server exposing ONE write tool, submit_research_batch,
   so Grok's research harvester can submit research batches WITHOUT ever
   receiving or storing RESEARCH_INGEST_SECRET. Grok authenticates to
   THIS endpoint with its own, separate credential (MCP_CONNECTOR_SECRET);
   this endpoint then calls the exact same canonical validation/import
   pipeline (functions/_lib/research/ingest-request.mjs) that the direct
   research-ingest.js webhook uses. No second ingestion implementation
   exists -- see that file's header comment for the trust-model
   guarantees this inherits (AIMT_APPROVED / public_eligible / published
   can never be set by this path; malformed or orphaned records are
   quarantined, never silently dropped or allowed to abort a whole batch).

   Cloudflare Pages env vars required:
     MCP_CONNECTOR_SECRET        (new -- separate from RESEARCH_INGEST_
                                   SECRET; give ONLY this one to Grok)
     SUPABASE_URL                 (existing)
     SUPABASE_SERVICE_ROLE_KEY    (existing)

   Auth: header  Authorization: Bearer <MCP_CONNECTOR_SECRET>, checked
   with a constant-time compare (functions/_lib/research/auth.mjs), on
   EVERY request to this endpoint (including initialize) -- there is no
   unauthenticated handshake step.

   Protocol: MCP "Streamable HTTP" transport (spec 2025-06-18). This
   server is intentionally stateless:
     - No `Mcp-Session-Id` is ever issued, so none is ever required back
       (per spec, a session id is only mandatory if the server assigned
       one at initialize). No session store, no session database.
     - Every JSON-RPC *request* gets a single `application/json` response
       body (never an SSE stream) -- the spec explicitly allows this:
       "the server MUST either return Content-Type: text/event-stream...
       or application/json... The client MUST support both these cases."
       Grok's own remote-MCP docs list "Streaming HTTP" (their name for
       this same Streamable HTTP transport) as supported, so a plain JSON
       response is the right minimal choice here -- no SSE machinery.
     - Every JSON-RPC *notification* (has no `id`, e.g.
       notifications/initialized) gets HTTP 202 with no body, per spec.
     - GET and DELETE are not implemented (this server offers no
       server-initiated stream and no session to terminate), so both
       return 401 (if unauthenticated) or 405 (if authenticated) --
       exactly what the spec says a server MAY do when it doesn't offer
       those.

   Methods implemented: initialize, notifications/initialized, ping,
   tools/list, tools/call. Anything else gets a JSON-RPC
   "method not found" error. This is the minimum set for tool discovery
   and invocation; no resources/prompts/sampling/roots capability is
   declared or needed for a single write tool.
   ═══════════════════════════════════════════════════════════════ */

import { checkBearerAuth } from '../_lib/research/auth.mjs';
import { processIngestionBatch, logIngestEvent } from '../_lib/research/ingest-request.mjs';

const SOURCE = 'api/mcp';
const SERVER_NAME = 'aimt-research-harvester';
const SERVER_VERSION = '1.0.0';
const SUPPORTED_PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const DEFAULT_PROTOCOL_VERSION = '2025-06-18';

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
      quarantined: { type: 'object', description: 'Counts of sources/claims/orphan_claims held for human review, not imported.' }
    },
    required: ['batch_id', 'status']
  }
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function rpcResult(id, result) {
  return jsonResponse({ jsonrpc: '2.0', id, result });
}

function rpcError(id, code, message, data) {
  const error = { code, message };
  if (data !== undefined) error.data = data;
  return jsonResponse({ jsonrpc: '2.0', id: id ?? null, error }, 200);
}

function toolTextResult(payload, isError = false) {
  return {
    content: [{ type: 'text', text: JSON.stringify(payload) }],
    structuredContent: payload,
    isError
  };
}

async function handleInitialize(id, params) {
  const requested = params && typeof params.protocolVersion === 'string' ? params.protocolVersion : null;
  const protocolVersion = requested && SUPPORTED_PROTOCOL_VERSIONS.includes(requested) ? requested : DEFAULT_PROTOCOL_VERSION;
  return rpcResult(id, {
    protocolVersion,
    capabilities: { tools: {} },
    serverInfo: { name: SERVER_NAME, title: 'AIMT Research Harvester Connector', version: SERVER_VERSION },
    instructions:
      'Use submit_research_batch to submit research sources/claims into the AIMT research library. ' +
      'Submissions are validated and imported through AIMT\'s governed trust ladder; nothing submitted ' +
      'here is ever automatically approved or published.'
  });
}

async function handleToolsList(id) {
  return rpcResult(id, { tools: [SUBMIT_TOOL] });
}

async function handleToolsCall(env, id, params) {
  const name = params && params.name;
  if (name !== SUBMIT_TOOL.name) {
    return rpcError(id, -32602, `Unknown tool: ${JSON.stringify(name)}`);
  }

  const args = params && typeof params.arguments === 'object' && params.arguments !== null ? params.arguments : {};

  try {
    const result = await processIngestionBatch(env, args, { triggeredBy: 'mcp-connector' });

    if (!result.ok) {
      await logIngestEvent(env, SOURCE, 'mcp_tool_call_rejected', result.error);
      return rpcResult(id, toolTextResult({ error: result.error }, true));
    }

    await logIngestEvent(env, SOURCE, 'mcp_tool_call_complete', `batch_${result.batch_id}_status_${result.status}`);

    return rpcResult(id, toolTextResult({
      batch_id: result.batch_id,
      status: result.status,
      accepted: result.accepted,
      inserted: result.inserted,
      updated: result.updated,
      quarantined: result.quarantined
    }));
  } catch (error) {
    const message = error && error.message ? error.message : 'unknown_error';
    await logIngestEvent(env, SOURCE, 'mcp_tool_call_failure', message);
    return rpcResult(id, toolTextResult({ error: 'processing_error' }, true));
  }
}

async function dispatch(env, message) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    return rpcError(null, -32600, 'Invalid Request');
  }
  if (message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    return rpcError(message.id ?? null, -32600, 'Invalid Request');
  }

  const isNotification = !('id' in message);
  const { method, params, id } = message;

  /* Notifications get no JSON-RPC response body at all -- HTTP 202, per
     the Streamable HTTP spec ("If the server accepts the input, the
     server MUST return HTTP status code 202 Accepted with no body."). We
     accept every notification (there's no per-session state to update in
     a stateless server) and just acknowledge it. */
  if (isNotification) {
    return new Response(null, { status: 202 });
  }

  switch (method) {
    case 'initialize':
      return handleInitialize(id, params);
    case 'ping':
      return rpcResult(id, {});
    case 'tools/list':
      return handleToolsList(id);
    case 'tools/call':
      return handleToolsCall(env, id, params);
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.MCP_CONNECTOR_SECRET || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    await logIngestEvent(env, SOURCE, 'mcp_misconfigured', 'missing_env_vars');
    return new Response('Misconfigured', { status: 500 });
  }

  if (!checkBearerAuth(request, env.MCP_CONNECTOR_SECRET)) {
    await logIngestEvent(env, SOURCE, 'mcp_bad_auth', null);
    return new Response('Unauthorized', { status: 401 });
  }

  let message;
  try {
    message = await request.json();
  } catch (_) {
    return rpcError(null, -32700, 'Parse error');
  }

  /* JSON-RPC batching (an array of messages in one POST body) was removed
     in spec 2025-06-18 ("The body of the POST request MUST be a single
     JSON-RPC request, notification, or response"); reject arrays rather
     than silently processing only the first entry. */
  if (Array.isArray(message)) {
    return rpcError(null, -32600, 'Batched requests are not supported');
  }

  return dispatch(env, message);
}

/* No server-initiated SSE stream is offered, and there is no session to
   terminate (stateless) -- both are spec-legal to decline this way. Auth
   is still enforced first so an unauthenticated caller learns nothing
   about which methods this endpoint does or doesn't support. */
export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.MCP_CONNECTOR_SECRET || !checkBearerAuth(request, env.MCP_CONNECTOR_SECRET)) {
    return new Response('Unauthorized', { status: 401 });
  }
  return new Response('Method Not Allowed', { status: 405 });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!env.MCP_CONNECTOR_SECRET || !checkBearerAuth(request, env.MCP_CONNECTOR_SECRET)) {
    return new Response('Unauthorized', { status: 401 });
  }
  return new Response('Method Not Allowed', { status: 405 });
}
