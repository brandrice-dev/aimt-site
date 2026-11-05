// Shared presentation for the real booking panel and its draft layout preview.
export function bookingLayoutMarkup(iframeSrc){
 const url=new URL(iframeSrc);
 if(url.origin!=='https://calendar.google.com'||!/^\/calendar\/appointments\/schedules\/[A-Za-z0-9_-]+$/.test(url.pathname)||url.search!=='?gv=true')throw Error('Invalid booking calendar');
 const safeSrc=String(iframeSrc).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return `<div class="fr-booking"><div class="fr-layout">
  <section class="fr-copy" aria-labelledby="fr-booking-heading">
   <span class="fr-eyebrow">Exclusive 1-on-1 with AIMT’s founder</span>
   <h2 id="fr-booking-heading">Your plan.<br> Your next steps.</h2>
   <p class="fr-intro">A private, one-on-one session with Brandon, focused entirely on your service plan.</p>
   <p class="fr-description">Get direct feedback from someone who has built and runs a head spa. Bring your questions, work through the decisions ahead, and leave with clear next steps.</p>
   <ul class="fr-benefits">
    <li><span aria-hidden="true">01</span>Personal feedback on your plan.</li>
    <li><span aria-hidden="true">02</span>Answers to your specific questions.</li>
    <li><span aria-hidden="true">03</span>Next steps for your first service.</li>
   </ul>
   <div class="fr-details"><span>45 minutes</span><span>Just you + Brandon</span><span>Google Meet</span></div>
  </section>
  <section class="fr-card" aria-labelledby="fr-card-heading">
   <div class="fr-card-header"><div><span class="fr-card-label">Your time with the founder</span><h3 id="fr-card-heading">Choose your time.</h3></div><span class="fr-duration">45 min</span></div>
   <iframe class="fr-calendar-frame" title="Choose a time for your founder review" src="${safeSrc}" sandbox="allow-scripts allow-same-origin allow-forms" referrerpolicy="strict-origin-when-cross-origin"></iframe>
   <p class="fr-card-note">Use your AIMT account email. Your meeting details will arrive by email after booking.</p>
  </section>
 </div></div>`;
}
