export async function loadFounderReviews({root,token}){
 const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 root.replaceChildren(el('p','Loading founder reviews…'));
 async function api(options={}){
  const response=await fetch('/api/admin/founder-reviews',{...options,headers:{Authorization:'Bearer '+await token(),'Content-Type':'application/json'}});
  const data=await response.json();if(!response.ok)throw Error(data.error||'Reviews unavailable.');return data;
 }
 try{
  const data=await api();root.replaceChildren(el('h2','Founder reviews'),el('p','Verify Google bookings against the purchaser email before confirming them. Only one review is included per reserved purchase.'));
  for(const review of data.reviews){
   const card=el('section');card.className='card';card.style.padding='1.5rem';card.style.marginBottom='1rem';
   card.append(el('h3',review.purchaser_email||'Purchaser account pending'),el('p','Status: '+review.status));
   if(review.appointment_at)card.append(el('p','Appointment: '+new Date(review.appointment_at).toLocaleString()));
   if(review.questions)card.append(el('p',review.questions));
   for(const material of review.materials){const link=el('a','Download '+material.slot+' PDF');link.className='btn';link.href=material.url;link.target='_blank';link.rel='noopener noreferrer';card.append(link);}
   const notice=el('p');notice.setAttribute('role','status');card.append(notice);
   async function update(body,button){
    button.disabled=true;try{await api({method:'POST',body:JSON.stringify({id:review.id,...body})});await loadFounderReviews({root,token});}catch(error){notice.textContent=error.message;button.disabled=false;}
   }
   if(review.status==='reserved'){
    const form=el('form'),timeLabel=el('label','Verified appointment — '+Intl.DateTimeFormat().resolvedOptions().timeZone),time=el('input');time.type='datetime-local';time.required=true;time.id='review-time-'+review.id;timeLabel.htmlFor=time.id;
    const refLabel=el('label','Google booking reference (event link or ID)'),ref=el('input');ref.type='text';ref.maxLength=512;ref.required=true;ref.id='review-ref-'+review.id;refLabel.htmlFor=ref.id;
    const submit=el('button','Confirm verified booking');submit.type='submit';submit.className='btn';
    form.append(timeLabel,time,refLabel,ref,submit);card.append(form);
    form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;update({action:'confirm',appointmentAt:new Date(time.value).toISOString(),googleEventId:ref.value},submit);});
   }
   if(review.status==='scheduled'){
    const done=el('button','Mark review complete');done.type='button';done.className='btn';card.append(done);
    done.addEventListener('click',()=>update({action:'complete'},done));
   }
   if(review.status==='completed'){
    if(review.materials_delete_after)card.append(el('p','Remove materials by '+new Date(review.materials_delete_after).toLocaleDateString()));
    const purge=el('button','Delete review materials');purge.type='button';purge.className='btn';card.append(purge);
    purge.addEventListener('click',()=>{if(confirm('Permanently delete this completed review’s uploaded PDFs and questions?'))update({action:'purge'},purge);});
   }
   root.append(card);
  }
  if(!data.reviews.length)root.append(el('p','No purchased founder reviews yet.'));
 }catch(error){root.replaceChildren(el('p',error.message));}
}
