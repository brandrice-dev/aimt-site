import test from 'node:test';
import assert from 'node:assert/strict';
import { planResearchImport, checkImportPlanHeads } from '../functions/_lib/research/revision-import-planner.mjs';
import { verifyScientificRevision, canonicalScientificJSON } from '../functions/_lib/research/scientific-revision-contract.mjs';
import { packetToBatch, validatePacket } from '../functions/_lib/research/packet-adapter.mjs';
import { mapSourceRow, mapClaimRow, validateSource, validateClaim } from '../functions/_lib/research/schema.mjs';
import { partitionRecords } from '../functions/_lib/research/ingest-request.mjs';
const clone = (x) => JSON.parse(JSON.stringify(x));
const absent = () => ({ revision_id: null, version: 0 });
function fixture() {
  const sources = Array.from({ length: 6 }, (_, i) => ({ source_id: `s${i + 1}`, title: `Synthetic report ${i}`,
    study_family_id: i < 2 ? 'study-A' : `study-${i}`, evidence_text: `Synthetic evidence ${i}: not a clinical recommendation.`,
    version_or_amendment: '1', correction_status: 'none_known', retraction_status: 'none_known', verification_status: 'DISCOVERED' }));
  const claim = { claim_id: 'c1', source_id: 's1', claim_text: 'Synthetic result did not improve.', verification_status: 'CLAIM_VERIFIED',
    supporting_source_ids: ['s1', 's2', 's3'], contradicting_source_ids: ['s4', 's5'], qualifying_source_ids: ['s6'],
    limitations: ['Small synthetic sample.'], body_sections: { result: 'Synthetic result.' } };
  const relationships = sources.map((s, i) => ({ source_id: s.source_id, relation: i < 3 ? 'supports' : i < 5 ? 'contradicts' : 'qualifies',
    scope: { population: 'synthetic adults', outcome: 'synthetic endpoint' }, locator: { section: 'Results', page: i + 1 },
    quote: `Synthetic quotation ${i}`, qualifications: ['No extrapolation'], provenance: { fixture: i } }));
  const heads = { sources: Object.fromEntries(sources.map((s) => [s.source_id, absent()])), claims: { c1: absent() } };
  return { batch: { batch_id: 'synthetic-batch-1', sources, claims: [claim] },
    library: { sources: [], claims: [], source_revisions: [], claim_revisions: [], decisions: [], heads },
    expected_heads: clone(heads), evidence: { relationships: { c1: relationships } } };
}
function adopt(input, plan) {
  const next = clone(input);
  assert.equal(plan.ok, true, JSON.stringify(plan.reasons));
  next.library.source_revisions.push(...clone(plan.append.source_revisions.map((x) => x.revision)));
  next.library.claim_revisions.push(...clone(plan.append.claim_revisions.map((x) => x.revision)));
  next.library.sources = clone(next.batch.sources);
  next.library.claims = clone(next.batch.claims);
  for (const r of plan.candidates) {
    next.library.heads.claims[r.claim_id] = { revision_id: r.revision_id, version: next.library.heads.claims[r.claim_id].version + 1 };
    for (const s of r.sources) {
      const head = next.library.heads.sources[s.source_id];
      if (head.revision_id !== s.revision_id) next.library.heads.sources[s.source_id] = { revision_id: s.revision_id, version: head.version + 1 };
    }
  }
  next.expected_heads = clone(next.library.heads);
  return next;
}
function noWrites(result, code) {
  assert.equal(result.ok, false);
  assert.ok(result.reasons.some((r) => r.code === code), JSON.stringify(result.reasons));
  assert.ok(Object.values(result.append).every((v) => v.length === 0));
}

test('new ingestion appends immutable revisions and complete edges, never decisions or authorized pointers', async () => {
  const input = fixture(), before = clone(input), p = await planResearchImport(input);
  assert.equal(p.ok, true, JSON.stringify(p.reasons));
  assert.equal(p.append.source_revisions.length, 6); assert.equal(p.append.claim_revisions.length, 1);
  assert.equal(p.append.evidence_edges.length, 6); assert.equal(p.preconditions.length, 7);
  assert.deepEqual(p.decisions_to_append, []); assert.deepEqual(p.authorized_selections_to_change, []);
  assert.equal(p.outcomes[0].action, 'append_pending');
  assert.equal(p.submission_head_updates.length, 7);
  for (const update of p.submission_head_updates) {
    assert.deepEqual(update.expected_head, absent());
    assert.equal(update.next_head.version, 1);
    assert.ok(update.next_head.revision_id);
  }
  assert.equal(p.outcomes[0].study_families.independent_study_count, 2);
  assert.deepEqual(input, before);
  assert.deepEqual(await verifyScientificRevision(clone(p.candidates[0])), p.candidates[0]);
  assert.throws(() => p.append.claim_revisions.push({}), TypeError);
});

test('identical reimport and a new operational batch reuse exact revisions', async () => {
  const input = fixture(), p = await planResearchImport(input), next = adopt(input, p);
  next.batch.batch_id = 'synthetic-batch-2';
  next.batch.sources.reverse(); next.evidence.relationships.c1.reverse();
  const again = await planResearchImport(next);
  assert.equal(again.ok, true, JSON.stringify(again.reasons));
  assert.equal(again.outcomes[0].action, 'reuse');
  assert.equal(again.candidates[0].revision_id, p.candidates[0].revision_id);
  assert.equal(again.append.source_revisions.length, 0); assert.equal(again.append.claim_revisions.length, 0);
  assert.equal(again.append.evidence_edges.length, 0); assert.equal(again.append.provenance.length, 1);
});

test('scientific claim edits append pending revisions and preserve complete history and approvals verbatim', async () => {
  const input = fixture(), first = await planResearchImport(input), next = adopt(input, first);
  const event = { decision_id: 'historical-unknown-authority', revision_id: first.candidates[0].revision_id, status: 'AIMT_APPROVED', original_details: null };
  next.library.decisions.push(event); next.library.claims[0].verification_status = 'AIMT_APPROVED';
  next.batch.claims[0].claim_text = 'Synthetic result improved by 5 units.';
  const before = clone(next.library), changed = await planResearchImport(next);
  assert.equal(changed.ok, true, JSON.stringify(changed.reasons));
  assert.notEqual(changed.candidates[0].revision_id, first.candidates[0].revision_id);
  assert.equal(changed.append.claim_revisions[0].state, 'pending');
  assert.equal(changed.append.claim_revisions[0].parent_revision_id, first.candidates[0].revision_id);
  assert.equal(changed.outcomes[0].human_approval, 'not_transferred');
  assert.deepEqual(changed.retained_history.decisions, [event]);
  assert.deepEqual(next.library, before); assert.deepEqual(changed.decisions_to_append, []);
  assert.equal(changed.candidates[0].status, undefined);
});

test('updated and retracted supporting sources bind new source and claim revisions without rewriting history', async () => {
  for (const field of ['evidence_text', 'correction_status', 'retraction_status']) {
    const input = fixture(), first = await planResearchImport(input), next = adopt(input, first);
    next.batch.sources[0][field] = field === 'evidence_text' ? 'Corrected synthetic result.' : field === 'correction_status' ? 'corrected' : 'retracted';
    const p = await planResearchImport(next);
    assert.equal(p.ok, true, JSON.stringify(p.reasons)); assert.equal(p.append.source_revisions.length, 1);
    assert.notEqual(p.candidates[0].revision_id, first.candidates[0].revision_id);
    const edge = p.candidates[0].relationships.find((e) => e.source_id === 's1');
    assert.equal(edge.endpoint_revision_id, p.append.source_revisions[0].revision.revision_id);
    assert.equal(first.candidates[0].sources.find((s) => s.source_id === 's1').content.retraction_status, 'none_known');
  }
});

test('multiple supports/contradictions, source qualifications and distinct opposing scopes retain every edge', async () => {
  const f = fixture();
  f.evidence.relationships.c1.push({ ...clone(f.evidence.relationships.c1[0]), relation: 'contradicts', scope: 'different synthetic population' });
  f.evidence.relationships.c1.push({ ...clone(f.evidence.relationships.c1[0]), provenance: { report: 'duplicate observation' } });
  const p = await planResearchImport(f);
  assert.equal(p.ok, true); assert.equal(p.append.evidence_edges.length, 7);
  assert.equal(p.candidates[0].relationships.filter((e) => e.relation === 'contradicts').length, 3);
  assert.equal(p.candidates[0].relationships.find((e) => e.source_id === 's1' && e.relation === 'supports').provenance.length, 2);
  f.evidence.relationships.c1.push({ ...clone(f.evidence.relationships.c1[0]), quote: 'A second distinct synthetic evidence span.' });
  const withSpans = await planResearchImport(f);
  const n = adopt(f, withSpans);
  n.evidence.relationships.c1.pop();
  noWrites(await planResearchImport(n), 'RELATIONSHIP_OMISSION');
});

test('duplicate study reports count one explicit family; unresolved family yields incomplete no-write plan', async () => {
  const f = fixture(), p = await planResearchImport(f);
  assert.equal(p.outcomes[0].study_families.independent_study_count, 2);
  delete f.batch.sources[2].study_family_id;
  const incomplete = await planResearchImport(f);
  noWrites(incomplete, 'UNRESOLVED_STUDY_FAMILY');
  assert.equal(incomplete.candidates[0].sources.find((s) => s.source_id === 's3').study_family_id, null);
});

test('missing evidence and unknown locators remain explicit incomplete candidates', async () => {
  const f = fixture(); delete f.batch.sources[0].evidence_text;
  noWrites(await planResearchImport(f), 'MISSING_SOURCE_EVIDENCE');
  const g = fixture(); delete g.evidence;
  const p = await planResearchImport(g);
  noWrites(p, 'MISSING_EVIDENCE_LOCATOR_OR_SCOPE');
  assert.equal(p.candidates[0].relationships[0].locator.status, 'unknown');
});

test('omitted declared evidence, endpoint and historical contradiction refuse silent deletion', async () => {
  const f = fixture(); f.evidence.relationships.c1.splice(3, 1);
  noWrites(await planResearchImport(f), 'INCOMPLETE_RELATIONSHIP');
  const g = fixture(); g.evidence.relationships.c1[0].source_id = 'missing';
  noWrites(await planResearchImport(g), 'INCOMPLETE_RELATIONSHIP');
  const h = fixture(), first = await planResearchImport(h), next = adopt(h, first);
  next.batch.claims[0].contradicting_source_ids.pop(); next.batch.sources.splice(4, 1); next.evidence.relationships.c1.splice(4, 1);
  const result = await planResearchImport(next);
  noWrites(result, 'RELATIONSHIP_OMISSION'); assert.equal(first.candidates[0].relationships.length, 6);
});

test('omitted source content, claim safety fields and edge qualifications are incomplete snapshots', async () => {
  const f = fixture(), p = await planResearchImport(f), next = adopt(f, p);
  delete next.batch.sources[0].version_or_amendment;
  noWrites(await planResearchImport(next), 'INCOMPLETE_SOURCE_SNAPSHOT');
  const g = adopt(f, p); delete g.batch.claims[0].limitations;
  noWrites(await planResearchImport(g), 'INCOMPLETE_CLAIM_SNAPSHOT');
  const h = adopt(f, p); delete h.evidence.relationships.c1[0].qualifications;
  noWrites(await planResearchImport(h), 'INCOMPLETE_RELATIONSHIP');
});

test('stale planning and commit-time source/claim conflicts, including ABA, block', async () => {
  const f = fixture(), p = await planResearchImport(f);
  assert.equal(checkImportPlanHeads(p, f.library.heads).ok, true);
  for (const [kind, id] of [['claims', 'c1'], ['sources', 's4']]) {
    const heads = clone(f.library.heads); heads[kind][id] = { revision_id: 'different', version: 1 };
    assert.equal(checkImportPlanHeads(p, heads).conflicts[0].code, 'STALE_HEAD');
  }
  let next = adopt(f, p); next.expected_heads.claims.c1.version = 2;
  noWrites(await planResearchImport(next), 'STALE_HEAD');
  const replay = await planResearchImport(next = adopt(f, p));
  const aba = clone(next.library.heads); aba.claims.c1.version += 2;
  assert.equal(checkImportPlanHeads(replay, aba).ok, false);
  assert.equal(checkImportPlanHeads({ ok: false }, {}).ok, false);
});

test('explicit absent heads required; legacy rows require backfill and forged heads/revisions fail', async () => {
  const f = fixture(); delete f.expected_heads.sources.s1;
  noWrites(await planResearchImport(f), 'INVALID_HEAD');
  const g = fixture(); g.library.claims = clone(g.batch.claims);
  noWrites(await planResearchImport(g), 'LEGACY_BACKFILL_REQUIRED');
  const h = fixture(); h.library.heads.sources.s1 = { revision_id: 'forged', version: 1 }; h.expected_heads = clone(h.library.heads);
  noWrites(await planResearchImport(h), 'MISSING_REVISION');
  const j = fixture(), p = await planResearchImport(j), next = adopt(j, p);
  next.library.claim_revisions[0].content.claim_text = 'tampered';
  noWrites(await planResearchImport(next), 'REVISION_MISMATCH');
});

test('historical content replay reuses old immutable revision while retaining intervening history', async () => {
  const f = fixture(), one = await planResearchImport(f), n = adopt(f, one);
  n.batch.claims[0].claim_text = 'Second synthetic version.';
  const two = await planResearchImport(n), m = adopt(n, two);
  m.batch.claims[0].claim_text = f.batch.claims[0].claim_text;
  const replay = await planResearchImport(m);
  assert.equal(replay.ok, true); assert.equal(replay.outcomes[0].action, 'reuse');
  assert.equal(replay.candidates[0].revision_id, one.candidates[0].revision_id);
  assert.equal(replay.retained_history.claim_revision_ids.length, 2);
  assert.equal(replay.append.claim_revisions.length, 0);
  assert.deepEqual(replay.authorized_selections_to_change, []);
});

test('existing source references resolve from immutable library head without resending mutable rows', async () => {
  const f = fixture(), p = await planResearchImport(f), n = adopt(f, p); n.batch.sources = [];
  const replay = await planResearchImport(n);
  assert.equal(replay.ok, true); assert.equal(replay.candidates[0].revision_id, p.candidates[0].revision_id);
});

test('related claim endpoints require real verified historical revision, preserve edge and dependency guard', async () => {
  const f = fixture(), first = await planResearchImport(f), next = adopt(f, first);
  next.batch.claims[0].claim_id = 'c2'; next.library.heads.claims.c2 = absent(); next.expected_heads = clone(next.library.heads);
  next.evidence.relationships.c2 = clone(next.evidence.relationships.c1); delete next.evidence.relationships.c1;
  const r = first.candidates[0];
  next.evidence.related_claims = { c2: [{ claim_id: r.claim_id, revision_id: r.revision_id, scientific_digest: r.scientific_digest }] };
  next.evidence.relationships.c2.push({ related_claim_id: 'c1', relation: 'qualifies', scope: 'synthetic limitation', locator: 'Limitations' });
  const p = await planResearchImport(next);
  assert.equal(p.ok, true, JSON.stringify(p.reasons));
  assert.equal(p.candidates[0].relationships.length, 7); assert.equal(p.preconditions.filter((x) => x.kind === 'claims').length, 2);
  next.evidence.related_claims.c2[0].scientific_digest = 'a'.repeat(64);
  noWrites(await planResearchImport(next), 'MISSING_REVISION');
});

function packetFixture() {
  return { batch_id: 'synthetic-packet-1', researched_at: '2026-10-01T12:00:00Z', research_topic: 'Synthetic scalp health',
    research_reason: 'Synthetic fixture', categories: ['Synthetic'], verification: { method: 'synthetic', cross_checked: false, independent_sources_count: 0 },
    contradictions: [], evidence_strength: 'weak', gaps_remaining: [], suggested_follow_up: [],
    sources: [{ source_id: 'S1', title: 'Synthetic source', source_type: 'clinical_study', doi: '10.synthetic/source',
      study_family_id: 'study-A', evidence_text: 'Synthetic evidence.', correction_status: 'none_known', retraction_status: 'none_known' }],
    claims: [{ claim_id: 'C1', statement: 'Synthetic claim.', source_ids_supporting: ['S1'], source_ids_contradicting: [], verification_status: 'DISCOVERED', confidence: 'low', notes: 'Synthetic caveat' }] };
}
function packetInput(packet = packetFixture()) {
  const heads = { sources: { 'rf-src-s1': absent() }, claims: { 'rf-claim-c1': absent() } };
  return { packet, library: { sources: [], claims: [], source_revisions: [], claim_revisions: [], decisions: [], heads }, expected_heads: clone(heads),
    evidence: { relationships: { 'rf-claim-c1': [{ source_id: 'rf-src-s1', relation: 'supports', scope: 'synthetic adults', locator: 'Results' }] } } };
}

test('existing validated packet IDs and schemas interoperate; scientific extras survive packet projection', async () => {
  const f = packetInput(); assert.equal(validatePacket(f.packet).ok, true);
  const p = await planResearchImport(f); assert.equal(p.ok, true, JSON.stringify(p.reasons));
  const batch = packetToBatch(f.packet).batch;
  assert.equal(p.candidates[0].claim_id, batch.claims[0].claim_id);
  assert.equal(p.candidates[0].primary_source_id, batch.claims[0].source_id);
  assert.equal(p.candidates[0].content.body_sections.packet_claim.notes, 'Synthetic caveat');
  assert.equal(partitionRecords(batch.claims, validateClaim, 'claim_id').rejected.length, 0);
  assert.equal(partitionRecords(batch.sources, validateSource, 'source_id').rejected.length, 0);
  const next = clone(f);
  next.library.source_revisions = clone(p.candidates[0].sources); next.library.claim_revisions = clone(p.candidates);
  next.library.sources = clone(batch.sources); next.library.claims = clone(batch.claims);
  next.library.heads.sources['rf-src-s1'] = { revision_id: p.candidates[0].sources[0].revision_id, version: 1 };
  next.library.heads.claims['rf-claim-c1'] = { revision_id: p.candidates[0].revision_id, version: 1 };
  next.expected_heads = clone(next.library.heads); next.packet.batch_id = 'synthetic-packet-2';
  const replay = await planResearchImport(next);
  assert.equal(replay.ok, true, JSON.stringify(replay.reasons)); assert.equal(replay.outcomes[0].action, 'reuse');
});

test('DOI reuse retains library identity and inspects incoming corrected source instead of skipping it', async () => {
  const f = packetInput(), p = await planResearchImport(f), r = p.candidates[0];
  f.library.source_revisions = clone(r.sources); f.library.claim_revisions = clone(p.candidates);
  f.library.sources = [{ source_id: 'rf-src-s1', title: 'Synthetic source', doi: '10.synthetic/source' }];
  f.library.claims = [{ claim_id: r.claim_id, source_id: 'rf-src-s1' }];
  f.library.heads.sources['rf-src-s1'] = { revision_id: r.sources[0].revision_id, version: 1 };
  f.library.heads.claims[r.claim_id] = { revision_id: r.revision_id, version: 1 }; f.expected_heads = clone(f.library.heads);
  f.packet.sources[0].source_id = 'DIFFERENT-LOCAL-ID'; f.packet.claims[0].source_ids_supporting = ['DIFFERENT-LOCAL-ID'];
  f.packet.sources[0].retraction_status = 'retracted';
  const changed = await planResearchImport(f);
  assert.equal(changed.ok, true, JSON.stringify(changed.reasons)); assert.equal(changed.append.source_revisions.length, 1);
  assert.equal(changed.candidates[0].primary_source_id, 'rf-src-s1');
  assert.equal(changed.candidates[0].sources[0].content.retraction_status, 'retracted');
  assert.ok(changed.outcomes[0].review_reasons.includes('SOURCE_RETRACTED'));
  f.identity_map = { sources: { 'DIFFERENT-LOCAL-ID': 'conflicting-id' } };
  noWrites(await planResearchImport(f), 'CONFLICTING_IDENTITY');
});

test('feed slug collisions and ambiguous DOI mapping reject rather than coalesce studies', async () => {
  const f = packetInput(); f.packet.sources.push({ ...clone(f.packet.sources[0]), source_id: 'S1!' });
  noWrites(await planResearchImport(f), 'AMBIGUOUS_IDENTITY');
  const g = packetInput(); g.library.sources = [{ source_id: 'a', doi: 'same' }, { source_id: 'b', doi: 'SAME' }];
  noWrites(await planResearchImport(g), 'AMBIGUOUS_IDENTITY');
});

test('raw and DB-mapped existing import rows are accepted losslessly under contract classification', async () => {
  const f = fixture(); delete f.batch.claims[0].qualifying_source_ids;
  // Explicit qualifying edges remain accepted even if legacy schema lacks array.
  for (const [sources, claims] of [[f.batch.sources, f.batch.claims], [f.batch.sources.map((s) => mapSourceRow(s)), f.batch.claims.map((c) => mapClaimRow(c))]]) {
    const g = clone(f); g.batch.sources = sources; g.batch.claims = claims;
    assert.equal(partitionRecords(claims, validateClaim, 'claim_id').rejected.length, 0);
    const p = await planResearchImport(g); assert.equal(p.ok, true, JSON.stringify(p.reasons));
    assert.equal(p.candidates[0].content.claim_text, claims[0].claim_text);
    assert.equal(p.candidates[0].relationships.length, 6);
    assert.deepEqual(await verifyScientificRevision(clone(p.candidates[0])), p.candidates[0]);
  }
});

test('legacy bibliography packets become incomplete without invented evidence, family or locator', async () => {
  const f = packetInput(); delete f.packet.sources[0].evidence_text; delete f.packet.sources[0].study_family_id; delete f.evidence;
  const p = await planResearchImport(f); noWrites(p, 'MISSING_SOURCE_EVIDENCE');
  assert.equal(p.candidates[0].sources[0].evidence_identity, 'metadata_only');
  assert.equal(p.candidates[0].sources[0].study_family_id, null); assert.equal(p.status, 'incomplete');
});

test('incoming human approvals, unknown scientific fields and legacy untyped relations reject', async () => {
  const f = fixture(); f.batch.claims[0].verification_status = 'AIMT_APPROVED';
  noWrites(await planResearchImport(f), 'AUTHORITY_BOUNDARY');
  const g = fixture(); g.batch.sources[0].verification_status = 'AIMT_APPROVED';
  noWrites(await planResearchImport(g), 'AUTHORITY_BOUNDARY');
  const h = fixture(); h.batch.claims[0].unknown_scientific_extra = 'must not disappear';
  noWrites(await planResearchImport(h), 'UNCLASSIFIED_FIELD');
  const j = fixture(); j.batch.relationships = [{ relationship_id: 'legacy', relation: 'unknown' }];
  noWrites(await planResearchImport(j), 'UNCLASSIFIED_RELATIONSHIPS');
});

test('no I/O, deterministic results, detached async inputs and named malformed-input errors', async () => {
  const f = fixture(); const pending = planResearchImport(f); f.batch.claims[0].claim_text = 'changed while hashing';
  const p = await pending; assert.equal(p.candidates[0].content.claim_text, fixture().batch.claims[0].claim_text);
  const fetch = globalThis.fetch; globalThis.fetch = () => { throw new Error('I/O forbidden'); };
  try {
    assert.equal(canonicalScientificJSON(await planResearchImport(fixture())), canonicalScientificJSON(await planResearchImport(fixture())));
  } finally { globalThis.fetch = fetch; }
  noWrites(await planResearchImport(null), 'INVALID_INPUT');
  const bad = fixture(); bad.batch.sources = {};
  noWrites(await planResearchImport(bad), 'INVALID_ARRAY');
});


test('distinct same-batch provenance has separate idempotency keys; exact retries coalesce', async () => {
  const f = fixture(), one = await planResearchImport(f), retry = await planResearchImport(f);
  assert.equal(one.append.provenance[0].idempotency_key, retry.append.provenance[0].idempotency_key);
  f.batch.claims[0].verified_on = '2026-10-02';
  const observation = await planResearchImport(f);
  assert.equal(observation.candidates[0].revision_id, one.candidates[0].revision_id);
  assert.notEqual(observation.append.provenance[0].idempotency_key, one.append.provenance[0].idempotency_key);
});

test('unknown planner/evidence fields, unused evidence and invalid records have reason codes', async () => {
  const f = fixture(); f.evidence.unreviewed = [];
  noWrites(await planResearchImport(f), 'UNCLASSIFIED_FIELD');
  const g = fixture(); g.evidence.relationships.unknown = clone(g.evidence.relationships.c1);
  noWrites(await planResearchImport(g), 'UNUSED_EVIDENCE');
  const h = fixture(); h.batch.claims[0].claim_type = 'made-up';
  noWrites(await planResearchImport(h), 'INVALID_CLAIM');
  const j = packetInput(); delete j.packet.research_reason;
  noWrites(await planResearchImport(j), 'INVALID_PACKET');
});


test('orphan contradiction descriptors and untyped related claims refuse incomplete packet evidence', async () => {
  const f = packetInput();
  f.packet.contradictions = [{ description: 'Synthetic contrary evidence', related_claim_ids: ['missing'], source_ids_involved: ['S1'] }];
  noWrites(await planResearchImport(f), 'INCOMPLETE_CONTRADICTION');
  const g = packetInput(); g.packet.claims[0].related_claim_ids = ['C2'];
  noWrites(await planResearchImport(g), 'INCOMPLETE_RELATIONSHIP');
});

test('explicit null evidence declarations and exhausted concurrency versions fail explicitly', async () => {
  const f = fixture(); f.batch.claims[0].contradicting_source_ids = null;
  noWrites(await planResearchImport(f), 'INVALID_ARRAY');
  const g = fixture(); g.library.heads.sources.s1 = { revision_id: 'exhausted', version: Number.MAX_SAFE_INTEGER };
  g.expected_heads = clone(g.library.heads);
  noWrites(await planResearchImport(g), 'INVALID_HEAD');
});


test('packet scientific use restrictions and safety qualifications remain explicit contract fields', async () => {
  const f = packetInput();
  f.packet.sources[0].use_status = 'excluded'; f.packet.sources[0].license_or_rights_notes = 'Synthetic internal review only';
  f.packet.claims[0].use_status = 'excluded'; f.packet.claims[0].safety_qualifications = ['No synthetic clinical extrapolation'];
  const p = await planResearchImport(f);
  assert.equal(p.ok, true, JSON.stringify(p.reasons));
  assert.equal(p.candidates[0].content.use_status, 'excluded');
  assert.equal(p.candidates[0].sources[0].content.use_status, 'excluded');
  assert.deepEqual(p.candidates[0].content.safety_qualifications, f.packet.claims[0].safety_qualifications);
  assert.deepEqual(p.authorized_selections_to_change, []);
});


test('lossy feed IDs cannot collide with identities declared by prior library packets', async () => {
  const f = packetInput(); f.library.sources = [{ source_id: 'rf-src-s1', extras: { packet_source_id: 'S1!' } }];
  noWrites(await planResearchImport(f), 'AMBIGUOUS_IDENTITY');
  const g = packetInput(); g.library.claims = [{ claim_id: 'rf-claim-c1', extras: { packet_claim_id: 'C1!' } }];
  noWrites(await planResearchImport(g), 'AMBIGUOUS_IDENTITY');
});
