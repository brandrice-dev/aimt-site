// AIMT course registry — the one place shared certification infrastructure
// asks "which certification is this, and which rules govern it?"
//
// Pure and frozen: no I/O, no npm. Each certification is ONE entry; the
// LMS, Cadence and the assessment engine stay shared and read their
// course-specific identifiers from here instead of duplicating per course.
//
// Fail closed: an unknown, malformed or non-active slug resolves to null,
// and an assessment version resolves only if it is stated explicitly,
// listed for THAT course, and backed by a real versioned config whose own
// courseSlug matches. Nothing here defaults to Head Spa.
//
// Historical identifiers are permanent. Head Spa's slug, credential prefix
// and assessment versions are stored on existing attempts, credentials and
// progress rows — never rename or remove them; add new versions alongside
// (see assessment-config.mjs, standard Section 15).

import { getAssessmentConfig, ASSESSMENT_VERSION_V1 } from '../certification/assessment-config.mjs';
import { CRITICAL_DOMAIN_CONFIG_VERSION } from '../certification/critical-domains.mjs';
import { lookupBank as lookupInstalledBank } from '../certification/bank-catalog.mjs';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATUSES = new Set(['active', 'draft']);
// Must stay within verify-credential.js's public ID shape check.
const CREDENTIAL_PREFIX_PATTERN = /^AIMT-[A-Z]{2,6}$/;

/**
 * @typedef {Object} CourseDefinition
 * @property {string} slug                 Internal identifier stored on every row. Permanent.
 * @property {string} title                Credential/verification display name.
 * @property {'active'|'draft'} status     Only 'active' courses resolve for shared infrastructure.
 * @property {{ ids:number[], requiredForFinalAssessment:number[], finalAssessment:number }} modules
 * @property {{ current:string, versions:string[], criticalDomainConfigVersion:string, bankVersion:string, bankVersions:string[] }} assessment
 * @property {{ coursePage:string, progressStorageKey:string, credentialPrefix:string }} resources
 */

/** @type {CourseDefinition} */
const HEADSPA_MASTERY = {
  slug: 'headspa-mastery',
  title: 'Head Spa Certification Course',
  status: 'active',
  modules: {
    // Module 0 (Welcome) through 11 are instructional; all twelve must be
    // complete before Module 12, the Final Certification Assessment.
    ids: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    requiredForFinalAssessment: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    finalAssessment: 12,
  },
  assessment: {
    current: ASSESSMENT_VERSION_V1,
    // Every version ever used to score a Head Spa attempt. Append only.
    versions: [ASSESSMENT_VERSION_V1],
    criticalDomainConfigVersion: CRITICAL_DOMAIN_CONFIG_VERSION,
    bankVersion: 'headspa-fe-bank-v1-2026-08-26',
    // Every content bank ever used by a Head Spa attempt. Append only.
    bankVersions: ['headspa-fe-bank-v1-2026-08-26'],
  },
  resources: {
    coursePage: '/headspa-mastery.html',
    progressStorageKey: 'levo_app',
    credentialPrefix: 'AIMT-HS',
  },
};

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}

function validateCourse(def, lookupAssessmentConfig, lookupBank) {
  const where = `course ${JSON.stringify(def && def.slug)}`;
  const fail = (msg) => { throw new Error(`Invalid ${where}: ${msg}`); };
  if (!def || typeof def !== 'object') fail('definition must be an object');
  if (typeof def.slug !== 'string' || !SLUG_PATTERN.test(def.slug)) fail('slug must be lowercase kebab-case');
  if (typeof def.title !== 'string' || !def.title.trim()) fail('title is required');
  if (!STATUSES.has(def.status)) fail(`status must be one of ${[...STATUSES].join(', ')}`);

  const m = def.modules || {};
  const isIds = (a) => Array.isArray(a) && a.length > 0 && a.every((n) => Number.isInteger(n) && n >= 0) && new Set(a).size === a.length;
  if (!isIds(m.ids)) fail('modules.ids must be unique non-negative integers');
  if (!isIds(m.requiredForFinalAssessment) || !m.requiredForFinalAssessment.every((n) => m.ids.includes(n))) {
    fail('modules.requiredForFinalAssessment must be a subset of modules.ids');
  }
  if (!m.ids.includes(m.finalAssessment) || m.requiredForFinalAssessment.includes(m.finalAssessment)) {
    fail('modules.finalAssessment must be a module id outside requiredForFinalAssessment');
  }

  const a = def.assessment || {};
  if (!Array.isArray(a.versions) || !a.versions.length || new Set(a.versions).size !== a.versions.length) {
    fail('assessment.versions must be a non-empty unique list');
  }
  if (!a.versions.includes(a.current)) fail('assessment.current must be listed in assessment.versions');
  for (const version of a.versions) {
    let config;
    try { config = lookupAssessmentConfig(version); } catch (_) { config = null; }
    if (!config) fail(`assessment version ${version} has no versioned config`);
    if (config.courseSlug !== def.slug) fail(`assessment version ${version} belongs to ${config.courseSlug}`);
  }
  const current = lookupAssessmentConfig(a.current);
  if (current.criticalDomainConfigVersion !== a.criticalDomainConfigVersion) fail('criticalDomainConfigVersion disagrees with the current config');
  if (current.bankVersion !== a.bankVersion) fail('bankVersion disagrees with the current config');

  if (!Array.isArray(a.bankVersions) || !a.bankVersions.length || new Set(a.bankVersions).size !== a.bankVersions.length) {
    fail('assessment.bankVersions must be a non-empty unique list');
  }
  for (const bankVersion of a.bankVersions) {
    let banks;
    try { banks = lookupBank(bankVersion); } catch (_) { banks = null; }
    if (!banks || banks.bankVersion !== bankVersion) fail(`content bank ${bankVersion} is not installed`);
  }
  for (const version of a.versions) {
    if (!a.bankVersions.includes(lookupAssessmentConfig(version).bankVersion)) {
      fail(`assessment version ${version} uses a bank not listed in assessment.bankVersions`);
    }
  }

  const r = def.resources || {};
  for (const key of ['coursePage', 'progressStorageKey', 'credentialPrefix']) {
    if (typeof r[key] !== 'string' || !r[key]) fail(`resources.${key} is required`);
  }
  if (!CREDENTIAL_PREFIX_PATTERN.test(r.credentialPrefix)) fail('resources.credentialPrefix must match AIMT-[A-Z]{2,6}');
}

/**
 * Builds a validated, frozen registry. Exported so tests (and the next
 * course) can prove a new entry slots in without touching existing ones.
 * @param {CourseDefinition[]} definitions
 * @param {{ lookupAssessmentConfig?: (version:string) => any, lookupBank?: (bankVersion:string) => any }} [options]
 */
export function createCourseRegistry(definitions, { lookupAssessmentConfig = getAssessmentConfig, lookupBank = lookupInstalledBank } = {}) {
  const bySlug = new Map();
  const prefixes = new Set();
  const versionOwners = new Map();
  const bankOwners = new Map();
  for (const def of definitions) {
    validateCourse(def, lookupAssessmentConfig, lookupBank);
    if (bySlug.has(def.slug)) throw new Error(`Duplicate course slug: ${def.slug}`);
    if (prefixes.has(def.resources.credentialPrefix)) throw new Error(`Duplicate credential prefix: ${def.resources.credentialPrefix}`);
    for (const v of def.assessment.versions) {
      if (versionOwners.has(v)) throw new Error(`Assessment version ${v} is claimed by ${versionOwners.get(v)} and ${def.slug}`);
      versionOwners.set(v, def.slug);
    }
    for (const b of def.assessment.bankVersions) {
      if (bankOwners.has(b)) throw new Error(`Content bank ${b} is claimed by ${bankOwners.get(b)} and ${def.slug}`);
      bankOwners.set(b, def.slug);
    }
    prefixes.add(def.resources.credentialPrefix);
    bySlug.set(def.slug, deepFreeze(structuredClone(def)));
  }

  /** Active course by slug, or null. Never throws, never defaults. */
  function getCourse(slug, { includeDraft = false } = {}) {
    if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug)) return null;
    const course = bySlug.get(slug) || null;
    if (!course) return null;
    return course.status === 'active' || includeDraft ? course : null;
  }

  /**
   * Version-aware assessment resolution for a stored attempt (or a new one
   * when `version` is the course's current version). Explicit version only.
   * @returns {{ ok:true, course:CourseDefinition, config:any } | { ok:false, reason:string }}
   */
  function resolveAssessmentConfig(slug, version) {
    const course = getCourse(slug);
    if (!course) return { ok: false, reason: 'unknown_course' };
    if (typeof version !== 'string' || !version) return { ok: false, reason: 'missing_assessment_version' };
    if (!course.assessment.versions.includes(version)) return { ok: false, reason: 'assessment_version_not_for_course' };
    let config;
    try { config = lookupAssessmentConfig(version); } catch (_) { config = null; }
    if (!config || config.courseSlug !== slug) return { ok: false, reason: 'assessment_version_not_for_course' };
    return { ok: true, course, config };
  }

  function resolveCurrentAssessmentConfig(slug) {
    const course = getCourse(slug);
    return course ? resolveAssessmentConfig(slug, course.assessment.current) : { ok: false, reason: 'unknown_course' };
  }

  function bankFor(course, bankVersion) {
    if (typeof bankVersion !== 'string' || !bankVersion) return { ok: false, reason: 'missing_bank_version' };
    if (!course.assessment.bankVersions.includes(bankVersion)) return { ok: false, reason: 'bank_version_not_for_course' };
    let banks;
    try { banks = lookupBank(bankVersion); } catch (_) { banks = null; }
    if (!banks || banks.bankVersion !== bankVersion) return { ok: false, reason: 'bank_unavailable' };
    return { ok: true, banks };
  }

  /**
   * Everything an EXISTING attempt is held to -- course, rules (config,
   * incl. critical domains) and content banks -- taken only from the
   * attempt row's own persisted course_slug / assessment_version /
   * bank_version. Never "current", never another course's.
   * @returns {{ ok:true, course, config, banks } | { ok:false, reason:string }}
   */
  function resolveAttemptContent(attempt) {
    if (!attempt || typeof attempt !== 'object') return { ok: false, reason: 'missing_attempt' };
    const rules = resolveAssessmentConfig(attempt.course_slug, attempt.assessment_version);
    if (!rules.ok) return rules;
    if (attempt.standard_version != null && attempt.standard_version !== rules.config.standardVersion) {
      return { ok: false, reason: 'standard_version_mismatch' };
    }
    const bank = bankFor(rules.course, attempt.bank_version);
    if (!bank.ok) return bank;
    return { ok: true, course: rules.course, config: rules.config, banks: bank.banks };
  }

  /** Current rules + content for a NEW attempt on an active course. */
  function resolveNewAttemptContent(slug) {
    const rules = resolveCurrentAssessmentConfig(slug);
    if (!rules.ok) return rules;
    const bank = bankFor(rules.course, rules.config.bankVersion);
    if (!bank.ok) return bank;
    return { ok: true, course: rules.course, config: rules.config, banks: bank.banks };
  }

  return Object.freeze({
    getCourse,
    resolveAssessmentConfig,
    resolveCurrentAssessmentConfig,
    resolveAttemptContent,
    resolveNewAttemptContent,
    /** Credential ID prefix for an active course, or null. */
    credentialPrefixFor(slug) {
      const course = getCourse(slug);
      return course ? course.resources.credentialPrefix : null;
    },
    /** Certificate / public-verification course title for an active course, or null. */
    certificateTitleFor(slug) {
      const course = getCourse(slug);
      return course ? course.title : null;
    },
    /** Module ids that must be complete before the final assessment, or null for an unknown course. */
    requiredModulesForFinalAssessment(slug) {
      const course = getCourse(slug);
      return course ? course.modules.requiredForFinalAssessment : null;
    },
    listCourses({ includeDraft = false } = {}) {
      return [...bySlug.values()].filter((c) => includeDraft || c.status === 'active');
    },
  });
}

/** The production registry. Head Spa is the only course. */
export const courseRegistry = createCourseRegistry([HEADSPA_MASTERY]);

let activeRegistry = courseRegistry;

/**
 * TEST SEAM ONLY -- lets endpoint tests run against a registry that also
 * holds a synthetic second course. Production code must never call this
 * (enforced by tests/course-registry-phase2a.test.mjs). Returns a restore fn.
 */
export function __useCourseRegistryForTests(registry) {
  const previous = activeRegistry;
  activeRegistry = registry;
  return () => { activeRegistry = previous; };
}

// Shared infrastructure calls these; they delegate to the active registry.
export const getCourse = (...args) => activeRegistry.getCourse(...args);
export const resolveAssessmentConfig = (...args) => activeRegistry.resolveAssessmentConfig(...args);
export const resolveCurrentAssessmentConfig = (...args) => activeRegistry.resolveCurrentAssessmentConfig(...args);
export const resolveAttemptContent = (...args) => activeRegistry.resolveAttemptContent(...args);
export const resolveNewAttemptContent = (...args) => activeRegistry.resolveNewAttemptContent(...args);
export const credentialPrefixFor = (...args) => activeRegistry.credentialPrefixFor(...args);
export const certificateTitleFor = (...args) => activeRegistry.certificateTitleFor(...args);
export const requiredModulesForFinalAssessment = (...args) => activeRegistry.requiredModulesForFinalAssessment(...args);
export const listCourses = (...args) => activeRegistry.listCourses(...args);

/**
 * Course named explicitly by a request (body/query), for shared endpoints.
 * Absent (undefined/null) -> Head Spa, for compatibility with the existing
 * client, which sends none. Anything else must be an active registry slug;
 * an explicit invalid value NEVER falls back to Head Spa.
 * @returns {{ ok:true, slug:string } | { ok:false, reason:'unknown_course' }}
 */
export function resolveRequestedCourse(requested) {
  if (requested === undefined || requested === null) return { ok: true, slug: HEADSPA_MASTERY.slug };
  const course = getCourse(requested);
  return course ? { ok: true, slug: course.slug } : { ok: false, reason: 'unknown_course' };
}
