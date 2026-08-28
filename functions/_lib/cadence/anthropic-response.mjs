// Shared Anthropic Messages API response-text extraction.
//
// Every Cadence Anthropic call site (Ask Cadence, Module 0-11 checkpoint
// grading, and the model-regression harness) previously extracted reply
// text with `data.content[0].text` -- assuming the first content block is
// always the text block. That assumption silently breaks whenever the
// response contains any other block type before the text block: index 0
// is not type 'text', `.text` is undefined, and every call site's `|| ''`
// fallback swallowed it into an empty string rather than an error. This
// module is the one place that extraction now happens, so a fix here
// fixes every caller at once.
//
// Module 12 certification grading (functions/_lib/certification/
// cadence-grader.mjs) has the identical bug shape but is deliberately not
// migrated to this helper in this change -- Module 12 is out of scope for
// this task by explicit instruction. See docs/course-audit for the tracked
// follow-up.

export class AnthropicResponseError extends Error {
  constructor(message, { code } = {}) {
    super(message);
    this.name = 'AnthropicResponseError';
    this.code = code || 'unknown';
  }
}

/**
 * Concatenates every `type: 'text'` content block from an Anthropic
 * Messages API response, in the order they appear -- never assumes the
 * text block sits at any particular index. A leading non-text block
 * (thinking, a server-tool block, or anything else) is skipped, not
 * mistaken for an empty response, and a response with multiple text
 * blocks is joined rather than truncated to the first.
 *
 * Never inspects or returns the contents of non-text blocks: this
 * function does not read thinking-block text under any circumstance,
 * and never forwards a provider-internal block shape to a caller that
 * might expose it to the browser.
 *
 * @param {{content?: Array<{type: string, text?: string}>}} response
 * @returns {string} concatenated text
 * @throws {AnthropicResponseError} if the response has no text block at all
 */
export function extractAnthropicText(response) {
  const blocks = Array.isArray(response && response.content) ? response.content : [];
  const textBlocks = blocks.filter((b) => b && b.type === 'text' && typeof b.text === 'string');
  if (!textBlocks.length) {
    throw new AnthropicResponseError('Anthropic response contained no text content block.', { code: 'no_text_block' });
  }
  return textBlocks.map((b) => b.text).join('');
}

/**
 * Same extraction, but never throws -- returns '' for a textless response.
 * Callers that already treat an empty/malformed response as a safe
 * fail-state (e.g. checkpoint grading's parseCheckpointEvaluation, which
 * turns '' into a revise-only malformed record) should use this instead
 * of wrapping extractAnthropicText in their own try/catch.
 *
 * @param {{content?: Array<{type: string, text?: string}>}} response
 * @returns {string}
 */
export function extractAnthropicTextSafe(response) {
  try {
    return extractAnthropicText(response);
  } catch (_) {
    return '';
  }
}

// Transient, retry-worthy provider/infrastructure failures. Deliberately
// excludes 4xx (400/401/403/404/...) -- a bad request or bad credential
// will not succeed on retry, so those fail on the first attempt instead of
// wasting latency and spend on a loop that can't help. Root-caused by a
// live Sonnet 5 sentinel run: 1 of 17 live calls returned 503 "credential
// validation failed" while every surrounding call on the same key
// succeeded -- a transient blip, not a real auth problem.
const RETRYABLE_STATUS = new Set([500, 502, 503, 504, 529]);

export class AnthropicRequestError extends Error {
  constructor(message, { status, retryable } = {}) {
    super(message);
    this.name = 'AnthropicRequestError';
    this.status = status || null;
    this.retryable = !!retryable;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * POSTs to the Anthropic Messages API with a small, bounded retry for
 * transient infrastructure failures. Up to `maxRetries` additional
 * attempts (default 2 -- 3 attempts total) on a retryable 5xx-class
 * status or a network-level failure, with a short linear backoff plus
 * jitter between attempts (never exponential/long-running -- this sits on
 * a synchronous request path a student is waiting on). A non-retryable
 * status (4xx, including 401/403) throws immediately on the first
 * attempt -- fail fast, no loop.
 *
 * This retries the upstream HTTP call only, inside one logical evaluation
 * -- it never re-sends the student's message, never re-derives a new
 * idempotency identity, and never decides pass/revise itself. Callers
 * remain responsible for what happens once this resolves or throws.
 *
 * @returns {Promise<object>} the parsed JSON response body on success
 * @throws {AnthropicRequestError} once retries are exhausted or the
 *   failure is not retryable
 */
export async function fetchAnthropicMessages({ apiKey, body, maxRetries = 2, baseDelayMs = 250 }) {
  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let res;
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (networkErr) {
      lastError = new AnthropicRequestError(`Anthropic request failed (network): ${String(networkErr.message || networkErr)}`, { retryable: true });
      if (attempt < maxRetries) {
        await delay(baseDelayMs * (attempt + 1) + Math.random() * baseDelayMs);
        continue;
      }
      throw lastError;
    }

    if (res.ok) return res.json();

    const status = res.status;
    const errBody = await res.text().catch(() => '');
    const retryable = RETRYABLE_STATUS.has(status);
    lastError = new AnthropicRequestError(`Anthropic request failed (${status}): ${errBody.slice(0, 300)}`, { status, retryable });

    if (!retryable || attempt >= maxRetries) throw lastError;
    await delay(baseDelayMs * (attempt + 1) + Math.random() * baseDelayMs);
  }
  throw lastError;
}
