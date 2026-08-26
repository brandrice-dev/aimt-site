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
} from '../../_lib/certification/scoring.mjs';
import { buildRemediationAssignments } from '../../_lib/certification/attempt-ladder.mjs';

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
  const update = await supabaseRest(env, `certification_attempts?id=eq.${attemptId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'scored',
      overall_score: decisionResult.overallPercent,
      critical_domain_results: criticalDomainResults,
      certification_decision: decisionResult.decision,
      decision_at: nowIso,
    }),
  });
  if (!update.ok) return json({ error: 'Could not finalize the assessment.' }, 500);

  if (decisionResult.decision === 'not_yet_passed') {
    const weakCompetencyAreas = []; // Grouped competency-level remediation content is authored in a later phase.
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
