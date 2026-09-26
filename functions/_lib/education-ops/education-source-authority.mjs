/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — deterministic source authority
   ---------------------------------------------------------------
   TRUST-BOUNDARY CORRECTION: the Education Writer model was previously
   asked to author each source's title/authors/year/doi/url itself. That
   meant a model could pair a REAL, cleared source_id with an INVENTED
   or simply WRONG title/URL/authors and still pass validation, because
   the deterministic check only ever confirmed the source_id was
   cleared -- never that the metadata attached to it was real.

   THE FIX: the model has no schema slot for `sources` at all (see
   EDUCATION_WRITER_OUTPUT_JSON_SCHEMA, education-page-plan-schema.mjs).
   This module derives the rendered source list ENTIRELY from
   clearedSnapshot.source_ids + clearedSnapshot.citation_map -- the same
   canonical, already-cleared citation data the existing Page Builder
   uses (see functions/_lib/page-builder/page-builder-draft.mjs's own
   buildSourcesFromSnapshot(), same principle, generalized here). The
   Writer never sees this function's output and cannot influence it.
   ═══════════════════════════════════════════════════════════════ */

/**
 * PURE. Builds the rendered `sources[]` array directly from the cleared
 * snapshot's own canonical citation data -- never from model output.
 *
 * @param {object} clearedSnapshot - the fingerprint_input the page was
 *   cleared from; must carry `source_ids` (string[]) and `citation_map`
 *   ({[source_id]: {title, authors, year, doi, url, ...}})
 * @returns {Array<{source_id: string, title: string, authors: string[], year: number|null, doi: string|null, url: string|null}>}
 */
export function buildTrustedSources(clearedSnapshot) {
  const sourceIds = Array.isArray(clearedSnapshot.source_ids) ? clearedSnapshot.source_ids : [];
  const citationMap = clearedSnapshot.citation_map && typeof clearedSnapshot.citation_map === 'object' ? clearedSnapshot.citation_map : {};
  return sourceIds.map((sourceId) => {
    const meta = citationMap[sourceId] || {};
    return {
      source_id: sourceId,
      // A real cleared source without a recorded title is still real --
      // fall back to the source_id itself rather than a blank/null
      // string, which the renderer would otherwise print literally.
      title: (typeof meta.title === 'string' && meta.title.trim()) ? meta.title : sourceId,
      authors: Array.isArray(meta.authors) ? meta.authors : [],
      year: typeof meta.year === 'number' ? meta.year : null,
      doi: typeof meta.doi === 'string' && meta.doi ? meta.doi : null,
      url: typeof meta.url === 'string' && meta.url ? meta.url : null,
    };
  });
}
