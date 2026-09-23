#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   AIMT Publication Editor v2 — shadow-mode synthesis pilot (hair-cycle)
   ---------------------------------------------------------------
   Orchestrates the full v2 pipeline for exactly ONE topic (hair-cycle,
   per this task's explicit scope):

     1. load hair-cycle evidence (live Supabase or local export)
     2. run Publication Editor v1 (assessTopicReadiness)
     3. confirm the result is NEEDS_SYNTHESIS
     4. take v1's synthesis_packet
     5. resolve the full verified claim text / source evidence bundle
     6. call the AI Publication Editor (Anthropic, structured output)
     7. run the deterministic post-synthesis validator
     8. report AUTO_READY / HUMAN_REVIEW / SYNTHESIS_FAILED

   SHADOW MODE / READ-ONLY GUARANTEE:
     - Live mode issues GET requests only against Supabase (same
       fetchTopicEvidenceLive() v1 already uses) -- never a write.
     - The Anthropic call is the only network write-shaped request this
       script makes, and it writes nothing to any AIMT system -- it only
       returns a proposal this script then validates and reports.
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

   Requires ANTHROPIC_API_KEY in env to actually call the AI Publication
   Editor. Without it, the pipeline still runs through v1 and reports
   SYNTHESIS_FAILED (missing_api_key) for step 6 onward -- this is the
   correct STEP 12 fail-safe behavior, not a crash.
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
import { synthesizeTopic } from '../functions/_lib/research/publication-synthesis-client.mjs';
import { validateSynthesisOutput, determineShadowDisposition, POST_SYNTHESIS_VALIDATOR_VERSION } from '../functions/_lib/research/publication-synthesis-validator.mjs';
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

function explainDirectionSplit(v1Result, aiCallResult) {
  const dist = v1Result.metrics.finding_direction_distribution || {};
  const supportsCount = dist.supports_effect || 0;
  const noEffectCount = dist.no_effect || 0;
  const base = `v1 observed ${supportsCount} supports_effect and ${noEffectCount} no_effect verified finding claim(s) for hair-cycle.`;
  if (!aiCallResult || !aiCallResult.ok) {
    return `${base} Synthesis did not complete (${aiCallResult ? aiCallResult.reason : 'no attempt'}), so no evidence-grounded explanation is available yet -- this remains an open question pending a successful synthesis run.`;
  }
  const signals = (aiCallResult.output.resolved_synthesis_signals || [])
    .filter((s) => (s.claim_ids || []).some((id) => v1Result.metrics.finding_direction_detail.some((d) => d.claim_id === id)));
  if (!signals.length) {
    return `${base} The synthesis output did not explicitly address this signal (see resolved_synthesis_signals) -- treat as unresolved.`;
  }
  return `${base} Synthesis resolution: ${signals.map((s) => `${s.resolution} (claims: ${s.claim_ids.join(', ')})`).join(' | ')}`;
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
  console.log('=== AIMT Publication Editor v2 — shadow-mode synthesis pilot (hair-cycle) ===');
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

  // STEP 6: AI synthesis call.
  const aiCallResult = await synthesizeTopic(process.env, { topic_slug: TOPIC_SLUG, evidenceBundle });
  let validation = null;
  let disposition;
  if (!aiCallResult.ok) {
    console.log(`[v2] synthesis call did not succeed: ${aiCallResult.reason} (${aiCallResult.detail || 'no detail'})`);
    disposition = determineShadowDisposition({ v1Result, callFailed: true, callFailureReason: aiCallResult.reason });
    report.ai_call = { ok: false, reason: aiCallResult.reason, detail: aiCallResult.detail };
  } else {
    console.log(`[v2] synthesis call succeeded (model=${aiCallResult.modelInfo.modelName}, status=${aiCallResult.modelInfo.status})`);
    // STEP 7: deterministic post-synthesis validation.
    validation = validateSynthesisOutput({ v1Result, evidenceBundle, aiOutput: aiCallResult.output });
    disposition = determineShadowDisposition({ v1Result, callFailed: false, aiOutput: aiCallResult.output, validation });
    report.ai_call = {
      ok: true,
      model: { provider: aiCallResult.modelInfo.provider, model_name: aiCallResult.modelInfo.modelName, status: aiCallResult.modelInfo.status, registry_version: aiCallResult.modelInfo.registryVersion },
      contract_version: aiCallResult.contractVersion,
      output: aiCallResult.output,
    };
    report.validation = validation;
  }

  report.v2_outcome = disposition;
  report.direction_split_explanation = explainDirectionSplit(v1Result, aiCallResult);

  console.log(`\n[v2] FINAL RESULT: ${disposition.status} (${disposition.reason})`);
  if (disposition.violations) console.log(`  violations: ${disposition.violations.join(', ')}`);
  console.log(`\n${report.direction_split_explanation}`);

  // STEP 10: page evidence brief, only for AUTO_READY.
  if (disposition.status === 'AUTO_READY') {
    const pageIntent = getPageSynthesisIntent(TOPIC_SLUG);
    const brief = buildPageEvidenceBrief({
      v1Result,
      pageIntent,
      evidenceBundle,
      aiOutput: aiCallResult.output,
      modelInfo: aiCallResult.modelInfo,
      validatorVersion: POST_SYNTHESIS_VALIDATOR_VERSION,
    });
    report.page_evidence_brief = brief;
    console.log(`\n[v2] Page evidence brief generated: ${brief.approved_for_draft_claim_ids.length} approved claims, ${brief.source_ids.length} sources, ${brief.core_factual_points.length} core points.`);
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
