/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — generic Education Page Plan
   ---------------------------------------------------------------
   The first two Education pages (hair-cycle, telogen-effluvium) each
   used a hand-authored template entry in page-builder-template-
   registry.mjs, keyed to a FIXED bucket taxonomy (DEFINITION / TIMING /
   MECHANISM / FACTORS / PRACTITIONER_RELEVANCE / OTHER). That does not
   scale to a topic the system selects and plans for itself -- a third
   topic's evidence will land in its own shape, exactly as
   telogen-effluvium's re-synthesis already proved happens even for the
   SAME topic across two synthesis runs (see the non-core-conflict
   narrowing round). This is the free-form replacement: the Education
   Writer (education-writer-client.mjs) outputs THIS shape directly,
   already organized into whatever sections the evidence actually
   supports -- no bucket taxonomy, no forced headings.

   Every visible prose unit is exactly one of VERBATIM / PARAPHRASE /
   FRAMING, same three-layer model as the hand-authored pages (see
   docs/brand/AIMT-EDUCATION-EDITORIAL-VOICE-v0.md) -- generalized to a
   model-authored, not hand-authored, writer.
   ═══════════════════════════════════════════════════════════════ */

export const PROSE_UNIT_KINDS = Object.freeze(['VERBATIM', 'PARAPHRASE', 'FRAMING']);
export const VISUAL_RECOMMENDATIONS = Object.freeze(['NONE', 'DIAGRAM', 'REFERENCE_PHOTOGRAPHY']);

// A prose unit. VERBATIM/PARAPHRASE units MUST carry real
// supporting_claim_ids + source_statements (never hand-typed, always
// inherited from the cleared snapshot the writer was given). FRAMING
// units MUST carry neither -- see the "framing cannot carry science"
// rule (docs/brand/AIMT-EDUCATION-EDITORIAL-VOICE-v0.md).
const PROSE_UNIT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    kind: { type: 'string', enum: [...PROSE_UNIT_KINDS] },
    text: { type: 'string' },
    supporting_claim_ids: { type: 'array', items: { type: 'string' } },
    source_statements: { type: 'array', items: { type: 'string' } },
  },
  required: ['kind', 'text', 'supporting_claim_ids', 'source_statements'],
  additionalProperties: false,
};

const SECTION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    section_id: { type: 'string' },
    heading: { type: 'string' },
    units: { type: 'array', items: PROSE_UNIT_JSON_SCHEMA },
  },
  required: ['section_id', 'heading', 'units'],
  additionalProperties: false,
};

const SOURCE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    source_id: { type: 'string' },
    title: { type: 'string' },
    authors: { type: 'array', items: { type: 'string' } },
    year: { type: 'number' },
    doi: { type: 'string' },
    url: { type: 'string' },
  },
  required: ['source_id', 'title', 'authors', 'year', 'doi', 'url'],
  additionalProperties: false,
};

const RELATED_LINK_JSON_SCHEMA = {
  type: 'object',
  properties: {
    href: { type: 'string' },
    label: { type: 'string' },
    relation: { type: 'string' },
  },
  required: ['href', 'label', 'relation'],
  additionalProperties: false,
};

const VISUAL_RECOMMENDATION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    recommendation: { type: 'string', enum: [...VISUAL_RECOMMENDATIONS] },
    rationale: { type: 'string' },
  },
  required: ['recommendation', 'rationale'],
  additionalProperties: false,
};

// The COMPLETE, validated/rendered Page Plan shape -- includes `sources`
// and `related_links`, but this is NOT what the model is asked to
// produce (see EDUCATION_WRITER_OUTPUT_JSON_SCHEMA below). The
// orchestrator deterministically attaches both fields (from the cleared
// snapshot's own citation_map and from trusted route data, never from
// the model) before this shape is validated or rendered -- see the
// trust-boundary correction that removed source/link authority from the
// Writer ("Model must not author source metadata or link destinations").
export const EDUCATION_PAGE_PLAN_JSON_SCHEMA = {
  type: 'object',
  properties: {
    topic_slug: { type: 'string' },
    cluster: { type: 'string' },
    route: { type: 'string' },
    title: { type: 'string' },
    meta_description: { type: 'string' },
    h1: { type: 'string' },
    answer_summary: PROSE_UNIT_JSON_SCHEMA,
    sections: { type: 'array', items: SECTION_JSON_SCHEMA },
    scope_note: { type: 'string' },
    limitations: { type: 'array', items: PROSE_UNIT_JSON_SCHEMA },
    key_takeaways: { type: 'array', items: PROSE_UNIT_JSON_SCHEMA },
    sources: { type: 'array', items: SOURCE_JSON_SCHEMA },
    related_links: { type: 'array', items: RELATED_LINK_JSON_SCHEMA },
    visual_recommendation: VISUAL_RECOMMENDATION_JSON_SCHEMA,
  },
  required: [
    'topic_slug', 'cluster', 'route', 'title', 'meta_description', 'h1',
    'answer_summary', 'sections', 'scope_note', 'limitations',
    'key_takeaways', 'sources', 'related_links', 'visual_recommendation',
  ],
  additionalProperties: false,
};

// What the Education Writer model is ACTUALLY asked to produce --
// identical to the full shape above MINUS `sources` and `related_links`.
// The model has no schema slot to even attempt to author source
// metadata (title/authors/year/doi/url) or a link destination (href) --
// there is no field name for it to fill in. Both fields are attached by
// the orchestrator afterward, deterministically, from trusted data
// (education-source-authority.mjs / education-related-links.mjs).
export const EDUCATION_WRITER_OUTPUT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    topic_slug: { type: 'string' },
    cluster: { type: 'string' },
    route: { type: 'string' },
    title: { type: 'string' },
    meta_description: { type: 'string' },
    h1: { type: 'string' },
    answer_summary: PROSE_UNIT_JSON_SCHEMA,
    sections: { type: 'array', items: SECTION_JSON_SCHEMA },
    scope_note: { type: 'string' },
    limitations: { type: 'array', items: PROSE_UNIT_JSON_SCHEMA },
    key_takeaways: { type: 'array', items: PROSE_UNIT_JSON_SCHEMA },
    visual_recommendation: VISUAL_RECOMMENDATION_JSON_SCHEMA,
  },
  required: [
    'topic_slug', 'cluster', 'route', 'title', 'meta_description', 'h1',
    'answer_summary', 'sections', 'scope_note', 'limitations',
    'key_takeaways', 'visual_recommendation',
  ],
  additionalProperties: false,
};

/** Every prose unit across the whole plan, tagged with its location --
    used by both the validator and the renderer so "every visible unit"
    always means the same traversal. */
export function collectAllProseUnits(plan) {
  const units = [{ location: 'answer_summary', unit: plan.answer_summary }];
  for (const section of plan.sections) {
    section.units.forEach((unit, i) => units.push({ location: `section:${section.section_id}:${i}`, unit }));
  }
  plan.limitations.forEach((unit, i) => units.push({ location: `limitations:${i}`, unit }));
  plan.key_takeaways.forEach((unit, i) => units.push({ location: `key_takeaway:${i}`, unit }));
  return units;
}
