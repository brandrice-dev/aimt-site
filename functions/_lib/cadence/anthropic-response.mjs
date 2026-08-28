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
