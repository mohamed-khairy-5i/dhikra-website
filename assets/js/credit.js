/* ==========================================================================
   ذِكْرَى · Dhikra — developer credit (single source of truth)
   --------------------------------------------------------------------------
   This is the ONE place the "developed by" credit lives. To white-label or
   remove the credit, set SHOW_CREDIT = false below — that's the only change
   needed anywhere in the project.

   It renders:
     • a small, tasteful bilingual footer line (auto-updating year)
     • author / creator JSON-LD structured data (technical attribution)
   into any element carrying [data-credit-slot]. Falls back to appending a
   footer-bottom line if no slot is present.
   ========================================================================== */
(function () {
  'use strict';

  var SHOW_CREDIT = true;                       // ← one-line kill switch
  if (!SHOW_CREDIT) return;

  var DEV = {
    nameEn: 'Mohamed Khairy',
    nameAr: 'محمد خيري',
    roleEn: 'MERN Stack & AI Engineer',
    roleAr: 'مهندس MERN Stack والذكاء الاصطناعي',
    email: 'mohamedkhairy0887@gmail.com',
    github: 'https://github.com/mohamed-khairy-5i',
    linkedin: 'https://www.linkedin.com/in/mohamed-khairy-5i/',
    portfolio: 'https://mokhairy.netlify.app/'
  };

  var YEAR = new Date().getFullYear();          // never hardcoded
  var isAr = function () { return document.documentElement.lang !== 'en'; };

  /* ---- 1) Visual credit line ---- */
  function render() {
    var slot = document.querySelector('[data-credit-slot]');
    // If a page has no explicit slot, create one at the end of footer-bottom.
    if (!slot) {
      var fb = document.querySelector('.footer-bottom');
      if (!fb) return;
      slot = document.createElement('p');
      slot.setAttribute('data-credit-slot', '');
      fb.appendChild(slot);
    }

    slot.classList.add('dev-credit');
    slot.innerHTML =
      '<span class="dev-credit-line">' +
        '<span class="lang-ar">© ' + YEAR + ' · تصميم وتطوير ' +
          '<a href="' + DEV.portfolio + '" target="_blank" rel="noopener author">' + DEV.nameAr + '</a>' +
          ' · ' + DEV.roleAr + '</span>' +
        '<span class="lang-en">© ' + YEAR + ' · Designed &amp; developed by ' +
          '<a href="' + DEV.portfolio + '" target="_blank" rel="noopener author">' + DEV.nameEn + '</a>' +
          ' · ' + DEV.roleEn + '</span>' +
      '</span>' +
      '<span class="dev-credit-links" aria-label="Developer contact">' +
        '<a href="mailto:' + DEV.email + '" title="Email" aria-label="Email"><i class="fas fa-envelope"></i></a>' +
        '<a href="' + DEV.portfolio + '" target="_blank" rel="noopener" title="Portfolio" aria-label="Portfolio"><i class="fas fa-globe"></i></a>' +
        '<a href="' + DEV.github + '" target="_blank" rel="noopener" title="GitHub" aria-label="GitHub"><i class="fab fa-github"></i></a>' +
        '<a href="' + DEV.linkedin + '" target="_blank" rel="noopener" title="LinkedIn" aria-label="LinkedIn"><i class="fab fa-linkedin"></i></a>' +
      '</span>';
  }

  /* ---- 2) Structured-data attribution (author / creator) ---- */
  function injectSchema() {
    if (document.querySelector('script[data-credit-schema]')) return;
    var person = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: DEV.nameEn,
      alternateName: DEV.nameAr,
      jobTitle: DEV.roleEn,
      email: 'mailto:' + DEV.email,
      url: DEV.portfolio,
      sameAs: [DEV.github, DEV.linkedin, DEV.portfolio]
    };
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.setAttribute('data-credit-schema', '');
    s.textContent = JSON.stringify(person);
    document.head.appendChild(s);
  }

  function init() { render(); injectSchema(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
