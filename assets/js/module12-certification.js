/* ═══════════════════════════════════════════════════════════════
   Module 12 — Final Certification Assessment — client controller.
   ---------------------------------------------------------------
   Standalone file per CLAUDE.md's "prefer new standalone files" rule.
   This is the DISPLAY + INTERACTION layer only (per
   docs/course-audit/00-aimt-certification-assessment-standard.md
   Section 16): every authoritative fact (eligibility, attempt state,
   scores, critical-domain results, certification decision) comes from
   functions/api/certification/*.js. Nothing here computes or trusts a
   local pass/fail determination for a real attempt.

   Review Mode never calls these production endpoints at all — it renders
   from a local, clearly labeled fixture set instead (see REVIEW_FIXTURES
   below), so Review Mode can never write an authoritative record, issue a
   certificate, or consume a real attempt, without needing any server-side
   Review Mode detection.

   VISUAL/UX NOTE (this pass): every string in COPY below is byte-identical
   to the prior approved wording — this refactor only changes hierarchy,
   progressive disclosure, and interaction design. Long explanatory copy
   that was previously always-visible now lives inside <details> disclosure
   elements; no sentence was reworded, shortened, or removed. All visual
   primitives reuse the site's existing tokens/classes (.sec-title,
   .body-text, .key-point/.kp-*, .cp-input, .cp-btn, .voice-btn, the
   --aimt-* CSS custom properties) rather than inventing a separate "exam
   design system."
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var API_BASE = '/api/certification';

  // ---- Copy blocks (verbatim per task instruction — do not creatively rewrite) ----
  var COPY = {
    stateA: {
      eyebrow: 'Module 12 · Final Exam',
      title: 'Final Certification Assessment',
      opening: [
        'You’ve completed the instructional part of the Head Spa Certification Course and demonstrated your understanding at required checkpoints along the way.',
        'This final assessment is different.',
        'You’re no longer being walked through one module at a time. You’ll be asked to remember what you learned, connect ideas from across the course, and make decisions the way you would in practice.',
        'Take your time. There is no countdown clock.'
      ],
      howItWorksTitle: 'How the assessment works',
      parts: [
        {
          num: '01',
          title: 'Knowledge & Retention',
          meta: '40 questions · 50% of your final score',
          body: [
            'Questions are mixed across Modules 1–11 rather than grouped by module.',
            'Some will test foundational knowledge. Most will give you realistic choices and ask you to identify the strongest answer based on what AIMT taught.',
            'You can move between questions, change your answers, leave and return, and review everything before you submit Part I.',
            'Once you submit the section, those answers are locked.'
          ]
        },
        {
          num: '02',
          title: 'Applied Practitioner Cases',
          meta: '4 cases · 30% of your final score',
          body: [
            'This is where the course starts coming together.',
            'Each case gives you a realistic situation that may involve several things at once — client communication, assessment, service adaptation, safety, sanitation, business judgment, or another part of the curriculum.',
            'Some answers will be structured. Others may ask you to explain your reasoning briefly.',
            'Each case locks when you submit it.'
          ]
        },
        {
          num: '03',
          title: 'Practitioner Conversation with Cadence',
          meta: '3 conversations · 20% of your final score',
          body: [
            'The last part should feel different.',
            'You’ll have a short conversation with Cadence about professional situations you could realistically encounter in practice.',
            'There is no perfect script to memorize.',
            'Answer naturally. Explain what you would do and why.',
            'Cadence evaluates your response against AIMT-defined competency criteria and may ask one follow-up if there is something important she needs you to clarify.',
            'You are not being graded on perfect grammar, polished writing, or sounding impressive.',
            'We want to understand how you think.'
          ]
        }
      ],
      passingTitle: 'What passing requires',
      passingIntro: 'Certification is based on demonstrated competency, not simply reaching the end of the course.',
      passingMetrics: [
        { value: '80%', label: 'Overall' },
        { value: '75%', label: 'Knowledge' },
        { value: '75%', label: 'Applied Cases' },
        { value: '80%', label: 'Cadence Conversation' },
        { value: '✓', label: 'Critical Competencies', critical: true }
      ],
      passingBullets: [
        '80% or higher overall',
        '75% or higher — Knowledge & Retention',
        '75% or higher — Applied Practitioner Cases',
        '80% or higher — Practitioner Conversation',
        'All required critical competency areas cleared'
      ],
      passingClose: 'A strong overall score cannot override an unresolved issue in an area involving professional scope, client safety, consent/touch authority, or sanitation/process integrity.\n\nLikewise, one missed multiple-choice question does not automatically mean you failed a critical competency. AIMT looks for the actual reasoning and pattern of understanding demonstrated across the assessment.',
      checkpointTitle: 'What about the checkpoints you already completed?',
      checkpointLead: 'Prior checkpoints established readiness. They do not secretly change the final exam score.',
      checkpointBody: 'Cadence has been checking your understanding throughout the course.\n\nPassing those required checkpoints is part of what made you eligible to take this final assessment.\n\nYour previous checkpoint answers do not secretly add or subtract points from your final score.\n\nIf you need remediation afterward, that history may help AIMT identify what you already understand well and where additional review would actually be useful.',
      integrityTitle: 'Before you begin',
      integrityBody: 'Parts I and II are intended to reflect your own retained knowledge and judgment.\n\nDo not use external AI to generate your answers or reopen the course to search for each answer while taking those sections.\n\nPart III intentionally uses Cadence — that is part of the assessment design.\n\nYour progress is saved, so you do not have to rush.\n\nOnce you intentionally submit a section, that section locks.',
      finalEncouragement: 'You do not need a perfect score, and you do not need perfect wording.\n\nRead carefully. Trust what you learned. When a question asks for judgment, think about the whole situation rather than looking for the quickest answer.\n\nGood luck.',
      button: 'Start Final Exam'
    },
    partI: {
      eyebrow: 'Part 1 of 3',
      title: 'Knowledge & Retention',
      meta: '40 questions',
      body: 'The questions in this section come from across the course and are intentionally mixed.\n\nChoose the strongest answer based on what you learned through AIMT.\n\nYou may move between questions and revise your answers until you submit this part.',
      progress: function (x, total) { return 'Question ' + x + ' of ' + total; },
      submitTitle: 'Ready to submit Part I?',
      submitBody: 'You can still go back and review any question before submitting.\n\nAfter submission, your Knowledge & Retention answers are locked and cannot be changed during this attempt.',
      reviewBtn: 'Review Answers',
      submitBtn: 'Submit Part I'
    },
    part1to2: {
      title: 'Part I complete.',
      body: 'Your Knowledge & Retention answers are now locked.\n\nNext, you’ll move into realistic practitioner cases where more than one part of the course may matter at the same time.',
      button: 'Continue to Applied Cases'
    },
    partII: {
      eyebrow: 'Part 2 of 3',
      title: 'Applied Practitioner Cases',
      meta: '4 cases',
      body: 'These are not designed around one isolated fact.\n\nRead the complete situation before answering. Decide what matters, what changes the plan, and what the practitioner should do next.\n\nSome cases may have more than one step.\n\nEach case locks when you submit it.'
    },
    part2to3: {
      title: 'The structured portion is complete.',
      body: 'There is one final part.\n\nThe last section is intentionally less like a traditional test.\n\nYou’ll have a short conversation with Cadence about three professional situations. Speak naturally and explain how you’re thinking.',
      button: 'Meet with Cadence'
    },
    partIII: {
      eyebrow: 'Part 3 of 3',
      title: 'Final Practitioner Conversation',
      body: 'Cadence has been part of your learning throughout this course.\n\nFor this final section, she is not here to teach you the answer.\n\nShe is here to understand how you reason through a situation when there is not a multiple-choice option in front of you.\n\nYou’ll have three short conversations.\n\nAnswer the way you would explain your thinking to a knowledgeable instructor or mentor.\n\nIf something important is unclear, Cadence may ask one follow-up before moving on.',
      openingWithName: function (name) { return 'You made it to the final part, ' + name + '. This part is a little different. I’m going to give you a few situations you might run into in practice, and I want to hear how you’d think through them. There isn’t one perfect script — just talk to me the way you normally would.'; },
      openingNoName: 'You made it to the final part. This part is a little different. I’m going to give you a few situations you might run into in practice, and I want to hear how you’d think through them. There isn’t one perfect script — just talk to me the way you normally would.',
      startLine: 'Let’s start with this one.',
      followUpLead: 'There’s one piece I want to hear a little more about before we move on.',
      closingWithName: function (name) { return 'Thanks, ' + name + '. That’s everything I needed from you. I’m submitting this part with the rest of your assessment now.'; },
      closingNoName: 'Thanks. That’s everything I needed from you. I’m submitting this part with the rest of your assessment now.'
    },
    processing: {
      title: 'Reviewing your assessment',
      body: 'Your responses have been submitted.\n\nAIMT is evaluating your Knowledge results, Applied Cases, Practitioner Conversation, and required competency areas against the certification standard.'
    },
    passed: {
      eyebrow: 'AIMT Head Spa Certification',
      title: 'You met the standard.',
      body: 'You’ve completed the course and demonstrated the knowledge, application, and professional judgment AIMT requires for certification.\n\nYou showed that you can retain what you learned, apply it to realistic situations, and explain your reasoning when there isn’t a script in front of you.\n\nYour AIMT Head Spa Certification is now complete.',
      courseCloseTitle: 'You finished the course. Now use it.',
      courseCloseBody: 'You now have the framework.\n\nThe next stage comes from repetition — performing the service, refining your setup, learning how different clients present, strengthening your communication, and becoming more confident in the decisions that cannot be learned from a script alone.\n\nYour AIMT resources, certification record, Performance Review, and certificate remain available from your Student Dashboard.\n\nThis course is complete.\n\nYour development as a practitioner is not.'
    },
    notYetPassed: {
      eyebrow: 'Final Assessment Results',
      title: 'Certification has not been earned yet.',
      body: 'Your assessment shows that you have already met the AIMT standard in some areas, but one or more required competencies still need additional work before certification can be issued.\n\nThis does not mean starting the entire course again.\n\nYour Performance Review below shows what you demonstrated successfully, what needs more attention, and what your next step is.\n\nYour certificate will remain locked until the certification standard is met.'
    },
    attempts: {
      1: {
        title: 'Review, then try again.',
        body: 'Your Performance Review identifies the areas that need more attention.\n\nReview the recommended sections before beginning another attempt. Your next assessment will use a new balanced selection of questions and cases.',
        actions: ['Review My Recommended Sections', 'Start Attempt 2']
      },
      2: {
        title: 'Complete your remediation plan first.',
        body: 'A second attempt shows that one or more competency areas still need more focused work.\n\nBefore Attempt 3 becomes available, complete the remediation activities assigned in your Performance Review.\n\nThese are targeted to what you need — you are not being asked to repeat the entire course.',
        actions: ['Begin My Remediation Plan']
      },
      3: {
        title: 'Your next step is with an AIMT educator.',
        body: 'At this point, another automatic retake is unlikely to be the most useful next step.\n\nWe want to understand where the difficulty is coming from and help you address it directly.\n\nYour next step is an AIMT Educator Remediation Session. This is a live conversation focused on the areas that are still preventing certification.\n\nIt is not an automatic pass.\n\nAfter the session and any recommended review, an AIMT educator may authorize another assessment attempt when you are ready.',
        actions: ['Request Educator Remediation Session']
      },
      4: {
        title: 'Your certification is under individual review.',
        body: 'You have completed the educator-supported reassessment and have not yet met all requirements for certification.\n\nAutomatic retakes stop here.\n\nAIMT will review your assessment and remediation history and determine the most appropriate next step, which may include additional study, educator support, selected module review, a practical requirement, or a later reassessment.',
        actions: ['View Review Status']
      }
    },
    requiredCompetencyReview: {
      title: 'Required competency review',
      body: 'One of the professional competencies required for certification needs to be demonstrated again before another attempt.\n\nThis is different from simply missing a question.\n\nYour Performance Review identifies the relevant competency and the AIMT material you should revisit before reassessment.'
    },
    assessmentReview: {
      title: 'Something about your assessment doesn’t look right?',
      body: 'If you believe a question was unclear or flawed, Cadence misunderstood your response, a technical issue affected your assessment, or an accessibility or language issue affected how your competency was evaluated, you may request human review.\n\nAIMT review can correct an assessment or technical error.\n\nIt does not waive a competency that still needs to be demonstrated.',
      action: 'Request Assessment Review'
    }
  };

  var DOMAIN_LABELS = {
    D1: 'Professional Scope / Diagnosis / Referral',
    D2: 'Contraindication / Client Safety Judgment',
    D3: 'Consent / Touch / Bodywork Authority',
    D4: 'Sanitation / Process Integrity'
  };

  // ---- utilities ----
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // The locked exam-content banks use markdown "**bold**" for genuine
  // emphasis inside otherwise-plain question/scenario prose (e.g. "crosses
  // the line from an **adapted ritual** into a **breakdown of a professional
  // standard**"). Content is never rewritten to remove it, so the renderer
  // must convert it -- escape first (so a literal "<" in student text can't
  // inject markup), then turn the untouched "**" markers into <strong>.
  function mdBold(escapedText) {
    return escapedText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }
  // The locked case-bank scenarios also use markdown blockquote syntax
  // ("> “My neck feels strained…”") to set off a quoted client statement as
  // its own paragraph. Left unconverted, a bare esc()+split would show the
  // literal "> " marker to the student. As with mdBold, only the markdown
  // marker is stripped/restyled -- the quoted words themselves are untouched.
  function paras(text) {
    return String(text || '').split('\n\n').map(function (p) {
      var isQuote = /^>\s?/.test(p);
      var stripped = isQuote ? p.replace(/^>\s?/, '') : p;
      var inner = mdBold(esc(stripped)).replace(/\n/g, '<br>');
      return isQuote ? '<p class="body-text m12x-quote">' + inner + '</p>' : '<p class="body-text">' + inner + '</p>';
    }).join('');
  }
  // For inline contexts (a <legend>, a single scenario line) where a full
  // paragraph wrapper isn't appropriate but the source text may still contain
  // real line breaks (a stem with a bulleted history list, e.g. M03-003) that
  // must not collapse into one run-on sentence. Several Knowledge-item stems
  // also embed a markdown-quoted client line ("> “My neck is red…”") --
  // handled per-line here the same way paras() handles a whole blockquote
  // paragraph, so the "> " marker is styled away rather than shown literally.
  function multilineInline(text) {
    return String(text || '').split('\n').map(function (line) {
      var isQuote = /^>\s?/.test(line);
      var stripped = isQuote ? line.replace(/^>\s?/, '') : line;
      var inner = mdBold(esc(stripped));
      return isQuote ? '<span class="m12x-quote-inline">' + inner + '</span>' : inner;
    }).join('<br>');
  }
  function firstName() {
    try {
      var full = (window.APP_STATE && window.APP_STATE.data && window.APP_STATE.data.student && window.APP_STATE.data.student.name) || '';
      var name = String(full).trim().split(/\s+/)[0];
      return name || '';
    } catch (e) { return ''; }
  }
  function pct(n) {
    if (n == null || isNaN(n)) return '—';
    return Math.round(n * 100) + '%';
  }
  // Matches the exact auto-grow behavior already established for every
  // course checkpoint textarea (grow(this) in headspa-mastery.html) --
  // reimplemented locally so this standalone file has no hard dependency on
  // that inline script (it must also work inside the offline local QA tool).
  function autoGrow(el, max) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, max || 100) + 'px';
  }
  // A single answer-choice control shared by Part I and every Part II
  // choice-based part type. Renders as a premium AIMT control (custom
  // indicator, generous hit area) while keeping a real, focusable, keyboard-
  // operable native radio/checkbox for full semantics.
  function choiceHtml(name, partId, i, text, checked, type) {
    var cls = 'm12x-choice' + (type === 'checkbox' ? ' checkbox' : '') + (checked ? ' selected' : '');
    return '<label class="' + cls + '"><input type="' + type + '" name="' + esc(name) + '" data-part="' + esc(partId) + '" data-choice="' + i + '"' + (checked ? ' checked' : '') + '><span class="m12x-choice-indicator" aria-hidden="true"></span><span class="m12x-choice-text">' + esc(text) + '</span></label>';
  }
  function voiceButtonHtml(targetId) {
    if (typeof window.startVoice !== 'function') return '';
    return '<button type="button" class="voice-btn" onclick="startVoice(\'' + targetId + '\', this)" title="Speak your answer" aria-label="Speak your answer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg></button>';
  }
  function disclosureHtml(id, summaryText, bodyHtml, open) {
    return '<details class="m12x-disclosure" id="' + esc(id) + '"' + (open ? ' open' : '') + '><summary>' + esc(summaryText) + '</summary><div class="m12x-disclosure-body">' + bodyHtml + '</div></details>';
  }

  async function authHeaders() {
    try {
      var supa = (typeof supabaseClient !== 'undefined') ? supabaseClient : null;
      if (!supa) return {};
      var res = await supa.auth.getSession();
      var token = (res && res.data && res.data.session && res.data.session.access_token) || '';
      return token ? { Authorization: 'Bearer ' + token } : {};
    } catch (e) { return {}; }
  }

  async function apiGet(path) {
    var headers = await authHeaders();
    var r = await fetch(API_BASE + path, { headers: headers });
    var body = await r.json().catch(function () { return {}; });
    return { ok: r.ok, status: r.status, body: body };
  }
  async function apiPost(path, payload) {
    var headers = Object.assign({ 'Content-Type': 'application/json' }, await authHeaders());
    var r = await fetch(API_BASE + path, { method: 'POST', headers: headers, body: JSON.stringify(payload || {}) });
    var body = await r.json().catch(function () { return {}; });
    return { ok: r.ok, status: r.status, body: body };
  }

  function injectStyleOnce() {
    if (document.getElementById('m12x-style')) return;
    var style = document.createElement('style');
    style.id = 'm12x-style';
    style.textContent = [
      '.m12x { max-width: 640px; margin: 0 auto; }',
      '.m12x .sec-title { max-width: none; }',

      /* buttons -- reuses the site's established pill-CTA shape (.sb-btn/.lc-btn: dark fill, 980px radius) */
      '.m12x .m12x-btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; background: var(--hero-bg,#262626); color:#fff; border:none; border-radius:980px; padding:0.8rem 1.5rem; font-family:var(--aimt-font-sans); font-size:0.85rem; font-weight:500; cursor:pointer; transition:opacity .2s; }',
      '.m12x .m12x-btn:hover { opacity:0.88; }',
      '.m12x .m12x-btn:disabled { opacity:0.4; cursor:not-allowed; }',
      '.m12x .m12x-btn.secondary { background:transparent; color:var(--text); border:0.5px solid var(--border2); }',
      '.m12x .m12x-btn.secondary:hover { background: rgba(0,0,0,0.03); opacity:1; }',
      '.m12x .m12x-btn.ghost { background:none; border:none; color:var(--accent2); padding:0.5rem 0.1rem; font-size:0.78rem; text-decoration:underline; text-underline-offset:3px; }',
      '.m12x .m12x-btn.ghost:hover { opacity:0.72; }',
      '.m12x .m12x-btn:focus-visible, .m12x .m12x-choice:focus-within, .m12x .m12x-jump:focus-visible, .m12x .m12x-chip:focus-within { outline:2px solid var(--accent2); outline-offset:2px; }',

      /* three-part overview (Exam Ready) */
      '.m12x .m12x-overview-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:0.85rem; margin: 1.3rem 0; }',
      '@media (max-width: 720px) { .m12x .m12x-overview-grid { grid-template-columns: 1fr; } }',
      '.m12x .m12x-tile { border:0.5px solid var(--border2); border-radius:14px; padding:1.05rem 1.1rem; background:rgba(255,255,255,0.55); }',
      '.m12x .m12x-tile.part3 { background:var(--warn-light); border-color:rgba(160,104,48,0.18); }',
      '.m12x .m12x-tile-num { font-family:var(--aimt-font-mono); font-size:0.62rem; letter-spacing:0.12em; color:#8a8078; margin-bottom:6px; }',
      '.m12x .m12x-tile-title { font-family:var(--aimt-font-mont); font-weight:600; font-size:0.95rem; letter-spacing:-0.01em; margin-bottom:3px; color:var(--text); line-height:1.3; }',
      '.m12x .m12x-tile-meta { font-size:0.74rem; color:#8a8078; margin-bottom:0.7rem; }',

      /* progressive-disclosure regions ("What to expect", checkpoint history, etc.) */
      '.m12x .m12x-disclosure { margin:0.4rem 0 0.1rem; }',
      '.m12x .m12x-disclosure > summary { cursor:pointer; list-style:none; font-family:var(--aimt-font-mono); font-size:0.66rem; letter-spacing:0.09em; text-transform:uppercase; color:var(--accent2); display:flex; align-items:center; gap:7px; padding:0.25rem 0; }',
      '.m12x .m12x-disclosure > summary::-webkit-details-marker { display:none; }',
      '.m12x .m12x-disclosure > summary::before { content:"+"; font-size:0.95rem; line-height:1; width:0.8em; display:inline-block; }',
      '.m12x .m12x-disclosure[open] > summary::before { content:"–"; }',
      '.m12x .m12x-disclosure .m12x-disclosure-body { padding-top:0.6rem; }',
      '.m12x .m12x-tile .m12x-disclosure { margin-top:0.2rem; }',

      /* passing standard -- compact editorial metric row, not a dashboard */
      '.m12x .m12x-metric-row { display:flex; flex-wrap:wrap; gap:1.5rem 2rem; margin:1.1rem 0 1rem; padding:1.1rem 0; border-top:0.5px solid var(--border2); border-bottom:0.5px solid var(--border2); }',
      '.m12x .m12x-metric-value { font-family:var(--aimt-font-mont); font-size:1.55rem; font-weight:600; color:var(--text); line-height:1; }',
      '.m12x .m12x-metric-value.critical { font-size:1.3rem; }',
      '.m12x .m12x-metric-label { font-family:var(--aimt-font-mono); font-size:0.6rem; letter-spacing:0.08em; text-transform:uppercase; color:#8a8078; margin-top:5px; max-width:11ch; }',

      /* thin progress indicator */
      '.m12x .m12x-progress-row { display:flex; align-items:baseline; justify-content:space-between; gap:1rem; margin-bottom:0.5rem; font-family:var(--aimt-font-mono); font-size:0.66rem; letter-spacing:0.06em; color:#8a8078; }',
      '.m12x .m12x-progress-track { height:3px; background:rgba(0,0,0,0.08); border-radius:2px; margin-bottom:1.4rem; overflow:hidden; }',
      '.m12x .m12x-progress-fill { height:100%; background:var(--accent2); border-radius:2px; transition:width .25s ease; }',

      /* question -- strip default fieldset/legend chrome, keep semantics */
      '.m12x fieldset { border:0; padding:0; margin:0; min-width:0; }',
      '.m12x legend { padding:0; width:100%; float:none; }',
      '.m12x .m12x-q { font-family:var(--aimt-font-serif); font-size:0.93rem; font-weight:500; line-height:1.58; color:var(--text); margin-bottom:1.1rem; }',
      '.m12x .m12x-select-hint { font-family:var(--aimt-font-mono); font-size:0.6rem; letter-spacing:0.08em; text-transform:uppercase; color:#8a8078; margin-bottom:0.7rem; display:block; }',

      /* answer choices -- premium control, custom indicator, no color-only state */
      '.m12x .m12x-choice { position:relative; display:flex; align-items:flex-start; gap:0.75rem; padding:0.85rem 1rem; border:0.5px solid var(--border2); border-radius:var(--aimt-radius-md); margin-bottom:0.6rem; cursor:pointer; background:rgba(255,255,255,0.4); transition:border-color .15s, background .15s; }',
      '.m12x .m12x-choice:hover { border-color:var(--muted2,#c4bdb5); background:rgba(255,255,255,0.7); }',
      '.m12x .m12x-choice.selected { border-color:var(--text); background:rgba(255,255,255,0.85); }',
      '.m12x .m12x-choice-indicator { width:18px; height:18px; border-radius:50%; border:1.5px solid var(--muted2,#c4bdb5); flex-shrink:0; margin-top:1px; position:relative; transition:border-color .15s; }',
      '.m12x .m12x-choice.checkbox .m12x-choice-indicator { border-radius:5px; }',
      '.m12x .m12x-choice.selected .m12x-choice-indicator { border-color:var(--text); }',
      '.m12x .m12x-choice.selected .m12x-choice-indicator::after { content:""; position:absolute; inset:3.5px; border-radius:50%; background:var(--text); }',
      '.m12x .m12x-choice.checkbox.selected .m12x-choice-indicator::after { border-radius:2px; }',
      '.m12x .m12x-choice input { position:absolute; opacity:0; width:1px; height:1px; margin:0; pointer-events:none; }',
      '.m12x .m12x-choice-text { font-family:var(--aimt-font-sans); font-size:0.87rem; line-height:1.55; color:var(--text); padding-top:1px; }',

      /* Part I nav bar + flag control */
      '.m12x .m12x-navbar { display:flex; align-items:center; justify-content:space-between; gap:0.6rem; margin-top:1.3rem; padding-top:1rem; border-top:0.5px solid var(--border2); flex-wrap:wrap; }',
      '.m12x .m12x-flag-btn { display:inline-flex; align-items:center; gap:5px; background:none; border:0.5px solid var(--border2); border-radius:980px; padding:0.55rem 0.95rem; font-family:var(--aimt-font-sans); font-size:0.76rem; color:var(--text); cursor:pointer; }',
      '.m12x .m12x-flag-btn.active { background:var(--aimt-warning-light); border-color:var(--aimt-warning); color:var(--aimt-warning); }',
      '.m12x .m12x-viewmap-btn { margin-top:1rem; }',

      /* question map (native <dialog>, on-demand only) */
      '.m12x-mapdialog { border:none; border-radius:16px; padding:0; max-width:520px; width:92vw; max-height:82vh; }',
      '.m12x-mapdialog::backdrop { background:rgba(20,18,16,0.45); }',
      '.m12x-mapdialog .m12x-map-inner { padding:1.3rem 1.4rem 1.5rem; overflow-y:auto; max-height:82vh; }',
      '.m12x-mapdialog .m12x-map-head { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:0.9rem; }',
      '.m12x-mapdialog .m12x-map-head h2 { margin-bottom:0; max-width:none; }',
      '.m12x-mapdialog .m12x-map-legend { display:flex; flex-wrap:wrap; gap:0.9rem 1.1rem; font-size:0.7rem; color:#8a8078; margin-bottom:1.1rem; }',
      '.m12x-mapdialog .m12x-map-legend-item { display:flex; align-items:center; gap:5px; }',
      '.m12x-mapdialog .m12x-map-swatch { width:13px; height:13px; border-radius:4px; border:1.5px solid var(--muted2,#c4bdb5); display:inline-block; }',
      '.m12x-mapdialog .m12x-map-swatch.answered { background:var(--aimt-success-light); border-color:var(--aimt-success); }',
      '.m12x-mapdialog .m12x-map-swatch.flagged { border-color:var(--aimt-warning); background:var(--aimt-warning-light); }',
      '.m12x-mapdialog .m12x-jumpgrid { display:grid; grid-template-columns:repeat(6, 1fr); gap:8px; }',
      '@media (min-width:420px) { .m12x-mapdialog .m12x-jumpgrid { grid-template-columns:repeat(8,1fr); } }',
      '.m12x-mapdialog .m12x-jump { position:relative; min-height:42px; min-width:42px; border-radius:8px; border:1px solid var(--border2); background:#fff; font-family:var(--aimt-font-mono); font-size:0.72rem; cursor:pointer; }',
      '.m12x-mapdialog .m12x-jump.answered { background:var(--aimt-success-light); border-color:var(--aimt-success); }',
      '.m12x-mapdialog .m12x-jump.flagged { box-shadow:inset 0 0 0 1.5px var(--aimt-warning); }',
      '.m12x-mapdialog .m12x-jump.current { outline:2px solid var(--text); outline-offset:1px; }',
      '.m12x-mapdialog .m12x-jump-flag { position:absolute; top:-5px; right:-5px; font-size:0.62rem; }',

      /* Part I review-before-submit summary */
      '.m12x .m12x-summary-row { display:flex; gap:1.6rem; margin:1.1rem 0 1.2rem; flex-wrap:wrap; }',
      '.m12x .m12x-summary-item { cursor:pointer; background:none; border:none; padding:0; font-family:inherit; text-align:left; }',
      '.m12x .m12x-summary-value { font-family:var(--aimt-font-mont); font-size:1.4rem; font-weight:600; color:var(--text); }',
      '.m12x .m12x-summary-label { font-family:var(--aimt-font-mono); font-size:0.6rem; letter-spacing:0.07em; text-transform:uppercase; color:#8a8078; }',

      /* case scenario -- separated without being a decorative card */
      '.m12x .m12x-case-progress { font-family:var(--aimt-font-mono); font-size:0.66rem; letter-spacing:0.07em; color:#8a8078; margin-bottom:0.5rem; }',
      '.m12x .m12x-scenario { border-left:2.5px solid var(--accent2); padding:0.1rem 0 0.1rem 1.05rem; margin:0.9rem 0 1.3rem; }',
      '.m12x .m12x-scenario p.body-text { margin-bottom:0.7rem; }',
      '.m12x .m12x-scenario p.body-text:last-child { margin-bottom:0; }',
      /* client quotes (markdown "> ...") -- reuses the site's established italic-serif quote convention (.cn-text/.sc-text) rather than showing a literal ">" */
      '.m12x .m12x-quote { font-family:var(--aimt-font-serif); font-style:italic; color:var(--text); padding-left:0.9rem; border-left:2px solid var(--border2); }',
      '.m12x .m12x-quote-inline { font-family:var(--aimt-font-serif); font-style:italic; }',
      '.m12x .m12x-case-part { margin-bottom:1.3rem; }',
      '.m12x .m12x-case-submitrow { margin-top:0.6rem; }',

      /* sequencing */
      '.m12x .m12x-seq { list-style:none; padding:0; margin:0 0 0.6rem; }',
      '.m12x .m12x-seq-item { display:flex; align-items:center; gap:0.7rem; padding:0.7rem 0.9rem; border:0.5px solid var(--border2); border-radius:var(--aimt-radius-md); margin-bottom:0.5rem; background:rgba(255,255,255,0.5); }',
      '.m12x .m12x-seq-num { width:24px; height:24px; border-radius:50%; background:var(--hero-bg,#262626); color:#fff; font-family:var(--aimt-font-mono); font-size:0.7rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }',
      '.m12x .m12x-seq-text { flex:1; font-size:0.86rem; line-height:1.5; color:var(--text); }',
      '.m12x .m12x-seq-controls { display:flex; flex-direction:column; gap:2px; }',
      '.m12x .m12x-seq-arrow { width:26px; height:22px; border:0.5px solid var(--border2); background:#fff; border-radius:6px; cursor:pointer; font-size:0.68rem; line-height:1; padding:0; }',
      '.m12x .m12x-seq-arrow:disabled { opacity:0.3; cursor:not-allowed; }',
      '.m12x .m12x-seq-arrow:focus-visible { outline:2px solid var(--accent2); outline-offset:1px; }',

      /* classification */
      '.m12x .m12x-classify-item { margin-bottom:0.9rem; }',
      '.m12x .m12x-classify-label { font-size:0.86rem; font-weight:500; color:var(--text); margin-bottom:0.5rem; }',
      '.m12x .m12x-classify-options { display:flex; gap:0.5rem; flex-wrap:wrap; }',
      '.m12x .m12x-chip { position:relative; border:0.5px solid var(--border2); border-radius:980px; padding:0.5rem 1.05rem; font-size:0.79rem; background:rgba(255,255,255,0.5); cursor:pointer; color:var(--text); transition:background .15s, border-color .15s, color .15s; }',
      '.m12x .m12x-chip:hover { border-color:var(--muted2,#c4bdb5); }',
      '.m12x .m12x-chip.selected { background:var(--hero-bg,#262626); border-color:transparent; color:#fff; }',
      '.m12x .m12x-chip input { position:absolute; opacity:0; width:1px; height:1px; pointer-events:none; }',

      /* short response */
      '.m12x .m12x-shortresponse-row { display:flex; align-items:flex-end; gap:0.6rem; }',
      '.m12x .m12x-shortresponse-row .cp-input { flex:1; min-height:64px; }',

      /* Part III -- intentional environment shift, still AIMT-native */
      '.m12x .m12x-cadence-env { background:var(--warn-light); border-radius:20px; padding:1.4rem 1.3rem 1.2rem; margin-top:0.6rem; }',
      '.m12x .m12x-cadence-eyebrow { font-family:var(--aimt-font-mono); font-size:0.6rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--accent2); margin-bottom:0.7rem; }',
      '.m12x .m12x-chat { display:flex; flex-direction:column; gap:0.9rem; margin-bottom:1.1rem; }',
      '.m12x .m12x-msg { max-width:88%; padding:0.8rem 1rem; border-radius:16px; font-size:0.89rem; line-height:1.6; font-family:var(--aimt-font-sans); }',
      '.m12x .m12x-msg.assistant { background:#fff; align-self:flex-start; border-bottom-left-radius:4px; }',
      '.m12x .m12x-msg.user { background:var(--hero-bg,#262626); color:#fff; align-self:flex-end; border-bottom-right-radius:4px; }',
      '.m12x .m12x-composer { display:flex; align-items:flex-end; gap:0.6rem; }',
      '.m12x .m12x-composer .cp-input { background:#fff; flex:1; min-height:52px; }',

      /* pass / not-yet-passed */
      '.m12x .m12x-pass-banner { border-top:3px solid var(--aimt-success); padding-top:1.1rem; }',
      '.m12x .m12x-notyet-banner { border-top:3px solid var(--aimt-warning); padding-top:1.1rem; }',
      '.m12x .m12x-perf-card { border:0.5px solid var(--border2); border-radius:14px; padding:1.15rem 1.25rem; margin:1.2rem 0; background:rgba(255,255,255,0.6); }',
      '.m12x .m12x-perf-head { display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:0.4rem 1rem; margin-bottom:0.7rem; }',
      '.m12x .m12x-perf-title { font-family:var(--aimt-font-mont); font-weight:600; font-size:0.92rem; }',
      '.m12x .m12x-perf-score { font-family:var(--aimt-font-mont); font-size:1.3rem; font-weight:600; }',
      '.m12x .m12x-domain-row { display:flex; justify-content:space-between; padding:0.5rem 0; border-bottom:0.5px solid var(--border2); font-size:0.85rem; }',
      '.m12x .m12x-domain-row:last-child { border-bottom:none; }',
      '.m12x .m12x-domain-row.cleared { color:var(--aimt-success); }',
      '.m12x .m12x-domain-row.uncleared { color:var(--aimt-warning); }',

      /* Review Mode dev-only fixture bar */
      '.m12x .m12x-review-fixtures { display: flex; flex-wrap: wrap; gap: 6px; padding: 0.6rem; border: 1px dashed rgba(0,0,0,0.25); border-radius: 8px; margin-bottom: 1rem; }',
      '.m12x .m12x-review-fixtures button { font-size: 0.65rem; padding: 4px 8px; border-radius: 6px; border: 0.5px solid rgba(0,0,0,0.2); background: #fff; cursor: pointer; }',

      '@media (prefers-reduced-motion: reduce) { .m12x .m12x-progress-fill, .m12x .m12x-btn, .m12x .m12x-choice, .m12x .m12x-chip { transition: none; } }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function frame(inner) {
    return '<div class="m12x lesson-wrap">' + inner + '</div>';
  }

  // ---- On-demand Question Map (native <dialog> -- free focus trap + Escape
  // handling in evergreen browsers). Never permanently occupies page layout. ----
  function openQuestionMap(opts) {
    var existing = document.getElementById('m12MapDialog');
    if (existing) existing.remove();
    var dlg = document.createElement('dialog');
    dlg.id = 'm12MapDialog';
    dlg.className = 'm12x-mapdialog';
    var inner = '<div class="m12x-map-inner">';
    inner += '<div class="m12x-map-head"><h2 class="sec-title">Question Map</h2><button type="button" class="m12x-btn secondary" id="m12MapClose">Close</button></div>';
    inner += '<div class="m12x-map-legend">';
    inner += '<span class="m12x-map-legend-item"><span class="m12x-map-swatch answered" aria-hidden="true"></span>Answered</span>';
    inner += '<span class="m12x-map-legend-item"><span class="m12x-map-swatch" aria-hidden="true"></span>Unanswered</span>';
    inner += '<span class="m12x-map-legend-item"><span class="m12x-map-swatch flagged" aria-hidden="true"></span>Flagged for review</span>';
    inner += '</div>';
    inner += '<div class="m12x-jumpgrid" role="group" aria-label="Jump to question">';
    for (var i = 0; i < opts.total; i++) {
      var answered = opts.isAnswered(i);
      var flagged = opts.isFlagged(i);
      var isCurrent = i === opts.currentIndex;
      var stateLabel = (answered ? ', answered' : ', unanswered') + (flagged ? ', flagged for review' : '') + (isCurrent ? ', current question' : '');
      inner += '<button type="button" class="m12x-jump' + (answered ? ' answered' : '') + (flagged ? ' flagged' : '') + (isCurrent ? ' current' : '') + '" data-jump="' + i + '"' + (isCurrent ? ' aria-current="true"' : '') + ' aria-label="Question ' + (i + 1) + stateLabel + '">' + (i + 1) + (flagged ? '<span class="m12x-jump-flag" aria-hidden="true">⚑</span>' : '') + '</button>';
    }
    inner += '</div></div>';
    dlg.innerHTML = inner;
    document.body.appendChild(dlg);
    dlg.addEventListener('close', function () { dlg.remove(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); }); // backdrop click
    var closeBtn = dlg.querySelector('#m12MapClose');
    if (closeBtn) closeBtn.addEventListener('click', function () { dlg.close(); });
    Array.prototype.forEach.call(dlg.querySelectorAll('[data-jump]'), function (btn) {
      btn.addEventListener('click', function () {
        var i = Number(btn.getAttribute('data-jump'));
        dlg.close();
        opts.onJump(i);
      });
    });
    if (typeof dlg.showModal === 'function') {
      dlg.showModal();
    } else {
      dlg.setAttribute('open', ''); // very old browser fallback -- no focus trap, still closable
    }
  }

  // ---- Review Mode fixtures (mocked, no network, no persistence) ----
  var REVIEW_STATES = ['examReady', 'part1', 'part2', 'part3', 'processing', 'pass', 'attempt1', 'attempt2', 'attempt3', 'attempt4'];

  function fixtureStatusFor(stateKey) {
    var domainsAllCleared = [
      { domainId: 'D1', cleared: true }, { domainId: 'D2', cleared: true },
      { domainId: 'D3', cleared: true }, { domainId: 'D4', cleared: true }
    ];
    var domainsOneUncleared = [
      { domainId: 'D1', cleared: true }, { domainId: 'D2', cleared: false },
      { domainId: 'D3', cleared: true }, { domainId: 'D4', cleared: true }
    ];
    var perfReview = function (decision, domains) {
      return {
        attemptId: 'fixture', attemptNumber: 1, decision: decision, overallScore: decision === 'pass' ? 0.88 : 0.68,
        componentScores: { knowledge: 0.8, appliedCases: 0.78, interview: decision === 'pass' ? 0.9 : 0.7 },
        criticalDomainResults: domains, decisionAt: new Date().toISOString()
      };
    };
    switch (stateKey) {
      case 'examReady': return { eligible: true, state: 'A', ladder: { canStartNewAttempt: true, nextAttemptNumber: 1 } };
      case 'part1': return { eligible: true, state: 'B', inProgressAttempt: { id: 'fixture', attemptNumber: 1, status: 'in_progress' } };
      case 'part2': return { eligible: true, state: 'B', inProgressAttempt: { id: 'fixture', attemptNumber: 1, status: 'part1_locked' } };
      case 'part3': return { eligible: true, state: 'B', inProgressAttempt: { id: 'fixture', attemptNumber: 1, status: 'part2_locked' } };
      case 'processing': return { eligible: true, state: 'B', inProgressAttempt: { id: 'fixture', attemptNumber: 1, status: 'part3_locked' } };
      case 'pass': return { eligible: true, state: 'C', ladder: { alreadyCertified: true }, performanceReview: perfReview('pass', domainsAllCleared) };
      case 'attempt1': return { eligible: true, state: 'D', ladder: { canStartNewAttempt: true, nextAttemptNumber: 2 }, performanceReview: perfReview('not_yet_passed', domainsAllCleared), remediation: [] };
      case 'attempt2': return { eligible: true, state: 'D', ladder: { canStartNewAttempt: false, nextAttemptNumber: 3, blockedReason: 'remediation_required', outstandingCount: 2 }, performanceReview: Object.assign(perfReview('not_yet_passed', domainsAllCleared), { attemptNumber: 2 }), remediation: [{ competency_area: 'Fixture competency area', completed: false, required_before_next_attempt: true }] };
      case 'attempt3': return { eligible: true, state: 'D', ladder: { canStartNewAttempt: false, nextAttemptNumber: 4, blockedReason: 'educator_authorization_required' }, performanceReview: Object.assign(perfReview('not_yet_passed', domainsOneUncleared), { attemptNumber: 3 }), remediation: [], educatorRequest: null };
      case 'attempt4': return { eligible: true, state: 'D', ladder: { canStartNewAttempt: false, nextAttemptNumber: 5, blockedReason: 'individual_aimt_review' }, performanceReview: Object.assign(perfReview('not_yet_passed', domainsOneUncleared), { attemptNumber: 4 }), remediation: [], educatorRequest: { status: 'completed', attempt4_authorized: true } };
      default: return { eligible: true, state: 'A', ladder: { canStartNewAttempt: true, nextAttemptNumber: 1 } };
    }
  }

  function reviewFixtureBar(current) {
    var btns = REVIEW_STATES.map(function (s) {
      return '<button data-m12-fixture="' + s + '"' + (s === current ? ' style="font-weight:700;"' : '') + '>' + s + '</button>';
    }).join('');
    return '<div class="m12x-review-fixtures"><strong style="font-size:0.65rem;">Review Mode — Module 12 state fixtures:</strong>' + btns + '</div>';
  }

  function currentReviewFixtureKey() {
    try {
      return sessionStorage.getItem('aimt_m12_review_fixture') || 'examReady';
    } catch (e) { return 'examReady'; }
  }
  function setReviewFixtureKey(key) {
    try { sessionStorage.setItem('aimt_m12_review_fixture', key); } catch (e) {}
  }

  // ---- Renderers ----

  function renderStateA(container, status) {
    var c = COPY.stateA;
    var html = '';
    html += '<div class="mh-eyebrow" style="color:#8a8078;">' + esc(c.eyebrow) + '</div>';
    html += '<h1 class="sec-title">' + esc(c.title) + '</h1>';
    // A. Hero -- keep the short opening visible; no paragraph wall before hierarchy is established.
    html += c.opening.map(function (p) { return '<p class="body-text">' + esc(p) + '</p>'; }).join('');

    // B. Three-part overview -- one cohesive component, concise by default,
    // full approved copy available per part via "What to expect".
    html += '<h2 class="sec-title" style="margin-top:1.5rem;">' + esc(c.howItWorksTitle) + '</h2>';
    html += '<div class="m12x-overview-grid">';
    c.parts.forEach(function (part, i) {
      html += '<div class="m12x-tile' + (i === 2 ? ' part3' : '') + '">';
      html += '<div class="m12x-tile-num">' + esc(part.num) + '</div>';
      html += '<div class="m12x-tile-title">' + esc(part.title) + '</div>';
      html += '<div class="m12x-tile-meta">' + esc(part.meta) + '</div>';
      html += disclosureHtml('m12PartDetail' + i, 'What to expect', part.body.map(function (p) { return '<p class="body-text" style="font-size:0.83rem;">' + esc(p) + '</p>'; }).join(''));
      html += '</div>';
    });
    html += '</div>';

    // C. Passing standard -- compact metric row + preserved explanatory copy.
    html += '<h2 class="sec-title" style="margin-top:1.3rem;">' + esc(c.passingTitle) + '</h2>';
    html += '<p class="body-text">' + esc(c.passingIntro) + '</p>';
    html += '<div class="m12x-metric-row">';
    c.passingMetrics.forEach(function (m) {
      html += '<div><div class="m12x-metric-value' + (m.critical ? ' critical' : '') + '">' + esc(m.value) + '</div><div class="m12x-metric-label">' + esc(m.label) + '</div></div>';
    });
    html += '</div>';
    html += disclosureHtml('m12PassingDetail', 'How these are evaluated', paras(c.passingClose) + '<ul style="margin:0.6rem 0 0 1.2rem;">' + c.passingBullets.map(function (b) { return '<li class="body-text" style="font-size:0.83rem;">' + esc(b) + '</li>'; }).join('') + '</ul>');

    // D. Checkpoint history -- restrained disclosure, not a giant card.
    html += '<h2 class="sec-title" style="margin-top:1.3rem;">' + esc(c.checkpointTitle) + '</h2>';
    html += '<p class="body-text">' + esc(c.checkpointLead) + '</p>';
    html += disclosureHtml('m12CheckpointDetail', 'Read more', paras(c.checkpointBody));

    // E. Before you begin -- one compact readiness/integrity block.
    html += '<div class="key-point"><span class="kp-icon" aria-hidden="true">✦</span><div class="kp-body"><div class="kp-eyebrow">' + esc(c.integrityTitle) + '</div>' + paras(c.integrityBody) + '</div></div>';
    html += paras(c.finalEncouragement);
    html += '<button class="m12x-btn" id="m12StartBtn">' + esc(c.button) + '</button>';
    container.innerHTML = frame(html);
    var btn = document.getElementById('m12StartBtn');
    if (btn) btn.addEventListener('click', function () { onStartExam(container); });
  }

  async function onStartExam(container) {
    if (isReview()) { setReviewFixtureKey('part1'); return renderFromStatus(container, fixtureStatusFor('part1')); }
    container.innerHTML = frame('<p class="body-text">Starting your assessment…</p>');
    var res = await apiPost('/start-attempt', {});
    if (!res.ok) {
      container.innerHTML = frame('<p class="body-text">' + esc((res.body && res.body.error) || 'Could not start the assessment. Please try again.') + '</p>');
      return;
    }
    currentAttemptCache = res.body.attempt;
    renderPartI(container, res.body.attempt);
  }

  var currentAttemptCache = null;

  function renderPartI(container, attempt) {
    var c = COPY.partI;
    var items = (attempt.partI && attempt.partI.items) || fixturePartIItems();
    var responses = (attempt.partI && attempt.partI.responses) || {};
    var flagged = {}; // session-local only -- organizational, never scored, never persisted
    var idx = 0;
    var total = items.length;

    function answeredCount() { return Object.keys(responses).filter(function (k) { return responses[k] != null; }).length; }
    function flaggedCount() { return Object.keys(flagged).filter(function (k) { return flagged[k]; }).length; }
    function isAnsweredAt(i) { return responses[items[i].id] != null; }
    function isFlaggedAt(i) { return !!flagged[items[i].id]; }

    function drawQuestion() {
      var item = items[idx];
      var html = '';
      html += '<div class="mh-eyebrow" style="color:#8a8078;">' + esc(c.eyebrow) + '</div>';
      html += '<h1 class="sec-title">' + esc(c.title) + '</h1>';
      html += '<div class="m12x-progress-row" aria-live="polite"><span>' + esc(c.progress(idx + 1, total)) + '</span><span>' + answeredCount() + ' answered' + (flaggedCount() ? ' · ' + flaggedCount() + ' flagged' : '') + '</span></div>';
      html += '<div class="m12x-progress-track"><div class="m12x-progress-fill" style="width:' + Math.round(((idx + 1) / total) * 100) + '%;"></div></div>';
      html += '<fieldset><legend class="m12x-q">' + multilineInline(item.prompt) + '</legend>';
      item.choices.forEach(function (choice, i) {
        html += choiceHtml('m12q', item.id, i, choice, responses[item.id] === i, 'radio');
      });
      html += '</fieldset>';
      html += '<div class="m12x-navbar">';
      html += '<button class="m12x-btn secondary" id="m12PrevQ"' + (idx === 0 ? ' disabled' : '') + '>Previous</button>';
      html += '<button type="button" class="m12x-flag-btn' + (flagged[item.id] ? ' active' : '') + '" id="m12FlagBtn" aria-pressed="' + (!!flagged[item.id]) + '">' + (flagged[item.id] ? '⚑ Flagged' : '⚐ Flag for review') + '</button>';
      html += '<button class="m12x-btn" id="m12NextQ">' + (idx === total - 1 ? 'Review Answers' : 'Next') + '</button>';
      html += '</div>';
      html += '<button type="button" class="m12x-btn ghost m12x-viewmap-btn" id="m12ViewMap">View Question Map (' + answeredCount() + ' of ' + total + ' answered)</button>';
      container.innerHTML = frame(html);

      Array.prototype.forEach.call(container.querySelectorAll('input[name="m12q"]'), function (input) {
        input.addEventListener('change', function () {
          responses[item.id] = Number(input.getAttribute('data-choice'));
          saveProgressDebounced(attempt.id, responses);
          drawQuestion();
        });
      });
      var flagBtn = document.getElementById('m12FlagBtn');
      if (flagBtn) flagBtn.addEventListener('click', function () { flagged[item.id] = !flagged[item.id]; drawQuestion(); });
      var prevBtn = document.getElementById('m12PrevQ');
      if (prevBtn) prevBtn.addEventListener('click', function () { if (idx > 0) { idx--; drawQuestion(); } });
      var nextBtn = document.getElementById('m12NextQ');
      if (nextBtn) nextBtn.addEventListener('click', function () { if (idx < total - 1) { idx++; drawQuestion(); } else { drawReview(); } });
      var mapBtn = document.getElementById('m12ViewMap');
      if (mapBtn) mapBtn.addEventListener('click', function () {
        openQuestionMap({ total: total, isAnswered: isAnsweredAt, isFlagged: isFlaggedAt, currentIndex: idx, onJump: function (i) { idx = i; drawQuestion(); } });
      });
    }

    function drawReview() {
      var unansweredCount = 0;
      for (var i = 0; i < total; i++) if (!isAnsweredAt(i)) unansweredCount++;
      var html = '';
      html += '<div class="mh-eyebrow" style="color:#8a8078;">' + esc(c.eyebrow) + '</div>';
      html += '<h1 class="sec-title">' + esc(c.submitTitle) + '</h1>';
      html += paras(c.submitBody);
      html += '<div class="m12x-summary-row">';
      html += '<button type="button" class="m12x-summary-item" id="m12SumAnswered"><div class="m12x-summary-value">' + answeredCount() + '/' + total + '</div><div class="m12x-summary-label">Answered</div></button>';
      html += '<button type="button" class="m12x-summary-item" id="m12SumUnanswered"><div class="m12x-summary-value">' + unansweredCount + '</div><div class="m12x-summary-label">Unanswered</div></button>';
      html += '<button type="button" class="m12x-summary-item" id="m12SumFlagged"><div class="m12x-summary-value">' + flaggedCount() + '</div><div class="m12x-summary-label">Flagged</div></button>';
      html += '</div>';
      html += '<div style="display:flex; gap:0.6rem; flex-wrap:wrap;">';
      html += '<button class="m12x-btn secondary" id="m12BackToQ">Back to Questions</button>';
      html += '<button class="m12x-btn secondary" id="m12ViewMap2">' + esc(c.reviewBtn) + '</button>';
      html += '<button class="m12x-btn" id="m12SubmitBtn">' + esc(c.submitBtn) + '</button>';
      html += '</div>';
      container.innerHTML = frame(html);

      function openMap() {
        openQuestionMap({ total: total, isAnswered: isAnsweredAt, isFlagged: isFlaggedAt, currentIndex: -1, onJump: function (i) { idx = i; drawQuestion(); } });
      }
      document.getElementById('m12SumAnswered').addEventListener('click', openMap);
      document.getElementById('m12SumUnanswered').addEventListener('click', openMap);
      document.getElementById('m12SumFlagged').addEventListener('click', openMap);
      document.getElementById('m12ViewMap2').addEventListener('click', openMap);
      document.getElementById('m12BackToQ').addEventListener('click', function () { drawQuestion(); });
      document.getElementById('m12SubmitBtn').addEventListener('click', function () { onSubmitPartI(container, attempt, responses); });
    }

    drawQuestion();
  }

  var saveTimer = null;
  function saveProgressDebounced(attemptId, responses) {
    if (isReview()) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      apiPost('/save-progress', { attemptId: attemptId, part: 1, responses: responses });
    }, 900);
  }

  async function onSubmitPartI(container, attempt, responses) {
    if (isReview()) { setReviewFixtureKey('part2'); return renderFromStatus(container, fixtureStatusFor('part2')); }
    container.innerHTML = frame('<p class="body-text">Submitting Part I…</p>');
    var res = await apiPost('/submit-part1', { attemptId: attempt.id, responses: responses });
    if (!res.ok) {
      container.innerHTML = frame('<p class="body-text">Could not submit Part I. Your answers were saved — please try again.</p><button class="m12x-btn" id="m12Retry">Retry</button>');
      var retry = document.getElementById('m12Retry');
      if (retry) retry.addEventListener('click', function () { renderPartI(container, attempt); });
      return;
    }
    renderTransition(container, COPY.part1to2, function () { loadAndRenderPartII(container, attempt.id); });
  }

  function renderTransition(container, copy, onContinue) {
    var html = '<h1 class="sec-title">' + esc(copy.title) + '</h1>' + paras(copy.body) + '<button class="m12x-btn" id="m12TransitionBtn">' + esc(copy.button) + '</button>';
    container.innerHTML = frame(html);
    var btn = document.getElementById('m12TransitionBtn');
    if (btn) btn.addEventListener('click', onContinue);
  }

  async function loadAndRenderPartII(container, attemptId) {
    if (isReview()) return renderPartII(container, attemptId, fixtureCases());
    var res = await apiGet('/get-part?attemptId=' + encodeURIComponent(attemptId) + '&part=2');
    if (!res.ok) { container.innerHTML = frame('<p class="body-text">Could not load Applied Cases.</p>'); return; }
    renderPartII(container, attemptId, res.body.cases);
  }

  // A part is "answered" enough to allow submission: a deterministic part
  // has some response recorded; a short-response part has non-empty text.
  // Case submission locks the case permanently, so this guards against
  // accidentally losing a scored case to a blank answer, not against
  // choosing "wrong" -- there is no wrong shape to block here.
  function casePartAnswered(part, responses) {
    var r = responses[part.id];
    if (part.type === 'structured-short-response') return !!(r && String(r).trim());
    if (part.type === 'multi-select') return Array.isArray(r) && r.length > 0;
    if (part.type === 'classification') {
      if (!r) return false;
      return (part.items || []).every(function (item) { return !!r[item.id]; });
    }
    if (part.type === 'sequencing') return Array.isArray(r) && r.length === (part.choices || []).length;
    return r != null; // single-best-answer
  }

  function renderCasePartFieldset(part, responses) {
    var html = '<div class="m12x-case-part"><fieldset><legend class="m12x-q">' + multilineInline(part.prompt) + '</legend>';
    if (part.type === 'structured-short-response') {
      var val = responses[part.id] || '';
      var taId = 'm12CasePart_' + part.id.replace(/[^a-zA-Z0-9]/g, '_');
      html += '<div class="m12x-shortresponse-row"><textarea class="cp-input" id="' + taId + '" data-part="' + part.id + '" rows="2" aria-label="Your response">' + esc(val) + '</textarea>' + voiceButtonHtml(taId) + '</div>';
    } else if (part.type === 'single-best-answer') {
      (part.choices || []).forEach(function (choice, i) {
        html += choiceHtml('cpart-' + part.id, part.id, i, choice, responses[part.id] === i, 'radio');
      });
    } else if (part.type === 'multi-select') {
      html += '<span class="m12x-select-hint">Select all that apply</span>';
      (part.choices || []).forEach(function (choice, i) {
        var arr = responses[part.id] || [];
        html += choiceHtml('cpart-' + part.id + '-' + i, part.id, i, choice, arr.indexOf(i) !== -1, 'checkbox');
      });
    } else if (part.type === 'sequencing') {
      var order = responses[part.id] || (part.choices || []).map(function (_, i) { return i; });
      responses[part.id] = order;
      html += '<ol class="m12x-seq">';
      order.forEach(function (choiceIdx, pos) {
        html += '<li class="m12x-seq-item"><span class="m12x-seq-num" aria-hidden="true">' + (pos + 1) + '</span><span class="m12x-seq-text">' + esc(part.choices[choiceIdx]) + '</span><span class="m12x-seq-controls">' +
          '<button type="button" class="m12x-seq-arrow" data-seq-up="' + part.id + '" data-pos="' + pos + '" aria-label="Move up"' + (pos === 0 ? ' disabled' : '') + '>▲</button>' +
          '<button type="button" class="m12x-seq-arrow" data-seq-down="' + part.id + '" data-pos="' + pos + '" aria-label="Move down"' + (pos === order.length - 1 ? ' disabled' : '') + '>▼</button></span></li>';
      });
      html += '</ol>';
    } else if (part.type === 'classification') {
      (part.items || []).forEach(function (item) {
        html += '<div class="m12x-classify-item"><div class="m12x-classify-label">' + esc(item.label) + '</div><div class="m12x-classify-options" role="radiogroup" aria-label="' + esc(item.label) + '">';
        (part.categories || []).forEach(function (cat) {
          var current = (responses[part.id] || {})[item.id];
          var checked = current === cat;
          html += '<label class="m12x-chip' + (checked ? ' selected' : '') + '"><input type="radio" name="cpart-' + part.id + '-' + item.id + '" data-part="' + part.id + '" data-item="' + esc(item.id) + '" data-cat="' + esc(cat) + '"' + (checked ? ' checked' : '') + '>' + esc(cat) + '</label>';
        });
        html += '</div></div>';
      });
    }
    html += '</fieldset></div>';
    return html;
  }

  function wireCasePartInputs(container, part, responses, onChange, onLightChange) {
    if (part.type === 'structured-short-response') {
      // Deliberately does NOT call onChange() (a full redraw) on every
      // keystroke -- that would rebuild the textarea's DOM node mid-typing
      // and drop the cursor/focus. Only the submit-button gating updates.
      var ta = container.querySelector('textarea[data-part="' + part.id + '"]');
      if (ta) {
        autoGrow(ta, 140);
        ta.addEventListener('input', function () { responses[part.id] = ta.value; autoGrow(ta, 140); onLightChange(); });
      }
      return;
    }
    if (part.type === 'single-best-answer') {
      Array.prototype.forEach.call(container.querySelectorAll('input[type=radio][data-part="' + part.id + '"][data-choice]'), function (input) {
        input.addEventListener('change', function () { responses[part.id] = Number(input.getAttribute('data-choice')); onChange(); });
      });
      return;
    }
    if (part.type === 'multi-select') {
      Array.prototype.forEach.call(container.querySelectorAll('input[type=checkbox][data-part="' + part.id + '"]'), function (cb) {
        cb.addEventListener('change', function () {
          var i = Number(cb.getAttribute('data-choice'));
          var arr = (responses[part.id] || []).slice();
          var pos = arr.indexOf(i);
          if (cb.checked && pos === -1) arr.push(i);
          if (!cb.checked && pos !== -1) arr.splice(pos, 1);
          responses[part.id] = arr.sort(function (a, b) { return a - b; });
          onChange();
        });
      });
      return;
    }
    if (part.type === 'sequencing') {
      Array.prototype.forEach.call(container.querySelectorAll('[data-seq-up="' + part.id + '"]'), function (btn) {
        btn.addEventListener('click', function () {
          var pos = Number(btn.getAttribute('data-pos'));
          var order = responses[part.id];
          if (pos > 0) { var tmp = order[pos - 1]; order[pos - 1] = order[pos]; order[pos] = tmp; }
          onChange();
        });
      });
      Array.prototype.forEach.call(container.querySelectorAll('[data-seq-down="' + part.id + '"]'), function (btn) {
        btn.addEventListener('click', function () {
          var pos = Number(btn.getAttribute('data-pos'));
          var order = responses[part.id];
          if (pos < order.length - 1) { var tmp = order[pos + 1]; order[pos + 1] = order[pos]; order[pos] = tmp; }
          onChange();
        });
      });
      return;
    }
    if (part.type === 'classification') {
      Array.prototype.forEach.call(container.querySelectorAll('input[type=radio][data-part="' + part.id + '"]'), function (input) {
        input.addEventListener('change', function () {
          var itemId = input.getAttribute('data-item');
          var cat = input.getAttribute('data-cat');
          var obj = Object.assign({}, responses[part.id] || {});
          obj[itemId] = cat;
          responses[part.id] = obj;
          onChange();
        });
      });
    }
  }

  function renderPartII(container, attemptId, cases) {
    var c = COPY.partII;
    var idx = cases.findIndex(function (k) { return !k.submitted; });
    if (idx === -1) idx = cases.length - 1;
    var current = cases[idx];
    var responses = {};

    function draw() {
      var html = '';
      html += '<div class="mh-eyebrow" style="color:#8a8078;">' + esc(c.eyebrow) + '</div>';
      html += '<h1 class="sec-title">' + esc(c.title) + '</h1>';
      html += disclosureHtml('m12PartIIAbout', 'About this section', paras(c.body));
      html += '<div class="m12x-case-progress">Case ' + (idx + 1) + ' of ' + cases.length + '</div>';
      html += '<div class="m12x-scenario">' + paras(current.scenario) + '</div>';
      current.parts.forEach(function (part) { html += renderCasePartFieldset(part, responses); });
      var allAnswered = current.parts.every(function (part) { return casePartAnswered(part, responses); });
      html += '<div class="m12x-case-submitrow"><button class="m12x-btn" id="m12SubmitCase"' + (allAnswered ? '' : ' disabled') + '>Submit this case</button>';
      html += '<p class="body-text" id="m12CaseHint" style="font-size:0.78rem;color:#8a8078;margin-top:0.5rem;margin-bottom:0;' + (allAnswered ? 'display:none;' : '') + '">Answer every part of this case before submitting — submitting locks it.</p></div>';
      container.innerHTML = frame(html);

      function updateSubmitButtonState() {
        var stillAnswered = current.parts.every(function (part) { return casePartAnswered(part, responses); });
        var submitBtn = document.getElementById('m12SubmitCase');
        var hint = document.getElementById('m12CaseHint');
        if (submitBtn) submitBtn.disabled = !stillAnswered;
        if (hint) hint.style.display = stillAnswered ? 'none' : '';
      }

      current.parts.forEach(function (part) { wireCasePartInputs(container, part, responses, draw, updateSubmitButtonState); });
      var submitBtn = document.getElementById('m12SubmitCase');
      if (submitBtn) submitBtn.addEventListener('click', function () { if (!submitBtn.disabled) onSubmitCase(container, attemptId, cases, idx, responses); });
    }
    draw();
  }

  async function onSubmitCase(container, attemptId, cases, idx, responses) {
    if (isReview()) {
      cases[idx].submitted = true;
      if (idx < cases.length - 1) return renderPartII(container, attemptId, cases);
      return renderTransition(container, COPY.part2to3, function () { setReviewFixtureKey('part3'); loadAndRenderPartIII(container, attemptId); });
    }
    container.innerHTML = frame('<p class="body-text">Submitting case…</p>');
    var res = await apiPost('/submit-case', { attemptId: attemptId, caseId: cases[idx].id, responses: responses });
    if (!res.ok) {
      container.innerHTML = frame('<p class="body-text">Could not submit this case. Your response was saved — please try again.</p><button class="m12x-btn" id="m12Retry">Retry</button>');
      var retry = document.getElementById('m12Retry');
      if (retry) retry.addEventListener('click', function () { renderPartII(container, attemptId, cases); });
      return;
    }
    if (res.body.part2Complete) {
      renderTransition(container, COPY.part2to3, function () { loadAndRenderPartIII(container, attemptId); });
    } else {
      loadAndRenderPartII(container, attemptId);
    }
  }

  async function loadAndRenderPartIII(container, attemptId) {
    if (isReview()) return renderPartIII(container, attemptId, fixtureConversation());
    var res = await apiGet('/get-part?attemptId=' + encodeURIComponent(attemptId) + '&part=3');
    if (!res.ok) { container.innerHTML = frame('<p class="body-text">Could not load the conversation.</p>'); return; }
    if (res.body.allConversationsFinalized) return renderProcessing(container, attemptId);
    renderPartIII(container, attemptId, res.body.conversation);
  }

  function renderPartIII(container, attemptId, conversation) {
    var c = COPY.partIII;
    var name = firstName();
    // The generic Part III welcome is presentation only -- it must never
    // substitute for a selected interview's real primary prompt (that was
    // the exact defect: an empty transcript at the start of ANY conversation
    // fell through to this generic text with an active composer beneath it,
    // so the student's answer to "Ready?" was graded as the response to a
    // primary prompt they never saw). A brand-new conversation now always
    // shows its own primaryPrompt as a real message before the composer is
    // reachable; the welcome + "Let's start with this one" only prepend it
    // once, before the very first conversation of the attempt.
    var transcript;
    if (conversation.transcript && conversation.transcript.length) {
      transcript = conversation.transcript.slice();
    } else if (conversation.isFirstConversation) {
      transcript = [
        { role: 'assistant', content: name ? c.openingWithName(name) : c.openingNoName },
        { role: 'assistant', content: c.startLine },
        { role: 'assistant', content: conversation.primaryPrompt }
      ];
    } else {
      transcript = [
        { role: 'assistant', content: conversation.primaryPrompt }
      ];
    }

    function draw() {
      var html = '';
      html += '<div class="mh-eyebrow" style="color:#8a8078;">' + esc(c.eyebrow) + '</div>';
      html += '<h1 class="sec-title">' + esc(c.title) + '</h1>';
      html += disclosureHtml('m12PartIIIAbout', 'About this conversation', paras(c.body));
      // The structured-test visual language recedes here -- a spacious,
      // warm-neutral conversational surface (same token as the course's
      // callout background, .warn-light) replaces the boxed exam layout.
      html += '<div class="m12x-cadence-env">';
      html += '<div class="m12x-cadence-eyebrow">Practitioner Conversation with Cadence</div>';
      html += '<div class="m12x-chat" aria-live="polite">';
      transcript.forEach(function (t) {
        html += '<div class="m12x-msg ' + (t.role === 'user' ? 'user' : 'assistant') + '">' + esc(t.content) + '</div>';
      });
      html += '</div>';
      html += '<label for="m12ChatInput" class="body-text" style="display:block; margin-bottom:6px; font-size:0.78rem;">Your response</label>';
      html += '<div class="m12x-composer"><textarea id="m12ChatInput" class="cp-input" rows="1" aria-label="Your response to Cadence"></textarea>' + voiceButtonHtml('m12ChatInput') + '<button class="cp-btn" id="m12ChatSend" aria-label="Send response to Cadence"><svg viewBox="0 0 14 14" fill="none"><path d="M7 1.5V12.5M7 1.5L2.5 6M7 1.5L11.5 6" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>';
      html += '</div>';
      container.innerHTML = frame(html);
      var input = document.getElementById('m12ChatInput');
      if (input) {
        autoGrow(input, 120);
        input.addEventListener('input', function () { autoGrow(input, 120); });
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSendInterviewTurn(container, attemptId, conversation, transcript); }
        });
      }
      var send = document.getElementById('m12ChatSend');
      if (send) send.addEventListener('click', function () { onSendInterviewTurn(container, attemptId, conversation, transcript); });
    }
    draw();
  }

  async function onSendInterviewTurn(container, attemptId, conversation, transcript) {
    var input = document.getElementById('m12ChatInput');
    var text = input ? input.value.trim() : '';
    if (!text) return;
    transcript.push({ role: 'user', content: text });

    if (isReview()) {
      transcript.push({ role: 'assistant', content: firstName() ? COPY.partIII.closingWithName(firstName()) : COPY.partIII.closingNoName });
      renderPartIII(container, attemptId, { id: conversation.id, transcript: transcript });
      setTimeout(function () { setReviewFixtureKey('processing'); renderProcessing(container, attemptId); }, 900);
      return;
    }

    var res = await apiPost('/submit-interview-turn', { attemptId: attemptId, interviewId: conversation.id, studentResponse: text });
    if (!res.ok) {
      transcript.pop();
      renderPartIII(container, attemptId, { id: conversation.id, transcript: transcript });
      return;
    }
    if (res.body.needsFollowUp) {
      transcript.push({ role: 'assistant', content: COPY.partIII.followUpLead + ' ' + res.body.followUpPrompt });
      renderPartIII(container, attemptId, { id: conversation.id, transcript: transcript });
      return;
    }
    var name = firstName();
    var closing = res.body.allConversationsFinalized ? (name ? COPY.partIII.closingWithName(name) : COPY.partIII.closingNoName) : res.body.transitionLine;
    transcript.push({ role: 'assistant', content: closing || '' });
    renderPartIII(container, attemptId, { id: conversation.id, transcript: transcript });
    if (res.body.allConversationsFinalized) {
      setTimeout(function () { renderProcessing(container, attemptId); }, 1200);
    } else {
      setTimeout(function () { loadAndRenderPartIII(container, attemptId); }, 1200);
    }
  }

  async function renderProcessing(container, attemptId) {
    var c = COPY.processing;
    container.innerHTML = frame('<h1 class="sec-title">' + esc(c.title) + '</h1>' + paras(c.body));
    if (isReview()) {
      setTimeout(function () { renderFromStatus(container, fixtureStatusFor('pass')); }, 1200);
      return;
    }
    var res = await apiPost('/finalize-assessment', { attemptId: attemptId });
    if (!res.ok) {
      container.innerHTML = frame(paras(c.body) + '<p class="body-text">This is taking longer than expected. Please check back shortly.</p><button class="m12x-btn" id="m12Recheck">Check again</button>');
      var btn = document.getElementById('m12Recheck');
      if (btn) btn.addEventListener('click', function () { Module12Cert.render(container); });
      return;
    }
    Module12Cert.render(container);
  }

  function performanceReviewBlock(review) {
    if (!review) return '';
    var html = '<div class="m12x-perf-card">';
    html += '<div class="m12x-perf-head"><div><div class="m12x-perf-title">AIMT Head Spa Certification</div><div class="m12x-tile-meta" style="margin-bottom:0;">Certification Performance Review · Attempt ' + review.attemptNumber + (review.decisionAt ? ' · ' + new Date(review.decisionAt).toLocaleDateString() : '') + '</div></div>';
    html += '<div class="m12x-perf-score">' + pct(review.overallScore) + '</div></div>';
    html += '<div class="m12x-domain-row"><span>Knowledge & Retention</span><span>' + pct(review.componentScores.knowledge) + '</span></div>';
    html += '<div class="m12x-domain-row"><span>Applied Practitioner Cases</span><span>' + pct(review.componentScores.appliedCases) + '</span></div>';
    html += '<div class="m12x-domain-row"><span>Practitioner Conversation</span><span>' + pct(review.componentScores.interview) + '</span></div>';
    html += '<div style="margin-top:0.8rem;"><strong style="font-size:0.85rem;">Critical Competency Areas</strong>';
    var allCleared = (review.criticalDomainResults || []).every(function (d) { return d.cleared; });
    if (allCleared) {
      html += '<div class="m12x-domain-row cleared"><span>All Cleared</span><span>✓</span></div>';
    } else {
      (review.criticalDomainResults || []).forEach(function (d) {
        if (!d.cleared) html += '<div class="m12x-domain-row uncleared"><span>' + esc(DOMAIN_LABELS[d.domainId] || d.domainId) + '</span><span>Needs review</span></div>';
      });
    }
    html += '</div></div>';
    return html;
  }

  function renderStateC(container, status) {
    var html = '<div class="m12x-pass-banner">';
    html += '<div class="mh-eyebrow" style="color:#8a8078;">' + esc(COPY.passed.eyebrow) + '</div>';
    html += '<h1 class="sec-title">' + esc(COPY.passed.title) + '</h1>';
    html += paras(COPY.passed.body);
    html += '</div>';
    html += performanceReviewBlock(status.performanceReview);
    var existing = document.getElementById('module12Wrap');
    if (existing) html += existing.innerHTML;
    html += '<h2 class="sec-title" style="margin-top:1.3rem;">' + esc(COPY.passed.courseCloseTitle) + '</h2>' + paras(COPY.passed.courseCloseBody);
    container.innerHTML = frame(html);
  }

  function renderStateD(container, status) {
    var html = '<div class="m12x-notyet-banner">';
    html += '<div class="mh-eyebrow" style="color:#8a8078;">' + esc(COPY.notYetPassed.eyebrow) + '</div>';
    html += '<h1 class="sec-title">' + esc(COPY.notYetPassed.title) + '</h1>';
    html += paras(COPY.notYetPassed.body);
    html += '</div>';
    html += performanceReviewBlock(status.performanceReview);

    var hasUnclearedCritical = status.performanceReview && (status.performanceReview.criticalDomainResults || []).some(function (d) { return !d.cleared; });
    if (hasUnclearedCritical) {
      html += '<div class="key-point kp-warn"><span class="kp-icon" aria-hidden="true">⚠</span><div class="kp-body"><div class="kp-eyebrow">' + esc(COPY.requiredCompetencyReview.title) + '</div>' + paras(COPY.requiredCompetencyReview.body) + '</div></div>';
    }

    var attemptNumber = (status.performanceReview && status.performanceReview.attemptNumber) || 1;
    var attemptCopy = COPY.attempts[Math.min(attemptNumber, 4)];
    if (attemptCopy) {
      html += '<h2 class="sec-title" style="margin-top:1.2rem;">' + esc(attemptCopy.title) + '</h2>';
      html += paras(attemptCopy.body);
      html += '<div style="display:flex; gap:0.6rem; flex-wrap:wrap;">';
      attemptCopy.actions.forEach(function (label, i) {
        html += '<button class="m12x-btn' + (i > 0 ? ' secondary' : '') + '" data-m12-action="' + esc(label) + '">' + esc(label) + '</button>';
      });
      html += '</div>';
    }

    html += disclosureHtml('m12AssessmentReviewDetail', esc(COPY.assessmentReview.title), paras(COPY.assessmentReview.body) + '<button class="m12x-btn secondary" id="m12RequestReview">' + esc(COPY.assessmentReview.action) + '</button>');

    container.innerHTML = frame(html);

    Array.prototype.forEach.call(container.querySelectorAll('[data-m12-action]'), function (btn) {
      btn.addEventListener('click', function () { onAttemptAction(container, status, btn.getAttribute('data-m12-action')); });
    });
    var reviewBtn = document.getElementById('m12RequestReview');
    if (reviewBtn) reviewBtn.addEventListener('click', function () { onRequestAssessmentReview(container, status); });
  }

  async function onAttemptAction(container, status, label) {
    if (/^Start Attempt/.test(label) || label === 'Start Final Exam') {
      return onStartExam(container);
    }
    if (label === 'Request Educator Remediation Session') {
      if (isReview()) { alert('Review Mode — no real request was created.'); return; }
      var attemptId = status.performanceReview && status.performanceReview.attemptId;
      await apiPost('/request-educator-remediation', { attemptId: attemptId });
      Module12Cert.render(container);
      return;
    }
    // "Review My Recommended Sections", "Begin My Remediation Plan", "View Review Status" —
    // navigate the student back to course content / dashboard; no dedicated
    // remediation-content UI exists yet (content pending a later, separate task).
    if (typeof window.showHome === 'function') window.showHome();
  }

  async function onRequestAssessmentReview(container, status) {
    var explanation = prompt('Briefly describe the issue with your assessment:');
    if (!explanation) return;
    if (isReview()) { alert('Review Mode — no real request was created.'); return; }
    var attemptId = status.performanceReview && status.performanceReview.attemptId;
    var res = await apiPost('/request-review', { attemptId: attemptId, studentExplanation: explanation });
    alert(res.ok ? 'Your review request has been submitted.' : 'Could not submit your request — please try again.');
  }

  function isReview() {
    return !!(window.ReviewMode && window.ReviewMode.isActive());
  }

  // ---- Minimal fixture content for Review Mode Parts I-III (never real exam content) ----
  function fixturePartIItems() {
    var items = [];
    for (var i = 1; i <= 5; i++) {
      items.push({ id: 'review-fixture-k' + i, prompt: 'Review Mode fixture question ' + i + ' (not real exam content).', choices: ['Fixture choice A', 'Fixture choice B', 'Fixture choice C', 'Fixture choice D'] });
    }
    return items;
  }
  function fixtureCases() {
    return [1, 2].map(function (i) {
      return {
        id: 'review-fixture-c' + i,
        scenario: 'Review Mode fixture case ' + i + ' scenario (not real exam content).',
        parts: [{ id: 'p1', type: 'single-best-answer', prompt: 'Fixture prompt.', choices: ['Fixture A', 'Fixture B'] }],
        submitted: false
      };
    });
  }
  function fixtureConversation() {
    return { id: 'review-fixture-i1', primaryPrompt: 'Review Mode fixture conversation prompt (not real exam content).', transcript: [], isFirstConversation: true };
  }

  function renderFromStatus(container, status) {
    injectStyleOnce();
    var fixtureBarHtml = isReview() ? reviewFixtureBar(currentReviewFixtureKey()) : '';

    function wireFixtureBar() {
      if (!isReview()) return;
      var bar = container.querySelector('.m12x-review-fixtures');
      if (!bar) return;
      Array.prototype.forEach.call(bar.querySelectorAll('[data-m12-fixture]'), function (btn) {
        btn.addEventListener('click', function () {
          var key = btn.getAttribute('data-m12-fixture');
          setReviewFixtureKey(key);
          renderFromStatus(container, fixtureStatusFor(key));
        });
      });
    }

    if (!status.eligible) {
      container.innerHTML = frame(fixtureBarHtml + '<p class="body-text">Complete Modules 1–11 before starting the final certification assessment.</p>');
      wireFixtureBar();
      return;
    }

    var prepend = function () {
      if (fixtureBarHtml) container.querySelector('.m12x').insertAdjacentHTML('afterbegin', fixtureBarHtml);
      wireFixtureBar();
    };

    if (status.state === 'A') { renderStateA(container, status); prepend(); return; }
    if (status.state === 'C') { renderStateC(container, status); prepend(); return; }
    if (status.state === 'D') { renderStateD(container, status); prepend(); return; }
    // state === 'B'
    var attemptStatus = status.inProgressAttempt ? status.inProgressAttempt.status : 'in_progress';
    var attemptId = status.inProgressAttempt ? status.inProgressAttempt.id : 'fixture';
    if (attemptStatus === 'in_progress') {
      if (isReview()) { renderPartI(container, { id: attemptId, partI: { items: fixturePartIItems(), responses: {} } }); }
      else { onStartExam(container); return; }
    } else if (attemptStatus === 'part1_locked') {
      loadAndRenderPartII(container, attemptId);
    } else if (attemptStatus === 'part2_locked') {
      loadAndRenderPartIII(container, attemptId);
    } else {
      renderProcessing(container, attemptId);
    }
    prepend();
  }

  var Module12Cert = {
    render: async function (container) {
      injectStyleOnce();
      container.innerHTML = frame('<p class="body-text">Loading…</p>');
      if (isReview()) {
        renderFromStatus(container, fixtureStatusFor(currentReviewFixtureKey()));
        return;
      }
      var res = await apiGet('/get-status');
      if (!res.ok) {
        container.innerHTML = frame('<p class="body-text">' + esc((res.body && res.body.error) || 'Could not load your certification status.') + '</p>');
        return;
      }
      renderFromStatus(container, res.body);
    }
  };

  window.Module12Cert = Module12Cert;
})();
