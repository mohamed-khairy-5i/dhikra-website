/* ==========================================================================
   ذِكْرَى · Dhikra — shared behaviour
   Progressive, dependency-free. Handles: theme, language, nav, motion,
   reading progress, back-to-top, toast, tap-counters, favourites, share, copy.
   ========================================================================== */
(function () {
  'use strict';
  const html = document.documentElement;
  const store = {
    get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  const t = (ar, en) => (html.lang === 'ar' ? ar : en);

  /* ---------- Toast ---------- */
  let toastEl, toastTimer;
  function toast(msg, icon = 'fa-check') {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
    toastEl.innerHTML = `<i class="fas ${icon}"></i>${msg}`;
    requestAnimationFrame(() => toastEl.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
  }
  window.dhikraToast = toast;

  /* ---------- Theme ---------- */
  function applyTheme(dark) {
    document.body.classList.toggle('dark-mode', dark);
    document.querySelectorAll('[data-theme-icon]').forEach(i => {
      i.classList.toggle('fa-sun', dark);
      i.classList.toggle('fa-moon', !dark);
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0c1b16' : '#1b5e4a');
  }
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  let dark = store.get('theme', prefersDark ? 'dark' : 'light') === 'dark';
  applyTheme(dark);

  /* ---------- Language ---------- */
  function setLang(lang) {
    html.lang = lang; html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-lang-toggle]').forEach(b => b.textContent = lang === 'ar' ? 'EN' : 'ع');
    const ttl = document.body.getAttribute('data-title-' + lang);
    if (ttl) document.title = ttl;
    store.set('language', lang);
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }
  setLang(store.get('language', 'ar'));

  /* ---------- Wire nav controls ---------- */
  function ready(fn) { document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn); }
  ready(() => {
    document.querySelectorAll('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => {
      dark = !document.body.classList.contains('dark-mode'); applyTheme(dark); store.set('theme', dark ? 'dark' : 'light');
    }));
    document.querySelectorAll('[data-lang-toggle]').forEach(b => b.addEventListener('click', () => setLang(html.lang === 'ar' ? 'en' : 'ar')));

    const toggle = document.querySelector('[data-nav-toggle]');
    const menu = document.querySelector('.mobile-nav');
    if (toggle && menu) {
      toggle.addEventListener('click', e => { e.stopPropagation(); menu.classList.toggle('open'); });
      document.addEventListener('click', e => { if (!menu.contains(e.target) && !toggle.contains(e.target)) menu.classList.remove('open'); });
      menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
    }

    /* ---------- Scroll reveal ---------- */
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealEls = document.querySelectorAll('[data-reveal]');
    if (reduce) { revealEls.forEach(el => el.classList.add('in')); }
    else if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      revealEls.forEach(el => io.observe(el));
    } else revealEls.forEach(el => el.classList.add('in'));

    /* ---------- Reading progress + back to top ---------- */
    const rp = document.querySelector('.read-progress');
    const top = document.querySelector('.to-top');
    function onScroll() {
      const st = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (rp) rp.style.width = (h > 0 ? (st / h) * 100 : 0) + '%';
      if (top) top.classList.toggle('show', st > 500);
    }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    if (top) top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

    initStreak();
    initDhikr();
  });

  /* ==========================================================================
     Daily streak — pure client-side habit tracker (privacy-first, offline).
     Counts consecutive days the visitor opened Dhikra. No server, no cookies.
     Renders into any [data-streak] element; safely no-ops if none present.
     ========================================================================== */
  function initStreak() {
    const KEY = 'streak';
    const today = new Date().toISOString().slice(0, 10);          // YYYY-MM-DD (local-ish)
    let s = store.get(KEY, { last: null, count: 0, best: 0 });

    if (s.last !== today) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yesterday = y.toISOString().slice(0, 10);
      s.count = (s.last === yesterday) ? (s.count + 1) : 1;       // continue or reset
      s.last = today;
      s.best = Math.max(s.best || 0, s.count);
      store.set(KEY, s);
    }

    const targets = document.querySelectorAll('[data-streak]');
    if (!targets.length) return;
    const n = s.count;
    targets.forEach(el => {
      el.hidden = false;
      el.innerHTML =
        '<i class="fas fa-fire" aria-hidden="true"></i>' +
        '<b>' + n + '</b>' +
        '<span class="lang-ar">' + (n === 1 ? 'يوم' : 'يوم متتالٍ') + '</span>' +
        '<span class="lang-en">day' + (n === 1 ? '' : 's') + ' streak</span>';
      el.title = t('أيام متتالية من الذكر — أطول سلسلة: ' + (s.best || n),
                   'Consecutive days of dhikr — best: ' + (s.best || n));
    });
  }

  /* ==========================================================================
     Dhikr interactivity: tap counters, favourites, share, copy, progress ring
     ========================================================================== */
  function initDhikr() {
    const cards = Array.from(document.querySelectorAll('.dhikr-card'));
    if (!cards.length) { renderFav(); return; }

    const pageKey = 'progress:' + location.pathname.split('/').pop();
    let progress = store.get(pageKey, {});
    const favs = () => store.get('favorites', []);

    const ring = document.querySelector('.progress-ring');
    function updateRing() {
      const doneCount = cards.filter(c => c.classList.contains('done')).length;
      const pct = Math.round((doneCount / cards.length) * 100);
      if (ring) {
        const bar = ring.querySelector('.bar');
        const r = bar.r.baseVal.value; const c = 2 * Math.PI * r;
        bar.style.strokeDasharray = c;
        bar.style.strokeDashoffset = c * (1 - pct / 100);
        ring.querySelector('.pct').textContent = pct + '%';
      }
      const label = document.querySelector('[data-progress-label]');
      if (label) label.textContent = t(`${doneCount} من ${cards.length}`, `${doneCount} of ${cards.length}`);
      if (pct === 100 && !updateRing._done) { updateRing._done = true; toast(t('أتممت هذه الأذكار — تقبّل الله', 'You completed these adhkar — may Allah accept'), 'fa-star'); }
      if (pct < 100) updateRing._done = false;
    }

    cards.forEach((card, idx) => {
      const target = parseInt(card.dataset.count || '1', 10);
      const id = card.dataset.id || ('d' + idx);
      let n = progress[id] || 0;
      const counter = card.querySelector('.tap-counter');
      const numEl = card.querySelector('.tap-num');

      function paint() {
        if (numEl) numEl.textContent = n + ' / ' + target;
        const complete = n >= target;
        card.classList.toggle('done', complete);
        if (counter) counter.classList.toggle('complete', complete);
      }
      if (n >= target) card.classList.add('done');
      paint();

      if (counter) {
        counter.addEventListener('click', () => {
          n = n >= target ? 0 : n + 1;
          progress[id] = n; store.set(pageKey, progress);
          paint(); updateRing();
          if ('vibrate' in navigator) navigator.vibrate(n >= target ? [20, 40, 20] : 12);
        });
      }

      // favourite
      const favBtn = card.querySelector('[data-fav]');
      if (favBtn) {
        const titleAr = card.querySelector('.dhikr-title .lang-ar')?.textContent?.trim() || card.dataset.title || '';
        const isFav = favs().some(f => f.id === id && f.page === location.pathname.split('/').pop());
        favBtn.classList.toggle('active', isFav);
        favBtn.querySelector('i').className = isFav ? 'fas fa-heart' : 'far fa-heart';
        favBtn.addEventListener('click', () => {
          let list = favs();
          const key = { id, page: location.pathname.split('/').pop() };
          const i = list.findIndex(f => f.id === key.id && f.page === key.page);
          if (i > -1) { list.splice(i, 1); favBtn.classList.remove('active'); favBtn.querySelector('i').className = 'far fa-heart'; toast(t('أُزيل من المفضلة', 'Removed from favourites'), 'fa-heart-crack'); }
          else {
            list.push({ ...key, titleAr, titleEn: card.querySelector('.dhikr-title .lang-en')?.textContent?.trim() || titleAr, text: card.querySelector('.dhikr-text-ar')?.textContent?.trim().slice(0, 120) });
            favBtn.classList.add('active'); favBtn.querySelector('i').className = 'fas fa-heart'; toast(t('أُضيف للمفضلة', 'Added to favourites'), 'fa-heart');
          }
          store.set('favorites', list);
        });
      }

      // copy
      const copyBtn = card.querySelector('[data-copy]');
      if (copyBtn) copyBtn.addEventListener('click', () => {
        const txt = card.querySelector('.dhikr-text-ar')?.textContent?.trim() || '';
        navigator.clipboard.writeText(txt).then(() => {
          const ic = copyBtn.querySelector('i'); ic.className = 'fas fa-check';
          toast(t('تم نسخ الذكر', 'Dhikr copied'), 'fa-copy');
          setTimeout(() => ic.className = 'far fa-copy', 1600);
        });
      });

      // share
      const shareBtn = card.querySelector('[data-share]');
      if (shareBtn) shareBtn.addEventListener('click', () => {
        const txt = card.querySelector('.dhikr-text-ar')?.textContent?.trim() || '';
        const shareData = { title: 'ذِكْرَى', text: txt, url: location.href };
        if (navigator.share) navigator.share(shareData).catch(() => {});
        else navigator.clipboard.writeText(txt + '\n' + location.href).then(() => toast(t('تم نسخ الرابط للمشاركة', 'Share link copied'), 'fa-share-nodes'));
      });
    });

    updateRing();

    // reset all
    const resetBtn = document.querySelector('[data-reset]');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      progress = {}; store.set(pageKey, progress);
      cards.forEach(c => { c.classList.remove('done'); const num = c.querySelector('.tap-num'); const cnt = c.querySelector('.tap-counter'); if (num) num.textContent = '0 / ' + (c.dataset.count || 1); if (cnt) cnt.classList.remove('complete'); c.dataset._n = 0; });
      location.reload();
    });

    // font size control
    document.querySelectorAll('[data-font]').forEach(btn => btn.addEventListener('click', () => {
      const dir = btn.dataset.font; const root = document.querySelector('.dhikr-list');
      let cur = parseFloat(store.get('dhikrFont', 1));
      cur = dir === 'up' ? Math.min(cur + 0.1, 1.6) : Math.max(cur - 0.1, 0.8);
      store.set('dhikrFont', cur); applyFont(cur);
    }));
    applyFont(parseFloat(store.get('dhikrFont', 1)));
    function applyFont(scale) { document.querySelectorAll('.dhikr-text-ar').forEach(e => e.style.fontSize = `calc(clamp(1.3rem, 1rem + 1.4vw, 1.85rem) * ${scale})`); }

    renderFav();
  }

  /* Favourites list rendering (favourites.html) */
  function renderFav() {
    const wrap = document.querySelector('[data-fav-list]');
    if (!wrap) return;
    const list = store.get('favorites', []);
    const empty = document.querySelector('[data-fav-empty]');
    if (!list.length) { if (empty) empty.style.display = ''; wrap.innerHTML = ''; return; }
    if (empty) empty.style.display = 'none';
    wrap.innerHTML = list.map(f => `
      <div class="dhikr-card" data-reveal>
        <div class="dhikr-head">
          <h3 class="dhikr-title"><span class="lang-ar">${f.titleAr || ''}</span><span class="lang-en">${f.titleEn || f.titleAr || ''}</span></h3>
        </div>
        <div class="dhikr-body"><p class="dhikr-text-ar">${(f.text || '')}…</p></div>
        <div class="dhikr-foot"><div class="dhikr-actions">
          <a class="btn btn-ghost btn-sm" href="${f.page}">${t('فتح الصفحة', 'Open page')}</a>
          <button class="act-btn" data-remove-fav='${JSON.stringify({ id: f.id, page: f.page })}' title="${t('إزالة', 'Remove')}"><i class="fas fa-trash"></i></button>
        </div></div>
      </div>`).join('');
    wrap.querySelectorAll('[data-remove-fav]').forEach(b => b.addEventListener('click', () => {
      const key = JSON.parse(b.getAttribute('data-remove-fav'));
      let l = store.get('favorites', []).filter(f => !(f.id === key.id && f.page === key.page));
      store.set('favorites', l); renderFav();
      toast(t('تمت الإزالة', 'Removed'), 'fa-trash');
    }));
    wrap.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('in'));
  }
})();
