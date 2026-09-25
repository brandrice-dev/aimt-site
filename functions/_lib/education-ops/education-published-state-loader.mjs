/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations v1 — live published-state loader
   ---------------------------------------------------------------
   READ-ONLY. This is the RUNTIME AUTHORITY for two facts the
   orchestrator must never hardcode:
     - which topics are currently live (status='published' AND
       sitemap_eligible=true on research_public_pages) -- used to
       exclude published topics from new-page selection, to compute
       cannibalization, and to pick the freshness-scan candidate set.
     - how many pages have actually published in the current week --
       used to enforce AIMT_EDUCATION_MAX_PAGES_PER_WEEK.

   education-topic-selector.mjs's own PUBLISHED_TOPIC_SLUGS constant
   remains a fixture/history default for pure unit tests ONLY. The real
   CLI (scripts/education-operations-cycle.mjs) always resolves both
   facts from THIS module against the live database, so a newly
   published page is recognized automatically on the very next run,
   with no code change.

   Week definition (documented, deterministic, UTC): the CURRENT UTC
   CALENDAR WEEK, Monday 00:00:00 UTC through the following Monday
   00:00:00 UTC (exclusive). Not a rolling 7 days.
   ═══════════════════════════════════════════════════════════════ */

export class PublishedStateLoaderError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PublishedStateLoaderError';
  }
}

function requireSupabaseEnv(env, fnName) {
  if (!env || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new PublishedStateLoaderError(`${fnName}: missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY`);
  }
}

/**
 * PURE. Given a reference Date, returns the UTC calendar week's bounds
 * (Monday 00:00:00 UTC through the following Monday 00:00:00 UTC,
 * exclusive) that the reference date falls in.
 *
 * @param {Date} [referenceDate]
 * @returns {{weekStart: Date, weekEnd: Date}}
 */
export function computeUtcCalendarWeekBounds(referenceDate = new Date()) {
  const dayStart = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate()));
  const dayOfWeek = dayStart.getUTCDay(); // 0=Sunday .. 6=Saturday
  const daysSinceMonday = (dayOfWeek + 6) % 7; // Monday -> 0, Sunday -> 6
  const weekStart = new Date(dayStart);
  weekStart.setUTCDate(dayStart.getUTCDate() - daysSinceMonday);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);
  return { weekStart, weekEnd };
}

/**
 * Read-only live fetch: the topic_slugs currently authoritative as
 * "published" (status='published' AND sitemap_eligible=true). This is
 * the ONLY thing that should ever answer "what is live right now" for
 * the orchestrator -- never a hardcoded list.
 *
 * @param {Object} env - SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * @returns {Promise<string[]>}
 */
export async function fetchPublishedTopicSlugsLive(env) {
  requireSupabaseEnv(env, 'fetchPublishedTopicSlugsLive');
  const qs = new URLSearchParams();
  qs.set('select', 'topic_slug');
  qs.set('status', 'eq.published');
  qs.set('sitemap_eligible', 'eq.true');
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/research_public_pages?${qs.toString()}`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) {
    throw new PublishedStateLoaderError(`fetchPublishedTopicSlugsLive: query failed (${res.status}): ${(await res.text().catch(() => '')).slice(0, 500)}`);
  }
  const rows = await res.json();
  return rows.map((r) => r.topic_slug);
}

/**
 * Read-only live count: how many pages actually reached status=published
 * during the current UTC calendar week (see computeUtcCalendarWeekBounds
 * above for the exact, documented boundary). This is the ONLY source
 * AIMT_EDUCATION_MAX_PAGES_PER_WEEK should ever be checked against in a
 * real run -- never a caller-supplied number in production.
 *
 * @param {Object} env - SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * @param {{referenceDate?: Date}} [options]
 * @returns {Promise<{count: number, week_start: string, week_end: string, week_definition: string}>}
 */
export async function countPagesPublishedThisWeekLive(env, { referenceDate = new Date() } = {}) {
  requireSupabaseEnv(env, 'countPagesPublishedThisWeekLive');
  const { weekStart, weekEnd } = computeUtcCalendarWeekBounds(referenceDate);
  const qs = new URLSearchParams();
  qs.set('select', 'topic_slug');
  qs.set('status', 'eq.published');
  qs.append('published_at', `gte.${weekStart.toISOString()}`);
  qs.append('published_at', `lt.${weekEnd.toISOString()}`);
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/research_public_pages?${qs.toString()}`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) {
    throw new PublishedStateLoaderError(`countPagesPublishedThisWeekLive: query failed (${res.status}): ${(await res.text().catch(() => '')).slice(0, 500)}`);
  }
  const rows = await res.json();
  return {
    count: rows.length,
    week_start: weekStart.toISOString(),
    week_end: weekEnd.toISOString(),
    week_definition: 'utc_calendar_week_monday_00:00_to_next_monday_00:00_exclusive',
  };
}
