// Multi-course foundation, Phase 1: the course registry
// (functions/_lib/courses/registry.mjs) and the certification endpoints
// that now resolve through it.
//
// Proves: (1) every existing Head Spa identifier is unchanged and agrees
// with the code that already uses it; (2) unknown, malformed and draft
// courses fail closed; (3) assessment versions resolve explicitly, per
// course, never by default; (4) a second course can be added without
// touching Head Spa or duplicating the engine (synthetic fixture only, no
// Hair Loss content is installed).
//
// Run: node --test tests/course-registry.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  courseRegistry, createCourseRegistry, getCourse, listCourses,
  resolveAssessmentConfig, resolveCurrentAssessmentConfig, requiredModulesForFinalAssessment,
} from '../functions/_lib/courses/registry.mjs';
import { getAssessmentConfig, ASSESSMENT_VERSION_V1, STANDARD_VERSION_V1 } from '../functions/_lib/certification/assessment-config.mjs';
import { CRITICAL_DOMAIN_CONFIG_VERSION } from '../functions/_lib/certification/critical-domains.mjs';
import { bankVersion as installedBankVersion } from '../functions/_lib/certification/content-bank.mjs';
import { COURSE_SLUG, hasCompletedInstructionalModules } from '../functions/_lib/certification/auth.mjs';
import { CREDENTIAL_PREFIX } from '../functions/_lib/certification/certificate-issuance.mjs';
import { onRequestPost as finalizeAssessment } from '../functions/api/certification/finalize-assessment.js';

const read = (rel) => fs.readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
const HS = 'headspa-mastery';

// Identifiers present in production data (read-only aggregate, 2026-10-20):
// certification_attempts / course_progress / remediation / completions are
// all course_slug='headspa-mastery'; attempts all assessment_version v1;
// credentials all 'AIMT-HS-*'. Each must keep resolving forever.
const PRODUCTION_IDENTIFIERS = { courseSlug: HS, assessmentVersions: ['headspa-fe-assessment-v1'], credentialPrefix: 'AIMT-HS' };

// ---- 1. Head Spa is unchanged -------------------------------------------

test('Head Spa entry pins every existing identifier', () => {
  const c = getCourse(HS);
  assert.equal(c.slug, 'headspa-mastery');
  assert.equal(c.title, 'Head Spa Certification Course');
  assert.equal(c.status, 'active');
  assert.deepEqual(c.modules, {
    ids: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    requiredForFinalAssessment: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    finalAssessment: 12,
  });
  assert.deepEqual(c.assessment, {
    current: 'headspa-fe-assessment-v1',
    versions: ['headspa-fe-assessment-v1'],
    criticalDomainConfigVersion: 'headspa-critical-domains-v1',
    bankVersion: 'headspa-fe-bank-v1-2026-08-26',
  });
  assert.deepEqual(c.resources, { coursePage: '/headspa-mastery.html', progressStorageKey: 'levo_app', credentialPrefix: 'AIMT-HS' });
});

test('registry agrees with every module that already hardcodes a Head Spa identifier', () => {
  const c = getCourse(HS);
  assert.equal(COURSE_SLUG, c.slug, 'auth.mjs COURSE_SLUG');
  assert.equal(CREDENTIAL_PREFIX, c.resources.credentialPrefix, 'certificate-issuance.mjs');
  assert.equal(installedBankVersion, c.assessment.bankVersion, 'content-bank.mjs bankVersion');
  assert.equal(CRITICAL_DOMAIN_CONFIG_VERSION, c.assessment.criticalDomainConfigVersion);
  assert.equal(getAssessmentConfig(c.assessment.current).courseSlug, c.slug);
  assert.match(read('functions/api/verify-credential.js'), new RegExp(`'${c.slug}': '${c.title}'`), 'verify-credential.js display name');
  assert.match(read('assets/js/headspa-state.js'), new RegExp(`STORAGE_KEY = '${c.resources.progressStorageKey}'`));
  assert.ok(fs.existsSync(new URL(`..${c.resources.coursePage}`, import.meta.url)), 'course page exists');
  for (const m of c.modules.requiredForFinalAssessment.filter((n) => n > 0)) {
    assert.ok(getAssessmentConfig(c.assessment.current).requiredModuleCoverage.includes(m), `exam covers module ${m}`);
  }
});

test('every identifier stored in production still resolves', () => {
  const c = getCourse(PRODUCTION_IDENTIFIERS.courseSlug);
  assert.ok(c);
  for (const v of PRODUCTION_IDENTIFIERS.assessmentVersions) {
    const r = resolveAssessmentConfig(PRODUCTION_IDENTIFIERS.courseSlug, v);
    assert.equal(r.ok, true, v);
  }
  assert.equal(c.resources.credentialPrefix, PRODUCTION_IDENTIFIERS.credentialPrefix);
});

test('historical V1 assessment config is the same object with the same approved rules', () => {
  const r = resolveAssessmentConfig(HS, ASSESSMENT_VERSION_V1);
  assert.equal(r.config, getAssessmentConfig(ASSESSMENT_VERSION_V1), 'registry returns the versioned config itself, not a copy');
  assert.equal(resolveCurrentAssessmentConfig(HS).config, r.config);
  assert.equal(r.config.standardVersion, STANDARD_VERSION_V1);
  assert.deepEqual({ ...r.config.weights }, { knowledge: 0.5, appliedCases: 0.3, interview: 0.2 });
  assert.deepEqual({ ...r.config.minimums }, { knowledge: 0.75, appliedCases: 0.75, interview: 0.8, overall: 0.8 });
  assert.deepEqual({ ...r.config.attemptRules }, {
    remediationRequiredBeforeAttempt: 3, educatorAuthorizationRequiredBeforeAttempt: 4,
    maxAutomaticAttempts: 4, criticalDomainRemediationAppliesFromAttempt: 1,
  });
});

test('Phase 1 installs no second course', () => {
  assert.deepEqual(listCourses().map((c) => c.slug), [HS]);
  assert.deepEqual(listCourses({ includeDraft: true }).map((c) => c.slug), [HS]);
  assert.doesNotMatch(read('functions/_lib/courses/registry.mjs'), /hair|loss/i);
});

test('registry entries are deeply immutable', () => {
  const c = getCourse(HS);
  assert.throws(() => { c.slug = 'x'; }, TypeError);
  assert.throws(() => { c.modules.requiredForFinalAssessment.push(12); }, TypeError);
  assert.throws(() => { c.assessment.versions.push('v2'); }, TypeError);
  assert.equal(getCourse(HS).modules.requiredForFinalAssessment.length, 12);
});

// ---- 2. Unknown courses fail closed ----------------------------------------

const BAD_SLUGS = [undefined, null, '', 42, {}, 'HEADSPA-MASTERY', ' headspa-mastery', 'headspa-mastery ', 'headspa_mastery',
  '__proto__', 'constructor', 'toString', 'hair-loss-foundations', 'headspa-mastery/../x'];

test('unknown or malformed slugs resolve to nothing, everywhere', () => {
  for (const slug of BAD_SLUGS) {
    const label = JSON.stringify(slug);
    assert.equal(getCourse(slug), null, label);
    assert.equal(getCourse(slug, { includeDraft: true }), null, label);
    assert.equal(requiredModulesForFinalAssessment(slug), null, label);
    assert.deepEqual(resolveCurrentAssessmentConfig(slug), { ok: false, reason: 'unknown_course' }, label);
    assert.deepEqual(resolveAssessmentConfig(slug, ASSESSMENT_VERSION_V1), { ok: false, reason: 'unknown_course' }, label);
  }
});

test('assessment versions must be explicit and real -- no silent default to V1', () => {
  // getAssessmentConfig(undefined) defaults to V1; the registry never does.
  for (const v of [undefined, null, '', 0]) {
    assert.deepEqual(resolveAssessmentConfig(HS, v), { ok: false, reason: 'missing_assessment_version' }, String(v));
  }
  for (const v of ['headspa-fe-assessment-v2', 'HEADSPA-FE-ASSESSMENT-V1', 'aimt-certification-standard-v1', '__proto__']) {
    assert.deepEqual(resolveAssessmentConfig(HS, v), { ok: false, reason: 'assessment_version_not_for_course' }, v);
  }
});

test('hasCompletedInstructionalModules: unknown course is never eligible, and makes no DB call', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; throw new Error('should not be called'); };
  try {
    assert.equal(await hasCompletedInstructionalModules({ SUPABASE_URL: 'https://x', SUPABASE_SERVICE_ROLE_KEY: 'k' }, 'u1', 'hair-loss-foundations'), false);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test('hasCompletedInstructionalModules: Head Spa still requires exactly Modules 0-11', async () => {
  const progressWith = (ids) => Object.fromEntries(ids.map((id) => [String(id), { complete: true }]));
  const check = async (ids) => {
    const original = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify([{ state: { progress: progressWith(ids) } }]), { status: 200 });
    try {
      return await hasCompletedInstructionalModules({ SUPABASE_URL: 'https://x', SUPABASE_SERVICE_ROLE_KEY: 'k' }, 'u1');
    } finally {
      globalThis.fetch = original;
    }
  };
  const all = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  assert.equal(await check(all), true, '0-11 complete; Module 12 not required');
  assert.equal(await check(all.filter((m) => m !== 0)), false, 'Module 0 still required');
  assert.equal(await check(all.filter((m) => m !== 11)), false, 'Module 11 still required');
});

// ---- 3. Version-aware finalize ---------------------------------------------

async function finalizeWith(attemptOverrides) {
  const writes = [];
  const attempt = {
    id: 'att-1', user_id: 'u1', course_slug: HS, assessment_version: ASSESSMENT_VERSION_V1, attempt_number: 1, status: 'part3_locked',
    part1_selected_ids: [], part1_responses: {}, part2_case_state: {}, part3_selected_ids: [], part3_conversation_state: {},
    ...attemptOverrides,
  };
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    if (url.endsWith('/auth/v1/user')) return new Response(JSON.stringify({ id: 'u1', email: 'u1@example.com' }), { status: 200 });
    if ((init.method || 'GET') !== 'GET') {
      writes.push(url);
      // PostgREST return=representation: the CAS PATCH wins with the updated row.
      return new Response(JSON.stringify([{ ...attempt, ...JSON.parse(init.body || '{}') }]), { status: 200 });
    }
    if (url.includes('/rest/v1/certification_attempts')) return new Response(JSON.stringify([attempt]), { status: 200 });
    return new Response('[]', { status: 200 });
  };
  try {
    const res = await finalizeAssessment({
      request: { headers: { get: (n) => (n === 'Authorization' ? 'Bearer t' : null) }, json: async () => ({ attemptId: 'att-1' }) },
      env: { SUPABASE_URL: 'https://mock.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'k' },
    });
    return { status: res.status, body: await res.json(), writes };
  } finally {
    globalThis.fetch = original;
  }
}

test('finalize refuses to score an attempt whose stored course/version does not resolve, and writes nothing', async () => {
  const cases = [
    [{ assessment_version: 'headspa-fe-assessment-v2' }, 'assessment_version_not_for_course'],
    [{ assessment_version: null }, 'missing_assessment_version'],
    [{ course_slug: 'hair-loss-foundations' }, 'unknown_course'],
  ];
  for (const [overrides, reason] of cases) {
    const r = await finalizeWith(overrides);
    assert.equal(r.status, 409, JSON.stringify(overrides));
    assert.equal(r.body.reason, reason);
    assert.deepEqual(r.writes, [], `${JSON.stringify(overrides)}: no write`);
  }
});

test('finalize still scores a normal Head Spa V1 attempt', async () => {
  const r = await finalizeWith({});
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.ok(['pass', 'not_yet_passed'].includes(r.body.decision));
  assert.ok(r.writes.some((u) => u.includes('certification_attempts')), 'the scored attempt is written');
});

test('already-scored attempts are returned unchanged without re-resolving their version', async () => {
  const r = await finalizeWith({ status: 'scored', certification_decision: 'not_yet_passed', overall_score: 0.7, assessment_version: 'legacy-unknown' });
  assert.equal(r.status, 200);
  assert.equal(r.body.alreadyScored, true);
  assert.equal(r.body.decision, 'not_yet_passed');
  assert.deepEqual(r.writes, []);
});

// ---- 4. A second course slots in without touching Head Spa ---------------

// Synthetic fixture only -- NOT Hair Loss, no real content.
const FIXTURE_CONFIG = Object.freeze({ courseSlug: 'example-course', assessmentVersion: 'example-fe-assessment-v1', criticalDomainConfigVersion: 'example-domains-v1', bankVersion: 'example-bank-v1' });
const lookupWithFixture = (v) => (v === FIXTURE_CONFIG.assessmentVersion ? FIXTURE_CONFIG : getAssessmentConfig(v));
const headSpaDef = () => structuredClone(getCourse(HS));
const fixtureDef = (overrides = {}) => ({
  slug: 'example-course', title: 'Example Certification', status: 'active',
  modules: { ids: [0, 1, 2, 3], requiredForFinalAssessment: [0, 1, 2], finalAssessment: 3 },
  assessment: { current: 'example-fe-assessment-v1', versions: ['example-fe-assessment-v1'], criticalDomainConfigVersion: 'example-domains-v1', bankVersion: 'example-bank-v1' },
  resources: { coursePage: '/example-course.html', progressStorageKey: 'example_app', credentialPrefix: 'AIMT-EX' },
  ...overrides,
});

test('a second course resolves independently and leaves Head Spa resolution identical', () => {
  const reg = createCourseRegistry([headSpaDef(), fixtureDef()], { lookupAssessmentConfig: lookupWithFixture });
  assert.equal(reg.resolveCurrentAssessmentConfig(HS).config, getAssessmentConfig(ASSESSMENT_VERSION_V1));
  assert.deepEqual(reg.requiredModulesForFinalAssessment(HS), courseRegistry.requiredModulesForFinalAssessment(HS));
  assert.equal(reg.resolveCurrentAssessmentConfig('example-course').config, FIXTURE_CONFIG);
  assert.deepEqual(reg.requiredModulesForFinalAssessment('example-course'), [0, 1, 2]);
  // Cross-course version use is rejected in both directions.
  assert.equal(reg.resolveAssessmentConfig(HS, 'example-fe-assessment-v1').reason, 'assessment_version_not_for_course');
  assert.equal(reg.resolveAssessmentConfig('example-course', ASSESSMENT_VERSION_V1).reason, 'assessment_version_not_for_course');
});

test('a draft course is invisible to shared infrastructure until activated', () => {
  const reg = createCourseRegistry([headSpaDef(), fixtureDef({ status: 'draft' })], { lookupAssessmentConfig: lookupWithFixture });
  assert.equal(reg.getCourse('example-course'), null);
  assert.equal(reg.requiredModulesForFinalAssessment('example-course'), null);
  assert.equal(reg.resolveCurrentAssessmentConfig('example-course').ok, false);
  assert.equal(reg.getCourse('example-course', { includeDraft: true }).status, 'draft');
  assert.deepEqual(reg.listCourses().map((c) => c.slug), [HS]);
});

test('registry construction rejects unsafe or colliding definitions', () => {
  const build = (defs) => () => createCourseRegistry(defs, { lookupAssessmentConfig: lookupWithFixture });
  assert.throws(build([headSpaDef(), headSpaDef()]), /Duplicate course slug/);
  assert.throws(build([headSpaDef(), fixtureDef({ resources: { ...fixtureDef().resources, credentialPrefix: 'AIMT-HS' } })]), /Duplicate credential prefix/);
  assert.throws(build([fixtureDef({ slug: 'Example Course' })]), /kebab-case/);
  assert.throws(build([fixtureDef({ status: 'live' })]), /status/);
  assert.throws(build([fixtureDef({ assessment: { ...fixtureDef().assessment, versions: [ASSESSMENT_VERSION_V1], current: ASSESSMENT_VERSION_V1 } })]), /belongs to headspa-mastery/);
  assert.throws(build([fixtureDef({ assessment: { ...fixtureDef().assessment, current: 'example-fe-assessment-v9' } })]), /current must be listed/);
  assert.throws(build([fixtureDef({ assessment: { ...fixtureDef().assessment, versions: ['example-fe-assessment-v1', 'nope-v1'] } })]), /no versioned config/);
  assert.throws(build([fixtureDef({ modules: { ids: [0, 1], requiredForFinalAssessment: [0, 1], finalAssessment: 1 } })]), /finalAssessment/);
  assert.throws(build([fixtureDef({ modules: { ids: [0, 1], requiredForFinalAssessment: [0, 5], finalAssessment: 1 } })]), /subset/);
  assert.throws(build([fixtureDef({ assessment: { ...fixtureDef().assessment, bankVersion: 'stale' } })]), /bankVersion/);
});
