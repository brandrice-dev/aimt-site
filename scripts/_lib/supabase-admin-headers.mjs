/* Server-only Supabase Storage migration credentials.
   New sb_secret_* API keys are opaque, not JWTs: send apikey ONLY.
   Legacy service_role JWT keys are accepted for existing installations.
   Never expose or print either key. */
export function adminHeaders(key) {
  const value = String(key || '').trim();
  if (/^sb_secret_[A-Za-z0-9_-]{8,}$/.test(value)) {
    return { apikey: value };
  }
  if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)) {
    return { apikey: value, Authorization: 'Bearer ' + value };
  }
  throw new Error('An elevated Supabase secret or legacy service_role JWT is required.');
}
