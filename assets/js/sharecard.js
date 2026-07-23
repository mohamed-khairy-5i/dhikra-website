/* ==========================================================================
   ذِكْرَى · Share Card — render a dhikr as a branded image with the Canvas API,
   then share it via the Web Share API (files) or fall back to a PNG download.
   Fully client-side, works offline once fonts are cached. Injects a
   "share as image" button into every .dhikr-actions row and exposes
   window.dhikraShareCard for Focus Mode to reuse. No-ops safely if <canvas>
   or the required DOM is missing.
   ========================================================================== */
(function () {
  'use strict';

  if (typeof document.createElement('canvas').getContext !== 'function') return;

  var html = document.documentElement;
  var t = function (ar, en) { return html.lang === 'en' ? en : ar; };

  var W = 1080, H = 1080; // square, ideal for social feeds
  var PALETTE = {
    bg1: '#0f2a22', bg2: '#123b30', gold: '#c9a227', goldSoft: '#e3c65e',
    ivory: '#f4efe4', muted: 'rgba(244,239,228,0.68)'
  };

  function ready(fn) { document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn); }

  // Wrap Arabic/any text to fit width; returns array of lines.
  function wrapLines(ctx, text, maxW) {
    var words = String(text).replace(/\s+/g, ' ').trim().split(' ');
    var lines = [], line = '';
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = words[i]; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  function draw(ctx, title, text) {
    // gradient background
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, PALETTE.bg1); g.addColorStop(1, PALETTE.bg2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // subtle gold frame
    ctx.strokeStyle = 'rgba(201,162,39,0.55)'; ctx.lineWidth = 4;
    ctx.strokeRect(46, 46, W - 92, H - 92);

    ctx.textAlign = 'center';

    // decorative quote mark
    ctx.fillStyle = 'rgba(201,162,39,0.28)';
    ctx.font = '700 140px Amiri, Georgia, serif';
    ctx.fillText('\u201D', W / 2, 220);

    // title (gold) — reserve a band; body starts strictly below it
    var titleBottom = 300; // baseline where the title band ends
    if (title) {
      ctx.fillStyle = PALETTE.goldSoft;
      ctx.font = '700 46px Amiri, Georgia, serif';
      var tlines = wrapLines(ctx, title, W - 260);
      var ty = 300;
      var shown = Math.min(tlines.length, 2);
      for (var i = 0; i < shown; i++) { ctx.fillText(tlines[i], W / 2, ty); ty += 62; }
      titleBottom = ty; // just under the last title line
    }

    // Content zone: between the title band and the footer
    var zoneTop = titleBottom + 40;
    var zoneBottom = H - 210;   // leave room for the brand footer
    var zoneH = zoneBottom - zoneTop;

    // body Arabic text (ivory, Amiri) — auto-fit font size to the zone
    var size = 62, lines, lineH;
    do {
      ctx.font = '400 ' + size + 'px Amiri, Georgia, serif';
      lines = wrapLines(ctx, text, W - 200);
      lineH = size * 1.62;
      if (lines.length * lineH <= zoneH || size <= 28) break;
      size -= 3;
    } while (true);

    ctx.fillStyle = PALETTE.ivory;
    var totalH = lines.length * lineH;
    var y = zoneTop + (zoneH - totalH) / 2 + lineH / 2;
    for (var j = 0; j < lines.length; j++) { ctx.fillText(lines[j], W / 2, y); y += lineH; }

    // brand footer
    ctx.fillStyle = PALETTE.gold;
    ctx.font = '700 54px Amiri, Georgia, serif';
    ctx.fillText('\u0630\u0650\u0643\u0652\u0631\u064E\u0649', W / 2, H - 120); // ذِكْرَى
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '500 30px Tajawal, Arial, sans-serif';
    ctx.fillText('dhikra.netlify.app', W / 2, H - 74);
  }

  function toBlob(canvas) {
    return new Promise(function (resolve) {
      if (canvas.toBlob) canvas.toBlob(function (b) { resolve(b); }, 'image/png');
      else resolve(null);
    });
  }

  function fontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('700 46px Amiri'),
      document.fonts.load('400 62px Amiri')
    ]).catch(function () {});
  }

  // generate(title, text[, btn]) -> shares or downloads
  function generate(title, text, btn) {
    if (!text) return;
    var restore = null;
    if (btn) { restore = btn.innerHTML; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true; }

    fontsReady().then(function () {
      var canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      var ctx = canvas.getContext('2d');
      draw(ctx, title, text);
      return toBlob(canvas);
    }).then(function (blob) {
      if (btn && restore != null) { btn.innerHTML = restore; btn.disabled = false; }
      if (!blob) { if (window.dhikraToast) window.dhikraToast(t('تعذّر إنشاء الصورة', 'Could not create image')); return; }
      var file = new File([blob], 'dhikra.png', { type: 'image/png' });

      // Prefer native share with the file
      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        navigator.share({ files: [file], title: t('ذِكْرَى', 'Dhikra') })
          .catch(function () { downloadBlob(blob); });
      } else {
        downloadBlob(blob);
      }
    }).catch(function () {
      if (btn && restore != null) { btn.innerHTML = restore; btn.disabled = false; }
      if (window.dhikraToast) window.dhikraToast(t('تعذّر إنشاء الصورة', 'Could not create image'));
    });
  }

  function downloadBlob(blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'dhikra.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    if (window.dhikraToast) window.dhikraToast(t('تم حفظ الصورة', 'Image saved'));
  }

  window.dhikraShareCard = { generate: generate };

  ready(function () {
    var cards = document.querySelectorAll('.dhikr-card');
    cards.forEach(function (card) {
      var actions = card.querySelector('.dhikr-actions');
      var textEl = card.querySelector('.dhikr-text-ar');
      var titleAr = card.querySelector('.dhikr-title .lang-ar');
      var titleEn = card.querySelector('.dhikr-title .lang-en');
      if (!actions || !textEl || actions.querySelector('[data-sharecard]')) return;

      var btn = document.createElement('button');
      btn.className = 'act-btn';
      btn.setAttribute('data-sharecard', '');
      btn.setAttribute('aria-label', t('مشاركة كصورة', 'Share as image'));
      btn.title = t('مشاركة كصورة', 'Share as image');
      btn.innerHTML = '<i class="fas fa-image"></i>';
      btn.addEventListener('click', function () {
        var title = html.lang === 'en'
          ? ((titleEn && titleEn.textContent) || (titleAr && titleAr.textContent) || '')
          : ((titleAr && titleAr.textContent) || '');
        generate(title, textEl.textContent || '', btn);
      });
      actions.appendChild(btn);
    });
  });
})();
