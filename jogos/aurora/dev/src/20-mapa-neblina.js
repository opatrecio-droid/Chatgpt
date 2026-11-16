/* Aurora 043 · neblina da borda do mapa.
   O mundo termina numa faixa de bruma em vez de uma linha reta. A câmera pode entrar nessa margem
   (ver 20-mapa.patch.txt), então os cantos do mapa deixam de ficar escondidos atrás do HUD. */
(function () {
  'use strict';
  if (G.HEADLESS || !G.R) return;
  const R = G.R, TS = 16;
  const NEAR = [163, 176, 182], FAR = [57, 70, 78];
  const INNER = 3.4;                 // tiles de bruma por dentro da borda
  const OUTER = 7;                   // tiles até a bruma fechar por fora

  /* Quanto a câmera pode passar da borda, em pixels de mundo (metades da tela como referência). */
  R.fogMargin = (hw, hh) => ({ x: hw * 0.55, top: hh * 0.62, bottom: hh * 0.55 });

  const rgb = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  const mix = (a, b, t) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t));

  /* Mechas: elipses de borda irregular com quatro degraus de opacidade (pixel art, sem desfoque). */
  let wispSprites = null, wisps = null;
  const buildSprites = () => {
    const rnd = G.seeded(9043), out = [];
    for (let v = 0; v < 4; v++) {
      const w = 56, h = 26, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const c = cv.getContext('2d'), img = c.createImageData(w, h), ph = rnd() * 6.283, ph2 = rnd() * 6.283;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const nx = (x + 0.5 - w / 2) / (w / 2), ny = (y + 0.5 - h / 2) / (h / 2);
        const wob = 0.1 * Math.sin(nx * 7 + ph) + 0.08 * Math.sin(ny * 9 + nx * 4 + ph2);
        const d = Math.hypot(nx, ny * 1.08) + wob;
        const a = d > 1 ? 0 : d > 0.8 ? 0.2 : d > 0.58 ? 0.42 : d > 0.34 ? 0.62 : 0.78;
        const i = (y * w + x) * 4; img.data[i] = 205; img.data[i + 1] = 215; img.data[i + 2] = 220; img.data[i + 3] = Math.round(a * 255);
      }
      c.putImageData(img, 0, 0); out.push(cv);
    }
    return out;
  };
  const buildWisps = () => {
    const rnd = G.seeded(4307), W = G.W.w, H = G.W.h, per = 2 * (W + H), list = [];
    const n = Math.round(per / 2.6);
    for (let i = 0; i < n; i++) {
      let p = (i + rnd() * 0.8) / n * per, x, y, nx = 0, ny = 0;
      if (p < W) { x = p; y = 0; ny = -1; } else if ((p -= W) < H) { x = W; y = p; nx = 1; } else if ((p -= H) < W) { x = W - p; y = H; ny = 1; } else { p -= W; x = 0; y = H - p; nx = -1; }
      const off = -2.2 + rnd() * 7.6;                       // negativo = por dentro do mapa
      list.push({ x: x + nx * off, y: y + ny * off, w: 6 + rnd() * 7, v: rnd() * 4 | 0, sp: 0.12 + rnd() * 0.22, ph: rnd() * 6.283, a: off < 0 ? 0.26 + rnd() * 0.2 : 0.22 + rnd() * 0.26, tx: nx === 0 ? 1 : 0.25, ty: ny === 0 ? 1 : 0.25 });
    }
    return list;
  };

  R.drawEdgeFog = (ctx, X, Y, z, cw, ch, t) => {
    const W = G.W.w, H = G.W.h, x0 = X(0), y0 = Y(0), x1 = X(W), y1 = Y(H), u = TS * z, fin = INNER * u, fo = OUTER * u;
    if (x0 + fin < 0 && y0 + fin < 0 && x1 - fin > cw && y1 - fin > ch) return;       // a borda está longe: nada a desenhar
    const calm = !!(G.S && (G.S.opts.lowFx || G.S.opts.reduceMotion));
    const near1 = rgb(NEAR, 1), far1 = rgb(FAR, 1), mid1 = rgb(mix(NEAR, FAR, 0.55), 1);
    const lin = (ax, ay, bx, by, stops) => { const g = ctx.createLinearGradient(ax, ay, bx, by); for (const s of stops) g.addColorStop(s[0], s[1]); return g; };
    ctx.save();
    /* 1. por fora: da bruma clara, junto à borda, até a bruma fechada (lados retos + cantos em leque) */
    const OUT = [[0, near1], [0.45, mid1], [1, far1]];
    ctx.fillStyle = far1;
    ctx.beginPath(); ctx.rect(-4, -4, cw + 8, ch + 8); ctx.rect(x0 - fo, y0 - fo, x1 - x0 + 2 * fo, y1 - y0 + 2 * fo); ctx.fill('evenodd');
    ctx.fillStyle = lin(0, y0, 0, y0 - fo, OUT); ctx.fillRect(x0, y0 - fo, x1 - x0, fo + 1);
    ctx.fillStyle = lin(0, y1, 0, y1 + fo, OUT); ctx.fillRect(x0, y1 - 1, x1 - x0, fo + 1);
    ctx.fillStyle = lin(x0, 0, x0 - fo, 0, OUT); ctx.fillRect(x0 - fo, y0, fo + 1, y1 - y0);
    ctx.fillStyle = lin(x1, 0, x1 + fo, 0, OUT); ctx.fillRect(x1 - 1, y0, fo + 1, y1 - y0);
    for (const [cx, cy, sx, sy] of [[x0, y0, -1, -1], [x1, y0, 1, -1], [x0, y1, -1, 1], [x1, y1, 1, 1]]) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, fo); for (const s of OUT) g.addColorStop(s[0], s[1]);
      ctx.fillStyle = far1; ctx.fillRect(sx < 0 ? cx - fo : cx, sy < 0 ? cy - fo : cy, fo, fo);
      ctx.fillStyle = g; ctx.fillRect(sx < 0 ? cx - fo : cx, sy < 0 ? cy - fo : cy, fo, fo);
    }
    /* 2. por dentro: a bruma invade as últimas casas do mapa e some aos poucos */
    const IN = [[0, rgb(NEAR, 0.94)], [0.3, rgb(NEAR, 0.62)], [0.65, rgb(NEAR, 0.24)], [1, rgb(NEAR, 0)]];
    ctx.fillStyle = lin(0, y0, 0, y0 + fin, IN); ctx.fillRect(x0, y0, x1 - x0, fin);
    ctx.fillStyle = lin(0, y1, 0, y1 - fin, IN); ctx.fillRect(x0, y1 - fin, x1 - x0, fin);
    ctx.fillStyle = lin(x0, 0, x0 + fin, 0, IN); ctx.fillRect(x0, y0, fin, y1 - y0);
    ctx.fillStyle = lin(x1, 0, x1 - fin, 0, IN); ctx.fillRect(x1 - fin, y0, fin, y1 - y0);
    /* 3. mechas à deriva dão volume e escondem os degraus */
    if (!wispSprites) { wispSprites = buildSprites(); wisps = buildWisps(); }
    ctx.imageSmoothingEnabled = false;
    for (const w of wisps) {
      const dr = calm ? 0 : Math.sin(t * w.sp + w.ph) * 1.4, wx = w.x + dr * w.tx, wy = w.y + dr * w.ty * 0.5;
      const pw = w.w * u, phh = pw * 0.46, px = X(wx) - pw / 2, py = Y(wy) - phh / 2;
      if (px > cw || py > ch || px + pw < 0 || py + phh < 0) continue;
      ctx.globalAlpha = w.a * (calm ? 1 : 0.85 + 0.15 * Math.sin(t * 0.5 + w.ph));
      ctx.drawImage(wispSprites[w.v], Math.round(px), Math.round(py), Math.round(pw), Math.round(phh));
    }
    ctx.restore();
  };
})();
