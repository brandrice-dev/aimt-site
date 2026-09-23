/* ═══════════════════════════════════════════════════════════════
   AIMT Publication Editor v2 — page synthesis intent registry
   ---------------------------------------------------------------
   STEP 3. What a specific public page is actually FOR -- separate from
   the v1 PILOT_TOPIC_CONCEPTS registry (publication-readiness-loader.mjs),
   which only maps a concept to its underlying controlled_topics for
   evidence gathering. This registry tells the synthesis layer what a
   topic's candidate evidence should be narrowed DOWN to for one specific
   page, so a topic-wide candidate set (everything sharing a topic tag)
   is never mistaken for page-specific material.

   Per this task's explicit scope: only `hair-cycle` is registered here.
   The other five pilot concepts are intentionally NOT added yet -- v2 is
   proving the architecture on one topic first, not being pre-wired for
   all six.
   ═══════════════════════════════════════════════════════════════ */

export const PAGE_SYNTHESIS_INTENT = Object.freeze({
  'hair-cycle': {
    page_concept: 'The Hair Growth Cycle: A Practitioner Education Overview',
    public_intent: 'Explain the normal hair-growth cycle clearly and accurately for beauty/scalp-care professionals and informed readers.',
    in_scope_concepts: Object.freeze([
      'follicular cycling (anagen, catagen, telogen, exogen where supported)',
      'normal shedding relationship and typical timing/context',
      'practical educational meaning for a practitioner',
      'limitations and normal variation in the cycle',
    ]),
    out_of_scope_concepts: Object.freeze([
      'treatment efficacy',
      'medication effectiveness (e.g. minoxidil)',
      'PRP (platelet-rich plasma)',
      'LLLT (low-level laser therapy)',
      'other cosmetic actives',
      'therapeutic comparisons between interventions',
      'disease treatment or diagnosis',
    ]),
  },
});

export function getPageSynthesisIntent(topicSlug) {
  const intent = PAGE_SYNTHESIS_INTENT[topicSlug];
  if (!intent) {
    throw new Error(`No page synthesis intent registered for "${topicSlug}". Publication Editor v2 is scoped to hair-cycle only for this pilot -- see docs/research/AIMT-Publication-Editor-v2.md.`);
  }
  return intent;
}
