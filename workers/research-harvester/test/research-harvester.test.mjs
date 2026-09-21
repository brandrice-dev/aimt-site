#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   AIMT Research Harvester Worker — test harness
   ---------------------------------------------------------------
   Exercises the worker's modules directly (plain ES module imports,
   Web-standard Request/Response/fetch/crypto -- all native to Node,
   same pattern already used by this repo's Pages Functions tests) and
   the exported `fetch`/`scheduled` handlers from src/index.mjs, called
   exactly how the Cloudflare Workers runtime would call them.

   NEVER hits real xAI, real AIMT (production or otherwise), or real
   Supabase -- global.fetch is mocked in every test that would
   otherwise make a network call. No secret value used anywhere in this
   file is real; these are fixture strings only.

   Exit code 0 = all assertions passed, nonzero = failure (with detail).
   ═══════════════════════════════════════════════════════════════ */

import worker from '../src/index.mjs';
import { runHarvest, resolveMode, resolveModel, buildBatchId, SOURCE_SYSTEM, DEFAULT_MODEL } from '../src/run.mjs';
import { buildTools, buildRequestBody, AIMT_MCP_SERVER_URL, AIMT_MCP_ALLOWED_TOOLS, summarizeXaiResponse } from '../src/xai-client.mjs';
import { checkBearerAuth } from '../src/auth.mjs';
import { HARVESTER_OPERATING_SPEC_VERSION } from '../prompts/harvester-operating-spec.v1.mjs';

let failures = 0;
function assert(cond, msg) {
  if (!cond) { failures++; console.error(`FAIL: ${msg}`); }
  else console.log(`ok: ${msg}`);
}

/* Fixture-only values -- never real credentials. */
const FAKE_XAI_KEY = 'fake-xai-api-key-do-not-use-in-prod';
const FAKE_MCP_SECRET = 'fake-mcp-connector-secret-do-not-use-in-prod';
const FAKE_RUN_SECRET = 'fake-harvester-run-secret-do-not-use-in-prod';

function makeEnv(overrides = {}) {
  return {
    XAI_API_KEY: FAKE_XAI_KEY,
    MCP_CONNECTOR_SECRET: FAKE_MCP_SECRET,
    HARVESTER_RUN_SECRET: FAKE_RUN_SECRET,
    XAI_RESEARCH_MODEL: 'grok-4.7-test',
    HARVESTER_MODE: 'dry-run',
    ...overrides
  };
}

/** Mocks global.fetch to intercept only calls to xAI's Responses API
    (the only network call this worker ever makes); anything else
    throws loudly rather than silently succeeding, so a test can never
    accidentally pass because an unexpected real network call happened
    to work. */
async function withMockedXai(responder, fn) {
  const real = global.fetch;
  const calls = [];
  global.fetch = async (url, opts = {}) => {
    calls.push({ url: String(url), opts, body: opts.body ? JSON.parse(opts.body) : null });
    if (String(url) === 'https://api.x.ai/v1/responses') {
      return responder(calls[calls.length - 1]);
    }
    throw new Error(`Unexpected network call in test to ${url} -- only https://api.x.ai/v1/responses may ever be called`);
  };
  try {
    return { calls, result: await fn() };
  } finally {
    global.fetch = real;
  }
}

function okXaiResponse(body) {
  return { ok: true, status: 200, text: async () => JSON.stringify(body) };
}
function failXaiResponse(status, body) {
  return { ok: false, status, text: async () => JSON.stringify(body || { error: 'mock_failure' }) };
}

/* ══════════════ Auth: HARVESTER_RUN_SECRET ══════════════ */
async function testMissingOrInvalidRunSecretRejected() {
  console.log('\n--- POST /run: missing/invalid HARVESTER_RUN_SECRET -> 401 ---');
  const env = makeEnv();

  const noAuth = await worker.fetch(new Request('https://harvester.example/run', { method: 'POST' }), env);
  assert(noAuth.status === 401, `no Authorization header -> 401 (got ${noAuth.status})`);

  const wrongAuth = await worker.fetch(new Request('https://harvester.example/run', {
    method: 'POST',
    headers: { Authorization: 'Bearer totally-wrong-secret' }
  }), env);
  assert(wrongAuth.status === 401, `wrong bearer token -> 401 (got ${wrongAuth.status})`);

  const wrongScheme = await worker.fetch(new Request('https://harvester.example/run', {
    method: 'POST',
    headers: { Authorization: `Basic ${FAKE_RUN_SECRET}` }
  }), env);
  assert(wrongScheme.status === 401, `non-Bearer scheme -> 401 (got ${wrongScheme.status})`);

  assert(checkBearerAuth(new Request('https://x/', { headers: { Authorization: 'Bearer x' } }), '') === false, 'checkBearerAuth fails closed when expectedSecret itself is empty/missing');
}

/* ══════════════ Health endpoint ══════════════ */
async function testHealthRevealsNoSecrets() {
  console.log('\n--- GET /health: no auth required, reveals no secret values ---');
  const env = makeEnv();
  const res = await worker.fetch(new Request('https://harvester.example/health', { method: 'GET' }), env);
  assert(res.status === 200, `GET /health -> 200 with no Authorization header (got ${res.status})`);

  const body = await res.json();
  assert(body.service === 'aimt-research-harvester', 'health reports service name');
  assert(typeof body.version === 'string' && body.version.length > 0, 'health reports a version string');
  assert(body.mode === 'dry-run', `health reports the configured mode (got ${body.mode})`);
  assert(body.model === 'grok-4.7-test', `health reports the configured model (got ${body.model})`);
  assert(body.xai_api_key_configured === true, 'health reports xai_api_key_configured as a boolean, not the value');
  assert(body.mcp_connector_secret_configured === true, 'health reports mcp_connector_secret_configured as a boolean');
  assert(body.harvester_run_secret_configured === true, 'health reports harvester_run_secret_configured as a boolean');

  const raw = JSON.stringify(body);
  assert(!raw.includes(FAKE_XAI_KEY), 'health response never contains the XAI_API_KEY value');
  assert(!raw.includes(FAKE_MCP_SECRET), 'health response never contains the MCP_CONNECTOR_SECRET value');
  assert(!raw.includes(FAKE_RUN_SECRET), 'health response never contains the HARVESTER_RUN_SECRET value');

  let headerLeak = false;
  for (const [, v] of res.headers.entries()) {
    if (v.includes(FAKE_XAI_KEY) || v.includes(FAKE_MCP_SECRET) || v.includes(FAKE_RUN_SECRET)) headerLeak = true;
  }
  assert(!headerLeak, 'health response headers never contain a secret value');
}

async function testHealthReflectsUnconfiguredSecrets() {
  console.log('\n--- GET /health: unconfigured secrets report false, not absence-shaped errors ---');
  const env = makeEnv({ XAI_API_KEY: undefined, MCP_CONNECTOR_SECRET: '', HARVESTER_RUN_SECRET: undefined });
  const res = await worker.fetch(new Request('https://harvester.example/health', { method: 'GET' }), env);
  assert(res.status === 200, `health still responds 200 even with secrets unconfigured (got ${res.status})`);
  const body = await res.json();
  assert(body.xai_api_key_configured === false, 'reports false for an unconfigured XAI_API_KEY');
  assert(body.mcp_connector_secret_configured === false, 'reports false for an empty-string MCP_CONNECTOR_SECRET');
  assert(body.harvester_run_secret_configured === false, 'reports false for an unconfigured HARVESTER_RUN_SECRET');
}

/* ══════════════ HARVESTER_MODE default ══════════════ */
function testAbsentModeDefaultsToDryRun() {
  console.log('\n--- resolveMode(): absent/invalid HARVESTER_MODE defaults safely to dry-run ---');
  assert(resolveMode(undefined) === 'dry-run', 'undefined -> dry-run');
  assert(resolveMode(null) === 'dry-run', 'null -> dry-run');
  assert(resolveMode('') === 'dry-run', 'empty string -> dry-run');
  assert(resolveMode('not-a-real-mode') === 'dry-run', 'invalid string -> dry-run (never defaults to live)');
  assert(resolveMode('LIVE') === 'live', 'case-insensitive match still resolves live when explicitly valid');
  assert(resolveMode('dry-run') === 'dry-run', 'explicit dry-run resolves to dry-run');
  assert(resolveMode('live') === 'live', 'explicit live resolves to live');
}

function testModelDefaultAndOverride() {
  console.log('\n--- resolveModel(): defaults and override ---');
  assert(resolveModel(undefined) === DEFAULT_MODEL, `undefined -> DEFAULT_MODEL (got ${resolveModel(undefined)})`);
  assert(resolveModel('') === DEFAULT_MODEL, 'empty string -> DEFAULT_MODEL');
  assert(resolveModel('  grok-custom  ') === 'grok-custom', 'a configured model value is trimmed and used as-is');
}

/* ══════════════ xAI request shape: dry-run vs live ══════════════ */
function testDryRunToolsShape() {
  console.log('\n--- dry-run xAI request: web_search present, MCP tool structurally absent ---');
  const tools = buildTools('dry-run', FAKE_MCP_SECRET);
  assert(tools.some((t) => t.type === 'web_search'), 'dry-run tools[] contains web_search');
  assert(!tools.some((t) => t.type === 'mcp'), 'dry-run tools[] contains NO mcp tool, even though a connector secret was passed in');

  // Structural guarantee: dry-run never adds the MCP tool even if no
  // secret is available at all (the exact "dry-run must be incapable
  // of writing to AIMT" requirement).
  const toolsNoSecret = buildTools('dry-run', undefined);
  assert(!toolsNoSecret.some((t) => t.type === 'mcp'), 'dry-run tools[] contains no mcp tool even with no secret available');
}

function testLiveToolsShape() {
  console.log('\n--- live xAI request: web_search + exactly one Remote MCP tool, correctly scoped ---');
  const tools = buildTools('live', FAKE_MCP_SECRET);
  assert(tools.some((t) => t.type === 'web_search'), 'live tools[] contains web_search');

  const mcpTools = tools.filter((t) => t.type === 'mcp');
  assert(mcpTools.length === 1, `live tools[] contains exactly one Remote MCP configuration (got ${mcpTools.length})`);

  const mcp = mcpTools[0];
  assert(mcp.server_url === 'https://aimtrichology.com/api/mcp', `MCP server_url is exactly https://aimtrichology.com/api/mcp (got ${mcp.server_url})`);
  assert(mcp.server_url === AIMT_MCP_SERVER_URL, 'MCP server_url matches the exported constant');
  assert(Array.isArray(mcp.allowed_tools) && mcp.allowed_tools.length === 1 && mcp.allowed_tools[0] === 'submit_research_batch',
    `allowed_tools contains only submit_research_batch (got ${JSON.stringify(mcp.allowed_tools)})`);
  assert(JSON.stringify(mcp.allowed_tools) === JSON.stringify([...AIMT_MCP_ALLOWED_TOOLS]), 'allowed_tools matches the exported constant exactly');
  assert(mcp.authorization === `Bearer ${FAKE_MCP_SECRET}`, 'MCP authorization is built from the exact secret passed in, as "Bearer <secret>"');
}

function testLiveModeRequiresSecretToBuildTools() {
  console.log('\n--- live mode refuses to build a request at all without a connector secret ---');
  let threw = false;
  try {
    buildTools('live', undefined);
  } catch (_) {
    threw = true;
  }
  assert(threw, 'buildTools("live", undefined) throws rather than silently omitting the MCP tool or sending an empty authorization');
}

function testRequestBodyIncludesSystemAndUserMessages() {
  console.log('\n--- buildRequestBody(): includes the versioned operating spec + model ---');
  const body = buildRequestBody({
    mode: 'dry-run',
    model: 'grok-test-model',
    mcpConnectorSecret: undefined,
    systemPrompt: 'SYSTEM_PROMPT_MARKER',
    userPrompt: 'USER_PROMPT_MARKER'
  });
  assert(body.model === 'grok-test-model', 'request body uses the exact model passed in');
  assert(Array.isArray(body.input) && body.input[0].role === 'system' && body.input[0].content === 'SYSTEM_PROMPT_MARKER', 'input[0] is the system-role operating spec');
  assert(body.input[1].role === 'user' && body.input[1].content === 'USER_PROMPT_MARKER', 'input[1] is the user-role research instruction');
}

/* ══════════════ runHarvest(): fail-closed guardrails ══════════════ */
async function testMissingXaiApiKeyFailsClosed() {
  console.log('\n--- runHarvest(): missing XAI_API_KEY fails closed, never calls xAI ---');
  const env = makeEnv({ XAI_API_KEY: undefined });
  const real = global.fetch;
  global.fetch = async () => { throw new Error('xAI must never be called when XAI_API_KEY is missing'); };
  try {
    const result = await runHarvest(env, { trigger: 'manual' });
    assert(result.outcome === 'failed', `outcome is 'failed' (got ${result.outcome})`);
    assert(result.reason === 'missing_xai_api_key', `reason is missing_xai_api_key (got ${result.reason})`);
  } finally {
    global.fetch = real;
  }
}

async function testMissingMcpSecretInLiveModeFailsClosed() {
  console.log('\n--- runHarvest(): live mode without MCP_CONNECTOR_SECRET fails closed, never calls xAI ---');
  const env = makeEnv({ HARVESTER_MODE: 'live', MCP_CONNECTOR_SECRET: undefined });
  const real = global.fetch;
  global.fetch = async () => { throw new Error('xAI must never be called when live mode is missing MCP_CONNECTOR_SECRET'); };
  try {
    const result = await runHarvest(env, { trigger: 'manual' });
    assert(result.outcome === 'failed', `outcome is 'failed' (got ${result.outcome})`);
    assert(result.reason === 'missing_mcp_connector_secret_in_live_mode', `reason is missing_mcp_connector_secret_in_live_mode (got ${result.reason})`);
    assert(result.mode === 'live', 'reported mode is still live (not silently downgraded)');
  } finally {
    global.fetch = real;
  }
}

async function testXaiFailureReturnsSafeFailure() {
  console.log('\n--- runHarvest(): xAI HTTP failure -> outcome failed, no crash, no secret leak ---');
  const env = makeEnv();
  await withMockedXai(
    async () => failXaiResponse(500, { error: 'internal error', echoed_authorization: `Bearer ${FAKE_MCP_SECRET}` }),
    async () => {
      const result = await runHarvest(env, { trigger: 'manual' });
      assert(result.outcome === 'failed', `outcome is 'failed' on xAI HTTP failure (got ${result.outcome})`);
      assert(result.reason === 'xai_request_failed', `reason is xai_request_failed (got ${result.reason})`);
      const raw = JSON.stringify(result);
      assert(!raw.includes(FAKE_MCP_SECRET), 'even an xAI error body that happens to echo the MCP secret is redacted before being returned');
      assert(!raw.includes(FAKE_XAI_KEY), 'failure result never contains the XAI_API_KEY value');
    }
  );
}

async function testXaiNetworkTimeoutReturnsSafeFailure() {
  console.log('\n--- runHarvest(): xAI network/abort failure -> safe outcome failed ---');
  const env = makeEnv();
  const real = global.fetch;
  global.fetch = async () => { const e = new Error('simulated abort'); e.name = 'AbortError'; throw e; };
  try {
    const result = await runHarvest(env, { trigger: 'manual' });
    assert(result.outcome === 'failed', `outcome is 'failed' on a network/timeout error (got ${result.outcome})`);
    assert(result.reason === 'xai_request_failed', `reason is xai_request_failed (got ${result.reason})`);
  } finally {
    global.fetch = real;
  }
}

/* ══════════════ Successful dry-run: no AIMT write, correct shape ══════════════ */
async function testSuccessfulDryRunCausesNoAimtWrite() {
  console.log('\n--- runHarvest(): successful dry-run never touches AIMT, reports dry_run_complete ---');
  const env = makeEnv({ HARVESTER_MODE: 'dry-run' });
  const mockResponse = {
    id: 'resp-mock-dryrun-1',
    output: [
      { type: 'web_search_call' },
      { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Candidate report: nothing new found worth adding this run.' }] }
    ],
    usage: { input_tokens: 1200, output_tokens: 340 },
    server_side_tool_usage: { SERVER_SIDE_TOOL_WEB_SEARCH: 3 }
  };
  const { calls, result } = await withMockedXai(async () => okXaiResponse(mockResponse), () => runHarvest(env, { trigger: 'manual' }));

  assert(calls.length === 1, `exactly one network call was made (got ${calls.length})`);
  assert(calls[0].url === 'https://api.x.ai/v1/responses', 'the one call made was to xAI, not AIMT or anywhere else');
  assert(!calls.some((c) => c.url.includes('aimtrichology.com')), 'no call to AIMT (production or otherwise) was ever made during a dry-run');
  assert(!calls[0].body.tools.some((t) => t.type === 'mcp'), 'the actual request body sent to xAI contained no MCP tool');

  assert(result.outcome === 'dry_run_complete', `outcome is dry_run_complete (got ${result.outcome})`);
  assert(result.mode === 'dry-run', 'result reports mode: dry-run');
  assert(result.xai_response_id === 'resp-mock-dryrun-1', 'result carries the xAI response id');
  assert(result.research.web_search_calls === 1, `research.web_search_calls counted correctly (got ${result.research.web_search_calls})`);
  assert(result.usage.input_tokens === 1200 && result.usage.output_tokens === 340, 'result carries token usage from xAI');
  assert(typeof result.candidate_report === 'string' && result.candidate_report.includes('Candidate report'), 'result carries the structured candidate report text');
  assert(result.mcp.called === false, 'result.mcp.called is false for a dry-run');
  assert(result.spec_version === HARVESTER_OPERATING_SPEC_VERSION, 'result carries the operating spec version actually used');
}

async function testLiveRunWithSubmissionReportsSubmitted() {
  console.log('\n--- runHarvest(): live run where the model called submit_research_batch -> outcome submitted ---');
  const env = makeEnv({ HARVESTER_MODE: 'live' });
  const mockResponse = {
    id: 'resp-mock-live-1',
    output: [
      { type: 'web_search_call' },
      { type: 'mcp_call', name: 'aimt-research-harvester.submit_research_batch', server_label: 'aimt-research-harvester' },
      { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Submitted one updated claim.' }] }
    ],
    usage: { input_tokens: 2000, output_tokens: 500 }
  };
  const { calls, result } = await withMockedXai(async () => okXaiResponse(mockResponse), () => runHarvest(env, { trigger: 'manual' }));

  assert(calls.length === 1, 'exactly one network call (to xAI) for the whole run, even in live mode');
  const sentMcpTool = calls[0].body.tools.find((t) => t.type === 'mcp');
  assert(!!sentMcpTool, 'the live request actually included the MCP tool');
  assert(sentMcpTool.authorization === `Bearer ${FAKE_MCP_SECRET}`, 'the MCP authorization sent to xAI was built from env.MCP_CONNECTOR_SECRET at request time');

  assert(result.outcome === 'submitted', `outcome is submitted when the model called submit_research_batch (got ${result.outcome})`);
  assert(result.mcp.called === true, 'result.mcp.called is true');
  assert(result.mcp.calls_detected === 1, `result.mcp.calls_detected is 1 (got ${result.mcp.calls_detected})`);

  const raw = JSON.stringify(result);
  assert(!raw.includes(FAKE_MCP_SECRET), 'the returned result never contains the raw MCP_CONNECTOR_SECRET value, even though it was used to build the request');
  assert(!raw.includes(FAKE_XAI_KEY), 'the returned result never contains the raw XAI_API_KEY value');
}

async function testLiveRunWithNoUsefulEvidenceReportsNoSubmission() {
  console.log('\n--- runHarvest(): live run where the model found nothing worth adding -> outcome no_submission ---');
  const env = makeEnv({ HARVESTER_MODE: 'live' });
  const mockResponse = {
    id: 'resp-mock-live-2',
    output: [
      { type: 'web_search_call' },
      { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Nothing new or useful found this run; no submission made.' }] }
    ],
    usage: { input_tokens: 900, output_tokens: 120 }
  };
  const { result } = await withMockedXai(async () => okXaiResponse(mockResponse), () => runHarvest(env, { trigger: 'manual' }));
  assert(result.outcome === 'no_submission', `outcome is no_submission when the model made no MCP call (got ${result.outcome})`);
  assert(result.mcp.called === false, 'result.mcp.called is false');
}

function testMultipleMcpCallsAreFlaggedNotHidden() {
  console.log('\n--- summarizeXaiResponse(): more than one submit_research_batch call is detected, not silently hidden ---');
  const summary = summarizeXaiResponse({
    id: 'resp-mock-multi',
    output: [
      { type: 'mcp_call', name: 'aimt-research-harvester.submit_research_batch' },
      { type: 'mcp_call', name: 'aimt-research-harvester.submit_research_batch' }
    ]
  }, { mode: 'live' });
  assert(summary.outcome === 'submitted', 'still reports submitted (it did submit)');
  assert(summary.mcp.calls_detected === 2, `calls_detected reflects the true count (got ${summary.mcp.calls_detected})`);
  assert(summary.mcp.multiple_calls_detected === true, 'a second call is explicitly flagged as an anomaly rather than silently ignored');
}

/* ══════════════ POST /run vs scheduled(): same pipeline ══════════════ */
async function testScheduledAndManualUseSamePipeline() {
  console.log('\n--- POST /run and scheduled() run behaviorally identical pipelines for the same input ---');
  const env = makeEnv({ HARVESTER_MODE: 'dry-run' });
  const mockResponse = {
    id: 'resp-mock-parity',
    output: [{ type: 'web_search_call' }, { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'parity check report' }] }],
    usage: { input_tokens: 10, output_tokens: 5 }
  };

  const manual = await withMockedXai(async () => okXaiResponse(mockResponse), async () => {
    const res = await worker.fetch(new Request('https://harvester.example/run', {
      method: 'POST',
      headers: { Authorization: `Bearer ${FAKE_RUN_SECRET}` }
    }), env);
    return res.json();
  });

  let scheduledLogged = null;
  const realConsoleLog = console.log;
  console.log = (...args) => { if (String(args[0]).includes('scheduled')) scheduledLogged = args[1]; };
  const scheduled = await withMockedXai(async () => okXaiResponse(mockResponse), async () => {
    const waitUntilPromises = [];
    const ctx = { waitUntil: (p) => waitUntilPromises.push(p) };
    await worker.scheduled({}, env, ctx);
    await Promise.all(waitUntilPromises);
  });
  console.log = realConsoleLog;

  const manualResult = manual.result;
  assert(manualResult.mode === 'dry-run' && manualResult.outcome === 'dry_run_complete', 'manual POST /run produced the expected governed outcome');
  assert(scheduled.calls.length === 1, 'scheduled() also made exactly one xAI call, same as manual');
  assert(!!scheduledLogged, 'scheduled() logs a safe run summary');
  assert(scheduledLogged && !JSON.stringify(scheduledLogged).includes(FAKE_MCP_SECRET) && !JSON.stringify(scheduledLogged).includes(FAKE_XAI_KEY), 'scheduled()\'s log line never contains a secret');

  const loggedParsed = JSON.parse(scheduledLogged);
  assert(loggedParsed.mode === 'dry-run' && loggedParsed.outcome === 'dry_run_complete', 'scheduled() produced the same governed outcome shape as manual for identical input');
}

/* ══════════════ batch_id / source_system ══════════════ */
function testBatchIdFormat() {
  console.log('\n--- buildBatchId(): matches the required xai-harvester-<UTC timestamp> shape ---');
  const id = buildBatchId(new Date('2026-09-21T18:32:05.123Z'));
  assert(id === 'xai-harvester-20260921T183205Z', `batch_id has the expected compact UTC-timestamp shape (got ${id})`);
  assert(id.startsWith('xai-harvester-'), 'batch_id is prefixed exactly xai-harvester-');
}

function testSourceSystemConstant() {
  console.log('\n--- SOURCE_SYSTEM constant ---');
  assert(SOURCE_SYSTEM === 'xai-research-harvester', `SOURCE_SYSTEM is exactly xai-research-harvester (got ${SOURCE_SYSTEM})`);
}

/* ══════════════ 404 for anything else ══════════════ */
async function testUnknownRoutesReturn404() {
  console.log('\n--- unknown routes/methods -> 404, no auth bypass ---');
  const env = makeEnv();
  const res = await worker.fetch(new Request('https://harvester.example/not-a-real-route', { method: 'GET' }), env);
  assert(res.status === 404, `unknown GET route -> 404 (got ${res.status})`);
  const getRun = await worker.fetch(new Request('https://harvester.example/run', { method: 'GET' }), env);
  assert(getRun.status === 404, `GET /run (wrong method) -> 404, not treated as a valid trigger (got ${getRun.status})`);
}

async function main() {
  await testMissingOrInvalidRunSecretRejected();
  await testHealthRevealsNoSecrets();
  await testHealthReflectsUnconfiguredSecrets();
  testAbsentModeDefaultsToDryRun();
  testModelDefaultAndOverride();
  testDryRunToolsShape();
  testLiveToolsShape();
  testLiveModeRequiresSecretToBuildTools();
  testRequestBodyIncludesSystemAndUserMessages();
  await testMissingXaiApiKeyFailsClosed();
  await testMissingMcpSecretInLiveModeFailsClosed();
  await testXaiFailureReturnsSafeFailure();
  await testXaiNetworkTimeoutReturnsSafeFailure();
  await testSuccessfulDryRunCausesNoAimtWrite();
  await testLiveRunWithSubmissionReportsSubmitted();
  await testLiveRunWithNoUsefulEvidenceReportsNoSubmission();
  testMultipleMcpCallsAreFlaggedNotHidden();
  await testScheduledAndManualUseSamePipeline();
  testBatchIdFormat();
  testSourceSystemConstant();
  await testUnknownRoutesReturn404();

  console.log(`\n=== ${failures === 0 ? 'ALL PASSED' : `${failures} ASSERTION(S) FAILED`} ===`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Test run crashed:', err);
  process.exit(1);
});
