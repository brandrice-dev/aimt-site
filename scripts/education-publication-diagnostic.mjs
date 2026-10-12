// Explicitly approved diagnostic of the EXISTING decision pipeline. No issue
// surfacing, production publication lane, PR generation, or database writes.
import { pathToFileURL } from 'node:url';
import { runDecisionPipeline, persistRunReport } from './education-operations-cycle.mjs';
import { runExitCode } from '../functions/_lib/education-ops/education-run-ledger.mjs';

export function runDiagnosticCycle(env, options = {}) {
  return runDecisionPipeline({ ...env,
    AIMT_EDUCATION_AUTOPUBLISH_ENABLED: 'false',
    AIMT_RESEARCH_GAP_LOOP_ENABLED: 'false',
  }, { ...options, mode: 'shadow' });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argv = process.argv.slice(2);
  const topic = argv.find((a) => a.startsWith('--topic='))?.slice(8) || 'scalp-microbiome';
  if (!argv.includes('--allow-model-calls') || argv.some((a) => a !== '--allow-model-calls' && !a.startsWith('--topic='))) {
    console.error('Requires explicit --allow-model-calls approval. Up to 6 HTTP requests, $2 estimated spend reservation, existing token ceilings, 8-minute Publication Editor request deadline; run in the 30-minute workflow.');
    process.exitCode = 1;
  } else {
    const report = await runDiagnosticCycle(process.env, { topicSlug: topic });
    persistRunReport(report);
    console.log(JSON.stringify({ ...report, __internal: undefined }, null, 2));
    process.exitCode = runExitCode(report);
  }
}
