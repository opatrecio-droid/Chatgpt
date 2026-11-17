/* Aurora 046 · Prévias animadas das habilidades (aba Habilidades da ficha do herói).
   Grimório no topo, miniaturas nos cartões, prévia grande (janela e vocação). Somente visual:
   um único laço requestAnimationFrame para todas as telas; desenha só canvases visíveis. */
(function () {
  'use strict';
  if (typeof G === 'undefined' || G.HEADLESS || !G.UI || !G.A || !G.A.SkillFX) return;
  const FX = G.A.SkillFX, K = FX.kit, UI = G.UI, A = G.A;
  const PRE = 0.25, POST = 0.35;                       // silêncio antes/depois da animação (s) · total = dur + 0,6
  const esc = s => (UI.esc ? UI.esc(String(s)) : String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])));
  const ic = n => { try { return UI.ic(n) || ''; } catch (e) { return ''; } };
  const media = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const reduced = () => !!((G.S && G.S.opts && G.S.opts.reduceMotion) || media.matches);
  const dprNow = () => Math.max(1, Math.min(2, window.devicePixelRatio || 1, (G.S && G.S.opts && G.S.opts.dprCap) || 2));
  const hashKey = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) || 1; };

  /* ---------- cores ---------- */
  const rgb = c => { c = String(c || '#888').replace('#', ''); if (c.length === 3) c = c.replace(/./g, '$&$&'); const n = parseInt(c, 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, f) => { const x = rgb(a), y = rgb(b); return 'rgb(' + x.map((v, i) => Math.round(v + (y[i] - v) * f)).join(',') + ')'; };
  const rgba = (c, a) => { const x = rgb(c); return 'rgba(' + x[0] + ',' + x[1] + ',' + x[2] + ',' + a + ')'; };

  /* ---------- dados: tipo, plano de dano, estado de bloqueio ---------- */
  const BASE_OPS = {
    esp: [{ o: 'aoe', m: 1.3 }], cav: [{ o: 'taunt' }, { o: 'buff', k: 'def', v: 0.55 }],
    arq: [{ o: 'hit', m: 2 }, { o: 'dot', c: '#ff8a3a' }], mag: [{ o: 'aoe', m: 2 }],
    pal: [{ o: 'heal', pct: 0.2 }, { o: 'dominate' }], lad: [{ o: 'hit', m: 2.6, crit: 1 }],
  };
  const opsOf = info => info.ops || BASE_OPS[info.cls] || [];
  const TYPE_NAMES = { dano: 'Dano', area: 'Área', cont: 'Contínuo', ctrl: 'Controle', sup: 'Suporte' };
  function typesOf(info) {
    const ops = opsOf(info), has = n => ops.some(o => n.indexOf(o.o) >= 0), out = [];
    const area = has(['aoe', 'multi']), dmg = has(['hit']);
    if (area) out.push('area'); else if (dmg) out.push('dano');
    if (has(['dot'])) out.push('cont');
    if (has(['stun', 'slow', 'taunt', 'vuln', 'dominate'])) out.push('ctrl');
    if (has(['buff', 'heal', 'shield', 'cleanse'])) out.push('sup');
    if (!out.length) out.push('dano');
    return out.slice(0, 2).map(t => ({ t, label: TYPE_NAMES[t] }));
  }
  const BUFF_TXT = { atk: p => '+' + p + '% ATQ', def: p => '-' + p + '% DANO', aspd: p => '+' + p + '% VEL', eva: p => '+' + p + '% ESQ', regen: () => 'REGEN', thorns: () => 'ESPINHOS' };
  const plans = Object.create(null);
  function planOf(key) {
    if (plans[key]) return plans[key];
    const info = FX.info(key); if (!info) return null;
    const ops = opsOf(info), dm = ops.filter(o => o.o === 'hit' || o.o === 'aoe' || o.o === 'multi');
    const dur = FX.duration(key), hits = FX.hits(key).filter(h => h < dur).sort((a, b) => a - b);
    if (!hits.length) hits.push(Math.min(0.2, dur * 0.3));
    const rnd = K.rng(hashKey(key)), crit = ops.some(o => o.crit) || /cr[ií]tico/i.test(info.desc || '');
    const p = { key, info, ops, dur, hits, dmg: dm.length > 0, area: ops.some(o => o.o === 'aoe' || o.o === 'multi'), heal: ops.some(o => o.o === 'heal'), crit, types: typesOf(info), nums: [], tags: [], status: [] };
    const m = dm.length ? dm[0].m || 1 : 0;
    p.noDmg = !p.dmg;
    hits.forEach((ht, i) => {
      const v = Math.round(78 * (m || 1) * (0.9 + rnd() * 0.2) * (crit && i === 0 ? 1 : 1)) + (i === 0 ? 0 : 0);
      p.nums.push({ t: ht, v, crit: crit && i === 0, dx: (((i % 3) - 1) * 0.5 + (rnd() - 0.5) * 0.2) });
    });
    for (const o of ops) {
      if (o.o === 'buff') { const f = BUFF_TXT[o.k]; if (f) p.tags.push(f(Math.round((o.v || 0) * 100))); }
      else if (o.o === 'shield') p.tags.push('ESCUDO'); else if (o.o === 'cleanse') p.tags.push('LIMPAR');
      else if (o.o === 'stun') p.status.push('ATORDOADO'); else if (o.o === 'slow') p.status.push('LENTO');
      else if (o.o === 'dot') p.status.push(/9be08a/i.test(o.c || '') ? 'VENENO' : 'QUEIMANDO');
      else if (o.o === 'vuln') p.status.push('MARCADO'); else if (o.o === 'taunt' && p.dmg) p.status.push('PROVOCADO');
      else if (o.o === 'dominate') p.status.push('DOMINADO');
    }
    if (info.cls === 'cav' && info.tier === 1) p.tags.push('PROVOCAR');
    if (o_has(ops, 'taunt') && !p.dmg && !p.tags.length) p.tags.push('PROVOCAR');
    const cast = info.ranged || info.sup || !p.dmg;
    p.pose = cast ? 'cast' : 'atk';
    p.melee = !cast;
    return (plans[key] = p);
  }
  function o_has(ops, n) { return ops.some(o => o.o === n); }

  function rankName(i) { try { return 'Rank ' + (G.RANKS[i] || i); } catch (e) { return 'Rank'; } }
  /* estado: learned | avail | locked | closed, com motivo curto */
  function statusOf(h, key) {
    const info = FX.info(key); if (!info) return { st: 'locked', txt: '' };
    const J = G.JOBS;
    try {
      if (info.tier === 1) return { st: 'learned', txt: 'Aprendida · Nv.' + (G.skillLvl ? G.skillLvl(h, 0) : 1) };
      if (info.tier === 2) {
        if (h.j2 === key) return { st: 'learned', txt: 'Aprendida · Nv.' + (G.skillLvl ? G.skillLvl(h, 1) : 1) };
        if (h.j2) return { st: 'closed', txt: 'Ramo fechado' };
        return G.jobReady(h) ? { st: 'avail', txt: 'Disponível' } : { st: 'locked', txt: rankName(G.jobReq(2).rank) };
      }
      if (h.j3 === key) return { st: 'learned', txt: 'Aprendida · Nv.' + (G.skillLvl ? G.skillLvl(h, 2) : 1) };
      if (h.j3) return { st: 'closed', txt: 'Ramo fechado' };
      if (!h.j2) return { st: 'locked', txt: 'Vem de ' + ((J[info.from] && J[info.from].name) || '?') };
      if (h.j2 !== info.from) return { st: 'closed', txt: 'Ramo fechado' };
      return G.jobReady(h) ? { st: 'avail', txt: 'Disponível' } : { st: 'locked', txt: rankName(G.jobReq(3).rank) };
    } catch (e) { return { st: 'locked', txt: '' }; }
  }
  const lvName = t => (t === 1 ? 'Básica' : t + 'ª');
  const fmtCd = cd => 'Rec. ' + String(Math.round(cd * 10) / 10).replace('.', ',') + ' s';

  /* ---------- personagens ---------- */
  const fakes = {};
  const fakeHero = cls => fakes[cls] || (fakes[cls] = { cls, rar: 1, rank: 2, look: { skin: 2, hair: 4, style: 1, seed: 9 }, cos: {}, gear: { arma: { type: G.CLASSES[cls].w, tier: 2, rar: 1, plus: 0 }, armadura: { type: G.CLASSES[cls].a, tier: 2, rar: 1, plus: 0 } } });
  const heroById = id => { const L = (G.S && G.S.heroes) || []; return L.find(x => String(x.id) === String(id)) || L[0] || null; };
  function pickCaster(h, info) { const L = (G.S && G.S.heroes) || []; if (h && h.cls === info.cls) return h; return L.find(x => x.cls === info.cls) || fakeHero(info.cls); }
  function pickAlly(caster) { const L = (G.S && G.S.heroes) || []; return L.find(x => x !== caster && x.cls) || fakeHero(caster.cls === 'pal' ? 'cav' : 'pal'); }

  /* inimigo: esqueleto (quadro 0 e versão branca para o clarão de dano) */
  let mon = null, monWhite = null;
  function monster() {
    if (mon) return mon;
    try {
      const s = A.monSheet('esqueleto', 0, 0), fw = s.sw || s.w, fh = s.sh || s.h;
      const w = A.mk(fw, fh), x = w.getContext('2d'); x.drawImage(s.cv, 0, 0, fw, fh, 0, 0, fw, fh); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#fff'; x.fillRect(0, 0, fw, fh);
      mon = { s, fw, fh }; monWhite = w;
    } catch (e) { mon = { s: null }; }
    return mon;
  }
  function drawMon(ctx, x, y, z, flip, white, n) {
    const m = monster(); if (!m.s) { K.disc(ctx, x, y, 8 * z, '#9aa', 0.8, 0.6); return; }
    const s = m.s, w = s.w * z, h = s.h * z;
    ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(s.cv, (n || 0) * m.fw, 0, m.fw, m.fh, -w / 2, -(s.h - 2) * z, w, h);
    if (white > 0) { ctx.globalAlpha = Math.min(1, white); ctx.drawImage(monWhite, 0, 0, m.fw, m.fh, -w / 2, -(s.h - 2) * z, w, h); }
    ctx.restore();
  }

  /* ---------- cenário (cache por tamanho) ---------- */
  const MARG = 10;
  function buildBg(i) {
    const W = i.w, H = i.h, d = i.dpr, c = i.color, cv = A.mk(Math.ceil((W + MARG * 2) * d), Math.ceil((H + MARG * 2) * d)), x = cv.getContext('2d');
    x.scale(d, d); x.translate(MARG, MARG); x.imageSmoothingEnabled = false;
    const u = Math.max(2, Math.round(i.z * 1.5)), rnd = K.rng(hashKey(i.key) ^ 0x51ed), gy = Math.round(H * 0.64);
    const top = '#0b1020', hor = mix(c, '#1a2140', 0.72), N = 7;
    for (let b = 0; b < N; b++) { x.fillStyle = mix(top, hor, b / (N - 1)); x.fillRect(-MARG, -MARG + (gy + MARG) * b / N, W + MARG * 2, (gy + MARG) / N + 1); }
    for (let s = 0; s < Math.round(W / 14); s++) { x.fillStyle = 'rgba(255,255,255,' + (0.25 + rnd() * 0.45) + ')'; x.fillRect(Math.round(rnd() * W), Math.round(rnd() * gy * 0.7), 1, 1); }
    // lua / brilho distante
    const mx = W * (0.15 + rnd() * 0.7), my = gy * 0.28;
    const g = x.createRadialGradient(mx, my, 0, mx, my, H * 0.34); g.addColorStop(0, rgba(c, 0.28)); g.addColorStop(1, rgba(c, 0)); x.fillStyle = g; x.fillRect(0, 0, W, gy);
    // montanhas em degraus
    for (let layer = 0; layer < 2; layer++) {
      x.fillStyle = mix(hor, '#080b16', 0.35 + layer * 0.3); let hh = H * (0.16 + layer * 0.05);
      for (let px = -MARG; px < W + MARG; px += u * 2) { hh = K.clamp(hh + (rnd() - 0.5) * u * 3, H * 0.07, H * 0.26); x.fillRect(px, gy - hh * (1 - layer * 0.35), u * 2 + 1, hh * (1 - layer * 0.35) + 1); }
    }
    // chão
    const fg = x.createLinearGradient(0, gy, 0, H + MARG); fg.addColorStop(0, mix('#2a3045', c, 0.14)); fg.addColorStop(1, mix('#161a28', c, 0.08));
    x.fillStyle = fg; x.fillRect(-MARG, gy, W + MARG * 2, H - gy + MARG);
    x.fillStyle = 'rgba(255,255,255,.10)'; x.fillRect(-MARG, gy, W + MARG * 2, 1);
    x.strokeStyle = 'rgba(255,255,255,.07)'; x.lineWidth = 1;
    for (let r = 1; r <= 4; r++) { const yy = gy + (H - gy) * (r * r) / 16; x.beginPath(); x.moveTo(-MARG, Math.round(yy) + 0.5); x.lineTo(W + MARG, Math.round(yy) + 0.5); x.stroke(); }
    for (let k = -6; k <= 6; k++) { x.beginPath(); x.moveTo(W / 2 + k * W * 0.04, gy); x.lineTo(W / 2 + k * W * 0.22, H + MARG); x.stroke(); }
    for (let f = 0; f < Math.round(W / 12); f++) { x.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.18)'; x.fillRect(Math.round(rnd() * W), Math.round(gy + 3 + rnd() * (H - gy - 4)), u, 1); }
    const gl = x.createRadialGradient(W * 0.5, H * 0.8, 0, W * 0.5, H * 0.8, W * 0.5); gl.addColorStop(0, rgba(c, 0.2)); gl.addColorStop(1, rgba(c, 0)); x.fillStyle = gl; x.fillRect(0, gy, W, H - gy);
    const vg = x.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.5)'); x.fillStyle = vg; x.fillRect(-MARG, -MARG, W + MARG * 2, H + MARG * 2);
    i.bg = cv;
  }

  /* ---------- números e rótulos flutuantes ---------- */
  function floatText(ctx, txt, x, y, age, o) {
    if (age < 0 || age > 1) return;
    const u = age, fs = o.fs, rise = K.ease.out(Math.min(1, u * 1.1)) * o.rise, hop = u < 0.3 ? -Math.sin(u / 0.3 * Math.PI) * o.hop : 0, a = u < 0.62 ? 1 : 1 - (u - 0.62) / 0.38;
    const pop = u < 0.12 ? 0.6 + 3.3 * u : 1;
    ctx.save(); ctx.globalAlpha = Math.max(0, a); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '900 ' + Math.round(fs * pop) + 'px ui-monospace,Menlo,Consolas,monospace'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, fs * 0.28);
    ctx.strokeStyle = '#120a06'; ctx.strokeText(txt, x, y - rise + hop); ctx.fillStyle = o.color; ctx.fillText(txt, x, y - rise + hop);
    if (o.hi) { ctx.globalAlpha = Math.max(0, a) * 0.5; ctx.fillStyle = '#fff'; ctx.fillText(txt, x, y - rise + hop - 1); }
    ctx.restore();
  }

  /* ---------- cena ---------- */
  function layout(i) {
    const p = i.plan, W = i.w, H = i.h, z = i.z, tile = 16 * z, melee = p.melee && !p.info.ranged;
    const cx = W * (melee ? 0.29 : 0.22), tx = W * (melee ? 0.6 : 0.68), cy = H * 0.8, ty = H * 0.8;
    return { cx, cy, tx, ty, tile, melee };
  }
  function drawScene(i, tt) {
    const ctx = i.ctx, p = i.plan, W = i.w, H = i.h, z = i.z, d = i.dpr, rm = i.rm, t = tt - PRE;
    const L = layout(i), tile = L.tile;
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, W, H);
    const sh = rm ? 0 : i.shk * (i.big ? 1 : 0.5), fr = i.frameN++;
    const sx = sh ? (fr % 2 ? 1 : -1) * sh * 0.6 : 0, sy = sh ? (fr % 3 === 0 ? -1 : 1) * sh * 0.4 : 0;
    ctx.drawImage(i.bg, -MARG + sx, -MARG + sy, W + MARG * 2, H + MARG * 2);
    ctx.save(); ctx.translate(sx, sy);
    ctx.beginPath(); ctx.rect(-4, -4, W + 8, H + 8); ctx.clip();
    i.shkNext = 0;
    // hit reaction
    const react = k => { let r = 0; for (const h of p.hits) { const a = t - h - k * 0.03; if (a >= 0 && a < 0.24) r = Math.max(r, 1 - a / 0.24); } return r; };
    const dir = 1;
    const others = [{ x: L.tx + tile * 1.1, y: L.ty - tile * 0.34, k: 1 }, { x: L.tx + tile * 0.8, y: L.ty + tile * 0.5, k: 2 }];
    const ally = { x: L.cx - tile * 0.95, y: L.cy - tile * 0.3 };
    const items = [];
    items.push({ y: ally.y, f: () => { shadow(ctx, ally.x, ally.y, z); i.allyDraw(ctx, ally.x, ally.y, { pose: 'idle' + (Math.floor(tt * 2.2 + 1) % 2) }); } });
    const hitsOthers = p.area || p.dmg && p.info.tier >= 3 && p.ops.some(o => o.r);
    others.forEach(o => items.push({ y: o.y, f: () => { const r = hitsOthers && p.dmg ? react(o.k) : 0; shadow(ctx, o.x, o.y, z); drawMon(ctx, o.x + r * z * 2.5, o.y, z, true, r * 0.9, Math.floor(tt * 3 + o.k) % 2 ? 0 : 1); } }));
    const r0 = p.dmg || p.status.length ? react(0) : 0;
    items.push({ y: L.ty, f: () => { shadow(ctx, L.tx, L.ty, z); drawMon(ctx, L.tx + r0 * z * 3.5, L.ty, z, true, r0 * 0.95, Math.floor(tt * 3) % 2 ? 0 : 1); } });
    // conjurador
    const h0 = p.hits[0], last = p.hits[p.hits.length - 1];
    let pose, lunge = 0;
    if (t < 0 || t > Math.max(last + 0.15, h0 + 0.3, p.dur * 0.55)) pose = 'idle' + (Math.floor(tt * 2.2) % 2);
    else { const f = t < h0 - 0.12 ? 0 : t < h0 + 0.1 ? 1 : 2; pose = p.pose + f; if (L.melee) lunge = K.ease.out(K.seg(t, h0 - 0.2, h0 - 0.03)) * (1 - K.seg(t, last + 0.1, last + 0.35)); }
    items.push({ y: L.cy + 0.01, f: () => { shadow(ctx, L.cx, L.cy, z); i.casterDraw(ctx, L.cx + lunge * tile * 0.35, L.cy, { pose }); } });
    items.sort((a, b) => a.y - b.y).forEach(it => it.f());
    // efeito da habilidade
    const sc = {
      x: L.cx, y: L.cy, tx: L.tx, ty: L.ty, z, tile, dir, quiet: rm, light: !i.big, world: false, seed: i.seed, W, H,
      others: others.map(o => ({ x: o.x, y: o.y })), allies: [{ x: ally.x, y: ally.y }],
      shake: px => { if (!rm && px > 0) i.shkNext = Math.max(i.shkNext, Math.min(px, 6)); }, drawCaster: i.casterDraw,
    };
    if (t >= 0 && t <= p.dur) FX.render(ctx, p.key, t, sc);
    // números, rótulos
    const fs = K.clamp(z * 5.4, 10, 20);
    if (t >= 0) {
      const body = L.ty - 27 * z;
      p.nums.forEach((n, k) => {
        const age = (t - n.t) / 0.9, big = n.crit ? 1.35 : 1;
        if (p.dmg) {
          floatText(ctx, (n.crit ? '' : '') + n.v + (n.crit ? '!' : ''), L.tx + n.dx * tile, body, age, { fs: fs * big, color: n.crit ? '#ffd75a' : '#fff1e0', rise: 18 * z, hop: 5 * z, hi: n.crit });
          if (hitsOthers) others.forEach((o, q) => floatText(ctx, Math.round(n.v * 0.7), o.x, o.y - 25 * z, age - q * 0.05, { fs: fs * 0.8, color: '#ffd9c0', rise: 14 * z, hop: 4 * z }));
          if (p.heal && k === p.nums.length - 1) floatText(ctx, '+' + Math.round(n.v * 0.3), L.cx, L.cy - 31 * z, age - 0.1, { fs: fs * 0.9, color: '#7dffa0', rise: 14 * z, hop: 3 * z });
        } else if (p.heal) {
          floatText(ctx, '+' + Math.round(n.v * 1.5), L.cx, L.cy - 31 * z, age, { fs, color: '#7dffa0', rise: 16 * z, hop: 4 * z });
          floatText(ctx, '+' + Math.round(n.v * 1.2), ally.x, ally.y - 31 * z, age - 0.07, { fs: fs * 0.9, color: '#7dffa0', rise: 16 * z, hop: 4 * z });
        }
      });
      if (!p.dmg && !p.heal && p.tags.length) p.tags.slice(0, 2).forEach((s, k) => {
        floatText(ctx, s, L.cx, L.cy - 31 * z - k * fs * 1.15, (t - h0 - k * 0.1) / 1.1, { fs: fs * 0.78, color: '#9eeaff', rise: 10 * z, hop: 0 });
      });
      else if (p.tags.length && p.dmg) floatText(ctx, p.tags[0], L.cx, L.cy - 31 * z, (t - h0 - 0.1) / 1.1, { fs: fs * 0.7, color: '#9eeaff', rise: 8 * z, hop: 0 });
      if (i.big && p.status.length) p.status.slice(0, 2).forEach((s, k) => floatText(ctx, s, L.tx, body - fs * 1.7 - k * fs * 1.1, (t - last - 0.12 - k * 0.1) / 1.3, { fs: fs * 0.62, color: '#ffe07a', rise: 6 * z, hop: 0 }));
    }
    // nome da habilidade (só na grande)
    if (i.big) {
      const u = tt / (p.dur + PRE + POST), a = u < 0.04 ? u / 0.04 : u < 0.4 ? 1 : K.clamp(1 - (u - 0.4) / 0.2, 0, 1);
      if (a > 0.01) {
        ctx.save(); ctx.globalAlpha = a * 0.95; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; const f2 = Math.round(K.clamp(W / 24, 11, 17));
        ctx.font = '900 ' + f2 + 'px ui-monospace,Menlo,Consolas,monospace'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0a0d18'; ctx.strokeText(p.info.name.toUpperCase(), W / 2, 12 - (1 - a) * 4); ctx.fillStyle = '#fff6d0'; ctx.fillText(p.info.name.toUpperCase(), W / 2, 12 - (1 - a) * 4); ctx.restore();
      }
    }
    ctx.restore();
    i.shk = i.shkNext;
  }
  function shadow(ctx, x, y, z) { K.disc(ctx, x, y - z, 10 * z, '#000', 0.38, 0.32); }

  /* ---------- registro e laço único ---------- */
  const insts = new Set();
  let raf = 0, poll = 0;
  const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver(es => { for (const e of es) if (e.target._sfx) e.target._sfx.vis = e.isIntersecting; ensure(); }, { threshold: 0.01 }) : null;
  function dispose(i) { insts.delete(i); if (io) try { io.unobserve(i.cv); } catch (e) { /* nada */ } }
  function reg(cv, o) {
    if (cv._sfx) dispose(cv._sfx);
    const plan = planOf(o.key); if (!plan) return null;
    const hero = heroById(o.hid), caster = pickCaster(hero, plan.info);
    const i = { cv, ctx: cv.getContext('2d'), key: o.key, plan, big: !!o.big, hero, caster, ally: pickAlly(caster), color: plan.info.color, vis: true, t0: performance.now(), w: 0, h: 0, z: 1, dpr: 1, dirty: true, once: null, shk: 0, shkNext: 0, frameN: 0, last: 0, rm: reduced(), seed: hashKey(o.key) % 100000 + 1 };
    cv._sfx = i; insts.add(i); if (io) io.observe(cv); ensure(); return i;
  }
  function modalBlocks(cv) { const m = document.getElementById('modal'); return !!(UI.modalOpen && m && !m.contains(cv)); }
  function size(i) {
    const w = i.cv.clientWidth, h = i.cv.clientHeight, d = dprNow(); if (!w || !h) return false;
    if (w === i.w && h === i.h && d === i.dpr && i.bg) return true;
    i.w = w; i.h = h; i.dpr = d; i.cv.width = Math.round(w * d); i.cv.height = Math.round(h * d);
    i.z = Math.max(1, Math.round(h / (i.big ? 68 : 66) * d * 2) / (2 * d));
    i.casterDraw = FX.casterDrawer(i.caster, i.z); i.allyDraw = FX.casterDrawer(i.ally, i.z);
    buildBg(i); i.dirty = true; return true;
  }
  function step(i, now) {
    if (!size(i)) return;
    const p = i.plan, total = p.dur + PRE + POST, rmNow = reduced();
    if (rmNow !== i.rm) { i.rm = rmNow; i.once = null; i.dirty = true; }
    if (i.rm) {
      if (i.once != null) { const tt = (now - i.once) / 1000; if (tt > total) { i.once = null; i.dirty = true; } else { drawScene(i, tt); return; } }
      if (i.dirty) { i.dirty = false; drawScene(i, PRE + p.hits[0] + 0.12); }
      return;
    }
    if (!i.big && now - i.last < 30) return; i.last = now; i.dirty = false;
    drawScene(i, ((now - i.t0) / 1000) % total);
  }
  function frame(now) {
    raf = 0; if (document.hidden) return;
    let active = 0, blocked = 0;
    for (const i of Array.from(insts)) {
      if (!i.cv.isConnected) { dispose(i); continue; }
      if (!i.vis) continue;
      if (modalBlocks(i.cv)) { blocked++; continue; }
      active++; try { step(i, now); } catch (e) { (G.recordError || console.error)(e, 'skillpreview'); dispose(i); }
    }
    if (active) raf = requestAnimationFrame(frame);
    else if (blocked && !poll) poll = setTimeout(() => { poll = 0; ensure(); }, 350);
  }
  function ensure() { if (!raf && !document.hidden && insts.size) raf = requestAnimationFrame(frame); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { insts.forEach(i => { i.t0 = performance.now() - (i.t0 ? 0 : 0); }); ensure(); } });
  function replay(i) { if (!i) return; if (i.rm) { i.once = performance.now(); } else i.t0 = performance.now(); i.shk = 0; ensure(); }

  /* ---------- peças de interface ---------- */
  const cvars = c => '--c:' + c + ';--cg:' + rgba(c, 0.5);
  const lockIc = () => '<span class="sfx-lk" aria-hidden="true">' + ic('lock') + '</span>';
  function chips(p, withCd) {
    return '<span class="sfx-chips">' + (withCd ? '<i class="sfx-chip cd">' + fmtCd(p.info.cd) + '</i>' : '') + p.types.map(t => '<i class="sfx-chip t-' + t.t + '">' + t.label + '</i>').join('') + '</span>';
  }
  function thumbHTML(key, hid, st, ctrl) {
    const p = planOf(key); if (!p) return '';
    const lock = st.st === 'locked' || st.st === 'closed';
    return '<span class="sfx-th sfx-frame' + (lock ? ' is-lock' : '') + '" style="' + cvars(p.info.color) + '" data-a="sfxprev:' + esc(key) + ':' + hid + '" data-sfx-key="' + esc(key) + '" data-sfx-hid="' + hid + '"' + (ctrl ? ' role="button" tabindex="0" aria-label="Ver prévia: ' + esc(p.info.name) + '"' : '') + '><canvas class="sfx-cv" aria-hidden="true"></canvas><span class="sfx-play" aria-hidden="true">▶</span>' + (lock ? lockIc() : '') + '</span>';
  }
  function cardHTML(key, h, hid) {
    const p = planOf(key); if (!p) return '';
    const st = statusOf(h, key), lock = st.st === 'locked' || st.st === 'closed';
    const stIc = lock ? ic('lock') : st.st === 'learned' ? '✔' : '✦';
    return '<button type="button" class="sfx-card t' + p.info.tier + ' st-' + st.st + '" style="' + cvars(p.info.color) + '" data-a="sfxprev:' + esc(key) + ':' + hid + '" aria-label="Prévia: ' + esc(p.info.name) + ' (' + esc(st.txt) + ')">' +
      '<span class="sfx-frame' + (lock ? ' is-lock' : '') + '"><canvas class="sfx-cv" data-sfx-key="' + esc(key) + '" data-sfx-hid="' + hid + '" aria-hidden="true"></canvas><span class="sfx-seal"><b>▶</b> PRÉVIA</span><span class="sfx-lv">' + lvName(p.info.tier) + '</span>' + (lock ? lockIc() : '') + '</span>' +
      '<span class="sfx-nm">' + esc(p.info.name) + '</span>' + chips(p, true) +
      '<span class="sfx-st"><span class="sfx-sti">' + stIc + '</span>' + esc(st.txt) + '</span></button>';
  }
  function grimHTML(h) {
    const keys = FX.classSkills(h.cls), tot = keys.length;
    let own = 0; keys.forEach(k => { const s = statusOf(h, k).st; if (s === 'learned') own++; });
    let col = false; try { col = localStorage.getItem('aurora.sfxGrim') === '0'; } catch (e) { /* sem storage */ }
    return '<div class="sfx-grim' + (col ? ' sfx-collapsed' : '') + '" data-sfx-grim="' + h.id + '|' + (h.j2 || '') + '|' + (h.j3 || '') + '|' + (G.heroPeak ? G.heroPeak(h) : '') + '">' +
      '<button type="button" class="sfx-gh" data-a="sfxgrim" aria-expanded="' + (!col) + '"><span class="sfx-gt"><b>Grimório de habilidades</b><small>' + own + ' aprendidas · ' + tot + ' na classe · toque para ver a prévia</small></span><span class="sfx-gc" aria-hidden="true">' + ic('up') + '</span></button>' +
      '<div class="sfx-gg">' + keys.map(k => cardHTML(k, h, h.id)).join('') + '</div></div>';
  }
  function bigHTML(key, hid, full) {
    const p = planOf(key); if (!p) return '';
    const h = heroById(hid), st = h ? statusOf(h, key) : { st: 'locked', txt: '' }, lock = st.st === 'locked' || st.st === 'closed';
    const stIc = lock ? ic('lock') : st.st === 'learned' ? '✔' : '✦';
    return '<div class="sfx-big' + (lock ? ' is-lock' : '') + '" style="' + cvars(p.info.color) + '" data-sfx-big="' + esc(key) + '">' +
      '<div class="sfx-frame" data-a="sfxreplay"><canvas class="sfx-cv" aria-hidden="true"></canvas><span class="sfx-seal"><b>▶</b> PRÉVIA</span><span class="sfx-lv">' + lvName(p.info.tier) + '</span>' + (lock ? lockIc() : '') + '</div>' +
      '<div class="sfx-bar"><button type="button" class="btn sm sfx-rp" data-a="sfxreplay" aria-label="Repetir a prévia">↻ Repetir</button>' + chips(p, true) + '<span class="sfx-st lg"><span class="sfx-sti">' + stIc + '</span>' + esc(st.txt) + '</span></div>' +
      (full ? '<p class="sfx-desc">' + esc(p.info.desc) + '</p>' : '') + '</div>';
  }
  function activate(root) {
    root.querySelectorAll('canvas.sfx-cv').forEach(cv => {
      if (cv._sfx && cv._sfx.cv === cv && insts.has(cv._sfx)) return;
      const th = cv.closest('[data-sfx-key]') || cv, big = cv.closest('.sfx-big');
      const key = th.getAttribute('data-sfx-key') || cv.getAttribute('data-sfx-key') || (big && big.getAttribute('data-sfx-big'));
      const hid = th.getAttribute('data-sfx-hid') || cv.getAttribute('data-sfx-hid') || (big && big.getAttribute('data-hero')) || '';
      if (key) reg(cv, { key, hid, big: !!big });
    });
  }

  /* ---------- ações ---------- */
  const splitArgs = a => { a = (a || []).slice(); const hid = a.pop(); return { key: a.join(':'), hid }; };
  UI.ACT.sfxprev = a => {
    const { key, hid } = splitArgs(a), p = planOf(key); if (!p) return;
    const info = p.info, j = G.JOBS[key];
    const html = '<div class="sfx-win" style="' + cvars(info.color) + '"><h2>' + esc(info.name) + '</h2>' +
      '<div class="sfx-prev-host" data-skill-preview="' + esc(key) + '" data-hero="' + hid + '" data-full="1"></div>' +
      '<div class="sfx-wbtns">' + (j ? '<button type="button" class="btn pri" data-a="job:' + hid + ':' + esc(key) + '">Ver vocação</button>' : '') + '<button type="button" class="btn" data-a="mclose">Fechar</button></div></div>';
    UI.modal(html, { pause: false });
    const m = document.getElementById('modal'); if (m) mount(m);
  };
  UI.ACT.sfxreplay = (a, el) => { const b = el && el.closest('.sfx-big'); const cv = b && b.querySelector('canvas'); if (cv) replay(cv._sfx); };
  UI.ACT.sfxgrim = (a, el) => {
    const g = el && el.closest('.sfx-grim'); if (!g) return; const c = g.classList.toggle('sfx-collapsed');
    const bt = g.querySelector('.sfx-gh'); if (bt) bt.setAttribute('aria-expanded', String(!c));
    try { localStorage.setItem('aurora.sfxGrim', c ? '0' : '1'); } catch (e) { /* sem storage */ }
    ensure();
  };
  /* Enter/Espaço nas miniaturas que não são botões */
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.classList && e.target.classList.contains('sfx-th') && e.target.getAttribute('role') === 'button') { e.preventDefault(); e.target.click(); }
  });

  /* ---------- injeção idempotente ---------- */
  function mount(m) {
    m.querySelectorAll('.sfx-prev-host[data-skill-preview]').forEach(host => {
      const key = host.getAttribute('data-skill-preview'), hid = host.getAttribute('data-hero'), full = host.getAttribute('data-full') === '1';
      if (host.getAttribute('data-sfx-ok') === key + '|' + hid) { activate(host); return; }
      if (!planOf(key)) return;
      host.innerHTML = bigHTML(key, hid, full); host.setAttribute('data-sfx-ok', key + '|' + hid);
      const bg = host.querySelector('.sfx-big'); if (bg) bg.setAttribute('data-hero', hid || '');
      activate(host);
    });
  }
  function inject(s, b) {
    const h = s.sub.hero && (typeof s.sub.hero === 'object' ? s.sub.hero : heroById(s.sub.hero));
    const hero = h || heroById(s.sub.hero); if (!hero || !hero.cls || !G.CLASSES[hero.cls]) return;
    document.documentElement.classList.toggle('sfx-rm', reduced());
    const root = b.querySelector('.hero-content') || b;
    // grimório
    const sig = hero.id + '|' + (hero.j2 || '') + '|' + (hero.j3 || '') + '|' + (G.heroPeak ? G.heroPeak(hero) : '');
    let g = root.querySelector('.sfx-grim');
    if (g && g.getAttribute('data-sfx-grim') !== sig) { g.remove(); g = null; }
    if (!g) {
      const wrap = document.createElement('div'); wrap.innerHTML = grimHTML(hero); g = wrap.firstChild;
      const first = root.querySelector('.sec'); if (first && first.parentNode === root) root.insertBefore(g, first); else root.insertBefore(g, root.firstChild);
    }
    activate(g);
    // miniaturas nos cartões
    root.querySelectorAll('[data-skill]').forEach(el => {
      if (el.classList.contains('node') || !el.classList.contains('sk') || el.querySelector('.sfx-th')) return;
      const key = el.getAttribute('data-skill'), row = el.querySelector('.row'); if (!row || !FX.info(key)) return;
      const st = statusOf(hero, key), tmp = document.createElement('div'); tmp.innerHTML = thumbHTML(key, hero.id, st, !el.matches('button'));
      const ski = row.querySelector('.ski'), th = tmp.firstChild; if (!th) return;
      if (ski && ski.nextSibling) row.insertBefore(th, ski.nextSibling); else row.insertBefore(th, row.firstChild);
      el.classList.add('sfx-has');
      activate(th);
    });
    ensure();
  }
  G.hook('sheetDraw', (s, b) => {
    try { if (s && s.name === 'herois' && s.sub && s.sub.hero && s.sub.ht === 'habil' && b) inject(s, b); } catch (e) { (G.recordError || console.error)(e, 'skillpreview'); }
  }, 60);
  G.hook('modalShow', m => { try { if (m) mount(m); } catch (e) { (G.recordError || console.error)(e, 'skillpreview'); } }, 60);
})();
