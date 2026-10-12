import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  CONTRACT_VERSION, canonicalScientificJSON, createSourceRevision,
  createScientificRevision, verifyScientificRevision, supportingStudyFamilies,
  revisionFromLegacySingleSource, bindScientificDecision,
} from '../functions/_lib/research/scientific-revision-contract.mjs';
import { packetToBatch } from '../functions/_lib/research/packet-adapter.mjs';
import { mapSourceRow, mapClaimRow } from '../functions/_lib/research/schema.mjs';

const clone = (v) => JSON.parse(JSON.stringify(v));
const rejectsCode = (fn, code) => assert.rejects(fn, (e) => e.code === code);
function fixture() {
  const sources = ['s1', 's2', 's3', 's4', 's5', 's6'].map((source_id, i) => ({
    source_id, study_family_id: i < 2 ? 'study-A' : `study-${i}`,
    content: { title: `Synthetic report ${i}`, authors: ['A', 'B'], evidence_text: `Synthetic observed result ${i}: 5 mg, not 50 mg.`,
      date_retrieved: '2026-10-01', version_or_amendment: '1', correction_status: 'none_known',
      retraction_status: 'none_known', rights_access_status: 'open', locator: { section: 'Results', page: 2 } },
    provenance: { batch_id: 'synthetic-batch' },
  }));
  const relationships = sources.map((s, i) => ({ source_id: s.source_id,
    relation: i < 3 ? 'supports' : i < 5 ? 'contradicts' : 'qualifies',
    scope: { population: 'synthetic adults', outcome: 'synthetic measurement', duration: '4 weeks' },
    locator: { page: i + 1, section: 'Results' }, quote: `Exact  synthetic quote ${i}.`,
    qualifications: ['No clinical extrapolation.'], confidence: 'medium', review_status: 'not_reviewed',
    provenance: { packet_source_id: `P${i}`, packet_digest: 'a'.repeat(64) },
  }));
  const digest = 'b'.repeat(64);
  return { claim_id: 'logical-claim-1', primary_source_id: 's1',
    content: { claim_text: 'Synthetic intervention did not improve outcome.', claim_type: 'finding',
      population_or_scope: { population: 'synthetic adults', intervention: '5 mg' },
      limitations: ['Synthetic small sample.'], safety_qualifications: ['No patient advice.'],
      body_sections: { finding: { text: 'Do not omit negation.', future_nested_field: 'preserved and hashed' } } },
    sources, relationships,
    related_claims: [{ claim_id: 'related-1', scientific_digest: digest, revision_id: `claim:related-1:sha256:${digest}` }],
    provenance: { batch_id: 'synthetic-batch', imported_at: '2026-10-01' },
  };
}
function completeFixture() {
  const f = fixture();
  f.relationships.push({ related_claim_id: 'related-1', relation: 'qualifies',
    scope: 'Only the synthetic population', locator: { section: 'Limitations' }, quote: 'No extrapolation.' });
  return f;
}
function decision(revision, automatic = true) {
  return { decision_id: 'synthetic-event-1', kind: automatic ? 'automated_evidence_clearance' : 'human_institutional_approval',
    status: automatic ? 'EVIDENCE_CLEARED' : 'AIMT_APPROVED', claim_id: revision.claim_id,
    revision_id: revision.revision_id, scientific_digest: revision.scientific_digest, graph_digest: revision.graph_digest,
    policy_version: 'synthetic-policy-1', actor: { actor_id: automatic ? 'synthetic-checker' : 'synthetic-reviewer', actor_type: automatic ? 'automation' : 'human' },
    decided_at: '2026-10-01T10:00:00Z', scope: 'Synthetic educational use', permitted_use: ['synthetic_internal_review'],
    expires_at: '2026-11-01T10:00:00Z', withdrawal: null, reason: 'Synthetic fixture decision only.',
    ...(automatic ? { checker_version: 'checker-fixture-1', risk_tier: 'routine_fixture',
      checks: [{ check_id: 'synthetic-check', result: 'passed', evidence_digest: revision.graph_digest }] }
      : { authority_id: 'synthetic-institutional-authority', authorization_reference: 'synthetic-authenticated-event' }),
  };
}

test('deterministic SHA-256, key/graph order independence, exact version binding', async () => {
  const f = completeFixture(), a = await createScientificRevision(f);
  f.sources.reverse(); f.relationships.reverse();
  f.content = Object.fromEntries(Object.entries(f.content).reverse());
  const b = await createScientificRevision(f);
  assert.equal(a.scientific_digest, b.scientific_digest);
  assert.equal(a.graph_digest, b.graph_digest);
  assert.equal(a.revision_id, b.revision_id);
  const { scientific_digest, revision_id, sources, relationships, provenance, ...payload } = a;
  assert.equal(scientific_digest, createHash('sha256').update(canonicalScientificJSON(payload)).digest('hex'));
  assert.equal(a.contract_version, CONTRACT_VERSION);
});

test('material scientific fields change digest; logical identities remain stable', async () => {
  const a = await createScientificRevision(completeFixture());
  const changes = [
    (f) => { f.content.claim_text = 'Synthetic intervention improved outcome.'; },
    (f) => { f.content.population_or_scope.intervention = '50 mg'; },
    (f) => { f.content.limitations.push('Additional limitation.'); },
    (f) => { f.content.safety_qualifications = []; },
    (f) => { f.content.body_sections.finding.future_nested_field = 'changed'; },
    (f) => { f.sources[0].content.evidence_text += ' Correction.'; },
    (f) => { f.sources[0].content.retraction_status = 'retracted'; },
    (f) => { f.sources[0].content.date_retrieved = '2026-10-02'; },
    (f) => { f.sources[0].study_family_id = 'different-study'; },
    (f) => { f.relationships[0].quote = 'Exact synthetic quote 0.'; },
    (f) => { f.relationships[0].scope.duration = '8 weeks'; },
    (f) => { f.relationships[0].locator.page = 100; },
    (f) => { f.relationships[0].relation = 'contradicts'; f.primary_source_id = 's2'; },
    (f) => { f.relationships.splice(4, 1); f.sources.splice(4, 1); },
  ];
  for (const change of changes) {
    const f = completeFixture(); change(f);
    const b = await createScientificRevision(f);
    assert.notEqual(a.scientific_digest, b.scientific_digest);
    assert.notEqual(a.revision_id, b.revision_id);
    assert.equal(a.claim_id, b.claim_id);
  }
});

test('three supports, two contradictions, scoped qualification and related claim survive JSON round trip', async () => {
  const revision = await createScientificRevision(completeFixture());
  const restored = await verifyScientificRevision(clone(revision));
  assert.deepEqual(restored, revision);
  assert.equal(restored.relationships.filter((e) => e.relation === 'supports').length, 3);
  assert.equal(restored.relationships.filter((e) => e.relation === 'contradicts').length, 2);
  assert.equal(restored.relationships.filter((e) => e.relation === 'qualifies').length, 2);
  assert.equal(restored.sources.length, 6);
  assert.ok(restored.relationships.every((e) => e.endpoint_revision_id));
  assert.deepEqual(restored.content.body_sections, completeFixture().content.body_sections);
});

test('same study reports count once; unknown identities never become independent studies', async () => {
  const f = completeFixture();
  const result = supportingStudyFamilies(await createScientificRevision(f));
  assert.equal(result.independent_study_count, 2);
  f.sources[2].study_family_id = null;
  const incomplete = supportingStudyFamilies(await createScientificRevision(f));
  assert.equal(incomplete.independent_study_count, 1);
  assert.deepEqual(incomplete.unresolved_source_ids, ['s3']);
});

test('exact duplicate edges retain provenance; opposing scopes remain separate', async () => {
  const f = completeFixture();
  f.relationships.push({ ...clone(f.relationships[0]), provenance: { packet_source_id: 'duplicate-report' } });
  f.relationships.push({ ...clone(f.relationships[0]), relation: 'contradicts', scope: 'Different synthetic scope' });
  const r = await createScientificRevision(f);
  assert.equal(r.relationships.length, 8);
  const support = r.relationships.find((e) => e.source_id === 's1' && e.relation === 'supports');
  assert.equal(support.provenance.length, 2);
  assert.ok(r.relationships.some((e) => e.source_id === 's1' && e.relation === 'contradicts'));
  assert.deepEqual(await verifyScientificRevision(clone(r)), r);
});

test('operational provenance changes do not change scientific identities', async () => {
  const f = completeFixture(), a = await createScientificRevision(f);
  f.provenance.batch_id = 'different'; f.sources[0].provenance.batch_id = 'different';
  f.relationships[0].provenance.packet_source_id = 'different';
  const b = await createScientificRevision(f);
  assert.equal(a.scientific_digest, b.scientific_digest);
  assert.equal(a.graph_digest, b.graph_digest);
  assert.equal(a.sources.find((s) => s.source_id === 's1').revision_id, b.sources.find((s) => s.source_id === 's1').revision_id);
  assert.notDeepEqual(a.provenance, b.provenance);
});

test('snapshots detach from input and recursively freeze; mutation during hash cannot change them', async () => {
  const f = completeFixture(); const pending = createScientificRevision(f);
  f.content.claim_text = 'mutated'; f.sources[0].content.title = 'mutated';
  const r = await pending;
  assert.equal(r.content.claim_text, completeFixture().content.claim_text);
  assert.equal(r.sources.find((s) => s.source_id === 's1').content.title, 'Synthetic report 0');
  assert.throws(() => { r.content.limitations.push('mutated'); }, TypeError);
  assert.throws(() => { r.relationships[0].scope.population = 'mutated'; }, TypeError);
  const src = completeFixture().sources[0]; const sourcePending = createSourceRevision(src);
  src.provenance.batch_id = 'mutated';
  assert.equal((await sourcePending).provenance.batch_id, 'synthetic-batch');
});

test('absence, null, empty and scientific text spacing remain distinct', async () => {
  const values = [];
  for (const state of ['absent', null, []]) {
    const f = completeFixture();
    if (state === 'absent') delete f.content.limitations; else f.content.limitations = state;
    values.push((await createScientificRevision(f)).scientific_digest);
  }
  assert.equal(new Set(values).size, 3);
  assert.notEqual(canonicalScientificJSON('not  effective'), canonicalScientificJSON('not effective'));
});

test('ambiguous, missing, duplicate and unlinked endpoints fail clearly', async () => {
  const cases = [
    ['AMBIGUOUS_ENDPOINT', (f) => { f.relationships[0].related_claim_id = 'related-1'; }],
    ['AMBIGUOUS_ENDPOINT', (f) => { delete f.relationships[0].source_id; }],
    ['MISSING_ENDPOINT', (f) => { f.relationships[0].source_id = 'missing'; }],
    ['MISSING_ENDPOINT', (f) => { f.primary_source_id = 'missing'; }],
    ['DUPLICATE_ENDPOINT', (f) => { f.sources.push(clone(f.sources[0])); }],
    ['INCOMPLETE_RELATIONSHIP', (f) => { delete f.relationships[0].locator; }],
    ['INCOMPLETE_RELATIONSHIP', (f) => { f.relationships[0].scope = {}; }],
    ['INCOMPLETE_RELATIONSHIP', (f) => { f.relationships = []; }],
    ['INVALID_RELATION', (f) => { f.relationships[0].relation = 'mentions'; }],
    ['MISSING_STUDY_IDENTITY', (f) => { delete f.sources[0].study_family_id; }],
    ['REVISION_MISMATCH', (f) => { f.related_claims[0].revision_id = 'mutable-claim'; }],
    ['UNUSED_ENDPOINT', (f) => { f.relationships.pop(); }],
  ];
  for (const [code, change] of cases) {
    const f = completeFixture(); change(f);
    await rejectsCode(() => createScientificRevision(f), code);
  }
});

test('unknown scientific fields and extras fail, accepted nested fields are retained', async () => {
  for (const add of [
    (f) => { f.content.unknown_scientific_field = 'do not discard'; },
    (f) => { f.sources[0].content.new_access_restriction = true; },
    (f) => { f.relationships[0].unknown_qualification = 'important'; },
    (f) => { f.content.scientific_extras = { unreviewed_extra: 'important' }; },
  ]) { const f = completeFixture(); add(f); await rejectsCode(() => createScientificRevision(f), 'UNCLASSIFIED_FIELD'); }
});

test('lossy JSON types, cycles, prototype objects and sparse arrays are rejected', () => {
  const cycle = {}; cycle.self = cycle;
  const accessor = Object.defineProperty({}, 'value', { enumerable: true, get: () => 'hidden code' });
  const decorated = Object.defineProperty([1], 'hidden', { value: 'do not drop' });
  const arrayAccessor = Object.defineProperty([1], '0', { enumerable: true, get: () => 1 });
  for (const value of [undefined, NaN, Infinity, -0, 1n, new Date(), new Map(), cycle, { x: undefined }, [, 1], { [Symbol('x')]: 1 }, accessor, decorated, arrayAccessor]) {
    assert.throws(() => canonicalScientificJSON(value));
  }
  assert.equal(canonicalScientificJSON({ b: 2, a: 1 }), '{"a":1,"b":2}');
});

test('tampered source, edge identity, digest, graph or version cannot pass round-trip verification', async () => {
  const r = await createScientificRevision(completeFixture());
  for (const change of [
    (v) => { v.sources[0].content.title += 'changed'; },
    (v) => { v.sources[0].revision_id = 'forged'; },
    (v) => { v.source_revisions[0].content.title += 'changed'; },
    (v) => { v.relationships[0].edge_id = 'forged'; },
    (v) => { v.relationships[0].endpoint_revision_id = 'forged'; },
    (v) => { v.scientific_digest = 'a'.repeat(64); },
    (v) => { v.graph_digest = 'a'.repeat(64); },
  ]) { const altered = clone(r); change(altered); await rejectsCode(() => verifyScientificRevision(altered), 'REVISION_MISMATCH'); }
  const altered = clone(r); altered.contract_version = 'future';
  await rejectsCode(() => verifyScientificRevision(altered), 'UNSUPPORTED_VERSION');
});

test('legacy single-source feed packets and DB-mapped rows retain scientific and historical data', async () => {
  const packet = { batch_id: 'SYNTHETIC-LEGACY', researched_at: '2026-10-01T10:00:00Z', research_topic: 'Synthetic scalp health',
    evidence_strength: 'weak', verification: { cross_checked: false }, contradictions: [],
    sources: [{ source_id: 'S1', title: 'Synthetic bibliography', source_type: 'clinical_study', authors: ['A'], publication_date: '2026-01-01' }],
    claims: [{ claim_id: 'C1', statement: 'Synthetic legacy statement.', source_ids_supporting: ['S1'], source_ids_contradicting: [], verification_status: 'DISCOVERED', confidence: 'low' }] };
  const { batch } = packetToBatch(packet);
  for (const [source, claim] of [[batch.sources[0], batch.claims[0]], [mapSourceRow(batch.sources[0]), mapClaimRow(batch.claims[0])]]) {
    const r = await revisionFromLegacySingleSource({ source, claim });
    assert.equal(r.claim_id, claim.claim_id);
    assert.equal(r.primary_source_id, claim.source_id);
    assert.equal(r.content.claim_text, packet.claims[0].statement);
    assert.equal(r.content.body_markdown, claim.body_markdown);
    assert.equal(r.sources[0].evidence_identity, 'metadata_only');
    assert.equal(r.sources[0].study_family_id, null);
    assert.equal(r.relationships[0].locator.status, 'unknown');
    assert.equal(r.content.scientific_extras.packet_confidence, 'low');
    assert.equal(r.provenance.verification_status, 'DISCOVERED');
    assert.deepEqual(await verifyScientificRevision(clone(r)), r);
  }
  batch.claims[0].verification_status = 'AIMT_APPROVED';
  const historical = await revisionFromLegacySingleSource({ source: batch.sources[0], claim: batch.claims[0] });
  assert.equal(historical.provenance.verification_status, 'AIMT_APPROVED');
  assert.equal(historical.status, undefined); // no invented human decision
});

test('legacy richer or unknown extras cannot silently become a primary-only graph', async () => {
  const source = { source_id: 's1', title: 'Synthetic source' };
  const claim = { claim_id: 'c1', source_id: 's1', claim_text: 'Synthetic statement.' };
  await rejectsCode(() => revisionFromLegacySingleSource({ source, claim: { ...claim, extras: { contradicting_source_ids: ['s2'] } } }), 'INCOMPLETE_RELATIONSHIP');
  await rejectsCode(() => revisionFromLegacySingleSource({ source, claim: { ...claim, extras: { scientific_unknown: 'retained by refusal' } } }), 'UNCLASSIFIED_FIELD');
  await rejectsCode(() => revisionFromLegacySingleSource({ source, claim: { ...claim, supporting_source_ids: ['s1'], extras: { supporting_source_ids: ['s1'] } } }), 'AMBIGUOUS_FIELD');
  await rejectsCode(() => revisionFromLegacySingleSource({ source, claim: { ...claim, extras: [] } }), 'INVALID_OBJECT');
  await rejectsCode(() => revisionFromLegacySingleSource({ source, claim: { ...claim, supporting_source_ids: null } }), 'INVALID_ARRAY');
  await rejectsCode(() => revisionFromLegacySingleSource({ source, claim: { ...claim, contradicting_source_ids: null } }), 'INVALID_ARRAY');
  const withFamily = await revisionFromLegacySingleSource({ source: { ...source, extras: { study_family_id: 'synthetic-study' } }, claim });
  assert.equal(withFamily.sources[0].study_family_id, 'synthetic-study');
});

test('clearance and human approval are independent immutable decision contracts', async () => {
  const r = await createScientificRevision(completeFixture());
  const cleared = await bindScientificDecision(r, decision(r));
  const approved = await bindScientificDecision(r, decision(r, false));
  assert.equal(cleared.status, 'EVIDENCE_CLEARED');
  assert.equal(approved.status, 'AIMT_APPROVED');
  assert.notEqual(cleared.decision_digest, approved.decision_digest);
  assert.equal(r.status, undefined);
  assert.throws(() => { cleared.status = 'AIMT_APPROVED'; }, TypeError);
  const f = completeFixture(); f.content.claim_text += ' Material change.';
  const newer = await createScientificRevision(f);
  await rejectsCode(() => bindScientificDecision(newer, decision(r, false)), 'REVISION_MISMATCH');
  assert.equal(approved.revision_id, r.revision_id); // old event retained, never rebound
});

test('automation cannot substitute institutional status or human actor authority', async () => {
  const r = await createScientificRevision(completeFixture());
  for (const [automatic, change] of [
    [true, (d) => { d.status = 'AIMT_APPROVED'; }],
    [true, (d) => { d.actor.actor_type = 'human'; }],
    [false, (d) => { d.actor.actor_type = 'automation'; }],
    [false, (d) => { d.status = 'EVIDENCE_CLEARED'; }],
  ]) { const d = decision(r, automatic); change(d); await rejectsCode(() => bindScientificDecision(r, d), 'AUTHORITY_BOUNDARY'); }
  const d = decision(r); d.authority_id = 'fake';
  await rejectsCode(() => bindScientificDecision(r, d), 'UNCLASSIFIED_FIELD');
});

test('incomplete, expired-at-issue or failed clearance contracts fail explicitly', async () => {
  const r = await createScientificRevision(completeFixture());
  for (const [code, change] of [
    ['INCOMPLETE_DECISION', (d) => { delete d.policy_version; }],
    ['INCOMPLETE_DECISION', (d) => { d.checks = []; }],
    ['FAILED_CLEARANCE_CHECK', (d) => { d.checks[0].result = 'review_required'; }],
    ['INVALID_TIME', (d) => { d.expires_at = d.decided_at; }],
    ['INVALID_TIME', (d) => { d.decided_at = '2026-02-31T10:00:00Z'; }],
    ['INVALID_TIME', (d) => { d.withdrawal = { event_id: 'synthetic-event', withdrawn_at: '2026-09-01T10:00:00Z', reason: 'Impossible chronology.' }; }],
    ['INVALID_DIGEST', (d) => { d.checks[0].evidence_digest = 'mutable-id'; }],
    ['INCOMPLETE_DECISION', (d) => { d.permitted_use = []; }],
  ]) { const d = decision(r); change(d); await rejectsCode(() => bindScientificDecision(r, d), code); }
  const d = decision(r); d.withdrawal = { event_id: 'synthetic-withdrawal', withdrawn_at: '2026-10-02T10:00:00Z', reason: 'Synthetic correction.' };
  assert.deepEqual((await bindScientificDecision(r, d)).withdrawal, d.withdrawal);
});
