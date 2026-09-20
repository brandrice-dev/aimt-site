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
  check('A. PRESET DOC', 'documents the active production flow (ElevenLabs -> raw -> module master(s) -> CapCut pass(es) -> re-split -> canonical -> qaStatus)', /ONE CapCut pass per part/.test(src));
  check('A. PRESET DOC', 'documents the "one CapCut pass per part" workload goal (updated for the 15:00 limit -- most modules are still one part)', /approximately ONE CapCut processing\/export action\s*\n?\s*per part/.test(src));
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
// H. Raw preserved forever; canonical audio reflects the real, verified
// CapCut install once it actually happened (this suite predates that —
// see K/L/M/N/O above and the finish-module-1 report for the real
// validation evidence this install is based on).
// ─────────────────────────────────────────────────────────────────────────
(function preservationUntouched() {
  let rawDiff = null;
  try {
    rawDiff = execSync('git diff --stat HEAD -- assets/audio/listen/headspa-mastery/module-01/raw/', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch (e) {
    rawDiff = 'ERROR: ' + e.message;
  }
  check('H. PRESERVATION', 'raw/ directory has no diff vs HEAD (raw is preserved forever, remastering never touches it)', rawDiff === '', rawDiff);

  const canonicalDir = path.join(ROOT, 'assets/audio/listen/headspa-mastery/module-01');
  for (let i = 1; i <= 14; i++) {
    const id = 'm1-' + String(i).padStart(2, '0');
    const p = path.join(canonicalDir, id + '.mp3');
    check('H. PRESERVATION', id + '.mp3 canonical file exists (installed from the real, verified CapCut round-trip)', existsSync(p));
    if (existsSync(p)) check('H. PRESERVATION', id + '.mp3 is non-empty', statSync(p).size > 0);
  }
})();

// ─────────────────────────────────────────────────────────────────────────
// I. qaStatus honestly reflects the real install. Originally all 14
// GENERATED/none APPROVED; the owner has since completed a real
// listen-through and explicitly authorized freezing Module 1 as the AIMT
// Listen Mode reference implementation, upgrading every chunk to APPROVED
// (see docs/course-audit/listen-mode/module-01-reference-implementation-FROZEN.md).
// See aimt-listen-mode-module1-pilot.test.mjs's QA STATUS HONESTY section
// for the fuller version of this check; kept here too since this suite
// specifically covers the CapCut pipeline that earned it.
// ─────────────────────────────────────────────────────────────────────────
(function qaStatusUnchanged() {
  const AIMTListenModeData = require('../assets/js/aimt-listen-mode-data.js');
  const chunks = AIMTListenModeData.getManifest('headspa-mastery', 1);
  const approvedIds = chunks.filter((c) => c.qaStatus === 'APPROVED').map((c) => c.chunkId).sort();
  const expectedApprovedIds = Array.from({ length: 14 }, (_, i) => 'm1-' + String(i + 1).padStart(2, '0'));
  check('I. QASTATUS UNCHANGED', 'all 14 chunks are APPROVED, matching the owner\'s explicit Module 1 freeze authorization', JSON.stringify(approvedIds) === JSON.stringify(expectedApprovedIds), JSON.stringify(approvedIds));
  check('I. QASTATUS UNCHANGED', 'no chunk is left at GENERATED', chunks.every((c) => c.qaStatus !== 'GENERATED'));
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

// ─────────────────────────────────────────────────────────────────────────
// K. Two-part CapCut split (CapCut's 15:00 Enhance Voice limit): both
//    masters exist, are valid WAV, and stay safely under the hard limit.
// ─────────────────────────────────────────────────────────────────────────
const PART_A_PATH = path.join(ROOT, 'docs/course-audit/listen-mode/capcut-production/module-01/module-01-capcut-master-part-a.wav');
const PART_B_PATH = path.join(ROOT, 'docs/course-audit/listen-mode/capcut-production/module-01/module-01-capcut-master-part-b.wav');
const PART_A_MANIFEST_PATH = path.join(ROOT, 'docs/course-audit/listen-mode/capcut-production/module-01/module-01-capcut-boundaries-part-a.json');
const PART_B_MANIFEST_PATH = path.join(ROOT, 'docs/course-audit/listen-mode/capcut-production/module-01/module-01-capcut-boundaries-part-b.json');
const CAPCUT_HARD_LIMIT_SEC = 15 * 60;
const CAPCUT_SAFETY_TARGET_SEC = 14 * 60;

(function twoPartMasters() {
  const aExists = existsSync(PART_A_PATH);
  const bExists = existsSync(PART_B_PATH);
  check('K. TWO-PART MASTERS', 'Part A master exists', aExists);
  check('K. TWO-PART MASTERS', 'Part B master exists', bExists);
  if (!aExists || !bExists) return;

  const aHeader = readWavHeader(PART_A_PATH);
  const bHeader = readWavHeader(PART_B_PATH);
  check('K. TWO-PART MASTERS', 'Part A is 44.1kHz mono 16-bit PCM', aHeader.sampleRate === 44100 && aHeader.channels === 1 && aHeader.bitsPerSample === 16);
  check('K. TWO-PART MASTERS', 'Part B is 44.1kHz mono 16-bit PCM', bHeader.sampleRate === 44100 && bHeader.channels === 1 && bHeader.bitsPerSample === 16);
  check('K. TWO-PART MASTERS', 'Part A duration is exactly 628.8s (7 chunks + 6 separators)', Math.abs(aHeader.durationSec - 628.8) < 0.001, String(aHeader.durationSec));
  check('K. TWO-PART MASTERS', 'Part B duration is exactly 361.68s (7 chunks + 6 separators)', Math.abs(bHeader.durationSec - 361.68) < 0.001, String(bHeader.durationSec));
  check('K. TWO-PART MASTERS', 'Part A is under the CapCut 15:00 hard limit', aHeader.durationSec < CAPCUT_HARD_LIMIT_SEC);
  check('K. TWO-PART MASTERS', 'Part B is under the CapCut 15:00 hard limit', bHeader.durationSec < CAPCUT_HARD_LIMIT_SEC);
  check('K. TWO-PART MASTERS', 'Part A is under the ~14 minute preferred safety target', aHeader.durationSec < CAPCUT_SAFETY_TARGET_SEC);
  check('K. TWO-PART MASTERS', 'Part B is under the ~14 minute preferred safety target', bHeader.durationSec < CAPCUT_SAFETY_TARGET_SEC);

  const fullMasterExists = existsSync(MASTER_PATH);
  check('K. TWO-PART MASTERS', 'the original full-module master still exists on disk (historical evidence, not deleted)', fullMasterExists);
})();

// ─────────────────────────────────────────────────────────────────────────
// L. Two-part boundary manifests: correct chunk sets, no leading/trailing
//    separator, split exactly at the M1-07/M1-08 checkpoint with no
//    separator connecting the two parts.
// ─────────────────────────────────────────────────────────────────────────
(function twoPartManifests() {
  const aExists = existsSync(PART_A_MANIFEST_PATH);
  const bExists = existsSync(PART_B_MANIFEST_PATH);
  check('L. TWO-PART MANIFESTS', 'Part A boundary manifest exists', aExists);
  check('L. TWO-PART MANIFESTS', 'Part B boundary manifest exists', bExists);
  if (!aExists || !bExists) return;

  const mA = JSON.parse(readFileSync(PART_A_MANIFEST_PATH, 'utf8'));
  const mB = JSON.parse(readFileSync(PART_B_MANIFEST_PATH, 'utf8'));

  const chunksA = mA.chunks.filter((c) => !c.separator).map((c) => c.chunkId);
  const chunksB = mB.chunks.filter((c) => !c.separator).map((c) => c.chunkId);
  const expectedA = ['m1-01', 'm1-02', 'm1-03', 'm1-04', 'm1-05', 'm1-06', 'm1-07'];
  const expectedB = ['m1-08', 'm1-09', 'm1-10', 'm1-11', 'm1-12', 'm1-13', 'm1-14'];
  check('L. TWO-PART MANIFESTS', 'Part A contains exactly M1-01 through M1-07, in order', JSON.stringify(chunksA) === JSON.stringify(expectedA), JSON.stringify(chunksA));
  check('L. TWO-PART MANIFESTS', 'Part B contains exactly M1-08 through M1-14, in order', JSON.stringify(chunksB) === JSON.stringify(expectedB), JSON.stringify(chunksB));

  const sepsA = mA.chunks.filter((c) => c.separator);
  const sepsB = mB.chunks.filter((c) => c.separator);
  check('L. TWO-PART MANIFESTS', 'Part A has exactly 6 separators (7 chunks)', sepsA.length === 6);
  check('L. TWO-PART MANIFESTS', 'Part B has exactly 6 separators (7 chunks)', sepsB.length === 6);

  check('L. TWO-PART MANIFESTS', 'Part A: no separator before the first chunk or after the last', !mA.chunks[0].separator && mA.chunks[0].chunkId === 'm1-01' && mA.chunks[0].masterStartSec === 0 && !mA.chunks[mA.chunks.length - 1].separator && mA.chunks[mA.chunks.length - 1].chunkId === 'm1-07');
  check('L. TWO-PART MANIFESTS', 'Part B: no separator before the first chunk or after the last', !mB.chunks[0].separator && mB.chunks[0].chunkId === 'm1-08' && mB.chunks[0].masterStartSec === 0 && !mB.chunks[mB.chunks.length - 1].separator && mB.chunks[mB.chunks.length - 1].chunkId === 'm1-14');

  // The most important invariant: M1-07 and M1-08 belong to different
  // parts, so no manifest may declare a separator connecting them --
  // the checkpoint stop itself is the seam, not a synthetic marker.
  const anySepConnectsAcrossParts =
    sepsA.some((s) => s.beforeChunk === 'm1-07' && s.afterChunk === 'm1-08') ||
    sepsB.some((s) => s.beforeChunk === 'm1-07' && s.afterChunk === 'm1-08');
  check('L. TWO-PART MANIFESTS', 'no separator connects M1-07 to M1-08 across the two parts (the checkpoint stop is the seam)', !anySepConnectsAcrossParts);

  check('L. TWO-PART MANIFESTS', 'Part A totalDuration matches its master (628.8s)', Math.abs(mA.masterTotalDurationSec - 628.8) < 1e-6);
  check('L. TWO-PART MANIFESTS', 'Part B totalDuration matches its master (361.68s)', Math.abs(mB.masterTotalDurationSec - 361.68) < 1e-6);
  check('L. TWO-PART MANIFESTS', 'both manifests record the active preset name', mA.preset === 'CADENCE_CAPCUT_FINISH_PRESET_V1' && mB.preset === 'CADENCE_CAPCUT_FINISH_PRESET_V1');
})();

// ─────────────────────────────────────────────────────────────────────────
// M. Locked duration-limit rule documented in the production standard
// ─────────────────────────────────────────────────────────────────────────
(function durationLimitDocumented() {
  const exists = existsSync(STANDARD_PATH);
  check('M. DURATION LIMIT RULE', 'production standard doc exists', exists);
  if (!exists) return;
  const src = readFileSync(STANDARD_PATH, 'utf8');
  check('M. DURATION LIMIT RULE', 'documents the CapCut 15:00 hard limit', /under\s+\*\*15:00\*\*/.test(src) || /15:00/.test(src));
  check('M. DURATION LIMIT RULE', 'documents the ~13-14 minute preferred safety target', /13.{0,4}14 minutes/.test(src));
  check('M. DURATION LIMIT RULE', 'documents split priority: checkpoint boundary first', /checkpoint boundary/i.test(src));
  check('M. DURATION LIMIT RULE', 'documents never splitting mid-sentence or for equal halves', /mid-sentence/.test(src) && /equal-duration halves/.test(src));
  check('M. DURATION LIMIT RULE', 'documents the applied Module 1 split at M1-07/M1-08', /M1-07\/M1-08 checkpoint/.test(src));
  check('M. DURATION LIMIT RULE', 'documents that the semantic chunk set never changes because of this partition', /semantic Listen Mode chunk set/.test(src) && /never changes/.test(src));
})();

// ─────────────────────────────────────────────────────────────────────────
// N/O. Historical marking + dry-run evidence for the two-part reports
// ─────────────────────────────────────────────────────────────────────────
(function twoPartReports() {
  const oldReportExists = existsSync(REPORT_PATH);
  check('N. HISTORICAL MARKING', 'the original full-master report still exists (not deleted)', oldReportExists);
  if (oldReportExists) {
    const src = readFileSync(REPORT_PATH, 'utf8');
    check('N. HISTORICAL MARKING', 'the original full-master report is explicitly marked historical/pre-limit evidence', /HISTORICAL \/ PRE-LIMIT EVIDENCE/.test(src));
  }

  const partsReportPath = path.join(ROOT, 'docs/course-audit/listen-mode/capcut-production/module-01/module-01-capcut-production-report-parts.md');
  const partsExists = existsSync(partsReportPath);
  check('O. PARTS DRY-RUN EVIDENCE', 'the two-part production report exists', partsExists);
  if (!partsExists) return;
  const src = readFileSync(partsReportPath, 'utf8');
  check('O. PARTS DRY-RUN EVIDENCE', 'records PASS for Part A', /\*\*Part A: PASS\.\*\*/.test(src));
  check('O. PARTS DRY-RUN EVIDENCE', 'records PASS for Part B', /\*\*Part B: PASS\.\*\*/.test(src));
  check('O. PARTS DRY-RUN EVIDENCE', 'records the split decision (M1-07/M1-08 checkpoint)', /M1-07\/M1-08 checkpoint/.test(src));
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
