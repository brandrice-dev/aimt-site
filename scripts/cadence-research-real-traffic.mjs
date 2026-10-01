#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   Ask Cadence research — REAL-TRAFFIC shadow validation (offline)
   ---------------------------------------------------------------
   Validates the narrow scope (research-scope.mjs, families A and B)
   against real persisted Ask Cadence student messages. Code under test
   is frozen before any message is read; nothing here tunes it.

   PRIVACY: raw student text and anything identifying stay under
   research-import/private/ (gitignored). Only anonymized case ids,
   categories, claim ids and aggregates are written by `report`.
   No user id, email or name is ever written, even privately.

   READ-ONLY: transcript reads are PostgREST GETs on cadence_messages /
   cadence_threads only, through a guard that refuses anything else.
   Research reads use the existing research read-only guard. The only
   POST is the Haiku judge call (question + governed candidates).

   COST: hard $1.00 cap for this validation in its own ledger.

   Usage:
     node scripts/cadence-research-real-traffic.mjs extract
     node scripts/cadence-research-real-traffic.mjs run
     node scripts/cadence-research-real-traffic.mjs report --labels research-import/private/real-traffic/labels.json
   ═══════════════════════════════════════════════════════════════ */

import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { retrieveCadenceResearchContext, decideResearchRetrieval, RESEARCH_CONTEXT_LIMITS } from '../functions/_lib/cadence/research-context.mjs';
import { judgeResearchCandidates, buildJudgeRequest, JUDGE_MODEL_DEFAULT, JUDGE_PROMPT_VERSION, JUDGE_LIMITS } from '../functions/_lib/cadence/research-judge.mjs';
import { classifyResearchScope } from '../functions/_lib/cadence/research-scope.mjs';
import { createReadOnlyFetch } from './cadence-research-shadow/read-only-fetch.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRIV = path.join(ROOT, 'research-import/private/real-traffic');
const CAP_USD = 1.0;
const PRICE = { input: 1 / 1e6, output: 5 / 1e6 };
const GOVERNED = new Set(['CLAIM_VERIFIED', 'AIMT_APPROVED']);

/** GET-only guard for the two transcript tables. */
export function createTranscriptReadOnlyFetch(supabaseUrl, fetchImpl = fetch) {
  const origin = new URL(supabaseUrl).origin;
  return async (url, init = {}) => {
    const u = new URL(url);
    const method = String(init.method || 'GET').toUpperCase();
    const ok = u.origin === origin && method === 'GET' && init.body === undefined
      && /^\/rest\/v1\/(cadence_messages|cadence_threads)$/.test(u.pathname)
      && !/return=|resolution=/.test(JSON.stringify(init.headers || {}));
    if (!ok) throw Object.assign(new Error('transcript read-only guard refused request'), { code: 'read_only_violation' });
    return fetchImpl(url, { ...init, method: 'GET' });
  };
}

function env() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) { console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(2); }
  return { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY };
}

async function extract() {
  const e = env();
  const ro = createTranscriptReadOnlyFetch(e.SUPABASE_URL);
  const headers = { apikey: e.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${e.SUPABASE_SERVICE_ROLE_KEY}` };
  const page = async (table, select, extra = '') => {
    const out = [];
    for (let off = 0; ; off += 1000) {
      const res = await ro(`${e.SUPABASE_URL}/rest/v1/${table}?select=${select}${extra}&order=created_at.desc&limit=1000&offset=${off}`, { headers });
      if (!res.ok) throw new Error(`${table} read failed: HTTP ${res.status}`);
      const rows = await res.json();
      out.push(...rows);
      if (rows.length < 1000) break;
    }
    return out;
  };
  // Deliberately NOT selecting user_id or any profile field.
  const threads = await page('cadence_threads', 'id,module_id');
  const msgs = await page('cadence_messages', 'id,thread_id,mode,role,content,checkpoint_id,created_at', '&role=eq.user');
  mkdirSync(PRIV, { recursive: true });
  const saltPath = path.join(PRIV, '.salt');
  if (!existsSync(saltPath)) writeFileSync(saltPath, randomBytes(16).toString('hex'));
  const salt = readFileSync(saltPath, 'utf8');
  const moduleOf = new Map(threads.map((t) => [t.id, String(t.module_id)]));
  const rows = msgs.map((m) => ({
    case_id: 'rq-' + createHash('sha256').update(salt + m.id).digest('hex').slice(0, 10),
    mode: m.mode, module_id: moduleOf.get(m.thread_id) ?? null, has_checkpoint: !!m.checkpoint_id,
    created_at: m.created_at, question: m.content,
  })).sort((a, b) => (a.case_id < b.case_id ? -1 : 1));
  writeFileSync(path.join(PRIV, 'messages.json'), JSON.stringify(rows, null, 1));
  const byMode = rows.reduce((o, r) => ((o[r.mode] = (o[r.mode] || 0) + 1), o), {});
  console.log(`extracted ${rows.length} user messages (${JSON.stringify(byMode)}) from ${threads.length} threads -> research-import/private/real-traffic/messages.json`);
}

/* Historical messages carry no server-verified checkpoint status, so any
   checkpoint/remediation-mode message is treated as an OPEN checkpoint
   ('unknown' -> fail closed), and Module 12 as assessment-state-unknown. */
function decisionContextFor(r) {
  const ctx = { moduleId: r.module_id ?? undefined };
  if (r.mode !== 'ask_cadence' || r.has_checkpoint) { ctx.activeCheckpointId = 'historical'; ctx.verifiedCheckpointStatus = 'unknown'; }
  return ctx;
}

function ledgerLoad() { try { return JSON.parse(readFileSync(path.join(PRIV, 'ledger.json'), 'utf8')); } catch { return { calls: 0, input_tokens: 0, output_tokens: 0, usd: 0 }; } }

async function run() {
  const e = env();
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_PUBLICATION_EDITOR_API_KEY || '';
  if (!apiKey) { console.error('no locally configured Anthropic key; stopping'); process.exit(2); }
  const rows = JSON.parse(readFileSync(path.join(PRIV, 'messages.json'), 'utf8'));
  const fetchImpl = createReadOnlyFetch(e.SUPABASE_URL);
  const ledger = ledgerLoad();
  const out = [];
  // Deterministic order (anonymized id). If the budget cannot cover every
  // in-scope question, the remainder is skipped in this order and reported.
  for (const r of rows) {
    const ctx = decisionContextFor(r);
    const decision = decideResearchRetrieval(r.question, ctx);
    const scope = classifyResearchScope(r.question, decision);
    const rec = { case_id: r.case_id, mode: r.mode, module_id: r.module_id, decision: { eligible: decision.eligible, retrieve: decision.retrieve, reason: decision.reason, concepts: decision.concepts, intents: decision.intents, high_stakes: decision.signals.high_stakes, injection_suspected: decision.signals.injection_suspected }, scope, pool: [], final: [], judge: null };
    if (scope.family) {
      const t0 = Date.now();
      const ret = await retrieveCadenceResearchContext({ question: r.question, env: e, decisionContext: ctx, fetchImpl, candidateLimit: RESEARCH_CONTEXT_LIMITS.MAX_JUDGE_CANDIDATES });
      rec.retrieval_ms = Date.now() - t0;
      rec.retrieval_status = ret.status;
      rec.pool = (ret.judge_candidates || []).map((c) => ({ claim_id: c.claim_id, verification_status: c.verification_status, direction_group: c.direction_group, tier: c.relevance.tier, claim_text: c.claim_text }));
      if (rec.pool.length) {
        const req = buildJudgeRequest(r.question, ret.judge_candidates);
        const worst = Math.ceil(JSON.stringify(req.body).length / 3) * PRICE.input + JUDGE_LIMITS.MAX_OUTPUT_TOKENS * PRICE.output;
        if (ledger.usd + worst > CAP_USD) { rec.judge = { status: 'budget_skip' }; out.push(rec); continue; }
        const j = await judgeResearchCandidates({ question: r.question, candidates: ret.judge_candidates, apiKey, questionIntents: decision.intents });
        const cost = j.usage ? j.usage.input_tokens * PRICE.input + j.usage.output_tokens * PRICE.output : 0;
        ledger.calls++; ledger.usd += cost;
        if (j.usage) { ledger.input_tokens += j.usage.input_tokens; ledger.output_tokens += j.usage.output_tokens; }
        writeFileSync(path.join(PRIV, 'ledger.json'), JSON.stringify(ledger, null, 2));
        rec.judge = { status: j.status, error_code: j.error_code || null, use_research: j.use_research ?? null, selected: j.selected, elapsed_ms: j.elapsed_ms, usage: j.usage, cost_usd: cost, guard_added: j.guard_added };
        rec.final = j.claims.map((c) => ({ claim_id: c.claim_id, verification_status: c.verification_status, direction_group: c.direction_group, support: c.judge_support, claim_text: c.claim_text }));
      }
    }
    out.push(rec);
  }
  writeFileSync(path.join(PRIV, 'results.json'), JSON.stringify({ generated_at: new Date().toISOString(), model: JUDGE_MODEL_DEFAULT, prompt_version: JUDGE_PROMPT_VERSION, ledger, results: out }, null, 1));
  const inScope = out.filter((r) => r.scope.family);
  console.log(`messages=${out.length} in_scope=${inScope.length} (A=${inScope.filter((r) => r.scope.family === 'A').length}, B=${inScope.filter((r) => r.scope.family === 'B').length}) judge_calls=${inScope.filter((r) => r.judge && r.judge.usage).length} budget_skips=${inScope.filter((r) => r.judge && r.judge.status === 'budget_skip').length} ledger=$${ledger.usd.toFixed(4)}`);
}

/* Hand labels (private): { cases: { <case_id>: { true_family: 'A'|'B'|null,
   control_kind?: string, should_research: bool, answerable: bool,
   useful_ids: [claim ids], mixed_needed?: bool, note?: string } } }   */
function report(labelsPath) {
  const { results, ledger, model, prompt_version, generated_at } = JSON.parse(readFileSync(path.join(PRIV, 'results.json'), 'utf8'));
  const labels = JSON.parse(readFileSync(labelsPath, 'utf8')).cases;
  const fam = (f) => {
    const rows = results.filter((r) => labels[r.case_id] && labels[r.case_id].true_family === f);
    const sel = rows.flatMap((r) => r.final.map((c) => ({ r, c, useful: (labels[r.case_id].useful_ids || []).includes(c.claim_id) })));
    const answerable = rows.filter((r) => labels[r.case_id].should_research && labels[r.case_id].answerable);
    const unanswerable = rows.filter((r) => labels[r.case_id].should_research && !labels[r.case_id].answerable);
    const researchUsed = (r) => r.final.length > 0;
    const decisionOk = (r) => {
      const L = labels[r.case_id];
      const shouldUse = L.should_research && L.answerable;
      return researchUsed(r) === shouldUse;
    };
    return {
      cases: rows.length,
      routed_to_family: rows.filter((r) => r.scope.family === f).length,
      routed_elsewhere: rows.filter((r) => r.scope.family !== f).map((r) => `${r.case_id}:${r.scope.family || r.scope.reason}`),
      selected_claims: sel.length, useful_claims: sel.filter((x) => x.useful).length,
      usefulness: sel.length ? sel.filter((x) => x.useful).length / sel.length : null,
      answerable: answerable.length,
      covered: answerable.filter((r) => r.final.some((c) => (labels[r.case_id].useful_ids || []).includes(c.claim_id))).length,
      coverage: answerable.length ? answerable.filter((r) => r.final.some((c) => (labels[r.case_id].useful_ids || []).includes(c.claim_id))).length / answerable.length : null,
      decision_accuracy: rows.length ? rows.filter(decisionOk).length / rows.length : null,
      decisions_wrong: rows.filter((r) => !decisionOk(r)).map((r) => r.case_id),
      unanswerable: unanswerable.length,
      abstention_accuracy: unanswerable.length ? unanswerable.filter((r) => !researchUsed(r)).length / unanswerable.length : null,
      all_governed: sel.every((x) => GOVERNED.has(x.c.verification_status)),
      mixed_needed: rows.filter((r) => labels[r.case_id].mixed_needed).map((r) => ({ id: r.case_id, groups: [...new Set(r.final.map((c) => c.direction_group))] })),
      per_case: rows.map((r) => ({ case_id: r.case_id, routed: r.scope.family || `off:${r.scope.reason}`, judge: r.judge ? r.judge.status : 'not_called',
        selected: r.final.map((c) => `${c.claim_id}${(labels[r.case_id].useful_ids || []).includes(c.claim_id) ? '' : ' (not useful)'}`),
        answerable: labels[r.case_id].answerable, note: labels[r.case_id].note || '' })),
    };
  };
  const controls = results.filter((r) => labels[r.case_id] && labels[r.case_id].true_family === null);
  const boundary = results.filter((r) => !r.decision.eligible);
  const ms = results.filter((r) => r.judge && r.judge.elapsed_ms).map((r) => r.judge.elapsed_ms + (r.retrieval_ms || 0)).sort((a, b) => a - b);
  const rep = {
    generated_at: new Date().toISOString(), results_generated_at: generated_at, model, prompt_version,
    messages_available: results.length,
    by_mode: results.reduce((o, r) => ((o[r.mode] = (o[r.mode] || 0) + 1), o), {}),
    family_A: fam('A'), family_B: fam('B'),
    controls: {
      cases: controls.length,
      by_kind: controls.reduce((o, r) => { const k = labels[r.case_id].control_kind || 'other'; o[k] = (o[k] || 0) + 1; return o; }, {}),
      research_used: controls.filter((r) => r.final.length).map((r) => r.case_id),
      false_positive_rate: controls.length ? controls.filter((r) => r.final.length).length / controls.length : null,
      routed_into_family: controls.filter((r) => r.scope.family).map((r) => `${r.case_id}:${r.scope.family}`),
    },
    boundary: { ineligible_cases: boundary.length, reasons: boundary.reduce((o, r) => ((o[r.decision.reason] = (o[r.decision.reason] || 0) + 1), o), {}), any_research: boundary.some((r) => r.final.length || r.pool.length) },
    injection_suspected: results.filter((r) => r.decision.injection_suspected).map((r) => ({ id: r.case_id, research_used: r.final.length > 0, ungoverned: r.final.filter((c) => !GOVERNED.has(c.verification_status)).length })),
    trust: { every_final_claim_governed: results.every((r) => r.final.every((c) => GOVERNED.has(c.verification_status))), every_pool_claim_governed: results.every((r) => r.pool.every((c) => GOVERNED.has(c.verification_status))) },
    judge: { calls: results.filter((r) => r.judge && r.judge.usage).length, failures: results.filter((r) => r.judge && !['ok', 'abstained', 'budget_skip'].includes(r.judge.status)).map((r) => `${r.case_id}:${r.judge.error_code}`), budget_skips: results.filter((r) => r.judge && r.judge.status === 'budget_skip').length, latency_ms: { median: ms[Math.ceil(ms.length / 2) - 1] ?? null, p95: ms[Math.ceil(ms.length * 0.95) - 1] ?? null } },
    cost: { usd: ledger.usd, input_tokens: ledger.input_tokens, output_tokens: ledger.output_tokens, calls: ledger.calls, cap_usd: CAP_USD },
  };
  mkdirSync(path.join(ROOT, 'docs/research/cadence-research-shadow/judge'), { recursive: true });
  const out = path.join(ROOT, 'docs/research/cadence-research-shadow/judge/real-traffic-validation-2026-10-01.json');
  writeFileSync(out, JSON.stringify(rep, null, 2));
  console.log(`wrote ${path.relative(ROOT, out)} (anonymized; no student text)`);
  return rep;
}

const cmd = process.argv[2];
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const li = process.argv.indexOf('--labels');
  (cmd === 'extract' ? extract() : cmd === 'run' ? run() : cmd === 'report' ? Promise.resolve(report(path.resolve(ROOT, process.argv[li + 1]))) : Promise.reject(new Error('usage: extract | run | report --labels <file>')))
    .catch((err) => { console.error(err.message); process.exit(1); });
}
