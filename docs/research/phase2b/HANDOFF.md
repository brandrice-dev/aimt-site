# AIMT Phase 2B implementation handoff

October 10, 2026. This handoff carries the accepted Phase 2A design forward. It authorizes no runtime activation, migration, deployment, production setting change, new scheduled workflow or scientific standard change. Phase 2A runtime changes remain confined to price validation, failure reporting, required ingestion operations and deterministic test fixtures.

## Governing requirements

The [R04 and R05 specifications](R04-R05-SPECIFICATIONS.md) define immutable claim/source revisions, complete supporting and contradicting evidence, concurrent updates, historical approval records and compatibility with the existing research library. The following clearance requirements supplement those specifications and govern the next package:

- Scientific claim and source content must have immutable, versioned identities. Changes create a new pending revision; old approvals, source evidence and scientific qualifications remain reproducible.
- Preserve every supporting, contradicting and qualifying relationship from the original packet through ingestion, retrieval, synthesis, reconciliation, validation and clearance fingerprints. Retain scoped contradictions and limitations, not just a primary source reference.
- Automated evidence clearance is a distinct, policy-controlled state, provisionally named `EVIDENCE_CLEARED`. It binds the exact claim/source/graph digests, policy and checker versions, permissible use, risk tier, provenance, expiration and withdrawal conditions. It is neither a scientific-content overwrite nor a human approval event.
- A cleared revision must never automatically become human `AIMT_APPROVED`. No status copy, ranked-status shortcut, prompt instruction, model output or retry may cross that boundary. Current human institutional approval and public scientific standards stay unchanged until separately authorized policy adoption.
- Routine evidence processing must not require the owner to individually inspect thousands of claims. A scientifically approved policy can allow bounded routine clearance with auditable sampling and validation. Human institutional approval can use reviewed bundles where the existing authority permits it; this is not permission to mass-promote individual statuses.
- Escalate scientifically consequential exceptions with retained evidence and reason codes: unresolved contradictions, safety or clinical implications, material source corrections/retractions, scope changes, uncertain extraction/access, checker disagreement, policy mismatch and revision drift. Route to a named qualified scientific authority under an approved policy, not automatically to the owner for every ordinary item.
- Preserve stable logical source/claim IDs, legacy primary source fields, historical imports and unknown historical approval details. Extend the existing research library and pipeline; do not create a replacement database or invent legacy authorizations.

## Clearance and approval event separation

Future clearance records must be append-only decisions over an immutable revision, recording decision ID, digests, policy version, checker identity/version, reason codes, allowed purposes, validity period and review/audit lineage. A correction/withdrawal appends an event and invalidates dependent use according to policy; it does not alter the original scientific payload or decision history.

Future human approval records remain independently authorized approval events. Evidence clearance can supply a reviewed evidence package to a human approver or permitted bundle review, but does not write `AIMT_APPROVED`. Tests must prove that importer/model/clearance credentials cannot create human approval events. Query consumers must check the requested purpose and the actual authorization type rather than treating clearance as a higher rank in the existing verification ladder.

Before any rollout, the scientific lead and owner must approve the routine-clearance policy, escalation thresholds, audit sampling and authority assignments. Proposals in these documents do not change current published rules or activation settings.

## Exact first implementation task

Implement a pure, versioned scientific revision and evidence graph contract in `functions/_lib/research/scientific-revision-contract.mjs`, with synthetic round-trip fixtures in `tests/scientific-revision-contract.test.mjs`.

Inputs are existing validated source/claim rows and legacy research packets, including the adapter's supporting/contradicting arrays and scientific extras. Outputs are canonical immutable source/claim revision payloads, typed complete evidence edges, deterministic SHA-256 digests and explicit validation errors. Use Web Crypto and existing zero-dependency architecture. Preserve logical IDs and primary source compatibility; classify operational provenance separately from scientific identity. Define clearance and human approval as separate decision contracts without writing either status.

Acceptance requires:

1. Identical scientific content produces the same versioned digest regardless of irrelevant object-key/edge ordering; changed text, negation, numeric units, source revision, scope, locator, limitation or contradiction changes the digest.
2. A fixture with three supports, two contradictions, a scoped qualification and duplicate study-family references retains every distinct edge and limitation. Duplicate reports of one study do not become independent corroboration.
3. Legacy single-source packets remain compatible. Missing endpoints, unsupported scientific fields and ambiguous evidence fail explicitly rather than silently losing relationships.
4. Automated clearance and human approval have different contracts and identities. A cleared input does not emit an `AIMT_APPROVED` claim or approval event; a content revision cannot inherit an old approval.
5. The module has no database writes, model calls, approval-writer changes, migration, schedule, publication or Cadence activation. Its immutable contract and fixtures are reviewed before atomic persistence/RLS implementation begins.

After that contract review, a separately authorized staging package implements transactional revision submission, concurrency/approval locks, decision permissions and historical backfill described in the specifications. Production migrations and policy activation require a further explicit release decision.

## Creative Intelligence continuity

Retain [the existing integration plan](INTELLIGENCE-INTEGRATION.md). Scientific Intelligence + Professional Demand + Consumer Demand + Innovation Intelligence feed the Opportunity Engine and Education Products. Creative Intelligence remains a separate performance input.

Expand the current Packaging Mechanics role with creator-relative outliers, first-three-second hook analysis, the Top 20 Hook Bank, original AIMT adaptations and performance attribution. Reuse existing creative IDs, growth reporting and publication/opportunity interfaces. No duplicate agent, database, content pipeline or scheduled workflow is part of this handoff. Creative performance cannot grant scientific clearance or human institutional approval.

## Release and access dependencies

R04/R05 runtime defects remain unresolved after Phase 2A. Before storage implementation, inventory actual approval writers, service-role bypasses, deployed schema/RLS, legacy approval records and scientific authority. R11 still needs effective candidate-head CI/protection enforcement. Phase 2A mocked/local tests do not verify production Stripe bindings, live entitlements, database grants, Cloudflare deployment or scientific policy adoption.
