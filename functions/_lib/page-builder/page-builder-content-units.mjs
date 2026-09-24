/* ═══════════════════════════════════════════════════════════════
   AIMT Page Builder v1 — rendered factual units (shared helper)
   ---------------------------------------------------------------
   PURE. Single, shared concept of "everything the rendered page
   actually presents as a factual statement" -- used by BOTH
   page-builder-validator.mjs and page-builder-fidelity.mjs, so the two
   can never quietly disagree about what counts as rendered content.

   CORRECTION (this revision): an earlier version of the validator and
   fidelity checker only inspected `draft.sections[].paragraphs`. The
   renderer (page-builder-render.mjs) also outputs `answer_summary` and
   `key_takeaways` as visible factual content, and neither was being
   checked for claim support, fidelity, numeric-claim protection, or
   treatment/diagnosis drift -- a real validation blind spot. This
   module is the one place "what counts as a rendered factual unit" is
   defined, so that blind spot cannot reopen by one checker being
   updated and the other not.
   ═══════════════════════════════════════════════════════════════ */

/**
 * editorial_status/source_statements are AIMT Education Voice v0 additions
 * (Owner Correction Pass): a unit that doesn't carry them (any older/hand-
 * built paragraph object, e.g. in tests) defaults exactly to v1's original
 * assumption -- framing units are 'FRAMING', everything else is 'VERBATIM'
 * -- so this is purely additive and never changes behavior for a
 * paragraph that predates this field.
 *
 * @param {object} draft - page-builder-draft.mjs#buildPageDraft() output
 * @returns {Array<{unit_id: string, group: string, text: string, supporting_claim_ids: string[], is_framing: boolean, editorial_status: string, source_statements: string[]}>}
 */
function withEditorialMeta(u) {
  return {
    editorial_status: u.editorial_status || (u.is_framing ? 'FRAMING' : 'VERBATIM'),
    source_statements: [...(u.source_statements || [])],
  };
}

export function collectRenderedFactualUnits(draft) {
  const units = [];

  units.push({
    unit_id: 'answer_summary',
    group: 'answer_summary',
    text: draft.answer_summary.text,
    supporting_claim_ids: [...(draft.answer_summary.supporting_claim_ids || [])],
    is_framing: !!draft.answer_summary.is_framing,
    ...withEditorialMeta(draft.answer_summary),
  });

  for (const section of draft.sections) {
    section.paragraphs.forEach((p, i) => {
      units.push({
        unit_id: `section:${section.section_id}:${i}`,
        group: 'section',
        text: p.text,
        supporting_claim_ids: [...(p.supporting_claim_ids || [])],
        is_framing: !!p.is_framing,
        ...withEditorialMeta(p),
      });
    });
  }

  draft.key_takeaways.forEach((t, i) => {
    units.push({
      unit_id: `key_takeaway:${i}`,
      group: 'key_takeaway',
      text: t.text,
      supporting_claim_ids: [...(t.supporting_claim_ids || [])],
      is_framing: !!t.is_framing,
      ...withEditorialMeta(t),
    });
  });

  return units;
}

/**
 * Unique, sorted set of every supporting_claim_id actually attached to a
 * non-framing rendered unit -- the honest "what claims did the rendered
 * page actually end up citing" figure, independent of how many claims
 * the cleared snapshot made available. May legitimately be smaller than
 * snapshot.selected_claim_ids.length if a topic's evidence doesn't place
 * every selected claim into rendered content.
 *
 * @param {object} draft
 * @returns {string[]}
 */
export function computeRenderedSupportClaimIds(draft) {
  const ids = new Set();
  for (const unit of collectRenderedFactualUnits(draft)) {
    if (unit.is_framing) continue;
    for (const id of unit.supporting_claim_ids) ids.add(id);
  }
  return [...ids].sort();
}

/**
 * Finds any exact-text duplicate among answer_summary + body section
 * paragraphs (never key_takeaways, which are an intentional recap and
 * exempt from this check by design).
 *
 * @param {object} draft
 * @returns {Array<{text: string, unit_ids: string[]}>}
 */
export function findDuplicateFactualText(draft) {
  const seen = new Map();
  const units = collectRenderedFactualUnits(draft).filter((u) => u.group !== 'key_takeaway' && !u.is_framing);
  for (const u of units) {
    if (!seen.has(u.text)) seen.set(u.text, []);
    seen.get(u.text).push(u.unit_id);
  }
  const duplicates = [];
  for (const [text, unitIds] of seen) {
    if (unitIds.length > 1) duplicates.push({ text, unit_ids: unitIds });
  }
  return duplicates;
}
