// AIMT Dashboard + Resources launch pass — deterministic coverage.
//
// Closes Gate 1's remaining P1-3 (no course -> dashboard navigation) and
// P1-4 (Performance Review dashboard promise unbuilt), plus the related
// P2-1 (certificate access buried behind several clicks) and P2-2
// (Resources Library effectively empty). See
// docs/course-audit/00-aimt-launch-readiness-gate-1.md for the full
// findings this closes.
//
// This is a flat-HTML site with no build step and no DOM test runner
// (see CLAUDE.md) -- the established pattern this repo already uses for
// verifying embedded HTML/inline-script behavior is to read the real
// shipped source and either (a) regex-verify specific structural markers,
// or (b) execute the real extracted function body against mocked
// dependencies. Both are used here; nothing is re-implemented separately
// from the production file it verifies.
//
// No Anthropic API calls. Run: node tests/aimt-dashboard-resources-launch.test.mjs

import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { loadCheckpointRubrics } from '../scripts/cadence-model-regression/load-checkpoint-rubrics.mjs';
import { rubricVersionTag } from '../functions/_lib/cadence/checkpoint-evaluation.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const courseSrc = readFileSync(path.join(ROOT, 'headspa-mastery.html'), 'utf8');
const dashboardSrc = readFileSync(path.join(ROOT, 'my-aimt.html'), 'utf8');
const registrySrc = readFileSync(path.join(ROOT, 'assets/js/aimt-course-resources.js'), 'utf8');
const m12Src = readFileSync(path.join(ROOT, 'assets/js/module12-certification.js'), 'utf8');
const issueCertSrc = readFileSync(path.join(ROOT, 'functions/api/issue-certificate.js'), 'utf8');
const claimAccessSrc = readFileSync(path.join(ROOT, 'functions/api/claim-course-access.js'), 'utf8');
const turnLockSrc = readFileSync(path.join(ROOT, 'functions/_lib/cadence/turn-lock.mjs'), 'utf8');
const submitCaseSrc = readFileSync(path.join(ROOT, 'functions/api/certification/submit-case.js'), 'utf8');

/* Load the real resource registry by actually executing it (not
   re-parsing/re-typing it), the same way a <script> tag would. */
const registrySandboxWindow = {};
new Function('window', registrySrc)(registrySandboxWindow);
const REGISTRY = registrySandboxWindow.AIMT_COURSE_RESOURCES;

/* Extract a top-level `async function name(...) { ... }` body verbatim
   from a source file via balanced-brace matching, so tests execute the
   exact shipped code rather than a hand-copied re-implementation. */
function extractFunctionSource(src, signature) {
  const start = src.indexOf(signature);
  if (start === -1) throw new Error('signature not found: ' + signature);
  const braceStart = src.indexOf('{', start);
  let depth = 0;
  for (let i = braceStart; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error('unbalanced braces for: ' + signature);
}

// ─────────────────────────────────────────────────────────────────────────
// A. COURSE -> DASHBOARD LINK EXISTS IN ACTIVE PRODUCTION COURSE UI (P1-3)
// ─────────────────────────────────────────────────────────────────────────
(function courseToDashboardLinkTests() {
  check('A. COURSE -> DASHBOARD LINK', 'Lesson-nav bar (present on every module, including Module 12) has a direct link to my-aimt.html',
    /class="ln-dash" href="my-aimt\.html"/.test(courseSrc));
  check('A. COURSE -> DASHBOARD LINK', 'Course-home brand row (the destination of every "Back"/"Return to course home" control) also has a direct link to my-aimt.html',
    /class="brand-dash-link" href="my-aimt\.html"/.test(courseSrc));
  check('A. COURSE -> DASHBOARD LINK', 'Both dashboard links are plain anchors, not onclick-driven (cannot run arbitrary JS on click)',
    !/class="ln-dash" href="my-aimt\.html"[^>]*onclick/.test(courseSrc) &&
    !/class="brand-dash-link" href="my-aimt\.html"[^>]*onclick/.test(courseSrc));
  check('A. COURSE -> DASHBOARD LINK', 'my-aimt.html is a real file that exists on disk',
    existsSync(path.join(ROOT, 'my-aimt.html')));
})();

// ─────────────────────────────────────────────────────────────────────────
// B. DASHBOARD -> COURSE LINK REMAINS VALID
// ─────────────────────────────────────────────────────────────────────────
(function dashboardToCourseLinkTests() {
  check('B. DASHBOARD -> COURSE LINK', 'my-aimt.html\'s COURSES registry still points headspa-mastery at headspa-mastery.html?enter=1',
    /entry:\s*'headspa-mastery\.html\?enter=1'/.test(dashboardSrc));
  check('B. DASHBOARD -> COURSE LINK', 'headspa-mastery.html still recognizes ?enter=1 as the dashboard\'s purchased-course entry flag',
    /params\.get\('enter'\) === '1'/.test(courseSrc));
  check('B. DASHBOARD -> COURSE LINK', 'headspa-mastery.html is a real file that exists on disk',
    existsSync(path.join(ROOT, 'headspa-mastery.html')));
})();

// ─────────────────────────────────────────────────────────────────────────
// C. NAVIGATION DOES NOT MUTATE COURSE PROGRESS / CHECKPOINT STATE
// ─────────────────────────────────────────────────────────────────────────
(function navigationDoesNotMutateStateTests() {
  const enterFn = extractFunctionSource(courseSrc, 'async function enterPurchasedCourseHome()');
  check('C. NAV DOES NOT MUTATE STATE', 'The certificate/Performance Review deep-link handler never calls markModuleComplete (does not mark content complete)',
    !/markModuleComplete/.test(enterFn));
  check('C. NAV DOES NOT MUTATE STATE', 'The certificate/Performance Review deep-link handler never calls showCertificate() itself (does not issue a certificate on mere navigation)',
    !/showCertificate\(/.test(enterFn));
  check('C. NAV DOES NOT MUTATE STATE', 'The certificate/Performance Review deep-link handler never activates Review Mode',
    !/ReviewMode\.(activate|enable|start)/.test(enterFn));
  check('C. NAV DOES NOT MUTATE STATE', 'The deep-link only opens Module 12 when APP_STATE.canAccessModule(12) is true (same gate a manual click would hit -- no bypass)',
    /openCertificateView && APP_STATE\.canAccessModule\(12\)/.test(enterFn));
  check('C. NAV DOES NOT MUTATE STATE', 'The non-deep-link path is unchanged: still lands on courseHome via setCurrentView(\'home\'), never a module',
    /document\.getElementById\('courseHome'\)\.classList\.add\('active'\)/.test(enterFn) && /APP_STATE\.setCurrentView\('home'\)/.test(enterFn));
  check('C. NAV DOES NOT MUTATE STATE', 'A sync failure during the deep-link check is caught, not left to crash/skip rendering (best-effort hydrate only)',
    /try \{ await AIMT_SYNC\.init\(supabaseClient, 'headspa-mastery'\); \} catch/.test(enterFn));
})();

// ─────────────────────────────────────────────────────────────────────────
// D/E. RESOURCE ENTITLEMENT GATING
// ─────────────────────────────────────────────────────────────────────────
const resourceEntitlementTestsDone = (function resourceEntitlementTests() {
  const loadResourcesFn = extractFunctionSource(dashboardSrc, 'async function loadResources(entitledSlugs)');
  // Execute the real, unmodified loadResources() against a mocked document,
  // once with a real entitlement and once with none -- proves the gate is
  // the entitledSlugs input, not any assumption baked into the registry.
  function runLoadResources(entitledSlugs) {
    let renderedHtml = '';
    const fakeCard = { set innerHTML(v) { renderedHtml = v; }, get innerHTML() { return renderedHtml; } };
    const fakeDocument = { getElementById: (id) => (id === 'resourcesCard' ? fakeCard : null) };
    const sandbox = { document: fakeDocument, window: { AIMT_COURSE_RESOURCES: REGISTRY } };
    const fn = new Function('document', 'window', `return (${loadResourcesFn});`)(sandbox.document, sandbox.window);
    return fn(entitledSlugs).then(() => renderedHtml);
  }

  return Promise.all([
    runLoadResources(['headspa-mastery']),
    runLoadResources([]),
    runLoadResources(['some-other-course-not-owned']),
  ]).then(([entitledHtml, noneHtml, wrongCourseHtml]) => {
    check('D. ENTITLED SEES RESOURCES', 'An entitled student (headspa-mastery in entitledSlugs) sees the real Module 9/10/11 downloads',
      /Head Spa Enhancement Strategy Guide/.test(entitledHtml) &&
      /Between-Client Sanitation/.test(entitledHtml) &&
      /AIMT AI Practice Toolkit/.test(entitledHtml));
    check('D. ENTITLED SEES RESOURCES', 'An entitled student also sees the AIMT Service Timer tool entry',
      /AIMT Service Timer/.test(entitledHtml));
    check('E. NON-ENTITLED CANNOT GET RESOURCE UI', 'A student with zero entitled slugs sees the empty state, not any resource item',
      /will appear here as they're released/.test(noneHtml) && !/Enhancement Strategy Guide/.test(noneHtml));
    check('E. NON-ENTITLED CANNOT GET RESOURCE UI', 'A slug not present in the registry renders the empty state, not a crash or fabricated content',
      /will appear here as they're released/.test(wrongCourseHtml));
    check('E. NON-ENTITLED CANNOT GET RESOURCE UI', 'loadResources() is only ever called with loadCourses()\'s own return value in my-aimt.html (the RLS-scoped course_entitlements read), never a separately-trusted client flag',
      /const entitledSlugs = await loadCourses\(email\);/.test(dashboardSrc) &&
      /loadResources\(entitledSlugs\)/.test(dashboardSrc));
  });
})();

// ─────────────────────────────────────────────────────────────────────────
// F/G. RESOURCE REGISTRY REFERENCES ONLY REAL FILES -- NO BROKEN HREFS
// ─────────────────────────────────────────────────────────────────────────
(function resourceRegistryFileExistenceTests() {
  const entries = REGISTRY['headspa-mastery'] || [];
  check('F. RESOURCE REGISTRY REAL FILES', 'Registry has at least the 5 verified real course resources plus the Service Timer tool',
    entries.length >= 6);
  entries.forEach((r) => {
    check('F. RESOURCE REGISTRY REAL FILES', `"${r.title}" href is a relative repo path, not an external URL`,
      !/^https?:\/\//.test(r.href));
    const filePath = path.join(ROOT, r.href);
    const exists = existsSync(filePath);
    check('G. NO BROKEN RESOURCE HREFS', `"${r.title}" (${r.href}) exists on disk`, exists);
    if (exists) {
      check('G. NO BROKEN RESOURCE HREFS', `"${r.title}" is a real, non-empty file (not a 0-byte placeholder)`,
        statSync(filePath).size > 0);
    }
    check('F. RESOURCE REGISTRY REAL FILES', `"${r.title}" has a title, description, moduleLabel, and a recognized type`,
      !!r.title && !!r.description && !!r.moduleLabel && (r.type === 'download' || r.type === 'tool'));
  });
  check('F. RESOURCE REGISTRY REAL FILES', 'The previously-deferred, never-created Module 9 "Enhancement Menu & Positioning Guide" is correctly NOT in the registry (would be fabricating a missing resource)',
    !entries.some((r) => /Enhancement Menu.*Positioning/i.test(r.title)));
})();

// ─────────────────────────────────────────────────────────────────────────
// H/I/J. CERTIFICATE STATE TRUTHFULNESS + SERVER AUTHORITY
// ─────────────────────────────────────────────────────────────────────────
const certificateStateTestsDone = (function certificateStateTests() {
  const loadCertificatesFn = extractFunctionSource(dashboardSrc, 'async function loadCertificates()');

  function runLoadCertificates({ completions, attempts }) {
    let renderedHtml = '';
    const fakeArea = { set innerHTML(v) { renderedHtml = v; }, get innerHTML() { return renderedHtml; } };
    const fakeDocument = { getElementById: (id) => (id === 'certArea' ? fakeArea : null) };
    function makeQuery(rows) {
      const q = {
        eq() { return q; },
        order() { return Promise.resolve({ data: rows }); },
        then(resolve) { return Promise.resolve({ data: rows }).then(resolve); },
      };
      return q;
    }
    const fakeSupabase = {
      from(table) {
        if (table === 'completions') return { select: () => makeQuery(completions) };
        if (table === 'certification_attempts') return { select: () => makeQuery(attempts) };
        throw new Error('unexpected table: ' + table);
      },
    };
    const sandbox = {
      document: fakeDocument,
      supabaseClient: fakeSupabase,
      currentUser: { id: 'user-1' },
      COURSES: { 'headspa-mastery': { title: 'HeadSpa Mastery', entry: 'headspa-mastery.html?enter=1' } },
    };
    const fn = new Function(
      'document', 'supabaseClient', 'currentUser', 'COURSES',
      `return (${loadCertificatesFn});`
    )(sandbox.document, sandbox.supabaseClient, sandbox.currentUser, sandbox.COURSES);
    return fn().then(() => renderedHtml);
  }

  return Promise.all([
    runLoadCertificates({ completions: [], attempts: [] }),
    runLoadCertificates({
      completions: [],
      attempts: [{ course_slug: 'headspa-mastery', certification_decision: 'not_yet_passed', attempt_number: 2 }],
    }),
    runLoadCertificates({
      completions: [{ credential_id: 'AIMT-HS-2026-ABC123', course_slug: 'headspa-mastery', student_name: 'Jane Doe', completed_at: '2026-08-01T00:00:00Z', revoked: false }],
      attempts: [],
    }),
    runLoadCertificates({
      completions: [{ credential_id: 'AIMT-HS-2026-OLD999', course_slug: 'headspa-mastery', student_name: 'Jane Doe', completed_at: '2026-08-01T00:00:00Z', revoked: true }],
      attempts: [],
    }),
  ]).then(([inProgressHtml, notYetPassedHtml, certifiedHtml, revokedHtml]) => {
    check('H. NO CERT FOR NON-PASS', 'Course in progress (no completions, no finalized attempt) shows the honest generic empty state, no certificate, no Performance Review claim',
      /will appear here when you complete a course/.test(inProgressHtml) &&
      !/Certified/.test(inProgressHtml) && !/Performance Review/.test(inProgressHtml));
    check('H. NO CERT FOR NON-PASS', 'A finalized not_yet_passed attempt shows "Assessment not yet passed" with a Performance Review entry point, never a "Certified" claim or a fabricated credential ID',
      /Assessment not yet passed/.test(notYetPassedHtml) && /View Performance Review/.test(notYetPassedHtml) &&
      !/Certified/.test(notYetPassedHtml) && !/Credential ID/.test(notYetPassedHtml));
    check('H. NO CERT FOR NON-PASS', 'A revoked completions row is excluded entirely (falls back to the honest empty state)',
      /will appear here when you complete a course/.test(revokedHtml) && !/Certified/.test(revokedHtml));
    check('I. CERT ACCESS FOR PASS', 'An active (non-revoked) completions row renders "Certified" with the real credential ID and student name',
      /Certified/.test(certifiedHtml) && /AIMT-HS-2026-ABC123/.test(certifiedHtml) && /Jane Doe/.test(certifiedHtml));
    check('I. CERT ACCESS FOR PASS', 'The certified card\'s "View certificate" link deep-links into the course with &cert=1 (direct Module 12 access, not just the course entry)',
      /href="headspa-mastery\.html\?enter=1&cert=1"/.test(certifiedHtml));
    check('I. CERT ACCESS FOR PASS', 'The certified card still links to the independent verify.html verification page',
      /href="verify\.html"/.test(certifiedHtml));
  }).then(() => {
    check('J. CERT ISSUANCE SERVER-AUTHORITATIVE', 'issue-certificate.js still requires a service-role key and rejects if missing (never issues from an unauthenticated/anonymous request)',
      /SUPABASE_SERVICE_ROLE_KEY/.test(issueCertSrc) && /Sign in required/.test(issueCertSrc));
    check('J. CERT ISSUANCE SERVER-AUTHORITATIVE', 'issue-certificate.js still requires certification_decision eq.pass read from certification_attempts before issuing (course completion alone is not enough)',
      /certification_decision:\s*'eq\.pass'/.test(issueCertSrc));
    check('J. CERT ISSUANCE SERVER-AUTHORITATIVE', 'issue-certificate.js is still idempotent (checks for an existing non-revoked completions row before inserting)',
      /revoked:\s*'eq\.false'/.test(issueCertSrc) && /already_issued/.test(issueCertSrc));
    check('J. CERT ISSUANCE SERVER-AUTHORITATIVE', 'The dashboard never calls /api/issue-certificate itself -- it only deep-links into the course, where the existing showCertificate() button remains the one issuance trigger',
      !/issue-certificate/.test(dashboardSrc));
  });
})();

// ─────────────────────────────────────────────────────────────────────────
// K/L. PERFORMANCE REVIEW: TRUTH TEST
// ─────────────────────────────────────────────────────────────────────────
(function performanceReviewTruthTests() {
  check('K. PERFORMANCE REVIEW MATCHES CAPABILITY', 'The real, pre-existing performanceReviewBlock() in module12-certification.js is untouched by this task (dashboard reuses it via deep link, never duplicates its rendering)',
    /function performanceReviewBlock\(review\)/.test(m12Src));
  check('K. PERFORMANCE REVIEW MATCHES CAPABILITY', 'The real, pre-existing /request-review workflow is untouched (dashboard does not build a second one)',
    /apiPost\('\/request-review'/.test(m12Src));
  check('K. PERFORMANCE REVIEW MATCHES CAPABILITY', 'The real, pre-existing GET /get-status endpoint is untouched (Module12Cert.render always re-fetches live authoritative state)',
    /apiGet\('\/get-status'\)/.test(m12Src));
  check('K. PERFORMANCE REVIEW MATCHES CAPABILITY', 'The dashboard\'s not-yet-passed card does not fabricate score/domain data inline -- it only links into the real Module 12 render',
    !/knowledge_score|applied_cases_score|interview_score|criticalDomainResults/.test(dashboardSrc));
  check('L. NO FALSE PERFORMANCE REVIEW PROMISE', 'Module 12\'s existing dashboard promise copy is unchanged (still names Performance Review, resources, and certificate)',
    /Your AIMT resources, certification record, Performance Review, and certificate will remain available from your Student Dashboard/.test(m12Src));
  check('L. NO FALSE PERFORMANCE REVIEW PROMISE', 'The dashboard (my-aimt.html) now actually contains a Performance Review entry point, closing the previously-false promise',
    /Performance Review/.test(dashboardSrc));
  check('L. NO FALSE PERFORMANCE REVIEW PROMISE', 'The course itself now has a real path back to that dashboard (the promise is reachable end-to-end, not just half-built)',
    /class="ln-dash" href="my-aimt\.html"/.test(courseSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// M/N. RESUME + HISTORICAL PASS BEHAVIOR UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function resumeAndHistoricalBehaviorTests() {
  check('M. RESUME STATE CORRECT', 'openModuleById still gates on APP_STATE.setCurrentModule()\'s own canAccessModule() check (no new bypass introduced for the deep link)',
    /if \(!APP_STATE\.setCurrentModule\(id\)\) return;/.test(courseSrc));
  check('M. RESUME STATE CORRECT', 'resumeCourse() (the dashboard\'s normal "Continue" path) is untouched -- still calls getResumeModuleId()',
    /function resumeCourse\(\) \{\s*openModuleById\(APP_STATE\.getResumeModuleId\(\), \{ restoreScroll: true \}\);/.test(courseSrc));
  check('N. HISTORICAL PASS UNCHANGED', 'A passed checkpoint\'s input-lock guard (status === \'passed\') is untouched',
    /status === 'passed'/.test(readFileSync(path.join(ROOT, 'assets/js/cadence-shell.js'), 'utf8')));
  check('N. HISTORICAL PASS UNCHANGED', 'The 22-checkpoint rubric/question extraction from headspa-mastery.html hashes to the exact pre-task fingerprint -- no checkpoint content anywhere was touched',
    rubricVersionTag(JSON.stringify(loadCheckpointRubrics())) === 'rubric-f6f22d2b');
})();

// ─────────────────────────────────────────────────────────────────────────
// O/P/Q. CADENCE MODELS, CHECKPOINT GATE MAP, MODULE 12 STANDARDS UNCHANGED
// ─────────────────────────────────────────────────────────────────────────
(function unchangedSystemsTests() {
  check('O. CADENCE MODELS UNCHANGED', 'Checkpoint grading still resolves CADENCE_GRADING_MODEL (P1-1 fix intact), never CADENCE_CHAT_MODEL',
    /resolveCadenceModel\(env, 'CADENCE_GRADING_MODEL'\)/.test(readFileSync(path.join(ROOT, 'functions/_lib/cadence/checkpoint-evaluation.mjs'), 'utf8')));
  check('O. CADENCE MODELS UNCHANGED', 'Ask Cadence still resolves CADENCE_CHAT_MODEL',
    /resolveCadenceModel\(env, 'CADENCE_CHAT_MODEL'\)/.test(readFileSync(path.join(ROOT, 'functions/_lib/cadence/ask-cadence.mjs'), 'utf8')));
  check('O. CADENCE MODELS UNCHANGED', 'Module 12\'s interview grader still resolves CADENCE_GRADING_MODEL',
    /resolveCadenceModel\(env, 'CADENCE_GRADING_MODEL'\)/.test(readFileSync(path.join(ROOT, 'functions/_lib/certification/cadence-grader.mjs'), 'utf8')));

  check('P. 22 CHECKPOINT GATE MAP UNCHANGED', 'Full extracted rubric/question set still hashes to the pre-task fingerprint',
    rubricVersionTag(JSON.stringify(loadCheckpointRubrics())) === 'rubric-f6f22d2b');
  const rubrics = loadCheckpointRubrics();
  const moduleKeys = Object.keys(rubrics);
  const checkpointCount = moduleKeys.reduce((n, k) => n + Object.keys(rubrics[k].questions || {}).length, 0);
  check('P. 22 CHECKPOINT GATE MAP UNCHANGED', 'Exactly 22 checkpoints still exist across M0-M11',
    checkpointCount === 22);

  const contentBankSrc = readFileSync(path.join(ROOT, 'functions/_lib/certification/content-bank.mjs'), 'utf8');
  check('Q. MODULE 12 STANDARDS UNCHANGED', 'bankVersion is unchanged',
    /export const bankVersion = 'headspa-fe-bank-v1-2026-08-26'/.test(contentBankSrc));
  check('Q. MODULE 12 STANDARDS UNCHANGED', 'issue-certificate.js\'s REQUIRED_SCORE (modules 0-11 complete gate) is unchanged',
    /const REQUIRED_SCORE = 1200;/.test(issueCertSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// R/S. ENTITLEMENT + MODULE 12 CONCURRENCY FIXES REMAIN INTACT
// ─────────────────────────────────────────────────────────────────────────
(function priorHardeningIntactTests() {
  check('R. ENTITLEMENT FIX INTACT', 'claim-course-access.js still requires resolveUser(env, request) (P0-2 fix intact)',
    /resolveUser\(env, request\)/.test(claimAccessSrc));
  check('R. ENTITLEMENT FIX INTACT', 'claim-course-access.js still cross-checks the authenticated caller\'s email against the Stripe-verified session email',
    /authenticatedEmail !== sessionEmail/.test(claimAccessSrc));
  check('R. ENTITLEMENT FIX INTACT', 'claim-course-access.js no longer trusts a client-supplied userId',
    !/body\.userId/.test(claimAccessSrc));

  check('S. MODULE 12 CONCURRENCY INTACT', 'turn-lock.mjs still exports the compare-and-swap helpers (P1-2/P2-4/P2-5 fixes intact)',
    /export function jsonLockFieldFilterKey/.test(turnLockSrc) && /export function casPatchSucceeded/.test(turnLockSrc));
  check('S. MODULE 12 CONCURRENCY INTACT', 'submit-case.js still claims a per-case in-flight lock before calling Cadence',
    /evalInFlightAt/.test(submitCaseSrc) && /jsonLockFieldFilterKey/.test(submitCaseSrc));
})();

// ---- Report ----
// Top-level await (this is an ES module): wait for the two async IIFEs
// above (D/E resource gating, H/I/J certificate states) to push all their
// check() calls into `results` before reporting.
await Promise.all([resourceEntitlementTestsDone, certificateStateTestsDone]);

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
