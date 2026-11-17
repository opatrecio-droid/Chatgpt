/* Aurora 046 · Núcleo das animações de habilidades.
   Registro de animações, kit de desenho em pixel art, eventos no mundo e API para as prévias.
   Somente visual: não altera dano, alcance, recarga, RNG da simulação nem o save. */
(function () {
  'use strict';
  if (typeof G === 'undefined' || G.HEADLESS || !G.A || !G.R) return;
  const A = G.A, R = G.R, TS = 16;
  const media = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const FX = A.SkillFX = { version: 1, defs: Object.create(null), events: [] };

  /* ---------- chaves: 'base:<classe>' para a habilidade básica e o id da vocação para as demais ---------- */
  FX.KEYS = G.CLASS_IDS.map(c => 'base:' + c).concat(G.JOB_IDS);
  FX.keyFor = (h, i) => (i === 0 ? 'base:' + h.cls : i === 1 ? h.j2 : h.j3) || null;
  FX.classSkills = cls => ['base:' + cls].concat(G.jobBranches(cls, 2)).concat(G.jobBranches(cls, 2).flatMap(b => G.jobBranches(cls, 3, b)));
  FX.info = key => {
    if (!key) return null;
    if (key.startsWith('base:')) {
      const cls = key.slice(5), c = G.CLASSES[cls]; if (!c) return null;
      return { key, cls, tier: 1, name: c.skill.name, desc: c.skill.desc, cd: c.skill.cd, color: c.color, clsName: c.name, jobName: c.name, ops: null, from: null, ranged: c.rng > 2 };
    }
    const j = G.JOBS[key]; if (!j) return null; const c = G.CLASSES[j.base];
    return { key, cls: j.base, tier: j.t, name: j.skill.name, desc: j.skill.desc, cd: j.skill.cd, color: c.color, clsName: c.name, jobName: j.name, ops: j.skill.ops, from: j.from, sup: !!j.skill.sup, ranged: c.rng > 2 };
  };

  /* ---------- registro ----------
     FX.register(key, { dur: segundos, hits: [segundos dos impactos], draw(ctx, t, sc, K) })
     sc: { x, y: pés do conjurador (px) · tx, ty: pés do alvo (px) · z: px por pixel de arte · tile: px por unidade do mundo (16*z)
           dir: 1/-1 · quiet: movimento reduzido · light: efeitos leves · world: true no mapa, false na prévia
           seed: inteiro estável por evento · others: [{x,y}] inimigos próximos ao alvo · allies: [{x,y}] aliados próximos
           shake(px): tremor de tela (ignorado com quiet) · W, H: tamanho do canvas
           drawCaster(ctx, x, y, { alpha, pose, flip, tint }): desenha o sprite do próprio conjurador (ecos e sombras) } */
  FX.register = (key, def) => {
    if (!key || !def || typeof def.draw !== 'function') throw new TypeError('SkillFX.register: definição inválida para ' + key);
    FX.defs[key] = Object.assign({ dur: 1.2, hits: [0.2] }, def);
  };
  FX.has = key => !!FX.defs[key];
  FX.duration = key => (FX.defs[key] || fallback).dur;
  FX.hits = key => (FX.defs[key] || fallback).hits.slice();
  FX.render = (ctx, key, t, sc) => {
    const d = FX.defs[key] || fallback; if (t < 0 || t > d.dur) return false;
    ctx.save();
    try { ctx.imageSmoothingEnabled = false; d.draw(ctx, t, sc, K, FX.info(key)); }
    catch (e) { if (!FX._warned) { FX._warned = 1; (G.recordError || console.error)(e, 'skillfx:' + key); } }
    finally { ctx.restore(); }
    return true;
  };

  /* ---------- sprite do conjurador (ecos, sombras, pós-imagens) ----------
     FX.casterDrawer(heroiOuAparencia, z) -> (ctx, x, y, { alpha, pose, flip, tint }) desenha o herói com os pés em (x, y).
     pose: 'idle0', 'walk0-3', 'atk0-2', 'cast0-2', 'victory0-1'. tint: cor sólida opcional (silhueta). */
  const tintCache = new WeakMap();
  const tinted = (cv, n, fw, fh, color) => {
    let m = tintCache.get(cv); if (!m) { m = new Map(); tintCache.set(cv, m); }
    const key = n + '|' + color; let c = m.get(key);
    if (!c) { c = A.mk(fw, fh); const x = c.getContext('2d'); x.drawImage(cv, n * fw, 0, fw, fh, 0, 0, fw, fh); x.globalCompositeOperation = 'source-atop'; x.fillStyle = color; x.fillRect(0, 0, fw, fh); m.set(key, c); }
    return c;
  };
  FX.casterDrawer = (hero, z) => (ctx, x, y, o) => {
    o = o || {};
    try {
      const s = A.charSheet(hero && hero.look && !hero.cls ? hero : A.heroLook(hero)), pose = o.pose || 'idle0';
      if (s.need) s.need(pose);
      const n = (s.idx && s.idx[pose]) || 0, fw = s.fw || 26, fh = s.fh || 30, fs = s.scale || 1, ax = s.ax == null ? 13 : s.ax, ay = s.ay == null ? 27 : s.ay;
      ctx.save(); ctx.globalAlpha = K.clamp(o.alpha == null ? 1 : o.alpha, 0, 1); ctx.translate(x, y); if (o.flip) ctx.scale(-1, 1);
      if (o.tint) ctx.drawImage(tinted(s.cv, n, fw, fh, o.tint), 0, 0, fw, fh, -ax * fs * z, -ay * fs * z, fw * fs * z, fh * fs * z);
      else ctx.drawImage(s.cv, n * fw, 0, fw, fh, -ax * fs * z, -ay * fs * z, fw * fs * z, fh * fs * z);
      ctx.restore();
    } catch (e) { /* aparência indisponível: só o efeito é desenhado */ }
  };

  /* ---------- kit de desenho ---------- */
  const K = FX.kit = {};
  K.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  K.lerp = (a, b, u) => a + (b - a) * u;
  /* progresso normalizado de t dentro do intervalo [a, b] */
  K.seg = (t, a, b) => K.clamp((t - a) / (b - a), 0, 1);
  K.ease = {
    out: u => 1 - Math.pow(1 - u, 3), in: u => u * u * u, inOut: u => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
    back: u => { const c = 1.70158; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); },
    elastic: u => (u === 0 || u === 1 ? u : Math.pow(2, -10 * u) * Math.sin((u * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
    pulse: u => Math.sin(u * Math.PI),
  };
  /* gerador determinístico (mulberry32): o mesmo seed gera as mesmas partículas a cada quadro */
  K.rng = seed => { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  /* pixel quadrado alinhado à grade de arte */
  K.px = (ctx, x, y, s, color, alpha) => { if (alpha != null) ctx.globalAlpha = alpha; ctx.fillStyle = color; s = Math.max(1, Math.round(s)); ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s); };
  /* brilho aditivo suave */
  K.glow = (ctx, x, y, r, color, alpha) => {
    if (!(r > 0)) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = K.clamp(alpha == null ? 1 : alpha, 0, 1);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  };
  /* anel elíptico no chão (perspectiva 2:1 por padrão) */
  K.ring = (ctx, x, y, r, color, width, alpha, squash) => {
    if (!(r > 0)) return; ctx.save(); ctx.globalAlpha = K.clamp(alpha == null ? 1 : alpha, 0, 1); ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, width || 1);
    ctx.beginPath(); ctx.ellipse(x, y, r, r * (squash == null ? 0.42 : squash), 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  };
  /* disco preenchido no chão */
  K.disc = (ctx, x, y, r, color, alpha, squash) => {
    if (!(r > 0)) return; ctx.save(); ctx.globalAlpha = K.clamp(alpha == null ? 1 : alpha, 0, 1); ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * (squash == null ? 0.42 : squash), 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  };
  /* explosão radial de partículas quadradas. o: { n, r (alcance px), size, colors[], seed, u (0..1), up (gravidade negativa px), spin } */
  K.burst = (ctx, x, y, o) => {
    const rnd = K.rng(o.seed || 7), n = o.n || 12, u = K.clamp(o.u, 0, 1), cols = o.colors || ['#fff'];
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, sp = 0.45 + rnd() * 0.55, d = (o.r || 30) * sp * K.ease.out(u), s = (o.size || 3) * (1 - u * 0.7) * (0.6 + rnd() * 0.6);
      const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * (o.squash == null ? 0.7 : o.squash) - (o.up || 0) * u + (o.fall || 0) * u * u;
      K.px(ctx, px, py, s, cols[i % cols.length], (o.alpha == null ? 1 : o.alpha) * (1 - u));
    }
  };
  /* corte em meia-lua: centro (x,y), raio r, ângulos a0→a1, espessura w; u controla o varrimento */
  K.slash = (ctx, x, y, r, a0, a1, w, color, alpha, u) => {
    u = u == null ? 1 : K.clamp(u, 0, 1); if (u <= 0) return;
    const end = a0 + (a1 - a0) * u, start = a0 + (a1 - a0) * Math.max(0, u - 0.55);
    ctx.save(); ctx.globalAlpha = K.clamp(alpha == null ? 1 : alpha, 0, 1); ctx.fillStyle = color; ctx.beginPath();
    ctx.arc(x, y, r, start, end, a1 < a0); ctx.arc(x, y, Math.max(1, r - w), end, start, a1 >= a0); ctx.closePath(); ctx.fill(); ctx.restore();
  };
  /* raio quebrado entre dois pontos */
  K.bolt = (ctx, x1, y1, x2, y2, o) => {
    o = o || {}; const rnd = K.rng(o.seed || 3), seg = o.segments || 7, jag = o.jag == null ? 6 : o.jag;
    ctx.save(); ctx.globalAlpha = K.clamp(o.alpha == null ? 1 : o.alpha, 0, 1); ctx.strokeStyle = o.color || '#fff'; ctx.lineWidth = Math.max(1, o.width || 2); ctx.lineJoin = 'miter';
    ctx.beginPath(); ctx.moveTo(x1, y1);
    for (let i = 1; i < seg; i++) { const u = i / seg; ctx.lineTo(K.lerp(x1, x2, u) + (rnd() - 0.5) * jag * 2, K.lerp(y1, y2, u) + (rnd() - 0.5) * jag * 2); }
    ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
  };
  /* rastro reto (projétil): de (x1,y1) a (x2,y2) com cauda proporcional a len (0..1) */
  K.streak = (ctx, x1, y1, x2, y2, w, color, alpha) => {
    ctx.save(); ctx.globalAlpha = K.clamp(alpha == null ? 1 : alpha, 0, 1); ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, w); ctx.lineCap = 'square';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
  };
  /* polígono preenchido a partir de [[x,y],...] */
  K.poly = (ctx, pts, color, alpha) => { ctx.save(); ctx.globalAlpha = K.clamp(alpha == null ? 1 : alpha, 0, 1); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fill(); ctx.restore(); };
  /* runa/losango */
  K.diamond = (ctx, x, y, s, color, alpha, fill) => { ctx.save(); ctx.globalAlpha = K.clamp(alpha == null ? 1 : alpha, 0, 1); ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.7, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.7, y); ctx.closePath(); if (fill) { ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, s / 4); ctx.stroke(); } ctx.restore(); };
  /* clarão de tela inteira (use com moderação; ignorado no modo quiet) */
  K.flash = (ctx, sc, color, alpha) => { if (sc.quiet || !(alpha > 0)) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = K.clamp(alpha, 0, 0.35); ctx.fillStyle = color; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore(); };

  /* animação genérica de segurança, usada quando uma habilidade não tem arte registrada */
  const fallback = {
    dur: 1, hits: [0.2],
    draw(ctx, t, sc, K, info) {
      const c = (info && info.color) || '#ffe07a', u = K.seg(t, 0, 1), cx = sc.tx, cy = sc.ty - sc.tile * 0.5;
      K.glow(ctx, cx, cy, sc.tile * (0.6 + u), c, 0.6 * (1 - u));
      K.ring(ctx, sc.tx, sc.ty, sc.tile * (0.4 + u * 1.4), c, sc.z, 1 - u);
      K.burst(ctx, cx, cy, { n: sc.light ? 6 : 14, r: sc.tile * 1.4, size: sc.z * 1.6, colors: [c, '#fff6c8'], seed: sc.seed, u });
    },
  };

  /* ---------- eventos no mapa ---------- */
  const MAX_EVENTS = 32;
  let seedN = 1;
  const quietNow = () => !!((G.S && G.S.opts && G.S.opts.reduceMotion) || media.matches);
  const nearMons = (m, mons) => {
    const out = []; if (!m) return out;
    for (const o of mons || G.mons || []) { if (o === m || o.dead || o.gone) continue; if (Math.hypot(o.x - m.x, o.y - m.y) < 3.6) { out.push(o); if (out.length >= 6) break; } }
    return out;
  };
  const nearAllies = h => {
    const out = [];
    for (const a of (G.S && G.S.heroes) || []) { if (a === h || a.inside || a.state === 'fallen' || a.state === 'recover') continue; if (Math.hypot(a.x - h.x, a.y - h.y) < 4.6) { out.push(a); if (out.length >= 5) break; } }
    return out;
  };
  const queue = (key, h, m, mons) => {
    if (!key || G.HEADLESS || G.OFFLINE || !G.S || !h) return;
    if (FX.events.length >= MAX_EVENTS) FX.events.shift();
    FX.events.push({ key, h, m, hx: h.x, hy: h.y, mx: m ? m.x : h.x + (h.dir || 1) * 2, my: m ? m.y : h.y, dir: m ? (m.x >= h.x ? 1 : -1) : (h.dir || 1), start: R.t, seed: (seedN = (seedN * 1103515245 + 12345) >>> 0), others: nearMons(m, mons), allies: nearAllies(h) });
  };
  FX.queue = queue;

  if (typeof G.castHeroSpecial === 'function') {
    const orig = G.castHeroSpecial;
    G.castHeroSpecial = function (h, m, mons) { const r = orig.apply(this, arguments); try { queue('base:' + h.cls, h, m, mons); } catch (e) { /* visual */ } return r; };
  }
  if (typeof G.jobSkillTry === 'function') {
    const orig = G.jobSkillTry;
    G.jobSkillTry = function (h, m, mons) {
      const a2 = h.tS2 || 0, a3 = h.tS3 || 0, r = orig.apply(this, arguments);
      if (r) try { const i = (h.tS2 || 0) > a2 ? 1 : (h.tS3 || 0) > a3 ? 2 : 0; if (i) queue(FX.keyFor(h, i), h, m, mons); } catch (e) { /* visual */ }
      return r;
    };
  }
  /* o emblema genérico antigo (A.skillCanvas) dá lugar às animações novas; a pose de conjuração (ordem 10) é preservada */
  G.hook('visualEvent', f => { if (f && f.skillId && FX.defs[f.skillId]) { f.sfxSkill = f.skillId; delete f.skillId; } }, 15);

  G.hook('worldEffects', (ctx, X, Y, z) => {
    if (!G.S || !FX.events.length) return;
    const quiet = quietNow(), light = !!G.S.opts.lowFx, W = ctx.canvas.width, H = ctx.canvas.height, tile = TS * z;
    for (let i = FX.events.length - 1; i >= 0; i--) {
      const e = FX.events[i], t = R.t - e.start, d = FX.defs[e.key] || fallback;
      if (t > d.dur || t < -1) { FX.events.splice(i, 1); continue; }
      /* acompanha conjurador e alvo enquanto existem */
      if (e.h && !e.h.inside && e.h.state !== 'fallen') { e.hx = e.h.x; e.hy = e.h.y; }
      if (e.m && !e.m.dead && !e.m.gone) { e.mx = e.m.x; e.my = e.m.y; }
      const x = X(e.hx), y = Y(e.hy), tx = X(e.mx), ty = Y(e.my), pad = tile * 5;
      if (Math.max(x, tx) < -pad || Math.min(x, tx) > W + pad || Math.max(y, ty) < -pad || Math.min(y, ty) > H + pad) continue;
      const sc = {
        x, y, tx, ty, z, tile, dir: e.dir, quiet, light, world: true, seed: e.seed, W, H,
        others: e.others.filter(o => !o.gone).map(o => ({ x: X(o.x), y: Y(o.y) })),
        allies: e.allies.map(a => ({ x: X(a.x), y: Y(a.y) })),
        shake: px => { if (!quiet && px > 0) R.shake = Math.max(R.shake || 0, Math.min(px, 6)); },
        drawCaster: e.h ? FX.casterDrawer(e.h, z) : () => {},
      };
      FX.render(ctx, e.key, t, sc);
    }
  }, 37);
  G.hook('newGame', () => { FX.events.length = 0; }, 211);
  G.hook('afterLoad', () => { FX.events.length = 0; }, 211);
})();
