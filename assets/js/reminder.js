/* ==========================================================================
   ذِكْرَى · Reminder — privacy-first daily adhkar reminder.
   No push server, no background sync: a local Notification is shown when the
   site is open at the user's chosen time (checked twice a minute). If the tab
   is closed at that moment we fall back to an in-page toast. Settings persist
   in localStorage. No-ops safely if the reminder panel is absent.
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
    var timeEl = document.getElementById('rem-time');
    var toggle = document.getElementById('rem-toggle');
    var status = document.getElementById('rem-status');
    if (!timeEl || !toggle || !status) return;

    var KEY = 'reminder';
    var cfg = store.get(KEY, { on: false, time: '07:00', firedOn: '' });
    var timer = null;
    var supported = 'Notification' in window;

    function today() { return new Date().toISOString().slice(0, 10); }

    function render() {
      timeEl.value = cfg.time || '07:00';
      toggle.setAttribute('aria-pressed', cfg.on ? 'true' : 'false');
      toggle.classList.toggle('is-on', !!cfg.on);
      var lab = toggle.querySelectorAll('span');
      if (lab[0]) lab[0].textContent = cfg.on ? 'إيقاف' : 'تفعيل';
      if (lab[1]) lab[1].textContent = cfg.on ? 'Disable' : 'Enable';
      if (cfg.on) {
        status.innerHTML = '<span class="lang-ar">التذكير مُفعّل الساعة ' + cfg.time + '.</span>' +
          '<span class="lang-en">Reminder is on at ' + cfg.time + '.</span>';
      } else {
        status.innerHTML = '<span class="lang-ar">التذكير معطّل.</span><span class="lang-en">Reminder is off.</span>';
      }
    }

    function notify() {
      var bodyAr = 'خُذ لحظة لذِكر الله. 🤍';
      var bodyEn = 'Take a moment to remember Allah. 🤍';
      var title = t('ذِكْرَى · حان وقت أذكارك', 'Dhikra · Time for your adhkar');
      var body = t(bodyAr, bodyEn);
      var shown = false;
      if (supported && Notification.permission === 'granted') {
        try {
          var n = new Notification(title, { body: body, icon: 'assets/img/icon-192.png', tag: 'dhikra-reminder' });
          n.onclick = function () { window.focus(); try { n.close(); } catch (e) {} };
          shown = true;
        } catch (e) {}
      }
      if (!shown && window.dhikraToast) window.dhikraToast(body);
    }

    function check() {
      if (!cfg.on) return;
      var now = new Date();
      var hhmm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      if (hhmm === cfg.time && cfg.firedOn !== today()) {
        cfg.firedOn = today();
        store.set(KEY, cfg);
        notify();
      }
    }

    function startTimer() {
      if (timer) clearInterval(timer);
      timer = setInterval(check, 30000); // twice a minute
      check();
    }
    function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

    function enable() {
      function go() {
        cfg.on = true; cfg.firedOn = ''; store.set(KEY, cfg);
        render(); startTimer();
        if (window.dhikraToast) window.dhikraToast(t('تم تفعيل التذكير اليومي', 'Daily reminder enabled'));
      }
      if (supported && Notification.permission === 'default') {
        Notification.requestPermission().then(function () { go(); }).catch(go);
      } else {
        go();
      }
    }
    function disable() {
      cfg.on = false; store.set(KEY, cfg);
      render(); stopTimer();
      if (window.dhikraToast) window.dhikraToast(t('تم إيقاف التذكير', 'Reminder disabled'));
    }

    toggle.addEventListener('click', function () { cfg.on ? disable() : enable(); });
    timeEl.addEventListener('change', function () {
      cfg.time = timeEl.value || '07:00'; cfg.firedOn = ''; store.set(KEY, cfg);
      render(); if (cfg.on) check();
    });
    window.addEventListener('langchange', render);

    render();
    if (cfg.on) startTimer();
  });
})();
