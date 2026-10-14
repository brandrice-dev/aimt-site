// Same trusted-source extraction used by Cadence regression and the existing
// generated assessment bank. This snapshot contains guides, never exam rubrics.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {loadModuleGuideSystems,loadSharedToneConstants,extractConstObject} from './cadence-model-regression/load-checkpoint-rubrics.mjs';
const html=readFileSync('headspa-mastery.html','utf8'),guides=loadModuleGuideSystems(),tone=loadSharedToneConstants();
const titles=extractConstObject(html,'MODULE_TITLES'),checkpoints=extractConstObject(html.slice(html.indexOf('const MODULE_CHECKPOINTS = {'),html.indexOf('window.MODULE_CHECKPOINTS')).replace(/\/\*[\s\S]*?\*\//g,''),'MODULE_CHECKPOINTS');
const passages=JSON.parse(execFileSync('python3',['scripts/_lib/cadence-course-excerpts.py'],{input:html,encoding:'utf8'}));
const modules=Object.fromEntries(Array.from({length:12},(_,id)=>[String(id),{title:titles[id],guide:guides[id]+'\n'+tone.CADENCE_RESPONSE_CONSISTENCY_ANCHOR+'\n'+tone.CADENCE_SELECTIVE_MEMORY_INSTRUCTION,checkpointIds:checkpoints[id],passages:passages[id]}]));
const output='// GENERATED from approved course guide constants; no checkpoint questions or rubrics.\n// Regenerate: node scripts/build-cadence-course-context.mjs\nexport const COURSE_CONTEXT = '+JSON.stringify(modules,null,2)+';\n';
const dest='functions/_lib/cadence/course-context.mjs';
if(process.argv.includes('--check')){if(readFileSync(dest,'utf8')!==output)throw Error('COURSE_CONTEXT_OUT_OF_SYNC');console.log('Approved Cadence course context: synchronized.');}else writeFileSync(dest,output);
