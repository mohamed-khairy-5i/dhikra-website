/* ذِكْرَى Assistant — client-side, zero-cost, offline smart search over site content.
   Scoped strictly to the dhikr index. No external API, no tracking. */
(function () {
  'use strict';
  var IDX = null, loading = false;
  var lang = function () { return document.documentElement.lang === 'en' ? 'en' : 'ar'; };
  var t = function (ar, en) { return lang() === 'en' ? en : ar; };

  // Intent map: natural situations -> keywords to boost
  var INTENTS = [
    { k: ['صباح', 'اصبح', 'morning', 'wake', 'استيقظ', 'استيقاظ'], boost: ['صباح', 'اصبحنا', 'استيقاظ'], page: 'adhkar-sabah.html' },
    { k: ['مساء', 'امسي', 'evening', 'اخر النهار'], boost: ['مساء', 'امسينا'], page: 'adhkar-masaa.html' },
    { k: ['نوم', 'انام', 'sleep', 'قبل النوم', 'الفراش'], boost: ['نوم', 'اضطجع', 'فراش'], page: 'adhkar-nawm.html' },
    { k: ['اكل', 'طعام', 'food', 'eat', 'شراب', 'افطر'], boost: ['طعام', 'اكل', 'شراب'], page: 'adhkar-food.html' },
    { k: ['سفر', 'travel', 'ركوب', 'سيارة', 'طريق'], boost: ['سفر', 'ركوب', 'خرجت'], page: 'adhkar-travel.html' },
    { k: ['هم', 'حزن', 'قلق', 'كرب', 'ضيق', 'anxiety', 'worry', 'sad', 'stress'], boost: ['كرب', 'هم', 'حزن', 'لا اله الا انت'], page: 'adhkar-istighfar.html' },
    { k: ['استغفار', 'ذنب', 'توبة', 'forgive', 'sin'], boost: ['استغفر', 'اغفر', 'توب'], page: 'adhkar-istighfar.html' },
    { k: ['صلاة', 'صلاه', 'prayer', 'بعد الصلاة'], boost: ['صلاة', 'دبر', 'تشهد'], page: 'adhkar-salah.html' },
    { k: ['وضوء', 'wudu', 'ablution'], boost: ['وضوء', 'توضأ'], page: 'adhkar-wudu.html' },
    { k: ['بيت', 'منزل', 'home', 'دخول', 'خروج'], boost: ['بيت', 'منزل', 'دخل'], page: 'adhkar-home.html' },
    { k: ['مسجد', 'mosque'], boost: ['مسجد'], page: 'adhkar-mosque.html' },
    { k: ['مطر', 'ريح', 'weather', 'rain', 'رعد'], boost: ['مطر', 'ريح', 'رعد'], page: 'adhkar-weather.html' },
    { k: ['مرض', 'شفاء', 'heal', 'sick', 'وجع', 'الم'], boost: ['شفاء', 'مرض', 'اشف'], page: 'adhkar-healing.html' },
    { k: ['استخارة', 'istikhara', 'قرار', 'اختيار'], boost: ['استخارة', 'استخير'], page: 'adhkar-istikhara.html' },
    { k: ['عمل', 'work', 'وظيفة', 'دراسة', 'امتحان'], boost: ['عمل', 'رزق'], page: 'adhkar-work.html' }
  ];

  function norm(s) { return (s || '').replace(/[\u064B-\u0652\u0670\u0640]/g, '').toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه'); }

  function load(cb) {
    if (IDX) { cb(); return; }
    if (loading) return;
    loading = true;
    fetch('assets/js/index.json').then(function (r) { return r.json(); }).then(function (j) {
      IDX = j.map(function (d) { d.s = norm(d.s); return d; });
      cb();
    }).catch(function () { loading = false; });
  }

  function search(q) {
    if (!IDX) return [];
    var nq = norm(q);
    var words = nq.split(/\s+/).filter(function (w) { return w.length > 1; });
    var boosts = [];
    INTENTS.forEach(function (it) {
      if (it.k.some(function (k) { return nq.indexOf(norm(k)) !== -1; })) boosts = boosts.concat(it.boost.map(norm));
    });
    var scored = IDX.map(function (d) {
      var score = 0;
      words.forEach(function (w) { if (d.s.indexOf(w) !== -1) score += 2; });
      boosts.forEach(function (b) { if (d.s.indexOf(b) !== -1) score += 3; });
      // phrase bonus
      if (nq.length > 3 && d.s.indexOf(nq) !== -1) score += 5;
      return { d: d, score: score };
    }).filter(function (r) { return r.score > 0; });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, 6).map(function (r) { return r.d; });
  }

  function render(results, q) {
    var box = document.getElementById('asst-results');
    if (!q.trim()) { box.innerHTML = ''; return; }
    if (!results.length) {
      box.innerHTML = '<div class="asst-empty">' + t('لم أجد ذِكراً مطابقاً. جرّب وصف الموقف، مثل: «ماذا أقول قبل النوم؟»', 'No matching dhikr. Try describing the situation, e.g. "What do I say before sleeping?"') + '</div>';
      return;
    }
    box.innerHTML = results.map(function (d) {
      var title = lang() === 'en' ? (d.te || d.ta) : d.ta;
      var pg = lang() === 'en' ? d.pe : d.pa;
      return '<a class="asst-item" href="' + d.p + '#' + d.id + '">'
        + '<div class="asst-title">' + title + '</div>'
        + '<div class="asst-snip">' + d.x + '…</div>'
        + '<div class="asst-page"><i class="fas fa-location-dot"></i> ' + pg + '</div>'
        + '</a>';
    }).join('');
  }

  function build() {
    if (document.getElementById('asst-fab')) return;
    var fab = document.createElement('button');
    fab.id = 'asst-fab';
    fab.className = 'asst-fab';
    fab.setAttribute('aria-label', 'Dhikra Assistant');
    fab.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i>';
    document.body.appendChild(fab);

    var panel = document.createElement('div');
    panel.id = 'asst-panel';
    panel.className = 'asst-panel';
    panel.setAttribute('role', 'dialog');
    panel.innerHTML =
      '<div class="asst-head">'
      + '<div><b class="asst-name">' + t('مساعد ذِكْرَى', 'Dhikra Assistant') + '</b>'
      + '<span class="asst-sub">' + t('صف موقفك وسأدلّك على الذِّكر المناسب', 'Describe your situation and I\u2019ll find the right dhikr') + '</span></div>'
      + '<button class="asst-close" aria-label="close"><i class="fas fa-xmark"></i></button></div>'
      + '<div class="asst-search"><i class="fas fa-magnifying-glass"></i>'
      + '<input id="asst-input" type="search" autocomplete="off" placeholder="' + t('مثال: ماذا أقول عند الخوف؟', 'e.g. What do I say when afraid?') + '">'
      + '</div>'
      + '<div class="asst-chips" id="asst-chips"></div>'
      + '<div class="asst-results" id="asst-results"></div>'
      + '<div class="asst-foot"><i class="fas fa-shield-halved"></i> ' + t('يعمل داخل جهازك بالكامل — بدون إنترنت وبدون تتبّع.', 'Runs entirely on your device — offline and private.') + '</div>';
    document.body.appendChild(panel);

    var chips = lang() === 'en'
      ? ['Before sleeping', 'When anxious', 'After prayer', 'Before travel', 'When eating']
      : ['قبل النوم', 'عند الهمّ والقلق', 'بعد الصلاة', 'قبل السفر', 'عند الطعام'];
    document.getElementById('asst-chips').innerHTML = chips.map(function (c) {
      return '<button class="asst-chip" data-q="' + c + '">' + c + '</button>';
    }).join('');

    function open() { panel.classList.add('open'); fab.classList.add('active'); load(function () { }); setTimeout(function () { var i = document.getElementById('asst-input'); if (i) i.focus(); }, 200); }
    function close() { panel.classList.remove('open'); fab.classList.remove('active'); }
    fab.addEventListener('click', function () { panel.classList.contains('open') ? close() : open(); });
    panel.querySelector('.asst-close').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    var input = document.getElementById('asst-input');
    var deb;
    function run() {
      var q = input.value;
      load(function () { render(search(q), q); });
    }
    input.addEventListener('input', function () { clearTimeout(deb); deb = setTimeout(run, 120); });
    document.getElementById('asst-chips').addEventListener('click', function (e) {
      var b = e.target.closest('.asst-chip'); if (!b) return;
      input.value = b.dataset.q; run(); input.focus();
    });
  }

  if (document.readyState !== 'loading') build();
  else document.addEventListener('DOMContentLoaded', build);
})();
