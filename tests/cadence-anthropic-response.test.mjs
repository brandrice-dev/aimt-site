// Shared Anthropic response-extraction + checkpoint-evaluation parser —
// regression tests for the Sonnet 5 response-contract fix.
//
// Context: the Sonnet 5 live regression (docs/course-audit/
// cadence-sonnet5-grading-regression.md Section 8) root-caused two related
// production defects: (1) every Anthropic call site assumed
// `content[0].text` -- a leading non-text content block silently produced
// an empty string instead of an error; (2) the checkpoint-grading JSON
// parser used one greedy brace-matching regex that a model's own prose
// around the JSON could corrupt. This file is the deterministic coverage
// for the fix: functions/_lib/cadence/anthropic-response.mjs (the shared
// extractor, now used by Ask Cadence, checkpoint grading, and the
// regression harness) and checkpoint-evaluation.mjs's rewritten
// parseCheckpointEvaluation() (direct JSON.parse -> one fenced-block
// fallback -> fail safe, no regex over arbitrary prose).
//
// Run: node tests/cadence-anthropic-response.test.mjs

import {
  extractAnthropicText,
  extractAnthropicTextSafe,
  AnthropicResponseError,
} from '../functions/_lib/cadence/anthropic-response.mjs';
import {
  parseCheckpointEvaluation,
  decideCheckpointOutcome,
  buildCheckpointEvaluationRecord,
  CHECKPOINT_EVALUATION_JSON_SCHEMA,
} from '../functions/_lib/cadence/checkpoint-evaluation.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

// ─────────────────────────────────────────────────────────────────────────
// 1. extractAnthropicText / extractAnthropicTextSafe — content-block shape
// ─────────────────────────────────────────────────────────────────────────
(function extractionTests() {
  check('EXTRACTION', 'A normal single text-block response extracts correctly',
    extractAnthropicText({ content: [{ type: 'text', text: 'hello' }] }) === 'hello');

  check('EXTRACTION', 'First content block non-text (e.g. a thinking block) — the text block after it is still found, not treated as empty',
    extractAnthropicText({ content: [{ type: 'thinking', thinking: 'internal reasoning' }, { type: 'text', text: 'the answer' }] }) === 'the answer');

  check('EXTRACTION', 'Text block not at index 0 (any position) is found — this is the exact bug the diagnosis found: content[0].text assumed the text block was always first',
    extractAnthropicText({ content: [{ type: 'server_tool_use', id: 'x' }, { type: 'redacted_thinking', data: 'y' }, { type: 'text', text: 'found me' }] }) === 'found me');

  check('EXTRACTION', 'Multiple text blocks are concatenated in order, not truncated to the first',
    extractAnthropicText({ content: [{ type: 'text', text: 'part one. ' }, { type: 'text', text: 'part two.' }] }) === 'part one. part two.');

  check('EXTRACTION', 'A thinking block never contributes its own content to the extracted text — no hidden-reasoning exposure',
    !extractAnthropicText({ content: [{ type: 'thinking', thinking: 'SECRET_REASONING_TOKEN' }, { type: 'text', text: 'visible answer' }] }).includes('SECRET_REASONING_TOKEN'));

  check('EXTRACTION', 'Empty content array throws a typed AnthropicResponseError, not a silent empty string masquerading as success', (() => {
    try { extractAnthropicText({ content: [] }); return false; } catch (e) { return e instanceof AnthropicResponseError && e.code === 'no_text_block'; }
  })());

  check('EXTRACTION', 'Content made entirely of non-text blocks throws the same typed error', (() => {
    try { extractAnthropicText({ content: [{ type: 'thinking', thinking: 'x' }] }); return false; } catch (e) { return e instanceof AnthropicResponseError; }
  })());

  check('EXTRACTION', 'Missing/malformed response.content is handled as "no text", not a raw TypeError', (() => {
    try { extractAnthropicText({}); return false; } catch (e) { return e instanceof AnthropicResponseError; }
  })());

  check('EXTRACTION', 'extractAnthropicTextSafe never throws — returns "" for a textless response (the safe-fallback variant every call site uses)',
    extractAnthropicTextSafe({ content: [{ type: 'thinking', thinking: 'x' }] }) === '');

  check('EXTRACTION', 'extractAnthropicTextSafe returns the real text when present',
    extractAnthropicTextSafe({ content: [{ type: 'text', text: 'ok' }] }) === 'ok');
})();

// ─────────────────────────────────────────────────────────────────────────
// 2. parseCheckpointEvaluation — direct JSON, fenced JSON, prose rejection
// ─────────────────────────────────────────────────────────────────────────
(function parserContractTests() {
  const validPayload = { requiredElementsDemonstrated: ['a', 'b'], requiredElementsMissing: [], unsafeReasoning: false, unsafeReasoningDescription: null, feedback: 'Nice work.' };

  const direct = parseCheckpointEvaluation(JSON.stringify(validPayload));
  check('PARSER CONTRACT', 'Valid direct JSON (the output_config.format-constrained case) parses cleanly, not malformed',
    direct.malformed === false && direct.requiredElementsDemonstrated.length === 2 && direct.feedback === 'Nice work.');

  const fenced = parseCheckpointEvaluation('```json\n' + JSON.stringify(validPayload) + '\n```');
  check('PARSER CONTRACT', 'One cleanly-fenced ```json block parses as a fallback path (e.g. a refusal-fallback model without structured-output support)',
    fenced.malformed === false && fenced.feedback === 'Nice work.');

  const fencedNoLang = parseCheckpointEvaluation('```\n' + JSON.stringify(validPayload) + '\n```');
  check('PARSER CONTRACT', 'A fenced block with no "json" language tag still parses', fencedNoLang.malformed === false);

  const proseBefore = parseCheckpointEvaluation(
    'Let me evaluate this answer. The student demonstrates {some} understanding of the material.\n\n' + JSON.stringify(validPayload)
  );
  check('PARSER CONTRACT', 'Prose preceding the JSON, itself containing a brace (the literal root-caused failure mode) is safely rejected, not corrupted into a wrong parse',
    proseBefore.malformed === true && proseBefore.requiredElementsMissing[0] === 'unparseable-response');
  check('PARSER CONTRACT', 'A parser rejection on ambiguous prose+JSON text can never produce a false PASS',
    decideCheckpointOutcome(proseBefore).decision === 'revise');

  const proseAfter = parseCheckpointEvaluation(
    JSON.stringify(validPayload) + '\n\nI hope this helps! Let me know if you have questions about {anything} else.'
  );
  check('PARSER CONTRACT', 'Trailing prose after the JSON, containing its own brace, is also safely rejected rather than silently consumed by a wider match',
    proseAfter.malformed === true);

  const wrongShape = parseCheckpointEvaluation(JSON.stringify({ requiredElementsDemonstrated: ['a'] }));
  check('PARSER CONTRACT', 'A well-formed JSON object missing required contract fields is rejected, not silently defaulted into a pass-eligible shape',
    wrongShape.malformed === true);

  const empty = parseCheckpointEvaluation('');
  check('PARSER CONTRACT', 'Empty string input is malformed and cannot pass',
    empty.malformed === true && decideCheckpointOutcome(empty).decision === 'revise');

  const record = buildCheckpointEvaluationRecord({ checkpointId: 'm0cp1', rubricVersion: 'rubric-test', rawText: 'not json at all', modelInfo: { modelName: 'claude-sonnet-5' } });
  check('PARSER CONTRACT', 'A malformed structured result flows end-to-end through buildCheckpointEvaluationRecord to a revise decision, never a pass',
    record.decision === 'revise' && record.reason === 'missing_required_elements');
})();

// ─────────────────────────────────────────────────────────────────────────
// 3. JSON Schema shape — sanity check against the documented supported
//    output_config.format subset (no minLength/numeric constraints, no
//    recursive $ref -- see the claude-api skill's Structured Output
//    "JSON Schema Limitations").
// ─────────────────────────────────────────────────────────────────────────
(function schemaShapeTests() {
  check('SCHEMA SHAPE', 'additionalProperties:false is set (required for structured-output object schemas)',
    CHECKPOINT_EVALUATION_JSON_SCHEMA.additionalProperties === false);
  check('SCHEMA SHAPE', 'All five contract fields are declared required',
    ['requiredElementsDemonstrated', 'requiredElementsMissing', 'unsafeReasoning', 'unsafeReasoningDescription', 'feedback']
      .every((f) => CHECKPOINT_EVALUATION_JSON_SCHEMA.required.includes(f)));
  check('SCHEMA SHAPE', 'No unsupported numeric/string-length constraints appear anywhere in the schema',
    !/minLength|maxLength|minimum|maximum|multipleOf/.test(JSON.stringify(CHECKPOINT_EVALUATION_JSON_SCHEMA)));
  check('SCHEMA SHAPE', 'unsafeReasoningDescription is nullable via anyOf (not a bare "null" type, which JSON Schema does not support directly)',
    Array.isArray(CHECKPOINT_EVALUATION_JSON_SCHEMA.properties.unsafeReasoningDescription.anyOf));
})();

// ---- Report ----
const byFixture = new Map();
for (const r of results) {
  if (!byFixture.has(r.fixtureName)) byFixture.set(r.fixtureName, []);
  byFixture.get(r.fixtureName).push(r);
}
let anyFail = false;
for (const [fixtureName, checks] of byFixture) {
  const failed = checks.filter((c) => !c.pass);
  if (failed.length > 0) anyFail = true;
  console.log(`[${failed.length === 0 ? 'PASS' : 'FAIL'}] ${fixtureName} (${checks.length - failed.length}/${checks.length})`);
  for (const f of failed) console.log(`    FAILED: ${f.label}${f.detail ? ' — ' + f.detail : ''}`);
}
console.log(`\nTotal: ${results.length}, Passed: ${results.filter((r) => r.pass).length}, Failed: ${results.filter((r) => !r.pass).length}`);
if (anyFail) process.exitCode = 1;
