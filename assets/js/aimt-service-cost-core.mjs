// Pure calculation for AIMT's public Head Spa Service Cost Worksheet.
// Business-planning illustration only. No guessed inputs, rates, prices,
// medical data or earnings promises. No network or persistence.
export const SERVICE_COST_FIELDS=Object.freeze({
  consultMinutes:{label:'Consultation minutes',max:1440,integer:true},
  serviceMinutes:{label:'Hands-on service minutes',max:1440,integer:true},
  prepMinutes:{label:'Preparation minutes',max:1440,integer:true},
  resetMinutes:{label:'Reset minutes',max:1440,integer:true},
  adminMinutes:{label:'Notes and checkout minutes',max:1440,integer:true},
  products:{label:'Product cost per service',max:100000},
  supplies:{label:'Other supplies per service',max:100000},
  overhead:{label:'Allocated overhead per service',max:100000},
  laborHourly:{label:'Hourly labor value',max:100000},
  menuPrice:{label:'Menu price',max:100000,optional:true},
});
export function readAmount(raw,field){
  if(raw===null||raw===undefined||String(raw).trim()==='')return {state:'missing'};
  const value=String(raw).trim();
  if(!/^(?:\d+)(?:\.\d{1,4})?$/.test(value))return {state:'invalid'};
  const n=Number(value),max=field.max;
  if(!Number.isFinite(n)||n<0||n>max||(field.integer&&!Number.isInteger(n)))return {state:'invalid'};
  return {state:'ok',value:n};
}
export function calculateServiceCost(input){
  if(!input||typeof input!=='object')return {ok:false,missing:Object.keys(SERVICE_COST_FIELDS),invalid:[]};
  const data={},missing=[],invalid=[];
  for(const [key,definition] of Object.entries(SERVICE_COST_FIELDS)){
    const parsed=readAmount(input[key],definition);
    if(parsed.state==='missing'&&!definition.optional)missing.push(key);
    if(parsed.state==='invalid')invalid.push(key);
    if(parsed.state==='ok')data[key]=parsed.value;
  }
  if(missing.length||invalid.length)return {ok:false,missing,invalid};
  if(data.serviceMinutes<=0)return {ok:false,missing:[],invalid:['serviceMinutes']};
  const minutes=data.consultMinutes+data.serviceMinutes+data.prepMinutes+data.resetMinutes+data.adminMinutes;
  const hours=minutes/60;
  const labor=hours*data.laborHourly;
  const direct=data.products+data.supplies;
  const total=direct+data.overhead+labor;
  // Money rounded once at the display boundary; underlying math uses
  // full precision so five-minute increments do not accumulate rounding.
  const cents=v=>Math.round((v+Number.EPSILON)*100)/100;
  return {
    ok:true,
    minutes,
    hours:Math.round(hours*100)/100,
    products:cents(data.products),
    supplies:cents(data.supplies),
    direct:cents(direct),
    overhead:cents(data.overhead),
    labor:cents(labor),
    modeledCost:cents(total),
    enteredPrice:data.menuPrice===undefined?null:cents(data.menuPrice),
    modeledDifference:data.menuPrice===undefined?null:cents(data.menuPrice-total),
    // Not a take-home-income, profit or market-demand prediction.
  };
}
