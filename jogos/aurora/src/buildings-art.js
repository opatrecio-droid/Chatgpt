/* Aurora 046 · Arte animada dos prédios de serviço. Contrato: G.A.BuildingArt[id](ctx, m, t, o) — ver src/buildings-anim.js.
   Coordenadas em pixels da IMAGEM do prédio (ferraria 104×114). Quadros do ferreiro, chamas e fumaça são pré-renderizados
   (1 px de arte = 1 px de cache) e desenhados escalados por m.kx/m.ky; partículas são determinísticas em t. */
(function () {
  'use strict';
  if (typeof G === 'undefined' || G.HEADLESS || !G.A) return;
  const OUT = '#1a1422', TAU = Math.PI * 2;
  const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const hs = (x, y, s) => { let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s || 0) | 0, 362437)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16; return (n >>> 0) / 4294967296; };
  const cl = (v, a, b) => v < a ? a : v > b ? b : v;
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

  /* ---------- geometria (pixels da imagem) ---------- */
  const FX = 79, FBASE = 97, FW = 18;      // fogo: centro x, base y, largura do quadro
  const BACK = [70, 83];                    // fundo escuro do arco (cobre a chama pintada)
  const CHIM = [76, 17];                    // boca da chaminé
  const LANT = [22, 87];                    // chama da lanterna
  const SW = 38, SH = 30, SPY = 70;         // sprite do ferreiro: origem y na imagem
  const CX = 12, SX0 = 41, SX1 = 50;        // x do centro do ferreiro: trabalhando / junto à forja

  /* ---------- chamas ---------- */
  const FSETS = { low: 5, mid: 11, big: 15 }, FRAMES = 8, FH = 17;
  function flame(maxH, seed) {
    return paint(FW, FH, (x, y, o) => {
      const dx = (x - (FW - 1) / 2) / (FW / 2), yy = FH - 1 - y;
      const lick = 0.5 + 0.5 * Math.sin(x * 1.9 + seed * 2.3) * Math.sin(x * 0.7 - seed * 1.1);
      let hgt = maxH * (1 - Math.pow(Math.abs(dx), 1.7)) * (0.55 + 0.45 * lick);
      if (hs(x, seed, 7) > 0.78) hgt += maxH * 0.22 * (1 - Math.abs(dx));     // línguas finas mais altas
      if (yy >= hgt || hgt < 1) return;
      const v = yy / hgt, e = Math.abs(dx) + hs(x, y, seed) * 0.25;
      put(o, v < 0.3 && e < 0.55 ? '#fff6c2' : v < 0.55 && e < 0.8 ? '#ffd24a' : v < 0.8 ? '#ff9a26' : e > 0.8 ? '#c92f1e' : '#ec5a1c');
    });
  }
  const back = () => paint(19, 15, (x, y, o) => {
    const ins = [5, 3, 2, 1, 1][y] || 0;
    if (x < ins || x > 18 - ins) return;
    const k = y / 14, n = hs(x, y, 3);
    put(o, y > 12 ? (n > 0.5 ? '#4a2a1c' : '#2c1810') : k > 0.5 ? (n > 0.8 ? '#3a1c18' : '#2a1214') : '#1f0d14');
  });

  /* ---------- fumaça ---------- */
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

  /* ---------- ferreiro ---------- */
  const SKIN = '#e0a074', SKIN2 = '#b9704f', SKIN3 = '#f0bd90', BEARD = '#6a4126', BEARD2 = '#4b2c1a', BEARD3 = '#8c5c34';
  const LEA = '#8a5429', LEA2 = '#5e381c', LEA3 = '#a96d38', SHIRT = '#b59a70', SHIRT2 = '#8b7452', PANT = '#3d3550', BOOT = '#241a28', RED = '#c23c3c', RED2 = '#8c2630', STEEL = '#9aa3b8', STEEL2 = '#5b6278', STEEL3 = '#dde3f2', WOOD = '#9a6634';
  const POSES = {
    hit0: { R: { h: [19, 8], i: 'ham', t: [20, 2] }, L: { h: [5, 21], i: 'ton' } },
    hit1: { R: { h: [19, 12], i: 'ham', t: [21, 7] }, L: { h: [5, 21], i: 'ton' } },
    hit2: { R: { h: [17, 19], i: 'ham', t: [16, 24] }, L: { h: [5, 21], i: 'ton' } },
    hit3: { R: { h: [19, 15], i: 'ham', t: [21, 10] }, L: { h: [5, 21], i: 'ton' } },
    wipeA: { R: { h: [17, 4] }, L: { h: [5, 21], i: 'ton' }, belt: 1 },
    wipeB: { R: { h: [15, 5] }, L: { h: [5, 21], i: 'ton' }, belt: 1 },
    reheat: { R: { h: [23, 19], i: 'ton2' }, L: { h: [4, 19], i: 'ham', t: [3, 24] } }
  };
  function smith(pose) {
    const m = mk(SW, SH), c = m.x, r = (X, Y, W, H, col) => { c.fillStyle = col; c.fillRect(X, Y, W, H); };
    const P = POSES[pose];
    // pernas e botas
    r(8, 22, 4, 8, PANT); r(13, 22, 4, 8, PANT); r(8, 22, 1, 8, '#2c2640'); r(7, 28, 5, 2, BOOT); r(13, 28, 5, 2, BOOT);
    // camisa
    r(6, 12, 12, 11, SHIRT); r(6, 12, 2, 11, SHIRT2); r(16, 14, 2, 8, SHIRT2);
    // avental de couro
    r(9, 13, 6, 2, LEA); r(8, 15, 8, 8, LEA); r(7, 23, 10, 4, LEA); r(8, 15, 1, 11, LEA3); r(15, 15, 1, 11, LEA2); r(16, 23, 1, 4, LEA2);
    r(8, 12, 1, 2, LEA2); r(15, 12, 1, 2, LEA2); r(8, 20, 8, 1, '#3a2a1e'); r(11, 20, 2, 1, '#d8b04a'); r(10, 23, 4, 1, LEA2); r(9, 17, 1, 1, '#c98a52'); r(14, 17, 1, 1, LEA2);
    // cabeça + lenço
    r(8, 3, 8, 6, SKIN); r(8, 3, 1, 6, SKIN2); r(15, 3, 1, 6, SKIN2); r(9, 5, 2, 1, SKIN3);
    r(8, 2, 8, 3, RED); r(7, 4, 10, 1, RED2); r(9, 2, 3, 1, '#e0605a'); r(16, 3, 2, 2, RED); r(17, 5, 1, 2, RED2); r(18, 4, 1, 2, RED2);
    r(10, 6, 1, 1, OUT); r(13, 6, 1, 1, OUT); r(9, 5, 3, 1, BEARD2); r(12, 5, 3, 1, BEARD2); r(11, 7, 2, 1, SKIN2);
    // barba
    r(8, 8, 8, 1, BEARD); r(9, 8, 6, 1, BEARD3); r(7, 9, 10, 2, BEARD); r(8, 11, 8, 1, BEARD); r(9, 12, 6, 1, BEARD2); r(7, 9, 1, 2, BEARD2); r(16, 9, 1, 2, BEARD2); r(9, 10, 2, 1, BEARD3); r(13, 10, 1, 1, BEARD3);
    // braços
    const seg = (x0, y0, x1, y1, w, col, oy) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) r(Math.round(x0 + (x1 - x0) * i / n - w / 2 + 0.5), Math.round(y0 + (y1 - y0) * i / n - 1) + oy, w, 3, col); };
    const arm = (sx, sy, a, side) => {
      const hx = a.h[0], hy = a.h[1], ex = (sx + hx) / 2 + side * 2, ey = (sy + hy) / 2 + 3;
      seg(sx, sy, ex, ey, 4, SKIN2, 1); seg(ex, ey, hx, hy, 3, SKIN2, 1);
      seg(sx, sy, ex, ey, 4, SKIN, 0); seg(ex, ey, hx, hy, 3, SKIN, 0);
      r(Math.round((sx + ex) / 2), Math.round((sy + ey) / 2) - 1, 1, 1, SKIN3); r(Math.round((ex + hx) / 2), Math.round((ey + hy) / 2) - 1, 1, 1, SKIN3);
      r(hx - 1, hy - 1, 3, 3, SKIN); r(hx - 1, hy + 1, 3, 1, SKIN2);
    };
    const item = (a) => {
      const hx = a.h[0], hy = a.h[1];
      if (a.i === 'ham') {
        const tx = a.t[0], ty = a.t[1], n = Math.max(Math.abs(tx - hx), Math.abs(ty - hy), 1);
        for (let i = 0; i <= n; i++) r(Math.round(hx + (tx - hx) * i / n), Math.round(hy + (ty - hy) * i / n), 1, 1, WOOD);
        r(tx - 3, ty - 2, 6, 4, STEEL); r(tx - 3, ty - 2, 6, 1, STEEL3); r(tx - 3, ty + 1, 6, 1, STEEL2); r(tx - 3, ty - 1, 1, 2, STEEL3);
        r(hx - 1, hy - 1, 3, 3, SKIN); r(hx - 1, hy + 1, 3, 1, SKIN2);
      } else if (a.i === 'ton') { r(hx - 1, hy + 1, 1, 4, STEEL); r(hx + 1, hy + 1, 1, 4, STEEL2); r(hx - 2, hy - 2, 1, 3, STEEL2); r(hx - 1, hy - 1, 3, 3, SKIN); }
      else if (a.i === 'ton2') { r(hx + 1, hy - 1, 5, 1, STEEL); r(hx + 1, hy + 1, 5, 1, STEEL2); r(hx - 1, hy - 1, 3, 3, SKIN); r(hx - 1, hy + 1, 3, 1, SKIN2); }
    };
    arm(6, 14, P.L, -1); arm(18, 14, P.R, 1);
    r(4, 12, 3, 3, SHIRT); r(4, 14, 3, 1, SHIRT2); r(17, 12, 3, 3, SHIRT); r(17, 14, 3, 1, SHIRT2);
    if (P.belt) { r(18, 18, 1, 4, WOOD); r(17, 21, 4, 3, STEEL); r(17, 21, 4, 1, STEEL3); }
    item(P.L); item(P.R); if (P.L.h && P.L.i !== 'ton') arm(6, 14, P.L, -1);
    // contorno automático
    const im = c.getImageData(0, 0, SW, SH), d = im.data, ou = rgb(OUT), a = (x, y) => x >= 0 && y >= 0 && x < SW && y < SH && d[(y * SW + x) * 4 + 3] > 0;
    const add = [];
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) add.push(x, y);
    for (let i = 0; i < add.length; i += 2) { const k = (add[i + 1] * SW + add[i]) * 4; d[k] = ou[0]; d[k + 1] = ou[1]; d[k + 2] = ou[2]; d[k + 3] = 255; }
    c.putImageData(im, 0, 0); return m.cv;
  }

  /* ---------- cache ---------- */
  let C = null;
  function init() {
    C = { fl: {}, back: back(), smith: {}, puff: [[], []] };
    for (const k in FSETS) { C.fl[k] = []; for (let i = 0; i < FRAMES; i++) C.fl[k].push(flame(FSETS[k], i * 3 + 1)); }
    for (const k in POSES) C.smith[k] = smith(k);
    const pals = [['#ece9f4', '#bfbad0', '#8f8aa8'], ['#74707f', '#53505f', '#38343f']];
    for (let p = 0; p < 2; p++) for (let i = 0; i < PUFF.length; i++) C.puff[p].push(puff(PUFF[i], pals[p], i + p * 9));
  }

  const HEAT = [[0, '#6a3434'], [0.25, '#d2431c'], [0.45, '#ff8a24'], [0.65, '#ffc23e'], [0.9, '#fff2a8']].map(a => [a[0], rgb(a[1])]);
  function heat(T) {
    T = cl(T, 0, 1); let i = 1; while (i < HEAT.length - 1 && T > HEAT[i][0]) i++;
    const a = HEAT[i - 1], b = HEAT[i], k = cl((T - a[0]) / (b[0] - a[0]), 0, 1);
    return 'rgb(' + ((a[1][0] + (b[1][0] - a[1][0]) * k) | 0) + ',' + ((a[1][1] + (b[1][1] - a[1][1]) * k) | 0) + ',' + ((a[1][2] + (b[1][2] - a[1][2]) * k) | 0) + ')';
  }

  /* ---------- Ferraria ---------- */
  function ferraria(ctx, m, t, o) {
    if (!C) init();
    const kx = m.kx, ky = m.ky, s = m.s;
    const fr = (ix, iy, w, h) => { const x = Math.round(m.sx(ix)), y = Math.round(m.sy(iy)); ctx.fillRect(x, y, Math.max(1, Math.round(m.sx(ix + w)) - x), Math.max(1, Math.round(m.sy(iy + h)) - y)); };
    const dr = (cv, ix, iy, w, h) => { const x = Math.round(m.sx(ix)), y = Math.round(m.sy(iy)); ctx.drawImage(cv, x, y, Math.max(1, Math.round(m.sx(ix + (w || cv.width))) - x), Math.max(1, Math.round(m.sy(iy + (h || cv.height))) - y)); };
    const glow = (ix, iy, rad, col, a) => { const x = m.sx(ix), y = m.sy(iy), rr = rad * s, g = ctx.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, 'rgba(' + col + ',' + a + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); ctx.fillStyle = g; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2); };
    const quiet = o.quiet, third = o.light ? 1 / 3 : 1, nt = o.dark, dmg = o.damaged;
    const smithOn = o.working && !dmg, crafting = o.crafting && !dmg;
    const tq = quiet ? 0 : t;

    /* nível do fogo: 0.18 danificado · 0.4 noite · 1 dia · 1.5 forjando; fole a cada ~4,6 s */
    const bp = tq % 4.6, bell = (!quiet && smithOn && bp < 0.7) ? Math.sin(Math.PI * bp / 0.7) : 0;
    const lvl = dmg ? 0.18 : crafting ? 1.5 : o.working ? 1 : 0.4;
    const L = lvl + bell * 0.55, fl = quiet ? 0.9 : 0.85 + 0.15 * Math.sin(t * 17) * Math.sin(t * 7.3 + 1);
    const set = L < 0.55 ? 'low' : L < 1.15 ? 'mid' : 'big', fi = quiet ? 0 : (hs(Math.floor(t * 10), 5) * FRAMES) | 0;

    // fundo do arco + brasas + chama em duas camadas
    dr(C.back, BACK[0], BACK[1]);
    ctx.fillStyle = '#ff9a2e';
    for (let i = 0; i < 6; i++) { ctx.globalAlpha = (0.45 + 0.55 * Math.sin(tq * 2.6 + i * 1.9) * 0.5 + 0.275) * Math.min(1, 0.45 + L * 0.5); fr(71 + i * 3 + (i & 1), 96 + (i % 3 === 0 ? 0 : 1), 2, 1); }
    ctx.globalAlpha = 1;
    dr(C.fl[set][fi], FX - FW / 2, FBASE - FH);
    ctx.globalCompositeOperation = 'lighter';
    if (set !== 'low') { ctx.globalAlpha = 0.35; dr(C.fl[set][(fi + 3) % FRAMES], FX - FW / 2, FBASE - FH - 1); }
    // brilho do calor sobre as pedras do arco
    ctx.globalAlpha = 1; glow(FX, 90, 14 + L * 7, '255,130,40', cl(0.16 + 0.22 * L, 0, 0.5) * fl);
    // brilho que derrama no chão à frente (forte à noite)
    const ga = (0.05 + 0.5 * nt) * Math.min(1.2, L) * fl;
    if (ga > 0.02) { ctx.save(); const x = m.sx(70), y = m.sy(108); ctx.translate(x, y); ctx.scale(1, 0.28); const rr = 36 * s, g = ctx.createRadialGradient(0, 0, 0, 0, 0, rr); g.addColorStop(0, 'rgba(255,140,50,' + ga + ')'); g.addColorStop(1, 'rgba(255,100,30,0)'); ctx.fillStyle = g; ctx.fillRect(-rr, -rr, rr * 2, rr * 2); ctx.restore(); }

    // faíscas da forja
    if (!quiet && !dmg && L > 0.3) {
      const n = Math.ceil((bell > 0.2 || crafting ? 6 : 4) * third);
      for (let i = 0; i < n; i++) {
        const P = 1.2 + hs(i, 1, 2) * 1.1, ph = ((t + i * 0.53) % P) / P, cyc = Math.floor((t + i * 0.53) / P), a = 1 - ph;
        ctx.globalAlpha = a; ctx.fillStyle = ph < 0.4 ? '#fff0a0' : '#ff9a30';
        fr(FX - 6 + hs(cyc, i, 9) * 12 + Math.sin(t * 3 + i * 2) * 1.5, 92 - ph * (10 + 5 * L), 1, 1);
      }
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = 'source-over';

    /* ---------- chaminé ---------- */
    if (!quiet) {
      let N = dmg ? 4 : crafting ? 9 : o.working ? 6 : 3, A = dmg ? 0.8 : crafting ? 0.9 : o.working ? 0.72 : 0.38;
      N = Math.max(1, Math.ceil(N * third)); const LF = crafting ? 3.0 : 3.8, pal = C.puff[dmg ? 1 : 0];
      for (let i = 0; i < N; i++) {
        const ag = ((t + i * LF / N) % LF) / LF, cyc = Math.floor((t + i * LF / N) / LF), sz = Math.min(3, (ag * 4.2) | 0);
        const x = CHIM[0] + (hs(cyc, i, 4) - 0.5) * 5 + Math.sin(ag * 5 + i * 2.1) * 2.5 + ag * 9, y = CHIM[1] - ag * 30 - PUFF[sz] / 2;
        ctx.globalAlpha = Math.min(1, ag * 7) * Math.pow(1 - ag, 1.3) * A * (crafting && !dmg ? 1 : 0.95);
        dr(pal[sz], Math.round(x - PUFF[sz] / 2), Math.round(y));
      }
      ctx.globalAlpha = 1;
      if (!dmg && (o.working || crafting)) {   // fagulhas ocasionais no topo
        ctx.globalCompositeOperation = 'lighter';
        const n = Math.ceil((crafting ? 3 : 2) * third);
        for (let i = 0; i < n; i++) {
          const P = 2.4 + i * 0.9, tt = t + i * 1.1, ph = (tt % P) / (crafting ? 0.9 : 0.7), cyc = Math.floor(tt / P);
          if (ph >= 1) continue;
          ctx.globalAlpha = 1 - ph; ctx.fillStyle = ph < 0.35 ? '#ffe29a' : '#ff9a30';
          fr(CHIM[0] - 4 + hs(cyc, i, 3) * 8 + ph * 4, CHIM[1] - 1 - ph * 15, 1, 1);
        }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
    }

    /* ---------- lanterna ---------- */
    {
      const lf = quiet ? 1 : 0.8 + 0.2 * Math.sin(t * 13 + 1) * Math.sin(t * 5.1), hgt = quiet ? 2 : 2 + (Math.sin(t * 9.7) > 0.3 ? 1 : 0);
      ctx.fillStyle = '#ffd35a'; fr(LANT[0] - 1, LANT[1] - hgt + 2, 2, hgt); ctx.fillStyle = '#fff6c8'; fr(LANT[0] - 1 + (hgt > 2 ? 0 : 0), LANT[1] + 1 - (hgt > 2 ? 1 : 0), 1, 2);
      ctx.globalCompositeOperation = 'lighter'; glow(LANT[0], LANT[1], 9 + 7 * nt, '255,190,80', (0.14 + 0.5 * nt) * lf); ctx.globalCompositeOperation = 'source-over';
    }

    /* ---------- ferreiro ---------- */
    if (!smithOn) return;
    const per = crafting ? 0.56 : 0.92, CY = 10, HAM = 6.6, VAR = CY - HAM;
    let pose = 'hit0', sxc = SX0, T = 0.75, k = -1, f = 0, tt = 0, hammering = true, cyc = 0;
    if (!quiet) {
      cyc = Math.floor(t / CY); tt = t - cyc * CY;
      if (crafting || tt < HAM) {
        tt = crafting ? t : tt; k = Math.floor(tt / per); f = (tt - k * per) / per;
        pose = f < 0.45 ? 'hit0' : f < 0.58 ? 'hit1' : f < 0.72 ? 'hit2' : f < 0.86 ? 'hit3' : 'hit1';
        T = crafting ? 0.95 - 0.35 * ((t % 3.2) / 3.2) : (cyc % 2 === 0 ? 1 : 0.7) - 0.5 * (tt / HAM);
      } else {
        hammering = false; const v = tt - HAM;
        if (cyc % 2 === 0) {   // leva a barra à forja
          pose = 'reheat'; const e = v < 0.6 ? v / 0.6 : v < VAR - 0.6 ? 1 : (VAR - v) / 0.6; sxc = SX0 + (SX1 - SX0) * (e * e * (3 - 2 * e));
          T = 0.3 + 0.7 * cl((v - 0.4) / 1.4, 0, 1) * (v < VAR - 0.6 ? 1 : 1);
        } else { pose = Math.floor(v / 0.28) % 2 ? 'wipeB' : 'wipeA'; T = 0.4 - 0.1 * (v / VAR); }
      }
    }
    const x0 = Math.round(sxc) - CX;
    ctx.imageSmoothingEnabled = false;
    dr(C.smith[pose], x0, SPY);
    m.blit(ctx, 31, 97, 21, 12);                    // bigorna passa à frente do ferreiro
    // barra incandescente
    const col = heat(T);
    if (pose === 'reheat') {
      ctx.fillStyle = col; fr(x0 + 24, SPY + 19, 12, 1); ctx.fillStyle = heat(T - 0.15); fr(x0 + 24, SPY + 20, 12, 1);
      if (T > 0.4) { ctx.globalCompositeOperation = 'lighter'; glow(x0 + 33, SPY + 20, 8, '255,200,90', 0.5 * T); ctx.globalCompositeOperation = 'source-over'; }
    } else {
      ctx.fillStyle = col; fr(x0 + 4, 95, 14, 1); ctx.fillStyle = heat(T - 0.15); fr(x0 + 4, 96, 14, 1);
      if (T > 0.45) { ctx.globalCompositeOperation = 'lighter'; glow(x0 + 12, 95, 7, '255,170,60', 0.35 * T); ctx.globalCompositeOperation = 'source-over'; }
    }

    /* golpe: clarão, anel e leque de faíscas */
    if (quiet || !hammering) return;
    const kk = f < 0.58 ? k - 1 : k, age = f < 0.58 ? (f + 1 - 0.58) * per : (f - 0.58) * per;
    if (kk < 0 && !crafting) return;
    const ix = x0 + 15, iy = 95, seed = kk + cyc * 31;
    ctx.globalCompositeOperation = 'lighter';
    if (age < 0.14) { const e = 1 - age / 0.14; glow(ix, iy, 5 + 6 * e * (crafting ? 1.4 : 1), '255,235,160', 0.95 * e); ctx.globalAlpha = e; ctx.fillStyle = '#fffbe0'; fr(ix - 2, iy - 1, 4, 2); ctx.globalAlpha = 1; }
    if (age < 0.32) { const e = age / 0.32; ctx.globalAlpha = (1 - e) * 0.7; ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = Math.max(1, s * 0.8); ctx.beginPath(); ctx.ellipse(m.sx(ix), m.sy(iy), (2 + e * (crafting ? 10 : 7)) * kx, (1 + e * (crafting ? 5 : 3.4)) * ky, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
    if (age < 0.5) {
      const n = Math.ceil((crafting ? 9 : 5) * third);
      for (let i = 0; i < n; i++) {
        const a = -Math.PI * (0.08 + 0.84 * hs(seed, i, 1)), v = (crafting ? 30 : 20) + 22 * hs(seed, i, 2), e = age / 0.5;
        ctx.globalAlpha = 1 - e; ctx.fillStyle = e < 0.35 ? '#fff6c0' : e < 0.7 ? '#ffc23e' : '#ff7a24';
        fr(ix + Math.cos(a) * v * age, iy + Math.sin(a) * v * age + 60 * age * age, crafting && i % 2 ? 2 : 1, 1);
      }
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  G.A.BuildingArt = Object.assign(G.A.BuildingArt || {}, { ferraria });
})();
