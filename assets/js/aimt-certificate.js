/* ═══════════════════════════════════════════════════════════════
   AIMT certificate renderer — the ONE certificate template.
   ---------------------------------------------------------------
   Used by certificate.html, which both the student (My AIMT, Module 12)
   and AIMT Admin open. There is deliberately no second, admin-only
   template.

   The certificate is a presentation of an already-issued credential, not
   a credential itself. Every field it shows comes from the authoritative
   `completions` row as returned by GET /api/verify-credential
   ({ valid, credential_id, course, student_name, completed_at } or
   { valid:false, reason }) — never from localStorage / APP_STATE. Opening
   or printing a certificate never issues, reissues, or alters anything.

   Pure functions only (no fetch, no DOM writes) so the exact markup can be
   regression-tested in Node: see tests/certificate-render-admin-hotfix.test.mjs.
   ═══════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var PROGRAM_NAME = 'Head Spa Certification Course';
  var INSTITUTE_NAME = 'American Institute of Modern Trichology';
  /* Same shape check verify-credential.js applies server-side. */
  var CREDENTIAL_ID_PATTERN = /^AIMT-[A-Z]{2,6}-\d{4}-[A-Z2-9]{4,10}$/;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c];
    });
  }

  function normalizeCredentialId(value) {
    var id = String(value == null ? '' : value).trim().toUpperCase();
    return CREDENTIAL_ID_PATTERN.test(id) ? id : '';
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  /* Maps a /api/verify-credential response to what the page may show.
     Anything other than an explicit valid:true with a well-formed ID,
     name, and date is NOT an active certificate — a revoked or unknown
     credential never renders as one. */
  function buildCertificateView(record) {
    if (!record || typeof record !== 'object') return { status: 'unavailable' };
    if (record.valid !== true) {
      return { status: record.reason === 'revoked' ? 'revoked' : 'not_found' };
    }
    var credentialId = normalizeCredentialId(record.credential_id);
    var studentName = String(record.student_name || '').trim();
    var date = formatDate(record.completed_at);
    if (!credentialId || !studentName || !date) return { status: 'unavailable' };
    return {
      status: 'active',
      credentialId: credentialId,
      studentName: studentName,
      date: date,
      program: PROGRAM_NAME,
      institute: INSTITUTE_NAME
    };
  }

  /* Fixed production artwork (1491x1055). Everything static — institute
     line, title, "This certifies that", the certification statement, the
     Date / Credential ID / Issued by AIMT labels, the crest, the border — is
     part of this image and is never re-drawn in HTML. Only the three
     credential fields below are overlaid. */
  var TEMPLATE_SRC = '/assets/certificates/aimt-head-spa-certificate-template.png';
  var TEMPLATE_WIDTH = 1491;
  var TEMPLATE_HEIGHT = 1055;

  /* Overlay boxes, measured in template pixels from the artwork's own blank
     rules (name rule y=507 x277-1212; Date rule y=772 x118-347; Credential
     ID rule y=772 x449-658). Each box sits on its rule; text is positioned
     by its bottom edge so it rests just above the line. */
  var FIELD_BOXES = {
    student_name: { left: 277, right: 1212, rule: 507, gap: 9 },
    completed_at: { left: 118, right: 347, rule: 772, gap: 8 },
    /* Extends past its rule's right end (into the empty gap before the
       Issued-by rule) so a full AIMT-HS-YYYY-XXXXXX never wraps. */
    credential_id: { left: 449, right: 784, rule: 772, gap: 8 }
  };

  function pct(value, total) { return (Math.round(value / total * 100000) / 1000) + '%'; }

  function boxStyle(box) {
    return 'left:' + pct(box.left, TEMPLATE_WIDTH) +
      ';width:' + pct(box.right - box.left, TEMPLATE_WIDTH) +
      ';bottom:' + pct(TEMPLATE_HEIGHT - box.rule + box.gap, TEMPLATE_HEIGHT);
  }

  function renderCertificateMarkup(view) {
    if (!view || view.status !== 'active') return '';
    return '' +
      '<article class="cert" aria-label="AIMT ' + esc(view.program) + ' certificate for ' + esc(view.studentName) +
        ', issued ' + esc(view.date) + ', credential ID ' + esc(view.credentialId) + '">' +
        '<img class="cert-template" src="' + TEMPLATE_SRC + '" width="' + TEMPLATE_WIDTH + '" height="' + TEMPLATE_HEIGHT + '" alt="">' +
        '<div class="cert-field cert-field--name" style="' + boxStyle(FIELD_BOXES.student_name) + '" data-cert-field="student_name">' + esc(view.studentName) + '</div>' +
        '<div class="cert-field cert-field--date" style="' + boxStyle(FIELD_BOXES.completed_at) + '" data-cert-field="completed_at">' + esc(view.date) + '</div>' +
        '<div class="cert-field cert-field--id" style="' + boxStyle(FIELD_BOXES.credential_id) + '" data-cert-field="credential_id">' + esc(view.credentialId) + '</div>' +
      '</article>';
  }

  var api = {
    PROGRAM_NAME: PROGRAM_NAME,
    INSTITUTE_NAME: INSTITUTE_NAME,
    TEMPLATE_SRC: TEMPLATE_SRC,
    FIELD_BOXES: FIELD_BOXES,
    normalizeCredentialId: normalizeCredentialId,
    formatDate: formatDate,
    buildCertificateView: buildCertificateView,
    renderCertificateMarkup: renderCertificateMarkup
  };
  root.AIMTCertificate = api;
})(typeof window !== 'undefined' ? window : globalThis);
