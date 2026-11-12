/* 53-companheiros-art: arte da v22 — os 15 mascotes (dois quadros, 14×12, olhando para a direita), ovos,
   o espólio no chão, os mascotes no mapa (posição simulada, saquinho de carga e cor da raridade) e os
   efeitos de Fraqueza e de coleta. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const A = G.A, R = G.R, Pix = A.Pix, INK = '#1a1422', TS = 16;
  const WHITE = '#fffaf0', GOLD = '#ffe07a';

  /* ---------- mascotes ---------- */
  const petPix = (k, f) => {
    const d = G.PETS[k], [b, s, l] = d.c, p = new Pix(14, 12), hop = f ? 1 : 0;
    switch (d.kind) {
      case 'ave': p.ell(7, 6 - hop, 3.6, 3.8, b); p.ell(7, 7 - hop, 2, 2.4, l); p.set(6, 4 - hop, INK); p.set(9, 4 - hop, INK); p.set(8, 5 - hop, '#e2b659'); p.tri(3, 5 - hop, 1, 8 - hop * 3, 5, 8 - hop, s); p.tri(11, 5 - hop, 13, 8 - hop * 3, 9, 8 - hop, s); p.set(5, 2 - hop, s); p.set(9, 2 - hop, s); break;
      case 'fada': p.ell(7, 6 - hop, 2.2, 2.6, b); p.set(7, 3 - hop, l); p.ell(3.5, 5 - hop * 2, 2.6, 2, l); p.ell(10.5, 5 - hop * 2, 2.6, 2, l); p.set(8, 5 - hop, INK); p.set(7, 9 - hop, s); p.set(2, 9, '#fff0a0'); p.set(12, 2, '#fff0a0'); break;
      case 'draco': p.ell(6, 8, 3.8, 2.6, b); p.ell(10, 5, 2.6, 2.2, b); p.set(11, 4, INK); p.set(13, 6, l); p.tri(5, 6, 2, 1 + hop * 2, 8, 5, s); p.line(2, 9, 0, 7, b); p.rect(4, 10, 2, 2 - hop, s); p.rect(8, 10, 2, 1 + hop, s); p.set(9, 2, l); break;
      case 'jabuti':
        p.rect(3, 10, 2, 2 - hop, l); p.rect(8, 10, 2, 1 + hop, l); p.set(1, 9, l);
        p.ell(6, 7, 4.8, 3.4, b); p.row(2, 10, 9, s); p.row(2, 10, 10, s); p.ell(11.5, 7.5 - hop * 0.5, 1.9, 1.6, l); p.set(12, 7 - hop, INK);
        p.set(4, 5, l); p.set(6, 4, l); p.set(8, 5, l); p.set(5, 7, s); p.set(7, 7, s); p.set(3, 7, s); p.set(9, 7, s); p.set(5, 4, '#a8e070'); p.set(7, 3, '#a8e070');
        break;
      case 'broto':
        p.rect(5, 10, 2, 2 - hop, '#d8c8a0'); p.rect(8, 10, 2, 1 + hop, '#d8c8a0');
        p.rect(5, 6 - hop, 5, 4, '#f4ead0'); p.col(9, 6 - hop, 9 - hop, '#d8c8a0'); p.set(6, 7 - hop, INK); p.set(8, 7 - hop, INK); p.set(7, 8 - hop, '#f0a0a0');
        p.ell(7, 4.5 - hop, 5, 3, b); p.row(2, 12, 6 - hop, s); p.set(5, 3 - hop, l); p.set(9, 3 - hop, l); p.set(7, 2 - hop, l); p.set(3, 5 - hop, l); p.set(11, 5 - hop, l);
        break;
      case 'morcego':
        if (f) { p.tri(6, 5, 0, 9, 3, 4, s); p.tri(8, 5, 14, 9, 11, 4, s); } else { p.tri(6, 5, 0, 1, 3, 8, s); p.tri(8, 5, 14, 1, 11, 8, s); }
        p.ell(7, 6 - hop, 2.4, 2.6, b); p.tri(5, 4 - hop, 5, 1 - hop, 7, 4 - hop, b); p.tri(9, 4 - hop, 9, 1 - hop, 7, 4 - hop, b);
        p.set(6, 5 - hop, l); p.set(8, 5 - hop, l); p.set(7, 8 - hop, WHITE);
        break;
      case 'golem':
        p.rect(4, 10, 2, 2, s); p.rect(8, 10, 2, 2, s);
        p.rect(3, 4 + hop, 8, 6, b); p.row(3, 10, 4 + hop, l); p.col(10, 5 + hop, 9 + hop, s); p.set(5, 7 + hop, s); p.set(8, 8 + hop, s); p.set(6, 8 + hop, s);
        p.rect(5, 1 + hop, 5, 3, b); p.row(5, 9, 1 + hop, l); p.set(8, 2 + hop, '#7af0ff'); p.set(9, 2 + hop, '#7af0ff');
        p.rect(1, 5 + hop, 2, 4 - hop, s); p.rect(11, 5 + hop, 2, 3 + hop, s);
        break;
      case 'sapo':
        p.rect(2, 9, 3, 2, s); p.rect(10, 10 - hop, 2, 2, s);
        p.ell(7, 8 - hop, 4.6, 2.8, b); p.ell(7.5, 9 - hop, 2.8, 1.5, l); p.row(8, 11, 8 - hop, s);
        p.ell(5.5, 5 - hop, 1.5, 1.5, b); p.ell(9.5, 5 - hop, 1.5, 1.5, b); p.set(5, 5 - hop, WHITE); p.set(9, 5 - hop, WHITE); p.set(6, 5 - hop, INK); p.set(10, 5 - hop, INK);
        p.set(4, 8 - hop, s); p.set(6, 7 - hop, s);
        break;
      case 'urso':
        p.rect(3, 10, 2, 2 - hop, s); p.rect(8, 10, 2, 1 + hop, s); p.set(1, 8, b);
        p.ell(6, 8, 4.2, 2.8, b); p.row(3, 9, 10, s); p.ell(10, 5, 2.8, 2.6, b); p.ell(8.6, 2.6, 1, 1, b); p.ell(11.4, 2.6, 1, 1, b); p.set(8, 2, s); p.set(11, 2, s);
        p.ell(12, 6, 1.4, 1, l); p.set(13, 6, INK); p.set(10, 4, INK); p.set(11, 6, '#f0a0a0');
        break;
      case 'olho':
        p.line(5, 9 - hop, 4 - hop, 11, s); p.line(8, 9 - hop, 8, 11, s); p.line(10, 9 - hop, 11 + hop, 11, s);
        p.ell(7, 6 - hop, 4.2, 3.8, b); p.ell(7.5, 6 - hop, 3, 2.8, '#f4f0ff'); p.ell(8.4, 6 - hop, 1.7, 1.8, l); p.ell(8.8, 6 - hop, 0.8, 1.1, INK); p.set(7, 5 - hop, WHITE);
        p.row(4, 10, 2 - hop, s); p.set(3, 4 - hop, s); p.set(11, 4 - hop, s);
        break;
      case 'medusa':
        for (const x of [4, 6, 8, 10]) { const w = (x / 2 + f) % 2; p.col(x, 6 - hop, 9 - hop + w, s); p.set(x + (w ? 1 : -1), 10 - hop + w, l); }
        p.ell(7, 4 - hop, 4.6, 3, b); p.row(3, 11, 6 - hop, s); p.set(5, 2 - hop, l); p.set(6, 3 - hop, l); p.set(9, 2 - hop, WHITE);
        p.set(6, 5 - hop, INK); p.set(9, 5 - hop, INK);
        break;
      case 'fenix':
        p.tri(4, 7 - hop, 0, 3 + hop * 2, 2, 10, s); p.tri(4, 8 - hop, 0, 9, 3, 11, l);
        p.set(6, 11, GOLD); p.set(8, 11, GOLD);
        p.ell(7, 7 - hop, 3.4, 3, b); p.tri(5, 6 - hop, 9, 7 - hop, 6, 9 - hop + hop * 2, s);
        p.ell(9.6, 4.5 - hop, 2.2, 2, b); p.set(12, 5 - hop, GOLD); p.set(11, 5 - hop, GOLD); p.set(10, 4 - hop, INK);
        p.tri(8, 3 - hop, 9, 0, 10, 3 - hop, l); p.set(7, 1 - hop, l); p.set(8, 2 - hop, GOLD);
        break;
      default: { // gato e raposa (e o lobinho, que usa o desenho da raposa)
        p.ell(6, 8, 4, 2.6, b); p.ell(10, 5, 2.8, 2.4, b); p.tri(8, 1, 9, 4, 10, 4, b); p.tri(12, 1, 11, 4, 12, 4, b); p.set(11, 5, INK); p.set(13, 6, d.kind === 'raposa' ? INK : '#f0a0a0'); p.row(5, 8, 9, l);
        p.rect(3, 10, 2, 2 - hop, s); p.rect(8, 10, 2, 1 + hop, s);
        if (d.kind === 'raposa') { p.line(2, 8, 0, 4 + hop, b); p.line(1, 8, 0, 5 + hop, b); p.set(0, 4 + hop, l); p.set(12, 7, l); } else { p.line(2, 7, 1, 3 + hop, b); p.set(1, 3 + hop, s); }
      }
    }
    return p.outline(INK);
  };
  const FLY = { ave: 1, fada: 1, morcego: 1, olho: 1, medusa: 1, fenix: 0 };
  const sheets = new Map(), urls = {};
  A.petSheet = (k) => {
    if (!G.PETS[k]) return null; let s = sheets.get(k); if (s) return s;
    s = A.mk(28, 12); const x = s.getContext('2d'); x.drawImage(petPix(k, 0).canvas(), 0, 0); x.drawImage(petPix(k, 1).canvas(), 14, 0);
    sheets.set(k, s); return s;
  };
  A.petURL = (k) => { if (urls[k]) return urls[k]; const cv = A.mk(14, 12); cv.getContext('2d').drawImage(A.petSheet(k), 0, 0, 14, 12, 0, 0, 14, 12); return (urls[k] = cv.toDataURL()); };
  /* ovo 16×16 com pintas na cor da raridade */
  const eggs = {};
  A.eggURL = (rar) => {
    if (eggs[rar]) return eggs[rar];
    const p = new Pix(16, 16), c = G.RAR_COLOR[rar], cd = A.shade(c, 0.7);
    p.ell(8, 9, 5.2, 6.2, '#f4ead0'); p.ell(9.5, 10.5, 3.4, 4.4, '#e0d4b4'); p.ell(6.5, 6.5, 1.6, 2.2, WHITE);
    for (const [x, y] of [[6, 10], [10, 6], [9, 12], [5, 13], [11, 10]]) { p.set(x, y, c); p.set(x + 1, y, cd); }
    if (rar >= 3) { p.set(2, 3, GOLD); p.set(13, 2, GOLD); p.set(14, 12, GOLD); }
    return (eggs[rar] = p.outline(INK).canvas().toDataURL());
  };
  /* saquinho que aparece nas costas do mascote quando ele carrega algo */
  const sackPix = (full) => { const p = new Pix(7, 7); p.ell(3.5, 4.5, 3, 2.4, '#b08a4a'); p.row(1, 5, 6, '#7a5a2a'); p.rect(2, 1, 3, 2, '#b08a4a'); p.row(2, 4, 2, full ? GOLD : '#c8473d'); p.set(2, 4, '#e0c080'); return p.outline(INK).canvas(); };
  let sacks = null;

  /* ---------- espólio no chão ---------- */
  const icons = {};
  const resCv = (k) => icons[k] || (icons[k] = A.resIcon(G.RES[k].shape, G.RES[k].c).canvas());
  const dpr = () => Math.min(3, window.devicePixelRatio || 1);
  const shadow = (ctx, px, py, r, z) => { ctx.fillStyle = 'rgba(10,16,30,.28)'; ctx.beginPath(); ctx.ellipse(px, py, r * z, r * 0.42 * z, 0, 0, 6.283); ctx.fill(); };
  const drawDrop = (d, X, Y, z, over) => {
    const ctx = R.ctx, S = G.S; if (!(d.n > 0)) return;
    const left = G.DROP_LIFE - (S.t - d.t); if (left < G.DROP_BLINK && Math.floor(R.t * 6) % 2) return;
    const res = G.RES[d.k], px = Math.round(X(d.x)), py = Math.round(Y(d.y)), sc = Math.max(1, Math.round(z * 0.7)), sz = 16 * sc;
    const bob = Math.round((Math.sin(R.t * 3 + d.id) * 0.8 + 0.8) * sc);
    ctx.globalAlpha = 0.2 + 0.1 * Math.sin(R.t * 4 + d.id); ctx.fillStyle = res.rare ? '#ffd35a' : '#fff4c8';
    ctx.beginPath(); ctx.ellipse(px, py - z, 7.5 * z, 3.2 * z, 0, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1;
    shadow(ctx, px, py, 4, z);
    ctx.drawImage(resCv(d.k), 0, 0, 16, 16, Math.round(px - sz / 2), Math.round(py - sz - bob), sz, sz);
    const tw = (R.t * 1.3 + d.id * 0.37) % 2.2; // cintilar de vez em quando
    if (tw < 0.35) { const a = Math.sin(tw / 0.35 * Math.PI), sx = Math.round(px + ((d.id * 7) % 9 - 4) * sc), sy = Math.round(py - sz * 0.75 - bob); ctx.globalAlpha = a; ctx.fillStyle = '#ffffff'; ctx.fillRect(sx - sc, sy, 3 * sc, sc); ctx.fillRect(sx, sy - sc, sc, 3 * sc); ctx.globalAlpha = 1; }
    if (d.n > 1) over.push(() => {
      const fs = Math.round(G.clamp(z * 2.3, 9.5 * dpr(), 12 * dpr())); ctx.font = '800 ' + fs + 'px "Aurora Manrope",system-ui,sans-serif'; ctx.textAlign = 'center';
      const tx = px + sz / 2, ty = py - sz * 0.25 - bob; ctx.lineWidth = Math.max(2, dpr() * 2.2); ctx.strokeStyle = 'rgba(16,12,24,.9)'; ctx.lineJoin = 'round'; ctx.strokeText('×' + d.n, tx, ty); ctx.fillStyle = '#fff3c0'; ctx.fillText('×' + d.n, tx, ty);
    });
  };

  /* ---------- mascote no mapa ---------- */
  /* v27 (B2): balãozinho de quem procura dono: "?" enquanto vaga, coração quando segue o favorito */
  const marks = {};
  const markCv = (heart) => {
    const k = heart ? 'h' : 'q'; if (marks[k]) return marks[k];
    const p = new Pix(11, 12);
    p.rect(1, 1, 9, 7, WHITE); p.rect(2, 0, 7, 9, WHITE); p.set(4, 9, WHITE); p.set(5, 10, WHITE); p.set(4, 8, WHITE); p.set(5, 9, WHITE);
    if (heart) { for (const [x, y] of [[3, 2], [4, 2], [6, 2], [7, 2], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [4, 4], [5, 4], [6, 4], [5, 5]]) p.set(x, y, '#e8506a'); p.set(3, 2, '#ff9aa8'); }
    else { for (const [x, y] of [[4, 2], [5, 2], [6, 2], [3, 3], [7, 3], [7, 4], [6, 5], [5, 5], [5, 7]]) p.set(x, y, '#8a5ae8'); p.set(5, 6, '#8a5ae8'); }
    return (marks[k] = p.outline(INK).canvas());
  };
  const drawPet = (p, X, Y, z) => {
    const ctx = R.ctx, r = G.petRt.get(p.id); if (!r) return;
    const d = G.PETS[p.k], sheet = A.petSheet(p.k), col = G.RAR_COLOR[p.rar];
    const px = Math.round(X(r.x)), py = Math.round(Y(r.y)), hover = FLY[d.kind] ? Math.round((2.5 + Math.sin(R.t * 4 + p.id) * 1.2) * z) : 0;
    if (p.rar >= 3) { ctx.globalAlpha = 0.16 + 0.08 * Math.sin(R.t * 3 + p.id); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(px, py - 5 * z - hover, 8 * z, 6.5 * z, 0, 0, 6.283); ctx.fill(); }
    ctx.globalAlpha = 0.9; ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, Math.round(z * 0.55)); ctx.beginPath(); ctx.ellipse(px, py, 6.5 * z, 2.6 * z, 0, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1;
    shadow(ctx, px, py, 3.2, z);
    const fr = r.moving ? Math.floor(R.t * 7 + p.id) % 2 : Math.floor(R.t * 1.5 + p.id) % 2;
    ctx.save(); ctx.translate(px, py - hover); if ((r.dir || 1) < 0) ctx.scale(-1, 1);
    ctx.drawImage(sheet, fr * 14, 0, 14, 12, -7 * z, -11 * z, 14 * z, 12 * z);
    if (p.bagN > 0) { if (!sacks) sacks = [sackPix(0), sackPix(1)]; const full = p.bagN >= G.petLoadCap(p); ctx.drawImage(sacks[full ? 1 : 0], -9 * z, (-9 - (full ? 1 : 0)) * z, 7 * z, 7 * z); }
    ctx.restore();
    if (p.out && !p.hero) { const bob = Math.round(Math.sin(R.t * 3 + p.id) * z), mc = markCv(r.mode === 'trail'), w = 11 * z * 0.9; ctx.drawImage(mc, Math.round(px - w / 2), Math.round(py - hover - 14.5 * z - w * 12 / 11 + bob), w, w * 12 / 11); }
    if (r.cast > 0) { const k = 1 - r.cast / 0.6; ctx.globalAlpha = (1 - k) * 0.9; ctx.strokeStyle = r.ck === 'heal' ? '#7df09a' : '#b98ff5'; ctx.lineWidth = Math.max(1, z); ctx.beginPath(); ctx.ellipse(px, py - 5 * z - hover, (6 + 6 * k) * z, (5 + 5 * k) * z, 0, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1; }
  };
  R.dynMore = (dyn, vx0, vx1, vy0, vy1) => {
    const S = G.S;
    for (const d of G.drops) if (d.n > 0 && d.x > vx0 && d.x < vx1 && d.y > vy0 && d.y < vy1 + 1) dyn.push({ y: d.y - 0.05, k: 'x', e: d, f: drawDrop });
    for (const p of S.pets) {
      if (!p.hero && !p.out) continue; let r = G.petRt.get(p.id);
      if (!r) { if (p.out && !p.hero) r = G.strayRt(p); else { const h = S.heroes.find((x) => x.id === p.hero); if (!h) continue; r = G.petRtOf(p, h); } }
      if (r.x > vx0 && r.x < vx1 && r.y > vy0 && r.y < vy1 + 1) dyn.push({ y: r.y, k: 'x', e: p, f: drawPet });
    }
  };
  /* toque no espólio: prioridade abaixo do herói e acima de monstros e construções */
  /* v27 (B2): toque num mascote vagante abre o cartão dele. Com o raio curto ele vale antes dos heróis (o vagante vive grudado no favorito); com o raio longo, depois deles */
  R.pickPet = (wx, wy, rad) => { let sp = null, sd = rad; for (const p of G.S.pets) { if (!p.out || p.hero) continue; const r = G.petRt.get(p.id); if (!r) continue; const dd = Math.hypot(r.x - wx, r.y - 0.4 - wy); if (dd < sd) { sd = dd; sp = p; } } return sp ? { type: 'pet', ref: sp } : null; };
  R.pickMore = (wx, wy) => {
    let best = null, bd = 0.8; for (const d of G.drops) { if (!(d.n > 0)) continue; const dd = Math.hypot(d.x - wx, d.y - 0.35 - wy); if (dd < bd) { bd = dd; best = d; } }
    const pt = R.pickPet(wx, wy, 1.15); if (pt) return pt;
    return best ? { type: 'drop', ref: best } : null; };
  /* efeitos novos */
  R.fxMore = (f) => {
    if (f.t === 'weak') {
      if (f.fx != null) R.fxs.push({ t: 'proj', x: f.fx, y: f.fy, tx: f.x, ty: f.y, k: 'orb', c: '#b98ff5', age: 0, life: Math.min(0.35, Math.hypot(f.x - f.fx, f.y - f.fy) / 16 + 0.08) });
      R.fxs.push({ t: 'ring', x: f.x, y: f.y + 0.3, c: '#b07af0', r: 1.3, age: -0.12, life: 0.5 });
      R.burst(f.x, f.y, 10, ['#c9a4ff', '#8a5ae8', '#ffffff'], 1.8, 0.55, 2);
    } else if (f.t === 'pick') {
      R.fxs.push({ t: 'ring', x: f.x, y: f.y + 0.3, c: '#ffe07a', r: f.pet ? 0.5 : 0.8, age: 0, life: 0.35 });
      R.burst(f.x, f.y, f.pet ? 4 : 8, ['#ffe07a', '#ffffff'], 1.4, 0.45, -1);
    }
  };
  /* marca no monstro enfraquecido: setas roxas girando sobre a cabeça */
  R.weakMark = (m, px, py, zz, sp) => {
    const ctx = R.ctx, top = py - (sp.h - 2) * zz, w = sp.w * zz * 0.32;
    for (let i = 0; i < 3; i++) {
      const a = R.t * 3 + i * 2.094, x = Math.round(px + Math.cos(a) * w), y = Math.round(top + Math.sin(a) * 2 * zz), u = Math.max(1, Math.round(zz * 0.8));
      ctx.fillStyle = INK; ctx.fillRect(x - 2 * u, y - u, 5 * u, 4 * u);
      ctx.fillStyle = Math.sin(a) > 0 ? '#c9a4ff' : '#8a5ae8'; ctx.fillRect(x - u, y, 3 * u, u); ctx.fillRect(x, y + u, u, u);
    }
    if (Math.random() < 0.08) R.burst(m.x, m.y - 0.6 * (m.size || 1), 1, ['#c9a4ff', '#8a5ae8'], 0.6, 0.7, 1.5);
  };
  /* à noite o espólio continua visível */
  R.nightMore = (hole) => { for (const d of G.drops) if (d.n > 0) hole(d.x, d.y - 0.3, 1.1, 0.55); };
})();

;
