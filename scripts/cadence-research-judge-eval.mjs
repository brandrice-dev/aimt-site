#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   Ask Cadence — research relevance JUDGE shadow evaluation
   ---------------------------------------------------------------
   Compares, per question:
     A  deterministic retrieval only (research-context.mjs, unchanged)
     B  deterministic candidates (≤15, already governed) + one model
        relevance call (research-judge.mjs); any judge failure = no claims
     C  abstention behavior of both arms (no research when none helps)

   SHADOW GUARANTEE: nothing reaches Ask Cadence, a student, a transcript
   or any table. Research reads are PostgREST GETs through the hard
   read-only guard. The only outbound write-shaped request is the judge's
   POST to api.anthropic.com/v1/messages, carrying the question and
   already-governed candidate claims.

   COST: hard cap (default $2.00) across ALL runs, tracked in a ledger under
   research-import/ (gitignored). Each call is pre-checked against the
   remaining budget with a worst-case estimate; the run stops before a call
   that could exceed it. Responses are cached by (prompt version, model,
   question, candidate IDs) so re-scoring costs nothing.

   Usage:
     node scripts/cadence-research-judge-eval.mjs --set dev|v2|v3|v4 [--live]
          [--no-judge] [--pool-sheet] [--labels <json>] [--budget-usd 2]
          [--out-dir <dir>] [--no-mixed-guard]
   The API key is read from ANTHROPIC_API_KEY or
   ANTHROPIC_PUBLICATION_EDITOR_API_KEY (local env only; never printed).
   ═══════════════════════════════════════════════════════════════ */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';
import { judgeResearchCandidates, buildJudgeRequest, JUDGE_MODEL_DEFAULT, JUDGE_PROMPT_VERSION, JUDGE_LIMITS } from '../functions/_lib/cadence/research-judge.mjs';
import { EVAL_CASES } from './cadence-research-shadow/eval-cases.mjs';
import { HOLDOUT_V2_CASES } from './cadence-research-shadow/eval-holdout-v2.mjs';
import { HOLDOUT_V3_CASES } from './cadence-research-shadow/eval-holdout-v3.mjs';
import { HOLDOUT_V4_CASES } from './cadence-research-shadow/eval-holdout-v4.mjs';
import { HOLDOUT_V5_CASES } from './cadence-research-shadow/eval-holdout-v5.mjs';
import { loadResearchExport, createLocalResearchFetch } from './cadence-research-shadow/local-postgrest.mjs';
import { createReadOnlyFetch } from './cadence-research-shadow/read-only-fetch.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORK = path.join(ROOT, 'research-import/cadence-research-judge');
const SETS = { dev: EVAL_CASES, v2: HOLDOUT_V2_CASES, v3: HOLDOUT_V3_CASES, v4: HOLDOUT_V4_CASES, v5: HOLDOUT_V5_CASES };
// Claude Haiku 4.5 list price, USD per token.
const PRICE = { input: 1 / 1e6, output: 5 / 1e6 };
const GOVERNED = new Set(['CLAIM_VERIFIED', 'AIMT_APPROVED']);
const CONTESTED = ['positive', 'null_or_negative', 'uncertain'];

function parseArgs(argv) {
  const a = { set: 'dev', live: false, judge: true, poolSheet: false, labels: null, budget: 2, outDir: WORK, mixedGuard: true, codeRoot: ROOT, tag: '' };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--set') a.set = argv[++i];
    else if (k === '--live') a.live = true;
    else if (k === '--no-judge') a.judge = false;
    else if (k === '--pool-sheet') a.poolSheet = true;
    else if (k === '--labels') a.labels = path.resolve(ROOT, argv[++i]);
    else if (k === '--budget-usd') a.budget = Number(argv[++i]);
    else if (k === '--out-dir') a.outDir = path.resolve(ROOT, argv[++i]);
    else if (k === '--no-mixed-guard') a.mixedGuard = false;
    // Retrieval code to evaluate (e.g. a worktree of the pre-v5 baseline);
    // the judge always comes from this checkout.
    else if (k === '--code-root') a.codeRoot = path.resolve(argv[++i]);
    else if (k === '--tag') a.tag = argv[++i];
  }
  if (!SETS[a.set]) throw new Error(`unknown --set ${a.set}`);
  if (!(a.budget > 0 && a.budget <= 2)) throw new Error('--budget-usd must be in (0, 2]');
  return a;
}

/* ── Spend ledger + response cache ─────────────────────────────── */

function loadLedger() {
  const p = path.join(WORK, 'spend-ledger.json');
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return { calls: 0, input_tokens: 0, output_tokens: 0, usd: 0, runs: [] }; }
}
function saveLedger(l) { mkdirSync(WORK, { recursive: true }); writeFileSync(path.join(WORK, 'spend-ledger.json'), JSON.stringify(l, null, 2)); }
const costOf = (u) => (u ? u.input_tokens * PRICE.input + u.output_tokens * PRICE.output : 0);

function cacheKey(question, candidates, model) {
  return createHash('sha256').update(JSON.stringify([JUDGE_PROMPT_VERSION, model, question, candidates.map((c) => c.claim_id)])).digest('hex');
}

/** Budgeted, cached judge call. Cached entries store only the validated
    output (IDs + reason codes), status, usage and the original latency. */
async function budgetedJudge({ question, candidates, apiKey, ledger, budget, mixedGuard, model, questionIntents }) {
  const key = cacheKey(question, candidates, model);
  const cp = path.join(WORK, 'cache', `${key}.json`);
  if (existsSync(cp)) {
    const hit = JSON.parse(readFileSync(cp, 'utf8'));
    // Re-apply selection locally so guard changes need no new call.
    const res = await judgeResearchCandidates({
      question, candidates, apiKey: 'cached', model, mixedGuard, questionIntents,
      fetchImpl: async () => ({ ok: true, status: 200, text: async () => JSON.stringify(hit.raw) }),
    });
    return { ...res, usage: hit.usage, elapsed_ms: hit.elapsed_ms, status: hit.status === 'ok' || hit.status === 'abstained' ? res.status : hit.status, error_code: hit.error_code || res.error_code, cached: true, cost_usd: 0 };
  }
  const req = buildJudgeRequest(question, candidates, { model });
  const estInput = Math.ceil(JSON.stringify(req.body).length / 3); // conservative chars->tokens
  const worst = estInput * PRICE.input + JUDGE_LIMITS.MAX_OUTPUT_TOKENS * PRICE.output;
  if (ledger.usd + worst > budget) return { status: 'budget_stop', claims: [], selected: [], guard_added: [], usage: null, elapsed_ms: 0, cost_usd: 0 };
  let raw = null;
  const capture = async (url, init) => {
    const r = await fetch(url, init);
    const text = await r.text();
    try { raw = JSON.parse(text); } catch { raw = null; }
    return { ok: r.ok, status: r.status, text: async () => text };
  };
  const res = await judgeResearchCandidates({ question, candidates, apiKey, model, mixedGuard, questionIntents, fetchImpl: capture });
  const cost = costOf(res.usage);
  ledger.calls++; ledger.usd += cost;
  if (res.usage) { ledger.input_tokens += res.usage.input_tokens; ledger.output_tokens += res.usage.output_tokens; }
  saveLedger(ledger);
  if (raw && (res.status === 'ok' || res.status === 'abstained' || res.status === 'error')) {
    // Persist only the tool output, never any other content.
    const toolOnly = raw && Array.isArray(raw.content)
      ? { stop_reason: raw.stop_reason, content: raw.content.filter((b) => b && b.type === 'tool_use').map((b) => ({ type: b.type, name: b.name, input: b.input })) }
      : null;
    mkdirSync(path.join(WORK, 'cache'), { recursive: true });
    writeFileSync(cp, JSON.stringify({ status: res.status, error_code: res.error_code || null, usage: res.usage, elapsed_ms: res.elapsed_ms, raw: toolOnly }));
  }
  return { ...res, cached: false, cost_usd: cost };
}

/* ── Labels ────────────────────────────────────────────────────── */

const regexUseful = (c, text) => Array.isArray(c.useful) && c.useful.length > 0 && c.useful.every((re) => re.test(text));

function labelFor(c, claim, hand) {
  // v5: library-wide hand labels; anything not listed is not useful.
  if (Array.isArray(c.useful_ids)) return c.useful_ids.includes(claim.claim_id);
  if (hand) {
    const v = hand.cases?.[c.id]?.claims?.[claim.claim_id];
    return v === undefined ? null : v === true;
  }
  return c.useful ? regexUseful(c, claim.claim_text) : null;
}

/* ── Main eval ─────────────────────────────────────────────────── */

function quantile(sorted, q) { if (!sorted.length) return null; return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))]; }

export function scoreArms(rows) {
  const arm = (key) => {
    const scored = rows.filter((r) => r.expect.retrieve === true || r.expect.retrieve === false);
    const decided = (r) => r[key].claims.length > 0;
    // Decision: did the arm's FINAL output use research (>=1 claim) when it
    // should, and stay off when it should? Correct abstention on an
    // unanswerable should-retrieve question also counts as correct.
    const decisionOk = (r) => r.expect.retrieve === false ? !decided(r) && r.decision.retrieve === false
      : (decided(r) || r.answerable !== true) && r.decision.retrieve === true && (!r.expect.reason || r.expect.reason === r.decision.reason);
    const gateOk = (r) => r.decision.retrieve === r.expect.retrieve && (!r.expect.reason || r.expect.reason === r.decision.reason);
    const labeled = rows.flatMap((r) => r[key].claims.map((cl) => cl.useful));
    const known = labeled.filter((x) => x !== null);
    const answerable = rows.filter((r) => r.expect.retrieve === true && r.answerable === true);
    const unanswerable = rows.filter((r) => r.expect.retrieve === true && r.answerable === false);
    const shouldOff = rows.filter((r) => r.expect.retrieve === false);
    const withClaims = rows.filter((r) => r[key].claims.length);
    const eligibleRetrieve = rows.filter((r) => r.decision.retrieve);
    return {
      decision_accuracy: scored.length ? scored.filter(decisionOk).length / scored.length : null,
      decisions_wrong: scored.filter((r) => !decisionOk(r)).map((r) => r.id),
      gate_decision_accuracy: scored.length ? scored.filter(gateOk).length / scored.length : null,
      gate_decisions_wrong: scored.filter((r) => !gateOk(r)).map((r) => r.id),
      selected_claims: labeled.length,
      useful_claims: known.filter(Boolean).length,
      unlabeled_claims: labeled.length - known.length,
      usefulness_precision: known.length ? known.filter(Boolean).length / known.length : null,
      answerable_cases: answerable.length,
      coverage: answerable.length ? answerable.filter((r) => r[key].claims.some((c) => c.useful)).length / answerable.length : null,
      coverage_missed: answerable.filter((r) => !r[key].claims.some((c) => c.useful)).map((r) => r.id),
      unanswerable_cases: unanswerable.length,
      correct_abstention_unanswerable: unanswerable.length ? unanswerable.filter((r) => !r[key].claims.length).length / unanswerable.length : null,
      unanswerable_returned: unanswerable.filter((r) => r[key].claims.length).map((r) => r.id),
      should_off_cases: shouldOff.length,
      correct_off: shouldOff.length ? shouldOff.filter((r) => !r[key].claims.length).length / shouldOff.length : null,
      abstention_rate_when_retrieving: eligibleRetrieve.length ? eligibleRetrieve.filter((r) => !r[key].claims.length).length / eligibleRetrieve.length : null,
      wrongful_abstentions: answerable.filter((r) => !r[key].claims.length).map((r) => r.id),
      avg_claims_when_returned: withClaims.length ? withClaims.reduce((n, r) => n + r[key].claims.length, 0) / withClaims.length : 0,
      max_claims: Math.max(0, ...rows.map((r) => r[key].claims.length)),
      all_governed: rows.every((r) => r[key].claims.every((c) => GOVERNED.has(c.verification_status))),
      boundary_leaks: rows.filter((r) => r.expect.reason && (r.expect.reason === 'checkpoint_open' || r.expect.reason.startsWith('module12')) && r[key].claims.length).map((r) => r.id),
      mixed_cases: rows.filter((r) => r.expect.mixed).map((r) => {
        const groups = (cls) => CONTESTED.filter((g) => cls.some((c) => c.direction_group === g));
        const poolUsefulGroups = groups(r.pool.filter((c) => c.useful));
        return { id: r.id, pool_useful_contested_groups: poolUsefulGroups, selected_groups: groups(r[key].claims),
          preserved: poolUsefulGroups.length < 2 ? null : groups(r[key].claims).length >= 2 };
      }),
    };
  };
  // Candidate recall (labels that cover the whole library only, i.e. v5):
  // did the pool shown to the judge contain the useful governed claims?
  const recallRows = rows.filter((r) => r.useful_ids && r.useful_ids.length && r.expect.retrieve !== false && !r.gap);
  const poolIds = (r) => new Set(r.pool.map((p) => p.claim_id));
  const candidate_recall = recallRows.length ? {
    cases_with_useful_in_pool: recallRows.filter((r) => r.useful_ids.some((id) => poolIds(r).has(id))).length,
    cases: recallRows.length,
    case_level: recallRows.filter((r) => r.useful_ids.some((id) => poolIds(r).has(id))).length / recallRows.length,
    useful_claims_in_pool: recallRows.reduce((n, r) => n + r.useful_ids.filter((id) => poolIds(r).has(id)).length, 0),
    useful_claims: recallRows.reduce((n, r) => n + r.useful_ids.length, 0),
    missed_cases: recallRows.filter((r) => !r.useful_ids.some((id) => poolIds(r).has(id))).map((r) => r.id),
  } : null;
  if (candidate_recall) candidate_recall.claim_level = candidate_recall.useful_claims_in_pool / candidate_recall.useful_claims;
  const governance_gaps = rows.filter((r) => r.gap).map((r) => ({ id: r.id, gap_ids: r.gap_ids, A_returned: r.A.claims.length, B_returned: r.B.claims.length }));
  const judgeRows = rows.filter((r) => r.judge.called);
  const ms = judgeRows.filter((r) => !r.judge.cached_only).map((r) => r.judge.elapsed_ms).sort((a, b) => a - b);
  const retrMs = rows.filter((r) => r.retrieval_ms !== null).map((r) => r.retrieval_ms).sort((a, b) => a - b);
  return {
    A: arm('A'),
    B: arm('B'),
    judge: {
      calls: judgeRows.length,
      statuses: judgeRows.reduce((m, r) => ((m[r.judge.status] = (m[r.judge.status] || 0) + 1), m), {}),
      failures: judgeRows.filter((r) => !['ok', 'abstained'].includes(r.judge.status)).map((r) => `${r.id}:${r.judge.error_code || r.judge.status}`),
      guard_added: judgeRows.filter((r) => r.judge.guard_added.length).map((r) => `${r.id}:${r.judge.guard_added.length}`),
      latency_ms: { median: quantile(ms, 0.5), p95: quantile(ms, 0.95), max: ms[ms.length - 1] ?? null },
      avg_candidates: judgeRows.length ? judgeRows.reduce((n, r) => n + r.pool.length, 0) / judgeRows.length : 0,
      input_tokens: judgeRows.reduce((n, r) => n + (r.judge.usage?.input_tokens || 0), 0),
      output_tokens: judgeRows.reduce((n, r) => n + (r.judge.usage?.output_tokens || 0), 0),
      list_cost_usd: judgeRows.reduce((n, r) => n + costOf(r.judge.usage), 0),
      injection_cases: rows.filter((r) => r.injection).map((r) => ({ id: r.id, pool: r.pool.length, selected: r.B.claims.length,
        selected_outside_pool: r.B.claims.filter((c) => !r.pool.some((p) => p.claim_id === c.claim_id)).length,
        ungoverned: r.B.claims.filter((c) => !GOVERNED.has(c.verification_status)).length })),
    },
    retrieval_latency_ms: { median: quantile(retrMs, 0.5), p95: quantile(retrMs, 0.95) },
    candidate_recall,
    governance_gaps,
    avg_pool: rows.filter((r) => r.decision.retrieve).length ? rows.filter((r) => r.decision.retrieve).reduce((n, r) => n + r.pool.length, 0) / rows.filter((r) => r.decision.retrieve).length : 0,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cases = SETS[args.set];
  let env, fetchImpl, mode;
  if (args.live) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) { console.error('--live requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'); process.exit(2); }
    env = { SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY };
    fetchImpl = createReadOnlyFetch(env.SUPABASE_URL);
    mode = 'live Supabase (read-only GET, guarded)';
  } else {
    const dir = path.join(ROOT, 'research-import/cadence-research-shadow/live-snapshot');
    const data = loadResearchExport(dir);
    fetchImpl = createLocalResearchFetch(data).fetchImpl;
    env = { SUPABASE_URL: 'https://local-export.invalid', SUPABASE_SERVICE_ROLE_KEY: 'local-export-no-key' };
    mode = `local live-snapshot (${data.claims.length} claims; FTS approximated)`;
  }
  const hand = args.labels ? JSON.parse(readFileSync(args.labels, 'utf8')) : null;
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_PUBLICATION_EDITOR_API_KEY || '';
  if (args.judge && !apiKey) { console.error('judge run needs a locally configured Anthropic key; none found. Stopping.'); process.exit(2); }
  const ctxMod = await import(pathToFileURL(path.join(args.codeRoot, 'functions/_lib/cadence/research-context.mjs')).href);
  const { retrieveCadenceResearchContext, RESEARCH_CONTEXT_LIMITS } = ctxMod;
  const ledger = loadLedger();
  const startUsd = ledger.usd;
  const model = JUDGE_MODEL_DEFAULT;

  const rows = [];
  for (const c of cases) {
    const t0 = Date.now();
    const r = await retrieveCadenceResearchContext({ question: c.question, env, decisionContext: c.ctx || {}, fetchImpl, candidateLimit: RESEARCH_CONTEXT_LIMITS.MAX_JUDGE_CANDIDATES });
    const retrieval_ms = r.status === 'skipped' ? null : Date.now() - t0;
    const decision = r.decision || { retrieve: false, reason: r.error_code || r.status };
    const pool = (r.judge_candidates || []).map((cl) => ({ ...cl, useful: labelFor(c, cl, hand) }));
    const A = (r.claims || []).map((cl) => ({ ...cl, direction_group: cl.direction_group, useful: labelFor(c, cl, hand) }));
    let judge = { called: false, status: 'not_called', claims: [], selected: [], guard_added: [], usage: null, elapsed_ms: 0 };
    if (args.judge && pool.length) {
      const j = await budgetedJudge({ question: c.question, candidates: r.judge_candidates, apiKey, ledger, budget: args.budget, mixedGuard: args.mixedGuard, model, questionIntents: decision.intents || [] });
      judge = { called: true, cached_only: !!j.cached, ...j };
      if (j.status === 'budget_stop') { console.error(`BUDGET STOP before ${c.id}: ledger $${ledger.usd.toFixed(4)} of $${args.budget}`); rows.push({ ...rowOf(), judge }); break; }
    }
    const B = (judge.claims || []).map((cl) => ({ ...cl, useful: labelFor(c, cl, hand) }));
    function rowOf() {
      return {
        id: c.id, category: c.category, question: c.question, need: c.need || null, injection: !!c.injection,
        expect: c.expect, decision: { retrieve: decision.retrieve, reason: decision.reason, intents: decision.intents || [], signals: decision.signals || null },
        status: r.status, gate: r.gate || null, retrieval_ms, pool,
        answerable: Array.isArray(c.useful_ids) ? c.useful_ids.length > 0
          : hand ? (hand.cases?.[c.id]?.answerable ?? (pool.some((p) => p.useful) || null)) : (c.useful ? pool.some((p) => p.useful) || null : null),
        useful_ids: c.useful_ids || null, gap: c.gap || null, gap_ids: c.gap_ids || null,
        A: { claims: A, mixed_in_selection: r.evidence_profile?.mixed_in_selection ?? null },
      };
    }
    rows.push({ ...rowOf(), judge, B: { claims: B } });
  }
  // Unknown answerability (no useful candidate and no hand verdict) is
  // treated as unanswerable only when hand labels say so.
  for (const r of rows) if (r.answerable === null && !hand) r.answerable = r.pool.some((p) => p.useful) ? true : null;

  const summary = scoreArms(rows.filter((r) => r.B));
  const generatedAt = new Date().toISOString();
  mkdirSync(args.outDir, { recursive: true });
  const tag = `${args.set}${args.judge ? '' : '-nojudge'}${args.mixedGuard ? '' : '-noguard'}${args.tag ? '-' + args.tag : ''}`;
  const out = { generated_at: generatedAt, mode, set: args.set, code_root: path.relative(ROOT, args.codeRoot) || '.', model, prompt_version: JUDGE_PROMPT_VERSION, labels: args.labels ? path.relative(ROOT, args.labels) : 'regex (dev only)',
    spend: { this_run_usd: ledger.usd - startUsd, ledger_total_usd: ledger.usd, ledger_calls: ledger.calls, cap_usd: args.budget }, summary, cases: rows };
  writeFileSync(path.join(args.outDir, `judge-eval-${tag}.json`), JSON.stringify(out, null, 2));
  if (args.poolSheet) writeFileSync(path.join(args.outDir, `pool-sheet-${args.set}.md`), renderPoolSheet(rows));
  const pct = (x) => (x === null || x === undefined ? 'n/a' : `${Math.round(x * 1000) / 10}%`);
  for (const k of ['A', 'B']) {
    const s = summary[k];
    console.log(`${k}: decision=${pct(s.decision_accuracy)} useful=${pct(s.usefulness_precision)} (${s.useful_claims}/${s.selected_claims - s.unlabeled_claims}${s.unlabeled_claims ? `, ${s.unlabeled_claims} unlabeled` : ''}) coverage=${pct(s.coverage)} of ${s.answerable_cases} abstain_unans=${pct(s.correct_abstention_unanswerable)} of ${s.unanswerable_cases} off=${pct(s.correct_off)} avg=${s.avg_claims_when_returned.toFixed(2)} governed=${s.all_governed} leaks=${s.boundary_leaks.length}`);
    if (s.decisions_wrong.length) console.log(`   decisions wrong: ${s.decisions_wrong.join(', ')}`);
    if (s.coverage_missed.length) console.log(`   coverage missed: ${s.coverage_missed.join(', ')}`);
  }
  const j = summary.judge;
  if (summary.candidate_recall) console.log(`candidate recall: cases ${summary.candidate_recall.cases_with_useful_in_pool}/${summary.candidate_recall.cases} claims ${summary.candidate_recall.useful_claims_in_pool}/${summary.candidate_recall.useful_claims} avg_pool=${summary.avg_pool.toFixed(1)} missed=${summary.candidate_recall.missed_cases.join(',')}`);
  console.log(`judge: calls=${j.calls} statuses=${JSON.stringify(j.statuses)} lat med=${j.latency_ms.median} p95=${j.latency_ms.p95} avg_cand=${j.avg_candidates.toFixed(1)} guard=${j.guard_added.join(',') || 'none'} run_cost=$${(ledger.usd - startUsd).toFixed(4)} ledger=$${ledger.usd.toFixed(4)}`);
  console.log(`wrote ${path.relative(ROOT, path.join(args.outDir, `judge-eval-${tag}.json`))}`);
}

function renderPoolSheet(rows) {
  const L = ['# Judge candidate pools (for hand labeling)', ''];
  for (const r of rows) {
    L.push(`## ${r.id} · ${r.category} · decision=${r.decision.retrieve ? 'retrieve' : 'off'} (${r.decision.reason})`, '', `> ${r.question}`, '', `Need: ${r.need || '—'}`, '');
    r.pool.forEach((c, i) => L.push(`${i + 1}. \`${c.claim_id}\` [${c.relevance.tier}, ${c.direction_group}, ${c.source.evidence_type || '—'} ${c.source.year || ''}]${r.A.claims.some((a) => a.claim_id === c.claim_id) ? ' (A)' : ''} ${c.claim_text.replace(/\s+/g, ' ')}`));
    L.push('');
  }
  return L.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
