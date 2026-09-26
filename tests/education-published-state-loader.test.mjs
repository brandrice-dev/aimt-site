// AIMT Education Operations v1 — deterministic tests for the runtime
// published-state loader (functions/_lib/education-ops/
// education-published-state-loader.mjs). computeUtcCalendarWeekBounds
// is PURE and tested directly; the two live-fetch functions are tested
// against a stubbed global.fetch -- NO real network call anywhere in
// this file.
//
// Run: node tests/education-published-state-loader.test.mjs

import {
  computeUtcCalendarWeekBounds, fetchPublishedTopicSlugsLive, countPagesPublishedThisWeekLive,
  PublishedStateLoaderError,
} from '../functions/_lib/education-ops/education-published-state-loader.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const FAKE_ENV = { SUPABASE_URL: 'https://example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fake' };

/** Temporarily replaces global.fetch for the duration of `fn`, always
    restoring the original afterward (even on throw). */
async function withStubbedFetch(stub, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = stub;
  try {
    return await fn();
  } finally {
    globalThis.fetch = original;
  }
}

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => body, text: async () => JSON.stringify(body) };
}

// ─────────────────────────────────────────────────────────────────────────
// computeUtcCalendarWeekBounds -- PURE, deterministic, Monday-anchored.
// ─────────────────────────────────────────────────────────────────────────
(function testWeekBoundsAnchorToMondayUtc() {
  // 2026-09-25 is a Friday (UTC). The week should start Monday 2026-09-21.
  const friday = new Date('2026-09-25T18:30:00.000Z');
  const { weekStart, weekEnd } = computeUtcCalendarWeekBounds(friday);
  check('WEEK_BOUNDS', 'week starts Monday 2026-09-21T00:00:00.000Z', weekStart.toISOString() === '2026-09-21T00:00:00.000Z', weekStart.toISOString());
  check('WEEK_BOUNDS', 'week ends (exclusive) the following Monday 2026-09-28T00:00:00.000Z', weekEnd.toISOString() === '2026-09-28T00:00:00.000Z', weekEnd.toISOString());
})();

(function testWeekBoundsOnASunday() {
  // Sunday is the LAST day of the UTC calendar week that started the
  // preceding Monday -- a common off-by-one trap.
  const sunday = new Date('2026-09-27T23:59:00.000Z');
  const { weekStart, weekEnd } = computeUtcCalendarWeekBounds(sunday);
  check('WEEK_BOUNDS', 'a Sunday still belongs to the week that started the preceding Monday', weekStart.toISOString() === '2026-09-21T00:00:00.000Z', weekStart.toISOString());
  check('WEEK_BOUNDS', 'week end is exclusive (Sunday 23:59 is still inside the window)', sunday < weekEnd);
})();

(function testWeekBoundsOnAMondayMidnight() {
  const mondayMidnight = new Date('2026-09-21T00:00:00.000Z');
  const { weekStart } = computeUtcCalendarWeekBounds(mondayMidnight);
  check('WEEK_BOUNDS', 'exactly Monday 00:00:00 UTC is its own week start (not the previous week)', weekStart.toISOString() === '2026-09-21T00:00:00.000Z', weekStart.toISOString());
})();

(function testWeekBoundsAreDeterministic() {
  const d = new Date('2026-09-23T12:00:00.000Z');
  const a = computeUtcCalendarWeekBounds(d);
  const b = computeUtcCalendarWeekBounds(d);
  check('WEEK_BOUNDS', 'identical input always produces identical bounds', a.weekStart.toISOString() === b.weekStart.toISOString() && a.weekEnd.toISOString() === b.weekEnd.toISOString());
})();

// ─────────────────────────────────────────────────────────────────────────
// fetchPublishedTopicSlugsLive -- stubbed fetch, no real network call.
// ─────────────────────────────────────────────────────────────────────────
async function testFetchPublishedTopicSlugsLiveSuccess() {
  let capturedUrl = null;
  await withStubbedFetch(async (url) => { capturedUrl = String(url); return jsonResponse([{ topic_slug: 'hair-cycle' }, { topic_slug: 'telogen-effluvium' }]); }, async () => {
    const slugs = await fetchPublishedTopicSlugsLive(FAKE_ENV);
    check('PUBLISHED_SLUGS_LIVE', 'returns the topic_slug values', JSON.stringify(slugs) === JSON.stringify(['hair-cycle', 'telogen-effluvium']), JSON.stringify(slugs));
  });
  check('PUBLISHED_SLUGS_LIVE', 'queries status=published', capturedUrl.includes('status=eq.published'), capturedUrl);
  check('PUBLISHED_SLUGS_LIVE', 'queries sitemap_eligible=true (the FULL published-and-live authority, not status alone)', capturedUrl.includes('sitemap_eligible=eq.true'), capturedUrl);
}

async function testFetchPublishedTopicSlugsLiveFailureThrows() {
  await withStubbedFetch(async () => jsonResponse({ message: 'nope' }, { ok: false, status: 500 }), async () => {
    let threw = null;
    try { await fetchPublishedTopicSlugsLive(FAKE_ENV); } catch (e) { threw = e; }
    check('PUBLISHED_SLUGS_LIVE', 'throws PublishedStateLoaderError on a non-ok response (fail closed)', threw instanceof PublishedStateLoaderError, threw && threw.constructor.name);
  });
}

async function testFetchPublishedTopicSlugsLiveMissingEnvThrows() {
  let threw = null;
  try { await fetchPublishedTopicSlugsLive({}); } catch (e) { threw = e; }
  check('PUBLISHED_SLUGS_LIVE', 'throws immediately on missing Supabase env, before any fetch', threw instanceof PublishedStateLoaderError);
}

// ─────────────────────────────────────────────────────────────────────────
// countPagesPublishedThisWeekLive -- stubbed fetch, no real network call.
// ─────────────────────────────────────────────────────────────────────────
async function testCountPagesPublishedThisWeekLiveSuccess() {
  let capturedUrl = null;
  await withStubbedFetch(async (url) => { capturedUrl = String(url); return jsonResponse([{ topic_slug: 'a' }, { topic_slug: 'b' }]); }, async () => {
    const result = await countPagesPublishedThisWeekLive(FAKE_ENV, { referenceDate: new Date('2026-09-25T00:00:00.000Z') });
    check('WEEKLY_COUNT_LIVE', 'returns the row count', result.count === 2, result.count);
    check('WEEKLY_COUNT_LIVE', 'reports the UTC week definition explicitly', result.week_definition.includes('utc_calendar_week'), result.week_definition);
    check('WEEKLY_COUNT_LIVE', 'week_start is the Monday for the reference date', result.week_start === '2026-09-21T00:00:00.000Z', result.week_start);
  });
  check('WEEKLY_COUNT_LIVE', 'queries status=published', capturedUrl.includes('status=eq.published'), capturedUrl);
  check('WEEKLY_COUNT_LIVE', 'bounds published_at with both a lower and an upper bound (AND, not OR)', (capturedUrl.match(/published_at=/g) || []).length === 2, capturedUrl);
}

async function testCountPagesPublishedThisWeekLiveFailureThrows() {
  await withStubbedFetch(async () => jsonResponse({ message: 'nope' }, { ok: false, status: 503 }), async () => {
    let threw = null;
    try { await countPagesPublishedThisWeekLive(FAKE_ENV); } catch (e) { threw = e; }
    check('WEEKLY_COUNT_LIVE', 'throws PublishedStateLoaderError on a non-ok response (fail closed)', threw instanceof PublishedStateLoaderError, threw && threw.constructor.name);
  });
}

const tests = [
  testFetchPublishedTopicSlugsLiveSuccess,
  testFetchPublishedTopicSlugsLiveFailureThrows,
  testFetchPublishedTopicSlugsLiveMissingEnvThrows,
  testCountPagesPublishedThisWeekLiveSuccess,
  testCountPagesPublishedThisWeekLiveFailureThrows,
];
for (const t of tests) await t();

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
