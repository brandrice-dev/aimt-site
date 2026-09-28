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
  // SEMANTIC CORRECTION (seo/education-page-2-generalization, post-review):
  // the original in_scope_concepts entry below said "shift into
  // telogen/shedding", which the model read as license to call telogen
  // itself "the shedding phase" -- contradicting the published hair-cycle
  // page, where telogen = rest and exogen = shedding of the old hair. The
  // verified evidence behind this page's definition (natarelli--c01/c02,
  // landells-canadian-te-algorithm-2025--c01) only supports an anagen->
  // telogen shift and a resulting increase in shedding; none of it
  // describes a specific telogen->exogen mechanism, so this intent no
  // longer asks the synthesis to assert one.
  //
  // NON-CORE CONFLICT NARROWING (same branch, second correction round):
  // a corrected re-synthesis returned HUMAN_REVIEW / UNRESOLVED_CONTRADICTION
  // over te-trace-elements-srma-2026--c03 ("significantly lower serum
  // vitamin D in TE cases", p=0.006) directly disagreeing with
  // yongpisarn-vitd-alopecia-srma-2024--c04 ("only AA and FPHL showed [a]
  // statistically significant association ... [not TE]") -- same
  // question (is TE-specific vitamin D deficiency statistically
  // significant?), same population (TE cases vs controls), opposing
  // conclusions, with neither claim's text giving enough methodological
  // detail to resolve which is more reliable. Classified NON-CORE: this
  // page's core answer (what TE is, its anagen-to-telogen relationship,
  // documented trigger CATEGORIES in general, why distinguishing it from
  // patterned hair loss matters, scope/limitations) does not depend on
  // this specific biomarker-level finding -- it is one example under the
  // broader "nutritional deficiency" trigger category, not the category
  // itself. The originally-built (pre-review) page bundled the disputed
  // vitamin-D claim together with te-trace-elements-srma-2026--c02
  // (serum ferritin) into a single sentence citing both -- since that
  // ferritin claim was, in practice, not cleanly separated from the
  // conflicted material, it is excluded from this page's intent too,
  // rather than keeping the more-convenient half of a bundled statement.
  // The broad "nutritional deficiency" trigger category remains in scope
  // below because it is independently supported by a separate,
  // non-conflicted claim (natarelli--c02's general factor list), not by
  // either disputed biomarker finding. Nothing here modifies the
  // underlying research claims -- both sides of the disagreement remain
  // exactly as verified in the research library; this narrows only what
  // THIS public overview attempts to say. See EXCLUSION_REASON_CODES'
  // UNRESOLVED_NON_CORE_CONFLICT in publication-synthesis-schema.mjs for
  // the reusable mechanism this maps to during synthesis.
  'telogen-effluvium': {
    page_concept: 'Telogen Effluvium: A Practitioner Education Overview',
    public_intent: 'Explain telogen effluvium -- a temporary, diffuse shedding pattern distinct from progressive hair loss -- clearly and accurately for beauty/scalp-care professionals and informed readers.',
    in_scope_concepts: Object.freeze([
      'what telogen effluvium is: a diffuse, temporary increase in shedding following a precipitating trigger',
      "the relationship to the normal hair cycle (an exaggerated, synchronized shift of follicles from anagen into telogen, not a separate disease process -- per AIMT's published hair-cycle page, telogen is the resting phase and is distinct from exogen, the shedding of the old hair; describe the anagen-to-telogen shift and the resulting increase in visible shedding as related but separate facts, and do not state or imply that telogen itself is the shedding phase, or that telogen and exogen are the same phase, unless the evidence explicitly supports a specific telogen-to-exogen mechanism)",
      "documented categories of precipitating triggers (e.g. illness, stress, postpartum, nutritional deficiency) as GENERAL CATEGORIES described by the evidence, without diagnosing an individual case -- the broad 'nutritional deficiency' category may be described only insofar as it is independently supported by non-biomarker-specific evidence (e.g. a general factor list), never by citing a specific serum biomarker finding that is out of scope below",
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
      'a vitamin-D-specific TE biomarker association claim -- the evidence on whether TE-specific vitamin D deficiency is statistically significant is unresolved between sources (a genuine, non-core disagreement; see this entry\'s header comment), so this page does not attempt a vitamin-D-specific association statement in either direction',
      'a serum-ferritin-specific TE biomarker association claim bundled with the disputed vitamin-D finding -- excluded alongside it because it was not, in practice, cleanly separable from the conflicted material into its own independently-supported statement',
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

export class PageSynthesisIntentError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PageSynthesisIntentError';
  }
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

/** PURE. Throws PageSynthesisIntentError (never returns a partial
    result) on any shape violation -- deliberately called BEFORE any
    model call, so a malformed dynamic intent never reaches the
    network. Field names and requirements match this registry's own
    hand-authored entries exactly (see PAGE_SYNTHESIS_INTENT above). */
function validateExplicitPageSynthesisIntent(topicSlug, explicitIntent) {
  if (!explicitIntent || typeof explicitIntent !== 'object') {
    throw new PageSynthesisIntentError(`resolvePageSynthesisIntent: explicit intent for "${topicSlug}" must be an object.`);
  }
  const errors = [];
  if (!isNonEmptyString(explicitIntent.page_concept)) errors.push('page_concept must be a non-empty string');
  if (!isNonEmptyString(explicitIntent.public_intent)) errors.push('public_intent must be a non-empty string');
  if (!Array.isArray(explicitIntent.in_scope_concepts) || explicitIntent.in_scope_concepts.length === 0 || !explicitIntent.in_scope_concepts.every(isNonEmptyString)) {
    errors.push('in_scope_concepts must be a non-empty array of non-empty strings');
  }
  if (!Array.isArray(explicitIntent.out_of_scope_concepts) || !explicitIntent.out_of_scope_concepts.every(isNonEmptyString)) {
    errors.push('out_of_scope_concepts must be an array of non-empty strings');
  }
  if (errors.length > 0) {
    throw new PageSynthesisIntentError(`resolvePageSynthesisIntent: explicit intent for "${topicSlug}" is malformed: ${errors.join('; ')}`);
  }
}

/**
 * FAIL-CLOSED bridge between the hand-authored registry above and a
 * dynamically-produced (but already deterministically validated) page
 * intent -- e.g. AIMT Education Operations' own intent planner output.
 * Historical behavior is completely unchanged: called with no explicit
 * intent (or `null`), this is exactly `getPageSynthesisIntent()`, same
 * registry, same throw for an unregistered slug. Called WITH an
 * explicit intent, it validates that intent's shape deterministically
 * and returns THAT intent instead -- it never consults, falls back to,
 * or mutates the registry in that path, and it never infers or invents
 * a field the caller didn't supply.
 *
 * Returns a normalized, frozen defensive copy either way, so nothing
 * downstream (including a caller holding onto its own mutable copy of
 * the object it passed in) can mutate what synthesis/reconciliation/
 * retry/the clearance brief actually used.
 *
 * @param {string} topicSlug
 * @param {{page_concept: string, public_intent: string, in_scope_concepts: string[], out_of_scope_concepts: string[]}|null} [explicitIntent]
 * @returns {{page_concept: string, public_intent: string, in_scope_concepts: string[], out_of_scope_concepts: string[]}}
 */
export function resolvePageSynthesisIntent(topicSlug, explicitIntent = null) {
  if (explicitIntent === null || explicitIntent === undefined) {
    return getPageSynthesisIntent(topicSlug);
  }
  validateExplicitPageSynthesisIntent(topicSlug, explicitIntent);
  return Object.freeze({
    page_concept: explicitIntent.page_concept,
    public_intent: explicitIntent.public_intent,
    in_scope_concepts: Object.freeze([...explicitIntent.in_scope_concepts]),
    out_of_scope_concepts: Object.freeze([...explicitIntent.out_of_scope_concepts]),
  });
}
