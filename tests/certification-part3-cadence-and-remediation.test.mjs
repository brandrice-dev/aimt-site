// Regression tests for the Module 12 pre-migration completion pass:
//
//  1. Part III Cadence conversation UX -- a single coherent Cadence turn per
//     exchange (welcome+primary combined, bridge+prompt combined, bridge+
//     follow-up combined), a varied presentation-only bridge library, a
//     placeholder Cadence identity badge (no new/invented avatar), a lighter
//     conversation canvas, and a messaging-style composer that disables
//     during evaluation and disappears after the final close.
//  2. Local QA scoring integrity -- Part I now scores against real stored
//     responses in the harness's default ("auto") path (an unanswered item
//     is 0 points, denominator stays the full selected count), while the
//     explicit mockOutcome=pass/not_yet_passed overrides remain a reliable,
//     clearly-separate QA shortcut.
//  3. Part I unanswered-submission confirmation (Return to Review / Submit
//     Anyway), never a silent submit.
//  4. Instant, localhost-only QA state selector (?qaState=...) for all 10
//     result/flow states, absent from the production client bundle.
//  5. The Required Remediation student experience: a real, backend-
//     authoritative completion action (never "opened a module" alone), a
//     visually distinct plan from Recommended Review, and a genuine Attempt
//     3 unlock once every required item is complete.
//
// Run: node tests/certification-part3-cadence-and-remediation.test.mjs

import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const clientSrc = readFileSync(path.join(ROOT, 'assets/js/module12-certification.js'), 'utf8');
const harnessSrc = readFileSync(path.join(ROOT, 'scripts/review-module12-bank.mjs'), 'utf8');
// Strips comments before scanning for forbidden markup/references -- this
// file's own design-note comments legitimately discuss (in prose) an <img>
// swap point and other things that must NOT appear in executable code, so a
// raw substring search over the full source would false-positive on its own
// documentation.
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}
const clientCode = stripComments(clientSrc);

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

// ============================================================
// CADENCE PRESENTATION -- static checks
// ============================================================
(function cadencePresentationStatic() {
  check('CADENCE PRESENTATION', 'No new avatar image referenced anywhere in the client bundle (no <img>, no new .png/.jpg/.svg path)', !/<img\b|\.(png|jpe?g|svg|webp)['"]/i.test(clientCode));
  check('CADENCE PRESENTATION', 'Identity badge reuses the site\'s existing guide-panel tokens (--hero-bg / --teal), not invented colors', /m12x-cadence-id[\s\S]{0,400}var\(--hero-bg/.test(clientSrc) && /m12x-cadence-dot[\s\S]{0,200}var\(--teal/.test(clientSrc));
  check('CADENCE PRESENTATION', 'Identity badge is documented as a PLACEHOLDER pending the real asset (not silently presented as final)', /PLACEHOLDER pending the real Cadence avatar/.test(clientSrc));
  check('CADENCE PRESENTATION', 'cadenceIdentityHtml() renders once per screen (called from renderPartIII\'s draw, not per-message in the transcript loop)', (function () {
    const renderPartIII = fnBody(clientSrc, 'renderPartIII');
    const draw = renderPartIII ? fnBody(renderPartIII, 'draw') : null;
    if (!draw) return false;
    const beforeChatLoop = draw.split('m12x-chat')[0];
    return /cadenceIdentityHtml\(\)/.test(beforeChatLoop) && !/transcript\.forEach[\s\S]*cadenceIdentityHtml/.test(draw);
  })());

  const renderPartIII = fnBody(clientSrc, 'renderPartIII');
  check('CADENCE PRESENTATION', 'renderPartIII() skips the startLine bridge when the locked prompt already opens with "Let\'s..."', !!renderPartIII && /opensWithLetsStart\(conversation\.primaryPrompt\)/.test(renderPartIII));
  check('CADENCE PRESENTATION', 'The first-conversation welcome and primary prompt are pushed as ONE transcript entry (single content string), not separate entries', !!renderPartIII && /content:\s*opening\s*\+\s*'\\n\\n'\s*\+\s*intro\s*\+\s*conversation\.primaryPrompt/.test(renderPartIII));
  check('CADENCE PRESENTATION', 'A non-first conversation combines its bridge + primary prompt as ONE transcript entry', !!renderPartIII && /content:\s*bridge\s*\+\s*'\\n\\n'\s*\+\s*conversation\.primaryPrompt/.test(renderPartIII));

  check('CADENCE PRESENTATION', 'COPY.partIII.nextBridges has multiple distinct variants (no mechanical single canned line)', (function () {
    const m = clientSrc.match(/nextBridges:\s*\[([\s\S]*?)\]/);
    if (!m) return false;
    const count = (m[1].match(/'/g) || []).length / 2;
    return count >= 5;
  })());
  check('CADENCE PRESENTATION', 'COPY.partIII.followUpBridges has multiple distinct variants', (function () {
    const m = clientSrc.match(/followUpBridges:\s*\[([\s\S]*?)\]/);
    if (!m) return false;
    const count = (m[1].match(/'/g) || []).length / 2;
    return count >= 5;
  })());
  check('CADENCE PRESENTATION', 'No bridge string uses forbidden score/praise language ("Perfect!", "nailed it", "Exactly right")', !/Perfect!|nailed it|Exactly right!|Amazing!/i.test(clientSrc.match(/followUpBridges:[\s\S]*?nextBridges:[\s\S]*?\]/)[0]));

  const pickBridge = fnBody(clientSrc, 'pickBridge');
  check('CADENCE PRESENTATION', 'pickBridge() re-rolls on an immediate repeat (do/while against lastBridgeUsed[poolKey])', !!pickBridge && /lastBridgeUsed\[poolKey\]/.test(pickBridge) && /do\s*\{/.test(pickBridge));

  const onSendInterviewTurn = fnBody(clientSrc, 'onSendInterviewTurn');
  check('CADENCE PRESENTATION', 'The follow-up bridge is combined with the exact, unmodified followUpPrompt in one message', !!onSendInterviewTurn && /followUpBridge\s*\+\s*'\\n\\n'\s*\+\s*res\.body\.followUpPrompt/.test(onSendInterviewTurn));
  check('CADENCE PRESENTATION', 'submit-interview-turn is posted with only {attemptId, interviewId, studentResponse} -- no bridge text ever included in what is graded', !!onSendInterviewTurn && /apiPost\('\/submit-interview-turn',\s*\{\s*attemptId:\s*attemptId,\s*interviewId:\s*conversation\.id,\s*studentResponse:\s*text\s*\}\)/.test(onSendInterviewTurn));
  check('CADENCE PRESENTATION', 'The final close (allConversationsFinalized) never calls a bridge picker -- no line implies another question is coming', !!onSendInterviewTurn && !/allConversationsFinalized[\s\S]{0,400}pickBridge/.test(onSendInterviewTurn));
  check('CADENCE PRESENTATION', 'The final close hides the composer entirely before Processing', !!onSendInterviewTurn && /allConversationsFinalized[\s\S]{0,400}hideComposer:\s*true/.test(onSendInterviewTurn));
  check('CADENCE PRESENTATION', 'The composer is disabled (not just visually) while awaiting evaluation (showTyping)', /options\.showTyping[\s\S]{0,200}disabled/.test(fnBody(clientSrc, 'renderPartIII')));

  check('CADENCE PRESENTATION', 'Composer placeholder reads "Type your response…" (messaging style, not an exam label)', /placeholder="Type your response…"/.test(clientSrc));
  check('CADENCE PRESENTATION', 'The "Your response" label is present but visually hidden (accessible, not a heavy form label)', /m12x-sr-only">Your response</.test(clientSrc));
})();

// ============================================================
// PART I QA -- static checks (unanswered-submission confirmation)
// ============================================================
(function partIUnansweredStatic() {
  check('PART I QA static', 'openUnansweredConfirm() exists', /function openUnansweredConfirm/.test(clientSrc));
  check('PART I QA static', 'Exact required warning copy: "You still have N unanswered question(s)."', /'You still have '\s*\+\s*count\s*\+\s*' unanswered '/.test(clientSrc));
  check('PART I QA static', 'Correct singular/plural handling for exactly 1 unanswered question', /count === 1 \? 'question' : 'questions'/.test(clientSrc));
  check('PART I QA static', 'Exact required no-credit copy present', /Unanswered questions will receive no credit once this section is submitted\./.test(clientSrc));
  check('PART I QA static', '"Return to Review" and "Submit Anyway" actions present', /returnToReview:\s*'Return to Review'/.test(clientSrc) && /submitAnyway:\s*'Submit Anyway'/.test(clientSrc));
  check('PART I QA static', 'Submit button only opens the confirm dialog when unansweredCount > 0 -- answering everything submits directly with no interruption', /if \(unansweredCount > 0\) \{\s*openUnansweredConfirm/.test(clientSrc));
  check('PART I QA static', 'Never auto-fills an answer (no code path assigns a response value from openUnansweredConfirm)', !/openUnansweredConfirm[\s\S]{0,50}responses\[/.test(clientSrc));
})();

// ============================================================
// QA STATE CONTROLS -- static checks (harness-only, never production)
// ============================================================
(function qaStateControlsStatic() {
  check('QA STATE CONTROLS static', 'Harness reads ?qaState= and seeds the existing Review Mode fixture key (reuses fixtureStatusFor(), not a second mocking system)', /qaState/.test(harnessSrc) && /aimt_m12_review_fixture/.test(harnessSrc));
  check('QA STATE CONTROLS static', 'Instant state view is sessionStorage-scoped (persists across the fixture bar\'s own in-page switches, not just one URL hit)', /aimt_m12_qa_review_active/.test(harnessSrc));
  check('QA STATE CONTROLS static', 'An explicit exit control clears the instant-state flag', /m12qaExitInstant/.test(harnessSrc) && /removeItem\('aimt_m12_qa_review_active'\)/.test(harnessSrc));
  check('QA STATE CONTROLS static', 'qaState / instant-state mechanism does not exist anywhere in the production client bundle', !/qaState/.test(clientSrc) && !/aimt_m12_qa_review_active/.test(clientSrc));
  check('QA STATE CONTROLS static', 'mockOutcome / completeRemediation harness-only query params do not exist in the production client bundle', !/mockOutcome/.test(clientSrc) && !/completeRemediation/.test(clientSrc));
})();

// ============================================================
// PURE / STATIC -- production get-status.js + finalize-assessment.js
// ============================================================
(function productionRemediationStatic() {
  const getStatusSrc = readFileSync(path.join(ROOT, 'functions/api/certification/get-status.js'), 'utf8');
  check('PRODUCTION remediation', 'get-status.js selects the remediation row id (required for the client\'s completion action)', /select:\s*'id,competency_area/.test(getStatusSrc));
  check('PRODUCTION remediation', 'get-status.js no longer filters remediation to only the latest finalized attempt (the real ladder gate spans every attempt)', !/attempt_id:\s*`eq\.\$\{latestFinalized\.id\}`/.test(getStatusSrc));

  const completeSrc = readFileSync(path.join(ROOT, 'functions/api/certification/complete-remediation.js'), 'utf8');
  check('PRODUCTION remediation', 'complete-remediation.js requires authentication (resolveUser)', /resolveUser\(env, request\)/.test(completeSrc));
  check('PRODUCTION remediation', 'complete-remediation.js scopes the update to the authenticated user (ownership enforced explicitly, service-role bypasses RLS)', /user_id:\s*`eq\.\$\{user\.id\}`/.test(completeSrc));
  check('PRODUCTION remediation', 'complete-remediation.js is idempotent (already-completed short-circuits rather than re-writing)', /if \(item\.completed\)/.test(completeSrc));

  const ladderSrc = readFileSync(path.join(ROOT, 'functions/_lib/certification/attempt-ladder.mjs'), 'utf8');
  check('PRODUCTION remediation', 'Remediation rows now carry a real activity type (course_review), not the old CONTENT_PENDING placeholder', /REMEDIATION_ACTIVITY_COURSE_REVIEW/.test(ladderSrc) && !/CONTENT_PENDING/.test(ladderSrc));
})();

// ============================================================
// INTEGRATION -- full harness walks
// ============================================================
async function withHarness(seedSuffix, fn) {
  const port = 43130 + ((process.pid + seedSuffix) % 900);
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
    else responses[part.id] = 99;
  }
  return responses;
}
function correctCaseResponses(caseDef) {
  const responses = {};
  for (const part of caseDef.parts) {
    if (part.type === 'structured-short-response') responses[part.id] = 'A thorough, professional response.';
    else responses[part.id] = part.correctAnswer;
  }
  return responses;
}

async function walkPartIIAndIII({ post, get }, { correct }) {
  const part2 = await get('/api/certification/get-part?part=2');
  for (const c of part2.body.cases) {
    await post('/api/certification/submit-case', { caseId: c.id, responses: correct ? correctCaseResponses(c) : badCaseResponses(c) });
  }
  let guard = 0;
  while (guard++ < 20) {
    const p3 = await get('/api/certification/get-part?part=3');
    if (p3.body.allConversationsFinalized) break;
    const id = p3.body.conversation.id;
    let t = await post('/api/certification/submit-interview-turn', { attemptId: 'x', interviewId: id, studentResponse: 'A thoughtful response.' });
    if (t.body.needsFollowUp) await post('/api/certification/submit-interview-turn', { attemptId: 'x', interviewId: id, studentResponse: 'A clarifying follow-up.' });
  }
}

async function runIntegrationChecks() {
  const { getProductionBanks } = await import(path.join(ROOT, 'functions/_lib/certification/content-bank.mjs'));
  const banks = getProductionBanks();
  const knowledgeById = {};
  for (const k of banks.knowledgeBank) knowledgeById[k.id] = k;

  // ---- Cadence presentation: exact prompt/follow-up text never altered by bridging ----
  await withHarness(1, async ({ post, get }) => {
    await post('/api/certification/submit-part1', { responses: {} });
    const part2 = await get('/api/certification/get-part?part=2');
    for (const c of part2.body.cases) await post('/api/certification/submit-case', { caseId: c.id, responses: correctCaseResponses(c) });

    const first = await get('/api/certification/get-part?part=3');
    const firstId = first.body.conversation.id;
    const realDef = banks.interviewBank.find((i) => i.id === firstId);
    check('INTEGRATION Cadence exact text', 'get-part(3) primaryPrompt is byte-identical to the locked bank text', first.body.conversation.primaryPrompt === realDef.primaryPrompt);

    const turn1 = await post('/api/certification/submit-interview-turn', { attemptId: 'x', interviewId: firstId, studentResponse: 'A thoughtful response.' });
    if (turn1.body.needsFollowUp) {
      check('INTEGRATION Cadence exact text', 'submit-interview-turn followUpPrompt is byte-identical to the locked bank text', turn1.body.followUpPrompt === realDef.followUpPrompt);
    }

    // Mid-conversation resume: get-part must still return the accumulating
    // real transcript (student turns persist), never reset to empty.
    const resumed = await get('/api/certification/get-part?part=3');
    check('INTEGRATION Cadence exact text', 'Resuming mid-conversation still returns the accumulated real transcript (student turn persists server-side)', Array.isArray(resumed.body.conversation.transcript) && resumed.body.conversation.transcript.some((t) => t.role === 'user' && t.content === 'A thoughtful response.'));
  });

  // ---- Part I QA scoring integrity ----
  await withHarness(2, async ({ base, post, get }) => {
    async function freshAttemptWithKnowledge(seed, mutate) {
      await fetch(base + '/?seed=' + seed);
      const start = await post('/api/certification/start-attempt', {});
      const items = start.body.attempt.partI.items;
      const responses = {};
      items.forEach((item) => { responses[item.id] = knowledgeById[item.id].correctChoice; });
      if (mutate) mutate(responses, items);
      await post('/api/certification/submit-part1', { responses });
      await walkPartIIAndIII({ post, get }, { correct: true });
      await post('/api/certification/finalize-assessment', {});
      return get('/api/certification/get-status');
    }

    const allCorrect = await freshAttemptWithKnowledge(201, null);
    check('PART I QA integration', '40/40 correct (auto) scores exactly 100% knowledge', allCorrect.body.performanceReview.componentScores.knowledge === 1, String(allCorrect.body.performanceReview.componentScores.knowledge));

    const oneWrong = await freshAttemptWithKnowledge(202, (responses, items) => {
      const item = items[0];
      const full = knowledgeById[item.id];
      responses[item.id] = (full.correctChoice + 1) % item.choices.length;
    });
    check('PART I QA integration', '39/40 correct (auto) scores exactly 97.5% knowledge', oneWrong.body.performanceReview.componentScores.knowledge === 0.975, String(oneWrong.body.performanceReview.componentScores.knowledge));

    const eightWrong = await freshAttemptWithKnowledge(203, (responses, items) => {
      for (let i = 0; i < 8; i++) {
        const item = items[i];
        const full = knowledgeById[item.id];
        responses[item.id] = (full.correctChoice + 1) % item.choices.length;
      }
    });
    check('PART I QA integration', '32/40 correct (auto) scores exactly 80% knowledge', eightWrong.body.performanceReview.componentScores.knowledge === 0.8, String(eightWrong.body.performanceReview.componentScores.knowledge));

    const allUnanswered = await freshAttemptWithKnowledge(204, (responses) => { for (const k of Object.keys(responses)) delete responses[k]; });
    check('PART I QA integration', 'All unanswered (auto) scores exactly 0% knowledge -- the original defect', allUnanswered.body.performanceReview.componentScores.knowledge === 0, String(allUnanswered.body.performanceReview.componentScores.knowledge));

    // mockOutcome overrides remain reliable regardless of real Part I content.
    await fetch(base + '/?seed=205&mockOutcome=pass');
    await post('/api/certification/submit-part1', { responses: {} });
    await walkPartIIAndIII({ post, get }, { correct: true });
    await post('/api/certification/finalize-assessment', {});
    const forcedPass = await get('/api/certification/get-status');
    check('PART I QA integration', 'mockOutcome=pass still guarantees decision=pass even with an empty Part I', forcedPass.body.performanceReview.decision === 'pass');

    await fetch(base + '/?seed=206&mockOutcome=not_yet_passed');
    const start3 = await post('/api/certification/start-attempt', {});
    const items3 = start3.body.attempt.partI.items;
    const responses3 = {};
    items3.forEach((item) => { responses3[item.id] = knowledgeById[item.id].correctChoice; });
    await post('/api/certification/submit-part1', { responses: responses3 });
    await walkPartIIAndIII({ post, get }, { correct: true });
    await post('/api/certification/finalize-assessment', {});
    const forcedFail = await get('/api/certification/get-status');
    check('PART I QA integration', 'mockOutcome=not_yet_passed still guarantees decision=not_yet_passed even with a perfect Part I', forcedFail.body.performanceReview.decision === 'not_yet_passed');
  });

  // ---- QA state controls: all 10 links present, harness page ----
  await withHarness(3, async ({ getHtml }) => {
    const html = await getHtml('/');
    const states = ['examReady', 'part1', 'part2', 'part3', 'processing', 'pass', 'attempt1', 'attempt2', 'attempt3', 'attempt4'];
    const allPresent = states.every((s) => html.includes('?qaState=' + s));
    check('QA STATE CONTROLS integration', 'All 10 instant-state links present on the harness page', allPresent, states.filter((s) => !html.includes('?qaState=' + s)).join(','));
    check('QA STATE CONTROLS integration', 'Instant state controls are clearly labeled QA ONLY', /QA ONLY[\s\S]{0,100}instant state view/.test(html));
    check('QA STATE CONTROLS integration', 'Harness never binds to a non-localhost interface (still 127.0.0.1 only)', /server\.listen\(port,\s*'127\.0\.0\.1'/.test(harnessSrc));
  });

  // ---- Remediation lifecycle end-to-end ----
  await withHarness(4, async ({ base, post, get }) => {
    async function failFullAttempt() {
      await post('/api/certification/submit-part1', { responses: {} });
      await walkPartIIAndIII({ post, get }, { correct: false });
      await post('/api/certification/finalize-assessment', {});
    }

    await fetch(base + '/?mockOutcome=not_yet_passed');
    await failFullAttempt(); // Attempt 1
    await post('/api/certification/start-attempt', {});
    await failFullAttempt(); // Attempt 2 -- now remediation-gated before Attempt 3

    const status = await get('/api/certification/get-status');
    check('INTEGRATION Remediation', 'Two failures produce a real, non-empty remediation plan', Array.isArray(status.body.remediation) && status.body.remediation.length > 0);
    check('INTEGRATION Remediation', 'Attempt 3 is blocked (remediation_required) before any items are completed', status.body.ladder.canStartNewAttempt === false && status.body.ladder.blockedReason === 'remediation_required');

    const forbiddenKeys = ['prompt', 'choices', 'correctChoice', 'rationale', 'correctAnswer', 'rubricCriteria', 'scenario', 'primaryPrompt'];
    const leaked = status.body.remediation.some((r) => forbiddenKeys.some((k) => k in r));
    check('INTEGRATION Remediation', 'No remediation row leaks an exam item\'s prompt/scenario/choices/answer key', !leaked);
    check('INTEGRATION Remediation', 'Every remediation row maps to a real competency area or a real critical domain (never invented)', status.body.remediation.every((r) => !!(r.competency_area || r.critical_domain)));

    const items = status.body.remediation;
    // Complete all but one -- Attempt 3 must remain locked.
    for (let i = 0; i < items.length - 1; i++) {
      await post('/api/certification/complete-remediation', { remediationId: items[i].id });
    }
    const statusPartial = await get('/api/certification/get-status');
    check('INTEGRATION Remediation', 'Attempt 3 remains locked while even one required item is incomplete', statusPartial.body.ladder.canStartNewAttempt === false);
    const blockedStart = await post('/api/certification/start-attempt', {});
    check('INTEGRATION Remediation', 'start-attempt itself refuses Attempt 3 while incomplete (409), not just the UI copy', blockedStart.status === 409);

    // "Opening a module" is purely client-side (window.openModuleById) --
    // confirm no server-side completion happened just from time passing /
    // any other call; completion requires the explicit endpoint.
    const stillIncomplete = await get('/api/certification/get-status');
    check('INTEGRATION Remediation', 'Remediation status only changes via the explicit complete-remediation call, never implicitly', stillIncomplete.body.remediation.filter((r) => r.completed).length === items.length - 1);

    // Complete the last one.
    const last = items[items.length - 1];
    const completeRes = await post('/api/certification/complete-remediation', { remediationId: last.id });
    check('INTEGRATION Remediation', 'Completing the final required item succeeds', completeRes.body.completed === true);
    const idempotent = await post('/api/certification/complete-remediation', { remediationId: last.id });
    check('INTEGRATION Remediation', 'Re-completing an already-completed item is idempotent (alreadyCompleted, not an error or a second write)', idempotent.body.alreadyCompleted === true);

    const statusUnlocked = await get('/api/certification/get-status');
    check('INTEGRATION Remediation', 'Attempt 3 unlocks once every required item is authoritatively complete', statusUnlocked.body.ladder.canStartNewAttempt === true && statusUnlocked.body.ladder.nextAttemptNumber === 3);

    const start3 = await post('/api/certification/start-attempt', {});
    check('INTEGRATION Remediation', 'Attempt 3 starts successfully', start3.status === 200);
    check('INTEGRATION Remediation', 'Attempt 3 Part I is the full 40 -- not a reduced "missed items only" retest', start3.body.attempt.partI.items.length === 40, String(start3.body.attempt.partI.items.length));
    check('INTEGRATION Remediation', 'Attempt 3 has zero carried-over Part I responses', Object.keys(start3.body.attempt.partI.responses || {}).length === 0);
    const part2c = await get('/api/certification/get-part?part=2');
    check('INTEGRATION Remediation', 'Attempt 3 Part II is the full real 4-case draw', part2c.body.cases.length === 4, String(part2c.body.cases.length));
    const part3c = await get('/api/certification/get-part?part=3');
    check('INTEGRATION Remediation', 'Attempt 3 Part III starts fresh (isFirstConversation)', part3c.body.conversation && part3c.body.conversation.isFirstConversation === true);
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
