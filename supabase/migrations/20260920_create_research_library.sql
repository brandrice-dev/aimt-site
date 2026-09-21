-- AIMT Research Library (foundation)
-- Additive only. Does not alter course_entitlements, course_progress,
-- completions, certification_*, cadence_*, admin_*, or aimt_logs.
--
-- Source of truth for this schema: the Grok research-harvester export
-- (docs/SCHEMA.md, docs/TRUST_MODEL.md, docs/WORKFLOW.md in the export
-- package). Field names and controlled vocabularies below are copied from
-- that export as-is, not redesigned. See:
--   research-import/unpacked/aimt-research-library-export-2026-09-20/
--
-- CRITICAL TRUST-MODEL INVARIANT (do not weaken):
-- `verification_status` is Grok's own epistemic ladder:
--   DISCOVERED -> SOURCE_VERIFIED -> CLAIM_VERIFIED -> AIMT_APPROVED
-- AIMT_APPROVED is human-only. No importer/ingestion path may ever set it.
-- `public_eligible` / `published` are AIMT's OWN downstream gates layered
-- on top (see CHECK constraints on research_claims/research_sources below)
-- -- they must never be settable by the same automated path that writes
-- verification_status, so that a Grok re-sync can never silently promote
-- research into public content. Run manually in the Supabase SQL editor.
-- Safe to re-run (idempotent).

create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ── 1. Topics (controlled vocabulary + observed extras) ───────────────
create table if not exists public.research_topics (
  topic text primary key,
  in_controlled_vocab boolean not null default false,
  source_count_observed integer,
  claim_count_observed integer,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.research_topics enable row level security;
-- No client policies by design. Service-role-only (Cadence worker /
-- ingestion function / future course-builder tool read this directly).

create or replace function public.touch_research_topics_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists research_topics_touch_updated on public.research_topics;
create trigger research_topics_touch_updated
  before update on public.research_topics
  for each row execute function public.touch_research_topics_updated_at();

-- ── 2. Sources ──────────────────────────────────────────────────────────
create table if not exists public.research_sources (
  source_id text primary key,
  schema_version integer,

  title text,
  authors text[],
  year integer,
  date_published date,
  source_venue text,
  doi text,
  url text,
  pmid text,
  pmcid text,

  evidence_type text
    constraint research_sources_evidence_type_check check (evidence_type in (
      'systematic_review','meta_analysis','rct','clinical_guideline','observational',
      'narrative_review','textbook_chapter','professional_org','technical_report','other'
    )),
  source_role text
    constraint research_sources_source_role_check check (source_role in (
      'primary_research','synthesis','guideline','regulator_safety','practice_guidance',
      'preclinical','regulatory_standard','other'
    )),
  topics text[] not null default '{}',

  verification_depth text
    constraint research_sources_verification_depth_check check (verification_depth in (
      'full_text','abstract','secondary','unchecked'
    )),
  verified_on date,
  verification_notes text,

  rights_access_status text
    constraint research_sources_rights_access_check check (rights_access_status in (
      'open','paywalled','unknown','restricted'
    )),
  full_text_held boolean not null default false,
  license_or_rights_notes text,

  use_status text
    constraint research_sources_use_status_check check (use_status in (
      'active','provisional','superseded','excluded','needs_review'
    )),
  use_status_reason text,

  date_retrieved date,
  last_reviewed_on date,
  review_due_on date,
  version_or_amendment text,
  freshness_notes text,

  legacy_entry_file text,
  migrated_on date,
  migration_confidence text
    constraint research_sources_migration_confidence_check check (migration_confidence in (
      'high','medium','low'
    )),
  migration_flags text[] not null default '{}',

  -- Grok's own ladder. Sources only ever reach SOURCE_VERIFIED in the
  -- documented schema (sources are not CLAIM_VERIFIED / AIMT_APPROVED).
  verification_status text
    constraint research_sources_verification_status_check check (verification_status in (
      'DISCOVERED','SOURCE_VERIFIED'
    )),
  -- 'partial' observed once in the live 2026-09-20 export alongside the 3
  -- documented values -- a real 4th state, not a typo. Bare YAML true/false
  -- (142 records; a YAML 1.1 bare yes/no parsing ambiguity, not a distinct
  -- value) is normalized to 'yes'/'no' by the importer before it reaches
  -- this column.
  full_text_access_observed text
    constraint research_sources_full_text_observed_check check (full_text_access_observed in (
      'yes','no','unknown','partial'
    )),
  reviewed_by text,
  verification_review_status text
    constraint research_sources_review_status_check check (verification_review_status in (
      'not_reviewed','reviewed_supported','reviewed_unsupported','reviewed_too_specific',
      'reviewed_access_limited','reviewed_narrowed'
    )),
  date_discovered date,
  -- Intentionally unconstrained: 3 live records carry an operational batch
  -- label ("verified_afternoon_batchA_2026-09-17") instead of one of the 3
  -- documented lane states. Same posture as verification_queue.status /
  -- priority_band below -- operational, evolving, not trust-critical.
  discovery_lane_status text,

  body_markdown text,
  body_sections jsonb not null default '{}'::jsonb,
  source_file text,
  extras jsonb not null default '{}'::jsonb,

  -- AIMT-side editorial gates (ours, not Grok's). A source can only be
  -- marked public-eligible after a named human has reviewed it -- there is
  -- no automated path to true here (no INSERT/UPDATE policy grants it to
  -- anything but the service role, and the importer never sets it).
  aimt_reviewed_by text,
  aimt_reviewed_on timestamptz,
  aimt_review_notes text,
  public_eligible boolean not null default false,
  published boolean not null default false,
  published_at timestamptz,

  grok_export_batch text,
  first_imported_at timestamptz not null default timezone('utc'::text, now()),
  last_imported_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),

  constraint research_sources_public_requires_review
    check (not public_eligible or aimt_reviewed_by is not null),
  constraint research_sources_published_requires_eligible
    check (not published or public_eligible),

  search_vector tsvector generated always as (
    to_tsvector('english',
      coalesce(title, '') || ' ' || coalesce(source_venue, '') || ' ' || coalesce(body_markdown, '')
    )
  ) stored
);

create index if not exists research_sources_topics_gin_idx on public.research_sources using gin (topics);
create index if not exists research_sources_search_vector_idx on public.research_sources using gin (search_vector);
create index if not exists research_sources_title_trgm_idx on public.research_sources using gin (title extensions.gin_trgm_ops);
create index if not exists research_sources_verification_status_idx on public.research_sources (verification_status);
create index if not exists research_sources_use_status_idx on public.research_sources (use_status);
create index if not exists research_sources_public_published_idx on public.research_sources (public_eligible, published);
create unique index if not exists research_sources_doi_unique_idx on public.research_sources (doi) where doi is not null;

alter table public.research_sources enable row level security;

drop policy if exists "research_sources_select_published" on public.research_sources;
create policy "research_sources_select_published"
  on public.research_sources
  for select
  to anon, authenticated
  using (published = true);
-- No insert/update/delete policies for anon/authenticated by design.
-- All writes are service-role (research-ingest function / owner console).

create or replace function public.touch_research_sources_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists research_sources_touch_updated on public.research_sources;
create trigger research_sources_touch_updated
  before update on public.research_sources
  for each row execute function public.touch_research_sources_updated_at();

-- ── 3. Claims ────────────────────────────────────────────────────────────
create table if not exists public.research_claims (
  claim_id text primary key,
  source_id text not null references public.research_sources (source_id) on delete cascade,
  schema_version integer,

  -- 'method' (2 live records) observed instead of 'method_note'.
  claim_type text
    constraint research_claims_claim_type_check check (claim_type in (
      'finding','limitation','method_note','recommendation','safety_conclusion','other','method'
    )),
  claim_text text not null,
  -- 'exact' (59) / 'abstract' (3) observed alongside the 3 documented
  -- values in the live export -- 'abstract' is extraction_basis's
  -- vocabulary leaking into this legacy-compat field in older migrated
  -- records (see docs/SCHEMA.md §7's extraction_basis -> claim_origin
  -- migration mapping in the export; this field caught some of the same
  -- drift). Preserved verbatim, not corrected.
  claim_text_fidelity text
    constraint research_claims_fidelity_check check (claim_text_fidelity in (
      'verbatim_quote','close_paraphrase','library_summary','exact','abstract'
    )),
  topics text[] not null default '{}',
  population_or_scope text,
  -- 'recommendation'/'limitation'/'safety' echo claim_type values, and
  -- 'qualifies' is a claim<->claim relationship predicate (SCHEMA.md §3) --
  -- all observed leaking into this field in <=3 live records each.
  direction text
    constraint research_claims_direction_check check (direction in (
      'supports_effect','no_effect','association','descriptive','precaution','unclear',
      'recommendation','limitation','safety','qualifies'
    )),

  -- 'primary_text' (9) / 'library_summary' (4) are claim_origin's
  -- vocabulary, leaking into this field the other direction from the
  -- claim_origin note below -- same migration-era drift.
  extraction_basis text
    constraint research_claims_extraction_basis_check check (extraction_basis in (
      'full_text','abstract','secondary','legacy_entry','primary_text','library_summary'
    )),
  locator text,
  extraction_confidence text
    constraint research_claims_extraction_confidence_check check (extraction_confidence in (
      'high','medium','low'
    )),

  use_status text
    constraint research_claims_use_status_check check (use_status in (
      'active','provisional','superseded','excluded','needs_review'
    )),
  use_status_reason text,

  migrated_on date,
  migration_flags text[] not null default '{}',

  -- 'full_text' (80 live records, ~7% of all claims) observed instead of
  -- the 4 documented values -- extraction_basis's vocabulary leaking into
  -- claim_origin, almost certainly from the Sept 2026 v1->v2 migration
  -- batch (SCHEMA.md §7 documents extraction_basis -> claim_origin as a
  -- migration mapping; this looks like an unmapped pass-through in a
  -- subset of rows). Preserved verbatim, not corrected.
  claim_origin text
    constraint research_claims_claim_origin_check check (claim_origin in (
      'primary_text','abstract','secondary','library_summary','full_text'
    )),
  -- Grok's full ladder, INCLUDING AIMT_APPROVED. The importer/ingestion
  -- path must never write 'AIMT_APPROVED' -- enforced procedurally (see
  -- scripts/research-library-import.mjs), not by a DB constraint, because
  -- a human reviewer legitimately sets this value through a separate
  -- authenticated path (the future Owner's Console).
  verification_status text
    constraint research_claims_verification_status_check check (verification_status in (
      'DISCOVERED','SOURCE_VERIFIED','CLAIM_VERIFIED','AIMT_APPROVED'
    )),
  verified_against_primary_source boolean,
  page_or_section_locator text,
  verified_on date,
  reviewed_by text,
  verification_review_status text
    constraint research_claims_review_status_check check (verification_review_status in (
      'not_reviewed','reviewed_supported','reviewed_unsupported','reviewed_too_specific',
      'reviewed_access_limited','reviewed_narrowed'
    )),

  body_markdown text,
  body_sections jsonb not null default '{}'::jsonb,
  claim_file text,
  frontmatter_parse_mode text not null default 'strict'
    constraint research_claims_parse_mode_check check (frontmatter_parse_mode in ('strict','tolerant')),
  extras jsonb not null default '{}'::jsonb,

  -- AIMT-side gates. public_eligible requires the claim to already be at
  -- Grok's own top rung (AIMT_APPROVED) -- i.e. a human has explicitly
  -- promoted it -- and published requires public_eligible. This is the
  -- DB-enforced version of "research verified -> AIMT reviewed/approved ->
  -- public eligible -> published"; nothing can skip a rung.
  aimt_review_notes text,
  public_eligible boolean not null default false,
  published boolean not null default false,
  published_at timestamptz,

  grok_export_batch text,
  first_imported_at timestamptz not null default timezone('utc'::text, now()),
  last_imported_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),

  constraint research_claims_discovered_not_active
    check (verification_status <> 'DISCOVERED' or use_status <> 'active'),
  constraint research_claims_public_requires_approved
    check (not public_eligible or verification_status = 'AIMT_APPROVED'),
  constraint research_claims_published_requires_eligible
    check (not published or public_eligible),

  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(claim_text, '') || ' ' || coalesce(body_markdown, ''))
  ) stored
);

create index if not exists research_claims_source_id_idx on public.research_claims (source_id);
create index if not exists research_claims_topics_gin_idx on public.research_claims using gin (topics);
create index if not exists research_claims_search_vector_idx on public.research_claims using gin (search_vector);
create index if not exists research_claims_text_trgm_idx on public.research_claims using gin (claim_text extensions.gin_trgm_ops);
create index if not exists research_claims_verification_status_idx on public.research_claims (verification_status);
create index if not exists research_claims_use_status_idx on public.research_claims (use_status);
create index if not exists research_claims_public_published_idx on public.research_claims (public_eligible, published);

alter table public.research_claims enable row level security;

drop policy if exists "research_claims_select_published" on public.research_claims;
create policy "research_claims_select_published"
  on public.research_claims
  for select
  to anon, authenticated
  using (published = true);
-- No insert/update/delete policies for anon/authenticated by design.

create or replace function public.touch_research_claims_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists research_claims_touch_updated on public.research_claims;
create trigger research_claims_touch_updated
  before update on public.research_claims
  for each row execute function public.touch_research_claims_updated_at();

-- ── 4. Source/claim ↔ topic join tables (referential topic filtering) ──
create table if not exists public.research_source_topics (
  source_id text not null references public.research_sources (source_id) on delete cascade,
  topic text not null references public.research_topics (topic) on delete restrict,
  primary key (source_id, topic)
);

create table if not exists public.research_claim_topics (
  claim_id text not null references public.research_claims (claim_id) on delete cascade,
  topic text not null references public.research_topics (topic) on delete restrict,
  primary key (claim_id, topic)
);

alter table public.research_source_topics enable row level security;
alter table public.research_claim_topics enable row level security;
-- No client policies. Internal filtering aid only.

-- ── 5. Relationships (claim↔claim, source↔source; empty by design) ────
create table if not exists public.research_relationships (
  relationship_id text primary key,
  subject_type text not null constraint research_relationships_subject_type_check check (subject_type in ('source','claim')),
  subject_id text not null,
  predicate text not null,
  object_type text not null constraint research_relationships_object_type_check check (object_type in ('source','claim')),
  object_id text not null,
  confidence text
    constraint research_relationships_confidence_check check (confidence in ('high','medium','low')),
  notes text,
  created_on date,
  migration_flags text[] not null default '{}',
  extras jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);
-- No FK on subject_id/object_id: polymorphic (source_id or claim_id).
-- Predicate is intentionally unconstrained text -- known values today are
-- same_work_as/version_of/related_guidance_for/cites/supersedes_source/
-- companion_to (source<->source) and supports/contradicts/updates/
-- supersedes/narrows/qualifies (claim<->claim) -- see docs/SCHEMA.md §3 in
-- the export. Do not infer edges from topical overlap (see docs/WORKFLOW.md
-- §8); only import edges Grok explicitly emits.

create index if not exists research_relationships_subject_idx on public.research_relationships (subject_type, subject_id);
create index if not exists research_relationships_object_idx on public.research_relationships (object_type, object_id);

alter table public.research_relationships enable row level security;
-- No client policies. Internal only.

-- ── 6. Verification queue (operational, Grok's own lane state) ────────
create table if not exists public.research_verification_queue (
  queue_id text primary key,
  lane text,
  item_type text,
  item_id text,
  priority integer,
  priority_band text,
  evidence_type text,
  source_role text,
  topics_raw text,
  status text,
  enqueued_on date,
  notes text,
  extras jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists research_verification_queue_status_idx on public.research_verification_queue (status);
create index if not exists research_verification_queue_item_idx on public.research_verification_queue (item_type, item_id);

alter table public.research_verification_queue enable row level security;
-- No client policies. Internal ops only.

create or replace function public.touch_research_verification_queue_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists research_verification_queue_touch_updated on public.research_verification_queue;
create trigger research_verification_queue_touch_updated
  before update on public.research_verification_queue
  for each row execute function public.touch_research_verification_queue_updated_at();

-- ── 7. Coverage (topic-level rollup snapshot, refreshed periodically) ──
create table if not exists public.research_coverage (
  topic text primary key references public.research_topics (topic) on delete cascade,
  source_count integer,
  verified_source_count integer,
  claim_count integer,
  verified_claim_count integer,
  newest_evidence_year integer,
  evidence_maturity text,
  computed_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.research_coverage enable row level security;
-- No client policies. Internal only for now; a future public library
-- landing page reads through research_public_pages instead (§10), not
-- this table directly, per the "don't blanket-expose research tables for
-- SEO" rule.

-- ── 8. Ingestion log (provenance / audit trail for every import run) ──
create table if not exists public.research_ingestion_log (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null,
  source_system text not null default 'grok-research-harvester',
  triggered_by text,
  dry_run boolean not null default false,
  status text not null default 'running'
    constraint research_ingestion_log_status_check check (status in ('running','success','partial','failed')),
  started_at timestamptz not null default timezone('utc'::text, now()),
  finished_at timestamptz,
  counts_before jsonb not null default '{}'::jsonb,
  counts_after jsonb not null default '{}'::jsonb,
  inserted_counts jsonb not null default '{}'::jsonb,
  updated_counts jsonb not null default '{}'::jsonb,
  rejected_counts jsonb not null default '{}'::jsonb,
  error_summary text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists research_ingestion_log_batch_idx on public.research_ingestion_log (batch_id);
create index if not exists research_ingestion_log_started_idx on public.research_ingestion_log (started_at desc);

alter table public.research_ingestion_log enable row level security;
-- No client policies. Service-role-only, same posture as admin_audit_log.

-- ── 9. Ingestion quarantine (malformed/rejected rows, held for review) ──
create table if not exists public.research_ingestion_quarantine (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null,
  record_type text not null,
  natural_id text,
  raw_payload jsonb not null,
  validation_errors jsonb not null default '[]'::jsonb,
  status text not null default 'pending'
    constraint research_ingestion_quarantine_status_check check (status in ('pending','resolved','discarded')),
  received_at timestamptz not null default timezone('utc'::text, now()),
  resolved_at timestamptz,
  resolved_by text,
  resolution_notes text
);

create index if not exists research_ingestion_quarantine_status_idx on public.research_ingestion_quarantine (status);
create index if not exists research_ingestion_quarantine_batch_idx on public.research_ingestion_quarantine (batch_id);

alter table public.research_ingestion_quarantine enable row level security;
-- No client policies. Service-role-only.

-- ── 10. Embeddings seam (schema-ready; no provider chosen yet) ─────────
-- Deliberately has NO vector column yet -- picking a dimension without an
-- embedding provider decision would be inventing one. A follow-up
-- migration adds `embedding extensions.vector(N)` once a provider/model is
-- approved (see PHASE 4 in the originating request). This table exists so
-- retrieval code and the ingestion pipeline can be written against a
-- stable interface today.
create table if not exists public.research_embeddings (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null constraint research_embeddings_entity_type_check check (entity_type in ('source','claim')),
  entity_id text not null,
  model_name text,
  model_version text,
  embedding_dim integer,
  status text not null default 'pending'
    constraint research_embeddings_status_check check (status in ('pending','generated','stale')),
  generated_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (entity_type, entity_id, model_name)
);

alter table public.research_embeddings enable row level security;
-- No client policies. Internal only.

-- ── 11. Public Knowledge Library pages (foundation, nothing published) ──
-- Status defaults to 'draft'. Nothing here is wired to a public route yet
-- (see PHASE 6 in the originating request) -- this table only prepares the
-- data shape so page generation has somewhere deterministic to read from
-- once AIMT approves specific topics.
create table if not exists public.research_public_pages (
  topic_slug text primary key,
  topic text references public.research_topics (topic) on delete set null,
  seo_title text,
  meta_description text,
  canonical_url text,
  summary_markdown text,
  key_claim_ids text[] not null default '{}',
  source_ids text[] not null default '{}',
  limitations_markdown text,
  practitioner_relevance_markdown text,
  related_topic_slugs text[] not null default '{}',
  related_course_slugs text[] not null default '{}',
  status text not null default 'draft'
    constraint research_public_pages_status_check check (status in ('draft','in_review','approved','published','archived')),
  sitemap_eligible boolean not null default false,
  structured_data jsonb,
  last_reviewed_on date,
  last_generated_at timestamptz,
  published_at timestamptz,
  generation_source_hash text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),

  constraint research_public_pages_published_requires_timestamp
    check (status <> 'published' or published_at is not null)
);

alter table public.research_public_pages enable row level security;

drop policy if exists "research_public_pages_select_published" on public.research_public_pages;
create policy "research_public_pages_select_published"
  on public.research_public_pages
  for select
  to anon, authenticated
  using (status = 'published');
-- No insert/update/delete policies for anon/authenticated by design.

create or replace function public.touch_research_public_pages_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists research_public_pages_touch_updated on public.research_public_pages;
create trigger research_public_pages_touch_updated
  before update on public.research_public_pages
  for each row execute function public.touch_research_public_pages_updated_at();

-- ── 12. Curriculum reference seam (future course-builder links) ───────
create table if not exists public.research_curriculum_links (
  id uuid primary key default gen_random_uuid(),
  research_topic text references public.research_topics (topic) on delete set null,
  research_claim_id text references public.research_claims (claim_id) on delete set null,
  course_slug text not null,
  module_label text,
  note text,
  created_by text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists research_curriculum_links_course_idx on public.research_curriculum_links (course_slug);

alter table public.research_curriculum_links enable row level security;
-- No client policies. Internal (course-builder tooling) only.
