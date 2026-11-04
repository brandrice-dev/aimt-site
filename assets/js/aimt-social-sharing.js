/* Presentation only. Enrollment and credential ownership come from My AIMT's
   existing RLS reads; active status is rechecked with the certificate authority.
   No local storage, issuance, analytics, or external rendering service. */
(function (root) {
  'use strict';
  const VERIFY_ORIGIN = 'https://aimtrichology.com';
  const STUDENT_CAPTION = 'I’m continuing my education in scalp science and professional head spa practice, and currently pursuing AIMT Head Spa Certification. I keep investing in my knowledge because the work behind every service matters to me.';
  const STORY_CONCEPTS = {
    student: [
      { label: 'Enrolled A · Experience', headline: "Experience isn't where I stop.", supporting: 'Continuing my education in scalp science and professional head spa practice.', status: 'Currently pursuing AIMT Head Spa Certification.' },
      { label: 'Enrolled B · Service', headline: 'The work behind the service matters.', supporting: 'Investing in the knowledge behind the experience—not just what clients see.', status: 'Training toward AIMT Head Spa Certification.' }
    ],
    graduate: [
      { label: 'Graduate A · Standard', headline: 'The standard keeps rising.', supporting: 'AIMT Head Spa Certification — Earned.' },
      { label: 'Graduate B · Knowledge', headline: 'More knowledge behind every service.', supporting: 'AIMT Head Spa Certification earned through assessment.' }
    ]
  };
  function storyConcept(variant, view) { return STORY_CONCEPTS[view ? 'graduate' : 'student'][variant]; }
  function studentCaption() { return STUDENT_CAPTION; }

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
    return 'I’ve earned AIMT Head Spa Certification through assessment. I keep investing in my knowledge because the care and thought behind every service matter to me. I completed the certification on ' + view.date + '. You can verify it here: ' + verificationUrl(view);
  }

  async function drawStory(canvas, variant, view) {
    await Promise.allSettled([
      document.fonts.load('400 110px "Playfair Display"'),
      document.fonts.load('300 92px Montserrat'),
      document.fonts.load('400 42px Outfit')
    ]);
    await document.fonts.ready;
    const concept = storyConcept(variant, view);
    const layout = (view ? 'graduate-' : 'student-') + variant;
    const light = layout === 'student-1' || layout === 'graduate-0';
    const ink = light ? '#262626' : '#faf8f5';
    const muted = light ? '#695d55' : '#c4b9b0';
    // Clone the dashboard's working canonical geometry, without redrawing it.
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 44 44'); svg.setAttribute('width', '100'); svg.setAttribute('height', '100');
    svg.setAttribute('fill', 'none'); svg.setAttribute('color', ink);
    const symbol = document.getElementById('aimtOrbitalMark');
    if (!symbol) throw new Error('AIMT mark unavailable');
    Array.from(symbol.children).forEach(node => svg.append(node.cloneNode(true)));
    const mark = new Image();
    mark.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
    await mark.decode();
    canvas.width = 1080; canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = light ? '#faf8f5' : '#1a1814'; ctx.fillRect(0, 0, 1080, 1920);
    ctx.textBaseline = 'top';
    const serif = '"Playfair Display", Georgia, serif';
    const sans = 'Montserrat, Arial, sans-serif';
    const body = 'Outfit, Arial, sans-serif';
    function line(text, x, y, size, family, color, width, align, weight) {
      ctx.textAlign = align || 'left'; ctx.fillStyle = color || ink;
      ctx.font = (weight || '400') + ' ' + size + 'px ' + family;
      ctx.fillText(text, x, y, width || 880);
    }
    function wrap(text, x, y, size, family, width, color, align, leading, weight) {
      ctx.font = (weight || '400') + ' ' + size + 'px ' + family;
      let row = '';
      text.split(/\s+/).forEach(word => {
        const next = row ? row + ' ' + word : word;
        if (ctx.measureText(next).width > width && row) {
          line(row, x, y, size, family, color, width, align, weight); y += leading || size * 1.35; row = word;
        } else row = next;
      });
      if (row) line(row, x, y, size, family, color, width, align, weight);
      return y + (leading || size * 1.35);
    }
    function rule(x, y, width, color) {
      ctx.fillStyle = color || '#a3968d'; ctx.fillRect(x, y, width, 1);
    }
    function institution(center) {
      const y = 1690;
      ctx.drawImage(mark, center ? 508 : 100, y, 64, 64);
      if (center) {
        line('American Institute of Modern Trichology', 540, y + 95, 26, body, muted, 880, 'center');
      } else {
        line('American Institute of', 192, y + 1, 26, body, muted);
        line('Modern Trichology', 192, y + 36, 26, body, muted);
      }
    }
    function credential(x, y, width, center, color, secondary) {
      const align = center ? 'center' : 'left';
      // Verified identity only; fit long names inside the credential area.
      let nameSize = 52;
      ctx.font = nameSize + 'px ' + body;
      while (ctx.measureText(view.studentName).width > width && nameSize > 22) {
        nameSize--; ctx.font = nameSize + 'px ' + body;
      }
      line(view.studentName, x, y, nameSize, body, color, width, align);
      line('Completed ' + view.date, x, y + 100, 28, body, secondary, width, align);
      line(view.credentialId, x, y + 150, 30, body, secondary, width, align);
      line('Verify credential', x, y + 235, 24, body, secondary, width, align);
      line(verificationUrl(view).replace('https://', ''), x, y + 275, 24, body, color, width, align);
    }
    if (layout === 'student-0') {
      // Open editorial page: a marginal rule and a large serif statement.
      ctx.fillStyle = '#a3968d'; ctx.fillRect(60, 300, 2, 700);
      wrap(concept.headline, 100, 350, 116, serif, 830, ink, 'left', 148);
      wrap(concept.supporting, 100, 1030, 44, body, 790, muted);
      rule(100, 1370, 90);
      wrap(concept.status, 100, 1420, 34, body, 800, ink);
      institution(false);
    } else if (layout === 'student-1') {
      // Asymmetric ivory page, with the service statement framed as a column.
      ctx.fillStyle = '#e9e2da'; ctx.fillRect(990, 0, 90, 1920);
      rule(100, 230, 780);
      wrap(concept.headline, 100, 340, 96, sans, 750, ink, 'left', 124, '300');
      rule(100, 925, 780);
      wrap(concept.supporting, 100, 1010, 44, body, 760, muted);
      wrap(concept.status, 100, 1430, 34, body, 760, ink);
      institution(false);
    } else if (layout === 'graduate-0') {
      // Centered earned announcement: name and credential anchor the lower half.
      rule(490, 230, 100);
      wrap(concept.headline, 540, 400, 118, serif, 880, ink, 'center', 152);
      wrap(concept.supporting, 540, 900, 42, body, 760, muted, 'center');
      rule(370, 1130, 340);
      credential(540, 1220, 880, true, ink, muted);
      institution(true);
    } else {
      // Dark typographic cover with a separate, light credential folio.
      wrap(concept.headline, 100, 260, 94, sans, 850, ink, 'left', 122, '300');
      wrap(concept.supporting, 100, 870, 40, body, 810, muted);
      ctx.fillStyle = '#ece6de'; ctx.fillRect(70, 1130, 940, 480);
      credential(115, 1190, 850, false, '#262626', '#695d55');
      institution(false);
    }
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
        const concept = storyConcept(variant, view);
        image.alt = concept.label + ': ' + concept.headline + ' ' + concept.supporting + (concept.status ? ' ' + concept.status : '');
        const label = document.createElement('figcaption'); label.textContent = concept.label;
        const download = document.createElement('button'); download.type = 'button'; download.className = 'btn ghost'; download.textContent = 'Download PNG';
        download.onclick = async () => {
          download.disabled = true;
          try {
            if (isGraduate && !(await stillActive(view))) return;
            const a = document.createElement('a'); a.href = url;
            a.download = 'aimt-' + (isGraduate ? 'graduate' : 'student') + '-' + (variant ? 'b' : 'a') + '.png';
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
  root.AIMTSocialSharing = { mount, verifyCredential, verificationUrl, studentCaption, graduateCaption, storyConcept, drawStory };
})(typeof window !== 'undefined' ? window : globalThis);
