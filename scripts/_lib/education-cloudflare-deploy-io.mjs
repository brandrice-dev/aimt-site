/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — Cloudflare production-deployment wait
   ---------------------------------------------------------------
   Node-only I/O (execFileSync + `gh`), never imported by a Cloudflare
   Pages Function -- same convention as every other scripts/_lib module.

   CORRECTION (real repository inspection): this module originally
   polled GitHub's Deployments API, assuming Cloudflare Pages' GitHub
   integration creates a usable Deployment object with
   `environment=Production`. Direct inspection of this repository shows
   that is NOT the actual signal exposed here -- Cloudflare Pages posts
   a GitHub CHECK RUN instead: name "Cloudflare Pages", GitHub App
   "Cloudflare Workers and Pages" (app slug `cloudflare-workers-and-
   pages`), against the exact commit SHA, with an ordinary
   `status`/`conclusion` pair. This module now polls THAT signal.
   Cloudflare's own Pages Git-integration documentation identifies
   GitHub check runs as the build/deployment status surface.

   The DECISION logic (which check run counts, what "succeeded" means)
   is intentionally pure and lives in education-publish-verification.mjs
   #checkCloudflarePagesCheckRunSucceeded -- this module only fetches
   the raw GitHub API data and drives the bounded poll loop around it.
   ═══════════════════════════════════════════════════════════════ */

import { execFileSync } from 'node:child_process';
import { checkCloudflarePagesCheckRunSucceeded } from '../../functions/_lib/education-ops/education-publish-verification.mjs';

export const DEFAULT_DEPLOYMENT_WAIT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
export const DEFAULT_DEPLOYMENT_POLL_INTERVAL_MS = 15 * 1000; // 15 seconds

/** Real `gh api` read of every GitHub check run recorded for a commit
    SHA -- includes checks from EVERY GitHub App/workflow, not just
    Cloudflare's; checkCloudflarePagesCheckRunSucceeded() is what
    narrows this down to the one that actually counts. */
export function listCheckRunsForCommit(repo, commitSha) {
  const out = execFileSync('gh', ['api', `repos/${repo}/commits/${commitSha}/check-runs?per_page=100`], { encoding: 'utf8' });
  const parsed = JSON.parse(out);
  return (parsed.check_runs || []).map((c) => ({
    id: c.id, name: c.name, head_sha: c.head_sha, status: c.status, conclusion: c.conclusion,
    app: { slug: c.app && c.app.slug },
  }));
}

/**
 * Bounded poll for a successful Cloudflare Pages check run against
 * `commitSha`. Never blocks unboundedly -- `timeoutMs` is always
 * enforced, and a check run that reaches a terminal (non-success)
 * conclusion returns immediately rather than waiting out the full
 * timeout for nothing.
 *
 * @param {{repo: string, commitSha: string, timeoutMs?: number, pollIntervalMs?: number}} args
 * @param {{listCheckRunsFn?: Function, sleepFn?: Function, nowFn?: Function}} [io]
 *   test-only overrides; the real CLI never supplies them.
 * @returns {Promise<{ok: boolean, state: 'success'|'failure'|'timeout', checkRunId: number|null, violations: string[]}>}
 */
export async function waitForCloudflareProductionDeployment(
  { repo, commitSha, timeoutMs = DEFAULT_DEPLOYMENT_WAIT_TIMEOUT_MS, pollIntervalMs = DEFAULT_DEPLOYMENT_POLL_INTERVAL_MS },
  io = {},
) {
  const listCheckRunsFn = io.listCheckRunsFn || ((sha) => listCheckRunsForCommit(repo, sha));
  const sleepFn = io.sleepFn || ((ms) => new Promise((resolve) => { setTimeout(resolve, ms); }));
  const nowFn = io.nowFn || Date.now;

  const startedAt = nowFn();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const checkRuns = await listCheckRunsFn(commitSha);
    const result = checkCloudflarePagesCheckRunSucceeded(checkRuns, commitSha);
    if (result.ok) return { ok: true, state: 'success', checkRunId: result.checkRunId, violations: [] };
    if (result.state === 'failure') return { ok: false, state: 'failure', checkRunId: null, violations: result.violations };

    if (nowFn() - startedAt >= timeoutMs) {
      return { ok: false, state: 'timeout', checkRunId: null, violations: ['DEPLOYMENT_WAIT_TIMEOUT', ...result.violations] };
    }
    await sleepFn(pollIntervalMs);
  }
}
