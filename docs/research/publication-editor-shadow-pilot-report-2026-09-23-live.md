# AIMT Publication Editor v1 — Shadow-Mode Topic Readiness Report

Generated: 2026-09-23T02:48:49.414Z
Data source: LIVE Supabase production corpus (read-only SELECT via PostgREST, service-role key -- no writes issued)

**This is a shadow-mode / dry-run report.** Nothing in this document has changed any research_claims, research_sources, or research_public_pages row. `READY` / `NOT_READY` / `NEEDS_SYNTHESIS` / `HUMAN_REVIEW` below are this engine's own reporting labels -- they do not set, and are not the same as, AIMT_APPROVED, public_eligible, or published. `NEEDS_SYNTHESIS` is intended for the future AI Publication Editor (v2), not automatically a human task -- see docs/research/AIMT-Publication-Editor-v1.md.

## Summary

| READY | NOT_READY | NEEDS_SYNTHESIS | HUMAN_REVIEW |
|---|---|---|---|
| 0 | 0 | 6 | 0 |

## hair-loss

**Proposed SEO page concept:** Hair Loss: A Practitioner Education Overview

**Underlying research topic(s):** androgenetic-alopecia, telogen-effluvium, alopecia-areata _(constructed_multi_topic_umbrella)_

> "hair-loss" is not itself a value in CONTROLLED_TOPICS. Constructed as the union of the three controlled topics that are literally named hair-loss conditions (androgenetic-alopecia, telogen-effluvium, alopecia-areata). hair-cycle/hair-biology (general physiology, LOWER risk) are deliberately NOT folded in here -- they are their own concept (#6, hair-cycle) below -- so this umbrella is not diluted toward a lower risk tier than its condition-specific content actually warrants.

**Readiness status:** `NEEDS_SYNTHESIS`

**Risk tier:** `MODERATE`

**Evidence snapshot:**
- Total claims considered (any status, matching topic): 399
- Candidate CLAIM_VERIFIED-or-higher claims: 378
- Distinct supporting sources: 78 (need 2+)
- Evidence-type distribution: {"narrative_review":13,"professional_org":17,"meta_analysis":23,"systematic_review":10,"clinical_guideline":2,"rct":8,"other":1,"observational":2,"technical_report":2}
- Systematic-tier evidence present (systematic_review/meta_analysis/clinical_guideline/RCT): true
- Professional-consensus source present: true

**Conflict flags:** SAFETY_CONCLUSION_PRESENT, POTENTIAL_CONFLICT_REQUIRES_SYNTHESIS
**Missing evidence/context:** none

**Reasons:**
- androgenetic-alopecia: baseline MODERATE
- telogen-effluvium: baseline MODERATE
- alopecia-areata: baseline MODERATE
- At least one CLAIM_VERIFIED safety_conclusion claim is present; this LOWER/MODERATE topic needs semantic synthesis (exclude, include with scope framing, or escalate) before it can proceed -- not automatic human review.
- Verified finding claims disagree on effect direction (supports_effect vs no_effect); flagged for synthesis to determine whether they address different interventions/populations/questions or a genuine unresolved disagreement, not treated as a contradiction or an automatic human-review trigger.

**Path forward:**
- AI Publication Editor (v2) synthesis of the safety_conclusion claim(s): exclude, include with scope framing, or escalate -- see synthesis_packet.safety_claim_ids.
- AI Publication Editor (v2) synthesis reconciling verified findings that disagree on effect direction -- see synthesis_packet.finding_direction_detail for whether they address different interventions/populations/questions.
- A deterministic post-synthesis validator must confirm the synthesized output before this topic can move to an auto-clear state -- see docs/research/AIMT-Publication-Editor-v1.md "future auto-clear contract".

**Synthesis packet (for the future AI Publication Editor v2):**
- Safety claims to synthesize: 8
- supports_effect finding claims: 50
- no_effect finding claims: 10
- Limitation claims available to preserve: 72
- Distinct populations/scopes recorded on direction-conflicted claims: herbal alopecia interventions, activated PRP vs placebo, PRP alopecia efficacy endpoints, AGA conditioned media, AGA PRF, AGA EV/exosome therapy, male AGA, LPP/FFA emerging therapies, alopecia and dermatologic PBMT, LLLT combination AGA density, LLLT combination AGA diameter, AGA, AGA diameter, SSM AGA survey participants, AGA; dutasteride vs finasteride (review), Adults with alopecia areata (n=86), 90 healthy adults 18–55 years, rosemary-lavender (Rosmagain) arm, both rosemary oil arms
- Full packet (all claim/source IDs, citation metadata, post-synthesis validation rules) is in the JSON report only -- not expanded in this human summary.

---

## shedding-vs-hair-loss

**Proposed SEO page concept:** Shedding vs. Hair Loss: A Practitioner Differential Framing

**Underlying research topic(s):** telogen-effluvium, hair-cycle _(constructed_differential_framing)_

> "shedding-vs-hair-loss" is not a literal CONTROLLED_TOPICS value. Constructed conservatively from telogen-effluvium (the shedding-pattern condition) plus hair-cycle (the normal-shedding physiological baseline the differential depends on) -- a "shedding vs. hair loss" explainer is inherently a look-alike/differential-framing concept per the originating request's own MODERATE-risk examples. androgenetic-alopecia is intentionally NOT included, even though it is the other side of many real differentials in practice, so this concept's candidate evidence set stays exactly what a "shedding vs. hair loss" page is built from; a page that also wants to rule in/out androgenetic-alopecia should compose with concept #3 rather than this concept silently absorbing it.

**Readiness status:** `NEEDS_SYNTHESIS`

**Risk tier:** `MODERATE`

**Evidence snapshot:**
- Total claims considered (any status, matching topic): 183
- Candidate CLAIM_VERIFIED-or-higher claims: 164
- Distinct supporting sources: 35 (need 2+)
- Evidence-type distribution: {"narrative_review":17,"systematic_review":4,"professional_org":5,"observational":4,"meta_analysis":4,"technical_report":1}
- Systematic-tier evidence present (systematic_review/meta_analysis/clinical_guideline/RCT): true
- Professional-consensus source present: true

**Conflict flags:** SAFETY_CONCLUSION_PRESENT, POTENTIAL_CONFLICT_REQUIRES_SYNTHESIS
**Missing evidence/context:** none

**Reasons:**
- telogen-effluvium: baseline MODERATE
- hair-cycle: baseline LOWER
- At least one CLAIM_VERIFIED safety_conclusion claim is present; this LOWER/MODERATE topic needs semantic synthesis (exclude, include with scope framing, or escalate) before it can proceed -- not automatic human review.
- Verified finding claims disagree on effect direction (supports_effect vs no_effect); flagged for synthesis to determine whether they address different interventions/populations/questions or a genuine unresolved disagreement, not treated as a contradiction or an automatic human-review trigger.

**Path forward:**
- AI Publication Editor (v2) synthesis of the safety_conclusion claim(s): exclude, include with scope framing, or escalate -- see synthesis_packet.safety_claim_ids.
- AI Publication Editor (v2) synthesis reconciling verified findings that disagree on effect direction -- see synthesis_packet.finding_direction_detail for whether they address different interventions/populations/questions.
- A deterministic post-synthesis validator must confirm the synthesized output before this topic can move to an auto-clear state -- see docs/research/AIMT-Publication-Editor-v1.md "future auto-clear contract".

**Synthesis packet (for the future AI Publication Editor v2):**
- Safety claims to synthesize: 2
- supports_effect finding claims: 7
- no_effect finding claims: 1
- Limitation claims available to preserve: 27
- Distinct populations/scopes recorded on direction-conflicted claims: SSM AGA survey participants
- Full packet (all claim/source IDs, citation metadata, post-synthesis validation rules) is in the JSON report only -- not expanded in this human summary.

---

## androgenetic-alopecia

**Proposed SEO page concept:** Androgenetic Alopecia: A Practitioner Education Overview

**Underlying research topic(s):** androgenetic-alopecia _(direct)_

**Readiness status:** `NEEDS_SYNTHESIS`

**Risk tier:** `MODERATE`

**Evidence snapshot:**
- Total claims considered (any status, matching topic): 303
- Candidate CLAIM_VERIFIED-or-higher claims: 287
- Distinct supporting sources: 60 (need 2+)
- Evidence-type distribution: {"professional_org":12,"meta_analysis":21,"systematic_review":8,"narrative_review":9,"rct":5,"observational":2,"technical_report":2,"clinical_guideline":1}
- Systematic-tier evidence present (systematic_review/meta_analysis/clinical_guideline/RCT): true
- Professional-consensus source present: true

**Conflict flags:** SAFETY_CONCLUSION_PRESENT, POTENTIAL_CONFLICT_REQUIRES_SYNTHESIS
**Missing evidence/context:** none

**Reasons:**
- androgenetic-alopecia: baseline MODERATE
- At least one CLAIM_VERIFIED safety_conclusion claim is present; this LOWER/MODERATE topic needs semantic synthesis (exclude, include with scope framing, or escalate) before it can proceed -- not automatic human review.
- Verified finding claims disagree on effect direction (supports_effect vs no_effect); flagged for synthesis to determine whether they address different interventions/populations/questions or a genuine unresolved disagreement, not treated as a contradiction or an automatic human-review trigger.

**Path forward:**
- AI Publication Editor (v2) synthesis of the safety_conclusion claim(s): exclude, include with scope framing, or escalate -- see synthesis_packet.safety_claim_ids.
- AI Publication Editor (v2) synthesis reconciling verified findings that disagree on effect direction -- see synthesis_packet.finding_direction_detail for whether they address different interventions/populations/questions.
- A deterministic post-synthesis validator must confirm the synthesized output before this topic can move to an auto-clear state -- see docs/research/AIMT-Publication-Editor-v1.md "future auto-clear contract".

**Synthesis packet (for the future AI Publication Editor v2):**
- Safety claims to synthesize: 8
- supports_effect finding claims: 43
- no_effect finding claims: 9
- Limitation claims available to preserve: 54
- Distinct populations/scopes recorded on direction-conflicted claims: herbal alopecia interventions, activated PRP vs placebo, PRP alopecia efficacy endpoints, AGA conditioned media, AGA PRF, AGA EV/exosome therapy, male AGA, LPP/FFA emerging therapies, alopecia and dermatologic PBMT, LLLT combination AGA density, LLLT combination AGA diameter, AGA, AGA diameter, SSM AGA survey participants, AGA; dutasteride vs finasteride (review), 90 healthy adults 18–55 years, rosemary-lavender (Rosmagain) arm, both rosemary oil arms
- Full packet (all claim/source IDs, citation metadata, post-synthesis validation rules) is in the JSON report only -- not expanded in this human summary.

---

## telogen-effluvium

**Proposed SEO page concept:** Telogen Effluvium: A Practitioner Education Overview

**Underlying research topic(s):** telogen-effluvium _(direct)_

**Readiness status:** `NEEDS_SYNTHESIS`

**Risk tier:** `MODERATE`

**Evidence snapshot:**
- Total claims considered (any status, matching topic): 72
- Candidate CLAIM_VERIFIED-or-higher claims: 67
- Distinct supporting sources: 14 (need 2+)
- Evidence-type distribution: {"narrative_review":2,"professional_org":5,"systematic_review":3,"observational":1,"meta_analysis":3}
- Systematic-tier evidence present (systematic_review/meta_analysis/clinical_guideline/RCT): true
- Professional-consensus source present: true

**Conflict flags:** SAFETY_CONCLUSION_PRESENT
**Missing evidence/context:** none

**Reasons:**
- telogen-effluvium: baseline MODERATE
- At least one CLAIM_VERIFIED safety_conclusion claim is present; this LOWER/MODERATE topic needs semantic synthesis (exclude, include with scope framing, or escalate) before it can proceed -- not automatic human review.

**Path forward:**
- AI Publication Editor (v2) synthesis of the safety_conclusion claim(s): exclude, include with scope framing, or escalate -- see synthesis_packet.safety_claim_ids.
- A deterministic post-synthesis validator must confirm the synthesized output before this topic can move to an auto-clear state -- see docs/research/AIMT-Publication-Editor-v1.md "future auto-clear contract".

**Synthesis packet (for the future AI Publication Editor v2):**
- Safety claims to synthesize: 2
- supports_effect finding claims: 1
- no_effect finding claims: 0
- Limitation claims available to preserve: 14
- Distinct populations/scopes recorded on direction-conflicted claims: none
- Full packet (all claim/source IDs, citation metadata, post-synthesis validation rules) is in the JSON report only -- not expanded in this human summary.

---

## alopecia-areata

**Proposed SEO page concept:** Alopecia Areata: A Practitioner Education Overview

**Underlying research topic(s):** alopecia-areata _(direct)_

**Readiness status:** `NEEDS_SYNTHESIS`

**Risk tier:** `MODERATE`

**Evidence snapshot:**
- Total claims considered (any status, matching topic): 113
- Candidate CLAIM_VERIFIED-or-higher claims: 111
- Distinct supporting sources: 23 (need 2+)
- Evidence-type distribution: {"narrative_review":7,"professional_org":7,"meta_analysis":3,"systematic_review":1,"clinical_guideline":1,"other":1,"rct":3}
- Systematic-tier evidence present (systematic_review/meta_analysis/clinical_guideline/RCT): true
- Professional-consensus source present: true

**Conflict flags:** SAFETY_CONCLUSION_PRESENT, POTENTIAL_CONFLICT_REQUIRES_SYNTHESIS
**Missing evidence/context:** none

**Reasons:**
- alopecia-areata: baseline MODERATE
- At least one CLAIM_VERIFIED safety_conclusion claim is present; this LOWER/MODERATE topic needs semantic synthesis (exclude, include with scope framing, or escalate) before it can proceed -- not automatic human review.
- Verified finding claims disagree on effect direction (supports_effect vs no_effect); flagged for synthesis to determine whether they address different interventions/populations/questions or a genuine unresolved disagreement, not treated as a contradiction or an automatic human-review trigger.

**Path forward:**
- AI Publication Editor (v2) synthesis of the safety_conclusion claim(s): exclude, include with scope framing, or escalate -- see synthesis_packet.safety_claim_ids.
- AI Publication Editor (v2) synthesis reconciling verified findings that disagree on effect direction -- see synthesis_packet.finding_direction_detail for whether they address different interventions/populations/questions.
- A deterministic post-synthesis validator must confirm the synthesized output before this topic can move to an auto-clear state -- see docs/research/AIMT-Publication-Editor-v1.md "future auto-clear contract".

**Synthesis packet (for the future AI Publication Editor v2):**
- Safety claims to synthesize: 2
- supports_effect finding claims: 12
- no_effect finding claims: 1
- Limitation claims available to preserve: 20
- Distinct populations/scopes recorded on direction-conflicted claims: herbal alopecia interventions, activated PRP vs placebo, PRP alopecia efficacy endpoints, alopecia and dermatologic PBMT, Adults with alopecia areata (n=86)
- Full packet (all claim/source IDs, citation metadata, post-synthesis validation rules) is in the JSON report only -- not expanded in this human summary.

---

## hair-cycle

**Proposed SEO page concept:** The Hair Growth Cycle: A Practitioner Education Overview

**Underlying research topic(s):** hair-cycle _(direct)_

**Readiness status:** `NEEDS_SYNTHESIS`

**Risk tier:** `LOWER`

**Evidence snapshot:**
- Total claims considered (any status, matching topic): 146
- Candidate CLAIM_VERIFIED-or-higher claims: 128
- Distinct supporting sources: 27 (need 2+)
- Evidence-type distribution: {"narrative_review":16,"systematic_review":3,"observational":4,"professional_org":1,"technical_report":1,"meta_analysis":2}
- Systematic-tier evidence present (systematic_review/meta_analysis/clinical_guideline/RCT): true
- Professional-consensus source present: true

**Conflict flags:** POTENTIAL_CONFLICT_REQUIRES_SYNTHESIS
**Missing evidence/context:** none

**Reasons:**
- hair-cycle: baseline LOWER
- Verified finding claims disagree on effect direction (supports_effect vs no_effect); flagged for synthesis to determine whether they address different interventions/populations/questions or a genuine unresolved disagreement, not treated as a contradiction or an automatic human-review trigger.

**Path forward:**
- AI Publication Editor (v2) synthesis reconciling verified findings that disagree on effect direction -- see synthesis_packet.finding_direction_detail for whether they address different interventions/populations/questions.
- A deterministic post-synthesis validator must confirm the synthesized output before this topic can move to an auto-clear state -- see docs/research/AIMT-Publication-Editor-v1.md "future auto-clear contract".

**Synthesis packet (for the future AI Publication Editor v2):**
- Safety claims to synthesize: 0
- supports_effect finding claims: 6
- no_effect finding claims: 1
- Limitation claims available to preserve: 21
- Distinct populations/scopes recorded on direction-conflicted claims: SSM AGA survey participants
- Full packet (all claim/source IDs, citation metadata, post-synthesis validation rules) is in the JSON report only -- not expanded in this human summary.

---
