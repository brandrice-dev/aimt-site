#!/usr/bin/env node
// AIMT Module 12 — offline content-bank QA viewer for the owner.
//
// WHY THIS IS A LOCAL SCRIPT, NOT A LIVE ENDPOINT: Module 12 Review Mode
// (assets/js/module12-certification.js) is gated only by a client-side
// hostname/query-param check (`?review=1` on a branch-preview URL) -- branch
// preview URLs are not truly private. Serving the full de-keyed bank, or
// even unlimited fresh constrained draws, from a live Cloudflare Pages
// Function reachable by that gate (or by any authenticated enrolled student)
// would meaningfully increase how much of the bank could be scraped before
// ever taking a real attempt (Standard Section 16's "reduce the value of
// scraping the full bank" concern). This script reads content-bank.mjs
// directly (server-side code, never bundled to the browser) and never
// touches Supabase, never creates an attempt, never issues a certificate --
// it satisfies task instruction #14 ("a safe Review Mode method to inspect
// the real final content... without creating production records") by being
// something only someone with local repo access can run, exactly like
// reading this traceability doc or running the test suite.
//
// Usage:
//   node scripts/review-module12-bank.mjs                 sample one seeded attempt (40/4/3), written to HTML
//   node scripts/review-module12-bank.mjs --seed 42        regenerate a different sample draw
//   node scripts/review-module12-bank.mjs --all            browse the entire approved bank (with answer keys)
//   node scripts/review-module12-bank.mjs --out path.html  write to a custom path
//   node scripts/review-module12-bank.mjs --browser        launch a localhost-only REAL RENDERER visual QA server
//   node scripts/review-module12-bank.mjs --browser --port 4173 --seed 7
//
// Output is an HTML file (default: scripts/.module12-review-output.html,
// gitignored -- never commit generated QA output) with two clearly labeled
// sections: STUDENT VIEW (exactly what a real attempt would render) and
// INTERNAL ANSWER KEY (correct answers/rubrics, for the owner's own QA only
// -- this file must never be published or deployed).
//
// --browser starts a plain Node http.Server bound to 127.0.0.1 ONLY (never
// 0.0.0.0) that serves the REAL, unmodified assets/js/module12-certification.js
// and the site's real CSS, backed by a set of local-only mock endpoints
// implementing the exact same REST contract as functions/api/certification/*.js
// -- so the production renderer runs completely unmodified against the real
// installed bank, with zero Supabase writes, zero attempt/certificate
// records, and no ANTHROPIC_API_KEY requirement (Cadence case/interview
// evaluation is mocked; deterministic scoring/gating still uses the REAL
// scoring.mjs engine). See runBrowserServer() below for the full design note.

import { writeFileSync, readFileSync, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function mline(s) { return esc(s).replace(/\n/g, '<br>'); }

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function renderKnowledgeItem(item) {
  return `
    <div class="item">
      <div class="item-id">${esc(item.id)} &middot; Module ${item.sourceModule} &middot; ${esc(item.difficulty)}${item.status !== 'approved' ? ' &middot; <span class="draft">DRAFT/BLOCKED — excluded from real attempts</span>' : ''}</div>
      <div class="prompt">${mline(item.prompt)}</div>
      <ol type="A">${item.choices.map((c, i) => `<li${i === item.correctChoice ? ' class="correct"' : ''}>${esc(c)}</li>`).join('')}</ol>
      <div class="key">Correct: ${'ABCD'[item.correctChoice]} &mdash; ${esc(item.rationale)}</div>
      <div class="meta">Domains: ${item.criticalDomainEvidence.join(', ') || 'none'} &middot; Source: ${esc(item.sourceSection)}</div>
    </div>`;
}

function renderCasePart(part) {
  let body = '';
  if (part.type === 'structured-short-response') {
    body = `<div class="prompt">${mline(part.prompt)}</div><div class="key">Rubric: ${esc(JSON.stringify(part.rubric))}</div>`;
  } else if (part.type === 'classification') {
    body = `<div class="prompt">${mline(part.prompt)}</div><ul>${part.items.map((it) => `<li>${esc(it.label)} &rarr; <strong>${esc(part.correctAnswer[it.id])}</strong></li>`).join('')}</ul>`;
  } else {
    body = `<div class="prompt">${mline(part.prompt)}</div><ol type="A">${part.choices.map((c, i) => `<li${(Array.isArray(part.correctAnswer) ? part.correctAnswer.includes(i) : part.correctAnswer === i) ? ' class="correct"' : ''}>${esc(c)}</li>`).join('')}</ol>`;
  }
  return `<div class="part"><div class="item-id">${esc(part.id)} (${esc(part.type)})</div>${body}</div>`;
}

function renderCase(item) {
  return `
    <div class="item">
      <div class="item-id">${esc(item.id)} &middot; Modules ${item.sourceModules.join(', ')}${item.status !== 'approved' ? ' &middot; <span class="draft">DRAFT/BLOCKED</span>' : ''}</div>
      <div class="scenario">${mline(item.scenario)}</div>
      ${item.parts.map(renderCasePart).join('')}
      ${item.criticalFlags && item.criticalFlags.length ? `<div class="key">Critical flags: ${item.criticalFlags.map((f) => esc(f.description || JSON.stringify(f))).join(' | ')}</div>` : ''}
      <div class="meta">Domains: ${item.criticalDomainEvidence.join(', ') || 'none'} &middot; Source: ${esc(item.sourceSection)}</div>
    </div>`;
}

function renderInterview(item) {
  return `
    <div class="item">
      <div class="item-id">${esc(item.id)} &middot; Modules ${item.sourceModules.join(', ')}${item.status !== 'approved' ? ' &middot; <span class="draft">DRAFT/BLOCKED</span>' : ''}</div>
      <div class="prompt">${mline(item.primaryPrompt)}</div>
      <div class="meta">Follow-up: ${mline(item.followUpPrompt || '')}</div>
      <ul>${item.rubricCriteria.map((c) => `<li><strong>${esc(c.label)}</strong>${c.guidance && c.guidance !== c.label ? ' — ' + esc(c.guidance) : ''}${c.explicitUnsafeRule ? ' <em>(Type A: ' + esc(c.explicitUnsafeRule.description) + ')</em>' : ''}</li>`).join('')}</ul>
      <div class="meta">Domains: ${item.criticalDomainEvidence.join(', ') || 'none'} &middot; Source: ${esc(item.sourceSection)}</div>
    </div>`;
}

function page(title, bodyHtml) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
    body { font-family: -apple-system, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; color: #222; }
    h1 { font-size: 1.3rem; } h2 { font-size: 1.05rem; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 2rem; }
    .item { border: 1px solid #ddd; border-radius: 8px; padding: 0.9rem 1.1rem; margin-bottom: 1rem; }
    .part { border-top: 1px dashed #ccc; margin-top: 0.6rem; padding-top: 0.6rem; }
    .item-id { font-family: monospace; font-size: 0.72rem; color: #666; margin-bottom: 0.4rem; }
    .prompt, .scenario { margin-bottom: 0.5rem; }
    .key { background: #fef6e0; padding: 6px 8px; border-radius: 6px; font-size: 0.85rem; margin-top: 0.4rem; }
    .meta { font-size: 0.72rem; color: #888; margin-top: 0.4rem; }
    .correct { font-weight: 700; color: #2a6b2a; }
    .draft { color: #a33; font-weight: 700; }
    .banner { background: #222; color: #fff; padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.8rem; margin-bottom: 1.5rem; }
  </style></head><body>
  <div class="banner">INTERNAL OWNER QA ONLY — never publish, deploy, or embed this file. Generated locally by scripts/review-module12-bank.mjs. Contains answer keys and rubrics.</div>
  <h1>${esc(title)}</h1>
  ${bodyHtml}
  </body></html>`;
}

// ---------------------------------------------------------------------------
// --browser: localhost-only real-renderer visual QA server.
//
// DESIGN: this reuses assets/js/module12-certification.js verbatim (the
// exact file the production site loads) rather than building a second,
// independent Module 12 UI. That file already only ever depends on: (1) the
// site's shared CSS foundation (classes like .body-text/.sec-title/
// .key-point and --aimt-* custom properties, all defined in
// headspa-mastery.html's single <style> block plus assets/css/
// aimt-design-system.css); (2) two small, defensively-guarded globals,
// window.APP_STATE (only read for the student's first name, wrapped in
// try/catch) and window.ReviewMode (only read via isActive(), used here to
// stay OFF so the file takes its normal, non-fixture code path); and (3) the
// exact /api/certification/* REST contract implemented by
// functions/api/certification/*.js. This server supplies all three: it
// extracts the real <style> block from headspa-mastery.html and serves the
// real design-system stylesheet as static files, stubs the two globals with
// a few lines instead of loading the full course state machine (out of
// scope for a Module-12-content QA tool), and implements local, in-memory
// stand-ins for the six endpoints module12-certification.js actually calls.
//
// WHAT IS MOCKED VS. REAL:
//   REAL:  the entire client renderer (unmodified file); the actual
//          installed content bank; assembleAttempt() and its 40-item Part I
//          constrained draw; scoreCaseSubmission()/scoreInterviewConversation()/
//          evaluateCriticalDomains()/determineCertificationDecision() (the
//          real scoring/gating engine, unmodified).
//   MOCKED: Cadence's actual judgment for structured-short-response case
//           parts and interview conversation turns (no ANTHROPIC_API_KEY is
//           read or required) -- clearly banner-labeled in the harness page.
//           Part II/III intentionally include ALL approved cases/interviews
//           (not the real exam's 4-of-12 / 3-of-9 draw) so the owner can
//           browse every item through the real renderer in one session.
//
// WHAT NEVER HAPPENS: no network call leaves this process (no Supabase, no
// Anthropic, no Cloudflare); no attempt/certificate/remediation/review
// record is created anywhere; the server refuses to bind to any interface
// other than 127.0.0.1.
async function runBrowserServer({ ROOT, ENGINE, seed, port }) {
  const {
    ProjectK, ProjectCase, ProjectInterview,
    scoreCaseSubmission, computeAppliedCasesComponent,
    scoreInterviewConversation, computeInterviewComponent, interviewEvaluatorFlagsFromState,
    computeOverallWeighted, evaluateCriticalDomains, determineCertificationDecision,
    assembleAttempt, config, banks, HEAD_SPA_CRITICAL_DOMAINS, findNextInterview,
    scoreKnowledgeResponses, determineNextAttemptEligibility, collectWeakCompetencyAreas, buildRemediationAssignments,
  } = ENGINE;

  const htmlPath = path.join(ROOT, 'headspa-mastery.html');
  const fullHtml = readFileSync(htmlPath, 'utf8');
  const styleMatch = fullHtml.match(/<style>[\s\S]*?<\/style>/);
  const siteStyle = styleMatch ? styleMatch[0] : '<style></style>';
  const rendererJs = readFileSync(path.join(ROOT, 'assets/js/module12-certification.js'), 'utf8');

  function mulberry32Local(s) {
    let a = s >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Single in-memory session (this is a single-owner local tool, not a
  // multi-user server) -- reset by restarting the process or reloading with
  // a new ?seed=.
  function freshSession(seedValue) {
    const rng = mulberry32Local(seedValue);
    const partIResult = assembleAttempt(
      { knowledgeBank: banks.knowledgeBank, caseBank: [], interviewBank: [] },
      { ...config, partII: { ...config.partII, targetCount: 0 }, partIII: { ...config.partIII, targetCount: 0 } },
      { rng }
    );
    // Part II/III deliberately include EVERY approved case/interview (not
    // the real exam's 4-of-12 / 3-of-9 draw) so the owner can browse all 12
    // cases and all 9 conversations through the real renderer in one pass.
    const allCases = banks.caseBank.filter((c) => c.status === 'approved');
    const allInterviews = banks.interviewBank.filter((i) => i.status === 'approved');
    return {
      id: randomUUID(),
      seed: seedValue,
      attemptNumber: 1,
      partI: { items: partIResult.ok ? partIResult.partI : [], responses: {} },
      part2: { cases: allCases, state: {} }, // caseId -> {submitted, responses}
      part3: { interviews: allInterviews, state: {} }, // interviewId -> {transcript, followUpUsed, finalized, criterionScores, explicitUnsafeDomains, patternTags}
      started: false, // flips true the moment /api/certification/start-attempt is called -- mirrors production inserting the certification_attempts row.
      part1Locked: false,
      part2Locked: false,
      part3Locked: false,
      finalized: false,
      // QA-only, never a production concept: lets the owner deterministically
      // preview both the mock PASS and mock NOT YET PASSED result screens
      // without retaking 40 knowledge items twice. null = real mock scoring
      // (currently a comfortable pass by construction). Set via the banner
      // control below, which round-trips through GET / -- never sent to, or
      // readable by, the production endpoints.
      mockOutcomeOverride: null,
    };
  }

  let session = freshSession(seed);
  // Cross-attempt QA state, separate from `session` (which is replaced
  // wholesale each time a genuinely new attempt starts): which items this
  // student has already been given (for retake-overlap minimization,
  // exactly like production's fetchPriorSelectedIds), the finalized-attempt
  // history the real attempt-ladder gate reads, and the real (never
  // fixture-hardcoded) remediation records finalize-assessment.js's logic
  // produces. Reset together with `session` whenever ?seed= restarts.
  let seenIds = { knowledge: [], cases: [], interviews: [] };
  let attemptHistory = []; // [{attemptNumber, decision, criticalDomainResults}]
  let remediationAssignments = []; // [{competency_area, critical_domain, module_ref, section_ref, required_before_next_attempt, completed, attemptNumber}]

  // A genuinely fresh, complete 40/4/3 attempt -- the real constrained draw
  // (unlike freshSession()'s deliberate "show everything" browsing mode),
  // with retake-overlap minimization against every item this QA session has
  // already drawn. This is what "Start Attempt 2" (and any later attempt)
  // actually calls, exactly mirroring functions/api/certification/
  // start-attempt.js's real behavior: no carried-over responses, no
  // carried-over Part I/II/III locks.
  function freshRealAttempt(attemptNumber) {
    const rng = mulberry32Local((seed * 1000 + attemptNumber) >>> 0);
    const assembled = assembleAttempt(banks, config, {
      rng,
      seenKnowledgeIds: seenIds.knowledge,
      seenCaseIds: seenIds.cases,
      seenInterviewIds: seenIds.interviews,
    });
    const partI = assembled.ok ? assembled.partI : [];
    const partII = assembled.ok ? assembled.partII : [];
    const partIII = assembled.ok ? assembled.partIII : [];
    return {
      id: randomUUID(),
      seed: session.seed,
      attemptNumber,
      partI: { items: partI, responses: {} },
      part2: { cases: partII, state: {} },
      part3: { interviews: partIII, state: {} },
      started: false,
      part1Locked: false,
      part2Locked: false,
      part3Locked: false,
      finalized: false,
      mockOutcomeOverride: session.mockOutcomeOverride,
    };
  }

  function mockEvaluateStructuredCasePart() {
    // Not real Cadence judgment -- constant, clearly-labeled placeholder so
    // the visual QA flow can proceed without ANTHROPIC_API_KEY. Never used
    // for anything but local rendering QA.
    return { correctnessScore: 0.75, explicitUnsafe: false, patternTag: null };
  }

  function mockEvaluateInterviewTurn(interviewDef, state, conversationIndex) {
    // Deterministically exercises BOTH real Part III paths across a normal
    // 3-conversation QA session rather than always forcing the one-follow-up
    // path: even conversation indices (0, 2, 4, ...) use the interview's
    // real, human-authored followUpPrompt once before finalizing; odd
    // indices (1, 3, 5, ...) finalize immediately on the primary response.
    // A real Cadence call decides this contextually; this mock does not
    // attempt to -- it only needs to be deterministic and cover both paths.
    // Real scoreInterviewConversation() (scoring.mjs, unmodified/real here)
    // grades each criterion on the locked 0/1/2 scale -- 2 is full credit.
    // This mock models a solid, professional response (full credit on every
    // criterion) so the default "auto" mock outcome is a genuine pass-
    // quality interview score, not silently capped at 50% by a placeholder
    // half-credit value.
    const criterionScores = {};
    for (const c of interviewDef.rubricCriteria) criterionScores[c.id] = 2;
    const immediateFinalize = Number(conversationIndex) % 2 === 1;
    if (!immediateFinalize && !state.followUpUsed) {
      return { criterionScores, explicitUnsafeDomains: [], patternTags: {}, needsFollowUp: true, followUpPrompt: interviewDef.followUpPrompt, transitionLine: null };
    }
    return { criterionScores, explicitUnsafeDomains: [], patternTags: {}, needsFollowUp: false, followUpPrompt: null, transitionLine: 'That makes sense. I’ve got what I need there. Let’s look at another situation.' };
  }

  function finalizeIfReady() {
    if (!session.part1Locked || !session.part2Locked || !session.part3Locked) return;
    const caseResults = session.part2.cases.map((c) => ({ caseId: c.id, percent: (session.part2.state[c.id] && session.part2.state[c.id].score) || 0 }));
    const appliedCasesComponent = computeAppliedCasesComponent(caseResults);
    const interviewResults = session.part3.interviews.map((i) => {
      const st = session.part3.state[i.id] || {};
      const flags = interviewEvaluatorFlagsFromState(st);
      return scoreInterviewConversation(i, st.criterionScores || {}, flags);
    });
    const interviewComponent = computeInterviewComponent(interviewResults);
    // Part I scoring against a real correctChoice key is exercised by the
    // deterministic test suite, not this visual tool -- 0.8 is a fixed mock
    // input. When the owner has asked (via the banner control) to preview
    // the NOT YET PASSED result screen, this is deliberately dropped below
    // config.minimums.knowledge (0.75) so the REAL, unmodified
    // determineCertificationDecision() gate (independent per-component
    // minimums, no compensation) fails on its own logic -- not a fabricated
    // decision.
    const knowledgePercent = session.mockOutcomeOverride === 'not_yet_passed' ? 0.5 : 0.8;
    const overallPercent = computeOverallWeighted({ knowledgePercent, appliedCasesPercent: appliedCasesComponent.percent, interviewPercent: interviewComponent.percent }, config.weights);
    const allEvidence = [
      ...session.part2.cases.flatMap((c) => (session.part2.state[c.id] && session.part2.state[c.id].evidencePoints) || []),
      ...interviewResults.flatMap((r) => r.evidencePoints),
    ];
    const criticalDomainResults = evaluateCriticalDomains(allEvidence, HEAD_SPA_CRITICAL_DOMAINS);
    const decision = determineCertificationDecision({ knowledgePercent, appliedCasesPercent: appliedCasesComponent.percent, interviewPercent: interviewComponent.percent, criticalDomainResults, config });
    session.finalized = true;
    session.result = { decision: decision.decision, overallScore: decision.overallPercent, componentScores: { knowledge: knowledgePercent, appliedCases: appliedCasesComponent.percent, interview: interviewComponent.percent }, criticalDomainResults, attemptNumber: session.attemptNumber, decisionAt: new Date().toISOString() };

    attemptHistory.push({ attemptNumber: session.attemptNumber, decision: decision.decision, criticalDomainResults });

    if (decision.decision === 'not_yet_passed') {
      // Real weak-spot detection, mirroring finalize-assessment.js exactly
      // (same helpers, same thresholds) -- never a hardcoded fixture row --
      // so the QA harness's Recommended Review panel shows genuinely
      // representative data, not placeholder text.
      const weakSpots = [];
      const knowledgeMock = scoreKnowledgeResponses(session.partI.items, session.partI.responses || {});
      const knowledgeItemsById = {};
      for (const item of session.partI.items) knowledgeItemsById[item.id] = item;
      for (const p of knowledgeMock.perItem) {
        if (p.correct) continue;
        const item = knowledgeItemsById[p.id];
        if (item) weakSpots.push({ competency: item.competency, sourceModules: [item.sourceModule], sectionRef: item.sourceSection });
      }
      for (const c of session.part2.cases) {
        const cs = session.part2.state[c.id];
        if (!cs || cs.score == null || cs.score >= config.minimums.appliedCases) continue;
        for (const competency of c.competencies || []) weakSpots.push({ competency, sourceModules: c.sourceModules, sectionRef: null });
      }
      for (const i of session.part3.interviews) {
        const st = session.part3.state[i.id];
        if (!st || !st.finalized) continue;
        const flags = interviewEvaluatorFlagsFromState(st);
        const result = scoreInterviewConversation(i, st.criterionScores || {}, flags);
        if (result.percent >= config.minimums.interview) continue;
        for (const competency of i.competencies || []) weakSpots.push({ competency, sourceModules: i.sourceModules, sectionRef: null });
      }
      const weakCompetencyAreas = collectWeakCompetencyAreas(weakSpots);
      const assignments = buildRemediationAssignments({ criticalDomainResults, weakCompetencyAreas }).map((a) => ({ ...a, attemptNumber: session.attemptNumber }));
      remediationAssignments.push(...assignments);
    }
  }

  function json(res, status, body) {
    const data = JSON.stringify(body);
    res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) });
    res.end(data);
  }

  const MIME = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp' };

  function serveStatic(res, filePath) {
    if (!existsSync(filePath) || !statSync(filePath).isFile()) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath);
    const body = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(body);
  }

  function harnessHtml(seedValue) {
    return `<!doctype html><html><head><meta charset="utf-8"><title>Module 12 — Local Visual QA</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;900&family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/aimt-design-system.css">
${siteStyle}
<style>
  #m12qa-banner { position: sticky; top: 0; z-index: 999; background: #1a1a1a; color: #fff; padding: 10px 16px; font-family: monospace; font-size: 12px; line-height: 1.5; }
  #m12qa-banner b { color: #ffd76a; }
  #m12qa-controls { display: flex; gap: 10px; align-items: center; margin-top: 6px; flex-wrap: wrap; }
  #m12qa-controls input { font-size: 12px; padding: 3px 6px; }
  #m12qa-controls a, #m12qa-controls button { font-size: 12px; color: #9fd6ff; background: none; border: 1px solid #555; padding: 3px 8px; border-radius: 4px; cursor: pointer; }
  #m12container { max-width: 900px; margin: 2rem auto; padding: 0 1rem; }
  body { background: #fff; }
</style>
</head><body>
<div id="m12qa-banner">
  <b>LOCAL VISUAL QA — not production.</b> Real installed content bank (real renderer: assets/js/module12-certification.js, unmodified). Part II shows all 12 cases; Part III shows all 9 conversations (real exam draws only 4/3). Case/interview scoring uses a MOCK evaluator (no live Cadence, no ANTHROPIC_API_KEY) — deterministically alternates conversation-by-conversation between the immediate-finalize path and the one-allowed-follow-up path, so both are reachable in one normal run. No Supabase writes, no attempt/certificate records.
  <div id="m12qa-controls">
    <span>Seed: ${seedValue}</span>
    <span><b>Attempt: ${session.attemptNumber}</b></span>
    <a href="/?seed=${seedValue + 1}">Regenerate Part I (new seed)</a>
    <a href="/">Restart</a>
    <a href="/debug" target="_blank">Internal answer-key view (separate page)</a>
    <label>Student name: <input id="m12qaName" value="Jordan" size="10"></label>
    <button id="m12qaSetName">Set</button>
  </div>
  <div id="m12qa-controls">
    <span><b>QA ONLY</b> — force the Processing → result screen:</span>
    <a href="/?mockOutcome=pass">Mock PASS</a>
    <a href="/?mockOutcome=not_yet_passed">Mock NOT YET PASSED</a>
    <a href="/?mockOutcome=auto">Auto (real mock scoring)</a>
    <span>Current: ${session.mockOutcomeOverride || 'auto'}</span>
  </div>
  <div id="m12qa-controls">
    <span><b>QA ONLY</b> — simulate completing recommended review/remediation (real content doesn't exist yet):</span>
    <a href="/?completeRemediation=1">Mark all outstanding remediation complete</a>
  </div>
</div>
<div id="m12container"></div>
<script>
  window.APP_STATE = { data: { student: { name: 'Jordan' } } };
  window.ReviewMode = { isActive: function () { return false; } }; // real (non-fixture) render path
  // QA ONLY -- this harness never loads headspa-mastery.html's full course
  // state machine (out of scope for a Module-12-content QA tool), so there
  // is no real course navigation to hand off to. This stub lets the owner
  // confirm the Recommended Review panel's "Open Module N" buttons are
  // wired to the correct module number without needing that whole page.
  window.openModuleById = function (moduleNumber) {
    alert('QA harness stub: in the real course this opens Module ' + moduleNumber + '.');
  };
  document.getElementById('m12qaSetName').addEventListener('click', function () {
    var v = document.getElementById('m12qaName').value.trim();
    window.APP_STATE.data.student.name = v;
    Module12Cert.render(document.getElementById('m12container'));
  });
</script>
<script src="/assets/js/module12-certification.js"></script>
<script>
  Module12Cert.render(document.getElementById('m12container'));
</script>
</body></html>`;
  }

  const server = createServer((req, res) => {
    try {
      handleRequest(req, res);
    } catch (e) {
      console.error('QA server request error (process kept alive):', e);
      try { json(res, 500, { error: String((e && e.message) || e) }); } catch (_) {}
    }
  });

  function handleRequest(req, res) {
    const url = new URL(req.url, 'http://127.0.0.1');
    const pathname = url.pathname;

    if (pathname === '/' && req.method === 'GET') {
      const requestedSeed = url.searchParams.get('seed');
      if (requestedSeed != null) {
        session = freshSession(Number(requestedSeed));
        seenIds = { knowledge: [], cases: [], interviews: [] };
        attemptHistory = [];
        remediationAssignments = [];
      }
      const requestedMockOutcome = url.searchParams.get('mockOutcome');
      if (requestedMockOutcome === 'pass' || requestedMockOutcome === 'not_yet_passed') session.mockOutcomeOverride = requestedMockOutcome;
      else if (requestedMockOutcome === 'auto') session.mockOutcomeOverride = null;
      // QA ONLY -- simulates completing the remediation the owner would
      // otherwise do through real course content, so the Attempt 3 gate
      // (real determineNextAttemptEligibility logic below) can be tested
      // both blocked and unblocked without a remediation-content UI, which
      // doesn't exist yet (content pending a later, separate task).
      if (url.searchParams.get('completeRemediation') === '1') {
        for (const r of remediationAssignments) if (r.required_before_next_attempt) r.completed = true;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(harnessHtml(session.seed));
      return;
    }
    if (pathname === '/debug' && req.method === 'GET') {
      const html = buildAllBankHtml(banks);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      return;
    }
    if (pathname === '/assets/js/module12-certification.js' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      res.end(rendererJs);
      return;
    }
    if (pathname.startsWith('/assets/') && req.method === 'GET') {
      serveStatic(res, path.join(ROOT, pathname));
      return;
    }

    if (pathname === '/api/certification/get-status' && req.method === 'GET') {
      if (session.finalized) {
        // Real attempt-ladder gate (functions/_lib/certification/attempt-
        // ladder.mjs, unmodified) fed by this QA session's real finalized-
        // attempt history and real remediation records -- never a
        // hardcoded "you can always retake immediately" shortcut, so the
        // harness actually demonstrates the Attempt 3 remediation gate.
        const ladder = determineNextAttemptEligibility({ attempts: attemptHistory, remediationAssignments, educatorRequests: [], config });
        const state = ladder.alreadyCertified ? 'C' : (attemptHistory.some((a) => a.decision === 'not_yet_passed') ? 'D' : 'A');
        const remediationForLatestAttempt = state === 'D'
          ? remediationAssignments
              .filter((r) => r.attemptNumber === session.attemptNumber)
              .map((r) => ({ competency_area: r.competency_area, critical_domain: r.critical_domain, module_ref: r.module_ref, section_ref: r.section_ref, required_before_next_attempt: r.required_before_next_attempt, completed: r.completed }))
          : null;
        json(res, 200, { eligible: true, state, ladder, performanceReview: session.result, remediation: remediationForLatestAttempt });
        return;
      }
      if (session.started || session.part1Locked || session.part2Locked || session.part3Locked) {
        const status = !session.part1Locked ? 'in_progress' : !session.part2Locked ? 'part1_locked' : !session.part3Locked ? 'part2_locked' : 'part3_locked';
        json(res, 200, { eligible: true, state: 'B', inProgressAttempt: { id: session.id, attemptNumber: session.attemptNumber, status } });
        return;
      }
      json(res, 200, { eligible: true, state: 'A', ladder: { canStartNewAttempt: true, nextAttemptNumber: session.attemptNumber } });
      return;
    }

    if (pathname === '/api/certification/start-attempt' && req.method === 'POST') {
      if (!session.finalized) {
        session.started = true;
        json(res, 200, { attempt: { id: session.id, partI: { items: session.partI.items.map(ProjectK), responses: session.partI.responses } } });
        return;
      }
      // A prior attempt in this QA session has been finalized -- "Start
      // Attempt N" must be a genuinely new, complete 40/4/3 assessment,
      // exactly like production's start-attempt.js: a fresh constrained
      // draw with retake-overlap minimization, zero carried-over
      // responses, and every part's lock state reset. Gated by the same
      // real ladder function used by get-status above, so a remediation-
      // blocked Attempt 3 is actually refused here too, not silently
      // allowed.
      const ladder = determineNextAttemptEligibility({ attempts: attemptHistory, remediationAssignments, educatorRequests: [], config });
      if (!ladder.canStartNewAttempt) {
        json(res, 409, { error: 'Next attempt is not yet available.', blockedReason: ladder.blockedReason, details: ladder });
        return;
      }
      seenIds = {
        knowledge: seenIds.knowledge.concat(session.partI.items.map((i) => i.id)),
        cases: seenIds.cases.concat(session.part2.cases.map((c) => c.id)),
        interviews: seenIds.interviews.concat(session.part3.interviews.map((i) => i.id)),
      };
      session = freshRealAttempt(ladder.nextAttemptNumber);
      session.started = true;
      json(res, 200, { attempt: { id: session.id, partI: { items: session.partI.items.map(ProjectK), responses: session.partI.responses } } });
      return;
    }

    if (pathname === '/api/certification/save-progress' && req.method === 'POST') {
      let body = '';
      req.on('data', (d) => (body += d));
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}');
          if (parsed.part === 1) session.partI.responses = parsed.responses || {};
        } catch (_) {}
        json(res, 200, {});
      });
      return;
    }

    if (pathname === '/api/certification/submit-part1' && req.method === 'POST') {
      let body = '';
      req.on('data', (d) => (body += d));
      req.on('end', () => {
        try { session.partI.responses = JSON.parse(body || '{}').responses || {}; } catch (_) {}
        session.part1Locked = true;
        json(res, 200, {});
      });
      return;
    }

    if (pathname === '/api/certification/get-part' && req.method === 'GET') {
      const part = url.searchParams.get('part');
      if (part === '2') {
        const cases = session.part2.cases.map((c) => ({ ...ProjectCase(c), submitted: !!(session.part2.state[c.id] && session.part2.state[c.id].submitted) }));
        json(res, 200, { cases });
        return;
      }
      const selection = findNextInterview(session.part3.interviews.map((i) => i.id), session.part3.state);
      if (selection.allFinalized) { json(res, 200, { allConversationsFinalized: true }); return; }
      const nextInterview = session.part3.interviews.find((i) => i.id === selection.nextInterviewId);
      const st = session.part3.state[nextInterview.id] || { transcript: [], followUpUsed: false };
      json(res, 200, { conversation: { ...ProjectInterview(nextInterview), transcript: st.transcript || [], followUpUsed: !!st.followUpUsed, isFirstConversation: selection.isFirstConversation } });
      return;
    }

    if (pathname === '/api/certification/submit-case' && req.method === 'POST') {
      let body = '';
      req.on('data', (d) => (body += d));
      req.on('end', () => {
        let parsed = {};
        try { parsed = JSON.parse(body || '{}'); } catch (_) {}
        const caseDef = session.part2.cases.find((c) => c.id === parsed.caseId);
        if (!caseDef) { json(res, 404, { error: 'Unknown case.' }); return; }
        const cadenceEvaluatedParts = {};
        for (const part of caseDef.parts) if (part.type === 'structured-short-response') cadenceEvaluatedParts[part.id] = mockEvaluateStructuredCasePart();
        const scored = scoreCaseSubmission(caseDef, parsed.responses || {}, { cadenceEvaluatedParts });
        session.part2.state[caseDef.id] = { submitted: true, score: scored.percent, evidencePoints: scored.evidencePoints };
        const allSubmitted = session.part2.cases.every((c) => session.part2.state[c.id] && session.part2.state[c.id].submitted);
        if (allSubmitted) session.part2Locked = true;
        json(res, 200, { locked: true, alreadySubmitted: false, caseScore: scored.percent, part2Complete: allSubmitted });
      });
      return;
    }

    if (pathname === '/api/certification/submit-interview-turn' && req.method === 'POST') {
      let body = '';
      req.on('data', (d) => (body += d));
      req.on('end', () => {
        let parsed = {};
        try { parsed = JSON.parse(body || '{}'); } catch (_) {}
        const interviewDef = session.part3.interviews.find((i) => i.id === parsed.interviewId);
        if (!interviewDef) { json(res, 404, { error: 'Unknown conversation.' }); return; }
        const state = session.part3.state[interviewDef.id] || { transcript: [{ role: 'assistant', content: interviewDef.primaryPrompt }], followUpUsed: false, finalized: false, criterionScores: {} };
        // Parity with the real endpoint (functions/api/certification/submit-
        // interview-turn.js): a finalized conversation is locked and cannot
        // be restarted or re-scored by a later turn.
        if (state.finalized) { json(res, 200, { finalized: true, alreadyFinalized: true }); return; }
        const conversationIndex = session.part3.interviews.findIndex((i) => i.id === interviewDef.id);
        const evaluation = mockEvaluateInterviewTurn(interviewDef, state, conversationIndex);
        let transcript = state.transcript.concat([{ role: 'user', content: parsed.studentResponse }]);
        if (evaluation.needsFollowUp) {
          transcript = transcript.concat([{ role: 'assistant', content: evaluation.followUpPrompt }]);
          session.part3.state[interviewDef.id] = { ...state, transcript, followUpUsed: true, criterionScores: evaluation.criterionScores };
          json(res, 200, { finalized: false, needsFollowUp: true, followUpPrompt: evaluation.followUpPrompt });
          return;
        }
        session.part3.state[interviewDef.id] = { ...state, transcript, finalized: true, criterionScores: evaluation.criterionScores, explicitUnsafeDomains: [], patternTags: {} };
        const allFinalized = session.part3.interviews.every((i) => session.part3.state[i.id] && session.part3.state[i.id].finalized);
        if (allFinalized) session.part3Locked = true;
        json(res, 200, { finalized: true, needsFollowUp: false, transitionLine: evaluation.transitionLine, allConversationsFinalized: allFinalized });
      });
      return;
    }

    if (pathname === '/api/certification/finalize-assessment' && req.method === 'POST') {
      finalizeIfReady();
      json(res, 200, { ok: true });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }

  server.listen(port, '127.0.0.1', () => {
    console.log(`\nModule 12 local visual QA server running.`);
    console.log(`Open:  http://127.0.0.1:${port}/`);
    console.log(`Debug (answer keys, separate page): http://127.0.0.1:${port}/debug`);
    console.log(`Bound to 127.0.0.1 only -- not reachable from other machines. Ctrl+C to stop.\n`);
  });
}

function buildAllBankHtml(banks) {
  const byModule = {};
  for (const item of banks.knowledgeBank) {
    byModule[item.sourceModule] = byModule[item.sourceModule] || [];
    byModule[item.sourceModule].push(item);
  }
  let html = `<h2>Part I — Knowledge Bank (${banks.knowledgeBank.length} total)</h2>`;
  for (const mod of Object.keys(byModule).sort((a, b) => Number(a) - Number(b))) {
    html += `<h3>Module ${mod} (${byModule[mod].length} items)</h3>` + byModule[mod].map(renderKnowledgeItem).join('');
  }
  html += `<h2>Part II — Applied Cases (${banks.caseBank.length} total)</h2>` + banks.caseBank.map(renderCase).join('');
  html += `<h2>Part III — Practitioner Conversations (${banks.interviewBank.length} total)</h2>` + banks.interviewBank.map(renderInterview).join('');
  return page('Module 12 — Full Bank QA (all items, internal debug view)', html);
}

async function main() {
  const args = process.argv.slice(2);
  const browser = args.includes('--browser');
  const all = args.includes('--all');
  const seedIdx = args.indexOf('--seed');
  const seed = seedIdx !== -1 ? Number(args[seedIdx + 1]) : Math.floor(Math.random() * 1e9);
  const outIdx = args.indexOf('--out');
  const outPath = outIdx !== -1 ? path.resolve(args[outIdx + 1]) : path.join(ROOT, 'scripts/.module12-review-output.html');

  const bankMod = await import(path.join(ROOT, 'functions/_lib/certification/content-bank.mjs'));
  const banks = bankMod.getProductionBanks();

  if (browser) {
    const portIdx = args.indexOf('--port');
    const port = portIdx !== -1 ? Number(args[portIdx + 1]) : 4173;
    const { assembleAttempt } = await import(path.join(ROOT, 'functions/_lib/certification/randomization.mjs'));
    const { getCurrentAssessmentConfig } = await import(path.join(ROOT, 'functions/_lib/certification/assessment-config.mjs'));
    const { projectKnowledgeItemForClient, projectCaseForClient, projectInterviewItemForClient } = await import(path.join(ROOT, 'functions/_lib/certification/content-schema.mjs'));
    const {
      scoreCaseSubmission, computeAppliedCasesComponent,
      scoreInterviewConversation, computeInterviewComponent, interviewEvaluatorFlagsFromState,
      computeOverallWeighted, evaluateCriticalDomains, determineCertificationDecision,
      scoreKnowledgeResponses,
    } = await import(path.join(ROOT, 'functions/_lib/certification/scoring.mjs'));
    const { HEAD_SPA_CRITICAL_DOMAINS } = await import(path.join(ROOT, 'functions/_lib/certification/critical-domains.mjs'));
    const { findNextInterview } = await import(path.join(ROOT, 'functions/_lib/certification/interview-progression.mjs'));
    const { determineNextAttemptEligibility, collectWeakCompetencyAreas, buildRemediationAssignments } = await import(path.join(ROOT, 'functions/_lib/certification/attempt-ladder.mjs'));
    await runBrowserServer({
      ROOT,
      seed,
      port,
      ENGINE: {
        ProjectK: projectKnowledgeItemForClient,
        ProjectCase: projectCaseForClient,
        ProjectInterview: projectInterviewItemForClient,
        scoreCaseSubmission, computeAppliedCasesComponent,
        scoreInterviewConversation, computeInterviewComponent, interviewEvaluatorFlagsFromState,
        computeOverallWeighted, evaluateCriticalDomains, determineCertificationDecision,
        assembleAttempt, config: getCurrentAssessmentConfig(), banks, HEAD_SPA_CRITICAL_DOMAINS, findNextInterview,
        scoreKnowledgeResponses, determineNextAttemptEligibility, collectWeakCompetencyAreas, buildRemediationAssignments,
      },
    });
    return; // keep process alive; server.listen() holds the event loop open
  }

  if (all) {
    const byModule = {};
    for (const item of banks.knowledgeBank) {
      byModule[item.sourceModule] = byModule[item.sourceModule] || [];
      byModule[item.sourceModule].push(item);
    }
    let html = `<h2>Part I — Knowledge Bank (${banks.knowledgeBank.length} total)</h2>`;
    for (const mod of Object.keys(byModule).sort((a, b) => Number(a) - Number(b))) {
      html += `<h3>Module ${mod} (${byModule[mod].length} items)</h3>` + byModule[mod].map(renderKnowledgeItem).join('');
    }
    html += `<h2>Part II — Applied Cases (${banks.caseBank.length} total)</h2>` + banks.caseBank.map(renderCase).join('');
    html += `<h2>Part III — Practitioner Conversations (${banks.interviewBank.length} total)</h2>` + banks.interviewBank.map(renderInterview).join('');
    writeFileSync(outPath, page('Module 12 — Full Bank QA (all items)', html), 'utf8');
    console.log(`Wrote full-bank QA view to ${outPath}`);
    console.log(`Knowledge: ${banks.knowledgeBank.length} (${banks.knowledgeBank.filter((i) => i.status === 'approved').length} approved)`);
    console.log(`Cases: ${banks.caseBank.length} (${banks.caseBank.filter((i) => i.status === 'approved').length} approved)`);
    console.log(`Interviews: ${banks.interviewBank.length} (${banks.interviewBank.filter((i) => i.status === 'approved').length} approved)`);
    return;
  }

  const { assembleAttempt } = await import(path.join(ROOT, 'functions/_lib/certification/randomization.mjs'));
  const { getCurrentAssessmentConfig } = await import(path.join(ROOT, 'functions/_lib/certification/assessment-config.mjs'));
  const config = getCurrentAssessmentConfig();
  const rng = mulberry32(seed);
  const result = assembleAttempt(banks, config, { rng });
  if (!result.ok) {
    console.error('Could not assemble a sample attempt:', result);
    process.exit(1);
  }
  let html = `<p>Seed: <code>${seed}</code> — re-run with <code>--seed ${seed}</code> to reproduce, or omit --seed for a new random draw.</p>`;
  html += `<h2>Part I — Knowledge (${result.partI.length} selected)</h2>` + result.partI.map(renderKnowledgeItem).join('');
  html += `<h2>Part II — Applied Cases (${result.partII.length} selected)</h2>` + result.partII.map(renderCase).join('');
  html += `<h2>Part III — Practitioner Conversations (${result.partIII.length} selected)</h2>` + result.partIII.map(renderInterview).join('');
  html += `<h2>Critical-domain evidence matrix</h2><pre>${esc(JSON.stringify(result.evidenceMatrix, null, 2))}</pre>`;
  writeFileSync(outPath, page(`Module 12 — Sample Attempt (seed ${seed})`, html), 'utf8');
  console.log(`Wrote sample-attempt QA view to ${outPath}`);
  console.log(`Seed: ${seed} (pass --seed ${seed} to reproduce, or a different number for a new draw)`);
}

main();
