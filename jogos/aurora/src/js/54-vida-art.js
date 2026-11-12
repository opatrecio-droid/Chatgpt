/* 54-vida-art: v27 (B1) — a arte e o desenho da vida da cidade (a simulação mora em 3M-vida.js). Tudo é gerado por código, no mesmo estilo e na mesma escala
   do resto (contorno de 1 px, 16 px por tile): ferramentas (machado, picareta, enxada, foice, regador), cargas (tora, pedra, minério, saco, cesto), árvores que
   balançam, caem, viram toras e tocos e brotam de novo, rochas que racham e quebram, canteiros que crescem em quatro estágios, pilhas que enchem com as
   entregas e os efeitos de cada golpe. No Modo leve o vai-e-vem continua, só as partículas somem. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const A = G.A, R = G.R, Pix = A.Pix, Wd = G.W, TS = 16, INK = '#1a1422';
  const sh = A.shade, mix = A.mix, L = G.life, LF = G.LIFE;
  const dpr = () => Math.min(3, window.devicePixelRatio || 1);
  const low = () => !!(G.S && G.S.opts.lowFx);

  /* ================= ferramentas e cargas ================= */
  const WOOD = '#9a6a3c', WOODS = '#6a4426', WOODL = '#c08a58', STEEL = '#bcc6d4', STEELD = '#7e8898', EDGE = '#f4f8fc';
  const toolCache = new Map();
  /* 28×28, pegada no centro (14,14). ang em graus: 0 aponta para a frente, 90 para cima. d = ao longo do cabo, o = de lado */
  const toolCv = (kind, ang) => {
    const key = kind + '|' + ang; let c = toolCache.get(key); if (c) return c;
    const p = new Pix(28, 28), a = ang * Math.PI / 180, dx = Math.cos(a), dy = -Math.sin(a), nx = -dy, ny = dx;
    const at = (d, o) => [14 + dx * d + nx * o, 14 + dy * d + ny * o];
    const ln = (d0, o0, d1, o1, col) => { const u = at(d0, o0), v = at(d1, o1); p.line(u[0], u[1], v[0], v[1], col); };
    const th = (d0, o0, d1, o1, col, col2) => { ln(d0, o0, d1, o1, col); ln(d0, o0 + 1, d1, o1 + 1, col2 || col); };
    const quad = (pts, col) => { const q = pts.map(([d, o]) => at(d, o)); p.tri(q[0][0], q[0][1], q[1][0], q[1][1], q[2][0], q[2][1], col); p.tri(q[0][0], q[0][1], q[2][0], q[2][1], q[3][0], q[3][1], col); };
    switch (kind) {
      case 'axe':
        th(-2, 0, 12, 0, WOOD, WOODS); ln(-2, 0, 11, 0, WOODL);
        quad([[9, -2], [12.5, -2], [12.5, 0.5], [9, 0.5]], STEELD);
        quad([[9, 0.5], [12.5, 0.5], [13.5, 6], [8.2, 5]], STEEL); ln(8.2, 5, 13.5, 6, EDGE); ln(9.5, 1.2, 9.5, 4, EDGE); ln(11, 1, 11.4, 4, mix(STEEL, STEELD, 0.5));
        break;
      case 'pick':
        th(-2, 0, 12, 0, WOOD, WOODS); ln(-2, 0, 11, 0, WOODL);
        quad([[10.5, -1.5], [13, -1.5], [13, 1.9], [10.5, 1.9]], STEELD);
        th(11, -8, 12, 0, STEEL, STEELD); th(12, 0, 11, 8, STEEL, STEELD); th(11, -8, 11.4, -4, STEEL, STEELD); ln(10.6, -8.8, 10.6, -7.6, EDGE); ln(10.6, 8.8, 10.6, 7.6, EDGE); ln(11.6, -6, 12.4, 0, EDGE);
        break;
      case 'hoe':
        th(-2, 0, 12, 0, WOOD, WOODS); ln(-2, 0, 11, 0, WOODL);
        quad([[11, 0], [12.5, 0], [14.5, 5], [11.5, 5]], STEEL); ln(11.5, 5, 14.5, 5, EDGE); ln(12, 1, 12, 4, STEELD);
        break;
      case 'scythe':
        th(-4, 0, 14, 0, WOODL, WOOD); p.set(...at(7, -1.5), WOODS); p.set(...at(2, -1.5), WOODS);
        for (let i = 0; i <= 12; i++) { const t = i / 12, d = -4 - 1.5 * Math.sin(t * 2.4), o = -0.5 - t * 11, u = at(d, o); p.set(u[0], u[1], t > 0.85 ? EDGE : STEEL); const v = at(d + 1, o); p.set(v[0], v[1], STEELD); if (i % 2 === 0) { const w = at(d - 1, o); p.set(w[0], w[1], EDGE); } }
        break;
      case 'can':
        quad([[-2, -3.5], [4.5, -3.5], [4.5, 3], [-2, 3]], '#8d9bb0'); ln(-2, -3.5, 4.5, -3.5, '#c3cddb'); ln(4.5, -3.5, 4.5, 3, '#6a7690'); ln(-2, 3, 4.5, 3, '#6a7690');
        th(4.5, 1.5, 9.5, 3.5, '#8d9bb0', '#6a7690'); ln(-2, -3.5, -5, -1, '#6a7690'); ln(-5, -1, -2, 2, '#6a7690');
        break;
    }
    c = p.outline(INK).canvas(); toolCache.set(key, c); return c;
  };
  const itemCache = new Map();
  /* cargas: cada uma é um Pix pequeno; w×h e a âncora são devolvidos para o desenho */
  const itemCv = (kind, v) => {
    const key = kind + '|' + (v | 0); let c = itemCache.get(key); if (c) return c;
    let p;
    switch (kind) {
      case 'log': p = new Pix(18, 8); p.rect(2, 1, 14, 6, WOOD); p.row(2, 15, 1, WOODL); p.row(2, 15, 2, mix(WOOD, '#ffffff', 0.1)); p.row(2, 15, 6, WOODS); p.col(15, 2, 6, WOODS); p.set(6, 3, WOODS); p.set(9, 4, WOODS); p.set(12, 3, WOODS);
        p.ell(3, 4, 2.4, 3, '#e4bc84'); p.ell(3, 4, 1.2, 1.6, '#b88a50'); p.set(3, 4, '#8a5e38'); p.col(16, 2, 5, '#6a4426'); break;
      case 'stone': p = new Pix(11, 9); p.ell(5.5, 5, 4.8, 3.8, '#a5aab2'); p.ell(4.5, 3.6, 3, 2, '#d0d6dc'); p.row(2, 8, 7, '#6a707a'); p.col(9, 3, 6, '#7e848e'); p.set(6, 4, '#7e848e'); p.set(7, 5, '#7e848e'); p.set(3, 3, '#f0f4f8'); break;
      case 'ore': p = new Pix(11, 9); p.ell(5.5, 5, 4.8, 3.8, '#8a8696'); p.ell(4.5, 3.6, 3, 2, '#aeaabc'); p.row(2, 8, 7, '#5a5666'); p.col(9, 3, 6, '#6a6676'); p.rect(3, 4, 2, 2, '#ff9a3c'); p.set(3, 4, '#ffe08a'); p.rect(7, 3, 2, 2, '#ff9a3c'); p.set(7, 3, '#ffe08a'); p.set(6, 6, '#ffb44a'); break;
      case 'sack': p = new Pix(12, 13); p.ell(6, 8, 5.2, 4.8, '#c9a465'); p.ell(5, 7, 3.6, 3.2, '#ddbe80'); p.rect(3, 2, 6, 3, '#c9a465'); p.row(3, 8, 4, '#7a5a2a'); p.rect(4, 0, 4, 2, '#b08a4a'); p.row(5, 7, 4, '#c8473d'); p.col(10, 6, 11, '#a88848'); p.row(3, 9, 11, '#a88848'); p.set(4, 8, '#a88848'); p.set(7, 6, '#a88848'); p.set(8, 9, '#a88848');
        p.set(4, 2, '#e8c450'); p.set(7, 1, '#e8c450'); break;
      case 'basket': p = new Pix(13, 9); p.rect(1, 3, 11, 6, '#b8884c'); p.row(1, 11, 3, '#d8a868'); p.row(1, 11, 6, '#8a6030'); p.col(11, 4, 8, '#8a6030'); for (let i = 0; i < 5; i++) p.set(2 + i * 2, 5 + (i % 2) * 2, '#8a6030');
        p.ell(6.5, 2.5, 5, 2.4, '#4f9a48'); p.ell(5, 1.6, 2.5, 1.5, '#7fd070'); p.set(8, 1, '#c070e0'); p.set(4, 2, '#c070e0'); p.set(9, 3, '#7fd070'); break;
    }
    c = { cv: p.outline(INK).canvas(), w: p.w, h: p.h }; itemCache.set(key, c); return c;
  };

  /* ================= árvores, rochas, canteiros ================= */
  const halve = (src) => {
    const w = src.w >> 1, h = src.h >> 1, p = new Pix(w, h), ink = A.C(INK);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let best = 0, bs = -1;
      for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const v = src.get(x * 2 + ox, y * 2 + oy); if (!(v >>> 24) || v === ink) continue; const s = 1 + ((v & 255) + ((v >> 8) & 255) * 1.4); if (s > bs) { bs = s; best = v; } }
      if (best) p.d[y * w + x] = best;
    }
    return p.outline(INK);
  };
  const young = {};
  const youngTree = (k, v) => { const key = k + '|' + (v & 3); if (young[key]) return young[key]; const pix = halve(A.PROPS[k](v & 3)); return (young[key] = { cv: pix.canvas(), w: pix.w, h: pix.h }); };
  let sapling = null;
  const saplingSp = (v) => {
    if (!sapling) sapling = [0, 1].map((i) => { const p = new Pix(12, 15); p.col(6, 7, 13, '#7a5232'); p.col(7, 8, 13, '#5a3a22'); p.rect(4, 13, 5, 1, '#6a4628');
      const g = i ? ['#63a83e', '#4b8a32', '#9ad65a'] : ['#5aa544', '#43853a', '#7ac65a'];
      p.ell(6, 5, 2.6, 3.2, g[0]); p.ell(3.5, 7.5, 2.4, 1.6, g[1]); p.ell(8.8, 7.2, 2.4, 1.6, g[0]); p.set(5, 3, g[2]); p.set(3, 7, g[2]); p.set(9, 6, g[2]); return { cv: p.outline(INK).canvas(), w: p.w, h: p.h }; });
    return sapling[v & 1];
  };
  /* tronco caído (virado para a direita; o toco fica na ponta esquerda) e copa deitada */
  const crownPix = (k) => {
    const p = new Pix(20, 14), g = k === 'tree_pine' ? ['#3f8a4a', '#2c6a3a', '#5aa862'] : ['#4f9a3c', '#3c7c30', '#6fba50'];
    p.ell(10, 8, 9, 5.5, g[1]); p.ell(9, 7, 7.5, 4.5, g[0]); p.ell(6.5, 5, 3.5, 2, g[2]); p.ell(13, 9, 3, 2, g[0]);
    if (k === 'tree_pine') { for (let i = 0; i < 5; i++) p.col(3 + i * 3, 4 + (i % 2), 5 + (i % 2) + 4, g[2]); }
    return p.outline(INK);
  };
  const trunkCache = {};
  const trunkSp = (k) => {
    if (trunkCache[k]) return trunkCache[k];
    const p = new Pix(60, 14);
    p.rect(1, 4, 32, 6, WOOD); p.row(1, 32, 4, WOODL); p.row(1, 32, 5, mix(WOOD, '#ffffff', 0.08)); p.row(1, 32, 9, WOODS); p.row(3, 30, 7, mix(WOOD, '#000000', 0.12));
    for (const x of [8, 14, 21, 27]) p.set(x, 6, WOODS);
    p.ell(2, 7, 1.8, 3.4, '#e4bc84'); p.ell(2, 7, 0.9, 1.8, '#b88a50');
    p.blit(crownPix(k), 30, 0);
    return (trunkCache[k] = { cv: p.outline(INK).canvas(), w: p.w, h: p.h });
  };
  let logPieceCv = null;
  const logPiece = () => { if (!logPieceCv) { const p = new Pix(10, 7); p.rect(1, 1, 8, 5, WOOD); p.row(1, 8, 1, WOODL); p.row(1, 8, 5, WOODS); p.col(8, 2, 5, WOODS); p.ell(1.5, 3.5, 1.5, 2.6, '#e4bc84'); p.set(1, 3, '#b88a50'); p.set(5, 3, WOODS); logPieceCv = { cv: p.outline(INK).canvas(), w: p.w, h: p.h }; } return logPieceCv; };
  const crownCv = {};
  const crownSp = (k) => { if (!crownCv[k]) { const p = crownPix(k); crownCv[k] = { cv: p.canvas(), w: p.w, h: p.h }; } return crownCv[k]; };

  const rockCache = {};
  /* rocha do filão: grande, ocre; a de minério tem veios cor de brasa. stage 0–2 = rachaduras */
  const rockSp = (kind, stage, v) => {
    const key = kind + '|' + stage + '|' + (v % 3); if (rockCache[key]) return rockCache[key];
    const ore = kind === 'minerio', c = ore ? '#8a8696' : '#b3a384', s = ore ? '#5a5666' : '#85775e', l = ore ? '#b6b2c4' : '#ddd0aa', p = new Pix(28, 22);
    p.ell(14, 15, 12, 6.5, c); p.ell(11, 11, 8.5, 7.5, c); p.ell(18.5, 10.5, 6.5, 6, c); p.ell(9, 8.5, 4, 2.6, l); p.ell(17, 7, 3.2, 2, l);
    p.row(4, 24, 19, s); p.row(5, 23, 20, s); p.col(23, 10, 18, s); p.col(22, 12, 18, s); p.row(6, 12, 17, mix(c, s, 0.4)); p.set(14, 12, s); p.set(15, 13, s); p.set(13, 14, s);
    if (ore) { for (const [x, y] of [[8, 13], [16, 15], [19, 9], [11, 17], [22, 14]]) { p.rect(x, y, 2, 2, '#ff9a3c'); p.set(x, y, '#ffe08a'); p.set(x + 1, y + 1, '#d86a1c'); } }
    else { for (const [x, y] of [[8, 14], [17, 13], [13, 18], [21, 15]]) { p.set(x, y, l); p.set(x + 1, y, s); } p.rect(19, 12, 2, 1, '#c9a24a'); }
    if (stage >= 1) { p.line(13, 5, 14, 9, INK); p.line(14, 9, 12, 13, INK); p.set(15, 9, s); }
    if (stage >= 2) { p.line(19, 7, 17, 11, INK); p.line(17, 11, 19, 15, INK); p.line(12, 13, 9, 15, INK); p.set(20, 8, s); p.set(10, 10, s); }
    return (rockCache[key] = { cv: p.outline(INK).canvas(), w: p.w, h: p.h });
  };
  const rubbleSp = (kind, n) => {
    const key = 'r|' + kind + '|' + n; if (rockCache[key]) return rockCache[key];
    const ore = kind === 'minerio', p = new Pix(26, 11), c = ore ? '#8a8696' : '#b3a384', s = ore ? '#5a5666' : '#85775e', l = ore ? '#b6b2c4' : '#ddd0aa';
    const chunk = (x, y, r) => { p.ell(x, y, r + 1.2, r, c); p.ell(x - 1, y - 1, r * 0.55, r * 0.4, l); p.row(Math.round(x - r), Math.round(x + r), Math.round(y + r) - 1, s); if (ore) { p.set(x + 1, y, '#ff9a3c'); p.set(x - 2, y + 1, '#ffd070'); } };
    if (n >= 1) chunk(6, 6.5, 3.4); if (n >= 2) chunk(15, 7, 3.8); if (n >= 3) chunk(21, 6, 2.8); p.set(10, 8, s); p.set(3, 8, l); p.set(18, 4, l);
    return (rockCache[key] = { cv: p.outline(INK).canvas(), w: p.w, h: p.h });
  };
  const smallRockSp = (kind) => {
    const key = 's|' + kind; if (rockCache[key]) return rockCache[key];
    const ore = kind === 'minerio', p = new Pix(14, 10), c = ore ? '#8a8696' : '#b3a384', s = ore ? '#5a5666' : '#85775e', l = ore ? '#b6b2c4' : '#ddd0aa';
    p.ell(7, 6, 5.5, 3.6, c); p.ell(5, 4.5, 3, 1.8, l); p.row(3, 11, 8, s); if (ore) { p.set(8, 5, '#ff9a3c'); p.set(4, 6, '#ff9a3c'); }
    return (rockCache[key] = { cv: p.outline(INK).canvas(), w: p.w, h: p.h });
  };
  const bareSp = () => { if (rockCache.bare) return rockCache.bare; const p = new Pix(18, 7); p.ell(9, 4, 7.5, 2, '#a89868'); p.ell(8, 3.5, 5, 1.2, '#c4b484'); p.set(4, 3, '#85775e'); p.set(12, 4, '#85775e'); p.set(14, 3, '#ddd0aa'); p.set(6, 5, '#ddd0aa'); return (rockCache.bare = { cv: p.canvas(), w: p.w, h: p.h }); };

  /* canteiro 16×16: trigo (crop 0) ou ervas (crop 1) em quatro estágios; a terra molhada escurece; praga murcha */
  const cropCache = [];
  const cropSp = (crop, st, wet, blight) => {
    const key = ((crop * 5 + st) * 2 + (wet ? 1 : 0)) * 2 + (blight ? 1 : 0); if (cropCache[key]) return cropCache[key];
    const p = new Pix(16, 16);
    if (wet) for (let r = 0; r < 4; r++) p.rect(0, 1 + r * 4, 16, 2, '#00000040');
    for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
      const px = 2 + i * 4, py = 3 + r * 8, jit = (i + r) % 2;
      if (crop === 0) {
        const gold = blight ? '#9a8650' : '#e8c450', top = blight ? '#b8a468' : '#f7de8a', stem = blight ? '#6a5a34' : '#a87f24', gr = blight ? '#7a7040' : '#7fb040', gr2 = blight ? '#9a9058' : '#b8c850';
        if (st === 4) { p.rect(px, py - 3, 2, 4, gold); p.set(px, py - 4, top); p.set(px + 1, py - 5 + jit, top); p.set(px, py + 1, stem); p.set(px + 1, py + 1, stem); }
        else if (st === 3) { p.rect(px, py - 2, 2, 3, gr2); p.set(px, py - 3, top); p.set(px + 1, py + 1, stem); p.set(px, py + 1, gr); }
        else if (st === 2) { p.rect(px, py - 1, 1, 2, gr); p.set(px + 1, py, gr); p.set(px - 1, py + 1, gr); }
        else if (st === 1) { p.set(px, py, '#5a3a22'); p.set(px + 1, py + 1, '#c8a060'); }
        else if (!(i + r * 3) % 3) { p.set(px, py, '#c8a860'); p.set(px + 1, py - 1, '#a88848'); }
      } else {
        const g1 = blight ? '#7a7a48' : '#4f9a48', g2 = blight ? '#9a9a60' : '#7fd070', fl = blight ? '#9a7a60' : '#c070e0';
        if (st === 4) { p.rect(px - 1, py - 2, 4, 3, g1); p.set(px, py - 3, g2); p.set(px + 1, py - 2, g2); p.set(px + 2 - jit, py - 4, fl); p.set(px - 1, py + 1, g1); }
        else if (st === 3) { p.rect(px - 1, py - 1, 3, 2, g1); p.set(px, py - 2, g2); p.set(px + 1, py - 2, g1); }
        else if (st === 2) { p.set(px, py, g1); p.set(px + 1, py - 1, g2); p.set(px - 1, py, g1); }
        else if (st === 1) { p.set(px, py, '#5a3a22'); p.set(px + 1, py, '#c8a060'); }
        else if (!(i + r * 3) % 3) { p.set(px, py, '#8a6a4a'); }
      }
    }
    return (cropCache[key] = p.canvas());
  };
  R.cropSp = cropSp;

  let logEndSp = null;
  const logEnd = () => { if (!logEndSp) { const p = new Pix(8, 8); p.ell(4, 4, 3.4, 3.4, '#e4bc84'); p.ell(4, 4, 1.8, 1.8, '#c89a60'); p.ell(4, 4, 0.8, 0.8, '#8a5e38'); logEndSp = { cv: p.outline(INK).canvas(), w: p.w, h: p.h }; } return logEndSp; };
  /* pilhas ao lado dos prédios: cada entrega vira uma peça, num lugar fixo (slot) da pilha */
  const SLOTS = {
    lenharia: [[0, 0], [6, 0], [12, 0], [18, 0], [3, -4.5], [9, -4.5], [15, -4.5], [9, -9]],
    pedreira: [[0, 0], [9, 0], [18, 0], [4.5, -5.5], [13.5, -5.5], [9, -11], [-4, 1], [22, 1]],
    fazenda: [[0, 0], [10, 0], [20, 0], [5, -9], [15, -9], [10, -18], [-5, 1], [25, 1]],
  };
  const pileBase = { lenharia: [-9, 0, '#6a4426'], pedreira: [-8, 0, '#6a6458'], fazenda: [-8, 0, '#7a5a30'] };

  /* ================= desenho ================= */
  const shadow = (px, py, r, z) => { const ctx = R.ctx; ctx.fillStyle = 'rgba(10,16,30,.28)'; ctx.beginPath(); ctx.ellipse(px, py, r * z, r * 0.42 * z, 0, 0, 6.283); ctx.fill(); };
  const blit = (sp, x, y, z, flip) => { const ctx = R.ctx; if (flip) { ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1); ctx.drawImage(sp.cv, 0, 0, sp.w * z, sp.h * z); ctx.restore(); } else ctx.drawImage(sp.cv, x, y, sp.w * z, sp.h * z); };

  const drawStump = (px, py, z, dy) => { const sp = A.prop('stump', 0); R.ctx.drawImage(sp.cv, Math.round(px - (sp.w / 2) * z), Math.round(py - sp.h * z + (dy == null ? 2 : dy) * z), sp.w * z, sp.h * z); };
  /* árvore de corte: o desenho depende do estado */
  R.drawWorkTree = (s, X, Y, z, dark) => {
    const ctx = R.ctx, t = s.wt, px = X(t.x), py = Y(t.y);
    const base = (sp, sx, sy) => ctx.drawImage(sp.cv, Math.round(sx), Math.round(sy), sp.w * z, sp.h * z);
    switch (t.st) {
      case 'tree': case 'chop': {
        const sp = s.s, k = t.sh > 0 ? t.sh / 0.32 : 0, jx = k > 0 ? Math.round(Math.sin(R.t * 70) * 1.3 * k) * z : 0;
        ctx.drawImage(sp.cv, Math.round(px - (sp.w / 2) * z + jx), Math.round(py - sp.h * z), sp.w * z, sp.h * z);
        if (dark > 0.3 && s.lights) { /* nada */ }
        break;
      }
      case 'fall': {
        drawStump(px, py, z);
        const sp = s.s, k = Math.min(1, t.t / 0.95), ease = k * k * k * 0.85 + k * 0.15 * k, ang = t.fd * (Math.PI / 2 - 0.05) * ease, bounce = k > 0.94 ? Math.sin((k - 0.94) / 0.06 * Math.PI) * 0.05 * t.fd : 0;
        ctx.save(); ctx.translate(px, py); ctx.rotate(ang - bounce); ctx.drawImage(sp.cv, Math.round(-(sp.w / 2) * z), Math.round(-sp.h * z), sp.w * z, sp.h * z); ctx.restore();
        shadow(px, py, 5, z);
        break;
      }
      case 'trunk': {
        drawStump(px, py, z);
        const sp = trunkSp(t.k); ctx.save(); ctx.translate(px, py); if (t.fd < 0) ctx.scale(-1, 1);
        ctx.drawImage(sp.cv, Math.round(-2 * z), Math.round(-12 * z), sp.w * z, sp.h * z); ctx.restore();
        break;
      }
      case 'cut': {
        drawStump(px, py, z);
        const cs = crownSp(t.k), lp = logPiece(); ctx.save(); ctx.translate(px, py); if (t.fd < 0) ctx.scale(-1, 1);
        ctx.drawImage(cs.cv, Math.round(30 * z), Math.round(-12 * z), cs.w * z, cs.h * z);
        for (let i = 0; i < t.logs; i++) { const j = LF.logs - t.logs + i; ctx.drawImage(lp.cv, Math.round((1 + j * 10.5) * z), Math.round(-8.5 * z), lp.w * z, lp.h * z); }
        ctx.restore();
        break;
      }
      case 'stump': {
        if (t.crown > 0) { const cs = crownSp(t.k); ctx.save(); ctx.globalAlpha = Math.min(1, t.crown / 3); ctx.translate(px, py); if (t.fd < 0) ctx.scale(-1, 1); ctx.drawImage(cs.cv, Math.round(30 * z), Math.round(-12 * z), cs.w * z, cs.h * z); ctx.restore(); }
        drawStump(px, py, z);
        break;
      }
      case 'sap': { const sp = saplingSp(t.v); base(sp, px - (sp.w / 2) * z, py - sp.h * z + z); break; }
      case 'young': { const sp = youngTree(t.k, t.v); const k = Math.min(1, t.t / LF.youngT); base(sp, px - (sp.w / 2) * z, py - sp.h * z + z); void k; break; }
    }
  };
  /* rocha do filão */
  R.drawWorkRock = (s, X, Y, z) => {
    const ctx = R.ctx, r = s.wr, px = X(r.x), py = Y(r.y);
    let sp;
    switch (r.st) {
      case 'rock': sp = rockSp(r.kind, r.stage, r.v); break;
      case 'rubble': sp = rubbleSp(r.kind, r.pieces); break;
      case 'bare': sp = bareSp(); break;
      default: sp = smallRockSp(r.kind);
    }
    const jx = r.sh > 0 ? Math.round(Math.sin(R.t * 80) * 1.2 * (r.sh / 0.3)) * z : 0;
    if (r.st === 'rock') shadow(px, py, 11, z);
    ctx.drawImage(sp.cv, Math.round(px - (sp.w / 2) * z + jx), Math.round(py - sp.h * z + (r.st === 'bare' ? 1 : 0) * z), sp.w * z, sp.h * z);
  };
  /* canteiros: no chão, antes dos personagens. Os 48 tiles ficam numa camada só (16 px por tile): só os que mudaram de estágio, de umidade ou de praga
     são repintados nela, e o quadro faz um único drawImage */
  let fieldCv = null, fieldCtx = null, fieldSig = null, fx0 = 0, fy0 = 0, fieldN = 0;
  R.groundMore = (X, Y, z, vx0, vx1, vy0, vy1) => {
    const ctx = R.ctx, S = G.S, bl = S.ev.blight > S.day, T = L.tiles;
    if (!T.length) return;
    if (!fieldCv || fieldN !== T.length) {
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (const q of T) { x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); }
      fx0 = x0; fy0 = y0; fieldCv = A.mk((x1 - x0 + 1) * TS, (y1 - y0 + 1) * TS); fieldCtx = fieldCv.getContext('2d'); fieldSig = new Int16Array(T.length).fill(-1); fieldN = T.length;
    }
    if (fx0 + fieldCv.width / TS < vx0 || fx0 > vx1 || fy0 + fieldCv.height / TS < vy0 - 1 || fy0 > vy1) return;
    for (let i = 0; i < T.length; i++) {
      const q = T[i], wet = q.wet > S.t ? 1 : 0, b = bl && q.st >= 2 ? 1 : 0, sig = ((q.crop * 5 + q.st) * 2 + wet) * 2 + b;
      if (fieldSig[i] === sig) continue;
      fieldSig[i] = sig; fieldCtx.clearRect((q.x - fx0) * TS, (q.y - fy0) * TS, TS, TS); fieldCtx.drawImage(cropSp(q.crop, q.st, wet, b), (q.x - fx0) * TS, (q.y - fy0) * TS);
    }
    ctx.drawImage(fieldCv, Math.round(X(fx0)), Math.round(Y(fy0)), fieldCv.width * z, fieldCv.height * z);
  };

  /* pilhas */
  const drawPile = (e, X, Y, z) => {
    const ctx = R.ctx, site = e.site, arr = L.piles[site], p = L.pile[site]; if (!p) return;
    const px = Math.round(X(p[0])), py = Math.round(Y(p[1])), sl = SLOTS[site], b = pileBase[site];
    ctx.fillStyle = 'rgba(10,16,30,.22)'; ctx.beginPath(); ctx.ellipse(px + 7 * z, py, 17 * z, 4.6 * z, 0, 0, 6.283); ctx.fill();
    const order = arr.length > 1 ? arr.slice().sort((a, c) => sl[c.slot][1] - sl[a.slot][1]) : arr;        // as peças de baixo primeiro
    for (const it of order) {
      const s = sl[it.slot]; if (!s) continue;
      const age = G.S.t - it.t, fade = age > LF.pileLife - 5 ? Math.max(0, (LF.pileLife - age) / 5) : 1;
      let img = it.res === 'madeira' ? 'log' : it.res === 'pedra' ? 'stone' : it.res === 'minerio' ? 'ore' : it.res === 'trigo' ? 'sack' : 'basket';
      const sp = itemCv(img);
      if (img === 'log') { /* tora de frente: a ponta redonda com anéis (figurinha pronta) */ const e = logEnd(); ctx.globalAlpha = fade; ctx.drawImage(e.cv, Math.round(px + (s[0] + 3) * z - (e.w / 2) * z), Math.round(py + (s[1] - 3) * z - (e.h / 2) * z), e.w * z, e.h * z); ctx.globalAlpha = 1; }
      else { ctx.globalAlpha = fade; ctx.drawImage(sp.cv, Math.round(px + s[0] * z - (sp.w / 2) * z + 4 * z), Math.round(py + s[1] * z - sp.h * z + 1 * z), sp.w * z, sp.h * z); ctx.globalAlpha = 1; }
    }
    void b;
  };

  /* ================= o trabalhador ================= */
  /* mão (pegada) de cada quadro, em px do quadro 26×30 */
  const HAND = { idle0: [16.5, 20.5], idle1: [16.5, 21.5], walk0: [16.5, 20.5], walk1: [16.5, 21.5], walk2: [16.5, 20.5], walk3: [16.5, 21.5], atk0: [13.7, 15], atk1: [19.5, 17.8], atk2: [17, 20.5], bend0: [A.BEND[0].hx, A.BEND[0].hy], bend1: [A.BEND[1].hx, A.BEND[1].hy] };
  const swingFrame = (f) => (f < 0.4 ? 'atk0' : f < 0.62 ? 'atk1' : 'atk2');
  const lerp = (a, b, t) => a + (b - a) * t;
  /* decide a pose: quadro do corpo, ferramenta e ângulo, carga */
  const pose = (n, w, t) => {
    const P = { fr: '', tool: null, ang: 0, item: null, dy: 0 };
    const walking = n.moving, wf = 'walk' + (Math.floor(R.t * 8 + n._ph) % 4), idf = 'idle' + (Math.floor(R.t * 2 + n._ph) % 2), base = walking ? wf : idf;
    const site = w.site, ph = w.ph, f = w.sw;
    const toolFor = site === 'lenharia' ? 'axe' : site === 'pedreira' ? 'pick' : w.plan === 'harvest' ? 'scythe' : w.plan === 'water' ? 'can' : 'hoe';
    const rest = () => { P.fr = base; P.tool = toolFor; P.ang = toolFor === 'scythe' ? 118 : toolFor === 'can' ? -25 : toolFor === 'hoe' ? 112 : 128; };
    switch (ph) {
      case 'chop': case 'mine': case 'saw': case 'till': {
        P.fr = swingFrame(f); P.tool = toolFor;
        const down = ph === 'saw' ? -42 : -8;
        P.ang = f < 0.4 ? lerp(98, 122, f / 0.4) : f < 0.62 ? lerp(60, down, (f - 0.4) / 0.22) : lerp(down, down - 18, (f - 0.62) / 0.38);
        if (toolFor === 'hoe') P.ang = f < 0.4 ? lerp(100, 125, f / 0.4) : f < 0.62 ? lerp(60, -52, (f - 0.4) / 0.22) : -42;
        break;
      }
      case 'harvest':
        if (w.tgt && w.tgt.crop === 1) { P.fr = 'bend1'; P.tool = null; P.pull = f; }
        else { P.fr = 'bend0'; P.tool = 'scythe'; P.ang = lerp(150, 98, Math.min(1, f * 1.15)) - (f > 0.55 ? (f - 0.55) * 100 : 0); }
        break;
      case 'plant': P.fr = 'bend1'; P.tool = null; P.seeds = true; break;
      case 'water': P.fr = 'idle0'; P.tool = 'can'; P.ang = -10 - Math.min(1, w.t / 0.6) * 38; P.dy = 0; break;
      case 'pick': case 'gather': case 'bundle': P.fr = w.ph === 'bundle' ? 'bend0' : 'bend1'; P.tool = null; P.lift = true; break;
      case 'watch': P.fr = idf; P.tool = toolFor; P.ang = -32; break;
      case 'drop': P.fr = w.t < 0.5 ? 'bend0' : idf; P.tool = null; break;          // a carga que sai voando para a pilha é desenhada à parte (não duas vezes)
      case 'carry': P.fr = wf; P.item = w.carry; break;
      default: rest();
    }
    if ((ph === 'toTree' || ph === 'toLog' || ph === 'toRock' || ph === 'toTile' || ph === 'look' || ph === 'wait' || ph === 'rest') && w.carry) { P.fr = base; P.tool = null; P.item = w.carry; }
    if ((ph === 'toTree' || ph === 'toLog' || ph === 'toRock' || ph === 'toTile') && !w.carry) { P.fr = base; P.tool = toolFor; P.ang = toolFor === 'can' ? -35 : toolFor === 'scythe' ? 118 : 128; if (toolFor === 'hoe') P.ang = 112; }
    if (ph === 'wait') { P.fr = idf; P.tool = toolFor; P.ang = toolFor === 'can' ? -60 : -32; }
    return P;
  };
  const drawItem = (ctx, kind, bob, z, fr) => {
    const k = kind === 'log' ? 'log' : kind, sp = itemCv(k);
    let ax, ay;
    if (k === 'log') { ax = 8.5; ay = 11.4 + bob; }                    // sobre o ombro, de ponta a ponta
    else if (k === 'sack') { ax = 3.5; ay = 8 + bob; }                  // nas costas
    else if (k === 'basket') { ax = 11; ay = 15.5 + bob; }              // à frente, nas duas mãos
    else { ax = 12.5; ay = 15 + bob; }                                  // pedra/minério ao peito
    ctx.drawImage(sp.cv, Math.round((ax - 13) * z), Math.round((ay - 27) * z), sp.w * z, sp.h * z);
    if (k === 'log') { ctx.fillStyle = INK; ctx.fillRect(Math.round((17 - 13) * z), Math.round((16.4 + bob - 27) * z), 3 * z, 3 * z); ctx.fillStyle = '#f8d6b4'; ctx.fillRect(Math.round((17.4 - 13) * z), Math.round((16.8 + bob - 27) * z), 2 * z, 2 * z); }
    else if (k === 'sack') { ctx.fillStyle = INK; ctx.fillRect(Math.round((13.5 - 13) * z), Math.round((14 + bob - 27) * z), 3 * z, 3 * z); ctx.fillStyle = '#f8d6b4'; ctx.fillRect(Math.round((14 - 13) * z), Math.round((14.4 + bob - 27) * z), 2 * z, 2 * z); }
    else { for (const hx of [k === 'basket' ? 14.5 : 15.5, k === 'basket' ? 20.5 : 21.5]) { ctx.fillStyle = INK; ctx.fillRect(Math.round((hx - 13) * z), Math.round((21 + bob - 27) * z), 3 * z, 3 * z); ctx.fillStyle = '#f8d6b4'; ctx.fillRect(Math.round((hx + 0.4 - 13) * z), Math.round((21.4 + bob - 27) * z), 2 * z, 2 * z); } }
    void fr;
  };
  const walkBob = (fr) => (fr === 'walk1' || fr === 'walk3' || fr === 'idle1' ? 1 : 0);
  R.npcDraw = (e, X, Y, z, over) => {
    const w = e.w; if (!e._wk || !w) return false;
    const ctx = R.ctx, S = G.S, px = Math.round(X(e.x)), py = Math.round(Y(e.y));
    if (e._ph == null) e._ph = (G.hash(e.name || e.id) % 100) / 25;
    if (!e._wlook) e._wlook = A.npcLook(e);
    const sheet = A.charSheet(e._wlook), P = pose(e, w, R.t), bob = walkBob(P.fr);
    shadow(px, py, 6.5, z);
    ctx.save(); ctx.translate(px, py); if (e.dir < 0) ctx.scale(-1, 1);
    const dy = P.dy || 0;
    ctx.drawImage(sheet.cv, sheet.idx[P.fr] * 26, 0, 26, 30, -13 * z, (-27 + dy) * z, 26 * z, 30 * z);
    if (P.item) { drawItem(ctx, P.item, bob, z, P.fr); if (P.item === 'log' || P.item === 'sack') ctx.drawImage(sheet.cv, sheet.idx[P.fr] * 26, 0, 26, 14, -13 * z, (-27 + dy) * z, 26 * z, 14 * z); }      // a cabeça volta por cima: a carga fica no ombro, não na cara
    if (P.tool) { const h = HAND[P.fr] || HAND.idle0, c = toolCv(P.tool, Math.round(P.ang / 6) * 6); ctx.drawImage(c, Math.round((h[0] - 14 - 13) * z), Math.round((h[1] - 14 - 27 + dy) * z), 28 * z, 28 * z); }
    if (P.seeds && !low()) { for (let i = 0; i < 3; i++) { const k = (w.t * 2.2 + i * 0.33) % 1; ctx.fillStyle = i % 2 ? '#c8a060' : '#5a3a22'; ctx.fillRect(Math.round((20 + k * 5 - 13) * z), Math.round((24 + k * 4 - 27) * z), z, z); } }
    if (P.lift && w.t > 0.15 && w.t < 0.5 && w.src) { /* a carga sobe do chão */ }
    ctx.restore();
    if (R.sel && R.sel.ref === e) over.push(() => { const c = R.ctx; c.font = '700 ' + Math.round(G.clamp(z * 2.6, 10.5 * dpr(), 13 * dpr())) + 'px "Aurora Manrope",system-ui,sans-serif'; c.textAlign = 'center'; c.lineWidth = Math.max(2, dpr() * 2.2); c.strokeStyle = 'rgba(16,12,24,.9)'; const tx = e.name + ' · ' + G.workLabel(e); c.strokeText(tx, px, py - 31 * z); c.fillStyle = '#fff7e0'; c.fillText(tx, px, py - 31 * z); });
    /* tora/pedra voando para a pilha, ou nascendo do chão ao erguer */
    if (w.ph === 'drop' && w.carry && w.t < 0.5) {
      const p = L.pile[w.site], k = w.t / 0.5, sp = itemCv(w.carry), ix = X(lerp(e.x + 0.2, p[0] + 0.4, k)), iy = Y(lerp(e.y - 1.0, p[1] - 0.5, k)) - Math.sin(k * Math.PI) * 5 * z;
      ctx.drawImage(sp.cv, Math.round(ix - (sp.w / 2) * z), Math.round(iy - (sp.h / 2) * z), sp.w * z, sp.h * z);
    }
    return true;
  };

  /* ================= partículas de cada golpe ================= */
  R.spray = (x, y, n, cols, dir, spread, life, g, sp) => {
    if (low() || R.parts.length > 600) return;
    for (let i = 0; i < n; i++) {
      const a = (dir > 0 ? -0.5 : Math.PI + 0.5) + (Math.random() - 0.5) * spread, v = (0.5 + Math.random()) * (sp || 2);
      R.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.6, life: life * (0.6 + Math.random() * 0.6), max: life, c: Array.isArray(cols) ? G.pick(cols) : cols, size: Math.random() < 0.4 ? 2 : 1, g: g == null ? 7 : g, kind: undefined });
    }
  };
  const fm0 = R.fxMore;
  R.fxMore = (f) => {
    switch (f.t) {
      case 'chip': R.spray(f.x, f.y, 6, ['#e8c890', '#c89a60', '#8a5e38', '#f4e0b0'], f.dir, 2.6, 0.55, 9, 2.6); if (!low() && Math.random() < 0.5) R.spray(f.x, f.y - 0.7, 2, ['#4f9a3c', '#6fba50'], -f.dir, 3.5, 0.9, 2.5, 1); break;
      case 'spark': R.spray(f.x, f.y, f.big ? 12 : 7, f.ore ? ['#ffe08a', '#ff9a3c', '#ffffff'] : ['#fff4c0', '#ffe08a', '#ffffff', '#c8c8d0'], f.dir, 3.2, 0.4, 8, 3.4); R.fxs.push({ t: 'ring', x: f.x, y: f.y + 0.1, c: '#ffe9a0', r: 0.3, age: 0, life: 0.14 }); break;
      case 'rockbreak': R.burst(f.x, f.y, 14, f.ore ? ['#8a8696', '#b6b2c4', '#ff9a3c'] : ['#b3a384', '#ddd0aa', '#85775e'], 3, 0.6, 9); for (let i = 0; i < 4; i++) if (!low()) R.parts.push({ x: f.x + G.rnd(-0.5, 0.5), y: f.y + G.rnd(-0.3, 0.3), vx: G.rnd(-0.2, 0.2), vy: -0.5, life: 1.2, max: 1.2, c: '#d8d0bc', size: 3, g: -0.05, kind: 'puff' }); break;
      case 'timber': R.burst(f.x, f.y, 10, ['#6fba50', '#4f9a3c', '#8ad060'], 2.2, 0.7, 4); if (!low()) { for (let i = 0; i < 5; i++) R.parts.push({ x: f.x + G.rnd(-1, 1), y: f.y + G.rnd(-0.1, 0.2), vx: G.rnd(-0.3, 0.3), vy: -0.3, life: 1.1, max: 1.1, c: '#e8e0c8', size: 3, g: -0.05, kind: 'puff' }); } break;
      case 'chaff': R.spray(f.x, f.y, f.k === 2 ? 5 : 7, f.k === 0 ? ['#e8c450', '#f7de8a', '#a87f24'] : f.k === 1 ? ['#4f9a48', '#7fd070', '#c070e0'] : ['#8c643a', '#6f4c2a', '#a87f4a'], 1, 5, 0.5, 6, 1.6); break;
      case 'splash': if (!low()) for (let i = 0; i < 10; i++) R.parts.push({ x: f.x + G.rnd(-0.35, 0.45), y: f.y + G.rnd(-0.1, 0.1), vx: G.rnd(-0.4, 0.4), vy: G.rnd(-1.4, -0.4), life: 0.5, max: 0.5, c: i % 3 ? '#8fd0f0' : '#ffffff', size: 1, g: 6, kind: undefined }); break;
      default: if (fm0) fm0(f);
    }
  };

  /* ================= ganchos no mapa ================= */
  const ri0 = R.init;
  R.init = (cv) => {
    ri0(cv);
    const W = Wd.life; if (!W) return;
    const byProp = new Map(W.trees.map((t) => [t.p, t]));
    for (const s of R.statics) { const t = s.p && byProp.get(s.p); if (t) s.wt = t; }
    const dummy = { cv: A.mk(1, 1), w: 1, h: 1 };
    for (const r of W.rocks) R.statics.push({ y: r.y, x: r.x, s: dummy, kind: 'wrock', wr: r });
    R.statics.sort((a, b) => a.y - b.y);
  };
  const dm0 = R.dynMore;
  R.dynMore = (dyn, vx0, vx1, vy0, vy1) => {
    if (dm0) dm0(dyn, vx0, vx1, vy0, vy1);
    for (const site in L.pile) { const p = L.pile[site]; if (p[0] > vx0 - 2 && p[0] < vx1 + 2 && p[1] > vy0 && p[1] < vy1 + 1) dyn.push({ y: p[1] + 0.1, k: 'x', e: { site }, f: drawPile }); }
  };

  /* sons curtos e discretos */
  const AU = G.AU;
  if (AU && AU.SFX) {
    const S = AU.SFX, tone = AU.tone, noise = AU.noise;
    S.chop = (t) => { noise(t, 0.06, 0.28, 700 + Math.random() * 200, 1.2); tone(150, t, 0.07, 'square', 0.07, 85); };
    S.thud = (t) => { tone(90, t, 0.32, 'sine', 0.3, 45); noise(t, 0.28, 0.22, 260, 0.6, 'lowpass'); };
    S.mine = (t) => { tone(1750 + Math.random() * 300, t, 0.05, 'triangle', 0.1, 900); noise(t, 0.05, 0.3, 2600, 1.4); };
    S.crumble = (t) => { noise(t, 0.4, 0.3, 500, 0.7, 'lowpass'); tone(110, t, 0.3, 'sawtooth', 0.1, 50); };
    S.swish = (t) => noise(t, 0.12, 0.12, 3200, 0.6, 'highpass');
    S.dig = (t) => noise(t, 0.09, 0.18, 420, 0.9, 'lowpass');
  }

  /* ================= o que os prédios mostram enquanto trabalham ================= */
  let forgeSeen = -1, forgeUntil = -1;
  R.bldWork = (id, lvl, p, sp, X, Y, z) => {
    if (low() || lvl <= 0) return;
    const S = G.S, hr = S.clock / 60;
    /* a Ferraria só solta faíscas fortes enquanto forja de verdade (uma peça acabou de sair) ou no expediente com encomendas automáticas ligadas */
    if (id === 'ferraria') { if (S.stats.crafted !== forgeSeen) { if (forgeSeen >= 0) forgeUntil = S.t + 7; forgeSeen = S.stats.crafted; } }
    if (id === 'ferraria' && hr >= 6 && hr < 18 && G.bOk('ferraria') && (S.t < forgeUntil || (S.opts.autoForge && G.autoForgeN() > 0)) && Math.random() < (S.t < forgeUntil ? 0.22 : 0.08)) R.burst(p.x + 3.1 + G.rnd(-0.9, 0.9), p.y + 4.25, 2, ['#ffb040', '#ffe07a', '#ffffff'], 2, 0.4, 7);
    else if ((id === 'padaria' || id === 'taverna') && hr >= 5 && hr < 21 && G.bOk(id) && sp.smoke && S.res.trigo > 1 && Math.random() < 0.07) R.parts.push({ x: p.x - 0.25 + sp.smoke.x / 16, y: p.y + 4 - (sp.h - 4 - sp.smoke.y) / 16, vx: 0.25, vy: -0.7, life: 2.8, max: 2.8, c: '#f4f0e8', size: 3, g: -0.05, kind: 'puff' });
    else if (id === 'alquimista' && hr >= 5 && hr < 21 && G.bOk(id) && S.res.ervas > 1 && Math.random() < 0.05) R.parts.push({ x: p.x + 4.4 + G.rnd(-0.3, 0.3), y: p.y + 2.2, vx: G.rnd(-0.1, 0.1), vy: -0.6, life: 1.6, max: 1.6, c: G.pick(['#9be08a', '#d070ff', '#ffffff']), size: 2, g: -0.1, kind: 'glow' });
  };
})();

;
