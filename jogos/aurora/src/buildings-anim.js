/* Aurora 046 · Prédios de serviço animados (por enquanto: Ferraria).
   Desenha por cima da arte do prédio, dentro da mesma camada (respeita profundidade), usando G.A.BuildingArt[id]
   (src/buildings-art.js). Coordenadas em pixels da IMAGEM do prédio (a arte embutida, ex.: ferraria 104×114),
   convertidas para a tela pelo mapa `m`. Só visual. */
(function () {
  'use strict';
  if (typeof G === 'undefined' || G.HEADLESS || !G.A || !G.R || !G.W) return;
  const A = G.A, R = G.R, W = G.W;
  const IMG = {};   // tamanho da arte embutida em aurora-building-image-sprites: todos os prédios usam 104×114
  for (const id of G.BLD_IDS || []) IMG[id] = [104, 114];
  /* prédios cuja equipe trabalha DENTRO da animação (some da porta). Na Fazenda a equipe trabalha no campo (3M-vida). */
  /* a arte declara se a equipe trabalha nela (função com .staffInArt = true): some da porta e vira o.workers */
  const STAFF_IN_ART = new Proxy({}, { get: (_, id) => !!(A.BuildingArt && A.BuildingArt[id] && A.BuildingArt[id].staffInArt) || id === 'ferraria' });
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

  /* ---------- arte em alta resolução (2×) no mapa ----------
     G.A.BuildingHD[id] = Image com o MESMO desenho da arte original em 2× (ex.: ferraria 208×228). Só é usada no
     desenho do mapa (entre os ganchos groundDecor e worldEffects); galeria e tela de título seguem com a arte 1×. */
  const HD = A.BuildingHD = A.BuildingHD || {}, hdCache = new Map(), K = 2;
  let inWorld = false;
  G.hook('groundDecor', () => { inWorld = true; }, -1e6);
  G.hook('worldEffects', () => { inWorld = false; }, -1e6);
  const build0 = A.building;
  A.building = function (id, lvl, damaged) {
    const base = build0.apply(this, arguments), img = HD[id];
    if (!inWorld || !img || !img.complete || !img.naturalWidth || !IMG[id] || !(lvl >= 1) || !base || !base.cv) return base;
    const tier = lvl < 3 ? 0 : lvl < 6 ? 1 : lvl < 10 ? 2 : 3, key = id + '|' + tier + '|' + !!damaged + '|' + base.w + 'x' + base.h;
    let hit = hdCache.get(key); if (hit) return hit;
    const cv = A.mk(base.w * K, base.h * K), c = cv.getContext('2d'), sc = [0.91, 0.94, 0.97, 1][tier];
    const w = Math.round(base.w * sc), h = Math.round(base.h * sc);   // mesma conta do embrulho 1×, em 2×
    c.imageSmoothingEnabled = false; c.drawImage(img, Math.round((base.w - w) / 2) * K, (base.h - h) * K, w * K, h * K);
    if (damaged) {
      c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(36,24,25,.42)'; c.fillRect(0, 0, cv.width, cv.height);
      c.strokeStyle = 'rgba(25,18,17,.9)'; c.lineWidth = K;
      for (let n = 0; n < 3; n++) { const x = cv.width * (0.3 + n * 0.2), y = cv.height * (0.43 + n * 0.07); c.beginPath(); c.moveTo(x, y); c.lineTo(x - 3 * K, y + 6 * K); c.lineTo(x + K, y + 10 * K); c.lineTo(x - 3 * K, y + 17 * K); c.stroke(); }
    }
    hit = Object.assign({}, base, { cv, hd: K }); hdCache.set(key, hit); return hit;
  };

  /* moradores do prédio que estão de fato no expediente, já no posto (dentro ou à porta), não andando */
  const atPost = id => (G.npcs || []).filter(n => n.at === id && n.act === 'work' && (n.state === 'in' || n.state === 'toil'));
  /* desenha o sprite real do morador (mesma aparência do mapa) com os pés em (x, y) */
  const npcDrawer = (n, z) => (ctx, x, y, op) => {
    op = op || {};
    try {
      const s = A.charSheet(A.npcLook(n)), pose = op.pose || 'idle0';
      if (s.need) s.need(pose);
      const i = (s.idx && s.idx[pose]) || 0, fw = s.fw || 26, fh = s.fh || 30, fs = s.scale || 1, ax = s.ax == null ? 13 : s.ax, ay = s.ay == null ? 27 : s.ay;
      ctx.save(); ctx.globalAlpha = op.alpha == null ? 1 : op.alpha; ctx.translate(Math.round(x), Math.round(y)); if (op.flip) ctx.scale(-1, 1);
      ctx.drawImage(s.cv, i * fw, 0, fw, fh, Math.round(-ax * fs * z), Math.round(-ay * fs * z), Math.round(fw * fs * z), Math.round(fh * fs * z)); ctx.restore();
    } catch (e) { /* aparência indisponível */ }
  };
  const staffOn = id => { const b = G.S && G.S.b[id]; return !!(STAFF_IN_ART[id] && A.BuildingArt && A.BuildingArt[id] && IMG[id] && b && b.lvl > 0 && !b.dmg); };
  /* quem trabalha na forja é desenhado nela: some o sprite parado à porta para não aparecer duplicado */
  G.hook('renderItems', dyn => {
    for (const id in IMG) {
      if (!staffOn(id)) continue;
      const here = new Set(atPost(id)); if (!here.size) continue;
      for (let i = dyn.length - 1; i >= 0; i--) if (dyn[i].k === 'n' && here.has(dyn[i].e)) dyn.splice(i, 1);
    }
  }, 60);

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
    /* equipe real do prédio: o mestre (1º do elenco, ex.: Fábio, Ferreiro) e o ajudante (ex.: Gilda, Aprendiz de forja) */
    const staff = STAFF_IN_ART[id] ? atPost(id) : [];
    const main = staff.find(n => n.job === 'Ferreiro') || staff[0] || null, help = staff.find(n => n !== main) || null;
    o.workers = { main: main ? { name: main.name, job: main.job, draw: npcDrawer(main, z) } : null, helper: help ? { name: help.name, job: help.job, draw: npcDrawer(help, z) } : null };
    if (STAFF_IN_ART[id]) o.working = o.working && !!(main || help);
    const ctx = R.ctx; ctx.save(); ctx.imageSmoothingEnabled = false;
    try { art(ctx, mapFor(id, lvl, p, sp, X, Y, z), R.t, o); }
    catch (e) { if (!R.bldWork.warned) { R.bldWork.warned = 1; console.error('prédio animado', id, e); } }
    ctx.restore();
  };
})();
