# AIMT Phase 2A CI gate

October 10, 2026. PR validation tests the exact candidate with Node 20, read-only permissions and no production credentials. It does not merge, deploy, migrate or change scientific/student/certification rules.

## Workflow and test policy

Workflow: **AIMT PR Validation** (`.github/workflows/aimt-pr-validation.yml`).

Check/job name: **Node 20 offline suite** (`node20-tests`).

The workflow runs only for opened, synchronized or reopened PRs targeting main, including draft PRs. It checks out `github.event.pull_request.head.sha`, verifies HEAD matches, fetches history for existing Git-based fixtures and disables persisted checkout credentials. Both external Actions are pinned to the official v4 tag SHAs resolved during implementation. Permissions are limited to `contents: read`; there is no production secret, write token, deployment, dispatch or schedule step. This workflow name cannot satisfy the existing publisher's `workflow_run` filters for AIMT Education Operations.

`node scripts/pr-validation.mjs` discovers all `.test.js`, `.test.mjs` and `.test.cjs` files recursively under tests. It prints discovery, selection and exclusion counts plus the reason for each exception. A new test is automatically selected. Missing/stale exception paths, empty validation, unsupported symlinked tests, test failures, unexpected skips, subprocess failure or timeout fail the job. There is no user-supplied exclusion glob.

The runner clears the test-process environment except PATH, LANG and a NODE_OPTIONS guard inherited by Node children. The guard blocks external fetch/socket calls and external redirect following. Mocked fetches and localhost fixture servers remain available. Repository setup/checkout uses GitHub infrastructure; the tests call no live production service. This is an application-level test guard, not an OS network sandbox for arbitrary hostile subprocesses. CI executes untrusted candidate code with no production secrets or write permissions.

## Temporary baseline exclusions

Only the following three files are excluded. All three failed on the original audit baseline `3db89ecb07ad112c3cb75260df1ec68ad9ed2239` and were reproduced with Git history in the Phase 2A final review.

| File | Reason and removal condition |
| --- | --- |
| `tests/aimt-listen-mode-capcut-production.test.mjs` | Requires ignored local CapCut master WAVs absent from clean checkouts. Restore only after approved reproducible asset fixtures or a separately reviewed portable test contract replaces that requirement. |
| `tests/aimt-media-backup.test.mjs` | Its source manifest requires the same absent local masters. Restore when CI can verify the manifest without private/local-only media prerequisites. No production media was changed. |
| `tests/aimt-listen-mode-module1-pilot.test.mjs` | Historical pilot assertions conflict with subsequent published wiring and course/payment/Cadence changes. The authorized R03 fix also conflicts with its byte-identical old endpoint assertion. Restore after a separate review updates the historical fixture boundary while preserving meaningful student/payment coverage. |

No other test file is excluded. The two already documented live surface checks in `public-deployment-surface.test.mjs` may skip only with their exact names and `set AIMT_SURFACE_BASE_URL` reason; credentials/live base URL are not provided. Any additional skipped test fails validation. Mocked/static test success does not establish production validation.

For an unfiltered diagnostic, use `node scripts/pr-validation.mjs --all`; it retains the three known failures rather than concealing them. Use `--list` to inspect the exact discovery/selection plan. Removing an exception requires an explicit code-review change to `BASELINE_EXCLUSIONS`.

## Separate blocking publisher change

The existing publisher calls `gh pr merge` after checking generated paths and expected head, but does not require a passing candidate-head test check or atomically bind merge to that SHA. No publisher merge behavior is changed in this CI patch.

Generated PRs use the publisher workflow's `GITHUB_TOKEN`. Current [GitHub triggering documentation](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow) says bot-created opened/synchronized/reopened PR events can produce runs awaiting human approval. Thus check availability is not guaranteed automatically. Do not adopt a PAT/App credential, dispatch another workflow or activate an additional release automation implicitly to solve it.

A separately authorized publisher gate must:

1. Establish the approved trigger path for generated PR tests: human approval of existing pending runs, or an explicitly reviewed credential/trigger arrangement. Use this same Node 20 suite; never substitute a Cloudflare build for tests.
2. Read the latest **Node 20 offline suite** check from GitHub Actions for the manifest's exact candidate head and trusted `.github/workflows/aimt-pr-validation.yml` run. Verify repository, workflow identity, event, SHA and successful conclusion. Reject absent, pending, failed, cancelled, timed-out, skipped, stale or wrong-workflow checks. Read failures must block merging.
3. Record the check/run IDs and tested SHA in the existing publication manifest. Preserve resumability while awaiting checks or approval; do not regenerate/spend model calls or report publication success.
4. Re-read the PR and validate unchanged paths and head immediately before merge. Use the documented [`gh pr merge --match-head-commit <SHA>`](https://cli.github.com/manual/gh_pr_merge) or equivalent atomic API expectation. Never use an admin bypass or merge a later untested head.
5. Test missing/failed checks, head changes during waiting/merge, conflicting run identities, GitHub read failure, approved success and retries with mocks. Do not exercise a real generated merge or production publication while implementing the gate.

This is a release blocker for autonomous education publication. A successful PR validation check alone does not retrofit the existing publisher with that requirement. Branch protection cannot be presumed to compensate: the current connector cannot read classic protection (403) and the readable ruleset list was empty. An administrator must verify effective required checks/review/bypass rules. No repository protection is modified here.

## Scope and review boundary

The only new automation is the expressly requested read-only PR validation workflow. Existing schedules and production workflows are untouched. Cloudflare's pre-existing branch-preview integration may react to a pushed branch independently; its preview result is not test or scientific approval. Keep PR 72 in draft and stop for review before merge or production deployment. R04/R05, staging verification and scientific policy adoption remain separate work.
