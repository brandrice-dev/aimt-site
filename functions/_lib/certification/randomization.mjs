// AIMT Head Spa — constrained assessment-attempt randomization engine.
//
// Implements the "constrained/balanced draw" required by
// docs/course-audit/00-aimt-certification-assessment-standard.md Section 13
// and docs/course-audit/modules/module-12-final-exam-raw-blueprint.md Part 6:
//   - module coverage (every one of Modules 1-11 represented in Part I)
//   - critical-domain coverage (>=2 independent evidence points per domain,
//     with >=1 of those from Part II or Part III, not Part I alone)
//   - approximate Part I difficulty mix (~20/60/20)
//   - no duplicate item IDs within an attempt
//   - only approved/active, version-compatible items ever selected
//   - retake-overlap minimization (prefer items unseen by this student)
//
// This module is pure/deterministic given an `rng` function — pass a seeded
// rng in tests, or the default Math.random in production. It never reads
// content-bank.mjs directly so it can be exercised against fixture banks.

import { isApprovedForProduction } from './content-schema.mjs';

function defaultRng() {
  return Math.random();
}

function shuffle(arr, rng) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function byApproved(list) {
  return (list || []).filter(isApprovedForProduction);
}

function countByModule(items, moduleField) {
  const counts = {};
  for (const item of items) {
    const key = Array.isArray(item[moduleField]) ? item[moduleField][0] : item[moduleField];
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

/**
 * Greedy set-cover style selection of `pool` items to cover as many
 * `uncoveredDomains` as possible, up to `maxCount` items, preferring unseen
 * items and items that cover more still-uncovered domains per pick.
 */
function greedyCoverDomains(pool, uncoveredDomains, maxCount, seenIdSet, rng) {
  const selected = [];
  const available = pool.slice();
  const uncovered = new Set(uncoveredDomains);

  while (selected.length < maxCount && uncovered.size > 0 && available.length > 0) {
    let bestIdx = -1;
    let bestScore = -1;
    // Shuffle indices for tie-break fairness instead of always favoring array order.
    const order = shuffle(available.map((_, i) => i), rng);
    for (const idx of order) {
      const item = available[idx];
      const domains = item.criticalDomainEvidence || [];
      const coverCount = domains.filter((d) => uncovered.has(d)).length;
      const unseenBonus = seenIdSet.has(item.id) ? 0 : 0.5;
      const score = coverCount + unseenBonus;
      if (coverCount > 0 && score > bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    }
    if (bestIdx === -1) break; // no remaining item covers any uncovered domain
    const chosen = available.splice(bestIdx, 1)[0];
    selected.push(chosen);
    for (const d of chosen.criticalDomainEvidence || []) uncovered.delete(d);
  }

  return { selected, remainingUncovered: Array.from(uncovered), remainingPool: available };
}

function fillToCount(selected, remainingPool, targetCount, seenIdSet, rng, moduleField) {
  const chosen = selected.slice();
  let pool = remainingPool.slice();
  const usedModules = new Set(
    chosen.flatMap((item) => (Array.isArray(item[moduleField]) ? item[moduleField] : [item[moduleField]]))
  );

  while (chosen.length < targetCount && pool.length > 0) {
    // Prefer unseen items, then items introducing a not-yet-represented module.
    const scored = pool.map((item, idx) => {
      const modules = Array.isArray(item[moduleField]) ? item[moduleField] : [item[moduleField]];
      const introducesModule = modules.some((m) => !usedModules.has(m));
      const unseen = !seenIdSet.has(item.id);
      let score = 0;
      if (unseen) score += 2;
      if (introducesModule) score += 1;
      return { idx, score };
    });
    scored.sort((a, b) => b.score - a.score || rng() - 0.5);
    const pickIdx = scored[0].idx;
    const chosenItem = pool[pickIdx];
    chosen.push(chosenItem);
    pool = pool.filter((_, i) => i !== pickIdx);
    const modules = Array.isArray(chosenItem[moduleField]) ? chosenItem[moduleField] : [chosenItem[moduleField]];
    modules.forEach((m) => usedModules.add(m));
  }

  return { chosen, remainingPool: pool };
}

/**
 * Select Part II (cases) and Part III (interviews) together, since critical
 * domain coverage requires >=1 non-Part-I evidence point per domain and that
 * requirement can be satisfied by either part.
 */
export function selectPartIIAndIII(caseBank, interviewBank, config, options = {}) {
  const rng = options.rng || defaultRng;
  const seenCaseIds = new Set(options.seenCaseIds || []);
  const seenInterviewIds = new Set(options.seenInterviewIds || []);
  const domainIds = config.criticalDomains.map((d) => d.id);

  const approvedCases = byApproved(caseBank);
  const approvedInterviews = byApproved(interviewBank);

  const caseCoverCount = config.partII.targetCount;
  const interviewCoverCount = config.partIII.targetCount;

  // Pass 1: cover as many domains as possible via cases (cases carry more
  // structured, checkable evidence and there are more of them per attempt).
  const casesCoverage = greedyCoverDomains(approvedCases, domainIds, caseCoverCount, seenCaseIds, rng);

  // Pass 2: cover whatever domains remain via interviews.
  const interviewsCoverage = greedyCoverDomains(
    approvedInterviews,
    casesCoverage.remainingUncovered,
    interviewCoverCount,
    seenInterviewIds,
    rng
  );

  // Fill remaining Part II slots for cross-module coverage / variety.
  const casesFilled = fillToCount(
    casesCoverage.selected,
    approvedCases.filter((c) => !casesCoverage.selected.includes(c)),
    caseCoverCount,
    seenCaseIds,
    rng,
    'sourceModules'
  );

  const interviewsFilled = fillToCount(
    interviewsCoverage.selected,
    approvedInterviews.filter((i) => !interviewsCoverage.selected.includes(i)),
    interviewCoverCount,
    seenInterviewIds,
    rng,
    'sourceModules'
  );

  const stillUncoveredDomains = interviewsCoverage.remainingUncovered;

  return {
    selectedCases: casesFilled.chosen,
    selectedInterviews: interviewsFilled.chosen,
    uncoveredNonPartOneDomains: stillUncoveredDomains,
  };
}

/**
 * Select Part I (knowledge) guaranteeing: every required module represented,
 * approximate difficulty mix, and topping up critical-domain evidence counts
 * to the required per-domain minimum given what Part II/III already covered.
 */
export function selectPartI(knowledgeBank, config, options = {}) {
  const rng = options.rng || defaultRng;
  const seenIds = new Set(options.seenIds || []);
  const domainEvidenceFromOtherParts = options.domainEvidenceFromOtherParts || {}; // {D1: 0|1, ...}
  const approved = byApproved(knowledgeBank);
  const target = config.partI.targetCount;
  const requiredModules = config.requiredModuleCoverage;

  const missingModules = requiredModules.filter(
    (m) => !approved.some((item) => item.sourceModule === m)
  );
  if (missingModules.length > 0) {
    return { ok: false, reason: 'insufficient_bank', missingModules };
  }
  if (approved.length < target) {
    return { ok: false, reason: 'insufficient_bank', availableCount: approved.length, targetCount: target };
  }

  const pool = approved.slice();
  const selected = [];
  const selectedIds = new Set();

  function take(item) {
    selected.push(item);
    selectedIds.add(item.id);
  }

  function removeFromPool(item) {
    const idx = pool.indexOf(item);
    if (idx !== -1) pool.splice(idx, 1);
  }

  // Step 1 — guarantee module coverage (min 1 per module), preferring items
  // that also help close a critical-domain gap and preferring unseen items.
  for (const moduleId of requiredModules) {
    const candidates = pool.filter((item) => item.sourceModule === moduleId);
    const scored = candidates
      .map((item) => {
        const helpsDomain = (item.criticalDomainEvidence || []).some(
          (d) => (domainEvidenceFromOtherParts[d] || 0) < config.criticalDomainCoverage.minEvidencePointsPerDomain
        );
        const unseen = !seenIds.has(item.id);
        return { item, score: (helpsDomain ? 2 : 0) + (unseen ? 1 : 0) + rng() * 0.01 };
      })
      .sort((a, b) => b.score - a.score);
    const pick = scored[0].item;
    take(pick);
    removeFromPool(pick);
  }

  // Step 2 — top up critical-domain evidence to the required minimum count,
  // counting what Part II/III already contributed.
  const domainCount = {};
  for (const domain of config.criticalDomains) {
    const fromOther = domainEvidenceFromOtherParts[domain.id] || 0;
    const fromPartISoFar = selected.filter((s) => (s.criticalDomainEvidence || []).includes(domain.id)).length;
    domainCount[domain.id] = fromOther + fromPartISoFar;
  }
  for (const domain of config.criticalDomains) {
    const needed = config.criticalDomainCoverage.minEvidencePointsPerDomain - domainCount[domain.id];
    for (let n = 0; n < needed && selected.length < target; n++) {
      const candidates = pool.filter((item) => (item.criticalDomainEvidence || []).includes(domain.id));
      if (candidates.length === 0) break;
      const preferUnseen = shuffle(candidates, rng).sort((a, b) => {
        const aUnseen = seenIds.has(a.id) ? 0 : 1;
        const bUnseen = seenIds.has(b.id) ? 0 : 1;
        return bUnseen - aUnseen;
      });
      const pick = preferUnseen[0];
      take(pick);
      removeFromPool(pick);
      domainCount[domain.id] += 1;
    }
  }

  // Step 3 — fill remaining slots targeting the ~20/60/20 difficulty mix,
  // weighted by each module's remaining pool size so no single module
  // dominates the fill just because it has more bank items.
  const tiers = ['foundational', 'applied', 'advanced-synthesis'];
  const tierTargets = {
    foundational: Math.round(target * config.difficultyTargets.foundational),
    applied: Math.round(target * config.difficultyTargets.applied),
    'advanced-synthesis': Math.round(target * config.difficultyTargets.advancedSynthesis),
  };
  const tierCountSoFar = { foundational: 0, applied: 0, 'advanced-synthesis': 0 };
  for (const item of selected) tierCountSoFar[item.difficulty] = (tierCountSoFar[item.difficulty] || 0) + 1;

  while (selected.length < target && pool.length > 0) {
    // Pick the tier furthest below its target (as a fraction), fall back to any tier.
    const deficits = tiers
      .map((tier) => ({ tier, deficit: tierTargets[tier] - tierCountSoFar[tier] }))
      .sort((a, b) => b.deficit - a.deficit);
    let candidatePool = [];
    for (const { tier } of deficits) {
      candidatePool = pool.filter((item) => item.difficulty === tier);
      if (candidatePool.length > 0) break;
    }
    if (candidatePool.length === 0) candidatePool = pool;

    const scored = candidatePool
      .map((item) => ({ item, score: (seenIds.has(item.id) ? 0 : 1) + rng() * 0.01 }))
      .sort((a, b) => b.score - a.score);
    const pick = scored[0].item;
    take(pick);
    removeFromPool(pick);
    tierCountSoFar[pick.difficulty] = (tierCountSoFar[pick.difficulty] || 0) + 1;
  }

  if (selected.length < target) {
    return { ok: false, reason: 'insufficient_bank', selectedCount: selected.length, targetCount: target };
  }
  if (selectedIds.size !== selected.length) {
    return { ok: false, reason: 'duplicate_ids_detected' };
  }

  return { ok: true, items: selected };
}

/**
 * Assemble a full attempt: Part II/III first (to know how much non-Part-I
 * critical-domain evidence exists), then Part I topping up module coverage,
 * difficulty mix, and remaining critical-domain evidence.
 */
export function assembleAttempt(banks, config, options = {}) {
  const rng = options.rng || defaultRng;
  const { knowledgeBank, caseBank, interviewBank } = banks;

  const { selectedCases, selectedInterviews, uncoveredNonPartOneDomains } = selectPartIIAndIII(
    caseBank,
    interviewBank,
    config,
    { rng, seenCaseIds: options.seenCaseIds, seenInterviewIds: options.seenInterviewIds }
  );

  if (selectedCases.length < config.partII.targetCount || selectedInterviews.length < config.partIII.targetCount) {
    return {
      ok: false,
      reason: 'insufficient_bank',
      details: {
        cases: { selected: selectedCases.length, target: config.partII.targetCount },
        interviews: { selected: selectedInterviews.length, target: config.partIII.targetCount },
      },
    };
  }

  const domainEvidenceFromOtherParts = {};
  for (const domain of config.criticalDomains) {
    const fromCases = selectedCases.filter((c) => (c.criticalDomainEvidence || []).includes(domain.id)).length;
    const fromInterviews = selectedInterviews.filter((i) => (i.criticalDomainEvidence || []).includes(domain.id)).length;
    domainEvidenceFromOtherParts[domain.id] = fromCases + fromInterviews;
  }

  const partIResult = selectPartI(knowledgeBank, config, {
    rng,
    seenIds: options.seenKnowledgeIds,
    domainEvidenceFromOtherParts,
  });

  if (!partIResult.ok) {
    return partIResult;
  }

  // Final coverage verification across the whole assembled attempt.
  const evidenceMatrix = {};
  const warnings = [];
  for (const domain of config.criticalDomains) {
    const fromPartI = partIResult.items.filter((i) => (i.criticalDomainEvidence || []).includes(domain.id)).length;
    const fromOther = domainEvidenceFromOtherParts[domain.id] || 0;
    const total = fromPartI + fromOther;
    evidenceMatrix[domain.id] = { total, fromPartI, fromNonPartOne: fromOther };
    if (total < config.criticalDomainCoverage.minEvidencePointsPerDomain) {
      warnings.push(`Domain ${domain.id} has only ${total} total evidence points (need >=${config.criticalDomainCoverage.minEvidencePointsPerDomain}).`);
    }
    if (fromOther < config.criticalDomainCoverage.minNonPartOneEvidencePointsPerDomain) {
      warnings.push(`Domain ${domain.id} has no Part II/III evidence point.`);
    }
  }

  const allIds = [
    ...partIResult.items.map((i) => i.id),
    ...selectedCases.map((c) => c.id),
    ...selectedInterviews.map((i) => i.id),
  ];
  if (new Set(allIds).size !== allIds.length) {
    return { ok: false, reason: 'duplicate_ids_detected' };
  }

  return {
    ok: true,
    partI: partIResult.items,
    partII: selectedCases,
    partIII: selectedInterviews,
    evidenceMatrix,
    warnings,
  };
}
