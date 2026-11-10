// A contact gate, not account authentication. No contact data in browser storage or analytics.
export async function saveToolContact(payload, send = fetch) {
  const res = await send('/api/free-tools/submit', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(15000),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.saved !== true) throw new Error('Your details could not be saved. Please try again.');
}
export function bindToolCapture(root = document) {
  const form = root.getElementById('freeToolContact');
  if (!form) return;
  const content = root.getElementById('freeToolContent');
  const gate = root.getElementById('freeToolGate');
  const status = root.getElementById('freeToolContactStatus');
  const button = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity() || button.disabled) return;
    button.disabled = true;
    status.textContent = 'Saving your details…';
    try {
      await saveToolContact({
        first_name: form.elements.first_name.value.trim(),
        email: form.elements.email.value.trim(),
        marketing_consent: form.elements.marketing_consent.checked,
        website: form.elements.website.value,
        tool: form.dataset.tool,
      });
      form.reset();
      content.hidden = false;
      gate.hidden = true;
      content.querySelector('input,textarea,button')?.focus();
    } catch {
      status.textContent = 'Your details could not be saved. Please try again.';
      button.disabled = false;
    }
  });
}
if (typeof document !== 'undefined') bindToolCapture();
