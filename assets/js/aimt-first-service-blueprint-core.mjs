// AIMT First-Service Blueprint v1: local export/import only.
// No network, no clinical/client data, no persistence or invented advice.
// Values are ordinary business-planning notes, not an AIMT certification record.
export const BLUEPRINT_VERSION=1;
export const BLUEPRINT_FIELDS=Object.freeze({
  practice:'Practice / service name',
  audience:'Who this service is for',
  value:'The client value you intend to provide',
  format:'Service format',
  consultation:'What your consultation should clarify',
  serviceTime:'Total appointment time including setup and reset',
  cost:'Your estimated cost (from your own numbers)',
  price:'Your proposed menu price',
  difference:'What will make this service distinct',
  equipment:'Equipment and product gaps to resolve',
  licensing:'License / scope rules to confirm and source/date',
  supplier:'Product/manufacturer requirements to confirm and source/date',
  operations:'Sanitation, booking, and room reset plan',
  rehearsal:'What you learned from a full service rehearsal',
  nextStep:'Your next action and its owner',
  reviewDate:'Your next review date',
});
const MAX_FIELD_LENGTH=260;
export function normalizeBlueprint(data){
  if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('The file is not a Blueprint.');
  if(data.version!==BLUEPRINT_VERSION||!data.fields||typeof data.fields!=='object'||Array.isArray(data.fields))throw new Error('Unsupported Blueprint file.');
  const clean={};
  for(const key of Object.keys(BLUEPRINT_FIELDS)){
    const value=data.fields[key];
    if(value===undefined||value===null){clean[key]='';continue;}
    if(typeof value!=='string'||value.length>MAX_FIELD_LENGTH)throw new Error('Invalid value in '+key+'.');
    // Only plain text, no control characters, URLs executed or markup interpreted.
    if(/[\u0000-\u0008\u000B-\u001F\u007F]/.test(value))throw new Error('Unsupported text characters.');
    clean[key]=value;
  }
  return {version:BLUEPRINT_VERSION,fields:clean};
}
export function blueprintPayload(values){
  const raw={};
  for(const key of Object.keys(BLUEPRINT_FIELDS))raw[key]=String(values[key]??'').slice(0,MAX_FIELD_LENGTH);
  return normalizeBlueprint({version:BLUEPRINT_VERSION,fields:raw});
}
