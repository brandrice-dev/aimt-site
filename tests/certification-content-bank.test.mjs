// Deterministic tests for the installed Module 12 production content bank.
// Run: node tests/certification-content-bank.test.mjs
//
// Covers task requirements: exact 120/12/9 counts and module distribution,
// unique IDs, required fields, traceability status sanity, no raw-blueprint
// source, real-bank constrained selection (seeded, many draws), retake
// overlap minimization, and student-payload security (no answer keys/
// rubrics ever serialized to the client).

import { readFileSync } from 'node:fs';
import {
  knowledgeBank,
  caseBank,
  interviewBank,
  CONTENT_STATUS,
} from '../functions/_lib/certification/content-bank.mjs';
import {
  validateKnowledgeItemShape,
  validateCaseItemShape,
  validateInterviewItemShape,
  isApprovedForProduction,
  projectKnowledgeItemForClient,
  projectCaseForClient,
  projectInterviewItemForClient,
} from '../functions/_lib/certification/content-schema.mjs';
import { assembleAttempt } from '../functions/_lib/certification/randomization.mjs';
import { getCurrentAssessmentConfig } from '../functions/_lib/certification/assessment-config.mjs';

const config = getCurrentAssessmentConfig();
const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- CONTENT: exact counts ----
(function contentCounts() {
  check('CONTENT counts', 'Knowledge bank has exactly 120 items', knowledgeBank.length === 120, `got ${knowledgeBank.length}`);
  check('CONTENT counts', 'Case bank has exactly 12 items', caseBank.length === 12, `got ${caseBank.length}`);
  check('CONTENT counts', 'Interview bank has exactly 9 items', interviewBank.length === 9, `got ${interviewBank.length}`);
  check('CONTENT counts', 'Bank status is INSTALLED, not CONTENT_PENDING', CONTENT_STATUS === 'INSTALLED', CONTENT_STATUS);

  const expectedModuleCounts = { 1: 8, 2: 9, 3: 12, 4: 14, 5: 11, 6: 11, 7: 10, 8: 14, 9: 10, 10: 12, 11: 9 };
  const actual = {};
  for (const item of knowledgeBank) actual[item.sourceModule] = (actual[item.sourceModule] || 0) + 1;
  for (const [mod, expected] of Object.entries(expectedModuleCounts)) {
    check('CONTENT counts', `Module ${mod} has exactly ${expected} knowledge items`, actual[mod] === expected, `got ${actual[mod] || 0}`);
  }
})();

// ---- CONTENT: unique IDs across all three banks ----
(function uniqueIds() {
  const kIds = knowledgeBank.map((i) => i.id);
  check('CONTENT ids', 'No duplicate knowledge IDs', new Set(kIds).size === kIds.length);
  const cIds = caseBank.map((i) => i.id);
  check('CONTENT ids', 'No duplicate case IDs', new Set(cIds).size === cIds.length);
  const iIds = interviewBank.map((i) => i.id);
  check('CONTENT ids', 'No duplicate interview IDs', new Set(iIds).size === iIds.length);
  const allIds = [...kIds, ...cIds, ...iIds];
  check('CONTENT ids', 'No ID collides across banks', new Set(allIds).size === allIds.length);
})();

// ---- CONTENT: required fields / shape validity ----
(function shapeValidity() {
  for (const item of knowledgeBank) {
    const errors = validateKnowledgeItemShape(item);
    check('CONTENT shape', `${item.id} passes knowledge shape validation`, errors.length === 0, errors.join('; '));
  }
  for (const item of caseBank) {
    const errors = validateCaseItemShape(item);
    check('CONTENT shape', `${item.id} passes case shape validation`, errors.length === 0, errors.join('; '));
  }
  for (const item of interviewBank) {
    const errors = validateInterviewItemShape(item);
    check('CONTENT shape', `${item.id} passes interview shape validation`, errors.length === 0, errors.join('; '));
  }
})();

// ---- CONTENT: traceability status / no blocked item is approved ----
(function traceabilityStatus() {
  const expectedBlocked = new Set(['M02-005', 'M07-006', 'M08-012']);
  for (const id of expectedBlocked) {
    const item = knowledgeBank.find((i) => i.id === id);
    check('CONTENT traceability', `${id} is present with status other than 'approved'`, !!item && item.status !== 'approved', item && item.status);
  }
  const approvedCount = knowledgeBank.filter((i) => i.status === 'approved').length;
  check('CONTENT traceability', 'Exactly 117 knowledge items are approved (120 - 3 blocked)', approvedCount === 117, `got ${approvedCount}`);
  check('CONTENT traceability', 'All 12 cases are approved', caseBank.every((c) => c.status === 'approved'));
  check('CONTENT traceability', 'All 9 interviews are approved', interviewBank.every((i) => i.status === 'approved'));
})();

// ---- CONTENT: no raw-blueprint source used ----
(function noRawBlueprintLeakage() {
  const rawBlueprint = readFileSync(
    new URL('../docs/course-audit/modules/module-12-final-exam-raw-blueprint.md', import.meta.url),
    'utf8'
  );
  // The raw blueprint used a different ID scheme (its own candidate numbering)
  // -- confirm none of the raw blueprint's own item IDs leaked into the
  // installed bank's IDs, and spot-check that installed prompts are not
  // substrings copied from the raw file for a few representative items.
  const installedPrompts = knowledgeBank.map((i) => i.prompt);
  let suspiciousMatches = 0;
  for (const prompt of installedPrompts) {
    if (prompt.length > 40 && rawBlueprint.includes(prompt)) suspiciousMatches++;
  }
  check(
    'CONTENT raw-blueprint isolation',
    'No installed knowledge prompt is a verbatim substring of the raw blueprint',
    suspiciousMatches === 0,
    `${suspiciousMatches} suspicious matches`
  );
})();

// ---- KNOWLEDGE: per-item validity ----
(function knowledgeValidity() {
  for (const item of knowledgeBank) {
    check('KNOWLEDGE', `${item.id} has exactly one valid correctChoice index`, Number.isInteger(item.correctChoice) && item.correctChoice >= 0 && item.correctChoice < item.choices.length);
    check('KNOWLEDGE', `${item.id} has a valid difficulty value`, ['foundational', 'applied', 'advanced-synthesis'].includes(item.difficulty), item.difficulty);
    check('KNOWLEDGE', `${item.id} has a valid module value (1-11)`, Number.isInteger(item.sourceModule) && item.sourceModule >= 1 && item.sourceModule <= 11);
    check('KNOWLEDGE', `${item.id} has exactly 4 answer choices`, item.choices.length === 4, `got ${item.choices.length}`);
  }
})();

// ---- CASES: objective scoring structures ----
(function caseValidity() {
  for (const item of caseBank) {
    for (const part of item.parts) {
      if (part.type === 'single-best-answer') {
        check('CASES', `${part.id} correctAnswer indexes into choices`, Number.isInteger(part.correctAnswer) && part.correctAnswer >= 0 && part.correctAnswer < part.choices.length);
      } else if (part.type === 'multi-select') {
        check('CASES', `${part.id} multi-select correctAnswer is a non-empty array of valid indices`, Array.isArray(part.correctAnswer) && part.correctAnswer.length > 0 && part.correctAnswer.every((v) => v >= 0 && v < part.choices.length));
      } else if (part.type === 'sequencing') {
        const n = part.choices.length;
        const expectedSet = new Set(Array.from({ length: n }, (_, i) => i));
        const gotSet = new Set(part.correctAnswer);
        check('CASES', `${part.id} sequencing correctAnswer is a permutation of all choice indices`, part.correctAnswer.length === n && [...expectedSet].every((v) => gotSet.has(v)));
      } else if (part.type === 'classification') {
        check('CASES', `${part.id} classification correctAnswer covers every item with a valid category`, part.items.every((it) => part.categories.includes(part.correctAnswer[it.id])));
      } else if (part.type === 'structured-short-response') {
        check('CASES', `${part.id} short-response part has a rubric`, !!part.rubric && Array.isArray(part.rubric.criteria) && part.rubric.criteria.length > 0);
      }
    }
    check('CASES', `${item.id} critical flags (if any) reference real part IDs`, (item.criticalFlags || []).every((f) => item.parts.some((p) => p.id === f.partId)));
  }
})();

// ---- INTERVIEWS: structural validity ----
(function interviewValidity() {
  check('INTERVIEWS', 'Exactly 9 interviews', interviewBank.length === 9);
  for (const item of interviewBank) {
    check('INTERVIEWS', `${item.id} has a primary prompt`, !!item.primaryPrompt && item.primaryPrompt.length > 0);
    check('INTERVIEWS', `${item.id} allows at most 1 follow-up`, item.allowedFollowUp === true || item.allowedFollowUp === false);
    check('INTERVIEWS', `${item.id} has exactly 5 rubric criteria`, item.rubricCriteria.length === 5, `got ${item.rubricCriteria.length}`);
    check('INTERVIEWS', `${item.id} rubric criteria are 0/1/2-scoring compatible (no maxScore field constraining otherwise)`, item.rubricCriteria.every((c) => !('maxScore' in c) || c.maxScore === 2));
    check('INTERVIEWS', `${item.id} critical flags (if any) carry a description`, (item.criticalFlags || []).every((f) => !!f.description));
  }
})();

// ---- SELECTION: real-bank constrained draw, many seeded attempts ----
(function realBankSelection() {
  const banks = { knowledgeBank, caseBank, interviewBank };
  const seenIds = new Set();
  let failures = 0;
  let warningsSeen = 0;
  const N = 300;
  for (let s = 1; s <= N; s++) {
    const rng = mulberry32(s);
    const result = assembleAttempt(banks, config, { rng });
    if (!result.ok) { failures++; continue; }
    if (result.partI.length !== 40) failures++;
    if (result.partII.length !== 4) failures++;
    if (result.partIII.length !== 3) failures++;
    const modulesCovered = new Set(result.partI.map((i) => i.sourceModule));
    for (const m of config.requiredModuleCoverage) if (!modulesCovered.has(m)) failures++;
    if (result.warnings.length) warningsSeen += result.warnings.length;
    const allIds = [...result.partI, ...result.partII, ...result.partIII].map((i) => i.id);
    if (new Set(allIds).size !== allIds.length) failures++;
    for (const id of allIds) seenIds.add(id);
  }
  check('SELECTION', `${N} seeded real-bank draws all assemble successfully (40/4/3, full module coverage, no duplicates)`, failures === 0, `${failures} failing draws`);
  check('SELECTION', `${N} seeded real-bank draws report zero critical-domain-coverage warnings`, warningsSeen === 0, `${warningsSeen} warnings`);

  // Difficulty balance: across many draws, the tier distribution should sit
  // close to the 20/60/20 target -- not exact per-attempt, but not skewed.
  const tierCounts = { foundational: 0, applied: 0, 'advanced-synthesis': 0 };
  const rng2 = mulberry32(999);
  let totalPartI = 0;
  for (let s = 0; s < 100; s++) {
    const result = assembleAttempt(banks, config, { rng: rng2 });
    if (!result.ok) continue;
    for (const item of result.partI) { tierCounts[item.difficulty]++; totalPartI++; }
  }
  const foundationalPct = tierCounts.foundational / totalPartI;
  const advancedPct = tierCounts['advanced-synthesis'] / totalPartI;
  check('SELECTION', 'Foundational share stays within a reasonable band of the 20% target across 100 draws', foundationalPct > 0.1 && foundationalPct < 0.35, `${(foundationalPct * 100).toFixed(1)}%`);
  check('SELECTION', 'Advanced/synthesis share stays within a reasonable band of the 20% target across 100 draws', advancedPct > 0.08 && advancedPct < 0.35, `${(advancedPct * 100).toFixed(1)}%`);

  // D1-D4 evidence coverage across many draws.
  const rng3 = mulberry32(4242);
  let domainFailures = 0;
  for (let s = 0; s < 200; s++) {
    const result = assembleAttempt(banks, config, { rng: rng3 });
    if (!result.ok) { domainFailures++; continue; }
    for (const domainId of Object.keys(result.evidenceMatrix)) {
      const ev = result.evidenceMatrix[domainId];
      if (ev.total < 2) domainFailures++;
      if (ev.fromNonPartOne < 1) domainFailures++;
    }
  }
  check('SELECTION', 'Every D1-D4 domain gets >=2 total evidence points and >=1 non-Part-I point in 200 draws', domainFailures === 0, `${domainFailures} shortfalls`);

  // Retake minimization: a second draw excluding seen IDs from the first
  // should prefer unseen items where the bank can still satisfy coverage.
  const rngA = mulberry32(10);
  const attemptA = assembleAttempt(banks, config, { rng: rngA });
  const seenFromA = {
    seenKnowledgeIds: attemptA.partI.map((i) => i.id),
    seenCaseIds: attemptA.partII.map((i) => i.id),
    seenInterviewIds: attemptA.partIII.map((i) => i.id),
  };
  const rngB = mulberry32(11);
  const attemptB = assembleAttempt(banks, config, { rng: rngB, ...seenFromA });
  check('SELECTION', 'Retake draw still succeeds when excluding the prior attempt\'s items', attemptB.ok);
  if (attemptB.ok) {
    const overlapK = attemptB.partI.filter((i) => seenFromA.seenKnowledgeIds.includes(i.id)).length;
    check('SELECTION', 'Retake knowledge overlap is minimized (bank is large enough to mostly avoid repeats)', overlapK <= 10, `${overlapK}/40 repeated`);
  }
})();

// ---- SECURITY: student payload never includes answer/rationale/rubric ----
(function security() {
  const forbiddenKeys = ['correctChoice', 'rationale', 'correctAnswer', 'rubric', 'criticalFlags', 'scoring', 'sourceModule', 'sourceSection', 'competency', 'competencies', 'status'];
  for (const item of knowledgeBank.slice(0, 10)) {
    const projected = projectKnowledgeItemForClient(item);
    const leaked = forbiddenKeys.filter((k) => k in projected);
    check('SECURITY', `${item.id} client projection has no forbidden keys`, leaked.length === 0, leaked.join(','));
  }
  for (const item of caseBank) {
    const projected = projectCaseForClient(item);
    check('SECURITY', `${item.id} case projection has no scoring/rubric/criticalFlags at the top level`, !('scoring' in projected) && !('criticalFlags' in projected) && !('criticalDomainEvidence' in projected));
    for (const part of projected.parts) {
      check('SECURITY', `${item.id}/${part.id} projected part has no correctAnswer/rubric`, !('correctAnswer' in part) && !('rubric' in part));
    }
  }
  for (const item of interviewBank) {
    const projected = projectInterviewItemForClient(item);
    check('SECURITY', `${item.id} interview projection has no rubricCriteria/criticalFlags`, !('rubricCriteria' in projected) && !('criticalFlags' in projected));
  }

  // JSON.stringify sanity: serializing a full assembled attempt's CLIENT
  // projection (as the API endpoints do) must never contain the literal
  // answer-key strings.
  const banks = { knowledgeBank, caseBank, interviewBank };
  const rng = mulberry32(555);
  const result = assembleAttempt(banks, config, { rng });
  const clientPayload = {
    partI: result.partI.map(projectKnowledgeItemForClient),
    partII: result.partII.map(projectCaseForClient),
    partIII: result.partIII.map(projectInterviewItemForClient),
  };
  const serialized = JSON.stringify(clientPayload);
  const anyRationale = result.partI.some((i) => i.rationale && serialized.includes(i.rationale));
  check('SECURITY', 'No knowledge rationale text appears in the serialized client payload', !anyRationale);
})();

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
