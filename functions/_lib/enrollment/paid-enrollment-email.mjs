// Sends the branded "welcome, here's how to start" email via Resend for a
// real, paid Head Spa Certification purchase. Server-side only —
// functions/api/*.js Cloudflare Pages Functions rule from CLAUDE.md applies
// here too: plain ES module, zero npm dependencies, Web Crypto + fetch only.
//
// Template source of truth: docs/email-templates/custom-resend/enrollment-confirmation.html
// (see that file's own header comment + docs/stripe-and-email/AIMT-STRIPE-
// EMAIL-BRANDING-AUDIT-2026-09-15.md item 5 for full design rationale). The
// HTML below is that file's markup, unmodified, with its two {{PLACEHOLDER}}
// tokens replaced by template interpolation — there is no bundler/build step
// in this repo to import the .html file's text at request time, so it is
// inlined here instead. Same approach as
// functions/_lib/admin/manual-grant-invite-email.mjs, whose overall shape
// (idempotency key, never-throw send, missing-key/failure result objects)
// this module deliberately mirrors.
//
// Idempotency: key = `enrollment/<checkoutSessionId>`, one per paid
// checkout. Unlike the manual-grant helper (which leaves the dedupe lookup
// to its caller's admin_audit_log, an actor-scoped table this webhook has
// no equivalent of), this module owns its own dedupe check AND writes its
// own outcome row to aimt_logs — the generic, unscoped observability table
// stripe-webhook.js already writes to directly for its own concerns. Owning
// both halves here keeps a Stripe webhook retry's "was this already sent?"
// check correct without depending on the caller remembering to log the
// exact key in the exact queryable shape. Before sending, this queries
// aimt_logs for a prior `paid_enrollment_email_sent` row whose `message`
// equals this exact key, and skips re-sending if found. Resend's own
// `Idempotency-Key` header is still attached below as defense-in-depth, but
// correctness is anchored to the aimt_logs check, which is fully verifiable
// in tests.
//
// Failure semantics (owner's stated preference, same as the manual-grant
// helper): a failed send, or a missing RESEND_API_KEY, never throws and
// never rolls back the entitlement the webhook already wrote. The caller
// (functions/api/stripe-webhook.js) calls this strictly after
// upsertEntitlement() succeeds, and always returns 200 to Stripe regardless
// of what this function returns.

import { supabaseRest } from '../certification/auth.mjs';

const RESEND_API_URL = 'https://api.resend.com/emails';
const SENDER = 'AIMT <no-reply@auth.aimtrichology.com>';
const REPLY_TO = 'support@aimtrichology.com';
const SUBJECT = 'Welcome to the Head Spa Certification Course';
const AIMT_LOGS_TABLE = 'aimt_logs';
const SENT_EVENT_TYPE = 'paid_enrollment_email_sent';

export function paidEnrollmentEmailIdempotencyKey(checkoutSessionId) {
  return `enrollment/${checkoutSessionId}`;
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

// Mirrors docs/email-templates/custom-resend/enrollment-confirmation.html exactly.
function renderEnrollmentHtml({ firstName, courseEntryUrl }) {
  const safeFirstName = escapeHtml(firstName || 'there');
  const safeUrl = escapeHtml(courseEntryUrl);
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Welcome to Head Spa Certification Course</title>
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
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">Your enrollment is confirmed. Here's how to start the Head Spa Certification Course.&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<center class="aimt-bg" style="width:100%; background-color:#faf8f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding: 40px 16px;">
<table role="presentation" class="aimt-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">
  <tr><td align="center" style="padding-bottom: 28px;">
    <span class="aimt-wordmark" style="font-family:'Montserrat',Arial,sans-serif; font-size:11px; font-weight:700; letter-spacing:4px; color:#262626;">AIMT</span>
  </td></tr>
  <tr><td class="aimt-card" style="background:#ffffff; border:1px solid rgba(0,0,0,0.06); border-radius:16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td class="aimt-pad" style="padding: 44px 44px 8px;">
        <div style="font-family:'SF Mono','Fira Code',Consolas,monospace; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#a3968d;">Enrollment confirmed</div>
        <h1 class="aimt-h1" style="font-family:Georgia,'Playfair Display',serif; font-size:24px; line-height:1.3; color:#262626; font-weight:700; margin:10px 0 0;">Welcome to the Head Spa Certification Course, ${safeFirstName}</h1>
      </td></tr>
      <tr><td class="aimt-pad" style="padding: 18px 44px 0;">
        <p class="aimt-body" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; font-size:15px; line-height:1.65; color:#262626; margin:0;">
          You're enrolled. Your certification training — all 12 modules, your Cadence AI tutor, checkpoints, and your certificate on completion — is ready in My AIMT whenever you are.
        </p>
      </td></tr>
      <tr><td align="left" class="aimt-pad" style="padding: 28px 44px 8px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td class="aimt-btn-td" style="border-radius:999px; background:#262626;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${safeUrl}" style="height:46px;v-text-anchor:middle;width:220px;" arcsize="50%" strokecolor="#262626" fillcolor="#262626">
            <w:anchorlock/>
            <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:1.2px;">ENTER MY AIMT</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="${safeUrl}" class="aimt-btn-a" style="font-family:Arial,sans-serif; font-size:12px; font-weight:600; letter-spacing:1.2px; text-transform:uppercase; color:#ffffff; text-decoration:none; padding:15px 32px; border-radius:999px; display:inline-block;">Enter My AIMT</a>
            <!--<![endif]-->
          </td>
        </tr></table>
      </td></tr>
      <tr><td class="aimt-pad" style="padding: 8px 44px 44px;">
        <p class="aimt-body aimt-muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; font-size:13px; line-height:1.6; color:#a3968d; margin:0;">
          This is your AIMT welcome note, separate from your payment receipt from Stripe. Keep both for your records. Questions: <a href="mailto:support@aimtrichology.com" style="color:#5a4b3f;">support@aimtrichology.com</a>.
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

async function logOutcome(env, { eventType, email, message }) {
  try {
    await supabaseRest(env, AIMT_LOGS_TABLE, {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        event_type: eventType,
        source: 'api/stripe-webhook',
        email: email || null,
        user_id: null,
        message: message || null,
      }),
    });
  } catch {
    // Best-effort observability only — a logging failure must never affect
    // whether the email was actually sent or the webhook's own response.
  }
}

async function wasAlreadySent(env, idempotencyKey) {
  try {
    const params = new URLSearchParams({
      select: 'id',
      event_type: `eq.${SENT_EVENT_TYPE}`,
      message: `eq.${idempotencyKey}`,
      limit: '1',
    });
    const res = await supabaseRest(env, `${AIMT_LOGS_TABLE}?${params}`);
    return !!(res.ok && Array.isArray(res.body) && res.body.length > 0);
  } catch {
    // A dedupe-check read failure should never block a legitimate first
    // send; fall through and attempt the send normally.
    return false;
  }
}

/**
 * Sends the paid-enrollment welcome email for a real, paid Head Spa
 * Certification checkout. Never throws — every failure mode (missing key,
 * non-2xx from Resend, network error) is returned as a plain result object
 * so the caller can preserve the entitlement it already wrote and surface a
 * warning instead.
 *
 * @returns {Promise<{attempted:boolean, sent:boolean, idempotencyKey:string, deduped?:boolean, reason?:string, status?:number, errorMessage?:string}>}
 */
export async function sendPaidEnrollmentEmail(env, { checkoutSessionId, email, firstName, courseEntryUrl }) {
  const idempotencyKey = paidEnrollmentEmailIdempotencyKey(checkoutSessionId);

  if (!env.RESEND_API_KEY) {
    await logOutcome(env, {
      eventType: 'paid_enrollment_email_skipped',
      email,
      message: `${idempotencyKey} missing_api_key`,
    });
    return {
      attempted: false,
      sent: false,
      idempotencyKey,
      reason: 'missing_api_key',
    };
  }

  if (await wasAlreadySent(env, idempotencyKey)) {
    return { attempted: false, sent: true, idempotencyKey, deduped: true };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        // Defense-in-depth only — see module header. Correctness relies on
        // the aimt_logs dedupe check above, not on this header.
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        from: SENDER,
        to: [email],
        reply_to: REPLY_TO,
        subject: SUBJECT,
        html: renderEnrollmentHtml({ firstName, courseEntryUrl }),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      await logOutcome(env, {
        eventType: 'paid_enrollment_email_failed',
        email,
        message: `${idempotencyKey} resend_http_${response.status}`,
      });
      return {
        attempted: true,
        sent: false,
        idempotencyKey,
        reason: 'resend_error',
        status: response.status,
        errorMessage: errorBody?.message || errorBody?.error || null,
      };
    }

    await logOutcome(env, { eventType: SENT_EVENT_TYPE, email, message: idempotencyKey });
    return { attempted: true, sent: true, idempotencyKey };
  } catch (error) {
    await logOutcome(env, {
      eventType: 'paid_enrollment_email_failed',
      email,
      message: `${idempotencyKey} network_error`,
    });
    return {
      attempted: true,
      sent: false,
      idempotencyKey,
      reason: 'network_error',
      errorMessage: error?.message || String(error),
    };
  }
}
