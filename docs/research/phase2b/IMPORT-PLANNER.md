# Phase 2B revision-aware import planner

## Result and dependency

`functions/_lib/research/revision-import-planner.mjs` is a pure, unwired planner between the existing packet/import schema and the immutable scientific contract. It imports the existing validators, packet adapter and Phase 2B contract; it performs no I/O. Scientific serialization, revisions, graph digests, edge identities and study-family counting use the contract unchanged. A separate canonical SHA-256 key identifies operational observations, not scientific authorization.

Preflight confirmed both upstream PRs are open, draft and unmerged:

- PR #72: `codex/aimt-phase2a-reliability`, exact head `f3c90828a432242701ea15304ea172c4ff5600fc`, targets `main`.
- PR #73: `codex/aimt-phase2b-evidence-contract`, exact head `b5a212641a603fa9c14857a4ad7a4456af628c50`, targets #72's branch.

Development uses isolated branch `codex/aimt-phase2b-import-planner`, based on #73's exact head. The new draft targets #73's branch. Neither upstream PR is modified.

## API and caller obligations

```js
const plan = await planResearchImport({
  batch: { batch_id: 'synthetic-1', sources: sourceRows, claims: claimRows },
  // Alternatively packet: an existing validatePacket-compatible research packet.
  library: {
    sources: existingSourceRows,
    claims: existingClaimRows,
    source_revisions: immutableSourceSnapshots,
    claim_revisions: immutableClaimSnapshots,
    decisions: historicalDecisionRecords,
    heads: { sources: sourceSubmissionHeads, claims: claimSubmissionHeads },
  },
  expected_heads: { sources: expectedSourceHeads, claims: expectedClaimHeads },
  evidence: {
    relationships: { 'logical-claim-id': completeTypedEdges },
    related_claims: { 'logical-claim-id': verifiedRelatedRevisionReferences },
  },
});
```

Each head token is exactly `{ revision_id, version }`. New logical identities require explicit `{ revision_id: null, version: 0 }` in both snapshot and expectations. Heads describe **latest submission**, not published/authorized selection. Every incoming source, focal claim, evidence source and related claim gets a precondition. Existing logical rows with no immutable baseline fail `LEGACY_BACKFILL_REQUIRED`; no historical authority is reconstructed.

For packets, optional `identity_map: { sources: { packetId: logicalId }, claims: { packetId: logicalId } }` resolves declared identities. Batch IDs already are library IDs. Packet source IDs otherwise reuse the existing adapter's DOI mapping and `feedId` convention. DOI ambiguity, slug collisions within a packet or against retained original packet identities, and conflicting explicit DOI mappings fail. Claim wording never establishes identity. Cross-investigation claim identity and cross-library study-family reconciliation require explicit caller mappings; missing mappings are never inferred from semantic similarity.

Use complete library rows and every historical immutable revision in the requested dependency closure, not the existing primary-only publication projection. Stored snapshots are reconstructed and checked, and exact related-claim references must exist in that verified history. These checks establish internal integrity, not authenticity of the caller's snapshot or completeness of a database query.

Raw export and DB-mapped rows share the contract's legacy classification, including accepted scientific extras and operational provenance. Internal partition-only helper snapshots are discarded and never become planned sources, claims or evidence. Source-only batches are rejected: this planner requires a nonempty claim set and refuses unused incoming sources.

Packet mapping inspects **all incoming sources**, including DOI-reused reports that the old adapter skips. Full source/claim packet detail and contradiction descriptors remain in opaque scientific body sections; explicit use restrictions, access, corrections/retractions and safety fields also remain explicit contract fields. Raw packets/rows survive in operational observations. Generated packet batch bookkeeping is outside scientific identity. Unknown raw-row scientific fields still fail the contract's reviewed classification; opaque nested packet detail is retained and hashed in full, as the contract permits.

`supporting_source_ids`, `contradicting_source_ids` and optional `qualifying_source_ids` can be top-level or inside extras, never both. Supplied typed relationships must include every declaration; additional scoped source and related-claim relationships are preserved. Legacy untyped `batch.relationships` require explicit reconciliation and fail `UNCLASSIFIED_RELATIONSHIPS` rather than being discarded. Packet contradiction descriptors require real packet claim/source endpoints. Packet-declared related claims require typed edges and verified historical revisions.

Without typed evidence, declared source edges retain explicit unknown scope/locator markers when those values were not recorded. Metadata-only sources and unknown study families remain representable private candidates. They yield an **incomplete plan with no append operations**, not fabricated evidence or independent corroboration. This conservative submission rule is a planner boundary, not an activated evidence-clearance policy.

## Plan semantics

Successful results contain:

- `append.source_revisions` and `append.claim_revisions`: only new immutable snapshots with parent references; new claims are `pending`.
- `append.evidence_edges`: complete edges bound to exact claim/source/related-claim revisions; storage uniqueness must include focal claim revision plus edge ID.
- `append.provenance`: exact retries coalesce by observation digest; distinct operational observations can append even within one batch. Scientific revision payloads are never patched for provenance.
- `preconditions` and `submission_head_updates`: expected versioned heads and proposed CAS transitions for newly appended revisions. Historical replays reuse old revisions without moving submission heads backwards.
- `outcomes`: append/reuse reason, explicit supporting study-family accounting, contradiction/correction/retraction review flags, no approval transfer and no automatic-clearance evaluation.
- `retained_history`: existing revision references and original legacy/decision records, including unknown historical authority details.
- Empty `decisions_to_append` and `authorized_selections_to_change`.

All inputs detach before asynchronous hashing; results are recursively frozen. `rejected`, `incomplete` and `conflicting` results contain reason codes and empty append lists. Incomplete candidates are review artifacts, not executable subsets. Relationship omission or a scope/locator replacement fails completeness; missing prior scientific fields and missing edge qualification fields also refuse partial snapshots. Explicit authorized supersession needs a later reviewed command; this API cannot authorize removal.

`checkImportPlanHeads(plan, currentHeads)` checks all read dependencies and detects stale versions, including ABA. A successful pure check is not a lock. Future persistence must repeat these conditions atomically; plans must not be trusted solely because a caller supplied `ok: true`.

## Initial validation on Node 20 (commit 8027eb2)

Official local Node v20.20.2, empty credential environment, external fetch/socket guard, synthetic fixtures and local mocks/fixture servers only.

| Run | Result |
| --- | --- |
| New planner fixtures | 27 passed, no failures/skips |
| Planner + contract + research-named tests + research gap queue, 11 files | 71 Node-runner entries passed, no failures/skips; legacy custom harness assertions also passed |
| Inherited CI selector, 107 discovered / 104 selected; original 3 exclusions | 457 passed, no failures, 2 documented live skips |
| Unfiltered 107-file suite | 457 passed, 3 inherited failures, 2 documented live skips; not full-suite success |
| Original 3 failing files on untouched exact #73 head | All 3 fail there as well |
| Older ingestion/MCP script harnesses on candidate and untouched #73 head | Same inherited mock-contract failures on both |

The three unfiltered failures remain `aimt-listen-mode-capcut-production.test.mjs` and `aimt-media-backup.test.mjs` (absent ignored local media masters), and `aimt-listen-mode-module1-pilot.test.mjs` (historical pilot assertions conflict with later wiring/payment fixes). The older `research-library-ingestion-test.mjs` mock lacks response headers/clone and updated PATCH behavior; `research-mcp-connector-test.mjs` then lacks expected partial-result/claim data. Neither script harness imports the new planner; neither is in the CI selector. No exclusions or inherited fixtures were changed.

An initial sandboxed broad run also failed six local fixture-server startups and one test-artifact directory write. With the Node 20 binary directory on PATH and local fixture permissions, these seven environment failures disappeared. They are not counted as inherited code defects.

Reproduction, with Node 20 on PATH and the existing offline preload:

```sh
node --import=./tests/support/offline-only.mjs --test --test-concurrency=1 \
  tests/revision-import-planner.test.mjs tests/scientific-revision-contract.test.mjs \
  tests/research-*.test.mjs tests/education-research-gap-queue.test.mjs
node scripts/pr-validation.mjs
node scripts/pr-validation.mjs --all
```

Compatibility tests cover packet validation/adapter IDs, canonical ingestion partition gates, raw export rows, DB-mapped rows/extras and contract round-trip verification. They do not establish live database, schema, permission or publishing compatibility. The inherited hosted CI workflow triggers only for PRs to `main`; this stack's local results do not establish hosted required-check coverage.

## Risks and transactional persistence prerequisites

1. Inventory deployed schema/RLS, direct writers, service-role bypasses, actual human approvers and historical approval records before a migration. Establish trustworthy complete dependency loading and stable ID/study-family mappings. Legacy backfill needs reviewed snapshots and faithful original approval history; missing original review details remain unknown.
2. Implement one reviewed RPC/transaction: lock every source/claim submission head and related dependency in deterministic order; verify all expected revision/version tokens including absent identities; revalidate stored digests and endpoints; append revisions, composite-key edges and provenance; CAS submission heads; commit all or nothing. Add durable uniqueness, foreign keys and immutable-row permissions. Resolve retry-after-commit and concurrent same/different candidates without last-writer-wins writes.
3. Keep authorized/published selection and human decisions separate from submission heads. Authenticate actor authority server-side. Import credentials must lack affirmative human-approval and immutable-content-update permissions. Automatic evidence policy is unevaluated and inactive here. Historical approvals never bind newly appended content.
4. Source changes plan only the explicitly supplied claims. Future persistence needs reverse dependency discovery and auditable correction/retraction escalation for other dependent claims, related revisions, decisions and publications. This planner neither withdraws old approvals nor declares a retracted source usable. Named status flags are advisory; policy must account for all deployed correction vocabularies and restrictions.
5. Scope/locator replacement, relationship supersession and partial nested scientific updates require a reviewed reconciliation design. Returned incomplete candidates must never be submitted as successful subsets. Packet-specific and already DB-mapped snapshots may have different scientific payload representations; migrate formats explicitly rather than claiming byte-identical identity across representations.
6. The complete verified history is held in memory and may be large. Bound retrieval and snapshot size before runtime integration; do not truncate history/evidence silently. Effective required-check enforcement and inherited test-fixture failures remain upstream release prerequisites.

Only the new planner, synthetic tests and this integration report are added. Existing packet adapter, importer, scientific contract, evidence projections, schema, approval writers, public publishing, student courses and Cadence remain unchanged. No migrations, live research writes, model calls, agents, schedules, merge or deployment commands. Stop at the draft review PR before persistence implementation.


## Real-packet compatibility correction

The [real-packet compatibility gate](REAL-PACKET-COMPATIBILITY.md) records the follow-up read-only sample, aggregate missing requirements, planner v2 contradiction-binding correction and current tests. Its results supersede the initial synthetic-only readiness assessment. Packet-first typed edges now need explicit description bindings; narrative-only adapter batches remain incomplete. Failure results include original private input and unresolved evidence, so downstream reporting must retain the existing aggregate-only public-log boundary. No persistence or enrichment workflow is activated.
