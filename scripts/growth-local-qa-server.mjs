#!/usr/bin/env node
/* AIMT Growth — local end-to-end QA server (dev-only, never deployed;
   scripts/ is 404'd by functions/[[path]].js).

   Serves the site from the repo root AND runs the REAL Pages Function
   handlers (growth collect, create-checkout-session, stripe-webhook, admin)
   against an in-memory stand-in for Supabase (REST + Auth) and Stripe, so
   the full funnel can be driven in a browser with zero production traffic:

     - every served .html/.js has the production Supabase URL rewritten to
       this server's /__supabase mock, so pages (supabase-js auth, anon
       aimt_logs writes, entitlement gates) never reach production
     - Stripe: checkout returns a hosted URL pointing at /__qa/stripe, whose
       "Pay" button signs a checkout.session.completed event and delivers it
       to the real webhook handler
     - /__qa/state           JSON dump of the mock tables (growth_events etc.)
     - /__qa/seed-activity   simulates course activity, a Cadence message and
                             a certificate for the QA student (these come from
                             existing authorities this step does not modify)

   Test accounts (local mock only; see SEED below):
     qa-owner@aimt.test   — admin_users owner
     qa-student@aimt.test — buys the course in the QA flow
   Run: node scripts/growth-local-qa-server.mjs [port]  (default 8791)
*/
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { onRequestPost as collect } from '../functions/api/growth/collect.js';
import { onRequestPost as createCheckout } from '../functions/api/create-checkout-session.js';
import { onRequestPost as webhook } from '../functions/api/stripe-webhook.js';
import { onRequestGet as adminGet, onRequestPost as adminPost } from '../functions/api/admin/index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2]) || 8791;
const ORIGIN = `http://localhost:${PORT}`;
const MOCK_SUPABASE = `${ORIGIN}/__supabase`;
const PROD_SUPABASE = 'https://epcnkncyxqgscrejinwr.supabase.co';
const WEBHOOK_SECRET = 'whsec_local_qa';
const PRICE = 'price_local_qa';
const QA_PASSWORD = process.env.AIMT_QA_PASSWORD || 'local-qa-only';

const ENV = {
  SUPABASE_URL: MOCK_SUPABASE,
  SUPABASE_SERVICE_ROLE_KEY: 'local-qa-service-role',
  STRIPE_SECRET_KEY: 'sk_live_local_qa_mock', // in-memory mock only — never a real key
  STRIPE_PRICE_ID: PRICE,
  STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
};

const OWNER_ID = 'aaaaaaaa-0000-4000-8000-00000000000a';
const STUDENT_ID = 'aaaaaaaa-0000-4000-8000-00000000000b';
const db = {
  users: [
    { id: OWNER_ID, email: 'qa-owner@aimt.test', user_metadata: { first_name: 'QA', last_name: 'Owner' }, created_at: new Date().toISOString() },
    { id: STUDENT_ID, email: 'qa-student@aimt.test', user_metadata: { first_name: 'QA', last_name: 'Student' }, created_at: new Date().toISOString() },
  ],
  tables: {
    growth_events: [],
    course_entitlements: [
      { checkout_session_id: 'admin-grant-staff-qa', course_slug: 'headspa-mastery', purchaser_email: 'qa-staff@aimt.test', user_id: null, granted_at: new Date().toISOString() },
    ],
    admin_users: [{ user_id: OWNER_ID, role: 'owner', active: true }],
    admin_audit_log: [],
    course_progress: [],
    completions: [],
    cadence_messages: [],
    certification_attempts: [],
    certification_review_requests: [],
    certification_educator_requests: [],
    aimt_logs: [],
  },
  stripeSessions: {},
};

// ── Mock PostgREST / GoTrue ───────────────────────────────────────────
function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}
function tokenUser(headers) {
  const auth = headers.get ? headers.get('Authorization') : headers?.Authorization;
  const token = String(auth || '').replace(/^Bearer\s+/, '');
  const id = token.startsWith('qa-token-') ? token.slice(9) : null;
  return db.users.find((u) => u.id === id) || null;
}
function matchFilter(row, key, expr) {
  if (expr.startsWith('eq.')) return String(row[key]) === decodeURIComponent(expr.slice(3));
  if (expr.startsWith('like.')) return String(row[key] ?? '').startsWith(expr.slice(5).replace(/\*.*$/, ''));
  if (expr.startsWith('in.')) return expr.slice(4, -1).split(',').includes(String(row[key]));
  return true;
}
function applyFilters(rows, params) {
  let out = rows;
  for (const [k, v] of params) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(k)) continue;
    if (k === 'or') {
      const parts = v.replace(/^\(|\)$/g, '').split(',');
      out = out.filter((r) => parts.some((p) => { const [col, op, ...rest] = p.split('.'); return matchFilter(r, col, `${op}.${rest.join('.')}`); }));
      continue;
    }
    out = out.filter((r) => matchFilter(r, k, v));
  }
  const order = params.get('order');
  if (order) {
    const [col, dir] = order.split('.');
    out = [...out].sort((a, b) => String(a[col] ?? '').localeCompare(String(b[col] ?? '')) * (dir === 'desc' ? -1 : 1));
  }
  const offset = Number(params.get('offset') || 0);
  const limit = params.has('limit') ? Number(params.get('limit')) : Infinity;
  return out.slice(offset, offset + limit);
}
function project(table, rows, select) {
  if (table === 'course_progress' && select && select.includes('progress:state->progress')) {
    return rows.map((r) => ({ user_id: r.user_id, updated_at: r.updated_at, progress: r.state?.progress ?? null, intro_complete: r.state?.student?.introComplete ?? null }));
  }
  if (table === 'cadence_messages' && select) {
    const cols = select.split(',');
    return rows.map((r) => Object.fromEntries(cols.map((c) => [c, r[c]])));
  }
  return rows;
}

async function supabaseMock(url, init = {}) {
  const u = new URL(url);
  const p = u.pathname.replace('/__supabase', '');
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers || {});
  const bodyText = typeof init.body === 'string' ? init.body : (init.body ? await new Response(init.body).text() : '');

  if (p === '/auth/v1/token') {
    const body = JSON.parse(bodyText || '{}');
    const user = db.users.find((x) => x.email === String(body.email || '').toLowerCase());
    if (u.searchParams.get('grant_type') === 'refresh_token') {
      const id = String(body.refresh_token || '').replace('qa-refresh-', '');
      const ru = db.users.find((x) => x.id === id);
      if (!ru) return json({ error: 'invalid_grant' }, 400);
      return json(session(ru));
    }
    if (!user || body.password !== QA_PASSWORD) return json({ error: 'invalid_grant', error_description: 'Invalid login credentials' }, 400);
    return json(session(user));
  }
  if (p === '/auth/v1/user') {
    const user = tokenUser(headers);
    return user ? json(user) : json({ msg: 'invalid JWT' }, 401);
  }
  if (p === '/auth/v1/logout') return new Response(null, { status: 204 });
  if (p === '/auth/v1/admin/users') return json({ users: db.users });
  if (p.startsWith('/auth/v1/admin/users/')) {
    const user = db.users.find((x) => x.id === decodeURIComponent(p.split('/').pop()));
    return user ? json(user) : json({}, 404);
  }

  const table = p.replace('/rest/v1/', '');
  const rows = db.tables[table];
  if (!rows) return json([]);
  if (method === 'POST') {
    const payload = JSON.parse(bodyText || 'null');
    const list = Array.isArray(payload) ? payload : [payload];
    const stored = [];
    for (const row of list) {
      if (table === 'growth_events') {
        if (rows.some((r) => r.event_name === row.event_name && r.dedupe_key === row.dedupe_key)) continue;
        const r = { id: crypto.randomUUID(), occurred_at: new Date().toISOString(), ...row };
        rows.push(r); stored.push(r); continue;
      }
      if (table === 'course_entitlements') {
        const existing = rows.find((r) => r.checkout_session_id === row.checkout_session_id);
        if (existing) { Object.assign(existing, row); stored.push(existing); continue; }
      }
      if (table === 'course_progress') {
        const existing = rows.find((r) => r.user_id === row.user_id && r.course_slug === row.course_slug);
        if (existing) { Object.assign(existing, row, { updated_at: new Date().toISOString() }); stored.push(existing); continue; }
      }
      const r = { granted_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...row };
      rows.push(r); stored.push(r);
    }
    return json(stored, 201);
  }
  if (method === 'DELETE') {
    const keep = rows.filter((r) => !applyFilters([r], u.searchParams).length);
    db.tables[table] = keep;
    return new Response(null, { status: 204 });
  }
  if (method === 'PATCH') return json([]);
  return json(project(table, applyFilters(rows, u.searchParams), u.searchParams.get('select')));
}
function session(user) {
  return { access_token: `qa-token-${user.id}`, refresh_token: `qa-refresh-${user.id}`, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user };
}

function stripeMock(url, init = {}) {
  const u = new URL(url);
  const method = (init.method || 'GET').toUpperCase();
  if (u.pathname === '/v1/checkout/sessions' && method === 'POST') {
    const id = `cs_live_qa_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    db.stripeSessions[id] = { id, payment_status: 'unpaid', status: 'open', amount_total: 59700, amount_subtotal: 59700, total_details: { amount_discount: 0 }, currency: 'usd', livemode: true, created: Math.floor(Date.now() / 1000) };
    return json({ id, url: `${ORIGIN}/__qa/stripe?cs=${id}`, client_secret: `${id}_secret` });
  }
  if (u.pathname.endsWith('/line_items')) return json({ data: [{ price: { id: PRICE } }] });
  const m = u.pathname.match(/^\/v1\/checkout\/sessions\/([^/]+)$/);
  if (m) return db.stripeSessions[m[1]] ? json(db.stripeSessions[m[1]]) : json({ error: { message: 'No such checkout.session' } }, 404);
  return json({ error: { message: 'unhandled stripe mock' } }, 400);
}

const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  if (url.startsWith(MOCK_SUPABASE)) return supabaseMock(url, init);
  if (url.startsWith('https://api.stripe.com')) return stripeMock(url, init);
  if (url.startsWith('https://api.resend.com')) return json({ id: 'local-qa' });
  return realFetch(input, init);
};

// ── QA helpers ────────────────────────────────────────────────────────
async function signedWebhookRequest(event) {
  const payload = JSON.stringify(event);
  const ts = Math.floor(Date.now() / 1000);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${ts}.${payload}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return new Request(`${ORIGIN}/api/stripe-webhook`, { method: 'POST', headers: { 'stripe-signature': `t=${ts},v1=${hex}` }, body: payload });
}

const STRIPE_PAGE = (cs) => `<!doctype html><html><head><meta charset="utf-8"><title>Local QA — simulated Stripe</title>
<style>body{font-family:system-ui;background:#141210;color:#eee;display:grid;place-items:center;min-height:100vh;margin:0}form{background:#1d1a17;padding:28px;border-radius:14px;width:360px}input,button{width:100%;padding:10px;margin-top:10px;font:inherit;box-sizing:border-box}button{cursor:pointer}</style></head>
<body><form method="post" action="/__qa/pay"><h1>Simulated Stripe (local QA)</h1><p>No real payment. Checkout Session <code>${cs}</code>.</p>
<input type="hidden" name="cs" value="${cs}"><label>Buyer email<input name="email" value="qa-student@aimt.test"></label><button id="qaPay" type="submit">Pay $597 (simulated)</button></form></body></html>`;

async function handleQa(req, url, bodyText) {
  if (url.pathname === '/__qa/stripe') return new Response(STRIPE_PAGE(url.searchParams.get('cs') || ''), { headers: { 'Content-Type': 'text/html' } });
  if (url.pathname === '/__qa/pay') {
    const form = new URLSearchParams(bodyText);
    const cs = form.get('cs');
    const s = db.stripeSessions[cs];
    if (!s) return new Response('unknown session', { status: 404 });
    Object.assign(s, { payment_status: 'paid', status: 'complete', customer_details: { email: form.get('email'), name: 'QA Student' } });
    const res = await webhook({ request: await signedWebhookRequest({ type: 'checkout.session.completed', data: { object: s } }), env: ENV, waitUntil: () => {} });
    return new Response(`<!doctype html><meta charset="utf-8"><body style="font-family:system-ui;background:#141210;color:#eee;padding:40px"><h1 id="qaPaid">Webhook ${res.status}</h1><p>Session ${cs} paid (simulated).</p></body>`, { headers: { 'Content-Type': 'text/html' } });
  }
  if (url.pathname === '/__qa/state') return json({ tables: db.tables, stripeSessions: db.stripeSessions });
  if (url.pathname === '/__qa/seed-activity') {
    const now = Date.now();
    const ent = db.tables.course_entitlements.find((e) => e.purchaser_email === 'qa-student@aimt.test');
    if (ent) ent.user_id = STUDENT_ID; // what success.html's claim does
    const progress = { 0: { complete: true, startedAt: now - 3600e3, completedAt: now - 1800e3 }, 1: { complete: false, startedAt: now - 600e3 } };
    const existing = db.tables.course_progress.find((r) => r.user_id === STUDENT_ID);
    const row = { user_id: STUDENT_ID, course_slug: 'headspa-mastery', state: { progress, student: { introComplete: true, notes: 'PRIVATE NOTE — must never reach growth' } }, updated_at: new Date().toISOString() };
    if (existing) Object.assign(existing, row); else db.tables.course_progress.push(row);
    db.tables.cadence_messages.push({ id: crypto.randomUUID(), user_id: STUDENT_ID, course_slug: 'headspa-mastery', role: 'user', mode: 'ask_cadence', content: 'PRIVATE CADENCE QUESTION — must never reach growth', created_at: new Date().toISOString() });
    if (url.searchParams.get('certify') === '1' && !db.tables.completions.some((c) => c.user_id === STUDENT_ID)) {
      db.tables.completions.push({ credential_id: 'AIMT-QA-0001', user_id: STUDENT_ID, course_slug: 'headspa-mastery', student_name: 'QA Student', completed_at: new Date().toISOString(), revoked: false });
    }
    return json({ ok: true });
  }
  return null;
}

// ── HTTP plumbing ─────────────────────────────────────────────────────
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf', '.json': 'application/json', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };

async function resolveStatic(pathname) {
  const clean = decodeURIComponent(pathname);
  const aliases = { '/': '/index.html', '/head-spa-certification': '/headspa-mastery.html' };
  const candidates = [aliases[clean], clean, `${clean}.html`, `${clean.replace(/\/$/, '')}.html`, path.join(clean, 'index.html')].filter(Boolean);
  for (const c of candidates) {
    const file = path.join(ROOT, c);
    if (!file.startsWith(ROOT)) continue;
    try { if ((await stat(file)).isFile()) return file; } catch { /* next */ }
  }
  return null;
}

async function toNode(res, nodeRes) {
  const headers = {};
  res.headers.forEach((v, k) => { headers[k] = v; });
  nodeRes.writeHead(res.status, headers);
  nodeRes.end(Buffer.from(await res.arrayBuffer()));
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, ORIGIN);
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const bodyText = Buffer.concat(chunks).toString('utf8');
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
    headers.set('CF-Connecting-IP', req.socket.remoteAddress || 'local');
    const request = new Request(url, { method: req.method, headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : bodyText });
    const context = { request, env: ENV, waitUntil: (p) => { Promise.resolve(p).catch(() => {}); } };

    if (url.pathname.startsWith('/__supabase/')) {
      const r = await supabaseMock(url.toString(), { method: req.method, headers: req.headers, body: bodyText || undefined });
      r.headers.set('Access-Control-Allow-Origin', '*');
      return toNode(r, res);
    }
    const qa = url.pathname.startsWith('/__qa/') ? await handleQa(req, url, bodyText) : null;
    if (qa) return toNode(qa, res);
    if (url.pathname === '/api/growth/collect' && req.method === 'POST') return toNode(await collect(context), res);
    if (url.pathname === '/api/create-checkout-session' && req.method === 'POST') return toNode(await createCheckout(context), res);
    if (url.pathname === '/api/admin') return toNode(await (req.method === 'POST' ? adminPost(context) : adminGet(context)), res);
    if (url.pathname.startsWith('/api/')) return toNode(json({ error: 'not available in local growth QA' }, 404), res);

    const file = await resolveStatic(url.pathname);
    if (!file) { res.writeHead(404); return res.end('not found'); }
    const ext = path.extname(file);
    let body = await readFile(file);
    if (ext === '.html' || ext === '.js') body = Buffer.from(body.toString('utf8').replaceAll(PROD_SUPABASE, MOCK_SUPABASE));
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch (error) {
    console.error(error);
    res.writeHead(500); res.end(String(error?.stack || error));
  }
}).listen(PORT, () => console.log(`AIMT growth local QA on ${ORIGIN}`));
