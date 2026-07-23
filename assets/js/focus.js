/* ==========================================================================
   ذِكْرَى · Focus Mode — guided, one-dhikr-at-a-time full-screen session.
   Reads the existing .dhikr-card list on adhkar pages (no data duplication),
   syncs tap counts back to the same localStorage progress keys used by app.js,
   and uses View Transitions when available. Pure client-side, works offline.
   No-ops safely when there is no .dhikr-list on the page.
   ========================================================================== */
(function () {
  'use strict';

  var html = document.documentElement;
  var t = function (ar, en) { return html.lang === 'en' ? en : ar; };
  var store = {
    get: function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  function ready(fn) { document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn); }

  ready(function () {
    var list = document.querySelector('.dhikr-list');
    var startBtn = document.querySelector('[data-focus-start]');
    if (!list || !startBtn) return;

    var cards = Array.prototype.slice.call(list.querySelectorAll('.dhikr-card'));
    if (!cards.length) return;

    var pageKey = 'progress:' + location.pathname.split('/').pop();
    var idx = 0;

    // Build overlay once
    var ov = document.createElement('div');
    ov.className = 'focus-overlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.hidden = true;
    ov.innerHTML =
      '<div class="focus-bar">' +
        '<span class="focus-step" data-focus-step></span>' +
        '<div class="focus-track"><span class="focus-fill" data-focus-fill></span></div>' +
        '<button class="focus-x" data-focus-close aria-label="' + t('إغلاق', 'Close') + '"><i class="fas fa-xmark"></i></button>' +
      '</div>' +
      '<div class="focus-stage">' +
        '<h2 class="focus-title" data-focus-title></h2>' +
        '<p class="focus-text" data-focus-text></p>' +
        '<div class="focus-count" data-focus-count></div>' +
        '<button class="focus-tap" data-focus-tap>' +
          '<span class="lang-ar">اضغط للعدّ</span><span class="lang-en">Tap to count</span>' +
        '</button>' +
        '<div class="focus-tools">' +
          '<button class="focus-listen" data-focus-listen hidden aria-pressed="false">' +
            '<i class="fas fa-volume-high"></i>' +
            '<span class="lang-ar">استماع</span><span class="lang-en">Listen</span>' +
          '</button>' +
          '<button class="focus-listen" data-focus-share hidden>' +
            '<i class="fas fa-image"></i>' +
            '<span class="lang-ar">مشاركة كصورة</span><span class="lang-en">Share image</span>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="focus-nav">' +
        '<button class="btn btn-ghost" data-focus-prev><i class="fas fa-chevron-right"></i><span class="lang-ar">السابق</span><span class="lang-en">Prev</span></button>' +
        '<button class="btn btn-primary" data-focus-next><span class="lang-ar">التالي</span><span class="lang-en">Next</span><i class="fas fa-chevron-left"></i></button>' +
      '</div>';
    document.body.appendChild(ov);

    var elStep = ov.querySelector('[data-focus-step]');
    var elFill = ov.querySelector('[data-focus-fill]');
    var elTitle = ov.querySelector('[data-focus-title]');
    var elText = ov.querySelector('[data-focus-text]');
    var elCount = ov.querySelector('[data-focus-count]');
    var tapBtn = ov.querySelector('[data-focus-tap]');
    var prevBtn = ov.querySelector('[data-focus-prev]');
    var nextBtn = ov.querySelector('[data-focus-next]');
    var listenBtn = ov.querySelector('[data-focus-listen]');

    // Reveal the listen button only if recitation is available on this device.
    if (window.dhikraRecite && listenBtn) {
      listenBtn.hidden = false;
      listenBtn.addEventListener('click', function () {
        window.dhikraRecite.speak(elText.textContent || '', listenBtn);
      });
    }

    // Reveal the share-as-image button if the Canvas share card is available.
    var shareBtn = ov.querySelector('[data-focus-share]');
    if (window.dhikraShareCard && shareBtn) {
      shareBtn.hidden = false;
      shareBtn.addEventListener('click', function () {
        window.dhikraShareCard.generate(elTitle.textContent || '', elText.textContent || '', shareBtn);
      });
    }

    function target(i) { return parseInt(cards[i].dataset.count || '1', 10); }
    function cardId(i) { return cards[i].dataset.id || ('d' + i); }

    function currentN(i) {
      var p = store.get(pageKey, {});
      return p[cardId(i)] || 0;
    }
    function setN(i, n) {
      var p = store.get(pageKey, {});
      p[cardId(i)] = n; store.set(pageKey, p);
      // keep the underlying card visually in sync so app.js ring matches on close
      var card = cards[i];
      var numEl = card.querySelector('.tap-num');
      var tgt = target(i);
      if (numEl) numEl.textContent = n + ' / ' + tgt;
      card.classList.toggle('done', n >= tgt);
      var cnt = card.querySelector('.tap-counter');
      if (cnt) cnt.classList.toggle('complete', n >= tgt);
    }

    function paint() {
      var card = cards[idx];
      var titleAr = (card.querySelector('.dhikr-title .lang-ar') || {}).textContent || '';
      var titleEn = (card.querySelector('.dhikr-title .lang-en') || {}).textContent || titleAr;
      var text = (card.querySelector('.dhikr-text-ar') || {}).textContent || '';
      elTitle.textContent = html.lang === 'en' ? titleEn : titleAr;
      elText.textContent = text;
      var n = currentN(idx), tgt = target(idx);
      elCount.textContent = n + ' / ' + tgt;
      elCount.classList.toggle('complete', n >= tgt);
      elStep.textContent = t((idx + 1) + ' من ' + cards.length, (idx + 1) + ' of ' + cards.length);
      elFill.style.width = Math.round(((idx + 1) / cards.length) * 100) + '%';
      prevBtn.disabled = idx === 0;
      nextBtn.innerHTML = idx === cards.length - 1
        ? '<span class="lang-ar">إنهاء</span><span class="lang-en">Finish</span><i class="fas fa-check"></i>'
        : '<span class="lang-ar">التالي</span><span class="lang-en">Next</span><i class="fas fa-chevron-left"></i>';
    }

    function go(dir) {
      if (window.dhikraRecite) window.dhikraRecite.stop();
      var next = idx + dir;
      if (next < 0) return;
      if (next >= cards.length) { close(); return; }
      idx = next;
      if (document.startViewTransition) document.startViewTransition(paint);
      else paint();
    }

    function tap() {
      var n = currentN(idx), tgt = target(idx);
      n = n >= tgt ? 0 : n + 1;
      setN(idx, n);
      elCount.textContent = n + ' / ' + tgt;
      elCount.classList.toggle('complete', n >= tgt);
      if ('vibrate' in navigator) navigator.vibrate(n >= tgt ? [18, 30, 18] : 10);
      // auto-advance when a dhikr is completed (small delay for feedback)
      if (n >= tgt && idx < cards.length - 1) setTimeout(function () { go(1); }, 480);
    }

    function open() {
      idx = 0; paint();
      ov.hidden = false;
      document.body.classList.add('focus-open');
      document.addEventListener('keydown', onKey);
    }
    function close() {
      if (window.dhikraRecite) window.dhikraRecite.stop();
      ov.hidden = true;
      document.body.classList.remove('focus-open');
      document.removeEventListener('keydown', onKey);
      // let app.js recompute the ring from the synced classes
      window.scrollTo({ top: window.scrollY });
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(html.lang === 'en' ? -1 : 1);
      else if (e.key === 'ArrowLeft') go(html.lang === 'en' ? 1 : -1);
      else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tap(); }
    }

    startBtn.addEventListener('click', open);
    ov.querySelector('[data-focus-close]').addEventListener('click', close);
    tapBtn.addEventListener('click', tap);
    prevBtn.addEventListener('click', function () { go(-1); });
    nextBtn.addEventListener('click', function () { go(1); });
  });
})();
