/* ═══════════════════════════════════════════════════════════════
   Password-reset email — server-side hotfix path
   ---------------------------------------------------------------
   POST /api/request-password-reset
   Body: { email }

   Replaces ONLY the request-side half of student-access.html's forgot-
   password flow. Supabase's built-in mailer (Auth → Custom SMTP) has been
   confirmed unreliable in production: /auth/v1/recover returns 200, but
   recovery_sent_at on auth.users never advances and Resend never receives
   the send — true even for a call that reached the real handler for a
   real, existing, confirmed account (see the incident audit this hotfix
   responds to). This endpoint sidesteps GoTrue's mailer entirely:

     1. POST {SUPABASE_URL}/auth/v1/admin/generate_link (type: "recovery")
        using the service-role key -- Supabase's documented Admin API for
        minting a recovery action link WITHOUT sending any email itself.
     2. Send that action_link ourselves, directly through Resend's HTTP
        API -- the same transport already proven working for the manual-
        grant invite (functions/_lib/admin/manual-grant-invite-email.mjs).

   The existing recovery-LINK landing flow in student-access.html
   (detectSessionInUrl, the PASSWORD_RECOVERY auth-state-change handler,
   the recovery panel, updateUser({password}), sign-out after success) is
   completely untouched by this hotfix -- Supabase still issues and
   verifies the token that link carries; only who emails it, and how,
   has changed.

   Enumeration safety: every response to the caller is one of exactly two
   shapes -- the generic { ok:true, message } success body, or a generic
   { error } failure body for a request-level or global-configuration
   problem. A nonexistent or ineligible account is indistinguishable from
   a real send: both return the generic 200. See onRequestPost() below
   for the exact decision table.

   Nothing in this file ever logs, and the public response never
   contains, the generated action_link, its token, its OTP, or either
   server secret (SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY).

   public.aimt_logs is separately known to be missing in production
   (confirmed via live schema/migration audit) -- this endpoint does not
   depend on it and does not attempt to write to it. That gap is tracked
   as its own follow-up, not part of this hotfix.
   ═══════════════════════════════════════════════════════════════ */

import { json } from '../_lib/certification/auth.mjs';
import { checkRateLimit } from '../_lib/cadence/rate-limit.mjs';

const REDIRECT_TO = 'https://aimtrichology.com/student-access.html';
const RESEND_API_URL = 'https://api.resend.com/emails';
const SENDER = 'AIMT <no-reply@auth.aimtrichology.com>';
const REPLY_TO = 'support@aimtrichology.com';
const SUBJECT = 'Reset your AIMT password';

// Conservative, per docs/... hotfix spec. Email-keyed is the tight bound
// ("1 request/minute per email"); IP-keyed is deliberately a bit looser
// since a shared office/school IP can legitimately represent several
// different students in the same minute -- it exists to blunt a single
// bad actor hammering many addresses from one IP, not to gate normal use.
const EMAIL_RATE_LIMIT = { perMinute: 1, perDay: 5 };
const IP_RATE_LIMIT = { perMinute: 5, perDay: 30 };

const GENERIC_OK = Object.freeze({
  ok: true,
  message: 'If an AIMT account exists for that email, a password reset link has been sent.',
});
const GENERIC_FAILURE = Object.freeze({
  error: 'Unable to process this request right now.',
});

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

// Shape-only check -- never the authority on whether an account exists.
// Supabase's own admin API is that authority (via the enumeration-safe
// generate_link branch below), matching the same non-committal front-door
// validation every other public form endpoint in this codebase uses.
function isPlausibleEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

// Mirrors docs/email-templates/supabase-auth/reset-password.html exactly,
// with its Supabase-template {{ .ConfirmationURL }} placeholder replaced by
// the server-generated, escaped action_link -- same adaptation pattern
// functions/_lib/admin/manual-grant-invite-email.mjs already uses for its
// own template source.
function renderResetHtml({ actionLink }) {
  const safeUrl = escapeHtml(actionLink);
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Reset your AIMT password</title>
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
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">Reset your AIMT password. This link expires soon.&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<center class="aimt-bg" style="width:100%; background-color:#faf8f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding: 40px 16px;">
<table role="presentation" class="aimt-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">
  <tr><td align="center" style="padding-bottom: 28px;">
    <span class="aimt-wordmark" style="font-family:'Montserrat',Arial,sans-serif; font-size:11px; font-weight:700; letter-spacing:4px; color:#262626;">AIMT</span>
  </td></tr>
  <tr><td class="aimt-card" style="background:#ffffff; border:1px solid rgba(0,0,0,0.06); border-radius:16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td class="aimt-pad" style="padding: 44px 44px 8px;">
        <div style="font-family:'SF Mono','Fira Code',Consolas,monospace; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#a3968d;">Password reset</div>
        <h1 class="aimt-h1" style="font-family:Georgia,'Playfair Display',serif; font-size:24px; line-height:1.3; color:#262626; font-weight:700; margin:10px 0 0;">Reset your password</h1>
      </td></tr>
      <tr><td class="aimt-pad" style="padding: 18px 44px 0;">
        <p class="aimt-body" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; font-size:15px; line-height:1.65; color:#262626; margin:0;">
          We received a request to reset the password on your AIMT account. Click below to set a new one. This link is time-limited and can only be used once.
        </p>
      </td></tr>
      <tr><td align="left" class="aimt-pad" style="padding: 28px 44px 8px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td class="aimt-btn-td" style="border-radius:999px; background:#262626;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${safeUrl}" style="height:46px;v-text-anchor:middle;width:220px;" arcsize="50%" strokecolor="#262626" fillcolor="#262626">
            <w:anchorlock/>
            <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:1.2px;">RESET PASSWORD</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="${safeUrl}" class="aimt-btn-a" style="font-family:Arial,sans-serif; font-size:12px; font-weight:600; letter-spacing:1.2px; text-transform:uppercase; color:#ffffff; text-decoration:none; padding:15px 32px; border-radius:999px; display:inline-block;">Reset Password</a>
            <!--<![endif]-->
          </td>
        </tr></table>
      </td></tr>
      <tr><td class="aimt-pad" style="padding: 8px 44px 44px;">
        <p class="aimt-body aimt-muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; font-size:13px; line-height:1.6; color:#a3968d; margin:0;">
          If the button doesn't work, copy and paste this link: <a href="${safeUrl}" style="color:#5a4b3f;">${safeUrl}</a><br><br>
          If you didn't request this, you can ignore this email — your password will not change.
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

/* Supabase's documented Admin API for minting an action link without
   triggering GoTrue's own mailer. Any non-ok response (including "user
   not found", which Supabase reports for a nonexistent/ineligible email)
   is folded into the same enumeration-safe generic result by the caller
   -- this function itself never distinguishes "why" beyond ok/not-ok. */
async function generateRecoveryLink(env, email) {
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'recovery', email, redirect_to: REDIRECT_TO }),
  });
  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, actionLink: body && typeof body.action_link === 'string' ? body.action_link : null };
}

async function sendResetEmail(env, { email, actionLink }) {
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: SENDER,
      to: [email],
      reply_to: REPLY_TO,
      subject: SUBJECT,
      html: renderResetHtml({ actionLink }),
    }),
  });
  return { ok: response.ok };
}

/* Cloudflare Pages Functions dispatches by exported method name; only
   onRequestPost is exported below, so GET/PUT/DELETE/etc. against this
   path 405 at the platform routing layer before this file's code ever
   runs -- the same convention every other endpoint in functions/api/
   already relies on (no explicit method switch anywhere in this repo). */
export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const email = normalizeEmail(body && body.email);
  if (!email || !isPlausibleEmail(email)) {
    return json({ error: 'Enter a valid email address.' }, 400);
  }

  // Global misconfiguration -- generic 500, no account-specific info
  // either way (explicitly sanctioned by the hotfix spec this responds
  // to). Checked before touching Supabase/Resend at all.
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.RESEND_API_KEY) {
    return json(GENERIC_FAILURE, 500);
  }

  // Rate limit BEFORE any Supabase/Resend call -- a limited request must
  // have zero side effects. Always resolves to the exact same success
  // body a real send would, so the limiter itself can never be used to
  // distinguish "this email exists" from "this email doesn't."
  const ip = request.headers.get('cf-connecting-ip') || '';
  const emailLimited = checkRateLimit(`password_reset_request:email:${email}`, EMAIL_RATE_LIMIT);
  const ipLimited = ip ? checkRateLimit(`password_reset_request:ip:${ip}`, IP_RATE_LIMIT) : null;
  if (emailLimited || ipLimited) {
    return json(GENERIC_OK, 200);
  }

  try {
    const link = await generateRecoveryLink(env, email);
    // Covers a nonexistent account, an ineligible one, and any other
    // Supabase Admin API failure or unexpected response shape alike --
    // deliberately not distinguished, so this branch alone can never leak
    // account existence. See module header.
    if (!link.ok || !link.actionLink) {
      return json(GENERIC_OK, 200);
    }

    const sendResult = await sendResetEmail(env, { email, actionLink: link.actionLink });
    if (!sendResult.ok) {
      // A real, eligible account's link was minted but our own send
      // failed -- a genuine operational problem. A generic 500 here is
      // explicitly sanctioned by the hotfix spec; it still carries no
      // account-specific detail, no link, no token.
      return json(GENERIC_FAILURE, 500);
    }

    return json(GENERIC_OK, 200);
  } catch (_) {
    // Any unexpected exception (network error mid-flow, etc.) -- generic
    // failure, never the underlying error message, which could otherwise
    // echo back provider detail.
    return json(GENERIC_FAILURE, 500);
  }
}
