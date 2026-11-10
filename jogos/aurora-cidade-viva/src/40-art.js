/* 40-art: motor de pixel art procedural — buffer de pixels, cores, personagens e ícones.
   Toda a arte do jogo é desenhada por código: um estilo só, leve e nítido em qualquer tela. */
'use strict';
(function () {
  const A = (G.A = {});
  /* ---------- cores ---------- */
  const cache = new Map();
  const C = (A.C = (hex) => {
    let v = cache.get(hex); if (v !== undefined) return v;
    const h = hex.replace('#', '');
    const r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16), a = h.length >= 8 ? parseInt(h.substr(6, 2), 16) : 255;
    v = ((a << 24) | (b << 16) | (g << 8) | r) >>> 0; cache.set(hex, v); return v;
  });
  const hx = (n) => (n < 16 ? '0' : '') + Math.round(G.clamp(n, 0, 255)).toString(16);
  const rgb = (hex) => { const h = hex.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; };
  const sh = (A.shade = (hex, f) => { const c = rgb(hex); return '#' + hx(c[0] * f) + hx(c[1] * f) + hx(c[2] * f); });
  const mix = (A.mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return '#' + hx(x[0] + (y[0] - x[0]) * t) + hx(x[1] + (y[1] - x[1]) * t) + hx(x[2] + (y[2] - x[2]) * t); });
  A.rgb = rgb;
  const INK = '#1a1422';

  /* ---------- buffer de pixels ---------- */
  class Pix {
    constructor(w, h) { this.w = w; this.h = h; this.d = new Uint32Array(w * h); }
    set(x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = typeof c === 'number' ? c : C(c); }
    get(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.d[y * this.w + x] : 0; }
    rect(x, y, w, h, c) { c = C(c); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
    row(x0, x1, y, c) { c = C(c); for (let x = x0; x <= x1; x++) this.set(x, y, c); }
    col(x, y0, y1, c) { c = C(c); for (let y = y0; y <= y1; y++) this.set(x, y, c); }
    ell(cx, cy, rx, ry, c) { c = C(c); for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) this.set(x, y, c); } }
    line(x0, y0, x1, y1, c) { c = C(c); x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (;;) { this.set(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
    thick(x0, y0, x1, y1, c) { this.line(x0, y0, x1, y1, c); this.line(x0 + 1, y0, x1 + 1, y1, c); }
    tri(x0, y0, x1, y1, x2, y2, c) { c = C(c); const minx = Math.floor(Math.min(x0, x1, x2)), maxx = Math.ceil(Math.max(x0, x1, x2)), miny = Math.floor(Math.min(y0, y1, y2)), maxy = Math.ceil(Math.max(y0, y1, y2)); const e = (ax, ay, bx, by, px, py) => (bx - ax) * (py - ay) - (by - ay) * (px - ax); for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) { const a = e(x0, y0, x1, y1, x + 0.5, y + 0.5), b = e(x1, y1, x2, y2, x + 0.5, y + 0.5), d = e(x2, y2, x0, y0, x + 0.5, y + 0.5); if ((a >= 0 && b >= 0 && d >= 0) || (a <= 0 && b <= 0 && d <= 0)) this.set(x, y, c); } }
    /* contorno escuro em volta da silhueta */
    outline(c) { c = C(c || INK); const w = this.w, h = this.h, src = this.d, out = new Uint32Array(src); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (src[y * w + x] >>> 24) continue; if ((x > 0 && src[y * w + x - 1] >>> 24 > 128) || (x < w - 1 && src[y * w + x + 1] >>> 24 > 128) || (y > 0 && src[(y - 1) * w + x] >>> 24 > 128) || (y < h - 1 && src[(y + 1) * w + x] >>> 24 > 128)) out[y * w + x] = c; } this.d = out; return this; }
    /* copia outro buffer por cima (com espelho opcional) */
    blit(p, ox, oy, flip) { for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) { const v = p.d[y * p.w + x]; if (v >>> 24) this.set(ox + (flip ? p.w - 1 - x : x), oy + y, v); } }
    canvas() { const cv = document.createElement('canvas'); cv.width = this.w; cv.height = this.h; const x = cv.getContext('2d'); const im = x.createImageData(this.w, this.h); new Uint32Array(im.data.buffer).set(this.d); x.putImageData(im, 0, 0); return cv; }
  }
  A.Pix = Pix;
  A.mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; return cv; };

  /* ---------- personagens ---------- */
  const SKIN = ['#f8d6b4', '#f0c098', '#dda070', '#b87c4c', '#8c5c38'];
  const HAIR = ['#2a2630', '#4a3226', '#7a4e2c', '#a8582c', '#e0b050', '#e8e0d0', '#c83c34', '#4a7ad0', '#e87aa8', '#3aa890'];
  A.SKIN = SKIN; A.HAIR = HAIR;
  const TUNICS = ['#b85c4c', '#5c7fb8', '#6a9a5a', '#c89a4a', '#8a6ab0', '#4a8a8a', '#a86a8a', '#7a7a8a', '#c47a3a', '#5a6a9a'];

  /* arma na mão da frente; pose 0 parado, 1 preparo, 2 golpe, 3 retorno. (hx,hy) = mão */
  const drawWeapon = (p, type, pose, hxp, hyp, col) => {
    const steel = col || '#c8d0dc', dark = sh(steel, 0.62), lite = mix(steel, '#ffffff', 0.55), wood = '#8a5a34', gold = '#e2b659';
    const blade = (len, ang) => { const dx = Math.cos(ang), dy = -Math.sin(ang); for (let i = 2; i <= len; i++) { const x = hxp + dx * i, y = hyp + dy * i; p.set(x, y, i === len ? lite : steel); p.set(x + (Math.abs(dx) > Math.abs(dy) ? 0 : 1), y + (Math.abs(dx) > Math.abs(dy) ? 1 : 0), i > len - 2 ? steel : dark); } return [hxp + dx * len, hyp + dy * len]; };
    const AN = [1.12, 2.3, 0.05, -0.55][pose];
    switch (type) {
      case 'espada': blade(10, AN); p.set(hxp + Math.cos(AN + 1.57), hyp - Math.sin(AN + 1.57), gold); p.set(hxp - Math.cos(AN + 1.57), hyp + Math.sin(AN + 1.57), gold); p.set(hxp + Math.cos(AN), hyp - Math.sin(AN), gold); break;
      case 'adaga': blade(5, [1.2, 2.2, 0.1, -0.4][pose]); p.set(hxp, hyp - 1, gold); break;
      case 'lanca': { const a = [1.35, 1.9, 0.08, -0.2][pose]; const dx = Math.cos(a), dy = -Math.sin(a); for (let i = -5; i <= 11; i++) p.set(hxp + dx * i, hyp + dy * i, wood); const tx = hxp + dx * 12, ty = hyp + dy * 12; p.set(tx, ty, steel); p.set(tx + dx, ty + dy, steel); p.set(tx + dx * 2, ty + dy * 2, lite); p.set(tx - dy, ty + dx, steel); p.set(tx + dy, ty - dx, dark); break; }
      case 'martelo': { const a = [1.15, 2.35, 0.2, -0.45][pose]; const dx = Math.cos(a), dy = -Math.sin(a); for (let i = -1; i <= 8; i++) p.set(hxp + dx * i, hyp + dy * i, wood); const cx = hxp + dx * 9, cy = hyp + dy * 9; p.rect(Math.round(cx) - 2, Math.round(cy) - 2, 5, 4, steel); p.rect(Math.round(cx) - 2, Math.round(cy) + 1, 5, 1, dark); p.set(Math.round(cx) - 1, Math.round(cy) - 2, lite); p.set(Math.round(cx), Math.round(cy) - 2, lite); p.set(Math.round(cx), Math.round(cy), gold); break; }
      case 'arco': { const pull = pose === 1 ? 3 : 0; const bx = hxp + 2; for (let i = -6; i <= 6; i++) { const cx = bx + Math.round(2.2 - (i * i) / 14); p.set(cx, hyp - 1 + i, wood); if (Math.abs(i) < 6) p.set(cx - 1, hyp - 1 + i, '#00000000'); } p.set(bx + 2, hyp - 1, gold); if (pull) { p.line(bx, hyp - 7, bx - pull, hyp - 1, '#e8e0d0'); p.line(bx - pull, hyp - 1, bx, hyp + 5, '#e8e0d0'); p.row(bx - pull, bx + 4, hyp - 1, '#d8c8a0'); } else p.col(bx, hyp - 7, hyp + 5, '#e8e0d0'); break; }
      case 'cajado': { const a = [1.5, 1.75, 0.9, 1.2][pose]; const dx = Math.cos(a), dy = -Math.sin(a); for (let i = -7; i <= 9; i++) p.set(hxp + dx * i, hyp + dy * i, wood); const cx = Math.round(hxp + dx * 11), cy = Math.round(hyp + dy * 11); const orb = col || '#b58cf2'; p.ell(cx + 0.5, cy + 0.5, 2.2, 2.2, orb); p.set(cx, cy - 1, mix(orb, '#ffffff', 0.7)); p.set(cx - 1, cy, mix(orb, '#ffffff', 0.4)); p.set(cx + 1, cy + 1, sh(orb, 0.7)); break; }
      case 'ferramenta': { const a = [1.3, 2.1, 0.3, 0.3][pose]; const dx = Math.cos(a), dy = -Math.sin(a); for (let i = 0; i <= 7; i++) p.set(hxp + dx * i, hyp + dy * i, wood); const cx = Math.round(hxp + dx * 8), cy = Math.round(hyp + dy * 8); p.rect(cx - 1, cy - 1, 4, 2, steel); p.set(cx + 2, cy, dark); break; }
    }
  };

  /* desenha um quadro de personagem num buffer 26×30. o = aparência */
  const FRAMES = ['idle0', 'idle1', 'walk0', 'walk1', 'walk2', 'walk3', 'atk0', 'atk1', 'atk2'];
  A.CHAR_W = 26; A.CHAR_H = 30;
  const drawChar = (o, frame) => {
    const p = new Pix(26, 30);
    const skin = SKIN[o.skin % SKIN.length], skinS = sh(skin, 0.82);
    const hair = o.hairC || HAIR[o.hair % HAIR.length], hairS = sh(hair, 0.72), hairL = mix(hair, '#ffffff', 0.3);
    const body = o.body, bodyS = sh(body, 0.74), bodyL = mix(body, '#ffffff', 0.25);
    const legs = o.legs || '#4a4458', boots = o.boots || '#3a2c28', trim = o.trim || '#e2b659';
    const walk = frame.startsWith('walk') ? +frame[4] : -1, atk = frame.startsWith('atk') ? +frame[3] : -1;
    const bob = frame === 'idle1' || walk === 1 || walk === 3 ? 1 : 0;
    const lean = atk === 0 ? -1 : atk === 1 ? 1 : 0;
    const X = 8 + lean, Y = 4 + bob;         // canto do corpo
    /* capa (atrás de tudo) */
    if (o.cape) { const c = o.cape, cs = sh(c, 0.72); const sway = walk >= 0 ? (walk % 2) : 0; p.rect(X - 1, Y + 11, 4, 9 - bob, c); p.rect(X - 2 - sway, Y + 14, 2, 6 - bob, c); p.col(X - 1, Y + 12, Y + 19 - bob, cs); p.row(X - 2 - sway, X + 2, Y + 20 - bob, cs); }
    /* pernas */
    const ly = 22, robe = o.robe;
    if (!robe) {
      let l0 = 0, l1 = 0, s0 = 0, s1 = 0;
      if (walk === 0) { s0 = 1; s1 = -1; l1 = 1; } else if (walk === 2) { s0 = -1; s1 = 1; l0 = 1; }
      if (atk === 1) { s0 = 1; s1 = -1; }
      p.rect(X + 1 + s1, ly, 3, 4 - l1, legs); p.rect(X + 1 + s1, ly + 4 - l1, 3, 2, boots);
      p.rect(X + 5 + s0, ly, 3, 4 - l0, legs); p.rect(X + 5 + s0, ly + 4 - l0, 3, 2, boots);
      p.col(X + 3 + s1, ly, ly + 3 - l1, sh(legs, 0.75));
    }
    /* braço de trás */
    p.rect(X, Y + 12, 2, 5, bodyS); p.rect(X, Y + 16, 2, 1, skinS);
    /* tronco */
    if (robe) {
      const sw = walk >= 0 ? (walk % 2) : 0;
      p.rect(X + 1, Y + 11, 7, 6, body); p.rect(X, Y + 16, 9, 6 - bob + (bob ? 1 : 0), body); p.rect(X - 1 + sw, Y + 20, 11 - sw, 4 - bob, body);
      p.col(X + 7, Y + 11, Y + 23 - bob, bodyS); p.col(X + 8, Y + 17, Y + 23 - bob, bodyS); p.row(X - 1 + sw, X + 9, Y + 23 - bob, bodyS);
      p.col(X + 4, Y + 12, Y + 22 - bob, trim); p.row(X + 1, X + 7, Y + 16, sh(trim, 0.8));
      p.rect(X + 1, 26, 3, 1, boots); p.rect(X + 5, 26, 3, 1, boots);
    } else {
      p.rect(X + 1, Y + 11, 7, 7, body); p.col(X + 7, Y + 11, Y + 17, bodyS); p.row(X + 1, X + 6, Y + 11, bodyL);
      p.row(X + 1, X + 7, Y + 17 - 0, o.belt || '#5a3a26'); p.set(X + 4, Y + 17, trim);
      if (o.armor) { p.row(X + 1, X + 7, Y + 12, mix(body, '#ffffff', 0.45)); p.set(X + 4, Y + 14, trim); p.col(X + 2, Y + 13, Y + 16, bodyS); p.col(X + 6, Y + 13, Y + 16, bodyS); p.rect(X, Y + 11, 2, 2, bodyL); p.rect(X + 7, Y + 11, 2, 2, bodyL); }
      if (o.apron) { p.rect(X + 2, Y + 13, 5, 6, o.apron); p.col(X + 6, Y + 13, Y + 18, sh(o.apron, 0.82)); }
      if (o.scarf) { p.row(X + 1, X + 7, Y + 11, o.scarf); p.rect(X + 1, Y + 12, 2, 3, o.scarf); }
    }
    /* cabeça */
    const hx0 = X - 1, hy0 = Y;
    p.rect(hx0 + 1, hy0 + 1, 9, 10, skin); p.rect(hx0, hy0 + 2, 11, 8, skin);
    p.col(hx0 + 10, hy0 + 3, hy0 + 9, skinS); p.row(hx0 + 2, hx0 + 9, hy0 + 10, skinS);
    /* olhos (olhando para a direita) */
    const eye = o.eye || '#2a2030';
    p.rect(hx0 + 5, hy0 + 5, 1, 2, eye); p.rect(hx0 + 8, hy0 + 5, 1, 2, eye);
    p.set(hx0 + 5, hy0 + 5, mix(eye, '#ffffff', 0.25));
    p.set(hx0 + 7, hy0 + 8, sh(skin, 0.7));
    if (o.blush) { p.set(hx0 + 4, hy0 + 7, '#f0a0a0'); p.set(hx0 + 9, hy0 + 7, '#f0a0a0'); }
    if (o.beard) { p.rect(hx0 + 4, hy0 + 8, 6, 3, o.beard); p.set(hx0 + 7, hy0 + 8, skin); }
    if (o.mask) { p.rect(hx0 + 2, hy0 + 7, 9, 4, o.mask); p.row(hx0 + 2, hx0 + 10, hy0 + 10, sh(o.mask, 0.75)); }
    /* cabelo / chapéu */
    const st = o.style;
    if (o.head === 'helm') {
      const m = o.metal || '#aab4c4', ms = sh(m, 0.7), ml = mix(m, '#ffffff', 0.5);
      p.rect(hx0 + 1, hy0, 9, 5, m); p.rect(hx0, hy0 + 1, 11, 4, m); p.rect(hx0, hy0 + 5, 4, 5, m); p.row(hx0 + 1, hx0 + 9, hy0, ml); p.col(hx0 + 10, hy0 + 1, hy0 + 4, ms); p.row(hx0 + 4, hx0 + 10, hy0 + 4, ms);
      p.rect(hx0 + 4, hy0 - 2, 3, 2, o.plume || '#c83c34'); p.rect(hx0 + 2, hy0 - 1, 2, 2, o.plume || '#c83c34'); p.set(hx0 + 1, hy0 + 0, o.plume || '#c83c34');
    } else if (o.head === 'wizard') {
      const m = o.hat || body, ms = sh(m, 0.72);
      p.rect(hx0 - 1, hy0 + 2, 13, 2, m); p.row(hx0 - 1, hx0 + 11, hy0 + 3, ms);
      p.rect(hx0 + 1, hy0 - 1, 9, 3, m); p.rect(hx0 + 2, hy0 - 3, 6, 2, m); p.rect(hx0 + 2, hy0 - 5, 4, 2, m); p.rect(hx0 + 1, hy0 - 6, 3, 1, m);
      p.col(hx0 + 9, hy0 - 1, hy0 + 1, ms); p.col(hx0 + 7, hy0 - 3, hy0 - 2, ms); p.row(hx0 + 1, hx0 + 9, hy0 + 1, trim);
      p.rect(hx0, hy0 + 4, 2, 5, hair); p.set(hx0 + 2, hy0 + 4, hair);
    } else if (o.head === 'hood') {
      const m = o.hoodC || body, ms = sh(m, 0.72);
      p.rect(hx0 + 1, hy0 - 1, 9, 5, m); p.rect(hx0, hy0, 11, 4, m); p.rect(hx0, hy0 + 4, 3, 7, m); p.set(hx0 + 10, hy0 + 4, m); p.set(hx0 + 3, hy0 + 4, m);
      p.row(hx0 + 2, hx0 + 8, hy0 - 1, mix(m, '#ffffff', 0.25)); p.col(hx0, hy0 + 2, hy0 + 10, ms); p.row(hx0 + 4, hx0 + 9, hy0 + 3, ms);
    } else if (o.head === 'straw') {
      const m = '#e0c070', ms = '#b08c40';
      p.rect(hx0 - 2, hy0 + 2, 15, 2, m); p.row(hx0 - 2, hx0 + 12, hy0 + 3, ms); p.rect(hx0 + 1, hy0 - 1, 9, 3, m); p.row(hx0 + 1, hx0 + 9, hy0 + 1, '#a8562b');
      p.rect(hx0, hy0 + 4, 2, 4, hair);
    } else if (o.head === 'cap') {
      const m = o.hat || '#8a4a2e'; p.rect(hx0 + 1, hy0, 9, 3, m); p.rect(hx0, hy0 + 1, 11, 2, m); p.row(hx0 + 6, hx0 + 12, hy0 + 3, sh(m, 0.75)); p.rect(hx0, hy0 + 3, 2, 5, hair);
    } else {
      /* cabelos */
      p.rect(hx0 + 1, hy0, 9, 3, hair); p.rect(hx0, hy0 + 1, 11, 3, hair); p.rect(hx0, hy0 + 4, 3, 4, hair);
      p.row(hx0 + 2, hx0 + 7, hy0, hairL); p.set(hx0 + 3, hy0 + 1, hairL);
      p.set(hx0 + 10, hy0 + 4, hair); p.set(hx0 + 4, hy0 + 4, hair); p.set(hx0 + 6, hy0 + 4, hair);
      if (st === 1) { p.set(hx0 + 2, hy0 - 1, hair); p.set(hx0 + 5, hy0 - 1, hair); p.set(hx0 + 8, hy0 - 1, hair); p.set(hx0 - 1, hy0 + 3, hair); }     // espetado
      if (st === 2) { p.rect(hx0 - 1, hy0 + 3, 3, 9, hair); p.col(hx0 - 1, hy0 + 5, hy0 + 11, hairS); p.rect(hx0 + 1, hy0 + 8, 1, 4, hair); }                    // longo
      if (st === 3) { p.rect(hx0 - 2, hy0 + 3, 2, 2, hair); p.rect(hx0 - 3, hy0 + 5, 2, 6, hair); p.col(hx0 - 3, hy0 + 7, hy0 + 10, hairS); p.set(hx0 - 1, hy0 + 3, trim); } // rabo de cavalo
      if (st === 4) { p.rect(hx0, hy0 + 4, 4, 6, hair); p.rect(hx0 + 8, hy0 + 4, 3, 2, hair); p.col(hx0, hy0 + 6, hy0 + 9, hairS); }                              // chanel
      if (st === 5) { p.rect(hx0 + 1, hy0 - 1, 8, 1, hair); p.ell(hx0 + 1, hy0 + 0.5, 2, 2, hair); p.ell(hx0 + 9.5, hy0 + 0.5, 2, 2, hair); }                    // coques
      p.col(hx0, hy0 + 2, hy0 + 7, hairS);
      if (o.circlet) { p.row(hx0 + 1, hx0 + 9, hy0 + 2, o.circlet); p.set(hx0 + 6, hy0 + 3, '#7fd8ff'); }
      if (o.ears) { p.set(hx0 - 1, hy0 + 5, skin); p.set(hx0 - 2, hy0 + 4, skin); }
    }
    /* braço da frente + arma */
    let ax = X + 7, ay = Y + 12, hxp, hyp;
    if (atk === 0) { hxp = ax - 1; hyp = ay - 1; p.rect(ax - 1, ay - 1, 2, 3, body); p.rect(hxp, hyp - 1, 2, 2, skin); }
    else if (atk === 1) { hxp = ax + 3; hyp = ay + 2; p.rect(ax, ay + 1, 4, 2, body); p.rect(hxp, hyp - 1, 2, 2, skin); }
    else if (atk === 2) { hxp = ax + 2; hyp = ay + 4; p.rect(ax, ay + 1, 2, 4, body); p.rect(hxp - 1, hyp, 2, 2, skin); }
    else { hxp = ax + 1; hyp = ay + 4; p.rect(ax, ay, 2, 5, body); p.col(ax + 1, ay, ay + 3, bodyS); p.rect(ax, ay + 4, 2, 2, skin); }
    if (o.shield) { const s = o.shield, ss = sh(s, 0.7); p.rect(X - 2, Y + 12, 5, 7, s); p.rect(X - 1, Y + 19, 3, 1, s); p.col(X - 2, Y + 12, Y + 18, ss); p.rect(X - 1, Y + 14, 3, 2, trim); p.set(X, Y + 13, trim); p.set(X, Y + 16, trim); }
    if (o.weapon) drawWeapon(p, o.weapon, atk < 0 ? 0 : atk + 1, hxp, hyp, o.wcol);
    if (o.weapon === 'adaga' && atk !== 0) drawWeapon(p, 'adaga', atk === 1 ? 2 : 3, X + 1, Y + 16, o.wcol);
    if (o.carry) { const cc = o.carry; p.rect(X + 6, Y + 12, 6, 5, cc); p.row(X + 6, X + 11, Y + 12, mix(cc, '#ffffff', 0.3)); p.col(X + 11, Y + 12, Y + 16, sh(cc, 0.7)); p.row(X + 6, X + 11, Y + 14, sh(cc, 0.8)); }
    return p.outline(INK);
  };

  /* aparência a partir do herói / morador */
  A.heroLook = (h) => {
    const c = G.CLASSES[h.cls], L = h.look || { skin: 0, hair: 0, style: 0 };
    const wt = h.gear && h.gear.arma ? h.gear.arma : null, at = h.gear && h.gear.armadura ? h.gear.armadura.tier : 0;
    const wcol = wt ? (wt.tier <= 1 ? '#c8d0dc' : G.tierColor(wt.tier)) : '#9aa0a8';
    const o = { skin: L.skin, hair: L.hair, style: L.style, weapon: c.w, wcol, trim: h.rank >= 5 ? '#fff0a0' : h.rank >= 3 ? '#e2b659' : '#d8c8a0', blush: L.seed % 3 === 0 };
    const tint = (base) => (at >= 2 ? mix(base, G.tierColor(at), 0.28) : base);
    switch (h.cls) {
      case 'esp': o.body = tint('#c8473d'); o.legs = '#4a4458'; o.scarf = h.rank >= 1 ? '#f0e0c0' : null; o.cape = h.rank >= 2 ? '#8a2c2c' : null; break;
      case 'cav': o.body = tint('#9aa8bc'); o.armor = 1; o.head = 'helm'; o.metal = tint('#aab4c4'); o.plume = '#3b6fd0'; o.legs = '#6a7488'; o.boots = '#4a5262'; o.shield = '#3b5fa8'; o.cape = h.rank >= 2 ? '#3b5fa8' : null; break;
      case 'arq': o.body = tint('#4f9d5d'); o.head = L.style % 2 ? 'hood' : null; o.hoodC = '#3c7a48'; o.legs = '#6a5a44'; o.belt = '#5a3a26'; o.cape = h.rank >= 2 ? '#2f6a3c' : null; break;
      case 'mag': o.body = tint('#7a52b8'); o.robe = 1; o.head = 'wizard'; o.hat = tint('#5c3a94'); o.wcol = wt && wt.tier > 1 ? G.tierColor(wt.tier) : '#b58cf2'; break;
      case 'pal': o.body = tint('#e8e0d0'); o.armor = 1; o.legs = '#b8b0a0'; o.boots = '#8a7a5a'; o.cape = '#d9b24a'; o.circlet = '#e2b659'; o.trim = '#e2b659'; break;
      case 'lad': o.body = tint('#4b5563'); o.head = 'hood'; o.hoodC = '#3a424e'; o.mask = '#2c323c'; o.legs = '#353c48'; o.scarf = '#7a3a4a'; break;
    }
    o.key = 'h|' + h.cls + '|' + L.skin + '|' + L.hair + '|' + L.style + '|' + (wt ? wt.tier : 0) + '|' + at + '|' + (h.rank >= 5 ? 3 : h.rank >= 3 ? 2 : h.rank >= 2 ? 1 : h.rank >= 1 ? 0.5 : 0) + '|' + (L.seed % 3 === 0);
    return o;
  };
  const JOB_LOOK = {
    'Ferreiro': { apron: '#5a4a44', beard: '#4a3226', body: '#8a5a4a' }, 'Aprendiz de forja': { apron: '#6a5a50', body: '#a86a4a' },
    'Padeira': { apron: '#f4ece0', head: 'cap', hat: '#f4ece0', body: '#d89a5a' }, 'Moleiro': { apron: '#e8dcc8', body: '#b89a6a', beard: '#8a7a6a' },
    'Taverneiro': { apron: '#e8dcc8', body: '#a8562b', beard: '#7a4e2c' }, 'Ajudante': { apron: '#f4ece0', body: '#c47a5a' },
    'Curandeira': { body: '#f0f0f0', robe: 1, trim: '#3c8a78', head: 'cap', hat: '#f0f0f0' }, 'Alquimista': { body: '#684282', robe: 1, trim: '#9be08a', beard: '#c8c0b8' },
    'Fazendeiro': { head: 'straw', body: '#7d9c4d', legs: '#6a5a44' }, 'Lavradora': { head: 'straw', body: '#c8a04a', legs: '#6a5a44' }, 'Caçador de animais': { head: 'hood', hoodC: '#6a5a3a', body: '#8a6a4a' },
    'Lenhador': { body: '#b04832', beard: '#4a3226', legs: '#4a5a6a', tool: 1 }, 'Minerador': { head: 'cap', hat: '#c8a04a', body: '#6b6b7a', tool: 1 },
    'Escrivã': { body: '#3b5fa8', robe: 1, trim: '#e2b659' }, 'Cobradora': { body: '#5a4a8a', robe: 1, trim: '#e2b659' },
    'Mestre da Guilda': { body: '#7a4a2e', cape: '#8a2c2c', beard: '#8a7a6a' }, 'Instrutor': { body: '#6a6a72', armor: 1, beard: '#2a2630' },
    'Guarda': { body: '#7a88a0', armor: 1, head: 'helm', metal: '#8a96aa', plume: '#3b5fa8', weapon: 'lanca' }, 'Guarda do portão': { body: '#7a88a0', armor: 1, head: 'helm', metal: '#8a96aa', plume: '#c83c34', weapon: 'lanca', shield: '#3b5fa8' },
    'Mercadora': { body: '#c97b32', scarf: '#f0e0c0' }, 'Feirante': { body: '#6fa86b', apron: '#e8dcc8' }, 'Caixa': { body: '#8fb2c9' }, 'Atendente': { body: '#8a6ab0', apron: '#f4ece0' }, 'Aprendiz': { body: '#b9a06a' },
  };
  A.npcLook = (n) => {
    const s = G.hash(n.name + n.look), j = JOB_LOOK[n.job] || {};
    const o = Object.assign({ skin: s % 5, hair: (s >>> 3) % 7, style: (s >>> 6) % 6, body: TUNICS[(s >>> 9) % TUNICS.length], legs: ['#4a4458', '#5a4a3a', '#3a4a5a', '#6a5a44'][(s >>> 12) % 4], blush: (s >>> 14) % 2 === 0 }, j);
    if (j.tool) o.weapon = 'ferramenta';
    o.key = 'n|' + n.name + '|' + n.job + '|' + (n.carry || '');
    if (n.carry) { o.carry = n.carry === 'trigo' ? '#e2b84a' : n.carry === 'madeira' ? '#9a6a3c' : '#9aa0a8'; o.weapon = null; }
    return o;
  };
  const sprites = new Map();
  /* devolve folha de quadros: canvas com FRAMES lado a lado + índice */
  A.charSheet = (o) => {
    let s = sprites.get(o.key); if (s) return s;
    const cv = A.mk(26 * FRAMES.length, 30), x = cv.getContext('2d');
    FRAMES.forEach((f, i) => x.drawImage(drawChar(o, f).canvas(), i * 26, 0));
    s = { cv, idx: {} }; FRAMES.forEach((f, i) => (s.idx[f] = i));
    if (sprites.size > 400) sprites.clear();
    sprites.set(o.key, s); return s;
  };
  A.charFrame = (e, t) => {
    if (e.swing > 0.2) return 'atk0'; if (e.swing > 0.1) return 'atk1'; if (e.swing > 0) return 'atk2';
    if (e.moving) return 'walk' + (Math.floor(t * 8 + (e._ph || 0)) % 4);
    return 'idle' + (Math.floor(t * 2 + (e._ph || 0)) % 2);
  };
  /* retrato (cabeça e ombros) como data URL para o HUD */
  const portraits = new Map();
  A.portrait = (o) => {
    let u = portraits.get(o.key); if (u) return u;
    const sheet = A.charSheet(o); const cv = A.mk(22, 22), x = cv.getContext('2d');
    x.drawImage(sheet.cv, 2, 0, 22, 22, 0, 0, 22, 22);
    u = cv.toDataURL(); if (portraits.size > 300) portraits.clear(); portraits.set(o.key, u); return u;
  };
  A.fullBody = (o) => { const k = 'fb|' + o.key; let u = portraits.get(k); if (u) return u; const sheet = A.charSheet(o); const cv = A.mk(26, 30); cv.getContext('2d').drawImage(sheet.cv, 0, 0, 26, 30, 0, 0, 26, 30); u = cv.toDataURL(); portraits.set(k, u); return u; };

  /* ---------- ícones de recursos (16×16) ---------- */
  const resIcon = (shape, c) => {
    const p = new Pix(16, 16), [b, s, l] = c;
    switch (shape) {
      case 'log': p.rect(2, 6, 11, 5, b); p.row(2, 12, 6, l); p.row(2, 12, 10, s); p.ell(13, 8.5, 2, 2.6, l); p.ell(13, 8.5, 1, 1.4, s); p.set(5, 8, s); p.set(8, 8, s); break;
      case 'rock': p.ell(8, 10, 6, 4, b); p.ell(6, 8, 3.5, 3, b); p.ell(6, 8, 2, 1.5, l); p.row(5, 12, 12, s); p.set(10, 9, s); p.set(11, 10, s); break;
      case 'ore': p.ell(8, 10, 6, 4, b); p.ell(6, 8, 3.5, 3, b); p.row(5, 12, 12, s); p.rect(5, 7, 2, 2, l); p.rect(9, 9, 2, 2, l); p.set(11, 11, l); p.set(7, 11, l); break;
      case 'wheat': p.line(8, 14, 8, 6, s); p.line(5, 14, 4, 7, s); p.line(11, 14, 12, 7, s); for (const [x, y] of [[8, 3], [4, 4], [12, 4]]) { p.rect(x - 1, y, 3, 4, b); p.set(x, y - 1, l); p.set(x, y + 1, l); } break;
      case 'leaf': p.ell(8, 8, 5, 4, b); p.tri(8, 4, 13, 2, 12, 8, b); p.line(4, 12, 12, 4, s); p.set(6, 7, l); p.set(7, 6, l); p.set(9, 9, s); p.line(3, 13, 5, 11, s); break;
      case 'meal': p.ell(8, 11, 6, 2.5, '#e8e0d0'); p.row(3, 12, 12, '#b8b0a0'); p.ell(8, 8.5, 4.5, 3, b); p.ell(7, 7.5, 2.5, 1.2, l); p.row(5, 11, 10, s); p.set(10, 5, '#ffffff'); p.set(9, 3, '#ffffff'); break;
      case 'potion': p.rect(6, 2, 4, 2, '#c8a070'); p.rect(7, 4, 2, 2, '#d8e8f0'); p.ell(8, 10, 4.5, 4.5, b); p.ell(6.5, 8.5, 1.5, 1.5, l); p.row(5, 10, 13, s); p.row(5, 10, 6, '#d8e8f0'); break;
      case 'blob': p.ell(8, 10, 5.5, 4, b); p.ell(8, 7, 3.5, 3, b); p.ell(6.5, 7, 1.5, 1.5, l); p.row(4, 11, 13, s); p.set(11, 9, s); break;
      case 'pelt': p.rect(4, 4, 8, 8, b); p.rect(2, 4, 2, 2, b); p.rect(12, 4, 2, 2, b); p.rect(2, 11, 2, 2, b); p.rect(12, 11, 2, 2, b); p.rect(6, 12, 4, 2, b); p.row(4, 11, 4, l); p.col(11, 5, 11, s); p.row(5, 10, 11, s); p.set(7, 7, s); p.set(9, 9, s); break;
      case 'fang': p.tri(5, 3, 11, 3, 8, 14, b); p.row(5, 11, 3, s); p.col(9, 5, 10, s); p.col(7, 4, 8, l); break;
      case 'bone': p.line(4, 12, 12, 4, b); p.line(5, 12, 12, 5, b); p.ell(3.5, 12.5, 1.6, 1.6, b); p.ell(5, 13.5, 1.4, 1.4, b); p.ell(12.5, 3.5, 1.6, 1.6, b); p.ell(13.5, 5, 1.4, 1.4, b); p.set(8, 9, s); p.set(6, 11, s); p.set(11, 4, l); break;
      case 'pile': p.tri(2, 13, 14, 13, 8, 5, b); p.row(2, 14, 13, s); p.set(8, 6, l); p.set(7, 8, l); p.set(9, 10, s); p.set(5, 11, l); p.set(11, 12, s); break;
      case 'rune': p.rect(4, 3, 8, 11, b); p.rect(5, 2, 6, 1, b); p.col(11, 4, 13, s); p.row(4, 11, 13, s); p.col(8, 5, 11, l); p.line(8, 5, 10, 7, l); p.line(8, 9, 6, 7, l); break;
      case 'scale': p.ell(8, 8, 5, 5.5, b); p.row(6, 10, 3, l); p.col(12, 6, 10, s); p.row(5, 10, 13, s); p.line(5, 8, 8, 11, s); p.line(8, 11, 11, 8, s); p.set(7, 5, l); break;
      case 'crystal': p.tri(8, 1, 3, 8, 13, 8, b); p.tri(3, 8, 13, 8, 8, 15, b); p.tri(8, 1, 8, 15, 13, 8, s); p.line(8, 1, 8, 14, l); p.set(6, 6, l); p.set(5, 8, l); break;
      case 'orb': p.ell(8, 8, 5.5, 5.5, b); p.ell(6, 6, 2, 2, l); p.set(5, 5, '#ffffff'); p.row(6, 10, 13, s); p.col(13, 7, 9, s); break;
      case 'flame': p.tri(8, 1, 3, 11, 13, 11, b); p.ell(8, 11, 5, 3.5, b); p.tri(8, 6, 6, 12, 10, 12, l); p.ell(8, 12, 2, 1.5, l); p.set(4, 12, s); p.set(12, 12, s); break;
      case 'emblem': p.rect(3, 2, 10, 8, b); p.tri(3, 10, 13, 10, 8, 15, b); p.row(3, 12, 2, l); p.col(12, 3, 9, s); p.rect(7, 4, 2, 6, l); p.rect(5, 6, 6, 2, l); break;
    }
    return p.outline(INK);
  };
  A.resURL = {};
  A.buildIcons = () => {
    let css = '';
    for (const id in G.RES) { const d = G.RES[id]; const u = resIcon(d.shape, d.c).canvas().toDataURL(); A.resURL[id] = u; css += '.ri-' + id + '{background-image:url(' + u + ')}'; }
    /* peças de equipamento por tipo */
    const gear = (type) => { const p = new Pix(16, 16); const st = '#c8d0dc'; if (G.GEAR[type].kind === 'arma') drawWeapon(p, type, type === 'arco' ? 0 : 0, type === 'arco' ? 5 : type === 'cajado' ? 8 : type === 'lanca' ? 7 : 7, type === 'arco' ? 8 : type === 'adaga' ? 11 : type === 'cajado' ? 10 : 12, st); else if (type === 'anel') { p.ell(8, 9, 4.5, 4.5, '#e2b659'); p.ell(8, 9, 2.5, 2.5, '#00000000'); p.rect(6, 2, 4, 4, '#5bb3f0'); p.set(7, 3, '#ffffff'); p.line(4, 3, 6, 5, '#b08c40'); p.line(12, 3, 10, 5, '#b08c40'); } else { const c = type === 'pesada' ? '#aab4c4' : type === 'media' ? '#a8744a' : '#7a52b8'; p.rect(4, 3, 8, 11, c); p.rect(2, 3, 2, 4, c); p.rect(12, 3, 2, 4, c); p.rect(6, 3, 4, 2, '#00000000'); p.col(11, 4, 13, sh(c, 0.72)); p.row(4, 11, 13, sh(c, 0.72)); p.row(4, 5, 3, mix(c, '#ffffff', 0.4)); p.col(8, 6, 12, '#e2b659'); } return p.outline(INK).canvas().toDataURL(); };
    for (const t of G.GEAR_IDS) css += '.gi-' + t + '{background-image:url(' + gear(t) + ')}';
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  };
  A.drawChar = drawChar; A.FRAMES = FRAMES;
})();
