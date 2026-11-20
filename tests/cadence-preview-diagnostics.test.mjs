import assert from 'node:assert/strict';
import test from 'node:test';
import { cadenceFailureCode } from '../functions/_lib/cadence/error-code.mjs';
test('Cadence preview diagnostics classify only safe codes', () => {
 const cases = [
  ['ANTHROPIC_API_KEY not configured', 'KEY_MISSING'],
  ['Cadence request failed (401): {"error":"invalid x-api-key abc123"}', 'KEY_REJECTED'],
  ['Cadence request failed (403): rejected', 'KEY_REJECTED'],
  ['Cadence request failed (402): payment required', 'BILLING'],
  ['Cadence request failed (404): model not found', 'MODEL_UNAVAILABLE'],
  ['Cadence request failed (429): rate limited', 'RATE_LIMIT'],
  ['Cadence request failed (503): provider overloaded', 'PROVIDER_UNAVAILABLE'],
  ['No APPROVED model is registered for CADENCE_CHAT_MODEL in registry', 'MODEL_CONFIGURATION'],
  ['Cadence response was truncated by the token ceiling', 'RESPONSE_TRUNCATED'],
  ['Could not parse raw student prompt and token secret', 'RESPONSE_ERROR'],
 ];
 for (const [error, expected] of cases) {
  const code = cadenceFailureCode(new Error(error));
  assert.equal(code, expected);
  assert.match(code, /^[A-Z_]+$/);
  assert.ok(!code.includes('abc123'));
 }
});
