# Embedded Enrollment Checkout — Deploy Notes

**What changed:** enrollment payment now happens on `/enroll` (AIMT-branded page)
using **Stripe Embedded Checkout**, instead of redirecting to the generic
hosted `checkout.stripe.com` page. Downstream of payment nothing changed.

## Flow

```
Course page CTA (startCheckout) → /enroll
  → POST /api/create-checkout-session { ui: 'embedded' }
      → Stripe: ui_mode=embedded_page, same STRIPE_PRICE_ID, mode=payment,
        return_url=/success.html?session_id={CHECKOUT_SESSION_ID}
        (Stripe-Version pinned to 2026-03-25.dahlia on this request only)
      ← { clientSecret, publishableKey }
  → Stripe.js (js.stripe.com/dahlia) mounts the form inside /enroll
  → on payment Stripe navigates the page to success.html?session_id=cs_…
  → success.html → /api/claim-course-access (verifies with Stripe) → Student Access
  → checkout.session.completed webhook writes the entitlement + enrollment email (unchanged)
```

## Owner action required before this is fully live

1. **Cloudflare Pages → Settings → Environment variables (Production):**
   add `STRIPE_PUBLISHABLE_KEY` = your **live** publishable key (`pk_live_…`)
   from Stripe Dashboard → Developers → API keys. It must be the same mode
   (live/test) as `STRIPE_SECRET_KEY`. Publishable keys are public by design.
   Redeploy after adding it.
2. Until that variable exists (or if it is mismatched), `/enroll` automatically
   falls back to the old hosted redirect so enrollment never breaks. Each
   fallback logs `api_create_checkout_session_embedded_fallback` in `aimt_logs`
   with the reason.
3. Optional: Stripe Dashboard → Settings → Payment methods — embedded
   checkout offers the same dashboard-managed methods as the hosted page.

No webhook, Supabase, or price changes are required.

## Verify after deploy (owner — real payment)

- `/enroll` shows the Stripe form in-page (no redirect).
- Complete one real purchase (then refund it if desired) and confirm:
  success.html → account creation/sign-in → Student Access → course;
  `course_entitlements` row written; enrollment email received.
- `aimt_logs` has no `enroll_checkout_init_failure` /
  `api_create_checkout_session_embedded_fallback` rows.
