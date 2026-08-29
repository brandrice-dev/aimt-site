// Phase 1 regression tests — AIMT Cadence Launch Sweep.
// See docs/course-audit/00-cadence-launch-sweep-build-contract.md Section 14.
//
// Covers the Phase 1 slice built this session:
//  1. functions/_lib/cadence/turn-lock.mjs — the concurrency-lock primitive
//     extracted from Phase 0's submit-interview-turn.js, generalized so a
//     future conversational mode can reuse it.
//  2. Static proof submit-interview-turn.js actually uses the extracted
//     module rather than its own re-derived copy.
//  3. Checkpoint (chat) model-identity logging: assets/js/headspa-state.js
//     persists which model actually graded a checkpoint answer, mirroring
//     Module 12's lastGradedWith pattern; cadence-worker/worker.js exposes
//     it via response headers; headspa-mastery.html's callAI()/
//     evaluateCheckpointAnswer()/submitCheckpoint() thread it through.
//
// Run: node tests/cadence-phase1.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { isTurnLockActive, claimTurnLock, releaseTurnLock, DEFAULT_LOCK_TIMEOUT_MS } from '../functions/_lib/cadence/turn-lock.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

// ─────────────────────────────────────────────────────────────────────────
// 1. TURN-LOCK PRIMITIVE (pure unit tests)
// ─────────────────────────────────────────────────────────────────────────
(function turnLockUnitTests() {
  check('TURN LOCK', 'isTurnLockActive(null) is false (no lock)', isTurnLockActive(null) === false);
  check('TURN LOCK', 'isTurnLockActive(undefined) is false', isTurnLockActive(undefined) === false);
  check('TURN LOCK', "isTurnLockActive('') is false", isTurnLockActive('') === false);
  check('TURN LOCK', 'isTurnLockActive(garbage string) is false rather than throwing', isTurnLockActive('not-a-date') === false);

  const freshClaim = claimTurnLock();
  check('TURN LOCK', 'claimTurnLock() returns a valid ISO timestamp', typeof freshClaim === 'string' && Number.isFinite(Date.parse(freshClaim)));
  check('TURN LOCK', 'A freshly claimed lock is active', isTurnLockActive(freshClaim) === true);
  check('TURN LOCK', 'A freshly claimed lock is still active just under the default timeout', isTurnLockActive(freshClaim, DEFAULT_LOCK_TIMEOUT_MS) === true);

  const staleClaim = new Date(Date.now() - (DEFAULT_LOCK_TIMEOUT_MS + 5000)).toISOString();
  check('TURN LOCK', 'A lock older than the timeout self-heals (is no longer active)', isTurnLockActive(staleClaim) === false);

  const customTimeout = 1000;
  const almostStale = new Date(Date.now() - 500).toISOString();
  check('TURN LOCK', 'A custom timeout is honored (still active just under it)', isTurnLockActive(almostStale, customTimeout) === true);
  const pastCustom = new Date(Date.now() - 1500).toISOString();
  check('TURN LOCK', 'A custom timeout is honored (inactive just past it)', isTurnLockActive(pastCustom, customTimeout) === false);

  check('TURN LOCK', 'releaseTurnLock() returns null', releaseTurnLock() === null);
  check('TURN LOCK', 'A released lock is not active', isTurnLockActive(releaseTurnLock()) === false);
})();

// ─────────────────────────────────────────────────────────────────────────
// 2. STATIC — submit-interview-turn.js actually uses the extracted module
// ─────────────────────────────────────────────────────────────────────────
(function turnLockUsageStatic() {
  const src = readFileSync(path.join(ROOT, 'functions/api/certification/submit-interview-turn.js'), 'utf8');
  check('TURN LOCK USAGE', 'Imports isTurnLockActive/claimTurnLock/releaseTurnLock from the shared module', /import\s*\{\s*isTurnLockActive,\s*claimTurnLock,\s*releaseTurnLock\s*\}\s*from\s*['"]\.\.\/\.\.\/_lib\/cadence\/turn-lock\.mjs['"]/.test(src));
  check('TURN LOCK USAGE', 'No longer defines its own local isLockActive/LOCK_TIMEOUT_MS (would be duplicated logic)', !/function isLockActive/.test(src) && !/const LOCK_TIMEOUT_MS/.test(src));
  check('TURN LOCK USAGE', 'Uses the imported functions at the actual lock check/claim/release points', /isTurnLockActive\(state\.turnInFlightAt\)/.test(src) && /claimTurnLock\(\)/.test(src) && (src.match(/releaseTurnLock\(\)/g) || []).length >= 3);
})();

// ─────────────────────────────────────────────────────────────────────────
// 3. CHECKPOINT MODEL-IDENTITY LOGGING
// ─────────────────────────────────────────────────────────────────────────

function loadHeadspaState() {
  const source = readFileSync(path.join(ROOT, 'assets/js/headspa-state.js'), 'utf8');
  const localStorageStore = Object.create(null);
  const localStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(localStorageStore, k) ? localStorageStore[k] : null),
    setItem: (k, v) => { localStorageStore[k] = String(v); },
    removeItem: (k) => { delete localStorageStore[k]; },
  };
  const sessionStorageStore = Object.create(null);
  const sessionStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(sessionStorageStore, k) ? sessionStorageStore[k] : null),
    setItem: (k, v) => { sessionStorageStore[k] = String(v); },
    removeItem: (k) => { delete sessionStorageStore[k]; },
  };
  const sandbox = {
    console,
    URLSearchParams,
    localStorage,
    sessionStorage,
    window: { location: { hostname: 'localhost', search: '' } },
    document: { getElementById() { return null; }, body: { classList: { add() {}, remove() {} } } },
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(source, context, { filename: 'headspa-state.js' });
  return sandbox.window.APP_STATE;
}

(function checkpointModelLoggingUnitTests() {
  const APP_STATE = loadHeadspaState();
  APP_STATE.load();

  const modelInfo = { provider: 'anthropic', modelName: 'claude-sonnet-5', status: 'CANDIDATE', registryVersion: 'cadence-model-registry-v2' };
  APP_STATE.setCheckpointResult(1, 'm1cp1', { passed: true, feedback: 'Great answer.', answer: 'My answer.', modelInfo });

  const meta = APP_STATE.data.progress['1'].checkpointMeta.m1cp1;
  check('CHECKPOINT MODEL LOG', 'A checkpoint result with modelInfo persists provider/modelName/status/registryVersion', !!meta.lastGradedWith && meta.lastGradedWith.provider === 'anthropic' && meta.lastGradedWith.modelName === 'claude-sonnet-5' && meta.lastGradedWith.status === 'CANDIDATE' && meta.lastGradedWith.registryVersion === 'cadence-model-registry-v2');
  check('CHECKPOINT MODEL LOG', 'lastGradedWith carries a timestamp matching the checkpoint update', meta.lastGradedWith.at === meta.updatedAt);

  // A result with no modelInfo (e.g. a call site that hasn't been updated,
  // or an older stored answer) must not throw and must leave lastGradedWith
  // null rather than a half-populated object.
  const APP_STATE2 = loadHeadspaState();
  APP_STATE2.load();
  APP_STATE2.setCheckpointResult(2, 'm2cp1', { passed: false, feedback: 'Try again.', answer: 'partial' });
  const meta2 = APP_STATE2.data.progress['2'].checkpointMeta.m2cp1;
  check('CHECKPOINT MODEL LOG', 'A result with no modelInfo leaves lastGradedWith null (no throw, no half-populated object)', meta2.lastGradedWith === null);
})();

(function checkpointModelLoggingRoundTrip() {
  // Build a harness with its own localStorage handle so we can inspect the
  // raw persisted JSON directly (loadHeadspaState() doesn't expose it).
  const source = readFileSync(path.join(ROOT, 'assets/js/headspa-state.js'), 'utf8');
  const store = Object.create(null);
  const localStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
  const sandbox = {
    console,
    URLSearchParams,
    localStorage,
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    window: { location: { hostname: 'localhost', search: '' } },
    document: { getElementById() { return null; }, body: { classList: { add() {}, remove() {} } } },
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(source, context, { filename: 'headspa-state.js' });
  const APP_STATE = sandbox.window.APP_STATE;
  APP_STATE.load();

  const modelInfo = { provider: 'anthropic', modelName: 'claude-sonnet-5', status: 'CANDIDATE', registryVersion: 'cadence-model-registry-v2' };
  APP_STATE.setCheckpointResult(3, 'm3cp1', { passed: true, feedback: 'Correct.', answer: 'Answer text.', modelInfo });

  const persisted = JSON.parse(store['levo_app']);
  check('CHECKPOINT MODEL LOG', 'lastGradedWith is actually written to localStorage (levo_app), not only held in memory', !!persisted.progress['3'].checkpointMeta.m3cp1.lastGradedWith && persisted.progress['3'].checkpointMeta.m3cp1.lastGradedWith.modelName === 'claude-sonnet-5');

  // Fresh load() from that persisted JSON (simulating a page reload) must
  // reconstruct the field via sanitizeProgress(), not drop it.
  const source2 = source; // reuse same source text
  const sandbox2 = {
    console,
    URLSearchParams,
    localStorage,
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    window: { location: { hostname: 'localhost', search: '' } },
    document: { getElementById() { return null; }, body: { classList: { add() {}, remove() {} } } },
  };
  const context2 = vm.createContext(sandbox2);
  vm.runInContext(source2, context2, { filename: 'headspa-state.js' });
  sandbox2.window.APP_STATE.load();
  const reloaded = sandbox2.window.APP_STATE.data.progress['3'].checkpointMeta.m3cp1;
  check('CHECKPOINT MODEL LOG', 'sanitizeProgress() reconstructs lastGradedWith on a fresh load() rather than stripping it as an unknown field', !!reloaded.lastGradedWith && reloaded.lastGradedWith.modelName === 'claude-sonnet-5' && reloaded.lastGradedWith.status === 'CANDIDATE');
})();

// ─────────────────────────────────────────────────────────────────────────
// 4. STATIC — client wiring (headspa-mastery.html)
// ─────────────────────────────────────────────────────────────────────────
(function clientWiringStatic() {
  const src = readFileSync(path.join(ROOT, 'headspa-mastery.html'), 'utf8');

  check('CLIENT MODEL LOG', "callAI() reads X-Cadence-Model/-Status/-Registry-Version response headers", /X-Cadence-Model'\)/.test(src) && /X-Cadence-Model-Status'\)/.test(src) && /X-Cadence-Registry-Version'\)/.test(src));
  check('CLIENT MODEL LOG', 'callAI() returns {text, modelInfo}, not a bare string', /return\s*\{\s*text:\s*d\.content\[0\]\.text,\s*modelInfo\s*\}/.test(src));

  // Regression guard for the exact bug this task found and fixed: every
  // callAI() call site must destructure the new {text, modelInfo} shape,
  // never treat the resolved value as a bare string.
  const oldBrokenPattern = /\.then\(r\s*=>/;
  check('CLIENT MODEL LOG', 'No callAI() call site still treats the resolved value as a bare string (old .then(r => ...) pattern)', !oldBrokenPattern.test(src));

  check('CLIENT MODEL LOG', 'evaluateCheckpointAnswer() destructures {text, modelInfo} from callAI() and attaches modelInfo to its return value', /const\s*\{\s*text:\s*raw,\s*modelInfo\s*\}\s*=\s*await callAI/.test(src) && /Object\.assign\(normalizeCheckpointEvaluation\(raw\),\s*\{\s*modelInfo\s*\}\)/.test(src));
  check('CLIENT MODEL LOG', 'submitCheckpoint() passes result.modelInfo through to APP_STATE.setCheckpointResult()', /APP_STATE\.setCheckpointResult\(moduleId, cpId, \{[\s\S]{0,120}modelInfo: result\.modelInfo/.test(src));
  // SUPERSEDED premise: this originally asserted all three ungraded
  // callers (gpSend, evaluateScript, submitIntro) destructured callAI()'s
  // {text, modelInfo} shape. evaluateScript/submitIntro have since
  // migrated off cadence-worker/worker.js entirely (see
  // docs/course-audit/00-aimt-launch-readiness-gate-1.md Finding P0-1) --
  // they now call callCadenceFormative() (POSTing to the new
  // /api/cadence/evaluate-script and /api/cadence/submit-intro Pages
  // Functions), which returns the identical {text, modelInfo} shape, so
  // their .then(({ text: r }) => ...) destructuring pattern is unchanged
  // even though the underlying transport is not callAI()/PROXY_URL
  // anymore. Only the deactivated legacy guide panel (gpSend) still calls
  // callAI() directly today.
  check('CLIENT MODEL LOG', 'evaluateScript() and submitIntro() both destructure the {text, modelInfo} shape via callCadenceFormative(), not callAI()', (src.match(/\.then\(\(\{\s*text:\s*r\s*\}\)\s*=>/g) || []).length >= 2 && /callCadenceFormative\('\/api\/cadence\/evaluate-script'/.test(src) && /callCadenceFormative\('\/api\/cadence\/submit-intro'/.test(src));
  check('CLIENT MODEL LOG', 'The deactivated legacy guide panel (gpSend) still destructures callAI()\'s {text, modelInfo} shape directly', /const\s*\{\s*text:\s*r\s*\}\s*=\s*await callAI/.test(src));
})();

// ─────────────────────────────────────────────────────────────────────────
// 5. STATIC — durable thread/message migration safety (drafted, NOT applied)
// ─────────────────────────────────────────────────────────────────────────
(function migrationSafetyStatic() {
  const sql = readFileSync(path.join(ROOT, 'supabase/migrations/20260827_create_cadence_threads.sql'), 'utf8');
  const sqlLower = sql.toLowerCase();

  check('MIGRATION SAFETY', 'File documents where its review/application record lives', /build-contract\.md Section/i.test(sql));
  check('MIGRATION SAFETY', 'No DROP TABLE anywhere', !/drop table/.test(sqlLower));
  check('MIGRATION SAFETY', 'No DROP COLUMN anywhere', !/drop column/.test(sqlLower));
  check('MIGRATION SAFETY', 'No TRUNCATE anywhere', !/truncate/.test(sqlLower));
  check('MIGRATION SAFETY', 'No destructive ALTER (only CREATE/ALTER TABLE ENABLE ROW LEVEL SECURITY)', !/alter table(?!.*enable row level security)/i.test(sql.replace(/alter table public\.\w+ enable row level security;/gi, '')));
  check('MIGRATION SAFETY', 'Every CREATE TABLE uses IF NOT EXISTS (idempotent, never overwrites an existing table)', (sql.match(/create table/gi) || []).length === (sql.match(/create table if not exists/gi) || []).length);
  check('MIGRATION SAFETY', 'The trigger function uses CREATE OR REPLACE (safe to re-run)', /create or replace function/i.test(sql));
  check('MIGRATION SAFETY', 'RLS is enabled on both new tables', (sql.match(/enable row level security/gi) || []).length === 2);
  check('MIGRATION SAFETY', 'Exactly one select-own policy per table, no insert/update policy for authenticated/anon anywhere', (sql.match(/create policy/gi) || []).length === 2 && !/for insert/i.test(sql) && !/for update/i.test(sql) && !/for delete/i.test(sql));
  check('MIGRATION SAFETY', 'Certification transcripts are explicitly excluded from this schema (mode check constraint has no certification value)', /mode in \('checkpoint', 'ask_cadence', 'remediation'\)/.test(sql) && !/'certification'/.test(sql));
  check('MIGRATION SAFETY', "Explicitly documents the authority boundary (transcript only, never a competency decision record)", /never.*authoritative for competency|TRANSCRIPT, never a decision/i.test(sql));
})();

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
