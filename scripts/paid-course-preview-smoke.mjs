#!/usr/bin/env node
// AIMT paid-course deployment smoke: public preview GETs only, no credentials,
// cookies, state changes, writes or production test transactions.
import assert from 'node:assert/strict';

const PREVIEW = 'https://review-aimt-security-meta-20.aimt-site.pages.dev';
const origin = new URL(PREVIEW);
assert.equal(origin.protocol, 'https:');
assert.equal(origin.hostname, 'review-aimt-security-meta-20.aimt-site.pages.dev');
const paths = [
  { path: '/head-spa-certification', expected: 200, type: 'sales' },
  { path: '/api/course-material?resource=course-app', expected: 401, type: 'private-course' },
  { path: '/api/course-material?resource=module-09-enhancement-guide', expected: 401, type: 'private-download' },
  { path: '/assets/images/course/module-08/module-08-core-format-service-map.png', expected: 401, type: 'private-image' },
  { path: '/assets/audio/listen/headspa-mastery/module-08/m8-01.mp3', expected: 401, type: 'private-audio' },
  { path: '/assets/images/course/module-06/module-06-dry-scalp-vs-dandruff-illustration.webp', expected: 302, type: 'approved-education-alias' },
  { path: '/assets/images/education/dry-scalp-vs-dandruff-illustration.webp', expected: 200, type: 'public-education' }
];
for (const item of paths) {
  const response = await fetch(origin.origin + item.path, {
    method: 'GET',
    cache: 'no-store',
    redirect: 'manual',
    signal: AbortSignal.timeout(15000),
    headers: { 'Cache-Control': 'no-cache', 'Accept': '*/*' }
  });
  assert.equal(response.status, item.expected,
    `${item.type} expected ${item.expected}; received ${response.status} for ${item.path}`);
  const mime = response.headers.get('content-type') || '';
  if (item.type === 'sales') {
    const html = await response.text();
    assert.match(html, /id="landingPage"/, 'public sales content stays visible');
    for (const paid of ['id="module12Wrap"', 'id="lessonView"', 'const M8_CHAPTERS = [']) {
      assert.ok(!html.includes(paid), 'paid course content leaked into public sales page: ' + paid);
    }
  }
  if (item.type === 'approved-education-alias') {
    assert.equal(response.headers.get('location'), '/assets/images/education/dry-scalp-vs-dandruff-illustration.webp');
  }
  if (item.type === 'public-education') {
    assert.match(mime, /image\/webp/i, 'approved public illustration must remain an image');
  }
  if (item.type.startsWith('private-')) {
    const cache = response.headers.get('cache-control') || '';
    assert.match(cache, /no-store/i, 'private material refusal must not be cached');
    const text = await response.text();
    assert.ok(!/<!DOCTYPE html>\s*<html/i.test(text) || item.type === 'private-course',
      'private media unexpectedly served an HTML fallback');
  }
  console.log(`PASS ${item.type}: HTTP ${response.status}`);
}
console.log('Preview anonymous access smoke: all 7 checks passed; no credential was used.');
