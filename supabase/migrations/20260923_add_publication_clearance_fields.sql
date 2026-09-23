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
