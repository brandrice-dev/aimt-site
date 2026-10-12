import { createPublicationCostControl } from './publication-cost-control.mjs';
// Publication-only transport. Streaming avoids an idle non-streaming
// connection while retaining the COMPLETE structured response for validation.
// Never logs request content, provider bodies, thinking, or arbitrary errors.
export const PUBLICATION_REQUEST_TIMEOUT_MS = 8 * 60 * 1000;
const RETRYABLE = new Set([429, 500, 502, 503, 504, 529]);
const CODES = new Set(['UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT',
  'UND_ERR_CONNECT_TIMEOUT', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND',
  'REQUEST_TIMEOUT', 'HTTP_ERROR', 'NETWORK_ERROR', 'STREAM_ERROR',
  'INCOMPLETE_STREAM', 'INVALID_STREAM', 'RESPONSE_TOO_LARGE', 'TOKEN_LIMIT', 'SPEND_LIMIT']);
const STAGES = new Set(['headers', 'stream', 'complete']);

// Explicit allowlist at every reporting boundary; no arbitrary string fields.
export function sanitizePublicationDiagnostics(value) {
  if (!value || typeof value !== 'object') return null;
  const result = {};
  for (const key of ['attempts', 'elapsed_ms', 'request_bytes', 'max_tokens', 'claim_count', 'source_count']) {
    if (Number.isSafeInteger(value[key]) && value[key] >= 0) result[key] = value[key];
  }
  if (Number.isInteger(value.http_status) && value.http_status >= 100 && value.http_status <= 599) result.http_status = value.http_status;
  if (value.model === 'claude-sonnet-5') result.model = value.model;
  if (typeof value.request_id === 'string' && /^req_[a-zA-Z0-9]{10,80}$/.test(value.request_id)) result.request_id = value.request_id;
  if (CODES.has(value.code)) result.code = value.code;
  if (STAGES.has(value.stage)) result.stage = value.stage;
  return result;
}

class PublicationRequestError extends Error {
  constructor(diagnostics) {
    super('Publication provider request failed; see sanitized diagnostics.');
    this.name = 'PublicationRequestError';
    this.diagnostics = sanitizePublicationDiagnostics(diagnostics);
  }
}

// Handles fragmented UTF-8, CRLF, pings, thinking blocks, multiple text blocks,
// and cumulative usage. Partial text is NEVER returned as a completed message.
async function readMessageStream(response) {
  if (!response.body) throw Object.assign(new Error(), { code: 'INCOMPLETE_STREAM' });
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '', bytes = 0, message = null, deltaSeen = false, stopped = false;
  const blocks = new Map();
  function frame(raw) {
    const data = raw.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trimStart()).join('\n');
    if (!data) return;
    let event;
    try { event = JSON.parse(data); } catch { throw Object.assign(new Error(), { code: 'INVALID_STREAM' }); }
    if (stopped) throw Object.assign(new Error(), { code: 'INVALID_STREAM' });
    switch (event.type) {
      case 'error': throw Object.assign(new Error(), { code: 'STREAM_ERROR' });
      case 'message_start':
        if (message || !event.message) throw Object.assign(new Error(), { code: 'INVALID_STREAM' });
        message = { content: [], usage: event.message.usage || {}, stop_reason: null };
        break;
      case 'content_block_start': {
        if (!message || !Number.isInteger(event.index) || event.index < 0 || blocks.has(event.index)) throw Object.assign(new Error(), { code: 'INVALID_STREAM' });
        const text = event.content_block?.type === 'text';
        blocks.set(event.index, { text, value: text ? event.content_block.text || '' : '', closed: false });
        break;
      }
      case 'content_block_delta': {
        const block = blocks.get(event.index);
        if (!block || block.closed) throw Object.assign(new Error(), { code: 'INVALID_STREAM' });
        if (event.delta?.type === 'text_delta') {
          if (!block.text || typeof event.delta.text !== 'string') throw Object.assign(new Error(), { code: 'INVALID_STREAM' });
          block.value += event.delta.text;
        }
        // Thinking/signatures are deliberately not accumulated.
        break;
      }
      case 'content_block_stop': {
        const block = blocks.get(event.index);
        if (!block || block.closed) throw Object.assign(new Error(), { code: 'INVALID_STREAM' });
        block.closed = true;
        break;
      }
      case 'message_delta':
        if (!message) throw Object.assign(new Error(), { code: 'INVALID_STREAM' });
        message.stop_reason = event.delta?.stop_reason ?? message.stop_reason;
        message.usage = { ...message.usage, ...event.usage };
        deltaSeen = true;
        break;
      case 'message_stop':
        if (!message || !deltaSeen || !message.stop_reason || [...blocks.values()].some((b) => !b.closed)) throw Object.assign(new Error(), { code: 'INCOMPLETE_STREAM' });
        stopped = true;
        break;
      // Pings and future event types do not change message completeness.
    }
  }
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 16 * 1024 * 1024) throw Object.assign(new Error(), { code: 'RESPONSE_TOO_LARGE' });
      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, '\n');
      let end;
      while ((end = buffer.indexOf('\n\n')) >= 0) {
        frame(buffer.slice(0, end));
        buffer = buffer.slice(end + 2);
      }
      if (stopped) break;
    }
    if (!stopped) throw Object.assign(new Error(), { code: 'INCOMPLETE_STREAM' });
    message.content = [...blocks.entries()].sort(([a], [b]) => a - b)
      .filter(([, b]) => b.text).map(([, b]) => ({ type: 'text', text: b.value }));
    return message;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function fetchPublicationMessages({ apiKey, body, fetchFn = fetch,
  timeoutMs = PUBLICATION_REQUEST_TIMEOUT_MS, maxRetries = 0, baseDelayMs = 250, costControl = createPublicationCostControl() }) {
  const started = Date.now();
  const serialized = JSON.stringify({ ...body, stream: true });
  const diagnostic = { attempts: 0, request_bytes: new TextEncoder().encode(serialized).length,
    model: body.model, max_tokens: body.max_tokens, stage: 'headers' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      costControl.reserve({ ...body, stream: true });
      diagnostic.attempts++;
      diagnostic.stage = 'headers';
      const response = await fetchFn('https://api.anthropic.com/v1/messages', {
        method: 'POST', redirect: 'error', signal: controller.signal,
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: serialized,
      });
      diagnostic.http_status = response.status;
      diagnostic.request_id = response.headers.get('request-id');
      if (!response.ok) {
        await response.body?.cancel().catch(() => {});
        if (RETRYABLE.has(response.status) && attempt < maxRetries && !controller.signal.aborted) {
          await new Promise((resolve) => setTimeout(resolve, baseDelayMs * (attempt + 1)));
          continue;
        }
        throw Object.assign(new Error(), { code: 'HTTP_ERROR' });
      }
      diagnostic.stage = 'stream';
      const data = await readMessageStream(response);
      costControl.recordUsage(data.usage);
      diagnostic.stage = 'complete';
      diagnostic.elapsed_ms = Date.now() - started;
      return { data, diagnostics: sanitizePublicationDiagnostics(diagnostic) };
    }
  } catch (err) {
    // No retry after network ambiguity or a partial stream: a timed-out
    // generation may still incur provider spend. HTTP retries alone are bounded.
    diagnostic.code = controller.signal.aborted ? 'REQUEST_TIMEOUT'
      : CODES.has(err?.code) ? err.code
      : CODES.has(err?.cause?.code) ? err.cause.code : 'NETWORK_ERROR';
    diagnostic.elapsed_ms = Date.now() - started;
    throw new PublicationRequestError(diagnostic);
  } finally {
    clearTimeout(timer);
  }
}
