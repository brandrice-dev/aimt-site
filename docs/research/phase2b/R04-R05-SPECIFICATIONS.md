# AIMT R04 and R05 implementation specifications

October 9, 2026. Prepared for owner, scientific lead, and engineering review. These specifications require a separately authorized implementation package. Phase 2A changes no database schema, approval authority, scientific standard, public eligibility rule, or Cadence integration.

## Current defects and existing components

R04: `functions/_lib/research/importer.mjs` protects only the `verification_status` column of an approved claim. Its remaining mapped scientific fields can change while approval survives. Reading approved IDs before writing is not an atomic lock. Phase 2A fixes incomplete pagination of that read, but leaves the approval identity defect unresolved.

R05: `functions/_lib/research/packet-adapter.mjs` already retains the full mapped supporting and contradicting source ID arrays in claim extras. `publication-readiness-loader.mjs` fetches sources using the primary `source_id`, and `publication-synthesis-evidence.mjs` projects that one source relationship. The richer graph does not survive into synthesis. Do not replace the packet format or build another research database.

Reuse the canonical importer and `ingest-request.mjs`, existing source and claim identities, packet adapter, research verification queue, readiness loader, synthesis evidence projection/validator, publication clearance fingerprint/writer, and education candidate bundles. Trace the actual human approval writer and effective database permissions before implementing: current source comments refer to an Owner's Console, but do not establish its deployed interface or approving actor.

## R04 protected revision contract

Keep a stable logical claim ID. Introduce an immutable revision identity beneath it, within the existing research library. A candidate revision does not inherit its predecessor's approval. Its canonical digest must cover:

- Claim text, type, direction, fidelity, extraction basis and confidence, population/scope, limitations, safety qualifications, locators, body sections and scientific body text.
- Exact source revision identities, primary source reference, complete support/contradiction/qualification edges, quoted evidence spans and study-family identities.
- Scientific interpretation metadata in extras. Start with an explicit reviewed allowlist; reject unknown scientific fields until classified. Do not hash all extras indiscriminately, because packet operational metadata can change without changing evidence.
- Policy version, canonicalization version, and evidence graph digest, with unambiguous distinctions between null, absent, and empty values.

A source revision includes bibliographic identity, available evidence content or content digest, retrieval/version provenance, primary text/locator access, and correction/retraction state. Claim approval references immutable source revisions; changing a mutable source row cannot alter the content that was reviewed.

Canonicalization uses deterministic JSON serialization, stable key ordering and sorted unique edge identities, with a versioned SHA-256 digest. Preserve exact scientific text and qualifiers; do not normalize away negation, numbers, units, whitespace within quotations, or wording differences. Deduplication is only for identical declared identities, never fuzzy semantic similarity. Operational import timestamps and batch IDs are provenance outside the scientific digest. Classification of topics/use restrictions must be explicit; restrictions affecting allowed scientific use require renewed authorization.

## Proposed storage and commands

The following are proposed additions to the existing research schema, requiring migration review later. They are not created in Phase 2A:

| Entity | Required fields and invariants |
| --- | --- |
| Claim revision | Logical claim ID, revision ID, parent revision ID, canonical payload, scientific digest, evidence digest, canonicalization version, provenance, creation actor/time. Immutable after creation. Unique logical ID plus digest permits idempotent submission. |
| Source revision | Logical source ID, revision ID, exact reviewed evidence identity/content digest, locators, provenance and correction state. Immutable evidence payload. |
| Approval event | Immutable event ID, claim revision ID, scientific/evidence digests, policy version, human actor, authority/role, purpose and scope, decision, reason, effective/expiry time, prior event reference. Automated callers cannot create affirmative approval. |
| Current selection | Logical claim ID, active revision ID and optimistic concurrency version. An atomic pointer selection; no implicit authorization transfer. |
| Evidence edge | Claim revision ID, source revision ID or related claim revision ID, relation type, evidence span/locator, scope/qualification, provenance and revision identity. See R05. |

Use existing database RPC/server boundaries rather than a second service:

1. `submitRevision(logical_id, expected_active_revision, candidate, idempotency_key)` locks the claim's current selection, checks the expected version, validates all source/edge references, and creates or reuses a pending immutable revision. Approved content remains unchanged. A conflict returns 409 plus current revision identity, without applying a last-writer-wins update.
2. `approveRevision(revision_id, expected_digest, expected_evidence_digest, policy_version, purpose, scope)` verifies the human authority using the existing authorization rules, rechecks the referenced evidence revisions and correction state inside the transaction, and appends an approval event. A stale digest or simultaneous correction rejects the operation. Approval and any active pointer adoption occur atomically.
3. `selectAuthorizedRevision(logical_id, expected_active_revision, approved_revision_id)` selects only an exactly approved revision allowed for the stated use. Existing readers must request a purpose and receive both immutable content and authorization identity.
4. `withdrawApproval(event_id, reason)` appends a withdrawal event and records affected dependencies. It never deletes or edits historical approval events. Correction and supersession similarly append history.

Grant importers permission to submit candidates and provenance, never to update approved revision payloads or approval events. Enforce immutability and authority in database permissions/constraints, not only JavaScript. Inventory service-role bypasses and every direct writer; migrate them together. The actual names, deployed schema and RPC ownership must be confirmed before writing SQL.

## Concurrent updates and historical records

Read-then-upsert is insufficient. Use a transaction with row lock or compare-and-set against a revision/version token for import, approval, selection, withdrawal and source correction. Retries reuse idempotency keys derived from logical ID, canonical digest and source packet revision. Different candidates form separate revisions; they do not overwrite each other. Serialize dependent source corrections with approval validation so no approval can certify a version that changed during approval.

An identical historical replay is a no-op for scientific identity and may append operational provenance. A changed packet creates a pending candidate while the last authorized revision remains the published dependency, unless existing withdrawal rules invalidate it. If approval and import race, either the pending revision is recorded alongside the approved one or the stale operation is rejected; neither can silently change the approved content.

Backfill existing rows into explicitly labeled legacy snapshots. Preserve all available historical approver, date, scope and original approval information. An absent original approval record remains unknown; never fabricate an actor/date or retroactively claim that the original review covered a reconstructed snapshot. Human/scientific owners decide how legacy snapshots qualify under the unchanged standard. Keep the historical approval event and any later reauthorization as distinct records.

Publication clearance and candidate fingerprints must include exact claim/source revision IDs and the complete evidence graph digest. A new scientific revision invalidates reuse of a candidate that points to different revisions; it does not silently rewrite a published article, student history, exam bank, credential or approval record. Existing release gates still control replacement. Cadence remains outside this package.

## R05 evidence relationship contract

Preserve the legacy primary `source_id` for packet compatibility. Treat it as a designated reference, not the full evidentiary set. Decode existing `supporting_source_ids` and `contradicting_source_ids` in extras; retain packet-local IDs, mapped library IDs, packet digest/batch identity, contradiction statements, related claim links and provenance. Preserve original extras until migration reconciliation proves that every declared relationship has been transferred.

Each edge carries a stable identity, relation (`supports`, `contradicts`, `qualifies`, or separately typed claim-to-claim relation), immutable endpoints, quoted span or available locator, population/scope and limitations, direction, extraction/access confidence, provenance and review status. A source that both supports and contradicts a claim in different populations requires separate scoped edges, not a collapsed boolean. Duplicate edges require equal endpoints, relation, scope, locator and source revision; independent study-family identity prevents duplicate reports of one study inflating independence.

On ingestion, validate every endpoint and persist the complete declared graph or report a failed/incomplete batch. Unknown references create a review/quarantine record; they never disappear. Missing source access is explicit and cannot be replaced by invented primary-text verification. Partial packet updates append a new graph revision. They cannot erase an old edge merely by omitting it. Explicit, authorized supersession is separate from omission.

Extend the existing loader to fetch the union of primary, supporting, contradicting and qualifying sources for the selected claim revisions, plus related claim endpoints. Use bounded deterministic pagination and verify requested IDs against returned IDs. An unresolved endpoint blocks scientific readiness while retaining the record for review. Do not exclude contrary evidence because its status is lower than a supporting source; retain its status/access limitation for the reviewer, and keep current publication authorization requirements unchanged.

Extend the current synthesis bundle with typed evidence edges, all referenced sources, exact limitations, graph/revision digests and relation provenance. The existing validator must require disposition of every relevant contradiction and qualifier, along with claim accounting. A model can explain an edge's relevance but cannot delete it, invent a source, upgrade verification, resolve a dispute by popularity, or grant institutional approval. Excluded material retains an explicit reason and original graph identity in the private audit output.

Thread the same graph digest and immutable references through synthesis reconciliation/retry, page evidence, clearance fingerprints, candidate freshness/integrity, curriculum planning and future purpose-scoped retrieval. Public rendering can summarize with appropriate citation and limitations; the internal reviewed graph must stay complete. Tutor integration remains separately authorized, and experimental Cadence research access stays disabled.

## Acceptance fixtures and rollout sequence

Use synthetic isolated databases and packet fixtures. Require these checks before adoption:

| Area | Acceptance cases |
| --- | --- |
| Approval identity | Change text, negation, number/unit, scope, locator, source revision, contradiction, limitation or use restriction. Each creates a pending revision and cannot retain authorization by copying status. An identical replay preserves the reviewed revision. |
| Concurrency | Import versus approval, two imports, two approvals, source correction versus approval, withdrawal versus publication. Stale writes fail or become separate candidates; historical payload/events remain immutable. Retry does not duplicate an approval event. |
| Evidence round trip | At least three supporting sources, two contradicting sources, scoped qualification, related claims and duplicate study families. Assert exact edge identities/counts and qualifications from packet through import, loader, synthesis/retry, clearance and candidate. |
| Partial and malformed evidence | Missing endpoint, failed dependent write, limited-access source, unresolved contradiction, truncated REST page and unknown relation. No false readiness, dropped edge, or silent approval. |
| History and compatibility | Legacy packet with only primary source, historical import with extras, source correction/retraction, superseded packet, absent old approver and published candidate. Preserve known provenance without manufacturing old approval identities. |
| Authorization | Import/model account cannot approve, mutate an approved revision, select an unauthorized revision or edit historical events. Existing human authority and certification thresholds remain unchanged. |

Implement in order: inventory effective writers/permissions and legacy approval records; approve the canonical field/edge contracts; create reviewed staging migrations and transaction/RLS tests; backfill isolated copies and reconcile counts/digests; extend importer and readers in one compatibility package; shadow-compare old/new results; obtain scientific/owner acceptance; authorize a separate exact-release rollout. Maintain a rollback-compatible reader for the last approved version and retain immutable history; never roll back by replacing approved evidence with an older untracked row.

## Immediate containment options

These are available for separate operator authorization; none is activated here:

- Hold imports containing changed scientific fields for already approved claims in the existing verification/quarantine review process. Compare before writing, retain the submitted packet, and let an authorized human reconcile it. A client-side comparison alone cannot resolve concurrency or protect against another service-role writer.
- Restrict the import credential from modifying approved scientific content if effective permissions can enforce that without breaking legitimate operations. Review service-role bypass first; an application flag is only defense in depth.
- Keep existing published snapshots and candidate artifacts intact. Defer automatic reuse/new clearance for candidates whose evidence graph cannot be reconstructed completely; require the current scientific reviewer to inspect full packet support and contradiction lists.
- Retain a read-only packet/approval export with hashes for review, using the existing operational storage/artifacts and authorized data handling. Do not create a second research database or assert that a backup changes approval rules.

Containment narrows automation; it does not adopt a new scientific standard or revoke legitimate historical approvals by inference. The owner and scientific lead must review its operational consequences before activation.

## Remaining access requirements

Read-only schema, RLS, service-role grants, triggers/RPCs and all approval-writing clients; authorized legacy approval records with actor/scope/version; aggregate pagination and graph reconciliation evidence; staging-only migration/test credentials; current scientific authority/policy confirmation; GitHub required-check/bypass settings; and a separately approved release plan. No live student/payment records or model calls are required to review these specifications.
