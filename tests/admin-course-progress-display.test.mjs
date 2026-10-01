// course_progress.progress_score boundary — Admin course-progress display.
//
// progress_score is AIMT's internal cross-device sync-ranking metric
// (assets/js/aimt-progress-sync.js#computeScore: +100 per complete module,
// +5/+1 per passed/attempted checkpoint, +10 intro). It is not a percentage
// and not a completion/certification authority. Admin once rendered it with
// a "%" appended ("1320% · 12 modules complete"). Admin progress is now
// completed instructional Modules 0–11 out of 12.
//
// Run: node --test tests/admin-course-progress-display.test.mjs

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { instructionalProgress, hasCourseActivity, INSTRUCTIONAL_MODULE_COUNT } from '../functions/_lib/admin/course-progress.mjs';
import { hasCompletedInstructionalModules } from '../functions/_lib/certification/auth.mjs';
import { onRequestGet as adminGet } from '../functions/api/admin/index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');
const adminHtml = read('admin.html');
const syncSrc = read('assets/js/aimt-progress-sync.js');

// The real sync-ranking formula, loaded from the production file.
const computeScore = new Function(`${syncSrc.slice(syncSrc.indexOf('function computeScore(state)'), syncSrc.indexOf('function nowIso()'))}; return computeScore;`)();

function stateWith(completeIds, { checkpointsPassed = 0, intro = true, extra = {} } = {}) {
  const progress = {};
  for (let m = 0; m <= 12; m++) {
    const cps = {};
    for (let c = 0; c < checkpointsPassed && m <= 11; c++) cps[`m${m}cp${c + 1}`] = { status: 'passed' };
    progress[String(m)] = { complete: completeIds.includes(m), checkpointMeta: cps, startedAt: null };
  }
  return { progress: { ...progress, ...extra }, student: { introComplete: intro } };
}
const range = (n) => Array.from({ length: n }, (_, i) => i);
// Fully complete student exactly as the brief describes: Modules 0–11
// complete (1200) + the course's 22 checkpoints passed (110) + intro (10).
function scoreOf1320() {
  const state = stateWith(range(12), { checkpointsPassed: 2 });
  delete state.progress['0'].checkpointMeta.m0cp1;
  delete state.progress['0'].checkpointMeta.m0cp2;
  return state;
}

// Admin's client-side formatters, extracted verbatim.
const fmtStart = adminHtml.indexOf('function progressPercent(p){');
const fmtEnd = adminHtml.indexOf('\n', adminHtml.indexOf('function progressLabel(p){'));
const { progressPercent, progressLabel } = new Function(`${adminHtml.slice(fmtStart, fmtEnd)}; return { progressPercent, progressLabel };`)();

// ── Percentage ─────────────────────────────────────────────────────────

test('progress_score 1320 with all 12 instructional modules complete shows 100%, never 1320%', () => {
  const state = scoreOf1320();
  assert.equal(computeScore(state), 1320, 'real computeScore for a fully complete student');
  const p = instructionalProgress(state);
  assert.deepEqual(p, { completed: 12, total: 12, percent: 100 });
  assert.equal(progressLabel(p), '100% · 12 of 12 modules complete');
  assert.doesNotMatch(progressLabel(p), /1320|13\d\d%/);
});

test('6/12 → 50%, 11/12 → 92%, 0/12 → 0%; Module 12 never counts', () => {
  assert.equal(progressLabel(instructionalProgress(stateWith(range(6)))), '50% · 6 of 12 modules complete');
  assert.equal(progressLabel(instructionalProgress(stateWith(range(11)))), '92% · 11 of 12 modules complete');
  assert.equal(progressLabel(instructionalProgress(stateWith([]))), '0% · 0 of 12 modules complete');
  // Modules 0–10 + Module 12 complete is still 11/12 (certification is separate).
  assert.equal(instructionalProgress(stateWith([...range(11), 12])).completed, 11);
  assert.equal(INSTRUCTIONAL_MODULE_COUNT, 12);
});

test('malformed / missing progress state fails safely to 0%', () => {
  for (const bad of [null, undefined, 'x', 42, [], {}, { progress: null }, { progress: 'x' }, { progress: [] },
    { progress: { 0: null, 1: 'done', 2: { complete: 'yes' }, 3: { complete: 1 } } }]) {
    const p = instructionalProgress(bad);
    assert.deepEqual(p, { completed: 0, total: 12, percent: 0 }, JSON.stringify(bad));
  }
  assert.equal(progressPercent(undefined), '0%');
  assert.equal(progressPercent({ percent: 1320 }), '100%', 'display clamps even if handed a bogus value');
  assert.equal(progressLabel({ percent: NaN }), '0% · 0 of 12 modules complete');
  assert.equal(progressLabel(null), '0% · 0 of 12 modules complete');
});

test('Admin percentage agrees with the authoritative Modules 0–11 completion gate', async () => {
  for (const ids of [range(12), range(11), [...range(11), 12], []]) {
    const state = stateWith(ids);
    const original = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify([{ state }]), { status: 200 });
    try {
      const gate = await hasCompletedInstructionalModules({ SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'k' }, 'u1');
      assert.equal(instructionalProgress(state).completed === 12, gate, JSON.stringify(ids));
    } finally {
      globalThis.fetch = original;
    }
  }
});

test('In progress pill is driven by real activity, not progress_score', () => {
  const fresh = stateWith([], { intro: false });
  assert.equal(hasCourseActivity(fresh), false, 'default state (all modules pre-created, none touched)');
  assert.equal(hasCourseActivity({ ...fresh, student: { introComplete: true } }), true);
  const cp = stateWith([], { intro: false });
  cp.progress['0'].checkpointMeta = { m0cp1: { status: 'attempted' } };
  assert.equal(hasCourseActivity(cp), true);
  assert.equal(hasCourseActivity(stateWith([0], { intro: false })), true);
  assert.equal(hasCourseActivity(null), false);
});

// ── Admin endpoint + page ──────────────────────────────────────────────

test('Admin API returns 12-module progress and never exposes progress_score', async () => {
  const OWNER = { id: 'owner-1', email: 'owner@example.test' };
  const STUDENT = { id: 'student-1', email: 'jane@example.test', user_metadata: { first_name: 'Jane', last_name: 'Doe' } };
  const state = scoreOf1320();
  assert.equal(computeScore(state), 1320);
  const db = {
    admin_users: [{ user_id: OWNER.id, role: 'owner', active: true }],
    course_entitlements: [{ checkout_session_id: 'cs_1', course_slug: 'headspa-mastery', purchaser_email: STUDENT.email, user_id: STUDENT.id, granted_at: '2026-08-01T00:00:00Z' }],
    course_progress: [{ user_id: STUDENT.id, course_slug: 'headspa-mastery', progress_score: computeScore(state), updated_at: '2026-09-20T00:00:00Z', state }],
    completions: [], certification_attempts: [], certification_review_requests: [], certification_educator_requests: [], certification_remediation_assignments: [],
  };
  const original = globalThis.fetch;
  globalThis.fetch = async (input, options = {}) => {
    const url = new URL(String(input));
    const ok = (b) => new Response(JSON.stringify(b), { status: 200 });
    if (url.pathname === '/auth/v1/user') return ok(OWNER);
    if (url.pathname === '/auth/v1/admin/users') return ok({ users: [OWNER, STUDENT] });
    if (url.pathname.startsWith('/auth/v1/admin/users/')) return ok(STUDENT);
    const table = url.pathname.replace('/rest/v1/', '');
    const select = (url.searchParams.get('select') || '').split(',');
    // Honour the select list so the test sees exactly what Admin requested.
    return ok((db[table] || []).map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => select.includes(k) || select.includes('*')))));
  };
  try {
    const env = { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'k' };
    const get = async (qs) => (await adminGet({ env, request: new Request(`https://x.test/api/admin?${qs}`, { headers: { Authorization: 'Bearer t' } }) })).json();
    const list = await get('view=students');
    assert.deepEqual(list.students[0].courseProgress, { completed: 12, total: 12, percent: 100 });
    assert.equal(list.students[0].started, true);
    const detail = await get(`view=student&userId=${STUDENT.id}`);
    assert.deepEqual(detail.courseProgress, { completed: 12, total: 12, percent: 100 });
    const dash = await get('view=dashboard');
    for (const body of [list, detail, dash]) assert.doesNotMatch(JSON.stringify(body), /progress_score|progressScore|1320/);
  } finally {
    globalThis.fetch = original;
  }
});

test('admin.html never appends % to progress_score', () => {
  const code = stripComments(adminHtml);
  assert.doesNotMatch(code, /progress_score|progressScore/);
  assert.doesNotMatch(code, /moduleCount\(/);
  assert.match(code, /\$\{progressPercent\(s\.courseProgress\)\}<\/td>/);
  assert.match(code, /d\.courseProgress\?progressLabel\(d\.courseProgress\):'Not started'/);
  assert.match(code, /if\(s\.started\)return '<span class="pill">In progress<\/span>'/);
});

// ── Production audit ───────────────────────────────────────────────────

function stripComments(src) {
  return src
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
}

test('progress_score is used in production code only as the sync-ranking metric', () => {
  const files = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split('\n')
    .filter((f) => /\.(html|js|mjs|sql)$/.test(f) && !f.startsWith('tests/') && !f.startsWith('docs/'));
  const users = files.filter((f) => /progress_score|progressScore/.test(stripComments(read(f))));
  assert.deepEqual(users.sort(), [
    'assets/js/aimt-progress-sync.js', // computes + compares it for the cross-device merge rule
    'supabase/migrations/20260705_create_course_progress.sql', // column definition (not renamed here)
  ]);
  // Certificate / certification / admin business logic must not read it.
  for (const f of ['functions/_lib/certification/certificate-issuance.mjs', 'functions/_lib/certification/auth.mjs',
    'functions/api/issue-certificate.js', 'functions/api/certification/finalize-assessment.js', 'functions/api/certification/get-status.js',
    'functions/api/certification/start-attempt.js', 'functions/api/admin/index.js', 'functions/_lib/admin/course-progress.mjs', 'admin.html', 'my-aimt.html']) {
    assert.doesNotMatch(stripComments(read(f)), /progress_score|progressScore/, f);
  }
  assert.match(syncSrc, /INTERNAL cross-device\s+sync-ranking metric only/);
});
