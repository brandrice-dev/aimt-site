#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   Ask Cadence — Research Library SHADOW evaluation harness
   ---------------------------------------------------------------
   Runs every case in scripts/cadence-research-shadow/eval-cases.mjs
   through the (unwired) Cadence research layer
   (functions/_lib/cadence/research-context.mjs) and writes a JSON +
   Markdown report of what WOULD have been retrieved.

   SHADOW GUARANTEE:
     - No model is called. Nothing is sent to Ask Cadence, stored in a
       student transcript, or written to any table.
     - Default mode reads the local validated export (research-import/,
       gitignored) through a read-only PostgREST stand-in, exercising the
       real shared query builder (functions/_lib/research/query.mjs).
     - --live issues PostgREST GETs only (SELECT via the service role
       key from env). Same posture as research-publication-editor-shadow:
       explicit owner go-ahead expected before using it.

   Usage:
     node scripts/cadence-research-shadow-eval.mjs
       [--live]
       [--export-dir <dir>]   default: research-import/unpacked/aimt-research-library-export-2026-09-20
       [--out-dir <dir>]      default: research-import/cadence-research-shadow
   ═══════════════════════════════════════════════════════════════ */

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { retrieveCadenceResearchContext, decideResearchRetrieval, planResearchQuery } from '../functions/_lib/cadence/research-context.mjs';
import { EVAL_CASES } from './cadence-research-shadow/eval-cases.mjs';
import { loadResearchExport, createLocalResearchFetch } from './cadence-research-shadow/local-postgrest.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {
    live: false,
    exportDir: path.join(ROOT, 'research-import/unpacked/aimt-research-library-export-2026-09-20'),
    outDir: path.join(ROOT, 'research-import/cadence-research-shadow'),
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--live') args.live = true;
    else if (argv[i] === '--export-dir') args.exportDir = path.resolve(ROOT, argv[++i]);
    else if (argv[i] === '--out-dir') args.outDir = path.resolve(ROOT, argv[++i]);
  }
  return args;
}

export async function runShadowEval({ env, fetchImpl, cases = EVAL_CASES }) {
  const rows = [];
  for (const c of cases) {
    const ctx = c.ctx || {};
    const decision = decideResearchRetrieval(c.question, ctx);
    const plan = planResearchQuery(c.question);
    const result = await retrieveCadenceResearchContext({ question: c.question, env, decisionContext: ctx, fetchImpl, timeoutMs: 15000 });
    const claims = result.claims || [];
    const judged = claims.map((cl) => ({ id: cl.claim_id, relevant: c.relevant ? c.relevant.test(cl.claim_text) : null }));
    const relevantCount = judged.filter((j) => j.relevant).length;
    rows.push({
      id: c.id,
      category: c.category,
      question: c.question,
      note: c.note || null,
      context: ctx.moduleContextText ? { ...ctx, moduleContextText: '[supplied]' } : ctx,
      decision: { eligible: decision.eligible, useful: decision.useful, retrieve: decision.retrieve, reason: decision.reason, concepts: decision.concepts, signals: decision.signals },
      expected: { retrieve: c.expect.retrieve, reason: c.expect.reason || null },
      decision_correct: decision.retrieve === c.expect.retrieve && (!c.expect.reason || c.expect.reason === decision.reason),
      high_stakes_flag_ok: c.expect.high_stakes ? decision.signals.high_stakes === true : null,
      status: result.status,
      error_code: result.error_code || null,
      search: decision.retrieve ? { topics: plan.topics, terms: plan.terms, q: plan.q } : null,
      claim_count: claims.length,
      relevant_count: c.relevant ? relevantCount : null,
      precision: c.relevant && claims.length ? relevantCount / claims.length : null,
      all_governed: claims.every((cl) => ['CLAIM_VERIFIED', 'AIMT_APPROVED'].includes(cl.verification_status)),
      evidence_profile: result.evidence_profile || null,
      mixed_expected: c.expect.mixed || false,
      diagnostics: result.diagnostics || null,
      claims: claims.map((cl, i) => ({
        claim_id: cl.claim_id,
        claim_text: cl.claim_text,
        claim_type: cl.claim_type,
        topics: cl.topics,
        direction: cl.direction,
        direction_group: cl.direction_group,
        verification_status: cl.verification_status,
        verification_review_status: cl.verification_review_status,
        use_status: cl.use_status,
        source_id: cl.source.source_id,
        source_title: cl.source.title,
        source_year: cl.source.year,
        evidence_type: cl.source.evidence_type,
        source_role: cl.source.source_role,
        doi: cl.source.doi,
        url: cl.source.url,
        relevance: cl.relevance,
        judged_relevant: judged[i].relevant,
      })),
    });
  }
  return summarize(rows);
}

function summarize(rows) {
  const retrieved = rows.filter((r) => r.decision.retrieve);
  const withClaims = retrieved.filter((r) => r.claim_count > 0);
  const judgedClaims = withClaims.flatMap((r) => r.claims.filter((c) => c.judged_relevant !== null));
  const byCategory = {};
  for (const r of rows) {
    const b = (byCategory[r.category] ||= { cases: 0, decision_correct: 0, retrieved: 0, with_claims: 0, claims: 0, relevant: 0 });
    b.cases++;
    if (r.decision_correct) b.decision_correct++;
    if (r.decision.retrieve) b.retrieved++;
    if (r.claim_count) b.with_claims++;
    b.claims += r.claim_count;
    b.relevant += r.relevant_count || 0;
  }
  return {
    summary: {
      cases: rows.length,
      decision_accuracy: rows.filter((r) => r.decision_correct).length / rows.length,
      decisions_wrong: rows.filter((r) => !r.decision_correct).map((r) => r.id),
      retrieval_attempted: retrieved.length,
      retrieval_with_results: withClaims.length,
      retrieval_empty: retrieved.filter((r) => r.status === 'empty').map((r) => r.id),
      retrieval_errors: rows.filter((r) => r.status === 'error' || r.status === 'timeout').map((r) => `${r.id}:${r.error_code}`),
      total_claims_selected: judgedClaims.length,
      auto_judged_precision: judgedClaims.length ? judgedClaims.filter((c) => c.judged_relevant).length / judgedClaims.length : null,
      max_claims_in_one_case: Math.max(0, ...rows.map((r) => r.claim_count)),
      every_claim_governed: rows.every((r) => r.all_governed),
      high_stakes_flags_ok: rows.filter((r) => r.high_stakes_flag_ok !== null).every((r) => r.high_stakes_flag_ok),
      mixed_expected_and_found: rows.filter((r) => r.mixed_expected).map((r) => `${r.id}:${r.evidence_profile ? r.evidence_profile.mixed_in_selection : 'n/a'}`),
      by_category: byCategory,
    },
    cases: rows,
  };
}

function pct(x) { return x === null || x === undefined ? 'n/a' : `${Math.round(x * 100)}%`; }

export function renderMarkdown(report, { mode, generatedAt }) {
  const s = report.summary;
  const L = [];
  L.push('# Ask Cadence — Research Library shadow retrieval report', '');
  L.push(`Generated ${generatedAt} · data: ${mode} · SHADOW ONLY: nothing here reached a student or a model prompt.`, '');
  L.push('## Summary', '');
  L.push(`- Cases: ${s.cases}`);
  L.push(`- Retrieval-decision accuracy vs. expected: ${pct(s.decision_accuracy)}${s.decisions_wrong.length ? ` (mismatches: ${s.decisions_wrong.join(', ')})` : ''}`);
  L.push(`- Retrieval attempted: ${s.retrieval_attempted} · returned claims: ${s.retrieval_with_results} · empty: ${s.retrieval_empty.length}${s.retrieval_empty.length ? ` (${s.retrieval_empty.join(', ')})` : ''}`);
  L.push(`- Errors/timeouts: ${s.retrieval_errors.length ? s.retrieval_errors.join(', ') : 'none'}`);
  L.push(`- Claims selected: ${s.total_claims_selected} · auto-judged on-topic precision: ${pct(s.auto_judged_precision)} · max per case: ${s.max_claims_in_one_case}`);
  L.push(`- Every selected claim CLAIM_VERIFIED or higher: ${s.every_claim_governed ? 'yes' : 'NO'}`);
  L.push(`- High-stakes flags raised where expected: ${s.high_stakes_flags_ok ? 'yes' : 'NO'}`);
  L.push(`- Mixed-evidence cases (id:mixed_in_selection): ${s.mixed_expected_and_found.join(', ')}`, '');
  L.push('| Category | Cases | Decision correct | Retrieved | With claims | Claims | On-topic |', '|---|---|---|---|---|---|---|');
  for (const [k, b] of Object.entries(s.by_category)) L.push(`| ${k} | ${b.cases} | ${b.decision_correct} | ${b.retrieved} | ${b.with_claims} | ${b.claims} | ${b.relevant} |`);
  L.push('', '## Cases', '');
  for (const r of report.cases) {
    L.push(`### ${r.id} · ${r.category} ${r.decision_correct ? '' : '⚠️ decision mismatch'}`, '');
    L.push(`> ${r.question}`, '');
    if (r.note) L.push(`_Note: ${r.note}_`, '');
    const ctx = Object.keys(r.context || {}).length ? ` · context: \`${JSON.stringify(r.context)}\`` : '';
    L.push(`- Decision: **${r.decision.retrieve ? 'retrieve' : 'no retrieval'}** (${r.decision.reason}; eligible=${r.decision.eligible}, useful=${r.decision.useful})${ctx}`);
    L.push(`- Expected: ${r.expected.retrieve ? 'retrieve' : 'no retrieval'}${r.expected.reason ? ` (${r.expected.reason})` : ''}`);
    L.push(`- Signals: concepts=[${r.decision.concepts.join(', ')}] high_stakes=${r.decision.signals.high_stakes} injection_suspected=${r.decision.signals.injection_suspected} depth_cue=${r.decision.signals.depth_cue}`);
    if (r.search) L.push(`- Search: topics=[${r.search.topics.join(', ')}] · q=\`${r.search.q}\``);
    L.push(`- Status: ${r.status}${r.error_code ? ` (${r.error_code})` : ''} · claims: ${r.claim_count}${r.relevant_count !== null && r.claim_count ? ` · on-topic: ${r.relevant_count}/${r.claim_count}` : ''}`);
    if (r.diagnostics) L.push(`- Pool: ${r.diagnostics.candidate_count} candidates → ${r.diagnostics.relevant_count} relevant after floor/dedupe · dropped ${JSON.stringify(r.diagnostics.dropped)}`);
    if (r.evidence_profile && r.claim_count) L.push(`- Evidence profile: ${JSON.stringify(r.evidence_profile)}`);
    if (r.claims.length) {
      L.push('', '| # | claim_id | direction | type | status / review | source (year, evidence) | on-topic | claim |', '|---|---|---|---|---|---|---|---|');
      r.claims.forEach((c, i) => {
        const txt = c.claim_text.replace(/\|/g, '\\|').replace(/\s+/g, ' ');
        const title = String(c.source_title || '').replace(/\|/g, '\\|').slice(0, 90);
        L.push(`| ${i + 1} | \`${c.claim_id}\` | ${c.direction || '—'} | ${c.claim_type || '—'} | ${c.verification_status} / ${c.verification_review_status || '—'} | ${title} (${c.source_year || '—'}, ${c.evidence_type || '—'}) | ${c.judged_relevant === null ? '—' : c.judged_relevant ? 'yes' : '**no**'} | ${txt} |`);
      });
    }
    L.push('');
  }
  return L.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let env, fetchImpl, mode;
  if (args.live) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('--live requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env');
      process.exit(2);
    }
    env = { SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY };
    fetchImpl = undefined; // real fetch, GET only (shared helper never sets a method)
    mode = 'live Supabase (read-only GET)';
  } else {
    const data = loadResearchExport(args.exportDir);
    fetchImpl = createLocalResearchFetch(data).fetchImpl;
    env = { SUPABASE_URL: 'https://local-export.invalid', SUPABASE_SERVICE_ROLE_KEY: 'local-export-no-key' };
    mode = `local export ${path.basename(args.exportDir)} (${data.claims.length} claims / ${data.sources.length} sources; FTS approximated)`;
  }
  const report = await runShadowEval({ env, fetchImpl });
  const generatedAt = new Date().toISOString();
  mkdirSync(args.outDir, { recursive: true });
  const stamp = generatedAt.slice(0, 10) + (args.live ? '-live' : '-export');
  const jsonPath = path.join(args.outDir, `cadence-research-shadow-report-${stamp}.json`);
  const mdPath = path.join(args.outDir, `cadence-research-shadow-report-${stamp}.md`);
  writeFileSync(jsonPath, JSON.stringify({ generated_at: generatedAt, mode, ...report }, null, 2));
  writeFileSync(mdPath, renderMarkdown(report, { mode, generatedAt }));
  const s = report.summary;
  console.log(`cases=${s.cases} decision_accuracy=${pct(s.decision_accuracy)} attempted=${s.retrieval_attempted} with_results=${s.retrieval_with_results} claims=${s.total_claims_selected} precision=${pct(s.auto_judged_precision)} governed=${s.every_claim_governed}`);
  if (s.decisions_wrong.length) console.log(`decision mismatches: ${s.decisions_wrong.join(', ')}`);
  console.log(`wrote ${path.relative(ROOT, jsonPath)}\nwrote ${path.relative(ROOT, mdPath)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
