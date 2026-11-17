/* Aurora 046 · Prédios de serviço animados (por enquanto: Ferraria).
   Desenha por cima da arte do prédio, dentro da mesma camada (respeita profundidade), usando G.A.BuildingArt[id]
   (src/buildings-art.js). Coordenadas em pixels da IMAGEM do prédio (a arte embutida, ex.: ferraria 104×114),
   convertidas para a tela pelo mapa `m`. Só visual. */
(function () {
  'use strict';
  if (typeof G === 'undefined' || G.HEADLESS || !G.A || !G.R || !G.W) return;
  const A = G.A, R = G.R, W = G.W;
  const IMG = { ferraria: [104, 114] };   // tamanho da arte embutida em aurora-building-image-sprites
  const media = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  let crafted = -1, craftUntil = 0;

  /* mesma conta do embrulho de imagem: a arte é escalada pelo tier e alinhada embaixo e ao centro do sprite original */
  const mapFor = (id, lvl, p, sp, X, Y, z) => {
    const [iw, ih] = IMG[id], tier = lvl < 3 ? 0 : lvl < 6 ? 1 : lvl < 10 ? 2 : 3, sc = [0.91, 0.94, 0.97, 1][tier];
    const w = Math.round(sp.w * sc), h = Math.round(sp.h * sc), ox = Math.round((sp.w - w) / 2), oy = sp.h - h;
    const dx = Math.round(X(p.x) - 4 * z), dy = Math.round(Y(p.y + 4) - (sp.h - 4) * z), kx = w / iw * z, ky = h / ih * z;
    return { z, kx, ky, s: (kx + ky) / 2, x0: dx + ox * z, y0: dy + oy * z, sx: ix => dx + (ox + ix * w / iw) * z, sy: iy => dy + (oy + iy * h / ih) * z,
      /* recorta um pedaço da arte original (ex.: redesenhar a bigorna por cima do ferreiro) */
      blit: (ctx, ix, iy, iw2, ih2) => { const fx = sp.cv.width / sp.w, fy = sp.cv.height / sp.h; ctx.drawImage(sp.cv, (ox + ix * w / iw) * fx, (oy + iy * h / ih) * fy, iw2 * w / iw * fx, ih2 * h / ih * fy, dx + (ox + ix * w / iw) * z, dy + (oy + iy * h / ih) * z, iw2 * kx, ih2 * ky); } };
  };

  const work0 = R.bldWork;
  R.bldWork = function (id, lvl, p, sp, X, Y, z) {
    if (work0) work0.apply(this, arguments);
    const art = A.BuildingArt && A.BuildingArt[id];
    if (!art || !IMG[id] || !(lvl > 0) || !sp || !sp.cv) return;
    const S = G.S, b = S && S.b[id];
    if (id === 'ferraria' && S) { if (S.stats.crafted !== crafted) { if (crafted >= 0) craftUntil = S.t + 7; crafted = S.stats.crafted; } }
    const hr = S ? (S.clock % 1440) / 60 : 12;
    const o = { quiet: !!((S && S.opts.reduceMotion) || media.matches), light: !!(S && S.opts.lowFx), dark: S ? G.darkness(S.clock) : 0, hour: hr,
      damaged: !!(b && b.dmg), working: hr >= 6 && hr < 20, crafting: !!(S && S.t < craftUntil), lvl };
    const ctx = R.ctx; ctx.save(); ctx.imageSmoothingEnabled = false;
    try { art(ctx, mapFor(id, lvl, p, sp, X, Y, z), R.t, o); }
    catch (e) { if (!R.bldWork.warned) { R.bldWork.warned = 1; console.error('prédio animado', id, e); } }
    ctx.restore();
  };
})();
