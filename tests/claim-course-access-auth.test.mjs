// P0-2 entitlement hardening — functions/api/claim-course-access.js.
//
// Prior behavior: the endpoint trusted a client-supplied `userId` in the
// request body with zero bearer-token verification. Anyone who observed a
// real, paid Stripe checkout session ID belonging to someone else (shared-
// device browser history, a leaked success.html link) could bind that
// stranger's entitlement to any account of their choosing, since
// upsertEntitlement()'s on_conflict=checkout_session_id / merge-duplicates
// semantics make the last caller's `userId` win.
//
// Fix: the authorized identity is now derived exclusively from a verified
// Supabase session token (resolveUser(), the same helper every other
// entitlement-gated endpoint in this codebase already uses), and the claim
// is additionally bound to the purchase by requiring the authenticated
// caller's own email to match the checkout session's Stripe-verified email.
// `userId` was removed from the request contract entirely.
//
// Run: node tests/claim-course-access-auth.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
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

function makePostRequest(body, authToken) {
  return {
    headers: { get: (name) => (name === 'Authorization' && authToken ? `Bearer ${authToken}` : null) },
    json: async () => body,
  };
}

function buildMockEnv(overrides = {}) {
  return {
    STRIPE_SECRET_KEY: 'sk_test_mock',
    STRIPE_PRICE_ID: 'price_headspa_mastery',
    SUPABASE_URL: 'https://mock.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role-key-should-never-leak',
    ...overrides,
  };
}

// users: { [token]: { id, email } }
// stripeSessions: { [sessionId]: { id, payment_status, status, customer_details: {email}, priceId } }
function buildMockFetch({ users, stripeSessions, entitlementsStore, capture = {} }) {
  return async (url, options = {}) => {
    const u = String(url);
    const method = (options.method || 'GET').toUpperCase();
    const headers = options.headers || {};
    capture.calls = capture.calls || [];
    capture.calls.push(u);

    if (u.includes('/auth/v1/user')) {
      const authHeader = headers.Authorization || headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      const user = users[token];
      if (!user) return { ok: false, status: 401, json: async () => ({ error: 'invalid_or_expired_token' }) };
      return { ok: true, status: 200, json: async () => user };
    }

    if (u.includes('api.stripe.com/v1/checkout/sessions/') && u.includes('/line_items')) {
      const sessionId = decodeURIComponent(u.split('/checkout/sessions/')[1].split('/line_items')[0]);
      const session = stripeSessions[sessionId];
      if (!session) return { ok: false, status: 404, json: async () => ({ error: { message: 'No such checkout session' } }) };
      const items = session.priceId ? [{ price: { id: session.priceId } }] : [];
      return { ok: true, status: 200, json: async () => ({ data: items }) };
    }

    if (u.includes('api.stripe.com/v1/checkout/sessions/')) {
      const sessionId = decodeURIComponent(u.split('/checkout/sessions/')[1]);
      const session = stripeSessions[sessionId];
      if (!session) return { ok: false, status: 404, json: async () => ({ error: { message: 'No such checkout session' } }) };
      return { ok: true, status: 200, json: async () => session };
    }

    if (u.includes('/rest/v1/course_entitlements')) {
      if (method === 'POST') {
        const body = JSON.parse(options.body);
        capture.lastUpsert = body;
        const idx = entitlementsStore.findIndex((e) => e.checkout_session_id === body.checkout_session_id);
        if (idx >= 0) entitlementsStore[idx] = { ...entitlementsStore[idx], ...body };
        else entitlementsStore.push({ ...body });
        return { ok: true, status: 201, json: async () => [] };
      }
    }

    if (u.includes('/rest/v1/aimt_logs')) {
      capture.lastLog = JSON.parse(options.body || '{}');
      return { ok: true, status: 201, json: async () => [] };
    }

    throw new Error('Unexpected fetch URL in test: ' + u);
  };
}

function paidSession({ id, email, priceId = 'price_headspa_mastery' }) {
  return {
    id,
    payment_status: 'paid',
    status: 'complete',
    customer_details: { email },
    priceId,
  };
}

async function collectResponseBody(res) {
  const clone = res.clone ? res.clone() : res;
  return clone.json().catch(() => ({}));
}

async function runChecks() {
  const { onRequestPost } = await import('../functions/api/claim-course-access.js');
  const env = buildMockEnv();

  const USER_A = { id: 'user-aaaa', email: 'alice@example.com' };
  const USER_B = { id: 'user-bbbb', email: 'bob@example.com' };
  const TOKEN_A = 'token-alice';
  const TOKEN_B = 'token-bob';

  // A. Unauthenticated claim rejected
  {
    const entitlementsStore = [];
    const stripeSessions = { cs_alice_1: paidSession({ id: 'cs_alice_1', email: USER_A.email }) };
    const mock = buildMockFetch({ users: { [TOKEN_A]: USER_A }, stripeSessions, entitlementsStore });
    const res = await withMockFetch(mock, () =>
      onRequestPost({ request: makePostRequest({ sessionId: 'cs_alice_1', email: USER_A.email }, null), env })
    );
    check('A. UNAUTHENTICATED', 'A request with no Authorization header is rejected 401', res.status === 401);
    check('A. UNAUTHENTICATED', 'No entitlement row is written', entitlementsStore.length === 0);
  }

  // B. Invalid/expired token rejected
  {
    const entitlementsStore = [];
    const stripeSessions = { cs_alice_2: paidSession({ id: 'cs_alice_2', email: USER_A.email }) };
    const mock = buildMockFetch({ users: { [TOKEN_A]: USER_A }, stripeSessions, entitlementsStore });
    const res = await withMockFetch(mock, () =>
      onRequestPost({ request: makePostRequest({ sessionId: 'cs_alice_2', email: USER_A.email }, 'garbage-expired-token'), env })
    );
    check('B. INVALID TOKEN', 'A malformed/expired bearer token is rejected 401', res.status === 401);
    check('B. INVALID TOKEN', 'No entitlement row is written', entitlementsStore.length === 0);
  }

  // C + D. Authenticated identity derived server-side; client userId cannot override it
  {
    const entitlementsStore = [];
    const stripeSessions = { cs_alice_3: paidSession({ id: 'cs_alice_3', email: USER_A.email }) };
    const capture = {};
    const mock = buildMockFetch({ users: { [TOKEN_A]: USER_A }, stripeSessions, entitlementsStore, capture });
    const res = await withMockFetch(mock, () =>
      onRequestPost({
        request: makePostRequest({ sessionId: 'cs_alice_3', email: USER_A.email, userId: 'attacker-chosen-uuid' }, TOKEN_A),
        env,
      })
    );
    check('C+D. SERVER-DERIVED IDENTITY', 'A valid authenticated claim for the caller\'s own purchase succeeds (200)', res.status === 200);
    check('C+D. SERVER-DERIVED IDENTITY', 'The written entitlement user_id is the authenticated subject, never the client-supplied userId', capture.lastUpsert && capture.lastUpsert.user_id === USER_A.id);
    check('C+D. SERVER-DERIVED IDENTITY', 'The attacker-chosen client userId never reaches the entitlement row', capture.lastUpsert && capture.lastUpsert.user_id !== 'attacker-chosen-uuid');
  }

  // E. User A cannot grant User B access (cross-account claim via a leaked/observed session id)
  {
    const entitlementsStore = [{ checkout_session_id: 'cs_bob_1', course_slug: 'headspa-mastery', purchaser_email: USER_B.email, user_id: null }];
    const stripeSessions = { cs_bob_1: paidSession({ id: 'cs_bob_1', email: USER_B.email }) };
    const capture = {};
    const mock = buildMockFetch({ users: { [TOKEN_A]: USER_A, [TOKEN_B]: USER_B }, stripeSessions, entitlementsStore, capture });

    // A sends B's userId (now meaningless/ignored) while authenticated as herself, targeting B's session
    const res1 = await withMockFetch(mock, () =>
      onRequestPost({ request: makePostRequest({ sessionId: 'cs_bob_1', userId: USER_B.id }, TOKEN_A), env })
    );
    check('E. CROSS-ACCOUNT', 'A authenticated, targeting B\'s paid session, is rejected (403 purchase mismatch)', res1.status === 403);

    // A omits userId/email entirely, still targeting B's session
    const res2 = await withMockFetch(mock, () =>
      onRequestPost({ request: makePostRequest({ sessionId: 'cs_bob_1' }, TOKEN_A), env })
    );
    check('E. CROSS-ACCOUNT', 'A authenticated, omitting all identity hints, targeting B\'s session, is still rejected (403)', res2.status === 403);

    check('E. CROSS-ACCOUNT', 'B\'s pre-existing entitlement row is untouched by A\'s attempts', entitlementsStore.length === 1 && entitlementsStore[0].user_id === null && entitlementsStore[0].purchaser_email === USER_B.email);
  }

  // F. Valid completed purchase grants access to the authenticated owner (happy path)
  {
    const entitlementsStore = [];
    const stripeSessions = { cs_bob_2: paidSession({ id: 'cs_bob_2', email: USER_B.email }) };
    const capture = {};
    const mock = buildMockFetch({ users: { [TOKEN_B]: USER_B }, stripeSessions, entitlementsStore, capture });
    const res = await withMockFetch(mock, () =>
      onRequestPost({ request: makePostRequest({ sessionId: 'cs_bob_2', email: USER_B.email }, TOKEN_B), env })
    );
    const body = await collectResponseBody(res);
    check('F. HAPPY PATH', 'The rightful, authenticated purchaser can claim their own course access', res.status === 200 && body.ok === true);
    check('F. HAPPY PATH', 'The entitlement is written with the correct user_id and email', entitlementsStore.length === 1 && entitlementsStore[0].user_id === USER_B.id && entitlementsStore[0].purchaser_email === USER_B.email);
  }

  // F-variant. Email match is case-insensitive (Stripe/Supabase casing differences)
  {
    const entitlementsStore = [];
    const stripeSessions = { cs_alice_case: paidSession({ id: 'cs_alice_case', email: 'Alice@Example.com' }) };
    const mock = buildMockFetch({ users: { [TOKEN_A]: USER_A }, stripeSessions, entitlementsStore });
    const res = await withMockFetch(mock, () =>
      onRequestPost({ request: makePostRequest({ sessionId: 'cs_alice_case' }, TOKEN_A), env })
    );
    check('F. HAPPY PATH', 'Purchaser-email match is case-insensitive', res.status === 200);
  }

  // G. Invalid/unpaid purchase cannot grant access
  {
    const entitlementsStore = [];
    const stripeSessions = { cs_unpaid: { id: 'cs_unpaid', payment_status: 'unpaid', status: 'open', customer_details: { email: USER_A.email }, priceId: 'price_headspa_mastery' } };
    const mock = buildMockFetch({ users: { [TOKEN_A]: USER_A }, stripeSessions, entitlementsStore });
    const res = await withMockFetch(mock, () =>
      onRequestPost({ request: makePostRequest({ sessionId: 'cs_unpaid' }, TOKEN_A), env })
    );
    check('G. UNPAID PURCHASE', 'An unpaid/incomplete checkout session is rejected (400)', res.status === 400);
    check('G. UNPAID PURCHASE', 'No entitlement row is written for an unpaid session', entitlementsStore.length === 0);
  }

  // H. Wrong course/price cannot grant access
  {
    const entitlementsStore = [];
    const stripeSessions = { cs_wrong_price: paidSession({ id: 'cs_wrong_price', email: USER_A.email, priceId: 'price_some_other_product' }) };
    const mock = buildMockFetch({ users: { [TOKEN_A]: USER_A }, stripeSessions, entitlementsStore });
    const res = await withMockFetch(mock, () =>
      onRequestPost({ request: makePostRequest({ sessionId: 'cs_wrong_price' }, TOKEN_A), env })
    );
    check('H. WRONG PRICE', 'A session that paid for a different price/product is rejected (400)', res.status === 400);
    check('H. WRONG PRICE', 'No entitlement row is written for a mismatched price', entitlementsStore.length === 0);
  }

  // I. Duplicate/replay claim is idempotent
  {
    const entitlementsStore = [];
    const stripeSessions = { cs_alice_dup: paidSession({ id: 'cs_alice_dup', email: USER_A.email }) };
    const mock = buildMockFetch({ users: { [TOKEN_A]: USER_A }, stripeSessions, entitlementsStore });
    const res1 = await withMockFetch(mock, () =>
      onRequestPost({ request: makePostRequest({ sessionId: 'cs_alice_dup' }, TOKEN_A), env })
    );
    const res2 = await withMockFetch(mock, () =>
      onRequestPost({ request: makePostRequest({ sessionId: 'cs_alice_dup' }, TOKEN_A), env })
    );
    check('I. IDEMPOTENCY', 'Both the original and retried claim succeed', res1.status === 200 && res2.status === 200);
    check('I. IDEMPOTENCY', 'Exactly one entitlement row exists after a duplicate/retried claim (no corruption)', entitlementsStore.length === 1);
    check('I. IDEMPOTENCY', 'The row still carries the correct owner after the retry', entitlementsStore[0].user_id === USER_A.id);
  }

  // J. Existing legitimate entitlement remains intact when an unrelated claim is rejected
  {
    const entitlementsStore = [{ checkout_session_id: 'cs_bob_existing', course_slug: 'headspa-mastery', purchaser_email: USER_B.email, user_id: USER_B.id }];
    const stripeSessions = {
      cs_bob_existing: paidSession({ id: 'cs_bob_existing', email: USER_B.email }),
      cs_alice_unrelated: { id: 'cs_alice_unrelated', payment_status: 'unpaid', status: 'open', customer_details: { email: USER_A.email }, priceId: 'price_headspa_mastery' },
    };
    const mock = buildMockFetch({ users: { [TOKEN_A]: USER_A, [TOKEN_B]: USER_B }, stripeSessions, entitlementsStore });
    await withMockFetch(mock, () =>
      onRequestPost({ request: makePostRequest({ sessionId: 'cs_alice_unrelated' }, TOKEN_A), env })
    );
    check('J. EXISTING ENTITLEMENT INTACT', 'B\'s pre-existing, unrelated entitlement is unaffected by an unrelated rejected claim', entitlementsStore.length === 1 && entitlementsStore[0].user_id === USER_B.id);
  }

  // K. Service-role credential remains server-only (never present in any JSON response body)
  {
    const entitlementsStore = [];
    const stripeSessions = { cs_leak_check: paidSession({ id: 'cs_leak_check', email: USER_A.email }) };
    const mock = buildMockFetch({ users: { [TOKEN_A]: USER_A }, stripeSessions, entitlementsStore });
    const responses = await Promise.all([
      withMockFetch(mock, () => onRequestPost({ request: makePostRequest({ sessionId: '' }, null), env })),
      withMockFetch(mock, () => onRequestPost({ request: makePostRequest({ sessionId: 'cs_leak_check' }, null), env })),
      withMockFetch(mock, () => onRequestPost({ request: makePostRequest({ sessionId: 'cs_leak_check' }, TOKEN_A), env })),
    ]);
    let leaked = false;
    for (const res of responses) {
      const text = JSON.stringify(await collectResponseBody(res));
      if (text.includes(env.SUPABASE_SERVICE_ROLE_KEY) || text.includes(env.STRIPE_SECRET_KEY)) leaked = true;
    }
    check('K. NO SECRET LEAKAGE', 'No response body ever contains the Supabase service-role key or Stripe secret key', !leaked);
  }

  // Malformed request: missing sessionId
  {
    const entitlementsStore = [];
    const mock = buildMockFetch({ users: { [TOKEN_A]: USER_A }, stripeSessions: {}, entitlementsStore });
    const res = await withMockFetch(mock, () =>
      onRequestPost({ request: makePostRequest({}, TOKEN_A), env })
    );
    check('VALIDATION', 'A request with no sessionId is rejected (400) before any auth/Stripe call', res.status === 400);
  }
}

await runChecks();

// ─────────────────────────────────────────────────────────────────────────
// Static structural checks
// ─────────────────────────────────────────────────────────────────────────
(function staticServerChecks() {
  const src = readFileSync(path.join(ROOT, 'functions/api/claim-course-access.js'), 'utf8');
  check('STATIC', 'claim-course-access.js imports resolveUser (reuses the existing shared auth helper, no parallel auth system)', /import\s*\{\s*resolveUser\s*\}\s*from ['"]\.\.\/_lib\/certification\/auth\.mjs['"]/.test(src));
  check('STATIC', 'body.userId is never read anywhere in the file (removed from the contract, not just ignored)', !/body\.userId/.test(src));
  check('STATIC', 'The written user_id comes from the authenticated subject, not a client value', /userId:\s*authenticatedUserId/.test(src));
  check('STATIC', 'An authenticated-email/purchase-email mismatch is explicitly rejected with 403', /authenticatedEmail !== sessionEmail/.test(src) && /\}, 403\)/.test(src));
})();

(function staticClientChecks() {
  for (const file of ['success.html', 'student-access.html', 'headspa-mastery.html']) {
    const src = readFileSync(path.join(ROOT, file), 'utf8');
    check('STATIC CLIENT', `${file} still calls /api/claim-course-access`, src.includes('/api/claim-course-access'));
    check('STATIC CLIENT', `${file} no longer sends a userId field in the claim request body`, !/userId:\s*(user\.id|userId|data\.session\.user)/.test(src));
    check('STATIC CLIENT', `${file} attaches an Authorization bearer header when claiming`, /headers\.Authorization\s*=\s*`Bearer \$\{accessToken\}`/.test(src));
  }
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
