/* Phase 2B: pure, unwired, zero-dependency scientific snapshot contract.
 * No I/O, status writes, authority inference or evidence-clearance policy.
 * Version 1 canonical JSON sorts object keys and graph sets, preserves ordered
 * scientific arrays and exact text, and distinguishes absent/null/empty.
 * IDs are supplied logical identities; revision IDs are content addressed.
 * A complete snapshot is NOT a patch or permission to delete historical edges.
 * Deep freezing protects in-memory snapshots, not persisted database records.
 */
export const CONTRACT_VERSION = 'aimt-scientific-revision-v1';
export const CANONICALIZATION_VERSION = 'aimt-canonical-json-v1';

export class ScientificContractError extends Error {
  constructor(code, path, message) {
    super(`${code} at ${path}: ${message}`);
    this.name = 'ScientificContractError';
    this.code = code;
    this.path = path;
  }
}
const fail = (code, path, message) => { throw new ScientificContractError(code, path, message); };
const own = (o, k) => Object.hasOwn(o, k);
const list = (text) => text.split(' ');
const SOURCE_FIELDS = list('title authors year date_published source_venue doi url pmid pmcid evidence_type source_role topics verification_depth rights_access_status full_text_held full_text_access_observed license_or_rights_notes date_retrieved version_or_amendment freshness_notes correction_status retraction_status evidence_text evidence_digest locator body_markdown body_sections use_status use_status_reason limitations qualifications');
const CLAIM_FIELDS = list('claim_text claim_type claim_text_fidelity topics population_or_scope direction extraction_basis extraction_confidence claim_origin locator page_or_section_locator body_markdown body_sections limitations safety_qualifications qualifications use_status use_status_reason verified_against_primary_source');
const EDGE_FIELDS = list('relation source_id related_claim_id scope locator quote qualifications confidence review_status provenance');
// These values are retained outside the scientific digest, never interpreted as
// approval. Scientific use/access restrictions remain in the scientific fields.
const LEGACY_PROVENANCE = list('schema_version record_type verification_status verification_review_status reviewed_by verified_on verification_notes last_reviewed_on review_due_on migrated_on migration_confidence migration_flags legacy_entry_file source_file claim_file _frontmatter_parse_mode frontmatter_parse_mode grok_export_batch first_imported_at last_imported_at created_at updated_at date_discovered discovery_lane_status packet_batch_id packet_file packet_claim_id packet_source_id packet_source_type');
const LEGACY_SCIENTIFIC_EXTRAS = list('packet_category packet_confidence packet_evidence_strength date_published_raw_unparsed');

function object(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    fail('INVALID_OBJECT', path, 'plain JSON object required');
  }
  return value;
}
function keys(value, allowed, path) {
  object(value, path);
  for (const k of Object.keys(value)) if (!allowed.includes(k)) {
    fail('UNCLASSIFIED_FIELD', `${path}.${k}`, 'classify this field before accepting scientific content');
  }
}
function string(value, path) {
  if (typeof value !== 'string' || !value.trim()) fail('REQUIRED_STRING', path, 'non-empty string required');
}
function array(value, path) {
  if (!Array.isArray(value)) fail('INVALID_ARRAY', path, 'array required');
}
function digestString(value, path) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) fail('INVALID_DIGEST', path, 'lowercase SHA-256 required');
}

/** Reject values JSON.stringify would silently discard or coerce. Nested
 * scope/locator/body objects are opaque JSON: every field is preserved/hashed. */
export function canonicalScientificJSON(value) {
  const active = new Set();
  function encode(v, path) {
    if (v === null || typeof v === 'string' || typeof v === 'boolean') return JSON.stringify(v);
    if (typeof v === 'number' && Number.isFinite(v) && !Object.is(v, -0)) return JSON.stringify(v);
    if (typeof v !== 'object' || v === null) fail('INVALID_JSON', path, 'lossless JSON value required');
    if (active.has(v)) fail('INVALID_JSON', path, 'cycle');
    active.add(v);
    if (Reflect.ownKeys(v).some((k) => typeof k === 'symbol')) fail('INVALID_JSON', path, 'symbol key');
    let result;
    if (Array.isArray(v)) {
      const descriptors = Object.getOwnPropertyDescriptors(v);
      if (Object.keys(v).length !== v.length || Object.getOwnPropertyNames(v).length !== v.length + 1 ||
          Array.from({ length: v.length }, (_, i) => descriptors[i]).some((d) => !d || !own(d, 'value') || !d.enumerable)) {
        fail('INVALID_JSON', path, 'sparse, decorated or accessor array');
      }
      result = `[${Array.from(v, (item, i) => encode(item, `${path}[${i}]`)).join(',')}]`;
    } else {
      object(v, path);
      if (Object.getOwnPropertyNames(v).length !== Object.keys(v).length ||
          Object.values(Object.getOwnPropertyDescriptors(v)).some((d) => !own(d, 'value'))) {
        fail('INVALID_JSON', path, 'hidden properties/accessors');
      }
      result = `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${encode(v[k], `${path}.${k}`)}`).join(',')}}`;
    }
    active.delete(v);
    return result;
  }
  return encode(value, '$');
}
const copy = (v) => JSON.parse(canonicalScientificJSON(v));
function provenanceCopy(value, path) {
  object(value, path);
  return copy(value);
}
function freeze(v) {
  if (v && typeof v === 'object') { Object.values(v).forEach(freeze); Object.freeze(v); }
  return v;
}
async function sha(value) {
  const bytes = new TextEncoder().encode(canonicalScientificJSON(value));
  return [...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes))]
    .map((b) => b.toString(16).padStart(2, '0')).join('');
}
const revisionId = (kind, id, digest) => `${kind}:${encodeURIComponent(id)}:sha256:${digest}`;
const byJSON = (a, b) => {
  const x = canonicalScientificJSON(a), y = canonicalScientificJSON(b);
  return x < y ? -1 : x > y ? 1 : 0;
};

function scientificContent(value, fields, path) {
  keys(value, [...fields, 'scientific_extras'], path);
  if (own(value, 'scientific_extras')) keys(value.scientific_extras, LEGACY_SCIENTIFIC_EXTRAS, `${path}.scientific_extras`);
  // Preserve all JSON inside each accepted scientific field; no projection of
  // nested limitations, scope, quotations or evidence spans.
  return copy(value);
}

export async function createSourceRevision(input) {
  input = copy(input);
  keys(input, ['source_id', 'study_family_id', 'content', 'provenance'], 'source');
  string(input.source_id, 'source.source_id');
  if (!own(input, 'study_family_id')) fail('MISSING_STUDY_IDENTITY', 'source.study_family_id', 'explicit ID or null (unresolved) required');
  if (input.study_family_id !== null) string(input.study_family_id, 'source.study_family_id');
  const content = scientificContent(input.content, SOURCE_FIELDS, 'source.content');
  string(content.title, 'source.content.title');
  if (own(content, 'evidence_digest')) digestString(content.evidence_digest, 'source.content.evidence_digest');
  if (own(content, 'evidence_text')) string(content.evidence_text, 'source.content.evidence_text');
  // Legacy bibliography-only sources remain representable, explicitly incomplete.
  // Never fabricate full-text access, a study family or a reviewed evidence body.
  const evidence_identity = content.evidence_text ? 'text' : content.evidence_digest ? 'digest' : 'metadata_only';
  const scientific = {
    contract_version: CONTRACT_VERSION, canonicalization_version: CANONICALIZATION_VERSION,
    source_id: input.source_id, study_family_id: input.study_family_id, evidence_identity, content,
  };
  const scientific_digest = await sha(scientific);
  return freeze({ ...scientific, scientific_digest,
    revision_id: revisionId('source', input.source_id, scientific_digest),
    provenance: provenanceCopy(own(input, 'provenance') ? input.provenance : {}, 'source.provenance'),
  });
}

/** One focal claim plus its COMPLETE evidence snapshot. A source can support
 * and contradict different scopes through separate edges. Related claims must
 * name an already-existing exact revision (avoids cyclic content-addressing).
 * Source/edge provenance is retained but does not change scientific identity. */
export async function createScientificRevision(input) {
  // Take an immediate lossless copy before any async hashing (caller mutation).
  input = copy(input);
  keys(input, ['claim_id', 'primary_source_id', 'content', 'sources', 'related_claims', 'relationships', 'provenance'], 'revision');
  string(input.claim_id, 'revision.claim_id');
  string(input.primary_source_id, 'revision.primary_source_id');
  const content = scientificContent(input.content, CLAIM_FIELDS, 'revision.content');
  string(content.claim_text, 'revision.content.claim_text');
  array(input.sources, 'revision.sources');
  array(input.relationships, 'revision.relationships');
  const sources = [];
  const sourceById = new Map();
  for (const src of input.sources) {
    const r = await createSourceRevision(src);
    if (sourceById.has(r.source_id)) fail('DUPLICATE_ENDPOINT', 'revision.sources', r.source_id);
    sourceById.set(r.source_id, r); sources.push(r);
  }
  if (!sourceById.has(input.primary_source_id)) fail('MISSING_ENDPOINT', 'revision.primary_source_id', 'source not in snapshot');
  const related = input.related_claims ?? [];
  array(related, 'revision.related_claims');
  const relatedById = new Map();
  for (const r of related) {
    keys(r, ['claim_id', 'revision_id', 'scientific_digest'], 'related_claim');
    string(r.claim_id, 'related_claim.claim_id');
    digestString(r.scientific_digest, 'related_claim.scientific_digest');
    if (r.revision_id !== revisionId('claim', r.claim_id, r.scientific_digest)) fail('REVISION_MISMATCH', 'related_claim.revision_id', 'identity does not match digest');
    if (r.claim_id === input.claim_id || relatedById.has(r.claim_id)) fail('DUPLICATE_ENDPOINT', 'revision.related_claims', r.claim_id);
    relatedById.set(r.claim_id, r);
  }
  const edges = new Map();
  for (const edge of input.relationships) {
    keys(edge, EDGE_FIELDS, 'relationship');
    if (!['supports', 'contradicts', 'qualifies'].includes(edge.relation)) fail('INVALID_RELATION', 'relationship.relation', 'supports/contradicts/qualifies required');
    if (own(edge, 'source_id') === own(edge, 'related_claim_id')) fail('AMBIGUOUS_ENDPOINT', 'relationship', 'exactly one source or related claim endpoint required');
    for (const field of ['scope', 'locator']) {
      if (!own(edge, field) || edge[field] === null || edge[field] === '' ||
          (typeof edge[field] === 'object' && Object.keys(edge[field]).length === 0)) {
        fail('INCOMPLETE_RELATIONSHIP', `relationship.${field}`, 'explicit scope and locator required; use {status:"unknown"} for unresolved legacy evidence');
      }
      if (typeof edge[field] !== 'string' && (typeof edge[field] !== 'object' || Array.isArray(edge[field]))) fail('INCOMPLETE_RELATIONSHIP', `relationship.${field}`, 'text or structured object required');
    }
    const isSource = own(edge, 'source_id');
    const endpoint = isSource ? sourceById.get(edge.source_id) : relatedById.get(edge.related_claim_id);
    if (!endpoint) fail('MISSING_ENDPOINT', 'relationship', 'endpoint absent from complete snapshot');
    const { provenance = {}, ...fields } = edge;
    const scientific = { ...fields, endpoint_revision_id: endpoint.revision_id };
    const edge_digest = await sha({ contract_version: CONTRACT_VERSION, canonicalization_version: CANONICALIZATION_VERSION, claim_id: input.claim_id, ...scientific });
    const existing = edges.get(edge_digest);
    const p = copy(provenance);
    object(p, 'relationship.provenance');
    // Exact scientific duplicates coalesce, retaining every distinct provenance.
    const provenances = existing?.provenance ?? [];
    if (!provenances.some((x) => canonicalScientificJSON(x) === canonicalScientificJSON(p))) provenances.push(p);
    edges.set(edge_digest, { ...scientific, edge_id: `edge:sha256:${edge_digest}`, provenance: provenances.sort(byJSON) });
  }
  const relationships = [...edges.values()].sort(byJSON);
  if (!relationships.some((e) => e.source_id === input.primary_source_id && e.relation === 'supports')) {
    fail('INCOMPLETE_RELATIONSHIP', 'revision.primary_source_id', 'designated primary requires a supporting edge');
  }
  for (const [field, endpoints] of [['source_id', sourceById], ['related_claim_id', relatedById]]) {
    for (const id of endpoints.keys()) {
      if (!relationships.some((e) => e[field] === id)) fail('UNUSED_ENDPOINT', 'revision', `unrelated endpoint ${id}`);
    }
  }
  const graph = relationships.map(({ provenance, ...e }) => e).sort(byJSON);
  const graph_digest = await sha({ contract_version: CONTRACT_VERSION, canonicalization_version: CANONICALIZATION_VERSION, relationships: graph });
  const scientific = {
    contract_version: CONTRACT_VERSION, canonicalization_version: CANONICALIZATION_VERSION,
    claim_id: input.claim_id, primary_source_id: input.primary_source_id, content,
    source_revisions: sources.map(({ provenance, ...s }) => s).sort(byJSON),
    related_claims: related.slice().sort(byJSON), graph_digest,
  };
  const scientific_digest = await sha(scientific);
  return freeze({ ...scientific, revision_id: revisionId('claim', input.claim_id, scientific_digest),
    scientific_digest, sources: sources.sort(byJSON), relationships,
    provenance: provenanceCopy(own(input, 'provenance') ? input.provenance : {}, 'revision.provenance'),
  });
}

/** Verify a JSON round trip instead of trusting serialized digest labels. */
export async function verifyScientificRevision(snapshot) {
  keys(snapshot, ['contract_version', 'canonicalization_version', 'claim_id', 'primary_source_id', 'content', 'source_revisions', 'related_claims', 'graph_digest', 'revision_id', 'scientific_digest', 'sources', 'relationships', 'provenance'], 'snapshot');
  if (snapshot.contract_version !== CONTRACT_VERSION || snapshot.canonicalization_version !== CANONICALIZATION_VERSION) fail('UNSUPPORTED_VERSION', 'snapshot', 'explicit version upgrade required');
  array(snapshot.sources, 'snapshot.sources');
  array(snapshot.relationships, 'snapshot.relationships');
  const relationships = snapshot.relationships.flatMap((e) => {
    keys(e, [...EDGE_FIELDS, 'endpoint_revision_id', 'edge_id'], 'snapshot.relationship');
    array(e.provenance, 'snapshot.relationship.provenance');
    if (!e.provenance.length) fail('INCOMPLETE_RELATIONSHIP', 'snapshot.relationship.provenance', 'at least one provenance object required');
    const { edge_id, endpoint_revision_id, provenance, ...fields } = e;
    return provenance.map((p) => ({ ...fields, provenance: p }));
  });
  const sources = snapshot.sources.map((s) => {
    keys(s, ['contract_version', 'canonicalization_version', 'source_id', 'study_family_id', 'evidence_identity', 'content', 'scientific_digest', 'revision_id', 'provenance'], 'snapshot.source');
    return { source_id: s.source_id, study_family_id: s.study_family_id, content: s.content, provenance: s.provenance };
  });
  const rebuilt = await createScientificRevision({ claim_id: snapshot.claim_id, primary_source_id: snapshot.primary_source_id,
    content: snapshot.content, sources, related_claims: snapshot.related_claims, relationships, provenance: snapshot.provenance });
  if (canonicalScientificJSON(rebuilt) !== canonicalScientificJSON(snapshot)) fail('REVISION_MISMATCH', 'snapshot', 'content, graph, identity or derived digest was changed');
  return rebuilt;
}

/** Counts only explicitly identified supporting study families. Unknown study
 * identity and synthesis reports cannot be presumed independent corroboration.
 * This describes relationships, not evidence sufficiency or clearance. */
export function supportingStudyFamilies(revision) {
  const ids = new Set(revision.relationships.filter((e) => e.relation === 'supports' && e.source_id).map((e) => e.source_id));
  const supporting = revision.sources.filter((s) => ids.has(s.source_id));
  const known = supporting.filter((s) => s.study_family_id !== null);
  return freeze({ study_family_ids: [...new Set(known.map((s) => s.study_family_id))].sort(),
    independent_study_count: new Set(known.map((s) => s.study_family_id)).size,
    unresolved_source_ids: supporting.filter((s) => s.study_family_id === null).map((s) => s.source_id).sort() });
}

/** Legacy single-source export/adapter rows. No rewrite of existing importers.
 * Known historical statuses stay provenance, never become approval events.
 * Rich or unknown extras require explicit graph/field classification first. */
export async function revisionFromLegacySingleSource({ source, claim }) {
  function partition(row, kind) {
    object(row, `legacy.${kind}`);
    const fields = kind === 'source' ? SOURCE_FIELDS : CLAIM_FIELDS;
    const ids = kind === 'source' ? ['source_id', 'study_family_id'] : ['claim_id', 'source_id'];
    const relationshipFields = kind === 'claim' ? ['supporting_source_ids', 'contradicting_source_ids'] : [];
    keys(row, [...fields, ...ids, ...LEGACY_PROVENANCE, ...LEGACY_SCIENTIFIC_EXTRAS, ...relationshipFields, 'extras'], `legacy.${kind}`);
    const content = {}, provenance = {}, extras = {};
    const values = { ...row };
    if (own(row, 'extras')) object(row.extras, `legacy.${kind}.extras`);
    for (const [k, v] of Object.entries(row.extras ?? {})) {
      if (own(values, k)) fail('AMBIGUOUS_FIELD', `legacy.${kind}.extras.${k}`, 'top-level and extras both supply field');
      values[k] = v;
    }
    keys(values, [...fields, ...ids, ...LEGACY_PROVENANCE, ...LEGACY_SCIENTIFIC_EXTRAS, ...relationshipFields, 'extras'], `legacy.${kind}`);
    for (const [k, v] of Object.entries(values)) {
      if (fields.includes(k)) content[k] = v;
      else if (LEGACY_PROVENANCE.includes(k)) provenance[k] = v;
      else if (LEGACY_SCIENTIFIC_EXTRAS.includes(k)) extras[k] = v;
    }
    if (Object.keys(extras).length) content.scientific_extras = extras;
    return { content, provenance, values };
  }
  const s = partition(source, 'source'), c = partition(claim, 'claim');
  if (c.values.source_id !== s.values.source_id) fail('MISSING_ENDPOINT', 'legacy.claim.source_id', 'single source does not match');
  const supports = own(c.values, 'supporting_source_ids') ? c.values.supporting_source_ids : [s.values.source_id];
  const contradictions = own(c.values, 'contradicting_source_ids') ? c.values.contradicting_source_ids : [];
  array(supports, 'legacy.supporting_source_ids'); array(contradictions, 'legacy.contradicting_source_ids');
  if (supports.length !== 1 || supports[0] !== s.values.source_id || contradictions.length) fail('INCOMPLETE_RELATIONSHIP', 'legacy', 'multi-source evidence requires a complete explicit graph; refusing to discard edges');
  return createScientificRevision({ claim_id: c.values.claim_id, primary_source_id: s.values.source_id, content: c.content,
    sources: [{ source_id: s.values.source_id, study_family_id: s.values.study_family_id ?? null, content: s.content, provenance: s.provenance }],
    relationships: [{ source_id: s.values.source_id, relation: 'supports',
      scope: c.content.population_or_scope || { status: 'unknown', reason: 'legacy scope not recorded' },
      locator: c.content.page_or_section_locator || c.content.locator || { status: 'unknown', reason: 'legacy locator not recorded' },
      provenance: { origin: 'legacy_single_source', supporting_source_ids: supports, contradicting_source_ids: contradictions } }],
    provenance: c.provenance });
}

/** Decision schemas only. The eventual authenticated persistence layer MUST
 * establish actor authority, policy permission, time validity, withdrawal,
 * compare-and-swap and append-only history. These pure validators do not
 * authenticate actor strings, grant approval, or change any current status. */
export async function bindScientificDecision(revision, decision) {
  revision = await verifyScientificRevision(revision);
  decision = copy(decision);
  const common = list('decision_id kind status claim_id revision_id scientific_digest graph_digest policy_version actor decided_at scope permitted_use expires_at withdrawal reason');
  const automatic = decision.kind === 'automated_evidence_clearance';
  const human = decision.kind === 'human_institutional_approval';
  if (!automatic && !human) fail('INVALID_DECISION_KIND', 'decision.kind', 'separate clearance or human approval kind required');
  keys(decision, [...common, ...(automatic ? ['checker_version', 'risk_tier', 'checks'] : ['authority_id', 'authorization_reference'])], 'decision');
  for (const field of common) if (!own(decision, field)) fail('INCOMPLETE_DECISION', `decision.${field}`, 'required, explicit null allowed only for expiry/withdrawal');
  for (const field of ['decision_id', 'policy_version', 'reason', 'scope']) string(decision[field], `decision.${field}`);
  if (decision.status !== (automatic ? 'EVIDENCE_CLEARED' : 'AIMT_APPROVED')) fail('AUTHORITY_BOUNDARY', 'decision.status', 'clearance and institutional approval cannot substitute for one another');
  keys(decision.actor, ['actor_id', 'actor_type'], 'decision.actor');
  string(decision.actor.actor_id, 'decision.actor.actor_id');
  if (decision.actor.actor_type !== (automatic ? 'automation' : 'human')) fail('AUTHORITY_BOUNDARY', 'decision.actor.actor_type', 'actor kind incompatible with decision');
  for (const field of ['claim_id', 'revision_id', 'scientific_digest', 'graph_digest']) {
    if (decision[field] !== revision[field]) fail('REVISION_MISMATCH', `decision.${field}`, 'decision must bind this exact scientific revision');
  }
  function date(value, path) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) || !Number.isFinite(Date.parse(value)) ||
        new Date(value).toISOString() !== (value.includes('.') ? value : value.replace('Z', '.000Z'))) fail('INVALID_TIME', path, 'valid UTC timestamp required');
  }
  date(decision.decided_at, 'decision.decided_at');
  if (decision.expires_at !== null) {
    date(decision.expires_at, 'decision.expires_at');
    if (Date.parse(decision.expires_at) <= Date.parse(decision.decided_at)) fail('INVALID_TIME', 'decision.expires_at', 'must follow decision');
  }
  if (decision.withdrawal !== null) {
    keys(decision.withdrawal, ['withdrawn_at', 'reason', 'event_id'], 'decision.withdrawal');
    date(decision.withdrawal.withdrawn_at, 'decision.withdrawal.withdrawn_at');
    if (Date.parse(decision.withdrawal.withdrawn_at) < Date.parse(decision.decided_at)) fail('INVALID_TIME', 'decision.withdrawal.withdrawn_at', 'cannot precede decision');
    string(decision.withdrawal.reason, 'decision.withdrawal.reason');
    string(decision.withdrawal.event_id, 'decision.withdrawal.event_id');
  }
  array(decision.permitted_use, 'decision.permitted_use');
  if (!decision.permitted_use.length) fail('INCOMPLETE_DECISION', 'decision.permitted_use', 'explicit permitted uses required');
  decision.permitted_use.forEach((v) => string(v, 'decision.permitted_use'));
  if (automatic) {
    string(decision.checker_version, 'decision.checker_version');
    string(decision.risk_tier, 'decision.risk_tier');
    array(decision.checks, 'decision.checks');
    if (!decision.checks.length) fail('INCOMPLETE_DECISION', 'decision.checks', 'policy check evidence required');
    for (const check of decision.checks) {
      keys(check, ['check_id', 'result', 'evidence_digest'], 'decision.check');
      string(check.check_id, 'decision.check.check_id');
      digestString(check.evidence_digest, 'decision.check.evidence_digest');
      if (check.result !== 'passed') fail('FAILED_CLEARANCE_CHECK', 'decision.check.result', 'failed/review checks cannot constitute clearance');
    }
  } else {
    string(decision.authority_id, 'decision.authority_id');
    string(decision.authorization_reference, 'decision.authorization_reference');
  }
  return freeze({ ...decision, contract_version: CONTRACT_VERSION, decision_digest: await sha({ contract_version: CONTRACT_VERSION, ...decision }) });
}
