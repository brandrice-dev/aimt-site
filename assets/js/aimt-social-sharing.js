/* Presentation only. Enrollment and credential ownership come from My AIMT's
   existing RLS reads; active status is rechecked with the certificate authority.
   No local storage, issuance, analytics, or external rendering service. */
(function (root) {
  'use strict';
  const VERIFY_ORIGIN = 'https://aimtrichology.com';
  const STUDENT_CAPTION = 'Taking the next step in my career. Currently training toward AIMT Head Spa Certification at the American Institute of Modern Trichology. #AIMT #HeadSpaTraining';

  async function verifyCredential(credential, request) {
    if (!credential || credential.course_slug !== 'headspa-mastery' || credential.revoked !== false) return null;
    const id = root.AIMTCertificate.normalizeCredentialId(credential.credential_id);
    if (!id) return null;
    const response = await request('/api/verify-credential?id=' + encodeURIComponent(id), { cache: 'no-store' });
    if (!response.ok) throw new Error('Credential lookup unavailable');
    const record = await response.json();
    const view = root.AIMTCertificate.buildCertificateView(record);
    return view.status === 'active' && view.credentialId === id && record.course === root.AIMTCertificate.PROGRAM_NAME ? view : null;
  }

  function verificationUrl(view) { return VERIFY_ORIGIN + '/verify?id=' + encodeURIComponent(view.credentialId); }
  function graduateCaption(view) {
    return 'I’ve earned AIMT Head Spa Certification from the American Institute of Modern Trichology. Completed ' + view.date + '. Verify my credential: ' + verificationUrl(view) + ' #AIMT #HeadSpaCertification';
  }

  async function drawStory(canvas, variant, view) {
    await Promise.allSettled([document.fonts.load('400 82px Montserrat'), document.fonts.load('400 46px Outfit')]);
    await document.fonts.ready;
    // Reuse the dashboard's canonical inline geometry. The reference SVG file
    // has legacy XML comments that image decoders reject; it is not edited here.
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 44 44'); svg.setAttribute('width', '100'); svg.setAttribute('height', '100');
    svg.setAttribute('fill', 'none'); svg.setAttribute('color', variant === 1 ? '#262626' : '#faf8f5');
    const symbol = document.getElementById('aimtOrbitalMark');
    if (!symbol) throw new Error('AIMT mark unavailable');
    Array.from(symbol.children).forEach(node => svg.append(node.cloneNode(true)));
    const mark = new Image();
    mark.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
    await mark.decode();
    canvas.width = 1080; canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    const light = variant === 1;
    const ink = light ? '#262626' : '#faf8f5';
    const muted = light ? '#695d55' : '#c4b9b0';
    ctx.fillStyle = light ? '#faf8f5' : '#1a1814'; ctx.fillRect(0, 0, 1080, 1920);
    ctx.strokeStyle = '#a3968d'; ctx.lineWidth = 2;
    ctx.strokeRect(52, 52, 976, 1816);
    ctx.beginPath(); ctx.moveTo(100, 530); ctx.lineTo(980, 530); ctx.stroke();
    ctx.drawImage(mark, light ? 490 : 96, 178, 100, 100);
    ctx.textBaseline = 'top';
    ctx.textAlign = light ? 'center' : 'left';
    function line(text, y, size, family, color) {
      ctx.fillStyle = color || ink; ctx.font = size + 'px ' + family;
      ctx.fillText(text, light ? 540 : 100, y, 860);
    }
    function wrap(text, y, size, family, color) {
      ctx.font = size + 'px ' + family;
      let row = '';
      const words = text.split(/\s+/);
      words.forEach(word => {
        const next = row ? row + ' ' + word : word;
        if (ctx.measureText(next).width > 860 && row) { line(row, y, size, family, color); y += size * 1.3; row = word; }
        else row = next;
      });
      if (row) line(row, y, size, family, color);
      return y + size * 1.3;
    }
    line('AIMT', 318, 70, 'Montserrat, Arial');
    line(view ? 'CERTIFICATION EARNED' : 'A NEW CHAPTER', 440, 26, 'Outfit, Arial', muted);
    wrap(view ? 'The next chapter. Earned.' : 'Taking the next step in my career.', 660, 82, 'Montserrat, Arial');
    wrap(view ? 'AIMT Head Spa Certification' : 'Currently training toward AIMT Head Spa Certification.', 1080, 46, 'Outfit, Arial', muted);
    if (view) {
      let size = 38;
      ctx.font = size + 'px Outfit, Arial';
      while (ctx.measureText(view.studentName).width > 860 && size > 16) { size--; ctx.font = size + 'px Outfit, Arial'; }
      line(view.studentName, 1320, size, 'Outfit, Arial');
      line(view.date, 1390, 28, 'Outfit, Arial', muted);
      line(view.credentialId, 1450, 28, 'Outfit, Arial', muted);
      line('Verify this credential at', 1540, 25, 'Outfit, Arial', muted);
      line('aimtrichology.com/verify', 1580, 30, 'Outfit, Arial');
    } else {
      line('Professional development, in progress.', 1450, 30, 'Outfit, Arial', muted);
    }
    line('American Institute of', 1700, 32, 'Outfit, Arial');
    line('Modern Trichology', 1746, 32, 'Outfit, Arial');
    return canvas;
  }

  async function mount(container, access, request) {
    request = request || root.fetch.bind(root);
    let initial;
    try { initial = await access(); } catch (_) { return; }
    if (!initial || !initial.enrolled) return;
    container.hidden = false;
    container.innerHTML = '<h2 class="section-label">Share Your Progress</h2>' +
      '<p class="sharing-intro">A professional milestone, in your own words. Sharing is always optional. Download a 1080 × 1920 PNG, then upload it to your Instagram Story. On mobile, you can also touch and hold a preview to save it to Photos.</p><div class="sharing-grid"></div>';
    const grid = container.querySelector('.sharing-grid');
    const graduate = document.createElement('article');
    let generation = 0;
    const urls = new Set();
    function release() { urls.forEach(url => URL.revokeObjectURL(url)); urls.clear(); }
    function message(panel, text) { panel.querySelector('[role="status"]').textContent = text; }
    function shell(title, description) {
      const panel = document.createElement('article');
      panel.className = 'sharing-panel';
      const heading = document.createElement('h3'); heading.textContent = title;
      const copy = document.createElement('p'); copy.textContent = description;
      const status = document.createElement('p'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
      panel.append(heading, copy, status); return panel;
    }
    async function populate(panel, view, isGraduate, ticket) {
      const designs = document.createElement('div'); designs.className = 'sharing-designs';
      const blobs = await Promise.all([0, 1].map(async variant => {
        const canvas = document.createElement('canvas');
        await drawStory(canvas, variant, view);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error('PNG export unavailable');
        return blob;
      }));
      if (isGraduate && ticket !== generation) return;
      blobs.forEach((blob, variant) => {
        const url = URL.createObjectURL(blob); if (isGraduate) urls.add(url);
        const figure = document.createElement('figure');
        const image = document.createElement('img'); image.src = url; image.width = 1080; image.height = 1920;
        image.alt = (isGraduate ? 'Graduate' : 'Student') + ' announcement — ' + (variant ? 'Ivory' : 'Charcoal');
        const label = document.createElement('figcaption'); label.textContent = variant ? 'Ivory' : 'Charcoal';
        const download = document.createElement('button'); download.type = 'button'; download.className = 'btn ghost'; download.textContent = 'Download PNG';
        download.onclick = async () => {
          download.disabled = true;
          try {
            if (isGraduate && !(await stillActive(view))) return;
            const a = document.createElement('a'); a.href = url;
            a.download = 'aimt-' + (isGraduate ? 'graduate' : 'student') + '-' + (variant ? 'ivory' : 'charcoal') + '.png';
            document.body.append(a); a.click(); a.remove();
            message(panel, 'PNG ready. On mobile, you can also touch and hold the preview to save it to Photos.');
          } catch (_) { message(panel, 'Download unavailable. Please try again.'); }
          finally { download.disabled = false; }
        };
        figure.append(image, label, download); designs.append(figure);
      });
      const captionLabel = document.createElement('label'); captionLabel.textContent = isGraduate ? 'Graduate announcement text' : 'Suggested Instagram caption';
      const caption = document.createElement('textarea'); caption.readOnly = true; caption.rows = 5;
      caption.value = isGraduate ? graduateCaption(view) : STUDENT_CAPTION; captionLabel.append(caption);
      const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'btn ghost'; copy.textContent = 'Copy caption';
      copy.onclick = async () => {
        try {
          if (isGraduate && !(await stillActive(view))) return;
          await navigator.clipboard.writeText(caption.value); message(panel, 'Caption copied.');
        } catch (_) { caption.focus(); caption.select(); message(panel, 'Select and copy the caption above.'); }
      };
      panel.append(designs, captionLabel, copy);
      if (view) {
        const link = document.createElement('a'); link.href = verificationUrl(view); link.textContent = 'Verify credential · ' + view.credentialId;
        link.className = 'sharing-verify'; panel.append(link);
      }
    }
    function lock(text) {
      generation++; release(); graduate.replaceChildren();
      const content = shell('Graduate announcement · Locked', text || 'Available after you earn AIMT Head Spa Certification. Your issued credential will be verified before graduate graphics become available.');
      graduate.className = content.className; graduate.append(...content.childNodes);
    }
    async function stillActive(view) {
      try {
        const state = await access();
        const fresh = state && state.enrolled ? await verifyCredential(state.credential, request) : null;
        if (fresh && fresh.credentialId === view.credentialId && fresh.studentName === view.studentName && fresh.date === view.date) return true;
      } catch (_) { /* Fail closed. */ }
      lock('Graduate sharing is unavailable. Refresh to check your current credential status.'); return false;
    }
    const student = shell('Student announcement', 'Available now · Currently training toward certification.');
    grid.append(student, graduate); lock();
    try { await populate(student, null, false); }
    catch (_) { message(student, 'Graphics could not load. Refresh to try again.'); }
    async function refreshGraduate() {
      lock(); const ticket = generation;
      try {
        const state = await access();
        if (!state || !state.enrolled) { container.hidden = true; return; }
        const view = await verifyCredential(state.credential, request);
        if (!view || ticket !== generation) return;
        const content = shell('Graduate announcement · Certified', 'Certification earned · ' + view.date + '. Graphics include your public credential name and ID.');
        graduate.replaceChildren(...content.childNodes);
        await populate(graduate, view, true, ticket);
      } catch (_) {
        if (ticket === generation) lock('We couldn’t verify your credential right now. Refresh to try again.');
      }
    }
    await refreshGraduate();
    // Clear personalized images while away; recheck on return, including revocations.
    document.addEventListener('visibilitychange', () => { if (document.hidden) lock(); else refreshGraduate(); });
    root.addEventListener('pagehide', () => { lock(); });
    root.addEventListener('pageshow', event => { if (event.persisted) refreshGraduate(); });
  }
  root.AIMTSocialSharing = { mount, verifyCredential, verificationUrl, graduateCaption, drawStory };
})(typeof window !== 'undefined' ? window : globalThis);
