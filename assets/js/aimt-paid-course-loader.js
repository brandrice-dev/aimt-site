/* Secure public-to-private handoff for Head Spa Certification.
   Sales copy remains public; the paid course document is fetched only after
   Supabase token verification and server-side enrollment authorization. */
(function () {
  'use strict';
  const ACTIVE_KEY = 'aimt_headspa_course_tab_active';
  const HANDOFF_KEY = 'aimt_headspa_access_flow_handoff';
  const COURSE = '/api/course-material?resource=course-app';
  const SUPABASE_URL = 'https://epcnkncyxqgscrejinwr.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY25rbmN5eHFnc2NyZWppbndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTc5MDcsImV4cCI6MjA5MjIzMzkwN30.jB6JIr9sYwOAYQz7k1nJj2XVGp3q1kQU-jbfy4Z3mH0';
  function shouldOpenPrivateCourse() {
    const params = new URLSearchParams(location.search);
    if (['enter', 'cert', 'review', 'studentpreview', 'module', 'researchModule'].some(k => params.has(k))) return true;
    try {
      if (sessionStorage.getItem(ACTIVE_KEY) === '1') return true;
      const handoff = sessionStorage.getItem(HANDOFF_KEY);
      if (handoff && handoff !== 'false') return true;
    } catch (_) {}
    return false;
  }
  function showPublicPage() {
    document.body.classList.remove('app-loading');
    document.body.classList.add('app-ready');
    const landing = document.getElementById('landingPage');
    if (landing) landing.style.display = 'flex';
  }
  function accessError(message, signIn) {
    try { sessionStorage.removeItem(ACTIVE_KEY); } catch (_) {}
    showPublicPage();
    const landing = document.getElementById('landingPage');
    if (!landing) return;
    const messagePanel = document.createElement('div');
    messagePanel.setAttribute('role', 'alert');
    messagePanel.style.cssText = 'padding:1.2rem;max-width:68rem;margin:1rem auto;background:#281d1b;color:#fff;border:1px solid #8b675d;text-align:center';
    const textNode = document.createElement('p');
    textNode.textContent = message;
    messagePanel.appendChild(textNode);
    const action = document.createElement('a');
    action.href = signIn ? '/student-access' : '/my-aimt';
    action.textContent = signIn ? 'Sign in to AIMT' : 'Return to My AIMT';
    action.style.cssText = 'color:#fff;display:inline-block;margin-top:.8rem;text-decoration:underline';
    messagePanel.appendChild(action);
    landing.prepend(messagePanel);
  }
  async function open() {
    if (!shouldOpenPrivateCourse()) { showPublicPage(); return; }
    if (!window.supabase || !window.supabase.createClient) {
      accessError('Course sign-in could not load. Please refresh this page.', true);
      return;
    }
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    let session;
    try { const result = await client.auth.getSession(); session = result.data && result.data.session; }
    catch (_) { accessError('AIMT could not confirm your sign-in. Please try again.', true); return; }
    if (!session || !session.access_token) {
      accessError('Please sign in to continue your course.', true);
      return;
    }
    const authorization = { Authorization: 'Bearer ' + session.access_token };
    let media, course;
    try {
      media = await fetch('/api/course-session', {
        method: 'POST',
        credentials: 'same-origin',
        headers: authorization
      });
      if (!media.ok) {
        accessError(media.status === 403 ? 'This account does not currently have Head Spa Certification access.' : 'Course access could not be confirmed. Please try again.', media.status === 401);
        return;
      }
      course = await fetch(COURSE, { headers: authorization, credentials: 'same-origin', cache: 'no-store' });
      if (!course.ok) {
        accessError(course.status === 403 ? 'This account does not currently have Head Spa Certification access.' : 'Your course is temporarily unavailable. Your saved progress has not been changed.', course.status === 401);
        return;
      }
      const html = await course.text();
      if (!html.includes('id="courseHome"') || !html.includes('id="module12Wrap"')) throw new Error('Incomplete private course bundle');
      try { sessionStorage.setItem(ACTIVE_KEY, '1'); } catch (_) {}
      // The legacy course bootstrap requires ?enter=1 (or a one-shot
      // student-access handoff) even after the server has verified the
      // student. Its own startup immediately strips that parameter.
      // Restore it only in this verified handoff so refreshing a lesson
      // retains the course view rather than showing the sales page.
      const params = new URLSearchParams(window.location.search);
      if (params.get('enter') !== '1') {
        params.set('enter', '1');
        window.history.replaceState({}, document.title, window.location.pathname + '?' + params.toString());
      }
      // Reparse the complete, original HTML under the same first-party URL.
      // This preserves relative paths, Supabase storage, the original course
      // start-up lifecycle, checkpoints, Review Mode and certificate routes.
      document.open();
      document.write(html);
      document.close();
    } catch (_) {
      accessError('Your course could not load. Your saved progress has not been changed.', false);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', open, { once: true });
  else open();
})();
