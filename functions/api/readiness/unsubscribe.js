// Signed, no-login email unsubscribe endpoint.
// GET only displays confirmation (safe against automated link scanners).
// POST performs an idempotent unsubscribe; email providers may POST directly
// using List-Unsubscribe-Post: List-Unsubscribe=One-Click.
import { supabaseRest } from '../../_lib/certification/auth.mjs';
import { validateUnsubscribeToken } from '../../_lib/readiness/followup-security.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function page(title,content,status=200) {
  return new Response('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>'+title+' · AIMT</title><link rel="stylesheet" href="/assets/css/aimt-design-system.css"><style>body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:var(--aimt-color-bg-primary);color:#faf8f5;font-family:var(--aimt-font-sans),Arial,sans-serif}.card{max-width:510px;width:100%;border:1px solid rgba(255,255,255,.12);border-radius:var(--aimt-radius-card);padding:36px;background:rgba(255,255,255,.03)}h1{font-family:var(--aimt-font-mont);font-size:27px;line-height:1.25;margin:0 0 15px}p{color:rgba(255,255,255,.72);line-height:1.6}button{padding:14px 24px;border:0;border-radius:var(--aimt-btn-pill-radius);font:700 12px var(--aimt-font-mont);cursor:pointer;background:#faf8f5;color:#262626}a{color:#e0d6ce}</style></head><body><main class="card"><p style="font-size:12px;letter-spacing:.24em;color:var(--aimt-color-accent)">AIMT</p><h1>'+title+'</h1>'+content+'</main></body></html>',{
    status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}
  });
}
function key(request){
  const url=new URL(request.url);
  const id=url.searchParams.get('lead')||'';
  const token=url.searchParams.get('token')||'';
  return UUID.test(id)&&/^[a-f0-9]{64}$/i.test(token)?{id,token}:null;
}
export async function onRequestGet({request}) {
  const k=key(request);
  if(!k)return page('Unsubscribe link unavailable','<p>This unsubscribe link is invalid. Contact <a href="mailto:support@aimtrichology.com">support@aimtrichology.com</a> if you need help.</p>',400);
  // No account lookup and no state change on GET. Prevent crawlers from
  // accidentally unsubscribing users when inspecting links.
  const action='/api/readiness/unsubscribe?lead='+encodeURIComponent(k.id)+'&token='+encodeURIComponent(k.token);
  return page('Stop AIMT marketing emails','<p>Confirm that you no longer want practitioner education and certification updates from AIMT. Your requested course-access or receipt emails are unaffected.</p><form method="POST" action="'+action+'"><button type="submit">Unsubscribe</button></form>');
}
export async function onRequestPost({request,env}) {
  const k=key(request);
  if(!k)return page('Unsubscribe link unavailable','<p>This link is invalid. Please contact <a href="mailto:support@aimtrichology.com">support@aimtrichology.com</a>.</p>',400);
  if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)return page('Please try again','<p>We could not complete this request right now.</p>',503);
  try {
    const q=new URLSearchParams({select:'id,email,marketing_unsubscribed_at',id:'eq.'+k.id,limit:'1'});
    const lookup=await supabaseRest(env,'readiness_leads?'+q);
    if(!lookup.ok || !Array.isArray(lookup.body)||lookup.body.length===0)return page('Unsubscribe link unavailable','<p>This link is no longer valid. Contact AIMT support.</p>',400);
    const lead=lookup.body[0];
    if(!await validateUnsubscribeToken(env,lead,k.id,k.token))return page('Unsubscribe link unavailable','<p>This link is not valid. Contact AIMT support.</p>',400);
    if(!lead.marketing_unsubscribed_at) {
      const patch=await supabaseRest(env,'readiness_leads?id=eq.'+encodeURIComponent(k.id),{
        method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({
          marketing_consent:false,
          marketing_unsubscribed_at:new Date().toISOString()
        })
      });
      if(!patch.ok)return page('Please try again','<p>We could not complete this request right now.</p>',503);
    }
    return page('You are unsubscribed','<p>You will not receive further AIMT Readiness marketing follow-ups. You can still use your course access and contact support whenever needed.</p>');
  } catch(_){return page('Please try again','<p>We could not complete this request right now.</p>',503);}
}
