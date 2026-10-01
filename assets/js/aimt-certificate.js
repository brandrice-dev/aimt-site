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
  var VERIFY_DISPLAY = 'aimtrichology.com/verify';
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
      institute: INSTITUTE_NAME,
      verifyDisplay: VERIFY_DISPLAY
    };
  }

  function renderCertificateMarkup(view, crestSrc) {
    if (!view || view.status !== 'active') return '';
    return '' +
      '<article class="cert" aria-label="AIMT certificate for ' + esc(view.studentName) + '">' +
        '<div class="cert-frame" aria-hidden="true"></div>' +
        '<header class="cert-head">' +
          '<div class="cert-eyebrow"><span class="cert-rule"></span>AIMT Certified<span class="cert-rule"></span></div>' +
          '<h1 class="cert-title">' + esc(view.program) + '</h1>' +
          '<div class="cert-institute">' + esc(view.institute) + '</div>' +
        '</header>' +
        '<section class="cert-body">' +
          '<div class="cert-presented">This certifies that</div>' +
          '<div class="cert-name" data-cert-field="student_name">' + esc(view.studentName) + '</div>' +
          '<p class="cert-statement">has completed the required coursework and met the AIMT certification standard ' +
            'on the Final Certification Assessment for the ' + esc(view.program) + '.</p>' +
        '</section>' +
        '<footer class="cert-foot">' +
          '<div class="cert-foot-spacer" aria-hidden="true"></div>' +
          '<div class="cert-foot-center">' +
            '<dl class="cert-meta">' +
              '<div class="cert-meta-item"><dt>Date</dt><dd data-cert-field="completed_at">' + esc(view.date) + '</dd></div>' +
              '<div class="cert-meta-item"><dt>Program</dt><dd>' + esc(view.program) + '</dd></div>' +
              '<div class="cert-meta-item"><dt>Issued by</dt><dd>AIMT</dd></div>' +
            '</dl>' +
            '<div class="cert-verify">Credential ID <span class="cert-id" data-cert-field="credential_id">' + esc(view.credentialId) + '</span>' +
              ' &middot; Verify at ' + esc(view.verifyDisplay) + '</div>' +
          '</div>' +
          '<div class="cert-seal"><img class="cert-crest" src="' + esc(crestSrc || '/assets/brand/aimt-badge-600.png') + '" alt="AIMT crest"></div>' +
        '</footer>' +
      '</article>';
  }

  var api = {
    PROGRAM_NAME: PROGRAM_NAME,
    INSTITUTE_NAME: INSTITUTE_NAME,
    normalizeCredentialId: normalizeCredentialId,
    formatDate: formatDate,
    buildCertificateView: buildCertificateView,
    renderCertificateMarkup: renderCertificateMarkup
  };
  root.AIMTCertificate = api;
})(typeof window !== 'undefined' ? window : globalThis);
