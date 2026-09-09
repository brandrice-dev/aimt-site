/* AIMT Public Navigation — shared mobile menu behavior.
   Logic copied verbatim from the homepage's inline nav script
   (index.html) — the same toggle for every page instead of a
   copy-pasted variant per page. No page-specific behavior lives here;
   this only wires up whichever .aimt-public-nav-hamburger /
   .aimt-public-nav-mobile-menu pair exists on the current page. */
(function () {
  const btn = document.getElementById('navHamburger');
  const menu = document.getElementById('navMobileMenu');
  if (!btn || !menu) return;
  let open = false;

  function setOpen(next) {
    open = next;
    btn.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  }

  btn.addEventListener('click', () => setOpen(!open));
  menu.querySelectorAll('.aimt-public-nav-mobile-link').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) setOpen(false);
  });
})();
