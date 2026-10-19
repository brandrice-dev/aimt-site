/*
 * Crash-safe, tamper-evident batch checkpoint in the SAME GitHub Actions
 * candidate archive that already preserves the publication attempt and
 * its cumulative $2 / six-request spending ledger.
 */
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync,mkdirSync,renameSync} from 'node:fs';
import path from 'node:path';
import {BATCH_SYNTHESIS_CONTRACT} from '../../functions/_lib/research/publication-synthesis-batches.mjs';

const sha = value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const slugOk = slug=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
function checkpointPath(root,slug) {
  if(!slugOk(slug))throw Error('INVALID_BATCH_TOPIC_SLUG');
  return path.join(root,slug,'synthesis-progress.json');
}
export function hasSynthesisProgress(root,slug) {
  return existsSync(checkpointPath(root,slug));
}
export function createSynthesisProgressIo(root) {
  return {
    fingerprint({topic_slug,v1Result,evidenceBundle,pageIntent}) {
      if(!slugOk(topic_slug))throw Error('INVALID_BATCH_TOPIC_SLUG');
      // Exactly the original complete evidence, topic intent, flags,
      // registered scientific rules, and protocol version bind the state.
      // Array ordering is normalized so harmless loader ordering changes
      // do not cause a fresh model request.
      return sha({
        version:BATCH_SYNTHESIS_CONTRACT,
        topic_slug,
        pageIntent,
        flags:v1Result.synthesis_packet?.synthesis_required_flags||[],
        risk_tier:v1Result.risk_tier,
        evidence:{
          claims:[...evidenceBundle.claims].sort((a,b)=>a.claim_id.localeCompare(b.claim_id)),
          sources:[...evidenceBundle.sources].sort((a,b)=>a.source_id.localeCompare(b.source_id)),
        },
        model:'claude-sonnet-5',
      });
    },
    async load({topic_slug,fingerprint}) {
      const file=checkpointPath(root,topic_slug);
      if(!existsSync(file))return null;
      let doc;
      try{doc=JSON.parse(readFileSync(file,'utf8'));}
      catch{throw Error('INVALID_BATCH_CHECKPOINT');}
      const {checksum,...state}=doc;
      if(!/^[a-f0-9]{64}$/.test(checksum||'')||sha(state)!==checksum)
        throw Error('INVALID_BATCH_CHECKPOINT');
      // New science or a changed intent must NEVER reuse stale decisions.
      // Preserve the old file until a deliberate re-evaluation, rather
      // than quietly throwing away paid verified work.
      if(state.fingerprint!==fingerprint)throw Error('STALE_BATCH_EVIDENCE_REQUIRES_REEVALUATION');
      return state;
    },
    async save({topic_slug,fingerprint,progress}) {
      if(progress.fingerprint!==fingerprint)throw Error('INVALID_BATCH_CHECKPOINT');
      const file=checkpointPath(root,topic_slug);
      mkdirSync(path.dirname(file),{recursive:true});
      const temp=file+'.tmp';
      writeFileSync(temp,JSON.stringify({...progress,checksum:sha(progress)},null,2));
      renameSync(temp,file);
    },
  };
}
