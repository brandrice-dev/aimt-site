/* Keeps native private images + Listen Mode audio authorized during a long lesson.
   Runs only inside the delivered private course document. */
(function () {
  'use strict';
  let running = false;
  async function renew() {
    if (running || typeof supabaseClient === 'undefined' || !supabaseClient) return;
    running = true;
    try {
      const sessionResult = await supabaseClient.auth.getSession();
      const token = sessionResult && sessionResult.data && sessionResult.data.session &&
        sessionResult.data.session.access_token;
      if (!token) return;
      await fetch('/api/course-session', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { Authorization: 'Bearer ' + token }
      });
    } catch (_) { /* The private media API independently enforces access. */ }
    finally { running = false; }
  }
  function start() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
    renew();
    supabaseClient.auth.onAuthStateChange(function (event) {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') setTimeout(renew, 0);
    });
    setInterval(renew, 9 * 60 * 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
