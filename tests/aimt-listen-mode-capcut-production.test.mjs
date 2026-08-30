// Module 1 Listen Mode — CapCut finishing workflow deterministic suite.
//
// Covers the "Lock CapCut preset + build full Module 1 master" task: the
// locked CADENCE_CAPCUT_FINISH_PRESET_V1 preset is documented exactly as
// owner-approved, the Auphonic path is marked historical (not deleted), the
// full-module boundary manifest is internally consistent, and the
// position-anchored matching logic in scripts/cadence-capcut-resplit.mjs
// correctly accepts real markers and rejects natural-pause decoys. No
// ElevenLabs/Anthropic/Auphonic calls are made anywhere in this suite --
// audio-file checks read file headers directly (no ffmpeg dependency), and
// the matching-logic checks import the script's exported pure functions
// with synthetic data rather than re-running the real ~1000s audio pipeline.
//
// Run: node tests/aimt-listen-mode-capcut-production.test.mjs

import { readFileSync, existsSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const STANDARD_PATH = path.join(ROOT, 'docs/course-audit/listen-mode/module-01-production-standard-LOCKED.md');
const REPORT_PATH = path.join(ROOT, 'docs/course-audit/listen-mode/capcut-production/module-01/module-01-capcut-production-report.md');
const MANIFEST_PATH = path.join(ROOT, 'docs/course-audit/listen-mode/capcut-production/module-01/module-01-capcut-boundaries.json');
const MASTER_PATH = path.join(ROOT, 'docs/course-audit/listen-mode/capcut-production/module-01/module-01-capcut-master.wav');
const RESPLIT_SCRIPT_PATH = path.join(ROOT, 'scripts/cadence-capcut-resplit.mjs');
const DATA_JS_PATH = path.join(ROOT, 'assets/js/aimt-listen-mode-data.js');

// Minimal, dependency-free WAV header reader: enough to get channel count,
// sample rate, bit depth, and (from the data chunk size) an exact,
// sample-accurate duration -- without shelling out to ffmpeg.
function readWavHeader(filePath) {
  const fd = openSync(filePath, 'r');
  try {
    const buf = Buffer.alloc(256);
    readSync(fd, buf, 0, 256, 0);
    if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
      throw new Error('Not a RIFF/WAVE file: ' + filePath);
    }
    let offset = 12;
    let fmt = null;
    let dataSize = null;
    while (offset < buf.length - 8) {
      const chunkId = buf.toString('ascii', offset, offset + 4);
      const chunkSize = buf.readUInt32LE(offset + 4);
      if (chunkId === 'fmt ') {
        fmt = {
          channels: buf.readUInt16LE(offset + 10),
          sampleRate: buf.readUInt32LE(offset + 12),
          bitsPerSample: buf.readUInt16LE(offset + 22)
        };
      } else if (chunkId === 'data') {
        dataSize = chunkSize;
        break;
      }
      offset += 8 + chunkSize + (chunkSize % 2);
    }
    if (!fmt || dataSize === null) throw new Error('Could not find fmt/data chunks in ' + filePath);
    const bytesPerFrame = fmt.channels * (fmt.bitsPerSample / 8);
    const durationSec = dataSize / bytesPerFrame / fmt.sampleRate;
    return { ...fmt, dataSize, durationSec };
  } finally {
    closeSync(fd);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// A. CADENCE_CAPCUT_FINISH_PRESET_V1 documented exactly as owner-approved
// ─────────────────────────────────────────────────────────────────────────
(function presetDocumentation() {
  const standardExists = existsSync(STANDARD_PATH);
  check('A. PRESET DOC', 'production standard doc exists', standardExists);
  if (!standardExists) return;
  const src = readFileSync(STANDARD_PATH, 'utf8');

  check('A. PRESET DOC', 'names CADENCE_CAPCUT_FINISH_PRESET_V1 as the active preset', /CADENCE_CAPCUT_FINISH_PRESET_V1/.test(src));
  check('A. PRESET DOC', 'Volume: 0.0 dB', /Volume:\s*\*\*0\.0 dB\*\*/.test(src));
  check('A. PRESET DOC', 'Fade in: 0.0 seconds', /Fade in:\s*\*\*0\.0 seconds\*\*/.test(src));
  check('A. PRESET DOC', 'Fade out: 0.0 seconds', /Fade out:\s*\*\*0\.0 seconds\*\*/.test(src));
  check('A. PRESET DOC', 'Normalize loudness: ON', /Normalize loudness:\s*\*\*ON\*\*/.test(src));
  check('A. PRESET DOC', 'displayed normalization target: -23 LUFS', /[-−]23 LUFS/.test(src));
  check('A. PRESET DOC', 'Enhance voice: ON', /Enhance voice:\s*\*\*ON\*\*/.test(src));
  check('A. PRESET DOC', 'Enhance voice intensity: 75', /[Ii]ntensity\s*=\s*\*\*75\*\*|[Ii]ntensity:\s*\*\*75\*\*/.test(src));
  check('A. PRESET DOC', 'Reduce noise: ON', /Reduce noise:\s*\*\*ON\*\*/.test(src));
  check('A. PRESET DOC', 'Isolate voice: OFF', /Isolate voice:\s*\*\*OFF\*\*/.test(src));
  check('A. PRESET DOC', 'Audio translator: OFF', /Audio translator:\s*\*\*OFF\*\*/.test(src));
  check('A. PRESET DOC', 'Voice changer: OFF', /Voice changer:\s*\*\*OFF\*\*/.test(src));
  check('A. PRESET DOC', 'Speed unchanged / 1.0x', /unchanged \/ 1\.0x/.test(src));
  check('A. PRESET DOC', 'explicitly warns against chaining the old -18 LUFS Auphonic master after CapCut', /do not chain the old Auphonic master/i.test(src));

  check('A. PRESET DOC', 'marks CADENCE_AUDIO_MASTER_PRESET_V1 as HISTORICAL / SUPERSEDED, not deleted', /CADENCE_AUDIO_MASTER_PRESET_V1.{0,80}HISTORICAL QA \/ SUPERSEDED|HISTORICAL QA \/ SUPERSEDED.{0,80}CADENCE_AUDIO_MASTER_PRESET_V1|## 6\. `CADENCE_AUDIO_MASTER_PRESET_V1` — HISTORICAL QA \/ SUPERSEDED/.test(src));
  check('A. PRESET DOC', 'documents the active production flow (ElevenLabs -> raw -> module master -> one CapCut pass -> re-split -> canonical -> qaStatus)', /ONE CapCut pass on the whole module master/.test(src));
  check('A. PRESET DOC', 'documents the "one CapCut pass per module" workload goal', /approximately ONE CapCut processing\/export action\s*\n?\s*per module/.test(src));
  check('A. PRESET DOC', 'requires position-anchored (not global) boundary matching', /position-anchored/.test(src) && /manifest-predicted position/.test(src));
})();

// ─────────────────────────────────────────────────────────────────────────
// B. Historical evidence preserved, not deleted
// ─────────────────────────────────────────────────────────────────────────
(function historicalEvidencePreserved() {
  const historicalFiles = [
    'docs/course-audit/listen-mode/module-01-audio-finishing-review.md',
    'docs/course-audit/listen-mode/module-01-deess-calibration-review.md',
    'docs/course-audit/listen-mode/module-01-auphonic-comparison-review.md',
    'docs/course-audit/listen-mode/module-01-master-v2-review.md',
    'docs/course-audit/listen-mode/module-01-master-v3-review.md',
    'docs/course-audit/listen-mode/module-01-parallel-blend-review.md',
    'scripts/cadence-audio-finish.mjs',
    'scripts/cadence-audio-master-v2.mjs',
    'scripts/cadence-audio-master-v3.mjs',
    'scripts/cadence-audio-produce.mjs'
  ];
  for (const rel of historicalFiles) {
    check('B. HISTORICAL EVIDENCE', rel + ' still exists on disk (not deleted)', existsSync(path.join(ROOT, rel)));
  }
})();

// ─────────────────────────────────────────────────────────────────────────
// C. All 14 raw source chunks present and valid
// ─────────────────────────────────────────────────────────────────────────
(function rawSources() {
  for (let i = 1; i <= 14; i++) {
    const id = 'm1-' + String(i).padStart(2, '0');
    const p = path.join(ROOT, 'assets/audio/listen/headspa-mastery/module-01/raw/' + id + '.mp3');
    const exists = existsSync(p);
    check('C. RAW SOURCES', id + ' raw file exists', exists);
    if (exists) check('C. RAW SOURCES', id + ' raw file is non-empty', statSync(p).size > 0);
  }
})();

// ─────────────────────────────────────────────────────────────────────────
// D. Full-module master file: exists, valid WAV, correct format
// ─────────────────────────────────────────────────────────────────────────
let masterHeader = null;
(function masterFile() {
  const exists = existsSync(MASTER_PATH);
  check('D. MASTER FILE', 'module-01-capcut-master.wav exists', exists);
  if (!exists) return;
  masterHeader = readWavHeader(MASTER_PATH);
  check('D. MASTER FILE', 'sample rate is 44100 Hz', masterHeader.sampleRate === 44100);
  check('D. MASTER FILE', 'mono (1 channel)', masterHeader.channels === 1);
  check('D. MASTER FILE', '16-bit PCM (lossless)', masterHeader.bitsPerSample === 16);
  check('D. MASTER FILE', 'total duration is 992.48s (14 chunks + 13x2.0s separators)', Math.abs(masterHeader.durationSec - 992.48) < 0.001, String(masterHeader.durationSec));
})();

// ─────────────────────────────────────────────────────────────────────────
// E. Boundary manifest integrity
// ─────────────────────────────────────────────────────────────────────────
let manifest = null;
(function manifestIntegrity() {
  const exists = existsSync(MANIFEST_PATH);
  check('E. BOUNDARY MANIFEST', 'module-01-capcut-boundaries.json exists', exists);
  if (!exists) return;
  manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

  const chunkEntries = manifest.chunks.filter((c) => !c.separator);
  const separatorEntries = manifest.chunks.filter((c) => c.separator);

  check('E. BOUNDARY MANIFEST', 'declares sourceChunkCount = 14', manifest.sourceChunkCount === 14);
  check('E. BOUNDARY MANIFEST', 'exactly 14 chunk entries', chunkEntries.length === 14);
  check('E. BOUNDARY MANIFEST', 'exactly 13 separator entries', separatorEntries.length === 13);
  check('E. BOUNDARY MANIFEST', 'declares separator.count = 13', manifest.separator && manifest.separator.count === 13);

  const expectedOrder = Array.from({ length: 14 }, (_, i) => 'm1-' + String(i + 1).padStart(2, '0'));
  const actualOrder = chunkEntries.map((c) => c.chunkId);
  check('E. BOUNDARY MANIFEST', 'chunk order is exactly m1-01 through m1-14, in sequence', JSON.stringify(actualOrder) === JSON.stringify(expectedOrder), JSON.stringify(actualOrder));

  const firstEntry = manifest.chunks[0];
  const lastEntry = manifest.chunks[manifest.chunks.length - 1];
  check('E. BOUNDARY MANIFEST', 'no separator before the first chunk (first entry is m1-01 starting at 0.0)', !firstEntry.separator && firstEntry.chunkId === 'm1-01' && firstEntry.masterStartSec === 0);
  check('E. BOUNDARY MANIFEST', 'no separator after the last chunk (last entry is m1-14)', !lastEntry.separator && lastEntry.chunkId === 'm1-14');

  // Every separator must be exactly 2.0s and must connect its neighbors
  // with zero gap (previous chunk's masterEndSec === separator start,
  // separator end === next chunk's masterStartSec).
  let allSeparatorsExact = true;
  let allConnectionsGapless = true;
  for (let i = 0; i < manifest.chunks.length; i++) {
    const entry = manifest.chunks[i];
    if (!entry.separator) continue;
    if (Math.abs(entry.durationSec - 2.0) > 1e-9 || Math.abs((entry.endSec - entry.startSec) - 2.0) > 1e-9) {
      allSeparatorsExact = false;
    }
    const prev = manifest.chunks[i - 1];
    const next = manifest.chunks[i + 1];
    if (!prev || !next || Math.abs(prev.masterEndSec - entry.startSec) > 1e-9 || Math.abs(entry.endSec - next.masterStartSec) > 1e-9) {
      allConnectionsGapless = false;
    }
  }
  check('E. BOUNDARY MANIFEST', 'every separator is exactly 2.0s', allSeparatorsExact);
  check('E. BOUNDARY MANIFEST', 'every separator connects its neighboring chunks with zero gap', allConnectionsGapless);

  const computedTotal = chunkEntries.reduce((sum, c) => sum + c.originalDurationSec, 0) + separatorEntries.length * 2.0;
  check('E. BOUNDARY MANIFEST', 'masterTotalDurationSec matches the sum of chunk durations + separators', Math.abs(manifest.masterTotalDurationSec - computedTotal) < 1e-6, `${manifest.masterTotalDurationSec} vs computed ${computedTotal}`);
  if (masterHeader) {
    check('E. BOUNDARY MANIFEST', 'masterTotalDurationSec matches the actual built master file duration', Math.abs(manifest.masterTotalDurationSec - masterHeader.durationSec) < 0.001);
  }

  check('E. BOUNDARY MANIFEST', 'records the active preset name', manifest.preset === 'CADENCE_CAPCUT_FINISH_PRESET_V1');
  check('E. BOUNDARY MANIFEST', 'records a creation timestamp', typeof manifest.createdAtUtc === 'string' && manifest.createdAtUtc.length > 0);
  check('E. BOUNDARY MANIFEST', 'records sample rate 44100 and channel count 1', manifest.sourceFormat && manifest.sourceFormat.sampleRateHz === 44100 && manifest.sourceFormat.channels === 1);
})();

// ─────────────────────────────────────────────────────────────────────────
// F. Position-anchored matching: accepts real markers, rejects natural
//    pauses and unrelated silences elsewhere in the file.
// ─────────────────────────────────────────────────────────────────────────
await (async function positionAnchoredMatching() {
  const exists = existsSync(RESPLIT_SCRIPT_PATH);
  check('F. POSITION-ANCHORED MATCHING', 'scripts/cadence-capcut-resplit.mjs exists', exists);
  if (!exists || !manifest) return;

  const mod = await import(RESPLIT_SCRIPT_PATH);
  check('F. POSITION-ANCHORED MATCHING', 'exports classifyBoundaries, detectSilences, extractSegment, getDuration, resolveFfmpeg', typeof mod.classifyBoundaries === 'function' && typeof mod.detectSilences === 'function' && typeof mod.extractSegment === 'function' && typeof mod.getDuration === 'function' && typeof mod.resolveFfmpeg === 'function');

  const separatorEntries = manifest.chunks.filter((c) => c.separator);

  // Case 1: perfect input (silences exactly at expected positions) -- every
  // separator must match, nothing left unmatched.
  const perfectSilences = separatorEntries.map((s) => ({ start: s.startSec, end: s.endSec, duration: s.durationSec }));
  const perfectResult = mod.classifyBoundaries(perfectSilences, separatorEntries);
  check('F. POSITION-ANCHORED MATCHING', 'perfect input: all 13 separators matched, none unmatched', perfectResult.matched.length === 13 && perfectResult.unmatched.length === 0);

  // Case 2: realistic small drift (as observed on real CapCut exports, a
  // few hundredths of a second) -- must still match.
  const driftedSilences = separatorEntries.map((s) => ({ start: s.startSec + 0.04, end: s.endSec + 0.06, duration: 2.02 }));
  const driftedResult = mod.classifyBoundaries(driftedSilences, separatorEntries);
  check('F. POSITION-ANCHORED MATCHING', 'small realistic drift (~0.05s): all 13 separators still matched', driftedResult.matched.length === 13 && driftedResult.unmatched.length === 0);

  // Case 3: natural-pause decoys -- duration-plausible (1.0-1.3s) silences
  // positioned in the MIDDLE of chunks, far from any real separator. None
  // should be matched, and all 13 real markers must still be found even
  // though the decoys are also present in the same detection pass.
  const chunkEntries = manifest.chunks.filter((c) => !c.separator);
  const decoys = chunkEntries.slice(0, 5).map((c) => {
    const mid = (c.masterStartSec + c.masterEndSec) / 2;
    return { start: mid, end: mid + 1.1, duration: 1.1 };
  });
  const withDecoysResult = mod.classifyBoundaries([...perfectSilences, ...decoys], separatorEntries);
  check('F. POSITION-ANCHORED MATCHING', 'natural-pause decoys present: all 13 real separators still matched', withDecoysResult.matched.length === 13 && withDecoysResult.unmatched.length === 0);
  const anyDecoyMatched = withDecoysResult.matched.some((m) => decoys.includes(m.found));
  check('F. POSITION-ANCHORED MATCHING', 'natural-pause decoys present: none of the decoys was matched as a separator', !anyDecoyMatched);

  // Case 4: a decoy sitting just OUTSIDE the search window of its nearest
  // real separator (duration-plausible, but positioned too far away) must
  // be rejected even when it is the only duration-plausible candidate near
  // that separator's neighborhood.
  const targetSep = separatorEntries[0];
  const farDecoyOnly = [{ start: targetSep.startSec + 15, end: targetSep.startSec + 16.1, duration: 1.1 }];
  const otherReal = perfectSilences.slice(1); // every other real marker still present
  const farDecoyResult = mod.classifyBoundaries([...otherReal, ...farDecoyOnly], separatorEntries);
  const targetUnmatched = farDecoyResult.unmatched.some((u) => u.startSec === targetSep.startSec);
  check('F. POSITION-ANCHORED MATCHING', 'a duration-plausible decoy 15s away from the real marker is rejected (hard-stop unmatched, not guessed)', targetUnmatched);

  // Case 5: missing marker (CapCut removed/merged it) -- must report
  // exactly that one separator unmatched, not silently skip or guess.
  const missingOneResult = mod.classifyBoundaries(perfectSilences.slice(1), separatorEntries);
  check('F. POSITION-ANCHORED MATCHING', 'a genuinely missing separator is reported unmatched (exactly 1), matched count is 12', missingOneResult.unmatched.length === 1 && missingOneResult.matched.length === 12);
})();

// ─────────────────────────────────────────────────────────────────────────
// G. Dry-run evidence documented (the real ~1000s ffmpeg pipeline is not
//    re-run in this fast deterministic suite -- it was run manually and
//    independently verified bit-exact/RMS-checked; this confirms the
//    result is recorded, not silently asserted).
// ─────────────────────────────────────────────────────────────────────────
(function dryRunEvidence() {
  const exists = existsSync(REPORT_PATH);
  check('G. DRY-RUN EVIDENCE', 'module-01-capcut-production-report.md exists', exists);
  if (!exists) return;
  const src = readFileSync(REPORT_PATH, 'utf8');
  check('G. DRY-RUN EVIDENCE', 'records a PASS result for the unprocessed-master dry-run', /\*\*Result:\s+PASS\.\*\*/.test(src));
  check('G. DRY-RUN EVIDENCE', 'records all 14 chunks and 13 separators verified bit-exact', /All 27 comparisons passed/.test(src));
  check('G. DRY-RUN EVIDENCE', 'records the natural-pause rejection finding at full-module scale', /Position-anchored matching correctly rejected all of them/.test(src));
  check('G. DRY-RUN EVIDENCE', 'records that no spoken content was lost in any chunk', /No\s+spoken content was lost in any of the 14 chunks/.test(src));
})();

// ─────────────────────────────────────────────────────────────────────────
// H. Raw and canonical audio untouched by this preparation task
// ─────────────────────────────────────────────────────────────────────────
(function preservationUntouched() {
  let rawDiff = null;
  let canonicalDiff = null;
  try {
    rawDiff = execSync('git diff --stat HEAD -- assets/audio/listen/headspa-mastery/module-01/raw/', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch (e) {
    rawDiff = 'ERROR: ' + e.message;
  }
  try {
    canonicalDiff = execSync('git diff --stat HEAD -- assets/audio/listen/headspa-mastery/module-01/m1-01.mp3 assets/audio/listen/headspa-mastery/module-01/m1-02.mp3 assets/audio/listen/headspa-mastery/module-01/m1-03.mp3 assets/audio/listen/headspa-mastery/module-01/m1-04.mp3 assets/audio/listen/headspa-mastery/module-01/m1-07.mp3', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch (e) {
    canonicalDiff = 'ERROR: ' + e.message;
  }
  check('H. PRESERVATION', 'raw/ directory has no diff vs HEAD (untouched by this task)', rawDiff === '', rawDiff);
  check('H. PRESERVATION', 'canonical production mp3s have no diff vs HEAD (untouched by this task)', canonicalDiff === '', canonicalDiff);
})();

// ─────────────────────────────────────────────────────────────────────────
// I. qaStatus not mutated during preparation
// ─────────────────────────────────────────────────────────────────────────
(function qaStatusUnchanged() {
  const AIMTListenModeData = require('../assets/js/aimt-listen-mode-data.js');
  const chunks = AIMTListenModeData.getManifest('headspa-mastery', 1);
  const generatedIds = chunks.filter((c) => c.qaStatus === 'GENERATED').map((c) => c.chunkId).sort();
  const expectedGeneratedIds = ['m1-01', 'm1-02', 'm1-03', 'm1-04', 'm1-07'];
  check('I. QASTATUS UNCHANGED', 'still exactly the same 5 chunks GENERATED, no new status set during preparation', JSON.stringify(generatedIds) === JSON.stringify(expectedGeneratedIds), JSON.stringify(generatedIds));
  check('I. QASTATUS UNCHANGED', 'no chunk is APPROVED (preparation never sets this)', chunks.every((c) => c.qaStatus !== 'APPROVED'));
  let dataJsDiff = null;
  try {
    dataJsDiff = execSync('git diff --stat HEAD -- assets/js/aimt-listen-mode-data.js', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch (e) {
    dataJsDiff = 'ERROR: ' + e.message;
  }
  check('I. QASTATUS UNCHANGED', 'assets/js/aimt-listen-mode-data.js has no diff vs HEAD', dataJsDiff === '', dataJsDiff);
})();

// ─────────────────────────────────────────────────────────────────────────
// J. No provider calls anywhere in the new script
// ─────────────────────────────────────────────────────────────────────────
(function noProviderCalls() {
  const exists = existsSync(RESPLIT_SCRIPT_PATH);
  check('J. NO PROVIDER CALLS', 'cadence-capcut-resplit.mjs exists to check', exists);
  if (!exists) return;
  const src = readFileSync(RESPLIT_SCRIPT_PATH, 'utf8');
  const forbidden = ['elevenlabs', 'anthropic.com', 'api.openai', 'auphonic.com'];
  const found = forbidden.filter((token) => src.toLowerCase().includes(token));
  check('J. NO PROVIDER CALLS', 'no ElevenLabs/Anthropic/OpenAI/Auphonic references in the re-split script (pure local ffmpeg tool)', found.length === 0, found.join(', '));
})();

// ---- Report ----
const byFixture = new Map();
for (const r of results) {
  if (!byFixture.has(r.fixtureName)) byFixture.set(r.fixtureName, []);
  byFixture.get(r.fixtureName).push(r);
}
let anyFail = false;
for (const [fixtureName, checks] of byFixture) {
  const failed = checks.filter((c) => !c.pass);
  if (failed.length > 0) anyFail = true;
  console.log(`[${failed.length === 0 ? 'PASS' : 'FAIL'}] ${fixtureName} (${checks.length - failed.length}/${checks.length})`);
  for (const f of failed) console.log(`    FAILED: ${f.label}${f.detail ? ' — ' + f.detail : ''}`);
}
console.log(`\nTotal: ${results.length}, Passed: ${results.filter((r) => r.pass).length}, Failed: ${results.filter((r) => !r.pass).length}`);
if (anyFail) process.exitCode = 1;
