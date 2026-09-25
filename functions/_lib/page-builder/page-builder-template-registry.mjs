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
   mean editing buildPageDraft()'s generic assembly logic.

   GENERALIZATION TEST UPDATE (seo/education-page-2-generalization):
   telogen-effluvium is now registered below as a genuinely different,
   independently-cleared topic (see docs/research/
   AIMT-Page-Builder-v1-Shadow.md's original one-topic-pilot note, which
   this branch is the first real test of). Two small, generic fixes to
   the shared classifier/unit-resolution code were required to support
   it -- documented at classifyCoreFactualPoints() and
   resolveEditorialUnit() in page-builder-draft.mjs, not here -- but
   buildPageDraft()'s assembly logic itself needed zero changes.

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
       Non-factual editorial/teaching copy. No claim IDs. Exempt from
       fidelity, exactly like why_it_matters_framing always was.
       GOVERNANCE RULE (Owner Correction Pass, "framing cannot carry
       science" -- see docs/brand/AIMT-EDUCATION-EDITORIAL-VOICE-v0.md's
       "Framing is not a loophole" section): a framing unit must be
       REMOVABLE FROM THE PAGE WITHOUT CHANGING ITS SCIENTIFIC MEANING.
       It may orient the reader, create rhythm, introduce a question,
       signal why the next material is useful, create emphasis, or
       connect sections editorially. It may NOT introduce or summarize a
       biological fact, physiological sequence, timing/duration,
       mechanism, causal relationship, prevalence/percentage, or
       diagnostic/treatment implication -- any claim that would need
       evidence if it stood alone. If deleting a framing sentence would
       delete scientific information, it is not framing; it must be
       VERBATIM or PARAPHRASE (with real supporting_claim_ids and
       source_statements) instead. This is a human editorial judgment
       call for this v0 exemplar, not a deterministic check --
       scripts/page-builder-editorial-audit.mjs reports every FRAMING
       unit as FRAMING_REQUIRES_EDITORIAL_REVIEW rather than treating
       "has no claim IDs" as automatically safe.
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
        // to its cleared statement.
        //
        // Owner Correction Pass ("framing cannot carry science"): the
        // original lead-in here ("Each of those phases has a typical
        // length...") restated a factual idea on its own -- removable-
        // without-losing-science fails for it, so it is not legitimate
        // framing. Replaced with a line that motivates the numbers
        // without stating one. The original closing bridge ("Exogen --
        // the shedding phase -- isn't a separate event...") asserted a
        // sequence/mechanism claim (exogen follows telogen) beyond what
        // TIMING itself states -- removed outright, not paraphrased, per
        // docs/brand/AIMT-EDUCATION-EDITORIAL-VOICE-v0.md's "Framing is
        // not a loophole" section. The hero's answer_summary already
        // identifies exogen as shedding of the old hair; that remains
        // sufficient for this page.
        units: [
          { kind: 'framing', text: 'The numbers matter because they give the cycle scale.' },
          { kind: 'verbatim', bucket: 'TIMING' },
        ],
      },
      {
        section_id: 'for-professionals',
        heading: 'What professionals should understand',
        // Owner Correction Pass: the original lead-in ("Here's what
        // actually drives that cycle, and what can shift its timing.")
        // was too close to a factual summary of the two paragraphs that
        // follow it -- replaced with framing that orients the reader
        // without pre-stating the mechanism/factors content itself.
        units: [
          { kind: 'framing', text: 'The cycle is more than a timetable.' },
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

  // GENERALIZATION TEST (seo/education-page-2-generalization): the second
  // topic Page Builder v1 has ever been pointed at, cleared via the
  // governed Publication Editor v2.1 pipeline (see
  // publication-page-intent.mjs's telogen-effluvium entry and the
  // HUMAN_REVIEW_MISSING_JUSTIFICATION governance fix that preceded it).
  // Deliberately does NOT reuse hair-cycle's headings/section_ids/prose --
  // per the task's own instruction, the page structure follows THIS
  // topic's own cleared evidence and search intent, not hair-cycle's
  // shape. What DID carry over unchanged: the three-layer VERBATIM/
  // PARAPHRASE/FRAMING model, the "framing cannot carry science" rule,
  // and the editorial-unit mechanism itself (resolveEditorialUnit()) --
  // proving those generalize as principles, not as hair-cycle's specific
  // sentences. One real classifier gap surfaced and was fixed generically
  // in page-builder-draft.mjs (DEFINITION's pattern didn't recognize this
  // topic's definitional sentence shape) and one real mechanism gap was
  // fixed generically too (editorial units could only ever read a
  // bucket's first point; telogen-effluvium's FACTORS bucket genuinely
  // has two) -- both documented at their own definitions, not here.
  'telogen-effluvium': {
    // RE-TEMPLATED (seo/education-page-2-generalization, non-core conflict
    // narrowing round): the clearance this template reads from was
    // rebuilt after excluding the disputed vitamin-D/ferritin biomarker
    // material (see publication-page-intent.mjs's telogen-effluvium
    // header comment). A fresh synthesis over narrowed evidence does not
    // reproduce the same core_factual_points, in the same order, in the
    // same buckets -- the FACTORS bucket that the previous template's
    // "triggers" section read from is now genuinely empty (its two prior
    // points were the trigger-category list and the excluded ferritin/
    // vitamin-D statement; the trigger-category material re-synthesized
    // into a single combined mechanism-and-triggers statement that the
    // classifier now places in OTHER instead), and the previous "prevalence"
    // section's TIMING point changed from a COVID-era prevalence
    // percentage to a normal-cycle background statistic (~9% of follicles
    // in telogen at any time) -- a different fact the old section's
    // framing sentence ("this number... shows the trigger effect") no
    // longer honestly describes. This entry was rebuilt against the ACTUAL
    // new core_factual_points rather than patched to keep old prose next
    // to new claim_ids -- the failure mode a hardcoded bucket/index
    // template is otherwise prone to across independent re-synthesis runs.
    // Nothing here reflects a topic-specific bucket/classifier change;
    // classifyCoreFactualPoints() and resolveEditorialUnit() are unchanged
    // from the prior round.
    answer_summary_bucket: 'DEFINITION',

    // Opens with the mechanism itself (OTHER[1]: the anagen-to-telogen
    // shift plus its general trigger categories) followed immediately by
    // the normal-cycle background stat (TIMING) that gives it scale --
    // read together, before "why it matters", the same ordering principle
    // as before (ground the reader in the biology first).
    why_it_matters: {
      heading: 'How the shift happens',
      units: [
        { kind: 'framing', text: "This is the shift the rest of the overview builds around." },
        {
          kind: 'paraphrase', bucket: 'OTHER', index: 1,
          text: "What actually happens is that a larger-than-usual, synchronized group of follicles shifts from the growth (anagen) phase into the resting (telogen) phase all at once -- a shift researchers link to general trigger categories like inflammation, hormonal change, physical or emotional stress, nutritional deficiency, poor sleep, or certain medications.",
        },
        { kind: 'verbatim', bucket: 'TIMING' },
      ],
    },

    limitations_heading: 'What this information cannot tell you',

    // Second section carries what was previously "why it matters" --
    // the practitioner-relevance distinction, plus the illness/COVID
    // example, which now (post-narrowing) reports no specific numbers,
    // just the pattern itself.
    sections: [
      {
        // Distinct from the auto-generated top-level why_it_matters
        // block's own hardcoded section_id ('why-it-matters', set in
        // page-builder-draft.mjs) -- this is a second, later section, not
        // a duplicate of it.
        section_id: 'distinguishing-te',
        heading: 'Why the distinction matters',
        units: [
          { kind: 'framing', text: "That distinction is where a practitioner's judgment actually comes in." },
          {
            kind: 'paraphrase', bucket: 'PRACTITIONER_RELEVANCE',
            text: "Telling diffuse, temporary shedding apart from progressive, patterned hair loss matters for exactly this reason: reviews of cases labeled ‘chronic’ telogen effluvium have found that many likely represent early patterned hair loss or an ongoing trigger that hasn't been identified yet -- and biopsy studies in these cases have shown normal ratios of thick-to-thin hairs, unlike the pattern typically seen in progressive hair loss.",
          },
          {
            // Deliberately says "a global pandemic" rather than naming
            // "COVID-19" -- the digit in that proper noun would trip
            // page-builder-validator.mjs's UNSUPPORTED_NUMERIC_CLAIM rule
            // (any digit in a non-byte-identical unit is treated as an
            // unverified numeric claim), and a PARAPHRASE is exactly the
            // place to generalize wording, not introduce a new literal
            // token the cleared statement's own text supplies only inside
            // the VERBATIM-only numeric-fidelity contract.
            kind: 'paraphrase', bucket: 'OTHER', index: 0,
            text: "Illness episodes on a large scale, such as a global pandemic, show how a systemic trigger can be followed by a rise in reported telogen effluvium, though the exact biological mechanism connecting the two still isn't clear.",
          },
        ],
      },
    ],

    key_takeaways_buckets: ['DEFINITION', 'PRACTITIONER_RELEVANCE', 'TIMING'],
    key_takeaways_limit: 3,

    meta_description: 'A practitioner-oriented overview of telogen effluvium — its relationship to the hair cycle, typical patterns, and how it differs from progressive hair loss.',

    provenance_notes: {
      classifier_generalization_note:
        'The cleared definitional statement for this topic ("Telogen effluvium (TE) is a diffuse, temporary increase...") did not match the original DEFINITION pattern, which was tuned only to hair-cycle\'s phrasing -- fixed generically in classifyCoreFactualPoints() rather than special-cased per topic.',
      re_templating_note:
        'Rebuilt against a re-synthesized clearance (non-core vitamin-D/ferritin conflict excluded, see publication-page-intent.mjs) whose core_factual_points landed in genuinely different buckets/positions than the original synthesis -- confirms the classifier and editorial-unit mechanism are stable across independent re-synthesis runs, but that a hand-authored template must be re-verified against its actual bucket contents after any re-synthesis, not assumed to still line up.',
    },
  },
});

export function getPageBuilderTemplate(topicSlug) {
  const template = PAGE_BUILDER_TEMPLATES[topicSlug];
  if (!template) {
    throw new PageBuilderTemplateError(`No Page Builder presentation template registered for "${topicSlug}". Currently registered: ${Object.keys(PAGE_BUILDER_TEMPLATES).join(', ')} -- see docs/research/AIMT-Page-Builder-v1-Shadow.md.`);
  }
  return template;
}
