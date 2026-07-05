# Session 1 — Deploy Notes
**Contents:** Stripe webhook · claim endpoint price validation · progress/Cadence-memory cloud sync · hardened Cadence Worker

Work through this top to bottom. Total hands-on time: ~1 hour.

---

## 1. Files → repo (commit + push, Cloudflare auto-deploys)

| File in this zip | Goes to | Action |
|---|---|---|
| `supabase/migrations/20260705_create_course_progress.sql` | same path | NEW — commit for record, **also run in Supabase** (step 2) |
| `functions/api/stripe-webhook.js` | same path | NEW |
| `functions/api/claim-course-access.js` | same path | **REPLACES** existing (adds price validation, nothing else changed) |
| `assets/js/aimt-progress-sync.js` | same path | NEW |
| `cadence-worker/worker.js` | ⚠️ NOT the Pages repo | Paste into the **headspa-proxy Worker** (step 5) |

---

## 2. Supabase — run the migration
Dashboard → SQL Editor → paste the contents of
`20260705_create_course_progress.sql` → Run. Idempotent; safe to re-run.

---

## 3. Stripe — create the webhook
1. Stripe Dashboard → Developers → Webhooks → **Add endpoint**
2. URL: `https://YOUR-DOMAIN/api/stripe-webhook`
   (use the .pages.dev URL for now; **update this when the custom domain lands**)
3. Events: select only `checkout.session.completed`
4. Copy the **Signing secret** (`whsec_...`)
5. Cloudflare Pages → your project → Settings → Environment variables →
   add `STRIPE_WEBHOOK_SECRET` = that secret (Production)
6. After deploy: Stripe webhook page → **Send test event** → expect 200.
   (The test event has no real line items, so it logs `webhook_unknown_price`
   in `aimt_logs` — that's the correct behavior for a test event.)

---

## 4. The two edits inside `headspa-mastery.html`
These are the only in-file changes. Do them via Codex/Claude Code or by hand.

### Edit A — load the sync script (line ~5908)
Find:
```html
<script src="assets/js/headspa-state.js"></script>
```
Add directly AFTER it:
```html
<script src="assets/js/aimt-progress-sync.js"></script>
```

### Edit B — replace `callAI` so Cadence sends the session token (line ~ the `// ── API KEY ──` block)
Find the existing `async function callAI(system, messages, maxTokens = 600) { ... }`
and replace the whole function with:

```javascript
async function callAI(system, messages, maxTokens = 600) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    let accessToken = '';
    try {
      const { data } = await supabaseClient.auth.getSession();
      accessToken = data?.session?.access_token || '';
    } catch (_) {}
    const r = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: 'Bearer ' + accessToken } : {})
      },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: maxTokens, system, messages }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error?.message || 'Network error'); }
    const d = await r.json();
    return d.content[0].text;
  } catch(e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') throw new Error('Request timed out — check your connection');
    throw e;
  }
}
```

### Edit C — start the sync on gated entry (line ~7541)
In `enterPurchasedCourseHome()`, add ONE line before `renderHomeProgress();`:

```javascript
  if (window.AIMT_SYNC && window.supabaseClient) { AIMT_SYNC.init(supabaseClient, 'headspa-mastery'); }
```

The sync layer re-renders home progress itself if cloud state wins
(it dispatches `aimt:progress-restored` and calls `renderHomeProgress`),
so no other changes are needed.

---

## 5. Cadence Worker — replace + configure
1. Cloudflare dashboard → Workers → **headspa-proxy** → Quick Edit →
   replace ALL code with `cadence-worker/worker.js` → Deploy.
2. Worker → Settings → Variables — add:

| Variable | Value | Encrypt? |
|---|---|---|
| `ANTHROPIC_API_KEY` | your key (likely already there) | ✅ |
| `SUPABASE_URL` | `https://epcnkncyxqgscrejinwr.supabase.co` | – |
| `SUPABASE_ANON_KEY` | your anon key | – |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key | ✅ |
| `ALLOWED_ORIGINS` | `https://aimt-site.pages.dev` (add custom domain later, comma-separated) | – |
| `STAFF_EMAILS` | your 3 staff emails, comma-separated | – |

⚠️ **Deploy order matters:** ship the `headspa-mastery.html` edits (step 4)
in the same push or BEFORE updating the Worker — otherwise the old page
sends no token and Cadence returns 401s to any active students.
(Pre-launch, this only affects you.)

---

## 6. Verify (10 minutes)
- [ ] Buy with Stripe test mode OR check `aimt_logs` after a live purchase → `webhook_entitlement_written` row appears **without** visiting success.html
- [ ] Sign in on Device A, complete a checkpoint, wait ~5s → row appears in `course_progress` (Supabase table editor)
- [ ] Sign in on Device B (or incognito) → progress and Cadence's memory are there
- [ ] Ask Cadence something while signed in → normal reply
- [ ] `curl -X POST https://headspa-proxy.../ -d '{}'` from a terminal → 403/401 (proxy is closed)
- [ ] Console shows `[aimt-sync] initialized for headspa-mastery`

## What this session closed (from the audit)
- ✅ #3 Progress + Cadence memory cloud sync
- ✅ #4 Cadence proxy secured
- ✅ #8 Stripe webhook (server-side entitlements)
- ✅ #9 Price validation in claim endpoint
- ✅ #10 (partial) staff allowlist enforced server-side in the Worker —
  full client-side removal comes in Session 2
