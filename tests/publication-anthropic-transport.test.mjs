import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { fetchPublicationMessages, sanitizePublicationDiagnostics } from '../functions/_lib/research/publication-anthropic-transport.mjs';
import { synthesizeTopic } from '../functions/_lib/research/publication-synthesis-client.mjs';
import { runSynthesisPipeline } from '../functions/_lib/research/publication-synthesis-orchestrator.mjs';
import { surfaceExceptionIfNeeded } from '../functions/_lib/education-ops/education-exception-reporter.mjs';

const events = (stop = 'end_turn') => [
  { type: 'message_start', message: { usage: { input_tokens: 15, output_tokens: 1 } } },
  { type: 'content_block_start', index: 0, content_block: { type: 'thinking' } },
  { type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: 'PRIVATE' } },
  { type: 'content_block_stop', index: 0 },
  { type: 'ping' },
  { type: 'content_block_start', index: 1, content_block: { type: 'text', text: '' } },
  { type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: '{"answer":"é"}' } },
  { type: 'content_block_stop', index: 1 },
  { type: 'message_delta', delta: { stop_reason: stop }, usage: { output_tokens: 42 } },
  { type: 'message_stop' },
];
function stream(list, fragment = true) {
  const bytes = new TextEncoder().encode(list.map((e) => `event: ${e.type}\r\ndata: ${JSON.stringify(e)}\r\n\r\n`).join(''));
  return new Response(new ReadableStream({ start(c) {
    for (let i = 0; i < bytes.length; i += fragment ? 1 : bytes.length) c.enqueue(bytes.slice(i, i + (fragment ? 1 : bytes.length)));
    c.close();
  }}), { headers: { 'Content-Type': 'text/event-stream' } });
}
const body = { model: 'claude-sonnet-5', max_tokens: 64000 };
test('stream assembles fragmented UTF-8/CRLF, ignores thinking/pings, and keeps cumulative usage', async () => {
  const result = await fetchPublicationMessages({ apiKey: 'fixture', body, fetchFn: async (_, init) => {
    assert.equal(JSON.parse(init.body).stream, true);
    assert.equal(init.redirect, 'error');
    return stream(events());
  }});
  assert.deepEqual(result.data.content, [{ type: 'text', text: '{"answer":"é"}' }]);
  assert.deepEqual(result.data.usage, { input_tokens: 15, output_tokens: 42 });
  assert.equal(result.diagnostics.attempts, 1);
  assert.ok(!JSON.stringify(result).includes('PRIVATE'));
});
for (const [name, list, code] of [
  ['early EOF', events().slice(0, -1), 'INCOMPLETE_STREAM'],
  ['provider error after text', [...events().slice(0, -2), { type: 'error', error: { message: 'PRIVATE', type: 'overloaded_error' } }], 'STREAM_ERROR'],
  ['missing delta', events().filter((e) => e.type !== 'message_delta'), 'INCOMPLETE_STREAM'],
  ['unclosed text', events().filter((e) => !(e.type === 'content_block_stop' && e.index === 1)), 'INCOMPLETE_STREAM'],
]) test(`${name} rejects partial generation without retry or raw body disclosure`, async () => {
  let calls = 0;
  await assert.rejects(fetchPublicationMessages({ apiKey: 'fixture', body, fetchFn: async () => { calls++; return stream(list); } }), (err) => {
    assert.equal(err.diagnostics.code, code);
    assert.ok(!err.message.includes('PRIVATE'));
    return true;
  });
  assert.equal(calls, 1);
});
test('HTTP rejection fails fast; transient statuses retry with an exact bounded attempt count', async () => {
  for (const status of [400, 401, 403, 404, 429, 503, 529]) {
    let calls = 0;
    await assert.rejects(fetchPublicationMessages({ apiKey: 'fixture', body, baseDelayMs: 0, maxRetries: 2,
      fetchFn: async () => { calls++; return new Response('PRIVATE provider body', { status }); },
    }), (err) => {
      assert.equal(err.diagnostics.http_status, status);
      assert.equal(err.diagnostics.code, 'HTTP_ERROR');
      assert.equal(err.diagnostics.attempts, calls);
      assert.ok(!err.message.includes('PRIVATE'));
      return true;
    });
    assert.equal(calls, [429, 503, 529].includes(status) ? 3 : 1);
  }
});
test('timeout bounds the whole request; cause codes survive without arbitrary error messages', async () => {
  await assert.rejects(fetchPublicationMessages({ apiKey: 'fixture', body, timeoutMs: 5,
    fetchFn: async (_, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('PRIVATE')), { once: true })),
  }), (err) => err.diagnostics.code === 'REQUEST_TIMEOUT' && err.diagnostics.attempts === 1);
  await assert.rejects(fetchPublicationMessages({ apiKey: 'fixture', body,
    fetchFn: async () => { throw Object.assign(new Error('PRIVATE'), { cause: { code: 'UND_ERR_HEADERS_TIMEOUT' } }); },
  }), (err) => err.diagnostics.code === 'UND_ERR_HEADERS_TIMEOUT' && !err.message.includes('PRIVATE'));
});
test('client/orchestrator/exception propagate sanitized failures; max_tokens still rejects', async () => {
  const original = globalThis.fetch;
  const env = { ANTHROPIC_PUBLICATION_EDITOR_API_KEY: 'fixture-private-key' };
  try {
    globalThis.fetch = async () => new Response('PRIVATE body', { status: 401 });
    const result = await runSynthesisPipeline(env, { topic_slug: 'hair-cycle', evidenceBundle: { claims: [], sources: [] }, v1Result: {} });
    assert.equal(result.status, 'SYNTHESIS_FAILED');
    assert.equal(result.diagnostics.http_status, 401);
    assert.equal(result.metrics.calls[0].diagnostics.attempts, 1);
    let issue;
    await surfaceExceptionIfNeeded({ final_state: 'PROVIDER_FAILED', publication_editor_result: { diagnostics: { ...result.diagnostics, detail: 'PRIVATE', request_body: 'PRIVATE', code: 'PRIVATE' } } }, {
      listIssuesFn: async () => [], createIssueFn: async (x) => { issue = x; return x; },
    });
    assert.ok(issue.body.includes('401'));
    assert.ok(!JSON.stringify(issue).includes('PRIVATE'));
    globalThis.fetch = async () => stream(events('max_tokens'));
    assert.equal((await synthesizeTopic(env, { topic_slug: 'hair-cycle', evidenceBundle: { claims: [], sources: [] } })).reason, 'truncated');
  } finally { globalThis.fetch = original; }
});
test('diagnostic allowlist rejects free text and malformed numeric fields', () => {
  assert.deepEqual(sanitizePublicationDiagnostics({ code: 'secret', stage: 'secret', attempts: -1, http_status: 999, elapsed_ms: 'secret', detail: 'secret' }), {});
});

test('native fetch aborts both stalled headers and a stalled streaming body at the bounded deadline', async () => {
  for (const stage of ['headers', 'stream']) {
    const server = createServer((_req, res) => {
      if (stage === 'stream') {
        res.writeHead(200, { 'Content-Type': 'text/event-stream' });
        res.write('event: ping\ndata: {"type":"ping"}\n\n');
      }
      // Intentionally never completes: a genuine local socket, no provider.
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const nativeFetch = globalThis.fetch;
      await assert.rejects(fetchPublicationMessages({ apiKey: 'fixture', body, timeoutMs: 100,
        fetchFn: (_url, init) => nativeFetch(`http://127.0.0.1:${server.address().port}`, init),
      }), (err) => err.diagnostics.code === 'REQUEST_TIMEOUT' && err.diagnostics.stage === stage && err.diagnostics.attempts === 1);
    } finally {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
  }
});
