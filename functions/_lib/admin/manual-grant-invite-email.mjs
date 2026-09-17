// Sends the branded "your AIMT account is ready" invite email via Resend
// for brand-new Auth accounts created through a staff/admin manual grant
// (grantAccess() in functions/api/admin/index.js). Server-side only —
// functions/api/*.js Cloudflare Pages Functions rule from CLAUDE.md applies
// here too: plain ES module, zero npm dependencies, Web Crypto + fetch only.
//
// Template source of truth: docs/email-templates/custom-resend/invite-manual-grant.html
// (see that file's own header comment + docs/email-templates/AIMT-EMAIL-TEMPLATES-SETUP.md
// item 4 for full design rationale). The HTML below is that file's markup,
// unmodified, with its two {{PLACEHOLDER}} tokens replaced by template
// interpolation — there is no bundler/build step in this repo to import the
// .html file's text at request time, so it is inlined here instead.
//
// Idempotency (see AIMT-STRIPE-EMAIL-BRANDING-AUDIT-2026-09-15.md item 6):
// key = `admin-grant/<grantId>`, one per manual-grant event. Before sending,
// this scans existing admin_audit_log `grant_course_access` rows for one
// that already recorded a successful send under this exact key, and skips
// re-sending if found — a dedupe-before-send guard, not reliance on
// Resend's own Idempotency-Key header. That header is still attached below
// as defense-in-depth, but this environment has no way to place a real call
// against the live Resend API to confirm its idempotency contract, so
// correctness is anchored to something fully verifiable in tests instead:
// this repo's own audit trail.
//
// Failure semantics (owner's stated preference): a failed send, or a
// missing RESEND_API_KEY, never throws and never rolls back the
// already-created entitlement/account. The caller (grantAccess) folds the
// returned result into the one admin_audit_log row it already writes and
// into its JSON response, so the owner can see the warning. No auto-resend
// is implemented here — resending later is a manual, out-of-band action.
//
// This module never writes to course_progress, completions, or
// certification_attempts, and never writes its own separate audit row —
// see functions/api/admin/index.js for why (folding into the single
// existing grant_course_access row keeps one manual grant = one audit row).

import { supabaseRest } from '../certification/auth.mjs';

const RESEND_API_URL = 'https://api.resend.com/emails';
const SENDER = 'AIMT <no-reply@auth.aimtrichology.com>';
const REPLY_TO = 'support@aimtrichology.com';
const SUBJECT = 'Your AIMT account is ready';
const AUDIT_LOOKUP_ACTION = 'grant_course_access';

export function manualGrantInviteIdempotencyKey(grantId) {
  return `admin-grant/${grantId}`;
}

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

// Mirrors docs/email-templates/custom-resend/invite-manual-grant.html exactly.
function renderInviteHtml({ firstName, studentAccessUrl }) {
  const safeFirstName = escapeHtml(firstName || 'there');
  const safeUrl = escapeHtml(studentAccessUrl);
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Your AIMT account is ready</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: #faf8f5; }
  @media (prefers-color-scheme: dark) {
    .aimt-bg { background-color: #1a1814 !important; }
    .aimt-card { background-color: #262626 !important; border-color: rgba(255,255,255,0.08) !important; }
    .aimt-h1, .aimt-body { color: #ffffff !important; }
    .aimt-muted { color: rgba(255,255,255,0.5) !important; }
    .aimt-btn-td { background-color: #f2eee8 !important; }
    .aimt-btn-a { color: #1a1714 !important; }
    .aimt-wordmark { color: #ffffff !important; }
  }
  @media screen and (max-width: 600px) {
    .aimt-container { width: 100% !important; }
    .aimt-pad { padding-left: 24px !important; padding-right: 24px !important; }
  }
</style>
</head>
<body class="aimt-bg" style="margin:0; padding:0; background-color:#faf8f5;">
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">Your AIMT account has been created. Set your password to begin.&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<center class="aimt-bg" style="width:100%; background-color:#faf8f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding: 40px 16px;">
<table role="presentation" class="aimt-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">
  <tr><td align="center" style="padding-bottom: 28px;">
    <span class="aimt-wordmark" style="font-family:'Montserrat',Arial,sans-serif; font-size:11px; font-weight:700; letter-spacing:4px; color:#262626;">AIMT</span>
  </td></tr>
  <tr><td class="aimt-card" style="background:#ffffff; border:1px solid rgba(0,0,0,0.06); border-radius:16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td class="aimt-pad" style="padding: 44px 44px 8px;">
        <div style="font-family:'SF Mono','Fira Code',Consolas,monospace; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#a3968d;">Your account is ready</div>
        <h1 class="aimt-h1" style="font-family:Georgia,'Playfair Display',serif; font-size:24px; line-height:1.3; color:#262626; font-weight:700; margin:10px 0 0;">Welcome to AIMT, ${safeFirstName}</h1>
      </td></tr>
      <tr><td class="aimt-pad" style="padding: 18px 44px 0;">
        <p class="aimt-body" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; font-size:15px; line-height:1.65; color:#262626; margin:0;">
          An AIMT account has been created for you. Before you can sign in, set your password: go to Student Access and select <strong>"Forgot your password?"</strong> — you'll get a secure link by email to choose your password, then you can sign in normally.
        </p>
      </td></tr>
      <tr><td align="left" class="aimt-pad" style="padding: 28px 44px 8px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td class="aimt-btn-td" style="border-radius:999px; background:#262626;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${safeUrl}" style="height:46px;v-text-anchor:middle;width:260px;" arcsize="50%" strokecolor="#262626" fillcolor="#262626">
            <w:anchorlock/>
            <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:1.2px;">GO TO STUDENT ACCESS</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="${safeUrl}" class="aimt-btn-a" style="font-family:Arial,sans-serif; font-size:12px; font-weight:600; letter-spacing:1.2px; text-transform:uppercase; color:#ffffff; text-decoration:none; padding:15px 32px; border-radius:999px; display:inline-block;">Go to Student Access</a>
            <!--<![endif]-->
          </td>
        </tr></table>
      </td></tr>
      <tr><td class="aimt-pad" style="padding: 8px 44px 44px;">
        <p class="aimt-body aimt-muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; font-size:13px; line-height:1.6; color:#a3968d; margin:0;">
          If the button doesn't work, visit ${safeUrl} directly. Questions about your enrollment: <a href="mailto:support@aimtrichology.com" style="color:#5a4b3f;">support@aimtrichology.com</a>.
        </p>
      </td></tr>
    </table>
  </td></tr>
  <tr><td align="center" style="padding: 28px 20px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; font-size:12px; line-height:1.7; color:#a3968d;">
    AIMT — American Institute of Modern Trichology<br>
    Questions? <a href="mailto:support@aimtrichology.com" style="color:#a3968d;">support@aimtrichology.com</a><br>
    <a href="https://aimtrichology.com/terms.html" style="color:#a3968d;">Terms</a> &middot; <a href="https://aimtrichology.com/privacy.html" style="color:#a3968d;">Privacy</a> &middot; <a href="https://aimtrichology.com/refunds.html" style="color:#a3968d;">Refunds</a>
  </td></tr>
</table>
</td></tr></table>
</center>
</body>
</html>`;
}

async function findPriorSuccessfulSend(env, idempotencyKey) {
  const params = new URLSearchParams({
    select: 'id,action,details,created_at',
    action: `eq.${AUDIT_LOOKUP_ACTION}`,
    order: 'created_at.desc',
    limit: '500',
  });
  const res = await supabaseRest(env, `admin_audit_log?${params}`);
  if (!res.ok || !Array.isArray(res.body)) return null;
  return (
    res.body.find((row) => {
      const invite = row?.details?.inviteEmail;
      return !!invite && invite.idempotencyKey === idempotencyKey && invite.sent === true;
    }) || null
  );
}

/**
 * Sends the manual-grant invite email for a brand-new AIMT account. Never
 * throws — every failure mode (missing key, non-2xx from Resend, network
 * error) is returned as a plain result object so the caller can preserve
 * the entitlement it already created and surface a warning instead.
 *
 * @returns {Promise<{attempted:boolean, sent:boolean, idempotencyKey:string, deduped?:boolean, reason?:string, warning?:string, status?:number, errorMessage?:string}>}
 */
export async function sendManualGrantInviteEmail(env, { grantId, email, firstName, studentAccessUrl }) {
  const idempotencyKey = manualGrantInviteIdempotencyKey(grantId);

  if (!env.RESEND_API_KEY) {
    return {
      attempted: false,
      sent: false,
      idempotencyKey,
      reason: 'missing_api_key',
      warning: 'RESEND_API_KEY is not configured — no invite email was sent. Tell the student manually to use "Forgot your password?" on Student Access.',
    };
  }

  try {
    const priorSend = await findPriorSuccessfulSend(env, idempotencyKey);
    if (priorSend) {
      return { attempted: false, sent: true, idempotencyKey, deduped: true };
    }
  } catch {
    // A dedupe-check read failure should never block a legitimate first send;
    // fall through and attempt the send normally.
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        // Defense-in-depth only — see module header. Correctness relies on
        // the admin_audit_log dedupe check above, not on this header.
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        from: SENDER,
        to: [email],
        reply_to: REPLY_TO,
        subject: SUBJECT,
        html: renderInviteHtml({ firstName, studentAccessUrl }),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      return {
        attempted: true,
        sent: false,
        idempotencyKey,
        reason: 'resend_error',
        status: response.status,
        errorMessage: errorBody?.message || errorBody?.error || null,
        warning: `Invite email failed to send (Resend responded ${response.status}). Notify the student manually — their account and course access were still created.`,
      };
    }

    return { attempted: true, sent: true, idempotencyKey };
  } catch (error) {
    return {
      attempted: true,
      sent: false,
      idempotencyKey,
      reason: 'network_error',
      errorMessage: error?.message || String(error),
      warning: 'Invite email failed to send (network error). Notify the student manually — their account and course access were still created.',
    };
  }
}
