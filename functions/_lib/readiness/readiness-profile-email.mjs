// The branded, actionable Head Spa Readiness result email.
// This uses the same AIMT email shell as the enrollment and student-invite
// emails. The assessment's approved next-step guidance is copied below;
// tests compare it against the canonical readiness-page source to prevent drift.
// Emails must be self-contained: My AIMT's local preview only works in the
// browser where the quiz was completed, not reliably from an email click.
import {
  SITE_URL, SUPPORT_EMAIL, SUPPORT_LINK, COLORS, FONT_HEAD, FONT_BODY,
  escapeHtml, renderEmail, row, paragraph, sectionLabel, divider,
  button, link, steps, textFooter,
} from '../email/aimt-email-shell.mjs';

export const READINESS_RESULT_SUBJECT = 'Your AIMT Readiness Score + Next Steps';

const AREAS = Object.freeze({
  scope: 'Professional Foundation & Scope',
  assessment: 'Scalp Observation & Assessment',
  service: 'Service Flow & Adaptation',
  communication: 'Client Communication & Experience',
  business: 'Operations & Business Systems',
});
const AREA_ORDER = ['scope', 'assessment', 'service', 'communication', 'business'];
const BAND_COPY = Object.freeze({
  'Refinement Stage': 'Your foundation is strong. Your biggest gains from here are likely to come from tightening the areas that are still inconsistent and deepening your assessment judgment.',
  'Strong Foundation': 'You have meaningful systems in place. A few specific areas are worth sharpening to make the whole practice easier to repeat.',
  'Developing System': 'You have the pieces. They are not all working as one system yet — specific decisions still depend on memory, improvisation, or confidence that changes from client to client.',
  'Foundation Building': 'Your strongest next move is not adding more equipment or techniques. It is building the professional foundation that makes the service safer, clearer, and easier to explain.',
});
export const PRIORITY_CONTENT = Object.freeze({
  scope: {
    affects: 'Unclear scope boundaries put both your clients and your practice at risk, and make it harder to communicate confidently when a service should pause or a referral is the better call.',
    actions: [
      'Practice describing scalp observations in clear, non-diagnostic language and identify when referral is the appropriate next step.',
      'List the specific situations where you would pause or stop a service and what you say in that moment.',
      'Confirm how your current head spa offering fits your license and local rules, in writing.',
    ],
  },
  assessment: {
    affects: 'Without a repeatable assessment structure, service decisions vary by client and are harder to explain or defend.',
    actions: [
      'Build a fixed sequence of what you check, in what order, every single client.',
      'Write down what a microscopy or visual finding does and does not tell you.',
      'Practice describing a mixed or ambiguous presentation out loud, in plain language.',
    ],
  },
  service: {
    affects: 'When adaptation feels improvised, both pacing and client confidence suffer.',
    actions: [
      'Write the purpose of each phase of your service, not just the steps.',
      'Define your go-to adjustments for a shorter appointment, a sensitive scalp, and a rushed client.',
      'Build one pacing reference you can return to instead of relying on memory.',
    ],
  },
  communication: {
    affects: 'Inconsistent communication makes the service feel less intentional, even when the technique is strong.',
    actions: [
      'List what you proactively say during each phase of the service, and what you leave quiet.',
      'Draft short, confident answers to your 5 most common client questions.',
      'Map your consultation, transitions, and closing as one continuous experience.',
    ],
  },
  business: {
    affects: 'Pricing and systems built on guesswork make it harder to sustain the service or explain its value.',
    actions: [
      'Calculate your real per-service cost and time before setting price.',
      'Write your sanitation/reset checklist for the exact equipment you use.',
      'Draft one paragraph explaining what makes your service worth its price.',
    ],
  },
});

const READING_PATH = Object.freeze({
  scope: '/education/safety',
  assessment: '/education/scalp-health',
  service: '/education/head-spa-techniques',
  communication: '/education',
  business: '/education',
});
const ATTRIBUTION = '?utm_source=email&utm_medium=email&utm_campaign=202611_readiness_results';
export const CERTIFICATION_URL = SITE_URL + '/readiness-enroll' + ATTRIBUTION + '&utm_content=email_final-decision_readiness-next-step_v1';
export function educationUrlFor(priority) {
  return SITE_URL + (READING_PATH[priority] || '/education') + ATTRIBUTION + '&utm_content=email_practitioner-education_readiness-resources_v1';
}

function safePriority(row) {
  return Object.hasOwn(PRIORITY_CONTENT, row?.priority_pillar) ? row.priority_pillar : 'scope';
}
function scoreOf(row) {
  const value = Number(row?.score);
  return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;
}
function bandOf(row) {
  return Object.hasOwn(BAND_COPY, row?.band) ? row.band : 'Foundation Building';
}
function nameOf(row) {
  return String(row?.first_name || '').trim().slice(0, 80);
}
function strongestOf(row) {
  return Object.hasOwn(AREAS, row?.strongest_pillar) ? row.strongest_pillar : 'scope';
}
function strongestLabel(row) {
  const values = AREA_ORDER.map(key => Number(row.pillar_scores?.[key] || 0));
  const highest = Math.max(...values);
  return values.filter(v => v === highest).length > 1 ? 'One of your strongest areas' : 'Strongest area';
}
function formattedScore(row, key) {
  const value = Number(row.pillar_scores?.[key] ?? 0);
  return Number.isInteger(value) && value >= 0 && value <= 6 ? value : 0;
}
function scoreCard(rowData) {
  const score = scoreOf(rowData);
  const band = escapeHtml(bandOf(rowData));
  const markup =
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f0eb" style="background-color:#f4f0eb;border:1px solid #e7e2dc;border-radius:10px;">' +
    '<tr><td style="padding:22px 24px 24px;">' +
      '<p style="margin:0 0 11px;font-family:' + FONT_HEAD + ';font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:' + COLORS.muted + ';">Your readiness score</p>' +
      '<p style="margin:0;font-family:' + FONT_HEAD + ';font-size:45px;line-height:1.15;letter-spacing:-1px;font-weight:700;color:' + COLORS.ink + ';">' + score +
      '<span style="font-size:18px;letter-spacing:0;color:' + COLORS.muted + ';"> / 100</span></p>' +
      '<p style="margin:10px 0 0;font-family:' + FONT_BODY + ';font-size:14px;line-height:1.5;color:' + COLORS.body + ';">' + band + '</p>' +
    '</td></tr></table>';
  return row(markup, {top:22});
}
function scoreTable(data) {
  const tableRows = AREA_ORDER.map(key =>
    '<tr><td valign="top" style="padding:11px 0;border-bottom:1px solid ' + COLORS.border + ';font-family:' + FONT_BODY + ';font-size:13px;line-height:1.45;color:' + COLORS.body + ';">' +
    escapeHtml(AREAS[key]) + '</td><td valign="top" align="right" style="padding:11px 0 11px 15px;white-space:nowrap;border-bottom:1px solid ' + COLORS.border + ';font-family:' + FONT_HEAD + ';font-weight:700;font-size:13px;color:' + COLORS.ink + ';">' + formattedScore(data, key) + ' / 6</td></tr>'
  ).join('');
  return row('<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' + tableRows + '</table>', {top:12});
}

export function renderReadinessHtml(data) {
  const priority = safePriority(data);
  const focus = PRIORITY_CONTENT[priority];
  const name = escapeHtml(nameOf(data));
  const stage = bandOf(data);
  const optedIn = data.marketing_consent === true;
  const resourceHref = escapeHtml(educationUrlFor(priority));
  const content = [
    paragraph(name ? 'Hi ' + name + ', here is your Head Spa Readiness Profile.' : 'Here is your Head Spa Readiness Profile.', {top:20}),
    scoreCard(data),
    paragraph(escapeHtml(BAND_COPY[stage]), {top:17,size:14}),
    sectionLabel('First priority', {top:30}),
    row('<h2 style="margin:0;font-family:' + FONT_HEAD + ';font-size:19px;font-weight:700;line-height:1.35;color:' + COLORS.ink + ';">' + escapeHtml(AREAS[priority]) + '</h2>', {top:9}),
    paragraph(escapeHtml(focus.affects), {top:8,size:14}),
    optedIn
      ? button({label:'See Your Next Step',href:escapeHtml(CERTIFICATION_URL),width:300,top:23})
      : button({label:'Explore Practitioner Education',href:resourceHref,width:292,top:23}),
    optedIn
      ? paragraph('Or begin with our ' + link(resourceHref,'free practitioner education library') + '.', {top:14,size:13,color:COLORS.muted})
      : paragraph('Browse practical articles and resources for your next step.', {top:14,size:13,color:COLORS.muted}),
    divider({top:28}),
    sectionLabel('Three practical moves', {top:26}),
    steps(focus.actions.map(text => ({text:escapeHtml(text)})), {top:13}),
    divider({top:28}),
    sectionLabel('Your five-part breakdown', {top:26}),
    scoreTable(data),
    paragraph('<strong style="color:' + COLORS.ink + ';">' + strongestLabel(data) + ':</strong> ' + escapeHtml(AREAS[strongestOf(data)]), {top:15,size:14}),
    paragraph('This score is a professional self-assessment. It is not a diagnosis, license, or certification.', {top:20,size:12,color:COLORS.muted}),
    paragraph('Questions about your results? Reply to this email or write to ' + SUPPORT_LINK + '.', {top:14,size:13}),
  ].join('\n');
  return renderEmail({
    title: READINESS_RESULT_SUBJECT,
    preheader: 'Your ' + scoreOf(data) + '/100 result, first priority, and three steps worth taking next.',
    eyebrow: 'Head Spa Readiness · Your results',
    headline: 'A clearer path forward.',
    content,
  });
}

export function renderReadinessText(data) {
  const priority = safePriority(data);
  const stage = bandOf(data);
  const optedIn = data.marketing_consent === true;
  const name = nameOf(data);
  const lines = [
    'AIMT · Head Spa Readiness',
    '',
    'A clearer path forward.',
    '',
    name ? 'Hi ' + name + ',' : 'Hello,',
    '',
    'Your Readiness Score: ' + scoreOf(data) + '/100',
    'Stage: ' + stage,
    BAND_COPY[stage],
    '',
    'FIRST PRIORITY: ' + AREAS[priority],
    PRIORITY_CONTENT[priority].affects,
    '',
    'THREE PRACTICAL MOVES',
    ...PRIORITY_CONTENT[priority].actions.map((step,index)=>(index+1)+'. '+step),
    '',
    optedIn ? 'See your next step:' : 'Explore free practitioner education:',
    optedIn ? CERTIFICATION_URL : educationUrlFor(priority),
    ...(optedIn ? ['', 'Free practitioner education:', educationUrlFor(priority)] : []),
    '',
    'YOUR FIVE-PART BREAKDOWN',
    ...AREA_ORDER.map(key => AREAS[key] + ': ' + formattedScore(data,key) + '/6'),
    '',
    strongestLabel(data) + ': ' + AREAS[strongestOf(data)],
    '',
    'These scores are a self-assessment, not a diagnosis, license, or certificate.',
    'Questions? Reply to this email or write to ' + SUPPORT_EMAIL + '.',
    '',
    textFooter(),
  ];
  return lines.join('\n');
}
