/* ═══════════════════════════════════════════════════════════════
   AIMT Research Harvester Worker — xAI Responses API client
   ---------------------------------------------------------------
   Built directly against xAI's current official docs (fetched and
   verified while building this worker, not assumed):
     - https://docs.x.ai/docs/guides/tools/remote-mcp-tools
       (Remote MCP tool shape: type "mcp", server_url, server_label,
       authorization, allowed_tools)
     - https://docs.x.ai/docs/guides/tools/search-tools
       (web_search tool: {"type": "web_search"})
     - https://docs.x.ai/docs/guides/chat
       (Responses API request shape: POST https://api.x.ai/v1/responses,
       Authorization: Bearer $XAI_API_KEY, Content-Type: application/json,
       system/user messages inside "input" -- there is no separate
       top-level "instructions" field on this API)
     - https://docs.x.ai/developers/tools/tool-usage-details
       (response shape: output[] items typed "web_search_call" /
       "mcp_call" -- an mcp_call's function name is
       "{server_label}.{tool_name}" when a server_label is set;
       server_side_tool_usage reports successfully executed tool
       counts; usage.input_tokens / usage.output_tokens)

   xAI's Remote MCP tools execute the ENTIRE tool-calling loop
   server-side (xAI connects to the MCP server, calls tools, feeds
   results back to the model) and return ONE final response -- this
   worker therefore makes exactly one HTTP request per run (see
   run.mjs's cost/loop guardrails), it does not orchestrate a manual
   tool-call loop itself.
   ═══════════════════════════════════════════════════════════════ */

export const XAI_RESPONSES_URL = 'https://api.x.ai/v1/responses';

/* The production AIMT MCP resource. Never derived from anything
   configurable -- this worker only ever points at AIMT's own governed
   ingestion pipeline, never anywhere else. */
export const AIMT_MCP_SERVER_URL = 'https://aimtrichology.com/api/mcp';
export const AIMT_MCP_SERVER_LABEL = 'aimt-research-harvester';
export const AIMT_MCP_ALLOWED_TOOLS = Object.freeze(['submit_research_batch']);

/* Conservative, hardcoded request timeout -- a cost/runaway-execution
   guardrail, deliberately NOT exposed via an env var so it can't be
   loosened by configuration alone (see run.mjs's guardrails). */
export const REQUEST_TIMEOUT_MS = 170_000;

/** Builds the "tools" array for a Responses API request. In dry-run
    mode this is structurally incapable of writing to AIMT: only
    web_search is ever included, never the MCP tool, regardless of any
    other input -- there is no code path that adds the MCP tool unless
    mode === 'live' AND a connector secret is supplied. */
export function buildTools(mode, mcpConnectorSecret) {
  const tools = [{ type: 'web_search' }];
  if (mode === 'live') {
    if (!mcpConnectorSecret) {
      throw new Error('buildTools: live mode requires a non-empty mcpConnectorSecret');
    }
    tools.push({
      type: 'mcp',
      server_url: AIMT_MCP_SERVER_URL,
      server_label: AIMT_MCP_SERVER_LABEL,
      // Built ONLY here, at request-construction time, from the secret
      // passed in -- never logged, never included in any response this
      // worker returns (see observability.mjs's redaction).
      authorization: `Bearer ${mcpConnectorSecret}`,
      allowed_tools: [...AIMT_MCP_ALLOWED_TOOLS]
    });
  }
  return tools;
}

/** Builds the full Responses API request body. */
export function buildRequestBody({ mode, model, mcpConnectorSecret, systemPrompt, userPrompt }) {
  return {
    model,
    input: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    tools: buildTools(mode, mcpConnectorSecret)
  };
}

/** Calls xAI's Responses API once. Throws on any non-2xx or network/
    timeout failure; never retries (see run.mjs's guardrails -- no
    automatic retry that could result in two submissions). The thrown
    error's `rawBody` (xAI's own response text, if any) is intentionally
    attached for callers that want to log a redacted summary -- callers
    must run it through observability.mjs's redactSecrets before
    logging/returning it, since a defensive posture is kept here even
    though xAI's own response cannot legitimately contain our secrets. */
export async function callXaiResponses(apiKey, requestBody) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(XAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
  } catch (networkErr) {
    clearTimeout(timeoutId);
    const err = new Error(networkErr && networkErr.name === 'AbortError' ? 'xai_request_timeout' : 'xai_network_error');
    throw err;
  }
  clearTimeout(timeoutId);

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (_) {
    /* leave json null; non-JSON body is still reported via rawBody */
  }

  if (!res.ok) {
    const err = new Error(`xai_http_${res.status}`);
    err.status = res.status;
    err.rawBody = text;
    throw err;
  }

  return json;
}

/** Extracts the model's final assistant text (the "candidate report" in
    dry-run mode) from a Responses API output array, defensively -- xAI's
    exact message/content item shape wasn't independently confirmed
    end-to-end (see this worker's README "xAI compatibility notes"), so
    this scans for the last message-shaped output item rather than
    assuming one fixed path. Returns null if nothing recognizable is
    found (never throws). */
export function extractFinalText(output) {
  if (!Array.isArray(output)) return null;
  for (let i = output.length - 1; i >= 0; i--) {
    const item = output[i];
    if (!item || item.type !== 'message' || !Array.isArray(item.content)) continue;
    for (const part of item.content) {
      if (part && typeof part.text === 'string' && part.text.trim()) return part.text;
    }
  }
  return null;
}

/** Summarizes a Responses API response into the safe, structured
    observability shape this worker returns/logs. Never includes a raw
    request/response body -- only counts and short text. */
export function summarizeXaiResponse(response, { mode }) {
  const output = Array.isArray(response && response.output) ? response.output : [];

  const webSearchCalls = output.filter((item) => item && item.type === 'web_search_call').length;

  const mcpCallItems = output.filter((item) => item && item.type === 'mcp_call');
  const matchingMcpCalls = mcpCallItems.filter((item) => {
    const name = typeof item.name === 'string' ? item.name : '';
    return name === 'submit_research_batch' || name.endsWith('.submit_research_batch');
  });
  const unexpectedMcpCalls = mcpCallItems.length - matchingMcpCalls.length;

  let outcome;
  const mcp = {
    called: false,
    calls_detected: matchingMcpCalls.length,
    unexpected_tool_calls: unexpectedMcpCalls
  };

  if (mode === 'dry-run') {
    // Structurally incapable of calling the MCP tool at all -- the
    // outcome is always dry_run_complete regardless of what was found.
    outcome = 'dry_run_complete';
  } else if (matchingMcpCalls.length > 0) {
    outcome = 'submitted';
    mcp.called = true;
    if (matchingMcpCalls.length > 1) mcp.multiple_calls_detected = true;
  } else {
    outcome = 'no_submission';
  }

  const usage = response && response.usage
    ? {
        input_tokens: typeof response.usage.input_tokens === 'number' ? response.usage.input_tokens : null,
        output_tokens: typeof response.usage.output_tokens === 'number' ? response.usage.output_tokens : null
      }
    : null;

  return {
    outcome,
    mcp,
    research: { web_search_calls: webSearchCalls },
    usage,
    server_side_tool_usage: response && response.server_side_tool_usage ? response.server_side_tool_usage : null,
    candidate_report: extractFinalText(output)
  };
}
