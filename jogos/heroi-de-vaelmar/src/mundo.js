/* ===== Terreno no estilo do original (v3.27.3) =====
   Substitui a pintura do mundo: grama lisa com tufos e flores, massas densas de pinheiros em grade
   alternada com fileira de troncos na borda sul, trilhas bege estreitas com contorno e sem manchas
   de terra. A lógica (TMAP, zonas, colisões) não muda. Medidas e cores: ESPECIFICACAO-TELAS.md. */
(() => {
  /* ---------- paleta do dia, amostrada dos quadros do original ---------- */
  for (const [k, v] of Object.entries({
    g0: '#2f8a3c', g1: '#389542', g2: '#3e9c48', g3: '#44a44e', g4: '#52b559', gf: '#f4f1dc', gy: '#ffd84a', gp: '#ff9ab8',
    dg0: '#244f34', dg1: '#2d5f3c', dg2: '#356b44', dg3: '#3f794c', dg4: '#4f8c5a',
    fg: '#1a5a41', dfg: '#10392f',
  })) C[k] = hexI(v);
  const PATH = { t1: '#d8bd90', t2: '#cfb386', hi: '#e8d4ab', rimD: '#8a6643', rimM: '#b5905f', rimL: '#c2a074', sh: '#2f7a3a' };
  const PT = Object.fromEntries(Object.entries(PATH).map(([k, v]) => [k, hexI(v)]));

  /* ---------- pinheiro 15 × 17 gerado por regra ---------- */
  function pineCanvas(pal, variant) {
    const W = 15, H = 17, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const tiers = [[0, 7, 0, 4], [4, 12, 1, 6], [8, 15, 2, 7]]; /* y0, y1, meia-largura em y0, em y1 */
    const inside = (x, y) => tiers.some(([y0, y1, h0, h1]) => y >= y0 && y < y1 && Math.abs(x - 7) <= Math.round(h0 + (h1 - h0) * (y - y0) / (y1 - y0 - 1)));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!inside(x, y)) continue;
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      const tier = tiers.findIndex(([y0, y1]) => y >= y0 && y < y1), t = tiers[tier] || tiers[tiers.length - 1], band = (y - t[0]) / (t[1] - t[0]);
      let col = x < 6 ? pal.L : x < 9 ? pal.M : pal.D;
      if (band > .78) col = x < 6 ? pal.M : pal.D;
      if (variant && ((x * 3 + y * 5) % 7 === 0)) col = pal.L;
      if (edge) col = pal.o;
      g.fillStyle = col; g.fillRect(x, y, 1, 1);
    }
    return c;
  }
  const trunk = document.createElement('canvas'); trunk.width = 5; trunk.height = 4;
  { const g = trunk.getContext('2d'); g.fillStyle = '#2b1c12'; g.fillRect(0, 0, 5, 4); g.fillStyle = '#7b5636'; g.fillRect(1, 0, 3, 3); g.fillStyle = '#a07448'; g.fillRect(1, 0, 1, 3); }
  const treeKind = { [T.FOREST]: { o: '#0e3a2a', L: '#47a06a', M: '#2d7d52', D: '#1d5a3d' }, [T.DFOREST]: { o: '#082a24', L: '#2f7a62', M: '#1f5a48', D: '#154236' } };
  initGlyphs = () => { PINES = {}; for (const t of [T.FOREST, T.DFOREST]) PINES[t] = [pineCanvas(treeKind[t], 0), pineCanvas(treeKind[t], 1)]; };

  /* ---------- trilhas: distância até a polilinha de cada estrada ---------- */
  const ROAD_PATHS = []; let roadIndex = null; const CELL = 64;
  const baseRoad = road;
  road = function (a, b) {
    const steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2), pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, x = a[0] + (b[0] - a[0]) * t + (vn(i / 9, a[0]) - .5) * 1.6, y = a[1] + (b[1] - a[1]) * t + (vn(i / 9, a[1] + 7) - .5) * 1.6;
      pts.push([(x + .35) * TILE, (y + .35) * TILE]);
    }
    /* ligações automáticas entre dois lugares só garantem o caminho; a trilha desenhada vem do mapa */
    const isPoi = p => POIS.some(q => q.tx === p[0] && q.ty === p[1]);
    if (!(isPoi(a) && isPoi(b))) { ROAD_PATHS.push(pts); roadIndex = null; }
    baseRoad(a, b);
  };
  function buildIndex() {
    roadIndex = new Map();
    for (const pts of ROAD_PATHS) for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      for (let cx = Math.floor((Math.min(x0, x1) - 30) / CELL); cx <= Math.floor((Math.max(x0, x1) + 30) / CELL); cx++)
        for (let cy = Math.floor((Math.min(y0, y1) - 30) / CELL); cy <= Math.floor((Math.max(y0, y1) + 30) / CELL); cy++) {
          const k = cx + ',' + cy; if (!roadIndex.has(k)) roadIndex.set(k, []); roadIndex.get(k).push(x0, y0, x1, y1);
        }
    }
  }
  function roadDist(px, py) {
    const segs = roadIndex.get(Math.floor(px / CELL) + ',' + Math.floor(py / CELL)); if (!segs) return 1e9;
    let best = 1e9;
    for (let i = 0; i < segs.length; i += 4) {
      const x0 = segs[i], y0 = segs[i + 1], dx = segs[i + 2] - x0, dy = segs[i + 3] - y0, l2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / l2)), ex = x0 + dx * t - px, ey = y0 + dy * t - py, d = ex * ex + ey * ey;
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  }
  const PATHABLE = new Set([T.GRASS, T.DIRT, T.SAND, T.ROCKY, T.SWAMP, T.FLOOR]);
  function onPath(px, py, cls) {
    if (!PATHABLE.has(cls)) return false;
    const d = roadDist(px, py); if (d > 30) return false;
    const hw = 16 + (vn(px / 43, py / 43) - .5) * 6 + (vn(px / 13, py / 13) - .5) * 3;
    return d < hw;
  }

  /* ---------- limpeza do mapa: sem manchas de terra nem pontos soltos de floresta ---------- */
  const baseGen = genWorld;
  genWorld = () => {
    ROAD_PATHS.length = 0; roadIndex = null;
    baseGen();
    const copy = TMAP.slice();
    for (let y = 1; y < WH - 1; y++) for (let x = 1; x < WW - 1; x++) {
      if (copy[y * WW + x] !== T.FOREST) continue;
      let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && isForest(copy[(y + dy) * WW + x + dx])) n++;
      if (n < 2) TMAP[y * WW + x] = T.GRASS;
    }
    CHUNKS.clear();
  };
  const basePick = pickT;
  pickT = (px, py) => { const t = basePick(px, py); return t === T.DIRT ? T.GRASS : t; };

  /* ---------- pintura de um bloco 256 × 256 ---------- */
  const TUFT = [[0, 0], [4, 0], [1, 1], [3, 1], [2, 2]];
  const FLOWER = ['#f4f1dc', '#ffd84a', '#ff9ab8', '#e0524a', '#6aa8ff', '#c070f0'];
  paintChunk = function (cx, cy) {
    if (!roadIndex) buildIndex();
    const M = 14, W = CH + M * 2, X0 = cx * CH - M, Y0 = cy * CH - M;
    const cls = new Uint8Array(W * W);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) cls[y * W + x] = pickT(X0 + x, Y0 + y);
    const at = (x, y) => cls[clamp(y, 0, W - 1) * W + clamp(x, 0, W - 1)];
    /* máscara da trilha com 2 px de margem para o contorno */
    const PM = CH + 4, pm = new Uint8Array(PM * PM);
    for (let y = 0; y < PM; y++) for (let x = 0; x < PM; x++) pm[y * PM + x] = onPath(cx * CH + x - 2, cy * CH + y - 2, at(x - 2 + M, y - 2 + M)) ? 1 : 0;
    const isP = (x, y) => pm[(y + 2) * PM + x + 2] === 1;
    const cv = document.createElement('canvas'); cv.width = CH; cv.height = CH;
    const g = cv.getContext('2d'), img = g.createImageData(CH, CH), buf = new Uint32Array(img.data.buffer);
    for (let y = 0; y < CH; y++) for (let x = 0; x < CH; x++) {
      const lx = x + M, ly = y + M, t = at(lx, ly), px = X0 + lx, py = Y0 + ly, q = hn(px, py, 11);
      const zk = ZGRID[clamp(Math.floor(py / TILE), 0, WH - 1) * WW + clamp(Math.floor(px / TILE), 0, WW - 1)];
      let col;
      if (t === T.GRASS || t === T.FOREST || t === T.DFOREST) {
        if (isForest(t)) col = t === T.FOREST ? C.fg : C.dfg;
        else {
          const dark = zk === 'S', pre = dark ? 'dg' : 'g';
          const n = vn(px / 90, py / 90) * .8 + vn(px / 31 + 9, py / 31 + 3) * .2;
          let i = 2; if (n > .64 + bay(px, py) * .04) i = 3; else if (n < .3 + bay(px, py) * .04) i = 1;
          col = C[pre + i];
        }
      } else if (t === T.WATER) {
        const n = vn(px / 28, py / 28); col = n > .6 ? C.w2 : n < .35 ? C.w0 : C.w1;
        const wv = hn(Math.floor(px / 10), Math.floor(py / 4), 31);
        if (wv > .94 && (px % 10) < 5 && py % 4 === 0) col = C.w3;
      } else if (t === T.SWAMP) {
        const pud = vn(px / 20 + 9, py / 20 + 4);
        col = pud > .6 ? (pud > .7 ? C.p0 : C.p1) : (vn(px / 12, py / 12) > .5 ? C.s2 : C.s1);
        if (pud <= .6 && q > .97) col = C.s3;
      } else if (t === T.ROCKY) {
        const n = vn(px / 20, py / 20 + 3); col = n > .6 ? C.r3 : n < .32 ? C.r1 : C.r2;
        if (q > .975) col = C.r4; else if (q < .02) col = C.r0;
      } else if (t === T.CLIFF) {
        const n = vn(px / 16, py / 16); col = n > .62 ? C.c4 : n < .35 ? C.c2 : C.c3;
        if (q > .96) col = C.c5;
      } else if (t === T.SAND) {
        const n = vn(px / 18, py / 18 + 2); col = n > .6 ? C.sa3 : n < .32 ? C.sa1 : C.sa2; if (q < .015) col = C.sa0;
      } else if (t === T.FLOOR) {
        const bx = Math.floor((px + (Math.floor(py / 7) % 2) * 5) / 10), by = Math.floor(py / 7);
        const mx = (px + (Math.floor(py / 7) % 2) * 5) % 10, my = py % 7;
        col = (mx === 0 || my === 0) ? C.fl0 : (hn(bx, by, 41) > .5 ? C.fl2 : C.fl1);
        if (mx === 1 && my === 1) col = C.fl3;
      } else if (t === T.BRIDGE) {
        const vert = tAt(Math.floor(px / TILE) - 1, Math.floor(py / TILE)) === T.WATER || tAt(Math.floor(px / TILE) + 1, Math.floor(py / TILE)) === T.WATER;
        const k = vert ? py : px; col = (k % 7 === 0) ? C.b0 : (hn(Math.floor(k / 7), 0, 43) > .5 ? C.b2 : C.b3);
      }
      if (zk === 'J' && t !== T.WATER && t !== T.BRIDGE) col = hexI(t === T.CLIFF ? '#8babc0' : q > .4 ? '#cbdde3' : '#bacdd6');
      if (zk === 'R' && t !== T.BRIDGE) col = hexI(t === T.CLIFF ? '#3e284a' : q > .5 ? '#51405b' : '#47364f');
      if (zk === 'A' && t === T.GRASS) col = hexI(q > .6 ? '#77966a' : '#6b895f');
      /* bordas */
      const up = at(lx, ly - 1), dn = at(lx, ly + 1), lf = at(lx - 1, ly), rt = at(lx + 1, ly);
      if (t === T.WATER) {
        const near = d => [at(lx, ly - d), at(lx, ly + d), at(lx - d, ly), at(lx + d, ly)].some(v => v !== T.WATER && v !== T.BRIDGE);
        if (near(1)) col = C.w4; else if (near(2) || near(3)) col = C.w3;
      } else if (t === T.SAND && [up, dn, lf, rt].some(v => v === T.WATER)) col = C.sa0;
      else if (t === T.CLIFF) {
        let face = 0; for (let k = 1; k <= 12; k++) if (at(lx, ly + k) !== T.CLIFF) { face = k; break; }
        if (face) col = face === 1 ? C.c0 : ((px % 5 === 0) ? C.c0 : (face < 6 ? C.c1 : C.c2));
        else if (up !== T.CLIFF || lf !== T.CLIFF || rt !== T.CLIFF) col = C.c5;
      } else if (!isForest(t) && t !== T.WATER) {
        if (up === T.CLIFF || at(lx, ly - 2) === T.CLIFF || at(lx, ly - 3) === T.CLIFF) col = darkI(col);
      }
      /* trilha */
      if (isP(x, y)) {
        if (!isP(x, y - 1)) col = PT.rimD;
        else if (!isP(x, y - 2) || !isP(x - 1, y) || !isP(x + 1, y)) col = PT.rimM;
        else if (!isP(x, y + 1)) col = PT.rimL;
        else { const n = vn(px / 9 + 4, py / 9); col = n > .6 ? PT.t1 : PT.t2; if (q > .985) col = PT.hi; else if (q < .012) col = PT.rimM; }
      } else if (isP(x, y + 1) && t === T.GRASS) col = PT.sh; /* grama pisada logo acima da borda */
      buf[y * CH + x] = col;
    }
    g.putImageData(img, 0, 0);
    /* tufos e flores sobre a grama */
    const GX = 15, GY = 12, i0 = Math.floor(X0 / GX), i1 = Math.ceil((X0 + W) / GX), j0 = Math.floor(Y0 / GY), j1 = Math.ceil((Y0 + W) / GY);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const h = hn(i, j, 61); if (h < .5) continue;
      const ax = i * GX + 1 + Math.floor(hn(i, j, 62) * (GX - 6)), ay = j * GY + 1 + Math.floor(hn(i, j, 63) * (GY - 5));
      const lx = ax - X0, ly = ay - Y0; if (lx < 3 || ly < 3 || lx > W - 4 || ly > W - 4) continue;
      if (at(lx, ly) !== T.GRASS || isP(ax - cx * CH, ay - cy * CH)) continue;
      const zk = ZGRID[clamp(Math.floor(ay / TILE), 0, WH - 1) * WW + clamp(Math.floor(ax / TILE), 0, WW - 1)], dark = zk === 'S';
      const dx = ax - cx * CH, dy = ay - cy * CH;
      if (h > .975 && !dark && zk !== 'A' && zk !== 'J' && zk !== 'R') {
        for (let k = 0; k < 7; k++) { g.fillStyle = FLOWER[Math.floor(hn(i, j, 70 + k) * FLOWER.length)]; g.fillRect(dx + (k % 3) * 2, dy + Math.floor(k / 3) * 2 - (k === 6 ? 1 : 0), 1, 1); }
        g.fillStyle = '#2b7536'; g.fillRect(dx + 1, dy + 5, 3, 1);
      } else {
        g.fillStyle = dark ? '#4f8c5a' : '#5ec266'; for (const [ox, oy] of TUFT) g.fillRect(dx + ox, dy + oy, 1, 1);
        g.fillStyle = dark ? '#244f34' : '#2b7536'; g.fillRect(dx + 2, dy + 3, 1, 1);
      }
    }
    /* copas da floresta: grade alternada de pinheiros, troncos na borda sul */
    const SX = 16, SY = 9, j2 = Math.floor((Y0 - 2) / SY), j3 = Math.ceil((Y0 + W + 18) / SY);
    for (let j = j2; j <= j3; j++) {
      const off = (j & 1) ? SX / 2 : 0, a0 = Math.floor((X0 - 16) / SX), a1 = Math.ceil((X0 + W + 16) / SX);
      for (let i = a0; i <= a1; i++) {
        const ax = i * SX + off + Math.floor(hn(i, j, 51) * 2) - 1, ay = j * SY + Math.floor(hn(i, j, 52) * 2);
        const t = pickT(ax, ay); if (!isForest(t)) continue;
        const dx = ax - cx * CH, dy = ay - cy * CH;
        if (!isForest(pickT(ax, ay + 10))) { g.fillStyle = 'rgba(8,30,18,.35)'; g.fillRect(dx - 6, dy + 1, 13, 3); g.drawImage(trunk, dx - 2, dy - 1); }
        g.drawImage(PINES[t][hn(i, j, 53) > .5 ? 1 : 0], dx - 7, dy - 14);
      }
    }
    return cv;
  };
})();
