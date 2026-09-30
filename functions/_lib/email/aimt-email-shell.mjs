// Shared AIMT transactional-email shell.
//
// One visual system for every AIMT email — the Resend sends rendered at
// request time (enrollment, manual-grant invite) and the Supabase Auth
// templates generated into docs/email-templates/ by
// scripts/build-email-templates.mjs. Matches the enrollment page: warm
// ivory outer background, white card, charcoal Montserrat-style headings,
// system sans-serif body, charcoal pill CTA, restrained taupe detail.
//
// Email-safe construction: tables + inline styles only, no web-font
// dependency (Montserrat is first in the stack but Helvetica/Arial carry
// the look where it isn't installed), VML button for Outlook, light color
// scheme declared so clients don't recolor the ivory/white surfaces.
//
// Helpers take HTML strings. Callers escape any dynamic value with
// escapeHtml() before passing it in; static copy is passed as-is.
// Zero dependencies (functions/ rule from CLAUDE.md).

export const SITE_URL = 'https://aimtrichology.com';
export const STUDENT_ACCESS_URL = `${SITE_URL}/student-access`;
export const SUPPORT_EMAIL = 'support@aimtrichology.com';
export const MARK_URL = `${SITE_URL}/assets/brand/email/aimt-mark-email.png`;

export const COLORS = {
  page: '#faf8f5',
  card: '#ffffff',
  border: '#e7e2dc',
  ink: '#262626',
  body: '#4a4440',
  muted: '#7a6e66',
  accent: '#a3968d',
};

export const FONT_HEAD = "'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif";
export const FONT_BODY = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

const PAD_X = 40;

export function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

/* One full-width row inside the card. */
export function row(inner, { top = 0, bottom = 0 } = {}) {
  return `<tr><td class="aimt-pad" style="padding:${top}px ${PAD_X}px ${bottom}px;">${inner}</td></tr>`;
}

export function paragraph(html, { top = 16, size = 15, color = COLORS.body } = {}) {
  return row(
    `<p style="margin:0; font-family:${FONT_BODY}; font-size:${size}px; line-height:1.6; color:${color};">${html}</p>`,
    { top }
  );
}

export function sectionLabel(text, { top = 28 } = {}) {
  return row(
    `<p style="margin:0; font-family:${FONT_HEAD}; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:${COLORS.ink};">${text}</p>`,
    { top }
  );
}

export function divider({ top = 28 } = {}) {
  return row(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ${COLORS.border}; font-size:0; line-height:0;">&nbsp;</td></tr></table>`,
    { top }
  );
}

export function bulletList(items, { top = 12 } = {}) {
  const rows = items.map((item) => `<tr>
          <td valign="top" width="18" style="width:18px; padding:5px 0; font-family:${FONT_BODY}; font-size:15px; line-height:1.5; color:${COLORS.accent};">&#8226;</td>
          <td valign="top" style="padding:5px 0; font-family:${FONT_BODY}; font-size:15px; line-height:1.5; color:${COLORS.body};">${item}</td>
        </tr>`).join('\n        ');
  return row(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${rows}
      </table>`,
    { top }
  );
}

/* Numbered steps. Each step: { heading } (bold), { text } (regular), or both. */
export function steps(items, { top = 14 } = {}) {
  const rows = items.map((step, i) => {
    const num = String(i + 1).padStart(2, '0');
    const heading = step.heading
      ? `<span style="font-weight:600; color:${COLORS.ink};">${step.heading}</span>`
      : '';
    const text = step.text ? `${heading ? ' ' : ''}${step.text}` : '';
    return `<tr>
          <td valign="top" width="34" style="width:34px; padding:7px 0; font-family:${FONT_HEAD}; font-size:12px; font-weight:700; line-height:1.9; color:${COLORS.muted};">${num}</td>
          <td valign="top" style="padding:7px 0; font-family:${FONT_BODY}; font-size:15px; line-height:1.55; color:${COLORS.body};">${heading}${text}</td>
        </tr>`;
  }).join('\n        ');
  return row(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${rows}
      </table>`,
    { top }
  );
}

/* Charcoal pill CTA with a VML fallback so Outlook desktop draws the same button. */
export function button({ label, href, width = 240, top = 28 }) {
  const upper = label.toUpperCase();
  return row(
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="border-radius:999px; background-color:${COLORS.ink};">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:48px;v-text-anchor:middle;width:${width}px;" arcsize="50%" strokecolor="${COLORS.ink}" fillcolor="${COLORS.ink}">
            <w:anchorlock/>
            <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:1.5px;">${upper}</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="${href}" style="display:inline-block; padding:16px 30px; border-radius:999px; font-family:${FONT_HEAD}; font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#ffffff; text-decoration:none;">${label}</a>
            <!--<![endif]-->
          </td>
        </tr></table>`,
    { top }
  );
}

export function link(href, text, { color = COLORS.ink } = {}) {
  return `<a href="${href}" style="color:${color}; text-decoration:underline;">${text}</a>`;
}

export const SUPPORT_LINK = link(`mailto:${SUPPORT_EMAIL}`, SUPPORT_EMAIL);

function footer() {
  const fl = (href, text) => link(href, text, { color: COLORS.body });
  return `<tr><td align="center" style="padding:28px 20px 0; font-family:${FONT_BODY}; font-size:12px; line-height:1.8; color:${COLORS.muted};">
    American Institute of Modern Trichology<br>
    ${fl(`mailto:${SUPPORT_EMAIL}`, SUPPORT_EMAIL)}<br>
    ${fl(`${SITE_URL}/terms`, 'Terms')} &middot; ${fl(`${SITE_URL}/privacy`, 'Privacy')} &middot; ${fl(`${SITE_URL}/refunds`, 'Refund Policy')}
  </td></tr>`;
}

/* Plain-text footer for the text/plain part of every Resend send. */
export function textFooter() {
  return [
    '—',
    'American Institute of Modern Trichology',
    SUPPORT_EMAIL,
    `Terms: ${SITE_URL}/terms`,
    `Privacy: ${SITE_URL}/privacy`,
    `Refund Policy: ${SITE_URL}/refunds`,
  ].join('\n');
}

/**
 * Full HTML document. `content` is a string of card rows built with the
 * helpers above; eyebrow/headline/preheader are HTML-safe strings.
 */
export function renderEmail({ title, preheader, eyebrow, headline, content }) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${title}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  :root { color-scheme: light only; supported-color-schemes: light only; }
  body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: ${COLORS.page}; }
  @media screen and (max-width: 600px) {
    .aimt-container { width: 100% !important; }
    .aimt-pad { padding-left: 24px !important; padding-right: 24px !important; }
    .aimt-headline { font-size: 22px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:${COLORS.page};">
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.page}" style="background-color:${COLORS.page};">
<tr><td align="center" style="padding:40px 16px 48px;">
<table role="presentation" class="aimt-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">
  <tr><td align="center" style="padding-bottom:24px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="middle" style="padding-right:10px;"><img src="${MARK_URL}" width="28" height="28" alt="" style="display:block; width:28px; height:28px;"></td>
      <td valign="middle" style="font-family:${FONT_HEAD}; font-size:13px; font-weight:700; letter-spacing:4px; color:${COLORS.ink};">AIMT</td>
    </tr></table>
  </td></tr>
  <tr><td style="background-color:${COLORS.card}; border:1px solid ${COLORS.border}; border-radius:12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${row(`<p style="margin:0; font-family:${FONT_HEAD}; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:${COLORS.muted};">${eyebrow}</p>
        <h1 class="aimt-headline" style="margin:12px 0 0; font-family:${FONT_HEAD}; font-size:24px; font-weight:700; line-height:1.3; letter-spacing:-0.2px; color:${COLORS.ink};">${headline}</h1>`, { top: 40 })}
      ${content}
      <tr><td style="padding:0 0 40px; font-size:0; line-height:0;">&nbsp;</td></tr>
    </table>
  </td></tr>
  ${footer()}
</table>
</td></tr>
</table>
</body>
</html>`;
}

/* "Welcome to AIMT, Jamie." / "Welcome to AIMT." — never a fake name. */
export function welcomeHeadline(firstName) {
  const name = String(firstName == null ? '' : firstName).trim();
  return name ? `Welcome to AIMT, ${escapeHtml(name)}.` : 'Welcome to AIMT.';
}
export function welcomeHeadlineText(firstName) {
  const name = String(firstName == null ? '' : firstName).trim();
  return name ? `Welcome to AIMT, ${name}.` : 'Welcome to AIMT.';
}
