// Sends the branded "welcome, here's how to start" email via Resend for a
// real, paid Head Spa Certification purchase. Server-side only —
// functions/api/*.js Cloudflare Pages Functions rule from CLAUDE.md applies
// here too: plain ES module, zero npm dependencies, Web Crypto + fetch only.
//
// Rendering: the shared AIMT email shell (functions/_lib/email/
// aimt-email-shell.mjs). renderEnrollmentHtml()/renderEnrollmentText()
// below are the source of truth; docs/email-templates/custom-resend/
// enrollment-confirmation.{html,txt} are generated FROM them by
// scripts/build-email-templates.mjs (tests fail if the docs copies drift).
// Every send carries an intentional plain-text part alongside the HTML.
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
import {
  renderEmail, paragraph, sectionLabel, bulletList, steps, button, divider,
  link, textFooter, welcomeHeadline, welcomeHeadlineText, escapeHtml,
  SUPPORT_LINK, SUPPORT_EMAIL, STUDENT_ACCESS_URL, COLORS,
} from '../email/aimt-email-shell.mjs';

const RESEND_API_URL = 'https://api.resend.com/emails';
const SENDER = 'AIMT <no-reply@auth.aimtrichology.com>';
const REPLY_TO = 'support@aimtrichology.com';
const SUBJECT = 'Your AIMT enrollment is confirmed';
const AIMT_LOGS_TABLE = 'aimt_logs';
const SENT_EVENT_TYPE = 'paid_enrollment_email_sent';

export function paidEnrollmentEmailIdempotencyKey(checkoutSessionId) {
  return `enrollment/${checkoutSessionId}`;
}

export const ENROLLMENT_SUBJECT = SUBJECT;

const PREHEADER = 'Head Spa Certification Course: here’s how to begin.';
const INCLUDED = [
  '13-module certification curriculum',
  'Cadence, your personal AI tutor',
  'Final Certification Assessment',
  'Lifetime course access',
];
const CERTIFICATION_NOTE = 'Your AIMT certification is earned after completing the required course progression and passing the Final Certification Assessment.';

export function renderEnrollmentHtml({ firstName, courseEntryUrl }) {
  const safeUrl = escapeHtml(courseEntryUrl);
  return renderEmail({
    title: SUBJECT,
    preheader: PREHEADER,
    eyebrow: 'Enrollment confirmed',
    headline: welcomeHeadline(firstName),
    content: [
      paragraph('Your enrollment in the Head Spa Certification Course is confirmed.'),
      sectionLabel('Included with enrollment'),
      bulletList(INCLUDED),
      paragraph(CERTIFICATION_NOTE, { top: 14, size: 14, color: COLORS.muted }),
      divider(),
      sectionLabel('How to begin'),
      steps([
        { heading: 'Set up your student access.', text: 'Use the same email address you entered at checkout.' },
        { heading: 'Create your AIMT account or sign in.' },
        { heading: 'Begin with the Welcome Module.' },
      ]),
      button({ label: 'Set Up Student Access', href: safeUrl, width: 260 }),
      paragraph(`Already set up your account? Sign in through ${link(STUDENT_ACCESS_URL, 'Student Access')}.`, { top: 18, size: 14 }),
      divider(),
      paragraph(`Questions about your enrollment? Reply to this email or contact ${SUPPORT_LINK}.`, { top: 24, size: 14 }),
      paragraph('Your payment receipt is sent separately by Stripe.', { top: 10, size: 13, color: COLORS.muted }),
    ].join('\n      '),
  });
}

export function renderEnrollmentText({ firstName, courseEntryUrl }) {
  return [
    'AIMT',
    '',
    'ENROLLMENT CONFIRMED',
    '',
    welcomeHeadlineText(firstName),
    '',
    'Your enrollment in the Head Spa Certification Course is confirmed.',
    '',
    'INCLUDED WITH ENROLLMENT',
    ...INCLUDED.map((item) => `- ${item}`),
    '',
    CERTIFICATION_NOTE,
    '',
    'HOW TO BEGIN',
    '1. Set up your student access. Use the same email address you entered at checkout.',
    '2. Create your AIMT account or sign in.',
    '3. Begin with the Welcome Module.',
    '',
    'Set Up Student Access:',
    courseEntryUrl,
    '',
    'Already set up your account? Sign in through Student Access:',
    STUDENT_ACCESS_URL,
    '',
    `Questions about your enrollment? Reply to this email or contact ${SUPPORT_EMAIL}.`,
    '',
    'Your payment receipt is sent separately by Stripe.',
    '',
    textFooter(),
  ].join('\n');
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
        text: renderEnrollmentText({ firstName, courseEntryUrl }),
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
