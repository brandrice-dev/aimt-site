// Multi-course Phase 2A: one shared certification backend, many courses.
//
// Drives the REAL certification endpoints against an in-memory PostgREST
// mock with a registry that holds Head Spa plus a SYNTHETIC second course
// ("example-course": cloned Head Spa structure with re-prefixed item ids
// and its own critical-domain ids E1-E4). No Hair Loss content; the
// production registry still holds only Head Spa.
//
// Covers: Head Spa unchanged; course content + records isolated; historical
// attempts keep their own rules and bank; bad course/version combinations
// fail closed with zero writes; credentials only for the attempt's course;
// remediation, educator-authorization and appeal rows stay per course.
//
// Run: node --test tests/course-registry-phase2a.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, before, test } from 'node:test';

import { __useCourseRegistryForTests, createCourseRegistry, getCourse } from '../functions/_lib/courses/registry.mjs';
import { lookupBank } from '../functions/_lib/certification/bank-catalog.mjs';
import { getAssessmentConfig, ASSESSMENT_VERSION_V1 } from '../functions/_lib/certification/assessment-config.mjs';
import { getProductionBanks } from '../functions/_lib/certification/content-bank.mjs';
import { onRequestPost as startAttempt } from '../functions/api/certification/start-attempt.js';
import { onRequestGet as getStatus } from '../functions/api/certification/get-status.js';
import { onRequestGet as getPart } from '../functions/api/certification/get-part.js';
import { onRequestPost as submitPart1 } from '../functions/api/certification/submit-part1.js';
import { onRequestPost as submitCase } from '../functions/api/certification/submit-case.js';
import { onRequestPost as submitInterviewTurn } from '../functions/api/certification/submit-interview-turn.js';
import { onRequestPost as finalize } from '../functions/api/certification/finalize-assessment.js';
import { onRequestPost as requestReview } from '../functions/api/certification/request-review.js';
import { onRequestPost as requestEducator } from '../functions/api/certification/request-educator-remediation.js';
import { onRequestPost as issueCertificate } from '../functions/api/issue-certificate.js';
import { onRequestGet as verifyCredential } from '../functions/api/verify-credential.js';

const HS = 'headspa-mastery';
const EX = 'example-course';
const HS_BANK = 'headspa-fe-bank-v1-2026-08-26';

// ---- synthetic second course ---------------------------------------------

const hsConfig = getAssessmentConfig(ASSESSMENT_VERSION_V1);
const hsBanks = getProductionBanks();
const toExampleDomains = (x) => JSON.parse(JSON.stringify(x).replace(/"D([1-4])"/g, '"E$1"'));
const exBank = (bankVersion, idPrefix) => ({
  bankVersion,
  status: 'INSTALLED',
  knowledgeBank: toExampleDomains(hsBanks.knowledgeBank).map((i) => ({ ...i, id: idPrefix + i.id })),
  caseBank: toExampleDomains(hsBanks.caseBank).map((i) => ({ ...i, id: idPrefix + i.id })),
  interviewBank: toExampleDomains(hsBanks.interviewBank).map((i) => ({ ...i, id: idPrefix + i.id })),
});
const BANKS = {
  'example-bank-v1': exBank('example-bank-v1', 'EX-'),
  'example-bank-v2': exBank('example-bank-v2', 'EX2-'),
  'draft-bank-v1': { bankVersion: 'draft-bank-v1', status: 'INSTALLED', knowledgeBank: [], caseBank: [], interviewBank: [] },
};
const exV1 = Object.freeze({
  ...hsConfig,
  courseSlug: EX,
  assessmentVersion: 'example-fe-assessment-v1',
  bankVersion: 'example-bank-v1',
  criticalDomainConfigVersion: 'example-domains-v1',
  criticalDomains: toExampleDomains(hsConfig.criticalDomains),
  minimums: Object.freeze({ ...hsConfig.minimums, knowledge: 0.75 }),
});
// Newer rules: stricter knowledge minimum, newer bank.
const exV2 = Object.freeze({ ...exV1, assessmentVersion: 'example-fe-assessment-v2', bankVersion: 'example-bank-v2', minimums: Object.freeze({ ...exV1.minimums, knowledge: 0.85 }) });
const draftV1 = Object.freeze({ ...exV1, courseSlug: 'draft-course', assessmentVersion: 'draft-fe-assessment-v1', bankVersion: 'draft-bank-v1' });
const CONFIGS = { [exV1.assessmentVersion]: exV1, [exV2.assessmentVersion]: exV2, [draftV1.assessmentVersion]: draftV1 };

const exampleCourse = {
  slug: EX, title: 'Example Certification (synthetic)', status: 'active',
  modules: { ids: [0, 1, 2, 3, 4], requiredForFinalAssessment: [0, 1, 2, 3], finalAssessment: 4 },
  assessment: {
    current: exV2.assessmentVersion, versions: [exV1.assessmentVersion, exV2.assessmentVersion],
    criticalDomainConfigVersion: 'example-domains-v1', bankVersion: 'example-bank-v2', bankVersions: ['example-bank-v1', 'example-bank-v2'],
  },
  resources: { coursePage: '/example-course.html', progressStorageKey: 'example_app', credentialPrefix: 'AIMT-EX' },
};
const draftCourse = {
  ...exampleCourse, slug: 'draft-course', title: 'Draft (synthetic)', status: 'draft',
  assessment: { current: draftV1.assessmentVersion, versions: [draftV1.assessmentVersion], criticalDomainConfigVersion: 'example-domains-v1', bankVersion: 'draft-bank-v1', bankVersions: ['draft-bank-v1'] },
  resources: { ...exampleCourse.resources, credentialPrefix: 'AIMT-DR' },
};

let restoreRegistry;
before(() => {
  const registry = createCourseRegistry([structuredClone(getCourse(HS)), exampleCourse, draftCourse], {
    lookupAssessmentConfig: (v) => CONFIGS[v] || getAssessmentConfig(v),
    lookupBank: (v) => BANKS[v] || lookupBank(v),
  });
  restoreRegistry = __useCourseRegistryForTests(registry);
});
after(() => restoreRegistry());

// ---- in-memory PostgREST ---------------------------------------------------

const ENV = { SUPABASE_URL: 'https://mock.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role' };
const USERS = {
  hsOnly: { id: 'u-hs', email: 'hs@example.com', user_metadata: { first_name: 'Hana', last_name: 'Spa' } },
  exOnly: { id: 'u-ex', email: 'ex@example.com', user_metadata: { first_name: 'Exa', last_name: 'Mple' } },
  both: { id: 'u-both', email: 'both@example.com', user_metadata: { first_name: 'Bo', last_name: 'Th' } },
};
const progressFor = (ids) => ({ progress: Object.fromEntries(ids.map((m) => [String(m), { complete: true }])) });

function createDb() {
  let seq = 0;
  const ent = (user, course) => ({ checkout_session_id: `cs_${user.id}_${course}`, course_slug: course, purchaser_email: user.email, user_id: user.id });
  const prog = (user, course, ids) => ({ user_id: user.id, course_slug: course, state: progressFor(ids) });
  const hsModules = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  return {
    nextId: (p) => `${p}-${++seq}`,
    failTables: new Set(),
    writes: [],
    tables: {
      course_entitlements: [ent(USERS.hsOnly, HS), ent(USERS.exOnly, EX), ent(USERS.both, HS), ent(USERS.both, EX)],
      course_progress: [prog(USERS.hsOnly, HS, hsModules), prog(USERS.exOnly, EX, [0, 1, 2, 3]), prog(USERS.both, HS, hsModules), prog(USERS.both, EX, [0, 1, 2, 3])],
      certification_attempts: [],
      certification_remediation_assignments: [],
      certification_educator_requests: [],
      certification_review_requests: [],
      completions: [],
    },
  };
}

function matchesFilter(row, key, raw) {
  if (['select', 'order', 'limit', 'on_conflict'].includes(key)) return true;
  if (key === 'or') {
    return raw.replace(/^\(|\)$/g, '').split(',').some((cond) => {
      const [col, op, ...rest] = cond.split('.');
      return op === 'eq' && String(row[col]).toLowerCase() === rest.join('.').toLowerCase();
    });
  }
  if (raw === 'is.null') return row[key] == null;
  if (raw.startsWith('eq.')) return String(row[key]) === raw.slice(3);
  throw new Error(`mock: unsupported filter ${key}=${raw}`);
}

function installFetch(db) {
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
    if (url.pathname === '/auth/v1/user') {
      const token = String(init.headers?.Authorization || '').replace('Bearer ', '');
      const user = Object.values(USERS).find((u) => u.id === token);
      return user ? reply(user) : reply({}, 401);
    }
    const table = url.pathname.replace('/rest/v1/', '');
    if (db.failTables.has(table)) return reply({ message: 'boom' }, 500);
    const rows = db.tables[table];
    if (!rows) throw new Error(`mock: unknown table ${table}`);
    const method = (init.method || 'GET').toUpperCase();
    const hit = (r) => [...url.searchParams].every(([k, v]) => matchesFilter(r, k, v));
    if (method === 'GET') {
      let out = rows.filter(hit);
      const order = url.searchParams.get('order');
      if (order) {
        const [col, dir] = order.split('.');
        out = out.slice().sort((a, b) => (a[col] < b[col] ? -1 : a[col] > b[col] ? 1 : 0) * (dir === 'desc' ? -1 : 1));
      }
      const limit = Number(url.searchParams.get('limit'));
      return reply(limit ? out.slice(0, limit) : out);
    }
    db.writes.push({ method, table });
    if (method === 'POST') {
      const created = [].concat(JSON.parse(init.body)).map((r) => ({ id: db.nextId(table), revoked: table === 'completions' ? false : undefined, ...r }));
      rows.push(...created);
      return reply(created, 201);
    }
    if (method === 'PATCH') {
      const patch = JSON.parse(init.body);
      const updated = rows.filter(hit);
      updated.forEach((r) => Object.assign(r, patch));
      return reply(updated);
    }
    throw new Error(`mock: unsupported method ${method}`);
  };
  return () => { globalThis.fetch = original; };
}

async function call(db, handler, user, { body, query = '' } = {}) {
  const restore = installFetch(db);
  try {
    const res = await handler({
      request: {
        url: `https://aimtrichology.com/api/x${query}`,
        headers: { get: (n) => (n === 'Authorization' ? `Bearer ${user.id}` : null) },
        json: async () => (body === undefined ? {} : body),
      },
      env: ENV,
    });
    return { status: res.status, body: await res.json() };
  } finally {
    restore();
  }
}

function addAttempt(db, user, course, overrides = {}) {
  const versions = course === HS
    ? { assessment_version: ASSESSMENT_VERSION_V1, standard_version: hsConfig.standardVersion, bank_version: HS_BANK }
    : { assessment_version: exV2.assessmentVersion, standard_version: exV2.standardVersion, bank_version: 'example-bank-v2' };
  const row = {
    id: db.nextId('att'), user_id: user.id, course_slug: course, attempt_number: 1, status: 'in_progress', certification_decision: null,
    critical_domain_results: [], part1_selected_ids: [], part1_responses: {}, part2_selected_ids: [], part2_case_state: {},
    part3_selected_ids: [], part3_conversation_state: {}, ...versions, ...overrides,
  };
  db.tables.certification_attempts.push(row);
  return row;
}
const ids = (row) => [...row.part1_selected_ids, ...row.part2_selected_ids, ...row.part3_selected_ids];

// ---- 1. Head Spa unchanged ---------------------------------------------------

test('Head Spa: a request with no courseSlug starts a Head Spa attempt with Head Spa rules and content, as before', async () => {
  const db = createDb();
  const res = await call(db, startAttempt, USERS.both);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  const row = db.tables.certification_attempts[0];
  assert.equal(row.course_slug, HS);
  assert.equal(row.assessment_version, ASSESSMENT_VERSION_V1);
  assert.equal(row.standard_version, hsConfig.standardVersion);
  assert.equal(row.bank_version, HS_BANK);
  const hsIds = new Set([...hsBanks.knowledgeBank, ...hsBanks.caseBank, ...hsBanks.interviewBank].map((i) => i.id));
  assert.ok(ids(row).length > 0 && ids(row).every((id) => hsIds.has(id)), 'every selected item is a Head Spa item');
  assert.equal(row.part1_selected_ids.length, hsConfig.partI.targetCount);
});

test('Head Spa: status, certificate prefix and verification title are unchanged', async () => {
  const db = createDb();
  addAttempt(db, USERS.hsOnly, HS, { status: 'scored', certification_decision: 'pass' });
  assert.equal((await call(db, getStatus, USERS.hsOnly)).body.state, 'C');
  const cert = await call(db, issueCertificate, USERS.hsOnly);
  assert.equal(cert.status, 200, JSON.stringify(cert.body));
  assert.match(cert.body.credential_id, /^AIMT-HS-\d{4}-[A-Z2-9]{6}$/);
  const verified = await call(db, verifyCredential, USERS.hsOnly, { query: `?id=${cert.body.credential_id}` });
  assert.equal(verified.body.course, 'Head Spa Certification Course');
});

// ---- 2. Course identity for new attempts -------------------------------------

test('a second course starts with its own rules and content, after its own entitlement and completion checks', async () => {
  const db = createDb();
  const res = await call(db, startAttempt, USERS.exOnly, { body: { courseSlug: EX } });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  const row = db.tables.certification_attempts[0];
  assert.equal(row.course_slug, EX);
  assert.equal(row.assessment_version, exV2.assessmentVersion);
  assert.equal(row.bank_version, 'example-bank-v2');
  assert.ok(ids(row).every((id) => id.startsWith('EX2-')), 'only the example course\'s current bank');
});

test('entitlement is checked for the requested course: Head Spa enrollment never opens another course, and vice versa', async () => {
  const db = createDb();
  assert.equal((await call(db, startAttempt, USERS.hsOnly, { body: { courseSlug: EX } })).status, 403);
  assert.equal((await call(db, startAttempt, USERS.exOnly)).status, 403, 'absent courseSlug means Head Spa, which this student lacks');
  assert.equal((await call(db, getStatus, USERS.hsOnly, { query: `?courseSlug=${EX}` })).status, 403);
  assert.equal(db.tables.certification_attempts.length, 0);
});

test('explicit invalid course identifiers are rejected and never default to Head Spa', async () => {
  const db = createDb();
  for (const courseSlug of ['', 'hair-loss-foundations', 'HEADSPA-MASTERY', 'headspa-mastery ', '__proto__', 'draft-course', 42, true, {}]) {
    const label = JSON.stringify(courseSlug);
    const start = await call(db, startAttempt, USERS.both, { body: { courseSlug } });
    assert.equal(start.status, 400, `start ${label}`);
    assert.equal(start.body.reason, 'unknown_course', label);
  }
  for (const q of ['', 'hair-loss-foundations', 'draft-course', 'headspa_mastery']) {
    assert.equal((await call(db, getStatus, USERS.both, { query: `?courseSlug=${encodeURIComponent(q)}` })).status, 400, `status ${q}`);
    assert.equal((await call(db, issueCertificate, USERS.both, { query: `?courseSlug=${encodeURIComponent(q)}` })).status, 400, `cert ${q}`);
  }
  assert.equal(db.tables.certification_attempts.length, 0);
  assert.equal(db.tables.completions.length, 0);
});

// ---- 3. Records and content isolation ------------------------------------------

test('each course\'s status sees only its own attempts, remediation and ladder', async () => {
  const db = createDb();
  addAttempt(db, USERS.both, EX, { status: 'scored', certification_decision: 'not_yet_passed' });
  db.tables.certification_remediation_assignments.push({ id: 'rem-ex', user_id: USERS.both.id, course_slug: EX, attempt_id: 'x', critical_domain: null, competency_area: 'Example', required_before_next_attempt: true, completed: false });
  const hsStatus = await call(db, getStatus, USERS.both);
  assert.equal(hsStatus.body.state, 'A', 'the example-course failure does not appear on Head Spa');
  assert.deepEqual(hsStatus.body.attemptHistory, []);
  const exStatus = await call(db, getStatus, USERS.both, { query: `?courseSlug=${EX}` });
  assert.equal(exStatus.body.state, 'D');
  assert.deepEqual(exStatus.body.remediation.map((r) => r.id), ['rem-ex']);
  // Prior-item overlap avoidance is per course: a Head Spa retake is unaffected by example items.
  const start = await call(db, startAttempt, USERS.both);
  assert.equal(start.status, 200);
  assert.equal(db.tables.certification_attempts.find((r) => r.course_slug === HS).attempt_number, 1);
});

test('an attempt can never be served or scored with another course\'s content', async () => {
  const db = createDb();
  const exItem = BANKS['example-bank-v2'].knowledgeBank[0].id;
  const hsItem = hsBanks.knowledgeBank[0].id;
  const hsRow = addAttempt(db, USERS.both, HS, { part1_selected_ids: [exItem] });
  const exRow = addAttempt(db, USERS.both, EX, { part1_selected_ids: [hsItem] });
  for (const row of [hsRow, exRow]) {
    const res = await call(db, submitPart1, USERS.both, { body: { attemptId: row.id, responses: {} } });
    assert.equal(res.status, 503, 'foreign item ids are not found in the attempt\'s own bank');
  }
  assert.deepEqual(db.writes, []);
  // And get-part serves only the attempt's own course content.
  const exCase = BANKS['example-bank-v2'].caseBank[0].id;
  const partRow = addAttempt(db, USERS.both, EX, { status: 'part1_locked', part2_selected_ids: [exCase, hsBanks.caseBank[1].id] });
  const part = await call(db, getPart, USERS.both, { query: `?attemptId=${partRow.id}&part=2` });
  assert.deepEqual(part.body.cases.map((c) => c.id), [exCase]);
});

// ---- 4. Historical attempts keep their own rules and bank ----------------------

test('a historical attempt is scored under its own (older) rules, not the course\'s current ones', async () => {
  const scores = { status: 'part3_locked', knowledge_score: 0.8, applied_cases_score: 0.9, interview_score: 0.9 };
  const db = createDb();
  const oldRow = addAttempt(db, USERS.exOnly, EX, { ...scores, assessment_version: exV1.assessmentVersion, bank_version: 'example-bank-v1' });
  const oldResult = await call(db, finalize, USERS.exOnly, { body: { attemptId: oldRow.id } });
  assert.equal(oldResult.body.decision, 'pass', 'v1 knowledge minimum 0.75');

  const db2 = createDb();
  const newRow = addAttempt(db2, USERS.exOnly, EX, scores);
  const newResult = await call(db2, finalize, USERS.exOnly, { body: { attemptId: newRow.id } });
  assert.equal(newResult.body.decision, 'not_yet_passed', 'v2 knowledge minimum 0.85');
  // Critical domains come from the attempt's course config too.
  assert.deepEqual(newRow.critical_domain_results.map((d) => d.domainId), ['E1', 'E2', 'E3', 'E4']);
});

test('a historical attempt reads its own (older) content bank, not the current one', async () => {
  const db = createDb();
  const v1Item = BANKS['example-bank-v1'].knowledgeBank[0];
  const row = addAttempt(db, USERS.exOnly, EX, {
    assessment_version: exV1.assessmentVersion, bank_version: 'example-bank-v1',
    part1_selected_ids: [v1Item.id], part1_responses: { [v1Item.id]: v1Item.correctChoice ?? 0 },
  });
  const res = await call(db, submitPart1, USERS.exOnly, { body: { attemptId: row.id, responses: {} } });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(row.status, 'part1_locked');
});

test('Head Spa historical attempts resolve their original V1 rules and bank under the multi-course registry', async () => {
  const db = createDb();
  const row = addAttempt(db, USERS.hsOnly, HS, { status: 'part3_locked', knowledge_score: 0.9, applied_cases_score: 0.9, interview_score: 0.9 });
  const res = await call(db, finalize, USERS.hsOnly, { body: { attemptId: row.id } });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.decision, 'pass');
  assert.deepEqual(row.critical_domain_results.map((d) => d.domainId), ['D1', 'D2', 'D3', 'D4']);
});

// ---- 5. Incorrect course/version combinations fail closed ----------------------

const BAD_IDENTITIES = [
  ['HS attempt with an example-course assessment version', HS, { assessment_version: exV2.assessmentVersion }, 'assessment_version_not_for_course'],
  ['HS attempt with an example-course bank', HS, { bank_version: 'example-bank-v2' }, 'bank_version_not_for_course'],
  ['example attempt with the Head Spa V1 version', EX, { assessment_version: ASSESSMENT_VERSION_V1 }, 'assessment_version_not_for_course'],
  ['example attempt with the Head Spa bank', EX, { bank_version: HS_BANK }, 'bank_version_not_for_course'],
  ['attempt for an unknown course', 'hair-loss-foundations', {}, 'unknown_course'],
  ['attempt for a draft course', 'draft-course', { assessment_version: draftV1.assessmentVersion, bank_version: 'draft-bank-v1' }, 'unknown_course'],
  ['attempt with no bank version', HS, { bank_version: null }, 'missing_bank_version'],
  ['attempt with a mismatched standard version', HS, { standard_version: 'aimt-certification-standard-v9' }, 'standard_version_mismatch'],
];

test('incorrect course/version/bank combinations fail closed at every attempt endpoint, with zero writes', async () => {
  for (const [label, course, overrides, reason] of BAD_IDENTITIES) {
    const base = course === EX ? EX : HS;
    const db = createDb();
    const caseId = 'CASE-X';
    const interviewId = 'INT-X';
    const mk = (status, extra) => addAttempt(db, USERS.both, base, { course_slug: course, status, ...overrides, ...extra });
    const calls = [
      [submitPart1, { body: { attemptId: mk('in_progress', { part1_selected_ids: ['K'] }).id, responses: {} } }],
      [getPart, { query: `?attemptId=${mk('part1_locked', {}).id}&part=2` }],
      [submitCase, { body: { attemptId: mk('part1_locked', { part2_selected_ids: [caseId] }).id, caseId, responses: {} } }],
      [submitInterviewTurn, { body: { attemptId: mk('part2_locked', { part3_selected_ids: [interviewId] }).id, interviewId, studentResponse: 'x' } }],
      [finalize, { body: { attemptId: mk('part3_locked', {}).id } }],
    ];
    for (const [handler, opts] of calls) {
      const res = await call(db, handler, USERS.both, opts);
      assert.equal(res.status, 409, `${label}: ${handler.name}`);
      assert.equal(res.body.reason, reason, `${label}: ${handler.name}`);
    }
    assert.deepEqual(db.writes, [], `${label}: nothing written, no lock claimed`);
  }
});

// ---- 6. Credentials only for the attempt's own course -------------------------

test('passing one course issues only that course\'s credential, with its own prefix and title', async () => {
  const db = createDb();
  const row = addAttempt(db, USERS.both, EX, { status: 'part3_locked', assessment_version: exV1.assessmentVersion, bank_version: 'example-bank-v1', knowledge_score: 0.9, applied_cases_score: 0.9, interview_score: 0.9 });
  const res = await call(db, finalize, USERS.both, { body: { attemptId: row.id } });
  assert.equal(res.body.decision, 'pass');
  assert.equal(res.body.certificate.status, 'issued');
  assert.match(res.body.certificate.credentialId, /^AIMT-EX-/);
  assert.deepEqual(db.tables.completions.map((c) => c.course_slug), [EX], 'no Head Spa credential');
  const verified = await call(db, verifyCredential, USERS.both, { query: `?id=${res.body.certificate.credentialId}` });
  assert.equal(verified.body.course, 'Example Certification (synthetic)');
});

test('a pass in one course cannot be used to issue another course\'s credential', async () => {
  const db = createDb();
  addAttempt(db, USERS.both, EX, { status: 'scored', certification_decision: 'pass' });
  const hsCert = await call(db, issueCertificate, USERS.both);
  assert.equal(hsCert.status, 409);
  assert.equal(hsCert.body.status, 'not_passed');

  const db2 = createDb();
  addAttempt(db2, USERS.both, HS, { status: 'scored', certification_decision: 'pass' });
  const exCert = await call(db2, issueCertificate, USERS.both, { query: `?courseSlug=${EX}` });
  assert.equal(exCert.status, 409);
  assert.equal(exCert.body.status, 'not_passed');
  assert.equal(db.tables.completions.length + db2.tables.completions.length, 0);
});

test('an existing AIMT-HS credential keeps verifying, and an unlisted course still shows its stored slug', async () => {
  const db = createDb();
  db.tables.completions.push(
    { credential_id: 'AIMT-HS-2026-ABCDEF', course_slug: HS, student_name: 'Hana Spa', completed_at: '2026-09-01T00:00:00Z', revoked: false },
    { credential_id: 'AIMT-ZZ-2026-ABCDEF', course_slug: 'retired-course', student_name: 'Old Grad', completed_at: '2026-01-01T00:00:00Z', revoked: false },
    { credential_id: 'AIMT-HS-2026-REVOKD', course_slug: HS, student_name: 'Rev Oked', completed_at: '2026-09-01T00:00:00Z', revoked: true },
  );
  assert.equal((await call(db, verifyCredential, USERS.hsOnly, { query: '?id=AIMT-HS-2026-ABCDEF' })).body.course, 'Head Spa Certification Course');
  assert.equal((await call(db, verifyCredential, USERS.hsOnly, { query: '?id=AIMT-ZZ-2026-ABCDEF' })).body.course, 'retired-course');
  assert.deepEqual((await call(db, verifyCredential, USERS.hsOnly, { query: '?id=AIMT-HS-2026-REVOKD' })).body, { valid: false, reason: 'revoked' });
});

// ---- 7. Remediation, educator authorization and appeals stay per course --------

test('remediation from a failed attempt is tagged with that attempt\'s course only', async () => {
  const db = createDb();
  // A wrong answer (99 is out of range for every item) gives real weak spots.
  const items = BANKS['example-bank-v2'].knowledgeBank.slice(0, 3).map((i) => i.id);
  const row = addAttempt(db, USERS.both, EX, {
    status: 'part3_locked', knowledge_score: 0.5, applied_cases_score: 0.9, interview_score: 0.9,
    part1_selected_ids: items, part1_responses: Object.fromEntries(items.map((id) => [id, 99])),
  });
  const res = await call(db, finalize, USERS.both, { body: { attemptId: row.id } });
  assert.equal(res.body.decision, 'not_yet_passed');
  const rem = db.tables.certification_remediation_assignments;
  assert.ok(rem.length > 0, 'remediation was generated');
  assert.ok(rem.every((r) => r.course_slug === EX && r.attempt_id === row.id));
  assert.equal((await call(db, getStatus, USERS.both)).body.remediation, null, 'Head Spa status carries none of it');
});

test('educator requests are tagged with the attempt\'s course and never unlock another course\'s Attempt 4', async () => {
  const db = createDb();
  [1, 2, 3].forEach((n) => addAttempt(db, USERS.both, HS, { attempt_number: n, status: 'scored', certification_decision: 'not_yet_passed', critical_domain_results: [] }));
  const exAttempt = addAttempt(db, USERS.both, EX, { status: 'scored', certification_decision: 'not_yet_passed' });
  const req = await call(db, requestEducator, USERS.both, { body: { attemptId: exAttempt.id } });
  assert.equal(req.status, 200, JSON.stringify(req.body));
  assert.deepEqual(db.tables.certification_educator_requests.map((r) => r.course_slug), [EX]);
  db.tables.certification_educator_requests[0].attempt4_authorized = true;
  const hs = await call(db, getStatus, USERS.both);
  assert.equal(hs.body.ladder.blockedReason, 'educator_authorization_required', 'the example-course authorization does not count for Head Spa');
  // Control: the same authorization filed under Head Spa would unlock it.
  db.tables.certification_educator_requests[0].course_slug = HS;
  assert.deepEqual((await call(db, getStatus, USERS.both)).body.ladder, { canStartNewAttempt: true, nextAttemptNumber: 4 });
});

test('appeals are tagged with the attempt\'s course and require that course\'s enrollment', async () => {
  const db = createDb();
  const exAttempt = addAttempt(db, USERS.exOnly, EX, { status: 'scored', certification_decision: 'not_yet_passed' });
  const ok = await call(db, requestReview, USERS.exOnly, { body: { attemptId: exAttempt.id, studentExplanation: 'Item wording unclear.' } });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.deepEqual(db.tables.certification_review_requests.map((r) => [r.course_slug, r.assessment_version]), [[EX, exV2.assessmentVersion]]);

  // Owning an attempt is not enough: enrollment for that attempt's course is required.
  const strayAttempt = addAttempt(db, USERS.hsOnly, EX, { status: 'scored', certification_decision: 'not_yet_passed' });
  assert.equal((await call(db, requestReview, USERS.hsOnly, { body: { attemptId: strayAttempt.id, studentExplanation: 'x' } })).status, 403);
  assert.equal((await call(db, requestEducator, USERS.hsOnly, { body: { attemptId: strayAttempt.id } })).status, 403);
  // And an attempt for a course outside the registry is refused, not filed under Head Spa.
  const unknown = addAttempt(db, USERS.both, HS, { course_slug: 'hair-loss-foundations' });
  assert.equal((await call(db, requestReview, USERS.both, { body: { attemptId: unknown.id, studentExplanation: 'x' } })).body.reason, 'unknown_course');
  assert.equal(db.tables.certification_review_requests.length, 1);
});

// ---- 8. Guard rails -------------------------------------------------------------

test('only tests use the registry override seam', () => {
  const offenders = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(p);
      else if (/\.(m?js)$/.test(entry.name) && !p.endsWith('_lib/courses/registry.mjs') && fs.readFileSync(p, 'utf8').includes('__useCourseRegistryForTests')) offenders.push(p);
    }
  };
  walk(new URL('../functions', import.meta.url).pathname);
  walk(new URL('../cadence-worker', import.meta.url).pathname);
  assert.deepEqual(offenders, []);
});

test('the production registry still holds only Head Spa', async () => {
  const { courseRegistry } = await import('../functions/_lib/courses/registry.mjs');
  assert.deepEqual(courseRegistry.listCourses({ includeDraft: true }).map((c) => c.slug), [HS]);
});

test('every production attempt identity resolves to the original V1 rules and bank', async () => {
  // Read-only aggregate of certification_attempts, 2026-10-21: all 3 rows share this tuple.
  const PRODUCTION_ATTEMPT_IDENTITIES = [
    { course_slug: HS, assessment_version: 'headspa-fe-assessment-v1', standard_version: 'aimt-certification-standard-v1', bank_version: HS_BANK },
  ];
  const { courseRegistry } = await import('../functions/_lib/courses/registry.mjs');
  for (const identity of PRODUCTION_ATTEMPT_IDENTITIES) {
    const r = courseRegistry.resolveAttemptContent(identity);
    assert.equal(r.ok, true, JSON.stringify(identity));
    assert.equal(r.config, hsConfig);
    assert.equal(r.banks.bankVersion, HS_BANK);
    assert.equal(r.banks.knowledgeBank, hsBanks.knowledgeBank, 'the installed Head Spa bank itself, not a copy');
  }
});
