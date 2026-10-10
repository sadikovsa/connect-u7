// Остальное поведение страницы: ролики играют, пока видны; плавные аккордеоны характеристик на GSAP.
// Сцены и прокрутка: assets/js/scenes.js. Без JS страница полностью читается.
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!window.gsap;

  // --- Видео: играют, пока видны в окне; при prefers-reduced-motion остаётся постер с элементами управления ---
  var videos = [].slice.call(document.querySelectorAll('video[data-autoplay]'));
  if (reduce || !('IntersectionObserver' in window)) {
    videos.forEach(function (v) { v.controls = true; });
  } else {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) {
          v.preload = 'auto';
          var p = v.play();
          if (p && p.catch) { p.catch(function () { /* прерванный запуск (ролик ушёл из окна) не повод показывать элементы управления */ }); }
        } else { v.pause(); }
      });
    }, { threshold: 0.25 });
    videos.forEach(function (v) { vio.observe(v); });
  }

  // --- Плавные аккордеоны характеристик ----------------------------------------
  var groups = [].slice.call(document.querySelectorAll('.spec-group'));
  groups.forEach(function (d) { d._open = d.open; });
  function settle() { if (window.ScrollTrigger) { window.ScrollTrigger.refresh(); } }
  function setOpen(d, open) {
    if (d._open === open) { return; }
    d._open = open;
    var body = d.querySelector('.spec-body');
    if (!body || reduce || !hasGsap) { d.open = open; settle(); return; }
    gsap.killTweensOf(body);
    gsap.set(body, { overflow: 'hidden' });
    if (open) {
      d.open = true;
      gsap.fromTo(body, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.56, ease: 'expo.out',
        onComplete: function () { gsap.set(body, { clearProps: 'height,opacity' }); settle(); } });
    } else {
      gsap.to(body, { height: 0, opacity: 0, duration: 0.42, ease: 'power3.out',
        onComplete: function () { d.open = false; gsap.set(body, { clearProps: 'height,opacity' }); settle(); } });
    }
  }
  groups.forEach(function (d) {
    var s = d.querySelector('summary');
    if (!s) { return; }
    s.addEventListener('click', function (e) { e.preventDefault(); setOpen(d, !d._open); });
  });
  var tools = document.getElementById('specs-tools');
  if (tools && groups.length) {
    tools.hidden = false;
    tools.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-expand]');
      if (!btn) { return; }
      var open = btn.getAttribute('data-expand') === 'all';
      groups.forEach(function (g, i) { window.setTimeout(function () { setOpen(g, open); }, reduce ? 0 : i * 55); });
    });
  }
  if (window.location.hash === '#specs') {
    groups.forEach(function (g, i) { if (i < 3) { g._open = true; g.open = true; } });
  }
})();
