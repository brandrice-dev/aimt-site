/**
 * "How AIMT Works" one-time orientation — additive state fixtures.
 *
 * Covers the student.orientationComplete field added to
 * assets/js/headspa-state.js (createDefaults()/sanitizeState()), which
 * headspa-mastery.html's shouldShowOrientation()/enterCourseHomeOrOrientation()
 * read to decide whether to show the orientation instead of Course Home.
 * Those two functions live in the monolithic headspa-mastery.html script
 * (DOM-dependent — showCourse(), enterPurchasedCourseHome(), openModuleById())
 * and are not practical to load in this dependency-free vm harness, so the
 * actual show/hide ROUTING was verified by live QA (see the implementation
 * report), not here. What IS covered here, exactly like the sibling
 * module-09/module-11 migration tests, is the state layer those routing
 * functions read: does a missing/false/true orientationComplete round-trip
 * through sanitizeState()/load()/save() correctly, and does setting it
 * ever touch progress or checkpoint state.
 *
 * Run with: node tests/how-aimt-works-orientation.test.js
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
      MODULE_CHECKPOINTS: { '0': ['m0cp1'] }
    },
    document: {
      getElementById() { return null; },
      body: { classList: { add() {}, remove() {} } }
    }
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(STATE_SOURCE, context, { filename: 'headspa-state.js' });
  return { window: sandbox.window, localStorage, sessionStorage };
}

function seed(localStorage, rawStateObj) {
  localStorage.setItem('levo_app', JSON.stringify(rawStateObj));
}

// Same shape module-09-migration.test.js's baseRaw() uses, minus the
// orientationComplete field by default -- that absence IS the case this
// suite exists to cover (a pre-existing student record from before this
// field existed).
function baseRawWithoutOrientationField(overrides) {
  return Object.assign({
    schemaVersion: 4,
    student: {
      name: 'Existing Student',
      introResponse: 'x',
      introComplete: true,
      joined: 'April 2026',
      responses: ['x'],
      background: 'x',
      cadenceMemory: {
        profile: { backgroundSummary: '', roleTags: [], goals: [], hesitationTags: [] },
        patterns: { strengths: [], focusAreas: [] },
        notableAnswers: [],
        updatedAt: null
      }
    },
    progress: {
      '0': { checkpoints: ['m0cp1'], checkpointMeta: { m0cp1: { status: 'passed', answer: 'x', feedback: 'x', attempts: 1, updatedAt: 1000, lastGradedWith: null } }, complete: true, unlocked: true, startedAt: 500, lastVisitedAt: 500, lastScrollY: 0, maxReadPercent: 100, completedAt: 900, videoChapters: { completed: [], current: 0 } }
    },
    guide: { currentModule: 0 },
    resume: { lastView: 'home', moduleId: 0, scrollY: 0, updatedAt: 0 }
  }, overrides || {});
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixture: fixtureName, label, pass: !!condition, detail });
}

// 1. Brand-new student (no saved state at all) defaults to NOT oriented --
// createDefaults() must include the field, and it must default false, or
// a fresh student would silently skip the orientation.
(function fixture1() {
  const name = '1. Fresh student defaults to orientationComplete=false';
  const h = createHarness();
  h.window.APP_STATE.load(); // no seed -- localStorage empty, uses createDefaults()
  check(name, 'orientationComplete is false on a brand-new student', h.window.APP_STATE.data.student.orientationComplete === false);
})();

// 2. Existing pre-launch student who has never had this field: raw JSON
// simply has no orientationComplete key at all. sanitizeState() must
// treat that exactly like false (show the orientation once), never throw,
// and never infer completion from progress.
(function fixture2() {
  const name = '2. Missing field on existing student sanitizes to false (shown once)';
  const h = createHarness();
  seed(h.localStorage, baseRawWithoutOrientationField());
  h.window.APP_STATE.load();
  check(name, 'orientationComplete missing -> sanitizes to false', h.window.APP_STATE.data.student.orientationComplete === false);
  check(name, 'introComplete (a real, separate field) still true', h.window.APP_STATE.data.student.introComplete === true);
  check(name, 'existing module 0 progress untouched by the missing field', h.window.APP_STATE.data.progress['0'].complete === true);
})();

// 3. A student who already completed the orientation stays oriented --
// sanitizeState() must not reset an explicit true back to false.
(function fixture3() {
  const name = '3. Explicit true survives sanitizeState (no orientation replay)';
  const h = createHarness();
  seed(h.localStorage, baseRawWithoutOrientationField({
    student: Object.assign({}, baseRawWithoutOrientationField().student, { orientationComplete: true })
  }));
  h.window.APP_STATE.load();
  check(name, 'orientationComplete stays true', h.window.APP_STATE.data.student.orientationComplete === true);
})();

// 4. Completing orientation (APP_STATE.setStudent, the exact call
// completeOrientationAndEnterWelcome() makes) persists to localStorage
// and survives a fresh load() -- i.e. a page reload never shows it again.
(function fixture4() {
  const name = '4. setStudent({orientationComplete:true}) persists across reload';
  const h = createHarness();
  seed(h.localStorage, baseRawWithoutOrientationField());
  h.window.APP_STATE.load();
  check(name, 'starts false', h.window.APP_STATE.data.student.orientationComplete === false);

  h.window.APP_STATE.setStudent({ orientationComplete: true });
  check(name, 'true immediately after setStudent (in-memory)', h.window.APP_STATE.data.student.orientationComplete === true);

  const persisted = JSON.parse(h.localStorage.getItem('levo_app'));
  check(name, 'true in the persisted localStorage blob', persisted.student.orientationComplete === true);

  // Simulate a page reload: a fresh load() re-reads localStorage from
  // scratch, exactly like a new page load would.
  h.window.APP_STATE.load();
  check(name, 'still true after a simulated reload', h.window.APP_STATE.data.student.orientationComplete === true);
})();

// 5. Completing orientation must not touch progress, checkpoints, or
// module completion -- it lives on `student`, a sibling of `progress`,
// never inside it. Snapshot progress before and after and require it to
// be byte-identical.
(function fixture5() {
  const name = '5. Orientation completion does not affect progress/checkpoint state';
  const h = createHarness();
  seed(h.localStorage, baseRawWithoutOrientationField());
  h.window.APP_STATE.load();

  const progressBefore = JSON.parse(JSON.stringify(h.window.APP_STATE.data.progress));
  h.window.APP_STATE.setStudent({ orientationComplete: true });
  const progressAfter = h.window.APP_STATE.data.progress;

  check(name, 'progress object unchanged (deep-equal)', deepEqual(progressBefore, progressAfter));
  check(name, 'module 0 still complete, not re-triggered', progressAfter['0'].complete === true);
  check(name, 'module 0 checkpoint still passed, unchanged', progressAfter['0'].checkpointMeta.m0cp1.status === 'passed');
})();

// ── Report ──────────────────────────────────────────────────────────────

const byFixture = new Map();
results.forEach((r) => {
  if (!byFixture.has(r.fixture)) byFixture.set(r.fixture, []);
  byFixture.get(r.fixture).push(r);
});

let totalPass = 0;
let totalFail = 0;
console.log('\nHow AIMT Works orientation — state fixture results\n' + '='.repeat(60));
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
