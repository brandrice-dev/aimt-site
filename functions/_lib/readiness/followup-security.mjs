// Narrow HMAC authentication for AIMT Readiness follow-up cron and opt-out.
// Uses the Supabase service-role secret ALREADY held by both the GitHub Actions
// environment and the Cloudflare Pages Functions environment. This credential
// NEVER crosses the HTTP boundary: only a short-lived HMAC digest does.
// Separate signed-message domains prevent cross-protocol token reuse.
import { SITE_URL } from '../email/aimt-email-shell.mjs';

const te=new TextEncoder();
const RUN_DOMAIN='aimt-readiness-followups-run-v1';
const OPT_DOMAIN='aimt-readiness-marketing-optout-v1';

function secret(env) { return String(env?.SUPABASE_SERVICE_ROLE_KEY||''); }
async function importKey(secretText){
  if(!secretText || secretText.length<32) throw new Error('Server authentication unavailable.');
  return crypto.subtle.importKey('raw',te.encode(secretText),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
function toHex(bytes) { return Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join(''); }
function bytesFromHex(hex) {
  if(!/^[a-f0-9]{64}$/i.test(String(hex||'')))return null;
  return new Uint8Array((hex.match(/.{2}/g)||[]).map(x=>parseInt(x,16)));
}
async function sign(secretText,msg){
  const key=await importKey(secretText);
  return toHex(await crypto.subtle.sign('HMAC',key,te.encode(msg)));
}
async function verify(secretText,msg,mac){
  const bytes=bytesFromHex(mac);if(!bytes)return false;
  try {return await crypto.subtle.verify('HMAC',await importKey(secretText),bytes,te.encode(msg));}
  catch(_){return false;}
}
export function canonicalRunMessage(timestamp,runId,mode){
  return [RUN_DOMAIN,timestamp,runId,mode].join('\n');
}
export async function isValidCronRequest(env,request,mode,now=Date.now()){
  const when=request.headers.get('X-AIMT-Sent-At')||'';
  const runId=request.headers.get('X-AIMT-Run-Id')||'';
  const mac=request.headers.get('X-AIMT-Signature')||'';
  if(!/^[1-9]\d{8,11}$/.test(when)||!/^[1-9]\d{4,}-[1-9]\d{0,3}$/.test(runId))return false;
  if(!['send','dry'].includes(mode))return false;
  if(Math.abs(Math.floor(now/1000)-Number(when))>300)return false;
  return verify(secret(env),canonicalRunMessage(when,runId,mode),mac);
}
export async function makeUnsubscribeLink(env,lead){
  const email=String(lead?.email||'').trim().toLowerCase();
  const id=String(lead?.id||'');
  if(!/^[a-f0-9-]{36}$/i.test(id)||!email.includes('@'))throw new Error('Invalid lead');
  const mac=await sign(secret(env),[OPT_DOMAIN,id,email].join('\n'));
  return SITE_URL+'/api/readiness/unsubscribe?lead='+encodeURIComponent(id)+'&token='+mac;
}
export async function validateUnsubscribeToken(env,lead,id,token){
  if(!lead||String(lead.id)!==String(id))return false;
  return verify(secret(env),[OPT_DOMAIN,String(id),String(lead.email||'').toLowerCase()].join('\n'),token);
}
