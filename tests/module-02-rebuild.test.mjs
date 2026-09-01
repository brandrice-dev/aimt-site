// Module 2 curriculum rebuild + Module 0 Listen Mode orientation —
// deterministic coverage (course-audit-build, "AIMT — MODULE 2
// CURRICULUM REBUILD + MODULE 0 LISTEN MODE ORIENTATION").
//
// Flat-HTML site, no build step, no DOM test runner (see CLAUDE.md) — the
// established pattern this repo uses for embedded HTML/inline-script
// behavior is to read the real shipped source and regex-verify specific
// structural markers or extracted function bodies, never a hand-typed
// re-implementation. Followed here.
//
// No Anthropic API calls. Run: node tests/module-02-rebuild.test.mjs

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const courseSrc = readFileSync(path.join(ROOT, 'headspa-mastery.html'), 'utf8');
const registrySrc = readFileSync(path.join(ROOT, 'assets/js/aimt-course-resources.js'), 'utf8');
const m2ScriptDoc = readFileSync(path.join(ROOT, 'docs/course-audit/listen-mode/module-02-listen-script.md'), 'utf8');
const m0ScriptDoc = readFileSync(path.join(ROOT, 'docs/course-audit/listen-mode/module-00-listen-script.md'), 'utf8');

function extractWrap(src, id) {
  const start = src.indexOf('<div id="' + id + '"');
  if (start === -1) return null;
  // Find the matching close by tracking div depth from the opening tag.
  let depth = 0;
  let i = start;
  const openRe = /<div\b[^>]*>/g;
  const closeTag = '</div>';
  // Walk forward counting div opens/closes starting at `start`.
  let pos = start;
  depth = 0;
  while (pos < src.length) {
    const nextOpen = src.indexOf('<div', pos);
    const nextClose = src.indexOf(closeTag, pos);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = src.indexOf('>', nextOpen) + 1;
    } else {
      depth--;
      pos = nextClose + closeTag.length;
      if (depth === 0) return src.slice(start, pos);
    }
  }
  return null;
}

const module2Wrap = extractWrap(courseSrc, 'module2Wrap');
const module0Wrap = extractWrap(courseSrc, 'module0Wrap');

// ─────────────────────────────────────────────────────────────────────────
// A. MODULE 2 — SECTION ORDER + CORE DOCTRINE
// ─────────────────────────────────────────────────────────────────────────
(function module2StructureTests() {
  check('A. STRUCTURE', 'module2Wrap extracted successfully', !!module2Wrap && module2Wrap.length > 500);

  const order = ['2.1 — Intake Before Arrival', '2.2 — Remove Preventable Uncertainty', '2.3 — Set the Plan Before the Quiet', 'Practitioner resource', '2.4 — First Touch', '2.5 — Protect the Quiet', '2.6 — When Something Changes', '2.7 — Consistency', 'id="m2cp1"'];
  const positions = order.map((marker) => module2Wrap.indexOf(marker));
  check('A. STRUCTURE', 'every expected section marker is present', positions.every((p) => p !== -1), JSON.stringify(order.filter((_, i) => positions[i] === -1)));
  check('A. STRUCTURE', 'sections render in the correct order (2.1 -> ... -> 2.7 -> checkpoint)', positions.every((p, i) => i === 0 || p > positions[i - 1]));

  check('A. CORE DOCTRINE', 'the governing principle is stated verbatim', module2Wrap.includes('Intake determines the plan. Preparation removes uncertainty. The service executes the plan.'));
  check('A. CORE DOCTRINE', '"relaxation begins with certainty" is stated', module2Wrap.includes('Relaxation begins with certainty.'));
  check('A. CORE DOCTRINE', 'the relaxation-first, mostly-quiet doctrine is taught in 2.5', /Most hands-on treatment should remain quiet by default/.test(module2Wrap));
  check('A. CORE DOCTRINE', '2.5 explicitly instructs against repeated permission-asking for standard steps', /repeatedly asking questions such as/.test(module2Wrap) || /shouldn't be taught to repeatedly ask/i.test(module2Wrap) || /Is this okay/.test(module2Wrap));
})();

// ─────────────────────────────────────────────────────────────────────────
// B. FIRST-TOUCH RECONCILIATION WITH MODULE 8
// ─────────────────────────────────────────────────────────────────────────
(function firstTouchTests() {
  check('B. FIRST TOUCH', 'the shoulder contact is framed as the beginning of hands-on service, not accidental', /not an accidental gesture before the treatment begins/.test(module2Wrap));
  check('B. FIRST TOUCH', 'the Module 8-approved scent-introduction line is used verbatim', module2Wrap.includes('I have three scent options for you today. Take a moment with each and tell me which one you’re most drawn to.') || module2Wrap.includes('I have three scent options for you today. Take a moment with each and tell me which one you\'re most drawn to.'));
  check('B. FIRST TOUCH', 'the "not this" prohibition against subconscious-trust/nervous-system/guaranteed-relaxation claims is present', /subconsciously creating trust, regulating the nervous system, forcing relaxation, or guaranteeing a psychological response/.test(module2Wrap));
  check('B. FIRST TOUCH', 'the three Module 8 communication concepts (Communication cue / Keep the flow quiet / If they ask) appear', /Communication cue/.test(module2Wrap) && /Keep the flow quiet/.test(module2Wrap) && /If they ask/.test(module2Wrap));
})();

// ─────────────────────────────────────────────────────────────────────────
// C. DOWNLOADABLE + RESOURCE LIBRARY
// ─────────────────────────────────────────────────────────────────────────
(function downloadableTests() {
  const expectedHref = 'assets/images/course/module-02/module-02-head-spa-intake-service-plan-fillable.pdf';
  check('C. DOWNLOADABLE', 'the resource link in module2Wrap points at the real installed path', module2Wrap.includes('href="' + expectedHref + '"'));
  check('C. DOWNLOADABLE', 'the PDF actually exists on disk', existsSync(path.join(ROOT, expectedHref)));
  check('C. DOWNLOADABLE', 'the link carries the download attribute', new RegExp('href="' + expectedHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[^>]*download').test(module2Wrap));
  check('C. DOWNLOADABLE', 'the not-a-medical-form disclaimer is present', /not a medical-history form, diagnosis form, or legal waiver/.test(module2Wrap));

  const module2RegistryPos = registrySrc.indexOf('module: 2,');
  check('C. RESOURCE LIBRARY', 'the registry has a module 2 entry pointing at the same real path', module2RegistryPos !== -1 && registrySrc.slice(module2RegistryPos, module2RegistryPos + 500).includes("href: '" + expectedHref + "'"));
  const registrySandboxWindow = {};
  new Function('window', registrySrc)(registrySandboxWindow);
  const module2Resources = (registrySandboxWindow.AIMT_COURSE_RESOURCES['headspa-mastery'] || []).filter((r) => r.module === 2);
  check('C. RESOURCE LIBRARY', 'executing the real registry produces exactly one Module 2 resource, type download, title matches', module2Resources.length === 1 && module2Resources[0].type === 'download' && module2Resources[0].title === 'Head Spa Intake + Service Plan');
})();

// ─────────────────────────────────────────────────────────────────────────
// D. CHECKPOINT (m2cp1) — DISPLAYED QUESTION PARITY + PRESERVATION
// ─────────────────────────────────────────────────────────────────────────
(function checkpointTests() {
  const m2ObjectMatch = courseSrc.match(/const M2 = \{[\s\S]*?\n\};/);
  check('D. CHECKPOINT', 'the M2 questions/rubric object is found', !!m2ObjectMatch);
  const newQuestion = 'A new client has completed their intake and is booked for your standard Head Spa service. Walk through the transition from reviewing their intake to the first few minutes of hands-on treatment. Explain what you want established before the service begins, how you remove preventable uncertainty during arrival and preparation, why the shoulder contact matters as the first-touch moment, how you handle the aromatherapy opening, and what kinds of communication still belong during the service once the plan has already been established. You do not need to reproduce a script—explain the reasoning behind your approach.';
  check('D. CHECKPOINT', 'the on-screen .cp-q text matches the new question exactly', module2Wrap.includes('<div class="cp-q">' + newQuestion + '</div>'));
  check('D. CHECKPOINT', 'M2.questions.m2cp1 matches the same new question exactly (displayed/evaluated parity)', m2ObjectMatch[0].includes(newQuestion));
  check('D. CHECKPOINT', 'checkpoint id m2cp1 is unchanged (element id, submit handler, key binding)', module2Wrap.includes('id="m2cp1"') && module2Wrap.includes("submitM2CP('m2cp1')") && module2Wrap.includes("m2cpKey(event,'m2cp1')"));
  check('D. CHECKPOINT', 'MODULE_CHECKPOINTS still lists exactly one checkpoint for module 2: m2cp1 (persistence/gating keys unchanged)', /'2': \['m2cp1'\]/.test(courseSrc));
  check('D. CHECKPOINT', 'submitM2CP still dispatches through the shared submitCheckpoint(2, id, ...) pattern (previously-passed state preservation depends on this key structure never changing)', /function submitM2CP\(id\) \{\s*\n\s*submitCheckpoint\(2, id, M2\.systems\[id\], M2\.questions\[id\]/.test(courseSrc));
  check('D. CHECKPOINT', 'Module 3 unlock is unchanged: completion card still opens Module 3', module2Wrap.includes('onclick="openModuleById(3)"'));
})();

// ─────────────────────────────────────────────────────────────────────────
// D2. COMPLETION CARD — RECAP FOLDED IN, MODULE 1 PATTERN REUSED
// ─────────────────────────────────────────────────────────────────────────
(function completionCardTests() {
  check('D2. COMPLETION', 'there is no standalone white "Module recap" section (sec-eyebrow/sec-title) outside the black completion card', !/class="sec-eyebrow"[^>]*>Module recap</.test(module2Wrap) && !/class="sec-title"[^>]*>[^<]*Module recap/.test(module2Wrap));
  const completeMatch = module2Wrap.match(/<div class="lesson-complete" id="m2Complete"[\s\S]*?\n {4}<\/div>/);
  check('D2. COMPLETION', 'the m2Complete card is found', !!completeMatch);
  const completeHtml = completeMatch ? completeMatch[0] : '';
  check('D2. COMPLETION', 'the recap now lives inside the black completion card, reusing the exact m1Complete pattern (.lc-recap > .lc-next-label "Module recap" + .lc-recap-list)', /<div class="lc-recap">\s*\n\s*<div class="lc-next-label">Module recap<\/div>\s*\n\s*<ul class="lc-recap-list">/.test(completeHtml));
  check('D2. COMPLETION', 'the recap list preserves the core recap substance (intake/uncertainty, plan-before-treatment, protect the flow)', /Review the intake before the appointment/.test(completeHtml) && /Establish the service plan before treatment/.test(completeHtml) && /Protect the flow/.test(completeHtml));
  check('D2. COMPLETION', 'the m1Complete card (frozen reference) uses the identical .lc-recap/.lc-recap-list structure -- confirms this is a reuse, not a new pattern', /<div class="lc-recap">\s*\n\s*<div class="lc-next-label">Module recap<\/div>\s*\n\s*<ul class="lc-recap-list">/.test(extractWrap(courseSrc, 'module1Wrap') || ''));
})();

// ─────────────────────────────────────────────────────────────────────────
// E. NEW "BEFORE SERVICE, OR DURING SERVICE?" INTERACTION (one-at-a-time, 6 items)
// ─────────────────────────────────────────────────────────────────────────
(function interactionTests() {
  const answerFnMatch = courseSrc.match(/function m2BdAnswer\([^)]*\) \{[\s\S]*?\n\}/);
  const renderFnMatch = courseSrc.match(/function m2BdRender\(\) \{[\s\S]*?\n\}/);
  const nextFnMatch = courseSrc.match(/function m2BdNext\(\) \{[\s\S]*?\n\}/);
  check('E. INTERACTION', 'm2BdAnswer(), m2BdRender(), and m2BdNext() are all defined', !!answerFnMatch && !!renderFnMatch && !!nextFnMatch);
  check('E. INTERACTION', 'M2_BD_ITEMS has exactly 6 items (reduced from 12)', (courseSrc.match(/const M2_BD_ITEMS = \[[\s\S]*?\n\];/) || [''])[0].split(/\{ label:/).length - 1 === 6);
  const beforeCount = (courseSrc.match(/answer: 'before'/g) || []).length;
  const duringCount = (courseSrc.match(/answer: 'during'/g) || []).length;
  check('E. INTERACTION', 'exactly 3 items answer "before" and 3 answer "during" (balanced 6-item set)', beforeCount === 3 && duringCount === 3);
  check('E. INTERACTION', 'only one scenario is rendered in the live markup at a time (a single options block, not 6 repeated blocks)', (module2Wrap.match(/id="m2bdOptions"/g) || []).length === 1 && (module2Wrap.match(/onclick="m2BdAnswer\(/g) || []).length === 2);
  check('E. INTERACTION', 'a Next control exists and advances the index (wraps back to 0 after the last item)', /m2BdIndex = \(m2BdIndex === M2_BD_ITEMS\.length - 1\) \? 0 : m2BdIndex \+ 1;/.test(courseSrc));
  check('E. INTERACTION', 'feedback text is concise (a single sentence, not a paragraph)', answerFnMatch && !/[.!?]\s+[A-Z][^.!?]*[.!?]\s+[A-Z]/.test(answerFnMatch[0].match(/fb\.textContent = ([\s\S]*?);/)[1]));
  check('E. INTERACTION', 'the interaction never touches APP_STATE, progress, or completion (ungraded, no progress write)', answerFnMatch && renderFnMatch && !/APP_STATE/.test(answerFnMatch[0] + renderFnMatch[0]) && !/\.save\(\)/.test(answerFnMatch[0] + renderFnMatch[0]));
  check('E. INTERACTION', 'the interaction is retryable (re-clicking always re-evaluates, no disabling of buttons; Next wraps back to item 1 for a full restart)', answerFnMatch && !/\.disabled\s*=\s*true/.test(answerFnMatch[0]));
  check('E. INTERACTION', 'the reset hook (m2BdReset) is wired into STATIC_MODULES[2] so each visit starts at item 1', /2: \(\) => \{ const w = document\.getElementById\('module2Wrap'\); if \(w && wrap\) wrap\.innerHTML = w\.innerHTML; m2BdReset\(\); \}/.test(courseSrc));
  check('E. INTERACTION', 'the two option buttons carry aria-pressed for accessibility', (module2Wrap.match(/aria-pressed="false" onclick="m2BdAnswer/g) || []).length === 2);
  check('E. INTERACTION', 'the feedback region is aria-live for accessibility', module2Wrap.includes('id="m2bdFeedback" style="display:none;" aria-live="polite"'));
  check('E. INTERACTION', 'the old scent-script-builder UI entry point is gone from module2Wrap (evaluateScript() is retired, not deleted -- see its own comment)', !module2Wrap.includes('onclick="evaluateScript()"'));
  check('E. INTERACTION', 'the old arrival-sequence accordion is gone from module2Wrap', !module2Wrap.includes('class="timeline-wrap"') && !/onclick="openStep\(/.test(module2Wrap));
  check('E. INTERACTION', 'the old "what breaks the moment?" quiz is gone from module2Wrap', !module2Wrap.includes('id="breakQuiz"'));
})();

// ─────────────────────────────────────────────────────────────────────────
// F. MOBILE OVERFLOW + DESKTOP LAYOUT (reused/extended generic components)
// ─────────────────────────────────────────────────────────────────────────
(function mobileTests() {
  check('F. LAYOUT', 'grid-2col (used for the Before/During comparison) has a mobile single-column override', /@media\(max-width:600px\)\{\s*\.grid-2col\s*\{\s*grid-template-columns:\s*1fr\s*!important;\s*\}\s*\}/.test(courseSrc));
  check('F. LAYOUT', 'grid-3col (new, minimal 3-column extension of the same grid pattern) renders 3 equal columns on desktop', /\.grid-3col\s*\{\s*display:grid;\s*grid-template-columns:1fr 1fr 1fr;/.test(courseSrc));
  check('F. LAYOUT', 'grid-3col has a mobile single-column override', /@media\(max-width:720px\)\{\s*\.grid-3col\s*\{\s*grid-template-columns:\s*1fr\s*!important;\s*\}\s*\}/.test(courseSrc));
  check('F. LAYOUT', 'the 2.5 communication-concept cards use grid-3col (one horizontal row of 3 on desktop), not the old 2-column concept-grid', /Three concepts make this possible:<\/div>\s*\n\s*<div class="grid-3col">/.test(module2Wrap));
  check('F. LAYOUT', 'the one-at-a-time interaction uses flex-wrap so its two option buttons never force horizontal overflow on narrow screens', module2Wrap.includes('id="m2bdOptions" style="flex-direction:row;flex-wrap:wrap;"'));
})();

// ─────────────────────────────────────────────────────────────────────────
// F2. NO FORWARD REFERENCES TO MODULE 8 (Module 2 comes before it)
// ─────────────────────────────────────────────────────────────────────────
(function noForwardReferenceTests() {
  check('F2. NO FORWARD REF', 'module2Wrap no longer names "Module 8" anywhere (it taught the concepts as its own, not borrowed from a module the student has not reached yet)', !module2Wrap.includes('Module 8'));
})();

// ─────────────────────────────────────────────────────────────────────────
// G. CADENCE MODULE 2 GUIDANCE
// ─────────────────────────────────────────────────────────────────────────
(function cadenceGuidanceTests() {
  const guideSystemsStart = courseSrc.indexOf('const MODULE_GUIDE_SYSTEMS = {');
  const scoped = courseSrc.slice(guideSystemsStart, guideSystemsStart + 6000);
  const guideMatch = scoped.match(/\n {2}2: '[\s\S]*?',\n {2}3: '/);
  check('G. CADENCE', 'MODULE_GUIDE_SYSTEMS[2] is found', !!guideMatch);
  const guideText = guideMatch ? guideMatch[0] : '';
  check('G. CADENCE', 'reinforces the governing principle', /intake determines the plan, preparation removes uncertainty, the service executes the plan/.test(guideText));
  check('G. CADENCE', 'explicitly instructs against teaching repeated permission-asking for standard steps as best practice', /Do not tell a student that best practice is to repeatedly ask permission/.test(guideText));
  check('G. CADENCE', 'distinguishes pre-service expectation-setting from ongoing client responsiveness', /continuing, ongoing ability to communicate, hesitate, or change their mind/.test(guideText));
  check('G. CADENCE', 'still prohibits the nervous-system/subconscious-trust/guaranteed-relaxation claims', /regulates the nervous system, creates subconscious trust, treats stress, or guarantees relaxation/.test(guideText));
})();

// ─────────────────────────────────────────────────────────────────────────
// H. LISTEN MODE SCRIPT — CHECKPOINT STOP DESIGNATED
// ─────────────────────────────────────────────────────────────────────────
(function listenModeScriptTests() {
  check('H. LISTEN MODE SCRIPT', 'module-02-listen-script.md designates m2cp1 as a checkpoint-stop chunk', /gateType: 'checkpoint-stop'/.test(m2ScriptDoc) && /`m2cp1`/.test(m2ScriptDoc));
  check('H. LISTEN MODE SCRIPT', 'the old v1 script/audio is explicitly marked obsolete, not reused', /obsolete/i.test(m2ScriptDoc) && /not reused/i.test(m2ScriptDoc));
  check('H. LISTEN MODE SCRIPT', '"AIMT" is spelled out letter-by-letter for TTS pronunciation', /A-I-M-T/.test(m2ScriptDoc));
  check('H. LISTEN MODE SCRIPT', 'qaStatus is documented as staying GENERATED, never APPROVED, pending the owner\'s CapCut pass', /GENERATED.{0,40}never.{0,10}APPROVED|never `APPROVED`/.test(m2ScriptDoc));
})();

// ─────────────────────────────────────────────────────────────────────────
// I. MODULE 0 — NEW ORIENTATION + NO NEW COMPLETION GATE + m0cp1 PRESERVED
// ─────────────────────────────────────────────────────────────────────────
(function module0Tests() {
  check('I. MODULE 0', 'module0Wrap extracted successfully', !!module0Wrap && module0Wrap.length > 500);
  check('I. MODULE 0', 'the new "Before you begin" orientation block renders, positioned right after the opener and before 0.1', (() => {
    const openerEnd = module0Wrap.indexOf('mo-footer-soon');
    const orientation = module0Wrap.indexOf('Before you begin');
    const section01 = module0Wrap.indexOf('0.1 — Welcome');
    return openerEnd !== -1 && orientation !== -1 && section01 !== -1 && openerEnd < orientation && orientation < section01;
  })());
  check('I. MODULE 0', 'explains manual opt-in / never autoplay', /never starts on its own/.test(module0Wrap));
  check('I. MODULE 0', 'explains pause/resume and leave-and-return', /pause and resume anytime/.test(module0Wrap) && /leave a module and come back/.test(module0Wrap));
  check('I. MODULE 0', 'explains required checkpoints stop listening and must be completed personally', /required checkpoint stops the audio and waits/.test(module0Wrap) && /complete that checkpoint yourself/.test(module0Wrap));
  check('I. MODULE 0', 'explains listening never grants competency or checkpoint credit', /listening never grants competency or checkpoint credit/i.test(module0Wrap));
  check('I. MODULE 0', 'explains Continue Listening appears after an authoritative pass', /Continue Listening becomes available/.test(module0Wrap));
  check('I. MODULE 0', 'explains Listen Again replays from the opening', /Listen Again starts the narration over from the opening|Replay a completed module from the beginning/.test(module0Wrap));
  check('I. MODULE 0', 'all four controls (Resume Listening / Start Over / Continue Listening / Listen Again) are named', ['Resume Listening', 'Start Over', 'Continue Listening', 'Listen Again'].every((c) => module0Wrap.includes(c)));
  check('I. MODULE 0', 'distinguishes Listen with Cadence from Ask Cadence', /Listen with Cadence is the narrated course experience/.test(module0Wrap) && /Ask Cadence is separate/.test(module0Wrap));
  check('I. MODULE 0', 'closes with the required line', module0Wrap.includes('Read, listen, or move between both. The curriculum is the same.'));
  check('I. MODULE 0', 'does not display "Module 0" anywhere in the new orientation text (Welcome Module naming preserved)', !/Before you begin[\s\S]{0,1800}?Module 0(?!Wrap)/.test(module0Wrap.slice(module0Wrap.indexOf('Before you begin'), module0Wrap.indexOf('0.1 — Welcome'))));
  check('I. MODULE 0', 'the module opener title is still "Welcome" (Welcome Module naming preserved)', /<div class="mo-title">Welcome<\/div>/.test(module0Wrap));

  check('I. NO NEW GATE', 'module0Wrap still has exactly one checkpoint (m0cp1) -- the orientation added no new completion gate', (module0Wrap.match(/class="checkpoint" id="/g) || []).length === 1 && module0Wrap.includes('id="m0cp1"'));
  check('I. NO NEW GATE', 'MODULE_CHECKPOINTS still lists exactly one checkpoint for module 0: m0cp1', /'0': \['m0cp1'\]/.test(courseSrc));
  check('I. NO NEW GATE', 'm0Complete completion card is still the only completion element', (module0Wrap.match(/class="lesson-complete" id="/g) || []).length === 1 && module0Wrap.includes('id="m0Complete"'));

  check('I. NARRATION UPDATED', 'module-00-listen-script.md includes a new chunk for the orientation content', /M0-01b/.test(m0ScriptDoc) && /Before you begin/.test(m0ScriptDoc));
  check('I. NARRATION UPDATED', 'only piece A1 is documented as regenerated; A2-B1 documented as untouched (safe partial replacement, not a full regen)', /A1 \(v2 — regenerated this pass\)/.test(m0ScriptDoc) && (m0ScriptDoc.match(/\(untouched, still v1\)/g) || []).length === 4);
  check('I. NARRATION UPDATED', '"AIMT" is spelled out letter-by-letter in the updated piece', /A-I-M-T/.test(m0ScriptDoc));
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
