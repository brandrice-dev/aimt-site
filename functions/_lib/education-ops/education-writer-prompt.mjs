/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — Education Writer prompt
   ---------------------------------------------------------------
   Generalizes docs/brand/AIMT-EDUCATION-EDITORIAL-VOICE-v0.md's
   hand-authored VERBATIM/PARAPHRASE/FRAMING model into a model-authored
   writer. Input is restricted to EXACTLY the cleared, immutable page
   snapshot (fingerprint_input) plus the approved voice rules plus the
   page intent -- never the full/rejected research pool, never
   unverified claims, never Cadence or student data (see the
   originating task's explicit input restriction).
   ═══════════════════════════════════════════════════════════════ */

export const EDUCATION_WRITER_CONTRACT_VERSION = 'education-writer-v1';

const VOICE_RULES = [
  'Evidence -> Explanation -> Meaning -> Practitioner context: the same structural progression as the hair-cycle exemplar page, never a raw list of research statements.',
  'Clear before comprehensive -- teach meaning, not just facts.',
  'Professional without academic stiffness; confident but bounded; natural contractions are fine (don\'t, isn\'t, here\'s).',
  'Practitioner-facing implications only where the evidence itself actually supports them -- never manufacture a "so here\'s what to do" the evidence doesn\'t license.',
  'Concise teaching bridges -- one sentence, rarely two.',
  'No journal-abstract voice, no SEO keyword-stuffing, no generic AI-blog language.',
  'Let the evidence determine page structure and section headings -- never force a fixed template shape from a different topic onto this one.',
  'A FRAMING unit must be removable from the page without changing its scientific meaning -- it may orient, create rhythm, ask a question, or connect sections, but may NEVER introduce or summarize a biological fact, timing/duration, mechanism, causal relationship, prevalence/percentage, or diagnostic/treatment implication.',
  'Any digit-bearing evidence statement (a number, a percentage, a duration) MUST be rendered VERBATIM, byte-identical to its cleared statement text -- never paraphrased, never restated with different wording.',
  'A PARAPHRASE must inherit the REAL supporting_claim_ids of the exact cleared statement(s) it paraphrases -- never invent or hand-pick claim IDs, never strengthen certainty, never turn an association into a causal claim, never add a number the cleared statement does not itself contain.',
  'The scope_note and every limitations entry must be rendered VERBATIM, byte-identical to the cleared snapshot -- never softened, hidden, or creatively rewritten.',
  'Do not infer or invent inline paragraph-level citation numbers -- the governed clearance snapshot has no claim-to-source map; render the cleared Sources & References set as a distinct block instead.',
];

/**
 * @param {{
 *   intentPlan: object, clearedSnapshot: object, route: string, cluster: string,
 *   existingClusterPages: Array<{route:string, label:string}>
 * }} args
 */
export function buildWriterInstruction({ intentPlan, clearedSnapshot, route, cluster, existingClusterPages }) {
  return [
    `You are the AIMT Education Writer. Write ONE complete Education page as a structured Page Plan, following AIMT's approved editorial voice EXACTLY.`,
    ``,
    `VOICE RULES (non-negotiable):`,
    ...VOICE_RULES.map((r) => `- ${r}`),
    ``,
    `PAGE INTENT (scope -- do not exceed it):`,
    JSON.stringify(intentPlan, null, 2),
    ``,
    `ROUTE: ${route}   CLUSTER: ${cluster}`,
    `OTHER LIVE PAGES IN THIS CLUSTER (link to them where relevant via related_links; never duplicate their content):`,
    JSON.stringify(existingClusterPages, null, 2),
    ``,
    `THE CLEARED EVIDENCE SNAPSHOT -- this is the ONLY evidence you may use. Every core_factual_points/limitations statement below already passed AIMT's full verification, synthesis, and deterministic clearance process. You may not use any fact, number, or claim not present here:`,
    JSON.stringify(clearedSnapshot, null, 2),
    ``,
    `Produce a complete Page Plan: topic_slug, cluster, route, title, meta_description, h1, answer_summary (one VERBATIM or PARAPHRASE unit -- the page's opening definition/answer), sections (each with a section_id, a heading YOU choose based on what the evidence actually supports, and units), scope_note (byte-identical to the cleared scope_note), limitations (byte-identical VERBATIM units, one per cleared limitation -- never dropped, softened, or merged away), key_takeaways (3 VERBATIM units recapping the page's most important cleared statements), sources (the cleared source set, from the snapshot's citation_map), related_links (to the other live cluster pages plus the cluster hub and library home), and visual_recommendation (NONE/DIAGRAM/REFERENCE_PHOTOGRAPHY with a one-paragraph rationale -- a visual is warranted ONLY if it would teach something more clearly or quickly than prose; do not recommend decorative imagery).`,
    `Every unit's supporting_claim_ids must be the REAL claim_ids the cleared statement it derives from actually carries (visible in the snapshot's core_factual_points/limitations entries) -- never hand-invented, never borrowed from a different statement. FRAMING units must have empty supporting_claim_ids and empty source_statements.`,
  ].join('\n');
}
