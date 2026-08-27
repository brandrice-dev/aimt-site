// Cadence thread/message core library + get-thread.js endpoint —
// regression tests. See docs/course-audit/00-cadence-launch-sweep-build-
// contract.md Section 8/13/14.
//
// Run: node tests/cadence-thread-api.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getOrCreateThread, getThreadMessages, appendMessage, findMessageByIdempotencyKey, buildBoundedContext } from '../functions/_lib/cadence/threads.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

// ─────────────────────────────────────────────────────────────────────────
// 1. buildBoundedContext — pure unit tests
// ─────────────────────────────────────────────────────────────────────────
(function boundedContextTests() {
  check('BOUNDED CONTEXT', 'Non-array input returns an empty array rather than throwing', Array.isArray(buildBoundedContext(null)) && buildBoundedContext(null).length === 0);
  const ten = Array.from({ length: 10 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'msg' + i, extraField: 'should not leak' }));
  const bounded = buildBoundedContext(ten);
  check('BOUNDED CONTEXT', 'Default bound caps at 6 most recent messages, not the full history', bounded.length === 6);
  check('BOUNDED CONTEXT', 'Keeps the most recent messages (tail), not the earliest', bounded[bounded.length - 1].content === 'msg9');
  check('BOUNDED CONTEXT', 'Only role/content survive projection (no id/checkpoint_id/grading_metadata leakage into a model prompt)', Object.keys(bounded[0]).sort().join(',') === 'content,role');
  const customBound = buildBoundedContext(ten, { maxMessages: 3 });
  check('BOUNDED CONTEXT', 'A custom maxMessages is honored', customBound.length === 3);
  check('BOUNDED CONTEXT', 'Fewer messages than the bound returns all of them', buildBoundedContext(ten.slice(0, 2)).length === 2);
})();

// ─────────────────────────────────────────────────────────────────────────
// 2. threads.mjs — mocked-transport integration tests
// ─────────────────────────────────────────────────────────────────────────

function buildMockFetch({ threadsStore, messagesStore }) {
  const impl = async (url, options = {}) => {
    const u = String(url);
    const method = (options.method || 'GET').toUpperCase();

    if (u.includes('/rest/v1/cadence_threads')) {
      if (method === 'GET') {
        const userMatch = u.match(/user_id=eq\.([^&]+)/);
        const courseMatch = u.match(/course_slug=eq\.([^&]+)/);
        const moduleMatch = u.match(/module_id=eq\.([^&]+)/);
        const rows = threadsStore.filter((t) =>
          (!userMatch || t.user_id === decodeURIComponent(userMatch[1])) &&
          (!courseMatch || t.course_slug === decodeURIComponent(courseMatch[1])) &&
          (!moduleMatch || t.module_id === decodeURIComponent(moduleMatch[1]))
        );
        return { ok: true, status: 200, json: async () => rows };
      }
      if (method === 'POST') {
        const body = JSON.parse(options.body);
        const dup = threadsStore.find((t) => t.user_id === body.user_id && t.course_slug === body.course_slug && t.module_id === body.module_id);
        if (dup) return { ok: false, status: 409, json: async () => ({ message: 'duplicate key value violates unique constraint' }) };
        const row = { id: 'thread-' + (threadsStore.length + 1), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...body };
        threadsStore.push(row);
        return { ok: true, status: 201, json: async () => [row] };
      }
    }
    if (u.includes('/rest/v1/cadence_messages')) {
      if (method === 'GET') {
        const threadMatch = u.match(/thread_id=eq\.([^&]+)/);
        const idemMatch = u.match(/idempotency_key=eq\.([^&]+)/);
        let rows = messagesStore;
        if (threadMatch) rows = rows.filter((m) => m.thread_id === decodeURIComponent(threadMatch[1]));
        if (idemMatch) rows = rows.filter((m) => m.idempotency_key === decodeURIComponent(idemMatch[1]));
        if (u.includes('order=created_at.asc')) rows = rows.slice().sort((a, b) => a.created_at.localeCompare(b.created_at));
        return { ok: true, status: 200, json: async () => rows };
      }
      if (method === 'POST') {
        const body = JSON.parse(options.body);
        if (body.idempotency_key) {
          const dup = messagesStore.find((m) => m.thread_id === body.thread_id && m.idempotency_key === body.idempotency_key);
          if (dup) return { ok: false, status: 409, json: async () => ({ message: 'duplicate key value violates unique constraint' }) };
        }
        const row = { id: 'msg-' + (messagesStore.length + 1), created_at: new Date(Date.now() + messagesStore.length).toISOString(), ...body };
        messagesStore.push(row);
        return { ok: true, status: 201, json: async () => [row] };
      }
    }
    throw new Error('Unexpected fetch URL in test: ' + u);
  };
  return { impl };
}

async function withMockFetch(mockImpl, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = mockImpl;
  try {
    return await fn();
  } finally {
    globalThis.fetch = original;
  }
}

async function runThreadLibChecks() {
  const env = { SUPABASE_URL: 'https://mock.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'mock-key' };

  // --- Thread uniqueness: one thread per (user, course, module) ---
  {
    const threadsStore = [];
    const messagesStore = [];
    const mock = buildMockFetch({ threadsStore, messagesStore });
    const r1 = await withMockFetch(mock.impl, () => getOrCreateThread(env, { userId: 'user-1', courseSlug: 'headspa-mastery', moduleId: 1 }));
    const r2 = await withMockFetch(mock.impl, () => getOrCreateThread(env, { userId: 'user-1', courseSlug: 'headspa-mastery', moduleId: 1 }));
    check('THREAD UNIQUENESS', 'First call creates a thread', r1.ok && !!r1.thread.id);
    check('THREAD UNIQUENESS', 'A second call for the SAME user/course/module returns the SAME thread, not a new one', r2.ok && r2.thread.id === r1.thread.id);
    check('THREAD UNIQUENESS', 'Only one thread row exists after two calls', threadsStore.length === 1);

    const r3 = await withMockFetch(mock.impl, () => getOrCreateThread(env, { userId: 'user-1', courseSlug: 'headspa-mastery', moduleId: 2 }));
    check('THREAD UNIQUENESS', 'A DIFFERENT module creates a DIFFERENT thread for the same user', r3.ok && r3.thread.id !== r1.thread.id);

    const r4 = await withMockFetch(mock.impl, () => getOrCreateThread(env, { userId: 'user-2', courseSlug: 'headspa-mastery', moduleId: 1 }));
    check('THREAD UNIQUENESS', 'A DIFFERENT user creates a DIFFERENT thread for the same module', r4.ok && r4.thread.id !== r1.thread.id);
  }

  // --- Message ordering ---
  {
    const threadsStore = [];
    const messagesStore = [];
    const mock = buildMockFetch({ threadsStore, messagesStore });
    const { thread } = await withMockFetch(mock.impl, () => getOrCreateThread(env, { userId: 'user-1', courseSlug: 'headspa-mastery', moduleId: 1 }));
    await withMockFetch(mock.impl, () => appendMessage(env, { threadId: thread.id, userId: 'user-1', courseSlug: 'headspa-mastery', role: 'user', mode: 'checkpoint', content: 'first', idempotencyKey: 'k1' }));
    await withMockFetch(mock.impl, () => appendMessage(env, { threadId: thread.id, userId: 'user-1', courseSlug: 'headspa-mastery', role: 'assistant', mode: 'checkpoint', content: 'second', idempotencyKey: 'k1:assistant' }));
    await withMockFetch(mock.impl, () => appendMessage(env, { threadId: thread.id, userId: 'user-1', courseSlug: 'headspa-mastery', role: 'user', mode: 'ask_cadence', content: 'third', idempotencyKey: 'k2' }));
    const fetched = await withMockFetch(mock.impl, () => getThreadMessages(env, thread.id));
    check('MESSAGE ORDERING', 'Messages come back in chronological (created_at ascending) order', fetched.ok && fetched.body.map((m) => m.content).join(',') === 'first,second,third');
  }

  // --- Idempotent send ---
  {
    const threadsStore = [];
    const messagesStore = [];
    const mock = buildMockFetch({ threadsStore, messagesStore });
    const { thread } = await withMockFetch(mock.impl, () => getOrCreateThread(env, { userId: 'user-1', courseSlug: 'headspa-mastery', moduleId: 1 }));
    const first = await withMockFetch(mock.impl, () => appendMessage(env, { threadId: thread.id, userId: 'user-1', courseSlug: 'headspa-mastery', role: 'user', mode: 'checkpoint', content: 'hello', idempotencyKey: 'stable-key' }));
    const second = await withMockFetch(mock.impl, () => appendMessage(env, { threadId: thread.id, userId: 'user-1', courseSlug: 'headspa-mastery', role: 'user', mode: 'checkpoint', content: 'hello', idempotencyKey: 'stable-key' }));
    check('IDEMPOTENT SEND', 'First send is not deduped', first.ok && first.deduped === false);
    check('IDEMPOTENT SEND', 'Second send with the same idempotency key IS deduped, returns the same message', second.ok && second.deduped === true && second.message.id === first.message.id);
    check('IDEMPOTENT SEND', 'Only one message row actually exists', messagesStore.length === 1);

    // A message with NO idempotency key is never deduped (each call inserts).
    const noKey1 = await withMockFetch(mock.impl, () => appendMessage(env, { threadId: thread.id, userId: 'user-1', courseSlug: 'headspa-mastery', role: 'assistant', mode: 'ask_cadence', content: 'reply' }));
    const noKey2 = await withMockFetch(mock.impl, () => appendMessage(env, { threadId: thread.id, userId: 'user-1', courseSlug: 'headspa-mastery', role: 'assistant', mode: 'ask_cadence', content: 'reply' }));
    check('IDEMPOTENT SEND', 'Messages without an idempotency key are not deduped against each other (expected — dedup is opt-in per call site)', noKey1.message.id !== noKey2.message.id);
  }

  // --- Invalid role/mode rejected before any write ---
  {
    const threadsStore = [];
    const messagesStore = [];
    const mock = buildMockFetch({ threadsStore, messagesStore });
    const { thread } = await withMockFetch(mock.impl, () => getOrCreateThread(env, { userId: 'user-1', courseSlug: 'headspa-mastery', moduleId: 1 }));
    const badRole = await withMockFetch(mock.impl, () => appendMessage(env, { threadId: thread.id, userId: 'user-1', courseSlug: 'headspa-mastery', role: 'system', mode: 'checkpoint', content: 'x' }));
    const badMode = await withMockFetch(mock.impl, () => appendMessage(env, { threadId: thread.id, userId: 'user-1', courseSlug: 'headspa-mastery', role: 'user', mode: 'certification', content: 'x' }));
    check('VALIDATION', 'An invalid role is rejected without writing', !badRole.ok && badRole.error === 'invalid_role' && messagesStore.length === 0);
    check('VALIDATION', "mode='certification' is rejected — this table never accepts Module 12 transcripts", !badMode.ok && badMode.error === 'invalid_mode' && messagesStore.length === 0);
  }

  // --- Ask Cadence mode does not touch checkpoint fields ---
  {
    const threadsStore = [];
    const messagesStore = [];
    const mock = buildMockFetch({ threadsStore, messagesStore });
    const { thread } = await withMockFetch(mock.impl, () => getOrCreateThread(env, { userId: 'user-1', courseSlug: 'headspa-mastery', moduleId: 3 }));
    const askMsg = await withMockFetch(mock.impl, () => appendMessage(env, { threadId: thread.id, userId: 'user-1', courseSlug: 'headspa-mastery', role: 'user', mode: 'ask_cadence', content: 'What is the hair growth cycle?' }));
    check('ASK CADENCE ISOLATION', 'An ask_cadence message persists with no checkpoint_id and no grading_metadata', askMsg.ok && askMsg.message.checkpoint_id === null && askMsg.message.grading_metadata === null);
  }
}

await runThreadLibChecks();

// ─────────────────────────────────────────────────────────────────────────
// 3. get-thread.js — real endpoint, mocked transport
// ─────────────────────────────────────────────────────────────────────────

function makeGetRequest({ moduleId, authToken = 'mock-token' } = {}) {
  return {
    url: `https://example.com/api/cadence/get-thread${moduleId !== undefined ? `?moduleId=${moduleId}` : ''}`,
    headers: { get: (name) => (name === 'Authorization' ? `Bearer ${authToken}` : null) },
  };
}

function buildEndpointMockFetch({ threadsStore, messagesStore, entitled = true }) {
  const base = buildMockFetch({ threadsStore, messagesStore }).impl;
  return async (url, options = {}) => {
    const u = String(url);
    if (u.includes('/auth/v1/user')) {
      return { ok: true, status: 200, json: async () => ({ id: 'user-1', email: 'test@example.com' }) };
    }
    if (u.includes('/rest/v1/course_entitlements')) {
      return { ok: true, status: 200, json: async () => (entitled ? [{ checkout_session_id: 'cs_1' }] : []) };
    }
    return base(url, options);
  };
}

async function runGetThreadEndpointChecks() {
  const { onRequestGet } = await import('../functions/api/cadence/get-thread.js');
  const env = { SUPABASE_URL: 'https://mock.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'mock-key' };

  {
    const threadsStore = [];
    const messagesStore = [{ id: 'msg-1', thread_id: 'thread-1', role: 'user', mode: 'checkpoint', content: 'hi', checkpoint_id: 'm1cp1', grading_metadata: { secret: 'rubric-adjacent-evidence' }, created_at: '2026-01-01T00:00:00Z' }];
    threadsStore.push({ id: 'thread-1', user_id: 'user-1', course_slug: 'headspa-mastery', module_id: '1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' });
    const mockFetch = buildEndpointMockFetch({ threadsStore, messagesStore });
    const res = await withMockFetch(mockFetch, () => onRequestGet({ request: makeGetRequest({ moduleId: 1 }), env }));
    const body = await res.json();
    check('GET-THREAD ENDPOINT', 'Returns the thread and its messages', res.status === 200 && body.thread.moduleId === '1' && body.messages.length === 1);
    check('GET-THREAD ENDPOINT', 'grading_metadata (diagnostic/rubric-adjacent) is never exposed in the client-facing message shape', !('grading_metadata' in body.messages[0]) && !('gradingMetadata' in body.messages[0]));
    check('GET-THREAD ENDPOINT', 'Message shape exposes only safe display fields', Object.keys(body.messages[0]).sort().join(',') === 'checkpointId,content,createdAt,id,mode,role');
  }

  {
    const threadsStore = [];
    const messagesStore = [];
    const mockFetch = buildEndpointMockFetch({ threadsStore, messagesStore, entitled: false });
    const res = await withMockFetch(mockFetch, () => onRequestGet({ request: makeGetRequest({ moduleId: 1 }), env }));
    check('GET-THREAD ENDPOINT', 'An unentitled user is rejected', res.status === 403);
  }

  {
    const threadsStore = [];
    const messagesStore = [];
    const mockFetch = buildEndpointMockFetch({ threadsStore, messagesStore });
    const res = await withMockFetch(mockFetch, () => onRequestGet({ request: makeGetRequest({}), env })); // no moduleId
    check('GET-THREAD ENDPOINT', 'A missing moduleId is rejected with 400', res.status === 400);
  }

  // Ownership: a different user's request never sees user-1's thread —
  // simulated by the RLS-shaped mock only ever returning rows matching
  // the authenticated user_id in the WHERE clause the real supabaseRest
  // call constructs (same mechanism the real RLS policy also enforces
  // independently at the database layer — see the live smoke test for the
  // real-RLS version of this check).
  {
    const threadsStore = [{ id: 'thread-owned-by-1', user_id: 'user-1', course_slug: 'headspa-mastery', module_id: '5', created_at: 'x', updated_at: 'x' }];
    const messagesStore = [];
    const mockFetch = async (url, options) => {
      // Force auth to resolve to a DIFFERENT user than the seeded thread's owner.
      if (String(url).includes('/auth/v1/user')) return { ok: true, status: 200, json: async () => ({ id: 'user-2', email: 'other@example.com' }) };
      return buildEndpointMockFetch({ threadsStore, messagesStore })(url, options);
    };
    const res = await withMockFetch(mockFetch, () => onRequestGet({ request: makeGetRequest({ moduleId: 5 }), env }));
    const body = await res.json();
    check('GET-THREAD ENDPOINT', "A different user querying the same module gets their OWN (new, empty) thread, never user-1's", res.status === 200 && body.thread.id !== 'thread-owned-by-1' && body.messages.length === 0);
  }
}

await runGetThreadEndpointChecks();

// ─────────────────────────────────────────────────────────────────────────
// 4. STATIC — migration idempotency-key/RLS shape (the finalized draft)
// ─────────────────────────────────────────────────────────────────────────
(function migrationIdempotencyStatic() {
  const sql = readFileSync(path.join(ROOT, 'supabase/migrations/20260827_create_cadence_threads.sql'), 'utf8');
  check('MIGRATION IDEMPOTENCY', 'cadence_messages has an idempotency_key column', /idempotency_key text/.test(sql));
  check('MIGRATION IDEMPOTENCY', 'A unique partial index enforces (thread_id, idempotency_key) at the database level, not only in application code', /create unique index if not exists cadence_messages_thread_idempotency_key_idx[\s\S]{0,150}\(thread_id, idempotency_key\)[\s\S]{0,30}where idempotency_key is not null/.test(sql));
  check('MIGRATION IDEMPOTENCY', 'The unique index is a partial index (WHERE idempotency_key IS NOT NULL) so rows without one never collide', /where idempotency_key is not null/.test(sql));
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
