// Regression tests for two Module 12 Part III defects found during owner QA:
//
//  1. THE REPEAT LOOP: after finishing a conversation, Part III appeared to
//     show "the same question" over and over instead of advancing through
//     Conversation 2 and 3 to Processing.
//  2. THE WELCOME/PRIMARY-PROMPT BUG: the generic Part III welcome ("You
//     made it to the final part... Ready?") was shown with an active
//     composer beneath it at the start of EVERY conversation (not just the
//     first), so the student's answer to "Ready?" was silently graded as
//     the response to that interview's real primary prompt -- which was
//     never actually displayed. In the observed case this jumped straight
//     to an interview's approved follow-up without ever showing its primary
//     prompt.
//
// Root cause (confirmed via scripts/review-module12-bank.mjs --browser):
// assets/js/module12-certification.js's renderPartIII() substituted the
// interview's real primaryPrompt with the generic welcome text whenever a
// conversation's transcript was empty -- true for every conversation, not
// only the first -- and always rendered an active composer alongside it.
//
// Fix: functions/_lib/certification/interview-progression.mjs adds a
// server-authoritative findNextInterview() helper (shared by the production
// endpoint and the local QA harness) that reports whether the next
// conversation is the attempt's FIRST one. The client only ever prepends
// the welcome + "Let's start with this one" before a conversation's real
// primaryPrompt when isFirstConversation is true; every conversation always
// renders its own real primaryPrompt as a message before the composer is
// reachable.
//
// Run: node tests/certification-part3-progression.test.mjs

import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { findNextInterview } from '../functions/_lib/certification/interview-progression.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const src = readFileSync(path.join(ROOT, 'assets/js/module12-certification.js'), 'utf8');
const getPartSrc = readFileSync(path.join(ROOT, 'functions/api/certification/get-part.js'), 'utf8');
const submitTurnSrc = readFileSync(path.join(ROOT, 'functions/api/certification/submit-interview-turn.js'), 'utf8');

function fnBody(name) {
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

// ---- PURE: findNextInterview() (functions/_lib/certification/interview-progression.mjs) ----
(function findNextInterviewUnitTests() {
  const first = findNextInterview(['A', 'B', 'C'], {});
  check('findNextInterview', 'Fresh attempt (no state): selects the first selected ID', first.nextInterviewId === 'A');
  check('findNextInterview', 'Fresh attempt: conversationIndex is 0', first.conversationIndex === 0);
  check('findNextInterview', 'Fresh attempt: isFirstConversation is true', first.isFirstConversation === true);
  check('findNextInterview', 'Fresh attempt: allFinalized is false', first.allFinalized === false);

  const second = findNextInterview(['A', 'B', 'C'], { A: { finalized: true } });
  check('findNextInterview', 'A finalized: selects B next', second.nextInterviewId === 'B');
  check('findNextInterview', 'A finalized: conversationIndex is 1', second.conversationIndex === 1);
  check('findNextInterview', 'A finalized: isFirstConversation is false (no repeated welcome for conversation 2)', second.isFirstConversation === false);

  const third = findNextInterview(['A', 'B', 'C'], { A: { finalized: true }, B: { finalized: true } });
  check('findNextInterview', 'A+B finalized: selects C next, isFirstConversation false', third.nextInterviewId === 'C' && third.isFirstConversation === false);

  const done = findNextInterview(['A', 'B', 'C'], { A: { finalized: true }, B: { finalized: true }, C: { finalized: true } });
  check('findNextInterview', 'All 3 finalized: allFinalized is true, nextInterviewId is null', done.allFinalized === true && done.nextInterviewId === null);

  // Mid-conversation resume (unfinalized state present, e.g. a follow-up already used) --
  // must not be treated as finalized, and must not restart from index 0.
  const midConvo = findNextInterview(['A', 'B', 'C'], { A: { finalized: true }, B: { finalized: false, followUpUsed: true } });
  check('findNextInterview', 'B mid-conversation (follow-up used, not finalized): still selects B, not A or C', midConvo.nextInterviewId === 'B' && midConvo.conversationIndex === 1);
})();

// ---- STATIC: production get-part.js uses the shared helper and reports isFirstConversation ----
(function getPartStatic() {
  check('PRODUCTION get-part.js', 'Imports the shared findNextInterview() helper (server-authoritative, not array-position guesswork)', /import\s*\{\s*findNextInterview\s*\}\s*from\s*['"]\.\.\/\.\.\/_lib\/certification\/interview-progression\.mjs['"]/.test(getPartSrc));
  check('PRODUCTION get-part.js', 'Part III response includes isFirstConversation for the client', /isFirstConversation/.test(getPartSrc));
  check('PRODUCTION get-part.js', 'Part III response still gates on allFinalized (not a truthy nextInterviewId check that could misread index 0)', /allFinalized/.test(getPartSrc));
})();

// ---- STATIC: production submit-interview-turn.js already locks finalized conversations ----
(function submitTurnStatic() {
  check('PRODUCTION submit-interview-turn.js', 'A finalized conversation short-circuits before re-evaluating (state.finalized check present)', /if\s*\(state\.finalized\)/.test(submitTurnSrc));
})();

// ---- STATIC: the welcome text is gated behind isFirstConversation, not "transcript is empty" ----
(function clientWelcomeGating() {
  const renderPartIII = fnBody('renderPartIII');
  check('CLIENT renderPartIII', 'renderPartIII() is present and inspectable', !!renderPartIII);
  if (!renderPartIII) return;

  check('CLIENT renderPartIII', 'The welcome/opening copy is only used when conversation.isFirstConversation is true (not merely when transcript is empty)', /conversation\.isFirstConversation/.test(renderPartIII));
  check('CLIENT renderPartIII', 'Every fresh conversation (empty transcript) always renders conversation.primaryPrompt as a message', (renderPartIII.match(/conversation\.primaryPrompt/g) || []).length >= 1);

  // The specific defect: an empty-transcript branch that shows ONLY the
  // welcome, with no primaryPrompt anywhere in that branch, would let a
  // composer go live under generic text with no real prompt visible. Every
  // branch that builds a fresh transcript must include primaryPrompt.
  const emptyTranscriptBranch = renderPartIII.replace(/[\s\S]*?transcript\s*=\s*conversation\.transcript\.slice\(\);\s*\}/, '');
  check('CLIENT renderPartIII', 'The non-resume branches (transcript empty) reference primaryPrompt, so a composer can never go live under welcome-only text', /primaryPrompt/.test(emptyTranscriptBranch));
})();

// ---- STATIC: exact approved Part III welcome copy (item B of the defect report) ----
(function approvedWelcomeCopy() {
  const withName = 'This part is a little different. I’m going to give you a few situations you might run into in practice, and I want to hear how you’d think through them. There isn’t one perfect script — just talk to me the way you normally would.';
  check('CLIENT COPY', 'openingWithName/openingNoName contain the exact approved replacement copy', src.includes(withName));
  check('CLIENT COPY', 'startLine is the exact approved "Let\'s start with this one." line', src.includes('Let’s start with this one.'));
  check('CLIENT COPY', 'The old "Ready?" question is removed from the Part III opening', !/We’re done with multiple choice[\s\S]{0,80}Ready\?/.test(src));
})();

// ---- STATIC: Review Mode fixture also exercises the first-conversation path ----
(function reviewFixture() {
  const fixtureFn = fnBody('fixtureConversation');
  check('CLIENT Review Mode fixture', 'fixtureConversation() declares isFirstConversation: true (a generic welcome message must have no interview ID attached, and Review Mode\'s single fixture conversation is always "first")', !!fixtureFn && /isFirstConversation:\s*true/.test(fixtureFn));
})();

// ---- STATIC: the client can never fabricate its own real certification result ----
(function clientCannotForceResult() {
  const renderFromStatus = fnBody('renderFromStatus');
  check('CLIENT cannot self-certify', 'renderFromStatus() branches only on server-provided status.state, never assigns its own decision/state value', !!renderFromStatus && !/status\.state\s*=(?!=)/.test(renderFromStatus) && !/\bdecision\s*=(?!=)/.test(renderFromStatus));
  const onSendInterviewTurn = fnBody('onSendInterviewTurn');
  check('CLIENT cannot self-certify', 'onSendInterviewTurn() only reads allConversationsFinalized/transitionLine from the server response, never computes a pass/fail decision', !!onSendInterviewTurn && !/\bdecision\b/.test(onSendInterviewTurn));
})();

// ---- INTEGRATION: full Part III walk against the real (unmodified) renderer + local QA harness ----
async function withHarness(seedSuffix, fn) {
  const port = 41930 + ((process.pid + seedSuffix) % 1000);
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
    async function post(p, body) { const r = await fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) }); return r.json(); }
    async function get(p) { const r = await fetch(base + p); return r.json(); }
    await fn({ base, post, get });
  } finally {
    child.kill();
  }
}

async function runIntegrationChecks() {
  await withHarness(1, async ({ post, get }) => {
    await post('/api/certification/submit-part1', { responses: {} });
    const part2 = await get('/api/certification/get-part?part=2');
    for (const c of part2.cases) {
      const responses = {};
      for (const part of c.parts) {
        if (part.type === 'structured-short-response') responses[part.id] = 'A professional response.';
        else if (part.type === 'multi-select') responses[part.id] = [0];
        else if (part.type === 'classification') { responses[part.id] = {}; for (const item of part.items) responses[part.id][item.id] = part.categories[0]; }
        else if (part.type === 'sequencing') responses[part.id] = part.choices.map((_, i) => i);
        else responses[part.id] = 0;
      }
      await post('/api/certification/submit-case', { caseId: c.id, responses });
    }

    // -- Conversation 1: get-part reports isFirstConversation, and a real primary prompt --
    const first = await get('/api/certification/get-part?part=3');
    check('INTEGRATION Part III', 'get-part(3) on a fresh attempt reports isFirstConversation: true', first.conversation && first.conversation.isFirstConversation === true);
    check('INTEGRATION Part III', 'get-part(3) returns a real, non-generic primary prompt (not the welcome text)', first.conversation && !/final part|Ready\?/.test(first.conversation.primaryPrompt) && first.conversation.primaryPrompt.length > 20);
    const firstId = first.conversation.id;

    // -- Refresh/resume before any response: must return the SAME interview, not advance --
    const firstAgain = await get('/api/certification/get-part?part=3');
    check('INTEGRATION Part III', 'Refresh/resume before responding returns the same (still-current) interview, not a new one', firstAgain.conversation && firstAgain.conversation.id === firstId);

    // -- Conversation 1 (index 0): primary response triggers the one allowed follow-up --
    const turn1 = await post('/api/certification/submit-interview-turn', { attemptId: 'x', interviewId: firstId, studentResponse: 'A thoughtful primary response.' });
    check('INTEGRATION Part III', 'Conversation 1 primary response can trigger exactly one follow-up', turn1.needsFollowUp === true && typeof turn1.followUpPrompt === 'string' && turn1.followUpPrompt.length > 5);

    // -- A follow-up must never be requested a second time for the same conversation --
    const turn1b = await post('/api/certification/submit-interview-turn', { attemptId: 'x', interviewId: firstId, studentResponse: 'A follow-up response.' });
    check('INTEGRATION Part III', 'Follow-up response finalizes conversation 1 (does not ask a second follow-up)', turn1b.finalized === true && turn1b.needsFollowUp === false);
    check('INTEGRATION Part III', 'Only 1 of the 9 harness conversations is finalized so far (allConversationsFinalized is false)', turn1b.allConversationsFinalized === false);

    // -- Finalized conversation 1 is locked: resubmitting must not restart or re-score it --
    const restartAttempt = await post('/api/certification/submit-interview-turn', { attemptId: 'x', interviewId: firstId, studentResponse: 'Trying to restart a finalized conversation.' });
    check('INTEGRATION Part III', 'A finalized conversation cannot be restarted by resubmitting (alreadyFinalized, no new follow-up)', restartAttempt.alreadyFinalized === true && !restartAttempt.needsFollowUp);

    // -- Conversation 2: advances to a DIFFERENT interview, not the same primary prompt repeating --
    const second = await get('/api/certification/get-part?part=3');
    check('INTEGRATION Part III', 'Finalizing conversation 1 advances to a different interview ID (no repeat)', second.conversation && second.conversation.id !== firstId);
    check('INTEGRATION Part III', 'Conversation 2 is not treated as the first conversation (no repeated welcome)', second.conversation && second.conversation.isFirstConversation === false);

    // -- Conversation 2 (index 1): the no-follow-up path finalizes immediately --
    const turn2 = await post('/api/certification/submit-interview-turn', { attemptId: 'x', interviewId: second.conversation.id, studentResponse: 'A thoughtful primary response.' });
    check('INTEGRATION Part III', 'Conversation 2 primary response can finalize immediately with no follow-up', turn2.needsFollowUp === false && turn2.finalized === true);

    // -- Walk every remaining conversation to completion; every ID must be unique --
    const seenIds = new Set([firstId, second.conversation.id]);
    let guard = 0;
    let reachedAllFinalized = false;
    while (guard++ < 20) {
      const next = await get('/api/certification/get-part?part=3');
      if (next.allConversationsFinalized) { reachedAllFinalized = true; break; }
      const id = next.conversation.id;
      check('INTEGRATION Part III', 'No conversation ID repeats during the walk (' + id + ')', !seenIds.has(id));
      seenIds.add(id);
      let t = await post('/api/certification/submit-interview-turn', { attemptId: 'x', interviewId: id, studentResponse: 'A thoughtful primary response.' });
      if (t.needsFollowUp) {
        t = await post('/api/certification/submit-interview-turn', { attemptId: 'x', interviewId: id, studentResponse: 'A clarifying follow-up response.' });
      }
      check('INTEGRATION Part III', 'Conversation ' + id + ' finalizes cleanly (no >1 follow-up, no restart)', t.finalized === true);
    }
    check('INTEGRATION Part III', 'Conversation 3 -> ... -> all 9 harness conversations eventually reach allConversationsFinalized (walk terminates)', reachedAllFinalized);
    check('INTEGRATION Part III', 'All 9 approved harness interviews were each completed exactly once', seenIds.size === 9);

    // -- Processing -> result --
    await post('/api/certification/finalize-assessment', {});
    const status = await get('/api/certification/get-status');
    check('INTEGRATION Processing', 'All conversations finalized -> finalize-assessment -> a real decision is produced (state C or D)', status.state === 'C' || status.state === 'D');
  });

  // -- Mock PASS / NOT YET PASSED QA controls (owner needs both without a double 40/4/3 run) --
  // Uses the REAL answer key (content-bank.mjs, server-side-only, never
  // shipped to the browser) for Part II so a mis-guessed case choice can't
  // accidentally trip a critical-domain gate and confound the outcome --
  // the thing under test here is the mockOutcome override, not case luck.
  const { getProductionBanks } = await import(path.join(ROOT, 'functions/_lib/certification/content-bank.mjs'));
  const answerKeyBanks = getProductionBanks();
  await withHarness(2, async ({ base, post, get }) => {
    async function completeAttempt() {
      await post('/api/certification/submit-part1', { responses: {} });
      const part2 = await get('/api/certification/get-part?part=2');
      for (const c of part2.cases) {
        const def = answerKeyBanks.caseBank.find((x) => x.id === c.id);
        const responses = {};
        for (const part of def.parts) {
          if (part.type === 'structured-short-response') responses[part.id] = 'A thorough, professional response addressing the situation.';
          else responses[part.id] = part.correctAnswer;
        }
        await post('/api/certification/submit-case', { caseId: c.id, responses });
      }
      let guard = 0;
      while (guard++ < 20) {
        const next = await get('/api/certification/get-part?part=3');
        if (next.allConversationsFinalized) break;
        const id = next.conversation.id;
        let t = await post('/api/certification/submit-interview-turn', { attemptId: 'x', interviewId: id, studentResponse: 'A thoughtful primary response.' });
        if (t.needsFollowUp) await post('/api/certification/submit-interview-turn', { attemptId: 'x', interviewId: id, studentResponse: 'A clarifying follow-up response.' });
      }
      await post('/api/certification/finalize-assessment', {});
      return get('/api/certification/get-status');
    }

    await fetch(base + '/?mockOutcome=pass');
    const passStatus = await completeAttempt();
    check('INTEGRATION Mock outcome', 'QA control mockOutcome=pass reaches performanceReview.decision === "pass"', passStatus.performanceReview && passStatus.performanceReview.decision === 'pass');

    await fetch(base + '/?seed=222&mockOutcome=not_yet_passed');
    const notYetStatus = await completeAttempt();
    check('INTEGRATION Mock outcome', 'QA control mockOutcome=not_yet_passed reaches performanceReview.decision === "not_yet_passed"', notYetStatus.performanceReview && notYetStatus.performanceReview.decision === 'not_yet_passed');

    const homeHtml = await (await fetch(base + '/')).text();
    check('INTEGRATION Mock outcome', 'The mock-outcome control is clearly labeled QA ONLY on the harness page', /QA ONLY/.test(homeHtml));
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
