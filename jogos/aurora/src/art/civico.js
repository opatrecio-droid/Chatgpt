/* Aurora 046 · Arte animada do grupo CÍVICO: cidadela, guilda, torre, treino, enfermaria.
   Contrato igual ao de buildings-art.js (coordenadas em pixels da imagem 104×114). Sprites em cache, partículas determinísticas em t. */
(function () {
  'use strict';
  if (typeof G === 'undefined' || G.HEADLESS || !G.A) return;
  G.A.BuildingArt = G.A.BuildingArt || {};
  const TAU = Math.PI * 2, OUT = '#1a1422';
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

  /* ---------- caches ---------- */
  const PUFF = [6, 9, 12, 14];
  function puff(sz, pal, seed) {
    const r = sz / 2;
    return paint(sz, sz, (x, y, o) => {
      const dx = x + 0.5 - r, dy = y + 0.5 - r, d = Math.sqrt(dx * dx + dy * dy) + (hs(x, y, seed) - 0.5) * 1.3;
      if (d > r - 0.2) return;
      const l = (-dx - dy) / r * 0.5 + (hs(x, y, seed + 4) - 0.5) * 0.35;
      put(o, l > 0.2 ? pal[0] : l > -0.25 ? pal[1] : pal[2]);
    });
  }
  /* bandeira ao vento (flâmula): quadro de onda pré-renderizado */
  function flagFrame(w, fh, ph, amp, pal) {
    const pad = Math.ceil(amp) + 2, H = fh + pad * 2;
    return paint(w, H, (x, y, o) => {
      const k = x / (w - 1), off = Math.round(Math.sin(x * 0.62 - ph) * amp * (0.25 + 0.75 * k)), top = pad + off, len = fh * (1 - 0.5 * k * k) | 0, yy = y - top;
      if (yy < 0 || yy >= len) return;
      const sl = Math.cos(x * 0.62 - ph);
      let c = sl > 0.45 ? pal[1] : sl < -0.45 ? pal[3] : pal[2];
      if (yy === 0 || yy === len - 1) c = pal[3];
      if (Math.abs(yy - (len - 1) / 2) < 0.6 && x > 1) c = pal[4];
      put(o, c);
    });
  }
  /* estandarte vertical (treino) com a ponta balançando */
  function bannerFrame(w, h, ph, amp, right, pal) {
    const pad = Math.ceil(amp) + 1, W = w + pad * 2;
    return paint(W, h, (x, y, o) => {
      const k = y / (h - 1), off = Math.sin(y * 0.5 - ph) * amp * k * (right ? -1 : 1), bw = w * (1 - cl((k - 0.5) / 0.5, 0, 1) * 0.95), l = right ? pad + w - bw + off : pad + off, xx = x - l;
      if (xx < -0.5 || xx >= bw + 0.5 || bw < 1) return;
      const edge = xx < 1 || xx >= bw - 1 || (k > 0.5 && (xx < 2 || xx >= bw - 2) && false);
      const sl = Math.cos(y * 0.5 - ph);
      put(o, edge ? pal[4] : sl > 0.5 ? pal[1] : sl < -0.5 ? pal[3] : pal[2]);
    });
  }
  const FLAGPAL = ['', '#5470c6', '#3a4c9e', '#252f66', '#e9b93c'];
  function flame(w, h, seed) {
    return paint(w, h, (x, y, o) => {
      const dx = (x - (w - 1) / 2) / (w / 2), yy = h - 1 - y, mh = h - 1;
      const lick = 0.5 + 0.5 * Math.sin(x * 1.9 + seed * 2.3) * Math.sin(x * 0.7 - seed * 1.1);
      let hgt = mh * (1 - Math.pow(Math.abs(dx), 1.6)) * (0.55 + 0.45 * lick);
      if (hs(x, seed, 7) > 0.78) hgt += mh * 0.2 * (1 - Math.abs(dx));
      if (yy >= hgt || hgt < 1) return;
      const v = yy / hgt, e = Math.abs(dx) + hs(x, y, seed) * 0.25;
      put(o, v < 0.3 && e < 0.55 ? '#fff6c2' : v < 0.55 && e < 0.8 ? '#ffd24a' : v < 0.8 ? '#ff9a26' : e > 0.8 ? '#c92f1e' : '#ec5a1c');
    });
  }
  let C = null;
  function init() {
    C = { puff: [[], []], flag: {}, fire: [], fireS: [], ban: { l: [], r: [] } };
    const pals = [['#ece9f4', '#bfbad0', '#8f8aa8'], ['#74707f', '#53505f', '#38343f']];
    for (let p = 0; p < 2; p++) for (let i = 0; i < PUFF.length; i++) C.puff[p].push(puff(PUFF[i], pals[p], i + p * 9));
    for (const k of [['cit', 13, 7, 1.7], ['tor', 16, 7, 1.9]]) { C.flag[k[0]] = []; for (let i = 0; i < 12; i++) C.flag[k[0]].push(flagFrame(k[1], k[2], i / 12 * TAU, k[3], FLAGPAL)); }
    for (let i = 0; i < 8; i++) { C.fire.push(flame(9, 11, i * 3 + 1)); C.fireS.push(flame(6, 7, i * 5 + 2)); }
    for (let i = 0; i < 12; i++) { C.ban.l.push(bannerFrame(9, 13, i / 12 * TAU, 2.2, false, FLAGPAL)); C.ban.r.push(bannerFrame(10, 13, i / 12 * TAU, 2.2, true, FLAGPAL)); }
  }

  /* ---------- ferramentas de desenho (por quadro) ---------- */
  function tools(ctx, m, o, t) {
    const s = m.s, kx = m.kx, ky = m.ky, quiet = o.quiet, nt = o.dark, dmg = o.damaged;
    const T = {
      s, kx, ky, quiet, nt, dmg, third: o.light ? 1 / 3 : 1, tq: quiet ? 0 : t, on: dmg ? nt * 0.28 : nt,
      fr(ix, iy, w, h) { const x = Math.round(m.sx(ix)), y = Math.round(m.sy(iy)); ctx.fillRect(x, y, Math.max(1, Math.round(m.sx(ix + w)) - x), Math.max(1, Math.round(m.sy(iy + h)) - y)); },
      dr(cv, ix, iy) { const x = Math.round(m.sx(ix)), y = Math.round(m.sy(iy)); ctx.drawImage(cv, x, y, Math.max(1, Math.round(m.sx(ix + cv.width)) - x), Math.max(1, Math.round(m.sy(iy + cv.height)) - y)); },
      glow(ix, iy, rad, col, a) { if (a <= 0.01) return; const x = m.sx(ix), y = m.sy(iy), rr = rad * s, g = ctx.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, 'rgba(' + col + ',' + a + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); ctx.fillStyle = g; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2); },
      floor(ix, iy, rad, col, a) { if (a <= 0.01) return; ctx.save(); ctx.translate(m.sx(ix), m.sy(iy)); ctx.scale(1, 0.28); const rr = rad * s, g = ctx.createRadialGradient(0, 0, 0, 0, 0, rr); g.addColorStop(0, 'rgba(' + col + ',' + a + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); ctx.fillStyle = g; ctx.fillRect(-rr, -rr, rr * 2, rr * 2); ctx.restore(); },
      add(f) { ctx.globalCompositeOperation = 'lighter'; f(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; },
      lamp(i) { return o.quiet ? 1 : 0.84 + 0.16 * Math.sin(t * 11 + i * 2.3) * Math.sin(t * 4.1 + i); },
      /* janelas: de dia vidro escurecido; ao entardecer acendem, com tremor */
      wins(list) {
        const on = T.on, fl = T.lamp;
        if (on < 0.98) { ctx.fillStyle = 'rgba(34,32,58,' + (0.55 * (1 - on)).toFixed(3) + ')'; for (const w of list) T.fr(w[0], w[1], w[2], w[3]); }
        if (on > 0.04) T.add(() => { for (let i = 0; i < list.length; i++) { const w = list[i], f = fl(i); ctx.fillStyle = 'rgba(255,208,100,' + (0.5 * on * f).toFixed(3) + ')'; T.fr(w[0], w[1], w[2], w[3]); T.glow(w[0] + w[2] / 2, w[1] + w[3] / 2, 6 + w[2] * 0.9 + 3 * on, '255,190,80', 0.42 * on * f); } });
      },
      puffs(ix, iy, n, life, a, dark, rise, drift) {
        if (quiet) return; n = Math.max(1, Math.ceil(n * T.third)); const pal = C.puff[dark ? 1 : 0];
        for (let i = 0; i < n; i++) {
          const ag = ((t + i * life / n) % life) / life, cyc = Math.floor((t + i * life / n) / life), sz = Math.min(3, (ag * 4.2) | 0);
          const x = ix + (hs(cyc, i, 4) - 0.5) * 3 + Math.sin(ag * 5 + i * 2.1) * 2 + ag * drift, y = iy - ag * rise - PUFF[sz] / 2;
          ctx.globalAlpha = Math.min(1, ag * 7) * Math.pow(1 - ag, 1.3) * a; T.dr(pal[sz], Math.round(x - PUFF[sz] / 2), Math.round(y));
        }
        ctx.globalAlpha = 1;
      },
      worker(w, x, y, pose, flip) { ctx.fillStyle = 'rgba(20,14,28,0.35)'; ctx.beginPath(); ctx.ellipse(m.sx(x), m.sy(y), 6.5 * kx, 1.9 * ky, 0, 0, TAU); ctx.fill(); try { w.draw(ctx, m.sx(x), m.sy(y), { pose, flip: !!flip, alpha: 1 }); } catch (e) {} ctx.imageSmoothingEnabled = false; },
      spark(x, y, ph, col) { const a = Math.sin(ph * Math.PI); if (ph < 0 || ph > 1 || a < 0.05) return; ctx.globalAlpha = a; ctx.fillStyle = col || '#fff4c0'; T.fr(x, y, 1, 1); if (a > 0.5) { ctx.globalAlpha = a * 0.7; T.fr(x - 1, y, 3, 1); T.fr(x, y - 1, 1, 3); } ctx.globalAlpha = 1; }
    };
    return T;
  }
  const staffs = (o, dmg) => { const W = o.workers || {}; return dmg ? {} : { main: W.main, help: W.helper }; };

  /* =========================================================== CIDADELA */
  function cidadela(ctx, m, t, o) {
    if (!C) init();
    const T = tools(ctx, m, o, t), { fr, dr, glow } = T, tq = T.tq, nt = T.nt, on = T.on, quiet = T.quiet;
    const S = staffs(o, T.dmg);
    /* estandartes reais tremulando */
    const fi = ph => quiet ? 0 : ((t * 8 + ph) | 0) % 12;
    dr(C.flag.cit[fi(0)], 24, 20); dr(C.flag.cit[fi(4)], 53, 13); dr(C.flag.cit[fi(8)], 83, 21);
    /* janelas */
    T.wins([[22, 54, 3, 6], [32, 65, 2, 4.5], [71, 65, 2, 4.5], [81, 54, 3, 6], [12.5, 76.5, 2.5, 5.5], [26, 84, 4, 7], [75, 84, 4, 7], [90, 77, 2.5, 5.5], [51.5, 51.5, 2, 4.5]]);
    /* brilho dourado nas cúpulas e coroa */
    T.add(() => {
      const pu = quiet ? 0.7 : 0.6 + 0.4 * Math.sin(t * 1.3);
      glow(52, 40, 10, '255,210,90', (0.1 + 0.12 * pu + 0.1 * on) * (T.dmg ? 0.4 : 1));
      glow(52.5, 73.5, 12, '255,205,80', (0.08 + 0.1 * pu + 0.1 * on) * (T.dmg ? 0.4 : 1));
      if (!quiet && !T.dmg) { const sw = (tq * 0.22) % 1; if (sw < 0.4) { const x = 46 + sw / 0.4 * 14; ctx.globalAlpha = 0.3 * Math.sin(sw / 0.4 * Math.PI); ctx.fillStyle = '#c8d6ff'; fr(x, 66, 2, 23); ctx.globalAlpha = 1; if (x > 48 && x < 57) { ctx.fillStyle = '#fff2b0'; ctx.globalAlpha = 0.6; fr(x, 70, 2, 7); ctx.globalAlpha = 1; } } }
      if (!quiet && !T.dmg) { const P = [[52, 13, 0.0], [23, 21, 0.31], [82, 21, 0.62], [52, 41, 0.17]]; for (let i = 0; i < 4; i++) T.spark(P[i][0] - 0.5, P[i][1], ((t * 0.45 + P[i][2]) % 1.6) / 0.35); }
    });
    T.floor(53, 108, 30, '255,200,110', 0.3 * on);
    /* equipe real: Rosa escreve no pergaminho; Soraia conta moedas */
    if (S.main) {
      const RX = 36, SY = 108;
      T.worker(S.main, RX, SY, quiet ? 'idle0' : (Math.floor(t * 1.7) % 2 ? 'idle1' : 'idle0'), false);
      ctx.fillStyle = '#6a4326'; fr(41, 102, 1, 6); fr(44.5, 102, 1, 6); ctx.fillStyle = '#8a5c34'; fr(40, 100.5, 7, 2);
      ctx.fillStyle = '#f2e8cc'; fr(40.5, 98.5, 6, 2.4); ctx.fillStyle = '#d6c79a'; fr(40.5, 100.4, 6, 0.8);
      const wr = quiet ? 3 : (tq % 7) / 7 * 4.4;   // linhas de tinta crescendo
      ctx.fillStyle = '#3a2a40'; fr(41, 99, Math.min(4.4, wr), 0.7); if (wr > 2.2) fr(41, 100, wr - 2.2, 0.6);
      const qa = quiet ? 0 : Math.sin(t * 6), qx = 41 + (quiet ? 3 : wr);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, T.s * 0.8); ctx.beginPath(); ctx.moveTo(m.sx(qx), m.sy(99.2 + qa * 0.3)); ctx.lineTo(m.sx(qx + 2.8), m.sy(95.5 + qa * 0.5)); ctx.stroke();
      ctx.fillStyle = '#c9b8e0'; fr(qx + 2, 95.4, 1.5, 1);
    }
    if (S.help) {
      const SX = 70, cx = 63, tb = 103;
      T.worker(S.help, SX, SY2(), quiet ? 'idle0' : (Math.floor(t * 1.2) % 2 ? 'idle1' : 'idle0'), true);
      ctx.fillStyle = '#6a4326'; fr(cx - 1, tb, 7, 1.8); fr(cx - 0.5, tb + 1.8, 1, 4); fr(cx + 4.5, tb + 1.8, 1, 4);
      const stk = (x, n) => { for (let i = 0; i < n; i++) { ctx.fillStyle = i % 2 ? '#e3b13a' : '#f3cd55'; fr(x, tb - 1 - i, 2, 1); } };
      stk(cx, 3); stk(cx + 2.4, 2);
      if (!quiet) {
        const P = 1.8, ph = (t % P) / P, cyc = Math.floor(t / P);
        if (ph < 0.7) { const e = ph / 0.7, x = cx + 0.6 + (cyc % 2 ? 1 : -1) * (1 - e) * 0 + e * 2.4 * (cyc % 2 ? -1 : 1) * -1 + (cyc % 2 ? 0 : 0), y = tb - 5 - Math.sin(e * Math.PI) * 6 + e * 2; ctx.fillStyle = '#ffd54a'; fr(x, y, 1.6, 1.6); T.add(() => { ctx.fillStyle = '#fff4b8'; ctx.globalAlpha = 0.8 * Math.sin(e * Math.PI); fr(x - 0.4, y - 0.4, 0.8, 0.8); ctx.globalAlpha = 1; }); }
        T.add(() => glow(cx + 2, tb - 2, 5, '255,210,80', 0.18 + 0.14 * Math.sin(t * 5)));
      }
    }
    function SY2() { return 108; }
  }
  cidadela.staffInArt = true;

  /* =========================================================== GUILDA */
  function guilda(ctx, m, t, o) {
    if (!C) init();
    const T = tools(ctx, m, o, t), { fr, glow } = T, tq = T.tq, nt = T.nt, on = T.on, quiet = T.quiet, dmg = T.dmg;
    const S = staffs(o, dmg);
    T.wins([[16.5, 74.5, 4.5, 5.5], [48.5, 90, 4, 5.5], [83.5, 76.5, 4, 5], [74.5, 80, 3.5, 3]]);
    /* lanternas */
    const LAN = [[33, 87], [68, 87], [85, 79]];
    for (let i = 0; i < LAN.length; i++) { const f = T.lamp(i + 3); T.add(() => glow(LAN[i][0], LAN[i][1], 8 + 7 * on, '255,185,80', (0.12 + 0.5 * on) * f * (dmg ? 0.4 : 1))); }
    T.floor(52, 108, 30, '255,190,100', 0.32 * on);
    /* quadro de contratos com papéis balançando */
    ctx.fillStyle = '#3e2616'; fr(81.5, 86, 11.5, 14.5); ctx.fillStyle = '#b3844a'; fr(82.5, 87, 9.5, 12.5); ctx.fillStyle = '#c59a5c'; fr(82.5, 87, 9.5, 1);
    const PP = [[83, 88.5, '#efe6cc'], [87.5, 88, '#d9c79a'], [84, 93.5, '#f2e4c0'], [88.5, 93.2, '#d2dcc4'], [85.7, 97.2, '#e8d9b0']];
    for (let i = 0; i < PP.length; i++) {
      const sw = quiet ? 0 : Math.sin(t * 1.9 + i * 1.7) * 0.7 + (Math.sin(t * 0.6 + i * 2.4) > 0.85 ? Math.sin(t * 9 + i) * 0.9 : 0);
      ctx.fillStyle = PP[i][2]; fr(PP[i][0] + sw, PP[i][1], 3, 2); fr(PP[i][0] + sw * 0.4, PP[i][1] + 2, 3, 2);
      ctx.fillStyle = '#7a4a2a'; fr(PP[i][0] + 1, PP[i][1] - 0.2, 1, 1);
    }
    /* brilho nas espadas cruzadas e no troféu de cervo */
    if (!quiet && !dmg) T.add(() => {
      const ph = (tq % 3.6) / 0.9; if (ph < 1) { glow(51.5, 70, 8, '255,255,255', 0.4 * Math.sin(ph * Math.PI)); T.spark(51, 69.5, ph, '#ffffff'); }
      const p2 = ((tq + 1.7) % 4.4) / 1.0; if (p2 < 1) { const x = 46 + p2 * 12; ctx.globalAlpha = 0.5 * Math.sin(p2 * Math.PI); ctx.fillStyle = '#fff2c8'; fr(x, 47 + (1 - Math.abs(p2 - 0.5) * 2) * 2, 1, 4); ctx.globalAlpha = 1; }
    });
    T.puffs(21, 37, dmg ? 3 : 2, 4.6, dmg ? 0.7 : 0.35, dmg, 22, 7);
    if (S.main) {
      /* Bento à porta; de vez em quando olha o quadro */
      const ph = (tq % 12), flip = ph > 8 && ph < 11;
      T.worker(S.main, 51, 108, quiet ? 'idle0' : (ph > 8.3 && ph < 8.9 ? 'atk0' : Math.floor(t * 1.1) % 2 ? 'idle1' : 'idle0'), flip);
    }
  }
  guilda.staffInArt = true;

  /* =========================================================== TORRE */
  function torre(ctx, m, t, o) {
    if (!C) init();
    const T = tools(ctx, m, o, t), { fr, dr, glow } = T, tq = T.tq, nt = T.nt, on = T.on, quiet = T.quiet, dmg = T.dmg;
    const S = staffs(o, dmg);
    dr(C.flag.tor[quiet ? 0 : ((t * 8) | 0) % 12], 53, 0);
    T.wins([[39.5, 66, 2, 5], [62.5, 66, 2, 5], [50, 69.5, 4.5, 8], [50, 86, 4.5, 11]]);
    /* lampião do mirante + feixe varrendo o horizonte à noite */
    const f = T.lamp(1);
    T.add(() => {
      glow(52, 40, 11 + 6 * on, '255,190,80', (0.2 + 0.5 * on) * f * (dmg ? 0.35 : 1));
      if (on > 0.15 && !quiet) { const a = Math.sin(t * 0.55), x = m.sx(52), y = m.sy(40), L = 70 * T.s, g = ctx.createLinearGradient(x, y, x + a * L, y); g.addColorStop(0, 'rgba(255,215,130,' + (0.32 * on) + ')'); g.addColorStop(1, 'rgba(255,215,130,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y - 1.5 * T.s); ctx.lineTo(x + a * L, y - 9 * T.s); ctx.lineTo(x + a * L, y + 9 * T.s); ctx.lineTo(x, y + 1.5 * T.s); ctx.fill(); }
    });
    T.floor(52, 108, 26, '255,190,100', 0.28 * on);
    /* fogueira de sinal no canto da ameia */
    {
      const BX = 76.5, BY = 46, big = dmg ? 0 : 1, fi = quiet ? 0 : (hs(Math.floor(t * 10), 5) * 8) | 0;
      ctx.fillStyle = '#2c2634'; fr(BX - 3, BY - 2, 6, 2); ctx.fillStyle = '#4a4252'; fr(BX - 3.5, BY - 3, 7, 1); fr(BX - 1, BY, 2, 1.5);
      if (!dmg) {
        dr(C.fire[fi], BX - 4.5, BY - 13);
        T.add(() => { ctx.globalAlpha = 0.35; dr(C.fire[(fi + 3) % 8], BX - 4.5, BY - 14); ctx.globalAlpha = 1; glow(BX, BY - 6, 11 + 5 * on, '255,140,50', (0.2 + 0.35 * on) * (quiet ? 0.9 : 0.85 + 0.15 * Math.sin(t * 17))); });
        T.puffs(BX, BY - 12, 3, 3.4, 0.55 - 0.2 * on, false, 24, 6);
      } else { ctx.fillStyle = '#ff7a24'; fr(BX - 0.5, BY - 4, 1, 1); }
    }
    if (S.main) {
      /* Úrsula de vigia com a luneta, varrendo o horizonte */
      const P = 12, ph = tq % P, dirR = ph < 6, ux = dirR ? 46 : 58, ease = ph < 6 ? ph / 6 : (ph - 6) / 6, sway = Math.sin(ease * Math.PI) * 0;
      const x = quiet ? 50 : (dirR ? 45 + 12 * (0.5 - 0.5 * Math.cos(ease * Math.PI)) : 57 - 12 * (0.5 - 0.5 * Math.cos(ease * Math.PI)));
      const walking = !quiet && ((ease < 0.1) || (ease > 0.9));
      const pose = quiet ? 'idle0' : (Math.floor(t * 1.2) % 2 ? 'idle1' : 'idle0');
      T.worker(S.main, x + sway, 47, pose, !dirR);
      m.blit(ctx, 28, 45, 50, 7);    // ameias passam à frente dos pés
      ctx.strokeStyle = '#2a1e16'; ctx.lineWidth = Math.max(1.5, T.s * 1.5); ctx.beginPath(); ctx.moveTo(m.sx(x + (dirR ? 2 : -2)), m.sy(33.5)); ctx.lineTo(m.sx(x + (dirR ? 9 : -9)), m.sy(30 - Math.sin(t * 0.7) * 0.6)); ctx.stroke();
      ctx.strokeStyle = '#d4a94a'; ctx.lineWidth = Math.max(1, T.s * 0.9); ctx.beginPath(); ctx.moveTo(m.sx(x + (dirR ? 2 : -2)), m.sy(33.5)); ctx.lineTo(m.sx(x + (dirR ? 8 : -8)), m.sy(30.4 - Math.sin(t * 0.7) * 0.6)); ctx.stroke();
    }
  }
  torre.staffInArt = true;

  /* =========================================================== TREINO */
  const DUMMY = new WeakMap();
  /* separa o boneco de palha da arte (para ele balançar) e limpa o fundo por baixo */
  function dummyKit(m, ctx) {
    let cap = null; m.blit({ drawImage: (...a) => { cap = a; } }, 13, 66, 22, 26); if (!cap) return null;
    const src = cap[0], key = src, sx = Math.round(cap[1]), sy = Math.round(cap[2]), sw = Math.round(cap[3]), sh = Math.round(cap[4]), tag = sx + ',' + sy + ',' + sw + ',' + sh;
    const hit = DUMMY.get(key); if (hit && hit.tag === tag) return hit.v;
    let v = null;
    try {
      const tmp = mk(sw, sh); tmp.x.drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh);
      const im = tmp.x.getImageData(0, 0, sw, sh), d = im.data, q = sw / 22, mask = new Uint8Array(sw * sh);
      const px = (x, y) => { const i = (y * sw + x) * 4; return [d[i], d[i + 1], d[i + 2], d[i + 3]]; };
      for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
        const lx = x / q, ly = y / q, p = px(x, y); if (p[3] < 100 || lx > 19.5) continue;
        if (p[0] > 165 && p[1] > 110 && p[2] < 125 && p[0] - p[2] > 60) mask[y * sw + x] = 1;
        else if (lx > 8.5 && lx < 14 && ly > 17 && !(p[0] > 215 && p[2] > 140)) mask[y * sw + x] = 1;
      }
      const m2 = mask.slice();
      for (let y = 1; y < sh - 1; y++) for (let x = 1; x < sw - 1; x++) if (!mask[y * sw + x] && x / q < 19.5) { const p = px(x, y); if (p[0] + p[1] + p[2] < 330 && (mask[y * sw + x - 1] || mask[y * sw + x + 1] || mask[(y - 1) * sw + x] || mask[(y + 1) * sw + x])) m2[y * sw + x] = 1; }
      const dv = mk(sw, sh), pt = mk(sw, sh), di = dv.x.createImageData(sw, sh), pi = tmp.x.getImageData(0, 0, sw, sh);
      for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
        const i = (y * sw + x) * 4;
        if (m2[y * sw + x]) { for (let c = 0; c < 4; c++) di.data[i + c] = d[i + c];
          const bx = Math.min(sw - 1, Math.round((y / q < 7.5 ? 5 : 21) * q)), j = (y * sw + bx) * 4; for (let c = 0; c < 4; c++) pi.data[i + c] = d[j + c]; }
      }
      dv.x.putImageData(di, 0, 0); pt.x.putImageData(pi, 0, 0); v = { dv: dv.cv, pt: pt.cv };
    } catch (e) { v = null; }
    DUMMY.set(key, { tag, v }); return v;
  }
  function treino(ctx, m, t, o) {
    if (!C) init();
    const T = tools(ctx, m, o, t), { fr, dr, glow } = T, tq = T.tq, nt = T.nt, on = T.on, quiet = T.quiet, dmg = T.dmg, s = T.s;
    const S = staffs(o, dmg), day = o.hour >= 6 && o.hour < 20;
    /* estandartes nos mastros */
    const bi = ph => quiet ? 0 : ((t * 7 + ph) | 0) % 12;
    dr(C.ban.l[bi(0)], 19, 37); dr(C.ban.r[bi(5)], 74.5, 37);
    /* tochas nos topos dos mastros */
    for (let i = 0; i < 2; i++) { const X = i ? 86 : 19, fi = quiet ? 0 : ((hs(Math.floor(t * 10), 7 + i) * 8) | 0); if (!dmg && (on > 0.05 || true)) { const sc = 0.55 + 0.45 * on; ctx.globalAlpha = Math.min(1, sc + 0.2); dr(C.fireS[fi], X - 2.5, 24.5); ctx.globalAlpha = 1; T.add(() => glow(X, 29, 8 + 8 * on, '255,160,60', (0.1 + 0.45 * on) * T.lamp(i))); } }
    T.floor(52, 96, 34, '255,190,100', 0.26 * on);
    /* flechas cravando nos alvos */
    const TG = [[36.5, 65], [53, 65], [71, 65]];
    if (day && !dmg) for (let i = 0; i < 3; i++) {
      const Pd = 7.2 + i * 1.3, tt = quiet ? 2 + i : t + i * 2.9 + 1, ph = tt % Pd, cyc = Math.floor(tt / Pd), jx = (hs(cyc, i, 3) - 0.5) * 4, jy = (hs(cyc, i, 4) - 0.5) * 4, tx = TG[i][0] + jx, ty = TG[i][1] + jy;
      if (ph < 0.2) { const e = ph / 0.2, sx0 = tx - 9 + i * 4, sy0 = 100, x = sx0 + (tx - sx0) * e, y = sy0 + (ty - sy0) * e - Math.sin(e * Math.PI) * 6, x2 = x - (tx - sx0) * 0.09, y2 = y - (ty - sy0) * 0.09 + 0.6; ctx.strokeStyle = '#e8d9b0'; ctx.lineWidth = Math.max(1, s * 0.8); ctx.beginPath(); ctx.moveTo(m.sx(x), m.sy(y)); ctx.lineTo(m.sx(x2), m.sy(y2)); ctx.stroke(); }
      else if (ph < 6.2) {
        const age = ph - 0.2, wob = Math.exp(-age * 5) * Math.cos(age * 30) * 0.9, a = ph > 5.4 ? 1 - (ph - 5.4) / 0.8 : 1; ctx.globalAlpha = a;
        ctx.strokeStyle = '#d9c9a0'; ctx.lineWidth = Math.max(1, s * 0.8); ctx.beginPath(); ctx.moveTo(m.sx(tx), m.sy(ty)); ctx.lineTo(m.sx(tx + 2.3 + wob), m.sy(ty + 4.5)); ctx.stroke();
        ctx.fillStyle = '#c4382e'; fr(tx + 2 + wob, ty + 4.2, 1.6, 1.6); ctx.globalAlpha = 1;
        if (age < 0.25) T.add(() => { glow(tx, ty, 5, '255,240,200', 0.5 * (1 - age / 0.25)); });
      }
    }
    /* Vasco golpeia o boneco de palha */
    const DX = 24.5, DY = 90;
    let age = 99, idx = -1, cyc = 0, pose = 'idle0', hitAge = 99;
    if (S.main && !quiet) {
      const CY = 10; cyc = Math.floor(t / CY); const tt = t - cyc * CY; idx = Math.floor(tt - 0.58); age = idx >= 0 ? tt - (idx + 0.58) : tt + CY - 5.58; if (idx < 0) { idx = 5; cyc--; } if (idx > 5) idx = 5; if (idx === 5 && tt >= 6.58 || tt >= 6) age = tt - 5.58;
      if (tt < 6) { const f = tt - Math.floor(tt); pose = f < 0.35 ? 'atk0' : f < 0.5 ? 'atk1' : f < 0.7 ? 'atk2' : 'atk0'; if (f > 0.75) pose = 'idle0'; } else pose = Math.floor(t * 1.3) % 2 ? 'idle1' : 'idle0';
      hitAge = age;
    }
    const kit = dummyKit(m, ctx);
    if (kit && S.main && !quiet && age < 2.2) {
      const ang = -0.13 * Math.exp(-age * 2.4) * Math.cos(age * 10.5), kxs = T.kx, kys = T.ky;
      ctx.drawImage(kit.pt, 0, 0, kit.pt.width, kit.pt.height, Math.round(m.sx(13)), Math.round(m.sy(66)), Math.round(22 * kxs), Math.round(26 * kys));
      ctx.save(); ctx.translate(m.sx(DX), m.sy(DY)); ctx.rotate(ang); ctx.translate(-m.sx(DX), -m.sy(DY));
      ctx.drawImage(kit.dv, 0, 0, kit.dv.width, kit.dv.height, Math.round(m.sx(13)), Math.round(m.sy(66)), Math.round(22 * kxs), Math.round(26 * kys)); ctx.restore();
    }
    if (S.main) T.worker(S.main, 38, 91.5, quiet ? 'atk0' : pose, true);
    if (S.main && !quiet && hitAge < 0.6) {
      const seed = idx + cyc * 13, N = Math.max(2, Math.ceil(6 * T.third));
      if (hitAge < 0.12) T.add(() => glow(27, 77, 6, '255,235,170', 0.6 * (1 - hitAge / 0.12)));
      for (let i = 0; i < N; i++) {
        const a = -Math.PI * (0.55 + 0.9 * hs(seed, i, 1)) + 0.4, v = 11 + 14 * hs(seed, i, 2), e = hitAge / 0.6;
        ctx.globalAlpha = 1 - e; ctx.fillStyle = i % 2 ? '#e8c35a' : '#cfa040';
        fr(25 + Math.cos(a) * v * hitAge - 2, 77 + Math.sin(a) * v * hitAge + 28 * hitAge * hitAge, i % 3 === 0 ? 2 : 1, 1);
      }
      ctx.globalAlpha = 1;
    }
    /* palha solta no chão: grãos que flutuam */
    if (!quiet && !dmg) { const N = Math.max(1, Math.ceil(2 * T.third)); for (let i = 0; i < N; i++) { const P = 4 + i * 1.3, tt = t + i * 2.1, ag = (tt % P) / P, cy = Math.floor(tt / P); ctx.globalAlpha = Math.sin(ag * Math.PI) * 0.8; ctx.fillStyle = '#e8c35a'; fr(30 + hs(cy, i, 1) * 26 + ag * 6, 86 - ag * 7, 1.4, 1); } ctx.globalAlpha = 1; }
    /* brilho nas espadas cruzadas e nas lanças */
    if (!quiet && !dmg) T.add(() => { const ph = (tq % 4) / 0.8; if (ph < 1) { glow(52, 100, 6, '255,255,255', 0.35 * Math.sin(ph * Math.PI)); T.spark(52, 99.5, ph, '#fff'); } T.spark(92.5, 54 + ((tq * 0.7) % 1) * 2, ((tq + 2) % 5) / 0.7, '#fff'); });
  }
  treino.staffInArt = true;

  /* =========================================================== ENFERMARIA */
  function enfermaria(ctx, m, t, o) {
    if (!C) init();
    const T = tools(ctx, m, o, t), { fr, glow } = T, tq = T.tq, nt = T.nt, on = T.on, quiet = T.quiet, dmg = T.dmg;
    const S = staffs(o, dmg);
    T.wins([[16.5, 82, 5, 9], [64, 83, 3, 8], [75.5, 82.5, 6, 9], [41.2, 33.5, 3.4, 5]]);
    /* cruz verde brilhando suave */
    const pu = quiet ? 0.6 : 0.5 + 0.5 * Math.sin(t * 1.6);
    T.add(() => {
      const a = (0.12 + 0.16 * pu + 0.22 * on) * (dmg ? 0.35 : 1);
      glow(43, 75, 13, '110,235,150', a);
      ctx.fillStyle = 'rgba(160,255,190,' + (a * 0.8).toFixed(3) + ')'; fr(41, 69.5, 4, 11); fr(38, 73, 10, 4);
      if (!quiet && !dmg) for (let i = 0; i < Math.max(1, Math.ceil(3 * T.third)); i++) { const P = 3.4 + i * 0.8, tt = t + i * 1.3, ag = (tt % P) / P, cy = Math.floor(tt / P); ctx.globalAlpha = Math.sin(ag * Math.PI) * 0.9; ctx.fillStyle = '#c8ffd8'; fr(37 + hs(cy, i, 2) * 12, 80 - ag * 14, 1, 1); fr(37.4 + hs(cy, i, 2) * 12 - 0.6, 80 - ag * 14 + 0.3, 2, 0.4); }
    });
    ctx.globalAlpha = 1;
    /* sino da torrinha */
    if (!quiet && !dmg) { const ph = tq % 14; if (ph < 1.6) { const e = ph / 1.6, k = Math.sin(ph * 14) * (1 - e); ctx.strokeStyle = 'rgba(255,225,140,' + (0.8 * (1 - e)).toFixed(2) + ')'; ctx.lineWidth = Math.max(1, T.s * 0.7); for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(m.sx(43 + sd * 0.2), m.sy(36), (3.5 + e * 5) * T.s, sd < 0 ? Math.PI * 0.7 : -Math.PI * 0.3, sd < 0 ? Math.PI * 1.3 : Math.PI * 0.3); ctx.stroke(); } ctx.fillStyle = '#ffd35a'; fr(43 + k * 0.8, 36.2, 1, 1); } }
    T.puffs(72, 40, dmg ? 3 : 2, 4.8, dmg ? 0.7 : 0.38, dmg, 20, 6);
    T.floor(43, 108, 28, '255,200,110', 0.3 * on);
    /* borboletas nas floreiras */
    if (!quiet && !dmg && nt < 0.45) { const n = o.light ? 1 : 2; for (let i = 0; i < n; i++) { const a = t * (0.6 + i * 0.2) + i * 3, x = (i ? 78 : 20) + Math.sin(a) * 9, y = 94 - 4 + Math.sin(a * 1.7 + i) * 4, w = Math.sin(t * 22 + i) > 0 ? 2 : 1; ctx.fillStyle = i ? '#f4b8d0' : '#fff2a0'; fr(x - w / 2, y, w, 1.3); ctx.fillStyle = '#4a3040'; fr(x, y + 0.2, 0.7, 1); } }
    if (S.main) {
      const OX = 27, mortar = !quiet && (tq % 9) > 5.5;
      T.worker(S.main, OX, 108, quiet ? 'idle0' : mortar ? (Math.floor(t * 3.4) % 2 ? 'atk0' : 'idle0') : (Math.floor(t * 1.1) % 2 ? 'idle1' : 'idle0'), false);
      /* bancada: ervas, bandagens, chá fumegando */
      ctx.fillStyle = '#6a4326'; fr(31, 101.5, 9, 1.8); fr(31.8, 103.3, 1, 4.7); fr(38, 103.3, 1, 4.7);
      ctx.fillStyle = '#f4efe2'; fr(31.8, 99.2, 2.6, 2.3); ctx.fillStyle = '#cfc8b4'; fr(31.8, 100.6, 2.6, 0.7);
      ctx.fillStyle = '#4f8a42'; fr(35, 99.8, 3.4, 1.7); ctx.fillStyle = '#6fb05a'; fr(35.4, 99.4, 1.6, 0.8); ctx.fillStyle = '#d65a7a'; fr(37.2, 99.4, 1, 1);
      ctx.fillStyle = '#e9e4d8'; fr(38.4, 99.5, 2, 2); ctx.fillStyle = '#7a5030'; fr(38.6, 99.5, 1.6, 0.6);
      if (!quiet) for (let i = 0; i < Math.max(1, Math.ceil(3 * T.third)); i++) { const ag = ((t * 0.5 + i / 3) % 1), x = 39.3 + Math.sin(ag * 7 + i * 2) * 1.4, y = 98.8 - ag * 9; ctx.globalAlpha = Math.sin(ag * Math.PI) * 0.55; ctx.fillStyle = '#f2f6f0'; fr(x, y, 1.4, 1.4); }
      ctx.globalAlpha = 1;
    }
  }
  enfermaria.staffInArt = true;

  Object.assign(G.A.BuildingArt, { cidadela, guilda, torre, treino, enfermaria });
})();
