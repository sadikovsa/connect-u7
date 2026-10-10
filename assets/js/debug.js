// Диагностика плавности: откройте страницу с ?debug (например index.html?debug), листайте и сделайте скриншот.
// Показывает FPS, самый долгий кадр за 5 с, число кадров дольше 50 мс, видеокарту и размер окна. Без ?debug ничего не делает.
(function () {
  'use strict';
  if (!/[?&]debug\b/.test(location.search)) { return; }
  var box = document.createElement('div');
  box.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;padding:8px 10px;border-radius:8px;background:rgba(0,0,0,.82);color:#7CFF9B;font:12px/1.4 monospace;pointer-events:none;white-space:pre';
  document.body.appendChild(box);
  var gpu = 'н/д';
  try {
    var gl = document.createElement('canvas').getContext('webgl');
    var ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) { gpu = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL); }
  } catch (e) { /* без WebGL остаётся «н/д» */ }
  var last = performance.now(), frames = 0, worst = 0, slow = 0, t0 = last, fps = 0, win = [];
  function tick(now) {
    var d = now - last; last = now; frames++; win.push([now, d]);
    while (win.length && now - win[0][0] > 5000) { win.shift(); }
    worst = win.reduce(function (m, w) { return Math.max(m, w[1]); }, 0);
    slow = win.filter(function (w) { return w[1] > 50; }).length;
    if (now - t0 >= 500) { fps = Math.round(frames * 1000 / (now - t0)); frames = 0; t0 = now; }
    box.textContent = 'FPS ' + fps + '   худший кадр (5 с) ' + Math.round(worst) + ' мс   кадров >50 мс: ' + slow +
      '\nокно ' + innerWidth + 'x' + innerHeight + '  dpr ' + devicePixelRatio + '  scrollY ' + Math.round(scrollY) + '\nGPU: ' + gpu;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
