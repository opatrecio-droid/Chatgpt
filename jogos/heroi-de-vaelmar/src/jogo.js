
/* ===== Motor de pixel art procedural: cores, luz, formas e contorno ===== */
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
const BAYER = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
const bay = (x, y) => (BAYER[(((y | 0) % 4) + 4) % 4][(((x | 0) % 4) + 4) % 4] + .5) / 16 - .5;
function hn(x, y, z = 0) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const hash = hn;

function h2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }
function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s, l];
}
function hsl2hex(h, s, l) {
  h = ((h % 360) + 360) % 360; const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  return '#' + [r, g, b].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}
const rgba = (hex, a) => { const [r, g, b] = h2rgb(hex); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; };
function rampOf(hex, alpha) {
  const [h, s, l] = rgb2hsl(...h2rgb(hex)), out = [], dl = [-.27, -.14, 0, .13, .26];
  for (let i = 0; i < 5; i++) {
    const k = i - 2, c = hsl2hex(h + k * 7, clampN(s * (1 - k * .04) + (k < 0 ? .04 : 0), 0, 1), clampN(l + dl[i] * (l < .25 ? .7 : 1), .04, .95));
    out.push(alpha ? rgba(c, alpha) : c);
  }
  return out;
}
const darken = (hex, f) => { const [h, s, l] = rgb2hsl(...h2rgb(hex)); return hsl2hex(h, s, clampN(l * f, 0, 1)); };
const lighten = (hex, d) => { const [h, s, l] = rgb2hsl(...h2rgb(hex)); return hsl2hex(h, s, clampN(l + d, 0, 1)); };
const olOf = hex => { const [h, s, l] = rgb2hsl(...h2rgb(hex)); return hsl2hex(h - 8, clampN(s * .8, 0, 1), clampN(l * .22, .03, .13)); };
const mixHex = (a, b, t) => { const A = h2rgb(a), B = h2rgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };

/* ===== Buffer de pixels ===== */
/* s = escala de rasterização: as coordenadas continuam em unidades "grossas", mas o desenho sai s vezes mais detalhado */
class PB {
  constructor(w, h, sc = 1) { this.w = w; this.h = h; this.s = sc; this.W = w * sc; this.H = h * sc; this.p = new Array(this.W * this.H).fill(null); }
  sf(X, Y, c) { X = Math.floor(X); Y = Math.floor(Y); if (X >= 0 && Y >= 0 && X < this.W && Y < this.H) this.p[Y * this.W + X] = c; }
  gf(X, Y) { return X >= 0 && Y >= 0 && X < this.W && Y < this.H ? this.p[Y * this.W + X] : null; }
  set(x, y, c) { const s = this.s; if (s === 1) return this.sf(x, y, c); const X = Math.floor(x) * s, Y = Math.floor(y) * s; for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) this.sf(X + i, Y + j, c); }
  get(x, y) { return this.gf(Math.floor(x) * this.s, Math.floor(y) * this.s); }
}
const LX = -.5, LY = -.6, LZ = .62;
function fill(pb, test, ramp, c, o = {}) {
  const [cx, cy, rx, ry] = c, n = ramp.length, dith = o.dith === undefined ? .5 : o.dith, sc = pb.s, e = 1 / sc;
  const xs = Math.max(0, Math.floor((cx - rx - 3) * sc)), xe = Math.min(pb.W - 1, Math.ceil((cx + rx + 3) * sc));
  const ys = Math.max(0, Math.floor((cy - ry - 3) * sc)), ye = Math.min(pb.H - 1, Math.ceil((cy + ry + 3) * sc));
  for (let y = ys; y <= ye; y++) for (let x = xs; x <= xe; x++) {
    const px = (x + .5) / sc, py = (y + .5) / sc; if (!test(px, py)) continue;
    let col;
    if (n === 1) col = ramp[0];
    else {
      let nx = (px - cx) / rx, ny = o.cyl ? 0 : (py - cy) / ry; const m = Math.hypot(nx, ny); if (m > 1) { nx /= m; ny /= m; }
      const z = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), d = nx * LX + ny * LY + z * LZ, t = clampN(d / 1.1, 0, 1);
      let idx = Math.round(t * (n - 1) + bay(x, y) * dith);
      if (o.noise) { const q = hn(x, y, 7); if (q > .93) idx++; else if (q < .07) idx--; }
      col = ramp[clampN(idx + (o.bias || 0), 0, n - 1)];
    }
    if (o.edge && (!test(px - e, py) || !test(px + e, py) || !test(px, py - e) || !test(px, py + e))) col = o.edge;
    pb.sf(x, y, col);
  }
}
const ellT = (cx, cy, rx, ry) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const rectT = (x0, y0, w, h) => (x, y) => x >= x0 && x < x0 + w && y >= y0 && y < y0 + h;
function polyT(pts) {
  return (x, y) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
}
const E = (pb, cx, cy, rx, ry, ramp, o) => fill(pb, ellT(cx, cy, rx, ry), ramp, [cx, cy, rx, ry], o);
const R = (pb, x, y, w, h, ramp, o) => fill(pb, rectT(x, y, w, h), ramp, [x + w / 2, y + h / 2, w / 2 * 1.15, h / 2 * 1.15], o);
function PL(pb, pts, ramp, o) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  fill(pb, polyT(pts), ramp, [(x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2 * 1.1 + .5, (y1 - y0) / 2 * 1.1 + .5], o);
}
const D = (pb, x, y, c) => pb.set(x, y, c);
function LN(pb, x0, y0, x1, y1, col, w = 1) {
  const sc = pb.s || 1; w = Math.max(1, Math.round(w * sc));
  x0 = Math.round(x0 * sc); y0 = Math.round(y0 * sc); x1 = Math.round(x1 * sc); y1 = Math.round(y1 * sc);
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx - dy;
  for (;;) {
    for (let j = 0; j < w; j++) for (let i = 0; i < w; i++) pb.sf(x0 + i - (w >> 1), y0 + j - (w >> 1), col);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err; if (e2 > -dy) { err -= dy; x0 += sx; } if (e2 < dx) { err += dx; y0 += sy; }
  }
}
function PLN(pb, pts, col, w = 1) { for (let i = 0; i < pts.length - 1; i++) LN(pb, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], col, w); }
function outline(pb, col) {
  const q = pb.p.slice();
  for (let y = 0; y < pb.H; y++) for (let x = 0; x < pb.W; x++) {
    if (pb.gf(x, y)) continue;
    if (pb.gf(x - 1, y) || pb.gf(x + 1, y) || pb.gf(x, y - 1) || pb.gf(x, y + 1)) q[y * pb.W + x] = col;
  }
  pb.p = q;
}
function toCanvas(pb) {
  const c = document.createElement('canvas'); c.width = pb.W; c.height = pb.H; const g = c.getContext('2d');
  if (pb.W * pb.H > 20000) {
    /* rápido para buffers grandes: escreve direto nos pixels */
    const img = g.createImageData(pb.W, pb.H), d = img.data, cache = new Map();
    for (let i = 0; i < pb.p.length; i++) { const col = pb.p[i]; if (!col) continue; let v = cache.get(col); if (!v) { v = parseCol(col); cache.set(col, v); } const k = i * 4; if (v[3] >= 1) { d[k] = v[0]; d[k + 1] = v[1]; d[k + 2] = v[2]; d[k + 3] = 255; } else { d[k] = v[0]; d[k + 1] = v[1]; d[k + 2] = v[2]; d[k + 3] = Math.round(v[3] * 255); } }
    g.putImageData(img, 0, 0); return c;
  }
  for (let y = 0; y < pb.H; y++) for (let x = 0; x < pb.W; x++) { const col = pb.p[y * pb.W + x]; if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); } }
  return c;
}
function parseCol(col) {
  if (col[0] === '#') { const [r, g, b] = h2rgb(col); return [r, g, b, 1]; }
  const m = col.match(/rgba?\(([^)]+)\)/); if (m) { const v = m[1].split(',').map(Number); return [v[0], v[1], v[2], v[3] === undefined ? 1 : v[3]]; }
  return [255, 0, 255, 1];
}
const mirX = (pts, w = 32) => pts.map(([x, y]) => [w - x, y]);
/* ===== Sprites 32x32 gerados com luz, sombra e contorno ===== */
const SKIN = ['#a8604e', '#d38f72', '#eeb893', '#f8d6b4', '#fff0dc'], STEEL = rampOf('#9fabc4'), GOLD = rampOf('#eab93a'), WOOD = rampOf('#8f5d34'), LEATHER = rampOf('#5a3d2b'), BONE = rampOf('#e9e3cd');
const EYEW = ['#ffffff'], GLINT = 'rgba(255,255,255,.9)';

function gSlime(pal) {
  const pb = new PB(32, 32), r = rampOf(pal.a, pal.alpha), ol = olOf(pal.a);
  E(pb, 16, 29, 14, 2.6, r, { dith: .2, bias: -1 });
  fill(pb, (x, y) => ellT(16, 21, 12.5, 9.5)(x, y) || ellT(16, 15.5, 8.5, 8)(x, y), r, [16, 19, 12.5, 11.5], { dith: .55 });
  if (pal.crown) {
    PL(pb, [[10, 9], [10, 3], [13, 6], [16, 1], [19, 6], [22, 3], [22, 9]], GOLD, { edge: '#8a5a10' });
    D(pb, 16, 5, '#ff4a5a'); D(pb, 11, 7, '#59d0e8'); D(pb, 21, 7, '#59d0e8');
  }
  outline(pb, ol);
  E(pb, 10.5, 12.5, 3, 1.7, ['rgba(255,255,255,.8)']); D(pb, 8, 15, 'rgba(255,255,255,.7)'); D(pb, 9, 15, 'rgba(255,255,255,.7)');
  E(pb, 23, 24.5, 2, 1.4, [r[3]]); E(pb, 8.5, 25, 1.2, 1, [r[3]]);
  for (const ex of [12, 20]) {
    E(pb, ex, 19.5, 2.9, 3.5, EYEW, { edge: ol }); E(pb, ex + (ex < 16 ? .5 : -.5), 20.2, 1.7, 2.4, [ol]); D(pb, ex + (ex < 16 ? -.2 : -.8), 19, GLINT);
  }
  LN(pb, 9, 16, 14, 17, ol, 1); LN(pb, 23, 16, 18, 17, ol, 1);
  [[14, 25], [15, 26], [16, 26], [17, 26], [18, 25]].forEach(([x, y]) => D(pb, x, y, ol));
  return pb;
}

function gBat(pal) {
  const pb = new PB(32, 32), r = rampOf(pal.a), wr = rampOf(darken(pal.a, .8)), ol = olOf(pal.a);
  const wing = [[13, 14], [9, 8], [1, 4], [3, 11], [1, 16], [6, 15], [6, 22], [10, 19], [11, 25], [14, 20]];
  PL(pb, wing, wr, { dith: .6 }); PL(pb, mirX(wing), wr, { dith: .6 });
  for (const f of [[2, 5], [3, 12], [2, 16], [7, 22]]) { LN(pb, 13, 15, f[0] + 1, f[1] + 1, r[3], 1); LN(pb, 19, 15, 31 - f[0], f[1] + 1, r[3], 1); }
  E(pb, 16, 19.5, 5, 7, r); E(pb, 16, 20.5, 3, 4.5, [r[3], r[3], r[2]], { dith: .5 });
  E(pb, 16, 12, 5.7, 5, r);
  PL(pb, [[11, 10], [11, 2], [15, 8]], r); PL(pb, mirX([[11, 10], [11, 2], [15, 8]]), r);
  PL(pb, [[12, 9], [12, 5], [14, 8]], ['#e58aa8']); PL(pb, mirX([[12, 9], [12, 5], [14, 8]]), ['#e58aa8']);
  E(pb, 13, 27, 1.3, 1.7, r); E(pb, 19, 27, 1.3, 1.7, r);
  outline(pb, ol);
  for (const ex of [13, 18]) { R(pb, ex, 11, 2, 2, [pal.e || '#ff5a5a']); D(pb, ex, 11, '#fff'); }
  D(pb, 15, 15, '#fff'); D(pb, 16, 15, '#fff'); D(pb, 15, 16, '#fff'); D(pb, 16, 16, '#fff');
  D(pb, 15, 13, ol); D(pb, 16, 13, ol);
  LN(pb, 13, 9, 15, 10, ol); LN(pb, 19, 9, 17, 10, ol);
  return pb;
}

function gGoblin(pal) {
  const pb = new PB(32, 32), r = rampOf(pal.a), ol = olOf(pal.a), tun = rampOf('#8a5a32');
  LN(pb, 26, 27, 27, 11, WOOD[2], 2);
  PL(pb, [[24, 6], [28, 3], [31, 7], [30, 13], [25, 13], [23, 9]], WOOD, { edge: '#3a2412' });
  [[25, 5], [30, 5], [31, 10], [24, 11]].forEach(([x, y]) => D(pb, x, y, '#cfd6e0'));
  R(pb, 12, 27, 3.5, 4, r, { cyl: true }); R(pb, 17, 27, 3.5, 4, r, { cyl: true });
  R(pb, 11, 30, 5, 2, LEATHER); R(pb, 16, 30, 5, 2, LEATHER);
  E(pb, 16, 22.5, 6.7, 6, tun, { noise: true });
  R(pb, 9.5, 25, 13, 2, ['#2a1a10', '#3a2412']); R(pb, 15, 25, 2.5, 2, GOLD);
  E(pb, 9, 21, 2.4, 4.6, r); E(pb, 23.5, 21, 2.4, 4.6, r); E(pb, 24.5, 26, 2, 1.8, r);
  const ear = [[10, 9], [1, 4], [3, 11], [10, 13]];
  PL(pb, ear, r); PL(pb, mirX(ear), r);
  PL(pb, [[9, 9], [4, 6], [5, 10], [9, 11]], ['#c97a7a', '#d79090']); PL(pb, mirX([[9, 9], [4, 6], [5, 10], [9, 11]]), ['#c97a7a', '#d79090']);
  E(pb, 16, 11, 7, 6.3, r);
  outline(pb, ol);
  for (const ex of [12.5, 19.5]) { E(pb, ex, 10.5, 2.1, 1.7, ['#ffe14a'], { edge: ol }); R(pb, ex - .5, 10, 1, 1.6, [ol]); }
  LN(pb, 9, 8, 14, 10, ol, 1); LN(pb, 23, 8, 18, 10, ol, 1);
  E(pb, 16, 13.2, 1.7, 1.4, [r[3]]); D(pb, 15, 13, ol); D(pb, 17, 13, ol);
  R(pb, 11.5, 15.5, 9, 2, ['#2a1520']);
  D(pb, 13, 14, '#fff'); D(pb, 13, 15, '#fff'); D(pb, 19, 14, '#fff'); D(pb, 19, 15, '#fff');
  for (let x = 14; x < 19; x += 2) D(pb, x, 16, '#e8dfc8');
  return pb;
}

function gSpider(pal) {
  const pb = new PB(32, 32), r = rampOf(pal.a), ol = olOf(pal.a);
  const legs = [[[13, 11], [8, 3], [3, 6], [1, 13]], [[12, 13], [5, 9], [1, 14], [1, 21]], [[12, 16], [4, 16], [1, 22], [2, 29]], [[13, 19], [6, 23], [3, 28], [5, 31]]];
  for (const L of legs) { PLN(pb, L, r[1], 2); PLN(pb, mirX(L), r[1], 2); PLN(pb, L.map(([x, y]) => [x + .5, y - .5]), r[3], 1); PLN(pb, mirX(L).map(([x, y]) => [x - .5, y - .5]), r[3], 1); }
  E(pb, 16, 21, 7.5, 8.3, r, { noise: true });
  E(pb, 16, 11, 5.7, 5, r);
  outline(pb, ol);
  PL(pb, [[14, 16.5], [18, 16.5], [16, 21]], ['#d12a3a', '#f0505e']); PL(pb, [[16, 21], [14, 25.5], [18, 25.5]], ['#d12a3a', '#f0505e']);
  [[12, 20], [20, 20], [13, 26], [19, 26]].forEach(([x, y]) => E(pb, x, y, 1.2, 1.2, [r[3]]));
  for (const ex of [14, 18]) { E(pb, ex, 10, 1.5, 1.5, [pal.e || '#ff4a6a']); D(pb, ex - .5, 9, '#fff'); }
  [[12.5, 8.5], [19.5, 8.5], [15, 7.8], [17, 7.8]].forEach(([x, y]) => D(pb, x, y, '#ff9aa8'));
  PL(pb, [[13, 14.5], [15, 14.5], [14, 18.5]], ['#e8dfc8']); PL(pb, [[17, 14.5], [19, 14.5], [18, 18.5]], ['#e8dfc8']);
  return pb;
}

function gSkeleton(pal) {
  const pb = new PB(32, 32), b = rampOf(pal.a), ol = olOf(pal.a), arm = pal.armor ? rampOf(pal.armor) : null;
  if (arm) PL(pb, [[8, 14], [24, 14], [28, 30], [4, 30]], rampOf(darken(pal.armor, .55)), { dith: .3 });
  PL(pb, [[3, 4], [6, 4], [6, 22], [4.5, 25], [3, 22]], STEEL, { cyl: true });
  R(pb, 1, 22, 7, 2, GOLD); R(pb, 3, 24, 3, 4, LEATHER);
  LN(pb, 11, 17, 5, 24, b[2], 2);
  E(pb, 26, 19.5, 4.8, 6.5, arm || WOOD, { edge: olOf(pal.armor || '#8f5d34') }); E(pb, 26, 19.5, 1.5, 1.5, GOLD);
  LN(pb, 21, 17, 24, 19, b[1], 2);
  R(pb, 15, 15, 2, 10, b, { cyl: true });
  E(pb, 16, 19.5, 6.5, 5.5, b);
  E(pb, 16, 26, 4.8, 2.6, b);
  LN(pb, 14, 27, 13, 31, b[2], 2); LN(pb, 18, 27, 19, 31, b[2], 2); R(pb, 11, 30, 4, 2, b); R(pb, 17, 30, 4, 2, b);
  E(pb, 16, 8, 6.3, 6.2, b); R(pb, 12, 11.5, 8, 3.5, b);
  if (arm) {
    E(pb, 8.5, 16, 3.8, 3.2, arm, { edge: olOf(pal.armor) }); E(pb, 23.5, 16, 3.8, 3.2, arm, { edge: olOf(pal.armor) });
    PL(pb, [[9.5, 8], [22.5, 8], [22, 2], [16, 0], [10, 2]], arm, { edge: olOf(pal.armor) });
    PL(pb, [[15, 0], [18, 0], [21, 2], [17, 5]], ['#d6393f', '#f0505e']);
  }
  outline(pb, ol);
  for (let y = 17; y <= 23; y += 3) { R(pb, 10, y, 4.5, 1, [ol]); R(pb, 17.5, y, 4.5, 1, [ol]); }
  const sock = arm ? 7.5 : 8;
  for (const ex of [13.5, 18.5]) { E(pb, ex, sock, 2, 2.4, [ol]); D(pb, ex - .5, sock - .5, pal.e || '#ff6a4a'); D(pb, ex + .5, sock + .5, pal.e || '#ff6a4a'); }
  PL(pb, [[15.2, 10], [16.8, 10], [16, 12]], [ol]);
  for (let x = 13; x < 20; x += 2) R(pb, x, 12.5, 1, 2, [ol]);
  return pb;
}

function gGhost(pal) {
  const pb = new PB(32, 32), r = rampOf(pal.a, .92), ol = rgba(olOf(pal.a), .9);
  const tails = [[7, 26], [10, 30.5], [13, 26], [16, 31.5], [19, 26], [22, 30.5], [25, 26]];
  fill(pb, (x, y) => ellT(16, 13, 9, 10)(x, y) || rectT(7, 13, 18, 13)(x, y) || polyT(tails)(x, y), r, [16, 15, 10, 15], { dith: .6 });
  const arm = [[8, 17], [2, 21], [1, 26], [4, 24], [8, 22]];
  PL(pb, arm, r); PL(pb, mirX(arm), r);
  outline(pb, ol);
  for (const ex of [12.5, 19.5]) { E(pb, ex, 12, 2.3, 3.2, ['#0e1030']); D(pb, ex, 10.5, '#8fe0ff'); D(pb, ex, 11.5, '#bff3ff'); }
  E(pb, 16, 19.5, 2, 3, ['#0e1030']); D(pb, 16, 17.5, '#3b4a80');
  for (const ex of [9.5, 22.5]) E(pb, ex, 15.5, 1.6, 1, ['rgba(255,150,170,.55)']);
  const g = new PB(32, 32); E(g, 16, 16, 15, 15.5, ['rgba(150,205,255,.13)'], { dith: 0 });
  for (let i = 0; i < g.p.length; i++) if (g.p[i] && !pb.p[i]) pb.p[i] = g.p[i];
  return pb;
}

function gGolem(pal) {
  const pb = new PB(32, 32), r = rampOf(pal.a), ol = olOf(pal.a), mo = rampOf('#4a8a3a');
  R(pb, 10, 24, 5.5, 7, r, { noise: true }); R(pb, 17, 24, 5.5, 7, r, { noise: true });
  R(pb, 9, 29, 7, 3, r, { noise: true }); R(pb, 16.5, 29, 7, 3, r, { noise: true });
  R(pb, 3, 16, 5.5, 11, r, { noise: true }); R(pb, 23.5, 16, 5.5, 11, r, { noise: true });
  E(pb, 5.8, 28.2, 3.6, 3.4, r, { noise: true }); E(pb, 26.2, 28.2, 3.6, 3.4, r, { noise: true });
  PL(pb, [[8, 12], [24, 12], [22, 26], [10, 26]], r, { noise: true });
  E(pb, 7.5, 13.5, 5, 4.6, r, { noise: true }); E(pb, 24.5, 13.5, 5, 4.6, r, { noise: true });
  R(pb, 11.5, 3.5, 9, 8.5, r, { noise: true });
  outline(pb, ol);
  R(pb, 12.5, 6.5, 7, 1, [ol]); R(pb, 13, 7.5, 6, 2, [pal.e || '#ffcc44']); D(pb, 13, 7, '#fff7c0');
  E(pb, 16, 19.5, 2.8, 2.8, [pal.e || '#ffcc44'], { edge: ol, dith: 0 }); D(pb, 15, 18, '#fff7c0');
  PLN(pb, [[9, 15], [11, 19], [9, 23]], ol, 1); PLN(pb, [[21, 14], [20, 18], [22, 22]], ol, 1); PLN(pb, [[4, 19], [6, 22]], ol, 1);
  [[11, 4], [12, 5], [26, 24], [8, 25], [23, 13], [4, 26]].forEach(([x, y]) => { D(pb, x, y, mo[2]); D(pb, x + 1, y, mo[1]); });
  R(pb, 10, 25, 12, 1, [mo[1]]);
  return pb;
}

function gWyrm(pal) {
  const pb = new PB(32, 32), r = rampOf(pal.a), ol = olOf(pal.a), bel = rampOf(pal.c || '#f2c97e'), wr = rampOf(darken(pal.a, .75));
  if (pal.halo) { fill(pb, (x, y) => ellT(16, 9, 10.5, 10.5)(x, y) && !ellT(16, 9, 8, 8)(x, y), GOLD, [16, 9, 10.5, 10.5], { dith: .3 }); }
  const wing = [[11, 14], [6, 6], [1, 1], [3, 9], [1, 13], [5, 13], [4, 19], [9, 18]];
  PL(pb, wing, wr, { dith: .6 }); PL(pb, mirX(wing), wr, { dith: .6 });
  PLN(pb, [[11, 14], [2, 2]], r[3], 1); PLN(pb, [[11, 14], [2, 13]], r[3], 1); PLN(pb, mirX([[11, 14], [2, 2]]), r[3], 1); PLN(pb, mirX([[11, 14], [2, 13]]), r[3], 1);
  E(pb, 23.5, 27.5, 3, 2.4, r); E(pb, 27, 26.5, 2.6, 2.1, r); E(pb, 30, 23.5, 2, 2, r);
  PL(pb, [[29, 20], [31, 18], [31, 23]], ['#f0e4c0']);
  E(pb, 16, 21, 7.3, 8, r, { noise: true });
  PL(pb, [[13, 15], [19, 15], [20, 28], [12, 28]], bel, { dith: .4 });
  for (let y = 17; y < 28; y += 3) R(pb, 12.5, y, 7, 1, [bel[1]]);
  E(pb, 11, 28, 2.8, 3, r); E(pb, 21, 28, 2.8, 3, r);
  E(pb, 16, 13.5, 4.3, 4, r);
  E(pb, 16, 9, 5.6, 4.7, r); R(pb, 12.5, 10, 7, 4.5, r);
  const horn = [[11, 6], [8, -1], [13, 4]];
  PL(pb, horn, ['#bda97a', '#e8dcb4', '#f6efd2']); PL(pb, mirX(horn), ['#bda97a', '#e8dcb4', '#f6efd2']);
  [[14, 15.5], [16, 15], [18, 15.5]].forEach(([x, y]) => PL(pb, [[x - 1, y], [x, y - 2.5], [x + 1, y]], bel));
  outline(pb, ol);
  for (const ex of [13.5, 18.5]) { R(pb, ex - 1, 8, 2.2, 2.4, [pal.e || '#ffe65a']); D(pb, ex, 8.5, ol); D(pb, ex, 9.5, ol); }
  D(pb, 14, 12, ol); D(pb, 18, 12, ol); R(pb, 13, 14, 6, 1, [ol]);
  D(pb, 14, 13, '#fff'); D(pb, 18, 13, '#fff');
  PL(pb, [[12, 24.5], [11, 29], [10, 24]], ['#f0e4c0']);
  return pb;
}

/* ---------- heróis ---------- */
function heroBase(pb, pal, cape, hairTest) {
  const cl = rampOf(pal.a), hr = rampOf(pal.h);
  return { cl, hr };
}
function gHero(cls, pal) {
  const pb = new PB(32, 32), cl = rampOf(pal.a), hr = rampOf(pal.h), ol = olOf(pal.a === '#e8e2c8' ? '#7a6a50' : pal.a);
  const eyeCol = pal.e || '#241a2e';
  const eyes = (y = 11) => { for (const ex of [13, 18]) { R(pb, ex, y, 2, 3, ['#241a2e']); D(pb, ex, y, '#ffffff'); } };
  const mouth = () => { D(pb, 15, 15, '#b8645a'); D(pb, 16, 15, '#b8645a'); };
  const hand = (x, y) => E(pb, x, y, 1.9, 1.9, SKIN);
  const blade = rampOf(pal.blade || '#cfd8e6');
  if (pal.cape) PL(pb, [[8.5, 16.5], [23.5, 16.5], [27.5, 31.6], [4.5, 31.6]], rampOf(pal.cape), { dith: .25 });
  const extra = () => {
    if (pal.pauldron) { E(pb, 8.5, 18.8, 4.2, 3.3, rampOf(pal.pauldron), { edge: '#3a2a10' }); E(pb, 23.5, 18.8, 4.2, 3.3, rampOf(pal.pauldron), { edge: '#3a2a10' }); }
    if (pal.crown) { R(pb, 11, 1.6, 10, 2.2, GOLD); for (const x of [11.6, 16, 20.4]) PL(pb, [[x - 1.4, 2], [x, -0.8], [x + 1.4, 2]], GOLD); }
  };
  const post = () => {
    if (pal.visor) { R(pb, 11.6, 8.6, 8.8, 6, STEEL); R(pb, 12.4, 11, 7.2, 1, ['#141018']); R(pb, 15.4, 12, 1.2, 2.4, ['#3a4458']); }
    if (pal.halo) fill(pb, (x, y) => ellT(16, 0.9, 6.2, 1.5)(x, y) && !ellT(16, 0.9, 4.4, 0.7)(x, y), ['#ffd84a', '#fff3a0', '#ffffff'], [16, 0.9, 6.2, 1.5]);
  };
  if (cls === 'guerreiro') {
    PL(pb, [[9, 18], [23, 18], [27, 30], [5, 30]], rampOf('#8a2b2a'), { dith: .3 });
    R(pb, 11, 27, 4, 4, rampOf('#4a3a30'), { cyl: true }); R(pb, 17, 27, 4, 4, rampOf('#4a3a30'), { cyl: true });
    R(pb, 10, 29.5, 5.5, 2.5, rampOf('#2a2020')); R(pb, 16.5, 29.5, 5.5, 2.5, rampOf('#2a2020'));
    PL(pb, [[10, 18], [22, 18], [23, 26], [9, 26]], STEEL);
    R(pb, 13.5, 18, 5, 8, cl, { cyl: true });
    R(pb, 9, 25, 14, 2, ['#3a2412', '#5a3d2b']); R(pb, 14.5, 25, 3, 2, GOLD);
    E(pb, 7.5, 24, 2.3, 4.6, rampOf('#6c7790')); E(pb, 24.5, 24, 2.3, 4.6, rampOf('#6c7790'));
    E(pb, 7.5, 28.5, 1.9, 1.9, SKIN); E(pb, 24.5, 28.5, 1.9, 1.9, SKIN);
    E(pb, 8.5, 19, 3.7, 3.1, STEEL, { edge: '#3a4458' }); E(pb, 23.5, 19, 3.7, 3.1, STEEL, { edge: '#3a4458' });
    E(pb, 5, 24, 4.2, 5.4, WOOD, { edge: '#3a2412' }); E(pb, 5, 24, 1.5, 1.5, STEEL);
    R(pb, 14, 15.5, 4, 3, rampOf('#d9a87a'));
    E(pb, 16, 10.5, 6.6, 6.6, SKIN);
    E(pb, 16, 6.7, 7.4, 4.6, STEEL, { edge: '#3a4458' }); R(pb, 15.2, 6, 1.6, 7, STEEL);
    PL(pb, [[17, 2.5], [22, -1], [26, 3], [22, 2.5]], rampOf(pal.plume || '#d6393f'), { dith: .3 });
    PL(pb, [[25.2, 8], [27, 8], [27, 24.5], [26.1, 26.5], [25.2, 24.5]], blade, { cyl: true });
    R(pb, 22.5, 24, 6.5, 2, GOLD); R(pb, 25, 26, 2, 3.5, LEATHER); E(pb, 26, 30, 1.6, 1.4, GOLD);
    extra(); outline(pb, '#171020');
    eyes(11); mouth(); D(pb, 13, 9, '#3a2412'); D(pb, 14, 9, '#3a2412'); D(pb, 18, 9, '#3a2412'); D(pb, 19, 9, '#3a2412'); post();
  } else if (cls === 'mago') {
    PL(pb, [[9, 17], [23, 17], [27, 30.5], [5, 30.5]], cl);
    R(pb, 5, 28.5, 22, 2, GOLD); R(pb, 10, 23, 12, 2, GOLD);
    R(pb, 15, 18, 2, 11, rampOf(darken(pal.a, .7)), { cyl: true });
    E(pb, 7, 22.5, 3, 5.5, cl, { edge: '#1c2660' }); E(pb, 25, 22.5, 3, 5.5, cl, { edge: '#1c2660' });
    E(pb, 6.5, 28, 1.9, 1.9, SKIN); E(pb, 26, 27, 1.9, 1.9, SKIN);
    E(pb, 16, 12.5, 6.4, 5.8, SKIN);
    PL(pb, [[10.5, 14.5], [21.5, 14.5], [19.5, 24.5], [16, 27], [12.5, 24.5]], hr);
    R(pb, 14, 16, 4, 1.4, ['#9a645a']);
    R(pb, 5, 8, 22, 3, rampOf(darken(pal.a, .8)), { edge: '#1c2660' });
    PL(pb, [[10.5, 9], [21.5, 9], [18.5, 3], [22.5, -1], [16.5, 1.5], [14, 3.5]], cl, { edge: '#1c2660' });
    R(pb, 10.5, 6.2, 11, 2.4, GOLD); D(pb, 16, 3.5, '#fff3a0'); D(pb, 14, 5, '#fff3a0');
    LN(pb, 27, 31, 27, 6, WOOD[2], 2); LN(pb, 26, 31, 26, 6, WOOD[3], 1);
    E(pb, 27.5, 4, 3.3, 3.3, pal.orb ? rampOf(pal.orb) : ['#6e8cff', '#a3baff', '#d8e6ff', '#ffffff'], { dith: .2 });
    extra(); outline(pb, '#10142e');
    for (const ex of [13, 18]) { R(pb, ex, 12, 2, 2.5, ['#241a2e']); D(pb, ex, 12, '#fff'); }
    R(pb, 12, 10.5, 3, 1, hr[3]); R(pb, 17, 10.5, 3, 1, hr[3]);
    const g = new PB(32, 32); E(g, 27.5, 4, 6, 6, [pal.orb ? rampOf(pal.orb, .22)[2] : 'rgba(130,170,255,.22)'], { dith: 0 });
    for (let i = 0; i < g.p.length; i++) if (g.p[i] && !pb.p[i]) pb.p[i] = g.p[i];
    post();
  } else if (cls === 'ladino') {
    const c2 = rampOf(pal.c2 || '#235c45');
    PL(pb, [[8, 17], [24, 17], [26, 30], [6, 30]], c2, { dith: .3 });
    R(pb, 11, 27, 4, 4, rampOf('#3a3028'), { cyl: true }); R(pb, 17, 27, 4, 4, rampOf('#3a3028'), { cyl: true });
    R(pb, 10, 29.5, 5.5, 2.5, rampOf('#241c18')); R(pb, 16.5, 29.5, 5.5, 2.5, rampOf('#241c18'));
    PL(pb, [[10, 18], [22, 18], [22, 27], [10, 27]], cl);
    LN(pb, 11, 18, 21, 26, '#3a2412', 2); LN(pb, 11.5, 18, 21.5, 26, '#7a5236', 1);
    R(pb, 9.5, 25, 13, 2, ['#2a1a10', '#4a3426']); R(pb, 14.5, 25, 3, 2, GOLD);
    E(pb, 7.5, 23, 2.3, 4.5, cl); E(pb, 24.5, 23, 2.3, 4.5, cl);
    E(pb, 7, 28, 1.9, 1.9, SKIN); E(pb, 25, 28, 1.9, 1.9, SKIN);
    R(pb, 4, 22, 2.2, 8, blade, { cyl: true }); PL(pb, [[4, 30], [6.2, 30], [5.1, 33]], blade); R(pb, 3.2, 26, 4, 1.2, GOLD);
    if (pal.bow) { PLN(pb, [[25.5, 12], [28.6, 16], [29.6, 21.5], [28.6, 27], [25.5, 31]], WOOD[1], 2); PLN(pb, [[25.8, 12.4], [28.8, 16.4], [29.8, 21.5]], WOOD[3], 1); LN(pb, 25.5, 12, 25.5, 31, '#e8e8f0', 1); }
    else { R(pb, 26, 22, 2.2, 8, blade, { cyl: true }); R(pb, 25.2, 26, 4, 1.2, GOLD); }
    E(pb, 16, 11.5, 5.6, 5.2, SKIN);
    E(pb, 16, 9, 8, 7.8, cl, { edge: '#143324' }); PL(pb, [[10, 12], [22, 12], [20, 18], [12, 18]], c2);
    fill(pb, (x, y) => ellT(16, 12.5, 5, 4.2)(x, y), SKIN, [16, 12.5, 5, 4.2]);
    R(pb, 11, 14.2, 10, 3.6, pal.c2 ? rampOf(darken(pal.c2, .85)) : rampOf('#1f4f3a'), { cyl: true });
    extra(); outline(pb, '#10201a');
    R(pb, 10.8, 10.2, 10.4, 1, ['rgba(20,20,30,.55)']);
    for (const ex of [13, 18]) { R(pb, ex, 11, 2, 1.6, ['#fff']); D(pb, ex + 1, 11.4, pal.e || '#241a2e'); }
    post();
  } else {
    PL(pb, [[9, 17], [23, 17], [27, 30.5], [5, 30.5]], cl, { dith: .4 });
    R(pb, 15, 17, 2, 13.5, GOLD); R(pb, 5, 28.5, 22, 2, GOLD); R(pb, 10, 23, 12, 2, GOLD);
    D(pb, 16, 19, '#fff3a0'); R(pb, 15, 20, 2, 1, ['#fff3a0']);
    E(pb, 7, 22.5, 3, 5.5, cl, { edge: '#8a7a50' }); E(pb, 25, 22.5, 3, 5.5, cl, { edge: '#8a7a50' });
    R(pb, 4.5, 26, 5, 1.6, GOLD); R(pb, 22.5, 26, 5, 1.6, GOLD);
    E(pb, 6.5, 28.3, 1.9, 1.9, SKIN); E(pb, 26.5, 28.3, 1.9, 1.9, SKIN);
    fill(pb, (x, y) => ellT(16, 8, 10.5, 10.5)(x, y) && !ellT(16, 8, 8.3, 8.3)(x, y) && y < 9, GOLD, [16, 8, 10.5, 10.5], { dith: .3 });
    R(pb, 14, 15.5, 4, 3, rampOf('#d9a87a'));
    E(pb, 16, 10.5, 6.5, 6.5, SKIN);
    E(pb, 16, 6.6, 7.3, 4.5, hr, { edge: '#8a6a1a' });
    LN(pb, 27, 31, 27, 12, WOOD[2], 2); E(pb, 27, 9.5, 3.7, 3.7, GOLD, { edge: '#8a5a10' });
    [[27, 5], [23, 9], [31, 9], [27, 13.5]].forEach(([x, y]) => D(pb, x, y, '#f6efd2'));
    outline(pb, '#2a2418');
    eyes(11); mouth();
    const g = new PB(32, 32); E(g, 27, 9.5, 6.5, 6.5, ['rgba(255,235,150,.22)'], { dith: 0 });
    for (let i = 0; i < g.p.length; i++) if (g.p[i] && !pb.p[i]) pb.p[i] = g.p[i];
  }
  return pb;
}

const GENS = {
  slime: gSlime, bat: gBat, goblin: gGoblin, spider: gSpider, skeleton: gSkeleton, ghost: gGhost, golem: gGolem, wyrm: gWyrm,
  hero_guerreiro: p => gHero('guerreiro', p), hero_mago: p => gHero('mago', p), hero_ladino: p => gHero('ladino', p), hero_clerigo: p => gHero('clerigo', p),
};
const SPR_CACHE = new Map();
function makeSprite(key, pal) {
  const sig = key + '|' + JSON.stringify(pal || {});
  if (SPR_CACHE.has(sig)) return SPR_CACHE.get(sig);
  const c = toCanvas(GENS[key](pal || {})); SPR_CACHE.set(sig, c); return c;
}
const FLASH_CACHE = new WeakMap();
function flashOf(spr) {
  if (FLASH_CACHE.has(spr)) return FLASH_CACHE.get(spr);
  const c = document.createElement('canvas'); c.width = spr.width; c.height = spr.height;
  const g = c.getContext('2d'); g.drawImage(spr, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  FLASH_CACHE.set(spr, c); return c;
}
/* ===== Mais sprites 32x32 e cenário do mapa em alta resolução ===== */
const PINK = ['#b0606e', '#d07a8a', '#f0a0b0', '#ffc8d2', '#ffe8ee'];
function gRat(pal) {
  const pb = new PB(32, 32), r = rampOf(pal.a || '#d8d4e0'), ol = olOf('#6a6478');
  PLN(pb, [[7, 24], [4, 22], [2, 18], [2, 14], [4, 12]], PINK[1], 2); PLN(pb, [[7, 23], [4, 21], [3, 17]], PINK[3], 1);
  E(pb, 10, 28.5, 2.2, 1.6, PINK); E(pb, 21, 28.5, 2.2, 1.6, PINK);
  E(pb, 14, 23, 9.5, 6, r, { noise: true });
  E(pb, 23.5, 19.5, 5.5, 4.8, r);
  PL(pb, [[26, 17.5], [31, 20.5], [27, 23]], r);
  E(pb, 21.5, 14, 3, 3.2, r); E(pb, 21.5, 14.2, 1.7, 2, PINK);
  E(pb, 25.5, 14.5, 2.4, 2.6, r); E(pb, 25.5, 14.7, 1.3, 1.6, PINK);
  outline(pb, ol);
  E(pb, 25.5, 18.5, 1.3, 1.5, ['#1a1220']); D(pb, 25, 18, '#fff');
  D(pb, 31, 20, '#e0607a'); D(pb, 30, 20, '#e0607a');
  [[27, 21], [28, 22], [29, 21]].forEach(([x, y]) => D(pb, x, y, ol));
  D(pb, 28, 23, '#fff');
  return pb;
}
function gWolf(pal) {
  const pb = new PB(32, 32), r = rampOf(pal.a || '#8a8a9e'), ol = olOf(pal.a || '#8a8a9e'), bel = rampOf(lighten(pal.a || '#8a8a9e', .18));
  PL(pb, [[6, 17], [1, 9], [3, 8], [9, 15]], r, { dith: .4 });
  for (const [x, w] of [[8, 3], [12, 3], [19, 3], [23, 3]]) R(pb, x, 23, w, 7.5, r, { cyl: true });
  for (const x of [8, 12, 19, 23]) R(pb, x - .5, 29.5, 4, 1.8, [r[1]]);
  E(pb, 15.5, 20, 10, 5.8, r, { noise: true });
  E(pb, 20, 23, 5, 2.6, bel, { dith: .4 });
  E(pb, 24, 14.5, 5.2, 4.8, r);
  PL(pb, [[26, 13], [31.5, 16], [31, 19], [26, 19]], r);
  PL(pb, [[20, 11], [21, 4], [24.5, 10]], r); PL(pb, [[24, 10], [26.5, 4], [28, 11]], r);
  PL(pb, [[21.2, 9.5], [21.6, 6.5], [23.2, 9.5]], PINK);
  outline(pb, ol);
  R(pb, 24.5, 13, 2.2, 1.6, [pal.e || '#ffd84a']); D(pb, 25.5, 13.5, '#1a1220');
  D(pb, 31, 16, '#1a1220'); D(pb, 31, 17, '#1a1220');
  PLN(pb, [[27, 19], [30, 19]], ol, 1); D(pb, 28, 20, '#fff'); D(pb, 30, 20, '#fff');
  return pb;
}
function gWorm(pal) {
  const pb = new PB(32, 32), r = rampOf(pal.a || '#e08a9a'), ol = olOf(pal.a || '#e08a9a');
  const seg = [[5, 27, 3.6], [9, 27.5, 4], [13.5, 26.5, 4.2], [17.5, 24, 4.2], [20.5, 20.5, 4.3], [22.5, 16, 4.6]];
  for (const [x, y, rr] of seg) E(pb, x, y, rr, rr * .92, r, { edge: r[1] });
  E(pb, 24, 11, 5.2, 4.8, r);
  outline(pb, ol);
  for (const [x, y] of seg.slice(1)) LN(pb, x - 2, y - 2, x - 3, y + 2, r[1], 1);
  E(pb, 26.5, 9.5, 1.4, 1.6, ['#1a1220']); D(pb, 26, 9, '#fff');
  PL(pb, [[25, 13], [29.5, 12.5], [28, 15]], ['#5a1a2a']);
  D(pb, 22, 8, r[4]); D(pb, 23, 7.5, r[4]);
  return pb;
}
function gGoblinMage(pal) {
  const pb = new PB(32, 32), r = rampOf(pal.a || '#8bbf4a'), ol = olOf(pal.a || '#8bbf4a'), rb = rampOf(pal.robe || '#7a46b0');
  LN(pb, 27, 30, 27, 9, WOOD[2], 2); LN(pb, 26, 30, 26, 9, WOOD[3], 1);
  E(pb, 27, 7, 3.2, 3.2, ['#c8401a', '#ff7a2a', '#ffc84a', '#fff3a0'], { dith: .3 });
  PL(pb, [[10, 17], [22, 17], [25, 31], [7, 31]], rb, { dith: .3 });
  R(pb, 8, 28.5, 16, 2, GOLD);
  E(pb, 8.5, 22, 2.5, 4.6, rb); E(pb, 24, 21, 2.5, 4.6, rb); E(pb, 25, 25.5, 2, 1.8, r); E(pb, 8, 26.5, 2, 1.8, r);
  const ear = [[10, 12], [1, 8], [3, 14], [10, 15.5]];
  PL(pb, ear, r); PL(pb, mirX(ear), r);
  PL(pb, [[9, 12.2], [4, 9.5], [5, 13], [9, 14]], ['#c97a7a', '#d79090']); PL(pb, mirX([[9, 12.2], [4, 9.5], [5, 13], [9, 14]]), ['#c97a7a', '#d79090']);
  E(pb, 16, 14, 6.6, 5.6, r);
  PL(pb, [[7, 10], [25, 10], [21, 7], [17, -1], [13, 2], [12, 7]], rb, { edge: olOf(pal.robe || '#7a46b0') });
  R(pb, 9, 8.5, 14, 2, GOLD); D(pb, 16, 3, '#fff3a0'); D(pb, 14, 5, '#fff3a0');
  outline(pb, ol);
  for (const ex of [13, 19]) { E(pb, ex, 13.5, 1.9, 1.5, ['#ffe14a'], { edge: ol }); R(pb, ex - .5, 13, 1, 1.4, [ol]); }
  R(pb, 12.5, 17, 7, 1.6, ['#2a1520']); D(pb, 13.5, 16.6, '#fff'); D(pb, 18.5, 16.6, '#fff');
  return pb;
}
function gHuman(pal) {
  /* humanos (bandido e NPCs): corpo de frente, cabeça grande */
  const pb = new PB(32, 32), cl = rampOf(pal.a || '#6a5a48'), ol = olOf(pal.a || '#6a5a48'), hr = rampOf(pal.h || '#5a3a20');
  R(pb, 11, 26, 4, 5, rampOf(pal.leg || '#3a2e28'), { cyl: true }); R(pb, 17, 26, 4, 5, rampOf(pal.leg || '#3a2e28'), { cyl: true });
  R(pb, 10, 29.5, 5.5, 2.5, rampOf('#2a2020')); R(pb, 16.5, 29.5, 5.5, 2.5, rampOf('#2a2020'));
  if (pal.cape) PL(pb, [[9, 17], [23, 17], [26, 30], [6, 30]], rampOf(pal.cape), { dith: .3 });
  PL(pb, [[10, 17], [22, 17], [23, 27], [9, 27]], cl, { dith: .3 });
  if (pal.apron) PL(pb, [[12, 19], [20, 19], [21, 28], [11, 28]], rampOf(pal.apron));
  R(pb, 9.5, 24.5, 13, 2, ['#2a1a10', '#4a3426']); R(pb, 15, 24.5, 2.5, 2, GOLD);
  E(pb, 8, 22, 2.4, 4.6, cl); E(pb, 24, 22, 2.4, 4.6, cl);
  E(pb, 8, 27, 1.9, 1.9, SKIN); E(pb, 24, 27, 1.9, 1.9, SKIN);
  if (pal.tool === 'dagger') { R(pb, 25.5, 21, 2, 7, rampOf('#cfd8e6'), { cyl: true }); R(pb, 24.5, 27.5, 4, 1.2, GOLD); }
  if (pal.tool === 'hammer') { R(pb, 25.5, 17, 1.8, 11, WOOD); R(pb, 23, 14.5, 7, 3.5, STEEL, { edge: '#3a4458' }); }
  if (pal.tool === 'spear') { R(pb, 26, 4, 1.6, 26, WOOD); PL(pb, [[25, 5], [26.8, 0], [28.6, 5]], STEEL); }
  if (pal.tool === 'bag') E(pb, 6, 26, 3.5, 3.5, rampOf('#a8703e'), { edge: '#3a2412' });
  E(pb, 16, 11, 6.6, 6.4, SKIN);
  if (pal.hood) { E(pb, 16, 9.5, 8, 7.8, hr, { edge: olOf(pal.h) }); fill(pb, ellT(16, 12.5, 5, 4.2), SKIN, [16, 12.5, 5, 4.2]); }
  else if (pal.helm) { E(pb, 16, 7, 7.4, 4.8, STEEL, { edge: '#3a4458' }); R(pb, 8.6, 7, 14.8, 2, STEEL); PL(pb, [[15, 2], [17, 2], [20, -1], [18, 3]], rampOf('#d6393f')); }
  else { E(pb, 16, 6.8, 7.2, 4.6, hr); R(pb, 9, 6.5, 2.5, 6, hr); R(pb, 20.5, 6.5, 2.5, 6, hr); }
  if (pal.mask) R(pb, 11, 13.8, 10, 3.6, rampOf(pal.mask), { cyl: true });
  outline(pb, ol);
  for (const ex of [13, 18]) { R(pb, ex, 11, 2, 2.2, ['#241a2e']); D(pb, ex, 11, '#fff'); }
  if (!pal.mask) { D(pb, 15, 15, '#b8645a'); D(pb, 16, 15, '#b8645a'); }
  if (pal.beard) { PL(pb, [[11, 13.5], [21, 13.5], [19, 18], [16, 19.5], [13, 18]], hr); D(pb, 15, 15, '#7a3a30'); D(pb, 16, 15, '#7a3a30'); }
  return pb;
}

/* ---------- Cenário do mapa (escala 1:1) ---------- */
const LEAF = rampOf('#3f8a3e'), LEAF_D = rampOf('#2a6a40'), BARK = rampOf('#6a4424'), STONE = rampOf('#8e8aa0');
function dPine(pal) {
  const pb = new PB(22, 36), lf = rampOf(pal.a || '#2f7a3b'), ol = olOf(pal.a || '#2f7a3b');
  R(pb, 9.5, 27, 3, 8, BARK, { cyl: true });
  for (let i = 0; i < 4; i++) { const top = 1 + i * 6.5, bot = 13 + i * 6.5, hw = 4.5 + i * 2.4; PL(pb, [[11, top], [11 + hw, bot], [11 - hw, bot]], lf, { dith: .35 }); }
  outline(pb, ol);
  for (let i = 0; i < 4; i++) LN(pb, 11 - 2 - i, 12 + i * 6.5, 11 + 3 + i * 1.5, 12 + i * 6.5, lf[1], 1);
  return pb;
}
function dOak() {
  const pb = new PB(26, 34), ol = '#173a1e';
  R(pb, 11, 20, 4, 13, BARK, { cyl: true }); PL(pb, [[9, 33], [17, 33], [15, 30], [11, 30]], BARK);
  E(pb, 13, 13, 11.5, 10, LEAF, { noise: true }); E(pb, 7, 16, 6, 5.5, LEAF, { noise: true }); E(pb, 19.5, 16.5, 6, 5.2, LEAF, { noise: true });
  outline(pb, ol);
  E(pb, 10, 8, 3.5, 2.5, ['#6ab85a']); D(pb, 16, 6, '#7acb6a');
  return pb;
}
function dBush(pal) {
  const pb = new PB(20, 14), ol = '#173a1e';
  E(pb, 10, 8, 9, 5.6, LEAF, { noise: true }); E(pb, 6, 7, 4.5, 4.2, LEAF); E(pb, 14, 6.5, 4.5, 4.2, LEAF);
  outline(pb, ol);
  if (pal.berry) [[5, 6], [9, 4], [13, 7], [15, 4], [8, 9], [12, 10]].forEach(([x, y]) => { D(pb, x, y, '#e8404e'); D(pb, x + 1, y, '#b02a3a'); D(pb, x, y - 1, '#ff8a9a'); });
  return pb;
}
function dRock() { const pb = new PB(16, 12); E(pb, 8, 7, 7, 4.6, STONE, { noise: true }); E(pb, 5, 5, 3, 2.4, STONE); outline(pb, '#2a2638'); D(pb, 5, 3, '#d8d4e8'); D(pb, 6, 3, '#d8d4e8'); return pb; }
function dStones() {
  const pb = new PB(22, 16);
  E(pb, 7, 10, 6, 4.4, STONE, { noise: true }); E(pb, 15, 11, 6, 4, STONE, { noise: true }); E(pb, 11, 5.5, 5, 4, STONE, { noise: true });
  outline(pb, '#2a2638'); [[9, 3], [5, 8], [13, 9]].forEach(([x, y]) => { D(pb, x, y, '#e0dcf0'); D(pb, x + 1, y, '#c8c4dc'); });
  return pb;
}
function dStump() { const pb = new PB(14, 10); R(pb, 2, 4, 10, 5, BARK, { cyl: true }); E(pb, 7, 4, 5, 2, rampOf('#c8a070')); outline(pb, '#2a1a10'); LN(pb, 5, 4, 9, 4, '#8a6a40', 1); return pb; }
function dLogs() { const pb = new PB(24, 14); for (const [y, x] of [[8, 2], [8, 11], [3, 6]]) { R(pb, x, y, 11, 5, BARK, { cyl: false }); E(pb, x, y + 2.5, 2.2, 2.5, rampOf('#d8b080')); } outline(pb, '#2a1a10'); return pb; }
function dDeadTree() {
  const pb = new PB(22, 30), w = rampOf('#5a4a3a');
  R(pb, 9, 10, 4, 19, w, { cyl: true }); PL(pb, [[6, 29], [16, 29], [13, 25], [9, 25]], w);
  for (const [a, b, c, d] of [[11, 14, 3, 6], [11, 11, 19, 3], [11, 18, 18, 12], [11, 9, 6, 1], [5, 6, 2, 3], [17, 6, 20, 1]]) LN(pb, a, b, c, d, w[1], 2);
  outline(pb, '#1a120c'); return pb;
}
function dReeds() { const pb = new PB(14, 14); for (let i = 0; i < 6; i++) { const x = 2 + i * 2, h = 6 + (i * 7) % 6; LN(pb, x, 13, x + (i % 2 ? 1 : -1), 13 - h, i % 2 ? '#7a9a4a' : '#5a7a3a', 1); if (i % 2) R(pb, x, 13 - h - 2, 1.4, 3, ['#7a5a34']); } return pb; }
function dSign() { const pb = new PB(16, 16); R(pb, 7, 7, 2, 9, BARK); R(pb, 1, 1, 14, 7, rampOf('#b88350'), { edge: '#3a2412' }); LN(pb, 3, 4, 12, 4, '#5a3d2b', 1); outline(pb, '#2a1a10'); return pb; }
function dFire() {
  const pb = new PB(16, 16);
  for (const a of [-.6, .6, 0]) LN(pb, 8 - Math.sin(a) * 6, 14, 8 + Math.sin(a) * 6, 11, '#6a4424', 2);
  PL(pb, [[4, 12], [8, 1], [12, 12]], ['#c8401a', '#ff7a2a', '#ffc84a', '#fff3a0'], { dith: .3 });
  PL(pb, [[6, 12], [8, 6], [10, 12]], ['#ffc84a', '#fff3a0']);
  outline(pb, '#2a1a10'); return pb;
}
function dChest() {
  const pb = new PB(20, 16), w = rampOf('#a8703e');
  R(pb, 2, 7, 16, 8, w, { edge: '#3a2412' }); E(pb, 10, 7, 8, 4, rampOf('#b88350'), { edge: '#3a2412' }); R(pb, 2, 6, 16, 2, w);
  R(pb, 9, 3, 2.4, 12, GOLD); R(pb, 2, 11, 16, 1.4, GOLD); E(pb, 10.2, 10, 1.8, 1.8, ['#fff3a0']);
  outline(pb, '#2a1a10'); return pb;
}
function dShrine() {
  const pb = new PB(16, 30);
  R(pb, 5, 12, 6, 16, STONE, { cyl: true }); R(pb, 2, 26, 12, 3, STONE); R(pb, 3, 10, 10, 3, STONE);
  E(pb, 8, 6, 4.5, 4.5, ['#c88a1a', '#ffd84a', '#fff3a0', '#ffffff'], { dith: .2 });
  outline(pb, '#2a2638'); LN(pb, 7, 16, 9, 22, '#6a6680', 1); return pb;
}
function dWaygate() {
  const pb = new PB(24, 22), s = rampOf('#9a96b0');
  R(pb, 1, 4, 22, 17, s, { edge: '#2a2638' }); R(pb, 5, 7, 14, 11, ['#1a3a78', '#2a5aa8', '#3a7ad0']); R(pb, 8, 9.5, 8, 6, ['#5ab0f0', '#9ad8ff']); R(pb, 10.5, 11, 3, 3, ['#ffffff']);
  for (const x of [1, 19]) R(pb, x, 0, 4, 5, s, { edge: '#2a2638' });
  outline(pb, '#14121e'); return pb;
}
function dHouse(pal) {
  const W = pal.w || 34, Hh = pal.h || 30, pb = new PB(W, Hh), roof = rampOf(pal.roof), wall = rampOf(pal.wall || '#ece0c0');
  const wy = Math.round(Hh * .5);
  R(pb, 3, wy, W - 6, Hh - wy - 1, wall, { dith: .2 });
  for (let x = 4; x < W - 4; x += 4) R(pb, x, wy, 1, Hh - wy - 1, [wall[1]]);
  PL(pb, [[0, wy + 2], [W / 2, 1], [W, wy + 2]], roof, { dith: .25 });
  for (let y = 5; y < wy; y += 3) LN(pb, W / 2 - (y - 1) * (W / 2) / (wy + 1), y, W / 2 + (y - 1) * (W / 2) / (wy + 1), y, roof[1], 1);
  R(pb, 0, wy + 1, W, 2, [roof[0]]);
  const dx = Math.round(W / 2 - 3); R(pb, dx, Hh - 10, 6, 9, BARK, { edge: '#2a1a10' }); D(pb, dx + 4, Hh - 6, '#f5c451');
  for (const x of [6, W - 12]) { R(pb, x, wy + 5, 6, 5, [pal.win || '#7fb4e8'], { edge: '#3a2a1a' }); LN(pb, x + 3, wy + 5, x + 3, wy + 10, '#3a2a1a', 1); }
  if (pal.chim) { R(pb, W - 10, 1, 4, 8, STONE, { edge: '#2a2638' }); }
  outline(pb, '#1e140e'); return pb;
}
function dHut() {
  const pb = new PB(30, 24), roof = rampOf('#4f7a3a'), wall = rampOf('#9a6a3a');
  R(pb, 3, 12, 24, 11, wall, { edge: '#3a2412' }); for (let x = 5; x < 27; x += 3) R(pb, x, 12, 1, 11, [wall[1]]);
  PL(pb, [[0, 14], [15, 0], [30, 14]], roof, { dith: .35 }); for (let y = 4; y < 13; y += 3) R(pb, 15 - y * 1.1, y, y * 2.2, 1, [roof[1]]);
  R(pb, 12, 15, 6, 8, ['#1a100a']);
  outline(pb, '#14100a'); return pb;
}
function dDen() {
  const pb = new PB(50, 28), w = rampOf('#9a6a3a');
  for (let x = 1; x < 49; x += 4) { R(pb, x, 5 + (x % 8 ? 1 : 0), 3.6, 22, w, { cyl: true }); PL(pb, [[x, 5 + (x % 8 ? 1 : 0)], [x + 1.8, 1 + (x % 8 ? 1 : 0)], [x + 3.6, 5 + (x % 8 ? 1 : 0)]], w); }
  R(pb, 0, 12, 50, 2, ['#5a3d2b']);
  E(pb, 25, 22, 8, 9, ['#120a08'], { edge: '#3a2412' }); R(pb, 17, 22, 16, 6, ['#120a08']);
  for (const x of [13, 37]) { R(pb, x, 14, 2, 8, ['#5a3d2b']); E(pb, x + 1, 12, 2, 2.5, ['#ff7a2a', '#ffd84a']); }
  E(pb, 25, 9, 3, 3, BONE); D(pb, 24, 9, '#1a1220'); D(pb, 26, 9, '#1a1220');
  outline(pb, '#1a100a'); return pb;
}
function dCrypt() {
  const pb = new PB(44, 30), s = rampOf('#9a96b0');
  R(pb, 3, 11, 38, 18, s, { dith: .3 }); PL(pb, [[0, 12], [22, 0], [44, 12]], rampOf('#7a7690'), { dith: .3 });
  for (const x of [5, 35]) R(pb, x, 12, 4, 17, s, { cyl: true });
  E(pb, 22, 20, 6, 7, ['#0e0a16'], { edge: '#3a3650' }); R(pb, 16, 20, 12, 9, ['#0e0a16']);
  R(pb, 20, 4, 4, 6, ['#d8d4e8']); R(pb, 18, 6, 8, 2, ['#d8d4e8']);
  outline(pb, '#14121e'); return pb;
}
function dTower() {
  const pb = new PB(28, 54), s = rampOf('#6a6090');
  R(pb, 5, 14, 18, 39, s, { cyl: true }); for (let y = 18; y < 52; y += 5) LN(pb, 5, y, 22, y, s[1], 1);
  PL(pb, [[2, 15], [14, 0], [26, 15]], rampOf('#4a2f80'), { dith: .3 });
  for (const y of [21, 31]) { R(pb, 12, y, 4, 5, ['#ffd84a', '#fff3a0']); }
  R(pb, 10, 43, 8, 10, ['#0e0a16']); E(pb, 14, 43, 4, 3, ['#0e0a16']);
  for (const x of [3, 21]) R(pb, x, 12, 4, 4, s);
  outline(pb, '#120c22'); D(pb, 14, 1, '#c8a0ff'); return pb;
}
function dColiseum() {
  const pb = new PB(62, 36), s = rampOf('#d8c8a0');
  E(pb, 31, 20, 30, 15, s, { dith: .3 }); E(pb, 31, 15, 25, 8, rampOf('#a8956c'));
  E(pb, 31, 15, 20, 5.5, rampOf('#c89a58'));
  for (let i = 0; i < 9; i++) { const x = 7 + i * 6; R(pb, x, 22, 3, 6, ['#3a2a1a']); E(pb, x + 1.5, 22, 1.5, 1.2, ['#3a2a1a']); }
  R(pb, 27, 26, 8, 9, ['#2a1a10']); E(pb, 31, 26, 4, 3, ['#2a1a10']);
  for (const x of [14, 31, 48]) { R(pb, x, 0, 1, 8, ['#5a3d2b']); PL(pb, [[x + 1, 0], [x + 7, 2], [x + 1, 4]], [x === 31 ? '#c8402e' : '#3a62c8']); }
  outline(pb, '#2a1e10'); return pb;
}
function dPlot() { const pb = new PB(44, 10), w = rampOf('#9a6a3a'); for (let x = 1; x < 44; x += 7) R(pb, x, 1, 3, 9, w, { cyl: true }); R(pb, 0, 3, 44, 2, w); R(pb, 0, 7, 44, 1.6, w); outline(pb, '#2a1a10'); return pb; }

const GENS2 = {
  slime: gSlime, bat: gBat, goblin: gGoblin, spider: gSpider, skeleton: gSkeleton, ghost: gGhost, golem: gGolem, wyrm: gWyrm,
  rat: gRat, wolf: gWolf, worm: gWorm, goblin_mage: gGoblinMage, human: gHuman,
  hero_guerreiro: p => gHero('guerreiro', p), hero_mago: p => gHero('mago', p), hero_ladino: p => gHero('ladino', p), hero_clerigo: p => gHero('clerigo', p),
  pine: dPine, oak: dOak, tree: dOak, bush: dBush, berry: () => dBush({ berry:1 }), rock: dRock, stones: dStones, stump: dStump, logs: dLogs, deadtree: dDeadTree, reeds: dReeds,
  sign: dSign, fire: dFire, chest: dChest, shrine: dShrine, waygate: dWaygate, hut: dHut, den: dDen, crypt: dCrypt, tower: dTower, coliseum: dColiseum, plot: dPlot,
  house_red: () => dHouse({ roof:'#c8483a', chim:1 }), house_blue: () => dHouse({ roof:'#4a72c8', win:'#ffe9a0' }), house_big: () => dHouse({ roof:'#8a4a2a', w:44, h:36, chim:1, win:'#ffe9a0' }),
};
const SPR2 = new Map();
function spr(key, pal, flip) {
  const official = typeof OFFICIAL_ART !== 'undefined' && OFFICIAL_ART.building[key] && officialSprite(OFFICIAL_ART.building[key],flip); if(official) return official;
  const sig = key + '|' + (pal ? JSON.stringify(pal) : '') + (flip ? '|f' : '');
  if (SPR2.has(sig)) return SPR2.get(sig);
  let c = toCanvas(GENS2[key](pal || {}));
  if (flip) { const f = document.createElement('canvas'); f.width = c.width; f.height = c.height; const g = f.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); c = f; }
  SPR2.set(sig, c); return c;
}
const MINI_SRC = {"hero_guerreiro":{"r":["......pp........",".....pPPo.......","....ohhhhoo.....","...ohhhhhhho....","...ohhhhhhhHo...","...oHHHHHHHHo.o.","...oHssssesHowo.","....oSssssso.ow.",".....oSSSSo..ow.","..ooommmmmmo.ow.",".oDddmmaammoogo.",".oDdgdaaaaaossoo",".oDdddAAAAAoo...","..oDdobbgbbo....","...ooaAo.aAo....","....obbo.obbo..."],"p":{"p":"#e0453a","P":"#9e2a2a","h":"#d2dae8","H":"#8a94ae","m":"#a9b3c8","a":"#c9453a","A":"#8a2b2a","b":"#5a3d2b","g":"#e6b53a","w":"#eef3fb","d":"#9a6a3a","D":"#6a4424","e":"#1a1220","s":"#f2c28e","S":"#c98a5e"}},"hero_mago":{"r":[".......oo.......","......oCCo......",".....oCCCo......","....oCCCCCo..oo.","...oCCCCCCo..oxo","..oyyyyyyyyyo.oo","...ossssesso..w.","...oSssssssSo.w.","....oSbbbbSo..w.","...ooCbbbbCoo.w.","..oCCCbbbbCCCow.","..oCCcCCCCcCCsw.","..oCCcCCCCcCCow.","..oCCyCCCCyCCow.","...oCCCCCCCCo.w.","....oooooooo..o."],"p":{"C":"#3f5fd8","c":"#2a3b94","y":"#e6b53a","b":"#e8e8f2","w":"#9a6a3a","x":"#9ff3ff","e":"#1a1220","s":"#f2c28e","S":"#c98a5e"}},"hero_ladino":{"r":["................",".....oooooo.....","....oGGGGGGo....","...oGGGGGGGGo...","...oGgGGGGGGGo..","...oGgossssoGo..","...oGgsssesso...","...oGgkkkkkko...","....okkkkkkGo...","...ooGGGGGGGoo..","..olGGlLGGGGlwo.","..olGGGLGGGGoww.","..ooGGGGLGGGo.o.","....obbbbbbbo...","...oGGo..oGGo...","...obbo..obbo..."],"p":{"G":"#3a8f6a","g":"#235c45","k":"#1f4f3a","l":"#5a3d2b","L":"#8a5a34","b":"#3a2a22","w":"#dfe6f2","e":"#1a1220","s":"#f2c28e","S":"#c98a5e"}},"rat":{"r":["................","................","................","................","................","..........oo....",".........oPro...","....ooooopwwoo..","...owwwwwwwwkwo.","..owwwwwwwwwwwno","..owWwwwwwwwwwo.",".owWWWwwwwwwwo..","oWoWWWWWWWWWo...","oo.oWoooooWo....","...oo....oo.....","................"],"p":{"w":"#e9e6ee","W":"#a9a4b8","p":"#f0a0b0","P":"#c46a80","r":"#f0a0b0","k":"#1a1220","n":"#f08090"}},"slime":{"r":["................","................","................","................","......oooo......","....ooGGGGoo....","...oGGhhGGGGo...","..oGGhhGGGGGGo..","..oGGGGGGGGGGo..",".oGGGkGGGGkGGGo.",".oGGGkGGGGkGGGo.",".oGGGGGGGGGGGgo.",".ogGGGGmmGGGGgo.","..oggGGGGGGggo..","...oooooooooo...","................"],"p":{"G":"#6fcf5f","g":"#3f9a47","h":"#d6ffc4","k":"#1a1220","m":"#2a6a30"}},"goblin":{"r":["................","................",".o..........o...",".oo..oooo..oo...",".oGooGGGGooGo...","..oGGGGGGGGo....","...oGyGGyGGo....","...oGkGGkGGo....","...oGGGGGGgo....","....oGwwwGo.oo..","...oollllloowo..","..oGolLLLlGowo..","..oGolllllooo...","....obbobbo.....","....oGo.oGo.....","....oo..oo......"],"p":{"G":"#8bbf4a","g":"#567a2c","y":"#ffd84a","k":"#1a1220","w":"#f2f2e2","l":"#7a5a34","L":"#a07a48","b":"#4a3420"}},"goblin_mage":{"r":[".......oo.......","......oPPo......",".....oPPPPo.....",".o..oPPPPPPo.o..",".oo.oyyyyyyo.oo.",".oGoGGGGGGGGoGo.","..oGGyGGGyGGGo..","...oGkGGGkGGo...","...oGGGGGGGgo.x.","....oGwwwwGo.oo.","...ooPPPPPPooo..","..oGoPpPPpPoGo..","..oooPpPPpPooo..","....oPPPPPPo....","....oGGooGGo....","....ooo..ooo...."],"p":{"G":"#8bbf4a","g":"#567a2c","y":"#ffd84a","k":"#1a1220","w":"#f2f2e2","P":"#7a46b0","p":"#4e2a7a","x":"#ff9a3a"}},"wolf":{"r":["................","................","................","...........o.o..","..........oGoGo.","..........oGGGGo","..o.......oGkGwo",".oGo....ooGGGGoo",".oGGooooGGGGGGo.","..oGGGGGGGGGGo..","..oGGGGGGGGGgo..","...oGgggggGgo...","...ogo.ogoogo...","...oo..oo.oo....","................","................"],"p":{"G":"#8a8a9e","g":"#5e5e72","k":"#ffd84a","w":"#e8e8f0"}},"bat":{"r":["................","................","................","................","..o..........o..",".oPo..o..o..oPo.","oPPPo.oooo.oPPPo","oPpPPoPPPPoPPpPo","oPpPPPPrPrPPPpPo",".opPPPPPPPPPPpo.","..op.oPwwPo.po..","...o..oPPo..o...",".......oo.......","................","................","................"],"p":{"P":"#7a5fb0","p":"#4b3a78","r":"#ff5a5a","w":"#f2f2f2"}},"spider":{"r":["................","................","................","................","....o......o....","...oPo....oPo...","..oPo.oooo.oPo..",".oPo.oSSSSo.oPo.",".o..oSsSSsSo..o.","..ooSSrSSrSSoo..",".oPoSSSSSSSSoPo.",".oPooSSmmSSooPo.","oPo..oSSSSo..oPo","oo...oPooPo...oo","....oPo..oPo....","....oo....oo...."],"p":{"P":"#3a2f48","S":"#5a4a6a","s":"#8a7aa0","r":"#ff4a6a","m":"#c4304a"}},"skeleton":{"r":["................",".....oooooo.....","....obbbbbbo....","....obbbbbbbo...","....obkbbkbbo...","....obrbbrbbo...",".....obbbbbo....","......owowo.....","...ooobbbbbooo..","..obo.obobo.obo.","..obo.obbbo.obo.","...o..obobo..o..","......obbbo.....",".....obo.obo....",".....obo.obo....","....ooo..ooo...."],"p":{"b":"#e8e2cc","k":"#1a1220","r":"#ff6a4a","w":"#a69f86"}},"ghost":{"r":["................",".....oooooo.....","....oWWWWWWo....","...oWWWWWWWWo...","...oWkkWWkkWo...","...oWkkWWkkWo...","..oWWWWWWWWWWo..","..oWWWWmmWWWWo..","..oWWWWmmWWWWo..","..oWWWWWWWWWBo..","..oBWWWWWWWWBo..","..oBBWWWWWWBBo..","..oBBBWBBWBBBo..","..oBo.oBBo.oBo..","..oo...oo...oo..","................"],"p":{"W":"#e6f2ff","B":"#9fc0e8","k":"#2a2848","m":"#2a2848"}},"golem":{"r":["................","....oooooooo....","...oRRRRRRRRo...","...oRRyRRyRRo...","...oRRRRRRRRo...",".ooorrrrrrrrooo.","oRRRoRRRRRRoRRRo","oRrRoRRmmRRoRrRo","oRrRoRRRRRRoRrRo","orrroRRRRRRorrro","ooooorrrrrrooooo","....oRRoRRRo....","....oRRooRRo....","...oRRRo.oRRo...","...orrro.orrro..","...ooooo.ooooo.."],"p":{"R":"#a29eb4","r":"#6d6a7e","y":"#ffcc44","m":"#5aa0e0"}},"wyrm":{"r":["................","........oo......",".....oooWWo.....","....oWWoWWWoo...","...oWWWWWWWWWo..","...oWyWWWWWWWWo.","...oWWWWWWwwwwo.","..ooWWWWoooooo..",".oWWoWWWWo......","oWWWWoWWWWoo....","oWwWWoWWWWWWo...",".oWWWWWWWWWWWo..","..oWWcccWWWWWo..","...oWWWWWoWWo...","...oWWooWo.oo...","....oo..oo......"],"p":{"W":"#c9533a","w":"#f2c97e","y":"#ffe65a","c":"#f2c97e"}},"bandit":{"r":["................",".....oooooo.....","....oRRRRRRo....","...oRRRRRRRRo...","...oRrrrrrrRo...","...ossssesso....","...oSkkkkkkSo...","....okkkkkko....","...ooBBBBBBoo...","..oBoBlBBlBoBo..","..oBoBBlBlBoso..","..oooBBBlBBoww..","....obbbbbbo.w..","....oBBooBBo....","....obbo.obbo...","....ooo..ooo...."],"p":{"R":"#8a2b2a","r":"#5a1c1c","B":"#6a5a48","l":"#3a2a22","k":"#3a3240","b":"#3a2a22","w":"#dfe6f2","s":"#f2c28e","S":"#c98a5e","e":"#1a1220"}},"worm":{"r":["................","................","................","................","................","..........oooo..",".........oPPPPo.","........oPPkPPo.","..oooo..oPPPPPo.",".oPPPPo.oPpPPo..","oPPpPPPooPPPo...","oPPPPpPPPpPo....",".oPPPPPpPPo.....","..oooooooo......","................","................"],"p":{"P":"#e08a9a","p":"#b05a6a","k":"#1a1220"}},"npc":{"r":["................",".....oooooo.....","....oHHHHHHo....","...oHHHHHHHHo...","...oHssssssHo...","...ossesseso....","...oSsssssSo....","....oSSSSSo.....","...ooTTTTTTo....","..oTToTTTTTTo...","..oTToTTTTToTo..","..osoTTTTTToso..","...ooTTTTTTo....","....oTTTTTTo....","....obbo.obbo...","....ooo..ooo...."],"p":{"H":"#6a4424","T":"#c9a24a","b":"#4a3420","s":"#f2c28e","S":"#c98a5e","e":"#1a1220"}},"house_red":{"r":["....oooooooooo....","...oRRRRRRRRRRo...","..oRRrRRRRRRrRRo..",".oRRRRRRRRRRRRRRo.","oRRrRRRRRRRRRRrRRo","orrrrrrrrrrrrrrrro","oooooooooooooooooo",".oWWWWWWWWWWWWWWo.",".oWbbWWWddWWWbbWo.",".oWbbWWWddWWWbbWo.",".oWWWWWWddWWWWWWo.",".oSSSSSSddSSSSSSo.",".oooooooooooooooo."],"p":{"R":"#c8483a","r":"#8e2c26","W":"#efe3c4","S":"#bba98a","b":"#7fb4e8","d":"#6a4424"}},"house_blue":{"r":["....oooooooooo....","...oBBBBBBBBBBo...","..oBBqBBBBBBqBBo..",".oBBBBBBBBBBBBBBo.","oBBqBBBBBBBBBBqBBo","oqqqqqqqqqqqqqqqqo","oooooooooooooooooo",".oWWWWWWWWWWWWWWo.",".oWbbWWWddWWWbbWo.",".oWbbWWWddWWWbbWo.",".oWWWWWWddWWWWWWo.",".oSSSSSSddSSSSSSo.",".oooooooooooooooo."],"p":{"B":"#4a72c8","q":"#2c4a8a","W":"#efe3c4","S":"#bba98a","b":"#ffe9a0","d":"#6a4424"}},"hut":{"r":["......oooo......",".....oGGGGo.....","....oGGgGGGo....","...oGGGGGGgGo...","..oGgGGGGGGGGo..",".oGGGGGGgGGGGGo.","oggggggggggggggo","oooooooooooooooo",".oLLLLLooLLLLLo.",".oLLLLodddoLLLo.",".oLLLLodddoLLLo.",".oooooooooooooo."],"p":{"G":"#4f7a3a","g":"#33552a","L":"#9a6a3a","d":"#2a1a10"}},"den":{"r":[".o..o..o..o..o..o..o..o.","oPooPooPooPooPooPooPooPo","oPPoPPoPPoPPoPPoPPoPPoPo","oPpoPpoPpoPpoPpoPpoPpoPo","oPpoPpoPpoooooPpoPpoPpoo","oPpoPpoPooKKKKooPpoPpoPo","oPpoPpoPoKKKKKKoPpoPpoPo","oPpoPpoPoKKKKKKoPpoPpoPo","oPpoPpoPoKKKKKKoPpoPpoPo","oPpoPpoPoKKKKKKoPpoPpoPo","oooooooooKKKKKKooooooooo"],"p":{"P":"#9a6a3a","p":"#6a4424","K":"#120a08"}},"crypt":{"r":["..........oooo..........","........ooSSSSoo........","......ooSSSSSSSSoo......","....ooSSSSSSSSSSSSoo....","..ooSSSSSSSSSSSSSSSSoo..","oooooooooooooooooooooooo",".oSsoSSSSSoooSSSSSoSsSo.",".oSsoSSSSoKKKoSSSSoSsSo.",".oSsoSSSoKKKKKoSSSoSsSo.",".oSsoSSSoKKKKKoSSSoSsSo.",".oSsoSSSoKKKKKoSSSoSsSo.","oooooooooKKKKKoooooooooo"],"p":{"S":"#9a96b0","s":"#6a6680","K":"#0e0a16"}},"tower":{"r":["......oo......",".....oPPo.....","....oPPPPo....","...oPPPPPPo...","..oPPPPPPPPo..",".oooooooooooo.",".oSoSSSSSSoSo.",".oSSSSyySSSSo.",".oSSSSyySSSSo.",".osSSSSSSSSso.",".osSSSSSSSSso.",".osSSSyySSSso.",".osSSSyySSSso.",".osSSSSSSSSso.",".osSSSSSSSSso.",".osSSSSSSSSso.",".osSSSooSSSso.",".osSSoKKoSSso.",".osSSoKKoSSso.","oooooooooooooo"],"p":{"P":"#4a2f80","S":"#6a6090","s":"#4a4270","y":"#ffd84a","K":"#0e0a16"}},"coliseum":{"r":["......oooooooooooo......","...oooSSSSSSSSSSSSooo...","..oSSoSSoSSoSSoSSoSSo...",".oSSSoSSoSSoSSoSSoSSSo..","oSSSSSSSSSSSSSSSSSSSSSo.","osSoSSoSSoSSoSSoSSoSSso.","osSoKKoSSoKKoSSoKKoSSso.","osSoKKoSSoKKoSSoKKoSSso.","osSSSSSSSSSSSSSSSSSSSso.","osSoSSoSSoooooSSoSSoSso.","osSoKKoSSoKKKoSSoKKoSso.","osSoKKoSSoKKKoSSoKKoSso.","oooooooooooKKKoooooooooo"],"p":{"S":"#d8c8a0","s":"#a8956c","K":"#3a2a1a"}},"waygate":{"r":["oooooooooooo","oSSSSSSSSSSo","oSssssssssSo","oSsbbbbbbsSo","oSsbBBBBbsSo","oSsbBwwBbsSo","oSsbBwwBbsSo","oSsbBBBBbsSo","oSsbbbbbbsSo","oSssssssssSo","oSSSSSSSSSSo","oooooooooooo"],"p":{"S":"#9a96b0","s":"#6a6680","b":"#2a5aa8","B":"#5ab0f0","w":"#dff6ff"}},"chest":{"r":["..oooooooo..",".oLLLLLLLLo.","oLLLLggLLLLo","oooooggooooo","oLLLLyyLLLLo","oLLLLggLLLLo","olllLggLlllo","oooooooooooo"],"p":{"L":"#a8703e","l":"#7a4e28","g":"#e6b53a","y":"#fff3a0"}},"shrine":{"r":["...oooo...","..oyYYyo..","..oYwwYo..","..oyYYyo..","...oooo...","...oSSo...","...oSso...","...oSso...","...oSso...","..oSSsso..",".oSSSssso.",".oooooooo."],"p":{"y":"#c88a1a","Y":"#ffd84a","w":"#fff8d0","S":"#a8a4b8","s":"#7a7690"}},"stones":{"r":["....oooo....","...oSSSso...","..oSwSSSso..","..oSSSSsso..",".oooSssooooo","oSSSoooSSSso","oSwSSsoSwSso","oSSSssoSSsso","oooooooooooo"],"p":{"S":"#a8a4b8","s":"#77738c","w":"#dcd8ea"}},"logs":{"r":["............","..oooooooo..",".oWwLLLLLLo.",".oWWLLLLLLo.","oooooooooooo","oWwLLLLLLLLo","oWWLLLLLLLLo","oooooooooooo"],"p":{"W":"#e0c08a","w":"#b8935e","L":"#7a4e28"}},"bush":{"r":["...oooooo...","..oGGgGGGo..",".oGgGGGGGGo.","oGGGGGGgGGGo","oGgGGGGGGGgo","oGGGGgGGGggo",".oggGGGGggo.","..oooooooo.."],"p":{"G":"#3f8a3e","g":"#2a6230"}},"berry":{"r":["...oooooo...","..oGGgGGGo..",".oGgGrGGGGo.","oGGGGGGgGGGo","oGgGGGGrGGgo","oGrGGgGGGggo",".oggGGGGggo.","..oooooooo.."],"p":{"G":"#3f8a3e","g":"#2a6230","r":"#e04050"}},"rock":{"r":["...oooo...","..oSSSso..",".oSwSSSso.","oSSSSSssso","oSSSssssso",".osssssso.","..ooooooo."],"p":{"S":"#8e8a9c","s":"#64607a","w":"#c0bccc"}},"tree":{"r":["......oo......",".....oLLo.....","....oLLMMo....","....oLMMMo....","...oLLMMMDo...","...oLMMMDDo...","..oLLMMMDDDo..","..oLMMMMDDDo..",".oLLMMMMDDDDo.",".oLMMMMMDDDDo.","oLLMMMMMDDDDDo","oDDDDDDDDDDDDo",".oooooTToooo..","......TT......","......tT......",".....oooo....."],"p":{"L":"#4a944c","M":"#2f6e3a","D":"#24552f","T":"#6a4424","t":"#4a2e16"}},"stump":{"r":["..oooooo..",".oWwwwwWo.",".oWWWWWWo.",".oLLLLLLo.","oLLLLLLLLo","oooooooooo"],"p":{"W":"#e0c08a","w":"#b8935e","L":"#7a4e28"}},"sign":{"r":["oooooooooo","oWWWWWWWWo","oWddddddWo","oWWWWWWWWo","oooooooooo","....oPo...","....oPo...","....oPo..."],"p":{"W":"#c8955a","d":"#6a4424","P":"#7a4e28"}},"fire":{"r":["....oo....","...oYo....","..oYRYo...","..oRYRo...",".oLoRoLo..","oLLLLLLLo.",".oooooooo."],"p":{"Y":"#ffd84a","R":"#ff7a2a","L":"#6a4424"}},"reeds":{"r":["..o..o..",".oGooGo.",".oGo.Go.","oGooGGo.","oGoGoGo.",".oGGGo.."],"p":{"G":"#7a9a4a"}},"deadtree":{"r":["..o.....o...",".oBo...oBo..","..oBo.oBo...","...oBoBo.oo.","o...oBBooBo.","oBo.oBBBBo..",".oBBoBBoo...","..ooBBBo....","....oBBo....","....oBBo....","....oBbo....","...oBBbbo...","..oooooooo.."],"p":{"B":"#5a4a3a","b":"#3a2e24"}},"plot":{"r":["oPoooooooooooooooPo","oPWWWWWWWWWWWWWWWPo","oPoooooooooooooooPo",".o...............o."],"p":{"P":"#7a4e28","W":"#b8935e"}},"ic_codex":{"r":["..oooooooooo..",".oRRRRRRRRRRo.",".oRrrrrrrrrRo.",".oRrrryyrrrRo.",".oRrrryyyrrRo.",".oRrrrrryrrRo.",".oRrrrryyrrRo.",".oRrrrryrrrRo.",".oRrrrrrrrrRo.",".oRrrrryrrrRo.",".oRRRRRRRRRRo.",".oPPPPPPPPPPo.","..oooooooooo.."],"p":{"R":"#a8402e","r":"#7a2a1e","y":"#ffd84a","P":"#efe3c4"}},"ic_quest":{"r":["..oooooooooo..",".oWWWWWWWWWWo.","..oPPPPPPPPo..","..oPddddddPo..","..oPPPPPPPPo..","..oPddddPPPo..","..oPPPPPPPPo..","..oPdddddPPo..","..oPPPPPPPPo..",".oWWWWWWWWWWo.","..oooooooooo..","..............",".............."],"p":{"W":"#c8a070","P":"#efe3c4","d":"#8a6a40"}},"ic_items":{"r":["......oo......",".....oWWo.....",".....oCCo.....","....oRRRRo....","...oRrRRRRo...","..oRrRRRRRRo..","..oRRRRRRRRo..","..oRRRRRRRRo..","..oRRRRRRRro..","...oRRRRRro...","....oooooo....","..............",".............."],"p":{"W":"#e8e2c8","C":"#a8703e","R":"#e04a5a","r":"#ffb0c0"}},"ic_map":{"r":["..............",".oooooooooooo.",".oGGGgBBBGGGo.",".oGGgBBBGGyGo.",".oGGBBBGGGGGo.",".oGGBBGGGGGGo.",".oGgBBGGGgGGo.",".oGGGBBGrrGGo.",".oGGGGBGrrGGo.",".oGGGGBBGGGGo.",".oooooooooooo.","..............",".............."],"p":{"G":"#7ab858","g":"#4a8a3e","B":"#4a8ad8","y":"#ffd84a","r":"#e04a3a"}},"ic_home":{"r":["......oo......",".....oRRo.....","....oRRRRo....","...oRRRRRRo...","..oRRRRRRRRo..",".oooooooooooo.","..oWWWWWWWWo..","..oWbWWddWWo..","..oWWWWddWWo..","..oooooooooo.."],"p":{"R":"#c8483a","W":"#efe3c4","b":"#7fb4e8","d":"#6a4424"}},"ic_gate":{"r":["oooooooooo","oSSSSSSSSo","oSbbbbbbSo","oSbBBBBbSo","oSbBwwBbSo","oSbBwwBbSo","oSbBBBBbSo","oSbbbbbbSo","oSSSSSSSSo","oooooooooo"],"p":{"S":"#9a96b0","b":"#2a5aa8","B":"#5ab0f0","w":"#dff6ff"}},"ic_resume":{"r":["....oo....","....oYo...","oooooYYo..","oYYYYYYYo.","oYYYYYYYYo","oYYYYYYYo.","oooooYYo..","....oYo...","....oo...."],"p":{"Y":"#ffd84a"}},"ic_lock":{"r":["...oooo...","..oSSSSo..","..oSooSo..","..oSooSo..",".oooooooo.",".oGGGGGGo.",".oGGooGGo.",".oGGooGGo.",".oGGGGGGo.",".oooooooo."],"p":{"S":"#c8c4d8","G":"#e6b53a"}}};
const MINI_OL = "#1a1220";
/* ===== Sprites 16x16 a partir dos mapas de pixels ===== */
const MINI = new Map();
function mini(key, pal, flip) {
  const sig = key + '|' + (pal ? JSON.stringify(pal) : '') + (flip ? '|f' : '');
  if (MINI.has(sig)) return MINI.get(sig);
  const src = MINI_SRC[key], P = Object.assign({}, src.p, pal || {}), w = src.r[0].length, h = src.r.length;
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  src.r.forEach((row, y) => { for (let x = 0; x < w; x++) { const ch = row[x]; if (ch === '.') continue; g.fillStyle = ch === 'o' ? MINI_OL : (P[ch] || '#ff00ff'); g.fillRect(flip ? w - 1 - x : x, y, 1, 1); } });
  MINI.set(sig, c); return c;
}
const FLASH = new WeakMap();
function flashOf(spr) {
  if (FLASH.has(spr)) return FLASH.get(spr);
  const c = document.createElement('canvas'); c.width = spr.width; c.height = spr.height;
  const g = c.getContext('2d'); g.drawImage(spr, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  FLASH.set(spr, c); return c;
}
const URLS = new WeakMap();
function sprUrl(spr) { if (!URLS.has(spr)) URLS.set(spr, spr.toDataURL()); return URLS.get(spr); }
/* sprites 32x32 (mundo e batalha) */
const classSpr = (k, flip) => classicHero(k, flip);
const heroMini = flip => classSpr(S.cls, flip), heroSpr = flip => classicHero(S.cls, flip, 1);
const monMini = (k, flip) => classicMonster(k, flip), monSpr = (k,flip) => classicMonster(k,flip,1);
let petMini = (k, flip) => { const d = PETS[k]; return spr(d.spr, PET32[k] || {}, flip); };
const icon = (k, sz = 28) => '<img class="pix" src="' + sprUrl(mini(k)) + '" width="' + sz + '" height="' + sz + '" alt="">';
/* ===== Dados do jogo ===== */
const MAXLV = 250, TIER_CAP = [0,25,50,75,100,125,150,175,200,225,250];
const tierOfLv = L => Math.min(10, Math.max(1, 1 + Math.floor(L / 25)));
const ELEM = { fis:'Físico', fogo:'Fogo', agua:'Água', terra:'Terra', raio:'Raio', sagrado:'Sagrado', sombrio:'Sombrio', arcano:'Arcano' };
const STAT_LBL = { hp:'PV', mp:'PM', atk:'Ataque', mag:'Magia', def:'Defesa', res:'Resistência', dex:'Destreza', crit:'Crítico', ward:'Barreira' };
const STATUS = {
  veneno:   { n:'Veneno', d:'Perde PV no começo de cada turno.', col:'#b36cf0' },
  queimar:  { n:'Queimadura', d:'Perde PV no começo de cada turno.', col:'#ff8a3a' },
  atordoar: { n:'Atordoado', d:'Não pode agir no turno.', col:'#ffe14a' },
  paralisar:{ n:'Paralisia', d:'Metade das vezes não consegue agir.', col:'#f0e070' },
  cegar:    { n:'Cegueira', d:'Erra metade dos ataques.', col:'#8a8aa0' },
  sono:     { n:'Sono', d:'Não age até levar dano.', col:'#9ac0ff' },
};

/* ---------- Habilidades (compartilhadas entre classes) ---------- */
const SKILLS = {
  golpe:      { n:'Golpe Pesado', mp:5, kind:'dmg', stat:'atk', pow:1.6, d:'Um golpe forte em um inimigo.' },
  investida:  { n:'Investida', mp:9, kind:'dmg', stat:'atk', pow:1.3, st:['atordoar', .3, 1], d:'Avança e pode atordoar.' },
  protecao:   { n:'Proteção', mp:8, kind:'buff', buff:{ def:3 }, d:'Defesa +50% por 3 turnos.' },
  corte:      { n:'Corte Duplo', mp:12, kind:'dmg', stat:'atk', pow:.9, hits:2, d:'Dois golpes seguidos.' },
  giro:       { n:'Lâmina Giratória', mp:16, kind:'dmg', stat:'atk', pow:1.1, all:true, d:'Atinge todos os inimigos.' },
  fortalecer: { n:'Fortalecer', mp:10, kind:'buff', buff:{ atk:3 }, d:'Ataque +40% por 3 turnos.' },
  golpefinal: { n:'Golpe Final', mp:30, kind:'dmg', stat:'atk', pow:3, d:'Golpe devastador.' },
  luz:        { n:'Luz Sagrada', mp:7, kind:'dmg', stat:'mag', pow:1.5, elem:'sagrado', d:'Luz contra um inimigo.' },
  cura:       { n:'Cura', mp:9, kind:'heal', pow:.32, d:'Recupera cerca de 1/3 dos PV.' },
  faisca:     { n:'Faísca', mp:5, kind:'dmg', stat:'mag', pow:1.45, elem:'fogo', st:['queimar', .2, 3], d:'Fogo. Pode queimar.' },
  gelo:       { n:'Estilhaço de Gelo', mp:5, kind:'dmg', stat:'mag', pow:1.45, elem:'agua', st:['atordoar', .15, 1], d:'Água gelada. Pode congelar.' },
  choque:     { n:'Choque', mp:6, kind:'dmg', stat:'mag', pow:1.5, elem:'raio', st:['paralisar', .2, 3], d:'Raio. Pode paralisar.' },
  pedra:      { n:'Lança de Pedra', mp:6, kind:'dmg', stat:'mag', pow:1.5, elem:'terra', d:'Terra contra um inimigo.' },
  barreira:   { n:'Barreira', mp:10, kind:'ward', pow:2.2, d:'Cria um escudo mágico que absorve dano.' },
  seta:       { n:'Seta Mágica', mp:7, kind:'dmg', stat:'mag', pow:1.35, elem:'neutro', d:'Magia sem elemento. Nunca é resistida.' },
  dreno:      { n:'Dreno', mp:9, kind:'dmg', stat:'mag', pow:1.2, elem:'neutro', drain:.5, d:'Rouba metade do dano como PV.' },
  bolafogo:   { n:'Bola de Fogo', mp:14, kind:'dmg', stat:'mag', pow:1.15, elem:'fogo', all:true, d:'Fogo em todos.' },
  nevasca:    { n:'Nevasca', mp:16, kind:'dmg', stat:'mag', pow:1.15, elem:'agua', all:true, st:['atordoar', .1, 1], d:'Gelo em todos.' },
  tempestade: { n:'Tempestade', mp:18, kind:'dmg', stat:'mag', pow:1.2, elem:'raio', all:true, d:'Raios em todos.' },
  trevas:     { n:'Toque Sombrio', mp:8, kind:'dmg', stat:'mag', pow:1.6, elem:'sombrio', st:['cegar', .25, 3], d:'Sombra. Pode cegar.' },
  meteoro:    { n:'Meteoro', mp:40, kind:'dmg', stat:'mag', pow:2.8, elem:'fogo', d:'Uma rocha em chamas cai do céu.' },
  furtivo:    { n:'Golpe Furtivo', mp:4, kind:'dmg', stat:'atk', pow:1.4, crit:30, d:'Alta chance de crítico.' },
  envenenar:  { n:'Lâmina Envenenada', mp:5, kind:'dmg', stat:'atk', pow:1, st:['veneno', 1, 4], d:'Sempre envenena.' },
  areia:      { n:'Areia nos Olhos', mp:4, kind:'debuff', st:['cegar', .85, 3], d:'Cega o inimigo.' },
  danca:      { n:'Dança das Lâminas', mp:12, kind:'dmg', stat:'atk', pow:.62, hits:3, d:'Três cortes rápidos.' },
  ninar:      { n:'Canção de Ninar', mp:8, kind:'debuff', st:['sono', .65, 3], d:'Faz o inimigo dormir.' },
  execucao:   { n:'Execução', mp:14, kind:'dmg', stat:'atk', pow:1.8, exec:true, d:'Dano dobrado em alvos com pouca vida.' },
  sombra:     { n:'Passo Sombrio', mp:10, kind:'buff', buff:{ eva:3 }, d:'Esquiva muito mais por 3 turnos.' },
  furia:      { n:'Fúria', mp:12, kind:'buff', buff:{ atk:3, def:-3 }, d:'Ataque alto, defesa baixa.' },
  lamina_arc: { n:'Lâmina Arcana', mp:12, kind:'dmg', stat:'both', pow:1.4, elem:'arcano', d:'Usa ataque e magia juntos.' },
  julgamento: { n:'Julgamento', mp:36, kind:'dmg', stat:'mag', pow:2.4, elem:'sagrado', all:true, d:'Luz sobre todos.' },
  vazio:      { n:'Vazio', mp:38, kind:'dmg', stat:'mag', pow:2.6, elem:'arcano', all:true, d:'Rasga o ar em volta de todos.' },
  mil_cortes: { n:'Mil Cortes', mp:34, kind:'dmg', stat:'atk', pow:.55, hits:6, d:'Seis cortes em sequência.' },
  escudada:   { n:'Golpe de Escudo', mp:7, kind:'dmg', stat:'atk', pow:1.1, st:['atordoar', .45, 1], d:'Bate com o escudo. Atordoa com frequência.' },
  muralha:    { n:'Muralha', mp:14, kind:'ward', pow:3, def:true, d:'Barreira grande baseada na defesa.' },
  estocada:   { n:'Estocada', mp:11, kind:'dmg', stat:'atk', pow:1.9, crit:15, d:'Golpe perfurante e preciso.' },
  carga:      { n:'Carga do Cavaleiro', mp:20, kind:'dmg', stat:'atk', pow:1.45, all:true, st:['atordoar', .2, 1], d:'Avança contra todos os inimigos.' },
  concentra:  { n:'Concentração', mp:10, kind:'buff', buff:{ mag:3 }, d:'Magia +30% por 3 turnos.' },
  raizes:     { n:'Raízes', mp:9, kind:'dmg', stat:'mag', pow:1.3, elem:'terra', st:['paralisar', .5, 2], d:'Raízes prendem o alvo.' },
  espinhos:   { n:'Espinhos', mp:18, kind:'dmg', stat:'mag', pow:1.25, elem:'terra', all:true, st:['veneno', .35, 3], d:'Espinhos venenosos em todos.' },
  cometa:     { n:'Cometa Arcano', mp:44, kind:'dmg', stat:'mag', pow:3.4, elem:'arcano', d:'O golpe mágico mais forte.' },
  alma:       { n:'Drenar Alma', mp:16, kind:'dmg', stat:'mag', pow:1.6, elem:'sombrio', drain:.6, d:'Sombra que rouba vida.' },
  maldicao:   { n:'Maldição', mp:12, kind:'debuff', st:['cegar', .8, 3], st2:['veneno', .8, 4], d:'Cega e envenena.' },
  roubar:     { n:'Roubar', mp:5, kind:'dmg', stat:'atk', pow:.8, steal:true, d:'Golpe que rouba ouro.' },
  flecha:     { n:'Flecha Certeira', mp:6, kind:'dmg', stat:'atk', pow:1.55, crit:20, d:'Tiro preciso.' },
  armadilha:  { n:'Armadilha', mp:9, kind:'debuff', st:['paralisar', .85, 3], d:'Prende o inimigo.' },
  chuva:      { n:'Chuva de Flechas', mp:17, kind:'dmg', stat:'atk', pow:1.05, all:true, d:'Flechas em todos.' },
  golpe_mortal:{ n:'Golpe Mortal', mp:30, kind:'dmg', stat:'atk', pow:2.2, crit:45, exec:true, d:'Crítico quase certo. Dobra em alvos fracos.' },
  tiro_certeiro:{ n:'Tiro Certeiro', mp:28, kind:'dmg', stat:'atk', pow:3.1, crit:25, d:'Um disparo devastador.' },
};
let SKILL_KIND = id => { const s = SKILLS[id]; return s.kind === 'dmg' && s.stat !== 'mag' ? 'fis' : 'mag'; };

/* ---------- Classes por tier (três caminhos com ramificações) ---------- */
const C_ = (n, tier, req, gear, m, skills, d) => ({ n, tier, req, cost:[0, 250, 500, 2500, 9000, 25000][tier], gear, m, skills, d });
const CLASSES = {
  guerreiro: C_('Guerreiro', 1, null, ['guerreiro'], { hp:1.2, mp:.8, atk:1.2, mag:.6, def:1.2, res:.85, dex:.9 }, [[1, 'golpe'], [3, 'investida'], [6, 'protecao']], 'Um lutador com um longo caminho pela frente.'),
  soldado:   C_('Soldado', 2, ['guerreiro'], ['guerreiro'], { hp:1.26, mp:.85, atk:1.26, mag:.62, def:1.26, res:.9, dex:.92 }, [[10, 'corte'], [12, 'escudada'], [15, 'fortalecer']], 'Disciplinado e firme no campo de batalha.'),
  escudeiro: C_('Escudeiro', 3, ['soldado'], ['guerreiro'], { hp:1.34, mp:.9, atk:1.32, mag:.66, def:1.36, res:.96, dex:.95 }, [[20, 'muralha'], [23, 'estocada'], [26, 'giro']], 'A caminho de se tornar cavaleiro.'),
  cavaleiro: C_('Cavaleiro', 4, ['escudeiro'], ['guerreiro'], { hp:1.44, mp:.95, atk:1.42, mag:.7, def:1.46, res:1.02, dex:.98 }, [[30, 'carga'], [33, 'cura']], 'Temido em qualquer campo de batalha.'),
  runica:    C_('Lâmina Rúnica', 4, ['escudeiro', 'feiticeiro'], ['guerreiro', 'mago'], { hp:1.3, mp:1.25, atk:1.36, mag:1.36, def:1.2, res:1.15, dex:1 }, [[30, 'lamina_arc'], [32, 'barreira']], 'Espada e magia na mesma mão. Usa equipamento de guerreiro e de mago.'),
  paladino:  C_('Paladino', 5, ['cavaleiro'], ['guerreiro'], { hp:1.56, mp:1.1, atk:1.48, mag:1.05, def:1.56, res:1.2, dex:1 }, [[40, 'luz'], [44, 'julgamento']], 'Guerreiro sagrado que cura e protege.'),
  campeao:   C_('Campeão', 5, ['cavaleiro', 'runica'], ['guerreiro'], { hp:1.5, mp:1, atk:1.62, mag:.8, def:1.45, res:1.1, dex:1.05 }, [[40, 'furia'], [43, 'golpefinal']], 'Força bruta lapidada em mil batalhas.'),
  mago:      C_('Mago', 1, null, ['mago'], { hp:.85, mp:1.4, atk:.55, mag:1.3, def:.8, res:1.2, dex:.95 }, [[1, 'faisca'], [2, 'gelo'], [4, 'choque'], [6, 'pedra']], 'Estuda todos os elementos.'),
  aprendiz:  C_('Aprendiz Arcano', 2, ['mago'], ['mago'], { hp:.88, mp:1.48, atk:.56, mag:1.38, def:.82, res:1.26, dex:.96 }, [[10, 'seta'], [12, 'barreira'], [15, 'dreno']], 'Descobre a magia sem elemento.'),
  feiticeiro:C_('Feiticeiro', 3, ['aprendiz'], ['mago'], { hp:.92, mp:1.58, atk:.58, mag:1.48, def:.85, res:1.32, dex:.98 }, [[20, 'bolafogo'], [22, 'nevasca'], [25, 'tempestade']], 'Magias que atingem todos os inimigos.'),
  arquimago: C_('Arquimago', 4, ['feiticeiro'], ['mago'], { hp:.96, mp:1.7, atk:.6, mag:1.62, def:.88, res:1.42, dex:1 }, [[30, 'meteoro'], [33, 'concentra']], 'Domina o fogo dos céus.'),
  druida:    C_('Druida', 4, ['feiticeiro'], ['mago'], { hp:1.08, mp:1.6, atk:.62, mag:1.5, def:.98, res:1.42, dex:1 }, [[30, 'cura'], [31, 'raizes'], [34, 'espinhos']], 'Cura e prende com a força da terra.'),
  arcanista: C_('Arcanista', 5, ['arquimago', 'runica'], ['mago'], { hp:1.02, mp:1.85, atk:.62, mag:1.78, def:.92, res:1.52, dex:1.02 }, [[40, 'vazio'], [44, 'cometa']], 'O arcano puro obedece a sua vontade.'),
  necromante:C_('Necromante', 5, ['arquimago', 'druida'], ['mago'], { hp:1.08, mp:1.75, atk:.62, mag:1.7, def:.95, res:1.5, dex:1 }, [[40, 'trevas'], [42, 'alma'], [45, 'maldicao']], 'Sombra, maldições e roubo de vida.'),
  ladino:    C_('Ladino', 1, null, ['ladino'], { hp:1, mp:.95, atk:1.1, mag:.7, def:.95, res:.9, dex:1.35 }, [[1, 'furtivo'], [3, 'envenenar'], [5, 'areia']], 'Rápido, preciso e venenoso.'),
  gatuno:    C_('Gatuno', 2, ['ladino'], ['ladino'], { hp:1.03, mp:.98, atk:1.16, mag:.72, def:.97, res:.92, dex:1.42 }, [[10, 'roubar'], [12, 'danca'], [15, 'ninar']], 'Ouro alheio é ouro em potencial.'),
  assassino: C_('Assassino', 3, ['gatuno'], ['ladino'], { hp:1.07, mp:1, atk:1.24, mag:.75, def:.98, res:.95, dex:1.5 }, [[20, 'execucao'], [23, 'sombra']], 'Elimina alvos enfraquecidos.'),
  lamina:    C_('Lâmina Sombria', 4, ['assassino'], ['ladino'], { hp:1.12, mp:1.04, atk:1.36, mag:.82, def:1, res:1, dex:1.62 }, [[30, 'trevas'], [34, 'mil_cortes']], 'Críticos e golpes das sombras.'),
  cacador:   C_('Caçador', 4, ['assassino'], ['ladino'], { hp:1.15, mp:1.02, atk:1.32, mag:.8, def:1.02, res:1, dex:1.56 }, [[30, 'flecha'], [32, 'armadilha'], [35, 'chuva']], 'Arco, armadilhas e paciência.'),
  mestre:    C_('Mestre das Sombras', 5, ['lamina'], ['ladino'], { hp:1.2, mp:1.08, atk:1.52, mag:.9, def:1.06, res:1.06, dex:1.8 }, [[40, 'golpe_mortal']], 'Ninguém o vê chegar.'),
  atirador:  C_('Atirador', 5, ['cacador', 'lamina'], ['ladino'], { hp:1.18, mp:1.06, atk:1.5, mag:.85, def:1.05, res:1.05, dex:1.74 }, [[40, 'tiro_certeiro']], 'Nunca erra o alvo.'),
};
const PATHS = {
  guerreiro: { n:'Caminho do Guerreiro', v:'Bravura', tiers:[['guerreiro'], ['soldado'], ['escudeiro'], ['cavaleiro', 'runica'], ['paladino', 'campeao']] },
  mago:      { n:'Caminho do Mago', v:'Sabedoria', tiers:[['mago'], ['aprendiz'], ['feiticeiro'], ['arquimago', 'druida'], ['arcanista', 'necromante']] },
  ladino:    { n:'Caminho do Ladino', v:'Astúcia', tiers:[['ladino'], ['gatuno'], ['assassino'], ['lamina', 'cacador'], ['mestre', 'atirador']] },
};
const PATH_OF = {}; for (const pk in PATHS) for (const t of PATHS[pk].tiers) for (const k of t) PATH_OF[k] = pk;
PATH_OF.runica = 'guerreiro';
const START_CLASSES = ['guerreiro', 'mago', 'ladino'];
const CLASS_SPR = {}; for (const k in CLASSES) CLASS_SPR[k] = 'hero_' + PATH_OF[k];
/* passivas por caminho (crescem com o tier) */
const PASSIVES = {
  guerreiro: [{ id:'prof', n:'Proficiência em Armas', d:t => 'Poder da arma +' + (5 * t) + '%' }, { id:'colat', n:'Dano Colateral', d:t => 'Chance de atingir outro inimigo: ' + (8 + 2 * t) + '% · Dano colateral: ' + (25 + 10 * t) + '% do golpe' }],
  mago:      [{ id:'afin', n:'Afinidade Arcana', d:t => 'Magia +' + (4 * t) + '%' }, { id:'eco', n:'Eco Mágico', d:t => 'Chance de repetir a magia: ' + (6 + 2 * t) + '% (30% do dano)' }],
  ladino:    [{ id:'maos', n:'Mãos Leves', d:t => 'Ouro +' + (6 * t) + '%' }, { id:'refl', n:'Reflexos', d:t => 'Esquiva +' + (2 + t) + '%' }],
};
const SPECS = {
  berserker: { n:'Berserker', d:'Ataque +15%. Aprende Fúria.', bonus:{ atk:.15 }, skill:'furia' },
  guardiao:  { n:'Guardião', d:'Defesa e resistência +15%. Aprende Barreira.', bonus:{ def:.15, res:.15 }, skill:'barreira' },
  clerigo:   { n:'Clérigo', d:'Magia +10% e PM +20%. Aprende Cura.', bonus:{ mag:.1, mp:.2 }, skill:'cura' },
  domador:   { n:'Domador', d:'Seu seguidor fica 40% mais forte e age mais.', bonus:{}, pet:.4 },
};

/* ---------- Monstros ---------- */
/* m: multiplicadores de atributos; moves: [habilidade, peso]; drops: [item, chance] */
const MON = {
  worm:     { n:'Minhocão', spr:'worm', fam:'Animal', rain:true, m:{ hp:1.1, atk:.9, def:.8, dex:.7 }, moves:[['pancada', 2], ['esmagar', 1]], weak:['fogo'], res:['terra'], drops:[['pedra', .55]] },
  rat:      { n:'Rato', spr:'rat', fam:'Animal', m:{ hp:.6, atk:.8, def:.6, dex:1 }, moves:[['mordida', 3]], weak:['fogo'], drops:[['couro', .3]] },
  slime:    { n:'Gosma', spr:'slime', fam:'Gosma', m:{ hp:.75, atk:.8, def:.7 }, moves:[['pancada', 2], ['acido', 1]], weak:['fogo'], res:['agua'], drops:[['gosma', .4]] },
  goblin:   { n:'Goblin', spr:'goblin', fam:'Goblin', m:{ hp:.85, atk:1 }, moves:[['pancada', 3], ['golpe_forte', 1]], weak:['agua'], drops:[['couro', .25], ['madeira', .3]] },
  goblin_mage:{ n:'Goblin Mago', spr:'goblin_mage', fam:'Goblin', m:{ hp:.7, atk:.6, mag:1.05, res:1.2 }, moves:[['bola_fogo_m', 2], ['pancada', 1]], weak:['raio'], res:['fogo'], drops:[['madeira', .3]] },
  wolf:     { n:'Lobo', spr:'wolf', fam:'Animal', m:{ hp:.9, atk:1.1, dex:1.3 }, moves:[['mordida', 3], ['uivo', 1]], weak:['fogo'], drops:[['couro', .5]] },
  bat:      { n:'Morcego', spr:'bat', fam:'Animal', m:{ hp:.6, atk:.9, dex:1.5 }, moves:[['mordida', 2], ['sugar', 1]], weak:['raio'], drops:[['couro', .2]] },
  skeleton: { n:'Esqueleto', spr:'skeleton', fam:'Morto-vivo', night:true, m:{ hp:.9, atk:1.1, def:1.1 }, moves:[['pancada', 3], ['golpe_forte', 1]], weak:['sagrado', 'terra'], res:['fis'], drops:[['osso', .6]] },
  ghost:    { n:'Fantasma', spr:'ghost', fam:'Morto-vivo', night:true, m:{ hp:.8, atk:.6, mag:1.1 }, moves:[['sugar', 2], ['assombrar', 1]], weak:['sagrado'], immune:['fis'], drops:[['ectoplasma', .5]] },
  bandit:   { n:'Bandido', spr:'bandit', fam:'Humano', m:{ hp:1, atk:1.15, dex:1.1 }, moves:[['pancada', 2], ['veneno_m', 1], ['golpe_forte', 1]], weak:['sombrio'], drops:[['couro', .3], ['ouro_saco', .2]] },
  spider:   { n:'Aranha', spr:'spider', fam:'Inseto', m:{ hp:.9, atk:1, dex:1.2 }, moves:[['mordida', 2], ['veneno_m', 2], ['teia', 1]], weak:['fogo'], drops:[['seda', .5]] },
  slime2:   { n:'Gosma Tóxica', spr:'slime', pal:{ G:'#a974e0', g:'#6d44a8', h:'#ead2ff', m:'#4a2a7a' }, fam:'Gosma', m:{ hp:.9, atk:.9 }, moves:[['acido', 2], ['veneno_m', 2]], weak:['fogo', 'raio'], res:['agua'], drops:[['gosma', .6]] },
  wolf2:    { n:'Lobo Cinzento', spr:'wolf', pal:{ G:'#5e5e72', g:'#3a3a4a', k:'#ff6a4a' }, fam:'Animal', m:{ hp:1, atk:1.2, dex:1.3 }, moves:[['mordida', 3], ['uivo', 1], ['dilacerar', 1]], weak:['fogo'], drops:[['couro', .6]] },
  golem:    { n:'Golem', spr:'golem', fam:'Elemental', m:{ hp:1.5, atk:1.2, def:1.6, dex:.6 }, moves:[['pancada', 2], ['terremoto', 1]], weak:['agua', 'raio'], res:['fis', 'terra'], drops:[['pedra', .7], ['minerio', .3]] },
  wyrm:     { n:'Draco', spr:'wyrm', fam:'Dragão', m:{ hp:1.2, atk:1.2, mag:1.2, def:1.1 }, moves:[['mordida', 2], ['sopro', 2]], weak:['agua'], res:['fogo'], drops:[['escama', .5]] },
  vamp:     { n:'Morcego Vampiro', spr:'bat', pal:{ P:'#8a2a3a', p:'#4a1424', r:'#ffe65a' }, fam:'Morto-vivo', night:true, m:{ hp:.9, atk:1.1, dex:1.6 }, moves:[['sugar', 3], ['mordida', 1]], weak:['sagrado', 'fogo'], drops:[['couro', .3]] },
  wolf3:    { n:'Lobo Sombrio', spr:'wolf', pal:{ G:'#3a2e4a', g:'#241c30', k:'#c86aff' }, fam:'Animal', m:{ hp:1.05, atk:1.25, dex:1.4 }, moves:[['dilacerar', 2], ['mordida', 2]], weak:['sagrado'], res:['sombrio'], drops:[['couro', .6]] },
  spider3:  { n:'Viúva Negra', spr:'spider', pal:{ S:'#2a2230', s:'#4a3a5a', P:'#14101a', r:'#ff2a3a' }, fam:'Inseto', m:{ hp:1, atk:1.15, dex:1.3 }, moves:[['veneno_m', 3], ['teia', 1]], weak:['fogo'], drops:[['seda', .6]] },
  skel3:    { n:'Cavaleiro Ossudo', spr:'skeleton', pal:{ b:'#d8d2bc', r:'#5ab0ff', w:'#8a8470' }, fam:'Morto-vivo', m:{ hp:1.2, atk:1.25, def:1.3 }, moves:[['golpe_forte', 2], ['pancada', 2]], weak:['sagrado'], res:['fis', 'sombrio'], drops:[['osso', .7]] },
  /* chefes */
  b_slime:  { n:'Gosma Rainha', spr:'slime', pal:{ G:'#e0a63a', g:'#a8702a', h:'#fff2c0', m:'#7a4a10' }, boss:true, fam:'Gosma', m:{ hp:2.1, atk:1.15, def:1 }, moves:[['pancada', 2], ['acido', 2], ['esmagar', 1]], weak:['fogo'], res:['agua'], drops:[['gosma', 1]] },
  b_goblin: { n:'Senhor Goblin', spr:'goblin', pal:{ G:'#c8743a', g:'#8a4a20', l:'#5a2a6a', L:'#7a3a9a' }, boss:true, fam:'Goblin', m:{ hp:2.2, atk:1.3, def:1.2 }, moves:[['golpe_forte', 2], ['pancada', 2], ['grito', 1]], weak:['agua'], drops:[['couro', 1]] },
  b_serpe:  { n:'Serpe do Brejo', spr:'wyrm', pal:{ W:'#4a8a4a', w:'#b8e08a', c:'#b8e08a', y:'#ff5a5a' }, boss:true, fam:'Dragão', m:{ hp:2.2, atk:1.3, mag:1.3, def:1.2 }, moves:[['mordida', 2], ['veneno_m', 2], ['sopro_agua', 1]], weak:['raio'], res:['agua'], drops:[['escama', 1]] },
  b_bandit: { n:'Chefe Bandido', spr:'bandit', pal:{ R:'#2a2a3a', r:'#14141e', B:'#4a3a2a' }, boss:true, fam:'Humano', m:{ hp:2.2, atk:1.45, dex:1.3 }, moves:[['golpe_forte', 2], ['veneno_m', 1], ['pancada', 2]], weak:['sombrio'], drops:[['ouro_saco', 1]] },
  b_knight: { n:'Cavaleiro Rubro', spr:'skeleton', pal:{ b:'#e05a4a', r:'#ffe65a', w:'#8a2a2a' }, boss:true, fam:'Demônio', m:{ hp:2.4, atk:1.45, def:1.4 }, moves:[['golpe_forte', 2], ['chamas', 2], ['pancada', 1]], weak:['agua', 'sagrado'], res:['fogo'], drops:[['osso', 1]] },
  b_golem:  { n:'Golem Ancião', spr:'golem', pal:{ R:'#7a8a6a', r:'#4a5a3a', y:'#ff5a5a', m:'#ff9a3a' }, boss:true, fam:'Elemental', m:{ hp:2.6, atk:1.4, def:1.8, dex:.6 }, moves:[['terremoto', 2], ['pancada', 2]], weak:['agua'], res:['fis', 'terra', 'fogo'], drops:[['minerio', 1]] },
  b_eclipse:{ n:'Wyrm do Eclipse', spr:'wyrm', pal:{ W:'#6a46b0', w:'#d79bff', c:'#d79bff', y:'#ffdd55' }, boss:true, fam:'Dragão', m:{ hp:3.2, atk:1.5, mag:1.6, def:1.5, res:1.4 }, moves:[['sopro', 2], ['mordida', 2], ['eclipse', 1]], weak:['sagrado'], res:['fogo', 'sombrio'], drops:[['escama', 1]] },
  b_aurora: { n:'Guardião da Aurora', spr:'wyrm', pal:{ W:'#235d83', w:'#80e3cf', c:'#f8dc77', y:'#fff4b0' }, boss:true, fam:'Dragão', m:{ hp:2.7, atk:1.2, mag:1.25, def:1.15, res:1.1 }, moves:[['mordida', 2], ['sopro_agua', 2], ['eclipse', 1]], weak:['raio'], res:['agua'], drops:[['escama', 1]] },
  /* arena: heróis rivais (usam sprites de herói) */
  rival:    { n:'Rival', spr:'hero_guerreiro', fam:'Herói', m:{ hp:1.6, atk:1.1, mag:1.1, def:1.1, res:1.1, dex:1.1 }, moves:[['pancada', 2], ['golpe_forte', 1]], weak:[], drops:[] },
};
/* golpes dos monstros */
const MOVES = {
  mordida:    { n:'Mordida', pow:1, stat:'atk' },
  pancada:    { n:'Pancada', pow:1, stat:'atk' },
  golpe_forte:{ n:'Golpe Forte', pow:1.6, stat:'atk', charge:true },
  dilacerar:  { n:'Dilacerar', pow:1.3, stat:'atk', st:['veneno', .3, 3] },
  acido:      { n:'Ácido', pow:1.1, stat:'mag', elem:'terra' },
  uivo:       { n:'Uivo', buff:{ atk:2 } },
  grito:      { n:'Grito de Guerra', buff:{ atk:3 } },
  sugar:      { n:'Sugar Sangue', pow:.9, stat:'atk', drain:.6 },
  veneno_m:   { n:'Picada Venenosa', pow:.8, stat:'atk', st:['veneno', .6, 4] },
  teia:       { n:'Teia', pow:.3, stat:'atk', st:['paralisar', .5, 2] },
  assombrar:  { n:'Assombrar', pow:1.1, stat:'mag', elem:'sombrio', st:['cegar', .35, 3] },
  bola_fogo_m:{ n:'Bola de Fogo', pow:1.15, stat:'mag', elem:'fogo', st:['queimar', .25, 3] },
  terremoto:  { n:'Terremoto', pow:1.4, stat:'atk', elem:'terra', st:['atordoar', .25, 1] },
  esmagar:    { n:'Esmagar', pow:2, stat:'atk', charge:true },
  sopro:      { n:'Sopro de Fogo', pow:1.5, stat:'mag', elem:'fogo', st:['queimar', .35, 3] },
  sopro_agua: { n:'Jato d\'Água', pow:1.6, stat:'mag', elem:'agua' },
  chamas:     { n:'Lâmina em Chamas', pow:1.4, stat:'atk', elem:'fogo', st:['queimar', .3, 3] },
  eclipse:    { n:'Eclipse', pow:2.3, stat:'mag', elem:'sombrio', charge:true, st:['cegar', .5, 3] },
};

/* ---------- Seguidores (Bestiário) ---------- */
const PETS = {
  filhote:  { n:'Filhote de Lobo', spr:'wolf', pal:{ G:'#c8a070', g:'#8a6a40', k:'#2a1a10' }, tier:1, price:400, m:{ hp:.7, atk:.8 }, moves:[['ataque', 3], ['mordida_p', 2]] },
  gosminha: { n:'Gosminha', spr:'slime', pal:{ G:'#6ab0f0', g:'#3a70b0', h:'#e0f4ff', m:'#1a4a8a' }, tier:1, price:400, m:{ hp:.9, atk:.5, mag:.8 }, moves:[['ataque', 2], ['cura_p', 2]] },
  morcego:  { n:'Morcego Domado', spr:'bat', pal:{ P:'#5a8ab0', p:'#3a5a7a' }, tier:2, price:2500, m:{ hp:.7, atk:1 }, moves:[['ataque', 2], ['sugar_p', 2]] },
  aranha:   { n:'Aranha Tecelã', spr:'spider', pal:{ S:'#8a6a4a', s:'#c8a070', P:'#4a3420' }, tier:2, price:2500, m:{ hp:.8, atk:.9 }, moves:[['ataque', 2], ['teia_p', 2]] },
  golem:    { n:'Golem Menor', spr:'golem', pal:{ R:'#c8a070', r:'#8a6a40' }, tier:3, price:9000, m:{ hp:1.3, atk:1, def:1.4 }, moves:[['ataque', 2], ['barreira_p', 2]] },
  dragon_aurora:{ n:'Dragonete da Aurora', spr:'wyrm', pal:{ W:'#235d83', w:'#80e3cf', c:'#f8dc77' }, tier:4, price:0, exclusive:true, m:{ hp:1, atk:1.2, mag:1.3 }, moves:[['ataque', 2], ['sopro_p', 2]] },
  dragonete:{ n:'Dragonete', spr:'wyrm', pal:{ W:'#3a7ad8', w:'#bfe0ff', c:'#bfe0ff' }, tier:4, price:30000, m:{ hp:1, atk:1.2, mag:1.3 }, moves:[['ataque', 2], ['sopro_p', 2]] },
};
const PET_MOVES = {
  ataque:    { n:'Ataque', pow:1, stat:'atk' },
  mordida_p: { n:'Mordida', pow:1.35, stat:'atk' },
  cura_p:    { n:'Cura', heal:.15 },
  sugar_p:   { n:'Sugar', pow:1, stat:'atk', drain:.5 },
  teia_p:    { n:'Teia', pow:.5, stat:'atk', st:['paralisar', .45, 2] },
  barreira_p:{ n:'Barreira', ward:.15 },
  sopro_p:   { n:'Sopro', pow:1.2, stat:'mag', elem:'agua', all:true },
};

/* ---------- Zonas ---------- */
const ZONES = {
  B: { n:'Bosques de Alvorada', stars:1, minLv:1, lv:[1, 4], bio:'forest', spawn:[['rat', 4], ['slime', 3], ['goblin', 2]], night:[['skeleton', 2], ['ghost', 1]], boss:'b_slime' },
  O: { n:'Campina da Origem', stars:1, minLv:1, lv:[1, 3], bio:'grass', spawn:[['rat', 3], ['slime', 2]], night:[['skeleton', 1]], boss:null },
  C: { n:'Grandes Campos', stars:1, minLv:3, lv:[4, 9], bio:'grass', spawn:[['goblin', 3], ['goblin_mage', 2], ['wolf', 2], ['bat', 1]], night:[['skeleton', 2], ['ghost', 1]], boss:'b_goblin' },
  L: { n:'Lagoa do Brejo', stars:2, minLv:9, lv:[10, 15], bio:'swamp', spawn:[['slime2', 3], ['spider', 2], ['bat', 2], ['bandit', 1]], night:[['ghost', 2], ['vamp', 1]], boss:'b_serpe' },
  F: { n:'Colinas da Forja', stars:2, minLv:9, lv:[11, 17], bio:'ruins', spawn:[['bandit', 3], ['wolf2', 2], ['golem', 1]], night:[['skeleton', 2], ['vamp', 1]], boss:'b_bandit' },
  S: { n:'Mata das Sombras', stars:3, minLv:18, lv:[20, 27], bio:'forest_dark', spawn:[['wolf3', 3], ['spider3', 2], ['skel3', 2]], night:[['ghost', 2], ['vamp', 2]], boss:'b_knight' },
  M: { n:'Montes Cinzentos', stars:4, minLv:28, lv:[32, 44], bio:'cave', spawn:[['golem', 3], ['wyrm', 2], ['vamp', 1]], night:[['skel3', 2]], boss:'b_golem' },
  '~': { n:'Mar do Sul', stars:1, minLv:1, lv:[1, 3], bio:'grass', spawn:[], night:[], boss:null },
};

/* ---------- Lugares no mapa (coordenadas em tiles) ---------- */
const POIS = [
  { id:'alvorada', kind:'town', n:'Alvorada', tx:40, ty:56, clear:4, houses:[[-2, -1, 'house_red'], [1, -2, 'house_red'], [3, 0, 'hut'], [-1, 1, 'house_blue']] },
  { id:'origem', kind:'origin', n:'Sua Vila', tx:9, ty:48, clear:4 },
  { id:'forja', kind:'town', n:'Forja Velha', tx:78, ty:62, clear:4, houses:[[-2, -1, 'house_blue'], [1, -1, 'house_red'], [-1, 1, 'hut'], [2, 1, 'house_red']] },
  { id:'covil', kind:'dungeon', n:'Covil Goblin', tx:30, ty:22, clear:2, spr:'den', dg:'covil' },
  { id:'cripta', kind:'dungeon', n:'Cripta Esquecida', tx:82, ty:10, clear:2, spr:'crypt', dg:'cripta' },
  { id:'torre', kind:'dungeon', n:'Torre do Eclipse', tx:12, ty:10, clear:2, spr:'tower', dg:'torre' },
  { id:'arena', kind:'arena', n:'Arena dos Carvalhos', tx:86, ty:30, clear:3, spr:'coliseum' },
  { id:'wg_b', kind:'waygate', n:'Portal de Alvorada', tx:46, ty:63, clear:1 },
  { id:'wg_c', kind:'waygate', n:'Portal dos Campos', tx:47, ty:31, clear:1 },
  { id:'wg_l', kind:'waygate', n:'Portal da Lagoa', tx:72, ty:37, clear:1 },
  { id:'wg_f', kind:'waygate', n:'Portal da Forja', tx:72, ty:62, clear:1 },
  { id:'wg_s', kind:'waygate', n:'Portal das Sombras', tx:78, ty:18, clear:1 },
  { id:'wg_m', kind:'waygate', n:'Portal dos Montes', tx:24, ty:16, clear:1 },
];
const POI = Object.fromEntries(POIS.map(p => [p.id, p]));

/* ---------- Masmorras (gauntlets) ---------- */
const DUNGEONS = {
  covil:  { n:'Covil Goblin', stars:1, lv:8, floors:5, keys:1, bio:'cave', pool:['goblin', 'goblin_mage', 'wolf', 'bat'], boss:'b_goblin', intro:'Um forte de paliçada. Os goblins guardam o que roubaram.' },
  cripta: { n:'Cripta Esquecida', stars:3, lv:24, floors:7, keys:2, bio:'ruins', pool:['skel3', 'ghost', 'vamp', 'spider3'], boss:'b_knight', intro:'Escadas descem para salões frios. Algo arrasta correntes lá embaixo.' },
  torre:  { n:'Torre do Eclipse', stars:4, lv:42, floors:9, keys:3, bio:'tower', pool:['golem', 'wyrm', 'skel3', 'vamp'], boss:'b_eclipse', intro:'O céu escurece em volta da torre. No topo, o Wyrm do Eclipse espera.' },
};

/* ---------- Itens ---------- */
const ITEMS = {
  pocao_p: { n:'Poção Pequena', kind:'pot', hp:60, price:20, d:'Recupera 60 PV.' },
  pocao:   { n:'Poção', kind:'pot', hp:180, price:70, d:'Recupera 180 PV.' },
  pocao_g: { n:'Poção Grande', kind:'pot', hp:450, price:200, d:'Recupera 450 PV.' },
  eter_p:  { n:'Éter Pequeno', kind:'pot', mp:30, price:30, d:'Recupera 30 PM.' },
  eter:    { n:'Éter', kind:'pot', mp:90, price:100, d:'Recupera 90 PM.' },
  elixir:  { n:'Elixir Grande', kind:'pot', hp:250, mp:250, price:380, d:'Recupera 250 PV e 250 PM em um turno.' },
  antidoto:{ n:'Antídoto', kind:'pot', cure:true, price:25, d:'Remove veneno, queimadura, cegueira e paralisia.' },
  chave:   { n:'Chave de Masmorra', kind:'key', d:'Abre masmorras. Cai de chefes.' },
  ficha:   { n:'Ficha da Arena', kind:'key', d:'Uma luta na arena. Cai de chefes.' },
  linha:   { n:'Linha de Pesca', kind:'tool', price:12, d:'Uma tentativa de pesca. Toque na água perto de você.' },
  peixe:   { n:'Peixe', kind:'mat', price:14, d:'Vende bem na loja.' },
  gema:    { n:'Gema Bruta', kind:'mat', price:150, d:'Rara. Vale muito ouro.' },
  lixo:    { n:'Lixo', kind:'junk', price:1, d:'Bota velha, lata furada e tralha. Separe para tirar Pedra.' },
  madeira: { n:'Madeira', kind:'mat', price:6, d:'Para construir na sua vila.' },
  pedra:   { n:'Pedra', kind:'mat', price:12, d:'Rara no começo. Para construir.' },
  couro:   { n:'Couro', kind:'mat', price:8, d:'Usado no Bestiário.' },
  gosma:   { n:'Gosma', kind:'mat', price:3, d:'Pegajosa. Vende bem pouco.' },
  osso:    { n:'Osso', kind:'mat', price:5, d:'Material para o ferreiro.' },
  seda:    { n:'Seda de Aranha', kind:'mat', price:9, d:'Material para o ferreiro.' },
  ectoplasma:{ n:'Ectoplasma', kind:'mat', price:10, d:'Brilha no escuro.' },
  minerio: { n:'Minério', kind:'mat', price:20, d:'Material para o ferreiro.' },
  escama:  { n:'Escama', kind:'mat', price:25, d:'Material para o ferreiro.' },
  ouro_saco:{ n:'Saco de Moedas', kind:'mat', price:60, d:'Venda na loja.' },
};

/* ---------- Equipamentos ---------- */
const SLOTS = ['weapon', 'offhand', 'head', 'chest', 'legs', 'acc1', 'acc2'];
const SLOT_LBL = { weapon:'Arma', offhand:'Secundário', head:'Cabeça', chest:'Tronco', legs:'Pernas', acc1:'Acessório #1', acc2:'Acessório #2', acc:'Acessório' };
const slotKind = sl => sl === 'acc1' || sl === 'acc2' ? 'acc' : sl;
const SETS = ['padrao', 'masmorra', 'pvp'], SET_LBL = { padrao:'Padrão', masmorra:'Masmorra', pvp:'PvP' };
const GEAR_BASE = {
  weapon:  { guerreiro:['Espada', 'Machado', 'Maça'], mago:['Cajado', 'Varinha'], ladino:['Adaga', 'Arco Curto'] },
  offhand: { guerreiro:['Escudo'], mago:['Tomo'], ladino:['Adaga de Aparar'] },
  head:    { guerreiro:['Elmo'], mago:['Chapéu'], ladino:['Capuz'] },
  chest:   { guerreiro:['Peitoral'], mago:['Manto'], ladino:['Gibão'] },
  legs:    { guerreiro:['Grevas'], mago:['Calças de Seda'], ladino:['Botas'] },
  acc:     { any:['Anel', 'Amuleto', 'Bracelete'] },
};
const TIER_ADJ = ['', 'de Bronze', 'de Ferro', 'de Aço', 'Rúnico', 'Mítico', 'Glacial', 'Ancestral', 'Celestial', 'Abissal', 'Divino'];
const QUAL = [
  { n:'Quebrado', a:.7, b:.79, cls:'q-broken' }, { n:'Ruim', a:.8, b:.89, cls:'q-poor' }, { n:'Padrão', a:.9, b:1.09, cls:'q-std' },
  { n:'Superior', a:1.1, b:1.29, cls:'q-sup' }, { n:'Afamado', a:1.3, b:1.69, cls:'q-fam' }, { n:'Lendário', a:1.7, b:1.99, cls:'q-leg' }, { n:'Ornado', a:2, b:2, cls:'q-orn' },
];
const OFF_CMD = { guerreiro:{ id:'bloquear', n:'Bloquear', d:'Barreira igual a parte da sua defesa' }, mago:{ id:'concentrar', n:'Concentrar', d:'Recupera PM' }, ladino:{ id:'aparar', n:'Aparar', d:'Bloqueia e revida o próximo golpe' } };

/* ---------- Vila de origem ---------- */
const BUILDINGS = {
  loja:      { n:'Loja', cost:{ ouro:300, madeira:10, pedra:5 }, d:'Vende poções, madeira e pedra. Melhorar renova e aumenta o estoque.', max:5 },
  casa:      { n:'Casa', cost:{ ouro:800, madeira:20, pedra:10 }, d:'Descanso grátis: cura total e reanima o seguidor.', max:1 },
  bestiario: { n:'Bestiário', cost:{ ouro:1500, pedra:10, couro:15 }, d:'Adote seguidores que lutam ao seu lado.', max:1 },
  ferreiro:  { n:'Ferreiro', cost:{ ouro:2500, madeira:25, pedra:25 }, d:'Melhora equipamentos (leva tempo) e desmancha itens em materiais.', max:1 },
  prefeitura:{ n:'Prefeitura', cost:{ ouro:6000, madeira:40, pedra:40 }, d:'Rende ouro e essências todo dia.', max:5 },
};
const RES_LBL = { ouro:'ouro', madeira:'Madeira', pedra:'Pedra', couro:'Couro' };

/* ---------- Missões da história ---------- */
const STORY = [
  { id:'q1', npc:'Capitã Mirela', town:'alvorada', n:'Os Ratos', d:'Derrote 5 Ratos nos bosques perto de Alvorada.', goal:{ kill:{ rat:5 } }, rw:{ ouro:60, xp:40, item:['pocao_p', 3] } },
  { id:'q2', npc:'Capitã Mirela', town:'alvorada', n:'Sua Origem', d:'Vá à sua vila, a oeste de Alvorada, e construa uma Loja.', goal:{ build:'loja' }, rw:{ ouro:100, xp:60 } },
  { id:'q3', npc:'Capitã Mirela', town:'alvorada', n:'Goblins Demais', d:'Derrote 5 Goblins e 5 Goblins Magos nos Grandes Campos, ao norte.', goal:{ kill:{ goblin:5, goblin_mage:5 } }, rw:{ ouro:200, xp:180, item:['chave', 1] } },
  { id:'q4', npc:'Capitã Mirela', town:'alvorada', n:'O Senhor dos Goblins', d:'O Senhor Goblin aparece de vez em quando nos Grandes Campos. Derrote-o.', goal:{ kill:{ b_goblin:1 } }, rw:{ ouro:400, xp:300, ess:300 } },
  { id:'q5', npc:'Capitã Mirela', town:'alvorada', n:'Mais Forte', d:'Chegue ao nível 10 e desbloqueie uma classe de tier 2 (menu do herói).', goal:{ lvl:10, tier:2 }, rw:{ ouro:300, ess:200 } },
  { id:'q6', npc:'Ferreira Odete', town:'forja', n:'A Arena', d:'Vença 3 lutas na Arena dos Carvalhos, a leste. Cada luta pede uma Ficha.', goal:{ arena:3 }, rw:{ ouro:600, xp:600 } },
  { id:'q7', npc:'Ferreira Odete', town:'forja', n:'O Bestiário', d:'Construa um Bestiário na sua vila e adote um seguidor.', goal:{ pet:1 }, rw:{ ouro:500, xp:500 } },
  { id:'q8', npc:'Ferreira Odete', town:'forja', n:'O Codex', d:'Complete 3 entradas do Codex: veja os golpes, os drops e as fraquezas de cada monstro.', goal:{ codex:3 }, rw:{ ouro:500, ess:400 } },
  { id:'q9', npc:'Ferreira Odete', town:'forja', n:'A Masmorra', d:'Complete o Covil Goblin, nos Grandes Campos.', goal:{ dungeon:'covil' }, rw:{ ouro:800, xp:900, item:['chave', 2] } },
  { id:'q10', npc:'Ferreira Odete', town:'forja', n:'A Serpe do Brejo', d:'Derrote a Serpe do Brejo na Lagoa.', goal:{ kill:{ b_serpe:1 } }, rw:{ ouro:900, xp:1200, ess:600 } },
  { id:'q11', npc:'Ferreira Odete', town:'forja', n:'Mais Forte', d:'Chegue ao nível 20 e desbloqueie uma classe de tier 3.', goal:{ lvl:20, tier:3 }, rw:{ ouro:1500, ess:1500 } },
  { id:'q12', npc:'Ferreira Odete', town:'forja', n:'Um Ferreiro de Verdade', d:'Construa um Ferreiro na sua vila e melhore 3 itens.', goal:{ upgrade:3 }, rw:{ ouro:2000, xp:3000 } },
  { id:'q13', npc:'Ferreira Odete', town:'forja', n:'O Cavaleiro Rubro', d:'Derrote o Cavaleiro Rubro na Mata das Sombras.', goal:{ kill:{ b_knight:1 } }, rw:{ ouro:3000, xp:5000, item:['chave', 3] } },
  { id:'q14', npc:'Ferreira Odete', town:'forja', n:'Fundo das Masmorras', d:'Complete a Cripta Esquecida.', goal:{ dungeon:'cripta' }, rw:{ ouro:4000, xp:8000, ess:4000 } },
  { id:'q15', npc:'Ferreira Odete', town:'forja', n:'Mais Forte', d:'Chegue ao nível 30 e desbloqueie uma classe de tier 4.', goal:{ lvl:30, tier:4 }, rw:{ ouro:5000, ess:5000 } },
  { id:'q16', npc:'Ferreira Odete', town:'forja', n:'O Eclipse', d:'Suba a Torre do Eclipse, nos Montes Cinzentos, e derrote o Wyrm.', goal:{ dungeon:'torre' }, rw:{ ouro:20000, xp:30000 } },
];

/* ---------- Paletas dos sprites 32x32 ---------- */
const P32 = {
  rat:{ a:'#d8d4e0' }, slime:{ a:'#6fcf5f' }, goblin:{ a:'#8bbf4a', e:'#ffd84a' }, goblin_mage:{ a:'#8bbf4a', robe:'#7a46b0' }, wolf:{ a:'#8a8a9e', e:'#ffd84a' },
  bat:{ a:'#7a5fb0', e:'#ff5a5a' }, skeleton:{ a:'#e8e2cc', e:'#ff6a4a' }, ghost:{ a:'#cfe8ff' }, spider:{ a:'#5a4a6a', e:'#ff4a6a' }, slime2:{ a:'#a974e0' },
  wolf2:{ a:'#5e5e72', e:'#ff6a4a' }, golem:{ a:'#8f8a9a', e:'#ffcc44' }, wyrm:{ a:'#c9533a', c:'#f2c97e', e:'#ffe65a' }, vamp:{ a:'#8a2a3a', e:'#ffe65a' },
  wolf3:{ a:'#3a2e4a', e:'#c86aff' }, spider3:{ a:'#2a2230', e:'#ff2a3a' }, skel3:{ a:'#d8d2bc', armor:'#5a74c8', e:'#5ab0ff' }, worm:{ a:'#e08a9a' },
  bandit:{ a:'#6a5a48', h:'#8a2b2a', hood:1, mask:'#3a3240', tool:'dagger' },
  b_slime:{ a:'#e0a63a', crown:1 }, b_goblin:{ a:'#c8743a', e:'#ff4a3a' }, b_serpe:{ a:'#4a8a4a', c:'#b8e08a', e:'#ff5a5a' },
  b_bandit:{ a:'#3a3a4a', h:'#2a1a2a', hood:1, mask:'#14141e', tool:'dagger', cape:'#6a1a1a' }, b_knight:{ a:'#e8d8c8', armor:'#b03a3a', e:'#ffe65a' },
  b_aurora:{ a:'#235d83', c:'#80e3cf', halo:1, e:'#f8dc77' },
  b_golem:{ a:'#7a8a6a', e:'#ff5a5a' }, b_eclipse:{ a:'#6a46b0', c:'#d79bff', halo:1, e:'#ffdd55' },
};
const G32 = { bandit:'human', b_bandit:'human' };
const PET32 = { dragon_aurora:{ a:'#235d83', c:'#80e3cf', e:'#f8dc77' }, filhote:{ a:'#c8a070', e:'#2a1a10' }, gosminha:{ a:'#6ab0f0' }, morcego:{ a:'#5a8ab0', e:'#ffe65a' }, aranha:{ a:'#8a6a4a', e:'#ffd84a' }, golem:{ a:'#c8a070', e:'#5ab0ff' }, dragonete:{ a:'#3a7ad8', c:'#bfe0ff', e:'#ffe65a' } };
const CLASS_PAL = {
  guerreiro:{ a:'#c9453a', h:'#6b4423' }, soldado:{ a:'#5a6a8a', h:'#4a3020', plume:'#3a62c8' }, escudeiro:{ a:'#3a62c8', h:'#6b4423', cape:'#2a3a7a', plume:'#e8e8f0' },
  cavaleiro:{ a:'#b8b8c8', h:'#3a2a1a', cape:'#8a2b2a', visor:1, pauldron:'#c8d0e0', plume:'#e8e8f0' }, runica:{ a:'#7a46b0', h:'#2a2a3a', cape:'#3a1a5a', blade:'#c890ff', plume:'#b06af0' },
  paladino:{ a:'#e8e2c8', h:'#c89a3a', cape:'#d8d0b0', halo:1, pauldron:'#eab93a', blade:'#fff3c0', plume:'#f0c25a' }, campeao:{ a:'#c8902a', h:'#8a2a1a', cape:'#8a1a1a', crown:1, visor:1, pauldron:'#eab93a' },
  mago:{ a:'#3f5fd8', h:'#d9d9e8' }, aprendiz:{ a:'#3a8ac8', h:'#e8e8f0', orb:'#8ad8ff' }, feiticeiro:{ a:'#c84a2a', h:'#e0d0c0', orb:'#ff8a3a' },
  arquimago:{ a:'#7a3fd8', h:'#e8e8f8', cape:'#2a1a5a', orb:'#d79bff' }, druida:{ a:'#3a8a4a', h:'#c8c0a0', orb:'#8fd06a', cape:'#5a3a1a' },
  arcanista:{ a:'#d8d8f0', h:'#5ab0f0', orb:'#5ab0f0', halo:1, cape:'#3a5ab0' }, necromante:{ a:'#2a2a3a', h:'#a0a0b0', orb:'#9a5ae8', cape:'#140e1a' },
  ladino:{ a:'#3a8f6a', h:'#2a2230' }, gatuno:{ a:'#8a6a3a', h:'#3a2a1a', c2:'#5a3a1a' }, assassino:{ a:'#3a3a4a', h:'#1a1a22', c2:'#24242e', e:'#c83a3a' },
  lamina:{ a:'#5a2a6a', h:'#24102c', c2:'#2a1030', cape:'#3a1040', blade:'#c890ff' }, cacador:{ a:'#4a6a2a', h:'#3a2a10', c2:'#3a4a1a', bow:1 },
  mestre:{ a:'#1a1a22', h:'#8a1a1a', c2:'#14141a', cape:'#6a1010', blade:'#ff8a8a', e:'#ff3a3a' }, atirador:{ a:'#8a3a2a', h:'#2a1a10', c2:'#5a2a1a', bow:1, cape:'#3a2a1a' },
};
/* ===== Ícones de itens 16x16 ===== */
const METAL = ['', '#c8843a', '#9aa4b8', '#d8e0ec', '#7ad0e8', '#e8b8ff','#bfe8ff','#6ef0b1','#fff0bd','#ba79ef','#fff9da'];
const ICON_CACHE = new Map();
function iconPB(kind, o = {}) {
  const pb = new PB(16, 16), m = rampOf(o.metal || '#9aa4b8'), w = WOOD, ol = '#1a1220';
  switch (kind) {
    case 'pot': { const c = rampOf(o.col || '#e04a5a'), big = o.size || 1;
      E(pb, 8, 10.5, 3.5 + big * .7, 3.6 + big * .5, c); R(pb, 6.5, 3.5, 3, 4, ['#d8e4ee', '#ffffff']); R(pb, 6, 1.5, 4, 2.4, rampOf('#a8703e'));
      outline(pb, ol); D(pb, 6, 9, '#ffffff'); D(pb, 6, 10, c[4]); break; }
    case 'sword': LN(pb, 3, 13, 12, 4, m[3], 2); LN(pb, 4, 12, 12, 4, m[4], 1); LN(pb, 2, 10, 6, 14, GOLD[2], 2); LN(pb, 1, 15, 3, 13, w[2], 2); D(pb, 13, 3, m[4]); outline(pb, ol); break;
    case 'axe': LN(pb, 3, 14, 11, 3, w[2], 2); PL(pb, [[8, 2], [14, 3], [14, 9], [9, 7]], m); outline(pb, ol); D(pb, 13, 4, m[4]); break;
    case 'mace': LN(pb, 3, 14, 9, 6, w[2], 2); E(pb, 11, 5, 3.6, 3.6, m, { edge: m[0] }); [[11, 0.8], [15, 5], [7, 5], [11, 9.2]].forEach(([x, y]) => D(pb, x, y, m[3])); outline(pb, ol); break;
    case 'staff': LN(pb, 3, 15, 11, 4, w[2], 2); LN(pb, 4, 15, 11, 5, w[3], 1); E(pb, 12, 3.5, 3, 3, rampOf(o.orb || '#6e8cff'), { dith: .2 }); outline(pb, ol); D(pb, 11, 2, '#ffffff'); break;
    case 'wand': LN(pb, 4, 13, 11, 5, w[1], 2); PL(pb, [[11, 1], [12.5, 4], [15.5, 4.5], [13, 6.5], [14, 10], [11, 8], [8, 10], [9, 6.5], [6.5, 4.5], [9.5, 4]], GOLD); outline(pb, ol); break;
    case 'dagger': LN(pb, 5, 11, 12, 4, m[3], 2); LN(pb, 3, 9, 7, 13, GOLD[2], 1); LN(pb, 2, 14, 4, 12, LEATHER[2], 2); outline(pb, ol); D(pb, 12, 4, m[4]); break;
    case 'bow': PLN(pb, [[4, 2], [9, 3], [12, 7], [13, 12], [13, 15]], w[2], 2); LN(pb, 4, 2, 13, 15, '#e8e8f0', 1); LN(pb, 2, 9, 12, 9, m[3], 1); PL(pb, [[12, 7.5], [15, 9], [12, 10.5]], m); outline(pb, ol); break;
    case 'shield': PL(pb, [[2, 2], [14, 2], [14, 8], [8, 15], [2, 8]], rampOf(o.col || '#5a72c8'), { edge: m[1] }); R(pb, 7, 3, 2, 10, m); R(pb, 3, 6, 10, 2, m); outline(pb, ol); break;
    case 'tome': R(pb, 3, 2, 11, 13, rampOf(o.col || '#7a3a2a'), { edge: '#2a1410' }); R(pb, 4, 13, 9, 1.5, ['#efe3c4']); E(pb, 8.5, 8, 2.5, 2.5, GOLD); outline(pb, ol); break;
    case 'helm': E(pb, 8, 9, 6, 5.5, m); R(pb, 2, 9, 12, 2, m); R(pb, 5, 10, 6, 3, ['#1a1220']); R(pb, 7.2, 3.5, 1.6, 9, m[3] ? [m[3]] : m); outline(pb, ol); break;
    case 'hat': PL(pb, [[1, 12], [15, 12], [12, 9], [9, 1], [6, 8], [4, 9]], rampOf(o.col || '#3f5fd8')); R(pb, 4, 9.5, 8, 1.6, GOLD); outline(pb, ol); D(pb, 9, 3, '#fff3a0'); break;
    case 'hood': E(pb, 8, 8.5, 6, 6.5, rampOf(o.col || '#3a8f6a')); E(pb, 8, 10, 3.6, 3.6, ['#1a1220']); outline(pb, ol); break;
    case 'chest': PL(pb, [[3, 3], [6, 2], [8, 4], [10, 2], [13, 3], [14, 8], [12, 9], [12, 14], [4, 14], [4, 9], [2, 8]], o.robe ? rampOf(o.col || '#3f5fd8') : o.leather ? rampOf('#a8703e') : m); R(pb, 6, 4, 4, 2, ['#1a1220']); outline(pb, ol); if (!o.robe) { LN(pb, 8, 6, 8, 13, '#1a1220', 1); } break;
    case 'legs': R(pb, 4, 2, 8, 4, o.leather ? rampOf('#8a5a32') : m); R(pb, 4, 5, 3.5, 9, o.leather ? rampOf('#8a5a32') : m); R(pb, 8.5, 5, 3.5, 9, o.leather ? rampOf('#8a5a32') : m); R(pb, 3, 13, 5, 2.5, LEATHER); R(pb, 8, 13, 5, 2.5, LEATHER); outline(pb, ol); break;
    case 'boots': R(pb, 3, 3, 4, 9, rampOf('#7a4a2a')); R(pb, 9, 3, 4, 9, rampOf('#7a4a2a')); R(pb, 2, 11, 6, 3, rampOf('#5a3420')); R(pb, 8, 11, 6, 3, rampOf('#5a3420')); outline(pb, ol); break;
    case 'ring': fill(pb, (x, y) => ellT(8, 9, 5, 5)(x, y) && !ellT(8, 9, 3, 3)(x, y), GOLD, [8, 9, 5, 5]); E(pb, 8, 4, 2.4, 2.4, rampOf(o.gem || '#e04a5a')); outline(pb, ol); D(pb, 7, 3, '#fff'); break;
    case 'amulet': PLN(pb, [[3, 1], [5, 7], [8, 9], [11, 7], [13, 1]], GOLD[2], 1); E(pb, 8, 11, 3.4, 3.8, rampOf(o.gem || '#4ab0e8'), { edge: GOLD[1] }); outline(pb, ol); D(pb, 7, 10, '#fff'); break;
    case 'bracelet': fill(pb, (x, y) => ellT(8, 8, 6.5, 4.5)(x, y) && !ellT(8, 8, 4.5, 2.5)(x, y), m, [8, 8, 6.5, 4.5]); E(pb, 8, 4, 1.8, 1.4, rampOf(o.gem || '#8fd06a')); outline(pb, ol); break;
    case 'wood': for (const [y, x] of [[9, 1], [9, 8], [4, 4]]) { R(pb, x, y, 7, 5, w); E(pb, x, y + 2.5, 1.5, 2.5, rampOf('#d8b080')); } outline(pb, ol); break;
    case 'stone': E(pb, 6, 10, 4.5, 3.5, STONE, { noise: true }); E(pb, 11, 11, 4, 3, STONE); E(pb, 9, 6, 3.5, 3, STONE); outline(pb, ol); D(pb, 8, 5, '#e0dcf0'); break;
    case 'leather': PL(pb, [[3, 3], [7, 2], [9, 4], [13, 3], [14, 8], [12, 13], [8, 14], [4, 12], [2, 8]], rampOf('#a8703e')); outline(pb, ol); D(pb, 6, 6, '#d8a070'); break;
    case 'slime': E(pb, 8, 10, 6, 4.6, rampOf(o.col || '#6fcf5f')); E(pb, 8, 7, 3.5, 3.4, rampOf(o.col || '#6fcf5f')); outline(pb, ol); D(pb, 6, 6, '#fff'); break;
    case 'bone': LN(pb, 4, 12, 12, 4, BONE[3], 2); for (const [x, y] of [[3, 12], [4, 13], [12, 3], [13, 4]]) E(pb, x, y, 1.8, 1.8, BONE); outline(pb, ol); break;
    case 'silk': E(pb, 8, 8, 5, 5.5, ['#c8c8d8', '#e8e8f0', '#ffffff']); for (let y = 4; y < 13; y += 2) LN(pb, 4, y, 12, y + 1, '#b0b0c0', 1); outline(pb, ol); break;
    case 'ecto': E(pb, 8, 8, 5.5, 6, ['rgba(140,200,255,.6)', 'rgba(190,230,255,.8)', '#e6f6ff']); outline(pb, '#2a3a5a'); D(pb, 6, 6, '#fff'); break;
    case 'ore': E(pb, 8, 9, 6, 5, STONE, { noise: true }); [[6, 7], [10, 9], [8, 11]].forEach(([x, y]) => { D(pb, x, y, o.col || '#ffd84a'); D(pb, x + 1, y, '#fff3a0'); }); outline(pb, ol); break;
    case 'scale': PL(pb, [[8, 2], [14, 7], [12, 13], [4, 13], [2, 7]], rampOf(o.col || '#c9533a')); LN(pb, 8, 4, 8, 12, '#1a1220', 1); outline(pb, ol); break;
    case 'bag': E(pb, 8, 10, 5.5, 4.8, rampOf('#a8703e')); R(pb, 6, 3, 4, 3, rampOf('#8a5a32')); E(pb, 8, 10.5, 2, 2, GOLD); outline(pb, ol); break;
    case 'fish': E(pb, 7, 8, 5.5, 3.2, rampOf('#5a9ad8')); PL(pb, [[11, 8], [15, 4], [15, 12]], rampOf('#4a8ac8')); outline(pb, ol); D(pb, 4, 7, '#1a1220'); D(pb, 5, 9, '#d8ecff'); break;
    case 'gem': PL(pb, [[8, 2], [14, 6], [8, 14], [2, 6]], rampOf(o.col || '#e04ae0'), { dith: .2 }); LN(pb, 2, 6, 14, 6, '#ffffff', 1); outline(pb, ol); break;
    case 'key': E(pb, 5, 5, 3.5, 3.5, GOLD); E(pb, 5, 5, 1.4, 1.4, ['#1a1220']); LN(pb, 7, 7, 14, 14, GOLD[2], 2); R(pb, 10, 12, 2, 3, GOLD); R(pb, 12, 10, 3, 2, GOLD); outline(pb, ol); break;
    case 'token': E(pb, 8, 8, 6.5, 6.5, GOLD, { edge: GOLD[0] }); LN(pb, 5, 5, 11, 11, '#8a2a1a', 1); LN(pb, 11, 5, 5, 11, '#8a2a1a', 1); outline(pb, ol); break;
    case 'rod': LN(pb, 2, 15, 13, 2, w[2], 1); PLN(pb, [[13, 2], [15, 6], [15, 12]], '#e8e8f0', 1); E(pb, 15, 13, 1.2, 1.6, ['#e04a3a']); outline(pb, ol); break;
    case 'junk': E(pb, 8, 10, 6, 4, rampOf('#7a7468'), { noise: true }); LN(pb, 4, 5, 10, 9, '#5a4a3a', 2); R(pb, 9, 4, 4, 3, rampOf('#8a8a9a')); outline(pb, ol); break;
    case 'antidote': E(pb, 8, 10.5, 4.5, 4, rampOf('#5ad07a')); R(pb, 6.5, 3.5, 3, 4, ['#d8e4ee', '#ffffff']); R(pb, 6, 1.5, 4, 2.4, rampOf('#a8703e')); outline(pb, ol); D(pb, 6, 9, '#fff'); break;
    case 'sword_ic': LN(pb, 3, 13, 13, 3, '#d8e0ec', 2); LN(pb, 2, 11, 5, 14, GOLD[2], 1); outline(pb, ol); break;
    case 'spark': [[8, 1, 8, 15], [1, 8, 15, 8]].forEach(([a, b, c, d]) => LN(pb, a, b, c, d, o.col || '#d79bff', 1)); E(pb, 8, 8, 2.5, 2.5, ['#ffffff']); [[3, 3], [13, 3], [3, 13], [13, 13]].forEach(([x, y]) => D(pb, x, y, o.col || '#d79bff')); break;
    case 'heart': { const c = rampOf(o.col || '#e0404a'); E(pb, 5.3, 6, 3.6, 3.5, c); E(pb, 10.7, 6, 3.6, 3.5, c); PL(pb, [[1.8, 7], [14.2, 7], [8, 14.5]], c); outline(pb, ol); D(pb, 4, 4, '#ffffff'); D(pb, 5, 4, c[4]); break; }
    case 'mana': { const c = rampOf(o.col || '#3a7ae0'); E(pb, 8, 10, 4.8, 4.6, c); PL(pb, [[8, 1.2], [12.4, 8.6], [3.6, 8.6]], c); outline(pb, ol); D(pb, 6, 9, '#ffffff'); D(pb, 6, 10, c[4]); break; }
    case 'hourglass': R(pb, 3, 1, 10, 2.2, WOOD); R(pb, 3, 12.8, 10, 2.2, WOOD); PL(pb, [[4.5, 3.2], [11.5, 3.2], [8.7, 8], [11.5, 12.8], [4.5, 12.8], [7.3, 8]], ['#9ab8d8', '#c8e4ff', '#eaf6ff']);
      PL(pb, [[5.6, 12.2], [10.4, 12.2], [8, 9.6]], GOLD); PL(pb, [[5.8, 4.2], [10.2, 4.2], [8, 6.8]], GOLD); outline(pb, ol); break;
    case 'eye': E(pb, 8, 8, 6.8, 3.9, ['#c8c8d8', '#eef0f6', '#ffffff']); E(pb, 8, 8, 2.9, 2.9, rampOf(o.col || '#4a8ad8')); E(pb, 8, 8, 1.2, 1.2, ['#1a1220']); outline(pb, ol); D(pb, 7, 7, '#ffffff'); break;
    case 'crit': { const pts = []; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 - 1.571, r = i % 2 ? 3 : 7.2; pts.push([8 + Math.cos(a) * r, 8 + Math.sin(a) * r]); } PL(pb, pts, rampOf(o.col || '#ffb02a')); E(pb, 8, 8, 2.2, 2.2, ['#fff3a0', '#ffffff']); outline(pb, ol); break; }
    case 'star': { const pts = []; for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 - 1.571, r = i % 2 ? 3.1 : 7.4; pts.push([8 + Math.cos(a) * r, 8.6 + Math.sin(a) * r]); } PL(pb, pts, rampOf(o.col || '#f0c25a')); outline(pb, ol); D(pb, 7, 5, '#ffffff'); break; }
    case 'coin': E(pb, 8, 8, 6.2, 6.2, GOLD, { edge: GOLD[0] }); E(pb, 8, 8, 4, 4, [GOLD[1], GOLD[2]]); R(pb, 7.2, 5, 1.6, 6, [GOLD[4]]); outline(pb, ol); D(pb, 5, 5, '#ffffff'); break;
    case 'ess': PL(pb, [[8, 1], [12.5, 6], [8, 15], [3.5, 6]], rampOf(o.col || '#b06af0'), { dith: .2 }); LN(pb, 8, 2, 8, 14, '#f0d8ff', 1); outline(pb, ol); D(pb, 6, 5, '#ffffff'); break;
    case 'clock': E(pb, 8, 8, 6.4, 6.4, ['#c8c0a8', '#efe8d4', '#ffffff']); LN(pb, 8, 8, 8, 3.6, '#1a1220', 1); LN(pb, 8, 8, 11.4, 9.4, '#1a1220', 1); outline(pb, ol); break;
    case 'scroll': R(pb, 3.5, 3, 9, 10, ['#c8b48a', '#e4d4b0', '#f2e8cc']); R(pb, 2, 1.5, 12, 2.6, rampOf('#a8703e')); R(pb, 2, 12, 12, 2.6, rampOf('#a8703e')); for (const y of [5.5, 7.5, 9.5]) LN(pb, 5, y, 11, y, '#8a7a5a', 1); outline(pb, ol); break;
    case 'paw': { const c = rampOf(o.col || '#c8a070'); E(pb, 8, 10.6, 3.8, 3.2, c); E(pb, 3.8, 6.6, 1.7, 2, c); E(pb, 6.6, 3.8, 1.7, 2, c); E(pb, 9.6, 3.8, 1.7, 2, c); E(pb, 12.3, 6.6, 1.7, 2, c); outline(pb, ol); break; }
    case 'swap': { const c = o.col || '#f0c25a'; LN(pb, 2.5, 5, 11, 5, c, 2); PL(pb, [[10.5, 1.6], [15, 5], [10.5, 8.4]], [c]); LN(pb, 13.5, 11, 5, 11, c, 2); PL(pb, [[5.5, 7.6], [1, 11], [5.5, 14.4]], [c]); outline(pb, ol); break; }
    case 'book': PL(pb, [[1, 3.5], [8, 4.6], [8, 14], [1, 12.8]], ['#d8c8a8', '#efe3c4']); PL(pb, [[8, 4.6], [15, 3.5], [15, 12.8], [8, 14]], ['#e4d6b6', '#f6eedc']); for (const y of [6.5, 8.5, 10.5]) { LN(pb, 2.6, y - .4, 6.6, y, '#9a8a6a', 1); LN(pb, 9.4, y, 13.4, y - .4, '#9a8a6a', 1); } R(pb, 7.4, 4.6, 1.2, 9.4, rampOf(o.col || '#8a2a1a')); outline(pb, ol); break;
    case 'house': PL(pb, [[1, 7.5], [8, 1.5], [15, 7.5]], rampOf(o.col || '#c8483a')); R(pb, 3, 7.5, 10, 7, ['#d8c8a8', '#efe3c4']); R(pb, 6.6, 10, 2.8, 4.5, rampOf('#6a4424')); R(pb, 10, 9, 2, 2, ['#7fb4e8']); outline(pb, ol); break;
    case 'npc': E(pb, 8, 4.8, 3.2, 3.2, SKIN); PL(pb, [[3, 15], [4.5, 9], [11.5, 9], [13, 15]], rampOf(o.col || '#5a72c8')); R(pb, 5, 1.5, 6, 2, rampOf(o.hair || '#6b4423')); outline(pb, ol); break;
    case 'orb': { const c = rampOf(o.col || '#d79bff'); E(pb, 8, 8, 5.6, 5.6, c, { dith: .25 }); E(pb, 6.6, 6.4, 1.8, 1.6, ['#ffffff']); [[2, 2], [14, 3], [2, 14], [14, 13]].forEach(([x, y]) => D(pb, x, y, c[3])); outline(pb, ol); break; }
    case 'arrowup': { const c = rampOf(o.col || '#8fd06a'); PL(pb, [[8, 1.5], [14.5, 8], [10.5, 8], [10.5, 14.5], [5.5, 14.5], [5.5, 8], [1.5, 8]], c); outline(pb, ol); break; }
    case 'skull': E(pb, 8, 7, 5.6, 5.2, BONE); R(pb, 5, 10.5, 6, 3.6, BONE); E(pb, 5.8, 7.4, 1.6, 1.8, [o.col || '#1a1220']); E(pb, 10.2, 7.4, 1.6, 1.8, [o.col || '#1a1220']); LN(pb, 7, 12.5, 7, 14, '#1a1220', 1); LN(pb, 9, 12.5, 9, 14, '#1a1220', 1); outline(pb, ol); break;
    case 'bandage': R(pb, 2, 5.5, 12, 5, ['#d8d0c0', '#f2ece0', '#ffffff']); R(pb, 6, 6, 4, 4, ['#e8dcc8']); D(pb, 7, 7, '#c8483a'); D(pb, 8, 8, '#c8483a'); outline(pb, ol); break;
    case 'new': { const c = o.col || '#f0c25a'; LN(pb, 8, 1, 8, 15, c, 1); LN(pb, 1, 8, 15, 8, c, 1); LN(pb, 3.5, 3.5, 12.5, 12.5, c, 1); LN(pb, 12.5, 3.5, 3.5, 12.5, c, 1); E(pb, 8, 8, 3, 3, ['#fff3a0', '#ffffff']); break; }
    default: E(pb, 8, 8, 5, 5, ['#888']); outline(pb, ol);
  }
  return pb;
}
const BASE_ICON = { Espada:'sword', Machado:'axe', 'Maça':'mace', Cajado:'staff', Varinha:'wand', Adaga:'dagger', 'Arco Curto':'bow', Escudo:'shield', Tomo:'tome', 'Adaga de Aparar':'dagger',
  Elmo:'helm', 'Chapéu':'hat', Capuz:'hood', Peitoral:'chest', Manto:'chest', 'Gibão':'chest', Grevas:'legs', 'Calças de Seda':'legs', Botas:'boots', Anel:'ring', Amuleto:'amulet', Bracelete:'bracelet' };
const ITEM_ICON = {
  pocao_p:['pot', { col:'#e04a5a', size:0 }], pocao:['pot', { col:'#e04a5a', size:1 }], pocao_g:['pot', { col:'#e04a5a', size:2 }], eter_p:['pot', { col:'#3a7ae0', size:0 }], eter:['pot', { col:'#3a7ae0', size:1 }],
  elixir:['pot', { col:'#e05ac8', size:2 }], antidoto:['antidote'], chave:['key'], ficha:['token'], linha:['rod'], madeira:['wood'], pedra:['stone'], couro:['leather'], gosma:['slime'], osso:['bone'],
  seda:['silk'], ectoplasma:['ecto'], minerio:['ore'], escama:['scale'], ouro_saco:['bag'], peixe:['fish'], gema:['gem'], lixo:['junk'],
};
function itemIcon(x) {
  if(typeof UI_CANVAS!=='undefined'){
    const key=typeof x==='string'?x:x && !Array.isArray(x)?(x.name==='Espada Enferrujada'?'rusty':x.name==='Jaqueta de Couro'?'leather':null):null;
    if(key&&UI_CANVAS.has(key))return UI_CANVAS.get(key);
  }
  let kind, o = {};
  if (Array.isArray(x)) { [kind, o = {}] = x; }
  else if (typeof x === 'string') { [kind, o = {}] = ITEM_ICON[x] || [x]; }
  else { kind = BASE_ICON[x.base] || 'ring'; o = { metal:METAL[x.tier] || METAL[2], col:x.type === 'mago' ? '#3f5fd8' : x.type === 'ladino' ? '#3a8f6a' : '#5a72c8', robe:x.base === 'Manto', leather:x.base === 'Gibão' || x.base === 'Botas', gem:['#e04a5a', '#4ab0e8', '#8fd06a', '#f0b94a', '#c070f0', '#ffffff'][x.seed % 6] }; }
  const sig = kind + JSON.stringify(o);
  if (!ICON_CACHE.has(sig)) ICON_CACHE.set(sig, toCanvas(iconPB(kind, o)));
  return ICON_CACHE.get(sig);
}
const iconImg = (x, sz = 32, cls = '') => '<img class="pix ' + cls + '" src="' + sprUrl(itemIcon(x)) + '" width="' + sz + '" height="' + sz + '" alt="">';
const sprImg = (c, sz, cls = '') => '<img class="pix ' + cls + '" src="' + sprUrl(c) + '" width="' + sz + '" height="' + sz + '" alt="">';
function silhouette(c) {
  const k = 'sil'; if (c[k]) return c[k];
  const s = document.createElement('canvas'); s.width = c.width; s.height = c.height; const g = s.getContext('2d'); g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#050403'; g.fillRect(0, 0, s.width, s.height);
  c[k] = s; return s;
}
const ELEM_COL = { fis:'#e8e8f0', fogo:'#ff7a2a', agua:'#4ab0e8', terra:'#c8944a', raio:'#ffe14a', sagrado:'#fff3a0', sombrio:'#9a5ae8', arcano:'#e85ae0', neutro:'#b8b8ff' };
function skillIc(id) {
  const s = SKILLS[id];
  if (s.kind === 'heal') return ['heart', { col:'#5ad07a' }];
  if (s.kind === 'ward') return ['shield', { col:'#7ab8e0', metal:'#d8e0ec' }];
  if (s.kind === 'buff') return ['arrowup', { col:s.buff.mag ? '#6a8ef0' : s.buff.eva ? '#c8c8d8' : '#f0a03a' }];
  if (s.kind === 'debuff') return ['skull', { col:'#7a3aa8' }];
  if (s.stat === 'mag' || s.stat === 'both') return ['orb', { col:ELEM_COL[s.elem || 'neutro'] }];
  return s.hits > 1 || s.all ? ['axe', { metal:'#d8e0ec' }] : ['sword', { metal:'#d8e0ec' }];
}
let skIcon = (id, sz = 28) => iconImg(skillIc(id), sz);
/* ===== Utilidades ===== */
const $ = (s, r = document) => r.querySelector(s);
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wait = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const fmt = n => Math.round(n).toLocaleString('pt-BR');
function wpick(list) { const tot = list.reduce((a, x) => a + x[1], 0); let r = Math.random() * tot; for (const x of list) { r -= x[1]; if (r <= 0) return x[0]; } return list[0][0]; }
let xpNext = L => 200 + 25 * (L-1) + 6 * (L-1) * (L-1);
const SAVE_KEY = 'vaelmar-v2';
const todayKey = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };

/* ===== Som ===== */
let AC = null, SND = true;
function beep(f = 440, d = .08, type = 'square', vol = .035, slide = 0) {
  if (!SND) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f, AC.currentTime);
    if (slide) o.frequency.linearRampToValueAtTime(f + slide, AC.currentTime + d);
    g.gain.setValueAtTime(vol, AC.currentTime); g.gain.linearRampToValueAtTime(.0001, AC.currentTime + d);
    o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + d + .02);
  } catch (e) { /* sem áudio */ }
}
const sfx = {
  click: () => beep(520, .05), step: () => beep(150, .03, 'triangle', .02),
  hit: () => beep(180, .12, 'sawtooth', .05, -90), crit: () => { beep(300, .1, 'sawtooth', .05, -120); setTimeout(() => beep(520, .1, 'square', .04), 60); },
  hurt: () => beep(120, .18, 'sawtooth', .05, -60), heal: () => { beep(520, .08); setTimeout(() => beep(780, .12), 80); },
  magic: () => beep(400, .22, 'sine', .05, 400), win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, .14), i * 110)),
  lose: () => [330, 262, 196, 130].forEach((f, i) => setTimeout(() => beep(f, .2, 'triangle'), i * 160)),
  level: () => [392, 523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, .12), i * 80)),
  coin: () => { beep(880, .06); setTimeout(() => beep(1320, .1), 60); }, enc: () => { beep(220, .08, 'square', .04, 220); setTimeout(() => beep(440, .1, 'square', .04, 220), 90); },
};

/* ===== Estado ===== */
let S = null;
let UID = Date.now();
const uid = () => 'i' + (UID++).toString(36);
function newState(cls, name) {
  const S0 = {
    v:3, content:3, regions:{}, name, cls, classes:[cls], spec:null, lvl:1, xp:0, hp:1, mp:1, gold:80, ess:0,
    inv:{ pocao_p:25, eter_p:25, chave:0, ficha:1 }, sets:{ padrao:{}, masmorra:{}, pvp:{}, incursoes:{} }, bag:[], newIds:[],
    skills:[], equipped:[], pos:null, way:{}, town:{ loja:0, casa:0, bestiario:0, ferreiro:0, prefeitura:0 },
    pets:[], pet:-1, petHp:1, quest:{ i:0, prog:{}, ready:false }, daily:null, codex:{}, cnt:{ arena:0, upgrades:0, dungeons:{} },
    buffs:{}, forge:[], stock:null, lastTown:'alvorada', snd:true, ended:false, hallDay:null, raid:{ sigils:0, seals:0, wins:0 },
  };
  return S0;
}
let storageWarned = false;
function save() { try { if (S) { S.snd = SND; localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } } catch (e) { if(!storageWarned){storageWarned=true;setTimeout(()=>toast('O navegador bloqueou o salvamento. Exporte seu save pelo menu do herói.'),1500);} } }
function loadSave() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null; const o = JSON.parse(raw); if (o && (o.v === 2 || o.v === 3)) return migrate(o); } catch (e) { /* inválido */ }
  return null;
}
const OLD_CLS = { paladino:'soldado', arquimago:'aprendiz', assassino:'gatuno', cruzado:'escudeiro', sombra:'assassino', espadachim:'escudeiro', templario:'cavaleiro', arcanista:'arquimago', mestre:'lamina' };
function migrate(o) {
  if (o.v === 2) {
    const map = k => CLASSES[k] && !OLD_CLS[k] ? k : (OLD_CLS[k] || 'guerreiro');
    o.cls = map(o.cls); o.classes = [...new Set((o.classes || []).map(map))]; if (!o.classes.includes(o.cls)) o.classes.push(o.cls);
    o.sets = { padrao:{}, masmorra:{}, pvp:{} }; o.bag = o.bag || [];
    for (const sl in (o.gear || {})) { const it = o.gear[sl]; if (!it) continue; o.bag.push(it); o.sets.padrao[sl === 'acc' ? 'acc1' : sl] = it.id; }
    delete o.gear; o.newIds = []; o.v = 3;
  }
  if (!CLASSES[o.cls]) return null;
  o.newIds = o.newIds || []; o.sets = o.sets || { padrao:{}, masmorra:{}, pvp:{} };
  o.raid = Object.assign({ sigils:0, seals:0, wins:0 }, o.raid || {}); o.regions = o.regions || {}; o.content = 3;
  for(const k of SETS) o.sets[k]=o.sets[k]||{};
  for(const it of o.bag||[]){if(it.name==='Espada Enferrujada')it.fixedStats={atk:5};if(it.name==='Jaqueta de Couro')it.fixedStats={def:5,res:2};}
  return o;
}

/* ===== Equipamentos ===== */
const BASE_P = [0,9,24,48,82,125,210,330,500,750,1100];
function rollQuality(bonus = 0) {
  const r = Math.random() - bonus;
  if (r < .015) return rnd(1.7, 1.99); if (r < .06) return rnd(1.3, 1.69); if (r < .2) return rnd(1.1, 1.29);
  if (r < .82) return rnd(.9, 1.09); if (r < .93) return rnd(.8, .89); return rnd(.7, .79);
}
const qualOf = q => QUAL.find(x => q >= x.a - 1e-9 && q <= x.b + 1e-9) || (q >= 2 ? QUAL[6] : QUAL[2]);
function genGear(tier, slot, type, qBonus = 0, q) {
  slot = slot || pick(['weapon', 'weapon', 'offhand', 'head', 'chest', 'legs', 'acc']);
  type = slot === 'acc' ? 'any' : (type || pick(['guerreiro', 'mago', 'ladino']));
  const base = pick(GEAR_BASE[slot][type] || GEAR_BASE[slot].any);
  const it = { id:uid(), slot, type, base, tier:clamp(tier, 1, 10), q:+(q || rollQuality(qBonus)).toFixed(2), lvl:1, seed:ri(0, 5) };
  it.name = base + ' ' + TIER_ADJ[it.tier];
  return it;
}
function gearStats(it) {
  if(it.fixedStats) return Object.fromEntries(Object.entries(it.fixedStats).map(([k,v])=>[k,Math.round(v*(1+.1*(it.lvl-1)))]));
  const P = BASE_P[it.tier] * it.q * (1 + .1 * (it.lvl - 1)), st = {}, r = v => Math.max(1, Math.round(v));
  if (it.slot === 'weapon') { if (it.type === 'mago') st.mag = r(P); else st.atk = r(P); if (it.type === 'ladino') st.crit = 4; }
  else if (it.slot === 'offhand') { if (it.type === 'guerreiro') { st.def = r(P * .45); st.res = r(P * .2); } else if (it.type === 'mago') { st.mag = r(P * .3); st.mp = r(P * .9); } else { st.dex = r(P * .35); st.atk = r(P * .2); } }
  else if (it.slot === 'head') { if (it.type === 'mago') { st.res = r(P * .35); st.mag = r(P * .1); } else { st.def = r(P * .3); st.res = r(P * .2); } }
  else if (it.slot === 'chest') { if (it.type === 'mago') { st.res = r(P * .4); st.hp = r(P * 1.2); } else { st.def = r(P * .45); st.hp = r(P * 1.6); } }
  else if (it.slot === 'legs') { st.def = r(P * .25); st.dex = r(P * .2); }
  else { const sets = [['hp', 'atk'], ['mp', 'mag'], ['dex', 'crit'], ['hp', 'def'], ['res', 'mag'], ['atk', 'dex']]; const [a, b] = sets[it.seed % sets.length]; const f = { hp:1.2, mp:.8, atk:.25, mag:.25, dex:.25, crit:.08, def:.25, res:.25 }; st[a] = r(P * f[a]); st[b] = r(P * f[b]); }
  return st;
}
const gearLine = it => Object.entries(gearStats(it)).map(([k, v]) => '+' + v + ' ' + STAT_LBL[k]).join(' · ');
let gearPrice = it => Math.round((8 + BASE_P[it.tier] * 6) * Math.pow(it.q, 2) * (1 + .15 * (it.lvl - 1)));
let canWear = it => it.type === 'any' || CLASSES[S.cls].gear.includes(it.type);
function starterGear(cls) {
  const t = CLASSES[cls].gear[0], w = genGear(1, 'weapon', t, 0, .95), c = genGear(1, 'chest', t, 0, .9);
  w.name = { guerreiro:'Espada Enferrujada', mago:'Cajado de Aprendiz', ladino:'Adaga Gasta' }[t]; w.base = { guerreiro:'Espada', mago:'Cajado', ladino:'Adaga' }[t];
  c.name = { guerreiro:'Jaqueta de Couro', mago:'Manto Simples', ladino:'Gibão Velho' }[t];
  if(t==='guerreiro'){w.fixedStats={atk:5};c.fixedStats={def:5,res:2};}
  S.bag.push(w, c); S.sets.padrao.weapon = w.id; S.sets.padrao.chest = c.id;
}
const itemById = id => S.bag.find(i => i.id === id);
function equippedIn(set, slot) {
  let id = (S.sets[set] || {})[slot]; if (!id && set !== 'padrao') id = S.sets.padrao[slot];
  const it = id && itemById(id); return it && canWear(it) ? it : null;
}
const setOfMode = m => m === 'dungeon' ? 'masmorra' : m === 'arena' ? 'pvp' : m === 'raid' ? 'incursoes' : 'padrao';
const isEquipped = it => SETS.some(st => Object.values(S.sets[st] || {}).includes(it.id));
function equipItem(it, slot, set = 'padrao') { if (!canWear(it)) return false; const k = slotKind(slot); if (k !== it.slot) return false; for (const sl of SLOTS) if (S.sets[set][sl] === it.id) delete S.sets[set][sl]; S.sets[set][slot] = it.id; return true; }
function unequipAll(it) { for (const st of SETS) for (const sl in S.sets[st]) if (S.sets[st][sl] === it.id) delete S.sets[st][sl]; }
function addGear(it) { S.bag.push(it); S.newIds.push(it.id); }
const bagFull = () => S.bag.filter(i => !isEquipped(i)).length >= 60;

/* ===== Atributos ===== */
function baseStats(L) { const l = L - 1; return { hp:110 + 16 * l, mp:20 + 6 * l, atk:10 + 2.3 * l, mag:5 + 2.3 * l, def:10 + 1.7 * l, res:10 + 1.7 * l, dex:10 + 1.6 * l }; }
const pathOf = () => PATH_OF[S.cls], ptier = () => CLASSES[S.cls].tier;
function stats(set = 'padrao') {
  const c = CLASSES[S.cls], b = baseStats(S.lvl), st = {}, path = pathOf(), t = ptier();
  for (const k in b) st[k] = b[k] * (c.m[k] || 1);
  st.crit = 5; st.ward = 0;
  for (const sl of SLOTS) { const it = equippedIn(set, sl); if (it) { const g = gearStats(it), wm = sl === 'weapon' && path === 'guerreiro' ? 1 + .05 * t : 1; for (const k in g) st[k] = (st[k] || 0) + g[k] * wm; } }
  const sp = S.spec && SPECS[S.spec]; if (sp) for (const k in sp.bonus) st[k] *= 1 + sp.bonus[k];
  if (path === 'mago') st.mag *= 1 + .04 * t;

  for (const k in st) st[k] = Math.round(st[k]);
  st.init = Math.max(2,Math.floor(st.dex * .15 + t)); st.vision = 170 + t * 10;
  return st;
}
let topTier = () => Math.max(...S.classes.map(k => CLASSES[k].tier));
const levelCapped = () => false;
function learnSkills(silent) {
  const out = [];
  for (const k of S.classes) for (const [lv, id] of CLASSES[k].skills) if (lv <= S.lvl && !S.skills.includes(id)) {
    S.skills.push(id); out.push(id); if (S.equipped.length < 6) S.equipped.push(id);
  }
  if (S.spec && SPECS[S.spec].skill && !S.skills.includes(SPECS[S.spec].skill)) { const id = SPECS[S.spec].skill; S.skills.push(id); out.push(id); if (S.equipped.length < 6) S.equipped.push(id); }
  return out;
}

/* ===== Experiência e recompensas ===== */
const buffOn = k => S.buffs[k] && S.buffs[k] > Date.now();
function gainXp(n) {
  const lines = []; if (buffOn('xp2')) n *= 2;
  if (S.lvl >= MAXLV) return lines;
  if (levelCapped()) { if (!S.capWarn) { lines.push(['Você chegou ao limite do tier. Desbloqueie uma classe de tier ' + (topTier() + 1) + ' para continuar subindo.', 'gold']); S.capWarn = true; } return lines; }
  S.xp += Math.round(n);
  while (S.lvl < MAXLV && !levelCapped() && S.xp >= xpNext(S.lvl)) {
    S.xp -= xpNext(S.lvl); S.lvl++;
    const st = stats(); S.hp = st.hp; S.mp = st.mp;
    lines.push(['Nível ' + S.lvl + '!', 'gold']);
    for (const id of learnSkills()) lines.push(['Nova habilidade: ' + SKILLS[id].n, 'gold']);
  }
  if (levelCapped()) S.xp = Math.min(S.xp, xpNext(S.lvl) - 1);
  return lines;
}
function addItem(k, n = 1) { S.inv[k] = (S.inv[k] || 0) + n; }
function hasRes(cost) { for (const k in cost) { if (k === 'ouro' ? S.gold < cost[k] : (S.inv[k] || 0) < cost[k]) return false; } return true; }
function payRes(cost) { for (const k in cost) { if (k === 'ouro') S.gold -= cost[k]; else S.inv[k] -= cost[k]; } }
const costLine = cost => Object.entries(cost).map(([k, v]) => '<span class="' + ((k === 'ouro' ? S.gold : (S.inv[k] || 0)) >= v ? '' : 'lack') + '">' + fmt(v) + ' ' + RES_LBL[k] + '</span>').join(' · ');

/* ===== Codex ===== */
function cx(k) { return S.codex[k] || (S.codex[k] = { kills:0, moves:{}, drops:{}, el:{} }); }
function codexDone(k) {
  const d = MON[k], c = S.codex[k]; if (!c || !d || k === 'rival') return false;
  const els = [...(d.weak || []), ...(d.res || []), ...(d.immune || [])];
  return d.moves.every(([m]) => c.moves[m]) && (d.drops || []).every(([i]) => c.drops[i]) && els.every(e => c.el[e]);
}
let codexCount = () => Object.keys(S.codex).filter(codexDone).length;

/* ===== Avisos ===== */
let toastT = null;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false; t.classList.toggle('top', (typeof cur !== 'undefined' && cur === 'battle') || !$('#overlay').hidden);
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600);
}
/* ===== Mundo: terreno, zonas, estradas, pintura em blocos ===== */
function vn(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, s = t => t * t * (3 - 2 * t);
  const a = hn(xi, yi, 3), b = hn(xi + 1, yi, 3), c = hn(xi, yi + 1, 3), d = hn(xi + 1, yi + 1, 3), u = s(xf), v = s(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const TILE = 32, WW = 160, WH = 160, CH = 256;
const T = { GRASS:0, FOREST:1, DIRT:2, WATER:3, SWAMP:4, CLIFF:5, ROCKY:6, SAND:7, BRIDGE:8, DFOREST:9, FLOOR:10 };
const WALKABLE = [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1];
const isForest = t => t === T.FOREST || t === T.DFOREST;

/* mapa de zonas: cada letra cobre 8x8 tiles */
const ZMAP = [
  "MMMMMMCCSSSS",
  "MMMMMCCCSSSS",
  "MMMCCCCCSSSS",
  "MMCCCCCCLLLL",
  "OOCCCCCCLLLL",
  "OOBBBBBBLLLL",
  "OOBBBBBBLLFF",
  "OOBBBBBBFFFF",
  "OOBBBBBBFFFF",
  "~~~~~~~~~~~~",
];
const zoneKeyAt = (tx, ty) => {
  const wx = tx + (vn(tx / 5, ty / 5) - .5) * 6, wy = ty + (vn(tx / 5 + 40, ty / 5 + 9) - .5) * 6;
  const r = ZMAP[clamp(Math.floor(wy / 8), 0, ZMAP.length - 1)], c = clamp(Math.floor(wx / 8), 0, r.length - 1);
  return r[c];
};

let TMAP = null, ZGRID = null, ROADS = [];
function genWorld() {
  TMAP = new Uint8Array(WW * WH); ZGRID = [];
  for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) {
    const z = zoneKeyAt(x, y); ZGRID[y * WW + x] = z;
    const n = vn(x / 6, y / 6) * .7 + vn(x / 2.6 + 20, y / 2.6 + 20) * .3, p = vn(x / 4 + 50, y / 4 + 7);
    let t = T.GRASS;
    if (z === 'B') { t = n > .5 ? T.FOREST : p > .76 ? T.DIRT : T.GRASS; }
    else if (z === 'O') { t = n > .72 ? T.FOREST : T.GRASS; }
    else if (z === 'C') { t = n > .7 ? T.FOREST : p > .8 ? T.DIRT : T.GRASS; }
    else if (z === 'S') { t = n > .44 ? T.DFOREST : T.GRASS; }
    else if (z === 'L') { const l = vn(x / 8 + 3, y / 8 + 5); t = l > .58 ? T.WATER : l > .47 ? T.SWAMP : (n > .74 ? T.FOREST : T.GRASS); }
    else if (z === 'F') { t = n > .66 ? T.ROCKY : p > .7 ? T.DIRT : T.GRASS; if (vn(x / 3 + 9, y / 3) > .78) t = T.CLIFF; }
    else if (z === 'M') { t = n > .56 ? T.CLIFF : T.ROCKY; }
    else if (z === 'J') { t = n > .72 ? T.CLIFF : T.ROCKY; }
    else if (z === 'V') { t = n > .62 ? T.FOREST : n < .3 ? T.ROCKY : T.GRASS; }
    else if (z === 'N') { t = n > .65 ? T.CLIFF : p > .45 ? T.FLOOR : T.GRASS; }
    else if (z === 'R') { t = n > .67 ? T.CLIFF : p > .65 ? T.SWAMP : T.ROCKY; }
    else if (z === 'A') { t = n > .74 ? T.CLIFF : p > .54 ? T.FLOOR : T.GRASS; }
    else if (z === '~') { t = T.WATER; }
    TMAP[y * WW + x] = t;
  }
  /* praia na transição para o mar */
  for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) {
    if (ZGRID[y * WW + x] !== '~' && TMAP[y * WW + x] !== T.WATER) {
      for (let d = 1; d <= 2; d++) if (y + d < WH && ZGRID[(y + d) * WW + x] === '~') { TMAP[y * WW + x] = T.SAND; break; }
    }
  }
  /* rio descendo das montanhas até a lagoa */
  let rx = 52, ry = 1;
  while (ry < 44) {
    for (let k = -1; k <= 0; k++) setT(Math.round(rx) + k, ry, T.WATER);
    ry++; rx += (vn(ry / 7, 3) - .5) * 1.4 + (ry > 24 ? .55 : .05);
  }
  /* moldura de montanhas */
  for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) {
    const edge = Math.min(x, y, WW - 1 - x) + (vn(x / 3, y / 3) - .5) * 2;
    if (edge < 1.6 && ZGRID[y * WW + x] !== '~') TMAP[y * WW + x] = T.CLIFF;
  }
  /* lugares: limpar o chão em volta */
  for (const p of POIS) clearArea(p.tx, p.ty, p.clear || 3, p.floor ? T.FLOOR : null);
  /* estradas */
  ROADS = [
    [[9, 48], [16, 51], [26, 54], [40, 56]],
    [[40, 56], [41, 46], [43, 36], [44, 30]],
    [[44, 30], [37, 25], [30, 22]],
    [[44, 30], [56, 30], [66, 31], [76, 30], [86, 30]],
    [[40, 56], [52, 60], [64, 62], [78, 62]],
    [[86, 30], [84, 20], [82, 10]],
    [[44, 30], [32, 18], [22, 14], [12, 10]],
    [[72, 40], [70, 31]],
  ];
  ROADS.push([[78,62],[90,62],[104,62],[110,56]], [[110,56],[112,34],[112,12]], [[112,34],[132,28],[140,18]], [[140,18],[151,18],[164,20]], [[164,20],[176,30],[180,40]], [[110,56],[130,58],[145,60],[154,65]], [[180,40],[174,56],[166,68]]);
  for (const r of ROADS) for (let i = 0; i < r.length - 1; i++) road(r[i], r[i + 1]);
  const roadPoints = ROADS.flat();
  for (const p of POIS) { const closest = roadPoints.reduce((a,b)=>Math.hypot(b[0]-p.tx,b[1]-p.ty)<Math.hypot(a[0]-p.tx,a[1]-p.ty)?b:a); road([p.tx,p.ty],closest); }
  for (const p of POIS) clearArea(p.tx, p.ty, 1, p.floor ? T.FLOOR : null);
}
const setT = (x, y, t) => { if (x >= 0 && y >= 0 && x < WW && y < WH) TMAP[y * WW + x] = t; };
const tAt = (x, y) => (x < 0 || y < 0 || x >= WW || y >= WH) ? T.CLIFF : TMAP[y * WW + x];
function clearArea(cx, cy, r, floor) {
  for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
    const d = Math.hypot(x - cx, (y - cy) * 1.1); if (d > r + .3) continue;
    const t = tAt(x, y); if (t === T.WATER && d > 1.5) continue;
    setT(x, y, floor && d <= r - 1 ? floor : (t === T.ROCKY || t === T.SAND || t === T.SWAMP ? t : T.GRASS));
  }
}
function road(a, b) {
  const steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, x = a[0] + (b[0] - a[0]) * t + (vn(i / 9, a[0]) - .5) * 1.6, y = a[1] + (b[1] - a[1]) * t + (vn(i / 9, a[1] + 7) - .5) * 1.6;
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const X = Math.floor(x + dx * .7), Y = Math.floor(y + dy * .7), cur = tAt(X, Y);
      if (cur === T.WATER) setT(X, Y, T.BRIDGE); else if (cur !== T.BRIDGE && cur !== T.FLOOR) setT(X, Y, T.DIRT);
    }
  }
}

/* ---------- Cores ---------- */
const hexI = h => { const n = parseInt(h.slice(1), 16); return 0xff000000 | ((n & 255) << 16) | (n & 0xff00) | (n >> 16); };
const C = {};
for (const [k, v] of Object.entries({
  g0:'#285a32', g1:'#34723e', g2:'#3d8346', g3:'#448d4c', g4:'#559855', gf:'#f4f1dc', gy:'#ffd84a', gp:'#ff9ab8',
  dg0:'#244f34', dg1:'#2d5f3c', dg2:'#356b44', dg3:'#3f794c', dg4:'#4f8c5a',
  d0:'#7a5c3a', d1:'#9c7a4e', d2:'#b48f5f', d3:'#c4a070', d4:'#d8bb8c',
  w0:'#2d62b4', w1:'#3672c4', w2:'#3f7fd0', w3:'#6aa6e6', w4:'#d4ecfb',
  s0:'#3d4a2c', s1:'#4b5733', s2:'#56633a', s3:'#667444', p0:'#2a4a4e', p1:'#33585c', p2:'#5d8a80',
  r0:'#5a5446', r1:'#746c5c', r2:'#847c6a', r3:'#968e7b', r4:'#aaa290',
  c0:'#2f2b40', c1:'#4a4660', c2:'#5f5a76', c3:'#7d7894', c4:'#9a96b0', c5:'#b6b2c8',
  sa0:'#b79e66', sa1:'#d4bf85', sa2:'#e2cf96', sa3:'#efe0b0',
  fl0:'#6d6658', fl1:'#958d7c', fl2:'#a89f8c', fl3:'#bdb4a0',
  b0:'#4a2e16', b1:'#6e4a26', b2:'#9a6a38', b3:'#b88348',
  fg:'#163a22', dfg:'#0f2a20',
})) C[k] = hexI(v);

function pickT(px, py) {
  const wx = (vn(px / 22, py / 22) - .5) * 17, wy = (vn(px / 22 + 31, py / 22 + 17) - .5) * 17;
  return tAt(Math.floor((px + wx) / TILE), Math.floor((py + wy) / TILE));
}

/* pinheiros da floresta densa (10x10) */
const PINE = ["....oo....", "...oLLo...", "..oLLMMo..", "..oLMMMo..", ".oLLMMMDo.", ".oLMMMDDo.", "oLLMMMDDDo", "oLMMMDDDDo", ".oDDDDDDo.", "..oooooo.."];
function glyphCanvas(rows, pal) {
  const c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length; const g = c.getContext('2d');
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } }));
  return c;
}
let PINES = null;
function initGlyphs() {
  PINES = {
    [T.FOREST]: [glyphCanvas(PINE, { o:'#163a22', D:'#24552f', M:'#2f6e3a', L:'#46904a' }), glyphCanvas(PINE, { o:'#163a22', D:'#285c33', M:'#347840', L:'#509a50' })],
    [T.DFOREST]: [glyphCanvas(PINE, { o:'#0c2219', D:'#173a2c', M:'#1f4d3a', L:'#2e6a4c' }), glyphCanvas(PINE, { o:'#0c2219', D:'#1a4030', M:'#235640', L:'#357556' })],
  };
}

/* ---------- Pintura de um bloco 256x256 ---------- */
const CHUNKS = new Map();
function chunkCanvas(cx, cy) {
  const key = cx + ',' + cy; if (CHUNKS.has(key)) { const v = CHUNKS.get(key); CHUNKS.delete(key); CHUNKS.set(key, v); return v; }
  const c = paintChunk(cx, cy); CHUNKS.set(key, c);
  if (CHUNKS.size > 60) { const first = CHUNKS.keys().next().value; CHUNKS.delete(first); }
  return c;
}
function paintChunk(cx, cy) {
  const M = 14, W = CH + M * 2, X0 = cx * CH - M, Y0 = cy * CH - M;
  const cls = new Uint8Array(W * W);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) cls[y * W + x] = pickT(X0 + x, Y0 + y);
  const at = (x, y) => cls[clamp(y, 0, W - 1) * W + clamp(x, 0, W - 1)];
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
        const n = vn(px / 70, py / 70) * .75 + vn(px / 23 + 9, py / 23 + 3) * .25;
        let i = 2; if (n > .62 + bay(px, py) * .05) i = 3; else if (n < .28 + bay(px, py) * .05) i = 1;
        col = C[pre + i];
        /* tufos em forma de "v" */
        const cxl = Math.floor(px / 9), cyl = Math.floor(py / 9), hq = hn(cxl, cyl, 21);
        if (hq > .7) {
          const ox = cxl * 9 + 1 + Math.floor(hn(cxl, cyl, 22) * 4), oy = cyl * 9 + 2 + Math.floor(hn(cxl, cyl, 23) * 4), dx = px - ox, dy = py - oy;
          if ((dy === 0 && (dx === 0 || dx === 4)) || (dy === 1 && (dx === 1 || dx === 3)) || (dy === 1 && dx === 2 && hq > .86)) col = C[pre + '0'];
          else if (dy === -1 && (dx === 0 || dx === 4)) col = C[pre + '4'];
        }
        /* canteiros de flores */
        if (!dark && q < .05 && vn(px / 40 + 70, py / 40) > .72) col = hn(px, py, 12) > .5 ? C.gf : (hn(px, py, 13) > .5 ? C.gy : C.gp);
      }
    } else if (t === T.DIRT) {
      const n = vn(px / 18 + 5, py / 18);
      col = n > .62 ? C.d3 : n < .3 ? C.d1 : C.d2;
      if (q > .985) col = C.d4; else if (q < .012) col = C.d0;
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
    if (zk === 'J' && t !== T.WATER && t !== T.BRIDGE) col = hexI(t === T.CLIFF ? '#8babc0' : t === T.DIRT ? '#9aa6aa' : q > .4 ? '#cbdde3' : '#bacdd6');
    if (zk === 'R' && t !== T.BRIDGE) col = hexI(t === T.CLIFF ? '#3e284a' : t === T.DIRT ? '#705269' : q > .5 ? '#51405b' : '#47364f');
    if (zk === 'A' && t === T.GRASS) col = hexI(q > .6 ? '#77966a' : '#6b895f');
    /* bordas */
    const up = at(lx, ly - 1), dn = at(lx, ly + 1), lf = at(lx - 1, ly), rt = at(lx + 1, ly);
    if (t === T.WATER) {
      const near = (d) => [at(lx, ly - d), at(lx, ly + d), at(lx - d, ly), at(lx + d, ly)].some(v => v !== T.WATER && v !== T.BRIDGE);
      if (near(1)) col = C.w4; else if (near(2) || near(3)) col = C.w3;
    } else if (t === T.DIRT && [up, dn, lf, rt].some(v => v !== T.DIRT && v !== T.BRIDGE && v !== T.FLOOR)) col = C.d1;
    else if (t === T.SAND && [up, dn, lf, rt].some(v => v === T.WATER)) col = C.sa0;
    else if (t === T.CLIFF) {
      let face = 0; for (let k = 1; k <= 12; k++) if (at(lx, ly + k) !== T.CLIFF) { face = k; break; }
      if (face) col = face === 1 ? C.c0 : ((px % 5 === 0) ? C.c0 : (face < 6 ? C.c1 : C.c2));
      else if (up !== T.CLIFF || lf !== T.CLIFF || rt !== T.CLIFF) col = C.c5;
    } else if (!isForest(t) && t !== T.WATER) {
      /* sombra ao pé de penhascos */
      if (up === T.CLIFF || at(lx, ly - 2) === T.CLIFF || at(lx, ly - 3) === T.CLIFF) col = darkI(col);
    }
    buf[y * CH + x] = col;
  }
  g.putImageData(img, 0, 0);
  /* copa da floresta: pinheiros em grade intercalada */
  const SX = 8, SY = 6;
  const j0 = Math.floor((Y0 - 2) / SY), j1 = Math.ceil((Y0 + W + 12) / SY);
  for (let j = j0; j <= j1; j++) {
    const off = (j & 1) ? 4 : 0, i0 = Math.floor((X0 - 12) / SX), i1 = Math.ceil((X0 + W + 12) / SX);
    for (let i = i0; i <= i1; i++) {
      const ax = i * SX + off + Math.floor(hn(i, j, 51) * 3) - 1, ay = j * SY + Math.floor(hn(i, j, 52) * 3) - 1;
      const t = pickT(ax, ay); if (!isForest(t)) continue;
      const below = pickT(ax, ay + 9), dx = ax - cx * CH, dy = ay - cy * CH;
      if (!isForest(below)) {
        g.fillStyle = 'rgba(10,30,15,.35)'; g.fillRect(dx - 4, dy + 3, 9, 2);
        g.fillStyle = '#5a3d2b'; g.fillRect(dx - 1, dy, 2, 4); g.fillStyle = '#3a2618'; g.fillRect(dx, dy, 1, 4);
      }
      g.drawImage(PINES[t][hn(i, j, 53) > .5 ? 1 : 0], dx - 5, dy - 9);
    }
  }
  return cv;
}
function darkI(c) {
  const r = (c & 255) * .78, gg = ((c >> 8) & 255) * .8, b = ((c >> 16) & 255) * .86;
  return 0xff000000 | (Math.round(b) << 16) | (Math.round(gg) << 8) | Math.round(r);
}
/* ===== Cenários de batalha (192x120) ===== */

const vn1 = (x, seed) => { const xi = Math.floor(x), f = x - xi, s = f * f * (3 - 2 * f); return hn(xi, seed, 5) * (1 - s) + hn(xi + 1, seed, 5) * s; };
/* ---------- Cenários de batalha ---------- */
const GROUND_Y = 80;
function skyGrad(pb, y0, y1, stops) {
  const sc = pb.s;
  for (let Y = y0 * sc; Y < y1 * sc; Y++) for (let X = 0; X < pb.W; X++) {
    const t = (Y / sc - y0) / (y1 - y0) * (stops.length - 1) + bay(X, Y) * .55, i = clampN(Math.round(t), 0, stops.length - 1); pb.sf(X, Y, stops[i]);
  }
}
function ridge(pb, baseY, hf, ramp, o = {}) {
  const sc = pb.s;
  for (let X = 0; X < pb.W; X++) {
    const x = X / sc, h = hf(x), top = baseY - h, slope = (hf(x + 2) - hf(x - 2)) / 4 + (vn(x / 3, 7) - .5) * .5, T0 = Math.max(0, Math.round(top * sc));
    for (let Y = T0; Y < pb.H; Y++) {
      const d = Y / sc - top; let idx = Math.round(2.9 - d / (o.fade || 14) + (slope > .3 ? .8 : slope < -.3 ? -.5 : .2) + bay(X, Y) * .7);
      if (o.snow && h > o.snow && d < (h - o.snow) * .8 + 1) pb.sf(X, Y, o.snowRamp[clampN(Math.round(2 + (slope > .3 ? 1 : -.6) + bay(X, Y) * .6), 0, o.snowRamp.length - 1)]);
      else pb.sf(X, Y, ramp[clampN(idx, 0, ramp.length - 1)]);
    }
  }
}
function cloud(pb, cx, cy, w, ramp) {
  const parts = [[cx, cy, w * .5, w * .17], [cx - w * .2, cy - w * .1, w * .2, w * .15], [cx + w * .1, cy - w * .14, w * .26, w * .2]];
  fill(pb, (x, y) => parts.some(([a, b, c, d]) => ellT(a, b, c, d)(x, y)), ramp, [cx, cy - w * .05, w * .5, w * .3], { dith: .5, bias: 1 });
}
function pine(pb, x, base, h, w, ramp) {
  for (let i = 0; i < 3; i++) { const top = base - h + i * h * .27, bot = base - h * (.62 - i * .3), hw = w * (.45 + i * .27); PL(pb, [[x, top], [x + hw, bot], [x - hw, bot]], ramp, { edge: i === 2 ? olOf('#2a5a30') : null, dith: .3 }); }
  R(pb, x - .6, base - h * .15, 1.4, h * .17, rampOf('#5a3d2b'));
}
function roundTree(pb, x, base, r, ramp) { R(pb, x - 1, base - r, 2, r, rampOf('#5a3d2b')); E(pb, x, base - r - r * .6, r, r * .9, ramp, { edge: olOf('#2f7a3b'), noise: true }); }
function ground(pb, ramp, o = {}) {
  const sc = pb.s, G = GROUND_Y * sc;
  for (let Y = G; Y < pb.H; Y++) for (let X = 0; X < pb.W; X++) {
    const x = X / sc, y = Y / sc, depth = (y - GROUND_Y) / (pb.h - GROUND_Y), n = vn(x / 7, y / 3) * .7 + vn(x / 2.2, y / 1.3) * .3;
    let idx = Math.round(3.1 - depth * 1.9 + (n - .5) * 1.6 + bay(X, Y) * .6);
    pb.sf(X, Y, ramp[clampN(idx, 0, ramp.length - 1)]);
  }
  for (let Y = G + 3; Y < pb.H; Y++) for (let X = 0; X < pb.W; X++) {
    const q = hn(X, Y, 31), depth = (Y / sc - GROUND_Y) / (pb.h - GROUND_Y), L = Math.round(sc * (1 + depth * 1.6));
    if (q > .985 - depth * .012 && o.blades !== false) { for (let k = 0; k < L; k++) pb.sf(X + (k > L / 2 && q > .992 ? 1 : 0), Y - k, k === 0 ? ramp[0] : k < L - 1 ? ramp[3] : ramp[4]); }
    else if (o.speck && q < o.speck / 3) { const c = o.speckCol[Math.floor(hn(X, Y, 33) * o.speckCol.length)], z = Math.max(1, Math.round(sc * .6)); for (let j = 0; j < z; j++) for (let i = 0; i < z; i++) pb.sf(X + i, Y + j, c); }
  }
  for (let X = 0; X < pb.W; X++) for (let k = 0; k < Math.max(1, sc >> 1); k++) pb.sf(X, G + k, ramp[0]);
}
const stoneRamp = rampOf('#6d6a7e');
function stalactite(pb, x, w, h, ramp) { PL(pb, [[x - w, -1], [x + w, -1], [x + w * .3, h * .7], [x, h], [x - w * .3, h * .7]], ramp, { dith: .5 }); }
function crystal(pb, x, y, h, ramp, glow) {
  PL(pb, [[x - 2, y], [x - 1.5, y - h * .7], [x, y - h], [x + 1.5, y - h * .7], [x + 2, y]], ramp, { edge: olOf(glow), dith: .2 });
  PL(pb, [[x + 2, y], [x + 4, y - h * .5], [x + 5, y - h * .35], [x + 6, y]], ramp, { edge: olOf(glow), dith: .2 });
  PL(pb, [[x - 2, y], [x - 4, y - h * .4], [x - 5, y]], ramp, { edge: olOf(glow), dith: .2 });
}

const BIOME = {
  grass(pb) {
    skyGrad(pb, 0, 84, ['#5aaee8', '#79c3ee', '#9fd4f3', '#c2e5f8', '#e1f2fb']);
    disc2(pb, 150, 22, 9, ['#ffd86a', '#fff0a8', '#fffbe0']);
    cloud(pb, 40, 20, 30, ['#9fb4d8', '#c5d6ee', '#eaf2fb', '#fff']); cloud(pb, 105, 34, 24, ['#9fb4d8', '#c5d6ee', '#eaf2fb', '#fff']); cloud(pb, 175, 46, 18, ['#9fb4d8', '#c5d6ee', '#eaf2fb', '#fff']);
    ridge(pb, 70, x => 20 + 14 * Math.sin(x / 31 + 1) + 9 * Math.sin(x / 13) + 6 * vn1(x / 5, 2), rampOf('#7a96c8'), { snow: 29, snowRamp: ['#b8c8e8', '#dfe8f8', '#fff'], fade: 20 });
    ridge(pb, 84, x => 12 + 7 * Math.sin(x / 24 + 3) + 4 * Math.sin(x / 9), rampOf('#4a964d'), { fade: 10 });
    for (let x = 4; x < 192; x += 11 + Math.floor(hn(x, 1, 2) * 8)) roundTree(pb, x, 76 + Math.round(3 * Math.sin(x / 24 + 3)), 4 + Math.floor(hn(x, 2, 3) * 3), rampOf('#3f8a45'));
    ground(pb, rampOf('#58a54c'), { speck: .02, speckCol: ['#ffd84a', '#f6efd2', '#ff8fb0', '#8fc8ff'] });
    E(pb, 100, 112, 70, 5, rampOf('#c9a96a'), { dith: .4, bias: -1 });
    return g => { for (const [x, y] of [[60, 10], [66, 14], [150, 40]]) { g.fillStyle = '#2a3a58'; g.fillRect(x, y, 2, 1); g.fillRect(x + 2, y - 1, 2, 1); g.fillRect(x + 4, y, 2, 1); } };
  },
  forest(pb) {
    skyGrad(pb, 0, 84, ['#1d4a3a', '#25594a', '#2f6a55', '#3a7a60', '#4a8a68']);
    ridge(pb, 82, x => 24 + 12 * Math.sin(x / 19) + 8 * vn1(x / 3, 4), rampOf('#1e5a36'), { fade: 18 });
    for (let x = 3; x < 192; x += 9 + Math.floor(hn(x, 4, 5) * 6)) pine(pb, x, 86, 20 + Math.floor(hn(x, 5, 6) * 10), 9, rampOf('#1f6a3a'));
    ground(pb, rampOf('#2f6a3b'), { speck: .02, speckCol: ['#c9792e', '#e8d6a0', '#ff5a5a'] });
    for (const [x, w] of [[6, 7], [186, 8]]) { R(pb, x - w / 2, -2, w, 112, rampOf('#5a3d2b'), { cyl: true, edge: '#2a1a10' }); }
    E(pb, 0, 8, 36, 17, rampOf('#17482a'), { edge: '#0e2a18', noise: true }); E(pb, 192, 8, 38, 17, rampOf('#17482a'), { edge: '#0e2a18', noise: true });
    return g => {
      g.fillStyle = 'rgba(255,245,170,.10)';
      for (const x of [48, 86, 126]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 10, 0); g.lineTo(x + 46, 88); g.lineTo(x + 22, 88); g.fill(); }
      g.fillStyle = '#fff9a0'; for (let i = 0; i < 14; i++) g.fillRect(Math.floor(hn(i, 1, 40) * 190), 60 + Math.floor(hn(i, 2, 40) * 50), 1, 1);
    };
  },
  swamp(pb) {
    skyGrad(pb, 0, 84, ['#3d4d46', '#4a5c52', '#586c5c', '#68806a', '#7a9474']);
    disc2(pb, 140, 28, 10, ['#a8b890', '#c5d2a8', '#e0e8c8']);
    ridge(pb, 80, x => 14 + 8 * Math.sin(x / 22) + 5 * vn1(x / 4, 6), rampOf('#3a4f40'), { fade: 12 });
    for (const [x, h] of [[24, 40], [74, 52], [160, 46]]) { R(pb, x - 1, 84 - h, 2.4, h, rampOf('#2a2a24')); LN(pb, x, 84 - h + 8, x - 8, 84 - h + 2, '#2a2a24', 1); LN(pb, x, 84 - h + 14, x + 8, 84 - h + 9, '#2a2a24', 1); LN(pb, x, 84 - h + 22, x - 6, 84 - h + 18, '#2a2a24', 1); }
    ground(pb, rampOf('#3a4a3a'), { speck: .01, speckCol: ['#9ab0a0'] });
    for (const [cx, cy, rx, ry] of [[118, 106, 24, 5], [34, 100, 18, 4], [170, 112, 20, 5]]) { E(pb, cx, cy, rx, ry, rampOf('#2f5f66'), { dith: .4, bias: 1 }); for (let i = 0; i < 4; i++) E(pb, cx - rx * .6 + i * rx * .4, cy, 2.2, 1.2, rampOf('#4a8a3a'), { edge: '#1c3a1c' }); }
    for (const x of [14, 58, 100, 176]) { for (let i = 0; i < 3; i++) R(pb, x + i * 2, 96 - i * 2, 1, 14 + i, ['#4f7a3a', '#6a9a48']); }
    return g => {
      for (const [y, a] of [[84, .10], [90, .14], [96, .12], [103, .08]]) { g.fillStyle = 'rgba(200,225,205,' + a + ')'; g.fillRect(0, y, 192, 5); }
      g.fillStyle = '#c8ffb0'; for (const [x, y] of [[44, 70], [96, 62], [150, 74], [180, 58]]) { g.fillRect(x, y, 2, 2); g.fillStyle = 'rgba(200,255,170,.25)'; g.fillRect(x - 1, y - 1, 4, 4); g.fillStyle = '#c8ffb0'; }
    };
  },
  cave(pb) {
    skyGrad(pb, 0, 84, ['#0b0714', '#120d1e', '#181226', '#20183a', '#2a2048']);
    ridge(pb, 84, x => 20 + 12 * Math.sin(x / 17 + 2) + 8 * vn1(x / 3, 8), rampOf('#2f2547'), { fade: 16 });
    for (let x = 6; x < 192; x += 13 + Math.floor(hn(x, 9, 2) * 9)) stalactite(pb, x, 3 + hn(x, 7, 3) * 3, 14 + hn(x, 8, 4) * 30, rampOf('#3a2f58'));
    ground(pb, rampOf('#3a3050'), { blades: false, speck: .03, speckCol: ['#4a4068', '#2a2240'] });
    crystal(pb, 24, 92, 24, ['#1a5a78', '#2f9ac0', '#59d0e8', '#a8f0ff', '#e0ffff'], '#59d0e8'); crystal(pb, 168, 90, 20, ['#6a1a68', '#b02ea0', '#e87ad8', '#ffb8f0', '#fff0fc'], '#e87ad8');
    crystal(pb, 98, 82, 10, ['#1a5a78', '#2f9ac0', '#59d0e8', '#a8f0ff', '#e0ffff'], '#59d0e8');
    for (const [x, y, w] of [[60, 100, 5], [140, 108, 7], [8, 112, 6]]) E(pb, x, y, w, w * .6, stoneRamp, { edge: '#1c1830', noise: true });
    for (const [x, y] of [[50, 98], [150, 104]]) { R(pb, x, y, 1, 3, ['#d8f0ff']); E(pb, x, y - 1, 2.4, 1.8, ['#5a2f8a', '#8a58c8', '#c8a0ff'], { edge: '#2a1450' }); }
    return g => {
      g.fillStyle = 'rgba(80,200,230,.10)'; g.beginPath(); g.arc(24, 80, 26, 0, 7); g.fill();
      g.fillStyle = 'rgba(230,110,210,.10)'; g.beginPath(); g.arc(168, 80, 24, 0, 7); g.fill();
      g.fillStyle = 'rgba(180,200,255,.08)'; g.beginPath(); g.moveTo(80, 0); g.lineTo(110, 0); g.lineTo(150, 86); g.lineTo(70, 86); g.fill();
    };
  },
  ruins(pb) {
    skyGrad(pb, 0, 84, ['#2c2748', '#3a3456', '#52467a', '#7a5a8a', '#c0806a']);
    disc2(pb, 40, 28, 12, ['#cfc6e0', '#e6dff0', '#fffaf0']);
    ridge(pb, 76, x => 14 + 9 * Math.sin(x / 26 + 5) + 5 * vn1(x / 4, 3), rampOf('#3a3558'), { fade: 14 });
    for (const [x, h, w] of [[128, 38, 8], [166, 26, 7], [92, 20, 6]]) { R(pb, x, 76 - h, w, h + 10, rampOf('#463f66'), { dith: .4 }); R(pb, x - 1, 76 - h - 2, w + 2, 3, rampOf('#463f66')); for (let i = 0; i < 3; i++) R(pb, x + 2, 76 - h + 6 + i * 9, 2, 3, ['#14102a']); }
    ground(pb, rampOf('#6a6278'), { blades: false, speck: .035, speckCol: ['#5a5268', '#7a7288', '#4a4258'] });
    for (let y = GROUND_Y + 6; y < 120; y += 9) for (let x = (y / 9 % 2) * 6; x < 192; x += 12) { R(pb, x, y, 11, 1, ['rgba(40,30,60,.5)']); R(pb, x + 11, y - 8, 1, 9, ['rgba(40,30,60,.35)']); }
    for (const [x, h] of [[12, 62], [176, 54]]) { R(pb, x - 6, 98 - h, 12, h + 4, rampOf('#9c94ac'), { cyl: true, edge: '#2b2640' }); R(pb, x - 8, 96 - h, 16, 4, rampOf('#b4adc0'), { edge: '#2b2640' }); R(pb, x - 8, 98, 16, 4, rampOf('#b4adc0'), { edge: '#2b2640' }); }
    R(pb, 88, 102, 14, 6, rampOf('#807898'), { edge: '#2b2640', noise: true }); R(pb, 140, 108, 9, 5, rampOf('#807898'), { edge: '#2b2640', noise: true });
    return g => { for (const [y, a] of [[86, .10], [94, .08]]) { g.fillStyle = 'rgba(210,190,240,' + a + ')'; g.fillRect(0, y, 192, 6); } g.fillStyle = 'rgba(190,150,255,.5)'; for (const [x, y] of [[30, 70], [110, 60], [150, 76]]) g.fillRect(x, y, 2, 2); };
  },
  tower(pb) {
    skyGrad(pb, 0, 84, ['#0a0420', '#12082e', '#1c0c44', '#2a1262', '#401a7a']);
    for (let i = 0; i < 160; i++) { const X = Math.floor(hn(i, 1, 50) * pb.W), Y = Math.floor(hn(i, 2, 50) * 56 * pb.s); pb.sf(X, Y, i % 5 ? '#8c78d0' : '#f2e6ff'); if (i % 7 === 0) { pb.sf(X + 1, Y, '#f2e6ff'); pb.sf(X, Y + 1, '#f2e6ff'); } }
    disc2(pb, 96, 30, 20, ['#f5c451', '#f5c451']); disc2(pb, 96, 30, 16.5, ['#0a0618', '#0a0618']);
    for (const [x, y, w] of [[150, 38, 14], [20, 22, 9], [174, 66, 11]]) { E(pb, x, y, w, 3, rampOf('#5a4a86'), { edge: '#14082a' }); PL(pb, [[x - w + 2, y + 1], [x + w - 2, y + 1], [x + 2, y + w * .7], [x - 2, y + w * .7]], rampOf('#3a2d60'), { edge: '#14082a' }); }
    ridge(pb, 84, x => 12 + 8 * Math.sin(x / 20 + 1) + 4 * vn1(x / 3, 7), rampOf('#2a1c4e'), { fade: 12 });
    ground(pb, rampOf('#3a2f5a'), { blades: false, speck: .03, speckCol: ['#4a3d70', '#2a2246'] });
    for (let i = 0; i < 6; i++) { const x = 14 + i * 32 + hn(i, 3, 3) * 10; LN(pb, x, 86, x + 8, 100, '#b98af5', 1); LN(pb, x + 8, 100, x + 2, 116, '#b98af5', 1); }
    return g => {
      const gr = g.createRadialGradient(96, 30, 12, 96, 30, 38); gr.addColorStop(0, 'rgba(245,196,81,0)'); gr.addColorStop(.42, 'rgba(245,196,81,0)'); gr.addColorStop(.5, 'rgba(245,196,81,.3)'); gr.addColorStop(1, 'rgba(245,196,81,0)');
      g.fillStyle = gr; g.fillRect(40, 0, 112, 70);
      g.strokeStyle = 'rgba(245,196,81,.16)'; g.lineWidth = 1; for (let a = 0; a < 12; a++) { g.beginPath(); g.moveTo(96 + Math.cos(a / 12 * 6.28) * 28, 30 + Math.sin(a / 12 * 6.28) * 28); g.lineTo(96 + Math.cos(a / 12 * 6.28) * 44, 30 + Math.sin(a / 12 * 6.28) * 44); g.stroke(); }
      g.fillStyle = 'rgba(185,138,245,.10)'; g.fillRect(0, 84, 192, 10);
    };
  },
  arena(pb) {
    skyGrad(pb, 0, 30, ['#6ab4ea', '#8cc8f0', '#b4dcf6', '#e8e0c0']);
    R(pb, 0, 22, 192, 58, rampOf('#a8814e'), { dith: .3 });
    const SK = ['#f8d6b4', '#eeb893', '#d38f72', '#a8604e', '#7a4a38'], CL = ['#c0453a', '#3f5fd8', '#f5c451', '#3a8f6a', '#f2f2f2', '#8a4fd0', '#e8803a'], HR = ['#2a1a10', '#5a3d2b', '#c9a050', '#8a8a96', '#a83a2a'];
    for (let row = 0; row < 4; row++) {
      const y0 = 26 + row * 10, dk = 1 - row * .0;
      R(pb, 0, y0 + 8, 192, 2, rampOf('#7a5a34'));
      for (let x = (row % 2) * 3; x < 192; x += 6) {
        const k = hn(x, row, 80); if (k < .12) continue;
        const sk = SK[Math.floor(hn(x, row, 81) * 5)], cl = CL[Math.floor(hn(x, row, 82) * 7)], hr = HR[Math.floor(hn(x, row, 83) * 5)];
        const arms = hn(x, row, 84) > .72 ? 1 : 0, yy = y0 + 1 - arms;
        R(pb, x, yy + 3, 4, 5 + arms, [mixHex(cl, '#2a1a10', .35), cl, cl]);
        R(pb, x, yy, 4, 3, [sk]); R(pb, x, yy - 1, 4, 2, [hr]);
        if (arms) { D(pb, x - 1, yy + 1, sk); D(pb, x + 4, yy + 1, sk); }
      }
    }
    for (let x = 16; x < 192; x += 48) { R(pb, x, 18, 3, 62, rampOf('#c9a56c'), { cyl: true, edge: '#5a3d1e' }); }
    for (let x = 8; x < 192; x += 48) {
      const c = rampOf(['#c0453a', '#3f5fd8'][((x - 8) / 48) % 2]);
      PL(pb, [[x, 24], [x + 12, 24], [x + 12, 50], [x + 6, 45], [x, 50]], c, { edge: '#2a1a10', dith: .3 }); R(pb, x, 24, 12, 2, GOLD); E(pb, x + 6, 34, 2.4, 2.4, GOLD, { edge: '#8a5a10' });
    }
    R(pb, 0, 16, 192, 6, rampOf('#d8b078'), { edge: '#5a3d1e' }); R(pb, 0, 74, 192, 6, rampOf('#7a5a34'), { edge: '#3a2412' });
    for (let x = 0; x < 192; x += 8) R(pb, x, 74, 1, 6, ['rgba(30,16,6,.5)']);
    ground(pb, rampOf('#d8b070'), { blades: false, speck: .04, speckCol: ['#c09858', '#e8c488', '#b08848'] });
    for (let i = 0; i < 8; i++) E(pb, 20 + hn(i, 1, 70) * 150, 96 + hn(i, 2, 70) * 20, 3, 1, ['rgba(120,80,30,.55)'], { dith: 0 });
    return null;
  },
};
function disc2(pb, cx, cy, r, ramp) { fill(pb, ellT(cx, cy, r, r), ramp, [cx, cy, r, r], { dith: .3 }); }
const BGC = {}, BG_S = 4;
function getBG(b) {
  if (BGC[b]) return BGC[b];
  const key = b === 'forest_dark' ? 'forest' : b;
  const pb = new PB(192, 120, BG_S), post = (BIOME[key] || BIOME.grass)(pb);
  const c = toCanvas(pb), g = c.getContext('2d'); g.save(); g.scale(BG_S, BG_S); if (post) post(g); g.restore();
  if (b === 'forest_dark') { g.fillStyle = 'rgba(30,10,50,.35)'; g.fillRect(0, 0, c.width, c.height); }
  BGC[b] = c; return c;
}
/* ===== Exploração: câmera, toque para andar, monstros e objetos no mapa ===== */
const cvW = $('#cv-world'), gW = cvW.getContext('2d');
const EX = { sc:2, vw:200, vh:400, cam:{ x:0, y:0 }, mons:[], clicks:[], decos:[], dbuck:new Map(), ents:[], fog:new Map(), fogSig:'', last:0, spawnT:0, bossT:0, tip:null, mark:null, warm:0 };
const H = { x:0, y:0, path:[], goal:null, flip:false, walking:false, wt:0, resume:null };
const SPEED = 124, MON_SPEED = 30;

/* ---------- Geometria ---------- */
const tileOf = (x, y) => [Math.floor(x / TILE), Math.floor(y / TILE)];
const zoneAtPx = (x, y) => { const [tx, ty] = tileOf(x, y); return ZGRID[clamp(ty, 0, WH - 1) * WW + clamp(tx, 0, WW - 1)]; };
const zoneLocked = zk => ZONES[zk] && ZONES[zk].minLv > S.lvl;
const rainNow = () => window.RAINMODE !== undefined ? !!window.RAINMODE : Math.floor(Date.now() / 360000) % 4 === 0;
const nightNow = () => { if (window.DAYMODE) return window.DAYMODE === 'night'; const m = new Date().getMinutes(); return m >= 25 && m < 45; };
function walkTile(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= WW || ty >= WH) return false;
  return WALKABLE[TMAP[ty * WW + tx]] === 1 && !zoneLocked(ZGRID[ty * WW + tx]);
}
const poiPx = p => ({ x:p.tx * TILE + 16, y:p.ty * TILE + 24 });
const safeSpot = (x, y) => POIS.some(p => (p.kind === 'town' || p.kind === 'origin') && Math.hypot(p.tx * TILE - x, p.ty * TILE - y) < 7 * TILE);

/* ---------- A* em tiles (8 direções, sem cortar quinas) ---------- */
function findPath(sx, sy, gx, gy) {
  if (!walkTile(gx, gy)) { const n = nearestWalk(gx, gy); if (!n) return null; [gx, gy] = n; }
  if (sx === gx && sy === gy) return [];
  const N = WW * WH, gS = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const heap = [], push = (i, f) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  const s = sy * WW + sx, goal = gy * WW + gx, hf = i => { const x = i % WW, y = (i / WW) | 0, dx = Math.abs(x - gx), dy = Math.abs(y - gy); return Math.max(dx, dy) + .41 * Math.min(dx, dy); };
  gS[s] = 0; push(s, hf(s)); let it = 0;
  while (heap.length && it++ < 20000) {
    const [, i] = pop(); if (i === goal) break; if (closed[i]) continue; closed[i] = 1;
    const x = i % WW, y = (i / WW) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (!walkTile(nx, ny)) continue;
      if (dx && dy && (!walkTile(x + dx, y) || !walkTile(x, y + dy))) continue;
      const j = ny * WW + nx, c = gS[i] + (dx && dy ? 1.414 : 1);
      if (c < gS[j]) { gS[j] = c; from[j] = i; push(j, c + hf(j)); }
    }
  }
  if (from[goal] < 0) return null;
  const pts = []; for (let i = goal; i !== s; i = from[i]) pts.push([(i % WW) * TILE + 16, ((i / WW) | 0) * TILE + 16]);
  pts.reverse();
  /* suavização: pula pontos com linha de visão livre */
  const out = []; let cx = H.x, cy = H.y, k = 0;
  while (k < pts.length) { let far = k; for (let m = pts.length - 1; m > k; m--) if (lineClear(cx, cy, pts[m][0], pts[m][1])) { far = m; break; } out.push(pts[far]); [cx, cy] = pts[far]; k = far + 1; }
  return out;
}
function lineClear(x0, y0, x1, y1) {
  const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 6);
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (const [ox, oy] of [[-8, -6], [8, -6], [-8, 6], [8, 6]]) { const [tx, ty] = tileOf(x + ox, y + oy); if (!walkTile(tx, ty)) return false; } }
  return true;
}
function nearestWalk(tx, ty) {
  for (let r = 1; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r && walkTile(tx + dx, ty + dy)) return [tx + dx, ty + dy];
  return null;
}
function walkTo(x, y, goal) {
  const [sx, sy] = tileOf(H.x, H.y), [gx, gy] = tileOf(x, y), p = findPath(sx, sy, gx, gy);
  if (!p) { toast('Não dá para chegar lá.'); return false; }
  if (!p.length) p.push(walkTile(...tileOf(x, y)) ? [x, y] : [H.x, H.y]);
  H.path = p; if (!goal && p.length) { const last = p[p.length - 1]; if (walkTile(...tileOf(x, y))) { p[p.length - 1] = [x, y]; } EX.mark = { x:p[p.length - 1][0], y:p[p.length - 1][1], t:performance.now() }; }
  H.goal = goal || { type:'move', x, y }; H.resume = null; updateLeft(); return true;
}

/* ---------- Construção do mundo ---------- */
function buildEntities() {
  EX.decos = []; EX.dbuck.clear();
  const near = (tx, ty, r) => POIS.some(p => Math.abs(p.tx - tx) <= r && Math.abs(p.ty - ty) <= r);
  for (let ty = 1; ty < WH - 1; ty++) for (let tx = 1; tx < WW - 1; tx++) {
    const t = TMAP[ty * WW + tx], h = hn(tx, ty, 61), z = ZGRID[ty * WW + tx];
    if (near(tx, ty, 3)) continue;
    let k = null;
    if (t === T.GRASS) {
      const nearF = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1]].some(([dx, dy]) => isForest(tAt(tx + dx, ty + dy)));
      if (h < .022) k = 'bush'; else if (h < .032) k = z === 'S' ? 'bush' : 'berry'; else if (h < .04) k = 'rock'; else if (h < .045) k = 'stump'; else if (nearF && h < .12) k = 'pine';
      if (z === 'S' && k === 'pine' && h < .07) k = 'deadtree';
    } else if (t === T.SWAMP) { if (h < .07) k = 'reeds'; else if (h < .085) k = 'deadtree'; }
    else if (t === T.ROCKY) { if (h < .05) k = 'rock'; else if (h < .06) k = 'stones'; }
    else if (t === T.DIRT && h < .01) k = 'rock';
    if (!k) continue;
    const d = { k, x:tx * TILE + 6 + Math.floor(hn(tx, ty, 62) * 20), y:ty * TILE + 12 + Math.floor(hn(tx, ty, 63) * 16), flip:hn(tx, ty, 64) > .5 };
    EX.decos.push(d); const key = Math.floor(d.x / CH) + ',' + Math.floor(d.y / CH);
    if (!EX.dbuck.has(key)) EX.dbuck.set(key, []); EX.dbuck.get(key).push(d);
  }
  buildPoiEnts();
}
function buildPoiEnts() {
  EX.ents = [];
  for (const p of POIS) {
    const c = poiPx(p);
    if (p.kind === 'town') { for (const [dx, dy, k] of p.houses) EX.ents.push({ k, x:c.x + dx * TILE, y:c.y + dy * TILE, poi:p }); EX.ents.push({ k:'fire', x:c.x + 4, y:c.y + 30, poi:p, anim:true }); }
    else if (p.kind === 'origin') {
      EX.ents.push({ k:'sign', x:c.x - 40, y:c.y + 22, poi:p }); EX.ents.push({ k:'plot', x:c.x + 10, y:c.y + 40, poi:p });
      const b = S.town, spots = { loja:[-1, -1, 'house_red'], casa:[1, -2, 'house_blue'], bestiario:[2, 0, 'hut'], ferreiro:[-2, 1, 'hut'], prefeitura:[0, -3, 'house_red'] };
      let any = false; for (const k in spots) if (b[k] > 0) { any = true; const [dx, dy, s] = spots[k]; EX.ents.push({ k:s, x:c.x + dx * TILE, y:c.y + dy * TILE, poi:p }); }
      if (!any) EX.ents.push({ k:'logs', x:c.x + 4, y:c.y, poi:p });
      EX.ents.push({ k:'fire', x:c.x + 18, y:c.y + 26, poi:p, anim:true });
    }
    else if (p.kind === 'waygate') EX.ents.push({ k:'waygate', x:c.x, y:c.y + 4, poi:p });
    else EX.ents.push({ k:p.spr, x:c.x, y:c.y + 8, poi:p });
  }
}

/* ---------- Monstros, objetos clicáveis, chefes ---------- */
let MID = 1;
function randomSpotInZone(zk, minD, maxD) {
  for (let i = 0; i < 40; i++) {
    let tx, ty;
    if (minD) { const a = Math.random() * 6.283, d = rnd(minD, maxD); tx = Math.floor((H.x + Math.cos(a) * d) / TILE); ty = Math.floor((H.y + Math.sin(a) * d) / TILE); }
    else { tx = ri(1, WW - 2); ty = ri(1, WH - 2); }
    if (!walkTile(tx, ty)) continue; const t = TMAP[ty * WW + tx]; if (t === T.DIRT || t === T.BRIDGE) continue;
    const z = ZGRID[ty * WW + tx]; if (zk && z !== zk) continue; if (z === '~') continue;
    const x = tx * TILE + 16, y = ty * TILE + 20; if (safeSpot(x, y)) continue;
    return { x, y, z };
  }
  return null;
}
function spawnMon(spot, key, boss) {
  const Z = ZONES[spot.z], near = clamp(S.lvl, Z.lv[0], Z.lv[1]), lv = boss ? clamp(near + 3, Z.lv[0], Z.lv[1]) : ri(Math.max(Z.lv[0], near - 3), Math.min(Z.lv[1], near + 2));
  const m = { id:MID++, key, lv, x:spot.x, y:spot.y, hx:spot.x, hy:spot.y, z:spot.z, boss:!!boss, tx:spot.x, ty:spot.y, t:rnd(0, 2), flip:Math.random() < .5, ph:Math.random() * 6 };
  EX.mons.push(m); return m;
}
function popTick(dt) {
  EX.spawnT -= dt; if (EX.spawnT > 0) return; EX.spawnT = .8;
  const R = 22 * TILE, night = nightNow();
  EX.mons = EX.mons.filter(m => m.boss || Math.hypot(m.x - H.x, m.y - H.y) < R * 1.4);
  const near = EX.mons.filter(m => !m.boss && Math.hypot(m.x - H.x, m.y - H.y) < R).length;
  if (near < 12) {
    const sp = randomSpotInZone(null, 7 * TILE, R); if (sp) {
      const Z = ZONES[sp.z]; const list = Z.spawn.concat(night ? Z.night : [], []);
      if (list.length) spawnMon(sp, wpick(list));
    }
  }
  /* chefes: uma vaga por zona, aparecem ao acaso */
  EX.bossT -= .8;
  if (EX.bossT <= 0) {
    EX.bossT = 20;
    for (const zk in ZONES) { const Z = ZONES[zk]; if (!Z.boss || zoneLocked(zk)) continue; if (EX.mons.some(m => m.boss && m.z === zk)) continue; if (Math.random() < .35) { const sp = randomSpotInZone(zk); if (sp) spawnMon(sp, Z.boss, true); } }
  }
  /* clicáveis: 4 por zona liberada */
  for (const zk in ZONES) {
    if (zk === '~' || zoneLocked(zk)) continue;
    if (EX.clicks.filter(c => c.z === zk).length < 4) { const sp = randomSpotInZone(zk); if (sp) EX.clicks.push({ id:MID++, z:zk, x:sp.x, y:sp.y, k:wpick([['tree', 4], ['stones', 3], ['chest', 2], ['shrine', 1]]) }); }
  }
}
function monTick(m, dt) {
  if (H.goal && H.goal.type === 'mon' && H.goal.m === m) return;
  m.t -= dt;
  const dx = m.tx - m.x, dy = m.ty - m.y, d = Math.hypot(dx, dy);
  if (d > 1) { const s = Math.min(d, MON_SPEED * dt * (m.boss ? .7 : 1)); m.x += dx / d * s; m.y += dy / d * s; m.flip = dx < 0; m.moving = true; }
  else { m.moving = false; if (m.t <= 0) { m.t = rnd(1.5, 4); const a = Math.random() * 6.283, r = rnd(16, 80), nx = m.hx + Math.cos(a) * r, ny = m.hy + Math.sin(a) * r; if (walkTile(...tileOf(nx, ny)) && lineClearM(m.x, m.y, nx, ny)) { m.tx = nx; m.ty = ny; } } }
}
function lineClearM(x0, y0, x1, y1) { const n = 6; for (let i = 1; i <= n; i++) if (!walkTile(...tileOf(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n))) return false; return true; }

/* ---------- Interação ---------- */
function screenToWorld(e) { const r = cvW.getBoundingClientRect(); return { x:(e.clientX - r.left) / r.width * EX.vw + EX.cam.x, y:(e.clientY - r.top) / r.height * EX.vh + EX.cam.y }; }
function onTapWorld(e) {
  if (busy || cur !== 'world' || !overlayClosed()) return;
  const p = screenToWorld(e);
  const m = EX.mons.filter(m => Math.abs(m.x - p.x) < 17 && p.y > m.y - 32 && p.y < m.y + 8).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
  if (m) { const keep = H.goal && H.goal.type === 'move' && H.path.length ? { ...H.goal } : null; if (walkTo(m.x, m.y, { type:'mon', m })) { H.resumeGoal = keep; } sfx.click(); return; }
  const [wtx, wty] = tileOf(p.x, p.y);
  if (TMAP[wty * WW + wtx] === T.WATER && !zoneLocked(ZGRID[wty * WW + wtx])) {
    if (Math.hypot(p.x - H.x, p.y - H.y) < 110) { startFishing(); return; }
    walkTo(p.x, p.y, { type:'fish' }); return;
  }
  const c = EX.clicks.find(c => Math.abs(c.x - p.x) < 16 && p.y > c.y - 30 && p.y < c.y + 6);
  if (c) { walkTo(c.x, c.y + 4, { type:'click', c }); sfx.click(); return; }
  const pe = EX.ents.find(en => { const s = spr(en.k), w = s.width, h = s.height; return p.x > en.x - w / 2 - 2 && p.x < en.x + w / 2 + 2 && p.y > en.y - h - 2 && p.y < en.y + 3; });
  if (pe && pe.poi) { goPoi(pe.poi); sfx.click(); return; }
  walkTo(p.x, p.y);
}
function goPoi(p) { const c = poiPx(p); walkTo(c.x, c.y + (p.kind === 'waygate' ? 26 : 36), { type:'poi', p }); }
function arrive() {
  const gl = H.goal; if (!gl) return;
  if (gl.type === 'click') { const c = gl.c; H.goal = null; if (EX.clicks.includes(c) && Math.hypot(c.x - H.x, c.y - H.y) < 44) collect(c); }
  else if (gl.type === 'poi') { H.goal = null; }
  else if (gl.type === 'fish') { H.goal = null; EX.mark = null; startFishing(); }
  else if (gl.type === 'move') { H.goal = null; EX.mark = null; }
}
function collect(c) {
  EX.clicks = EX.clicks.filter(x => x !== c); const st = ZONES[c.z].stars; let msg;
  if (c.k === 'tree') { const n = ri(2, 4) + st; addItem('madeira', n); msg = '+' + n + ' Madeira'; }
  else if (c.k === 'stones') { const n = ri(1, 2) + Math.floor(st / 2); addItem('pedra', n); msg = '+' + n + ' Pedra'; }
  else if (c.k === 'chest') {
    const g = Math.round(rnd(12, 30) * st * st * (buffOn('gold2') ? 2 : 1)); S.gold += g; msg = '+' + g + ' ouro';
    if (Math.random() < .35) { addItem(st >= 2 ? 'pocao' : 'pocao_p'); msg += ', uma poção'; }
    if (Math.random() < .25 && !bagFull()) { const it = genGear(st, null, null, .05); addGear(it); msg += ', ' + it.name; }
    if (Math.random() < .3) { const n = ri(1, 3); addItem('pedra', n); msg += ', ' + n + ' Pedra'; }
  } else { const k = Math.random() < .5 ? 'xp2' : 'gold2'; S.buffs[k] = Date.now() + 10 * 60 * 1000; msg = k === 'xp2' ? 'Santuário da Sabedoria: XP em dobro por 10 min' : 'Santuário da Sorte: ouro em dobro por 10 min'; }
  sfx.coin(); pop(c.x, c.y - 30, msg); updateHUD(); save();
}
const POPS = [];
function pop(x, y, txt) { POPS.push({ x, y, txt, t0:performance.now() }); }

/* ---------- Laço da exploração ---------- */
function exTick(now) {
  const dt = Math.min(.05, (now - (EX.last || now)) / 1000); EX.last = now;
  if (cur !== 'world' || !S) return;
  if (!busy && overlayClosed()) {
    /* movimento do herói */
    if (H.goal && H.goal.type === 'mon') {
      const m = H.goal.m; if (!EX.mons.includes(m)) { H.goal = null; H.path = []; }
      else if (Math.hypot(m.x - H.x, m.y - H.y) < 26) { H.path = []; startMapBattle(m); return; }
      else { H.repath = (H.repath || 0) - dt; if (H.repath <= 0) { H.repath = .5; const [sx, sy] = tileOf(H.x, H.y), p = findPath(sx, sy, ...tileOf(m.x, m.y)); if (p) { H.path = p; H.path.push([m.x, m.y]); } } }
    }
    if (H.path.length) {
      const [tx, ty] = H.path[0], dx = tx - H.x, dy = ty - H.y, d = Math.hypot(dx, dy), s = SPEED * (S.buffs?.astralSpeed > Date.now() ? 1.25 : 1) * dt;
      if (d <= s) { H.x = tx; H.y = ty; H.path.shift(); if (!H.path.length) arrive(); }
      else { H.x += dx / d * s; H.y += dy / d * s; }
      if (Math.abs(dx) > .5) H.flip = dx < 0; H.walking = true; H.wt += dt;
      if ((H.st = (H.st || 0) + dt) > .32) { H.st = 0; sfx.step(); }
    } else H.walking = false;
    for (const m of EX.mons) monTick(m, dt);
    popTick(dt);
  }
  /* câmera */
  EX.cam.x = Math.round(clamp(H.x - EX.vw / 2, 0, WW * TILE - EX.vw)); EX.cam.y = Math.round(clamp(H.y - EX.vh / 2 - 12, 0, WH * TILE - EX.vh));
  drawWorld(now); updateTip(); updateZone();
  /* pré-pinta um bloco por quadro perto da câmera */
  const ccx = Math.floor((H.x) / CH), ccy = Math.floor(H.y / CH);
  outer: for (let r = 0; r <= 2; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = ccx + dx, y = ccy + dy; if (x < 0 || y < 0 || x * CH >= WW * TILE || y * CH >= WH * TILE) continue; if (!CHUNKS.has(x + ',' + y)) { chunkCanvas(x, y); break outer; } }
}
function drawWorld(now) {
  const g = gW, cx = EX.cam.x, cy = EX.cam.y; g.imageSmoothingEnabled = false;
  g.fillStyle = '#0b0a12'; g.fillRect(0, 0, EX.vw, EX.vh);
  const c0 = Math.floor(cx / CH), c1 = Math.floor((cx + EX.vw) / CH), r0 = Math.floor(cy / CH), r1 = Math.floor((cy + EX.vh) / CH);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) { if (c < 0 || r < 0 || c * CH >= WW * TILE || r * CH >= WH * TILE) continue; g.drawImage(chunkCanvas(c, r), c * CH - cx, r * CH - cy); }
  /* marcador de destino */
  if (EX.mark && H.path.length) { const k = Math.floor(now / 150) % 2, x = Math.round(EX.mark.x - cx), y = Math.round(EX.mark.y - cy); g.fillStyle = '#fff3a0'; g.fillRect(x - 3 - k, y, 2, 1); g.fillRect(x + 2 + k, y, 2, 1); g.fillRect(x, y - 3 - k, 1, 2); g.fillRect(x, y + 2 + k, 1, 2); }
  /* entidades ordenadas por y */
  const list = [], inView = (x, y, m = 24) => x > cx - m && x < cx + EX.vw + m && y > cy - m && y < cy + EX.vh + m * 2;
  for (let r = r0 - 1; r <= r1 + 1; r++) for (let c = c0 - 1; c <= c1 + 1; c++) { const b = EX.dbuck.get(c + ',' + r); if (b) for (const d of b) if (inView(d.x, d.y)) list.push(d); }
  for (const e of EX.ents) if (inView(e.x, e.y, 40)) list.push(e);
  for (const c of EX.clicks) if (inView(c.x, c.y)) list.push({ ...c, click:true, k:c.k });
  for (const m of EX.mons) if (inView(m.x, m.y)) list.push({ mon:m, y:m.y, x:m.x });
  list.push({ hero:true, x:H.x, y:H.y });
  list.sort((a, b) => a.y - b.y);
  for (const e of list) {
    if (e.hero) drawChar(g, heroSpr(!H.flip), H.x - cx, H.y - cy, H.walking ? (Math.floor(H.wt * 8) % 2) * 2 : 0, false);
    else if (e.mon) { const m = e.mon, s = monSpr(m.key, Catalog.byKey[m.key] ? !m.flip : m.flip); if (m.boss) drawAura(g, m.x - cx, m.y - cy, now); drawChar(g, s, m.x - cx, m.y - cy, m.moving ? (Math.floor(now / 140 + m.ph) % 2) * 2 : (Math.sin(now / 400 + m.ph) > .6 ? 1 : 0), false); if (m.boss) drawBossMark(g, m.x - cx, m.y - cy - 40, now); }
    else {
      const s = spr(e.k, null, e.flip), x = Math.round(e.x - cx - s.width / 2), y = Math.round(e.y - cy - s.height);
      if (e.click || e.k === 'pine' || e.k === 'stones' || e.k === 'rock' || e.k === 'bush' || e.k === 'berry') { g.fillStyle = 'rgba(10,25,10,.26)'; g.beginPath(); g.ellipse(x + s.width / 2, y + s.height - 1, s.width * .42, 3, 0, 0, 7); g.fill(); }
      if (e.k === 'fire') { const f = Math.floor(now / 120) % 3; g.drawImage(s, x, y - (f === 1 ? 1 : 0)); }
      else g.drawImage(s, x, y);
      if (e.click) { const k = Math.floor(now / 90 + e.id) % 14; if (k < 3) { g.fillStyle = '#ffffff'; g.fillRect(x + s.width - 2, y - 2 + k, 1, 1); g.fillRect(x + s.width - 4, y + k, 5, 1); g.fillRect(x + s.width - 2, y - 1 + k, 1, 3); } }
    }
  }
  /* névoa das áreas bloqueadas */
  drawFog(g, cx, cy, c0, c1, r0, r1);
  /* noite */
  if (nightNow()) { g.globalCompositeOperation = 'multiply'; g.fillStyle = '#6170b0'; g.fillRect(0, 0, EX.vw, EX.vh); g.globalCompositeOperation = 'source-over'; drawLights(g, cx, cy, now); }
  if (rainNow()) {
    g.fillStyle = 'rgba(40,60,90,.18)'; g.fillRect(0, 0, EX.vw, EX.vh); g.fillStyle = 'rgba(200,220,255,.55)';
    for (let i = 0; i < 70; i++) { const sp = 140 + hn(i, 1, 90) * 80, x = Math.floor((hn(i, 2, 90) * (EX.vw + 60) + now / 1000 * sp * .35) % (EX.vw + 60)) - 30, y = Math.floor((hn(i, 3, 90) * EX.vh + now / 1000 * sp) % EX.vh); g.fillRect(x, y, 1, 4); g.fillRect(x - 1, y + 4, 1, 2); }
  }
  /* textos de coleta */
  g.font = '700 12px "Alegreya Sans", sans-serif'; g.textAlign = 'center';
  for (let i = POPS.length - 1; i >= 0; i--) { const p = POPS[i], t = (now - p.t0) / 1400; if (t > 1) { POPS.splice(i, 1); continue; } const y = Math.round(p.y - cy - t * 24), x = Math.round(p.x - cx); g.globalAlpha = t > .7 ? (1 - t) / .3 : 1; g.fillStyle = '#1a1220'; g.fillText(p.txt, x + 1, y + 1); g.fillStyle = '#fff3c8'; g.fillText(p.txt, x, y); g.globalAlpha = 1; }
}
function drawChar(g, s, x, y, hop) {
  const w = s.width, h = s.height, X = Math.round(x - w / 2), Y = Math.round(y - h - hop);
  g.fillStyle = 'rgba(10,20,10,.3)'; g.beginPath(); g.ellipse(Math.round(x), Math.round(y - 1), w * .3, 3, 0, 0, 7); g.fill();
  g.drawImage(s, X, Y);
}
function drawAura(g, x, y, now) {
  const r = 22 + Math.sin(now / 200) * 2; g.fillStyle = 'rgba(255,60,60,.25)'; g.beginPath(); g.ellipse(Math.round(x), Math.round(y - 1), r, r * .4, 0, 0, 7); g.fill();
}
function drawBossMark(g, x, y, now) { const b = Math.round(Math.sin(now / 160) * 2), X = Math.round(x); g.fillStyle = '#1a1220'; g.fillRect(X - 3, y - 10 + b, 7, 13); g.fillStyle = '#ff5a4a'; g.fillRect(X - 2, y - 9 + b, 5, 7); g.fillRect(X - 2, y - 1 + b, 5, 3); }
function drawLights(g, cx, cy, now) {
  g.globalCompositeOperation = 'lighter';
  { const x = H.x - cx, y = H.y - cy - 12, r = (EX.vis || 170) * .5, gr = g.createRadialGradient(x, y, 4, x, y, r); gr.addColorStop(0, 'rgba(255,225,170,.42)'); gr.addColorStop(.6, 'rgba(160,150,140,.16)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  for (const e of EX.ents) if (e.k === 'fire' || e.k === 'waygate') { const x = e.x - cx, y = e.y - cy - 8; if (x < -70 || y < -70 || x > EX.vw + 70 || y > EX.vh + 70) continue; const gr = g.createRadialGradient(x, y, 3, x, y, e.k === 'fire' ? 60 + Math.sin(now / 90) * 2 : 36); gr.addColorStop(0, e.k === 'fire' ? 'rgba(255,170,80,.45)' : 'rgba(90,170,255,.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - 70, y - 70, 140, 140); }
  g.globalCompositeOperation = 'source-over';
}
function drawFog(g, cx, cy, c0, c1, r0, r1) {
  const sig = Object.keys(ZONES).filter(zoneLocked).join('');
  if (sig !== EX.fogSig) { EX.fog.clear(); EX.fogSig = sig; }
  if (!sig) return;
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    if (c < 0 || r < 0 || c * CH >= WW * TILE || r * CH >= WH * TILE) continue;
    const key = c + ',' + r; let f = EX.fog.get(key);
    if (f === undefined) { f = fogChunk(c, r); EX.fog.set(key, f); }
    if (f) g.drawImage(f, 0, 0, 64, 64, c * CH - cx, r * CH - cy, CH, CH);
  }
}
function fogChunk(c, r) {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const g = cv.getContext('2d'); let any = false;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const px = c * CH + x * 4 + 2, py = r * CH + y * 4 + 2, wx = (vn(px / 46, py / 46) - .5) * 50, wy = (vn(px / 46 + 9, py / 46 + 4) - .5) * 50;
    const z = zoneAtPx(px + wx, py + wy); if (!zoneLocked(z)) continue;
    let edge = 0; for (const [dx, dy] of [[20, 0], [-20, 0], [0, 20], [0, -20]]) if (!zoneLocked(zoneAtPx(px + wx + dx, py + wy + dy))) edge++;
    if (edge && bay(x, y) + .5 < edge * .28) continue;
    g.fillStyle = edge ? '#100c18' : '#07060c'; g.fillRect(x, y, 1, 1); any = true;
  }
  return any ? cv : null;
}

/* ---------- Dica de entrada, zona, botões ---------- */
function nearPoi() {
  let best = null, bd = 1e9;
  for (const p of POIS) { const c = poiPx(p), d = Math.hypot(c.x - H.x, c.y + 24 - H.y); if (d < bd) { bd = d; best = p; } }
  return bd < 56 ? best : null;
}
const KIND_LBL = { town:'Cidade', origin:'Sua vila de origem', dungeon:'Masmorra', arena:'Arena', waygate:'Portal' };
function updateTip() {
  const p = H.path.length ? null : nearPoi(), tip = $('#tip');
  if (p && p.kind === 'waygate' && !S.way[p.id]) { S.way[p.id] = 1; toast('Portal descoberto: ' + p.n); save(); }
  if (!p || busy || !overlayClosed()) { tip.hidden = true; EX.tip = null; return; }
  if (EX.tip !== p) {
    EX.tip = p; tip.querySelector('.tip-k').innerHTML = icon(p.kind === 'town' || p.kind === 'origin' ? 'ic_home' : p.kind === 'waygate' ? 'ic_gate' : 'ic_codex', 16) + ' ' + KIND_LBL[p.kind];
    tip.querySelector('.tip-n').textContent = p.n; tip.querySelector('.tip-a').textContent = p.kind === 'waygate' ? 'Toque para viajar' : 'Toque para entrar';
  }
  const c = poiPx(p), s = EX.sc, x = (c.x - EX.cam.x) * s, y = (c.y - EX.cam.y - (p.kind === 'town' ? 70 : p.kind === 'arena' ? 48 : p.kind === 'dungeon' ? (p.spr === 'tower' ? 62 : 40) : 34)) * s;
  tip.style.left = clamp(x, 110, innerWidth - 110) + 'px'; tip.style.top = Math.max(90, y) + 'px'; tip.hidden = false;
}
let lastZone = '';
function updateZone() {
  const zk = zoneAtPx(H.x, H.y), Z = ZONES[zk]; if (!Z || zk === lastZone) return; lastZone = zk; S.regions = S.regions || {}; S.regions[zk] = true;
  $('#w-zone').textContent = Z.n; $('#w-stars').textContent = '★'.repeat(Z.stars) + '  ·  Nível ' + Z.lv[0] + '–' + Z.lv[1];
}
function updateLeft() {
  $('#btn-resume').hidden = !H.resume;
  $('#btn-home').classList.toggle('locked', S.lvl < 3); $('#btn-gates').classList.toggle('locked', S.lvl < 5);
}
function resizeWorld() {
  const w = innerWidth, h = innerHeight, sc = w >= 1100 ? 2 : 1; EX.sc = sc;
  EX.vw = Math.ceil(w / sc); EX.vh = Math.ceil(h / sc); cvW.width = EX.vw; cvW.height = EX.vh;
  cvW.style.width = EX.vw * sc + 'px'; cvW.style.height = EX.vh * sc + 'px';
}
addEventListener('resize', resizeWorld);

/* ---------- Relógio de dia e noite ---------- */
function drawDial() {
  const c = $('#cv-dial'), g = c.getContext('2d'), d = new Date(), m = d.getMinutes() + d.getSeconds() / 60, night = m >= 25 && m < 45;
  g.clearRect(0, 0, 28, 28);
  g.fillStyle = night ? '#1a2050' : '#7ec8f0'; g.beginPath(); g.arc(14, 14, 13, 0, 7); g.fill();
  if (!night) { g.fillStyle = '#c8ecff'; g.fillRect(4, 18, 9, 2); g.fillRect(7, 16, 5, 2); }
  else { g.fillStyle = '#c8c8ff'; for (const [x, y] of [[6, 8], [20, 6], [9, 19], [21, 17]]) g.fillRect(x, y, 1, 1); }
  /* posição do astro no arco */
  const frac = night ? (m - 25) / 20 : ((m >= 45 ? m - 45 : m + 15) / 40), a = Math.PI + frac * Math.PI, x = 14 + Math.cos(a) * 8, y = 15 + Math.sin(a) * 8;
  if (night) { g.fillStyle = '#f2f0d8'; g.beginPath(); g.arc(x, y, 3.2, 0, 7); g.fill(); g.fillStyle = '#1a2050'; g.beginPath(); g.arc(x + 1.5, y - 1, 2.6, 0, 7); g.fill(); }
  else { g.fillStyle = '#ffb02a'; g.beginPath(); g.arc(x, y, 3.6, 0, 7); g.fill(); g.fillStyle = '#ffe66a'; g.beginPath(); g.arc(x - .6, y - .6, 2.2, 0, 7); g.fill(); }
  g.strokeStyle = '#2a1e16'; g.lineWidth = 2; g.beginPath(); g.arc(14, 14, 13, 0, 7); g.stroke();
  const bf = []; if (rainNow()) bf.push('Chuva'); if (buffOn('xp2')) bf.push('XP×2'); if (buffOn('gold2')) bf.push('Ouro×2'); $('#w-buffs').textContent = bf.join(' · ');
}

/* ---------- Pesca ---------- */
function startFishing() {
  if (busy) return;
  if (!(S.inv.linha > 0)) { toast('Você precisa de uma Linha de Pesca. As lojas vendem.'); return; }
  openPanel('fish');
}
/* ===== Batalha por turnos ===== */
const cvB = $('#cv-battle'), gB = cvB.getContext('2d');
const BS = { W:384, H:300, k:2, fx:[], floats:[], bio:'grass', foes:[], hero:null, pet:null, target:false, active:false };
let B = null;
const RIVAL_NAMES = ['Brann', 'Ysolde', 'Kael', 'Mirra', 'Tovin', 'Sela', 'Dorian', 'Nadja', 'Orrin', 'Talia', 'Vesk', 'Lunara'];

function sizeBattle() {
  const st = $('#b-stage'), r = st.getBoundingClientRect(); if (!r.width) return;
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  BS.W = Math.round(r.width * dpr); BS.H = Math.round(r.height * dpr); cvB.width = BS.W; cvB.height = BS.H;
  let u = BS.H / 120; if (BS.W / u < 140) u = BS.W / 140;
  BS.u = u; BS.AW = BS.W / u; BS.AH = BS.H / u; BS.k = Math.max(1, Math.round(u * .95)); BS.dpr = dpr;
}
addEventListener('resize', () => { if (cur === 'battle') { sizeBattle(); layoutBattle(); } });

/* ---------- Combatentes ---------- */
function monStats(k, L) {
  const d = MON[k], m = d.m, base = { hp:40 + 16 * L, atk:6 + 3.6 * L, mag:5 + 3 * L, def:3 + 1.4 * L, res:3 + 1.4 * L, dex:4 + 1.6 * L }, st = {};
  for (const s in base) st[s] = Math.round(base[s] * (m[s] || 1));
  return st;
}
let FID = 1;
function makeFoe(k, L) {
  const d = MON[k], st = monStats(k, L);
  return { id:'f' + FID++, key:k, n:d.n, lv:L, boss:!!d.boss, ...st, maxhp:st.hp, st:{}, buf:{}, ward:0, spr:monMini(k, true), ox:0, oy:0, flash:0, alpha:1, charging:null, moves:d.moves, weak:d.weak || [], eres:d.res || [], immune:d.immune || [] };
}
function makeRival(L) {
  const k = pick(Object.keys(CLASSES).filter(c => CLASSES[c].tier <= Math.min(tierOfLv(L), topTier()))), c = CLASSES[k], b = baseStats(L), st = {};
  const P0 = BASE_P[tierOfLv(L)] * .95, main = c.m.mag > c.m.atk ? 'mag' : 'atk', add = { hp:P0 * 2.6, mp:0, atk:main === 'atk' ? P0 : P0 * .2, mag:main === 'mag' ? P0 : P0 * .2, def:P0 * 1.1, res:P0 * .6, dex:P0 * .3 };
  for (const s in b) st[s] = Math.round((b[s] * (c.m[s] || 1) + add[s]) * (s === 'hp' ? .85 : 1));
  const sk = Object.values(CLASSES).filter(x => x === c || (c.req || []).includes(Object.keys(CLASSES).find(q => CLASSES[q] === x))).flatMap(x => x.skills).filter(([lv]) => lv <= L).map(([, id]) => id);
  const f = { id:'f' + FID++, key:'rival', n:pick(RIVAL_NAMES) + ', ' + c.n, lv:L, boss:false, rival:true, cls:k, ...st, maxhp:st.hp, maxmp:st.mp, st:{}, buf:{}, ward:0,
    spr:classSpr(k, true), ox:0, oy:0, flash:0, alpha:1, charging:null, moves:[['pancada', 2]], skills:sk.length ? sk : ['golpe'], weak:[], eres:[], immune:[] };
  return f;
}
function heroFighter(mode) {
  const st = stats(setOfMode(mode)), fl = heroMini(false);
  return { id:'hero', n:S.name, hero:true, ...st, maxhp:st.hp, maxmp:st.mp, hp:S.hp, mp:S.mp, st:{}, buf:{}, ward:st.ward || 0, spr:fl, ox:0, oy:0, flash:0, alpha:1, weak:[], eres:[], immune:[] };
}
function petFighter() {
  if (S.pet < 0 || !S.pets[S.pet]) return null;
  const k = S.pets[S.pet].key, d = PETS[k], b = baseStats(S.lvl), mul = .55 * (S.spec === 'domador' ? 1.4 : 1), st = {};
  for (const s in b) st[s] = Math.round(b[s] * (d.m[s] || 1) * mul * (s === 'hp' ? 1.2 : 1));
  const f = { id:'pet', n:d.n, pet:true, key:k, ...st, maxhp:st.hp, st:{}, buf:{}, ward:0, spr:petMini(k, false), ox:0, oy:0, flash:0, alpha:1, moves:d.moves, weak:[], eres:[], immune:[] };
  f.hp = Math.max(0, Math.round(st.hp * (S.petHp === undefined ? 1 : S.petHp)));
  if (f.hp <= 0) f.alpha = .35;
  return f;
}

/* ---------- Posições ---------- */
function layoutBattle() {
  if (!B) return; const H = BS.AH, W = BS.AW, n = B.foes.length;
  const scale = f => { f.k = f.boss ? Math.round(BS.k * 1.5) : BS.k; f.sc = f.k / BS.u; f.hw = f.spr.width / 2 * f.sc; f.hh = f.spr.height * f.sc; };
  const slots = { 1:[[.72, -18]], 2:[[.62, -28], [.86, -12]], 3:[[.58, -32], [.87, -26], [.73, -10]] }[Math.min(3, n)] || [[.72, -18]];
  B.foes.forEach((f, i) => { const s = slots[i] || slots[0]; scale(f); f.x = clamp(Math.round(W * s[0]), W / 2 + f.hw - 4, W - f.hw - 1); f.y = H + s[1]; });
  scale(B.hero); B.hero.x = Math.max(W * .28, B.hero.hw + (B.pet ? 24 : 4)); B.hero.y = H - 14;
  if (B.pet) { scale(B.pet); B.pet.x = Math.max(W * .12, B.pet.hw + 2); B.pet.y = H - 6; }
}

/* ---------- Registro e comandos ---------- */
const logEl = $('#b-log'), cmdEl = $('#cmds');
function say(t, cls = '') { const p = document.createElement('p'); if (cls) p.className = cls; p.textContent = t; logEl.appendChild(p); while (logEl.children.length > 8) logEl.firstChild.remove(); }
const CM = { res:null, opts:[] };
function choose(opts, cls = '') {
  return new Promise(res => {
    CM.res = res; CM.opts = opts; cmdEl.className = 'cmds' + (cls ? ' ' + cls : '');
    cmdEl.innerHTML = opts.map((o, i) => '<button class="btn ' + (o.cls || '') + '" data-i="' + i + '"' + (o.dis ? ' disabled' : '') + '>' + esc(o.l) + (o.s ? '<small>' + esc(o.s) + '</small>' : '') + '</button>').join('');
  });
}
function resolveCmd(v) { if (!CM.res) return; const r = CM.res; CM.res = null; cmdEl.innerHTML = ''; sfx.click(); r(v); }
cmdEl.addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (!b || b.disabled || !CM.res) return; resolveCmd(CM.opts[+b.dataset.i].v); });
cvB.addEventListener('click', e => {
  if (!BS.target || !CM.res) return;
  const r = cvB.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * BS.AW, py = (e.clientY - r.top) / r.height * BS.AH;
  const f = B.foes.filter(f => f.hp > 0 && Math.abs(px - f.x) < f.hw && py > f.y - f.hh && py < f.y + 4).sort((a, b) => b.y - a.y)[0];
  if (f) resolveCmd(f.id);
});
function renderFoes() {
  if (!B) return; const el = $('#foes'); el.className = 'foes' + (BS.target ? ' pick' : '');
  el.innerHTML = B.foes.map(f => '<button class="foe' + (f.hp <= 0 ? ' dead' : '') + '" data-f="' + f.id + '"' + (f.hp <= 0 ? ' disabled' : '') + '><img class="pix" src="' + sprUrl(f.rival ? classSpr(f.cls) : monMini(f.key)) + '" alt=""><b>' + esc(f.n) + (f.boss ? ' · chefe' : '') + '</b><span class="fine num">Nv ' + f.lv + '</span>' +
    '<div class="bar" style="grid-column:2"><i class="hp" style="width:' + clamp(f.hp / f.maxhp * 100, 0, 100) + '%"></i></div><span class="st">' + Object.keys(STATUS).filter(k => f.st[k] > 0).map(k => '<i title="' + STATUS[k].n + '" style="background:' + STATUS[k].col + '"></i>').join('') + '</span></button>').join('');
}
$('#foes').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b || !BS.target || !CM.res) return; resolveCmd(b.dataset.f); });
function renderParty() {
  renderFoes();
  const pcs = [B.hero].concat(B.pet ? [B.pet] : []);
  $('#party').innerHTML = pcs.map(p => {
    const hpP = clamp(p.hp / p.maxhp * 100, 0, 100);
    return '<div class="pc"><img class="pix" src="' + sprUrl(p.hero ? heroMini(false) : p.spr) + '" alt=""><b>' + esc(p.hero ? S.name : p.n) + '</b>' +
      '<div class="bar"><i class="hp" style="width:' + hpP + '%"></i></div>' +
      (p.hero ? '<div class="bar"><i class="mp" style="width:' + clamp(p.mp / p.maxmp * 100, 0, 100) + '%"></i></div>' : p.ward > 0 ? '<div class="bar"><i class="wd" style="width:' + clamp(p.ward / p.maxhp * 100, 0, 100) + '%"></i></div>' : '<span class="fine">Seguidor</span>') +
      '<div class="v" style="grid-column:2"><span class="num">' + Math.max(0, Math.round(p.hp)) + '/' + p.maxhp + '</span>' + (p.hero ? '<span class="num">' + Math.round(p.mp) + '/' + p.maxmp + ' PM</span>' : '') + (p.ward > 0 ? '<span>+' + Math.round(p.ward) + '</span>' : '') + '</div></div>';
  }).join('');
}

/* ---------- Efeitos ---------- */
function floatText(x, y, txt, col) { BS.floats.push({ x, y, txt, col, t0:performance.now() }); }
function tween(o, k, to, ms) { return new Promise(res => { const from = o[k], t0 = performance.now(); (function st(now) { const p = Math.min(1, (now - t0) / ms); o[k] = from + (to - from) * p; p < 1 ? requestAnimationFrame(st) : res(); })(t0); }); }
async function shake(o) { for (let i = 0; i < 4; i++) { o.ox = (i % 2 ? -3 : 3); await wait(38); } o.ox = 0; }
async function flashObj(o) { o.flash = 1; await wait(110); o.flash = 0; }
const FXCOL = { fis:['#ffffff', '#ffe9a0', '#f5c451'], hurt:['#ff8a7a', '#ff5a5a', '#ffffff'], fogo:['#ff5a2a', '#ff9a3a', '#ffd84a', '#fff3a0'], agua:['#bff6ff', '#59d0e8', '#ffffff', '#8ab8ff'],
  raio:['#fff3a0', '#ffe14a', '#ffffff'], sagrado:['#fff8c0', '#ffe9a0', '#ffffff', '#f5c451'], terra:['#c8a070', '#8a6a40', '#e8d0a0'], sombrio:['#8a4aff', '#4a1a8a', '#c8a0ff'], arcano:['#ff7af0', '#b04ae8', '#ffffff'], neutro:['#e8e8ff', '#a0a0ff'], puff:['#ffffff', '#c8c4dc', '#8a86a8'], heal:['#a8ffb0', '#6ad07a', '#ffffff'] };
function fxBurst(x, y, el, big) {
  const cols = FXCOL[el] || FXCOL.fis, now = performance.now(), rise = el === 'fogo' || el === 'sagrado' || el === 'heal', n = big ? 20 : 12;
  if (BS.fx.length > 150) return;
  if (el === 'raio') BS.fx.push({ k:'bolt', x, y, t0:now, life:280, seed:(Math.random() * 99) | 0 });
  if (el === 'fis' || el === 'hurt') BS.fx.push({ k:'slash', x, y, t0:now, life:260, flip:el === 'hurt' });
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.283, sp = (rise ? 14 : 28) + Math.random() * 36;
    BS.fx.push({ k:'p', x, y, vx:Math.cos(a) * sp, vy:Math.sin(a) * sp + (rise ? -18 : 0), g:el === 'agua' ? 80 : rise ? -12 : 50, t0:now, life:350 + Math.random() * 300, col:cols[(Math.random() * cols.length) | 0], s:Math.random() < .3 ? 2 : 1 });
  }
}

/* ---------- Cálculo de dano ---------- */
function elemMult(t, el) {
  if (el === 'neutro') return [1, 'norm'];
  if (t.immune.includes(el)) return [0, 'imm']; if (t.weak.includes(el)) return [2, 'weak']; if (t.eres.includes(el)) return [.5, 'res'];
  return [1, 'norm'];
}
function buffMul(f, k) { const v = f.buf[k] || 0; return v > 0 ? (k === 'atk' ? 1.4 : k === 'def' ? 1.5 : 1.3) : v < 0 ? .6 : 1; }
function calcHit(a, t, o) {
  const el = o.elem || 'fis';
  let A = o.stat === 'both' ? (a.atk + a.mag) * .6 : o.stat === 'mag' ? a.mag * buffMul(a, 'mag') : a.atk * buffMul(a, 'atk');
  const D = (o.stat === 'mag' ? t.res : t.def * buffMul(t, 'def')) * (t.guard ? 1.6 : 1);
  let p = o.pow || 1; if (o.exec && t.hp < t.maxhp * .35) p *= 2;
  let d = A <= 0 ? 0 : A * p * rnd(.9, 1.1) * A / (A + Math.max(0, D));
  const [m, note] = elemMult(t, el); d *= m;
  const crit = m > 0 && Math.random() * 100 < (a.crit || 5) + (o.crit || 0); if (crit) d *= 1.5;
  if (a.st.cegar > 0 && Math.random() < .5) return { d:0, miss:true, el, note };
  if (t.buf.eva > 0 && Math.random() < .45) return { d:0, miss:true, el, note, dodge:true };
  if (t.hero && pathOf() === 'ladino' && Math.random() * 100 < 2 + ptier()) return { d:0, miss:true, el, note, dodge:true };
  return { d:m === 0 ? 0 : Math.max(1, Math.round(d)), crit, el, note };
}
function applyDamage(t, d) {
  if (!Number.isFinite(d)) d = 1;
  if (t.ward > 0) { const ab = Math.min(t.ward, d); t.ward -= ab; d -= ab; }
  t.hp = Math.max(0, t.hp - d); if (t.st.sono > 0 && d > 0) t.st.sono = 0;
  return d;
}
const cxPos = f => [f.x, f.y - (f.hh || 30) * .5];

async function collateral(h, main, o) {
  if (pathOf() !== 'guerreiro') return; const t = ptier(), others = B.foes.filter(f => f.hp > 0 && f !== main);
  if (!others.length || Math.random() * 100 >= 8 + 2 * t) return;
  const v = pick(others); say('Dano colateral em ' + v.n + '!', 'good'); await hitTarget(h, v, Object.assign({}, o, { pow:(o.pow || 1) * (5 + 10 * t) / 100, crit:0, hits:1 }));
}
async function hitTarget(a, t, o) {
  const r = calcHit(a, t, o), [x, y] = cxPos(t);
  if (!t.hero && !t.pet && !t.rival && B.mode !== 'arena') { const c = cx(t.key); c.el[r.el] = r.note || 'norm'; }
  if (r.miss) { floatText(x, y - 6, r.dodge ? 'Esquivou' : 'Errou', '#c8c4dc'); await wait(260); return r; }
  if (r.d === 0 && r.note === 'imm') { floatText(x, y - 6, 'Imune', '#c8c4dc'); say(t.n + ' é imune.'); await wait(300); return r; }
  if (t.parry && (r.el === 'fis')) { t.parry = false; floatText(x, y - 6, 'Aparou!', '#ffe9a0'); say((t.hero ? 'Você apara' : t.n + ' apara') + ' o golpe e revida!', 'good'); await hitTarget(t, a, { stat:'atk', pow:.8 }); return { d:0 }; }
  const dealt = applyDamage(t, r.d);
  floatText(x, y - 6, (r.d) + (r.crit ? '!' : ''), r.crit ? '#ffe14a' : t.hero || t.pet ? '#ff9a8a' : '#ffffff');
  fxBurst(x, y, t.hero || t.pet ? (r.el === 'fis' ? 'hurt' : r.el) : r.el, r.crit);
  (r.crit ? sfx.crit : t.hero ? sfx.hurt : sfx.hit)();
  if (r.note === 'weak') say('Fraqueza! Dano dobrado.', 'gold'); else if (r.note === 'res') say(t.n + ' resiste.');
  if (o.steal && a.hero && dealt > 0) { const g = Math.round(3 + t.lv * 2 * rnd(.6, 1.4)); S.gold += g; floatText(x, y - 16, '+' + g + ' ouro', '#f0c25a'); say('Você rouba ' + g + ' ouro.', 'gold'); }
  if (o.drain && dealt > 0) { const h = Math.round(r.d * o.drain); a.hp = Math.min(a.maxhp, a.hp + h); floatText(...cxPos(a), '+' + h, '#8fe08a'); }
  flashObj(t); await shake(t);
  if (t.hp <= 0) { say(t.n + (t.hero ? ' caiu!' : ' foi derrotado!'), t.hero ? 'bad' : ''); fxBurst(x, y, 'puff', t.boss); tween(t, 'alpha', t.pet ? .35 : 0, 380); await wait(280); }
  renderParty();
  return r;
}
function tryStatus(t, s) {
  if (!s || t.hp <= 0) return; const [k, ch, turns] = s;
  if (t.boss && (k === 'atordoar' || k === 'sono')) return;
  if (Math.random() < ch) { t.st[k] = Math.max(t.st[k] || 0, turns); say((t.hero ? 'Você' : t.n) + ': ' + STATUS[k].n.toLowerCase() + '!', t.hero ? 'bad' : 'good'); }
}

/* ---------- Loop da batalha ---------- */
async function battle(opts) {
  B = { foes:opts.foes, mode:opts.mode || 'map', bio:opts.bio || 'grass', canFlee:opts.canFlee !== false, hero:heroFighter(opts.mode || 'map'), pet:petFighter(), round:0 };
  if (B.mode === 'arena') { B.hero.hp = B.hero.maxhp; B.hero.mp = B.hero.maxmp; }
  BS.fx = []; BS.floats = []; BS.target = false; logEl.innerHTML = '';
  show('battle'); sizeBattle(); layoutBattle(); renderParty();
  for (const f of B.foes) if (!f.rival) cx(f.key).seen = 1;
  say(B.foes.length > 1 ? 'Inimigos à frente!' : B.foes[0].n + (B.foes[0].lv ? ' (nível ' + B.foes[0].lv + ')' : '') + ' aparece!');
  let result = null;
  const hInit = B.hero.init + rnd(0, 6), fInit = Math.max(...B.foes.map(f => f.dex * .15 + (f.boss ? 3 : 0) + (f.rival ? f.lv * .1 : 0))) + rnd(0, 6);
  if (fInit > hInit) {
    say('Os inimigos têm mais iniciativa e agem primeiro!', 'bad'); await wait(500);
    for (const f of B.foes) { if (f.hp <= 0 || B.hero.hp <= 0) continue; if (skipTurn(f)) { await wait(300); continue; } await foeAct(f); }
    if (B.hero.hp <= 0) result = 'lose';
    renderParty();
  }
  while (!result) {
    B.round++;
    /* turno do herói */
    const h = B.hero; h.guard = false;
    if (await statusTick(h)) { result = 'lose'; break; }
    if (skipTurn(h)) { await wait(500); }
    else {
      const act = await heroChoose();
      const r = await doHeroAct(act);
      if (r === 'flee') { result = 'flee'; break; }
    }
    if (B.foes.every(f => f.hp <= 0)) { result = 'win'; break; }
    /* seguidor */
    if (B.pet && B.pet.hp > 0) { if (!(await statusTick(B.pet)) && !skipTurn(B.pet)) await petAct(); }
    if (B.foes.every(f => f.hp <= 0)) { result = 'win'; break; }
    /* inimigos */
    for (const f of B.foes) {
      if (f.hp <= 0) continue;
      if (await statusTick(f)) continue;
      if (skipTurn(f)) { await wait(350); continue; }
      await foeAct(f);
      if (h.hp <= 0) break;
    }
    if (h.hp <= 0) { result = 'lose'; break; }
    if (B.foes.every(f => f.hp <= 0)) { result = 'win'; break; }
    for (const f of [h, B.pet, ...B.foes]) if (f) for (const k in f.buf) { if (f.buf[k] > 0) f.buf[k]--; else if (f.buf[k] < 0) f.buf[k]++; }
    renderParty();
  }
  BS.target = false; cmdEl.innerHTML = '';
  S.hp = Math.max(0, Math.round(B.hero.hp)); S.mp = Math.round(B.hero.mp);
  if (B.pet) S.petHp = B.pet.hp / B.pet.maxhp;
  if (B.mode === 'arena') { const st = stats(); S.hp = Math.max(S.hp, 1); }
  if (result === 'win') { sfx.win(); await victory(); }
  else if (result === 'lose') { say('Você foi derrotado...', 'bad'); sfx.lose(); await tween(B.hero, 'alpha', .2, 500); await wait(700); }
  else { await wait(400); }
  return result;
}
function skipTurn(f) {
  const nm = f.hero ? 'Você' : f.n;
  if (f.st.atordoar > 0) { f.st.atordoar--; say(nm + ' está atordoado.'); return true; }
  if (f.st.sono > 0) { f.st.sono--; say(nm + ' está dormindo.'); return true; }
  if (f.st.paralisar > 0) { f.st.paralisar--; if (Math.random() < .5) { say(nm + ' está paralisado.'); return true; } }
  return false;
}
async function statusTick(f) {
  for (const k of ['veneno', 'queimar']) if (f.st[k] > 0) {
    f.st[k]--; const d = Math.max(1, Math.round(f.maxhp * (k === 'veneno' ? .06 : .05))); applyDamage(f, d);
    floatText(...cxPos(f), '' + d, STATUS[k].col); renderParty(); await wait(260);
    if (f.hp <= 0) { say((f.hero ? 'Você' : f.n) + ' sucumbe ao ' + STATUS[k].n.toLowerCase() + '.', f.hero ? 'bad' : ''); tween(f, 'alpha', f.pet ? .35 : 0, 300); await wait(300); return true; }
  }
  if (f.st.cegar > 0) f.st.cegar--;
  return false;
}
async function pickTarget() {
  const alive = B.foes.filter(f => f.hp > 0); if (alive.length === 1) return alive[0];
  BS.target = true; renderFoes();
  const v = await choose(alive.map(f => ({ v:f.id, l:f.n, s:Math.ceil(f.hp / f.maxhp * 100) + '% PV' })).concat([{ v:'back', l:'Voltar', cls:'wide' }]), 'list');
  BS.target = false; renderFoes(); return v === 'back' ? null : B.foes.find(f => f.id === v);
}
async function heroChoose() {
  const h = B.hero, oi = equippedIn(setOfMode(B.mode), 'offhand'), off = oi && OFF_CMD[oi.type];
  for (;;) {
    const v = await choose([
      { v:'atk', l:'Atacar', cls:'gold' }, { v:'skill', l:'Habilidades', s:S.equipped.length + ' prontas' }, { v:'item', l:'Itens', s:B.mode === 'arena' ? 'proibido' : '', dis:B.mode === 'arena' },
      off ? { v:'off', l:off.n, s:'mão secundária' } : { v:'guard', l:'Guarda', s:'+PM, dano menor' }, { v:'flee', l:'Fugir', s:B.canFlee ? '' : 'impossível', dis:!B.canFlee },
    ]);
    if (v === 'atk') { const t = await pickTarget(); if (t) return { k:'atk', t }; }
    else if (v === 'skill') {
      const list = S.equipped.map(id => ({ v:id, l:SKILLS[id].n, s:SKILLS[id].mp + ' PM' + (SKILLS[id].elem && SKILLS[id].elem !== 'neutro' ? ' · ' + ELEM[SKILLS[id].elem] : ''), dis:h.mp < SKILLS[id].mp }));
      const id = await choose(list.concat([{ v:'back', l:'Voltar', cls:'wide' }]), 'list');
      if (id === 'back') continue;
      const s = SKILLS[id];
      if ((s.kind === 'dmg' || s.kind === 'debuff') && !s.all) { const t = await pickTarget(); if (!t) continue; return { k:'skill', s, id, t }; }
      return { k:'skill', s, id };
    } else if (v === 'item') {
      const own = Object.keys(ITEMS).filter(k => ITEMS[k].kind === 'pot' && S.inv[k] > 0);
      if (!own.length) { say('Nenhum item usável.'); continue; }
      const k = await choose(own.map(k => ({ v:k, l:ITEMS[k].n + ' ×' + S.inv[k], s:ITEMS[k].d })).concat([{ v:'back', l:'Voltar', cls:'wide' }]), 'list');
      if (k !== 'back') return { k:'item', key:k };
    } else if (v === 'off') return { k:'off', c:off };
    else return { k:v };
  }
}
async function doHeroAct(a) {
  const h = B.hero;
  if (a.k === 'atk') {
    say(S.name + ' ataca ' + a.t.n + '.'); await tween(h, 'ox', 30, 90);
    const o = { stat:CLASSES[S.cls].m.mag > CLASSES[S.cls].m.atk ? 'mag' : 'atk', pow:1 };
    await hitTarget(h, a.t, o); await collateral(h, a.t, o); await tween(h, 'ox', 0, 110);
    h.mp = Math.min(h.maxmp, h.mp + 2);
  } else if (a.k === 'skill') {
    const s = a.s; h.mp -= s.mp; say(S.name + ' usa ' + s.n + '!'); sfx.magic(); renderParty();
    if (s.kind === 'dmg') {
      const ts = s.all ? B.foes.filter(f => f.hp > 0) : [a.t.hp > 0 ? a.t : B.foes.find(f => f.hp > 0)];
      await tween(h, 'ox', 24, 90);
      for (let i = 0; i < (s.hits || 1); i++) { for (const t of ts) { if (t.hp <= 0) continue; await hitTarget(h, t, s); tryStatus(t, s.st); if (s.st2) tryStatus(t, s.st2); } if (B.foes.every(f => f.hp <= 0)) break; await wait(60); }
      if (!s.all && s.stat !== 'mag') await collateral(h, ts[0], s);
      if (s.stat === 'mag' && pathOf() === 'mago' && Math.random() * 100 < 6 + 2 * ptier() && B.foes.some(f => f.hp > 0)) {
        say('Eco mágico!', 'good'); await wait(160);
        for (const t of ts) if (t.hp > 0) await hitTarget(h, t, Object.assign({}, s, { pow:s.pow * .3, crit:0 }));
      }
      await tween(h, 'ox', 0, 110);
    } else if (s.kind === 'heal') { const n = Math.round(h.maxhp * s.pow + h.mag); h.hp = Math.min(h.maxhp, h.hp + n); floatText(...cxPos(h), '+' + n, '#8fe08a'); fxBurst(...cxPos(h), 'heal'); sfx.heal(); await wait(420); }
    else if (s.kind === 'ward') { const n = Math.round(h.mag * s.pow + 10); h.ward += n; floatText(...cxPos(h), 'Barreira +' + n, '#bfe6ff'); fxBurst(...cxPos(h), 'agua'); await wait(420); }
    else if (s.kind === 'buff') { for (const k in s.buff) h.buf[k] = s.buff[k]; floatText(...cxPos(h), s.n, '#ffe9a0'); fxBurst(...cxPos(h), 'sagrado'); await wait(420); }
    else if (s.kind === 'debuff') { const t = a.t.hp > 0 ? a.t : B.foes.find(f => f.hp > 0); fxBurst(...cxPos(t), 'sombrio'); const before = t.st[s.st[0]] || 0; tryStatus(t, s.st); if (s.st2) tryStatus(t, s.st2); if ((t.st[s.st[0]] || 0) === before) say('Não funcionou.'); await wait(400); }
  } else if (a.k === 'item') {
    const it = ITEMS[a.key]; S.inv[a.key]--; say(S.name + ' usa ' + it.n + '.');
    if (it.hp) { const n = Math.min(h.maxhp - h.hp, it.hp); h.hp += n; floatText(...cxPos(h), '+' + n, '#8fe08a'); }
    if (it.mp) { const n = Math.min(h.maxmp - h.mp, it.mp); h.mp += n; floatText(...cxPos(h), '+' + n + ' PM', '#8ab8ff'); }
    if (it.cure) { for (const k of ['veneno', 'queimar', 'cegar', 'paralisar']) h.st[k] = 0; floatText(...cxPos(h), 'Curado', '#8fe08a'); }
    fxBurst(...cxPos(h), 'heal'); sfx.heal(); await wait(420);
  } else if (a.k === 'off') {
    if (a.c.id === 'bloquear') { const n = Math.round(h.def * 1.2 + 6); h.ward += n; h.guard = true; floatText(...cxPos(h), 'Bloqueio +' + n, '#bfe6ff'); }
    else if (a.c.id === 'concentrar') { const n = Math.round(h.maxmp * .18 + 4); h.mp = Math.min(h.maxmp, h.mp + n); floatText(...cxPos(h), '+' + n + ' PM', '#8ab8ff'); }
    else { h.parry = true; floatText(...cxPos(h), 'Aparar', '#ffe9a0'); }
    say(S.name + ' usa ' + a.c.n + '.'); await wait(420);
  } else if (a.k === 'guard') {
    h.guard = true; h.mp = Math.min(h.maxmp, h.mp + Math.round(h.maxmp * .1) + 2); say(S.name + ' se defende.'); floatText(...cxPos(h), 'Guarda', '#bfe6ff'); await wait(400);
  } else if (a.k === 'flee') {
    const avg = B.foes.filter(f => f.hp > 0).reduce((s, f) => s + f.dex, 0) / B.foes.filter(f => f.hp > 0).length;
    if (Math.random() < clamp(.55 + (h.dex - avg) * .02, .25, .9)) { say('Você escapa!', 'good'); await tween(h, 'ox', -60, 260); return 'flee'; }
    say('Não conseguiu fugir!', 'bad'); await wait(400);
  }
  renderParty(); return null;
}
async function petAct() {
  const p = B.pet, mv = PET_MOVES[wpick(p.moves)], t = pick(B.foes.filter(f => f.hp > 0)); if (!t) return;
  if (mv.heal) { const tg = B.hero, n = Math.round(tg.maxhp * mv.heal + p.mag); tg.hp = Math.min(tg.maxhp, tg.hp + n); say(p.n + ' cura você.', 'good'); floatText(...cxPos(tg), '+' + n, '#8fe08a'); fxBurst(...cxPos(tg), 'heal'); await wait(380); renderParty(); return; }
  if (mv.ward) { const n = Math.round(B.hero.maxhp * mv.ward); B.hero.ward += n; say(p.n + ' cria uma barreira.', 'good'); floatText(...cxPos(B.hero), '+' + n, '#bfe6ff'); await wait(380); renderParty(); return; }
  say(p.n + ' usa ' + mv.n + '.'); await tween(p, 'ox', 20, 80);
  const ts = mv.all ? B.foes.filter(f => f.hp > 0) : [t];
  for (const x of ts) { await hitTarget(p, x, mv); tryStatus(x, mv.st); }
  await tween(p, 'ox', 0, 100);
}
async function foeAct(f) {
  let mv;
  if (f.charging) { mv = f.charging; f.charging = null; if (!f.rival) cx(f.key).moves[Object.keys(MOVES).find(k => MOVES[k] === mv)] = 1; }
  else if (f.rival) {
    const ok = f.skills.filter(id => SKILLS[id].mp <= f.mp && (SKILLS[id].kind === 'dmg' || (SKILLS[id].kind === 'heal' && f.hp < f.maxhp * .4)));
    if (ok.length && Math.random() < .4) { const id = pick(ok), s = SKILLS[id]; f.mp -= s.mp; say(f.n + ' usa ' + s.n + '!');
      if (s.kind === 'heal') { const n = Math.round(f.maxhp * s.pow + f.mag); f.hp = Math.min(f.maxhp, f.hp + n); floatText(...cxPos(f), '+' + n, '#8fe08a'); await wait(400); return; }
      await tween(f, 'ox', -24, 90); for (let i = 0; i < (s.hits || 1); i++) { const t = pickFoeTarget(); await hitTarget(f, t, s); tryStatus(t, s.st); if (B.hero.hp <= 0) break; } await tween(f, 'ox', 0, 110); return; }
    mv = MOVES.pancada; f.mp = Math.min(f.maxmp, f.mp + 3);
  } else {
    const id = wpick(f.moves); mv = MOVES[id];
    if (mv.charge) { f.charging = mv; say(f.n + ' está se preparando para ' + mv.n + '...', 'bad'); await wait(600); return; }
    cx(f.key).moves[id] = 1;
  }
  if (mv.buff) { for (const k in mv.buff) f.buf[k] = mv.buff[k]; say(f.n + ' usa ' + mv.n + '.'); floatText(...cxPos(f), mv.n, '#ffb08a'); await wait(450); return; }
  const t = pickFoeTarget(); say(f.n + ' usa ' + mv.n + '.');
  await tween(f, 'ox', -24, 90);
  await hitTarget(f, t, mv); tryStatus(t, mv.st);
  await tween(f, 'ox', 0, 110);
}
let pickFoeTarget = () => (B.pet && B.pet.hp > 0 && Math.random() < .3) ? B.pet : B.hero;

/* ---------- Recompensas ---------- */
async function victory() {
  let xp = 0, gold = 0, ess = 0; const drops = [], gm = buffOn('gold2') ? 2 : 1;
  for (const f of B.foes) {
    const L = f.lv, Z = f.boss ? 6 : 1;
    xp += Math.round((10 + 6 * L) * (1 + L / 25)) * Z * (f.rival ? 4 : 1); gold += Math.round((4 + 2.5 * L) * Z * rnd(.85, 1.15) * gm); ess += Math.round((1 + tierOfLv(L) * 2) * rnd(.5, 1.5) * (f.boss ? 10 : f.rival ? 6 : 1));
    if (!f.rival) {
      const c = cx(f.key); c.kills++;
      for (const [k, ch] of (MON[f.key].drops || [])) if (Math.random() < ch) { addItem(k); c.drops[k] = 1; drops.push(ITEMS[k].n); }
      questKill(f.key);
      if (f.boss) {
        if (f.key !== 'b_aurora') { S.raid.sigils++; drops.push('Selo de Invocação'); }
        if (Math.random() < .6) { addItem('ficha'); drops.push('Ficha da Arena'); }
        if (Math.random() < .45) { addItem('chave'); drops.push('Chave de Masmorra'); }
      }
    }
    const gch = f.boss ? 1 : f.rival ? .5 : .2;
    if (Math.random() < gch && !bagFull()) { const it = genGear(tierOfLv(L), null, f.rival ? CLASSES[f.cls].gear[0] : (Math.random() < .5 ? CLASSES[S.cls].gear[0] : null), f.boss ? .12 : 0); addGear(it); drops.push(it.name + ' (' + qualOf(it.q).n + ')'); }
  }
  if (B.mode === 'raid') { S.raid.seals += 3; S.raid.wins++; drops.push('3 Medalhas da Aurora'); }
  if (pathOf() === 'ladino') gold = Math.round(gold * (1 + .06 * ptier()));
  ess = Math.round(ess * Math.max(1, tierOfLv(S.lvl) * 1.8));
  S.gold += gold; S.ess += ess;
  say('Vitória! +' + fmt(xp) + ' XP · +' + fmt(gold) + ' ouro · +' + ess + ' essências', 'gold');
  if (drops.length) say('Saque: ' + drops.join(', '), 'gold');
  for (const [t, c] of gainXp(xp)) say(t, c);
  questCheck(); renderParty(); updateHUD(); save();
  await choose([{ v:1, l:'Continuar', cls:'gold wide' }], 'one');
}

/* ---------- Desenho ---------- */
function drawBattle(now) {
  if (!B || !BS.u) return; const g = gB, u = BS.u, W = BS.W, H = BS.H;
  g.setTransform(1, 0, 0, 1, 0, 0);
  if(typeof PaintedScene!=='undefined'&&PaintedScene.has(B.bio)){PaintedScene.draw(g,W,H,B.bio);}else{
  const bg = getBG(B.bio), bw = Math.round(192 * u), bh = Math.round(120 * u), x0 = Math.round((W - bw) / 2), y0 = Math.round(H - bh);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  if (y0 > 0) g.drawImage(bg, 0, 0, bg.width, 3, x0, 0, bw, y0 + 3);
  g.drawImage(bg, x0, y0, bw, bh);
  if (x0 > 0) { g.save(); g.scale(-1, 1); g.drawImage(bg, -x0, y0, bw, bh); g.drawImage(bg, -(x0 + 2 * bw), y0, bw, bh); g.restore(); }
  }
  g.imageSmoothingEnabled = false;
  const list = [B.hero].concat(B.pet ? [B.pet] : [], B.summons||[], B.foes).filter(f => f.alpha > 0).sort((a, b) => a.y - b.y);
  for (const f of list) {
    const s = f.flash ? flashOf(f.spr) : f.spr, w = s.width * f.k, h = s.height * f.k, bob = Math.sin(now / 380 + (f.x || 0)) * (f.hero || f.pet ? .5 : 1);
    const cx = (f.x + f.ox) * u, base = f.y * u;
    g.globalAlpha = .3 * f.alpha; g.fillStyle = '#000'; g.beginPath(); g.ellipse(cx, base, w * .32, 2.5 * u, 0, 0, 7); g.fill();
    g.globalAlpha = f.alpha; g.drawImage(s, 0, 0, s.width, s.height, Math.round(cx - w / 2), Math.round(base - h + (bob + f.oy) * u), w, h); g.globalAlpha = 1;
    if (!f.hero && !f.pet && f.hp > 0) {
      const bwid = (f.boss ? 36 : 24) * u, bx = Math.round(cx - bwid / 2), by = Math.round(base - h - 6 * u), bhh = Math.max(3, Math.round(2 * u));
      g.fillStyle = '#1a120c'; g.fillRect(bx - 2, by - 2, bwid + 4, bhh + 4); g.fillStyle = '#5a1a14'; g.fillRect(bx, by, bwid, bhh); g.fillStyle = '#ff5a4a'; g.fillRect(bx, by, Math.round(bwid * f.hp / f.maxhp), bhh);
      if (f.ward > 0) { g.fillStyle = '#bfe6ff'; g.fillRect(bx, by - bhh / 2 - 2, Math.round(bwid * Math.min(1, f.ward / f.maxhp)), bhh / 2); }
      let sx = bx; for (const k in STATUS) if (f.st[k] > 0) { g.fillStyle = STATUS[k].col; g.fillRect(sx, by + bhh + 4, 3 * u, 2 * u); sx += 4 * u; }
      if (f.charging) { g.fillStyle = '#ffe14a'; g.fillRect(Math.round(cx - u), by - 9 * u, 2 * u, 5 * u); g.fillRect(Math.round(cx - u), by - 3 * u, 2 * u, u); }
      if (BS.target) { const ty = by - 9 * u + Math.sin(now / 120) * 1.5 * u; g.fillStyle = '#f5c451'; g.beginPath(); g.moveTo(cx - 4 * u, ty); g.lineTo(cx + 4 * u, ty); g.lineTo(cx, ty + 4 * u); g.fill(); }
    }
    if ((f.hero || f.pet) && f.hp > 0) { let sx = cx - 8 * u; for (const k in STATUS) if (f.st[k] > 0) { g.fillStyle = STATUS[k].col; g.fillRect(sx, base + 2 * u, 3 * u, 2 * u); sx += 4 * u; } }
  }
  /* partículas */
  BS.fx = BS.fx.filter(f => now - f.t0 < f.life);
  for (const f of BS.fx) {
    const p = (now - f.t0) / f.life, t = (now - f.t0) / 1000, z = Math.max(2, Math.round(f.s * u * .8));
    if (f.k === 'p') { g.globalAlpha = 1 - p * p; g.fillStyle = f.col; g.fillRect(Math.round((f.x + f.vx * t) * u), Math.round((f.y + f.vy * t + .5 * f.g * t * t) * u), z, z); }
    else if (f.k === 'slash') { const len = 26 * Math.min(1, p * 2.4), dir = f.flip ? -1 : 1; g.globalAlpha = 1 - p * .6; g.strokeStyle = '#fff'; g.lineWidth = 2.2 * u; g.lineCap = 'round'; g.beginPath(); g.moveTo((f.x - 12 * dir) * u, (f.y - 12) * u); g.lineTo((f.x - 12 * dir + len * dir * .8) * u, (f.y - 12 + len * .95) * u); g.stroke(); g.strokeStyle = '#ffe9a0'; g.lineWidth = 1 * u; g.stroke(); }
    else if (f.k === 'bolt') { g.globalAlpha = p < .5 ? 1 : 1 - (p - .5) * 2; g.strokeStyle = '#ffe14a'; g.lineWidth = 3 * u; g.beginPath(); g.moveTo(f.x * u, 0); for (let i = 1; i <= 7; i++) g.lineTo((i === 7 ? f.x : f.x + (hn(i, f.seed, 5) - .5) * 18) * u, f.y * i / 7 * u); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 1.2 * u; g.stroke(); }
    g.globalAlpha = 1;
  }
  /* números flutuantes */
  g.textAlign = 'center'; g.font = '800 ' + Math.round(9 * u) + 'px "Alegreya Sans", system-ui, sans-serif';
  BS.floats = BS.floats.filter(f => now - f.t0 < 950);
  for (const f of BS.floats) { const p = (now - f.t0) / 950, y = (f.y - p * 14) * u; g.globalAlpha = p > .7 ? 1 - (p - .7) / .3 : 1; g.lineWidth = 2 * u; g.strokeStyle = '#1a120c'; g.strokeText(f.txt, f.x * u, y); g.fillStyle = f.col; g.fillText(f.txt, f.x * u, y); g.globalAlpha = 1; }
}
/* ===== Interface: folhas de menu, janelas, herói, inventário, equipamento, classes, codex ===== */
const P = { kind:null, tab:null, data:null, stack:[], set:'padrao', statSet:'padrao', cat:'novo', q:'', sort:'rec', view:'grid', path:null };
const overlay = $('#overlay'), modal = $('#modal'), mBody = $('#modal-body'), scrollEl = $('#sheet-scroll');
const stars = n => n > 3 ? '★ ' + n : '★'.repeat(n);
let qCls = it => qualOf(it.q).cls;
const gName = it => esc(it.name) + (it.lvl > 1 ? ' +' + (it.lvl - 1) : '');
const qSpan = it => '<b class="' + qCls(it) + '">' + gName(it) + '</b>';
let qTag = it => '<span class="badge">' + qualOf(it.q).n + ' ' + Math.round(it.q * 100) + '%</span>';
const btn = (act, label, attrs = '', cls = 'sm') => '<button class="btn ' + cls + '" data-act="' + act + '" ' + attrs + '>' + label + '</button>';
const typeLbl = t => t === 'any' ? 'Qualquer classe' : CLASSES[t] ? CLASSES[t].n : t;
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const box = (title, inner, cls = '') => '<fieldset class="box ' + cls + '"><legend class="dec">' + title + '</legend>' + inner + '</fieldset>';
const tabsRow = (tabs, cur) => '<div class="tabs" role="tablist">' + tabs.map(([k, l]) => '<button class="btn ' + (k === cur ? 'sel' : '') + '" role="tab" aria-selected="' + (k === cur) + '" data-act="tab" data-tab="' + k + '">' + l + '</button>').join('') + '</div>';
const BANNER = {};
function bannerUrl(bio) { if (!BANNER[bio]) BANNER[bio] = getBG(bio).toDataURL('image/jpeg', .82); return BANNER[bio]; }
const hereBio = () => (ZONES[zoneAtPx(H.x, H.y)] || ZONES.B).bio;
const banner = (title, sub, bio, extra = '') => '<header class="banner" style="background-image:url(' + bannerUrl(bio || hereBio()) + ')"><h2>' + title + '</h2>' + (sub ? '<p>' + sub + '</p>' : '') + extra + '</header>';
function deltaVs(it, cur) {
  const a = gearStats(it), b = cur && cur !== it ? gearStats(cur) : (cur === it ? a : {}), d = {};
  for (const k in a) d[k] = (d[k] || 0) + a[k]; for (const k in b) d[k] = (d[k] || 0) - b[k];
  return Object.entries(d).filter(([, v]) => v).map(([k, v]) => '<span style="color:var(' + (v > 0 ? '--good' : '--bad') + ')">' + (v > 0 ? '+' : '') + v + ' ' + STAT_LBL[k] + '</span>').join(' ');
}
function slotFor(it, set) {
  if (it.slot !== 'acc') return it.slot;
  const a1 = equippedIn(set, 'acc1'), a2 = equippedIn(set, 'acc2');
  if (a1 === it || a2 === it) return a1 === it ? 'acc1' : 'acc2';
  if (!a1) return 'acc1'; if (!a2) return 'acc2';
  return gearPrice(a1) <= gearPrice(a2) ? 'acc1' : 'acc2';
}
const unequipped = () => S.bag.filter(i => !isEquipped(i));
function gearCard(it, actions) {
  return '<div class="card"><div class="row l" style="gap:10px">' + iconImg(it, 36) + '<div style="flex:1;min-width:0"><div class="row">' + qSpan(it) + qTag(it) + '</div><span class="fine">' + SLOT_LBL[it.slot] + ' · ' + stars(it.tier) + ' · ' + gearLine(it) + (isEquipped(it) ? ' · <b style="color:var(--blue)">equipado</b>' : '') + '</span></div></div>' + (actions ? '<div class="row"><span></span>' + actions + '</div>' : '') + '</div>';
}

/* =============== Herói =============== */
const HERO_TABS = [['status', 'Status'], ['inv', 'Inventário'], ['equip', 'Equipamento']];
function vHero() {
  const ics = { status:heroMini(false), inv:itemIcon(['bag']), equip:itemIcon(['chest', { metal:'#d8e0ec' }]) };
  const top = '<div class="herotop"><div class="cur"><span>' + iconImg(['coin'], 22) + '<b class="num">' + fmt(S.gold) + '</b></span><span>' + iconImg(['ess'], 22) + '<b class="num">' + fmt(S.ess) + '</b></span></div>' +
    '<div class="toptabs" role="tablist">' + HERO_TABS.map(([k, l]) => '<button class="toptab' + (P.tab === k ? ' on' : '') + '" role="tab" aria-selected="' + (P.tab === k) + '" data-act="tab" data-tab="' + k + '"><img class="pix" src="' + sprUrl(ics[k]) + '" alt="">' + l + '</button>').join('') + '</div></div>';
  return top + ({ status:hStatus, inv:hInv, equip:hEquip }[P.tab] || hStatus)();
}
const ATTR = [
  ['hp', 'HP', ['heart'], 'Pontos de Vida. Se chegarem a zero, você desmaia e acorda na última cidade visitada.'],
  ['mp', 'Mana', ['mana'], 'Pontos de Magia, gastos pelas habilidades. Atacar e usar Guarda recuperam um pouco.'],
  ['atk', 'Ataque', ['sword', { metal:'#d8e0ec' }], 'Aumenta o dano dos ataques e das habilidades físicas.'],
  ['mag', 'Magia', ['staff'], 'Aumenta o dano das magias e a força de curas e barreiras.'],
  ['def', 'Defesa', ['shield'], 'Reduz o dano físico recebido.'],
  ['res', 'Resistência', ['shield', { col:'#8a5ad8', metal:'#c8b8e8' }], 'Reduz o dano mágico recebido.'],
  ['dex', 'Destreza', ['boots'], 'Ajuda a escapar das batalhas e participa dos cálculos de precisão e esquiva.'],
  ['crit', 'Crítico', ['crit'], 'Chance de um golpe causar 50% a mais de dano.'],
  ['init', 'Iniciativa', ['hourglass'], 'Quem tem mais iniciativa age primeiro no começo da batalha. Vem da destreza e do tier da classe.'],
  ['vision', 'Distância de visão', ['eye'], 'Até onde você enxerga à noite: a luz em volta do herói tem este tamanho. Cresce com o tier da classe.'],
];
function hStatus() {
  const c = CLASSES[S.cls], t = c.tier, need = xpNext(S.lvl), st = stats(P.statSet), max = S.lvl >= MAXLV;
  let h = '<header class="banner herobanner" style="background-image:url(' + bannerUrl(hereBio()) + ')">' + sprImg(heroMini(false), 128) + '<h2>' + esc(S.name) + '</h2><p class="cap" style="font-size:15px">' + c.n + ' · ' + stars(t) + (S.spec ? ' · ' + SPECS[S.spec].n : '') + '</p>' +
    '<p>Nível ' + S.lvl + (max ? ' (máximo)' : '') + '</p><div class="bar xpb"><i class="xp" style="width:' + (max ? 100 : S.xp / need * 100) + '%"></i></div><p class="fine num">' + (max ? 'Nível máximo' : fmt(S.xp) + ' / ' + fmt(need) + ' XP') + '</p></header>';
  if (levelCapped()) h += '<p class="fine" style="color:var(--gold);text-align:center">Limite do tier. Desbloqueie uma classe de tier ' + (topTier() + 1) + ' em Mudar Classe para continuar subindo.</p>';
  h += '<div class="acts">' + [['classes', 'Mudar Classe', ['swap']], ['equip', 'Mudar Equipamentos', ['sword', { metal:'#d8e0ec' }]], ['skills', 'Trocar habilidades', ['book']], ['pet', 'Seguidor', ['paw']]].map(([k, l, ic]) =>
    '<button class="ibtn' + (k === 'pet' && !S.pets.length ? ' off' : '') + '" data-act="go" data-k="' + k + '">' + iconImg(ic, 48) + l + '</button>').join('') + '</div>';
  const seg = '<div class="seg" role="tablist" style="margin-bottom:4px">' + SETS.map(k => '<button class="btn ' + (P.statSet === k ? 'sel' : '') + '" data-act="statset" data-k="' + k + '" role="tab" aria-selected="' + (P.statSet === k) + '">' + (k === 'padrao' ? 'Mundo' : SET_LBL[k]) + '</button>').join('') + '</div>';
  const val = k => k === 'hp' ? (P.statSet === 'padrao' ? fmt(S.hp) + ' / ' : '') + fmt(st.hp) : k === 'mp' ? (P.statSet === 'padrao' ? fmt(S.mp) + ' / ' : '') + fmt(st.mp) : k === 'crit' ? st.crit + '%' : fmt(st[k]);
  h += box('Atributos', seg + ATTR.map(([k, l, ic]) => '<div class="srow"><span class="row l" style="gap:10px">' + iconImg(ic, 26) + '<span class="cap">' + l + '</span></span><span class="val"><b class="num">' + val(k) + '</b><button class="q" data-act="help" data-k="' + k + '" aria-label="O que é ' + l + '?">?</button></span></div>').join(''));
  const pk = pathOf(), pas = PASSIVES[pk].map(p => [p.n, p.d(t), ['star']]);
  if (S.spec) pas.push([SPECS[S.spec].n, SPECS[S.spec].d, ['crit', { col:'#c070f0' }]]);
  if (buffOn('xp2')) pas.push(['Sabedoria (XP×2)', 'Termina em ' + mmss(S.buffs.xp2 - Date.now()), ['clock']]);
  if (buffOn('gold2')) pas.push(['Sorte (Ouro×2)', 'Termina em ' + mmss(S.buffs.gold2 - Date.now()), ['clock']]);
  if (nightNow()) pas.push(['Noite', 'Mortos-vivos rondam o mapa.', ['clock']]);
  if (rainNow()) pas.push(['Chuva', 'Minhocões saem da terra.', ['mana', { col:'#7ab8e0' }]]);
  h += box('Efeitos passivos', pas.map(([n, d, ic]) => '<div class="prow">' + iconImg(ic, 24) + '<b>' + n + '</b><span>' + d + '</span></div>').join(''));
  const eq = SLOTS.map(sl => equippedIn('padrao', sl)).filter(Boolean);
  h += box('Equipamento', eq.length ? eq.map(it => '<div class="lrow">' + iconImg(it, 26) + qSpan(it) + '</div>').join('') : '<p class="empty">Nada equipado.</p>');
  h += box('Habilidades', S.equipped.length ? S.equipped.map(id => '<div class="lrow">' + skIcon(id, 26) + '<span style="flex:1">' + SKILLS[id].n + '</span><span class="badge">' + SKILLS[id].mp + ' PM</span></div>').join('') : '<p class="empty">Nenhuma equipada.</p>');
  h += box('Jornada', '<div class="grid2"><div class="kv"><span>Codex</span><b>' + codexCount() + ' completas</b></div><div class="kv"><span>Arena</span><b>' + S.cnt.arena + ' vitórias</b></div><div class="kv"><span>Classes</span><b>' + S.classes.length + ' de ' + Object.keys(CLASSES).length + '</b></div><div class="kv"><span>Missão</span><b>' + Math.min(S.quest.i, STORY.length) + '/' + STORY.length + '</b></div></div>' +
    '<div class="row" style="margin-top:10px">' + btn('snd', SND ? 'Som: ligado' : 'Som: desligado') + btn('exportsave', 'Exportar save') + btn('importsave', 'Importar save') + btn('title', 'Voltar ao título') + '</div>');
  return h;
}
function mHelp(k) {
  const a = ATTR.find(x => x[0] === k);
  return '<div class="row l" style="gap:12px">' + iconImg(a[2], 40) + '<h3>' + a[1] + '</h3></div><p>' + a[3] + '</p><div class="row"><span></span>' + btn('closemodal', 'Entendi', '', 'gold') + '</div>';
}

/* ---------- Inventário ---------- */
const CATS = [['novo', 'Novo', ['new']], ['cura', 'Curativos', ['pot', { col:'#e04a5a', size:1 }]], ['itens', 'Itens', ['key']], ['weapon', 'Armas', ['sword']], ['head', 'Cabeça', ['helm']], ['chest', 'Armadura', ['chest']],
  ['offhand', 'Secundário', ['shield']], ['legs', 'Pernas', ['legs']], ['acc', 'Acessórios', ['ring']], ['reliq', 'Relíquias', ['gem']], ['mat', 'Materiais', ['wood']], ['moedas', 'Moedas', ['bag']], ['peixe', 'Peixe', ['fish']], ['lixo', 'Lixo', ['junk']]];
function stackCat(k) {
  const d = ITEMS[k]; if (k === 'peixe' || k === 'lixo') return k; if (k === 'ouro_saco') return 'moedas'; if (k === 'gema') return 'reliq';
  if (d.kind === 'pot') return 'cura'; if (d.kind === 'key' || d.kind === 'tool') return 'itens'; return 'mat';
}
function invEntries(cat) {
  const out = [], all = !!P.q;
  if (cat === 'novo' && !all) { for (const id of S.newIds) { const it = itemById(id); if (it) out.push({ g:it }); } return out; }
  for (const k in S.inv) if (S.inv[k] > 0 && ITEMS[k] && (all || stackCat(k) === cat)) out.push({ k, n:S.inv[k] });
  S.bag.forEach((it, i) => { if (all || it.slot === cat) out.push({ g:it, i }); });
  return out;
}
const entName = e => e.g ? e.g.name : ITEMS[e.k].n;
function invGrid() {
  let list = invEntries(P.cat); const q = norm(P.q.trim());
  if (q) list = list.filter(e => norm(entName(e)).includes(q));
  const srt = { rec:(a, b) => (b.i || 0) - (a.i || 0), nome:(a, b) => entName(a).localeCompare(entName(b)), qual:(a, b) => (b.g ? b.g.q : 0) - (a.g ? a.g.q : 0), tier:(a, b) => (b.g ? b.g.tier * 10 + b.g.q : 0) - (a.g ? a.g.tier * 10 + a.g.q : 0) }[P.sort];
  list.sort(srt);
  let h = '';
  if (P.cat === 'cura' && !q) { const st = stats(); h += '<div class="card"><div class="row"><span class="num">PV ' + fmt(S.hp) + '/' + fmt(st.hp) + ' · PM ' + fmt(S.mp) + '/' + fmt(st.mp) + '</span>' + btn('healall', 'Curar tudo', '', 'sm gold') + '</div><span class="fine">Usa as poções mais fracas primeiro até encher.</span></div>'; }
  if (P.cat === 'novo' && !q && list.length) h += '<div class="row" style="margin-bottom:8px"><span class="fine">' + list.length + ' novo(s)</span>' + btn('seenall', 'Marcar como visto') + '</div>';
  if (!list.length) return h + '<p class="empty">' + (q ? 'Nada encontrado.' : 'Vazio.') + '</p>';
  return h + '<div class="' + (P.view === 'grid' ? 'grid' : 'list') + '">' + list.map(e => e.g
    ? '<button class="it" data-act="item" data-id="' + e.g.id + '">' + iconImg(e.g, 44) + '<span class="' + qCls(e.g) + '">' + gName(e.g) + '</span>' + (isEquipped(e.g) ? '<i style="background:var(--blue);color:#fff">E</i>' : S.newIds.includes(e.g.id) ? '<i>novo</i>' : '') + '</button>'
    : '<button class="it" data-act="stack" data-k="' + e.k + '">' + iconImg(e.k, 44) + '<span>' + ITEMS[e.k].n + '</span><i>' + fmt(e.n) + '</i></button>').join('') + '</div>';
}
function hInv() {
  const nNew = S.newIds.filter(itemById).length;
  return '<div class="invbar"><input id="inv-q" type="search" placeholder="Buscar..." value="' + esc(P.q) + '" aria-label="Buscar no inventário" autocomplete="off">' +
    '<select id="inv-sort" aria-label="Ordenar">' + [['rec', 'Recentes'], ['nome', 'Nome'], ['qual', 'Qualidade'], ['tier', 'Tier']].map(([k, l]) => '<option value="' + k + '"' + (P.sort === k ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>' +
    '<div class="vt"><button data-act="view" data-v="grid" class="' + (P.view === 'grid' ? 'on' : '') + '" aria-label="Ver em grade">▦</button><button data-act="view" data-v="list" class="' + (P.view === 'list' ? 'on' : '') + '" aria-label="Ver em lista">☰</button></div></div>' +
    '<p class="fine">Mochila: ' + unequipped().length + ' / 60 equipamentos soltos</p>' +
    '<div class="inv"><nav class="cats" aria-label="Categorias">' + CATS.map(([k, l, ic]) => '<button class="' + (P.cat === k && !P.q ? 'on' : '') + '" data-act="cat" data-k="' + k + '">' + iconImg(ic, 22) + l + (k === 'novo' && nNew ? ' (' + nNew + ')' : '') + '</button>').join('') + '</nav><div id="inv-grid">' + invGrid() + '</div></div>';
}
function mItem(id) {
  const it = itemById(id); if (!it) return '<p class="empty">O item não está mais na mochila.</p><div class="row"><span></span>' + btn('closemodal', 'Fechar') + '</div>';
  const eqSets = SETS.filter(st => Object.values(S.sets[st] || {}).includes(it.id)), wear = canWear(it);
  let h = '<div class="row l" style="gap:14px">' + iconImg(it, 64) + '<div style="min-width:0"><h3 class="' + qCls(it) + '">' + gName(it) + '</h3><p class="fine">' + SLOT_LBL[it.slot] + ' · ' + stars(it.tier) + ' · ' + typeLbl(it.type) + '</p></div></div>';
  h += '<div class="row l" style="gap:6px;flex-wrap:wrap">' + qTag(it) + (it.lvl > 1 ? '<span class="badge">Melhoria +' + (it.lvl - 1) + '</span>' : '') + '<span class="badge">Vale ' + fmt(Math.round(gearPrice(it) * .4)) + ' ouro</span></div>';
  h += '<div class="grid2">' + Object.entries(gearStats(it)).map(([k, v]) => '<div class="kv"><span>' + STAT_LBL[k] + '</span><b class="num">+' + v + '</b></div>').join('') + '</div>';
  if (it.slot === 'offhand') h += '<p class="fine">Comando em batalha: <b>' + OFF_CMD[it.type].n + '</b> — ' + OFF_CMD[it.type].d + '.</p>';
  if (!wear) h += '<p class="lack">' + CLASSES[S.cls].n + ' não usa este tipo de equipamento.</p>';
  else { const cur = equippedIn('padrao', slotFor(it, 'padrao')); h += '<p class="fine">Comparado ao Padrão: ' + (cur === it ? 'é o equipado' : (deltaVs(it, cur) || 'igual')) + '</p>'; }
  h += '<p class="sub">Conjuntos</p><div class="tabs">' + SETS.map(st => { const on = eqSets.includes(st); return btn(on ? 'unequipset' : 'equipset', (on ? '✓ ' : '') + SET_LBL[st], 'data-id="' + it.id + '" data-set="' + st + '"' + (!on && !wear ? ' disabled' : '') + ' aria-pressed="' + on + '"', on ? 'sm sel' : 'sm'); }).join('') + '</div>';
  h += '<p class="fine">Toque num conjunto para equipar ou tirar o item dele.</p><div class="row"><span></span>' + btn('closemodal', 'Fechar') + '</div>';
  return h;
}
function mStack(k) {
  const d = ITEMS[k], n = S.inv[k] || 0;
  let h = '<div class="row l" style="gap:14px">' + iconImg(k, 64) + '<div><h3>' + d.n + '</h3><p class="fine">Você tem ×' + fmt(n) + (d.price ? ' · vende por ' + fmt(d.price) + ' ouro cada' : '') + '</p></div></div><p>' + d.d + '</p>';
  let act = '';
  if (d.kind === 'pot') act = btn('use', 'Usar', 'data-k="' + k + '"' + (n ? '' : ' disabled'), 'sm gold');
  else if (k === 'peixe') act = btn('eat', 'Comer · +40 PV', n ? '' : 'disabled', 'sm gold');
  else if (k === 'lixo') act = btn('sortjunk', 'Separar tudo', n ? '' : 'disabled', 'sm gold');
  else if (k === 'linha') act = '<span class="fine">Toque na água perto de você.</span>';
  return h + '<div class="row"><span>' + act + '</span>' + btn('closemodal', 'Fechar') + '</div>';
}

/* ---------- Equipamento (boneco) ---------- */
const SET_NOTE = { padrao:'Usado no mapa e contra chefes do mapa.', masmorra:'Usado nas masmorras. Espaços vazios usam o item do Padrão.', pvp:'Usado na arena. Espaços vazios usam o item do Padrão.' };
function hEquip() {
  const set = P.set;
  let h = '<div class="seg" role="tablist">' + SETS.map(k => '<button class="btn ' + (set === k ? 'sel' : '') + '" role="tab" aria-selected="' + (set === k) + '" data-act="eqset" data-k="' + k + '">' + SET_LBL[k] + '</button>').join('') + '</div><p class="fine">' + SET_NOTE[set] + '</p>';
  const cell = sl => {
    const it = equippedIn(set, sl), inh = it && set !== 'padrao' && !(S.sets[set] || {})[sl];
    return '<button class="slot" data-act="slot" data-sl="' + sl + '"><span class="sl">' + SLOT_LBL[sl] + '</span><span class="fr">' + (it ? iconImg(it, 48) : '+') + '</span><span class="nm ' + (it ? qCls(it) : 'empty') + '">' + (it ? gName(it) : 'Vazio') + '</span>' + (inh ? '<span class="st">do Padrão</span>' : '') + '</button>';
  };
  h += '<div class="doll"><img class="pix ghost" src="' + sprUrl(heroMini(false)) + '" alt=""><span></span>' + cell('head') + '<span></span>' + cell('weapon') + cell('chest') + cell('offhand') + cell('acc1') + cell('legs') + cell('acc2') + '</div>';
  const st = stats(set);
  h += box('Resumo · ' + SET_LBL[set], '<div class="grid2">' + [['hp', 'PV'], ['mp', 'PM'], ['atk', 'Ataque'], ['mag', 'Magia'], ['def', 'Defesa'], ['res', 'Resistência'], ['dex', 'Destreza'], ['crit', 'Crítico']].map(([k, l]) => '<div class="kv"><span>' + l + '</span><b class="num">' + fmt(st[k]) + (k === 'crit' ? '%' : '') + '</b></div>').join('') + '</div>' +
    (set !== 'padrao' ? '<div class="row" style="margin-top:10px">' + btn('copyset', 'Copiar do Padrão', 'data-set="' + set + '"') + btn('clearset', 'Limpar', 'data-set="' + set + '"') + '</div>' : ''));
  return h;
}
function mSlot(sl, set) {
  const kind = slotKind(sl), cur = equippedIn(set, sl), own = (S.sets[set] || {})[sl] && cur;
  const cands = S.bag.filter(it => it.slot === kind && canWear(it) && it !== cur).sort((a, b) => gearPrice(b) - gearPrice(a));
  let h = '<h3>' + SLOT_LBL[sl] + '</h3><p class="fine">Conjunto ' + SET_LBL[set] + '</p>';
  if (cur) h += '<div class="card hl"><div class="row l" style="gap:10px">' + iconImg(cur, 40) + '<div style="flex:1;min-width:0">' + qSpan(cur) + '<div class="fine">' + gearLine(cur) + '</div></div></div><div class="row"><span class="fine">' + (own ? 'Equipado' : 'Herdado do Padrão') + '</span>' + (own ? btn('slotoff', 'Remover', 'data-sl="' + sl + '" data-set="' + set + '"') : '') + '</div></div>';
  h += cands.length ? cands.map(it => '<div class="card"><div class="row l" style="gap:10px">' + iconImg(it, 40) + '<div style="flex:1;min-width:0"><div class="row">' + qSpan(it) + qTag(it) + '</div><div class="fine">' + stars(it.tier) + ' · ' + gearLine(it) + '</div><div class="fine">' + (deltaVs(it, cur) || 'igual') + '</div></div></div><div class="row"><span></span>' + btn('sloton', 'Equipar', 'data-id="' + it.id + '" data-sl="' + sl + '" data-set="' + set + '"', 'sm gold') + '</div></div>').join('')
    : '<p class="empty">Nada na mochila que sua classe possa usar aqui.</p>';
  return h + '<div class="row"><span></span>' + btn('closemodal', 'Fechar') + '</div>';
}

/* =============== Classes (caminhos) =============== */
const PATH_IC = { guerreiro:['sword', { metal:'#d8e0ec' }], mago:['staff', { orb:'#6e8cff' }], ladino:['dagger', { metal:'#d8e0ec' }] };
function clState(k) {
  const c = CLASSES[k], t = c.tier; if (S.cls === k) return 'cur'; if (S.classes.includes(k)) return 'own';
  const reqOk = !c.req || c.req.some(r => S.classes.includes(r)), lvOk = t === 1 ? S.lvl >= 5 : S.lvl >= TIER_CAP[t - 1];
  return reqOk && lvOk ? 'avail' : 'lock';
}
const CL_LBL = { cur:'Classe atual', own:'Desbloqueada', avail:'Pronta para desbloquear', lock:'Bloqueada' };
function clCard(k, two) {
  const c = CLASSES[k], s = clState(k), sp = s === 'lock' ? silhouette(classSpr(k)) : classSpr(k);
  const ph = c.skills.filter(([, id]) => SKILL_KIND(id) === 'fis').length, mg = c.skills.length - ph;
  return '<button class="cl' + (two ? ' two' : '') + (s === 'cur' ? ' cur' : '') + '" data-act="clinfo" data-k="' + k + '">' + sprImg(sp, two ? 72 : 64) + '<b>' + c.n + '</b><span style="' + (s === 'avail' ? 'color:var(--gold)' : s === 'cur' ? 'color:#9ab4ff' : '') + '">' + CL_LBL[s] + '</span>' +
    '<span class="sk">' + iconImg(['sword', { metal:'#d8e0ec' }], 18) + ph + ' ' + iconImg(['spark'], 18) + mg + '</span></button>';
}
function vClasses() {
  const pk = P.path || pathOf(), PA = PATHS[pk];
  let h = '<div class="pathbar"><button data-act="path" data-d="-1" aria-label="Caminho anterior">‹</button><div><small>' + PA.n + '</small><b>' + iconImg(PATH_IC[pk], 26) + PA.v.toUpperCase() + '</b></div><button data-act="path" data-d="1" aria-label="Próximo caminho">›</button></div>';
  h += '<p class="fine" style="text-align:center">Classes desbloqueadas podem ser trocadas a qualquer hora, e as habilidades aprendidas valem em todas. Novos tiers liberam a cada 25 níveis. O nível do herói evolui até 250; classes avançadas são compradas com essências.</p>';
  PA.tiers.forEach((list, ti) => {
    const t = ti + 1;
    if (ti) h += '<div class="chev" aria-hidden="true">︾</div>';
    h += '<div class="tier"><span class="st">' + stars(t) + '</span><span class="lv">NÍVEL ' + (t === 1 ? 1 : TIER_CAP[t - 1]) + '</span></div>';
    const cards = list.map(k => clCard(k, list.length > 1)).join('');
    h += list.length > 1 ? '<div class="duo">' + cards + '</div>' : cards;
  });
  h += box('Especialização', '<p class="fine">A partir do nível 20. Vale para qualquer classe. A primeira escolha é grátis; trocar custa 2.000 essências.</p>' + Object.keys(SPECS).map(k => {
    const sp = SPECS[k], cost = S.specUsed ? 2000 : 0, on = S.spec === k;
    return '<div class="srow"><span style="min-width:0"><b>' + sp.n + '</b><br><span class="fine">' + sp.d + '</span></span>' + (on ? '<span class="badge y">Ativa</span>' : S.lvl < 20 ? '<span class="badge">Nível 20</span>' : btn('spec', cost ? 'Trocar · ' + fmt(cost) : 'Escolher', 'data-k="' + k + '"' + (S.ess < cost ? ' disabled' : ''))) + '</div>';
  }).join(''));
  return h;
}
function mClass(k) {
  const c = CLASSES[k], s = clState(k), t = c.tier, pk = PATH_OF[k];
  let h = '<div class="row l" style="gap:14px">' + sprImg(s === 'lock' ? silhouette(classSpr(k)) : classSpr(k), 72) + '<div><h3>' + c.n + '</h3><p class="fine">' + PATHS[pk].n + ' · ' + stars(t) + ' · ' + CL_LBL[s] + '</p></div></div><p>' + c.d + '</p>';
  h += '<div class="grid2">' + [['hp', 'PV'], ['mp', 'PM'], ['atk', 'Ataque'], ['mag', 'Magia'], ['def', 'Defesa'], ['res', 'Resistência'], ['dex', 'Destreza']].map(([q, l]) => '<div class="kv"><span>' + l + '</span><b class="num">×' + c.m[q].toFixed(2).replace('.', ',') + '</b></div>').join('') + '</div>';
  h += '<p class="sub">Habilidades</p>' + c.skills.map(([lv, id]) => '<div class="lrow">' + skIcon(id, 24) + '<span style="flex:1;min-width:0">' + SKILLS[id].n + '<br><span class="fine">' + SKILLS[id].d + '</span></span><span class="badge">Nv ' + lv + '</span></div>').join('');
  h += '<p class="sub">Equipamento</p><p class="fine">Usa itens de ' + c.gear.map(g => CLASSES[g].n).join(' e ') + ', além de acessórios.</p>';
  h += '<p class="sub">Passivas neste tier</p>' + PASSIVES[pk].map(p => '<div class="prow">' + iconImg(['star'], 20) + '<b>' + p.n + '</b><span>' + p.d(t) + '</span></div>').join('');
  if (c.req) h += '<p class="fine">Requer ' + c.req.map(r => (S.classes.includes(r) ? '✓ ' : '') + CLASSES[r].n).join(' ou ') + ' e nível ' + TIER_CAP[t - 1] + '.</p>';
  else if (!S.classes.includes(k)) h += '<p class="fine">Classe inicial de outro caminho. Libera no nível 5.</p>';
  let act;
  if (s === 'cur') act = '<span class="badge y">Classe atual</span>';
  else if (s === 'own') act = btn('setcls', 'Usar esta classe', 'data-k="' + k + '"', 'sm gold');
  else if (s === 'avail') act = btn('unlock', 'Desbloquear · ' + fmt(c.cost) + ' essências', 'data-k="' + k + '"' + (S.ess < c.cost ? ' disabled' : ''), 'sm gold');
  else act = '<span class="fine">Ainda bloqueada.</span>';
  return h + '<div class="row">' + act + btn('closemodal', 'Fechar') + '</div>';
}

/* =============== Habilidades e seguidor =============== */
function vSkills() {
  let h = banner('Habilidades', 'Leve até 6 para a batalha · ' + S.equipped.length + '/6 equipadas');
  h += '<div class="sk6">' + Array.from({ length:6 }, (_, i) => { const id = S.equipped[i]; return id ? '<button class="sk6b" data-act="equipsk" data-id="' + id + '" aria-label="Tirar ' + SKILLS[id].n + '">' + skIcon(id, 32) + '<span>' + SKILLS[id].n + '</span></button>' : '<span class="sk6b empty">Vazio</span>'; }).join('') + '</div>';
  h += '<p class="sub">Aprendidas · ' + S.skills.length + '</p>' + S.skills.map(id => {
    const s = SKILLS[id], on = S.equipped.includes(id), el = s.elem && s.elem !== 'neutro' ? ' · ' + ELEM[s.elem] : s.elem === 'neutro' ? ' · sem elemento' : '';
    return '<div class="card' + (on ? ' hl' : '') + '"><div class="row l" style="gap:10px">' + skIcon(id, 32) + '<div style="flex:1;min-width:0"><div class="row"><b>' + s.n + '</b><span class="badge">' + s.mp + ' PM</span></div><span class="fine">' + s.d + el + '</span></div></div><div class="row"><span class="fine">' + (SKILL_KIND(id) === 'fis' ? 'Física' : 'Mágica') + '</span>' + btn('equipsk', on ? 'Tirar' : 'Equipar', 'data-id="' + id + '"', on ? 'sm sel' : 'sm') + '</div></div>';
  }).join('');
  const next = []; for (const k of S.classes) for (const [lv, id] of CLASSES[k].skills) if (!S.skills.includes(id) && !next.some(n => n[1] === id)) next.push([lv, id]);
  if (next.length) h += '<p class="sub">Próximas</p>' + next.sort((a, b) => a[0] - b[0]).map(([lv, id]) => '<div class="card" style="opacity:.72"><div class="row l" style="gap:10px">' + skIcon(id, 32) + '<div style="flex:1;min-width:0"><b>' + SKILLS[id].n + '</b><div class="fine">' + SKILLS[id].d + '</div></div><span class="badge">Nível ' + lv + '</span></div></div>').join('');
  return h;
}
function vPet() {
  let h = banner('Seguidor', 'Luta sozinho ao seu lado');
  if (!S.pets.length) return h + '<p class="empty">Nenhum seguidor ainda. Construa um Bestiário na sua vila ou visite o de Forja Velha.</p>';
  h += S.pets.map((p, i) => {
    const d = PETS[p.key], on = S.pet === i;
    return '<div class="card' + (on ? ' hl' : '') + '"><div class="row l" style="gap:10px">' + sprImg(petMini(p.key), 48) + '<div style="flex:1;min-width:0"><b>' + d.n + '</b><div class="fine">' + stars(d.tier) + ' · ' + d.moves.map(([m]) => PET_MOVES[m].n).join(', ') + '</div>' + (on ? '<div class="fine">PV: ' + Math.round((S.petHp === undefined ? 1 : S.petHp) * 100) + '%</div>' : '') + '</div>' + (on ? '<span class="badge y">Ativo</span>' : btn('setpet', 'Levar', 'data-i="' + i + '"')) + '</div></div>';
  }).join('');
  if (S.pet >= 0) h += '<div class="row"><span></span>' + btn('setpet', 'Deixar em casa', 'data-i="-1"') + '</div>';
  return h;
}

/* =============== Codex =============== */
const CODEX_CATS = [
  ['basico', 'Informações básicas e tutoriais', 'Comece por aqui', ['book']],
  ['avancado', 'Tópicos avançados', 'Mecânicas em detalhe', ['scroll']],
  ['modos', 'Modos de jogo e atividades', 'O que fazer em Vaelmar', ['sword', { metal:'#d8e0ec' }]],
  ['monstros', 'Monstros', '', null],
  ['constr', 'Construções', 'Sua vila de origem', ['house']],
  ['status', 'Efeitos de status (buffs e debuffs)', 'O que cada efeito faz', ['crit', { col:'#ffe14a' }]],
  ['npcs', 'NPCs', 'Quem é quem', ['npc']],
];
const CODEX_TXT = {
  basico:[
    ['Andar pelo mundo', 'Toque no chão para andar até lá: o herói desvia sozinho dos obstáculos. Toque num monstro para lutar, num lugar (cidade, masmorra, portal) para ir até ele e na água para pescar. A névoa escura cobre regiões de nível alto; ela some quando você chega ao nível mínimo da região.'],
    ['Batalhas por turnos', 'Você age, depois o seu seguidor, depois os inimigos. Atacar recupera um pouco de PM; habilidades gastam PM. O comando da mão secundária muda com o item: escudo bloqueia, tomo concentra mana e adaga de aparar revida o próximo golpe. Fugir depende da destreza e não funciona contra chefes.'],
    ['Níveis e tiers', 'O herói chega ao nível 250. Novos tiers liberam nos níveis 25, 50, 75, 100, 125, 150, 175, 200 e 225. Desbloqueie classes com essências; habilidades aprendidas ficam disponíveis nos outros caminhos.'],
    ['Equipamentos', 'São sete espaços: arma, secundário, cabeça, tronco, pernas e dois acessórios. Cada item tem um tier (Bronze, Ferro, Aço, Rúnico, Mítico) e uma qualidade, de Quebrado a Ornado. A qualidade multiplica os atributos, então um item Lendário de tier baixo pode valer mais que um Padrão de tier alto.'],
    ['Itens e cura', 'Poções recuperam PV, éteres recuperam PM e o antídoto remove veneno, queimadura, cegueira e paralisia. No inventário, em Curativos, o botão Curar tudo usa as poções mais fracas primeiro. Estalagens e a casa da sua vila curam tudo.'],
    ['Derrota', 'Se os seus PV chegarem a zero, você acorda na última cidade visitada com metade da vida. Você não perde ouro nem itens.'],
  ],
  avancado:[
    ['Dano e defesa', 'Golpes físicos usam Ataque contra a Defesa do alvo; magias usam Magia contra a Resistência. Quanto maior o ataque em relação à defesa, mais o dano cresce. Críticos causam 50% a mais.'],
    ['Elementos', 'Fogo, Água, Terra, Raio, Sagrado, Sombrio e Arcano. Uma fraqueza dobra o dano, uma resistência corta pela metade e uma imunidade anula. Magias sem elemento nunca são resistidas. O Codex anota cada elemento que você testar em cada monstro.'],
    ['Iniciativa', 'No começo da batalha, quem tem mais iniciativa age primeiro. Ela vem da destreza e do tier da classe. Se um inimigo for mais rápido, ele ataca antes do seu primeiro turno.'],
    ['Distância de visão', 'Do minuto 25 ao 45 de cada hora é noite e o mapa escurece. A luz em volta do herói tem o tamanho da sua distância de visão, que cresce com o tier da classe.'],
    ['Conjuntos de equipamento', 'Monte três conjuntos: Padrão (mapa), Masmorra e PvP (arena). O jogo usa o conjunto certo sozinho, conforme o lugar. Espaços vazios nos conjuntos Masmorra e PvP usam o item do Padrão.'],
    ['Passivas de caminho', 'Cada caminho tem passivas que crescem com o tier da classe atual. Guerreiro: proficiência em armas e dano colateral em outro inimigo. Mago: afinidade arcana e eco mágico, que repete parte da magia. Ladino: mãos leves, que rendem mais ouro, e reflexos, que dão esquiva.'],
    ['Especialização', 'A partir do nível 20 você escolhe uma especialização que vale para qualquer classe: Berserker, Guardião, Clérigo ou Domador. A primeira escolha é grátis; trocar custa essências.'],
    ['Clima', 'Às vezes chove. Na chuva, Minhocões saem da terra. À noite, esqueletos, fantasmas e vampiros rondam o mapa. O relógio no canto da tela mostra se é dia ou noite.'],
  ],
  modos:[
    ['Missões da história', 'A Capitã Mirela, em Alvorada, e a Ferreira Odete, em Forja Velha, contam a história de Vaelmar. Cumpra o objetivo e volte para entregar a missão.'],
    ['Trabalhos diários', 'Três caçadas novas por dia. Entregue em qualquer estalagem para ganhar ouro e essências.'],
    ['Desafio da Aurora', 'Derrote chefes para receber selos de invocação. A partir do nível 5, use um selo no botão Desafio para enfrentar o Guardião da Aurora. Cada vitória dá três medalhas, trocadas por prêmios. A derrota consome o selo.'],
    ['Chefes do mapa', 'Cada região tem um chefe que aparece de vez em quando, marcado com uma aura vermelha. Chefes deixam chaves de masmorra e fichas da arena.'],
    ['Masmorras', 'Andares seguidos sem cura entre eles. Entrar gasta chaves. No último andar espera um chefe; no fim, ouro, essências e dois equipamentos melhores. Usa o conjunto Masmorra.'],
    ['Arena', 'Lutas contra heróis rivais, pagas com uma ficha. Vida e mana enchem antes, poções são proibidas e o resultado não afeta os seus PV. Usa o conjunto PvP.'],
    ['Vila de origem', 'A oeste de Alvorada. Construa loja, casa, bestiário, ferreiro e prefeitura com ouro, madeira e pedra. A partir do nível 3, o botão Origem leva você até lá na hora.'],
    ['Coleta e santuários', 'Árvores, pedras e baús com um brilho podem ser coletados com um toque. Santuários dão XP ou ouro em dobro por 10 minutos.'],
    ['Pesca', 'Com uma linha de pesca, toque na água perto de você. Lance com a barra perto do meio e puxe quando o peixe morder. Às vezes vem lixo, que dá pedra; às vezes, algo grande sai da água.'],
    ['Portais', 'Descubra portais andando até eles. Do lado de um portal, viaje para qualquer outro já descoberto. Liberam no nível 5.'],
  ],
};
const NPC_PAL = { mirela:{ a:'#b8b8c8', h:'#c9453a', helm:1, tool:'spear', cape:'#8a2b2a' }, odete:{ a:'#8a6a3a', h:'#8a2b2a', apron:'#5a3d2b', tool:'hammer' }, bento:{ a:'#3a8f6a', h:'#6b4423', apron:'#efe3c4', beard:1 },
  nina:{ a:'#7a46b0', h:'#c8902a', tool:'bag' }, iara:{ a:'#c89a3a', h:'#3a5a2a', hood:1 }, varek:{ a:'#5a6a8a', h:'#2a2a3a', helm:1, cape:'#3a3a4a', beard:1, tool:'spear' } };
const npcImg = (k, sz = 48) => sprImg(spr('human', NPC_PAL[k]), sz);
const NPCS = [
  ['mirela', 'Capitã Mirela', 'Alvorada', 'Guarda a cidade e dá as primeiras missões da história.'],
  ['odete', 'Ferreira Odete', 'Forja Velha', 'Assume a história depois da Capitã. Conhece cada martelo da cidade.'],
  ['bento', 'Bento, o estalajadeiro', 'Estalagens', 'Cama, sopa quente e o quadro de trabalhos diários.'],
  ['nina', 'Nina, a lojista', 'Lojas', 'Poções, linhas de pesca, madeira e pedra. Compra o que você não quer.'],
  ['iara', 'Iara, a tratadora', 'Bestiário de Forja Velha', 'Cuida dos filhotes e entrega seguidores a quem paga bem.'],
  ['varek', 'Mestre Varek', 'Arena dos Carvalhos', 'Organiza as lutas contra heróis de outras terras.'],
];
const BUFF_INFO = [['Proteção', 'Defesa +50% por 3 turnos.'], ['Fortalecer', 'Ataque +40% por 3 turnos.'], ['Fúria', 'Ataque alto e defesa baixa por 3 turnos.'], ['Concentração', 'Magia +30% por 3 turnos.'], ['Passo Sombrio', 'Esquiva muito maior por 3 turnos.'], ['Barreira', 'Escudo que absorve dano até quebrar.'], ['Sabedoria e Sorte', 'Santuários do mapa: XP ou ouro em dobro por 10 minutos.']];
function vCodex() {
  const seen = Object.keys(S.codex).filter(k => MON[k] && k !== 'rival'), total = Object.keys(MON).filter(k => k !== 'rival').length;
  if (!P.data) {
    return banner('Codex', 'Tudo o que você sabe sobre Vaelmar') + CODEX_CATS.map(([k, n, sub, ic]) =>
      '<button class="ccard" data-act="codex" data-k="' + k + '">' + (ic ? iconImg(ic, 48) : sprImg(monMini('slime'), 48)) + '<b>' + n + '</b><span>' + (k === 'monstros' ? seen.length + ' de ' + total + ' descobertos · ' + codexCount() + ' completos' : sub) + '</span></button>').join('');
  }
  const cat = CODEX_CATS.find(c => c[0] === P.data);
  let h = banner(cat[1], cat[0] === 'monstros' ? seen.length + ' de ' + total + ' descobertos' : cat[2]);
  if (CODEX_TXT[P.data]) h += CODEX_TXT[P.data].map(([t], i) => '<button class="ccard" data-act="topic" data-i="' + i + '">' + iconImg(cat[3], 40) + '<b style="font-size:17px">' + t + '</b><span>Toque para ler</span></button>').join('');
  else if (P.data === 'monstros') {
    if (!seen.length) h += '<p class="empty">Lute com monstros para registrá-los. Uma entrada fica completa quando você vê todos os golpes, drops e elementos.</p>';
    h += seen.sort((a, b) => !!MON[b].boss - !!MON[a].boss || MON[a].n.localeCompare(MON[b].n)).map(k => {
      const d = MON[k], c = S.codex[k], done = codexDone(k);
      return '<button class="ccard" data-act="cxopen" data-k="' + k + '">' + sprImg(monMini(k), 48) + '<b style="font-size:17px;' + (done ? 'color:var(--gold)' : '') + '">' + d.n + (done ? ' ✓' : '') + '</b><span>' + d.fam + (d.boss ? ' · chefe' : '') + ' · ' + c.kills + ' derrotados</span></button>';
    }).join('');
  } else if (P.data === 'constr') {
    h += '<p class="fine">Construa na sua vila de origem, a oeste de Alvorada.</p>' + Object.keys(BUILDINGS).map(k => { const b = BUILDINGS[k], lv = S.town[k]; return '<div class="card' + (lv ? ' hl' : '') + '"><div class="row l" style="gap:10px">' + iconImg(['house', { col:lv ? '#c8483a' : '#6a6a6a' }], 36) + '<div style="flex:1;min-width:0"><div class="row"><b class="t">' + b.n + '</b><span class="badge' + (lv ? ' y' : '') + '">' + (lv ? (b.max > 1 ? 'Nível ' + lv + '/' + b.max : 'Construído') : 'Não construído') + '</span></div><span class="fine">' + b.d + '</span></div></div></div>'; }).join('');
  } else if (P.data === 'status') {
    h += '<p class="sub">Efeitos negativos</p>' + Object.values(STATUS).map(s => '<div class="lrow"><i style="width:14px;height:14px;border-radius:3px;flex:0 0 auto;background:' + s.col + '"></i><span><b>' + s.n + '</b><br><span class="fine">' + s.d + '</span></span></div>').join('');
    h += '<p class="sub">Efeitos positivos</p>' + BUFF_INFO.map(([n, d]) => '<div class="lrow">' + iconImg(['arrowup'], 20) + '<span><b>' + n + '</b><br><span class="fine">' + d + '</span></span></div>').join('');
  } else if (P.data === 'npcs') {
    h += NPCS.map(([k, n, w, d]) => '<div class="card"><div class="row l" style="gap:10px">' + npcImg(k, 56) + '<div style="flex:1;min-width:0"><b class="t">' + n + '</b><div class="fine">' + w + '</div><span class="fine">' + d + '</span></div></div></div>').join('');
  }
  return h;
}
function mTopic(cat, i) { const [t, d] = CODEX_TXT[cat][i]; return '<h3>' + t + '</h3><p style="font-size:17px;line-height:1.5">' + d + '</p><div class="row"><span></span>' + btn('closemodal', 'Fechar', '', 'gold') + '</div>'; }
function mMon(k) {
  const d = MON[k], c = cx(k), unk = '<span class="q-unknown">???</span>';
  const elRow = (lbl, list) => '<div class="kv"><span>' + lbl + '</span><b>' + (list && list.length ? list.map(e => c.el[e] ? ELEM[e] : unk).join(', ') : 'nenhuma') + '</b></div>';
  return '<div class="row l" style="gap:12px">' + sprImg(monMini(k), 64) + '<div><h3>' + d.n + '</h3><p class="fine">' + d.fam + (d.boss ? ' · chefe' : '') + (d.night ? ' · aparece à noite' : '') + (d.rain ? ' · aparece na chuva' : '') + '</p><p class="fine">' + c.kills + ' derrotados' + (codexDone(k) ? ' · <b style="color:var(--gold)">completo</b>' : '') + '</p></div></div>' +
    '<p class="sub">Golpes</p>' + d.moves.map(([m]) => '<div class="kv"><span>' + (c.moves[m] ? MOVES[m].n : unk) + '</span><b>' + (c.moves[m] && MOVES[m].elem ? ELEM[MOVES[m].elem] : '') + '</b></div>').join('') +
    '<p class="sub">Drops</p>' + ((d.drops || []).length ? d.drops.map(([i]) => '<div class="lrow">' + (c.drops[i] ? iconImg(i, 24) + ITEMS[i].n : unk) + '</div>').join('') : '<span class="fine">nenhum</span>') +
    '<p class="sub">Elementos</p>' + elRow('Fraquezas', d.weak) + elRow('Resistências', d.res) + elRow('Imunidades', d.immune) + '<span class="fine">Acerte o monstro com cada elemento para descobrir.</span>' +
    '<div class="row"><span></span>' + btn('closemodal', 'Fechar') + '</div>';
}

/* =============== Missões e mapa =============== */
function vQuests() { return banner('Missões', 'História e trabalhos do dia') + tabsRow([['story', 'História'], ['daily', 'Trabalhos']], P.tab) + (P.tab === 'daily' ? pDaily(false) : pStory()); }
function pStory() {
  const q = curQuest();
  if (!q) return '<div class="card hl"><b class="t">A história terminou</b><span class="fine">Vaelmar está a salvo. Siga caçando chefes, subindo a arena e completando o Codex.</span></div>';
  const done = S.quest.ready;
  return '<div class="card hl"><div class="row"><b class="t" style="font-size:19px">' + q.n + '</b>' + (done ? '<span class="badge y">Pronta</span>' : '') + '</div><span>' + q.d + '</span><span class="fine">' + questProgress(q) + '</span>' +
    '<span class="fine">Dada por ' + q.npc + ', em ' + POI[q.town].n + '. Recompensa: ' + rewardLine(q.rw) + '</span>' + (done ? '<span style="color:var(--gold)">Volte a ' + POI[q.town].n + ' para entregar.</span>' : '') + '<div class="row"><span></span>' + btn('goto', 'Ir até ' + POI[q.town].n, 'data-id="' + q.town + '"') + '</div></div>' +
    '<p class="sub">Concluídas</p>' + (S.quest.i ? STORY.slice(0, S.quest.i).reverse().map(x => '<div class="card"><b>' + x.n + '</b><span class="fine">' + x.npc + '</span></div>').join('') : '<p class="empty">Nenhuma ainda.</p>');
}
function pDaily(inTown) {
  ensureDaily();
  return '<p class="fine">Trabalhos do dia. Renovam à meia-noite.' + (inTown ? '' : ' Entregue em qualquer estalagem.') + '</p>' + S.daily.list.map((j, i) => {
    const ok = j.have >= j.need;
    return '<div class="card' + (ok && !j.claimed ? ' hl' : '') + '"><div class="row l" style="gap:10px">' + sprImg(monMini(j.mon), 40) + '<div style="flex:1;min-width:0"><b>Derrote ' + j.need + ' ' + MON[j.mon].n + '</b><div class="fine">' + Math.min(j.have, j.need) + '/' + j.need + ' · ' + fmt(j.rw.ouro) + ' ouro · ' + fmt(j.rw.ess) + ' essências</div></div>' +
      (j.claimed ? '<span class="badge">Entregue</span>' : ok && inTown ? btn('claimjob', 'Entregar', 'data-i="' + i + '"', 'sm gold') : '') + '</div></div>';
  }).join('');
}
function vMap() {
  const visited = S.regions || {};
  return '<h2 class="dec sheet-h">Atlas de Vaelmar</h2><p class="fine">Regiões liberam pelo nível do herói. Toque no mapa para caminhar; os botões viajam para as cidades das regiões já visitadas.</p><div class="mapbox"><canvas id="cv-map" width="' + WW*4 + '" height="' + WH*4 + '"></canvas></div><div class="region-list">' + Object.entries(ZONES).filter(([k])=>k!=='~').map(([k,z])=> {
    const dest = Object.values(POI).find(p=>p.zone===k && p.kind==='town') || (k==='B' ? POI.alvorada : k==='O' ? POI.origem : k==='F' ? POI.forja : null);
    return '<button class="btn" data-act="atlastravel" data-id="'+(dest?dest.id:'')+'" '+(!dest||zoneLocked(k)||!visited[k]?'disabled':'')+'><b>'+z.n+'</b><span class="fine">'+stars(z.stars)+' · Nv '+z.minLv+'–'+z.lv[1]+(zoneLocked(k)?' · bloqueado':visited[k]?' · visitado':' · a explorar')+'</span></button>';
  }).join('')+'</div>';
}

const MAPCOL = ['#4a9a3e', '#235a30', '#c09a62', '#3f7fd0', '#5a6a3a', '#7d7894', '#8a8270', '#e2cf96', '#9a6a38', '#163e2c', '#a89f8c'];
function drawMap() {
  const c = $('#cv-map'); if (!c) return; const g = c.getContext('2d');
  for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) { g.fillStyle = MAPCOL[TMAP[y * WW + x]]; g.fillRect(x * 4, y * 4, 4, 4); if (zoneLocked(ZGRID[y * WW + x])) { g.fillStyle = 'rgba(6,5,10,.82)'; g.fillRect(x * 4, y * 4, 4, 4); } }
  for (const p of POIS) {
    const x = p.tx * 4 + 2, y = p.ty * 4 + 2; g.fillStyle = '#1a120c';
    if (p.kind === 'waygate') { if (!S.way[p.id]) continue; g.fillRect(x - 4, y - 4, 8, 8); g.fillStyle = '#5ab0f0'; g.fillRect(x - 3, y - 3, 6, 6); }
    else if (p.kind === 'dungeon' || p.kind === 'arena') { g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + 6, y + 5); g.lineTo(x - 6, y + 5); g.fill(); g.fillStyle = p.kind === 'arena' ? '#f0b94a' : '#d8423c'; g.beginPath(); g.moveTo(x, y - 4); g.lineTo(x + 4, y + 4); g.lineTo(x - 4, y + 4); g.fill(); }
    else { g.fillRect(x - 6, y - 6, 12, 12); g.fillStyle = p.kind === 'origin' ? '#8fd06a' : '#efe3c4'; g.fillRect(x - 5, y - 5, 10, 10); g.fillStyle = '#c8483a'; g.fillRect(x - 5, y - 5, 10, 4); }
  }
  const hx = H.x / TILE * 4, hy = H.y / TILE * 4; g.fillStyle = '#1a120c'; g.beginPath(); g.arc(hx, hy, 6, 0, 7); g.fill(); g.fillStyle = '#f0b94a'; g.beginPath(); g.arc(hx, hy, 4, 0, 7); g.fill();
  g.font = '700 13px Cinzel, Georgia, serif'; g.textAlign = 'center';
  for (const zk in ZONES) { if (zk === '~') continue; let sx = 0, sy = 0, n = 0; for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) if (ZGRID[y * WW + x] === zk) { sx += x; sy += y; n++; } if (!n) continue; const x = sx / n * 4, y = sy / n * 4; const tw = g.measureText(ZONES[zk].n).width / 2; const X = clamp(x, tw + 4, WW * 4 - tw - 4); g.lineWidth = 3; g.strokeStyle = '#1a120c'; g.strokeText(ZONES[zk].n, X, y); g.fillStyle = zoneLocked(zk) ? '#8a7a6a' : '#fbf2dc'; g.fillText(ZONES[zk].n, X, y); }
  c.onclick = e => { const r = c.getBoundingClientRect(), tx = (e.clientX - r.left) / r.width * WW, ty = (e.clientY - r.top) / r.height * WH; closePanel(); walkTo(tx * TILE, ty * TILE); };
}

/* =============== Cidades =============== */
let NPCQ = id => { const q = curQuest(); return q && q.town === id ? q : null; };
const TOWN_BIO = { alvorada:'grass', forja:'ruins' };
function vTown() {
  const id = P.data, tabs = [['npc', 'Missões' + (NPCQ(id) ? ' !' : '')], ['inn', 'Estalagem'], ['shop', 'Loja']].concat(id !== 'alvorada' ? [['smith', 'Ferreiro'], ['best', 'Bestiário']] : []);
  return banner(POI[id].n, 'Cidade', TOWN_BIO[id]) + tabsRow(tabs, P.tab) + ({ npc:pNpc, inn:pInn, shop:pShop, smith:pSmith, best:pBest }[P.tab] || pInn)();
}
function pInn() {
  const cost = Math.round(10 + S.lvl * 6);
  return '<div class="card"><div class="row l" style="gap:10px">' + npcImg('bento', 56) + '<div style="flex:1"><b class="t">Estalagem</b><div class="fine">Bento, o estalajadeiro: "Cama quente e sopa. Você acorda novo em folha."</div></div></div><span class="fine">Recupera todo PV e PM e reanima o seguidor.</span><div class="row"><span class="price">' + cost + ' ouro</span>' + btn('rest', 'Descansar', 'data-cost="' + cost + '"', 'sm gold') + '</div></div>' + pDaily(true);
}
function shopRow(k, p) {
  return '<div class="card"><div class="row l" style="gap:10px">' + iconImg(k, 36) + '<div style="flex:1;min-width:0"><div class="row"><b>' + ITEMS[k].n + '</b><span class="badge">Você tem ' + fmt(S.inv[k] || 0) + '</span></div><span class="fine">' + ITEMS[k].d + '</span></div></div><div class="row"><span class="price">' + fmt(p) + ' ouro</span><div class="row" style="gap:6px">' + btn('buy', '×1', 'data-k="' + k + '" data-n="1" data-p="' + p + '"') + btn('buy', '×5', 'data-k="' + k + '" data-n="5" data-p="' + p + '"') + '</div></div></div>';
}
function pShop() {
  const disc = P.kind === 'origin' ? .05 * S.town.loja : 0, t = topTier();
  const keys = ['pocao_p', 'eter_p', 'antidoto', 'linha'].concat(t >= 2 || S.lvl >= 8 ? ['pocao', 'eter'] : [], t >= 3 || S.lvl >= 18 ? ['pocao_g', 'elixir'] : [], S.lvl >= 100 ? ['pocao_sup','eter_sup'] : []);
  return '<div class="lrow">' + npcImg('nina', 56) + '<span class="fine">Nina, a lojista: "Pode olhar à vontade. Também compro o que você não quer."' + (disc ? ' Desconto da sua loja: ' + Math.round(disc * 100) + '%.' : '') + '</span></div><p class="sub">Comprar</p>' + keys.map(k => shopRow(k, Math.round(ITEMS[k].price * (1 - disc)))).join('') +
    '<p class="sub">Materiais de construção</p>' + shopRow('pedra', Math.round(28 * (1 - disc))) + shopRow('madeira', Math.round(10 * (1 - disc))) + '<p class="sub">Vender</p>' + sellList();
}
function sellList() {
  const mats = Object.keys(ITEMS).filter(k => (ITEMS[k].kind === 'mat' || ITEMS[k].kind === 'junk') && S.inv[k] > 0 && !['madeira', 'pedra', 'couro'].includes(k));
  let h = mats.map(k => '<div class="card"><div class="row l" style="gap:10px">' + iconImg(k, 32) + '<b style="flex:1">' + ITEMS[k].n + ' ×' + fmt(S.inv[k]) + '</b>' + btn('sellmat', 'Vender · ' + fmt(ITEMS[k].price * S.inv[k]), 'data-k="' + k + '"') + '</div></div>').join('');
  const free = unequipped();
  h += free.length ? free.map(it => gearCard(it, btn('sell', 'Vender · ' + fmt(Math.round(gearPrice(it) * .4)), 'data-id="' + it.id + '"'))).join('') : '<p class="empty">Nenhum equipamento solto para vender. Itens equipados em algum conjunto não aparecem aqui.</p>';
  return h;
}
function pNpc() {
  const id = P.data, q = NPCQ(id), names = { alvorada:'Capitã Mirela', forja:'Ferreira Odete' }, nk = { alvorada:'mirela', forja:'odete' };
  const quote = { alvorada:'"Os bosques andam perigosos, viajante. Alvorada precisa de quem empunhe uma lâmina."', forja:'"Ouvi falar de você. Se quer ficar mais forte, precisa provar isso lá fora."' };
  const head = '<div class="row l" style="gap:10px">' + npcImg(nk[id], 64) + '<div style="flex:1;min-width:0"><b class="t">' + names[id] + '</b><div class="fine">' + quote[id] + '</div></div></div>';
  if (!q) return '<div class="card">' + head + '<span class="fine">' + (STORY[S.quest.i] ? 'Sua próxima missão está com ' + STORY[S.quest.i].npc + ', em ' + POI[STORY[S.quest.i].town].n + '.' : 'Não há mais nada a pedir. Obrigado, herói.') + '</span></div>';
  return '<div class="card hl">' + head + '<b style="font-size:18px">' + q.n + '</b><span>' + q.d + '</span><span class="fine">' + questProgress(q) + '</span><span class="fine">Recompensa: ' + rewardLine(q.rw) + '</span>' +
    (S.quest.ready ? '<div class="row"><span></span>' + btn('turnin', 'Entregar missão', '', 'sm gold') + '</div>' : '') + '</div>';
}
/* ferreiro: melhora (com tempo) e desmancha */
const FORGE_MAT = ['', 'osso', 'seda', 'minerio', 'escama', 'escama','minerio','escama','minerio','ectoplasma','escama'];
const upCost = it => ({ ouro:Math.round(gearPrice(it) * .5 * it.lvl + 20), [FORGE_MAT[it.tier]]:1 + it.lvl });
const upTime = it => it.lvl * 40 * 1000;
function pSmith() {
  const now = Date.now();
  let h = '<p class="fine">Melhorar um item leva tempo de verdade (até 3 ao mesmo tempo). Cada nível dá +10% nos atributos, até +9. Enquanto está na forja, o item sai do conjunto e volta quando você pega.</p>';
  if (S.forge.length) h += '<p class="sub">Na forja</p>' + S.forge.map((f, i) => { const left = Math.max(0, f.done - now); return '<div class="card"><div class="row l" style="gap:10px">' + iconImg(f.it, 32) + '<span style="flex:1">' + qSpan(f.it) + '</span><span class="badge">→ +' + (f.it.lvl - 1) + '</span></div><div class="row"><span class="fine">' + (left ? 'Pronto em ' + mmss(left) : 'Pronto!') + '</span>' + (left ? '' : btn('forgeget', 'Pegar', 'data-i="' + i + '"', 'sm gold')) + '</div></div>'; }).join('');
  h += '<p class="sub">Melhorar</p>' + (S.bag.length ? S.bag.slice().sort((a, b) => isEquipped(b) - isEquipped(a) || gearPrice(b) - gearPrice(a)).map(it => {
    const maxed = it.lvl >= 10, c = upCost(it);
    return '<div class="card"><div class="row l" style="gap:10px">' + iconImg(it, 32) + '<div style="flex:1;min-width:0"><div class="row">' + qSpan(it) + qTag(it) + '</div><span class="fine">' + gearLine(it) + (isEquipped(it) ? ' · <b style="color:var(--blue)">equipado</b>' : '') + '</span></div></div>' +
      (maxed ? '<span class="fine">Nível máximo</span>' : '<div class="row"><span class="fine">' + costLine(c) + ' · ' + mmss(upTime(it)) + '</span>' + btn('forge', 'Melhorar', 'data-id="' + it.id + '"' + (S.forge.length >= 3 || !hasRes(c) ? ' disabled' : '')) + '</div>') + '</div>';
  }).join('') : '<p class="empty">Nada para melhorar.</p>');
  const free = unequipped();
  h += '<p class="sub">Desmanchar</p>' + (free.length ? free.map(it => gearCard(it, btn('smelt', 'Desmanchar', 'data-id="' + it.id + '"'))).join('') : '<p class="empty">Só itens soltos (fora dos conjuntos) podem ser desmanchados.</p>');
  return h;
}
function pBest() {
  return '<div class="lrow">' + npcImg('iara', 56) + '<span class="fine">Iara, a tratadora: "Cada um tem seu temperamento. Só um vai com você por vez."</span></div>' + Object.keys(PETS).filter(k => !PETS[k].exclusive).map(k => {
    const d = PETS[k], own = S.pets.some(p => p.key === k), ok = d.tier <= tierOfLv(S.lvl);
    return '<div class="card"><div class="row l" style="gap:10px">' + sprImg(petMini(k), 48) + '<div style="flex:1;min-width:0"><b>' + d.n + '</b><div class="fine">' + stars(d.tier) + ' · ' + d.moves.map(([m]) => PET_MOVES[m].n).join(', ') + '</div></div></div><div class="row"><span class="price">' + fmt(d.price) + ' ouro</span>' +
      (own ? '<span class="badge">Adotado</span>' : !ok ? '<span class="fine">Requer tier ' + d.tier + '</span>' : btn('adopt', 'Adotar', 'data-k="' + k + '"' + (S.gold < d.price ? ' disabled' : ''), 'sm gold')) + '</div></div>';
  }).join('');
}

/* =============== Vila de origem =============== */
function vOrigin() {
  const tabs = [['build', 'Construir']].concat(S.town.loja ? [['shop', 'Loja']] : [], S.town.casa ? [['home', 'Casa']] : [], S.town.ferreiro ? [['smith', 'Ferreiro']] : [], S.town.bestiario ? [['best', 'Bestiário']] : [], S.town.prefeitura ? [['hall', 'Prefeitura']] : []);
  return banner('Sua Vila', 'Vila de origem', 'grass') + tabsRow(tabs, P.tab) + ({ build:pBuild, shop:pShop, home:pHome, smith:pSmith, best:pBest, hall:pHall }[P.tab] || pBuild)();
}
const scaleCost = (c, lv) => Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.round(v * Math.pow(2, lv))]));
function pBuild() {
  return '<p class="fine">Construa com ouro, madeira e pedra. Pedra é rara no começo: procure pedras brilhando no mapa, abra baús e separe lixo da pesca.</p>' + Object.keys(BUILDINGS).map(k => {
    const b = BUILDINGS[k], lv = S.town[k], max = lv >= b.max, cost = scaleCost(b.cost, lv);
    return '<div class="card' + (lv ? ' hl' : '') + '"><div class="row l" style="gap:10px">' + iconImg(['house', { col:lv ? '#c8483a' : '#6a6a6a' }], 36) + '<div style="flex:1;min-width:0"><div class="row"><b class="t">' + b.n + '</b>' + (lv ? '<span class="badge y">' + (b.max > 1 ? 'Nível ' + lv : 'Construído') + '</span>' : '') + '</div><span class="fine">' + b.d + '</span></div></div>' +
      (max ? '' : '<div class="row"><span class="fine">' + costLine(cost) + '</span>' + btn('build', lv ? 'Melhorar' : 'Construir', 'data-k="' + k + '"' + (hasRes(cost) ? '' : ' disabled'), 'sm gold') + '</div>') + '</div>';
  }).join('');
}
function pHome() { return '<div class="card"><b class="t">Casa</b><span class="fine">Descanse de graça. Recupera tudo e reanima o seguidor.</span><div class="row"><span></span>' + btn('rest', 'Descansar', 'data-cost="0"', 'sm gold') + '</div></div>'; }
function pHall() {
  const day = todayKey(), lv = S.town.prefeitura, g = 250 * lv + S.lvl * 30, e = 60 * lv + S.lvl * 8;
  return '<div class="card"><b class="t">Prefeitura · nível ' + lv + '</b><span class="fine">Impostos e oferendas dos moradores, uma vez por dia.</span><div class="row"><span class="price">' + fmt(g) + ' ouro · ' + fmt(e) + ' essências</span>' + (S.hallDay === day ? '<span class="badge">Recebido hoje</span>' : btn('hall', 'Receber', '', 'sm gold')) + '</div></div>';
}

/* =============== Masmorra, arena, portais =============== */
function vDungeon() {
  const D = DUNGEONS[P.data], keys = S.inv.chave || 0, done = S.cnt.dungeons[P.data] || 0;
  return banner(D.n, 'Masmorra · ' + stars(D.stars), D.bio) + '<div class="card"><span class="fine">' + D.intro + '</span><div class="grid2"><div class="kv"><span>Nível</span><b>' + D.lv + '+</b></div><div class="kv"><span>Andares</span><b>' + D.floors + '</b></div><div class="kv"><span>Chaves</span><b>' + keys + '/' + D.keys + '</b></div><div class="kv"><span>Concluída</span><b>' + done + '×</b></div></div>' +
    '<div class="lrow">' + sprImg(monMini(D.boss), 40) + '<span><b>' + MON[D.boss].n + '</b><br><span class="fine">Chefe do último andar</span></span></div>' +
    '<span class="fine">Os andares são seguidos e seus PV e PM não se recuperam entre eles: leve poções. Usa o conjunto Masmorra.</span>' +
    (S.lvl < D.lv - 2 ? '<span class="lack">Você está bem abaixo do nível recomendado.</span>' : '') +
    '<div class="row"><span class="fine">Chaves caem de chefes.</span>' + btn('enterdg', 'Entrar · ' + D.keys + ' chave' + (D.keys > 1 ? 's' : ''), keys < D.keys || tierOfLv(S.lvl) < D.stars ? 'disabled' : '', 'sm gold') + '</div></div>';
}
function vArena() {
  return banner('Arena dos Carvalhos', 'Mestre Varek organiza as lutas', 'arena') + '<div class="card"><div class="lrow">' + npcImg('varek', 56) + '<span class="fine">Mestre Varek: "Aqui ninguém morre de verdade. Mas o orgulho sai ferido."</span></div><span class="fine">Lute contra heróis de outras terras. Sua vida e mana enchem no começo, poções são proibidas e a luta não afeta os seus PV. Usa o conjunto PvP.</span>' +
    '<div class="grid2"><div class="kv"><span>Fichas</span><b>' + (S.inv.ficha || 0) + '</b></div><div class="kv"><span>Vitórias</span><b>' + S.cnt.arena + '</b></div></div>' +
    '<div class="row"><span class="fine">Fichas caem de chefes.</span>' + btn('arena', 'Lutar · 1 ficha', (S.inv.ficha || 0) < 1 ? 'disabled' : '', 'sm gold') + '</div></div>';
}
function vGates() {
  const here = POIS.find(p => p.kind === 'waygate' && Math.hypot(poiPx(p).x - H.x, poiPx(p).y - H.y) < 60);
  const list = POIS.filter(p => p.kind === 'waygate' && S.way[p.id]);
  let h = banner('Portais', here ? 'Você está no ' + here.n : 'Fique ao lado de um portal para viajar');
  h += list.map(p => '<div class="card"><div class="row l" style="gap:10px">' + icon('ic_gate', 32) + '<div style="flex:1;min-width:0"><b>' + p.n + '</b><div class="fine">' + ZONES[ZGRID[p.ty * WW + p.tx]].n + '</div></div>' + (here && here.id === p.id ? '<span class="badge">Aqui</span>' : here ? btn('travel', 'Viajar', 'data-id="' + p.id + '"', 'sm gold') : btn('goto', 'Ir até lá', 'data-id="' + p.id + '"')) + '</div></div>').join('');
  return list.length ? h : h + '<p class="empty">Nenhum portal descoberto.</p>';
}

/* =============== Pesca =============== */
const FISH = { phase:'aim', t0:0, pow:0, timer:null, raf:0 };
function vFish() {
  return banner('Pesca', 'Linhas de pesca: <b id="fish-n">' + (S.inv.linha || 0) + '</b>') + '<div class="card"><span class="fine">Lance quando a barra estiver perto do meio: arremessos certeiros pescam mais. Quando o peixe morder, puxe rápido.</span>' +
    '<div class="bar" style="height:16px;position:relative"><i id="fish-m" class="xp" style="width:0%"></i></div><p id="fish-s" style="min-height:44px;font-size:17px;text-align:center"></p>' +
    '<div class="row"><span></span><button class="btn gold" id="fish-b" data-act="fishbtn">Lançar</button></div></div>';
}
function stopFish() { clearTimeout(FISH.timer); cancelAnimationFrame(FISH.raf); FISH.phase = 'done'; }
function fishReset() {
  cancelAnimationFrame(FISH.raf); clearTimeout(FISH.timer); FISH.phase = 'aim'; FISH.t0 = performance.now();
  const m = $('#fish-m'), b = $('#fish-b'), st = $('#fish-s'); if (!m) return; b.textContent = 'Lançar'; b.disabled = !(S.inv.linha > 0); st.textContent = S.inv.linha > 0 ? '' : 'Sem linhas de pesca.'; st.style.color = '';
  (function anim(now) { if (FISH.phase !== 'aim' || !$('#fish-m')) return; const p = (Math.sin((now - FISH.t0) / 380) + 1) / 2; FISH.pow = p; $('#fish-m').style.width = (p * 100) + '%'; FISH.raf = requestAnimationFrame(anim); })(FISH.t0);
}
function fishBtn() {
  const st = $('#fish-s'), b = $('#fish-b');
  if (FISH.phase === 'aim') {
    if (!(S.inv.linha > 0)) return;
    S.inv.linha--; $('#fish-n').textContent = S.inv.linha; FISH.phase = 'wait'; cancelAnimationFrame(FISH.raf); b.textContent = 'Puxar'; st.textContent = 'A boia flutua...'; sfx.step();
    FISH.q = 1 - Math.abs(FISH.pow - .5) * 2;
    FISH.timer = setTimeout(() => { if (FISH.phase !== 'wait') return; FISH.phase = 'bite'; st.textContent = 'Fisgou! Puxe agora!'; st.style.color = 'var(--gold)'; sfx.crit();
      FISH.timer = setTimeout(() => { if (FISH.phase !== 'bite') return; st.style.color = ''; st.textContent = 'O peixe escapou.'; FISH.phase = 'done'; b.textContent = 'De novo'; }, 900 + FISH.q * 500); }, rnd(1500, 4000));
  } else if (FISH.phase === 'wait') { clearTimeout(FISH.timer); st.textContent = 'Cedo demais! A linha voltou vazia.'; FISH.phase = 'done'; b.textContent = 'De novo'; }
  else if (FISH.phase === 'bite') { clearTimeout(FISH.timer); st.style.color = ''; FISH.phase = 'done'; b.textContent = 'De novo'; fishCatch(st); }
  else fishReset();
}
function fishCatch(st) {
  const r = Math.random(), zk = zoneAtPx(H.x, H.y), z = ZONES[zk] || ZONES.B, stars = z.stars;
  if (r < .1) { st.textContent = 'Algo enorme saiu da água!'; const k = stars >= 2 ? 'slime2' : 'slime'; setTimeout(() => { closePanel(); const m = spawnMon({ x:H.x + 20, y:H.y, z:zk === '~' ? 'B' : zk }, k); startMapBattle(m); }, 700); return; }
  let msg;
  if (r < .58) { const n = Math.random() < FISH.q ? 2 : 1; addItem('peixe', n); msg = 'Você pescou ' + n + ' Peixe' + (n > 1 ? 's' : '') + '.'; }
  else if (r < .78) { const n = ri(1, 2); addItem('lixo', n); msg = 'Só lixo... ' + n + ' Lixo. Separe no inventário para tirar pedra.'; }
  else if (r < .86) { addItem(stars >= 2 ? 'pocao' : 'pocao_p'); msg = 'Uma poção boiando!'; }
  else if (r < .92 && !bagFull()) { const it = genGear(stars, null, null, .1); addGear(it); msg = 'Um equipamento enroscado: ' + it.name + '.'; }
  else { addItem('gema'); msg = 'Uma Gema Bruta brilhando no anzol!'; }
  st.textContent = msg; sfx.coin(); save();
}

/* =============== Registro, navegação e janelas =============== */
const VIEWS = {
  hero:{ def:'status', r:vHero }, classes:{ r:vClasses }, skills:{ r:vSkills }, pet:{ r:vPet }, codex:{ r:vCodex },
  quests:{ def:'story', r:vQuests }, map:{ r:vMap, after:drawMap },
  town:{ def:() => NPCQ(P.data) ? 'npc' : 'inn', r:vTown }, origin:{ def:'build', r:vOrigin },
  dungeon:{ r:vDungeon }, arena:{ r:vArena }, raid:{ r:vRaid }, gates:{ r:vGates }, fish:{ r:vFish, after:fishReset },
};
function vRaid() {
  const r = S.raid, ready = S.lvl >= 5 && r.sigils > 0;
  const prizes = [
    ['supply', 'Kit de aventura', '3 poções grandes, 2 éteres e 1 elixir', 1],
    ['keys', 'Kit de exploração', '3 chaves de masmorra e 3 fichas da arena', 1],
    ['weapon', 'Arma lendária', 'Arma da sua classe, adequada ao seu nível', 3],
    ['armor', 'Armadura lendária', 'Peitoral da sua classe, adequado ao seu nível', 3],
    ['dragon', 'Dragonete da Aurora', 'Seguidor exclusivo com sopro de água', 6],
  ];
  let h = banner('Desafio da Aurora', 'Um chefe especial · recompensas conquistadas em jogo', 'tower');
  h += '<div class="card hl"><div class="row l" style="gap:12px">' + sprImg(monMini('b_aurora'), 64) + '<div><b class="t">Guardião da Aurora</b><div class="fine">Nível ' + Math.max(5, S.lvl) + ' · vulnerável a raio · resistente à água</div></div></div>' +
    '<p class="fine">Derrote chefes no mapa ou nas masmorras para receber selos de invocação. Gaste 1 selo para desafiar o Guardião; cada vitória rende 3 medalhas. A derrota também consome o selo.</p>' +
    '<div class="row"><span>Invocações: <b>' + r.sigils + '</b> · Medalhas: <b>' + r.seals + '</b></span></div>' +
    '<div class="row"><span class="fine">' + (S.lvl < 5 ? 'Disponível no nível 5' : r.sigils ? 'Prepare suas poções antes de entrar' : 'Derrote um chefe para obter um selo') + '</span>' + btn('raidfight', 'Invocar · 1 selo', ready ? '' : 'disabled', 'sm gold') + '</div></div>';
  h += '<p class="sub">Prêmios da Aurora · ' + r.wins + ' vitória(s)</p>' + prizes.map(([id, name, desc, cost]) => {
    const owned = id === 'dragon' && S.pets.some(p => p.key === 'dragon_aurora');
    return '<div class="card"><div class="row"><b>' + name + '</b><span class="badge y">' + cost + ' medalha(s)</span></div><p class="fine">' + desc + '</p><div class="row"><span></span>' + btn('raidprize', owned ? 'Conquistado' : 'Resgatar', 'data-k="' + id + '" ' + (owned || r.seals < cost ? 'disabled' : ''), 'sm gold') + '</div></div>';
  }).join('');
  return h + '<p class="fine">Tudo funciona offline. Medalhas são obtidas apenas ao vencer o Guardião; não há compras com dinheiro real.</p>';
}
function renderPanel() {
  const v = VIEWS[P.kind]; if (!v || !S) return;
  $('#p-body').innerHTML = v.r();
  if (v.after) v.after();
  syncReferenceUI();
  const back = P.stack.length > 0, c = $('#p-close'); c.textContent = back ? '←' : '✕'; c.setAttribute('aria-label', back ? 'Voltar' : 'Fechar');
  updateHUD();
}
function setView(kind, tab, data) {
  if (P.kind === 'fish' && kind !== 'fish') stopFish();
  P.kind = kind; P.data = data === undefined ? null : data; const v = VIEWS[kind];
  P.tab = tab || (typeof v.def === 'function' ? v.def() : v.def) || 'main';
  renderPanel(); scrollEl.scrollTop = 0;
}
function pushView(kind, tab, data) { P.stack.push({ kind:P.kind, tab:P.tab, data:P.data, y:scrollEl.scrollTop }); setView(kind, tab, data); }
function openPanel(kind, tab, data) {
  if (kind === 'items') { kind = 'hero'; tab = 'inv'; }
  if (kind === 'hero' && VIEWS[tab]) { kind = tab; tab = null; }
  closeModal(); $('#toast').hidden=true; P.stack = []; P.q = ''; overlay.hidden = false; setView(kind, tab, data); sfx.click();
}
function closePanel() { closeModal(); stopFish(); overlay.hidden = true; P.kind = null; P.stack = []; updateHUD(); save(); }
function backOrClose() {
  if (!modal.hidden) { closeModal(); return; }
  if (P.stack.length) { const s = P.stack.pop(); if (P.kind === 'fish') stopFish(); P.kind = s.kind; P.tab = s.tab; P.data = s.data; renderPanel(); scrollEl.scrollTop = s.y || 0; sfx.click(); return; }
  closePanel();
}
const M = { fn:null, args:[] };
function openModal(fn, ...args) { M.fn = fn; M.args = args; modal.hidden = false; mBody.innerHTML = fn(...args); mBody.scrollTop = 0; sfx.click(); const f = mBody.querySelector('button'); if (f) f.focus({ preventScroll:true }); }
function refreshModal() { if (!modal.hidden && M.fn) mBody.innerHTML = M.fn(...M.args); }
function closeModal() { modal.hidden = true; M.fn = null; }
function refresh() { renderPanel(); refreshModal(); }
const ACT = {
  tab(el) { P.tab = el.dataset.tab; renderPanel(); scrollEl.scrollTop = 0; sfx.click(); },
  go(el) { const k = el.dataset.k; sfx.click(); if (k === 'equip') { P.tab = 'equip'; renderPanel(); scrollEl.scrollTop = 0; return; } if (k === 'classes') P.path = pathOf(); pushView(k); },
  statset(el) { P.statSet = el.dataset.k; renderPanel(); },
  help(el) { openModal(mHelp, el.dataset.k); },
  cat(el) { P.cat = el.dataset.k; P.q = ''; renderPanel(); sfx.click(); },
  view(el) { P.view = el.dataset.v; const g = $('#inv-grid'); if (g) g.innerHTML = invGrid(); document.querySelectorAll('.vt button').forEach(b => b.classList.toggle('on', b.dataset.v === P.view)); },
  item(el) { const id = el.dataset.id; openModal(mItem, id); if (S.newIds.includes(id)) { S.newIds = S.newIds.filter(x => x !== id); const g = $('#inv-grid'); if (g) g.innerHTML = invGrid(); } },
  stack(el) { openModal(mStack, el.dataset.k); },
  seenall() { S.newIds = []; renderPanel(); },
  equipset(el) { const it = itemById(el.dataset.id), set = el.dataset.set; if (!it || !equipItem(it, slotFor(it, set), set)) { toast('Sua classe não usa este item.'); return; } sfx.click(); toast(it.name + ' no conjunto ' + SET_LBL[set] + '.'); refresh(); },
  unequipset(el) { const set = el.dataset.set; for (const sl in S.sets[set]) if (S.sets[set][sl] === el.dataset.id) delete S.sets[set][sl]; sfx.click(); refresh(); },
  eqset(el) { P.set = el.dataset.k; renderPanel(); sfx.click(); },
  slot(el) { openModal(mSlot, el.dataset.sl, P.set); },
  sloton(el) { const it = itemById(el.dataset.id); if (it && equipItem(it, el.dataset.sl, el.dataset.set)) { sfx.click(); closeModal(); renderPanel(); } },
  slotoff(el) { delete S.sets[el.dataset.set][el.dataset.sl]; sfx.click(); closeModal(); renderPanel(); },
  copyset(el) { S.sets[el.dataset.set] = Object.assign({}, S.sets.padrao); sfx.click(); renderPanel(); },
  clearset(el) { S.sets[el.dataset.set] = {}; sfx.click(); renderPanel(); },
  path(el) { const keys = Object.keys(PATHS), i = keys.indexOf(P.path || pathOf()); P.path = keys[(i + +el.dataset.d + keys.length) % keys.length]; renderPanel(); scrollEl.scrollTop = 0; sfx.click(); },
  clinfo(el) { openModal(mClass, el.dataset.k); },
  setcls(el) { const k = el.dataset.k; if (!S.classes.includes(k)) return; S.cls = k; const st = stats(); S.hp = Math.min(S.hp, st.hp); S.mp = Math.min(S.mp, st.mp); sfx.level(); toast('Agora você é ' + CLASSES[k].n + '.'); closeModal(); renderPanel(); },
  unlock(el) {
    const k = el.dataset.k, c = CLASSES[k]; if (clState(k) !== 'avail' || S.ess < c.cost) return;
    S.ess -= c.cost; S.classes.push(k); S.cls = k; S.capWarn = false;
    const learned = learnSkills(); sfx.level(); toast(c.n + ' desbloqueado!' + (learned.length ? ' Nova habilidade: ' + learned.map(i => SKILLS[i].n).join(', ') : '')); questCheck(); closeModal(); renderPanel();
  },
  spec(el) {
    const k = el.dataset.k, cost = S.specUsed ? 2000 : 0; if (S.ess < cost || S.lvl < 20) return; S.ess -= cost;
    const old = S.spec && SPECS[S.spec].skill; if (old && !S.classes.some(c => CLASSES[c].skills.some(([, s]) => s === old))) { S.skills = S.skills.filter(s => s !== old); S.equipped = S.equipped.filter(s => s !== old); }
    S.spec = k; S.specUsed = true; learnSkills(); sfx.level(); toast('Especialização: ' + SPECS[k].n + '.'); renderPanel();
  },
  equipsk(el) { const id = el.dataset.id, i = S.equipped.indexOf(id); if (i >= 0) S.equipped.splice(i, 1); else if (S.equipped.length >= 6) { toast('No máximo 6. Tire uma antes.'); return; } else S.equipped.push(id); sfx.click(); renderPanel(); },
  setpet(el) { S.pet = +el.dataset.i; sfx.click(); renderPanel(); },
  use(el) { if (!usePotion(el.dataset.k)) toast('Não precisa agora.'); refresh(); },
  eat() { const st = stats(); if (!(S.inv.peixe > 0)) return; if (S.hp >= st.hp) { toast('Você está de barriga cheia.'); return; } S.inv.peixe--; S.hp = Math.min(st.hp, S.hp + 40); sfx.heal(); refresh(); },
  sortjunk() { const n = S.inv.lixo || 0; if (!n) return; const p = n + Math.floor(n * Math.random() * .6); S.inv.lixo = 0; addItem('pedra', p); sfx.coin(); toast('Do lixo saíram ' + p + ' Pedra.'); refresh(); },
  healall() { const st = stats(); let used = 0; for (const k of ['pocao_p', 'pocao', 'pocao_g', 'elixir','pocao_sup']) while (S.hp < st.hp && S.inv[k] > 0) { usePotion(k); used++; } for (const k of ['eter_p', 'eter','eter_sup']) while (S.mp < st.mp && S.inv[k] > 0) { usePotion(k); used++; } toast(used ? 'Usou ' + used + ' poção(ões).' : 'Nada para curar ou sem poções.'); renderPanel(); },
  codex(el) { sfx.click(); pushView('codex', null, el.dataset.k); },
  topic(el) { openModal(mTopic, P.data, +el.dataset.i); },
  cxopen(el) { openModal(mMon, el.dataset.k); },
  claimjob(el) { const j = S.daily.list[+el.dataset.i]; if (!j || j.claimed || j.have < j.need) return; j.claimed = true; S.gold += j.rw.ouro; S.ess += j.rw.ess; sfx.coin(); toast('+' + fmt(j.rw.ouro) + ' ouro · +' + fmt(j.rw.ess) + ' essências'); renderPanel(); },
  rest(el) { const cost = +el.dataset.cost, st = stats(); if (S.gold < cost) { toast('Ouro insuficiente.'); return; } S.gold -= cost; S.hp = st.hp; S.mp = st.mp; if (S.pet >= 0) S.petHp = 1; sfx.heal(); toast('Você acorda renovado.'); renderPanel(); },
  buy(el) { const k = el.dataset.k, n = +el.dataset.n, p = +el.dataset.p * n; if (S.gold < p) { toast('Ouro insuficiente.'); return; } S.gold -= p; addItem(k, n); sfx.coin(); renderPanel(); },
  sell(el) { const it = itemById(el.dataset.id); if (!it || isEquipped(it)) return; S.gold += Math.round(gearPrice(it) * .4); S.bag = S.bag.filter(x => x !== it); S.newIds = S.newIds.filter(x => x !== it.id); sfx.coin(); renderPanel(); },
  sellmat(el) { const k = el.dataset.k; S.gold += ITEMS[k].price * S.inv[k]; S.inv[k] = 0; sfx.coin(); renderPanel(); },
  turnin() { questTurnIn(); renderPanel(); },
  build(el) {
    const k = el.dataset.k, b = BUILDINGS[k], cost = scaleCost(b.cost, S.town[k]); if (!hasRes(cost) || S.town[k] >= b.max) return;
    payRes(cost); S.town[k]++; sfx.level(); toast(b.n + (S.town[k] > 1 ? ' melhorada para o nível ' + S.town[k] : ' construída') + '!'); buildPoiEnts(); questCheck(); renderPanel();
  },
  hall() { const lv = S.town.prefeitura, g = 250 * lv + S.lvl * 30, e = 60 * lv + S.lvl * 8; S.gold += g; S.ess += e; S.hallDay = todayKey(); sfx.coin(); renderPanel(); },
  forge(el) {
    const it = itemById(el.dataset.id); if (!it || it.lvl >= 10 || S.forge.length >= 3) return; const c = upCost(it); if (!hasRes(c)) { toast('Faltam materiais.'); return; }
    payRes(c); S.bag = S.bag.filter(x => x !== it); it.lvl++; S.forge.push({ it, done:Date.now() + upTime({ lvl:it.lvl - 1 }) }); sfx.coin(); renderPanel();
  },
  forgeget(el) { const i = +el.dataset.i, f = S.forge[i]; if (!f || f.done > Date.now()) return; S.forge.splice(i, 1); S.bag.push(f.it); S.cnt.upgrades++; S.quest.prog.upg = (S.quest.prog.upg || 0) + 1; sfx.level(); toast(f.it.name + ' agora é +' + (f.it.lvl - 1) + '.'); questCheck(); renderPanel(); },
  smelt(el) {
    const it = itemById(el.dataset.id); if (!it || isEquipped(it)) return; S.bag = S.bag.filter(x => x !== it); S.newIds = S.newIds.filter(x => x !== it.id);
    const n = Math.max(1, Math.round(it.tier * it.q * 2)), got = { madeira:n, [FORGE_MAT[it.tier]]:Math.ceil(n / 2) }; if (Math.random() < .3 + it.tier * .1) got.pedra = Math.ceil(n / 3);
    for (const k in got) addItem(k, got[k]); sfx.coin(); toast('Desmanchado: ' + Object.entries(got).map(([k, v]) => v + ' ' + ITEMS[k].n).join(', ')); renderPanel();
  },
  adopt(el) { const k = el.dataset.k, d = PETS[k]; if (!d || d.tier > tierOfLv(S.lvl) || d.exclusive || S.gold < d.price || S.pets.some(p => p.key === k)) return; S.gold -= d.price; S.pets.push({ key:k }); S.pet = S.pets.length - 1; S.petHp = 1; sfx.level(); toast(d.n + ' agora segue você!'); questCheck(); renderPanel(); },
  raidfight() { startRaid(); },
  raidprize(el) {
    const k = el.dataset.k, costs = { supply:1, keys:1, weapon:3, armor:3, dragon:6 }, cost = costs[k];
    if (!cost || S.raid.seals < cost) return;
    if ((k === 'weapon' || k === 'armor') && bagFull()) { toast('Sua bolsa está cheia. Libere espaço antes de resgatar.'); return; }
    if (k === 'dragon' && S.pets.some(p => p.key === 'dragon_aurora')) return;
    S.raid.seals -= cost;
    if (k === 'supply') { addItem('pocao_g', 3); addItem('eter', 2); addItem('elixir'); }
    else if (k === 'keys') { addItem('chave', 3); addItem('ficha', 3); }
    else if (k === 'dragon') { S.pets.push({ key:'dragon_aurora' }); S.pet = S.pets.length - 1; S.petHp = 1; }
    else { const it = genGear(tierOfLv(S.lvl), k === 'weapon' ? 'weapon' : 'chest', CLASSES[S.cls].gear[0], 0, 1.8); addGear(it); }
    save(); sfx.coin(); toast('Prêmio resgatado!'); renderPanel();
  },
  enterdg() { runDungeon(P.data); },
  arena() { startArena(); },
  atlastravel(el) { const p=POI[el.dataset.id]; if(!p || zoneLocked(p.zone || zoneAtPx(poiPx(p).x,poiPx(p).y)) || !S.regions[p.zone || 'B']) return; const c=poiPx(p); H.x=c.x; H.y=c.y+22; H.path=[]; H.goal=null; closePanel(); save(); },
  travel(el) { const p = POI[el.dataset.id]; if(!p || zoneLocked(zoneAtPx(poiPx(p).x,poiPx(p).y))) return; const c = poiPx(p); H.x = c.x; H.y = c.y + 14; H.path = []; H.goal = null; closePanel(); sfx.magic(); toast('Você viaja até o ' + p.n + '.'); },
  fishbtn() { fishBtn(); },
  goto(el) { const p = POI[el.dataset.id]; closePanel(); goPoi(p); },
  snd() { SND = !SND; renderPanel(); if (SND) sfx.click(); },
  title() { if (busy) return; closePanel(); S.pos = { x:H.x, y:H.y }; save(); S = null; refreshContinue(); show('title'); },
  closemodal() { closeModal(); },
};
function onAct(e) { const b = e.target.closest('[data-act]'); if (!b || b.disabled) return; if (ACT[b.dataset.act]) ACT[b.dataset.act](b); }
overlay.addEventListener('click', onAct);
modal.addEventListener('click', e => { if (e.target === modal) { closeModal(); return; } onAct(e); });
overlay.addEventListener('input', e => { if (e.target.id === 'inv-q') { P.q = e.target.value; const g = $('#inv-grid'); if (g) g.innerHTML = invGrid(); document.querySelectorAll('.cats button').forEach(b => b.classList.toggle('on', !P.q && b.dataset.k === P.cat)); } });
overlay.addEventListener('change', e => { if (e.target.id === 'inv-sort') { P.sort = e.target.value; const g = $('#inv-grid'); if (g) g.innerHTML = invGrid(); } });
$('#p-close').addEventListener('click', () => { sfx.click(); backOrClose(); });
setInterval(() => { if (S && !overlay.hidden && modal.hidden && (P.tab === 'smith' && S.forge.length || P.kind === 'hero' && P.tab === 'status' && (buffOn('xp2') || buffOn('gold2')))) { const y = scrollEl.scrollTop; renderPanel(); scrollEl.scrollTop = y; } }, 1000);
/* ===== Telas, fluxo do jogo, missões, masmorras e arena ===== */
let cur = 'title', busy = false;
const overlayClosed = () => overlay.hidden;
function show(name) {
  for (const id of ['title', 'world', 'battle']) $('#s-' + id).hidden = id !== name;
  cur = name; document.body.style.overflow = name === 'title' ? '' : 'hidden';
  if (name === 'world') { resizeWorld(); updateHUD(); lastZone = ''; }
  window.scrollTo(0, 0);
}
function updateHUD() {
  if (!S) return;
  const st = stats(); S.hp = clamp(S.hp, 0, st.hp); S.mp = clamp(S.mp, 0, st.mp);
  $('#hero-face').src = sprUrl(heroMini(false));
  $('#hb-hp').style.width = (S.hp / st.hp * 100) + '%'; $('#hb-mp').style.width = (S.mp / st.mp * 100) + '%';
  $('#h-lvl').textContent = S.lvl; EX.vis = st.vision;
  $('#w-gold').textContent = fmt(S.gold) + ' ouro'; $('#w-ess').textContent = fmt(S.ess) + ' essências';
  $('#q-badge').hidden = !(S.quest.ready || dailyReady());
  const q=curQuest(); $('#world-quest').textContent = q ? q.n + ' · ' + questProgress(q) : 'Campanha concluída · explore Vaelmar';
  if (typeof updateLeft === 'function' && cur === 'world') updateLeft();
}

/* ---------- Missões ---------- */
let curQuest = () => STORY[S.quest.i] || null;
function questKill(k) {
  const q = curQuest(); if (q && q.goal.kill && q.goal.kill[k] !== undefined) S.quest.prog[k] = (S.quest.prog[k] || 0) + 1;
  ensureDaily(); for (const j of S.daily.list) if (j.mon === k && j.have < j.need) j.have++;
}
function questDone(q) {
  const g = q.goal, p = S.quest.prog;
  if (g.kill) return Object.entries(g.kill).every(([k, n]) => (p[k] || 0) >= n);
  if (g.build) return S.town[g.build] > 0;
  if (g.lvl) return S.lvl >= g.lvl && topTier() >= g.tier;
  if (g.arena) return (p.arena || 0) >= g.arena;
  if (g.pet) return S.pets.length >= g.pet;
  if (g.codex) return codexCount() >= g.codex;
  if (g.dungeon) return !!p['dg_' + g.dungeon];
  if (g.upgrade) return S.town.ferreiro > 0 && (p.upg || 0) >= g.upgrade;
  return false;
}
function questProgress(q) {
  const g = q.goal, p = S.quest.prog;
  if (g.kill) return Object.entries(g.kill).map(([k, n]) => MON[k].n + ' ' + Math.min(p[k] || 0, n) + '/' + n).join(' · ');
  if (g.build) return BUILDINGS[g.build].n + (S.town[g.build] ? ' construída' : ' não construída');
  if (g.lvl) return 'Nível ' + S.lvl + '/' + g.lvl + ' · tier ' + topTier() + '/' + g.tier;
  if (g.arena) return 'Vitórias ' + Math.min(p.arena || 0, g.arena) + '/' + g.arena;
  if (g.pet) return S.pets.length ? 'Seguidor adotado' : 'Nenhum seguidor';
  if (g.codex) return 'Entradas completas ' + Math.min(codexCount(), g.codex) + '/' + g.codex;
  if (g.dungeon) return p['dg_' + g.dungeon] ? 'Concluída' : 'Ainda não concluída';
  if (g.upgrade) return 'Itens melhorados ' + Math.min(p.upg || 0, g.upgrade) + '/' + g.upgrade;
  return '';
}
function questCheck() {
  const q = curQuest(); if (!q || S.quest.ready) { updateHUD(); return; }
  if (questDone(q)) { S.quest.ready = true; toast('Missão cumprida: ' + q.n + '. Fale com ' + q.npc + ' em ' + POI[q.town].n + '.'); sfx.level(); }
  updateHUD();
}
function rewardLine(rw) { const a = []; if (rw.ouro) a.push(fmt(rw.ouro) + ' ouro'); if (rw.xp) a.push(fmt(rw.xp) + ' XP'); if (rw.ess) a.push(fmt(rw.ess) + ' essências'); if (rw.item) a.push(rw.item[1] + '× ' + ITEMS[rw.item[0]].n); return a.join(' · '); }
function giveReward(rw) {
  if (rw.ouro) S.gold += rw.ouro; if (rw.ess) S.ess += rw.ess; if (rw.item) addItem(rw.item[0], rw.item[1]);
  const lines = rw.xp ? gainXp(rw.xp) : []; for (const [t] of lines) toast(t);
}
function questTurnIn() {
  const q = curQuest(); if (!q || !S.quest.ready) return;
  giveReward(q.rw); S.quest.i++; S.quest.prog = {}; S.quest.ready = false; sfx.win();
  toast('Recompensa: ' + rewardLine(q.rw)); questCheck(); save();
}
function ensureDaily() {
  if (S.daily && S.daily.day === todayKey()) return;
  const pool = []; for (const zk in ZONES) { const Z = ZONES[zk]; if (Z.minLv <= S.lvl) for (const [k] of Z.spawn) if (!pool.includes(k)) pool.push(k); }
  const list = []; for (let i = 0; i < 3 && pool.length; i++) { const k = pool.splice(ri(0, pool.length - 1), 1)[0], need = ri(5, 9); list.push({ mon:k, need, have:0, rw:{ ouro:Math.round((20 + S.lvl * 12) * need / 5), ess:Math.round((10 + S.lvl * 6) * need / 5) }, claimed:false }); }
  S.daily = { day:todayKey(), list };
}
let dailyReady = () => S.daily && S.daily.day === todayKey() && S.daily.list.some(j => j.have >= j.need && !j.claimed);

/* ---------- Batalhas no mapa ---------- */
function nameDupes(foes) { const c = {}; foes.forEach(f => c[f.n] = (c[f.n] || 0) + 1); const s = {}; foes.forEach(f => { if (c[f.n] > 1) { s[f.n] = (s[f.n] || 0) + 1; f.n += ' ' + 'ABC'[s[f.n] - 1]; } }); return foes; }
async function encounterFx() { const w = $('#s-world'); w.classList.add('flash'); sfx.enc(); await wait(480); w.classList.remove('flash'); }
async function startMapBattle(m) {
  busy = true; H.path = []; H.goal = null; EX.mark = null; $('#tip').hidden = true;
  await encounterFx();
  const foes = [makeFoe(m.key, m.lv)];
  if (!m.boss && Math.random() < .22) { const Z = ZONES[m.z]; const k = wpick(Z.spawn); foes.push(makeFoe(k, clamp(m.lv + ri(-1, 0), Z.lv[0], Z.lv[1]))); }
  nameDupes(foes);
  const r = await battle({ foes, bio:ZONES[m.z].bio, canFlee:!m.boss });
  if (r === 'win') EX.mons = EX.mons.filter(x => x !== m);
  else if (r === 'flee') { m.x = m.hx = m.x + (m.x > H.x ? 30 : -30); m.tx = m.x; if (!walkTile(...tileOf(m.x, m.y))) EX.mons = EX.mons.filter(x => x !== m); }
  if (H.resumeGoal) { H.resume = H.resumeGoal; H.resumeGoal = null; }
  afterBattle(r); busy = false;
}
function afterBattle(r) {
  if (r === 'lose') {
    const p = POI[S.lastTown] || POI.alvorada, c = poiPx(p); H.x = c.x; H.y = c.y + 22; H.path = []; H.resume = null;
    const st = stats(); S.hp = Math.ceil(st.hp * .5); S.mp = Math.ceil(st.mp * .5); if (S.pet >= 0) S.petHp = .5;
    show('world'); toast('Você acordou em ' + p.n + '. A morte por aqui é barata, mas tenha cuidado.');
  } else show('world');
  questCheck(); save();
}

async function startRaid() {
  if (busy || S.lvl < 5 || S.raid.sigils < 1) return;
  S.raid.sigils--; busy = true; closePanel(); save();
  await encounterFx();
  const result = await battle({ foes:[makeFoe('b_aurora', Math.max(5, S.lvl))], mode:'raid', bio:'tower', canFlee:false });
  afterBattle(result); busy = false;
  if (result === 'win') toast('Guardião derrotado! Troque suas medalhas no Desafio.');
}

/* ---------- Masmorras (andares seguidos, sem cura entre eles) ---------- */
async function runDungeon(key) {
  const D = DUNGEONS[key];
  if (!D || tierOfLv(S.lvl) < D.stars) { toast('Esta masmorra requer tier ' + (D && D.stars) + '.'); return; }
  if ((S.inv.chave || 0) < D.keys) { toast('Você precisa de ' + D.keys + ' chave(s) de masmorra.'); return; }
  S.inv.chave -= D.keys; busy = true; closePanel(); save();
  for (let fl = 1; fl <= D.floors; fl++) {
    const boss = fl === D.floors, L = D.lv + Math.floor((fl - 1) / 2);
    const foes = boss ? [makeFoe(D.boss, D.lv + 1)] : nameDupes(Array.from({ length:ri(1, Math.min(3, 1 + Math.ceil(fl / 2))) }, () => makeFoe(pick(D.pool), L)));
    const r = await battle({ foes, mode:'dungeon', bio:D.bio, canFlee:false });
    if (r === 'lose') { afterBattle('lose'); busy = false; return; }
    if (!boss) {
      for (;;) {
        say(D.n + ' — andar ' + fl + ' de ' + D.floors + ' limpo.', 'gold');
        const v = await choose([{ v:'go', l:'Próximo andar', s:'Andar ' + (fl + 1) + '/' + D.floors + (fl + 1 === D.floors ? ' · chefe' : ''), cls:'gold' }, { v:'pot', l:'Usar poção', s:fmt(S.hp) + ' PV · ' + fmt(S.mp) + ' PM' }, { v:'out', l:'Desistir', s:'a chave se perde' }]);
        if (v === 'go') break;
        if (v === 'out') { show('world'); busy = false; save(); return; }
        const own = Object.keys(ITEMS).filter(k => ITEMS[k].kind === 'pot' && S.inv[k] > 0);
        if (!own.length) { say('Sem poções.'); continue; }
        const k = await choose(own.map(k => ({ v:k, l:ITEMS[k].n + ' ×' + S.inv[k], s:ITEMS[k].d })).concat([{ v:'back', l:'Voltar', cls:'wide' }]), 'list');
        if (k !== 'back') { usePotion(k); B.hero.hp = S.hp; B.hero.mp = S.mp; renderParty(); }
      }
    }
  }
  const gold = Math.round((60 + D.lv * 25) * D.floors * (buffOn('gold2') ? 2 : 1)), ess = Math.round(D.stars * 120 * D.floors / 3);
  S.gold += gold; S.ess += ess; S.cnt.dungeons[key] = (S.cnt.dungeons[key] || 0) + 1; S.quest.prog['dg_' + key] = 1;
  const got = []; for (let i = 0; i < 2; i++) if (!bagFull()) { const it = genGear(Math.min(10, D.stars + 1), null, Math.random() < .6 ? CLASSES[S.cls].gear[0] : null, .2); addGear(it); got.push(it.name + ' (' + qualOf(it.q).n + ')'); }
  say(D.n + ' concluída! +' + fmt(gold) + ' ouro · +' + fmt(ess) + ' essências', 'gold'); if (got.length) say('Tesouro: ' + got.join(', '), 'gold');
  if (key === 'torre' && !S.ended) { S.ended = true; say('O Wyrm do Eclipse cai. A luz volta a Vaelmar.', 'gold'); }
  questCheck(); await choose([{ v:1, l:'Voltar ao mapa', cls:'gold wide' }], 'one');
  show('world'); busy = false; save();
}
function usePotion(k) {
  const it = ITEMS[k], st = stats(); if (!(S.inv[k] > 0)) return false;
  if (it.hp && S.hp >= st.hp && !it.mp) return false; if (it.mp && S.mp >= st.mp && !it.hp) return false;
  S.inv[k]--; if (it.hp) S.hp = Math.min(st.hp, S.hp + it.hp); if (it.mp) S.mp = Math.min(st.mp, S.mp + it.mp); sfx.heal(); return true;
}

/* ---------- Arena ---------- */
async function startArena() {
  if ((S.inv.ficha || 0) < 1) { toast('Você precisa de uma Ficha da Arena. Chefes deixam cair.'); return; }
  S.inv.ficha--; closePanel(); busy = true;
  const keepHp = S.hp, keepMp = S.mp, rival = makeRival(clamp(S.lvl + ri(-1, 1), 1, MAXLV));
  await encounterFx();
  const r = await battle({ foes:[rival], mode:'arena', bio:'arena', canFlee:false });
  S.hp = keepHp; S.mp = keepMp;
  if (r === 'win') { S.cnt.arena++; S.quest.prog.arena = (S.quest.prog.arena || 0) + 1; }
  show('world'); questCheck(); busy = false; save();
  if (r === 'win') toast('Vitória na arena! Total: ' + S.cnt.arena + '.'); else if (r === 'lose') toast('Derrota na arena. Sua vida não foi afetada.');
}

/* ---------- Título ---------- */
let selCls = 'guerreiro';
function initTitle() {
  $('#title-spr').innerHTML = [classSpr('guerreiro'), classSpr('mago'), classSpr('ladino'), monSpr('rat'), monSpr('goblin'), monSpr('slime')].map(c => '<img class="pix" src="' + sprUrl(c) + '" alt="">').join('');
  $('#cls-row').innerHTML = START_CLASSES.map(k => '<button class="btn cls" data-cls="' + k + '" aria-pressed="false"><img class="pix" src="' + sprUrl(classSpr(k)) + '" alt=""><b>' + CLASSES[k].n + '</b></button>').join('');
  setCls(selCls); refreshContinue();
}
function setCls(k) { selCls = k; document.querySelectorAll('#cls-row .cls').forEach(b => { const on = b.dataset.cls === k; b.classList.toggle('sel', on); b.setAttribute('aria-pressed', on); }); $('#cls-desc').textContent = CLASSES[k].d; }
function refreshContinue() {
  const sv = loadSave(), box = $('#continue-box'); box.hidden = !sv;
  if (sv) $('#continue-info').textContent = sv.name + ' · ' + CLASSES[sv.cls].n + ' nível ' + sv.lvl + ' · ' + fmt(sv.gold) + ' ouro. Começar de novo substitui esta aventura.';
}
function enterWorld(fresh) {
  SND = S.snd !== false; for(const k of SETS) S.sets[k]=S.sets[k]||{}; document.body.classList.toggle('reduced-motion',!!S.reduceMotion);
  if (!S.pos) { const c = poiPx(POI.alvorada); S.pos = { x:c.x, y:c.y + 24 }; }
  H.x = S.pos.x; H.y = S.pos.y; H.path = []; H.goal = null; H.resume = null;
  EX.mons = []; EX.clicks = []; EX.spawnT = 0; EX.bossT = 3; CHUNKS.clear(); EX.fog.clear(); EX.fogSig = '';
  buildEntities(); ensureDaily(); show('world'); updateHUD(); drawDial(); questCheck(); save();
  if (fresh) setTimeout(() => toast('Toque no chão para andar. A Capitã Mirela espera você em Alvorada.'), 400);
}
$('#cls-row').addEventListener('click', e => { const b = e.target.closest('.cls'); if (b) { setCls(b.dataset.cls); sfx.click(); } });
$('#btn-start').addEventListener('click', () => {
  if (loadSave() && !confirm('Começar uma nova aventura substitui o save deste navegador. Continuar?')) return;
  const name = ($('#hero-name').value.trim() || 'Herói').slice(0, 24);
  S = newState(selCls, name); starterGear(selCls); learnSkills(); const st = stats(); S.hp = st.hp; S.mp = st.mp; sfx.level(); enterWorld(true);
});
$('#btn-continue').addEventListener('click', () => { const sv = loadSave(); if (!sv) return; S = sv; learnSkills(); sfx.click(); enterWorld(false); });

/* ---------- Controles ---------- */
let downAt = null;
cvW.addEventListener('pointerdown', e => { downAt = { x:e.clientX, y:e.clientY }; });
cvW.addEventListener('pointerup', e => { if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 12) onTapWorld(e); downAt = null; });
$('#tip').addEventListener('click', () => { if (EX.tip && !busy) enterPoi(EX.tip); });
$('#tip').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && EX.tip) { e.preventDefault(); enterPoi(EX.tip); } });
function enterPoi(p) {
  sfx.click();
  if (p.kind === 'town') { S.lastTown = p.id; openPanel('town', null, p.id); }
  else if (p.kind === 'origin') openPanel('origin', null, p.id);
  else if (p.kind === 'dungeon') openPanel('dungeon', null, p.dg);
  else if (p.kind === 'arena') openPanel('arena');
  else if (p.kind === 'waygate') openPanel('gates', null, p.id);
}
document.querySelector('.w-bar').addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (!b || busy) return; openPanel(b.dataset.open); });
$('#btn-resume').addEventListener('click', () => { const gl = H.resume; H.resume = null; updateLeft(); if (gl && gl.type === 'move') walkTo(gl.x, gl.y); });
$('#btn-home').addEventListener('click', () => {
  if (busy) return; if (S.lvl < 3) { toast('Teleporte para a vila de origem libera no nível 3.'); return; }
  const c = poiPx(POI.origem); H.x = c.x; H.y = c.y + 22; H.path = []; H.goal = null; sfx.magic(); toast('Você volta para a sua vila.'); save();
});
$('#btn-raid').addEventListener('click', () => { if (!busy) openPanel('raid'); });
$('#btn-gates').addEventListener('click', () => { if (busy) return; if (S.lvl < 5) { toast('Os portais liberam no nível 5.'); return; } openPanel('gates'); });
document.querySelectorAll('[data-ic]').forEach(el => { el.innerHTML = icon(el.dataset.ic, 30); });
$('#ic-resume').innerHTML = icon('ic_resume', 22); $('#ic-home').innerHTML = icon('ic_home', 22); $('#ic-gates').innerHTML = icon('ic_gate', 22);
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'Escape' && !overlay.hidden) backOrClose();
  if (!overlay.hidden) return;
  if (cur === 'world' && !busy && overlay.hidden) {
    const d = { ArrowUp:[0, -1], ArrowDown:[0, 1], ArrowLeft:[-1, 0], ArrowRight:[1, 0], w:[0, -1], s:[0, 1], a:[-1, 0], d:[1, 0] }[e.key];
    if (d) { e.preventDefault(); walkTo(H.x + d[0] * 48, H.y + d[1] * 48); }
    else if ((e.key === 'e' || e.key === 'Enter') && EX.tip) enterPoi(EX.tip);
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && S) { S.pos = { x:H.x, y:H.y }; save(); } });
setInterval(() => { if (S && cur === 'world') { drawDial(); S.pos = { x:H.x, y:H.y }; } }, 1000);
setInterval(() => { if (S && cur === 'world' && !busy) save(); }, 8000);

function loop(now) { if (S) { if (cur === 'world') exTick(now); else if (cur === 'battle') drawBattle(now); } requestAnimationFrame(loop); }
/* Campanha offline, revisão 2. Todas as tabelas e ilustrações são locais. */
const OFFICIAL_ART = {"hero":{"guerreiro":"class_0","soldado":"class_92","escudeiro":"class_93","cavaleiro":"class_15","runica":"class_43","paladino":"class_96","campeao":"class_91","mago":"class_1","aprendiz":"class_4","feiticeiro":"class_86","arquimago":"class_11","druida":"class_87","arcanista":"class_20","necromante":"class_37","ladino":"class_2","gatuno":"class_89","assassino":"class_90","lamina":"class_24","cacador":"class_5","mestre":"class_31","atirador":"class_14","guerreiro_t6_0":"class_101","guerreiro_t6_1":"class_43","guerreiro_t7_0":"class_30","guerreiro_t7_1":"class_95","guerreiro_t8_0":"class_36","guerreiro_t8_1":"class_39","guerreiro_t9_0":"class_50","guerreiro_t9_1":"class_53","guerreiro_t10_0":"class_54","guerreiro_t10_1":"class_57","mago_t6_0":"class_87","mago_t6_1":"class_17","mago_t7_0":"class_29","mago_t7_1":"class_20","mago_t8_0":"class_37","mago_t8_1":"class_35","mago_t9_0":"class_52","mago_t9_1":"class_47","mago_t10_0":"class_55","mago_t10_1":"class_58","ladino_t6_0":"class_91","ladino_t6_1":"class_5","ladino_t7_0":"class_31","ladino_t7_1":"class_90","ladino_t8_0":"class_38","ladino_t8_1":"class_24","ladino_t9_0":"class_51","ladino_t9_1":"class_14","ladino_t10_0":"class_56","ladino_t10_1":"class_66"},"monster":{"rat":"monster_ba9f6b9f-9a28-44ab-a563-6fa334ec4e66","slime":"monster_a6dfb390-0397-492d-b2d2-2b410d601ade","goblin":"monster_9a1d3df7-6495-4414-a31d-9ff2f11a4a09","wolf":"monster_c0f01eed-7525-440f-b9f2-c32e92487b70","bat":"monster_f55c5f21-fdad-4534-ba53-13d23dba2b3c","skeleton":"monster_6ab48f7ed56efc362f41853c5616bf75-6ab48f7ed56efc362f41853c5616bf75","ghost":"monster_6719abf3-02aa-4c49-96b9-8ae027ae2903","bandit":"monster_a6511c52-3e42-4826-9d7d-8a6d27b4c0c9","spider":"monster_aa8fdc6a-f1bc-47f6-acd2-edaba47e8e4e","golem":"monster_dd61c3dc259e5c43722e89409499b669-dd61c3dc259e5c43722e89409499b669","worm":"monster_029312ae-4715-4a48-8d4a-d3b2f7bf7775","goblin_mage":"monster_9a1d3df7-6495-4414-a31d-9ff2f11a4a09","slime2":"monster_a6dfb390-0397-492d-b2d2-2b410d601ade","wolf2":"monster_c0f01eed-7525-440f-b9f2-c32e92487b70","wolf3":"monster_c0f01eed-7525-440f-b9f2-c32e92487b70","vamp":"monster_f55c5f21-fdad-4534-ba53-13d23dba2b3c","spider3":"monster_aa8fdc6a-f1bc-47f6-acd2-edaba47e8e4e","skel3":"monster_6ab48f7ed56efc362f41853c5616bf75-6ab48f7ed56efc362f41853c5616bf75","b_slime":"monster_a6dfb390-0397-492d-b2d2-2b410d601ade","b_goblin":"boss_e2e9aa1c-52e4-4dd1-bf03-ed399609e380","b_bandit":"boss_b589b201-c57f-483b-b717-a78b371236f6","b_knight":"boss_dfb8066e-9ce2-47c1-b4f2-f8605eeae582","b_golem":"boss_a20d321c-ad29-4b3e-a870-53fed50c7cb9","b_eclipse":"boss_53ac2f36-5587-449d-8377-b6e9445e9b26"},"building":{"house_red":"building_shop","house_blue":"building_residence","hut":"building_bestiary","waygate":"building_wayvessel","coliseum":"building_coliseum"},"data":{"class_0":"@@A:862cc2b2f20ac546@@","class_92":"@@A:af8c8a68f684ffaa@@","class_93":"@@A:627d7f1620fbc878@@","class_15":"@@A:9d08737b07ae8e11@@","class_43":"@@A:93738859a508683e@@","class_96":"@@A:ead61c9cee3ddf11@@","class_91":"@@A:5543e34bc4324cd9@@","class_1":"@@A:e8a3f3db315952f2@@","class_4":"@@A:148a3ee917314c84@@","class_86":"@@A:106f6a4612c80341@@","class_11":"@@A:ba66d5ece9ba1e01@@","class_87":"@@A:fac3a49bc0fb2411@@","class_20":"@@A:84f7cd3c98001f48@@","class_37":"@@A:4d35c56ed0dafb8c@@","class_2":"@@A:b04120234b9d1482@@","class_89":"@@A:e5dbac7dbda4649e@@","class_90":"@@A:e5671582e2237041@@","class_24":"@@A:e61e59ba49854be5@@","class_5":"@@A:3cdc8da80fbff5b8@@","class_31":"@@A:d3f08465dd24da40@@","class_14":"@@A:b598a231261f0a2c@@","class_101":"@@A:a9c644410015515d@@","class_30":"@@A:7d4fc574c2c7549f@@","class_95":"@@A:8447f0ece916b9fe@@","class_36":"@@A:902c4f309b4767bf@@","class_39":"@@A:6667c48cd5081042@@","class_50":"@@A:990120e83a159a51@@","class_53":"@@A:0c3bc2c14d072d25@@","class_54":"@@A:58968947a6cfd8bd@@","class_57":"@@A:2a8e2cfbd70d7c5a@@","class_17":"@@A:049062ec2aab123d@@","class_29":"@@A:a69ae866f50fa290@@","class_35":"@@A:81f4096116f50f07@@","class_52":"@@A:05b20505efac8a3d@@","class_47":"@@A:6ede96d3a050366e@@","class_55":"@@A:67d1f2680aa3ade5@@","class_58":"@@A:9afd8d7b005492ed@@","class_38":"@@A:02566ed52f8df784@@","class_51":"@@A:6b9b894c463b9044@@","class_56":"@@A:e1932c5206d0f4af@@","class_66":"@@A:902b658b3a5dcc21@@","monster_ba9f6b9f-9a28-44ab-a563-6fa334ec4e66":"@@A:89f54366b3261b38@@","monster_a6dfb390-0397-492d-b2d2-2b410d601ade":"@@A:2178adc1d7ac5166@@","monster_9a1d3df7-6495-4414-a31d-9ff2f11a4a09":"@@A:f75429e949dd44f4@@","monster_c0f01eed-7525-440f-b9f2-c32e92487b70":"@@A:af5c73fda6bb7d4a@@","monster_f55c5f21-fdad-4534-ba53-13d23dba2b3c":"@@A:4a1e4a9aa881b307@@","monster_6ab48f7ed56efc362f41853c5616bf75-6ab48f7ed56efc362f41853c5616bf75":"@@A:18864d24ba8679c7@@","monster_6719abf3-02aa-4c49-96b9-8ae027ae2903":"@@A:6fd5280ac0195f40@@","monster_a6511c52-3e42-4826-9d7d-8a6d27b4c0c9":"@@A:1537f7c5ce17c146@@","monster_aa8fdc6a-f1bc-47f6-acd2-edaba47e8e4e":"@@A:2d59dec5e3228a81@@","monster_dd61c3dc259e5c43722e89409499b669-dd61c3dc259e5c43722e89409499b669":"@@A:2ac2644113af851c@@","monster_029312ae-4715-4a48-8d4a-d3b2f7bf7775":"@@A:0e8c5a1215e20d11@@","building_shop":"@@A:b17172877b5b6f4c@@","building_residence":"@@A:95d877a690c8fda0@@","building_bestiary":"@@A:8a775b2e4ac22280@@","building_wayvessel":"@@A:5ade53239bc99b0b@@","building_coliseum":"@@A:8b9be64eb4331dfa@@","boss_e2e9aa1c-52e4-4dd1-bf03-ed399609e380":"@@A:e3f9dc43d6fd5b55@@","boss_b589b201-c57f-483b-b717-a78b371236f6":"@@A:ee91ef6b2b0c7780@@","boss_dfb8066e-9ce2-47c1-b4f2-f8605eeae582":"@@A:71a5c40e73c18857@@","boss_a20d321c-ad29-4b3e-a870-53fed50c7cb9":"@@A:7e22b1dee7f5ea26@@","boss_53ac2f36-5587-449d-8377-b6e9445e9b26":"@@A:80c9c1086944cc68@@"}};
const OFFICIAL_CANVAS = new Map();
async function loadOfficialArt(){
 await Promise.all(Object.entries(OFFICIAL_ART.data).map(([id,url])=>new Promise(resolve=>{
  const img=new Image();img.onload=()=>{const c=document.createElement('canvas');let div=1;if(id.startsWith('monster_')||id.startsWith('boss_'))div=Math.max(1,Math.ceil(Math.max(img.width,img.height)/48));else if(id.startsWith('building_'))div=Math.max(1,Math.ceil(Math.max(img.width,img.height)/64));c.width=Math.max(1,Math.round(img.width/div));c.height=Math.max(1,Math.round(img.height/div));const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(img,0,0,c.width,c.height);OFFICIAL_CANVAS.set(id,c);resolve();};img.onerror=resolve;img.src=url;
 })));
}
function officialSprite(id,flip){const c=OFFICIAL_CANVAS.get(id);if(!c)return null;if(!flip)return c;const key=id+'|f';if(OFFICIAL_CANVAS.has(key))return OFFICIAL_CANVAS.get(key);const f=document.createElement('canvas');f.width=c.width;f.height=c.height;const g=f.getContext('2d');g.translate(c.width,0);g.scale(-1,1);g.drawImage(c,0,0);OFFICIAL_CANVAS.set(key,f);return f;}

const CONTENT_COST = [0,250,2500,10000,50000,100000,250000,500000,1000000,2000000,4000000];
for (const c of Object.values(CLASSES)) {
  c.cost=CONTENT_COST[c.tier];
  c.skills=c.skills.map(([lv,id])=>[c.tier===1?lv:(c.tier-1)*25+(lv%10)*2,id]);
}
Object.assign(SKILLS, {
  draconic:{n:'Investida Dracônica',mp:48,kind:'dmg',stat:'atk',pow:3.3,elem:'fogo',d:'Uma estocada envolta em fogo.'},
  avalanche:{n:'Avalanche',mp:52,kind:'dmg',stat:'mag',pow:2.8,elem:'agua',all:true,d:'Gelo sobre todos os inimigos.'},
  runestorm:{n:'Tempestade Rúnica',mp:58,kind:'dmg',stat:'both',pow:2.3,elem:'arcano',all:true,d:'Ataque e magia contra todos.'},
  soulreap:{n:'Colheita de Almas',mp:62,kind:'dmg',stat:'mag',pow:3.5,elem:'sombrio',drain:.5,d:'Dano sombrio com roubo de vida.'},
  sanctum:{n:'Bastião Celestial',mp:55,kind:'ward',pow:5,def:true,d:'Proteção baseada na defesa.'},
  skyfall:{n:'Queda dos Céus',mp:80,kind:'dmg',stat:'mag',pow:4.2,elem:'sagrado',all:true,d:'Luz sobre todos os adversários.'},
  thousand:{n:'Dança das Mil Lâminas',mp:72,kind:'dmg',stat:'atk',pow:.65,hits:8,d:'Oito cortes consecutivos.'},
  annihilate:{n:'Aniquilação',mp:95,kind:'dmg',stat:'atk',pow:5,crit:20,d:'Ataque físico de alto poder.'},
  ultima:{n:'Última Estrela',mp:110,kind:'dmg',stat:'mag',pow:5.4,elem:'arcano',all:true,d:'Magia arcana de último tier.'},
  starlance:{n:'Lança Estelar',mp:85,kind:'dmg',stat:'both',pow:4.4,elem:'sagrado',d:'Uma lança de energia sagrada.'},
});
const ADVANCED = {
 guerreiro:[['Dragoeiro','Guardião Rúnico'],['Cavaleiro Dragão','Sentinela Real'],['Vanguarda de Atlas','Mestre Rúnico'],['Titã Guardião','Senhor da Guerra'],['Gilgamesh','Beowulf']],
 mago:[['Alto Druida','Feiticeiro Glacial'],['Arquedruida','Evocador Rúnico'],['Necromante Ancestral','Mago Celestial'],['Omnimante','Oráculo Abissal'],['Herege','Divindade']],
 ladino:[['Mestre de Batalha','Batedor das Neves'],['Magistrado','Predador Noturno'],['Arcânico','Arqueiro Celestial'],['Nyx','Caçador de Dragões'],['Transfigurador','Assassino Divino']],
};
for(const path of Object.keys(ADVANCED)) for(let i=0;i<5;i++) {
 const tier=i+6, prev=PATHS[path].tiers[tier-2], current=[];
 for(let branch=0;branch<2;branch++) {
  const key=path+'_t'+tier+'_'+branch, power=1.8+i*.19;
  const m=path==='guerreiro'?{hp:power,mp:1.1+i*.1,atk:power+.1,mag:1,def:power,res:1.3+i*.14,dex:1.05+i*.08}:path==='mago'?{hp:1.1+i*.1,mp:power+.2,atk:.8,mag:power+.3,def:1+i*.08,res:power,dex:1.1+i*.06}:{hp:1.2+i*.12,mp:1.1+i*.12,atk:power,mag:1,def:1.1+i*.1,res:1.1+i*.1,dex:power+.2};
  const pools=path==='guerreiro'?['draconic','sanctum','runestorm','annihilate','starlance']:path==='mago'?['avalanche','soulreap','skyfall','ultima','starlance']:['thousand','golpe_mortal','tiro_certeiro','annihilate','starlance'];
  CLASSES[key]={n:ADVANCED[path][i][branch],tier,req:prev.slice(),cost:CONTENT_COST[tier],gear:branch===1&&path==='guerreiro'?['guerreiro','mago']:[path],m,skills:[[(tier-1)*25,pools[(i+branch)%pools.length]],[(tier-1)*25+12,pools[(i+branch+1)%pools.length]]],d:'Classe de tier '+tier+'. '+(branch?'Combina técnicas avançadas com versatilidade.':'Especialista nas técnicas do seu caminho.')};
  PATH_OF[key]=path; CLASS_SPR[key]='hero_'+path;
  CLASS_PAL[key]={...CLASS_PAL[prev[branch]||prev[0]],a:['#709bc5','#bd7451','#7c70b6','#b9a04d','#b7d3db'][i],cape:['#243e5e','#632636','#4b2968','#463b26','#6d4787'][i],halo:i===4,visor:path==='guerreiro'};
  current.push(key);
 }
 PATHS[path].tiers.push(current);
}
// Twelve traversable regions; level gates and enemy levels use the same tier schedule.
Object.assign(ZONES.B,{lv:[1,24],spawn:[['rat',4],['slime',3],['goblin',2],['goblin_mage',1]]});
Object.assign(ZONES.O,{lv:[1,20]});
Object.assign(ZONES.C,{stars:2,minLv:25,lv:[25,49]});
Object.assign(ZONES.L,{stars:3,minLv:50,lv:[50,74]});
Object.assign(ZONES.F,{stars:3,minLv:50,lv:[50,74]});
Object.assign(ZONES.S,{stars:4,minLv:75,lv:[75,99]});
Object.assign(ZONES.M,{stars:5,minLv:100,lv:[100,124]});
const NEW_REGIONS = [
 ['J','Geleiras de Jotunheim',6,'snow',110,56,'golem','#8ecadb','Soberano Glacial'],
 ['V','Berço de Valhalla',7,'forest',140,18,'skeleton','#d2b875','Sentinela Ancestral'],
 ['N','Nova Lyonesse',8,'ruins',164,20,'goblin_mage','#c7a3eb','Arquimago Caído'],
 ['R','Profundezas de Balor',9,'abyss',180,40,'wyrm','#8b4ca0','Dragão do Abismo'],
 ['A','Provações de Olympia',10,'heaven',145,60,'golem','#f4d38a','Último Guardião'],
];
for(const [k,name,tier,bio,x,y,base,color,bossName] of NEW_REGIONS) {
 const sk='m_'+k, bk='b_'+k;
 MON[sk]={n:['Andarilho Glacial','Cavaleiro de Valhalla','Feiticeiro Caído','Serpe Abissal','Colosso de Olympia'][tier-6],spr:base,fam:tier>=9?'Ancestral':'Guardião',m:{hp:1.2,atk:1.15,mag:1.15,def:1.1,res:1.1},moves:[['pancada',3],['golpe_forte',1],['sopro_agua',1]],weak:[tier===9?'sagrado':tier===6?'fogo':'raio'],res:[tier===6?'agua':tier===9?'sombrio':'terra'],drops:[['escama',.5],['minerio',.4]]};
 MON[bk]={n:bossName,spr:base,boss:true,fam:'Ancestral',m:{hp:3,atk:1.35,mag:1.35,def:1.2,res:1.2},moves:[['golpe_forte',2],['eclipse',1],['sopro_agua',2]],weak:MON[sk].weak,res:MON[sk].res,drops:[['escama',1],['minerio',1]]};
 P32[sk]={a:color,c:'#f9e8ac',e:'#fff6cf'}; P32[bk]={a:color,c:'#f9e8ac',e:'#fff6cf',halo:1,armor:color};
 ZONES[k]={n:name,stars:tier,minLv:(tier-1)*25,lv:[(tier-1)*25,tier===10?250:tier*25-1],bio,spawn:[[sk,5],['wyrm',2],['golem',1]],night:[['ghost',1]],boss:bk};
 const id='town_'+k, dg='dungeon_'+k;
 const town={id,kind:'town',n:name.split(' de ').at(-1),tx:x,ty:y,clear:4,zone:k,houses:[[-2,-1,'house_blue'],[1,-2,'house_red'],[2,1,'hut']]};
 const gate={id:'gate_'+k,kind:'waygate',n:'Portal de '+town.n,tx:x-3,ty:y+3,clear:2,zone:k};
 const den={id:dg,kind:'dungeon',n:'Santuário de '+town.n,tx:x+5,ty:y-5,clear:3,spr:tier===10?'tower':'crypt',dg,zone:k};
 POIS.push(town,gate,den); POI[id]=town;POI[gate.id]=gate;POI[dg]=den;
 DUNGEONS[dg]={n:den.n,stars:tier,lv:(tier-1)*25+15,floors:tier+3,keys:tier>=9?3:2,bio,pool:[sk,'wyrm','golem'],boss:bk,intro:'Atravesse os salões de '+town.n+' e enfrente '+bossName+'.'};
 TOWN_BIO[id]=bio;
 PETS['pet_'+k]={n:['Raposa Glacial','Corvo de Valhalla','Guardião de Lyonesse','Serpe de Balor','Dragão de Olympia'][tier-6],spr:tier===6?'wolf':tier===7?'bat':tier===8?'golem':'wyrm',tier,price:20000*Math.pow(2,tier-5),m:{hp:1+tier*.08,atk:1+tier*.1,mag:1+tier*.1},moves:[['ataque',2],['sopro_p',2],['cura_p',1]]};
 PET32['pet_'+k]={a:color,c:'#e7d6b0',e:'#fff6cf'};
 STORY.push({id:'exp_'+k,n:'O Santuário de '+town.n,npc:'Ferreira Odete',town:'forja',d:'Chegue ao tier '+tier+', explore '+name+' e complete '+den.n+'.',goal:{dungeon:dg},rw:{ouro:15000*tier,ess:30000*tier,xp:xpNext((tier-1)*25)*4,item:['chave',3]}});
}
ZMAP.forEach((row,i)=>ZMAP[i]=row+(i<3?'JJJJVVVVNNNN':i<6?'JJJJVVVVRRRR':i<9?'JJJJAAAAARRR':'~~~~~~~~~~~~'));
Object.assign(DUNGEONS.covil,{stars:2,lv:40});Object.assign(DUNGEONS.cripta,{stars:4,lv:90});Object.assign(DUNGEONS.torre,{stars:5,lv:118});
STORY.forEach(q=>{if(q.goal.lvl){q.goal.lvl=TIER_CAP[q.goal.tier-1];q.d='Chegue ao nível '+q.goal.lvl+' e desbloqueie uma classe de tier '+q.goal.tier+'.';} q.rw.ess=(q.rw.ess||0)*5;});
STORY.push({id:'final',n:'Herói de Vaelmar',npc:'Ferreira Odete',town:'forja',d:'Alcance o nível 250. A jornada pelos dez tiers chega ao fim; as caçadas e os desafios continuam.',goal:{lvl:250,tier:10},rw:{ouro:1000000,ess:1000000}});
// Snow and celestial battlefields are drawn locally in the same pixel grid.
BIOME.snow=pb=>{skyGrad(pb,0,84,['#4d6c8b','#7195ae','#a8c6d4','#d1e1e9','#ecf4f5']);ridge(pb,84,x=>25+18*Math.sin(x/24)+8*Math.sin(x/9),rampOf('#718fa7'),{snow:20,snowRamp:['#acc5d6','#dce9ef','#fff'],fade:14});ground(pb,rampOf('#ccdee6'),{speck:.012,speckCol:['#fff','#95afc3']});};
BIOME.abyss=pb=>{BIOME.cave(pb);for(let i=0;i<9;i++)crystal(pb,i*24,106,14+i%3*5,rampOf('#804ab0'),'#b178ed');};
BIOME.heaven=pb=>{skyGrad(pb,0,84,['#b9b1d5','#c7bdd9','#e1d0de','#f2e4cb','#fff4db']);ridge(pb,78,x=>14+8*Math.sin(x/26),rampOf('#b7b2cc'),{fade:8});ground(pb,rampOf('#e1d4b2'),{speck:.01,speckCol:['#fff8df']});for(const x of [10,45,155,185]){R(pb,x,40,5,50,rampOf('#ded5c3'));R(pb,x-2,38,9,4,rampOf('#eee7d7'));}};
Object.assign(ITEMS,{pocao_sup:{n:'Poção Suprema',kind:'pot',hp:5000,price:1200,d:'Recupera 5.000 PV.'},eter_sup:{n:'Éter Supremo',kind:'pot',mp:1500,price:1400,d:'Recupera 1.500 PM.'}});
// Pixel silhouettes are smaller on the map; battle sprites use exact integer scaling.
const CLASSIC_CACHE = new Map();
function classicScale(canvas,scale){if(scale===1)return canvas; const key=sprUrl(canvas)+'|'+scale;if(CLASSIC_CACHE.has(key))return CLASSIC_CACHE.get(key);const c=document.createElement('canvas');c.width=canvas.width*scale;c.height=canvas.height*scale;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(canvas,0,0,c.width,c.height);CLASSIC_CACHE.set(key,c);return c;}
function classicHero(key,flip,scale=2){const official=officialSprite(OFFICIAL_ART.hero[key],flip);if(official)return official;const path=PATH_OF[key]||'guerreiro',p=CLASS_PAL[key]||{},a=p.a;const pal=path==='mago'?{C:a||'#3f5fd8',c:darken(a||'#3f5fd8',.6)}:path==='ladino'?{G:a||'#3a8f6a',g:darken(a||'#3a8f6a',.65)}:{a:a||'#c9453a',A:darken(a||'#c9453a',.65)};return classicScale(mini('hero_'+path,pal,flip),scale);}
function classicMonster(key,flip,scale=2){const official=officialSprite(OFFICIAL_ART.monster[key],flip);if(official)return official;const d=MON[key];if(key==='rival')return classicHero('guerreiro',flip,scale);const base=MINI_SRC[d.spr]?d.spr:'goblin',p=P32[key]||{},a=p.a,chars={slime:'G',goblin:'G',goblin_mage:'G',wolf:'G',bat:'P',spider:'S',skeleton:'b',ghost:'W',golem:'R',wyrm:'W',rat:'w'};const pal={...(d.pal||{})};if(a&&chars[base])pal[chars[base]]=a;return classicScale(mini(base,pal,flip),scale);}
ACT.exportsave=()=>{S.pos={x:H.x,y:H.y};save();const blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='vaelmar-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
ACT.importsave=()=>document.getElementById('save-file').click();
document.getElementById('btn-import-title').onclick=ACT.importsave;
document.getElementById('save-file').addEventListener('change',async e=>{
 const f=e.target.files[0];if(!f)return;
 try {if(f.size>2000000)throw Error('Arquivo muito grande.');const raw=JSON.parse(await f.text());
 if(!raw||![2,3].includes(raw.v)||!CLASSES[raw.cls]||!Array.isArray(raw.classes)||!Array.isArray(raw.bag)||!raw.inv||!raw.quest||!raw.cnt||!Array.isArray(raw.skills)||!Array.isArray(raw.equipped)||raw.lvl<1||raw.lvl>MAXLV||!Number.isInteger(raw.lvl))throw Error('Save inválido ou incompatível.');
 if(raw.classes.some(k=>!CLASSES[k])||raw.skills.some(k=>!SKILLS[k])||raw.equipped.some(k=>!SKILLS[k])||raw.bag.some(i=>!i||!['weapon','offhand','head','chest','legs','acc'].includes(i.slot)||!GEAR_BASE[i.slot][i.type]||!Number.isFinite(i.q)||!Number.isInteger(i.tier)||i.tier<1||i.tier>10))throw Error('Itens ou classes inválidos.');
 if(S&&!confirm('Importar este arquivo substitui a aventura atual neste navegador. Continuar?'))return;
 const loaded=migrate(raw);loaded.name=String(loaded.name||'Herói').slice(0,24);S=loaded;learnSkills();closePanel();enterWorld(false);toast('Aventura importada.');
 }catch(err){alert('Não foi possível importar: '+err.message);}finally{e.target.value='';}
});

/* Interface baseada nas cinco capturas enviadas pelo usuário. */
HERO_TABS.push(['runes','Loja de Runas']);
SETS.push('incursoes');SET_LBL.incursoes='Incursões';
SET_NOTE.incursoes='Usado nas incursões contra chefes especiais. Espaços vazios usam o Padrão.';
Object.assign(CLASSES.guerreiro.m,{hp:1,mp:1,atk:1,mag:1,def:1,res:1,dex:1});
CLASSES.guerreiro.skills=[[1,'investida'],[5,'golpe'],[10,'protecao']];
ITEMS.pocao_p.n='Poção Pequena de Saúde';ITEMS.eter_p.n='Poção Pequena de Mana';
PASSIVES.guerreiro[1].d=t=>'Chance Colateral: +'+(8+2*t)+'% / Dano Colateral: +'+(5+10*t)+'%';
PASSIVES.guerreiro[0].d=t=>'Poder da Arma: +'+(5*t)+'%';
CATS.find(([k])=>k==='cura')[2]=['pot',{col:'#3ba97e',size:0}];
const additions=[['adornos','Adornos',['gem']],['outros','Outros',['bag']]];
CATS.splice(CATS.findIndex(([k])=>k==='moedas'),0,additions[0]);CATS.splice(CATS.length-1,0,additions[1]);
const UI_ART = {"rusty": "@@A:292a9c712e7d43f7@@", "leather": "@@A:a4eaa57bc9d50004@@", "pocao_p": "@@A:7e7cbeb1503f32ba@@", "eter_p": "@@A:7a62116f036c3bde@@", "skillnav": "@@A:7724e39fb938df34@@"};
const UI_CANVAS=new Map();
async function loadUiArt(){await Promise.all(Object.entries(UI_ART).map(([key,src])=>new Promise(resolve=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;c.getContext('2d').drawImage(im,0,0);UI_CANVAS.set(key,c);resolve();};im.onerror=resolve;im.src=src;})));}
function skillGlyph(size=36){return '<svg class="skill-glyph" width="'+size+'" height="'+size+'" viewBox="0 0 48 48" aria-hidden="true"><g fill="#168cba"><path d="M8 25h7v8H8zM14 18h6v7h-6zM10 35h4v6h-4zM22 27h5v5h-5zM33 20h5v5h-5zM16 7h4v5h-4z"/></g><g fill="#45c5ec"><path d="M17 18h7v6h-7zM12 28h7v7h-7zM26 12h5v6h-5zM29 28h5v5h-5zM21 35h4v6h-4z"/></g><g fill="#b6fbff"><path d="M30 1h3v8h7v3h-7v8h-3v-8h-7V9h7zM9 14h2v5h5v2h-5v5H9v-5H4v-2h5zM35 28h3v7h7v3h-7v7h-3v-7h-7v-3h7zM14 36h3v4h4v3h-4v4h-3v-4h-4v-3h4z"/></g><path d="M30 6h3v9h-3zM27 9h9v3h-9z" fill="#fff"/></svg>';}
function uiIcon(key,size=32){if(key==='skillnav')return skillGlyph(size);const c=UI_CANVAS.get(key);return c?sprImg(c,size):iconImg(key==='skillnav'?['spark']:key==='runes'?['ess']:['chest'],size);}
function runeGlyph(size=36){return '<svg class="rune-glyph" width="'+size+'" height="'+size+'" viewBox="0 0 36 36" shape-rendering="crispEdges" aria-hidden="true"><path d="M9 2h9v3h4v4h3v10h-3v5h-4v2H9v-3H5v-4H3V9h3V5h3z" fill="#263b41"/><path d="M10 4h8v3h4v12h-3v4H9v-4H6V9h4z" fill="#7b9196"/><path d="M11 6h6v2h3v4h-2V9h-7z" fill="#bdc9c5"/><path d="M8 16h3v4h7v-2h3v4h-3v3h-8v-3H7z" fill="#536870"/><path d="M23 19h6v3h3v7h-3v4h-7v-3h-3v-6h4z" fill="#69501e"/><path d="M24 20h4v3h3v5h-3v3h-5v-3h-2v-4h3z" fill="#e7b52a"/><path d="M25 22h3v3h-3zM22 26h3v3h-3z" fill="#fff18a"/></svg>';}
function heroNav(){const icons={status:sprImg(heroMini(false),38),inv:uiIcon('eter_p',38),equip:uiIcon('leather',38),runes:runeGlyph(38)};return '<div class="herotop reference-header"><div class="cur"><span>'+iconImg(['coin'],18)+fmt(S.gold)+'</span><span>'+runeGlyph(18)+fmt(S.ess)+'</span></div><div class="toptabs" role="tablist">'+HERO_TABS.map(([k,l])=>'<button class="toptab '+(P.tab===k?'on':'')+'" role="tab" aria-selected="'+(P.tab===k)+'" data-act="tab" data-tab="'+k+'">'+icons[k]+l+'</button>').join('')+'</div></div>';}
function vHero(){return heroNav()+({status:hStatus,inv:hInv,equip:hEquip,runes:vRuneShop}[P.tab]||hStatus)();}
function hStatus(){
 const c=CLASSES[S.cls],st=stats(P.statSet),t=c.tier;
 let h='<header class="reference-profile"><div class="profile-person">'+sprImg(heroMini(false),82)+'</div><h2>'+esc(S.name)+'</h2><p>'+c.n+' · '+stars(t)+'</p></header>';
 const actions=[['classes','Mudar<br>Classe',iconImg(['swap'],36)],['equip','Mudar<br>Equipamentos',uiIcon('leather',36)],['skills','Trocar<br>habilidades',uiIcon('skillnav',36)],['pet','Seguidor',S.pet>=0?sprImg(petMini(S.pets[S.pet].key),36):sprImg(monMini('slime'),36)]];
 h+='<div class="acts reference-acts">'+actions.map(([k,l,im])=>'<button class="ibtn '+(k==='pet'&&!S.pets.length?'off':'')+'" data-act="go" data-k="'+k+'">'+im+'<span>'+l+'</span></button>').join('')+'</div>';
 const rows=[['xp','EXPERIÊNCIA',S.xp],['next','PRÓXIMO NÍVEL',S.lvl>=MAXLV?'Máximo':xpNext(S.lvl)],['hp','HP',st.hp],['mp','MANA',st.mp],['atk','ATAQUE',st.atk],['def','DEFESA',st.def],['mag','MAGIA',st.mag],['res','RESISTÊNCIA',st.res],['dex','DESTREZA',st.dex],['init','INICIATIVA',st.init],['crit','CHANCE DE ACERTO<br>CRÍTICO',st.crit+'%'],['vision','DISTÂNCIA DE VISÃO',st.vision+' metros']];
 h+=box('Atributos',rows.map(([k,l,v])=>'<div class="reference-stat" data-stat="'+k+'"><span>'+l+'</span><span class="stat-number">'+(typeof v==='number'?fmt(v):v)+(k==='xp'||k==='next'?'':'<button class="q" data-act="help" data-k="'+k+'" aria-label="Sobre '+l.replace('<br>',' ')+'">?</button>')+'</span></div>').join(''),'reference-box attributes');
 h+='<div class="reference-world-tabs">'+['padrao','pvp'].map(k=>btn('statset',k==='padrao'?'Mundo':'PvP','data-k="'+k+'"',P.statSet===k?'sm sel':'sm')).join('')+'</div>';
 const passives=PASSIVES[pathOf()].slice().reverse().map(p=>[p.n,p.d(t),p.id==='colat'?['crit',{col:'#db5941'}]:['sword']]);
 if(S.spec)passives.push([SPECS[S.spec].n,SPECS[S.spec].d,['star']]);
 if(buffOn('xp2'))passives.push(['Sabedoria ('+mmss(S.buffs.xp2-Date.now())+')','Experiência: +100%',['book']]);
 if(buffOn('gold2'))passives.push(['Sorte ('+mmss(S.buffs.gold2-Date.now())+')','Ouro: +100%',['coin']]);
 h+=box('Efeitos passivos',passives.map(([n,d,ic],i)=>'<button class="passive-line" data-act="passiveinfo" data-i="'+i+'">'+iconImg(ic,22)+'<span><b>'+n+'</b><small>'+d+'</small></span></button>').join('')+'<p class="passive-note">Toque em um item acima para obter mais informações.</p>','reference-box');
 const eq=SLOTS.map(sl=>equippedIn(P.statSet,sl)).filter(Boolean);
 h+=box('Equipamento',eq.map(it=>'<button class="profile-item" data-act="item" data-id="'+it.id+'">'+iconImg(it,24)+gName(it)+'</button>').join('')||'<p class="fine">Nenhum equipamento.</p>','reference-box');
 h+=box('Habilidades',S.equipped.map(id=>'<button class="profile-item" data-act="skillinfo" data-k="'+id+'">'+skIcon(id,24)+SKILLS[id].n+'</button>').join('')||'<p class="fine">Nenhuma habilidade equipada.</p>','reference-box');
 return h;
}
function hInv(){const nNew=S.newIds.filter(itemById).length;return '<div class="invbar reference-invbar"><input id="inv-q" type="search" placeholder="Procurar..." value="'+esc(P.q)+'" aria-label="Procurar itens"><select id="inv-sort" aria-label="Ordenar">'+[['rec','Padrão'],['nome','Nome'],['qual','Qualidade'],['tier','Tier']].map(([k,l])=>'<option value="'+k+'" '+(P.sort===k?'selected':'')+'>'+l+'</option>').join('')+'</select>'+btn('invmore','MAIS','','inv-more')+'<div class="vt"><button data-act="view" data-v="grid" class="'+(P.view==='grid'?'on':'')+'" aria-label="Ver em grade">▦</button><button data-act="view" data-v="list" class="'+(P.view==='list'?'on':'')+'" aria-label="Ver em lista">☰</button></div></div><div class="inv reference-inv"><nav class="cats" aria-label="Categorias">'+CATS.map(([k,l,ic])=>'<button data-act="cat" data-k="'+k+'" class="'+(P.cat===k&&!P.q?'on':'')+'">'+iconImg(ic,17)+l+(k==='novo'&&nNew?' ('+nNew+')':'')+'</button>').join('')+'</nav><div id="inv-grid">'+invGrid()+'</div></div>';}
function invGrid(){let list=invEntries(P.cat),q=norm(P.q.trim());if(P.cat==='cura'&&P.sort==='rec')list.sort((a,b)=>(a.k==='eter_p'?-1:a.k==='pocao_p'?0:1)-(b.k==='eter_p'?-1:b.k==='pocao_p'?0:1));if(q)list=list.filter(e=>norm(entName(e)).includes(q));const sorts={rec:(a,b)=>P.cat==='cura'?0:(b.i||0)-(a.i||0),nome:(a,b)=>entName(a).localeCompare(entName(b)),qual:(a,b)=>(b.g?.q||0)-(a.g?.q||0),tier:(a,b)=>(b.g?.tier||0)-(a.g?.tier||0)};list.sort(sorts[P.sort]||sorts.rec);if(!list.length)return '<p class="empty inv-empty">'+(q?'Nada encontrado.':'')+'</p>';return '<div class="'+(P.view==='grid'?'grid':'list')+'">'+list.map(e=>e.g?'<button class="it" data-act="item" data-id="'+e.g.id+'">'+iconImg(e.g,32)+'<span class="'+qCls(e.g)+'">'+gName(e.g)+'</span></button>':'<button class="it" data-act="stack" data-k="'+e.k+'">'+iconImg(e.k,32)+'<span>'+ITEMS[e.k].n+' <small>('+fmt(e.n)+')</small></span></button>').join('')+'</div>';}
function hEquip(){
 const set=P.set;
 const cell=(sl)=>{const it=equippedIn(set,sl);if(sl==='offhand'&&!it)return '<span class="empty-offhand"></span>';const text=it?Object.entries(gearStats(it)).map(([k,v])=>({atk:'Atq',mag:'Mag',def:'Def',res:'Res',hp:'HP',mp:'Mana',dex:'Des',crit:'Crít'}[k]||k)+': '+v).join('　'):'';return '<button class="slot" data-act="slot" data-sl="'+sl+'"><span class="sl">'+SLOT_LBL[sl]+'</span><span class="fr">'+(it?iconImg(it,48):'×')+'</span>'+(it?'<span class="nm">'+gName(it)+'</span><span class="st">'+text+'</span>':'')+'</button>';};
 return '<div class="seg reference-loadouts" role="tablist">'+SETS.map(k=>'<button class="btn '+(set===k?'sel':'')+'" role="tab" aria-selected="'+(set===k)+'" data-act="eqset" data-k="'+k+'">'+SET_LBL[k]+'</button>').join('')+'</div><div class="doll reference-doll '+(S.hideDoll?'hide-doll':'')+'"><img class="pix ghost" src="'+sprUrl(heroMini(false))+'" alt=""><span></span>'+cell('head')+'<span></span>'+cell('weapon')+cell('chest')+cell('offhand')+cell('acc1')+cell('legs')+cell('acc2')+'</div>';
}
function mainMenuIcon(k){
 if(k==='codex')return icon('ic_codex',27);if(k==='portal')return icon('ic_gate',27);if(k==='key')return iconImg(['key'],27);
 if(k==='discord')return '<svg width="27" height="27" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="#8295ef"/><path d="M9 10l4-1 1 2h4l1-2 4 1 3 13-6 2-1-2h-6l-1 2-6-2z" fill="#fff"/><circle cx="12" cy="17" r="2" fill="#8295ef"/><circle cx="20" cy="17" r="2" fill="#8295ef"/></svg>';
 if(k==='help')return '<svg width="27" height="27" viewBox="0 0 32 32" aria-hidden="true"><path d="M4 4h24v18H16l-6 7v-7H4z" fill="#ecd1a5"/><path d="M2 7h3v13H2zM28 7h2v13h-2z" fill="#a69770"/></svg>';
 return '<svg width="27" height="27" viewBox="0 0 32 32" aria-hidden="true"><path d="M5 2h22v28H5z" fill="#6f7068"/><path d="M7 5h18v23H7z" fill="#404d51"/><path d="M9 14l7-6v4h10v5H16v4z" fill="#dfae38"/><path d="M5 1h5v3H5z" fill="#d3d8cb"/></svg>';
}
function vMainMenu(){
 const entries=[['closemain','Menu Principal','back'],['community','Discord','discord'],['mainnav','Codex','codex','codex'],['mainnav','Obter ajuda','help','helpview'],['mainnav','Opções','key','settings'],['mainnav','Centro de Eventos','portal','events']];
 return '<div class="main-coins">'+runeGlyph(20)+fmt(S.ess)+'　'+iconImg(['coin'],20)+fmt(S.gold)+'</div><button class="main-inbox" data-act="mainnav" data-k="inbox">'+iconImg(['scroll'],18)+' CAIXA DE ENTRADA</button><nav class="main-links" aria-label="Menu do herói">'+entries.map(([act,l,ic,k])=>'<button data-act="'+act+'" '+(k?'data-k="'+k+'"':'')+'>'+mainMenuIcon(ic)+'<span>'+l+'</span></button>').join('')+'</nav><button class="main-runes rbtn" data-act="herotab" data-k="runes"><span class="disc">'+runeGlyph(38)+'</span><span>Loja de Runas</span></button><div class="main-actions"><button class="rbtn" data-act="mainnav" data-k="skills"><span class="disc">'+uiIcon('skillnav',38)+'</span><span>Habilidades</span></button><button class="rbtn" data-act="herotab" data-k="status"><span class="disc">'+sprImg(heroMini(false),42)+'</span><span>Status<small>Nível '+S.lvl+' '+stars(ptier())+'</small></span></button><button class="rbtn" data-act="herotab" data-k="equip"><span class="disc">'+uiIcon('leather',38)+'</span><span>Equipamento</span></button></div>';
}
function vSettings(){return banner('Opções','Preferências e progresso')+'<div class="settings-actions">'+btn('snd',SND?'Som: ligado':'Som: desligado')+btn('exportsave','Exportar save')+btn('importsave','Importar save')+btn('togglemotion',S.reduceMotion?'Animações: reduzidas':'Animações: completas')+btn('title','Voltar ao título')+'</div><p class="fine">O progresso é salvo neste navegador. Exporte um backup antes de trocar de aparelho.</p>';}
function vHelpView(){return banner('Obter ajuda','Comandos e regras')+'<div class="card"><p>Toque no chão para andar e nos monstros para lutar. No computador, use as setas ou WASD.</p><p>O Codex explica combate, fraquezas e equipamentos. Chefes comuns deixam selos de invocação para o Desafio da Aurora.</p><p>Se o jogo não iniciar no visualizador de arquivos, abra o HTML em um navegador. Use Opções para exportar o save.</p></div>'+btn('mainnav','Abrir Codex','data-k="codex"');}
function vEvents(){return banner('Centro de Eventos','Desafios locais')+'<div class="card"><b>Desafio da Aurora</b><p>Derrote chefes para conseguir selos. Cada vitória contra o Guardião vale três medalhas, trocadas na Loja de Runas.</p>'+btn('herotab','Loja de Runas','data-k="runes"')+'</div><div class="card"><b>Trabalhos do dia</b><p>As missões diárias renovam à meia-noite do aparelho.</p>'+btn('dailyquests','Ver trabalhos')+'</div>'+(buffOn('xp2')||buffOn('gold2')?'<div class="card"><b>Bênçãos ativas</b><p>'+(buffOn('xp2')?'Sabedoria: XP +100% · '+mmss(S.buffs.xp2-Date.now())+'<br>':'')+(buffOn('gold2')?'Sorte: ouro +100% · '+mmss(S.buffs.gold2-Date.now()):'')+'</p></div>':'');}
function vInbox(){const wins=S.raid.wins;return banner('Caixa de entrada','Correspondência da sua aventura')+'<div class="card"><b>Bem-vindo a Vaelmar</b><p>Seu personagem vive neste aparelho. Faça backups do progresso em Opções.</p></div>'+(wins?'<div class="card"><b>Registro da Aurora</b><p>'+wins+' vitória(s) contra o Guardião. Medalhas disponíveis: '+S.raid.seals+'.</p>'+btn('herotab','Trocar medalhas','data-k="runes"')+'</div>':'<p class="fine">As conquistas do Desafio da Aurora aparecerão aqui.</p>');}
function vRuneShop(){return '<div class="rune-heading"><b>Loja de Runas</b><span>'+S.raid.seals+' medalha(s)</span></div><p class="fine">Os prêmios são conquistados derrotando o chefe especial.</p>'+vRaid();}
VIEWS.main={r:vMainMenu};VIEWS.settings={r:vSettings};VIEWS.helpview={r:vHelpView};VIEWS.events={r:vEvents};VIEWS.inbox={r:vInbox};
ACT.mainnav=el=>setView(el.dataset.k);
ACT.herotab=el=>setView('hero',el.dataset.k);
ACT.closemain=()=>closePanel();
ACT.dailyquests=()=>setView('quests','daily');
ACT.community=()=>openModal(()=>'<h3>Discord</h3><p>A comunidade precisa de conexão à internet. O jogo e seu progresso funcionam neste aparelho sem conexão.</p>'+btn('closemodal','Fechar'));
ACT.skillinfo=el=>openModal(()=>'<h3>'+SKILLS[el.dataset.k].n+'</h3><p>'+SKILLS[el.dataset.k].d+'</p><p>'+SKILLS[el.dataset.k].mp+' de mana</p>'+btn('closemodal','Fechar'));
ACT.passiveinfo=el=>{const ps=PASSIVES[pathOf()].slice().reverse(),p=ps[+el.dataset.i];openModal(()=>'<h3>'+(p?p.n:'Efeito ativo')+'</h3><p>'+(p?p.d(ptier()):'As bênçãos têm duração limitada e são conquistadas explorando o mapa.')+'</p>'+btn('closemodal','Fechar'));};
ACT.togglemotion=()=>{S.reduceMotion=!S.reduceMotion;document.body.classList.toggle('reduced-motion',S.reduceMotion);save();renderPanel();};
ACT.invmore=()=>openModal(()=>'<h3>Inventário</h3><p>'+unequipped().length+' / 60 equipamentos soltos</p>'+btn('healall','Usar poções para curar')+btn('seenall','Marcar todos como vistos')+btn('closemodal','Fechar'));
ACT.appearance=()=>openModal(()=>'<h3>Aparência</h3>'+btn('toggledoll',S.hideDoll?'Mostrar personagem no equipamento':'Ocultar personagem no equipamento')+btn('closemodal','Fechar'));
ACT.toggledoll=()=>{S.hideDoll=!S.hideDoll;save();refresh();};
ACT.managesets=()=>openModal(()=>'<h3>Conjunto '+SET_LBL[P.set]+'</h3><p>'+SET_NOTE[P.set]+'</p>'+btn('secondaryslot','Equipar mão secundária')+(P.set!=='padrao'?btn('copyset','Copiar do Padrão','data-set="'+P.set+'"')+btn('clearset','Limpar conjunto','data-set="'+P.set+'"'):'')+btn('closemodal','Fechar'));
ACT.secondaryslot=()=>openModal(mSlot,'offhand',P.set);
function syncReferenceUI(){
 overlay.classList.toggle('main-sheet',P.kind==='main');overlay.dataset.view=P.kind||'';overlay.dataset.tab=P.tab||'';
 document.querySelectorAll('#sheet-foot .aux').forEach(el=>el.remove());
 if(P.kind==='hero'&&P.tab==='equip'){
  const f=document.getElementById('sheet-foot');f.insertAdjacentHTML('afterbegin','<button class="rclose aux" data-act="appearance" aria-label="Aparência">'+iconImg(['hood'],28)+'</button>');f.insertAdjacentHTML('beforeend','<button class="rclose aux" data-act="managesets" aria-label="Gerenciar conjuntos">'+iconImg(['key'],28)+'</button>');
 }
}


/* Deterministic battle rules; source coverage and balance assumptions: FIDELIDADE.md. */
const Rules=(()=>{
 const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,finite(v,a)));
 const bands=[['broken','Quebrado',70,89,'q-broken'],['poor','Ruim',90,99,'q-poor'],['common','Padrão',100,100,'q-std'],['superior','Superior',110,119,'q-sup'],['famed','Afamado',120,130,'q-fam'],['legendary','Lendário',140,170,'q-leg'],['ornate','Ornado',170,200,'q-orn']];
 const statuses={Poisoned:{id:'poison',name:'Envenenado',dot:.05},Burning:{id:'burn',name:'Em chamas',dot:.05,atk:.8,mag:.8},Rot:{id:'rot',name:'Putrefação',dot:.03,def:.8,res:.8},Bleeding:{id:'bleed',name:'Sangrando',dot:.02},Blight:{id:'blight',name:'Praga',dot:.02},Blind:{id:'blind',name:'Cego',miss:.5},Asleep:{id:'sleep',name:'Adormecido',skip:1,wake:true},Lulled:{id:'lulled',name:'Sono profundo',skip:1,wake:true},Stunned:{id:'stun',name:'Atordoado',skip:.5},Paralyzed:{id:'paralysis',name:'Paralisado',skip:.5},Frozen:{id:'frozen',name:'Congelado',skip:.5},Petrified:{id:'petrified',name:'Petrificado',skip:1},Doom:{id:'doom',name:'Condenado',doom:true},Berserk:{id:'berserk',name:'Fúria',atk:1.5,dot:.05,beneficial:true},'Berserk II':{id:'berserk2',name:'Fúria II',atk:1.5,mag:1.5,def:1.5,res:1.5,dot:.05,beneficial:true},'Berserk III':{id:'berserk3',name:'Fúria III',atk:1.5,mag:1.5,def:1.5,res:1.5,dot:.05,beneficial:true},'Dmg ↑':{id:'berserk',name:'Fúria',damage:1.5,dot:.05,beneficial:true}};
 const statMap={Att:'atk',Atk:'atk',Mag:'mag',Def:'def',Res:'res',Dex:'dex',Crit:'crit',All:'all',Ward:'ward',Accuracy:'accuracy'};
 function effectDef(name){
  name=String(name||'');if(Object.hasOwn(statuses,name))return statuses[name];
  const m=name.match(/(Att|Atk|Mag|Def|Res|Dex|Crit|All|Ward|Accuracy)\s*([↑↓]+)/i);
  if(m){const key=Object.keys(statMap).find(k=>k.toLowerCase()===m[1].toLowerCase()),count=m[2].length,up=m[2][0]==='↑';return {id:name,name,stat:statMap[key],mul:up?(count===1?1.25:count===2?1.5:2):(count===1?.8:.2),beneficial:up,temporary:/^T\.|Temp/i.test(name)};}
  return {id:name,name,temporary:/^T\.|Temp/i.test(name)};
 }
 function harmful(name){const d=effectDef(name);return !d.beneficial&&!!(d.dot||d.skip||d.miss||d.doom||d.stat&&d.mul<1||/Cursed|Toxic|Confused|Drenched|blight|Mark|Curse/i.test(name));}
 function init(o){
  if(!o.effects||typeof o.effects!=='object'||Array.isArray(o.effects))o.effects={};
  const capacity=Math.round((finite(o.maxhp)+finite(o.maxmp))/2);
  o.maxWard=Math.max(0,finite(o.maxWard,capacity));o.ward=clamp(o.ward,0,o.maxWard);
  o.wardAbsorb=clamp(finite(o.wardAbsorb,.25),0,1);o.wardTurns=Math.max(0,Math.floor(finite(o.wardTurns)));return o;
 }
 function multiplier(f,stat){let m=1;for(const e of Object.values(f.effects||{})){const d=effectDef(e.name);if(d.stat===stat||d.stat==='all')m*=d.mul||1;if(d[stat])m*=d[stat];}return m;}
 function effective(f,stat){let n=finite(f[stat])*multiplier(f,stat);if(f.lowHP&&f.maxhp>0)n*=1+f.lowHP*(1-f.hp/f.maxhp);if(f.lowMana&&f.maxmp>0)n*=1+f.lowMana*(1-f.mp/f.maxmp);return Math.max(0,finite(n));}
 function applyEffect(target,name,chance=1,rand=Math.random){
  if(!target||target.hp<=0||!name)return false;init(target);
  if(rand()>=clamp(chance,0,1)||target.effectImmunities?.includes(name))return false;
  if(harmful(name)&&rand()<clamp(target.statusProtection||0,0,1))return false;
  const d=effectDef(name);target.effects[d.id]={name,remaining:d.temporary?3:-1,age:0,fresh:true};return true;
 }
 function removeEffects(target,names){for(const [k,e]of Object.entries(target.effects||{}))if(names.includes(e.name)||names.includes('All'))delete target.effects[k];}
 function tick(f,rand=Math.random){
  init(f);let damage=0,skip=false;const expired=[];
  for(const [k,e]of Object.entries(f.effects)){const d=effectDef(e.name),justApplied=e.fresh===true;e.fresh=false;e.age=(e.age||0)+1;if(d.dot&&!justApplied)damage+=Math.max(1,Math.floor(f.maxhp*d.dot));if(d.skip&&rand()<d.skip)skip=true;if(d.doom&&e.age>=5)damage=f.hp;
   if(harmful(e.name)&&!d.stat&&!d.temporary&&!d.doom&&rand()<.2)expired.push(k);
  }
  damage=Math.max(0,finite(damage));f.hp=Math.max(0,f.hp-damage);for(const k of expired)delete f.effects[k];return {damage,skip,dead:f.hp<=0};
 }
 function endTurn(f){
  for(const [k,e]of Object.entries(f.effects||{})){if(e.fresh){e.fresh=false;continue;}if(e.remaining>0&&--e.remaining===0)delete f.effects[k];}
  if(f.wardFresh)f.wardFresh=false;else f.wardTurns=Math.max(0,(f.wardTurns||0)-1);
 }
 function elementMult(t,el){if(t.immune?.includes(el))return 0;if(t.weak?.includes(el))return 1.5;if(t.eres?.includes(el))return .5;return 1;}
 function damage(a,t,o={},rand=Math.random){
  init(a);init(t);const stat=o.stat||'atk',attack=stat==='both'?(effective(a,'atk')+effective(a,'mag'))*.5:effective(a,stat==='mag'?'mag':'atk'),defense=effective(t,stat==='mag'?'res':'def'),element=o.elem||'fis';
  for(const e of Object.values(a.effects))if(effectDef(e.name).miss&&rand()<effectDef(e.name).miss)return {d:0,miss:true,el:element};
  const dodge=clamp(((effective(t,'dex')-effective(a,'dex'))/Math.max(1,effective(t,'dex')))*.4,0,finite(t.maxDodge,.4));if(!o.neverMiss&&rand()<dodge)return {d:0,miss:true,dodge:true,el:element};
  const pow=o.powerRange?[o.powerRange[0]/1000,(o.powerRange[1]??o.powerRange[0])/1000]:[finite(o.pow,1),finite(o.pow,1)];
  const m1=finite(o.penetration,pow[0]),m2=o.outputRange?o.outputRange[0]+rand()*(o.outputRange[1]-o.outputRange[0]):finite(o.output,pow[1]===pow[0]||!pow[0]?1:1+rand()*(pow[1]/pow[0]-1));
  const isSkill=!!(o.powerRange||o.penetration),statBuff=stat==='both'?1:multiplier(a,stat==='mag'?'mag':'atk');
  let n=Math.max(0,(isSkill?attack/Math.max(.01,statBuff):attack)*m1-defense/2)*m2*(isSkill?statBuff:1)*(.925+rand()*.15);
  const el=elementMult(t,element);n*=el;if(a.faction&&a.faction===element)n*=1.25;if(t.faction&&t.faction===element)n*=.8;
  for(const e of Object.values(a.effects)){const d=effectDef(e.name);if(d.damage)n*=d.damage;}
  const baseCrit=o.critAbsolute==null?(stat==='mag'?0:finite(a.crit,5)):o.critAbsolute+(finite(a.crit,5)-5);
  const critChance=clamp(baseCrit*multiplier(a,'crit'),0,100),crit=rand()*100<critChance;if(crit)n*=finite(a.critDamage,2);
  if(o.exec&&t.hp<t.maxhp*.35)n*=2;
  return {d:Math.max(0,Math.round(finite(n))),crit,el:element,note:el===0?'Imune':el>1?'Fraqueza':el===.5?'Resistiu':''};
 }
 function receive(t,amount,{dot=false}={}){
  init(t);const n=Math.max(0,Math.round(finite(amount)));let absorbed=0;
  if(!dot&&t.wardTurns>0&&t.ward>0){absorbed=Math.min(t.ward,Math.round(n*t.wardAbsorb));t.ward-=absorbed;}
  const hpLoss=n-absorbed;t.hp=Math.max(0,t.hp-hpLoss);
  if(hpLoss)for(const [k,e]of Object.entries(t.effects))if(effectDef(e.name).wake)delete t.effects[k];return {hpLoss,absorbed};
 }
 function ward(f,{turns=1,absorb,recovery=0}={}){
  init(f);turns=Math.max(0,Math.floor(finite(turns)));f.wardTurns+=turns;if(turns>0)f.wardFresh=true;
  if(absorb!=null)f.wardAbsorb=Math.max(f.wardAbsorb,clamp(absorb,0,1));f.ward=Math.min(f.maxWard,f.ward+Math.round(f.maxWard*clamp(recovery,0,1)));return f.ward;
 }
 function gearStats(item,base,adorns=[]){
  const stats={},q=clamp(finite(item.q,1),.01,2),level=clamp(Math.floor(finite(item.lvl,1)),1,13),up=level<=10?1+.1*(level-1):level===11?2.1:level===12?2.4:2.7;
  for(const [k,v]of Object.entries(base?.stats||{}))stats[k]=Math.round(finite(v)*(['crit','init'].includes(k)?1:q*up));
  for(const a of adorns)for(const [k,v]of Object.entries(a?.stats||{}))stats[k]=(stats[k]||0)+finite(v);return stats;
 }
 function rollQuality(rand=Math.random,bonus=0){const r=rand()-bonus,i=r<.005?6:r<.03?5:r<.1?4:r<.25?3:r<.85?2:r<.95?1:0,b=bands[i];return {band:b[0],q:(b[2]+Math.floor(rand()*(b[3]-b[2]+1)))/100};}
 function quality(id){return bands.find(b=>b[0]===id)||bands[2];}
 const forgeHours=[0,0,1,2,3,5,12,24,24,48,72];
 function upgradeCost(item,base,target=item.lvl+1){const mats={},qty=target<=10?3*(target-1):target===11?Math.round(item.q*100*3):Math.round(item.q*100*6.66);for(const m of base.materials||[])if(m.key)mats[m.key]=qty;return {materials:mats,gold:Math.round((100+base.tier*120)*(target**2)*Math.max(.7,item.q)),milliseconds:(forgeHours[target]||0)*3600000};}
 return {finite,clamp,bands,statuses,effectDef,harmful,init,multiplier,effective,applyEffect,removeEffects,tick,endTurn,damage,receive,ward,elementMult,gearStats,rollQuality,quality,upgradeCost};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=Rules;

/* Public catalog adapter; names/facts are original, unspecified parameters stay configurable. */
const Catalog=(()=>{
 const data=AETHRIC_DATA.catalog,all=Object.values(data).flat(),byKey=Object.fromEntries(all.map(r=>[r.key,r])),byUrl=Object.fromEntries(all.map(r=>[r.url,r]));
 const canonicalClass=k=>({'c_0':'guerreiro','c_1':'mago','c_2':'ladino'}[k]||k),num=s=>+(String(s||'0').replaceAll(',','').match(/-?\d+(?:\.\d+)?/)||[0])[0];
 const aliases={pocao_p:'i_small-health-potion',eter_p:'i_small-mana-potion',pocao:'i_large-health-potion',eter:'i_large-mana-potion',pocao_g:'i_large-health-potion',elixir:'i_elixir',antidoto:'i_antidote',chave:'i_skeleton-key',ficha:'i_arena-token',linha:'i_fishing-line',madeira:'i_wood',pedra:'i_stone',couro:'i_leather',gosma:'i_slime',osso:'i_bone',seda:'i_silk',minerio:'i_iron',escama:'i_draconite',ectoplasma:'i_greater-soul',gema:'i_jewel',peixe:'i_unremarkable-fish',pocao_sup:'i_super-health-potion',eter_sup:'i_super-mana-potion'};
 const invKey=k=>byKey[aliases[k]]?aliases[k]:k;
 const oldClasses={...CLASSES},oldMon={...MON},oldItems={...ITEMS};
 const legacyClasses=Object.fromEntries(Object.keys(oldClasses).map(k=>[k,canonicalClass('c_'+(OFFICIAL_ART.hero[k]||'class_0').replace('class_',''))]));
 let redrawTimer=null;const canvases=new Map();
 function redraw(){
  if(!S)return;const active=document.activeElement,id=active?.id,selection=typeof active?.selectionStart==='number'?[active.selectionStart,active.selectionEnd]:null,top=scrollEl.scrollTop,modalTop=mBody.scrollTop;
  if(!overlay.hidden)renderPanel();if(!modal.hidden)refreshModal();updateHUD();
  if(id){const next=document.getElementById(id);if(next&&next!==active){next.focus({preventScroll:true});if(selection)try{next.setSelectionRange(...selection);}catch{}}}
  scrollEl.scrollTop=top;mBody.scrollTop=modalTop;
 }

 function sprite(url,size=32,flip=false){const file=AETHRIC_DATA.assets[url];if(!file)return spr('goblin',{a:'#718476'});const key=file+'|'+size+'|'+!!flip;if(canvases.has(key))return canvases.get(key);const c=document.createElement('canvas');c.width=c.height=size;canvases.set(key,c);const im=new Image();im.onload=()=>{const g=c.getContext('2d');g.imageSmoothingEnabled=false;const q=size/Math.max(im.width,im.height),w=Math.max(1,Math.round(im.width*q)),h=Math.max(1,Math.round(im.height*q));g.save();if(flip){g.translate(size,0);g.scale(-1,1);}g.drawImage(im,Math.round((size-w)/2),size-h,w,h);g.restore();URLS.delete(c);clearTimeout(redrawTimer);redrawTimer=setTimeout(redraw,60);};im.src=file;return c;}
 function item(k){return byKey[invKey(k)];}
 function attachInv(state){const merged={};for(const [k,v]of Object.entries(state.inv||{}))merged[invKey(k)]=(merged[invKey(k)]||0)+(Number.isFinite(v)?Math.max(0,v):0);state.inv=merged;for(const [alias,key]of Object.entries(aliases)){if(alias!==invKey(alias))Object.defineProperty(state.inv,alias,{get(){return this[invKey(key)]||0},set(v){this[invKey(key)]=v},configurable:true,enumerable:false});}return state;}
 function sectionStatus(row,title){return (row.sections[title]||[]).map(e=>e.nameEn);}
 function install(){
  for(const k of Object.keys(CLASSES))delete CLASSES[k];for(const row of data.classes){const k=canonicalClass(row.key),path=row.gear[0]||'guerreiro',t=row.tier,base=path==='mago'?{hp:.75,mp:3,atk:.5,mag:2.4,def:.5,res:1.3,dex:1}:path==='ladino'?{hp:.9,mp:1.5,atk:1.1,mag:.8,def:.8,res:.8,dex:1.5}:{hp:1,mp:1,atk:1,mag:1,def:1,res:1,dex:1};const boost=1+(t-1)*.18;for(const stat in base)base[stat]*=boost;CLASSES[k]={n:row.name,tier:t,req:null,cost:row.cost,gear:row.gear,m:base,skills:row.skills.filter(s=>s.key).map(s=>[s.level,s.key]),d:'Classe de tier '+t+'. '+row.abilities.join(' · '),original:row.key,passiveEffects:row.effects,summoner:row.summoner,immune:row.immune};PATH_OF[k]=path;CLASS_SPR[k]='hero_'+path;}
  Object.assign(CLASSES.guerreiro.m,{hp:1,mp:1,atk:1,mag:1,def:1,res:1,dex:1});
  for(const path of Object.keys(PATHS))PATHS[path].tiers=Array.from({length:10},(_,i)=>Object.keys(CLASSES).filter(k=>PATH_OF[k]===path&&CLASSES[k].tier===i+1));
  for(const row of data.spells){const s={n:row.name,mp:row.mp,kind:row.action==='damage'?'dmg':row.action==='effects'?'buff':row.action,stat:row.type==='fis'?'atk':'mag',elem:row.element,pow:row.power?row.power[0]/1000:1,powerRange:row.power,hits:row.hits,all:row.all,critAbsolute:row.crit,castTurns:row.castTurns,d:row.summary,original:row.key,row};SKILLS[row.key]=s;MOVES[row.key]=s;}
  for(const row of data.items){const price=Math.max(5,Math.round((10+row.tier*20+Object.values(row.stats||{}).reduce((a,b)=>a+Math.abs(b),0)*4)*(row.kind==='pot'?.5:1)));ITEMS[row.key]={n:row.name,kind:row.kind,hp:row.recovery?.hp||0,mp:row.recovery?.mp||0,price,d:row.summary||'Item de tier '+row.tier+'.',original:row.key};}
  // Documented consumables retain their actual recovery. Legacy aliases share the same record.
  for(const [alias,key]of Object.entries(aliases))if(ITEMS[key])ITEMS[alias]=ITEMS[key];
  for(const row of [...data.monsters,...data.bosses,...data.raids]){const boss=row.category!=='monsters';MON[row.key]={n:row.name,spr:'goblin',fam:row.family,boss,m:{hp:boss?2.8:1,atk:1,mag:1,def:1,res:1},moves:(row.skills.length?row.skills:['s_charge']).map(k=>[k,1]),weak:[],res:[],drops:[],original:row.key,row,raid:row.category==='raids'};}
  for(const row of data.followers){PETS[row.key]={n:row.name,spr:'wolf',tier:row.tier,price:Math.round(500*row.tier**3),m:{hp:1,atk:1,mag:1},moves:(row.skills.length?row.skills:['s_bolt']).map(k=>[k,1]),original:row.key,row};}
  for(const [name,color]of Object.entries({dragao:'#ae9062',poison:'#7c9d3b'})){ELEM[name]=name==='dragao'?'Dragão':'Veneno';ELEM_COL[name]=color;}
 }
 return {data,byKey,byUrl,canonicalClass,num,aliases,invKey,oldClasses,oldMon,oldItems,legacyClasses,sprite,item,attachInv,sectionStatus,install};
})();
Catalog.install();
const Legacy={newState,migrate,stats,itemIcon,classicHero,classicMonster,gearStats,genGear,vCodex,renderParty,layoutBattle,drawBattle,vTown,pSmith,pShop,questKill,questCheck,show,save,renderPanel,afterBattle,doHeroAct,foeAct};
classicHero=(k,flip)=>{const row=Catalog.byKey[CLASSES[k]?.original];return row?Catalog.sprite(row.sprite,24,flip):Legacy.classicHero('guerreiro',flip);};
classicMonster=(k,flip)=>{const row=Catalog.byKey[k];return row?Catalog.sprite(row.sprite,row.category==='raids'?48:row.category==='bosses'?36:24,flip):Legacy.classicMonster(k,flip);};
petMini=(k,flip)=>{const row=Catalog.byKey[k];return row?Catalog.sprite(row.sprite,24,flip):spr('wolf',{a:'#ac996f'},flip);};
itemIcon=x=>{const row=typeof x==='string'?Catalog.item(x):x?.catalogKey?Catalog.byKey[x.catalogKey]:null;return row?Catalog.sprite(row.sprite,16):Legacy.itemIcon(x);};
const skillSprite=skIcon;skIcon=(k,size=32)=>{const row=Catalog.byKey[k];return row?sprImg(Catalog.sprite(row.sprite,32),size):skillSprite(k,size);};
addItem=(k,n=1)=>{k=Catalog.invKey(k);S.inv[k]=(S.inv[k]||0)+n;};
const qty=k=>S?.inv[Catalog.invKey(k)]||0;
newState=(cls,name)=>{const s=Legacy.newState(CLASSES[cls]?cls:'guerreiro',name);s.content=4;s.questFlags={};s.originalQuests={};s.claimedRaids={};s.raidProgress={};s.premiumUnlocks=[];s.xp=0;s.inv={};s.town={loja:0,casa:0,bestiario:0,ferreiro:0,prefeitura:0};Catalog.attachInv(s);for(const [k,n]of Object.entries({pocao_p:25,eter_p:25,chave:2,ficha:2,linha:5}))s.inv[k]=n;return s;};
genGear=(tier,slot,type,qBonus=0,q)=>{let candidates=Catalog.data.items.filter(x=>x.kind==='gear'&&x.tier<=tier&&x.tier>=Math.max(1,tier-1)&&(!slot||x.slot===slot)&&(!type||x.gear.includes(type))&&!x.tags.includes('Exotic'));if(!candidates.length)candidates=Catalog.data.items.filter(x=>x.kind==='gear'&&x.tier<=tier&&(!slot||x.slot===slot));const base=pick(candidates);if(!base)throw Error('Nenhum equipamento compatível');return makeCatalogGear(base.key,q, qBonus);};
function makeCatalogGear(key,q,bonus=0){const base=Catalog.byKey[key];if(!base||base.kind!=='gear')throw Error('Equipamento inexistente: '+key);const qual=q?{q,band:q>=1.7?'ornate':q>=1.4?'legendary':q>=1.2?'famed':q>=1.1?'superior':q<.9?'broken':q<1?'poor':'common'}:Rules.rollQuality(Math.random,bonus);return {id:uid(),catalogKey:key,slot:base.slot,type:base.gear.length>1?'any':base.gear[0],base:base.nameEn,name:base.name,tier:base.tier,q:qual.q,qualityBand:qual.band,lvl:1,seed:0,adornments:[]};}
gearStats=it=>it.catalogKey?Rules.gearStats(it,Catalog.byKey[it.catalogKey],(it.adornments||[]).map(k=>Catalog.byKey[k])):Legacy.gearStats(it);
canWear=it=>{const row=Catalog.byKey[it.catalogKey];return row?row.kind==='gear'&&row.tier<=tierOfLv(S.lvl)&&(row.facts['Useable by']!=='Summoner classes'||CLASSES[S.cls].summoner)&&row.gear.some(k=>CLASSES[S.cls].gear.includes(k)):it.type==='any'||CLASSES[S.cls].gear.includes(it.type);};
gearPrice=it=>Math.max(10,Math.round((it.catalogKey?ITEMS[it.catalogKey]?.price||100:100)*it.q*it.lvl));
qCls=it=>Rules.quality(it.qualityBand)[4];qTag=it=>'<span class="badge">'+Rules.quality(it.qualityBand)[1]+' '+Math.round(it.q*100)+'%</span>';
starterGear=cls=>{const p=PATH_OF[cls];const rows=Catalog.data.items;const weapon=p==='guerreiro'?Catalog.byKey.i_rusty_sword:undefined;const find=(n)=>rows.find(x=>x.nameEn===n);const w=makeCatalogGear((find(p==='mago'?'Wooden Staff':p==='ladino'?'Dagger':'Rusty Sword')).key,1),cBase=find(p==='mago'?'Robe':'Leather Jacket')||rows.find(x=>x.tier===1&&x.slot==='chest'&&x.gear.includes(p)&&!x.tags.includes('Exotic')),c=makeCatalogGear(cBase.key,1);S.bag.push(w,c);S.sets.padrao.weapon=w.id;S.sets.padrao.chest=c.id;};
function classEffects(cls=S.cls){return CLASSES[cls]?.passiveEffects||[];}
function passiveValue(term,cls=S.cls){let max=0;for(const line of classEffects(cls)){const p=line.split('/').find(t=>t.trim().startsWith(term+':'));if(p)max=Catalog.num(p.split(':').slice(1).join(':'));}return max;}
stats=(set='padrao')=>{const c=CLASSES[S.cls],base=baseStats(S.lvl),st={};for(const k in base)st[k]=base[k]*(c.m[k]||1);st.crit=5;st.ward=0;st.init=0;let wardMult=1;
 for(const sl of SLOTS){const it=equippedIn(set,sl);if(!it)continue;const g=gearStats(it);for(const [k,n]of Object.entries(g))if(k==='ward')wardMult*=1+n/100;else st[k]=(st[k]||0)+n;}
 const sp=S.spec&&SPECS[S.spec];if(sp)for(const [k,n]of Object.entries(sp.bonus))st[k]*=1+n;
 if(c.original==='c_0'){const weapon=equippedIn(set,'weapon');if(weapon)st.atk+=(gearStats(weapon).atk||0)*.05;}
 st.crit+=passiveValue('Crit Chance');for(const k in st)st[k]=Math.round(st[k]);for(const k of ['hp','mp','atk','mag','def','res','dex'])st[k]=Math.max(k==='hp'?1:0,Rules.finite(st[k]));st.crit=Rules.clamp(st.crit,0,100);st.init+=Math.max(2,Math.floor(st.dex*.15+c.tier));st.vision=180+passiveValue('View Distance');st.maxWard=Math.max(1,Math.round((st.hp+st.mp)/2*Math.max(0,wardMult)*(1+passiveValue('Ward')/100)));return st;};
learnSkills=()=>{const learned=[];for(const key of S.classes)for(const [lv,id]of CLASSES[key]?.skills||[])if(lv<=S.lvl&&!S.skills.includes(id)){S.skills.push(id);learned.push(id);if(S.equipped.length<skillSlots())S.equipped.push(id);}if(S.spec&&SPECS[S.spec]?.skill&&!S.skills.includes(SPECS[S.spec].skill)){S.skills.push(SPECS[S.spec].skill);}return learned;};
function skillSlots(){return Math.min(12,6+Math.floor((CLASSES[S.cls]?.tier||1)/3));}
// Cumulative experience thresholds; unverified/interpolated rows remain in the fidelity report.
const XP_TABLE=Object.fromEntries((AETHRIC_DATA.xpTable?.records||[]).map(x=>[x.level,x.nextTotal]));
xpNext=L=>XP_TABLE[L]||200+25*(L-1)+6*(L-1)**2;
gainXp=n=>{
 const lines=[];if(!Number.isFinite(n)||n<0)return lines;if(buffOn('xp2'))n*=2;S.xp=Math.min(Number.MAX_SAFE_INTEGER,S.xp+Math.round(n));
 while(S.lvl<250&&S.xp>=xpNext(S.lvl)){S.lvl++;const st=stats();S.hp=st.hp;S.mp=st.mp;
  if(cur==='battle'&&B?.hero&&!B.finished){const battleStats=stats(setOfMode(B.mode));Object.assign(B.hero,battleStats,{maxhp:battleStats.hp,maxmp:battleStats.mp,hp:battleStats.hp,mp:battleStats.mp});B.hero.ward=Rules.clamp(B.hero.ward,0,battleStats.maxWard);S.hp=B.hero.hp;S.mp=B.hero.mp;}
  lines.push(['Nível '+S.lvl+'!','gold']);for(const k of learnSkills())lines.push(['Aprendeu '+SKILLS[k].n,'gold']);
 }return lines;
};
function usableConsumable(key){const row=Catalog.item(key);return row?row.kind==='pot':ITEMS[key]?.kind==='pot';}
usePotion=key=>{
 const k=Catalog.invKey(key),d=ITEMS[k],row=Catalog.byKey[k];if(!S||qty(k)<1||!d||!usableConsumable(k))return false;
 const fighter=cur==='battle'&&B?.hero&&!B.finished?B.hero:null,st=fighter?{hp:fighter.maxhp,mp:fighter.maxmp}:stats(),current=fighter||S;
 let changed=false;const recovery=row?.recovery||(row?.heal?{[row.heal.stat]:row.heal.flat}:!row?{hp:d.hp||0,mp:d.mp||0}:{});
 for(const stat of ['hp','mp']){const n=row?.fullRecovery?st[stat]:Math.round((recovery[stat]||0)*(1+passiveValue('Healing')/100)),next=Math.min(st[stat],current[stat]+n);if(next>current[stat]){current[stat]=next;changed=true;}}
 const contexts=fighter?[fighter]:[S.expedition?.carry,S.expedition?.activeBattle?.hero].filter(Boolean);
 for(const target of contexts){target.maxhp??=st.hp;target.maxmp??=st.mp;target.maxWard??=st.maxWard;target.hp??=S.hp;target.mp??=S.mp;const before=Object.keys(target.effects||{}).length;Rules.removeEffects(target,(row?.sections.Cures||[]).map(e=>e.nameEn));if(Object.keys(target.effects||{}).length<before)changed=true;
  for(const effect of row?.sections.Gives||[])if(Rules.applyEffect(target,effect.nameEn,probability(effect)))changed=true;
 }
 const buff=/exp-potion/.test(k)?'xp2':/lucky-silver-coin/.test(k)?'ess2':/lucky-coin/.test(k)?'gold2':null;
 if(buff){S.buffs[buff]=Math.max(Date.now(),S.buffs[buff]||0)+3600000;changed=true;}
 if(!changed)return false;S.hp=current.hp;S.mp=current.mp;S.inv[k]--;sfx.heal();return true;
};
ACT.healall=()=>{let used=0;for(const row of Catalog.data.items.filter(x=>x.recovery).sort((a,b)=>(a.heal?.flat||0)-(b.heal?.flat||0)))while(qty(row.key)>0&&usePotion(row.key))used++;toast(used?'Poções utilizadas: '+used:'Nenhuma poção necessária.');save();refresh();};
ACT.use=el=>{if(!usePotion(el.dataset.k))toast('Não precisa agora.');save();refresh();};

/* Measured community map geometry, current place labels; exact tile geometry remains unknown. */
const World={layout:AETHRIC_DATA.world,mask:AETHRIC_DATA.mask,regionNames:{L:'Bosques de Loton',F:'Lagoa de Fen',Y:'Bosques de Lythryn',A:'Athantia e Avalon',D:'Deserto de Suddun',U:'Dunas de Suddun',M:'Meropis',O:'Onogoro',J:'Montanhas de Jotunheim',V:'Nothren e Valhalla',K:'Minas de Myrkheim',N:'Nova Lyonesse',R:'Profundezas de Balor',T:'Provações de Olympia',P:'Asphodel',G:'Repouso de Deméter'},byKind:{}};
for(const k of Object.keys(ZONES))delete ZONES[k];
for(const region of World.layout.regions){const t=region.tier,mobs=Catalog.data.monsters.filter(x=>x.tier===t&&!x.event),bosses=Catalog.data.bosses.filter(x=>x.tier===t&&!x.event);ZONES[region.key]={n:World.regionNames[region.key]||region.name,stars:t,minLv:region.minLevel,lv:[region.minLevel,region.maxLevel],bio:region.biome,spawn:mobs.map(x=>[x.key,1]),night:[],boss:bosses[0]?.key};}
ZONES['~']={n:'Mar de Aethric',stars:1,minLv:1,lv:[1,1],bio:'grass',spawn:[],night:[],boss:null};
POIS.length=0;for(const k of Object.keys(POI))delete POI[k];
const typeSprites={dungeon:'den',arena:'coliseum',monument:'tower',tower:'tower',guild:'hut',workshop:'house_big'};
for(const row of World.layout.pois){const [tx,ty]=row.suggestedTile160||row.normalized.map(n=>Math.round(n*160)),kind=['town','origin','arena','waygate','dungeon'].includes(row.kind)?row.kind:row.kind==='gate'?'waygate':row.kind==='tower'||row.kind==='monument'?'dungeon':'town';let zk=World.mask.rows[Math.min(159,ty)]?.[Math.min(159,tx)]||'L';if(zk==='~'||!ZONES[zk]||ZONES[zk].minLv>(row.minLevel||1))zk=World.layout.regions.find(r=>r.tier===row.tier)?.key||'L';
 const p={id:row.id,kind,n:row.name,tx:Math.min(157,Math.max(2,tx)),ty:Math.min(157,Math.max(2,ty)),clear:kind==='town'?3:2,zone:zk,minLv:row.minLevel||1,spr:typeSprites[row.kind]||'hut',services:row.services||[],source:row,originalKind:row.kind};
 if(kind==='town')p.houses=[[-1,-1,'house_red'],[1,0,'house_blue']];if(kind==='dungeon')p.dg=p.id;POIS.push(p);POI[p.id]=p;(World.byKind[kind]||=([])).push(p);
}
// Legacy aliases do not create duplicate places on the map.
POI.alvorada=POI.loton;POI.origem=POI.origin;POI.forja=POI.svarga;
const defaultTypes=Object.fromEntries(Catalog.data.dungeons.map(r=>[r.nameEn,r]));
for(const k of Object.keys(DUNGEONS))delete DUNGEONS[k];
for(const p of POIS.filter(p=>p.kind==='dungeon')){const t=p.source.tier||ZONES[p.zone].stars,pool=ZONES[p.zone].spawn.map(x=>x[0]),boss=Catalog.data.bosses.find(x=>x.tier===t&&!x.event)?.key;DUNGEONS[p.id]={n:p.n,stars:t,lv:Math.max(1,p.minLv||ZONES[p.zone].minLv)+8,floors:p.originalKind==='tower'?20:p.originalKind==='monument'?10:5+t,keys:p.originalKind==='monument'?1:1,bio:ZONES[p.zone].bio,pool,boss,intro:'Explore os andares de '+p.n+'.',type:p.originalKind,zone:p.zone};}
// Origin town and central hub are always reachable, as in the offline town workflow.
function originalRegionAt(x,y){return World.mask.rows[Math.max(0,Math.min(159,y))]?.[Math.max(0,Math.min(159,x))]||'~';}
genWorld=()=>{TMAP=new Uint8Array(WW*WH);ZGRID=[];for(let y=0;y<WH;y++)for(let x=0;x<WW;x++){const k=originalRegionAt(x,y),z=ZONES[k],n=vn(x/5,y/5),p=hn(x,y,8);ZGRID[y*WW+x]=k;let t=T.GRASS;if(k==='~')t=T.WATER;else if(z.bio==='cave')t=n>.72?T.CLIFF:T.ROCKY;else if(z.bio==='snow')t=n>.75?T.CLIFF:T.ROCKY;else if(z.bio==='desert')t=n>.8?T.ROCKY:T.SAND;else if(z.bio==='swamp')t=n>.74?T.WATER:n>.5?T.SWAMP:n<.28?T.FOREST:T.GRASS;else if(z.bio==='ruins')t=n>.8?T.CLIFF:n>.62?T.FLOOR:T.GRASS;else t=n>.54?T.FOREST:p>.96?T.DIRT:T.GRASS;TMAP[y*WW+x]=t;}
 for(const p of POIS){for(let y=p.ty-3;y<=p.ty+3;y++)for(let x=p.tx-3;x<=p.tx+3;x++)if(x>=0&&y>=0&&x<WW&&y<WH&&Math.hypot(x-p.tx,y-p.ty)<3.4){ZGRID[y*WW+x]=p.zone;setT(x,y,T.GRASS);}clearArea(p.tx,p.ty,p.clear,T.GRASS);}
 ROADS=(World.layout.roads||[]).map(r=>r.normalized.map(([x,y])=>[Math.round(x*WW),Math.round(y*WH)]));for(const points of ROADS)for(let i=1;i<points.length;i++)road(points[i-1],points[i]);
 const pts=ROADS.flat();for(const p of POIS){const near=pts.filter(([x,y])=>ZGRID[y*WW+x]===p.zone);const options=near.length?near:pts;if(!options.length)continue;const q=options.reduce((a,b)=>Math.hypot(a[0]-p.tx,a[1]-p.ty)<Math.hypot(b[0]-p.tx,b[1]-p.ty)?a:b);if(Math.hypot(q[0]-p.tx,q[1]-p.ty)<25)road([p.tx,p.ty],q);clearArea(p.tx,p.ty,1,T.GRASS);}
};
const originalWorldGeneration=genWorld;genWorld=()=>{originalWorldGeneration();const hub=POI.loton;for(const p of POIS.filter(p=>p.minLv===1&&(p.kind==='town'||p.kind==='origin'))){road([hub.tx,hub.ty],[p.tx,p.ty]);const steps=Math.ceil(Math.hypot(hub.tx-p.tx,hub.ty-p.ty)*3);for(let i=0;i<=steps;i++){const f=i/steps,x=Math.round(hub.tx+(p.tx-hub.tx)*f),y=Math.round(hub.ty+(p.ty-hub.ty)*f);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(x+dx>=0&&x+dx<WW&&y+dy>=0&&y+dy<WH){ZGRID[(y+dy)*WW+x+dx]='L';if(TMAP[(y+dy)*WW+x+dx]===T.CLIFF)setT(x+dx,y+dy,T.GRASS);}}}}};
const tracedWorldGeneration=genWorld;genWorld=()=>{tracedWorldGeneration();for(const z of Object.keys(ZONES)){const points=POIS.filter(p=>p.zone===z);if(points.length<2)continue;const done=[points.shift()];while(points.length){let best=null;for(const a of done)for(const b of points){const d=Math.hypot(a.tx-b.tx,a.ty-b.ty);if(!best||d<best.d)best={a,b,d};}road([best.a.tx,best.a.ty],[best.b.tx,best.b.ty]);done.push(best.b);points.splice(points.indexOf(best.b),1);}}};
// Enemy population is chosen from the published tier catalog, rather than renamed generic creatures.
spawnMon=(spot,key,boss)=>{const z=ZONES[spot.z],low=z.lv[0],high=z.lv[1],mid=clamp(S.lvl,low,high),lv=clamp(mid+(boss?3:ri(-2,2)),low,high);if(boss){const choices=Catalog.data.bosses.filter(x=>x.tier===z.stars&&!x.event&&x.nameEn!=='Medea');key=pick(choices)?.key||key;}const m={id:MID++,key,lv,x:spot.x,y:spot.y,hx:spot.x,hy:spot.y,z:spot.z,boss:!!boss,tx:spot.x,ty:spot.y,t:rnd(0,2),flip:Math.random()<.5,ph:Math.random()*6};EX.mons.push(m);return m;};
TOWN_BIO.loton='forest';for(const p of POIS.filter(p=>p.kind==='town'))TOWN_BIO[p.id]=ZONES[p.zone].bio;
vMap=()=>'<h2 class="dec sheet-h">Mapa de Aethric</h2><p class="fine">Toque no mapa para caminhar. Selecione uma cidade visitada para viajar.</p><div class="mapbox"><canvas id="cv-map" width="640" height="640"></canvas></div><div class="region-list">'+POIS.filter(p=>p.kind==='town'||p.kind==='origin').map(p=>'<button class="btn" data-act="worldtravel" data-id="'+p.id+'" '+(S.lvl<p.minLv||!S.visited?.[p.id]?'disabled':'')+'><b>'+p.n+'</b><small>Nível '+p.minLv+(S.visited?.[p.id]?' · visitado':'')+'</small></button>').join('')+'</div>';
ACT.worldtravel=el=>{const p=POI[el.dataset.id];if(!p||S.lvl<p.minLv||!S.visited?.[p.id])return;const c=poiPx(p);H.x=c.x;H.y=c.y+20;H.path=[];H.goal=null;closePanel();save();};
const legacyEnterPoi=enterPoi;enterPoi=p=>{if(S.lvl<p.minLv){toast('Disponível no nível '+p.minLv+'.');return;}S.visited||={};S.visited[p.id]=true;save();if(p.kind==='dungeon'&&p.originalKind==='tower'){openPanel('dungeon',null,p.id);return;}legacyEnterPoi(p);};
vGates=()=>banner('Viagem','Destinos disponíveis')+'<p class="fine">O transporte entre ilhas e regiões funciona localmente.</p>'+POIS.filter(p=>['town','origin','waygate'].includes(p.kind)||p.originalKind==='workshop').map(p=>'<div class="card"><b>'+p.n+'</b><span class="fine">Nível '+p.minLv+'</span>'+btn('ferrytravel','Viajar','data-id="'+p.id+'" '+(S.lvl<p.minLv?'disabled':''))+'</div>').join('');
ACT.ferrytravel=el=>{const p=POI[el.dataset.id];if(!p||S.lvl<p.minLv)return;S.visited||={};S.visited[p.id]=true;const c=poiPx(p);H.x=c.x;H.y=c.y+20;H.path=[];H.goal=null;closePanel();save();};

/* Combat uses current published actions; community numbers are isolated from Codex facts. */
const normalizeName=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
const Numeric=AETHRIC_DATA.numeric;
for(const row of Catalog.data.spells)for(const e of row.summons||[]){if(e.key)continue;let base=Catalog.data.monsters.find(m=>normalizeName(m.nameEn)===normalizeName(e.nameEn));if(!base){const key='u_'+normalizeName(e.nameEn);base=Catalog.byKey[key];if(!base){base={key,name:e.name,nameEn:e.nameEn,sprite:e.sprite,category:'monsters',facts:{Tier:'★ '+row.tier},effects:[],tags:[],tier:row.tier,hp:null,skills:[],drops:[],sections:{},summoned:true};Catalog.byKey[key]=base;MON[key]={n:e.name,boss:false,m:{},moves:[],row:base,original:key};}}e.key=base.key;}
const OfflineBalance={loot:.32,bossLoot:.7,weakness:1.5};
/* Public Codex sprites face left; legacy generated sprites face right. */
function battleSprite(f,friendly){
 const row=f.hero?Catalog.byKey[CLASSES[S.cls]?.original]:f.rival?Catalog.byKey[CLASSES[f.cls]?.original]:Catalog.byKey[f.key];
 const flip=row?!!friendly:!friendly;
 if(f.hero)return heroMini(flip);
 if(f.rival)return classSpr(f.cls,flip);
 if(f.follower||f.pet)return petMini(f.key,flip);
 return monMini(f.key,flip);
}
for(const row of Catalog.data.spells){const n=Numeric.spells[normalizeName(row.nameEn)],s=SKILLS[row.key];if(n?.type?.includes('Hybrid'))s.stat='both';if(n?.m1&&n.m2lo){s.penetration=n.m1;s.outputRange=[n.m2lo,n.m2hi||n.m2lo];}if(n?.turns>1)s.castTurns=n.turns;if(n?.wardTurns&&!row.ward)row.ward={turns:n.wardTurns};}
monStats=(k,L)=>{const row=Catalog.byKey[k];if(!row)return {hp:50+L*12,mp:100,atk:6+L*2,mag:5+L*2,def:5+L,res:5+L,dex:5+L};const n=Numeric.monsters[normalizeName(row.nameEn)],scalar=[0,1,1.1,1.75,2.5,3.5,5,7,8,10,11][Math.min(10,row.tier)];const defense=n?.defDelta!=null?Math.floor(Math.floor(10+n.defDelta*L)*(n.scalar||scalar)):Math.round((10+.7*L)*scalar);return {hp:row.hp||Math.round(n?.hpBase!=null&&n.hpDelta!=null?n.hpBase+n.hpDelta*L:(30+14*L)*(row.category==='monsters'?1:3)),mp:Math.max(100,30+L*12),atk:Math.round((7+L*2.6)*Math.sqrt(scalar)),mag:Math.round((5+L*2.5)*Math.sqrt(scalar)),def:defense,res:defense,dex:Math.round(5+L*1.2),crit:5};};
makeFoe=(k,L)=>{const d=MON[k],row=Catalog.byKey[k];if(!d)throw Error('Criatura inexistente: '+k);const st=monStats(k,L);return Rules.init({id:'f'+FID++,key:k,n:d.n,lv:L,boss:!!d.boss,...st,maxhp:st.hp,maxmp:st.mp,st:{},buf:{},effects:{},ward:0,spr:monMini(k,true),ox:0,oy:0,flash:0,alpha:1,moves:d.moves,weak:[],eres:[],immune:[],effectImmunities:(row?.sections.Immunities||[]).map(x=>x.nameEn)});};
heroFighter=mode=>{const set=setOfMode(mode),st=stats(set),c=CLASSES[S.cls],gear=SLOTS.map(sl=>equippedIn(set,sl)).filter(Boolean).map(it=>Catalog.byKey[it.catalogKey]).filter(Boolean),immunities=gear.flatMap(r=>(r.sections.Immunities||[]).map(e=>e.nameEn));return Rules.init({id:'hero',n:S.name,hero:true,...st,maxhp:st.hp,maxmp:st.mp,hp:Math.min(st.hp,S.hp),mp:Math.min(st.mp,S.mp),ward:st.maxWard,wardTurns:0,st:{},buf:{},effects:{},spr:heroMini(false),ox:0,oy:0,flash:0,alpha:1,weak:[],eres:[],immune:c.immune||[],faction:S.faction||null,effectImmunities:immunities,statusProtection:passiveValue('Status Protection')/100});};
petFighter=()=>{if(CLASSES[S.cls].summoner)return null;const k=S.pets[S.pet]?.key,d=PETS[k];if(!d)return null;const st=monStats(k,S.lvl),boost=1+(SPECS[S.spec]?.pet||0)+passiveValue('Follower Stats')/100;st.atk=Math.round(st.atk*boost);st.mag=Math.round(st.mag*boost);return Rules.init({id:'pet',key:k,n:d.n,pet:true,follower:true,...st,hp:Infinity,maxhp:Infinity,mp:Infinity,maxmp:Infinity,st:{},buf:{},effects:{},spr:petMini(k),ox:0,oy:0,flash:0,alpha:1,weak:[],eres:[],immune:[],rates:d.row?.rates||{}});};
const baseLayout=layoutBattle;layoutBattle=()=>{if(!B)return;for(const f of [B.hero,B.pet,...(B.summons||[])].filter(Boolean))f.spr=battleSprite(f,true);for(const f of B.foes)f.spr=battleSprite(f,false);const all=B.foes;try{B.foes=all.filter(f=>f.hp>0);baseLayout();}finally{B.foes=all;}(B.summons||[]).filter(f=>f.hp>0).forEach((f,i)=>{f.k=Math.max(1,Math.round(BS.k*.7));f.sc=f.k/BS.u;f.hw=f.spr.width*f.sc/2;f.hh=f.spr.height*f.sc;f.x=BS.AW*(.08+(i%3)*.1);f.y=BS.AH-18-Math.floor(i/3)*20;});};
renderParty=()=>{if(!B)return;renderFoes();const pcs=[B.hero,...(B.summons||[]).filter(f=>f.hp>0)];$('#party').innerHTML=pcs.map(p=>'<div class="pc"><img class="pix" src="'+sprUrl(p.spr)+'" alt=""><b>'+esc(p.n)+'</b><div class="bar"><i class="hp" style="width:'+clamp(p.hp/p.maxhp*100,0,100)+'%"></i></div>'+(p.hero?'<div class="bar"><i class="mp" style="width:'+clamp(p.mp/Math.max(1,p.maxmp)*100,0,100)+'%"></i></div>':'')+'<div class="v"><span>'+Math.round(p.hp)+'/'+p.maxhp+' HP</span>'+(p.hero?'<span>'+Math.round(p.mp)+'/'+p.maxmp+' Mana</span>':'')+'<span>Proteção: '+p.ward+'/'+p.maxWard+' · '+p.wardTurns+' turnos</span></div><span class="fine">'+Object.values(p.effects||{}).map(e=>esc(e.name)).join(' · ')+'</span></div>').join('')+(B.pet?'<div class="pc follower"><img class="pix" src="'+sprUrl(B.pet.spr)+'" alt=""><b>'+esc(B.pet.n)+'</b><span class="fine">Seguidor · ações automáticas</span></div>':'');};
const baseRenderFoes=renderFoes;renderFoes=()=>{baseRenderFoes();if(!B)return;document.querySelectorAll('#foes .foe').forEach((el,i)=>{const f=B.foes[i];el.querySelector('.st').textContent=Object.values(f.effects||{}).map(e=>e.name).join(' · ');});};
calcHit=(a,t,o)=>Rules.damage(a,t,{...o,elem:o.elem||'fis'});
applyDamage=(t,d)=>Rules.receive(t,d).hpLoss;
hitTarget=async(a,t,o={})=>{if(!t||t.hp<=0)return {d:0};const r=Rules.damage(a,t,o),[x,y]=cxPos(t);if(r.miss){floatText(x,y,r.dodge?'Esquivou':'Errou','#c8c4dc');await wait(120);return r;}const received=Rules.receive(t,r.d);r.dealt=received.hpLoss;floatText(x,y,''+r.d+(r.crit?'!':''),r.crit?'#ffe14a':t.hero?'#ff9988':'#ffffff');fxBurst(x,y,r.el,r.crit);(t.hero?sfx.hurt:sfx.hit)();if(r.note)say(t.n+': '+r.note+'.');if(a.hero&&o.stat!=='mag'&&r.d>0){const weapon=equippedIn(setOfMode(B.mode),'weapon'),row=weapon&&Catalog.byKey[weapon.catalogKey];for(const effect of row?.sections.Causes||[])Rules.applyEffect(t,effect.nameEn,probability(effect));}if(o.drain){a.hp=Math.min(a.maxhp,a.hp+Math.round(r.d*o.drain));}if(!t.hero&&!t.summon&&!t.rival){cx(t.key).el[r.el]=r.note||'norm';}if(t.hp<=0){say(t.n+' caiu.');t.alpha=0;dismissSummons(t.id);fxBurst(x,y,'puff',t.boss);}renderParty();await wait(S.reduceMotion?30:160);return r;};
pickFoeTarget=()=>{const targets=[B.hero,...B.summons.filter(f=>f.hp>0)];return pick(targets);};
const probability=e=>Math.max(0,Math.min(1,((String(e.meta||'').match(/([\d.]+)%/)||[])[1]||100)/100));
function actionEffects(actor,target,row,{landed=true}={}){
 if(landed&&target?.hp>0)for(const e of row.causes||[])if(Rules.applyEffect(target,e.nameEn,probability(e)))say(target.n+': '+e.name);
 for(const e of row.gives||[])if(Rules.applyEffect(actor,e.nameEn,probability(e)))say(actor.n+': '+e.name);
 Rules.removeEffects(actor,(row.cures||[]).map(e=>e.nameEn));
}
function summonActor(row,owner=B.hero){
 const friendly=owner.hero||owner.summon||owner.follower,group=friendly?B.summons:B.foes,limit=friendly?5:3;
 if(group.filter(f=>f.hp>0).length>=limit){say('Não há espaço para outra invocação.');return false;}
 const candidates=row.summons.filter(x=>Catalog.byKey[x.key]);if(!candidates.length)return false;const m=pick(candidates),f=makeFoe(m.key,owner.lv||S.lvl);
 f.boss=false;f.summonOwnerId=owner.id;f.id=(friendly?'summon':'f')+FID++;f.alpha=1;
 if(friendly){B.summons=B.summons.filter(x=>x.hp>0);f.summon=true;f.spr=monMini(m.key);f.hp=f.maxhp=Math.round(f.maxhp*(1+passiveValue('Summon Stats')/100));B.summons.push(f);}else{f.enemySummon=true;B.foes=B.foes.filter(x=>!x.enemySummon||x.hp>0);B.foes.push(f);}
 Rules.init(f);layoutBattle();say(f.n+' foi invocado.','good');return true;
}
function supportedSkill(s){const r=s.row||{};return !!(r.power||r.heal||r.ward||r.summons?.length||r.pact||r.gives?.length||r.causes?.length||r.cures?.length||!s.row&&['dmg','heal','ward','buff'].includes(s.kind));}
function skillRow(s){
 if(s.row)return s.row;const names={atk:'Att',mag:'Mag',def:'Def',res:'Res',dex:'Dex'};
 return {key:s.original,heal:s.kind==='heal'?{stat:'hp',fraction:s.pow||.25,magic:true}:null,ward:s.kind==='ward'?{turns:2,flat:s.pow||1}:null,gives:Object.entries(s.buff||{}).filter(([k])=>names[k]).map(([k,v])=>({nameEn:names[k]+(v<0?' ↓':' ↑'),name:names[k],meta:'100%'})),causes:s.st?[{nameEn:({veneno:'Poisoned',queimar:'Burning',sono:'Asleep',cegar:'Blind',paralisar:'Paralyzed',atordoar:'Stunned'})[s.st[0]],name:'Efeito',meta:(s.st[1]*100)+'%'}]:[]};
}
async function performSkill(actor,s,target,{free=false,complete=false}={}){
 if(!s||!supportedSkill(s)){say('Esta técnica ainda não está disponível nesta edição.');return 'retry';}
 const row=skillRow(s),friendly=actor.hero||actor.summon||actor.follower,allies=friendly?[B.hero,...B.summons.filter(f=>f.hp>0)]:B.foes.filter(f=>f.hp>0),hostile=friendly?B.foes.filter(f=>f.hp>0):[B.hero,...B.summons.filter(f=>f.hp>0)];
 const isParty=/party/i.test(row.target||'');const ally=actor.follower?B.hero:isParty&&allies.includes(target)?target:actor;
 if(row.pact&&actor.hero&&!B.summons.some(x=>x.hp>0)){say('Esta técnica precisa de uma invocação.');return 'retry';}
 if(row.summons?.length&&(friendly?B.summons:B.foes).filter(f=>f.hp>0).length>=(friendly?5:3)){say('Não há espaço para outra invocação.');return 'retry';}
 if(!complete&&!free){if(actor.mp<s.mp){say('Mana insuficiente.');return 'retry';}actor.mp-=s.mp;}
 if(!complete&&s.castTurns>1){actor.charging={s,targetId:target?.id,remaining:s.castTurns-1};say(actor.n+' prepara '+s.n+' ('+s.castTurns+' turnos).');return;}
 say(actor.n+' usa '+s.n+'.');target=target?.hp>0?target:hostile[0];
 if(row.summons?.length)summonActor(row,actor);
 else if(row.pact&&actor.hero){const sacrifice=B.summons.find(x=>x.hp>0);if(row.sacrifice){sacrifice.hp=0;sacrifice.alpha=.15;}if(target)await hitTarget({...actor,mag:Math.max(actor.mag,sacrifice.mag)*2},target,s);}
 else if(s.kind==='dmg'||row.power){for(let hit=0;hit<(s.hits||1);hit++)for(const t of s.all?hostile:[target])if(t?.hp>0){const result=await hitTarget(actor,t,s);actionEffects(actor,t,row,{landed:!result.miss&&result.d>0});}}
 else for(const recipient of row.all&&isParty?allies:[ally]){
  if(row.heal){const stat=row.heal.stat,n=row.heal.flat||Math.round((stat==='hp'?recipient.maxhp:recipient.maxmp)*(row.heal.fraction||.25)+(row.heal.magic?actor.mag:0));recipient[stat]=Math.min(stat==='hp'?recipient.maxhp:recipient.maxmp,recipient[stat]+n);floatText(...cxPos(recipient),'+'+n,'#8fe08a');}
  if(row.ward){const ward=row.ward;let recovery=ward.flat?Math.min(1,(actor.mag*ward.flat+actor.maxhp*.2)/Math.max(1,recipient.maxWard)):ward.recover?.1:0;if(/mend-wall/.test(row.key||''))recovery=/iii/.test(row.key)?.5:/ii/.test(row.key)?.3:.1;Rules.ward(recipient,{turns:ward.turns,absorb:ward.absorb,recovery});}
  actionEffects(recipient,row.self||isParty?recipient:target||recipient,row);
 }
 if(actor.hero){const siphon=passiveValue('Mana Siphon')/100;if(siphon&&Math.random()<siphon)actor.mp=Math.min(actor.maxmp,actor.mp+Math.round(actor.maxmp*.1));}
 renderParty();await wait(S.reduceMotion?20:180);
}
async function chargeTurn(actor){const c=actor.charging;if(!c)return false;if(--c.remaining>0){say(actor.n+' continua preparando '+c.s.n+'.');return true;}actor.charging=null;const target=[...B.foes,B.hero,...B.summons].find(t=>t.id===c.targetId);await performSkill(actor,c.s,target,{complete:true,free:true});return true;}
heroChoose=async()=>{const h=B.hero;for(;;){const v=await choose([{v:'atk',l:'Atacar',cls:'gold'},{v:'skill',l:'Habilidades',s:S.equipped.length+' equipadas'},{v:'item',l:'Itens',dis:B.mode==='arena'},{v:'guard',l:'Defender',s:'Proteção por 1 turno'},{v:'flee',l:'Fugir',dis:!B.canFlee}]);if(v==='atk'){const t=await pickTarget();if(t)return {k:v,t};}else if(v==='skill'){const id=await choose(S.equipped.filter(k=>SKILLS[k]).map(k=>({v:k,l:SKILLS[k].n,s:SKILLS[k].mp+' Mana'+(SKILLS[k].castTurns>1?' · '+SKILLS[k].castTurns+' turnos':''),dis:h.mp<SKILLS[k].mp||!supportedSkill(SKILLS[k])})).concat([{v:'back',l:'Voltar'}]),'list');if(id==='back')continue;const s=SKILLS[id];let t=null;if(!s.row?.self&&!s.all){if(/party/i.test(s.row?.target||'')){const allies=[h,...B.summons.filter(f=>f.hp>0)];if(allies.length===1)t=h;else{const id=await choose(allies.map(f=>({v:f.id,l:f.n})).concat([{v:'back',l:'Voltar'}]),'list');if(id==='back')continue;t=allies.find(f=>f.id===id);}}else t=await pickTarget();if(!t)continue;}return {k:'skill',id,s,t};}else if(v==='item'){const own=Object.keys(S.inv).filter(k=>qty(k)>0&&usableConsumable(k));if(!own.length){say('Sem poções.');continue;}const key=await choose(own.map(k=>({v:k,l:ITEMS[k].n+' ×'+qty(k),s:ITEMS[k].d})).concat([{v:'back',l:'Voltar'}]),'list');if(key!=='back')return {k:'item',key};}else return {k:v};}};
doHeroAct=async a=>{const h=B.hero;if(a.k==='atk'){say(h.n+' ataca.');const r=await hitTarget(h,a.t,{stat:'atk',pow:1,elem:'fis'});const chance=passiveValue('Collateral Chance')/100,damage=passiveValue('Collateral Damage')/100;for(const other of B.foes.filter(f=>f.hp>0&&f!==a.t))if(Math.random()<chance)await hitTarget(h,other,{stat:'atk',pow:damage,elem:'fis'});return r;}if(a.k==='skill')return performSkill(h,a.s,a.t);if(a.k==='guard'){Rules.ward(h,{turns:1});say('Você defende com proteção.');}if(a.k==='item'){if(usePotion(a.key)){h.hp=S.hp;h.mp=S.mp;say('Você usa '+ITEMS[a.key].n+'.');}else{say('O item não é necessário.');return 'retry';}}if(a.k==='flee'&&B.canFlee){if(Math.random()<.8)return 'flee';say('A fuga falhou.');}renderParty();};
foeAct=async f=>{if(await chargeTurn(f))return;const skills=(f.skills||f.moves?.map(x=>x[0])||[]).map(k=>SKILLS[k]).filter(Boolean);const useful=skills.filter(s=>supportedSkill(s)&&(!f.rival||f.mp>=s.mp)&&(!s.row?.heal||f.hp<f.maxhp*.65));if(useful.length&&Math.random()<.65){const skill=pick(useful);if(!f.rival)cx(f.key).moves[skill.row?.key||skill.original]=1;await performSkill(f,skill,pickFoeTarget(),{free:!f.rival});}else await hitTarget(f,pickFoeTarget(),{stat:'atk',pow:1});};
petAct=async()=>{const p=B.pet;if(!p)return;if(await chargeTurn(p))return;const row=Catalog.byKey[p.key];if(!row)return;const options=row.skills.map(k=>SKILLS[k]).filter(Boolean),rates=row.rates||{};const groups=[['Heal rate',options.filter(s=>s.row.heal),B.hero.hp<B.hero.maxhp*.75],['Buff rate',options.filter(s=>s.row.self&&!s.row.heal),true],['Debuff rate',options.filter(s=>s.row.causes?.length&&!s.row.power),true],['Spell rate',options.filter(s=>s.row.power),true]];for(const [rate,skills,ok]of groups)if(ok&&skills.length&&Math.random()<Math.min(1,(rates[rate]||0)*(1+(SPECS[S.spec]?.pet||0)))){await performSkill(p,pick(skills),B.foes.find(f=>f.hp>0),{free:true});return;}if(Math.random()<Math.min(1,(rates['Attack rate']||0)*(1+(SPECS[S.spec]?.pet||0))))await hitTarget(p,B.foes.find(f=>f.hp>0),{stat:'atk',pow:1});};
function dismissSummons(ownerId){for(const f of [...B.foes,...B.summons])if(f.summonOwnerId===ownerId&&f.hp>0){f.hp=0;f.alpha=0;dismissSummons(f.id);}}
async function actorStatus(f){const r=Rules.tick(f);if(r.dead){f.alpha=0;dismissSummons(f.id);}if(r.damage){floatText(...cxPos(f),''+r.damage,'#cd8bc5');say(f.n+' sofre '+r.damage+' por efeitos.');renderParty();}if(r.skip)say(f.n+' não consegue agir.');return r;}
function checkpointBattle(){
 if(!B||B.phase==='action')return;
 if(B.mode!=='arena'){S.hp=Math.max(0,Math.round(B.hero.hp));S.mp=Math.max(0,Math.round(B.hero.mp));}
 const terminal=['lose','flee','won'].includes(B.phase),snapshot=terminal?null:BattleState.capture(B);
 if(B.raidKey){const p=S.raidProgress[B.raidKey];if(p){p.hp=B.foes[0].hp;p.combat=snapshot;}}
 if(B.mode==='dungeon'&&S.expedition){S.expedition.activeBattle=snapshot;if(B.phase==='lose')S.expedition=null;}
 if(B.mode==='arena'&&S.arenaSession)S.arenaSession.combat=snapshot;
 save();
}
function beginEnemyPhase(){B.phase='enemies';B.enemyIndex=0;B.enemyTurnIds=B.foes.filter(f=>f.hp>0).map(f=>f.id);}
battle=async opts=>{
 B={foes:opts.foes,mode:opts.mode||'map',bio:opts.bio||'grass',canFlee:opts.canFlee!==false,hero:heroFighter(opts.mode||'map'),pet:petFighter(),summons:[],round:0,raidKey:opts.raidKey,floor:opts.floor,phase:'hero_start'};
 if(B.mode==='arena'){B.hero.hp=B.hero.maxhp;B.hero.mp=B.hero.maxmp;}
 if(opts.carry){BattleState.hero(B.hero,opts.carry);B.summons=opts.carry.summons||[];}
 if(opts.resume){BattleState.restore(B,opts.resume);if(B.mode==='arena'){B.hero.hp=opts.resume.hero.hp;B.hero.mp=opts.resume.hero.mp;}}
 BS.fx=[];BS.floats=[];BS.target=false;logEl.innerHTML='';show('battle');sizeBattle();layoutBattle();renderParty();
 for(const f of B.foes)if(!f.rival)cx(f.key).seen=1;say(B.foes.map(f=>f.n+' · nível '+f.lv).join(', '));
 if(!opts.resume&&Math.max(...B.foes.map(f=>f.dex*.15+(f.boss?3:0)))+Math.random()*6>B.hero.init+Math.random()*6){say('O inimigo toma a iniciativa.');beginEnemyPhase();}
 let result=null;checkpointBattle();
 while(!result){
  const h=B.hero;if(h.hp<=0){result='lose';break;}if(B.foes.every(f=>f.hp<=0)){result='win';break;}
  if(B.phase==='hero_start'){
   B.round++;const st=await actorStatus(h);if(st.dead){result='lose';break;}
   if(st.skip){Rules.endTurn(h);B.phase='allies';}
   else if(h.charging){B.phase='action';await chargeTurn(h);Rules.endTurn(h);B.phase='allies';}
   else B.phase='hero_command';checkpointBattle();
  }else if(B.phase==='hero_command'){
   const action=await heroChoose();B.phase='action';const r=await doHeroAct(action);
   if(r==='retry'){B.phase='hero_command';checkpointBattle();continue;}if(r==='flee'){result='flee';break;}
   Rules.endTurn(h);B.phase='allies';checkpointBattle();
  }else if(B.phase==='allies'){
   B.phase='action';await petAct();
   for(const summon of B.summons.filter(f=>f.hp>0)){
    if(B.foes.every(f=>f.hp<=0))break;const st=await actorStatus(summon);
    if(!st.skip&&!st.dead){if(!await chargeTurn(summon)){const skills=summon.moves.map(x=>SKILLS[x[0]]).filter(s=>s&&supportedSkill(s));if(skills.length)await performSkill(summon,pick(skills),B.foes.find(f=>f.hp>0),{free:true});else await hitTarget(summon,B.foes.find(f=>f.hp>0),{stat:'atk',pow:1});}}
    Rules.endTurn(summon);
   }
   B.summons=B.summons.filter(f=>f.hp>0);beginEnemyPhase();checkpointBattle();
  }else if(B.phase==='enemies'){
   const id=B.enemyTurnIds[B.enemyIndex];if(!id){B.phase='hero_start';checkpointBattle();continue;}
   const f=B.foes.find(f=>f.id===id);if(f?.hp>0){B.phase='action';const st=await actorStatus(f);if(!st.skip&&!st.dead)await foeAct(f);Rules.endTurn(f);}
   B.enemyIndex++;B.phase='enemies';checkpointBattle();renderParty();
  }else if(B.phase==='victory_pending'){result='win';break;}else throw Error('Fase de combate inválida: '+B.phase);
 }
 B.phase=result==='win'?'victory_pending':result;checkpointBattle();BS.target=false;cmdEl.innerHTML='';
 if(result==='win'){sfx.win();await victory();}else if(result==='lose'){say('Você foi derrotado.','bad');sfx.lose();await wait(400);}
 B.finished=true;return result;
};
// Two observed baselines supplied by the player; other enemies retain documented local balance.
const ObservedRewards={m_crow:{level:1,xp:46,gold:3,orns:4},'b_goblin-lord':{level:8,xp:8640,gold:620,orns:80}};
function enemyReward(f){const observed=ObservedRewards[f.key];if(observed?.level===f.lv)return {xp:observed.xp,gold:observed.gold,orns:observed.orns};const row=Catalog.byKey[f.key],t=row?.tier||tierOfLv(f.lv),factor=f.boss?6:1;return {xp:Math.round(Math.max(30+f.lv*25,((XP_TABLE[Math.min(249,f.lv)]||0)-(XP_TABLE[Math.min(248,f.lv-1)]||0))/80)*factor),gold:Math.round((5+f.lv*3)*factor),orns:Math.round((2+t*3)*factor)};}
function lootRecord(key,gear){const row=Catalog.byKey[key],quality=gear&&Rules.quality(gear.qualityBand);return {key,label:(quality&&gear.qualityBand!=='common'?quality[1]+' ':'')+(row?.name||gear?.name||key),sprite:row?Catalog.sprite(row.sprite,24):null,cls:quality?.[4]||''};}
function awardEnemyLoot(f,rand=Math.random){
 const row=Catalog.byKey[f.key],drops=[];for(const key of row?.drops||[]){
  if(rand()>(f.boss?OfflineBalance.bossLoot:OfflineBalance.loot))continue;const item=Catalog.byKey[key];if(!item)continue;let gear=null;
  if(item.kind==='gear'){if(bagFull())continue;gear=makeCatalogGear(key);addGear(gear);drops.push(gear.name);}else{addItem(key);drops.push(item.name);}
  if(B?.lootRecords)B.lootRecords.push(lootRecord(key,gear));cx(f.key).drops[key]=1;
 }return drops;
}
victory=async()=>{
 if(B.rewarded)return;const ledger=B.raidKey?S.raidProgress[B.raidKey]:B.mode==='arena'?S.arenaSession:null;if(ledger?.rewarded){B.rewarded=true;return;}
 B.rewarded=true;B.lootRecords=[];let xp=0,gold=0,ess=0;const drops=[];
 for(const f of B.foes){
  if(f.enemySummon)continue;if(f.rival){xp+=Math.round(100+f.lv*20);gold+=100+f.lv*20;ess+=50+f.lv;continue;}
  const row=Catalog.byKey[f.key],rw=enemyReward(f);xp+=rw.xp;gold+=rw.gold*(buffOn('gold2')?2:1);ess+=rw.orns;
  if(row?.nameEn&&/Mammon|Arisen King Meliodas|Arisen Morrigan|Arisen Fafnir/.test(row.nameEn)&&Math.random()<.01)for(const item of S.bag.filter(i=>i.lvl===12&&isEquipped(i)))item.lvl=13;
  cx(f.key).kills++;questKill(f.key);drops.push(...awardEnemyLoot(f));
  if(f.boss&&B.mode!=='raid'){S.raid.sigils++;drops.push('Selo de desafio');B.lootRecords.push({label:'Selo de desafio'});}
 }
 if(B.raidKey){const progress=S.raidProgress[B.raidKey];if(!progress.rewarded){progress.rewarded=true;progress.hp=0;S.raid.seals+=3;S.raid.wins++;drops.push('3 moedas de prêmio');B.lootRecords.push({label:'3 moedas de prêmio'});}}
 if(B.mode==='arena'&&S.arenaSession){S.arenaSession.rewarded=true;S.arenaSession.won=true;S.cnt.arena++;S.quest.prog.arena=(S.quest.prog.arena||0)+1;
  if(S.lvl>=150&&Math.random()<.4&&!bagFull()){const items=Catalog.data.items.filter(r=>['Attuning Hood','Attuning Robe','Attuning Shoes'].includes(r.nameEn)),item=makeCatalogGear(pick(items).key,1);addGear(item);drops.push(item.name);B.lootRecords.push(lootRecord(item.catalogKey,item));}
 }
 if(buffOn('ess2'))ess*=2;S.gold+=gold;S.ess+=ess;say('Vitória! +'+fmt(xp)+' XP · +'+fmt(gold)+' ouro · +'+fmt(ess)+' orns','gold');if(drops.length)say('Saque: '+drops.join(', '),'gold');
 const levels=gainXp(xp);for(const [t,c]of levels)say(t,c);
 if(B.mode==='dungeon'&&S.expedition&&B.floor){S.expedition.floor=B.floor+1;S.expedition.carry=serializeExpedition();S.expedition.activeBattle=null;}
 B.phase='won';if(B.raidKey)S.raidProgress[B.raidKey].combat=null;if(B.mode==='arena'&&S.arenaSession){S.arenaSession.combat=null;S.hp=S.arenaSession.keepHp;S.mp=S.arenaSession.keepMp;}
 questCheck();renderParty();updateHUD();save();
 const continueCommand=choose([{v:1,l:'Continuar',cls:'gold wide'}],'one');
 showBattleReceipt({name:B.foes.filter(f=>!f.enemySummon).map(f=>f.n).join(', '),boss:B.foes.some(f=>f.boss),xp:Math.round(xp*(buffOn('xp2')?2:1)),gold,orns:ess,loot:B.lootRecords,levels:levels.map(([t])=>t)});
 await continueCommand;closeModal();
};

/* Save only completed action boundaries; restoring resumes the pending side of the turn. */
const BattleState=(()=>{
 const fields=['hp','mp','maxhp','maxmp','atk','mag','def','res','dex','crit','maxWard','ward','wardTurns','wardAbsorb','wardFresh'];
 const copy=o=>JSON.parse(JSON.stringify(o));
 function fighter(f){
  const r={id:f.id,key:f.key,lv:f.lv,effects:copy(f.effects||{}),summon:!!f.summon,enemySummon:!!f.enemySummon,summonOwnerId:f.summonOwnerId,rival:!!f.rival,cls:f.cls,n:f.n,skills:f.rival?f.skills:undefined};
  for(const k of fields)if(Number.isFinite(f[k])||typeof f[k]==='boolean')r[k]=f[k];
  if(f.charging){const key=f.charging.s.original||Object.keys(SKILLS).find(k=>SKILLS[k]===f.charging.s);if(key)r.charging={key,targetId:f.charging.targetId,remaining:f.charging.remaining};}
  return r;
 }
 function hydrate(r,summon=false){
  const f=r.rival?makeRival(r.lv):makeFoe(r.key,r.lv);if(r.rival){f.cls=r.cls;f.n=r.n;f.skills=(r.skills||[]).filter(k=>SKILLS[k]);f.spr=classSpr(r.cls,true);}for(const k of fields)if(Number.isFinite(r[k])||k==='wardFresh'&&typeof r[k]==='boolean')f[k]=r[k];
  f.id=r.id||f.id;f.effects=copy(r.effects||{});f.hp=Rules.clamp(f.hp,0,f.maxhp);f.mp=Rules.clamp(f.mp,0,f.maxmp);f.summon=summon;f.enemySummon=!!r.enemySummon;f.summonOwnerId=r.summonOwnerId;f.alpha=f.hp>0?1:0;
  if(summon){f.boss=false;f.spr=monMini(f.key);}f.charging=charging(r.charging);Rules.init(f);return f;
 }
 function charging(c){return c&&SKILLS[c.key]&&Number.isInteger(c.remaining)&&c.remaining>0?{s:SKILLS[c.key],remaining:c.remaining,targetId:c.targetId}:null;}
 function hero(f,r){if(!r)return;f.effects=copy(r.effects||{});for(const k of ['ward','wardTurns','wardAbsorb','wardFresh'])if(r[k]!=null)f[k]=r[k];f.charging=charging(r.charging);Rules.init(f);}
 function capture(b){return {schema:1,phase:b.phase,round:b.round,enemyIndex:b.enemyIndex||0,enemyTurnIds:b.enemyTurnIds||[],mode:b.mode,floor:b.floor,hero:fighter(b.hero),foes:b.foes.map(f=>fighter(f)),summons:b.summons.filter(f=>f.hp>0).map(f=>fighter(f)),pet:b.pet?fighter(b.pet):null};}
 function restore(b,r){
  b.round=r.round||0;b.phase=r.phase;b.enemyIndex=r.enemyIndex||0;b.enemyTurnIds=r.enemyTurnIds||[];hero(b.hero,r.hero);
  b.foes=r.foes.map(f=>hydrate(f));b.summons=(r.summons||[]).map(f=>hydrate(f,true)).filter(f=>f.hp>0);
  if(b.pet&&r.pet?.key===b.pet.key){b.pet.effects=copy(r.pet.effects||{});b.pet.charging=charging(r.pet.charging);}
  for(const f of [...b.foes,...b.summons]){const n=Number(String(f.id).match(/\d+$/)?.[0]);if(Number.isFinite(n))FID=Math.max(FID,n+1);}
 }
 function carry(){if(!B?.hero)return null;return {...fighter(B.hero),summons:B.summons.filter(f=>f.hp>0).map(f=>fighter(f))};}
 function restoreCarry(r){return r?{...r,summons:(r.summons||[]).map(f=>hydrate(f,true)).filter(f=>f.hp>0)}:null;}
 return {fighter,hydrate,hero,capture,restore,carry,restoreCarry};
})();

/* Progression, services and catalog UI. Offline adaptations are documented separately. */
const CategoryLabels={classes:'Classes',spells:'Habilidades',monsters:'Monstros',bosses:'Chefes',followers:'Seguidores',items:'Itens',raids:'Incursões',buildings:'Construções',dungeons:'Masmorras'};
const encyclopedia={category:'monsters',query:'',page:0};
function factualDetails(row){let h='<div class="row l">'+sprImg(Catalog.sprite(row.sprite,48),64)+'<div><h3>'+esc(row.name)+'</h3><span class="fine">'+esc(row.nameEn)+' · '+stars(row.tier)+'</span></div></div>';h+='<div class="grid2">'+Object.entries(row.facts||{}).map(([k,v])=>'<div class="kv"><span>'+esc(k)+'</span><b>'+esc(v)+'</b></div>').join('')+'</div>';if(row.effects?.length)h+=box('Efeitos',row.effects.map(esc).join('<br>'));for(const [title,list]of Object.entries(row.sections||{})){if(!list.length)continue;h+=box(esc(title),list.map(e=>'<div class="lrow">'+(e.sprite?sprImg(Catalog.sprite(e.sprite,24),24):'')+(e.key?'<button class="btn sm" data-act="fact" data-key="'+e.key+'">'+esc(e.name)+'</button>':esc(e.name))+'<span class="fine">'+esc(e.meta)+'</span></div>').join(''));}return h+btn('closemodal','Fechar');}
function catalogGrid(){const rows=Catalog.data[encyclopedia.category].filter(r=>!encyclopedia.query||norm(r.name+' '+r.nameEn).includes(norm(encyclopedia.query))),pages=Math.max(1,Math.ceil(rows.length/60));encyclopedia.page=Math.min(encyclopedia.page,pages-1);return '<p class="fine">'+rows.length+' registros</p><div class="grid">'+rows.slice(encyclopedia.page*60,encyclopedia.page*60+60).map(r=>'<button class="it" data-act="fact" data-key="'+r.key+'">'+sprImg(Catalog.sprite(r.sprite,32),40)+'<span>'+esc(r.name)+'</span><small>'+stars(r.tier)+'</small></button>').join('')+'</div><div class="row">'+btn('catalogpage','Anterior','data-d="-1" '+(!encyclopedia.page?'disabled':''))+'<span>'+(encyclopedia.page+1)+'/'+pages+'</span>'+btn('catalogpage','Próxima','data-d="1" '+(encyclopedia.page>=pages-1?'disabled':''))+'</div>';}
vCodex=()=>banner('Codex','Catálogo da aventura')+'<div class="tabs">'+Object.entries(CategoryLabels).map(([k,n])=>btn('catalogcat',n,'data-k="'+k+'"',encyclopedia.category===k?'sm sel':'sm')).join('')+'</div><input id="catalog-search" type="search" placeholder="Procurar no Codex..." value="'+esc(encyclopedia.query)+'"><div id="catalog-results">'+catalogGrid()+'</div>';
ACT.fact=el=>{const row=Catalog.byKey[el.dataset.key];if(row)openModal(factualDetails,row);};ACT.catalogcat=el=>{encyclopedia.category=el.dataset.k;encyclopedia.page=0;encyclopedia.query='';renderPanel();};ACT.catalogpage=el=>{encyclopedia.page=Math.max(0,encyclopedia.page+Number(el.dataset.d));renderPanel();scrollEl.scrollTop=0;};
overlay.addEventListener('input',e=>{if(e.target.id==='catalog-search'){encyclopedia.query=e.target.value;encyclopedia.page=0;$('#catalog-results').innerHTML=catalogGrid();}});
clState=k=>{const c=CLASSES[k];if(S.cls===k)return 'cur';if(S.classes.includes(k))return 'own';if(c.tier>1&&S.lvl<(c.tier-1)*25)return 'lock';if(c.tier===1&&S.lvl<5)return 'lock';if(c.summoner&&c.tier===7&&!S.questFlags.horus)return 'quest';return 'avail';};CL_LBL.quest='Missão de Horus';
mClass=k=>{const c=CLASSES[k],row=Catalog.byKey[c.original],state=clState(k);return factualDetails(row).replace(btn('closemodal','Fechar'),'')+'<p>Equipamentos: '+c.gear.map(x=>({guerreiro:'Guerreiro',ladino:'Ladrão',mago:'Mago'}[x])).join(', ')+'.</p><div class="row">'+(state==='own'?btn('setcls','Usar classe','data-k="'+k+'"'):state==='avail'?btn('unlock','Desbloquear · '+fmt(c.cost)+' orns','data-k="'+k+'" '+(S.ess<c.cost?'disabled':'')): '<span>'+esc(CL_LBL[state]||state)+'</span>')+btn('closemodal','Fechar')+'</div>';};
const oldClassesView=vClasses;vClasses=()=>oldClassesView().replace('essências','orns');
vSkills=()=>banner('Habilidades',S.equipped.length+'/'+skillSlots()+' equipadas')+'<div class="sk6">'+Array.from({length:skillSlots()},(_,i)=>{const id=S.equipped[i];return id?'<button class="sk6b" data-act="equipsk" data-id="'+id+'">'+skIcon(id,32)+'<span>'+SKILLS[id].n+'</span></button>':'<span class="sk6b empty">Vazio</span>';}).join('')+'</div>'+S.skills.filter(k=>SKILLS[k]).map(k=>'<div class="card"><div class="row l">'+skIcon(k,32)+'<span style="flex:1">'+SKILLS[k].n+'<small class="fine"> · '+SKILLS[k].mp+' Mana · '+(SKILLS[k].stat==='mag'?'Magia':'Ataque')+'</small></span>'+btn('equipsk',S.equipped.includes(k)?'Tirar':'Equipar','data-id="'+k+'"')+'</div><span class="fine">'+SKILLS[k].d+'</span></div>').join('');
ACT.equipsk=el=>{const k=el.dataset.id;if(!S.skills.includes(k))return;const i=S.equipped.indexOf(k);if(i>=0)S.equipped.splice(i,1);else if(S.equipped.length<skillSlots())S.equipped.push(k);else toast('Limite de '+skillSlots()+' habilidades.');save();renderPanel();};
vPet=()=>banner('Seguidor','Ações automáticas durante a batalha')+S.pets.filter(p=>PETS[p.key]).map(p=>'<div class="card"><div class="row l">'+sprImg(petMini(p.key),48)+'<b>'+PETS[p.key].n+'</b>'+btn('setpet',S.pets[S.pet]===p?'Ativo':'Levar','data-i="'+S.pets.indexOf(p)+'"')+'</div><p class="fine">'+(Catalog.byKey[p.key]?.skills||[]).map(k=>SKILLS[k]?.n).filter(Boolean).join(' · ')+'</p></div>').join('')+btn('setpet','Deixar em casa','data-i="-1"');
const originalStatusView=hStatus;hStatus=()=>{const old=originalStatusView(),start=old.indexOf('<fieldset',old.indexOf('reference-world-tabs'));const holder=document.createElement('div');holder.innerHTML=old;const lines=holder.querySelectorAll('.passive-line');lines.forEach(x=>x.remove());const note=holder.querySelector('.passive-note');if(note){note.insertAdjacentHTML('beforebegin',classEffects().concat(CLASSES[S.cls].original==='c_0'?['Weapon Proficiency: +5%']:[]).map(e=>'<div class="passive-line"><span style="grid-column:1/-1">'+esc(e).replaceAll('Collateral Chance','Chance Colateral').replaceAll('Collateral Damage','Dano Colateral').replaceAll('Weapon Proficiency','Proficiência em Armas')+'</span></div>').join(''));}return holder.innerHTML;};
invEntries=cat=>{
 const all=!!P.q.trim()||cat==='todos',out=[];
 for(const [i,g]of S.bag.entries())if(all||cat==='novo'&&S.newIds.includes(g.id)||cat!=='novo'&&((cat==='acc'&&g.slot==='acc')||cat===g.slot))out.push({g,i});
 for(const [k,n]of Object.entries(S.inv)){if(n<=0||!ITEMS[k])continue;const row=Catalog.byKey[k],kind=ITEMS[k].kind,fish=/\/fish\d+\.png$/.test(row?.sprite||'');
  if(all||cat==='cura'&&kind==='pot'||cat==='mat'&&kind==='mat'&&!fish||cat==='adornos'&&kind==='adorn'||cat==='itens'&&kind==='tool'||cat==='peixe'&&fish||cat==='lixo'&&kind==='junk'||cat==='outros'&&!['mat','adorn','pot','junk','tool'].includes(kind))out.push({k,n});
 }
 if(cat==='cura'&&!all)out.sort((a,b)=>(Catalog.byKey[a.k]?.heal?.stat==='mp'?0:1)-(Catalog.byKey[b.k]?.heal?.stat==='mp'?0:1));return out;
};
SKILL_KIND=k=>SKILLS[k]?.stat==='atk'?'fis':'mag';
const originalItemDetails=mItem;mItem=id=>{const it=itemById(id);if(!it)return originalItemDetails(id);let html;const off=it.slot==='offhand';if(off){const saved=it.type;it.type='guerreiro';html=originalItemDetails(id);it.type=saved;}else html=originalItemDetails(id);const row=Catalog.byKey[it.catalogKey];if(row){html+='<p class="fine">'+row.effects.map(esc).join('<br>')+'</p>'+box('Adornos',(it.adornments||[]).map(k=>Catalog.byKey[k]?.name).join(', ')||'Vazio')+(row.sockets?btn('adornmenu','Inserir adorno','data-id="'+id+'"'):'');}return html;};
const servicePrice=(key)=>{const r=Catalog.byKey[key];if(r?.nameEn==='Small Health Potion'||r?.nameEn==='Small Mana Potion')return 100;return ITEMS[key]?.price||100;};
pShop=()=>{
 const tier=tierOfLv(S.lvl),potions=Catalog.data.items.filter(r=>r.kind==='pot'&&r.recovery&&r.tier<=tier),cures=['i_antidote','i_coffee','i_stone-cure','i_cure-all'].map(k=>Catalog.byKey[k]).filter(r=>r&&r.tier<=tier);
 return '<p class="sub">Suprimentos</p>'+potions.concat(cures,['i_wood','i_stone','i_fishing-line'].map(k=>Catalog.byKey[k]).filter(Boolean)).map(r=>shopRow(r.key,servicePrice(r.key))).join('')+'<p class="sub">Vender</p>'+sellList();
};
function followerPrice(row){const n=Numeric.pets[normalizeName(row.nameEn)];return {amount:n?.price||Math.round(500*row.tier**3),currency:n?.currency==='G'?'gold':n?.currency==='O'?'ess':row.tier<=3?'gold':'ess'};}
pBest=()=>'<p class="fine">Seguidores compatíveis com seu tier. Apenas um acompanha você por vez.</p>'+Catalog.data.followers.filter(r=>r.tier<=tierOfLv(S.lvl)).map(r=>{const price=followerPrice(r),owned=S.pets.some(p=>p.key===r.key);return '<div class="card"><div class="row l">'+sprImg(petMini(r.key),40)+'<b>'+r.name+'</b></div><p class="fine">'+Object.entries(r.rates).map(([k,v])=>k+': '+Math.round(v*100)+'%').join(' · ')+'</p><div class="row"><span>'+fmt(price.amount)+' '+(price.currency==='gold'?'ouro':'orns')+'</span>'+btn('adopt',owned?'Adotado':'Adotar','data-k="'+r.key+'" '+(owned||S[price.currency]<price.amount?'disabled':''))+'</div></div>';}).join('');
ACT.adopt=el=>{const row=Catalog.byKey[el.dataset.k];if(!row||row.tier>tierOfLv(S.lvl)||S.pets.some(p=>p.key===row.key))return;const p=followerPrice(row);if(S[p.currency]<p.amount)return;S[p.currency]-=p.amount;S.pets.push({key:row.key});S.pet=S.pets.length-1;questCheck();save();renderPanel();};
function costDescription(c){return fmt(c.gold)+' ouro · '+Object.entries(c.materials).map(([k,n])=>n+' '+(ITEMS[k]?.n||k)).join(', ');}
function affordForge(c){return S.gold>=c.gold&&Object.entries(c.materials).every(([k,n])=>qty(k)>=n);}
function canUpgrade(it){const row=Catalog.byKey[it?.catalogKey];return !!row&&row.kind==='gear'&&row.slot!=='acc'&&row.materials.some(m=>m.key);}
pSmith=()=>'<p class="fine">Melhore até o nível 10. Forja Mestre e Demoníaca são instantâneas após os requisitos. Itens em melhoria ficam indisponíveis até a retirada.</p>'+S.forge.map((f,i)=>'<div class="card"><b>'+esc(f.it.name)+' · nível '+f.it.lvl+'</b><span>'+Math.max(0,Math.ceil((f.done-Date.now())/60000))+' min</span>'+btn('forgeget','Retirar','data-i="'+i+'" '+(f.done>Date.now()?'disabled':''))+'</div>').join('')+S.bag.filter(it=>it.catalogKey).map(it=>{
 const base=Catalog.byKey[it.catalogKey],target=it.lvl+1,c=Rules.upgradeCost(it,base,target),eligible=canUpgrade(it);
 return '<div class="card">'+iconImg(it,32)+qSpan(it)+'<p class="fine">Nível '+it.lvl+' · '+(!eligible?'Este item não aceita melhorias.':target<=12?costDescription(c)+(c.milliseconds?' · '+c.milliseconds/3600000+' h':''):'Forja dos deuses: chefe dourado')+'</p>'+(eligible&&target<=12?btn('forge','Melhorar para '+target,'data-id="'+it.id+'" '+(!affordForge(c)||S.forge.length>=3?'disabled':'')):'')+(eligible&&((it.lvl===1&&qty('i_whetstone'))||(it.lvl===2&&qty('i_fine-whetstone')))?btn('whetstone','Pedra de amolar','data-id="'+it.id+'"'):'')+(!isEquipped(it)?btn('smelt','Desmanchar','data-id="'+it.id+'"'):'')+'</div>';
}).join('');
ACT.forge=el=>{const it=itemById(el.dataset.id),base=it&&Catalog.byKey[it.catalogKey];if(!canUpgrade(it)||it.lvl>=12||S.forge.length>=3)return;const c=Rules.upgradeCost(it,base);if(!affordForge(c))return;S.gold-=c.gold;for(const [k,n]of Object.entries(c.materials))S.inv[k]-=n;unequipAll(it);S.bag=S.bag.filter(x=>x!==it);S.newIds=S.newIds.filter(id=>id!==it.id);it.lvl++;S.forge.push({it,done:Date.now()+c.milliseconds});save();renderPanel();};
ACT.smelt=el=>{const it=itemById(el.dataset.id);if(!it||isEquipped(it))return;const base=Catalog.byKey[it.catalogKey];if(!base)return;S.bag=S.bag.filter(x=>x!==it);S.newIds=S.newIds.filter(id=>id!==it.id);for(const m of base.materials)if(m.key)addItem(m.key,Math.max(1,Math.round(it.q*2)));save();refresh();};
ACT.whetstone=el=>{const it=itemById(el.dataset.id),key=it?.lvl===1?'i_whetstone':it?.lvl===2?'i_fine-whetstone':null;if(!key||!qty(key)||!canUpgrade(it))return;S.inv[key]--;it.lvl++;S.cnt.upgrades++;questCheck();save();refresh();};
function canAdorn(it,ad){const row=Catalog.byKey[it?.catalogKey];return !!row&&ad?.kind==='adorn'&&ad.tier<=row.tier&&((it.adornments||[]).length<row.sockets)&&(ad.adornFor==='weapon'?it.slot==='weapon':ad.adornFor==='armor'?['head','chest','legs','offhand'].includes(it.slot):ad.adornFor==='celestial'?/^Celestial /.test(row.nameEn):true);}
ACT.adornmenu=el=>{const it=itemById(el.dataset.id),row=it&&Catalog.byKey[it.catalogKey];if(!row)return;openModal(()=>'<h3>Adornos · '+esc(it.name)+'</h3><p>'+(it.adornments||[]).length+'/'+row.sockets+' espaços</p>'+Catalog.data.items.filter(r=>r.kind==='adorn'&&qty(r.key)>0).map(r=>'<div class="lrow">'+iconImg(r.key,32)+esc(r.name)+btn('adorn','Inserir','data-id="'+it.id+'" data-k="'+r.key+'" '+(!canAdorn(it,r)?'disabled':''))+'</div>').join('')+btn('closemodal','Fechar'));};
ACT.adorn=el=>{const it=itemById(el.dataset.id),r=it&&Catalog.byKey[it.catalogKey],ad=Catalog.byKey[el.dataset.k];if(!r||!ad||qty(ad.key)<1||!canAdorn(it,ad))return;S.inv[ad.key]--;it.adornments||=[];it.adornments.push(ad.key);save();closeModal();refresh();};

/* Story goals from the community walkthrough, with explicit offline reward balance. */
const Campaign={quests:AETHRIC_DATA.story.quests,npcs:Object.fromEntries(World.layout.npcs.map(n=>[n.id,n])),buildAlias:{Shop:'loja',Residence:'casa',Bestiary:'bestiario',Blacksmith:'ferreiro','Town Hall':'prefeitura'}};
function findEnglish(name,category){return (category?Catalog.data[category]:Object.values(Catalog.data).flat()).find(r=>normalizeName(r.nameEn)===normalizeName(name));}
function activeStory(){const row=Campaign.quests[S.originalQuests?.index||0];return row?{...row,n:row.title,npc:Campaign.npcs[row.npcId]?.name||row.npcId,town:Campaign.npcs[row.npcId]?.town||row.townId}:null;}
curQuest=activeStory;NPCQ=id=>{const q=activeStory();return q?.town===id?q:null;};
const goalLabels={kill:'Derrotar',acquire:'Entregar',level:'Nível',arena_wins:'Vitórias na arena',blacksmith_upgrades:'Melhorias na forja',build:'Construir',codex_completed:'Entradas do Codex completas',codex_entry_completed:'Completar Codex',dungeons_completed:'Masmorras concluídas',followers_owned:'Seguidores',masterforge:'Forja Mestre',demonforge:'Forja Demoníaca',owned_class_tier:'Classe de tier',specialization_selected:'Especialização escolhida',town_morale:'Moral da cidade',npc_quests_completed:'Tarefas de NPCs'};
function gearForGoal(g){const row=findEnglish(g.target,'items');return row?S.bag.filter(x=>x.catalogKey===row.key&&(!g.qualityPercent||Math.round(x.q*100)===g.qualityPercent)):[];}
function goalValue(g,q=activeStory()){const flags=S.originalQuests||{},byName=name=>findEnglish(name);switch(g.type){case 'kill':return flags.kills?.[normalizeName(g.target)]||0;case 'acquire':{const row=findEnglish(g.target,'items');return row?(row.kind==='gear'?gearForGoal(g).length:qty(row.key)):0;}case 'level':return S.lvl;case 'build':return S.originalBuildings?.[g.target]||S.town[Campaign.buildAlias[g.target]]||0;case 'arena_wins':return S.cnt.arena-(flags.baseline?.arena||0);case 'blacksmith_upgrades':return S.cnt.upgrades-(flags.baseline?.upgrades||0);case 'followers_owned':return S.pets.length;case 'dungeons_completed':return Object.values(S.cnt.dungeons).reduce((a,b)=>a+b,0)-(flags.baseline?.dungeons||0);case 'owned_class_tier':return Math.max(...S.classes.map(k=>CLASSES[k]?.tier||1));case 'specialization_selected':return S.spec?1:0;case 'codex_completed':return codexCount();case 'codex_entry_completed':{const row=byName(g.target);return row&&codexDone(row.key)?1:0;}case 'masterforge':return [...S.bag,...S.forge.map(f=>f.it)].filter(x=>x.lvl>=11).length;case 'demonforge':return [...S.bag,...S.forge.map(f=>f.it)].filter(x=>x.lvl>=12).length;case 'town_morale':return S.morale||0;case 'npc_quests_completed':return S.npcTasks||0;default:return 0;}}
function goalText(g,q){const row=g.target&&findEnglish(g.target);return (goalLabels[g.type]||g.type)+(g.target?' '+(row?.name||({Shop:'Loja',Residence:'Residência',Blacksmith:'Ferreiro',Bestiary:'Bestiário','Town Hall':'Prefeitura','Trading Post':'Entreposto',Jeweller:'Joalheiro',Herbalist:'Herbalista',Citadel:'Cidadela'}[g.target])||g.target):'')+' · '+Math.min(goalValue(g,q),g.count)+'/'+g.count+(g.qualityPercent?' · '+g.qualityPercent+'%':'');}
questProgress=q=>q.goals.map(g=>goalText(g,q)).join(' · ');
questDone=q=>q.goals.every(g=>goalValue(g,q)>=g.count);
questKill=k=>{const row=Catalog.byKey[k];if(row){S.originalQuests.kills||={};const key=normalizeName(row.nameEn);S.originalQuests.kills[key]=(S.originalQuests.kills[key]||0)+1;}ensureDaily();for(const j of S.daily.list)if(j.mon===k&&j.have<j.need)j.have++;};
codexDone=k=>{const row=Catalog.byKey[k],c=S.codex[k];if(!row||!c?.kills)return false;return row.skills.every(s=>c.moves[s])&&row.drops.every(s=>c.drops[s])&&Object.keys(c.el).length>0;};
codexCount=()=>Object.keys(S.codex).filter(codexDone).length;
questCheck=()=>{if(!S)return;const q=activeStory();S.quest.ready=!!q&&questDone(q);updateHUD();};
function consumeQuestItems(q){for(const g of q.goals.filter(g=>g.type==='acquire')){const r=findEnglish(g.target,'items');if(r?.kind==='gear'){for(const it of gearForGoal(g).slice(0,g.count)){for(const set of SETS)for(const sl in S.sets[set])if(S.sets[set][sl]===it.id)delete S.sets[set][sl];S.bag=S.bag.filter(x=>x!==it);}}else if(r)S.inv[r.key]-=g.count;}}
function storyReward(q){const tier=q.tier;return {ess:q.rewards?.orns||100*tier**3,gold:250*tier**3,xp:500*tier**4};}
function atQuestNPC(q){const p=POI[q?.town];return !!p&&cur==='world'&&P.kind==='town'&&P.data===q.town&&Math.hypot(H.x-poiPx(p).x,H.y-poiPx(p).y)<7*TILE;}
questTurnIn=()=>{const q=activeStory();if(!q||!questDone(q)||!atQuestNPC(q)){toast('Fale com o NPC da missão para entregar.');return;}consumeQuestItems(q);const rw=storyReward(q);S.ess+=rw.ess;S.gold+=rw.gold;gainXp(rw.xp);for(const name of q.knownRewardItems||[]){const r=findEnglish(name,'items');if(r){if(r.kind==='gear')addGear(makeCatalogGear(r.key,1));else addItem(r.key);}}S.originalQuests.index=(S.originalQuests.index||0)+1;S.originalQuests.kills={};S.originalQuests.baseline={arena:S.cnt.arena,upgrades:S.cnt.upgrades,dungeons:Object.values(S.cnt.dungeons).reduce((a,b)=>a+b,0)};S.quest.ready=false;S.ended=S.originalQuests.index>=Campaign.quests.length;toast('Missão concluída · +'+fmt(rw.ess)+' orns');questCheck();save();};
function storyCard(q){if(!q)return '<p>Campanha concluída. Continue explorando Aethric.</p>';const r=storyReward(q);return '<div class="card"><span class="fine">Missão '+q.number+'/'+Campaign.quests.length+' · '+q.npc+' · '+(POI[q.town]?.n||q.town)+'</span><h3>'+q.title+'</h3>'+q.goals.map(g=>'<p>'+goalText(g,q)+'</p>').join('')+'<p class="fine">Recompensa: '+fmt(r.gold)+' ouro · '+fmt(r.ess)+' orns · '+fmt(r.xp)+' XP</p>'+(questDone(q)&&atQuestNPC(q)?btn('turnin','Entregar missão','','sm gold'):'')+(POI[q.town]?btn('goto','Localizar NPC','data-id="'+q.town+'"'):'')+'</div>';}
pStory=()=>storyCard(activeStory());
vQuests=()=>banner('Missões','A história dos Unfelled')+tabsRow([['story','História'],['daily','Tarefas']],P.tab)+(P.tab==='daily'?pDaily(false):pStory());
pNpc=()=>{const here=P.data,npcs=World.layout.npcs.filter(x=>x.town===here),q=NPCQ(here);return npcs.map(n=>'<div class="card"><h3>'+n.name+'</h3>'+(q?.npcId===n.id?storyCard(q):'<p class="fine">'+(activeStory()?'Sua próxima missão está em '+(POI[activeStory().town]?.n||activeStory().town)+'.':'A história dos Unfelled está concluída.')+'</p>')+(n.id==='horus'?horusCard():'')+'</div>').join('')||'<p class="fine">Não há missão principal nesta cidade.</p>';};
function horusCard(){const q=AETHRIC_DATA.story.unlockQuests[0];return '<h3>O caminho do Sintonizador</h3>'+q.goals.map(g=>'<p>'+goalText(g)+'</p>').join('')+btn('horus',S.questFlags.horus?'Concluída':'Entregar equipamentos',' '+(S.questFlags.horus||S.lvl<150||!q.goals.every(g=>goalValue(g)>=g.count)?'disabled':''));}
ACT.horus=()=>{const q=AETHRIC_DATA.story.unlockQuests[0];if(S.lvl<150||S.questFlags.horus||!q.goals.every(g=>goalValue(g)>=g.count)||!atQuestNPC({town:q.townId}))return;consumeQuestItems(q);S.questFlags.horus=true;if(!S.classes.includes('c_60'))S.classes.push('c_60');learnSkills();save();refresh();};
const oldClaimJob=ACT.claimjob;ACT.claimjob=el=>{const j=S.daily.list[+el.dataset.i],was=j?.claimed;oldClaimJob(el);if(j?.claimed&&!was){S.npcTasks=(S.npcTasks||0)+1;S.morale=Math.min(100,(S.morale||0)+5);questCheck();save();}};
const originBuilds=['Shop','Residence','Bestiary','Blacksmith','Trading Post','Town Hall','Jeweller','Herbalist','Citadel'];
vOrigin=()=>banner('Cidade de origem','Seu povoado em Aethric')+tabsRow([['build','Construções'],['shop','Loja'],['smith','Ferreiro'],['best','Bestiário'],['hall','Prefeitura']],P.tab)+(P.tab==='shop'&&S.town.loja?pShop():P.tab==='smith'&&S.town.ferreiro?pSmith():P.tab==='best'&&S.town.bestiario?pBest():P.tab==='hall'&&S.town.prefeitura?pHall():originBuilds.map((name,i)=>{const r=findEnglish(name,'buildings'),count=S.originalBuildings?.[name]||0,cost=100+Math.floor(i/3)*500;return '<div class="card"><div class="row l">'+(r?sprImg(Catalog.sprite(r.sprite,32),40):'')+'<b>'+({Shop:'Loja',Residence:'Residência',Bestiary:'Bestiário',Blacksmith:'Ferreiro','Town Hall':'Prefeitura','Trading Post':'Entreposto',Jeweller:'Joalheiro',Herbalist:'Herbalista',Citadel:'Cidadela'}[name])+'</b></div><div class="row"><span>'+count+' construída(s) · '+cost+' ouro</span>'+btn('originalbuild','Construir','data-name="'+name+'" '+(S.gold<cost?'disabled':''))+'</div></div>';}).join(''));
ACT.originalbuild=el=>{const name=el.dataset.name,i=originBuilds.indexOf(name);if(i<0)return;const cost=100+Math.floor(i/3)*500;if(S.gold<cost)return;S.gold-=cost;S.originalBuildings||={};S.originalBuildings[name]=(S.originalBuildings[name]||0)+1;const alias=Campaign.buildAlias[name];if(alias)S.town[alias]=S.originalBuildings[name];S.morale=Math.min(100,(S.morale||0)+2);buildPoiEnts();questCheck();save();renderPanel();};
vTown=()=>banner(POI[P.data]?.n||'Cidade','Serviços locais',TOWN_BIO[P.data])+tabsRow([['npc','NPCs'],['inn','Estalagem'],['shop','Loja'],['smith','Ferreiro'],['best','Bestiário'],['arcanist','Arcanista'],['travel','Viagem']],P.tab)+({npc:pNpc,inn:pInn,shop:pShop,smith:pSmith,best:pBest,arcanist:pArcanist,travel:vGates}[P.tab]||pNpc)();

/* Solo versions of expeditions, raids, arena and earned premium rewards. */
let selectedRaidTier=0,selectedRaidPayment='sigil';
function raidPayment(){return selectedRaidPayment==='scroll'?{available:qty('i_summoning-scroll'),label:'pergaminho'}:{available:S.raid.sigils,label:'selo'};}
ACT.raidsource=el=>{selectedRaidPayment=el.dataset.k==='scroll'?'scroll':'sigil';renderPanel();};
function dungeonEntryCost(key){return POI[key]?.originalKind==='tower'?{key:'i_olympia-tower-key',n:1}:{key:Catalog.invKey('chave'),n:DUNGEONS[key]?.keys||1};}

function raidOptions(){return [{...Catalog.byKey['b_bandit-lord'],challenge:true},...Catalog.data.raids];}
function raidMinimum(row){return row.challenge?5:Math.max(1,(row.tier-1)*25);}
vRaid=()=>banner('Incursões','Chefes e desafios locais')+'<p class="fine">A vida do chefe fica salva entre tentativas. Novas invocações custam um selo ou um pergaminho. Continuar um chefe pendente não cobra outra entrada.</p><div class="tabs">'+btn('raidsource','Selos · '+S.raid.sigils,'data-k="sigil"',selectedRaidPayment==='sigil'?'sm sel':'sm')+btn('raidsource','Pergaminhos · '+qty('i_summoning-scroll'),'data-k="scroll"',selectedRaidPayment==='scroll'?'sm sel':'sm')+'</div><div class="tabs">'+btn('raidtier','Especial','data-tier="0"',selectedRaidTier===0?'sm sel':'sm')+Array.from({length:8},(_,i)=>btn('raidtier','★ '+(i+3),'data-tier="'+(i+3)+'"',selectedRaidTier===i+3?'sm sel':'sm')).join('')+'</div>'+raidOptions().filter(r=>selectedRaidTier===0?r.challenge:r.category==='raids'&&r.tier===selectedRaidTier).map(r=>{const p=S.raidProgress[r.key],ongoing=p&&!p.rewarded;return '<div class="card"><div class="row l">'+sprImg(Catalog.sprite(r.sprite,48),56)+'<div><b>'+r.name+'</b><span class="fine"> Nível '+raidMinimum(r)+' · '+(p&&!p.rewarded?fmt(p.hp)+' HP restantes':fmt(r.hp||monStats(r.key,Math.max(5,S.lvl)).hp)+' HP')+'</span></div></div>'+btn('raidchoose',ongoing?'Continuar combate':'Invocar · 1 '+raidPayment().label,'data-key="'+r.key+'" '+(S.lvl<raidMinimum(r)||!ongoing&&raidPayment().available<1?'disabled':''))+'</div>';}).join('')+'<p>Selos: '+S.raid.sigils+' · Moedas de prêmio: '+S.raid.seals+'</p>'+btn('herotab','Prêmios','data-k="runes"');
ACT.raidtier=el=>{selectedRaidTier=Number(el.dataset.tier);renderPanel();};ACT.raidchoose=el=>startRaid(el.dataset.key);
startRaid=async(key='b_bandit-lord')=>{if(busy)return;const row=raidOptions().find(r=>r.key===key);if(!row||S.lvl<raidMinimum(row))return;let p=S.raidProgress[key];if(!p||p.rewarded){if(raidPayment().available<1){toast('Falta um '+raidPayment().label+' de invocação.');return;}if(selectedRaidPayment==='scroll')S.inv['i_summoning-scroll']--;else S.raid.sigils--;const L=row.challenge?Math.max(5,S.lvl):Math.max(raidMinimum(row),S.lvl);p=S.raidProgress[key]={hp:row.hp||monStats(key,L).hp,level:L,run:uid(),rewarded:false};}busy=true;closePanel();save();const foe=makeFoe(key,p.level);foe.hp=p.hp;const result=await battle({foes:[foe],mode:'raid',raidKey:key,bio:'tower',canFlee:true,resume:p.combat||null});afterBattle(result);busy=false;};
vRuneShop=()=>'<h2 class="dec">Loja de Runas</h2><p>Medalhas: '+S.raid.seals+'</p><p class="fine">Conquiste os prêmios vencendo o chefe especial e as incursões.</p><div class="card"><b>Suprimentos</b><p>5 poções de saúde e 5 de mana.</p>'+btn('earnedprize','Resgatar · 1 medalha','data-kind="supply" '+(S.raid.seals<1?'disabled':''))+'</div><div class="card"><b>Chaves e fichas</b><p>3 chaves e 3 fichas de arena.</p>'+btn('earnedprize','Resgatar · 1 medalha','data-kind="keys" '+(S.raid.seals<1?'disabled':''))+'</div>'+Catalog.data.classes.filter(r=>r.support&&r.tier<=tierOfLv(S.lvl)).map(r=>'<div class="card">'+sprImg(Catalog.sprite(r.sprite,32),40)+'<b>'+r.name+'</b>'+btn('earnedprize',S.premiumUnlocks.includes(r.key)?'Conquistado':'Conquistar · 3 medalhas','data-kind="class" data-key="'+r.key+'" '+(S.raid.seals<3||S.premiumUnlocks.includes(r.key)?'disabled':''))+'</div>').join('')+'<div class="card"><b>Equipamento ornado do seu tier</b>'+btn('earnedprize','Arma · 3 medalhas','data-kind="weapon" '+(S.raid.seals<3?'disabled':''))+btn('earnedprize','Armadura · 3 medalhas','data-kind="armor" '+(S.raid.seals<3?'disabled':''))+'</div>'+btn('mainnav','Enfrentar chefes','data-k="raid"');
ACT.earnedprize=el=>{const kind=el.dataset.kind,cost=['supply','keys'].includes(kind)?1:3;if(S.raid.seals<cost)return;if(kind==='class'){const r=Catalog.byKey[el.dataset.key];if(!r?.support||r.tier>tierOfLv(S.lvl)||S.premiumUnlocks.includes(r.key))return;S.premiumUnlocks.push(r.key);const c=Catalog.canonicalClass(r.key);if(!S.classes.includes(c))S.classes.push(c);}else if(kind==='supply'){addItem('pocao_p',5);addItem('eter_p',5);}else if(kind==='keys'){addItem('chave',3);addItem('ficha',3);}else if(kind==='weapon'||kind==='armor'){if(bagFull()){toast('Mochila cheia.');return;}addGear(genGear(Math.min(10,tierOfLv(S.lvl)),kind==='weapon'?'weapon':'chest',CLASSES[S.cls].gear[0],0,1.8));}else return;S.raid.seals-=cost;learnSkills();save();refresh();};
const plainClassState=clState;clState=k=>{const r=Catalog.byKey[CLASSES[k]?.original];return r?.support&&!S.premiumUnlocks.includes(r.key)&&!S.classes.includes(k)?'prize':plainClassState(k);};CL_LBL.prize='Prêmio de desafio';
vEvents=()=>banner('Centro de Eventos','Atividades locais')+'<div class="card"><h3>Incursões</h3><p>Enfrente os chefes do catálogo em combates individuais. O dano causado permanece salvo.</p>'+btn('mainnav','Ver incursões','data-k="raid"')+'</div><div class="card"><h3>Prêmios conquistados</h3>'+btn('herotab','Loja de Runas','data-k="runes"')+'</div><div class="card"><h3>Tarefas do dia</h3>'+btn('dailyquests','Ver tarefas')+'</div>'+(S.expedition?'<div class="card"><b>Expedição pausada · andar '+S.expedition.floor+'</b>'+btn('resumeexp','Continuar')+(!S.expedition.activeBattle?btn('quitexp','Encerrar expedição'):'')+'</div>':'');
function serializeExpedition(){return BattleState.carry();}
function restoreExpedition(c){return BattleState.restoreCarry(c);}
function dungeonMinimum(key){const d=DUNGEONS[key];return Math.max(ZONES[d?.zone]?.minLv||1,POI[key]?.minLv||1);}
vDungeon=()=>{const d=DUNGEONS[P.data];if(!d)return '<p>Masmorra não encontrada.</p>';const entry=dungeonEntryCost(P.data);return banner(d.n,'Expedição · '+stars(d.stars),d.bio)+'<div class="card"><p>'+d.floors+' andares · nível '+d.lv+' · '+entry.n+' '+ITEMS[entry.key].n+'</p><p>HP, mana, efeitos e invocações permanecem entre os andares. Você pode pausar ao limpar um andar.</p>'+btn('enterdg','Entrar',' '+(qty(entry.key)<entry.n||S.lvl<dungeonMinimum(P.data)?'disabled':''))+'</div>'+(S.expedition?'<div class="card"><p>Expedição em andamento: '+DUNGEONS[S.expedition.key]?.n+' · andar '+S.expedition.floor+'</p>'+btn('resumeexp','Continuar expedição')+(!S.expedition.activeBattle?btn('quitexp','Encerrar expedição'):'' )+'</div>':'');};
ACT.resumeexp=()=>runDungeon(S.expedition?.key,true);
runDungeon=async(key,resume=false)=>{if(busy)return;const d=DUNGEONS[key];if(!d||S.lvl<dungeonMinimum(key))return;if(!resume){if(S.expedition){toast('Continue ou encerre a expedição atual.');return;}const entry=dungeonEntryCost(key);if(qty(entry.key)<entry.n){toast('Falta '+ITEMS[entry.key].n+'.');return;}S.inv[entry.key]-=entry.n;S.expedition={key,floor:1,carry:null};}const exp=S.expedition;if(!exp||exp.key!==key)return;busy=true;closePanel();save();
 for(let floor=exp.floor;floor<=d.floors;floor++){const isBoss=floor===d.floors;let boss=d.boss;const q=activeStory();if(isBoss&&q?.number===53&&/shaded|desert.*tomb/i.test(d.n))boss=findEnglish('Medea','bosses')?.key||boss;const foes=isBoss?[makeFoe(boss,d.lv)]:[makeFoe(pick(d.pool),d.lv+Math.floor(floor/3))];const r=await battle({foes,mode:'dungeon',bio:d.bio,canFlee:false,floor,carry:restoreExpedition(exp.carry),resume:exp.activeBattle?.floor===floor?exp.activeBattle:null});if(r!=='win'){S.expedition=null;afterBattle(r);busy=false;save();return;}exp.carry=serializeExpedition();exp.floor=floor+1;save();if(!isBoss){const v=await choose([{v:'go',l:'Próximo andar',s:(floor+1)+'/'+d.floors,cls:'gold'},{v:'pause',l:'Pausar expedição'},{v:'quit',l:'Encerrar'}]);if(v!=='go'){if(v==='quit')S.expedition=null;show('world');busy=false;save();return;}}}
 S.cnt.dungeons[key]=(S.cnt.dungeons[key]||0)+1;S.expedition=null;const gold=100*d.stars*d.floors,ess=50*d.stars;S.gold+=gold;S.ess+=ess;addItem('chave');questCheck();save();say('Expedição concluída! +'+fmt(gold)+' ouro · +'+ess+' orns','gold');await choose([{v:1,l:'Voltar ao mapa',cls:'gold wide'}]);show('world');busy=false;};
ACT.quitexp=()=>{if(busy||!S.expedition||S.expedition.activeBattle)return;S.expedition=null;save();refresh();};
startArena=async(resume=false)=>{
 if(busy)return;let session=S.arenaSession;
 if(!resume){if(session?.combat)return startArena(true);if(qty('ficha')<1){toast('Você precisa de uma ficha da arena.');return;}S.inv.ficha--;session=S.arenaSession={run:uid(),keepHp:S.hp,keepMp:S.mp,rewarded:false};}
 if(!session)return;busy=true;closePanel();save();
 try{const foe=session.combat?.foes?.[0];await battle({foes:foe?[]:[makeRival(S.lvl)],mode:'arena',bio:'arena',canFlee:false,resume:session.combat||null});}
 finally{const st=stats();S.hp=Math.min(st.hp,session.keepHp);S.mp=Math.min(st.mp,session.keepMp);S.arenaSession=null;show('world');busy=false;questCheck();save();}
};
ACT.resumearena=()=>startArena(true);
// Utility access from the map remains inside the same reference-style main menu.
vHelpView=()=>banner('Ajuda','Como jogar')+'<div class="card"><p>Toque no chão para andar. Toque em monstros para lutar por turnos. No computador, use WASD ou as setas.</p><p>Visite Samson em Loton para acompanhar a campanha. Na cidade de origem você pode construir serviços.</p><p>Chefes deixam selos para desafios. Vença as incursões para conquistar medalhas e resgatar prêmios.</p><p>As regiões e classes liberam a cada 25 níveis, até o nível 250. Exporte o progresso em Opções para manter um backup.</p></div>';
vInbox=()=>banner('Caixa de entrada','Registro da aventura')+'<div class="card"><p>'+S.raid.wins+' incursões vencidas · '+S.raid.seals+' medalhas disponíveis.</p><p>Missões principais concluídas: '+(S.originalQuests.index||0)+'/'+Campaign.quests.length+'</p></div>';

/* Spell vendors and fishing use the catalog; availability is local and permanent. */
function arcanistStock(){return Catalog.data.spells.filter(r=>(Numeric.spells[normalizeName(r.nameEn)]?.learnType==='Arcanist'||/^(Ward of |Mend Wall|Divine Bastion|Heal|Remedy)/.test(r.nameEn))&&r.tier<=tierOfLv(S.lvl)&&!r.nameEn.includes('Sands of Aaru'));}
function pArcanist(){return '<p class="fine">Aprenda técnicas e magias. As habilidades compradas permanecem disponíveis ao trocar de classe.</p>'+arcanistStock().map(r=>{const n=Numeric.spells[normalizeName(r.nameEn)],cost=Catalog.num(n?.learnDetails)||500*r.tier**3,own=S.skills.includes(r.key);return '<div class="card"><div class="row l">'+skIcon(r.key,32)+'<b>'+r.name+'</b></div><p class="fine">'+r.mp+' Mana · '+fmt(cost)+' ouro</p>'+btn('learnspell',own?'Aprendida':'Aprender','data-k="'+r.key+'" '+(own||S.gold<cost||!cost?'disabled':''))+'</div>';}).join('');}
ACT.learnspell=el=>{const r=arcanistStock().find(r=>r.key===el.dataset.k);if(!r||S.skills.includes(r.key))return;const price=Catalog.num(Numeric.spells[normalizeName(r.nameEn)]?.learnDetails)||500*r.tier**3;if(!price||S.gold<price)return;S.gold-=price;S.skills.push(r.key);save();refresh();};
let pendingFishingEncounter=null;
const previousStopFish=stopFish;stopFish=()=>{clearTimeout(pendingFishingEncounter);pendingFishingEncounter=null;previousStopFish();};
fishCatch=st=>{
 const tier=tierOfLv(S.lvl),r=Math.random();if(r<.15){const region=zoneAtPx(H.x,H.y),z=region==='~'?'L':region,k=pick(ZONES[z].spawn)?.[0];if(k){const owner=S,spot={x:H.x+20,y:H.y,z};st.textContent='Algo se move sob a água!';clearTimeout(pendingFishingEncounter);pendingFishingEncounter=setTimeout(()=>{pendingFishingEncounter=null;if(S!==owner||cur!=='world'||busy||P.kind!=='fish'||overlay.hidden)return;closePanel();startMapBattle(spawnMon(spot,k));},500);return;}}
 const pool=Catalog.data.items.filter(x=>/\/fish\d+\.png$/.test(x.sprite)&&x.tier<=tier);if(pool.length){const row=pick(pool);addItem(row.key);st.textContent='Você pescou '+row.name+'.';}else{addItem('i_wood');st.textContent='Você encontrou madeira.';}sfx.coin();save();
};
const originalSettings=vSettings;vSettings=()=>originalSettings()+'<p class="fine">Versão 4.1</p>'+  (S.lvl>=10?box('Facção',Object.entries({fogo:'Cavaleiros do Inferno',agua:'Guarda Gélida',terra:'Legião da Terra',raio:'Tempestade'}).map(([k,n])=>btn('faction',n,'data-k="'+k+'"',S.faction===k?'sm sel':'sm')).join('')+'<p class="fine">Sua facção concede afinidade com um elemento.</p>'):'');VIEWS.settings.r=vSettings;
ACT.faction=el=>{if(S.lvl<10||!['fogo','agua','terra','raio'].includes(el.dataset.k))return;S.faction=el.dataset.k;save();renderPanel();};
for(const key of ['unlock','setcls','spec','equipsk','setpet','equipset','unequipset','sloton','slotoff','copyset','clearset','forgeget','rest','buy','sell','sellmat']){const handler=ACT[key];ACT[key]=el=>{const r=handler(el);save();return r;};}

ACT.hall=()=>{const lv=S.town.prefeitura;if(lv<1||S.hallDay===todayKey())return;S.hallDay=todayKey();S.gold+=250*lv+S.lvl*30;S.ess+=60*lv+S.lvl*8;sfx.coin();save();renderPanel();};
ACT.buy=el=>{const k=Catalog.invKey(el.dataset.k),n=Number(el.dataset.n);if(![1,5].includes(n)||!ITEMS[k]||Catalog.byKey[k]?.kind==='gear')return;const price=servicePrice(k)*n;if(!Number.isFinite(price)||price<0||S.gold<price)return;S.gold-=price;addItem(k,n);save();renderPanel();};
function trimEquippedSkills(){S.skills=[...new Set(S.skills)].filter(k=>SKILLS[k]);S.equipped=[...new Set(S.equipped)].filter(k=>S.skills.includes(k)).slice(0,skillSlots());}
for(const action of ['setcls','unlock','spec']){const old=ACT[action];ACT[action]=el=>{if(action==='setcls'&&(!CLASSES[el.dataset.k]||S.lvl<Math.max(1,(CLASSES[el.dataset.k].tier-1)*25)))return;old(el);trimEquippedSkills();save();refresh();};}

/* Validate saves without mutating the imported data or deleting the previous save. */
const StateSchema=(()=>{
 const record=o=>!!o&&typeof o==='object'&&!Array.isArray(o),safeKey=k=>!['__proto__','prototype','constructor'].includes(k);
 const number=(v,fallback=0,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isFinite(v)?Math.max(min,Math.min(max,v)):fallback;
 const integer=(v,fallback=0,min=0,max=Number.MAX_SAFE_INTEGER)=>Math.floor(number(v,fallback,min,max));
 const list=(v,max=10000)=>Array.isArray(v)?v.slice(0,max):[];
 const counts=o=>{const out={};if(record(o))for(const [k,v]of Object.entries(o))if(safeKey(k)&&typeof v==='number')out[k]=integer(v,0,0,1e9);return out;};
 const oldSkills={investida:'s_charge',golpe:'s_lunge',grito:'s_warcry',brasa:'s_flame',gelo:'s_frost',faisca:'s_spark'};
 const validClass=k=>typeof k==='string'&&safeKey(k)&&Object.hasOwn(CLASSES,k),validSkill=k=>typeof k==='string'&&safeKey(k)&&Object.hasOwn(SKILLS,k);
 const cls=k=>validClass(k)?k:validClass(Catalog.canonicalClass(k))?Catalog.canonicalClass(k):safeKey(k)?Catalog.legacyClasses[k]:null;
 function effects(o){const out={};if(record(o))for(const e of Object.values(o)){if(!record(e)||typeof e.name!=='string'||e.name.length>100)continue;const key=Rules.effectDef(e.name).id;if(!safeKey(key))continue;out[key]={name:e.name,remaining:integer(e.remaining,-1,-1,20),age:integer(e.age,0,0,1e9),fresh:e.fresh===true};}return out;}
 function fighter(o,hero=false){
  if(!record(o)||!hero&&!Object.hasOwn(MON,o.key)&&!(o.rival&&validClass(o.cls)))return null;
  const r={id:typeof o.id==='string'?o.id.slice(0,80):hero?'hero':undefined,key:o.key,lv:integer(o.lv,1,1,250),effects:effects(o.effects),summon:!!o.summon,enemySummon:!!o.enemySummon,rival:!!o.rival,summonOwnerId:typeof o.summonOwnerId==='string'?o.summonOwnerId:undefined};
  if(o.rival){r.cls=o.cls;r.n=String(o.n||CLASSES[o.cls].n).slice(0,100);r.skills=list(o.skills).filter(validSkill);}
  for(const k of ['hp','mp','maxhp','maxmp','atk','mag','def','res','dex','crit','maxWard','ward','wardTurns','wardAbsorb'])if(Number.isFinite(o[k]))r[k]=number(o[k],0,0,k==='wardAbsorb'?1:1e12);
  if('wardFresh' in o)r.wardFresh=!!o.wardFresh;
  if(record(o.charging)&&validSkill(o.charging.key))r.charging={key:o.charging.key,targetId:String(o.charging.targetId||'').slice(0,80),remaining:integer(o.charging.remaining,1,1,100)};
  if(r.hp!=null&&r.maxhp!=null)r.hp=Math.min(r.hp,r.maxhp);if(r.mp!=null&&r.maxmp!=null)r.mp=Math.min(r.mp,r.maxmp);return r;
 }
 function carry(o){const r=fighter(o,true);if(!r)return null;r.summons=list(o.summons,5).map(f=>fighter(f)).filter(f=>f&&f.hp>0);return r;}
 function combat(o,mode){
  if(!record(o)||o.schema!==1||o.mode!==mode||!['hero_start','hero_command','allies','enemies','victory_pending'].includes(o.phase))return null;
  const hero=fighter(o.hero,true),foes=list(o.foes,8).map(f=>fighter(f));if(!hero||!foes.length||foes.some(f=>!f))return null;
  const ids=foes.map(f=>f.id);if(ids.some(id=>!id)||new Set(ids).size!==ids.length)return null;
  return {schema:1,mode,phase:o.phase,round:integer(o.round,0,0,1e9),floor:integer(o.floor,1,1,1000),hero,foes,summons:list(o.summons,5).map(f=>fighter(f)).filter(f=>f&&f.hp>0),pet:record(o.pet)?{key:o.pet.key,effects:effects(o.pet.effects),charging:o.pet.charging}:null,enemyTurnIds:list(o.enemyTurnIds,8).filter(id=>ids.includes(id)),enemyIndex:integer(o.enemyIndex,0,0,8)};
 }
 function normalize(input){
  if(!record(input)||![2,3].includes(input.v)||typeof input.name!=='string'||!Number.isFinite(input.lvl)||!Array.isArray(input.bag)||input.bag.length>10000)return null;
  let raw;try{raw=JSON.parse(JSON.stringify(input));}catch{return null;}
  const legacy=raw.content!==4,selected=cls(raw.cls)||'guerreiro',o={...Legacy.newState(selected,raw.name),...raw,v:3,content:4,schemaRevision:3,cls:selected};
  o.name=raw.name.trim().slice(0,24)||'Herói';o.lvl=integer(raw.lvl,1,1,250);o.xp=number(raw.xp);if(legacy)o.xp=Math.min(Number.MAX_SAFE_INTEGER,(XP_TABLE[o.lvl-1]||0)+o.xp);
  o.classes=[...new Set(list(raw.classes).map(cls).filter(k=>CLASSES[k]))];if(!o.classes.includes(selected))o.classes.push(selected);
  o.gold=integer(raw.gold,80);o.ess=integer(raw.ess);o.hp=number(raw.hp,1);o.mp=number(raw.mp);o.spec=Object.hasOwn(SPECS,raw.spec)?raw.spec:null;
  const inv={};for(const [key,n]of Object.entries(record(raw.inv)?raw.inv:{})){const k=Catalog.invKey(key);if(safeKey(k)&&ITEMS[k]&&Number.isFinite(n))inv[k]=integer((inv[k]||0)+Math.max(0,n),0,0,1e9);}o.inv=inv;
  const ids=new Set(),converted=new Set();
  function gear(it){
   if(!record(it))return null;let row=Catalog.byKey[it.catalogKey];
   if(!row&&legacy){row=Catalog.data.items.find(r=>r.name===it.name||r.nameEn===it.name);if(it.name==='Espada Enferrujada')row=Catalog.byKey['i_rusty-sword'];if(it.name==='Jaqueta de Couro')row=Catalog.byKey['i_leather-jacket'];}
   if(row?.kind==='adorn'){if(!converted.has(it.id)){o.inv[row.key]=(o.inv[row.key]||0)+1;converted.add(it.id);}return null;}
   if(row&&row.kind!=='gear')return null;
   if(!row&&(!['weapon','offhand','head','chest','legs','acc'].includes(it.slot)||!['guerreiro','mago','ladino','any'].includes(it.type)))return null;
   let id=typeof it.id==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(it.id)?it.id:uid();if(ids.has(id))return null;ids.add(id);
   const q=number(it.q,1,.7,2),band=Rules.bands.some(b=>b[0]===it.qualityBand)?it.qualityBand:q>=1.7?'ornate':q>=1.4?'legendary':q>=1.2?'famed':q>=1.1?'superior':q<.9?'broken':q<1?'poor':'common';
   const r={id,catalogKey:row?.key,slot:row?.slot||it.slot,type:row?(row.gear.length>1?'any':row.gear[0]):it.type,name:row?.name||String(it.name||'Equipamento legado').slice(0,120),base:row?.nameEn||String(it.base||it.name||'Legado').slice(0,120),tier:row?.tier||integer(it.tier,1,1,10),q,qualityBand:band,lvl:integer(it.lvl,1,1,13),seed:integer(it.seed,0,0,1000),adornments:[]};
   if(row)r.adornments=list(it.adornments,row.sockets).filter(k=>Catalog.byKey[k]?.kind==='adorn'&&Catalog.byKey[k].tier<=row.tier);
   else if(record(it.fixedStats)){r.fixedStats={};for(const [k,v]of Object.entries(it.fixedStats))if(['hp','mp','atk','mag','def','res','dex','ward','crit','init'].includes(k)&&Number.isFinite(v))r.fixedStats[k]=v;}
   return r;
  }
  const legacyGear=legacy&&raw.v===2&&record(raw.gear)?Object.values(raw.gear):[];o.bag=list(raw.bag).concat(legacyGear).map(gear).filter(Boolean);
  o.forge=list(raw.forge,20).map(job=>{const it=gear(job?.it);return it?{it,done:number(job.done,Date.now())}:null;}).filter(Boolean);
  const allItems=new Map(o.bag.map(it=>[it.id,it]));o.sets={};for(const set of SETS){o.sets[set]={};const source=record(raw.sets?.[set])?raw.sets[set]:{};for(const sl of SLOTS){const it=allItems.get(source[sl]);if(it&&it.slot===(sl.startsWith('acc')?'acc':sl)&&!Object.values(o.sets[set]).includes(it.id))o.sets[set][sl]=it.id;}}
  if(legacyGear.length)for(const [sl,it]of Object.entries(raw.gear)){const slot=sl==='acc'?'acc1':sl;if(allItems.has(it?.id))o.sets.padrao[slot]=it.id;}
  o.newIds=[...new Set(list(raw.newIds).filter(id=>allItems.has(id)))];
  o.skills=[...new Set(list(raw.skills).map(k=>legacy?Catalog.byKey[k]?k:oldSkills[k]||k:k).filter(validSkill))];
  o.equipped=[...new Set(list(raw.equipped).map(k=>legacy?Catalog.byKey[k]?k:oldSkills[k]||k:k).filter(k=>o.skills.includes(k)))].slice(0,Math.min(12,6+Math.floor(CLASSES[selected].tier/3)));
  const petKey=p=>{if(Catalog.byKey[p?.key]?.category==='followers')return p.key;const n=PETS[p?.key]?.n;return n?Catalog.data.followers.find(r=>r.name===n||r.nameEn===n)?.key:null;};
  const selectedPet=petKey(list(raw.pets)[raw.pet]);o.pets=[...new Set(list(raw.pets).map(petKey).filter(Boolean))].map(key=>({key}));o.pet=o.pets.findIndex(p=>p.key===selectedPet);
  o.town={};for(const k of ['loja','casa','bestiario','ferreiro','prefeitura'])o.town[k]=integer(raw.town?.[k],0,0,1e6);o.originalBuildings=counts(raw.originalBuildings);o.morale=number(raw.morale,0,0,100);o.npcTasks=integer(raw.npcTasks);
  o.cnt={arena:integer(raw.cnt?.arena),upgrades:integer(raw.cnt?.upgrades),dungeons:counts(raw.cnt?.dungeons)};o.quest={i:0,prog:counts(raw.quest?.prog),ready:false};
  o.originalQuests={index:integer(raw.originalQuests?.index,0,0,Campaign.quests.length),kills:counts(raw.originalQuests?.kills),baseline:{arena:integer(raw.originalQuests?.baseline?.arena),upgrades:integer(raw.originalQuests?.baseline?.upgrades),dungeons:integer(raw.originalQuests?.baseline?.dungeons)}};
  o.questFlags={horus:!!raw.questFlags?.horus,samsonIntroduction:raw.questFlags?.samsonIntroduction!==false||o.originalQuests.index>0};o.premiumUnlocks=[...new Set(list(raw.premiumUnlocks).filter(k=>Catalog.byKey[k]?.support))];o.raid={sigils:integer(raw.raid?.sigils),seals:integer(raw.raid?.seals),wins:integer(raw.raid?.wins)};
  o.raidProgress={};if(record(raw.raidProgress))for(const [key,p]of Object.entries(raw.raidProgress)){const row=Catalog.byKey[key];if(!record(p)||!row||!['bosses','raids'].includes(row.category))continue;const level=integer(p.level,Math.max(5,o.lvl),1,250),hp=number(p.hp,monStats(key,level).hp,0,monStats(key,level).hp);o.raidProgress[key]={hp,level,run:typeof p.run==='string'?p.run:uid(),rewarded:!!p.rewarded,combat:p.rewarded?null:combat(p.combat,'raid')};}
  PrizeEconomy.migrate(o,raw.prizeEconomy);o.endless=Endless.normalize(raw.endless);
  o.claimedRaids=counts(raw.claimedRaids);o.regions=record(raw.regions)?Object.fromEntries(Object.keys(raw.regions).filter(k=>ZONES[k]).map(k=>[k,true])):{};
  o.visited=record(raw.visited)?Object.fromEntries(Object.keys(raw.visited).filter(k=>POI[k]).map(k=>[k,true])):{loton:true};o.way=record(raw.way)?Object.fromEntries(Object.keys(raw.way).filter(k=>POI[k]).map(k=>[k,true])):{};
  o.buffs={};for(const k of ['xp2','gold2','ess2','astralSpeed'])if(Number.isFinite(raw.buffs?.[k]))o.buffs[k]=number(raw.buffs[k]);
  o.codex={};if(record(raw.codex))for(const [key,c]of Object.entries(raw.codex)){if(!record(c))continue;let k=key;if(!MON[k])k=Catalog.data.monsters.concat(Catalog.data.bosses).find(r=>r.name===Catalog.oldMon[key]?.n||r.nameEn===Catalog.oldMon[key]?.n)?.key;if(!k)continue;o.codex[k]={kills:integer(c.kills),seen:c.seen?1:0,moves:counts(c.moves),drops:counts(c.drops),el:record(c.el)?Object.fromEntries(Object.entries(c.el).filter(([e,v])=>ELEM[e]&&typeof v==='string')):{}};}
  o.daily=record(raw.daily)&&typeof raw.daily.day==='string'&&Array.isArray(raw.daily.list)?{day:raw.daily.day,list:raw.daily.list.filter(j=>record(j)&&MON[j.mon]&&j.need>0&&record(j.rw)).slice(0,3).map(j=>({mon:j.mon,need:integer(j.need,5,1,100),have:integer(j.have,0,0,100),claimed:!!j.claimed,rw:{ouro:integer(j.rw.ouro),ess:integer(j.rw.ess)}}))}:null;
  o.rewards=DailyRewards.normalize(raw.rewards);
  o.expedition=null;if(record(raw.expedition)&&DUNGEONS[raw.expedition.key]){const e=raw.expedition;o.expedition={key:e.key,floor:integer(e.floor,1,1,DUNGEONS[e.key].floors+1),carry:carry(e.carry),activeBattle:combat(e.activeBattle,'dungeon')};}
  o.arenaSession=record(raw.arenaSession)?{run:typeof raw.arenaSession.run==='string'?raw.arenaSession.run:uid(),keepHp:number(raw.arenaSession.keepHp,o.hp),keepMp:number(raw.arenaSession.keepMp,o.mp),rewarded:!!raw.arenaSession.rewarded,won:!!raw.arenaSession.won,combat:combat(raw.arenaSession.combat,'arena')}:null;
  if(o.arenaSession?.combat||o.expedition?.activeBattle||Object.values(o.raidProgress).some(p=>p.combat))o.endless.active=false;
  o.lastTown=POI[raw.lastTown]?.kind==='town'?raw.lastTown:'loton';o.pos=!legacy&&record(raw.pos)&&Number.isFinite(raw.pos.x)&&Number.isFinite(raw.pos.y)&&raw.pos.x>=0&&raw.pos.x<WW*TILE&&raw.pos.y>=0&&raw.pos.y<WH*TILE?{x:raw.pos.x,y:raw.pos.y}:null;
  if(legacy){o.legacyQuest=raw.quest;o.legacyMigrated=true;o.daily=null;o.lastTown='loton';}
  o.faction=['fogo','agua','terra','raio'].includes(raw.faction)?raw.faction:null;o.snd=raw.snd!==false;o.reduceMotion=!!raw.reduceMotion;
  for(const it of [...o.bag,...o.forge.map(f=>f.it)])if(/^i[0-9a-z]+$/.test(it.id)){const n=parseInt(it.id.slice(1),36);if(Number.isSafeInteger(n)&&n<Number.MAX_SAFE_INTEGER-10000)UID=Math.max(UID,n+1);}
  return Catalog.attachInv(o);
 }
 return {normalize,combat,carry,effects};
})();

/* Keep the v4 storage key so published updates retain existing player progress. */
const SAVE4_KEY='aethric-offline-v4';
const SAVE_SESSION=globalThis.crypto?.randomUUID?.()||uid()+'_'+Math.random();
let saveBaseline,saveConflict=false;
function showSaveConflict(){
 if(saveConflict)return;saveConflict=true;busy=true;H.path=[];stopFish();document.body.dataset.saveConflict='true';
 const style=document.createElement('style');style.textContent='body[data-save-conflict] .screen,body[data-save-conflict] #overlay,body[data-save-conflict] #modal{pointer-events:none}';document.head.append(style);
 const box=document.createElement('div');box.id='save-conflict';box.setAttribute('role','alert');box.style.cssText='position:fixed;z-index:99999;top:12px;left:12px;right:12px;margin:auto;max-width:540px;padding:18px;background:#302922;color:#eee4d5;border:2px solid #cdbb99;border-radius:8px;text-align:center;box-shadow:0 4px 24px #0009';box.innerHTML='<p>Outra aba atualizou seu progresso. Esta partida foi pausada para preservar o save mais recente.</p><button class="btn gold" id="reload-newer-save">Carregar progresso mais recente</button>';document.body.append(box);for(const node of document.body.children)if(node!==box&&node.tagName!=='SCRIPT')node.inert=true;
 document.getElementById('reload-newer-save').onclick=()=>{S=null;location.reload();};
}
addEventListener('storage',e=>{if(e.key===SAVE4_KEY&&S&&e.newValue!==saveBaseline)showSaveConflict();});
addEventListener('keydown',e=>{if(saveConflict){e.preventDefault();e.stopImmediatePropagation();}},true);

migrate=o=>StateSchema.normalize(o);
loadSave=()=>{
 try{const own=localStorage.getItem(SAVE4_KEY),raw=own||localStorage.getItem(SAVE_KEY);if(!S)saveBaseline=raw;if(!raw)return null;const data=JSON.parse(raw),state=migrate(data);if(!state)return null;
  try{if(!own&&!localStorage.getItem('vaelmar-backup-before-v4'))localStorage.setItem('vaelmar-backup-before-v4',raw);if(own&&data.schemaRevision!==3&&!localStorage.getItem('aethric-backup-before-v4.3'))localStorage.setItem('aethric-backup-before-v4.3',raw);}catch{}
  return state;
 }catch{return null;}
};
save=()=>{
 if(!S||saveConflict)return false;
 try{const current=localStorage.getItem(SAVE4_KEY)||localStorage.getItem(SAVE_KEY);if(saveBaseline!==undefined&&current!==saveBaseline){showSaveConflict();return false;}
  S.snd=SND;S.schemaRevision=3;S.saveSession=SAVE_SESSION;if(cur==='world')S.pos={x:H.x,y:H.y};const serialized=JSON.stringify(S);localStorage.setItem(SAVE4_KEY,serialized);saveBaseline=serialized;return true;
 }catch{if(!storageWarned){storageWarned=true;toast('O navegador bloqueou o salvamento. Exporte seu progresso em Opções.');}return false;}
};
const originalNewState=newState;newState=(cls,name)=>{const s=originalNewState(cls,name);s.schemaRevision=3;s.lastTown='loton';s.visited={loton:true};s.originalBuildings={};s.morale=0;s.npcTasks=0;s.arenaSession=null;s.originalQuests={index:0,kills:{},baseline:{arena:0,upgrades:0,dungeons:0}};return s;};
const originalEnterWorld=enterWorld;
enterWorld=fresh=>{
 Catalog.attachInv(S);S.visited||={loton:true};trimEquippedSkills();originalEnterWorld(false);
 if(!walkTile(...tileOf(H.x,H.y))){const nearest=nearestWalk(...tileOf(H.x,H.y)),p=nearest?{x:nearest[0]*TILE+16,y:nearest[1]*TILE+16}:poiPx(POI.loton);H.x=p.x;H.y=p.y;}
 if(S.arenaSession&&!S.arenaSession.combat){const a=S.arenaSession,st=stats();S.hp=Math.min(st.hp,a.keepHp);S.mp=Math.min(st.mp,a.keepMp);S.arenaSession=null;}
 if(S.hp<=0){S.expedition=null;for(const p of Object.values(S.raidProgress))p.combat=null;afterBattle('lose');return;}
 let resume=null;
 if(S.arenaSession?.combat)resume=()=>startArena(true);
 else if(S.expedition?.activeBattle)resume=()=>runDungeon(S.expedition.key,true);
 else{const raid=Object.entries(S.raidProgress).find(([,p])=>!p.rewarded&&p.combat);if(raid)resume=()=>startRaid(raid[0]);}
 if(resume){busy=true;setTimeout(()=>{busy=false;resume();},0);}else if(fresh)setTimeout(()=>toast('Visite Samson em Loton para começar a história.'),400);
 save();
};
ACT.exportsave=()=>{save();const blob=new Blob([JSON.stringify({format:'Aethric Offline',exportedAt:new Date().toISOString(),save:S},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Aethric-'+S.name.replace(/[^a-z0-9]/gi,'_')+'-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
ACT.importsave=()=>{
 const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{
  if(!input.files?.[0])return;try{if(input.files[0].size>8*1024*1024)throw Error('Arquivo de save muito grande.');const parsed=JSON.parse(await input.files[0].text()),state=migrate(parsed.save||parsed);if(!state)throw Error('Save incompatível');
   if(S)try{localStorage.setItem('aethric-backup-before-import',JSON.stringify(S));}catch{}
   try{saveBaseline=localStorage.getItem(SAVE4_KEY)||localStorage.getItem(SAVE_KEY);}catch{}saveConflict=false;delete document.body.dataset.saveConflict;document.getElementById('save-conflict')?.remove();for(const node of document.body.children)node.inert=false;S=state;learnSkills();closePanel();enterWorld(false);save();toast('Progresso importado.');
  }catch(e){toast('Não foi possível importar: '+e.message);}
 };input.click();
};

/* Calendar verified against Northern Forge's Astraltree announcement and image.
 * Currency scaling and tree node costs below are explicit offline balance.
 * An offline device has no authoritative server clock; use UTC and never rewind
 * a persisted daily/weekly ledger when the device clock moves backwards.
 */
const DailyRewards=(()=>{
 const DAY=86400000,SEED='i_astralseed',STAR='i_constellationseed';
 const calendar=[
  [SEED,1],['i_summoning-scroll',2],[SEED,1],['i_olympia-tower-key',1],
  [SEED,1],['i_summoning-scroll',2],[SEED,1],[STAR,1]
 ];
 const branches=[
  {id:'wealth',name:'Riqueza',description:'Ouro e orns para sua jornada.',nodes:[['Ouro',1,'gold'],['Orns',2,'orns'],['Tesouro de orns',1,'treasure',true]]},
  {id:'ascension',name:'Ascensão',description:'Materiais para aprimorar seus equipamentos.',nodes:[['Ferro e couro',1,'materials'],['Draconita',2,'draconite'],['Reserva de materiais',1,'materialsLarge',true]]},
  {id:'avarice',name:'Avareza',description:'Suprimentos, equipamentos e uma recompensa ornada.',nodes:[['Suprimentos',1,'supplies'],['Equipamento',2,'gear'],['Equipamento ornado',1,'ornate',true]]},
  {id:'power',name:'Poder',description:'Consumíveis e bênçãos para os combates.',nodes:[['Poção de EXP',1,'exp'],['Moedas da sorte',2,'luck'],['EXP +100% · 12 horas',1,'blessing',true]]},
  {id:'speed',name:'Velocidade',description:'Constelação exclusiva de Aethric: movimento +25% por 12 horas.',nodes:[['Passos astrais · 12 h',1,'speed']]}
 ];
 const nodeIds=new Set(branches.flatMap(b=>b.nodes.map((_,i)=>b.id+':'+i)));
 const integer=(x,fallback=0,max=1e9)=>Number.isSafeInteger(x)&&x>=0?Math.min(x,max):fallback;
 const day=(ms=Date.now())=>Math.floor(ms/DAY);
 const week=(ms=Date.now())=>Math.floor((day(ms)+3)/7); // Monday, 00:00 UTC.
 const tag=(ms=Date.now())=>new Date(ms).toISOString().slice(0,10);
 function normalize(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const last=Number.isSafeInteger(r.lastDay)&&r.lastDay>=0?r.lastDay:null;
  const t=r.tree&&typeof r.tree==='object'?r.tree:{};
  const w=r.weekly&&typeof r.weekly==='object'?r.weekly:{};
  return {claims:integer(r.claims),lastDay:last,maxDay:Math.max(last??0,integer(r.maxDay)),
   dailyDay:integer(r.dailyDay),tree:{week:integer(t.week),unlocked:[...new Set(Array.isArray(t.unlocked)?t.unlocked.filter(k=>nodeIds.has(k)):[])]},
   weekly:{week:integer(w.week),dailies:integer(w.dailies,0,21),bosses:integer(w.bosses,0,12),dailyClaimed:!!w.dailyClaimed,bossClaimed:!!w.bossClaimed},
   receipt:r.receipt&&Number.isSafeInteger(r.receipt.day)&&integer(r.receipt.index,-1,7)>=0?{day:r.receipt.day,index:integer(r.receipt.index,0,7),gold:integer(r.receipt.gold),orns:integer(r.receipt.orns)}:null};
 }
 function state(ms=Date.now()){
  S.rewards=normalize(S.rewards);const r=S.rewards;
  const currentWeek=week(ms);
  if(currentWeek>r.tree.week)r.tree={week:currentWeek,unlocked:[]};
  if(currentWeek>r.weekly.week)r.weekly={week:currentWeek,dailies:0,bosses:0,dailyClaimed:false,bossClaimed:false};
  return r;
 }
 function transact(action){
  if(!S||saveConflict||busy||cur==='battle')return false;
  const before=JSON.stringify(S);
  try{if(action()===false)return false;if(save())return true;}
  catch(error){console.error('Recompensa não aplicada:',error);}
  S=Catalog.attachInv(JSON.parse(before));return false;
 }
 function credit(key,n){if(!ITEMS[key])throw Error('Item de recompensa ausente: '+key);S.inv[key]=Math.min(1e9,qty(key)+n);}
 function claim(ms=Date.now()){
  if(!S||!Number.isFinite(ms)||day(ms)<0)return null;
  let receipt=null;
  const granted=transact(()=>{
   const r=state(ms),today=day(ms);if(today<=Math.max(r.lastDay??-1,r.maxDay))return false;
   const index=r.claims%calendar.length,tier=tierOfLv(S.lvl),[key,n]=calendar[index];
   // Public image confirms gold/orns, but does not disclose their formulas.
   receipt={day:today,index,gold:(50+25*S.lvl)*tier,orns:(10+5*S.lvl)*tier};
   credit(key,n);S.gold+=receipt.gold;S.ess+=receipt.orns;
   r.lastDay=today;r.maxDay=today;r.claims++;r.receipt=receipt;
  });
  return granted?receipt:null;
 }
 function ensureTasks(ms=Date.now()){
  if(!S)return;const r=state(ms),today=day(ms),key=tag(ms);
  if(S.daily?.day===key)return;
  if(today<Math.max(r.dailyDay,r.maxDay))return;
  // Preserve existing progress and claims when upgrading on the same day.
  if(S.daily?.day===todayKey()&&!r.dailyDay){S.daily.day=key;r.dailyDay=today;return;}
  const pool=[...new Set(Object.values(ZONES).filter(z=>z.minLv<=S.lvl).flatMap(z=>z.spawn.map(([k])=>k)))].filter(k=>MON[k]&&!MON[k].boss);
  const list=[];
  for(let i=0;i<3&&pool.length;i++){
   const k=pool.splice(ri(0,pool.length-1),1)[0],need=[5,10,15][i]+Math.max(0,tierOfLv(S.lvl)-1)*i;
   list.push({mon:k,need,have:0,claimed:false,rw:{ouro:Math.round((20+S.lvl*12)*need/5),ess:Math.round((10+S.lvl*6)*need/5)}});
  }
  S.daily={day:key,list};r.dailyDay=today;
 }
 function claimTask(index,ms=Date.now()){
  ensureTasks(ms);const j=S?.daily?.list[index];
  if(!Number.isInteger(index)||!j||j.claimed||j.have<j.need)return false;
  const ok=transact(()=>{j.claimed=true;S.gold+=j.rw.ouro;S.ess+=j.rw.ess;credit(SEED,index+1);const r=state(ms);r.weekly.dailies=Math.min(21,r.weekly.dailies+1);S.npcTasks=(S.npcTasks||0)+1;S.morale=Math.min(100,(S.morale||0)+5);questCheck();});
  if(ok){sfx.coin();toast('Meta concluída · +'+(index+1)+' Astralseed');}return ok;
 }
 function claimWeekly(kind,ms=Date.now()){
  const r=state(ms),key=kind==='dailies'?'dailyClaimed':kind==='bosses'?'bossClaimed':null,need=kind==='dailies'?10:12;
  if(!key||r.weekly[key]||r.weekly[kind]<need)return false;
  const ok=transact(()=>{r.weekly[key]=true;credit(STAR,1);});
  if(ok)toast('Meta semanal · +1 Constellationseed');return ok;
 }
 function gearReward(ornate){
  if(bagFull()){toast('Libere espaço no inventário antes de resgatar.');return false;}
  const path=CLASSES[S.cls].gear,tier=tierOfLv(S.lvl);
  const choices=Catalog.data.items.filter(r=>r.kind==='gear'&&r.tier<=tier&&!r.support&&r.gear.some(k=>path.includes(k))&&['weapon','head','chest','legs'].includes(r.slot));
  const highest=Math.max(...choices.map(r=>r.tier)),row=pick(choices.filter(r=>r.tier===highest));
  if(!row)return false;addGear(makeCatalogGear(row.key,ornate?1.7+Math.random()*.3:1));return true;
 }
 function nodeReward(kind){
  const tier=tierOfLv(S.lvl),scale=tier**3;
  if(kind==='gold')S.gold+=1000*scale;
  else if(kind==='orns')S.ess+=250*scale;
  else if(kind==='treasure')S.ess+=2000*scale;
  else if(kind==='materials'||kind==='materialsLarge'){const n=(kind==='materialsLarge'?50:10)*tier;credit('i_iron',n);credit('i_leather',n);}
  else if(kind==='draconite')credit('i_draconite',10*tier);
  else if(kind==='supplies'){credit('i_small-health-potion',10);credit('i_small-mana-potion',10);}
  else if(kind==='gear'||kind==='ornate')return gearReward(kind==='ornate');
  else if(kind==='exp')credit('i_exp-potion',1);
  else if(kind==='luck'){credit('i_lucky-coin',1);credit('i_lucky-silver-coin',1);}
  else if(kind==='blessing')S.buffs.xp2=Math.max(Date.now(),S.buffs.xp2||0)+12*3600000;
  else if(kind==='speed')S.buffs.astralSpeed=Math.max(Date.now(),S.buffs.astralSpeed||0)+12*3600000;
  else return false;
  return true;
 }
 function unlock(branchId,index,ms=Date.now()){
  const branch=branches.find(b=>b.id===branchId),node=branch?.nodes[index],r=state(ms),id=branchId+':'+index;
  if(!Number.isInteger(index)||!node||r.tree.unlocked.includes(id)||index>0&&!r.tree.unlocked.includes(branchId+':'+(index-1)))return false;
  const key=node[3]?STAR:SEED;if(qty(key)<node[1]){toast('Você precisa de mais '+ITEMS[key].n+'.');return false;}
  const ok=transact(()=>{if(nodeReward(node[2])===false)return false;S.inv[key]-=node[1];r.tree.unlocked.push(id);});
  if(ok){sfx.coin();toast('Recompensa da constelação recebida.');updateHUD();}return ok;
 }
 return {calendar,branches,SEED,STAR,DAY,day,week,tag,normalize,state,claim,ensureTasks,claimTask,claimWeekly,unlock};
})();

const rewardsNewState=newState;newState=(cls,name)=>{const s=rewardsNewState(cls,name);s.rewards=DailyRewards.normalize(null);s.schemaRevision=3;return s;};
ensureDaily=()=>DailyRewards.ensureTasks();
dailyReady=()=>!!S?.daily&&S.daily.day===DailyRewards.tag()&&S.daily.list.some(j=>j.have>=j.need&&!j.claimed);
const rewardsQuestKill=questKill;questKill=key=>{rewardsQuestKill(key);if(Catalog.byKey[key]&&['bosses','raids'].includes(Catalog.byKey[key].category)){const r=DailyRewards.state();r.weekly.bosses=Math.min(12,r.weekly.bosses+1);}};
ACT.claimjob=el=>{if(DailyRewards.claimTask(Number(el.dataset.i)))renderPanel();};
ACT.claimweekly=el=>{if(DailyRewards.claimWeekly(el.dataset.k))renderPanel();};
ACT.astralnode=el=>{if(DailyRewards.unlock(el.dataset.branch,Number(el.dataset.i)))renderPanel();};
ACT.astralbranch=el=>{P.astralBranch=el.dataset.k;renderPanel();};
ACT.rewards=()=>setView('rewards','login');
ACT.rewardtab=el=>{closeModal();setView('rewards',el.dataset.k);};
ACT.dailycheck=()=>{const receipt=DailyRewards.claim();if(receipt)toast('Recompensa diária recebida.');renderPanel();updateHUD();};
ACT.scrollraid=()=>{selectedRaidPayment='scroll';openPanel('raid');};
ACT.rewardtowers=()=>openPanel('rewardtowers');
ACT.rewardtower=el=>{const key=el.dataset.k;if(DUNGEONS[key]&&S.lvl>=dungeonMinimum(key))openPanel('dungeon',null,key);};
VIEWS.rewardtowers={r:()=>banner('Torres de Olímpia','Expedições disponíveis')+Object.keys(DUNGEONS).filter(k=>POI[k]?.originalKind==='tower').map(k=>'<div class="card"><b>'+DUNGEONS[k].n+'</b><p class="fine">Nível '+dungeonMinimum(k)+' · Chave da Torre de Olímpia ×1</p>'+btn('rewardtower','Ver expedição','data-k="'+k+'" '+(S.lvl<dungeonMinimum(k)?'disabled':''),'sm')+'</div>').join('')};
const rewardsStack=mStack;mStack=key=>{
 const extra=[DailyRewards.SEED,DailyRewards.STAR].includes(key)?btn('rewardtab','Abrir Astraltree','data-k="tree"','gold'):key==='i_summoning-scroll'?btn('scrollraid','Usar pergaminho','','gold'):key==='i_olympia-tower-key'?btn('rewardtowers','Ver torres','','gold'):'';
 return rewardsStack(key)+(extra?'<div class="row">'+extra+'</div>':'');
};

function rewardItem(key,size=38){const row=Catalog.byKey[key];return row?sprImg(Catalog.sprite(row.sprite,size),size):'';}
function loginCalendar(r){
 const received=r.lastDay===DailyRewards.day(),active=received&&r.receipt?r.receipt.index:r.claims%8;
 return '<div class="login-calendar">'+DailyRewards.calendar.map(([key,n],i)=>'<div class="login-prize'+(i===active?' today':'')+(i<active?' collected':'')+'"><span class="login-day">Dia '+(i+1)+'</span><span class="login-amount">×'+n+'</span>'+rewardItem(key,48)+'<b>'+esc(ITEMS[key].n)+'</b><span class="fine">'+(i===active?(received?'Recebido hoje':'Próximo prêmio'):(i<active?'Recebido':'A receber'))+'</span></div>').join('')+'</div>';
}
function loginReceipt(receipt){
 if(!receipt)return '';const [key,n]=DailyRewards.calendar[receipt.index];
 return '<div class="login-receipt"><h3>Você encontrou</h3><p>'+rewardItem(key,24)+' '+n+' '+esc(ITEMS[key].n)+'</p><p>'+fmt(receipt.orns)+' orns</p><p>'+fmt(receipt.gold)+' ouro</p></div>';
}
function showDailyReceipt(){
 if(cur!=='world'||busy||!overlay.hidden||!modal.hidden)return;
 openModal(()=>'<h2 class="dec" style="text-align:center">Recompensas diárias</h2>'+loginCalendar(DailyRewards.state())+loginReceipt(S.rewards.receipt)+btn('closemodal','Continuar','','gold wide daily-continue'));
}
function vDailyRewards(){
 const r=DailyRewards.state(),received=r.lastDay===DailyRewards.day();
 let h=banner('Recompensas','Sua jornada em Aethric')+tabsRow([['login','Entrada diária'],['tree','Astraltree'],['goals','Metas']],P.tab);
 if(P.tab==='tree')return h+vAstraltree();
 if(P.tab==='goals')return h+pAstralGoals();
 h+=loginCalendar(r);if(received)h+=loginReceipt(r.receipt);
 h+='<p class="fine">Uma recompensa por dia. O ciclo avança a cada entrada em um novo dia; dias sem jogar não apagam seu progresso. Renovação às 00:00 UTC.</p>';
 if(r.lastDay>DailyRewards.day())h+='<p class="fine">A data do aparelho está anterior à última recompensa. Confira o relógio para liberar os próximos dias.</p>';
 return h+btn('dailycheck',received?'Recompensa de hoje recebida':'Verificar recompensa','','wide'+(received?'':' gold'))+btn('rewardtab','Usar sementes na Astraltree','data-k="tree"','wide');
}
function vAstraltree(){
 const r=DailyRewards.state(),branch=DailyRewards.branches.find(b=>b.id===P.astralBranch)||DailyRewards.branches[0];
 const tabs=DailyRewards.branches.map(b=>btn('astralbranch',b.name,'data-k="'+b.id+'"','sm'+(b.id===branch.id?' sel':''))).join('');
 return '<div class="astral-wallet">'+rewardItem(DailyRewards.SEED,28)+' '+qty(DailyRewards.SEED)+' Astralseed　'+rewardItem(DailyRewards.STAR,28)+' '+qty(DailyRewards.STAR)+' Constellationseed</div><div class="astral-branches">'+tabs+'</div><h3>Constelação de '+branch.name+'</h3><p class="fine">'+branch.description+'</p><div class="astral-path">'+branch.nodes.map(([name,cost,kind,star],i)=>{
  const done=r.tree.unlocked.includes(branch.id+':'+i),locked=i>0&&!r.tree.unlocked.includes(branch.id+':'+(i-1)),key=star?DailyRewards.STAR:DailyRewards.SEED;
  return '<div class="card astral-node'+(done?' unlocked':'')+'"><span class="astral-dot">'+(done?'✓':i+1)+'</span><div><b>'+name+'</b><p class="fine">'+cost+' '+ITEMS[key].n+'</p>'+btn('astralnode',done?'Recebido':locked?'Complete o ramo anterior':'Ativar','data-branch="'+branch.id+'" data-i="'+i+'" '+(done||locked||qty(key)<cost?'disabled':''),'sm gold')+'</div></div>';
 }).join('')+'</div><p class="fine">Os ramos renovam às segundas-feiras, 00:00 UTC. As sementes guardadas permanecem no inventário.</p>';
}
function pAstralGoals(){
 ensureDaily();const r=DailyRewards.state();
 return '<h3>Metas de hoje</h3><div class="astral-goals">'+S.daily.list.map((j,i)=>'<div class="card"><b>Derrote '+j.need+' '+esc(MON[j.mon].n)+'</b><p>'+Math.min(j.have,j.need)+'/'+j.need+'</p><p>'+rewardItem(DailyRewards.SEED,22)+' Astralseed ×'+(i+1)+'</p>'+btn('claimjob',j.claimed?'Recebido':'Resgatar','data-i="'+i+'" '+(j.claimed||j.have<j.need?'disabled':''),'sm gold')+'</div>').join('')+'</div><h3>Metas da semana</h3>'+[['dailies','Conclua 10 metas diárias',10,'dailyClaimed'],['bosses','Derrote 12 chefes',12,'bossClaimed']].map(([key,label,need,flag])=>'<div class="card"><b>'+label+'</b><p>'+Math.min(r.weekly[key],need)+'/'+need+' · Constellationseed ×1</p>'+btn('claimweekly',r.weekly[flag]?'Recebido':'Resgatar','data-k="'+key+'" '+(r.weekly[flag]||r.weekly[key]<need?'disabled':''),'sm gold')+'</div>').join('');
}

const oldDailyList=pDaily;pDaily=inTown=>'<div class="row">'+btn('rewardtab','Recompensas e Astraltree','data-k="goals"','sm')+'</div>'+oldDailyList(true)+'<p class="fine">As três metas também concedem 1, 2 e 3 Astralseeds. Renovação às 00:00 UTC.</p>';
const rewardsMenu=vMainMenu;vMainMenu=()=>rewardsMenu().replace('</nav>','<button data-act="rewards">'+rewardItem(DailyRewards.SEED,28)+'<span>Recompensas diárias</span></button></nav>');VIEWS.main.r=vMainMenu;
VIEWS.rewards={def:'login',r:vDailyRewards};
const rewardsEvents=vEvents;vEvents=()=>rewardsEvents()+'<div class="card"><h3>Recompensas diárias</h3>'+btn('rewards','Calendário e Astraltree')+'</div>';
const rewardsEnterWorld=enterWorld;enterWorld=fresh=>{rewardsEnterWorld(fresh);if(DailyRewards.claim()){toast('Recompensa diária recebida.');showDailyReceipt();}};
let nextRewardCheck=0;const rewardsTick=exTick;exTick=now=>{rewardsTick(now);if(S&&now>=nextRewardCheck){nextRewardCheck=now+10000;if(DailyRewards.claim()){toast('Um novo dia começou · recompensa diária recebida.');showDailyReceipt();}}};
const shortcut=document.getElementById('daily-shortcut');shortcut.innerHTML='<span class="disc"><img class="pix" src="'+AETHRIC_DATA.assets[Catalog.byKey[DailyRewards.SEED].sprite]+'" alt=""></span><span class="outl">Recompensas</span>';

/* Automatic trial combat. Uses the same damage/status/ward rules as manual fights.
 * A trial is an offline adaptation; its pacing and rewards are not server facts. */
const TrialRules=(()=>{
 function rng(seed){let s=seed>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
 const copy=o=>JSON.parse(JSON.stringify(o));
 function actor(def){const stats=def.stats;return Rules.init({...copy(stats),key:def.key,n:def.n,maxhp:stats.hp,maxmp:stats.mp,hp:stats.hp,mp:stats.mp,ward:stats.maxWard||0,wardTurns:0,effects:{},skills:def.skills||[],effectImmunities:def.effectImmunities||[],immune:def.immune||[],statusProtection:def.statusProtection||0,charging:null});}
 function simulate(profile,enemy,{seed=1,trace=false}={}){
  const random=rng(seed),hero=actor(profile.hero),foe=actor(enemy),summons=[],pet=profile.pet?actor(profile.pet):null,frames=[];
  let turn=0,serial=0;
  const frame=(message,side='hero')=>{if(trace)frames.push({message,side,hp:hero.hp,mp:hero.mp,ward:hero.ward,wardTurns:hero.wardTurns,heroEffects:copy(hero.effects),enemyHP:foe.hp,enemyEffects:copy(foe.effects),summons:summons.map(f=>({key:f.key,hp:f.hp,maxhp:f.maxhp,mp:f.mp,maxmp:f.maxmp,ward:f.ward,maxWard:f.maxWard,effects:copy(f.effects)}))});};
  function effects(a,t,row,landed=true){
   for(const e of row.gives||[])Rules.applyEffect(a,e.nameEn,e.chance??1,random);
   if(landed&&t?.hp>0)for(const e of row.causes||[])Rules.applyEffect(t,e.nameEn,e.chance??1,random);
   Rules.removeEffects(a,(row.cures||[]).map(e=>e.nameEn));
  }
  function hit(a,t,skill={stat:'atk',pow:1},row={}){
   if(!t||t.hp<=0)return;
   const result=Rules.damage(a,t,skill,random);Rules.receive(t,result.d);effects(a,t,row,!result.miss&&result.d>0);
   if(a===hero&&skill.stat!=='mag'&&result.d>0)for(const e of profile.weaponCauses||[])Rules.applyEffect(t,e.nameEn,e.chance??1,random);
   frame(a.n+(result.miss?' erra.':' causa '+result.d+(result.crit?' de dano crítico.':' de dano.')),a===foe?'enemy':'hero');
  }
  function cast(a,t,s,free=false,complete=false){
   const row=s.row||{};
   if(!free&&!complete)a.mp=Math.max(0,a.mp-s.mp);
   if(!complete&&(s.castTurns||1)>1){a.charging={s,remaining:s.castTurns-1};frame(a.n+' prepara '+s.n+'.');return;}
   frame(a.n+' usa '+s.n+'.',a===foe?'enemy':'hero');
   if(row.summons?.length&&a===hero){
    if(summons.filter(f=>f.hp>0).length>=5)return;
    const definitions=row.summons.map(k=>profile.summons?.[k]).filter(Boolean);
    if(definitions.length){const f=actor(definitions[Math.floor(random()*definitions.length)]);f.id='trial-summon-'+serial++;summons.push(f);frame(f.n+' foi invocado.');}
   }else if(row.pact&&a===hero){
    const sacrifice=summons.find(f=>f.hp>0);if(sacrifice){hit({...a,mag:Math.max(a.mag,sacrifice.mag)*2},t,s,row);if(row.sacrifice)sacrifice.hp=0;}
   }else if(row.power||s.kind==='dmg'){
    for(let i=0;i<(s.hits||1)&&t?.hp>0;i++)hit(a,t,s,row);
   }else{
    const recipient=a===pet?hero:a;
    if(row.heal){const k=row.heal.stat,max=k==='mp'?recipient.maxmp:recipient.maxhp;const n=row.heal.flat||Math.round(max*(row.heal.fraction||.25)+(row.heal.magic?a.mag:0));recipient[k]=Math.min(max,recipient[k]+n);}
    if(row.ward){const w=row.ward;let recovery=w.flat?Math.min(1,(a.mag*w.flat+a.maxhp*.2)/Math.max(1,recipient.maxWard)):w.recover?.1:0;if(/mend-wall/.test(s.key||''))recovery=/iii/.test(s.key)?.5:/ii/.test(s.key)?.3:.1;Rules.ward(recipient,{turns:w.turns||0,absorb:w.absorb,recovery});}
    effects(recipient,t,row,true);frame(recipient.n+' recebe os efeitos de '+s.n+'.');
   }
  }
  function score(a,t,s){return Rules.damage(a,t,s,()=>.5).d*(s.hits||1)/Math.max(1,s.castTurns||1);}
  function strategy(a,t,{free=false,follower=false}={}){
   const options=a.skills.filter(s=>(free||a.mp>=s.mp)&&(!s.row?.pact||summons.some(f=>f.hp>0)));
   const heal=options.find(s=>s.row?.heal&&(s.row.heal.stat==='mp'?a.mp<a.maxmp*.2:(follower?hero:a).hp<(follower?hero:a).maxhp*.45));
   if(heal)return heal;
   const summon=options.find(s=>s.row?.summons?.length);if(a===hero&&summon&&summons.filter(f=>f.hp>0).length<(profile.summoner?5:2))return summon;
   const buff=options.find(s=>s.row?.self&&s.row.gives?.some(e=>Rules.effectDef(e.nameEn).beneficial&&!Object.values(a.effects).some(v=>v.name===e.nameEn)));
   if(buff&&turn<8)return buff;
   const ward=options.find(s=>s.row?.ward?.turns&&!a.wardTurns&&a.ward>0);if(ward&&a.hp<a.maxhp*.65)return ward;
   const damage=options.filter(s=>s.kind==='dmg'||s.row?.power).sort((x,y)=>score(a,t,y)-score(a,t,x));
   if(damage[0]&&score(a,t,damage[0])>score(a,t,{stat:'atk',pow:1})*1.05)return damage[0];
   return null;
  }
  function act(a,t,free=false){
   if(a.hp<=0||!t||t.hp<=0)return;
   const status=Rules.tick(a,random);if(status.damage)frame(a.n+' sofre '+status.damage+' por efeitos.');
   if(status.dead||status.skip){if(status.skip)frame(a.n+' não consegue agir.');Rules.endTurn(a);return;}
   if(a.charging){const c=a.charging;if(--c.remaining<=0){a.charging=null;cast(a,t,c.s,true,true);}else frame(a.n+' continua preparando '+c.s.n+'.');}
   else{const s=strategy(a,t,{free});if(s)cast(a,t,s,free);else hit(a,t);}
   Rules.endTurn(a);
  }
  function follower(){
   if(!pet||foe.hp<=0||hero.hp<=0)return;
   const options=pet.skills,rate=profile.pet.rates||{};
   const heal=options.filter(s=>s.row?.heal);
   if(hero.hp<hero.maxhp*.75&&heal.length&&random()<Math.min(1,rate['Heal rate']||0))cast(pet,hero,heal[0],true);
   else{const damage=options.filter(s=>s.kind==='dmg'||s.row?.power);if(damage.length&&random()<Math.min(1,rate['Spell rate']||0))cast(pet,foe,damage[0],true);else if(random()<Math.min(1,rate['Attack rate']||0))hit(pet,foe);}
  }
  frame('O próximo adversário se aproxima.');
  const enemyFirst=foe.dex*.15+random()*6>(hero.init||2)+random()*6;
  if(enemyFirst)act(foe,hero,true);
  for(turn=1;turn<=40&&hero.hp>0&&foe.hp>0;turn++){
   act(hero,foe);follower();
   for(const f of summons.filter(f=>f.hp>0)){if(foe.hp<=0||hero.hp<=0)break;act(f,foe,true);}
   if(foe.hp>0&&hero.hp>0){const targets=[hero,...summons.filter(f=>f.hp>0)];act(foe,targets[Math.floor(random()*targets.length)],true);}
  }
  const win=hero.hp>0&&foe.hp<=0;
  frame(win?'Vitória!':'Este andar exige um personagem mais forte.');
  return {win,turns:Math.min(40,turn),heroHP:hero.hp,enemyHP:foe.hp,frames};
 }
 return {rng,simulate};
})();

/* Endless trial: 30-second encounters, three opponents per floor, safe fallback.
 * Currency uses the existing prize balance. No XP or campaign/codex progress is
 * manufactured by passive play. Existing classes, items and battle rules remain.
 */
const PrizeEconomy=(()=>{
 const classCost=row=>144+40*Math.max(0,(row?.tier||2)-2);
 const gearCost=tier=>72+30*(tier-1);
 function migrate(state,version){if(version!==1)state.raid.seals=Math.min(1e9,state.raid.seals*48);state.prizeEconomy=1;}
 return {classCost,gearCost,migrate};
})();
const Endless=(()=>{
 const WAVE=30000,HOUR=3600000,OFFLINE=8*HOUR,MAX=500;
 const cache=new Map();
 const int=(v,d=0,max=1e12)=>Number.isFinite(v)&&v>=0?Math.min(max,Math.floor(v)):d;
 const hash=s=>{let n=2166136261;for(let i=0;i<s.length;i++)n=Math.imul(n^s.charCodeAt(i),16777619);return n>>>0;};
 function normalize(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{},best=int(r.best,0,MAX),mode=r.mode==='farm'?'farm':'advance';
  return {version:1,active:r.active===true&&r.version===1&&Number.isFinite(r.lastAt)&&r.lastAt>0,mode,best,floor:Math.max(1,Math.min(mode==='farm'?(best||1):best+1,int(r.floor,1,MAX))),farm:Math.max(1,Math.min(best||1,int(r.farm,1,MAX))),variant:int(r.variant,0,2),carry:int(r.carry,0,WAVE-1),lastAt:int(r.lastAt,0,Number.MAX_SAFE_INTEGER),coinRemainder:int(r.coinRemainder,0,HOUR-1),goldRemainder:int(r.goldRemainder,0,HOUR-1),wins:int(r.wins),losses:int(r.losses),earned:int(r.earned),elapsed:int(r.elapsed),wall:int(r.wall,0,MAX)};
 }
 function state(){S.endless=normalize(S.endless);return S.endless;}
 const rate=floor=>Math.min(60,12+Math.floor((floor-1)/5));
 const goldRate=floor=>600*tierOfLv(Math.min(250,floor))**2;
 function skill(key){
  const s=SKILLS[key];if(!s||!supportedSkill(s))return null;const r=skillRow(s);
  return {key,n:s.n,mp:s.mp||0,kind:s.kind,stat:s.stat,elem:s.elem,pow:s.pow,powerRange:s.powerRange,penetration:s.penetration,outputRange:s.outputRange,critAbsolute:s.critAbsolute,hits:s.hits,all:s.all,castTurns:s.castTurns||1,row:{key:r.key,self:r.self,target:r.target,power:r.power,heal:r.heal,ward:r.ward,pact:r.pact,sacrifice:r.sacrifice,summons:(r.summons||[]).map(x=>x.key),gives:(r.gives||[]).map(e=>({...e,chance:probability(e)})),causes:(r.causes||[]).map(e=>({...e,chance:probability(e)})),cures:r.cures||[]}};
 }
 function capture(){
  const st=stats('masmorra'),h=heroFighter('dungeon'),keys=S.equipped.filter(k=>SKILLS[k]),summons={};
  const hero={key:S.cls,n:S.name,stats:{...st,maxWard:st.maxWard},skills:keys.map(skill).filter(Boolean),immune:h.immune,effectImmunities:h.effectImmunities,statusProtection:h.statusProtection};
  for(const s of hero.skills)for(const key of s.row.summons){const row=Catalog.byKey[key];if(!row)continue;const base=monStats(key,S.lvl),boost=1+passiveValue('Summon Stats')/100;for(const k of ['hp','atk','mag','def','res'])base[k]=Math.round(base[k]*boost);summons[key]={key,n:row.name,stats:base,skills:(row.skills||[]).map(skill).filter(Boolean)};}
  const follower=petFighter();let pet=null;
  if(follower){const row=Catalog.byKey[follower.key],base=monStats(follower.key,S.lvl);base.atk=follower.atk;base.mag=follower.mag;const boost=1+(SPECS[S.spec]?.pet||0);pet={key:follower.key,n:follower.n,stats:base,skills:(row.skills||[]).map(skill).filter(Boolean),rates:Object.fromEntries(Object.entries(row.rates||{}).map(([k,v])=>[k,v*boost]))};}
  const weapon=equippedIn('masmorra','weapon'),row=weapon&&Catalog.byKey[weapon.catalogKey];
  const profile={hero,pet,summons,summoner:!!CLASSES[S.cls].summoner,weaponCauses:(row?.sections.Causes||[]).map(e=>({...e,chance:probability(e)}))};
  profile.id=hash(JSON.stringify(profile));return profile;
 }
 function enemy(floor,variant){
  const lv=Math.min(250,floor),tier=tierOfLv(lv),pool=Catalog.data.monsters.filter(r=>r.tier===tier&&!r.event&&!r.summoned);
  const row=floor===1?Catalog.byKey.m_rat:pool[(floor*7+variant*11)%pool.length]||Catalog.byKey.m_rat;
  const base=monStats(row.key,lv),factor=(.55+lv*.004)*Math.pow(1.04,Math.max(0,floor-250));
  for(const k of ['hp','atk','mag','def','res'])base[k]=Math.max(1,Math.min(1e9,Math.round(base[k]*factor)));
  return {key:row.key,n:row.name,lv,stats:base,skills:(row.skills||[]).map(skill).filter(s=>s&&!s.row.summons.length&&!s.row.pact),effectImmunities:(row.sections.Immunities||[]).map(e=>e.nameEn)};
 }
 function duel(profile,floor,variant,trace=false){
  const key=profile.id+':'+floor+':'+variant;
  if(!trace&&cache.has(key))return cache.get(key);
  const definition=enemy(floor,variant),result=TrialRules.simulate(profile,definition,{seed:hash('trial:'+floor+':'+variant),trace});
  result.enemy=definition;if(!trace){if(cache.size>1500)cache.clear();cache.set(key,result);}return result;
 }
 function preview(floor,profile=capture()){
  const victories=[0,1,2].map(i=>duel(profile,floor,i).win),wins=victories.filter(Boolean).length;
  return {floor,wins,coins:rate(floor)*wins/3,gold:goldRate(floor)*wins/3,stable:wins===3};
 }
 function advance(now=Date.now(),persist=true){
  if(!S||saveConflict)return null;const r=state();if(!r.active||!Number.isFinite(now)||now<r.lastAt)return null;
  const snapshot={r:JSON.stringify(r),coins:S.raid.seals,gold:S.gold},rawElapsed=Math.max(0,now-r.lastAt),elapsed=Math.min(OFFLINE,rawElapsed),profile=capture();
  const summary={coins:0,gold:0,wins:0,losses:0,waves:0,elapsed,capped:rawElapsed>OFFLINE,from:r.floor,to:r.floor};
  r.lastAt=now;r.elapsed=Math.min(1e12,r.elapsed+elapsed);const total=r.carry+elapsed,waves=Math.floor(total/WAVE);r.carry=total%WAVE;
  for(let i=0;i<waves;i++){
   const result=duel(profile,r.floor,r.variant);summary.waves++;
   if(result.win){
    const coins=r.coinRemainder+rate(r.floor)*WAVE,gold=r.goldRemainder+goldRate(r.floor)*WAVE;
    summary.coins+=Math.floor(coins/HOUR);summary.gold+=Math.floor(gold/HOUR);r.coinRemainder=coins%HOUR;r.goldRemainder=gold%HOUR;r.wins++;summary.wins++;
    r.variant++;
    if(r.variant===3){r.variant=0;if(r.mode==='advance'){r.best=Math.max(r.best,r.floor);r.farm=r.best;if(r.floor>=MAX){r.mode='farm';r.floor=r.best;}else r.floor++;}}
   }else{
    summary.losses++;r.losses++;r.variant=0;r.wall=Math.max(r.wall,r.floor);
    if(r.mode==='advance'){r.mode='farm';r.floor=r.farm=r.best||1;}
    else if(r.floor>1){r.floor--;r.farm=r.floor;}
   }
  }
  r.earned=Math.min(1e12,r.earned+summary.coins);S.raid.seals=Math.min(1e9,S.raid.seals+summary.coins);S.gold=Math.min(Number.MAX_SAFE_INTEGER,S.gold+summary.gold);summary.to=r.floor;
  if(persist&&summary.waves>0&&!save()){S.endless=JSON.parse(snapshot.r);S.endless.active=false;S.raid.seals=snapshot.coins;S.gold=snapshot.gold;return null;}
  return summary;
 }
 function start(mode='advance',floor){
  if(!S||busy||cur==='battle'||saveConflict)return false;
  const r=state(),now=Date.now();r.active=true;r.mode=mode==='farm'?'farm':'advance';
  const selected=r.mode==='farm'?Math.max(1,Math.min(r.best||1,Math.floor(floor||r.farm))):Math.min(MAX,r.best+1);
  if(selected!==r.floor){r.floor=selected;r.variant=0;r.carry=0;}
  r.farm=r.mode==='farm'?selected:r.farm;r.lastAt=Math.max(now,r.lastAt);
  if(!save()){r.active=false;return false;}return true;
 }
 function pause(){advance();if(S?.endless)S.endless.active=false;save();}
 return {WAVE,HOUR,OFFLINE,MAX,normalize,state,rate,goldRate,capture,enemy,duel,preview,advance,start,pause};
})();

const endlessNewState=newState;newState=(cls,name)=>{const s=endlessNewState(cls,name);s.endless=Endless.normalize(null);s.prizeEconomy=1;s.schemaRevision=3;return s;};
let trialVisual=null;
function showTrial(){
 closePanel();busy=true;const r=Endless.state(),profile=Endless.capture(),result=Endless.duel(profile,r.floor,r.variant,true),def=result.enemy;
 const hero=heroFighter('dungeon');Object.assign(hero,profile.hero.stats,{hp:profile.hero.stats.hp,mp:profile.hero.stats.mp,maxhp:profile.hero.stats.hp,maxmp:profile.hero.stats.mp});
 const foe=makeFoe(def.key,def.lv);Object.assign(foe,def.stats,{maxhp:def.stats.hp,maxmp:def.stats.mp,hp:def.stats.hp});
 B={hero,pet:petFighter(),summons:[],foes:[foe],mode:'endless',bio:'tower',canFlee:false,phase:'automatic'};show('battle');sizeBattle();layoutBattle();renderParty();
 logEl.innerHTML='';trialVisual={key:r.floor+':'+r.variant+':'+profile.id,result,lastFrame:-1};
 const stage=document.getElementById('b-stage');let hud=document.getElementById('trial-hud');if(!hud){hud=document.createElement('div');hud.id='trial-hud';stage.append(hud);}hud.hidden=false;
 cmdEl.className='cmds trial-commands';cmdEl.innerHTML=[['advance','Tentar avançar'],['farm','Repetir andar'],['menu','Andares'],['prizes','Prêmios'],['pause','Pausar e sair']].map(([k,n])=>'<button class="btn'+(k==='pause'?' gold':'')+'" data-trial-action="'+k+'">'+n+'</button>').join('');
 renderTrial();
}
function renderTrial(){
 if(!S?.endless?.active||B?.mode!=='endless')return;const r=S.endless,profile=Endless.capture(),key=r.floor+':'+r.variant+':'+profile.id;
 if(!trialVisual||trialVisual.key!==key){showTrial();return;}
 const result=trialVisual.result,index=Math.min(result.frames.length-1,Math.floor(r.carry/Endless.WAVE*result.frames.length));
 const hud=document.getElementById('trial-hud');hud.textContent='Masmorra automática · Andar '+r.floor+' · '+(r.mode==='farm'?'Repetição':'Avançando')+' · saldo '+S.raid.seals+' · até '+Endless.rate(r.floor)+' moedas/h · próxima moeda '+Math.floor(r.coinRemainder/Endless.HOUR*100)+'%';
 if(index!==trialVisual.lastFrame){
  for(let i=trialVisual.lastFrame+1;i<=index;i++)say(result.frames[i].message);
  trialVisual.lastFrame=index;const f=result.frames[index];if(f){B.hero.hp=f.hp;B.hero.mp=f.mp;B.hero.ward=f.ward;B.hero.wardTurns=f.wardTurns;B.hero.effects=f.heroEffects;B.foes[0].hp=f.enemyHP;B.foes[0].effects=f.enemyEffects;B.foes[0].alpha=f.enemyHP>0?1:.25;
   B.summons=f.summons.map((raw,i)=>{const unit=makeFoe(raw.key,S.lvl);Object.assign(unit,raw,{id:'trial-'+i,summon:true,boss:false,alpha:raw.hp>0?1:.2});return unit;});layoutBattle();renderParty();
  }
 }
}
function leaveTrial(){Endless.pause();busy=false;B=null;trialVisual=null;document.getElementById('trial-hud')?.setAttribute('hidden','');show('world');updateHUD();}
ACT.trialmenu=()=>{if(B?.mode==='endless')leaveTrial();openPanel('trial');};
ACT.trialstart=el=>{if(Endless.start(el.dataset.mode,Number(el.dataset.floor)))showTrial();};
ACT.trialprizes=()=>{if(B?.mode==='endless')leaveTrial();openPanel('hero','runes');};
cmdEl.addEventListener('click',e=>{
 const button=e.target.closest('[data-trial-action]');if(!button||B?.mode!=='endless')return;
 const key=button.dataset.trialAction;
 if(key==='pause')leaveTrial();else if(key==='menu')ACT.trialmenu();else if(key==='prizes')ACT.trialprizes();
 else{Endless.advance();const r=Endless.state();r.mode=key==='farm'?'farm':'advance';r.floor=key==='farm'?(r.best||1):Math.min(Endless.MAX,r.best+1);r.farm=key==='farm'?r.floor:r.farm;r.variant=0;r.carry=0;save();showTrial();}
});
VIEWS.trial={r:()=>{
 const r=Endless.state(),info=Endless.preview(r.farm),next=Endless.preview(Math.min(Endless.MAX,r.best+1));
 return banner('Masmorra automática','Fortaleça seu herói para alcançar novos andares')+'<div class="card"><h3>Seu progresso</h3><p>Melhor andar: '+r.best+' · moedas de prêmio: '+S.raid.seals+'</p><p>Andar de repetição: '+r.farm+' · '+info.coins.toFixed(1)+' moedas/h · '+Math.round(info.gold)+' ouro/h</p><p class="fine">'+(info.stable?'Os três adversários desse andar podem ser vencidos com o equipamento atual.':'Melhore seu equipamento para vencer todos os adversários desse andar.')+'</p>'+btn('trialstart','Avançar automaticamente','data-mode="advance"','gold wide')+btn('trialstart','Repetir andar '+r.farm,'data-mode="farm" data-floor="'+r.farm+'"','wide')+'</div><div class="card"><h3>Escolher andar de repetição</h3>'+[...new Set([1,Math.max(1,r.best-10),Math.max(1,r.best-5),Math.max(1,r.best)])].map(f=>btn('trialstart','Andar '+f+' · '+Endless.rate(f)+'/h','data-mode="farm" data-floor="'+f+'"','sm')).join('')+'</div><div class="card"><h3>Como funciona</h3><p>Novos adversários a cada 30 segundos. Vença três para subir um andar. Ao encontrar um limite, o herói volta ao último andar conquistado e continua repetindo.</p><p>A preparação recupera PV e mana entre inimigos, sem gastar suas poções. Enquanto a masmorra estiver ativa, você acumula até 8 horas offline. Pausar interrompe o acúmulo. Aqui você recebe moedas de prêmio e ouro; evolua classes, nível e equipamentos nas outras aventuras para avançar.</p><p class="fine">A taxa depende de vitórias. Derrotas não pagam. Um prêmio importante exige aproximadamente 6–10 horas no estágio adequado.</p></div>'+btn('trialprizes','Abrir loja de prêmios','','wide');
}};
const trialMenu=vMainMenu;vMainMenu=()=>trialMenu().replace('</nav>','<button data-act="trialmenu">'+iconImg(['chave'],28)+'<span>Masmorra automática</span></button><button data-act="trialprizes">'+runeGlyph(28)+'<span>Loja de prêmios</span></button></nav>');VIEWS.main.r=vMainMenu;
const trialEvents=vEvents;vEvents=()=>trialEvents()+'<div class="card"><h3>Masmorra automática</h3>'+btn('trialmenu','Andares e moedas por hora')+'</div>';
const trialEnterWorld=enterWorld;enterWorld=fresh=>{
 trialEnterWorld(fresh);if(!S||busy||!S.endless?.active)return;
 const daily=!modal.hidden?mBody.innerHTML:'',summary=Endless.advance();showTrial();
 if(summary?.waves||daily)openModal(()=>'<h3>Retorno à masmorra</h3>'+(summary?.waves?'<p>'+summary.wins+' vitórias · +'+summary.coins+' moedas de prêmio · +'+summary.gold+' ouro</p><p class="fine">'+(summary.capped?'Aplicado o limite de 8 horas offline.':'Progresso desde a última visita.')+'</p>':'')+daily+(!daily?btn('closemodal','Continuar','','gold wide'):''));
};
function tickTrial(){
 const summary=Endless.advance();renderTrial();
 if(summary?.waves&&B?.mode==='endless'){
  if(summary.losses)say('Limite encontrado. Repetindo o andar '+S.endless.floor+'.','bad');
  if(summary.wins)say(summary.wins+' vitória(s) · +'+summary.gold+' ouro · '+(summary.coins?'+'+summary.coins+' moedas de prêmio':'próxima moeda '+Math.floor(S.endless.coinRemainder/Endless.HOUR*100)+'%')+'.','gold');
 }
}
setInterval(()=>{if(S?.endless?.active&&!document.hidden&&!saveConflict)tickTrial();},1000);
document.addEventListener('visibilitychange',()=>{if(S?.endless?.active){if(!document.hidden)tickTrial();else Endless.advance();save();}});
const trialWorldButton=document.createElement('button');trialWorldButton.className='rbtn sm';trialWorldButton.innerHTML='<span class="disc">'+iconImg(['chave'],28)+'</span><span class="outl">Masmorra</span>';trialWorldButton.onclick=()=>ACT.trialmenu();document.querySelector('.w-left').append(trialWorldButton);

vRuneShop=()=>{
 const tier=tierOfLv(S.lvl),price=PrizeEconomy.gearCost(tier);
 return '<h2 class="dec">Loja de prêmios</h2><p>Moedas de prêmio: <b>'+S.raid.seals+'</b></p><p class="fine">Conquiste moedas na masmorra automática e vencendo chefes de incursão.</p>'+btn('trialmenu','Masmorra e taxa por hora','','wide')+'<h3>Classes alternativas</h3>'+Catalog.data.classes.filter(r=>r.support).map(r=>{const cost=PrizeEconomy.classCost(r),owned=S.premiumUnlocks.includes(r.key)||S.classes.includes(Catalog.canonicalClass(r.key)),locked=r.tier>tier;return '<div class="card"><div class="row l">'+sprImg(Catalog.sprite(r.sprite,40),48)+'<b>'+esc(r.name)+'</b></div><p class="fine">'+stars(r.tier)+' · '+cost+' moedas · '+(locked?'Disponível no nível '+((r.tier-1)*25):'Habilidades e atributos do catálogo')+'</p>'+btn('earnedprize',owned?'Conquistada':locked?'Tier ainda bloqueado':'Conquistar','data-kind="class" data-key="'+r.key+'" '+(owned||locked||S.raid.seals<cost?'disabled':''),'sm gold')+'</div>';}).join('')+'<h3>Equipamentos e suprimentos</h3><div class="card"><b>Equipamento ornado do seu tier</b><p>'+price+' moedas · qualidade entre 170% e 200%</p>'+btn('earnedprize','Arma','data-kind="weapon" '+(S.raid.seals<price?'disabled':''),'sm')+btn('earnedprize','Armadura','data-kind="armor" '+(S.raid.seals<price?'disabled':''),'sm')+'</div><div class="card"><b>5 poções de saúde + 5 de mana</b>'+btn('earnedprize','Resgatar · 10 moedas','data-kind="supply" '+(S.raid.seals<10?'disabled':''),'sm')+'</div><div class="card"><b>3 chaves de masmorra + 3 fichas de arena</b>'+btn('earnedprize','Resgatar · 20 moedas','data-kind="keys" '+(S.raid.seals<20?'disabled':''),'sm')+'</div>';
};
ACT.earnedprize=el=>{
 if(busy||cur==='battle'||saveConflict)return;const kind=el.dataset.kind,row=Catalog.byKey[el.dataset.key],tier=tierOfLv(S.lvl);
 const cost=kind==='class'?PrizeEconomy.classCost(row):kind==='supply'?10:kind==='keys'?20:PrizeEconomy.gearCost(tier);
 if(!['class','supply','keys','weapon','armor'].includes(kind)||S.raid.seals<cost)return;
 if(kind==='class'&&(!row?.support||row.tier>tier||S.premiumUnlocks.includes(row.key)||S.classes.includes(Catalog.canonicalClass(row.key))))return;
 if(['weapon','armor'].includes(kind)&&bagFull()){toast('Libere espaço na mochila antes de resgatar.');return;}
 const before=JSON.stringify(S);
 if(kind==='class'){S.premiumUnlocks.push(row.key);const cls=Catalog.canonicalClass(row.key);if(!S.classes.includes(cls))S.classes.push(cls);}
 else if(kind==='supply'){addItem('pocao_p',5);addItem('eter_p',5);}
 else if(kind==='keys'){addItem('chave',3);addItem('ficha',3);}
 else{
  const slot=kind==='weapon'?'weapon':'chest',pool=Catalog.data.items.filter(r=>r.kind==='gear'&&r.tier===tier&&r.slot===slot&&!r.tags.includes('Exotic')&&canWear({catalogKey:r.key}));
  const base=pick(pool);if(!base){toast('Não há equipamento compatível neste tier.');return;}
  addGear(makeCatalogGear(base.key,1.7+Math.random()*.3));
 }
 S.raid.seals-=cost;learnSkills();if(!save()){S=Catalog.attachInv(JSON.parse(before));return;}toast('Prêmio conquistado.');refresh();
};

/* Use the visible viewport, including when Android/browser bars resize it. */
function fitGameViewport(){
 const height=Math.floor(globalThis.visualViewport?.height||innerHeight);
 document.documentElement.style.setProperty('--app-height',height+'px');
 if(cur==='battle'&&B){sizeBattle();layoutBattle();}
}
addEventListener('resize',fitGameViewport);
globalThis.visualViewport?.addEventListener('resize',fitGameViewport);
fitGameViewport();
const mobileSay=say;say=(text,cls='')=>{mobileSay(text,cls);logEl.scrollTop=logEl.scrollHeight;};

/* Reference-led UI. Generated scenery is independent art, not the original client. */
const PaintedScene=(()=>{
 const data='@@A:4e317cc7bdb49862@@',atlasData='@@A:749b28abe0ac8917@@',image=new Image(),atlas=new Image(),panels={desert:[0,0],snow:[1,0],tower:[0,1],ruins:[0,1],cave:[1,1],volcanic:[1,1]};let ready=false,atlasReady=false;
 const loaded=Promise.all([new Promise(resolve=>{image.onload=()=>{ready=true;resolve();};image.onerror=resolve;image.src=data;}),new Promise(resolve=>{atlas.onload=()=>{atlasReady=true;resolve();};atlas.onerror=resolve;atlas.src=atlasData;})]);
 const has=bio=>['forest','grass','swamp','forest_dark'].includes(bio)||Object.hasOwn(panels,bio);
 function draw(g,w,h,bio){const panel=panels[bio],source=panel?atlas:image;if(panel?!atlasReady:!ready){g.fillStyle='#203126';g.fillRect(0,0,w,h);return;}const sw=source.width/(panel?2:1),sh=source.height/(panel?2:1),sx=panel?panel[0]*sw:0,sy=panel?panel[1]*sh:0,scale=Math.max(w/sw,h/sh),iw=sw*scale,ih=sh*scale;g.imageSmoothingEnabled=true;g.drawImage(source,sx,sy,sw,sh,(w-iw)/2,(h-ih)/2,iw,ih);}
 return {data,loaded,has,draw};
})();
const referenceArtLoader=loadOfficialArt;loadOfficialArt=async()=>{await Promise.all([referenceArtLoader(),PaintedScene.loaded]);};
const referenceBanner=bannerUrl;bannerUrl=bio=>['forest','grass','swamp','forest_dark'].includes(bio)?PaintedScene.data:referenceBanner(bio);
document.documentElement.style.setProperty('--reference-landscape','url("'+PaintedScene.data+'")');
const referenceSizeBattle=sizeBattle;sizeBattle=()=>{referenceSizeBattle();if(!BS.W)return;BS.u=Math.max(1,Math.min(BS.W/192,BS.H/220));BS.AW=BS.W/BS.u;BS.AH=BS.H/BS.u;BS.k=Math.max(1,Math.round(BS.u));};
const referenceLayout=layoutBattle;layoutBattle=()=>{
 referenceLayout();if(!B)return;const w=BS.AW,h=BS.AH;
 B.hero.x=Math.max(B.hero.hw+3,w*.24);B.hero.y=h*.57;
 if(B.pet){B.pet.x=Math.max(B.pet.hw+2,w*.1);B.pet.y=h*.64;}
 B.foes.forEach((f,i)=>{f.x=Math.min(w-f.hw-2,w*(B.foes.length===1?.72:.61+(i%2)*.22));f.y=h*(.54+Math.floor(i/2)*.045+(i%2)*.045);});
 (B.summons||[]).forEach((f,i)=>{f.x=w*(.13+(i%3)*.13);f.y=h*(.63+Math.floor(i/3)*.06);});
};
if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>document.documentElement.style.setProperty('--commands-height',cmdEl.getBoundingClientRect().height+'px')).observe(cmdEl);

let referenceModalCancel=null;
const referenceCloseModal=closeModal;closeModal=()=>{const cancel=referenceModalCancel;referenceModalCancel=null;modal.classList.remove('reference-fullscreen');cmdEl.inert=false;cmdEl.hidden=false;referenceCloseModal();if(cancel)cancel();};
function openReference(html,onCancel=null){closeModal();openModal(()=>html);modal.classList.add('reference-fullscreen');referenceModalCancel=onCancel;}
function catalogImage(row,size=32,extra=''){const src=row&&AETHRIC_DATA.assets[row.sprite];return src?'<img class="pix '+extra+'" src="'+esc(src)+'" width="'+size+'" height="'+size+'" alt="">':'';}
function rewardIcon(type){return type==='orns'?runeGlyph(20):iconImg([type==='xp'?'scroll':'coin'],20);}
function resultLoot(row){return '<div class="reward-line '+esc(row.cls||'')+'">'+(row.key?catalogImage(Catalog.byKey[row.key],20):row.sprite?sprImg(row.sprite,20):'')+'<span>'+esc(row.label)+'</span></div>';}
function showBattleReceipt(receipt){
 const featured=receipt.loot.find(r=>r.key==='i_arena-token'),loot=receipt.loot.filter(r=>r!==featured);
 const html='<section class="reference-result" aria-label="Resultado da batalha"><span class="subject">'+esc(receipt.name)+'</span><h2>'+(receipt.boss?'Chefe derrotado!':'Vitória!')+'</h2><p class="intro">Aqui está o que você encontrou:</p>'+(featured?'<div class="featured-loot">'+catalogImage(Catalog.byKey[featured.key],52)+'<span>'+esc(featured.label)+'</span></div>':'')+'<div class="rewards">'+[['xp',receipt.xp,'XP'],['gold',receipt.gold,'ouro'],['orns',receipt.orns,'orns']].map(([type,n,label])=>'<div class="reward-line">'+rewardIcon(type)+fmt(n)+' '+label+'</div>').join('')+loot.map(resultLoot).join('')+'</div>'+(receipt.levels.length?'<p class="fine">'+receipt.levels.map(esc).join(' · ')+'</p>':'')+'<button class="btn reference-confirm" data-act="resultcontinue">Continuar</button></section>';
 openReference(html);cmdEl.inert=true;cmdEl.hidden=true;
}
ACT.resultcontinue=()=>{closeModal();resolveCmd(1);};
function previewEncounter(m){
 return new Promise(resolve=>{
  const row=Catalog.byKey[m.key],known=S.codex[m.key],drops=(row?.drops||[]).map(k=>known?.drops?.[k]?catalogImage(Catalog.byKey[k],28):'<span>???</span>').join('');
  let complete=false;const finish=result=>{if(complete)return;complete=true;referenceModalCancel=null;closeModal();resolve(result);};
  ACT.encounterfight=()=>finish(true);ACT.encountercancel=()=>finish(false);
  ACT.encountercodex=()=>{const r=Catalog.byKey[m.key];finish(false);openPanel('codex');if(r)openModal(discoveryDetails,r);};
  openReference('<section class="reference-result encounter-result" aria-label="Encontro"><span class="eyebrow">'+(m.boss?'CHEFE':'MONSTRO')+'</span><h2>'+esc(row?.name||MON[m.key]?.n||'Encontro')+'</h2><p class="subject">Nível '+m.lv+'</p>'+catalogImage(row,100,'encounter-sprite')+'<button class="btn reference-confirm" data-act="encounterfight">Batalha</button><p class="subject">Drops</p><div class="drops">'+(drops||'???')+'</div><button class="ibtn" data-act="encountercodex">'+mainMenuIcon('codex')+' Codex</button><p class="fine">'+(S.hp>0?'Você está pronto para a batalha.':'Recupere sua saúde antes de lutar.')+'</p><button class="rclose reference-close" data-act="encountercancel" aria-label="Fechar encontro">✕</button></section>',()=>finish(false));
 });
}
const referenceMapBattle=startMapBattle;startMapBattle=async m=>{
 if(busy||!S||cur!=='world')return;busy=true;H.path=[];H.goal=null;
 let accepted=false;try{accepted=await previewEncounter(m);}finally{busy=false;}
 if(accepted&&S&&cur==='world')return referenceMapBattle(m);
};

const CodexSections=[
 ['basics','Informações básicas e tutoriais','Acesse informações básicas e tutoriais para sua aventura.','codex'],
 ['advanced','Tópicos avançados','Atributos, qualidade de equipamentos e especializações.','skills'],
 ['activities','Modos de jogo e atividades','Veja informações sobre masmorras, arena e incursões.','dungeon'],
 ['monsters','Monstros','Veja informações sobre monstros que encontrou em batalha.','slime'],
 ['followers','Seguidores','Veja informações sobre seguidores que descobriu.','pet'],
 ['buildings','Construções','Veja informações sobre os tipos de construções.','town'],
 ['guilds','Guildas','Veja os modos e serviços disponíveis nesta aventura.','star'],
 ['statuses','Efeitos de status (buffs e debuffs)','Veja informações sobre efeitos de status em batalha.','skillnav'],
 ['raids','Incursões','Veja informações sobre incursões que encontrou em batalha.','boss'],
 ['npcs','NPCs','Veja informações sobre os NPCs da história.','hero']
];
function codexSectionIcon(key){const ids={monsters:'m_blue-slime',followers:'p_wolf',buildings:'buildings_blacksmith',raids:'b_goblin-lord',npcs:'m_bandit',activities:'buildings_bestiary',guilds:'i_arena-token',advanced:'i_grimoire'};if(Catalog.byKey[ids[key]])return catalogImage(Catalog.byKey[ids[key]],34);return key==='statuses'?uiIcon('skillnav',34):mainMenuIcon('codex');}
function discoveryDetails(row){
 if(!['monsters','bosses','raids'].includes(row.category)&&!MON[row.key])return factualDetails(row);
 const c=S.codex[row.key]||{},moves=row.skills||[],drops=row.drops||[];
 return '<div class="row l">'+catalogImage(row,64)+'<div><h3>'+esc(row.name)+'</h3><p class="fine">'+stars(row.tier)+' · Derrotados: '+fmt(c.kills||0)+'</p></div></div>'+box('Habilidades',moves.map(k=>'<p>'+esc(c.moves?.[k]?Catalog.byKey[k]?.name||k:'???')+'</p>').join('')||'<p class="fine">Nenhuma técnica catalogada.</p>')+box('Itens encontrados',drops.map(k=>'<div class="lrow">'+(c.drops?.[k]?catalogImage(Catalog.byKey[k],24)+esc(Catalog.byKey[k]?.name||k):'???')+'</div>').join('')||'<p class="fine">Nenhum item catalogado.</p>')+box('Afinidades observadas',Object.entries(c.el||{}).map(([k,v])=>'<p>'+esc((ELEM[k]||k)+': '+({norm:'Normal',Fraqueza:'Fraqueza',Resistiu:'Resistência',Imune:'Imunidade'}[v]||v))+'</p>').join('')||'<p class="fine">Observe ataques elementais em batalha.</p>')+btn('closemodal','Fechar');
}
function codexGuides(section){
 const guides={basics:[['Exploração','Toque no chão para caminhar. Toque em um monstro, examine o encontro e escolha Batalha. Cidades oferecem missões e serviços.'],['Combate por turnos','Escolha Atacar, Habilidades, Itens ou Defender. Seguidores agem automaticamente. A proteção absorve parte do dano durante os turnos ativos.'],['Classes e progressão','Você sobe de nível com experiência. Os tiers seguintes começam nos níveis 25, 50, 75, 100, 125, 150, 175, 200 e 225. Classes e habilidades são compradas e mantidas ao trocar de classe.'],['Ouro e orns','Ouro compra suprimentos e serviços. Orns desbloqueiam classes. Moedas de prêmio vêm da masmorra automática, uma adaptação offline.']],advanced:[['Equipamentos','Qualidade e nível alteram os atributos. Confira os conjuntos Padrão, Masmorra, PvP e Incursões antes de entrar em cada atividade.'],['Proteção e efeitos','Defesa reduz ataques físicos; resistência reduz magia. A proteção é um recurso distinto de HP. Antídoto e outros curativos removem efeitos específicos.'],['Seguidores e invocações','O seguidor usa suas próprias taxas de ação. Classes de invocador usam criaturas conjuradas em vez de um seguidor.'],['Melhorias','O ferreiro melhora equipamentos compatíveis até nível 10. Depois existem forjas Mestre, Demoníaca e dos Deuses. Acessórios não aceitam melhorias.']],activities:[['Masmorras','Enfrente andares consecutivos. HP, mana, efeitos e proteção são preservados entre os combates.'],['Arena','As partidas locais usam rivais gerados e não têm comunicação com outros jogadores.'],['Incursões','Chefes grandes preservam o dano entre tentativas. Itens e regras de invocação estão na tela da atividade.'],['Masmorra automática','Encontros de 30 segundos e até 8 horas por ausência. Ao atingir uma barreira, repete o melhor andar conquistado. Não concede experiência passiva.']],guilds:[['Serviços e atividades locais','Esta edição inclui atividades locais e construções. As progressões completas das guildas do original ainda não estão reproduzidas.']]};
 if(section==='statuses')return Object.entries(Rules.statuses).map(([key,d])=>box(esc(d.name),'<p>'+esc(key)+'</p>'+(d.dot?'<p>Dano periódico de HP. Não causa dano na primeira verificação após a aplicação.</p>':'')+(d.skip?'<p>Pode impedir uma ação.</p>':'')+(d.beneficial?'<p>Efeito benéfico.</p>':''))).join('');
 if(section==='npcs')return World.layout.npcs.map(n=>'<div class="card"><h3>'+esc(n.name)+'</h3><p>'+esc(POI[n.town]?.n||n.town)+'</p>'+btn('goto','Localizar','data-id="'+esc(n.town)+'"')+'</div>').join('');
 return (guides[section]||[]).map(([name,text])=>box(esc(name),'<p>'+esc(text)+'</p>')).join('');
}
const referenceCatalogGrid=catalogGrid;catalogGrid=()=>{
 if(P.kind==='codex'&&P.tab==='main'&&!encyclopedia.query)return '<p class="fine">Escolha uma categoria ou procure um nome no catálogo completo.</p>';
 return referenceCatalogGrid();
};
vCodex=()=>{
 if(P.tab==='guide'){const section=CodexSections.find(s=>s[0]===P.data);return '<h2 class="codex-heading">'+esc(section?.[1]||'Codex')+'</h2>'+codexGuides(P.data);}
 const home=P.tab==='main'&&!encyclopedia.query;
 return '<h2 class="codex-heading">Codex</h2>'+(home?'<p class="fine" style="padding:0 12px">Informações da aventura e descobertas feitas em batalha.</p><nav class="codex-home">'+CodexSections.map(([key,name,text,icon])=>'<button class="ccard" data-act="codexsection" data-k="'+key+'">'+codexSectionIcon(key)+'<b>'+esc(name)+'</b><span>'+esc(text)+'</span></button>').join('')+'</nav>':'')+'<div class="card" style="margin-top:16px"><span class="lbl">Catálogo completo</span><input id="catalog-search" type="search" placeholder="Procurar no Codex..." value="'+esc(encyclopedia.query)+'"><div class="tabs">'+Object.entries(CategoryLabels).map(([k,n])=>btn('catalogcat',n,'data-k="'+k+'"',encyclopedia.category===k?'sm sel':'sm')).join('')+'</div><div id="catalog-results">'+catalogGrid()+'</div></div>';
};
ACT.codexsection=el=>{const key=el.dataset.k;if(['monsters','followers','buildings','raids'].includes(key)){encyclopedia.category=key;encyclopedia.page=0;encyclopedia.query='';pushView('codex','catalog');}else pushView('codex','guide',key);};
ACT.catalogcat=el=>{encyclopedia.category=el.dataset.k;encyclopedia.page=0;encyclopedia.query='';P.tab='catalog';renderPanel();};
ACT.fact=el=>{const row=Catalog.byKey[el.dataset.key];if(row)openModal(MON[row.key]?discoveryDetails:factualDetails,row);};

/* Quest receipts preserve existing campaign counters and do not repeat payment. */
const referenceQuestTurnIn=questTurnIn;questTurnIn=()=>{
 const q=activeStory();if(!q||!questDone(q)||!atQuestNPC(q))return;
 const before=S.originalQuests.index,r=storyReward(q);referenceQuestTurnIn();if(S.originalQuests.index===before)return;
 openReference('<section class="reference-result" aria-label="Missão concluída"><p style="color:#d3cb65">Missão concluída</p><h2>'+esc(q.npc)+'</h2><p class="intro">'+esc(q.title)+'</p><p class="subject">Recompensas</p><div class="rewards">'+[['gold',r.gold,'ouro'],['orns',r.ess,'orns'],['xp',r.xp,'experiência']].map(([type,n,label])=>'<div class="reward-line">'+rewardIcon(type)+fmt(n)+' '+label+'</div>').join('')+'</div><button class="btn reference-confirm" data-act="closemodal">Continuar</button></section>');
};

// Introductory reward observed in the supplied screenshot. Existing saves keep their campaign.
const referenceNewState=newState;newState=(cls,name)=>{const s=referenceNewState(cls,name);s.questFlags.samsonIntroduction=false;return s;};
const referenceNpc=pNpc;pNpc=()=>{
 if(P.data==='loton'&&S.questFlags.samsonIntroduction===false)return '<div class="card"><h3>Escudeiro Samson</h3><p>Fale com Samson para começar a história principal.</p><p class="fine">100 ouro · 50 orns · 465 experiência</p>'+btn('samsonintro','Falar com Samson')+'</div>';
 return referenceNpc();
};
ACT.samsonintro=()=>{
 if(busy||S.questFlags.samsonIntroduction!==false||!atQuestNPC({town:'loton'}))return;
 const before=JSON.stringify(S);S.questFlags.samsonIntroduction=true;S.gold+=100;S.ess+=50;gainXp(465);
 if(!save()){S=Catalog.attachInv(JSON.parse(before));return;}
 renderPanel();openReference('<section class="reference-result" aria-label="Missão concluída"><p style="color:#d3cb65">Missão concluída</p><h2>Escudeiro Samson</h2><p class="intro">Fale com Samson para começar a história principal.</p><p class="subject">Recompensas</p><div class="rewards">'+[['gold',100,'ouro'],['orns',50,'orns'],['xp',465,'experiência']].map(([type,n,label])=>'<div class="reward-line">'+rewardIcon(type)+fmt(n)+' '+label+'</div>').join('')+'</div><button class="btn reference-confirm" data-act="closemodal">Continuar</button></section>');
};

/* Local soundtrack player. No official soundtrack is bundled or fetched. */
const GameAudio=(()=>{
 const preferenceKey='vaelmar-audio-v1',defaults={music:.35,effects:.5,enabled:false};let prefs={...defaults};
 try{const p=JSON.parse(localStorage.getItem(preferenceKey)||'{}');for(const key of ['music','effects'])if(Number.isFinite(p[key]))prefs[key]=clamp(p[key],0,1);prefs.enabled=p.enabled===true;}catch{}
 const player=new Audio();player.loop=true;player.volume=prefs.music;let dbPromise,scope='world',currentKey=null,url=null,generation=0,tracks=[],pendingScope=null;
 const scopes=()=>[['world','Exploração (padrão)'],['battle','Batalhas'],['boss','Chefes'],...World.layout.regions.map(r=>['region:'+r.key,World.regionNames[r.key]||r.name])];
 const persist=()=>{try{localStorage.setItem(preferenceKey,JSON.stringify(prefs));}catch{}};
 function database(){return dbPromise||=new Promise((resolve,reject)=>{if(!globalThis.indexedDB){reject(Error('Armazenamento de áudio indisponível.'));return;}const req=indexedDB.open('vaelmar-audio',1);req.onupgradeneeded=()=>req.result.createObjectStore('tracks',{keyPath:'key'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(Error('Não foi possível abrir o armazenamento de áudio.'));});}
 async function transaction(mode,operation){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('tracks',mode),req=operation(tx.objectStore('tracks'));let result;req.onsuccess=()=>result=req.result;tx.oncomplete=()=>resolve(result);tx.onerror=tx.onabort=()=>reject(Error('Não foi possível salvar a faixa. Verifique o espaço disponível.'));});}
 async function list(){const all=await transaction('readonly',store=>store.getAll());tracks=all.map(({key,name,size})=>({key,name,size}));return tracks;}
 function contextKey(){if(cur==='battle')return B?.foes?.some(f=>f.boss)?'boss':'battle';if(cur==='world'){const region='region:'+zoneAtPx(H.x,H.y);if(tracks.some(t=>t.key===region))return region;}return 'world';}
 async function sync(force=false){
  const key=contextKey();if(!force&&key===currentKey)return;currentKey=key;const run=++generation;player.pause();
  const found=tracks.find(t=>t.key===key)||tracks.find(t=>t.key===(key==='boss'?'battle':'world'))||tracks.find(t=>t.key==='world');
  if(url){URL.revokeObjectURL(url);url=null;}player.removeAttribute('src');if(!found||!prefs.enabled||document.hidden)return;
  try{const row=await transaction('readonly',store=>store.get(found.key));if(run!==generation||!row?.blob)return;url=URL.createObjectURL(row.blob);player.src=url;player.volume=prefs.music;await player.play();}catch{player.pause();}
 }
 async function importBlob(blob,name,key=pendingScope||scope){
  if(!scopes().some(([id])=>id===key))throw Error('Destino de áudio inválido.');if(!blob?.size||blob.size>8*1024*1024)throw Error('Escolha uma faixa de até 8 MB.');
  if(blob.type&&!/^(audio\/|application\/ogg)/.test(blob.type))throw Error('Escolha um arquivo de áudio.');
  const row={key,name:String(name||'Faixa local').slice(0,100),size:blob.size,blob};await transaction('readwrite',store=>store.put(row));await list();await sync(true);if(P.kind==='settings'&&!overlay.hidden)renderPanel();return true;
 }
 function choose(){pendingScope=scope;if(typeof VaelmarNative!=='undefined'&&typeof VaelmarNative.importMusic==='function'){VaelmarNative.importMusic();return;}const input=document.createElement('input');input.type='file';input.accept='audio/*,.ogg,.mp3,.wav,.m4a';input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{await importBlob(file,file.name,pendingScope);toast('Faixa salva para tocar offline.');}catch(error){toast(error.message);}};input.click();}
 async function remove(){await transaction('readwrite',store=>store.delete(scope));await list();await sync(true);renderPanel();}
 function volume(kind,value){prefs[kind]=clamp(Number(value)/100,0,1);player.volume=prefs.music;persist();}
 async function toggle(){prefs.enabled=!prefs.enabled;persist();await sync(true);renderPanel();}
 async function receiveTrack(data,mime,name){try{const bin=atob(data),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);await importBlob(new Blob([bytes],{type:mime}),name);toast('Faixa salva para tocar offline.');}catch(error){toast('Não foi possível importar a música: '+error.message);}}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)player.pause();else sync(true);});
 player.addEventListener('error',()=>{if(player.getAttribute('src'))toast('Não foi possível tocar esta faixa. Tente MP3, OGG ou WAV.');});
 setInterval(()=>{if(!document.hidden&&prefs.enabled)sync();},1500);
 list().then(()=>sync()).catch(()=>{});
 return {prefs,scopes,list,importBlob,choose,remove,volume,toggle,sync,receiveTrack,get scope(){return scope;},set scope(value){if(scopes().some(([id])=>id===value))scope=value;},get tracks(){return tracks;},get player(){return player;}};
})();
window.VaelmarAudio=GameAudio;
const referenceBeep=beep;beep=(f=440,d=.08,type='square',vol=.035,slide=0)=>referenceBeep(f,d,type,vol*GameAudio.prefs.effects,slide);
function audioSettings(){const a=GameAudio,t=a.tracks.find(t=>t.key===a.scope);return box('Áudio','<div class="audio-options"><label>Efeitos <input type="range" min="0" max="100" value="'+Math.round(a.prefs.effects*100)+'" data-audio-volume="effects" aria-label="Volume dos efeitos"></label><label>Música <input type="range" min="0" max="100" value="'+Math.round(a.prefs.music*100)+'" data-audio-volume="music" aria-label="Volume da música"></label><select id="audio-scope" aria-label="Destino da faixa">'+a.scopes().map(([id,name])=>'<option value="'+id+'" '+(id===a.scope?'selected':'')+'>'+esc(name)+'</option>').join('')+'</select><p>'+(t?esc(t.name):'Nenhuma faixa para este destino.')+'</p>'+btn('importmusic','Escolher arquivo de música')+btn('musicplay',a.prefs.enabled?'Pausar música':'Tocar música')+(t?btn('deletemusic','Remover faixa'):'')+'<p class="fine">As faixas escolhidas ficam neste aparelho. Você pode definir músicas diferentes para exploração, combates, chefes e regiões.</p></div>');}
const referenceSettings=vSettings;vSettings=()=>referenceSettings().replace('Versão 4.1','Versão 4.4')+audioSettings();VIEWS.settings.r=vSettings;
ACT.importmusic=()=>GameAudio.choose();ACT.musicplay=()=>GameAudio.toggle();ACT.deletemusic=()=>GameAudio.remove().catch(e=>toast(e.message));
overlay.addEventListener('input',e=>{if(e.target.dataset.audioVolume)GameAudio.volume(e.target.dataset.audioVolume,e.target.value);});
overlay.addEventListener('change',e=>{if(e.target.id==='audio-scope'){GameAudio.scope=e.target.value;renderPanel();}});

// Bind final implementations after all adapters have installed their behavior.
Object.assign(VIEWS,{classes:{r:vClasses},skills:{r:vSkills},pet:{r:vPet},codex:{r:vCodex},quests:{def:'story',r:vQuests},map:{r:vMap,after:drawMap},town:{def:'npc',r:vTown},origin:{def:'build',r:vOrigin},dungeon:{r:vDungeon},raid:{r:vRaid},gates:{r:vGates},events:{r:vEvents},inbox:{r:vInbox},helpview:{r:vHelpView}});
ACT.codex=()=>setView('codex');document.getElementById('btn-import-title').onclick=()=>ACT.importsave();
(async function bootV4(){try{await Promise.all([loadOfficialArt(),loadUiArt()]);initGlyphs();genWorld();const firstSprites=[...Catalog.data.classes.filter(c=>['0','1','2'].includes(c.id)),...Catalog.data.monsters.filter(c=>['Rat','Goblin'].includes(c.nameEn)),...Catalog.data.items.filter(c=>['Rusty Sword','Leather Jacket','Small Health Potion','Small Mana Potion'].includes(c.nameEn))];await Promise.all(firstSprites.map(row=>new Promise(resolve=>{const file=AETHRIC_DATA.assets[row.sprite],i=new Image();i.onload=i.onerror=resolve;i.src=file;})));initTitle();requestAnimationFrame(loop);$('#boot-status').hidden=true;$('#btn-start').disabled=false;window.AETHRIC_READY=true;}catch(error){$('#boot-error').hidden=false;$('#boot-error').textContent='Falha ao iniciar: '+error.message;console.error(error);}})();
