/* ═══════════════════════════════════════════════════════════════
   AIMT Page Builder v1 — page-specific presentation template registry
   ---------------------------------------------------------------
   ARCHITECTURAL HONESTY CORRECTION (this revision): an earlier version
   of page-builder-draft.mjs hardcoded hair-cycle-specific heading text
   ("What is the hair growth cycle?", "Hair cycle vs. normal shedding",
   ...) and a hair-cycle-specific provenance note directly inside the
   supposedly generic draft builder, while claiming the builder was
   topic-agnostic. That was not true, and pretending otherwise would
   have made adding a second topic look like "just registering a new
   snapshot" when it would actually have required editing shared logic.

   The real split is:
     - CLASSIFICATION (page-builder-draft.mjs#classifyCoreFactualPoints)
       is genuinely generic: five topic-agnostic keyword buckets, no
       topic_slug branching anywhere in that function.
     - PRESENTATION (this file) is NOT generic and does not pretend to
       be: which buckets become which named section, in what order,
       under what heading, plus the topic's SEO meta description and any
       topic-specific provenance note. This is deliberately a small,
       explicit, hand-written template per topic -- exactly the kind of
       thing a human editor would actually choose for a specific page.

   Adding a second topic to Page Builder v1 means adding a template here
   (and a route entry in page-builder-route-registry.mjs) -- it does NOT
   mean editing buildPageDraft()'s generic assembly logic. No second
   topic is registered in this revision; hair-cycle is still the only
   real cleared snapshot that exists, and this task does not invent a
   hypothetical second template to "prove" generality it hasn't earned
   yet (see docs/research/AIMT-Page-Builder-v1-Shadow.md's explicit
   note: v1 remains a one-topic pilot; classification generalizing to a
   genuinely different topic's evidence shape has not been demonstrated
   and is not claimed here).

   DEDUPLICATION CONTRACT (enforced by buildPageDraft(), not by this
   file): the answer_summary's chosen statement is tracked and excluded
   from every `sections[]` entry below, so the exact same cleared
   statement is never rendered twice across answer_summary + body
   sections. `key_takeaways` are exempt from that exclusion (they are
   an explicit recap, by design) -- see page-builder-draft.mjs.
   ═══════════════════════════════════════════════════════════════ */

export class PageBuilderTemplateError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PageBuilderTemplateError';
  }
}

export const PAGE_BUILDER_TEMPLATES = Object.freeze({
  'hair-cycle': {
    // Which bucket's first (not-yet-used) point becomes the top-level
    // answer_summary. Falls back to the snapshot's first core point if
    // this bucket is empty for some reason (see buildPageDraft()).
    answer_summary_bucket: 'DEFINITION',

    why_it_matters_heading: 'Why the hair growth cycle matters',

    // Reader-facing framing copy for the "why it matters" section.
    // Owner Correction Pass: v1 originally rendered snapshot.public_intent
    // verbatim here, which is written as an internal page-intent
    // instruction ("Explain the normal hair-growth cycle clearly and
    // accurately for...") rather than reader-facing prose. Exactly like
    // meta_description below, this is hand-authored, per-template
    // presentation copy closely anchored to the cleared
    // page_concept/public_intent wording rather than freely invented --
    // it restates the page's own stated purpose for a reader, it does not
    // add or alter any factual/scientific claim. The underlying cleared
    // public_intent field itself is untouched in research_public_pages.
    why_it_matters_framing: 'This overview is designed for beauty and scalp-care professionals who want a clear reference for the normal hair-growth cycle, its stages, typical timing, and normal variation.',

    limitations_heading: 'What this information cannot tell you',

    // Ordered body sections. Each pulls from its listed buckets, MINUS
    // whatever statement answer_summary (or an earlier section in this
    // list) already used. A section with nothing left after that
    // exclusion is simply omitted -- "evidence controls the page."
    sections: [
      { section_id: 'stages', heading: 'The stages of the hair growth cycle', buckets: ['DEFINITION', 'TIMING'] },
      { section_id: 'cycle-vs-shedding', heading: 'Hair cycle vs. normal shedding', buckets: ['PRACTITIONER_RELEVANCE'] },
      { section_id: 'for-professionals', heading: 'What professionals should understand', buckets: ['MECHANISM', 'FACTORS', 'OTHER'] },
    ],

    // Key takeaways MAY intentionally recap statements already used
    // elsewhere -- this is an explicit recap section, not subject to
    // the answer_summary/body deduplication rule.
    key_takeaways_buckets: ['DEFINITION', 'PRACTITIONER_RELEVANCE', 'TIMING'],
    key_takeaways_limit: 3,

    // SEO meta description: framing/presentation copy, NOT a substitute
    // for the cleared scope note (which is preserved verbatim in its
    // own draft.scope_note field -- see page-builder-validator.mjs's
    // SCOPE_NOTE_NOT_PRESERVED rule). Hand-authored per page, closely
    // anchored to the cleared page_concept/public_intent wording rather
    // than freely invented, and checked by the generic validator for
    // length/safety (<=160 chars, no digits, no treatment/diagnosis
    // language, no transactional language) -- never compared for
    // equality against the scope note, because the two serve different
    // purposes.
    meta_description: 'A practitioner-oriented overview of the normal hair growth cycle — its stages and typical timing.',

    provenance_notes: {
      combined_stage_headings_note:
        'anagen/catagen/telogen/exogen are described jointly (one combined phase-definition statement, one combined duration statement) in the cleared evidence, not as four independently-supported per-phase facts -- so this draft renders one combined "stages" section rather than four forced per-phase headings.',
    },
  },
});

export function getPageBuilderTemplate(topicSlug) {
  const template = PAGE_BUILDER_TEMPLATES[topicSlug];
  if (!template) {
    throw new PageBuilderTemplateError(`No Page Builder presentation template registered for "${topicSlug}". Page Builder v1 is a one-topic pilot (hair-cycle only) -- see docs/research/AIMT-Page-Builder-v1-Shadow.md.`);
  }
  return template;
}
