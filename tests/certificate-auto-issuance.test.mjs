// Automatic credential issuance on an authoritative PASS — regression coverage.
//
// Exercises the REAL handlers (finalize-assessment.js, issue-certificate.js,
// admin/index.js) and the one shared issuance authority
// (functions/_lib/certification/certificate-issuance.mjs) against an
// in-memory Supabase mock that enforces the real unique(user_id,
// course_slug) constraint on `completions` and yields between every call so
// concurrent requests genuinely interleave. No network.
//
// Run: node --test tests/certificate-auto-issuance.test.mjs

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { onRequestPost as finalize } from '../functions/api/certification/finalize-assessment.js';
import { onRequestPost as issueCertificate } from '../functions/api/issue-certificate.js';
import { onRequestPost as adminPost, onRequestGet as adminGet } from '../functions/api/admin/index.js';
import { onRequestGet as verifyCredential } from '../functions/api/verify-credential.js';
import { resolveCertificateName } from '../functions/_lib/certification/certificate-issuance.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const adminHtml = readFileSync(path.join(ROOT, 'admin.html'), 'utf8');
const issuanceSrc = readFileSync(path.join(ROOT, 'functions/_lib/certification/certificate-issuance.mjs'), 'utf8');
const finalizeSrc = readFileSync(path.join(ROOT, 'functions/api/certification/finalize-assessment.js'), 'utf8');
const issueEndpointSrc = readFileSync(path.join(ROOT, 'functions/api/issue-certificate.js'), 'utf8');
const adminSrc = readFileSync(path.join(ROOT, 'functions/api/admin/index.js'), 'utf8');

const ENV = { SUPABASE_URL: 'https://db.aimt.test', SUPABASE_SERVICE_ROLE_KEY: 'service-role-test' };
const SLUG = 'headspa-mastery';
const STUDENT = { id: 'student-1', email: 'jane@example.test', user_metadata: { first_name: 'Jane', last_name: 'Doe' } };
const OWNER = { id: 'owner-1', email: 'owner@example.test', user_metadata: {} };
const SUPPORT = { id: 'support-1', email: 'support@example.test', user_metadata: {} };

// ── In-memory Supabase ──────────────────────────────────────────────────

function matches(row, params) {
  for (const [key, value] of params) {
    if (['select', 'limit', 'order'].includes(key)) continue;
    if (key === 'or') {
      const ok = value.slice(1, -1).split(',').some((clause) => {
        const [col, op, ...rest] = clause.split('.');
        return op === 'eq' && String(row[col]) === rest.join('.');
      });
      if (!ok) return false;
      continue;
    }
    if (!value.startsWith('eq.')) throw new Error('unsupported filter ' + value);
    if (String(row[key]) !== value.slice(3)) return false;
  }
  return true;
}

function world({ attempts = [], completions = [], progressScore = 1200, progressState = {}, users = [STUDENT], failCompletionInserts = false, entitled = true } = {}) {
  const db = {
    course_entitlements: entitled ? [{ checkout_session_id: 'cs_live_1', course_slug: SLUG, purchaser_email: STUDENT.email, user_id: STUDENT.id, granted_at: '2026-08-01T00:00:00Z' }] : [],
    course_progress: [{ user_id: STUDENT.id, course_slug: SLUG, progress_score: progressScore, state: progressState, updated_at: '2026-09-20T00:00:00Z' }],
    certification_attempts: attempts.map((a) => ({ user_id: STUDENT.id, course_slug: SLUG, ...a })),
    certification_remediation_assignments: [],
    certification_review_requests: [],
    certification_educator_requests: [],
    completions: completions.map((c) => ({ user_id: STUDENT.id, course_slug: SLUG, revoked: false, ...c })),
    admin_users: [{ user_id: OWNER.id, role: 'owner', active: true }, { user_id: SUPPORT.id, role: 'support', active: true }],
    admin_audit_log: [],
  };
  const tokens = { student: STUDENT, owner: OWNER, support: SUPPORT };
  const authUsers = [...users, OWNER, SUPPORT];
  const writes = [];
  const state = { db, writes, failCompletionInserts };

  state.fetch = async (input, options = {}) => {
    await new Promise((r) => setImmediate(r)); // let concurrent requests interleave
    const url = new URL(String(input));
    const method = (options.method || 'GET').toUpperCase();
    const headers = options.headers || {};
    const prefer = headers.Prefer || '';
    const respond = (body, status = 200) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

    if (url.pathname === '/auth/v1/user') {
      const user = tokens[String(headers.Authorization || '').replace(/^Bearer /, '')];
      return user ? respond(user) : respond({ error: 'bad token' }, 401);
    }
    if (url.pathname === '/auth/v1/admin/users') return respond({ users: authUsers });
    if (url.pathname.startsWith('/auth/v1/admin/users/')) {
      const u = authUsers.find((x) => x.id === decodeURIComponent(url.pathname.split('/').pop()));
      return u ? respond(u) : respond({}, 404);
    }

    const table = url.pathname.replace('/rest/v1/', '');
    const rows = db[table];
    if (!rows) throw new Error('unexpected table ' + table);
    if (method === 'GET') {
      let out = rows.filter((r) => matches(r, url.searchParams));
      if (url.searchParams.get('limit')) out = out.slice(0, Number(url.searchParams.get('limit')));
      return respond(out.map((r) => ({ ...r })));
    }
    writes.push({ table, method });
    if (method === 'POST') {
      const list = [].concat(JSON.parse(options.body));
      if (table === 'completions') {
        if (state.failCompletionInserts) return respond({ message: 'database unavailable' }, 503);
        if (list.some((n) => rows.some((r) => r.user_id === n.user_id && r.course_slug === n.course_slug))) {
          return respond({ code: '23505', message: 'duplicate key value violates unique constraint' }, 409);
        }
      }
      const inserted = list.map((r) => ({ completed_at: new Date().toISOString(), revoked: false, created_at: new Date().toISOString(), ...r }));
      rows.push(...inserted);
      return respond(/return=representation/.test(prefer) ? inserted : undefined, 201);
    }
    if (method === 'PATCH') {
      const patch = JSON.parse(options.body);
      const hit = rows.filter((r) => matches(r, url.searchParams));
      hit.forEach((r) => Object.assign(r, patch));
      return respond(/return=representation/.test(prefer) ? hit : undefined, 200);
    }
    throw new Error(`unexpected ${method} ${url.pathname}`);
  };
  return state;
}

// Every request is routed to the world currently under test. Deliberately
// not save/restore-per-call: concurrent calls inside one test (the races
// below) would otherwise restore the real fetch under each other mid-flight.
const ORIGINAL_FETCH = globalThis.fetch;
let currentWorld = null;
globalThis.fetch = (input, options) => {
  if (!currentWorld) throw new Error('no mock world installed');
  return currentWorld.fetch(input, options);
};
test.after(() => { globalThis.fetch = ORIGINAL_FETCH; });

async function run(w, fn) {
  currentWorld = w;
  return fn();
}

const req = (url, body, token, method = 'POST') => new Request(url, {
  method,
  headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: method === 'POST' ? JSON.stringify(body || {}) : undefined,
});

async function callFinalize(w, attemptId = 'attempt-3') {
  const res = await run(w, () => finalize({ env: ENV, request: req('https://x.test/api/certification/finalize-assessment', { attemptId }, 'student') }));
  return { status: res.status, body: await res.json() };
}
async function callIssue(w, body = {}) {
  const res = await run(w, () => issueCertificate({ env: ENV, request: req('https://x.test/api/issue-certificate', body, 'student') }));
  return { status: res.status, body: await res.json() };
}
async function callAdminIssue(w, token = 'owner') {
  const res = await run(w, () => adminPost({ env: ENV, request: req('https://x.test/api/admin', { action: 'issue_certificate', userId: STUDENT.id }, token) }));
  return { status: res.status, body: await res.json() };
}

// A Part III-locked attempt whose stored component scores produce a PASS
// through the real scoring/decision code (same construction as
// certification-module12-concurrency.test.mjs's scoredReadyAttempt).
function lockedAttempt(score = 0.95, overrides = {}) {
  return {
    id: 'attempt-3', attempt_number: 3, status: 'part3_locked',
    part1_selected_ids: ['M01-001', 'M01-002'], part1_responses: { 'M01-001': 99, 'M01-002': 99 },
    knowledge_score: score, part2_selected_ids: [], part2_case_state: {}, applied_cases_score: score,
    part3_selected_ids: [], part3_conversation_state: {}, interview_score: score,
    overall_score: null, certification_decision: null, critical_domain_results: null,
    ...overrides,
  };
}
const scoredPass = (overrides = {}) => ({ id: 'attempt-3', attempt_number: 3, status: 'scored', certification_decision: 'pass', overall_score: 0.9, ...overrides });
const completionWrites = (w) => w.writes.filter((x) => x.table === 'completions');

// ── Architecture: one issuance authority ───────────────────────────────

test('one shared issuance authority: every path calls ensureCertificateIssued, only the helper inserts completions', () => {
  for (const src of [finalizeSrc, issueEndpointSrc, adminSrc]) assert.match(src, /ensureCertificateIssued\(/);
  for (const src of [finalizeSrc, issueEndpointSrc, adminSrc]) {
    assert.doesNotMatch(src, /supabaseRest\(env, 'completions'/, 'no second completions insert path');
    assert.doesNotMatch(src, /generateCredentialId|certification_decision:\s*'eq\.pass'/, 'no copied gate logic');
  }
  assert.match(issuanceSrc, /supabaseRest\(env, 'completions', \{\s*method: 'POST'/);
  assert.match(issuanceSrc, /certification_decision: 'eq\.pass'/);
  assert.match(issuanceSrc, /isEntitled\(env, user, courseSlug\)/);
  assert.match(issuanceSrc, /score < REQUIRED_SCORE/);
  assert.match(issuanceSrc, /export const REQUIRED_SCORE = 1200;/);
  assert.doesNotMatch(issueEndpointSrc, /request\.json\(\)/, 'client body (student_name) is never read');
});

// ── Automatic issuance on PASS ─────────────────────────────────────────

test('authoritative PASS at finalization issues the credential with no student action', async () => {
  const w = world({ attempts: [lockedAttempt()] });
  const { status, body } = await callFinalize(w);
  assert.equal(status, 200);
  assert.equal(body.decision, 'pass');
  assert.equal(body.alreadyScored, false);
  assert.equal(body.certificate.status, 'issued');
  assert.match(body.certificate.credentialId, /^AIMT-HS-\d{4}-[A-Z2-9]{6}$/);
  assert.equal(w.db.completions.length, 1);
  assert.equal(w.db.completions[0].credential_id, body.certificate.credentialId);
  assert.equal(w.db.completions[0].student_name, 'Jane Doe');
  // Student retrieval afterwards is retrieval only.
  const issue = await callIssue(w);
  assert.equal(issue.body.already_issued, true);
  assert.equal(issue.body.credential_id, body.certificate.credentialId);
  assert.equal(w.db.completions.length, 1);
});

test('two simultaneous finalization requests → one credential, same ID for both', async () => {
  const w = world({ attempts: [lockedAttempt()] });
  const [a, b] = await Promise.all([callFinalize(w), callFinalize(w)]);
  assert.equal(a.body.decision, 'pass');
  assert.equal(b.body.decision, 'pass');
  assert.equal([a, b].filter((r) => r.body.alreadyScored).length, 1, 'one CAS winner, one loser');
  assert.equal(a.body.certificate.status, 'issued');
  assert.equal(b.body.certificate.status, 'issued', 'CAS loser path also ensures the credential');
  assert.equal(a.body.certificate.credentialId, b.body.certificate.credentialId);
  assert.equal(w.db.completions.length, 1);
});

test('finalization + /api/issue-certificate at the same time → one credential', async () => {
  const w = world({ attempts: [scoredPass()] });
  const [f, i] = await Promise.all([callFinalize(w), callIssue(w)]);
  assert.equal(f.body.certificate.status, 'issued');
  assert.equal(i.status, 200);
  assert.equal(f.body.certificate.credentialId, i.body.credential_id);
  assert.equal(w.db.completions.length, 1);
});

test('finalization + Admin recovery issuance at the same time → one credential', async () => {
  const w = world({ attempts: [scoredPass()] });
  const [f, a] = await Promise.all([callFinalize(w), callAdminIssue(w)]);
  assert.equal(a.status, 200);
  assert.equal(f.body.certificate.credentialId, a.body.credential.credential_id);
  assert.equal(w.db.completions.length, 1);
});

test('repeated PASS finalization returns the same credential every time', async () => {
  const w = world({ attempts: [lockedAttempt()] });
  const ids = [];
  for (let i = 0; i < 3; i++) ids.push((await callFinalize(w)).body.certificate.credentialId);
  assert.equal(new Set(ids).size, 1);
  assert.equal(w.db.completions.length, 1);
});

test('self-healing: an already-scored PASS with no credential gets one on the next finalize call', async () => {
  const w = world({ attempts: [scoredPass()] });
  const { body } = await callFinalize(w);
  assert.equal(body.alreadyScored, true);
  assert.equal(body.decision, 'pass');
  assert.equal(body.certificate.status, 'issued');
  assert.equal(w.db.completions.length, 1);
});

test('infrastructure failure: PASS is preserved, certificate reported pending, later call heals', async () => {
  const w = world({ attempts: [lockedAttempt()], failCompletionInserts: true });
  const first = await callFinalize(w);
  assert.equal(first.status, 200);
  assert.equal(first.body.decision, 'pass');
  assert.equal(first.body.certificate.status, 'pending');
  assert.equal(w.db.certification_attempts[0].certification_decision, 'pass', 'PASS never rolled back');
  assert.equal(w.db.certification_attempts[0].status, 'scored');
  assert.equal(w.db.completions.length, 0);

  w.failCompletionInserts = false;
  const healed = await callFinalize(w);
  assert.equal(healed.body.decision, 'pass');
  assert.equal(healed.body.certificate.status, 'issued');
  assert.equal(w.db.completions.length, 1);
});

// ── Existing credential (Gabby) ────────────────────────────────────────

test('existing issued credential (Attempt 3 PASS) is reused everywhere with zero writes', async () => {
  const EXISTING = { credential_id: 'AIMT-HS-2026-GBY7K2', student_name: 'Gabriela Example', completed_at: '2026-09-18T21:04:00Z', revoked: false };
  const w = world({
    attempts: [
      { id: 'attempt-1', attempt_number: 1, status: 'scored', certification_decision: 'not_yet_passed' },
      { id: 'attempt-2', attempt_number: 2, status: 'scored', certification_decision: 'not_yet_passed' },
      scoredPass(),
    ],
    completions: [EXISTING],
  });
  const attemptsBefore = JSON.stringify(w.db.certification_attempts);

  const f = await callFinalize(w);
  assert.equal(f.body.decision, 'pass');
  assert.equal(f.body.certificate.credentialId, EXISTING.credential_id);

  const i = await callIssue(w, { student_name: 'Someone Else' });
  assert.equal(i.body.credential_id, EXISTING.credential_id);
  assert.equal(i.body.student_name, EXISTING.student_name, 'client cannot rename an issued certificate');
  assert.equal(i.body.completed_at, EXISTING.completed_at);
  assert.equal(i.body.already_issued, true);

  const a = await callAdminIssue(w);
  assert.equal(a.body.status, 'already_issued');
  assert.equal(a.body.credential.credential_id, EXISTING.credential_id);

  assert.equal(completionWrites(w).length, 0, 'no insert/update to completions at all');
  assert.equal(w.db.completions.length, 1);
  assert.deepEqual(w.db.completions[0], { user_id: STUDENT.id, course_slug: SLUG, ...EXISTING });
  assert.equal(JSON.stringify(w.db.certification_attempts), attemptsBefore, 'PASS / attempt history untouched');

  const v = await run(w, () => verifyCredential({ env: ENV, request: new Request('https://x.test/api/verify-credential?id=' + EXISTING.credential_id) }));
  const vb = await v.json();
  assert.equal(vb.valid, true);
  assert.equal(vb.credential_id, EXISTING.credential_id);
  assert.equal(vb.student_name, EXISTING.student_name);
});

// ── No issuance without an authoritative PASS ──────────────────────────

test('not_yet_passed finalization does not issue', async () => {
  const w = world({ attempts: [lockedAttempt(0.4)] });
  const { body } = await callFinalize(w);
  assert.equal(body.decision, 'not_yet_passed');
  assert.equal(body.certificate, undefined);
  assert.equal(w.db.completions.length, 0);
  const i = await callIssue(w);
  assert.equal(i.status, 409);
  assert.equal(i.body.status, 'not_passed');
  assert.equal(w.db.completions.length, 0);
});

test('in-progress attempt, modules-only completion, and unscored high component scores do not issue', async () => {
  for (const attempts of [
    [{ id: 'attempt-1', attempt_number: 1, status: 'part2_locked', certification_decision: null }],
    [],
    [lockedAttempt(0.99)], // excellent component scores, but no authoritative decision yet
  ]) {
    const w = world({ attempts, progressScore: 1300 });
    const i = await callIssue(w);
    assert.equal(i.status, 409, JSON.stringify(attempts));
    assert.equal(i.body.status, 'not_passed');
    const a = await callAdminIssue(w);
    assert.equal(a.status, 409);
    assert.equal(w.db.completions.length, 0);
  }
});

test('incomplete course progress or missing entitlement blocks issuance even with a PASS', async () => {
  const incomplete = world({ attempts: [scoredPass()], progressScore: 1100 });
  assert.equal((await callIssue(incomplete)).body.status, 'incomplete');
  assert.equal((await callFinalize(incomplete)).body.certificate.status, 'pending');
  assert.equal(incomplete.db.completions.length, 0);

  const notEntitled = world({ attempts: [scoredPass()], entitled: false });
  const r = await callIssue(notEntitled);
  assert.equal(r.status, 403);
  assert.equal(notEntitled.db.completions.length, 0);
});

test('revoked credential is never silently replaced', async () => {
  const w = world({ attempts: [scoredPass()], completions: [{ credential_id: 'AIMT-HS-2026-OLD999', student_name: 'Jane Doe', completed_at: '2026-08-01T00:00:00Z', revoked: true }] });
  const f = await callFinalize(w);
  assert.equal(f.body.decision, 'pass');
  assert.equal(f.body.certificate.status, 'pending');
  assert.equal(f.body.certificate.reason, 'revoked');
  const i = await callIssue(w);
  assert.equal(i.status, 409);
  assert.equal(i.body.status, 'revoked');
  assert.equal((await callAdminIssue(w)).body.status, 'revoked');
  assert.equal(w.db.completions.length, 1);
  assert.equal(w.db.completions[0].revoked, true);
  assert.equal(completionWrites(w).length, 0);
});

// ── Official name ──────────────────────────────────────────────────────

test('name resolution order: first+last, then full_name / name, then synced course state', () => {
  assert.equal(resolveCertificateName({ user_metadata: { first_name: ' Jane ', last_name: 'Doe', full_name: 'Ignored' } }, {}), 'Jane Doe');
  assert.equal(resolveCertificateName({ user_metadata: { first_name: 'Jane', full_name: 'Jane Q. Doe' } }, {}), 'Jane Q. Doe');
  assert.equal(resolveCertificateName({ user_metadata: { name: 'Jane Doe' } }, {}), 'Jane Doe');
  assert.equal(resolveCertificateName({ user_metadata: {} }, { student: { name: 'Jane From Course' } }), 'Jane From Course');
  assert.equal(resolveCertificateName({ user_metadata: { full_name: 'jane@example.test' } }, { student: { name: 'Graduate' } }), '', 'never an email or placeholder');
  assert.equal(resolveCertificateName(null, null), '');
});

test('full_name and synced-state fallbacks are used for real issuance', async () => {
  const fullName = { ...STUDENT, user_metadata: { full_name: 'Jane Q. Doe' } };
  const w1 = world({ attempts: [lockedAttempt()], users: [fullName] });
  w1.fetch = wrapStudentToken(w1, fullName);
  await callFinalize(w1);
  assert.equal(w1.db.completions[0].student_name, 'Jane Q. Doe');

  const noMeta = { ...STUDENT, user_metadata: {} };
  const w2 = world({ attempts: [lockedAttempt()], users: [noMeta], progressState: { student: { name: 'Jane From Course' } } });
  w2.fetch = wrapStudentToken(w2, noMeta);
  await callFinalize(w2);
  assert.equal(w2.db.completions[0].student_name, 'Jane From Course');
});

test('no usable name: PASS preserved, no malformed certificate, name_required surfaced to student and Admin', async () => {
  const nameless = { ...STUDENT, user_metadata: { full_name: 'jane@example.test' } };
  const w = world({ attempts: [lockedAttempt()], users: [nameless], progressState: { student: { name: 'Graduate' } } });
  w.fetch = wrapStudentToken(w, nameless);

  const f = await callFinalize(w);
  assert.equal(f.body.decision, 'pass');
  assert.equal(f.body.certificate.status, 'name_required');
  assert.equal(w.db.certification_attempts[0].certification_decision, 'pass');
  assert.equal(w.db.completions.length, 0, 'no certificate with an email / placeholder name');

  const i = await callIssue(w, { student_name: 'Typed In Browser' });
  assert.equal(i.status, 409);
  assert.equal(i.body.status, 'name_required');
  assert.equal(w.db.completions.length, 0, 'client-posted name is never used');

  const record = await run(w, () => adminGet({ env: ENV, request: req(`https://x.test/api/admin?view=student&userId=${STUDENT.id}`, null, 'owner', 'GET') }));
  const rb = await record.json();
  assert.deepEqual(rb.certificateIssuance, { needed: true, nameResolved: false });
  const a = await callAdminIssue(w);
  assert.equal(a.status, 409);
  assert.equal(a.body.status, 'name_required');
});

// Swap the student token's identity for name-resolution scenarios.
function wrapStudentToken(w, user) {
  const inner = w.fetch;
  return async (input, options = {}) => {
    const url = new URL(String(input));
    const auth = String((options.headers || {}).Authorization || '');
    if (url.pathname === '/auth/v1/user' && auth === 'Bearer student') {
      return new Response(JSON.stringify(user), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.pathname === `/auth/v1/admin/users/${user.id}`) {
      return new Response(JSON.stringify(user), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return inner(input, options);
  };
}

// ── Admin recovery action ──────────────────────────────────────────────

test('Admin recovery: owner issues via the shared authority, audited; support cannot', async () => {
  const w = world({ attempts: [scoredPass()] });

  const denied = await callAdminIssue(w, 'support');
  assert.equal(denied.status, 403);
  assert.equal(w.db.completions.length, 0);

  const before = await run(w, () => adminGet({ env: ENV, request: req(`https://x.test/api/admin?view=student&userId=${STUDENT.id}`, null, 'owner', 'GET') }));
  assert.deepEqual((await before.json()).certificateIssuance, { needed: true, nameResolved: true });

  const ok = await callAdminIssue(w, 'owner');
  assert.equal(ok.status, 200);
  assert.equal(ok.body.status, 'issued');
  assert.equal(w.db.completions.length, 1);
  assert.equal(w.db.completions[0].student_name, 'Jane Doe');
  const audit = w.db.admin_audit_log.find((r) => r.action === 'issue_certificate');
  assert.ok(audit, 'admin_audit_log row written');
  assert.equal(audit.actor_user_id, OWNER.id);
  assert.equal(audit.target_user_id, STUDENT.id);
  assert.equal(audit.details.outcome, 'issued');
  assert.equal(audit.details.credentialId, w.db.completions[0].credential_id);

  const again = await callAdminIssue(w, 'owner');
  assert.equal(again.body.status, 'already_issued');
  assert.equal(w.db.completions.length, 1);

  const after = await run(w, () => adminGet({ env: ENV, request: req(`https://x.test/api/admin?view=student&userId=${STUDENT.id}`, null, 'owner', 'GET') }));
  const ab = await after.json();
  assert.equal(ab.completion.credential_id, w.db.completions[0].credential_id);
  assert.deepEqual(ab.certificateIssuance, { needed: false });
});

test('Admin drawer copy: recovery state + Issue Certificate (owner/admin only); no "opens their certificate" copy', () => {
  assert.doesNotMatch(adminHtml, /issued when the student opens their certificate/);
  const start = adminHtml.indexOf('function certificateCard(c,attempts,issuance){');
  const end = adminHtml.indexOf('\nasync function issueCertificate', start);
  const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const load = (canMutate) => new Function('esc', 'fmtDate', 'canMutate', `${adminHtml.slice(start, end)}; return certificateCard;`)(esc, () => 'DATE', () => canMutate);
  const pass = [{ attempt_number: 3, certification_decision: 'pass' }];

  const ownerView = load(true)(null, pass, { needed: true, nameResolved: true });
  assert.match(ownerView, /Pass recorded · credential needs issuance/);
  assert.match(ownerView, /data-issue-cert>Issue Certificate</);
  assert.doesNotMatch(ownerView, /No official name/);

  const supportView = load(false)(null, pass, { needed: true, nameResolved: true });
  assert.match(supportView, /Pass recorded · credential needs issuance/);
  assert.doesNotMatch(supportView, /Issue Certificate/);

  assert.match(load(true)(null, pass, { needed: true, nameResolved: false }), /No official name is on file/);

  const issued = load(true)({ credential_id: 'AIMT-HS-2026-ABC234', student_name: 'Jane Doe', completed_at: '2026-09-20', revoked: false }, pass, { needed: false });
  assert.match(issued, /Issued · AIMT-HS-2026-ABC234/);
  assert.doesNotMatch(issued, /Issue Certificate|needs issuance/);

  assert.match(adminHtml, /action:'issue_certificate',userId/);
  assert.match(adminHtml, /await openStudent\(userId,email\)/, 'record refreshes after issuance');
});
