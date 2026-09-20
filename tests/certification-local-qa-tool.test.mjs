// Deterministic + light integration tests for the local-only real-content
// visual QA tool (scripts/review-module12-bank.mjs --browser) and for the
// production client bundle's content-security boundary.
// Run: node tests/certification-local-qa-tool.test.mjs
//
// Covers task requirements: the local QA tool performs zero network/
// production writes where testable, and the production/public bundle
// (assets/js/module12-certification.js, the file actually shipped to
// browsers) never embeds the full bank or any answer key.

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

const qaToolSource = readFileSync(path.join(ROOT, 'scripts/review-module12-bank.mjs'), 'utf8');
const rendererSource = readFileSync(path.join(ROOT, 'assets/js/module12-certification.js'), 'utf8');
const knowledgeMd = readFileSync(path.join(ROOT, 'docs/course-audit/modules/module-12-final-knowledge-bank.md'), 'utf8');

// Strip comments before scanning for forbidden references -- this file's own
// design-note comments legitimately discuss (in prose) the things it must
// NOT do in actual code (e.g. "no ANTHROPIC_API_KEY requirement"), so a raw
// substring search over the full source would false-positive on its own
// documentation. Only executable code should be checked against these rules.
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}
const qaToolCode = stripComments(qaToolSource);

// ---- STATIC: the local QA tool never touches Supabase, Anthropic, or the
// real production Functions ----
(function staticNoProductionWrites() {
  check('LOCAL-QA static', 'Does not import or reference Supabase (auth.mjs / supabaseRest / SUPABASE_URL)', !/supabaseRest|SUPABASE_URL|_lib\/certification\/auth\.mjs/.test(qaToolCode));
  // The harness's own banner text is free to explain (in a UI string) that no
  // ANTHROPIC_API_KEY is required -- that is a true, reassuring statement to
  // the owner, not a reference to actually reading/requiring it. The
  // meaningful check is that no import statement pulls in the real Cadence
  // grader module and no code path reads the env var.
  check('LOCAL-QA static', 'Does not import cadence-grader.mjs', !/from\s+['"][^'"]*cadence-grader\.mjs['"]/.test(qaToolCode));
  check('LOCAL-QA static', 'Never reads env.ANTHROPIC_API_KEY / process.env.ANTHROPIC_API_KEY', !/\benv\.ANTHROPIC_API_KEY\b|process\.env\.ANTHROPIC_API_KEY/.test(qaToolCode));
  check('LOCAL-QA static', 'Does not import any functions/api/certification/*.js production endpoint file', !/functions\/api\/certification/.test(qaToolCode));
  check('LOCAL-QA static', 'Binds explicitly to 127.0.0.1 (never 0.0.0.0 or unqualified)', /server\.listen\(port,\s*'127\.0\.0\.1'/.test(qaToolCode));
  check('LOCAL-QA static', 'Never binds to 0.0.0.0 in executable code', !/0\.0\.0\.0/.test(qaToolCode));
  check('LOCAL-QA static', 'Debug (answer-key) view is a separate route from the student view', /pathname === '\/debug'/.test(qaToolCode) && /pathname === '\/' &&/.test(qaToolCode));
})();

// ---- STATIC: production client bundle never embeds the bank or answer keys ----
(function productionBundleSafety() {
  check('PRODUCTION BUNDLE', 'module12-certification.js does not import content-bank.mjs', !/content-bank\.mjs/.test(rendererSource));
  check('PRODUCTION BUNDLE', 'module12-certification.js does not import content-schema.mjs (server-only projection helpers)', !/content-schema\.mjs/.test(rendererSource));
  check('PRODUCTION BUNDLE', 'module12-certification.js does not import scoring.mjs (server-only scoring engine)', !/scoring\.mjs/.test(rendererSource));
  check('PRODUCTION BUNDLE', 'module12-certification.js never references correctChoice/correctAnswer/rationale/rubricCriteria/criticalFlags', !/correctChoice|correctAnswer|\brationale\b|rubricCriteria|criticalFlags/.test(rendererSource));

  // Spot-check that no real knowledge-bank prompt text is embedded verbatim
  // in the shipped client file (it should only ever render prompts received
  // over the network from a real attempt).
  const promptMatches = [...knowledgeMd.matchAll(/^A licensed practitioner completes AIMT certification.*$/gm)];
  const sampleRealPrompt = promptMatches[0] ? promptMatches[0][0] : null;
  if (sampleRealPrompt) {
    check('PRODUCTION BUNDLE', 'A real Knowledge-bank prompt string is not hardcoded into module12-certification.js', !rendererSource.includes(sampleRealPrompt));
  }
})();

// ---- INTEGRATION: spin up the real --browser server and probe it live ----
async function runIntegrationChecks() {
  const port = 41730 + (process.pid % 1000);
  const child = spawn(process.execPath, [path.join(ROOT, 'scripts/review-module12-bank.mjs'), '--browser', '--port', String(port), '--seed', '3'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let ready = false;
  child.stdout.on('data', (d) => { if (d.toString().includes('running')) ready = true; });

  try {
    const deadline = Date.now() + 8000;
    while (!ready && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 150));
    }
    check('LOCAL-QA integration', 'Server starts and reports ready within 8s', ready);
    if (!ready) return;

    const base = `http://127.0.0.1:${port}`;

    const homeRes = await fetch(base + '/');
    check('LOCAL-QA integration', 'GET / returns 200 (student harness page)', homeRes.status === 200);
    const homeHtml = await homeRes.text();
    check('LOCAL-QA integration', 'Harness page loads the real, unmodified renderer file path', homeHtml.includes('/assets/js/module12-certification.js'));
    check('LOCAL-QA integration', 'Harness page carries a visible LOCAL/NOT-PRODUCTION banner', /LOCAL VISUAL QA/.test(homeHtml));

    const rendererRes = await fetch(base + '/assets/js/module12-certification.js');
    const rendererBody = await rendererRes.text();
    check('LOCAL-QA integration', 'Served renderer JS is byte-identical to the real production file', rendererBody === rendererSource);

    const startRes = await fetch(base + '/api/certification/start-attempt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const startBody = await startRes.json();
    const items = (startBody.attempt && startBody.attempt.partI && startBody.attempt.partI.items) || [];
    check('LOCAL-QA integration', 'start-attempt returns exactly 40 real Part I items', items.length === 40, `got ${items.length}`);
    const forbidden = ['correctChoice', 'rationale', 'sourceModule', 'sourceSection', 'competency', 'status'];
    const leaked = items.some((it) => forbidden.some((k) => k in it));
    check('LOCAL-QA integration', 'start-attempt response contains no answer-key/internal-metadata fields', !leaked);

    const part2Res = await fetch(base + '/api/certification/get-part?attemptId=x&part=2');
    const part2Body = await part2Res.json();
    check('LOCAL-QA integration', 'get-part(2) returns all 12 real cases (QA tool intentionally shows all, not the real exam\'s 4-of-12 draw)', (part2Body.cases || []).length === 12, `got ${(part2Body.cases || []).length}`);
    const caseLeak = (part2Body.cases || []).some((c) => 'criticalFlags' in c || 'scoring' in c || c.parts.some((p) => 'correctAnswer' in p || 'rubric' in p));
    check('LOCAL-QA integration', 'get-part(2) case payload contains no scoring/rubric/criticalFlags/correctAnswer', !caseLeak);

    const submitCaseRes = await fetch(base + '/api/certification/submit-case', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId: 'x', caseId: 'CASE-04', responses: { 'CASE-04-pA': 1, 'CASE-04-pB': [0, 1, 2, 4], 'CASE-04-pC': 2 } }),
    });
    const submitCaseBody = await submitCaseRes.json();
    check('LOCAL-QA integration', 'submit-case scores a real, correct CASE-04 submission at 100% via the REAL scoring engine', submitCaseBody.caseScore === 1, JSON.stringify(submitCaseBody));

    const part3Res = await fetch(base + '/api/certification/get-part?attemptId=x&part=3');
    const part3Body = await part3Res.json();
    check('LOCAL-QA integration', 'get-part(3) returns a real interview conversation with a non-empty primary prompt', !!(part3Body.conversation && part3Body.conversation.primaryPrompt && part3Body.conversation.primaryPrompt.length > 20));
    check('LOCAL-QA integration', 'get-part(3) conversation payload contains no rubricCriteria/criticalFlags', part3Body.conversation && !('rubricCriteria' in part3Body.conversation) && !('criticalFlags' in part3Body.conversation));

    if (part3Body.conversation) {
      const turnRes = await fetch(base + '/api/certification/submit-interview-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: 'x', interviewId: part3Body.conversation.id, studentResponse: 'Test response for visual QA.' }),
      });
      const turnBody = await turnRes.json();
      check('LOCAL-QA integration', 'submit-interview-turn demonstrates the one allowed follow-up with real, human-authored text', turnBody.needsFollowUp === true && typeof turnBody.followUpPrompt === 'string' && turnBody.followUpPrompt.length > 10);
    }

    const debugRes = await fetch(base + '/debug');
    check('LOCAL-QA integration', 'GET /debug (separate internal answer-key page) returns 200 and is visually/textually distinct from the student view', debugRes.status === 200);
    const debugHtml = await debugRes.text();
    check('LOCAL-QA integration', '/debug page is explicitly labeled internal/never-publish', /INTERNAL OWNER QA ONLY/.test(debugHtml));
  } finally {
    child.kill();
  }
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
