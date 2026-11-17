/* Aurora 046 · Arte do Portal de Aurora (arco gótico, vórtice em espiral, runas, fragmentos, círculo rúnico).
   Contrato: G.A.PortalArt = { draw(ctx,x,y,z,t,o), ground(ctx,x,y,z,t,o) }  (ver src/portal.js).
   Tudo o que é estático é pré-renderizado uma vez (3x a resolução de arte) e animado por rotação/alfa de camadas. */
(function () {
  'use strict';
  if (typeof G === 'undefined' || G.HEADLESS || !G.A) return;
  const S = 3, TAU = Math.PI * 2, OUT = '#1a1422';
  const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const hs = (x, y, s) => { let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s || 0) | 0, 362437)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16; return (n >>> 0) / 4294967296; };
  const cl = (v, a, b) => v < a ? a : v > b ? b : v;
  function mk(w, h) {
    let c = null; try { c = G.A.mk(w, h); if (Array.isArray(c)) c = c[0]; if (c && c.cv) c = c.cv; if (c && c.canvas) c = c.canvas; } catch (e) { c = null; }
    if (!c || !c.getContext) { c = document.createElement('canvas'); c.width = w; c.height = h; }
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return { cv: c, x };
  }
  /* constrói um canvas pixel a pixel: fn(fx,fy,out[4]) escreve rgba */
  function paint(w, h, fn) {
    const m = mk(w, h), im = m.x.createImageData(w, h), d = im.data, o = [0, 0, 0, 0];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { o[3] = 0; fn(x, y, o); const i = (y * w + x) * 4; d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; d[i + 3] = o[3]; }
    m.x.putImageData(im, 0, 0); return m.cv;
  }
  const put = (o, c, a) => { o[0] = c[0]; o[1] = c[1]; o[2] = c[2]; o[3] = a === undefined ? 255 : a; };

  const STONE = ['#1b1828', '#272339', '#332e4a', '#413b5a', '#524b6d', '#675f85', '#7f779c'].map(rgb);
  const MOSS = ['#1e2a1f', '#2c3d2a', '#3f5634'].map(rgb);
  const METAL = ['#1d182d', '#322c4c', '#4d4772', '#736ea0', '#a09bc8', '#cfc9ee'].map(rgb);
  const VRAMP = ['#0b0618', '#1b0c42', '#35128a', '#5a1fc0', '#8a3be8', '#bb6bff', '#e7b4ff', '#fff2ff'].map(rgb);
  const OUTC = rgb(OUT);

  /* ---------- glifos de runa (3x5) ---------- */
  const GLY = [['01110','10001','10101','10101','10001','01110','00100'], ['00100','01010','10001','01010','00100','00100','01100'], ['11111','10001','01010','00100','00000','10101','00000'], ['00100','10101','01110','00100','01110','10101','00100'], ['11011','10001','00000','00100','00000','10001','11011'], ['01010','01010','11111','00100','01110','00100','00100']];

  /* ---------- geometria do arco (unidades de arte; origem = centro dos pés; y negativo = para cima) ---------- */
  const PH = [0.55, 1.05];
  const HORN = [], WING = [];
  for (let u = 0; u <= 1.0001; u += 0.04) {
    HORN.push([5 + 14 * u, -66 - 11 * Math.pow(u, 1.7), 3.7 * Math.pow(1 - u, 0.9) + 0.8]);
    WING.push([7 + 15 * u, -63 + 9 * Math.pow(u, 1.4), 2.3 * (1 - u) + 0.8]);
  }
  function crest(x, y) {
    const ax = Math.abs(x);
    if (y >= -75.5 && y <= -60) { const hw = y < -70 ? 3.5 + (y + 75.5) * 0.65 : 7 - (y + 70) * 0.5; if (ax <= hw) return 2; }
    for (let i = 0; i < HORN.length; i++) { const h = HORN[i], dx = ax - h[0], dy = y - h[1]; if (dx * dx + dy * dy <= h[2] * h[2]) return 2; }
    for (let i = 0; i < WING.length; i++) { const h = WING[i], dx = ax - h[0], dy = y - h[1]; if (dx * dx + dy * dy <= h[2] * h[2]) return 2; }
    return 0;
  }
  function solid(x, y) {
    const ax = Math.abs(x);
    if (y > -3 && y <= 0 && ax <= 26) return 1;
    if (y > -6 && y <= -3 && ax <= 22) return 1;
    if (y > -9 && y <= -6 && ax <= 29) return 1;
    if (y > -18 && y <= -9 && ax >= 14 && ax <= 29) return 1;
    if (y > -44 && y <= -18 && ax >= 14 && ax <= 26) return 1;
    if (y <= -44) {
      const dy = y + 44, d = Math.hypot(x, dy);
      if (d >= 14 && d <= 26) return 1;
      if (d > 26 && d < 31) { const phi = Math.atan2(ax, -dy); for (let i = 0; i < 2; i++) { const q = Math.abs(phi - PH[i]); if (q < 0.08 && d <= 26 + 4 * (1 - q / 0.08)) return 1; } }
    }
    return crest(x, y);
  }
  const isHole = (x, y) => { const ax = Math.abs(x); if (y <= -9 && y > -44) return ax < 14; if (y <= -44) return Math.hypot(x, y + 44) < 14; return false; };
  /* runas: x, y, glifo, ordem na sequência (pilar esq. subindo, arco, pilar dir. descendo) */
  const RUNES = [];
  [-16, -23, -30, -37].forEach((y, i) => RUNES.push([-20, y, i % 6, i]));
  [-1.38, -1.0, -0.62, 0.62, 1.0, 1.38].forEach((p, i) => { const a = p < 0 ? p : p; RUNES.push([21 * Math.sin(a), -44 - 21 * Math.cos(a), (i + 2) % 6, 4 + i + (i > 2 ? 0 : 0)]); });
  [-37, -30, -23, -16].forEach((y, i) => RUNES.push([20, y, (i + 3) % 6, 10 + i]));
  const NSEQ = 14;

  let C = null, failed = false;
  function build() {
    const c = {};
    /* ----- arco ----- */
    const W = 64 * S, H = 86 * S, OX = 32 * S, OY = 82 * S;
    const mat = new Uint8Array(W * H), hole = new Uint8Array(W * H);
    const gx = fx => (fx + 0.5 - OX) / S, gy = fy => (fy + 0.5 - OY) / S;
    for (let fy = 0; fy < H; fy++) for (let fx = 0; fx < W; fx++) { const x = gx(fx), y = gy(fy), m = solid(x, y); mat[fy * W + fx] = m; if (!m && isHole(x, y)) hole[fy * W + fx] = 1; }
    const at = (a, fx, fy) => (fx < 0 || fy < 0 || fx >= W || fy >= H) ? 0 : a[fy * W + fx];
    const near = (fx, fy, want, mx, arr) => { for (let r = 1; r <= mx; r++) { for (let dy = -r; dy <= r; dy += r) for (let dx = -r; dx <= r; dx += r) { if (!dx && !dy) continue; const v = arr === hole ? at(hole, fx + dx, fy + dy) : (at(mat, fx + dx, fy + dy) ? 1 : 0); if (v === want) return r; } } return 99; };
    const nearOut = (fx, fy, mx) => { for (let r = 1; r <= mx; r++) { for (let dy = -r; dy <= r; dy += r) for (let dx = -r; dx <= r; dx += r) { if ((dx || dy) && !at(mat, fx + dx, fy + dy)) return r; } } return 99; };
    const nearHole = (fx, fy, mx) => { for (let r = 1; r <= mx; r++) { for (let dy = -r; dy <= r; dy += r) for (let dx = -r; dx <= r; dx += r) { if ((dx || dy) && at(hole, fx + dx, fy + dy)) return r; } } return 99; };
    const nearSolid = (fx, fy, mx) => { for (let r = 1; r <= mx; r++) { for (let dy = -r; dy <= r; dy += r) for (let dx = -r; dx <= r; dx += r) { if ((dx || dy) && at(mat, fx + dx, fy + dy)) return r; } } return 99; };
    const recess = (x, y) => { const ax = Math.abs(x); if (ax >= 17 && ax <= 23 && y >= -41 && y <= -13.5) return true; for (let i = 4; i < 10; i++) { const r = RUNES[i]; if (Math.hypot(x - r[0], y - r[1]) < 3.6) return true; } return false; };
    c.arch = paint(W, H, (fx, fy, o) => {
      const m = mat[fy * W + fx], x = gx(fx), y = gy(fy);
      if (!m) {
        if (hole[fy * W + fx]) { const d = nearSolid(fx, fy, 14); if (d < 99) put(o, rgb('#0a0414'), Math.round(255 * 0.78 * Math.pow(1 - d / 15, 1.3))); }
        return;
      }
      const dO = nearOut(fx, fy, 3);
      if (dO <= 3) { put(o, OUTC); return; }
      const ax = Math.abs(x), n = hs(fx, fy, 1), n2 = hs(fx >> 2, fy >> 2, 2);
      if (m === 2) {
        let tone = 3.5 - x * 0.07 - (y + 68) * 0.07 + (n - 0.5) * 0.7;
        if (ax < 0.45 && y > -75 && y < -61) tone += 1.0;
        if (!at(mat, fx, fy - 4)) tone += 1.2; if (!at(mat, fx, fy + 4)) tone -= 0.9;
        const dd = Math.hypot(x, y + 67); if (dd < 3.9) tone = dd > 3.1 ? 4.2 : 0;
        if (nearOut(fx, fy, 5) <= 4 && dd >= 3.9) tone -= 0.7;
        { const mc = METAL[cl(Math.round(tone), 0, 5)], vk = 0.22; put(o, [mc[0] + (150 - mc[0]) * vk, mc[1] + (100 - mc[1]) * vk, mc[2] + (235 - mc[2]) * vk]); } return;
      }
      let tone = 2.7 - x * 0.022, field = 0;
      const dy = y + 44;
      if (y <= -44) {
        const d = Math.hypot(x, dy), phi = Math.atan2(x, -dy);
        tone += (-dy / d) * 0.55 + (d - 20) * 0.03;
        const stag = d > 20 ? 0.5 : 0, s = phi / 0.21 + stag, sec = Math.floor(s), fr = s - sec;
        if (fr < 0.085 || Math.abs(d - 20) < 0.2) { tone -= 1.1; field = 1; }
        else { tone += (hs(sec, d > 20 ? 1 : 0, 7) - 0.5) * 0.9; if (fr < 0.17) tone += 0.45; if (fr > 0.9) tone -= 0.35; }
      } else if (y > -9) {
        const top = (y > -3 ? -3 : y > -6 ? -6 : -9), rel = y - (top === -3 ? -3 : top === -6 ? -6 : -9);
        const fy2 = y > -3 ? y + 3 : y > -6 ? y + 6 : y + 9; // 0..3 do topo para baixo
        tone += fy2 < 1.6 ? 0.85 : -0.45;
        const vx = ((x + 100) / 8) % 1; if (vx < 0.04 && fy2 >= 1.6) tone -= 1.0; else if (vx < 0.13 && fy2 >= 1.6) tone += 0.3;
        if (fy2 > 2.85 || fy2 < 0.08) tone -= 0.4;
        tone += (n - 0.5) * 0.5;
      } else {
        const cr = 4.5, rw = Math.floor(-y / cr), fr = -y / cr - rw, off = (rw & 1) * 5, cx = (ax + off) / 10, col = Math.floor(cx), fc = cx - col;
        if (fr > 0.925) { tone -= 1.1; field = 1; } else if (fc < 0.045) { tone -= 1.0; field = 1; }
        else { tone += (hs(rw, col, ax === x ? 3 : 4) - 0.5) * 1.0; if (fr < 0.16) tone += 0.5; if (fr > 0.85) tone -= 0.35; if (fc < 0.13) tone += 0.35; }
        if (y > -18 && y <= -14 && ax > 14) tone += 0.8 * (1 - (y + 18) / 4);   // capitel do plinto
        if (y <= -14 && ax >= 14 && ax < 15.1) tone -= 0.8;
        if (ax > 25.2 && y < -18) tone += x < 0 ? 0.9 : -0.5;
        if (ax >= 14 && ax < 15.4 && y < -18) tone -= 0.6;
        if (ax > 26.6 || (ax > 26 && y > -18)) tone -= 0.3;
      }
      tone += (n - 0.5) * 0.45;
      if (recess(x, y) && !(y <= -44 && false)) {
        const rc = recess(x - 0.35, y) && recess(x + 0.35, y) && recess(x, y - 0.35) && recess(x, y + 0.35);
        tone = rc ? 0.9 + (n - 0.5) * 0.4 : 0.2;
      }
      if (!at(mat, fx, fy - 3)) tone += 1.3;
      if (!at(mat, fx, fy + 3) && y < -9) tone -= 0.6;
      const dH = nearHole(fx, fy, 10);
      if (dH < 99) tone -= (1 - dH / 11) * 1.3;
      let col = STONE[cl(Math.round(tone), 0, 6)];
      if (y > -20 && n2 > 0.73 && field === 0 && y < -3 + 4) col = MOSS[cl(Math.round(tone - 1.5), 0, 2)];
      else if (y > -9 && y < 0 && n2 > 0.8) col = MOSS[cl(Math.round(tone - 2), 0, 2)];
      if (dH < 99 && dH <= 7) { const k = 0.3 * (1 - dH / 8); col = [col[0] + (130 - col[0]) * k, col[1] + (50 - col[1]) * k, col[2] + (200 - col[2]) * k]; }
      if (n > 0.992) col = STONE[0];
      put(o, col);
    });
    c.archW = W; c.archH = H;
    /* runas apagadas gravadas na pedra */
    const ax = c.arch.getContext('2d');
    for (const r of RUNES) { ax.fillStyle = '#6a4aa8'; const g = GLY[r[2]], px = Math.round(OX + r[0] * S - 5), py = Math.round(OY + r[1] * S - 7); for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) if (g[j][i] === '1') ax.fillRect(px + i * 2, py + j * 2, 2, 2); }

    /* ----- vórtice (duas camadas) ----- */
    const N = 62 * S;
    c.vA = paint(N, N, (fx, fy, o) => {
      const dx = (fx + 0.5 - N / 2) / S, dy = (fy + 0.5 - N / 2) / S, r = Math.hypot(dx, dy); if (r > 31) return;
      const th = Math.atan2(dy, dx), v = 0.5 + 0.5 * Math.sin(3 * th + r * 0.27), f = 1 - r / 31;
      let I = 0.12 + 0.62 * Math.pow(v, 1.5) * (0.5 + 0.5 * f) + 0.62 * Math.pow(f, 2.6) + (hs(fx, fy, 5) - 0.5) * 0.07;
      const v2 = 0.5 + 0.5 * Math.sin(5 * th - r * 0.5 + 1); if (v2 < 0.22) I -= 0.2 * (1 - v2 / 0.22);
      put(o, VRAMP[cl(Math.floor(I * 7.4), 0, 7)]);
    });
    c.vB = paint(N, N, (fx, fy, o) => {
      const dx = (fx + 0.5 - N / 2) / S, dy = (fy + 0.5 - N / 2) / S, r = Math.hypot(dx, dy); if (r > 31 || r < 2) return;
      const th = Math.atan2(dy, dx), v = 0.5 + 0.5 * Math.sin(4 * th - r * 0.34 + 1.2); if (v < 0.9) return;
      const k = (v - 0.9) / 0.1, a = k * Math.min(1, r / 5) * Math.pow(1 - r / 31, 0.35);
      put(o, k > 0.6 ? VRAMP[7] : VRAMP[6], Math.round(255 * 0.85 * a));
    });

    /* ----- sprites radiais com faixas (pixel art) ----- */
    const radial = (wU, hU, res, pal, pw, bands, amax) => paint(wU * res, hU * res, (fx, fy, o) => {
      const u = (fx + 0.5) / (wU * res) * 2 - 1, v = (fy + 0.5) / (hU * res) * 2 - 1, rho = Math.hypot(u, v); if (rho >= 1) return;
      const lv = Math.floor(Math.pow(1 - rho, pw) * bands) / bands; if (lv <= 0) return;
      put(o, pal[Math.min(pal.length - 1, Math.floor(lv * pal.length))], Math.round(255 * lv * amax));
    });
    const PAL_V = ['#3a0f80', '#6a22c8', '#a04df0', '#d08cff', '#f4d4ff', '#ffffff'].map(rgb);
    c.core = radial(34, 34, 3, PAL_V, 1.5, 8, 1);
    c.halo = radial(84, 96, 2, ['#2a0b60', '#4a18a0', '#7a30e0'].map(rgb), 1.3, 6, 0.9);
    c.glowS = radial(22, 22, 3, ['#5a22b0', '#a04df0', '#e8b8ff', '#ffffff'].map(rgb), 1.4, 6, 1);
    c.flash = radial(150, 150, 1, ['#8a3be8', '#d08cff', '#f6e4ff', '#ffffff'].map(rgb), 1.2, 8, 1);
    c.spill = radial(84, 40, 2, ['#3a0f80', '#7a2ad0', '#c04cf0', '#ff9af0'].map(rgb), 1.25, 7, 1);
    c.ember = radial(8, 8, 3, ['#7a30e0', '#e8b8ff', '#ffffff'].map(rgb), 1, 3, 1);
    c.shadow = paint(80 * 2, 24 * 2, (fx, fy, o) => { const u = (fx + 0.5) / 80 - 1, v = (fy + 0.5) / 24 - 1, rho = Math.hypot(u, v); if (rho >= 1) return; const lv = Math.floor((1 - rho) * 4) / 4; if (lv > 0) put(o, OUTC, Math.round(255 * 0.55 * Math.min(1, lv * 1.6))); });
    c.beam = paint(26 * 2, 130 * 2, (fx, fy, o) => {
      const u = Math.abs((fx + 0.5) / 26 - 1), vv = (fy + 0.5) / 260; let a = Math.pow(1 - u, 1.4) * Math.pow(Math.min(1, vv * 4.5), 0.6) * (vv < 0.04 ? 0.5 : 1); if (vv > 0.9) a *= (1 - vv) * 10;
      a = Math.floor(a * 6) / 6; if (a <= 0) return; put(o, a > 0.6 ? rgb('#fff4ff') : a > 0.3 ? rgb('#e0a8ff') : rgb('#9a46f0'), Math.round(255 * a));
    });
    /* cone de luz sobre os degraus/chão */
    c.cone = paint(76 * 2, 34 * 2, (fx, fy, o) => {
      const u = ((fx + 0.5) / 152) * 2 - 1, v = (fy + 0.5) / 68; const half = 0.36 + 0.64 * v; const q = Math.abs(u) / half; if (q >= 1) return;
      let a = Math.pow(1 - q, 1.1) * Math.pow(1 - v, 1.1) * 0.95; a = Math.floor(a * 6) / 6; if (a <= 0) return; put(o, a > 0.5 ? rgb('#e9a6ff') : rgb('#9a46f0'), Math.round(255 * a));
    });

    /* ----- runas acesas ----- */
    c.glyphs = GLY.map(g => {
      const m = mk(28, 32), x = m.x; x.fillStyle = '#e9b8ff';
      for (let pass = 0; pass < 2; pass++) { x.shadowColor = '#b050ff'; x.shadowBlur = pass ? 3 : 8; for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) if (g[j][i] === '1') x.fillRect(9 + i * 2, 9 + j * 2, 2, 2); }
      x.shadowBlur = 0; x.fillStyle = '#fff4ff'; for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) if (g[j][i] === '1') x.fillRect(9 + i * 2, 9 + j * 2, 1, 1);
      return m.cv;
    });
    /* ----- gema do brasão ----- */
    c.gem = (() => {
      const m = mk(7 * S, 9 * S), x = m.x; const px = (X, Y, w, h, col) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
      const pts = [[10.5, 0], [21, 12], [10.5, 27], [0, 12]]; x.fillStyle = OUT; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill();
      x.fillStyle = '#7a2fd8'; x.beginPath(); [[10.5, 3], [18, 12], [10.5, 24], [3, 12]].forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill();
      x.fillStyle = '#b86cff'; x.beginPath(); [[10.5, 3], [18, 12], [10.5, 12]].forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill();
      x.fillStyle = '#4a1a98'; x.beginPath(); [[10.5, 12], [18, 12], [10.5, 24]].forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill();
      px(8, 6, 3, 3, '#ffffff'); px(11, 9, 2, 2, '#f0d0ff'); return m.cv;
    })();
    /* ----- fragmentos de pedra ----- */
    const SH = [[[0, -4], [3, -2], [3.5, 1], [1, 4], [-2.5, 3], [-3.5, -1]], [[-3, -3], [2, -4], [4, 0], [1, 3], [-3, 2]], [[0, -3], [2, -1], [1.5, 2.5], [-1.5, 2], [-2, -1]]];
    c.shards = SH.map((poly, k) => {
      const w = 10 * S, h = 11 * S, inP = (x, y) => { let r = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) r = !r; } return r; };
      const ms = new Uint8Array(w * h); for (let fy = 0; fy < h; fy++) for (let fx = 0; fx < w; fx++) ms[fy * w + fx] = inP((fx + 0.5) / S - 5, (fy + 0.5) / S - 5.5) ? 1 : 0;
      const nb = (fx, fy, r) => { for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) { const X = fx + dx, Y = fy + dy; if (X < 0 || Y < 0 || X >= w || Y >= h || !ms[Y * w + X]) return true; } return false; };
      return paint(w, h, (fx, fy, o) => {
        if (!ms[fy * w + fx]) return; if (nb(fx, fy, 2)) { put(o, OUTC); return; }
        const x = (fx + 0.5) / S - 5, y = (fy + 0.5) / S - 5.5; let t = 3.3 - x * 0.35 - y * 0.25 + (hs(fx, fy, k) - 0.5) * 0.6;
        if (nb(fx, fy, 4) && y < 0) t += 1; if (y > 1.2) { put(o, VRAMP[4 + (fy & 1 ? 0 : 0)]); if (y > 2.2) put(o, VRAMP[5]); return; }
        put(o, STONE[cl(Math.round(t), 0, 6)]);
      });
    });

    /* ----- chão: círculo rúnico (achatado) ----- */
    const GW = 88 * S, GH = 34 * S, RX = 41.4 * S, RY = 14.4 * S, ox = GW / 2, oy = GH / 2;
    const LIL = rgb('#c995ff'), VIO = rgb('#7a35d8');
    const V = []; for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + k * Math.PI / 3; V.push([RX * 0.66 * Math.cos(a), RY * 0.66 * Math.sin(a)]); }
    const segs = [[0, 2], [2, 4], [4, 0], [1, 3], [3, 5], [5, 1]].map(p => [V[p[0]], V[p[1]]]);
    const dseg = (px, py, a, b) => { const abx = b[0] - a[0], aby = b[1] - a[1]; const t = cl(((px - a[0]) * abx + (py - a[1]) * aby) / (abx * abx + aby * aby), 0, 1); return Math.hypot(px - a[0] - abx * t, py - a[1] - aby * t); };
    c.floor = paint(GW, GH, (fx, fy, o) => {
      const dx = fx + 0.5 - ox, dy = fy + 0.5 - oy, rho = Math.hypot(dx / RX, dy / RY); if (rho > 1) return;
      const n = hs(fx, fy, 9);
      let ds = 99; for (const s of segs) ds = Math.min(ds, dseg(dx, dy, s[0], s[1]));
      const th = Math.atan2(dy / RY, dx / RX);
      if (rho > 0.9 && rho < 0.965) { put(o, n > 0.5 ? LIL : rgb('#b27af0')); return; }
      if ((rho > 0.86 && rho <= 0.9) || rho >= 0.965 || (rho >= 0.63 && rho < 0.66) || (rho >= 0.70 && rho < 0.73) || (rho >= 0.27 && rho < 0.3) || (rho >= 0.34 && rho < 0.37)) { put(o, OUTC, 230); return; }
      if ((rho >= 0.66 && rho < 0.70) || (rho >= 0.3 && rho < 0.34)) { put(o, VIO); return; }
      if (ds < 1.2 && rho < 0.7) { put(o, LIL); return; }
      if (ds < 3.0 && rho < 0.7) { put(o, OUTC, 190); return; }
      if (rho > 0.73 && rho < 0.86) { /* faixa de glifos: marcas pequenas */
        const sec = Math.floor((th + Math.PI) / TAU * 16), ca = -Math.PI + (sec + 0.5) * TAU / 16, gx = RX * 0.795 * Math.cos(ca), gy = RY * 0.795 * Math.sin(ca), lx = (dx - gx) / S, ly = (dy - gy) / S, kd = sec % 4;
        let on = false; if (kd === 0) on = Math.abs(lx) < 0.5 && Math.abs(ly) < 1.2; else if (kd === 1) on = Math.abs(ly) < 0.4 && Math.abs(lx) < 1.5; else if (kd === 2) on = Math.abs(Math.abs(lx) - Math.abs(ly)) < 0.4 && Math.abs(lx) < 1.4; else on = Math.abs(lx) + Math.abs(ly) < 1.3 && Math.abs(lx) + Math.abs(ly) > 0.5;
        if (on) { put(o, LIL); return; }
        put(o, rgb('#1c0c34'), 150); return;
      }
      if (rho < 0.27) { put(o, rgb(rho < 0.14 ? '#5a22b0' : '#2a1058'), rho < 0.14 ? 190 : 160); return; }
      put(o, rgb('#1a0b30'), Math.round(115 + (n - 0.5) * 30));
    });
    c.floorW = GW; c.floorH = GH;
    /* anel girante de glifos (quadrado, é achatado ao desenhar) */
    const RS = 84 * S, rg = mk(RS, RS), g = rg.x; g.translate(RS / 2, RS / 2);
    g.strokeStyle = '#e0b0ff'; g.lineWidth = 2.2 * S / 3 * 1.4; g.beginPath(); g.arc(0, 0, 38.5 * S, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, 31 * S, 0, TAU); g.stroke();
    for (let i = 0; i < 16; i++) { g.save(); g.rotate(i * TAU / 16); g.translate(0, -34.8 * S); const gl = GLY[(i * 5) % 6]; g.fillStyle = '#fff0ff'; g.shadowColor = '#b050ff'; g.shadowBlur = 6; for (let j = 0; j < 7; j++) for (let k = 0; k < 5; k++) if (gl[j][k] === '1') g.fillRect((k - 2.5) * 3.4, (j - 3.5) * 3.4, 3.4, 3.4); g.restore(); }
    c.ring = rg.cv;
    /* anel de choque */
    const SR = 100 * 2;
    c.shock = paint(SR, SR, (fx, fy, o) => {
      const dx = fx + 0.5 - SR / 2, dy = fy + 0.5 - SR / 2, rho = Math.hypot(dx, dy) / (SR / 2); if (rho > 1 || rho < 0.62) return;
      const th = Math.atan2(dy, dx), tick = Math.floor((th + Math.PI) / TAU * 40) & 1;
      if (rho > 0.93) { put(o, rgb('#fff4ff'), 255); return; }
      if (rho > 0.88) { put(o, rgb('#c07cff'), 235); return; }
      if (rho > 0.74 && tick) { put(o, rgb('#d9a0ff'), 200); return; }
      const a = Math.floor(((rho - 0.62) / 0.26) * 4) / 4 * 120; if (a > 0) put(o, rgb('#8a3be8'), a);
    });
    return c;
  }

  const pulse = (t, f, p) => 0.5 + 0.5 * Math.sin(t * f + (p || 0));
  const SHARDS = [[-33, -48, 0, 0, 0.0], [32, -58, 1, 1, 1.7], [-34, -20, 2, 0, 3.1], [35, -34, 0, 1, 4.4], [-24, -73, 1, 0, 2.2], [24, -75, 2, 1, 5.3], [-35, -62, 2, 1, 0.9]];

  function draw(ctx, x, y, z, t, o) {
    if (failed) return;
    if (!C) { try { C = build(); } catch (e) { failed = true; console.error('portal-art', e); return; } }
    const q = !!o.quiet, lo = !!o.light, dk = o.dark || 0, gl = 1 + 0.55 * dk, b = typeof o.burst === 'number' ? o.burst : 99;
    const bp = !q && b < 1.6 ? Math.pow(1 - b / 1.6, 1.2) : 0, fl = !q && b < 0.5 ? 1 - b / 0.5 : 0;
    const X = u => Math.round(x + u * z), Y = u => Math.round(y + u * z), U = z;
    const blit = (img, ux, uy, res) => ctx.drawImage(img, X(ux), Y(uy), Math.round(img.width / res * U), Math.round(img.height / res * U));
    const bblit = (img, ux, uy, wU, hU) => ctx.drawImage(img, X(ux), Y(uy), Math.round(wU * U), Math.round(hU * U));
    const pu = q ? 0.6 : pulse(t, 2.4), tt = q ? 0 : t;
    ctx.imageSmoothingEnabled = false;
    ctx.globalCompositeOperation = 'lighter';
    /* halo atrás do arco */
    ctx.globalAlpha = Math.min(1, (0.3 + 0.12 * pu + 0.5 * bp) * gl); bblit(C.halo, -42, -88, 84, 96);
    /* coluna de luz da invocação (atrás do arco) */
    if (bp > 0) { const bw = 34 * (1 + (1 - bp) * 0.5); ctx.globalAlpha = Math.min(1, bp * 1.6) * (0.85 + 0.15 * Math.sin(b * 60)); bblit(C.beam, -bw / 2, -128, bw, 130); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    /* vórtice recortado na abertura */
    ctx.save(); ctx.beginPath(); ctx.moveTo(X(-15), Y(-8)); ctx.lineTo(X(-15), Y(-44)); ctx.arc(Math.round(x), Y(-44), 15 * U, Math.PI, TAU); ctx.lineTo(X(15), Y(-8)); ctx.closePath(); ctx.clip();
    ctx.fillStyle = '#0b0618'; ctx.fillRect(X(-16), Y(-62), 32 * U, 56 * U);
    const bb = Math.min(b, 4), spin = q ? 0.7 : tt * 0.85 + 3.2 * Math.exp(-2 * bb) * (b < 4 ? 1 : 0), cy = -34;
    ctx.translate(Math.round(x), Y(cy)); ctx.rotate(spin); const vs = 62 * U; ctx.drawImage(C.vA, Math.round(-vs / 2), Math.round(-vs / 2), Math.round(vs), Math.round(vs));
    ctx.rotate(-spin * 2.1 - 1); const sc = (q ? 0.85 : 0.82 + 0.05 * pu); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.9; ctx.drawImage(C.vB, Math.round(-vs * sc / 2), Math.round(-vs * sc / 2), Math.round(vs * sc), Math.round(vs * sc));
    ctx.restore();
    ctx.globalCompositeOperation = 'lighter';
    /* núcleo pulsante */
    const cs = 22 * (1 + (q ? 0 : 0.1 * Math.sin(t * 3.1)) + 0.5 * bp);
    ctx.globalAlpha = Math.min(1, (0.62 + 0.2 * pu + 0.4 * bp) * (dk * 0.2 + 1)); bblit(C.core, -cs / 2, cy - cs / 2, cs, cs);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    /* arco de pedra */
    blit(C.arch, -32, -82, S);
    ctx.globalCompositeOperation = 'lighter';
    /* luz derramando nos degraus */
    ctx.globalAlpha = Math.min(0.8, (0.2 + 0.12 * pu + 0.4 * bp) * gl); ctx.fillStyle = '#9a46f0'; ctx.fillRect(X(-20), Y(-8.6), 40 * U, 1.6 * U);
    ctx.fillStyle = '#c28cff'; ctx.globalAlpha *= 0.8; ctx.fillRect(X(-15), Y(-8.6), 30 * U, 0.9 * U);
    /* runas em sequência */
    const R = RUNES;
    for (let i = 0; i < R.length; i++) {
      const r = R[i]; let L; if (q) L = 0.55; else { const ph = ((t - r[3] * 0.1) % 2.6 + 2.6) % 2.6; L = 0.22 + 0.78 * Math.pow(Math.max(0, 1 - ph / 1.0), 1.6); if (bp > 0) L = Math.max(L, Math.min(1, bp * 1.6)); }
      ctx.globalAlpha = Math.min(1, L * gl); ctx.drawImage(C.glyphs[r[2]], X(r[0] - 28 / 6), Y(r[1] - 32 / 6), Math.round(28 / 3 * U), Math.round(32 / 3 * U));
    }
    /* gema do brasão */
    const gp = q ? 0.8 : 0.72 + 0.28 * Math.sin(t * 2.2);
    ctx.globalAlpha = Math.min(1, (0.55 * gp + 0.6 * bp) * gl); bblit(C.glowS, -11, -67 - 11, 22, 22);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    bblit(C.gem, -3.5, -71.5, 7, 9);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, 0.5 * gp * gl); bblit(C.gem, -3.5, -71.5, 7, 9);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    /* fragmentos flutuantes */
    const ns = lo ? 4 : SHARDS.length, ex = 1 + 0.3 * bp, SU = 0.72;
    for (let i = 0; i < ns; i++) {
      const s = SHARDS[i], bob = q ? 0 : Math.sin(t * 0.9 + s[4]) * 1.8, dx = q ? 0 : Math.cos(t * 0.6 + s[4] * 1.3) * 1.2, rot = q ? 0 : Math.sin(t * 0.7 + s[4]) * 0.3;
      const sx = s[0] * ex + dx, sy = -34 + (s[1] + 34) * ex + bob, im = C.shards[s[2]], w = 10 * U * SU, h = 11 * U * SU;
      ctx.save(); ctx.translate(X(sx), Y(sy)); ctx.rotate(rot); if (s[3]) ctx.scale(-1, 1); ctx.drawImage(im, Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h));
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 * gl; ctx.drawImage(C.ember, Math.round(-w * 0.45), Math.round(h * 0.05), Math.round(w * 0.9), Math.round(w * 0.9)); ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    /* faíscas sugadas para dentro */
    if (!q) {
      ctx.globalCompositeOperation = 'lighter';
      const np = lo ? 5 : 14;
      for (let i = 0; i < np; i++) {
        const T = 1.5 + hs(i, 1, 1) * 1.4, u = (t / T + hs(i, 2, 1)) % 1, a0 = hs(i, 3, 1) * TAU, R0 = 29 + hs(i, 4, 1) * 9, k = Math.pow(1 - u, 1.5), th = a0 + u * 2.8;
        const px = Math.cos(th) * R0 * k, py = Math.sin(th) * R0 * k * 1.1, al = Math.pow(Math.sin(u * Math.PI), 0.8), big = u > 0.55 ? 1 : 1.3;
        ctx.globalAlpha = Math.min(1, al * gl); ctx.fillStyle = i & 1 ? '#f3c8ff' : '#b86cff'; ctx.fillRect(X(px - 0.5 * big), Y(-34 + py - 0.5 * big), Math.ceil(big * U), Math.ceil(big * U));
        if (!lo && i & 1) { const u2 = Math.max(0, u - 0.05), k2 = Math.pow(1 - u2, 1.5), th2 = a0 + u2 * 2.8; ctx.globalAlpha = al * 0.45; ctx.fillStyle = '#8a3be8'; ctx.fillRect(X(Math.cos(th2) * R0 * k2 - 0.4), Y(-34 + Math.sin(th2) * R0 * k2 * 1.1 - 0.4), Math.ceil(U * 0.9), Math.ceil(U * 0.9)); }
      }
      /* explosão de faíscas */
      if (b < 1.6) {
        const nb = lo ? 10 : 28;
        for (let i = 0; i < nb; i++) {
          const an = hs(i, 10, 3) * TAU, sp = 22 + hs(i, 11, 3) * 58, life = 0.7 + hs(i, 12, 3) * 0.9; if (b >= life) continue;
          const d = sp * (1 - Math.exp(-b * 3.2)) / 3.2, px = Math.cos(an) * d, py = Math.sin(an) * d * 0.85 + 26 * b * b;
          ctx.globalAlpha = Math.min(1, (1 - b / life) * 1.2); ctx.fillStyle = hs(i, 13, 3) > 0.5 ? '#ffffff' : '#d08cff'; const sz = hs(i, 14, 3) > 0.6 ? 2 : 1;
          ctx.fillRect(X(px - sz / 2), Y(-34 + py - sz / 2), Math.ceil(sz * U), Math.ceil(sz * U));
        }
      }
    }
    /* clarão */
    if (fl > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, fl * 1.1); const fs = 120 + 40 * (1 - fl); bblit(C.flash, -fs / 2, -34 - fs / 2, fs, fs); ctx.fillStyle = '#fff4ff'; const lw = 38 * (0.6 + 0.4 * fl); for (const [wf, hh, af] of [[1, 0.9, 0.35], [0.62, 1.7, 0.6], [0.28, 2.6, 0.9]]) { ctx.globalAlpha = fl * af; ctx.fillRect(X(-lw * wf), Y(-34 - hh / 2), lw * wf * 2 * U, Math.ceil(hh * U)); } }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  function ground(ctx, x, y, z, t, o) {
    if (failed) return;
    if (!C) { try { C = build(); } catch (e) { failed = true; console.error('portal-art', e); return; } }
    const q = !!o.quiet, dk = o.dark || 0, gl = 1 + 0.6 * dk, b = typeof o.burst === 'number' ? o.burst : 99;
    const bp = !q && b < 1.6 ? Math.pow(1 - b / 1.6, 1.2) : 0, pu = q ? 0.6 : pulse(t, 2.4);
    const X = u => Math.round(x + u * z), Y = u => Math.round(y + u * z), bblit = (img, ux, uy, wU, hU) => ctx.drawImage(img, X(ux), Y(uy), Math.round(wU * z), Math.round(hU * z));
    ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    bblit(C.shadow, -40, -9, 80, 24);
    const cyc = 3;
    ctx.globalAlpha = 0.95; bblit(C.floor, -44, cyc - 17, 88, 34);
    ctx.globalCompositeOperation = 'lighter';
    /* luz derramada */
    ctx.globalAlpha = Math.min(1, (0.28 + 0.14 * pu + 0.55 * bp) * gl); bblit(C.spill, -42, -2, 84, 40);
    ctx.globalAlpha = Math.min(1, (0.55 + 0.2 * pu + 0.4 * bp) * gl); bblit(C.cone, -38, -8, 76, 34);
    /* círculo: brilho e anel girante */
    ctx.globalAlpha = Math.min(0.9, (0.22 + 0.3 * pu + 0.5 * bp) * gl); bblit(C.floor, -44, cyc - 17, 88, 34);
    ctx.save(); ctx.translate(Math.round(x), Y(cyc)); ctx.scale(1, 14.4 / 41.4); ctx.rotate(q ? 0.4 : t * 0.35); ctx.globalAlpha = Math.min(1, (0.42 + 0.2 * pu + 0.4 * bp) * gl);
    const rs = 84 * z; ctx.drawImage(C.ring, Math.round(-rs / 2), Math.round(-rs / 2), Math.round(rs), Math.round(rs)); ctx.restore();
    /* ondas de choque rúnicas */
    if (!q && b < 1.6) {
      for (let k = 0; k < 2; k++) {
        const a = b - k * 0.2; if (a < 0 || a > 1.2) continue; const e = 1 - Math.pow(1 - a / 1.2, 2.2), rad = 6 + 35.6 * e, h = rad * 14.4 / 41.4;
        ctx.globalAlpha = Math.min(1, (1 - a / 1.2) * 1.3); ctx.drawImage(C.shock, Math.round(x - rad * z), Math.round(Y(cyc) - h * z), Math.round(rad * 2 * z), Math.round(h * 2 * z));
      }
      if (b < 0.5) { ctx.globalAlpha = (1 - b / 0.5) * 0.9; bblit(C.flash, -42, cyc - 17, 84, 34); }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  G.A.PortalArt = { draw, ground };
})();
