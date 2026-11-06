const encoder=new TextEncoder();
export async function maintenanceSignature(secret,timestamp,body){
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signed=new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(`founder-review-cleanup\n${timestamp}\n${body}`)));
 return Array.from(signed,b=>b.toString(16).padStart(2,'0')).join('');
}
export async function verifyMaintenance(secret,timestamp,body,signature){
 if(!secret||!/^\d{10}$/.test(timestamp||'')||Math.abs(Date.now()/1000-Number(timestamp))>300||! /^[a-f0-9]{64}$/.test(signature||''))return false;
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 const bytes=new Uint8Array(signature.match(/../g).map(b=>parseInt(b,16)));
 return crypto.subtle.verify('HMAC',key,bytes,encoder.encode(`founder-review-cleanup\n${timestamp}\n${body}`));
}
