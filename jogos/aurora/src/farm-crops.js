/* Aurora · Plantação da Fazenda (arte 2×, vento, vida no campo). Substitui G.R.groundMore. */
(function () {
  'use strict';
  if (typeof G === 'undefined' || G.HEADLESS || !G.R || !G.life) return;
  const R = G.R, A = G.A, L = G.life, Pix = A.Pix, TS = 16, AT = 32 /* px de arte por tile */;
  if (!R.groundMore || !Pix || !A.mk) return;
  const orig = R.groundMore;
  if (orig.__farm) return;

  /* ---------- utilidades determinísticas ---------- */
  const hh = (a, b) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const fr = (x) => x - Math.floor(x);
  const mq = (typeof matchMedia === 'function') ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  const reduced = () => !!(G.S.opts.reduceMotion || (mq && mq.matches));
  const rell = (p, cx, cy, rx, ry, ang, c) => {
    const ca = Math.cos(ang), sa = Math.sin(ang), M = Math.ceil(Math.max(rx, ry)) + 1;
    for (let y = -M; y <= M; y++) for (let x = -M; x <= M; x++) {
      const u = (x * ca + y * sa) / rx, w = (-x * sa + y * ca) / ry;
      if (u * u + w * w <= 1) p.set(Math.round(cx + x), Math.round(cy + y), c);
    }
  };
  const art = (rows, pal) => {
    const w = Math.max(...rows.map(r => r.length)), p = new Pix(w, rows.length);
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = pal[r[x]]; if (c) p.set(x, y, c); } });
    return p;
  };

  /* ---------- terra arada (tile 32×32, fileiras e torrões) ---------- */
  const soilCache = {};
  const soilSp = (wet, mask, v) => {
    const key = wet * 1000 + mask * 10 + v; if (soilCache[key]) return soilCache[key];
    const p = new Pix(AT, AT);
    const P = wet
      ? { l: '#6e4e3c', b: '#4e3326', s: '#3a261c', t: '#2a1a14', m: '#35231a', c1: '#7c5a46', c2: '#2c1c15' }
      : { l: '#b08050', b: '#8a5c34', s: '#6a4428', t: '#4a2e1c', m: '#5c3a24', c1: '#c49462', c2: '#4e3120' };
    for (let y = 0; y < AT; y++) {
      const m = y % 8, rowc = m === 0 ? P.l : m < 4 ? P.b : m === 4 ? P.s : m === 7 ? P.m : P.t;
      for (let x = 0; x < AT; x++) {
        let c = rowc; const r = hh(x + v * 37, y + 5);
        if (m < 5 && r < 0.10) c = P.l; else if (m < 5 && r > 0.93) c = P.s; else if (m >= 5 && r < 0.08) c = P.s;
        p.set(x, y, c);
      }
    }
    /* torrões */
    for (let i = 0; i < 7; i++) {
      const cx = 1 + ((hh(i, v + 11) * 28) | 0), cy = (((hh(i, v + 3) * 4) | 0) * 8) + 1 + ((hh(i, v + 7) * 2) | 0), big = hh(i, 99) > 0.55;
      p.rect(cx, cy, big ? 3 : 2, big ? 2 : 1, P.c1); p.set(cx + (big ? 3 : 2), cy + 1, P.c2); p.row(cx, cx + (big ? 2 : 1), cy + (big ? 2 : 1), P.c2);
    }
    if (!wet) for (let i = 0; i < 3; i++) p.set(2 + ((hh(i, v + 21) * 28) | 0), 5 + 8 * ((hh(i, v + 23) * 4) | 0), '#d8c49a');
    else {
      /* brilho de água nos sulcos */
      for (let k = 0; k < 4; k++) for (let i = 0; i < 2; i++) {
        const x0 = ((hh(k * 2 + i, v + 31) * 24) | 0) + 1, ln = 3 + ((hh(k, i + v) * 4) | 0);
        p.row(x0, x0 + ln, k * 8 + 5, '#86b4cc'); p.row(x0 + 1, x0 + ln - 1, k * 8 + 6, '#4f7490');
        p.set(x0 + 1, k * 8 + 5, '#dff4ff');
      }
      for (let k = 0; k < 4; k++) { const x = ((hh(k, v + 41) * 28) | 0) + 1; p.set(x, k * 8, '#9c7a64'); p.set(x + 1, k * 8, '#9c7a64'); }
    }
    /* borda: sombra do terreno e capim invadindo */
    const edge = (side) => {
      for (let i = 0; i < AT; i++) {
        const r = hh(i + side * 40, v + 13), len = r < 0.35 ? 0 : r < 0.7 ? 2 : r < 0.9 ? 3 : 4;
        for (let d = 0; d < len; d++) {
          const c = d === len - 1 ? '#9ad862' : d === 0 ? '#3f7d2c' : '#5fa83a';
          if (side === 0) p.set(i, d, c); else if (side === 2) p.set(i, AT - 1 - d, c); else if (side === 3) p.set(d, i, c); else p.set(AT - 1 - d, i, c);
        }
      }
    };
    if (!(mask & 1)) edge(0);
    if (!(mask & 4)) { p.row(0, AT - 1, AT - 2, wet ? '#241510' : '#3a2416'); edge(2); }
    if (!(mask & 8)) edge(3);
    if (!(mask & 2)) edge(1);
    return (soilCache[key] = p.canvas());
  };

  /* ---------- plantas (sprite 36×50: tile ocupa x 2..33, y 18..49) ---------- */
  const PW = 36, PH = 50, OX = 2, OY = 18, NF = 6;
  const plantCache = {};
  const leanOf = (ph, bx, by, amp, tilt) => tilt + amp * Math.sin(6.2832 * (ph - 0.12 * bx / 32 - 0.05 * by / 32));
  const WP = (bl, lit) => bl
    ? { stem: '#7a6a40', stemD: '#5e5030', ear: '#a89058', earL: '#bfae78', earD: '#7c6838', tip: '#c8b888', awn: '#9a8a60', leaf: '#8a7a3c', leaf2: '#a89a58' }
    : lit
      ? { stem: '#d8b848', stemD: '#b08c2c', ear: '#ffd860', earL: '#fff4b8', earD: '#e2a834', tip: '#ffffff', awn: '#fff8d8', leaf: '#a8b840', leaf2: '#d4d860' }
      : { stem: '#c8a23a', stemD: '#9a7628', ear: '#e8b83a', earL: '#ffd95a', earD: '#b8842a', tip: '#fff0a8', awn: '#f4e2a0', leaf: '#8ea838', leaf2: '#bcc84c' };
  const wheatMature = (p, v, ph, bl, lit) => {
    const c = WP(bl, lit);
    for (let row = 0; row < 2; row++) {
      const by = OY + 12 + row * 16;
      for (let x = OX; x < OX + AT; x++) for (let y = by - 12; y <= by; y++) p.set(x, y, bl ? ((x + y) % 3 ? '#7a6a3c' : '#6a5a30') : (x + row) % 3 === 0 ? '#9c7c28' : (x % 3 === 1 ? '#b8962e' : '#c8a63c'));
      for (let x = OX; x < OX + AT; x += 2) { const hgt = 3 + ((hh(x, v + row * 9) * 7) | 0); for (let k = 0; k < hgt; k++) p.set(x, by - 12 - k, (x + k) & 2 ? '#c8a63c' : '#a8862c'); }
      for (let i = 0; i < 6; i++) {
        const cx = OX + Math.round(1.5 + i * 5.6 + row * 2.8 + (hh(i, row + v * 7) - 0.5) * 1.6);
        rell(p, cx - 2, by - 2, 4, 1.8, -0.4, bl ? '#8a7a3c' : '#8ea838'); rell(p, cx + 2, by - 2, 4, 1.8, 0.4 + Math.PI, bl ? '#a89a58' : '#a8c040');
        p.row(cx - 3, cx + 3, by + 1, '#24160e66'); p.row(cx - 2, cx + 2, by + 2, '#24160e44');
        for (let s = 0; s < 3; s++) {
          const o = s === 0 ? -2 : s === 1 ? 2 : 0, bx = cx + o, r = hh(i * 7 + s, row * 3 + v * 11);
          const h = Math.round((bl ? 16 : 21) + r * 6 - (s === 2 ? 0 : 1)), lean = leanOf(ph, bx, by, bl ? 0.8 : 2.6, bl ? 2.4 : 1.2) * (h / 24) + (bl ? 1.5 * (r - 0.5) : 0);
          stalkM(p, bx, by, h, lean, c, bl, r);
        }
      }
    }
    if (lit) for (let k = 0; k < 7; k++) { const x = OX + 2 + ((hh(k, v + 5) * 28) | 0), y = OY - 8 + ((hh(k, v + 9) * 30) | 0); p.set(x, y, '#ffffff'); if (lit > 1) { p.set(x + 1, y, '#fff8c8'); p.set(x, y - 1, '#fff8c8'); } }
  };
  const stalkM = (p, bx, by, h, lean, c, bl, r) => {
    const xs = [];
    for (let i = 0; i <= h; i++) xs[i] = Math.round(bx + lean * Math.pow(i / h, 1.6));
    for (let i = 0; i < h - 7; i++) p.set(xs[i], by - i, i % 3 === 0 ? c.stemD : c.stem);
    const dir = r > 0.5 ? 1 : -1, i0 = 4 + ((r * 5) | 0);
    for (let k = 1; k <= 5; k++) p.set(xs[i0] + dir * k, by - i0 - Math.round(k * 0.8 - k * k * 0.12 - (bl ? k * 0.5 : 0)), k > 3 ? c.leaf2 : c.leaf);
    for (let e = 0; e < 8; e++) {
      const i = h - 8 + e, x = xs[Math.max(0, i)], y = by - i, par = (e + (bx & 1)) & 1;
      p.set(x, y, c.ear); p.set(x - 1, y, par ? c.earL : c.earD); p.set(x + 1, y, par ? c.earD : c.earL);
      if (e === 0) { p.set(x - 1, y, c.earD); p.set(x + 1, y, c.earD); }
    }
    const tx = xs[h], ty = by - h;
    p.set(tx, ty, c.tip);
    p.set(tx, ty - 1, c.awn); p.set(tx - 1, ty - 2, c.awn); p.set(tx + 1, ty - 2, c.awn);
    p.set(tx - 2, ty - 1, c.awn); p.set(tx + 2, ty - 1, c.awn); p.set(tx - 1, ty - 3, c.awn); p.set(tx + 1, ty - 3, c.awn);
    if (bl) { p.set(tx + 1, ty + 1, c.earD); }
  };
  const blade = (p, bx, by, h, lean, c1, c2, curve) => {
    for (let i = 0; i <= h; i++) {
      const u = i / h, x = bx + Math.round(lean * u * u + curve * Math.sin(u * 2.6));
      p.set(x, by - i, i % 4 < 2 ? c1 : c2);
      if (i > h * 0.3 && i < h * 0.85 && !(i & 1)) p.set(x + (curve >= 0 ? 1 : -1), by - i, c1);
    }
  };
  const wheatGrow = (p, v, ph, bl) => {
    const g1 = bl ? '#8a7c44' : '#7cbc3c', g2 = bl ? '#a89a5c' : '#b4d84c', g3 = bl ? '#6a5e34' : '#4e8a2c', yel = bl ? '#b8a468' : '#d8e060';
    for (let row = 0; row < 2; row++) {
      const by = OY + 12 + row * 16;
      for (let i = 0; i < 6; i++) {
        const cx = OX + Math.round(1.5 + i * 5.6 + row * 2.8 + (hh(i, row + v * 7) - 0.5) * 1.6);
        p.row(cx - 3, cx + 3, by + 1, '#24160e55');
        for (let s = 0; s < 4; s++) {
          const r = hh(i * 5 + s, row * 3 + v * 11), bx = cx + (s - 1.5) * 1.5 | 0, h = Math.round((bl ? 7 : 10) + r * 5), lean = leanOf(ph, bx, by, 1.6, bl ? 1.5 : 0.6) * (h / 14);
          blade(p, bx, by, h, lean + (s - 1.5) * 0.9, s & 1 ? g1 : g2, g3, (s - 1.5) * 0.5);
          p.set(Math.round(bx + (lean + (s - 1.5) * 0.9)), by - h - 1, yel);
        }
        const hx = cx, hl = Math.round(leanOf(ph, hx, by, 1.6, 0.6) * 0.9);
        if (!bl) { p.rect(hx + hl, by - 14, 2, 4, '#c8d050'); p.set(hx + hl, by - 15, '#f0e888'); p.set(hx + hl + 1, by - 12, '#9aa838'); }
      }
    }
  };
  const wheatSprout = (p, v, ph, bl) => {
    const g1 = bl ? '#8a7c44' : '#8ad04a', g2 = bl ? '#6a5e34' : '#4e9a2c';
    for (let row = 0; row < 2; row++) {
      const by = OY + 12 + row * 16;
      for (let i = 0; i < 6; i++) {
        const cx = OX + Math.round(2 + i * 5.4 + row * 2.7 + (hh(i, row + v * 7) - 0.5) * 1.4), ln = Math.round(leanOf(ph, cx, by, 0.8, 0));
        p.row(cx - 1, cx + 1, by + 1, '#24160e44');
        blade(p, cx, by, 4, -1 + ln, g1, g2, -0.4); blade(p, cx + 1, by, 6, 1 + ln, g1, g2, 0.4);
        if (!bl && ((i + row) & 1)) blade(p, cx, by, 3, 0, '#b4e860', g2, 0);
      }
    }
  };
  const seeds = (p, v, herb) => {
    for (let row = 0; row < 2; row++) {
      const by = OY + 12 + row * 16;
      for (let i = 0; i < 6; i++) {
        const cx = OX + Math.round(2 + i * 5.4 + row * 2.7 + (hh(i, row + v * 7) - 0.5) * 1.4);
        p.row(cx - 1, cx + 1, by, '#5a3a22'); p.set(cx, by - 1, '#6a4428');
        p.set(cx - 1, by - 1, herb ? '#d8b0f0' : '#f0dca0'); p.set(cx + 1, by, herb ? '#a880c8' : '#c8a460');
        if ((i + row + v) % 3 === 0) { p.set(cx, by - 2, '#8cd050'); p.set(cx + 1, by - 3, '#5ea838'); }
      }
    }
  };
  /* ervas */
  const HP = (bl) => bl
    ? { g1: '#7a7a48', g2: '#9c9c62', g3: '#58582e', fl: '#8e6e5c', fl2: '#b49a84', st: '#6a6a3c' }
    : { g1: '#3f8a3a', g2: '#7fd070', g3: '#2a6428', fl: '#b070e0', fl2: '#e0b4ff', st: '#4a9a3c', fl3: '#8a4cc0' };
  const rosette = (p, cx, by, n, sz, ph, bl, amp) => {
    const c = HP(bl), ln = leanOf(ph, cx, by, amp, 0);
    p.row(cx - sz, cx + sz, by + 1, '#24160e55');
    for (let i = 0; i < n; i++) {
      const a = -Math.PI + (i + 0.5) * Math.PI / n + (bl ? 0.25 * (i % 2 ? 1 : -1) : 0), lx = cx + Math.cos(a) * sz * 0.55 + ln * 0.35 * (-Math.sin(a)), ly = by - 1 - (-Math.sin(a)) * sz * 0.55;
      rell(p, lx, ly, sz * 0.62, Math.max(1.2, sz * 0.32), a + (bl ? 0.3 : 0), c.g3);
      rell(p, lx - 0.3, ly - 0.6, sz * 0.5, Math.max(1, sz * 0.22), a + (bl ? 0.3 : 0), i & 1 ? c.g1 : c.g2);
    }
    rell(p, cx, by - 1, sz * 0.4, sz * 0.3, 0, c.g1); p.set(cx, by - 2, c.g2);
  };
  const herbMature = (p, v, ph, bl) => {
    const c = HP(bl);
    for (let row = 0; row < 2; row++) {
      const by = OY + 13 + row * 16;
      for (let i = 0; i < 3; i++) {
        const cx = OX + Math.round(5 + i * 10.6 + row * 5 + (hh(i, row + v * 7) - 0.5) * 2);
        rosette(p, cx, by, 7, bl ? 6 : 7, ph, bl, 1.4);
        const spikes = [-3, 0, 3];
        for (let s = 0; s < 3; s++) {
          const r = hh(i * 3 + s, row * 5 + v * 13), h = Math.round((bl ? 5 : 9) + r * 5), bx = cx + spikes[s], lean = leanOf(ph, bx, by, 2.2, bl ? 2 : 0.4) * (h / 12);
          const xs = []; for (let k = 0; k <= h; k++) xs[k] = Math.round(bx + lean * Math.pow(k / h, 1.5));
          for (let k = 2; k < h; k++) p.set(xs[k], by - 3 - k + 3, c.st);
          for (let k = Math.max(2, h - 6); k <= h; k++) {
            const x = xs[k], y = by - k, par = (k + s) & 1;
            p.set(x, y, par ? c.fl : c.fl2); p.set(x + (par ? 1 : -1), y, par ? c.fl2 : c.fl);
            if (!bl && ((k + i + s) % 4 === 0)) { p.set(x + 1, y - 1, '#ffffff'); p.set(x, y + 0, '#ffffff'); }
          }
          if (!bl) { p.set(xs[h], by - h - 1, c.fl2); if (!((i + s) & 1)) { p.set(xs[h] - 1, by - h, '#ffffff'); p.set(xs[h], by - h - 2, '#ffffff'); } }
          else p.set(xs[h], by - h - 1, '#6a5648');
        }
      }
    }
  };
  const herbGrow = (p, v, ph, bl) => {
    const c = HP(bl);
    for (let row = 0; row < 2; row++) {
      const by = OY + 13 + row * 16;
      for (let i = 0; i < 3; i++) {
        const cx = OX + Math.round(5 + i * 10.6 + row * 5 + (hh(i, row + v * 7) - 0.5) * 2);
        rosette(p, cx, by, 6, 5, ph, bl, 1);
        if (!bl && ((i + row) & 1)) { p.set(cx, by - 6, c.fl2); p.set(cx + 1, by - 5, '#ffffff'); }
      }
    }
  };
  const herbSprout = (p, v, ph, bl) => {
    for (let row = 0; row < 2; row++) {
      const by = OY + 13 + row * 16;
      for (let i = 0; i < 3; i++) rosette(p, OX + Math.round(5 + i * 10.6 + row * 5), by, 4, 3, ph, bl, 0.6);
    }
  };

  const plantSp = (crop, st, bl, v, f, lit) => {
    const key = (((((crop * 5 + st) * 2 + bl) * 2 + v) * NF + f) * 3) + lit;
    let cv = plantCache[key]; if (cv) return cv;
    const p = new Pix(PW, PH), ph = f / NF;
    if (st === 1) seeds(p, v, crop);
    else if (crop === 0) (st === 2 ? wheatSprout : st === 3 ? wheatGrow : wheatMature)(p, v, ph, bl, lit);
    else (st === 2 ? herbSprout : st === 3 ? herbGrow : herbMature)(p, v, ph, bl);
    if (st >= 2) p.outline(crop === 0 && st === 4 ? '#6a461466' : '#1e2a1488');
    return (plantCache[key] = p.canvas());
  };

  /* ---------- sprites de bichos ---------- */
  const bugs = {};
  const bflies = [['#ffffff', '#9a7ac0'], ['#e4acff', '#6a3a9a'], ['#ffe060', '#a87020']].map(([w, e]) => [
    art(['.ww.ww.', 'wwwkwww', '.wwkww.', '..wkw..'].map(r => r), { w, k: '#2a1a2a' }),
    art(['..w.w..', '..wkw..', '..wkw..', '...k...'], { w, k: '#2a1a2a' })
  ].map(x => x.outline(e).canvas()));
  const beeS = [art(['.ww..', 'ykyk.', 'ykyky', '.yk..'.replace('.yk..', '.kyk.')], { y: '#ffd23a', k: '#2a1a14', w: '#e8f4ff' }).canvas(),
    art(['.....', 'ykyk.', 'ykyky', '.kyk.'], { y: '#ffd23a', k: '#2a1a14', w: '#e8f4ff' }).canvas()];
  const bp = { c: '#7a4a2a', h: '#a87a50', e: '#16111e', b: '#f0a830', k: '#6a4426', w: '#52361f', l: '#c8a070', s: '#e8d8b0', t: '#4a301c', f: '#c07040' };
  const birdS = [
    art(['.....cccc.', '....chhehb', '..kkkhhhss', 'tkkwwwwsss', 'ttkwwlwsss', '.tkkwwssss', '..kkkssss.', '....f.f...'], bp).outline('#2a1a10').canvas(),
    art(['..ww......', '.wwww..cc.', '..wwkkchhe', 'tkkkkkhhhb', 'ttkkkksss.', '.tkkksss..', '...sss....'], bp).outline('#2a1a10').canvas(),
    art(['..........', 'tkkkkk.cc.', 'ttwwwwkchhe', '.twwlwhhhb', '..kwwsss..', '...wsss...', '...www....', '..w.......'], bp).outline('#2a1a10').canvas()
  ];

  /* ---------- estado ---------- */
  let T = null, order = null, nT = -1, fx0 = 0, fy0 = 0, fw = 1, fh = 1, fieldCv = null, fieldCtx = null, fieldSig = null, masks = null, vars = null;
  const prev = new WeakMap(), pops = new WeakMap(), parts = [];
  const birds = [{ s: 0, t0: 7, n: 0 }, { s: 0, t0: 21, n: 0 }];
  const lit = (g) => g > 0.8 ? 2 : g > 0.4 ? 1 : 0;

  const setup = () => {
    T = L.tiles; nT = T.length;
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (const q of T) { x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); }
    fx0 = x0; fy0 = y0; fw = x1 - x0 + 1; fh = y1 - y0 + 1;
    fieldCv = A.mk(fw * AT, fh * AT); fieldCtx = fieldCv.getContext('2d'); fieldSig = new Int32Array(nT).fill(-1);
    const set = new Set(T.map(q => q.x + ',' + q.y));
    masks = T.map(q => (set.has(q.x + ',' + (q.y - 1)) ? 1 : 0) | (set.has((q.x + 1) + ',' + q.y) ? 2 : 0) | (set.has(q.x + ',' + (q.y + 1)) ? 4 : 0) | (set.has((q.x - 1) + ',' + q.y) ? 8 : 0));
    vars = T.map(q => (hh(q.x, q.y) * 3) | 0);
    order = T.map((q, i) => i).sort((a, b) => T[a].y - T[b].y || T[a].x - T[b].x);
  };

  const spawn = (k, x, y, vx, vy, g, life, c, s, t) => { if (parts.length < 140) parts.push({ k, x, y, vx, vy, g, life, c, s, t0: t }); };
  const strawShower = (q, t, low) => {
    const n = low ? 6 : 16, cols = q.crop === 0 ? ['#e8c450', '#fff0a8', '#c89e34', '#a87f24'] : ['#4f9a48', '#7fd070', '#c070e0', '#f0b8ff'];
    for (let i = 0; i < n; i++) {
      const r1 = hh(i, q.x * 31 + q.y), r2 = hh(i + 50, q.x * 17 + q.y * 3);
      spawn(0, q.x + 0.15 + r1 * 0.7, q.y + 0.35 + r2 * 0.4, (r1 - 0.5) * 1.5, -1.4 - r2 * 1.5, 5.5, 0.9 + r2 * 0.5, cols[i & 3], i % 3 === 0 ? 2 : 1, t + i * 0.012);
    }
  };
  const popSpark = (q, t, low) => {
    const n = low ? 2 : 5;
    for (let i = 0; i < n; i++) spawn(1, q.x + 0.2 + hh(i, q.x + q.y * 5) * 0.6, q.y + 0.5, (hh(i, 7) - 0.5) * 0.8, -0.7 - hh(i, 8) * 0.6, 2.2, 0.55, i & 1 ? '#c8ff90' : '#ffffff', 1, t);
  };

  /* ---------- função principal ---------- */
  R.groundMore = function (X, Y, z, vx0, vx1, vy0, vy1) {
    if (!L.tiles || !L.tiles.length) return orig.apply(this, arguments);
    if (L.tiles !== T || nT !== L.tiles.length) setup();
    const ctx = R.ctx, S = G.S, t = R.t || 0, s = z / 2, low = !!S.opts.lowFx, red = reduced();
    if (fx0 + fw < vx0 || fx0 > vx1 || fy0 + fh < vy0 - 1 || fy0 > vy1) return;
    const bl = S.ev && S.ev.blight > S.day;

    /* 1) terra */
    for (let i = 0; i < nT; i++) {
      const q = T[i], wet = q.wet > S.t ? 1 : 0, sig = wet + masks[i] * 2 + vars[i] * 64;
      if (fieldSig[i] === sig) continue;
      fieldSig[i] = sig; fieldCtx.clearRect((q.x - fx0) * AT, (q.y - fy0) * AT, AT, AT);
      fieldCtx.drawImage(soilSp(wet, masks[i], vars[i]), (q.x - fx0) * AT, (q.y - fy0) * AT);
    }
    ctx.drawImage(fieldCv, Math.round(X(fx0)), Math.round(Y(fy0)), fieldCv.width * s, fieldCv.height * s);

    /* 2) eventos de estágio (pop, palha) */
    const berryH = [], wheatH = [];
    for (let i = 0; i < nT; i++) {
      const q = T[i], pv = prev.get(q), inView = q.x >= vx0 && q.x <= vx1 && q.y >= vy0 && q.y <= vy1;
      if (pv !== undefined && inView && !red) {
        if (q.st > pv && q.st >= 1) { pops.set(q, t); popSpark(q, t, low); }
        else if (q.st === 0 && pv >= 3) strawShower(q, t, low);
      }
      prev.set(q, q.st);
      if (q.st === 4 && !(bl)) (q.crop ? berryH : wheatH).push(q);
    }

    /* 3) plantas em ordem de y (1 drawImage por canteiro) */
    const gphase = (t % 17) * 3.4 - 4;
    for (let k = 0; k < nT; k++) {
      const i = order[k], q = T[i]; if (q.st === 0) continue;
      if (q.x < vx0 - 1 || q.x > vx1 || q.y < vy0 - 1 || q.y > vy1) continue;
      const b = bl && q.st >= 2 ? 1 : 0;
      let f = 1, lt = 0;
      if (q.st >= 2 && !red && !b) {
        const ph = low ? fr(t * 0.42 - q.x * 0.1) : fr(t * 0.8 - q.x * 0.12 - q.y * 0.05);
        f = Math.floor(ph * NF) % NF;
        if (!low && q.crop === 0 && q.st >= 3) { const g = 1 - Math.abs((q.x - fx0) + (q.y - fy0) * 0.35 - gphase) / 2.4; if (g > 0.4) lt = lit(g); }
      } else if (q.st < 2) f = 0;
      const sp = plantSp(q.crop, q.st, b, vars[i] % 2, f, q.st >= 3 ? lt : 0);
      let dx = 0, sx = 1, sy = 1, dyy = 0;
      if (q.sh > 0 && !red) { const a = Math.min(1, q.sh / 0.15); dx = Math.sin(t * 60) * 1.6 * a; sy = 1 - 0.03 * a; }
      const pt = pops.get(q);
      if (pt !== undefined) {
        const e = (t - pt) / 0.42;
        if (e >= 1) pops.delete(q); else if (e >= 0) { const sc = e < 0.55 ? 0.25 + 1.0 * (e / 0.55) : 1.25 - 0.25 * ((e - 0.55) / 0.45); sy = sc; sx = 1 + (1 - sc) * 0.3; }
      }
      const w = PW * s * sx, h = PH * s * sy, baseY = Y(q.y) + (PH - OY) * s - 2 * s;
      ctx.drawImage(sp, Math.round(X(q.x) - OX * s + dx * s - (w - PW * s) / 2), Math.round(baseY - h + dyy), Math.ceil(w), Math.ceil(h));
    }

    /* 4) partículas (palha, brotos) */
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i], a = t - p.t0;
      if (a > p.life || a < -1) { if (a > p.life || a < -1) parts.splice(i, 1); continue; }
      if (a < 0) continue;
      const wx = p.x + p.vx * a, wy = p.y + p.vy * a * 0.5 + 0.5 * p.g * a * a * 0.5;
      const lift = (-p.vy * a + 0.5 * p.g * a * a) * 0; void lift;
      ctx.globalAlpha = Math.min(1, (p.life - a) * 3);
      ctx.fillStyle = p.c;
      const px = Math.round(X(wx)), py = Math.round(Y(wy));
      if (p.k === 0) ctx.fillRect(px, py, s * (p.s === 2 ? 3 : 2), s * (p.s === 2 ? 1 : 2) + ((a * 9 | 0) & 1) * s * 0);
      else ctx.fillRect(px, py, s * 1.5, s * 1.5);
    }
    ctx.globalAlpha = 1;

    if (low || red) return;
    const dark = G.darkness(S.clock);

    /* 5) borboletas e abelhas sobre as ervas floridas */
    if (dark < 0.4 && berryH.length) {
      const nB = Math.min(4, berryH.length + 1), nBee = Math.min(3, berryH.length);
      for (let i = 0; i < nB; i++) {
        const A1 = berryH[(i * 5) % berryH.length], B1 = berryH[(i * 5 + 3) % berryH.length], m = 0.5 + 0.5 * Math.sin(t * 0.12 + i * 2.1);
        const wx = A1.x + (B1.x - A1.x) * m + 0.5 + Math.sin(t * 0.8 + i) * 0.45, wy = A1.y + (B1.y - A1.y) * m + 0.15 + Math.sin(t * 1.3 + i * 1.7) * 0.25;
        const alt = 0.45 + 0.18 * Math.sin(t * 2.3 + i * 3) + 0.14 * Math.sin(t * 5.1 + i);
        const sp = bflies[i % 3][Math.floor(t * 8 + i) & 1], px = Math.round(X(wx) - sp.width * s / 2), py = Math.round(Y(wy) - alt * TS * z - sp.height * s / 2);
        ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(Math.round(X(wx) - s), Math.round(Y(wy) + 0.1 * TS * z), s * 3, s);
        ctx.drawImage(sp, px, py, sp.width * s, sp.height * s);
      }
      for (let i = 0; i < nBee; i++) {
        const A1 = berryH[(i * 7 + 2) % berryH.length], bt = t * 0.9 + i * 4;
        const wx = A1.x + 0.5 + Math.sin(bt * 1.7) * 0.4 + Math.sin(bt * 4.3) * 0.08, wy = A1.y + 0.2 + Math.cos(bt * 1.3) * 0.25;
        const alt = 0.3 + 0.08 * Math.sin(bt * 6);
        const sp = beeS[Math.floor(t * 20 + i) & 1];
        ctx.drawImage(sp, Math.round(X(wx)), Math.round(Y(wy) - alt * TS * z), sp.width * s, sp.height * s);
      }
    }

    /* 6) pássaros pousando no trigo maduro */
    for (let bi = 0; bi < birds.length; bi++) {
      const b = birds[bi], dur = [0, 2.4, 0, 2.2][b.s];
      if (b.s === 0) {
        if (t >= b.t0) {
          const el = wheatH.filter(q => !birds.some(o => o !== b && o.s && o.q === q));
          if (!el.length || dark > 0.6) { b.t0 = t + 4; continue; }
          b.n++; b.q = el[(hh(b.n, bi + 3) * el.length) | 0]; b.dir = hh(b.n, bi + 9) < 0.5 ? -1 : 1; b.dir2 = hh(b.n, bi + 19) < 0.5 ? -1 : 1;
          b.fy = hh(b.n, bi + 4) < 0.5 ? -0.2 : 0.2; b.fxo = 0.25 + hh(b.n, bi + 6) * 0.5; b.s = 1; b.ts = t;
        }
        continue;
      }
      const q = b.q, ok = q.st === 4 && q.crop === 0 && !bl && !(q.sh > 0);
      let scared = !ok;
      if (!scared && b.s === 2) for (const n of G.npcs) if (n.at === 'fazenda' && Math.abs(n.x - q.x - 0.5) < 1.6 && Math.abs(n.y - q.y - 0.5) < 1.3) { scared = true; break; }
      if (b.s === 1 && (t - b.ts >= dur || scared)) { if (scared) { b.s = 3; b.ts = t; } else { b.s = 2; b.ts = t; b.pd = 3.5 + hh(b.n, bi + 5) * 5; } }
      else if (b.s === 2 && (scared || t - b.ts >= b.pd)) { b.s = 3; b.ts = t; }
      else if (b.s === 3 && t - b.ts >= 2.2) { b.s = 0; b.t0 = t + 10 + hh(b.n, bi + 8) * 16; continue; }
      const e = Math.min(1, (t - b.ts) / (b.s === 1 ? 2.4 : 2.2));
      let wx = q.x + b.fxo, wy = q.y + b.fy, alt = 0, face = b.dir < 0 ? 1 : -1, fr2 = 0;
      if (b.s === 1) { const k = 1 - (1 - e) * (1 - e); wx += (1 - k) * b.dir * 7; wy += (1 - k) * -4; alt = Math.pow(1 - k, 1.5) * 1.4; fr2 = 1 + (Math.floor(t * 14) & 1); face = b.dir < 0 ? 1 : -1; if (e > 0.88) fr2 = 1; }
      else if (b.s === 3) { wx += e * e * b.dir2 * 8; wy += -e * e * 6; alt = 0.1 + e * 1.8; fr2 = 1 + (Math.floor(t * 14) & 1); face = b.dir2 > 0 ? 1 : -1; if (e < 0.12) fr2 = 1; }
      else face = (hh(b.n, bi + 2) > 0.5 ? 1 : -1) * (Math.sin(t * 0.7 + bi) > 0.8 ? -1 : 1);
      const sp = fr2 ? birdS[fr2] : birdS[0], bw = sp.width * s, bh = sp.height * s, px = X(wx), py = Y(wy) - alt * TS * z;
      let sy2 = 1, hop = 0;
      if (b.s === 2) { const pk = Math.sin(t * 3.1 + bi * 2); if (pk > 0.82) sy2 = 0.82; hop = Math.max(0, Math.sin(t * 1.9 + bi * 5) - 0.93) * 12 * s; }
      if (alt > 0.15) { ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.fillRect(Math.round(X(wx) - bw / 2), Math.round(Y(q.y + b.fy + 0.1)), bw, s); }
      ctx.save(); ctx.translate(Math.round(px), Math.round(py - hop)); ctx.scale(face, sy2);
      ctx.drawImage(sp, -bw / 2, -bh, bw, bh); ctx.restore();
    }

    /* 7) vagalumes à noite */
    if (dark > 0.5) {
      const n = 16; ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const wx = fx0 + hh(i, 1) * fw + Math.sin(t * 0.31 + i * 1.9) * 0.9, wy = fy0 + hh(i, 2) * fh + Math.cos(t * 0.27 + i * 2.7) * 0.7 + Math.sin(t * 1.1 + i) * 0.1;
        const g = Math.pow(Math.max(0, Math.sin(t * 1.25 + i * 2.1)), 2) * dark, alt = 0.25 + hh(i, 3) * 0.5 + Math.sin(t * 0.9 + i) * 0.12;
        if (g < 0.05) continue;
        const px = Math.round(X(wx)), py = Math.round(Y(wy) - alt * TS * z);
        ctx.fillStyle = 'rgba(190,255,90,' + (0.14 * g).toFixed(3) + ')'; ctx.fillRect(px - 2 * s, py - 2 * s, 5 * s, 5 * s);
        ctx.fillStyle = 'rgba(240,255,150,' + g.toFixed(3) + ')'; ctx.fillRect(px, py, 2 * s, 2 * s);
      }
      ctx.restore();
    }
  };
  R.groundMore.__farm = true;
})();
