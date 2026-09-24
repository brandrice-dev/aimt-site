/* ═══════════════════════════════════════════════════════════════
   AIMT Page Builder v1 — deterministic draft builder
   ---------------------------------------------------------------
   PURE. No I/O, no AI call. Builds the structured draft contract
   (below) directly from a cleared snapshot (page-builder-loader.mjs
   #extractClearedSnapshot()'s output) plus its registered presentation
   template (page-builder-template-registry.mjs) -- nothing else.

   GENERIC vs. TEMPLATE split (this revision corrects an earlier version
   that blurred the two): classifyCoreFactualPoints() below is the
   GENERIC mechanism -- five topic-agnostic keyword buckets, no
   topic_slug branching. Which buckets become which named section, in
   what order, under what heading, is NOT generic and lives entirely in
   page-builder-template-registry.mjs's per-topic template. This
   function's job is purely: snapshot -> generic classifier -> the
   topic's registered template -> structured draft. Adding a second
   topic means adding a template, never editing this function's
   assembly logic.

   CRITICAL DESIGN DECISION, stated rather than hidden: v1's GENERIC
   mechanism (the `{ buckets }` section shape, and answer_summary/
   key_takeaways below) does NOT paraphrase. Every factual paragraph's
   `text` built this way is the VERBATIM statement string already written
   and validated by Publication Editor's own synthesis + deterministic
   post-synthesis validator (core_factual_points[i].statement /
   limitations[i].statement). This makes factual fidelity trivially
   provable (the text IS the cleared claim text, by construction) without
   requiring any AI call in this phase.

   AIMT EDUCATION VOICE v0 EXEMPLAR (Owner Correction Pass): a section
   (or the why_it_matters slot) whose template config uses the newer
   `{ units }` shape instead is built by resolveEditorialUnit() below --
   an OPT-IN, hand-authored per-topic override that also allows a
   conservative 'paraphrase' kind, tagged with an explicit
   editorial_status so it is never confused with verbatim content. See
   page-builder-template-registry.mjs's header and
   docs/brand/AIMT-EDUCATION-EDITORIAL-VOICE-v0.md for the full
   rationale. This is still not a general AI paraphrase system -- no
   model call is made anywhere in this file, and a section without a
   `units` array is completely unaffected, still verbatim-only.

   NO-DUPLICATE-TEXT CONTRACT (this revision): the statement chosen for
   `answer_summary` is tracked and excluded from every subsequent body
   section, so the exact same cleared statement is never rendered twice
   across answer_summary + sections[]. `key_takeaways` are exempt by
   design -- they are an explicit recap section, not a first presentation
   of the fact (see page-builder-content-units.mjs#findDuplicateFactualText,
   which enforces this is actually true post-hoc, and
   page-builder-template-registry.mjs's header for the full rationale).
   ═══════════════════════════════════════════════════════════════ */

import { getPageBuilderRoute } from './page-builder-route-registry.mjs';
import { getPageBuilderTemplate } from './page-builder-template-registry.mjs';

export const PAGE_BUILDER_DRAFT_VERSION = 'page-builder-draft-v2';

/** Ordered, first-match-wins keyword classifier -- GENERIC, no
    topic_slug branching. Order matters: a statement that happens to
    mention both "phases" and "typically lasts" should classify as
    DEFINITION only if "phases" appears without a duration cue -- TIMING
    is checked before DEFINITION's broader "phases/stages" pattern
    specifically to avoid that ambiguity. */
const BUCKET_PATTERNS = [
  { bucket: 'TIMING', pattern: /\btypically lasts\b|\bduration\b|\bat any given time\b|\d+\s*%|\bpercent\b/i },
  { bucket: 'MECHANISM', pattern: /\bdriven by\b|\bsignal(l)?ing pathway\w*\b|\bregulated by\b|\bcoordinated by\b|\bunderlying biology\b/i },
  { bucket: 'FACTORS', pattern: /\bfactors\b|\bcan (normally |commonly )?influence\b|\bcan shift\b|\baffect(s)? the (transition|cycle)\b/i },
  { bucket: 'PRACTITIONER_RELEVANCE', pattern: /\bdistinguishing\b|\bpractitioner\w*\b|\bnormal (cycle )?variation\b|\babnormal\b|\bassessing\b/i },
  { bucket: 'DEFINITION', pattern: /\brecognized (phases|stages)\b|\bconsists of\b|\bis defined as\b|\bfour (recognized )?(phases|stages)\b|\bcycles through\b/i },
];

function classifyCorePoint(point) {
  for (const { bucket, pattern } of BUCKET_PATTERNS) {
    if (pattern.test(point.statement)) return bucket;
  }
  return 'OTHER';
}

function paragraph(point) {
  return { text: point.statement, supporting_claim_ids: [...(point.supporting_claim_ids || [])], editorial_status: 'VERBATIM', source_statements: [point.statement] };
}

/**
 * AIMT Education Voice v0 exemplar. Resolves ONE hand-authored editorial
 * unit (page-builder-template-registry.mjs's `{ kind: ... }` shape) into
 * a draft paragraph, or null if its bucket has no cleared point at all
 * ("evidence controls the page"). Unlike the generic `{ buckets }`
 * mechanism below, resolution here does NOT exclude a bucket's point
 * just because an earlier unit already used it -- by design, TWO
 * editorial units (e.g. two 'paraphrase' beats unpacking one dense
 * cleared sentence into separate teaching moments) may legitimately
 * both draw on the SAME cleared statement. That's safe here because a
 * paraphrase's wording differs from the verbatim original by
 * definition, so it can never trip findDuplicateFactualText()'s
 * EXACT-text duplicate check the way re-rendering a verbatim statement
 * twice would. `usedStatements` is still updated as a side effect, so a
 * later GENERIC `{ buckets }` section (the older mechanism, unchanged)
 * correctly treats this bucket's evidence as already spoken for.
 * KNOWN v0 LIMITATION: this looks up only the bucket's FIRST cleared
 * point (grouped[bucket][0]) -- correct today because every hair-cycle
 * bucket has exactly one point (see the file's bucket_counts), but a
 * second point in the same bucket (a future re-cleared snapshot) would
 * not automatically be picked up here the way the generic mechanism's
 * own .flatMap() would. Acceptable for a hand-authored, one-topic,
 * owner-reviewed exemplar; a real gap to close before ever generalizing
 * this mechanism to a second topic.
 *
 * 'paraphrase' NEVER accepts hand-typed claim IDs -- it always inherits
 * every supporting_claim_id already attached to the bucket's own cleared
 * statement, so a paraphrase can never end up citing claims its source
 * statement doesn't actually carry.
 *
 * @param {{kind: 'framing'|'verbatim'|'paraphrase', text?: string, bucket?: string}} unit
 * @param {object} grouped - classifyCoreFactualPoints() output
 * @param {Set<string>} usedStatements
 * @returns {{text: string, supporting_claim_ids: string[], is_framing?: boolean, editorial_status: string, source_statements: string[]}|null}
 */
function resolveEditorialUnit(unit, grouped, usedStatements) {
  if (unit.kind === 'framing') {
    return { text: unit.text, supporting_claim_ids: [], is_framing: true, editorial_status: 'FRAMING', source_statements: [] };
  }
  const point = (grouped[unit.bucket] || [])[0];
  if (!point) return null; // evidence controls the page -- bucket is empty
  usedStatements.add(point.statement);
  if (unit.kind === 'verbatim') {
    return { text: point.statement, supporting_claim_ids: [...(point.supporting_claim_ids || [])], editorial_status: 'VERBATIM', source_statements: [point.statement] };
  }
  if (unit.kind === 'paraphrase') {
    return { text: unit.text, supporting_claim_ids: [...(point.supporting_claim_ids || [])], editorial_status: 'PARAPHRASE', source_statements: [point.statement] };
  }
  throw new Error(`resolveEditorialUnit: unknown unit kind "${unit.kind}"`);
}

/** Resolves a `{ heading, units }` section config into a draft section,
    or null if every unit resolved to nothing (evidence controls the
    page). */
function buildEditorialSection(sectionId, config, grouped, usedStatements) {
  const paragraphs = config.units
    .map((unit) => resolveEditorialUnit(unit, grouped, usedStatements))
    .filter(Boolean);
  const hasFactualContent = paragraphs.some((p) => !p.is_framing);
  if (!hasFactualContent) return null; // never render a section that is framing-only by evidence exhaustion
  return { section_id: sectionId, heading: config.heading, paragraphs };
}

/** Groups a snapshot's core_factual_points by bucket, preserving the
    snapshot's own array order within each bucket. Generic -- no
    topic_slug branching. */
export function classifyCoreFactualPoints(snapshot) {
  const grouped = { DEFINITION: [], TIMING: [], MECHANISM: [], FACTORS: [], PRACTITIONER_RELEVANCE: [], OTHER: [] };
  for (const point of snapshot.core_factual_points) {
    grouped[classifyCorePoint(point)].push(point);
  }
  return grouped;
}

function buildSourcesFromSnapshot(snapshot) {
  return snapshot.source_ids.map((sourceId) => {
    const meta = snapshot.citation_map[sourceId] || {};
    return {
      source_id: sourceId,
      title: meta.title ?? null,
      authors: Array.isArray(meta.authors) ? meta.authors : [],
      year: meta.year ?? null,
      doi: meta.doi ?? null,
      url: meta.url ?? null,
    };
  });
}

/**
 * Builds the strict structured draft contract from a cleared snapshot
 * and its registered presentation template. Pure, synchronous,
 * deterministic -- same snapshot in, byte-identical draft out.
 *
 * @param {object} snapshot - page-builder-loader.mjs#extractClearedSnapshot() output
 * @param {{generationSourceHash?: string, fingerprintAlgorithm?: string, generatedAt?: string}} [meta]
 * @returns {object} the structured draft
 */
export function buildPageDraft(snapshot, meta = {}) {
  const { route, related_links } = getPageBuilderRoute(snapshot.topic_slug);
  const template = getPageBuilderTemplate(snapshot.topic_slug);
  const grouped = classifyCoreFactualPoints(snapshot);
  const generatedAt = meta.generatedAt || new Date().toISOString();

  // answer_summary: the primary concise definition. Its statement is
  // tracked so no body section repeats it verbatim.
  const usedStatements = new Set();
  const answerSummaryPoint = (grouped[template.answer_summary_bucket] && grouped[template.answer_summary_bucket][0]) || snapshot.core_factual_points[0];
  const answerSummary = answerSummaryPoint ? paragraph(answerSummaryPoint) : { text: '', supporting_claim_ids: [] };
  if (answerSummaryPoint) usedStatements.add(answerSummaryPoint.statement);

  const sections = [];

  // "why it matters" -- either the newer AIMT Education Voice v0
  // `{ heading, units }` shape (resolveEditorialUnit, may mix framing +
  // conservative paraphrase, each explicitly tagged) or, if a future
  // template doesn't define one, the plain framing-only section the
  // original v1 design used (heading + a single is_framing paragraph,
  // no factual content). Never both.
  if (template.why_it_matters) {
    const whyItMattersSection = buildEditorialSection('why-it-matters', template.why_it_matters, grouped, usedStatements);
    if (whyItMattersSection) sections.push(whyItMattersSection);
  } else {
    sections.push({
      section_id: 'why-it-matters',
      heading: template.why_it_matters_heading,
      paragraphs: [{ text: template.why_it_matters_framing, supporting_claim_ids: [], is_framing: true, editorial_status: 'FRAMING', source_statements: [] }],
    });
  }

  // Template-defined body sections, each excluding any statement already
  // used by answer_summary, why_it_matters, or an earlier section in this
  // list. A `{ units }` section goes through buildEditorialSection(); a
  // `{ buckets }` section goes through the original fully generic,
  // verbatim-only mechanism, unchanged.
  for (const sectionConfig of template.sections) {
    if (sectionConfig.units) {
      const section = buildEditorialSection(sectionConfig.section_id, sectionConfig, grouped, usedStatements);
      if (section) sections.push(section);
      continue;
    }
    const points = sectionConfig.buckets
      .flatMap((bucket) => grouped[bucket] || [])
      .filter((point) => !usedStatements.has(point.statement));
    if (points.length === 0) continue; // evidence controls the page -- never force an empty heading
    points.forEach((point) => usedStatements.add(point.statement));
    sections.push({ section_id: sectionConfig.section_id, heading: sectionConfig.heading, paragraphs: points.map(paragraph) });
  }

  // Limitations -- always present, verbatim, every cleared limitation.
  // Deliberately NOT run through the editorial-unit path in this
  // exemplar: page-builder-validator.mjs's MISSING_REQUIRED_LIMITATION
  // rule requires this exact top-level field to match snapshot.limitations
  // byte-for-byte, and these are the page's own protected scope/caveat
  // language -- see docs/brand/AIMT-EDUCATION-EDITORIAL-VOICE-v0.md.
  const limitationParas = snapshot.limitations.map((l) => ({ text: l.statement, supporting_claim_ids: [...(l.supporting_claim_ids || [])], editorial_status: 'VERBATIM', source_statements: [l.statement] }));
  sections.push({ section_id: 'limitations', heading: template.limitations_heading, paragraphs: limitationParas });

  // Key takeaways -- an EXPLICIT recap. Deliberately NOT filtered by
  // usedStatements: recapping the answer_summary/body facts here is
  // intentional, not a duplication bug (see module header).
  const takeawaySource = template.key_takeaways_buckets.flatMap((bucket) => grouped[bucket] || []).slice(0, template.key_takeaways_limit);
  const keyTakeaways = takeawaySource.map(paragraph);

  const sources = buildSourcesFromSnapshot(snapshot);

  return {
    topic_slug: snapshot.topic_slug,
    route,
    seo: {
      title: `${snapshot.page_concept} | AIMT`,
      // Framing/presentation copy, distinct from the cleared scope note
      // (see scope_note field below) -- see the template's own header
      // comment for why these are not the same thing.
      meta_description: template.meta_description,
      canonical_url: null, // filled in by page-builder-seo.mjs#finalizeSeo()
      h1: snapshot.page_concept,
    },
    // The cleared scope note, preserved verbatim, as its own field --
    // NOT coupled to seo.meta_description (see page-builder-validator.mjs
    // #SCOPE_NOTE_NOT_PRESERVED, the rule that actually enforces this).
    scope_note: snapshot.scope_language.scope_note,
    answer_summary: answerSummary,
    sections,
    limitations: limitationParas,
    key_takeaways: keyTakeaways,
    sources,
    related_links: [...related_links],
    provenance: {
      page_builder_version: PAGE_BUILDER_DRAFT_VERSION,
      generated_at: generatedAt,
      generation_source_hash: meta.generationSourceHash ?? null,
      fingerprint_algorithm: meta.fingerprintAlgorithm ?? null,
      risk_tier: snapshot.risk_tier,
      selected_claim_ids: [...snapshot.selected_claim_ids],
      classification_method: 'deterministic-keyword-generic-v1',
      template_topic: snapshot.topic_slug,
      metadata: {
        ...template.provenance_notes,
        bucket_counts: Object.fromEntries(Object.entries(grouped).map(([k, v]) => [k, v.length])),
      },
    },
  };
}
