/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — Cloudflare production-deployment wait
   ---------------------------------------------------------------
   Node-only I/O (execFileSync + `gh`), never imported by a Cloudflare
   Pages Function -- same convention as every other scripts/_lib module.
   Cloudflare Pages' GitHub integration creates a real GitHub Deployment
   object per push (with `environment` = "Production" for the production
   branch, "Preview" for a PR) and posts deployment_status events
   (state: pending/success/failure/error) against it. This is the
   narrowest deterministic signal actually available for "is THIS commit
   live in production" -- never a preview deployment, never generic
   workflow success, never elapsed time, never a bare HTTP 200 (which a
   STALE deployment could also return).

   The DECISION logic (which deployment counts, what "succeeded" means)
   is intentionally pure and lives in education-publish-verification.mjs
   #checkProductionDeploymentSucceeded -- this module only fetches the
   raw GitHub API data and drives the bounded poll loop around it.
   ═══════════════════════════════════════════════════════════════ */

import { execFileSync } from 'node:child_process';
import { checkProductionDeploymentSucceeded } from '../../functions/_lib/education-ops/education-publish-verification.mjs';

export const DEFAULT_DEPLOYMENT_WAIT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
export const DEFAULT_DEPLOYMENT_POLL_INTERVAL_MS = 15 * 1000; // 15 seconds

/** Real `gh api` read of every GitHub Deployment recorded for a commit SHA. */
export function listDeploymentsForCommit(repo, commitSha) {
  const out = execFileSync('gh', ['api', `repos/${repo}/deployments?sha=${commitSha}&per_page=100`], { encoding: 'utf8' });
  return JSON.parse(out).map((d) => ({ id: d.id, environment: d.environment, sha: d.sha }));
}

/** Real `gh api` read of the MOST RECENT deployment_status for each deployment id. */
export function listLatestDeploymentStatuses(repo, deployments) {
  return deployments.map((d) => {
    const out = execFileSync('gh', ['api', `repos/${repo}/deployments/${d.id}/statuses?per_page=1`], { encoding: 'utf8' });
    const statuses = JSON.parse(out);
    return { deployment_id: d.id, state: statuses[0] ? statuses[0].state : 'pending' };
  });
}

const TERMINAL_FAILURE_STATES = new Set(['failure', 'error', 'inactive']);

/**
 * Bounded poll for a successful PRODUCTION deployment of `commitSha`.
 * Never blocks unboundedly -- `timeoutMs` is always enforced, and a
 * deployment that reaches a terminal failure state returns immediately
 * rather than waiting out the full timeout for nothing.
 *
 * @param {{repo: string, commitSha: string, timeoutMs?: number, pollIntervalMs?: number}} args
 * @param {{listDeploymentsFn?: Function, listStatusesFn?: Function, sleepFn?: Function, nowFn?: Function}} [io]
 *   test-only overrides; the real CLI never supplies them.
 * @returns {Promise<{ok: boolean, state: 'success'|'failure'|'timeout', deploymentId: number|null, violations: string[]}>}
 */
export async function waitForCloudflareProductionDeployment(
  { repo, commitSha, timeoutMs = DEFAULT_DEPLOYMENT_WAIT_TIMEOUT_MS, pollIntervalMs = DEFAULT_DEPLOYMENT_POLL_INTERVAL_MS },
  io = {},
) {
  const listDeploymentsFn = io.listDeploymentsFn || ((sha) => listDeploymentsForCommit(repo, sha));
  const listStatusesFn = io.listStatusesFn || ((deployments) => listLatestDeploymentStatuses(repo, deployments));
  const sleepFn = io.sleepFn || ((ms) => new Promise((resolve) => { setTimeout(resolve, ms); }));
  const nowFn = io.nowFn || Date.now;

  const startedAt = nowFn();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const deployments = await listDeploymentsFn(commitSha);
    const statuses = await listStatusesFn(deployments);
    const result = checkProductionDeploymentSucceeded(deployments, statuses, commitSha);
    if (result.ok) return { ok: true, state: 'success', deploymentId: result.matchedDeploymentId, violations: [] };

    const statusById = new Map(statuses.map((s) => [s.deployment_id, s.state]));
    const productionForCommit = deployments.filter((d) => d.sha === commitSha && typeof d.environment === 'string' && d.environment.toLowerCase() === 'production');
    const terminallyFailed = productionForCommit.some((d) => TERMINAL_FAILURE_STATES.has(statusById.get(d.id)));
    if (terminallyFailed) {
      return { ok: false, state: 'failure', deploymentId: null, violations: result.violations };
    }

    if (nowFn() - startedAt >= timeoutMs) {
      return { ok: false, state: 'timeout', deploymentId: null, violations: ['DEPLOYMENT_WAIT_TIMEOUT', ...result.violations] };
    }
    await sleepFn(pollIntervalMs);
  }
}
