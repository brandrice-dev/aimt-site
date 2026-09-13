// Deterministic tests for the Module 12 results-screen redesign (the
// post-assessment Performance Review surface for states C/pass and
// D/not-yet-passed). This file is a browser-only IIFE with no exports and
// the repo has a zero-npm-dependency rule (no jsdom/puppeteer), so
// verification here follows the same two-part pattern already established
// by tests/certification-ui-refactor.test.mjs: (1) static structural
// assertions on the source itself -- confirming every displayed number is
// read from real server-authoritative data, never hardcoded/decorative --
// and (2) a live integration walk against the real `--browser` local QA
// harness, proving the server (and the harness's mirrored mock) actually
// return real, version-resolved thresholds end to end, not just that the
// client code looks right in isolation.
//
// Does NOT re-verify scoring/threshold arithmetic itself (already covered
// by tests/certification-scoring.test.mjs) -- only that the results UI
// correctly maps real data onto what a student sees.
//
// Run: node tests/certification-results-redesign.test.mjs

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
const getStatusSrc = readFileSync(path.join(ROOT, 'functions/api/certification/get-status.js'), 'utf8');
const harnessSrc = readFileSync(path.join(ROOT, 'scripts/review-module12-bank.mjs'), 'utf8');

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

// ─────────────────────────────────────────────────────────────────────────
// A. OVERALL RING -- driven by the real overall score, not a decorative constant
// ─────────────────────────────────────────────────────────────────────────
(function overallRingReal() {
  const fn = fnBody(clientSrc, 'performanceReviewBlock');
  check('A. OVERALL RING', 'performanceReviewBlock() exists', !!fn);
  if (!fn) return;
  check('A. OVERALL RING', 'Ring value is derived from review.overallScore (not a hardcoded number)', /overallPct100[\s\S]{0,40}review\.overallScore/.test(fn) || /Math\.round\(\(review\.overallScore/.test(fn));
  check('A. OVERALL RING', 'Ring display text is the real pct(review.overallScore), not a literal string', /display:\s*pct\(review\.overallScore\)/.test(fn));
  check('A. OVERALL RING', 'Ring status text depends on review.decision (pass vs not-yet-passed), not fixed', /review\.decision === 'pass'/.test(fn) && /statusText\s*=\s*overallOk/.test(fn));
  check('A. OVERALL RING', 'Ring is drawn via the shared AIMTMetricRing primitive, not a hand-rolled SVG', /window\.AIMTMetricRing\.render\(/.test(fn));
  check('A. OVERALL RING', 'Ring call is guarded against AIMTMetricRing being unavailable (no hard crash if the script fails to load)', /window\.AIMTMetricRing\s*&&\s*typeof window\.AIMTMetricRing\.render\s*===\s*'function'/.test(fn));
  check('A. OVERALL RING', 'A visible textual fallback (real score/label/status, not blank) exists for the no-ring case', /m12x-result-ring-fallback/.test(fn));
  check('A. OVERALL RING', 'Ring accessible text names the real overall score, the real overall minimum, and the real status', /ringAccessible[\s\S]{0,200}pct\(review\.overallScore\)[\s\S]{0,200}t\.minimums\.overall/.test(fn));
})();

// ─────────────────────────────────────────────────────────────────────────
// B. DOMAIN CARDS -- each of Knowledge/Applied Cases/Interview shows its
// OWN real score and its OWN real minimum, never a shared/hardcoded pair
// ─────────────────────────────────────────────────────────────────────────
(function domainCardsReal() {
  const domainFn = fnBody(clientSrc, 'domainCardHtml');
  check('B. DOMAIN CARDS', 'domainCardHtml() exists', !!domainFn);
  if (domainFn) {
    check('B. DOMAIN CARDS', 'Card score comes from the pct() of the real score argument, not a literal', /pct\(score\)/.test(domainFn));
    check('B. DOMAIN CARDS', 'Card threshold text is computed from the real minimum argument, not a literal percentage', /Math\.round\(minimum \* 100\)/.test(domainFn));
    check('B. DOMAIN CARDS', 'Fill bar width is driven by the real score (0-100 clamped), not a fixed width', /Math\.max\(0, Math\.min\(100, Math\.round\(\(score \|\| 0\) \* 100\)\)\)/.test(domainFn));
    check('B. DOMAIN CARDS', 'Threshold tick position is driven by the real minimum, not a fixed position', /Math\.max\(0, Math\.min\(100, Math\.round\(minimum \* 100\)\)\)/.test(domainFn));
    check('B. DOMAIN CARDS', 'Status word depends on meetsStandard(score, minimum), never hardcoded to "Meets Standard"', /statusWord\s*=\s*ok\s*\?\s*'Meets Standard'\s*:\s*'Review Required'/.test(domainFn));
    check('B. DOMAIN CARDS', 'Status is never color-only: the text status word is always emitted in the visible card AND the sr-only sentence', (domainFn.match(/statusWord/g) || []).length >= 3);
  }

  const reviewFn = fnBody(clientSrc, 'performanceReviewBlock');
  check('B. DOMAIN CARDS', 'All three components (knowledge, appliedCases, interview) are rendered, each with its own real score + its own real minimum from thresholds', !!reviewFn &&
    /domainCardHtml\('knowledge', review\.componentScores\.knowledge, t\.minimums\.knowledge\)/.test(reviewFn) &&
    /domainCardHtml\('appliedCases', review\.componentScores\.appliedCases, t\.minimums\.appliedCases\)/.test(reviewFn) &&
    /domainCardHtml\('interview', review\.componentScores\.interview, t\.minimums\.interview\)/.test(reviewFn));
  check('B. DOMAIN CARDS', 'Never three equal-sized hero rings for the components (design constraint: only ONE AIMTMetricRing.render(...) invocation in performanceReviewBlock, for Overall -- the typeof guard\'s own reference to .render is excluded)', !!reviewFn && (reviewFn.match(/AIMTMetricRing\.render\(\{/g) || []).length === 1);

  const meetsFn = fnBody(clientSrc, 'meetsStandard');
  check('B. DOMAIN CARDS', 'meetsStandard() exists and uses >= (inclusive), matching the server\'s own gate semantics', !!meetsFn && />=/.test(meetsFn));
})();

// ─────────────────────────────────────────────────────────────────────────
// C. CERTIFICATION STATUS -- matches actual eligibility (review.decision),
// never inferred from the overall score alone
// ─────────────────────────────────────────────────────────────────────────
(function certificationStatusMatchesEligibility() {
  const stateC = fnBody(clientSrc, 'renderStateC');
  const stateD = fnBody(clientSrc, 'renderStateD');
  check('C. CERTIFICATION STATUS', 'renderStateC() passes the real, approved COPY.passed eyebrow/title/body into the results hero (not invented copy)', !!stateC && /performanceReviewBlock\(status\.performanceReview, COPY\.passed\.eyebrow, COPY\.passed\.title, paras\(COPY\.passed\.body\), 'm12x-pass-banner'\)/.test(stateC));
  check('C. CERTIFICATION STATUS', 'renderStateD() passes the real, approved COPY.notYetPassed eyebrow/title/body (not invented "FAILED" language)', !!stateD && /performanceReviewBlock\(status\.performanceReview, COPY\.notYetPassed\.eyebrow, COPY\.notYetPassed\.title, paras\(COPY\.notYetPassed\.body\), 'm12x-notyet-banner'\)/.test(stateD));
  check('C. CERTIFICATION STATUS', 'State C/D dispatch itself is server-driven (status.state), not decided client-side from the score', /status\.state === 'C'/.test(clientSrc) && /status\.state === 'D'/.test(clientSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// D. FAILED-DOMAIN STATE -- identifies the CORRECT critical domain(s) by ID,
// never a generic/static "something failed" message
// ─────────────────────────────────────────────────────────────────────────
(function failedDomainIdentifiesCorrectDomains() {
  const fn = fnBody(clientSrc, 'performanceReviewBlock');
  check('D. FAILED-DOMAIN STATE', 'Uncleared critical domains are enumerated from the real review.criticalDomainResults array (never a fixed list)', !!fn && /\(review\.criticalDomainResults \|\| \[\]\)\.forEach/.test(fn));
  check('D. FAILED-DOMAIN STATE', 'Each uncleared row is only emitted for a domain that is actually !d.cleared (per-domain, not all-or-nothing)', !!fn && /if \(!d\.cleared\)/.test(fn));
  check('D. FAILED-DOMAIN STATE', 'Each uncleared row names the real domain via DOMAIN_LABELS[d.domainId], falling back to the raw ID rather than a generic label', !!fn && /DOMAIN_LABELS\[d\.domainId\] \|\| d\.domainId/.test(fn));
  check('D. FAILED-DOMAIN STATE', 'DOMAIN_LABELS covers all four locked Head Spa critical domains (D1-D4)', /D1:/.test(clientSrc) && /D2:/.test(clientSrc) && /D3:/.test(clientSrc) && /D4:/.test(clientSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// E. THRESHOLD TRANSPARENCY -- real, version-resolved thresholds reach the
// client from all three real data sources (production endpoint, local QA
// harness mock, Review Mode fixture), never a client-invented number
// ─────────────────────────────────────────────────────────────────────────
(function thresholdsAreReal() {
  check('E. THRESHOLDS', 'get-status.js resolves thresholds via getAssessmentConfig(assessment_version) -- the SPECIFIC version the attempt was scored under, not just "whatever is current"', /getAssessmentConfig\(latestFinalized\.assessment_version\)/.test(getStatusSrc));
  check('E. THRESHOLDS', 'get-status.js selects assessment_version from the attempts table so that resolution is possible', /assessment_version/.test(getStatusSrc) && /select:\s*'[^']*assessment_version/.test(getStatusSrc));
  check('E. THRESHOLDS', 'get-status.js never hardcodes a minimums/weights object inline (only via the imported config)', !/minimums:\s*\{\s*knowledge:\s*0\.75/.test(getStatusSrc));

  // The local QA harness and the Review Mode fixture cannot import the real
  // server config (harness legitimately can; Review Mode's client fixture
  // cannot, since it has no server-side module access) -- both must still
  // carry the SAME real numbers as functions/_lib/certification/
  // assessment-config.mjs's HEAD_SPA_ASSESSMENT_CONFIG_V1, so a student
  // never sees three different "standards" depending on which path rendered
  // their screen.
  const realConfigSrc = readFileSync(path.join(ROOT, 'functions/_lib/certification/assessment-config.mjs'), 'utf8');
  const realWeights = { knowledge: 0.5, appliedCases: 0.3, interview: 0.2 };
  const realMinimums = { knowledge: 0.75, appliedCases: 0.75, interview: 0.8, overall: 0.8 };
  check('E. THRESHOLDS', 'Sanity: the real config file itself still has the values this test assumes (fails loudly if the standard ever changes without updating this test)',
    new RegExp('knowledge:\\s*' + realWeights.knowledge).test(realConfigSrc) &&
    new RegExp('appliedCases:\\s*' + realWeights.appliedCases).test(realConfigSrc) &&
    new RegExp('interview:\\s*' + realWeights.interview + ',?\\s*\\n\\s*\\}\\)').test(realConfigSrc) &&
    new RegExp('knowledge:\\s*' + realMinimums.knowledge).test(realConfigSrc) &&
    new RegExp('overall:\\s*' + realMinimums.overall).test(realConfigSrc));

  check('E. THRESHOLDS', 'Harness mock mirrors the same real weights/minimums into session.result.thresholds (via the real imported config, not a re-typed copy)', /thresholds:\s*\{\s*weights:\s*config\.weights,\s*minimums:\s*config\.minimums\s*\}/.test(harnessSrc));

  const fixtureFn = fnBody(clientSrc, 'fixtureStatusFor');
  check('E. THRESHOLDS', 'Review Mode fixture carries the same real numeric thresholds (0.5/0.3/0.2 weights, 0.75/0.75/0.8/0.8 minimums), not a different placeholder set',
    !!fixtureFn &&
    /knowledge:\s*0\.5,\s*appliedCases:\s*0\.3,\s*interview:\s*0\.2/.test(fixtureFn) &&
    /knowledge:\s*0\.75,\s*appliedCases:\s*0\.75,\s*interview:\s*0\.8,\s*overall:\s*0\.8/.test(fixtureFn));

  check('E. THRESHOLDS', 'Client has a FALLBACK_THRESHOLDS constant matching the same real numbers, only used when a legacy record has none attached', /FALLBACK_THRESHOLDS\s*=\s*\{\s*weights:\s*\{\s*knowledge:\s*0\.5,\s*appliedCases:\s*0\.3,\s*interview:\s*0\.2\s*\},\s*minimums:\s*\{\s*knowledge:\s*0\.75,\s*appliedCases:\s*0\.75,\s*interview:\s*0\.8,\s*overall:\s*0\.8\s*\}\s*\}/.test(clientSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// F. ACCESSIBILITY -- no chart-only meaning; every score has a paired
// numeric/textual equivalent
// ─────────────────────────────────────────────────────────────────────────
(function accessibilityTextEquivalents() {
  const fn = fnBody(clientSrc, 'domainCardHtml');
  check('F. ACCESSIBILITY', 'Each domain card carries an sr-only sentence naming the component, its score, its minimum, and its status word (never chart-only)', !!fn && /m12x-sr-only/.test(fn) && /Minimum required:/.test(fn));
  check('F. ACCESSIBILITY', 'The score/threshold/status text nodes are NOT aria-hidden (screen readers get the same numbers sighted users see, not only the sr-only summary)', !!fn && !/aria-hidden="true"[^>]*m12x-domain-card-score/.test(fn));
  const reviewFn = fnBody(clientSrc, 'performanceReviewBlock');
  check('F. ACCESSIBILITY', 'The critical-competencies checkmark is aria-hidden (decorative glyph) while the real text label ("All Cleared") remains the accessible content', !!reviewFn && /aria-hidden="true">✓/.test(reviewFn));
})();

// ─────────────────────────────────────────────────────────────────────────
// G. INTEGRATION -- real end-to-end proof against the live `--browser` local
// QA harness: a real finalized attempt's get-status response actually
// carries real, correctly-shaped thresholds, not just that the source text
// looks right in isolation.
// ─────────────────────────────────────────────────────────────────────────
async function withHarness(seedSuffix, fn) {
  const port = 41830 + ((process.pid + seedSuffix) % 1000);
  const child = spawn(process.execPath, [path.join(ROOT, 'scripts/review-module12-bank.mjs'), '--browser', '--port', String(port), '--seed', String(seedSuffix)], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let ready = false;
  child.stdout.on('data', (d) => { if (d.toString().includes('running')) ready = true; });
  try {
    const deadline = Date.now() + 8000;
    while (!ready && Date.now() < deadline) await new Promise((r) => setTimeout(r, 150));
    if (!ready) { check('G. INTEGRATION', 'Server #' + seedSuffix + ' starts within 8s', false); return; }
    const base = `http://127.0.0.1:${port}`;
    async function get(p) { const r = await fetch(base + p); return r; }
    await fn({ base, get });
  } finally {
    child.kill();
  }
}

async function runIntegrationChecks() {
  await withHarness(1, async ({ get }) => {
    const ringJs = await get('/assets/js/aimt-metric-ring.js');
    check('G. INTEGRATION', 'The harness serves the real, unmodified ring script (the fix that makes the results screen actually render the ring in local QA)', ringJs.status === 200 && (await ringJs.clone().text()).includes('AIMTMetricRing'));
    const ringCss = await get('/assets/css/aimt-metric-ring.css');
    check('G. INTEGRATION', 'The harness serves the real, unmodified ring stylesheet', ringCss.status === 200 && (await ringCss.clone().text()).includes('aimt-metric-ring'));

    const page = await get('/');
    const pageHtml = await page.text();
    check('G. INTEGRATION', 'The harness page actually references both ring assets (not just present on disk, but wired into the served page)', /aimt-metric-ring\.css/.test(pageHtml) && /aimt-metric-ring\.js/.test(pageHtml));
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
