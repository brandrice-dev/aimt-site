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
// The "Before you begin" Listen Mode orientation this file originally added
// to module0Wrap (commit 817d3f5) was deliberately relocated out of Module 0
// into its own one-time pre-Welcome view by commit 2a56bf5 ("Add How AIMT
// Works course orientation" -- "Moves the redundant Listen Mode explainer
// out of Module 0 into the new page") and expanded into a full platform
// walkthrough by 7314f5a/3a668d7/2d42c72/c76dfa8. See section I2 below.
const howAimtWorksWrap = extractWrap(courseSrc, 'howAimtWorksView');

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
  // The static `.cp-q` question div this assertion originally checked was
  // retired course-wide (all 22 checkpoints, not just Module 2) by the
  // later "Cadence Check" redesign (commit 6b36a58, "Finalize Module 8
  // timer and Cadence Check flow") -- verified via grep: zero
  // `class="cp-q"` occurrences remain anywhere in headspa-mastery.html.
  // The full question is no longer pre-rendered as page text at all;
  // cadence-shell.js now opens every checkpoint by appending that exact
  // same question as Cadence's own first chat message
  // (appendMessageEl('assistant', session.question)), and grades against
  // that same session.question -- so displayed/evaluated parity (this
  // check's original protective intent) is preserved through the new
  // mechanism instead of the retired static div.
  const cadenceShellSrc = readFileSync(path.join(ROOT, 'assets/js/cadence-shell.js'), 'utf8');
  check('D. CHECKPOINT', 'the retired .cp-q display is gone course-wide (not a Module-2-specific regression), and the Cadence Check chat flow still opens every checkpoint with the exact question text it grades against (displayed/evaluated parity preserved through the new mechanism)',
    !courseSrc.includes('class="cp-q"') && /appendMessageEl\('assistant', session\.question\)/.test(cadenceShellSrc));
  check('D. CHECKPOINT', 'M2.questions.m2cp1 matches the same new question exactly (displayed/evaluated parity)', m2ObjectMatch[0].includes(newQuestion));
  check('D. CHECKPOINT', 'checkpoint id m2cp1 is unchanged (element id, submit handler, key binding)', module2Wrap.includes('id="m2cp1"') && module2Wrap.includes("submitM2CP('m2cp1')") && module2Wrap.includes("m2cpKey(event,'m2cp1')"));
  check('D. CHECKPOINT', 'MODULE_CHECKPOINTS still lists exactly one checkpoint for module 2: m2cp1 (persistence/gating keys unchanged)', /'2': \['m2cp1'\]/.test(courseSrc));
  check('D. CHECKPOINT', 'submitM2CP still dispatches through the shared submitCheckpoint(2, id, ...) pattern (previously-passed state preservation depends on this key structure never changing)', /function submitM2CP\(id\) \{\s*\n\s*submitCheckpoint\(2, id, M2\.systems\[id\], M2\.questions\[id\]/.test(courseSrc));
  check('D. CHECKPOINT', 'Module 3 unlock is unchanged: completion card still opens Module 3', module2Wrap.includes('onclick="openModuleById(3)"'));
})();

// ─────────────────────────────────────────────────────────────────────────
// D2. COMPLETION CARD — MATCHES THE CANONICAL COURSE-WIDE STANDARD, NO
// MODULE-2-SPECIFIC RECAP TREATMENT OF ANY KIND. This section intentionally
// stays light: the detailed cross-module structural contract (exactly one
// .lc-check/.lc-title/.lc-body/.lc-next, no .lc-gold/.lc-sub/.lc-recap
// anywhere) is owned and enforced by tests/course-wide-completion-cards.test.mjs
// for every module, 0-11; this just confirms Module 2 specifically carries
// no leftover special-case recap design from its own rebuild history.
// ─────────────────────────────────────────────────────────────────────────
(function completionCardTests() {
  check('D2. COMPLETION', 'there is no standalone white "Module recap" section (sec-eyebrow/sec-title) outside the black completion card', !/class="sec-eyebrow"[^>]*>Module recap</.test(module2Wrap) && !/class="sec-title"[^>]*>[^<]*Module recap/.test(module2Wrap));
  const completeMatch = module2Wrap.match(/<div class="lesson-complete" id="m2Complete"[\s\S]*?\n {4}<\/div>/);
  check('D2. COMPLETION', 'the m2Complete card is found', !!completeMatch);
  const completeHtml = completeMatch ? completeMatch[0] : '';
  check('D2. COMPLETION', 'uses .lc-check + checkmark icon, not a custom icon treatment', /<div class="lc-check">✓<\/div>/.test(completeHtml));
  check('D2. COMPLETION', 'title is the standard literal "Module complete." -- not a custom serif headline', /<div class="lc-title">Module complete\.<\/div>/.test(completeHtml));
  check('D2. COMPLETION', 'competency statement uses .lc-body (the class Modules 7-11 use), not .lc-sub', /<div class="lc-body">/.test(completeHtml));
  check('D2. COMPLETION', 'no .lc-recap of any kind remains -- Module 2 no longer has a special-case recap treatment', !completeHtml.includes('lc-recap'));
  check('D2. COMPLETION', 'the .lc-body still captures the module\'s core doctrine in one concise statement (intake/uncertainty/plan/quiet)', /intake/i.test(completeHtml) && /uncertainty/i.test(completeHtml) && /service plan/i.test(completeHtml));
  const m8CompleteHtml = extractWrap(courseSrc, 'module8Wrap') || '';
  check('D2. COMPLETION', 'Module 8 (a dominant-pattern module) also uses .lc-check + "Module complete." + .lc-body -- confirms m2Complete matches the real course standard, not just one other module', /<div class="lc-check">✓<\/div>\s*\n\s*<div class="lc-title">Module complete\.<\/div>\s*\n\s*<div class="lc-body">/.test(m8CompleteHtml));
})();

// ─────────────────────────────────────────────────────────────────────────
// D3. UNCERTAINTY CARD + BEFORE/DURING COMPARISON — REUSED CARD PATTERNS,
// NOT A LOOSE PARAGRAPH OR TWO DISCONNECTED BOXES
// ─────────────────────────────────────────────────────────────────────────
(function referenceCardTests() {
  check('D3. UNCERTAINTY CARD', 'the 10-item list is a single .info-card (one contained card, not ten separate cards)', (module2Wrap.match(/Relaxation begins with certainty\.[\s\S]{0,250}<div class="info-card">/) || []).length === 1);
  check('D3. UNCERTAINTY CARD', 'uses the new .ref-list divider-list component (a light-theme sibling of the opener\'s own .mo-list pattern), not a <br>-separated paragraph', (module2Wrap.match(/<ul class="ref-list">/g) || []).length >= 2);
  check('D3. UNCERTAINTY CARD', 'splits into a balanced two-column layout on desktop via the existing .grid-2col primitive', /Relaxation begins with certainty\.[\s\S]{0,400}<div class="grid-2col"/.test(module2Wrap));
  check('D3. UNCERTAINTY CARD', 'all 10 original items are still present (no content dropped), just restructured', ['What they should change into', 'What they may leave on', 'Where their belongings go', 'How they will remain appropriately covered', 'Where to go or wait once ready', 'Whether you return or meet them elsewhere', "What happens right after they're ready", 'The general shape of the appointment', 'Roughly how the service will flow', 'How to communicate a needed change'].every((item) => module2Wrap.includes(item)));

  check('D3. COMPARISON', 'the before/during comparison is now ONE outer .info-card with two internal columns, not two separate .info-cards', !/<div class="grid-2col">\s*\n\s*<div class="info-card"/.test(module2Wrap));
  check('D3. COMPARISON', 'both column labels are present inside that one card', /Establish before service vs\. during service|Establish before service/.test(module2Wrap) && module2Wrap.includes('Manage during service'));
  check('D3. COMPARISON', 'both columns use the tightened copy (no orphan-prone long phrasing like "Fragrance tolerance / fragrance-free plan")', !module2Wrap.includes('Fragrance tolerance / fragrance-free plan') && module2Wrap.includes('Fragrance plan'));
  check('D3. COMPARISON', 'the during-service column includes the changed-preference item using the tightened wording', module2Wrap.includes('Changed preference or new information'));
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
  // The reset hook used to be checked via an exact-string match on the
  // whole STATIC_MODULES[2] loader body, anchored right after
  // "m2BdReset();". That broke once the course-wide Listen Mode rollout
  // (a separate, later, authorized task) appended an additive
  // AIMTListenMode.mount() call to every module's loader, including this
  // one. Isolate module 2's loader body specifically (between its own key
  // and module 4's) and verify the real invariants directly instead of
  // pinning the whole function's source text.
  const staticModulesMatch = courseSrc.match(/const STATIC_MODULES = \{[\s\S]*?\n  \};/);
  const staticModulesSrc = staticModulesMatch ? staticModulesMatch[0] : '';
  const m2LoaderStart = staticModulesSrc.indexOf('2: () =>');
  const m4LoaderStart = staticModulesSrc.indexOf('4: () =>');
  const m2Loader = (m2LoaderStart !== -1 && m4LoaderStart !== -1 && m4LoaderStart > m2LoaderStart) ? staticModulesSrc.slice(m2LoaderStart, m4LoaderStart) : '';
  check('E. INTERACTION', "Module 2's STATIC_MODULES loader was isolated for targeted checks (between its own key and module 4's)", m2Loader.length > 0);

  const innerHTMLIdx = m2Loader.indexOf("wrap.innerHTML = w.innerHTML;");
  const resetIdx = m2Loader.indexOf('m2BdReset();');
  const mountIdx = m2Loader.search(/if \(window\.AIMTListenMode\) window\.AIMTListenMode\.mount\(\{[^}]*moduleId: 2,/);
  check('E. INTERACTION', 'm2BdReset() is still called on every Module 2 visit (so each visit starts at item 1)', resetIdx !== -1);
  check('E. INTERACTION', "Listen Mode mount for Module 2 is additive -- AIMTListenMode.mount() is called, guarded by a window.AIMTListenMode existence check, not substituted for the reset call", mountIdx !== -1);
  check('E. INTERACTION', 'reset behavior was not reordered incorrectly: content is swapped into the DOM, THEN m2BdReset() re-renders into it (m2BdReset -> m2BdRender reads live #m2bdOptions markup, which only exists after the swap), and the mount call comes after both, not between them', innerHTMLIdx !== -1 && resetIdx !== -1 && mountIdx !== -1 && innerHTMLIdx < resetIdx && resetIdx < mountIdx);
  check('E. INTERACTION', 'the two option buttons carry aria-pressed for accessibility', (module2Wrap.match(/aria-pressed="false" onclick="m2BdAnswer/g) || []).length === 2);
  check('E. INTERACTION', 'the feedback region is aria-live for accessibility', module2Wrap.includes('id="m2bdFeedback" style="display:none;" aria-live="polite"'));
  check('E. INTERACTION', 'the old scent-script-builder UI entry point is gone from module2Wrap (evaluateScript() is retired, not deleted -- see its own comment)', !module2Wrap.includes('onclick="evaluateScript()"'));
  check('E. INTERACTION', 'the old arrival-sequence accordion is gone from module2Wrap', !module2Wrap.includes('class="timeline-wrap"') && !/onclick="openStep\(/.test(module2Wrap));
  check('E. INTERACTION', 'the old "what breaks the moment?" quiz is gone from module2Wrap', !module2Wrap.includes('id="breakQuiz"'));

  check('E. SHELL', 'the interaction now has a real contained shell -- the established .m2-judgment component (course-wide Cadence Check presentation recovery), not a bare .m5-decision-block sitting directly on the page', /<div class="m2-judgment" id="m2bdQuiz">/.test(module2Wrap) && !module2Wrap.includes('class="m5-decision-block" id="m2bdQuiz"'));
  check('E. SHELL', 'the progress indicator uses a compact "01 / 06" mono-numeral treatment', /String\(m2BdIndex \+ 1\)\.padStart\(2, '0'\) \+ ' \/ ' \+ String\(M2_BD_ITEMS\.length\)\.padStart\(2, '0'\)/.test(courseSrc));
  check('E. SHELL', 'the progress indicator uses the existing mono font token (.m2j-eyebrow, same treatment as .rst-num elsewhere)', module2Wrap.includes('class="m2j-eyebrow"') && /\.m2j-eyebrow \{ font-family: var\(--aimt-font-mono\)/.test(courseSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// F. MOBILE OVERFLOW + DESKTOP LAYOUT (reused/extended generic components)
// ─────────────────────────────────────────────────────────────────────────
(function mobileTests() {
  check('F. LAYOUT', 'grid-2col (used for the Before/During comparison) has a mobile single-column override', /@media\(max-width:600px\)\{\s*\.grid-2col\s*\{\s*grid-template-columns:\s*1fr\s*!important;\s*\}\s*\}/.test(courseSrc));
  check('F. LAYOUT', 'grid-3col (new, minimal 3-column extension of the same grid pattern) renders 3 equal columns on desktop', /\.grid-3col\s*\{\s*display:grid;\s*grid-template-columns:1fr 1fr 1fr;/.test(courseSrc));
  check('F. LAYOUT', 'grid-3col has a mobile single-column override', /@media\(max-width:720px\)\{\s*\.grid-3col\s*\{\s*grid-template-columns:\s*1fr\s*!important;\s*\}\s*\}/.test(courseSrc));
  check('F. LAYOUT', 'the 2.5 communication-concept cards use grid-3col (one horizontal row of 3 on desktop), not the old 2-column concept-grid', /Three concepts make this possible:<\/div>\s*\n\s*<div class="grid-3col">/.test(module2Wrap));
  check('F. LAYOUT', 'the one-at-a-time interaction\'s two option buttons never force horizontal overflow on narrow screens (.m2j-choices grid, single column under 480px -- course-wide Cadence Check presentation recovery)', module2Wrap.includes('class="bq-options m2j-choices" id="m2bdOptions"') && /@media \(max-width: 480px\) \{ #m2bdQuiz \.m2j-choices \{ grid-template-columns: 1fr; \} \}/.test(courseSrc));
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

  check('I. MODULE 0', 'does not display "Module 0" anywhere in the new orientation text (Welcome Module naming preserved)', !/Before you begin[\s\S]{0,1800}?Module 0(?!Wrap)/.test(module0Wrap.slice(module0Wrap.indexOf('Before you begin'), module0Wrap.indexOf('0.1 — Welcome'))));
  check('I. MODULE 0', 'the module opener title is still "Welcome" (Welcome Module naming preserved)', /<div class="mo-title">Welcome<\/div>/.test(module0Wrap));
})();

// ─────────────────────────────────────────────────────────────────────────
// I2. ORIENTATION (How AIMT Works) — the 8 of the original 10 "Before you
// begin" assertions that were stale DOM-shape checks, not real regressions:
// the content they protect is still live, just relocated + reworded by the
// already-shipped "How AIMT Works" redesign (commits 2a56bf5 / 7314f5a /
// 3a668d7 / 2d42c72 / c76dfa8), one-time-routed before the Welcome Module
// instead of being a permanent block inside module0Wrap. Re-targeted at
// #howAimtWorksView's current copy, same protective intent as each original
// check, not weakened. See docs/course-audit/AIMT-ORIENTATION-TEST-
// DECISION.md for the full per-assertion trace.
// ─────────────────────────────────────────────────────────────────────────
(function orientationTests() {
  check('I2. ORIENTATION (How AIMT Works)', 'howAimtWorksWrap extracted successfully', !!howAimtWorksWrap && howAimtWorksWrap.length > 500);

  check('I2. ORIENTATION (How AIMT Works)', 'the orientation is a dedicated one-time view that renders before the Welcome Module (view routing replaces the old same-wrap DOM position: completeOrientationAndEnterWelcome() persists orientationComplete then opens Module 0 directly), and module0Wrap no longer duplicates the orientation copy', (() => {
    const eyebrowIdx = howAimtWorksWrap.indexOf('Before you begin');
    const ctaIdx = howAimtWorksWrap.indexOf('completeOrientationAndEnterWelcome()');
    const routesIntoWelcome = /function completeOrientationAndEnterWelcome\(\) \{\s*APP_STATE\.setStudent\(\{ orientationComplete: true \}\);\s*openModuleById\(0\);/.test(courseSrc);
    return eyebrowIdx !== -1 && ctaIdx !== -1 && eyebrowIdx < ctaIdx && routesIntoWelcome && module0Wrap.indexOf('Before you begin') === -1;
  })());

  check('I2. ORIENTATION (How AIMT Works)', 'explains pause/resume and leave-and-return: the player\'s own Play/Pause control plus the persisted "Resume Listening" state (picks up right where you left off) cover the same guarantee the retired copy stated in different words', /Play \/ Pause<\/div><div class="cc-def">Start or stop the narration\./.test(howAimtWorksWrap) && /Resume Listening<\/strong> and picks up right where you left off/.test(howAimtWorksWrap));

  check('I2. ORIENTATION (How AIMT Works)', 'explains a required Cadence Check stops the narration and must be completed personally (course-wide "checkpoint" -> "Cadence Check" terminology -- see this file\'s own D. CHECKPOINT section for the same rename)', /it pauses and waits\. Complete the check yourself, in your own words/.test(howAimtWorksWrap));

  check('I2. ORIENTATION (How AIMT Works)', 'explains listening alone never grants competency credit', /Listening alone never passes a competency check/.test(howAimtWorksWrap));

  check('I2. ORIENTATION (How AIMT Works)', 'explains Continue Listening appears once the check is passed', /once you pass, <strong>Continue Listening<\/strong> appears/.test(howAimtWorksWrap));

  check('I2. ORIENTATION (How AIMT Works)', 'explains Listen Again restarts a completed module\'s narration from the beginning', /Listen Again starts that module's narration over from the beginning/.test(howAimtWorksWrap));

  check('I2. ORIENTATION (How AIMT Works)', 'all four controls are still named in the current live copy (Start Over now reads as the icon-button label "Start over", same restart-from-beginning control, not a dropped control)', ['Resume Listening', 'Continue Listening', 'Listen Again'].every((c) => howAimtWorksWrap.includes(c)) && /Start over<\/div><div class="cc-def">Restart this module's narration from the beginning\./.test(howAimtWorksWrap));

  check('I2. ORIENTATION (How AIMT Works)', 'distinguishes Listen with Cadence (section 02) from Ask Cadence (section 03, explicitly "optional and ... never graded") -- same distinction as before, no longer phrased as "X is separate"', /02 — Read or listen with Cadence/.test(howAimtWorksWrap) && /03 — Cadence is with you throughout AIMT/.test(howAimtWorksWrap) && /Ask Cadence is optional and is never graded/.test(howAimtWorksWrap));

  // These two were genuine content gaps (not stale DOM-shape checks) as of
  // docs/course-audit/AIMT-ORIENTATION-TEST-DECISION.md -- the reassurance
  // each one checks for did not exist anywhere in the live page. Restored
  // in howAimtWorksWrap (section 02 for the opt-in/autoplay line, the
  // closing copy before the CTA for the parity line) and retargeted here
  // from module0Wrap, where this content never lived even before the
  // 2a56bf5 "How AIMT Works" relocation -- it belongs with the other 8
  // orientation checks above, not in I. MODULE 0.
  check('I2. ORIENTATION (How AIMT Works)', 'explains manual opt-in / never autoplay', /never starts on its own/.test(howAimtWorksWrap));
  check('I2. ORIENTATION (How AIMT Works)', 'closes with the required parity line', howAimtWorksWrap.includes('Read, listen, or move between both. The curriculum is the same.'));
})();

(function noNewGateAndNarrationTests() {
  check('I. NO NEW GATE', 'module0Wrap still has exactly one checkpoint (m0cp1) -- the orientation added no new completion gate', (module0Wrap.match(/class="checkpoint(?: cc-card)?" id="/g) || []).length === 1 && module0Wrap.includes('id="m0cp1"'));
  check('I. NO NEW GATE', 'MODULE_CHECKPOINTS still lists exactly one checkpoint for module 0: m0cp1', /'0': \['m0cp1'\]/.test(courseSrc));
  check('I. NO NEW GATE', 'm0Complete completion card is still the only completion element', (module0Wrap.match(/class="lesson-complete" id="/g) || []).length === 1 && module0Wrap.includes('id="m0Complete"'));

  // Corrected 2026-09-17: the module-00-listen-script.md v1 draft this
  // fixture originally checked against added a new M0-01b chunk to narrate
  // the (then-live) "Before you begin" orientation block. That block was
  // since relocated out of #module0Wrap entirely into #howAimtWorksView
  // (see the I2 fixture above), so a strict-fidelity rebuild of Module 0's
  // narration correctly REMOVES M0-01b rather than keeping it -- the
  // opposite of what this fixture originally verified. Re-targeted at the
  // real v2 rebuild's actual properties: M0-01b is documented as
  // intentionally dropped (not silently missing), it's a full rebuild (not
  // the old partial A1-only patch), and "AIMT" uses the current locked
  // space-separated TTS convention, not the retired hyphenated one.
  check('I. NARRATION UPDATED', 'module-00-listen-script.md documents M0-01b as intentionally removed (orientation content relocated to #howAimtWorksView, not narrated here)', /M0-01b/.test(m0ScriptDoc) && /dropped/i.test(m0ScriptDoc) && /howAimtWorksView/.test(m0ScriptDoc));
  check('I. NARRATION UPDATED', 'documented as a full v2 strict-fidelity rebuild, not a partial single-piece patch', /v2, strict-fidelity rebuild/.test(m0ScriptDoc));
  check('I. NARRATION UPDATED', '"AIMT" is spelled out letter-by-letter using the current space-separated TTS convention ("A I M T", not hyphenated)', /A I M T/.test(m0ScriptDoc));
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
