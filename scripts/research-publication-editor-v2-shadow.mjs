#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   AIMT Publication Editor v2.1 — shadow-mode synthesis pilot (hair-cycle)
   ---------------------------------------------------------------
   Orchestrates the full bounded v2.1 pipeline for exactly ONE topic
   (hair-cycle, per this task's explicit scope):

     1. load hair-cycle evidence (live Supabase or local export)
     2. run Publication Editor v1 (assessTopicReadiness)
     3. confirm the result is NEEDS_SYNTHESIS
     4. take v1's synthesis_packet
     5. resolve the full verified claim text / source evidence bundle
     6. run the bounded synthesis pipeline (initial synthesis ->
        targeted reconciliation if only accounting is broken -> one
        bounded full retry if reconciliation found a material change)
     7. report AUTO_READY / HUMAN_REVIEW / SYNTHESIS_FAILED plus the
        full narrative of what happened at each stage

   SHADOW MODE / READ-ONLY GUARANTEE:
     - Live mode issues GET requests only against Supabase (same
       fetchTopicEvidenceLive() v1 already uses) -- never a write.
     - The Anthropic calls (1-3 of them: initial, optional
       reconciliation, optional bounded retry) are the only network
       write-shaped requests this script makes, and they write nothing
       to any AIMT system -- they only return proposals this script
       then validates and reports.
     - Nothing here sets AIMT_APPROVED / public_eligible / published,
       creates a research_public_pages row, or publishes anything.
     - AUTO_READY / HUMAN_REVIEW / SYNTHESIS_FAILED are SHADOW-ONLY
       labels, never written to any database.
     - All output is a runtime artifact written under gitignored
       research-import/ -- never committed (see docs/research/
       AIMT-Publication-Editor-v1.md's generated-artifact policy).

   Usage:
     node scripts/research-publication-editor-v2-shadow.mjs
       [--live]                 fetch topic evidence from live Supabase
                                 (requires SUPABASE_URL +
                                 SUPABASE_SERVICE_ROLE_KEY; read-only)
       [--export-dir <dir>]     local validated export to read instead
                                 of --live
       [--out-dir <dir>]        where to write the report (default:
                                 research-import/)

   Requires ANTHROPIC_PUBLICATION_EDITOR_API_KEY in env to actually call
   the AI Publication Editor -- a dedicated credential, separate from
   Cadence's own ANTHROPIC_API_KEY, never shared or read from it. Without
   it, the pipeline still runs through v1 and reports SYNTHESIS_FAILED
   (missing_api_key) for step 6 onward -- this is the correct STEP 12
   fail-safe behavior, not a crash.
   ═══════════════════════════════════════════════════════════════ */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PILOT_TOPIC_CONCEPTS,
  selectTopicEvidenceFromRows,
  loadExportFromDisk,
  fetchTopicEvidenceLive,
} from '../functions/_lib/research/publication-readiness-loader.mjs';
import { assessTopicReadiness, READINESS_STATUS } from '../functions/_lib/research/publication-readiness.mjs';
import { buildSynthesisEvidenceBundle, buildPageEvidenceBrief } from '../functions/_lib/research/publication-synthesis-evidence.mjs';
import { runSynthesisPipeline } from '../functions/_lib/research/publication-synthesis-orchestrator.mjs';
import { POST_SYNTHESIS_VALIDATOR_VERSION } from '../functions/_lib/research/publication-synthesis-validator.mjs';
import { getPageSynthesisIntent } from '../functions/_lib/research/publication-page-intent.mjs';

const TOPIC_SLUG = 'hair-cycle'; // hard-scoped for this pilot -- see docs/research/AIMT-Publication-Editor-v2.md

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_EXPORT_DIR = path.join(ROOT, 'research-import/unpacked/aimt-research-library-export-2026-09-20');

function parseArgs(argv) {
  const args = { live: false, exportDir: DEFAULT_EXPORT_DIR, outDir: path.join(ROOT, 'research-import') };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--live') args.live = true;
    else if (argv[i] === '--export-dir') args.exportDir = path.isAbsolute(argv[i + 1]) ? argv[++i] : path.join(ROOT, argv[++i]);
    else if (argv[i] === '--out-dir') args.outDir = path.isAbsolute(argv[i + 1]) ? argv[++i] : path.join(ROOT, argv[++i]);
  }
  return args;
}

async function loadTopicEvidence(concept, args) {
  if (args.live) return fetchTopicEvidenceLive(process.env, concept.controlled_topics);
  if (!existsSync(args.exportDir)) throw new Error(`Export dir not found: ${args.exportDir}. Pass --export-dir or use --live.`);
  const { claims, sources } = loadExportFromDisk(args.exportDir);
  return selectTopicEvidenceFromRows(concept.controlled_topics, { claims, sources });
}

/** Answers "why did the 6 supports_effect / 1 no_effect split happen"
    from whatever the final (post-reconciliation/retry) output actually
    did with those specific claim_ids -- checking BOTH an explicit
    resolved_synthesis_signals entry grouping them AND, since a model may
    instead resolve a split by dispositioning each claim individually
    (each with its own out-of-scope reason) rather than naming one grouped
    signal, each direction-conflicted claim_id's own final selected/
    excluded disposition. A live run surfaced exactly this: the model
    addressed the split entirely through 7 individual EXCLUDED entries,
    with no single resolved_synthesis_signals entry naming all of them
    together -- an earlier version of this function only checked the
    signals array and misreported that as "unresolved" when every one of
    the 7 claims had in fact been explicitly, correctly addressed. */
function explainDirectionSplit(v1Result, pipelineResult) {
  const dist = v1Result.metrics.finding_direction_distribution || {};
  const supportsCount = dist.supports_effect || 0;
  const noEffectCount = dist.no_effect || 0;
  const base = `v1 observed ${supportsCount} supports_effect and ${noEffectCount} no_effect verified finding claim(s) for hair-cycle.`;
  const output = pipelineResult.finalOutput || (pipelineResult.initial && pipelineResult.initial.output);
  if (!output) {
    return `${base} Synthesis did not complete, so no evidence-grounded explanation is available yet -- this remains an open question pending a successful synthesis run.`;
  }

  const directionClaimIds = v1Result.metrics.finding_direction_detail.map((d) => d.claim_id);
  const signals = (output.resolved_synthesis_signals || [])
    .filter((s) => (s.claim_ids || []).some((id) => directionClaimIds.includes(id)));

  const selectedById = new Map((output.selected_claims || []).map((c) => [c.claim_id, c]));
  const excludedById = new Map((output.excluded_claims || []).map((c) => [c.claim_id, c]));
  const perClaimDispositions = directionClaimIds
    .filter((id) => !signals.some((s) => (s.claim_ids || []).includes(id))) // don't double-report ones a grouped signal already covered
    .map((id) => {
      if (excludedById.has(id)) {
        const e = excludedById.get(id);
        return `${id} -> EXCLUDED (${e.reason_code}): ${e.reason}`;
      }
      if (selectedById.has(id)) {
        const s = selectedById.get(id);
        return `${id} -> SELECTED (${s.role}): ${s.reason}`;
      }
      return `${id} -> not found in final selected/excluded claims (unaccounted)`;
    });

  const parts = [];
  if (signals.length) {
    parts.push(`Grouped resolution: ${signals.map((s) => `${s.resolution} (claims: ${s.claim_ids.join(', ')})`).join(' | ')}`);
  }
  if (perClaimDispositions.length) {
    parts.push(`Per-claim resolution: ${perClaimDispositions.join(' | ')}`);
  }
  if (!parts.length) {
    return `${base} Neither a grouped synthesis signal nor an individual claim disposition addressed these claim_ids -- treat as genuinely unresolved.`;
  }
  return `${base} ${parts.join(' ')}`;
}

function summarizeReconciliation(pipelineResult) {
  if (!pipelineResult.reconciliation) return { ran: false };
  const resolutions = pipelineResult.reconciliation.resolutions || [];
  return {
    ran: true,
    missing_claim_count: resolutions.length,
    dispositions: resolutions.map((r) => ({ claim_id: r.claim_id, disposition: r.disposition, materially_changes_existing_synthesis: r.materially_changes_existing_synthesis })),
    any_material_change: resolutions.some((r) => r.materially_changes_existing_synthesis),
    full_retry_required: pipelineResult.stage === 'full_retry',
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const concept = PILOT_TOPIC_CONCEPTS.find((c) => c.topic_slug === TOPIC_SLUG);
  if (!concept) throw new Error(`No PILOT_TOPIC_CONCEPTS entry for "${TOPIC_SLUG}".`);

  if (args.live && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env. Refusing to run --live.');
    process.exit(1);
  }

  const mode = args.live
    ? 'LIVE Supabase production corpus (read-only SELECT via PostgREST -- no writes issued)'
    : `local validated export: ${path.relative(ROOT, args.exportDir)}`;
  console.log('=== AIMT Publication Editor v2.1 — bounded shadow synthesis pilot (hair-cycle) ===');
  console.log(`mode: ${mode}`);

  // STEP 1-2: v1 gate.
  const { claims, sources } = await loadTopicEvidence(concept, args);
  const v1Result = assessTopicReadiness({
    topic_slug: concept.topic_slug,
    seo_page_concept: concept.seo_page_concept,
    controlled_topics: concept.controlled_topics,
    claims,
    sources,
  });
  console.log(`\n[v1] readiness_status=${v1Result.readiness_status} risk_tier=${v1Result.risk_tier} candidates=${v1Result.metrics.candidate_claim_count} sources=${v1Result.metrics.distinct_source_count}`);

  const report = {
    generated_at: new Date().toISOString(),
    mode,
    shadow_mode: true,
    write_operations_performed: 0,
    topic_slug: TOPIC_SLUG,
    v1_result: v1Result,
  };

  if (v1Result.readiness_status !== READINESS_STATUS.NEEDS_SYNTHESIS) {
    console.log(`\nv1 did not return NEEDS_SYNTHESIS (got ${v1Result.readiness_status}) -- nothing for v2 to synthesize. Stopping.`);
    report.v2_outcome = { status: 'NOT_APPLICABLE', reason: `v1 readiness_status was ${v1Result.readiness_status}, not NEEDS_SYNTHESIS` };
    writeReport(args, report);
    return;
  }

  // STEP 3-5: evidence bundle for exactly this packet's candidates.
  const evidenceBundle = buildSynthesisEvidenceBundle(v1Result.synthesis_packet, { claims, sources });
  console.log(`[v2] evidence bundle: ${evidenceBundle.claim_count} claims, ${evidenceBundle.source_count} sources`);
  report.evidence_bundle_summary = { claim_count: evidenceBundle.claim_count, source_count: evidenceBundle.source_count };

  // STEP 6: bounded synthesis pipeline (initial -> reconciliation -> bounded retry).
  const pipelineResult = await runSynthesisPipeline(process.env, { topic_slug: TOPIC_SLUG, v1Result, evidenceBundle });

  if (pipelineResult.initial) {
    console.log(`\n[v2] initial synthesis: recommended_disposition=${pipelineResult.initial.output.recommended_disposition} confidence=${pipelineResult.initial.output.confidence}`);
    console.log(`[v2] initial validator violations: ${pipelineResult.initial.violations.length ? pipelineResult.initial.violations.join(', ') : 'none'}`);
  } else {
    console.log(`\n[v2] initial synthesis call did not succeed (stage=${pipelineResult.stage}, reason=${pipelineResult.reason})`);
  }

  const reconciliationSummary = summarizeReconciliation(pipelineResult);
  if (reconciliationSummary.ran) {
    console.log(`[v2] reconciliation ran: ${reconciliationSummary.missing_claim_count} missing claim(s), material_change=${reconciliationSummary.any_material_change}, full_retry_required=${reconciliationSummary.full_retry_required}`);
  } else {
    console.log('[v2] reconciliation did not run (either not needed, or a substantive/non-repairable violation blocked it, or the initial call itself failed)');
  }

  console.log(`\n[v2] FINAL RESULT: ${pipelineResult.status} (${pipelineResult.reason}) -- stage=${pipelineResult.stage}`);
  if (pipelineResult.violations) console.log(`  final violations: ${pipelineResult.violations.join(', ')}`);

  const directionSplitExplanation = explainDirectionSplit(v1Result, pipelineResult);
  console.log(`\n${directionSplitExplanation}`);

  report.pipeline_result = {
    status: pipelineResult.status,
    reason: pipelineResult.reason,
    stage: pipelineResult.stage,
    violations: pipelineResult.violations || null,
    initial: pipelineResult.initial,
    reconciliation_raw: pipelineResult.reconciliation,
    reconciliation_summary: reconciliationSummary,
    final_output: pipelineResult.finalOutput,
  };
  report.direction_split_explanation = directionSplitExplanation;

  // STEP 10: cost/efficiency metrics -- no API keys, just call/token counts.
  report.cost_metrics = {
    model_calls: pipelineResult.metrics.model_calls,
    reconciliation_calls: pipelineResult.metrics.reconciliation_calls,
    full_retries: pipelineResult.metrics.full_retries,
    total_input_tokens: pipelineResult.metrics.total_input_tokens,
    total_output_tokens: pipelineResult.metrics.total_output_tokens,
    calls: pipelineResult.metrics.calls,
  };
  console.log(`\n[v2] cost metrics: ${report.cost_metrics.model_calls} model call(s) (${report.cost_metrics.reconciliation_calls} reconciliation, ${report.cost_metrics.full_retries} full retry), ${report.cost_metrics.total_input_tokens} input tokens, ${report.cost_metrics.total_output_tokens} output tokens`);

  // STEP 9: page evidence brief, only for a validated AUTO_READY.
  if (pipelineResult.status === 'AUTO_READY') {
    const pageIntent = getPageSynthesisIntent(TOPIC_SLUG);
    const aiOutput = pipelineResult.finalOutput;
    const brief = buildPageEvidenceBrief({
      v1Result,
      pageIntent,
      evidenceBundle,
      aiOutput,
      modelInfo: pipelineResult.metrics.model_info,
      validatorVersion: POST_SYNTHESIS_VALIDATOR_VERSION,
    });
    report.page_evidence_brief = brief;

    const allCandidateIds = new Set(evidenceBundle.claims.map((c) => c.claim_id));
    const accountedIds = new Set([...aiOutput.selected_claims.map((c) => c.claim_id), ...aiOutput.excluded_claims.map((c) => c.claim_id)]);
    const fullyAccounted = allCandidateIds.size === accountedIds.size && [...allCandidateIds].every((id) => accountedIds.has(id));

    console.log(`\n[v2] Page evidence brief generated:`);
    console.log(`  selected=${aiOutput.selected_claims.length} excluded=${aiOutput.excluded_claims.length} (sum=${aiOutput.selected_claims.length + aiOutput.excluded_claims.length}, candidates=${evidenceBundle.claim_count}, fully_accounted=${fullyAccounted})`);
    console.log(`  sources=${brief.source_ids.length} core_points=${brief.core_factual_points.length} limitations=${brief.limitations.length}`);
    console.log(`  citation_map entries=${Object.keys(brief.citation_map).length}`);
    console.log(`  risk_tier=${brief.risk_tier}`);
  }

  writeReport(args, report);
}

function writeReport(args, report) {
  if (!existsSync(args.outDir)) mkdirSync(args.outDir, { recursive: true });
  const suffix = report.mode.startsWith('LIVE') ? '-live' : '';
  const jsonPath = path.join(args.outDir, `publication-editor-v2-shadow-report-${report.generated_at.slice(0, 10)}${suffix}.json`);
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`\nWrote: ${path.relative(ROOT, jsonPath)}`);
  console.log('Shadow-mode guarantee: 0 database writes performed by this run.');
}

main().catch((err) => {
  console.error('Publication Editor v2 shadow run failed:', err);
  process.exit(1);
});
