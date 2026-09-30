// Sends the branded "your AIMT account is ready" invite email via Resend
// for brand-new Auth accounts created through a staff/admin manual grant
// (grantAccess() in functions/api/admin/index.js). Server-side only —
// functions/api/*.js Cloudflare Pages Functions rule from CLAUDE.md applies
// here too: plain ES module, zero npm dependencies, Web Crypto + fetch only.
//
// Rendering: the shared AIMT email shell (functions/_lib/email/
// aimt-email-shell.mjs). renderInviteHtml()/renderInviteText() below are the
// source of truth; docs/email-templates/custom-resend/invite-manual-grant.
// {html,txt} are generated FROM them by scripts/build-email-templates.mjs.
// The CTA always points at the canonical production Student Access URL —
// never the origin of whatever domain the admin page happened to be open on.
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
import {
  renderEmail, paragraph, steps, button, textFooter, welcomeHeadline,
  welcomeHeadlineText, SUPPORT_LINK, SUPPORT_EMAIL, STUDENT_ACCESS_URL,
} from '../email/aimt-email-shell.mjs';

const RESEND_API_URL = 'https://api.resend.com/emails';
const SENDER = 'AIMT <no-reply@auth.aimtrichology.com>';
const REPLY_TO = 'support@aimtrichology.com';
const SUBJECT = 'Your AIMT student access is ready';
const AUDIT_LOOKUP_ACTION = 'grant_course_access';

export function manualGrantInviteIdempotencyKey(grantId) {
  return `admin-grant/${grantId}`;
}

export const INVITE_SUBJECT = SUBJECT;

const INVITE_BODY = 'An AIMT student account has been created for you with access to the Head Spa Certification Course. Set your password to sign in for the first time.';
const INVITE_STEPS = [
  'Open Student Access.',
  'Select “Forgot your password?” and enter this email address.',
  'Use the link we send you to choose a password, then sign in.',
];

export function renderInviteHtml({ firstName }) {
  return renderEmail({
    title: SUBJECT,
    preheader: 'Set your password to begin the Head Spa Certification Course.',
    eyebrow: 'Student access',
    headline: welcomeHeadline(firstName),
    content: [
      paragraph(INVITE_BODY),
      steps(INVITE_STEPS.map((text) => ({ text })), { top: 18 }),
      button({ label: 'Open Student Access', href: STUDENT_ACCESS_URL, width: 250 }),
      paragraph(`Questions? Reply to this email or contact ${SUPPORT_LINK}.`, { top: 28, size: 14 }),
    ].join('\n      '),
  });
}

export function renderInviteText({ firstName }) {
  return [
    'AIMT',
    '',
    'STUDENT ACCESS',
    '',
    welcomeHeadlineText(firstName),
    '',
    INVITE_BODY,
    '',
    ...INVITE_STEPS.map((text, i) => `${i + 1}. ${text}`),
    '',
    'Open Student Access:',
    STUDENT_ACCESS_URL,
    '',
    `Questions? Reply to this email or contact ${SUPPORT_EMAIL}.`,
    '',
    textFooter(),
  ].join('\n');
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
export async function sendManualGrantInviteEmail(env, { grantId, email, firstName }) {
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
        html: renderInviteHtml({ firstName }),
        text: renderInviteText({ firstName }),
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
