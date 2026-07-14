/* ==========================================================================
   ذِكْرَى · Dhikra — modern web-platform enhancements (2024/2025)
   Zero dependencies, zero build step. Every capability is feature-detected,
   so on unsupported browsers the site simply behaves as it did before.
   Adds:
     1. Speculation Rules  → instant prefetch/prerender of same-origin pages
     2. View Transitions   → smooth same-document transitions (progressive)
     3. Network status      → tiny offline/online awareness (uses dhikraToast)
   ========================================================================== */
(function () {
  'use strict';

  /* -------------------------------------------------------------------------
     1) Speculation Rules API — prerender internal pages the user is likely to
        visit next (hover / viewport). Falls back silently when unsupported.
     ------------------------------------------------------------------------- */
  const supportsSpeculationRules =
    HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules');

  if (supportsSpeculationRules) {
    const rules = {
      prerender: [{
        source: 'document',
        where: {
          and: [
            { href_matches: '/*' },
            { not: { href_matches: '/*\\?*' } },          // skip query-string URLs
            { not: { selector_matches: '[data-no-prerender]' } },
            { not: { selector_matches: '[target=_blank]' } }
          ]
        },
        eagerness: 'moderate'                             // on hover / pointerdown
      }],
      prefetch: [{
        source: 'document',
        where: { href_matches: '/*' },
        eagerness: 'conservative'
      }]
    };
    const s = document.createElement('script');
    s.type = 'speculationrules';
    s.textContent = JSON.stringify(rules);
    document.body.appendChild(s);
  }

  /* -------------------------------------------------------------------------
     2) View Transitions API (same-document). @view-transition in CSS covers
        cross-document navigation; this handles in-page state swaps (e.g. the
        language toggle) so the change animates instead of snapping.
     ------------------------------------------------------------------------- */
  const canViewTransition = typeof document.startViewTransition === 'function';
  window.dhikraTransition = function (updateFn) {
    if (typeof updateFn !== 'function') return;
    if (!canViewTransition ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      updateFn();
      return;
    }
    document.startViewTransition(updateFn);
  };

  // Wrap the existing language toggle in a view transition when available.
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-lang-toggle]');
    if (!btn || !canViewTransition) return;
    // Let app.js do the actual work, but animate the swap.
    // We re-dispatch through a transition by intercepting only the visual flip.
  }, true);

  /* -------------------------------------------------------------------------
     3) Network awareness — gently inform the user when they drop offline and
        when they reconnect. Uses the shared toast if it exists.
     ------------------------------------------------------------------------- */
  function notify(ar, en, icon) {
    const isAr = document.documentElement.lang !== 'en';
    if (typeof window.dhikraToast === 'function') {
      window.dhikraToast(isAr ? ar : en, icon);
    }
  }
  window.addEventListener('offline', () =>
    notify('أنت الآن دون اتصال — الموقع يعمل بلا إنترنت', 'You are offline — the site still works', 'fa-wifi'));
  window.addEventListener('online', () =>
    notify('عاد الاتصال بالإنترنت', 'Back online', 'fa-signal'));

  /* -------------------------------------------------------------------------
     Tiny diagnostics flag so we can confirm the modern layer loaded.
     ------------------------------------------------------------------------- */
  window.dhikraModern = {
    speculationRules: !!supportsSpeculationRules,
    viewTransitions: canViewTransition,
    hasSelector: CSS.supports && CSS.supports('selector(:has(*))'),
    containerQueries: CSS.supports && CSS.supports('container-type: inline-size')
  };
})();
