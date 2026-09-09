/* ═══════════════════════════════════════════════════════════════
   AIMT Readiness — email delivery configuration seam
   ---------------------------------------------------------------
   Single source of truth for whether/where the Readiness Profile
   payload (see submitReadinessProfile() in head-spa-readiness.html)
   gets delivered by email. Read by:
     - head-spa-readiness.html   (submits the payload on gate submit)
     - my-aimt.html              (Readiness Preview's "Email My Profile
                                   Again" action — hidden while unset)

   Until READINESS_DELIVERY_ENDPOINT is set, delivery is skipped
   everywhere that reads it. Nothing else breaks: the local browser
   profile still saves, the My AIMT Readiness Preview still opens, and
   no fake "sent" confirmation is ever shown in the meantime.

   To activate at launch: set READINESS_DELIVERY_ENDPOINT to the real
   endpoint URL. No scoring, storage, or preview-render code needs to
   change — both call sites already build the full normalized payload
   and only gate on this value.
   ═══════════════════════════════════════════════════════════════ */
window.AIMT_READINESS_CONFIG = {
  READINESS_DELIVERY_ENDPOINT: null
};
