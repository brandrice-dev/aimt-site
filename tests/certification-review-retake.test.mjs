// Regression tests for two Module 12 owner-QA findings found after the
// Part III conversation-progression fix (f052c18):
//
//  1. "Review My Recommended Sections" was a dead button (routed to
//     window.showHome() with no actual recommendation content -- the
//     underlying weakCompetencyAreas data was never populated server-side,
//     only ever an empty array with a "authored in a later phase" comment).
//  2. Attempt 2 appeared to require only selected portions of the
//     assessment rather than a fresh full 40/4/3 attempt. Root cause was
//     entirely in the LOCAL QA HARNESS (scripts/review-module12-bank.mjs):
//     production's start-attempt.js already always creates a genuinely new
//     attempt row with a real constrained draw and retake-overlap
//     minimization -- but the harness's mock start-attempt endpoint just
//     echoed back whatever session state already existed (even a fully
//     completed one) forever, no matter how many times it was called.
//
// Fix summary:
//  - functions/_lib/certification/attempt-ladder.mjs gained a pure
//    collectWeakCompetencyAreas() helper (dedupes missed-item/low-scoring
//    "weak spots" into competency+module rows) alongside the pre-existing
//    buildRemediationAssignments().
//  - functions/api/certification/finalize-assessment.js now actually calls
//    it (recomputing misses from stored responses, same principle as its
//    existing Part I recompute) instead of hardcoding weakCompetencyAreas
//    to [].
//  - assets/js/module12-certification.js gained renderRecommendedReview(),
//    wired to both "Review My Recommended Sections" and "Begin My
//    Remediation Plan" (same underlying data/feature, different ladder
//    stage), reading status.remediation and using real course navigation
//    (window.openModuleById) -- never inventing anchors, never leaking an
//    answer key, never mutating attempt state.
//  - scripts/review-module12-bank.mjs's start-attempt/get-status endpoints
//    now use the REAL determineNextAttemptEligibility()/scoreKnowledge
//    Responses()/collectWeakCompetencyAreas()/buildRemediationAssignments()
//    engine functions (imported, not reimplemented), so "Start Attempt 2"
//    genuinely creates a new attempt with a real 4/3 draw, zero carried-
//    over responses/locks, and the real Attempt-3 remediation gate is
//    actually exercisable locally.
//
// Run: node tests/certification-review-retake.test.mjs

import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { collectWeakCompetencyAreas, buildRemediationAssignments, determineNextAttemptEligibility } from '../functions/_lib/certification/attempt-ladder.mjs';
import { getCurrentAssessmentConfig } from '../functions/_lib/certification/assessment-config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const config = getCurrentAssessmentConfig();

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const clientSrc = readFileSync(path.join(ROOT, 'assets/js/module12-certification.js'), 'utf8');
const finalizeSrc = readFileSync(path.join(ROOT, 'functions/api/certification/finalize-assessment.js'), 'utf8');
const ladderSrc = readFileSync(path.join(ROOT, 'functions/_lib/certification/attempt-ladder.mjs'), 'utf8');

function fnBody(src, name) {
  const re = new RegExp('function ' + name + '\\s*\\([^)]*\\)\\s*\\{');
  const m = src.match(re);
  if (!m) return null;
  let i = m.index + m[0].length;
  let depth = 1;
  const start = i;
  while (i < src.length && depth > 0) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  }
  return src.slice(start, i - 1);
}

// ---- PURE: collectWeakCompetencyAreas() ----
(function collectWeakCompetencyAreasUnitTests() {
  check('collectWeakCompetencyAreas', 'Empty input returns empty array', collectWeakCompetencyAreas([]).length === 0);
  check('collectWeakCompetencyAreas', 'Undefined input does not throw and returns empty array', collectWeakCompetencyAreas(undefined).length === 0);

  const deduped = collectWeakCompetencyAreas([
    { competency: 'Consent & Touch Authority', sourceModules: [5], sectionRef: '5.2' },
    { competency: 'Consent & Touch Authority', sourceModules: [5], sectionRef: '5.9' }, // same competency+module -- deduped, first sectionRef wins
    { competency: 'Sanitation Between Clients', sourceModules: [10] },
  ]);
  check('collectWeakCompetencyAreas', 'Same competency+primary-module deduped to one row', deduped.length === 2, JSON.stringify(deduped));
  check('collectWeakCompetencyAreas', 'First occurrence\'s sectionRef is preserved on dedup', deduped.find((a) => a.competency === 'Consent & Touch Authority').sectionRef === '5.2');
  check('collectWeakCompetencyAreas', 'moduleRef is a string (matches buildRemediationAssignments\' expected shape)', typeof deduped[0].moduleRef === 'string');

  const missingModule = collectWeakCompetencyAreas([{ competency: 'No module info', sourceModules: [] }]);
  check('collectWeakCompetencyAreas', 'A weak spot with no source module is skipped (nothing to link "Open Module" to)', missingModule.length === 0);

  const missingCompetency = collectWeakCompetencyAreas([{ competency: '', sourceModules: [3] }]);
  check('collectWeakCompetencyAreas', 'A weak spot with a blank competency label is skipped', missingCompetency.length === 0);

  const multiModule = collectWeakCompetencyAreas([{ competency: 'Cross-module case', sourceModules: [4, 8] }]);
  check('collectWeakCompetencyAreas', 'Multi-module weak spots use the first (primary) module', multiModule[0].moduleRef === '4');
})();

// ---- PURE: collectWeakCompetencyAreas() -> buildRemediationAssignments() -> determineNextAttemptEligibility() end-to-end ----
(function remediationGateEndToEnd() {
  const weakSpots = [];
  for (let i = 0; i < 5; i++) weakSpots.push({ competency: 'Fixture competency ' + i, sourceModules: [i + 1] });
  const weakCompetencyAreas = collectWeakCompetencyAreas(weakSpots);
  const clearedDomains = ['D1', 'D2', 'D3', 'D4'].map((id) => ({ domainId: id, cleared: true }));
  const assignments = buildRemediationAssignments({ criticalDomainResults: clearedDomains, weakCompetencyAreas });
  check('Remediation gate e2e', 'buildRemediationAssignments produces one row per distinct weak competency area (no critical-domain rows, all cleared)', assignments.length === 5, JSON.stringify(assignments.length));
  check('Remediation gate e2e', 'Every produced row is required_before_next_attempt', assignments.every((a) => a.required_before_next_attempt === true));

  const remediationAssignments = assignments.map((a) => ({ ...a, completed: false }));
  const afterAttempt1 = determineNextAttemptEligibility({ attempts: [{ attemptNumber: 1, decision: 'not_yet_passed', criticalDomainResults: clearedDomains }], remediationAssignments, config });
  check('Remediation gate e2e', 'Outstanding non-critical-domain remediation does NOT block Attempt 2 (institutional rule: gate applies before Attempt 3, not Attempt 2)', afterAttempt1.canStartNewAttempt === true && afterAttempt1.nextAttemptNumber === 2, JSON.stringify(afterAttempt1));

  const afterAttempt2 = determineNextAttemptEligibility({ attempts: [{ attemptNumber: 1, decision: 'not_yet_passed', criticalDomainResults: clearedDomains }, { attemptNumber: 2, decision: 'not_yet_passed', criticalDomainResults: clearedDomains }], remediationAssignments, config });
  check('Remediation gate e2e', 'The SAME outstanding remediation DOES block Attempt 3', afterAttempt2.canStartNewAttempt === false && afterAttempt2.blockedReason === 'remediation_required', JSON.stringify(afterAttempt2));

  const completed = remediationAssignments.map((a) => ({ ...a, completed: true }));
  const afterCompleting = determineNextAttemptEligibility({ attempts: [{ attemptNumber: 1, decision: 'not_yet_passed', criticalDomainResults: clearedDomains }, { attemptNumber: 2, decision: 'not_yet_passed', criticalDomainResults: clearedDomains }], remediationAssignments: completed, config });
  check('Remediation gate e2e', 'Marking that remediation completed unblocks Attempt 3', afterCompleting.canStartNewAttempt === true && afterCompleting.nextAttemptNumber === 3, JSON.stringify(afterCompleting));
  check('Remediation gate e2e', 'Attempt 3, once unlocked, is not a special "retest only what was missed" mode -- determineNextAttemptEligibility never returns a reduced item count; the assessment size is entirely start-attempt.js\'s assembleAttempt() call, unaffected by remediation state', !('partI' in afterCompleting) && !('itemCount' in afterCompleting));
})();

// ---- STATIC: finalize-assessment.js actually populates weakCompetencyAreas now ----
(function finalizeAssessmentStatic() {
  check('PRODUCTION finalize-assessment.js', 'Imports collectWeakCompetencyAreas', /collectWeakCompetencyAreas/.test(finalizeSrc));
  check('PRODUCTION finalize-assessment.js', 'Imports scoreInterviewConversation + interviewEvaluatorFlagsFromState to recompute per-interview weakness from stored state', /scoreInterviewConversation/.test(finalizeSrc) && /interviewEvaluatorFlagsFromState/.test(finalizeSrc));
  check('PRODUCTION finalize-assessment.js', 'weakCompetencyAreas is no longer hardcoded to an empty array', !/const weakCompetencyAreas = \[\];/.test(finalizeSrc));
  check('PRODUCTION finalize-assessment.js', 'Never includes a knowledge item\'s prompt/choices/rationale/correctChoice in the weak-spot data it builds', !/weakSpots\.push\(\{[^}]*\b(prompt|choices|rationale|correctChoice)\b/.test(finalizeSrc));
})();

// ---- STATIC: attempt-ladder.mjs exports the new helper, still pure (no I/O) ----
(function attemptLadderStatic() {
  check('LIB attempt-ladder.mjs', 'Exports collectWeakCompetencyAreas', /export function collectWeakCompetencyAreas/.test(ladderSrc));
  check('LIB attempt-ladder.mjs', 'File remains I/O-free (no fetch/supabaseRest/import of auth.mjs)', !/fetch\(|supabaseRest|from '\.\.\/[^']*auth\.mjs'/.test(ladderSrc));
})();

// ---- STATIC: client Recommended Review view ----
(function clientRecommendedReviewStatic() {
  const renderRecommendedReview = fnBody(clientSrc, 'renderRecommendedReview');
  check('CLIENT Recommended Review', 'renderRecommendedReview() exists', !!renderRecommendedReview);
  if (!renderRecommendedReview) return;

  check('CLIENT Recommended Review', 'Reads status.remediation (server-authoritative), not a client-invented list', /status\.remediation/.test(renderRecommendedReview));
  check('CLIENT Recommended Review', 'Never references rubric/answer-key fields (no exact failed item, no correct answer)', !/rubricCriteria|criterionScores|correctChoice|correctAnswer|\brationale\b/.test(renderRecommendedReview));
  check('CLIENT Recommended Review', 'Uses real course navigation (window.openModuleById) rather than inventing an anchor/URL scheme', /window\.openModuleById/.test(renderRecommendedReview));
  check('CLIENT Recommended Review', 'Opening a recommended module never calls apiPost (no start-attempt/submit-*/finalize-assessment network write)', !/apiPost/.test(renderRecommendedReview));
  check('CLIENT Recommended Review', 'Provides a way back to Performance Review via Module12Cert.render (re-fetches status, does not fabricate a result)', /Module12Cert\.render/.test(renderRecommendedReview));

  const onAttemptAction = fnBody(clientSrc, 'onAttemptAction');
  check('CLIENT Recommended Review', 'onAttemptAction() routes "Review My Recommended Sections" to renderRecommendedReview (button is no longer a no-op)', !!onAttemptAction && /'Review My Recommended Sections'[\s\S]{0,80}renderRecommendedReview/.test(onAttemptAction));
  check('CLIENT Recommended Review', 'onAttemptAction() also routes "Begin My Remediation Plan" to the same real view (same underlying feature, later ladder stage)', !!onAttemptAction && /'Begin My Remediation Plan'/.test(onAttemptAction) && /renderRecommendedReview/.test(onAttemptAction));
})();

// ---- INTEGRATION: full review + retake flow against the real (unmodified) renderer + local QA harness ----
async function withHarness(seedSuffix, fn) {
  const port = 42030 + ((process.pid + seedSuffix) % 900);
  const child = spawn(process.execPath, [path.join(ROOT, 'scripts/review-module12-bank.mjs'), '--browser', '--port', String(port), '--seed', String(seedSuffix)], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let ready = false;
  child.stdout.on('data', (d) => { if (d.toString().includes('running')) ready = true; });
  try {
    const deadline = Date.now() + 8000;
    while (!ready && Date.now() < deadline) await new Promise((r) => setTimeout(r, 150));
    if (!ready) { check('INTEGRATION', 'Server #' + seedSuffix + ' starts within 8s', false); return; }
    const base = `http://127.0.0.1:${port}`;
    async function post(p, body) { const r = await fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) }); return { status: r.status, body: await r.json() }; }
    async function get(p) { const r = await fetch(base + p); return { status: r.status, body: await r.json() }; }
    async function getHtml(p) { const r = await fetch(base + p); return r.text(); }
    await fn({ base, post, get, getHtml });
  } finally {
    child.kill();
  }
}

function badCaseResponses(caseDef) {
  const responses = {};
  for (const part of caseDef.parts) {
    if (part.type === 'structured-short-response') responses[part.id] = 'weak';
    else if (part.type === 'multi-select') responses[part.id] = [];
    else if (part.type === 'classification') { responses[part.id] = {}; for (const item of part.items) responses[part.id][item.id] = part.categories[0]; }
    else if (part.type === 'sequencing') responses[part.id] = part.choices.map((_, i) => i);
    else responses[part.id] = 99; // out-of-range -- always wrong
  }
  return responses;
}

async function failAnAttempt({ post, get }) {
  await post('/api/certification/submit-part1', { responses: {} }); // every Knowledge item unanswered -- all "missed"
  const part2 = await get('/api/certification/get-part?part=2');
  for (const c of part2.body.cases) {
    await post('/api/certification/submit-case', { caseId: c.id, responses: badCaseResponses(c) });
  }
  let guard = 0;
  while (guard++ < 15) {
    const part3 = await get('/api/certification/get-part?part=3');
    if (part3.body.allConversationsFinalized) break;
    const id = part3.body.conversation.id;
    let t = await post('/api/certification/submit-interview-turn', { attemptId: 'x', interviewId: id, studentResponse: 'weak response' });
    if (t.body.needsFollowUp) await post('/api/certification/submit-interview-turn', { attemptId: 'x', interviewId: id, studentResponse: 'weak follow-up' });
  }
  await post('/api/certification/finalize-assessment', {});
}

async function runIntegrationChecks() {
  await withHarness(11, async ({ base, post, get, getHtml }) => {
    await fetch(base + '/?mockOutcome=not_yet_passed');
    await failAnAttempt({ post, get });

    const status1 = await get('/api/certification/get-status');
    check('INTEGRATION Recommended Review', 'A failed attempt produces real remediation rows (not an empty placeholder)', Array.isArray(status1.body.remediation) && status1.body.remediation.length > 0, JSON.stringify(status1.body.remediation && status1.body.remediation.length));

    const forbiddenKeys = ['id', 'prompt', 'choices', 'correctChoice', 'rationale', 'correctAnswer', 'rubricCriteria', 'scenario', 'primaryPrompt'];
    const leaked = (status1.body.remediation || []).some((r) => forbiddenKeys.some((k) => k in r));
    check('INTEGRATION Recommended Review', 'Remediation rows never leak an item id, prompt, scenario, choices, or answer key', !leaked);

    const modulesReferenced = (status1.body.remediation || []).filter((r) => r.module_ref != null).map((r) => Number(r.module_ref));
    check('INTEGRATION Recommended Review', 'Every module_ref present is a real course module number (1-11)', modulesReferenced.every((n) => Number.isInteger(n) && n >= 1 && n <= 11), JSON.stringify(modulesReferenced));

    const eachRowHasLabelAndReason = (status1.body.remediation || []).every((r) => !!(r.competency_area || r.critical_domain));
    check('INTEGRATION Recommended Review', 'Every remediation row identifies a competency area or a critical domain (something to label/explain in the panel)', eachRowHasLabelAndReason);

    // Opening/viewing the review must not itself mutate attempt state --
    // re-fetching status (what "Back to Performance Review" does) must be
    // byte-for-byte stable.
    const status1Again = await get('/api/certification/get-status');
    check('INTEGRATION Recommended Review', 'Re-fetching status (simulating open review -> back) does not change attemptNumber, decision, or ladder', status1Again.body.performanceReview.attemptNumber === status1.body.performanceReview.attemptNumber && status1Again.body.performanceReview.decision === status1.body.performanceReview.decision && JSON.stringify(status1Again.body.ladder) === JSON.stringify(status1.body.ladder));

    const html = await getHtml('/');
    check('INTEGRATION Recommended Review', 'QA-only "mark remediation complete" control is clearly labeled QA ONLY', /QA ONLY/.test(html) && /completeRemediation/.test(html));

    // ---- Start Attempt 2: must be a genuinely fresh, complete attempt ----
    const beforeStart = status1.body.ladder;
    check('INTEGRATION Attempt 2', 'Ladder allows Attempt 2 immediately after Attempt 1 fails (competency remediation does not block the very next attempt)', beforeStart.canStartNewAttempt === true && beforeStart.nextAttemptNumber === 2, JSON.stringify(beforeStart));

    const startRes = await post('/api/certification/start-attempt', {});
    check('INTEGRATION Attempt 2', 'start-attempt succeeds', startRes.status === 200);
    check('INTEGRATION Attempt 2', 'Attempt 2 Part I has exactly 40 items', startRes.body.attempt.partI.items.length === 40, String(startRes.body.attempt.partI.items.length));
    check('INTEGRATION Attempt 2', 'Attempt 2 Part I has ZERO carried-over responses', Object.keys(startRes.body.attempt.partI.responses || {}).length === 0);

    const statusAfterStart = await get('/api/certification/get-status');
    check('INTEGRATION Attempt 2', 'get-status reports a new in-progress attempt (state B, attemptNumber 2) -- not still showing the finalized Attempt 1 result', statusAfterStart.body.state === 'B' && statusAfterStart.body.inProgressAttempt && statusAfterStart.body.inProgressAttempt.attemptNumber === 2, JSON.stringify(statusAfterStart.body));

    const part2b = await get('/api/certification/get-part?part=2');
    check('INTEGRATION Attempt 2', 'Attempt 2 Part II is the real 4-case draw, not the initial "browse all 12" set', part2b.body.cases.length === 4, String(part2b.body.cases.length));
    check('INTEGRATION Attempt 2', 'None of Attempt 2\'s cases are pre-marked submitted', part2b.body.cases.every((c) => c.submitted === false));

    const part3b = await get('/api/certification/get-part?part=3');
    check('INTEGRATION Attempt 2', 'Attempt 2 Part III conversation is a real one (isFirstConversation true, non-empty transcript-less start)', part3b.body.conversation && part3b.body.conversation.isFirstConversation === true);

    // Confirm the real Part III fix from f052c18 still holds on a retake attempt too.
    check('REGRESSION Part III', 'Attempt 2\'s first Part III conversation returns a real primary prompt (not the generic welcome placeholder)', /Ready\?/.test(part3b.body.conversation.primaryPrompt) === false && part3b.body.conversation.primaryPrompt.length > 20);

    // ---- Fail Attempt 2 too, then verify the Attempt 3 remediation gate ----
    await failAnAttempt({ post, get });
    const status2 = await get('/api/certification/get-status');
    check('INTEGRATION Attempt 3 gate', 'Attempt 2\'s own failure is recorded with attemptNumber 2 (not silently reusing Attempt 1\'s record)', status2.body.performanceReview.attemptNumber === 2);
    check('INTEGRATION Attempt 3 gate', 'Attempt 3 is blocked by the real remediation-required gate', status2.body.ladder.canStartNewAttempt === false && status2.body.ladder.blockedReason === 'remediation_required', JSON.stringify(status2.body.ladder));

    const blockedStart = await post('/api/certification/start-attempt', {});
    check('INTEGRATION Attempt 3 gate', 'start-attempt itself refuses Attempt 3 (409), not just the UI copy', blockedStart.status === 409 && blockedStart.body.blockedReason === 'remediation_required');

    await fetch(base + '/?completeRemediation=1');
    const status3 = await get('/api/certification/get-status');
    check('INTEGRATION Attempt 3 gate', 'Marking remediation complete (QA-only control) unblocks Attempt 3', status3.body.ladder.canStartNewAttempt === true && status3.body.ladder.nextAttemptNumber === 3, JSON.stringify(status3.body.ladder));

    const startAttempt3 = await post('/api/certification/start-attempt', {});
    check('INTEGRATION Attempt 3', 'Attempt 3 starts successfully once unlocked', startAttempt3.status === 200);
    check('INTEGRATION Attempt 3', 'Attempt 3 is a full 40 Knowledge items -- not a smaller "just the missed items" retest', startAttempt3.body.attempt.partI.items.length === 40, String(startAttempt3.body.attempt.partI.items.length));
    const part2c = await get('/api/certification/get-part?part=2');
    const part3c = await get('/api/certification/get-part?part=3');
    check('INTEGRATION Attempt 3', 'Attempt 3 is a full 4 Applied Cases -- not a smaller "just the missed items" retest', part2c.body.cases.length === 4);
    check('INTEGRATION Attempt 3', 'Attempt 3 is a full 3 Practitioner Conversations -- not a smaller "just the missed items" retest', part3c.body.conversation && part3c.body.conversation.isFirstConversation === true);
  });
}

await runIntegrationChecks();

// ---- Report ----
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
