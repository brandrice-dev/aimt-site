# AIMT Research Library — live research flow repair (2026-09-30)

Branch `fix/research-library-live-flow`, not merged. It contains no schema change and no change
to `ingest-request.mjs`, `importer.mjs`, `schema.mjs`, `/api/research-ingest`, `/api/mcp` or any
Cadence, checkpoint, certification or course file.

## Root cause: nothing new reached the library after Sept 21

The research worker did produce research. It never reached Supabase for three reasons:

1. **Packets were deposited where nothing reads them.** Grok writes finished packets to
   `brandrice-dev/aimt-research-feed/inbox/`. That repository is private and automation-free by
   design, and nothing in AIMT polled it. Two scalp-dysesthesia packets from Sept 21 and 22 sat
   there un-ingested.
2. **The packet shape never matched the ingestion shape.** Packet claims list many supporting
   sources. The canonical pipeline expects export-style records with exactly one `source_id` FK
   per claim. No translator existed; the feed README even notes that the two schemas don't map.
3. **The only other route, MCP `submit_research_batch`, was activated today and has failed
   auth every time.** The feed repo's PR #2 merged on 2026-09-30. Since then `/api/mcp` has
   logged `missing_bearer_token` (10 times) and then `invalid_token` (3 times). Supabase auth
   logs show the cause: `token has invalid claims: token is expired` (`bad_jwt`). Grok's
   connector presents an expired OAuth access token and does not refresh it.

Other things checked and ruled out:
- `/api/research-ingest` has never been called; there are no log events and no ingestion rows.
- `research_ingestion_quarantine` is empty, so nothing was rejected; it simply never arrived.
- The Education Operations research-gap loop is enabled and runs on schedule. It has not
  produced a gap because no run returned `EVIDENCE_INSUFFICIENCY` since it was enabled, so
  `research_verification_queue` holds only the 209 original verification rows.
- The `research_ingestion_log` holds only the Sept 21 import: one failed manual SQL attempt and
  two CLI runs.

## Architecture after the fix

```
Grok / research worker ──(atomic deposit)──► aimt-research-feed/inbox/*.json (private)
                                                      │
        .github/workflows/aimt-research-feed-ingest.yml (every 6 h, read-only feed token)
                                                      ▼
scripts/research-feed-ingest.mjs
   validate packet → drop same-topic re-tests (superseded) → skip batch_ids already in
   research_ingestion_log → packet-adapter.mjs (pure translation; existing sources reused by DOI)
                                                      ▼
functions/_lib/research/ingest-request.mjs#processIngestionBatch  ← unchanged, canonical
   (JS validation, quarantine, orphan check, AIMT_APPROVED refusal + downgrade protection,
    research_ingestion_log)
                                                      ▼
Supabase research_sources / research_claims / topic joins
```

The MCP route (`list_research_gaps` → `claim_research_gap` → `submit_research_batch`) is
unchanged and remains the path for gap-linked submissions once Grok's connector is
re-authorized.

### Translation rules (`functions/_lib/research/packet-adapter.mjs`)

- **Statuses:** `verification_status` is copied verbatim. `AIMT_APPROVED` is passed through
  untouched, so the canonical gate quarantines it; it is never laundered.
- **Claims:** recorded as `claim_text_fidelity` / `claim_origin = library_summary`, with the
  first supporting source as the FK. Every supporting and contradicting source, confidence,
  category, notes and contradiction is kept in `extras` and `body_markdown`.
- **Review state:** `use_status = provisional`, `verification_review_status = not_reviewed`.
  `verified_on` is set only for CLAIM_VERIFIED.
- **Sources:** reach `SOURCE_VERIFIED` only when the packet was cross-checked and the source
  underpins a verified claim; otherwise `DISCOVERED`.
- **Dedupe:** existing library sources are matched by DOI and linked, never overwritten.
- **No invention:** month-only dates are kept raw in `extras`; direction is `unclear` only for
  claims with named contradicting sources, and is otherwise left unset.
- **Supersession:** requires the same `research_topic` plus an explicit batch_id mention.
  A cross-reference alone never suppresses a packet.

## Results (live, 2026-09-30)

| | Before | After |
|---|---|---|
| research_sources | 219 | **280** |
| research_claims | 1,081 | **1,137** |
| CLAIM_VERIFIED claims | 992 | 1,019 |
| AIMT_APPROVED claims | 0 | 0 |
| Quarantined records | 0 | 0 |
| Newest ingestion | 2026-09-21 12:46 UTC | 2026-09-30 20:32 UTC |

| Batch | Topic | Sources new/reused | Claims (verified / discovered) |
|---|---|---|---|
| AIMT-RF-2026-09-22-SDYS-v2 (Grok, waiting since Sept 22) | Scalp dysesthesia / trichodynia overlap | 10 / 0 | 13 (6 / 7) |
| AIMT-RF-2026-09-30-SSCALP | Sensitive scalp and trichodynia | 12 / 0 | 10 (7 / 3) |
| AIMT-RF-2026-09-30-CONTACT | Contact dermatitis from hair products | 10 / 0 | 8 (5 / 3) |
| AIMT-RF-2026-09-30-TRACTION | Traction alopecia causes and risk factors | 9 / 0 | 7 (3 / 4) |
| AIMT-RF-2026-09-30-POSTPARTUM | Postpartum shedding | 6 / 0 | 6 (2 / 4) |
| AIMT-RF-2026-09-30-NUTRI | Iron/ferritin and biotin | 7 / 1 | 6 (3 / 3) |
| AIMT-RF-2026-09-30-PSO | Practitioner-relevant scalp psoriasis | 7 / 0 | 6 (1 / 5) |
| AIMT-RF-2026-09-21-SDYS | Scalp dysesthesia, first pass | — | not ingested: superseded by the stricter v2 re-test |

About the six 2026-09-30 packets:
- They were researched by the Claude Code research worker on the owner's instruction, following
  `grok/GROK-RESEARCHER-INSTRUCTIONS.md`.
- Every claim was checked against PubMed abstracts. No full texts were read, and every packet
  says so per source.
- Same-group publications count as one evidentiary base.
- Weak areas were left DISCOVERED rather than promoted: postpartum incidence, trichodynia
  epidemiology, psoriasis practice data, traction reversibility, biotin/immunoassay interference.

### Continuity proof

The same committed script ran three times, and no database work was done by hand:
1. The first run ingested the waiting Sept 22 packet.
2. A re-run was a no-op (idempotent).
3. After five packets were deposited to the feed's `main`, a run from a fresh clone ingested
   exactly those five.
4. After one more packet was deposited, the next run ingested only that one and skipped the
   other six as already ingested or superseded.

Every run went through `processIngestionBatch` and wrote a `research_ingestion_log` row with
`triggered_by = research-feed-poller`.

The scheduled workflow is the same script. It cannot run until `RESEARCH_FEED_READ_TOKEN` is
provisioned, and it only runs on `main` after merge.

## Owner actions

1. **Add `RESEARCH_FEED_READ_TOKEN`** as an Actions secret on `aimt-site`: a fine-grained PAT
   limited to `aimt-research-feed`, Contents read-only. See runtime config §E.
2. **Re-authorize Grok's MCP connector** on `https://aimtrichology.com/api/mcp`. Its OAuth access
   token is expired and is not being refreshed. The alternative is the static
   `MCP_CONNECTOR_SECRET` path. Until this is fixed, gap claiming and gap-linked submissions
   can't work, though packets deposited to the inbox will still flow once item 1 is done.
3. **Decide on the double-submission rule** in the feed repo's Grok instructions. If Grok both
   deposits a packet and submits the same research via MCP, the two land as separate records
   unless it uses the packet's `batch_id` as the MCP batch id and the same ids. Simplest option:
   deposit only, and use MCP only for `list_research_gaps` / `claim_research_gap`.
4. Merge this branch when ready. After that, the schedule runs every 6 hours.

## Cadence shadow re-evaluation (frozen retrieval code, updated library)

`feature/cadence-research-shadow` @ `8687665` was run unchanged from a clean worktree against the
live library after ingestion, using read-only GETs. No retrieval code or labels were changed. It
is not wired into Ask Cadence.

| Measure | Before new evidence | After |
|---|---|---|
| Hold-out v3 decision accuracy | 96% | 96% |
| Hold-out v3 useful claims (hand-judged) | 72% (34/47) | 71% (37/52) |
| Hold-out v3 coverage (hand-judged) | 78% (14/18) | 79% (15/19) |
| Priority-topic questions (dev + both hold-outs) with ≥1 useful claim | 19 / 37 | **26 / 37** |

New evidence now reaches:
- dysesthesia and anxiety questions;
- psoriasis practice questions (Koebner/trauma);
- biotin, ferritin and shedding;
- contact dermatitis from hair products;
- sensitive-scalp and traction questions.

Still missed despite matching claims existing: questions phrased around "trichodynia" or
"burning scalp" (the frozen lexicon's scalp-pain group) and some "tender"/"stinging" wording.
That is a retrieval-vocabulary gap, not an evidence gap. The remaining hold-out v3 failures
(topical vs biologic psoriasis, a sex comparison, itching as an adverse effect, "pus") are
retrieval-relevance problems, since the evidence exists. This isolates the next step as
retrieval work, which is not authorized in this task.
