/** Pure Phase 2B planning boundary. No I/O and no approval/clearance writer.
 * See docs/research/phase2b/IMPORT-PLANNER.md for the explicit snapshot API.
 */
import {
  canonicalScientificJSON as json, createSourceRevision, createScientificRevision,
  verifyScientificRevision, revisionFromLegacySingleSource, supportingStudyFamilies,
  ScientificContractError,
} from './scientific-revision-contract.mjs';
import { validatePacket, packetToBatch, feedId } from './packet-adapter.mjs';
import { validateSource, validateClaim } from './schema.mjs';

export const IMPORT_PLANNER_VERSION = 'aimt-revision-import-planner-v1';
const own = (o, k) => Object.hasOwn(o, k);
const copy = (v) => JSON.parse(json(v));
const fail = (code, path, message) => { throw new ScientificContractError(code, path, message); };
const text = (v, path) => {
  if (typeof v !== 'string' || !v.trim()) fail('REQUIRED_STRING', path, 'non-empty identity required');
  return v;
};
function freeze(v) {
  if (v && typeof v === 'object') { Object.values(v).forEach(freeze); Object.freeze(v); }
  return v;
}
function index(rows, field) {
  if (!Array.isArray(rows)) fail('INVALID_ARRAY', field, 'array required');
  const result = new Map();
  for (const row of rows) {
    text(row[field], field);
    if (result.has(row[field])) fail('AMBIGUOUS_IDENTITY', field, `duplicate ${row[field]}`);
    result.set(row[field], row);
  }
  return result;
}
function flat(row) {
  const result = { ...row }; delete result.extras;
  if (row.extras !== undefined && (!row.extras || typeof row.extras !== 'object' || Array.isArray(row.extras))) {
    fail('INVALID_OBJECT', 'extras', 'object required');
  }
  for (const [key, value] of Object.entries(row.extras ?? {})) {
    if (own(result, key)) fail('AMBIGUOUS_FIELD', key, 'both row and extras supply field');
    result[key] = value;
  }
  return result;
}
async function observationDigest(observation) {
  const bytes = new TextEncoder().encode(json({ planner_version: IMPORT_PLANNER_VERSION, observation }));
  return [...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes))].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const sourceInput = (r) => ({ source_id: r.source_id, study_family_id: r.study_family_id, content: r.content, provenance: r.provenance });
async function sourceFromRow(row) {
  // Reuse the authoritative legacy field classification, never a second digest.
  const r = await revisionFromLegacySingleSource({ source: row,
    claim: { claim_id: 'planner-partition-only', source_id: row.source_id, claim_text: 'partition only' } });
  return r.sources[0];
}
function declarations(row) {
  const f = flat(row);
  const supports = own(f, 'supporting_source_ids') ? f.supporting_source_ids : [f.source_id];
  const contradicts = own(f, 'contradicting_source_ids') ? f.contradicting_source_ids : [];
  const qualifies = own(f, 'qualifying_source_ids') ? f.qualifying_source_ids : [];
  for (const [name, ids] of Object.entries({ supports, contradicts, qualifies })) {
    if (!Array.isArray(ids)) fail('INVALID_ARRAY', name, 'source IDs required');
    ids.forEach((id) => text(id, name));
  }
  if (!supports.includes(f.source_id)) fail('INCOMPLETE_RELATIONSHIP', 'source_id', 'primary absent from supports');
  return { supports, contradicts, qualifies };
}
async function claimContent(row) {
  const f = flat(row);
  delete f.supporting_source_ids; delete f.contradicting_source_ids; delete f.qualifying_source_ids;
  const r = await revisionFromLegacySingleSource({ source: { source_id: f.source_id, title: 'partition only' }, claim: f });
  return { content: r.content, provenance: r.provenance };
}
const relationKey = (e) => json({ relation: e.relation, ...(own(e, 'source_id') ? { source_id: e.source_id } : { related_claim_id: e.related_claim_id }), scope: e.scope, locator: e.locator });
const unresolved = (v) => v == null || v === '' || (typeof v === 'object' && (v.status === 'unknown' || !Object.keys(v).length));
function token(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some((k) => !['revision_id', 'version'].includes(k)) ||
      !own(value, 'revision_id') || !(value.revision_id === null || typeof value.revision_id === 'string' && value.revision_id.trim()) ||
      !Number.isSafeInteger(value.version) || value.version < 0 || value.version >= Number.MAX_SAFE_INTEGER ||
      (value.revision_id === null && value.version !== 0)) {
    fail('INVALID_HEAD', path, 'exact {revision_id, version}; absence is {revision_id:null, version:0}');
  }
  return value;
}

/** Recheck every read dependency immediately before a future atomic commit.
 * Returning ok here is NOT a transaction or authorization. Version detects ABA.
 */
export function checkImportPlanHeads(plan, currentHeads) {
  try {
    if (plan?.ok !== true || plan.status !== 'planned' || !Array.isArray(plan.preconditions) || !plan.preconditions.length) fail('INVALID_PLAN', 'plan', 'successful non-empty plan required');
    const conflicts = [];
    for (const p of plan.preconditions) {
      const current = token(currentHeads?.[p.kind]?.[p.logical_id], `${p.kind}.${p.logical_id}`);
      if (json(current) !== json(p.expected_head)) conflicts.push({ code: 'STALE_HEAD', kind: p.kind, logical_id: p.logical_id, expected: p.expected_head, current });
    }
    return freeze({ ok: !conflicts.length, conflicts });
  } catch (e) {
    if (!(e instanceof ScientificContractError)) throw e;
    return freeze({ ok: false, conflicts: [{ code: e.code, path: e.path, message: e.message }] });
  }
}

function packetRows(packet, library, identities) {
  const validation = validatePacket(packet);
  if (!validation.ok) fail('INVALID_PACKET', 'packet', validation.errors.join('; '));
  const doiIds = new Map();
  for (const s of library.sources) if (s.doi) {
    const doi = String(s.doi).toLowerCase();
    if (doiIds.has(doi) && doiIds.get(doi) !== s.source_id) fail('AMBIGUOUS_IDENTITY', 'doi', doi);
    doiIds.set(doi, s.source_id);
  }
  // Deliberately map ALL incoming sources, including DOI-reused sources, so a
  // correction/retraction cannot disappear through packetToBatch's skip path.
  const batch = packetToBatch(packet).batch;
  const mapped = new Map();
  const used = new Set();
  packet.sources.forEach((raw, i) => {
    const doiId = raw.doi ? doiIds.get(String(raw.doi).toLowerCase()) : undefined;
    const explicit = identities.sources?.[raw.source_id];
    if (doiId && explicit && doiId !== explicit) fail('CONFLICTING_IDENTITY', 'identity_map.sources', raw.source_id);
    const id = explicit ?? doiId ?? feedId('src', raw.source_id);
    text(id, 'source_id');
    const existing = library.sources.find((s) => s.source_id === id);
    const original = existing?.packet_source_id ?? existing?.extras?.packet_source_id;
    if (!explicit && !doiId && original && original !== raw.source_id) fail('AMBIGUOUS_IDENTITY', id, 'feed ID collides with prior packet source');
    if (!explicit && !doiId && existing?.doi && raw.doi && String(existing.doi).toLowerCase() !== String(raw.doi).toLowerCase()) fail('CONFLICTING_IDENTITY', id, 'DOI differs from existing logical source');
    if (used.has(id)) fail('AMBIGUOUS_IDENTITY', 'source_id', 'multiple packet reports resolve to one source; explicit distinct report IDs required');
    used.add(id); mapped.set(raw.source_id, id);
    const row = batch.sources[i]; row.source_id = id;
    delete row.use_status_reason; // Adapter-generated batch bookkeeping, retained in observation.
    // Full packet scientific detail is opaque nested scientific content under
    // the contract, rather than a lossy new allowlist for packet extensions.
    const { source_id, verification_status, ...details } = raw;
    if (raw.body_sections && own(raw.body_sections, 'packet_source')) fail('AMBIGUOUS_FIELD', 'packet_source', 'reserved packet snapshot field');
    row.body_sections = { ...raw.body_sections, packet_source: details };
    for (const k of ['study_family_id', 'evidence_text', 'evidence_digest', 'locator', 'date_retrieved', 'version_or_amendment', 'correction_status', 'retraction_status', 'rights_access_status', 'use_status', 'use_status_reason', 'license_or_rights_notes', 'limitations', 'qualifications', 'full_text_held', 'full_text_access_observed', 'verification_depth', 'body_markdown']) {
      if (own(raw, k)) row[k] = raw[k];
    }
    if (verification_status === 'AIMT_APPROVED') fail('AUTHORITY_BOUNDARY', 'packet.sources', 'incoming institutional status forbidden');
  });
  const rawClaimIds = new Set(packet.claims.map((c) => c.claim_id));
  for (const contradiction of packet.contradictions) {
    if (!Array.isArray(contradiction.related_claim_ids) || !contradiction.related_claim_ids.length ||
        contradiction.related_claim_ids.some((id) => !rawClaimIds.has(id)) ||
        !Array.isArray(contradiction.source_ids_involved) || !contradiction.source_ids_involved.length ||
        contradiction.source_ids_involved.some((id) => !mapped.has(id))) {
      fail('INCOMPLETE_CONTRADICTION', 'packet.contradictions', 'explicit existing claim/source endpoints required');
    }
  }
  const claimIds = new Set();
  packet.claims.forEach((raw, i) => {
    const row = batch.claims[i];
    delete row.use_status_reason;
    row.claim_id = identities.claims?.[raw.claim_id] ?? feedId('claim', raw.claim_id);
    text(row.claim_id, 'claim_id');
    const existing = library.claims.find((c) => c.claim_id === row.claim_id);
    const original = existing?.packet_claim_id ?? existing?.extras?.packet_claim_id;
    if (!identities.claims?.[raw.claim_id] && original && original !== raw.claim_id) fail('AMBIGUOUS_IDENTITY', row.claim_id, 'feed ID collides with prior packet claim');
    if (claimIds.has(row.claim_id)) fail('AMBIGUOUS_IDENTITY', 'claim_id', 'packet IDs collide');
    claimIds.add(row.claim_id);
    row.source_id = mapped.get(raw.source_ids_supporting[0]);
    row.supporting_source_ids = raw.source_ids_supporting.map((id) => mapped.get(id));
    row.contradicting_source_ids = (raw.source_ids_contradicting ?? []).map((id) => mapped.get(id));
    if (own(raw, 'source_ids_qualifying')) row.qualifying_source_ids = raw.source_ids_qualifying.map((id) => mapped.get(id) ?? fail('MISSING_ENDPOINT', 'qualifying', id));
    const { claim_id, statement, verification_status, source_ids_supporting, source_ids_contradicting, source_ids_qualifying, ...details } = raw;
    for (const k of ['claim_type', 'claim_text_fidelity', 'population_or_scope', 'direction', 'extraction_basis', 'extraction_confidence', 'claim_origin', 'locator', 'page_or_section_locator', 'limitations', 'safety_qualifications', 'qualifications', 'use_status', 'use_status_reason', 'verified_against_primary_source', 'body_markdown']) {
      if (own(raw, k)) row[k] = raw[k];
    }
    if (raw.body_sections && (own(raw.body_sections, 'packet_claim') || own(raw.body_sections, 'recorded_contradictions'))) fail('AMBIGUOUS_FIELD', 'packet_claim', 'reserved packet snapshot field');
    row.body_sections = { ...raw.body_sections, packet_claim: details,
      recorded_contradictions: packet.contradictions.filter((c) => (c.related_claim_ids ?? []).includes(raw.claim_id)) };
  });
  return batch;
}

/** Input is an existing packet OR sources/claims import batch, a complete
 * caller-supplied library snapshot, explicit evidence and expected head tokens.
 * All-or-nothing: rejected/incomplete/conflicting results have empty append.
 * Candidates remain available for private review, never receive decisions.
 */
export async function planResearchImport(input) {
  let candidates = [], preconditions = [], retainedHistory = null;
  const empty = () => ({ source_revisions: [], claim_revisions: [], evidence_edges: [], provenance: [] });
  try {
    input = copy(input); // synchronous lossless detach before first await
    const { library, expected_heads, evidence = {}, identity_map = {} } = input;
    for (const key of Object.keys(input)) if (!['library', 'expected_heads', 'evidence', 'identity_map', 'packet', 'batch'].includes(key)) fail('UNCLASSIFIED_FIELD', key, 'unknown planner input');
    for (const key of Object.keys(evidence)) if (!['relationships', 'related_claims'].includes(key)) fail('UNCLASSIFIED_FIELD', `evidence.${key}`, 'unknown evidence input');
    for (const key of Object.keys(identity_map)) if (!['sources', 'claims'].includes(key)) fail('UNCLASSIFIED_FIELD', `identity_map.${key}`, 'unknown identity input');
    if (input.batch && Object.keys(identity_map).length) fail('INVALID_INPUT', 'identity_map', 'batch IDs are already library IDs');
    if (!library || !expected_heads || own(input, 'packet') === own(input, 'batch')) fail('INVALID_INPUT', 'input', 'packet XOR batch, library and expected_heads required');
    if (library.decisions !== undefined && !Array.isArray(library.decisions)) fail('INVALID_ARRAY', 'library.decisions', 'historical decision array required');
    const librarySources = index(library.sources, 'source_id');
    const libraryClaims = index(library.claims, 'claim_id');
    const knownSources = index(library.source_revisions, 'revision_id');
    const knownClaims = index(library.claim_revisions, 'revision_id');
    for (const s of knownSources.values()) {
      const rebuilt = await createSourceRevision(sourceInput(s));
      if (json(rebuilt) !== json(s)) fail('REVISION_MISMATCH', 'library.source_revisions', s.revision_id);
    }
    for (const r of knownClaims.values()) {
      await verifyScientificRevision(r);
      for (const s of r.sources) if (!knownSources.has(s.revision_id) || json(sourceInput(s).content) !== json(knownSources.get(s.revision_id).content)) {
        fail('MISSING_REVISION', 'library.source_revisions', s.revision_id);
      }
      for (const related of r.related_claims) if (!knownClaims.has(related.revision_id)) fail('MISSING_REVISION', 'library.related_claims', related.revision_id);
    }
    retainedHistory = { source_revision_ids: [...knownSources.keys()].sort(), claim_revision_ids: [...knownClaims.keys()].sort(),
      decisions: library.decisions ?? [], legacy_sources: library.sources, legacy_claims: library.claims };
    const guards = new Map();
    function guard(kind, id) {
      const key = `${kind}:${id}`;
      if (guards.has(key)) return guards.get(key);
      const current = token(library.heads?.[kind]?.[id], `library.heads.${kind}.${id}`);
      const expected = token(expected_heads?.[kind]?.[id], `expected_heads.${kind}.${id}`);
      if (json(current) !== json(expected)) fail('STALE_HEAD', key, 'expected head differs from snapshot');
      const known = kind === 'sources' ? knownSources : knownClaims;
      if (current.revision_id !== null && (!known.has(current.revision_id) || known.get(current.revision_id)[kind === 'sources' ? 'source_id' : 'claim_id'] !== id)) fail('MISSING_REVISION', key, 'head not in immutable history');
      if (current.revision_id === null && (kind === 'sources' ? librarySources : libraryClaims).has(id)) fail('LEGACY_BACKFILL_REQUIRED', key, 'existing logical row requires explicit baseline revision/head');
      guards.set(key, { kind, logical_id: id, expected_head: expected });
      return guards.get(key);
    }
    const batch = input.packet ? packetRows(input.packet, library, identity_map) : input.batch;
    text(batch.batch_id, 'batch_id');
    if (batch.relationships?.length) fail('UNCLASSIFIED_RELATIONSHIPS', 'batch.relationships', 'legacy relationship rows require explicit typed evidence reconciliation');
    const rows = index(batch.sources, 'source_id');
    const claims = index(batch.claims, 'claim_id');
    for (const values of [evidence.relationships, evidence.related_claims]) if (values) for (const id of Object.keys(values)) {
      if (!claims.has(id)) fail('UNUSED_EVIDENCE', id, 'evidence supplied for absent incoming claim');
    }
    if (input.packet) for (const raw of input.packet.claims) {
      const id = identity_map.claims?.[raw.claim_id] ?? feedId('claim', raw.claim_id);
      if (own(raw, 'related_claim_ids')) {
        if (!Array.isArray(raw.related_claim_ids)) fail('INVALID_ARRAY', 'packet.related_claim_ids', 'array required');
        for (const related of raw.related_claim_ids) {
          const relatedId = identity_map.claims?.[related] ?? feedId('claim', related);
          if (!evidence.relationships?.[id]?.some((e) => e.related_claim_id === relatedId)) fail('INCOMPLETE_RELATIONSHIP', id, 'declared related claim requires explicit typed edge and verified revision');
        }
      }
    }
    if (!claims.size) fail('INVALID_INPUT', 'claims', 'non-empty claims required');
    const sourceCandidates = new Map();
    for (const row of rows.values()) {
      if (row.verification_status === 'AIMT_APPROVED') fail('AUTHORITY_BOUNDARY', row.source_id, 'incoming institutional status forbidden');
      const validation = validateSource(row);
      if (validation.errors.length) fail('INVALID_SOURCE', row.source_id, validation.errors.join('; '));
      guard('sources', row.source_id);
      const candidate = await sourceFromRow(row);
      const previous = knownSources.get(library.heads.sources[row.source_id].revision_id);
      if (previous) for (const key of Object.keys(previous.content)) if (!own(candidate.content, key)) fail('INCOMPLETE_SOURCE_SNAPSHOT', row.source_id, `omitted scientific field ${key}`);
      sourceCandidates.set(row.source_id, candidate);
    }
    const problems = [];
    for (const row of claims.values()) {
      const validation = validateClaim(row);
      if (validation.errors.length) fail('INVALID_CLAIM', row.claim_id, validation.errors.join('; '));
      if (row.verification_status === 'AIMT_APPROVED') fail('AUTHORITY_BOUNDARY', row.claim_id, 'incoming institutional status forbidden');
      const claimGuard = guard('claims', row.claim_id);
      const declared = declarations(row);
      const { content, provenance } = await claimContent(row);
      const relationships = evidence.relationships?.[row.claim_id] ?? Object.entries(declared).flatMap(([type, ids]) => ids.map((id) => ({
        source_id: id, relation: { supports: 'supports', contradicts: 'contradicts', qualifies: 'qualifies' }[type],
        scope: content.population_or_scope || { status: 'unknown', reason: 'scope not supplied' },
        locator: content.page_or_section_locator || content.locator || { status: 'unknown', reason: 'locator not supplied' },
      })));
      for (const [type, ids] of Object.entries(declared)) for (const id of ids) {
        const relation = { supports: 'supports', contradicts: 'contradicts', qualifies: 'qualifies' }[type];
        if (!relationships.some((e) => e.source_id === id && e.relation === relation)) fail('INCOMPLETE_RELATIONSHIP', row.claim_id, `declared ${relation} ${id} missing`);
      }
      const sourceIds = new Set(relationships.filter((e) => own(e, 'source_id')).map((e) => e.source_id));
      const sources = [];
      for (const id of sourceIds) {
        guard('sources', id);
        let src = sourceCandidates.get(id);
        if (!src) {
          const head = library.heads.sources[id];
          src = knownSources.get(head.revision_id);
          if (!src) fail('MISSING_ENDPOINT', id, 'source absent');
        }
        sources.push(sourceInput(src));
      }
      const relatedClaims = evidence.related_claims?.[row.claim_id] ?? [];
      for (const related of relatedClaims) {
        guard('claims', related.claim_id);
        const stored = knownClaims.get(related.revision_id);
        if (!stored || stored.claim_id !== related.claim_id || stored.scientific_digest !== related.scientific_digest) fail('MISSING_REVISION', row.claim_id, 'related immutable revision not verified');
      }
      const revision = await createScientificRevision({ claim_id: row.claim_id, primary_source_id: row.source_id, content, sources,
        relationships, related_claims: relatedClaims, provenance: { ...provenance, original_record: row, batch_id: batch.batch_id } });
      candidates.push(revision);
      const previous = knownClaims.get(claimGuard.expected_head.revision_id);
      // Content/endpoint revision changes are allowed; relationship omission is
      // not supersession. A removed or changed scope/locator requires review.
      if (previous) {
        for (const key of Object.keys(previous.content)) if (!own(revision.content, key)) problems.push({ code: 'INCOMPLETE_CLAIM_SNAPSHOT', claim_id: row.claim_id, field: key });
        const incoming = new Set(revision.relationships.map(relationKey));
        const oldCounts = new Map();
        for (const edge of previous.relationships) oldCounts.set(relationKey(edge), (oldCounts.get(relationKey(edge)) ?? 0) + 1);
        for (const [key, count] of oldCounts) {
          if (revision.relationships.filter((e) => relationKey(e) === key).length < count) problems.push({ code: 'RELATIONSHIP_OMISSION', claim_id: row.claim_id, relationship: JSON.parse(key) });
        }
        for (const old of previous.relationships) {
          if (!incoming.has(relationKey(old))) problems.push({ code: 'RELATIONSHIP_OMISSION', claim_id: row.claim_id, edge_id: old.edge_id });
          const matches = revision.relationships.filter((e) => relationKey(e) === relationKey(old));
          if (matches.length && !matches.some((e) => Object.keys(old).every((k) => own(e, k)))) problems.push({ code: 'INCOMPLETE_RELATIONSHIP', claim_id: row.claim_id, edge_id: old.edge_id });
        }
      }
      for (const edge of revision.relationships) if (unresolved(edge.scope) || unresolved(edge.locator)) problems.push({ code: 'MISSING_EVIDENCE_LOCATOR_OR_SCOPE', claim_id: row.claim_id, edge_id: edge.edge_id });
      for (const s of revision.sources) {
        if (s.evidence_identity === 'metadata_only') problems.push({ code: 'MISSING_SOURCE_EVIDENCE', source_id: s.source_id });
        if (s.study_family_id === null) problems.push({ code: 'UNRESOLVED_STUDY_FAMILY', source_id: s.source_id });
      }
    }
    // Unused incoming sources are never silently accepted/dropped.
    for (const id of rows.keys()) if (!candidates.some((r) => r.sources.some((s) => s.source_id === id))) fail('UNUSED_ENDPOINT', id, 'source not referenced by any incoming claim');
    preconditions = [...guards.values()].sort((a, b) => json(a) < json(b) ? -1 : json(a) > json(b) ? 1 : 0);
    if (problems.length) return freeze({ ok: false, status: 'incomplete', planner_version: IMPORT_PLANNER_VERSION, reasons: problems,
      candidates, preconditions, append: empty(), retained_history: retainedHistory });
    const append = empty();
    const plannedSources = new Set();
    const outcomes = [];
    const submissionHeadUpdates = [];
    for (const revision of candidates) {
      const exists = knownClaims.has(revision.revision_id);
      outcomes.push({ claim_id: revision.claim_id, revision_id: revision.revision_id, action: exists ? 'reuse' : 'append_pending',
        parent_revision_id: library.heads.claims[revision.claim_id].revision_id, study_families: supportingStudyFamilies(revision),
        reason_code: exists ? 'UNCHANGED_SCIENTIFIC_CONTENT' : library.heads.claims[revision.claim_id].revision_id ? 'SCIENTIFIC_CONTENT_CHANGED' : 'NEW_CLAIM',
        review_reasons: [
          ...(revision.relationships.some((e) => e.relation === 'contradicts') ? ['CONTRADICTING_EVIDENCE'] : []),
          ...revision.sources.flatMap((s) => [
            ...(s.content.retraction_status === 'retracted' ? ['SOURCE_RETRACTED'] : []),
            ...(s.content.correction_status === 'corrected' ? ['SOURCE_CORRECTED'] : []),
          ]),
        ], human_approval: 'not_transferred', automatic_clearance: 'not_evaluated' });
      for (const source of revision.sources) if (!knownSources.has(source.revision_id) && !plannedSources.has(source.revision_id)) {
        plannedSources.add(source.revision_id);
        append.source_revisions.push({ revision: source, parent_revision_id: library.heads.sources[source.source_id].revision_id });
        submissionHeadUpdates.push({ kind: 'sources', logical_id: source.source_id, expected_head: library.heads.sources[source.source_id],
          next_head: { revision_id: source.revision_id, version: library.heads.sources[source.source_id].version + 1 } });
      }
      if (!exists) {
        append.claim_revisions.push({ revision, parent_revision_id: library.heads.claims[revision.claim_id].revision_id, state: 'pending' });
        submissionHeadUpdates.push({ kind: 'claims', logical_id: revision.claim_id, expected_head: library.heads.claims[revision.claim_id],
          next_head: { revision_id: revision.revision_id, version: library.heads.claims[revision.claim_id].version + 1 } });
        for (const edge of revision.relationships) append.evidence_edges.push({ claim_revision_id: revision.revision_id, edge });
      }
      // Exact retries coalesce; distinct operational observations append even
      // within the same batch. Raw packet detail is retained for reconciliation.
      const observation = { input: input.packet ?? batch, incoming_revision: revision };
      append.provenance.push({ idempotency_key: `${revision.revision_id}:observation:sha256:${await observationDigest(observation)}`,
        revision_id: revision.revision_id, observation });
    }
    return freeze({ ok: true, status: 'planned', planner_version: IMPORT_PLANNER_VERSION, reasons: [], candidates, outcomes, preconditions,
      append, submission_head_updates: submissionHeadUpdates, retained_history: retainedHistory, decisions_to_append: [], authorized_selections_to_change: [] });
  } catch (e) {
    if (!(e instanceof ScientificContractError)) {
      if (!(e instanceof TypeError)) throw e;
      e = new ScientificContractError('INVALID_INPUT', 'input', 'malformed planner input');
    }
    const status = e.code === 'STALE_HEAD' || e.code === 'CONFLICTING_IDENTITY' ? 'conflicting' : 'rejected';
    return freeze({ ok: false, status, planner_version: IMPORT_PLANNER_VERSION,
      reasons: [{ code: e.code, path: e.path, message: e.message }], candidates, preconditions, append: empty(), retained_history: retainedHistory });
  }
}
