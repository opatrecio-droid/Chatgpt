/* Aurora 046 · Arte animada do grupo COMÉRCIO: taverna, padaria (e moinho), mercado, alquimista, hospedaria.
   Contrato: G.A.BuildingArt[id](ctx, m, t, o) — ver src/buildings-anim.js. Coordenadas em pixels da imagem do prédio (104×114).
   Peças pesadas (fumaça, pás do moinho) vêm de sprites em cache; partículas são determinísticas em t. */
(function () {
  'use strict';
  if (typeof G === 'undefined' || G.HEADLESS || !G.A) return;
  G.A.BuildingArt = G.A.BuildingArt || {};
  const OUT = '#1a1422', TAU = Math.PI * 2;
  const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const hs = (x, y, s) => { let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s || 0) | 0, 362437)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16; return (n >>> 0) / 4294967296; };
  const cl = (v, a, b) => v < a ? a : v > b ? b : v;
  const sm = (v, a, b) => { const k = cl((v - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
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

  /* ---------- fumaça / vapor em cache ---------- */
  const PUFF = [7, 10, 13, 16];
  function puff(sz, pal, seed) {
    const r = sz / 2;
    return paint(sz, sz, (x, y, o) => {
      const dx = x + 0.5 - r, dy = y + 0.5 - r, d = Math.sqrt(dx * dx + dy * dy) + (hs(x, y, seed) - 0.5) * 1.3;
      if (d > r - 0.2) return;
      const l = (-dx - dy) / r * 0.5 + (hs(x, y, seed + 4) - 0.5) * 0.35;
      put(o, l > 0.2 ? pal[0] : l > -0.25 ? pal[1] : pal[2]);
    });
  }
  const PALS = { light: ['#ece9f4', '#bfbad0', '#8f8aa8'], dark: ['#74707f', '#53505f', '#38343f'], flour: ['#fbf6ea', '#e6dcc4', '#c3b8a0'],
    lilac: ['#e8d8ff', '#b9a0e8', '#8a6cc0'], green: ['#d6ffe4', '#8fe0b0', '#52a878'], warm: ['#f6efe4', '#d8c8b0', '#a89478'] };
  let C = null;
  function init() {
    C = { puff: {} };
    let k = 0;
    for (const n in PALS) { C.puff[n] = PUFF.map((s, i) => puff(s, PALS[n], i + 5 * k)); k++; }
  }

  /* ---------- kit de desenho (por quadro) ---------- */
  function kit(ctx, m, t, o) {
    const kx = m.kx, ky = m.ky, s = m.s, quiet = o.quiet, third = o.light ? 1 / 3 : 1, nt = o.dark, dmg = o.damaged, tq = quiet ? 0 : t;
    const fl = quiet ? 1 : 0.9 + 0.1 * Math.sin(t * 9) * Math.sin(t * 3.3 + 1);
    const K = {
      kx, ky, s, quiet, third, nt, dmg, tq, fl,
      fr(ix, iy, w, h) { const x = Math.round(m.sx(ix)), y = Math.round(m.sy(iy)); ctx.fillRect(x, y, Math.max(1, Math.round(m.sx(ix + w)) - x), Math.max(1, Math.round(m.sy(iy + h)) - y)); },
      dr(cv, ix, iy, w, h) { const x = Math.round(m.sx(ix)), y = Math.round(m.sy(iy)); ctx.drawImage(cv, x, y, Math.max(1, Math.round(m.sx(ix + (w || cv.width))) - x), Math.max(1, Math.round(m.sy(iy + (h || cv.height))) - y)); },
      glow(ix, iy, rad, col, a) { if (a <= 0.01) return; const x = m.sx(ix), y = m.sy(iy), rr = rad * s, g = ctx.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, 'rgba(' + col + ',' + a + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); ctx.fillStyle = g; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2); },
      ell(ix, iy, rx, ry, col, a) { ctx.globalAlpha = a == null ? 1 : a; ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(m.sx(ix), m.sy(iy), rx * kx, ry * ky, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; },
      line(x0, y0, x1, y1, w, col) { ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, w * s); ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(m.sx(x0), m.sy(y0)); ctx.lineTo(m.sx(x1), m.sy(y1)); ctx.stroke(); },
      poly(pts, col, a) { ctx.globalAlpha = a == null ? 1 : a; ctx.fillStyle = col; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(m.sx(p[0]), m.sy(p[1])) : ctx.moveTo(m.sx(p[0]), m.sy(p[1]))); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; },
      add(fn) { ctx.globalCompositeOperation = 'lighter'; fn(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; },
      /* janelas: apagadas de dia (vidro escuro), acendem ao entardecer; danificado = quase sempre escuras */
      win(list) {
        const dim = dmg ? 0.88 : 1 - sm(nt, 0.1, 0.55);
        list.forEach((w, i) => {
          const x = w[0], y = w[1], ww = w[2], hh = w[3];
          if (dim > 0.02) {
            ctx.globalAlpha = dim * (w[5] || 0.93); ctx.fillStyle = '#2b2a3d';
            if (w[4]) { ctx.beginPath(); ctx.ellipse(m.sx(x + ww / 2), m.sy(y + hh / 2), ww / 2 * kx, hh / 2 * ky, 0, 0, TAU); ctx.fill(); } else K.fr(x, y, ww, hh);
            ctx.fillStyle = '#4a362a'; K.fr(x + ww / 2 - 0.5, y, 1, hh); K.fr(x, y + hh / 2 - 0.5, ww, 1);
            ctx.globalAlpha = dim * 0.5; ctx.fillStyle = '#8aa3c4'; K.fr(x + 1, y + 1, 1, Math.max(1, hh * 0.3)); K.fr(x + 2.5, y + 1, 1, 1);
            ctx.globalAlpha = 1;
          }
          const f = quiet ? 1 : 0.88 + 0.12 * Math.sin(t * 2.7 + i * 2.1) * Math.sin(t * 1.3 + i);
          const a = dmg ? (nt > 0.4 && Math.sin(t * 1.9 + i * 4) > 0.8 ? 0.1 : 0) : nt * f;
          if (a > 0.03) K.add(() => { ctx.globalAlpha = 0.2 * a; ctx.fillStyle = '#ffc860'; K.fr(x, y, ww, hh); K.glow(x + ww / 2, y + hh / 2, Math.max(ww, hh) * 1.3 + 3, '255,190,80', 0.5 * a); });
        });
      },
      /* lanterna parada na parede/poste: chama + halo (maior à noite) */
      lamp(x, y, sway) {
        if (dmg) return; const lf = quiet ? 1 : 0.8 + 0.2 * Math.sin(t * 13 + x) * Math.sin(t * 5.1 + y);
        K.add(() => K.glow(x + (sway || 0), y, 7 + 8 * nt, '255,190,80', (0.12 + 0.5 * nt) * lf));
        if (nt > 0.2) { ctx.fillStyle = '#fff2b8'; ctx.globalAlpha = 0.5 + 0.5 * lf; K.fr(x - 0.5 + (sway || 0), y - 1, 1, 2); ctx.globalAlpha = 1; }
      },
      /* halo quente derramado no chão em frente (à noite) */
      halo(cx, rad, col, base) {
        const a = (dmg ? 0.12 : 0.55) * nt * (base == null ? 1 : base) * fl; if (a < 0.02) return;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(m.sx(cx), m.sy(109)); ctx.scale(1, 0.3); const rr = rad * s, g = ctx.createRadialGradient(0, 0, 0, 0, 0, rr);
        g.addColorStop(0, 'rgba(' + (col || '255,170,70') + ',' + a + ')'); g.addColorStop(1, 'rgba(' + (col || '255,130,40') + ',0)'); ctx.fillStyle = g; ctx.fillRect(-rr, -rr, rr * 2, rr * 2); ctx.restore();
      },
      /* fumaça: N pufes subindo da boca (x, y) */
      smoke(x, y, pal, n, A, LF, rise, drift) {
        if (quiet) return; n = Math.max(1, Math.ceil(n * third)); const P = C.puff[pal];
        for (let i = 0; i < n; i++) {
          const ag = ((t + i * LF / n) % LF) / LF, cyc = Math.floor((t + i * LF / n) / LF), sz = Math.min(3, (ag * 4.2) | 0);
          const px = x + (hs(cyc, i, 4) - 0.5) * 4 + Math.sin(ag * 5 + i * 2.1) * 2.2 + ag * (drift == null ? 8 : drift), py = y - ag * rise - PUFF[sz] / 2;
          ctx.globalAlpha = Math.min(1, ag * 7) * Math.pow(1 - ag, 1.3) * A; K.dr(P[sz], Math.round(px - PUFF[sz] / 2), Math.round(py));
        }
        ctx.globalAlpha = 1;
      },
      /* morador real com sombra de contato (pés em x,y da imagem) */
      worker(w, x, y, pose, flip) {
        if (!w) return; ctx.fillStyle = 'rgba(20,14,28,0.35)'; ctx.beginPath(); ctx.ellipse(m.sx(x), m.sy(y), 6.5 * kx, 1.9 * ky, 0, 0, TAU); ctx.fill();
        try { w.draw(ctx, m.sx(x), m.sy(y), { pose, flip: !!flip, alpha: 1 }); } catch (e) { /* sprite indisponível */ } ctx.imageSmoothingEnabled = false;
      },
      walk(sp) { return 'walk' + (Math.floor(t * sp) % 4); },
      idle(sp) { return 'idle' + (Math.floor(t * (sp || 1.6)) % 2); }
    };
    return K;
  }

  /* estrela de 4 pontas: cruz de 1 px com centro claro (nunca um quadrado cheio) */
  function star(K, ctx, x, y, e, col) {
    if (e < 0.08) return; const L = e > 0.7 ? 2 : 1;
    ctx.globalAlpha = e * 0.85; ctx.fillStyle = col;
    K.fr(x - 0.5, y - 0.5 - L, 1, L); K.fr(x - 0.5, y + 0.5, 1, L); K.fr(x - 0.5 - L, y - 0.5, L, 1); K.fr(x + 0.5, y - 0.5, L, 1);
    ctx.globalAlpha = Math.min(1, e); ctx.fillStyle = '#fffaf0'; K.fr(x - 0.5, y - 0.5, 1, 1); ctx.globalAlpha = 1;
  }

  /* ---------- notas musicais (taverna à noite) ---------- */
  function notes(K, ctx, x0, y0, n) {
    if (K.quiet || K.dmg || K.nt < 0.3) return;
    const col = ['#ffe9a0', '#ffd0a0', '#fff4c8'];
    for (let i = 0; i < n; i++) {
      const P = 4.2 + i * 0.7, tt = K.tq + i * 1.7, ag = (tt % P) / P, cyc = Math.floor(tt / P), x = x0 + (hs(cyc, i, 5) - 0.5) * 6 + Math.sin(ag * 6 + i * 2) * 3 + ag * 4 * (i % 2 ? 1 : -1), y = y0 - ag * 24;
      ctx.globalAlpha = Math.min(1, ag * 6) * (1 - ag) * Math.min(1, (K.nt - 0.3) * 3); ctx.fillStyle = col[i % 3];
      K.fr(x, y + 3, 2, 2); K.fr(x + 1.5, y - 1, 1, 5); if (i % 2) K.fr(x + 1.5, y - 1, 2.5, 1);
    }
    ctx.globalAlpha = 1;
  }

  /* =====================================================================
     TAVERNA DO CERVO
     ===================================================================== */
  function taverna(ctx, m, t, o) {
    if (!C) init();
    const K = kit(ctx, m, t, o), nt = K.nt, dmg = K.dmg, quiet = K.quiet, W = o.workers || {};
    const hei = dmg ? null : (W.main || W.helper), iara = (!dmg && W.main && W.helper) ? W.helper : null;
    /* janelas (todas acendem à noite) */
    K.win([[19, 68, 7, 8], [79, 68, 7, 8], [22.5, 91, 6, 6], [75, 91, 6, 6]]);
    K.lamp(40, 92, quiet ? 0 : Math.sin(t * 1.7) * 0.4); K.lamp(64, 92, quiet ? 0 : Math.sin(t * 1.7 + 1) * 0.4);
    K.halo(52, 38, '255,170,70', 1);
    /* fumaça de cozinha */
    K.smoke(28, 34, 'light', dmg ? 3 : 5, dmg ? 0.5 : (nt > 0.4 ? 0.42 : 0.7), 3.8, 26, 8);
    /* placa-caneca pendurada no poste da direita, balançando */
    {
      const sw = quiet ? 0.04 : Math.sin(t * 1.6) * 0.13 + Math.sin(t * 2.9 + 1) * 0.04, px = 98, py = 92;
      K.line(93, py, 99, py, 1, '#2a1a14'); K.line(93, py + 1, 96, py - 2, 1, '#2a1a14');
      ctx.save(); ctx.translate(m.sx(px), m.sy(py)); ctx.rotate(sw); ctx.scale(kx(m), ky(m));
      ctx.fillStyle = '#2a1a14'; ctx.fillRect(-0.5, 0, 1, 2); ctx.fillRect(-4.5, 2, 9, 10);
      ctx.fillStyle = '#7a4a28'; ctx.fillRect(-3.5, 3, 7, 8); ctx.fillStyle = '#94603a'; ctx.fillRect(-3.5, 3, 7, 1);
      ctx.fillStyle = '#fff6e0'; ctx.fillRect(-2, 4.5, 3, 1); ctx.fillStyle = '#e8b23a'; ctx.fillRect(-2, 5.5, 3, 4); ctx.fillStyle = '#c98a2a'; ctx.fillRect(1, 6.5, 1.5, 2);
      ctx.restore();
    }
    /* moradores */
    if (hei) {   // Heitor serve canecas ao lado da porta
      const P = 9, ph = quiet ? 0 : t % P, serving = !quiet && ph > 3.5 && ph < 5.6, k = serving ? (ph - 3.5) / 2.1 : 0, X = 37;
      const pose = quiet ? 'idle0' : serving ? (k < 0.3 ? 'atk0' : k < 0.5 ? 'atk1' : k < 0.8 ? 'atk2' : 'atk0') : K.idle(1.1);
      K.worker(hei, X, 107, pose, false);
      const mx = X + 7 + (serving ? Math.sin(k * Math.PI) * 6 : 0), my = serving ? 94 + k * 3 : 95;
      ctx.fillStyle = '#e0a838'; K.fr(mx, my, 3, 4); ctx.fillStyle = '#fff6e0'; K.fr(mx, my - 1, 3, 1); ctx.fillStyle = '#b87a28'; K.fr(mx + 3, my + 1, 1, 2);
      if (serving && k > 0.55) { ctx.globalAlpha = Math.min(1, (k - 0.55) * 4); ctx.fillStyle = '#e0a838'; K.fr(X + 15, 105, 3, 3); ctx.fillStyle = '#fff6e0'; K.fr(X + 15, 104, 3, 1); ctx.globalAlpha = 1; }
    }
    if (iara) {  // Iara leva a bandeja de lá para cá
      const A = 66, B = 86, V = 9, wait = 1.4, per = (B - A) / V + wait, cyc = quiet ? 0 : t % (2 * per);
      let x = A, flip = false, pose = 'idle0';
      if (!quiet) {
        const u = cyc % per, right = cyc < per, walkT = (B - A) / V;
        if (u < walkT) { const f = u / walkT; x = right ? A + (B - A) * f : B - (B - A) * f; flip = !right; pose = K.walk(8); }
        else { x = right ? B : A; flip = !right; pose = K.idle(1.4); }
      }
      K.worker(iara, x, 108, pose, flip);
      const d = flip ? -1 : 1, bx = x + d * 5.5, by = 93 + (pose.startsWith('walk') ? Math.sin(t * 16) * 0.3 : 0);
      ctx.fillStyle = '#6a4326'; K.fr(bx - 4, by, 8, 1); ctx.fillStyle = '#e0a838'; K.fr(bx - 3, by - 3, 2.5, 3); K.fr(bx + 0.5, by - 3, 2.5, 3); ctx.fillStyle = '#fff6e0'; K.fr(bx - 3, by - 4, 2.5, 1); K.fr(bx + 0.5, by - 4, 2.5, 1);
    }
    notes(K, ctx, 52, 86, o.light ? 1 : 3);
    ctx.globalAlpha = 1;
  }
  const kx = m => m.kx, ky = m => m.ky;

  /* =====================================================================
     PADARIA E MOINHO
     ===================================================================== */
  const HUB = [79, 35];
  function sail(K, ctx, m, ang) {
    ctx.save(); ctx.translate(m.sx(HUB[0]), m.sy(HUB[1])); ctx.rotate(ang); ctx.scale(m.kx, m.ky);
    ctx.fillStyle = '#4a2c1a'; ctx.fillRect(2, -1, 21, 2);                       // eixo da pá
    ctx.fillStyle = '#7a4c2a'; ctx.fillRect(2, -1, 21, 1);
    ctx.fillStyle = '#5a3720'; ctx.fillRect(5, 1, 18, 7);                        // moldura da vela
    ctx.fillStyle = '#ecdab2'; ctx.fillRect(6, 2, 16, 5);
    ctx.fillStyle = '#c9a874'; for (let i = 8; i < 22; i += 3) ctx.fillRect(i, 2, 1, 5); ctx.fillRect(6, 4, 16, 1);
    ctx.fillStyle = '#f8ecd0'; ctx.fillRect(6, 2, 16, 1);
    ctx.restore();
  }
  function padaria(ctx, m, t, o) {
    if (!C) init();
    const K = kit(ctx, m, t, o), nt = K.nt, dmg = K.dmg, quiet = K.quiet, W = o.workers || {}, third = K.third;
    const alda = dmg ? null : (W.main || W.helper), breno = (!dmg && W.main && W.helper) ? W.helper : null;

    /* moinho: capuz da torre + pás girando (as pás pintadas foram removidas da arte 2×) */
    {
      const gust = quiet ? 0 : 0.5 + 0.18 * Math.sin(t * 0.37) + 0.1 * Math.sin(t * 1.1);
      const ang = quiet ? 0.45 : dmg ? 0.45 + Math.sin(t * 0.6) * 0.05 : t * gust + 0.45;
      K.poly([[70, 38], [71.5, 33], [75, 30], [79, 29], [83, 30.5], [86.5, 33], [88, 38]], '#5a3520');
      K.poly([[71.5, 36], [72.5, 33], [75.5, 30.8], [79, 30], [78, 36]], '#8a5634');
      ctx.fillStyle = OUT; K.fr(69.5, 37.5, 19, 1);
      for (let i = 0; i < 4; i++) sail(K, ctx, m, ang + i * Math.PI / 2);
      K.ell(HUB[0], HUB[1], 3, 3, '#3d2416'); K.ell(HUB[0] - 0.3, HUB[1] - 0.3, 1.7, 1.7, '#c99a5a');
      if (!quiet && !dmg && Math.abs(Math.sin(ang * 2)) > 0.97) { ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.5; K.fr(HUB[0] + 14, HUB[1] - 14, 1, 1); ctx.globalAlpha = 1; }
    }
    /* janelas e luzes */
    K.win([[54, 82, 7, 9], [71.5, 82, 7, 9]]);
    K.lamp(66, 92, 0);
    /* boca do forno: brasa viva por cima da pintura */
    {
      const lv = dmg ? 0.2 : 1, f = quiet ? 0.9 : 0.85 + 0.15 * Math.sin(t * 15) * Math.sin(t * 6.1 + 1);
      K.add(() => {
        K.glow(28, 86, 15 + 4 * nt, '255,130,40', cl(0.22 + 0.2 * nt, 0, 0.5) * lv * f);
        if (!dmg) for (let i = 0; i < Math.ceil(5 * third); i++) {
          const x = 22 + i * 3.3 + (hs(Math.floor(t * 8), i, 1) - 0.5) * 1.5, hh = 3 + hs(Math.floor(t * 9 + i), i, 2) * 5;
          ctx.globalAlpha = 0.6 * f; ctx.fillStyle = i % 2 ? '#ffd24a' : '#ff9a26'; K.fr(x, 90 - hh, 2, hh);
        }
      });
      K.halo(30, 26, '255,140,50', 0.9 * lv);
      K.halo(66, 30, '255,190,80', 0.7);
    }
    /* fumaça grossa da chaminé do forno */
    K.smoke(32.5, 27, dmg ? 'dark' : 'warm', dmg ? 4 : (nt > 0.4 ? 4 : 6), dmg ? 0.78 : 0.62, 4.6, 32, 9);
    /* moradores */
    const SHELF = [62, 96];
    if (alda) {   // Alda tira o pão do forno com a pá e leva ao balcão
      const P = 13, ph = quiet ? 1 : t % P; let x = 42, flip = true, pose = 'idle0', peel = 0, loaf = 0;
      if (quiet) { pose = 'idle0'; }
      else if (ph < 3.2) { const k = ph / 3.2; pose = k < 0.25 ? 'atk0' : k < 0.5 ? 'atk1' : k < 0.75 ? 'atk2' : 'atk0'; peel = 1; loaf = k > 0.6 ? 1 : 0; }
      else if (ph < 5.4) { const f = (ph - 3.2) / 2.2; x = 42 + 9 * f; flip = false; pose = K.walk(8); peel = 2; loaf = 1; }
      else if (ph < 6.8) { x = 51; flip = false; pose = ph < 6.2 ? 'atk1' : 'atk0'; peel = 3; loaf = ph < 5.9 ? 1 : 0; }
      else if (ph < 9) { const f = (ph - 6.8) / 2.2; x = 51 - 9 * f; flip = true; pose = K.walk(8); }
      else { pose = K.idle(1.2); }
      K.worker(alda, x, 107, pose, flip);
      const d = flip ? -1 : 1;
      if (peel === 1) {   // pá entrando e saindo da boca do forno
        const ext = Math.sin(clampPi(ph / 3.2)) , tx = 33 + (1 - ext) * 5, ty = 91 - (1 - ext) * 0;
        K.line(x - 3, 97, tx, ty - 1, 1.2, '#8a6338'); ctx.fillStyle = '#b8864a'; K.fr(tx - 3, ty - 2, 4, 2);
        if (loaf) { ctx.fillStyle = '#d9a04a'; K.fr(tx - 2, ty - 4, 3, 2); ctx.fillStyle = '#f2c46a'; K.fr(tx - 2, ty - 4, 3, 1); }
      } else if (peel === 2 || peel === 3) {
        const ty = peel === 3 ? 96 : 94, tx = x + 8;
        K.line(x - 1, 97, tx, ty, 1.2, '#8a6338'); ctx.fillStyle = '#b8864a'; K.fr(tx - 1, ty - 1, 4, 2);
        if (loaf) { ctx.fillStyle = '#d9a04a'; K.fr(tx, ty - 3, 3, 2); ctx.fillStyle = '#f2c46a'; K.fr(tx, ty - 3, 3, 1); }
      }
      if (!quiet && ph >= 6 && ph < 8.4) { const e = (ph - 6) / 2.4; ctx.globalAlpha = Math.min(1, e * 6) * (1 - e * 0.3); ctx.fillStyle = '#d9a04a'; K.fr(SHELF[0] + 6, SHELF[1] - 1.5, 4, 2.5); ctx.fillStyle = '#f2c46a'; K.fr(SHELF[0] + 6, SHELF[1] - 1.5, 4, 1); ctx.globalAlpha = 1; }
      if (!quiet && ph >= 6 && ph < 8) { const e = (ph - 6) / 2; ctx.globalAlpha = 0.6 * (1 - e); ctx.fillStyle = '#fff'; K.fr(SHELF[0] + 7 + Math.sin(e * 9), SHELF[1] - 4 - e * 7, 1, 1); ctx.globalAlpha = 1; }
    }
    if (breno) {  // Breno leva sacas de farinha do palheiro ao balcão e volta
      const A = 70, B = 90, V = 6, wait = 1.6, wk = (B - A) / V, per = wk + wait, cyc = quiet ? 0 : t % (2 * per), left = cyc >= per, u = cyc % per;
      let x = B, pose = 'idle0', carry = false, flip = false;
      if (!quiet) {
        if (!left) { if (u < wait) { x = B; pose = K.idle(1.5); flip = true; carry = u > wait * 0.6; } else { x = B - (B - A) * (u - wait) / wk; pose = K.walk(7); flip = true; carry = true; } }
        else { if (u < wk) { x = A + (B - A) * u / wk; pose = K.walk(7); flip = false; } else { x = B; pose = K.idle(1.5); flip = true; } }
      }
      K.worker(breno, x, 109, pose, flip);
      if (carry && !left) { const bx = x, by = 94 + (pose.startsWith('walk') ? Math.sin(t * 14) * 0.3 : 0); ctx.fillStyle = '#e9e0c8'; K.fr(bx - 4, by, 8, 6); ctx.fillStyle = '#c9bd9a'; K.fr(bx - 4, by + 4, 8, 2); K.fr(bx - 2, by - 1, 4, 1); ctx.fillStyle = '#8a6a4a'; K.fr(bx - 4, by + 2, 8, 1); }
      if (!quiet && left && u < 1.4 && !dmg) { const e = u / 1.4; ctx.globalAlpha = (1 - e) * 0.8; K.dr(C.puff.flour[Math.min(2, (e * 3) | 0)], Math.round(A - 4 + e * 2), Math.round(98 - e * 6)); ctx.globalAlpha = 1; }
    }
    /* fiapos de farinha ao vento junto à torre */
    if (!quiet && !dmg) {
      const n = Math.ceil(3 * third);
      for (let i = 0; i < n; i++) { const P = 3.4 + i * 0.8, tt = t + i * 1.5, ag = (tt % P) / P, cyc = Math.floor(tt / P); ctx.globalAlpha = Math.min(1, ag * 5) * (1 - ag); ctx.fillStyle = '#fbf6ea'; K.fr(84 + hs(cyc, i, 3) * 6 + ag * 12, 70 + hs(cyc, i, 4) * 8 - ag * 4, 1, 1); }
      ctx.globalAlpha = 1;
    }
  }
  const clampPi = v => Math.PI * cl(v, 0, 1);

  /* =====================================================================
     MERCADO
     ===================================================================== */
  const AWN = [[[5, 83], [14, 76], [37, 69], [38, 81], [33, 85], [20, 87], [5, 86]], [[99, 83], [90, 76], [67, 69], [66, 81], [71, 85], [84, 87], [99, 86]]];
  function mercado(ctx, m, t, o) {
    if (!C) init();
    const K = kit(ctx, m, t, o), nt = K.nt, dmg = K.dmg, quiet = K.quiet, W = o.workers || {}, third = K.third;
    const celia = dmg ? null : (W.main || W.helper), dario = (!dmg && W.main && W.helper) ? W.helper : null;
    /* toldos ao vento: faixas de luz/sombra correndo e franja ondulando */
    if (!quiet) {
      for (let a = 0; a < 2; a++) {
        ctx.save(); ctx.beginPath(); AWN[a].forEach((p, i) => i ? ctx.lineTo(m.sx(p[0]), m.sy(p[1])) : ctx.moveTo(m.sx(p[0]), m.sy(p[1]))); ctx.closePath(); ctx.clip();
        const gust = 0.5 + 0.5 * Math.sin(t * 0.8 + a * 2), dir = a ? -1 : 1;
        for (let b = 0; b < 3; b++) {
          const ph = ((t * 0.55 + b / 3 + a * 0.3) % 1), x = (a ? 99 - ph * 34 : 5 + ph * 34);
          ctx.globalAlpha = (0.16 + 0.12 * gust) * Math.sin(ph * Math.PI); ctx.fillStyle = '#fff8e6'; K.poly([[x, 66], [x + 4 * dir, 66], [x + 4 * dir - 3, 90], [x - 3, 90]], '#fff8e6', ctx.globalAlpha);
          ctx.globalAlpha = 0.1 * Math.sin(ph * Math.PI); K.poly([[x + 5 * dir, 66], [x + 8 * dir, 66], [x + 8 * dir - 3, 90], [x + 5 * dir - 3, 90]], '#6a4a2a', ctx.globalAlpha);
        }
        ctx.restore();
      }
      /* franja: dentes que sobem e descem com a brisa */
      for (let a = 0; a < 2; a++) for (let i = 0; i < 6; i++) {
        const x = a ? 97 - i * 4.6 : 7 + i * 4.6, y = 85.5 + (a ? 0.4 : 0) - i * 0.15, w = Math.sin(t * 2.2 + i * 0.9 + a * 1.7);
        ctx.fillStyle = '#e8d5aa'; K.fr(x, y + 0.8, 3, 0.8 + (w > 0.2 ? 1 : 0)); ctx.fillStyle = '#b8955a'; K.fr(x, y + 1.6 + (w > 0.2 ? 1 : 0), 3, 0.7);
      }
    }
    /* luzes: lanternas e luz quente sob os toldos */
    K.lamp(37, 87, quiet ? 0 : Math.sin(t * 1.9) * 0.5); K.lamp(66, 87, quiet ? 0 : Math.sin(t * 1.9 + 1.3) * 0.5);
    if (!dmg && nt > 0.1) K.add(() => { K.glow(22, 91, 18, '255,190,90', 0.3 * nt * K.fl); K.glow(82, 91, 18, '255,190,90', 0.3 * nt * K.fl); K.glow(52, 100, 14, '255,200,110', 0.22 * nt * K.fl); });
    K.halo(52, 44, '255,175,80', 0.9);
    /* moedas da placa brilham */
    if (!quiet && !dmg) {
      const cx = [[47, 73], [54, 69], [51, 74], [56, 72]];
      for (let i = 0; i < 2; i++) {
        const P = 1.7 + i * 0.5, tt = t + i * 0.9, ag = (tt % P) / P, cyc = Math.floor(tt / P), p = cx[(cyc * 2 + i + (hs(cyc, i, 1) * 3 | 0)) % 4];
        if (ag > 0.45) continue; const e = Math.sin(ag / 0.45 * Math.PI);
        star(K, ctx, p[0], p[1], e, '#fff4c8');
      }
      ctx.globalAlpha = 1;
    }
    /* feirantes */
    if (dario) {   // Dário arruma frutas na bancada da esquerda
      const P = 7, ph = quiet ? 0 : t % P, tossing = !quiet && ph > 1 && ph < 3.4, k = tossing ? (ph - 1) / 2.4 : 0, X = 43;
      const pose = quiet ? 'idle0' : tossing ? (k < 0.3 ? 'atk0' : k < 0.55 ? 'atk1' : k < 0.8 ? 'atk2' : 'atk0') : K.idle(1.3);
      K.worker(dario, X, 107, pose, true);
      if (tossing && k > 0.3 && k < 0.85) { const f = (k - 0.3) / 0.55, x = X - 5 - 11 * f, y = 95 - Math.sin(f * Math.PI) * 6 + f * 4; ctx.fillStyle = '#d83a2a'; K.fr(x, y, 2.5, 2.5); ctx.fillStyle = '#ff7a60'; K.fr(x, y, 1, 1); }
      else if (!tossing) { ctx.fillStyle = '#d83a2a'; K.fr(X - 7, 95, 2.5, 2.5); }
    }
    if (celia) {   // Célia apregoa: ondas de voz e balão de moeda
      const per = 6.5, ph = quiet ? 0 : t % per, call = !quiet && ph > 0.6 && ph < 3.2, X = 60, pose = quiet ? 'idle0' : call ? (Math.floor(t * 5) % 2 ? 'atk0' : 'idle1') : K.idle(1.1);
      K.worker(celia, X, 107, pose, false);
      if (call) {
        const e = (ph - 0.6) / 2.6;
        for (let i = 0; i < 3; i++) { const a = ((e * 2.2 + i / 3) % 1); ctx.globalAlpha = (1 - a) * 0.8; ctx.strokeStyle = '#fff6d8'; ctx.lineWidth = Math.max(1, K.s * 0.8); ctx.beginPath(); ctx.arc(m.sx(X + 7 + a * 7), m.sy(92), (1.5 + a * 3) * K.s, -0.8, 0.8); ctx.stroke(); }
        ctx.globalAlpha = Math.min(1, e * 8) * Math.min(1, (1 - e) * 8);
        ctx.fillStyle = OUT; K.fr(X + 6, 70, 13, 10); ctx.fillStyle = '#fffaf0'; K.fr(X + 7, 71, 11, 8); K.fr(X + 8, 80, 2, 2);
        ctx.fillStyle = '#e0a838'; K.fr(X + 10, 73, 6, 4); ctx.fillStyle = '#fff2a8'; K.fr(X + 11, 73, 3, 1); ctx.fillStyle = '#b8802a'; K.fr(X + 10, 76, 6, 1);
        ctx.globalAlpha = 1;
      }
    }
    /* cheiro de fruta/poeira de feira: folhinhas ao vento */
    if (!quiet && !dmg) {
      const n = Math.ceil(3 * third);
      for (let i = 0; i < n; i++) { const P = 4.5 + i * 0.9, tt = t + i * 1.9, ag = (tt % P) / P, cyc = Math.floor(tt / P); ctx.globalAlpha = Math.sin(ag * Math.PI) * 0.8; ctx.fillStyle = i % 2 ? '#8fbf4a' : '#d9a23a'; K.fr(78 + hs(cyc, i, 3) * 16 + ag * 10, 90 + ag * 12 + Math.sin(ag * 9 + i) * 2, 1, 1); }
      ctx.globalAlpha = 1;
    }
  }

  /* =====================================================================
     ALQUIMISTA
     ===================================================================== */
  const CAU = [35, 103];
  const BUB = ['#d9a8ff', '#8fe8b0', '#ff9ad8', '#9ae0ff'];
  function alquimista(ctx, m, t, o) {
    if (!C) init();
    const K = kit(ctx, m, t, o), nt = K.nt, dmg = K.dmg, quiet = K.quiet, third = K.third, W = o.workers || {}, quim = dmg ? null : (W.main || W.helper), tq = K.tq;
    K.win([[50.5, 45.5, 8, 8, 1], [26, 77, 13, 16, 0, 0.62], [70, 84, 7, 10]]);
    K.halo(40, 34, '255,200,100', 0.8);
    const hue = Math.floor(tq / 4) % 4, liq = ['#9a5ee0', '#4ec78a', '#e060b8', '#4aa8e0'][hue], liqL = ['#d0a0ff', '#9af0c0', '#ffa0e0', '#9ad8ff'][hue], gl = ['190,120,255', '110,240,170', '255,130,210', '120,200,255'][hue];
    /* caldeirão */
    {
      const [cx, cy] = CAU, f = quiet ? 1 : 0.85 + 0.15 * Math.sin(t * 11) * Math.sin(t * 4.3);
      ctx.fillStyle = '#1e1a24'; K.fr(cx - 6, cy + 4, 2, 4); K.fr(cx + 4, cy + 4, 2, 4);
      if (!dmg) { ctx.fillStyle = '#ff9a26'; for (let i = 0; i < 3; i++) K.fr(cx - 3 + i * 2, 106 - (quiet ? 0.5 : hs(Math.floor(t * 9 + i), i, 1) * 1.8), 1.5, 2); ctx.fillStyle = '#ffd24a'; K.fr(cx - 1, 107, 2, 1); }
      K.ell(cx, cy + 1, 7.6, 6, '#2a2733'); K.ell(cx - 1, cy + 1, 6, 4.8, '#3a3644'); K.ell(cx + 3, cy + 3, 3.4, 2.6, '#1c1922', 0.7);
      K.ell(cx, cy - 3, 8, 2.6, '#58536a'); K.ell(cx, cy - 3, 6.6, 1.9, dmg ? '#2a2a30' : liq);
      if (!dmg) {
        K.ell(cx - 1.5, cy - 3.3, 3.6, 0.9, liqL, 0.7); K.add(() => K.glow(cx, cy - 4, 12 + 5 * nt, gl, (0.2 + 0.35 * nt) * f));
        const n = Math.ceil(6 * third);
        for (let i = 0; i < n; i++) {   // bolhas coloridas que sobem e estouram
          const P = 1.3 + hs(i, 3, 1) * 1.1, tt = tq + i * 0.61, ag = (tt % P) / P, cyc = Math.floor(tt / P), bx = cx - 4.5 + hs(cyc, i, 2) * 9, sz = 1 + (hs(cyc, i, 3) > 0.55 ? 1 : 0), col = BUB[(cyc + i) % 4];
          if (quiet) { ctx.fillStyle = col; K.fr(cx - 3 + i * 1.4, cy - 4 - (i % 2), 1.5, 1.5); continue; }
          if (ag < 0.82) { const y = cy - 3.5 - ag * (6 + 4 * hs(cyc, i, 4)); ctx.globalAlpha = 0.95; ctx.fillStyle = col; K.fr(bx, y, sz, sz); ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.8; K.fr(bx, y, 1, 1); }
          else { const e = (ag - 0.82) / 0.18; ctx.globalAlpha = 1 - e; ctx.fillStyle = col; K.fr(bx - e * 2, cy - 11, 1, 1); K.fr(bx + e * 2 + sz, cy - 11, 1, 1); K.fr(bx + 0.5, cy - 12 - e * 2, 1, 1); }
          ctx.globalAlpha = 1;
        }
        K.smoke(cx, cy - 4, hue === 1 ? 'green' : 'lilac', 4, 0.55, 3.2, 26, 5);
      }
    }
    /* chaminé */
    K.smoke(23.5, 28, dmg ? 'dark' : 'light', dmg ? 3 : 3, dmg ? 0.65 : 0.45, 4.2, 22, 6);
    /* frasco da placa borbulha e vitrine cintila */
    if (!dmg) {
      for (let i = 0; i < 3; i++) { const P = 2.2 + i * 0.6, ag = quiet ? 0.3 + i * 0.2 : ((t + i * 0.8) % P) / P; ctx.globalAlpha = Math.sin(ag * Math.PI); ctx.fillStyle = i % 2 ? '#fff' : '#ffd0f0'; K.fr(50.5 + i * 2 + Math.sin(ag * 6 + i) * 0.6, 83 - ag * 8, 1, 1); }
      ctx.globalAlpha = 1;
      K.add(() => K.glow(52, 79, 9, '255,150,230', 0.14 + 0.1 * Math.sin(tq * 2.3) + 0.12 * nt));
      const n = Math.ceil(5 * third);
      for (let i = 0; i < n; i++) {
        const P = 1.6 + i * 0.37, tt = tq + i * 1.1, ag = (tt % P) / P, cyc = Math.floor(tt / P); if (quiet && i > 1) continue; if (ag > 0.4) continue;
        const e = Math.sin(ag / 0.4 * Math.PI), x = 27.5 + hs(cyc, i, 1) * 10, y = 79 + hs(cyc, i, 2) * 12; star(K, ctx, x, y, e, ['#f4e8ff', '#ffeeb8', '#e0c8ff', '#d0ffe0'][i % 4]);
      }
      ctx.globalAlpha = 1;
    }
    /* pétalas de glicínia caindo */
    if (!quiet) {
      const n = Math.ceil(4 * third);
      for (let i = 0; i < n; i++) {
        const P = 5 + i * 0.8, tt = t + i * 1.7, ag = (tt % P) / P, cyc = Math.floor(tt / P), left = i % 2 === 0, bx = left ? 12 + hs(cyc, i, 1) * 12 : 85 + hs(cyc, i, 2) * 10;
        ctx.globalAlpha = Math.min(1, ag * 5) * (1 - ag * ag); ctx.fillStyle = i % 3 ? '#c8a8f0' : '#a888d8'; K.fr(bx + Math.sin(ag * 7 + i) * 3, (left ? 80 : 76) + ag * 26, 1, 1.5);
      }
      ctx.globalAlpha = 1;
    }
    /* Quim mexe o caldeirão */
    if (quim) {
      const X = 47, pose = quiet ? 'idle0' : (Math.floor(t * 2.2) % 3 === 0 ? 'atk0' : Math.floor(t * 2.2) % 3 === 1 ? 'atk1' : 'atk2');
      K.worker(quim, X, 107, pose, true);
      const a = quiet ? 0 : t * 4.2, sx = CAU[0] + Math.cos(a) * 2.6, sy = CAU[1] - 4 + Math.sin(a) * 0.9;
      K.line(X - 4, 96, sx, sy, 1.1, '#8a6338'); ctx.fillStyle = '#c8a066'; K.fr(sx - 1, sy - 1, 2, 2);
    }
  }

  /* =====================================================================
     HOSPEDARIA
     ===================================================================== */
  const POLES = [102, 119], LINE_Y = 90;
  function hospedaria(ctx, m, t, o) {
    if (!C) init();
    const K = kit(ctx, m, t, o), nt = K.nt, dmg = K.dmg, quiet = K.quiet, third = K.third, W = o.workers || {}, tq = K.tq;
    const nina = dmg ? null : (W.main || W.helper), rui = (!dmg && W.main && W.helper) ? W.helper : null;
    K.win([[33, 50, 6, 9], [67.5, 50, 6, 9], [18.5, 85, 6, 10], [80, 84, 9, 10]]);
    K.lamp(37, 90, quiet ? 0 : Math.sin(t * 1.8) * 0.4); K.lamp(68, 90, quiet ? 0 : Math.sin(t * 1.8 + 1) * 0.4);
    K.halo(52, 42, '255,175,80', 1);
    K.smoke(30, 21, dmg ? 'dark' : 'light', dmg ? 3 : 4, dmg ? 0.7 : (nt > 0.4 ? 0.5 : 0.55), 4.4, 28, 8);

    /* varal ao lado: postes, corda e lençóis ao vento */
    {
      ctx.fillStyle = '#5a3d22'; K.fr(POLES[0] - 1, 86, 2, 22); K.fr(POLES[1] - 1, 86, 2, 22); ctx.fillStyle = '#7a5530'; K.fr(POLES[0] - 1, 86, 1, 22); K.fr(POLES[1] - 1, 86, 1, 22);
      ctx.fillStyle = '#2a1a14'; K.fr(POLES[0] - 2, 107, 4, 1.5); K.fr(POLES[1] - 2, 107, 4, 1.5);
      const wind = quiet ? 0 : Math.sin(t * 0.9) * 0.6 + Math.sin(t * 2.3) * 0.25;
      const sag = x => LINE_Y + Math.sin((x - POLES[0]) / (POLES[1] - POLES[0]) * Math.PI) * 2.2;
      K.line(POLES[0], LINE_Y, POLES[1], LINE_Y, 0.8, '#d8c8a8');
      for (let a = 0; a < 7; a++) { const x0 = POLES[0] + (POLES[1] - POLES[0]) * a / 7, x1 = POLES[0] + (POLES[1] - POLES[0]) * (a + 1) / 7; K.line(x0, sag(x0), x1, sag(x1), 0.9, '#cbbd9e'); }
      const cloths = [['#f6f1e6', '#d8d0c0', 105.5, 10], ['#a889c8', '#8468a8', 111, 9], ['#efe2c0', '#cbb98a', 116, 8]];
      cloths.forEach((c, i) => {
        const x = c[2], y = sag(x), h = c[3], w = 4, ph = t * 2.6 + i * 1.7, sw = quiet ? 0 : (wind + 0.5 * Math.sin(ph)) * 1.4;
        K.poly([[x, y], [x + w, y], [x + w + sw * 0.9, y + h * 0.5], [x + w + sw * 1.2, y + h], [x + sw * 1.2 + (quiet ? 0 : Math.sin(ph + 1) * 0.5), y + h + (quiet ? 0 : Math.sin(ph * 1.3) * 0.5)], [x + sw * 0.9, y + h * 0.5]], c[0]);
        K.poly([[x + w * 0.55, y], [x + w, y], [x + w + sw * 0.9, y + h * 0.5], [x + w + sw * 1.2, y + h], [x + w * 0.6 + sw * 1.2, y + h]], c[1], 0.75);
        ctx.fillStyle = '#6a4a2a'; K.fr(x + 1, y - 0.5, 1, 1.5);
      });
    }
    /* Nina varre a entrada */
    if (nina) {
      const X = 41, ph = quiet ? 0 : (t * 1.5) % 1, sw = quiet ? 0 : Math.sin(t * 1.5 * TAU), pose = quiet ? 'idle0' : ph < 0.34 ? 'atk0' : ph < 0.6 ? 'atk1' : ph < 0.85 ? 'atk2' : 'atk0';
      K.worker(nina, X, 107, pose, false);
      const tx = X + 8 + sw * 3.5, ty = 107.5;
      K.line(X + 4, 94, tx, ty - 1, 1.1, '#8a6338'); ctx.fillStyle = '#d9b050'; K.fr(tx - 2.5, ty - 1.5, 5, 2); ctx.fillStyle = '#a88030'; K.fr(tx - 2.5, ty, 5, 1);
      if (!quiet) for (let i = 0; i < Math.ceil(4 * third); i++) { const P = 0.7, ag = ((t + i * 0.18) % P) / P, cyc = Math.floor((t + i * 0.18) / P); ctx.globalAlpha = (1 - ag) * 0.8; ctx.fillStyle = i % 2 ? '#e8dcc0' : '#b8a888'; K.fr(tx + (sw > 0 ? 2 : -2) + hs(cyc, i, 1) * 4 - 1 + ag * (sw > 0 ? 3 : -3), 106.5 - ag * 4 - hs(cyc, i, 2) * 1.5, 1, 1); }
      ctx.globalAlpha = 1;
    }
    /* Rui leva lençóis até o varal */
    if (rui) {
      const out = 56, far = 100, V = 8, wk = (far - out) / V, P = wk * 2 + 5.5, cyc = quiet ? 1 : t % P;
      let x = out, flip = false, pose = 'idle0', carry = true;
      if (!quiet) {
        if (cyc < wk) { x = out + (far - out) * cyc / wk; pose = K.walk(8); }
        else if (cyc < wk + 2) { x = far; pose = cyc < wk + 1.2 ? 'atk1' : 'atk0'; carry = cyc < wk + 0.8; }
        else if (cyc < wk * 2 + 2) { x = far - (far - out) * (cyc - wk - 2) / wk; flip = true; pose = K.walk(8); carry = false; }
        else { x = out; flip = true; pose = K.idle(1.2); carry = false; if (cyc > P - 1.2) { flip = false; carry = true; } }
      }
      K.worker(rui, x, 108, pose, flip);
      if (carry) { const by = 95 + (pose.startsWith('walk') ? Math.sin(t * 16) * 0.3 : 0), bx = x + 1; ctx.fillStyle = '#f6f1e6'; K.fr(bx - 5, by, 10, 5); ctx.fillStyle = '#d8d0c0'; K.fr(bx - 5, by + 3, 10, 2); ctx.fillStyle = '#a889c8'; K.fr(bx - 5, by + 1.5, 10, 1); }
    }
  }

  /* ---------- registro ---------- */
  const reg = { taverna, padaria, mercado, alquimista, hospedaria };
  for (const id in reg) { reg[id].staffInArt = true; G.A.BuildingArt[id] = reg[id]; }
})();
