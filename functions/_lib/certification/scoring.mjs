// AIMT Head Spa — certification scoring + critical-domain gate engine.
//
// Pure, deterministic functions only. Nothing here calls Cadence/Anthropic —
// callers (functions/api/certification/*.js) resolve any AI-evaluated
// judgment (structured-short-response case parts, interview rubric criteria)
// externally via cadence-grader.mjs and pass the STRUCTURED result in here.
// This keeps the actual pass/fail arithmetic testable without network calls
// and keeps "Cadence evaluates, AIMT rules decide" (standard Section 3) a
// real code boundary, not just a policy statement.
//
// Critical-domain gating implements standard Section 5.2 exactly:
//   - a single missed multiple-choice question tagged as domain evidence
//     NEVER by itself fails a domain — it only ever contributes an ordinary
//     evidence point (see scoreKnowledgeResponses: no explicitUnsafe/pattern
//     tag is ever derived from a bare wrong answer unless the content item
//     itself defines a distractorPatternTags entry for the chosen distractor,
//     and even then that only ever contributes to a Type B *count*, never a
//     Type A trigger by itself).
//   - Type A (explicit unsafe reasoning) can only be set by a case/interview
//     evaluator's structured output, driven by a human-authored rubric.
//   - Type B (repeated pattern) requires >= domain.typeBThreshold independent
//     evidence points sharing the same patternTag.

function average(numbers) {
  if (!numbers.length) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

// ---- Part I — Knowledge & Retention ----

/**
 * @param {import('./content-schema.mjs').KnowledgeItem[]} selectedItems - full items (server-side only; never sent to client)
 * @param {Object<string, number>} responses - itemId -> chosen choice index
 */
export function scoreKnowledgeResponses(selectedItems, responses) {
  const perItem = selectedItems.map((item) => {
    const chosen = responses ? responses[item.id] : undefined;
    const correct = chosen === item.correctChoice;
    const patternTag =
      !correct && item.distractorPatternTags && Object.prototype.hasOwnProperty.call(item.distractorPatternTags, chosen)
        ? item.distractorPatternTags[chosen]
        : null;
    return {
      id: item.id,
      correct,
      criticalDomainEvidence: item.criticalDomainEvidence || [],
      patternTag,
      source: 'partI',
    };
  });
  const correctCount = perItem.filter((p) => p.correct).length;
  const total = selectedItems.length;
  const percent = total ? correctCount / total : 0;

  const evidencePoints = [];
  for (const p of perItem) {
    for (const domainId of p.criticalDomainEvidence) {
      evidencePoints.push({
        domainId,
        source: 'partI',
        itemId: p.id,
        explicitUnsafe: false, // Part I MCQs can never trigger Type A — see file header.
        patternTag: p.patternTag,
      });
    }
  }

  return { percent, correctCount, total, perItem, evidencePoints };
}

// ---- Part II — Applied Practitioner Cases ----

function scoreDeterministicPart(part, response) {
  switch (part.type) {
    case 'single-best-answer':
      return response === part.correctAnswer ? 1 : 0;
    case 'multi-select': {
      const expected = new Set(part.correctAnswer || []);
      const got = new Set(response || []);
      if (expected.size !== got.size) return 0;
      for (const v of expected) if (!got.has(v)) return 0;
      return 1;
    }
    case 'sequencing': {
      const expected = part.correctAnswer || [];
      const got = response || [];
      if (expected.length !== got.length) return 0;
      return expected.every((v, i) => v === got[i]) ? 1 : 0;
    }
    default:
      return null; // structured-short-response resolved externally
  }
}

/**
 * @param {import('./content-schema.mjs').CaseItem} caseDef
 * @param {Object<string, *>} response - partId -> student response
 * @param {Object} [options]
 * @param {Object<string, {correctnessScore:number, explicitUnsafe?:boolean, patternTag?:string|null}>} [options.cadenceEvaluatedParts]
 *   Required for any part whose type is 'structured-short-response'.
 */
export function scoreCaseSubmission(caseDef, response, options = {}) {
  const cadenceEvaluatedParts = options.cadenceEvaluatedParts || {};
  const weights = (caseDef.scoring && caseDef.scoring.weights) || caseDef.parts.map(() => 1);

  const partResults = caseDef.parts.map((part) => {
    if (part.type === 'structured-short-response') {
      const ce = cadenceEvaluatedParts[part.id] || { correctnessScore: 0, explicitUnsafe: false, patternTag: null };
      return {
        partId: part.id,
        correctnessScore: ce.correctnessScore,
        explicitUnsafe: !!ce.explicitUnsafe,
        patternTag: ce.patternTag || null,
      };
    }
    const deterministicScore = scoreDeterministicPart(part, (response || {})[part.id]);
    const flag = (caseDef.criticalFlags || []).find(
      (f) => f.partId === part.id && f.triggerType === 'choiceEquals' && JSON.stringify(f.value) === JSON.stringify((response || {})[part.id])
    );
    return {
      partId: part.id,
      correctnessScore: deterministicScore,
      explicitUnsafe: !!flag,
      patternTag: flag ? flag.patternTag || null : null,
    };
  });

  const weightedSum = partResults.reduce((sum, pr, idx) => sum + (pr.correctnessScore || 0) * (weights[idx] || 1), 0);
  const weightTotal = weights.reduce((a, b) => a + b, 0);
  const percent = weightTotal ? weightedSum / weightTotal : 0;

  const anyExplicitUnsafe = partResults.some((pr) => pr.explicitUnsafe);
  const firstPatternTag = (partResults.find((pr) => pr.patternTag) || {}).patternTag || null;

  const evidencePoints = (caseDef.criticalDomainEvidence || []).map((domainId) => ({
    domainId,
    source: 'partII',
    itemId: caseDef.id,
    explicitUnsafe: anyExplicitUnsafe,
    patternTag: firstPatternTag,
  }));

  return { caseId: caseDef.id, percent, partResults, evidencePoints };
}

export function computeAppliedCasesComponent(caseResults) {
  return { percent: average(caseResults.map((c) => c.percent)), caseResults };
}

// ---- Part III — Practitioner Conversation with Cadence ----

/**
 * @param {import('./content-schema.mjs').InterviewItem} interviewDef
 * @param {Object<string, number>} criterionScores - criterionId -> 0|1|2
 * @param {Object<string, {explicitUnsafe?:boolean, patternTag?:string|null}>} [evaluatorFlags] - keyed by domainId
 */
export function scoreInterviewConversation(interviewDef, criterionScores, evaluatorFlags = {}) {
  const criteria = interviewDef.rubricCriteria;
  const maxPoints = criteria.length * 2;
  const earned = criteria.reduce((sum, c) => sum + (Number(criterionScores ? criterionScores[c.id] : 0) || 0), 0);
  const percent = maxPoints ? earned / maxPoints : 0;

  const domainsTouched = new Set(criteria.flatMap((c) => c.criticalDomainEvidence || []));
  const evidencePoints = Array.from(domainsTouched).map((domainId) => {
    const flag = evaluatorFlags[domainId] || {};
    return {
      domainId,
      source: 'partIII',
      itemId: interviewDef.id,
      explicitUnsafe: !!flag.explicitUnsafe,
      patternTag: flag.patternTag || null,
    };
  });

  return { interviewId: interviewDef.id, percent, earned, maxPoints, evidencePoints };
}

/**
 * Converts a persisted Part III conversation-state record (as stored by
 * functions/api/certification/submit-interview-turn.js) into the
 * evaluatorFlags shape scoreInterviewConversation() expects.
 * @param {{explicitUnsafeDomains?:string[], patternTags?:Object<string,string>}} conversationState
 */
export function interviewEvaluatorFlagsFromState(conversationState) {
  const flags = {};
  const explicitUnsafeDomains = new Set(conversationState.explicitUnsafeDomains || []);
  const patternTags = conversationState.patternTags || {};
  const domains = new Set([...explicitUnsafeDomains, ...Object.keys(patternTags)]);
  for (const domainId of domains) {
    flags[domainId] = {
      explicitUnsafe: explicitUnsafeDomains.has(domainId),
      patternTag: patternTags[domainId] || null,
    };
  }
  return flags;
}

export function computeInterviewComponent(interviewResults) {
  return { percent: average(interviewResults.map((r) => r.percent)), interviewResults };
}

// ---- Component + overall weighting ----

export function computeOverallWeighted({ knowledgePercent, appliedCasesPercent, interviewPercent }, weights) {
  return knowledgePercent * weights.knowledge + appliedCasesPercent * weights.appliedCases + interviewPercent * weights.interview;
}

// ---- Critical-domain gate evaluation (standard Section 5.2) ----

/**
 * @param {Array<{domainId:string, source:string, itemId:string, explicitUnsafe:boolean, patternTag:string|null}>} allEvidencePoints
 * @param {import('./critical-domains.mjs').CriticalDomain[]} domainConfigs
 */
export function evaluateCriticalDomains(allEvidencePoints, domainConfigs) {
  return domainConfigs.map((domain) => {
    const points = allEvidencePoints.filter((e) => e.domainId === domain.id);
    const typeATrigger = points.find((e) => e.explicitUnsafe === true) || null;

    const patternCounts = {};
    for (const e of points) {
      if (e.patternTag) patternCounts[e.patternTag] = (patternCounts[e.patternTag] || 0) + 1;
    }
    const typeBTag = Object.keys(patternCounts).find((tag) => patternCounts[tag] >= domain.typeBThreshold) || null;

    const cleared = !typeATrigger && !typeBTag;
    return {
      domainId: domain.id,
      cleared,
      failureType: typeATrigger ? 'explicit_unsafe_reasoning' : typeBTag ? 'repeated_pattern' : null,
      evidenceCount: points.length,
      triggeringEvidence: typeATrigger ? [typeATrigger] : typeBTag ? points.filter((e) => e.patternTag === typeBTag) : [],
    };
  });
}

// ---- Final certification decision — independent gates, no compensation ----

/**
 * @param {Object} params
 * @param {number} params.knowledgePercent
 * @param {number} params.appliedCasesPercent
 * @param {number} params.interviewPercent
 * @param {Array<{domainId:string, cleared:boolean}>} params.criticalDomainResults
 * @param {import('./assessment-config.mjs').AssessmentConfig} params.config
 */
export function determineCertificationDecision(params) {
  const { knowledgePercent, appliedCasesPercent, interviewPercent, criticalDomainResults, config } = params;
  const overallPercent = computeOverallWeighted(
    { knowledgePercent, appliedCasesPercent, interviewPercent },
    config.weights
  );

  const gates = {
    overall: overallPercent >= config.minimums.overall,
    knowledge: knowledgePercent >= config.minimums.knowledge,
    appliedCases: appliedCasesPercent >= config.minimums.appliedCases,
    interview: interviewPercent >= config.minimums.interview,
    criticalDomains: criticalDomainResults.every((d) => d.cleared),
  };

  const decision = Object.values(gates).every(Boolean) ? 'pass' : 'not_yet_passed';

  return { decision, overallPercent, gates };
}
