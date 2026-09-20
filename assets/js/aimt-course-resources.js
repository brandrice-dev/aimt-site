/* ═══════════════════════════════════════════════════════════════
   AIMT Course Resources Registry
   ---------------------------------------------------------------
   Single source of truth for the student-facing resources shown in
   the My AIMT dashboard's Resources Library (my-aimt.html). Every
   entry must point at a real, already-shipped student-facing asset —
   this file does not gate access (the dashboard only renders a
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
      module: 2,
      moduleLabel: 'Module 2 — Welcoming Your Client',
      title: 'Head Spa Intake + Service Plan',
      description: 'A two-part form for gathering what affects service planning, then converting it into a clear practitioner plan before hands-on treatment begins.',
      type: 'download',
      href: 'assets/images/course/module-02/module-02-head-spa-intake-service-plan-fillable.pdf'
    },
    {
      module: 8,
      moduleLabel: 'Module 8 — The Head Spa Service',
      title: 'AIMT Service Timer',
      description: 'Core (60-min) and Extended (90-min) reference protocols — a treatment-room pacing companion.',
      type: 'tool',
      href: 'aimt-service-timer.html'
    },
    {
      module: 8,
      moduleLabel: 'Module 8 — The Head Spa Service',
      title: 'Core Service Map',
      description: 'Printable 60-minute service flow reference.',
      type: 'download',
      href: 'assets/images/course/module-08/module-08-core-format-service-map.png'
    },
    {
      module: 8,
      moduleLabel: 'Module 8 — The Head Spa Service',
      title: 'Extended Service Map',
      description: 'Printable 90-minute service flow reference.',
      type: 'download',
      href: 'assets/images/course/module-08/module-08-extended-format-service-map.png'
    },
    {
      module: 9,
      moduleLabel: 'Module 9 — Checkout, Client Closing & Pricing Strategy',
      title: 'Head Spa Enhancement Strategy Guide',
      description: 'Enhancement ideas, why they may earn a place on your menu, and how to position them without a sales pitch.',
      type: 'download',
      href: 'assets/images/course/module-09/AIMT-Head-Spa-Enhancement-Strategy-Guide.pdf'
    },
    {
      module: 10,
      moduleLabel: 'Module 10 — Sanitation & Reset Systems',
      title: 'Between-Client Sanitation & Reset Checklist',
      description: 'The Contain → Clean → Disinfect/Process → Reset → Verify workflow, plus a fillable page for your own product, equipment, and jurisdiction details.',
      type: 'download',
      href: 'assets/images/course/module-10/module-10-between-client-sanitation-reset-checklist-fillable.pdf'
    },
    {
      module: 11,
      moduleLabel: 'Module 11 — AI / Modern Practice Tools',
      title: 'AIMT AI Practice Toolkit',
      description: 'The B.R.I.E.F. prompt framework, an AI-use and verification matrix, a client-brings-AI response framework, and ready-to-customize practice prompts.',
      type: 'download',
      href: 'assets/images/course/module-11/module-11-aimt-ai-practice-toolkit-fillable.pdf'
    }
  ]
};
