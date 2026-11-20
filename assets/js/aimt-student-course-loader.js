/* Student course bootstrap only. No curriculum may be embedded in this file.
   On an approved cutover, load course-app from a private Storage bucket
   through the entitlement-checked Cloudflare endpoint. */
(async () => {
  const status = document.getElementById('course-status');
  const actions = document.getElementById('course-actions');
  const setStatus = (text) => { status.textContent = text; };
  try {
    if (!window.supabase) throw new Error('sign-in service is unavailable');
    const client = window.supabase.createClient(
      'https://epcnkncyxqgscrejinwr.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY25rbmN5eHFnc2NyZWppbndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTc5MDcsImV4cCI6MjA5MjIzMzkwN30.jB6JIr9sYwOAYQz7k1nJj2XVGp3q1kQU-jbfy4Z3mH0',
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }
    );
    const { data, error } = await client.auth.getSession();
    if (error || !data?.session?.access_token) {
      setStatus('Sign in to open your course.');
      actions.innerHTML = '<a href="/student-access">Sign in</a>';
      return;
    }
    setStatus('Checking your course access…');
    const response = await fetch('/api/course-material?resource=course-app', {
      headers: { Authorization: 'Bearer ' + data.session.access_token },
      cache: 'no-store', credentials: 'same-origin', redirect: 'error'
    });
    if (response.status === 401) {
      setStatus('Your session has expired. Please sign in again.');
      actions.innerHTML = '<a href="/student-access">Sign in</a>';
      return;
    }
    if (response.status === 403) {
      setStatus('Your account does not have access to this course.');
      actions.innerHTML = '<a href="/my-aimt">Return to My AIMT</a>';
      return;
    }
    if (!response.ok) throw new Error('The course is temporarily unavailable.');
    const courseHTML = await response.text();
    if (!/^\s*<!doctype html/i.test(courseHTML) || !/<html\b/i.test(courseHTML)) {
      throw new Error('The course could not be loaded.');
    }
    // The response is server-allowlisted content, fetched after Supabase auth
    // and entitlement verification. Same-origin document replacement retains
    // the normal localStorage, location search, assets and progress behavior.
    document.open();
    document.write(courseHTML);
    document.close();
  } catch (_) {
    setStatus('The course is temporarily unavailable. Your progress is safe.');
    actions.innerHTML = '<a href="/my-aimt">Return to My AIMT</a>';
  }
})();