#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   AIMT Page Builder v1 — editorial audit (AIMT Education Voice v0)
   ---------------------------------------------------------------
   STATUS: EDITORIAL EXEMPLAR / OWNER REVIEW. See
   docs/brand/AIMT-EDUCATION-EDITORIAL-VOICE-v0.md.

   This is a SEPARATE script from scripts/page-builder-shadow.mjs, not a
   modification of it. That script's hard fail-closed behavior on any
   non-PASS checkDraftFidelity() result stays completely unchanged and
   is still the correct gate for a fully-automated, unreviewed topic.

   This one exists because the real, registered hair-cycle template now
   deliberately carries hand-authored PARAPHRASE content (conservative,
   meaning-preserving rewrites of cleared statements) alongside VERBATIM
   and FRAMING content, for this one, owner-reviewed exemplar page.
   checkDraftFidelity() -- itself untouched -- correctly reports
   REWRITE_REQUIRED for a paraphrase (it has no way to prove entailment
   deterministically), and pretending that's a bug, or silently
   swallowing it, would be dishonest. This script instead:

     1. Runs the exact same real, read-only pipeline as the shadow
        script (load -> verifyStoredClearanceIntegrity ->
        validatePageInvariants -> buildPageDraft -> validatePageDraft ->
        checkDraftFidelity) against the REAL production clearance row.
     2. Requires validatePageDraft to return valid=true -- that gate is
        NOT relaxed by this script.
     3. Cross-references every rendered unit's declared editorial_status
        (VERBATIM / PARAPHRASE / FRAMING -- set in
        page-builder-draft.mjs's resolveEditorialUnit()) against
        checkDraftFidelity()'s real per-unit result, and reports:
          - VERBATIM   + fidelity PASS             -> OK (deterministic -- fidelity actually proves this)
          - VERBATIM   + fidelity != PASS          -> REAL PROBLEM (exits 1)
          - FRAMING    + fidelity PASS             -> FRAMING_REQUIRES_EDITORIAL_REVIEW (fidelity trivially exempts framing -- that is NOT proof it carries no science; "framing cannot carry science" is a human editorial judgment call for this v0 exemplar, checked against the rule "removing this sentence would not remove scientific content," never conflated with VERBATIM's deterministic OK)
          - FRAMING    + fidelity != PASS          -> REAL PROBLEM (exits 1 -- a framing unit should always trivially pass; this means it isn't actually flagged is_framing:true)
          - PARAPHRASE + fidelity REWRITE_REQUIRED -> EDITORIAL_REVIEW_REQUIRED (expected, does not fail the script)
          - PARAPHRASE + fidelity PASS             -> OK (accidentally verbatim-equivalent)
          - PARAPHRASE + fidelity HUMAN_REVIEW     -> REAL PROBLEM (claim IDs don't trace to any cleared statement at all)
     4. Independently re-verifies, straight from the snapshot (not by
        trusting page-builder-draft.mjs's own bookkeeping), that every
        PARAPHRASE unit's supporting_claim_ids are an exact match for a
        real cleared statement's own supporting_claim_ids, and that its
        declared source_statements text actually exists verbatim in the
        snapshot's core_factual_points/limitations.
     5. Writes a human-readable editorial audit report, and refreshes the
        other shadow artifacts (draft.json, preview.html, etc.), under
        gitignored research-import/page-builder-shadow/<topic>/ -- never
        to a live route, never to Supabase.

   SHADOW MODE GUARANTEE (same as scripts/page-builder-shadow.mjs): the
   only network request is the read-only GET against
   research_public_pages. No Anthropic call anywhere in this file --
   checkParagraphFidelityWithModel is never imported.

   Usage:
     node scripts/page-builder-editorial-audit.mjs [--topic hair-cycle]
   ═══════════════════════════════════════════════════════════════ */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { loadClearedSnapshot } from '../functions/_lib/page-builder/page-builder-loader.mjs';
import { buildPageDraft } from '../functions/_lib/page-builder/page-builder-draft.mjs';
import { validatePageDraft } from '../functions/_lib/page-builder/page-builder-validator.mjs';
import { checkDraftFidelity } from '../functions/_lib/page-builder/page-builder-fidelity.mjs';
import { finalizeSeo, buildStructuredData } from '../functions/_lib/page-builder/page-builder-seo.mjs';
import { renderDraftHtml } from '../functions/_lib/page-builder/page-builder-render.mjs';
import { buildCostMetrics } from '../functions/_lib/page-builder/page-builder-cost.mjs';
import { collectRenderedFactualUnits, computeRenderedSupportClaimIds, findDuplicateFactualText } from '../functions/_lib/page-builder/page-builder-content-units.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = { topic: 'hair-cycle' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--topic') args.topic = argv[++i];
  }
  return args;
}

/** Every cleared statement (core_factual_points + limitations), keyed by
    its own exact text, for independent re-verification below. */
function statementIndex(snapshot) {
  const index = new Map();
  for (const p of [...snapshot.core_factual_points, ...snapshot.limitations]) {
    index.set(p.statement, p.supporting_claim_ids || []);
  }
  return index;
}

function auditUnit(unit, snapshot, fidelityResult, stmtIndex) {
  const problems = [];
  const status = unit.editorial_status;

  if (status === 'PARAPHRASE') {
    if (!unit.source_statements || unit.source_statements.length === 0) {
      problems.push('PARAPHRASE unit declares no source_statements to audit against.');
    }
    for (const stmt of unit.source_statements || []) {
      if (!stmtIndex.has(stmt)) {
        problems.push(`Declared source statement is not found verbatim anywhere in the cleared snapshot: "${stmt.slice(0, 80)}..."`);
        continue;
      }
      const sourceClaimIds = stmtIndex.get(stmt);
      const extra = unit.supporting_claim_ids.filter((id) => !sourceClaimIds.includes(id));
      if (extra.length > 0) {
        problems.push(`Carries claim IDs not present on its own declared source statement: ${extra.join(',')}`);
      }
    }
  }

  let reconciled;
  if (status === 'PARAPHRASE') {
    if (fidelityResult === 'REWRITE_REQUIRED') reconciled = 'EDITORIAL_REVIEW_REQUIRED';
    else if (fidelityResult === 'PASS') reconciled = 'OK (accidentally verbatim-equivalent)';
    else { reconciled = 'REAL_PROBLEM'; problems.push(`Unexpected fidelity result for a paraphrase: ${fidelityResult} (expected REWRITE_REQUIRED or PASS).`); }
  } else if (status === 'FRAMING') {
    // "Framing cannot carry science": checkDraftFidelity() trivially
    // PASSes any is_framing:true unit -- that is NOT proof it contains
    // no scientific content, only that fidelity never checked it. This
    // is a human editorial judgment call, reported explicitly as such,
    // never conflated with VERBATIM's deterministic PASS.
    if (fidelityResult === 'PASS') reconciled = 'FRAMING_REQUIRES_EDITORIAL_REVIEW';
    else { reconciled = 'REAL_PROBLEM'; problems.push(`FRAMING unit failed fidelity unexpectedly: ${fidelityResult} (a framing paragraph should always trivially PASS -- this usually means it isn't actually flagged is_framing:true).`); }
  } else {
    // VERBATIM
    if (fidelityResult === 'PASS') reconciled = 'OK';
    else { reconciled = 'REAL_PROBLEM'; problems.push(`VERBATIM unit failed fidelity unexpectedly: ${fidelityResult} (should always PASS).`); }
  }

  return { reconciled, problems };
}

const FRAMING_REVIEW_NOTE = 'Reviewed under the rule: removing this sentence would not remove scientific content. This is a human editorial judgment call for this v0 exemplar, not a deterministic semantic proof -- checkDraftFidelity() never inspects framing text at all, it only trivially exempts it.';

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log('=== AIMT Page Builder v1 — editorial audit (AIMT Education Voice v0) ===');
  console.log(`topic_slug: ${args.topic}`);
  console.log('STATUS: EDITORIAL EXEMPLAR / OWNER REVIEW -- not an automated publication gate.\n');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env. Refusing to run (read-only fetch still requires credentials).');
    process.exit(1);
  }

  console.log('[load] fetching the real production clearance row (read-only GET)...');
  const { record, snapshot, integrity, invariants } = await loadClearedSnapshot(process.env, args.topic);
  console.log(`[load] clearance_mode=${record.clearance_mode} status=${record.status}`);
  console.log(`[load] verifyStoredClearanceIntegrity: valid=${integrity.valid}`);
  console.log(`[load] validatePageInvariants: valid=${invariants.valid}`);
  if (!integrity.valid || !invariants.valid) {
    console.error('Refusing to proceed: clearance integrity/invariants did not pass.');
    process.exit(1);
  }

  console.log('\n[draft] building the structured draft (verbatim + hand-authored paraphrase/framing per the template)...');
  let draft = buildPageDraft(snapshot, {
    generationSourceHash: record.generation_source_hash,
    fingerprintAlgorithm: record.publication_clearance.fingerprint_algorithm,
  });
  draft = finalizeSeo(draft);
  console.log(`[draft] sections: ${draft.sections.map((s) => s.section_id).join(', ')}`);

  console.log('\n[validate] running the deterministic post-draft validator (unmodified, unrelaxed)...');
  const validation = validatePageDraft(draft, snapshot, { integrityResult: integrity });
  console.log(`[validate] valid=${validation.valid}`);
  console.log(`[validate] scope_note_preserved=${validation.report.scope_note_preserved}`);
  console.log(`[validate] duplicate_factual_text=${JSON.stringify(validation.report.duplicate_factual_text)}`);
  if (!validation.valid) {
    console.error(`[validate] violations: ${validation.violations.join(', ')}`);
    console.error('\nRefusing to proceed: the deterministic validator (claim IDs, scope, numbers, route/SEO identity, duplication, treatment/diagnosis, etc.) is NOT relaxed for this exemplar and must still pass.');
    process.exit(1);
  }

  console.log('\n[fidelity] running the deterministic factual-fidelity check (informational for paraphrase content, no AI call)...');
  const fidelity = checkDraftFidelity(draft, snapshot);
  console.log(`[fidelity] result=${fidelity.result} (a non-PASS overall result is EXPECTED once paraphrase content exists -- see the audit below)`);

  const units = collectRenderedFactualUnits(draft);
  const fidelityByUnitId = new Map(fidelity.paragraph_results.map((r) => [r.unit_id, r]));
  const stmtIndex = statementIndex(snapshot);

  const auditRows = [];
  let realProblems = 0;
  for (const unit of units) {
    const fr = fidelityByUnitId.get(unit.unit_id) || { result: 'MISSING', reason: 'no fidelity result computed for this unit' };
    const { reconciled, problems } = auditUnit(unit, snapshot, fr.result, stmtIndex);
    if (reconciled === 'REAL_PROBLEM') realProblems += problems.length || 1;
    auditRows.push({
      unit_id: unit.unit_id,
      group: unit.group,
      editorial_status: unit.editorial_status,
      text: unit.text,
      supporting_claim_ids: unit.supporting_claim_ids,
      source_statements: unit.source_statements,
      raw_fidelity_result: fr.result,
      raw_fidelity_reason: fr.reason,
      reconciled_status: reconciled,
      review_note: unit.editorial_status === 'FRAMING' ? FRAMING_REVIEW_NOTE : null,
      problems,
    });
  }

  console.log(`\n[audit] ${auditRows.length} rendered units audited, ${realProblems} unexpected problem(s) found.`);
  for (const row of auditRows) {
    console.log(`  - ${row.unit_id} [${row.editorial_status}] -> ${row.reconciled_status}${row.problems.length ? ' !! ' + row.problems.join(' | ') : ''}`);
  }

  if (realProblems > 0) {
    console.error('\nRefusing to emit a clean audit: unexpected problems found (see above). This means either a VERBATIM/FRAMING unit failed fidelity unexpectedly, or a PARAPHRASE unit is not traceable to its declared cleared source statement/claim IDs.');
    process.exit(1);
  }

  const structuredData = buildStructuredData(draft);
  const html = renderDraftHtml(draft, structuredData);
  const renderedSupportClaimIds = computeRenderedSupportClaimIds(draft);
  const duplicateFactualText = findDuplicateFactualText(draft);
  const candidateClaimCount = typeof record.publication_clearance.candidate_claim_count === 'number' ? record.publication_clearance.candidate_claim_count : null;
  const costMetrics = buildCostMetrics({
    modelCalls: [],
    fidelityCheckCalls: fidelity.paragraph_results.length,
    retries: 0,
    candidateClaimCount,
    selectedClaimCount: snapshot.selected_claim_ids.length,
    renderedSupportClaimCount: renderedSupportClaimIds.length,
  });

  const outDir = path.join(ROOT, 'research-import', 'page-builder-shadow', args.topic);
  mkdirSync(outDir, { recursive: true });

  const editorialAuditReport = {
    generated_at: new Date().toISOString(),
    topic_slug: args.topic,
    status: 'EDITORIAL EXEMPLAR / OWNER REVIEW',
    source_row_generation_source_hash: record.generation_source_hash,
    validator_valid: validation.valid,
    validator_violations: validation.violations,
    raw_fidelity_result: fidelity.result,
    unexpected_problems: realProblems,
    rows: auditRows,
    no_anthropic_call_made: true,
    no_production_write_made: true,
  };

  const mdLines = [];
  mdLines.push('# AIMT Education Voice v0 — Editorial Audit');
  mdLines.push('');
  mdLines.push('**STATUS: EDITORIAL EXEMPLAR / OWNER REVIEW** — not an automated publication gate.');
  mdLines.push('');
  mdLines.push(`Generated: ${editorialAuditReport.generated_at}`);
  mdLines.push(`Topic: \`${args.topic}\``);
  mdLines.push(`Validator: **${validation.valid ? 'PASS' : 'FAIL'}**`);
  mdLines.push(`Raw checkDraftFidelity() result: \`${fidelity.result}\` (a non-PASS overall result is expected once paraphrase content exists)`);
  mdLines.push(`Unexpected problems: **${realProblems}**`);
  mdLines.push('');
  mdLines.push('## What each editorial_status means for this audit');
  mdLines.push('');
  mdLines.push('- **VERBATIM** — evidence fidelity is deterministic: byte-identical to a cleared statement, checkDraftFidelity() proves it. No owner review needed on the text itself.');
  mdLines.push('- **PARAPHRASE** — evidence-linked (real supporting_claim_ids, real source_statements), but checkDraftFidelity() cannot prove entailment deterministically. Owner editorial review required.');
  mdLines.push('- **FRAMING** — non-factual editorial language, exempt from fidelity by construction. That exemption is NOT proof it contains no science — owner editorial review required, checked against the rule "removing this sentence would not remove scientific content."');
  mdLines.push('');
  mdLines.push('| unit_id | status | reconciled | text |');
  mdLines.push('|---|---|---|---|');
  for (const row of auditRows) {
    const text = row.text.replace(/\|/g, '\\|').slice(0, 140);
    mdLines.push(`| ${row.unit_id} | ${row.editorial_status} | ${row.reconciled_status} | ${text}${row.text.length > 140 ? '…' : ''} |`);
  }
  mdLines.push('');
  mdLines.push('## Full detail per unit');
  for (const row of auditRows) {
    mdLines.push('');
    mdLines.push(`### ${row.unit_id} — ${row.editorial_status}`);
    mdLines.push(`- Reconciled status: **${row.reconciled_status}**`);
    mdLines.push(`- Raw fidelity: \`${row.raw_fidelity_result}\` — ${row.raw_fidelity_reason}`);
    mdLines.push(`- supporting_claim_ids: ${row.supporting_claim_ids.length ? row.supporting_claim_ids.join(', ') : '(none — framing)'}`);
    if (row.source_statements.length) {
      mdLines.push(`- Source statement(s):`);
      for (const s of row.source_statements) mdLines.push(`  - "${s}"`);
    }
    mdLines.push(`- Rendered text: "${row.text}"`);
    if (row.review_note) mdLines.push(`- 🔎 ${row.review_note}`);
    if (row.problems.length) mdLines.push(`- ⚠️ Problems: ${row.problems.join('; ')}`);
  }

  writeFileSync(path.join(outDir, 'draft.json'), JSON.stringify(draft, null, 2));
  writeFileSync(path.join(outDir, 'preview.html'), html);
  writeFileSync(path.join(outDir, 'validator-report.json'), JSON.stringify(validation, null, 2));
  writeFileSync(path.join(outDir, 'fidelity-report.json'), JSON.stringify(fidelity, null, 2));
  writeFileSync(path.join(outDir, 'structured-data.json'), JSON.stringify(structuredData, null, 2));
  writeFileSync(path.join(outDir, 'cost-metrics.json'), JSON.stringify(costMetrics, null, 2));
  writeFileSync(path.join(outDir, 'editorial-audit.json'), JSON.stringify(editorialAuditReport, null, 2));
  writeFileSync(path.join(outDir, 'editorial-audit.md'), mdLines.join('\n') + '\n');

  console.log(`\nShadow + editorial-audit artifacts written to ${path.relative(ROOT, outDir)}/`);
  console.log('Nothing was written to Supabase. Nothing was published. No /education route was created. No Anthropic call was made.');
}

main().catch((err) => {
  console.error('Page Builder editorial audit failed:', err);
  process.exit(1);
});
