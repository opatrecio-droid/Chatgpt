/* Aurora 046 · Arte animada dos prédios de natureza: Santuário das Duas Luas, Estábulo do Vale, Lenharia e Pedreira.
   Contrato: G.A.BuildingArt[id](ctx, m, t, o) (ver src/buildings-anim.js). Coordenadas em pixels da imagem 104×114.
   Sprites em cache, partículas determinísticas em t, o.light → 1/3 das partículas, o.quiet → sem movimento. */
(function () {
  'use strict';
  if (typeof G === 'undefined' || G.HEADLESS || !G.A) return;
  G.A.BuildingArt = G.A.BuildingArt || {};
  const TAU = Math.PI * 2;
  const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const hs = (x, y, s) => { let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s || 0) | 0, 362437)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16; return (n >>> 0) / 4294967296; };
  const cl = (v, a, b) => v < a ? a : v > b ? b : v;
  const sstep = (a, b, v) => { v = cl((v - a) / (b - a), 0, 1); return v * v * (3 - 2 * v); };
  function mk(w, h) {
    let c = null; try { c = G.A.mk(w, h); if (Array.isArray(c)) c = c[0]; if (c && c.cv) c = c.cv; if (c && c.canvas) c = c.canvas; } catch (e) { c = null; }
    if (!c || !c.getContext) { c = document.createElement('canvas'); c.width = w; c.height = h; }
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return { cv: c, x };
  }
  const paint = (w, h, fn) => {
    const m = mk(w, h), im = m.x.createImageData(w, h), d = im.data, o = [0, 0, 0, 0];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { o[3] = 0; fn(x, y, o); const i = (y * w + x) * 4; d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; d[i + 3] = o[3]; }
    m.x.putImageData(im, 0, 0); return m.cv;
  };
  const put = (o, c) => { const v = rgb(c); o[0] = v[0]; o[1] = v[1]; o[2] = v[2]; o[3] = 255; };

  /* ---------- cache de sprites ---------- */
  const PUFF = [5, 8, 11, 14];
  function puff(sz, pal, seed) {
    const r = sz / 2;
    return paint(sz, sz, (x, y, o) => {
      const dx = x + 0.5 - r, dy = y + 0.5 - r, d = Math.sqrt(dx * dx + dy * dy) + (hs(x, y, seed) - 0.5) * 1.3;
      if (d > r - 0.2) return;
      const l = (-dx - dy) / r * 0.5 + (hs(x, y, seed + 4) - 0.5) * 0.35;
      put(o, l > 0.2 ? pal[0] : l > -0.25 ? pal[1] : pal[2]);
    });
  }
  /* serra circular: 8 quadros de rotação (dentes a cada 360/12 graus), r = 10 */
  function saw(rot) {
    return paint(22, 22, (x, y, o) => {
      const dx = x + 0.5 - 11, dy = y + 0.5 - 11, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 10.4) return;
      const a = Math.atan2(dy, dx) + rot, k = ((a / (TAU / 12)) % 1 + 1) % 1;
      if (d > 8.4 && k > 0.55 - (d - 8.4) * 0.28) return;       // dentes em forma de gancho
      const sp = ((a / (TAU / 4)) % 1 + 1) % 1;
      if (d < 1.9) { put(o, '#3a3642'); return; }
      if (d < 3.4) { put(o, '#7c7f8c'); return; }
      if (d > 4.6 && d < 7.6 && sp < 0.28 && d > 5) { put(o, '#6e7280'); return; }   // furos vazados
      const l = (-dx - dy) / 10 * 0.5 + (hs(x, y, 5) - 0.5) * 0.18;
      put(o, d > 8.4 ? (l > 0 ? '#e8ecf4' : '#aeb2c0') : l > 0.25 ? '#dfe3ec' : l > -0.2 ? '#bfc4d2' : '#9298a8');
    });
  }
  const gem = (c1, c2) => paint(9, 13, (x, y, o) => {      // cristal facetado, mesma silhueta; metade clara / escura
    const dx = Math.abs(x - 4), top = y < 4 ? 1 + y : y > 8 ? 13 - y : 5;
    if (dx >= top * 0.9 + 0.2) return;
    put(o, x < 4 ? c1 : x === 4 ? '#ffffff' : c2);
  });
  const VANE = ['.......#.', '......###', '.#######.', '#########', '.#######.', '.##...##.', '.#....#..'];
  let C = null;
  function init() {
    C = { puff: [], saw: [], vane: null };
    const pals = { smoke: ['#ece9f4', '#bfbad0', '#8f8aa8'], dust: ['#e3cfa4', '#bfa578', '#8c7650'], inc: ['#f0e6ff', '#cdbbea', '#a690cf'], stone: ['#c9c8d2', '#a4a2b2', '#7e7c90'] };
    for (const k in pals) C.puff[k] = PUFF.map((s, i) => puff(s, pals[k], i + k.length));
    for (let i = 0; i < 8; i++) C.saw.push(saw(i * TAU / 12 / 8));
    C.vane = paint(9, 7, (x, y, o) => { if (VANE[y][x] === '#') put(o, y < 3 && x > 5 ? '#4a4560' : '#2e2a3c'); });
    C.gem = [gem('#cdbbff', '#8a5fd8'), gem('#f4f8ff', '#9db4d8'), gem('#ffe9a8', '#d89a3a')];
  }

  /* ---------- ferramentas de desenho por quadro ---------- */
  function tools(ctx, m) {
    const kx = m.kx, ky = m.ky, s = m.s;
    return {
      kx, ky, s,
      fr: (ix, iy, w, h) => { const x = Math.round(m.sx(ix)), y = Math.round(m.sy(iy)); ctx.fillRect(x, y, Math.max(1, Math.round(m.sx(ix + w)) - x), Math.max(1, Math.round(m.sy(iy + h)) - y)); },
      dr: (cv, ix, iy, w, h) => { const x = Math.round(m.sx(ix)), y = Math.round(m.sy(iy)); ctx.drawImage(cv, x, y, Math.max(1, Math.round(m.sx(ix + (w || cv.width))) - x), Math.max(1, Math.round(m.sy(iy + (h || cv.height))) - y)); },
      glow: (ix, iy, rad, col, a) => { if (a < 0.01) return; const x = m.sx(ix), y = m.sy(iy), rr = rad * s, g = ctx.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, 'rgba(' + col + ',' + a + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); ctx.fillStyle = g; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2); },
      /* halo achatado no chão à frente do prédio */
      halo: (ix, iy, rad, col, a) => { if (a < 0.01) return; ctx.save(); ctx.translate(m.sx(ix), m.sy(iy)); ctx.scale(1, 0.3); const rr = rad * s, g = ctx.createRadialGradient(0, 0, 0, 0, 0, rr); g.addColorStop(0, 'rgba(' + col + ',' + a + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); ctx.fillStyle = g; ctx.fillRect(-rr, -rr, rr * 2, rr * 2); ctx.restore(); },
      ell: (ix, iy, rx, ry, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(m.sx(ix), m.sy(iy), rx * kx, ry * ky, 0, 0, TAU); ctx.fill(); }
    };
  }
  /* fumaça / poeira / incenso: sprites em cache subindo e se dissolvendo */
  function plume(T, t, o, x0, y0, n, LF, A, rise, drift, kind, spread) {
    n = Math.max(1, Math.ceil(n * (o.light ? 1 / 3 : 1)));
    const pal = C.puff[kind];
    for (let i = 0; i < n; i++) {
      const u = t + i * LF / n, ag = (u % LF) / LF, cyc = Math.floor(u / LF), sz = Math.min(3, (ag * 4.2) | 0);
      const x = x0 + (hs(cyc, i, 4) - 0.5) * (spread || 3) + Math.sin(ag * 5 + i * 2.1) * 2 + ag * drift, y = y0 - ag * rise - PUFF[sz] / 2;
      T.ctx.globalAlpha = Math.min(1, ag * 7) * Math.pow(1 - ag, 1.3) * A;
      T.dr(pal[sz], Math.round(x - PUFF[sz] / 2), Math.round(y));
    }
    T.ctx.globalAlpha = 1;
  }
  const lamp = (T, ctx, x, y, t, o, nt, seed) => {      // chama de lanterna + brilho (tremula)
    const lf = o.quiet ? 1 : 0.8 + 0.2 * Math.sin(t * 13 + seed) * Math.sin(t * 5.1 + seed * 2);
    const a = o.damaged ? 0.25 : 1;
    ctx.globalCompositeOperation = 'lighter';
    T.glow(x, y, 8 + 8 * nt, '255,190,80', (0.12 + 0.5 * nt) * lf * a);
    ctx.globalCompositeOperation = 'source-over';
  };
  const winGlow = (T, ctx, ix, iy, w, h, a, fl) => {    // janela acesa: preenche + halo (a em 0..1)
    if (a < 0.02) return;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255,200,95,' + (0.5 * a * fl) + ')'; T.fr(ix, iy, w, h);
    T.glow(ix + w / 2, iy + h / 2, 5 + Math.max(w, h) * 0.7, '255,190,80', 0.45 * a * fl);
    ctx.globalCompositeOperation = 'source-over';
  };

  /* =====================================================================================================
     SANTUÁRIO DAS DUAS LUAS
     ===================================================================================================== */
  function santuario(ctx, m, t, o) {
    if (!C) init();
    const T = tools(ctx, m); T.ctx = ctx;
    const { fr, dr, glow } = T, quiet = o.quiet, third = o.light ? 1 / 3 : 1, dmg = o.damaged, nt = sstep(0.05, 0.8, o.dark), tq = quiet ? 0 : t;
    const fl = quiet ? 1 : 0.9 + 0.1 * Math.sin(t * 9) * Math.sin(t * 3.3 + 1), live = dmg ? 0.3 : 1;
    ctx.save();

    /* duas luas no frontão: prata e violeta pulsam em oposição; a noite fica bem mais forte */
    {
      const pa = 0.5 + 0.5 * Math.sin(tq * 1.1), pb = 0.5 + 0.5 * Math.sin(tq * 1.1 + Math.PI);
      const k = (0.5 + 1.1 * nt) * live;
      ctx.globalCompositeOperation = 'lighter';
      glow(49, 70, 17 + 6 * nt, '176,112,255', (0.1 + 0.22 * pb) * k);
      glow(52, 67, 12 + 4 * nt, '205,220,255', (0.08 + 0.2 * pa) * k);
      glow(30, 80, 7 + 3 * nt, '205,220,255', (0.07 + 0.2 * pa) * k * 0.9);      // luas dos estandartes
      glow(73, 80, 7 + 3 * nt, '176,112,255', (0.07 + 0.2 * pb) * k * 0.9);
      if (nt > 0.1) { glow(50, 44, 26, '140,100,230', 0.2 * nt * live); glow(50, 22, 14, '255,225,150', 0.16 * nt * live * (0.8 + 0.2 * pa)); }   // cúpula e crescente
      if (!quiet && !dmg) {                       // estrelas cintilando no vitral
        ctx.fillStyle = '#fff6d0';
        const st = [[40, 65], [61, 64], [44, 77], [58, 76], [41, 71], [60, 71]];
        for (let i = 0; i < 6; i++) { const f = Math.max(0, Math.sin(t * 1.7 + i * 2.3)); ctx.globalAlpha = f * f * (0.45 + 0.4 * nt); fr(st[i][0], st[i][1], 1, 1); }
        ctx.globalAlpha = 1;
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    /* janelas das torres acendem à noite */
    {
      const a = nt * (dmg ? 0.2 : 1);
      winGlow(T, ctx, 19, 61, 3, 7, a, fl); winGlow(T, ctx, 19, 83, 3, 12, a, fl); winGlow(T, ctx, 9.6, 84, 2, 10, a, fl);
      winGlow(T, ctx, 83, 61, 3, 7, a, fl); winGlow(T, ctx, 82.5, 83, 3, 12, a, fl); winGlow(T, ctx, 92.6, 84, 2, 10, a, fl);
      T.halo(50, 108, 40, '200,170,255', 0.5 * nt * live * fl);      // luz sagrada que escorre pela escadaria
      T.halo(50, 108, 22, '255,205,120', 0.35 * nt * live * fl);
    }

    /* cristais flutuando e girando: 3 em órbita do crescente e 1 sobre cada torre */
    if (!dmg) {
      const cr = [];
      for (let i = 0; i < 3; i++) { const an = tq * 0.45 + i * TAU / 3; cr.push({ x: 50 + Math.cos(an) * 21, y: 23 + Math.sin(an) * 5 + Math.sin(tq * 1.6 + i) * 1.1, z: Math.sin(an), g: i }); }
      cr.push({ x: 19, y: 30 + Math.sin(tq * 1.3) * 1.6, z: 1, g: 1 }, { x: 84, y: 30 + Math.sin(tq * 1.3 + 2) * 1.6, z: 1, g: 0 });
      cr.sort((a, b) => a.z - b.z);
      for (let i = 0; i < cr.length; i++) {
        const c = cr[i], back = c.z < -0.2, sc = back ? 0.7 : 1, w = Math.max(0.9, 8 * Math.abs(Math.cos(tq * 1.5 + i * 1.7))) * sc;
        ctx.globalCompositeOperation = 'lighter'; glow(c.x, c.y, 7 + 3 * nt, c.g === 0 ? '176,112,255' : c.g === 1 ? '205,225,255' : '255,225,150', (0.2 + 0.3 * nt) * (back ? 0.6 : 1));
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = back ? 0.75 : 1;
        dr(C.gem[c.g], c.x - w / 2, c.y - 6.5 * sc, w, 13 * sc); ctx.globalAlpha = 1;
      }
    }

    /* velas e incensários nos degraus */
    {
      for (let i = 0; i < 2; i++) {
        const x = i ? 63 : 38, y = 105;
        ctx.fillStyle = '#f2ead6'; fr(x, y - 1, 2, 3); ctx.fillStyle = '#c8bca0'; fr(x + 1, y - 1, 1, 3);
        const f = quiet ? 1 : 0.7 + 0.3 * Math.sin(t * 11 + i * 3) * Math.sin(t * 4.7 + i), h = quiet ? 2 : 2 + (Math.sin(t * 8.3 + i * 5) > 0.2 ? 1 : 0);
        ctx.fillStyle = '#ffd35a'; fr(x, y - 1 - h, 2, h); ctx.fillStyle = '#fff6c8'; fr(x, y - 1 - Math.min(h, 2), 1, 1);
        ctx.globalCompositeOperation = 'lighter'; glow(x + 1, y - 2, 7 + 5 * nt, '255,200,100', (0.2 + 0.45 * nt) * f * live); ctx.globalCompositeOperation = 'source-over';
      }
      for (let i = 0; i < 2; i++) { const x = i ? 56 : 45; ctx.fillStyle = '#6a5a4a'; fr(x - 1, 106, 3, 2); ctx.fillStyle = '#a88a52'; fr(x - 1, 106, 3, 1); ctx.fillStyle = '#ff7a3a'; fr(x, 105, 1, 1); }
      if (!quiet) { plume({ ctx, dr }, t, o, 46, 105, 3, 5, 0.5 * live, 6, 4, 'inc', 1.5); plume({ ctx, dr }, t + 1.7, o, 55.5, 105, 3, 5, 0.5 * live, 6, -4, 'inc', 1.5); }
    }

    /* partículas sagradas subindo do portal e dos jardins */
    if (!quiet && !dmg) {
      const n = Math.ceil(12 * third);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const P = 4 + hs(i, 3, 1) * 3, u = t + i * 1.31, ag = (u % P) / P, cyc = Math.floor(u / P);
        const bx = i % 3 === 0 ? 50 + (hs(cyc, i, 2) - 0.5) * 14 : i % 3 === 1 ? 28 + (hs(cyc, i, 3) - 0.5) * 14 : 74 + (hs(cyc, i, 4) - 0.5) * 14;
        const x = bx + Math.sin(ag * 6 + i) * 3, y = 100 - ag * (38 + 16 * hs(cyc, i, 5));
        ctx.globalAlpha = Math.sin(ag * Math.PI) * (0.55 + 0.4 * nt); ctx.fillStyle = i % 3 === 0 ? '#fff0b0' : i % 3 === 1 ? '#d6c0ff' : '#e4f0ff';
        fr(x, y, ag > 0.5 && i % 2 ? 2 : 1, 1);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  /* =====================================================================================================
     ESTÁBULO DO VALE — Tomé escova o cavalo castanho junto à porteira; cavalos mexem a cabeça
     ===================================================================================================== */
  function estabulo(ctx, m, t, o) {
    if (!C) init();
    const T = tools(ctx, m); T.ctx = ctx;
    const { fr, dr, glow, kx, ky } = T, quiet = o.quiet, third = o.light ? 1 / 3 : 1, dmg = o.damaged, nt = sstep(0.05, 0.8, o.dark), tq = quiet ? 0 : t;
    const fl = quiet ? 1 : 0.88 + 0.12 * Math.sin(t * 9) * Math.sin(t * 3.3 + 1);
    ctx.save();

    /* cabeças dos cavalos: o castanho balança a cabeça (a cada 7 s), o branco cutuca o ar (a cada 9 s) */
    const headBob = (ix, iy, w, h, dx, dy) => { if (Math.abs(dx) < 0.02 && Math.abs(dy) < 0.02) return; ctx.save(); ctx.translate(Math.round(dx * kx), Math.round(dy * ky)); m.blit(ctx, ix, iy, w, h); ctx.restore(); };
    if (!quiet && !dmg) {
      const p1 = (t + 1) % 7, n1 = p1 < 1.6 ? Math.sin(p1 / 1.6 * Math.PI * 3) * Math.sin(p1 / 1.6 * Math.PI) : 0;
      headBob(26, 80, 21, 12, n1 * 0.5, Math.max(0, n1) * 1.4);
      const p2 = (t + 4) % 9, n2 = p2 < 1.2 ? Math.sin(p2 / 1.2 * Math.PI * 2) * Math.sin(p2 / 1.2 * Math.PI) : 0;
      headBob(58, 80, 20, 12, -n2 * 0.6, Math.max(0, -n2) * 1.2);
    }

    /* cata-vento em forma de cavalo no cume */
    {
      const ang = quiet ? 0.6 : t * 0.4 + Math.sin(t * 0.33) * 1.7 + Math.sin(t * 1.3) * 0.25, sc = Math.cos(ang), sg = Math.abs(sc) < 0.3 ? (sc < 0 ? -0.3 : 0.3) : sc;
      ctx.fillStyle = '#4a455c'; fr(51, 24, 1, 10); fr(48, 29, 7, 1);
      ctx.save(); ctx.translate(m.sx(51.5), m.sy(21.5)); ctx.scale(sg, 1); ctx.drawImage(C.vane, Math.round(-5 * kx), 0, Math.round(10 * kx), Math.round(7 * ky)); ctx.restore();
    }

    /* chaminé */
    if (!quiet) plume(T, t, o, 78.5, 44, dmg ? 3 : nt > 0.5 ? 2 : 3, 4.6, dmg ? 0.6 : nt > 0.5 ? 0.3 : 0.45, 26, 8, 'smoke', 3);

    /* lanternas e janelinhas do frontão acendem à noite */
    {
      const a = nt * (dmg ? 0.2 : 1);
      winGlow(T, ctx, 27, 57, 5, 8, a, fl); winGlow(T, ctx, 66, 56, 5, 7, a, fl);
      lamp(T, ctx, 18, 83, t, o, nt, 1); lamp(T, ctx, 86, 84, t, o, nt, 2);
      ctx.globalCompositeOperation = 'lighter';
      glow(36, 88, 15, '255,170,80', 0.2 * a * fl); glow(67, 88, 15, '255,170,80', 0.2 * a * fl);   // baias aquecidas por dentro
      ctx.globalCompositeOperation = 'source-over';
      T.halo(52, 108, 44, '255,170,70', 0.5 * a * fl);
    }

    /* Tomé escovando (ao lado da porteira do cavalo branco) */
    const W = o.workers && o.workers.main;
    if (W && !dmg) {
      const X = 11, FY = 108.5, cyc = quiet ? 0 : Math.floor(t / 8), tt = quiet ? 0 : t - cyc * 8, brushing = !quiet && tt < 5.6;
      const pose = brushing ? 'atk0' : (quiet ? 'idle0' : Math.floor(t * 1.2) % 2 ? 'idle1' : 'idle0');
      T.ell(X, FY, 6.5, 1.9, 'rgba(20,14,28,0.35)');
      try { W.draw(ctx, m.sx(X), m.sy(FY), { pose, flip: false, alpha: 1 }); } catch (e) {}
      if (brushing && W.hand) {   // escova segura pela mão do quadro atual; vai e vem curto e lento no flanco do cavalo
        const h = W.hand(pose, X, FY, false), sw = Math.sin(tt * 3.2) * 1.6, bx = h[0] + sw, by = h[1] + Math.sin(tt * 3.2 + 1) * 0.6;
        ctx.fillStyle = '#6a4220'; fr(h[0], h[1] - 0.5, Math.max(1, bx - h[0] + 2), 1);
        ctx.fillStyle = '#d8c08a'; fr(bx + 1, by - 1.5, 2, 3); ctx.fillStyle = '#8a6a3a'; fr(bx + 1, by - 1.5, 2, 1);
      }
    }
    ctx.restore();
  }
  estabulo.staffInArt = true;

  /* =====================================================================================================
     LENHARIA — serra circular cortando tábuas, serragem, fumaça
     ===================================================================================================== */
  function lenharia(ctx, m, t, o) {
    if (!C) init();
    const T = tools(ctx, m); T.ctx = ctx;
    const { fr, dr, glow } = T, quiet = o.quiet, third = o.light ? 1 / 3 : 1, dmg = o.damaged, nt = sstep(0.05, 0.8, o.dark), tq = quiet ? 0 : t;
    const fl = quiet ? 1 : 0.88 + 0.12 * Math.sin(t * 9) * Math.sin(t * 3.3 + 1);
    const run = !quiet && !dmg && o.working, CX = 58.5, TOP = 92;
    ctx.save();

    /* serra: disco girando por cima do desenho e a mesa devolvida à frente */
    const fi = run ? Math.floor(t * 18) % 8 : quiet || dmg ? 0 : Math.floor(t * 1.5) % 8;
    dr(C.saw[fi], 47.5, 82);
    m.blit(ctx, 44, 93, 30, 6);
    if (run) {   // brilho de metal girando
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 25); ctx.fillStyle = '#ffffff'; fr(52, 86, 1, 3); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    /* tábua deslizando pela mesa e sendo cortada ao meio (ciclo de 9 s) */
    if (run) {
      const P = 9, ph = t % P, go = ph < 7 ? ph / 7 : -1;
      if (go >= 0) {
        const e = go, px = 40 + e * 36, L = 13, y = TOP - 1, cut = px + L > CX;
        const plank = (x0, x1) => { if (x1 - x0 < 0.5) return; ctx.fillStyle = '#c98a44'; fr(x0, y, x1 - x0, 3); ctx.fillStyle = '#e9bf78'; fr(x0, y, x1 - x0, 1); ctx.fillStyle = '#8a5a2c'; fr(x0, y + 2, x1 - x0, 1); };
        if (!cut) plank(px, px + L);
        else { plank(px, Math.min(px + L, CX - 0.6)); plank(CX + 0.6 + 0.5 * Math.min(1, (px + L - CX) / 4), px + L + 0.5 * Math.min(1, (px + L - CX) / 4)); }
        const cutting = px < CX + 1 && px + L > CX;
        if (cutting) {   // serragem voando da linha de corte
          const n = Math.ceil(9 * third);
          for (let i = 0; i < n; i++) {
            const ag = ((t * 3.2 + i * 0.37) % 1), cyc = Math.floor(t * 3.2 + i * 0.37);
            ctx.globalAlpha = 1 - ag; ctx.fillStyle = i % 3 ? '#f0d494' : '#d6a85c';
            fr(CX + 1 + ag * (6 + 8 * hs(cyc, i, 1)), y - 1 - Math.sin(ag * Math.PI) * (3 + 4 * hs(cyc, i, 2)) + ag * ag * 12, 1, 1);
          }
          ctx.globalAlpha = 1;
        }
        // metades caem na pilha de aparas depois do corte
      }
      if (ph > 5) {   // montinho de serragem cresce sob a mesa
        ctx.fillStyle = '#e2c27e'; fr(61, 104, 6, 1); fr(62, 103, 4, 1);
      }
    }
    /* chaminé */
    if (!quiet) plume(T, t, o, 23, 38, dmg ? 3 : o.working ? 5 : 3, 4.2, dmg ? 0.6 : o.working ? 0.55 : 0.3, 28, 9, 'smoke', 4);

    /* brilho no gume do machado do letreiro (a cada 7 s) */
    if (!quiet && !dmg) { const g = (t + 2) % 7; if (g < 0.5) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.sin(g / 0.5 * Math.PI); ctx.fillStyle = '#ffffff'; fr(70, 58, 1, 3); fr(69, 59, 3, 1); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; } }

    /* noite: lanternas, janelinhas do frontão, janela lateral e luz no chão */
    {
      const a = nt * (dmg ? 0.2 : 1);
      winGlow(T, ctx, 46, 60, 7, 8, a, fl); winGlow(T, ctx, 82, 58, 6, 9, a, fl); winGlow(T, ctx, 82, 88, 6, 11, a, fl);
      lamp(T, ctx, 41, 82, t, o, nt, 1); lamp(T, ctx, 85, 82, t, o, nt, 2);
      ctx.globalCompositeOperation = 'lighter'; glow(58, 90, 18, '255,170,80', 0.18 * a * fl); ctx.globalCompositeOperation = 'source-over';
      T.halo(58, 108, 44, '255,170,70', 0.5 * a * fl);
    }
    ctx.restore();
  }

  /* =====================================================================================================
     PEDREIRA — guindaste de madeira com balde subindo e descendo, poeira, faíscas de cinzel, lanterna
     (o bloco pintado no guindaste é removido da arte 2× por tools/hd_rules/pedreira.py)
     ===================================================================================================== */
  function pedreira(ctx, m, t, o) {
    if (!C) init();
    const T = tools(ctx, m); T.ctx = ctx;
    const { fr, dr, glow, s } = T, quiet = o.quiet, third = o.light ? 1 / 3 : 1, dmg = o.damaged, nt = sstep(0.05, 0.8, o.dark), tq = quiet ? 0 : t;
    const fl = quiet ? 1 : 0.88 + 0.12 * Math.sin(t * 9) * Math.sin(t * 3.3 + 1);
    ctx.save();

    /* guindaste: ciclo de 14 s: desce, carrega (poeira), sobe, balança no alto, descarrega */
    const PX = 14, PY = 50, UP = 62, DN = 85, P = 14, ph = quiet ? 11 : (t % P);
    const ease = v => v * v * (3 - 2 * v);
    let yb = UP, mv = 0, load = 1;
    if (dmg) { yb = 72; load = 0; }
    else if (ph < 4) { const v = ph / 4; yb = UP + (DN - UP) * ease(v); mv = Math.sin(v * Math.PI); load = 0; }
    else if (ph < 6.5) { yb = DN; load = 0; }
    else if (ph < 10.5) { const v = (ph - 6.5) / 4; yb = DN - (DN - UP) * ease(v); mv = Math.sin(v * Math.PI); load = ph > 7 ? 1 : 0; }
    else { yb = UP + Math.sin(t * 1.2) * 0.4; load = ph < 13 ? 1 : 1 - (ph - 13); }
    const sw = quiet || dmg ? 0 : (Math.sin(t * 1.6) * (0.3 + 1.4 * mv) + (ph > 10.5 && ph < 13 ? Math.sin(t * 2.3) * 0.5 : 0)), bx = PX + sw;
    // corda (corrente) e polia
    ctx.strokeStyle = '#4a3a2e'; ctx.lineWidth = Math.max(1, s * 1.1); ctx.beginPath(); ctx.moveTo(m.sx(PX), m.sy(PY)); ctx.lineTo(m.sx(bx), m.sy(yb)); ctx.stroke();
    ctx.strokeStyle = '#9a8a76'; ctx.lineWidth = Math.max(1, s * 0.6); ctx.setLineDash([Math.max(1, s * 1.2), Math.max(1, s * 1.2)]); ctx.lineDashOffset = quiet ? 0 : -t * 4 * s * (ph < 4 ? -1 : ph > 6.5 && ph < 10.5 ? 1 : 0); ctx.beginPath(); ctx.moveTo(m.sx(PX), m.sy(PY)); ctx.lineTo(m.sx(bx), m.sy(yb)); ctx.stroke(); ctx.setLineDash([]);
    // roda da polia girando
    ctx.fillStyle = '#6a5a48'; fr(PX - 2.5, PY - 3.5, 5, 5); ctx.fillStyle = '#c8b898'; { const a = quiet ? 0 : (ph < 4 ? -1 : ph > 6.5 && ph < 10.5 ? 1 : 0) * t * 3; fr(PX - 1.5 + Math.cos(a) * 1.7, PY - 1 + Math.sin(a) * 1.7, 1, 1); fr(PX - 1.5 - Math.cos(a) * 1.7, PY - 1 - Math.sin(a) * 1.7, 1, 1); }
    // balde com pedra
    ctx.strokeStyle = '#5a4630'; ctx.lineWidth = Math.max(1, s * 0.7); ctx.beginPath(); ctx.moveTo(m.sx(bx), m.sy(yb)); ctx.lineTo(m.sx(bx - 5), m.sy(yb + 4)); ctx.moveTo(m.sx(bx), m.sy(yb)); ctx.lineTo(m.sx(bx + 5), m.sy(yb + 4)); ctx.stroke();
    if (load > 0.02) { ctx.globalAlpha = load; ctx.fillStyle = '#7e7c90'; fr(bx - 4, yb + 1, 9, 4); ctx.fillStyle = '#b8b8c4'; fr(bx - 3, yb, 7, 3); ctx.fillStyle = '#e4e4ec'; fr(bx - 3, yb, 4, 1); ctx.fillStyle = '#a4a2b2'; fr(bx + 2, yb + 1, 2, 2); ctx.globalAlpha = 1; }
    ctx.fillStyle = '#8a5a30'; fr(bx - 5, yb + 4, 11, 6); ctx.fillStyle = '#b07a3e'; fr(bx - 5, yb + 4, 11, 1); ctx.fillStyle = '#4a4a5a'; fr(bx - 5, yb + 6, 11, 1); fr(bx - 5, yb + 9, 11, 1); ctx.fillStyle = '#6a4220'; fr(bx - 5, yb + 7, 11, 2);
    // poeira quando o balde pousa e é carregado
    if (!quiet && !dmg && ph > 3.6 && ph < 7.6) {
      const n = Math.ceil(5 * third), I = cl((ph - 3.6) / 1.2, 0, 1) * cl((7.6 - ph) / 1.2, 0, 1);
      for (let i = 0; i < n; i++) {
        const ag = ((t * 0.9 + i * 0.21) % 1), sz = Math.min(3, (ag * 3.4) | 0);
        ctx.globalAlpha = (1 - ag) * 0.7 * I; dr(C.puff.dust[sz], 10 + i * 3 + ag * 5 - PUFF[sz] / 2, 96 - ag * 9 - PUFF[sz] / 2);
      }
      ctx.globalAlpha = 1;
    }
    // faíscas de cinzel num bloco da frente
    if (!quiet && !dmg && o.working) {
      const g = (t + 1.3) % 3.4;
      if (g < 0.45) {
        const e = g / 0.45; ctx.globalCompositeOperation = 'lighter';
        if (e < 0.2) { glow(26, 96, 5, '255,235,170', 0.8 * (1 - e * 5)); }
        const n = Math.ceil(5 * third);
        for (let i = 0; i < n; i++) { const a = -Math.PI * (0.1 + 0.8 * hs(i, 1, 5)), v = 14 + 12 * hs(i, 2, 5); ctx.globalAlpha = 1 - e; ctx.fillStyle = e < 0.4 ? '#fff4c0' : '#ffb84a'; fr(26 + Math.cos(a) * v * e * 0.45, 96 + Math.sin(a) * v * e * 0.45 + 9 * e * e, 1, 1); }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
    }
    // poeira leve do carrinho
    if (!quiet && !dmg && o.working) plume(T, t, o, 75, 92, 2, 5, 0.3, 10, 4, 'dust', 6);
    // chaminé
    if (!quiet) plume(T, t, o, 80.5, 35, dmg ? 3 : o.working ? 4 : 2, 4.6, dmg ? 0.6 : o.working ? 0.5 : 0.3, 26, 8, 'smoke', 4);

    /* lanterna pendurada no poste do guindaste */
    {
      ctx.fillStyle = '#5a5668'; fr(35, 70, 1, 2); fr(34, 72, 3, 1); fr(34, 76, 3, 1); ctx.fillStyle = dmg ? '#7a6a40' : (nt > 0.15 ? '#ffe08a' : '#caa95a'); fr(34.5, 73, 2, 3);
      lamp(T, ctx, 35.5, 74.5, t, o, nt, 3);
    }
    /* noite: janela e boca da pedreira */
    {
      const a = nt * (dmg ? 0.2 : 1);
      winGlow(T, ctx, 42.5, 83, 6, 9, a, fl);
      ctx.globalCompositeOperation = 'lighter'; glow(72, 90, 16, '255,170,80', 0.22 * a * fl); ctx.globalCompositeOperation = 'source-over';
      T.halo(50, 108, 46, '255,170,70', 0.5 * a * fl);
    }
    ctx.restore();
  }

  Object.assign(G.A.BuildingArt, { santuario, estabulo, lenharia, pedreira });
})();
