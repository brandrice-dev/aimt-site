/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — intent-planner AI client
   ═══════════════════════════════════════════════════════════════ */

import { callEducationOpsModel } from './education-ops-client-base.mjs';
import { EDUCATION_OPS_ROLES } from './education-ops-model-config.mjs';
import { INTENT_PLAN_JSON_SCHEMA, INTENT_PLAN_CONTRACT_VERSION, buildIntentPlanningInstruction } from './education-intent-planner-schema.mjs';

export const INTENT_PLANNER_MAX_TOKENS = 8000;
export const INTENT_PLANNER_EFFORT = 'medium';

/**
 * @param {Object} env - must carry ANTHROPIC_EDUCATION_WRITER_API_KEY
 * @param {Parameters<typeof buildIntentPlanningInstruction>[0]} args
 */
export async function planPageIntent(env, args) {
  const system = buildIntentPlanningInstruction(args);
  const userContent = JSON.stringify({ topic_slug: args.topicSlug, request: 'plan_page_intent' });

  const result = await callEducationOpsModel(env, {
    role: EDUCATION_OPS_ROLES.INTENT_PLANNER,
    system,
    userContent,
    schema: INTENT_PLAN_JSON_SCHEMA,
    maxTokens: INTENT_PLANNER_MAX_TOKENS,
    effort: INTENT_PLANNER_EFFORT,
    callLabel: 'IntentPlanning',
  });
  if (!result.ok) return result;
  return { ...result, contractVersion: INTENT_PLAN_CONTRACT_VERSION };
}
