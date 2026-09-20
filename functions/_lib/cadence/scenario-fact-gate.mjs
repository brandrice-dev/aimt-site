// Ask Cadence — narrow Zone B scenario-fact safety gate.
//
// Root cause: the prompt-only scenario-fact-integrity rule
// (ASK_CADENCE_BASE_GUARDRAIL) was not sufficient on its own. A live
// retest (docs/course-audit/cadence-sonnet5-chat-final-case13-raw.json)
// showed Cadence still stating invented findings ("diffuse shedding
// without patchiness or scalp irritation") as fact and using them to
// support an actionable recommendation ("supports proceeding with
// standard scalp care") -- the same failure mode the prompt rule had
// already targeted, still slipping through under live conditions.
//
// This module is deliberately narrow, per the owner's explicit
// architectural direction: Zone A (ordinary tutoring) is untouched --
// single generation, no verifier, no extra model call, no gating of any
// kind. This machinery only engages when a response contains actionable
// Zone B guidance (a proceed/modify/refer-style recommendation or
// similar practice-authority conclusion) AND that guidance turns out to
// depend on a scenario fact nobody actually supplied. It is not a general
// factual-correctness checker, not a personality scorer, and not a
// course-grounding-of-every-sentence pass -- see
// SCENARIO_FACT_VERIFIER_INSTRUCTION below for the verifier's exact,
// narrow scope.
//
// No new Cadence model role. The verifier resolves and calls
// CADENCE_CHAT_MODEL -- the exact same role/model already generating the
// response being checked -- so it never drifts out of sync with whatever
// model Chat is actually using, and never couples Chat's lifecycle to
// Grading's approval status (a real risk: CADENCE_GRADING_MODEL happens
// to be Sonnet 5 today, but tying a Chat safety mechanism to Grading's
// own promotion/rollback decisions would be exactly the kind of
// "confusing lifecycle semantics" this task was told to avoid).

import { extractAnthropicTextSafe, fetchAnthropicMessages } from './anthropic-response.mjs';

// modelInfo/execConfig are passed in by the caller (askCadenceServerSide in
// ask-cadence.mjs) rather than re-resolved here: ask-cadence.mjs already
// resolves CADENCE_CHAT_MODEL and its execution config once, for the
// primary generation call, and this file must never import back from
// ask-cadence.mjs (that would make the two files circularly dependent,
// since ask-cadence.mjs imports this file to run the gate). Accepting
// them as parameters also guarantees the verifier always checks against
// the exact same model that generated the response -- never a second,
// independently-resolved lookup that could in principle disagree.

// ─────────────────────────────────────────────────────────────────────────
// STAGE 1 — deterministic, cheap trigger. Broad by design: false positives
// just cost one extra verification call; false negatives let unsafe
// guidance straight through, which is the actual risk this gate exists to
// close. Centered on AIMT's own proceed/modify/refer decision framework
// (used across Modules 5/6/9) plus adjacent action/recommendation
// language, NOT on Zone B topics in the abstract -- a student asking "why
// does shedding show up later" or "what does this term mean" produces a
// purely explanatory answer that will not match any of these patterns,
// exactly as required.
// ─────────────────────────────────────────────────────────────────────────
const ACTIONABLE_GUIDANCE_PATTERN = new RegExp(
  [
    '\\bproceed\\b', '\\brefer(ral| out| them| the client)?\\b', '\\bmodify(ing)? (the |your )?service\\b',
    '\\bcontraindicat', '\\bdo not (use|proceed|continue|perform)\\b', '\\bshould not\\b', '\\bavoid (using|performing)\\b',
    '\\bdiscontinue\\b', '\\bstop the service\\b', '\\bsafe to (continue|proceed)\\b', '\\bappropriate to (continue|proceed)\\b',
    '\\brecommend(s|ed|ing)?\\b', '\\badvise\\b', '\\byou should\\b', "\\bit's (best|safest) to\\b", '\\bgo ahead and\\b',
    '\\bhold off on\\b', '\\bsupports proceeding\\b', '\\breferral signal\\b', '\\breferral situation\\b',
  ].join('|'),
  'i'
);

/**
 * Cheap, deterministic first pass: does this response contain actionable
 * Zone B guidance at all? Ordinary explanatory answers never reach the
 * verifier -- this is what keeps Zone A tutoring at plain
 * generation-then-delivery, with zero extra latency or model calls.
 */
export function detectActionableZoneBGuidance(responseText) {
  return ACTIONABLE_GUIDANCE_PATTERN.test(String(responseText || ''));
}

// ─────────────────────────────────────────────────────────────────────────
// STAGE 2 — narrow LLM verification, only reached when stage 1 triggers.
// ─────────────────────────────────────────────────────────────────────────

// Deliberately small and single-purpose -- not general factual
// correctness, not personality, not "does every sentence trace to
// supplied context" (that is Zone A/B's job, already handled by the
// prompt). Conditional language and clarifying questions are explicitly
// carved out as NOT invented facts, matching the task's own SAFE
// examples, so the verifier does not over-flag normal hedged tutoring.
const SCENARIO_FACT_VERIFIER_INSTRUCTION =
  'You are checking exactly one thing: whether the ASSISTANT RESPONSE below states a specific student/client/business/scenario detail as an established fact that was NOT actually provided anywhere in the conversation, and uses that invented fact to support actionable practice guidance (a proceed/modify/refer-style recommendation, a contraindication call, a sanitation/process instruction, or a similar practice-authority conclusion). ' +
  'This is not a check on general factual correctness, tone, personality, or whether every sentence traces to supplied course material -- ordinary educational explanation, conceptual inference, and reasonable hedged or conditional language are all expected and fine, and are never grounds for supported:false on their own. ' +
  'Conditional language ("if there is no patchiness, then...") and clarifying questions ("is there any irritation?") are NOT invented facts even when they name a specific possible finding -- only a direct assertion that a finding IS or IS NOT present, when the conversation never actually said so, counts as unsupported. ' +
  'Return supported:true when every scenario-specific fact behind the guidance was actually supplied by the student or the visible conversation, or when the guidance does not depend on any unstated fact. Return supported:false only when an actual invented scenario fact is being used to justify the guidance.';

const SCENARIO_FACT_VERIFICATION_SCHEMA = {
  type: 'object',
  properties: {
    supported: { type: 'boolean' },
  },
  required: ['supported'],
  additionalProperties: false,
};

// Small, judgment-bounded classification task -- not a deep evaluation
// (unlike grading's 4096) and not a free-text generation (unlike chat's
// 2048), but sized generously enough to avoid the exact truncation defect
// already root-caused twice this build (grading Step 107, chat Step 111)
// for an under-provisioned budget competing with Sonnet 5's default
// adaptive thinking.
const SCENARIO_VERIFICATION_MAX_TOKENS = 1536;

/** Same defensive-parse shape as checkpoint grading's parser (direct
 * parse, then one fenced ```json fallback, else fail safe) -- duplicated
 * rather than imported, preserving this file's zero import dependency on
 * checkpoint-evaluation.mjs (grading and chat stay fully decoupled, the
 * same invariant already enforced elsewhere in this codebase's tests). */
function parseScenarioVerdict(rawText) {
  const trimmed = String(rawText || '').trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed.supported === 'boolean') return parsed;
  } catch (_) { /* fall through */ }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      const parsed = JSON.parse(fenced[1]);
      if (parsed && typeof parsed.supported === 'boolean') return parsed;
    } catch (_) { /* fall through */ }
  }
  return null;
}

function formatConversationForVerifier(boundedContext, studentMessage) {
  const turns = [...(boundedContext || []), { role: 'user', content: studentMessage }];
  return turns.map((t) => `${t.role === 'user' ? 'Student' : 'Cadence'}: ${t.content}`).join('\n');
}

/**
 * Isolated verifier call. Returns { supported: true|false|null } --
 * `null` means verification itself could not be completed (network
 * failure, malformed/truncated structured output). Callers must treat
 * `null` as fail-closed (the same as `false`, never as `true`): a safety
 * gate that cannot confirm support must not silently assume it.
 *
 * `modelInfo`/`execConfig` are the same CADENCE_CHAT_MODEL resolution and
 * Chat-role thinking/effort config the caller already resolved for the
 * primary generation call (see resolveChatExecutionConfig in
 * ask-cadence.mjs) -- this call reuses them rather than re-resolving, with
 * a JSON-schema structured-output constraint layered on top for a small,
 * reliable verdict shape.
 */
export async function verifyScenarioFactsForActionableGuidance(env, { modelInfo, execConfig, boundedContext, studentMessage, responseText }) {
  if (!env.ANTHROPIC_API_KEY || !modelInfo || !execConfig) return { supported: null };
  const body = {
    model: modelInfo.modelName,
    max_tokens: SCENARIO_VERIFICATION_MAX_TOKENS,
    system: SCENARIO_FACT_VERIFIER_INSTRUCTION,
    messages: [{
      role: 'user',
      content: 'CONVERSATION:\n' + formatConversationForVerifier(boundedContext, studentMessage) +
        '\n\nASSISTANT RESPONSE TO CHECK:\n' + String(responseText || ''),
    }],
  };
  if (execConfig.thinking) body.thinking = execConfig.thinking;
  body.output_config = { ...(execConfig.outputConfig || {}), format: { type: 'json_schema', schema: SCENARIO_FACT_VERIFICATION_SCHEMA } };

  let data;
  try {
    data = await fetchAnthropicMessages({ apiKey: env.ANTHROPIC_API_KEY, body });
  } catch (_) {
    return { supported: null };
  }
  if (data && data.stop_reason === 'max_tokens') return { supported: null };
  const verdict = parseScenarioVerdict(extractAnthropicTextSafe(data));
  return { supported: verdict ? verdict.supported : null };
}

// ─────────────────────────────────────────────────────────────────────────
// STAGE 3 — one controlled regeneration, same voice, generic instruction
// (never quotes the rejected draft back into the prompt; never a compliance
// disclaimer).
// ─────────────────────────────────────────────────────────────────────────
export const SCENARIO_FACT_REGENERATION_INSTRUCTION =
  'Your previous answer to this exact message stated a student/client/business/scenario detail as fact that was not actually provided in this conversation, and used it to support your guidance. Answer again: keep the useful explanation and your normal voice, but do not assume any missing client or scenario finding. Where a missing fact matters to your recommendation, either use conditional language ("if there is no X, then...") or ask the student directly what is actually present. Do not add a generic compliance disclaimer, and do not flatten the answer into something cold or robotic -- just do not invent the client in front of you.';

// ─────────────────────────────────────────────────────────────────────────
// STAGE 4 — deterministic safe fallback. No third model call. Generic on
// purpose (not scenario-specific) so it never risks inventing anything
// itself; still on-voice and still moves the conversation forward by
// asking what's actually there.
// ─────────────────────────────────────────────────────────────────────────
export const SAFE_SCENARIO_FALLBACK_TEXT =
  "I want to make sure I'm not assuming anything about this specific situation that you haven't actually told me. Before I can walk through what that means for your next step, what are you actually seeing (or not seeing) — is there any patchiness, irritation, or other flag present, or is it just the shedding pattern itself?";

/**
 * Structured, boolean/enum-only observability record for one Ask Cadence
 * turn -- no verifier reasoning text, no rejected draft, nothing that
 * wasn't already a simple flag. Logged via console.info (Cloudflare
 * Pages Functions captures this in tail/logs) so production evidence of
 * how often this safeguard actually activates exists without adding a
 * new database table or touching aimt_logs (that table's schema and
 * usage are entitlement/payment-flow-specific -- out of scope here).
 */
export function logScenarioGateEvent(gate) {
  console.info('[cadence-scenario-gate]', {
    zoneBTriggered: !!gate.zoneBTriggered,
    unsupportedFactFound: !!gate.unsupportedFactFound,
    regenerated: !!gate.regenerated,
    outcome: gate.outcome || 'original',
    model: (gate.modelInfo && gate.modelInfo.modelName) || null,
  });
}
