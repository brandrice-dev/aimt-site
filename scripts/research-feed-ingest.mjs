#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   Research Library — research-feed -> canonical ingestion poller
   ---------------------------------------------------------------
   The missing link between the research worker and the live library.

     research worker -> aimt-research-feed/inbox/*.json (packets)
       -> THIS SCRIPT: validate packet, drop superseded, skip batches
          already ingested, translate (functions/_lib/research/
          packet-adapter.mjs)
       -> functions/_lib/research/ingest-request.mjs#processIngestionBatch
          (the SAME canonical pipeline /api/research-ingest and the MCP
          submit_research_batch tool use: JS validation, quarantine,
          orphan check, AIMT_APPROVED refusal/protection, ingestion log)
       -> Supabase research_* tables

   Never writes SQL, never bypasses processIngestionBatch, never sets
   AIMT_APPROVED / public_eligible / published, never edits, moves or
   deletes a packet. Idempotent: a batch_id already recorded in
   research_ingestion_log as success/partial is skipped, so re-running on
   an unchanged inbox is a no-op. A failed batch is retried next run.

   A claim-ownership guard additionally refuses any packet that would
   overwrite claims owned by a different feed batch unless it explicitly
   declares itself a re-test of that batch (see ownershipConflicts).

   Usage:
     node scripts/research-feed-ingest.mjs --inbox <dir> [--dry-run] [--only <batch_id>] [--json-out <file>] [--quiet]
       --quiet   print aggregate counts only (for PUBLIC CI logs; the feed repo is private)
   Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (never printed).
   Run on a schedule by .github/workflows/aimt-research-feed-ingest.yml.
   ═══════════════════════════════════════════════════════════════ */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePacket, findSuperseded, packetToBatch, FEED_SOURCE_SYSTEM } from '../functions/_lib/research/packet-adapter.mjs';
import { processIngestionBatch, logIngestEvent } from '../functions/_lib/research/ingest-request.mjs';
import {
  RESEARCH_GAP_LANE, verifyResearchGapForSubmission, hasRelevantVerifiedClaim, markGapResearchReceivedById,
} from '../functions/_lib/education-ops/education-research-gap-queue.mjs';

const LOG_SOURCE = 'research-feed-poller';

function parseArgs(argv) {
  const a = { inbox: null, dryRun: false, only: null, jsonOut: null, quiet: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--inbox') a.inbox = argv[++i];
    else if (argv[i] === '--dry-run') a.dryRun = true;
    else if (argv[i] === '--only') a.only = argv[++i];
    else if (argv[i] === '--json-out') a.jsonOut = argv[++i];
    else if (argv[i] === '--quiet') a.quiet = true;
  }
  return a;
}

function headers(env) {
  return { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` };
}

async function getJson(env, pathAndQuery, fetchImpl) {
  const res = await fetchImpl(`${env.SUPABASE_URL}/rest/v1/${pathAndQuery}`, { headers: headers(env) });
  if (!res.ok) throw new Error(`GET ${pathAndQuery.split('?')[0]} failed: HTTP ${res.status}`);
  return res.json();
}

/** batch_ids already successfully (or partially) ingested. */
export async function alreadyIngested(env, batchIds, fetchImpl = fetch) {
  if (!batchIds.length) return new Set();
  const list = batchIds.map((b) => `"${String(b).replace(/"/g, '')}"`).join(',');
  const rows = await getJson(env, `research_ingestion_log?select=batch_id,status&batch_id=in.(${encodeURIComponent(list)})&status=in.(success,partial)`, fetchImpl);
  return new Set(rows.map((r) => r.batch_id));
}

/** lowercased DOI -> existing source_id, for every library source that has a DOI. */
export async function existingDoiMap(env, fetchImpl = fetch) {
  const out = new Map();
  for (let offset = 0; ; offset += 1000) {
    const rows = await getJson(env, `research_sources?select=source_id,doi&doi=not.is.null&order=source_id.asc&limit=1000&offset=${offset}`, fetchImpl);
    for (const r of rows) out.set(String(r.doi).toLowerCase(), r.source_id);
    if (rows.length < 1000) break;
  }
  return out;
}

/* A packet answering an AIMT publication evidence-gap names the gap's id
   in research_reason (Grok instructions, gap step 6). Ids are
   deterministic: `${RESEARCH_GAP_LANE}:<topic-slug>`. */
const GAP_ID_RE = new RegExp(`${RESEARCH_GAP_LANE}:[a-z0-9-]+`);
export function declaredResearchGapId(packet) {
  const m = GAP_ID_RE.exec(String((packet && packet.research_reason) || ''));
  return m ? m[0] : null;
}

/**
 * Research-gap link for a feed-delivered packet -- the SAME gate the MCP
 * submit_research_batch tool applies (functions/api/mcp.js), using the
 * same education-research-gap-queue.mjs functions: a declared gap is
 * marked research_received ONLY if it verifies as linkable AND the
 * canonical pipeline actually accepted at least one relevant
 * CLAIM_VERIFIED claim. Never blocks or alters ingestion itself.
 */
export async function linkResearchGap(env, gapId, result, { verify = verifyResearchGapForSubmission, mark = markGapResearchReceivedById } = {}) {
  let gapRow = null;
  try {
    const v = await verify(env, gapId);
    if (!v.ok) return `SKIPPED_${v.reason}`;
    gapRow = v.row;
  } catch (_e) {
    return 'SKIPPED_VERIFICATION_FAILED';
  }
  if (!hasRelevantVerifiedClaim(result.processedClaims, gapRow.extras && gapRow.extras.controlled_topics)) {
    return (result.accepted && result.accepted.claims > 0) ? 'SKIPPED_NO_RELEVANT_VERIFIED_CLAIM' : 'SKIPPED_NOTHING_ACCEPTED';
  }
  try {
    const marked = await mark(env, gapId, { researchBatchId: result.batch_id });
    return marked.ok ? 'RESEARCH_RECEIVED' : `SKIPPED_${marked.reason}`;
  } catch (_e) {
    return 'SKIPPED_TRANSITION_FAILED';
  }
}

/**
 * Existing research_claims rows for these ids -> the feed batch that owns
 * each one (extras.packet_batch_id; null for non-feed library claims).
 */
export async function claimOwners(env, claimIds, fetchImpl = fetch) {
  const out = new Map();
  for (let i = 0; i < claimIds.length; i += 100) {
    const list = claimIds.slice(i, i + 100).map((c) => `"${String(c).replace(/"/g, '')}"`).join(',');
    const rows = await getJson(env, `research_claims?select=claim_id,owner:extras->>packet_batch_id&claim_id=in.(${encodeURIComponent(list)})`, fetchImpl);
    for (const r of rows) out.set(r.claim_id, r.owner || null);
  }
  return out;
}

/**
 * Claim-ownership guard. A packet may create new claims or update claims
 * it already owns; it may overwrite claims owned by ANOTHER feed batch
 * only when it explicitly declares itself a re-test of that batch (names
 * the owning batch_id in research_reason / verification.notes). This is
 * what stops an older, superseded packet from ever being ingested over a
 * newer one -- e.g. if the newer packet is later moved to archive/ and so
 * no longer visible in inbox/ for supersession detection. Claims that
 * exist without a feed owner (the curated library) are never overwritten.
 * @returns {string[]} human-readable conflicts (empty = safe to ingest)
 */
export function ownershipConflicts(packet, batch, owners) {
  const declared = `${packet.research_reason || ''} ${(packet.verification && packet.verification.notes) || ''}`;
  const conflicts = [];
  for (const c of batch.claims) {
    if (!owners.has(c.claim_id)) continue;
    const owner = owners.get(c.claim_id);
    if (owner === packet.batch_id) continue;
    if (owner && declared.includes(owner)) continue;
    conflicts.push(`${c.claim_id} owned by ${owner || 'non-feed library record'}`);
  }
  return conflicts;
}

export function loadInbox(inboxDir) {
  const files = readdirSync(inboxDir).filter((f) => f.endsWith('.json')).sort();
  return files.map((f) => {
    const rel = path.join('inbox', f);
    try {
      return { file: rel, packet: JSON.parse(readFileSync(path.join(inboxDir, f), 'utf8')) };
    } catch (e) {
      return { file: rel, packet: null, parseError: String(e && e.message || e) };
    }
  });
}

/**
 * One poll cycle. Returns a per-packet report. `ingest` defaults to the
 * canonical processIngestionBatch; tests inject a stub.
 */
export async function runFeedIngest({ env, inboxDir, dryRun = false, only = null, fetchImpl = fetch, ingest = processIngestionBatch, log = logIngestEvent, gapLink = linkResearchGap }) {
  const entries = loadInbox(inboxDir);
  const report = { dry_run: dryRun, inbox_files: entries.length, packets: [] };
  const valid = [];
  for (const e of entries) {
    if (!e.packet) {
      report.packets.push({ file: e.file, action: 'invalid', errors: [`unparseable JSON: ${e.parseError}`] });
      if (!dryRun) await log(env, LOG_SOURCE, 'research_feed_packet_invalid', `${e.file}_unparseable`);
      continue;
    }
    const v = validatePacket(e.packet);
    if (!v.ok) {
      report.packets.push({ file: e.file, batch_id: e.packet.batch_id || null, action: 'invalid', errors: v.errors });
      if (!dryRun) await log(env, LOG_SOURCE, 'research_feed_packet_invalid', `${e.packet.batch_id || e.file}_${v.errors.length}_errors`);
      continue;
    }
    valid.push({ ...e, warnings: v.warnings });
  }

  const superseded = findSuperseded(valid.map((e) => e.packet));
  const candidates = valid
    .filter((e) => !only || e.packet.batch_id === only)
    .sort((a, b) => Date.parse(a.packet.researched_at) - Date.parse(b.packet.researched_at));
  const done = await alreadyIngested(env, candidates.map((e) => e.packet.batch_id), fetchImpl);
  const doiMap = await existingDoiMap(env, fetchImpl);

  for (const e of candidates) {
    const id = e.packet.batch_id;
    const base = { file: e.file, batch_id: id, researched_at: e.packet.researched_at, research_topic: e.packet.research_topic, warnings: e.warnings };
    if (superseded.has(id)) { report.packets.push({ ...base, action: 'skipped_superseded', superseded_by: superseded.get(id) }); continue; }
    if (done.has(id)) { report.packets.push({ ...base, action: 'skipped_already_ingested' }); continue; }
    const { batch, stats } = packetToBatch(e.packet, { existingSourceIdByDoi: doiMap, packetFile: e.file });
    const conflicts = ownershipConflicts(e.packet, batch, await claimOwners(env, batch.claims.map((c) => c.claim_id), fetchImpl));
    if (conflicts.length) {
      report.packets.push({ ...base, action: 'skipped_claim_ownership_conflict', conflicts: conflicts.slice(0, 20) });
      if (!dryRun) await log(env, LOG_SOURCE, 'research_feed_packet_ownership_conflict', `${id}_${conflicts.length}_claims`);
      continue;
    }
    if (dryRun) { report.packets.push({ ...base, action: 'would_ingest', stats }); continue; }
    try {
      const result = await ingest(env, batch, { triggeredBy: LOG_SOURCE, defaultSourceSystem: FEED_SOURCE_SYSTEM });
      if (!result || result.ok !== true) {
        report.packets.push({ ...base, action: 'rejected', stats, error: result && result.error });
        await log(env, LOG_SOURCE, 'research_feed_packet_rejected', `${id}_${result && result.error}`);
        continue;
      }
      const gapId = declaredResearchGapId(e.packet);
      const researchGapTransition = gapId ? await gapLink(env, gapId, result) : null;
      report.packets.push({
        ...base, action: 'ingested', stats,
        result: { status: result.status, inserted: result.inserted, updated: result.updated, quarantined: result.quarantined },
        research_gap_id: gapId, research_gap_transition: researchGapTransition,
      });
      await log(env, LOG_SOURCE, 'research_feed_packet_ingested', `${id}_${result.status}`);
      if (gapId) await log(env, LOG_SOURCE, 'research_feed_gap_link', `${gapId}_${researchGapTransition}`);
    } catch (err) {
      report.packets.push({ ...base, action: 'failed', stats, error: String(err && err.message || err).slice(0, 300) });
      await log(env, LOG_SOURCE, 'research_feed_packet_failed', `${id}`);
    }
  }
  report.summary = report.packets.reduce((m, p) => { m[p.action] = (m[p.action] || 0) + 1; return m; }, {});
  return report;
}

/**
 * Public-CI-safe output: aggregate counts only. The feed repository is
 * private, so file names, batch ids, topics and error text are never
 * printed; per-packet detail lives in research_ingestion_log / aimt_logs.
 */
export function quietLines(report) {
  const lines = [JSON.stringify({ dry_run: report.dry_run, inbox_files: report.inbox_files, summary: report.summary })];
  const attention = ['invalid', 'rejected', 'skipped_claim_ownership_conflict', 'failed']
    .filter((k) => report.summary && report.summary[k]).map((k) => `${k}=${report.summary[k]}`);
  if (attention.length) lines.push(`::warning::Research feed packets need attention (${attention.join(', ')}); see aimt_logs source=${LOG_SOURCE}.`);
  return lines;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.inbox) { console.error('--inbox <dir> is required'); process.exit(2); }
  const env = { SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY };
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) { console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'); process.exit(2); }
  const report = await runFeedIngest({ env, inboxDir: args.inbox, dryRun: args.dryRun, only: args.only });
  const text = JSON.stringify(report, null, 2);
  if (args.jsonOut) writeFileSync(args.jsonOut, text);
  if (args.quiet) {
    for (const line of quietLines(report)) console.log(line);
  } else {
    console.log(text);
  }
  // Infrastructure failures fail the run (so a scheduled job surfaces
  // them); invalid packets are governed outcomes, reported but not fatal.
  if (report.packets.some((p) => p.action === 'failed')) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(String(e && e.message || e)); process.exit(1); });
}
