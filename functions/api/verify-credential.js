/* ═══════════════════════════════════════════════════════════════
   Verify Credential — public lookup for employers/boards
   GET /api/verify-credential?id=AIMT-HSM-2026-XXXXXX
   Returns validity + course + student name + completion date.
   No auth required (that's the point), but only exposes what a
   paper certificate would show anyway.
   ═══════════════════════════════════════════════════════════════ */

const COURSE_NAMES = {
  'headspa-mastery': 'HeadSpa Mastery — Head Spa Practitioner Certification'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'Misconfigured' }, 500);
  }

  const url = new URL(request.url);
  const id = String(url.searchParams.get('id') || '').trim().toUpperCase();

  /* AIMT-XXX-YYYY-XXXXXX shape check before touching the database */
  if (!/^AIMT-[A-Z]{2,6}-\d{4}-[A-Z2-9]{4,10}$/.test(id)) {
    return json({ valid: false, reason: 'not_found' });
  }

  const params = new URLSearchParams({
    select: 'credential_id,course_slug,student_name,completed_at,revoked',
    credential_id: `eq.${id}`,
    limit: '1'
  });
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/completions?${params}`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );
  if (!res.ok) return json({ error: 'Lookup failed — try again.' }, 500);

  const rows = await res.json().catch(() => []);
  if (!Array.isArray(rows) || !rows.length) {
    return json({ valid: false, reason: 'not_found' });
  }

  const row = rows[0];
  if (row.revoked) {
    return json({ valid: false, reason: 'revoked' });
  }

  return json({
    valid: true,
    credential_id: row.credential_id,
    course: COURSE_NAMES[row.course_slug] || row.course_slug,
    student_name: row.student_name,
    completed_at: row.completed_at
  });
}
