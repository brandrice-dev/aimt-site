/**
 * Module 9 ↔ 10 reorder — saved-state migration test matrix.
 *
 * Deterministic, dependency-free fixtures for the migration implemented in
 * assets/js/headspa-state.js (migrateModule9ReorderIfNeeded), per the
 * approved design in
 * docs/course-audit/modules/module-09-reorder-migration-plan.md and the
 * 20-case matrix required by
 * docs/course-audit/00-aimt-course-audit-master-instructions.md.
 *
 * Run with: node tests/module-09-migration.test.js
 * No npm dependencies — uses only Node's built-in `vm`, `fs`, `path`.
 *
 * Note (Module 11 -> 12 structural relocation): SCHEMA_VERSION was bumped
 * 3 -> 4 in assets/js/headspa-state.js for the unrelated
 * migrateModule11To12IfNeeded() migration (see
 * tests/module-11-relocation-migration.test.js). Final persisted/in-memory
 * schemaVersion assertions below were updated from the literal 3 to 4 to
 * match — this migration's own behavior (the 9<->10 swap itself) is
 * unchanged.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const STATE_SOURCE = fs.readFileSync(
  path.join(__dirname, '..', 'assets', 'js', 'headspa-state.js'),
  'utf8'
);

const QUARANTINE_KEY = 'aimt_module9_reorder_quarantine';

// Post-reorder checkpoint map — matches the structural swap this migration
// is written to support (headspa-mastery.html's MODULE_CHECKPOINTS after
// implementation): slot 9 = Pricing/Closing (m10cp*), slot 10 = Sanitation
// (m9cp*).
const MODULE_CHECKPOINTS_POST_REORDER = {
  '0': ['m0cp1'],
  '1': ['m1cp1', 'm1cp2'],
  '2': ['m2cp1'],
  '3': ['m3cp1', 'm3cp2'],
  '4': ['m4cp1', 'm4cp2'],
  '5': ['m5cp1', 'm5cp2'],
  '6': ['m6cp1', 'm6cp2'],
  '7': ['m7cp1', 'm7cp2'],
  '8': ['m8cp1', 'm8cp2'],
  '9': ['m10cp1', 'm10cp2'],
  '10': ['m9cp1', 'm9cp2'],
  '11': []
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
      MODULE_CHECKPOINTS: MODULE_CHECKPOINTS_POST_REORDER
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

function retryCP(answer, feedback, attempts, updatedAt) {
  return cpMeta('retry', answer, feedback || 'Add one more detail.', attempts || 1, updatedAt || 1000);
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
    schemaVersion: 2,
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
  check(name, 'schemaVersion stamped current (4 — see Module 11->12 relocation migration)', d.schemaVersion === 4);
  check(name, 'slot 9 has empty checkpointMeta', deepEqual(d.progress['9'].checkpointMeta, {}));
  check(name, 'slot 10 has empty checkpointMeta', deepEqual(d.progress['10'].checkpointMeta, {}));
  check(name, 'slot 9 not complete', d.progress['9'].complete === false);
  check(name, 'slot 10 not complete', d.progress['10'].complete === false);
  check(name, 'no quarantine key written', h.localStorage.getItem(QUARANTINE_KEY) === null);
})();

// 2. Old Sanitation completed only.
(function fixture2() {
  const name = '2. Old Sanitation completed only';
  const h = createHarness();
  seed(h.localStorage, baseRaw({
    progress: {
      '9': modProgress({
        checkpointMeta: { m9cp1: passedCP('Reset log answer A'), m9cp2: passedCP('Reset log answer B') },
        complete: true
      }),
      '10': modProgress()
    }
  }));
  h.window.APP_STATE.load();
  const d = h.window.APP_STATE.data;
  check(name, 'new slot 10 (Sanitation) has m9cp1 passed', d.progress['10'].checkpointMeta.m9cp1 && d.progress['10'].checkpointMeta.m9cp1.status === 'passed');
  check(name, 'new slot 10 (Sanitation) has m9cp2 passed', d.progress['10'].checkpointMeta.m9cp2 && d.progress['10'].checkpointMeta.m9cp2.status === 'passed');
  check(name, 'new slot 10 recomputed complete=true', d.progress['10'].complete === true);
  check(name, 'new slot 9 (Pricing) has no passed checkpoints', !d.progress['9'].checkpointMeta.m10cp1 && !d.progress['9'].checkpointMeta.m10cp2);
  check(name, 'new slot 9 recomputed complete=false (does not inherit old complete)', d.progress['9'].complete === false);
})();

// 3. Old Pricing completed only.
(function fixture3() {
  const name = '3. Old Pricing completed only';
  const h = createHarness();
  seed(h.localStorage, baseRaw({
    progress: {
      '9': modProgress(),
      '10': modProgress({
        checkpointMeta: { m10cp1: passedCP('Menu answer A'), m10cp2: passedCP('Feedback answer B') },
        complete: true
      })
    }
  }));
  h.window.APP_STATE.load();
  const d = h.window.APP_STATE.data;
  check(name, 'new slot 9 (Pricing) has m10cp1 passed', d.progress['9'].checkpointMeta.m10cp1 && d.progress['9'].checkpointMeta.m10cp1.status === 'passed');
  check(name, 'new slot 9 (Pricing) has m10cp2 passed', d.progress['9'].checkpointMeta.m10cp2 && d.progress['9'].checkpointMeta.m10cp2.status === 'passed');
  check(name, 'new slot 9 recomputed complete=true', d.progress['9'].complete === true);
  check(name, 'new slot 10 (Sanitation) has no passed checkpoints', !d.progress['10'].checkpointMeta.m9cp1 && !d.progress['10'].checkpointMeta.m9cp2);
  check(name, 'new slot 10 recomputed complete=false', d.progress['10'].complete === false);
})();

// 4. Both completed.
(function fixture4() {
  const name = '4. Both completed';
  const h = createHarness();
  seed(h.localStorage, baseRaw({
    progress: {
      '9': modProgress({ checkpointMeta: { m9cp1: passedCP('S1'), m9cp2: passedCP('S2') }, complete: true }),
      '10': modProgress({ checkpointMeta: { m10cp1: passedCP('P1'), m10cp2: passedCP('P2') }, complete: true })
    }
  }));
  h.window.APP_STATE.load();
  const d = h.window.APP_STATE.data;
  check(name, 'new slot 9 complete=true', d.progress['9'].complete === true);
  check(name, 'new slot 10 complete=true', d.progress['10'].complete === true);
  check(name, 'slot 9 has Pricing checkpoints', d.progress['9'].checkpointMeta.m10cp1.status === 'passed' && d.progress['9'].checkpointMeta.m10cp2.status === 'passed');
  check(name, 'slot 10 has Sanitation checkpoints', d.progress['10'].checkpointMeta.m9cp1.status === 'passed' && d.progress['10'].checkpointMeta.m9cp2.status === 'passed');
})();

// 5. Neither completed.
(function fixture5() {
  const name = '5. Neither completed';
  const h = createHarness();
  seed(h.localStorage, baseRaw({
    progress: { '9': modProgress(), '10': modProgress() }
  }));
  h.window.APP_STATE.load();
  const d = h.window.APP_STATE.data;
  check(name, 'slot 9 not complete', d.progress['9'].complete === false);
  check(name, 'slot 10 not complete', d.progress['10'].complete === false);
})();

// 6. Partial Sanitation checkpoint state.
(function fixture6() {
  const name = '6. Partial Sanitation checkpoint state';
  const h = createHarness();
  seed(h.localStorage, baseRaw({
    progress: {
      '9': modProgress({ checkpointMeta: { m9cp1: passedCP('Reset sequence answer') } }),
      '10': modProgress()
    }
  }));
  h.window.APP_STATE.load();
  const d = h.window.APP_STATE.data;
  check(name, 'new slot 10 has m9cp1 passed', d.progress['10'].checkpointMeta.m9cp1 && d.progress['10'].checkpointMeta.m9cp1.status === 'passed');
  check(name, 'new slot 10 has no m9cp2 entry', !d.progress['10'].checkpointMeta.m9cp2);
  check(name, 'new slot 10 not complete', d.progress['10'].complete === false);
})();

// 7. Partial Pricing checkpoint state — retry metadata preserved.
(function fixture7() {
  const name = '7. Partial Pricing checkpoint state';
  const h = createHarness();
  seed(h.localStorage, baseRaw({
    progress: {
      '9': modProgress(),
      '10': modProgress({
        checkpointMeta: {
          m10cp1: passedCP('Menu answer'),
          m10cp2: retryCP('Partial price-feedback answer', 'Add what you would review afterward.', 1, 2000)
        }
      })
    }
  }));
  h.window.APP_STATE.load();
  const d = h.window.APP_STATE.data;
  const cp2 = d.progress['9'].checkpointMeta.m10cp2;
  check(name, 'new slot 9 has m10cp1 passed', d.progress['9'].checkpointMeta.m10cp1.status === 'passed');
  check(name, 'new slot 9 has m10cp2 still retry', !!cp2 && cp2.status === 'retry');
  check(name, 'm10cp2 feedback preserved exactly', !!cp2 && cp2.feedback === 'Add what you would review afterward.');
  check(name, 'm10cp2 answer preserved exactly', !!cp2 && cp2.answer === 'Partial price-feedback answer');
  check(name, 'new slot 9 not complete (one checkpoint still retry)', d.progress['9'].complete === false);
})();

// 8. Mixed pass/retry metadata — every field byte-identical after swap.
(function fixture8() {
  const name = '8. Mixed pass/retry metadata preserved exactly';
  const h = createHarness();
  seed(h.localStorage, baseRaw({
    progress: {
      '9': modProgress({
        checkpointMeta: { m9cp1: passedCP('Sanitation answer', 2, 12345) }
      }),
      '10': modProgress({
        checkpointMeta: { m10cp2: retryCP('Pricing retry answer', 'Custom feedback text', 1, 54321) }
      })
    }
  }));
  h.window.APP_STATE.load();
  const d = h.window.APP_STATE.data;
  const m9cp1 = d.progress['10'].checkpointMeta.m9cp1;
  const m10cp2 = d.progress['9'].checkpointMeta.m10cp2;
  check(name, 'm9cp1 status/answer/attempts/updatedAt byte-identical', !!m9cp1 && m9cp1.status === 'passed' && m9cp1.answer === 'Sanitation answer' && m9cp1.attempts === 2 && m9cp1.updatedAt === 12345);
  check(name, 'm10cp2 status/feedback/answer/attempts/updatedAt byte-identical', !!m10cp2 && m10cp2.status === 'retry' && m10cp2.feedback === 'Custom feedback text' && m10cp2.answer === 'Pricing retry answer' && m10cp2.attempts === 1 && m10cp2.updatedAt === 54321);
})();

// 9. Already-migrated v3 state — idempotent no-op.
(function fixture9() {
  const name = '9. Already-migrated state — idempotent';
  const h = createHarness();
  const raw = baseRaw({
    schemaVersion: 3,
    progress: {
      '9': modProgress({ checkpointMeta: { m10cp1: passedCP('Already migrated pricing answer') } }),
      '10': modProgress({ checkpointMeta: { m9cp1: passedCP('Already migrated sanitation answer') } })
    }
  });
  seed(h.localStorage, raw);
  h.window.APP_STATE.load();
  const first = JSON.parse(JSON.stringify(h.window.APP_STATE.data));

  // Second load, same context, reading what was just saved — must be
  // identical (no further swap, no re-quarantine).
  h.window.APP_STATE.load();
  const second = h.window.APP_STATE.data;

  check(name, 'slot 9 still holds Pricing content after load (not re-swapped)', second.progress['9'].checkpointMeta.m10cp1 && second.progress['9'].checkpointMeta.m10cp1.status === 'passed');
  check(name, 'slot 10 still holds Sanitation content after load (not re-swapped)', second.progress['10'].checkpointMeta.m9cp1 && second.progress['10'].checkpointMeta.m9cp1.status === 'passed');
  check(name, 'running twice produces identical progress[9]/[10]', deepEqual(first.progress['9'], second.progress['9']) && deepEqual(first.progress['10'], second.progress['10']));
})();

// 10. Malformed state — quarantine + fail closed.
(function fixture10() {
  const name = '10. Malformed state — quarantine + fail closed';
  const h = createHarness();
  const malformedSlot9 = 'not-an-object-corrupted';
  const validSlot10 = modProgress({ checkpointMeta: { m10cp1: passedCP('Valid pricing answer') } });
  seed(h.localStorage, baseRaw({
    progress: { '9': malformedSlot9, '10': validSlot10 }
  }));
  h.window.APP_STATE.load();
  const d = h.window.APP_STATE.data;
  const quarantineRaw = h.localStorage.getItem(QUARANTINE_KEY);
  let quarantine = null;
  try { quarantine = JSON.parse(quarantineRaw); } catch (e) {}

  check(name, 'quarantine key written', quarantineRaw !== null);
  check(name, 'quarantine preserves original malformed slot9 verbatim', !!quarantine && quarantine.slot9 === malformedSlot9);
  check(name, 'quarantine preserves original slot10 verbatim', !!quarantine && deepEqual(quarantine.slot10, validSlot10));
  check(name, 'quarantine has quarantinedAt timestamp', !!quarantine && typeof quarantine.quarantinedAt === 'number');
  check(name, 'slot 9 reset to safe empty default', deepEqual(d.progress['9'].checkpointMeta, {}) && d.progress['9'].complete === false);
  check(name, 'slot 10 reset to safe empty default (ambiguous pair, both reset)', deepEqual(d.progress['10'].checkpointMeta, {}) && d.progress['10'].complete === false);
  check(name, 'schemaVersion stamped current (prevents re-quarantine on reload)', d.schemaVersion === 4);
})();

// 11. Review Mode — no persisted migration side effect.
(function fixture11() {
  const name = '11. Review Mode — no persisted side effect';
  const h = createHarness();
  const originalJSON = JSON.stringify(baseRaw({
    progress: {
      '9': modProgress({ checkpointMeta: { m9cp1: passedCP('Sanitation answer') }, complete: false }),
      '10': modProgress()
    }
  }));
  h.localStorage.setItem('levo_app', originalJSON);
  h.window.ReviewMode._active = true; // simulate an active review session

  h.window.APP_STATE.load();

  check(name, 'levo_app in localStorage is byte-identical to before load (unsaved)', h.localStorage.getItem('levo_app') === originalJSON);
  check(name, 'no quarantine key written under Review Mode', h.localStorage.getItem(QUARANTINE_KEY) === null);

  // Malformed variant under Review Mode — quarantine must still not persist.
  const h2 = createHarness();
  h2.localStorage.setItem('levo_app', JSON.stringify(baseRaw({ progress: { '9': 'corrupted', '10': modProgress() } })));
  h2.window.ReviewMode._active = true;
  h2.window.APP_STATE.load();
  check(name, 'malformed variant: no quarantine key written under Review Mode', h2.localStorage.getItem(QUARANTINE_KEY) === null);
})();

// 12. Remote pre-v3 state winning merge triggers migration.
// aimt-progress-sync.js's applyRemoteState() writes the remote `state` blob
// directly into localStorage['levo_app'] and then calls the same
// APP_STATE.load() exercised by every fixture above — there is only one
// materialization path (see migration plan §2.2), so a remote-sourced
// pre-v3 blob is migrated identically to a local one. This fixture proves
// the assumption is actually exercised, not merely asserted.
(function fixture12() {
  const name = '12. Remote pre-v3 state winning merge triggers migration';
  const h = createHarness();
  // Simulate pullAndMerge() having just written a remote-origin blob into
  // localStorage before calling load() — mechanically indistinguishable
  // from a local pre-v3 save.
  seed(h.localStorage, baseRaw({
    progress: {
      '9': modProgress({ checkpointMeta: { m9cp1: passedCP('Remote sanitation answer'), m9cp2: passedCP('Remote sanitation answer 2') }, complete: true }),
      '10': modProgress()
    }
  }));
  h.window.APP_STATE.load();
  const d = h.window.APP_STATE.data;
  check(name, 'remote-sourced pre-v3 blob migrates via the same load() path', d.progress['10'].checkpointMeta.m9cp1 && d.progress['10'].checkpointMeta.m9cp1.status === 'passed' && d.progress['10'].complete === true);
  check(name, 'remote-sourced slot 9 does not inherit old complete', d.progress['9'].complete === false);
})();

// 13. Regression — Modules 0–8 unaffected.
(function fixture13() {
  const name = '13. Regression — Modules 0-8 unaffected';
  const h = createHarness();
  const module5Progress = modProgress({
    checkpointMeta: {
      m5cp1: passedCP('Module 5 answer', 3, 9999),
      m5cp2: passedCP('Module 5 second answer', 1, 9998)
    },
    startedAt: 111,
    lastVisitedAt: 222,
    lastScrollY: 340,
    maxReadPercent: 87
  });
  seed(h.localStorage, baseRaw({
    progress: {
      '5': module5Progress,
      '9': modProgress({ checkpointMeta: { m9cp1: passedCP('S') } }),
      '10': modProgress({ checkpointMeta: { m10cp1: passedCP('P') } })
    }
  }));
  h.window.APP_STATE.load();
  const d = h.window.APP_STATE.data;
  const m5 = d.progress['5'];
  check(name, 'module 5 checkpointMeta byte-identical', deepEqual(m5.checkpointMeta, module5Progress.checkpointMeta));
  check(name, 'module 5 startedAt unchanged', m5.startedAt === 111);
  check(name, 'module 5 lastVisitedAt unchanged', m5.lastVisitedAt === 222);
  check(name, 'module 5 lastScrollY unchanged', m5.lastScrollY === 340);
  check(name, 'module 5 maxReadPercent unchanged', m5.maxReadPercent === 87);
  check(name, 'module 5 complete correctly recomputed true (m5cp1 passed, matches its own requirement)', m5.complete === true);
})();

// 14. resume.moduleId / guide.currentModule — old Sanitation (9 → 10).
// Note: uses Review Mode (which makes canAccessModule() return true
// unconditionally) purely to isolate the pointer-remap step itself from
// _syncDerivedState()'s separate, pre-existing, unmodified "reset an
// inaccessible resume/guide pointer to the highest unlocked module" guard —
// a real consequence of the sequential-unlock architecture (see
// module-09-reorder-migration-plan.md §2.4), not a defect this migration
// is responsible for fixing. Review Mode does not change the migration's
// own remap logic, only whether that separate guard can mask the result.
(function fixture14() {
  const name = '14. resume/guide pointer — old Sanitation 9 -> 10';
  const h = createHarness();
  seed(h.localStorage, baseRaw({
    progress: { '9': modProgress(), '10': modProgress() },
    guide: { currentModule: 9 },
    resume: { lastView: 'lesson', moduleId: 9, scrollY: 400, updatedAt: 5000 }
  }));
  h.window.ReviewMode._active = true;
  h.window.APP_STATE.load();
  const d = h.window.APP_STATE.data;
  check(name, 'guide.currentModule remapped 9 -> 10', d.guide.currentModule === 10);
  check(name, 'resume.moduleId remapped 9 -> 10', d.resume.moduleId === 10);
})();

// 15. resume.moduleId / guide.currentModule — old Pricing (10 → 9).
(function fixture15() {
  const name = '15. resume/guide pointer — old Pricing 10 -> 9';
  const h = createHarness();
  seed(h.localStorage, baseRaw({
    progress: { '9': modProgress(), '10': modProgress() },
    guide: { currentModule: 10 },
    resume: { lastView: 'lesson', moduleId: 10, scrollY: 200, updatedAt: 6000 }
  }));
  h.window.ReviewMode._active = true;
  h.window.APP_STATE.load();
  const d = h.window.APP_STATE.data;
  check(name, 'guide.currentModule remapped 10 -> 9', d.guide.currentModule === 9);
  check(name, 'resume.moduleId remapped 10 -> 9', d.resume.moduleId === 9);
})();

// 16. Unaffected pointer controls — 8 stays 8, 11 stays 11.
(function fixture16() {
  const name = '16. Unaffected pointers — 8 and 11 unchanged';
  const h = createHarness();
  seed(h.localStorage, baseRaw({
    progress: { '9': modProgress(), '10': modProgress() },
    guide: { currentModule: 8 },
    resume: { lastView: 'lesson', moduleId: 8, scrollY: 50, updatedAt: 7000 }
  }));
  h.window.ReviewMode._active = true;
  h.window.APP_STATE.load();
  const d = h.window.APP_STATE.data;
  check(name, 'guide.currentModule=8 left unchanged', d.guide.currentModule === 8);
  check(name, 'resume.moduleId=8 left unchanged', d.resume.moduleId === 8);

  const h2 = createHarness();
  seed(h2.localStorage, baseRaw({
    progress: { '9': modProgress(), '10': modProgress() },
    guide: { currentModule: 11 },
    resume: { lastView: 'home', moduleId: 11, scrollY: 0, updatedAt: 7100 }
  }));
  h2.window.ReviewMode._active = true;
  h2.window.APP_STATE.load();
  const d2 = h2.window.APP_STATE.data;
  check(name, 'guide.currentModule=11 left unchanged', d2.guide.currentModule === 11);
  check(name, 'resume.moduleId=11 left unchanged', d2.resume.moduleId === 11);
})();

// 17. Ruled-out numeric fields remain unchanged (attempts: 9, scrollY: 10).
(function fixture17() {
  const name = '17. Ruled-out numeric fields unchanged (attempts=9, scrollY=10)';
  const h = createHarness();
  seed(h.localStorage, baseRaw({
    progress: {
      '9': modProgress({ checkpointMeta: { m9cp1: passedCP('Answer with attempts 9', 9, 8000) } }),
      '10': modProgress()
    },
    resume: { lastView: 'lesson', moduleId: 0, scrollY: 10, updatedAt: 8100 }
  }));
  h.window.APP_STATE.load();
  const d = h.window.APP_STATE.data;
  const relocated = d.progress['10'].checkpointMeta.m9cp1;
  check(name, 'attempts counter (9) untouched by pointer remap', !!relocated && relocated.attempts === 9);
  check(name, 'resume.scrollY (10) untouched by pointer remap', d.resume.scrollY === 10);
  check(name, 'resume.moduleId=0 (unrelated) left unchanged', d.resume.moduleId === 0);
})();

// 18. guide.currentModule old 9 -> 10 (isolated, no resume pointer set).
(function fixture18() {
  const name = '18. guide.currentModule old 9 -> 10 (isolated)';
  const h = createHarness();
  seed(h.localStorage, baseRaw({
    progress: { '9': modProgress(), '10': modProgress() },
    guide: { currentModule: 9 }
  }));
  h.window.ReviewMode._active = true;
  h.window.APP_STATE.load();
  check(name, 'guide.currentModule remapped 9 -> 10', h.window.APP_STATE.data.guide.currentModule === 10);
})();

// 19. guide.currentModule old 10 -> 9 (isolated, no resume pointer set).
(function fixture19() {
  const name = '19. guide.currentModule old 10 -> 9 (isolated)';
  const h = createHarness();
  seed(h.localStorage, baseRaw({
    progress: { '9': modProgress(), '10': modProgress() },
    guide: { currentModule: 10 }
  }));
  h.window.ReviewMode._active = true;
  h.window.APP_STATE.load();
  check(name, 'guide.currentModule remapped 10 -> 9', h.window.APP_STATE.data.guide.currentModule === 9);
})();

// 20. Malformed quarantine survives the full cycle: migrate -> sanitize ->
// derive -> save -> reload.
(function fixture20() {
  const name = '20. Malformed quarantine survives full migrate->save->reload cycle';
  const h = createHarness();
  const malformedSlot9 = ['not', 'an', 'object'];
  seed(h.localStorage, baseRaw({
    progress: { '9': malformedSlot9, '10': modProgress() }
  }));

  h.window.APP_STATE.load(); // first load: migrate -> sanitize -> derive -> save

  const persistedAfterFirstLoad = h.localStorage.getItem('levo_app');
  const quarantineAfterFirstLoad = h.localStorage.getItem(QUARANTINE_KEY);
  check(name, 'levo_app persisted after first load (not Review Mode)', persistedAfterFirstLoad !== null);
  check(name, 'quarantine persisted after first load', quarantineAfterFirstLoad !== null);

  let quarantineParsed = null;
  try { quarantineParsed = JSON.parse(quarantineAfterFirstLoad); } catch (e) {}
  check(name, 'quarantine contains original malformed slot9 verbatim', !!quarantineParsed && deepEqual(quarantineParsed.slot9, malformedSlot9));

  const persistedState = JSON.parse(persistedAfterFirstLoad);
  check(name, 'persisted schemaVersion is current (4)', persistedState.schemaVersion === 4);
  check(name, 'persisted slot 9 is safe empty default (no false completion)', deepEqual(persistedState.progress['9'].checkpointMeta, {}) && persistedState.progress['9'].complete === false);

  // Second load — simulates a fresh page load reading the now-migrated,
  // already-quarantined state back from localStorage.
  h.window.APP_STATE.load();
  const persistedAfterSecondLoad = h.localStorage.getItem('levo_app');
  const quarantineAfterSecondLoad = h.localStorage.getItem(QUARANTINE_KEY);
  check(name, 'quarantine key untouched by second load (no re-quarantine)', quarantineAfterSecondLoad === quarantineAfterFirstLoad);
  check(name, 'levo_app stable after second load (idempotent)', JSON.parse(persistedAfterSecondLoad).schemaVersion === 4);
  check(name, 'slots 9/10 still show no false completion after reload', h.window.APP_STATE.data.progress['9'].complete === false && h.window.APP_STATE.data.progress['10'].complete === false);
})();

// ── Report ──────────────────────────────────────────────────────────────

const byFixture = new Map();
results.forEach((r) => {
  if (!byFixture.has(r.fixture)) byFixture.set(r.fixture, []);
  byFixture.get(r.fixture).push(r);
});

let totalPass = 0;
let totalFail = 0;
console.log('\nModule 9 <-> 10 reorder migration — fixture results\n' + '='.repeat(60));
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
