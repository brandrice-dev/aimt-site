#!/usr/bin/env node
// AIMT Module 12 — deterministic content-bank generator.
//
// LOCKED markdown authority (owner-approved, student-facing-wording-frozen):
//   docs/course-audit/modules/module-12-final-knowledge-bank.md   (120 items)
//   docs/course-audit/modules/module-12-final-applied-cases.md    (12 cases)
//   docs/course-audit/modules/module-12-final-interview-bank.md   (9 conversations)
//
// This script parses those three files programmatically (never by hand-typing
// student-facing wording) and emits functions/_lib/certification/content-bank.mjs.
// Extracted text is copied verbatim from the source markdown — this script
// must never paraphrase, shorten, or "improve" a prompt/choice/scenario. The
// only rendering-necessary transformation performed is stripping markdown
// hard-line-break markers (trailing double-spaces) and joining wrapped lines,
// which changes no character of the actual words.
//
// A small, explicit BLOCKED_ITEMS list (below) marks knowledge items that a
// traceability audit against the approved Modules 1-11 specifications could
// not confirm — see docs/course-audit/modules/module-12-content-traceability.md
// for the full record. Blocked items are still parsed and included with
// status:'draft' (excluded from any real selection by isApprovedForProduction()
// in content-schema.mjs) rather than silently dropped, so the count/ID ledger
// stays complete and auditable.
//
// Run: node scripts/build-module12-assessment-bank.mjs
// Verify without writing: node scripts/build-module12-assessment-bank.mjs --check

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const KNOWLEDGE_MD = path.join(ROOT, 'docs/course-audit/modules/module-12-final-knowledge-bank.md');
const CASES_MD = path.join(ROOT, 'docs/course-audit/modules/module-12-final-applied-cases.md');
const INTERVIEWS_MD = path.join(ROOT, 'docs/course-audit/modules/module-12-final-interview-bank.md');
const OUT_FILE = path.join(ROOT, 'functions/_lib/certification/content-bank.mjs');

// ---------------------------------------------------------------------------
// Traceability audit results (docs/course-audit/modules/module-12-content-traceability.md).
// Every item not listed here verified cleanly against its cited Module 1-11
// approved specification. Never add an entry here to "make a test pass" —
// only to record a genuine, documented traceability gap the owner must see.
// ---------------------------------------------------------------------------
const BLOCKED_KNOWLEDGE_ITEMS = {
  'M02-005': 'Scenario/answer not supported by module-02.md. The only late-arrival scenario documented ' +
    '(checkpoint m2cp1) specifies a 2-minute delay, not 8, and does not involve a subsequent-booking timing ' +
    'concern. module-02.md teaches "schedule pressure belongs to the business, not the client" and that the ' +
    'practitioner should absorb, not communicate, schedule pressure — it never instructs communicating a ' +
    '"genuinely necessary timing adjustment" to the client, which is the marked-correct answer’s core claim.',
  'M07-006': 'module-07.md documents only a general "never mix clean/dirty bins" instruction. It does not teach ' +
    'the specific decision rule this item tests (an item of uncertain cross-contact status must be treated as ' +
    'compromised and reprocessed before use) as a scenario or named rule.',
  'M08-012': 'The scenario and marked-correct answer reflect a superseded (pre-August-24-2026) version of Module ' +
    '8’s fragrance-selection script. The current controlling text moved fragrance-free determination to intake ' +
    '(a predetermined fragrance-free path is followed when intake has already established one); the live, ' +
    'in-service "three options, equal weight, or skip fragrance altogether" presentation this item tests no ' +
    'longer exists in approved Module 8 content.',
};

// Internal-metadata-only correction (does not touch any student-facing wording):
// the locked bank cites M11-005 to "Module 11 checkpoint `m11cp1`", but m11cp1's
// documented scenario is the separate ChatGPT/dandruff example. The competency
// tested (Hear->Observe->Boundary->Next Step) is genuinely taught in module-11.md
// Section 11.5, so the item is not blocked -- only its internal sourceSection
// citation is corrected to point at the section that actually teaches it.
const SOURCE_SECTION_OVERRIDES = {
  'M11-005': 'Module 11 approved specification — Section 11.5, Hear→Observe→Boundary→Next Step framework (not checkpoint m11cp1, which documents a different scenario).',
};

const NO_CRITICAL_FLAGS_CASES_INTERVIEWS = new Set(); // reserved for future use; currently unused

function readSource(file) {
  return readFileSync(file, 'utf8');
}

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function stripLineBreakMarker(line) {
  // Markdown hard line breaks are authored as a trailing double-space. Strip
  // only that marker -- never trim meaningful trailing punctuation.
  return line.replace(/ {2,}$/, '');
}

function joinLines(lines) {
  return lines.map(stripLineBreakMarker).join('\n').replace(/^\n+|\n+$/g, '');
}

// ---------------------------------------------------------------------------
// Part I -- Knowledge Bank parser (120 uniform items)
// ---------------------------------------------------------------------------

function normalizeDifficulty(raw, id) {
  const r = raw.trim();
  const map = {
    'Foundational': 'foundational',
    'Applied': 'applied',
    'Advanced / Synthesis': 'advanced-synthesis',
    // Compound boundary labels resolve to the single heavier-weighted tier
    // mentioned (Foundational < Applied < Advanced/Synthesis) -- documented
    // in module-12-content-traceability.md's parsing-rules section.
    'Applied / Synthesis': 'advanced-synthesis',
    'Foundational / Applied': 'applied',
  };
  if (!(r in map)) throw new Error(`${id}: unrecognized difficulty label "${r}"`);
  return map[r];
}

function normalizeEvidence(raw) {
  // Only the formal "Critical-Domain Evidence: Dx[, Dy...]" marker counts as
  // criticalDomainEvidence. Informal notes elsewhere in the locked banks
  // ("D3 secondary", "D1-adjacent", "Standard with D2/D3 support") are
  // deliberately NOT counted -- a conservative, documented parsing rule that
  // never invents formal evidence the bank author did not explicitly mark.
  const m = raw.match(/Critical-Domain Evidence:\s*([D1-4,\s()a-zA-Z/-]+)/);
  if (!m) return [];
  return Array.from(new Set((m[1].match(/D[1-4]/g) || [])));
}

function parseKnowledgeBank(text) {
  const lines = text.split('\n');
  const moduleRe = /^# Module (\d+) — /;
  const itemRe = /^### (M\d{2}-\d{3}) — (.+)$/;

  let currentModule = null;
  let buffer = null; // { id, title, moduleNumber, lines: [] }
  const rawItems = [];

  function flush() {
    if (buffer) rawItems.push(buffer);
    buffer = null;
  }

  for (const line of lines) {
    const mMatch = line.match(moduleRe);
    if (mMatch) {
      flush();
      currentModule = Number(mMatch[1]);
      continue;
    }
    const iMatch = line.match(itemRe);
    if (iMatch) {
      flush();
      buffer = { id: iMatch[1], title: iMatch[2].trim(), moduleNumber: currentModule, lines: [] };
      continue;
    }
    if (buffer) buffer.lines.push(line);
  }
  flush();

  return rawItems.map((raw) => parseKnowledgeItem(raw));
}

function parseKnowledgeItem(raw) {
  const { id, moduleNumber, lines } = raw;
  let i = 0;
  function expectField(label) {
    const line = lines[i];
    const re = new RegExp('^\\*\\*' + label + ':\\*\\*\\s*(.*)$');
    const m = line && line.match(re);
    if (!m) throw new Error(`${id}: expected **${label}:** at line "${line}"`);
    i++;
    return stripLineBreakMarker(m[1]);
  }

  const difficultyRaw = expectField('Difficulty');
  const evidenceRaw = expectField('Evidence');
  const competency = expectField('Competency');

  // Skip blank line(s) before the stem.
  while (lines[i] === '') i++;

  const optionRe = /^([A-D])\.\s(.*)$/;
  const stemLines = [];
  while (i < lines.length && !optionRe.test(lines[i])) {
    stemLines.push(lines[i]);
    i++;
  }
  const prompt = joinLines(stemLines);

  const choices = [];
  while (i < lines.length && optionRe.test(lines[i])) {
    const m = lines[i].match(optionRe);
    choices.push(stripLineBreakMarker(m[2]).trim());
    i++;
  }
  if (choices.length !== 4) throw new Error(`${id}: expected 4 answer choices, found ${choices.length}`);

  while (lines[i] === '') i++;

  const correctLetter = expectField('Correct').trim();
  const correctChoice = 'ABCD'.indexOf(correctLetter);
  if (correctChoice === -1) throw new Error(`${id}: invalid Correct letter "${correctLetter}"`);

  const rationale = expectField('Rationale');
  const source = expectField('Source');

  const difficulty = normalizeDifficulty(difficultyRaw, id);
  const criticalDomainEvidence = normalizeEvidence(evidenceRaw);
  const sourceSection = SOURCE_SECTION_OVERRIDES[id] || source;
  const status = BLOCKED_KNOWLEDGE_ITEMS[id] ? 'draft' : 'approved';

  return {
    id,
    version: 1,
    sourceModule: moduleNumber,
    sourceSection,
    competency,
    difficulty,
    criticalDomainEvidence,
    prompt,
    choices,
    correctChoice,
    rationale,
    status,
  };
}

// ---------------------------------------------------------------------------
// Part III -- Interview Bank parser (9 uniform conversations)
// ---------------------------------------------------------------------------

function parseInterviewBank(text) {
  const lines = text.split('\n');
  const itemRe = /^# (INT-\d{2}) — (.+)$/;
  let buffer = null;
  const rawItems = [];
  function flush() {
    if (buffer) rawItems.push(buffer);
    buffer = null;
  }
  for (const line of lines) {
    const m = line.match(itemRe);
    if (m) {
      flush();
      buffer = { id: m[1], title: m[2].trim(), lines: [] };
      continue;
    }
    if (line.startsWith('# Interview-bank validation summary')) {
      flush();
      break;
    }
    if (buffer) buffer.lines.push(line);
  }
  flush();
  return rawItems.map(parseInterviewItem);
}

function extractBlockquote(lines, startIdx) {
  // Collects consecutive '> ' lines starting at startIdx (blank '>' lines end
  // a paragraph but blockquote continues if another '> ' line follows).
  let i = startIdx;
  const out = [];
  while (i < lines.length && (lines[i].startsWith('>') )) {
    const content = lines[i].replace(/^>\s?/, '');
    out.push(content);
    i++;
  }
  return { text: joinLines(out), nextIdx: i };
}

function parseInterviewItem(raw) {
  const { id, lines } = raw;
  const text = lines.join('\n');

  function field(label) {
    const re = new RegExp('\\*\\*' + label + ':\\*\\*\\s*(.+)');
    const m = text.match(re);
    if (!m) throw new Error(`${id}: missing field ${label}`);
    return stripLineBreakMarker(m[1]).trim();
  }

  const modulesRaw = field('Modules');
  const sourceModules = modulesRaw.split(',').map((s) => Number(s.trim()));

  const evidenceRaw = field('Evidence');
  const criticalDomainEvidence = normalizeEvidence(evidenceRaw);

  const competencyRaw = field('Primary competency');
  const competencies = competencyRaw.split(';').map((s) => s.trim()).filter(Boolean);

  const promptHeaderIdx = lines.findIndex((l) => l.trim() === '## Cadence primary prompt');
  const followUpHeaderIdx = lines.findIndex((l) => l.trim() === '## Allowed follow-up, if needed');
  const rubricHeaderIdx = lines.findIndex((l) => /^## Rubric criteria/.test(l.trim()));
  const criticalFlagsIdx = lines.findIndex((l) => /^\*\*Critical Type A flags:\*\*/.test(l.trim()));
  const sourceIdx = lines.findIndex((l) => /^\*\*Source:\*\*/.test(l.trim()));

  let j = promptHeaderIdx + 1;
  while (lines[j] === '') j++;
  const primaryPromptBlock = extractBlockquote(lines, j);
  const primaryPrompt = primaryPromptBlock.text;

  let k = followUpHeaderIdx + 1;
  while (lines[k] === '') k++;
  const followUpBlock = extractBlockquote(lines, k);
  const followUpPrompt = followUpBlock.text;

  // Rubric criteria: numbered list "1. **Label** — guidance text" through 5.
  const rubricCriteria = [];
  for (let n = rubricHeaderIdx + 1; n < (criticalFlagsIdx !== -1 ? criticalFlagsIdx : sourceIdx); n++) {
    const line = lines[n];
    // Guidance clause after an em-dash is optional -- some criteria are a
    // single self-contained bolded sentence with no separate dash-clause
    // (e.g. INT-05 criteria 1 and 3, INT-07 criterion 3, INT-08 criterion 3).
    const m = line && line.match(/^(\d+)\.\s+\*\*(.+?)\*\*(?:\s*—\s*(.+))?$/);
    if (m) {
      rubricCriteria.push({
        id: `c${m[1]}`,
        label: stripLineBreakMarker(m[2]).trim(),
        guidance: m[3] ? stripLineBreakMarker(m[3]).trim() : stripLineBreakMarker(m[2]).trim(),
        criticalDomainEvidence: criticalDomainEvidence.slice(),
      });
    }
  }
  if (rubricCriteria.length !== 5) throw new Error(`${id}: expected 5 rubric criteria, found ${rubricCriteria.length}`);

  let criticalFlags = [];
  if (criticalFlagsIdx !== -1) {
    const flagLines = [];
    for (let n = criticalFlagsIdx; n < sourceIdx; n++) flagLines.push(lines[n]);
    const flagText = flagLines.join('\n').replace(/^\*\*Critical Type A flags:\*\*\s*/, '');
    const description = joinLines(flagText.split('\n')).trim();
    if (description) {
      criticalFlags = [{ description, criticalDomainEvidence: criticalDomainEvidence.slice() }];
      // Every criterion is a candidate carrier of this conversation's Type A
      // guidance -- Cadence (cadence-grader.mjs) reads rubricCriteria[].explicitUnsafeRule
      // per-criterion, so attach the same human-authored description to each
      // criterion that touches the relevant domain(s).
      for (const c of rubricCriteria) {
        if (c.criticalDomainEvidence.length) {
          c.explicitUnsafeRule = { description };
        }
      }
    }
  }

  const sourceText = stripLineBreakMarker(text.match(/\*\*Source:\*\*\s*(.+)/)[1]).trim();

  return {
    id,
    version: 1,
    sourceModules,
    sourceSection: sourceText,
    competencies,
    criticalDomainEvidence,
    primaryPrompt,
    allowedFollowUp: true,
    followUpPrompt,
    rubricCriteria,
    criticalFlags,
    status: 'approved',
  };
}

// ---------------------------------------------------------------------------
// Part II -- Applied Case Bank parser (12 heterogeneous cases)
// ---------------------------------------------------------------------------

function parseCaseBank(text) {
  const lines = text.split('\n');
  const itemRe = /^# (CASE-\d{2}) — (.+)$/;
  let buffer = null;
  const rawItems = [];
  function flush() {
    if (buffer) rawItems.push(buffer);
    buffer = null;
  }
  for (const line of lines) {
    const m = line.match(itemRe);
    if (m) {
      flush();
      buffer = { id: m[1], title: m[2].trim(), lines: [] };
      continue;
    }
    if (line.startsWith('# Case-bank validation summary')) {
      flush();
      break;
    }
    if (buffer) buffer.lines.push(line);
  }
  flush();
  return rawItems.map(parseCaseItem);
}

function splitOnHeaders(lines, level2Re) {
  // Splits a case's line buffer into { preamble, sections: [{header, lines}] }
  // for every line matching level2Re (## headers).
  const sections = [];
  let preamble = [];
  let current = null;
  for (const line of lines) {
    const m = line.match(level2Re);
    if (m) {
      if (current) sections.push(current);
      current = { header: m[1].trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    } else {
      preamble.push(line);
    }
  }
  if (current) sections.push(current);
  return { preamble, sections };
}

function parseCaseItem(raw) {
  const { id, lines } = raw;
  const text = lines.join('\n');

  function field(label) {
    const re = new RegExp('\\*\\*' + label + ':\\*\\*\\s*(.+)');
    const m = text.match(re);
    if (!m) throw new Error(`${id}: missing field ${label}`);
    return stripLineBreakMarker(m[1]).trim();
  }

  const modulesRaw = field('Modules');
  const sourceModules = modulesRaw.split(',').map((s) => Number(s.trim()));

  const evidenceRaw = field('Evidence');
  const criticalDomainEvidence = normalizeEvidence(evidenceRaw);

  const competencyRaw = field('Primary competencies');
  const competencies = competencyRaw.split(';').map((s) => s.trim()).filter(Boolean);

  const { sections } = splitOnHeaders(lines, /^##\s+(.+)$/);

  const scenarioSection = sections.find((s) => s.header === 'Student-facing scenario');
  const scenario = scenarioSection ? joinLines(scenarioSection.lines).trim() : '';

  // "Student response" (no deterministic parts) is a section header used by
  // CASE-07/CASE-09 instead of "Part A" -- treat it as one implicit Part.
  const studentResponseSection = sections.find((s) => s.header === 'Student response');

  const partSections = sections.filter((s) => /^Part [A-Z]/.test(s.header));

  const sourceText = stripLineBreakMarker(text.match(/\*\*Source:\*\*\s*(.+)/)[1]).trim();

  const parts = [];

  function findRubricAndCriticalFlags(sectionLines) {
    const rubricIdx = sectionLines.findIndex((l) => /^## Internal rubric/.test(l.trim()));
    return rubricIdx;
  }

  if (studentResponseSection) {
    // Whole case is one structured-short-response part. The rubric lives in
    // its own "## Internal rubric" section and the prompt is the blockquote
    // immediately under "## Student response".
    let i = 0;
    while (studentResponseSection.lines[i] === '') i++;
    const promptBlock = extractBlockquote(studentResponseSection.lines, i);
    const rubricSection = sections.find((s) => /^Internal rubric/.test(s.header));
    const rubric = parseRubricPoints(rubricSection ? rubricSection.lines : [], rubricSection ? rubricSection.header : '');
    const flagsSection = sections.find((s) => false); // flags for this shape live inline below rubric, handled via regex
    const explicitUnsafeRule = extractCriticalFlagText(text);
    parts.push({
      id: `${id}-response`,
      type: 'structured-short-response',
      prompt: promptBlock.text,
      rubric: explicitUnsafeRule ? { ...rubric, explicitUnsafeRule: { description: explicitUnsafeRule } } : rubric,
    });
  } else {
    for (const section of partSections) {
      parts.push(parseCasePart(id, section));
    }
  }

  // Case-level criticalFlags: only meaningful for cases whose critical-flag
  // guidance attaches to a DETERMINISTIC part (no structured-short-response
  // part exists to carry it via rubric.explicitUnsafeRule). CASE-03/CASE-04
  // are the two cases this applies to -- encoded explicitly below since the
  // mapping from "which wrong choice" to "this flag" requires reading the
  // exact locked option text, not a generic pattern.
  const criticalFlags = buildDeterministicCriticalFlags(id, parts);

  const scoring = { method: 'weighted-parts', weights: parts.map(() => 1) };

  return {
    id,
    version: 1,
    sourceModules,
    sourceSection: sourceText,
    competencies,
    criticalDomainEvidence,
    scenario,
    parts,
    scoring,
    criticalFlags,
    status: 'approved',
  };
}

function extractCriticalFlagText(caseFullText) {
  const m = caseFullText.match(/\*\*Critical flags?:\*\*\s*([\s\S]*?)\n\n\*\*Source:\*\*/);
  if (!m) return null;
  return joinLines(m[1].split('\n')).trim();
}

function parseRubricPoints(sectionLines, header) {
  const pointsMatch = header.match(/Internal rubric — (\d+) points?/);
  const totalPoints = pointsMatch ? Number(pointsMatch[1]) : null;
  const criteria = [];
  for (const line of sectionLines) {
    const m = line.match(/^-\s*(\d+)\s*—\s*(.+)$/);
    if (m) criteria.push({ points: Number(m[1]), description: stripLineBreakMarker(m[2]).trim() });
  }
  return { totalPoints, criteria };
}

// Header suffixes that are generic part-type labels, not a real question --
// never substituted in as the prompt even when the body text is also generic.
const GENERIC_HEADER_SUFFIXES = new Set(['short response', 'sequence', 'classification', 'select all that apply']);

function headerSuffix(header) {
  const m = header.match(/^Part [A-Z]\s*—\s*(.+)$/);
  return m ? m[1].trim() : null;
}

function parseCasePart(caseId, section) {
  const header = section.header; // e.g. "Part A", "Part A — Select all actions that belong in your response", "Part B — Short response"
  const partLetter = header.match(/^Part ([A-Z])/)[1];
  const partId = `${caseId}-p${partLetter}`;
  const lines = section.lines;
  const fullText = lines.join('\n');
  const suffix = headerSuffix(header);

  const optionRe = /^([A-Z])\.\s(.*)$/;

  // Classification part: "For each item, classify it as: ... **Correct classifications:**"
  if (/\*\*Correct classifications:\*\*/.test(fullText)) {
    return parseClassificationPart(partId, lines);
  }

  // Sequencing part: numbered list "1. ... 2. ... 3. ... 4. ..." + "**Correct order:**"
  if (/\*\*Correct order:\*\*/.test(fullText)) {
    return parseSequencingPart(partId, lines);
  }

  // Multi-select: "**Correct selections:**"
  if (/\*\*Correct selections:\*\*/.test(fullText)) {
    return parseChoicePart(partId, lines, 'multi-select', suffix);
  }

  // Short response: blockquote prompt, no lettered options.
  if (!lines.some((l) => optionRe.test(l))) {
    return parseShortResponsePart(caseId, partId, lines, header);
  }

  // Default: single-best-answer, "**Correct:**"
  return parseChoicePart(partId, lines, 'single-best-answer', suffix);
}

function extractPromptBeforeOptions(lines, optionRe) {
  const stemLines = [];
  let i = 0;
  // Skip a leading "## Part X" restatement line like "What is the strongest response?"
  while (i < lines.length && !optionRe.test(lines[i]) && !lines[i].startsWith('**Correct')) {
    stemLines.push(lines[i]);
    i++;
  }
  return { prompt: joinLines(stemLines).trim(), nextIdx: i };
}

function parseChoicePart(partId, lines, type, suffix) {
  const optionRe = /^([A-Z])\.\s(.*)$/;
  let { prompt } = extractPromptBeforeOptions(lines, optionRe);
  // If the body text before the options is just the generic multi-select
  // instruction ("Select **all** that apply.") and the "## Part X — ..."
  // header carries the actual, non-generic question (e.g. CASE-01 Part A:
  // "Select all actions that belong in your response"), use the header's
  // question instead -- it is the only place the real prompt appears.
  const genericBody = /^select\s+\*{0,2}all\*{0,2}\s+that apply\.?$/i.test(prompt.trim());
  if (genericBody && suffix && !GENERIC_HEADER_SUFFIXES.has(suffix.toLowerCase())) {
    prompt = suffix;
  }
  const choices = [];
  const letters = [];
  for (const line of lines) {
    const m = line.match(optionRe);
    if (m) {
      letters.push(m[1]);
      choices.push(stripLineBreakMarker(m[2]).trim());
    }
  }
  const fullText = lines.join('\n');
  let correctAnswer;
  if (type === 'multi-select') {
    const m = fullText.match(/\*\*Correct selections:\*\*\s*(.+)/);
    const selectedLetters = m[1].split(',').map((s) => s.trim());
    correctAnswer = selectedLetters.map((l) => letters.indexOf(l)).sort((a, b) => a - b);
  } else {
    const m = fullText.match(/\*\*Correct:\*\*\s*([A-Z])/);
    correctAnswer = letters.indexOf(m[1]);
  }
  return { id: partId, type, prompt, choices, correctAnswer };
}

function parseSequencingPart(partId, lines) {
  const numberedRe = /^(\d+)\.\s(.*)$/;
  const stemLines = [];
  const stepsByNumber = {};
  let i = 0;
  while (i < lines.length && !numberedRe.test(lines[i])) {
    stemLines.push(lines[i]);
    i++;
  }
  while (i < lines.length && numberedRe.test(lines[i])) {
    const m = lines[i].match(numberedRe);
    stepsByNumber[Number(m[1])] = stripLineBreakMarker(m[2]).trim();
    i++;
  }
  const stepCount = Object.keys(stepsByNumber).length;
  const choices = [];
  for (let n = 1; n <= stepCount; n++) choices.push(stepsByNumber[n]);

  const fullText = lines.join('\n');
  const m = fullText.match(/\*\*Correct order:\*\*\s*(.+)/);
  const orderNumbers = m[1].split('→').map((s) => Number(s.trim()));
  const correctAnswer = orderNumbers.map((n) => n - 1); // 0-indexed positions into `choices`

  return { id: partId, type: 'sequencing', prompt: joinLines(stemLines).trim(), choices, correctAnswer };
}

function parseClassificationPart(partId, lines) {
  const fullText = lines.join('\n');
  const stemLines = [];
  let i = 0;
  while (i < lines.length && lines[i].trim() !== '**Correct classifications:**') {
    if (!/^-\s\*\*/.test(lines[i])) stemLines.push(lines[i]);
    i++;
  }
  // Category labels appear as "- **Acceptable variation**" / "- **Needs correction before service**"
  const categoryLabels = [];
  for (const line of lines) {
    const m = line.match(/^-\s\*\*(.+)\*\*$/);
    if (m) categoryLabels.push(m[1].trim());
  }
  const prompt = joinLines(stemLines).trim();

  const numberedRe = /^(\d+)\.\s(.*)$/;
  const items = [];
  const correctAnswer = {};
  for (let n = i; n < lines.length; n++) {
    const m = lines[n].match(numberedRe);
    if (!m) continue;
    // e.g. "1. Armrest configuration — Acceptable variation, assuming function/safety are unaffected"
    const rest = stripLineBreakMarker(m[2]).trim();
    const dashSplit = rest.split(/\s+—\s+/);
    const itemLabel = dashSplit[0].trim();
    const itemId = `item${m[1]}`;
    items.push({ id: itemId, label: itemLabel });
    const matchedCategory = categoryLabels.find((c) => dashSplit[1] && dashSplit[1].startsWith(c));
    correctAnswer[itemId] = matchedCategory || (dashSplit[1] || '').trim();
  }

  return { id: partId, type: 'classification', prompt, categories: categoryLabels, items, correctAnswer };
}

function parseShortResponsePart(caseId, partId, lines, header) {
  let i = 0;
  while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('>')) i++;
  while (lines[i] === '') i++;
  const promptBlock = extractBlockquote(lines, i);
  return { id: partId, type: 'structured-short-response', prompt: promptBlock.text, rubric: null };
}

// A case's parts array is built section-by-section above; rubric attachment
// for short-response parts inside a multi-part case (e.g. CASE-01 Part B,
// CASE-02 Part D) happens in a second pass here, matching each
// structured-short-response part to its case's single "## Internal rubric"
// section (every locked case has at most one).
function attachRubricToShortResponseParts(caseId, parts, sections, fullCaseText) {
  const rubricSection = sections.find((s) => /^Internal rubric/.test(s.header));
  if (!rubricSection) return;
  const rubric = parseRubricPoints(rubricSection.lines, rubricSection.header);
  const explicitUnsafeRule = extractCriticalFlagText(fullCaseText);
  for (const part of parts) {
    if (part.type === 'structured-short-response' && !part.rubric) {
      part.rubric = explicitUnsafeRule ? { ...rubric, explicitUnsafeRule: { description: explicitUnsafeRule } } : rubric;
    }
  }
}

// Deterministic critical-flag encodings for the two cases (CASE-03, CASE-04)
// whose locked "Critical flag" text describes an explicitly wrong DETERMINISTIC
// choice rather than free-text reasoning. See
// docs/course-audit/modules/module-12-content-traceability.md's "Critical-flag
// encoding" section for why each mapping below was chosen -- every mapping
// quotes the exact locked option text it corresponds to.
function buildDeterministicCriticalFlags(caseId, parts) {
  if (caseId === 'CASE-03') {
    const partB = parts.find((p) => p.id.endsWith('-pB'));
    if (!partB) return [];
    // Option B: "Use the requested intensity because the skin is intact and
    // the client understands what she wants" -- verbatim match to the locked
    // flag: "Explicitly proceeding with clearly inappropriate stronger
    // intensity solely because the client insists."
    return [{
      partId: partB.id,
      triggerType: 'choiceEquals',
      value: partB.choices.indexOf('Use the requested intensity because the skin is intact and the client understands what she wants'),
      domainId: 'D2',
      description: 'Explicitly proceeding with clearly inappropriate stronger intensity solely because the client insists contributes Type A D2 evidence.',
    }];
  }
  if (caseId === 'CASE-04') {
    const partA = parts.find((p) => p.id.endsWith('-pA'));
    const partB = parts.find((p) => p.id.endsWith('-pB'));
    const flags = [];
    if (partA) {
      const dryNowIdx = partA.choices.indexOf('Dry it now because most of the required time has already passed');
      const rinseIdx = partA.choices.indexOf('Rinse it with water to remove the disinfectant and finish the setup');
      for (const value of [dryNowIdx, rinseIdx]) {
        if (value !== -1) {
          flags.push({ partId: partA.id, triggerType: 'choiceEquals', value, domainId: 'D4',
            description: 'Explicit willingness to shorten required process time or use an unprocessed item is Type A D4 evidence.' });
        }
      }
    }
    if (partB) {
      const shortenIdx = partB.choices.indexOf('Shorten the contact time if the client has already been waiting');
      const backupIdx = partB.choices.indexOf('Use an unprocessed backup item so the client does not wait');
      for (const value of [shortenIdx, backupIdx]) {
        if (value !== -1) {
          flags.push({ partId: partB.id, triggerType: 'choiceIncludes', value, domainId: 'D4',
            description: 'Explicit willingness to shorten required process time or use an unprocessed item is Type A D4 evidence.' });
        }
      }
    }
    return flags;
  }
  return [];
}

// Second-pass rubric attachment requires each case's raw sections -- redo
// case parsing with sections retained so attachRubricToShortResponseParts can run.
function parseCaseBankWithRubricAttachment(text) {
  const lines = text.split('\n');
  const itemRe = /^# (CASE-\d{2}) — (.+)$/;
  let buffer = null;
  const rawItems = [];
  function flush() {
    if (buffer) rawItems.push(buffer);
    buffer = null;
  }
  for (const line of lines) {
    const m = line.match(itemRe);
    if (m) {
      flush();
      buffer = { id: m[1], title: m[2].trim(), lines: [] };
      continue;
    }
    if (line.startsWith('# Case-bank validation summary')) {
      flush();
      break;
    }
    if (buffer) buffer.lines.push(line);
  }
  flush();

  return rawItems.map((raw) => {
    const item = parseCaseItem(raw);
    const { sections } = splitOnHeaders(raw.lines, /^##\s+(.+)$/);
    attachRubricToShortResponseParts(raw.id, item.parts, sections, raw.lines.join('\n'));
    return item;
  });
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const EXPECTED_MODULE_COUNTS = { 1: 8, 2: 9, 3: 12, 4: 14, 5: 11, 6: 11, 7: 10, 8: 14, 9: 10, 10: 12, 11: 9 };

function validateKnowledgeBank(items) {
  const errors = [];
  if (items.length !== 120) errors.push(`Expected 120 knowledge items, found ${items.length}`);
  const counts = {};
  const ids = new Set();
  for (const item of items) {
    counts[item.sourceModule] = (counts[item.sourceModule] || 0) + 1;
    if (ids.has(item.id)) errors.push(`Duplicate knowledge item ID: ${item.id}`);
    ids.add(item.id);
  }
  for (const [mod, expected] of Object.entries(EXPECTED_MODULE_COUNTS)) {
    if (counts[mod] !== expected) errors.push(`Module ${mod}: expected ${expected} items, found ${counts[mod] || 0}`);
  }
  return errors;
}

function validateCaseBank(items) {
  const errors = [];
  if (items.length !== 12) errors.push(`Expected 12 cases, found ${items.length}`);
  const ids = new Set();
  for (const item of items) {
    if (ids.has(item.id)) errors.push(`Duplicate case ID: ${item.id}`);
    ids.add(item.id);
    if (!item.parts.length) errors.push(`${item.id}: no parts parsed`);
    for (const part of item.parts) {
      if (part.type !== 'structured-short-response' && (!part.choices || !part.choices.length) && part.type !== 'classification') {
        errors.push(`${item.id}/${part.id}: no choices parsed for type ${part.type}`);
      }
    }
  }
  return errors;
}

function validateInterviewBank(items) {
  const errors = [];
  if (items.length !== 9) errors.push(`Expected 9 interviews, found ${items.length}`);
  const ids = new Set();
  for (const item of items) {
    if (ids.has(item.id)) errors.push(`Duplicate interview ID: ${item.id}`);
    ids.add(item.id);
    if (item.rubricCriteria.length !== 5) errors.push(`${item.id}: expected 5 rubric criteria, found ${item.rubricCriteria.length}`);
    if (!item.primaryPrompt) errors.push(`${item.id}: missing primaryPrompt`);
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

function jsLiteral(value) {
  return JSON.stringify(value, null, 2);
}

function generate({ knowledgeBank, caseBank, interviewBank, hashes }) {
  const header = `// AIMT Head Spa — Module 12 final-exam PRODUCTION content bank.
//
// GENERATED FILE — DO NOT EDIT BY HAND.
// Produced by scripts/build-module12-assessment-bank.mjs from the three
// LOCKED, owner-approved markdown authority files:
//   docs/course-audit/modules/module-12-final-knowledge-bank.md
//   docs/course-audit/modules/module-12-final-applied-cases.md
//   docs/course-audit/modules/module-12-final-interview-bank.md
//
// To change student-facing exam content: edit the locked markdown (owner
// approval required per docs/course-audit/AIMT-AUDIT-RULES.md-style content
// authority), then re-run: node scripts/build-module12-assessment-bank.mjs
//
// Traceability: docs/course-audit/modules/module-12-content-traceability.md
// records, for every item, the approved Module 1-11 source that supports it.
// Items that traceability could not confirm ship with status:'draft' (see
// BLOCKED_KNOWLEDGE_ITEMS in the generator script) and are excluded from any
// real student selection by isApprovedForProduction() in content-schema.mjs.
//
// tests/certification-content-bank-sync.test.mjs fails CI if the locked
// source files change without this generated file being regenerated to match
// (source hashes are embedded below as SOURCE_HASHES).

import { BANK_VERSION_PENDING, ASSESSMENT_VERSION_V1 } from './assessment-config.mjs';

export const CONTENT_STATUS = 'INSTALLED';

// A real bank version, distinct from the CONTENT_PENDING placeholder this
// file shipped with before installation.
export const bankVersion = 'headspa-fe-bank-v1-2026-08-26';

export const SOURCE_HASHES = ${jsLiteral(hashes)};

/** @type {import('./content-schema.mjs').KnowledgeItem[]} */
export const knowledgeBank = ${jsLiteral(knowledgeBank)};

/** @type {import('./content-schema.mjs').CaseItem[]} */
export const caseBank = ${jsLiteral(caseBank)};

/** @type {import('./content-schema.mjs').InterviewItem[]} */
export const interviewBank = ${jsLiteral(interviewBank)};

export function getProductionBanks() {
  return { knowledgeBank, caseBank, interviewBank, bankVersion, status: CONTENT_STATUS };
}

export function isBankReadyForProduction() {
  return (
    knowledgeBank.some((i) => i.status === 'approved') &&
    caseBank.some((i) => i.status === 'approved') &&
    interviewBank.some((i) => i.status === 'approved')
  );
}
`;
  return header;
}

function main() {
  const checkOnly = process.argv.includes('--check');

  const knowledgeSource = readSource(KNOWLEDGE_MD);
  const casesSource = readSource(CASES_MD);
  const interviewsSource = readSource(INTERVIEWS_MD);

  const knowledgeBank = parseKnowledgeBank(knowledgeSource);
  const caseBank = parseCaseBankWithRubricAttachment(casesSource);
  const interviewBank = parseInterviewBank(interviewsSource);

  const errors = [
    ...validateKnowledgeBank(knowledgeBank),
    ...validateCaseBank(caseBank),
    ...validateInterviewBank(interviewBank),
  ];
  if (errors.length) {
    console.error('Content bank build FAILED validation:\n' + errors.map((e) => '  - ' + e).join('\n'));
    process.exit(1);
  }

  const hashes = {
    knowledgeBankMd: sha256(knowledgeSource),
    appliedCasesMd: sha256(casesSource),
    interviewBankMd: sha256(interviewsSource),
  };

  const output = generate({ knowledgeBank, caseBank, interviewBank, hashes });

  if (checkOnly) {
    const existing = readSource(OUT_FILE);
    if (existing !== output) {
      console.error('content-bank.mjs is OUT OF SYNC with the locked markdown sources. Run:\n  node scripts/build-module12-assessment-bank.mjs');
      process.exit(1);
    }
    console.log('content-bank.mjs is in sync.');
    return;
  }

  writeFileSync(OUT_FILE, output, 'utf8');
  const approvedK = knowledgeBank.filter((i) => i.status === 'approved').length;
  const blockedK = knowledgeBank.filter((i) => i.status !== 'approved').length;
  console.log(`Wrote ${OUT_FILE}`);
  console.log(`Knowledge: ${knowledgeBank.length} total (${approvedK} approved, ${blockedK} blocked)`);
  console.log(`Cases: ${caseBank.length} total`);
  console.log(`Interviews: ${interviewBank.length} total`);
}

main();
