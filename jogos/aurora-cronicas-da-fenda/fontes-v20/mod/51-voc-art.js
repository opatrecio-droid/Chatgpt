/* ===== 51-voc-art.js ===== */
/* 51-voc-art: arte da v20 — peças novas de equipamento, montarias e enfeites da cidade,
   mais a sincronização dos enfeites com a lista de estáticos do render. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const A = G.A, R = G.R, Wd = G.W, Pix = A.Pix, sh = A.shade, mix = A.mix;
  const INK = '#1a1422', GOLD = '#e2b659';

  /* ---------- ícones das peças novas (16×16) ---------- */
  A.GEAR_DRAW = {
    elmo: (p) => { const c = '#aab4c4'; p.ell(8, 7, 5.5, 5, c); p.rect(3, 7, 11, 6, c); p.rect(5, 9, 7, 3, '#2a3040'); p.rect(7, 8, 2, 6, c); p.row(5, 10, 3, '#dfe6ee'); p.col(13, 6, 12, sh(c, 0.72)); p.rect(7, 0, 2, 3, '#c8473d'); p.row(3, 13, 13, sh(c, 0.6)); },
    luvas: (p) => { const c = '#aab4c4'; p.rect(5, 2, 7, 7, c); p.rect(3, 5, 2, 4, c); for (const x of [6, 8, 10]) p.col(x, 2, 5, sh(c, 0.72)); p.row(5, 11, 2, '#dfe6ee'); p.rect(4, 9, 9, 5, '#7a5232'); p.row(4, 12, 9, GOLD); p.row(4, 12, 13, '#4a3220'); p.col(12, 10, 13, '#5a3a22'); },
    botas: (p) => { const c = '#8a5e38'; p.rect(5, 1, 5, 10, c); p.rect(5, 10, 9, 4, c); p.row(5, 9, 1, '#c8975c'); p.col(9, 2, 9, sh(c, 0.72)); p.row(5, 13, 14, '#3a2416'); p.row(10, 13, 10, '#c8975c'); p.rect(5, 4, 5, 1, GOLD); p.set(12, 12, sh(c, 0.72)); },
    cinto: (p) => { const c = '#7a5232'; p.rect(1, 6, 14, 4, c); p.row(1, 14, 6, '#a8743c'); p.row(1, 14, 9, '#4a3220'); p.rect(5, 4, 6, 8, GOLD); p.rect(6, 5, 4, 6, '#b08c40'); p.rect(7, 7, 3, 2, c); p.set(6, 5, '#fff0a0'); p.set(2, 8, '#3a2416'); p.set(13, 8, '#3a2416'); },
    sinete: (p) => { p.ell(8, 10, 4.5, 4.5, GOLD); p.ell(8, 10, 2.6, 2.6, '#00000000'); p.row(5, 10, 14, '#b08c40'); p.tri(8, 0, 4, 5, 12, 5, '#e0506a'); p.rect(6, 4, 4, 2, '#e0506a'); p.set(7, 2, '#ffffff'); p.set(9, 4, '#9c2c44'); },
  };

  /* ---------- montarias (30×22, dois quadros de passo) ---------- */
  const MPAL = { cavalo: ['#b8845a', '#7a5232', '#f0e0c8'], javali: ['#7a5a44', '#4a3426', '#d8c0a0'], lobo: ['#b8c0cc', '#7a8494', '#f4f7fb'], cervo: ['#c8b8e8', '#8a78b8', '#ffffff'], grifo: ['#d8b070', '#9a7238', '#fff4d8'], draco: ['#b84a3a', '#742a20', '#ffb070'] };
  const mountPix = (k, f) => {
    const p = new Pix(30, 22), [b, s, l] = MPAL[k] || MPAL.cavalo;
    /* cauda e asas ficam atrás do corpo */
    if (k === 'grifo') { p.tri(9, 9, 18, 9, 7, 0, l); p.tri(11, 9, 17, 9, 10, 3, b); }
    if (k === 'draco') { p.tri(9, 9, 18, 9, 6, 0, s); p.line(13, 9, 8, 1, l); p.line(6, 11, 1, 8, b); p.line(6, 12, 1, 9, s); p.set(0, 8, l); }
    if (k === 'lobo') { p.line(6, 10, 2, 6, b); p.line(6, 11, 2, 7, s); p.line(5, 10, 1, 6, b); }
    if (k === 'cavalo' || k === 'cervo' || k === 'grifo') { p.line(6, 10, 3, 15, s); p.line(5, 10, 2, 15, s); }
    if (k === 'javali') { p.line(6, 10, 4, 8, s); p.set(3, 8, s); }
    p.ell(14, 11, 8, 4.6, b); p.row(8, 20, 14, s); p.row(9, 18, 7, l);
    const lg = f ? [[8, 0], [11, 1], [17, 0], [20, 1]] : [[8, 1], [11, 0], [17, 1], [20, 0]];
    for (const [x, o] of lg) { p.rect(x, 14, 2, 6 - o, s); p.rect(x, 19 - o, 2, 1, '#2a2030'); }
    if (k === 'javali') { p.ell(22, 11, 4, 3.6, b); p.rect(25, 12, 3, 2, s); p.set(27, 11, '#ffffff'); p.set(27, 10, '#ffffff'); p.set(23, 10, INK); p.rect(11, 5, 7, 2, s); p.tri(20, 6, 22, 8, 19, 8, s); }
    else if (k === 'lobo') { p.ell(22, 9, 3.6, 3.2, b); p.rect(24, 10, 4, 2, b); p.set(28, 10, INK); p.tri(20, 3, 22, 7, 19, 7, b); p.tri(23, 3, 25, 7, 22, 7, b); p.set(23, 9, INK); p.row(24, 27, 12, l); }
    else {
      p.rect(19, 4, 4, 8, b); p.ell(23, 5, 3.6, 2.6, b); p.rect(25, 5, 3, 2, b); p.set(24, 4, INK); p.col(19, 3, 9, s);
      if (k === 'cervo') { p.line(22, 3, 20, 0, l); p.line(22, 3, 25, 0, l); p.set(19, 1, l); p.set(26, 1, l); p.set(11, 10, l); p.set(15, 12, l); p.set(17, 9, l); }
      if (k === 'grifo') { p.tri(27, 5, 30, 6, 27, 8, GOLD); p.col(20, 2, 4, l); }
      if (k === 'draco') { p.tri(22, 3, 24, 0, 24, 3, l); p.tri(27, 6, 30, 7, 27, 8, s); p.set(21, 2, l); }
    }
    p.rect(12, 6, 6, 3, '#8a2c2c'); p.row(12, 17, 6, GOLD); p.rect(14, 9, 2, 3, '#5a3a22'); p.set(15, 12, GOLD);
    return p.outline(INK);
  };
  const msheets = new Map();
  A.mountSheet = (k) => { if (!MPAL[k]) return null; let s = msheets.get(k); if (s) return s; s = A.mk(60, 22); const x = s.getContext('2d'); x.drawImage(mountPix(k, 0).canvas(), 0, 0); x.drawImage(mountPix(k, 1).canvas(), 30, 0); msheets.set(k, s); return s; };

  /* ---------- enfeites da cidade (v = nível − 1: mais ouro e detalhe) ---------- */
  const P = A.PROPS, ST = '#aaa69d', STL = '#d0ccc4', STD = '#7d7870';
  P.dec_canteiro = (v) => { const p = new Pix(24, 14), cs = [['#f07aa8', '#ffd84a'], ['#8ab8ff', '#ffffff'], ['#ff9a5a', '#f07aa8'], ['#c9a4ff', '#ffd84a']][v % 4]; p.rect(1, 7, 22, 6, '#a8a49c'); p.row(1, 22, 7, STL); p.row(1, 22, 12, STD); p.rect(2, 5, 20, 3, '#4f9a3c'); p.row(2, 21, 5, '#7ac85a'); for (let i = 0; i < 7; i++) { p.rect(3 + i * 3, 2 + (i % 2), 2, 2, cs[i % 2]); p.set(3 + i * 3, 3 + (i % 2), '#fff4c0'); p.set(4 + i * 3, 4 + (i % 2), '#3a7a2c'); } return p.outline(INK); };
  P.dec_estandarte = (v) => { const p = new Pix(14, 42), c = '#3b5fa8'; p.rect(2, 3, 2, 38, '#6a4a2e'); p.col(2, 3, 40, '#8a6a44'); p.ell(3, 2, 2, 2, GOLD); p.rect(1, 40, 4, 2, '#4a3220'); p.rect(4, 5, 9, 18, c); p.tri(4, 23, 13, 23, 8.5, 29, c); p.col(12, 6, 22, sh(c, 0.7)); p.row(4, 12, 5, GOLD); p.ell(8.5, 12, 2.6, 2.6, '#fff0a0'); p.ell(9.5, 11, 2.2, 2.2, c); p.set(6, 18, '#d8c8ff'); if (v >= 1) { p.col(4, 6, 22, GOLD); p.row(5, 11, 22, GOLD); } if (v >= 2) { p.set(8, 25, '#ff6b81'); p.set(9, 25, '#ff6b81'); p.ell(3, 2, 2.6, 2.6, '#fff0a0'); } return p.outline(INK); };
  P.dec_jardim = (v) => { const p = new Pix(20, 15); p.rect(1, 8, 18, 6, '#8a5e38'); p.row(1, 18, 8, '#c8975c'); p.row(1, 18, 13, '#5a3a22'); for (let i = 0; i < 4; i++) p.col(1 + i * 6, 9, 13, '#6b4424'); p.rect(2, 6, 16, 3, '#5a3a26'); for (let i = 0; i < 5; i++) { const x = 3 + i * 3; p.col(x, 2 + (i % 2), 6, '#3f8a3c'); p.set(x - 1, 3 + (i % 2), '#6ac85a'); p.set(x + 1, 2 + (i % 2), '#6ac85a'); p.set(x, 1 + (i % 2), v >= 1 && i % 2 ? '#d8a8ff' : '#9be08a'); } if (v >= 2) { p.set(4, 1, '#ffd84a'); p.set(13, 1, '#ffd84a'); } return p.outline(INK); };
  P.dec_fonte = (v) => { const p = new Pix(44, 54); p.rect(20, 14, 4, 5, ST); p.col(20, 14, 18, STL); p.rect(18, 18, 8, 2, ST); p.ell(17, 8, 6.5, 6.5, '#fff4d0'); p.ell(20, 6.5, 5.6, 5.6, '#00000000'); p.ell(29, 10, 4.5, 4.5, '#c9a4ff'); p.ell(31, 9, 3.8, 3.8, '#00000000'); p.set(13, 5, '#ffffff'); p.set(26, 8, '#ffffff'); if (v >= 1) { p.rect(18, 19, 8, 1, GOLD); p.set(22, 2, '#fff0a0'); } if (v >= 2) { p.set(8, 3, '#fff0a0'); p.set(36, 4, '#e6d0ff'); p.set(22, 0, '#ffffff'); } return p.outline(INK); };
  P.dec_poco = (v) => { const p = new Pix(24, 32); p.rect(3, 18, 18, 11, ST); p.row(3, 20, 18, STL); p.col(20, 19, 28, STD); for (let i = 0; i < 4; i++) { p.set(6 + i * 4, 22, STD); p.set(4 + i * 4, 25, STD); } p.rect(5, 16, 14, 3, '#3f90d2'); p.row(6, 12, 16, '#8ad0ff'); p.rect(4, 5, 2, 13, '#7a5232'); p.rect(18, 5, 2, 13, '#7a5232'); p.tri(12, -1, 1, 7, 23, 7, '#3b5fa8'); p.row(2, 22, 7, '#2a4480'); p.line(12, 0, 3, 6, '#6a8ad8'); p.col(12, 7, 13, '#c8b890'); p.rect(11, 13, 3, 3, '#8a5e38'); p.set(9, 17, GOLD); p.set(15, 17, '#fff0a0'); if (v >= 1) { p.row(2, 22, 7, GOLD); p.set(12, -1 + 1, GOLD); } if (v >= 2) { p.set(7, 15, '#fff0a0'); p.set(17, 14, '#fff0a0'); p.set(12, 3, '#fff0a0'); } return p.outline(INK); };
  P.dec_estatua = (v) => { const p = new Pix(24, 46), c = v >= 2 ? '#d8b860' : ST, cl = v >= 2 ? '#fff0a0' : STL, cd = v >= 2 ? '#a08030' : STD; p.rect(3, 36, 18, 8, '#8f8b86'); p.row(3, 20, 36, '#b4b0a9'); p.row(3, 20, 43, '#5c5852'); p.rect(5, 32, 14, 4, '#9a968f'); p.row(5, 18, 32, '#c4c0b8'); if (v >= 1) p.rect(8, 38, 8, 3, GOLD);
    p.rect(9, 24, 3, 8, c); p.rect(13, 24, 3, 8, c); p.rect(8, 14, 9, 11, c); p.col(16, 15, 24, cd); p.col(8, 15, 22, cl); p.ell(12.5, 10, 3.6, 3.8, c); p.set(11, 9, cd); p.set(14, 9, cd); p.rect(9, 6, 7, 2, cd); p.rect(17, 12, 2, 8, c); p.line(18, 12, 20, 2, cl); p.line(19, 12, 21, 2, c); p.rect(16, 11, 5, 1, cd); p.rect(4, 15, 4, 8, cd); p.rect(5, 16, 2, 6, cl); return p.outline(INK); };
  P.dec_relogio = (v) => { const p = new Pix(24, 22); p.rect(5, 15, 14, 5, '#8f8b86'); p.row(5, 18, 15, '#b4b0a9'); p.row(5, 18, 19, '#5c5852'); p.ell(12, 11, 10, 5, ST); p.ell(12, 10, 9, 4, '#e8e2d2'); for (let a = 0; a < 12; a++) { const t = (a / 12) * 6.283; p.set(12 + Math.cos(t) * 7.5, 10 + Math.sin(t) * 3.2, a % 3 ? STD : '#5a4a3a'); } p.tri(12, 10, 12, 2, 17, 10, v >= 1 ? GOLD : '#8a6a44'); p.line(12, 10, 12, 2, v >= 1 ? '#fff0a0' : '#c8975c'); p.line(12, 10, 7, 11, '#6a6a72'); if (v >= 2) { p.set(4, 10, '#ff6b81'); p.set(20, 10, '#ff6b81'); p.set(12, 13, '#ff6b81'); } return p.outline(INK); };
  P.dec_lampiao = (v) => { const p = new Pix(14, 38); p.rect(6, 12, 2, 23, '#3a3a44'); p.rect(4, 34, 6, 2, '#2c2c34'); p.rect(3, 36, 8, 2, '#2c2c34'); p.rect(2, 3, 10, 9, '#3a3a44'); p.rect(3, 4, 8, 7, '#b06ae8'); p.tri(7, 4, 4, 8, 10, 8, '#e6c0ff'); p.tri(4, 8, 10, 8, 7, 11, '#d090ff'); p.set(7, 6, '#ffffff'); p.rect(4, 1, 6, 2, '#2c2c34'); p.set(6, 0, '#2c2c34'); p.set(7, 0, '#2c2c34'); if (v >= 1) { p.row(2, 11, 3, GOLD); p.row(2, 11, 11, GOLD); } if (v >= 2) { p.set(1, 6, '#e6c0ff'); p.set(12, 7, '#e6c0ff'); p.set(7, 14, GOLD); } return p.outline(INK); };
  P.dec_altar = (v) => { const p = new Pix(26, 28); p.rect(2, 20, 22, 6, '#8f8b86'); p.row(2, 23, 20, '#b4b0a9'); p.row(2, 23, 25, '#5c5852'); p.rect(4, 12, 18, 8, '#eef0f6'); p.row(4, 21, 12, '#ffffff'); p.col(21, 13, 19, '#b8bece'); p.rect(4, 17, 18, 3, '#cfd4e2'); p.rect(11, 13, 4, 6, '#3b5fa8'); p.set(12, 15, '#fff0a0'); p.set(13, 15, '#fff0a0'); for (const [x, hh] of [[6, 5], [9, 3], [16, 4], [19, 6]]) { p.rect(x, 12 - hh, 2, hh, '#f8f0d8'); p.set(x, 11 - hh, '#ffb050'); p.set(x + 1, 10 - hh, '#fff0a0'); } if (v >= 1) { p.row(4, 21, 16, GOLD); p.rect(12, 6, 2, 6, GOLD); p.rect(10, 8, 6, 2, GOLD); } if (v >= 2) { p.set(13, 4, '#ffffff'); p.set(3, 9, '#fff0a0'); p.set(23, 8, '#fff0a0'); } return p.outline(INK); };
  P.dec_arco = (v) => { const p = new Pix(54, 58), c = '#9a968f', l = '#c4c0b8', d = '#67635f';
    for (const x of [2, 44]) { p.rect(x, 18, 8, 38, c); p.col(x, 18, 55, l); p.col(x + 7, 18, 55, d); for (let r = 0; r < 6; r++) p.row(x + 1, x + 6, 24 + r * 6, d); p.rect(x - 1, 54, 10, 3, d); p.rect(x - 1, 16, 10, 3, l); }
    for (let a = 0; a <= 40; a++) { const t = Math.PI * (a / 40), x = 27 - Math.cos(t) * 21, y = 20 - Math.sin(t) * 15; p.ell(x, y, 4, 4, a % 5 < 3 ? c : l); }
    for (let a = 0; a <= 40; a++) { const t = Math.PI * (a / 40); p.set(27 - Math.cos(t) * 17, 20 - Math.sin(t) * 11, d); }
    p.rect(23, 1, 8, 7, '#3b5fa8'); p.tri(23, 8, 31, 8, 27, 12, '#3b5fa8'); p.rect(25, 3, 4, 3, GOLD); p.set(26, 2, GOLD); p.set(28, 2, GOLD);
    if (v >= 1) { for (const x of [2, 44]) { p.rect(x, 22, 8, 2, GOLD); p.rect(x, 48, 8, 2, GOLD); } }
    if (v >= 2) { p.rect(5, 26, 2, 12, '#c8473d'); p.rect(47, 26, 2, 12, '#c8473d'); p.set(27, 0, '#fff0a0'); p.set(14, 6, '#fff0a0'); p.set(40, 6, '#fff0a0'); }
    return p.outline(INK); };
  void mix;

  /* ---------- enfeites comprados entram na lista de estáticos (e os lampiões iluminam) ---------- */
  R.syncDecor = () => {
    if (!R.statics || !G.S) return;
    R.statics = R.statics.filter((s) => !s.dec);
    Wd.lamps = Wd.lamps.filter((l) => !l.dec);
    for (const d of G.DECOR) {
      const lv = G.decorLvl(d.id); if (!lv) continue;
      d.spots.forEach((sp, i) => { const s = A.prop(d.spr, d.id === 'canteiros' ? i : lv - 1); if (s) R.statics.push({ y: sp[1], x: sp[0], s, kind: 'decor', dec: 1 }); if (d.light) Wd.lamps.push({ x: sp[0], y: sp[1], dec: 1 }); });
    }
    R.statics.sort((a, b) => a.y - b.y);
  };
  G.on('decor', R.syncDecor); G.on('start', R.syncDecor);
})();

;
