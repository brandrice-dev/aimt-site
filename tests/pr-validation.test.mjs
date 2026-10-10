import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { BASELINE_EXCLUSIONS, buildTestPlan, runValidation, verifySkippedTests } from '../scripts/pr-validation.mjs';

function fixture(fn) {
  const root = mkdtempSync(path.join(tmpdir(), 'aimt-pr-tests-'));
  mkdirSync(path.join(root, 'tests/nested'), { recursive: true });
  for (const file of Object.keys(BASELINE_EXCLUSIONS)) writeFileSync(path.join(root, file), 'process.exit(1);');
  try { return fn(root); } finally { rmSync(root, { recursive: true, force: true }); }
}

test('all new test files are selected, including nested JS and CJS, with only the three explicit exceptions', () => fixture((root) => {
  for (const file of ['tests/new.test.mjs', 'tests/nested/new.test.js', 'tests/nested/new.test.cjs']) writeFileSync(path.join(root, file), '');
  const plan = buildTestPlan(root);
  assert.equal(plan.discovered.length, 6);
  assert.equal(plan.excluded.length, 3);
  assert.deepEqual(plan.selected, ['tests/nested/new.test.cjs', 'tests/nested/new.test.js', 'tests/new.test.mjs']);
  assert.equal(buildTestPlan(root, true).selected.length, 6);
}));

test('empty selection and stale baseline exceptions cannot produce green validation', () => fixture((root) => {
  assert.throws(() => buildTestPlan(root), /No eligible tests/);
  writeFileSync(path.join(root, 'tests/new.test.mjs'), '');
  rmSync(path.join(root, Object.keys(BASELINE_EXCLUSIONS)[0]));
  assert.throws(() => buildTestPlan(root), /Stale baseline exclusion/);
}));

test('an added failing test blocks the real child runner, while --all retains baseline failures', () => fixture((root) => {
  const file = path.join(root, 'tests/new.test.mjs');
  writeFileSync(file, "import test from 'node:test'; test('new failure', () => { throw new Error('intentional fixture failure'); });");
  assert.equal(runValidation(root, { log: () => {} }).exitCode, 1);
  writeFileSync(file, "import test from 'node:test'; test('passes', () => {});");
  assert.equal(runValidation(root, { log: () => {} }).exitCode, 0);
  assert.equal(runValidation(root, { includeBaseline: true, log: () => {} }).exitCode, 1);
}));

test('test children do not inherit production credentials and deny real external fetch/socket calls', () => fixture((root) => {
  const original = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'fixture-secret-never-inherited';
  writeFileSync(path.join(root, 'tests/guard.test.mjs'), `
    import test from 'node:test';
    import assert from 'node:assert/strict';
    import net from 'node:net';
    test('guard and environment', async () => {
      assert.equal(process.env.SUPABASE_SERVICE_ROLE_KEY, undefined);
      await assert.rejects(fetch('https://example.invalid'), /external fetch blocked/);
      assert.throws(() => new net.Socket().connect(443, 'example.invalid'), /external socket blocked/);
    });
  `);
  try { assert.equal(runValidation(root, { log: () => {} }).exitCode, 0); }
  finally {
    if (original === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = original;
  }
}));

test('only the two documented live surface skips are accepted; new skipped tests block validation', () => fixture((root) => {
  assert.deepEqual(verifySkippedTests('ok 1 - live: internal files return 404 without their contents # SKIP set AIMT_SURFACE_BASE_URL\n# skipped 1\n'), ['live: internal files return 404 without their contents']);
  assert.throws(() => verifySkippedTests('ok 1 - hidden failure # SKIP ignored\n# skipped 1\n'), /Unexpected skipped test/);
  assert.throws(() => verifySkippedTests('# skipped 1\n'), /inconsistent/);
  writeFileSync(path.join(root, 'tests/new.test.mjs'), "import test from 'node:test'; test('silently skipped new test', { skip: true }, () => {});");
  assert.equal(runValidation(root, { log: () => {} }).exitCode, 1);
}));

test('CI uses the exact candidate with read-only permissions and cannot trigger production publisher', () => {
  const workflow = readFileSync(new URL('../.github/workflows/aimt-pr-validation.yml', import.meta.url), 'utf8');
  const publisher = readFileSync(new URL('../.github/workflows/aimt-education-publish.yml', import.meta.url), 'utf8');
  assert.match(workflow, /name: AIMT PR Validation/);
  assert.match(workflow, /ref: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /permissions:\n  contents: read/);
  assert.match(workflow, /node-version: 20/);
  assert.doesNotMatch(workflow, /secrets\.|contents: write|pull_request_target:|workflow_run:|workflow_dispatch:|schedule:|push:/);
  assert.match(publisher, /workflows: \["AIMT Education Operations"\]/);
  assert.match(publisher, /github\.event\.workflow_run\.name == 'AIMT Education Operations'/);
});

test('CLI refuses arbitrary exclusions', () => {
  const cli = fileURLToPath(new URL('../scripts/pr-validation.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [cli, '--exclude=tests/new.test.mjs'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /arbitrary exclusions are forbidden/);
});
