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
  const SX0 = 41, SX1 = 52, FEET = 105, HX = 64, HFEET = 107;   // ferreiro na bigorna / junto à forja; ajudante entre bigorna e forja

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

  /* ---------- cache ---------- */
  let C = null;
  function init() {
    C = { fl: {}, back: back(), puff: [[], []] };
    for (const k in FSETS) { C.fl[k] = []; for (let i = 0; i < FRAMES; i++) C.fl[k].push(flame(FSETS[k], i * 3 + 1)); }
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
    const W = o.workers || {}, smithW = dmg ? null : (W.main || W.helper), helperW = (!dmg && W.main && W.helper) ? W.helper : null, solo = smithW && !W.main;
    const smithOn = !!smithW, crafting = o.crafting && !dmg;
    const tq = quiet ? 0 : t;

    /* nível do fogo: 0.18 danificado · 0.4 noite · 1 dia · 1.5 forjando; fole a cada ~4,6 s */
    const bp = tq % 4.6, bell = (!quiet && (smithOn || helperW) && bp < 0.7) ? Math.sin(Math.PI * bp / 0.7) : 0;
    const lvl = dmg ? 0.18 : crafting ? 1.5 : smithOn ? 1 : (o.hour >= 6 && o.hour < 20) ? 0.7 : 0.4;
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

    /* ---------- moradores reais (sprites do jogo) ---------- */
    const drawW = (w, x, y, pose, flip) => { ctx.fillStyle = 'rgba(20,14,28,0.35)'; ctx.beginPath(); ctx.ellipse(m.sx(x), m.sy(y), 6.5 * kx, 1.9 * ky, 0, 0, TAU); ctx.fill(); try { w.draw(ctx, m.sx(x), m.sy(y), { pose, flip: !!flip, alpha: 1 }); } catch (e) {} ctx.imageSmoothingEnabled = false; };
    if (helperW) {   // ajudante aciona o fole entre a bigorna e a forja
      let hp = 'idle0';
      if (!quiet) { hp = bp < 0.7 ? (bp < 0.25 ? 'atk0' : bp < 0.45 ? 'atk1' : 'atk2') : (Math.floor(t / 0.9) % 2 ? 'idle1' : 'idle0'); if (bp > 2.4 && bp < 3.4) hp = 'idle0'; }
      drawW(helperW, HX, HFEET, hp, false);
    }
    if (!smithOn) return;
    const per = (crafting ? 0.56 : 0.92) * (solo ? 1.25 : 1), CY = 10, HAM = 6.6, VAR = CY - HAM;
    let pose = 'atk0', sxc = SX0, T = 0.75, k = -1, f = 0, tt = 0, hammering = true, cyc = 0, flip = false, reheat = false;
    if (!quiet) {
      cyc = Math.floor(t / CY); tt = t - cyc * CY;
      if (crafting || tt < HAM) {
        tt = crafting ? t : tt; k = Math.floor(tt / per); f = (tt - k * per) / per;
        pose = f < 0.5 ? 'atk0' : f < 0.66 ? 'atk1' : f < 0.86 ? 'atk2' : 'atk0';
        T = crafting ? 0.95 - 0.35 * ((t % 3.2) / 3.2) : (cyc % 2 === 0 ? 1 : 0.7) - 0.5 * (tt / HAM);
      } else {
        hammering = false; const v = tt - HAM;
        if (cyc % 2 === 0) {   // vira para a forja e reaquece a barra
          const e = v < 0.7 ? v / 0.7 : v < VAR - 0.7 ? 1 : (VAR - v) / 0.7, es = e * e * (3 - 2 * e);
          sxc = SX0 + (SX1 - SX0) * es; flip = true; reheat = es > 0.98 || (v > 0.7 && v < VAR - 0.7);
          pose = e > 0 && e < 1 ? 'walk' + (Math.floor(t * 8) % 4) : 'idle' + (Math.floor(t * 2) % 2);
          T = 0.3 + 0.7 * cl((v - 0.4) / 1.6, 0, 1);
        } else { pose = Math.floor(t * 1.4) % 2 ? 'idle1' : 'idle0'; T = 0.4 - 0.1 * (v / VAR); }
      }
    }
    const x0 = Math.round(sxc) - 12;
    drawW(smithW, sxc, FEET, pose, flip);
    m.blit(ctx, 31, 97, 21, 13);                    // bigorna passa à frente do ferreiro
    // barra incandescente
    const col = heat(T);
    if (reheat) {
      ctx.fillStyle = col; fr(x0 + 15, 90, 14, 1); ctx.fillStyle = heat(T - 0.15); fr(x0 + 15, 91, 14, 1);
      ctx.globalCompositeOperation = 'lighter'; glow(x0 + 27, 90, 8, '255,200,90', 0.5 * T); ctx.globalCompositeOperation = 'source-over';
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

  /* ---------- Fazenda (celeiro) ---------- */
  const HEN = [{ b: '#f2ece0', s: '#c9bfae' }, { b: '#b8763a', s: '#8a5126' }, { b: '#d9d2c4', s: '#7a6a58' }];
  let F = null;
  function outline(m, W, H) {
    const c = m.x, im = c.getImageData(0, 0, W, H), d = im.data, ou = rgb(OUT), a = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] > 0, add = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) add.push(x, y);
    for (let i = 0; i < add.length; i += 2) { const k = (add[i + 1] * W + add[i]) * 4; d[k] = ou[0]; d[k + 1] = ou[1]; d[k + 2] = ou[2]; d[k + 3] = 255; }
    c.putImageData(im, 0, 0); return m.cv;
  }
  function hen(pal, pose) {
    const m = mk(16, 14), c = m.x, r = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); }, LEG = '#e0a030', RD = '#d03a3a';
    const wing = pose === 'flap';
    r(1, 4, 3, 5, pal.b); r(0, 3, 2, 3, pal.s); r(3, 6, 9, 5, pal.b); r(4, 10, 7, 1, pal.s);
    if (wing) { r(4, 2, 4, 5, pal.s); r(8, 3, 3, 4, pal.b); r(5, 1, 2, 2, pal.s); } else r(5, 7, 5, 3, pal.s);
    if (pose === 'peck') { r(10, 5, 2, 3, pal.b); r(12, 6, 3, 3, pal.b); r(13, 5, 2, 1, RD); r(15, 8, 1, 1, '#f0a030'); r(14, 7, 1, 1, OUT); }
    else { r(10, 4, 2, 3, pal.b); r(11, 2, 3, 4, pal.b); r(12, 1, 2, 1, RD); r(14, 3, 1, 1, '#f0a030'); r(13, 3, 1, 1, OUT); r(13, 5, 1, 1, RD); }
    if (pose === 'walkB') { r(5, 11, 1, 2, LEG); r(5, 13, 2, 1, LEG); r(10, 11, 1, 2, LEG); r(10, 13, 2, 1, LEG); } else { r(6, 11, 1, 2, LEG); r(6, 13, 2, 1, LEG); r(9, 11, 1, 2, LEG); r(9, 13, 2, 1, LEG); }
    return outline(m, 16, 14);
  }
  function rooster() {
    const m = mk(16, 14), c = m.x, r = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    r(0, 2, 3, 6, '#2a6a5a'); r(1, 1, 2, 2, '#3a8a6a'); r(3, 6, 8, 5, '#c8552a'); r(10, 5, 3, 5, '#d8742a'); r(5, 7, 4, 3, '#a03a1e'); r(11, 2, 3, 4, '#e8a030');
    r(11, 0, 2, 2, '#e03a3a'); r(14, 3, 2, 1, '#f0d050'); r(13, 3, 1, 1, OUT); r(13, 5, 1, 1, '#e03a3a'); r(7, 11, 2, 2, '#6a6a80');
    return outline(m, 16, 14);
  }
  function initF() {
    F = { hen: {}, roost: rooster() };
    for (let i = 0; i < HEN.length; i++) for (const p of ['stand', 'peck', 'flap', 'walkA', 'walkB']) F.hen[i + p] = hen(HEN[i], p);
  }
  const HENS = [{ x: 34, a: 15, w: 0.33, ph: 0.4, y: 110 }, { x: 58, a: 13, w: 0.27, ph: 2.1, y: 111.5 }, { x: 80, a: 10, w: 0.41, ph: 4.0, y: 110.8 }];

  function fazenda(ctx, m, t, o) {
    if (!C) init(); if (!F) initF();
    const kx = m.kx, ky = m.ky, s = m.s, quiet = o.quiet, third = o.light ? 1 / 3 : 1, nt = o.dark, dmg = o.damaged;
    const fr = (ix, iy, w, h) => { const x = Math.round(m.sx(ix)), y = Math.round(m.sy(iy)); ctx.fillRect(x, y, Math.max(1, Math.round(m.sx(ix + w)) - x), Math.max(1, Math.round(m.sy(iy + h)) - y)); };
    const dr = (cv, ix, iy, w, h) => { const x = Math.round(m.sx(ix)), y = Math.round(m.sy(iy)); ctx.drawImage(cv, x, y, Math.max(1, Math.round(m.sx(ix + (w || cv.width))) - x), Math.max(1, Math.round(m.sy(iy + (h || cv.height))) - y)); };
    const glow = (ix, iy, rad, col, a) => { const x = m.sx(ix), y = m.sy(iy), rr = rad * s, g = ctx.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, 'rgba(' + col + ',' + a + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); ctx.fillStyle = g; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2); };
    const tq = quiet ? 0 : t, night = nt > 0.55;

    /* porta do celeiro entreabre de vez em quando (14 s): fresta escura com feno */
    if (!dmg) {
      const ph = (tq + 3) % 14, op = quiet ? 0 : ph < 0.8 ? ph / 0.8 : ph < 3.6 ? 1 : ph < 4.4 ? (4.4 - ph) / 0.8 : 0;
      if (op > 0.02) {
        const gw = 0.8 + 3.2 * op;
        ctx.fillStyle = '#1a1018'; fr(42 - gw / 2, 84, gw, 22);
        ctx.fillStyle = '#2c1a14'; fr(42 - gw / 2, 84, gw, 2);
        if (gw > 2) { ctx.fillStyle = '#d9b04a'; fr(41.2, 102, 1, 1); fr(42.4, 100, 1, 1); fr(41, 105, 2, 1); fr(42, 103, 1, 1); ctx.fillStyle = '#b8873a'; fr(41.6, 104, 1, 1); }
        ctx.fillStyle = '#7a5a3a'; fr(42 - gw / 2 - 1, 84, 1, 22);
      }
    }
    /* janelas e lanterna acesas à noite */
    const fl = quiet ? 1 : 0.88 + 0.12 * Math.sin(t * 9) * Math.sin(t * 3.3 + 1);
    ctx.globalCompositeOperation = 'lighter';
    if (!dmg) {
      const wa = (0.1 + 0.55 * nt) * fl;
      glow(18.5, 92, 9 + 5 * nt, '255,196,90', wa); glow(64, 91, 8 + 4 * nt, '255,196,90', wa);
      if (nt > 0.15) glow(78, 94, 10 * (0.6 + 0.4 * nt) + 3, '255,180,70', 0.5 * nt * fl);
    }
    ctx.globalCompositeOperation = 'source-over';
    if (!dmg) { ctx.fillStyle = '#5b6278'; fr(77, 88, 3, 1); ctx.fillStyle = nt > 0.15 ? '#ffe08a' : '#9a8a60'; fr(77.5, 89, 2, 3); ctx.fillStyle = '#5b6278'; fr(77.5, 92, 2, 1); }

    /* galo cata-vento: gira (achata no eixo x) com o vento */
    {
      const ang = quiet ? 0.5 : t * 0.45 + Math.sin(t * 0.37) * 1.6 + Math.sin(t * 1.3) * 0.25, sc = Math.cos(ang), sg = Math.abs(sc) < 0.28 ? (sc < 0 ? -0.28 : 0.28) : sc;
      ctx.fillStyle = '#5b6278'; fr(57.5, 33, 1, 8);
      const w = 8 * Math.abs(sg), cx = m.sx(58), top = m.sy(30);
      ctx.save(); ctx.translate(cx, top); ctx.scale(sg, 1); ctx.drawImage(F.roost, Math.round(-4 * kx), 0, Math.round(8 * kx), Math.round(7 * ky)); ctx.restore();
    }

    /* fumaça suave da chaminé */
    if (!quiet) {
      let N = dmg ? 4 : night ? 2 : 4; N = Math.max(1, Math.ceil(N * third)); const LF = 4.4, A = dmg ? 0.78 : night ? 0.3 : 0.55, pal = C.puff[dmg ? 1 : 0];
      for (let i = 0; i < N; i++) {
        const ag = ((t + i * LF / N) % LF) / LF, cyc = Math.floor((t + i * LF / N) / LF), sz = Math.min(3, (ag * 4.2) | 0);
        const x = 75.5 + (hs(cyc, i, 4) - 0.5) * 3 + Math.sin(ag * 5 + i * 2.1) * 2 + ag * 8, y = 34 - ag * 26 - PUFF[sz] / 2;
        ctx.globalAlpha = Math.min(1, ag * 7) * Math.pow(1 - ag, 1.3) * A;
        dr(pal[sz], Math.round(x - PUFF[sz] / 2), Math.round(y));
      }
      ctx.globalAlpha = 1;
    }

    /* fiapos de palha voando dos fardos */
    if (!quiet && !dmg) {
      const N = Math.max(1, Math.ceil(4 * third));
      for (let i = 0; i < N; i++) {
        const P = 3.2 + i * 0.7, tt = t + i * 1.3, ag = (tt % P) / P, cyc = Math.floor(tt / P);
        ctx.globalAlpha = Math.min(1, ag * 6) * (1 - ag * ag); ctx.fillStyle = i % 2 ? '#e8c35a' : '#cfa040';
        const x = 66 + hs(cyc, i, 5) * 12 + ag * (14 + 6 * hs(cyc, i, 6)), y = 97 - Math.sin(ag * Math.PI) * (6 + 5 * hs(cyc, i, 7)) + ag * 4;
        fr(x, y, Math.sin(tt * 6 + i) > 0 ? 2 : 1, 1);
      }
      ctx.globalAlpha = 1;
    }

    /* galinhas ciscando no terreiro (se recolhem à noite) */
    if (!dmg) {
      const fade = 1 - cl((nt - 0.4) / 0.25, 0, 1);
      if (fade > 0.02) {
        const n = o.light ? 2 : 3; ctx.globalAlpha = fade;
        for (let i = 0; i < n; i++) {
          const H = HENS[i], arg = tq * H.w + H.ph, x = H.x + H.a * Math.sin(arg), vel = H.a * H.w * Math.cos(arg);
          let pose = 'stand', bob = 0;
          if (!quiet) {
            if (Math.abs(vel) > 2.2) { pose = Math.floor(t * 6 + i) % 2 ? 'walkA' : 'walkB'; bob = Math.floor(t * 6 + i) % 2 ? 0 : -0.5; }
            else if (((t + i * 3.7) % 11) < 0.6) pose = Math.floor(t * 10) % 2 ? 'flap' : 'stand';
            else pose = Math.floor(t * 3 + i * 1.7) % 3 ? 'peck' : 'stand';
          }
          const dir = vel >= 0 ? 1 : -1, y = H.y + bob;
          ctx.fillStyle = 'rgba(20,14,28,0.3)'; ctx.beginPath(); ctx.ellipse(m.sx(x), m.sy(H.y + 3.3), 4 * kx, 1.2 * ky, 0, 0, TAU); ctx.fill();
          const cv = F.hen[i + pose], px = m.sx(x), py = m.sy(y - 3.5);
          ctx.save(); ctx.translate(px, py); ctx.scale(dir, 1); ctx.drawImage(cv, Math.round(-4 * kx), 0, Math.round(8 * kx), Math.round(7 * ky)); ctx.restore();
        }
        ctx.globalAlpha = 1;
      }
    }
  }

  G.A.BuildingArt = Object.assign(G.A.BuildingArt || {}, { ferraria, fazenda });
})();
