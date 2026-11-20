import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { onRequestPost } from '../functions/api/course-session.js';
import { servePaidMedia, privateMediaPath } from '../functions/_lib/paid-content/media.mjs';

const env = {
  SUPABASE_URL: 'https://supabase.aimt.test',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  PAID_ASSETS_BUCKET: 'aimt-private-course'
};
const token = 'eyJhbGciOiJIUzI1NiJ9.' +
  Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 900, sub: 'test-student' })).toString('base64url') +
  '.signatur3';
const mediaURL = 'https://aimtrichology.com/assets/images/course/module-08/module-08-core-format-service-map.png';
function fakeFetch(t, entitled = true) {
  const seen = [];
  t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
    const p = new URL(url).pathname;
    seen.push({ path: p, authorization: options.headers?.Authorization, method: options.method || 'GET' });
    if (p === '/auth/v1/user') return Response.json({ id: 'user-1', email: 'student@aimt.test' });
    if (p === '/rest/v1/course_entitlements') return Response.json(entitled ? [{ checkout_session_id: 'grant-1' }] : []);
    if (p.startsWith('/storage/v1/object/authenticated/')) {
      assert.equal(options.headers.Authorization, 'Bearer test-service-role-key');
      return new Response('image-bytes', { status: 200, headers: { 'Content-Length': '11' } });
    }
    throw new Error('Unexpected request to ' + p);
  });
  return seen;
}

test('private-course URLs reject traversal, ambiguity, unsupported types and course media outside allowlists', () => {
  assert.ok(privateMediaPath('/assets/images/course/module-08/core.png'));
  assert.ok(privateMediaPath('/assets/audio/listen/headspa-mastery/module-08/m8-01.mp3'));
  for (const p of [
    '/assets/images/marketing/public.jpg',
    '/assets/images/course/../admin.html',
    '/assets/images/course/%252e%252e/credentials.pdf',
    '/assets/images/course/module-09/file.exe',
    '/assets/audio/listen/headspa-mastery/module-08/m8-01.js',
    '/assets/images/course/module-08/trailing%5Cname.png',
  ]) assert.equal(privateMediaPath(p), null, p);
});

test('signed-out request never reaches identity, entitlement or storage', async t => {
  const calls = fakeFetch(t);
  const r = await servePaidMedia({ request: new Request(mediaURL), env });
  assert.equal(r.status, 401);
  assert.equal(calls.length, 0);
  assert.match(r.headers.get('Cache-Control'), /no-store/);
});

test('unenrolled user cannot load images, even with a signed-in cookie', async t => {
  const calls = fakeFetch(t, false);
  const r = await servePaidMedia({
    request: new Request(mediaURL, { headers: { Cookie: '__Secure-aimt-paid-media=' + token } }), env
  });
  assert.equal(r.status, 403);
  assert.ok(calls.some(c => c.path.includes('course_entitlements')));
  assert.ok(!calls.some(c => c.path.includes('/storage/v1/')));
});

test('enrolled image request is private, exact-path and service-role-only upstream', async t => {
  const calls = fakeFetch(t);
  const r = await servePaidMedia({
    request: new Request(mediaURL, { headers: { Cookie: '__Secure-aimt-paid-media=' + token } }), env
  });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('Content-Type'), 'image/png');
  assert.match(r.headers.get('Cache-Control'), /no-store/);
  assert.equal(await r.text(), 'image-bytes');
  assert.ok(calls.some(c => c.path.endsWith('/headspa-mastery/media/assets/images/course/module-08/module-08-core-format-service-map.png')));
});

test('unset storage configuration fails closed', async t => {
  const calls = fakeFetch(t);
  const r = await servePaidMedia({
    request: new Request(mediaURL, { headers: { Cookie: '__Secure-aimt-paid-media=' + token } }),
    env: { ...env, PAID_ASSETS_BUCKET: '' }
  });
  assert.equal(r.status, 503);
  assert.equal(calls.length, 0);
});

test('short-lived media session requires enrollment and binds cookie to precise paid paths', async t => {
  const calls = fakeFetch(t);
  const req = new Request('https://aimtrichology.com/api/course-session', {
    method: 'POST', headers: { Authorization: 'Bearer ' + token, Origin: 'https://aimtrichology.com' }
  });
  const response = await onRequestPost({ request: req, env });
  assert.equal(response.status, 200);
  const cookieHeader = response.headers.get('set-cookie') || '';
  assert.match(cookieHeader, /HttpOnly/);
  assert.match(cookieHeader, /Secure/);
  assert.match(cookieHeader, /SameSite=Strict/);
  assert.match(cookieHeader, /Path=\/assets\/images\/course\//);
  assert.match(cookieHeader, /Path=\/assets\/audio\/listen\/headspa-mastery\//);
  assert.ok(calls.some(c => c.path.includes('/auth/v1/user')));
  assert.ok(calls.some(c => c.path.includes('course_entitlements')));
});

test('media session denies unsigned, cross-origin or unenrolled requests', async t => {
  const calls = fakeFetch(t, false);
  const blank = await onRequestPost({ request: new Request('https://aimtrichology.com/api/course-session', { method: 'POST' }), env });
  assert.equal(blank.status, 401);
  const foreign = await onRequestPost({ request: new Request('https://aimtrichology.com/api/course-session', {
    method: 'POST', headers: { Authorization: 'Bearer ' + token, Origin: 'https://evil.test' }
  }), env });
  assert.equal(foreign.status, 403);
  const noGrant = await onRequestPost({ request: new Request('https://aimtrichology.com/api/course-session', {
    method: 'POST', headers: { Authorization: 'Bearer ' + token, Origin: 'https://aimtrichology.com' }
  }), env });
  assert.equal(noGrant.status, 403);
  assert.ok(!calls.some(c => c.path.startsWith('/storage/')));
});

test('sales HTML contains no paid course lesson DOM or checkpoint rubric objects', () => {
  const sales = readFileSync(new URL('../headspa-mastery.html', import.meta.url), 'utf8');
  const privateLoader = readFileSync(new URL('../assets/js/aimt-paid-course-loader.js', import.meta.url), 'utf8');
  assert.ok(sales.includes('id="landingPage"'));
  for (const protectedMark of ['id="courseHome"', 'id="module12Wrap"', 'id="lessonView"', 'const M0 = {', 'const M8_CHAPTERS = [']) {
    assert.ok(!sales.includes(protectedMark), protectedMark + ' must never be present in public sales HTML');
  }
  assert.match(privateLoader, /\/api\/course-session/);
  assert.match(privateLoader, /\/api\/course-material\?resource=course-app/);
  assert.match(privateLoader, /document\.write\(html\)/);
});

test('only the previously published education illustration redirects to its public copy', async () => {
  const { onRequestGet } = await import('../functions/assets/images/course/[[path]].js');
  const approved = await onRequestGet({
    request: new Request('https://aimtrichology.com/assets/images/course/module-06/module-06-dry-scalp-vs-dandruff-illustration.webp'),
    env
  });
  assert.equal(approved.status, 302);
  assert.equal(approved.headers.get('Location'), '/assets/images/education/dry-scalp-vs-dandruff-illustration.webp');
  const privateLesson = await onRequestGet({ request: new Request(mediaURL), env });
  assert.equal(privateLesson.status, 401, 'unrelated paid image is never publicly redirected');
});
