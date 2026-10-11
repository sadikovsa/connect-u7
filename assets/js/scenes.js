// Все сцены и движение страницы на GSAP + ScrollTrigger (assets/js/vendor).
// Сцена 1: закреплённый экран .stage: первый экран (зум к первой камере) → туннель через объектив → блок «Камера»
// (камера наезжает, пять линз выходят из раструба, по корпусу скользит свет). Остальное: появление блоков, ролики,
// «Дизайн» с парящим телефоном, «Игры» на весь экран, «Два цвета». Без GSAP или при prefers-reduced-motion страница статична.
(function () {
  'use strict';
  var root = document.documentElement;
  if (!window.gsap || !window.ScrollTrigger) { root.classList.add('no-gsap'); return; }
  gsap.registerPlugin(ScrollTrigger);

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  // Размеры кольца объектива в системе фото телефона 850x1738 (см. hero.css, .tunnel-ring)
  var RING = { fx: 0.2406, fy: 0.1105, outerFrac: 0.1859, holeFrac: 0.285 };
  var ZOOM_SCALE = 2;
  var HALO_K = 2.2;            // ореол растёт только до этого множителя и гаснет раньше: огромные слои с размытием не умещаются в память видеокарты
  var BODY_K = 6.4;            // до этого множителя тело телефона растёт вместе с кольцом; дальше кольцо закрывает весь экран          // конечный масштаб слоя телефона перед туннелем
  
  // --- Шапка: плотнее после первых пикселей прокрутки ------------------------------
  var nav = $('#nav');
  if (nav) {
    ScrollTrigger.create({ trigger: document.body, start: 'top -8px', end: 'max', onToggle: function (self) { nav.classList.toggle('is-scrolled', self.isActive); } });
  }

  // --- Первый экран: геометрия зума -----------------------------------------------
  function heroGeometry(hero, phone) {
    var frame = phone.offsetParent;
    var W = phone.offsetWidth, H = phone.offsetHeight;
    var left = frame.offsetLeft + phone.offsetLeft, top = frame.offsetTop + phone.offsetTop;
    var cw = hero.clientWidth, ch = hero.clientHeight;
    var ox = 0.22 * W, oy = 0.09 * H;
    var px = left + ox + ZOOM_SCALE * (RING.fx * W - ox);
    var py = top + oy + ZOOM_SCALE * (RING.fy * H - oy);
    var outerR = RING.outerFrac * W / 2 * ZOOM_SCALE;           // радиус кольца на экране в конце зума
    return { cw: cw, ch: ch, tx: cw / 2 - px, ty: ch / 2 - py, holeR: outerR * RING.holeFrac };
  }

  function heroZoom(tl, hero, phone, at, len) {
    gsap.set(phone, { transformOrigin: '22% 9%' });
    tl.fromTo(phone, { x: 0, y: 0, scale: 1 / 2.9 }, {
      x: function () { return heroGeometry(hero, phone).tx; },
      y: function () { return heroGeometry(hero, phone).ty; },
      scale: ZOOM_SCALE, duration: len, ease: 'power2.inOut'
    }, at);
    tl.to('.r-numeral-108', { xPercent: -34, opacity: 0, duration: len * 0.67, ease: 'sine.inOut' }, at);
    tl.to('.r-numeral-mp', { xPercent: 34, opacity: 0, duration: len * 0.67, ease: 'sine.inOut' }, at);
    tl.to(['.hero__bandbg', '.hero__band'], { yPercent: 16, opacity: 0, duration: len * 0.53, ease: 'sine.inOut' }, at);
  }

  var mm = gsap.matchMedia();
  mm.add({
    motion: '(prefers-reduced-motion: no-preference)',
    desktop: '(min-width: 1101px)',
    wide: '(min-width: 761px)'
  }, function (ctx) {
    var c = ctx.conditions;
    if (!c.motion) { return; }
    var hero = $('.hero'), phone = $('.r-phone-stage'), stage = $('#stage');

    if (c.desktop) {
      // ===== Сцена: зум → туннель → камера, один закреплённый экран =====
      var ring = $('.tunnel-ring'), body = $('.hero-phone'), halo = $('.hero-halo');
      var cam = $('.camera'), scene = $('.camera__scene'), art = $('.camera__art');
      var sweep = $('.camera__sweep');
      var lenses = $$('.lens');
      var state = { k: 1 };
      var ZOOM = 10, TUNNEL_AT = 10, TUNNEL = 14, CAM_AT = 24, CAM = 22;

      var tunnelGeo = function () {
        var g = heroGeometry(hero, phone);
        g.kMax = 1.12 * (Math.hypot(g.cw, g.ch) / 2) / g.holeR;
        return g;
      };
      var applyTunnel = function () {
        var g = tunnelGeo();
        var k = state.k;
        var bodyOn = k < BODY_K;
        gsap.set(ring, { scale: k });
        gsap.set(body, { scale: Math.min(k, BODY_K), autoAlpha: bodyOn ? 1 : 0 });
        gsap.set(halo, { scale: Math.min(k, HALO_K) });
        cam.style.clipPath = (k - 1) / (g.kMax - 1) >= 0.999 ? 'none' : 'circle(' + (g.holeR * k).toFixed(1) + 'px at 50% 50%)';
      };
      var well = function () { return { x: window.innerWidth * 0.62, y: window.innerHeight * 0.68 }; };

      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: stage, start: 'top top', end: '+=470%', pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 3 }
      });
      window.__stageTL = tl;

      // Фаза 1: приближение к первой камере
      heroZoom(tl, hero, phone, 0, ZOOM);

      // Фаза 2: резкое кольцо объектива, отверстие в телефоне, туннель
      gsap.set(ring, { transformOrigin: '49.8% 47.9%', opacity: 1 });
      gsap.set([body, halo], { transformOrigin: '24.06% 11.05%' });
      tl.to(body, { '--hr': 9.1, duration: 0.6 }, TUNNEL_AT);
      tl.to(hero, { backgroundColor: 'rgba(10,10,10,0)', duration: 0.6 }, TUNNEL_AT);
      tl.fromTo(['.hero-sparks', halo], { autoAlpha: 1 }, { autoAlpha: 0, duration: 4, ease: 'power1.in' }, TUNNEL_AT);
      cam.style.clipPath = 'circle(0px at 50% 50%)';
      tl.to(state, { k: function () { return tunnelGeo().kMax; }, duration: TUNNEL, ease: 'power3.in', onUpdate: applyTunnel }, TUNNEL_AT);

      // За отверстием: пустой раструб верхней камеры, затем блок «Камера» разворачивается на весь экран
      gsap.set(scene, { transformOrigin: function () { var w = well(); return w.x + 'px ' + w.y + 'px'; } });
      tl.fromTo(scene,
        { scale: 0.5, x: function () { return window.innerWidth / 2 - well().x; }, y: function () { return window.innerHeight / 2 - well().y; } },
        { scale: 1, x: 0, y: 0, duration: TUNNEL, ease: 'power2.out' }, TUNNEL_AT);
      // .hero целиком не прячем: visibility: hidden на предке убирает h1 из дерева доступности. Прячем видимое и кнопку, h1 остаётся (полоса к этому времени прозрачна)
      tl.set([phone, '.numerals', '.hero__bandbg', '.r-buy-cta'], { visibility: 'hidden' }, CAM_AT);
      tl.set(hero, { pointerEvents: 'none' }, CAM_AT);

      // Фаза 3: «Камера»: текст, наезд, пять линз, блик
      gsap.set(['.camera__copy', '.camera__metrics', '.camera__cap'], { opacity: 1 });
      tl.fromTo(['.camera__copy > *', '.camera__metrics > div', '.camera__cap'], { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 3, stagger: 0.35, ease: 'power3.out' }, CAM_AT - 2);
      tl.fromTo(art, { scale: 1 }, { scale: 1.06, duration: CAM, ease: 'power1.inOut' }, CAM_AT);
      lenses.forEach(function (lens, n) {
        var t = parseFloat(lens.style.getPropertyValue('--t')) || 0;
        var d = lens.style.getPropertyValue('--d') === '0' ? 0 : 0.06;
        if (!t) { return; }
        tl.fromTo(lens, { yPercent: t, scale: 1 - d }, { yPercent: 0, scale: 1, duration: 0.64 * CAM, ease: 'power2.inOut' }, CAM_AT + n * 0.09 * CAM);
      });
      tl.fromTo(sweep, { xPercent: -70 }, { xPercent: 70, duration: CAM }, CAM_AT);
    } else {
      // Планшет и телефон: первый экран закреплён и приближается, камера идёт обычным блоком
      var ctl = gsap.timeline({ defaults: { ease: 'none' },
        scrollTrigger: { trigger: hero, start: 'top top', end: '+=170%', pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 3 } });
      heroZoom(ctl, hero, phone, 0, 10);
    }

    // ===== Ролики-карточки: рамка растёт при въезде =====
    $$('.vcard__frame').forEach(function (f) {
      gsap.fromTo(f, { scale: 0.9 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: f, start: 'top 92%', end: 'top 45%', scrub: 0.5 } });
    });

    // ===== Дизайн: парящий телефон над рукой =====
    var fl = $('.float');
    if (fl) {
      var fr = { trigger: fl, start: 'top bottom', end: 'bottom top', scrub: 0.6 };
      gsap.fromTo('.float__world', { scale: 1 }, { scale: 1.06, ease: 'none', scrollTrigger: fr });
      gsap.fromTo('.float__phone', { yPercent: 4.5, rotation: 1.6 }, { yPercent: -4.5, rotation: -1.6, ease: 'none', scrollTrigger: fr });
      gsap.to('.float__phone img', { yPercent: -2.4, rotation: 0.8, duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.fromTo('.float__glow', { opacity: 0.95, scale: 1 }, { opacity: 0.55, scale: 0.9, duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    }

    // ===== Игры: ролик растёт до полного экрана =====
    var game = $('.game');
    if (game && c.wide) {
      var gtl = gsap.timeline({ defaults: { ease: 'none' },
        scrollTrigger: { trigger: game, start: 'top top', end: '+=140%', pin: true, scrub: 0.6, anticipatePin: 1, refreshPriority: 2 } });
      gtl.fromTo('.game__frame', { scale: 0.5, borderRadius: 40 }, { scale: 1, borderRadius: 0, duration: 0.7 }, 0);
      gtl.to('.game__head', { opacity: 0, y: -36, duration: 0.38 }, 0);
      gtl.to({}, { duration: 0.3 }, 0.7);
    }

    // ===== Два цвета: телефоны разъезжаются и парят =====
    var duo = $('.duo');
    if (duo) {
      var pw = $('.duo__phone--white'), pb = $('.duo__phone--black');
      gsap.set([pw, pb], { transformOrigin: '56.7% 48%', scale: 0.68 });
      gsap.set('.duo__title', { yPercent: -50 });
      var range = { trigger: duo, start: 'top bottom', end: 'bottom top', scrub: 0.6 };
      gsap.fromTo(pw, { xPercent: 9.3 + 7.5, yPercent: 3.5 - 1.5, rotation: 1.2 }, { xPercent: 9.3 - 7.5, yPercent: 3.5 + 1.5, rotation: -1.2, ease: 'none', scrollTrigger: range });
      gsap.fromTo(pb, { xPercent: 9.3 - 7.5, yPercent: 3.5 + 1.5, rotation: -1.2 }, { xPercent: 9.3 + 7.5, yPercent: 3.5 - 1.5, rotation: 1.2, ease: 'none', scrollTrigger: range });
      gsap.fromTo('.duo__sweep', { xPercent: -70 }, { xPercent: 70, ease: 'none', scrollTrigger: range });
      gsap.to(pw, { y: function () { return -0.022 * pw.offsetHeight; }, duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.to(pb, { y: function () { return -0.022 * pb.offsetHeight; }, duration: 4.25, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1 });
      ScrollTrigger.create({ trigger: duo, start: 'top 75%', once: true, onEnter: function () {
        gsap.timeline()
          .to('.duo__veil', { opacity: 0, duration: 1.6, ease: 'power3.out' }, 0)
          .fromTo('.duo__title', { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' }, 0.5)
          .to('.duo__cap', { opacity: 1, duration: 1.1, ease: 'power2.out' }, 0.5);
      } });
    }

    // ===== Появление блоков при прокрутке =====
    var seen = new WeakSet();
    $$('[data-reveal]').forEach(function (el) {
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () {
        if (seen.has(el)) { return; }
        var parent = el.parentElement;
        var grouped = parent.matches('.metrics, .facts__list, .kit__list, .float__facts');
        var group = grouped ? $$('[data-reveal]', parent).filter(function (s) { return s.parentElement === parent && !seen.has(s); }) : [el];
        group.forEach(function (g) { seen.add(g); });
        gsap.to(group, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09, overwrite: 'auto' });
      } });
    });
  });

  // Пересчёт позиций после загрузки шрифтов и картинок
  window.addEventListener('load', function () { ScrollTrigger.sort(); ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { ScrollTrigger.refresh(); }); }
})();
