-- AIMT Automated Publication Clearance -- page-level clearance bridge
-- Additive only. Does not alter research_claims, research_sources,
-- course_entitlements, course_progress, completions, certification_*,
-- cadence_*, admin_*, or aimt_logs.
--
-- GOVERNANCE (do not weaken): this migration does not touch
-- verification_status, AIMT_APPROVED, public_eligible, or published
-- anywhere. It adds exactly two new signals to research_public_pages so
-- the table can truthfully record that a SPECIFIC page's evidence brief
-- passed Publication Editor v1+v2's automated deterministic standard
-- (AUTO_READY) -- a DIFFERENT trust signal from human AIMT approval,
-- which remains a separate, human-only action. Nothing in this
-- migration, in functions/_lib/research/publication-clearance.mjs, or
-- anywhere else in Publication Editor v1/v2 can set
-- clearance_mode = 'HUMAN_APPROVED' programmatically -- the CHECK
-- constraint below allows that value only for a FUTURE human-
-- authenticated review path (not built yet) to use.
--
-- WHY NOT A NEW TABLE: research_public_pages (supabase/migrations/
-- 20260920_create_research_library.sql section 11) already carries
-- key_claim_ids, source_ids, summary_markdown, limitations_markdown,
-- practitioner_relevance_markdown, status, and generation_source_hash --
-- exactly the shape a page-level clearance record needs, reused here
-- unchanged. The two genuinely missing signals are (1) HOW a page's
-- evidence was cleared (automated vs. human -- no existing column
-- captures this) and (2) enough structured provenance (excluded claims +
-- reasons, citation map, scope language, engine/model/validator
-- versions, reconciliation metadata) to audit an AUTO_READY decision
-- later, which does not fit any single existing typed column.
-- `structured_data` (already on this table) is deliberately NOT reused
-- for that provenance payload -- it sits alongside seo_title/
-- meta_description/canonical_url and is reserved for a future public
-- page's own JSON-LD/schema.org markup, a different concern from
-- internal clearance provenance.
--
-- RLS NOTE (unchanged, reviewed): the existing SELECT policy on this
-- table already exposes every column of a `published` row to anon/
-- authenticated clients (Postgres RLS is row-level, not column-level).
-- Once a page is actually published, clearance_mode and
-- publication_clearance become publicly readable alongside everything
-- else on that row -- reviewed and accepted as consistent with AIMT's
-- own "provenance/citations/limitations preserved" transparency
-- principle, not an oversight. No policy change is made here.
--
-- Run manually in the Supabase SQL editor, same as 20260920's migration.
-- Pushing this file does NOT execute it. Safe to re-run (idempotent).

alter table public.research_public_pages
  add column if not exists clearance_mode text,
  add column if not exists publication_clearance jsonb not null default '{}'::jsonb;

alter table public.research_public_pages
  drop constraint if exists research_public_pages_clearance_mode_check;
alter table public.research_public_pages
  add constraint research_public_pages_clearance_mode_check
    check (clearance_mode is null or clearance_mode in ('AUTO_READY', 'HUMAN_APPROVED', 'HUMAN_REVIEW_REQUIRED'));

-- Widen status to add 'ready_for_page_builder' -- an AUTO_READY-cleared
-- page's lifecycle stage, distinct from 'approved' (reserved for a
-- future human editorial approval of the PAGE itself, not its
-- evidence). Every existing allowed value is preserved verbatim; the
-- 'ready_for_page_builder' -> published transition, and any future
-- approval workflow, are out of scope for this migration.
alter table public.research_public_pages
  drop constraint if exists research_public_pages_status_check;
alter table public.research_public_pages
  add constraint research_public_pages_status_check
    check (status in ('draft', 'in_review', 'ready_for_page_builder', 'approved', 'published', 'archived'));

comment on column public.research_public_pages.clearance_mode is
  'How this page''s evidence brief was cleared. AUTO_READY: Publication Editor v1+v2''s deterministic pipeline passed with no human touch. HUMAN_APPROVED: explicit human review -- never set by automation. HUMAN_REVIEW_REQUIRED: flagged, awaiting a human. NULL: no clearance decision recorded yet. This is NOT AIMT_APPROVED (a claim/source-level, human-only field on research_claims/research_sources) and must never be mapped onto it.';

comment on column public.research_public_pages.publication_clearance is
  'Structured provenance for a clearance decision: fingerprint algorithm, risk tier, excluded claim IDs + reasons, citation map, scope language, engine/model/validator versions, and candidate/source counts. Distinct from structured_data (reserved for this page''s own public JSON-LD/schema.org markup, a different concern). Written only by functions/_lib/research/publication-clearance-writer.mjs, itself only invoked manually via scripts/research-publication-clearance-shadow.mjs -- no automated schedule and no public route write this column.';

-- ── Page-level invariants (defense in depth) ───────────────────────────
-- The writer (publication-clearance-writer.mjs) already enforces these in
-- application code, but the table should protect the governance contract
-- on its own, independent of any particular writer's correctness. None of
-- the three checks below reference AIMT_APPROVED or claim-level
-- public_eligible/published anywhere, and none may ever be changed to --
-- page-level clearance (AUTO_READY or HUMAN_APPROVED) is a self-
-- sufficient, independent route to page eligibility; it must never be
-- made to require a human having separately promoted every underlying
-- selected claim. A JS-side mirror of these three checks, kept in sync by
-- hand (same posture as scripts/research-library-preflight.mjs already
-- takes toward the claims/sources CHECK constraints), lives in
-- functions/_lib/research/publication-clearance-invariants.mjs and is
-- exercised by tests/research-publication-clearance.test.mjs without a
-- live Postgres connection.
--
-- THREE-VALUED-LOGIC NOTE: every predicate below explicitly tests
-- `clearance_mode is not null` before comparing it, and uses
-- coalesce(array_length(...), 0) rather than a bare array_length(...) --
-- Postgres CHECK constraints PASS on a NULL result (only an explicit
-- FALSE fails them), and both a NULL clearance_mode compared with `in
-- (...)` and array_length() on an empty array evaluate to NULL, not
-- FALSE, if written naively. Written naively, these constraints would
-- silently pass exactly the rows they exist to reject.
--
-- COMPLETE CLEARANCE (hardened, this revision): a row is not considered
-- to carry a real page-level clearance unless it has ALL of:
--   - clearance_mode in ('AUTO_READY', 'HUMAN_APPROVED')
--   - a non-empty generation_source_hash
--   - at least one key_claim_id
--   - at least one source_id
--   - a non-empty publication_clearance provenance object (not null, not
--     the column's own '{}'::jsonb default)
-- The original version of constraint 1 below checked everything except
-- publication_clearance, and the original constraint 3 (published) only
-- checked clearance_mode -- meaning a buggy future writer could satisfy
-- both the ready and published CHECKs while leaving generation_source_hash,
-- key_claim_ids, source_ids, or publication_clearance empty, defeating the
-- auditability this table exists to guarantee. Both constraints now
-- require the SAME complete definition; `publication_clearance`'s own
-- column default is `not null default '{}'::jsonb`, so NULL alone cannot
-- be relied on to catch an empty payload -- hence the explicit
-- `jsonb_typeof(...) = 'object' and publication_clearance <> '{}'::jsonb`.
-- Neither constraint requires claim-level AIMT_APPROVED.

-- 1. A row claiming to be ready for the Page Builder must carry a
--    COMPLETE clearance -- never an accidental/partial state.
alter table public.research_public_pages
  drop constraint if exists research_public_pages_ready_requires_clearance;
alter table public.research_public_pages
  add constraint research_public_pages_ready_requires_clearance
    check (
      status <> 'ready_for_page_builder'
      or (
        clearance_mode is not null
        and clearance_mode in ('AUTO_READY', 'HUMAN_APPROVED')
        and generation_source_hash is not null
        and generation_source_hash <> ''
        and coalesce(array_length(key_claim_ids, 1), 0) > 0
        and coalesce(array_length(source_ids, 1), 0) > 0
        and publication_clearance is not null
        and jsonb_typeof(publication_clearance) = 'object'
        and publication_clearance <> '{}'::jsonb
      )
    );

-- 2. A row explicitly flagged HUMAN_REVIEW_REQUIRED can never also claim
--    to be ready for the Page Builder or already published.
alter table public.research_public_pages
  drop constraint if exists research_public_pages_review_required_not_ready;
alter table public.research_public_pages
  add constraint research_public_pages_review_required_not_ready
    check (
      clearance_mode is distinct from 'HUMAN_REVIEW_REQUIRED'
      or status not in ('ready_for_page_builder', 'published')
    );

-- 3. Forward-looking: IF a row is ever published (not done by this
--    migration or this PR -- status stays 'ready_for_page_builder' at
--    most here), it must carry the SAME complete page-level clearance as
--    constraint 1 -- not merely a clearance_mode value. Deliberately does
--    NOT require AIMT_APPROVED claim status -- AUTO_READY alone is
--    sufficient, by design (see the governance note above). This
--    coexists with the pre-existing
--    research_public_pages_published_requires_timestamp constraint
--    (supabase/migrations/20260920_create_research_library.sql), which
--    already requires published_at whenever status = 'published' -- that
--    constraint is untouched.
alter table public.research_public_pages
  drop constraint if exists research_public_pages_published_requires_clearance;
alter table public.research_public_pages
  add constraint research_public_pages_published_requires_clearance
    check (
      status <> 'published'
      or (
        clearance_mode is not null
        and clearance_mode in ('AUTO_READY', 'HUMAN_APPROVED')
        and generation_source_hash is not null
        and generation_source_hash <> ''
        and coalesce(array_length(key_claim_ids, 1), 0) > 0
        and coalesce(array_length(source_ids, 1), 0) > 0
        and publication_clearance is not null
        and jsonb_typeof(publication_clearance) = 'object'
        and publication_clearance <> '{}'::jsonb
      )
    );
