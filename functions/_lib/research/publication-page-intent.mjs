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

   GENERALIZATION TEST (Page #2, seo/education-page-2-generalization):
   `telogen-effluvium` added as the second entry, proving this registry
   generalizes to a different evidence shape without touching any shared
   synthesis logic (evidence loader, client, validator, orchestrator,
   reconciliation are all already topic-agnostic -- only this registry
   and v1's PILOT_TOPIC_CONCEPTS, which already had telogen-effluvium
   registered, are topic-specific by design). Still hand-authored per
   topic, exactly like hair-cycle's entry -- this is editorial scope
   policy (what THIS page is narrowed to, out of everything tagged with
   the topic), not something inferred automatically from evidence.
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
  'telogen-effluvium': {
    page_concept: 'Telogen Effluvium: A Practitioner Education Overview',
    public_intent: 'Explain telogen effluvium -- a temporary, diffuse shedding pattern distinct from progressive hair loss -- clearly and accurately for beauty/scalp-care professionals and informed readers.',
    in_scope_concepts: Object.freeze([
      'what telogen effluvium is: a diffuse, temporary increase in shedding following a precipitating trigger',
      'the relationship to the normal hair cycle (an exaggerated, synchronized shift into telogen/shedding, not a separate disease process)',
      'documented categories of precipitating triggers (e.g. illness, stress, postpartum, nutritional deficiency) as described by the evidence, without diagnosing an individual case',
      'typical onset delay and course, including the distinction between acute and chronic/persistent presentations where the evidence supports it',
      'why distinguishing diffuse temporary shedding from progressive/patterned hair loss is relevant for a practitioner making an observation-based judgment',
      'limitations, evidence maturity, and normal variation in how telogen effluvium presents',
    ]),
    out_of_scope_concepts: Object.freeze([
      'diagnosis of an individual\'s underlying cause',
      'ordering or interpreting laboratory/serologic testing',
      'oral or topical minoxidil dosing, prescribing, or other treatment protocols',
      'treatment efficacy or therapeutic comparisons between interventions',
      'androgenetic alopecia or alopecia areata as their own conditions (related-but-separate topics, not this page\'s subject)',
      'disease treatment or medical management',
    ]),
  },
});

export function getPageSynthesisIntent(topicSlug) {
  const intent = PAGE_SYNTHESIS_INTENT[topicSlug];
  if (!intent) {
    throw new Error(`No page synthesis intent registered for "${topicSlug}". Publication Editor v2 currently has registered intent for: ${Object.keys(PAGE_SYNTHESIS_INTENT).join(', ')} -- see docs/research/AIMT-Publication-Editor-v2.md.`);
  }
  return intent;
}
