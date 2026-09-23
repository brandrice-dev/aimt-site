#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   AIMT Publication Editor v1 — shadow-mode CLI report
   ---------------------------------------------------------------
   Runs the pure readiness engine (functions/_lib/research/
   publication-readiness.mjs) against the pilot topic/publication
   concepts (functions/_lib/research/publication-readiness-loader.mjs
   #PILOT_TOPIC_CONCEPTS) and writes a machine-readable JSON report
   plus a human-readable Markdown summary.

   SHADOW MODE / READ-ONLY GUARANTEE:
     - Live mode issues GET requests only (PostgREST SELECT via the
       Supabase service role key), never POST/PATCH/DELETE.
     - This script never writes to research_claims, research_sources,
       research_public_pages, or any other table.
     - Nothing here sets AIMT_APPROVED / public_eligible / published.
     - No schedule, cron, or Pages Function wraps this -- it is a
       manually invoked local CLI only.

   Usage:
     node scripts/research-publication-editor-shadow.mjs
       [--live]                 fetch from live Supabase (requires
                                 SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
                                 in env; explicit owner go-ahead expected
                                 before using this flag)
       [--export-dir <dir>]     local validated export to read instead
                                 of --live (default: the committed
                                 2026-09-20 export under research-import/)
       [--out-dir <dir>]        where to write the two report files
                                 (default: research-import/)
   ═══════════════════════════════════════════════════════════════ */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PILOT_TOPIC_CONCEPTS,
  selectTopicEvidenceFromRows,
  loadExportFromDisk,
  fetchTopicEvidenceLive
} from '../functions/_lib/research/publication-readiness-loader.mjs';
import { assessTopicReadiness } from '../functions/_lib/research/publication-readiness.mjs';

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

function fmtList(arr) {
  return arr.length ? arr.join(', ') : 'none';
}

function requirementsToBecomeReady(result) {
  const asks = [];
  if (result.readiness_status === 'READY') return ['Already READY under v1 rules.'];
  if (result.risk_tier === 'HIGH') {
    asks.push('Human editorial review of HIGH-risk framing -- this tier is never auto-READY in v1 regardless of corroboration.');
  }
  if (result.conflict_flags.includes('SAFETY_CONCLUSION_PRESENT')) {
    asks.push('Human synthesis of the safety_conclusion claim(s) into practitioner-scope-safe language.');
  }
  if (result.conflict_flags.includes('POTENTIAL_CONFLICT_REQUIRES_SYNTHESIS')) {
    asks.push('Human synthesis reconciling verified findings that disagree on effect direction (supports_effect vs no_effect).');
  }
  if (result.conflict_flags.includes('CANDIDATE_CLAIMS_FLAGGED_NEEDS_REVIEW')) {
    asks.push('Resolve the claim(s) already flagged use_status=needs_review before considering this topic further.');
  }
  if (result.evidence_gaps.includes('no_verified_substantive_claim')) {
    asks.push('At least one CLAIM_VERIFIED finding or recommendation claim (not just limitations/method notes).');
  }
  if (result.evidence_gaps.includes('insufficient_source_corroboration')) {
    asks.push(`At least ${result.metrics.required_distinct_sources} distinct verified sources (currently ${result.metrics.distinct_source_count}).`);
  }
  if (result.evidence_gaps.includes('missing_higher_tier_evidence_for_moderate_topic')) {
    asks.push('At least one systematic_review/meta_analysis/clinical_guideline/RCT source, or a professional-consensus source (professional_org evidence_type or guideline source_role).');
  }
  if (result.evidence_gaps.includes('missing_limitations_context')) {
    asks.push('At least one CLAIM_VERIFIED limitation claim captured for this topic.');
  }
  if (result.evidence_gaps.includes('missing_citation_metadata')) {
    asks.push('Complete citation metadata (title, year/date, and a doi/url/pmid/pmcid) for every candidate source.');
  }
  return asks.length ? asks : ['No further deterministic gap identified; hold for owner discretion.'];
}

function buildMarkdown({ generatedAt, mode, results }) {
  const lines = [];
  lines.push('# AIMT Publication Editor v1 — Shadow-Mode Topic Readiness Report');
  lines.push('');
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Data source: ${mode}`);
  lines.push('');
  lines.push('**This is a shadow-mode / dry-run report.** Nothing in this document has changed any '
    + 'research_claims, research_sources, or research_public_pages row. `READY` / `NOT_READY` / '
    + '`NEEDS_REVIEW` below are this engine\'s own reporting labels -- they do not set, and are not the '
    + 'same as, AIMT_APPROVED, public_eligible, or published. See docs/research/AIMT-Publication-Editor-v1.md.');
  lines.push('');

  const counts = { READY: 0, NOT_READY: 0, NEEDS_REVIEW: 0 };
  for (const r of results) counts[r.result.readiness_status] += 1;
  lines.push('## Summary');
  lines.push('');
  lines.push(`| READY | NOT_READY | NEEDS_REVIEW |`);
  lines.push(`|---|---|---|`);
  lines.push(`| ${counts.READY} | ${counts.NOT_READY} | ${counts.NEEDS_REVIEW} |`);
  lines.push('');

  for (const { concept, result } of results) {
    lines.push(`## ${result.topic_slug}`);
    lines.push('');
    lines.push(`**Proposed SEO page concept:** ${concept.seo_page_concept}`);
    lines.push('');
    lines.push(`**Underlying research topic(s):** ${fmtList(concept.controlled_topics)} _(${concept.mapping_type})_`);
    if (concept.mapping_rationale) {
      lines.push('');
      lines.push(`> ${concept.mapping_rationale}`);
    }
    lines.push('');
    lines.push(`**Readiness status:** \`${result.readiness_status}\``);
    lines.push('');
    lines.push(`**Risk tier:** \`${result.risk_tier}\``);
    lines.push('');
    lines.push('**Evidence snapshot:**');
    lines.push(`- Total claims considered (any status, matching topic): ${result.metrics.total_claims_considered}`);
    lines.push(`- Candidate CLAIM_VERIFIED-or-higher claims: ${result.metrics.candidate_claim_count}`);
    lines.push(`- Distinct supporting sources: ${result.metrics.distinct_source_count} (need ${result.metrics.required_distinct_sources}+)`);
    lines.push(`- Evidence-type distribution: ${JSON.stringify(result.metrics.evidence_type_distribution)}`);
    lines.push(`- Systematic-tier evidence present (systematic_review/meta_analysis/clinical_guideline/RCT): ${result.metrics.systematic_tier_evidence_present}`);
    lines.push(`- Professional-consensus source present: ${result.metrics.professional_consensus_present}`);
    lines.push('');
    lines.push(`**Conflict flags:** ${fmtList(result.conflict_flags)}`);
    lines.push(`**Missing evidence/context:** ${fmtList(result.evidence_gaps)}`);
    lines.push('');
    lines.push('**Reasons:**');
    for (const reason of result.reasons) lines.push(`- ${reason}`);
    lines.push('');
    lines.push('**What would be required to become READY:**');
    for (const ask of requirementsToBecomeReady(result)) lines.push(`- ${ask}`);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

async function loadConceptEvidence(concept, args) {
  if (args.live) {
    return fetchTopicEvidenceLive(process.env, concept.controlled_topics);
  }
  if (!existsSync(args.exportDir)) {
    throw new Error(`Export dir not found: ${args.exportDir}. Pass --export-dir or use --live.`);
  }
  const { claims, sources } = loadExportFromDisk(args.exportDir);
  return selectTopicEvidenceFromRows(concept.controlled_topics, { claims, sources });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.live && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env. Refusing to run --live.');
    process.exit(1);
  }

  const mode = args.live ? `LIVE Supabase (read-only SELECT)` : `local export: ${path.relative(ROOT, args.exportDir)}`;
  console.log(`=== AIMT Publication Editor v1 — shadow-mode run ===`);
  console.log(`mode: ${mode}`);

  const results = [];
  for (const concept of PILOT_TOPIC_CONCEPTS) {
    const { claims, sources } = await loadConceptEvidence(concept, args);
    const result = assessTopicReadiness({
      topic_slug: concept.topic_slug,
      controlled_topics: concept.controlled_topics,
      claims,
      sources
    });
    results.push({ concept, result });
    console.log(`  [${result.readiness_status}] ${concept.topic_slug} (risk=${result.risk_tier}, sources=${result.metrics.distinct_source_count}, candidates=${result.metrics.candidate_claim_count})`);
  }

  const generatedAt = new Date().toISOString();
  const jsonReport = {
    generated_at: generatedAt,
    mode,
    shadow_mode: true,
    write_operations_performed: 0,
    engine_version: 'publication-readiness-v1',
    results: results.map(({ concept, result }) => ({
      topic_slug: result.topic_slug,
      seo_page_concept: concept.seo_page_concept,
      controlled_topics: concept.controlled_topics,
      mapping_type: concept.mapping_type,
      mapping_rationale: concept.mapping_rationale || null,
      risk_tier: result.risk_tier,
      readiness_status: result.readiness_status,
      reasons: result.reasons,
      metrics: result.metrics,
      conflict_flags: result.conflict_flags,
      evidence_gaps: result.evidence_gaps,
      requirements_to_become_ready: requirementsToBecomeReady(result),
      candidate_claim_ids: result.candidate_claim_ids,
      candidate_source_ids: result.candidate_source_ids
    }))
  };

  if (!existsSync(args.outDir)) mkdirSync(args.outDir, { recursive: true });
  const jsonPath = path.join(args.outDir, `publication-editor-shadow-report-${generatedAt.slice(0, 10)}.json`);
  const mdPath = path.join(args.outDir, `publication-editor-shadow-report-${generatedAt.slice(0, 10)}.md`);
  writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
  writeFileSync(mdPath, buildMarkdown({ generatedAt, mode, results }));

  console.log(`\nWrote:\n  ${path.relative(ROOT, jsonPath)}\n  ${path.relative(ROOT, mdPath)}`);
  console.log('\nShadow-mode guarantee: 0 database writes performed by this run.');
}

main().catch((err) => {
  console.error('Publication Editor shadow run failed:', err);
  process.exit(1);
});
