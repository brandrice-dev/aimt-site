# Phase 2B real-packet compatibility gate

## Scope and result

Read-only sample of 10 of 19 inbox packets at private feed commit `559fa281a7444f904b7965d876ec483ff4a32916`. The sample includes two original/retested pairs, early and recent deposits, multiple-source claims, packet-level contradictions, repeated publications and already `CLAIM_VERIFIED` claims. Early/recent packets share the checked-in schema; no distinct schema-version field was found. Publication date precision varies, and newer verification prose records more explicit lineage/access limitations.

All 10 pass the existing AIMT packet validator and structural checks against the feed schema's required fields, types, enums, extra-field restrictions and date-time parsing. This is format compatibility, not primary-source verification. The test context supplies explicit hypothetical new submission heads and an empty library; it makes no claim about live database identities or approvals. No database/API ingestion or primary-source retrieval was executed.

There are 130 claim occurrences, 153 source occurrences, 100 multiple-support claims, 86 `CLAIM_VERIFIED` claims and 428 declared support/contradiction edges. Of 126 DOI-bearing source occurrences, 98 DOI identities are distinct and 26 recur. Repeated DOI reports are bibliography matches, not proof of independent study families. Counts include repeat packets and are not estimates for the entire feed or distinct studies.

**Complete plans: 0/10; complete claim revisions: 0/130.** Nine packets are incomplete; one is rejected for an unused bibliography source. Every result has empty append operations. All 130 private candidate snapshots pass the authoritative contract's round-trip verification; exact claim text, original contradiction descriptors and every declared support/contradiction endpoint survive. These are unresolved review snapshots, not scientifically complete revisions.

Private filenames, batch/source/claim IDs, topics, descriptions and packet payloads stay outside this public repository. The local private manifest identifies the exact selected files and holds before/after traces. Only aggregate counts and fictional regression fixtures are checked in.

## Missing information and frequency

| Requirement | Frequency in sample | Interpretation |
| --- | --- | --- |
| Primary evidence text or evidence digest | 153/153 source occurrences; 10/10 packets | Current planner completeness blocker; bibliography/prose is not primary evidence |
| Explicit study-family identity | 153/153 source occurrences; 10/10 packets | Current blocker; no independent corroboration count may be inferred |
| Structured scientific scope | 130/130 claim occurrences; all 428 declared edges | Current blocker; scope described in prose must be extracted and checked |
| Recorded evidence locator | 130/130 claim occurrences; all 428 declared edges | Current blocker; a source URL alone does not locate a reviewed span |
| Explicit descriptor-to-typed-edge dispositions | 32/32 descriptors, 65/65 descriptor/claim associations, 9/10 packets | Corrected planner returns explicit unresolved evidence |
| Unused bibliography source | 1/153 source occurrences; 1/10 packets | Existing rejection remains; no relation is invented to make it pass |
| Structured retrieval date/version, access/rights, correction and retraction state | 153/153 source occurrences for each field group | Additional persistence/clearance enrichment requirements; absence was not silently upgraded into known access or correction status |

All sources already have URLs; 126/153 also have DOIs. All 153 sources have credibility notes and all 130 claims have notes. Those notes often discuss primary/secondary access, shared evidence, limitations and scope, but are not structured evidence payloads or verified family assignments. Ninety-eight source occurrences use reduced publication dates; the planner preserves those original strings rather than inventing day precision.

The raw strict feed schema permits no source evidence, study-family, typed scope/locator or edge fields. Adding those directly to deposited packets would violate `additionalProperties:false`. A separately validated enrichment artifact and reviewed mapping into the planner's internal view are required; do not weaken the existing schema to accept fabricated values.

## Confirmed defect and narrow correction

Before correction, packet descriptors survived in `content.body_sections.recorded_contradictions` and narrative markdown but did not require typed scientific dispositions. Of 65 descriptor/claim associations, 45 had no listed involved source in that claim's contrary array, and 39 involved sources missing from that claim's declared graph. These categories overlap. Some descriptions concern qualifications or incomparable scopes, so involved sources must not automatically become `contradicts` edges.

Planner v2 requires explicit `provenance.packet_contradiction_indices` on typed source edges. Each descriptor/focal-claim association must have explicit involved-source coverage and a scoped `contradicts` or `qualifies` disposition. Multi-claim descriptors are not expanded into inferred relationships. If a source's relevance to a focal claim is ambiguous, the packet remains unresolved; this conservative API has no automated exclusion/supersession shortcut.

Without bindings, `UNRESOLVED_PACKET_CONTRADICTION` retains the complete original descriptor and missing endpoint identities with empty append operations. With explicit bindings, exact descriptions are bound into the edge's scientific qualifications alongside the original qualification value; no description becomes a fabricated primary-source quotation. Wrong indices/claims/sources reject as `INVALID_CONTRADICTION_BINDING`. A change to bound description text changes the scientific graph digest. Existing adapter batches containing only the recorded-contradictions narrative return `UNRESOLVED_LEGACY_PACKET_CONTRADICTION`; they cannot bypass the packet-first gate.

All 65 real descriptor/claim associations now have explicit unresolved records, including the otherwise-rejected packet. Rejected/incomplete results preserve the detached original input and already-discovered completeness reasons. The scientific contract, existing adapter/importer, database schema, publication pipeline and authorization rules are unchanged.

## Enrichment through existing workflow

| Work class | Required output and routing |
| --- | --- |
| Already present but not mapped | Preserve existing IDs, notes, source URLs/DOIs, descriptor text, named source involvement, original date precision and verification provenance. Extract proposed scope/lineage/access details from prose, keeping uncertainty; do not treat notes as retrieved primary text. |
| Automated primary-source retrieval | Reuse the existing research worker to retrieve identified primary material or authorized held library evidence. Retain exact evidence/digest, document version/retrieval provenance, access limits, correction/retraction checks and claim-specific locators. Record unavailable/abstract-only evidence explicitly. |
| Stronger AI verification | Require evidence-grounded extraction of support/contradiction/qualification direction, population/intervention/outcome/time/setting or jurisdiction, exact spans and limitations. Verify primary study/cohort lineage; distinguish synthesis/repetition from independent datasets. Emit explicit descriptor bindings and checker disagreement, without changing institutional statuses. |
| Qualified human review | Escalate unresolved substantive contradictions, safety/clinical implications, source correction/retraction consequences, ambiguous primary lineage and consequential policy/scope disputes. Route to the approved scientific authority; institutional approval remains its separate authorized process. Routine acquisition/extraction does not require founder review of each record. |

Reuse existing research-gap coordination for genuine evidence acquisition, existing private packet delivery and the canonical ingestion boundary. Preserve quiet aggregate-only public reporting. Scientific disputes must not be relabeled as routine missing-evidence gaps. The future sidecar must retain source report identity, verified underlying-study mappings, full typed graph and original descriptor lineage; validate it before combining it with the unchanged raw packet. No new agent, schedule, model call or enrichment activation was implemented.

## Tests and readiness

Node v20.20.2, empty credential environment and existing external fetch/socket guards:

- 36 planner tests pass, including 9 new fictional structural regressions.
- Planner, contract and relevant research suite: 80 Node-runner entries pass; no failures/skips.
- Existing CI selector: 466 pass, 0 fail, 2 documented live skips; exclusions unchanged.
- Unfiltered suite: 466 pass, 3 inherited media/historical-pilot failures, 2 skips. Those are unchanged from the original PR #74 validation; the full suite is not green.
- Private real-packet run: 10 originals tested, 130 exact contract round trips, 428 declared relationships checked, 65 unresolved descriptor associations retained, no append operations.

**The real-evidence readiness gate is not passed.** The planner safely refuses incomplete actual feed input after the correction, but no sampled record can yet demonstrate an evidence-complete real submission. Before authorizing transactional persistence for real research, review the enrichment sidecar/mapping, produce evidence-complete real examples without weakening requirements, resolve bibliography-only records, and re-run this gate. Atomic CAS/RLS, immutable permissions, authenticated approvals and correction dependency handling remain the previously documented persistence prerequisites. No transactional implementation was started.
