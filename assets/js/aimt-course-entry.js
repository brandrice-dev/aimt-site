// Public entry contains no curriculum. Fetch the complete document only after
// server-side verification; never put credentials in a URL or persistent cache.
(function () {
  window.startCheckout = function () { window.location.href = '/enroll'; };
  window.showSignInPanel = function () { window.location.href = '/student-access'; };
  const params = new URLSearchParams(window.location.search);
  if (params.get('signin') === '1') { window.showSignInPanel(); return; }
  if (params.get('checkout') === 'canceled') {
    const status = document.getElementById('lpCheckoutStatus');
    if (status) status.style.display = 'block';
  }
  let handoff = false;
  try {
    const record = JSON.parse(sessionStorage.getItem('aimt_headspa_access_flow_handoff') || 'null');
    handoff = !!(record && record.issuedAt && Date.now() - Number(record.issuedAt) < 5 * 60 * 1000);
  } catch (_) {}
  if (params.get('enter') !== '1' && !handoff) return;

  async function enter() {
    const config = window.AIMT_COURSE_PUBLIC_CONFIG;
    if (!config || !window.supabase) throw new Error('Sign in required');
    const client = window.supabase.createClient(config.url, config.key);
    try {
      const { data, error } = await client.auth.getSession();
      const session = data && data.session;
      if (error || !session || !session.access_token) { window.showSignInPanel(); return; }
      const headers = { Authorization: 'Bearer ' + session.access_token };
      let response = await fetch('/head-spa-certification', { headers, cache: 'no-store' });
      // Preserve recovery of an already-paid pending checkout; the existing
      // claim endpoint remains the authority for payment/price validation.
      if (response.status === 403) {
        let sessionId = '';
        try { sessionId = localStorage.getItem('aimt_headspa_pending_checkout_session') || ''; } catch (_) {}
        if (sessionId) {
          const claim = await fetch('/api/claim-course-access', {
            method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, email: session.user.email }),
          });
          if (claim.ok) {
            try { localStorage.removeItem('aimt_headspa_pending_checkout_session'); } catch (_) {}
            response = await fetch('/head-spa-certification', { headers, cache: 'no-store' });
          }
        }
      }
      if (response.status === 401) { window.showSignInPanel(); return; }
      if (!response.ok) throw new Error('Course access unavailable');
      const html = await response.text();
      client.auth.stopAutoRefresh();
      // The response is same-origin, server-authorized HTML. Keep the existing
      // app and its script execution order, deep links and session handoff.
      document.open();
      document.write(html);
      document.close();
    } finally {
      client.auth.stopAutoRefresh();
    }
  }
  enter().catch(() => {
    const status = document.getElementById('lpCheckoutStatus');
    if (status) {
      status.textContent = 'We could not open your course. Please sign in through Student Access and try again.';
      status.style.display = 'block';
    }
  });
})();
