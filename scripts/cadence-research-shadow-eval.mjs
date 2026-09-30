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
     - --live issues PostgREST GETs only, through a hard read-only guard
       (scripts/cadence-research-shadow/read-only-fetch.mjs) that refuses
       any non-GET, body, /rpc/, or non-research-table request before it
       leaves the process. Owner authorized read-only live runs 2026-09-30.

   Usage:
     node scripts/cadence-research-shadow-eval.mjs
       [--live]
       [--export-dir <dir>]   default: research-import/unpacked/aimt-research-library-export-2026-09-20
       [--out-dir <dir>]      default: research-import/cadence-research-shadow
       [--holdout]            score hold-out v2 (frozen before round 1; now reviewed)
       [--holdout-v3]         score hold-out v3 (frozen before round 2; untouched)
       [--repeats <n>]        repeat each retrieval n times (latency sampling)
   ═══════════════════════════════════════════════════════════════ */

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { retrieveCadenceResearchContext, decideResearchRetrieval, planResearchQuery } from '../functions/_lib/cadence/research-context.mjs';
import { EVAL_CASES } from './cadence-research-shadow/eval-cases.mjs';
import { HOLDOUT_V2_CASES } from './cadence-research-shadow/eval-holdout-v2.mjs';
import { HOLDOUT_V3_CASES } from './cadence-research-shadow/eval-holdout-v3.mjs';
import { loadResearchExport, createLocalResearchFetch } from './cadence-research-shadow/local-postgrest.mjs';
import { createReadOnlyFetch } from './cadence-research-shadow/read-only-fetch.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {
    live: false,
    exportDir: path.join(ROOT, 'research-import/unpacked/aimt-research-library-export-2026-09-20'),
    outDir: path.join(ROOT, 'research-import/cadence-research-shadow'),
    holdout: false,
    repeats: 1,
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--live') args.live = true;
    else if (argv[i] === '--export-dir') args.exportDir = path.resolve(ROOT, argv[++i]);
    else if (argv[i] === '--out-dir') args.outDir = path.resolve(ROOT, argv[++i]);
    else if (argv[i] === '--holdout') args.holdout = 'v2';
    else if (argv[i] === '--holdout-v3') args.holdout = 'v3';
    else if (argv[i] === '--repeats') args.repeats = Math.max(1, Number(argv[++i]) || 1);
  }
  return args;
}

const GOVERNED = new Set(['CLAIM_VERIFIED', 'AIMT_APPROVED']);
const WITHHELD_USE = new Set(['excluded', 'superseded', 'needs_review']);
const isUsefulText = (useful, text) => Array.isArray(useful) && useful.length > 0 && useful.every((re) => re.test(text));

/** Library-wide oracle: how many governed claims in the WHOLE library meet
    the case's strict usefulness labels. 0 = the library cannot answer it,
    so the right behavior is to return nothing. */
function oracleCount(c, oracleClaims) {
  if (!c.useful || !Array.isArray(oracleClaims)) return null;
  return oracleClaims.filter((cl) => GOVERNED.has(cl.verification_status) && !WITHHELD_USE.has(cl.use_status)
    && cl.verification_review_status !== 'reviewed_unsupported' && isUsefulText(c.useful, cl.claim_text || '')).length;
}

export async function runShadowEval({ env, fetchImpl, cases = EVAL_CASES, oracleClaims = null, repeats = 1 }) {
  const rows = [];
  for (const c of cases) {
    const ctx = c.ctx || {};
    const decision = decideResearchRetrieval(c.question, ctx);
    const plan = planResearchQuery(c.question);
    const timings = [];
    let result;
    for (let i = 0; i < Math.max(1, repeats); i++) {
      result = await retrieveCadenceResearchContext({ question: c.question, env, decisionContext: ctx, fetchImpl });
      if (result.status !== 'skipped') timings.push({ ms: result.elapsed_ms, status: result.status });
    }
    const claims = result.claims || [];
    const judged = claims.map((cl) => ({
      relevant: c.relevant ? c.relevant.test(cl.claim_text) : null,
      useful: c.useful ? isUsefulText(c.useful, cl.claim_text) : null,
    }));
    const usefulCount = judged.filter((j) => j.useful).length;
    const oracle = oracleCount(c, oracleClaims);
    const expectRetrieve = c.expect.retrieve;
    rows.push({
      id: c.id,
      category: c.category,
      question: c.question,
      note: c.note || null,
      context: ctx.moduleContextText ? { ...ctx, moduleContextText: '[supplied]' } : ctx,
      decision: { eligible: decision.eligible, useful: decision.useful, retrieve: decision.retrieve, reason: decision.reason, concepts: decision.concepts, intents: decision.intents || [], signals: decision.signals },
      expected: { retrieve: expectRetrieve, reason: c.expect.reason || null },
      decision_scored: expectRetrieve === true || expectRetrieve === false,
      decision_correct: (expectRetrieve !== true && expectRetrieve !== false) ? null
        : decision.retrieve === expectRetrieve && (!c.expect.reason || c.expect.reason === decision.reason),
      high_stakes_flag_ok: c.expect.high_stakes ? decision.signals.high_stakes === true : null,
      status: result.status,
      error_code: result.error_code || null,
      gate: result.gate || null,
      search: decision.retrieve ? { topics: plan.topics, terms: plan.terms, q: plan.q } : null,
      claim_count: claims.length,
      relevant_count: c.relevant ? judged.filter((j) => j.relevant).length : null,
      useful_count: c.useful ? usefulCount : null,
      oracle_useful_in_library: oracle,
      answerable: oracle === null ? null : oracle > 0,
      timings,
      all_governed: claims.every((cl) => GOVERNED.has(cl.verification_status)),
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
        judged_useful: judged[i].useful,
      })),
    });
  }
  return summarize(rows);
}

function quantile(sorted, q) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

export function summarize(rows) {
  const scored = rows.filter((r) => r.decision_scored);
  const retrieved = rows.filter((r) => r.decision.retrieve);
  const withClaims = rows.filter((r) => r.claim_count > 0);
  const labeled = withClaims.filter((r) => r.useful_count !== null);
  const selectedLabeled = labeled.reduce((n, r) => n + r.claim_count, 0);
  const usefulSelected = labeled.reduce((n, r) => n + r.useful_count, 0);
  const shouldRetrieve = rows.filter((r) => r.expected.retrieve === true && r.answerable !== null);
  const answerable = shouldRetrieve.filter((r) => r.answerable);
  const unanswerable = shouldRetrieve.filter((r) => !r.answerable);
  const augmented = answerable.filter((r) => r.useful_count > 0);
  const abstainedCorrectly = unanswerable.filter((r) => r.claim_count === 0);
  const timings = rows.flatMap((r) => r.timings);
  const ms = timings.map((t) => t.ms).sort((a, b) => a - b);
  const byCategory = {};
  for (const r of rows) {
    const b = (byCategory[r.category] ||= { cases: 0, decision_scored: 0, decision_correct: 0, retrieved: 0, with_claims: 0, claims: 0, useful: 0 });
    b.cases++;
    if (r.decision_scored) { b.decision_scored++; if (r.decision_correct) b.decision_correct++; }
    if (r.decision.retrieve) b.retrieved++;
    if (r.claim_count) b.with_claims++;
    b.claims += r.claim_count;
    b.useful += r.useful_count || 0;
  }
  return {
    summary: {
      cases: rows.length,
      decision_scored: scored.length,
      decision_accuracy: scored.length ? scored.filter((r) => r.decision_correct).length / scored.length : null,
      decisions_wrong: scored.filter((r) => !r.decision_correct).map((r) => r.id),
      retrieval_attempted: retrieved.length,
      retrieval_with_results: withClaims.length,
      retrieval_empty: retrieved.filter((r) => r.status === 'empty').map((r) => r.id),
      retrieval_errors: rows.filter((r) => r.status === 'error' || r.status === 'timeout').map((r) => `${r.id}:${r.error_code}`),
      total_claims_selected: rows.reduce((n, r) => n + r.claim_count, 0),
      answer_usefulness_precision: selectedLabeled ? usefulSelected / selectedLabeled : null,
      useful_selected: usefulSelected,
      labeled_selected: selectedLabeled,
      topical_precision: (() => {
        const t = withClaims.flatMap((r) => r.claims.filter((c) => c.judged_relevant !== null));
        return t.length ? t.filter((c) => c.judged_relevant).length / t.length : null;
      })(),
      answerable_cases: answerable.length,
      augmentation_coverage: answerable.length ? augmented.length / answerable.length : null,
      answerable_missed: answerable.filter((r) => !(r.useful_count > 0)).map((r) => r.id),
      unanswerable_cases: unanswerable.length,
      correct_abstention_rate: unanswerable.length ? abstainedCorrectly.length / unanswerable.length : null,
      unanswerable_but_returned: unanswerable.filter((r) => r.claim_count > 0).map((r) => r.id),
      max_claims_in_one_case: Math.max(0, ...rows.map((r) => r.claim_count)),
      avg_claims_when_returned: withClaims.length ? withClaims.reduce((n, r) => n + r.claim_count, 0) / withClaims.length : 0,
      every_claim_governed: rows.every((r) => r.all_governed),
      boundary_cases_retrieved: rows.filter((r) => ['checkpoint_open', 'module12'].includes(r.category) && r.expected.retrieve === false && (r.claim_count > 0 || r.status !== 'skipped')).map((r) => r.id),
      high_stakes_flags_ok: rows.filter((r) => r.high_stakes_flag_ok !== null).every((r) => r.high_stakes_flag_ok),
      mixed_expected_and_found: rows.filter((r) => r.mixed_expected).map((r) => `${r.id}:${r.evidence_profile ? r.evidence_profile.mixed_in_selection : 'n/a'}`),
      latency: {
        samples: ms.length,
        median_ms: quantile(ms, 0.5),
        p95_ms: ms.length >= 20 ? quantile(ms, 0.95) : null,
        max_ms: ms.length ? ms[ms.length - 1] : null,
        timeouts: timings.filter((t) => t.status === 'timeout').length,
        errors: timings.filter((t) => t.status === 'error').length,
        zero_result_rate: timings.length ? timings.filter((t) => t.status === 'empty').length / timings.length : null,
      },
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
  L.push(`- Cases: ${s.cases} (decision-scored: ${s.decision_scored})`);
  L.push(`- Retrieval-decision accuracy: ${pct(s.decision_accuracy)}${s.decisions_wrong.length ? ` (mismatches: ${s.decisions_wrong.join(', ')})` : ''}`);
  L.push(`- Answer-usefulness precision (strict labels): ${pct(s.answer_usefulness_precision)} (${s.useful_selected}/${s.labeled_selected}) · topical precision: ${pct(s.topical_precision)}`);
  L.push(`- Augmentation coverage (answerable cases with ≥1 useful claim): ${pct(s.augmentation_coverage)} of ${s.answerable_cases}${s.answerable_missed.length ? ` (missed: ${s.answerable_missed.join(', ')})` : ''}`);
  L.push(`- Correct abstention (library has no useful claim → nothing returned): ${pct(s.correct_abstention_rate)} of ${s.unanswerable_cases}${s.unanswerable_but_returned.length ? ` (returned anyway: ${s.unanswerable_but_returned.join(', ')})` : ''}`);
  L.push(`- Retrieval attempted: ${s.retrieval_attempted} · returned claims: ${s.retrieval_with_results} · empty: ${s.retrieval_empty.length}`);
  L.push(`- Errors/timeouts: ${s.retrieval_errors.length ? s.retrieval_errors.join(', ') : 'none'}`);
  L.push(`- Claims selected: ${s.total_claims_selected} · avg when returned: ${s.avg_claims_when_returned.toFixed(2)} · max per case: ${s.max_claims_in_one_case}`);
  L.push(`- Every selected claim CLAIM_VERIFIED or higher: ${s.every_claim_governed ? 'yes' : 'NO'} · checkpoint/Module 12 bypasses: ${s.boundary_cases_retrieved.length ? s.boundary_cases_retrieved.join(', ') : 'none'}`);
  L.push(`- High-stakes flags raised where expected: ${s.high_stakes_flags_ok ? 'yes' : 'NO'}`);
  L.push(`- Mixed-evidence cases (id:mixed_in_selection): ${s.mixed_expected_and_found.join(', ') || 'none'}`);
  L.push(`- Latency (${s.latency.samples} retrievals): median ${s.latency.median_ms} ms · p95 ${s.latency.p95_ms ?? 'n/a'} ms · max ${s.latency.max_ms} ms · timeouts ${s.latency.timeouts} · zero-result rate ${pct(s.latency.zero_result_rate)}`, '');
  L.push('| Category | Cases | Decision correct | Retrieved | With claims | Claims | Answer-useful |', '|---|---|---|---|---|---|---|');
  for (const [k, b] of Object.entries(s.by_category)) L.push(`| ${k} | ${b.cases} | ${b.decision_correct}/${b.decision_scored} | ${b.retrieved} | ${b.with_claims} | ${b.claims} | ${b.useful} |`);
  L.push('', '## Cases', '');
  for (const r of report.cases) {
    L.push(`### ${r.id} · ${r.category} ${r.decision_correct === false ? '⚠️ decision mismatch' : ''}`, '');
    L.push(`> ${r.question}`, '');
    if (r.note) L.push(`_Note: ${r.note}_`, '');
    const ctx = Object.keys(r.context || {}).length ? ` · context: \`${JSON.stringify(r.context)}\`` : '';
    L.push(`- Decision: **${r.decision.retrieve ? 'retrieve' : 'no retrieval'}** (${r.decision.reason}; eligible=${r.decision.eligible}, useful=${r.decision.useful})${ctx}`);
    L.push(`- Expected: ${r.expected.retrieve === null ? 'either' : r.expected.retrieve ? 'retrieve' : 'no retrieval'}${r.expected.reason ? ` (${r.expected.reason})` : ''}`);
    L.push(`- Signals: concepts=[${r.decision.concepts.join(', ')}] high_stakes=${r.decision.signals.high_stakes} injection_suspected=${r.decision.signals.injection_suspected} depth_cue=${r.decision.signals.depth_cue}`);
    if (r.search) L.push(`- Search: topics=[${r.search.topics.join(', ')}] · q=\`${r.search.q}\``);
    L.push(`- Status: ${r.status}${r.error_code ? ` (${r.error_code})` : ''}${r.gate ? ` · gate: ${r.gate}` : ''} · claims: ${r.claim_count}${r.useful_count !== null && r.claim_count ? ` · answer-useful: ${r.useful_count}/${r.claim_count}` : ''}${r.oracle_useful_in_library !== null ? ` · useful claims in whole library: ${r.oracle_useful_in_library}` : ''}`);
    if (r.diagnostics) L.push(`- Pool: ${r.diagnostics.candidate_count} candidates → ${r.diagnostics.relevant_count} relevant after floor/dedupe · dropped ${JSON.stringify(r.diagnostics.dropped)}`);
    if (r.evidence_profile && r.claim_count) L.push(`- Evidence profile: ${JSON.stringify(r.evidence_profile)}`);
    if (r.claims.length) {
      L.push('', '| # | claim_id | direction | type | status / review | source (year, evidence) | useful | claim |', '|---|---|---|---|---|---|---|---|');
      r.claims.forEach((c, i) => {
        const txt = c.claim_text.replace(/\|/g, '\\|').replace(/\s+/g, ' ');
        const title = String(c.source_title || '').replace(/\|/g, '\\|').slice(0, 90);
        L.push(`| ${i + 1} | \`${c.claim_id}\` | ${c.direction || '—'} | ${c.claim_type || '—'} | ${c.verification_status} / ${c.verification_review_status || '—'} | ${title} (${c.source_year || '—'}, ${c.evidence_type || '—'}) | ${c.judged_useful === null ? '—' : c.judged_useful ? 'yes' : '**no**'} | ${txt} |`);
      });
    }
    L.push('');
  }
  return L.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let env, fetchImpl, mode, oracleClaims;
  if (args.live) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('--live requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env');
      process.exit(2);
    }
    env = { SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY };
    // Hard read-only guard: anything but a body-less GET on a research table
    // throws before any network I/O (see read-only-fetch.mjs).
    fetchImpl = createReadOnlyFetch(env.SUPABASE_URL);
    mode = 'live Supabase (read-only GET, guarded)';
    try { oracleClaims = loadResearchExport(path.join(ROOT, 'research-import/cadence-research-shadow/live-snapshot')).claims; } catch { oracleClaims = null; }
  } else {
    const data = loadResearchExport(args.exportDir);
    fetchImpl = createLocalResearchFetch(data).fetchImpl;
    env = { SUPABASE_URL: 'https://local-export.invalid', SUPABASE_SERVICE_ROLE_KEY: 'local-export-no-key' };
    mode = `local export ${path.basename(args.exportDir)} (${data.claims.length} claims / ${data.sources.length} sources; FTS approximated)`;
    oracleClaims = data.claims;
  }
  const cases = args.holdout === 'v3' ? HOLDOUT_V3_CASES : args.holdout === 'v2' ? HOLDOUT_V2_CASES : EVAL_CASES;
  const setName = args.holdout ? `holdout-${args.holdout}` : 'dev';
  const report = await runShadowEval({ env, fetchImpl, cases, oracleClaims, repeats: args.repeats });
  if (report.cases.some((r) => r.error_code === 'query_threw')) {
    console.error('NOTE: at least one retrieval threw (a read-only guard refusal would surface here); inspect the report.');
  }
  const generatedAt = new Date().toISOString();
  mkdirSync(args.outDir, { recursive: true });
  const stamp = generatedAt.slice(0, 10) + (args.live ? '-live' : '-export') + `-${setName}`;
  const jsonPath = path.join(args.outDir, `cadence-research-shadow-report-${stamp}.json`);
  const mdPath = path.join(args.outDir, `cadence-research-shadow-report-${stamp}.md`);
  writeFileSync(jsonPath, JSON.stringify({ generated_at: generatedAt, mode, set: setName, ...report }, null, 2));
  writeFileSync(mdPath, renderMarkdown(report, { mode: `${mode} · set: ${setName}`, generatedAt }));
  const s = report.summary;
  console.log(`set=${setName} cases=${s.cases} decision=${pct(s.decision_accuracy)} usefulness=${pct(s.answer_usefulness_precision)} (${s.useful_selected}/${s.labeled_selected}) topical=${pct(s.topical_precision)} coverage=${pct(s.augmentation_coverage)}/${s.answerable_cases} abstain=${pct(s.correct_abstention_rate)}/${s.unanswerable_cases} governed=${s.every_claim_governed} bypasses=${s.boundary_cases_retrieved.length} latency_med=${s.latency.median_ms}ms p95=${s.latency.p95_ms}ms timeouts=${s.latency.timeouts}`);
  if (s.decisions_wrong.length) console.log(`decision mismatches: ${s.decisions_wrong.join(', ')}`);
  if (s.answerable_missed.length) console.log(`answerable but missed: ${s.answerable_missed.join(', ')}`);
  if (s.unanswerable_but_returned.length) console.log(`unanswerable but returned: ${s.unanswerable_but_returned.join(', ')}`);
  console.log(`wrote ${path.relative(ROOT, jsonPath)}\nwrote ${path.relative(ROOT, mdPath)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
