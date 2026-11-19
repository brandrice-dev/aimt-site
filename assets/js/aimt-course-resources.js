/* ═══════════════════════════════════════════════════════════════
   AIMT Course Resources Registry
   ---------------------------------------------------------------
   Single source of truth for the student-facing resources shown in
   the My AIMT dashboard's Resources Library (my-aimt.html). Every
   entry must point at a real, already-shipped student-facing asset —
   the server-side API validates enrollment (the dashboard only renders a
   course's entries for a student the entitlement read already proved
   is entitled to that course; see my-aimt.html's loadResources()).

   Add a future course by adding a new top-level key here — nothing
   else in the dashboard needs to change.

   type: 'download' — a file the student saves (PDF/image); rendered
                        with the `download` attribute.
         'tool'      — a standalone page/companion tool; opened as a
                        normal same-tab link.
   ═══════════════════════════════════════════════════════════════ */
window.AIMT_COURSE_RESOURCES = {
  'headspa-mastery': [
    {
      module: 9,
      moduleLabel: 'Practice Planning — Modules 2, 7–10',
      title: 'First-Service Blueprint',
      description: 'Build one practical head spa service plan: client value, costs, setup checks and next actions. Save it locally and keep refining it as you learn.',
      type: 'tool',
      href: 'first-service-blueprint.html'
    },
    {
      module: 2,
      moduleLabel: 'Module 2 — Welcoming Your Client',
      title: 'Head Spa Intake + Service Plan',
      description: 'A two-part form for gathering what affects service planning, then converting it into a clear practitioner plan before hands-on treatment begins.',
      type: 'download',
      href: '/api/course-material?resource=module-02-intake',
      resourceKey: 'module-02-intake',
      downloadName: 'head-spa-intake-service-plan.pdf'
    },
    {
      module: 8,
      moduleLabel: 'Module 8 — The Head Spa Service',
      title: 'Smart Service Sidekick',
      description: 'Step-by-step service guidance, live pacing, practitioner notes, and client-response cues. Follow the Core 60-minute or Extended 90-minute reference format.',
      type: 'tool',
      href: 'aimt-service-timer.html'
    },
    {
      module: 8,
      moduleLabel: 'Module 8 — The Head Spa Service',
      title: 'Core Service Map',
      description: 'Printable 60-minute service flow reference.',
      type: 'download',
      href: '/api/course-material?resource=module-08-core-map',
      resourceKey: 'module-08-core-map',
      downloadName: 'core-service-map.png'
    },
    {
      module: 8,
      moduleLabel: 'Module 8 — The Head Spa Service',
      title: 'Extended Service Map',
      description: 'Printable 90-minute service flow reference.',
      type: 'download',
      href: '/api/course-material?resource=module-08-extended-map',
      resourceKey: 'module-08-extended-map',
      downloadName: 'extended-service-map.png'
    },
    {
      module: 9,
      moduleLabel: 'Module 9 — Checkout, Client Closing & Pricing Strategy',
      title: 'Head Spa Enhancement Strategy Guide',
      description: 'Enhancement ideas, why they may earn a place on your menu, and how to position them without a sales pitch.',
      type: 'download',
      href: '/api/course-material?resource=module-09-enhancement-guide',
      resourceKey: 'module-09-enhancement-guide',
      downloadName: 'head-spa-enhancement-strategy.pdf'
    },
    {
      module: 10,
      moduleLabel: 'Module 10 — Sanitation & Reset Systems',
      title: 'Between-Client Sanitation & Reset Checklist',
      description: 'The Contain → Clean → Disinfect/Process → Reset → Verify workflow, plus a fillable page for your own product, equipment, and jurisdiction details.',
      type: 'download',
      href: '/api/course-material?resource=module-10-reset',
      resourceKey: 'module-10-reset',
      downloadName: 'sanitation-reset-checklist.pdf'
    },
    {
      module: 11,
      moduleLabel: 'Module 11 — AI / Modern Practice Tools',
      title: 'AIMT AI Practice Toolkit',
      description: 'The B.R.I.E.F. prompt framework, an AI-use and verification matrix, a client-brings-AI response framework, and ready-to-customize practice prompts.',
      type: 'download',
      href: '/api/course-material?resource=module-11-toolkit',
      resourceKey: 'module-11-toolkit',
      downloadName: 'aimt-practice-toolkit.pdf'
    }
  ]
};
