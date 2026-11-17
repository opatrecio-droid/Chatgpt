/* Aurora 046 · Animações de habilidades: Espadachim, Cavaleiro e Arqueiro (21 chaves). Somente visual. */
(function () {
  'use strict';
  if (typeof G === 'undefined' || G.HEADLESS || !G.A || !G.A.SkillFX) return;
  const FX = G.A.SkillFX, K = FX.kit, TAU = Math.PI * 2, C = Math.cos, S = Math.sin, PI = Math.PI;

  /* ---------- helpers ---------- */
  const geo = sc => { const l = sc.tile; return { x: sc.x, y: sc.y, by: sc.y - l * 0.6, hy: sc.y - l * 1.1, tx: sc.tx, ty: sc.ty, tb: sc.ty - l * 0.55, th: sc.ty - l * 1.15, d: sc.dir || 1, l, z: sc.z }; };
  const N = (sc, n) => (sc.light ? Math.max(2, Math.ceil(n / 3)) : n);
  const seg = K.seg, E = K.ease;
  const out = (t, a, b) => 1 - seg(t, a, b);               // some entre a e b
  const env = (t, a, b, c, d) => seg(t, a, b) * (1 - seg(t, c, d)); // sobe a..b, desce c..d
  /* registro com modo quiet: menos partículas */
  const reg = (key, def) => { const dr = def.draw; def.draw = (ctx, t, sc, k, info) => dr(ctx, t, sc.quiet && !sc.light ? Object.assign(Object.create(sc), { light: true }) : sc, k, info); FX.register(key, def); };

  /* clarão em cruz */
  function star(ctx, x, y, r, col, a, k) {
    if (!(r > 0)) return; k = k || 0.16; ctx.save(); ctx.globalAlpha = K.clamp(a == null ? 1 : a, 0, 1); ctx.fillStyle = col; ctx.beginPath();
    ctx.moveTo(x - r, y); ctx.lineTo(x, y - r * k); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r * k); ctx.closePath();
    ctx.moveTo(x, y - r); ctx.lineTo(x + r * k, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * k, y); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  /* lâmina cônica entre dois pontos (cauda fina -> ponta) */
  function blade(ctx, x1, y1, x2, y2, w, col, a, core) {
    const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, mx = x1 + dx * 0.62, my = y1 + dy * 0.62;
    K.poly(ctx, [[x1, y1], [mx + nx * w, my + ny * w], [x2, y2], [mx - nx * w * 0.35, my - ny * w * 0.35]], col, a);
    if (core) K.poly(ctx, [[x1 + dx * 0.18, y1 + dy * 0.18], [mx + nx * w * 0.4, my + ny * w * 0.4], [x2, y2], [mx - nx * w * 0.1, my - ny * w * 0.1]], core, a);
  }
  /* corte diagonal centrado em (x,y): u 0..1 */
  function cut(ctx, x, y, ang, len, w, u, col, core, a) {
    if (u <= 0 || u >= 1) return; const dx = C(ang), dy = S(ang), h = E.out(K.clamp(u * 1.7, 0, 1)), tl = K.clamp((u - 0.2) * 1.5, 0, 1);
    blade(ctx, x + dx * len * (tl * 0.9 - 0.5), y + dy * len * (tl * 0.9 - 0.5), x + dx * len * (h - 0.5), y + dy * len * (h - 0.5), w * (1 - K.clamp((u - 0.5) * 2, 0, 1) * 0.6), col, (a == null ? 1 : a) * (1 - K.clamp((u - 0.5) / 0.5, 0, 1)), core);
  }
  /* impacto padrão: brilho + cruz + anel + faíscas. u 0..1 */
  function impact(ctx, sc, x, y, u, o) {
    if (u <= 0 || u >= 1) return; const l = sc.tile, z = sc.z, r = (o.r || 1) * l, e = E.out(u), cols = o.cols;
    K.glow(ctx, x, y, r * (0.5 + 0.7 * e), cols[0], 0.75 * (1 - u));
    star(ctx, x, y, r * (0.45 + 0.6 * e), o.core || '#fff', 1 - u, 0.1 + 0.12 * u);
    if (!o.noRing) K.ring(ctx, x, y + (o.ry || 0), r * e * 1.1, cols[1] || cols[0], z * (2.4 - u * 1.6), (1 - u) * 0.9, o.sq == null ? 1 : o.sq);
    K.burst(ctx, x, y, { n: N(sc, o.n || 10), r: r * 1.25, size: z * 1.9, colors: cols, seed: o.seed || 5, u, squash: 0.85, fall: o.fall == null ? l * 0.3 : o.fall });
  }
  /* partículas que sobem de um disco no chão */
  function motes(ctx, sc, x, y, o) {
    const rnd = K.rng(o.seed || 3), n = N(sc, o.n || 10), t = o.t;
    for (let i = 0; i < n; i++) {
      const ph = rnd(), a = rnd() * TAU, rr = Math.sqrt(rnd()) * o.r, sp = 0.6 + rnd() * 0.6, u = (t * (o.rate || 0.7) * sp + ph) % 1;
      const px = x + C(a) * rr + S(u * TAU * 2 + i) * (o.sway || 0), py = y + S(a) * rr * 0.42 - u * o.h;
      K.px(ctx, px, py, o.size * (1 - u * 0.4), o.cols[i % o.cols.length], (o.a == null ? 1 : o.a) * Math.min(1, u * 5) * (1 - u));
    }
  }
  const chev = (ctx, x, y, s, col, a) => K.poly(ctx, [[x, y - s], [x + s, y], [x + s * 0.55, y + s * 0.32], [x, y - s * 0.38], [x - s * 0.55, y + s * 0.32], [x - s, y]], col, a);
  function flame(ctx, x, y, h, w, t, a, seed, cols) {
    for (let k = 0; k < cols.length; k++) {
      const s = 1 - k * 0.27, f = S(t * 14 + seed * 1.7 + k) * 0.14;
      K.poly(ctx, [[x - w * s, y], [x - w * s * 0.6 + h * f * 0.3, y - h * s * 0.5], [x + h * f * 0.5, y - h * s * (1 + f)], [x + w * s * 0.6 + h * f * 0.3, y - h * s * 0.5], [x + w * s, y]], cols[k], a);
    }
  }
  function stunStars(ctx, sc, x, y, t, a, col) {
    for (let i = 0; i < 3; i++) { const an = t * 7 + i * TAU / 3; K.diamond(ctx, x + C(an) * sc.tile * 0.32, y + S(an) * sc.tile * 0.1, sc.z * 1.9, col || '#ffe48a', a * (S(an) > -0.2 ? 1 : 0.5), true); }
  }
  function arrow(ctx, x, y, ang, len, z, shaft, head, a) {
    ctx.save(); ctx.globalAlpha = a == null ? 1 : K.clamp(a, 0, 1); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = shaft; ctx.fillRect(-len, -z / 2, len, Math.max(1, z));
    ctx.fillStyle = '#e8f1d8'; ctx.fillRect(-len, -z * 1.3, z * 2.5, z * 0.9); ctx.fillRect(-len, z * 0.4, z * 2.5, z * 0.9);
    ctx.fillStyle = head; ctx.beginPath(); ctx.moveTo(z * 3.6, 0); ctx.lineTo(0, -z * 1.7); ctx.lineTo(0, z * 1.7); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function shield(ctx, x, y, s, col, rim, a, emb) {
    const P = [[-1, -1.05], [1, -1.05], [1, 0.1], [0.62, 0.78], [0, 1.2], [-0.62, 0.78], [-1, 0.1]].map(p => [x + p[0] * s * 0.8, y + p[1] * s]);
    K.poly(ctx, P, rim, a); K.poly(ctx, P.map(p => [x + (p[0] - x) * 0.78, y + (p[1] - y) * 0.78]), col, a);
    if (emb) { K.poly(ctx, [[x - s * 0.1, y - s * 0.7], [x + s * 0.1, y - s * 0.7], [x + s * 0.1, y + s * 0.7], [x - s * 0.1, y + s * 0.7]], emb, a * 0.9); K.poly(ctx, [[x - s * 0.5, y - s * 0.15], [x + s * 0.5, y - s * 0.15], [x + s * 0.5, y + s * 0.05], [x - s * 0.5, y + s * 0.05]], emb, a * 0.9); }
  }
  const arcS = (ctx, x, y, r, a0, a1, w, col, a) => { ctx.save(); ctx.globalAlpha = K.clamp(a, 0, 1); ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, w); ctx.beginPath(); ctx.arc(x, y, r, a0, a1); ctx.stroke(); ctx.restore(); };
  /* linhas de velocidade horizontais */
  function speed(ctx, sc, x, y, d, u, n, col, seed, spread) {
    const rnd = K.rng(seed), l = sc.tile;
    for (let i = 0; i < N(sc, n); i++) { const oy = (rnd() - 0.5) * (spread || 1.4) * l, len = (0.5 + rnd() * 0.9) * l, ox = (rnd() - 0.2) * l * 1.6, p = (u * 1.3 + rnd()) % 1; K.streak(ctx, x - d * (ox + p * l * 0.8), y + oy, x - d * (ox + p * l * 0.8 + len), y + oy, sc.z, col, (1 - p) * 0.55); }
  }
  /* poeira do chão */
  const dust = (ctx, sc, x, y, u, seed, r, n, cols) => K.burst(ctx, x, y, { n: N(sc, n || 10), r: r || sc.tile, size: sc.z * 2.4, colors: cols || ['#d8c9a8', '#a89878'], seed, u, squash: 0.28, up: sc.tile * 0.25 });
  /* trajeto de projétil do herói ao alvo, com arco */
  const path = (g, u, arc) => ({ x: K.lerp(g.x + g.d * g.l * 0.45, g.tx, u), y: K.lerp(g.by, g.tb, u) - (arc || 0) * g.l * S(u * PI) });

  /* ======================= BÁSICAS ======================= */
  /* Dança dos Ecos */
  reg('base:esp', { dur: 1.5, hits: [0.3, 0.5, 0.7], draw(ctx, t, sc) {
    const g = geo(sc), { x, y, by, l, z, d } = g;
    const w = seg(t, 0, 0.24);
    if (t < 0.3) {
      K.ring(ctx, x, y, l * (2.3 - 1.7 * E.out(w)), '#ff7a5a', z, 0.8 * (1 - w * 0.3));
      K.ring(ctx, x, y, l * (1.6 - 1.1 * w), '#ffd0a0', z, 0.6);
      K.glow(ctx, x, by, l * (0.4 + 0.7 * w), '#ff5a3a', 0.65 * w);
      const rnd = K.rng(sc.seed); for (let i = 0; i < N(sc, 10); i++) { const a = rnd() * TAU, r = l * 2.2 * (1 - E.in(w)) + l * 0.3; K.px(ctx, x + C(a) * r, by + S(a) * r * 0.5, z * 1.6, i % 2 ? '#ffd0a0' : '#ff7a5a', w); }
    }
    /* turbilhão de cortes (raio 2,1) */
    const wu = seg(t, 0.2, 1.1), a = Math.sin(K.clamp(wu, 0, 1) * PI) ** 0.6, r = 2.1 * l * E.out(seg(t, 0.2, 0.42)) * (1 - 0.15 * seg(t, 0.85, 1.1));
    if (wu > 0 && wu < 1) {
      K.ring(ctx, x, y, r, '#ff7a5a', z, 0.35 * a); K.disc(ctx, x, y, r, '#ff5a3a', 0.1 * a);
      for (let L = 0; L < 2; L++) for (let k = 0; k < 3; k++) {
        const a0 = t * 15 * (L ? -1 : 1) + k * TAU / 3 + L, yy = y + (L ? -0.85 : -0.15) * l;
        ctx.save(); ctx.translate(x, yy); ctx.scale(1, 0.42);
        K.slash(ctx, 0, 0, r * (L ? 0.78 : 1), a0, a0 + (L ? -1.5 : 1.5), l * 0.2, '#e8503e', 0.85 * a, 1);
        K.slash(ctx, 0, 0, r * (L ? 0.78 : 1), a0, a0 + (L ? -1.5 : 1.5), l * 0.06, '#fff3d6', a, 1); ctx.restore();
      }
    }
    [0.3, 0.5, 0.7].forEach((h, i) => { const u = seg(t, h, h + 0.3); if (u > 0 && u < 1) {
      K.burst(ctx, x, by, { n: N(sc, 12), r: l * 2.3, size: z * 1.8, colors: ['#ff7a5a', '#ffd0a0', '#fff'], seed: sc.seed + i * 9, u, squash: 0.5 });
      cut(ctx, x + d * l * (0.9 + i * 0.1), by + (i - 1) * l * 0.2, (i % 2 ? 0.5 : -0.5) + (d < 0 ? PI : 0), l * 1.2, l * 0.1, u, '#ff7a5a', '#fff', 0.9); } });
    /* surgimento dos ecos */
    for (const s of [-1, 1]) {
      const ex = x + s * 0.7 * l, ey = y + 0.5 * l, u = seg(t, 0.22, 0.75);
      if (u > 0 && u < 1) {
        K.glow(ctx, ex, ey - 0.6 * l, l * 1.1, '#ff6a50', 0.7 * (1 - u));
        ctx.save(); ctx.globalAlpha = 0.8 * (1 - u); ctx.fillStyle = '#ffd0a0'; ctx.fillRect(Math.round(ex - l * 0.14 * (1 - u)), Math.round(ey - l * 1.5), Math.max(1, Math.round(l * 0.28 * (1 - u))), Math.round(l * 1.5)); ctx.restore();
        K.ring(ctx, ex, ey, l * (0.2 + 0.9 * E.out(u)), '#ff7a5a', z, 1 - u);
      }
    }
    if (!sc.world) { /* prévia: ecos avançam e cortam o alvo */
      const ends = [[g.tx - d * 0.55 * l, g.ty + 0.25 * l], [g.tx - d * 0.3 * l, g.ty - 0.35 * l]], sx = [x + 0.7 * l, x - 0.7 * l];
      for (let i = 0; i < 2; i++) {
        const p = E.inOut(seg(t, 0.28 + i * 0.04, 0.62 + i * 0.04)), al = 0.6 * seg(t, 0.24, 0.34) * (1 - seg(t, 1.1, 1.45));
        for (let k = 2; k >= 0; k--) { const pp = E.inOut(K.clamp(seg(t, 0.28 + i * 0.04, 0.62 + i * 0.04) - k * 0.07, 0, 1));
          const px = K.lerp(sx[i], ends[i][0], pp), py = K.lerp(y + 0.5 * l, ends[i][1], pp), at = t > 0.62 + i * 0.04;
          sc.drawCaster(ctx, px, py, { alpha: al * (k ? 0.22 : 1), pose: at ? 'atk' + (Math.floor(t * 12) % 3) : 'walk' + (Math.floor(t * 14) % 4), flip: d < 0, tint: '#ff6a50' }); }
        for (let c = 0; c < 4; c++) { const t0 = 0.66 + i * 0.05 + c * 0.14, u = seg(t, t0, t0 + 0.14); cut(ctx, g.tx, g.tb, (c % 2 ? 0.7 : -0.7) + (c > 1 ? 0.5 : 0), l * 1.3, l * 0.1, u, '#ff7a5a', '#fff', 0.95); K.glow(ctx, g.tx, g.tb, l * 0.5 * u * (1 - u) * 4, '#ff7a5a', 0.6); }
      }
    }
  } });

  /* Muralha */
  reg('base:cav', { dur: 1.7, hits: [0.28], draw(ctx, t, sc) {
    const g = geo(sc), { x, y, by, l, z, d } = g, w = seg(t, 0, 0.28);
    /* brado: onda de provocação no chão */
    for (let i = 0; i < 3; i++) { const u = seg(t, 0.12 + i * 0.1, 0.75 + i * 0.1); if (u > 0 && u < 1) K.ring(ctx, x, y, 4.5 * l * E.out(u), i ? '#8fb4ee' : '#dbe9ff', z * (2.5 - u * 1.5), (1 - u) * 0.8); }
    K.disc(ctx, x, y, 4.5 * l * E.out(seg(t, 0.1, 0.6)), '#5b7fb5', 0.12 * out(t, 0.3, 0.9));
    K.glow(ctx, x, by, l * (0.5 + 0.7 * w), '#8fb4ee', 0.6 * w * out(t, 0.7, 1.1));
    /* escudo emblema à frente do herói */
    const su = E.back(seg(t, 0.12, 0.42)), sa = env(t, 0.1, 0.3, 1.3, 1.7), sx = x + d * l * 0.95, sy = by - l * 0.05 + S(t * 6) * z;
    if (sa > 0) {
      K.glow(ctx, sx, sy, l * 1.2 * su, '#8fb4ee', 0.5 * sa);
      shield(ctx, sx, sy, l * 0.85 * su, '#5b7fb5', '#dbe9ff', sa, '#ffd36a');
      const sh = seg(t, 0.4, 0.7); if (sh > 0 && sh < 1) { ctx.save(); ctx.globalAlpha = 0.8 * (1 - sh); ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(sx - l * 0.7 + sh * l * 1.4), Math.round(sy - l * 0.9), Math.round(l * 0.14), Math.round(l * 1.8)); ctx.restore(); }
    }
    /* chamas de provocação sobre inimigos */
    const foes = [{ x: g.tx, y: g.ty }].concat(sc.others || []);
    foes.forEach((o, i) => { const u = seg(t, 0.3 + i * 0.05, 0.5 + i * 0.05), a = u * out(t, 1.1, 1.6); if (a > 0) {
      const oy = o.y - l * 1.35 - E.pulse(u) * l * 0.2 - S(t * 8 + i) * z; K.diamond(ctx, o.x, oy, z * 3.2, '#ff5a3a', a, true); K.px(ctx, o.x, oy - z * 2.6, z * 1.6, '#ff5a3a', a); K.px(ctx, o.x, oy + z * 2.2, z * 1.6, '#ffe0b0', a);
      K.glow(ctx, o.x, oy, l * 0.35, '#ff5a3a', 0.5 * a); K.glow(ctx, o.x, o.y - l * 0.5, l * 0.6, '#ff5a3a', 0.25 * a); } });
    /* hexágonos da barreira ao redor do herói */
    const ba = env(t, 0.3, 0.55, 1.2, 1.7);
    if (ba > 0) for (let i = 0; i < N(sc, 6); i++) { const a = i * TAU / 6 + t * 1.5, px = x + C(a) * l * 0.75, py = by + S(a) * l * 0.3 - l * 0.05; K.diamond(ctx, px, py, z * 2.6, '#8fb4ee', ba * (0.55 + 0.4 * S(a)), true); K.px(ctx, px, py, z, '#fff', ba); }
    if (t > 0.26 && t < 0.5) { const u = seg(t, 0.26, 0.5); dust(ctx, sc, x, y, u, sc.seed, l * 1.6, 10); sc.shake(2); K.flash(ctx, sc, '#bcd4ff', 0.12 * (1 - u)); }
  } });

  /* Fênix Ardente */
  reg('base:arq', { dur: 1.5, hits: [0.28], draw(ctx, t, sc) {
    const g = geo(sc), { x, y, by, l, z, d, tx, tb } = g, F = ['#ff5a1e', '#ffa030', '#ffe27a', '#fff6c8'];
    const wa = seg(t, 0, 0.14); K.glow(ctx, x + d * l * 0.4, by, l * (0.5 + wa * 0.8), '#ff8a30', 0.7 * wa * out(t, 0.12, 0.4));
    if (t < 0.3) for (let i = 0; i < N(sc, 8); i++) { const a = (i / 8) * TAU, r = l * 0.9 * (1 - wa); K.px(ctx, x + C(a) * r, by + S(a) * r, z * 1.6, F[i % 3], wa); }
    const fu = seg(t, 0.06, 0.28);
    /* rastro de fogo no arco */
    for (let i = 0; i < N(sc, 16); i++) { const u = fu * (1 - i / 16 * 0.85), p = path(g, u, 0.35); if (u <= 0) continue; const f = 1 - i / 16, rr = K.rng(sc.seed + i);
      K.px(ctx, p.x + (rr() - 0.5) * z * 4, p.y + (rr() - 0.2) * z * 4 + i * z * 0.5 * (1 - fu * 0.5), z * (3 - i * 0.14), F[Math.min(3, Math.floor(i / 4))], f * out(t, 0.3, 0.5)); }
    if (!sc.world && fu > 0 && fu < 1) { /* prévia: a ave */
      const p = path(g, E.in(fu) * 0.5 + fu * 0.5, 0.35); K.glow(ctx, p.x, p.y, l * 0.9, '#ff8a30', 0.7);
      try { const cv = G.A.phoenixSkillSprite(Math.floor(t * 16) % 4); if (cv) { ctx.save(); ctx.translate(p.x, p.y); if (d < 0) ctx.scale(-1, 1); ctx.drawImage(cv, -19 * z, -13 * z, 38 * z, 26 * z); ctx.restore(); } } catch (e) { /* sem sprite */ }
    }
    /* explosão flamejante */
    const u = seg(t, 0.28, 0.85);
    if (u > 0 && u < 1) {
      K.glow(ctx, tx, tb, l * (0.8 + u * 1.2), '#ff8a30', 0.8 * (1 - u)); star(ctx, tx, tb, l * (0.5 + 1.0 * E.out(u)), '#fff6c8', 1 - u, 0.14);
      K.ring(ctx, tx, g.ty, l * 1.6 * E.out(u), '#ff8a30', z * 2.5 * (1 - u) + 1, 0.9 * (1 - u)); K.ring(ctx, tx, tb, l * 0.9 * E.out(u), '#ffe27a', z * 2, 0.9 * (1 - u), 1);
      K.burst(ctx, tx, tb, { n: N(sc, 18), r: l * 1.8, size: z * 2.6, colors: F, seed: sc.seed + 3, u, up: l * 0.9, squash: 0.8 });
      for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + 0.3, r = l * 0.5 * E.out(u); flame(ctx, tx + C(a) * r, g.ty + S(a) * r * 0.4, l * (0.9 - u * 0.5), l * 0.22, t, (1 - u), sc.seed + i, F); }
      if (t < 0.5) { sc.shake(3); K.flash(ctx, sc, '#ffb060', 0.14 * (1 - u)); }
    }
    /* chamas residuais (queimadura) */
    const ra = env(t, 0.4, 0.6, 1.15, 1.5);
    if (ra > 0) for (let i = 0; i < N(sc, 4); i++) { const ox = (i - 1.5) * l * 0.3; flame(ctx, tx + ox, g.ty - l * 0.05 + (i % 2) * z * 2, l * (0.5 + 0.15 * S(t * 9 + i)), l * 0.14, t, ra, i * 3, F);
      K.px(ctx, tx + ox + S(t * 5 + i) * z * 3, g.ty - l * (0.6 + ((t * 1.4 + i * 0.27) % 0.6)), z * 1.4, '#ffe27a', ra * 0.8); }
  } });

  /* ======================= ESPADACHIM ======================= */
  /* Estocada Dupla */
  reg('duelista', { dur: 0.95, hits: [0.18, 0.34], draw(ctx, t, sc) {
    const g = geo(sc), { x, y, by, l, z, d, tx, tb } = g, R = ['#c8473d', '#ff7a5a', '#fff3d6'];
    K.glow(ctx, x + d * l * 0.4, by, l * 0.7, '#ff7a5a', 0.5 * env(t, 0, 0.08, 0.1, 0.25));
    for (let i = 0; i < 2; i++) {
      const t0 = 0.06 + i * 0.16, u = seg(t, t0, t0 + 0.13), fa = out(t, t0 + 0.12, t0 + 0.34);
      const oy = (i ? 0.18 : -0.12) * l, sy = by + oy, ex = tx - d * l * 0.15, ey = tb + oy * 0.6;
      if (u > 0 && fa > 0) {
        const hx = K.lerp(x + d * l * 0.4, ex, E.out(u)), hy = K.lerp(sy, ey, E.out(u)), bx = K.lerp(x + d * l * 0.4, ex, E.out(K.clamp(u - 0.5, 0, 1))), by2 = K.lerp(sy, ey, E.out(K.clamp(u - 0.5, 0, 1)));
        blade(ctx, bx, by2 - z * 3, hx, hy, z * 3.2, R[1], fa * 0.9, R[2]); K.streak(ctx, bx, by2, hx, hy, z * 1.3, '#fff', fa);
        K.glow(ctx, hx, hy, l * 0.35, R[1], 0.7 * fa);
        sc.drawCaster(ctx, K.lerp(x, ex - d * l * 0.7, E.out(u)) - d * l * 0.0, y, { alpha: 0.4 * fa, pose: 'atk' + (i + 1), flip: d < 0, tint: R[0] });
        speed(ctx, sc, hx, hy, d, u, 4, R[1], sc.seed + i, 0.5);
      }
      const hu = seg(t, t0 + 0.12, t0 + 0.42);
      if (hu > 0) { impact(ctx, sc, ex, ey, hu, { r: 0.7 + i * 0.25, cols: [R[1], R[0], '#fff'], seed: sc.seed + i, n: 10 }); cut(ctx, ex, ey, (i ? -0.9 : 0.9) + (d < 0 ? PI : 0), l * 1.3, l * 0.09, hu * 1.2, R[1], '#fff', 1); }
      if (hu > 0 && hu < 0.15) sc.shake(i ? 3 : 2);
    }
  } });

  /* Brado de Guerra */
  reg('mercenario', { dur: 1.6, hits: [0.24], draw(ctx, t, sc) {
    const g = geo(sc), { x, y, by, hy, l, z, d } = g, O = ['#ff5a3a', '#ffb060', '#ffe9b8'];
    const w = seg(t, 0, 0.2);
    if (t < 0.28) { K.ring(ctx, x, y, l * (1.8 - 1.4 * w), O[1], z, 0.7); K.glow(ctx, x, by, l * (0.4 + 0.8 * w), O[0], 0.7 * w); }
    for (let i = 0; i < 3; i++) { const u = seg(t, 0.2 + i * 0.1, 0.85 + i * 0.1); if (u > 0 && u < 1) K.ring(ctx, x, y, 4.5 * l * E.out(u), O[i], z * (3 - u * 2), (1 - u) * 0.85); }
    K.disc(ctx, x, y, 4.5 * l * E.out(seg(t, 0.2, 0.7)), O[0], 0.12 * out(t, 0.4, 1));
    /* ondas sonoras saindo da boca */
    for (let i = 0; i < 4; i++) { const u = seg(t, 0.16 + i * 0.06, 0.6 + i * 0.06); if (u > 0 && u < 1) { const r = l * (0.4 + 1.8 * E.out(u)), c = d < 0 ? PI : 0; arcS(ctx, x + d * l * 0.15, hy, r, c - 0.8, c + 0.8, z * (3 - u * 2), i % 2 ? O[1] : O[2], (1 - u) * 0.9); } }
    if (t > 0.2 && t < 0.45) { sc.shake(2); K.flash(ctx, sc, '#ffb060', 0.1 * (1 - seg(t, 0.2, 0.45))); dust(ctx, sc, x, y, seg(t, 0.2, 0.7), sc.seed, l * 2.8, 12); }
    /* selos de ataque subindo no herói e aliados */
    const us = [{ x, y }].concat(sc.allies || []);
    us.forEach((o, k) => { const st = 0.3 + k * 0.08, a = env(t, st, st + 0.15, 1.2, 1.55); if (a <= 0) return;
      K.glow(ctx, o.x, o.y - l * 0.6, l * 0.8, O[0], 0.35 * a);
      for (let i = 0; i < 3; i++) { const p = ((t - st) * 0.9 + i / 3) % 1; chev(ctx, o.x + (i - 1) * l * 0.28, o.y - l * (0.1 + p * 1.5), z * 3, i % 2 ? O[1] : O[0], a * Math.sin(p * PI)); K.px(ctx, o.x + (i - 1) * l * 0.28, o.y - l * (0.1 + p * 1.5) + z * 4, z, O[2], a * Math.sin(p * PI)); }
      K.ring(ctx, o.x, o.y, l * 0.7, O[1], z, 0.6 * a); });
  } });

  /* Dança das Lâminas */
  reg('mestre_laminas', { dur: 1.4, hits: [0.2, 0.38, 0.56, 0.74, 0.92], draw(ctx, t, sc) {
    const g = geo(sc), { x, y, by, l, z, d } = g, R = ['#c8473d', '#ff7a5a', '#fff3d6'];
    const foes = [{ x: g.tx, y: g.ty }].concat((sc.others || []).slice(0, 4)); if (foes.length < 3) foes.push({ x: g.tx - d * l * 0.5, y: g.ty + l * 0.3 }, { x: g.tx + d * l * 0.5, y: g.ty - l * 0.3 });
    K.glow(ctx, x, by, l * 0.9, R[1], 0.4 * env(t, 0, 0.1, 0.15, 0.4));
    K.ring(ctx, g.tx, g.ty, l * 2.6 * E.out(seg(t, 0, 0.3)), R[1], z, 0.3 * out(t, 0.3, 1.3));
    for (let i = 0; i < 5; i++) {
      const t0 = 0.12 + i * 0.18, f = foes[i % foes.length], p = foes[(i + foes.length - 1) % foes.length], u = seg(t, t0, t0 + 0.2), fy = f.y - l * 0.55;
      if (u <= 0) continue;
      if (i > 0 && u < 0.5) { const m = seg(t, t0 - 0.05, t0 + 0.08); K.streak(ctx, p.x, p.y - l * 0.5, K.lerp(p.x, f.x, m), K.lerp(p.y - l * 0.5, fy, m), z * 1.2, R[1], 0.5 * (1 - m * 0.5)); }
      const ang = [-0.75, 0.7, -0.3, 0.95, -1.1][i] + (d < 0 ? PI : 0);
      impact(ctx, sc, f.x, fy, u, { r: 0.9, cols: [R[1], R[0], '#fff'], seed: sc.seed + i, n: 9 });
      cut(ctx, f.x, fy, ang, l * 2.1, l * 0.17, u, R[1], '#fff', 1); K.glow(ctx, f.x, fy, l * 0.9 * Math.sin(u * PI), R[1], 0.6);
      /* fantasma do herói passando pelo alvo */
      if (u < 0.7) sc.drawCaster(ctx, f.x - d * l * 0.6, f.y + l * 0.05, { alpha: 0.3 * (1 - u / 0.7), pose: 'atk' + (i % 3), flip: d < 0, tint: R[0] });
    }
    if (t > 0.9 && t < 1.4) { const u = seg(t, 0.9, 1.4); K.ring(ctx, x, y, l * (0.4 + u), R[1], z, 0.5 * (1 - u)); }
  } });

  /* Corte Fantasma */
  reg('espada_fantasma', { dur: 1.3, hits: [0.3], draw(ctx, t, sc) {
    const g = geo(sc), { x, y, by, l, z, d, tx, tb } = g, G1 = ['#7fd8ff', '#c8f4ff', '#ffffff'];
    const w = seg(t, 0, 0.22);
    /* herói vira espectro: ecos translúcidos pulsando */
    const ga = env(t, 0.02, 0.1, 0.25, 0.5);
    for (let i = 1; i <= 3; i++) sc.drawCaster(ctx, x - d * l * 0.22 * i + S(t * 40 + i) * z, y, { alpha: 0.28 * ga / i, pose: 'atk0', flip: d < 0, tint: G1[0] });
    K.glow(ctx, x, by, l * (0.5 + w), '#9fe8ff', 0.5 * ga);
    /* fantasma investe até o alvo */
    const m = seg(t, 0.12, 0.3);
    if (m > 0 && t < 0.55) { for (let i = 0; i < 4; i++) { const mm = E.out(K.clamp(m - i * 0.12, 0, 1)); sc.drawCaster(ctx, K.lerp(x, tx - d * l * 0.7, mm), K.lerp(y, g.ty, mm), { alpha: 0.5 * (1 - i * 0.22) * out(t, 0.3, 0.55), pose: 'atk1', flip: d < 0, tint: i ? G1[0] : G1[1] }); } }
    /* o corte: linha branca que se abre */
    const u = seg(t, 0.28, 0.9), ang = -0.8 + (d < 0 ? PI * 0.0 : 0) * 1, len = l * 2.6;
    if (t > 0.26) {
      const gp = E.out(seg(t, 0.28, 0.4)), ga2 = (1 - seg(t, 0.6, 1.0));
      const cx = tx, cy = tb, dx = C(ang) * d, dy = S(ang), nx = -dy, ny = dx, open = E.out(seg(t, 0.3, 0.7)) * l * 0.22;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; K.poly(ctx, [[cx - dx * len / 2 * gp, cy - dy * len / 2 * gp], [cx + nx * open, cy + ny * open], [cx + dx * len / 2 * gp, cy + dy * len / 2 * gp], [cx - nx * open, cy - ny * open]], G1[0], 0.55 * ga2); ctx.restore();
      K.streak(ctx, cx - dx * len / 2 * gp, cy - dy * len / 2 * gp, cx + dx * len / 2 * gp, cy + dy * len / 2 * gp, z * 2, '#fff', ga2);
      K.glow(ctx, cx, cy, l * 1.4 * gp, G1[0], 0.45 * ga2);
      if (t < 0.5) { star(ctx, cx, cy, l * 1.6 * (1 - seg(t, 0.28, 0.5)), '#fff', 1, 0.08); K.flash(ctx, sc, '#bfeaff', 0.14 * (1 - seg(t, 0.28, 0.45))); sc.shake(3); }
      /* estrela crítica vermelha */
      const cu = seg(t, 0.3, 0.7); if (cu < 1) { star(ctx, cx, cy, l * 0.9 * E.out(cu), '#ff6a5a', 1 - cu, 0.12); K.ring(ctx, cx, cy, l * 1.5 * E.out(cu), '#ff8a7a', z * 2, 0.8 * (1 - cu), 1); }
    }
    /* almas subindo */
    const rnd = K.rng(sc.seed); for (let i = 0; i < N(sc, 14); i++) { const o = rnd(), st = 0.32 + rnd() * 0.2, uu = seg(t, st, st + 0.8); if (uu <= 0 || uu >= 1) continue; K.px(ctx, tx + (o - 0.5) * l * 1.6 + S(uu * 9 + i) * z * 3, tb + (rnd() - 0.5) * l * 0.8 - uu * l * 1.4, z * (1.5 + rnd() * 1.5), i % 3 ? G1[1] : '#fff', (1 - uu) * 0.9); }
  } });

  /* Terremoto */
  reg('senhor_guerra', { dur: 1.7, hits: [0.3, 0.46, 0.62], draw(ctx, t, sc) {
    const g = geo(sc), { x, y, by, l, z } = g, R = 2.8 * l, rnd = K.rng(sc.seed);
    const w = seg(t, 0, 0.28);
    if (t < 0.32) { K.glow(ctx, x, g.y - l * 1.3, l * (0.4 + w * 0.9), '#ffb060', 0.7 * w); K.ring(ctx, x, y, l * (1.4 - 0.9 * w), '#ffb060', z, 0.7); for (let i = 0; i < N(sc, 8); i++) { const a = i * TAU / 8; K.px(ctx, x + C(a) * l * (1.3 - w), y + S(a) * l * (1.3 - w) * 0.42, z * 1.6, '#ffd890', w); } }
    const u = seg(t, 0.3, 1.3), gp = E.out(seg(t, 0.3, 0.55));
    if (t >= 0.3) {
      /* sombra do tremor + rachaduras radiais */
      K.disc(ctx, x, y, R * gp, '#2a1a10', 0.35 * (1 - seg(t, 1.0, 1.6)));
      const nC = N(sc, 10), fa = 1 - seg(t, 1.0, 1.6);
      for (let i = 0; i < nC; i++) {
        const a = i / nC * TAU + rnd() * 0.3, len = R * (0.7 + rnd() * 0.35) * gp; let px = x, py = y; ctx.save(); ctx.lineJoin = 'miter';
        const pts = [[px, py]]; const sg = 6; for (let s = 1; s <= sg; s++) { const f = s / sg, aa = a + (rnd() - 0.5) * 0.45; px = x + C(aa) * len * f; py = y + S(aa) * len * f * 0.45; pts.push([px, py]); }
        ctx.strokeStyle = '#1b0f08'; ctx.lineWidth = z * 3; ctx.globalAlpha = fa; ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
        ctx.strokeStyle = '#ff8a30'; ctx.lineWidth = z * 1.4; ctx.globalAlpha = fa * (0.7 + 0.3 * S(t * 12 + i)); ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); ctx.restore();
      }
      [0, 0.16, 0.32].forEach((o, i) => { const uu = seg(t, 0.3 + o, 0.85 + o); if (uu > 0 && uu < 1) K.ring(ctx, x, y, R * E.out(uu), i ? '#d8c9a8' : '#ffd890', z * (3 - uu * 2), (1 - uu) * 0.85); });
      /* pedras que sobem e caem */
      for (let i = 0; i < N(sc, 16); i++) { const a = rnd() * TAU, r = R * (0.15 + rnd() * 0.85), s0 = 0.3 + rnd() * 0.3, h = l * (0.5 + rnd() * 0.9), uu = seg(t, s0, s0 + 0.75); if (uu <= 0 || uu >= 1) continue;
        K.px(ctx, x + C(a) * r * gp, y + S(a) * r * 0.45 * gp - 4 * h * uu * (1 - uu), z * (2 + rnd() * 2.5), i % 3 ? '#7a5a3c' : '#a8845c', 1 - uu * uu); }
      dust(ctx, sc, x, y, seg(t, 0.3, 1.0), sc.seed + 5, R, 16);
      /* atordoamento: estrelas girando */
      const sa = env(t, 0.5, 0.65, 1.4, 1.7); if (sa > 0) [{ x: g.tx, y: g.ty }].concat(sc.others || []).forEach(o => stunStars(ctx, sc, o.x, o.y - l * 1.2, t, sa));
    }
    [0.3, 0.46, 0.62].forEach((h, i) => { if (t > h && t < h + 0.12) sc.shake(4 - i); });
    if (t > 0.3 && t < 0.55) K.flash(ctx, sc, '#ffd8a0', 0.14 * (1 - seg(t, 0.3, 0.55)));
  } });

  /* Lâmina da Aurora */
  reg('santo_espada', { dur: 1.6, hits: [0.3, 0.52], draw(ctx, t, sc) {
    const g = geo(sc), { x, y, by, l, z, tx, ty, tb } = g, Y = ['#ffd36a', '#fff0a8', '#ffffff', '#ff9a6a'];
    /* antecipação: raio do céu */
    const dsc = E.in(seg(t, 0.02, 0.3)), top = tb - l * 4.5;
    if (t < 0.34) { K.glow(ctx, tx, top, l * 0.6 * (0.5 + seg(t, 0, 0.2)), Y[1], 0.7); K.ring(ctx, tx, ty, l * 2.2 * (1 - 0.5 * seg(t, 0, 0.3)), Y[0], z, 0.5 * seg(t, 0, 0.25)); }
    if (t > 0.02 && t < 0.4) { const sy = K.lerp(top, tb - l * 0.2, dsc), a = 1 - seg(t, 0.3, 0.4); K.poly(ctx, [[tx, sy + l * 1.3], [tx - l * 0.18, sy], [tx + l * 0.18, sy], [tx, sy + l * 1.3]], '#fff', a); K.poly(ctx, [[tx - l * 0.07, sy + l * 1.2], [tx - l * 0.28, sy - l * 0.1], [tx + l * 0.28, sy - l * 0.1], [tx + l * 0.07, sy + l * 1.2]], Y[1], a * 0.6); K.poly(ctx, [[tx - l * 0.4, sy - l * 0.12], [tx + l * 0.4, sy - l * 0.12], [tx + l * 0.4, sy], [tx - l * 0.4, sy]], Y[0], a); K.glow(ctx, tx, sy + l * 0.6, l * 1.1, Y[1], 0.6 * a); }
    /* coluna de luz + raios do amanhecer */
    const ca = env(t, 0.28, 0.34, 0.6, 1.2);
    if (ca > 0) { const cw = l * (0.9 + 0.15 * S(t * 20)) * (1 - seg(t, 0.6, 1.2) * 0.7);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = Y[0]; ctx.globalAlpha = 0.35 * ca; ctx.fillRect(Math.round(tx - cw / 2), Math.round(tb - l * 5), Math.round(cw), Math.round(l * 5 + l * 0.55));
      ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.7 * ca; ctx.fillRect(Math.round(tx - cw * 0.22), Math.round(tb - l * 5), Math.max(1, Math.round(cw * 0.44)), Math.round(l * 5 + l * 0.55)); ctx.restore(); }
    const ra = env(t, 0.3, 0.38, 0.75, 1.3);
    if (ra > 0) for (let i = 0; i < N(sc, 12); i++) { const a = i / 12 * TAU + t * 0.8, r0 = l * 0.4, r1 = l * (1.6 + (i % 2) * 0.8) * E.out(seg(t, 0.3, 0.5)); ctx.save(); ctx.globalCompositeOperation = 'lighter'; K.poly(ctx, [[tx + C(a) * r0, ty + S(a) * r0 * 0.45], [tx + C(a - 0.07) * r1, ty + S(a - 0.07) * r1 * 0.45], [tx + C(a + 0.07) * r1, ty + S(a + 0.07) * r1 * 0.45]], Y[1], 0.5 * ra); ctx.restore(); }
    impact(ctx, sc, tx, tb, seg(t, 0.3, 0.8), { r: 2.2, cols: [Y[0], Y[1], '#fff'], core: '#fff', seed: sc.seed, n: 18, ry: l * 0.55, sq: 0.42 });
    const u2 = seg(t, 0.5, 1.0); if (u2 > 0 && u2 < 1) K.ring(ctx, tx, ty, l * 2.2 * E.out(u2), Y[3], z * 2, (1 - u2) * 0.7);
    if (t > 0.3 && t < 0.5) { sc.shake(3); K.flash(ctx, sc, '#fff0b0', 0.16 * (1 - seg(t, 0.3, 0.5))); }
    /* cura no herói */
    const hu = seg(t, 0.4, 1.5); if (hu > 0 && hu < 1) { motes(ctx, sc, x, y, { t: t, r: l * 0.6, h: l * 1.6, n: 10, seed: sc.seed + 4, cols: ['#9affb0', '#fff0a8', '#fff'], size: z * 1.8, a: Math.sin(hu * PI), rate: 0.9 }); K.glow(ctx, x, by, l * 0.8, '#9affb0', 0.3 * Math.sin(hu * PI)); K.px(ctx, x, y - l * (1.5 + hu * 0.4), z * 2.5, '#9affb0', 1 - hu); }
  } });

  /* ======================= CAVALEIRO ======================= */
  /* Golpe de Escudo */
  reg('guardiao_aco', { dur: 1.2, hits: [0.2], draw(ctx, t, sc) {
    const g = geo(sc), { x, y, by, l, z, d, tx, tb } = g, B = ['#5b7fb5', '#8fb4ee', '#dbe9ff', '#ffd36a'];
    const m = E.in(seg(t, 0.02, 0.2)), a = 1 - seg(t, 0.22, 0.4);
    const sx = K.lerp(x + d * l * 0.5, tx - d * l * 0.3, m), sy = K.lerp(by, tb, m);
    if (t < 0.42) { K.glow(ctx, sx, sy, l * 0.9, B[1], 0.5 * a); shield(ctx, sx, sy, l * (0.55 + 0.35 * m), B[0], B[2], a, B[3]);
      for (let i = 1; i < 5; i++) { const mm = K.clamp(m - i * 0.1, 0, 1); shield(ctx, K.lerp(x + d * l * 0.5, tx - d * l * 0.3, mm), K.lerp(by, tb, mm), l * 0.5, B[1], B[1], a * 0.18 * (1 - i / 5), null); }
      speed(ctx, sc, sx, sy, d, m, 5, B[2], sc.seed, 0.9); }
    const u = seg(t, 0.2, 0.7);
    if (u > 0 && u < 1) {
      impact(ctx, sc, tx, tb, u, { r: 1.1, cols: [B[1], B[2], B[3]], seed: sc.seed, n: 14, sq: 1 });
      /* onda plana do impacto (disco vertical) + anel no chão */
      K.ring(ctx, tx, tb, l * 1.5 * E.out(u), '#fff', z * 2, 0.7 * (1 - u), 1.0); K.ring(ctx, tx, g.ty, l * 1.9 * E.out(u), B[1], z * 2, (1 - u) * 0.8);
      const rnd = K.rng(sc.seed + 2); for (let i = 0; i < N(sc, 10); i++) { const an = rnd() * TAU, r0 = l * 0.3, r1 = l * (0.8 + rnd()) * E.out(u); K.streak(ctx, tx + C(an) * r0, tb + S(an) * r0, tx + C(an) * r1, tb + S(an) * r1, z, '#fff', (1 - u) * 0.8); }
      dust(ctx, sc, tx, g.ty, u, sc.seed + 8, l * 1.6, 8);
    }
    if (t > 0.2 && t < 0.3) { sc.shake(3); K.flash(ctx, sc, '#bcd4ff', 0.14); }
    const sa = env(t, 0.3, 0.42, 0.95, 1.2); if (sa > 0) stunStars(ctx, sc, tx, g.th, t, sa);
  } });

  /* Investida */
  reg('lanceiro', { dur: 1.2, hits: [0.26], draw(ctx, t, sc) {
    const g = geo(sc), { x, y, by, l, z, d, tx, ty, tb } = g, B = ['#5b7fb5', '#8fb4ee', '#dbe9ff', '#ffd36a'];
    const endx = tx + d * l * 1.3, w = seg(t, 0, 0.12);
    if (t < 0.16) { K.glow(ctx, x, by, l * (0.5 + w), B[1], 0.5 * w); dust(ctx, sc, x, y, w, sc.seed, l * 1.2, 8); }
    const p = E.in(seg(t, 0.08, 0.4)), px = K.lerp(x, endx, p), py = K.lerp(y, ty, p);
    if (t > 0.08 && t < 0.7) {
      const fa = out(t, 0.38, 0.7);
      for (let i = 4; i >= 0; i--) { const pp = E.in(K.clamp(seg(t, 0.08, 0.4) - i * 0.07, 0, 1)); sc.drawCaster(ctx, K.lerp(x, endx, pp), K.lerp(y, ty, pp), { alpha: (i ? 0.22 : 0.5) * fa * (1 - i * 0.1), pose: 'atk2', flip: d < 0, tint: i ? B[1] : B[2] }); }
      const lx = px + d * l * 0.5, ly = by - l * 0.05;
      blade(ctx, lx - d * l * 1.4, ly + z, lx + d * l * 0.75, ly, z * 2.4, B[2], fa, '#fff'); K.glow(ctx, lx + d * l * 0.7, ly, l * 0.7, B[1], 0.7 * fa);
      K.diamond(ctx, lx + d * l * 0.8, ly, z * 3, '#fff', fa, true);
      speed(ctx, sc, px, by, d, p, 9, B[2], sc.seed + 2, 1.5);
      for (let i = 0; i < N(sc, 6); i++) K.px(ctx, K.lerp(x, px, i / 6), K.lerp(y, py, i / 6) - z * 1, z * 3, '#c8b898', fa * 0.6 * (1 - i / 7));
    }
    const u = seg(t, 0.26, 0.8);
    if (u > 0 && u < 1) {
      impact(ctx, sc, tx, tb, u, { r: 1.3, cols: [B[1], B[2], B[3]], seed: sc.seed + 1, n: 16 });
      /* cone de perfuração atravessando */
      const co = E.out(seg(t, 0.26, 0.5)) * (1 - seg(t, 0.4, 0.8)); K.poly(ctx, [[tx - d * l * 0.3, tb], [tx + d * l * 2.2 * E.out(u), tb - l * 0.5 * co], [tx + d * l * 2.2 * E.out(u), tb + l * 0.5 * co]], B[2], 0.5 * co);
      K.ring(ctx, tx, ty, l * 1.8 * E.out(u), B[1], z * 2, (1 - u) * 0.8);
      K.burst(ctx, tx + d * l * 0.8, tb, { n: N(sc, 10), r: l * 1.8, size: z * 2, colors: [B[2], B[1]], seed: sc.seed + 4, u, squash: 0.5 });
    }
    if (t > 0.26 && t < 0.36) { sc.shake(3); K.flash(ctx, sc, '#bcd4ff', 0.12); }
  } });

  /* Bastião */
  reg('baluarte', { dur: 1.9, hits: [0.3], draw(ctx, t, sc) {
    const g = geo(sc), { x, y, by, l, z } = g, B = ['#5b7fb5', '#8fb4ee', '#dbe9ff', '#ffd36a'];
    const us = [{ x, y }].concat(sc.allies || []);
    for (let i = 0; i < 2; i++) { const u = seg(t, 0.05 + i * 0.12, 0.7 + i * 0.12); if (u > 0 && u < 1) K.ring(ctx, x, y, 4.5 * l * E.out(u), i ? B[1] : B[2], z * (3 - u * 2), (1 - u) * 0.8); }
    const ga = out(t, 0.9, 1.7), gu = E.out(seg(t, 0.05, 0.5)); K.disc(ctx, x, y, 4.5 * l * gu, B[0], 0.16 * ga);
    /* hexágonos rúnicos no chão */
    for (let i = 0; i < N(sc, 12); i++) { const a = i / 12 * TAU + t * 0.5, r = l * 3.4 * gu; K.diamond(ctx, x + C(a) * r, y + S(a) * r * 0.42, z * 2.4, B[1], 0.5 * ga * (1 - i % 2 * 0.4), true); }
    us.forEach((o, k) => {
      const st = 0.2 + k * 0.1, u = seg(t, st, st + 0.3), a = env(t, st, st + 0.12, 1.3, 1.85); if (a <= 0) return;
      const oy = o.y - l * 0.55, rx = l * 0.62, ry = l * 0.95, pl = 1 + 0.04 * S(t * 7 + k);
      if (k) K.streak(ctx, x, by, K.lerp(x, o.x, E.out(seg(t, 0.12, 0.35))), K.lerp(by, oy, E.out(seg(t, 0.12, 0.35))), z, B[1], 0.5 * out(t, 0.3, 0.6));
      ctx.save(); ctx.globalAlpha = 0.18 * a; ctx.fillStyle = B[1]; ctx.beginPath(); ctx.ellipse(o.x, oy, rx * pl * E.back(u), ry * pl * E.back(u), 0, PI, TAU); ctx.lineTo(o.x + rx, o.y + l * 0.05); ctx.lineTo(o.x - rx, o.y + l * 0.05); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.85 * a; ctx.strokeStyle = B[2]; ctx.lineWidth = Math.max(1, z * 1.4); ctx.beginPath(); ctx.ellipse(o.x, oy, rx * pl * E.back(u), ry * pl * E.back(u), 0, PI, TAU); ctx.stroke(); ctx.restore();
      K.ring(ctx, o.x, o.y, rx, B[2], z, 0.7 * a);
      const ia = E.elastic(u); shield(ctx, o.x, oy - l * 0.15, l * 0.4 * ia, B[0], B[2], a, B[3]); K.glow(ctx, o.x, oy - l * 0.15, l * 0.7 * ia, B[1], 0.4 * a);
      const sh = seg(t, st + 0.3, st + 0.6); if (sh > 0 && sh < 1) { const an = PI + sh * PI; K.px(ctx, o.x + C(an) * rx, oy + S(an) * ry, z * 3, '#fff', 1 - sh); }
    });
    if (t > 0.25 && t < 0.45) { sc.shake(2); K.flash(ctx, sc, '#bcd4ff', 0.1); dust(ctx, sc, x, y, seg(t, 0.25, 0.8), sc.seed, l * 2.4, 12); }
  } });

  /* Carapaça de Espinhos */
  reg('sentinela', { dur: 1.7, hits: [0.24], draw(ctx, t, sc) {
    const g = geo(sc), { x, y, by, l, z } = g, B = ['#5b7fb5', '#8fb4ee', '#dbe9ff', '#ff6a5a'];
    const pu = E.back(seg(t, 0.1, 0.34)), a = env(t, 0.08, 0.2, 1.3, 1.7);
    for (let i = 0; i < 2; i++) { const u = seg(t, 0.2 + i * 0.12, 0.8 + i * 0.12); if (u > 0 && u < 1) K.ring(ctx, x, y, 4.5 * l * E.out(u), i ? B[3] : B[1], z * (3 - u * 2), (1 - u) * 0.75); }
    K.glow(ctx, x, by, l * 1.1, B[1], 0.4 * a * (0.8 + 0.2 * S(t * 9)));
    if (t < 0.3) { K.ring(ctx, x, y, l * (1.5 - seg(t, 0, 0.25)), B[1], z, 0.6); }
    const nS = N(sc, 12);
    for (let i = 0; i < nS; i++) {
      const an = i / nS * TAU + 0.2, rx = l * 0.5, ry = l * 0.62, cx = x + C(an) * rx, cy = by + S(an) * ry, nx = C(an) * 0.8, ny = S(an), ln = l * (0.55 + 0.1 * S(t * 10 + i * 2) + (i % 2) * 0.18) * pu;
      if (a <= 0) break; const px = -ny * l * 0.1, py = nx * l * 0.1;
      K.poly(ctx, [[cx + px, cy + py], [cx + nx * ln, cy + ny * ln], [cx - px, cy - py]], '#9fb2cc', a); K.poly(ctx, [[cx + px * 0.4, cy + py * 0.4], [cx + nx * ln, cy + ny * ln], [cx - px * 0.1, cy - py * 0.1]], '#fff', a * 0.9);
      K.px(ctx, cx + nx * ln, cy + ny * ln, z * 1.6, B[3], a * (0.5 + 0.5 * S(t * 12 + i)));
    }
    const ra = seg(t, 0.2, 1.6); if (ra > 0 && ra < 1) { const rn = K.rng(sc.seed); for (let i = 0; i < N(sc, 6); i++) { const an = rn() * TAU, s0 = (t * 1.5 + rn()) % 1; K.px(ctx, x + C(an) * l * (0.6 + s0 * 0.9), by + S(an) * l * (0.8 + s0 * 0.9), z * 1.6, '#fff', (1 - s0) * 0.8 * a); } }
    /* provocação */
    const ta = env(t, 0.3, 0.5, 1.0, 1.4); [{ x: g.tx, y: g.ty }].concat(sc.others || []).forEach((o, i) => { if (ta > 0) { K.streak(ctx, o.x, o.y - l * 0.5, K.lerp(o.x, x, 0.25 * E.out(seg(t, 0.3, 0.6))), K.lerp(o.y - l * 0.5, by, 0.25 * E.out(seg(t, 0.3, 0.6))), z, B[3], 0.4 * ta); K.diamond(ctx, o.x, o.y - l * 1.3, z * 2.6, B[3], ta, true); } });
    if (t > 0.1 && t < 0.3) { sc.shake(2); K.flash(ctx, sc, '#bcd4ff', 0.08); }
  } });

  /* Salto do Dragão */
  reg('lanca_dragao', { dur: 1.7, hits: [0.56, 0.7], draw(ctx, t, sc) {
    const g = geo(sc), { x, y, by, l, z, d, tx, ty, tb } = g, B = ['#5b7fb5', '#8fb4ee', '#dbe9ff', '#ffd36a', '#3ad0b0'];
    /* decolagem */
    const up = seg(t, 0.04, 0.26);
    if (up > 0 && t < 0.5) { K.glow(ctx, x, by, l * (0.5 + up), B[3], 0.6 * (1 - up)); dust(ctx, sc, x, y, seg(t, 0.05, 0.4), sc.seed, l * 1.8, 10); K.ring(ctx, x, y, l * 1.4 * E.out(seg(t, 0.05, 0.35)), B[2], z * 2, 0.7 * (1 - seg(t, 0.05, 0.35)));
      K.streak(ctx, x, by, x, by - l * 5 * E.out(up), z * 3, B[1], 0.5 * (1 - up)); K.streak(ctx, x, by, x, by - l * 5 * E.out(up), z, '#fff', 0.8 * (1 - up)); }
    /* sombra de aviso no chão */
    const sh = seg(t, 0.2, 0.56), sa = env(t, 0.2, 0.3, 0.56, 0.62); if (sa > 0) { K.disc(ctx, tx, ty, l * (1.6 - 0.8 * sh), '#10182a', 0.45 * sa); K.ring(ctx, tx, ty, l * (2.4 - 1.5 * sh), B[3], z, 0.8 * sa); }
    /* queda: herói espectral com lança, envolto em fogo de dragão */
    const fall = E.in(seg(t, 0.3, 0.56)), fy = ty - l * 4.6 * (1 - fall), fa = env(t, 0.3, 0.36, 0.56, 0.6);
    if (fa > 0) {
      for (let i = 5; i >= 0; i--) { const ff = E.in(K.clamp(seg(t, 0.3, 0.56) - i * 0.06, 0, 1)); K.glow(ctx, tx - d * l * 0.15 * (1 - ff), ty - l * 4.6 * (1 - ff) - l * 0.6, l * (0.9 - i * 0.1), i % 2 ? B[4] : B[3], 0.4 * fa); }
      sc.drawCaster(ctx, tx - d * l * 0.15 * (1 - fall), fy, { alpha: 0.75 * fa, pose: 'atk2', flip: d < 0, tint: B[2] });
      const lx = tx - d * l * 0.15 * (1 - fall), ly = fy - l * 0.6; blade(ctx, lx + d * l * 0.1, ly - l * 2, lx + d * l * 0.3, ly + l * 0.5, z * 2.2, B[2], fa, '#fff'); K.glow(ctx, lx + d * l * 0.3, ly + l * 0.5, l * 0.6, B[1], 0.8 * fa);
      const rn = K.rng(sc.seed); for (let i = 0; i < N(sc, 10); i++) { const o = (rn() - 0.5) * l * 0.8, h = rn() * l * 3; K.px(ctx, lx + o, ly - h, z * (1.5 + rn() * 2), i % 2 ? B[4] : '#ffe9b8', fa * (1 - h / (l * 3)) * 0.9); }
    }
    /* impacto principal (300%) */
    const u = seg(t, 0.56, 1.2);
    if (u > 0 && u < 1) {
      K.disc(ctx, tx, ty, l * 1.6 * E.out(seg(t, 0.56, 0.7)), '#1b1410', 0.5 * (1 - seg(t, 0.9, 1.5)));
      impact(ctx, sc, tx, tb, u, { r: 1.8, cols: [B[3], B[2], B[1], B[4]], seed: sc.seed, n: 20, ry: l * 0.55, sq: 0.42 });
      const ra = ((1 - u) ** 2); ctx.save(); ctx.globalAlpha = ra * 0.7; ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(tx - l * 0.15), Math.round(ty - l * 4 * E.out(Math.min(1, u * 3))), Math.round(l * 0.3), Math.round(l * 4 * E.out(Math.min(1, u * 3)))); ctx.restore();
      dust(ctx, sc, tx, ty, u, sc.seed + 3, l * 2.8, 18);
      for (let i = 0; i < 8; i++) { const an = i / 8 * TAU + 0.2, r = l * 1.4 * E.out(u); const L = K.clamp(1 - u * 1.4, 0, 1); K.poly(ctx, [[tx + C(an) * r * 0.5, ty + S(an) * r * 0.2], [tx + C(an) * r, ty + S(an) * r * 0.42 - l * 0.1], [tx + C(an) * r * 0.5 + 3 * z, ty + S(an) * r * 0.2]], '#1b1410', L); }
    }
    /* segundo golpe: onda de dragão (140% área) */
    const u2 = seg(t, 0.7, 1.4); if (u2 > 0 && u2 < 1) { K.ring(ctx, tx, ty, 2.2 * l * E.out(u2), B[4], z * (3.5 - u2 * 2.5), (1 - u2) * 0.9); K.ring(ctx, tx, ty, 1.6 * l * E.out(u2), B[3], z * 2, (1 - u2) * 0.8); K.disc(ctx, tx, ty, 2.2 * l * E.out(u2), B[4], 0.15 * (1 - u2)); }
    if (t > 0.56 && t < 0.68) { sc.shake(4); K.flash(ctx, sc, '#fff0c0', 0.18 * (1 - seg(t, 0.56, 0.68))); } if (t > 0.7 && t < 0.78) sc.shake(2);
  } });

  /* Estandarte */
  reg('marechal', { dur: 2.0, hits: [0.28], draw(ctx, t, sc) {
    const g = geo(sc), { x, y, by, l, z, d } = g, B = ['#5b7fb5', '#8fb4ee', '#dbe9ff', '#ffd36a'];
    const px = x + d * l * 0.9, py = y + l * 0.05, fall = E.in(seg(t, 0, 0.26)), ga = env(t, 0.0, 0.1, 1.55, 2.0), top = l * 2.5;
    for (let i = 0; i < 2; i++) { const u = seg(t, 0.26 + i * 0.1, 0.9 + i * 0.1); if (u > 0 && u < 1) K.ring(ctx, px, py, 5 * l * E.out(u), i ? B[3] : B[2], z * (3 - u * 2), (1 - u) * 0.8); }
    K.disc(ctx, px, py, 5 * l * E.out(seg(t, 0.26, 0.8)), B[3], 0.1 * out(t, 0.5, 1.5));
    const pyTop = py - top - (1 - fall) * l * 4;
    if (ga > 0) {
      K.glow(ctx, px, py - top * 0.5, l * 1.8, B[1], 0.3 * ga * seg(t, 0.26, 0.5));
      ctx.save(); ctx.globalAlpha = ga; ctx.fillStyle = '#d9c8a0'; ctx.fillRect(Math.round(px - z), Math.round(pyTop), Math.round(z * 2), Math.round(py - pyTop - (1 - fall) * l * 4 + (1 - fall) * l * 4)); ctx.fillStyle = B[3]; ctx.fillRect(Math.round(px - z * 2), Math.round(pyTop - z * 2), Math.round(z * 4), Math.round(z * 3)); ctx.restore();
      const un = E.out(seg(t, 0.28, 0.6)), fw = l * 1.35 * un, fh = l * 1.05, sx = d;
      for (let i = 0; i < 12; i++) { const f = i / 12, cx = px + sx * (z * 2 + f * fw), wv = S(t * 9 - f * 5 + 1) * l * 0.1 * f, cw = Math.ceil(fw / 12) + 1;
        ctx.save(); ctx.globalAlpha = ga * (f * un > 0 ? 1 : 0); ctx.fillStyle = i % 2 ? B[0] : '#6c92cc'; ctx.fillRect(Math.round(sx > 0 ? cx : cx - cw), Math.round(pyTop + wv), cw, Math.round(fh * (1 - f * 0.18)));
        ctx.fillStyle = B[3]; ctx.fillRect(Math.round(sx > 0 ? cx : cx - cw), Math.round(pyTop + wv), cw, Math.max(1, z)); ctx.fillRect(Math.round(sx > 0 ? cx : cx - cw), Math.round(pyTop + wv + fh * (1 - f * 0.18) - z), cw, Math.max(1, z)); ctx.restore(); }
      if (un > 0.5) K.diamond(ctx, px + sx * fw * 0.42, pyTop + fh * 0.5 + S(t * 9 - 2) * l * 0.04, l * 0.2, B[3], ga, true);
    }
    if (t > 0.24 && t < 0.4) { const u = seg(t, 0.24, 0.5); dust(ctx, sc, px, py, u, sc.seed, l * 2, 12); K.ring(ctx, px, py, l * 1.3 * E.out(u), '#fff', z * 2, 1 - u); sc.shake(2); K.flash(ctx, sc, '#ffe9b8', 0.1); }
    /* aliados: seta de ataque + vento da velocidade */
    const us = [{ x, y }].concat(sc.allies || []);
    us.forEach((o, k) => { const st = 0.4 + k * 0.1, a = env(t, st, st + 0.15, 1.5, 1.95); if (a <= 0) return;
      K.glow(ctx, o.x, o.y - l * 0.6, l * 0.8, B[3], 0.28 * a); K.ring(ctx, o.x, o.y, l * 0.7, B[3], z, 0.6 * a);
      for (let i = 0; i < 2; i++) { const p = ((t - st) * 0.8 + i * 0.5) % 1; chev(ctx, o.x + (i ? l * 0.3 : -l * 0.3), o.y - l * (0.2 + p * 1.4), z * 3, i ? B[2] : B[3], a * Math.sin(p * PI)); }
      speed(ctx, sc, o.x, o.y - l * 0.5, d, t * 0.8 + k * 0.3, 3, B[2], sc.seed + k, 1.0); });
  } });

  /* ======================= ARQUEIRO ======================= */
  /* Tiro Perfurante */
  reg('atirador', { dur: 1.1, hits: [0.22], draw(ctx, t, sc) {
    const g = geo(sc), { x, y, by, l, z, d, tx, ty, tb } = g, A = ['#4f9d5d', '#9be07a', '#e8ffcf', '#ffe48a'];
    /* mira convergindo */
    const m = seg(t, 0, 0.18), ma = env(t, 0, 0.05, 0.18, 0.3);
    if (ma > 0) { const r = l * (1.1 - 0.7 * E.out(m)); K.ring(ctx, tx, tb, r, A[3], z, ma, 1); K.ring(ctx, tx, tb, r * 0.5, A[3], z, ma * 0.7, 1);
      ctx.save(); ctx.globalAlpha = ma; ctx.fillStyle = A[3]; ctx.fillRect(Math.round(tx - r * 1.3), Math.round(tb), Math.round(r * 0.8), z); ctx.fillRect(Math.round(tx + r * 0.5), Math.round(tb), Math.round(r * 0.8), z); ctx.fillRect(Math.round(tx), Math.round(tb - r * 1.3), z, Math.round(r * 0.8)); ctx.fillRect(Math.round(tx), Math.round(tb + r * 0.5), z, Math.round(r * 0.8)); ctx.restore(); }
    K.glow(ctx, x + d * l * 0.45, by, l * 0.5, A[1], 0.6 * env(t, 0, 0.1, 0.12, 0.25));
    /* flecha superveloz com anel de choque */
    const f = seg(t, 0.1, 0.22), sx = x + d * l * 0.45, ang = Math.atan2(tb - by, tx - sx);
    if (f > 0 && t < 0.4) { const e = E.out(f), ex = K.lerp(sx, tx + d * l * 2.6, e * 1.0), ey = K.lerp(by, tb, e) + (ex - tx) * (tb - by) / (tx - sx || 1) * 0.0, fa = out(t, 0.24, 0.4);
      K.streak(ctx, sx, by, ex, ey, z * 3, A[1], 0.35 * fa); K.streak(ctx, sx, by, ex, ey, z, '#fff', 0.9 * fa);
      arrow(ctx, ex, ey, ang, l * 0.9, z, A[2], '#fff', fa); K.glow(ctx, ex, ey, l * 0.5, A[1], 0.8 * fa);
      for (let i = 1; i < 4; i++) { const rr = K.lerp(sx, ex, i / 4); ctx.save(); ctx.globalAlpha = 0.5 * fa * (1 - i / 4); ctx.strokeStyle = '#fff'; ctx.lineWidth = z; ctx.beginPath(); ctx.ellipse(rr, K.lerp(by, ey, i / 4), l * 0.06, l * (0.14 + 0.05 * i), 0, 0, TAU); ctx.stroke(); ctx.restore(); } }
    /* perfuração: casco rachando, estilhaços de armadura */
    const u = seg(t, 0.22, 0.8);
    if (u > 0 && u < 1) {
      impact(ctx, sc, tx, tb, u, { r: 0.95, cols: [A[1], A[2], A[3]], seed: sc.seed, n: 12 });
      const rn = K.rng(sc.seed + 1); for (let i = 0; i < N(sc, 9); i++) { const an = rn() * 1.8 - 0.9 + (d < 0 ? PI : 0), sp = l * (0.8 + rn() * 1.7) * E.out(u); K.diamond(ctx, tx + d * l * 0.3 + C(an) * sp, tb + S(an) * sp * 0.8 + l * 0.6 * u * u, z * (1.5 + rn() * 1.8), i % 2 ? '#c9d3e0' : '#8a97aa', 1 - u, true); }
      K.burst(ctx, tx + d * l * 0.9, tb, { n: N(sc, 8), r: l * 1.2, size: z * 2, colors: [A[1], '#fff'], seed: sc.seed + 5, u, squash: 0.4 });
      /* quebra de defesa: escudo rachado */
      const sa = env(t, 0.26, 0.34, 0.5, 0.8); if (sa > 0) { const sy = tb - l * 0.95 - (t - 0.26) * l * 0.4; shield(ctx, tx, sy, l * 0.32, '#8a97aa', '#c9d3e0', sa, null); K.bolt(ctx, tx - l * 0.1, sy - l * 0.3, tx + l * 0.12, sy + l * 0.35, { seed: 4, segments: 4, jag: z * 2, color: '#fff', width: z, alpha: sa }); }
    }
    if (t > 0.22 && t < 0.3) { sc.shake(2); K.flash(ctx, sc, '#d6ffc0', 0.1); }
  } });

  /* Flecha Envenenada */
  reg('patrulheiro', { dur: 1.5, hits: [0.24], draw(ctx, t, sc) {
    const g = geo(sc), { x, y, by, l, z, d, tx, ty, tb } = g, V = ['#3f8f3a', '#7fe05a', '#d6ff9a', '#b46cff'];
    K.glow(ctx, x + d * l * 0.45, by, l * 0.6, V[1], 0.6 * env(t, 0, 0.08, 0.1, 0.3));
    const f = seg(t, 0.06, 0.24), p = path(g, E.in(f * 0.6 + f * 0.4), 0.28), p2 = path(g, E.in(Math.max(0, f - 0.05)), 0.28);
    if (f > 0 && t < 0.34) { const fa = out(t, 0.24, 0.34), nx = path(g, Math.min(1, f + 0.04), 0.28), ang = Math.atan2(nx.y - p.y, nx.x - p.x) || 0;
      const rn = K.rng(sc.seed); for (let i = 0; i < N(sc, 14); i++) { const u = f * (1 - i / 14), q = path(g, E.in(u), 0.28), gr = (i / 14) ** 2 * l * 0.9; K.px(ctx, q.x + (rn() - 0.5) * z * 3, q.y + gr + (rn() - 0.5) * z * 2, z * (2.6 - i * 0.12), i % 3 ? V[1] : V[2], (1 - i / 14) * fa); }
      arrow(ctx, p.x, p.y, ang, l * 0.8, z, '#9a7a4a', V[1], fa); K.glow(ctx, p.x, p.y, l * 0.5, V[1], 0.7 * fa); }
    /* impacto + poça tóxica */
    const u = seg(t, 0.24, 0.8);
    if (u > 0 && u < 1) { impact(ctx, sc, tx, tb, u, { r: 0.9, cols: [V[1], V[2], V[0]], seed: sc.seed + 3, n: 12, ry: l * 0.55, sq: 0.42 }); sc.shake(1); }
    const pa = env(t, 0.26, 0.5, 1.15, 1.5), pr = l * 0.95 * E.out(seg(t, 0.26, 0.55));
    if (pa > 0) {
      K.disc(ctx, tx, ty, pr, V[0], 0.35 * pa); K.ring(ctx, tx, ty, pr, V[1], z * 1.5, 0.7 * pa); K.glow(ctx, tx, tb, l * 0.9, V[1], 0.2 * pa);
      motes(ctx, sc, tx, ty, { t: t, r: pr * 0.8, h: l * 1.4, n: 12, seed: sc.seed + 7, cols: [V[1], V[2], V[3]], size: z * 2.2, a: pa, rate: 0.9, sway: z * 3 });
      for (let i = 0; i < N(sc, 3); i++) { const bu = (t * 1.2 + i * 0.37) % 1, bx = tx + (i - 1) * l * 0.4; K.ring(ctx, bx, ty - l * (0.2 + bu * 0.8), z * (1.6 + bu * 1.4), V[2], z * 0.8, pa * (1 - bu), 1); }
      /* gotas escorrendo do alvo */
      const rn = K.rng(sc.seed + 9); for (let i = 0; i < N(sc, 5); i++) { const o = (rn() - 0.5) * l * 0.7, s0 = (t * 1.1 + rn()) % 1; K.px(ctx, tx + o, tb - l * 0.3 + s0 * l * 0.9, z * 1.8, V[1], pa * (1 - s0)); }
    }
  } });

  /* Tiro Mortal */
  reg('olho_falcao', { dur: 1.4, hits: [0.5], draw(ctx, t, sc) {
    const g = geo(sc), { x, y, by, hy, l, z, d, tx, ty, tb } = g, Gd = ['#ffd36a', '#fff0b0', '#ffffff', '#ff6a5a'];
    /* olho do falcão sobre o herói */
    const ea = env(t, 0.02, 0.12, 0.38, 0.5); if (ea > 0) { const ey = hy - l * 0.45, ew = l * 0.5 * E.out(seg(t, 0.02, 0.15)), eh = ew * 0.38 * (1 - 0.7 * seg(t, 0.3, 0.4));
      ctx.save(); ctx.globalAlpha = ea; ctx.fillStyle = Gd[0]; ctx.beginPath(); ctx.moveTo(x - ew, ey); ctx.quadraticCurveTo(x, ey - eh * 2, x + ew, ey); ctx.quadraticCurveTo(x, ey + eh * 2, x - ew, ey); ctx.fill();
      ctx.fillStyle = '#2a1a08'; ctx.beginPath(); ctx.arc(x, ey, eh * 0.9, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(x - eh * 0.4), Math.round(ey - eh * 0.5), Math.max(1, Math.round(eh * 0.4)), Math.max(1, Math.round(eh * 0.4))); ctx.restore(); K.glow(ctx, x, ey, l * 0.8, Gd[0], 0.5 * ea); }
    /* mira de asas convergindo no alvo (câmera lenta) */
    const c = seg(t, 0.08, 0.48), ca = env(t, 0.08, 0.16, 0.5, 0.62);
    if (ca > 0) { const r = l * (1.9 - 1.35 * E.inOut(c)); K.ring(ctx, tx, tb, r, Gd[0], z * 1.5, ca, 1); K.ring(ctx, tx, tb, r * 0.55, Gd[1], z, ca * 0.8, 1);
      for (let s = -1; s <= 1; s += 2) { ctx.save(); ctx.globalAlpha = ca * 0.9; ctx.fillStyle = Gd[1]; ctx.beginPath(); ctx.moveTo(tx + s * r * 0.55, tb); for (let i = 1; i <= 4; i++) ctx.lineTo(tx + s * (r * 0.9 + i * l * 0.18), tb - i * l * 0.12 * (i % 2 ? 1 : 0.4) - l * 0.02); ctx.lineTo(tx + s * r * 0.9, tb + l * 0.08); ctx.closePath(); ctx.fill(); ctx.restore(); }
      const lk = c > 0.85 ? 1 : 0; ctx.save(); ctx.globalAlpha = ca; ctx.fillStyle = lk ? Gd[3] : Gd[0]; ctx.fillRect(Math.round(tx - r * 1.4), Math.round(tb), Math.round(r * 2.8), z); ctx.fillRect(Math.round(tx), Math.round(tb - r * 1.4), z, Math.round(r * 2.8)); ctx.restore(); }
    /* linhas de tempo congelado */
    if (t < 0.5) speed(ctx, sc, x, by, -d, t, 5, Gd[1], sc.seed, 2.2);
    /* o tiro: atravessa a tela */
    const f = seg(t, 0.44, 0.52), sx = x + d * l * 0.45, ang = Math.atan2(tb - by, tx - sx), fa = out(t, 0.52, 0.7);
    if (f > 0 && fa > 0) { const ex = K.lerp(sx, tx + d * l * 3, E.out(f)), ey = K.lerp(by, tb + (tb - by) * 0.8, E.out(f));
      K.streak(ctx, sx, by, ex, ey, z * 6, Gd[0], 0.4 * fa); K.streak(ctx, sx, by, ex, ey, z * 3, Gd[1], 0.7 * fa); K.streak(ctx, sx, by, ex, ey, z, '#fff', fa); arrow(ctx, ex, ey, ang, l * 1.0, z * 1.3, Gd[2], '#fff', fa); K.glow(ctx, ex, ey, l * 0.8, Gd[1], 0.9 * fa); }
    /* impacto mortal */
    const u = seg(t, 0.5, 1.2);
    if (u > 0 && u < 1) {
      impact(ctx, sc, tx, tb, u, { r: 1.8, cols: [Gd[0], Gd[1], Gd[3]], core: '#fff', seed: sc.seed, n: 18, sq: 1 });
      star(ctx, tx, tb, l * 2.2 * E.out(Math.min(1, u * 2)) * (1 - u), Gd[3], 0.9 * (1 - u), 0.07);
      K.ring(ctx, tx, ty, l * 2 * E.out(u), Gd[0], z * 2.5, (1 - u) * 0.8);
      const rn = K.rng(sc.seed + 3); for (let i = 0; i < N(sc, 8); i++) { const a = rn() * TAU, r = l * (0.5 + rn() * 1.5) * E.out(u), sw = S(u * 8 + i) * z * 2; ctx.save(); ctx.globalAlpha = 1 - u; ctx.fillStyle = i % 2 ? '#d9b27a' : '#fff0d0'; ctx.fillRect(Math.round(tx + C(a) * r + sw), Math.round(tb + S(a) * r * 0.8 + u * l * 0.8), z * 3, z); ctx.restore(); }
    }
    if (t > 0.5 && t < 0.62) { sc.shake(4); K.flash(ctx, sc, '#fff0b0', 0.2 * (1 - seg(t, 0.5, 0.62))); }
  } });

  /* Marca do Caçador */
  reg('cacador_feras', { dur: 1.6, hits: [0.22], draw(ctx, t, sc) {
    const g = geo(sc), { x, y, by, l, z, d, tx, ty, tb, th } = g, H = ['#d9542a', '#ff9a3a', '#ffe0a0', '#4f9d5d'];
    K.glow(ctx, x + d * l * 0.45, by, l * 0.5, H[1], 0.5 * env(t, 0, 0.06, 0.08, 0.22));
    const f = seg(t, 0.05, 0.22), p = path(g, E.in(f), 0.15);
    if (f > 0 && t < 0.3) { const fa = out(t, 0.22, 0.3), nx = path(g, Math.min(1, f + 0.05), 0.15), ang = Math.atan2(nx.y - p.y, nx.x - p.x) || 0;
      K.streak(ctx, x + d * l * 0.45, by, p.x, p.y, z * 1.5, H[1], 0.4 * fa); arrow(ctx, p.x, p.y, ang, l * 0.8, z, '#9a7a4a', H[2], fa); K.glow(ctx, p.x, p.y, l * 0.4, H[1], 0.6 * fa); }
    const u = seg(t, 0.22, 0.7);
    if (u > 0 && u < 1) impact(ctx, sc, tx, tb, u, { r: 0.9, cols: [H[1], H[2], H[0]], seed: sc.seed, n: 10 });
    /* marca: três garras + anel rúnico que pulsa sobre o alvo */
    const m = seg(t, 0.26, 0.55), ma = env(t, 0.26, 0.34, 1.2, 1.6);
    if (ma > 0) {
      const cy = th - l * 0.35 - S(t * 5) * z, rr = l * (0.5 + 0.12 * S(t * 8)) * E.back(m);
      K.glow(ctx, tx, cy, l * 0.9, H[0], 0.5 * ma); K.ring(ctx, tx, cy, rr, H[1], z * 1.5, ma, 1); K.ring(ctx, tx, cy, rr * 1.3, H[0], z, ma * 0.6, 1);
      for (let i = 0; i < 4; i++) { const a = i * PI / 2 + t * 1.5; K.diamond(ctx, tx + C(a) * rr * 1.3, cy + S(a) * rr * 1.3, z * 2, H[2], ma, true); }
      for (let i = 0; i < 3; i++) { const o = (i - 1) * l * 0.16, k = E.out(K.clamp(m * 2 - i * 0.3, 0, 1)); blade(ctx, tx + o - l * 0.1, cy - l * 0.3 * k, tx + o + l * 0.06, cy + l * 0.3 * k, z * 2, H[0], ma, H[2]); }
      /* alvo ganha contorno vermelho pulsante */
      K.ring(ctx, tx, ty, l * 0.55, H[0], z * 1.5, ma * (0.5 + 0.4 * S(t * 9)));
      K.glow(ctx, tx, tb, l * 0.7, H[0], 0.2 * ma * (0.6 + 0.4 * S(t * 9)));
    }
    const ua = env(t, 0.5, 0.6, 1.3, 1.6); for (let i = 0; i < N(sc, 3); i++) { const p2 = ((t - 0.5) * 0.9 + i / 3) % 1; chev(ctx, tx + (i - 1) * l * 0.22, th - l * 0.8 - p2 * l * 0.6, z * 2, '#ff6a3a', ua * (1 - p2)); }
    if (t > 0.22 && t < 0.3) { sc.shake(2); }
  } });

  /* Saraivada */
  reg('guarda_bosque', { dur: 1.8, hits: [0.35, 0.82], draw(ctx, t, sc) {
    const g = geo(sc), { x, y, by, l, z, d, tx, ty } = g, A = ['#4f9d5d', '#9be07a', '#e8ffcf', '#ffe48a'], R = 2.6 * l;
    const ra = env(t, 0, 0.1, 1.2, 1.8); K.ring(ctx, tx, ty, R * (1 - 0.1 * S(t * 6)), A[1], z, 0.5 * ra); K.disc(ctx, tx, ty, R, A[0], 0.12 * ra);
    K.glow(ctx, x + d * l * 0.45, by, l * 0.6, A[1], 0.5 * (env(t, 0, 0.08, 0.1, 0.25) + env(t, 0.42, 0.5, 0.52, 0.65)));
    for (let v = 0; v < 2; v++) {
      const hs = [0.35, 0.82][v], n = N(sc, 10), rn = K.rng(sc.seed + v * 31), fall = 0.22;
      for (let i = 0; i < n; i++) {
        const a = rn() * TAU, r = Math.sqrt(rn()) * R * 0.95, ox = tx + C(a) * r, oy = ty + S(a) * r * 0.45, dl = rn() * 0.12, t0 = hs - fall - 0.04 + dl, u = seg(t, t0, t0 + fall);
        if (u <= 0) continue; const lx = ox - d * l * 0.5, ly = oy - l * 4.5 * (1 - E.in(u)) - 0, lx2 = ox - d * l * 0.5 * (1 - E.in(u));
        if (u < 1) { const ang = Math.atan2(oy - (oy - l * 4.5), ox - lx), cx = K.lerp(ox - d * l * 0.9, ox, E.in(u)), cy = oy - l * 4.5 * (1 - E.in(u)); const a2 = Math.atan2(oy - cy + l * 0.001, ox - cx);
          K.streak(ctx, cx - d * l * 0.45 * (1 - u), cy - l * 1.0 * (1 - u * 0.5), cx, cy, z, A[2], 0.5); arrow(ctx, cx, cy, a2, l * 0.7, z, '#9a7a4a', A[2], 1); }
        else { const su = seg(t, t0 + fall, t0 + fall + 0.55), sa = 1 - su; if (sa > 0) { ctx.save(); ctx.globalAlpha = sa; ctx.fillStyle = '#9a7a4a'; ctx.fillRect(Math.round(ox - z / 2), Math.round(oy - l * 0.42), z, Math.round(l * 0.42)); ctx.fillStyle = A[2]; ctx.fillRect(Math.round(ox - z * 1.2), Math.round(oy - l * 0.46), Math.round(z * 2.4), z); ctx.restore(); }
          const iu = seg(t, t0 + fall, t0 + fall + 0.28); if (iu < 1) { K.ring(ctx, ox, oy, l * 0.5 * E.out(iu), A[2], z, 1 - iu); K.burst(ctx, ox, oy, { n: N(sc, 4), r: l * 0.5, size: z * 1.8, colors: [A[1], '#d8c9a8'], seed: sc.seed + i + v * 50, u: iu, squash: 0.5, up: l * 0.2 }); } }
      }
      const bu = seg(t, hs, hs + 0.45); if (bu > 0 && bu < 1) { K.ring(ctx, tx, ty, R * E.out(bu), A[3], z * 2, (1 - bu) * 0.7); K.glow(ctx, tx, ty - l * 0.4, l * 1.2, A[1], 0.3 * (1 - bu)); }
      if (t > hs && t < hs + 0.1) sc.shake(2 + v);
    }
  } });

  /* Passo do Vento */
  reg('vento_errante', { dur: 1.8, hits: [0.3], draw(ctx, t, sc) {
    const g = geo(sc), { x, y, by, l, z, d } = g, W = ['#4f9d5d', '#9be0b0', '#e8fff0', '#cfe8ff'];
    const a = env(t, 0.04, 0.3, 1.35, 1.8), w = seg(t, 0, 0.2);
    for (let i = 0; i < 2; i++) { const u = seg(t, 0.05 + i * 0.15, 0.7 + i * 0.15); if (u > 0 && u < 1) K.ring(ctx, x, y, l * (0.4 + 1.7 * E.out(u)), i ? W[3] : W[2], z * (2.5 - u * 1.5), (1 - u) * 0.8); }
    /* hélices de vento ao redor do corpo */
    for (let s = 0; s < 3; s++) for (let i = 0; i < N(sc, 12); i++) {
      const k = i / 12, an = t * 6.5 - k * 2.4 + s * TAU / 3, h = ((t * 0.55 + s / 3 + k * 0.0) % 1), r = l * (0.7 - 0.25 * h) * E.out(seg(t, 0.05, 0.3)),
        px = x + C(an) * r, py = y - l * (0.1 + 1.2 * ((t * 0.5 + s / 3) % 1)) - k * l * 0.15 + S(an) * r * 0.3;
      K.px(ctx, px, py, z * (3 - k * 2), s % 2 ? W[2] : W[1], a * (1 - k) * (S(an) > 0 ? 1 : 0.5));
    }
    K.glow(ctx, x, by, l * 1.1, W[1], 0.35 * a);
    /* pós-imagens: o herói desliza para trás deixando eco */
    for (let i = 1; i <= 3; i++) { const o = i * l * 0.35 * (0.5 + 0.5 * S(t * 4 - i * 0.6)); sc.drawCaster(ctx, x - d * o, y, { alpha: 0.22 * a / i, pose: 'walk' + (Math.floor(t * 12) % 4), flip: d < 0, tint: W[1] }); }
    speed(ctx, sc, x, by, d, t, 8, W[2], sc.seed, 1.6);
    /* folhas e esquiva */
    const rn = K.rng(sc.seed + 2); for (let i = 0; i < N(sc, 10); i++) { const u = (t * 0.8 + rn()) % 1, oy = (rn() - 0.5) * l * 1.6; const lx = x - d * (-l * 0.8 + u * l * 2.4) + S(u * 9 + i) * z * 3, ly = by + oy + S(u * 5 + i) * l * 0.15; ctx.save(); ctx.globalAlpha = a * Math.sin(u * PI); ctx.translate(lx, ly); ctx.rotate(u * 7 + i); ctx.fillStyle = i % 2 ? W[0] : W[1]; ctx.fillRect(-z * 1.5, -z, z * 3, z * 2); ctx.restore(); }
    for (let i = 0; i < N(sc, 3); i++) { const p = ((t - 0.2) * 0.9 + i / 3) % 1; if (t > 0.2) chev(ctx, x + (i - 1) * l * 0.3, y - l * (0.3 + p * 1.3), z * 2.6, i % 2 ? W[3] : W[2], a * Math.sin(p * PI)); }
    if (t < 0.3) K.flash(ctx, sc, '#cfffe0', 0.07 * (1 - seg(t, 0, 0.3)));
  } });
})();
