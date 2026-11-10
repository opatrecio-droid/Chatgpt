/* 42-art-world: terreno pintado pixel a pixel, adereços (árvores, ruínas, cristais) e construções. */
'use strict';
(function () {
  const A = G.A, Pix = A.Pix, sh = A.shade, mix = A.mix, C = A.C;
  const INK = '#1a1422', Wd = G.W, T = Wd.T, TS = 16;
  A.TS = TS;

  /* ================= terreno ================= */
  const PAL = {
    [T.GRASS]: ['#74b548', '#6aab42', '#7fbf50', '#62a23c'], [T.FOREST]: ['#5c9a3e', '#528f38', '#66a244', '#4a8433'], [T.MATA]: ['#69a344', '#5e993d', '#73ad4b', '#55903a'],
    [T.PATH]: ['#cba96d', '#c19e63', '#d4b279', '#b7955a'], [T.COBBLE]: ['#aaa69d', '#9e9a91', '#b6b2a9', '#948f86'], [T.WATER]: ['#3f90d2', '#3988ca', '#4799da', '#3381c2'],
    [T.RUIN]: ['#dcc288', '#d2b77c', '#e5cc93', '#c8ad72'], [T.WASTE]: ['#7b6b7a', '#70606f', '#867687', '#665766'], [T.SWAMP]: ['#5b7c53', '#50714b', '#65865b', '#486844'],
    [T.SNOW]: ['#eef4f8', '#e3edf3', '#f8fbfd', '#d6e3ec'], [T.ASH]: ['#5b5153', '#504749', '#665b5d', '#473e40'], [T.FIELD]: ['#8c643a', '#7c5732', '#96703f', '#6f4c2a'],
    [T.WALL]: ['#6f6b67', '#66625e', '#77736f', '#5e5a56'], [T.BRIDGE]: ['#a9753d', '#996a36', '#b58045', '#8a5d2e'], [T.LAVA]: ['#ff8c2c', '#ffa63a', '#f07420', '#ffc050'],
    [T.CRATER]: ['#4b3b5b', '#413150', '#564567', '#382a46'], [T.POOL]: ['#3f6b5b', '#376153', '#477563', '#2f574a'], [T.GARDEN]: ['#7cc04e', '#72b648', '#86ca56', '#69ac42'], [T.ICE]: ['#bfe4f4', '#afdbee', '#d2eefa', '#a2d0e6'],
  };
  const HARD = new Set([T.COBBLE, T.WALL, T.FIELD, T.BRIDGE, T.GARDEN]);
  const CANOPY = { 255: ['#3f7a30', '#356d2a', '#4a8636', '#2c6024'], [T.FOREST]: ['#3f7a30', '#356d2a', '#4a8636', '#2c6024'], [T.RUIN]: ['#7a6a48', '#6c5d3f', '#857452', '#5e5036'], [T.WASTE]: ['#4f4354', '#453a4a', '#5a4d60', '#3b3140'], [T.SWAMP]: ['#3a6050', '#315446', '#446b5a', '#284a3d'], [T.SNOW]: ['#b9d0d8', '#a6c0ca', '#cfe0e6', '#93b0bc'], [T.ASH]: ['#3a3234', '#302a2c', '#443b3d', '#262022'] };
  const hash2 = (x, y) => { let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  let terrainCv = null;
  A.terrain = () => {
    if (terrainCv) return terrainCv;
    const w = Wd.w * TS, h = Wd.h * TS, tile = Wd.tile, tw = Wd.w, th = Wd.h;
    const cv = A.mk(w, h), x = cv.getContext('2d'), im = x.createImageData(w, h), d = new Uint32Array(im.data.buffer);
    const pal = {}; for (const k in PAL) pal[k] = PAL[k].map(C);
    const can = {}; for (const k in CANOPY) can[k] = CANOPY[k].map(C);
    const nz = Wd.noise;
    /* campos de ruído em baixa resolução (1 amostra a cada 4 px), interpolados */
    const lw = (w >> 2) + 2, lh = (h >> 2) + 2;
    const n1 = new Float32Array(lw * lh), n2 = new Float32Array(lw * lh), n3 = new Float32Array(lw * lh);
    for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) { n1[j * lw + i] = nz(i * 0.5, j * 0.5, 1); n2[j * lw + i] = nz(i * 0.5 + 40, j * 0.5 + 17, 2); n3[j * lw + i] = nz(i * 0.11, j * 0.11, 3); }
    const tAt = (px, py) => { const tx = px >> 4, ty = py >> 4; return tx < 0 || ty < 0 || tx >= tw || ty >= th ? T.FOREST : tile[ty * tw + tx]; };
    const stoneC = [C('#b4b0a7'), C('#a6a299'), C('#9a968d'), C('#bfbbb2')], mortar = C('#7d7870');
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const li = (py >> 2) * lw + (px >> 2);
        const base = tAt(px, py);
        let t = base;
        if (!HARD.has(base)) {
          const jx = (n1[li] - 0.5) * 11 + (hash2(px, py) - 0.5) * 2.2, jy = (n2[li] - 0.5) * 11 + (hash2(py, px) - 0.5) * 2.2;
          const s = tAt(Math.round(px + jx), Math.round(py + jy));
          if (!HARD.has(s)) t = s;
        }
        const hsh = hash2(px * 3 + 7, py * 5 + 3), patch = n3[li];
        let c;
        const ti = (py >> 4) * tw + (px >> 4);
        if (t === T.FOREST && !Wd.walk[ti] && Wd.dense[ti]) {
          /* copa fechada da mata intransitável */
          const cp = can[Wd.dense[ti]] || can[255];
          const bx = px + (n1[li] - 0.5) * 6, by = py + (n2[li] - 0.5) * 6;
          const cx = ((bx / 13) | 0) * 13 + 6.5 + (hash2((bx / 13) | 0, (by / 11) | 0) - 0.5) * 6, cy = ((by / 11) | 0) * 11 + 5.5;
          const dd = Math.hypot(bx - cx, (by - cy) * 1.15);
          c = dd < 3.2 && by < cy ? cp[2] : dd < 5.6 ? cp[0] : dd < 7 ? cp[1] : cp[3];
          if (hsh < 0.04) c = cp[2];
        } else if (t === T.COBBLE) {
          const row = py >> 3, ox = (row & 1) * 6, col = (px + ox) / 12 | 0, fx = (px + ox) % 12, fy = py & 7;
          if (fx === 0 || fy === 0) c = mortar; else { c = stoneC[(hash2(col, row) * 4) | 0]; if (fy === 1 || fx === 1) c = stoneC[3]; if (hsh < 0.03) c = mortar; }
        } else if (t === T.FIELD) {
          const fy = py % 8; c = fy < 2 ? pal[t][3] : fy < 5 ? pal[t][0] : pal[t][1]; if (hsh < 0.06) c = pal[t][2];
        } else if (t === T.BRIDGE) {
          const fx = px % 6; c = fx === 0 ? pal[t][3] : pal[t][(hash2(px / 6 | 0, 9) * 3) | 0]; if ((py & 15) === 1 || (py & 15) === 14) c = pal[t][3];
        } else if (t === T.WALL) {
          c = pal[t][hsh < 0.3 ? 1 : 0];
        } else {
          const p = pal[t];
          c = patch < 0.42 ? p[1] : patch > 0.62 ? p[2] : p[0];
          if (hsh < 0.07) c = p[3]; else if (hsh > 0.95) c = p[2];
          if (t === T.WATER || t === T.POOL || t === T.LAVA) {
            /* margem: borda clara logo abaixo da terra */
            const up = tAt(px + Math.round((n1[li] - 0.5) * 11), py - 3 + Math.round((n2[li] - 0.5) * 11));
            if (up !== t && !HARD.has(up)) c = t === T.LAVA ? pal[t][3] : t === T.POOL ? pal[t][2] : C('#8fd0f0');
            else if (((px + (py >> 1) * 3) % 23 === 0) && (py % 7 === 0)) c = p[2];
          } else if (t === T.WASTE || t === T.CRATER || t === T.ASH) {
            if (((px * 7 + py * 3) % 61 === 0) || ((px * 3 - py * 5) % 73 === 0 && hsh < 0.5)) c = p[3];
          } else if (t === T.RUIN) {
            if (patch > 0.66) { const fx = px % 16, fy = py % 16; if (fx === 0 || fy === 0) c = p[3]; else c = hsh < 0.5 ? C('#c9b98f') : C('#bfae84'); }
          } else if (t === T.SNOW) {
            if (patch < 0.36) c = C('#cfdde8');
          }
        }
        d[py * w + px] = c;
      }
    }
    x.putImageData(im, 0, 0);
    /* decalques planos: tufos, flores, rachaduras, brasas… */
    const R = G.seeded(77);
    const dot = (px, py, c, ww, hh) => { x.fillStyle = c; x.fillRect(px | 0, py | 0, ww || 1, hh || 1); };
    for (const p of Wd.props) {
      const px = p.x * TS, py = p.y * TS;
      switch (p.t) {
        case 'tuft': { const c = tAt(px | 0, py | 0) === T.GRASS ? '#56963a' : '#3f7a30'; for (let i = 0; i < 3; i++) { dot(px - 3 + i * 3, py - 3 - (i % 2), c, 1, 3); dot(px - 2 + i * 3, py - 4, mix(c, '#c8f080', 0.4)); } p.flat = 1; break; }
        case 'flowers': { const cols = ['#ffffff', '#ffd84a', '#f07aa8', '#8ab8ff', '#ff8a5a']; const c = cols[p.v % 5 | 0]; for (let i = 0; i < 4; i++) { const fx = px - 5 + R() * 10, fy = py - 5 + R() * 8; dot(fx, fy + 1, '#3f8a34', 1, 2); dot(fx - 1, fy, c, 3, 1); dot(fx, fy - 1, c, 1, 3); dot(fx, fy, '#ffe9a0'); } p.flat = 1; break; }
        case 'crack': for (let i = 0, cx = px - 6, cy = py - 2; i < 9; i++) { dot(cx, cy, '#2a2030'); dot(cx, cy + 1, '#b06ae8'); cx += 1 + (R() < 0.3 ? 1 : 0); cy += R() < 0.5 ? 1 : R() < 0.5 ? -1 : 0; } p.flat = 1; break;
        case 'crack_lava': for (let i = 0, cx = px - 6, cy = py - 2; i < 10; i++) { dot(cx, cy, '#ffb040'); dot(cx, cy + 1, '#e0501a'); dot(cx, cy - 1, '#2a2022'); cx += 1 + (R() < 0.3 ? 1 : 0); cy += R() < 0.5 ? 1 : R() < 0.5 ? -1 : 0; } p.flat = 1; break;
        case 'ember': for (let i = 0; i < 4; i++) dot(px - 5 + R() * 10, py - 4 + R() * 6, R() < 0.5 ? '#ff8a3a' : '#ffd070'); p.flat = 1; break;
        case 'snowdrift': x.fillStyle = '#ffffff'; x.fillRect(px - 5, py - 3, 10, 3); x.fillRect(px - 3, py - 4, 6, 1); dot(px - 5, py, '#c4d6e2', 10, 1); p.flat = 1; break;
        case 'lilypad': x.fillStyle = '#6aa85a'; x.fillRect(px - 3, py - 2, 6, 3); x.fillRect(px - 2, py - 3, 4, 5); dot(px, py - 1, '#3f6b5b', 3, 1); dot(px - 1, py - 3, '#f0a0c0', 2, 2); p.flat = 1; break;
        case 'web': x.strokeStyle = 'rgba(230,230,240,.55)'; x.lineWidth = 1; x.beginPath(); for (let a = 0; a < 6; a++) { x.moveTo(px, py - 4); x.lineTo(px + Math.cos(a) * 7, py - 4 + Math.sin(a) * 5); } x.stroke(); p.flat = 1; break;
        case 'bones': dot(px - 4, py - 2, '#e6dcc4', 8, 1); dot(px - 5, py - 3, '#e6dcc4', 2, 3); dot(px + 3, py - 3, '#e6dcc4', 2, 3); dot(px - 1, py - 5, '#f4ecd8', 4, 3); dot(px, py - 4, INK); dot(px + 2, py - 4, INK); dot(px - 4, py - 1, '#a89c80', 8, 1); p.flat = 1; break;
      }
    }
    /* plantações: fileiras de trigo e de ervas */
    for (const f of Wd.fields) for (let ty = f.y0; ty <= f.y1; ty++) for (let tx = f.x0; tx <= f.x1; tx++) for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
      const px = tx * TS + 2 + i * 4, py = ty * TS + 3 + r * 8;
      if (f.crop === 0) { dot(px, py - 3, '#e8c450', 2, 4); dot(px, py - 4, '#f7de8a', 1, 1); dot(px, py + 1, '#a87f24', 1, 2); }
      else { dot(px - 1, py - 1, '#4f9a48', 3, 2); dot(px, py - 2, '#7fd070', 1, 1); }
    }
    terrainCv = cv; return cv;
  };

  /* ================= adereços ================= */
  const P = (A.PROPS = {});
  const blobTree = (p, cx, cy, r, g) => { p.ell(cx, cy, r, r * 0.85, g[1]); p.ell(cx - r * 0.15, cy - r * 0.2, r * 0.8, r * 0.65, g[0]); p.ell(cx - r * 0.35, cy - r * 0.4, r * 0.42, r * 0.32, g[2]); };
  const GREENS = [['#4f9a3c', '#3c7c30', '#6fba50'], ['#5aa544', '#43853a', '#7ac65a'], ['#478f42', '#35733a', '#63ad55'], ['#63a83e', '#4b8a32', '#83c654']];
  P.tree_oak = (v) => { const p = new Pix(36, 46), g = GREENS[v % 4]; p.rect(16, 30, 4, 13, '#7a5232'); p.col(19, 30, 42, '#5a3a22'); p.rect(14, 42, 8, 2, '#6a4628'); p.set(13, 43, '#6a4628'); p.set(22, 43, '#6a4628');
    blobTree(p, 18, 20, 13, g); blobTree(p, 10, 24, 8, g); blobTree(p, 26, 25, 8, g); blobTree(p, 18, 12, 9, g);
    if (v === 1) for (const [x, y] of [[10, 20], [22, 14], [26, 26], [15, 27]]) p.rect(x, y, 2, 2, '#e85a4a'); if (v === 3) for (const [x, y] of [[9, 18], [20, 10], [27, 22], [14, 28], [23, 30]]) p.set(x, y, '#fff0a0');
    return p.outline(INK); };
  P.tree_town = (v) => { const p = new Pix(30, 42), g = [['#6fbf55', '#52a044', '#93db70'], ['#f0a8c0', '#d07898', '#ffd0e0'], ['#6fbf55', '#52a044', '#93db70'], ['#e8c85a', '#c09a3a', '#fff0a0']][v % 4]; p.rect(13, 26, 4, 13, '#8a5e38'); p.col(16, 26, 38, '#63401f'); p.rect(11, 38, 8, 2, '#75502c');
    blobTree(p, 15, 15, 12, g); blobTree(p, 15, 9, 8, g); return p.outline(INK); };
  P.tree_pine = (v) => { const p = new Pix(28, 48), g = [['#3f8a4a', '#2c6a3a', '#5aa862'], ['#377f55', '#285f42', '#4f9d6c']][v % 2]; p.rect(12, 38, 4, 8, '#6a4628'); p.col(15, 38, 45, '#4a3018');
    for (let i = 0; i < 4; i++) { const y = 6 + i * 9, w = 6 + i * 2.6; p.tri(14, y - 6, 14 - w, y + 9, 14 + w, y + 9, g[1]); p.tri(14, y - 6, 14 - w, y + 9, 14, y + 9, g[0]); p.line(14, y - 5, 14 - w * 0.5, y + 3, g[2]); }
    return p.outline(INK); };
  P.tree_snow = (v) => { const p = new Pix(28, 48), g = ['#4a8a7a', '#346a5e', '#eef6fa']; p.rect(12, 38, 4, 8, '#5a4638'); p.col(15, 38, 45, '#3e2e24');
    for (let i = 0; i < 4; i++) { const y = 6 + i * 9, w = 6 + i * 2.6; p.tri(14, y - 6, 14 - w, y + 9, 14 + w, y + 9, g[1]); p.tri(14, y - 6, 14 - w, y + 9, 14, y + 9, g[0]); p.tri(14, y - 6, 14 - w * 0.55, y + 2, 14 + w * 0.5, y + 1, g[2]); p.row(14 - w + 2, 14 - w + 5, y + 8, g[2]); p.row(14 + 2, 14 + w - 3, y + 8, '#cfdde8'); }
    void v; return p.outline(INK); };
  P.tree_dead = (v) => { const p = new Pix(28, 40), c = v % 2 ? '#6a5a50' : '#5a4a48', s = sh(c, 0.7); p.rect(12, 16, 4, 22, c); p.col(15, 16, 37, s); p.rect(10, 37, 8, 2, s);
    p.line(13, 18, 6, 9, c); p.line(6, 9, 3, 10, c); p.line(6, 9, 7, 4, c); p.line(14, 15, 20, 6, c); p.line(20, 6, 24, 7, c); p.line(20, 6, 19, 2, c); p.line(14, 22, 22, 15, c); p.line(13, 24, 5, 19, c); p.line(14, 12, 13, 5, c);
    return p.outline(INK); };
  P.tree_burnt = (v) => { const p = P.tree_dead(v + 1); for (let i = 0; i < p.d.length; i++) { const a = p.d[i] >>> 24; if (a && p.d[i] !== C(INK)) p.d[i] = C(i % 7 === 0 ? '#4a3a38' : '#2c2426'); } p.set(13, 30, '#ff8a3a'); p.set(14, 24, '#ffb040'); p.set(12, 34, '#ff8a3a'); p.set(7, 5, '#ff8a3a'); return p; };
  P.tree_willow = (v) => { const p = new Pix(36, 46), g = [['#5a9a7a', '#3f7a62', '#84c0a0'], ['#4f9080', '#377066', '#78b8a6']][v % 2]; p.rect(16, 24, 4, 19, '#5a4a38'); p.col(19, 24, 42, '#3e3226'); p.rect(14, 42, 8, 2, '#4a3c2c');
    blobTree(p, 18, 15, 13, g); for (let i = 0; i < 9; i++) { const x = 5 + i * 3 + (i % 2), l = 12 + ((i * 7 + v * 3) % 9); p.col(x, 18, 18 + l, i % 2 ? g[0] : g[1]); p.set(x, 18 + l, g[2]); }
    return p.outline(INK); };
  P.bush = (v) => { const p = new Pix(18, 14), g = GREENS[v % 4]; p.ell(9, 8, 7, 5, g[1]); p.ell(8, 7, 5.5, 4, g[0]); p.ell(6, 5.5, 2.5, 1.8, g[2]); if (v % 2) { p.set(5, 8, '#e85a6a'); p.set(11, 6, '#e85a6a'); p.set(9, 10, '#e85a6a'); } return p.outline(INK); };
  P.hedge = (v) => { const p = new Pix(22, 14), g = GREENS[(v + 1) % 4]; p.rect(1, 4, 20, 9, g[1]); p.rect(2, 3, 18, 8, g[0]); p.row(3, 17, 3, g[2]); for (let i = 0; i < 5; i++) p.set(3 + i * 4, 6 + (i % 2) * 2, g[2]); return p.outline(INK); };
  P.flowerbed = (v) => { const p = new Pix(22, 12); p.rect(1, 6, 20, 5, '#7a5232'); p.row(1, 20, 10, '#5a3a22'); p.rect(2, 4, 18, 3, '#4f9a3c'); const cs = ['#f07aa8', '#ffd84a', '#ffffff', '#8ab8ff']; for (let i = 0; i < 6; i++) { p.rect(3 + i * 3, 2 + (i % 2), 2, 2, cs[(i + v) % 4]); p.set(3 + i * 3, 3 + (i % 2), '#ffe9a0'); } return p.outline(INK); };
  const rock = (c) => (v) => { const p = new Pix(20, 16), s = sh(c, 0.72), l = mix(c, '#ffffff', 0.4); p.ell(10, 10, 8, 5, c); p.ell(8 + (v % 2) * 3, 7, 5, 4.5, c); p.ell(7 + (v % 2) * 3, 5.5, 2.5, 1.6, l); p.row(4, 16, 13, s); p.row(5, 15, 14, s); p.col(15, 8, 12, s); p.set(11, 9, s); p.set(12, 10, s); return p.outline(INK); };
  P.rock = rock('#9aa0a8'); P.rock_ash = rock('#4a4244');
  P.rock_snow = (v) => { const p = rock('#8a98a8')(v); const q = new Pix(20, 16); q.blit(p, 0, 0); q.ell(8 + (v % 2) * 3, 5, 4, 2, '#ffffff'); q.row(5, 12, 6, '#eef4f8'); return q; };
  P.stump = () => { const p = new Pix(16, 14); p.rect(3, 5, 10, 7, '#8a5e38'); p.col(12, 5, 11, '#63401f'); p.ell(8, 5, 5, 2.5, '#d8b078'); p.ell(8, 5, 2.5, 1.2, '#b88a50'); p.set(2, 12, '#7a5232'); p.set(13, 12, '#7a5232'); p.row(3, 12, 12, '#63401f'); return p.outline(INK); };
  P.mushroom = (v) => { const p = new Pix(12, 12), c = ['#e85a4a', '#c88ae8', '#e8b84a', '#6ac8d8'][v % 4]; p.rect(5, 6, 2, 5, '#f0e8d8'); p.ell(6, 5, 4.5, 3, c); p.set(4, 4, '#ffffff'); p.set(7, 3, '#ffffff'); p.set(8, 5, '#ffffff'); p.row(2, 9, 7, sh(c, 0.7)); return p.outline(INK); };
  P.pillar = (v) => { const p = new Pix(16, 34), c = '#d8c8a0', s = '#a8986e', l = '#f0e4c0', h = [26, 18, 22, 12][v % 4], y0 = 31 - h; p.rect(3, y0, 10, h, c); p.col(12, y0, 30, s); p.col(11, y0, 30, s); p.col(4, y0, 30, l); p.col(7, y0 + 1, 30, s); p.rect(1, 29, 14, 3, c); p.row(1, 14, 31, s); p.rect(2, y0 - 2, 12, 2, c); p.set(3, y0 - 3, c); p.set(4, y0 - 3, c); p.set(9, y0 - 3, c); p.row(2, 13, y0 - 1, s); if (v % 2) { p.set(6, y0 - 4, '#6aa84f'); p.set(7, y0 - 3, '#6aa84f'); p.col(5, y0, y0 + 5, '#6aa84f'); } return p.outline(INK); };
  P.ruinwall = (v) => { const p = new Pix(26, 22), c = '#c8b88e', s = '#98885e'; p.rect(1, 8, 24, 12, c); p.rect(1, 4, 8, 4, c); p.rect(13, 6, 6, 2, c); if (v % 2) p.rect(19, 2, 6, 6, c); for (let r = 0; r < 4; r++) { p.row(1, 24, 8 + r * 3, s); for (let i = 0; i < 5; i++) p.set(3 + i * 5 + (r % 2) * 2, 9 + r * 3, s), p.set(3 + i * 5 + (r % 2) * 2, 10 + r * 3, s); } p.row(1, 24, 19, s); p.set(4, 5, '#6aa84f'); p.set(5, 4, '#6aa84f'); return p.outline(INK); };
  P.urn = (v) => { const p = new Pix(12, 14), c = v % 2 ? '#b8683a' : '#6a8ab0'; p.ell(6, 8, 4, 4.5, c); p.rect(4, 1, 4, 3, c); p.row(3, 8, 1, mix(c, '#ffffff', 0.4)); p.row(3, 8, 7, '#e2b659'); p.col(9, 6, 10, sh(c, 0.7)); p.set(4, 6, mix(c, '#ffffff', 0.5)); return p.outline(INK); };
  P.tombstone = (v) => { const p = new Pix(14, 16), c = '#8a8e96'; p.rect(3, 4, 8, 10, c); p.rect(4, 2, 6, 2, c); p.col(10, 4, 13, sh(c, 0.7)); p.rect(6, 5, 2, 6, sh(c, 0.6)); p.rect(5, 7, 4, 1, sh(c, 0.6)); p.rect(1, 13, 12, 2, '#6a8a4a'); if (v % 2) p.set(3, 4, '#6aa84f'); return p.outline(INK); };
  P.crystal = (v) => { const p = new Pix(20, 26), c = ['#b06ae8', '#8a5ae8', '#d07ae8', '#9a6af8'][v % 4], s = sh(c, 0.62), l = mix(c, '#ffffff', 0.6); p.tri(10, 1, 5, 20, 15, 20, c); p.tri(10, 1, 10, 22, 15, 20, s); p.tri(4, 10, 1, 22, 7, 22, c); p.tri(16, 12, 13, 22, 19, 22, s); p.line(10, 2, 7, 16, l); p.set(4, 14, l); p.rect(2, 22, 16, 2, '#3a2c48'); return p.outline(INK); };
  P.riftshard = (v) => { const p = new Pix(20, 34), c = '#d070ff', s = '#7a34b8', l = '#ffffff'; p.tri(10, 0, 4, 14, 16, 14, c); p.tri(4, 14, 16, 14, 10, 28, s); p.tri(10, 0, 10, 28, 16, 14, sh(c, 0.8)); p.line(10, 1, 6, 13, l); p.set(8, 8, l); void v; return p.outline('#3a1a5a'); };
  P.icespike = (v) => { const p = new Pix(18, 26), c = '#a8dcf4', s = '#6aa8d0', l = '#ffffff'; p.tri(9, 1 + (v % 3) * 2, 4, 22, 14, 22, c); p.tri(9, 1 + (v % 3) * 2, 9, 23, 14, 22, s); p.tri(4, 12, 1, 23, 7, 23, c); p.tri(14, 14, 12, 23, 17, 23, s); p.line(8, 4 + (v % 3) * 2, 6, 18, l); p.rect(1, 23, 16, 1, '#dfeef6'); return p.outline('#3a5a7a'); };
  P.cattail = (v) => { const p = new Pix(12, 20); for (let i = 0; i < 3; i++) { const x = 2 + i * 4, h = 6 + ((i + v) % 3) * 3; p.col(x, 19 - h - 6, 19, '#4f8a4a'); p.rect(x - 1, 19 - h - 6, 3, 5, '#6a4628'); p.set(x, 19 - h - 7, '#c8b078'); p.line(x + 1, 19, x + 3, 12, '#6aa85a'); } return p.outline(INK); };
  P.lamp = () => { const p = new Pix(12, 34); p.rect(5, 9, 2, 23, '#3a3a44'); p.rect(3, 31, 6, 2, '#2c2c34'); p.rect(2, 3, 8, 7, '#3a3a44'); p.rect(3, 4, 6, 5, '#ffe9a0'); p.rect(4, 5, 4, 3, '#fff8d8'); p.rect(3, 1, 6, 2, '#2c2c34'); p.set(5, 0, '#2c2c34'); p.set(6, 0, '#2c2c34'); return p.outline(INK); };
  P.bench = () => { const p = new Pix(24, 14); p.rect(1, 6, 22, 3, '#a8743c'); p.row(1, 22, 6, '#c8975c'); p.rect(1, 1, 22, 3, '#8f6030'); p.row(1, 22, 1, '#b58045'); p.rect(2, 9, 2, 4, '#5a3a22'); p.rect(20, 9, 2, 4, '#5a3a22'); p.rect(2, 4, 2, 2, '#5a3a22'); p.rect(20, 4, 2, 2, '#5a3a22'); return p.outline(INK); };
  P.barrel = () => { const p = new Pix(14, 16); p.rect(2, 2, 10, 12, '#a8743c'); p.rect(1, 4, 12, 8, '#a8743c'); p.col(11, 3, 13, '#7a5028'); p.col(12, 5, 11, '#7a5028'); p.row(1, 12, 5, '#5a5a66'); p.row(1, 12, 10, '#5a5a66'); p.ell(7, 2.5, 5, 1.6, '#c8975c'); p.col(4, 4, 12, '#c8975c'); return p.outline(INK); };
  P.crate = () => { const p = new Pix(14, 14); p.rect(1, 2, 12, 11, '#b8884c'); p.rect(1, 2, 12, 2, '#d8a868'); p.col(12, 3, 12, '#8a6030'); p.row(1, 12, 12, '#8a6030'); p.line(2, 4, 11, 11, '#8a6030'); p.line(11, 4, 2, 11, '#8a6030'); return p.outline(INK); };
  P.banner = (v) => { const p = new Pix(12, 34), c = ['#3b5fa8', '#c8473d', '#e2b659', '#6a9a5a'][v % 4]; p.rect(1, 2, 2, 31, '#5a4a3a'); p.set(1, 1, '#e2b659'); p.set(2, 1, '#e2b659'); p.rect(3, 4, 7, 14, c); p.tri(3, 18, 10, 18, 6.5, 22, c); p.col(9, 5, 17, sh(c, 0.72)); p.rect(5, 8, 3, 3, '#f8f0d8'); p.set(6, 12, '#f8f0d8'); return p.outline(INK); };
  P.stall = (v) => { const p = new Pix(40, 36), c = v ? '#c8473d' : '#3b7fa8'; p.rect(3, 12, 2, 22, '#7a5232'); p.rect(35, 12, 2, 22, '#7a5232'); p.rect(3, 22, 34, 10, '#a8743c'); p.row(3, 36, 22, '#c8975c'); p.col(36, 23, 31, '#7a5028'); p.row(3, 36, 31, '#7a5028');
    for (let i = 0; i < 9; i++) { p.rect(2 + i * 4, 3, 4, 9, i % 2 ? '#f8f0e0' : c); p.rect(2 + i * 4, 11, 4, 2, i % 2 ? '#d8d0c0' : sh(c, 0.75)); } p.row(2, 37, 3, mix(c, '#ffffff', 0.4));
    const goods = v ? ['#e85a4a', '#ffd84a', '#6aa84f', '#e8a04a'] : ['#b06ae8', '#5bb3f0', '#e2b659', '#74d08a']; for (let i = 0; i < 7; i++) { p.rect(6 + i * 4, 18, 3, 4, goods[i % 4]); p.set(6 + i * 4, 18, '#ffffff'); }
    return p.outline(INK); };
  P.scarecrow = () => { const p = new Pix(20, 30); p.rect(9, 8, 2, 21, '#7a5232'); p.rect(2, 12, 16, 2, '#7a5232'); p.rect(6, 11, 8, 9, '#b85c4c'); p.col(13, 12, 19, '#8a3c30'); p.rect(6, 3, 8, 7, '#e0c070'); p.rect(4, 2, 12, 2, '#b08c40'); p.rect(7, 0, 6, 2, '#b08c40'); p.set(8, 6, INK); p.set(11, 6, INK); p.row(8, 11, 8, INK); p.set(2, 14, '#e0c070'); p.set(17, 14, '#e0c070'); p.set(3, 15, '#e0c070'); return p.outline(INK); };
  P.well = () => { const p = new Pix(24, 30); p.rect(3, 16, 18, 11, '#9aa0a8'); p.row(3, 20, 16, '#c9ced4'); p.col(20, 17, 26, '#6a707a'); for (let i = 0; i < 4; i++) p.set(6 + i * 4, 20, '#6a707a'), p.set(4 + i * 4, 23, '#6a707a'); p.rect(5, 14, 14, 3, '#3f90d2'); p.rect(4, 3, 2, 13, '#7a5232'); p.rect(18, 3, 2, 13, '#7a5232'); p.tri(12, -2, 1, 5, 23, 5, '#a8562b'); p.row(2, 22, 5, '#7a3a1c'); p.col(12, 5, 11, '#d8c8a0'); p.rect(10, 10, 4, 3, '#8a5e38'); return p.outline(INK); };
  P.haystack = () => { const p = new Pix(22, 18); p.ell(11, 11, 9, 6, '#e0b84a'); p.ell(11, 7, 7, 5, '#e8c85a'); p.ell(9, 5, 3, 2, '#f8e08a'); p.row(4, 18, 15, '#b08c30'); for (let i = 0; i < 5; i++) p.line(4 + i * 3, 12, 5 + i * 3, 8, '#c09a3a'); return p.outline(INK); };
  P.woodpile = () => { const p = new Pix(26, 16); for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - (r > 1 ? 1 : 0); i++) { const x = 3 + i * 5 + r * 2 + (r > 1 ? 1 : 0), y = 11 - r * 4; p.ell(x + 2.5, y + 2, 2.6, 2.3, '#d8b078'); p.ell(x + 2.5, y + 2, 1.2, 1, '#b88a50'); p.set(x + 4, y + 3, '#8a5e38'); } p.row(2, 23, 14, '#7a5232'); return p.outline(INK); };
  P.minecart = () => { const p = new Pix(22, 16); p.rect(2, 4, 18, 7, '#6a6a76'); p.row(2, 19, 4, '#8a8a96'); p.col(19, 5, 10, '#4a4a56'); p.ell(8, 3.5, 4, 2, '#c8964a'); p.ell(14, 3, 3, 2, '#9aa0a8'); p.set(13, 2, '#e0a35a'); p.ell(6, 12.5, 2.2, 2.2, '#3a3a44'); p.ell(16, 12.5, 2.2, 2.2, '#3a3a44'); p.set(6, 12, '#8a8a96'); p.set(16, 12, '#8a8a96'); return p.outline(INK); };
  P.rockpile = () => { const p = new Pix(24, 16); p.ell(8, 11, 6, 4, '#9aa0a8'); p.ell(16, 11, 6, 4, '#8a909a'); p.ell(12, 6, 5, 4, '#a8aeb6'); p.ell(11, 5, 2, 1.4, '#d0d6dc'); p.row(4, 20, 14, '#6a707a'); p.set(15, 9, '#e0a35a'); p.set(7, 10, '#e0a35a'); return p.outline(INK); };
  const propCache = new Map();
  A.prop = (t, v) => { const k = t + '|' + (v | 0); let s = propCache.get(k); if (s) return s; const fn = P[t]; if (!fn) return null; const pix = fn(v | 0); s = { cv: pix.canvas(), w: pix.w, h: pix.h }; propCache.set(k, s); return s; };

  /* muralha: segmento por tile, torres de portão */
  A.wallPiece = (kind) => { const k = 'wall|' + kind; let s = propCache.get(k); if (s) return s; let p;
    const c = '#8f8b86', l = '#b0aca6', sd = '#67635f', dk = '#4f4b48';
    if (kind === 'h') { p = new Pix(16, 30); p.rect(0, 8, 16, 22, c); for (let r = 0; r < 4; r++) { p.row(0, 15, 12 + r * 5, sd); p.col((r % 2) * 8 + 3, 13 + r * 5, 16 + r * 5, sd); p.col((r % 2) * 8 + 11, 13 + r * 5, 16 + r * 5, sd); } p.rect(0, 2, 6, 7, c); p.rect(10, 2, 6, 7, c); p.row(0, 5, 2, l); p.row(10, 15, 2, l); p.row(0, 15, 8, l); p.row(0, 15, 29, dk); p.rect(6, 6, 4, 3, sd); }
    else if (kind === 'v') { p = new Pix(16, 30); p.rect(2, 4, 12, 26, c); p.col(2, 4, 29, l); p.col(13, 4, 29, sd); p.col(12, 4, 29, sd); p.rect(2, 0, 12, 5, c); p.row(2, 13, 0, l); p.row(2, 13, 14, sd); p.row(2, 13, 15, l); p.set(7, 8, sd); p.set(8, 22, sd); p.row(2, 13, 29, dk); }
    else { p = new Pix(24, 52); p.rect(2, 14, 20, 38, c); p.col(2, 14, 51, l); p.rect(18, 14, 4, 38, sd); for (let r = 0; r < 6; r++) { p.row(3, 17, 20 + r * 6, sd); p.set(8 + (r % 2) * 5, 22 + r * 6, sd); } p.rect(0, 6, 24, 9, c); p.row(0, 23, 6, l); p.row(0, 23, 14, dk); for (let i = 0; i < 3; i++) p.rect(i * 9, 1, 6, 6, c), p.row(i * 9, i * 9 + 5, 1, l); p.rect(10, 26, 4, 8, dk); p.row(10, 13, 26, sd); p.row(2, 21, 51, dk); }
    p.outline(INK); s = { cv: p.canvas(), w: p.w, h: p.h }; propCache.set(k, s); return s; };

  /* ================= construções ================= */
  const SIGN = {
    crown: (p, x, y) => { p.rect(x + 1, y + 4, 8, 4, '#e2b659'); p.tri(x + 1, y + 4, x + 1, y, x + 3, y + 4, '#e2b659'); p.tri(x + 3, y + 4, x + 5, y, x + 7, y + 4, '#e2b659'); p.tri(x + 7, y + 4, x + 9, y, x + 9, y + 4, '#e2b659'); p.set(x + 5, y + 5, '#c8473d'); },
    sword: (p, x, y) => { p.line(x + 1, y + 8, x + 8, y + 1, '#dfe6ee'); p.line(x + 2, y + 8, x + 9, y + 1, '#aab4c4'); p.line(x + 1, y + 5, x + 4, y + 8, '#e2b659'); },
    bed: (p, x, y) => { p.rect(x, y + 4, 10, 3, '#f0e8d8'); p.rect(x, y + 2, 3, 3, '#8ab8ff'); p.rect(x, y + 7, 1, 2, '#7a5232'); p.rect(x + 9, y + 5, 1, 4, '#7a5232'); p.rect(x + 4, y + 3, 6, 2, '#c8473d'); },
    mug: (p, x, y) => { p.rect(x + 1, y + 3, 6, 6, '#e0a35a'); p.rect(x + 1, y + 1, 6, 2, '#ffffff'); p.rect(x + 7, y + 4, 2, 4, '#e0a35a'); p.set(x + 7, y + 5, '#8a5e38'); p.set(x + 7, y + 6, '#8a5e38'); p.col(x + 3, y + 4, y + 7, '#b07a38'); },
    cross: (p, x, y) => { p.rect(x + 3, y, 4, 10, '#e85a5a'); p.rect(x, y + 3, 10, 4, '#e85a5a'); },
    anvil: (p, x, y) => { p.rect(x, y + 2, 10, 3, '#6a7080'); p.rect(x + 3, y + 5, 4, 2, '#565c6a'); p.rect(x + 1, y + 7, 8, 2, '#6a7080'); p.rect(x - 1, y + 2, 2, 2, '#8a90a0'); },
    potion: (p, x, y) => { p.rect(x + 3, y, 4, 3, '#d8e8f0'); p.ell(x + 5, y + 6.5, 4, 3.5, '#e0506a'); p.set(x + 3, y + 5, '#ffb0c0'); },
    coin: (p, x, y) => { p.ell(x + 5, y + 5, 4.5, 4.5, '#e2b659'); p.ell(x + 5, y + 5, 2.5, 2.5, '#f8e08a'); p.set(x + 5, y + 4, '#b08c30'); p.set(x + 5, y + 5, '#b08c30'); },
    bread: (p, x, y) => { p.ell(x + 5, y + 5.5, 5, 3.5, '#d89a4a'); p.line(x + 2, y + 5, x + 3, y + 3, '#a86a2a'); p.line(x + 5, y + 5, x + 6, y + 3, '#a86a2a'); p.line(x + 8, y + 5, x + 8, y + 4, '#a86a2a'); },
    target: (p, x, y) => { p.ell(x + 5, y + 5, 5, 5, '#f0f0f0'); p.ell(x + 5, y + 5, 3.4, 3.4, '#e85a5a'); p.ell(x + 5, y + 5, 1.6, 1.6, '#f0f0f0'); },
    moon: (p, x, y) => { p.ell(x + 4, y + 5, 4, 4, '#e8f0ff'); p.ell(x + 6, y + 4, 3.2, 3.2, '#3a4a7a'); p.ell(x + 8, y + 7, 1.6, 1.6, '#ffd0a0'); },
    eye: (p, x, y) => { p.ell(x + 5, y + 5, 5, 3, '#f0f0f0'); p.ell(x + 5, y + 5, 2, 2, '#3b7fd0'); p.set(x + 5, y + 5, INK); },
    wheat: (p, x, y) => { p.col(x + 5, y + 3, y + 9, '#a87f24'); p.rect(x + 4, y, 3, 4, '#e2b84a'); p.set(x + 2, y + 3, '#e2b84a'); p.set(x + 8, y + 3, '#e2b84a'); p.set(x + 3, y + 5, '#e2b84a'); p.set(x + 7, y + 5, '#e2b84a'); },
    axe: (p, x, y) => { p.line(x + 2, y + 9, x + 7, y + 1, '#8a5e38'); p.rect(x + 5, y, 4, 4, '#c8d0dc'); p.set(x + 9, y + 2, '#c8d0dc'); },
    pick: (p, x, y) => { p.line(x + 2, y + 9, x + 6, y + 2, '#8a5e38'); p.line(x + 1, y + 3, x + 5, y + 1, '#c8d0dc'); p.line(x + 5, y + 1, x + 9, y + 3, '#c8d0dc'); },
    hammer: (p, x, y) => { p.line(x + 2, y + 9, x + 6, y + 3, '#8a5e38'); p.rect(x + 3, y, 6, 4, '#aab4c4'); },
  };
  const wallFill = (p, x0, y0, w, h, kind, accent) => {
    if (kind === 'timber') { p.rect(x0, y0, w, h, '#ecdcbc'); p.rect(x0, y0 + h - 6, w, 6, '#8f8a84'); p.row(x0, x0 + w - 1, y0 + h - 6, '#b0aca6'); for (let i = 0; i < w; i += 7) p.set(x0 + i, y0 + h - 3, '#67635f');
      const b = '#7a4e2c'; p.rect(x0, y0, 2, h - 6, b); p.rect(x0 + w - 2, y0, 2, h - 6, b); p.rect(x0, y0, w, 2, b); p.rect(x0, y0 + ((h - 6) >> 1), w, 2, b); for (const fx of [0.3, 0.7]) p.rect(x0 + Math.round(w * fx), y0, 2, h - 6, b);
      p.line(x0 + 2, y0 + ((h - 6) >> 1), x0 + Math.round(w * 0.3), y0 + 2, b); p.line(x0 + w - 3, y0 + ((h - 6) >> 1), x0 + Math.round(w * 0.7) + 1, y0 + 2, b); p.col(x0 + w - 1, y0, y0 + h - 1, '#5a3a22'); }
    else if (kind === 'stone' || kind === 'tower') { p.rect(x0, y0, w, h, '#9a968f'); for (let r = 0; r * 6 < h; r++) { p.row(x0, x0 + w - 1, y0 + r * 6, '#74706a'); for (let i = (r % 2) * 5; i < w; i += 10) p.col(x0 + i, y0 + r * 6, Math.min(y0 + h - 1, y0 + r * 6 + 5), '#74706a'); for (let i = (r % 2) * 5 + 2; i < w - 2; i += 10) p.row(x0 + i, x0 + i + 4, y0 + r * 6 + 1, '#b4b0a9'); } p.col(x0 + w - 1, y0, y0 + h - 1, '#5c5852'); p.col(x0 + w - 2, y0, y0 + h - 1, '#74706a'); }
    else if (kind === 'plaster') { p.rect(x0, y0, w, h, '#f2ecdc'); p.rect(x0, y0 + h - 7, w, 7, accent); p.row(x0, x0 + w - 1, y0 + h - 7, mix(accent, '#ffffff', 0.35)); p.rect(x0, y0, w, 2, sh(accent, 0.8)); p.col(x0 + w - 1, y0, y0 + h - 1, '#c8c0aa'); p.col(x0 + w - 2, y0 + 2, y0 + h - 8, '#dcd4c0'); for (let i = 5; i < w - 4; i += 13) p.set(x0 + i, y0 + 8 + (i % 5), '#dcd4c0'); }
    else if (kind === 'marble') { p.rect(x0, y0, w, h, '#eef0f6'); p.rect(x0, y0 + h - 5, w, 5, '#cfd4e2'); p.row(x0, x0 + w - 1, y0 + h - 5, '#ffffff'); p.col(x0 + w - 1, y0, y0 + h - 1, '#b8bece'); for (let i = 9; i < w; i += 17) p.line(x0 + i, y0 + 4, x0 + i + 3, y0 + 12, '#dde1ec'); }
    else if (kind === 'barn') { p.rect(x0, y0, w, h, '#b8483a'); for (let i = 0; i < w; i += 5) p.col(x0 + i, y0, y0 + h - 1, '#8a3028'); p.rect(x0, y0 + h - 4, w, 4, '#8f8a84'); p.rect(x0, y0, w, 2, '#f0e8d8'); p.col(x0 + w - 1, y0, y0 + h - 1, '#6a2420'); }
    else if (kind === 'log') { p.rect(x0, y0, w, h, '#9a6a3c'); for (let r = 0; r * 5 < h; r++) { p.row(x0, x0 + w - 1, y0 + r * 5, '#6b4424'); p.row(x0, x0 + w - 1, y0 + r * 5 + 1, '#c8975c'); } p.rect(x0, y0, 3, h, '#7a5232'); p.rect(x0 + w - 3, y0, 3, h, '#5a3a22'); for (let r = 0; r * 5 < h - 2; r++) { p.ell(x0 + 1.5, y0 + r * 5 + 3, 1.5, 1.5, '#d8b078'); } }
  };
  const roofFill = (p, x0, y0, w, h, col, inset) => {
    const d = sh(col, 0.72), l = mix(col, '#ffffff', 0.28), dd = sh(col, 0.55);
    for (let j = 0; j < h; j++) {
      const k = Math.round(inset * (1 - j / (h - 1)));
      const a = x0 + k, b = x0 + w - 1 - k;
      const rr = (j / 5) | 0, ph = j % 5;
      for (let x = a; x <= b; x++) {
        const cell = (x + (rr % 2) * 3) % 6;
        let c = col;
        if (ph === 0) c = d; else if (ph === 1) c = l; else if (cell === 0) c = d;
        if (x - a < 2) c = l; if (b - x < 2) c = d;
        p.set(x, y0 + j, c);
      }
    }
    p.row(x0 + inset, x0 + w - 1 - inset, y0, l); p.row(x0 + inset, x0 + w - 1 - inset, y0 + 1, mix(col, '#ffffff', 0.12));
    p.row(x0, x0 + w - 1, y0 + h - 1, dd); p.row(x0, x0 + w - 1, y0 + h - 2, d);
  };
  const windowAt = (p, x, y, w, h, lights, box) => { p.rect(x - 1, y - 1, w + 2, h + 2, '#6a4628'); p.rect(x, y, w, h, '#8fc4e0'); p.rect(x, y, w, 2, '#bfe2f2'); p.col(x + (w >> 1), y, y + h - 1, '#6a4628'); p.row(x, x + w - 1, y + (h >> 1), '#6a4628'); p.set(x + 1, y + 1, '#ffffff'); if (box) { p.rect(x - 2, y + h + 1, w + 4, 3, '#8a5e38'); for (let i = 0; i < w + 2; i += 3) p.rect(x - 1 + i, y + h - 1, 2, 2, ['#f07aa8', '#ffd84a', '#ffffff'][i % 3]); } lights.push({ x, y, w, h }); };
  const doorAt = (p, x, y, w, h, col) => { p.rect(x - 1, y - 1, w + 2, h + 1, '#4a3220'); p.rect(x, y, w, h, col); p.row(x + 1, x + w - 2, y - 2, '#4a3220'); p.rect(x + 1, y - 1, w - 2, 1, col); p.col(x + (w >> 1), y, y + h - 1, sh(col, 0.75)); p.col(x + w - 1, y, y + h - 1, sh(col, 0.7)); p.set(x + w - 3, y + (h >> 1), '#e2b659'); p.rect(x - 2, y + h, w + 4, 2, '#a8a49c'); p.row(x - 2, x + w + 1, y + h + 1, '#807c74'); };
  const flag = (p, x, y, c) => { p.col(x, y, y + 11, '#5a4a3a'); p.set(x, y - 1, '#e2b659'); p.tri(x + 1, y, x + 8, y + 2.5, x + 1, y + 5, c); p.set(x + 2, y + 1, mix(c, '#ffffff', 0.4)); };
  const chimney = (p, x, y) => { p.rect(x, y, 7, 14, '#9a6a5a'); p.rect(x - 1, y, 9, 3, '#7a4e42'); p.col(x + 6, y + 3, y + 13, '#6a4236'); for (let r = 0; r < 3; r++) p.row(x, x + 5, y + 5 + r * 3, '#7a4e42'); };
  const signBoard = (p, x, y, name) => { p.rect(x, y, 16, 15, '#8a5e38'); p.rect(x + 1, y + 1, 14, 13, '#f0e2c0'); p.row(x + 1, x + 14, y + 13, '#c8b890'); p.col(x + 14, y + 1, y + 13, '#c8b890'); p.set(x + 3, y - 1, '#3a3a44'); p.set(x + 12, y - 1, '#3a3a44'); p.set(x + 3, y - 2, '#3a3a44'); p.set(x + 12, y - 2, '#3a3a44'); if (SIGN[name]) SIGN[name](p, x + 3, y + 3); };

  /* casa genérica. Devolve {pix, lights, smoke} */
  const house = (W, o) => {
    const H = o.H || 112, p = new Pix(W + 8, H), lights = [];
    const wallH = o.wallH || 36, wy = H - 4 - wallH, x0 = 5, ww = W - 2;
    const roofH = o.roofH || 46, ry = wy - roofH + 6, tier = o.tier || 0;
    /* andar de cima nas construções de nível alto */
    let smoke = null;
    if (tier >= 3 && !o.noUpper) { const uw = Math.round(ww * 0.5), ux = x0 + ((ww - uw) >> 1), uy = ry - 14; wallFill(p, ux, uy, uw, 22, o.wall, o.accent || o.roof); windowAt(p, ux + (uw >> 1) - 4, uy + 6, 8, 8, lights); roofFill(p, ux - 4, uy - 16, uw + 8, 18, o.roof, 5); flag(p, ux + (uw >> 1), uy - 28, o.flag || '#e2b659'); }
    wallFill(p, x0, wy, ww, wallH, o.wall, o.accent || o.roof);
    const dw = o.doorW || 12, dx = 4 + (W >> 1) - (dw >> 1);
    doorAt(p, dx, wy + wallH - 22, dw, 20, o.door || '#8a5e38');
    const winW = 10, winY = wy + 9;
    windowAt(p, x0 + 9, winY, winW, 11, lights, tier >= 1);
    windowAt(p, x0 + ww - 9 - winW, winY, winW, 11, lights, tier >= 1);
    if (W >= 90) { /* janelas extras */ }
    roofFill(p, 1, ry, W + 6, roofH, o.roof, o.inset == null ? 9 : o.inset);
    /* sombra do beiral */
    for (let x = x0; x < x0 + ww; x++) for (let j = 0; j < 2; j++) { const v = p.get(x, wy + j); if (v) p.set(x, wy + j, darken(v)); }
    if (o.chimney !== false) { chimney(p, x0 + ww - 22, ry - 6); smoke = { x: x0 + ww - 18, y: ry - 8 }; }
    if (o.dormer !== false && tier >= 1 && tier < 3) { const cx = 4 + (W >> 1); p.rect(cx - 8, ry + 12, 16, 14, o.wall === 'stone' ? '#9a968f' : '#ecdcbc'); windowAt(p, cx - 4, ry + 15, 8, 8, lights); p.tri(cx, ry + 2, cx - 12, ry + 13, cx + 12, ry + 13, sh(o.roof, 0.85)); p.line(cx, ry + 2, cx - 12, ry + 13, mix(o.roof, '#ffffff', 0.3)); p.line(cx, ry + 2, cx + 12, ry + 13, sh(o.roof, 0.6)); }
    if (o.sign) signBoard(p, dx + dw + 5, wy + 3, o.sign);
    if (tier >= 1) { p.rect(dx - 5, wy + wallH - 20, 3, 5, '#3a3a44'); p.rect(dx - 4, wy + wallH - 19, 1, 3, '#ffe9a0'); lights.push({ x: dx - 5, y: wy + wallH - 20, w: 3, h: 5, lamp: 1 }); }
    if (tier >= 2) { flag(p, 8, ry - 10, o.flag || '#e2b659'); flag(p, W - 6, ry - 10, o.flag || '#e2b659'); p.row(1, W + 6, ry + roofH - 3, '#e2b659'); }
    return { p, lights, smoke, wy, ry, x0, ww, dx, dw };
  };
  const darken = (v) => { const r = v & 255, g = (v >> 8) & 255, b = (v >> 16) & 255; return ((255 << 24) | ((b * 0.72) << 16) | ((g * 0.72) << 8) | (r * 0.72)) >>> 0; };

  const BUILD = {
    generic: (d, tier) => house(96, { wall: d.wall, roof: d.roof, sign: d.sign, tier, accent: d.roof }),
    cidadela: (d, tier) => {
      const H = 132, p = new Pix(104, H), lights = [], by = H - 4;
      const keepY = 44 - (tier >= 2 ? 8 : 0);
      wallFill(p, 22, keepY, 60, by - keepY, 'stone'); for (let i = 0; i < 6; i++) p.rect(22 + i * 10 + 1, keepY - 5, 7, 6, '#9a968f'), p.row(22 + i * 10 + 1, 22 + i * 10 + 7, keepY - 5, '#b4b0a9');
      for (const tx of [4, 76]) { wallFill(p, tx, 34, 24, by - 34, 'stone'); roofFill(p, tx - 3, 10, 30, 26, d.roof, 13); flag(p, tx + 12, -2 + 2, '#e2b659'); windowAt(p, tx + 8, 48, 7, 11, lights); windowAt(p, tx + 8, 76, 7, 11, lights); }
      if (tier >= 2) { wallFill(p, 38, 12, 28, 34, 'stone'); roofFill(p, 34, -8 + 8, 36, 18, d.roof, 16); windowAt(p, 48, 22, 8, 12, lights); flag(p, 52, 0, '#c8473d'); }
      /* portão e brasão */
      p.rect(40, by - 34, 24, 34, '#4a3220'); p.rect(42, by - 32, 20, 32, '#7a5232'); p.row(44, 59, by - 34, '#4a3220'); for (let i = 0; i < 4; i++) p.col(44 + i * 5, by - 32, by - 1, '#5a3a22'); p.rect(42, by - 18, 20, 2, '#3a3a44'); p.set(51, by - 14, '#e2b659'); p.set(52, by - 14, '#e2b659');
      p.rect(46, keepY + 8, 12, 14, '#3b5fa8'); p.tri(46, keepY + 22, 58, keepY + 22, 52, keepY + 28, '#3b5fa8'); SIGN.crown(p, 47, keepY + 11);
      windowAt(p, 28, keepY + 14, 7, 11, lights); windowAt(p, 69, keepY + 14, 7, 11, lights);
      p.rect(36, by, 32, 2, '#a8a49c'); p.rect(33, by - 24, 3, 8, '#3a3a44'); p.rect(34, by - 23, 1, 4, '#ffe9a0'); p.rect(68, by - 24, 3, 8, '#3a3a44'); p.rect(69, by - 23, 1, 4, '#ffe9a0'); lights.push({ x: 33, y: by - 24, w: 3, h: 6, lamp: 1 }, { x: 68, y: by - 24, w: 3, h: 6, lamp: 1 });
      if (tier >= 1) { p.rect(24, keepY + 30, 6, 16, '#c8473d'); p.tri(24, keepY + 46, 30, keepY + 46, 27, keepY + 50, '#c8473d'); p.rect(74, keepY + 30, 6, 16, '#c8473d'); p.tri(74, keepY + 46, 80, keepY + 46, 77, keepY + 50, '#c8473d'); }
      if (tier >= 3) { p.row(22, 81, keepY, '#e2b659'); p.row(4, 27, 34, '#e2b659'); p.row(76, 99, 34, '#e2b659'); }
      return { p, lights };
    },
    torre: (d, tier) => {
      const H = 132, p = new Pix(104, H), lights = [], by = H - 4, top = 30 - tier * 6;
      wallFill(p, 34, top + 12, 36, by - top - 12, 'stone'); wallFill(p, 28, top, 48, 14, 'stone'); for (let i = 0; i < 5; i++) p.rect(28 + i * 10 + 1, top - 6, 7, 7, '#9a968f'), p.row(28 + i * 10 + 1, 28 + i * 10 + 7, top - 6, '#b4b0a9');
      p.rect(30, top + 13, 44, 2, '#5c5852');
      doorAt(p, 46, by - 20, 12, 20, '#7a5232'); windowAt(p, 48, top + 26, 8, 12, lights); windowAt(p, 48, top + 52, 8, 12, lights);
      p.rect(48, top - 12, 8, 6, '#3a3a44'); p.rect(49, top - 16, 6, 5, '#ff9a3a'); p.rect(50, top - 18, 4, 3, '#ffd070'); lights.push({ x: 48, y: top - 18, w: 8, h: 8, lamp: 2 });
      flag(p, 30, top - 18, '#3b5fa8'); flag(p, 72, top - 18, '#3b5fa8'); signBoard(p, 62, by - 34, 'eye');
      if (tier >= 2) p.row(28, 75, top + 12, '#e2b659');
      return { p, lights };
    },
    treino: (d, tier) => {
      const H = 112, p = new Pix(104, H), lights = [], by = H - 4;
      p.rect(6, by - 58, 92, 58, '#d8c090'); for (let i = 0; i < 40; i++) p.set(8 + (i * 37) % 88, by - 56 + (i * 23) % 54, i % 2 ? '#c8ae7a' : '#e6d2a4');
      for (let x = 6; x < 98; x += 9) { p.rect(x, by - 66, 2, 12, '#8a5e38'); p.set(x, by - 67, '#c8975c'); } p.rect(6, by - 62, 92, 2, '#a8743c'); p.rect(6, by - 57, 92, 1, '#7a5232');
      for (let y = by - 54; y < by - 4; y += 9) { p.rect(5, y, 2, 8, '#8a5e38'); p.rect(97, y, 2, 8, '#8a5e38'); }
      for (let x = 6; x < 98; x += 9) { if (x > 40 && x < 60) continue; p.rect(x, by - 10, 2, 10, '#8a5e38'); p.set(x, by - 11, '#c8975c'); } p.rect(6, by - 7, 36, 2, '#a8743c'); p.rect(62, by - 7, 36, 2, '#a8743c');
      const dummy = (x, y) => { p.rect(x + 3, y + 6, 2, 16, '#7a5232'); p.rect(x, y + 6, 8, 9, '#e0c070'); p.col(x + 7, y + 7, y + 14, '#b08c40'); p.rect(x + 1, y, 6, 6, '#e8d090'); p.rect(x - 3, y + 8, 14, 2, '#7a5232'); p.set(x + 2, y + 2, INK); p.set(x + 5, y + 2, INK); p.rect(x + 2, y + 9, 4, 3, '#c8473d'); };
      dummy(16, by - 46); dummy(34, by - 40); if (tier >= 1) dummy(74, by - 42);
      p.rect(60, by - 50, 2, 22, '#7a5232'); p.ell(61, by - 46, 7, 7, '#f0f0f0'); p.ell(61, by - 46, 4.6, 4.6, '#e85a5a'); p.ell(61, by - 46, 2.2, 2.2, '#f0f0f0'); p.set(61, by - 46, '#e85a5a');
      p.rect(78, by - 26, 16, 2, '#7a5232'); p.rect(79, by - 24, 2, 14, '#7a5232'); p.rect(91, by - 24, 2, 14, '#7a5232'); p.line(82, by - 27, 83, by - 14, '#c8d0dc'); p.line(86, by - 27, 86, by - 13, '#c8d0dc'); p.line(90, by - 27, 89, by - 14, '#8a5e38');
      signBoard(p, 44, by - 78, 'target'); p.rect(51, by - 62, 2, 4, '#3a3a44');
      if (tier >= 2) { flag(p, 8, by - 82, '#c8473d'); flag(p, 94, by - 82, '#c8473d'); }
      return { p, lights };
    },
    santuario: (d, tier) => {
      const H = 124, p = new Pix(104, H), lights = [], by = H - 4;
      p.rect(6, by - 6, 92, 6, '#dfe3ee'); p.row(6, 97, by - 6, '#ffffff'); p.rect(10, by - 10, 84, 4, '#eef0f6'); p.row(10, 93, by - 10, '#ffffff');
      wallFill(p, 16, by - 50, 72, 40, 'marble');
      p.rect(44, by - 34, 16, 24, '#2c3a6a'); p.rect(46, by - 32, 12, 22, '#4a5fa8'); p.row(46, 57, by - 32, '#8ab8ff'); lights.push({ x: 46, y: by - 32, w: 12, h: 20 });
      for (const cx of [16, 34, 62, 80]) { p.rect(cx, by - 48, 8, 38, '#f8f9fc'); p.col(cx + 6, by - 48, by - 11, '#cfd4e2'); p.col(cx + 7, by - 48, by - 11, '#b8bece'); p.col(cx + 3, by - 46, by - 12, '#dde1ec'); p.rect(cx - 1, by - 50, 10, 3, '#ffffff'); p.rect(cx - 1, by - 13, 10, 3, '#dfe3ee'); }
      p.tri(52, by - 78, 8, by - 50, 96, by - 50, '#eef0f6'); p.tri(52, by - 72, 20, by - 52, 84, by - 52, '#dfe3ee'); p.line(52, by - 78, 8, by - 50, '#ffffff'); p.line(52, by - 78, 96, by - 50, '#b8bece'); p.row(8, 96, by - 50, '#b8bece');
      p.ell(48, by - 60, 5, 5, '#e8f0ff'); p.ell(50, by - 61, 4, 4, '#dfe3ee'); p.ell(58, by - 58, 3, 3, '#ffd0a0');
      if (tier >= 1) { p.ell(52, by - 84, 12, 9, '#8ab8ff'); p.ell(49, by - 87, 6, 4, '#bfd8ff'); p.rect(40, by - 82, 24, 6, '#8ab8ff'); p.row(40, 63, by - 77, '#5a8ad0'); p.col(52, by - 100, by - 92, '#e2b659'); p.ell(52, by - 101, 2, 2, '#fff0a0'); }
      if (tier >= 2) { p.row(8, 96, by - 51, '#e2b659'); flag(p, 12, by - 66, '#8ab8ff'); flag(p, 90, by - 66, '#8ab8ff'); }
      return { p, lights };
    },
    fazenda: (d, tier) => { const r = house(96, { wall: 'barn', roof: d.roof, tier, door: '#f0e8d8', doorW: 20, chimney: false, dormer: false, sign: 'wheat', roofH: 50, inset: 16, noUpper: 1 }); const p = r.p; p.line(r.dx + 1, r.wy + 15, r.dx + 18, r.wy + 33, '#b8483a'); p.line(r.dx + 18, r.wy + 15, r.dx + 1, r.wy + 33, '#b8483a'); p.rect(48, r.ry + 14, 10, 10, '#4a3220'); p.rect(49, r.ry + 15, 8, 8, '#e0b84a'); return r; },
    lenharia: (d, tier) => { const r = house(96, { wall: 'log', roof: d.roof, tier, sign: 'axe', dormer: false, noUpper: 1 }); return r; },
    pedreira: (d, tier) => { const r = house(96, { wall: 'stone', roof: d.roof, tier, sign: 'pick', dormer: false, noUpper: 1, roofH: 40 }); return r; },
  };
  const bcache = new Map();
  /* lvl 0 = terreno vago; dmg = danificada */
  A.building = (id, lvl, dmg) => {
    const tier = lvl <= 0 ? -1 : lvl < 3 ? 0 : lvl < 6 ? 1 : lvl < 10 ? 2 : 3;
    const key = id + '|' + tier + '|' + (dmg ? 1 : 0); let s = bcache.get(key); if (s) return s;
    const d = G.BLD[id]; let r;
    if (tier < 0) {
      const p = new Pix(104, 112), by = 108;
      p.rect(6, by - 58, 92, 58, '#b89868'); for (let i = 0; i < 60; i++) p.set(8 + (i * 37) % 88, by - 56 + (i * 23) % 54, i % 2 ? '#a88858' : '#c8a878');
      for (const [x, y] of [[6, by - 60], [96, by - 60], [6, by - 8], [96, by - 8]]) { p.rect(x, y, 2, 8, '#8a5e38'); p.set(x, y - 1, '#e85a5a'); }
      p.line(7, by - 57, 97, by - 57, '#e8d8a8'); p.line(7, by - 5, 97, by - 5, '#e8d8a8');
      p.rect(51, by - 30, 2, 14, '#7a5232'); signBoard(p, 44, by - 44, 'hammer'); p.rect(20, by - 20, 14, 5, '#a8743c'); p.rect(22, by - 24, 10, 4, '#c8975c'); p.ell(76, by - 16, 7, 4, '#9aa0a8');
      r = { p, lights: [] };
    } else r = (BUILD[id] || BUILD.generic)(d, tier);
    if (dmg) { const p = r.p; for (let i = 0; i < p.d.length; i++) if (p.d[i] >>> 24) p.d[i] = darken(p.d[i]); for (let k = 0; k < 5; k++) { let x = 20 + k * 15, y = 40 + (k * 13) % 30; for (let i = 0; i < 12; i++) { p.set(x, y, INK); x += (i % 3) - 1; y += 1; } } r.lights = []; }
    r.p.outline(INK);
    s = { cv: r.p.canvas(), w: r.p.w, h: r.p.h, lights: r.lights || [], smoke: r.smoke || null };
    bcache.set(key, s); return s;
  };
  const hcache = new Map();
  A.cottage = (i) => { let s = hcache.get(i); if (s) return s; const roofs = ['#b04832', '#b87b34', '#4e6073', '#5c7042', '#984634', '#7a5a8a']; const r = house(64, { wall: i % 3 === 1 ? 'plaster' : 'timber', roof: roofs[i % roofs.length], accent: roofs[(i + 2) % roofs.length], tier: i % 2, H: 84, wallH: 30, roofH: 36, inset: 7, doorW: 10, dormer: false, noUpper: 1 }); r.p.outline(INK); s = { cv: r.p.canvas(), w: r.p.w, h: r.p.h, lights: r.lights, smoke: r.smoke }; hcache.set(i, s); return s; };

  /* portal e fonte (as partes animadas são desenhadas pelo render) */
  A.portalSprite = () => { let s = propCache.get('portal'); if (s) return s; const p = new Pix(56, 60), c = '#8a8690', l = '#b4b0ba', d = '#5a5662';
    p.rect(4, 50, 48, 8, c); p.row(4, 51, 50, l); p.row(4, 51, 57, d); p.rect(8, 46, 40, 5, c); p.row(8, 47, 46, l);
    for (let a = 0; a <= 32; a++) { const t = Math.PI * (a / 32), x = 28 - Math.cos(t) * 19, y = 28 - Math.sin(t) * 22; p.ell(x, y, 4, 4, a % 4 < 2 ? c : l); }
    p.rect(5, 26, 8, 22, c); p.rect(43, 26, 8, 22, c); p.col(5, 26, 47, l); p.col(50, 26, 47, d); p.col(12, 28, 47, d);
    for (const [x, y] of [[8, 30], [46, 30], [8, 40], [46, 40], [28, 5], [16, 11], [40, 11]]) { p.rect(x, y, 2, 3, '#d070ff'); p.set(x, y, '#ffffff'); }
    p.outline(INK); s = { cv: p.canvas(), w: 56, h: 60 }; propCache.set('portal', s); return s; };
  A.fountainSprite = () => { let s = propCache.get('fountain'); if (s) return s; const p = new Pix(44, 38), c = '#aaa69d', l = '#d0ccc4', d = '#7d7870';
    p.ell(22, 26, 20, 10, c); p.ell(22, 25, 18, 8, '#4a9ada'); p.ell(22, 24, 14, 5.5, '#6ab4ea'); p.row(4, 39, 31, d); p.row(8, 35, 34, d); p.ell(22, 30, 19, 5, c); p.ell(22, 25, 18, 8, '#4a9ada'); p.ell(20, 23, 10, 3.5, '#7ac4f4');
    for (let a = 0; a < 20; a++) { const t = (a / 20) * 6.283; p.set(22 + Math.cos(t) * 19.5, 26 + Math.sin(t) * 9.5, l); }
    p.rect(19, 10, 6, 16, c); p.col(19, 10, 25, l); p.col(24, 10, 25, d); p.ell(22, 10, 8, 3, c); p.ell(22, 9, 6.5, 2, '#6ab4ea'); p.row(15, 29, 12, d); p.rect(20, 3, 4, 6, c); p.ell(22, 3, 3, 2, l);
    p.outline(INK); s = { cv: p.canvas(), w: 44, h: 38 }; propCache.set('fountain', s); return s; };
  A.boardSprite = () => { let s = propCache.get('board'); if (s) return s; const p = new Pix(26, 30); p.rect(2, 8, 2, 20, '#7a5232'); p.rect(22, 8, 2, 20, '#7a5232'); p.rect(1, 6, 24, 15, '#a8743c'); p.rect(2, 7, 22, 13, '#c8975c'); p.tri(13, 0, 0, 6, 26, 6, '#8a4a2e'); p.row(0, 25, 6, '#63401f');
    p.rect(4, 9, 6, 7, '#f8f0d8'); p.rect(11, 8, 5, 6, '#f0e2c0'); p.rect(17, 10, 5, 8, '#f8f0d8'); p.rect(9, 15, 6, 4, '#f0e2c0'); p.set(6, 9, '#e85a5a'); p.set(13, 8, '#e85a5a'); p.set(19, 10, '#5bb3f0'); p.row(5, 8, 12, '#a89878'); p.row(18, 20, 13, '#a89878'); p.row(18, 20, 15, '#a89878');
    p.outline(INK); s = { cv: p.canvas(), w: 26, h: 30 }; propCache.set('board', s); return s; };
})();
