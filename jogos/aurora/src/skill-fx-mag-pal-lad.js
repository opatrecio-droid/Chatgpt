/* Aurora 046 · Animações de habilidades: Mago, Paladino e Ladino (21 habilidades). Somente visual. */
(function () {
  'use strict';
  if (typeof G === 'undefined' || G.HEADLESS || !G.A || !G.A.SkillFX) return;
  const FX = G.A.SkillFX, K = FX.kit, E = K.ease, seg = K.seg, TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos;

  /* ---------- helpers ---------- */
  const N = (sc, n) => (sc.light ? Math.max(2, Math.ceil(n / 3)) : n);          // contagem reduzida no modo leve
  const circ = (c, x, y, r, col, a) => K.disc(c, x, y, r, col, a, 1);             // círculo de tela (fumaça, orbes)
  const shk = (sc, p, t, a, b) => { if (t >= a && t < b) sc.shake(p); };
  const out1 = (t, a, b) => 1 - seg(t, a, b);
  const spark = (c, x, y, s, col, a) => { K.px(c, x, y, s, col, a); K.px(c, x - s, y, s * .6, col, a * .7); K.px(c, x + s, y, s * .6, col, a * .7); K.px(c, x, y - s, s * .6, col, a * .7); K.px(c, x, y + s, s * .6, col, a * .7); };
  const flake = (c, x, y, s, col, a) => { K.px(c, x, y, s, '#fff', a); K.px(c, x - s, y, s, col, a); K.px(c, x + s, y, s, col, a); K.px(c, x, y - s, s, col, a); K.px(c, x, y + s, s, col, a); };
  const cross = (c, x, y, s, col, a) => { K.px(c, x, y, s, '#fff', a); K.px(c, x, y - s, s, col, a); K.px(c, x, y + s, s, col, a); K.px(c, x - s, y, s, col, a); K.px(c, x + s, y, s, col, a); K.px(c, x, y + s * 2, s, col, a); };
  /* língua de fogo subindo (partículas em ciclo) */
  function flames(ctx, sc, x, y, w, h, t, seed, n, a) {
    const r = K.rng(seed), cs = ['#fff4b8', '#ffc13d', '#ff7a24', '#c8341d'];
    for (let i = 0; i < n; i++) {
      const bx = x + (r() - .5) * w, ph = (t * 1.5 + r()) % 1, s = sc.z * (4.4 - 3 * ph) * (.7 + r() * .6);
      K.px(ctx, bx + sin(t * 9 + i) * sc.z * 1.5 * ph, y - ph * h, s, cs[Math.min(3, (ph * 4) | 0)], a * (1 - ph * .5));
    }
  }
  function crystal(ctx, x, y, h, w, c1, c2, a) {
    if (h < 1) return;
    K.poly(ctx, [[x - w, y], [x - w * .6, y - h * .65], [x, y - h], [x + w * .6, y - h * .65], [x + w, y]], c1, a);
    K.poly(ctx, [[x, y], [x, y - h], [x + w * .6, y - h * .65], [x + w, y]], c2, a);
    K.streak(ctx, x - w * .35, y - h * .2, x - w * .35, y - h * .6, Math.max(1, w * .2), '#fff', a * .85);
  }
  function pillar(ctx, x, y, w, h, c, a) {
    if (h < 1 || w < 1) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = c;
    ctx.globalAlpha = K.clamp(a * .35, 0, 1); ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.globalAlpha = K.clamp(a * .5, 0, 1); ctx.fillRect(x - w * .3, y - h, w * .6, h);
    ctx.globalAlpha = K.clamp(a, 0, 1); ctx.fillStyle = '#fff'; ctx.fillRect(x - w * .12, y - h, w * .24, h); ctx.restore();
  }
  function rays(ctx, x, y, r0, r1, n, rot, c, w, a, sq) {
    for (let i = 0; i < n; i++) { const an = rot + i * TAU / n; K.streak(ctx, x + cos(an) * r0, y + sin(an) * r0 * sq, x + cos(an) * r1, y + sin(an) * r1 * sq, w, c, a); }
  }
  function crack(ctx, x, y, ang, len, seed, c, w, a) {
    const r = K.rng(seed), st = 6; ctx.save(); ctx.globalAlpha = K.clamp(a, 0, 1); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineJoin = 'miter'; ctx.beginPath(); ctx.moveTo(x, y);
    let px = x, py = y; for (let i = 0; i < st; i++) { ang += (r() - .5) * .9; px += cos(ang) * len / st; py += sin(ang) * len / st * .5; ctx.lineTo(px, py); } ctx.stroke(); ctx.restore();
  }
  /* círculo rúnico no chão com estrela */
  function rune(ctx, x, y, r, rot, c, w, a, pts) {
    if (!(r > 0)) return; const n = pts || 5, k = (n === 5 || n === 7) ? 2 : 1;
    K.ring(ctx, x, y, r, c, w, a); K.ring(ctx, x, y, r * .8, c, w, a * .6);
    ctx.save(); ctx.globalAlpha = K.clamp(a * .8, 0, 1); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath();
    for (let i = 0; i <= n; i++) { const an = rot + (i * k % n) * TAU / n, px = x + cos(an) * r * .8, py = y + sin(an) * r * .8 * .42; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke(); ctx.restore();
    for (let i = 0; i < n; i++) { const an = rot + i * TAU / n; K.diamond(ctx, x + cos(an) * r, y + sin(an) * r * .42, w * 1.6, c, a, true); }
  }
  function chain(ctx, x1, y1, x2, y2, n, c, a, z) {
    for (let i = 0; i <= n; i++) { const u = i / n; K.diamond(ctx, K.lerp(x1, x2, u), K.lerp(y1, y2, u), z * 2.2, i % 2 ? '#fff6c8' : c, a, i % 2 === 0); }
  }
  function hex(ctx, x, y, r, c, a, w) {
    ctx.save(); ctx.globalAlpha = K.clamp(a, 0, 1); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath();
    for (let i = 0; i <= 6; i++) { const an = i * TAU / 6 + TAU / 12; i ? ctx.lineTo(x + cos(an) * r, y + sin(an) * r) : ctx.moveTo(x + cos(an) * r, y + sin(an) * r); } ctx.stroke(); ctx.restore();
  }
  function sparkles(ctx, sc, x, y, w, h, t, seed, n, cols, a) {
    const r = K.rng(seed);
    for (let i = 0; i < n; i++) { const ph = (t * .9 + r()) % 1, px = x + (r() - .5) * w, py = y - ph * h, s = sc.z * (1 + r() * 1.2); spark(ctx, px, py, s, cols[i % cols.length], a * sin(ph * Math.PI)); }
  }
  /* partícula balística: devolve [x, y] */
  const ballistic = (x, y, vx, vy, g, tt) => [x + vx * tt, y - vy * tt + g * tt * tt];
  const SKULL = ['0111110', '1111111', '1011101', '1011101', '1111111', '0111110', '0101010'];
  function skull(ctx, x, y, s, col, a) {
    ctx.save(); ctx.globalAlpha = K.clamp(a, 0, 1); ctx.fillStyle = col;
    for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) if (SKULL[j][i] === '1') ctx.fillRect(Math.round(x + (i - 3.5) * s), Math.round(y + (j - 3.5) * s), Math.ceil(s), Math.ceil(s));
    ctx.restore();
  }
  /* esqueletos aliados surgindo do chão (somente prévia) */
  function skeleton(ctx, x, y, z, rise, dir) {
    try {
      const s = G.A.monSheet('esqueleto', 0, 0), sw = s.sw || s.w, sh = s.sh || s.h, hh = s.h * z;
      ctx.save(); ctx.beginPath(); ctx.rect(x - s.w * z, y - hh - 8, s.w * z * 2, hh + 8 + z * 2); ctx.clip();
      ctx.translate(x, y + (1 - rise) * hh); ctx.scale(dir, 1); ctx.drawImage(s.cv, 0, 0, sw, sh, -s.w * z / 2, -(s.h - 2) * z, s.w * z, s.h * z); ctx.restore();
    } catch (e) { /* sem sprite */ }
  }
  /* escudo em cúpula hexagonal sobre uma criatura com pés em (x, y) */
  function dome(ctx, sc, x, y, u, t, a, c1, c2) {
    const T = sc.tile, z = sc.z, cy = y - .6 * T, rx = .62 * T * u, ry = .86 * T * u; if (u <= 0) return;
    ctx.save(); ctx.globalAlpha = a * .16; ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(x, cy, rx, ry, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = a; ctx.strokeStyle = c2; ctx.lineWidth = z; ctx.beginPath(); ctx.ellipse(x, cy, rx, ry, 0, 0, TAU); ctx.stroke();
    ctx.globalAlpha = a * .9; ctx.strokeStyle = '#fff'; ctx.lineWidth = z * 1.5; ctx.beginPath(); ctx.ellipse(x, cy, rx * .86, ry * .86, 0, Math.PI * 1.05, Math.PI * 1.45); ctx.stroke(); ctx.restore();
    if (!sc.light) for (let i = 0; i < 5; i++) { const ax = x + [-.25, .2, 0, -.28, .26][i] * T * u, ay = cy + [-.4, -.35, -.05, .3, .28][i] * T * u; hex(ctx, ax, ay, T * .17 * u, c2, a * (.35 + .35 * sin(t * 6 + i * 1.7)), z * .8); }
  }
  /* sombra em silhueta do conjurador (pós-imagem) */
  const ghost = (ctx, sc, x, y, pose, flip, a, col) => sc.drawCaster(ctx, x, y, { alpha: a, pose, flip, tint: col });

  /* ============================== BÁSICAS ============================== */

  /* Legião Arcana: raio arcano, runa + explosão no alvo, círculos de invocação */
  FX.register('base:mag', {
    dur: 1.5, hits: [0.3],
    draw(ctx, t, sc) {
      const T = sc.tile, z = sc.z, tx = sc.tx, ty = sc.ty, c1 = '#8a62c9', c2 = '#d9b8ff', q = sc.quiet ? .4 : 1, cx = sc.x, cb = sc.y - .75 * T, tb = ty - .5 * T;
      // antecipação: orbe cresce na mão e voa até o alvo
      const g = E.out(seg(t, 0, .28)), fadeR = 1 - seg(t, .4, .85);
      if (t < .3) {
        const p = E.in(seg(t, .08, .3)), hx = K.lerp(cx, tx, p), hy = K.lerp(cb, tb, p);
        K.glow(ctx, hx, hy, T * (.3 + .25 * sin(t * 40)), c2, .9);
        for (let i = 1; i < 6; i++) K.px(ctx, K.lerp(cx, tx, Math.max(0, p - i * .06)), K.lerp(cb, tb, Math.max(0, p - i * .06)), z * (4 - i * .6), i % 2 ? c1 : c2, .8 - i * .12);
        K.px(ctx, hx, hy, z * 4, '#fff', 1);
      }
      if (t < .9) { rune(ctx, tx, ty, T * 2.2 * g, t * 2.5, c1, z, .9 * fadeR, 5); K.disc(ctx, tx, ty, T * 2.2 * g, c1, .16 * fadeR); }
      if (t >= .28) {
        const u = seg(t, .28, .85);
        K.glow(ctx, tx, tb, T * (1 + 2.2 * E.out(u)), c1, .85 * (1 - u));
        K.glow(ctx, tx, tb, T * (.6 + .6 * u), '#fff', 1 - seg(t, .28, .5));
        K.ring(ctx, tx, ty, T * 2.2 * E.out(u), c2, z * 2, 1 - u); K.ring(ctx, tx, ty, T * 1.3 * E.out(u), '#fff', z, 1 - u);
        K.burst(ctx, tx, tb, { n: N(sc, 22), r: T * 2 * q, size: z * 3, colors: [c1, c2, '#fff'], seed: sc.seed, u, up: T * .4 });
        rays(ctx, tx, tb, T * .3, T * (.3 + 1.6 * E.out(u)), 8, .4, c2, z, (1 - u) * .8, .8);
        shk(sc, 2, t, .28, .4); K.flash(ctx, sc, c1, .15 * out1(t, .28, .4));
      }
      // círculos de invocação e ossos
      for (const s of [-1, 1]) {
        const px = cx + s * .7 * T, py = sc.y + .5 * T, u = seg(t, .4, 1.4), gg = E.out(seg(t, .4, .7)), fo = 1 - seg(t, 1.1, 1.5);
        if (t < .4 || fo <= 0) continue;
        rune(ctx, px, py, T * .75 * gg, t * (s * 3), '#7ee0a0', z, .9 * fo, 6); K.disc(ctx, px, py, T * .75 * gg, '#3fa86a', .22 * fo);
        K.glow(ctx, px, py - T * .4 * gg, T * .7, '#7ee0a0', .35 * fo * E.pulse(K.clamp(u * 1.4, 0, 1)));
        const r = K.rng(sc.seed + (s > 0 ? 9 : 19)), n = N(sc, 10);
        for (let i = 0; i < n; i++) { const a = r() * TAU, v = (.3 + r() * .7) * T * 1.1, tt = seg(t, .5 + r() * .15, 1.2), p = ballistic(px + cos(a) * T * .2, py, cos(a) * v * q, (T * 1.3 + r() * T) * q, T * 1.6 * q, tt); K.px(ctx, p[0], p[1], z * (1.5 + r() * 2) * (1 - tt * .5), i % 3 ? '#e8e2cf' : '#9ad7b4', tt > 0 && tt < 1 ? 1 - tt * tt : 0); }
        if (!sc.world) skeleton(ctx, px, py, z, E.out(seg(t, .55, 1.0)), sc.dir);
      }
    },
  });

  /* Luz da Concórdia: coluna sagrada, onda de cura, correntes e auréola no alvo */
  FX.register('base:pal', {
    dur: 1.9, hits: [0.3, 0.75],
    draw(ctx, t, sc) {
      const T = sc.tile, z = sc.z, g1 = '#ffd86a', g2 = '#fff2b8', x = sc.x, y = sc.y, tx = sc.tx, ty = sc.ty, q = sc.quiet ? .4 : 1;
      const a1 = E.out(seg(t, 0, .22)) * (1 - seg(t, .55, 1.0));
      pillar(ctx, x, y, T * 1.1 * (1 - .3 * seg(t, .3, 1)), T * 5 * E.out(seg(t, 0, .2)), g1, a1);
      K.glow(ctx, x, y - .6 * T, T * 1.6, g2, .5 * a1); K.ring(ctx, x, y, T * .8 * (1 + seg(t, 0, .3)), g2, z * 2, a1);
      rays(ctx, x, y - .7 * T, T * .5, T * (.7 + 1.1 * E.out(seg(t, .05, .5))), 10, t * 1.2, g2, z, .7 * a1, 1);
      // onda de cura
      if (t > .25) {
        const u = E.out(seg(t, .25, 1.0));
        K.ring(ctx, x, y, T * 4 * u, '#9dffb0', z * 2, 1 - u); K.ring(ctx, x, y, T * 3.4 * u, g1, z, (1 - u) * .8);
        K.disc(ctx, x, y, T * 4 * u, '#9dffb0', .1 * (1 - u));
        for (const a of sc.allies) { const w = E.out(seg(t, .35, .9)); sparkles(ctx, sc, a.x, a.y, T * .6, T * 1.3, t, sc.seed + 5, N(sc, 5), ['#9dffb0', g2], w * (1 - seg(t, 1.3, 1.8))); K.glow(ctx, a.x, a.y - .6 * T, T * .8, '#9dffb0', .4 * (1 - seg(t, .45, 1))); }
        sparkles(ctx, sc, x, y, T * 1.2, T * 1.6, t, sc.seed + 11, N(sc, 8), ['#9dffb0', g2, g1], 1 - seg(t, 1.3, 1.8));
      }
      // auréola e correntes no alvo dominado
      const hy = ty - 1.25 * T, ua = E.out(seg(t, .3, .65)), fo = 1 - seg(t, 1.5, 1.9);
      if (t >= .25 && fo > 0) {
        const dy = (1 - ua) * T * 1.5 * q;
        K.glow(ctx, tx, hy - dy, T * .8, g1, .5 * ua * fo);
        K.ring(ctx, tx, hy - dy, T * .5, g1, z * 2, ua * fo, .28); K.ring(ctx, tx, hy - dy, T * .42, g2, z, ua * fo, .28);
        const nL = 6;
        for (let i = 0; i < nL; i++) { const an = t * 2 + i * TAU / nL, k = seg(t, .4 + i * .03, .8), px = tx + cos(an) * T * .45, py = ty - .7 * T + sin(an) * T * .15 + (i / nL - .5) * T * .9;
          chain(ctx, tx + cos(an + .6) * T * .45 * k, py - T * .1, px, py + T * .1, 2, g1, fo * k, z); }
        K.ring(ctx, tx, ty, T * .7 * E.out(seg(t, .3, .6)), g1, z * 1.5, fo);
        K.diamond(ctx, tx, ty - .6 * T, T * .12, g2, .5 * fo * ua, false);
      }
      if (t > .3 && t < .75) K.burst(ctx, tx, ty - .6 * T, { n: N(sc, 10), r: T * 1.1 * q, size: z * 2, colors: [g1, g2], seed: sc.seed + 3, u: seg(t, .3, .75) });
    },
  });

  /* Golpe Sombrio: dash em sombras, corte crítico imenso, moedas */
  FX.register('base:lad', {
    dur: 1.1, hits: [0.2],
    draw(ctx, t, sc) {
      const T = sc.tile, z = sc.z, p1 = '#c8a0ff', p0 = '#3a2a5c', x = sc.x, y = sc.y, tx = sc.tx, ty = sc.ty, tb = ty - .6 * T, d = sc.dir, q = sc.quiet ? .4 : 1;
      // dash: pós-imagens roxas do conjurador entre ele e o alvo
      if (t < .5) {
        const u = seg(t, 0, .2);
        for (let i = 0; i < (sc.light ? 2 : 4); i++) { const k = E.out(K.clamp(u - i * .12, 0, 1)); ghost(ctx, sc, K.lerp(x, tx - d * .7 * T, k), K.lerp(y, ty, k), 'atk' + (i % 3), d < 0, .5 * (1 - i * .2) * (1 - seg(t, .25, .5)), p1); }
        K.streak(ctx, x, y - .6 * T, K.lerp(x, tx, E.out(u)), K.lerp(y - .6 * T, tb, E.out(u)), z * 3, p0, .8 * (1 - seg(t, .2, .45)));
        K.streak(ctx, x, y - .6 * T, K.lerp(x, tx, E.out(u)), K.lerp(y - .6 * T, tb, E.out(u)), z, p1, 1 - seg(t, .2, .45));
        K.burst(ctx, x, y - .4 * T, { n: N(sc, 8), r: T * .9 * q, size: z * 3, colors: [p0, p1], seed: sc.seed, u: seg(t, 0, .35) });
      }
      // golpe crítico: corte grande em X + estrela
      if (t >= .16) {
        const u = seg(t, .16, .55), s1 = E.out(seg(t, .16, .26)), s2 = E.out(seg(t, .2, .3)), f = 1 - u;
        const L = T * 1.5;
        K.streak(ctx, tx - d * L * .8 * s1 + d * L * .8 * (1 - s1), tb - L * .6, tx + d * L * .8 * s1, tb + L * .6 * s1, z * 5, p0, f);
        K.streak(ctx, tx - L * .9, tb - L * .7, tx - L * .9 + L * 1.8 * s1, tb - L * .7 + L * 1.4 * s1, z * 3, p1, f);
        K.streak(ctx, tx - L * .9, tb - L * .7, tx - L * .9 + L * 1.8 * s1, tb - L * .7 + L * 1.4 * s1, z, '#fff', f);
        K.streak(ctx, tx + L * .9, tb - L * .6, tx + L * .9 - L * 1.8 * s2, tb - L * .6 + L * 1.3 * s2, z * 2, p1, f);
        spark(ctx, tx, tb, z * (3 + 6 * E.pulse(seg(t, .16, .4))), '#fff', f);
        K.glow(ctx, tx, tb, T * 1.3, p1, .7 * f); K.glow(ctx, tx, tb, T * .5, '#fff', f);
        K.ring(ctx, tx, ty, T * 1.6 * E.out(u), p1, z, f);
        K.burst(ctx, tx, tb, { n: N(sc, 16), r: T * 1.8 * q, size: z * 3, colors: [p1, p0, '#fff'], seed: sc.seed + 2, u });
        shk(sc, 3, t, .16, .26); K.flash(ctx, sc, '#b080ff', .14 * out1(t, .16, .3));
      }
      // moedas roubadas
      const r = K.rng(sc.seed + 40), n = N(sc, 9);
      for (let i = 0; i < n; i++) { const a = -Math.PI * (.2 + r() * .6), v = T * (1.6 + r() * 1.4), tt = seg(t, .2 + r() * .06, 1.05), p = ballistic(tx, tb, cos(a) * v * q * d, -sin(a) * v * q * -1, T * 4.2 * q, tt);
        if (tt > 0 && tt < 1) { K.px(ctx, p[0], p[1], z * 2.5, '#ffd24a', 1 - tt * .5); K.px(ctx, p[0] - z / 2, p[1] - z / 2, z, '#fff6c8', 1 - tt * .5); } }
    },
  });

  /* ============================== MAGO ============================== */

  /* Parede de Chamas */
  FX.register('piromante', {
    dur: 1.6, hits: [0.25, 0.7],
    draw(ctx, t, sc) {
      const T = sc.tile, z = sc.z, tx = sc.tx, ty = sc.ty, q = sc.quiet ? .4 : 1, x = sc.x, cb = sc.y - .7 * T;
      // bola de fogo da mão ao chão do alvo
      if (t < .25) { const p = E.in(seg(t, 0, .24)); const hx = K.lerp(x, tx, p), hy = K.lerp(cb, ty, p) - sin(p * Math.PI) * T * .8 * q;
        K.glow(ctx, hx, hy, T * .55, '#ff7a24', .9); K.px(ctx, hx, hy, z * 5, '#fff4b8', 1);
        for (let i = 1; i < 6; i++) { const pp = Math.max(0, p - i * .07); K.px(ctx, K.lerp(x, tx, pp), K.lerp(cb, ty, pp) - sin(pp * Math.PI) * T * .8 * q, z * (5 - i * .7), ['#ffc13d', '#ff7a24', '#c8341d'][i % 3], .85 - i * .1); } }
      // faixa de chão em brasa
      const gu = E.out(seg(t, .2, .5)), fo = 1 - seg(t, 1.2, 1.6);
      K.disc(ctx, tx, ty, T * 2.4 * gu, '#3a0f08', .45 * fo, .3); K.disc(ctx, tx, ty, T * 2.1 * gu, '#ff5a1a', .3 * fo, .3);
      for (let i = 0; i < 4; i++) crack(ctx, tx, ty, i * 1.57 + .4, T * 1.6 * gu, sc.seed + i, '#ffb347', z, .9 * fo);
      // parede: colunas de fogo irrompendo em arco
      const nC = sc.light ? 5 : 9;
      for (let i = 0; i < nC; i++) {
        const k = i / (nC - 1) - .5, px = tx + k * T * 2.5, py = ty + (k * k * 4 - .5) * T * .35, d0 = .22 + Math.abs(k) * .2, h = T * (1.9 - Math.abs(k) * .9) * E.back(seg(t, d0, d0 + .25)) * fo;
        if (t < d0) continue;
        K.glow(ctx, px, py - h * .4, T * .75, '#ff6a2a', .38 * fo);
        flames(ctx, sc, px, py, T * .55, Math.max(2, h), t, sc.seed + 20 + i, sc.light ? 4 : 7, fo);
        K.px(ctx, px, py, z * 5, '#fff4b8', .8 * fo * out1(t, d0, d0 + .5));
      }
      if (t >= .22) { const u = seg(t, .22, .8); K.ring(ctx, tx, ty, T * 1.8 * E.out(u), '#ffc13d', z * 2, 1 - u); K.burst(ctx, tx, ty - T * .3, { n: N(sc, 18), r: T * 2.2 * q, size: z * 2.5, colors: ['#ffc13d', '#ff7a24', '#fff4b8'], seed: sc.seed + 5, u, up: T * 1.1 }); shk(sc, 2, t, .22, .34); K.flash(ctx, sc, '#ff7a24', .12 * out1(t, .22, .34)); }
      // brasas residuais (queimadura)
      const r = K.rng(sc.seed + 77); for (let i = 0; i < N(sc, 9); i++) { const ph = (t * .8 + r()) % 1; K.px(ctx, tx + (r() - .5) * T * 2.3, ty - ph * T * 1.8, z * 1.6, i % 2 ? '#ffc13d' : '#ff5a1a', (1 - ph) * fo * seg(t, .5, .7)); }
    },
  });

  /* Lança de Gelo */
  FX.register('criomante', {
    dur: 1.4, hits: [0.3],
    draw(ctx, t, sc) {
      const T = sc.tile, z = sc.z, x = sc.x, tx = sc.tx, ty = sc.ty, tb = ty - .6 * T, d = sc.dir, cb = sc.y - .8 * T, i1 = '#7fd8ff', i2 = '#d8f6ff', i3 = '#2f7fc8', q = sc.quiet ? .4 : 1;
      // forma a lança diante do mago, depois dispara
      const form = E.out(seg(t, 0, .14)), fly = E.in(seg(t, .12, .3));
      const hx = K.lerp(x + d * T * .6, tx, fly), hy = K.lerp(cb, tb, fly);
      if (t < .3) {
        const ang = Math.atan2(tb - cb, tx - x), L = T * 1.2 * form, bx = hx - cos(ang) * L * .5 * (1 - fly * .3), by = hy - sin(ang) * L * .5;
        K.glow(ctx, hx, hy, T * .7, i1, .6 * form);
        K.poly(ctx, [[hx + cos(ang) * L * .55, hy + sin(ang) * L * .55], [bx + cos(ang + 1.57) * z * 3, by + sin(ang + 1.57) * z * 3], [bx - cos(ang) * L * .4, by - sin(ang) * L * .4], [bx + cos(ang - 1.57) * z * 3, by + sin(ang - 1.57) * z * 3]], i2, 1);
        K.streak(ctx, hx - cos(ang) * L * .3, hy - sin(ang) * L * .3, hx + cos(ang) * L * .5, hy + sin(ang) * L * .5, z, '#fff', 1);
        for (let i = 1; i < 6; i++) K.px(ctx, hx - cos(ang) * L * (.5 + i * .25), hy - sin(ang) * L * (.5 + i * .25), z * (3 - i * .4), i % 2 ? i1 : i2, fly * (1 - i * .15));
        for (let i = 0; i < N(sc, 6); i++) flake(ctx, x + d * T * .6 + sin(t * 10 + i * 2) * T * .4, cb + cos(t * 8 + i * 3) * T * .4, z, i1, (1 - fly) * form);
      }
      // impacto: estilhaços + bloco de gelo
      if (t >= .28) {
        const u = seg(t, .28, .7), fo = 1 - seg(t, 1.1, 1.4), g = E.out(seg(t, .3, .55));
        K.glow(ctx, tx, tb, T * (.5 + u), '#fff', (1 - u) * .9); K.ring(ctx, tx, ty, T * 1.7 * E.out(u), i1, z * 2, 1 - u);
        const r = K.rng(sc.seed + 4);
        for (let i = 0; i < N(sc, 12); i++) { const a = r() * TAU, v = T * (.8 + r() * 1.4) * q, tt = seg(t, .28, 1.0), p = ballistic(tx, tb, cos(a) * v, sin(a) * v * .8 + T * .6, T * 3 * q, tt);
          K.poly(ctx, [[p[0], p[1] - z * 3], [p[0] + z * 2, p[1]], [p[0], p[1] + z * 3], [p[0] - z * 2, p[1]]], i % 2 ? i2 : i1, tt < 1 ? 1 - tt * tt : 0); }
        // gelo prendendo o alvo
        if (t > .4 && fo > 0) {
          K.disc(ctx, tx, ty, T * 1.1 * g, i1, .3 * fo, .35);
          const cr = [[-.5, .12, 1.3, .26], [.45, .1, 1.1, .22], [-.15, -.1, 1.8, .22], [.15, -.05, 1.5, .24], [-.7, -.1, .8, .16], [.7, -.08, .7, .15]];
          for (const [ox, oy, h, w] of cr) crystal(ctx, tx + ox * T * .8, ty + oy * T, h * T * g, w * T, i1, i3, fo);
          K.glow(ctx, tx, tb, T * .9, i1, .22 * fo * (.7 + .3 * sin(t * 12)));
          if (t > 1.05) K.burst(ctx, tx, tb, { n: N(sc, 10), r: T * 1.2 * q, size: z * 2, colors: [i2, i1], seed: sc.seed + 8, u: seg(t, 1.05, 1.4) });
        }
        shk(sc, 2, t, .28, .38);
      }
    },
  });

  /* Meteoro */
  FX.register('arquimago', {
    dur: 1.9, hits: [0.33, 0.55],
    draw(ctx, t, sc) {
      const T = sc.tile, z = sc.z, tx = sc.tx, ty = sc.ty, d = sc.dir, q = sc.quiet ? .4 : 1, F = ['#fff4b8', '#ffc13d', '#ff7a24', '#c8341d'];
      const hit = .33;
      // sombra crescendo no chão e círculo de convocação
      const su = E.in(seg(t, 0, hit)), sfo = 1 - seg(t, hit, hit + .2);
      K.disc(ctx, tx, ty, T * 3 * su, '#000', .35 * sfo, .4);
      if (t < hit + .2) rune(ctx, tx, ty, T * 3 * E.out(seg(t, 0, .2)), t * 2, '#ff9a3c', z, .7 * sfo, 6);
      // meteoro caindo na diagonal
      if (t < hit) {
        const p = sc.quiet ? 1 : E.in(seg(t, 0, hit)), sx = tx + d * T * 3.2, sy = ty - T * 6, mx = K.lerp(sx, tx, p), my = K.lerp(sy, ty - .2 * T, p), r0 = T * (.4 + .35 * p);
        for (let i = 0; i < N(sc, 22); i++) { const k = i / 22, pp = Math.max(0, p - k * .3), rx = K.lerp(sx, tx, pp), ry = K.lerp(sy, ty - .2 * T, pp), wob = sin(i * 5.3 + t * 30) * T * .12;
          K.px(ctx, rx + wob, ry + wob * .5, r0 * (1 - k) * 1.6 + z, F[Math.min(3, (k * 4 + .5) | 0)], (1 - k) * .9 * p); }
        K.glow(ctx, mx, my, r0 * 3.2, '#ff7a24', .8);
        circ(ctx, mx, my, r0, '#4a2018', 1); circ(ctx, mx - r0 * .2, my - r0 * .15, r0 * .75, '#a8441c', 1); circ(ctx, mx - r0 * .3, my - r0 * .3, r0 * .4, '#ffb347', 1); K.px(ctx, mx - r0 * .35, my - r0 * .35, z * 3, '#fff', 1);
      }
      // impacto
      if (t >= hit) {
        const u = seg(t, hit, 1.9), ub = seg(t, hit, hit + .5), fo = 1 - seg(t, 1.5, 1.9), cy = ty - .3 * T;
        K.glow(ctx, tx, cy, T * (1.6 + 2.2 * E.out(ub)), '#ffb347', .9 * (1 - ub)); K.glow(ctx, tx, cy, T * 1.2 * (1 - ub * .5), '#fff', (1 - seg(t, hit, hit + .18)));
        K.ring(ctx, tx, ty, T * 3.2 * E.out(ub), '#ffe49a', z * 3, 1 - ub); K.ring(ctx, tx, ty, T * 2.2 * E.out(seg(t, hit + .05, hit + .6)), '#ff7a24', z * 2, 1 - seg(t, hit + .05, hit + .6));
        shk(sc, 4, t, hit, hit + .14); K.flash(ctx, sc, '#ffd9a0', .2 * out1(t, hit, hit + .2));
        // cratera
        const cg = E.out(seg(t, hit, hit + .2));
        K.disc(ctx, tx, ty, T * 1.5 * cg, '#2a1410', .75 * fo, .42); K.disc(ctx, tx, ty, T * 1.1 * cg, '#120806', .8 * fo, .42); K.ring(ctx, tx, ty, T * 1.5 * cg, '#ff7a24', z * 2, .9 * fo * (.7 + .3 * sin(t * 10)), .42);
        for (let i = 0; i < 6; i++) crack(ctx, tx, ty, i * 1.05 + .3, T * 2.4 * E.out(seg(t, hit, hit + .3)), sc.seed + i * 3, '#ff9a3c', z, .85 * fo);
        // pedras voando
        const r = K.rng(sc.seed + 31);
        for (let i = 0; i < N(sc, 14); i++) { const a = -Math.PI * (.1 + r() * .8), v = T * (1.8 + r() * 2.2) * q, tt = seg(t, hit, hit + .9), p = ballistic(tx, ty - .2 * T, cos(a) * v * (r() < .5 ? -1 : 1), sin(-a) * v * 1.3, T * 8 * q, tt);
          if (tt > 0 && tt < 1) { K.px(ctx, p[0], p[1], z * (2 + r() * 3), i % 3 ? '#4a2018' : '#a8441c', 1 - tt * .5); K.px(ctx, p[0] + z, p[1] - z, z * 1.5, '#ffb347', .9 - tt); } else r(); }
        // coluna de fogo + fumaça
        flames(ctx, sc, tx, ty, T * 1.6, T * 2.6 * E.out(seg(t, hit, hit + .3)), t, sc.seed + 50, N(sc, 16), fo * .9);
        const rs = K.rng(sc.seed + 60);
        for (let i = 0; i < N(sc, 8); i++) { const ph = K.clamp((t - hit - rs() * .3) / 1.2, 0, 1), px = tx + (rs() - .5) * T * 1.6 + sin(i + t * 3) * T * .2, py = ty - T * (.4 + ph * 2.6 + rs()); circ(ctx, px, py, T * (.3 + .5 * ph), i % 2 ? '#3a2e34' : '#58484c', .5 * (1 - ph) * (ph > 0 ? 1 : 0)); }
        const rb = K.rng(sc.seed + 90); for (let i = 0; i < N(sc, 12); i++) { const ph = (t * .6 + rb()) % 1; K.px(ctx, tx + (rb() - .5) * T * 2.6, ty - ph * T * 1.8, z * 1.5, '#ffb347', (1 - ph) * fo * .8); }
      }
    },
  });

  /* Combustão */
  FX.register('senhor_cinzas', {
    dur: 1.7, hits: [0.25, 0.6],
    draw(ctx, t, sc) {
      const T = sc.tile, z = sc.z, tx = sc.tx, ty = sc.ty, q = sc.quiet ? .4 : 1, x = sc.x, cb = sc.y - .75 * T, ash = '#6e6670';
      const tg = [{ x: tx, y: ty }].concat(sc.others.slice(0, sc.light ? 2 : 5));
      // mão incandescente + onda de calor
      const h = E.out(seg(t, 0, .22)) * out1(t, .22, .5);
      K.glow(ctx, x, cb, T * 1.1 * h, '#ff7a24', .8 * h); K.glow(ctx, x, cb, T * .4 * h, '#fff4b8', h);
      const u0 = E.out(seg(t, .12, .6));
      K.ring(ctx, tx, ty, T * 3.5 * u0, '#ff7a24', z * 2, (1 - u0) * .9); K.ring(ctx, tx, ty, T * 3 * u0, '#ffc13d', z, (1 - u0) * .6);
      K.disc(ctx, tx, ty, T * 3.5 * u0, '#ff5a1a', .12 * (1 - u0));
      K.streak(ctx, x, cb, K.lerp(x, tx, E.in(seg(t, .05, .25))), K.lerp(cb, ty - .5 * T, E.in(seg(t, .05, .25))), z * 2, '#ffc13d', out1(t, .1, .3));
      tg.forEach((e, i) => {
        const t0 = .22 + i * .07, u = seg(t, t0, t0 + .45), on = t >= t0, fo = 1 - seg(t, 1.3, 1.7), eb = e.y - .5 * T;
        if (!on) return;
        K.glow(ctx, e.x, eb, T * (.5 + 1.6 * E.out(u)), '#ffffff', (1 - seg(t, t0, t0 + .15)) * .9);
        K.glow(ctx, e.x, eb, T * (1 + 1.2 * u), '#ff7a24', .7 * (1 - u));
        K.ring(ctx, e.x, e.y, T * 1.6 * E.out(u), '#ffb347', z * 2, 1 - u);
        K.burst(ctx, e.x, eb, { n: N(sc, 14), r: T * 1.6 * q, size: z * 2.5, colors: ['#fff4b8', '#ffc13d', '#ff7a24'], seed: sc.seed + i * 5, u, up: T * .5 });
        K.disc(ctx, e.x, e.y, T * .8 * E.out(u), '#2a1410', .5 * fo, .4);
        flames(ctx, sc, e.x, e.y, T * .8, T * 1.7 * E.out(seg(t, t0, t0 + .25)), t, sc.seed + 100 + i * 7, sc.light ? 5 : 9, fo);
        K.glow(ctx, e.x, eb, T * .8, '#ff6a2a', .3 * fo);
        shk(sc, i === 0 ? 3 : 0, t, t0, t0 + .1);
      });
      if (t > .25) K.flash(ctx, sc, '#ff7a24', .12 * out1(t, .25, .4));
      // cinzas caindo
      const r = K.rng(sc.seed + 13), a = seg(t, .3, .6) * (1 - seg(t, 1.4, 1.7));
      for (let i = 0; i < N(sc, 22); i++) { const ph = (t * .5 + r()) % 1, px = tx + (r() - .5) * T * 6.5 + sin(t * 3 + i) * T * .15, py = ty - T * 2.6 + ph * T * 2.8; K.px(ctx, px, py, z * (1 + r() * 1.5), i % 4 ? ash : '#b8b0bc', a * .85); }
    },
  });

  /* Distorção */
  FX.register('sabio_fenda', {
    dur: 1.6, hits: [0.3, 0.85],
    draw(ctx, t, sc) {
      const T = sc.tile, z = sc.z, tx = sc.tx, ty = sc.ty, tb = ty - .6 * T, x = sc.x, cb = sc.y - .7 * T, q = sc.quiet ? .4 : 1;
      const v1 = '#7a3cff', v2 = '#3de0ff', v3 = '#ff4fd8';
      const open = E.out(seg(t, .02, .3)), close = 1 - seg(t, 1.2, 1.6), imp = seg(t, .3, .9);
      // mão -> fenda
      if (t < .3) { K.glow(ctx, x, cb, T * .5, v2, .8 * out1(t, .1, .3)); K.bolt(ctx, x, cb, K.lerp(x, tx, E.out(seg(t, 0, .25))), K.lerp(cb, tb, E.out(seg(t, 0, .25))), { seed: Math.floor(t * 30) + 9, segments: 7, jag: 5, color: v2, width: z * 1.5, alpha: .9 }); }
      // ondulações do espaço no chão
      for (let i = 0; i < 3; i++) { const u = (seg(t, .1 + i * .15, .9 + i * .15)); K.ring(ctx, tx, ty, T * 2.8 * E.out(u), i % 2 ? v2 : v1, z * 1.5, (1 - u) * .8 * close); }
      K.disc(ctx, tx, ty, T * 2.8 * open, v1, .15 * close, .42);
      // a fenda: fenda vertical em losango com bordas cromáticas
      const h = T * 1.9 * open * close, w = T * .4 * open * (1 + .2 * sin(t * 18));
      if (h > 2) {
        K.glow(ctx, tx, tb, T * 1.8 * open, v1, .5 * close);
        K.poly(ctx, [[tx - w - z * 2, tb], [tx, tb - h - z * 2], [tx + w + z * 2, tb], [tx, tb + h + z * 2]], v3, .8 * close);
        K.poly(ctx, [[tx - w, tb], [tx, tb - h], [tx + w, tb], [tx, tb + h]], v2, .9 * close);
        K.poly(ctx, [[tx - w * .65, tb], [tx, tb - h * .88], [tx + w * .65, tb], [tx, tb + h * .88]], '#0a0418', 1 * close);
        for (let i = 0; i < 5; i++) K.px(ctx, tx + sin(t * 3 + i * 1.3) * w * .45, tb + (i - 2) * h * .3, z * 1.5, '#fff', .9 * close);
        for (let i = 0; i < 6; i++) crack(ctx, tx, tb, i * 1.05 + t * .3, T * 1.4 * open, sc.seed + i, i % 2 ? v2 : v3, z, .8 * close * (1 - imp * .5));
      }
      // fragmentos sendo sugados e depois expelidos
      const r = K.rng(sc.seed + 8);
      for (let i = 0; i < N(sc, 18); i++) { const a = r() * TAU, rr = T * (1 + r() * 1.8), ph = (t * 1.1 + r()) % 1, pull = 1 - ph * ph, ss = (1 + r() * 2) * z;
        const spiral = a + ph * 3 * (i % 2 ? 1 : -1); K.px(ctx, tx + cos(spiral) * rr * pull * q + (1 - q) * 0, tb + sin(spiral) * rr * pull * .6 * q, ss, i % 3 ? v2 : '#fff', open * close * (ph > .9 ? (1 - ph) * 10 : 1)); }
      // pulso de implosão + explosão
      if (t >= .3) { const u = seg(t, .3, .75); K.ring(ctx, tx, tb, T * 2.6 * E.out(u), '#fff', z * 2, (1 - u) * .8, .8); K.glow(ctx, tx, tb, T * 1.5 * (1 - u * .4), v3, .7 * (1 - u)); shk(sc, 3, t, .3, .42); K.flash(ctx, sc, v1, .14 * out1(t, .3, .42)); }
      // lentidão: relógio/espiral em torno do alvo
      const sl = seg(t, .5, .8) * close; if (sl > 0) { for (let i = 0; i < 2; i++) K.ring(ctx, tx, ty, T * (.6 + i * .2), v2, z, .6 * sl, .35); const a = -t * 2; K.px(ctx, tx + cos(a) * T * .6, ty + sin(a) * T * .6 * .35, z * 3, '#fff', sl); K.px(ctx, tx + cos(a * .3) * T * .8, ty + sin(a * .3) * T * .8 * .35, z * 3, v3, sl); }
    },
  });

  /* Nevasca */
  FX.register('tecelao', {
    dur: 1.9, hits: [0.3, 0.65, 1.0, 1.35],
    draw(ctx, t, sc) {
      const T = sc.tile, z = sc.z, tx = sc.tx, ty = sc.ty, q = sc.quiet ? .4 : 1, x = sc.x, i1 = '#7fd8ff', i2 = '#d8f6ff', i3 = '#2f7fc8';
      const fo = 1 - seg(t, 1.6, 1.9), grow = E.out(seg(t, .1, .6));
      // neblina gelada e chão congelado
      K.disc(ctx, tx, ty, T * 2.8 * grow, '#bfeaff', .22 * fo, .42); K.disc(ctx, tx, ty, T * 2 * grow, i1, .2 * fo, .42);
      K.ring(ctx, tx, ty, T * 2.8 * grow, i2, z * 1.5, .7 * fo); rune(ctx, tx, ty, T * 2.3 * grow, -t, i1, z, .5 * fo, 6);
      K.glow(ctx, tx, ty - T * 1.8, T * 3 * grow, '#9fd8ff', .22 * fo);
      // mão invoca
      if (t < .35) { K.glow(ctx, x, sc.y - .8 * T, T * .7 * E.pulse(seg(t, 0, .35)), i2, .8); rays(ctx, x, sc.y - .8 * T, T * .2, T * .7, 8, t * 6, i1, z, .8 * out1(t, 0, .35), 1); }
      // vento + flocos caindo na diagonal
      const r = K.rng(sc.seed + 3), nF = N(sc, 40), a0 = seg(t, .12, .4) * fo;
      for (let i = 0; i < nF; i++) { const ph = (t * (.9 + r() * .5) + r()) % 1, px = tx + (r() - .5) * T * 6 + ph * T * .9 * sc.dir * q, py = ty - T * 3.3 + ph * T * 3.6 + sin(t * 4 + i) * T * .08, s = z * (1 + r() * 1.5);
        (i % 4 === 0 ? flake : (c, X, Y, S, C, A) => K.px(c, X, Y, S, C, A))(ctx, px, py, s, i % 3 ? i2 : i1, a0 * (ph < .1 ? ph * 10 : 1)); }
      for (let i = 0; i < N(sc, 6); i++) { const ph = (t * 1.6 + i * .17) % 1, yy = ty - T * (.4 + i * .4), xx = tx - T * 3 * sc.dir + ph * T * 6 * sc.dir; K.streak(ctx, xx, yy, xx + T * .8 * sc.dir, yy + T * .14, z, i2, .55 * a0 * sin(ph * Math.PI)); }
      // 4 rajadas: onda, cristais, estilhaços
      for (let g = 0; g < 4; g++) {
        const t0 = .28 + g * .35, u = seg(t, t0, t0 + .5), ang = g * 1.9 + .4; if (t < t0) continue;
        const cx = tx + cos(ang) * T * (g ? 1.3 : 0), cy = ty + sin(ang) * T * .5 * (g ? 1 : 0);
        K.ring(ctx, cx, cy, T * 1.7 * E.out(u), i2, z * 2, (1 - u) * .9); K.glow(ctx, cx, cy - T * .5, T * 1.4, '#fff', .55 * (1 - seg(t, t0, t0 + .2)));
        const h = T * 1.3 * E.back(seg(t, t0, t0 + .2)) * (g < 3 ? out1(t, t0 + .7, t0 + 1.1) : fo);
        for (let k = 0; k < (sc.light ? 2 : 3); k++) crystal(ctx, cx + (k - 1) * T * .38, cy + (k % 2) * T * .12, h * (k === 1 ? 1 : .65), T * .17, i1, i3, 1);
        K.burst(ctx, cx, cy - T * .4, { n: N(sc, 12), r: T * 1.7 * q, size: z * 2.5, colors: [i2, i1, '#fff'], seed: sc.seed + g * 7, u, up: T * .6 });
        shk(sc, g === 0 ? 3 : 2, t, t0, t0 + .1);
      }
      if (t > 1.3) { const u = seg(t, 1.3, 1.9); K.glow(ctx, tx, ty - T * .5, T * 3 * u, i2, .3 * (1 - u)); }
    },
  });

  /* ============================== PALADINO ============================== */

  /* Golpe Sagrado */
  FX.register('cruzado', {
    dur: 1.1, hits: [0.22],
    draw(ctx, t, sc) {
      const T = sc.tile, z = sc.z, tx = sc.tx, ty = sc.ty, tb = ty - .6 * T, d = sc.dir, g1 = '#ffd86a', g2 = '#fff2b8', q = sc.quiet ? .4 : 1;
      // espada de luz sobe e desce em arco
      const up = E.out(seg(t, 0, .12)), dn = E.in(seg(t, .1, .22)), ang = K.lerp(-2.2, 1.3, dn) * d - (d < 0 ? Math.PI - 0 : 0);
      if (t < .3) {
        const hx = sc.x + d * T * .5, hy = sc.y - 1.1 * T * up + 1.1 * T * dn * .5, L = T * 1.9 * (1 + .2 * dn), a = K.lerp(-2.2, 1.0, dn);
        const ax = d * cos(a), ay = sin(a);
        K.glow(ctx, hx + ax * L * .5, hy + ay * L * .5, T * 1, g1, .5);
        K.streak(ctx, hx, hy, hx + ax * L, hy + ay * L, z * 5, g1, .9); K.streak(ctx, hx, hy, hx + ax * L, hy + ay * L, z * 2, '#fff', 1);
      }
      // corte sagrado + cruz
      if (t >= .18) {
        const u = seg(t, .18, .7), f = 1 - u, s = E.out(seg(t, .18, .3));
        K.streak(ctx, tx, tb - T * 1.3 * s, tx, tb - T * 1.3 + T * 2.6 * s, z * 6, g1, f); K.streak(ctx, tx, tb - T * 1.3 * s, tx, tb - T * 1.3 + T * 2.6 * s, z * 2, '#fff', f);
        const cs = E.out(seg(t, .22, .4)); K.streak(ctx, tx - T * .85 * cs, tb - T * .2, tx + T * .85 * cs, tb - T * .2, z * 5, g1, f); K.streak(ctx, tx - T * .85 * cs, tb - T * .2, tx + T * .85 * cs, tb - T * .2, z * 2, '#fff', f);
        K.glow(ctx, tx, tb, T * (1 + u), g1, .8 * f); K.glow(ctx, tx, tb, T * .5, '#fff', f);
        K.ring(ctx, tx, ty, T * 1.7 * E.out(u), g2, z * 2, f); pillar(ctx, tx, ty, T * .9, T * 3.2, g1, .6 * f * E.out(seg(t, .18, .3)));
        K.burst(ctx, tx, tb, { n: N(sc, 18), r: T * 1.8 * q, size: z * 2.5, colors: [g1, g2, '#fff'], seed: sc.seed, u, up: T * .5 });
        shk(sc, 3, t, .18, .28); K.flash(ctx, sc, g1, .14 * out1(t, .18, .3));
      }
      // cura em si
      if (t > .3) { const a = 1 - seg(t, .8, 1.1); sparkles(ctx, sc, sc.x, sc.y, T * .9, T * 1.6, t, sc.seed + 4, N(sc, 6), ['#9dffb0', g2], a * seg(t, .3, .45)); K.glow(ctx, sc.x, sc.y - .6 * T, T * .9, '#9dffb0', .3 * a * seg(t, .3, .5)); }
    },
  });

  /* Bênção */
  FX.register('clerigo', {
    dur: 2.1, hits: [0.3],
    draw(ctx, t, sc) {
      const T = sc.tile, z = sc.z, g1 = '#ffd86a', g2 = '#fff2b8', gr = '#9dffb0', fo = 1 - seg(t, 1.7, 2.1), q = sc.quiet ? .4 : 1;
      const who = [{ x: sc.x, y: sc.y }].concat(sc.allies);
      const u = E.out(seg(t, .05, .7));
      K.disc(ctx, sc.x, sc.y, T * 4.5 * u, g2, .1 * fo, .42); K.ring(ctx, sc.x, sc.y, T * 4.5 * u, g1, z * 2, (1 - seg(t, .7, 1.2)) * .9 * fo); K.ring(ctx, sc.x, sc.y, T * 4.5 * E.out(seg(t, .2, .9)), g2, z, (1 - seg(t, .8, 1.3)) * .6 * fo);
      rune(ctx, sc.x, sc.y, T * 1.4 * E.out(seg(t, 0, .3)), t * 1.5, g1, z, .8 * fo, 6);
      who.forEach((e, i) => {
        const t0 = .12 + i * .08, a = E.out(seg(t, t0, t0 + .25)) * fo; if (t < t0) return;
        pillar(ctx, e.x, e.y, T * .8, T * 3.5, g1, .55 * a * out1(t, t0 + .2, t0 + .9));
        K.glow(ctx, e.x, e.y - .6 * T, T * 1.1, g2, .4 * a);
        const hy = e.y - 1.35 * T - (1 - E.out(seg(t, t0, t0 + .4))) * T * 1.2 * q;
        K.ring(ctx, e.x, hy, T * .34, g1, z * 2, a, .3); K.ring(ctx, e.x, hy, T * .26, g2, z, a, .3);
        // símbolo de escudo (-18% dano) e pluses de regeneração
        const sh = a * seg(t, t0 + .3, t0 + .5);
        K.poly(ctx, [[e.x - T * .22, e.y - .7 * T - T * .45], [e.x + T * .22, e.y - .7 * T - T * .45], [e.x + T * .22, e.y - .7 * T - T * .15], [e.x, e.y - .7 * T + T * .05], [e.x - T * .22, e.y - .7 * T - T * .15]], g1, .2 * sh);
        sparkles(ctx, sc, e.x, e.y, T * .7, T * 1.8, t + i * .2, sc.seed + i * 9, N(sc, 5), [gr, g2, g1], a);
        if (t < t0 + .4) K.burst(ctx, e.x, e.y - .6 * T, { n: N(sc, 8), r: T * .9 * q, size: z * 2, colors: [g1, g2], seed: sc.seed + i, u: seg(t, t0, t0 + .4) });
        for (let k = 0; k < 2; k++) { const ph = (t * .8 + k * .5 + i * .13) % 1; cross(ctx, e.x + (k ? .3 : -.3) * T, e.y - ph * T * 1.6, z, gr, a * sin(ph * Math.PI) * seg(t, .5, .8)); }
      });
      rays(ctx, sc.x, sc.y - .7 * T, T * .6, T * (.8 + .8 * u), 12, t * .6, g2, z, .55 * out1(t, .1, .8), 1);
    },
  });

  /* Julgamento */
  FX.register('avatar', {
    dur: 1.6, hits: [0.3],
    draw(ctx, t, sc) {
      const T = sc.tile, z = sc.z, g1 = '#ffd86a', g2 = '#fff2b8', x = sc.x, y = sc.y, q = sc.quiet ? .4 : 1, bb = y - .8 * T;
      const wing = E.back(seg(t, 0, .3)) * (1 - seg(t, 1.1, 1.5));
      // asas de luz
      if (wing > 0) for (const s of [-1, 1]) for (let i = 0; i < 6; i++) {
        const an = (-.3 - i * .24) , len = T * (1.15 - i * .09) * wing, bx = x + s * T * .2, by = bb - T * .1;
        const ex = bx + s * cos(an) * len * 1.2, ey = by + sin(an) * len * 1.1 + T * .2 * i * .15;
        K.poly(ctx, [[bx, by], [bx + s * cos(an + .12) * len * .6, by + sin(an + .12) * len * .6 - z * 2], [ex, ey], [bx + s * cos(an - .1) * len * .6, by + sin(an - .1) * len * .6 + z * 2]], i % 2 ? g2 : '#fff', .85 * Math.min(1, wing));
      }
      K.glow(ctx, x, bb, T * 1.8 * wing, g1, .45);
      // pilares de julgamento ao redor
      const nP = sc.light ? 4 : 7;
      for (let i = 0; i < nP; i++) {
        const an = i * TAU / nP + .5, rr = T * 2.5 * (.7 + .3 * (i % 2)), px = x + cos(an) * rr, py = y + sin(an) * rr * .42, t0 = .14 + i * .03, a = E.out(seg(t, t0, t0 + .12)) * out1(t, t0 + .2, t0 + .65);
        if (t < t0) continue;
        pillar(ctx, px, py, T * .55, T * 4 * E.out(seg(t, t0, t0 + .1)), g1, a); K.glow(ctx, px, py, T * .8, g2, a * .6); K.ring(ctx, px, py, T * .5 * E.out(seg(t, t0, t0 + .3)), g2, z, a * .8);
        crack(ctx, px, py, an, T * .8, sc.seed + i, g1, z, a * .7);
      }
      // nova sagrada
      if (t >= .25) {
        const u = E.out(seg(t, .25, .8)), f = 1 - seg(t, .25, .8);
        K.glow(ctx, x, y - .5 * T, T * 3 * u, g1, .55 * f); K.ring(ctx, x, y, T * 2.5 * u, '#fff', z * 3, f); K.ring(ctx, x, y, T * 2.1 * u, g1, z * 2, f); K.disc(ctx, x, y, T * 2.5 * u, g2, .3 * f);
        K.burst(ctx, x, y - .5 * T, { n: N(sc, 22), r: T * 2.7 * q, size: z * 2.5, colors: [g1, g2, '#fff'], seed: sc.seed, u: seg(t, .25, .9), up: T * .4 });
        shk(sc, 3, t, .25, .38); K.flash(ctx, sc, g2, .16 * out1(t, .25, .4));
      }
      // cura aos aliados
      for (const a of sc.allies) { const k = seg(t, .35, .9) * (1 - seg(t, 1.2, 1.6)); sparkles(ctx, sc, a.x, a.y, T * .6, T * 1.4, t, sc.seed + 6, N(sc, 5), ['#9dffb0', g2], k); K.glow(ctx, a.x, a.y - .6 * T, T * .8, '#9dffb0', .3 * k); }
      rune(ctx, x, y, T * 1.7 * E.out(seg(t, 0, .25)), t * 2, g1, z, .8 * (1 - seg(t, .8, 1.3)), 8);
    },
  });

  /* Sentença */
  FX.register('inquisidor', {
    dur: 1.5, hits: [0.28],
    draw(ctx, t, sc) {
      const T = sc.tile, z = sc.z, tx = sc.tx, ty = sc.ty, tb = ty - .6 * T, g1 = '#ffd86a', g2 = '#fff2b8', q = sc.quiet ? .4 : 1, fo = 1 - seg(t, 1.1, 1.5);
      // selo do tribunal no chão
      const gr = E.out(seg(t, 0, .22)); rune(ctx, tx, ty, T * 1.7 * gr, t * 1.5, g1, z, .9 * fo, 8); K.disc(ctx, tx, ty, T * 1.7 * gr, g1, .15 * fo);
      // espada colossal cai do céu
      const fall = sc.quiet ? 1 : E.in(seg(t, .02, .28)), tipY = K.lerp(ty - T * 7, ty - .1 * T, fall), L = T * 5.5, W = T * .5;
      if (t < 1.1) {
        const a = fall < 1 ? 1 : out1(t, .9, 1.1);
        K.glow(ctx, tx, tipY - L * .5, T * 2.2, g1, .35 * a);
        K.poly(ctx, [[tx, tipY], [tx - W, tipY - W * 1.4], [tx - W * .8, tipY - L], [tx + W * .8, tipY - L], [tx + W, tipY - W * 1.4]], g2, a);
        K.poly(ctx, [[tx, tipY], [tx + W, tipY - W * 1.4], [tx + W * .8, tipY - L], [tx + W * .15, tipY - L]], g1, a);
        K.streak(ctx, tx - W * .3, tipY - W * 2, tx - W * .3, tipY - L * .8, z * 1.5, '#fff', a);
        K.poly(ctx, [[tx - W * 2, tipY - L], [tx + W * 2, tipY - L], [tx + W * 2, tipY - L - W * .5], [tx - W * 2, tipY - L - W * .5]], g1, a);
        pillar(ctx, tx, tipY, W * 2.4, L, g1, .25 * a * fall);
      }
      // impacto, ondas e correntes
      if (t >= .26) {
        const u = seg(t, .26, .8), f = 1 - u;
        K.glow(ctx, tx, ty - .2 * T, T * (1.2 + 1.8 * E.out(u)), '#fff', .9 * f); K.ring(ctx, tx, ty, T * 2.8 * E.out(u), g1, z * 3, f); K.ring(ctx, tx, ty, T * 1.8 * E.out(u), '#fff', z, f);
        rays(ctx, tx, ty - .2 * T, T * .3, T * (.4 + 1.9 * E.out(u)), 12, .2, g2, z, f * .8, .5);
        K.burst(ctx, tx, ty - .3 * T, { n: N(sc, 20), r: T * 2.2 * q, size: z * 2.5, colors: [g1, g2, '#fff'], seed: sc.seed + 2, u, up: T * .9 });
        for (let i = 0; i < 4; i++) crack(ctx, tx, ty, i * 1.57 + .8, T * 1.8 * E.out(seg(t, .26, .5)), sc.seed + i, g1, z, .9 * fo);
        shk(sc, 4, t, .26, .38); K.flash(ctx, sc, g2, .2 * out1(t, .26, .4));
        // correntes douradas amarrando
        const ck = E.out(seg(t, .3, .6));
        for (let i = 0; i < 4; i++) { const an = i * 1.57 + .6 + t * .8, sx = tx + cos(an) * T * 1.5, sy = ty + sin(an) * T * .6; chain(ctx, K.lerp(sx, tx, ck), K.lerp(sy, tb, ck * .9), tx + cos(an + 2.4) * T * .35 * ck, tb + sin(an + 2.4) * T * .3 * ck + (i - 1.5) * T * .22, 4, g1, fo * ck, z); }
      }
      // estrelas de atordoamento
      if (t > .45 && fo > 0) for (let i = 0; i < 3; i++) { const an = t * 5 + i * TAU / 3; spark(ctx, tx + cos(an) * T * .45, ty - 1.25 * T + sin(an) * T * .15, z * 1.6, i % 2 ? g2 : '#fff', fo * seg(t, .45, .6)); }
    },
  });

  /* Renovação */
  FX.register('sumo_sacerdote', {
    dur: 2.1, hits: [0.3],
    draw(ctx, t, sc) {
      const T = sc.tile, z = sc.z, x = sc.x, y = sc.y, g1 = '#7dff9a', g2 = '#e8ffd0', g3 = '#ffd86a', fo = 1 - seg(t, 1.7, 2.1), q = sc.quiet ? .4 : 1;
      const gr = E.out(seg(t, 0, .35));
      rune(ctx, x, y, T * 1.8 * gr, t * 1.3, g1, z, .9 * fo, 6); K.disc(ctx, x, y, T * 1.8 * gr, g1, .18 * fo); K.glow(ctx, x, y - .5 * T, T * 2 * gr, g1, .3 * fo);
      pillar(ctx, x, y, T * 1.2, T * 4 * E.out(seg(t, .05, .3)), g1, .5 * out1(t, .35, 1.1));
      // ondas verdes saindo
      for (let i = 0; i < 3; i++) { const u = E.out(seg(t, .28 + i * .22, 1.0 + i * .22)); K.ring(ctx, x, y, T * 4.5 * u, i % 2 ? g3 : g1, z * 2, (1 - u) * .9 * fo); }
      K.disc(ctx, x, y, T * 4.5 * E.out(seg(t, .28, 1.1)), g1, .08 * fo, .42);
      // pétalas/folhas em espiral subindo
      const r = K.rng(sc.seed + 2);
      for (let i = 0; i < N(sc, 22); i++) { const ph = (t * .55 + r()) % 1, rr = T * (.4 + r() * 1.5) * (1 - ph * .3), an = ph * 7 + r() * TAU, s = z * (1.5 + r() * 1.5), px = x + cos(an) * rr, py = y - ph * T * 2.6 + sin(an) * rr * .3;
        K.px(ctx, px, py, s, i % 3 ? g1 : g2, sin(ph * Math.PI) * fo * seg(t, .1, .35)); if (i % 4 === 0) K.px(ctx, px + z, py + z, s * .6, '#2fa84a', sin(ph * Math.PI) * fo * seg(t, .1, .35)); }
      // aliados: cura + bolhas de veneno estourando
      const targets = [{ x, y }].concat(sc.allies);
      targets.forEach((e, i) => {
        const t0 = .3 + i * .08, k = seg(t, t0, t0 + .5); if (t < t0) return; const fa = (1 - seg(t, 1.5, 2)) ;
        K.glow(ctx, e.x, e.y - .6 * T, T * 1.1, g1, .5 * out1(t, t0, t0 + .9)); K.ring(ctx, e.x, e.y, T * .8 * E.out(k), g2, z * 1.5, 1 - k);
        sparkles(ctx, sc, e.x, e.y, T * .7, T * 1.7, t, sc.seed + i * 4, N(sc, 5), [g1, g2, g3], fa);
        for (let b = 0; b < 3; b++) { const bt = seg(t, t0 + .05 + b * .12, t0 + .45 + b * .12), bx = e.x + (b - 1) * T * .3, by = e.y - T * (.3 + b * .3) - bt * T * .4;
          if (bt > 0 && bt < 1) { if (bt < .7) { ctx.save(); ctx.globalAlpha = .9 * (1 - bt); ctx.strokeStyle = '#a06be0'; ctx.lineWidth = z; ctx.beginPath(); ctx.arc(bx, by, z * (2 + bt * 2), 0, TAU); ctx.stroke(); ctx.restore(); }
            else K.burst(ctx, bx, by, { n: 5, r: T * .4 * q, size: z * 1.5, colors: ['#fff', g2], seed: sc.seed + b, u: (bt - .7) / .3 }); } }
      });
      K.glow(ctx, x, y - .6 * T, T * 1.2, '#fff', .7 * out1(t, .28, .55)); shk(sc, 1, t, .28, .36);
    },
  });

  /* Égide Sagrada */
  FX.register('guardiao_luz', {
    dur: 2.1, hits: [0.3],
    draw(ctx, t, sc) {
      const T = sc.tile, z = sc.z, x = sc.x, y = sc.y, g1 = '#ffd86a', c1 = '#aee4ff', c2 = '#fff2b8', fo = 1 - seg(t, 1.7, 2.1);
      const who = [{ x, y }].concat(sc.allies), u = E.out(seg(t, .05, .6));
      K.ring(ctx, x, y, T * 4.5 * u, g1, z * 2, (1 - seg(t, .55, 1.1)) * fo); K.disc(ctx, x, y, T * 4.5 * u, c1, .08 * fo, .42);
      rune(ctx, x, y, T * 1.6 * E.out(seg(t, 0, .25)), t * 1.2, g1, z, .8 * fo * out1(t, .5, 1.2), 6);
      // raios de luz ligando o conjurador aos aliados
      sc.allies.forEach((a, i) => { const k = E.out(seg(t, .12, .38)); K.bolt(ctx, x, y - .8 * T, K.lerp(x, a.x, k), K.lerp(y - .8 * T, a.y - .8 * T, k), { seed: sc.seed + i, segments: 6, jag: 4, color: c2, width: z * 1.5, alpha: out1(t, .25, .55) }); });
      who.forEach((e, i) => {
        const t0 = .15 + i * .07, k = E.back(seg(t, t0, t0 + .35)), a = (t < t0 ? 0 : 1) * fo;
        if (t < t0) return;
        dome(ctx, sc, e.x, e.y, k, t, a * (.75 + .25 * sin(t * 4 + i)), c1, g1);
        K.glow(ctx, e.x, e.y - .6 * T, T * 1.2, c1, .35 * a * out1(t, t0, t0 + .5));
        K.ring(ctx, e.x, e.y, T * .7 * E.out(seg(t, t0, t0 + .4)), g1, z * 1.5, (1 - seg(t, t0, t0 + .5)));
        if (t < t0 + .4) K.burst(ctx, e.x, e.y - .6 * T, { n: N(sc, 8), r: T * 1.2, size: z * 2, colors: [c2, g1, c1], seed: sc.seed + i, u: seg(t, t0, t0 + .4) });
        // brilho passando pela cúpula
        const sw = (t * .9 + i * .3) % 1.6; if (sw < 1) K.px(ctx, e.x - T * .5 + sw * T, e.y - .6 * T - T * .7 + sw * T * 1.2 * .2, z * 2, '#fff', a * sin(sw * Math.PI) * .9);
      });
      // símbolo do escudo gigante pulsando sobre o conjurador
      const sy = y - 2.6 * T - (1 - E.out(seg(t, 0, .3))) * T, sa = E.pulse(seg(t, 0, .9)) * .85 * fo;
      if (sa > 0) { K.poly(ctx, [[x - T * .55, sy - T * .55], [x + T * .55, sy - T * .55], [x + T * .55, sy], [x, sy + T * .7], [x - T * .55, sy]], g1, sa * .5); K.poly(ctx, [[x - T * .4, sy - T * .4], [x + T * .4, sy - T * .4], [x + T * .4, sy - T * .05], [x, sy + T * .5], [x - T * .4, sy - T * .05]], c2, sa * .6); K.glow(ctx, x, sy, T * 1.1, g1, sa * .4); K.streak(ctx, x, sy - T * .35, x, sy + T * .3, z * 2, '#fff', sa); K.streak(ctx, x - T * .22, sy - T * .1, x + T * .22, sy - T * .1, z * 2, '#fff', sa); }
      shk(sc, 1, t, .3, .38);
    },
  });

  /* ============================== LADINO ============================== */
  const P1 = '#c8a0ff', P0 = '#3a2a5c', P2 = '#7c4bd8';

  /* Emboscada */
  FX.register('sombra', {
    dur: 1.1, hits: [0.22],
    draw(ctx, t, sc) {
      const T = sc.tile, z = sc.z, x = sc.x, y = sc.y, tx = sc.tx, ty = sc.ty, tb = ty - .6 * T, d = sc.dir, q = sc.quiet ? .4 : 1;
      // some em fumaça de sombra
      if (t < .5) { const u = seg(t, 0, .5); const r = K.rng(sc.seed + 1); for (let i = 0; i < N(sc, 9); i++) { const a = r() * TAU, rr = T * (.2 + r() * .5) * E.out(u); circ(ctx, x + cos(a) * rr, y - .6 * T + sin(a) * rr * .8 - u * T * .3 * q, T * (.2 + .3 * u) * (.6 + r() * .6), i % 2 ? P0 : P2, (1 - u) * .8); } }
      ghost(ctx, sc, x, y, 'cast1', d < 0, .5 * out1(t, 0, .12), P0);
      // rastro de sombra até as costas do alvo
      const bx = tx + d * T * .75, by = ty, run = E.out(seg(t, .04, .2));
      if (t < .6) { for (let i = 0; i < 5; i++) { const k = E.out(K.clamp(seg(t, .04, .2) - i * .1, 0, 1)); circ(ctx, K.lerp(x, bx, k), K.lerp(y - .5 * T, by - .5 * T, k), T * (.35 - i * .04), i % 2 ? P0 : P2, (1 - i * .18) * out1(t, .2, .55) * (k > 0 ? 1 : 0)); }
        K.streak(ctx, x, y - .5 * T, K.lerp(x, bx, run), K.lerp(y - .5 * T, by - .5 * T, run), z * 2, P1, out1(t, .15, .45)); }
      // assassino surge atrás do alvo e golpeia
      if (t >= .16) { const a = out1(t, .3, .62); ghost(ctx, sc, bx, by, 'atk' + (t < .28 ? 1 : 2), d > 0, .75 * a, P0); ghost(ctx, sc, bx, by, 'atk2', d > 0, .25 * a, P1); }
      if (t >= .2) {
        const u = seg(t, .2, .65), f = 1 - u, s = E.out(seg(t, .2, .3)), L = T * 1.7;
        K.streak(ctx, tx - L * .1, tb - L * .75, tx + L * .1 + 0, tb - L * .75 + L * 1.5 * s, z * 5, P0, f); K.streak(ctx, tx - L * .1, tb - L * .75, tx + L * .1, tb - L * .75 + L * 1.5 * s, z * 2.5, P1, f); K.streak(ctx, tx - L * .1, tb - L * .75, tx + L * .1, tb - L * .75 + L * 1.5 * s, z, '#fff', f);
        const s2 = E.out(seg(t, .25, .34)); K.streak(ctx, tx - d * L * .7, tb - L * .1, tx + d * L * .7 * s2 - d * L * .7 * (1 - s2) * 0, tb + L * .1, z * 3, P1, f * .8); K.streak(ctx, tx + d * L * .8, tb + L * .15 - L * .3 * s2, tx - d * L * .8 * s2 + d * L * .8 * (1 - s2), tb + L * .15, z * 2, '#fff', f * .9);
        spark(ctx, tx, tb, z * (3 + 6 * E.pulse(seg(t, .2, .45))), '#fff', f); K.glow(ctx, tx, tb, T * 1.3, '#ff4fd8', .5 * f); K.glow(ctx, tx, tb, T * 1.1, P1, .6 * f);
        K.ring(ctx, tx, ty, T * 1.5 * E.out(u), P1, z * 1.5, f);
        K.burst(ctx, tx, tb, { n: N(sc, 16), r: T * 1.9 * q, size: z * 3, colors: [P1, P0, '#fff', '#ff4fd8'], seed: sc.seed + 2, u });
        shk(sc, 3, t, .2, .3); K.flash(ctx, sc, '#b080ff', .14 * out1(t, .2, .32));
      }
    },
  });

  /* Bomba de Fumaça */
  FX.register('trapaceiro', {
    dur: 1.8, hits: [0.3],
    draw(ctx, t, sc) {
      const T = sc.tile, z = sc.z, x = sc.x, y = sc.y, tx = sc.tx, ty = sc.ty, q = sc.quiet ? .4 : 1, cb = y - .7 * T;
      // bomba em arco com pavio
      if (t < .3) {
        const p = E.out(seg(t, 0, .3)), bx = K.lerp(x, tx, p), by = K.lerp(cb, ty - .3 * T, p) - sin(p * Math.PI) * T * 1.8 * q;
        circ(ctx, bx, by, T * .2, '#1c1624', 1); circ(ctx, bx - z, by - z, T * .09, '#5a4a78', 1); K.streak(ctx, bx, by - T * .2, bx + z * 2, by - T * .38, z, '#b88a4a', 1);
        K.px(ctx, bx + z * 2, by - T * .4, z * 3, '#ffc13d', 1); K.px(ctx, bx + z * 2 + sin(t * 80) * z * 2, by - T * .5, z * 2, '#fff', .9);
        for (let i = 1; i < 4; i++) K.px(ctx, K.lerp(x, tx, Math.max(0, p - i * .08)), K.lerp(cb, ty - .3 * T, Math.max(0, p - i * .08)) - sin(Math.max(0, p - i * .08) * Math.PI) * T * 1.8 * q, z * 2, P1, .5 - i * .1);
      }
      // explosão: flash e núcleo
      if (t >= .28) {
        const u = seg(t, .28, .55); K.glow(ctx, tx, ty - .4 * T, T * (1 + 2 * u), '#fff', (1 - u) * .9); K.glow(ctx, tx, ty - .4 * T, T * 2.4, P2, .5 * (1 - u)); K.ring(ctx, tx, ty, T * 2.6 * E.out(u), P1, z * 2, 1 - u);
        shk(sc, 3, t, .28, .38); K.flash(ctx, sc, '#b080ff', .14 * out1(t, .28, .4));
        // nuvem densa: muitos puffs em camadas
        const r = K.rng(sc.seed + 2), n = N(sc, 26), fo = 1 - seg(t, 1.2, 1.8), cols = ['#2a2238', '#3a3050', '#4d4068', '#62547f', '#7a6a98'];
        for (let i = 0; i < n; i++) {
          const a = r() * TAU, rr = r(), ph = E.out(seg(t, .28 + r() * .1, 1.0)), sw = t * (i % 2 ? .6 : -.6) * rr, ox = cos(a + sw) * T * 2.1 * rr * ph, oy = sin(a + sw) * T * 1.0 * rr * ph, rise = seg(t, .5, 1.8) * T * (.3 + r() * .5), rad = T * (.4 + r() * .45) * (.5 + .5 * ph);
          circ(ctx, tx + ox, ty - .35 * T + oy - rise - rr * T * .5, rad, cols[(i + (rr * 3 | 0)) % 5], .88 * fo);
        }
        for (let i = 0; i < N(sc, 8); i++) { const a = r() * TAU, rr = T * (.4 + r() * 1.6), ph = (t * .6 + r()) % 1; K.px(ctx, tx + cos(a) * rr, ty - T * (.2 + ph * 1.4), z * 1.6, P1, fo * sin(ph * Math.PI) * .8); }
        // estrelas de atordoamento girando na fumaça
        if (t > .4) for (let i = 0; i < 3; i++) { const an = t * 5 + i * TAU / 3; spark(ctx, tx + cos(an) * T * .5, ty - 1.3 * T + sin(an) * T * .16, z * 1.6, i % 2 ? '#ffe07a' : '#fff', fo * seg(t, .4, .55)); }
        // esquiva: caster envolto em fumaça leve
        const ea = seg(t, .35, .6) * fo * .6; for (let i = 0; i < 4; i++) { const an = t * 3 + i * 1.57; circ(ctx, x + cos(an) * T * .45, y - .5 * T + sin(an) * T * .5, T * .2, P0, ea * .8); K.px(ctx, x + cos(an + .8) * T * .5, y - .5 * T + sin(an + .8) * T * .5, z * 2, P1, ea); }
      }
    },
  });

  /* Mil Cortes */
  FX.register('fantasma', {
    dur: 1.5, hits: [0.18, 0.28, 0.38, 0.48, 0.58, 0.68],
    draw(ctx, t, sc) {
      const T = sc.tile, z = sc.z, tx = sc.tx, ty = sc.ty, tb = ty - .6 * T, d = sc.dir, q = sc.quiet ? .4 : 1, L = T * 1.5;
      const angs = [-.9, .5, -.2, 2.2, -1.4, 1.2], hv = [.18, .28, .38, .48, .58, .68];
      K.glow(ctx, tx, tb, T * 2, P2, .25 * seg(t, .1, .3) * out1(t, .7, 1.1));
      // fantasma do conjurador pulando em volta do alvo em cada corte
      hv.forEach((h, i) => { const k = seg(t, h - .06, h + .06) * out1(t, h + .02, h + .16); if (k > 0 && !sc.light) { const side = i % 2 ? 1 : -1; ghost(ctx, sc, tx + side * T * 1.05, ty + (i % 3 - 1) * T * .15, 'atk' + (i % 3), side > 0, .5 * k, P1); } });
      hv.forEach((h, i) => {
        const a = angs[i] + (d < 0 ? Math.PI : 0) * 0, c = cos(angs[i]), s = sin(angs[i]), ox = (i % 3 - 1) * T * .12, oy = (i % 2 - .5) * T * .2;
        const sw = E.out(seg(t, h - .06, h + .02)), f = out1(t, h, h + .5); if (t < h - .06) return;
        const x1 = tx + ox - c * L * (1 - sw * 0) , y1 = tb + oy - s * L, x2 = tx + ox + c * L * (-1 + 2 * sw), y2 = tb + oy + s * L * (-1 + 2 * sw);
        K.streak(ctx, x1, y1, x2, y2, z * 6, P0, f * .8); K.streak(ctx, x1, y1, x2, y2, z * 3, P1, f); K.streak(ctx, x1, y1, x2, y2, z * 1.2, '#fff', f);
        if (t >= h) { const u = seg(t, h, h + .3); spark(ctx, tx + ox, tb + oy, z * (2 + 3 * E.pulse(u)), '#fff', 1 - u); K.burst(ctx, tx + ox, tb + oy, { n: N(sc, 7), r: T * 1.1 * q, size: z * 2, colors: [P1, '#fff', P2], seed: sc.seed + i * 3, u }); shk(sc, 1, t, h, h + .06); }
      });
      // golpe final: todos os cortes se fundem
      if (t >= .72) { const u = seg(t, .72, 1.1); K.glow(ctx, tx, tb, T * (.8 + 1.6 * E.out(u)), P1, .8 * (1 - u)); K.ring(ctx, tx, ty, T * 2.3 * E.out(u), P1, z * 2, 1 - u); K.ring(ctx, tx, tb, T * 1.2 * E.out(u), '#fff', z, 1 - u, .9);
        for (let i = 0; i < 6; i++) { const c = cos(angs[i]), s = sin(angs[i]), e = E.out(u); K.streak(ctx, tx + c * L * .3, tb + s * L * .3, tx + c * L * (.4 + e), tb + s * L * (.4 + e), z * 2, P1, 1 - u); }
        K.burst(ctx, tx, tb, { n: N(sc, 20), r: T * 2.2 * q, size: z * 2.5, colors: [P1, '#fff', P2], seed: sc.seed + 50, u }); shk(sc, 3, t, .72, .82); K.flash(ctx, sc, '#b080ff', .12 * out1(t, .72, .84)); }
    },
  });

  /* Execução */
  FX.register('carrasco', {
    dur: 1.5, hits: [0.3],
    draw(ctx, t, sc) {
      const T = sc.tile, z = sc.z, tx = sc.tx, ty = sc.ty, tb = ty - .6 * T, q = sc.quiet ? .4 : 1, red = '#ff3b4e', dk = '#7a1020', fo = 1 - seg(t, 1.1, 1.5);
      // mira vermelha travando no alvo
      const lk = E.out(seg(t, 0, .22)), rr = T * (1.5 - .8 * lk), pu = t < .3 ? 1 : 0;
      if (t < .5) { const a = (.4 + .6 * lk) * out1(t, .3, .5); K.ring(ctx, tx, tb, rr, red, z * 1.5, a, .9); K.ring(ctx, tx, tb, rr * .6, red, z, a, .9);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) K.streak(ctx, tx + dx * rr * 1.25, tb + dy * rr * 1.25, tx + dx * rr * .65, tb + dy * rr * .65, z * 1.5, red, a);
        K.glow(ctx, tx, tb, T * .5, red, a * .4 * (pu ? 1 + sin(t * 40) * .3 : 1)); }
      K.disc(ctx, tx, ty, T * 1.1 * lk, dk, .35 * fo, .4);
      // lâmina gigante cai (corte vertical) com guilhotina em arco
      const fall = sc.quiet ? 1 : E.in(seg(t, .12, .3)), by = K.lerp(tb - T * 4.5, tb + T * .8, fall), W = T * 1.1;
      if (t < .75) { const a = out1(t, .4, .75); K.glow(ctx, tx, by, T * 1.6, red, .3 * a);
        K.poly(ctx, [[tx - W, by - T * 1.4], [tx + W, by - T * 1.4], [tx + W, by], [tx - W * .2, by + z * 3]], '#c8c8d8', a); K.poly(ctx, [[tx - W, by - T * 1.4], [tx + W, by - T * 1.4], [tx + W, by - T * 1.15], [tx - W, by - T * 1.15]], '#6a6a82', a);
        K.streak(ctx, tx - W, by - z, tx + W * .9, by - z, z * 2, '#fff', a); }
      if (t >= .28) {
        const u = seg(t, .28, .9), f = 1 - u, s = E.out(seg(t, .28, .36));
        K.streak(ctx, tx, tb - T * 1.5 * s, tx, tb - T * 1.5 + T * 3.1 * s, z * 7, dk, f); K.streak(ctx, tx, tb - T * 1.5 * s, tx, tb - T * 1.5 + T * 3.1 * s, z * 3, red, f); K.streak(ctx, tx, tb - T * 1.5 * s, tx, tb - T * 1.5 + T * 3.1 * s, z, '#fff', f);
        K.streak(ctx, tx - T * 1.3, tb - T * .2, tx + T * 1.3 * s, tb - T * .2 + T * .1, z * 3, red, f * .8);
        K.glow(ctx, tx, tb, T * (1.2 + u), red, .8 * f); K.glow(ctx, tx, tb, T * .5, '#fff', f); K.ring(ctx, tx, ty, T * 2.2 * E.out(u), red, z * 2, f); K.ring(ctx, tx, ty, T * 1.4 * E.out(u), '#fff', z, f);
        K.burst(ctx, tx, tb, { n: N(sc, 22), r: T * 2.1 * q, size: z * 3, colors: [red, dk, '#fff', '#c01830'], seed: sc.seed, u, fall: T * .8 * q });
        crack(ctx, tx, ty, 0, T * 2.2 * E.out(seg(t, .28, .5)), sc.seed + 4, red, z * 1.5, fo); crack(ctx, tx, ty, Math.PI, T * 2.2 * E.out(seg(t, .28, .5)), sc.seed + 5, red, z * 1.5, fo);
        shk(sc, 4, t, .28, .4); K.flash(ctx, sc, '#ff4a5a', .2 * out1(t, .28, .42));
        // caveira
        const sk = E.back(seg(t, .45, .7)); if (sk > 0 && fo > 0) { const sy = ty - 1.8 * T - seg(t, .45, 1.2) * T * .6 * q; K.glow(ctx, tx, sy, T * .6, red, .4 * fo); skull(ctx, tx + z, sy + z, z * 1.6 * sk, dk, fo); skull(ctx, tx, sy, z * 1.6 * sk, '#f4efe4', fo); }
      }
    },
  });

  /* Grande Golpe */
  FX.register('rei_ladroes', {
    dur: 1.6, hits: [0.25],
    draw(ctx, t, sc) {
      const T = sc.tile, z = sc.z, x = sc.x, y = sc.y, tx = sc.tx, ty = sc.ty, tb = ty - .6 * T, d = sc.dir, q = sc.quiet ? .4 : 1, gd = '#ffd24a', gl = '#fff2b8';
      // preparo: lâmina brilha, arco largo de golpe
      const sw = E.out(seg(t, .1, .3)), fa = out1(t, .24, .7);
      if (t < .75) {
        K.glow(ctx, x + d * T * .6, y - .8 * T, T * .8 * seg(t, 0, .15) * out1(t, .15, .3), P1, .8);
        const cx = tx - d * T * 1.1, cy = tb + T * .5, R = T * 1.9, a0 = d > 0 ? -2.5 : -.64, a1 = d > 0 ? .15 : -3.0;
        K.slash(ctx, cx, cy, R, a0, a1, T * .65, P0, fa * .9, sw); K.slash(ctx, cx, cy, R - T * .1, a0, a1, T * .4, P1, fa, sw); K.slash(ctx, cx, cy, R - T * .2, a0, a1, T * .15, '#fff', fa, sw);
        K.slash(ctx, cx, cy, R * .92, a0, a1, T * .1, gd, fa * .8, sw);
      }
      if (t >= .22) {
        const u = seg(t, .22, .7), f = 1 - u; K.glow(ctx, tx, tb, T * (1 + 1.5 * E.out(u)), P1, .75 * f); K.glow(ctx, tx, tb, T * .6, '#fff', 1 - seg(t, .22, .4)); K.ring(ctx, tx, ty, T * 2 * E.out(u), P1, z * 2, f);
        K.burst(ctx, tx, tb, { n: N(sc, 18), r: T * 2 * q, size: z * 3, colors: [P1, P0, gd, '#fff'], seed: sc.seed + 1, u, up: T * .5 }); shk(sc, 4, t, .22, .34); K.flash(ctx, sc, '#c8a0ff', .18 * out1(t, .22, .36));
        // lascas do chão
        for (let i = 0; i < 4; i++) crack(ctx, tx, ty, i * 1.6 + .3, T * 1.6 * E.out(seg(t, .22, .45)), sc.seed + i, P1, z, f);
      }
      // bolsa de moedas voa do alvo ao conjurador, derramando moedas
      const fly = seg(t, .3, 1.0), p = E.inOut(fly), bx = K.lerp(tx, x, p), by = K.lerp(tb, y - .8 * T, p) - sin(fly * Math.PI) * T * 1.6 * q;
      if (t >= .3 && t < 1.05) {
        const pop = E.back(seg(t, .3, .45)), r = T * .26 * pop, a = out1(t, .9, 1.05);
        K.glow(ctx, bx, by, T * .6, gd, .5 * a); circ(ctx, bx, by + r * .15, r, '#8a5a2a', a); circ(ctx, bx - r * .25, by - r * .05, r * .5, '#b07a3a', a); K.px(ctx, bx, by - r * 1.05, z * 3, '#6a4020', a); K.streak(ctx, bx - r * .5, by - r, bx + r * .5, by - r, z * 1.5, gd, a); K.px(ctx, bx, by + r * .15, z * 3, gd, a);
        const rc = K.rng(sc.seed + 9); for (let i = 0; i < N(sc, 12); i++) { const dl = .35 + rc() * .45, tt = seg(t, dl, dl + .5), pp = E.inOut(seg(dl, .3, 1.0)), sx = K.lerp(tx, x, pp), sy = K.lerp(tb, y - .8 * T, pp) - sin(seg(dl, .3, 1) * Math.PI) * T * 1.6 * q, vx = (rc() - .5) * T * 1.2;
          if (tt > 0 && tt < 1) { K.px(ctx, sx + vx * tt, sy + T * 2.2 * tt * tt, z * 2.5, gd, 1 - tt * .6); K.px(ctx, sx + vx * tt - z / 2, sy + T * 2.2 * tt * tt - z / 2, z, gl, 1 - tt); } }
        if (t < .5) for (let i = 0; i < 5; i++) { const a2 = i * 1.26 + 1, k = seg(t, .3, .5); spark(ctx, tx + cos(a2) * T * (.4 + k), tb + sin(a2) * T * (.4 + k) * .7, z * 1.4, gd, 1 - k); }
      }
      // recebimento: brilho dourado no conjurador
      if (t > .95) { const u = seg(t, .95, 1.4); K.glow(ctx, x, y - .8 * T, T * (.5 + u), gd, .7 * (1 - u)); K.ring(ctx, x, y - .8 * T, T * .9 * E.out(u), gl, z, 1 - u, .9); spark(ctx, x + d * T * .15, y - .9 * T, z * 4 * E.pulse(u), '#fff', 1 - u * .5); }
    },
  });

  /* Lâmina Tóxica */
  FX.register('envenenador', {
    dur: 1.6, hits: [0.2],
    draw(ctx, t, sc) {
      const T = sc.tile, z = sc.z, x = sc.x, y = sc.y, tx = sc.tx, ty = sc.ty, tb = ty - .6 * T, d = sc.dir, q = sc.quiet ? .4 : 1, g1 = '#7cff5a', g2 = '#3fa83a', g3 = '#1d5a2a', fo = 1 - seg(t, 1.2, 1.6);
      // lâmina pinga veneno (antecipação)
      if (t < .2) { const k = seg(t, 0, .2); K.glow(ctx, x + d * T * .5, y - .8 * T, T * .6, g1, .6); for (let i = 0; i < 3; i++) K.px(ctx, x + d * T * (.5 + i * .12), y - .6 * T + k * T * (.3 + i * .15) * (i + 1) * .4, z * 2, g1, 1 - k); }
      // corte duplo verde
      const sw = E.out(seg(t, .08, .26)), fa = out1(t, .2, .55), cx = tx, cy = tb + T * .3, R = T * 1.6, a0 = d > 0 ? -2.4 : -.74, a1 = d > 0 ? .1 : -3.04;
      if (t < .6) { K.slash(ctx, cx, cy, R, a0, a1, T * .55, g3, fa, sw); K.slash(ctx, cx, cy, R - T * .08, a0, a1, T * .35, g1, fa, sw); K.slash(ctx, cx, cy, R - T * .16, a0, a1, T * .12, '#eaffd8', fa, sw);
        const s2 = E.out(seg(t, .16, .3)); K.streak(ctx, tx - T * 1.2, tb + T * .5, tx - T * 1.2 + T * 2.4 * s2, tb - T * .5, z * 3, g1, fa * .8); }
      if (t >= .18) {
        const u = seg(t, .18, .7), f = 1 - u; K.glow(ctx, tx, tb, T * (1 + u), g1, .7 * f); K.glow(ctx, tx, tb, T * .5, '#fff', 1 - seg(t, .18, .32)); K.ring(ctx, tx, ty, T * 1.6 * E.out(u), g1, z * 2, f);
        K.burst(ctx, tx, tb, { n: N(sc, 16), r: T * 1.8 * q, size: z * 3, colors: [g1, g2, '#eaffd8'], seed: sc.seed, u, fall: T * .9 * q }); shk(sc, 2, t, .18, .28); K.flash(ctx, sc, '#6aff3a', .1 * out1(t, .18, .3));
        // poça tóxica e gotas
        const pg = E.out(seg(t, .25, .7)); K.disc(ctx, tx, ty, T * 1.1 * pg, g3, .65 * fo, .4); K.disc(ctx, tx, ty, T * .85 * pg, g2, .5 * fo, .4); K.ring(ctx, tx, ty, T * 1.1 * pg, g1, z, .7 * fo * (.7 + .3 * sin(t * 8)), .4);
        const r = K.rng(sc.seed + 6);
        for (let i = 0; i < N(sc, 7); i++) { const ox = (r() - .5) * T * .9, t0 = .22 + r() * .5, tt = seg(t, t0, t0 + .35); if (tt > 0 && tt < 1) { K.px(ctx, tx + ox, tb - T * .5 + tt * T * 1.1, z * 2.5, g1, 1 - tt * .3); K.px(ctx, tx + ox, tb - T * .5 + tt * T * 1.1 - z * 2, z * 1.5, g2, .6); } if (tt >= 1) K.ring(ctx, tx + ox, ty, T * .2 * seg(t, t0 + .35, t0 + .55), g1, z, (1 - seg(t, t0 + .35, t0 + .55)) * fo); }
        // bolhas e fumaça tóxica subindo, caveira esverdeada
        for (let i = 0; i < N(sc, 10); i++) { const ph = (t * .7 + r()) % 1, bx = tx + (r() - .5) * T * 1.2, by = ty - T * .2 - ph * T * 1.9, br = z * (1.5 + r() * 1.5);
          ctx.save(); ctx.globalAlpha = .8 * fo * sin(ph * Math.PI) * seg(t, .3, .5); ctx.strokeStyle = i % 2 ? g1 : g2; ctx.lineWidth = z; ctx.beginPath(); ctx.arc(bx + sin(t * 5 + i) * z * 2, by, br, 0, TAU); ctx.stroke(); ctx.restore(); }
        for (let i = 0; i < N(sc, 5); i++) { const ph = (t * .5 + i * .2) % 1; circ(ctx, tx + sin(i * 2 + t * 2) * T * .4, ty - T * .4 - ph * T * 1.4, T * (.25 + ph * .25), g2, .28 * fo * (1 - ph)); }
        const sk = seg(t, .4, .6); if (sk > 0) skull(ctx, tx, ty - 1.65 * T - seg(t, .4, 1.2) * T * .3 * q, z * 1.3, g1, .8 * fo * sk);
      }
    },
  });
})();
