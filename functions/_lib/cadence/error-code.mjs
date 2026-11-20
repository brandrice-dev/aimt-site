/* Privacy-safe Cadence error categorization. Never return provider bodies,
   API keys, headers, prompts, student content, or stack traces to browsers. */
export function cadenceFailureCode(error) {
  const message = String(error && error.message || '');
  if (message === 'ANTHROPIC_API_KEY not configured') return 'KEY_MISSING';
  const http = message.match(/^Cadence request failed \((\d{3})\):/);
  if (http) {
    const status = Number(http[1]);
    if (status === 401 || status === 403) return 'KEY_REJECTED';
    if (status === 402 || /credit.balance|billing|insufficient.credit/i.test(message)) return 'BILLING';
    if (status === 404) return 'MODEL_UNAVAILABLE';
    if (status === 429) return 'RATE_LIMIT';
    if (status >= 500) return 'PROVIDER_UNAVAILABLE';
    return 'PROVIDER_ERROR';
  }
  if (/^.*model.*registry|no APPROVED model|model.*override/i.test(message)) return 'MODEL_CONFIGURATION';
  if (/^Cadence response was truncated/.test(message)) return 'RESPONSE_TRUNCATED';
  return 'RESPONSE_ERROR';
}
