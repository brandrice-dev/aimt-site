/* ═══════════════════════════════════════════════════════════════
   Issue Certificate — student retrieval / safe retry fallback
   ---------------------------------------------------------------
   POST /api/issue-certificate
   Headers: Authorization: Bearer <supabase access token>

   Credentials are issued AUTOMATICALLY when finalize-assessment.js records
   an authoritative PASS. This endpoint is what Module 12's "View
   Certificate" button calls: it normally just returns the already-issued
   credential (already_issued: true), and only issues one if a transient
   failure prevented automatic issuance.

   All trust gates (entitlement, server-synced completion, authoritative
   PASS, one credential per student, revoked never replaced, server-side
   official name) live in the ONE shared authority,
   functions/_lib/certification/certificate-issuance.mjs. Any
   `student_name` in the request body is ignored — the official name is
   resolved server-side and an issued certificate's name never changes.

   Uses existing env vars only: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
   ═══════════════════════════════════════════════════════════════ */

import { json, hasSupabaseEnv, resolveUser } from '../_lib/certification/auth.mjs';
import { ensureCertificateIssued } from '../_lib/certification/certificate-issuance.mjs';

const STATUS_HTTP = {
  revoked: 409,
  not_entitled: 403,
  incomplete: 409,
  not_passed: 409,
  name_required: 409,
  error: 500,
};

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!hasSupabaseEnv(env)) return json({ error: 'Misconfigured' }, 500);

  const { user, errorResponse } = await resolveUser(env, request);
  if (errorResponse) return errorResponse;

  let result;
  try {
    result = await ensureCertificateIssued(env, user);
  } catch (_) {
    return json({ error: 'Could not issue certificate — please try again.' }, 500);
  }

  if (!result.ok) {
    return json({ error: result.message, status: result.status }, STATUS_HTTP[result.status] || 500);
  }
  return json({
    credential_id: result.credential.credential_id,
    student_name: result.credential.student_name,
    completed_at: result.credential.completed_at,
    already_issued: result.status === 'already_issued',
  });
}
