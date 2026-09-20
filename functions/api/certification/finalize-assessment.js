/* ═══════════════════════════════════════════════════════════════
   Finalize a Module 12 attempt: compute the weighted overall score,
   evaluate all four critical-domain gates, determine the certification
   decision, and — if not yet passed — generate grouped remediation
   assignments. Idempotent: re-calling after scoring just returns the
   existing decision rather than re-scoring.
   ---------------------------------------------------------------
   POST /api/certification/finalize-assessment
   Headers: Authorization: Bearer <supabase access token>
   Body: { attemptId }
   ═══════════════════════════════════════════════════════════════ */

import { json, hasSupabaseEnv, resolveUser, supabaseRest, COURSE_SLUG } from '../../_lib/certification/auth.mjs';
import { getCurrentAssessmentConfig } from '../../_lib/certification/assessment-config.mjs';
import { getProductionBanks } from '../../_lib/certification/content-bank.mjs';
import {
  scoreKnowledgeResponses,
  evaluateCriticalDomains,
  determineCertificationDecision,
  scoreInterviewConversation,
  interviewEvaluatorFlagsFromState,
} from '../../_lib/certification/scoring.mjs';
import { buildRemediationAssignments, collectWeakCompetencyAreas } from '../../_lib/certification/attempt-ladder.mjs';
import { casPatchSucceeded } from '../../_lib/cadence/turn-lock.mjs';

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!hasSupabaseEnv(env)) return json({ error: 'Misconfigured' }, 500);

  const { user, errorResponse } = await resolveUser(env, request);
  if (errorResponse) return errorResponse;

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ error: 'Invalid request body.' }, 400);
  }
  const { attemptId } = body || {};
  if (!attemptId) return json({ error: 'Invalid request.' }, 400);

  const params = new URLSearchParams({ select: '*', id: `eq.${attemptId}`, user_id: `eq.${user.id}`, limit: '1' });
  const res = await supabaseRest(env, `certification_attempts?${params}`);
  if (!res.ok || !Array.isArray(res.body) || !res.body.length) return json({ error: 'Attempt not found.' }, 404);
  const attempt = res.body[0];

  if (attempt.status === 'scored') {
    return json({ alreadyScored: true, decision: attempt.certification_decision, overallScore: attempt.overall_score });
  }
  if (attempt.status !== 'part3_locked') {
    return json({ error: 'All three parts must be submitted before finalizing.' }, 409);
  }

  const config = getCurrentAssessmentConfig();
  const banks = getProductionBanks();

  // Recompute Part I evidence points from the authoritative stored responses
  // (never trusting a client-submitted score).
  const knowledgeItems = (attempt.part1_selected_ids || []).map((id) => banks.knowledgeBank.find((k) => k.id === id)).filter(Boolean);
  const knowledgeResult = scoreKnowledgeResponses(knowledgeItems, attempt.part1_responses || {});

  const caseEvidencePoints = Object.values(attempt.part2_case_state || {}).flatMap((cs) => cs.evidencePoints || []);

  // Part III evidence points were computed at finalization time inside
  // submit-interview-turn.js's component-score step; reconstruct them here
  // from the same stored state for the authoritative record.
  const banksInterviewIds = attempt.part3_selected_ids || [];
  const interviewEvidencePoints = banksInterviewIds.flatMap((id) => {
    const def = banks.interviewBank.find((i) => i.id === id);
    const cs = (attempt.part3_conversation_state || {})[id];
    if (!def || !cs) return [];
    const domains = new Set([...(cs.explicitUnsafeDomains || []), ...Object.keys(cs.patternTags || {})]);
    return Array.from(domains).map((domainId) => ({
      domainId,
      source: 'partIII',
      itemId: id,
      explicitUnsafe: (cs.explicitUnsafeDomains || []).includes(domainId),
      patternTag: (cs.patternTags || {})[domainId] || null,
    }));
  });

  const allEvidencePoints = [...knowledgeResult.evidencePoints, ...caseEvidencePoints, ...interviewEvidencePoints];
  const criticalDomainResults = evaluateCriticalDomains(allEvidencePoints, config.criticalDomains);

  const decisionResult = determineCertificationDecision({
    knowledgePercent: attempt.knowledge_score,
    appliedCasesPercent: attempt.applied_cases_score,
    interviewPercent: attempt.interview_score,
    criticalDomainResults,
    config,
  });

  const nowIso = new Date().toISOString();
  // Atomically claim the part3_locked -> scored transition: this PATCH only
  // applies if status still equals what we read above, so two concurrent
  // finalize-assessment calls for the same attempt (a double-click, a
  // client retry) can never both "win" -- one commits the decision, the
  // other's conditional filter matches zero rows and is told to defer to
  // the winner below, rather than each inserting its own remediation rows.
  const finalizeParams = new URLSearchParams({ id: `eq.${attemptId}`, status: 'eq.part3_locked' });
  const update = await supabaseRest(env, `certification_attempts?${finalizeParams}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      status: 'scored',
      overall_score: decisionResult.overallPercent,
      critical_domain_results: criticalDomainResults,
      certification_decision: decisionResult.decision,
      decision_at: nowIso,
    }),
  });
  if (!update.ok) return json({ error: 'Could not finalize the assessment.' }, 500);
  if (!casPatchSucceeded(update)) {
    // A concurrent finalize-assessment call already won this exact
    // transition between our read above and this write. Both requests
    // recompute the identical decision from the same already-locked
    // component data (never trusting a client-submitted score), so there is
    // nothing to reconcile -- re-read the now-authoritative row instead of
    // risking a duplicate remediation-assignment insert below.
    const refetchParams = new URLSearchParams({ select: 'certification_decision,overall_score', id: `eq.${attemptId}`, user_id: `eq.${user.id}`, limit: '1' });
    const refetch = await supabaseRest(env, `certification_attempts?${refetchParams}`);
    const row = refetch.ok && Array.isArray(refetch.body) && refetch.body.length ? refetch.body[0] : null;
    return json({
      alreadyScored: true,
      decision: row ? row.certification_decision : decisionResult.decision,
      overallScore: row ? row.overall_score : decisionResult.overallPercent,
    });
  }

  if (decisionResult.decision === 'not_yet_passed') {
    // Grouped, competency-level recommended-review areas — never one row per
    // missed item, never the item's prompt/choices/correct-answer/rationale.
    // Each "weak spot" below is reduced to only a competency label + the
    // source module(s) it comes from before collectWeakCompetencyAreas()
    // dedupes it; the specific question/case-part/interview-criterion that
    // produced it is never carried forward into the remediation record.
    const weakSpots = [];

    const knowledgeItemsById = {};
    for (const item of knowledgeItems) knowledgeItemsById[item.id] = item;
    for (const p of knowledgeResult.perItem) {
      if (p.correct) continue;
      const item = knowledgeItemsById[p.id];
      if (item) weakSpots.push({ competency: item.competency, sourceModules: [item.sourceModule], sectionRef: item.sourceSection });
    }

    const caseState = attempt.part2_case_state || {};
    for (const caseId of attempt.part2_selected_ids || []) {
      const cs = caseState[caseId];
      if (!cs || cs.score == null || cs.score >= config.minimums.appliedCases) continue;
      const def = banks.caseBank.find((c) => c.id === caseId);
      if (!def) continue;
      for (const competency of def.competencies || []) {
        weakSpots.push({ competency, sourceModules: def.sourceModules, sectionRef: null });
      }
    }

    // Recomputed from stored criterionScores (never trusting a client-
    // submitted score, same principle as Part I above) purely to identify
    // which conversations scored below the interview minimum for review
    // purposes — this does not change the interview_score already stored
    // at submit-interview-turn.js finalization time.
    const interviewState = attempt.part3_conversation_state || {};
    for (const interviewId of banksInterviewIds) {
      const cs = interviewState[interviewId];
      if (!cs || !cs.finalized) continue;
      const def = banks.interviewBank.find((i) => i.id === interviewId);
      if (!def) continue;
      const flags = interviewEvaluatorFlagsFromState(cs);
      const result = scoreInterviewConversation(def, cs.criterionScores || {}, flags);
      if (result.percent >= config.minimums.interview) continue;
      for (const competency of def.competencies || []) {
        weakSpots.push({ competency, sourceModules: def.sourceModules, sectionRef: null });
      }
    }

    const weakCompetencyAreas = collectWeakCompetencyAreas(weakSpots);
    const assignments = buildRemediationAssignments({ criticalDomainResults, weakCompetencyAreas }).map((a) => ({
      ...a,
      user_id: user.id,
      course_slug: COURSE_SLUG,
      attempt_id: attemptId,
    }));
    if (assignments.length > 0) {
      await supabaseRest(env, 'certification_remediation_assignments', {
        method: 'POST',
        body: JSON.stringify(assignments),
      });
    }
  }

  return json({
    alreadyScored: false,
    decision: decisionResult.decision,
    overallScore: decisionResult.overallPercent,
    componentScores: {
      knowledge: attempt.knowledge_score,
      appliedCases: attempt.applied_cases_score,
      interview: attempt.interview_score,
    },
    criticalDomainResults: criticalDomainResults.map((d) => ({ domainId: d.domainId, cleared: d.cleared })),
  });
}
