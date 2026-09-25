/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — Education Reviewer AI client
   ═══════════════════════════════════════════════════════════════ */

import { callEducationOpsModel } from './education-ops-client-base.mjs';
import { EDUCATION_OPS_ROLES } from './education-ops-model-config.mjs';
import { REVIEWER_OUTPUT_JSON_SCHEMA, REVIEWER_CONTRACT_VERSION, buildReviewerInstruction } from './education-reviewer-schema.mjs';

export const REVIEWER_MAX_TOKENS = 16000;
export const REVIEWER_EFFORT = 'medium';

/**
 * @param {Object} env - must carry ANTHROPIC_EDUCATION_WRITER_API_KEY
 * @param {Parameters<typeof buildReviewerInstruction>[0]} args
 */
export async function reviewEducationPagePlan(env, args) {
  const system = buildReviewerInstruction(args);
  const userContent = JSON.stringify({ topic_slug: args.plan.topic_slug, request: 'review_page_plan' });

  const result = await callEducationOpsModel(env, {
    role: EDUCATION_OPS_ROLES.REVIEWER,
    system,
    userContent,
    schema: REVIEWER_OUTPUT_JSON_SCHEMA,
    maxTokens: REVIEWER_MAX_TOKENS,
    effort: REVIEWER_EFFORT,
    callLabel: 'EducationReviewer',
  });
  if (!result.ok) return result;
  return { ...result, contractVersion: REVIEWER_CONTRACT_VERSION };
}
