// Reuses the existing durable candidate artifact directory; no database.
// Crash-safe attempt reservation occurs BEFORE any model request.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import path from 'node:path';
import { PUBLICATION_ATTEMPT_BUDGET_USD } from '../../functions/_lib/research/publication-cost-control.mjs';

export const MAX_UNCHANGED_TOPIC_ATTEMPTS = 2;
export const FAILURE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((k) => [k, canonical(value[k])]));
  return value;
}
export function topicAttemptFingerprint(concept, evidence) {
  return createHash('sha256').update(JSON.stringify(canonical({ concept,
    claims: [...evidence.claims].sort((a, b) => a.claim_id.localeCompare(b.claim_id)),
    sources: [...evidence.sources].sort((a, b) => a.source_id.localeCompare(b.source_id)),
  }))).digest('hex');
}
export function topicAttemptHold(record, fingerprint, now = Date.now()) {
  if (!record || record.fingerprint !== fingerprint) return null;
  // A completed candidate may be revalidated/reused without a model call.
  if (record.state === 'SHADOW_CANDIDATE_READY') return null;
  if (record.attempts >= MAX_UNCHANGED_TOPIC_ATTEMPTS) {
    return now < Date.parse(record.cooldown_until) ? 'TOPIC_FAILURE_COOLDOWN' : 'UNCHANGED_TOPIC_ATTEMPT_LIMIT';
  }
  return null;
}
export function reserveTopicAttempt(previous, fingerprint, now = Date.now()) {
  const hold = topicAttemptHold(previous, fingerprint, now);
  if (hold) throw new Error(hold);
  if (previous?.fingerprint === fingerprint && previous.attempts >= MAX_UNCHANGED_TOPIC_ATTEMPTS) throw new Error('UNCHANGED_TOPIC_ATTEMPT_LIMIT');
  const attempts = previous?.fingerprint === fingerprint ? previous.attempts + 1 : 1;
  return { version: 'education-topic-attempt-v1', fingerprint, attempts,
    started_at: new Date(now).toISOString(), state: 'STARTED',
    cooldown_until: attempts >= MAX_UNCHANGED_TOPIC_ATTEMPTS ? new Date(now + FAILURE_COOLDOWN_MS).toISOString() : null,
    cumulative_attempt_budget_usd: attempts * PUBLICATION_ATTEMPT_BUDGET_USD };
}
function location(root, slug) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error('Invalid topic slug for attempt record.');
  return path.join(root, slug, 'attempts.json');
}
export function loadTopicAttempt(root, slug) {
  const file = location(root, slug);
  if (!existsSync(file)) return null;
  const record = JSON.parse(readFileSync(file, 'utf8'));
  if (record.version !== 'education-topic-attempt-v1' || !/^[a-f0-9]{64}$/.test(record.fingerprint)
    || !Number.isSafeInteger(record.attempts) || record.attempts < 1
    || (record.attempts >= 2 && !Number.isFinite(Date.parse(record.cooldown_until)))) throw new Error('Invalid durable topic attempt record.');
  return record;
}
export function writeTopicAttempt(root, slug, record) {
  const file = location(root, slug);
  mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  writeFileSync(temp, JSON.stringify(record, null, 2));
  renameSync(temp, file);
}

export function loadTopicIntent(root, slug, fingerprint) {
  const file = location(root, slug).replace(/attempts\.json$/, 'intent.json');
  if (!existsSync(file)) return null;
  const stored = JSON.parse(readFileSync(file, 'utf8'));
  if (stored.version !== 'education-topic-intent-v1') throw new Error('Invalid durable intent record.');
  return stored.fingerprint === fingerprint ? stored.intent_plan : null;
}
export function writeTopicIntent(root, slug, fingerprint, intentPlan) {
  const file = location(root, slug).replace(/attempts\.json$/, 'intent.json');
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(`${file}.tmp`, JSON.stringify({ version: 'education-topic-intent-v1', fingerprint, intent_plan: intentPlan }, null, 2));
  renameSync(`${file}.tmp`, file);
}
