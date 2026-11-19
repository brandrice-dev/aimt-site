import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequestGet } from '../functions/api/course-material.js';

const env = {
  SUPABASE_URL: 'https://supabase.aimt.test',
  SUPABASE_SERVICE_ROLE_KEY: 'unit-test-service-key',
  PAID_ASSETS_BUCKET: 'aimt-private'
};

function request(extra = '') {
  return new Request('https://aimtrichology.com/api/course-material?resource=module-09-enhancement-guide' + extra, {
    headers: { Authorization: 'Bearer unit-test-student-token' }
  });
}
function setup(t, entitlement = true) {
  const seen = [];
  t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
    seen.push(String(url));
    const parsed = new URL(url);
    if (parsed.pathname === '/auth/v1/user') {
      return Response.json({ id: 'student-1', email: 'student@aimt.test' });
    }
    if (parsed.pathname === '/rest/v1/course_entitlements') {
      return Response.json(entitlement ? [{ checkout_session_id: 'cs_live_1' }] : []);
    }
    if (parsed.pathname.startsWith('/storage/v1/object/authenticated/')) {
      assert.equal(options.headers.Authorization, 'Bearer unit-test-service-key');
      return new Response('%PDF test object', { status: 200 });
    }
    throw new Error('Unexpected endpoint ' + url);
  });
  return seen;
}

test('paid material endpoint refuses a missing token before loading any assets', async t => {
  const seen = setup(t);
  const response = await onRequestGet({
    request: new Request('https://aimtrichology.com/api/course-material?resource=module-09-enhancement-guide'),
    env
  });
  assert.equal(response.status, 401);
  assert.deepEqual(seen, []);
});

test('paid material endpoint refuses unenrolled users without contacting storage', async t => {
  const seen = setup(t, false);
  const response = await onRequestGet({ request: request(), env });
  assert.equal(response.status, 403);
  assert.equal(seen.some(x => x.includes('/storage/v1/')), false);
});

test('entitled students receive only an allowlisted, non-cacheable private asset', async t => {
  const seen = setup(t, true);
  const response = await onRequestGet({ request: request(), env });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '%PDF test object');
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store, max-age=0');
  assert.equal(response.headers.get('Content-Type'), 'application/pdf');
  assert.equal(response.headers.get('Content-Disposition'), 'attachment; filename="head-spa-enhancement-strategy.pdf"');
  assert.ok(seen.some(x => x.includes('/storage/v1/object/authenticated/aimt-private/headspa-mastery/module-09/')));
});

test('unknown resource names cannot reach storage or allow arbitrary paths', async t => {
  const seen = setup(t);
  const req = new Request('https://aimtrichology.com/api/course-material?resource=../../private-files', {
    headers: { Authorization: 'Bearer valid' }
  });
  const response = await onRequestGet({ request: req, env });
  assert.equal(response.status, 404);
  assert.deepEqual(seen, []);
});

test('unset private storage config fails closed, never falls back to static Pages assets', async t => {
  const seen = setup(t);
  const response = await onRequestGet({ request: request(), env: { ...env, PAID_ASSETS_BUCKET: '' } });
  assert.equal(response.status, 503);
  assert.deepEqual(seen, []);
});
