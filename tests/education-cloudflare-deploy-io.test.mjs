// AIMT Education Operations v1 — deterministic tests for the bounded
// Cloudflare Pages check-run poll (scripts/_lib/
// education-cloudflare-deploy-io.mjs). Every gh-api call is injected --
// NO real network call in this file. Check-run objects are shaped
// exactly like this repository's real Cloudflare Pages GitHub
// integration: name "Cloudflare Pages", app slug
// "cloudflare-workers-and-pages".
//
// Run: node tests/education-cloudflare-deploy-io.test.mjs

import { waitForCloudflareProductionDeployment } from '../scripts/_lib/education-cloudflare-deploy-io.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const SHA = 'a'.repeat(40);
const OTHER_SHA = 'c'.repeat(40);

function cloudflarePagesCheckRun(overrides = {}) {
  return { id: 1, name: 'Cloudflare Pages', head_sha: SHA, status: 'completed', conclusion: 'success', app: { slug: 'cloudflare-workers-and-pages' }, ...overrides };
}
function genericActionsCheckRun(overrides = {}) {
  return { id: 2, name: 'build', head_sha: SHA, status: 'completed', conclusion: 'success', app: { slug: 'github-actions' }, ...overrides };
}

function fakeClock() {
  let now = 0;
  return {
    nowFn: () => now,
    sleepFn: async (ms) => { now += ms; },
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Real Cloudflare check-run shaped success.
// ─────────────────────────────────────────────────────────────────────────
async function testSucceedsImmediatelyOnARealCloudflarePagesCheckRunSuccess() {
  const clock = fakeClock();
  const result = await waitForCloudflareProductionDeployment({ repo: 'x/y', commitSha: SHA, timeoutMs: 60000, pollIntervalMs: 1000 }, {
    ...clock,
    listCheckRunsFn: async () => [genericActionsCheckRun(), cloudflarePagesCheckRun()],
  });
  check('CLOUDFLARE_CHECK_RUN_SUCCESS', 'ok is true', result.ok === true);
  check('CLOUDFLARE_CHECK_RUN_SUCCESS', 'state is success', result.state === 'success');
  check('CLOUDFLARE_CHECK_RUN_SUCCESS', 'checkRunId is the matched Cloudflare check run, not the generic one', result.checkRunId === 1);
}

async function testPollsThenSucceeds() {
  const clock = fakeClock();
  let call = 0;
  const result = await waitForCloudflareProductionDeployment({ repo: 'x/y', commitSha: SHA, timeoutMs: 60000, pollIntervalMs: 1000 }, {
    ...clock,
    listCheckRunsFn: async () => { call += 1; return [cloudflarePagesCheckRun({ status: call < 3 ? 'in_progress' : 'completed', conclusion: call < 3 ? null : 'success' })]; },
  });
  check('POLL_THEN_SUCCESS', 'eventually succeeds', result.ok === true);
  check('POLL_THEN_SUCCESS', 'polled more than once before succeeding', call >= 3, call);
}

// ─────────────────────────────────────────────────────────────────────────
// Cloudflare check for the WRONG SHA is never accepted.
// ─────────────────────────────────────────────────────────────────────────
async function testCloudflareCheckForWrongShaIsNeverAccepted() {
  const clock = fakeClock();
  const result = await waitForCloudflareProductionDeployment({ repo: 'x/y', commitSha: SHA, timeoutMs: 3000, pollIntervalMs: 1000 }, {
    ...clock,
    listCheckRunsFn: async () => [cloudflarePagesCheckRun({ head_sha: OTHER_SHA })],
  });
  check('WRONG_SHA_REJECTED', 'a Cloudflare Pages success for a DIFFERENT commit never satisfies the wait', result.ok === false);
  check('WRONG_SHA_REJECTED', 'times out rather than being satisfied', result.state === 'timeout');
}

// ─────────────────────────────────────────────────────────────────────────
// A generic (non-Cloudflare) successful check is never accepted.
// ─────────────────────────────────────────────────────────────────────────
async function testNonCloudflareSuccessfulCheckIsNeverAccepted() {
  const clock = fakeClock();
  const result = await waitForCloudflareProductionDeployment({ repo: 'x/y', commitSha: SHA, timeoutMs: 3000, pollIntervalMs: 1000 }, {
    ...clock,
    listCheckRunsFn: async () => [genericActionsCheckRun()],
  });
  check('NON_CLOUDFLARE_REJECTED', 'a successful generic GitHub Actions check alone never satisfies the wait', result.ok === false);

  const wrongAppResult = await waitForCloudflareProductionDeployment({ repo: 'x/y', commitSha: SHA, timeoutMs: 1000, pollIntervalMs: 500 }, {
    ...fakeClock(),
    listCheckRunsFn: async () => [{ id: 3, name: 'Cloudflare Pages', head_sha: SHA, status: 'completed', conclusion: 'success', app: { slug: 'some-other-app' } }],
  });
  check('NON_CLOUDFLARE_REJECTED', 'a check run with the RIGHT name but WRONG app is also never accepted', wrongAppResult.ok === false);
}

// ─────────────────────────────────────────────────────────────────────────
// Cloudflare check failure / timeout.
// ─────────────────────────────────────────────────────────────────────────
async function testCloudflareCheckFailureRejected() {
  const clock = fakeClock();
  const result = await waitForCloudflareProductionDeployment({ repo: 'x/y', commitSha: SHA, timeoutMs: 60000, pollIntervalMs: 1000 }, {
    ...clock,
    listCheckRunsFn: async () => [cloudflarePagesCheckRun({ conclusion: 'failure' })],
  });
  check('CLOUDFLARE_FAILURE_REJECTED', 'a completed Cloudflare check with conclusion=failure reports state failure', result.ok === false && result.state === 'failure');
  check('CLOUDFLARE_FAILURE_REJECTED', 'never waited out the full timeout for a terminal failure', clock.nowFn() < 60000);
}

async function testCloudflareCheckCancelledRejected() {
  const clock = fakeClock();
  const result = await waitForCloudflareProductionDeployment({ repo: 'x/y', commitSha: SHA, timeoutMs: 60000, pollIntervalMs: 1000 }, {
    ...clock,
    listCheckRunsFn: async () => [cloudflarePagesCheckRun({ conclusion: 'cancelled' })],
  });
  check('CLOUDFLARE_CANCELLED_REJECTED', 'a cancelled Cloudflare check reports state failure', result.ok === false && result.state === 'failure');
}

async function testCloudflareCheckTimeout() {
  const clock = fakeClock();
  const result = await waitForCloudflareProductionDeployment({ repo: 'x/y', commitSha: SHA, timeoutMs: 5000, pollIntervalMs: 1000 }, {
    ...clock,
    listCheckRunsFn: async () => [cloudflarePagesCheckRun({ status: 'in_progress', conclusion: null })],
  });
  check('CLOUDFLARE_TIMEOUT', 'reports state timeout, ok false', result.ok === false && result.state === 'timeout');
  check('CLOUDFLARE_TIMEOUT', 'has a BOUNDED wait -- stopped at/after the timeout, not indefinitely', clock.nowFn() >= 5000);
}

async function testNoCheckRunAtAllTimesOut() {
  const clock = fakeClock();
  const result = await waitForCloudflareProductionDeployment({ repo: 'x/y', commitSha: SHA, timeoutMs: 3000, pollIntervalMs: 1000 }, {
    ...clock,
    listCheckRunsFn: async () => [],
  });
  check('NO_CHECK_RUN_TIMES_OUT', 'no Cloudflare Pages check run at all eventually times out', result.ok === false && result.state === 'timeout');
}

const tests = [
  testSucceedsImmediatelyOnARealCloudflarePagesCheckRunSuccess,
  testPollsThenSucceeds,
  testCloudflareCheckForWrongShaIsNeverAccepted,
  testNonCloudflareSuccessfulCheckIsNeverAccepted,
  testCloudflareCheckFailureRejected,
  testCloudflareCheckCancelledRejected,
  testCloudflareCheckTimeout,
  testNoCheckRunAtAllTimesOut,
];
for (const t of tests) await t();

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
