import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createPublicationCostControl, estimatedTokenCost } from '../functions/_lib/research/publication-cost-control.mjs';
import { topicAttemptFingerprint, reserveTopicAttempt, topicAttemptHold, FAILURE_COOLDOWN_MS,
  loadTopicAttempt, writeTopicAttempt, loadTopicIntent, writeTopicIntent } from '../scripts/_lib/education-topic-attempts.mjs';
import { fetchPublicationMessages } from '../functions/_lib/research/publication-anthropic-transport.mjs';

test('cost preflight rejects oversized input/output and caps aggregate reserved spend before network', async () => {
  const budget = createPublicationCostControl();
  const body = { model: 'claude-sonnet-5', max_tokens: 64000 };
  budget.reserve(body); budget.reserve(body); budget.reserve(body);
  assert.throws(() => budget.reserve(body), (e) => e.code === 'SPEND_LIMIT');
  assert.throws(() => createPublicationCostControl().reserve({ ...body, max_tokens: 64001 }), (e) => e.code === 'TOKEN_LIMIT');
  let requests = 0;
  await assert.rejects(fetchPublicationMessages({ apiKey: 'fixture', body: { ...body, system: 'x'.repeat(256000) },
    fetchFn: async () => { requests++; throw new Error('should not send'); },
  }), (e) => e.diagnostics.code === 'TOKEN_LIMIT' && e.diagnostics.attempts === 0);
  assert.equal(requests, 0);
});
test('six small requests exhaust request cap; failures retain their spend reservation and unknown usage', () => {
  const budget = createPublicationCostControl();
  for (let i = 0; i < 6; i++) budget.reserve({ model: 'claude-sonnet-5', max_tokens: 100 });
  assert.throws(() => budget.reserve({ model: 'claude-sonnet-5', max_tokens: 100 }), (e) => e.code === 'SPEND_LIMIT');
  budget.recordUsage({ input_tokens: 15718, output_tokens: 799 });
  assert.equal(budget.summary().requests_with_unknown_usage, 5);
  assert.equal(budget.summary().reported_usage_cost_estimate_usd, estimatedTokenCost(15718, 799));
});
test('two unchanged topic attempts survive disk round-trip and crashes; cooldown expiry does not permit indefinite retries', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'publication-attempts-'));
  try {
    const fingerprint = 'a'.repeat(64), now = Date.parse('2026-10-12T12:00:00Z');
    const first = reserveTopicAttempt(null, fingerprint, now);
    writeTopicAttempt(root, 'scalp-microbiome', first);
    const second = reserveTopicAttempt(loadTopicAttempt(root, 'scalp-microbiome'), fingerprint, now);
    writeTopicAttempt(root, 'scalp-microbiome', second);
    const restored = loadTopicAttempt(root, 'scalp-microbiome');
    assert.equal(restored.cumulative_attempt_budget_usd, 4);
    assert.equal(topicAttemptHold(restored, fingerprint, now), 'TOPIC_FAILURE_COOLDOWN');
    assert.equal(topicAttemptHold(restored, fingerprint, now + FAILURE_COOLDOWN_MS), 'UNCHANGED_TOPIC_ATTEMPT_LIMIT');
    assert.throws(() => reserveTopicAttempt(restored, fingerprint, now + FAILURE_COOLDOWN_MS));
    assert.equal(reserveTopicAttempt(restored, 'b'.repeat(64), now).attempts, 1);
    assert.equal(topicAttemptHold({ ...restored, state: 'SHADOW_CANDIDATE_READY' }, fingerprint, now), null);
    assert.throws(() => reserveTopicAttempt({ ...restored, state: 'SHADOW_CANDIDATE_READY' }, fingerprint, now));
    writeFileSync(path.join(root, 'scalp-microbiome', 'attempts.json'), '{broken');
    assert.throws(() => loadTopicAttempt(root, 'scalp-microbiome'));
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('evidence fingerprint is order independent but changes for real claim wording, contradictions, source metadata or scope', () => {
  const concept = { topic_slug: 'fixture', controlled_topics: ['fixture'] };
  const evidence = { claims: [{ claim_id: 'a', claim_text: 'Fixture', direction: 'supports_effect' }, { claim_id: 'b' }], sources: [{ source_id: 's', title: 'Fixture source' }] };
  const hash = topicAttemptFingerprint(concept, evidence);
  assert.equal(topicAttemptFingerprint(concept, { ...evidence, claims: [...evidence.claims].reverse() }), hash);
  for (const mutate of [
    (x) => { x.claims[0].claim_text = 'Changed'; },
    (x) => { x.claims[0].direction = 'no_effect'; },
    (x) => { x.sources[0].title = 'Changed'; },
  ]) {
    const changed = structuredClone(evidence); mutate(changed);
    assert.notEqual(topicAttemptFingerprint(concept, changed), hash);
  }
  assert.notEqual(topicAttemptFingerprint({ ...concept, controlled_topics: ['other'] }, evidence), hash);
});
test('completed intent is durably reusable only against its exact evidence/scope fingerprint', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'publication-intent-'));
  try {
    const plan = { topic_slug: 'scalp-microbiome', public_intent: 'Fixture intent' };
    writeTopicIntent(root, 'scalp-microbiome', 'a'.repeat(64), plan);
    assert.deepEqual(loadTopicIntent(root, 'scalp-microbiome', 'a'.repeat(64)), plan);
    assert.equal(loadTopicIntent(root, 'scalp-microbiome', 'b'.repeat(64)), null);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
