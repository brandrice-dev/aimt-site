// Endpoint integration for the Section 8 attempt ladder.
//
// Defect (audit at ade9602): start-attempt.js and get-status.js called
// determineNextAttemptEligibility({ attempts, config }) WITHOUT the
// student's remediation assignments or educator requests, so the ladder
// always saw [] for both:
//   - a failed critical domain could never be cleared (permanent block,
//     even after the student completed the required review);
//   - Attempt 3's required-remediation gate was never enforced;
//   - Attempt 4 could never be unlocked by educator authorization.
// The pure ladder (attempt-ladder.mjs) was correct and is unchanged; these
// tests drive the REAL endpoint handlers against an in-memory PostgREST mock.
//
// Run: node --test tests/certification-retake-gate-integration.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequestPost as startAttempt } from '../functions/api/certification/start-attempt.js';
import { onRequestGet as getStatus } from '../functions/api/certification/get-status.js';
import { onRequestPost as completeRemediation } from '../functions/api/certification/complete-remediation.js';

const ENV = { SUPABASE_URL: 'https://mock.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role' };
const COURSE = 'headspa-mastery';
const STUDENT = { id: 'user-student', email: 'student@example.com' };
const OTHER = { id: 'user-other', email: 'other@example.com' };
const CLEARED = ['D1', 'D2', 'D3', 'D4'].map((domainId) => ({ domainId, cleared: true }));
const D2_FAILED = CLEARED.map((d) => (d.domainId === 'D2' ? { ...d, cleared: false } : d));

// ---- in-memory PostgREST -------------------------------------------------

function completedProgress() {
  const progress = {};
  for (let m = 0; m <= 11; m++) progress[String(m)] = { complete: true };
  return { progress };
}

function createDb() {
  let seq = 0;
  const db = {
    failTables: new Set(),
    tables: {
      course_entitlements: [{ checkout_session_id: 'cs_1', course_slug: COURSE, purchaser_email: STUDENT.email, user_id: STUDENT.id }],
      course_progress: [{ user_id: STUDENT.id, course_slug: COURSE, state: completedProgress() }],
      certification_attempts: [],
      certification_remediation_assignments: [],
      certification_educator_requests: [],
    },
    nextId: (p) => `${p}-${++seq}`,
  };
  return db;
}

function matches(row, params) {
  for (const [key, raw] of params) {
    if (['select', 'order', 'limit', 'or', 'on_conflict'].includes(key)) continue;
    if (!raw.startsWith('eq.')) throw new Error(`mock: unsupported filter ${key}=${raw}`);
    if (String(row[key]) !== raw.slice(3)) return false;
  }
  return true;
}

function installFetch(db) {
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
    if (url.pathname === '/auth/v1/user') {
      const token = (init.headers?.Authorization || '').replace('Bearer ', '');
      const user = [STUDENT, OTHER].find((u) => u.id === token);
      return user ? reply(user) : reply({ msg: 'invalid' }, 401);
    }
    const table = url.pathname.replace('/rest/v1/', '');
    if (db.failTables.has(table)) return reply({ message: 'boom' }, 500);
    const rows = db.tables[table];
    if (!rows) throw new Error(`mock: unknown table ${table}`);
    const method = (init.method || 'GET').toUpperCase();
    if (method === 'GET') {
      let out = rows.filter((r) => matches(r, url.searchParams));
      if (table === 'course_entitlements') out = rows.filter((r) => r.user_id === url.searchParams.get('or')?.match(/user_id\.eq\.([^,)]+)/)?.[1]);
      const order = url.searchParams.get('order');
      if (order) {
        const [col, dir] = order.split('.');
        out = out.slice().sort((a, b) => (a[col] < b[col] ? -1 : a[col] > b[col] ? 1 : 0) * (dir === 'desc' ? -1 : 1));
      }
      return reply(out);
    }
    if (method === 'POST') {
      const incoming = [].concat(JSON.parse(init.body));
      const created = incoming.map((r) => ({ id: db.nextId(table), ...r }));
      rows.push(...created);
      return reply(created, 201);
    }
    if (method === 'PATCH') {
      const patch = JSON.parse(init.body);
      const hit = rows.filter((r) => matches(r, url.searchParams));
      hit.forEach((r) => Object.assign(r, patch));
      return reply(hit);
    }
    throw new Error(`mock: unsupported method ${method}`);
  };
  return () => { globalThis.fetch = original; };
}

async function call(db, handler, user, body) {
  const restore = installFetch(db);
  try {
    const request = {
      url: 'https://aimtrichology.com/api/certification/x',
      headers: { get: (n) => (n === 'Authorization' ? `Bearer ${user.id}` : null) },
      json: async () => body || {},
      text: async () => JSON.stringify(body || {}),
    };
    const res = await handler({ request, env: ENV });
    return { status: res.status, body: await res.json() };
  } finally {
    restore();
  }
}

function addAttempt(db, attemptNumber, decision, criticalDomainResults = CLEARED, user = STUDENT) {
  const row = {
    id: `att-${user.id}-${attemptNumber}`, user_id: user.id, course_slug: COURSE, assessment_version: 'headspa-fe-assessment-v1', bank_version: 'headspa-fe-bank-v1-2026-08-26', attempt_number: attemptNumber,
    status: decision ? 'scored' : 'in_progress', certification_decision: decision, critical_domain_results: criticalDomainResults,
    part1_selected_ids: [], part2_selected_ids: [], part3_selected_ids: [], part1_responses: {},
  };
  db.tables.certification_attempts.push(row);
  return row;
}

function addRemediation(db, fields) {
  const row = {
    id: db.nextId('rem'), user_id: STUDENT.id, course_slug: COURSE, attempt_id: 'att', competency_area: null, critical_domain: null,
    module_ref: null, section_ref: null, remediation_activity: 'course_review', required_before_next_attempt: true, completed: false, ...fields,
  };
  db.tables.certification_remediation_assignments.push(row);
  return row;
}

const newestAttempt = (db) => db.tables.certification_attempts.filter((a) => a.user_id === STUDENT.id).sort((a, b) => b.attempt_number - a.attempt_number)[0];

// ---- failed critical domain -> remediation -> Attempt 2 ------------------

test('failed critical domain blocks the next attempt until its review is completed, then Attempt 2 starts', async () => {
  const db = createDb();
  addAttempt(db, 1, 'not_yet_passed', D2_FAILED);
  const rem = addRemediation(db, { critical_domain: 'D2' });

  const blocked = await call(db, startAttempt, STUDENT);
  assert.equal(blocked.status, 409);
  assert.equal(blocked.body.blockedReason, 'critical_domain_remediation_required');
  assert.deepEqual(blocked.body.details.domains, ['D2']);
  assert.equal(db.tables.certification_attempts.length, 1, 'no attempt row written while blocked');

  const status = await call(db, getStatus, STUDENT);
  assert.equal(status.body.state, 'D');
  assert.equal(status.body.ladder.blockedReason, 'critical_domain_remediation_required');
  assert.deepEqual(status.body.remediation.map((r) => r.id), [rem.id], 'Remediation Plan shows the gating row');

  const done = await call(db, completeRemediation, STUDENT, { remediationId: rem.id });
  assert.equal(done.body.completed, true);

  const afterStatus = await call(db, getStatus, STUDENT);
  assert.deepEqual(afterStatus.body.ladder, { canStartNewAttempt: true, nextAttemptNumber: 2 });

  const started = await call(db, startAttempt, STUDENT);
  assert.equal(started.status, 200, JSON.stringify(started.body));
  assert.equal(started.body.resumed, false);
  assert.equal(started.body.attempt.attemptNumber, 2);
  assert.equal(newestAttempt(db).attempt_number, 2);
});

test('a completed review for a DIFFERENT domain does not clear the failed one', async () => {
  const db = createDb();
  addAttempt(db, 1, 'not_yet_passed', D2_FAILED);
  addRemediation(db, { critical_domain: 'D3', completed: true });
  const res = await call(db, startAttempt, STUDENT);
  assert.equal(res.status, 409);
  assert.deepEqual(res.body.details.domains, ['D2']);
});

// ---- required review before Attempt 3 -----------------------------------

test('Attempt 3 is locked until required remediation is complete, then starts', async () => {
  const db = createDb();
  addAttempt(db, 1, 'not_yet_passed');
  addAttempt(db, 2, 'not_yet_passed');
  const a = addRemediation(db, { competency_area: 'Contraindication screening', module_ref: '4' });
  const b = addRemediation(db, { competency_area: 'Scalp assessment', module_ref: '3' });

  const blocked = await call(db, startAttempt, STUDENT);
  assert.equal(blocked.status, 409);
  assert.equal(blocked.body.blockedReason, 'remediation_required');
  assert.equal(blocked.body.details.outstandingCount, 2);

  await call(db, completeRemediation, STUDENT, { remediationId: a.id });
  const stillBlocked = await call(db, startAttempt, STUDENT);
  assert.equal(stillBlocked.body.blockedReason, 'remediation_required');
  assert.equal(stillBlocked.body.details.outstandingCount, 1);

  await call(db, completeRemediation, STUDENT, { remediationId: b.id });
  const started = await call(db, startAttempt, STUDENT);
  assert.equal(started.status, 200, JSON.stringify(started.body));
  assert.equal(started.body.attempt.attemptNumber, 3);
});

test('another student\'s or another course\'s completed remediation never satisfies this student\'s gate', async () => {
  const db = createDb();
  addAttempt(db, 1, 'not_yet_passed');
  addAttempt(db, 2, 'not_yet_passed');
  addRemediation(db, { competency_area: 'Scalp assessment' });
  addRemediation(db, { user_id: OTHER.id, competency_area: 'Scalp assessment', completed: true });
  addRemediation(db, { course_slug: 'hair-loss-foundations', competency_area: 'Scalp assessment', completed: true });
  const res = await call(db, startAttempt, STUDENT);
  assert.equal(res.body.blockedReason, 'remediation_required');
  assert.equal(res.body.details.outstandingCount, 1);
});

// ---- educator authorization for Attempt 4 -------------------------------

test('Attempt 4 requires educator authorization; a pending request is not enough; authorization unlocks it', async () => {
  const db = createDb();
  addAttempt(db, 1, 'not_yet_passed');
  addAttempt(db, 2, 'not_yet_passed');
  addAttempt(db, 3, 'not_yet_passed');

  const none = await call(db, startAttempt, STUDENT);
  assert.equal(none.status, 409);
  assert.equal(none.body.blockedReason, 'educator_authorization_required');

  db.tables.certification_educator_requests.push({ id: 'edu-1', user_id: STUDENT.id, course_slug: COURSE, attempt_id: 'att-user-student-3', status: 'requested', attempt4_authorized: false, requested_at: '2026-10-01T00:00:00Z' });
  const pending = await call(db, startAttempt, STUDENT);
  assert.equal(pending.body.blockedReason, 'educator_authorization_required');
  const pendingStatus = await call(db, getStatus, STUDENT);
  assert.equal(pendingStatus.body.educatorRequest.status, 'requested');

  // Educator records authorization out of band (service role / SQL editor).
  Object.assign(db.tables.certification_educator_requests[0], { status: 'completed', attempt4_authorized: true });
  const statusAfter = await call(db, getStatus, STUDENT);
  assert.deepEqual(statusAfter.body.ladder, { canStartNewAttempt: true, nextAttemptNumber: 4 });

  const started = await call(db, startAttempt, STUDENT);
  assert.equal(started.status, 200, JSON.stringify(started.body));
  assert.equal(started.body.attempt.attemptNumber, 4);
});

test('another student\'s educator authorization never unlocks this student\'s Attempt 4', async () => {
  const db = createDb();
  [1, 2, 3].forEach((n) => addAttempt(db, n, 'not_yet_passed'));
  db.tables.certification_educator_requests.push({ id: 'edu-x', user_id: OTHER.id, course_slug: COURSE, attempt_id: 'x', status: 'completed', attempt4_authorized: true, requested_at: '2026-10-01T00:00:00Z' });
  const res = await call(db, startAttempt, STUDENT);
  assert.equal(res.body.blockedReason, 'educator_authorization_required');
});

test('no automatic Attempt 5: after a failed Attempt 4 the ladder routes to individual AIMT review', async () => {
  const db = createDb();
  [1, 2, 3, 4].forEach((n) => addAttempt(db, n, 'not_yet_passed'));
  db.tables.certification_educator_requests.push({ id: 'edu-1', user_id: STUDENT.id, course_slug: COURSE, attempt_id: 'a3', status: 'completed', attempt4_authorized: true, requested_at: '2026-10-01T00:00:00Z' });
  const res = await call(db, startAttempt, STUDENT);
  assert.equal(res.status, 409);
  assert.equal(res.body.blockedReason, 'individual_aimt_review');
  assert.equal(db.tables.certification_attempts.length, 4);
});

// ---- resumption + fail-closed ---------------------------------------------

test('an in-progress attempt resumes, even if the gate rows cannot be read', async () => {
  const db = createDb();
  addAttempt(db, 1, 'not_yet_passed', D2_FAILED);
  addAttempt(db, 2, null);
  db.failTables.add('certification_remediation_assignments');
  const res = await call(db, startAttempt, STUDENT);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.resumed, true);
  assert.equal(res.body.attempt.attemptNumber, 2);
  assert.equal(db.tables.certification_attempts.length, 2, 'resume never writes a new attempt');
});

test('fails closed: no new attempt is started when remediation or educator rows cannot be read', async () => {
  for (const table of ['certification_remediation_assignments', 'certification_educator_requests']) {
    const db = createDb();
    addAttempt(db, 1, 'not_yet_passed');
    addAttempt(db, 2, 'not_yet_passed');
    addRemediation(db, { competency_area: 'Scalp assessment' });
    db.failTables.add(table);
    const res = await call(db, startAttempt, STUDENT);
    assert.equal(res.status, 503, table);
    assert.equal(db.tables.certification_attempts.length, 2, `${table}: no attempt row written`);
  }
});

// ---- get-status never reports eligibility it couldn't verify -------------

const GATE_TABLES = ['certification_remediation_assignments', 'certification_educator_requests'];

function assertUnverified(res, label) {
  assert.equal(res.status, 503, label);
  assert.equal(res.body.retryable, true, label);
  assert.match(res.body.error, /try again/i, label);
  assert.equal(res.body.ladder, undefined, `${label}: no eligibility is advertised`);
  assert.equal(res.body.educatorRequest, undefined, `${label}: no authorization state is reported`);
}

test('get-status returns 503 (not a retake) when remediation rows cannot be read before Attempt 3', async () => {
  // With [] as a fallback this student would be shown Attempt 3 as available.
  for (const table of GATE_TABLES) {
    const db = createDb();
    addAttempt(db, 1, 'not_yet_passed');
    addAttempt(db, 2, 'not_yet_passed');
    addRemediation(db, { competency_area: 'Scalp assessment' });
    db.failTables.add(table);
    assertUnverified(await call(db, getStatus, STUDENT), table);
  }
});

test('get-status returns 503 (not "authorization required") when educator rows cannot be read before Attempt 4', async () => {
  // With [] as a fallback an authorized student would be told authorization is missing.
  for (const table of GATE_TABLES) {
    const db = createDb();
    [1, 2, 3].forEach((n) => addAttempt(db, n, 'not_yet_passed'));
    db.tables.certification_educator_requests.push({ id: 'edu-1', user_id: STUDENT.id, course_slug: COURSE, attempt_id: 'a3', status: 'completed', attempt4_authorized: true, requested_at: '2026-10-01T00:00:00Z' });
    db.failTables.add(table);
    assertUnverified(await call(db, getStatus, STUDENT), table);
  }
});

test('get-status returns 503 for a failed critical domain when gate rows cannot be read', async () => {
  for (const table of GATE_TABLES) {
    const db = createDb();
    addAttempt(db, 1, 'not_yet_passed', D2_FAILED);
    addRemediation(db, { critical_domain: 'D2', completed: true });
    db.failTables.add(table);
    assertUnverified(await call(db, getStatus, STUDENT), table);
  }
});

test('get-status still reports certified and in-progress states while gate rows are unreadable', async () => {
  for (const table of GATE_TABLES) {
    const certified = createDb();
    addAttempt(certified, 1, 'not_yet_passed');
    addAttempt(certified, 2, 'pass');
    certified.failTables.add(table);
    const c = await call(certified, getStatus, STUDENT);
    assert.equal(c.status, 200, table);
    assert.equal(c.body.state, 'C');
    assert.equal(c.body.ladder.alreadyCertified, true);

    const inProgress = createDb();
    addAttempt(inProgress, 1, 'not_yet_passed');
    addAttempt(inProgress, 2, null);
    inProgress.failTables.add(table);
    const b = await call(inProgress, getStatus, STUDENT);
    assert.equal(b.status, 200, table);
    assert.equal(b.body.state, 'B');
    assert.equal(b.body.ladder.resumeAttemptNumber, 2);
    assert.equal(b.body.inProgressAttempt.attemptNumber, 2);
  }
});

test('get-status recovers with the correct ladder once the gate tables are readable again', async () => {
  for (const table of GATE_TABLES) {
    const db = createDb();
    [1, 2, 3].forEach((n) => addAttempt(db, n, 'not_yet_passed'));
    db.tables.certification_educator_requests.push({ id: 'edu-1', user_id: STUDENT.id, course_slug: COURSE, attempt_id: 'a3', status: 'completed', attempt4_authorized: true, requested_at: '2026-10-01T00:00:00Z' });
    db.failTables.add(table);
    assert.equal((await call(db, getStatus, STUDENT)).status, 503, table);

    db.failTables.delete(table);
    const recovered = await call(db, getStatus, STUDENT);
    assert.equal(recovered.status, 200, table);
    assert.equal(recovered.body.state, 'D');
    assert.deepEqual(recovered.body.ladder, { canStartNewAttempt: true, nextAttemptNumber: 4 });
    const started = await call(db, startAttempt, STUDENT);
    assert.equal(started.status, 200, `${table}: ${JSON.stringify(started.body)}`);
    assert.equal(started.body.attempt.attemptNumber, 4);
  }
});

test('first attempt and certified students are unaffected', async () => {
  const fresh = createDb();
  const first = await call(fresh, startAttempt, STUDENT);
  assert.equal(first.status, 200, JSON.stringify(first.body));
  assert.equal(first.body.attempt.attemptNumber, 1);

  const certified = createDb();
  addAttempt(certified, 1, 'pass');
  const res = await call(certified, startAttempt, STUDENT);
  assert.equal(res.status, 409);
  assert.equal(res.body.state, 'certified');
});
