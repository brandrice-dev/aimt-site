// Shared presentation for the real booking panel and its draft layout preview.
export function bookingLayoutMarkup(iframeSrc){
 const safeSrc=String(iframeSrc).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return `<div class="fr-booking"><div class="fr-layout">
  <section class="fr-copy" aria-labelledby="fr-booking-heading">
   <span class="fr-eyebrow">Your private founder session</span>
   <h2 id="fr-booking-heading">Your plan.<br> Your next steps.</h2>
   <p class="fr-intro">Work through your first head spa service with someone who has built and runs a head spa.</p>
   <p class="fr-description">Bring your service plan and questions to a private call with Brandon, AIMT’s founder. Get practical feedback on what to do next.</p>
   <ul class="fr-benefits">
    <li><span aria-hidden="true">01</span>Review your service plan.</li>
    <li><span aria-hidden="true">02</span>Work through your questions.</li>
    <li><span aria-hidden="true">03</span>Leave with clear next steps.</li>
   </ul>
   <div class="fr-details"><span>45 minutes</span><span>One-to-one</span><span>Google Meet</span></div>
  </section>
  <section class="fr-card" aria-labelledby="fr-card-heading">
   <div class="fr-card-header"><div><span class="fr-card-label">Make time for your next step</span><h3 id="fr-card-heading">Choose your time.</h3></div><span class="fr-duration">45 min</span></div>
   <iframe class="fr-calendar-frame" title="Choose a time for your founder review" src="${safeSrc}" sandbox="allow-scripts allow-same-origin allow-forms" referrerpolicy="strict-origin-when-cross-origin"></iframe>
   <p class="fr-card-note">Use your AIMT account email. Your meeting details will arrive by email after booking.</p>
  </section>
 </div></div>`;
}
