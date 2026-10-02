// AIMT Growth — reporting engine for Admin → Growth and the weekly
// scoreboard.
//
// loadGrowthData() is the only I/O: service-role reads of the existing
// authorities plus public.growth_events. computeGrowthReport() and
// computeScoreboard() are pure, so every formula is unit-tested.
//
// Authority per metric (see docs/growth/AIMT-Growth-Measurement.md):
//   visitors / sales-page / Readiness / leads → growth_events (browser, directional)
//   checkout starts                           → growth_events checkout_start (server)
//   paid enrollments                          → course_entitlements (+ classifyEnrollment)
//   revenue                                   → growth_events paid_enrollment (Stripe-verified webhook)
//   activation / modules                      → course_progress.state
//   certification                             → completions
//   Cadence                                   → cadence_messages metadata (never content)
//   Service Timer / resources                 → growth_events (signed-in students)
//
// Privacy: course_progress is read only as state->progress and
// state->student->introComplete (never the Cadence memory or checkpoint
// text in the rest of the blob), and cadence_messages only as
// user_id/mode/created_at — never `content`. Nothing here returns emails.

import { supabaseRest, COURSE_SLUG } from '../certification/auth.mjs';
import { hasCourseActivity } from '../admin/course-progress.mjs';
import { GROWTH_TABLE } from './record.mjs';
import { channelFor, classifyEnrollment, isPaidKind, parseCreativeId } from './taxonomy.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 1000;
const MAX_ROWS = 50000;
export const RANGE_DAYS = Object.freeze({ '7d': 7, '30d': 30, all: null });
const INSTRUCTIONAL_MODULES = 12; // Modules 0–11

// ── I/O ───────────────────────────────────────────────────────────────

async function readPaged(env, table, query) {
  const rows = [];
  for (let offset = 0; offset < MAX_ROWS; offset += PAGE_SIZE) {
    const res = await supabaseRest(env, `${table}?${query}&limit=${PAGE_SIZE}&offset=${offset}`);
    if (!res.ok) {
      const missing = res.status === 404 || res.body?.code === '42P01' || res.body?.code === 'PGRST205';
      return { ok: false, missing, rows, truncated: false };
    }
    const page = Array.isArray(res.body) ? res.body : [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return { ok: true, missing: false, rows, truncated: false };
  }
  return { ok: true, missing: false, rows, truncated: true };
}

/**
 * @param env Pages env (service role)
 * @param deps.listAuthUsers (env, perPage) => Promise<user[]> — the Admin
 *        API's existing auth-users reader, injected to avoid a second copy.
 */
export async function loadGrowthData(env, { listAuthUsers }) {
  const slug = `course_slug=eq.${COURSE_SLUG}`;
  const [events, entitlements, admins, progress, completions, cadence, users] = await Promise.all([
    readPaged(env, GROWTH_TABLE, 'select=occurred_at,event_name,origin,visitor_id,session_id,user_id,checkout_session_id,is_internal,page_path,first_touch,last_touch,props&order=occurred_at.asc'),
    readPaged(env, 'course_entitlements', `select=checkout_session_id,purchaser_email,user_id,granted_at&${slug}&order=granted_at.asc`),
    readPaged(env, 'admin_users', 'select=user_id,active'),
    readPaged(env, 'course_progress', `select=user_id,updated_at,progress:state->progress,intro_complete:state->student->introComplete&${slug}`),
    readPaged(env, 'completions', `select=user_id,completed_at,revoked&${slug}`),
    readPaged(env, 'cadence_messages', `select=user_id,mode,created_at&role=eq.user&${slug}&order=created_at.asc`),
    listAuthUsers(env, 1000).then((list) => list.map((u) => ({ id: u.id, email: String(u.email || '').trim().toLowerCase() }))),
  ]);
  if (!entitlements.ok) throw new Error('Unable to read course_entitlements.');
  return {
    growthTable: events.ok ? 'present' : (events.missing ? 'missing' : 'error'),
    growthTruncated: events.truncated,
    events: events.rows,
    entitlements: entitlements.rows,
    adminUsers: admins.rows,
    progress: progress.rows,
    completions: completions.rows,
    cadenceMessages: cadence.ok ? cadence.rows : [],
    cadenceTable: cadence.ok ? 'present' : 'missing',
    users,
  };
}

// ── Metric value helpers ──────────────────────────────────────────────

function metric(value, extra = {}) {
  return { value, status: 'ok', ...extra };
}
function notMeasurable(note) {
  return { value: null, status: 'not_measurable', note };
}
function insufficient(note, extra = {}) {
  return { value: null, status: 'insufficient', note, ...extra };
}
function ratio(numerator, denominator, extra = {}) {
  if (!denominator) return insufficient('No denominator in this period.', { numerator, denominator });
  return metric(numerator / denominator, { numerator, denominator, ...extra });
}
function median(values) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function ts(value) {
  if (value === null || value === undefined || value === '') return null;
  const t = typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(t) ? t : null;
}

const KIND_PRIORITY = ['paid', 'paid_discounted', 'zero_cost', 'owner_test', 'test', 'staff', 'complimentary', 'scholarship', 'manual', 'unknown'];

// ── Preparation shared by every range ─────────────────────────────────

export function prepareGrowthData(data) {
  const adminUserIds = new Set((data.adminUsers || []).filter((a) => a.active !== false).map((a) => a.user_id));
  const usersById = new Map((data.users || []).map((u) => [u.id, u]));
  const usersByEmail = new Map((data.users || []).map((u) => [u.email, u]));
  const adminEmails = new Set([...adminUserIds].map((id) => usersById.get(id)?.email).filter(Boolean));

  const events = (data.events || []).map((e) => ({ ...e, t: ts(e.occurred_at) })).filter((e) => e.t !== null);

  // Internal = any visitor/user ever flagged internal, or any admin account.
  const internalVisitors = new Set();
  for (const e of events) {
    if (e.visitor_id && (e.is_internal || (e.user_id && adminUserIds.has(e.user_id)))) internalVisitors.add(e.visitor_id);
  }
  const isInternalEvent = (e) => e.is_internal === true
    || (e.visitor_id && internalVisitors.has(e.visitor_id))
    || (e.user_id && adminUserIds.has(e.user_id));

  const paidRecords = new Map();
  const checkoutStarts = new Map();
  for (const e of events) {
    if (e.event_name === 'paid_enrollment' && e.checkout_session_id) paidRecords.set(e.checkout_session_id, e);
    if (e.event_name === 'checkout_start' && e.checkout_session_id) checkoutStarts.set(e.checkout_session_id, e);
  }

  const browserEvents = events.filter((e) => e.origin === 'browser');
  const firstSeen = (name) => {
    const hit = browserEvents.find((e) => e.event_name === name);
    return hit ? hit.t : null;
  };
  const anyBrowser = browserEvents.length ? browserEvents[0].t : null;
  const instrumentedSince = {
    any: anyBrowser,
    site_visit: firstSeen('site_visit'),
    headspa_sales_view: firstSeen('headspa_sales_view'),
    readiness: firstSeen('readiness_audit_start'),
    service_timer_used: firstSeen('service_timer_used'),
    resource_used: firstSeen('resource_used'),
    checkout_start: (events.find((e) => e.event_name === 'checkout_start') || {}).t ?? null,
    paid_enrollment: (events.find((e) => e.event_name === 'paid_enrollment') || {}).t ?? null,
  };

  // Entitlements → classified enrollments.
  const enrollments = (data.entitlements || []).map((ent) => {
    const email = String(ent.purchaser_email || '').trim().toLowerCase();
    const user = (ent.user_id && usersById.get(ent.user_id)) || usersByEmail.get(email) || null;
    const paidRecord = paidRecords.get(ent.checkout_session_id) || null;
    const kind = classifyEnrollment(ent, { adminUserIds, adminEmails, paidRecord, resolvedUserId: user?.id || null });
    return {
      id: ent.checkout_session_id,
      kind,
      userId: user?.id || null,
      identity: user?.id || `email:${email}`,
      grantedAt: ts(ent.granted_at),
      paidRecord,
      checkoutStart: checkoutStarts.get(ent.checkout_session_id) || null,
    };
  });

  // Students = one row per identity, classified by their strongest enrollment.
  const progressByUser = new Map((data.progress || []).map((p) => [p.user_id, p]));
  const completionByUser = new Map((data.completions || []).filter((c) => c.revoked !== true).map((c) => [c.user_id, c]));
  const cadenceByUser = new Map();
  for (const m of data.cadenceMessages || []) {
    const t = ts(m.created_at);
    if (t === null || !m.user_id) continue;
    if (!cadenceByUser.has(m.user_id)) cadenceByUser.set(m.user_id, []);
    cadenceByUser.get(m.user_id).push({ t, mode: m.mode });
  }
  const userEvents = new Map();
  for (const e of events) {
    if (!e.user_id) continue;
    if (!userEvents.has(e.user_id)) userEvents.set(e.user_id, []);
    userEvents.get(e.user_id).push(e);
  }

  const studentsByIdentity = new Map();
  for (const en of enrollments) {
    if (!studentsByIdentity.has(en.identity)) studentsByIdentity.set(en.identity, { identity: en.identity, userId: en.userId, enrollments: [] });
    studentsByIdentity.get(en.identity).enrollments.push(en);
  }
  const students = [...studentsByIdentity.values()].map((s) => {
    const kind = KIND_PRIORITY.find((k) => s.enrollments.some((e) => e.kind === k)) || 'unknown';
    const relevant = s.enrollments.filter((e) => e.kind === kind && e.grantedAt !== null);
    const enrolledAt = relevant.length ? Math.min(...relevant.map((e) => e.grantedAt)) : null;
    const prog = s.userId ? progressByUser.get(s.userId) : null;
    const progressObj = prog && prog.progress && typeof prog.progress === 'object' ? prog.progress : {};
    const activated = hasCourseActivity({ progress: progressObj, student: { introComplete: prog?.intro_complete === true } });
    const startTimes = [];
    const moduleCompletions = [];
    for (let i = 0; i < INSTRUCTIONAL_MODULES; i++) {
      const mod = progressObj[String(i)];
      if (!mod || typeof mod !== 'object') continue;
      const started = ts(mod.startedAt);
      if (started !== null) startTimes.push(started);
      if (mod.complete === true) {
        const done = ts(mod.completedAt);
        moduleCompletions.push(done);
        if (done !== null) startTimes.push(done);
      }
    }
    const completion = s.userId ? completionByUser.get(s.userId) : null;
    const cadence = s.userId ? (cadenceByUser.get(s.userId) || []) : [];
    const own = s.userId ? (userEvents.get(s.userId) || []) : [];
    const activityTimes = [ts(prog?.updated_at), ...cadence.map((c) => c.t), ...own.map((e) => e.t)].filter((t) => t !== null);
    return {
      identity: s.identity,
      userId: s.userId,
      kind,
      enrolledAt,
      activated,
      activatedAt: activated && startTimes.length ? Math.min(...startTimes) : null,
      moduleCompletions,
      certifiedAt: completion ? ts(completion.completed_at) : null,
      cadence,
      timerTimes: own.filter((e) => e.event_name === 'service_timer_used').map((e) => e.t),
      resourceTimes: own.filter((e) => e.event_name === 'resource_used').map((e) => e.t),
      lastActivityAt: activityTimes.length ? Math.max(...activityTimes) : null,
    };
  });

  return {
    growthTable: data.growthTable || 'present',
    growthTruncated: !!data.growthTruncated,
    cadenceTable: data.cadenceTable || 'present',
    events,
    isInternalEvent,
    internalVisitorCount: internalVisitors.size,
    instrumentedSince,
    enrollments,
    students,
  };
}

// ── Range report ──────────────────────────────────────────────────────

export function resolveRange(range, now = Date.now()) {
  const days = Object.prototype.hasOwnProperty.call(RANGE_DAYS, range) ? RANGE_DAYS[range] : RANGE_DAYS['30d'];
  return { key: Object.prototype.hasOwnProperty.call(RANGE_DAYS, range) ? range : '30d', start: days === null ? -Infinity : now - days * DAY_MS, end: now };
}

function touchOf(e, model) {
  return (model === 'last' ? e?.last_touch : e?.first_touch) || {};
}

function inRange(t, start, end) {
  return t !== null && t !== undefined && t >= start && t < end;
}

function coverage(since, start, end, label) {
  if (since === null) return { measured: false, note: `${label} not yet recorded — the growth tracking has no data for this yet.` };
  if (end <= since) return { measured: false, note: `${label} tracking began ${new Date(since).toISOString().slice(0, 10)}, after this period.` };
  if (start < since) return { measured: true, partial: true, note: `Measured since ${new Date(since).toISOString().slice(0, 10)}.` };
  return { measured: true, partial: false, note: null };
}

function withCoverage(m, cov) {
  if (cov.partial && m.status === 'ok') return { ...m, status: 'partial', note: cov.note };
  return m;
}

/**
 * @param prepared output of prepareGrowthData()
 * @param opts { start, end, model: 'first'|'last', now }
 */
export function computeGrowthReport(prepared, { start, end, model = 'first', now = Date.now() } = {}) {
  const tableOk = prepared.growthTable === 'present';
  const ev = prepared.events.filter((e) => inRange(e.t, start, end) && !prepared.isInternalEvent(e));
  const byName = (name) => ev.filter((e) => e.event_name === name);
  const distinct = (list, keyFn) => new Set(list.map(keyFn).filter(Boolean)).size;
  const since = prepared.instrumentedSince;
  const tableNote = prepared.growthTable === 'missing'
    ? 'growth_events table not created yet (run supabase/migrations/20261001_create_growth_events.sql).'
    : 'Growth events could not be read.';

  const browserMetric = (sinceKey, label, compute) => {
    if (!tableOk) return notMeasurable(tableNote);
    const cov = coverage(since[sinceKey], start, end, label);
    if (!cov.measured) return notMeasurable(cov.note);
    return withCoverage(compute(), cov);
  };

  // Acquisition
  const visits = byName('site_visit');
  const salesViews = byName('headspa_sales_view');
  const visitors = browserMetric('site_visit', 'Site visits', () => metric(distinct(visits, (e) => e.visitor_id), { sessions: distinct(visits, (e) => e.session_id) }));
  const salesPageVisitors = browserMetric('headspa_sales_view', 'Head Spa sales-page views', () => metric(distinct(salesViews, (e) => e.visitor_id), { sessions: distinct(salesViews, (e) => e.session_id) }));

  // Leads
  const rStarts = byName('readiness_audit_start');
  const rDone = byName('readiness_audit_complete');
  const leadEvents = byName('lead_created');
  const readinessStarts = browserMetric('readiness', 'Readiness Audit activity', () => metric(distinct(rStarts, (e) => e.session_id)));
  const readinessCompletions = browserMetric('readiness', 'Readiness Audit activity', () => metric(distinct(rDone, (e) => e.session_id)));
  const leads = browserMetric('readiness', 'Readiness Audit activity', () => metric(distinct(leadEvents, (e) => e.visitor_id), {
    withMarketingConsent: distinct(leadEvents.filter((e) => e.props?.marketing_consent === true), (e) => e.visitor_id),
    note: 'Contact details are not stored: Readiness email delivery is not wired yet, so leads are counted but not addressable.',
  }));

  // Sales — paid authority is the entitlement; revenue authority is the
  // Stripe-verified paid_enrollment record.
  const enrollmentsInRange = prepared.enrollments.filter((en) => inRange(en.grantedAt, start, end));
  const paidInRange = enrollmentsInRange.filter((en) => isPaidKind(en.kind));
  const paidByKind = { paid: 0, paid_discounted: 0 };
  const excludedByKind = {};
  for (const en of enrollmentsInRange) {
    if (isPaidKind(en.kind)) paidByKind[en.kind] += 1;
    else excludedByKind[en.kind] = (excludedByKind[en.kind] || 0) + 1;
  }
  const revenueByCurrency = {};
  let unrecorded = 0;
  for (const en of paidInRange) {
    const p = en.paidRecord?.props;
    if (p && Number.isInteger(p.amount_total) && p.currency) revenueByCurrency[p.currency] = (revenueByCurrency[p.currency] || 0) + p.amount_total;
    else unrecorded++;
  }
  const paidEnrollments = metric(paidInRange.length, { fullPrice: paidByKind.paid, discounted: paidByKind.paid_discounted, excludedByKind });
  const revenue = paidInRange.length && unrecorded === paidInRange.length
    ? notMeasurable(`${unrecorded} paid enrollment${unrecorded === 1 ? '' : 's'} with no Stripe revenue record yet — use “Reconcile revenue from Stripe”.`)
    : metric(revenueByCurrency.usd || 0, {
      currency: 'usd',
      byCurrency: revenueByCurrency,
      unrecordedEnrollments: unrecorded,
      note: unrecorded ? `${unrecorded} paid enrollment${unrecorded === 1 ? '' : 's'} missing a Stripe revenue record — reconcile from Stripe.` : 'Gross, from Stripe; refunds are not yet deducted.',
    });

  const checkoutEvents = byName('checkout_start').filter((e) => e.props?.livemode !== false);
  const checkoutKey = (e) => e.visitor_id || `cs:${e.checkout_session_id}`;
  const paidIds = new Set(prepared.enrollments.filter((en) => isPaidKind(en.kind)).map((en) => en.id));
  const starterKeys = new Set(checkoutEvents.map(checkoutKey));
  const convertedStarters = new Set(checkoutEvents.filter((e) => paidIds.has(e.checkout_session_id)).map(checkoutKey));
  const checkoutStarts = !tableOk
    ? notMeasurable(tableNote)
    : withCoverage(
      since.checkout_start === null || end <= since.checkout_start
        ? notMeasurable(since.checkout_start === null ? 'No checkout starts recorded yet.' : 'Checkout tracking began after this period.')
        : metric(starterKeys.size, { checkoutSessions: checkoutEvents.length }),
      coverage(since.checkout_start, start, end, 'Checkout starts'),
    );

  const visitToPaid = visitors.value === null ? notMeasurable('Visitors are not measurable for this period.') : ratio(paidInRange.length, visitors.value);
  const checkoutToPaid = checkoutStarts.value === null ? notMeasurable('Checkout starts are not measurable for this period.') : ratio(convertedStarters.size, starterKeys.size);

  // Lead → purchase: lead visitors in range who (at any time) started a
  // checkout that became a paid enrollment.
  const paidVisitors = new Set(prepared.enrollments.filter((en) => isPaidKind(en.kind) && en.checkoutStart?.visitor_id).map((en) => en.checkoutStart.visitor_id));
  const leadVisitors = new Set(leadEvents.map((e) => e.visitor_id).filter(Boolean));
  const leadToPurchase = leads.value === null ? notMeasurable('Leads are not measurable for this period.') : ratio([...leadVisitors].filter((v) => paidVisitors.has(v)).length, leadVisitors.size);

  // Students — cohort = paid students who enrolled in the range.
  const paidStudents = prepared.students.filter((s) => isPaidKind(s.kind));
  const cohort = paidStudents.filter((s) => inRange(s.enrolledAt, start, end));
  const activatedCohort = cohort.filter((s) => s.activated);
  const certifiedCohort = cohort.filter((s) => s.certifiedAt !== null);
  const certsInRange = paidStudents.filter((s) => inRange(s.certifiedAt, start, end));
  const allCertsInRange = prepared.students.filter((s) => inRange(s.certifiedAt, start, end));
  const daysToCert = certsInRange.filter((s) => s.enrolledAt !== null && s.certifiedAt >= s.enrolledAt).map((s) => (s.certifiedAt - s.enrolledAt) / DAY_MS);
  const moduleCompletionsInRange = paidStudents.reduce((n, s) => n + s.moduleCompletions.filter((t) => inRange(t, start, end)).length, 0);

  const students = {
    cohortSize: metric(cohort.length),
    activations: metric(paidStudents.filter((s) => inRange(s.activatedAt, start, end)).length, {
      note: 'Students whose first recorded course activity falls in this period.',
    }),
    activationRate: ratio(activatedCohort.length, cohort.length, { note: 'Of paid students who enrolled in this period, share who have started the course.' }),
    certifications: metric(certsInRange.length, { allStudents: allCertsInRange.length }),
    certificationRate: ratio(certifiedCohort.length, cohort.length, { note: 'Of paid students who enrolled in this period, share certified so far (young cohorts will read low).' }),
    medianDaysToCertification: daysToCert.length ? metric(median(daysToCert), { n: daysToCert.length }) : insufficient('No paid student certified in this period.'),
    moduleCompletions: metric(moduleCompletionsInRange),
  };

  // Product adoption — usage in range, among paid students who had started
  // the course by the end of the range.
  const adoptionBase = paidStudents.filter((s) => s.activated && s.enrolledAt !== null && s.enrolledAt < end);
  const usedIn = (times) => times.some((t) => inRange(t, start, end));
  const cadenceUsers = adoptionBase.filter((s) => usedIn(s.cadence.map((c) => c.t)));
  const askUsers = adoptionBase.filter((s) => usedIn(s.cadence.filter((c) => c.mode === 'ask_cadence').map((c) => c.t)));
  const timerUsers = adoptionBase.filter((s) => usedIn(s.timerTimes));
  const resourceUsers = adoptionBase.filter((s) => usedIn(s.resourceTimes));
  const adoptionRatio = (users, sinceKey, label) => {
    if (sinceKey && !tableOk) return notMeasurable(tableNote);
    if (sinceKey) {
      const cov = coverage(since[sinceKey], start, end, label);
      if (!cov.measured) return notMeasurable(cov.note);
      return withCoverage(ratio(users.length, adoptionBase.length), cov);
    }
    return ratio(users.length, adoptionBase.length);
  };
  const cohortUsage = (days) => {
    const eligible = paidStudents.filter((s) => s.enrolledAt !== null && s.enrolledAt <= now - days * DAY_MS);
    if (!eligible.length) return insufficient(`No paid student has been enrolled ${days}+ days yet.`, { eligible: 0 });
    const retained = eligible.filter((s) => s.lastActivityAt !== null && s.lastActivityAt >= s.enrolledAt + days * DAY_MS);
    return ratio(retained.length, eligible.length, { eligible: eligible.length, note: `Of paid students enrolled ${days}+ days, share with any AIMT activity ${days}+ days after enrolling.` });
  };
  const adoption = {
    base: metric(adoptionBase.length),
    cadenceUsers: prepared.cadenceTable === 'present' ? adoptionRatio(cadenceUsers, null, 'Cadence') : notMeasurable('cadence_messages could not be read.'),
    askCadenceUsers: prepared.cadenceTable === 'present' ? adoptionRatio(askUsers, null, 'Ask Cadence') : notMeasurable('cadence_messages could not be read.'),
    serviceTimerUsers: adoptionRatio(timerUsers, 'service_timer_used', 'Service Timer use'),
    resourceUsers: adoptionRatio(resourceUsers, 'resource_used', 'Resource use'),
    usage30d: cohortUsage(30),
    usage90d: cohortUsage(90),
  };

  // Attribution tables
  const attribution = tableOk ? buildAttribution(prepared, { visits, leadEvents, paidInRange, model }) : null;

  return {
    range: { start: Number.isFinite(start) ? new Date(start).toISOString() : null, end: new Date(end).toISOString(), model },
    dataQuality: {
      growthTable: prepared.growthTable,
      growthTruncated: prepared.growthTruncated,
      internalVisitorsExcluded: prepared.internalVisitorCount,
      instrumentedSince: Object.fromEntries(Object.entries(since).map(([k, v]) => [k, v === null ? null : new Date(v).toISOString()])),
    },
    acquisition: { visitors, salesPageVisitors },
    leads: { readinessStarts, readinessCompletions, readinessCompletionRate: readinessStarts.value === null ? notMeasurable(readinessStarts.note) : ratio(readinessCompletions.value, readinessStarts.value), leads },
    sales: { checkoutStarts, paidEnrollments, revenue, visitToPaid, checkoutToPaid, leadToPurchase },
    students,
    adoption,
    attribution,
  };
}

function buildAttribution(prepared, { visits, leadEvents, paidInRange, model }) {
  const dims = {
    channel: (c) => ({ key: `${c.source} / ${c.medium}`, source: c.source, medium: c.medium }),
    campaign: (c) => ({ key: `${c.source} / ${c.medium} / ${c.campaign}`, source: c.source, medium: c.medium, campaign: c.campaign }),
    creative: (c) => ({ key: `${c.source} / ${c.content}`, source: c.source, content: c.content, creative: parseCreativeId(c.content === '(none)' ? '' : c.content) }),
  };
  const out = {};
  for (const [dim, keyFn] of Object.entries(dims)) {
    const rows = new Map();
    const row = (touch) => {
      const k = keyFn(channelFor(touch));
      if (!rows.has(k.key)) rows.set(k.key, { ...k, visitors: new Set(), leads: new Set(), paid: 0, revenue: 0 });
      return rows.get(k.key);
    };
    for (const e of visits) if (e.visitor_id) row(touchOf(e, model)).visitors.add(e.visitor_id);
    for (const e of leadEvents) if (e.visitor_id) row(touchOf(e, model)).leads.add(e.visitor_id);
    for (const en of paidInRange) {
      const r = en.checkoutStart
        ? row(touchOf(en.checkoutStart, model))
        : (rows.get('(unattributed)') || rows.set('(unattributed)', { key: '(unattributed)', source: '(unattributed)', medium: '', visitors: new Set(), leads: new Set(), paid: 0, revenue: 0 }).get('(unattributed)'));
      r.paid += 1;
      const p = en.paidRecord?.props;
      if (p && p.currency === 'usd' && Number.isInteger(p.amount_total)) r.revenue += p.amount_total;
    }
    out[dim] = [...rows.values()]
      .map((r) => ({ ...r, visitors: r.visitors.size, leads: r.leads.size }))
      .sort((a, b) => b.revenue - a.revenue || b.paid - a.paid || b.leads - a.leads || b.visitors - a.visitors)
      .slice(0, 50);
  }
  return out;
}

// ── Weekly scoreboard ────────────────────────────────────────────────
// Weeks run Monday 00:00 UTC → next Monday 00:00 UTC. Column 0 is the
// current week-to-date (partial); the rest are completed weeks.

export function weekStartUtc(t) {
  const d = new Date(t);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day);
}

export const SCOREBOARD_METRICS = Object.freeze([
  ['qualified_visitors', 'Qualified visitors', (r) => r.acquisition.visitors],
  ['sales_page_visitors', 'Head Spa sales-page visitors', (r) => r.acquisition.salesPageVisitors],
  ['readiness_starts', 'Readiness Audit starts', (r) => r.leads.readinessStarts],
  ['readiness_completions', 'Readiness Audit completions', (r) => r.leads.readinessCompletions],
  ['leads', 'Leads', (r) => r.leads.leads],
  ['checkout_starts', 'Checkout starts', (r) => r.sales.checkoutStarts],
  ['paid_enrollments', 'Paid enrollments', (r) => r.sales.paidEnrollments],
  ['revenue', 'Revenue (gross, USD)', (r) => r.sales.revenue],
  ['site_to_purchase', 'Site → purchase conversion', (r) => r.sales.visitToPaid],
  ['lead_to_purchase', 'Lead → purchase conversion', (r) => r.sales.leadToPurchase],
  ['activation_rate', 'Activation rate (week cohort)', (r) => r.students.activationRate],
  ['certification_rate', 'Certification rate (week cohort)', (r) => r.students.certificationRate],
  ['median_days_to_certification', 'Median days to certification', (r) => r.students.medianDaysToCertification],
  ['cadence_adoption', 'Cadence adoption', (r) => r.adoption.cadenceUsers],
  ['service_timer_adoption', 'Service Timer adoption', (r) => r.adoption.serviceTimerUsers],
  ['resource_adoption', 'Resource adoption', (r) => r.adoption.resourceUsers],
  ['usage_30d', '30-day continued usage (current)', (r) => r.adoption.usage30d],
  ['usage_90d', '90-day continued usage (current)', (r) => r.adoption.usage90d],
  ['referrals', 'Referrals', () => notMeasurable('No referral system exists yet.')],
]);

export function computeScoreboard(prepared, { weeks = 8, now = Date.now(), model = 'first' } = {}) {
  const current = weekStartUtc(now);
  const columns = [];
  for (let i = 0; i <= weeks; i++) {
    const start = current - i * 7 * DAY_MS;
    const end = i === 0 ? now : start + 7 * DAY_MS;
    const report = computeGrowthReport(prepared, { start, end, model, now });
    columns.push({
      weekStart: new Date(start).toISOString().slice(0, 10),
      partial: i === 0,
      values: Object.fromEntries(SCOREBOARD_METRICS.map(([key, , pick]) => {
        const m = pick(report);
        // 30/90-day usage is a point-in-time cohort measure; only meaningful "as of now".
        if ((key === 'usage_30d' || key === 'usage_90d') && i !== 0) return [key, { value: null, status: 'current_only' }];
        return [key, { value: m.value, status: m.status, numerator: m.numerator, denominator: m.denominator, note: m.note }];
      })),
    });
  }
  return { metrics: SCOREBOARD_METRICS.map(([key, label]) => ({ key, label })), columns };
}
