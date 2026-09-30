// Transactional-email redesign — shared AIMT shell, approved copy, plain-text
// parts, canonical URLs, and docs/email-templates kept in sync with the
// production renderers.
//
// Send/idempotency/entitlement semantics are covered end-to-end by
// tests/stripe-webhook-paid-enrollment-email.test.mjs and
// tests/admin-manual-grant-invite.test.mjs; this file covers rendering.
//
// Run: node --test tests/transactional-email-redesign.test.mjs

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

import {
  renderEnrollmentHtml, renderEnrollmentText, ENROLLMENT_SUBJECT,
} from '../functions/_lib/enrollment/paid-enrollment-email.mjs';
import {
  renderInviteHtml, renderInviteText, INVITE_SUBJECT,
} from '../functions/_lib/admin/manual-grant-invite-email.mjs';
import { MARK_URL } from '../functions/_lib/email/aimt-email-shell.mjs';
import { buildFiles, SUPABASE_TEMPLATES } from '../scripts/build-email-templates.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');

const SETUP_URL = 'https://aimtrichology.com/success.html?session_id=cs_live_abc123';
const STUDENT_ACCESS = 'https://aimtrichology.com/student-access';
const enrollHtml = renderEnrollmentHtml({ firstName: 'Jamie', courseEntryUrl: SETUP_URL });
const enrollText = renderEnrollmentText({ firstName: 'Jamie', courseEntryUrl: SETUP_URL });
const inviteHtml = renderInviteHtml({ firstName: 'Jamie' });
const inviteText = renderInviteText({ firstName: 'Jamie' });
const supabaseHtml = Object.fromEntries(Object.entries(SUPABASE_TEMPLATES).map(([k, t]) => [k, t.html()]));

const ACTIVE_HTML = { enrollHtml, inviteHtml, ...supabaseHtml };

// ── Paid enrollment ───────────────────────────────────────────────────────

test('paid enrollment: approved subject, preheader, eyebrow, headline, opening', () => {
  assert.equal(ENROLLMENT_SUBJECT, 'Your AIMT enrollment is confirmed');
  assert.match(enrollHtml, /Head Spa Certification Course: here’s how to begin\./);
  assert.match(enrollHtml, />Enrollment confirmed</);
  assert.match(enrollHtml, />Welcome to AIMT, Jamie\.<\/h1>/);
  assert.match(enrollHtml, /Your enrollment in the Head Spa Certification Course is confirmed\./);
});

test('paid enrollment: never renders a fake "there" name', () => {
  for (const firstName of ['', null, undefined, '   ']) {
    const html = renderEnrollmentHtml({ firstName, courseEntryUrl: SETUP_URL });
    const text = renderEnrollmentText({ firstName, courseEntryUrl: SETUP_URL });
    assert.match(html, />Welcome to AIMT\.<\/h1>/);
    assert.match(text, /^Welcome to AIMT\.$/m);
    assert.doesNotMatch(html + text, /\bthere\b/i);
  }
});

test('paid enrollment: first name is HTML-escaped', () => {
  const html = renderEnrollmentHtml({ firstName: '<b>Jo</b>', courseEntryUrl: SETUP_URL });
  assert.match(html, /Welcome to AIMT, &lt;b&gt;Jo&lt;\/b&gt;\./);
});

test('paid enrollment: approved included list, Cadence wording, and certification condition', () => {
  for (const item of ['13-module certification curriculum', 'Cadence, your personal AI tutor', 'Final Certification Assessment', 'Lifetime course access']) {
    assert.ok(enrollHtml.includes(item), `HTML includes ${item}`);
    assert.ok(enrollText.includes(`- ${item}`), `text includes ${item}`);
  }
  const note = 'Your AIMT certification is earned after completing the required course progression and passing the Final Certification Assessment.';
  assert.ok(enrollHtml.includes(note));
  assert.ok(enrollText.includes(note));
  for (const stale of [/12 modules/i, /learning companion/i, /Cadence AI tutor/i, /My AIMT/i, /certificate on completion/i, /Keep both/i]) {
    assert.doesNotMatch(enrollHtml, stale);
    assert.doesNotMatch(enrollText, stale);
  }
});

test('paid enrollment: how-to-begin steps are the approved wording', () => {
  assert.match(enrollHtml, />Set up your student access\.<\/span> Use the same email address you entered at checkout\./);
  assert.match(enrollHtml, />Create your AIMT account or sign in\.<\/span>/);
  assert.match(enrollHtml, />Begin with the Welcome Module\.<\/span>/);
});

test('paid enrollment: CTA label matches the paid-session account-setup destination', () => {
  const escaped = SETUP_URL.replace(/[.?]/g, '\\$&');
  assert.match(enrollHtml, new RegExp(`<a href="${escaped}"[^>]*>Set Up Student Access</a>`));
  assert.match(enrollHtml, new RegExp(`v:roundrect[^>]*href="${escaped}"`), 'Outlook VML button uses the same destination');
  assert.match(enrollText, new RegExp(`Set Up Student Access:\\n${escaped}\\n`));
});

test('paid enrollment: secondary Student Access link, support line, and receipt note', () => {
  assert.match(enrollHtml, /Already set up your account\? Sign in through <a href="https:\/\/aimtrichology\.com\/student-access"[^>]*>Student Access<\/a>\./);
  assert.match(enrollHtml, /Questions about your enrollment\? Reply to this email or contact <a href="mailto:support@aimtrichology\.com"/);
  assert.equal((enrollHtml.match(/Your payment receipt is sent separately by Stripe\./g) || []).length, 1);
  assert.doesNotMatch(enrollHtml, /\$\d|597|card ending|visa/i, 'no price or card details in the AIMT email');
});

test('paid enrollment: plain text is an intentional template with every URL and no HTML', () => {
  assert.doesNotMatch(enrollText, /<[a-z/!]/i);
  for (const url of [SETUP_URL, STUDENT_ACCESS, 'https://aimtrichology.com/terms', 'https://aimtrichology.com/privacy', 'https://aimtrichology.com/refunds']) {
    assert.ok(enrollText.includes(url), `text includes ${url}`);
  }
  assert.match(enrollText, /^Welcome to AIMT, Jamie\.$/m);
  assert.match(enrollText, /Your payment receipt is sent separately by Stripe\./);
});

// ── Manual-grant invite ───────────────────────────────────────────────────

test('manual-grant invite: approved copy and canonical Student Access CTA', () => {
  assert.equal(INVITE_SUBJECT, 'Your AIMT student access is ready');
  assert.match(inviteHtml, /Set your password to begin the Head Spa Certification Course\./);
  assert.match(inviteHtml, />Student access</);
  assert.match(inviteHtml, />Welcome to AIMT, Jamie\.<\/h1>/);
  assert.match(renderInviteHtml({ firstName: '' }), />Welcome to AIMT\.<\/h1>/);
  assert.ok(inviteHtml.includes('An AIMT student account has been created for you with access to the Head Spa Certification Course. Set your password to sign in for the first time.'));
  for (const s of ['Open Student Access.', 'Select “Forgot your password?” and enter this email address.', 'Use the link we send you to choose a password, then sign in.']) {
    assert.ok(inviteHtml.includes(s) && inviteText.includes(s), s);
  }
  assert.match(inviteHtml, /<a href="https:\/\/aimtrichology\.com\/student-access"[^>]*>Open Student Access<\/a>/);
  assert.match(inviteHtml, /Questions\? Reply to this email or contact <a href="mailto:support@aimtrichology\.com"/);
  assert.match(inviteText, /Open Student Access:\nhttps:\/\/aimtrichology\.com\/student-access\n/);
  assert.doesNotMatch(inviteText, /<[a-z/!]/i);
});

test('manual-grant invite: link is never derived from the admin page origin', () => {
  const adminSrc = read('functions/api/admin/index.js');
  assert.doesNotMatch(adminSrc, /studentAccessUrl/);
  assert.doesNotMatch(adminSrc, /origin\}\/student-access/);
});

// ── Supabase Auth templates ───────────────────────────────────────────────

test('Supabase templates keep their exact template variables', () => {
  assert.match(supabaseHtml['confirm-signup'], /href="\{\{ \.ConfirmationURL \}\}"/);
  assert.match(supabaseHtml['reset-password'], /href="\{\{ \.ConfirmationURL \}\}"/);
  assert.match(supabaseHtml['change-email'], /href="\{\{ \.ConfirmationURL \}\}"/);
  assert.match(supabaseHtml['change-email'], /\{\{ \.NewEmail \}\}/);
  const vars = (html) => [...new Set(html.match(/\{\{[^}]*\}\}/g))].sort();
  assert.deepEqual(vars(supabaseHtml['confirm-signup']), ['{{ .ConfirmationURL }}']);
  assert.deepEqual(vars(supabaseHtml['reset-password']), ['{{ .ConfirmationURL }}']);
  assert.deepEqual(vars(supabaseHtml['change-email']), ['{{ .ConfirmationURL }}', '{{ .NewEmail }}']);
});

test('Supabase templates use the approved copy', () => {
  const c = supabaseHtml['confirm-signup'];
  for (const s of ['One step to finish setting up your AIMT student account.', '>Account confirmation<', '>Confirm your email</h1>', 'Confirm this email address to finish setting up your AIMT student account.', '>Confirm Email</a>', 'If the button doesn’t work, copy and paste the link below into your browser.', 'If you didn’t create an AIMT account, you can ignore this email.']) {
    assert.ok(c.includes(s), s);
  }
  const r = supabaseHtml['reset-password'];
  for (const s of ['Choose a new password for your AIMT account.', '>Password reset<', '>Reset your password</h1>', 'We received a request to reset the password for your AIMT account. Use the link below to choose a new one.', '>Choose New Password</a>', 'This link can be used once and expires soon. If you didn’t request a reset, you can ignore this email; your password won’t change.']) {
    assert.ok(r.includes(s), s);
  }
  assert.equal(SUPABASE_TEMPLATES['confirm-signup'].subject, 'Confirm your email for AIMT');
  assert.equal(SUPABASE_TEMPLATES['reset-password'].subject, 'Reset your AIMT password');
});

// ── Shared visual system ──────────────────────────────────────────────────

test('active templates use the new shell: no Playfair, Georgia, or monospace; approved palette', () => {
  const shellSrc = read('functions/_lib/email/aimt-email-shell.mjs');
  for (const [name, html] of Object.entries({ ...ACTIVE_HTML, shellSrc })) {
    assert.doesNotMatch(html, /Playfair|Georgia|monospace|SF Mono|Consolas|Fira Code/i, `${name}: no old typography`);
    assert.doesNotMatch(html, /gradient|box-shadow/i, `${name}: no gradients or shadows`);
  }
  for (const [name, html] of Object.entries(ACTIVE_HTML)) {
    assert.match(html, /background-color:#faf8f5/, `${name}: ivory page`);
    assert.match(html, /border:1px solid #e7e2dc; border-radius:12px;/, `${name}: white card with hairline border`);
    assert.match(html, /<h1[^>]*font-family:'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif;[^>]*color:#262626;/, `${name}: Montserrat-stack charcoal headline`);
    assert.match(html, /v:roundrect[^>]*fillcolor="#262626"/, `${name}: Outlook VML charcoal button`);
    assert.match(html, /<meta name="color-scheme" content="light only">/, `${name}: light scheme declared`);
  }
});

test('header uses the public charcoal orbital mark, with the AIMT wordmark as text', () => {
  assert.equal(MARK_URL, 'https://aimtrichology.com/assets/brand/email/aimt-mark-email.png');
  const png = readFileSync(path.join(ROOT, 'assets/brand/email/aimt-mark-email.png'));
  assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(png.readUInt32BE(16), 112);
  assert.equal(png.readUInt32BE(20), 112);
  for (const [name, html] of Object.entries(ACTIVE_HTML)) {
    assert.ok(html.includes(`<img src="${MARK_URL}" width="28" height="28" alt=""`), `${name}: mark image`);
    assert.match(html, />AIMT<\/td>/, `${name}: text wordmark renders even with images blocked`);
    assert.doesNotMatch(html, /\/docs\/|favicon/, `${name}: no /docs asset or oxblood favicon`);
  }
});

test('shared footer: extensionless Terms / Privacy / Refunds and readable muted text', () => {
  for (const [name, html] of Object.entries(ACTIVE_HTML)) {
    assert.match(html, /American Institute of Modern Trichology<br>/, name);
    for (const p of ['terms', 'privacy', 'refunds']) {
      assert.ok(html.includes(`href="https://aimtrichology.com/${p}"`), `${name}: /${p}`);
    }
    const siteLinks = html.match(/https:\/\/aimtrichology\.com\/[^"\s<]*/g) || [];
    for (const url of siteLinks) {
      if (url.startsWith('https://aimtrichology.com/success.html?session_id=')) continue; // paid-session setup link (unchanged mechanism)
      assert.doesNotMatch(url, /\.html\b/, `${name}: ${url} is extensionless`);
    }
    assert.doesNotMatch(html, /color:#a3968d;[^"]*">[A-Za-z]/, `${name}: taupe is decorative only, never text`);
  }
});

// ── Docs stay in sync; dormant emails stay unwired ────────────────────────

test('docs/email-templates are generated from the production renderers and are current', () => {
  for (const [rel, content] of Object.entries(buildFiles())) {
    assert.equal(read(`docs/email-templates/${rel}`), content, `docs/email-templates/${rel} is stale — run node scripts/build-email-templates.mjs`);
  }
});

test('dormant emails are not wired to any sender', () => {
  const files = [];
  const walk = (dir) => {
    for (const e of readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(rel); else if (/\.m?js$/.test(e.name)) files.push(rel);
    }
  };
  walk('functions');
  const senders = files.filter((f) => read(f).includes('api.resend.com'));
  assert.deepEqual(senders.sort(), [
    'functions/_lib/admin/manual-grant-invite-email.mjs',
    'functions/_lib/enrollment/paid-enrollment-email.mjs',
  ]);
  for (const f of files) {
    assert.doesNotMatch(read(f), /certification-earned|review-request-received|educator-remediation-request-received|security-password-changed/, f);
  }
});
