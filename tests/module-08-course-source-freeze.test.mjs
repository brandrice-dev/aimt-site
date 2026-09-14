// Module 8 course-source-freeze pass — regression tests.
// See docs/course-audit/listen-mode/module-08-listen-script.md ("v3
// update") and docs/course-audit/modules/module-08-source.md.
//
// Covers the five changes made in this pass:
//  1. Module 8 masterclass chapter template: teaching content (guidance/
//     why/teach/adapt/notes) now precedes each chapter's video; "Watch
//     for" sits immediately before the video; only chapter-completion nav
//     and a one-line "what's next" remain after it. Chapter 1/9 titles
//     and Vimeo IDs are unchanged.
//  2. AIMT Service Timer (aimt-service-timer.html) + its in-page preview
//     (M8_TIMER_PREVIEW_STEPS): Step 01 renamed from the stale
//     "Aromatherapy" identity to "Opening Rituals + Microscopy",
//     reconciled to cover microscopy + first touch, Core/Extended timing
//     unchanged (60/90 min).
//  3. Module 8 Listen Mode source (module-08-listen-script.md): Chapter
//     9's narration paragraph reconciled to the real, expanded
//     M8_CHAPTERS[8] close (was still narrating the pre-04faf79 version).
//  4. Cadence shell header-collision fix (assets/js/cadence-shell.js):
//     the shell's top-clearance offset now accounts for the lesson page's
//     own sticky header, not just the review-mode banner.
//  5. AIMT instructional-callout icon: the Module 8 "Adapt" callout used a
//     stray "→" instead of the canonical AIMT orbital mark every other
//     plain .key-point callout on the page uses.
//
// Run: node tests/module-08-course-source-freeze.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

const html = readFileSync(path.join(ROOT, 'headspa-mastery.html'), 'utf8');
const timerHtml = readFileSync(path.join(ROOT, 'aimt-service-timer.html'), 'utf8');
const shellSrc = readFileSync(path.join(ROOT, 'assets/js/cadence-shell.js'), 'utf8');
const listenScript = readFileSync(path.join(ROOT, 'docs/course-audit/listen-mode/module-08-listen-script.md'), 'utf8');

// Isolate the #m8Masterclass template block for structural (DOM-order)
// assertions, rather than matching against the whole 1MB file.
const masterclassMatch = html.match(/<div class="m8-masterclass" id="m8Masterclass">[\s\S]*?<div class="m8mc-review-hint"/);
const masterclassBlock = masterclassMatch ? masterclassMatch[0] : '';

// ─────────────────────────────────────────────────────────────────────────
// 1. MODULE 8 CHAPTER FLOW — teach-first architecture
// ─────────────────────────────────────────────────────────────────────────
(function chapterFlowStructure() {
  check('CHAPTER FLOW', '#m8Masterclass template block was found (structural assertions below are meaningful)', masterclassBlock.length > 0);

  const order = ['id="m8mcGuidance"', 'id="m8mcWhy"', 'id="m8mcTeach"', 'id="m8mcAdapt"', 'id="m8mcNotes"', 'id="m8mcWatchFor"', 'class="m8-video-stage"', 'id="m8mcContinuity"', 'class="m8mc-nav"'];
  const positions = order.map((needle) => masterclassBlock.indexOf(needle));
  const allFound = positions.every((p) => p !== -1);
  check('CHAPTER FLOW', 'All expected chapter sections exist in the template', allFound, allFound ? '' : JSON.stringify(order.filter((_, i) => positions[i] === -1)));
  const inOrder = allFound && positions.every((p, i) => i === 0 || p > positions[i - 1]);
  check('CHAPTER FLOW', 'DOM order is guidance -> why -> teach -> adapt -> notes -> watchFor -> video -> continuity -> nav (teaching before video, only completion/nav after it)', inOrder, inOrder ? '' : JSON.stringify(positions));

  check('CHAPTER FLOW', 'Watch-for copy frames itself as a viewing lens for the demonstration, not a chapter opener', /Watch for in the demonstration:/.test(html));
  check('CHAPTER FLOW', 'Adapt/Notes sections are only labeled when they have content (no manufactured empty headers)', /ch\.adapt && ch\.adapt\.length\)/.test(html) && /ch\.notes && ch\.notes\.length\)/.test(html));
  check('CHAPTER FLOW', 'The one-line "what\'s next" continuity note is populated separately from Notes (moved out from under the old bundled append)', /document\.getElementById\('m8mcContinuity'\)\.textContent = 'Next: ' \+ ch\.continuity;/.test(html));

  // Next/Previous chapter both route through the same m8GoToChapter(), so
  // this one fix covers both directions.
  check('CHAPTER FLOW', 'Next/Previous chapter both call the same m8GoToChapter()', /onclick="m8GoToChapter\(m8ActiveChapter - 1\)"/.test(html) && /onclick="m8GoToChapter\(m8ActiveChapter \+ 1\)"/.test(html));
  check('CHAPTER FLOW', 'm8GoToChapter() scrolls #m8Masterclass to its top on every chapter change', /mc\.scrollIntoView\(\{ behavior: 'smooth', block: 'start' \}\);/.test(html));
  check('CHAPTER FLOW', '#m8Masterclass reserves scroll-margin-top for the sticky .lesson-nav header (--nav-h), so scrollIntoView(start) does not land the new chapter title underneath it', /scroll-margin-top:\s*calc\(var\(--nav-h\)\s*\+\s*14px\);/.test(html));
  check('CHAPTER FLOW', 'Chapter navigation moves a11y focus to the new chapter heading without forcing a second scroll (preventScroll)', /headEl\.focus\(\{ preventScroll: true \}\);/.test(html));

  // Video-completion/gating architecture untouched by the reorder.
  check('CHAPTER FLOW (GATING UNCHANGED)', 'm8ChapterReachable() still gates on APP_STATE.isVideoChapterUnlocked / Review Mode, unchanged', /function m8ChapterReachable\(idx\) \{/.test(html) && /APP_STATE\.isVideoChapterUnlocked\(8, idx\)/.test(html));
  check('CHAPTER FLOW (GATING UNCHANGED)', 'Real completion still comes from the installed Vimeo player\'s genuine "ended" event (markVideoChapterEnded), not the reorder', /markVideoChapterEnded/.test(html));
  check('CHAPTER FLOW (GATING UNCHANGED)', 'All 9 STEP_VIDEO_IDS are still real (non-null) Vimeo ids', (() => {
    const m = html.match(/const STEP_VIDEO_IDS = \[([\s\S]*?)\];/);
    if (!m) return false;
    const ids = [...m[1].matchAll(/'(\d+)'/g)].map((x) => x[1]);
    return ids.length === 9 && ids.every((id) => /^\d+$/.test(id));
  })());
})();

// ─────────────────────────────────────────────────────────────────────────
// 2. CHAPTER 1 / CHAPTER 9 — final authority preserved
// ─────────────────────────────────────────────────────────────────────────
(function chapterOneNineAuthority() {
  const m8ChaptersMatch = html.match(/const M8_CHAPTERS = \[[\s\S]*?\n\];/);
  const chaptersSrc = m8ChaptersMatch ? m8ChaptersMatch[0] : '';
  check('CH1/CH9 AUTHORITY', 'M8_CHAPTERS array was found', chaptersSrc.length > 0);
  check('CH1/CH9 AUTHORITY', "Chapter 1 title is exactly 'Opening Rituals + Microscopy'", /num:'01', title:'Opening Rituals \+ Microscopy'/.test(chaptersSrc));
  check('CH1/CH9 AUTHORITY', "Chapter 9 title is exactly 'Final Rinse + Halo Massage' (unchanged)", /num:'09', title:'Final Rinse \+ Halo Massage'/.test(chaptersSrc));
  check('CH1/CH9 AUTHORITY', "Chapter 1's video is STEP_VIDEO_IDS[0] = 1226438466", /'1226438466',\s*\/\/ Video 01/.test(html));
  check('CH1/CH9 AUTHORITY', "Chapter 9's video is STEP_VIDEO_IDS[8] = 1214960268 (unchanged)", /'1214960268'\s*\/\/ Video 09/.test(html));
  check('CH1/CH9 AUTHORITY', "Chapter 9's reconciled close content (comb=stimulation, ice-water re-greet, microscope reveal) is still present, untouched by the layout reorder", /for stimulation only — not detangling/.test(chaptersSrc) && /glass of ice water/.test(chaptersSrc) && /revisit the microscope/.test(chaptersSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// 3. SERVICE TIMER — Opening Rituals + Microscopy reconciliation
// ─────────────────────────────────────────────────────────────────────────
(function serviceTimer() {
  check('SERVICE TIMER', "Standalone timer's Step 01 title is 'Opening Rituals + Microscopy'", /title:'Opening Rituals \+ Microscopy'/.test(timerHtml));
  check('SERVICE TIMER', 'Standalone timer no longer identifies Step 01 as bare "Aromatherapy" (stale full-step identity is gone)', !/title:'Aromatherapy'/.test(timerHtml) && !/Step 01 Aromatherapy/.test(timerHtml));
  check('SERVICE TIMER', 'Step 01 copy mentions scalp microscopy', /microscopy/.test(timerHtml));
  check('SERVICE TIMER', 'Step 01 copy still mentions aromatherapy (technique preserved, not removed — only its stand-alone step identity changed)', /aromatherapy/i.test(timerHtml.match(/const PRE_TIMER_STEPS = \[[\s\S]*?\n\];/)[0]));
  check('SERVICE TIMER', 'Step 01 copy references the intentional shoulder first-touch', /shoulder/.test(timerHtml.match(/const PRE_TIMER_STEPS = \[[\s\S]*?\n\];/)[0]));
  check('SERVICE TIMER', 'Pacing note ("Before the clock") reconciled to the new Step 01 identity', /Opening Rituals \+ Microscopy and Client Positioning \+ Comfort are part of the protocol/.test(timerHtml));
  check('SERVICE TIMER', 'Core protocol is still exactly 60 minutes', /core:\{[\s\S]*?totalSeconds:60\*60,/.test(timerHtml));
  check('SERVICE TIMER', 'Extended protocol is still exactly 90 minutes', /extended:\{[\s\S]*?totalSeconds:90\*60,/.test(timerHtml));

  // The in-page embedded preview (M8_TIMER_PREVIEW_STEPS) is a *separate*
  // teaser widget inside headspa-mastery.html itself — must be reconciled
  // too, since it's independently-authored, active student-facing copy.
  const previewMatch = html.match(/const M8_TIMER_PREVIEW_STEPS = \[[\s\S]*?\n\];/);
  const previewSrc = previewMatch ? previewMatch[0] : '';
  check('SERVICE TIMER (IN-PAGE PREVIEW)', 'M8_TIMER_PREVIEW_STEPS was found', previewSrc.length > 0);
  check('SERVICE TIMER (IN-PAGE PREVIEW)', "Step 01 title is 'Opening Rituals + Microscopy', not bare 'Aromatherapy'", /num:'01', title:'Opening Rituals \+ Microscopy'/.test(previewSrc) && !/title:'Aromatherapy'/.test(previewSrc));
  check('SERVICE TIMER (IN-PAGE PREVIEW)', 'Step 01 desc mentions microscopy', /microscopy/i.test(previewSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// 4. MODULE 8 LISTEN MODE SOURCE — Chapter 9 realignment
// ─────────────────────────────────────────────────────────────────────────
(function listenSource() {
  check('LISTEN SOURCE', "Chapter 1's final title is referenced correctly", /Chapter one, Opening Rituals and Microscopy/.test(listenScript));
  check('LISTEN SOURCE', "Chapter 9's title is referenced correctly and unchanged", /chapter nine, Final Rinse and Halo Massage/.test(listenScript));

  const requiredConcepts = [
    /stimulation, not detangling/,      // comb = scalp stimulation, not detangling
    /Temperature gets checked/,          // temperature checks
    /gradual release/,                   // Halo massage as gradual release
    /slow, broad neck-and-shoulder massage with steady contact/, // slow/broad/steady contact
    /water goes fully off/,              // Halo shutoff
    /never both/,                        // cooling OR towel, never both mandatory
    /gently squeeze — never rub/,        // gently squeeze, never rub
    /wrap it loosely to one side/,       // loose side wrap
    /Let the client know before the mask comes off/, // eye-mask cue
    /step out so they can dress in privacy/, // privacy handoff / practitioner exits
    /glass of ice water/,                // ice-water re-greet
    /second look through the microscope/, // microscope reveal
    /controlled blow-dry/,               // controlled airflow/moderate-heat blow-dry
    /closing observation specific to what you actually addressed/, // final observations
  ];
  const missing = requiredConcepts.filter((re) => !re.test(listenScript));
  check('LISTEN SOURCE', "Chapter 9's narration includes every required close concept from the freeze-pass brief", missing.length === 0, missing.length ? 'Missing: ' + missing.map((r) => r.source).join(' | ') : '');

  check('LISTEN SOURCE', 'The stale pre-04faf79 Chapter 9 paragraph (cooling spray treated as a near-default step) is gone', !/it's worth preparing the client for that shift rather than offering to skip it mid-service/.test(listenScript));
  check('LISTEN SOURCE', 'A synchronization note records the new teaching -> Watch for -> video handoff -> next-chapter rule for future full per-chapter narration', /## Video handoff \/ chapter-reorder synchronization note/.test(listenScript) && /video itself stays non-narrated/.test(listenScript));
})();

// ─────────────────────────────────────────────────────────────────────────
// 5. CADENCE SHELL — header-collision fix
// ─────────────────────────────────────────────────────────────────────────
(function cadenceShellHeaderFix() {
  check('CADENCE SHELL', 'getLessonHeaderOffsetTop() exists and measures #lessonView .lesson-nav live', /function getLessonHeaderOffsetTop\(\)/.test(shellSrc) && /document\.querySelector\('#lessonView \.lesson-nav'\)/.test(shellSrc));
  check('CADENCE SHELL', 'getPageChromeOffsetTop() now sums the review banner AND the lesson header (previously banner only)', /function getPageChromeOffsetTop\(\) \{\s*\n\s*return getReviewBannerOffsetTop\(\) \+ getLessonHeaderOffsetTop\(\);/.test(shellSrc));

  // Functional check, not just a regex match: extract the three offset
  // functions and actually execute them against a minimal mocked DOM, for
  // both "no lesson header present" and "lesson header present" cases —
  // this is the real behavior the collision bug hinged on.
  const fnBlockMatch = shellSrc.match(/function getReviewBannerOffsetTop\(\)[\s\S]*?function getPageChromeOffsetTop\(\) \{[\s\S]*?\n  \}/);
  check('CADENCE SHELL', 'Could extract the three offset functions for functional testing', !!fnBlockMatch);

  if (fnBlockMatch) {
    function runWithMockDom({ bannerEl, navEl }) {
      const sandbox = {
        document: {
          getElementById(id) { return id === 'reviewModeBanner' ? bannerEl : null; },
          querySelector(sel) { return sel === '#lessonView .lesson-nav' ? navEl : null; },
        },
        getComputedStyle(el) { return el && el.computedStyle ? el.computedStyle : { display: 'block' }; },
        result: undefined,
      };
      vm.createContext(sandbox);
      vm.runInContext(fnBlockMatch[0] + '\nresult = getPageChromeOffsetTop();', sandbox, { filename: 'cadence-shell-offset-fns.js' });
      return sandbox.result;
    }

    check('CADENCE SHELL', 'No banner, no lesson header -> offset is 0 (e.g. Module 12, outside the lesson view)', runWithMockDom({ bannerEl: null, navEl: null }) === 0);

    const navOnly = runWithMockDom({
      bannerEl: null,
      navEl: { getBoundingClientRect: () => ({ height: 56 }) },
    });
    check('CADENCE SHELL', 'Lesson header present (production, no review banner) -> offset equals the header\'s own measured height (this is the actual collision-bug fix: previously always 0 here)', navOnly === 56, 'got ' + navOnly);

    const bannerOnly = runWithMockDom({
      bannerEl: { classList: { contains: () => true }, computedStyle: { display: 'flex' }, getBoundingClientRect: () => ({ height: 34 }) },
      navEl: null,
    });
    check('CADENCE SHELL', 'Review banner present, no lesson header -> offset equals the banner height alone (unchanged prior behavior)', bannerOnly === 34, 'got ' + bannerOnly);

    const both = runWithMockDom({
      bannerEl: { classList: { contains: () => true }, computedStyle: { display: 'flex' }, getBoundingClientRect: () => ({ height: 34 }) },
      navEl: { getBoundingClientRect: () => ({ height: 56 }) },
    });
    check('CADENCE SHELL', 'Both banner and lesson header present -> offset is the sum of both (the shell clears both, scroll-position independent)', both === 90, 'got ' + both);

    const hiddenBanner = runWithMockDom({
      bannerEl: { classList: { contains: () => false }, computedStyle: { display: 'none' }, getBoundingClientRect: () => ({ height: 34 }) },
      navEl: { getBoundingClientRect: () => ({ height: 56 }) },
    });
    check('CADENCE SHELL', 'A banner element that exists but is not shown contributes 0 (only .show + non-none display counts)', hiddenBanner === 56, 'got ' + hiddenBanner);
  }

  check('CADENCE SHELL', 'This offset is used to size AND position the mobile shell (top offset + shrunk --cshell-vh), so the composer stays reachable rather than being pushed off-screen', /dom\.shell\.style\.top = \(vvOffset \+ chromeOffset\) \+ 'px';/.test(shellSrc) && /'--cshell-vh', \(vv\.height - chromeOffset\) \+ 'px'/.test(shellSrc));
  check('CADENCE SHELL', 'Desktop centered-card layout is untouched (still driven by --cshell-banner-nudge, not the new top-offset math)', /'--cshell-banner-nudge', \(chromeOffset \/ 2\) \+ 'px'/.test(shellSrc));
})();

// ─────────────────────────────────────────────────────────────────────────
// 6. AIMT INSTRUCTIONAL CALLOUT — canonical orbital mark
// ─────────────────────────────────────────────────────────────────────────
(function calloutIcon() {
  check('AIMT CALLOUT', 'The Module 8 Adapt callout no longer renders a bare "→" as its .kp-icon marker', !/<div class="kp-icon">→<\/div>/.test(html));
  check('AIMT CALLOUT', 'It now renders the canonical AIMT orbital mark (matching every other plain .key-point callout\'s inline SVG geometry)', /kp-icon" aria-hidden="true"><svg viewBox="0 0 44 44"[\s\S]*?a \+ '<\/div><\/div>'/.test(html));
  check('AIMT CALLOUT', 'The Cadence identity mark (#cadence-mark) was not substituted in for the AIMT mark — identity separation preserved', (() => {
    const m = html.match(/'<div class="key-point"><div class="kp-icon"[\s\S]*?a \+ '<\/div><\/div>'/);
    return !!m && !m[0].includes('cadence-mark');
  })());
  check('AIMT CALLOUT', 'Semantic process arrows elsewhere (breadcrumbs, next/back nav, CTA arrows) are untouched — this fix only touched the one Adapt-callout marker', (html.match(/→/g) || []).length > 1);
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
