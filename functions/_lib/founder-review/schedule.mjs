export function validReviewTime(value){
 const date=new Date(value);if(!Number.isFinite(date.getTime()))return false;
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).map(p=>[p.type,p.value]));
 const minute=Number(parts.hour)*60+Number(parts.minute);
 return ['Mon','Tue'].includes(parts.weekday)&&minute>=540&&minute+45<=840&&date.getUTCSeconds()===0;
}
