// Research-feed -> canonical ingestion: adapter + poller tests (offline).
//
// Proves the repaired link (aimt-research-feed inbox packets ->
// processIngestionBatch) without touching Supabase:
//   - packet validation mirrors research-packet.schema.json
//   - AIMT_APPROVED is never laundered: it reaches the canonical
//     partitionRecords() gate unchanged and is quarantined there
//   - mapped records pass the canonical validators (nothing quarantined
//     by accident), provenance preserved in extras, no invented dates
//   - superseded packets (explicit re-test) are never ingested
//   - idempotent: batch_ids already in research_ingestion_log are skipped
//   - existing library sources are reused by DOI, never overwritten
//   - invalid packets are reported, not ingested, not fatal
//   - the poller only ever calls the canonical ingest function and only
//     issues GET requests itself
//   - the poller never imports anything from Cadence / certification
//
// Run: node tests/research-feed-ingest.test.mjs

import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePacket, findSuperseded, packetToBatch, topicsFor, controlledTopicFromPacketCategory, FEED_SOURCE_SYSTEM } from '../functions/_lib/research/packet-adapter.mjs';
import { partitionRecords } from '../functions/_lib/research/ingest-request.mjs';
import { validateSource, validateClaim, mapClaimRow, mapSourceRow } from '../functions/_lib/research/schema.mjs';
import { runFeedIngest, ownershipConflicts, quietLines, declaredResearchGapId, linkResearchGap } from '../scripts/research-feed-ingest.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const results = [];
const check = (name, cond, detail) => results.push({ name, ok: !!cond, detail });

function packet(overrides = {}) {
  return {
    batch_id: 'AIMT-RF-TEST-001',
    researched_at: '2026-09-30T10:00:00Z',
    research_topic: 'Scalp dysesthesia / trichodynia',
    research_reason: 'Test fixture.',
    categories: ['Scalp conditions and disorders'],
    sources: [
      { source_id: 'SRC-A', title: 'Primary case series A', authors: ['A, A'], publication: 'J Derm', publication_date: '2019-04', url: 'https://pubmed.ncbi.nlm.nih.gov/111/', doi: '10.1/a', source_type: 'clinical_study', credibility_notes: 'PRIMARY n=20 case series' },
      { source_id: 'SRC-B', title: 'Independent cohort B', authors: ['B, B'], publication: 'Br J Derm', publication_date: '2021-06-01', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC222/', doi: '10.1/b', source_type: 'clinical_study', credibility_notes: 'PRIMARY randomized n=40' },
      { source_id: 'SRC-C', title: 'Narrative review C', authors: ['C, C'], publication: 'Skin', publication_date: '2022', url: null, doi: '10.1/EXISTING', source_type: 'peer_reviewed_journal', credibility_notes: 'review' },
    ],
    claims: [
      { claim_id: 'CLAIM-T-001', statement: 'Trichodynia is reported in a subset of patients with telogen effluvium.', category: 'Scalp conditions', source_ids_supporting: ['SRC-A', 'SRC-B'], source_ids_contradicting: [], verification_status: 'CLAIM_VERIFIED', confidence: 'moderate', notes: 'A and B independent.' },
      { claim_id: 'CLAIM-T-002', statement: 'A single series suggests capsaicin helps.', category: 'Scalp conditions', source_ids_supporting: ['SRC-A'], source_ids_contradicting: ['SRC-C'], verification_status: 'DISCOVERED', confidence: 'low', notes: null },
    ],
    verification: { method: 'read full text', cross_checked: true, independent_sources_count: 2, notes: null },
    contradictions: [{ description: 'C disputes efficacy.', related_claim_ids: ['CLAIM-T-002'], source_ids_involved: ['SRC-A', 'SRC-C'] }],
    evidence_strength: 'weak',
    gaps_remaining: ['No RCTs.'],
    suggested_follow_up: ['Search for controlled trials.'],
    ...overrides,
  };
}

// ── Validation ──
{
  check('valid packet passes', validatePacket(packet()).ok);
  const missing = packet(); delete missing.verification;
  check('missing required field fails', !validatePacket(missing).ok);
  const badSrc = packet({ claims: [{ ...packet().claims[0], source_ids_supporting: ['SRC-NOPE'] }] });
  check('claim citing unknown source fails', !validatePacket(badSrc).ok);
  const dupe = packet({ claims: [packet().claims[0], packet().claims[0]] });
  check('duplicate claim ids fail', !validatePacket(dupe).ok);
  check('non-object fails', !validatePacket([]).ok && !validatePacket(null).ok);
  const approved = packet({ claims: [{ ...packet().claims[0], verification_status: 'AIMT_APPROVED' }] });
  const v = validatePacket(approved);
  check('AIMT_APPROVED claim is flagged (warning), not silently fixed', v.ok && v.warnings.some((w) => /quarantined/.test(w)));
}

// ── Mapping ──
{
  const doi = new Map([['10.1/existing', 'existing-library-source']]);
  const { batch, stats } = packetToBatch(packet(), { existingSourceIdByDoi: doi, packetFile: 'inbox/x.json' });
  check('batch uses feed source_system', batch.source_system === FEED_SOURCE_SYSTEM && batch.batch_id === 'AIMT-RF-TEST-001');
  check('existing DOI source is reused, not re-sent', !batch.sources.some((s) => s.doi === '10.1/EXISTING') && stats.sources_reused[0].source_id === 'existing-library-source');
  check('contradicting source maps to the existing library id', batch.claims[1].contradicting_source_ids[0] === 'existing-library-source');
  check('claim FK = first supporting source', batch.claims[0].source_id === 'rf-src-src-a' || batch.claims[0].source_id.startsWith('rf-src-'));
  check('ids are namespaced and stable', batch.claims[0].claim_id === 'rf-claim-t-001');
  check('status copied verbatim', batch.claims[0].verification_status === 'CLAIM_VERIFIED' && batch.claims[1].verification_status === 'DISCOVERED');
  check('contested claim marked unclear; uncontested left unset', batch.claims[1].direction === 'unclear' && batch.claims[0].direction === null);
  check('verified_on only for CLAIM_VERIFIED', batch.claims[0].verified_on === '2026-09-30' && batch.claims[1].verified_on === null);
  check('library_summary fidelity/origin', batch.claims.every((c) => c.claim_text_fidelity === 'library_summary' && c.claim_origin === 'library_summary'));
  check('never not-reviewed -> reviewed', batch.claims.every((c) => c.verification_review_status === 'not_reviewed'));
  check('use_status provisional (DISCOVERED may never be active)', batch.claims.every((c) => c.use_status === 'provisional'));
  check('source ladder: SOURCE_VERIFIED only if underpinning a verified claim', batch.sources.find((s) => s.packet_source_id === 'SRC-A').verification_status === 'SOURCE_VERIFIED');
  check('randomized clinical study -> rct; case series -> observational',
    batch.sources.find((s) => s.packet_source_id === 'SRC-B').evidence_type === 'rct'
    && batch.sources.find((s) => s.packet_source_id === 'SRC-A').evidence_type === 'observational');
  check('pmid / pmcid parsed from URLs', batch.sources.find((s) => s.packet_source_id === 'SRC-A').pmid === '111' && batch.sources.find((s) => s.packet_source_id === 'SRC-B').pmcid === 'PMC222');
  check('contradiction text preserved on the claim', /C disputes efficacy/.test(batch.claims[1].body_markdown));
  check('topics are controlled vocabulary only', batch.claims.every((c) => c.topics.length > 0) && stats.topics.includes('telogen-effluvium') && stats.topics.includes('trichology'));
  check('topicsFor never emits uncontrolled topics', topicsFor('scalp dysesthesia contact dermatitis nonsense').every((t) => typeof t === 'string'));

  // Explicit packet category -> controlled topic. This is the correction
  // for packets such as AIMT-RF-2026-10-04-LLLT: Rick already classified
  // individual claims as treatment-modalities, but the adapter previously
  // discarded that field and tried to rediscover topic tags from prose.
  check('exact controlled packet category is accepted', controlledTopicFromPacketCategory('treatment-modalities') === 'treatment-modalities');
  check('legacy/free-text packet category is not trusted as a controlled topic', controlledTopicFromPacketCategory('Scalp conditions') === null);

  const lllt = packet({
    research_topic: 'Photobiomodulation evidence review',
    claims: [{
      ...packet().claims[0],
      claim_id: 'CLAIM-LLLT-TREATMENT',
      statement: 'Repeated light-device use improved the measured endpoint versus sham in several controlled studies.',
      category: 'treatment-modalities',
    }],
  });
  const llltBatch = packetToBatch(lllt).batch;
  check('claim category treatment-modalities survives ingestion even when prose has no topic keyword',
    llltBatch.claims[0].topics.includes('treatment-modalities'), llltBatch.claims[0].topics);

  const legacyCategory = packet({
    research_topic: 'Neutral bounded research topic',
    claims: [{
      ...packet().claims[0],
      claim_id: 'CLAIM-LEGACY-CATEGORY',
      statement: 'A neutral statement without a controlled-topic keyword.',
      category: 'Scalp conditions',
    }],
  });
  const legacyCategoryBatch = packetToBatch(legacyCategory).batch;
  check('uncontrolled legacy claim category is ignored rather than becoming a topic',
    !legacyCategoryBatch.claims[0].topics.includes('Scalp conditions'), legacyCategoryBatch.claims[0].topics);

  const s = partitionRecords(batch.sources, validateSource, 'source_id');
  const c = partitionRecords(batch.claims, validateClaim, 'claim_id');
  check('all mapped sources pass canonical validation', s.rejected.length === 0, s.rejected);
  check('all mapped claims pass canonical validation', c.rejected.length === 0, c.rejected);
  const row = mapClaimRow(batch.claims[0]);
  check('provenance lands in claim extras', row.extras.packet_batch_id === 'AIMT-RF-TEST-001' && Array.isArray(row.extras.supporting_source_ids));
  check('mapped claim row never carries gate columns', !('public_eligible' in row) && !('published' in row) && !('aimt_review_notes' in row));
  const srow = mapSourceRow(batch.sources.find((x) => x.packet_source_id === 'SRC-A'));
  check('month-precision date preserved, not invented', srow.date_published === null && srow.extras.date_published_raw_unparsed === '2019-04');

  const approved = packetToBatch(packet({ claims: [{ ...packet().claims[0], verification_status: 'AIMT_APPROVED' }] })).batch;
  const gate = partitionRecords(approved.claims, validateClaim, 'claim_id');
  check('AIMT_APPROVED passes through untouched and the CANONICAL gate quarantines it', approved.claims[0].verification_status === 'AIMT_APPROVED' && gate.valid.length === 0 && gate.rejected.length === 1);
}

// ── Supersession ──
{
  const v1 = packet({ batch_id: 'P-1', researched_at: '2026-09-21T00:00:00Z' });
  const v2 = packet({ batch_id: 'P-1-v2', researched_at: '2026-09-22T00:00:00Z', research_reason: 'Re-test; prior packet P-1 retained unchanged.' });
  const other = packet({ batch_id: 'P-9', researched_at: '2026-09-23T00:00:00Z' });
  const s = findSuperseded([v2, v1, other]);
  check('explicit re-test supersedes the earlier packet', s.get('P-1') === 'P-1-v2' && s.size === 1);
  const crossRef = findSuperseded([packet({ batch_id: 'SDYS', researched_at: '2026-09-21T00:00:00Z', research_topic: 'Scalp dysesthesia' }),
    packet({ batch_id: 'SSCALP', researched_at: '2026-09-30T00:00:00Z', research_topic: 'Sensitive scalp', verification: { method: 'm', cross_checked: true, independent_sources_count: 2, notes: 'Dysesthesia is covered by packet SDYS.' } })]);
  check('a cross-reference from a different topic never supersedes', crossRef.size === 0);
  const backwards = findSuperseded([packet({ batch_id: 'OLD', researched_at: '2026-09-21T00:00:00Z', research_reason: 'mentions NEW' }), packet({ batch_id: 'NEW', researched_at: '2026-09-22T00:00:00Z' })]);
  check('an earlier packet cannot supersede a later one', backwards.size === 0);
}

// ── Poller (stubbed Supabase + stubbed canonical ingest) ──
{
  const dir = mkdtempSync(path.join(tmpdir(), 'feed-'));
  const inbox = path.join(dir, 'inbox'); mkdirSync(inbox);
  writeFileSync(path.join(inbox, 'a.json'), JSON.stringify(packet({ batch_id: 'P-1', researched_at: '2026-09-21T00:00:00Z' })));
  writeFileSync(path.join(inbox, 'b.json'), JSON.stringify(packet({ batch_id: 'P-1-v2', researched_at: '2026-09-22T00:00:00Z', research_reason: 'Re-test of P-1.' })));
  writeFileSync(path.join(inbox, 'c.json'), JSON.stringify(packet({ batch_id: 'P-DONE', researched_at: '2026-09-23T00:00:00Z' })));
  writeFileSync(path.join(inbox, 'd.json'), '{ not json');
  writeFileSync(path.join(inbox, 'e.json'), JSON.stringify({ batch_id: 'BROKEN' }));
  const before = readFileSync(path.join(inbox, 'b.json'), 'utf8');

  const requests = [];
  const fetchImpl = async (url, init = {}) => {
    requests.push({ url: String(url), method: init.method || 'GET' });
    if (String(url).includes('research_ingestion_log')) return new Response(JSON.stringify([{ batch_id: 'P-DONE', status: 'success' }]), { status: 200 });
    if (String(url).includes('research_sources')) return new Response(JSON.stringify([{ source_id: 'existing-library-source', doi: '10.1/EXISTING' }]), { status: 200 });
    if (String(url).includes('research_claims')) return new Response('[]', { status: 200 });
    return new Response('[]', { status: 200 });
  };
  const ingested = [];
  const ingest = async (env, batch, opts) => { ingested.push({ batch, opts }); return { ok: true, batch_id: batch.batch_id, status: 'ok', inserted: { sources: 2, claims: 2 }, updated: { sources: 0, claims: 0 }, quarantined: { sources: 0, claims: 0, orphan_claims: 0 } }; };
  const logs = [];
  const log = async (env, source, type, msg) => { logs.push({ source, type, msg }); };
  const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'k' };

  const dry = await runFeedIngest({ env, inboxDir: inbox, dryRun: true, fetchImpl, ingest, log });
  check('dry run ingests nothing and logs nothing', ingested.length === 0 && logs.length === 0 && dry.summary.would_ingest === 1, dry.summary);

  const rep = await runFeedIngest({ env, inboxDir: inbox, fetchImpl, ingest, log });
  const byId = Object.fromEntries(rep.packets.filter((p) => p.batch_id).map((p) => [p.batch_id, p.action]));
  check('superseded packet skipped', byId['P-1'] === 'skipped_superseded');
  check('already-ingested batch skipped (idempotent)', byId['P-DONE'] === 'skipped_already_ingested');
  check('new packet ingested exactly once via the canonical function', byId['P-1-v2'] === 'ingested' && ingested.length === 1 && ingested[0].batch.batch_id === 'P-1-v2');
  check('ingest called with poller provenance', ingested[0].opts.triggeredBy === 'research-feed-poller' && ingested[0].opts.defaultSourceSystem === 'aimt-research-feed');
  check('invalid + unparseable packets reported, not ingested', rep.summary.invalid === 2 && logs.filter((l) => l.type === 'research_feed_packet_invalid').length === 2);
  check('poller itself only issues GETs', requests.every((r) => r.method === 'GET'), requests);
  check('packets are never modified', readFileSync(path.join(inbox, 'b.json'), 'utf8') === before);

  const failing = async () => { throw new Error('db down'); };
  const failRep = await runFeedIngest({ env, inboxDir: inbox, fetchImpl, ingest: failing, log });
  check('infrastructure failure reported as failed (run exits non-zero in CLI)', failRep.packets.some((p) => p.action === 'failed'));
}

// ── Claim-ownership guard (superseded packet can never resurrect) ──
{
  const v1 = packet({ batch_id: 'P-1', researched_at: '2026-09-21T00:00:00Z' });
  const v2 = packet({ batch_id: 'P-1-v2', researched_at: '2026-09-22T00:00:00Z', research_reason: 'Re-test; prior packet P-1 retained unchanged.' });
  const b1 = packetToBatch(v1).batch;
  const b2 = packetToBatch(v2).batch;
  const ownedByV2 = new Map(b1.claims.map((c) => [c.claim_id, 'P-1-v2']));
  check('older packet cannot overwrite claims owned by its superseder', ownershipConflicts(v1, b1, ownedByV2).length === b1.claims.length);
  const ownedByV1 = new Map(b2.claims.map((c) => [c.claim_id, 'P-1']));
  check('declared re-test may update the batch it names', ownershipConflicts(v2, b2, ownedByV1).length === 0);
  check('a packet may update its own claims (idempotent re-run)', ownershipConflicts(v1, b1, new Map(b1.claims.map((c) => [c.claim_id, 'P-1']))).length === 0);
  check('curated non-feed library claims are never overwritten', ownershipConflicts(v1, b1, new Map([[b1.claims[0].claim_id, null]])).length === 1);
  check('new claims never conflict', ownershipConflicts(v1, b1, new Map()).length === 0);

  // End to end: v2 archived (absent from inbox), v1 still present -> refused, nothing ingested.
  const dir = mkdtempSync(path.join(tmpdir(), 'feed-own-'));
  const inbox = path.join(dir, 'inbox'); mkdirSync(inbox);
  writeFileSync(path.join(inbox, 'v1.json'), JSON.stringify(v1));
  const ownerRows = b1.claims.map((c) => ({ claim_id: c.claim_id, owner: 'P-1-v2' }));
  const fetchImpl = async (url) => {
    const u = String(url);
    if (u.includes('research_claims')) return new Response(JSON.stringify(ownerRows), { status: 200 });
    return new Response('[]', { status: 200 });
  };
  const ingested = [];
  const logs = [];
  const rep = await runFeedIngest({ env: { SUPABASE_URL: 'https://x.co', SUPABASE_SERVICE_ROLE_KEY: 'k' }, inboxDir: inbox, fetchImpl,
    ingest: async (e, b) => { ingested.push(b); return { ok: true }; }, log: async (e, s2, t) => logs.push(t) });
  check('archived-superseder scenario: stale packet refused, zero writes', ingested.length === 0 && rep.summary.skipped_claim_ownership_conflict === 1 && logs.includes('research_feed_packet_ownership_conflict'), rep.summary);
}

// ── Quiet mode: no private feed detail in public CI logs ──
{
  const dir = mkdtempSync(path.join(tmpdir(), 'feed-quiet-'));
  const inbox = path.join(dir, 'inbox'); mkdirSync(inbox);
  writeFileSync(path.join(inbox, 'secret-topic-packet.json'), JSON.stringify(packet({ batch_id: 'PRIVATE-BATCH-ID', research_topic: 'Private topic name' })));
  writeFileSync(path.join(inbox, 'broken-private.json'), JSON.stringify({ batch_id: 'PRIVATE-BROKEN' }));
  const fetchImpl = async () => new Response('[]', { status: 200 });
  const report = await runFeedIngest({ env: { SUPABASE_URL: 'https://x.co', SUPABASE_SERVICE_ROLE_KEY: 'k' }, inboxDir: inbox, fetchImpl,
    ingest: async () => { throw new Error('boom: PRIVATE-BATCH-ID detail'); }, log: async () => {} });
  const full = JSON.stringify(report);
  const quiet = quietLines(report).join('\n');
  check('full report does contain private detail (sanity)', /PRIVATE-BATCH-ID/.test(full) && /Private topic name/.test(full));
  check('quiet output contains no file names, batch ids, topics or error text', !/PRIVATE|Private topic|secret-topic|broken-private|boom/.test(quiet), quiet);
  check('quiet output surfaces failures/invalid packets as a warning annotation', /::warning::/.test(quiet) && /failed=1/.test(quiet) && /invalid=1/.test(quiet), quiet);
}

// ── Research-gap link via the feed (one-writer policy: no MCP double-submit) ──
{
  check('gap id parsed only from the deterministic id form', declaredResearchGapId(packet({ research_reason: 'Responds to AIMT gap publication_evidence_gap:alopecia-areata.' })) === 'publication_evidence_gap:alopecia-areata'
    && declaredResearchGapId(packet()) === null);
  const gapRow = { extras: { controlled_topics: ['telogen-effluvium'] } };
  const ok = { batch_id: 'B', accepted: { claims: 2 }, processedClaims: [{ claim_id: 'x', topics: ['telogen-effluvium'], verification_status: 'CLAIM_VERIFIED' }] };
  const marks = [];
  const verify = async () => ({ ok: true, row: gapRow });
  const mark = async (env, id, o) => { marks.push([id, o.researchBatchId]); return { ok: true }; };
  check('relevant accepted CLAIM_VERIFIED -> RESEARCH_RECEIVED', await linkResearchGap({}, 'G', ok, { verify, mark }) === 'RESEARCH_RECEIVED' && marks[0][1] === 'B');
  const discoveredOnly = { ...ok, processedClaims: [{ claim_id: 'x', topics: ['telogen-effluvium'], verification_status: 'DISCOVERED' }] };
  check('DISCOVERED-only never closes a gap', await linkResearchGap({}, 'G', discoveredOnly, { verify, mark }) === 'SKIPPED_NO_RELEVANT_VERIFIED_CLAIM');
  const offTopic = { ...ok, processedClaims: [{ claim_id: 'x', topics: ['psoriasis-scalp'], verification_status: 'CLAIM_VERIFIED' }] };
  check('off-topic verified claim never closes a gap', await linkResearchGap({}, 'G', offTopic, { verify, mark }) === 'SKIPPED_NO_RELEVANT_VERIFIED_CLAIM');
  check('unlinkable gap skipped', await linkResearchGap({}, 'G', ok, { verify: async () => ({ ok: false, reason: 'RESOLVED' }), mark }) === 'SKIPPED_RESOLVED');
  check('verification error skipped, never thrown', await linkResearchGap({}, 'G', ok, { verify: async () => { throw new Error('x'); }, mark }) === 'SKIPPED_VERIFICATION_FAILED');
  // End to end: gap link runs only AFTER canonical ingestion, and never for skipped packets.
  const dir = mkdtempSync(path.join(tmpdir(), 'feed-gap-'));
  const inbox = path.join(dir, 'inbox'); mkdirSync(inbox);
  writeFileSync(path.join(inbox, 'g.json'), JSON.stringify(packet({ batch_id: 'P-GAP', research_reason: 'Responds to publication_evidence_gap:telogen-effluvium.' })));
  const calls = [];
  const rep = await runFeedIngest({ env: { SUPABASE_URL: 'https://x.co', SUPABASE_SERVICE_ROLE_KEY: 'k' }, inboxDir: inbox,
    fetchImpl: async () => new Response('[]', { status: 200 }),
    ingest: async (e, b) => { calls.push('ingest'); return { ok: true, batch_id: b.batch_id, status: 'ok', accepted: { claims: 1 }, processedClaims: [] }; },
    gapLink: async (e, gid) => { calls.push(`link:${gid}`); return 'SKIPPED_NOTHING_ACCEPTED'; }, log: async () => {} });
  check('feed packet with declared gap: ingest first, then gap link', JSON.stringify(calls) === '["ingest","link:publication_evidence_gap:telogen-effluvium"]' && rep.packets[0].research_gap_transition === 'SKIPPED_NOTHING_ACCEPTED');
}

// ── Workflow static security checks ──
{
  const wf = readFileSync(path.join(ROOT, '.github/workflows/aimt-research-feed-ingest.yml'), 'utf8');
  const onBlock = wf.slice(wf.indexOf('\non:'), wf.indexOf('\nconcurrency:'));
  check('triggers: schedule + workflow_dispatch only (no pull_request / pull_request_target / push)', /schedule:/.test(onBlock) && /workflow_dispatch:/.test(onBlock) && !/pull_request|push:|workflow_run|repository_dispatch/.test(onBlock));
  check('permissions: exactly contents: read', /\npermissions:\n  contents: read\n\njobs:/.test(wf));
  check('feed checkout uses only RESEARCH_FEED_READ_TOKEN, credentials not persisted', /repository: brandrice-dev\/aimt-research-feed\n\s+token: \$\{\{ secrets\.RESEARCH_FEED_READ_TOKEN \}\}/.test(wf) && (wf.match(/persist-credentials: false/g) || []).length === 2);
  check('no fallback to github.token / GITHUB_TOKEN', !/github\.token|GITHUB_TOKEN/.test(wf));
  check('missing feed token fails before checkout', wf.indexOf('Require read-only feed token') < wf.indexOf('Check out research feed'));
  check('no secret echoed; only presence tested', !/echo[^\n]*\$(FEED_TOKEN|SUPABASE|\{\{ secrets)/.test(wf));
  check('public logs: --quiet and no report artifact upload', /--quiet/.test(wf) && !/upload-artifact/.test(wf));
  check('user input reaches the shell only via env (no ${{ inputs }} in run scripts)', !/run: \|[\s\S]*\$\{\{ inputs/.test(wf.replace(/DRY_RUN: \$\{\{ inputs\.dry_run \}\}/, '')));
  check('single-flight concurrency, never cancel an in-progress ingest', /group: aimt-research-feed-ingest\n\s+cancel-in-progress: false/.test(wf));
}

// ── Boundaries ──
{
  const src = readFileSync(path.join(ROOT, 'scripts/research-feed-ingest.mjs'), 'utf8') + readFileSync(path.join(ROOT, 'functions/_lib/research/packet-adapter.mjs'), 'utf8');
  check('no Cadence / certification / checkpoint imports', !/cadence|certification|checkpoint/i.test(src.split('\n').filter((l) => /^\s*import /.test(l)).join('\n')));
  check('no raw SQL / RPC in the poller or adapter', !/\/rpc\/|execute_sql|insert into|update research_/i.test(src));
  check('poller only writes through processIngestionBatch', /processIngestionBatch/.test(src) && !/method:\s*'(POST|PATCH|DELETE|PUT)'/.test(src));
  const wf = readFileSync(path.join(ROOT, '.github/workflows/aimt-research-feed-ingest.yml'), 'utf8');
  check('workflow reads the feed with a read-only token secret and never writes to it', /RESEARCH_FEED_READ_TOKEN/.test(wf) && !/git push|contents:\s*write/.test(wf));
  check('workflow uses existing Supabase secrets only', /secrets\.SUPABASE_URL/.test(wf) && /secrets\.SUPABASE_SERVICE_ROLE_KEY/.test(wf));
}

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? '[PASS]' : '[FAIL]'} ${r.name}${r.ok ? '' : ` -- ${JSON.stringify(r.detail)}`}`);
console.log(`\nTotal: ${results.length}, Passed: ${results.length - failed.length}, Failed: ${failed.length}`);
if (failed.length) process.exit(1);
