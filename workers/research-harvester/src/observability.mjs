/* ═══════════════════════════════════════════════════════════════
   AIMT Research Harvester Worker — safe logging/response helpers
   ---------------------------------------------------------------
   Single place responsible for making sure a secret value can never
   appear in a returned response body or a console.log line, no matter
   what xAI's API happens to echo back in an error message or how a
   future field gets added to the observability payload.
   ═══════════════════════════════════════════════════════════════ */

/** Replaces every occurrence of any given secret string with
    "[REDACTED]". Safe to call on text we didn't generate ourselves
    (e.g. an upstream API's own error message) -- defense in depth even
    though such text should never legitimately contain one of our
    secrets, since we never send them anywhere except as an
    Authorization/authorization value that a well-behaved API does not
    echo back. Ignores secrets shorter than 8 chars so this can't
    accidentally redact ordinary short words if a var is misconfigured
    to something trivial. */
export function redactSecrets(text, secrets) {
  let out = String(text ?? '');
  for (const s of secrets) {
    if (typeof s === 'string' && s.length >= 8) {
      out = out.split(s).join('[REDACTED]');
    }
  }
  return out;
}

/** Builds the list of live secret values to scrub for the current env
    -- called once per request/run so a newly-added secret only needs
    to be added here, never at each call site. */
export function secretsToRedact(env) {
  return [env.XAI_API_KEY, env.MCP_CONNECTOR_SECRET, env.HARVESTER_RUN_SECRET].filter(
    (v) => typeof v === 'string' && v.length > 0
  );
}

/** Truncates and redacts a safe-to-log error summary. Never includes a
    stack trace (which could echo request internals) -- just a short,
    scrubbed message. */
export function safeErrorSummary(env, err) {
  const raw = err && err.message ? err.message : String(err ?? 'unknown_error');
  return redactSecrets(raw, secretsToRedact(env)).slice(0, 500);
}

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
