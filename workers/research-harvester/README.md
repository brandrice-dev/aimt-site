# AIMT Research Harvester — Cloudflare Worker

Server-side automation foundation: a dedicated Cloudflare Worker that drives
xAI's Responses API (Grok + `web_search` + a Remote MCP tool) to research
AIMT's domains and, in live mode, submit governed batches to the production
AIMT MCP endpoint (`https://aimtrichology.com/api/mcp`,
`submit_research_batch`). Grok Bot Desktop is not part of this execution
path — Desktop's OAuth limitations (unusable/empty redirect URI, no secure
way to bind `MCP_CONNECTOR_SECRET`) are exactly what this worker exists to
avoid without weakening AIMT security.

**Status: foundation only. Not deployed. No Cloudflare secrets set. No Cron
Trigger enabled.**

## Isolation from aimt-site

This directory is fully self-contained:

- Its own `wrangler.toml` (worker name `aimt-research-harvester`, separate
  from the `aimt-site` Pages project).
- Its own `src/`, with a small duplicated `auth.mjs` (rather than importing
  from `functions/_lib/`) so it can be deployed independently.
- Zero npm dependencies, zero build step — plain ES modules using
  Cloudflare's native `fetch`/`Request`/`Response`/`crypto`, mirroring the
  rest of this repo's `functions/api/*` convention.

Nothing here changes the existing Pages deployment, `functions/`, or
`_redirects`. There is no root-level `wrangler.toml`.

## Environment variables

| Name | Kind | Purpose |
|---|---|---|
| `XAI_API_KEY` | secret | Bearer token for `https://api.x.ai/v1/responses` |
| `MCP_CONNECTOR_SECRET` | secret | Same secret already used by `/api/mcp`'s static-secret auth path — built into the Remote MCP tool's `authorization` field at request time, live mode only |
| `HARVESTER_RUN_SECRET` | secret | Bearer token required on `POST /run` |
| `XAI_RESEARCH_MODEL` | var | xAI model id, e.g. `grok-4.7`. Defaults to `DEFAULT_MODEL` in `src/run.mjs` if absent/blank |
| `HARVESTER_MODE` | var | `dry-run` or `live`. Defaults safely to `dry-run` for anything absent or invalid — **never** defaults to `live` |

None of the three secrets are declared in `wrangler.toml`, in any form —
see that file's own comments. `XAI_RESEARCH_MODEL` / `HARVESTER_MODE` do
have safe defaults there.

## Routes

- `GET /health` — no auth. Returns `{ service, version, mode, model,
  xai_api_key_configured, mcp_connector_secret_configured,
  harvester_run_secret_configured }` — booleans only, never a secret value.
- `POST /run` — requires `Authorization: Bearer <HARVESTER_RUN_SECRET>`
  (constant-time compare). Runs the exact same `runHarvest()` pipeline the
  `scheduled()` handler will later run, and returns its result as JSON.
- `scheduled()` — implemented in `src/index.mjs`, but **no Cron Trigger is
  configured** (`wrangler.toml`'s `[triggers] crons = []`). It will not run
  until that's changed, and cadence is a decision for after the first
  successful controlled live run — not part of this foundation.

## Dry-run vs. live

Both modes give Grok `web_search`. Only `live` mode adds the Remote MCP
tool, and only when `MCP_CONNECTOR_SECRET` is actually configured — see
`src/xai-client.mjs`'s `buildTools()`. There is no code path that adds the
MCP tool in dry-run mode, regardless of input; dry-run is structurally
incapable of writing to AIMT, not just prompted not to.

```jsonc
// dry-run tools
[{ "type": "web_search" }]

// live tools
[
  { "type": "web_search" },
  {
    "type": "mcp",
    "server_url": "https://aimtrichology.com/api/mcp",
    "server_label": "aimt-research-harvester",
    "authorization": "Bearer <MCP_CONNECTOR_SECRET, built at request time>",
    "allowed_tools": ["submit_research_batch"]
  }
]
```

## Governance

`prompts/harvester-operating-spec.v1.mjs` is the versioned system prompt
Grok receives on every run. It is a distillation of AIMT's own research
library governance docs (`SCHEMA.md`, `TRUST_MODEL.md`, `LANES.md`,
`WORKFLOW.md` — read locally from the gitignored `research-import/`
export while building this worker, never committed) plus the *real*,
authoritative field names/enums from `functions/_lib/research/schema.mjs`
and `functions/api/mcp.js`'s `submit_research_batch` tool definition. It
does not define a parallel schema. Bump the filename (`v2`, ...) rather
than silently editing `v1` in place if the rules ever change, so a run's
recorded `spec_version` always matches what the model was actually told.

Hard rules it enforces (see the file itself for the full text):
`AIMT_APPROVED` is human-only and must never be submitted; a claim/source
must never be promoted past what was actually checked in that session; no
`public_eligible`/`published`/curriculum status is ever implied; IDs follow
AIMT's exact `source_id` / `<source_id>--cNN` convention; relationships are
never invented from topical overlap; contradictory evidence is submitted
honestly, not reconciled; quarantine on AIMT's side is normal, not a bug;
no diagnosis or medical-scope expansion is ever inferred from a source
merely discussing a condition; call `submit_research_batch` **at most
once**, and only when something genuinely useful was found.

## Guardrails against runaway execution / cost

- Exactly one `fetch` to `https://api.x.ai/v1/responses` per `runHarvest()`
  call — xAI's Remote MCP tool executes the whole tool-calling loop
  server-side, so this worker never orchestrates a manual multi-turn loop.
- No automatic retry of a failed xAI request.
- No recursive self-call of this Worker from either handler.
- A conservative, hardcoded request timeout (`REQUEST_TIMEOUT_MS` in
  `src/xai-client.mjs`) — deliberately not env-configurable, so it can't be
  loosened by config alone.
- Live mode fails closed (`outcome: "failed"`) if `XAI_API_KEY` or
  `MCP_CONNECTOR_SECRET` is missing, rather than silently degrading to a
  dry-run-shaped request under a `live`-labeled outcome.
- `allowed_tools` restricts the MCP connection to `submit_research_batch`
  only — no other tool AIMT's MCP might ever expose is reachable.
- A second `mcp_call` to `submit_research_batch` in one response (which the
  prompt instructs against, and which is not expected) is detected and
  flagged (`mcp.multiple_calls_detected`) rather than silently accepted —
  see "xAI Remote MCP compatibility notes" below for why this is
  observational, not a hard server-side cap.

## Observability

Every `runHarvest()` result (returned by `POST /run`, and logged by
`scheduled()`) is a plain, secret-free JSON object: `run_id`, `trigger`,
`mode`, `model`, `batch_id`, `spec_version`, `started_at`, `finished_at`,
`xai_response_id`, `outcome` (`dry_run_complete` | `submitted` |
`no_submission` | `failed`), `mcp` (call counts), `research` (web-search
call count), `usage` (token counts if xAI provided them),
`server_side_tool_usage`, and `candidate_report` (the model's final text,
truncated, redacted). `XAI_API_KEY`, `MCP_CONNECTOR_SECRET`,
`HARVESTER_RUN_SECRET`, any `Authorization` header value, and Supabase
credentials are never logged or returned — see `src/observability.mjs`'s
`redactSecrets()`, applied even to upstream error text defensively.

## First controlled dry-run procedure (after this branch is reviewed)

1. From inside `workers/research-harvester/`, set the three secrets:
   ```bash
   wrangler secret put XAI_API_KEY
   wrangler secret put MCP_CONNECTOR_SECRET
   wrangler secret put HARVESTER_RUN_SECRET
   ```
   (`MCP_CONNECTOR_SECRET` is the *same* secret already configured on the
   `aimt-site` Pages project for `/api/mcp` — reuse it, don't mint a
   second one, unless AIMT's own credential rotation policy says
   otherwise.)
2. `wrangler deploy` (still no Cron Trigger — `wrangler.toml` doesn't
   define one).
3. `curl https://<deployed-worker-url>/health` — confirm `mode` reads
   `dry-run` (the safe default) and all three `*_configured` booleans are
   `true`.
4. Controlled dry-run:
   ```bash
   curl -X POST https://<deployed-worker-url>/run \
     -H "Authorization: Bearer <HARVESTER_RUN_SECRET>"
   ```
   Confirm the response's `outcome` is `dry_run_complete`, `mode` is
   `dry-run`, and read `candidate_report` to sanity-check the research
   quality before ever considering live mode.
5. Only after that looks right: set `HARVESTER_MODE = "live"` (Cloudflare
   dashboard var, or `wrangler deploy --var HARVESTER_MODE:live`), redeploy,
   and repeat step 4's `POST /run` once, watching the result closely
   (`outcome`, `mcp.called`, `mcp.calls_detected`). Then check
   `aimt_logs` / `research_ingestion_log` / the new-and-updated
   `research_sources`/`research_claims` rows in Supabase directly, exactly
   as you would after any other MCP submission.
6. Only after a successful controlled live run: decide a Cron cadence and
   add a `crons = [...]` entry to `wrangler.toml`.

## xAI Remote MCP compatibility notes (read before the first live run)

Built and reasoned about against xAI's official docs
(`docs.x.ai/docs/guides/tools/{remote-mcp-tools,search-tools,chat}`,
`docs.x.ai/developers/tools/tool-usage-details`), fetched and verified
while building this worker — **not** validated against a real xAI call
(per this task's explicit "do not hit real xAI" constraint), so treat the
first controlled dry-run as the actual compatibility test:

- **Response `output[]` item shapes** (`message` / `web_search_call` /
  `mcp_call`, and the assistant text's exact nested field name) were
  confirmed at the field-name level from xAI's docs, but not observed
  end-to-end against a live response. `src/xai-client.mjs`'s
  `summarizeXaiResponse()`/`extractFinalText()` are written defensively
  (scan for a shape, never assume a single fixed path, never throw if a
  field is missing) specifically because of this.
- **No documented hard "max MCP tool calls" parameter.** The operating
  spec instructs the model to call `submit_research_batch` at most once,
  and `allowed_tools` restricts it to that one tool, but there is no xAI
  request parameter (as of the docs read while building this) that
  enforces a call-count ceiling server-side. This worker detects and flags
  a second call rather than silently accepting or rejecting it outright —
  if the first controlled live run ever shows more than one call, treat
  that as a signal to add a stronger prompt constraint or, if xAI ships one
  later, an actual request-level limit.
- **`require_approval` and `connector_id`** (OpenAI Responses API
  parameters) are explicitly documented as unsupported by xAI's Responses
  API — not used here.
