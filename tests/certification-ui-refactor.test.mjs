// Deterministic tests for the Module 12 visual/UX refactor
// (assets/js/module12-certification.js). This file is a browser-only IIFE
// with no exports, and the repo has a zero-npm-dependency rule (no jsdom/
// puppeteer), so verification here is: (1) static structural assertions on
// the source itself -- confirming the redesign's key architectural
// properties are actually present in the code, not just described in a
// commit message -- and (2) live integration checks against the real
// `--browser` local QA server (already used by
// tests/certification-local-qa-tool.test.mjs) to confirm the SERVED page
// really does omit a permanent question grid and really does load the real
// site's design-system assets.
//
// Run: node tests/certification-ui-refactor.test.mjs

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

const src = readFileSync(path.join(ROOT, 'assets/js/module12-certification.js'), 'utf8');

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

// ---- STATIC: permanent 40-question grid removed from the main question screen ----
(function noPermanentGrid() {
  const drawQuestion = fnBody('drawQuestion');
  check('PART I NAVIGATION', 'drawQuestion() function exists (main question screen renderer)', !!drawQuestion);
  if (drawQuestion) {
    check('PART I NAVIGATION', 'drawQuestion() does not render a permanent m12x-jumpgrid (the old always-visible 1-40 grid)', !drawQuestion.includes('m12x-jumpgrid'));
    check('PART I NAVIGATION', 'drawQuestion() renders a thin progress track/fill instead', drawQuestion.includes('m12x-progress-track') && drawQuestion.includes('m12x-progress-fill'));
    check('PART I NAVIGATION', 'drawQuestion() shows an on-demand "View Question Map" trigger', drawQuestion.includes('View Question Map'));
    check('PART I NAVIGATION', 'drawQuestion() shows Previous/Next/Flag controls', drawQuestion.includes('m12PrevQ') && drawQuestion.includes('m12NextQ') && drawQuestion.includes('m12FlagBtn'));
  }

  const openQuestionMap = fnBody('openQuestionMap');
  check('QUESTION MAP', 'openQuestionMap() function exists', !!openQuestionMap);
  if (openQuestionMap) {
    check('QUESTION MAP', 'Question map is a native <dialog> (on-demand overlay, not permanent layout)', openQuestionMap.includes("createElement('dialog')"));
    check('QUESTION MAP', 'Question map calls showModal() for focus-trap/Escape-to-close semantics', openQuestionMap.includes('showModal'));
    check('QUESTION MAP', 'Question map distinguishes answered/unanswered/flagged/current states', /answered/.test(openQuestionMap) && /flagged/.test(openQuestionMap) && /current/.test(openQuestionMap));
    check('QUESTION MAP', 'Question map states are conveyed with text labels, not color alone (aria-label states the status in words)', openQuestionMap.includes('stateLabel'));
    check('QUESTION MAP', 'Question map supports direct navigation via onJump callback', openQuestionMap.includes('onJump'));
  }
})();

// ---- STATIC: flag-for-review is session-local UI state, never scored ----
(function flagState() {
  check('FLAG STATE', 'A flagged{} state object exists, separate from responses{}', /var flagged = \{\}/.test(src));
  check('FLAG STATE', 'Flag toggling never touches responses or triggers a save/submit call', (function () {
    const drawQuestion = fnBody('drawQuestion');
    if (!drawQuestion) return false;
    // The flag click handler must only mutate `flagged`, never call saveProgressDebounced/apiPost.
    const flagHandlerMatch = drawQuestion.match(/flagBtn\.addEventListener\('click', function \(\) \{([^}]*)\}\)/);
    return !!flagHandlerMatch && !/saveProgressDebounced|apiPost/.test(flagHandlerMatch[1]);
  })());
})();

// ---- STATIC: no auto-submit; submission requires the explicit review + confirm flow ----
(function noAutoSubmit() {
  const drawReview = fnBody('drawReview');
  check('NO AUTO-SUBMIT', 'A drawReview() (review-before-submit) screen exists, separate from submission', !!drawReview);
  if (drawReview) {
    check('NO AUTO-SUBMIT', 'Review screen shows Answered/Unanswered/Flagged summary counts', drawReview.includes('m12SumAnswered') && drawReview.includes('m12SumUnanswered') && drawReview.includes('m12SumFlagged'));
    check('NO AUTO-SUBMIT', 'Review screen requires an explicit Submit click (onSubmitPartI only wired to a button listener)', /getElementById\('m12SubmitBtn'\)\.addEventListener\('click'/.test(drawReview));
  }
  const drawQuestion = fnBody('drawQuestion');
  check('NO AUTO-SUBMIT', 'Reaching the last question shows "Review Answers", not an automatic submission', drawQuestion && drawQuestion.includes('Review Answers'));
})();

// ---- STATIC: Part II supports all 5 real answer-structure types with dedicated UI ----
(function partIIControlTypes() {
  const renderCasePartFieldset = fnBody('renderCasePartFieldset');
  check('PART II CONTROL TYPES', 'renderCasePartFieldset() exists', !!renderCasePartFieldset);
  if (renderCasePartFieldset) {
    check('PART II CONTROL TYPES', 'Renders structured-short-response as a textarea', renderCasePartFieldset.includes("'structured-short-response'") && renderCasePartFieldset.includes('cp-input'));
    check('PART II CONTROL TYPES', 'Renders single-best-answer with radio-style choiceHtml', renderCasePartFieldset.includes("'single-best-answer'") && renderCasePartFieldset.includes("'radio'"));
    check('PART II CONTROL TYPES', 'Renders multi-select with checkbox-style choiceHtml and a "Select all that apply" hint', renderCasePartFieldset.includes("'multi-select'") && renderCasePartFieldset.includes("'checkbox'") && renderCasePartFieldset.includes('Select all that apply'));
    check('PART II CONTROL TYPES', 'Renders sequencing with numbered items and up/down reordering (keyboard-operable buttons, not drag-only)', renderCasePartFieldset.includes("'sequencing'") && renderCasePartFieldset.includes('m12x-seq-num') && renderCasePartFieldset.includes('data-seq-up') && renderCasePartFieldset.includes('data-seq-down'));
    check('PART II CONTROL TYPES', 'Renders classification as a per-item category chip selector, not generic checkboxes', renderCasePartFieldset.includes("'classification'") && renderCasePartFieldset.includes('m12x-chip') && renderCasePartFieldset.includes('m12x-classify-label'));
  }
  const scoringFn = fnBody('casePartAnswered');
  check('PART II CONTROL TYPES', 'casePartAnswered() gates submission per type (submit button disabled until answered)', !!scoringFn && ['structured-short-response', 'multi-select', 'classification', 'sequencing'].every((t) => scoringFn.includes(t)));
})();

// ---- STATIC: Part III never exposes rubric/scoring internals to the client ----
(function partIIINoRubricExposure() {
  const forbidden = ['rubricCriteria', 'criterionScores', 'explicitUnsafe', 'patternTag', 'correctChoice', 'correctAnswer'];
  const leaked = forbidden.filter((k) => src.includes(k));
  check('PART III SECURITY', 'Client file never references rubric/scoring/answer-key fields (server-only concepts)', leaked.length === 0, leaked.join(','));
  const renderPartIII = fnBody('renderPartIII');
  check('PART III SECURITY', 'renderPartIII() renders only prompt/transcript text, no numeric score or rubric UI', !!renderPartIII && !/score|rubric/i.test(renderPartIII));
})();

// ---- STATIC: locked assessment wording preserved verbatim (spot-check long strings) ----
(function lockedWordingPreserved() {
  const mustContain = [
    'You’ve completed the instructional part of the Head Spa Certification Course and demonstrated your understanding at required checkpoints along the way.',
    'A strong overall score cannot override an unresolved issue in an area involving professional scope, client safety, consent/touch authority, or sanitation/process integrity.',
    'Cadence has been checking your understanding throughout the course.',
    'Parts I and II are intended to reflect your own retained knowledge and judgment.',
    'You’ve completed the course and demonstrated the knowledge, application, and professional judgment AIMT requires for certification.',
    'Your assessment shows that you have already met the AIMT standard in some areas, but one or more required competencies still need additional work before certification can be issued.',
    'Your next step is an AIMT Educator Remediation Session. This is a live conversation focused on the areas that are still preventing certification.',
    'If you believe a question was unclear or flawed, Cadence misunderstood your response, a technical issue affected your assessment, or an accessibility or language issue affected how your competency was evaluated, you may request human review.'
  ];
  for (const s of mustContain) {
    check('LOCKED WORDING', 'Approved copy present verbatim: "' + s.slice(0, 50) + '…"', src.includes(s));
  }
})();

// ---- STATIC: typography reuses established AIMT hierarchy, not a one-off exam style ----
(function typographyReuse() {
  check('TYPOGRAPHY', 'Question stem typography matches the site\'s established checkpoint-question treatment (.cp-q: serif, 500 weight, 0.93rem)', /m12x-q \{ font-family:var\(--aimt-font-serif\); font-size:0\.93rem; font-weight:500;/.test(src));
  check('TYPOGRAPHY', 'No new font-family is introduced -- only --aimt-font-* tokens are referenced', !/font-family:\s*(?!var\(--aimt-font)['"][^'"]+['"]/.test(src.replace(/https:\/\/fonts\.googleapis\.com[^'"]*/g, '')));
})();

// ---- INTEGRATION: the real --browser server serves the redesigned page correctly ----
async function runIntegrationChecks() {
  const port = 41830 + (process.pid % 1000);
  const child = spawn(process.execPath, [path.join(ROOT, 'scripts/review-module12-bank.mjs'), '--browser', '--port', String(port), '--seed', '11'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let ready = false;
  child.stdout.on('data', (d) => { if (d.toString().includes('running')) ready = true; });
  try {
    const deadline = Date.now() + 8000;
    while (!ready && Date.now() < deadline) await new Promise((r) => setTimeout(r, 150));
    check('LOCAL QA STYLE PARITY', 'Server starts within 8s', ready);
    if (!ready) return;
    const base = 'http://127.0.0.1:' + port;

    const homeRes = await fetch(base + '/');
    const homeHtml = await homeRes.text();
    check('LOCAL QA STYLE PARITY', 'Harness page links the real production design-system stylesheet', homeHtml.includes('/assets/css/aimt-design-system.css'));
    check('LOCAL QA STYLE PARITY', 'Harness page embeds the real extracted <style> block from headspa-mastery.html (contains .sec-title)', /\.sec-title\s*\{/.test(homeHtml));
    check('LOCAL QA STYLE PARITY', 'Harness page does not render a permanent 40-cell grid before any interaction (Exam Ready state has no jumpgrid)', !homeHtml.includes('m12x-jumpgrid'));

    const rendererRes = await fetch(base + '/assets/js/module12-certification.js');
    const rendererBody = await rendererRes.text();
    check('LOCAL QA STYLE PARITY', 'Served renderer is byte-identical to the real production file (true reuse, not a fork)', rendererBody === src);
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
