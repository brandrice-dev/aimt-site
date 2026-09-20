/**
 * Module 11 → 12 structural relocation — saved-state migration test matrix.
 *
 * Deterministic, dependency-free fixtures for the migration implemented in
 * assets/js/headspa-state.js (migrateModule11To12IfNeeded), which moves the
 * existing "Course Completion & Certification" progress from technical
 * slot 11 to slot 12, and starts the new slot 11 (AI / Modern Practice
 * Tools) with a genuinely fresh competency state. See
 * docs/course-audit/modules/module-11.md and
 * docs/course-audit/00-aimt-course-audit-master-instructions.md.
 *
 * Run with: node tests/module-11-relocation-migration.test.js
 * No npm dependencies — uses only Node's built-in `vm`, `fs`, `path`.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const STATE_SOURCE = fs.readFileSync(
  path.join(__dirname, '..', 'assets', 'js', 'headspa-state.js'),
  'utf8'
);

const QUARANTINE_KEY = 'aimt_module11_relocate_quarantine';

// Post-relocation checkpoint map (headspa-mastery.html's MODULE_CHECKPOINTS
// after implementation): slot 11 = AI / Modern Practice Tools (m11cp1/
// m11cp2), slot 12 = Course Completion & Certification (no checkpoints,
// same as slot 11 pre-relocation).
const MODULE_CHECKPOINTS_POST_RELOCATION = {
  '0': ['m0cp1'],
  '1': ['m1cp1', 'm1cp2'],
  '2': ['m2cp1'],
  '3': ['cp1', 'cp2'],
  '4': ['m4cp1', 'm4cp2'],
  '5': ['m5cp1', 'm5cp2'],
  '6': ['m6cp1', 'm6cp2'],
  '7': ['m7cp1', 'm7cp2'],
  '8': ['m8cp1', 'm8cp2'],
  '9': ['m10cp1', 'm10cp2'],
  '10': ['m9cp1', 'm9cp2'],
  '11': ['m11cp1', 'm11cp2'],
  '12': []
};

function makeMockStorage() {
  const store = Object.create(null);
  return {
    store,
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    }
  };
}

function createHarness() {
  const localStorage = makeMockStorage();
  const sessionStorage = makeMockStorage();
  const sandbox = {
    console,
    URLSearchParams,
    localStorage,
    sessionStorage,
    window: {
      location: { hostname: 'localhost', search: '' },
      MODULE_CHECKPOINTS: MODULE_CHECKPOINTS_POST_RELOCATION
    },
    document: {
      getElementById() { return null; },
      body: { classList: { add() {}, remove() {} } }
    }
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(STATE_SOURCE, context, { filename: 'headspa-state.js' });
  // headspa-state.js defines window.ReviewMode itself (session-only,
  // _active false by default) — fixtures that need it active set
  // h.window.ReviewMode._active = true, matching
  // tests/module-09-migration.test.js's established pattern.
  return { window: sandbox.window, localStorage, sessionStorage };
}

function seed(localStorage, rawStateObj) {
  if (rawStateObj !== undefined) {
    localStorage.setItem('levo_app', JSON.stringify(rawStateObj));
  }
}

// ── Fixture data builders ──────────────────────────────────────────────

function cpMeta(status, answer, feedback, attempts, updatedAt) {
  return { status, answer, feedback, attempts, updatedAt };
}

function passedCP(answer, attempts, updatedAt) {
  return cpMeta('passed', answer, 'Solid reasoning — passed.', attempts || 1, updatedAt || 1000);
}

function modProgress(overrides) {
  return Object.assign({
    checkpoints: [],
    checkpointMeta: {},
    complete: false,
    unlocked: true,
    startedAt: 500,
    lastVisitedAt: 500,
    lastScrollY: 0,
    maxReadPercent: 0,
    completedAt: null,
    videoChapters: { completed: [], current: 0 }
  }, overrides || {});
}

function baseRaw(overrides) {
  return Object.assign({
    schemaVersion: 3,
    student: {
      name: '',
      introResponse: '',
      introComplete: false,
      joined: '',
      responses: [],
      background: '',
      cadenceMemory: {
        profile: { backgroundSummary: '', roleTags: [], goals: [], hesitationTags: [] },
        patterns: { strengths: [], focusAreas: [] },
        notableAnswers: [],
        updatedAt: null
      }
    },
    progress: {},
    guide: { currentModule: 0 },
    resume: { lastView: 'home', moduleId: 0, scrollY: 0, updatedAt: 0 }
  }, overrides || {});
}

// ── Assertion bookkeeping ──────────────────────────────────────────────

const results = [];

function check(fixtureName, label, condition, detail) {
  results.push({
    fixture: fixtureName,
    label,
    pass: !!condition,
    detail: condition ? '' : (detail || '')
  });
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== 'object') return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  if (aKeys.length !== bKeys.length) return false;
  for (let i = 0; i < aKeys.length; i++) {
    if (aKeys[i] !== bKeys[i]) return false;
  }
  return aKeys.every((key) => deepEqual(a[key], b[key]));
}

// ── Fixtures ────────────────────────────────────────────────────────────

// 1. Fresh student — no localStorage entry at all.
(function fixture1() {
  const name = '1. Fresh student';
  const h = createHarness();
  h.window.APP_STATE.load();
  const d = h.window.APP_STATE.data;
  check(name, 'schemaVersion stamped 4', d.schemaVersion === 4);
  check(name, 'slot 11 (AI) exists and empty', deepEqual(d.progress['11'].checkpointMeta, {}) && d.progress['11'].complete === false);
  check(name, 'slot 12 (Completion) exists and empty', deepEqual(d.progress['12'].checkpointMeta, {}) && d.progress['12'].complete === false);
  check(name, 'no quarantine key written', h.localStorage.getItem(QUARANTINE_KEY) === null);
})();

// 2. Old Course Completion progress present (student already finished the
// course pre-relocation) — must relocate whole to slot 12, slot 11 fresh.
(function fixture2() {
  const name = '2. Old completed-course student relocates to slot 12';
  const h = createHarness();
  seed(h.localStorage, baseRaw({
    progress: {
      '11': modProgress({ complete: true, completedAt: 555, maxReadPercent: 100 })
    }
  }));
  h.window.APP_STATE.load();
  const d = h.window.APP_STATE.data;
  check(name, 'slot 12 inherits complete=true', d.progress['12'].complete === true);
  check(name, 'slot 12 inherits completedAt', d.progress['12'].completedAt === 555);
  check(name, 'new slot 11 (AI) is fresh, not complete', d.progress['11'].complete === false);
  check(name, 'new slot 11 (AI) has empty checkpointMeta', deepEqual(d.progress['11'].checkpointMeta, {}));
})();

// 3. Old slot 11 present but not complete (student had visited the
// completion screen without finishing, e.g. maxReadPercent > 0).
(function fixture3() {
  const name = '3. Old completion-screen visit, not complete';
  const h = createHarness();
  seed(h.localStorage, baseRaw({
    progress: {
      '11': modProgress({ complete: false, maxReadPercent: 40, lastVisitedAt: 900 })
    }
  }));
  h.window.APP_STATE.load();
  const d = h.window.APP_STATE.data;
  check(name, 'slot 12 inherits maxReadPercent', d.progress['12'].maxReadPercent === 40);
  check(name, 'slot 12 inherits lastVisitedAt', d.progress['12'].lastVisitedAt === 900);
  check(name, 'slot 12 not complete', d.progress['12'].complete === false);
  check(name, 'new slot 11 (AI) untouched by old completion-screen visit data', d.progress['11'].lastVisitedAt === null);
})();

// 4. Idempotency — state already at schemaVersion 4 must not re-relocate.
(function fixture4() {
  const name = '4. Idempotent — already migrated (schemaVersion 4)';
  const h = createHarness();
  seed(h.localStorage, baseRaw({
    schemaVersion: 4,
    progress: {
      '11': modProgress({ checkpointMeta: { m11cp1: passedCP('AI brief answer') } }),
      '12': modProgress({ complete: true })
    }
  }));
  h.window.APP_STATE.load();
  const d = h.window.APP_STATE.data;
  check(name, 'slot 11 (AI) checkpoint state preserved, not wiped', d.progress['11'].checkpointMeta.m11cp1 && d.progress['11'].checkpointMeta.m11cp1.status === 'passed');
  check(name, 'slot 12 completion preserved, not re-relocated', d.progress['12'].complete === true);
})();

// 5. Malformed slot 11 — fail closed, quarantine, safe defaults for both
// 11 and 12.
(function fixture5() {
  const name = '5. Malformed slot 11 — quarantine + fail closed';
  const h = createHarness();
  const malformedSlot11 = 'not-an-object';
  seed(h.localStorage, baseRaw({
    progress: { '11': malformedSlot11 }
  }));
  h.window.APP_STATE.load();
  const d = h.window.APP_STATE.data;
  check(name, 'slot 11 safe empty default', deepEqual(d.progress['11'].checkpointMeta, {}) && d.progress['11'].complete === false);
  check(name, 'slot 12 safe empty default (no false completion)', deepEqual(d.progress['12'].checkpointMeta, {}) && d.progress['12'].complete === false);
  const quarantined = h.localStorage.getItem(QUARANTINE_KEY);
  check(name, 'quarantine key written', quarantined !== null);
  let parsed = null;
  try { parsed = JSON.parse(quarantined); } catch (e) {}
  check(name, 'quarantine contains original malformed slot11 verbatim', !!parsed && parsed.slot11 === malformedSlot11);
})();

// 6. Review Mode — malformed data must not persist a quarantine write.
(function fixture6() {
  const name = '6. Review Mode — malformed slot 11, no quarantine persisted';
  const h = createHarness();
  seed(h.localStorage, baseRaw({
    progress: { '11': ['bad', 'shape'] }
  }));
  h.window.ReviewMode._active = true;
  h.window.APP_STATE.load();
  check(name, 'no quarantine key written while Review Mode active', h.localStorage.getItem(QUARANTINE_KEY) === null);
})();

// 7. guide.currentModule / resume.moduleId remap — exactly 11 becomes 12.
(function fixture7() {
  const name = '7. Navigation pointers remap 11 -> 12';
  const h = createHarness();
  seed(h.localStorage, baseRaw({
    progress: { '11': modProgress({ complete: true }) },
    guide: { currentModule: 11 },
    resume: { lastView: 'lesson', moduleId: 11, scrollY: 300, updatedAt: 42 }
  }));
  // Review Mode isolates this assertion from the real unlock chain (modules
  // 0-10 aren't seeded as complete here) — canAccessModule(12) would
  // otherwise be false and _syncDerivedState() would reset the pointer to
  // the real highest-unlocked module, masking the migration's own remap.
  // Matches tests/module-09-migration.test.js fixtures 18-19.
  h.window.ReviewMode._active = true;
  h.window.APP_STATE.load();
  const d = h.window.APP_STATE.data;
  check(name, 'guide.currentModule remapped to 12', d.guide.currentModule === 12);
  check(name, 'resume.moduleId remapped to 12', d.resume.moduleId === 12);
})();

// 8. Ruled-out fields — a number that merely equals 11 elsewhere must not
// be remapped.
(function fixture8() {
  const name = '8. Ruled-out numeric fields unaffected';
  const h = createHarness();
  seed(h.localStorage, baseRaw({
    progress: {
      '11': modProgress({ complete: true }),
      '5': modProgress({ checkpointMeta: { m5cp1: passedCP('answer', 11, 1000) } })
    },
    resume: { lastView: 'home', moduleId: 0, scrollY: 11, updatedAt: 0 }
  }));
  h.window.APP_STATE.load();
  const d = h.window.APP_STATE.data;
  check(name, 'unrelated attempts counter (11) unchanged', d.progress['5'].checkpointMeta.m5cp1.attempts === 11);
  check(name, 'unrelated scrollY (11) unchanged', d.resume.scrollY === 11);
  check(name, 'resume.moduleId (0, not 11) unaffected', d.resume.moduleId === 0);
})();

// 9. Modules 0–10 regression — untouched by this migration.
(function fixture9() {
  const name = '9. Modules 0-10 regression, unaffected';
  const h = createHarness();
  seed(h.localStorage, baseRaw({
    progress: {
      '3': modProgress({ checkpointMeta: { cp1: passedCP('anatomy answer') }, complete: true }),
      '9': modProgress({ checkpointMeta: { m10cp1: passedCP('pricing answer') } }),
      '10': modProgress({ checkpointMeta: { m9cp1: passedCP('sanitation answer') } }),
      '11': modProgress({ complete: true })
    }
  }));
  h.window.APP_STATE.load();
  const d = h.window.APP_STATE.data;
  check(name, 'module 3 checkpoint state unchanged', d.progress['3'].checkpointMeta.cp1.status === 'passed');
  check(name, 'module 9 checkpoint state unchanged', d.progress['9'].checkpointMeta.m10cp1.status === 'passed');
  check(name, 'module 10 checkpoint state unchanged', d.progress['10'].checkpointMeta.m9cp1.status === 'passed');
})();

// 10. Malformed quarantine survives a full migrate -> sanitize -> derive ->
// save -> reload cycle, and does not re-quarantine on the second load.
(function fixture10() {
  const name = '10. Malformed quarantine survives full cycle, idempotent on reload';
  const h = createHarness();
  // isWellFormedModuleProgressShape excludes arrays, so this forces the
  // malformed branch.
  const malformedArray = ['x'];
  seed(h.localStorage, baseRaw({
    progress: { '11': malformedArray }
  }));

  h.window.APP_STATE.load(); // first load: migrate -> sanitize -> derive -> save

  const persistedAfterFirstLoad = h.localStorage.getItem('levo_app');
  const quarantineAfterFirstLoad = h.localStorage.getItem(QUARANTINE_KEY);
  check(name, 'levo_app persisted after first load', persistedAfterFirstLoad !== null);
  check(name, 'quarantine persisted after first load', quarantineAfterFirstLoad !== null);

  const persistedState = JSON.parse(persistedAfterFirstLoad);
  check(name, 'persisted schemaVersion is 4', persistedState.schemaVersion === 4);
  check(name, 'persisted slot 11 safe empty, no false completion', deepEqual(persistedState.progress['11'].checkpointMeta, {}) && persistedState.progress['11'].complete === false);
  check(name, 'persisted slot 12 safe empty, no false completion', deepEqual(persistedState.progress['12'].checkpointMeta, {}) && persistedState.progress['12'].complete === false);

  h.window.APP_STATE.load(); // second load — simulates a fresh page load
  const quarantineAfterSecondLoad = h.localStorage.getItem(QUARANTINE_KEY);
  check(name, 'quarantine key untouched by second load (no re-quarantine)', quarantineAfterSecondLoad === quarantineAfterFirstLoad);
  check(name, 'slots 11/12 still show no false completion after reload', h.window.APP_STATE.data.progress['11'].complete === false && h.window.APP_STATE.data.progress['12'].complete === false);
})();

// ── Report ──────────────────────────────────────────────────────────────

const byFixture = new Map();
results.forEach((r) => {
  if (!byFixture.has(r.fixture)) byFixture.set(r.fixture, []);
  byFixture.get(r.fixture).push(r);
});

let totalPass = 0;
let totalFail = 0;
console.log('\nModule 11 -> 12 structural relocation migration — fixture results\n' + '='.repeat(60));
for (const [fixture, checks] of byFixture) {
  const fail = checks.filter((c) => !c.pass);
  const status = fail.length === 0 ? 'PASS' : 'FAIL';
  if (fail.length === 0) totalPass++; else totalFail++;
  console.log(`[${status}] ${fixture}`);
  checks.forEach((c) => {
    if (!c.pass) {
      console.log(`    ✗ ${c.label}${c.detail ? ' — ' + c.detail : ''}`);
    }
  });
}
console.log('='.repeat(60));
console.log(`${totalPass} fixture(s) passed, ${totalFail} fixture(s) failed (${results.length} total assertions).`);

if (totalFail > 0) {
  process.exitCode = 1;
}
