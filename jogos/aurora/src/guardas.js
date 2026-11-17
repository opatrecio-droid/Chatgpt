/* Aurora 046 · Guardas dos portões: ronda ao longo do muro, sentinela atento, vida ociosa e tocha à noite.
   Só visual: não altera regras, save nem dados do jogo (só mexe nos objetos de G.guards). Usa gerador próprio,
   para não mudar a sequência de G.rng / Math.random. Sem ronda com reduceMotion (só viradas lentas). */
(function () {
  'use strict';
  if (typeof G === 'undefined' || !G.W) return;
  const W = G.W;

  let seed = 12345;
  const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296);
  const between = (a, b) => a + rnd() * (b - a);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

  const DAY_LINES = ['Boa caçada!', 'Portão seguro.', 'Volte inteiro!', 'Olho na estrada.'];
  const NIGHT_LINES = ['Que frio…', 'Tudo calmo.'];
  const YAWN_LINES = ['Aaah… que sono.', 'Hããm…'];
  const GREET_LINES = ['Tudo certo, colega?', 'Bom turno!'];
  const SPEED = 1.1, ALERT_IN = 2.5, ALERT_OUT = 3.0, SALUTE_CD = 8, LOOK_T = 1.8, LOOK_FLIPS = [0.5, 1.1];
  const ROUND_REACH = [2.5, 1.5, 0.8];                  // distâncias tentadas para cada ponta da ronda
  let lastClock = null, view = null;

  const dark = (S) => G.darkness(S.clock) > 0.5;
  const reduced = (S) => !!(S.opts && S.opts.reduceMotion);

  const gateOf = (g) => {
    let best = 'n', bd = Infinity;
    for (const k of ['n', 's', 'w', 'e']) { const o = G.GATES[k], d = Math.hypot(o.x - g.x, o.y - g.y); if (d < bd) { bd = d; best = k; } }
    return best;
  };
  /* faixa caminhável paralela ao muro, a mais próxima do guarda com mais tiles abertos */
  const lane = (g) => {
    let best = null, bs = -1;
    for (const o of [0, -1, 1, -2, 2]) {
      const c = g._axis === 'x' ? Math.floor(g.y) + o + 0.5 : Math.floor(g.x) + o + 0.5;
      let n = 0;
      for (let s = -2.5; s <= 2.5; s += 0.5) {
        const x = g._axis === 'x' ? g.x + s : c, y = g._axis === 'x' ? c : g.y + s;
        if (W.walkable(x, y)) n++;
      }
      if (n > bs) { bs = n; best = c; }
    }
    return best;
  };
  const init = (g) => {
    if (g._ok) return;
    g._ok = 1; g._gk = gateOf(g);
    g._axis = (g._gk === 'n' || g._gk === 's') ? 'x' : 'y';     // o muro corre na horizontal nos portões norte/sul
    const ln = lane(g);                                         // o guarda nasce dentro do muro: o posto vai para a faixa aberta
    const post = ln === null ? null : g._axis === 'x' ? W.nearestWalk(g.x, ln) : W.nearestWalk(ln, g.y);
    if (post) { g.x = post[0]; g.y = post[1]; }
    g._home = { x: g.x, y: g.y };
    g._route = []; g._wp = null; g._lk = 0; g._lf = false; g._fl = 0;
    g._idle = between(2, 6); g._al = false; g._cd = 0; g._gr = 0; g._tu = 0; g._ph = rnd() * 6.283;
    g.moving = false; g.path = null; g.sayT = 0; g.say = null;
    if (g.dir !== 1 && g.dir !== -1) g.dir = 1;
  };

  /* ponta da ronda: a 'side' do posto, a maior distância caminhável */
  const endpoint = (g, side) => {
    for (const d of ROUND_REACH) {
      const x = g._home.x + (g._axis === 'x' ? side * d : 0), y = g._home.y + (g._axis === 'y' ? side * d : 0);
      if (W.walkable(x, y)) return [x, y];
    }
    return null;
  };
  /* ida e volta: posto → ponta → ponta oposta → posto (olha para os dois lados em cada ponta) */
  const roundRoute = (g, side) => {
    const a = endpoint(g, side), b = endpoint(g, -side);
    if (!a && !b) return [];
    const r = [];
    if (a) r.push({ p: a, look: 1 });
    if (b) r.push({ p: b, look: 1 });
    r.push({ p: [g._home.x, g._home.y] });
    return r;
  };

  const abort = (g) => { g._route = []; g._wp = null; g._lk = 0; g._lf = false; g.path = null; g.moving = false; };
  const nextWp = (g) => {
    while (g._route.length) {
      const wp = g._route.shift();
      if (!W.walkable(wp.p[0], wp.p[1])) continue;                       // confere caminhabilidade antes de cada ida
      if (Math.hypot(wp.p[0] - g.x, wp.p[1] - g.y) > 0.25) { G.go(g, wp.p[0], wp.p[1]); if (!g.path || !g.path.length) continue; }
      else g.path = null;
      return wp;
    }
    return null;
  };
  /* devolve true enquanto a guarda está ocupada com a rota (andando ou parada num ponto) */
  const runRoute = (g, dt) => {
    if (g._lk > 0) {
      g.moving = false; g._lk -= dt;
      if (g._lf && g._fl < LOOK_FLIPS.length && LOOK_T - g._lk >= LOOK_FLIPS[g._fl]) { g.dir = -g.dir; g._fl++; }
      if (g._lk <= 0) { g._lk = 0; g._lf = false; }
      return true;
    }
    if (!g._wp) { g._wp = nextWp(g); if (!g._wp) return false; }
    if (G.step(g, dt, SPEED)) {
      const wp = g._wp; g._wp = null; g.moving = false;
      g._lf = !!wp.look; g._fl = 0; g._lk = wp.look ? LOOK_T : (wp.wait || 0);
    }
    return true;
  };

  const heroNear = (gate, r, S) => {
    let best = null, bd = r;
    for (const h of S.heroes || []) {
      if (h.inside || h.state === 'fallen') continue;
      const d = Math.hypot(h.x - gate.x, h.y - gate.y);
      if (d < bd) { bd = d; best = h; }
    }
    return best;
  };
  const guardNear = (g, r) => {
    for (const o of G.guards) if (o !== g && o._ok && Math.hypot(o.x - g.x, o.y - g.y) < r) return o;
    return null;
  };
  const salute = (g, S) => {
    g.swing = 0.3; g._cd = SALUTE_CD;                                    // continência: uma vez
    if (rnd() < 0.5) { g.say = pick(DAY_LINES); g.sayT = 2.5; }
  };
  /* troca de turno às 6h: vai ao portão, espera e volta ao posto */
  const startShift = (g, S) => {
    const gate = G.GATES[g._gk];
    if (reduced(S)) { g.dir = gate.x >= g.x ? 1 : -1; return; }
    abort(g);
    g._route = [{ p: W.nearestWalk(gate.x, gate.y), look: 1 }, { p: [g._home.x, g._home.y] }];
  };
  const dawnCheck = (S) => {
    const c = S.clock, prev = lastClock; lastClock = c;
    return prev !== null && prev < 360 && c >= 360 && c - prev < 60;
  };

  const idle = (g, dt, S) => {
    g.moving = false;
    g._idle -= dt;
    if (reduced(S)) {                                                     // só viradas lentas
      if (g._idle <= 0) { g.dir = -g.dir; g._idle = between(7, 11); }
      return;
    }
    if (g._idle > 0) return;
    g._idle = between(5, 10);
    const dk = dark(S), other = guardNear(g, 3), r = rnd();
    if (other && r < 0.6) {                                              // cumprimenta o colega ao lado
      g.dir = other.x >= g.x ? 1 : -1; other.dir = g.x >= other.x ? 1 : -1;
      g.say = pick(GREET_LINES); g.sayT = 2.5; return;
    }
    if (r < (dk ? 0.45 : 0.15)) {                                        // boceja / espreguiça-se
      g.say = pick(dk ? YAWN_LINES : ['Tudo calmo.']); g.sayT = 2.2; g.dir = -g.dir; return;
    }
    if (dk && r < 0.6) { g.say = pick(NIGHT_LINES); g.sayT = 2.2; return; }
    g._route = roundRoute(g, rnd() < 0.5 ? -1 : 1);
  };

  const tickGuard = (g, dt, S) => {
    if (g.swing > 0) g.swing -= dt;
    if (g.sayT > 0) { g.sayT -= dt; if (g.sayT <= 0) { g.sayT = 0; g.say = null; } }
    if (g._cd > 0) g._cd -= dt;

    const h = heroNear(G.GATES[g._gk], g._al ? ALERT_OUT : ALERT_IN, S);
    if (h) {                                                             // sentinela atento: para e olha para o herói
      if (!g._al) { g._al = true; abort(g); if (g._cd <= 0) salute(g, S); }
      const face = h.x >= g.x ? 1 : -1;
      if (!reduced(S)) g.dir = face;
      else { g._tu -= dt; if (g._tu <= 0 && g.dir !== face) { g.dir = face; g._tu = 1.2; } }
      return;
    }
    if (g._al) { g._al = false; abort(g); g._route = [{ p: [g._home.x, g._home.y] }]; }

    if (runRoute(g, dt)) return;
    idle(g, dt, S);
  };

  G.hook('tick', (dt) => {
    const S = G.S; if (!S || !Array.isArray(G.guards) || !G.guards.length) return;
    const d = Math.min(Math.max(dt || 0, 0), 0.1), dawn = dawnCheck(S);
    for (const g of G.guards) {
      init(g);
      if (dawn && !g._al) startShift(g, S);
      tickGuard(g, d, S);
    }
  }, 40);

  /* registra a área visível (para desenhar tochas só dentro da tela) */
  G.hook('renderItems', (dyn, ctx, v) => { view = v; }, 0);

  const drawTorch = (ctx, g, X, Y, z, low, t) => {
    const hx = X(g.x) + g.dir * 6 * z, hy = Y(g.y) - 14 * z;          // mão, do lado para onde olha
    const fx = hx, fy = hy - 3 * z;
    const f1 = Math.sin(t * 13 + g._ph), f2 = Math.sin(t * 29 + g._ph * 2.3);
    const hh = (5 + f1 * 0.8 + f2 * 0.5) * z, w = (2 + 0.3 * f2) * z;
    if (!low) {                                                          // brilho aditivo suave
      ctx.globalCompositeOperation = 'lighter';
      const grd = ctx.createRadialGradient(fx, fy - hh * 0.5, 0, fx, fy - hh * 0.5, 14 * z);
      grd.addColorStop(0, 'rgba(255,170,70,' + (0.32 + 0.08 * f1).toFixed(3) + ')');
      grd.addColorStop(1, 'rgba(255,120,30,0)');
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(fx, fy - hh * 0.5, 14 * z, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.fillStyle = '#ff9a2e';                                           // chama
    ctx.beginPath(); ctx.moveTo(fx, fy - hh); ctx.quadraticCurveTo(fx + w, fy - hh * 0.4, fx + w * 0.6, fy);
    ctx.lineTo(fx - w * 0.6, fy); ctx.quadraticCurveTo(fx - w, fy - hh * 0.4, fx, fy - hh); ctx.fill();
    ctx.fillStyle = '#fff3b0';                                           // miolo
    ctx.beginPath(); ctx.arc(fx, fy - hh * 0.35, w * 0.45, 0, Math.PI * 2); ctx.fill();
  };
  G.hook('worldEffects', (ctx, X, Y, z) => {
    const S = G.S; if (!S || !Array.isArray(G.guards) || !view || !(G.darkness(S.clock) > 0.5)) return;
    const low = !!(S.opts && S.opts.lowFx), t = (G.R && G.R.t) || 0;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    try {
      for (const g of G.guards) {
        if (!g._ok || g.x < view.x0 - 3 || g.x > view.x1 + 3 || g.y < view.y0 - 3 || g.y > view.y1 + 3) continue;
        drawTorch(ctx, g, X, Y, z, low, t);
      }
    } catch (err) { if (!drawTorch.warned) { drawTorch.warned = 1; console.error('guardas', err); } }
    ctx.restore();
  }, 40);
})();
