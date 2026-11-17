/* Aurora 043 · heróis em 64×64.
   Cada quadro é desenhado num buffer de 64×64 pixels (antes: 26×30) e mostrado no mapa em meia escala,
   então o herói ocupa quase o mesmo espaço com o dobro de detalhe. Tudo é pixel art sem suavização:
   formas → máscara → chanfro de luz/sombra → contorno. Corpo, roupa de classe, armadura, elmo, botas,
   manoplas, cinturão, amuleto e arma são camadas; a arma muda de silhueta a cada faixa de rank. */
(function () {
  'use strict';
  if (G.HEADLESS || !G.A) return;
  const A = G.A, W = 64, H = 64, N = W * H, C = A.C, mix = A.mix, shade = A.shade, GY = 59;
  const INK = C('#1a1524');

  /* ---------- cores: rampa de 5 tons com sombra fria e luz quente ---------- */
  const rampC = new Map();
  const ramp = (hex) => {
    let r = rampC.get(hex); if (r) return r;
    r = [C(mix(shade(hex, 0.46), '#1d1533', 0.34)), C(mix(shade(hex, 0.7), '#2b1f47', 0.2)), C(hex), C(mix(hex, '#fff3d2', 0.3)), C(mix(hex, '#fffdf0', 0.58))];
    if (rampC.size > 600) rampC.clear(); rampC.set(hex, r); return r;
  };
  const darker = (u) => { const r = (u & 255) * 0.55, g = ((u >>> 8) & 255) * 0.5, b = ((u >>> 16) & 255) * 0.64; return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0; };

  /* ---------- máscara de trabalho e formas ---------- */
  const M = new Uint8Array(N); let bx0 = W, by0 = H, bx1 = -1, by1 = -1;
  const mClear = () => { if (bx1 >= bx0) for (let y = by0; y <= by1; y++) M.fill(0, y * W + bx0, y * W + bx1 + 1); bx0 = W; by0 = H; bx1 = -1; by1 = -1; };
  const mSet = (x, y, v) => { if (x < 0 || y < 0 || x >= W || y >= H) return; M[y * W + x] = v; if (v) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; } };
  const mRect = (x, y, w, h, v = 1) => { x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) mSet(x + i, y + j, v); };
  const mEll = (cx, cy, rx, ry, v = 1) => { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) mSet(x, y, v); } };
  const mPoly = (pts, v = 1) => {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of pts) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
      let inside = false; const px = x + 0.5, py = y + 0.5;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if ((a[1] > py) !== (b[1] > py) && px < (b[0] - a[0]) * (py - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside; }
      if (inside) mSet(x, y, v);
    }
  };
  /* cápsula afilada: membros, cabos, hastes */
  const mCap = (x0, y0, x1, y1, r0, r1, v = 1) => {
    if (r1 == null) r1 = r0; const R = Math.max(r0, r1), dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1e-6;
    for (let y = Math.floor(Math.min(y0, y1) - R); y <= Math.ceil(Math.max(y0, y1) + R); y++) for (let x = Math.floor(Math.min(x0, x1) - R); x <= Math.ceil(Math.max(x0, x1) + R); x++) {
      const px = x + 0.5 - x0, py = y + 0.5 - y0; let t = (px * dx + py * dy) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const ex = px - dx * t, ey = py - dy * t, r = r0 + (r1 - r0) * t; if (ex * ex + ey * ey <= r * r) mSet(x, y, v);
    }
  };
  const at = (x, y) => x >= 0 && y >= 0 && x < W && y < H && M[y * W + x];
  /* máscara → cor com chanfro (luz em cima/esquerda, sombra embaixo/direita) e contorno interno sobre o que já existe */
  const paint = (D, r, o) => {
    o = o || {}; if (bx1 < bx0) return;
    const lite = o.l == null ? 1 : o.l, dark = o.d == null ? 1 : o.d, side = o.side || 0, w = bx1 - bx0 + 1;
    if (o.contour !== false) for (let y = Math.max(0, by0 - 1); y <= Math.min(H - 1, by1 + 1); y++) for (let x = Math.max(0, bx0 - 1); x <= Math.min(W - 1, bx1 + 1); x++) {
      const i = y * W + x; if (!M[i] && D[i] && !o.keep && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))) D[i] = darker(D[i]);
    }
    for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) {
      const i = y * W + x; if (!M[i]) continue;
      let k = 2;
      if (dark && (!at(x, y + 1) || !at(x + 1, y))) k = 1;
      else if (lite && (!at(x, y - 1) || !at(x - 1, y))) k = 3;
      else if (side && x - bx0 >= w * side) k = 1;
      else if (o.top && y - by0 < o.top) k = 3;
      D[i] = r[k];
    }
    mClear();
  };
  const px = (D, x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) D[y * W + x] = c; };
  const pxIf = (D, x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H && D[y * W + x]) D[y * W + x] = c; };
  const row = (D, x0, x1, y, c) => { for (let x = x0; x <= x1; x++) px(D, x, y, c); };
  const rowIf = (D, x0, x1, y, c) => { for (let x = x0; x <= x1; x++) pxIf(D, x, y, c); };
  const col = (D, x, y0, y1, c) => { for (let y = y0; y <= y1; y++) px(D, x, y, c); };
  const colIf = (D, x, y0, y1, c) => { for (let y = y0; y <= y1; y++) pxIf(D, x, y, c); };
  const outline = (D) => {
    const out = new Uint32Array(D);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (D[i]) continue; if ((x > 0 && D[i - 1]) || (x < W - 1 && D[i + 1]) || (y > 0 && D[i - W]) || (y < H - 1 && D[i + W])) out[i] = INK; }
    return out;
  };
  const toCanvas = (D) => { const cv = A.mk(W, H), c = cv.getContext('2d'), im = c.createImageData(W, H); new Uint32Array(im.data.buffer).set(D); c.putImageData(im, 0, 0); return cv; };

  /* ---------- perfis de classe (roupa sem armadura) ---------- */
  const CLS = {
    esp: { cloth: '#b4533f', pants: '#3f4254', trim: '#e9c07a', leather: '#6e4630', hairOff: 0 },
    cav: { cloth: '#5d7896', pants: '#39465c', trim: '#c9d3dc', leather: '#5c4334', hairOff: 1 },
    arq: { cloth: '#4f7d52', pants: '#5a4a38', trim: '#c9b36a', leather: '#77502f', hairOff: 2 },
    mag: { cloth: '#6a55a8', pants: '#3d3760', trim: '#e7c96a', leather: '#5a4470', hairOff: 3 },
    pal: { cloth: '#d9d2bc', pants: '#5b6170', trim: '#d8a93f', leather: '#7a5a36', hairOff: 4 },
    lad: { cloth: '#3f3f52', pants: '#2c2f3e', trim: '#b0455a', leather: '#4a3a34', hairOff: 5 },
  };
  A.HERO64_CLASSES = CLS;
  const EYE = ['#3b6fb4', '#3f8a5a', '#7a4a2a', '#7450a8', '#2f7f8c', '#a04444'];
  const rankOf = (it) => (it ? (G.EQUIPMENT && G.EQUIPMENT.rankOf ? G.EQUIPMENT.rankOf(it) : Math.max(0, Math.min(7, Number.isInteger(it.rank) ? it.rank : (it.tier || 1) - 1))) : 0);
  const gearPal = (it) => { const p = A.equipmentPalette ? A.equipmentPalette(it) : null; return p || { rank: 0, rar: 0, main: '#a4afb8', dark: '#535a63', mid: '#7b848c', light: '#d6dde2', white: '#fff5da', trim: '#c9b98f', trimD: '#6d6247', gem: '#dce4ee', cloth: '#66636e', leather: '#7f5540', wood: '#765342', woodL: '#b98a58' }; };

  /* ---------- pose: articulações em pixels de 64 ---------- */
  const pose = (o, frame) => {
    const ph = Number((frame.match(/\d$/) || [0])[0]);
    const walk = /^(walk|up|down)\d/.test(frame), back = /^(up|back)/.test(frame), front = /^(down|front)/.test(frame);
    const atk = /atk/i.test(frame), cast = frame.startsWith('cast'), bend = frame.startsWith('bend'), sit = frame.startsWith('sit') || frame.startsWith('sleep');
    const victory = frame.startsWith('victory'), hurt = frame === 'hurt' || frame === 'fall', view = back ? 'back' : front ? 'front' : 'side';
    const wt = o.weaponKind || '';
    const p = { view, ph, frame, walk, atk, cast, bend, sit, victory, hurt, cx: 32, jump: 0, by: 0, lean: 0, eyes: 'open', mouth: 'calm', wAng: 0.2, wBack: view === 'back', farFront: false, glow: 0 };
    if (/idle1$/i.test(frame)) p.by = 1;
    if (walk && (ph === 1 || ph === 3)) p.by = -1;
    if (victory) { p.jump = ph === 1 ? 3 : 0; p.mouth = 'smile'; p.eyes = ph === 1 ? 'happy' : 'open'; }
    if (hurt) { p.lean = -2; p.eyes = 'hurt'; p.mouth = 'open'; }
    if (bend) { p.by = 5 + (ph ? 1 : 0); p.lean = 3; }
    if (sit) { p.by = 8; }
    if (atk) { p.lean = [-1, 2, 2][ph % 3]; p.mouth = ph ? 'open' : 'calm'; p.eyes = 'angry'; }
    if (cast) { p.eyes = ph === 1 ? 'closed' : 'open'; p.glow = ph + 1; }
    const cx = p.cx + p.lean, by = p.by - p.jump, side = view === 'side';
    const hw = side ? 7 : 8;                       // meia largura do tronco
    p.hw = hw; p.top = 28 + by; p.waist = 41 + by; p.hipY = 43 + Math.min(by, 4) - p.jump;
    p.head = { x: cx + (side ? 0.5 : 0) + (bend ? 2 : 0), y: 17 + by + (bend ? 1 : 0) };
    p.tx = cx;
    /* pés */
    const fy = GY - p.jump;
    if (side) {
      const sw = walk ? [5, 0, -5, 0][ph % 4] : atk ? [-1, 3, 3][ph % 3] : 0, lift = walk ? [0, 2, 0, 2][ph % 4] : 0;
      p.footN = { x: 35 + sw, y: fy - (walk && ph === 3 ? lift : 0) }; p.footF = { x: 28 - sw, y: fy - (walk && ph === 1 ? lift : 0) };
      if (atk) { p.footN = { x: 37 + (ph ? 2 : 0), y: fy }; p.footF = { x: 27 - (ph ? 1 : 0), y: fy }; }
    } else {
      const l = walk ? [2, 0, 0, 0][ph % 4] : 0, r = walk ? [0, 0, 2, 0][ph % 4] : 0;
      p.footF = { x: 28, y: fy - l }; p.footN = { x: 36, y: fy - r };
    }
    if (sit) { p.footN = { x: side ? 43 : 37, y: fy }; p.footF = { x: side ? 40 : 27, y: fy }; }
    if (hurt) { p.footN.x += 1; p.footF.x -= 1; }
    /* ombros e mãos (N = lado da arma, à direita do quadro; F = lado de trás) */
    const sy = p.top + 3;
    p.shN = { x: cx + hw - (side ? 1 : 0), y: sy }; p.shF = { x: cx - hw + (side ? 1 : 0), y: sy };
    const swing = walk ? [3, 0, -3, 0][ph % 4] : 0;
    p.hN = { x: p.shN.x + 3 - (side ? swing : 0), y: sy + 12 + (side ? 0 : walk ? [-1, 0, 1, 0][ph % 4] : 0) };
    p.hF = { x: p.shF.x - 2 + (side ? swing : 0), y: sy + 12 + (side ? 0 : walk ? [1, 0, -1, 0][ph % 4] : 0) };
    /* arma em repouso: cada tipo tem um jeito de carregar */
    if (wt === 'espada' || wt === 'machado') { p.hN = { x: p.shN.x + 4, y: sy + 10 }; p.wAng = 0.3; }
    else if (wt === 'lanca') { p.hN = { x: p.shN.x + 4, y: sy + 8 }; p.wAng = 0.06; }
    else if (wt === 'cajado') { p.hN = { x: p.shN.x + 4, y: sy + 8 }; p.wAng = 0.05; }
    else if (wt === 'arco') { p.hN = { x: p.shN.x + 5, y: sy + 8 }; p.wAng = 0.08; }
    else if (wt === 'martelo') { p.hN = { x: p.shN.x + 4, y: sy + 11 }; p.wAng = 0.42; }
    else if (wt === 'adaga') { p.hN = { x: p.shN.x + 4, y: sy + 9 }; p.hF = { x: p.shF.x - 4, y: sy + 9 }; p.wAng = 0.3; p.wAng2 = -0.3; }
    if (walk && side && wt && wt !== 'adaga') { p.hN.x -= swing * 0.5; p.hN.y += ph % 2 ? -1 : 0; }
    if (atk) {
      const k = ph % 3;
      if (wt === 'arco') {
        p.hN = { x: cx + 15, y: sy + 3 }; p.wAng = 0; p.farFront = true; p.draw = [0.25, 1, 0.1][k];
        p.hF = { x: cx + 15 - 4 - [3, 12, 5][k], y: sy + 3 };
      } else if (wt === 'lanca') {
        p.hN = { x: cx + [5, 14, 10][k], y: sy + [6, 5, 7][k] }; p.hF = { x: cx + [-7, 3, -1][k], y: sy + [8, 6, 8][k] }; p.wAng = [1.5, 1.57, 1.62][k]; p.farFront = true; p.wShift = [-22, -25, -24][k];
      } else if (wt === 'cajado') {
        p.hN = { x: cx + [10, 13, 12][k], y: sy + [2, 5, 7][k] }; p.wAng = [-0.15, 0.5, 0.3][k]; p.hF = { x: cx - 9, y: sy + [9, 4, 7][k] }; p.glow = k + 1;
      } else if (wt === 'adaga') {
        p.hN = { x: cx + [5, 16, 13][k], y: sy + [6, 6, 9][k] }; p.wAng = [0.4, 1.57, 1.9][k];
        p.hF = { x: cx + [-10, -3, 9][k], y: sy + [8, 9, 5][k] }; p.wAng2 = [-0.6, 0.9, 1.5][k]; p.farFront = k === 2;
      } else if (wt === 'martelo') {
        p.hN = { x: cx + [10, 10, 8][k], y: sy + [-7, 0, 9][k] }; p.wAng = [-0.15, 0.85, 2.1][k]; p.wScale = [0.95, 0.8, 0.78][k]; p.hF = { x: cx + [6, 6, 4][k], y: sy + [-4, 3, 11][k] }; p.farFront = true;
      } else {
        p.hN = { x: cx + [11, 12, 10][k], y: sy + [-7, 3, 10][k] }; p.wAng = [-0.2, 1.05, 2.15][k]; p.wScale = [1, 0.8, 0.78][k]; p.hF = { x: p.shF.x - 3, y: sy + [9, 10, 11][k] }; p.slash = k;
      }
      if (view !== 'side') { p.wScale = [1, 0.85, 0.8][k]; p.wShift = null; p.hN = { x: cx + hw + [3, 5, 4][k], y: sy + [-5, 4, 11][k] }; p.wAng = [-0.3, 0.9, 1.7][k]; p.hF = { x: cx - hw - 3, y: sy + 10 }; p.farFront = false; if (wt === 'arco') { p.wAng = 0; p.hN = { x: cx + hw + 5, y: sy + 5 }; p.hF = { x: cx + hw - [0, 6, 2][k], y: sy + 5 }; p.draw = [0.25, 1, 0.1][k]; } }
    }
    if (cast) { p.hF = { x: p.shF.x - 4 + (ph % 2), y: sy - 5 - ph % 2 }; if (wt === 'cajado') { p.hN = { x: p.shN.x + 4, y: sy + 4 }; p.wAng = [0.05, 0.22, 0.12][ph % 3]; } }
    if (victory) { p.hN = { x: p.shN.x + 4, y: sy - 7 }; p.wAng = 0.12; p.hF = { x: p.shF.x - 4, y: sy - 4 + (ph ? -2 : 0) }; if (wt === 'adaga') p.wAng2 = -0.2; }
    if (hurt) { p.hN = { x: p.shN.x + 5, y: sy + 9 }; p.hF = { x: p.shF.x - 5, y: sy + 8 }; p.wAng = 1.1; p.wScale = 0.8; }
    if (bend) { p.hN = { x: p.shN.x + 5, y: sy + 13 }; p.hF = { x: p.shF.x + 4, y: sy + 14 }; p.wAng = 1.2; p.noWeapon = true; }
    if (sit) { p.hN = { x: p.shN.x + 3, y: sy + 11 }; p.hF = { x: p.shF.x - 1, y: sy + 11 }; p.noWeapon = true; }
    return p;
  };

  /* ---------- armas: grip na origem, ponta para cima; quatro silhuetas por tipo (faixas de rank) ---------- */
  const weapon = (D, it, kind, gx, gy, ang, o) => {
    o = o || {};
    const g = gearPal(it), band = Math.min(3, rankOf(it) >> 1), rar = g.rar | 0;
    const metal = ramp(g.main), edge = ramp(g.light), dark = ramp(g.dark), trim = ramp(g.trim), wood = ramp(g.wood), woodL = ramp(g.woodL), gem = ramp(g.gem), leather = ramp(g.leather);
    const sc = o.scale || 1, ca = Math.cos(ang) * sc, sa = Math.sin(ang) * sc, T = (x, y) => [gx + x * ca - y * sa, gy + x * sa + y * ca];
    const P = (pts, r, opt) => { mPoly(pts.map((q) => T(q[0], q[1]))); paint(D, r, Object.assign({ contour: true }, opt)); };
    const K = (x0, y0, x1, y1, r0, r1, r, opt) => { const a = T(x0, y0), b = T(x1, y1); mCap(a[0], a[1], b[0], b[1], r0, r1); paint(D, r, Object.assign({ contour: true }, opt)); };
    const E = (x, y, rr, r, opt) => { const a = T(x, y); mEll(a[0], a[1], rr, rr); paint(D, r, Object.assign({ contour: true }, opt)); };
    const dot = (x, y, c) => { const a = T(x, y); px(D, Math.floor(a[0]), Math.floor(a[1]), c); };
    const glint = (x, y) => { if (rar >= 3) dot(x, y, C('#ffffff')); };
    if (kind === 'espada') {
      const len = [21, 23, 24, 27][band], w = [2, 2.2, 3, 3][band];
      K(0, 3, 0, -2, 1.3, 1.3, leather);                                              // cabo
      E(0, 4.5, band >= 2 ? 2 : 1.6, band >= 2 ? gem : trim);                          // pomo
      if (band === 0) P([[-4, -2], [4, -2], [4, -4], [-4, -4]], trim);
      else if (band === 1) P([[-5, -1.5], [5, -1.5], [6, -4.5], [3, -4], [-3, -4], [-6, -4.5]], trim);
      else if (band === 2) P([[-6, -1], [-3, -2], [3, -2], [6, -1], [7, -5], [3, -4.5], [-3, -4.5], [-7, -5]], trim);
      else { P([[-7, -2], [7, -2], [8, -7], [4, -5], [-4, -5], [-8, -7]], trim); E(0, -3.5, 1.6, gem); }
      if (band === 2) P([[-w, -4], [w, -4], [w + 1, -len + 6], [0, -len], [-w - 1, -len + 6]], metal, { side: 0.5 });
      else P([[-w, -4], [w, -4], [w, -len + 4], [0, -len], [-w, -len + 4]], metal, { side: 0.5 });
      for (let y = -6; y > -len + 5; y--) dot(-0.6, y, edge[4 - (band < 2 ? 1 : 0)]);  // fio de luz
      if (band === 3) for (let y = -8; y > -len + 6; y -= 4) dot(0.5, y, gem[3]);
      glint(0, -len + 2);
    } else if (kind === 'machado') {
      const len = [22, 24, 26, 28][band];
      K(0, 5, 0, -len + 3, 1.2, 1.2, wood);
      P([[1, -len + 2], [7 + band, -len - 1], [9 + band, -len + 6], [7 + band, -len + 12], [1, -len + 9]], metal, { side: 0.55 });
      if (band >= 2) P([[-1, -len + 3], [-6, -len + 1], [-7, -len + 6], [-6, -len + 10], [-1, -len + 8]], metal);
      P([[-1.5, -len + 2], [1.5, -len + 2], [1.5, -len + 10], [-1.5, -len + 10]], trim);
      if (band >= 1) E(0, -len + 6, 1.4, gem);
      for (let y = -len + 1; y < -len + 11; y++) dot(8 + band, y, edge[4]);
    } else if (kind === 'lanca') {
      const len = 40, sh = o.shift == null ? -4 : o.shift;
      K(0, 14 - sh, 0, -len + 8 - sh, 1.1, 1.1, wood);
      const ty = -len + 8 - sh;
      if (band === 0) P([[-2.5, ty], [0, ty - 9], [2.5, ty], [0, ty + 2]], metal, { side: 0.5 });
      else if (band === 1) { P([[-3, ty], [0, ty - 11], [3, ty], [0, ty + 2]], metal, { side: 0.5 }); P([[-5, ty + 3], [5, ty + 3], [3, ty + 1], [-3, ty + 1]], trim); }
      else if (band === 2) { P([[-2.5, ty], [0, ty - 11], [2.5, ty], [0, ty + 2]], metal, { side: 0.5 }); P([[2, ty + 1], [8, ty - 3], [9, ty + 3], [2, ty + 5]], metal); P([[-2, ty + 1], [-6, ty], [-6, ty + 3], [-2, ty + 4]], trim); }
      else { P([[-3.5, ty], [0, ty - 13], [3.5, ty], [0, ty + 3]], metal, { side: 0.5 }); P([[-7, ty - 1], [-3, ty + 1], [-3, ty + 4], [-6, ty + 3]], trim); P([[7, ty - 1], [3, ty + 1], [3, ty + 4], [6, ty + 3]], trim); E(0, ty + 1, 1.5, gem); }
      K(0, ty + 5, 0, ty + 7, 1.6, 1.6, trim);
      if (band >= 1) { P([[1, ty + 7], [5, ty + 9], [4, ty + 13], [1, ty + 11]], ramp(g.rar ? g.trim : '#b4533f')); }
      for (let y = ty - 2; y > ty - 8; y--) dot(-0.6, y, edge[4]);
      glint(0, ty - 7);
    } else if (kind === 'cajado') {
      const len = 38;
      K(0, 14, 0, -len + 14, 1.25, 1.25, wood);
      const ty = -len + 14;
      if (band === 0) { P([[-1.5, ty + 1], [-4, ty - 2], [-3, ty - 6], [1, ty - 7], [4, ty - 4], [3, ty - 1], [1.5, ty + 1]], woodL); E(0.5, ty - 3.5, 1.7, gem); }
      else if (band === 1) { P([[-3, ty + 1], [3, ty + 1], [4, ty - 2], [-4, ty - 2]], trim); P([[-3, ty - 2], [0, ty - 10], [3, ty - 2], [0, ty]], gem, { side: 0.5 }); }
      else if (band === 2) { P([[-2, ty + 1], [-6, ty - 3], [-6, ty - 9], [-3, ty - 12], [-4, ty - 7], [-2, ty - 3], [2, ty - 3], [4, ty - 7], [3, ty - 12], [6, ty - 9], [6, ty - 3], [2, ty + 1]], trim); E(0, ty - 7.5, 2.6, gem); }
      else { P([[-2, ty + 1], [-7, ty - 2], [-9, ty - 9], [-5, ty - 6], [-3, ty - 3], [3, ty - 3], [5, ty - 6], [9, ty - 9], [7, ty - 2], [2, ty + 1]], trim); P([[-3, ty - 4], [0, ty - 14], [3, ty - 4], [0, ty - 2]], gem, { side: 0.5 }); E(0, ty - 16.5, 1.3, gem); }
      K(0, ty + 3, 0, ty + 4, 1.7, 1.7, trim);
      if (band >= 2) K(0, 6, 0, 7, 1.7, 1.7, trim);
      dot(-0.6, ty - (band === 2 ? 8 : band === 0 ? 4 : 6), C('#ffffff'));
      if (o.glow) { const a = T(0, ty - (band >= 2 ? 8 : 5)); for (const [dx, dy] of [[-4, -1], [4, 1], [-2, -5], [3, -4], [0, 4], [-5, 3]].slice(0, 2 + o.glow * 2)) px(D, a[0] + dx, a[1] + dy, gem[4]); }
    } else if (kind === 'arco') {
      const hh = [13, 14, 16, 16][band], bw = [5, 6, 6, 7][band], body = band >= 2 ? trim : woodL, dr = (o.draw || 0) * 9;
      /* corda atrás, puxada até a mão de trás */
      const top = T(-1, -hh), bot = T(-1, hh), mid = T(-1 - dr, 0), sc = C(rar >= 4 ? g.gem : '#e9e2cf');
      const ln = (a, b) => { const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) | 0 || 1; for (let i = 0; i <= n; i++) px(D, Math.floor(a[0] + (b[0] - a[0]) * i / n), Math.floor(a[1] + (b[1] - a[1]) * i / n), sc); };
      ln(top, mid); ln(mid, bot);
      /* braços do arco: curva em três segmentos */
      for (const s of [-1, 1]) {
        K(0.5, s * 2, bw * 0.75, s * hh * 0.5, 1.5, 1.3, body); K(bw * 0.75, s * hh * 0.5, bw * 0.45, s * (hh - 3), 1.3, 1.1, body);
        if (band === 1 || band === 3) K(bw * 0.45, s * (hh - 3), -1.5, s * hh, 1.1, 0.9, body); else K(bw * 0.45, s * (hh - 3), -1, s * hh, 1.1, 0.9, body);
        if (band >= 2) E(-1, s * hh, 1.3, metal);
        if (band === 3) P([[bw * 0.6, s * hh * 0.42], [bw + 3, s * hh * 0.55], [bw * 0.6, s * hh * 0.7]], trim);
      }
      K(0.5, -2.5, 0.5, 2.5, 1.8, 1.8, leather);
      if (band >= 1) E(0.5, 0, 1.2, gem);
      if (o.draw > 0.2) {                                                              // flecha armada
        const a0 = T(-1 - dr, 0), a1 = T(bw + 5, 0); mCap(a0[0], a0[1], a1[0], a1[1], 0.6, 0.6); paint(D, ramp('#d9c9a0'), { l: 0, d: 0 });
        P([[bw + 4, -1.6], [bw + 8, 0], [bw + 4, 1.6]], metal);
      }
    } else if (kind === 'martelo') {
      const len = [24, 26, 27, 28][band], hwid = [5, 6, 7, 7][band], hh = [4, 4.5, 5, 6][band];
      K(0, 7, 0, -len + 6, 1.4, 1.4, wood);
      K(0, 5, 0, 7, 1.8, 1.8, trim);
      const ty = -len + 2;
      P([[-hwid, ty - hh], [hwid, ty - hh], [hwid, ty + hh], [-hwid, ty + hh]], metal, { side: 0.6 });
      if (band >= 1) P([[hwid, ty - hh + 1], [hwid + 4, ty], [hwid, ty + hh - 1]], metal);
      if (band >= 2) { P([[-hwid - 2, ty - hh - 1], [-hwid + 2, ty - hh - 1], [-hwid + 2, ty + hh + 1], [-hwid - 2, ty + hh + 1]], trim); P([[hwid - 3, ty - hh - 1], [hwid - 1, ty - hh - 1], [hwid - 1, ty + hh + 1], [hwid - 3, ty + hh + 1]], trim); }
      if (band === 3) { P([[-2, ty - hh], [0, ty - hh - 5], [2, ty - hh]], trim); E(0, ty, 2.2, gem); }
      else if (band >= 1) E(-1, ty, 1.5, gem);
      for (let x = -hwid + 2; x < hwid - 2; x++) dot(x, ty - hh + 1.5, edge[4]);
    } else if (kind === 'adaga') {
      const len = [13, 14, 15, 16][band];
      K(0, 2, 0, -1, 1.2, 1.2, leather);
      P([[-3, -1.5], [3, -1.5], [3 + (band >= 1 ? 1 : 0), -3.5], [-3 - (band >= 1 ? 1 : 0), -3.5]], trim);
      if (band === 2) P([[-1.6, -3], [1.8, -3], [3, -len + 4], [1.5, -len], [-0.5, -len + 5]], metal, { side: 0.5 });
      else P([[-1.8, -3], [1.8, -3], [1.8, -len + 3], [0, -len], [-1.8, -len + 3]], metal, { side: 0.5 });
      if (band === 3) E(0, -2.5, 1.3, gem);
      for (let y = -5; y > -len + 3; y--) dot(-0.6, y, edge[4]);
    }
  };
  A.hero64Weapon = weapon;

  /* ---------- corpo ---------- */
  const limb = (D, a, b, r0, r1, rUp, rLow, bendDir) => {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, k = Math.max(0, 13 - L) * 0.42 * (bendDir || 1);
    const e = { x: mx + (-dy / L) * k, y: my + (dx / L) * k };
    mCap(a.x, a.y, e.x, e.y, r0, (r0 + r1) / 2); paint(D, rUp, { side: 0.62 });
    mCap(e.x, e.y, b.x, b.y, (r0 + r1) / 2, r1); paint(D, rLow, { side: 0.62 });
  };
  const hand = (D, h, r) => { mEll(h.x, h.y, 2.5, 2.5); paint(D, r, { side: 0.6 }); };

  const frame64 = (o, frame) => {
    const rest = frame.startsWith('sleep') || frame === 'fall';
    const p = pose(o, rest ? 'idle0' : frame), D = new Uint32Array(N), side = p.view === 'side', backV = p.view === 'back';
    if (rest) { p.eyes = 'closed'; p.mouth = 'calm'; p.noWeapon = frame !== 'fall'; }
    const c = CLS[o.cls] || CLS.esp, gear = o.equipment || {}, cos = o.costume || null;
    const arm = gear.armadura || null, ap = arm ? gearPal(arm) : null, aRank = rankOf(arm), aType = arm ? arm.type : null;
    const skin = ramp(A.SKIN[o.skin] || A.SKIN[1]), hair = ramp(A.HAIR[o.hair] || A.HAIR[1]);
    const clothHex = cos && cos.body ? cos.body : arm ? (aType === 'pesada' ? ap.main : aType === 'media' ? mix(ap.leather, ap.main, 0.35) : mix(c.cloth, ap.cloth, 0.55)) : c.cloth;
    const cloth = ramp(clothHex), pants = ramp(cos && cos.legs ? cos.legs : c.pants);
    const trimHex = cos && cos.trim ? cos.trim : arm ? ap.trim : c.trim, trim = ramp(trimHex), leather = ramp(arm ? ap.leather : c.leather);
    const plate = arm ? ramp(ap.main) : null, plateL = arm ? ramp(ap.light) : null;
    const boots = gear.botas ? gearPal(gear.botas) : null, bootR = ramp(boots ? boots.mid : aType === 'pesada' ? ap.dark : c.leather), bootT = ramp(boots ? boots.trim : trimHex);
    const glove = gear.luvas ? gearPal(gear.luvas) : null, handR = glove ? ramp(glove.mid) : aType === 'pesada' ? ramp(ap.mid) : skin;
    const under = ramp(shade(c.cloth, 0.78)), sleeve = aType === 'pesada' ? under : cloth, fore = aType === 'pesada' ? ramp(ap.mid) : glove ? ramp(glove.mid) : o.cls === 'mag' || o.cls === 'pal' || aType === 'leve' ? cloth : skin;
    const cx = p.tx, hw = p.hw, top = p.top, waist = p.waist, robe = (o.cls === 'mag' && !p.sit) || (aType === 'leve' && o.cls !== 'lad' && !p.sit);
    const wk = o.weaponKind, wit = gear.arma || null;

    /* capa: manto de classe ou armadura de rank alto */
    const capeHex = cos && cos.cape ? cos.cape : (arm && aRank >= 4) ? ap.cloth : o.cls === 'pal' && arm ? mix(ap.cloth, '#8a2f3a', 0.4) : null;
    if (capeHex && !p.sit) {
      const sway = p.walk ? [1, 0, -1, 0][p.ph % 4] : p.atk ? -2 : 0, bot = GY - 6 - p.jump;
      mPoly([[cx - hw - 1, top + 2], [cx + hw + 1, top + 2], [cx + hw + 3 + sway, bot], [cx - hw - 4 + sway, bot]]);
      if (!backV) paint(D, ramp(shade(capeHex, 0.82)), { side: 0.7 });
      else mClear();
    }
    /* aljava do arqueiro nas costas */
    if (o.cls === 'arq' && !backV && !p.sit) {
      mPoly([[cx - hw - 3, top - 2], [cx - hw + 1, top - 3], [cx - hw + 4, top + 9], [cx - hw, top + 10]]); paint(D, ramp('#7a5433'));
      for (const dx of [-2, 0]) { px(D, cx - hw + dx - 1, top - 5, C('#e7dfc6')); px(D, cx - hw + dx - 1, top - 4, C('#c9c1a8')); px(D, cx - hw + dx, top - 6, C('#b4533f')); }
    }
    const drawArm = (sh, h, near) => {
      limb(D, sh, { x: h.x, y: h.y - 1 }, 2.7, 2.3, sleeve, fore, near ? 1 : -1);
      if (aType === 'pesada' || (arm && aRank >= 2 && aType === 'media')) { mEll(sh.x + (near ? 0.5 : -0.5), sh.y - 0.5, aType === 'pesada' ? 4.2 + (aRank >= 4 ? 0.8 : 0) : 3.2, aType === 'pesada' ? 3.6 : 2.8); paint(D, aType === 'pesada' ? plateL : ramp(ap.mid), { side: 0.65 }); if (aRank >= 2) pxIf(D, sh.x, sh.y - 1, trim[3]); }
      hand(D, h, handR);
      if (glove) { mCap(h.x - (h.x - sh.x) * 0.16, h.y - (h.y - sh.y) * 0.16 - 1.5, h.x - (h.x - sh.x) * 0.3, h.y - (h.y - sh.y) * 0.3 - 1.5, 2.6, 2.6); paint(D, ramp(glove.trim), { side: 0.6 }); }
    };
    const drawWeapon = (h, ang, second) => {
      if (!wk || p.noWeapon) return;
      weapon(D, wit, wk, Math.round(h.x), Math.round(h.y), ang, { draw: p.draw, shift: p.wShift, glow: p.glow && (p.atk || p.cast) ? p.glow : 0, second, scale: p.wScale || 1 });
    };

    /* costas: a arma fica à frente do corpo, então é desenhada antes */
    if (backV) { drawWeapon(p.hN, p.wAng); if (wk === 'adaga') drawWeapon(p.hF, p.wAng2 == null ? -p.wAng : p.wAng2, true); }
    if (!p.farFront && !backV) { drawArm(p.shF, p.hF, false); if (wk === 'adaga') drawWeapon(p.hF, p.wAng2 == null ? -p.wAng : p.wAng2, true); }

    /* pernas e botas */
    const leg = (foot, hx) => {
      const hip = { x: hx, y: p.hipY }, ank = { x: foot.x - (side ? 1 : 0), y: foot.y - 4 };
      if (p.sit) { mCap(hip.x, hip.y + 1, foot.x - 2, foot.y - 6, 2.9, 2.6); paint(D, pants, { side: 0.6 }); }
      else { mCap(hip.x, hip.y, ank.x, ank.y, 3, 2.6); paint(D, pants, { side: 0.6 }); }
      if (aType === 'pesada' && !p.sit) { mEll((hip.x + ank.x) / 2, (hip.y + ank.y) / 2 + 1, 2.6, 2.2); paint(D, plateL); }
      mRect(foot.x - 3, foot.y - 4, 6, 5); if (side || p.sit) mRect(foot.x + 3, foot.y - 2, 1, 3); if (!side && !p.sit) { M[(foot.y - 4) * W + foot.x - 3] = 0; M[(foot.y - 4) * W + foot.x + 2] = 0; }
      paint(D, bootR, { side: 0.65 });
      rowIf(D, foot.x - 3, foot.x + 3, foot.y, bootR[0]);
      if (boots) rowIf(D, foot.x - 3, foot.x + 2, foot.y - 4, bootT[2]);
    };
    if (!(robe && !p.walk && !p.atk && p.view !== 'side') || true) { leg(p.footF, cx - (side ? 3 : 4)); leg(p.footN, cx + (side ? 3 : 4)); }

    /* tronco */
    mRect(cx - hw, top + 1, hw * 2, waist - top + 1); mRect(cx - hw + 1, top, hw * 2 - 2, 1); mRect(cx - hw + 1, waist + 2, hw * 2 - 2, 2);
    paint(D, cloth, { side: 0.68 });
    if (robe) {                                                                         // saia do manto
      const bot = Math.min(p.footN.y, p.footF.y) - 4, fl = p.walk ? [2, 0, -2, 0][p.ph % 4] : 0;
      mPoly([[cx - hw, waist], [cx + hw, waist], [cx + hw + 2 + Math.max(0, fl), bot], [cx - hw - 2 + Math.min(0, fl), bot]]); paint(D, cloth, { side: 0.7, contour: false });
      if (!backV) { colIf(D, cx, waist + 2, bot - 1, trim[2]); rowIf(D, cx - hw - 2, cx + hw + 2, bot - 1, trim[1]); }
    } else if (aType === 'media' || aType === 'pesada' || (aType === 'leve' && !p.sit)) {     // saiote / escarcelas
      const bot = waist + 6;
      mPoly([[cx - hw, waist + 1], [cx + hw, waist + 1], [cx + hw + 1, bot], [cx - hw - 1, bot]]); paint(D, aType === 'pesada' ? ramp(ap.mid) : aType === 'media' ? leather : cloth, { side: 0.68, contour: false });
      if (!backV) colIf(D, cx, waist + 2, bot - 1, darker(D[(waist + 3) * W + cx] || trim[1]));
      if (aRank >= 2) rowIf(D, cx - hw - 1, cx + hw + 1, bot - 1, trim[2]);
    }
    /* detalhes do peito */
    if (!backV) {
      const fx = side ? 1 : 0;                                                          // em 3/4 o centro do peito desloca
      if (aType === 'pesada') {
        mRect(cx - hw + 2 + fx, top + 2, hw * 2 - 4, 7); paint(D, plateL, { contour: false, side: 0.7 });
        rowIf(D, cx - hw + 2 + fx, cx + hw - 3 + fx, top + 9, plate[1]);
        colIf(D, cx + fx, top + 3, top + 8, plate[1]);
        if (o.cls === 'pal') { colIf(D, cx + fx, top + 3, top + 8, trim[2]); rowIf(D, cx - 2 + fx, cx + 2 + fx, top + 5, trim[2]); }
        if (aRank >= 4) { pxIf(D, cx + fx, top + 4, C(ap.gem)); pxIf(D, cx + fx - 1, top + 4, trim[3]); pxIf(D, cx + fx + 1, top + 4, trim[3]); }
      } else if (aType === 'media') {
        mRect(cx - hw + 1 + fx, top + 2, hw * 2 - 2, 8); paint(D, ramp(mix(ap.main, ap.leather, 0.3)), { contour: false, side: 0.7 });
        for (let y = top + 4; y <= top + 8; y += 2) rowIf(D, cx - hw + 2 + fx, cx + hw - 3 + fx, y, darker(D[y * W + cx]));
        if (aRank >= 2) { rowIf(D, cx - hw + 1 + fx, cx + hw - 2 + fx, top + 2, trim[2]); }
        if (aRank >= 4) pxIf(D, cx + fx, top + 5, C(ap.gem));
      } else {
        /* roupa de classe */
        if (o.cls === 'esp') { for (let i = 0; i < 6; i++) pxIf(D, cx - 4 + i + fx, top + 3 + i, leather[2]); pxIf(D, cx - 5 + fx, top + 2, leather[2]); }
        if (o.cls === 'arq') { for (let i = 0; i < 7; i++) pxIf(D, cx + 4 - i + fx, top + 2 + i, leather[2]); }
        if (o.cls === 'mag') { colIf(D, cx + fx, top + 1, waist, trim[2]); pxIf(D, cx + fx - 1, top + 5, trim[3]); pxIf(D, cx + fx + 1, top + 5, trim[3]); }
        if (o.cls === 'pal') { colIf(D, cx + fx, top + 3, top + 9, trim[2]); rowIf(D, cx - 2 + fx, cx + 2 + fx, top + 5, trim[2]); }
        if (o.cls === 'lad') { for (let i = 0; i < 6; i++) { pxIf(D, cx - 4 + i + fx, top + 3 + i, leather[3]); pxIf(D, cx + 3 - i + fx, top + 3 + i, leather[1]); } }
        if (o.cls === 'cav') { rowIf(D, cx - hw + 2, cx + hw - 3, top + 5, cloth[1]); rowIf(D, cx - hw + 2, cx + hw - 3, top + 8, cloth[1]); colIf(D, cx + fx, top + 2, waist - 1, cloth[3]); }
        if (aType === 'leve' && aRank >= 2) { rowIf(D, cx - hw, cx + hw - 1, top + 1, trim[2]); }
      }
      /* gola / cachecol */
      if (o.cls === 'esp' || o.cls === 'lad') { const sc = ramp(c.trim); mRect(cx - 5, top - 1, 10 + (side ? 1 : 0), 3); paint(D, sc, { contour: false }); if (o.cls === 'esp') { mRect(cx - hw - 1, top + 1, 3, 6 + (p.walk ? p.ph % 2 : 0)); paint(D, sc); } }
      if (o.cls === 'arq') { mRect(cx - 6, top - 1, 12, 3); paint(D, ramp(shade(clothHex, 0.8)), { contour: false }); }
      if (gear.acessorio) { const g = gearPal(gear.acessorio); pxIf(D, cx + fx, top + 2, C(g.gem)); pxIf(D, cx + fx, top + 3, C(g.trim)); pxIf(D, cx + fx - 1, top + 1, C(g.trim)); pxIf(D, cx + fx + 1, top + 1, C(g.trim)); }
    } else if (capeHex) {
      const bot = GY - 6 - p.jump; mPoly([[cx - hw - 1, top + 1], [cx + hw + 1, top + 1], [cx + hw + 3, bot], [cx - hw - 3, bot]]); paint(D, ramp(capeHex), { side: 0.7 });
      colIf(D, cx - 3, top + 6, bot - 2, darker(C(capeHex))); colIf(D, cx + 3, top + 8, bot - 2, darker(C(capeHex)));
    } else if (o.cls === 'arq') { mPoly([[cx - 4, top - 2], [cx + 1, top - 3], [cx + 3, top + 10], [cx - 2, top + 11]]); paint(D, ramp('#7a5433')); }
    /* cinto */
    { const g = gear.cinto ? gearPal(gear.cinto) : null, br = ramp(g ? g.leather : arm ? ap.leather : c.leather);
      rowIf(D, cx - hw, cx + hw - 1, waist, br[2]); rowIf(D, cx - hw, cx + hw - 1, waist + 1, br[1]);
      if (!backV) { const bc = C(g ? g.trim : trimHex); pxIf(D, cx + (side ? 1 : 0), waist, bc); pxIf(D, cx + (side ? 1 : 0) - 1, waist, bc); pxIf(D, cx + (side ? 1 : 0), waist + 1, bc); pxIf(D, cx + (side ? 1 : 0) - 1, waist + 1, bc); if (g && g.rar >= 2) pxIf(D, cx + (side ? 1 : 0), waist, C(g.gem)); } }

    if (!p.farFront && backV) { drawArm(p.shF, p.hF, false); }

    /* pescoço e cabeça */
    const hx = p.head.x, hy = p.head.y, RX = 10, RY = 9.6;
    mRect(Math.round(hx) - 2, Math.round(hy + RY) - 2, 4, 4); paint(D, ramp(shade(A.SKIN[o.skin] || A.SKIN[1], 0.82)), { contour: false, l: 0 });
    mEll(hx, hy, RX, RY); paint(D, skin, { side: 0.78 });
    const helm = gear.elmo ? gearPal(gear.elmo) : null, hRank = rankOf(gear.elmo), fullHelm = helm && o.cls === 'cav';
    const fo = side ? 2 : 0;                                                              // deslocamento do rosto em 3/4
    const iy = Math.round(hy), ix = Math.round(hx - 0.5);
    if (!backV && !fullHelm) {
      const iris = C(EYE[(o.seed || 0) % EYE.length]), irisD = darker(iris), white = C('#fbf7ee'), lash = hair[0], sd = skin[1];
      /* orelha do lado de trás em 3/4 */
      if (side) { px(D, ix - 9, iy + 2, skin[1]); px(D, ix - 9, iy + 3, skin[1]); }
      const eye = (ex, w, mirror) => {
        if (p.eyes === 'closed' || p.eyes === 'happy') { for (let i = 0; i < w; i++) px(D, ex + i, iy + 3 + (p.eyes === 'happy' && (i === 0 || i === w - 1) ? 1 : 0), lash); return; }
        if (p.eyes === 'hurt') { px(D, ex, iy + 2, lash); px(D, ex + w - 1, iy + 2, lash); for (let i = 0; i < w; i++) px(D, ex + i, iy + 3, lash); px(D, ex, iy + 4, lash); px(D, ex + w - 1, iy + 4, lash); if (w > 2) px(D, ex + 1, iy + 3, lash); return; }
        for (let i = 0; i < w; i++) px(D, ex + i, iy + 1, lash);
        for (let j = 2; j <= 4; j++) for (let i = 0; i < w; i++) { const outer = mirror ? i === 0 : i === w - 1; px(D, ex + i, iy + j, w > 2 && outer ? white : j === 2 ? iris : irisD); }
        px(D, ex + (mirror ? w - 1 : 0), iy + 2, white);                                 // brilho
        if (p.eyes === 'angry') px(D, ex + (mirror ? w - 1 : 0), iy, lash);              // sobrancelha franzida
        else for (let i = 0; i < w; i++) if (i !== (mirror ? 0 : w - 1)) px(D, ex + i, iy - 1, hair[1]);
      };
      eye(ix - 6 + fo + (side ? 1 : 0), side ? 2 : 3, true); eye(ix + 3 + fo, 3, false);
      /* bochechas, nariz e boca */
      px(D, ix - 6 + fo, iy + 6, C(mix(A.SKIN[o.skin] || A.SKIN[1], '#e07a6a', 0.38))); px(D, ix + 6 + fo - (side ? 1 : 0), iy + 6, C(mix(A.SKIN[o.skin] || A.SKIN[1], '#e07a6a', 0.38)));
      if (side) px(D, ix + 8, iy + 4, skin[3]);
      const mx = ix + fo;
      if (p.mouth === 'open') { px(D, mx, iy + 7, C('#5a2a2e')); px(D, mx + 1, iy + 7, C('#5a2a2e')); px(D, mx, iy + 6, sd); px(D, mx + 1, iy + 6, sd); }
      else if (p.mouth === 'smile') { px(D, mx - 1, iy + 6, sd); px(D, mx, iy + 7, sd); px(D, mx + 1, iy + 7, sd); px(D, mx + 2, iy + 6, sd); }
      else { px(D, mx, iy + 7, sd); px(D, mx + 1, iy + 7, sd); }
      if ((o.seed || 0) % 4 === 1 && !side) { px(D, ix - 7, iy + 4, skin[1]); }           // sarda/cicatriz discreta
    }
    /* cabelo */
    const style = ((o.style || 0) + c.hairOff) % 8, hood = helm && (o.cls === 'arq' || o.cls === 'lad');
    if (!fullHelm) {
      const long = style === 2 || style === 6 ? 13 : style === 3 || style === 4 ? 7 : style === 5 ? 4 : 3;
      if (backV) {
        mEll(hx, hy - 0.5, RX + 1, RY + 0.6); if (long > 4) mRect(ix - 9, iy, 20, long + 2); paint(D, hair, { side: 0.72 });
        if (style === 3) { mCap(hx, hy + 6, hx + 1, hy + 18, 2.6, 1.6); paint(D, hair); pxIf(D, ix, iy + 7, trim[2]); pxIf(D, ix + 1, iy + 7, trim[2]); }
        if (style === 6) { mCap(hx - 8, hy + 6, hx - 9, hy + 17, 2.2, 1.4); paint(D, hair); mCap(hx + 8, hy + 6, hx + 9, hy + 17, 2.2, 1.4); paint(D, hair); }
        if (style === 1) { mPoly([[hx - 7, hy - 8], [hx - 5, hy - 14], [hx - 2, hy - 9]]); mPoly([[hx - 2, hy - 9], [hx + 1, hy - 15], [hx + 4, hy - 9]]); mPoly([[hx + 3, hy - 9], [hx + 7, hy - 13], [hx + 8, hy - 7]]); paint(D, hair); }
        if (style === 7) { mEll(hx, hy - 11.5, 3.6, 3.2); paint(D, hair); }
        /* mechas: riscas escuras descendo do redemoinho e a linha da nuca */
        const bot = iy + Math.max(7, long > 4 ? long : 7);
        for (const [dx, y0, y1] of [[-6, -3, 5], [-3, -6, 7], [0, -7, 8], [3, -6, 7], [6, -3, 5]]) for (let y = iy + y0; y <= Math.min(bot, iy + y1 + (long > 4 ? long - 4 : 0)); y++) if ((y + dx) % 5 !== 0) pxIf(D, ix + dx, y, D[y * W + ix + dx] === hair[2] ? hair[1] : D[y * W + ix + dx]);
        if (long <= 4) rowIf(D, ix - 5, ix + 5, iy + 8, skin[1]);
      } else {
        /* calota: metade de cima da cabeça, com a testa recortada conforme a franja */
        mEll(hx, hy - 0.5, RX + 1, RY + 0.6);
        const fl = iy - 2;                                                                // linha da testa
        for (let y = fl; y <= iy + RY + 2; y++) for (let x = ix - 8 + (side ? 1 : 0); x <= ix + 8 + (side ? 1 : 0); x++) if (y >= 0 && y < H && x >= 0 && x < W) M[y * W + x] = 0;
        for (let y = iy + long - 1; y <= iy + RY + 2; y++) for (let x = ix - 12; x <= ix + 12; x++) if (y >= 0 && y < H && x >= 0 && x < W && style !== 2 && style !== 6) M[y * W + x] = 0;
        /* franjas */
        const F = (x0, x1, y0, y1) => mRect(ix + x0 + fo, y0, x1 - x0 + 1, y1 - y0 + 1);
        if (style === 0) { F(-8, 6, fl, fl); F(-8, -3, fl + 1, fl + 1); F(3, 6, fl + 1, fl + 1); }
        else if (style === 1) { F(-8, 7, fl, fl); F(-6, -5, fl + 1, fl + 2); F(-1, 0, fl + 1, fl + 2); F(4, 5, fl + 1, fl + 1); }
        else if (style === 2) { F(-8, 7, fl, fl + 1); F(-8, -6, fl + 2, fl + 2); F(5, 7, fl + 2, fl + 2); }
        else if (style === 3) { F(-8, 7, fl, fl); F(-8, 0, fl + 1, fl + 1); F(-8, -4, fl + 2, fl + 2); }
        else if (style === 4) { F(-8, 7, fl, fl + 1); F(-8, 7, fl + 2, fl + 2); mRect(ix - 2 + fo, fl + 2, 3, 1, 0); }
        else if (style === 5) { F(-2, 7, fl, fl); F(1, 7, fl + 1, fl + 1); F(4, 7, fl + 2, fl + 3); }
        else if (style === 6) { F(-8, 7, fl, fl); F(-8, -5, fl + 1, fl + 2); F(4, 7, fl + 1, fl + 2); }
        else { F(-8, 7, fl, fl); F(-3, 2, fl + 1, fl + 1); }
        /* topo */
        if (style === 1) { mPoly([[hx - 7, hy - 8], [hx - 5, hy - 14], [hx - 2, hy - 9]]); mPoly([[hx - 2, hy - 9], [hx + 1, hy - 15], [hx + 4, hy - 9]]); mPoly([[hx + 3, hy - 9], [hx + 7, hy - 13], [hx + 8, hy - 7]]); }
        if (style === 7) mEll(hx, hy - 11.5, 3.6, 3.2);
        if (style === 5) mPoly([[hx - 4, hy - 9], [hx + 4, hy - 13], [hx + 9, hy - 8], [hx + 5, hy - 7]]);
        paint(D, hair, { side: 0.74 });
        if (style === 3) { mCap(hx - 9, hy - 2, hx - 12, hy + 9, 2.4, 1.5); paint(D, hair); pxIf(D, ix - 9, iy - 3, trim[2]); pxIf(D, ix - 10, iy - 3, trim[2]); }
        if (style === 6) { mCap(hx - 10, hy + 6, hx - 11, hy + 16, 2, 1.3); paint(D, hair); mCap(hx + 10, hy + 6, hx + 11, hy + 16, 2, 1.3); paint(D, hair); pxIf(D, ix - 10, iy + 7, trim[2]); pxIf(D, ix + 10, iy + 7, trim[2]); }
      }
      /* brilho do cabelo */
      for (const [dx, dy, w] of [[-5, -7, 4], [-6, -6, 2], [1, -8, 3]]) for (let i = 0; i < w; i++) { const X = ix + dx + i, Y = iy + dy; if (X >= 0 && Y >= 0 && D[Y * W + X] === hair[2]) D[Y * W + X] = hair[4 - (i === 0 ? 0 : 1)]; }
    }
    /* elmo / chapéu / capuz conforme a classe */
    if (helm) {
      const hm = ramp(helm.main), hl = ramp(helm.light), ht = ramp(helm.trim), hc = ramp(mix(c.cloth, helm.cloth, 0.5));
      if (o.cls === 'cav') {
        mEll(hx, hy, RX + 1, RY + 1); paint(D, hm, { side: 0.72 });
        if (!backV) { rowIf(D, ix - 6 + fo, ix + 6 + fo, iy + 2, INK); rowIf(D, ix - 6 + fo, ix + 6 + fo, iy + 3, C('#2b2433')); colIf(D, ix + fo, iy + 4, iy + 8, hm[1]); for (let y = iy + 5; y <= iy + 7; y += 2) { pxIf(D, ix - 3 + fo, y, hm[0]); pxIf(D, ix + 3 + fo, y, hm[0]); } }
        rowIf(D, ix - 9, ix + 9, iy - 3, ht[2]);
        if (hRank >= 1) { mPoly([[hx - 1, hy - 10], [hx + 2, hy - 10], [hx + (side ? -7 : 2), hy - 18], [hx - 4, hy - 14]]); paint(D, ramp(helm.rar ? helm.trim : '#c9473a')); }
      } else if (o.cls === 'pal') {
        mEll(hx, hy - 0.5, RX + 1, RY + 0.6); for (let y = iy - 1; y <= iy + 12; y++) for (let x = ix - 7 + fo; x <= ix + 7 + fo; x++) if (!backV && y >= 0 && y < H && x >= 0 && x < W) M[y * W + x] = 0;
        paint(D, hl, { side: 0.72 });
        if (!backV) { colIf(D, ix + fo, iy - 2, iy + 2, hl[2]); rowIf(D, ix - 8 + fo, ix + 8 + fo, iy - 2, ht[2]); }
        for (const s of [-1, 1]) { mPoly([[hx + s * 9, hy - 4], [hx + s * 15, hy - 9], [hx + s * 13, hy - 3], [hx + s * 10, hy]]); paint(D, hRank >= 3 ? ht : ramp('#f1ead8')); }
      } else if (o.cls === 'esp') {
        mEll(hx, hy - 1, RX + 1, RY); for (let y = iy - 3; y <= iy + 12; y++) for (let x = ix - 12; x <= ix + 12; x++) if (y >= 0 && y < H && x >= 0 && x < W) M[y * W + x] = 0;
        paint(D, hm, { side: 0.72 });
        rowIf(D, ix - 9, ix + 9, iy - 4, ht[2]);
        if (!backV) colIf(D, ix + fo, iy - 3, iy + 2, hm[2]);
        if (hRank >= 2) { mPoly([[hx - 1, hy - 10], [hx + 1, hy - 10], [hx + 2, hy - 15], [hx - 3, hy - 13]]); paint(D, ht); }
      } else if (o.cls === 'mag') {
        mPoly([[hx - 13, hy - 3], [hx + 13, hy - 3], [hx + 11, hy - 6], [hx - 11, hy - 6]]); paint(D, hc, { side: 0.75 });
        mPoly([[hx - 8, hy - 5], [hx + 8, hy - 5], [hx + 4, hy - 13], [hx + 7 - (side ? 4 : 0), hy - 21], [hx - 1, hy - 14]]); paint(D, hc, { side: 0.7 });
        rowIf(D, ix - 7, ix + 7, iy - 6, ht[2]); rowIf(D, ix - 7, ix + 7, iy - 7, ht[1]);
        if (!backV) { pxIf(D, ix, iy - 7, C(helm.gem)); pxIf(D, ix + 1, iy - 7, C(helm.gem)); }
        if (hRank >= 3) { px(D, ix + 7 - (side ? 4 : 0), iy - 22, C(helm.gem)); }
      } else {                                                                            // capuz (arqueiro, ladino)
        mEll(hx, hy - 1, RX + 2, RY + 1.6); if (!backV) for (let y = iy - 1; y <= iy + 7; y++) for (let x = ix - 6 + fo; x <= ix + 7 + fo; x++) if (y >= 0 && y < H && x >= 0 && x < W) M[y * W + x] = 0;
        paint(D, hc, { side: 0.74 });
        mPoly([[hx - 2, hy - 11], [hx + 3, hy - 11], [hx + (side ? -3 : 1), hy - 14]]); paint(D, hc);
        if (!backV && o.cls === 'lad') { mRect(ix - 6 + fo, iy + 5, 14, 4); paint(D, ramp(shade(c.cloth, 0.75)), { contour: false }); }
        if (!backV && o.cls === 'arq' && hRank >= 2) { mPoly([[hx + 9, hy - 8], [hx + 14, hy - 15], [hx + 12, hy - 6]]); paint(D, ramp(helm.rar ? helm.trim : '#e7dfc6')); }
      }
      void hood;
    }
    /* testeira dos ranks altos do herói */
    if (!helm && !backV && (o.heroRank || 0) >= 4) { rowIf(D, ix - 7 + fo, ix + 7 + fo, iy - 3, trim[2]); pxIf(D, ix + fo, iy - 3, C((A.HERO_RARITY_VISUAL && A.HERO_RARITY_VISUAL[o.heroRarity || 0] || {}).primary || '#ffffff')); }

    /* arma e braço da frente */
    if (!backV) drawWeapon(p.hN, p.wAng);
    if (p.farFront) { drawArm(p.shF, p.hF, false); }
    drawArm(p.shN, p.hN, true);
    if (backV && p.farFront) drawArm(p.shF, p.hF, false);
    /* brilho de conjuração na mão livre */
    if (p.cast) { const g = C(wit ? gearPal(wit).gem : '#bfe9ff'), q = p.hF; for (const [dx, dy] of [[0, -4], [-3, -2], [3, -2], [-2, 2], [2, 2], [0, -6]].slice(0, 2 + p.glow * 2)) px(D, q.x + dx, q.y + dy, g); px(D, q.x, q.y - 4, C('#ffffff')); }

    let out = outline(D);
    if (rest) {                                                                           // deitado: gira 90° e apoia no chão
      const R = new Uint32Array(N);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = out[y * W + x]; if (!v) continue; const nx = y - 2, ny = GY - 22 + (x - 20); if (nx >= 0 && nx < W && ny >= 0 && ny < H) R[ny * W + nx] = v; }
      out = R;
    }
    return out;
  };

  /* ---------- folhas, retratos e corpo inteiro ---------- */
  const sheets = new Map(), images = new Map();
  let revision = 1;
  const weaponKind = (o) => { const it = o.equipment && o.equipment.arma; if (!it) return o.weapon || (G.CLASSES[o.cls] && G.CLASSES[o.cls].w) || ''; return /^machado/.test(it.e2catalog || it.art || '') ? 'machado' : it.type; };
  const keyOf = (o) => 'h64|' + revision + '|' + o.key;
  const prep = (o) => { if (o.weaponKind == null) o.weaponKind = o.bare ? '' : weaponKind(o); return o; };
  A.hero64Frame = (o, frame) => toCanvas(frame64(prep(o), frame));
  const oldSheet = A.charSheet, oldPortrait = A.portrait, oldFull = A.fullBody;
  A.charSheet = (o) => {
    if (!o || !o.heroBase) return oldSheet(o);
    const k = keyOf(o); let s = sheets.get(k); if (s) return s;
    prep(o);
    const frames = A.FRAMES, cv = A.mk(W * frames.length, H), ctx = cv.getContext('2d'), idx = {}, im = ctx.createImageData(W, H), u = new Uint32Array(im.data.buffer);
    frames.forEach((f, i) => { idx[f] = i; u.set(frame64(o, f)); ctx.putImageData(im, i * W, 0); });
    s = { cv, idx, fw: W, fh: H, scale: 0.5, ax: 32, ay: GY + 1, key: k, layers: { body: true, equipment: true, aura: false } };
    if (sheets.size >= 160) sheets.clear(); sheets.set(k, s); return s;
  };
  const cut = (o, frame) => { const cv = A.mk(W, H), c = cv.getContext('2d'), im = c.createImageData(W, H); new Uint32Array(im.data.buffer).set(frame64(prep(o), frame)); c.putImageData(im, 0, 0); return cv; };
  A.fullBody = (o) => {
    if (!o || !o.heroBase) return oldFull(o);
    const k = 'full|' + keyOf(o); if (images.has(k)) return images.get(k);
    const cv = A.mk(160, 160), c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
    if (o.wings && A.wingSheet) { const wings = A.wingSheet(o.wings); if (wings) c.drawImage(wings, 0, 0, 30, 22, 20, 30, 120, 88); }
    c.drawImage(cut(o, 'idle0'), 0, 0, W, H, 16, 22, 128, 128);
    const url = cv.toDataURL() + '#aurora-h64-' + encodeURIComponent(k);
    if (images.size > 500) images.clear(); images.set(k, url); if (A.HERO_IMAGE_META) A.HERO_IMAGE_META.set(url, Object.assign({}, o)); return url;
  };
  A.portrait = (o) => {
    if (!o || !o.heroBase) return oldPortrait(o);
    const k = 'portrait|' + keyOf(o); if (images.has(k)) return images.get(k);
    const cv = A.mk(88, 88), c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
    const col = (A.HERO_RARITY_VISUAL && A.HERO_RARITY_VISUAL[o.heroRarity] && A.HERO_RARITY_VISUAL[o.heroRarity].primary) || G.RAR_COLOR[o.heroRarity || 0];
    const g = c.createLinearGradient(0, 0, 0, 88); g.addColorStop(0, '#2b2a38'); g.addColorStop(1, '#17161f'); c.fillStyle = g; c.fillRect(0, 0, 88, 88);
    c.drawImage(cut(Object.assign({}, o, { weaponKind: '' }), 'frontIdle0'), 18, 3, 28, 28, 2, 2, 84, 84);
    c.strokeStyle = col; c.lineWidth = 4; c.strokeRect(2, 2, 84, 84);
    c.fillStyle = '#15141de0'; c.fillRect(4, 66, 26, 18); c.fillStyle = col; c.font = 'bold 15px Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(G.RANKS[o.heroRank || 0], 17, 76);
    const url = cv.toDataURL(); if (images.size > 500) images.clear(); images.set(k, url); return url;
  };
  A.invalidateHero64 = () => { revision++; sheets.clear(); images.clear(); if (G.S) for (const h of G.S.heroes) { delete h._look; delete h._lk; delete h._dirtyKey; } if (G.UI && G.UI.rosterBuild) G.UI.rosterBuild(); };
  const oldInv = A.invalidateEquipmentArt; A.invalidateEquipmentArt = () => { if (oldInv) oldInv(); revision++; sheets.clear(); images.clear(); };
  G.hook('afterLoad', () => { sheets.clear(); images.clear(); }, 95000);
  A.hero64Stats = () => ({ sheets: sheets.size, images: images.size, revision });
})();
