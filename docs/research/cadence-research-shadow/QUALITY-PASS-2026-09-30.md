# Ask Cadence × Research Library — shadow quality pass (2026-09-30)

Branch `feature/cadence-research-shadow` · **shadow only**. Live Ask Cadence
(`functions/api/cadence/ask.js`, `functions/_lib/cadence/ask-cadence.mjs`) and every checkpoint,
certification, progress, auth and payment path are byte-identical to `main`. No research reaches a
student, a model prompt, or a transcript.

**Verdict: NOT READY for activation.** The safety properties hold everywhere. But answer-usefulness
on the untouched hold-out is **72%**, below the 85% target, and has only improved round by round.

## 1. Live Research Library vs the Sep 20 export

A read-only live snapshot was compared field by field with the local export. It used
`scripts/cadence-research-shadow/live-snapshot.mjs`, with GETs only, through
`scripts/cadence-research-shadow/read-only-fetch.mjs`.

| | Export 2026-09-20 | Live 2026-09-30 |
|---|---|---|
| Claims / sources | 1,081 / 219 | 1,081 / 219 |
| Claims only in live / only in export | — | 0 / 0 |
| Changed text, verification status, use status, review, topics or direction | — | 0 on every field |
| Import date of every row | — | 2026-09-21 |
| Verified claims (CLAIM_VERIFIED+) | 992 | 992 (0 AIMT_APPROVED) |

**The live library is the Sep 20 export.** No daily ingestion has landed since the first import.
There is no live-only evidence, and no gap closed:

| Gap | Governed claims mentioning it (live) |
|---|---|
| Trichodynia / scalp dysesthesia / "sensitive scalp" | 0 / 0 / 0 |
| Contact dermatitis | 0 (irritation and sensitization come only from CIR/SCCS ingredient reports) |
| Ferritin | 1 (TE-vs-controls meta-analysis); iron: 2 practice notes |
| Biotin | 1, about the microbiome and irrelevant to supplementation |
| Practitioner-facing psoriasis (massage, Koebner, service) | 0; psoriasis evidence is all drug treatment or classification |
| Traction | 4, about minoxidil treatment, not causation |

**Live vs export retrieval differences:** negligible. Live Postgres `websearch_to_tsquery` selected
134/143 dev claims, against 137/144 with the offline stand-in. The offline approximation is sound.

## 2. What changed

| Area | Change |
|---|---|
| Vocabulary | New `functions/_lib/cadence/research-lexicon.mjs`: pure data with no I/O and no imports. It holds 33 concepts with roles (subject, treatment, population hard/soft, outcome), 13 question intents, 10 claim facets and the intent→facet map. Mappings are server-controlled, and student text never reaches the database. |
| Query planning | Longest-match anchoring: each span keeps its most specific synonym group; "X or Y" alternatives and adjacent same-concept words merge into one focus; "besides X" excludes X. **One parallel query per focus unit (max 3)**: a single OR query truncated at 100 rows by recency was losing rare-plus-common pairs such as ketoconazole + seborrheic. Population and outcome terms are never searched on their own. |
| Answer-usefulness gate | A claim must pass everything below, and **nothing** is returned rather than topical noise (`gate: no_answer_useful_evidence`). |
| Ranking | Focus coverage × 4; satisfied intents × 2.5; IDF-weighted overlap with the question over the gated pool; specificity and statistics; evidence type and source role (with safety and practice bonuses); penalties for enumerations and off-question treatment. `AIMT_APPROVED` is only a +0.25 tiebreak, and a test proves a more relevant CLAIM_VERIFIED claim outranks a less relevant AIMT_APPROVED one. |
| Diversity | Every named alternative ("vitamin D *or* iron") is represented when evidence exists. Women-specific evidence is preferred when ≥2 such claims exist. Mixed-evidence preservation now uses gated on-question claims only. |

The answer-usefulness gate checks five things:
1. **Focus coverage.** Every compared subject; all subjects up to 3; one subject plus the named context (e.g. "…in a head spa"); hard population qualifiers such as pregnancy or "healthy scalps"; soft qualifiers such as women, where men-only claims are excluded.
2. **Not methods- or scope-only.**
3. **Intent match.** Crux intents (recurrence, parameter) are mandatory.
4. **No off-question treatment.** Claims about drugs, trial arms or unnamed interventions are dropped unless the student asked about treatment or efficacy.
5. **Governed-topic outcome coverage** applies only to claims about a named intervention.

Safety boundaries are unchanged and re-tested:
- `CLAIM_VERIFIED` minimum
- use-status and reviewer-unsupported exclusions
- cap of 5, hard maximum 6, 2 per source
- duplicate suppression
- checkpoint-open and Module 12 fail-closed rules
- no-throw behavior, with all-or-nothing on multi-query failure

## 3. Evaluation design (120 cases)

- **Dev set, 92 cases:** the 52 original, the 12 former v1 hold-out, and 28 new. Development data.
- **Hold-out v2, 28 cases:** frozen and committed (`11be2e5`) before any v2 change. Scored once after round 1 (`34cc147`, the exact code scored), then reviewed, so it became development data.
- **Hold-out v3, 24 cases:** frozen and committed (`2b56582`) before round 2. Scored once, never tuned against.
- **Metrics:**
  - Strict **answer-usefulness**: every label regex must match, and every hold-out claim was also adjudicated by hand.
  - **Coverage**: answerable questions that got ≥1 useful claim. Answerable means the whole-library oracle has a useful claim.
  - **Correct abstention**: unanswerable questions that got nothing.
  - Decision accuracy.

Regex labels are noisy: "sore" matches "sponsored", "infect" matches "disinfected". Dev labels were corrected when an oracle hit was clearly not useful. Hold-out labels were never edited; hand adjudication is reported alongside.

## 4. Results (live, read-only)

| Set | Decision | Usefulness (auto) | Usefulness (hand) | Coverage | Correct abstention |
|---|---|---|---|---|---|
| Dev, v1 code (baseline) | 94% | 44% (109/248) | — | 66% of 53 | 43% of 7 |
| Dev, final | **100%** | **95% (136/143)** | — | **93% of 45** | **100% of 15** |
| Hold-out v2, v1 code | 85% | 55% (43/78) | — | 79% of 19 | 50% of 2 |
| Hold-out v2, round 1 (untouched when scored) | 100% | 76% (26/34) | **59% (20/34)** | 67% (10/15, hand) | 86% (6/7, hand) |
| **Hold-out v3, round 2 (untouched)** | **96% (22/23)** | 74% (35/47) | **72% (34/47)** | **78% (14/18, hand)** | 100% (1/1) |

The v2 hold-out after round 2 shows 100% auto usefulness, but it is development data by then and is not
evidence of generalization.

Targets on the untouched hold-out (v3):

| Target | Result |
|---|---|
| ≥90% decision correctness | ✅ 96% |
| ≥85% useful claims | ❌ 72% |
| Zero disallowed claims | ✅ every selected claim CLAIM_VERIFIED |
| Zero checkpoint bypasses | ✅ 0; checkpoint-open and Module 12 never fetch |
| Zero unsafe high-stakes authority changes | ✅ the layer only flags high stakes; it never diagnoses or decides |

**The coverage/precision trade-off is not gamed by abstaining.** The zero-result rate rose from 8% to
about 30% on dev. But dev coverage rose from 66% to 93%, and correct abstention rose from 43% to 100%.
v2 excludes more noise; it does not simply return less.

### Excellent retrieval (hold-out v3, untouched)
- *"Should I tell my pregnant client to stop using minoxidil?"* Three precaution claims: avoid in pregnancy and breastfeeding, caution with oral use while lactating, and topical acceptable once breastfeeding is established.
- *"Is there a link between low ferritin and telogen effluvium?"* Exactly the TE-vs-controls ferritin meta-analysis (SMD −0.57).
- *"Is tea tree oil safe at the concentrations used in shampoos?"* SCCS 2% limit, CIR safe conclusion, oxidized-oil sensitizer caveat, and "moderate skin sensitiser". The disagreement is kept.
- *"Which microbes are linked to seborrheic dermatitis?"* Five on-point microbiome claims.
- *"Is there evidence that pumpkin seed oil helps with hair growth?"* The RCT result (+40% vs +10% hair count).

### Intentional abstention
The library genuinely lacks the evidence for these, and nothing was returned:
- trichodynia and dysesthesia (v1 returned PRP pain and TE claims here);
- a tender scalp during massage (v1 returned massage-benefit claims);
- a head spa during a psoriasis flare, and massaging over plaques;
- chemotherapy regrowth;
- scalp massage for dandruff;
- biotin dosing;
- tight ponytails as a cause of hair loss.

### Remaining bad retrieval (hold-out v3)
- *"What topical treatments does the evidence support for scalp psoriasis?"* **0/5 useful.** It returned biologic network meta-analyses and a severity definition, and missed the topical corticosteroid and calcipotriene guideline claims. Qualifiers like *topical vs systemic* aren't modeled.
- *"Is PRP more effective for women or men…?"* 0/2. It returned generic PRP efficacy. The sex comparison isn't modeled, and the "pattern hair loss" requirement excluded the women-specific PRP meta-analysis.
- *"Did the rosemary trial report fewer side effects than minoxidil?"* Missed: "itching" isn't recognized as an adverse effect.
- *"Shedding after surgery or illness"*: 3/5. It included a ferritin claim and a study-quality note.
- *"…red patch with pus … fever … what antibiotic?"* No retrieval, because "pus" and "infection" aren't in the lexicon. Cadence would simply answer as today.
- "7 articles included" design statements still pass the methods-only filter.

### Conflicting evidence
Mixed direction survives where it exists: PRP (positive meta-analyses vs "not significant vs placebo"), massage (positive surveys vs sample-size and isolation caveats), and the tea tree safety conclusions vs sensitizer findings. `evidence_profile.mixed_in_selection` is true for all three dev mixed cases. No hold-out question had genuinely conflicting evidence in the library.

## 5. Performance (live, 303 retrievals incl. 3× repeats)

| Set | Samples | Median | p95 | Max | Timeouts | Errors | Zero-result rate | Avg claims when returned |
|---|---|---|---|---|---|---|---|---|
| Dev | 183 | 61 ms | 84 ms | 254 ms | 0 | 0 | 30% | 3.3 |
| Hold-out v2 | 66 | 56 ms | 94 ms | 143 ms | 0 | 0 | 27% | 2.0 |
| Hold-out v3 | 54 | 59 ms | 110 ms | 167 ms | 0 | 0 | 11% | 2.9 |
| v1 baseline (dev) | 180 | 63 ms | 89 ms | 352 ms | 0 | 0 | 8% | — |

Parallel per-unit queries did not add latency. Selection is sub-millisecond, and the 2.5 s timeout was never approached.

## 6. Why still not ready, and the recommended next step

Each deterministic round fixes what it finds: dev went from 44% to 95%, and fresh hold-outs from 55% to 59% to 72%. Even so, about a quarter of fresh questions expose a new phrasing gap (qualifiers, adverse-effect vocabulary, new intents). That is diminishing returns for hand-built rules. The library gaps above also cap coverage no matter what retrieval does.

Recommended before any activation:
1. **Library coverage** via the Research Gap loop: scalp dysesthesia/trichodynia, contact dermatitis from hair products, practitioner-facing psoriasis, traction causation, biotin, and postpartum/illness shedding.
2. **An offline-only LLM relevance-judge experiment.** Deterministic retrieval stays as the candidate generator and trust gate; the model only re-ranks or filters the ≤15 gated candidates. It would be measured on a new frozen hold-out v4 against latency and cost. Not run here: it needs an owner decision on which API key and budget to use.
3. A new frozen hold-out before any further tuning. v2 and v3 are now development data.
