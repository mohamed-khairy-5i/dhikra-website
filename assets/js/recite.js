/* ==========================================================================
   ذِكْرَى · Recite — client-side Arabic recitation via the Web Speech API
   (SpeechSynthesis). No audio files, no server, works offline where the
   browser ships an Arabic voice. Progressive-enhancement: if the API or an
   Arabic voice is missing, the button is simply not injected — nothing breaks.
   Injects a listen/stop button into every .dhikr-actions row, and exposes
   window.dhikraRecite for the Focus Mode overlay to reuse.
   ========================================================================== */
(function () {
  'use strict';

  var synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;

  var html = document.documentElement;
  var t = function (ar, en) { return html.lang === 'en' ? en : ar; };

  var arVoice = null;
  var voicesReady = false;

  function pickVoice() {
    var voices = synth.getVoices() || [];
    // prefer an explicit Arabic voice; fall back to any ar-* locale
    arVoice = voices.filter(function (v) { return /^ar(\b|-)/i.test(v.lang); })[0]
      || voices.filter(function (v) { return /arab/i.test(v.name); })[0]
      || null;
    voicesReady = true;
  }
  pickVoice();
  if (synth.onvoiceschanged !== undefined) {
    synth.addEventListener('voiceschanged', pickVoice);
  }

  var current = null; // currently-speaking button (for icon state)

  function stop() {
    try { synth.cancel(); } catch (e) {}
    if (current) { setIcon(current, false); current = null; }
  }

  function setIcon(btn, playing) {
    var i = btn.querySelector('i');
    if (!i) return;
    i.className = playing ? 'fas fa-stop' : 'fas fa-volume-high';
    btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
  }

  // speak(text, btn) — toggles: if btn already speaking, stop; else speak.
  function speak(text, btn) {
    if (!text) return;
    var wasCurrent = current === btn;
    stop();
    if (wasCurrent) return; // second click on same button = just stop

    var u = new SpeechSynthesisUtterance(text);
    u.lang = arVoice ? arVoice.lang : 'ar-SA';
    if (arVoice) u.voice = arVoice;
    u.rate = 0.9;   // a calm, measured pace for dhikr
    u.pitch = 1.0;
    u.onend = function () { if (current === btn) { setIcon(btn, false); current = null; } };
    u.onerror = function () { if (current === btn) { setIcon(btn, false); current = null; } };
    current = btn;
    setIcon(btn, true);
    try { synth.speak(u); } catch (e) { setIcon(btn, false); current = null; }
  }

  // expose for Focus Mode
  window.dhikraRecite = { speak: speak, stop: stop };

  function ready(fn) { document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn); }

  ready(function () {
    var cards = document.querySelectorAll('.dhikr-card');
    if (!cards.length) return;

    cards.forEach(function (card) {
      var actions = card.querySelector('.dhikr-actions');
      var textEl = card.querySelector('.dhikr-text-ar');
      if (!actions || !textEl || actions.querySelector('[data-recite]')) return;

      var btn = document.createElement('button');
      btn.className = 'act-btn';
      btn.setAttribute('data-recite', '');
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', t('استماع', 'Listen'));
      btn.title = t('استماع', 'Listen');
      btn.innerHTML = '<i class="fas fa-volume-high"></i>';
      btn.addEventListener('click', function () {
        speak(textEl.textContent || '', btn);
      });
      // place listen right after the tap-counter (before favourite)
      var fav = actions.querySelector('[data-fav]');
      if (fav) actions.insertBefore(btn, fav);
      else actions.appendChild(btn);
    });

    // stop speaking when leaving the page or switching language
    window.addEventListener('pagehide', stop);
    window.addEventListener('beforeunload', stop);
    window.addEventListener('langchange', stop);
  });
})();
