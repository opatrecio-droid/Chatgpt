/* 41-art-mon: monstros desenhados por família, 4 quadros cada, com paletas por espécie. */
'use strict';
(function () {
  const A = G.A, Pix = A.Pix, sh = A.shade, mix = A.mix;
  const INK = '#1a1422';
  /* cada desenhista recebe (p, f, pal, d) com f = 0..3 e devolve nada; tamanho do buffer em SIZE */
  const SIZE = { slime: [24, 22], wolf: [30, 24], boar: [30, 24], goblin: [26, 28], skeleton: [26, 28], bat: [28, 24], golem: [30, 30], orc: [30, 30], spider: [30, 22], specter: [24, 28], lich: [34, 40], hydra: [46, 40], dragon: [52, 42] };
  const D = {
    slime(p, f, [b, s, l]) {
      const sq = [0, 1, 0, -1][f];
      const rx = 8 + sq, ry = 6.5 - sq, cy = 20 - ry;
      p.ell(12, cy, rx, ry, b); p.rect(12 - rx, cy, rx * 2, ry, b);
      p.row(12 - rx + 1, 12 + rx - 2, 20, s); p.row(12 - rx + 2, 12 + rx - 3, 19, s);
      p.ell(9, cy - ry * 0.45, 2.6, 1.8, l); p.set(8, cy - ry * 0.5 - 1, '#ffffff');
      const ey = Math.round(cy + 0.5);
      p.rect(9, ey, 2, 3, INK); p.rect(14, ey, 2, 3, INK); p.set(9, ey, '#ffffff'); p.set(14, ey, '#ffffff');
      p.row(11, 13, ey + 3, sh(s, 0.7));
    },
    wolf(p, f, [b, s, l]) {
      const bob = f % 2, lg = [[0, 0, 0, 0], [1, -1, -1, 1], [0, 0, 0, 0], [-1, 1, 1, -1]][f];
      const y = 9 + bob;
      p.ell(13, y + 5, 8.5, 4.5, b); p.rect(6, y + 3, 14, 5, b);                       // corpo
      p.row(7, 19, y + 2, l); p.row(8, 18, y + 9, s); p.row(7, 19, y + 8, s);
      p.tri(5, y + 4, 1, y - 2 + bob, 6, y + 1, b); p.set(2, y - 1 + bob, l);           // cauda
      p.ell(22, y + 3, 4, 3.6, b); p.rect(24, y + 3, 5, 3, b); p.row(25, 28, y + 5, s); // cabeça e focinho
      p.set(29, y + 3, INK); p.tri(20, y, 21, y - 4, 23, y, b); p.tri(23, y, 24, y - 4, 25, y + 1, b); p.set(21, y - 2, s);
      p.set(24, y + 2, l === '#ff7a3a' ? '#ffd070' : '#ffe07a'); p.set(27, y + 6, '#ffffff'); p.set(25, y + 6, '#ffffff');
      const legs = [[7, 0], [10, 1], [16, 2], [19, 3]];
      for (const [lx, i] of legs) { p.rect(lx + lg[i], y + 9, 2, 5 - bob, i % 2 ? b : s); p.rect(lx + lg[i], y + 13 - bob, 3, 1, sh(s, 0.75)); }
      p.row(10, 17, y + 4, mix(b, s, 0.5));
    },
    boar(p, f, [b, s, l]) {
      const bob = f % 2, lg = [0, 1, 0, -1][f], y = 7 + bob;
      p.ell(13, y + 6, 9.5, 6, b); p.rect(5, y + 4, 16, 7, b);
      for (let i = 0; i < 6; i++) p.rect(6 + i * 3, y - 1 + (i % 2), 2, 2, s);           // crina
      p.row(6, 20, y + 11, s); p.row(8, 18, y + 12, s);
      p.ell(23, y + 6, 4.5, 4.5, b); p.rect(25, y + 6, 4, 4, l); p.rect(28, y + 7, 1, 2, sh(l, 0.7));
      p.set(24, y + 4, '#ff5050'); p.set(24, y + 5, INK);
      p.rect(26, y + 10, 1, 3, '#ffffff'); p.rect(28, y + 10, 1, 2, '#ffffff');
      p.tri(20, y + 1, 21, y - 2, 23, y + 2, s);
      p.rect(7 + lg, y + 12, 3, 4 - bob, s); p.rect(11 - lg, y + 12, 3, 4 - bob, b); p.rect(16 + lg, y + 12, 3, 4 - bob, s); p.rect(19 - lg, y + 12, 3, 4 - bob, b);
      p.tri(4, y + 5, 1, y + 3, 4, y + 8, s);
    },
    goblin(p, f, [b, s, l], d) {
      const bob = f % 2, st = [0, 1, 0, -1][f], big = d.big ? 1 : 0, X = 8, Y = 5 + bob - big;
      const robe = d.robe;
      if (!robe) { p.rect(X + 1 + st, 22, 3, 4 - (st > 0 ? 1 : 0), s); p.rect(X + 5 - st, 22, 3, 4 - (st < 0 ? 1 : 0), s); p.rect(X + 1 + st, 25, 3, 1, INK); p.rect(X + 5 - st, 25, 3, 1, INK); }
      if (big) { p.tri(X + 1, 20, X - 5, 24, X + 1, 23, b); p.set(X - 4, 24, s); }
      const bc = robe || (d.burn ? '#6a2a1c' : '#7a5a3a');
      p.rect(X, Y + 10, 9, robe ? 12 - bob : 8, bc); p.col(X + 8, Y + 10, Y + (robe ? 20 : 17), sh(bc, 0.7));
      if (robe) { p.row(X - 1, X + 9, Y + 21 - bob, sh(bc, 0.7)); p.col(X + 4, Y + 11, Y + 20 - bob, l); }
      p.rect(X - 1, Y + 11, 2, 4, b); p.rect(X + 8, Y + 11, 2, 4, b);
      p.rect(X - 1, Y + 1, 11, 9, b); p.rect(X, Y, 9, 11, b); p.col(X + 9, Y + 2, Y + 8, s); p.row(X + 1, X + 8, Y + 10, s);
      p.tri(X - 1, Y + 3, X - 5, Y + 1, X - 1, Y + 6, b); p.tri(X + 10, Y + 3, X + 14, Y + 1, X + 10, Y + 6, b); p.set(X - 3, Y + 3, s); p.set(X + 12, Y + 3, s);
      p.rect(X + 3, Y + 4, 2, 2, d.burn ? '#ffd070' : '#ffe07a'); p.rect(X + 7, Y + 4, 2, 2, d.burn ? '#ffd070' : '#ffe07a'); p.set(X + 4, Y + 5, INK); p.set(X + 8, Y + 5, INK);
      p.row(X + 4, X + 8, Y + 8, INK); p.set(X + 5, Y + 7, '#ffffff'); p.set(X + 7, Y + 7, '#ffffff');
      if (robe) { p.rect(X, Y - 1, 9, 2, robe); p.rect(X - 1, Y, 3, 4, robe); p.col(X + 13, Y + 2, Y + 20, '#6a4a2c'); p.ell(X + 13.5, Y + 1, 2, 2, d.ranged || l); p.set(X + 13, Y, '#ffffff'); }
      else if (big) { p.col(X + 12, Y + 2, Y + 18, '#8a6a3c'); p.tri(X + 11, Y + 2, X + 12.5, Y - 3, X + 14, Y + 2, '#c8d0dc'); }
      else { p.line(X + 10, Y + 14, X + 14, Y + 6, '#8a6a3c'); p.rect(X + 13, Y + 4, 3, 4, '#9a8a7a'); p.set(X + 14, Y + 4, '#c8c0b0'); }
    },
    skeleton(p, f, [b, s, l]) {
      const bob = f % 2, st = [0, 1, 0, -1][f], X = 8, Y = 4 + bob;
      p.rect(X + 2 + st, 20, 2, 6, b); p.rect(X + 6 - st, 20, 2, 6, b); p.rect(X + 1 + st, 25, 3, 1, s); p.rect(X + 6 - st, 25, 3, 1, s);
      p.rect(X + 1, Y + 11, 8, 2, b); p.rect(X + 2, Y + 13, 6, 5, b); p.row(X + 2, X + 7, Y + 14, INK); p.row(X + 2, X + 7, Y + 16, INK); p.col(X + 4, Y + 11, Y + 17, s); p.rect(X + 3, Y + 18, 4, 1, s);
      p.rect(X - 1, Y + 11, 2, 6, b); p.set(X - 1, Y + 17, s); p.rect(X + 9, Y + 11, 2, 5, b);
      p.rect(X, Y, 10, 9, b); p.rect(X + 1, Y + 9, 7, 2, b); p.row(X + 1, X + 8, Y, l); p.col(X + 9, Y + 2, Y + 7, s);
      p.rect(X + 3, Y + 3, 2, 3, INK); p.rect(X + 7, Y + 3, 2, 3, INK); p.set(X + 3, Y + 4, '#ff6040'); p.set(X + 7, Y + 4, '#ff6040'); p.set(X + 6, Y + 6, INK);
      p.row(X + 2, X + 7, Y + 9, INK); p.set(X + 3, Y + 9, b); p.set(X + 5, Y + 9, b); p.set(X + 7, Y + 9, b);
      p.line(X + 11, Y + 15, X + 15, Y + 4, '#8a8a92'); p.line(X + 12, Y + 15, X + 16, Y + 4, '#6a5a4a'); p.row(X + 9, X + 12, Y + 15, '#6a4a2c');
    },
    bat(p, f, [b, s, l], d) {
      const up = [0, 1, 2, 1][f], y = 10 + [0, -1, 0, 1][f];
      const wy = y - 4 + up * 3;
      p.tri(11, y, 1, wy - 2, 4, y + 5, b); p.tri(17, y, 27, wy - 2, 24, y + 5, b);
      p.tri(11, y + 1, 3, wy + 1, 7, y + 5, s); p.tri(17, y + 1, 25, wy + 1, 21, y + 5, s);
      p.line(11, y, 1, wy - 2, l); p.line(17, y, 27, wy - 2, l);
      p.ell(14, y + 2, 4, 4.5, b); p.ell(14, y + 4, 3, 2.5, s);
      p.tri(10, y - 1, 11, y - 5, 13, y - 1, b); p.tri(15, y - 1, 17, y - 5, 18, y - 1, b);
      p.set(12, y + 1, '#ff5050'); p.set(16, y + 1, '#ff5050'); p.set(13, y + 4, '#ffffff'); p.set(15, y + 4, '#ffffff');
      if (d.name === 'Vespa Gigante') { p.row(11, 17, y + 3, l); p.row(12, 16, y + 5, l); p.line(14, y + 6, 14, y + 10, l); p.set(14, y + 11, '#ffffff'); }
      if (d.name === 'Harpia') { p.rect(12, y + 6, 1, 4, '#e0b050'); p.rect(15, y + 6, 1, 4, '#e0b050'); p.rect(11, y - 3, 6, 2, '#e8c8a0'); }
    },
    golem(p, f, [b, s, l], d) {
      const bob = f % 2, st = [0, 1, 0, -1][f], Y = 3 + bob, glow = d.burn ? '#ffb040' : d.name.indexOf('Treant') >= 0 ? '#9be08a' : '#ffe07a';
      p.rect(9 + st, 23, 5, 5, s); p.rect(17 - st, 23, 5, 5, s); p.rect(8 + st, 27, 6, 1, sh(s, 0.7)); p.rect(17 - st, 27, 6, 1, sh(s, 0.7));
      p.rect(7, Y + 8, 17, 13, b); p.rect(9, Y + 6, 13, 3, b); p.row(8, 22, Y + 8, l); p.col(23, Y + 9, Y + 20, s); p.row(8, 22, Y + 20, s);
      p.rect(2, Y + 9, 5, 12 - st, b); p.rect(1, Y + 19 - st, 6, 4, s); p.rect(24, Y + 9, 5, 12 + st, b); p.rect(24, Y + 19 + st, 6, 4, s); p.col(2, Y + 10, Y + 18, l);
      p.rect(11, Y, 9, 7, b); p.row(12, 18, Y, l); p.col(19, Y + 1, Y + 6, s);
      p.rect(13, Y + 3, 2, 2, glow); p.rect(17, Y + 3, 2, 2, glow);
      p.line(12, Y + 11, 15, Y + 14, glow); p.line(15, Y + 14, 13, Y + 17, glow); p.line(19, Y + 12, 18, Y + 16, glow);
      if (d.name.indexOf('Treant') >= 0) { p.ell(15, Y - 1, 7, 3, l); p.ell(10, Y + 1, 3, 2, l); p.ell(21, Y + 1, 3, 2, l); p.set(13, Y - 2, '#c8f0a0'); }
    },
    orc(p, f, [b, s, l], d) {
      const bob = f % 2, st = [0, 1, 0, -1][f], X = 9, Y = 4 + bob, fur = d.name === 'Yeti';
      p.rect(X + 1 + st, 23, 4, 5, fur ? b : '#5a4a3a'); p.rect(X + 7 - st, 23, 4, 5, fur ? b : '#5a4a3a'); p.rect(X + st, 27, 5, 1, INK); p.rect(X + 7 - st, 27, 5, 1, INK);
      p.rect(X - 1, Y + 10, 14, 10, b); p.col(X + 12, Y + 11, Y + 19, s); p.row(X, X + 11, Y + 19, fur ? s : '#6a4a2c');
      if (!fur) { p.rect(X + 1, Y + 13, 10, 5, '#7a5a3a'); p.row(X + 1, X + 10, Y + 13, '#9a7a4a'); }
      p.rect(X - 4, Y + 10, 4, 9, b); p.rect(X - 4, Y + 18, 4, 3, s); p.rect(X + 12, Y + 10, 4, 8, b); p.rect(X + 12, Y + 17, 4, 3, s);
      p.rect(X + 1, Y, 10, 10, b); p.rect(X, Y + 2, 12, 7, b); p.row(X + 2, X + 9, Y, l); p.col(X + 11, Y + 3, Y + 8, s);
      p.rect(X + 3, Y + 4, 2, 2, fur ? '#4a90d0' : '#ff5050'); p.rect(X + 8, Y + 4, 2, 2, fur ? '#4a90d0' : '#ff5050'); p.row(X + 3, X + 9, Y + 3, s);
      p.row(X + 3, X + 9, Y + 8, INK); p.rect(X + 3, Y + 6, 1, 2, '#ffffff'); p.rect(X + 9, Y + 6, 1, 2, '#ffffff');
      if (fur) { p.set(X, Y + 1, l); p.set(X + 11, Y + 1, l); p.row(X, X + 11, Y + 10, l); }
      else { p.line(X + 15, Y + 17, X + 19, Y + 3, '#6a4a2c'); p.rect(X + 17, Y, 4, 6, '#8a8a92'); p.set(X + 18, Y + 1, '#c8c8d0'); p.set(X + 20, Y + 3, '#c8c8d0'); }
    },
    spider(p, f, [b, s, l]) {
      const k = f % 2, y = 9 + k;
      for (let i = 0; i < 4; i++) { const o = (i + f) % 2; p.line(12, y + 3, 3 - o + i, y - 3 + i * 3 + o, s); p.line(3 - o + i, y - 3 + i * 3 + o, 1 + i, y + 6 + i * 1.5, s); p.line(18, y + 3, 27 + o - i, y - 3 + i * 3 + o, s); p.line(27 + o - i, y - 3 + i * 3 + o, 28 - i, y + 6 + i * 1.5, s); }
      p.ell(11, y + 3, 6, 5, b); p.ell(10, y + 2, 3, 2, mix(b, l, 0.35)); p.set(11, y + 4, l); p.set(9, y + 5, l); p.set(13, y + 5, l);
      p.ell(19, y + 4, 4, 3.5, b); p.row(17, 21, y + 7, s);
      p.set(19, y + 3, l); p.set(21, y + 3, l); p.set(20, y + 5, l); p.set(22, y + 5, l); p.set(22, y + 7, '#ffffff'); p.set(20, y + 7, '#ffffff');
    },
    specter(p, f, [b, s, l]) {
      const bob = [0, -1, 0, 1][f], w = [0, 1, 0, -1][f], Y = 4 + bob;
      const a = b + 'd8', sa = s + 'd0';
      p.ell(12, Y + 6, 7, 6.5, a); p.rect(5, Y + 6, 14, 11, a);
      for (let i = 0; i < 4; i++) p.tri(5 + i * 3.5 + w, Y + 17, 7 + i * 3.5 + w, Y + 22 - (i % 2) * 2, 9 + i * 3.5 + w, Y + 17, a);
      p.col(18, Y + 5, Y + 16, sa); p.col(17, Y + 9, Y + 16, sa);
      p.ell(12, Y + 7, 4.5, 4, sh(s, 0.45) + 'f0');
      p.rect(9, Y + 6, 2, 2, l); p.rect(13, Y + 6, 2, 2, l); p.set(9, Y + 6, '#ffffff'); p.set(13, Y + 6, '#ffffff');
      p.ell(9, Y + 2, 3, 1.2, mix(b, '#ffffff', 0.5) + 'd8');
      p.rect(2 - w, Y + 11, 3, 2, a); p.rect(19 + w, Y + 11, 3, 2, a);
    },
    lich(p, f, [b, s, l]) {
      const bob = [0, -1, 0, 1][f], Y = 6 + bob, robe = '#3a2a5a', robeS = '#241a3c';
      p.rect(9, Y + 13, 16, 16, robe); p.tri(9, Y + 29, 5, Y + 33, 13, Y + 29, robe); p.tri(13, Y + 29, 17, Y + 34, 21, Y + 29, robe); p.tri(21, Y + 29, 26, Y + 33, 25, Y + 29, robe);
      p.col(24, Y + 14, Y + 29, robeS); p.col(23, Y + 20, Y + 29, robeS); p.col(17, Y + 14, Y + 28, l); p.row(10, 23, Y + 13, mix(robe, l, 0.5));
      p.rect(5, Y + 14, 5, 10, robe); p.rect(4, Y + 22, 4, 3, b); p.rect(24, Y + 14, 5, 9, robe); p.rect(26, Y + 21, 4, 3, b);
      p.rect(11, Y, 12, 11, b); p.rect(12, Y + 11, 9, 2, b); p.row(12, 21, Y, '#ffffff'); p.col(22, Y + 2, Y + 9, s);
      p.rect(13, Y + 4, 3, 3, INK); p.rect(18, Y + 4, 3, 3, INK); p.set(14, Y + 5, l); p.set(19, Y + 5, l); p.set(17, Y + 8, INK);
      p.row(13, 20, Y + 11, INK); p.set(14, Y + 11, b); p.set(16, Y + 11, b); p.set(18, Y + 11, b);
      p.rect(10, Y - 2, 14, 2, '#e2b659'); p.tri(10, Y - 2, 11, Y - 6, 13, Y - 2, '#e2b659'); p.tri(15, Y - 2, 17, Y - 7, 19, Y - 2, '#e2b659'); p.tri(21, Y - 2, 23, Y - 6, 24, Y - 2, '#e2b659'); p.set(17, Y - 4, l);
      p.col(31, Y - 2, Y + 30, '#6a4a2c'); p.col(30, Y + 4, Y + 30, '#4a3220'); p.ell(31, Y - 4, 3, 3, l); p.ell(30, Y - 5, 1, 1, '#ffffff');
    },
    hydra(p, f, [b, s, l], d) {
      const sw = [0, 1, 0, -1][f];
      p.ell(23, 30, 16, 8.5, b); p.ell(23, 33, 14, 5, s); p.row(10, 36, 28, mix(b, l, 0.25));
      for (let i = 0; i < 5; i++) p.tri(11 + i * 6, 24, 13 + i * 6, 20, 15 + i * 6, 24, s);
      p.tri(38, 30, 45, 36 + sw, 38, 36, b); p.rect(10, 35, 6, 4, s); p.rect(30, 35, 6, 4, s); p.row(9, 16, 38, INK); p.row(29, 36, 38, INK);
      const necks = [[14, -1], [23, 0], [32, 1]];
      necks.forEach(([nx, k], i) => {
        const o = i === 1 ? -sw : sw, hx = nx + k * 5 + o, hy = 6 + (i === 1 ? 0 : 5) + (i === 1 ? sw : -sw);
        for (let t = 0; t <= 12; t++) { const u = t / 12; const x = nx + (hx - nx) * u + Math.sin(u * 3.14) * k * 2, y = 25 + (hy + 5 - 25) * u; p.ell(x, y, 3, 2.6, b); p.set(x + 2, y, s); }
        p.ell(hx, hy + 2, 5, 4, b); p.rect(hx - (k < 0 ? 8 : -2), hy + 1, 6, 4, b); p.row(hx - 4, hx + 4, hy - 1, mix(b, l, 0.3));
        p.rect(hx - 2, hy, 2, 2, d.poison ? '#c8ffa0' : '#ffe07a'); p.rect(hx + 1, hy, 2, 2, d.poison ? '#c8ffa0' : '#ffe07a'); p.set(hx - 1, hy + 1, INK); p.set(hx + 2, hy + 1, INK);
        p.row(hx - 4, hx + 4, hy + 5, INK); p.set(hx - 3, hy + 4, '#ffffff'); p.set(hx, hy + 4, '#ffffff'); p.set(hx + 3, hy + 4, '#ffffff');
        p.tri(hx - 3, hy - 1, hx - 2, hy - 4, hx - 1, hy - 1, l); p.tri(hx + 1, hy - 1, hx + 2, hy - 4, hx + 3, hy - 1, l);
      });
    },
    dragon(p, f, [b, s, l], d) {
      const fl = [0, 1, 2, 1][f], bob = [0, 1, 0, -1][f], fire = d.burn ? '#ffb040' : '#c8f0ff';
      /* asas */
      const wy = 8 + fl * 4;
      p.tri(22, 20, 4, wy - 4, 12, 24, s); p.tri(22, 20, 14, wy - 6, 20, 24, sh(s, 0.85)); p.line(22, 20, 4, wy - 4, l); p.line(22, 20, 14, wy - 6, l);
      p.tri(28, 20, 46, wy - 2, 38, 24, s); p.line(28, 20, 46, wy - 2, l);
      /* cauda e corpo */
      p.tri(10, 32, 1, 38 + bob, 12, 37, b); p.tri(1, 38 + bob, 0, 34 + bob, 4, 37 + bob, l);
      p.ell(24, 30 + bob, 14, 8, b); p.ell(24, 33 + bob, 11, 4.5, mix(b, l, 0.45));
      for (let i = 0; i < 5; i++) p.tri(14 + i * 4, 23 + bob, 16 + i * 4, 19 + bob, 18 + i * 4, 23 + bob, s);
      p.rect(14, 35 + bob, 6, 5 - bob, s); p.rect(29, 35 + bob, 6, 5 - bob, s); p.row(13, 20, 40, INK); p.row(28, 35, 40, INK); p.set(14, 41, '#ffffff'); p.set(17, 41, '#ffffff'); p.set(29, 41, '#ffffff'); p.set(32, 41, '#ffffff');
      /* pescoço e cabeça */
      for (let t = 0; t <= 10; t++) { const u = t / 10; p.ell(34 + u * 7, 26 + bob - u * 14, 4 - u, 3.4, b); }
      const hx = 43, hy = 10 + bob;
      p.ell(hx, hy, 6, 4.5, b); p.rect(hx + 2, hy - 1, 7, 5, b); p.row(hx + 3, hx + 8, hy + 3, s); p.row(hx - 3, hx + 6, hy - 4, mix(b, l, 0.3));
      p.rect(hx + 1, hy - 2, 2, 2, fire); p.set(hx + 2, hy - 1, INK); p.set(hx + 8, hy, INK);
      p.tri(hx - 4, hy - 3, hx - 7, hy - 9, hx - 1, hy - 4, l); p.tri(hx, hy - 4, hx - 2, hy - 10, hx + 3, hy - 4, l);
      p.set(hx + 4, hy + 4, '#ffffff'); p.set(hx + 6, hy + 4, '#ffffff'); p.set(hx + 8, hy + 4, '#ffffff');
      if (f === 1 || f === 2) { p.set(hx + 10, hy + 1, fire); p.set(hx + 10, hy + 3, fire); }
    },
  };
  const sheets = new Map();
  /* folha com 4 quadros; elite ganha contorno dourado */
  A.monSheet = (k, elite) => {
    const key = k + '|' + (elite ? 1 : 0); let s = sheets.get(key); if (s) return s;
    const d = G.MON[k], [w, h] = SIZE[d.fam];
    const cv = A.mk(w * 4, h), x = cv.getContext('2d');
    for (let f = 0; f < 4; f++) { const p = new Pix(w, h); D[d.fam](p, f, d.pal, d); p.outline(elite ? '#ffd35a' : INK); if (elite) p.outline('#7a4a10'); x.drawImage(p.canvas(), f * w, 0); }
    s = { cv, w, h }; sheets.set(key, s); return s;
  };
  /* silhueta branca para o piscar de dano */
  const flashes = new Map();
  A.flashOf = (cv) => { let f = flashes.get(cv); if (f) return f; f = A.mk(cv.width, cv.height); const x = f.getContext('2d'); x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#ffffff'; x.fillRect(0, 0, f.width, f.height); if (flashes.size > 300) flashes.clear(); flashes.set(cv, f); return f; };
  A.monPortrait = (k) => { const s = A.monSheet(k, 0); const cv = A.mk(s.w, s.h); cv.getContext('2d').drawImage(s.cv, 0, 0, s.w, s.h, 0, 0, s.w, s.h); return cv.toDataURL(); };
})();
