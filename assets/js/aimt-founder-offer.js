// Public offer presentation only. Availability and purchase eligibility are server-owned.
(function(){
 const root=document.getElementById('landingPage');if(!root)return;
 let section,note,summary;
 function hide(){if(section)section.remove();if(note)note.remove();if(summary)summary.remove();section=note=summary=null;}
 async function refresh(){
  try{
   const response=await fetch('/api/founder-review/offer',{cache:'no-store',signal:AbortSignal.timeout(10000)});
   const data=await response.json();if(!response.ok||data.active!==true||data.capacity!==5||!Number.isInteger(data.remaining)||data.remaining<0||data.remaining>5){hide();return;}
   if(!section){
    const style=document.createElement('link');style.rel='stylesheet';style.href='/assets/css/aimt-founder-offer.css';if(!document.querySelector('link[href="/assets/css/aimt-founder-offer.css"]'))document.head.append(style);
    section=document.createElement('section');section.className='fo-section';section.id='founderOffer';
    section.innerHTML=`<div class="lp-band-inner">
     <div class="fo-founder" aria-labelledby="fo-title">
      <div class="fo-intro"><span class="fo-label">Exclusive enrollment bonus</span>
       <h2 class="section-title" id="fo-title">Build your plan.<br>With AIMT’s founder.</h2>
       <p class="fo-lead">Your training is the foundation. <em>Let’s plan your first service.</em></p>
       <p class="fo-body">Work one-on-one with the founder of AIMT and co-owner of ATRIUM Head Spa &amp; Wellness. Bring your Blueprint and your questions. Get personal feedback and clear next steps for your business.</p>
       <div class="fo-authority"><span class="fo-label">The experience behind your training</span><p>Head spa practitioner. Business owner. AIMT founder.<br>Focused on your plan, for 45 minutes.</p></div>
      </div>
      <article class="fo-session" aria-labelledby="fo-session-title">
       <div class="fo-session-top"><span class="fo-label">Reserved for five enrollments</span><span class="fo-duration">45 MIN · 1:1</span></div>
       <h3 id="fo-session-title">Your private<br>service strategy session.</h3>
       <p class="fo-session-intro">One conversation. Your business. A clear next step.</p>
       <ul><li><strong>A review of your Blueprint</strong><span>See what’s ready and what needs work.</span></li><li><strong>Answers for your business</strong><span>Work through the questions holding you up.</span></li><li><strong>A plan for your first service</strong><span>Leave knowing what to do next.</span></li></ul>
       <div class="fo-allocation"><p class="fo-availability" role="status"></p><p>Included at no extra cost. Limited to five qualifying enrollments.</p></div>
       <a class="fo-cta" href="/enroll">Enroll with the bonus <span aria-hidden="true">→</span></a>
       <p class="fo-tuition">$597 tuition · One-time payment</p>
       <p class="fo-terms">Complete your certification and Blueprint, then book your session in My AIMT. Bonus availability is confirmed at checkout.</p>
      </article>
     </div>
     <article class="fo-timer"><img src="/assets/images/marketing/approved-service-timer-live.webp" width="1600" height="862" loading="lazy" alt="AIMT Service Timer with step timing and practitioner cues"><div><span class="fo-label">Also included with your course</span><h3>The AIMT Service Timer</h3><p>Your training, beside you in the treatment room. Follow the steps, timing, and client cues while you work.</p></div></article>
    </div>`;
    const pricing=root.querySelector('.lp-pricing-includes');
    const anchor=pricing?.closest('.lp-section-band')||root.querySelector('.lp-final-close');
    if(anchor)anchor.before(section);else root.append(section);
    note=document.createElement('p');note.className='fo-hero-note';
    root.querySelector('.lp-hero-cta-row')?.after(note);
    summary=document.createElement('p');summary.className='fo-price-note';pricing?.append(summary);
   }
   const available=data.remaining>0;
   section.querySelector('.fo-founder').hidden=!available;
   section.classList.toggle('fo-timer-only',!available);
   note.hidden=summary.hidden=!available;
   if(available){
    section.querySelector('.fo-availability').textContent=data.remaining+' '+(data.remaining===1?'place':'places')+' left';
    note.textContent='Enrollment bonus: a private 45-minute session with AIMT’s founder. '+data.remaining+' '+(data.remaining===1?'place':'places')+' left.';
    summary.textContent='Limited enrollment bonus: your private, 45-minute service strategy session with AIMT’s founder. Included when confirmed at checkout; book after certification.';
   }
  }catch{hide();}
 }
 refresh();
 setInterval(()=>{if(!document.hidden&&root.getClientRects().length)refresh();},60000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&root.getClientRects().length)refresh();});
})();
