/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — Education Writer AI client
   ═══════════════════════════════════════════════════════════════ */

import { callEducationOpsModel } from './education-ops-client-base.mjs';
import { EDUCATION_OPS_ROLES } from './education-ops-model-config.mjs';
import { EDUCATION_WRITER_OUTPUT_JSON_SCHEMA } from './education-page-plan-schema.mjs';
import { EDUCATION_WRITER_CONTRACT_VERSION, buildWriterInstruction } from './education-writer-prompt.mjs';

export const WRITER_MAX_TOKENS = 32000;
export const WRITER_EFFORT = 'medium';

/**
 * @param {Object} env - must carry ANTHROPIC_EDUCATION_WRITER_API_KEY
 * @param {Parameters<typeof buildWriterInstruction>[0]} args
 * @returns {Promise<object>} on success, `result.output` carries the
 *   WRITER's own authored fields only (no `sources`/`related_links` --
 *   see EDUCATION_WRITER_OUTPUT_JSON_SCHEMA's header comment). The
 *   orchestrator is responsible for attaching both deterministically
 *   before validation/rendering.
 */
export async function writeEducationPagePlan(env, args) {
  const system = buildWriterInstruction(args);
  const userContent = JSON.stringify({ topic_slug: args.intentPlan.topic_slug, request: 'write_page_plan' });

  const result = await callEducationOpsModel(env, {
    role: EDUCATION_OPS_ROLES.WRITER,
    system,
    userContent,
    schema: EDUCATION_WRITER_OUTPUT_JSON_SCHEMA,
    maxTokens: WRITER_MAX_TOKENS,
    effort: WRITER_EFFORT,
    callLabel: 'EducationWriter',
  });
  if (!result.ok) return result;
  return { ...result, contractVersion: EDUCATION_WRITER_CONTRACT_VERSION };
}
