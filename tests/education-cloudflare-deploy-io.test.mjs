// AIMT Education Operations v1 — deterministic tests for the bounded
// Cloudflare production-deployment poll (scripts/_lib/
// education-cloudflare-deploy-io.mjs). Every gh-api call is injected --
// NO real network call in this file.
//
// Run: node tests/education-cloudflare-deploy-io.test.mjs

import { waitForCloudflareProductionDeployment } from '../scripts/_lib/education-cloudflare-deploy-io.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const SHA = 'a'.repeat(40);

function fakeClock() {
  let now = 0;
  return {
    nowFn: () => now,
    sleepFn: async (ms) => { now += ms; },
  };
}

async function testSucceedsImmediatelyWhenProductionDeploymentIsAlreadySuccessful() {
  const clock = fakeClock();
  const result = await waitForCloudflareProductionDeployment({ repo: 'x/y', commitSha: SHA, timeoutMs: 60000, pollIntervalMs: 1000 }, {
    ...clock,
    listDeploymentsFn: async () => [{ id: 1, environment: 'Production', sha: SHA }],
    listStatusesFn: async () => [{ deployment_id: 1, state: 'success' }],
  });
  check('IMMEDIATE_SUCCESS', 'ok is true', result.ok === true);
  check('IMMEDIATE_SUCCESS', 'state is success', result.state === 'success');
  check('IMMEDIATE_SUCCESS', 'deploymentId is the matched production deployment', result.deploymentId === 1);
}

async function testPollsThenSucceeds() {
  const clock = fakeClock();
  let call = 0;
  const result = await waitForCloudflareProductionDeployment({ repo: 'x/y', commitSha: SHA, timeoutMs: 60000, pollIntervalMs: 1000 }, {
    ...clock,
    listDeploymentsFn: async () => { call += 1; return [{ id: 1, environment: 'Production', sha: SHA }]; },
    listStatusesFn: async () => [{ deployment_id: 1, state: call < 3 ? 'pending' : 'success' }],
  });
  check('POLL_THEN_SUCCESS', 'eventually succeeds', result.ok === true);
  check('POLL_THEN_SUCCESS', 'polled more than once before succeeding', call >= 3, call);
}

async function testTerminalFailureReturnsImmediatelyWithoutWaitingOutTheTimeout() {
  const clock = fakeClock();
  const result = await waitForCloudflareProductionDeployment({ repo: 'x/y', commitSha: SHA, timeoutMs: 60000, pollIntervalMs: 1000 }, {
    ...clock,
    listDeploymentsFn: async () => [{ id: 1, environment: 'Production', sha: SHA }],
    listStatusesFn: async () => [{ deployment_id: 1, state: 'failure' }],
  });
  check('TERMINAL_FAILURE', 'test #12: a failed deployment reports state failure', result.ok === false && result.state === 'failure');
  check('TERMINAL_FAILURE', 'never waited out the full timeout for a terminal failure', clock.nowFn() < 60000);
}

async function testTimeoutWhenNeverSucceedsOrFails() {
  const clock = fakeClock();
  const result = await waitForCloudflareProductionDeployment({ repo: 'x/y', commitSha: SHA, timeoutMs: 5000, pollIntervalMs: 1000 }, {
    ...clock,
    listDeploymentsFn: async () => [{ id: 1, environment: 'Production', sha: SHA }],
    listStatusesFn: async () => [{ deployment_id: 1, state: 'pending' }],
  });
  check('TIMEOUT', 'test #13: reports state timeout, ok false', result.ok === false && result.state === 'timeout');
  check('TIMEOUT', 'has a BOUNDED wait -- stopped at/after the timeout, not indefinitely', clock.nowFn() >= 5000);
}

async function testPreviewOnlyDeploymentIsNeverAcceptedAsProduction() {
  const clock = fakeClock();
  const result = await waitForCloudflareProductionDeployment({ repo: 'x/y', commitSha: SHA, timeoutMs: 3000, pollIntervalMs: 1000 }, {
    ...clock,
    listDeploymentsFn: async () => [{ id: 1, environment: 'Preview', sha: SHA }],
    listStatusesFn: async () => [{ deployment_id: 1, state: 'success' }],
  });
  check('PREVIEW_NOT_ACCEPTED', 'test #14: a successful PREVIEW deployment alone never satisfies the wait', result.ok === false);
}

const tests = [
  testSucceedsImmediatelyWhenProductionDeploymentIsAlreadySuccessful,
  testPollsThenSucceeds,
  testTerminalFailureReturnsImmediatelyWithoutWaitingOutTheTimeout,
  testTimeoutWhenNeverSucceedsOrFails,
  testPreviewOnlyDeploymentIsNeverAcceptedAsProduction,
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
