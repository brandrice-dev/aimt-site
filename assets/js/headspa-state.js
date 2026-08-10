(function() {
  const STORAGE_KEY = 'levo_app';
  const LEGACY_PROFILE_KEY = 'levo4_profile';
  const SCHEMA_VERSION = 2;
  const MODULE_COUNT = 12;

  function now() {
    return Date.now();
  }

  /* ══════════════════════════════════════════════════════
     COURSE REVIEW MODE — audit-only, owner inspection.
     Never activates on a production hostname. Session-only;
     never touches localStorage['levo_app'] or progress sync.
     See docs/course-audit/implementation-log.md for the audit trail.
     ══════════════════════════════════════════════════════ */
  const REVIEW_MODE_SESSION_KEY = 'aimt_review_mode';
  const REVIEW_MODE_PRODUCTION_HOSTS = [
    'aimtrichology.com',
    'www.aimtrichology.com',
    'aimt-site.pages.dev' /* bare Cloudflare Pages production alias */
  ];

  function isReviewModeProductionHost(hostname) {
    const h = (hostname || '').toLowerCase();
    return REVIEW_MODE_PRODUCTION_HOSTS.indexOf(h) !== -1;
  }

  function isReviewModeEligibleHost(hostname) {
    const h = (hostname || '').toLowerCase();
    if (isReviewModeProductionHost(h)) return false;
    if (h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local')) return true;
    /* Cloudflare Pages branch-preview subdomains: <branch>.aimt-site.pages.dev */
    if (/^[a-z0-9-]+\.aimt-site\.pages\.dev$/.test(h)) return true;
    return false;
  }

  const ReviewMode = {
    _active: false,

    init() {
      let hostname = '';
      try { hostname = window.location.hostname; } catch (e) {}

      if (isReviewModeProductionHost(hostname)) {
        /* Hard block: never active on production, regardless of any
           stale session flag or query param. */
        try { sessionStorage.removeItem(REVIEW_MODE_SESSION_KEY); } catch (e) {}
        this._active = false;
        return;
      }

      let requested = false;
      try {
        requested = new URLSearchParams(window.location.search).get('review') === '1';
      } catch (e) {}

      let sessionFlag = false;
      try { sessionFlag = sessionStorage.getItem(REVIEW_MODE_SESSION_KEY) === '1'; } catch (e) {}

      const eligible = isReviewModeEligibleHost(hostname);
      this._active = eligible && (requested || sessionFlag);

      if (this._active) {
        try { sessionStorage.setItem(REVIEW_MODE_SESSION_KEY, '1'); } catch (e) {}
      }
    },

    isActive() {
      return this._active === true;
    },

    applyUI() {
      const banner = document.getElementById('reviewModeBanner');
      if (this._active) {
        document.body.classList.add('review-mode-active');
        if (banner) banner.classList.add('show');
      } else {
        document.body.classList.remove('review-mode-active');
        if (banner) banner.classList.remove('show');
      }
    },

    exit() {
      try { sessionStorage.removeItem(REVIEW_MODE_SESSION_KEY); } catch (e) {}
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      params.delete('review');
      const nextQuery = params.toString();
      window.location.href = nextQuery ? (path + '?' + nextQuery) : path;
    }
  };

  ReviewMode.init();
  window.ReviewMode = ReviewMode;

  function createCheckpointMeta() {
    return {
      status: '',
      feedback: '',
      answer: '',
      attempts: 0,
      updatedAt: null
    };
  }

  const MEMORY_ROLE_PATTERNS = [
    { tag: 'cosmetology', pattern: /\b(cosmetolog|stylist|hairdresser|behind the chair|salon)\b/i },
    { tag: 'esthetics', pattern: /\b(esthetic|esthetician|aesthetician|skin therapist|facialist)\b/i },
    { tag: 'newcomer', pattern: /\b(new to|beginner|just starting|brand new|newcomer)\b/i },
    { tag: 'owner', pattern: /\b(owner|studio owner|suite owner|business owner)\b/i },
    { tag: 'educator', pattern: /\b(educator|teacher|trainer|coach)\b/i }
  ];

  const MEMORY_GOAL_PATTERNS = [
    { tag: 'build-menu', pattern: /\b(menu|pricing|price|tier|package|add-on|upsell)\b/i },
    { tag: 'open-room', pattern: /\b(room|space|studio|suite|open|launch|setup)\b/i },
    { tag: 'scalp-science', pattern: /\b(scalp|science|tricholog|anatomy|microscopy)\b/i },
    { tag: 'client-experience', pattern: /\b(client experience|guest experience|luxury|premium|relaxing|ritual)\b/i },
    { tag: 'confidence', pattern: /\b(confidence|confident|certainty|feel ready)\b/i }
  ];

  const MEMORY_HESITATION_PATTERNS = [
    { tag: 'scope-awareness', pattern: /\b(scope|diagnos|refer|medical|outside my lane)\b/i },
    { tag: 'consultation-language', pattern: /\b(consult|what to say|language|wording|talk to clients)\b/i },
    { tag: 'anatomy-grounding', pattern: /\b(anatomy|science|follicle|hydrolipid|growth cycle)\b/i },
    { tag: 'service-flow', pattern: /\b(flow|sequence|timing|lead the service|transition)\b/i },
    { tag: 'pricing-logic', pattern: /\b(price|pricing|expensive|menu|profit)\b/i }
  ];

  const MODULE_MEMORY_TAGS = {
    0: ['service-flow', 'scope-awareness', 'pricing-logic', 'consultation-language'],
    1: ['scope-awareness', 'consultation-language', 'referral-judgment'],
    2: ['service-flow', 'client-calming', 'client-guidance'],
    3: ['anatomy-grounding', 'barrier-thinking', 'client-explanation'],
    4: ['pattern-recognition', 'scope-awareness', 'referral-judgment'],
    5: ['protocol-matching', 'barrier-thinking', 'client-guidance'],
    6: ['pattern-recognition', 'referral-judgment', 'barrier-thinking'],
    7: ['service-flow', 'room-prep', 'client-guidance'],
    8: ['client-explanation', 'service-flow', 'client-guidance'],
    9: ['sanitation-discipline', 'complaint-response', 'service-flow'],
    10: ['pricing-logic', 'positioning', 'client-explanation'],
    11: ['service-flow', 'scope-awareness', 'client-guidance', 'pricing-logic', 'pattern-recognition']
  };

  function createCadenceMemory() {
    return {
      profile: {
        backgroundSummary: '',
        roleTags: [],
        goals: [],
        hesitationTags: []
      },
      patterns: {
        strengths: [],
        focusAreas: []
      },
      notableAnswers: [],
      updatedAt: null
    };
  }

  function createModuleProgress(moduleId) {
    return {
      checkpoints: [],
      checkpointMeta: {},
      complete: false,
      unlocked: moduleId === 0,
      startedAt: null,
      lastVisitedAt: null,
      lastScrollY: 0,
      maxReadPercent: 0,
      completedAt: null
    };
  }

  function createDefaults() {
    const progress = {};
    for (let i = 0; i < MODULE_COUNT; i++) {
      progress[String(i)] = createModuleProgress(i);
    }
    return {
      schemaVersion: SCHEMA_VERSION,
      student: {
        name: '',
        introResponse: '',
        introComplete: false,
        joined: '',
        responses: [],
        background: '',
        cadenceMemory: createCadenceMemory()
      },
      progress,
      guide: {
        currentModule: 0
      },
      resume: {
        lastView: 'home',
        moduleId: 0,
        scrollY: 0,
        updatedAt: 0
      }
    };
  }

  function sanitizeString(value, fallback) {
    return typeof value === 'string' ? value : fallback;
  }

  function sanitizeNumber(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
  }

  function sanitizeBoolean(value, fallback) {
    return typeof value === 'boolean' ? value : fallback;
  }

  function sanitizeResponses(value) {
    if (!Array.isArray(value)) return [];
    return value.filter((item) => typeof item === 'string').slice(-10);
  }

  function sanitizeStringArray(value, maxItems) {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item) => typeof item === 'string' && item.trim())
      .map((item) => item.trim())
      .filter((item, index, arr) => arr.indexOf(item) === index)
      .slice(0, maxItems);
  }

  function sanitizeBackgroundSummary(value) {
    return sanitizeString(value, '').trim().slice(0, 220);
  }

  function sanitizeNotableAnswers(value) {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        moduleId: Math.max(0, Math.min(MODULE_COUNT - 1, sanitizeNumber(item.moduleId, 0))),
        checkpointId: sanitizeString(item.checkpointId, '').trim(),
        summary: sanitizeString(item.summary, '').trim().slice(0, 220),
        tags: sanitizeStringArray(item.tags, 4),
        updatedAt: sanitizeNumber(item.updatedAt, null)
      }))
      .filter((item) => item.checkpointId && item.summary)
      .slice(-8);
  }

  function sanitizeCadenceMemory(value) {
    const base = createCadenceMemory();
    if (!value || typeof value !== 'object') return base;
    return {
      profile: {
        backgroundSummary: sanitizeBackgroundSummary(value.profile && value.profile.backgroundSummary),
        roleTags: sanitizeStringArray(value.profile && value.profile.roleTags, 4),
        goals: sanitizeStringArray(value.profile && value.profile.goals, 4),
        hesitationTags: sanitizeStringArray(value.profile && value.profile.hesitationTags, 4)
      },
      patterns: {
        strengths: sanitizeStringArray(value.patterns && value.patterns.strengths, 5),
        focusAreas: sanitizeStringArray(value.patterns && value.patterns.focusAreas, 5)
      },
      notableAnswers: sanitizeNotableAnswers(value.notableAnswers),
      updatedAt: sanitizeNumber(value.updatedAt, null)
    };
  }

  function uniqueAppend(list, items, maxItems) {
    const next = Array.isArray(list) ? list.slice() : [];
    (Array.isArray(items) ? items : []).forEach((item) => {
      if (!item || next.includes(item)) return;
      next.push(item);
    });
    if (typeof maxItems === 'number' && maxItems > 0 && next.length > maxItems) {
      return next.slice(next.length - maxItems);
    }
    return next;
  }

  function collectTags(text, patterns) {
    return patterns.filter((entry) => entry.pattern.test(text)).map((entry) => entry.tag);
  }

  function truncateSentence(text, maxLength) {
    const cleaned = sanitizeString(text, '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return '';
    if (cleaned.length <= maxLength) return cleaned;
    return cleaned.slice(0, Math.max(0, maxLength - 1)).trim() + '…';
  }

  function summarizeIntroBackground(text) {
    return truncateSentence(text, 180);
  }

  function getCheckpointMemoryTags(moduleId, answer) {
    const text = sanitizeString(answer, '');
    const tags = [];
    const lower = text.toLowerCase();

    if (moduleId === 0) {
      if (/\b(scope|refer|diagnos)\b/i.test(text)) tags.push('scope-awareness');
      if (/\b(client|language|say|explain)\b/i.test(text)) tags.push('consultation-language');
      if (/\b(flow|lead|confidence|certainty|sequence)\b/i.test(text)) tags.push('service-flow');
      if (/\b(price|pricing|menu)\b/i.test(text)) tags.push('pricing-logic');
    } else if (moduleId === 1) {
      if (/\b(refer|outside scope|scope|diagnos)\b/i.test(text)) tags.push('scope-awareness');
      if (/\b(i'm seeing|observe|say|language)\b/i.test(text)) tags.push('consultation-language');
      if (/\b(refer|dermatolog|doctor|provider|medical)\b/i.test(text)) tags.push('referral-judgment');
    } else if (moduleId === 2) {
      if (/\b(first five|arrival|intake|robe|tea|aroma|touch)\b/i.test(text)) tags.push('service-flow');
      if (/\b(calm|settle|nervous system|stress|slow)\b/i.test(text)) tags.push('client-calming');
      if (/\b(guide|tell her|walk her|let me take care)\b/i.test(text)) tags.push('client-guidance');
    } else if (moduleId === 3) {
      if (/\b(hydrolipid|barrier|film|sebum)\b/i.test(text)) tags.push('barrier-thinking');
      if (/\b(telogen|postpartum|follicle|anagen|catagen|circulation)\b/i.test(text)) tags.push('anatomy-grounding');
      if (/\b(say to her|tell her|explain)\b/i.test(text)) tags.push('client-explanation');
    } else if (moduleId === 4) {
      if (/\b(dry|oily|yeast|powdery|yellow|region|parting|crown|temporal|occipital)\b/i.test(text)) tags.push('pattern-recognition');
      if (/\b(refer|stop|do not treat|lesion|pustule|inflammation)\b/i.test(text)) tags.push('referral-judgment');
      if (/\b(scope|diagnos)\b/i.test(text)) tags.push('scope-awareness');
    } else if (moduleId === 5) {
      if (/\b(combination|both zones|adapt|different areas)\b/i.test(text)) tags.push('protocol-matching');
      if (/\b(barrier|over-strip|sensitive|do less)\b/i.test(text)) tags.push('barrier-thinking');
      if (/\b(educate|tell the client|explain|handle that conversation)\b/i.test(text)) tags.push('client-guidance');
    } else if (moduleId === 6) {
      if (/\b(powdery|yellow|oily|matte|eyebrows|hairline|malassezia)\b/i.test(text)) tags.push('pattern-recognition');
      if (/\b(refer|within scope|not within scope)\b/i.test(text)) tags.push('referral-judgment');
      if (/\b(barrier|stripping|dry scalp|anti-dandruff)\b/i.test(text)) tags.push('barrier-thinking');
    } else if (moduleId === 7) {
      if (/\b(order|first|before|prep|sequence|halo flush)\b/i.test(text)) tags.push('room-prep');
      if (/\b(stop|adjust|communicate|resume)\b/i.test(text)) tags.push('client-guidance');
      if (/\b(temp|cold|position|towel|dishes)\b/i.test(text)) tags.push('service-flow');
    } else if (moduleId === 8) {
      if (/\b(micro-teach|explain|say|client)\b/i.test(text)) tags.push('client-explanation');
      if (/\b(step|sequence|massage|shampoo|service)\b/i.test(text)) tags.push('service-flow');
      if (/\b(calm|specific|without over-explain|guide)\b/i.test(text)) tags.push('client-guidance');
    } else if (moduleId === 9) {
      if (/\b(reset|flush|sanitize|log|bin|bed vinyl|sequence)\b/i.test(text)) tags.push('sanitation-discipline');
      if (/\b(client calls|complaint|document|respond|investigate)\b/i.test(text)) tags.push('complaint-response');
      if (/\b(order|sequence|after service)\b/i.test(text)) tags.push('service-flow');
    } else if (moduleId === 10) {
      if (/\b(price|pricing|profit|overhead|cost|margin|tier)\b/i.test(text)) tags.push('pricing-logic');
      if (/\b(position|value|expensive|perception)\b/i.test(text)) tags.push('positioning');
      if (/\b(explain|respond|say to the client)\b/i.test(text)) tags.push('client-explanation');
    }

    if (/\bclient\b/i.test(text) && !tags.includes('client-guidance') && moduleId !== 8 && moduleId !== 10) {
      tags.push('client-guidance');
    }

    return tags.filter((tag, index) => tags.indexOf(tag) === index).slice(0, 4);
  }

  function getCheckpointMemorySummary(moduleId, answer, tags) {
    if (tags.includes('scope-awareness')) return 'Showed clear scope boundaries and kept the response professionally in lane.';
    if (tags.includes('referral-judgment')) return 'Handled referral judgment with appropriate caution and professional clarity.';
    if (tags.includes('pattern-recognition')) return 'Read the visible scalp pattern with useful precision instead of reacting to the symptom alone.';
    if (tags.includes('barrier-thinking')) return 'Connected the scalp barrier and product choice in a way that supports more accurate service decisions.';
    if (tags.includes('protocol-matching')) return 'Matched protocol decisions to what the scalp actually needed rather than treating the loudest symptom.';
    if (tags.includes('client-explanation')) return 'Explained the service or finding in language a real client could actually hear and trust.';
    if (tags.includes('sanitation-discipline')) return 'Outlined sanitation and reset steps with strong sequence discipline.';
    if (tags.includes('pricing-logic')) return 'Showed grounded pricing logic instead of relying on generic market comparison.';
    if (tags.includes('service-flow')) return 'Described the service flow with strong sequencing and operational control.';
    return truncateSentence(answer, 150);
  }

  function getModuleFocusTags(moduleId) {
    return MODULE_MEMORY_TAGS[Number(moduleId)] || [];
  }

  function scoreMemoryItemForModule(item, moduleId) {
    const focusTags = getModuleFocusTags(moduleId);
    const itemTags = Array.isArray(item && item.tags) ? item.tags : [];
    let score = 0;
    focusTags.forEach((tag) => {
      if (itemTags.includes(tag)) score += 2;
    });
    if (item && item.moduleId === Number(moduleId) - 1) score += 1;
    return score;
  }

  function sanitizeProgress(rawProgress) {
    const progress = {};
    for (let i = 0; i < MODULE_COUNT; i++) {
      const id = String(i);
      const raw = rawProgress && typeof rawProgress === 'object' ? rawProgress[id] : null;
      const rawMeta = raw && raw.checkpointMeta && typeof raw.checkpointMeta === 'object' ? raw.checkpointMeta : {};
      const checkpointMeta = {};
      Object.keys(rawMeta).forEach((cpId) => {
        const meta = rawMeta[cpId];
        const attempts = Math.max(0, sanitizeNumber(meta && meta.attempts, 0));
        const feedback = sanitizeString(meta && meta.feedback, '');
        const answer = sanitizeString(meta && meta.answer, '');
        const updatedAt = sanitizeNumber(meta && meta.updatedAt, null);
        const status = meta && meta.status === 'passed'
          ? 'passed'
          : (meta && meta.status === 'retry' && (attempts > 0 || feedback || answer || updatedAt))
            ? 'retry'
            : '';
        checkpointMeta[cpId] = {
          status,
          feedback,
          answer,
          attempts,
          updatedAt
        };
      });
      progress[id] = {
        checkpoints: Array.isArray(raw && raw.checkpoints)
          ? raw.checkpoints.filter((cp) => typeof cp === 'string')
          : [],
        checkpointMeta,
        complete: sanitizeBoolean(raw && raw.complete, false),
        unlocked: sanitizeBoolean(raw && raw.unlocked, i === 0),
        startedAt: sanitizeNumber(raw && raw.startedAt, null),
        lastVisitedAt: sanitizeNumber(raw && raw.lastVisitedAt, null),
        lastScrollY: Math.max(0, sanitizeNumber(raw && raw.lastScrollY, 0)),
        maxReadPercent: Math.max(0, Math.min(100, sanitizeNumber(raw && raw.maxReadPercent, 0))),
        completedAt: sanitizeNumber(raw && raw.completedAt, null)
      };
    }
    return progress;
  }

  function sanitizeState(raw) {
    const defaults = createDefaults();
    if (!raw || typeof raw !== 'object') return defaults;

    const state = {
      schemaVersion: SCHEMA_VERSION,
      student: {
        name: sanitizeString(raw.student && raw.student.name, ''),
        introResponse: sanitizeString(raw.student && raw.student.introResponse, ''),
        introComplete: sanitizeBoolean(raw.student && raw.student.introComplete, false),
        joined: sanitizeString(raw.student && raw.student.joined, ''),
        responses: sanitizeResponses(raw.student && raw.student.responses),
        background: sanitizeString(raw.student && raw.student.background, ''),
        cadenceMemory: sanitizeCadenceMemory(raw.student && raw.student.cadenceMemory),
        completionDate: sanitizeString(raw.student && raw.student.completionDate, ''),
        _lastStreakCount: sanitizeNumber(raw.student && raw.student._lastStreakCount, 0)
      },
      progress: sanitizeProgress(raw.progress),
      guide: {
        currentModule: Math.min(
          MODULE_COUNT - 1,
          Math.max(0, sanitizeNumber(raw.guide && raw.guide.currentModule, 0))
        )
      },
      resume: {
        lastView: raw.resume && raw.resume.lastView === 'lesson' ? 'lesson' : 'home',
        moduleId: Math.min(
          MODULE_COUNT - 1,
          Math.max(0, sanitizeNumber(raw.resume && raw.resume.moduleId, 0))
        ),
        scrollY: Math.max(0, sanitizeNumber(raw.resume && raw.resume.scrollY, 0)),
        updatedAt: sanitizeNumber(raw.resume && raw.resume.updatedAt, 0)
      }
    };

    return state;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  window.APP_STATE = {
    _key: STORAGE_KEY,
    data: createDefaults(),

    _defaults() {
      return createDefaults();
    },

    load() {
      let parsed = null;
      try {
        const raw = localStorage.getItem(this._key);
        parsed = raw ? JSON.parse(raw) : null;
      } catch (e) {
        parsed = null;
      }

      this.data = sanitizeState(parsed);
      this._migrate();
      this._syncDerivedState();
      this.save();
    },

    save() {
      this._syncDerivedState();
      /* Course Review Mode: never write real student records. */
      if (window.ReviewMode && window.ReviewMode.isActive()) return;
      try {
        localStorage.setItem(this._key, JSON.stringify(this.data));
      } catch (e) {}
    },

    _migrate() {
      try {
        const old = JSON.parse(localStorage.getItem(LEGACY_PROFILE_KEY));
        if (old && old.introComplete && !this.data.student.introComplete) {
          this.data.student.name = old.name || this.data.student.name;
          this.data.student.introResponse = old.introResponse || this.data.student.introResponse;
          this.data.student.introComplete = true;
          this.data.student.joined = old.joined || this.data.student.joined;
        }
      } catch (e) {}
    },

    _syncDerivedState() {
      if (!this.data || typeof this.data !== 'object') {
        this.data = createDefaults();
      }

      this.data.progress = sanitizeProgress(this.data.progress);

      for (let i = 0; i < MODULE_COUNT; i++) {
        const mod = this.reconcileModuleState(i);
        const required = this.getRequiredCheckpointIds(i);
        if (required.length) {
          mod.complete = this._hasAllRequiredCheckpoints(i);
        }
        mod.unlocked = i === 0 || this.isModuleComplete(i - 1);
        if (!mod.complete) {
          mod.completedAt = null;
        }
      }

      const highestUnlocked = this.getHighestUnlockedModule();
      if (!this.canAccessModule(this.data.guide.currentModule)) {
        this.data.guide.currentModule = highestUnlocked;
      }
      if (!this.canAccessModule(this.data.resume.moduleId)) {
        this.data.resume.moduleId = highestUnlocked;
        this.data.resume.scrollY = 0;
        this.data.resume.lastView = 'home';
      }
    },

    setStudent(fields) {
      Object.assign(this.data.student, fields || {});
      this.save();
    },

    getModuleProgress(moduleId) {
      const id = String(moduleId);
      if (!this.data.progress[id]) {
        this.data.progress[id] = createModuleProgress(Number(moduleId) || 0);
      }
      return this.data.progress[id];
    },

    getRequiredCheckpointIds(moduleId) {
      const all = window.MODULE_CHECKPOINTS || {};
      const ids = all[String(moduleId)];
      return Array.isArray(ids) ? ids.slice() : [];
    },

    reconcileModuleState(moduleId) {
      const mod = this.getModuleProgress(moduleId);
      const required = this.getRequiredCheckpointIds(moduleId);
      if (!required.length) return mod;

      mod.checkpoints = required.filter((cpId) => {
        const meta = mod.checkpointMeta && mod.checkpointMeta[cpId];
        return !!(meta && meta.status === 'passed');
      });

      mod.complete = this._hasAllRequiredCheckpoints(moduleId);
      if (mod.complete && !mod.completedAt) {
        mod.completedAt = now();
      }
      if (!mod.complete) {
        mod.completedAt = null;
      }

      return mod;
    },

    _hasAllRequiredCheckpoints(moduleId) {
      const required = this.getRequiredCheckpointIds(moduleId);
      if (!required.length) {
        return this.getModuleProgress(moduleId).complete;
      }
      const mod = this.getModuleProgress(moduleId);
      return required.every((cpId) => {
        const meta = mod.checkpointMeta && mod.checkpointMeta[cpId];
        return !!(meta && meta.status === 'passed');
      });
    },

    getCheckpointMeta(moduleId, cpId) {
      const mod = this.getModuleProgress(moduleId);
      if (!mod.checkpointMeta[cpId]) {
        mod.checkpointMeta[cpId] = createCheckpointMeta();
      }
      return mod.checkpointMeta[cpId];
    },

    setCheckpointResult(moduleId, cpId, result) {
      const mod = this.reconcileModuleState(moduleId);
      const meta = this.getCheckpointMeta(moduleId, cpId);
      meta.status = result && result.passed ? 'passed' : 'retry';
      meta.feedback = sanitizeString(result && result.feedback, '');
      meta.answer = sanitizeString(result && result.answer, '');
      meta.attempts = Math.max(1, (meta.attempts || 0) + 1);
      meta.updatedAt = now();
      mod.lastVisitedAt = meta.updatedAt;
      if (!mod.startedAt) mod.startedAt = meta.updatedAt;

      this.reconcileModuleState(moduleId);
      mod.complete = this._hasAllRequiredCheckpoints(moduleId);
      if (mod.complete && !mod.completedAt) {
        mod.completedAt = now();
      }
      if (!mod.complete) {
        mod.completedAt = null;
      }

      this.data.resume.moduleId = Number(moduleId);
      this.data.resume.updatedAt = now();
      this.save();
    },

    canAccessModule(moduleId) {
      const id = Number(moduleId);
      if (!Number.isInteger(id) || id < 0 || id >= MODULE_COUNT) return false;
      /* Course Review Mode: owner may open any module for inspection
         without affecting real unlock state (see wouldBeLockedWithoutReview). */
      if (window.ReviewMode && window.ReviewMode.isActive()) return true;
      if (id === 0) return true;
      return this.isModuleComplete(id - 1);
    },

    /* Course Review Mode UI only — reports whether a module would be
       locked for a real student, independent of the Review Mode override
       above. Does not affect access or persistence. */
    wouldBeLockedWithoutReview(moduleId) {
      const id = Number(moduleId);
      if (!Number.isInteger(id) || id < 0 || id >= MODULE_COUNT) return true;
      if (id === 0) return false;
      return !this.isModuleComplete(id - 1);
    },

    getHighestUnlockedModule() {
      for (let i = MODULE_COUNT - 1; i >= 0; i--) {
        if (this.canAccessModule(i)) return i;
      }
      return 0;
    },

    setCurrentModule(moduleId) {
      if (!this.canAccessModule(moduleId)) return false;
      const id = Number(moduleId);
      const mod = this.getModuleProgress(id);
      const timestamp = now();
      if (!mod.startedAt) mod.startedAt = timestamp;
      mod.lastVisitedAt = timestamp;
      this.data.guide.currentModule = id;
      this.data.resume.moduleId = id;
      this.data.resume.lastView = 'lesson';
      this.data.resume.scrollY = mod.lastScrollY || 0;
      this.data.resume.updatedAt = timestamp;
      this.save();
      return true;
    },

    setCurrentView(view) {
      this.data.resume.lastView = view === 'lesson' ? 'lesson' : 'home';
      this.data.resume.updatedAt = now();
      this.save();
    },

    setLessonScroll(moduleId, scrollY) {
      const id = Number(moduleId);
      if (!this.canAccessModule(id)) return;
      const mod = this.getModuleProgress(id);
      const safeScrollY = Math.max(0, Math.round(scrollY || 0));
      mod.lastScrollY = safeScrollY;
      mod.lastVisitedAt = now();
      this.data.resume.moduleId = id;
      this.data.resume.scrollY = safeScrollY;
      this.data.resume.lastView = 'lesson';
      this.data.resume.updatedAt = now();
      this.save();
    },

    setReadProgress(moduleId, percent) {
      const mod = this.getModuleProgress(moduleId);
      const safePercent = Math.max(0, Math.min(100, Math.round(percent || 0)));
      if (safePercent > (mod.maxReadPercent || 0)) {
        mod.maxReadPercent = safePercent;
        mod.lastVisitedAt = now();
        this.save();
      }
    },

    getLessonScroll(moduleId) {
      return this.getModuleProgress(moduleId).lastScrollY || 0;
    },

    getResumeModuleId() {
      const resumeId = this.data.resume.moduleId;
      const moduleProgress = this.getModuleProgress(resumeId);
      if (
        this.canAccessModule(resumeId) &&
        (moduleProgress.lastVisitedAt || moduleProgress.startedAt || moduleProgress.checkpoints.length > 0) &&
        !moduleProgress.complete
      ) {
        return resumeId;
      }
      return this.getNextIncompleteModule();
    },

    markCheckpoint(moduleId, cpId) {
      this.setCheckpointResult(moduleId, cpId, { passed: true, feedback: '', answer: '' });
    },

    markModuleComplete(moduleId) {
      const mod = this.getModuleProgress(moduleId);
      if (this.getRequiredCheckpointIds(moduleId).length && !this._hasAllRequiredCheckpoints(moduleId)) {
        return;
      }
      mod.complete = true;
      if (!mod.completedAt) mod.completedAt = now();
      mod.lastVisitedAt = now();
      this.save();
      if (typeof window.renderHomeProgress === 'function') {
        window.renderHomeProgress();
      }
      if (typeof window.checkStreakMoment === 'function') {
        window.checkStreakMoment(moduleId);
      }
    },

    _checkModuleComplete(moduleId) {
      const mod = this.getModuleProgress(moduleId);
      const isComplete = this._hasAllRequiredCheckpoints(moduleId);
      if (!isComplete) {
        mod.complete = false;
        mod.completedAt = null;
        this.save();
        return false;
      }

      mod.complete = true;
      if (!mod.completedAt) mod.completedAt = now();
      this.save();
      if (typeof window.renderHomeProgress === 'function') {
        window.renderHomeProgress();
      }
      setTimeout(() => {
        const cardId = Number(moduleId) === 3 ? 'lessonComplete' : 'm' + moduleId + 'Complete';
        const card = document.getElementById(cardId);
        if (card) {
          card.style.display = 'block';
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 250);
      return true;
    },

    isModuleComplete(moduleId) {
      if (Number(moduleId) < 0) return true;
      const mod = this.getModuleProgress(moduleId);
      if (this.getRequiredCheckpointIds(moduleId).length) {
        return this._hasAllRequiredCheckpoints(moduleId);
      }
      return mod.complete;
    },

    getCompletedCount() {
      let count = 0;
      for (let i = 0; i < MODULE_COUNT; i++) {
        if (this.isModuleComplete(i)) count++;
      }
      return count;
    },

    getOverallPct() {
      return Math.round((this.getCompletedCount() / MODULE_COUNT) * 100);
    },

    getNextIncompleteModule() {
      for (let i = 0; i < MODULE_COUNT; i++) {
        if (!this.isModuleComplete(i)) return i;
      }
      return MODULE_COUNT - 1;
    },

    addResponse(text) {
      if (!this.data.student.responses) this.data.student.responses = [];
      this.data.student.responses.push(text);
      this.data.student.responses = sanitizeResponses(this.data.student.responses);
      this.save();
    },

    getCadenceMemory() {
      if (!this.data.student.cadenceMemory || typeof this.data.student.cadenceMemory !== 'object') {
        this.data.student.cadenceMemory = createCadenceMemory();
      }
      return this.data.student.cadenceMemory;
    },

    updateCadenceMemoryFromIntro(text) {
      const memory = this.getCadenceMemory();
      const introText = sanitizeString(text, '').trim();
      if (!introText) return;

      memory.profile.backgroundSummary = summarizeIntroBackground(introText);
      memory.profile.roleTags = uniqueAppend(memory.profile.roleTags, collectTags(introText, MEMORY_ROLE_PATTERNS), 4);
      memory.profile.goals = uniqueAppend(memory.profile.goals, collectTags(introText, MEMORY_GOAL_PATTERNS), 4);
      memory.profile.hesitationTags = uniqueAppend(memory.profile.hesitationTags, collectTags(introText, MEMORY_HESITATION_PATTERNS), 4);
      memory.patterns.focusAreas = uniqueAppend(memory.patterns.focusAreas, memory.profile.hesitationTags, 5);
      memory.updatedAt = now();
      this.save();
    },

    captureCheckpointMemory(moduleId, cpId) {
      const meta = this.getCheckpointMeta(moduleId, cpId);
      if (!meta || meta.status !== 'passed' || !meta.answer) return;

      const memory = this.getCadenceMemory();
      const tags = getCheckpointMemoryTags(Number(moduleId), meta.answer);
      const summary = getCheckpointMemorySummary(Number(moduleId), meta.answer, tags);
      const existingIndex = memory.notableAnswers.findIndex((entry) => entry && entry.checkpointId === cpId);
      const nextEntry = {
        moduleId: Number(moduleId),
        checkpointId: cpId,
        summary,
        tags,
        updatedAt: meta.updatedAt || now()
      };

      if (existingIndex >= 0) memory.notableAnswers.splice(existingIndex, 1, nextEntry);
      else memory.notableAnswers.push(nextEntry);
      memory.notableAnswers = memory.notableAnswers.slice(-8);

      memory.patterns.strengths = uniqueAppend(memory.patterns.strengths, tags, 5);
      if ((meta.attempts || 0) > 1) {
        memory.patterns.focusAreas = uniqueAppend(memory.patterns.focusAreas, tags, 5);
      }
      memory.updatedAt = now();
      this.save();
    },

    getCadenceMemoryContext(moduleId, mode) {
      const memory = this.getCadenceMemory();
      const moduleNumber = Number.isInteger(Number(moduleId)) ? Number(moduleId) : 0;
      const purpose = mode === 'checkpoint' ? 'checkpoint' : 'guide';
      const parts = [];

      if (memory.profile.backgroundSummary) {
        parts.push('Learner background: ' + memory.profile.backgroundSummary);
      }
      if (memory.profile.roleTags.length) {
        parts.push('Established learner background tags: ' + memory.profile.roleTags.join(', ') + '.');
      }
      if (memory.profile.goals.length) {
        parts.push('Learner goals already established: ' + memory.profile.goals.join(', ') + '.');
      }

      const focusTags = getModuleFocusTags(moduleNumber);
      const relevantStrengths = memory.patterns.strengths.filter((tag) => focusTags.includes(tag)).slice(0, 2);
      const relevantFocusAreas = memory.patterns.focusAreas.filter((tag) => focusTags.includes(tag)).slice(0, 2);
      const scoredAnswers = memory.notableAnswers
        .slice()
        .map((item) => ({ item, score: scoreMemoryItemForModule(item, moduleNumber) }))
        .sort((a, b) => b.score - a.score);
      let relevantAnswers = scoredAnswers
        .filter((entry) => entry.score > 0 || moduleNumber === 11)
        .map((entry) => entry.item)
        .slice(0, purpose === 'checkpoint' ? 1 : 2);

      if (!relevantAnswers.length && purpose === 'guide' && memory.notableAnswers.length && moduleNumber === 11) {
        relevantAnswers = memory.notableAnswers.slice(-2);
      }

      if (relevantStrengths.length) {
        parts.push('Use only if relevant: this learner has already shown strength in ' + relevantStrengths.join(', ') + '.');
      }
      if (relevantFocusAreas.length) {
        parts.push('Use only if it sharpens the current point: this learner has needed more support around ' + relevantFocusAreas.join(', ') + '.');
      }
      if (relevantAnswers.length) {
        parts.push(
          'Relevant earlier learner context:' +
          relevantAnswers.map((item) => ' Module ' + item.moduleId + ' — ' + item.summary).join('')
        );
      }

      if (!parts.length) return '';

      return '\n\nControlled learner continuity:' +
        '\n' + parts.join('\n') +
        '\nUse this selectively. Do not force callbacks, do not repeat the same background note, and do not mention prior context unless it materially sharpens the current response.';
    },

    getResponseContext(moduleId, mode) {
      const s = this.data.student || {};
      let ctx = '';
      if (s.background) ctx += '\n\nStudent background (from intro): ' + s.background;
      if (s.name) ctx += '\nStudent name: ' + s.name + '. Use their name occasionally — naturally, not constantly.';
      const responses = Array.isArray(s.responses) ? s.responses : [];
      if (responses.length > 1) ctx += '\nRecent responses: ' + responses.slice(-3).join(' | ');
      if (ctx) {
        ctx += '\n\nUse this context to personalize your response. If they have industry experience, acknowledge what they may already know and build on it rather than over-explaining basics.';
      }
      return ctx + this.getCadenceMemoryContext(moduleId, mode);
    },

    snapshot() {
      return clone(this.data);
    }
  };
})();
