/* 68-ui-colosso: v25 — arte dos três Colossos (pixel art procedural), desenho no mundo (respiração, brilho, golpes telegrafados),
   faixa e barra grande de vida no HUD, aba "Colosso" em Missões (ranking, marcos, convocação) e as cerimônias do baú e do
   prêmio da semana. A simulação mora em 3C-colosso.js. Só interface. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = G.UI, A = G.A, R = G.R, ic = UI.ic, esc = UI.esc, $ = UI.$;
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
  const css = document.createElement('style'); css.textContent = ''; document.head.appendChild(css);
  const bar = (fn, cls) => '<div class="bar ' + (cls || '') + '"><i ' + UI.vw().W(fn) + '></i></div>';
  /* ================= arte dos Colossos (pixel art procedural, bem maior que os chefes de zona) ================= */
  const Pix = A.Pix, INK = '#1a1422', sh = A.shade, mix = A.mix, C = A.C;
  /* pixel com cor hexadecimal, só se estiver dentro do buffer */
  const rgbOf = (hex) => A.rgb(hex);
  /* volume: elipse com 4 tons (luz, base, sombra, fundo) e pontilhado nas fronteiras, luz vindo de cima à esquerda */
  const vol = (p, cx, cy, rx, ry, tones, o) => {
    o = o || {}; const [lt, bs, sd, dp] = tones, lx = o.lx == null ? -0.55 : o.lx, ly = o.ly == null ? -0.7 : o.ly;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, r2 = dx * dx + dy * dy; if (r2 > 1) continue;
      const l = (dx * lx + dy * ly) / (1 + Math.abs(lx) + Math.abs(ly)) * -1.9 + (1 - r2) * 0.28, chk = ((x + y) & 1) ? 0.06 : -0.06;   // l alto = iluminado
      const v = l + chk;
      p.set(x, y, v > 0.5 ? lt : v > 0.08 ? bs : v > -0.36 ? sd : dp);
    }
  };
  /* polígono preenchido (varredura par-ímpar) */
  const poly = (p, pts, c) => {
    c = C(c); let y0 = 1e9, y1 = -1e9; for (const q of pts) { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const xs = []; const yy = y + 0.5;
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= yy && b[1] > yy) || (b[1] <= yy && a[1] > yy)) xs.push(a[0] + (yy - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
      xs.sort((a, b) => a - b); for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) p.set(x, y, c);
    }
  };
  const hh = (x, y, s) => (G.hash(x + '|' + y + '|' + s) & 255) / 255;
  /* ruído de pedra: troca alguns pixels já pintados por um tom vizinho (sem pintar fora da silhueta) */
  const grain = (p, a, b, prob, seed) => {
    const ca = C(a), cb = C(b);
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if (p.d[y * p.w + x] === ca && hh(x, y, seed) < prob) p.d[y * p.w + x] = cb;
  };
  /* só os pixels de uma cor (para as camadas que brilham) */
  const only = (p, cols) => { const q = new Pix(p.w, p.h), set = new Set(cols.map(C)); for (let i = 0; i < p.d.length; i++) if (set.has(p.d[i])) q.d[i] = p.d[i]; return q; };

  /* ---------- Grão-Casco: tartaruga de pedra-vulcão (124×88), de perfil, olhando para a direita ---------- */
  const drawCasco = () => {
    const p = new Pix(124, 88), pal = G.COLOSSI[0].pal, rock = ['#a08672', '#7a5a4a', '#4e3a34', '#2c201e'], lava = '#ff8a3a', lavaL = '#ffd070', lavaD = '#c2410c';
    const gy = 84;
    /* sombra do ventre entre as pernas */
    p.ell(62, gy - 8, 40, 6, '#1a1210');
    /* pernas de trás (do outro lado, mais escuras) */
    vol(p, 46, 72, 9, 13, [rock[2], rock[3], rock[3], '#1a1210']); vol(p, 96, 72, 9, 13, [rock[2], rock[3], rock[3], '#1a1210']);
    p.rect(38, gy - 4, 17, 4, rock[3]); p.rect(88, gy - 4, 17, 4, rock[3]);
    /* corpo debaixo do casco, pescoço e cauda */
    vol(p, 60, 66, 40, 12, rock);
    p.tri(14, 66, 4, 76, 22, 74, rock[1]); p.line(14, 68, 6, 75, rock[2]);
    vol(p, 100, 58, 10, 9, rock);
    /* cabeça */
    vol(p, 112, 55, 11, 9.5, rock); vol(p, 117, 60, 6, 4.5, rock);
    p.tri(106, 46, 111, 38, 114, 48, rock[0]); p.tri(112, 47, 119, 41, 118, 50, rock[1]);          // pontas de pedra sobre a sobrancelha
    p.rect(108, 53, 5, 3, lavaD); p.rect(109, 53, 3, 2, lava); p.set(110, 53, lavaL); p.set(111, 54, INK);   // olho de brasa
    p.row(113, 121, 61, rock[3]); p.set(121, 60, lava); p.set(117, 62, lavaD);                      // boca e uma fresta de lava
    p.set(120, 56, rock[3]);
    /* pernas da frente (mais claras, em primeiro plano) */
    vol(p, 33, 71, 10, 14, [rock[0], rock[0], rock[1], rock[2]], { lx: -0.7, ly: -0.3 }); vol(p, 84, 71, 10, 14, [rock[0], rock[0], rock[1], rock[2]], { lx: -0.7, ly: -0.3 });
    p.col(27, 64, 78, rock[2]); p.col(78, 64, 78, rock[2]);
    p.rect(24, gy - 5, 20, 5, rock[2]); p.rect(75, gy - 5, 20, 5, rock[2]);
    for (const x of [27, 33, 39, 78, 84, 90]) { p.set(x, gy - 4, rock[0]); p.set(x, gy - 5, rock[1]); }   // garras
    /* casco: cúpula de placas com lava entre elas */
    const cx = 58, cy = 54, rx = 46, ry = 38;
    const inDome = (x, y) => { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; return dx * dx + dy * dy <= 1 && y < 62; };
    const dome = new Pix(124, 88);
    for (let y = 0; y < 88; y++) for (let x = 0; x < 124; x++) if (inDome(x, y)) dome.set(x, y, lavaD);
    /* placas hexagonais */
    const plates = []; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) { const x = 18 + c * 13 + (r % 2 ? 6.5 : 0), y = 20 + r * 11.4; plates.push([x, y]); }
    for (const [x, y] of plates) {
      const w = 6.1, hgt = 6.4; const hx = [[x - w, y - hgt * 0.5], [x, y - hgt], [x + w, y - hgt * 0.5], [x + w, y + hgt * 0.5], [x, y + hgt], [x - w, y + hgt * 0.5]];
      const shadeTone = (x - cx) * -0.5 + (y - cy) * -0.7;   // placas do alto e da esquerda mais claras
      const tone = shadeTone > 14 ? rock[0] : shadeTone > -8 ? rock[1] : shadeTone > -30 ? rock[2] : rock[3];
      const q = new Pix(124, 88); poly(q, hx, tone);
      for (let i = 0; i < q.d.length; i++) if (q.d[i] && dome.d[i]) dome.d[i] = q.d[i];
      /* realce no canto de cima de cada placa */
      for (let k = 0; k < 4; k++) { const hx0 = Math.round(x - 3 + k), hy0 = Math.round(y - hgt + 2 + (k < 1 ? 1 : 0)); const i = hy0 * 124 + hx0; if (q.d[i] && dome.d[i] && tone !== rock[3]) dome.d[i] = C(mix(tone === rock[0] ? '#ffffff' : rock[0], '#ffffff', 0.15)); }
    }
    for (let y = 0; y < 88; y++) for (let x = 0; x < 124; x++) { const c = dome.d[y * 124 + x]; if (c && c !== C(lavaD)) { const up = dome.d[(y - 1) * 124 + x]; if (up === C(lavaD)) dome.d[y * 124 + x] = C(mix(pal[0], '#ffffff', 0.25)); } }
    /* brilho das frestas: lava viva no meio, brasa nas bordas */
    for (let y = 1; y < 87; y++) for (let x = 1; x < 123; x++) if (dome.d[y * 124 + x] === C(lavaD)) { const n = dome.d[y * 124 + x - 1] + dome.d[y * 124 + x + 1] + dome.d[(y - 1) * 124 + x] + dome.d[(y + 1) * 124 + x]; dome.d[y * 124 + x] = n % 2 && hh(x, y, 'l') < 0.5 ? C(lava) : C(lavaD); if (hh(x, y, 'k') < 0.18) dome.d[y * 124 + x] = C(lavaL); }
    p.blit(dome, 0, 0);
    /* borda do casco: faixa escura embaixo da cúpula com dentes */
    for (let x = 12; x < 106; x += 5) { p.tri(x, 62, x + 5, 62, x + 2.5, 68 - ((x / 5) & 1), rock[2]); }
    p.row(13, 104, 62, rock[3]); p.row(14, 103, 61, rock[2]);
    /* três vulcõezinhos no alto do casco */
    for (const [vx, vy, s] of [[44, 17, 1], [62, 13, 1.25], [78, 19, 0.9]]) {
      p.tri(vx - 7 * s, vy + 9, vx + 7 * s, vy + 9, vx, vy - 4 * s, rock[1]); p.tri(vx - 1, vy + 9, vx + 7 * s, vy + 9, vx, vy - 4 * s, rock[2]); p.line(vx - 6 * s, vy + 8, vx, vy - 3 * s, rock[0]);
      p.rect(vx - 2, vy - 5 * s, 4, 3, lavaD); p.set(vx - 1, vy - 5 * s, lava); p.set(vx, vy - 6 * s, lavaL); p.set(vx + 1, vy - 5 * s, lavaL);
    }
    grain(p, rock[1], rock[2], 0.16, 'a'); grain(p, rock[2], rock[1], 0.1, 'b'); grain(p, rock[0], rock[1], 0.1, 'c');
    const full = p.outline(INK);
    return { full, glow: only(full, [lava, lavaL, lavaD]), eye: [109.5, 54], vents: [[44, 11], [62, 6], [78, 14]] };
  };

  /* ---------- Cristalão: golem de cristal da Fenda (112×112), de frente ---------- */
  const drawCristal = () => {
    const p = new Pix(112, 112), pal = G.COLOSSI[1].pal, T = ['#f0d0ff', '#c88af0', '#8a44d8', '#5a2ac8', '#2f1670'], core = '#fff6ff';
    /* pernas */
    poly(p, [[34, 78], [54, 78], [52, 108], [30, 108]], T[2]); poly(p, [[34, 78], [44, 78], [40, 108], [30, 108]], T[3]); poly(p, [[44, 78], [54, 78], [52, 108], [44, 108]], T[2]);
    poly(p, [[58, 78], [78, 78], [82, 108], [60, 108]], T[2]); poly(p, [[58, 78], [68, 78], [64, 108], [60, 108]], T[1]); poly(p, [[68, 78], [78, 78], [82, 108], [64, 108]], T[3]);
    p.rect(26, 106, 30, 5, T[4]); p.rect(58, 106, 30, 5, T[4]);
    /* braços (atrás do tronco) */
    poly(p, [[14, 34], [26, 40], [24, 82], [6, 86], [2, 62]], T[3]); poly(p, [[14, 34], [20, 37], [14, 84], [6, 86], [2, 62]], T[2]); poly(p, [[22, 38], [26, 40], [24, 82], [18, 84]], T[4]);
    poly(p, [[98, 34], [86, 40], [88, 82], [106, 86], [110, 62]], T[3]); poly(p, [[98, 34], [92, 37], [98, 84], [106, 86], [110, 62]], T[1]); poly(p, [[90, 38], [86, 40], [88, 82], [94, 84]], T[4]);
    /* punhos: blocos facetados */
    poly(p, [[2, 80], [20, 78], [26, 92], [16, 104], [4, 102], [0, 90]], T[2]); poly(p, [[2, 80], [12, 79], [10, 103], [4, 102], [0, 90]], T[1]); poly(p, [[12, 79], [20, 78], [26, 92], [16, 104], [10, 103]], T[3]);
    poly(p, [[110, 80], [92, 78], [86, 92], [96, 104], [108, 102], [112, 90]], T[3]); poly(p, [[92, 78], [102, 79], [100, 103], [96, 104], [86, 92]], T[1]); poly(p, [[102, 79], [110, 80], [112, 90], [108, 102], [100, 103]], T[4]);
    /* tronco: trapézio invertido com facetas */
    poly(p, [[22, 34], [90, 34], [78, 82], [34, 82]], T[2]);
    poly(p, [[22, 34], [56, 34], [50, 82], [34, 82]], T[1]); poly(p, [[56, 34], [90, 34], [78, 82], [50, 82]], T[3]);
    poly(p, [[22, 34], [40, 34], [44, 60], [30, 56]], T[0]); poly(p, [[72, 34], [90, 34], [82, 58], [70, 60]], T[2]);
    poly(p, [[34, 82], [78, 82], [72, 90], [40, 90]], T[4]);
    /* ombros: cachos de cristal */
    for (const [sx, sy, hgt, w, t] of [[20, 36, 22, 7, 0], [30, 32, 30, 8, 1], [40, 34, 16, 6, 2], [92, 36, 22, 7, 3], [82, 32, 30, 8, 2], [72, 34, 16, 6, 1]]) {
      poly(p, [[sx - w, sy + 6], [sx, sy - hgt], [sx + w, sy + 6]], T[t > 2 ? 3 : t === 2 ? 2 : 1]); poly(p, [[sx - w, sy + 6], [sx, sy - hgt], [sx - 1, sy + 6]], T[t === 0 ? 0 : 1]);
    }
    /* cabeça: octógono facetado com uma fenda de olhar */
    poly(p, [[44, 24], [50, 14], [62, 14], [68, 24], [66, 36], [46, 36]], T[2]); poly(p, [[44, 24], [50, 14], [56, 14], [56, 36], [46, 36]], T[1]); poly(p, [[56, 14], [62, 14], [68, 24], [66, 36], [56, 36]], T[3]);
    poly(p, [[52, 14], [56, 2], [60, 14]], T[0]); poly(p, [[56, 2], [60, 14], [56, 14]], T[1]);
    p.rect(48, 25, 16, 4, T[4]); p.rect(49, 26, 14, 2, core); p.set(55, 26, '#ffffff'); p.set(56, 26, '#ffffff');
    /* coração: losango luminoso no peito */
    poly(p, [[56, 44], [66, 58], [56, 74], [46, 58]], T[1]); poly(p, [[56, 48], [63, 58], [56, 70], [49, 58]], core); poly(p, [[56, 52], [60, 58], [56, 66], [52, 58]], '#ffffff');
    p.line(56, 44, 56, 36, T[0]); p.line(40, 62, 46, 58, T[0]); p.line(72, 62, 66, 58, T[0]);
    /* rachaduras claras */
    p.line(40, 44, 46, 56, T[0]); p.line(70, 70, 76, 80, T[1]); p.line(36, 70, 42, 78, T[3]); p.line(26, 52, 24, 74, T[4]);
    grain(p, T[2], T[1], 0.07, 'g'); grain(p, T[3], T[2], 0.07, 'h');
    const full = p.outline(INK);
    return { full, glow: only(full, [core, '#ffffff']), eye: [56, 26], heart: [56, 58] };
  };

  /* ---------- Nevoeirão: serpente de névoa (112×104), com o capelo aberto, olhando para a direita ---------- */
  const drawNevoa = () => {
    const p = new Pix(112, 104), S = ['#e8f8ff', '#bcd8e8', '#7c9ab4', '#4a6a80', '#3d2618'], TONES = [S[1], S[2], S[3], S[4]];
    /* névoa e espirais no chão */
    vol(p, 56, 96, 50, 8, [S[2], S[3], S[4], S[4]]);
    vol(p, 56, 90, 44, 9, TONES); vol(p, 54, 81, 37, 9, TONES); vol(p, 58, 72, 29, 8, [S[0], S[1], S[2], S[3]]);
    for (let x = 14; x < 98; x += 6) { p.set(x, 90, S[0]); p.set(x + 3, 91, S[1]); }
    for (let x = 22; x < 92; x += 6) p.set(x, 81, S[0]);
    /* pescoço em S, fino, cadeia de círculos que afinam para o alto */
    const path = []; for (let i = 0; i <= 44; i++) { const t = i / 44; path.push([56 - Math.sin(t * 5.0) * 14 * (1 - t * 0.2) + t * 12, 72 - t * 50, 9.4 - t * 3.0]); }
    for (const [x, y, r] of path) vol(p, x, y, r, r, TONES, { lx: -0.7, ly: -0.2 });
    /* ventre claro em listras (lado do olhar) */
    for (const [x, y, r] of path) { const bx = Math.round(x + r * 0.45), yy = Math.round(y); p.set(bx, yy, yy % 3 === 0 ? S[2] : S[0]); p.set(bx - 1, yy, yy % 3 === 0 ? S[1] : S[0]); }
    /* escamas: losangos em pontilhado */
    for (let y = 26; y < 100; y += 3) for (let x = 10; x < 106; x += 4) { const xx = x + ((y / 3) & 1) * 2, c = p.get(xx, y); if (c === C(S[2])) p.set(xx, y, S[1]); else if (c === C(S[3])) p.set(xx, y, S[2]); }
    /* capelo aberto atrás da cabeça, com duas manchas de olhos falsos */
    const hx = path[44][0], hy = path[44][1];
    vol(p, hx - 3, hy + 2, 15, 19, [S[1], S[2], S[3], S[4]], { lx: -0.5, ly: -0.5 });
    vol(p, hx - 3, hy + 2, 10, 14, [S[0], S[1], S[2], S[3]]);
    vol(p, hx - 8, hy + 3, 3.2, 3.6, [S[4], S[4], S[4], S[4]]); vol(p, hx + 1, hy + 3, 3.2, 3.6, [S[4], S[4], S[4], S[4]]); p.set(hx - 9, hy + 2, '#ffffff'); p.set(hx, hy + 2, '#ffffff');
    for (let k = 0; k < 7; k++) { p.set(hx - 17 + k * 0.5, hy - 10 + k * 3, S[0]); p.set(hx + 11 - k * 0.5, hy - 10 + k * 3, S[3]); }
    /* cabeça de lado: focinho triangular para a direita, olho aceso, presas e língua */
    vol(p, hx + 6, hy - 7, 12, 7.5, [S[0], S[1], S[2], S[3]], { lx: -0.5, ly: -0.8 });
    p.tri(hx + 12, hy - 12, hx + 27, hy - 5, hx + 12, hy - 1, S[1]); p.tri(hx + 12, hy - 5, hx + 27, hy - 5, hx + 12, hy - 1, S[2]); p.line(hx + 12, hy - 3, hx + 26, hy - 5, S[4]);
    p.rect(hx + 8, hy - 11, 5, 3, S[4]); p.rect(hx + 9, hy - 11, 3, 2, '#bff4ff'); p.set(hx + 10, hy - 11, '#ffffff'); p.line(hx + 6, hy - 13, hx + 14, hy - 12, S[4]);   // sobrancelha e olho
    p.tri(hx + 17, hy - 3, hx + 19, hy - 3, hx + 18, hy + 3, '#ffffff'); p.tri(hx + 22, hy - 4, hx + 24, hy - 4, hx + 23, hy + 1, '#ffffff');   // presas
    p.line(hx + 27, hy - 5, hx + 33, hy - 3, '#ff8aa8'); p.set(hx + 34, hy - 4, '#ff8aa8'); p.set(hx + 34, hy - 2, '#ff8aa8');
    grain(p, S[2], S[1], 0.07, 'n'); grain(p, S[3], S[2], 0.07, 'm');
    const full = p.outline(INK);
    return { full, glow: only(full, ['#ffffff', '#bff4ff']), eye: [hx + 10.5, hy - 10], head: [hx, hy] };
  };

  /* uma folha por Colosso: { cv, glow, w, h, ... } com tudo desenhado uma vez só */
  const ART = {};
  const spriteOf = (id) => {
    if (ART[id]) return ART[id];
    const mk = { casco: drawCasco, cristal: drawCristal, nevoa: drawNevoa }[id](), cv = mk.full.canvas(), gl = mk.glow.canvas();
    return (ART[id] = Object.assign({ cv, gl, w: cv.width, h: cv.height, flash: A.flashOf(cv) }, mk, { full: null, glow: null }));
  };
  G.colossoArt = spriteOf;

  /* ================= desenho do Colosso no mundo ================= */
  /* estilhaços que giram em volta do Cristalão (7×11) */
  let shardCv = null;
  const shardSheet = () => {
    if (shardCv) return shardCv;
    shardCv = A.mk(24, 12); const x = shardCv.getContext('2d');
    [[0, 5, 11], [8, 4, 9], [16, 3, 7]].forEach(([ox, w, h], k) => {
      const p = new Pix(8, 12), T = ['#f0d0ff', '#c88af0', '#8a44d8', '#5a2ac8'];
      poly(p, [[w / 2 + 1, 0], [w + 1, h * 0.55], [w / 2 + 1, h], [0.5, h * 0.55]], T[2]); poly(p, [[w / 2 + 1, 0], [w / 2 + 1, h], [0.5, h * 0.55]], T[1]); poly(p, [[w / 2 + 1, 1], [w / 2 + 1, 4], [2, h * 0.5]], T[0]); void k;
      x.drawImage(p.outline(INK).canvas(), ox, 0);
    });
    return shardCv;
  };
  const dprOf = () => Math.min(3, window.devicePixelRatio || 1);
  const TS = 16;
  const glowDot = (ctx, x, y, r, col, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
  const run = G.colossoRun;
  const drawColosso = (e, X, Y, z, over, dt) => {
    const ctx = R.ctx, S = G.S, c = S.colosso; if (!c) return;
    const m = run.m && !run.m.gone ? run.m : null, dy = run.dying;
    if (!m && !dy) return;
    const dd = G.COLOSSI[c.id], a = spriteOf(dd.id), zz = z, t = R.t;
    const wx = m ? m.x : dy.x, wy = m ? m.y : dy.y, flip = m && m.dir < 0 && dd.id === 'casco' ? -1 : 1;
    const dead = !!(m ? m.dead : dy), awake = run.near > 0 || (m && m.swing > 0), hp = m ? Math.max(0, m.hp) / m.hpMax : 0, angry = hp < 0.35 && !dead;
    const px = Math.round(X(wx)), base = Math.round(Y(wy + 0.7));
    let br = Math.sin(t * (awake ? 1.9 : 1.1) + 0.5) * (angry ? 1.5 : 1), sy = 1 + 0.013 * br, sx = 1 - 0.005 * br, lift = 0, shx = 0, alpha = 1;
    if (run.cast) { const mv = run.cast.kind === 'quake' ? 2.6 : run.cast.kind === 'rain' ? 1.9 : 1.5, k = clamp01(1 - run.cast.t / mv); sy += 0.06 * Math.sin(k * 1.57); lift = Math.sin(k * 1.57) * 5 * zz; }
    if (m && m.swing > 0) shx = (m.dir || 1) * Math.sin((m.swing / 0.3) * Math.PI) * 5 * zz;
    if (angry) shx += Math.sin(t * 40) * 0.8 * zz;
    if (dead && dy) { const k = dy.t; shx += Math.sin(t * 55) * Math.max(0, 3 - k) * zz; sy = Math.max(0.3, 1 - k * 0.22); sx = 1 + k * 0.05; alpha = k > 2 ? Math.max(0, 1 - (k - 2) / 2) : 1; }
    const W = a.w * zz * sx, H = a.h * zz * sy, x0 = px - W / 2 + shx, y0 = base - H - lift;
    /* sombra no chão */
    ctx.save(); ctx.globalAlpha = 0.3 * alpha; ctx.fillStyle = '#0a0612'; ctx.beginPath(); ctx.ellipse(px, base - 2 * zz, a.w * 0.46 * zz, a.w * 0.1 * zz, 0, 0, 6.283); ctx.fill(); ctx.restore();
    ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = false;
    /* estilhaços que ficam atrás */
    const shards = dd.id === 'cristal' && !dead ? 6 : 0, sc = shardSheet();
    const drawShards = (front) => {
      for (let i = 0; i < shards; i++) {
        const ang = t * 0.55 + i * 1.047, cs = Math.cos(ang), sn = Math.sin(ang); if ((sn > 0) !== front) continue;
        const sxp = px + cs * 62 * zz, syp = base - (54 + Math.sin(t * 1.4 + i) * 5) * zz + sn * 10 * zz, f = i % 3;
        ctx.drawImage(sc, f * 8, 0, 8, 12, Math.round(sxp - 4 * zz), Math.round(syp - 6 * zz), 8 * zz, 12 * zz);
      }
    };
    drawShards(false);
    /* corpo (a serpente balança por fileiras, o resto respira inteiro) */
    if (dd.id === 'nevoa' && !dead) {
      for (let r = 0; r < a.h; r++) {
        const k = 1 - r / a.h, off = Math.sin(t * 1.25 + r * 0.075) * 4.2 * Math.pow(k, 1.4) * zz + Math.sin(t * 0.7 + r * 0.03) * 1.5 * k * zz;
        ctx.drawImage(a.cv, 0, r, a.w, 1, Math.round(x0 + off), Math.round(y0 + r * zz * sy), W, Math.ceil(zz * sy) + 1);
        if (m && m.flash > 0) { ctx.globalAlpha = 0.3 * Math.min(1, m.flash / 0.12) * alpha; ctx.drawImage(a.flash, 0, r, a.w, 1, Math.round(x0 + off), Math.round(y0 + r * zz * sy), W, Math.ceil(zz * sy) + 1); ctx.globalAlpha = alpha; }
      }
    } else {
      if (flip < 0) { ctx.translate(px, 0); ctx.scale(-1, 1); ctx.translate(-px, 0); }
      ctx.drawImage(a.cv, Math.round(x0), Math.round(y0), W, H);
      if (m && m.flash > 0) { ctx.globalAlpha = 0.3 * Math.min(1, m.flash / 0.12) * alpha; ctx.drawImage(a.flash, Math.round(x0), Math.round(y0), W, H); ctx.globalAlpha = alpha; }
      /* brilho das frestas, do olho e do coração */
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (0.22 + 0.22 * Math.sin(t * 2.2) + (angry ? 0.25 : 0) + (dead ? 0.4 : 0)) * alpha;
      ctx.drawImage(a.gl, Math.round(x0), Math.round(y0), W, H);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = alpha;
      if (flip < 0) { ctx.translate(px, 0); ctx.scale(-1, 1); ctx.translate(-px, 0); }
    }
    ctx.globalCompositeOperation = 'lighter';
    const ex = x0 + (flip < 0 ? W - a.eye[0] * zz * sx : a.eye[0] * zz * sx), ey = y0 + a.eye[1] * zz * sy;
    glowDot(ctx, ex, ey, (awake ? 9 : 5) * zz, dd.glow, (awake ? 0.7 : 0.35) * alpha);
    if (a.heart) glowDot(ctx, x0 + a.heart[0] * zz * sx, y0 + a.heart[1] * zz * sy, (8 + 2 * Math.sin(t * 2.6)) * zz, '#ffe6ff', (0.3 + 0.18 * Math.sin(t * 2.6)) * alpha);
    ctx.globalCompositeOperation = 'source-over';
    drawShards(true);
    ctx.restore();
    /* partículas: brasas do casco, névoa da serpente, brilho do cristal */
    if (!dead && !S.opts.lowFx) {
      e._em = (e._em || 0) - dt;
      if (e._em <= 0) {
        e._em = awake ? 0.09 : 0.2;
        if (dd.id === 'casco') { const v = a.vents[(Math.random() * 3) | 0]; R.burst(wx + (flip * (v[0] - a.w / 2)) / TS, wy + 0.7 - (a.h - v[1]) / TS, 2, ['#ff8a3a', '#ffd070', '#ff5a2a'], 1.6, 0.9, -2.2); }
        else if (dd.id === 'nevoa') R.burst(wx + G.rnd(-3.4, 3.4), wy + 0.5, 2, ['#e8f8ff', '#bcd8e8'], 0.6, 1.1, -0.4);
        else R.burst(wx + G.rnd(-2.6, 2.6), wy - G.rnd(0.5, 5), 1, ['#f0d0ff', '#c88af0', '#ffffff'], 0.8, 0.8, -1);
      }
    }
    if (dead && dy) { dy._em = (dy._em || 0) - dt; if (dy._em <= 0) { dy._em = 0.1; R.burst(wx + G.rnd(-3, 3), wy - G.rnd(0, 4), 5, [dd.glow, '#ffffff', dd.pal[0]], 3.2, 0.9, 3); } }
    /* nome e vida sobre o Colosso */
    if (m && !dead) over.push(() => {
      const top = y0 - 2 * zz, w = Math.max(70, 62 * zz), dpr = dprOf();
      ctx.font = Math.round(15 * dpr) + 'px "Aurora Pixel",monospace'; ctx.textAlign = 'center'; ctx.lineWidth = Math.max(2, dpr * 2.4); ctx.lineJoin = 'round';
      const txt = dd.name + ' · Nv ' + c.lvl; ctx.strokeStyle = 'rgba(16,12,24,.92)'; ctx.strokeText(txt, px, top - 7 * zz); ctx.fillStyle = '#fff0c8'; ctx.fillText(txt, px, top - 7 * zz);
      const h = Math.max(4, Math.round(zz * 2.2)), bx = Math.round(px - w / 2), by = Math.round(top - 5.2 * zz);
      ctx.fillStyle = 'rgba(16,12,24,.9)'; ctx.fillRect(bx - 2, by - 2, w + 4, h + 4);
      const g = ctx.createLinearGradient(bx, 0, bx + w, 0); g.addColorStop(0, dd.pal[2]); g.addColorStop(1, dd.glow);
      ctx.fillStyle = g; ctx.fillRect(bx, by, Math.max(2, Math.round(w * hp)), h);
      ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(bx, by, Math.max(2, Math.round(w * hp)), Math.max(1, Math.round(h * 0.35)));
      ctx.fillStyle = 'rgba(255,255,255,.7)'; for (const mk of G.COLOSSO.marks) ctx.fillRect(Math.round(bx + w * (1 - mk)) - 1, by - 1, 1, h + 2);   // o que falta é o lado direito: marcos medem o dano feito
    });
  };
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const dm0 = R.dynMore;
  R.dynMore = (dyn, vx0, vx1, vy0, vy1) => {
    if (dm0) dm0(dyn, vx0, vx1, vy0, vy1);
    const m = run.m && !run.m.gone ? run.m : null, dy = run.dying, x = m ? m.x : dy ? dy.x : 0, y = m ? m.y : dy ? dy.y : 0;
    if ((m || dy) && x > vx0 - 8 && x < vx1 + 8 && y > vy0 - 2 && y < vy1 + 10) dyn.push({ y: y - 0.5, k: 'x', e: run, f: drawColosso });
  };
  const nm0 = R.nightMore;
  R.nightMore = (hole) => { if (nm0) nm0(hole); if (run.m && !run.m.dead) hole(run.m.x, run.m.y - 2.5, 7, 0.7); };
  /* o inspetor (toque no Colosso) pede o retrato do monstro: uma miniatura da arte grande */
  const ms0 = A.monSheet;
  A.monSheet = (k, elite) => {
    const d = G.MON[k]; if (!d || !d.colosso) return ms0(k, elite);
    const dd = G.COLOSSI.find((x) => x.mon === k), a = spriteOf(dd.id), cv = A.mk(Math.round(a.w / 2), Math.round(a.h / 2)), x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(a.cv, 0, 0, cv.width, cv.height);
    return { cv, w: cv.width, h: cv.height };
  };
  /* relíquias do Colosso: uma gema de 16×16 na cor dele */
  const cu0 = A.cosURL, relicUrls = {};
  A.cosURL = (id, h) => {
    const d = G.COS[id]; if (!d || !d.colosso) return cu0(id, h);
    if (relicUrls[id]) return relicUrls[id];
    const p = new Pix(16, 16), c = d.c, dk = sh(c, 0.55), lt = mix(c, '#ffffff', 0.6);
    if (d.colosso === 'casco') { vol(p, 8, 9, 6.5, 6, [lt, c, dk, sh(c, 0.3)]); p.line(5, 6, 8, 10, '#ffe6a8'); p.line(8, 10, 11, 7, '#ffe6a8'); p.line(8, 10, 8, 14, '#ffe6a8'); p.set(8, 2, c); p.set(7, 3, lt); p.set(9, 3, lt); }
    else if (d.colosso === 'cristal') { poly(p, [[8, 0], [14, 7], [8, 15], [2, 7]], c); poly(p, [[8, 0], [8, 15], [2, 7]], lt); poly(p, [[8, 0], [14, 7], [8, 15]], dk); p.set(6, 6, '#ffffff'); p.set(7, 5, '#ffffff'); }
    else { vol(p, 8, 8, 6.5, 6.5, [lt, c, dk, sh(c, 0.4)]); p.line(4, 8, 12, 8, dk); p.line(5, 5, 11, 11, lt); p.set(9, 4, '#ffffff'); p.tri(6, 10, 10, 10, 8, 15, '#ffffff'); }
    return (relicUrls[id] = p.outline(INK).canvas().toDataURL());
  };

  /* ================= a aba "Colosso" em Missões ================= */
  const emblem = (r, px) => (UI.arenaEmblem ? UI.arenaEmblem(r, px) : '');
  const portraitUrl = {};
  const portrait = (id) => portraitUrl[id] || (portraitUrl[id] = spriteOf(id).cv.toDataURL());
  const chips = (p, words) => {
    const o = []; if (p.nucleos) o.push(ic('core') + p.nucleos + (words ? ' Núcleo' + (p.nucleos > 1 ? 's' : '') : '')); if (p.selos) o.push(ic('seal') + p.selos + (words ? ' Selo' + (p.selos > 1 ? 's' : '') : ''));
    if (p.po_reforja) o.push(ic('hammer') + p.po_reforja + (words ? ' Pó de Reforja' : '')); if (p.tomo) o.push(ic('book') + p.tomo + (words ? ' Tomo' + (p.tomo > 1 ? 's' : '') : ''));
    if (p.alma) o.push(ic('spark') + p.alma + (words ? ' Cristais de Alma' : '')); if (p.gold) o.push(ic('coin') + G.fmt(p.gold) + (words ? ' moedas' : ''));
    return '<span class="co-ch">' + o.join('</span><span class="co-ch">') + '</span>';
  };
  const ordinal = (n) => n + 'º';
  const MODES = [['Livre', 'Cerca de metade dos heróis aptos vai sozinha; os outros seguem na caçada.'], ['Convocar', 'Todos os aptos largam a caça e marcham para a Cratera.'], ['Dispensar', 'Ninguém vai. O Colosso fica dormindo.']];
  let rkAll = false;
  const standingRows = (st) => {
    const n = st.list.length, me = st.me - 1, keep = new Set([0, 1, 2, n - 1]);
    for (let k = me - 2; k <= me + 2; k++) if (k >= 0 && k < n) keep.add(k);
    let h = '', last = -1;
    st.list.forEach((x, k) => {
      if (!rkAll && !keep.has(k)) return;
      if (k !== last + 1) h += '<div class="co-gap">⋯</div>';
      last = k;
      if (x.i < 0) h += '<div class="ar-rk me" style="--lc:var(--gold)"><span class="ps">' + x.pos + '</span>' + emblem(UI.arenaAUR || { c1: '#1f2c66', c2: '#f7dc92', pat: 'chief', sym: 'moon' }, 26) + '<span class="nm">Aurora (você)<small>' + (G.S.colosso.win ? 'Colosso derrubado' : G.S.colosso.hpMax ? Math.round(100 * G.S.colosso.dmg / G.S.colosso.hpMax) + '% da vida dele' : '') + '</small></span><span class="pt2">' + G.fmt(x.dmg) + '</span></div>';
      else { const r = G.arenaRival(x.i); h += '<div class="ar-rk" style="--lc:' + G.COLOSSI[G.S.colosso.id].glow + '"><span class="ps">' + x.pos + '</span>' + emblem(r, 26) + '<span class="nm">' + esc(r.name) + '<small>' + esc(r.lead.title) + ' ' + esc(r.lead.name) + '</small></span><span class="pt2">' + G.fmt(x.dmg) + '</span></div>'; }
    });
    return h;
  };
  const colTab = () => {
    const S = G.S, v = UI.vw(), inf = G.colossoInfo(), c = inf.c, d = inf.d, w = inf.w;
    let h = '<div class="co-hero" style="--cg:' + d.glow + '"><i class="co-pt" style="background-image:url(' + portrait(d.id) + ')"></i><div class="gr"><div class="co-ey">Colosso da Semana</div><h3>' + esc(d.name) + '</h3><small>' + esc(d.kind) + '</small></div></div>';
    c.seen = c.wk;
    if (!inf.open) return h + '<div class="card lock"><div class="row">' + ic('lock') + '<div class="gr"><h3>A Cratera ainda dorme</h3><p>Todo fim de semana um Colosso desperta lá no sudoeste. Ele acorda com o Nível de Reino ' + G.COLOSSO.open + ' e pelo menos 3 heróis.</p></div></div></div>';
    const left = (ms) => G.fmtLeft(Math.max(0, ms));
    if (inf.warn) h += '<div class="card hl co-warn"><h3>' + ic('skull') + 'A terra treme na Cratera…</h3><p>' + esc(d.lore) + '</p><p><b class="gold">Desperta em ' + left(w.startAt - w.ms) + '</b> (sexta-feira, 00:00) e fica até domingo à noite. Deixe os heróis descansados, com poções e comida.</p></div>';
    else if (w.phase === 'rest' && !c.hpMax) h += '<div class="card"><h3>Esta semana: ' + esc(d.name) + '</h3><p>' + esc(d.lore) + '</p><p class="mut">A terra começa a tremer na quinta-feira (em ' + left(w.warnAt - w.ms) + '). Ele desperta na sexta, 00:00, e fica até domingo à noite.</p></div>';
    else if (c.hpMax) {
      const pct = () => Math.round(100 * Math.max(0, S.colosso.hp) / S.colosso.hpMax);
      h += '<div class="card hl co-st"><div class="row"><div class="gr"><h3>' + (c.win ? 'Derrubado!' : inf.on ? 'Desperto na Cratera' : 'Voltou a dormir') + '</h3><p>' + (c.win ? 'Aurora derrubou o ' + esc(d.name) + '. O baú já está no cofre.' : inf.on ? 'Termina em <b class="gold">' + left(w.endAt - w.ms) + '</b> (domingo, 23:59).' : 'O ' + esc(d.name) + ' voltou a dormir.') + '</p></div><span class="pill ' + (c.win ? 'gold' : '') + '">Nv ' + c.lvl + '</span></div>' +
        '<div class="co-bar">' + bar(() => pct(), 'big p') + '<span class="co-pcr">' + v.T(() => pct() + '% · ' + G.fmt(S.colosso.hp)) + '</span></div>' +
        '<div class="co-nums"><div><small>Vida total</small><b>' + G.fmt(c.hpMax) + '</b></div><div><small>Dano de Aurora</small><b>' + v.T(() => G.fmt(S.colosso.dmg)) + '</b></div><div><small>Lutando agora</small><b>' + v.T(() => (G.colossoRun.near || 0) + ' de ' + S.heroes.length) + '</b></div></div></div>';
      if (inf.live) {
        h += '<div class="sec">Convocação</div><div class="seg">' + MODES.map(([n], i) => '<button data-a="colmode:' + i + '" class="' + (c.mode === i ? 'on' : '') + '">' + n + '</button>').join('') + '</div><p class="mut co-md">' + MODES[c.mode][1] + ' Quem luta aqui não perde espólio se cair (é batalha honrosa) e recebe soldo de caçada.</p>' +
          '<button class="btn wide" data-a="goto:12:93">' + ic('target') + 'Ver na Cratera</button>';
      }
      /* marcos pessoais */
      h += '<div class="sec">Marcos de dano</div>';
      G.COLOSSO.marks.forEach((mk, i) => {
        const done = c.mk > i, p = G.colossoMarkPrize(i), val = Math.round(mk * c.hpMax), cur = c.mk === i;
        h += '<div class="card co-mk' + (done ? ' done' : '') + '"><div class="row"><span class="co-mi">' + (done ? ic('check') : (i + 1)) + '</span><div class="gr"><h3>' + Math.round(mk * 100) + '% da vida · ' + G.fmt(val) + ' de dano</h3>' + chips(p) + '</div></div>' + (cur ? '<div style="margin-top:7px">' + bar(() => { const nm = G.colossoNextMark(); return nm ? Math.round(100 * nm.pct) : 100; }, 'big g') + '</div>' : '') + '</div>';
      });
      h += '<div class="card co-mk' + (c.win ? ' done' : '') + '"><div class="row"><span class="co-mi">' + (c.win ? ic('check') : ic('crown')) + '</span><div class="gr"><h3>Derrubar o ' + esc(d.name) + '</h3>' + chips(G.colossoChest()) + '<p style="margin-top:4px"><b class="gold">+ ' + esc(G.COS[d.relic].name) + '</b> (relíquia exclusiva) e bônus de abate rápido no ranking: até +25% de dano.</p></div></div></div>';
      /* ranking */
      const st = G.colossoStanding();
      h += '<div class="sec">Ranking da semana</div><div class="card hl"><div class="row"><div class="gr"><h3>Você está em ' + ordinal(st.me) + ' de ' + st.n + '</h3><p>Dano total da semana contra os 40 reinos rivais da Arena. Eles também enfrentam o Colosso e mudam de posição mesmo quando você não joga.</p></div></div></div>' + '<div class="co-rks">' + standingRows(st) + '</div>' +
        '<button class="btn wide" style="margin-top:6px" data-a="colrk">' + (rkAll ? 'Mostrar só o resumo' : 'Ver a tabela completa') + '</button>';
      const rp = G.colossoRankPrize(st.me);
      h += '<p class="mut" style="text-align:center;font-size:15px;margin:8px 0 2px">Prêmio da posição de hoje (entregue na virada da semana):</p><div style="text-align:center">' + chips(rp) + '</div>';
      /* destaques */
      const top = Object.keys(c.hero).map((id) => ({ n: c.hn[id], d: c.hero[id] })).sort((a, b) => b.d - a.d).slice(0, 3);
      if (top.length) { h += '<div class="sec">Destaques da semana</div>'; top.forEach((x, i) => { h += '<div class="kv"><span>' + (i + 1) + 'º · ' + esc(x.n) + '</span><b>' + G.fmt(x.d) + '</b></div>'; }); }
    }
    if (c.hist.length) { h += '<div class="sec">Semanas anteriores</div>'; for (const r of c.hist.slice().reverse()) h += '<div class="kv"><span>' + esc(G.COLOSSI[r.id].name) + (r.win ? ' · derrubado' : ' · ' + Math.round(100 * r.pct) + '%') + '</span><b>' + (r.pos ? ordinal(r.pos) + ' de ' + r.n : 'não enfrentou') + '</b></div>'; }
    h += '<p class="mut" style="text-align:center;font-size:15px;margin-top:10px">Um Colosso por semana, em rodízio: Grão-Casco, Cristalão e Nevoeirão. A terra treme na quinta; ele desperta na sexta, 00:00, e a vida dele fica guardada entre as sessões. A semana vira na segunda-feira, à meia-noite, pelo relógio do aparelho.</p>';
    return h;
  };
  const M = UI.SHEETS && UI.SHEETS.missoes;
  if (M) {
    const render0 = M.render;
    M.render = function (tab, sub) { return tab === 'colosso' ? colTab() : render0.call(M, tab, sub); };
    M.badge.colosso = () => { const i = G.colossoInfo(); return i.open && i.on && i.c.seen !== i.c.wk ? 1 : 0; };
    const syncTab = () => {
      const has = M.tabs.some((t) => t[0] === 'colosso'), want = !!G.S && G.colossoOpen();
      if (want && !has) { let k = M.tabs.findIndex((t) => t[0] === 'arena'); if (k < 0) k = M.tabs.findIndex((t) => t[0] === 'contratos'); M.tabs.splice(k + 1, 0, ['colosso', 'Colosso']); }
      else if (!want && has) M.tabs.splice(M.tabs.findIndex((t) => t[0] === 'colosso'), 1);
    };
    G.on('start', syncTab); G.on('colosso', syncTab);
    const open0 = UI.open; UI.open = (n, t, s) => { if (n === 'missoes') syncTab(); return open0(n, t, s); };
  }
  const mb0 = UI.badges.missoes;
  UI.badges.missoes = () => mb0() + (G.S && G.colossoOpen() && G.colossoInfo().on && G.S.colosso.seen !== G.S.colosso.wk ? 1 : 0);
  Object.assign(UI.ACT, {
    colmode: (a) => { G.colossoCall(+a[0]); G.sfx('click'); UI.sheetDirty(); UI.toast(['Os heróis aptos decidem sozinhos.', 'Todos os aptos marcham para a Cratera!', 'Ninguém vai ao Colosso.'][+a[0]], +a[0] === 1 ? 'boss' : 'info', 'skull'); },
    colrk: () => { rkAll = !rkAll; UI.sheetDirty(); },
  });

  /* ================= faixa no HUD e barra grande de vida ================= */
  css.textContent += '\n' + [
    '.co-hero{background:#2a1814;position:relative;display:flex;align-items:flex-end;gap:12px;padding:12px;margin-bottom:8px;border:var(--u) solid var(--line);overflow:hidden;,linear-gradient(#1a1630 0 28%,#1b110c 28% 100%)}',
    '.co-hero .co-pt{flex:none;width:112px;height:92px;background-size:contain;background-repeat:no-repeat;background-position:50% 100%;image-rendering:pixelated;}',
    '.co-hero .gr{min-width:0}.co-hero h3{font-family:var(--fh);font-size:20px;letter-spacing:.05em;color:var(--gold2);line-height:1.1}',
    '.co-hero small{display:block;margin-top:3px;font-size:15px;font-weight:700;color:#cfd5e4}',
    '.co-ey{font-family:var(--fh);font-size:8px;font-family:var(--fc);letter-spacing:.22em;text-transform:uppercase;color:var(--cg);margin-bottom:3px}',
    '.co-warn h3{display:flex;align-items:center;gap:8px;color:#ffb0a0}.co-warn h3 ',
    '.co-bar{position:relative;margin-top:10px}.co-bar .bar{height:16px}.co-bar .bar i{background:linear-gradient(#ffd070 0 28%,#ff7a3a 28% 100%)}',
    '.co-pcr{position:absolute;inset:0;display:grid;place-items:center;font-size:15px;font-weight:900;color:#fff;text-shadow:var(--u) var(--u) 0 var(--ol);}',
    '.co-nums{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px}.co-nums>div{padding:7px 8px;background:var(--inset);text-align:center}',
    '.co-nums small{display:block;font-size:8px;font-family:var(--fc);font-weight:700;color:var(--mut)}.co-nums b{font-size:15px;color:var(--gold2)}',
    '.co-md{font-size:15px;margin:6px 2px 8px}',
    '.co-mk .row{align-items:center}.co-mi{flex:none;width:30px;height:30px;display:grid;place-items:center;font-weight:900;font-size:15px;color:var(--gold2);background:var(--inset);border:var(--u) solid rgba(226,182,89,.5)}.co-mk.done{opacity:.72}.co-mk.done .co-mi{background:var(--gold);color:#1a1408}',
    '.co-ch{display:inline-flex;align-items:center;gap:4px;margin:4px 5px 0 0;padding:2px 8px;height:22px;font-size:15px;font-weight:800;background:var(--fill2);border:var(--u) solid var(--line2);color:#eef0f6}.co-ch .i{color:var(--gold2)}',
    '.co-gap{text-align:center;color:var(--mut);font-size:15px;line-height:10px;margin:1px 0 3px}',
    '.ar-rk .pt2{font-variant-numeric:tabular-nums}.co-rks .ar-rk.me{position:static}',
    '#colbar .cb-t{display:flex;align-items:center;justify-content:space-between;gap:8px;font-family:var(--fh);font-size:15px;color:#ffd9b0;margin-bottom:4px;letter-spacing:.03em}',
    '#colbar .cb-t .i{color:#ffb070;flex:none}#colbar .cb-t span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}#colbar .cb-t em{font-style:normal;font-family:var(--fb);font-weight:900;font-size:15px;color:#fff;flex:none}',
    '#colbar .cb-b{position:relative;height:14px;background:var(--inset);overflow:hidden;box-shadow:inset 0 0 0 var(--u) rgba(255,255,255,.12)}',
    '#colbar .cb-b i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(var(--c2) 0 28%,var(--c1) 28% 100%);transition:width .4s}',
    '#colbar .cb-b i::after{content:"";position:absolute;left:0;right:0;top:0;height:40%;background:var(--fill2)}',
    '#colbar .cb-b u{position:absolute;top:0;bottom:0;width:2px;margin-left:-1px;background:var(--fill2)}',
    '#colbar .cb-n{margin-top:3px;display:flex;justify-content:space-between;font-size:8px;font-family:var(--fc);font-weight:700;color:var(--mut)}',
    '@media (max-height:700px){#colbar{padding:4px 10px 5px}#colbar .cb-n{display:none}#colbar .cb-t{margin-bottom:3px}}',
  ].join('\n');
  let lastChip = '', lastBar = '';
  const bd0 = UI.build;
  UI.build = () => {
    bd0();
    const row = $('#hudx'), bb = $('#bossbar');
    if (row && !$('#hudx .col')) row.insertAdjacentHTML('beforeend', '<button class="col" data-a="open:missoes:colosso" style="display:none"></button>');
    if (bb && !$('#colbar')) bb.insertAdjacentHTML('afterend', '<button id="colbar" class="glass" data-a="open:missoes:colosso"><div class="cb-t"><span></span><em></em></div><div class="cb-b"><i></i></div><div class="cb-n"><span></span><span></span></div></button>');
  };
  const paint = () => {
    const S = G.S; if (!S || !G.M.running) return;
    const chip = $('#hudx .col'), bar = $('#colbar'); if (!chip || !bar) return;
    const inf = G.colossoInfo(), d = inf.d, c = inf.c;
    /* chip no HUD: aviso (quinta) e Colosso desperto (sexta a domingo) */
    let key = '', html = '', cls = 'col';
    if (inf.open && inf.warn) { key = 'w|' + G.fmtLeft(inf.left); cls += ' warn'; html = ic('skull') + '<b>A terra treme</b><small>Colosso em ' + G.fmtLeft(inf.left) + '</small>'; }
    else if (inf.open && inf.on && c.win) { key = 'v|' + d.id; cls += ' win'; html = ic('crown') + '<b>Colosso derrubado</b>'; }
    else if (inf.open && inf.on && c.hpMax) { const pct = Math.max(0, Math.round(100 * c.hp / c.hpMax)); key = 'o|' + d.id + '|' + pct + '|' + G.fmtLeft(inf.left); html = ic('skull') + '<b>' + esc(d.name) + ' ' + pct + '%</b><small>' + G.fmtLeft(inf.left) + '</small>'; }
    if (key !== lastChip) { lastChip = key; chip.style.display = key ? '' : 'none'; chip.className = cls; chip.innerHTML = html; }
    /* barra grande: quando o Colosso está de pé e há herói lutando ou a câmera está perto dele */
    const m = inf.live ? G.colossoRun.m : null; let show = false;
    if (m) { const cam = S.cam, near = cam ? Math.hypot(cam.x / TS - m.x, cam.y / TS - m.y) < 14 : false; show = inf.fighters > 0 || near; }
    if (show) {
      const pct = Math.max(0, c.hp / c.hpMax), k = d.id + '|' + Math.round(pct * 500) + '|' + inf.fighters;
      if (k !== lastBar) {
        lastBar = k; bar.style.setProperty('--c1', d.glow); bar.style.setProperty('--c2', d.pal[1]);
        bar.querySelector('.cb-t span').innerHTML = ic('skull') + ' ' + esc(d.name) + ' · Nv ' + c.lvl; bar.querySelector('.cb-t em').textContent = (pct * 100).toFixed(pct < 0.1 ? 1 : 0).replace('.', ',') + '%';
        const b = bar.querySelector('.cb-b'); if (!b.querySelector('u')) b.insertAdjacentHTML('beforeend', G.COLOSSO.marks.map((mk) => '<u style="left:' + Math.round(100 * (1 - mk)) + '%"></u>').join(''));
        bar.querySelector('.cb-b i').style.width = (pct * 100).toFixed(1) + '%';
        const ns = bar.querySelectorAll('.cb-n span'); ns[0].textContent = G.fmt(c.hp) + ' de ' + G.fmt(c.hpMax); ns[1].textContent = inf.fighters ? inf.fighters + (inf.fighters > 1 ? ' heróis lutando' : ' herói lutando') : 'dormindo';
      }
    } else lastBar = '';
    bar.classList.toggle('on', show);
  };
  /* ================= cerimônias: baú do Colosso e prêmio da semana (pela fila de janelas) ================= */
  const winModal = (r) => {
    const d = G.COLOSSI[r.id], rel = G.COS[r.relic];
    UI.modal('<div class="eyebrow">O Colosso caiu</div><h2>' + esc(d.name) + ' foi derrubado!</h2>' +
      '<div class="co-hero" style="--cg:' + d.glow + ';justify-content:center"><i class="co-pt" style="background-image:url(' + portrait(d.id) + ');opacity:.55;filter:grayscale(.6) drop-shadow(0 4px 8px rgba(0,0,0,.6))"></i></div>' +
      '<p class="lead" style="margin:4px 4px 6px">A Cratera inteira ouviu. O baú do Colosso já está no seu cofre:</p><div style="text-align:center">' + chips(r.chest, 1) + '</div>' +
      '<div class="card hl" style="margin-top:10px"><div class="row"><i class="thumb px" style="background-image:url(' + A.cosURL(r.relic) + ');background-size:contain"></i><div class="gr"><h3 class="rar' + rel.rar + '">' + esc(rel.name) + '</h3><p><b class="gold">Relíquia exclusiva</b> · ' + G.COS_SLOT_NAME.reliquia + '</p><p>' + esc(rel.desc) + ' Vista-a na ficha de um herói (espaço da relíquia).</p></div></div></div>' +
      (r.mvp ? '<div class="kv"><span>Destaque da luta</span><b>' + esc(r.mvp.name) + ' · ' + G.fmt(r.mvp.dmg) + '</b></div>' : '') +
      (G.S.colosso.bonus ? '<div class="kv"><span>Bônus de abate rápido (no ranking)</span><b>+' + G.fmt(G.S.colosso.bonus) + '</b></div>' : '') +
      '<p class="mut" style="text-align:center;font-size:15px;margin-top:8px">O prêmio da posição no ranking chega na virada da semana, na segunda-feira.</p>' +
      '<div class="acts"><button class="btn pri" data-a="mclose">Glória a Aurora!</button></div>', { lock: true, onClose: () => { popPend('win'); } });
    G.sfx('victory');
  };
  const rankModal = (r) => {
    const d = G.COLOSSI[r.id];
    UI.modal('<div class="eyebrow">Semana do ' + esc(d.name) + '</div><h2>O Colosso partiu</h2>' +
      '<div class="ar-bx" style="--lc:' + d.glow + ';--lg:' + rgba(d.glow, 0.5) + '"><div class="ps">' + r.pos + 'º<small> de ' + r.n + '</small></div><div style="font-size:15px;color:#cfd5e4;margin-top:4px">' + G.fmt(r.dmg + (r.bonus || 0)) + ' de dano · ' + Math.round(100 * r.dmg / r.hpMax) + '% da vida' + (r.win ? ' · derrubado' : '') + '</div></div>' +
      '<p class="lead" style="margin:6px 4px 4px">O prêmio da sua posição já está no cofre:</p><div style="text-align:center">' + chips(r.prize, 1) + '</div>' +
      (r.top && r.top.length ? '<div class="sec">No topo</div>' + r.top.map((x, i) => x.i < 0 ? '<div class="kv"><span>' + (i + 1) + 'º · Aurora</span><b>' + G.fmt(x.dmg) + '</b></div>' : '<div class="kv"><span>' + (i + 1) + 'º · ' + esc(G.arenaRival(x.i).name) + '</span><b>' + G.fmt(x.dmg) + '</b></div>').join('') : '') +
      (r.mvp ? '<div class="kv"><span>Destaque de Aurora</span><b>' + esc(r.mvp.name) + '</b></div>' : '') +
      '<p class="mut" style="text-align:center;font-size:15px;margin-top:8px">Um novo Colosso desperta na próxima sexta-feira.</p>' +
      '<div class="acts"><button class="btn pri" data-a="mclose">Até a próxima!</button></div>', { lock: true, onClose: () => { popPend('rank'); } });
  };
  const popPend = (k) => { const c = G.S.colosso; if (!c) return; const i = c.pend.findIndex((x) => x.k === k); if (i >= 0) c.pend.splice(i, 1); if (G.M && G.M.save) G.M.save(); };
  /* v27 (A2): as cerimônias do Colosso (queda e prêmio da semana) não abrem janela sozinhas: ficam na caixa de pendências (6G) e abrem quando o jogador quiser */
  UI.colossoPend = (k) => { const r = ((G.S.colosso || {}).pend || []).find((x) => x.k === k); if (r) (k === 'win' ? winModal : rankModal)(r); };
  /* ================= avisos e laço de interface ================= */
  G.on('colosso', (d) => {
    if (d.t === 'warn') UI.banner('A terra treme', 'Algo desperta na Cratera', 'O Colosso da semana acorda na sexta-feira · Missões › Colosso');
    else if (d.t === 'wake') UI.banner('O Colosso despertou!', esc(d.d.name), esc(d.d.kind) + ' · até domingo à noite');
    if (UI.sheet && UI.sheet.name === 'missoes' && UI.sheet.tab === 'colosso' && !UI.modalOpen) UI.sheetDirty();
  });
  let sheetT = 0;
  const rf1 = UI.refresh;
  UI.refresh = () => {
    rf1(); paint();
    if (UI.sheet && UI.sheet.name === 'missoes' && UI.sheet.tab === 'colosso' && !UI.modalOpen && performance.now() - sheetT > 3000) { sheetT = performance.now(); UI.sheetDirty(); }   // o ranking dos rivais anda sozinho
  };
  G.on('start', () => { lastChip = ''; lastBar = ''; });
  const ng1 = G.newGame; G.newGame = () => { const r = ng1(); lastChip = ''; lastBar = ''; return r; };
})();
;
