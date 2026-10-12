# AIMT Office V1 — implementation and review

Office extends the existing owner Admin with a read-only workplace. It has no dispatch, approval, merge, retry-workflow, publishing, messaging or spending controls. The existing Admin's unrelated controls remain in their existing sections.

## Audit and reuse

Base: production `main`, `3db89ecb07ad112c3cb75260df1ec68ad9ed2239`. The October 7 Phase 1 Current State Audit and Database Schema Appendix, and October 8 Phase 1.5 Foundation Verification, Intelligence Architecture and Autonomy Governance were reviewed alongside current code. Those reports use this same site baseline; Phase 2A/2B proposed repairs are not silently included. PRs #72, #73 and #74 remain independent and unmerged.

Reused:

- `admin.html`: existing sign-in, navigation, actor role, growth and system-health sections; existing Outfit/Playfair/Montserrat fonts, palette and responsive shell.
- `functions/_lib/admin/auth.mjs`: real Supabase identity resolution and active `admin_users` role authorization. Its optional `bootstrap:false` setting makes Office strictly read-only, preserving all current Admin defaults.
- `functions/_lib/certification/auth.mjs`: existing service-role REST helper; no new database, table, migration, credential or auth service.
- Existing research ingestion, verification queue, quarantine and public-page metadata tables.
- Existing public `aimt-site` GitHub workflows, PRs, checks, statuses, deployment records, artifact metadata and education exception issue labels.
- Growth reporting remains in Admin → Growth, linked from Market Intelligence. Its reporting logic is unchanged.

Research MCP already provides bounded ingestion/retrieval interfaces; Office neither calls its write tools nor changes its protocol, OAuth or approval controls. The private research-feed repository is not requested. Existing Education Operations, Publication Editor, Writer/Reviewer, research ingestion and publisher code/workflows remain unchanged. Stage reports are not ingested: the Phase 1/1.5 false-success finding makes job conclusion insufficient proof of successful scientific/education stages.

## Implemented sections

Office Overview: snapshot-based morning briefing, recent ingestion/workflow/page outcomes, currently reported workflow executions, recorded exceptions, uncertain running flags, and recent research/development.

Employee Directory: all seven requested departments, with dedicated responsibility views showing mandate, existing systems, source-derived last activity, outputs/references and outstanding work. These are responsibility definitions, not an employee activation registry.

Work Activity: newest-first records with exact original statuses, local-time timestamps, source labels, references/artifact metadata and safe source links. Source filter supports drill-down.

Decision Desk: pending quarantined records, existing `education-review` / `education-infra` issues, and failure/partial/timeout/action-required outcomes. Research work queue rows are not automatically treated as human approval needs. No approval controls.

Development Activity: open PRs, exact-head check runs and commit statuses for up to two PRs, separate deployment/Cloudflare preview evidence, artifact metadata and workflow execution. Checks do not imply successful previews, passing individual tests or completed business stages.

## Source contracts and limits

`GET /api/admin/office` resolves the caller first, requires an active **owner** role, disables owner bootstrap, then performs only GETs. Anonymous, student, support, admin and inactive roles cannot obtain Office data. Responses, including errors, use `private, no-store`, `Vary: Authorization` and `nosniff`. Other methods return 405 before any data request.

Supabase projections: `research_ingestion_log`, `research_verification_queue`, `research_ingestion_quarantine` (pending only), and `research_public_pages`. Each reads at most 30 records with explicit columns. No student information, raw research packets, summaries, claim bodies, raw quarantine payloads, error payloads, credentials or broad logs are returned. Failed ingestion details identify the batch/status and retain a source reference; raw `error_summary` is deliberately excluded because it can contain sensitive diagnostics. Existing DB inspector links are not available, so database rows provide table and record/batch references instead of invented URLs.

GitHub: unauthenticated read-only public API, fixed `brandrice-dev/aimt-site` repository. Up to 30 workflows, PRs, issues and artifact metadata; five deployments, with status lookup for the latest two; current checks/statuses for the latest two open PRs. Issues are filtered to existing education exception labels after the bounded read, so older issues may fall outside the sample. Artifacts expose metadata and run links only; no download or report body. No private-repository token is added. GitHub rate limiting is surfaced as unavailable; refresh is manual, with no background polling. Empty successful reads are distinct from source errors.

Requests to each operational source have a six-second timeout and fail independently. Fetch/HTTP/malformed responses produce **Activity unavailable**, not fabricated records. Unconfigured assignments/communication show **Not connected**. Authorized source URLs are limited to HTTPS GitHub, AIMT and Pages preview hosts. All displayed source strings are escaped. Refresh failures discard the previous snapshot; sign-out clears records and invalidates in-flight loads.

No percentage progress, revenue or AI cost estimate is added. Count cards describe records in the available sample, not total company throughput. Workflow execution is unavailable when that source cannot be read. Stalls cannot be determined without heartbeat/deadline evidence; database `running` is explicitly unverified execution, never an active employee.

## Activity classification

- **Execution observed**: GitHub currently returns `in_progress` for a workflow attributed to this responsibility. This is a system execution observation, not proof of an individual agent working.
- **Historical activity verified**: an attributed operational record exists in an available source; its original timestamp/status and reference are shown. Failures are valid activity evidence, not successful work.
- **Activity unavailable**: no attributed execution history is present in the bounded connected sources, or the responsibility has no execution feed. An empty sample does not establish inactivity.

The local review snapshot showed historical workflow records for Scientific Intelligence and Education Development, and PR/check/artifact records for Technology & Operations. Market, Innovation, Creative and Executive responsibilities had no execution feed. No currently in-progress workflow was reported. These are snapshot observations, not permanent role states or researcher uptime claims.

## Verification and preview

Node 20 targeted Office/Admin/growth/surface tests and local browser QA are recorded in the delivery evidence. Two pre-existing live public-surface checks are skipped; this is not production authentication or deployment certification.

Local preview:

```sh
node scripts/office-local-qa-server.mjs 8793
```

Open `http://127.0.0.1:8793/admin`, then Office. This **local-only QA server** substitutes a synthetic owner session, disables growth telemetry, reads real public GitHub metadata and intentionally makes private Supabase sources unavailable. Its banner states these limits. No production login, database writes, model calls or student data are used. Existing Admin data intentionally remains unavailable in this harness. GitHub rate limits can make public sources unavailable too. The QA server serves only Admin/assets on loopback; `scripts/` remains denied by the production route guard.

For a configured branch preview, open `/admin`, sign in with the existing owner account, and select Office. Verify `/api/admin/office` returns 401 without a session and 403 for an active admin/support/student account; only the real owner should see private projections. Confirm preview environment bindings before using it. A successful local screenshot or passing test is not a deployed preview. Hosted preview and authenticated private Supabase verification are remaining review checks if the existing preview environment is available.

## Next increment — separate authorization

1. Confirm authenticated preview reads and effective permissions/retention; establish a durable private assignment store after schema authorization.
2. Define responsibility identities, assignment state, immutable spec/authority references, dependencies, expected outputs, deadlines, heartbeat and lease semantics. Existing GitHub issues can carry sanitized development references; private evidence remains private.
3. Specify an owner-only communication ledger with provenance and audience controls. Introduce messaging/dispatch separately, with explicit tool/data/budget scope and stop gates.
4. Connect validated business-stage ledgers bound to run/head/artifact digests before claiming education completion or reliable stall detection.
5. Preserve scientific revision/approval work as the separate Phase 2B dependency. Assignment or communication permission must never imply scientific approval, certificate issuance or production release authority.

Stop for review. Merge and production deployment are not authorized by this implementation.
