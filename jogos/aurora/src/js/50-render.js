/* 50-render: câmera, desenho do mundo, luz da noite, partículas e efeitos. */
'use strict';
(function () {
  const A = G.A, Wd = G.W, TS = 16, T = Wd.T;
  const R = (G.R = { cam: { x: 44 * TS, y: 54 * TS, z: 4, zf: 4 }, follow: 0, sel: null, t: 0, shake: 0, parts: [], fxs: [], statics: [], clouds: [] });
  let cv, ctx, cw = 0, ch = 0, dpr = 1, lcv, lctx, terrain;
  const water = [];

  R.init = (canvas) => {
    cv = canvas; ctx = R.ctx = cv.getContext('2d', { alpha: false });
    terrain = A.terrain();
    lcv = document.createElement('canvas'); lctx = lcv.getContext('2d');
    R.resize(); window.addEventListener('resize', R.resize);
    /* estáticos ordenados por y */
    const st = [];
    for (const p of Wd.props) { if (p.flat) continue; const s = A.prop(p.t, p.v); if (s) st.push({ y: p.y, x: p.x, s, kind: p.t, p }); }
    const tw = Wd.town;
    for (let x = tw.x0; x <= tw.x1; x++) for (const y of [tw.y0, tw.y1]) { if (Wd.tile[y * Wd.w + x] !== T.WALL) continue; const gate = Wd.tile[y * Wd.w + x - 1] !== T.WALL || Wd.tile[y * Wd.w + x + 1] !== T.WALL; const corner = x === tw.x0 || x === tw.x1; const s = A.wallPiece(gate || corner ? 't' : 'h'); st.push({ y: y + 1 + (gate || corner ? 0.02 : 0), x: x + 0.5, s, kind: 'wall' }); }
    for (let y = tw.y0 + 1; y < tw.y1; y++) for (const x of [tw.x0, tw.x1]) { if (Wd.tile[y * Wd.w + x] !== T.WALL) continue; const gate = Wd.tile[(y - 1) * Wd.w + x] !== T.WALL || Wd.tile[(y + 1) * Wd.w + x] !== T.WALL; const s = A.wallPiece(gate ? 't' : 'v'); st.push({ y: y + 1 + (gate ? 0.02 : 0), x: x + 0.5, s, kind: 'wall' }); }
    Wd.houses.forEach((h, i) => { const s = A.cottage(i); st.push({ y: h.y + 3, x: h.x + 2, s, kind: 'house', lights: s.lights, smoke: s.smoke, house: h }); });
    st.push({ y: Wd.portal.y + 0.2, x: Wd.portal.x, s: A.portalSprite(), kind: 'portal' });
    st.push({ y: Wd.fountain.y + 0.9, x: Wd.fountain.x, s: A.fountainSprite(), kind: 'fountain' });
    st.push({ y: Wd.board.y + 0.4, x: Wd.board.x, s: A.boardSprite(), kind: 'board' });
    st.sort((a, b) => a.y - b.y); R.statics = st;
    for (let y = 0; y < Wd.h; y++) for (let x = 0; x < Wd.w; x++) { const t = Wd.tile[y * Wd.w + x]; if (t === T.WATER || t === T.POOL || t === T.LAVA) water.push({ x, y, t, h: G.hash(x + ':' + y) % 1000 }); }
    for (let i = 0; i < 5; i++) R.clouds.push({ x: Math.random() * Wd.w, y: Math.random() * Wd.h, r: 6 + Math.random() * 7, v: 0.25 + Math.random() * 0.3 });
    if (G.S && G.S.cam) { R.cam.x = G.S.cam.x; R.cam.y = G.S.cam.y; }
  };
  R.resize = () => {
    dpr = Math.min(3, window.devicePixelRatio || 1);
    cw = Math.floor(cv.clientWidth * dpr); ch = Math.floor(cv.clientHeight * dpr);
    if (cw < 2 || ch < 2) return;
    cv.width = cw; cv.height = ch; ctx.imageSmoothingEnabled = false;
    lcv.width = Math.ceil(cw / 4); lcv.height = Math.ceil(ch / 4);
    if (!R._zinit) { R._zinit = 1; R.cam.zf = Math.max(2, Math.round(dpr * (cv.clientWidth > 900 ? 3 : 1.67))); R.cam.z = R.cam.zf; }
    R.minZ = Math.max(1, Math.round(dpr)); R.maxZ = Math.round(dpr * 5);
  };
  R.setZoom = (zf, ax, ay) => {
    const c = R.cam, old = c.z; zf = G.clamp(zf, R.minZ, R.maxZ); c.zf = zf; const nz = Math.round(zf);
    if (nz !== old) { if (ax != null) { const wx = c.x + (ax * dpr - cw / 2) / old, wy = c.y + (ay * dpr - ch / 2) / old; c.x = wx - (ax * dpr - cw / 2) / nz; c.y = wy - (ay * dpr - ch / 2) / nz; } c.z = nz; }
  };
  R.screenToWorld = (px, py) => [(R.cam.x + (px * dpr - cw / 2) / R.cam.z) / TS, (R.cam.y + (py * dpr - ch / 2) / R.cam.z) / TS];
  R.worldToScreen = (wx, wy) => [((wx * TS - R.cam.x) * R.cam.z + cw / 2) / dpr, ((wy * TS - R.cam.y) * R.cam.z + ch / 2) / dpr];
  R.focus = (wx, wy, snap) => { R.tx = wx * TS; R.ty = wy * TS; if (snap) { R.cam.x = R.tx; R.cam.y = R.ty; R.tx = null; } };
  R.pan = (dx, dy) => { R.cam.x -= (dx * dpr) / R.cam.z; R.cam.y -= (dy * dpr) / R.cam.z; R.follow = 0; R.tx = null; };

  /* ---------- seleção por toque ---------- */
  R.pick = (px, py) => {
    const [wx, wy] = R.screenToWorld(px, py), S = G.S;
    if (R.pickPet) { const o = R.pickPet(wx, wy, 0.7); if (o) return o; }
    let best = null, bd = 1.1;
    for (const h of S.heroes) { if (h.inside) continue; const d = Math.hypot(h.x - wx, h.y - 0.6 - wy); if (d < bd) { bd = d; best = { type: 'hero', ref: h }; } }
    if (best) return best;
    if (R.pickMore) { const o = R.pickMore(wx, wy); if (o) return o; }
    for (const m of G.mons) { if (m.dead) continue; const d = Math.hypot(m.x - wx, m.y - 0.5 * m.size - wy); if (d < Math.max(0.9, m.size * 0.7)) return { type: 'mon', ref: m }; }
    for (const n of G.npcs) { if (n.inside) continue; if (Math.hypot(n.x - wx, n.y - 0.6 - wy) < 0.9) return { type: 'npc', ref: n }; }
    if (Math.abs(wx - Wd.portal.x) < 1.8 && wy > Wd.portal.y - 3.6 && wy < Wd.portal.y + 1.4) return { type: 'portal' };
    if (Math.abs(wx - Wd.board.x) < 1 && wy > Wd.board.y - 1.8 && wy < Wd.board.y + 1) return { type: 'board' };
    for (const id of G.BLD_IDS) { const p = Wd.plots[id]; if (!G.bAvailable(id)) continue; if (wx >= p.x - 0.2 && wx <= p.x + 6.2 && wy >= p.y - 2.6 && wy <= p.y + 4.2) return { type: 'bld', id }; }   // v27 (A4): só os prédios desenhados respondem ao toque
    return null;
  };

  /* ---------- partículas ---------- */
  /* v26 (4C.3): no Modo leve entram só ~40% das partículas (nunca as moedas) e no máximo 220 de uma vez */
  const part = (x, y, vx, vy, life, c, size, g, kind) => { if (R.parts.length >= (G.S.opts.lowFx ? 220 : 700) || (G.S.opts.lowFx && kind !== 'coin' && Math.random() < 0.6)) return; R.parts.push({ x, y, vx, vy, life, max: life, c, size: size || 1, g: g || 0, kind }); };
  /* v26 (4C.3): texto medido uma vez por (fonte, texto): measureText por quadro pesava nos rótulos dos prédios e nos balões */
  const twC = new Map(); let twF = '';
  const tw = (t) => { if (twF !== ctx.font) { twF = ctx.font; twC.clear(); } let w = twC.get(t); if (w === undefined) { if (twC.size > 400) twC.clear(); w = ctx.measureText(t).width; twC.set(t, w); } return w; };
  /* v26 (4C.3): "pode melhorar?" dos rótulos dos prédios (G.canUpgrade monta objetos e confere custos): no máximo 2x por segundo por prédio */
  const upMemo = {};
  const upOk = (id) => { let c = upMemo[id]; if (!c || R.t - c.t > 0.5 || R.t < c.t) c = upMemo[id] = { t: R.t, ok: G.canUpgrade(id).ok }; return c.ok; };
  /* v26 (4C.3): luzes da noite: o gradiente radial de cada círculo vira uma figurinha guardada (criar gradientes por quadro era o maior custo da noite) */
  const lightC = new Map();
  const lightSprite = (rad, a, rgb) => {
    rad = Math.max(2, Math.round(rad)); a = Math.round(a * 50) / 50;
    const key = rad + '|' + a + '|' + (rgb || ''); let s = lightC.get(key);
    if (!s) {
      if (lightC.size > 160) lightC.clear();
      s = document.createElement('canvas'); s.width = s.height = rad * 2; const c = s.getContext('2d');
      const g = rgb ? c.createRadialGradient(rad, rad, 0, rad, rad, rad) : c.createRadialGradient(rad, rad, rad * 0.1, rad, rad, rad);
      g.addColorStop(0, rgb ? 'rgba(' + rgb + ',' + a + ')' : 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, rgb ? 'rgba(' + rgb + ',0)' : 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(0, 0, rad * 2, rad * 2); lightC.set(key, s);
    }
    return s;
  };
  R.burst = (x, y, n, c, sp, life, g) => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = (0.3 + Math.random()) * (sp || 2); part(x, y, Math.cos(a) * v, Math.sin(a) * v - 0.5, (life || 0.5) * (0.6 + Math.random() * 0.6), Array.isArray(c) ? G.pick(c) : c, Math.random() < 0.4 ? 2 : 1, g == null ? 4 : g); } };

  const takeFx = () => {
    const q = G.fx; if (!q.length) return;
    for (const f of q) {
      switch (f.t) {
        case 'dmg': R.fxs.push({ t: 'num', x: f.x + G.rnd(-0.25, 0.25), y: f.y, s: (f.heal ? '+' : '') + G.fmt(f.n), c: f.c, crit: f.crit, age: 0, life: f.crit ? 1 : 0.8 }); if (!f.heal) R.burst(f.x, f.y + 0.3, f.crit ? 6 : 3, f.c === '#ff6b6b' ? ['#ff6b6b', '#ffb0b0'] : ['#ffffff', '#ffe9a0'], 1.6, 0.3); break;
        case 'miss': R.fxs.push({ t: 'num', x: f.x, y: f.y, s: 'errou', c: '#c8d0dc', age: 0, life: 0.6, small: 1 }); break;
        case 'text': R.fxs.push({ t: 'num', x: f.x, y: f.y, s: f.s, c: f.c, age: 0, life: 1.4, small: 1 }); break;
        case 'slash': R.fxs.push({ t: 'slash', x: f.x, y: f.y, dir: f.dir, c: f.c, big: f.big, age: 0, life: 0.2 }); break;
        case 'spin': R.fxs.push({ t: 'ring', x: f.x, y: f.y, c: f.c, r: 2, age: 0, life: 0.3 }); break;
        case 'proj': R.fxs.push({ t: 'proj', x: f.x, y: f.y, tx: f.tx, ty: f.ty, k: f.k, c: f.c, age: -(f.d || 0), life: Math.min(0.35, Math.hypot(f.tx - f.x, f.ty - f.y) / 16 + 0.08) }); break;
        case 'boom': R.fxs.push({ t: 'ring', x: f.x, y: f.y, c: f.c, r: f.r || 2, age: 0, life: 0.4, fill: 1 }); R.burst(f.x, f.y, 16, [f.c, '#ffffff', '#ffe9a0'], 4, 0.6); break;
        case 'warn': R.fxs.push({ t: 'warn', x: f.x, y: f.y, r: f.r, age: 0, life: f.d }); break;
        case 'healring': R.fxs.push({ t: 'ring', x: f.x, y: f.y, c: '#7df09a', r: 1.6, age: 0, life: 0.5 }); for (let i = 0; i < 8; i++) part(f.x + G.rnd(-0.6, 0.6), f.y + G.rnd(-0.2, 0.4), 0, -1.2 - Math.random(), 0.8, '#9bffb0', 1, 0, 'plus'); break;
        case 'shield': R.fxs.push({ t: 'ring', x: f.x, y: f.y, c: '#8ab8ff', r: 1.1, age: 0, life: 0.6 }); break;
        case 'potion': R.burst(f.x, f.y, 6, ['#ff9db0', '#e0506a'], 1.2, 0.5, -1); break;
        case 'lvl': R.fxs.push({ t: 'pillar', x: f.x, y: f.y, c: '#ffe07a', age: 0, life: 0.9 }); R.fxs.push({ t: 'num', x: f.x, y: f.y - 1.3, s: 'NÍVEL +1', c: '#ffe07a', age: 0, life: 1.4, crit: 1 }); R.burst(f.x, f.y - 0.5, 14, ['#ffe07a', '#ffffff'], 2.5, 0.9, -1.5); break;
        case 'promo': R.fxs.push({ t: 'pillar', x: f.x, y: f.y, c: '#ff9ad0', age: 0, life: 1.4 }); R.burst(f.x, f.y - 0.5, 30, ['#ff9ad0', '#ffe07a', '#ffffff'], 4, 1.2, -1); break;
        case 'summon': R.fxs.push({ t: 'pillar', x: f.x, y: f.y, c: '#d070ff', age: 0, life: 1.2 }); R.burst(f.x, f.y - 0.5, 24, ['#d070ff', '#ffffff', '#8a5ae8'], 3.5, 1, -1); break;
        case 'coin': for (let i = 0; i < Math.min(5, 1 + Math.floor(Math.log10(1 + f.n))); i++) part(f.x + G.rnd(-0.2, 0.2), f.y, G.rnd(-1.2, 1.2), -2.5 - Math.random() * 1.5, 0.7, '#ffd35a', 2, 9, 'coin'); break;
        case 'death': R.burst(f.x, f.y - 0.4 * (f.size || 1), f.boss ? 50 : 10, G.MON[f.k] ? G.MON[f.k].pal : '#ffffff', f.boss ? 5 : 2.4, f.boss ? 1.2 : 0.5); R.fxs.push({ t: 'ring', x: f.x, y: f.y - 0.3, c: '#ffffff', r: (f.size || 1) * 0.9, age: 0, life: 0.25, fill: 1 }); break;
        case 'fall': R.fxs.push({ t: 'ring', x: f.x, y: f.y - 0.3, c: '#ff5050', r: 1.6, age: 0, life: 0.6 }); R.burst(f.x, f.y - 0.5, 14, ['#ff5050', '#3a2030'], 2.5, 0.8); break;
        case 'build': for (let i = 0; i < 26; i++) part(f.x + G.rnd(-3, 3), f.y + G.rnd(-0.5, 1.2), G.rnd(-0.8, 0.8), -0.6 - Math.random() * 1.5, 0.9 + Math.random() * 0.5, G.pick(['#e8dcc0', '#cbb890', '#ffffff']), 3, -0.5, 'puff'); R.burst(f.x, f.y - 2, 18, ['#ffe07a', '#ffffff'], 4, 1, 1); break;
        case 'sparks': R.burst(f.x, f.y, 14, ['#ffb040', '#ffe07a', '#ffffff'], 3, 0.6, 6); break;
        case 'shake': R.shake = Math.max(R.shake, f.n); break;
        case 'rarbeam': /* v23: feixe de luz sobre a Ferraria ao revelar uma peça rara */
          R.fxs.push({ t: 'rarbeam', x: f.x, y: f.y + 1.2, c: f.c, big: f.big, age: 0, life: f.big ? 3.4 : 2.4 });
          R.fxs.push({ t: 'ring', x: f.x, y: f.y + 1.2, c: f.c, r: f.big ? 6 : 3.5, age: 0, life: f.big ? 1 : 0.7, fill: 1 });
          if (f.big) R.fxs.push({ t: 'ring', x: f.x, y: f.y + 1.2, c: '#ffffff', r: 3.2, age: -0.18, life: 0.8 });
          R.burst(f.x, f.y + 0.8, f.big ? 64 : 30, [f.c, '#ffffff', '#ffe9a0'], f.big ? 5.5 : 4, 1.5, -2.4); break;
        default: if (R.fxMore) R.fxMore(f);
      }
    }
    q.length = 0;
  };

  /* ---------- quadro ---------- */
  const NIGHT = [10, 14, 44];
  let fontN = '', fontS = '';
  R.frame = (dt) => {
    if (!cw) return;
    const S = G.S, c = R.cam; R.t += dt;
    takeFx();
    /* câmera */
    if (R.follow) { const h = S.heroes.find((x) => x.id === R.follow); if (h && !h.inside) { R.tx = h.x * TS; R.ty = (h.y - 0.6) * TS; } else if (!h) R.follow = 0; }
    if (R.tx != null) { c.x += (R.tx - c.x) * Math.min(1, dt * 6); c.y += (R.ty - c.y) * Math.min(1, dt * 6); if (!R.follow && Math.abs(R.tx - c.x) < 0.5 && Math.abs(R.ty - c.y) < 0.5) R.tx = null; }
    const z = c.z, hw = cw / 2 / z, hh = ch / 2 / z;
    c.x = G.clamp(c.x, Math.min(hw, Wd.w * TS / 2), Math.max(Wd.w * TS - hw, Wd.w * TS / 2)); c.y = G.clamp(c.y, Math.min(hh, Wd.h * TS / 2), Math.max(Wd.h * TS - hh, Wd.h * TS / 2));
    let shx = 0, shy = 0; if (R.shake > 0.2) { shx = (Math.random() - 0.5) * R.shake * dpr; shy = (Math.random() - 0.5) * R.shake * dpr; R.shake *= Math.pow(0.02, dt); } else R.shake = 0;
    const ox = Math.round(cw / 2 - c.x * z + shx), oy = Math.round(ch / 2 - c.y * z + shy);
    const X = (wx) => ox + wx * TS * z, Y = (wy) => oy + wy * TS * z;
    const vx0 = (-ox / z) / TS - 3, vx1 = ((cw - ox) / z) / TS + 3, vy0 = (-oy / z) / TS - 1, vy1 = ((ch - oy) / z) / TS + 5;
    const dark = G.darkness(S.clock);

    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
    if (ox > 0 || oy > 0 || ox + terrain.width * z < cw || oy + terrain.height * z < ch) { ctx.fillStyle = '#1c3a1c'; ctx.fillRect(0, 0, cw, ch); }   // v26 (4C.3): o terreno quase sempre cobre a tela
    { /* v26 (4C.3): só o pedaço do terreno que aparece (mesmos pixels; antes o mapa inteiro era esticado a cada quadro) */
      const sx0 = Math.max(0, Math.floor(-ox / z)), sy0 = Math.max(0, Math.floor(-oy / z)), sx1 = Math.min(terrain.width, Math.ceil((cw - ox) / z)), sy1 = Math.min(terrain.height, Math.ceil((ch - oy) / z));
      if (sx1 > sx0 && sy1 > sy0) ctx.drawImage(terrain, sx0, sy0, sx1 - sx0, sy1 - sy0, ox + sx0 * z, oy + sy0 * z, (sx1 - sx0) * z, (sy1 - sy0) * z);
    }

    /* água, lava: brilho animado */
    if (!S.opts.lowFx) for (const w of water) {
      if (w.x < vx0 || w.x > vx1 || w.y < vy0 || w.y > vy1) continue;
      const ph = R.t * (w.t === T.LAVA ? 0.8 : 1.4) + w.h * 0.01;
      const px = X(w.x) + ((Math.sin(ph) * 5 + 8) | 0) * z, py = Y(w.y) + ((w.h % 12) + 2) * z;
      ctx.fillStyle = w.t === T.LAVA ? 'rgba(255,230,140,.75)' : w.t === T.POOL ? 'rgba(170,220,200,.35)' : 'rgba(220,245,255,.55)';
      ctx.fillRect(px, py, 4 * z, z); if (w.h % 3 === 0) ctx.fillRect(px - 5 * z, py + 5 * z, 2 * z, z);
    }
    if (R.groundMore) R.groundMore(X, Y, z, vx0, vx1, vy0, vy1);      // v27 (B1): canteiros (estágio real de cada um)
    /* marcas no chão: alertas de chefe, seleção */
    for (const f of R.fxs) if (f.t === 'warn') { const k = f.age / f.life; ctx.fillStyle = 'rgba(255,60,60,' + (0.12 + 0.2 * k) + ')'; ctx.beginPath(); ctx.ellipse(X(f.x), Y(f.y), f.r * TS * z, f.r * TS * z * 0.6, 0, 0, 6.283); ctx.fill(); ctx.strokeStyle = 'rgba(255,90,90,.9)'; ctx.lineWidth = Math.max(1, z * 0.7); ctx.beginPath(); ctx.ellipse(X(f.x), Y(f.y), f.r * TS * z * k, f.r * TS * z * 0.6 * k, 0, 0, 6.283); ctx.stroke(); }
    if (R.sel && R.sel.ref && !R.sel.ref.dead) { const e = R.sel.ref; ctx.strokeStyle = 'rgba(255,224,122,.95)'; ctx.lineWidth = Math.max(1.5, z * 0.6); ctx.beginPath(); ctx.ellipse(X(e.x), Y(e.y), (e.size || 1) * 9 * z, (e.size || 1) * 4.5 * z, 0, 0, 6.283); ctx.stroke(); }

    if (R.mark) { const k = 0.5 + 0.5 * Math.sin(R.t * 6); ctx.strokeStyle = 'rgba(255,224,122,' + (0.55 + 0.4 * k) + ')'; ctx.lineWidth = Math.max(2, z); ctx.beginPath(); ctx.ellipse(X(R.mark.x), Y(R.mark.y - 0.2), (17 + 3 * k) * z, (8 + 1.5 * k) * z, 0, 0, 6.283); ctx.stroke(); ctx.fillStyle = 'rgba(255,224,122,' + (0.1 + 0.1 * k) + ')'; ctx.fill(); }
    /* ---- lista ordenada ---- */
    const dyn = [];
    for (const id of G.BLD_IDS) { const p = Wd.plots[id]; if (p.x + 7 < vx0 || p.x - 1 > vx1 || p.y + 5 < vy0 || p.y - 5 > vy1) continue; if (!G.bAvailable(id)) continue; dyn.push({ y: p.y + 4, k: 'b', id }); }
    for (const h of S.heroes) if (!h.inside && h.x > vx0 && h.x < vx1 && h.y > vy0 && h.y < vy1 + 1) dyn.push({ y: h.y, k: 'h', e: h });
    for (const n of G.npcs) if (!n.inside && n.x > vx0 && n.x < vx1 && n.y > vy0 && n.y < vy1) dyn.push({ y: n.y, k: 'n', e: n });
    if (G.guards) for (const n of G.guards) if (n.x > vx0 && n.x < vx1 && n.y > vy0 && n.y < vy1) dyn.push({ y: n.y, k: 'n', e: n });
    for (const m of G.mons) if (!m.dead && !m.nodraw && m.x > vx0 && m.x < vx1 && m.y > vy0 && m.y < vy1 + 2) dyn.push({ y: m.y, k: 'm', e: m });
    if (R.dynMore) R.dynMore(dyn, vx0, vx1, vy0, vy1);
    dyn.sort((a, b) => a.y - b.y);
    const st = R.statics; let si = 0; while (si < st.length && st[si].y < vy0) si++;
    let di = 0;
    const over = [];
    for (;;) {
      const s = si < st.length && st[si].y <= vy1 + 3 ? st[si] : null, d = di < dyn.length ? dyn[di] : null;
      if (!s && !d) break;
      if (s && (!d || s.y <= d.y)) { si++; if (s.x > vx0 - 2 && s.x < vx1 + 2) drawStatic(s, X, Y, z, dark); }
      else { di++; if (d.k === 'b') drawBuilding(d.id, X, Y, z, over); else if (d.k === 'm') drawMon(d.e, X, Y, z, over); else if (d.k === 'x') d.f(d.e, X, Y, z, over, dt); else drawChar(d.e, d.k === 'h', X, Y, z, over, dt); }
    }

    /* partículas */
    for (let i = R.parts.length - 1; i >= 0; i--) {
      const p = R.parts[i]; p.life -= dt; if (p.life <= 0) { R.parts[i] = R.parts[R.parts.length - 1]; R.parts.pop(); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      const a = Math.min(1, p.life / p.max * 1.6), px = X(p.x), py = Y(p.y);
      if (p.kind === 'puff') { ctx.globalAlpha = a * 0.55; ctx.fillStyle = p.c; const r = (p.size + (1 - p.life / p.max) * 4) * z; ctx.fillRect(Math.round(px - r / 2), Math.round(py - r / 2), Math.round(r), Math.round(r)); }
      else if (p.kind === 'coin') { ctx.globalAlpha = 1; ctx.fillStyle = '#7a4a10'; ctx.fillRect(Math.round(px - z * 1.5), Math.round(py - z * 1.5), 3 * z, 3 * z); ctx.fillStyle = '#ffd35a'; ctx.fillRect(Math.round(px - z), Math.round(py - z), 2 * z, 2 * z); ctx.fillStyle = '#fff3b0'; ctx.fillRect(Math.round(px - z), Math.round(py - z), z, z); }
      else if (p.kind === 'plus') { ctx.globalAlpha = a; ctx.fillStyle = p.c; ctx.fillRect(Math.round(px - z * 1.5), Math.round(py - z * 0.5), 3 * z, z); ctx.fillRect(Math.round(px - z * 0.5), Math.round(py - z * 1.5), z, 3 * z); }
      else if (p.kind === 'glow') { ctx.globalAlpha = a * 0.9; ctx.fillStyle = p.c; ctx.fillRect(Math.round(px), Math.round(py), p.size * z, p.size * z); ctx.globalAlpha = a * 0.25; ctx.fillRect(Math.round(px - z), Math.round(py - z), (p.size + 2) * z, (p.size + 2) * z); }
      else { ctx.globalAlpha = a; ctx.fillStyle = p.c; ctx.fillRect(Math.round(px), Math.round(py), p.size * z, p.size * z); }
    }
    ctx.globalAlpha = 1;
    ambient(dt, vx0, vx1, vy0, vy1, dark);

    /* efeitos por cima */
    fontN = '800 ' + Math.round(G.clamp(z * 3.3, 12 * dpr, 16 * dpr)) + 'px "Aurora Manrope",system-ui,sans-serif';
    fontS = '700 ' + Math.round(G.clamp(z * 2.6, 10.5 * dpr, 13 * dpr)) + 'px "Aurora Manrope",system-ui,sans-serif';
    for (let i = R.fxs.length - 1; i >= 0; i--) {
      const f = R.fxs[i]; f.age += dt; if (f.age >= f.life) { R.fxs.splice(i, 1); continue; } if (f.age < 0) continue;
      const k = f.age / f.life, px = X(f.x), py = Y(f.y);
      if (f.t === 'slash') { ctx.strokeStyle = f.c; ctx.globalAlpha = 1 - k; ctx.lineWidth = (f.big ? 3 : 2) * z; ctx.lineCap = 'round'; ctx.beginPath(); const r = (f.big ? 14 : 9) * z; ctx.arc(px - f.dir * r * 0.3, py, r, f.dir > 0 ? -1.1 + k : Math.PI - 1.1 + k * -1 + 2.2, f.dir > 0 ? 1.1 + k : Math.PI + 1.1, false); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = z; ctx.stroke(); ctx.globalAlpha = 1; }
      else if (f.t === 'ring') { const r = f.r * TS * z * (0.3 + 0.7 * k); ctx.globalAlpha = (1 - k) * 0.9; if (f.fill) { ctx.fillStyle = f.c; ctx.globalAlpha = (1 - k) * 0.35; ctx.beginPath(); ctx.ellipse(px, py, r, r * 0.62, 0, 0, 6.283); ctx.fill(); ctx.globalAlpha = (1 - k) * 0.9; } ctx.strokeStyle = f.c; ctx.lineWidth = Math.max(1, 2 * z * (1 - k)); ctx.beginPath(); ctx.ellipse(px, py, r, r * 0.62, 0, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1; }
      else if (f.t === 'proj') { const x = X(f.x + (f.tx - f.x) * k), y = Y(f.y + (f.ty - f.y) * k) - Math.sin(k * Math.PI) * 4 * z; if (f.k === 'arrow') { const a = Math.atan2(f.ty - f.y, f.tx - f.x); ctx.strokeStyle = '#6a4a2c'; ctx.lineWidth = z; ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * 5 * z, y - Math.sin(a) * 5 * z); ctx.lineTo(x, y); ctx.stroke(); ctx.fillStyle = f.c; ctx.fillRect(Math.round(x - z), Math.round(y - z), 2 * z, 2 * z); } else { ctx.fillStyle = f.c; ctx.globalAlpha = 0.35; ctx.fillRect(Math.round(x - 3 * z), Math.round(y - 3 * z), 6 * z, 6 * z); ctx.globalAlpha = 1; ctx.fillRect(Math.round(x - 2 * z), Math.round(y - 2 * z), 4 * z, 4 * z); ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(x - z), Math.round(y - z), 2 * z, 2 * z); if (Math.random() < 0.6) part(f.x + (f.tx - f.x) * k, f.y + (f.ty - f.y) * k, 0, 0, 0.25, f.c, 1, 0); } }
      else if (f.t === 'pillar') { const w = 14 * z * (1 - k * 0.5); const g = ctx.createLinearGradient(0, py - 60 * z, 0, py); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, f.c); ctx.globalAlpha = (1 - k) * 0.8; ctx.fillStyle = g; ctx.fillRect(px - w / 2, py - 60 * z, w, 60 * z); ctx.globalAlpha = 1; }
      else if (f.t === 'rarbeam') {
        const rise = Math.min(1, f.age / 0.3), fade = k > 0.55 ? (1 - k) / 0.45 : 1, bh = (f.big ? 260 : 170) * z * (1 - Math.pow(1 - rise, 3)), bw = (f.big ? 44 : 30) * z * (1 - 0.3 * k), pulse = 0.85 + 0.15 * Math.sin(R.t * 18);
        ctx.save();
        ctx.globalAlpha = 0.55 * fade; ctx.fillStyle = f.c; ctx.beginPath(); ctx.ellipse(px, py, bw * 1.4, bw * 0.46, 0, 0, 6.283); ctx.fill();
        let g = ctx.createLinearGradient(0, py - bh, 0, py); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, f.c);
        ctx.globalAlpha = 0.85 * fade * pulse; ctx.fillStyle = g; ctx.fillRect(px - bw / 2, py - bh, bw, bh);
        g = ctx.createLinearGradient(0, py - bh, 0, py); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, '#ffffff');
        ctx.globalAlpha = 0.95 * fade; ctx.fillStyle = g; ctx.fillRect(px - bw * 0.2, py - bh, bw * 0.4, bh);
        if (f.big) { ctx.translate(px, py - 3 * z); ctx.scale(1, 0.5); ctx.rotate(R.t * 0.9); ctx.globalAlpha = 0.4 * fade; ctx.fillStyle = f.c; const rr = 52 * z * (0.7 + 0.3 * Math.sin(R.t * 5)); for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(rr, -4 * z); ctx.lineTo(rr, 4 * z); ctx.fill(); } }
        ctx.restore();
        if (Math.random() < (f.big ? 0.9 : 0.5)) part(f.x + G.rnd(-0.6, 0.6), f.y - G.rnd(0, 6), G.rnd(-0.2, 0.2), -2 - Math.random() * 2, 1, G.pick([f.c, '#ffffff']), 1, 0, 'glow');
      }
      else if (f.t === 'num') { ctx.font = f.small ? fontS : fontN; ctx.textAlign = 'center'; const sc = f.crit ? 1 + Math.max(0, 0.35 - f.age) * 2.2 : 1 + Math.max(0, 0.12 - f.age) * 2; const yy = py - (k * 14 + (f.crit ? 4 : 0)) * z; ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; ctx.save(); ctx.translate(px, yy); ctx.scale(sc, sc); ctx.lineWidth = Math.max(2, dpr * 2.5); ctx.strokeStyle = 'rgba(20,14,30,.9)'; ctx.lineJoin = 'round'; ctx.strokeText(f.s, 0, 0); ctx.fillStyle = f.c; ctx.fillText(f.s, 0, 0); ctx.restore(); ctx.globalAlpha = 1; }
    }
    /* barras, nomes e balões */
    for (const o of over) o();

    /* sombras de nuvens, tom do entardecer e noite */
    if (dark < 0.5 && !S.opts.lowFx) { ctx.fillStyle = 'rgba(10,20,50,' + 0.07 * (1 - dark * 2) + ')'; for (const cl of R.clouds) { cl.x += cl.v * dt; if (cl.x - cl.r > Wd.w) cl.x = -cl.r; ctx.beginPath(); ctx.ellipse(X(cl.x), Y(cl.y), cl.r * TS * z, cl.r * TS * z * 0.5, 0, 0, 6.283); ctx.fill(); } }
    const hr = S.clock / 60, dusk = Math.max(0, 1 - Math.abs(hr - 19) / 1.6, 1 - Math.abs(hr - 5.6) / 1.4);
    if (dusk > 0) { ctx.fillStyle = 'rgba(255,120,50,' + 0.16 * dusk + ')'; ctx.fillRect(0, 0, cw, ch); }
    if (S.ev.redMoon > S.t && dark > 0.2) { ctx.fillStyle = 'rgba(200,20,40,' + 0.12 * dark + ')'; ctx.fillRect(0, 0, cw, ch); }
    if (dark > 0.02) night(dark, X, Y, z, vx0, vx1, vy0, vy1);
    if (S.mare.active) { const a = 0.1 + 0.06 * Math.sin(R.t * 4); const g = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.max(cw, ch) * 0.7); g.addColorStop(0, 'rgba(160,40,200,0)'); g.addColorStop(1, 'rgba(160,40,200,' + a * 2.4 + ')'); ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch); }
    S.cam = { x: c.x, y: c.y };
    /* zona sob a câmera (para o HUD) */
    const zi = Wd.zoneAt(c.x / TS, c.y / TS); if (zi !== R.zone) { R.zone = zi; G.emit('camzone', zi); }
  };

  /* ---------- desenhistas ---------- */
  const drawStatic = (s, X, Y, z, dark) => {
    if (s.wt) return R.drawWorkTree(s, X, Y, z, dark);      // v27 (B1): árvores de corte e rochas do filão têm estado próprio (54-vida-art)
    if (s.wr) return R.drawWorkRock(s, X, Y, z);
    const sp = s.s, dx = Math.round(X(s.x) - (sp.w / 2) * z), dy = Math.round(Y(s.y) - sp.h * z);
    if (s.kind === 'portal') {
      const cx = X(s.x), cy = Y(s.y) - 30 * z, t = R.t;
      for (let i = 5; i >= 0; i--) { const k = i / 5; ctx.fillStyle = ['#2a104a', '#4a1c8a', '#7a34c8', '#a85af0', '#d090ff', '#ffffff'][5 - i]; ctx.globalAlpha = i === 0 ? 0.9 : 0.85; ctx.beginPath(); ctx.ellipse(cx + Math.cos(t * 1.7 + i) * z * 1.5 * k, cy + Math.sin(t * 1.3 + i * 2) * z * 1.5 * k, (3 + 12 * k) * z, (4 + 17 * k) * z, 0, 0, 6.283); ctx.fill(); }
      ctx.globalAlpha = 1;
      if (Math.random() < 0.3) part(s.x + G.rnd(-0.8, 0.8), s.y - G.rnd(0.6, 3), G.rnd(-0.2, 0.2), -0.8, 1, G.pick(['#d090ff', '#ffffff', '#a85af0']), 1, 0, 'glow');
    }
    ctx.drawImage(sp.cv, dx, dy, sp.w * z, sp.h * z);
    if (s.kind === 'fountain') { for (let i = 0; i < 2; i++) if (Math.random() < 0.5) part(s.x + G.rnd(-0.15, 0.15), s.y - 2.2, G.rnd(-0.9, 0.9), -1.8, 0.7, G.pick(['#bfe6ff', '#ffffff', '#7ac4f4']), 1, 7); }
    if (s.kind === 'house' && s.smoke && Math.random() < 0.04) part(s.x - 2.6 + (s.smoke.x + 3) / 16, s.y - s.s.h / 16 + s.smoke.y / 16, 0.15, -0.5, 2.2, '#e8e4dc', 2, -0.05, 'puff');
    if (s.kind === 'crystal' || s.kind === 'riftshard') { if (Math.random() < 0.02) part(s.x + G.rnd(-0.3, 0.3), s.y - G.rnd(0.4, 1.4), 0, -0.4, 1, '#e6c0ff', 1, 0, 'glow'); }
    if (dark > 0.3 && s.lights && !G.S.opts.lowFx) { ctx.fillStyle = 'rgba(255,214,120,' + Math.min(1, dark * 1.2) + ')'; for (const l of s.lights) ctx.fillRect(dx + l.x * z, dy + l.y * z, l.w * z, l.h * z); }
  };
  const drawBuilding = (id, X, Y, z, over) => {
    const S = G.S, p = Wd.plots[id], b = S.b[id], lvl = b ? b.lvl : 0;
    const sp = A.building(id, lvl, b && b.dmg);
    const dx = Math.round(X(p.x) - 4 * z), dy = Math.round(Y(p.y + 4) - (sp.h - 4) * z);
    ctx.drawImage(sp.cv, dx, dy, sp.w * z, sp.h * z);
    if (lvl > 0 && sp.smoke && !(b && b.dmg) && Math.random() < 0.08) part(p.x - 0.25 + sp.smoke.x / 16, p.y + 4 - (sp.h - 4 - sp.smoke.y) / 16, 0.2, -0.55, 2.4, '#ece8e0', 2, -0.05, 'puff');
    if (id === 'ferraria' && lvl > 0 && Math.random() < 0.03) part(p.x + 3 + G.rnd(-1, 1), p.y + 4.3, G.rnd(-1, 1), -2, 0.4, '#ffb040', 1, 6);
    if (R.bldWork) R.bldWork(id, lvl, p, sp, X, Y, z);      // v27 (B1): o prédio mostra que está trabalhando (faíscas, fumaça, bolhas)
    const dark = G.darkness(S.clock);
    if (dark > 0.3 && lvl > 0 && !S.opts.lowFx) { for (const l of sp.lights) { ctx.fillStyle = l.lamp ? 'rgba(255,230,150,' + dark + ')' : 'rgba(255,208,110,' + Math.min(1, dark * 1.1) + ')'; ctx.fillRect(dx + l.x * z, dy + l.y * z, l.w * z, l.h * z); } }
    over.push(() => {
      const d = G.BLD[id], cx = X(p.x + 3), ty = dy - 3 * z;
      let label = lvl > 0 ? d.short + ' ' + lvl : d.short, col = '#fff7e0', bg = 'rgba(16,20,34,.78)';
      let mark = null;
      if (lvl === 0) { label = 'Construir ' + d.short; col = '#ffe07a'; mark = upOk(id) ? '+' : null; }
      else if (b.dmg) { label = d.short + ' danificada'; col = '#ff9a9a'; mark = '!'; }
      else if (upOk(id)) mark = '▲';
      if (id === 'taverna' && lvl > 0 && S.res.refeicao < 1) { mark = '!'; col = '#ff9a9a'; label = 'Taverna sem comida'; }
      if (id === 'alquimista' && lvl > 0 && S.res.pocao < 1) { mark = '!'; col = '#ff9a9a'; label = 'Sem poções'; }
      ctx.font = fontS; ctx.textAlign = 'center'; const lw = tw(label), ph = Math.round(parseInt(fontS.split(' ')[1]) * 1.55), pw = lw + ph * 0.9;
      const lx = Math.round(cx - pw / 2), ly = Math.round(ty - ph);
      ctx.fillStyle = bg; rr(lx, ly, pw, ph, ph / 2); ctx.fill();
      ctx.fillStyle = col; ctx.textBaseline = 'middle'; ctx.fillText(label, cx, ly + ph / 2 + 1); ctx.textBaseline = 'alphabetic';
      if (mark) { const bob = Math.sin(R.t * 4) * 2 * dpr; const r = ph * 0.52; ctx.fillStyle = mark === '!' ? '#e85a5a' : '#58c070'; ctx.beginPath(); ctx.arc(lx + pw + r * 0.6, ly + ph / 2 + bob, r, 0, 6.283); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.textBaseline = 'middle'; ctx.fillText(mark, lx + pw + r * 0.6, ly + ph / 2 + bob + 1); ctx.textBaseline = 'alphabetic'; }
    });
  };
  const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath(); };
  const shadow = (px, py, r, z) => { ctx.fillStyle = 'rgba(10,16,30,.28)'; ctx.beginPath(); ctx.ellipse(px, py, r * z, r * 0.42 * z, 0, 0, 6.283); ctx.fill(); };
  const bar = (px, py, w, frac, col, z) => { const h = Math.max(2, Math.round(z * 1.2)), x = Math.round(px - w / 2); ctx.fillStyle = 'rgba(16,12,24,.85)'; ctx.fillRect(x - 1, py - 1, w + 2, h + 2); ctx.fillStyle = col; ctx.fillRect(x, py, Math.round(w * G.clamp(frac, 0, 1)), h); };
  const bubble = (px, py, text) => { ctx.font = fontS; ctx.textAlign = 'center'; const fs = parseInt(fontS.split(' ')[1]); const tw = ctx.measureText(text).width, w = tw + fs * 1.2, h = fs * 1.8; const x = Math.round(G.clamp(px - w / 2, 4, cw - w - 4)), y = Math.round(py - h); ctx.fillStyle = 'rgba(255,252,240,.96)'; rr(x, y, w, h, fs * 0.6); ctx.fill(); ctx.beginPath(); ctx.moveTo(px - fs * 0.4, y + h - 1); ctx.lineTo(px, y + h + fs * 0.45); ctx.lineTo(px + fs * 0.4, y + h - 1); ctx.fill(); ctx.fillStyle = '#2a2030'; ctx.textBaseline = 'middle'; ctx.fillText(text, x + w / 2, y + h / 2 + 1); ctx.textBaseline = 'alphabetic'; };

  const drawChar = (e, isHero, X, Y, z, over, dt) => {
    if (!isHero && e._wk && R.npcDraw && R.npcDraw(e, X, Y, z, over)) return;      // v27 (B1): equipe de campo em serviço (ferramentas, cargas, poses de trabalho)
    const S = G.S, px = Math.round(X(e.x)), py = Math.round(Y(e.y) + (e._sit ? 2.4 * z : 0));   // v26: sentado numa cena da cidade (3G) desce um pouco
    if (e._ph == null) e._ph = (G.hash(e.name || e.id) % 100) / 25;
    const look = isHero ? (e._look && e._lk === e._dirtyKey ? e._look : (e._lk = e._dirtyKey = gearKey(e), e._look = A.heroLook(e))) : (e._look && e._lc === (e.carry || '') ? e._look : (e._lc = e.carry || '', e._look = A.npcLook(e)));
    const sheet = A.charSheet(look);
    const fallen = isHero && (e.state === 'fallen');
    const rec = isHero && e.state === 'recover';
    if (rec) { over.push(() => { ctx.font = fontS; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(16,20,34,.7)'; const t = e.name + ' · recuperando'; const w = ctx.measureText(t).width + 10 * dpr; rr(px - w / 2, py - 16 * z, w, 5.5 * z, 3 * z); ctx.fill(); ctx.fillStyle = '#ffb0b0'; ctx.fillText(t, px, py - 12 * z); }); return; }
    const fr = fallen ? 'idle0' : A.charFrame(e, R.t);
    const sxp = sheet.idx[fr] * 26;
    /* v20: fora das muralhas o herói cavalga; a montaria é desenhada por baixo e ele sobe alguns pixels */
    let lift = 0, mSheet = null;
    if (isHero && e.mount && !fallen && !Wd.inTown(e.x, e.y)) { const mt = G.mountOf(e); mSheet = mt ? A.mountSheet(mt.k) : null; if (mSheet) lift = 8 * z; }
    shadow(px, py, mSheet ? 9 : 6.5, z);
    ctx.save(); ctx.translate(px, py);
    if (fallen) { ctx.rotate(-1.5708 * (e.dir || 1)); ctx.translate(0, -3 * z); ctx.globalAlpha = 0.85; }
    if (e.dir < 0) ctx.scale(-1, 1);
    if (isHero && e.rank >= 4 && !fallen && !S.opts.lowFx) { ctx.globalAlpha = 0.25 + 0.1 * Math.sin(R.t * 3 + e._ph); ctx.fillStyle = G.RANK_COLOR[e.rank]; ctx.beginPath(); ctx.ellipse(0, -12 * z, 11 * z, 14 * z, 0, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1; }
    if (mSheet) ctx.drawImage(mSheet, (e.moving ? Math.floor(R.t * 8 + e._ph) % 2 : 0) * 30, 0, 30, 22, -15 * z, -20 * z, 30 * z, 22 * z);
    if (isHero && e.cos && e.cos.asas && !fallen && A.wingSheet) { const ws = A.wingSheet(e.cos.asas); if (ws) ctx.drawImage(ws, (Math.floor(R.t * (e.moving ? 7 : 2.5) + e._ph) % 2) * 30, 0, 30, 22, -19 * z, -24 * z - lift, 30 * z, 22 * z); }
    ctx.drawImage(sheet.cv, sxp, 0, 26, 30, -13 * z, -27 * z - lift, 26 * z, 30 * z);
    if (e.flash > 0) { ctx.globalAlpha = 0.75; ctx.drawImage(A.flashOf(sheet.cv), sxp, 0, 26, 30, -13 * z, -27 * z - lift, 26 * z, 30 * z); ctx.globalAlpha = 1; }
    ctx.restore();
    if (isHero) {
      const st = G.heroStats(e);
      if (e.buff && e.buff.wall > S.t) { ctx.strokeStyle = 'rgba(138,184,255,.8)'; ctx.lineWidth = z; ctx.beginPath(); ctx.ellipse(px, py - 12 * z, 11 * z, 14 * z, 0, 0, 6.283); ctx.stroke(); }
      over.push(() => {
        const top = py - 29 * z - lift;
        ctx.font = fontS; ctx.textAlign = 'center';
        const nm = e.name; ctx.lineWidth = Math.max(2, dpr * 2.2); ctx.strokeStyle = 'rgba(16,12,24,.9)'; ctx.lineJoin = 'round'; ctx.strokeText(nm, px, top - 2 * z); ctx.fillStyle = fallen ? '#ff8a8a' : G.RANK_COLOR[e.rank]; ctx.fillText(nm, px, top - 2 * z);
        if (!fallen && (e.hp < st.hp * 0.98 || e.state === 'hunt' || e.state === 'defend' || e.state === 'rift' || e.state === 'inc' || e.state === 'colosso')) { const f = e.hp / st.hp; bar(px, top, 14 * z, f, f > 0.5 ? '#5ad06a' : f > 0.25 ? '#e8b84a' : '#e85a5a', z); }
        if (fallen) { ctx.fillStyle = '#ff5050'; ctx.fillText('caído', px, top + 4 * z); }
        if (e.sayT > 0 && e.say) bubble(px, top - 7 * z, e.say);
      });
      if (e.state === 'flee' && Math.random() < 0.3) part(e.x, e.y - 0.1, -e.dir * 0.5, -0.3, 0.4, '#e8dcc0', 2, 0, 'puff');
    } else {
      if (e.sayT > 0 && e.say) over.push(() => bubble(px, py - 30 * z, e.say));
      if (R.sel && R.sel.ref === e) over.push(() => { ctx.font = fontS; ctx.textAlign = 'center'; ctx.lineWidth = Math.max(2, dpr * 2.2); ctx.strokeStyle = 'rgba(16,12,24,.9)'; ctx.strokeText(e.name + ' · ' + e.job, px, py - 30 * z); ctx.fillStyle = '#fff7e0'; ctx.fillText(e.name + ' · ' + e.job, px, py - 30 * z); });
    }
    void dt;
  };
  const gearKey = (h) => (h.gear.arma ? h.gear.arma.tier : 0) + '|' + (h.gear.armadura ? h.gear.armadura.tier : 0) + '|' + h.rank + '|' + ((h.cos && h.cos.traje) || '');
  const drawMon = (m, X, Y, z, over) => {
    const d = G.MON[m.k], sp = A.monSheet(m.k, m.elite), sc = (m.size / (d.size || 1)) * (d.boss ? 1 : 1) * (d.boss ? m.size / 2.2 * 1.5 : d.size || 1);
    const zz = z * (d.boss ? 1.6 : (d.size || 1) > 1.2 ? 1.15 : 1) * (m.elite ? 1.2 : 1);
    const px = Math.round(X(m.x)), py = Math.round(Y(m.y)), f = Math.floor(R.t * (m.state === 'chase' || m.state === 'march' ? 8 : 4) + m.id) % 4;
    const fly = d.fly ? (4 + Math.sin(R.t * 3 + m.id) * 1.5) * z : 0;
    const lunge = m.swing > 0 ? m.dir * Math.sin((m.swing / 0.25) * Math.PI) * 4 * z : 0;
    shadow(px, py, sp.w * 0.3 * (zz / z), z);
    ctx.save(); ctx.translate(px + lunge, py - fly); if (m.dir < 0) ctx.scale(-1, 1);
    if (m.boss) { ctx.globalAlpha = 0.22 + 0.08 * Math.sin(R.t * 4); ctx.fillStyle = d.pal[2]; ctx.beginPath(); ctx.ellipse(0, -sp.h * zz * 0.45, sp.w * zz * 0.6, sp.h * zz * 0.55, 0, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.drawImage(sp.cv, f * sp.w, 0, sp.w, sp.h, Math.round(-sp.w / 2 * zz), Math.round(-(sp.h - 2) * zz), Math.round(sp.w * zz), Math.round(sp.h * zz));
    if (m.flash > 0) { ctx.globalAlpha = 0.8; ctx.drawImage(A.flashOf(sp.cv), f * sp.w, 0, sp.w, sp.h, Math.round(-sp.w / 2 * zz), Math.round(-(sp.h - 2) * zz), Math.round(sp.w * zz), Math.round(sp.h * zz)); ctx.globalAlpha = 1; }
    ctx.restore();
    if (m.weak > G.S.t && R.weakMark) R.weakMark(m, px, py - fly, zz, sp);
    if (m.hp < m.hpMax || m.elite || m.boss) over.push(() => {
      const top = py - fly - (sp.h + 2) * zz;
      if (m.hp < m.hpMax) bar(px, top + 1 * z, (m.boss ? 30 : 13) * z, m.hp / m.hpMax, m.boss ? '#d070ff' : m.elite ? '#ffd35a' : '#e85a5a', z);
      if (m.boss || m.elite || (R.sel && R.sel.ref === m)) { ctx.font = fontS; ctx.textAlign = 'center'; const t = (m.alfa ? 'Alfa · ' : m.elite ? 'Elite · ' : '') + d.name + ' Nv ' + m.lvl; ctx.lineWidth = Math.max(2, dpr * 2.2); ctx.strokeStyle = 'rgba(16,12,24,.9)'; ctx.lineJoin = 'round'; ctx.strokeText(t, px, top - 1.5 * z); ctx.fillStyle = m.boss ? '#e6b0ff' : '#ffd35a'; ctx.fillText(t, px, top - 1.5 * z); }
    });
    void sc;
  };

  /* ---------- ambiente por bioma ---------- */
  const ambient = (dt, vx0, vx1, vy0, vy1, dark) => {
    if (G.S.opts.lowFx) return;
    const n = 3;
    for (let i = 0; i < n; i++) {
      const x = G.rnd(vx0 + 2, vx1 - 2), y = G.rnd(vy0, vy1 - 3); if (x < 0 || y < 0 || x >= Wd.w || y >= Wd.h) continue;
      const t = Wd.tile[(y | 0) * Wd.w + (x | 0)];
      if (t === T.SNOW || t === T.ICE) part(x, y - 4, G.rnd(-0.3, 0.1), 1.6, 2.6, '#ffffff', Math.random() < 0.3 ? 2 : 1, 0);
      else if (t === T.ASH || t === T.LAVA) { if (Math.random() < 0.7) part(x, y, G.rnd(-0.2, 0.2), -0.9, 2, G.pick(['#ff8a3a', '#ffd070', '#ff5a2a']), 1, 0, 'glow'); }
      else if (t === T.WASTE || t === T.CRATER) { if (Math.random() < 0.5) part(x, y, G.rnd(-0.2, 0.2), -0.5, 2.2, G.pick(['#d070ff', '#a85af0']), 1, 0, 'glow'); }
      else if (t === T.SWAMP || t === T.POOL) { if (Math.random() < 0.35) part(x, y, 0.25, -0.05, 3, 'rgba(210,235,225,0.5)', 5, 0, 'puff'); }
      else if ((t === T.GRASS || t === T.FOREST || t === T.GARDEN || t === T.MATA) && dark > 0.6) { if (Math.random() < 0.3) part(x, y, G.rnd(-0.3, 0.3), G.rnd(-0.3, 0.1), 2.4, '#e8ff9a', 1, 0, 'glow'); }
      else if ((t === T.FOREST || t === T.MATA) && dark < 0.3 && Math.random() < 0.12) part(x, y - 3, 0.6, 0.9, 3, G.pick(['#8ac85a', '#c8d85a']), 1, 0);
      else if ((t === T.GRASS || t === T.GARDEN) && dark < 0.2 && Math.random() < 0.05) part(x, y, G.rnd(-0.6, 0.6), G.rnd(-0.4, 0.2), 3, G.pick(['#ffffff', '#ffd84a', '#f8a0c8']), 1, 0);
    }
  };

  /* ---------- noite ---------- */
  const nightBlit = () => { ctx.imageSmoothingEnabled = true; ctx.drawImage(lcv, 0, 0, lcv.width, lcv.height, 0, 0, cw, ch); ctx.imageSmoothingEnabled = false; };
  let nightN = 0, nightKey = '';
  const night = (dark, X, Y, z, vx0, vx1, vy0, vy1) => {
    const S = G.S, lw = lcv.width, lh = lcv.height, k = 0.25;
    if (S.opts.lowFx) { ctx.fillStyle = 'rgba(' + NIGHT[0] + ',' + NIGHT[1] + ',' + NIGHT[2] + ',' + 0.5 * dark + ')'; ctx.fillRect(0, 0, cw, ch); return; }   // v26 (4C.3): Modo leve = noite lisa, sem mapa de luz
    /* v26 (4C.3): com a câmera parada o mapa de luz (dezenas de figurinhas) só é refeito a cada 2 quadros (4 no Modo leve); lcv guarda o último */
    const key = X(0) + '|' + Y(0) + '|' + z + '|' + Math.round(dark * 40) + '|' + lw + '|' + R.fxs.length;
    const redo = !(key === nightKey && (nightN++ % (S.opts.lowFx ? 4 : 2)) !== 0);
    if (redo) {
    nightKey = key; nightN = 1;
    lctx.globalCompositeOperation = 'source-over'; lctx.clearRect(0, 0, lw, lh);
    lctx.fillStyle = 'rgba(' + NIGHT[0] + ',' + NIGHT[1] + ',' + NIGHT[2] + ',' + 0.66 * dark + ')'; lctx.fillRect(0, 0, lw, lh);
    lctx.globalCompositeOperation = 'destination-out';
    const hole = (wx, wy, r, a) => { if (wx < vx0 - r || wx > vx1 + r || wy < vy0 - r || wy > vy1 + r) return; const x = X(wx) * k, y = Y(wy) * k, rad = Math.max(2, Math.round(r * TS * z * k)); lctx.drawImage(lightSprite(rad, a || 0.9), x - rad, y - rad); };
    for (const l of Wd.lamps) hole(l.x, l.y - 1.4, 3.6, 0.95);
    for (const id of G.BLD_IDS) if (G.bLvl(id) > 0) { const p = Wd.plots[id]; hole(p.x + 3, p.y + 3.6, 3.4, 0.7); }
    for (const h of Wd.houses) hole(h.x + 2, h.y + 2.6, 2.6, 0.6);
    hole(Wd.portal.x, Wd.portal.y - 1.6, 4.2, 0.9); hole(Wd.fountain.x, Wd.fountain.y - 0.5, 2.5, 0.4);
    for (const h of S.heroes) if (!h.inside && h.state !== 'recover') hole(h.x, h.y - 0.6, 2.4, 0.75);
    for (const m of G.mons) if (m.boss || m.elite) hole(m.x, m.y - 0.6, m.boss ? 4 : 2, 0.6);
    for (const f of R.fxs) if (f.t === 'ring' || f.t === 'pillar') hole(f.x, f.y, 3, 0.7);
    if (R.nightMore) R.nightMore(hole);
    }
    nightBlit();
    /* halo quente dos postes */
    ctx.globalCompositeOperation = 'lighter';
    if (!S.opts.lowFx) for (const l of Wd.lamps) { if (l.x < vx0 || l.x > vx1 || l.y < vy0 || l.y > vy1 + 2) continue; const x = X(l.x), y = Y(l.y - 1.75), r = Math.round(20 * z); ctx.drawImage(lightSprite(r, 0.4 * dark, '255,200,110'), x - r, y - r); }
    { const x = X(Wd.portal.x), y = Y(Wd.portal.y - 1.8), r = Math.round(34 * z); if (x > -r && x < cw + r) ctx.drawImage(lightSprite(r, 0.3 * dark, '170,90,255'), x - r, y - r); }
    ctx.globalCompositeOperation = 'source-over';
  };

  /* mapa do mundo (miniatura) para a tela de mapa */
  R.mapCanvas = () => { if (R._map) return R._map; const m = document.createElement('canvas'); m.width = Wd.w * 4; m.height = Wd.h * 4; const x = m.getContext('2d'); x.imageSmoothingEnabled = true; x.drawImage(terrain, 0, 0, m.width, m.height); R._map = m; return m; };
})();

;
