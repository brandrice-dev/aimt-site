import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const GUARD = new URL('../tests/support/offline-only.mjs', import.meta.url).href;

// Temporary, explicit exceptions reproduced on audit baseline 3db89ec.
// No configurable exclusion glob: every other discovered test must run.
export const BASELINE_EXCLUSIONS = Object.freeze({
  'tests/aimt-listen-mode-capcut-production.test.mjs': 'Missing ignored local CapCut master WAVs; fails on the original audit baseline.',
  'tests/aimt-media-backup.test.mjs': 'Source manifest requires the same absent local media masters; fails on the original audit baseline.',
  'tests/aimt-listen-mode-module1-pilot.test.mjs': 'Frozen historical pilot assertions conflict with later published wiring and authorized payment fixes; already fails on the audit baseline.',
});

const LIVE_SKIPS = new Set([
  'live: internal files return 404 without their contents',
  'live: public resources and API routes still respond',
]);

export function buildTestPlan(root = ROOT, includeBaseline = false) {
  const discovered = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isSymbolicLink() && /\.test\.(?:mjs|cjs|js)$/.test(entry.name)) {
        throw new Error(`Unsupported symlinked test: ${absolute}`);
      } else if (entry.isFile() && /\.test\.(?:mjs|cjs|js)$/.test(entry.name)) {
        discovered.push(path.relative(root, absolute).split(path.sep).join('/'));
      }
    }
  }
  walk(path.join(root, 'tests'));
  discovered.sort();
  if (!discovered.length) throw new Error('No tests discovered; refusing empty validation.');
  for (const excluded of Object.keys(BASELINE_EXCLUSIONS)) {
    if (!discovered.includes(excluded)) throw new Error(`Stale baseline exclusion: ${excluded}; review the exception list.`);
  }
  const excluded = includeBaseline ? [] : Object.keys(BASELINE_EXCLUSIONS);
  const selected = discovered.filter((file) => !excluded.includes(file));
  if (!selected.length) throw new Error('No eligible tests; refusing empty validation.');
  return { discovered, excluded, selected };
}

export function verifySkippedTests(output) {
  const skips = [...output.matchAll(/^\s*ok \d+ - (.*?) # SKIP (.*)$/gm)];
  const totals = [...output.matchAll(/^# skipped (\d+)$/gm)];
  if (!totals.length || Number(totals.at(-1)[1]) !== skips.length) {
    throw new Error('Missing or inconsistent skipped-test summary.');
  }
  const seen = new Set();
  for (const [, name, reason] of skips) {
    if (!LIVE_SKIPS.has(name) || reason !== 'set AIMT_SURFACE_BASE_URL' || seen.has(name)) {
      throw new Error(`Unexpected skipped test: ${name}`);
    }
    seen.add(name);
  }
  return [...seen];
}

export function runValidation(root = ROOT, { includeBaseline = false, log = console.log } = {}) {
  const plan = buildTestPlan(root, includeBaseline);
  log(`Node ${process.version}: discovered ${plan.discovered.length}, selected ${plan.selected.length}, excluded ${plan.excluded.length} test files.`);
  for (const file of plan.excluded) log(`EXCLUDED ${file}: ${BASELINE_EXCLUSIONS[file]}`);
  if (includeBaseline) log('Baseline exceptions disabled (--all).');
  log('Only the two named live surface checks may skip; no live service URL or credentials are supplied.');
  const env = {
    PATH: process.env.PATH || '/usr/bin:/bin',
    LANG: 'C',
    NODE_OPTIONS: `--import=${GUARD}`,
  };
  const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', '--test-concurrency=1', '--test-timeout=120000', ...plan.selected], {
    cwd: root, env, encoding: 'utf8', timeout: 480000, maxBuffer: 16 * 1024 * 1024,
  });
  const output = (result.stdout || '') + (result.stderr || '');
  log(output);
  let exitCode = result.status ?? 1;
  if (result.error || result.signal) {
    log(`Test process failed: ${result.error?.code || result.signal}`);
    exitCode = 1;
  }
  try {
    for (const name of verifySkippedTests(output)) log(`DOCUMENTED LIVE SKIP ${name}`);
  } catch (error) {
    log(error.message);
    exitCode = 1;
  }
  return { exitCode, output, plan };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    if (process.versions.node.split('.')[0] !== '20') throw new Error('PR validation requires Node 20.');
    const args = process.argv.slice(2);
    if (args.some((arg) => arg !== '--all' && arg !== '--list') || new Set(args).size !== args.length) {
      throw new Error('Usage: node scripts/pr-validation.mjs [--all] [--list]; arbitrary exclusions are forbidden.');
    }
    if (args.includes('--list')) console.log(JSON.stringify(buildTestPlan(ROOT, args.includes('--all')), null, 2));
    else process.exitCode = runValidation(ROOT, { includeBaseline: args.includes('--all') }).exitCode;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
