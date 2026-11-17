/* Aurora 046 · Cidade viva: portas que abrem, janelas que acendem, postes com vida.
   Só visual (não toca em regras nem em save). Três camadas, todas por ganchos:
   · renderItems  -> um item por casa (ordenado por y, logo acima dela): vidros apagados de dia, interior e folha da porta;
   · R.nightMore  -> buracos de luz na noite para as janelas acesas;
   · worldEffects -> brilhos aditivos (janelas, chão, porta aberta, chama, poça, névoa, mariposas e vagalumes).
   Tudo derivado de G.S.clock e de R.t (nada de Math.random por quadro); sprites e gradientes em cache; teto de ~150 primitivas por
   quadro; Modo leve: sem mariposas, vagalumes e névoa; movimento reduzido: sem tremular, sem insetos. */
(function () {
  'use strict';
  if (typeof G === 'undefined' || G.HEADLESS || !G.A || !G.R || !G.W) return;
  const A = G.A, R = G.R, W = G.W, TS = 16, TAU = 6.283185307179586, LIMIT = 150;
  const media = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const hash = (a, b) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const smooth = u => u * u * (3 - 2 * u);
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  /* ---------- geometria das 6 variantes de casa (px da imagem 128×~120 embutida) ----------
     win: vidros [x0,y0,x1,y1] (inclusivo); main: janela do térreo que fica acesa com a casa vazia; door: folha [x0,y0,x1,y1]. */
  const IMG = [[128, 121], [128, 121], [128, 119], [128, 123], [128, 117], [128, 114]];
  const VAR = [
    { win: [[63, 50, 72, 58], [29, 84, 38, 93], [95, 84, 104, 93]], main: 1, door: [60, 84, 77, 112] },
    { win: [[33, 47, 41, 55], [77, 84, 90, 95]], main: 1, door: [32, 84, 50, 113] },
    { win: [[79, 41, 88, 50], [84, 83, 96, 92], [22, 85, 26, 92]], main: 1, door: [45, 84, 60, 111] },
    { win: [[59, 40, 68, 49], [25, 84, 34, 93], [95, 84, 103, 93]], main: 1, door: [57, 84, 73, 113] },
    { win: [[53, 42, 60, 50], [24, 81, 31, 90], [89, 82, 99, 91]], main: 1, door: [53, 84, 68, 109] },
    { win: [[49, 45, 56, 53], [26, 79, 36, 90], [93, 80, 102, 91]], main: 1, door: [57, 80, 71, 105] },
  ];
  /* mapa imagem -> tela, para o sprite de casa real (o embrulho 2× de A.cottage) */
  const geoCache = new WeakMap();
  const geoOf = (sp, v) => {
    if (!sp || !sp.cv || !sp.highDetailHouse) return null;
    let g = geoCache.get(sp); if (g) return g;
    const [iw, ih] = IMG[v], K = sp.cv.width / sp.w, sc = Math.min((sp.cv.width - 4) / iw, (sp.cv.height - 4) / ih);
    const wi = Math.max(1, Math.round(iw * sc)), hi = Math.max(1, Math.round(ih * sc));
    g = { K, sx: wi / iw, sy: hi / ih, ox: Math.round((sp.cv.width - wi) / 2), oy: sp.cv.height - hi - 2, w: sp.w, h: sp.h };
    geoCache.set(sp, g); return g;
  };

  /* ---------- sprites em cache ---------- */
  const SPR = {};
  const radial = (key, w, h, stops) => {
    let c = SPR[key]; if (c) return c;
    c = SPR[key] = mk(w, h); const x = c.getContext('2d');
    x.translate(w / 2, h / 2); x.scale(1, h / w);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, w / 2); for (const [o, col] of stops) g.addColorStop(o, col);
    x.fillStyle = g; x.fillRect(-w / 2, -w / 2, w, w); return c;
  };
  const POOL = () => radial('pool', 128, 64, [[0, 'rgba(255,196,110,.95)'], [.3, 'rgba(255,170,80,.62)'], [.62, 'rgba(240,128,52,.26)'], [.86, 'rgba(230,110,40,.07)'], [1, 'rgba(230,100,40,0)']]);
  const BLOOM = () => radial('bloom', 64, 64, [[0, 'rgba(255,214,140,.9)'], [.25, 'rgba(255,176,84,.5)'], [.6, 'rgba(255,140,60,.16)'], [1, 'rgba(255,120,50,0)']]);
  const CORE = () => radial('core', 32, 32, [[0, 'rgba(255,250,215,1)'], [.3, 'rgba(255,224,140,.7)'], [1, 'rgba(255,170,70,0)']]);
  const MIST = () => radial('mist', 96, 96, [[0, 'rgba(255,226,170,.55)'], [.45, 'rgba(255,208,150,.22)'], [1, 'rgba(255,200,140,0)']]);
  const FLY = () => radial('fly', 32, 32, [[0, 'rgba(235,255,140,.95)'], [.35, 'rgba(200,255,110,.4)'], [1, 'rgba(170,255,90,0)']]);
  const pix = (c, cx, cy, rx, ry, col) => { c.fillStyle = col; for (let y = 0; y < c.canvas.height; y++) for (let x = 0; x < c.canvas.width; x++) { const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy <= 1) c.fillRect(x, y, 1, 1); } };
  const FLAMES = [];       // 4 quadros da chama (7×11 px de arte), base embaixo ao centro
  const flame = i => {
    if (FLAMES[i]) return FLAMES[i];
    const c = mk(7, 11), x = c.getContext('2d'), h = [5.2, 6.2, 4.6, 5.8][i], lean = [0, .5, -.5, .25][i];
    pix(x, 3.5 + lean * .6, 8.4 - h * .45, 2.5, h * .56 + .4, '#ff7a1c');
    pix(x, 3.5 + lean * .4, 8.9 - h * .38, 1.9, h * .46, '#ffb53c');
    pix(x, 3.5 + lean * .2, 9.4 - h * .26, 1.1, h * .3, '#fff1a6');
    x.fillStyle = '#ff7a1c'; x.fillRect(3 + (lean > 0 ? 1 : 0), 1 + (i % 2), 1, 1);
    return (FLAMES[i] = c);
  };
  const GLASS = {};        // vidro apagado por variante/janela, na resolução da imagem
  const glass = (v, j) => {
    const key = v * 8 + j; if (GLASS[key]) return GLASS[key];
    const [x0, y0, x1, y1] = VAR[v].win[j], w = x1 - x0 + 3, h = y1 - y0 + 3, c = mk(w, h), x = c.getContext('2d');
    x.fillStyle = '#2a1b14'; x.fillRect(0, 0, w, h);
    const g = x.createLinearGradient(0, 1, 0, h - 1); g.addColorStop(0, '#42566e'); g.addColorStop(.55, '#26344a'); g.addColorStop(1, '#161e2e');
    x.fillStyle = g; x.fillRect(1, 1, w - 2, h - 2);
    x.fillStyle = 'rgba(190,215,240,.42)'; for (let i = 0; i < Math.min(w, h) - 3; i++) x.fillRect(2 + i, 2 + Math.max(0, (h - 4) - i - 2 - ((h - 4) >> 1)) + (i >> 2), 1, 1);
    x.fillStyle = 'rgba(150,185,220,.3)'; x.fillRect(1, 1, w - 2, 1);
    x.fillStyle = '#2a1b14'; x.fillRect((w >> 1), 1, 1, h - 2); if (h > 7) x.fillRect(1, (h >> 1), w - 2, 1);
    return (GLASS[key] = c);
  };

  /* ---------- estado ---------- */
  const T = { t: 0, dt: 0, dark: 0, hour: 12, quiet: false, light: false, prims: 0, v: null, fx: [], frame: -1 };
  const houseSt = new Map();                 // casa -> estado
  const npcPrev = new Map();                 // morador -> estava dentro no quadro anterior
  const looks = new Map();
  const doorWorld = h => h.door;
  const stOf = h => {
    let s = houseSt.get(h);
    if (!s) {
      const v = h.i % 6, n = VAR[v].win.length;
      s = { h, v, open: 0, hold: 0, occ: 0, ghosts: [], init: true, win: [] };
      for (let j = 0; j < n; j++) s.win.push({ on: 18.1 + hash(h.i * 7 + j, 3) * 2.5, off: .5 + hash(h.i * 5 + j, 9) * 3.5, lit: 0, ph: hash(h.i, j + 20) * TAU });
      houseSt.set(h, s);
    }
    return s;
  };
  const take = n => (T.prims + n <= LIMIT ? (T.prims += n, true) : false);

  /* ---------- postes: ordem de acendimento (cadeia do mais próximo da praça para fora) ---------- */
  let LAMPS = [], lampKey = null, lampsOrig = null, swapped = false;
  const lit = [];
  const buildLamps = () => {
    const src = W.lamps; lampKey = src.length + '|' + (src[0] && src[0].x); const left = src.map(l => l), out = [];
    let cur = { x: 44, y: 54 };
    while (left.length) {
      let bi = 0, bd = 1e9; for (let i = 0; i < left.length; i++) { const d = Math.hypot(left[i].x - cur.x, left[i].y - cur.y); if (d < bd) { bd = d; bi = i; } }
      cur = left.splice(bi, 1)[0]; out.push(cur);
    }
    const N = Math.max(1, out.length - 1);
    LAMPS = out.map((l, k) => ({ l, x: l.x, y: l.y, on: 18.25 + 1.45 * k / N, off: 5.0 + 1.7 * k / N, ph: hash(Math.round(l.x * 10), Math.round(l.y * 10)) * TAU, lit: 0, init: true }));
  };
  const restoreLamps = () => { if (swapped) { W.lamps = lampsOrig; swapped = false; } };

  /* ---------- por quadro: horas, moradores, portas, janelas e postes ---------- */
  const tick = (v) => {
    const S = G.S; if (!S) return false;
    restoreLamps();
    T.v = v; T.fx.length = 0; T.prims = 0;
    const t = R.t, dt = clamp(t - (T.t || t), 0, .12); T.t = t; T.dt = dt;
    T.hour = (S.clock % 1440) / 60; T.dark = G.darkness ? G.darkness(S.clock) : 0;
    T.quiet = !!((S.opts && S.opts.reduceMotion) || media.matches); T.light = !!(S.opts && S.opts.lowFx);
    const houses = W.houses; if (!houses || !houses.length) return false;
    if (!lampKey || lampKey !== W.lamps.length + '|' + (W.lamps[0] && W.lamps[0].x)) buildLamps();
    for (const h of houses) { const s = stOf(h); s.occ = 0; }
    /* moradores: presença em casa e eventos de porta */
    for (const n of G.npcs || []) {
      const h = houses[n.home]; if (!h) continue;
      const s = stOf(h), d = h.door, dist = Math.hypot(n.x - d[0], n.y - d[1]);
      const home = n.inside && (n.act === 'home' || n.act === 'hide');
      if (home) s.occ++;
      const prev = npcPrev.get(n); npcPrev.set(n, !!n.inside);
      if (!n.inside && n.goal === 'in' && n.state === 'walk' && dist < 1.7 && (n.act === 'home' || n.act === 'hide')) s.hold = Math.max(s.hold, .55);
      if (prev === undefined || prev === !!n.inside || dist > 1.1) continue;
      if (!seen(h, v, 3)) { s.hold = Math.max(s.hold, .3); continue; }
      if (n.inside && (n.act === 'home' || n.act === 'hide')) { s.ghosts.push({ n, t0: t, dir: 1, sx: n.x, sy: n.y, fd: n.dir || 1 }); s.hold = Math.max(s.hold, 1); }
      else if (!n.inside) { s.ghosts.push({ n, t0: t, dir: -1, sx: n.x, sy: n.y, fd: n.dir || 1 }); s.hold = Math.max(s.hold, 1.05); }
    }
    const hour = T.hour;
    for (const s of W.houses.map(stOf)) {
      s.hold = Math.max(0, s.hold - dt);
      const want = s.hold > 0 || s.ghosts.length > 0;
      s.open = clamp(s.open + (want ? dt / .28 : -dt / .36), 0, 1);
      for (let i = s.ghosts.length - 1; i >= 0; i--) if (t - s.ghosts[i].t0 > (s.ghosts[i].dir > 0 ? .62 : .78) || t < s.ghosts[i].t0) s.ghosts.splice(i, 1);
      const night = j => hour >= s.win[j].on || hour < s.win[j].off;
      for (let j = 0; j < s.win.length; j++) {
        const w = s.win[j]; let tg = 0;
        if (night(j)) tg = s.occ > 0 ? (s.occ > 1 ? 1 : .92) : (j === VAR[s.v].main ? .42 : 0);
        if (s.init) w.lit = tg; else w.lit += Math.abs(tg - w.lit) < .01 ? tg - w.lit : (tg - w.lit) * Math.min(1, dt * 1.7);
      }
      s.init = false;
    }
    /* postes: acendem em sequência no crepúsculo e apagam em sequência ao amanhecer */
    for (const r of LAMPS) {
      const tg = hour >= 12 ? clamp((hour - r.on) / .07, 0, 1) : 1 - clamp((hour - r.off) / .07, 0, 1);
      if (r.init) { r.lit = tg; r.init = false; } else r.lit += clamp(tg - r.lit, -dt * 1.2, dt * 1.2);
    }
    return true;
  };
  const seen = (h, v, m) => !v || (h.x + 4 > v.x0 - m && h.x < v.x1 + m && h.y + 4 > v.y0 - m && h.y < v.y1 + m + 2);

  /* ---------- desenho de morador (entrando / saindo) ---------- */
  const drawNpc = (ctx, n, px, py, z, pose, alpha, sc, flip) => {
    let look = looks.get(n); if (!look) { try { look = A.npcLook(n); } catch (e) { return; } looks.set(n, look); }
    const sh = A.charSheet(look); if (!sh) return; if (sh.need) sh.need(pose);
    const idx = sh.idx && sh.idx[pose]; if (idx == null) return;
    const fw = sh.fw || 26, fh = sh.fh || 30, fs = (sh.scale || 1) * sc, ax = sh.ax == null ? 13 : sh.ax, ay = sh.ay == null ? 27 : sh.ay;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(Math.round(px), Math.round(py)); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(sh.cv, idx * fw, 0, fw, fh, Math.round(-ax * fs * z), Math.round(-ay * fs * z), Math.round(fw * fs * z), Math.round(fh * fs * z));
    ctx.restore();
  };

  /* ---------- item da casa: vidros, porta e moradores na soleira ---------- */
  const mix = (a, b, k) => Math.round(a + (b - a) * k);
  const drawHouse = (s, ctx, X, Y, z) => {
    const h = s.h, sp = A.cottage(h.i), g = geoOf(sp, s.v); if (!g) return;
    const dx = Math.round(X(h.x + 2) - (sp.w / 2) * z), dy = Math.round(Y(h.y + 3) - sp.h * z), V = VAR[s.v];
    const PX = u => dx + (g.ox + u * g.sx) / g.K * z, PY = v => dy + (g.oy + v * g.sy) / g.K * z;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    const dark = T.dark, flick = !T.quiet;
    /* vidros: de dia apagados; acesos mostram a arte original (a luz vem de buracos na noite e brilhos aditivos) */
    for (let j = 0; j < V.win.length; j++) {
      const w = s.win[j], [x0, y0, x1, y1] = V.win[j], bx = Math.round(PX(x0 - 1)), by = Math.round(PY(y0 - 1)), bw = Math.round(PX(x1 + 2)) - bx, bh = Math.round(PY(y1 + 2)) - by;
      const f = flick && w.lit > .05 ? .9 + .1 * Math.sin(T.t * 8.3 + w.ph) * Math.cos(T.t * 5.1 + w.ph * 2) + .03 * Math.sin(T.t * 21 + w.ph) : 1;
      const L = w.lit * f;
      if (L < .97 && take(1)) { ctx.globalAlpha = clamp(1 - L, 0, 1); ctx.drawImage(glass(s.v, j), bx, by, bw, bh); }
      if (w.lit > .03 && dark > .02) T.fx.push({ k: 'w', x: (bx + bw / 2), y: (by + bh / 2), r: Math.max(bw, bh), a: w.lit * f, ground: y0 > 70, base: PY(112), bw });
    }
    ctx.globalAlpha = 1;
    /* porta */
    const [u0, v0, u1, v1] = V.door, x0 = Math.round(PX(u0)), x1 = Math.round(PX(u1 + 1)), y0 = Math.round(PY(v0)), y1 = Math.round(PY(v1 + 1)), w = x1 - x0, hh = y1 - y0;
    const warm = clamp(Math.max(0, ...s.win.map(q => q.lit)) * (dark > .02 ? 1 : 0), 0, 1) * (s.occ > 0 ? 1 : .55);
    if (s.open > .01 && take(9)) {
      const e = smooth(s.open), r = w / 2, cx = x0 + w / 2;
      ctx.save(); ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0 + r); ctx.arc(cx, y0 + r, r, Math.PI, 0); ctx.lineTo(x1, y1); ctx.closePath(); ctx.clip();
      const gr = ctx.createLinearGradient(0, y0, 0, y1);
      gr.addColorStop(0, 'rgb(' + mix(14, 40, warm) + ',' + mix(8, 20, warm) + ',6)'); gr.addColorStop(1, 'rgb(' + mix(36, 236, warm) + ',' + mix(22, 152, warm) + ',' + mix(14, 74, warm) + ')');
      ctx.fillStyle = gr; ctx.fillRect(x0, y0, w, hh);
      /* moradores atravessando a soleira (sob a folha, dentro do vão) */
      ctx.restore();
      for (const gh of s.ghosts) {
        const age = T.t - gh.t0, n = gh.n, tx = (x0 + x1) / 2, ty = y1 - 1.2 * z;
        if (gh.dir > 0) {
          const u = smooth(clamp(age / .5, 0, 1)), px = X(gh.sx) + (tx - X(gh.sx)) * u, py = Y(gh.sy) + (ty - Y(gh.sy)) * u, side = Math.abs(tx - X(gh.sx)) > Math.abs(ty - Y(gh.sy)) * 1.25;
          drawNpc(ctx, n, px, py, z, (side ? 'walk' : 'up') + (Math.floor(T.t * 8 + gh.sx * 3) % 4), clamp(1.6 - u * 1.6, 0, 1), 1 - .14 * u, side && tx < X(gh.sx));
        } else if (age > .26) {
          const u = clamp((age - .26) / .5, 0, 1), px = tx + (X(n.x) - tx) * u, py = ty + (Y(n.y) - ty) * u, side = Math.abs(X(n.x) - tx) > Math.abs(Y(n.y) - ty) * 1.25;
          drawNpc(ctx, n, px, py, z, (side ? 'walk' : 'down') + (Math.floor(T.t * 8 + gh.sx * 3) % 4), Math.min(1, u * 2), .86 + .14 * u, side && X(n.x) < tx);
        }
      }
      /* folha: dobradiça à esquerda, gira para dentro (estreita e escurece) */
      const wl = Math.max(1, w * (1 - .82 * e)), ns = clamp(Math.round(wl / (z * 1.3)), 3, 7), sw = (u1 + 1 - u0) / ns;
      ctx.save(); ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0 + r); ctx.arc(cx, y0 + r, r, Math.PI, 0); ctx.lineTo(x1, y1); ctx.closePath(); ctx.clip();
      for (let i = 0; i < ns; i++) {
        const k = (i + .5) / ns, fy = 1 - .26 * e * k, sxp = g.ox + (u0 + i * sw) * g.sx, syp = g.oy + v0 * g.sy;
        ctx.drawImage(sp.cv, sxp, syp, sw * g.sx, (v1 + 1 - v0) * g.sy, Math.round(x0 + i * wl / ns), Math.round(y0 + hh * (1 - fy) / 2), Math.ceil(wl / ns) + 1, Math.round(hh * fy));
      }
      ctx.fillStyle = 'rgba(14,7,3,' + (.12 + .5 * e) + ')'; ctx.fillRect(x0, y0, Math.ceil(wl) + 1, hh);
      ctx.restore();
      if (dark > .02 && warm > .05) T.fx.push({ k: 'd', x: cx, y: y1, w, a: e * warm });
    }
    ctx.restore();
  };

  /* ---------- ganchos ---------- */
  G.hook('groundDecor', (ctx, X, Y, z, v) => { try { tick(v); } catch (e) { if (!tick.w) { tick.w = 1; console.error('cidade-viva', e); } } }, -1e6);

  G.hook('renderItems', (dyn, ctx, v) => {
    if (!G.S || !W.houses) return;
    for (const h of W.houses) {
      const s = houseSt.get(h); if (!s || !seen(h, v, 2)) continue;
      dyn.push({ y: h.y + 3.001, k: 'x', e: s, f: (e, X, Y, z) => { try { drawHouse(e, R.ctx, X, Y, z); } catch (err) { if (!drawHouse.w) { drawHouse.w = 1; console.error('cidade-viva casa', err); } } } });
    }
  }, 40);
  /* quem está saindo de casa só aparece depois que a porta abre: o sprite normal fica escondido enquanto o morador emerge */
  G.hook('renderItems', (dyn) => {
    for (const s of houseSt.values()) for (const gh of s.ghosts) if (gh.dir < 0 && T.t - gh.t0 < .78) for (let i = dyn.length - 1; i >= 0; i--) if (dyn[i].k === 'n' && dyn[i].e === gh.n) dyn.splice(i, 1);
  }, 41);
  /* postes ainda apagados saem da lista do jogo durante o desenho (some o buraco de luz e o halo deles); worldEffects devolve */
  G.hook('renderItems', () => {
    if (T.light || T.dark < .02 || !LAMPS.length || swapped) return;
    lampsOrig = W.lamps; lit.length = 0; for (const r of LAMPS) if (r.lit > .6) lit.push(r.l);
    W.lamps = lit; swapped = true;
  }, 1e6);

  const nm0 = R.nightMore;
  R.nightMore = function (hole) {
    if (nm0) nm0.apply(this, arguments);
    if (T.dark < .02) return;
    for (const s of houseSt.values()) {
      const h = s.h, sp = A.cottage(h.i), g = geoOf(sp, s.v); if (!g) continue;
      for (let j = 0; j < s.win.length; j++) {
        const w = s.win[j]; if (w.lit < .05) continue;
        const [x0, y0, x1, y1] = VAR[s.v].win[j], u = (x0 + x1) / 2, vv = (y0 + y1) / 2;
        hole(h.x + 2 + ((g.ox + u * g.sx) / g.K - sp.w / 2) / TS, h.y + 3 + ((g.oy + vv * g.sy) / g.K - sp.h) / TS, 1.15, .62 * w.lit);
      }
    }
    for (const r of LAMPS) if (r.lit > .05 && r.lit <= .6) hole(r.x, r.y - 1.4, 3.8 * r.lit / .6, .95 * r.lit / .6);
  };

  const spr = (ctx, c, cx, cy, w, h, a) => { ctx.globalAlpha = a; ctx.drawImage(c, Math.round(cx - w / 2), Math.round(cy - h / 2), Math.round(w), Math.round(h)); };

  G.hook('worldEffects', (ctx, X, Y, z, dt) => {
    restoreLamps();
    try { fx(ctx, X, Y, z); } catch (e) { if (!fx.w) { fx.w = 1; console.error('cidade-viva efeitos', e); } }
  }, -1e9);

  const fx = (ctx, X, Y, z) => {
    const S = G.S, v = T.v; if (!S || !v) return;
    const dark = T.dark, t = T.t, quiet = T.quiet, light = T.light, prev = ctx.imageSmoothingEnabled;
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.globalCompositeOperation = 'lighter';
    /* luz das janelas e das portas abertas (coletadas ao desenhar as casas) */
    for (const f of T.fx) {
      if (f.k === 'w') {
        if (light) { if (take(1)) { ctx.fillStyle = 'rgba(255,190,90,' + (.22 * f.a * Math.min(1, dark * 2)) + ')'; ctx.fillRect(f.x - f.bw / 2, f.y - f.r / 2, f.bw, f.r); } continue; }
        if (take(1)) spr(ctx, BLOOM(), f.x, f.y, f.r * 3.4, f.r * 3.4, .5 * f.a * Math.min(1, dark * 1.6));
        if (f.ground && take(1)) spr(ctx, POOL(), f.x, f.base + .45 * TS * z, 2.9 * TS * z, 1.3 * TS * z, .34 * f.a * dark);
      } else if (take(1)) spr(ctx, POOL(), f.x, f.y + .55 * TS * z, 2.1 * TS * z, 1.1 * TS * z, .62 * f.a * Math.min(1, dark * 1.5));
    }
    /* postes */
    const vis = [];
    for (const r of LAMPS) if (r.lit > .01 && r.x > v.x0 - 3 && r.x < v.x1 + 3 && r.y > v.y0 - 3 && r.y < v.y1 + 5) vis.push(r);
    for (const r of vis) {
      const I = r.lit * (.4 + .6 * Math.max(dark, .35)), fl = quiet ? 1 : .88 + .12 * Math.sin(t * 7.5 + r.ph) * Math.cos(t * 11.3 + r.ph * 1.7) + .05 * Math.sin(t * 19 + r.ph * 3);
      const cx = X(r.x), cy = Y(r.y - 1.75), by = Y(r.y);
      if (take(1)) spr(ctx, POOL(), cx, by + .12 * TS * z, 5.4 * TS * z * (.94 + .06 * fl), 2.7 * TS * z * (.94 + .06 * fl), .52 * I);
      if (!light && !quiet && take(1)) spr(ctx, MIST(), cx + Math.sin(t * .32 + r.ph) * .3 * TS * z, by - .6 * TS * z, 3.4 * TS * z, 2 * TS * z, .2 * I * (.8 + .2 * Math.sin(t * .5 + r.ph * 2)));
      else if (!light && quiet && take(1)) spr(ctx, MIST(), cx, by - .6 * TS * z, 3.4 * TS * z, 2 * TS * z, .17 * I);
      if (take(1)) spr(ctx, CORE(), cx, cy, 11 * z * fl * (1 + .5 * Math.sin(Math.PI * r.lit)), 11 * z * fl * (1 + .5 * Math.sin(Math.PI * r.lit)), .85 * r.lit * fl);
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 1;
    for (const r of vis) {
      if (!take(1)) break;
      const k = quiet ? 0 : Math.floor(t * 9 + r.ph * 3) % 4, c = flame(k), sc = z * (.8 + .2 * r.lit);
      ctx.globalAlpha = clamp(r.lit * 1.4, 0, 1);
      ctx.drawImage(c, Math.round(X(r.x) - 3.5 * sc), Math.round(Y(r.y - 1.75) + 1.2 * z - 9.4 * sc), Math.round(7 * sc), Math.round(11 * sc));
    }
    ctx.globalAlpha = 1;
    /* mariposas e vagalumes: determinísticos, só com efeitos completos e movimento normal */
    if (!light && !quiet && dark > .45 && vis.length) {
      const per = Math.min(5, Math.floor((LIMIT - T.prims) / vis.length));
      for (const r of vis) {
        if (r.lit < .9) continue;
        let used = 0;
        for (let m = 0; m < 2 && used + 1 <= per; m++) {         // mariposas em órbita da chama
          const a = t * (2.6 + m * .9) * (m ? -1 : 1) + r.ph * (m + 1), rr = (.3 + .16 * Math.sin(t * .8 + r.ph + m * 2)) * TS * z;
          const mx = X(r.x) + Math.cos(a) * rr + Math.sin(t * 13 + m) * .5 * z, my = Y(r.y - 1.75) + Math.sin(a) * rr * .55 + Math.cos(t * 9 + r.ph + m * 3) * .8 * z;
          if (!take(1)) break; used++;
          ctx.fillStyle = Math.sin(t * 28 + r.ph + m * 4) > 0 ? 'rgba(255,244,214,.95)' : 'rgba(224,206,170,.9)';
          const wv = Math.sin(t * 28 + r.ph + m * 4) > 0 ? 2.4 * z : 1.3 * z; ctx.fillRect(Math.round(mx - wv / 2), Math.round(my), Math.round(wv), Math.max(1, Math.round(z * .9)));
        }
        if (used + 2 <= per && dark > .6) {                         // vagalume passeando ao redor, piscando
          const a = t * .34 + r.ph * 2, fx0 = X(r.x) + (Math.cos(a) * 1.25 + Math.cos(t * .9 + r.ph) * .25) * TS * z, fy0 = Y(r.y - .7) + (Math.sin(a * 1.3) * .6 - .3) * TS * z, b = Math.pow(Math.max(0, Math.sin(t * 1.7 + r.ph * 3)), 2);
          if (b > .05 && take(2)) {
            ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true;
            spr(ctx, FLY(), fx0, fy0, 8 * z, 8 * z, .85 * b * dark);
            ctx.fillStyle = 'rgba(240,255,170,' + b + ')'; ctx.fillRect(Math.round(fx0), Math.round(fy0), Math.max(1, Math.round(z * .8)), Math.max(1, Math.round(z * .8)));
            ctx.globalCompositeOperation = 'source-over'; ctx.imageSmoothingEnabled = false;
          }
        }
      }
    }
    ctx.restore(); ctx.imageSmoothingEnabled = prev;
  };

  /* depuração: G.A.cidadeViva() devolve um resumo (casas, portas, postes) */
  A.cidadeViva = () => ({ prims: T.prims, dark: T.dark, hour: T.hour, houses: [...houseSt.values()].map(s => ({ i: s.h.i, open: +s.open.toFixed(2), occ: s.occ, lit: s.win.map(w => +w.lit.toFixed(2)) })), lamps: LAMPS.map(r => +r.lit.toFixed(2)) });
})();
