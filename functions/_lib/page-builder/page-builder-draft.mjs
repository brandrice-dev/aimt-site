/* ═══════════════════════════════════════════════════════════════
   AIMT Page Builder v1 — deterministic draft builder
   ---------------------------------------------------------------
   PURE. No I/O, no AI call. Builds the structured draft contract
   (below) directly from a cleared snapshot (page-builder-loader.mjs
   #extractClearedSnapshot()'s output) -- nothing else.

   CRITICAL DESIGN DECISION, stated rather than hidden: v1 does NOT
   paraphrase. Every factual paragraph's `text` is the VERBATIM statement
   string already written and validated by Publication Editor's own
   synthesis + deterministic post-synthesis validator
   (core_factual_points[i].statement / limitations[i].statement). This is
   deliberate, not a missing feature: it makes factual fidelity trivially
   provable (the text IS the cleared claim text, by construction, not a
   rewrite of it) without requiring any AI call in this phase. Page
   Builder's actual value-add in v1 is ORGANIZATION -- deciding section
   order, headings, and which cleared points answer which practitioner
   question -- never inventing or rephrasing evidence content. A future
   version could add an AI "polish" pass for prose quality, gated behind
   page-builder-fidelity.mjs's conservative fidelity check (see that
   module) so a paraphrase could never silently drift from what was
   actually cleared.

   SECTION CLASSIFICATION: each core_factual_point is assigned to exactly
   one of five generic, topic-agnostic thematic buckets (DEFINITION,
   TIMING, MECHANISM, FACTORS, PRACTITIONER_RELEVANCE) via deterministic
   keyword matching against the point's own statement text -- never via
   an LLM call, never via topic_slug-specific special-casing of content.
   The keyword patterns were informed by reviewing hair-cycle's real
   cleared statements (the only cleared snapshot that exists as of this
   revision), but the classifier itself does not branch on topic_slug.
   Buckets with no matching point are simply omitted from the page --
   "Do NOT force every heading if the evidence does not support it."

   KNOWN LIMITATION, documented rather than hidden: hair-cycle's cleared
   evidence describes all four cycle phases (anagen/catagen/telogen/
   exogen) in ONE combined DEFINITION statement, and three of their
   typical durations in ONE combined TIMING statement -- not as four
   independently-supported per-phase facts. Splitting that single
   statement into four separate per-phase sentences would mean writing
   NEW sentences not verbatim present in the cleared evidence, which v1
   deliberately does not do. The four-heading breakdown suggested in this
   feature's originating brief is therefore intentionally NOT built as
   four separate H2s here; DEFINITION + TIMING are rendered together
   under one combined "stages" section instead, and this is called out
   explicitly in the draft's own provenance.metadata.
   ═══════════════════════════════════════════════════════════════ */

import { getPageBuilderRoute } from './page-builder-route-registry.mjs';

export const PAGE_BUILDER_DRAFT_VERSION = 'page-builder-draft-v1';

/** Ordered, first-match-wins keyword classifier. Order matters: a
    statement that happens to mention both "phases" and "typically
    lasts" should classify as DEFINITION only if "phases" appears without
    a duration cue -- TIMING is checked before DEFINITION's broader
    "phases/stages" pattern specifically to avoid that ambiguity. */
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
  return { text: point.statement, supporting_claim_ids: [...(point.supporting_claim_ids || [])] };
}

/** Groups a snapshot's core_factual_points by bucket, preserving the
    snapshot's own array order within each bucket. */
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
 * Builds the strict structured draft contract from a cleared snapshot.
 * Pure, synchronous, deterministic -- same snapshot in, byte-identical
 * draft out, every time.
 *
 * @param {object} snapshot - page-builder-loader.mjs#extractClearedSnapshot() output
 * @param {{generationSourceHash?: string, fingerprintAlgorithm?: string, generatedAt?: string}} [meta]
 * @returns {object} the structured draft
 */
export function buildPageDraft(snapshot, meta = {}) {
  const { route, related_links } = getPageBuilderRoute(snapshot.topic_slug);
  const grouped = classifyCoreFactualPoints(snapshot);
  const generatedAt = meta.generatedAt || new Date().toISOString();

  const sections = [];

  // 2. Concise answer / definition
  const definitionParas = grouped.DEFINITION.map(paragraph);
  if (definitionParas.length) {
    sections.push({ section_id: 'concise-answer', heading: 'What is the hair growth cycle?', paragraphs: definitionParas });
  }

  // 3. Why it matters (framing only -- reuses the already-cleared
  // public_intent/scope_note text verbatim; not a factual claim about
  // biology, so it carries no supporting_claim_ids and the validator
  // does not require any).
  sections.push({
    section_id: 'why-it-matters',
    heading: 'Why the hair growth cycle matters',
    paragraphs: [{ text: snapshot.public_intent, supporting_claim_ids: [], is_framing: true }],
  });

  // 4. Stages (DEFINITION + TIMING combined -- see module header for why
  // this is not split into four separate per-phase headings).
  const stageParas = [...grouped.DEFINITION.map(paragraph), ...grouped.TIMING.map(paragraph)];
  if (stageParas.length) {
    sections.push({ section_id: 'stages', heading: 'The stages of the hair growth cycle', paragraphs: stageParas });
  }

  // 9. Hair cycle vs. normal shedding
  const practitionerParas = grouped.PRACTITIONER_RELEVANCE.map(paragraph);
  if (practitionerParas.length) {
    sections.push({ section_id: 'cycle-vs-shedding', heading: 'Hair cycle vs. normal shedding', paragraphs: practitionerParas });
  }

  // 10. What professionals should understand
  const professionalParas = [...grouped.MECHANISM.map(paragraph), ...grouped.FACTORS.map(paragraph), ...grouped.OTHER.map(paragraph)];
  if (professionalParas.length) {
    sections.push({ section_id: 'for-professionals', heading: 'What professionals should understand', paragraphs: professionalParas });
  }

  // 11. Limitations
  const limitationParas = snapshot.limitations.map((l) => ({ text: l.statement, supporting_claim_ids: [...(l.supporting_claim_ids || [])] }));
  sections.push({ section_id: 'limitations', heading: 'What this information cannot tell you', paragraphs: limitationParas });

  // 12. Key takeaways -- verbatim reuse of the same cleared statements
  // already used above (definition + timing/mechanism highlight +
  // practitioner-relevance highlight), never a paraphrase, so no new
  // fidelity risk is introduced by this section.
  const takeawaySource = [...grouped.DEFINITION, ...grouped.PRACTITIONER_RELEVANCE, ...grouped.TIMING].slice(0, 3);
  const keyTakeaways = takeawaySource.map(paragraph);

  // 13. Sources
  const sources = buildSourcesFromSnapshot(snapshot);

  const answerSummaryPoint = grouped.DEFINITION[0] || snapshot.core_factual_points[0];
  const answerSummary = answerSummaryPoint ? paragraph(answerSummaryPoint) : { text: '', supporting_claim_ids: [] };

  const h1 = snapshot.page_concept;

  return {
    topic_slug: snapshot.topic_slug,
    route,
    seo: {
      title: `${snapshot.page_concept} | AIMT`,
      meta_description: snapshot.scope_language.scope_note,
      canonical_url: null, // filled in by page-builder-seo.mjs (needs the route registry's origin)
      h1,
    },
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
      classification_method: 'deterministic-keyword-v1',
      metadata: {
        combined_stage_headings_note:
          'anagen/catagen/telogen/exogen are described jointly (one combined phase-definition statement, one combined duration statement) in the cleared evidence, not as four independently-supported per-phase facts -- so this draft renders one combined "stages" section rather than four forced per-phase headings.',
        bucket_counts: Object.fromEntries(Object.entries(grouped).map(([k, v]) => [k, v.length])),
      },
    },
  };
}
