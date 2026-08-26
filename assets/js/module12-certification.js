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
      passingBullets: [
        '80% or higher overall',
        '75% or higher — Knowledge & Retention',
        '75% or higher — Applied Practitioner Cases',
        '80% or higher — Practitioner Conversation',
        'All required critical competency areas cleared'
      ],
      passingClose: 'A strong overall score cannot override an unresolved issue in an area involving professional scope, client safety, consent/touch authority, or sanitation/process integrity.\n\nLikewise, one missed multiple-choice question does not automatically mean you failed a critical competency. AIMT looks for the actual reasoning and pattern of understanding demonstrated across the assessment.',
      checkpointTitle: 'What about the checkpoints you already completed?',
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
      openingWithName: function (name) { return 'You made it to the final part, ' + name + '. We’re done with multiple choice. I just want to talk through a few situations with you and understand how you think about them. There isn’t one perfect script I’m looking for, so answer naturally. Ready?'; },
      openingNoName: 'You made it to the final part. We’re done with multiple choice. I just want to talk through a few situations with you and understand how you think about them. There isn’t one perfect script I’m looking for, so answer naturally. Ready?',
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
  function paras(text) {
    return String(text || '').split('\n\n').map(function (p) { return '<p class="body-text">' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
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
      '.m12x .m12x-part-card { background: rgba(255,255,255,0.85); border: 0.5px solid rgba(0,0,0,0.08); border-radius: var(--aimt-radius-md); padding: 1.1rem 1.2rem; margin-bottom: 1rem; }',
      '.m12x .m12x-part-num { font-family: var(--aimt-font-mono); font-size: 0.62rem; letter-spacing: 0.12em; color: #8a8078; margin-bottom: 4px; }',
      '.m12x .m12x-part-title { font-family: var(--aimt-font-serif); font-size: 1.02rem; margin-bottom: 2px; }',
      '.m12x .m12x-part-meta { font-family: var(--aimt-font-mono); font-size: 0.62rem; letter-spacing: 0.08em; color: #8a8078; margin-bottom: 0.6rem; }',
      '.m12x .m12x-btn { display: inline-block; background: var(--text); color: #fff; border: none; border-radius: var(--aimt-radius-sm); padding: 0.85rem 1.4rem; font-family: var(--aimt-font-sans); font-size: 0.85rem; font-weight: 500; cursor: pointer; margin-top: 0.6rem; }',
      '.m12x .m12x-btn.secondary { background: transparent; color: var(--text); border: 1px solid rgba(0,0,0,0.2); }',
      '.m12x .m12x-btn:disabled { opacity: 0.5; cursor: not-allowed; }',
      '.m12x .m12x-progress { font-family: var(--aimt-font-mono); font-size: 0.68rem; letter-spacing: 0.08em; color: #8a8078; margin-bottom: 0.8rem; }',
      '.m12x .m12x-q { font-family: var(--aimt-font-serif); font-size: 0.98rem; line-height: 1.55; margin-bottom: 0.9rem; }',
      '.m12x .m12x-choice { display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.7rem 0.85rem; border: 0.5px solid rgba(0,0,0,0.12); border-radius: var(--aimt-radius-sm); margin-bottom: 0.55rem; cursor: pointer; font-family: var(--aimt-font-sans); font-size: 0.85rem; line-height: 1.5; }',
      '.m12x .m12x-choice input { margin-top: 3px; min-width: 18px; min-height: 18px; }',
      '.m12x .m12x-choice.selected { border-color: var(--text); background: rgba(0,0,0,0.03); }',
      '.m12x .m12x-jumpgrid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; margin-bottom: 1rem; }',
      '.m12x .m12x-jump { min-height: 34px; border-radius: var(--aimt-radius-sm); border: 0.5px solid rgba(0,0,0,0.15); background: transparent; font-family: var(--aimt-font-mono); font-size: 0.66rem; cursor: pointer; }',
      '.m12x .m12x-jump.answered { background: var(--aimt-success-light); border-color: var(--aimt-success); }',
      '.m12x .m12x-jump.current { outline: 2px solid var(--text); }',
      '.m12x .m12x-case-scenario { font-family: var(--aimt-font-serif); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1rem; }',
      '.m12x .m12x-chat { display: flex; flex-direction: column; gap: 0.7rem; margin-bottom: 1rem; }',
      '.m12x .m12x-msg { max-width: 85%; padding: 0.7rem 0.9rem; border-radius: var(--aimt-radius-md); font-size: 0.88rem; line-height: 1.55; font-family: var(--aimt-font-sans); }',
      '.m12x .m12x-msg.assistant { background: rgba(0,0,0,0.04); align-self: flex-start; }',
      '.m12x .m12x-msg.user { background: var(--text); color: #fff; align-self: flex-end; }',
      '.m12x .m12x-domain-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 0.5px solid rgba(0,0,0,0.08); font-size: 0.85rem; }',
      '.m12x .m12x-domain-row.cleared { color: var(--aimt-success); }',
      '.m12x .m12x-domain-row.uncleared { color: var(--aimt-warning); }',
      '.m12x .m12x-review-fixtures { display: flex; flex-wrap: wrap; gap: 6px; padding: 0.6rem; border: 1px dashed rgba(0,0,0,0.25); border-radius: 8px; margin-bottom: 1rem; }',
      '.m12x .m12x-review-fixtures button { font-size: 0.65rem; padding: 4px 8px; border-radius: 6px; border: 0.5px solid rgba(0,0,0,0.2); background: #fff; cursor: pointer; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function frame(inner) {
    return '<div class="m12x lesson-wrap">' + inner + '</div>';
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
    html += '<h1 class="sec-title" style="max-width:none;">' + esc(c.title) + '</h1>';
    html += c.opening.map(function (p) { return '<p class="body-text">' + esc(p) + '</p>'; }).join('');
    html += '<h2 class="sec-title" style="max-width:none;margin-top:1.4rem;">' + esc(c.howItWorksTitle) + '</h2>';
    c.parts.forEach(function (part) {
      html += '<div class="m12x-part-card">';
      html += '<div class="m12x-part-num">' + esc(part.num) + '</div>';
      html += '<div class="m12x-part-title">' + esc(part.title) + '</div>';
      html += '<div class="m12x-part-meta">' + esc(part.meta) + '</div>';
      html += part.body.map(function (p) { return '<p class="body-text">' + esc(p) + '</p>'; }).join('');
      html += '</div>';
    });
    html += '<h2 class="sec-title" style="max-width:none;margin-top:1.2rem;">' + esc(c.passingTitle) + '</h2>';
    html += '<p class="body-text">' + esc(c.passingIntro) + '</p>';
    html += '<ul style="margin:0.6rem 0 1rem 1.2rem;">' + c.passingBullets.map(function (b) { return '<li class="body-text">' + esc(b) + '</li>'; }).join('') + '</ul>';
    html += paras(c.passingClose);
    html += '<div class="key-point"><span class="kp-icon" aria-hidden="true">✦</span><div class="kp-body"><div class="kp-eyebrow">' + esc(c.checkpointTitle) + '</div>' + paras(c.checkpointBody) + '</div></div>';
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
    var idx = 0;

    function draw() {
      var total = items.length;
      var item = items[idx];
      var answeredCount = Object.keys(responses).length;
      var html = '';
      html += '<div class="mh-eyebrow" style="color:#8a8078;">' + esc(c.eyebrow) + '</div>';
      html += '<h1 class="sec-title" style="max-width:none;">' + esc(c.title) + '</h1>';
      html += '<p class="body-text" style="margin-bottom:0.4rem;">' + esc(c.meta) + '</p>';
      html += paras(c.body);
      html += '<div class="m12x-progress" aria-live="polite">' + esc(c.progress(idx + 1, total)) + ' — ' + answeredCount + ' answered</div>';
      html += '<div class="m12x-jumpgrid" role="group" aria-label="Jump to question">';
      for (var i = 0; i < total; i++) {
        var answered = responses[items[i].id] != null;
        html += '<button class="m12x-jump' + (answered ? ' answered' : '') + (i === idx ? ' current' : '') + '" data-jump="' + i + '" aria-label="Question ' + (i + 1) + (answered ? ', answered' : ', unanswered') + '">' + (i + 1) + '</button>';
      }
      html += '</div>';
      html += '<fieldset><legend class="m12x-q">' + esc(item.prompt) + '</legend>';
      item.choices.forEach(function (choice, i) {
        var checked = responses[item.id] === i;
        html += '<label class="m12x-choice' + (checked ? ' selected' : '') + '"><input type="radio" name="m12q" value="' + i + '"' + (checked ? ' checked' : '') + '> <span>' + esc(choice) + '</span></label>';
      });
      html += '</fieldset>';
      html += '<div style="display:flex; gap:0.6rem; margin-top:0.8rem;">';
      html += '<button class="m12x-btn secondary" id="m12PrevQ"' + (idx === 0 ? ' disabled' : '') + '>Previous</button>';
      html += '<button class="m12x-btn secondary" id="m12NextQ"' + (idx === total - 1 ? ' disabled' : '') + '>Next</button>';
      html += '</div>';
      html += '<div style="margin-top:1.4rem; border-top: 0.5px solid rgba(0,0,0,0.1); padding-top:1rem;">';
      html += '<h2 class="sec-title" style="max-width:none;">' + esc(c.submitTitle) + '</h2>';
      html += paras(c.submitBody);
      html += '<button class="m12x-btn secondary" id="m12ReviewBtn">' + esc(c.reviewBtn) + '</button> ';
      html += '<button class="m12x-btn" id="m12SubmitBtn">' + esc(c.submitBtn) + '</button>';
      html += '</div>';
      container.innerHTML = frame(html);

      Array.prototype.forEach.call(container.querySelectorAll('input[name="m12q"]'), function (input) {
        input.addEventListener('change', function () {
          responses[item.id] = Number(input.value);
          saveProgressDebounced(attempt.id, responses);
          draw();
        });
      });
      Array.prototype.forEach.call(container.querySelectorAll('[data-jump]'), function (btn) {
        btn.addEventListener('click', function () { idx = Number(btn.getAttribute('data-jump')); draw(); });
      });
      var prevBtn = document.getElementById('m12PrevQ');
      var nextBtn = document.getElementById('m12NextQ');
      if (prevBtn) prevBtn.addEventListener('click', function () { if (idx > 0) { idx--; draw(); } });
      if (nextBtn) nextBtn.addEventListener('click', function () { if (idx < total - 1) { idx++; draw(); } });
      var reviewBtn = document.getElementById('m12ReviewBtn');
      if (reviewBtn) reviewBtn.addEventListener('click', function () { idx = 0; draw(); });
      var submitBtn = document.getElementById('m12SubmitBtn');
      if (submitBtn) submitBtn.addEventListener('click', function () { onSubmitPartI(container, attempt, responses); });
    }
    draw();
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
    var html = '<h1 class="sec-title" style="max-width:none;">' + esc(copy.title) + '</h1>' + paras(copy.body) + '<button class="m12x-btn" id="m12TransitionBtn">' + esc(copy.button) + '</button>';
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

  function renderPartII(container, attemptId, cases) {
    var c = COPY.partII;
    var idx = cases.findIndex(function (k) { return !k.submitted; });
    if (idx === -1) idx = cases.length - 1;
    var current = cases[idx];
    var responses = {};

    function draw() {
      var html = '';
      html += '<div class="mh-eyebrow" style="color:#8a8078;">' + esc(c.eyebrow) + '</div>';
      html += '<h1 class="sec-title" style="max-width:none;">' + esc(c.title) + '</h1>';
      html += '<p class="body-text">' + esc(c.meta) + ' — case ' + (idx + 1) + ' of ' + cases.length + '</p>';
      html += paras(c.body);
      html += '<div class="m12x-part-card"><div class="m12x-case-scenario">' + esc(current.scenario) + '</div>';
      current.parts.forEach(function (part) {
        html += '<fieldset style="margin-bottom:0.8rem;"><legend class="m12x-q">' + esc(part.prompt) + '</legend>';
        if (part.type === 'structured-short-response') {
          html += '<textarea class="cp-input" data-part="' + part.id + '" rows="3" style="width:100%;"></textarea>';
        } else {
          (part.choices || []).forEach(function (choice, i) {
            html += '<label class="m12x-choice"><input type="checkbox" data-part="' + part.id + '" data-choice="' + i + '"> <span>' + esc(choice) + '</span></label>';
          });
        }
        html += '</fieldset>';
      });
      html += '<button class="m12x-btn" id="m12SubmitCase">Submit this case</button></div>';
      container.innerHTML = frame(html);

      Array.prototype.forEach.call(container.querySelectorAll('textarea[data-part]'), function (ta) {
        ta.addEventListener('input', function () { responses[ta.getAttribute('data-part')] = ta.value; });
      });
      Array.prototype.forEach.call(container.querySelectorAll('input[type=checkbox][data-part]'), function (cb) {
        cb.addEventListener('change', function () {
          var partId = cb.getAttribute('data-part');
          responses[partId] = Number(cb.getAttribute('data-choice'));
        });
      });
      var submitBtn = document.getElementById('m12SubmitCase');
      if (submitBtn) submitBtn.addEventListener('click', function () { onSubmitCase(container, attemptId, cases, idx, responses); });
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
    var transcript = (conversation.transcript && conversation.transcript.length) ? conversation.transcript.slice() : [
      { role: 'assistant', content: name ? c.openingWithName(name) : c.openingNoName }
    ];

    function draw() {
      var html = '';
      html += '<div class="mh-eyebrow" style="color:#8a8078;">' + esc(c.eyebrow) + '</div>';
      html += '<h1 class="sec-title" style="max-width:none;">' + esc(c.title) + '</h1>';
      html += paras(c.body);
      html += '<div class="m12x-chat" aria-live="polite">';
      transcript.forEach(function (t) {
        html += '<div class="m12x-msg ' + (t.role === 'user' ? 'user' : 'assistant') + '">' + esc(t.content) + '</div>';
      });
      html += '</div>';
      html += '<label for="m12ChatInput" style="display:block; margin-bottom:6px; font-size:0.8rem;">Your response</label>';
      html += '<textarea id="m12ChatInput" class="cp-input" rows="4" style="width:100%;" aria-label="Your response to Cadence"></textarea>';
      html += '<button class="m12x-btn" id="m12ChatSend">Send</button>';
      container.innerHTML = frame(html);
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
    container.innerHTML = frame('<h1 class="sec-title" style="max-width:none;">' + esc(c.title) + '</h1>' + paras(c.body));
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

  function performanceReviewBlock(review, forPassing) {
    if (!review) return '';
    var html = '<div class="m12x-part-card">';
    html += '<div class="m12x-part-title">AIMT Head Spa Certification</div>';
    html += '<div class="m12x-part-meta">Certification Performance Review</div>';
    html += '<p class="body-text">Status: ' + (review.decision === 'pass' ? 'Certified' : 'Not yet earned') + ' &middot; Overall Score: ' + pct(review.overallScore) + ' &middot; Attempt: ' + review.attemptNumber + (review.decisionAt ? ' &middot; Assessment Date: ' + new Date(review.decisionAt).toLocaleDateString() : '') + '</p>';
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
    var html = '<div class="mh-eyebrow" style="color:#8a8078;">' + esc(COPY.passed.eyebrow) + '</div>';
    html += '<h1 class="sec-title" style="max-width:none;">' + esc(COPY.passed.title) + '</h1>';
    html += paras(COPY.passed.body);
    html += performanceReviewBlock(status.performanceReview, true);
    var existing = document.getElementById('module12Wrap');
    if (existing) html += existing.innerHTML;
    html += '<div class="m12x-part-card"><h2 class="sec-title" style="max-width:none;">' + esc(COPY.passed.courseCloseTitle) + '</h2>' + paras(COPY.passed.courseCloseBody) + '</div>';
    container.innerHTML = frame(html);
  }

  function renderStateD(container, status) {
    var html = '<div class="mh-eyebrow" style="color:#8a8078;">' + esc(COPY.notYetPassed.eyebrow) + '</div>';
    html += '<h1 class="sec-title" style="max-width:none;">' + esc(COPY.notYetPassed.title) + '</h1>';
    html += paras(COPY.notYetPassed.body);
    html += performanceReviewBlock(status.performanceReview, false);

    var hasUnclearedCritical = status.performanceReview && (status.performanceReview.criticalDomainResults || []).some(function (d) { return !d.cleared; });
    if (hasUnclearedCritical) {
      html += '<div class="key-point kp-warn"><span class="kp-icon" aria-hidden="true">⚠</span><div class="kp-body"><div class="kp-eyebrow">' + esc(COPY.requiredCompetencyReview.title) + '</div>' + paras(COPY.requiredCompetencyReview.body) + '</div></div>';
    }

    var attemptNumber = (status.performanceReview && status.performanceReview.attemptNumber) || 1;
    var attemptCopy = COPY.attempts[Math.min(attemptNumber, 4)];
    if (attemptCopy) {
      html += '<h2 class="sec-title" style="max-width:none;">' + esc(attemptCopy.title) + '</h2>';
      html += paras(attemptCopy.body);
      attemptCopy.actions.forEach(function (label, i) {
        html += '<button class="m12x-btn' + (i > 0 ? ' secondary' : '') + '" data-m12-action="' + esc(label) + '">' + esc(label) + '</button> ';
      });
    }

    html += '<div class="m12x-part-card" style="margin-top:1.2rem;"><h2 class="sec-title" style="max-width:none;">' + esc(COPY.assessmentReview.title) + '</h2>' + paras(COPY.assessmentReview.body) + '<button class="m12x-btn secondary" id="m12RequestReview">' + esc(COPY.assessmentReview.action) + '</button></div>';

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
    return { id: 'review-fixture-i1', primaryPrompt: 'Review Mode fixture conversation prompt (not real exam content).', transcript: [] };
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
