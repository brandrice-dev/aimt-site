import path from 'node:path';
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, appendFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { repairReviewerEvidenceFailures } from '../functions/_lib/education-ops/education-reviewer-framing-repair.mjs';
import { createHash } from 'node:crypto';
import { runDecisionPipeline, persistRunReport, loadCandidateBundle } from './education-operations-cycle.mjs';
import { fetchPublishedTopicSlugsLive } from '../functions/_lib/education-ops/education-published-state-loader.mjs';
import { createPublicationCostControl } from '../functions/_lib/research/publication-cost-control.mjs';
import { PUBLICATION_CONCEPTS } from '../functions/_lib/education-ops/education-publication-registry.mjs';
import { verifyCandidateBundleIntegrity, determineResumeStage } from '../functions/_lib/education-ops/education-candidate-bundle.mjs';
import { loadTopicAttempt } from './_lib/education-topic-attempts.mjs';
import { executeResearchGap } from './_lib/education-research-gap-executor.mjs';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function classifyRecovery(report) {
  if (report.final_state === 'SHADOW_CANDIDATE_READY') return 'WAIT_PUBLICATION';
  if (report.final_state === 'PUBLISHED') return 'SELECT_NEXT_TOPIC';
  if (/budget|SPEND_LIMIT|TOKEN_LIMIT/.test(report.exception_reason || '') || report.provider_request_diagnostics?.code === 'SPEND_LIMIT') return 'BUDGET_PAUSED';
  if (['CONFIG_BLOCKED', 'PROVIDER_FAILED'].includes(report.final_state)) {
    if (report.provider_request_diagnostics?.http_status === 401 || report.provider_request_diagnostics?.http_status === 403
      || /missing.*key|credential/i.test(report.exception_reason || '')) return 'AUTHORIZATION_REQUIRED';
    return 'RETRY_PROVIDER';
  }
  if (report.final_state === 'INFRA_REVIEW') return 'SAFETY_REVIEW';
  if (['EDITORIAL_REVIEW', 'HUMAN_REVIEW'].includes(report.final_state)) {
    if (report.writer_result?.valid === false) return 'REPAIR_WRITER';
    return 'DEFER_TOPIC';
  }
  if (report.final_state === 'RESEARCH_GAP_QUEUED') return 'RESEARCH';
  if (report.final_state === 'NO_OP_SUCCESS') return 'SELECT_NEXT_TOPIC';
  return 'SAFETY_REVIEW';
}
function atomic(file, value) {
  mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(`${file}.tmp`, JSON.stringify(value, null, 2)); renameSync(`${file}.tmp`, file);
}
export async function runAutonomousCycle(env, overrides = {}) {
  const directory = path.join(ROOT, 'research-import/education-ops/candidates'), file = path.join(directory, 'continuation.json');
  const io = { readState: () => existsSync(file) ? JSON.parse(readFileSync(file)) : null,
    writeState: (value) => atomic(file, value), run: runDecisionPipeline, loadBundle: loadCandidateBundle,
    published: fetchPublishedTopicSlugsLive,
    loadAttempt: (slug) => loadTopicAttempt(directory, slug), research: executeResearchGap, report: persistRunReport, ...overrides };
  if (env.GITHUB_REPOSITORY !== 'brandrice-dev/aimt-site' || env.GITHUB_REF !== 'refs/heads/main') throw new Error('AUTONOMOUS_TRUSTED_MAIN_REQUIRED');
  let state = io.readState();
  if (state && state.version !== 'education-continuation-v1') throw new Error('UNTRUSTED_CONTINUATION_STATE');
  state ||= { version: 'education-continuation-v1', chain_id: env.GITHUB_RUN_ID, executions: 0, cost_control: null,
    deferred: {}, research: {}, history: [], next_action: 'SELECT_NEXT_TOPIC', next_topic: null };
  // No fresh budget from a new run or topic. Seed the first continuation from
  // reservations already paid/reserved by the saved candidate's original run.
  if (!state.cost_control) {
    for (const concept of PUBLICATION_CONCEPTS) {
      const saved = io.loadBundle(concept.topic_slug);
      if (!saved.found) continue;
      if (!saved.bundle || !(await verifyCandidateBundleIntegrity(saved.bundle)).valid) throw new Error('UNVERIFIED_SAVED_CANDIDATE');
      const attempt = io.loadAttempt(concept.topic_slug);
      if (attempt && determineResumeStage(saved.bundle) !== 'READY_FOR_PREPARE' && saved.bundle.review_result?.outcome !== 'FAIL') {
        state.next_topic = concept.topic_slug; state.cost_control = attempt.cost_control || null; break;
      }
    }
  }
  const published = await io.published(env);
  for (const concept of PUBLICATION_CONCEPTS) {
    if (published.includes(concept.topic_slug)) continue;
    const saved=io.loadBundle(concept.topic_slug);
    if (saved.bundle?.page_plan && !saved.bundle.reviewer_framing_repair?.attempted
      && (await verifyCandidateBundleIntegrity(saved.bundle)).valid
      && repairReviewerEvidenceFailures(saved.bundle.page_plan,saved.bundle.fingerprint_input,saved.bundle.review_result).eligible) {
      state.next_topic=concept.topic_slug;delete state.deferred[concept.topic_slug];break;
    }
  }
  if (state.next_topic && published.includes(state.next_topic)) {
    state.next_topic = null; state.next_action = 'SELECT_NEXT_TOPIC';
  }
  while (state.not_before && Date.parse(state.not_before) > Date.now()) {
    await new Promise((resolve) => setTimeout(resolve, Math.min(60000, Date.parse(state.not_before) - Date.now())));
  }
  state.executions++;
  const persist = () => io.writeState(state);
  const cost = createPublicationCostControl({ previous: state.cost_control, persist: (summary) => { state.cost_control = summary; persist(); } });
  persist();
  // Existing request/spend ceiling remains cumulative across this continuation
  // chain, including a topic switch. Free research can still make progress.
  const result = await io.run(env, { continuation: true, costControl: cost, topicSlug: state.next_topic || undefined,
    deferredFingerprints: state.deferred, mode: 'autonomous' });
  const action = classifyRecovery(result);
  state.cost_control = cost.summary();
  state.history.push({ run_id: env.GITHUB_RUN_ID, topic: result.selected_topic, state: result.final_state,
    action, cost_control: state.cost_control, candidate_reused: result.candidate_resume?.reused === true });
  state.next_action = action; state.next_topic = result.selected_topic;
  if (action === 'DEFER_TOPIC') {
    const attempt = io.loadAttempt(result.selected_topic); if (attempt) state.deferred[result.selected_topic] = attempt.fingerprint;
    state.next_topic = null; state.next_action = 'SELECT_NEXT_TOPIC';
  }
  // Preserve clearance freshness: free research excludes the active publication's
  // controlled topics until its current publication completes.
  const exclude = PUBLICATION_CONCEPTS.find((c) => c.topic_slug === result.selected_topic)?.controlled_topics || [];
  try { result.autonomous_research = await io.research(env, state.research, persist, { excludedTopics: exclude }); }
  catch (error) { result.autonomous_research = { state: 'RESEARCH_RETRY', error: error.message.split(':')[0] }; }
  if (result.autonomous_research.state === 'RESEARCH_RETRY' && ['SELECT_NEXT_TOPIC', 'RESEARCH'].includes(state.next_action)) state.next_action = 'RESEARCH';
  const exhausted = state.cost_control.requests >= 6 || state.cost_control.reserved_cost_estimate_usd >= 2;
  if (exhausted && action !== 'WAIT_PUBLICATION') state.next_action = 'BUDGET_PAUSED';
  // Persist a bounded retry/backoff, never a polling storm or a new allowance.
  state.retry_count = action === 'RETRY_PROVIDER' ? (state.retry_count || 0) + 1 : 0;
  if (state.retry_count > 2) state.next_action = 'PROVIDER_RETRY_CEILING';
  if (state.executions >= 12 && state.next_action !== 'BUDGET_PAUSED') state.next_action = 'CONTINUATION_EXECUTION_CEILING';
  state.not_before = new Date(Date.now() + Math.min(60000 * 2 ** state.retry_count, 300000)).toISOString();
  if (state.next_action === 'SELECT_NEXT_TOPIC') state.next_topic = null;
  persist();
  result.autonomous_controller = { version: state.version, chain_id: state.chain_id, executions: state.executions,
    next_action: state.next_action, next_topic: state.next_topic, cost_control: state.cost_control,
    state_sha256: hash(state), governed_publication_authorized: env.AIMT_EDUCATION_AUTOPUBLISH_ENABLED === 'true' };
  io.report(result);
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await runAutonomousCycle(process.env);
  console.log(JSON.stringify({ ...report, __internal: undefined }, null, 2));
  const action = report.autonomous_controller.next_action;
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `continue=${['REPAIR_WRITER','RETRY_PROVIDER','RESEARCH','SELECT_NEXT_TOPIC'].includes(action)}\n`);
}
