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

   AIMT EDUCATION VOICE v0 -- EDITORIAL EXEMPLAR (Owner Correction Pass):
   hair-cycle is now ALSO a hand-reviewed voice exemplar, not just a
   verbatim-content pilot. A section whose config below is an object
   with a `units` array (rather than the older `{ buckets }` shape) is
   built by the NEW resolveEditorialUnit() path in page-builder-draft.mjs
   instead of the original generic bucket-loop. This is an OPT-IN,
   per-section override -- a section with no `units` array still goes
   through the original, fully generic, verbatim-only mechanism
   unchanged. See docs/brand/AIMT-EDUCATION-EDITORIAL-VOICE-v0.md
   (STATUS: EDITORIAL EXEMPLAR / OWNER REVIEW) for the full voice
   rationale. This is explicitly NOT a general paraphrase system a
   future topic inherits automatically -- it is hand-authored,
   topic-specific presentation copy, exactly like meta_description
   already was, just extended to full section prose for this one
   owner-reviewed page.

   Each unit is one of:
     { kind: 'framing', text }
       Non-factual editorial/teaching copy. No claim IDs, no new
       scientific assertion -- purely connective or interpretive. Exempt
       from fidelity, exactly like why_it_matters_framing always was.
     { kind: 'verbatim', bucket }
       Renders the named bucket's own cleared statement text and its
       own supporting_claim_ids, byte-identical -- used wherever a
       statement's numbers/duration must stay maximally close to the
       cleared language (page-builder-validator.mjs's
       UNSUPPORTED_NUMERIC_CLAIM rule requires this for any digit-
       bearing rendered unit; TIMING is why 'stages' still uses this,
       not 'paraphrase').
     { kind: 'paraphrase', bucket, text }
       Conservative, meaning-preserving paraphrase of the named bucket's
       cleared statement. Automatically inherits ALL of that statement's
       own supporting_claim_ids (never hand-typed here, so there is no
       way for a paraphrase to end up attached to the wrong claims).
       Not byte-identical to the cleared statement by design --
       checkDraftFidelity() will correctly report REWRITE_REQUIRED for
       these (it has no way to verify a paraphrase's entailment
       deterministically), which scripts/page-builder-editorial-audit.mjs
       reports as the expected, reviewed EDITORIAL_REVIEW_REQUIRED status
       rather than a false PASS or a silent failure.
   Both 'verbatim' and 'paraphrase' mark their source statement as used
   in the same usedStatements set the generic mechanism already
   maintains, so a bucket consumed here is correctly excluded from any
   other section that might otherwise repeat it.
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

    // "why it matters" is now built entirely from `units` (AIMT
    // Education Voice v0 exemplar): a framing intro, a conservative
    // paraphrase of the cleared PRACTITIONER_RELEVANCE statement, a
    // one-line editorial bridge, and a second paraphrase unit covering
    // the rest of that same statement's meaning. Both paraphrase units
    // derive from -- and inherit the real supporting_claim_ids of --
    // the SAME single cleared statement: "Because follicles cycle
    // individually and asynchronously, distinguishing normal cycle
    // variation from abnormal cycling requires attention to objective
    // morphological criteria, which is relevant for practitioners
    // assessing scalp health." Splitting one dense sentence into two
    // teaching beats with a bridge between them is a presentation
    // choice, not two different facts. Because this bucket is marked
    // used here, the old 'cycle-vs-shedding' section (which drew from
    // the same PRACTITIONER_RELEVANCE bucket) continues to be omitted
    // by "evidence controls the page" -- unchanged from the prior pass.
    why_it_matters: {
      heading: 'Why the hair growth cycle matters',
      units: [
        { kind: 'framing', text: 'This overview is designed for beauty and scalp-care professionals who want a clear reference for the normal hair-growth cycle, its stages, typical timing, and normal variation.' },
        { kind: 'paraphrase', bucket: 'PRACTITIONER_RELEVANCE', text: "Hair follicles don't move through the cycle in lockstep — each one progresses on its own timeline." },
        { kind: 'framing', text: 'Understanding that baseline gives those observations context.' },
        { kind: 'paraphrase', bucket: 'PRACTITIONER_RELEVANCE', text: "That's exactly why distinguishing normal cycle variation from abnormal cycling is relevant for practitioners assessing scalp health — and why making that distinction depends on objective morphological criteria." },
      ],
    },

    limitations_heading: 'What this information cannot tell you',

    // Ordered body sections. A section with a `units` array is built by
    // the editorial-unit resolver (see the file header); a section with
    // the older `{ buckets }` shape still goes through the fully
    // generic, verbatim-only mechanism unchanged. Either way, a section
    // left with nothing to render (its evidence already used elsewhere)
    // is simply omitted -- "evidence controls the page."
    sections: [
      {
        section_id: 'stages',
        heading: 'The stages of the hair growth cycle',
        // TIMING carries the cycle's durations (3 years / 3 weeks / 3
        // months / 9%) -- kept 'verbatim', never paraphrased, because
        // page-builder-validator.mjs's UNSUPPORTED_NUMERIC_CLAIM rule
        // requires any digit-bearing rendered unit to be byte-identical
        // to its cleared statement. The framing bridges around it teach
        // why the numbers matter and connect exogen/shedding back to
        // the cycle, without touching the numbers themselves.
        units: [
          { kind: 'framing', text: 'Each of those phases has a typical length, and the numbers below are worth knowing — they set the baseline for what normal actually looks like.' },
          { kind: 'verbatim', bucket: 'TIMING' },
          { kind: 'framing', text: "Exogen — the shedding phase — isn't a separate event. It's simply where the cycle arrives once a follicle has moved through telogen." },
        ],
      },
      {
        section_id: 'for-professionals',
        heading: 'What professionals should understand',
        units: [
          { kind: 'framing', text: "Here's what actually drives that cycle, and what can shift its timing." },
          { kind: 'paraphrase', bucket: 'MECHANISM', text: 'That process is directed by hair follicle stem cells and the dermal papilla, coordinated through core signaling pathways such as Wnt, Sonic hedgehog, Notch, and BMP.' },
          { kind: 'paraphrase', bucket: 'FACTORS', text: 'Everyday physiological factors — hormones, stress, nutrition, sleep, inflammation, and blood flow among them — can normally influence when that transition between growth and rest happens.' },
        ],
      },
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
