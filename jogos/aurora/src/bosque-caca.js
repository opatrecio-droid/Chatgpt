/* Aurora 046 · Bosque de caça: animais de verdade no bosque da Lenharia.
   Cervos, coelhos, javalis e pássaros vagam entre as árvores, vão até as frutas que caem das macieiras e amoreiras (cerca de 1/3 das árvores)
   e as comem. Quando há fartura, nasce um filhote (teto de ~10 animais). Fogem do lenhador quando a árvore cai e de gente a menos de ~2 tiles.
   Zeno, o caçador, trabalha no expediente (6 h–17 h): vai ao bosque, chega agachado, mira, atira (70% de acerto) e leva a caça nas costas até a
   Lenharia, onde rende couro, refeição e presa de verdade (G.addRes). Caça sustentável: nunca abate o último de uma espécie.
   Integridade: não roda em G.HEADLESS nem em G.OFFLINE; nada é salvo (a população recomeça ao carregar); usa um gerador próprio (nunca G.rng nem
   Math.random); só LÊ o estado das árvores de G.life (não mexe no lenhador nem no corte). Desenho: animais e frutos ordenados por y (renderItems),
   frutos no chão em groundDecor; sprites em cache e só o que está na tela. Modo leve e "reduzir movimento" simplificam o desenho. */
(function () {
  'use strict';
  if (typeof G === 'undefined' || !G.W || !G.life) return;
  if (G.HEADLESS || !G.A || !G.R) return;
  const W = G.W, L = G.life, A = G.A, R = G.R, Pix = A.Pix, INK = '#1a1422';
  const sh = A.shade, mix = A.mix;
  const rnd = G.seeded(0xB05C0A1);
  const rr = (a, b) => a + rnd() * (b - a);
  const pk = (arr) => arr[Math.floor(rnd() * arr.length)];
  const clamp = G.clamp, lerp = (a, b, t) => a + (b - a) * t;
  const ZB = { x0: 66.2, y0: 19.3, x1: 83.6, y1: 34.8 };          // o bosque: a leste do rio, em volta da Lenharia
  const CAP = 10, BIRDS = 3, ADULT = 1;
  const low = () => !!(G.S && G.S.opts && G.S.opts.lowFx);
  const calm = () => !!(G.S && G.S.opts && (G.S.opts.reduceMotion || G.S.opts.lowFx));
  const B = (G.bosque = { S: null, an: [], fr: [], ft: [], arrows: [], stuck: [], hunt: null, zn: null, t: 0, bt: 0, nid: 1, cd: 0, scare: [], stats: { shot: 0, hit: 0, delivered: 0, born: 0, eaten: 0, fell: 0 } });

  /* ================= o mapa do bosque ================= */
  let mask = null, tiles = [], bushes = [];
  const okTile = (x, y) => x >= ZB.x0 && x < ZB.x1 && y >= ZB.y0 && y < ZB.y1 && mask && mask[(y | 0) * W.w + (x | 0)] === 1;
  const clear = (ax, ay, bx, by) => { const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d * 2.5); for (let i = 1; i <= n; i++) { const t = i / n; if (!okTile(ax + (bx - ax) * t, ay + (by - ay) * t)) return false; } return true; };
  const buildMask = () => {
    const w = W.w, h = W.h, door = W.plots.lenharia.door, comp = new Int32Array(w * h).fill(-1);
    const x0 = Math.floor(ZB.x0), x1 = Math.floor(ZB.x1), y0 = Math.floor(ZB.y0), y1 = Math.floor(ZB.y1);
    const ok = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && W.walk[y * w + x] === 1 && Math.hypot(x + 0.5 - door[0], y + 0.5 - door[1]) > 2.4;
    let best = -1, bestN = 0, nc = 0; const sizes = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!ok(x, y) || comp[y * w + x] >= 0) continue;
      const q = [[x, y]]; comp[y * w + x] = nc; let n = 0;
      while (q.length) { const [cx, cy] = q.pop(); n++; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (ok(nx, ny) && comp[ny * w + nx] < 0) { comp[ny * w + nx] = nc; q.push([nx, ny]); } } }
      sizes.push(n); if (n > bestN) { bestN = n; best = nc; } nc++;
    }
    mask = new Uint8Array(w * h); tiles = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (comp[y * w + x] === best) { mask[y * w + x] = 1; tiles.push([x + 0.5, y + 0.5]); }
    bushes = W.props.filter((p) => p.t === 'bush' && okTile(p.x, p.y)).map((p) => [p.x, p.y + 0.15]);
  };

  /* ================= árvores frutíferas ================= */
  const FRUIT_Y = 1 / 3;
  const buildTrees = () => {
    B.ft = [];
    const mine = new Set(L.trees.map((t) => t.p));
    const add = (x, y, src, k) => {
      if (k !== 'tree_oak' || x < ZB.x0 - 0.5 || x > ZB.x1 + 0.5 || y < ZB.y0 - 0.5 || y > ZB.y1 + 1.5) return;
      const hs = G.hash('f' + Math.round(x * 10) + ',' + Math.round(y * 10));
      if (hs % 3 !== 0) return;                                           // marcadas de forma estável pela posição
      const n = 2 + ((hs >>> 5) % 2), slots = [];
      for (let i = 0; i < n; i++) {
        const h = G.hash('s' + hs + ':' + i), a = ((h % 360) * Math.PI) / 180, rad = 0.35 + ((h >>> 9) % 60) / 100;
        slots.push({ ox: Math.round(Math.cos(a) * 12 * rad), oy: Math.round(-29 + Math.sin(a) * 9 * rad), col: (h >>> 4) % 5 < 3 ? 0 : 1, p: rr(0.15, 1), hold: rr(3, 34), st: 'grow', rate: 1 / rr(55, 85) });
      }
      B.ft.push({ x, y, src, on: !src || src.st === 'tree' || src.st === 'chop', slots, hit: src ? src.hit | 0 : 0, fell: false });
    };
    for (const t of L.trees) add(t.x, t.y, t, t.k);
    for (const p of W.props) if (!mine.has(p)) add(p.x, p.y, null, p.t);
  };

  /* ================= estado ================= */
  const aliveAn = (a) => a.st !== 'dead' && a.st !== 'carried' && !a.gone;
  const spawn = (sp, sex, age, x, y) => {
    if (x == null) { for (let i = 0; i < 40; i++) { const t = pk(tiles); if (!t) break; x = t[0] + rr(-0.3, 0.3); y = t[1] + rr(-0.3, 0.3); if (okTile(x, y) && !B.an.some((o) => Math.hypot(o.x - x, o.y - y) < 1.6)) break; } }
    const a = { id: B.nid++, sp, sex, age, x, y, dir: rnd() < 0.5 ? 1 : -1, st: 'idle', t: rr(0, 2), tEnd: rr(1, 3), tx: x, ty: y, ph: rr(0, 9), hunger: rr(0.2, 0.9), fruit: null, z: 0, hp: 0, alert: 0, stuck: 0, hold: 0, hide: 0, thk: rr(0, 0.3), hop: 0, fx: 0, fy: 0 };
    B.an.push(a); return a;
  };
  const reset = () => {
    for (const n of G.npcs) if (n._hunt) { n._hunt = 0; n._sc = 0; n._wk = 0; n.w = null; }
    B.S = G.S; B.an = []; B.fr = []; B.arrows = []; B.stuck = []; B.hunt = null; B.zn = null; B.t = 0; B.bt = 0; B.cd = 0; B.scare = [];
    B.stats = { shot: 0, hit: 0, delivered: 0, born: 0, eaten: 0, fell: 0 };
    if (!W.ready) return;
    buildMask(); buildTrees();
    if (!tiles.length) return;
    spawn('deer', 'm', 2); spawn('deer', 'f', 2); spawn('deer', 'f', 2);
    spawn('rabbit', 'm', 2); spawn('rabbit', 'f', 2); spawn('rabbit', 'f', 2);
    spawn('boar', 'm', 2); spawn('boar', 'f', 2);
    spawn('bird', 'f', 2); spawn('bird', 'm', 2);
  };
  const adults = (sp) => B.an.filter((a) => a.sp === sp && a.age >= ADULT && aliveAn(a));
  const popCount = () => B.an.filter((a) => a.sp !== 'bird' && aliveAn(a)).length;
  const groundFruit = () => B.fr.filter((f) => f.st !== 'fall' && !f.gone).length;

  /* ================= frutos ================= */
  const fall = (tr, s, delay) => {
    const lx = tr.x + rr(-1.0, 1.0), ly = tr.y + rr(0.35, 1.0);
    let x = lx, y = ly; if (!okTile(x, y)) { x = tr.x + rr(-0.4, 0.4); y = tr.y + 0.55; if (!okTile(x, y)) { x = lx; y = ly; } }
    B.fr.push({ x, y, tr, ox: s.ox, oy: s.oy, col: s.col, st: 'fall', t: -(delay || 0), age: 0, life: rr(75, 105), by: 0, gone: false });
    B.stats.fell++;
  };
  const treeTick = (tr, dt) => {
    const src = tr.src, on = !src || src.st === 'tree' || src.st === 'chop';
    if (on && !tr.on) { tr.on = true; for (const s of tr.slots) { s.p = 0; s.st = 'grow'; s.hold = rr(3, 30); } }            // a árvore voltou a ser árvore: volta a frutificar
    if (!on) {
      if (tr.on) { tr.on = false; for (const s of tr.slots) { if (s.p >= 0.45 && s.st === 'grow') fall(tr, s, rr(0, 0.5)); s.p = 0; s.st = 'none'; } }   // árvore cortada: os frutos caem e a árvore perde a safra
      return;
    }
    if (src && src.hit > tr.hit && src.st === 'chop') { const s = tr.slots.find((q) => q.p >= 1 && q.st === 'grow'); if (s) { fall(tr, s, 0.05); s.p = 0; s.hold = rr(8, 25); } }   // o golpe do machado sacode um fruto maduro
    tr.hit = src ? src.hit | 0 : 0;
    for (const s of tr.slots) {
      if (s.st !== 'grow') continue;
      if (s.p < 1) { s.p = Math.min(1, s.p + dt * s.rate); continue; }
      s.hold -= dt; if (s.hold <= 0) { fall(tr, s, 0); s.p = 0; s.hold = rr(5, 30); s.rate = 1 / rr(55, 85); }
    }
  };
  const fruitTick = (dt) => {
    for (let i = B.fr.length - 1; i >= 0; i--) {
      const f = B.fr[i]; f.t += dt;
      if (f.st === 'fall' && f.t >= 0.6) f.st = 'ground', f.t = 0;
      if (f.st === 'ground') { f.age += dt; if (f.age > f.life) f.gone = true; }
      if (f.gone) { B.fr.splice(i, 1); }
    }
  };

  /* ================= os animais ================= */
  const SPD = { deer: [0.9, 4.3], boar: [0.8, 3.6], rabbit: [1.5, 4.6], bird: [0.7, 5.5] };
  const FEAR = 2.0, WATCH = 4.6;
  const people = () => {
    const out = [], S = G.S;
    for (const n of G.npcs) if (!n.inside && n.x > ZB.x0 - 5 && n.x < ZB.x1 + 5 && n.y > ZB.y0 - 5 && n.y < ZB.y1 + 5) out.push(n);
    for (const h of S.heroes) if (!h.inside && h.x > ZB.x0 - 5 && h.x < ZB.x1 + 5 && h.y > ZB.y0 - 5 && h.y < ZB.y1 + 5) out.push(h);
    return out;
  };
  const near = (a, who) => Math.hypot(a.x - who.x, a.y - who.y);
  const releaseFruit = (a) => { if (a.fruit && a.fruit.by === a.id) a.fruit.by = 0; a.fruit = null; };
  const startFlee = (a, sx, sy) => {
    if (!aliveAn(a) || a.hold) return;
    releaseFruit(a);
    const ang0 = Math.atan2(a.y - sy, a.x - sx); let best = null;
    if (a.sp === 'rabbit' && bushes.length) {
      let bd = 9; for (const b of bushes) { const d = Math.hypot(b[0] - a.x, b[1] - a.y); if (d < bd && d > 0.5 && Math.hypot(b[0] - sx, b[1] - sy) > 1.2) { bd = d; best = [b[0], b[1], 1]; } }
    }
    for (let i = 0; i < 9 && !best; i++) {
      const ang = ang0 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 0.5, d = rr(5, 8);
      for (let s = 1; s >= 0.35; s -= 0.2) { const px = a.x + Math.cos(ang) * d * s, py = a.y + Math.sin(ang) * d * s; if (okTile(px, py) && clear(a.x, a.y, px, py)) { best = [px, py, 0]; break; } }
    }
    if (!best) best = [a.x, a.y, 0];
    a.st = a.sp === 'bird' ? 'fly' : 'flee'; a.tx = best[0]; a.ty = best[1]; a.toBush = best[2]; a.t = 0; a.alert = 0; a.fx = a.x; a.fy = a.y; a.stuck = 0;
    a.tEnd = a.sp === 'bird' ? 99 : 3.5; a.dir = a.tx >= a.x ? 1 : -1;
  };
  const scare = (x, y, r) => { for (const a of B.an) if (aliveAn(a) && a.st !== 'flee' && a.st !== 'fly' && a.st !== 'hide' && Math.hypot(a.x - x, a.y - y) < r) startFlee(a, x, y); };
  const move = (a, tx, ty, spd, dt) => {
    const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
    if (d < 0.07) return true;
    const s = Math.min(d, spd * dt), nx = a.x + (dx / d) * s, ny = a.y + (dy / d) * s;
    if (okTile(nx, ny)) { a.x = nx; a.y = ny; a.stuck = 0; }
    else if (okTile(nx, a.y)) { a.x = nx; a.stuck += dt; }
    else if (okTile(a.x, ny)) { a.y = ny; a.stuck += dt; }
    else a.stuck += dt * 3;
    if (Math.abs(dx) > 0.04) a.dir = dx > 0 ? 1 : -1;
    return d <= s + 0.03;
  };
  const wanderTo = (a, r) => {
    for (let i = 0; i < 8; i++) { const ang = rr(0, 6.283), d = rr(1.2, r), x = a.x + Math.cos(ang) * d, y = a.y + Math.sin(ang) * d; if (okTile(x, y) && clear(a.x, a.y, x, y)) { a.tx = x; a.ty = y; return true; } }
    return false;
  };
  const nearestFruit = (a, maxD) => {
    let best = null, bd = maxD;
    for (const f of B.fr) { if (f.st === 'fall' || f.gone || (f.by && f.by !== a.id)) continue; const d = Math.hypot(f.x - a.x, f.y - a.y); if (d < bd && clear(a.x, a.y, f.x, f.y)) { bd = d; best = f; } }
    return best;
  };
  const decide = (a) => {
    a.t = 0;
    const lazy = calm() ? 1.8 : 1;
    if (a.hunger > 0.35) { const f = nearestFruit(a, 11); if (f) { a.fruit = f; f.by = a.id; a.st = 'seek'; a.tx = f.x; a.ty = f.y; a.stuck = 0; return; } }
    const r = rnd();
    if (a.sp === 'bird') { if (r < 0.5) { a.st = 'peck'; a.tEnd = rr(1.5, 4) * lazy; } else if (r < 0.8 && wanderTo(a, 3)) { a.st = 'wander'; a.tEnd = 6; } else { a.st = 'idle'; a.tEnd = rr(1.5, 3) * lazy; } return; }
    if (r < 0.32) { a.st = 'graze'; a.tEnd = rr(3, 7) * lazy; }
    else if (r < 0.78 && wanderTo(a, a.sp === 'rabbit' ? 3.5 : 6)) { a.st = 'wander'; a.tEnd = 14; a.hop = 0; }
    else { a.st = 'idle'; a.tEnd = rr(1.5, 4.5) * lazy; }
  };
  const animalTick = (a, dt, ppl) => {
    a.ph += dt; a.t += dt; a.hunger = Math.min(1.3, a.hunger + dt / 75);
    if (a.age < ADULT) a.age = Math.min(ADULT, a.age + dt / 110);
    if (a.st === 'dead' || a.st === 'carried') { if (a.st === 'dead') a.hp += dt; return; }
    const sp = SPD[a.sp];
    /* medo: gente a menos de ~2 tiles; a partir de ~4,6 só fica de olho */
    a.thk -= dt;
    if (a.thk <= 0 && !a.hold) {
      a.thk = 0.18; let md = 99, who = null;
      for (const p of ppl) { const d = near(a, p); if (d < md) { md = d; who = p; } }
      if (who && a.st !== 'flee' && a.st !== 'fly' && a.st !== 'hide') {
        if (md < FEAR) startFlee(a, who.x, who.y);
        else if (md < WATCH && (a.st === 'idle' || a.st === 'graze' || a.st === 'eat' || a.st === 'wander' || a.st === 'peck' || a.st === 'seek')) { releaseFruit(a); a.st = 'alert'; a.t = 0; a.tEnd = rr(1.2, 2.2); a.dir = who.x >= a.x ? 1 : -1; }
      } else if (who && a.st === 'hide' && md < 3) a.t = Math.min(a.t, a.tEnd - 2);
    }
    if (a.hold) { if (a.st !== 'alert') { a.st = 'alert'; } return; }
    switch (a.st) {
      case 'idle': case 'graze': case 'peck': if (a.t >= a.tEnd) decide(a); break;
      case 'alert': if (a.t >= a.tEnd) { a.st = 'idle'; a.t = 0; a.tEnd = rr(0.8, 1.8); } break;
      case 'wander': {
        let s = sp[0];
        if (a.sp === 'rabbit') { a.hop = (a.hop + dt * 2.7) % 1; s = a.hop < 0.6 ? 2.4 : 0; if (calm()) s *= 0.7; }
        if (move(a, a.tx, a.ty, s, dt) || a.t > a.tEnd || a.stuck > 1.2) { a.st = 'idle'; a.t = 0; a.tEnd = rr(1, 3); a.stuck = 0; }
        break;
      }
      case 'seek': {
        const f = a.fruit;
        if (!f || f.gone || f.by !== a.id) { a.fruit = null; a.st = 'idle'; a.t = 0; a.tEnd = 0.6; break; }
        let s = sp[0] * 1.25; if (a.sp === 'rabbit') { a.hop = (a.hop + dt * 2.9) % 1; s = a.hop < 0.6 ? 2.6 : 0; }
        if (move(a, f.x, f.y - 0.06, s, dt) || Math.hypot(f.x - a.x, f.y - a.y) < 0.28) { a.st = 'eat'; a.t = 0; a.tEnd = rr(1.8, 3); a.dir = f.x >= a.x ? 1 : a.dir; }
        else if (a.stuck > 1.5 || a.t > 25) { releaseFruit(a); a.st = 'idle'; a.t = 0; a.tEnd = 0.6; a.hunger = Math.max(0, a.hunger - 0.2); }
        break;
      }
      case 'eat':
        if (a.t >= a.tEnd) { const f = a.fruit; if (f && !f.gone) { f.gone = true; B.stats.eaten++; a.hunger = Math.max(0, a.hunger - 0.65); crumbs(f.x, f.y, f.col); } a.fruit = null; a.st = 'idle'; a.t = 0; a.tEnd = rr(1, 2.5); }
        break;
      case 'flee': {
        let s = sp[1] * (a.sp === 'rabbit' ? 0.9 : 1); if (a.sp === 'rabbit') a.hop = (a.hop + dt * 4.2) % 1;
        const done = move(a, a.tx, a.ty, s, dt);
        if (done || a.t > a.tEnd || a.stuck > 0.8) { if (a.toBush && done) { a.st = 'hide'; a.t = 0; a.tEnd = rr(4, 7); } else { a.st = 'alert'; a.t = 0; a.tEnd = rr(1.4, 2.4); } }
        break;
      }
      case 'hide': if (a.t >= a.tEnd) { a.st = 'alert'; a.t = 0; a.tEnd = 1.2; } break;
      case 'fly': {
        const done = move(a, a.tx, a.ty, sp[1], dt), tot = Math.max(1, Math.hypot(a.tx - a.fx, a.ty - a.fy)), k = clamp(Math.hypot(a.x - a.fx, a.y - a.fy) / tot, 0, 1);
        a.z = Math.sin(k * Math.PI) * 16 + 2;
        if (done || a.stuck > 0.6) { a.st = 'idle'; a.z = 0; a.t = 0; a.tEnd = rr(1, 2.5); }
        break;
      }
    }
  };
  const crumbs = (x, y, col) => {
    if (low() || R.parts.length > 500) return;
    for (let i = 0; i < 4; i++) R.parts.push({ x: x + rr(-0.15, 0.15), y: y - 0.1, vx: rr(-0.5, 0.5), vy: rr(-0.9, -0.3), life: rr(0.35, 0.6), max: 0.6, c: col ? '#f0d060' : '#e05a46', size: 1, g: 6 });
  };

  /* ================= nascimentos ================= */
  const births = (dt) => {
    const gf = groundFruit(), hungry = B.an.reduce((s, a) => s + a.hunger, 0) / Math.max(1, B.an.length);
    if (gf >= 3 && hungry < 0.65) B.bt += dt; else B.bt = Math.max(0, B.bt - dt * 0.5);
    if (B.bt < 90) return;
    B.bt = 0;
    const opts = [];
    if (popCount() < CAP) {
      const d = adults('deer'), r = adults('rabbit'), b = adults('boar');
      if (d.some((a) => a.sex === 'm') && d.some((a) => a.sex === 'f')) opts.push('deer');
      if (r.length >= 2) opts.push('rabbit', 'rabbit');
      if (b.length >= 2) opts.push('boar');
    }
    if (B.an.filter((a) => a.sp === 'bird' && aliveAn(a)).length < BIRDS) opts.push('bird');
    if (!opts.length) return;
    const sp = pk(opts), mom = pk(adults(sp)) || null;
    const a = spawn(sp, rnd() < 0.5 ? 'm' : 'f', sp === 'bird' ? 2 : 0, mom ? mom.x + rr(-0.6, 0.6) : undefined, mom ? mom.y + rr(0.2, 0.8) : undefined);
    if (!okTile(a.x, a.y) && mom) { a.x = mom.x; a.y = mom.y; }
    B.stats.born++;
  };

  /* ================= Zeno, o caçador ================= */
  const REW = { deer: { couro: 2, refeicao: 3 }, boar: { couro: 2, presa: 1, refeicao: 4 }, rabbit: { refeicao: 1 } };
  const NAME = { deer: 'um cervo', boar: 'um javali', rabbit: 'um coelho' };
  const zeno = () => { if (B.zn && G.npcs.indexOf(B.zn) >= 0) return B.zn; B.zn = G.npcs.find((n) => n.name === 'Zeno') || null; return B.zn; };
  const canShoot = (a) => {
    if (!aliveAn(a) || a.sp === 'bird' || a.age < ADULT || a.hold || !(a.st === 'idle' || a.st === 'graze' || a.st === 'eat' || a.st === 'wander' || a.st === 'seek' || a.st === 'alert')) return false;
    const ad = adults(a.sp), keep = a.sp === 'rabbit' ? 3 : 2;
    if (ad.length <= keep) return false;                                                // nunca o último: sempre sobram reprodutores
    if (a.sp === 'deer' && ad.filter((b) => b.sex === a.sex).length <= 1) return false;  // e sempre um macho e uma fêmea
    return true;
  };
  const pickPrey = (n) => {
    const c = B.an.filter(canShoot); if (!c.length) return null;
    const wts = c.map((a) => (a.sp === 'deer' ? 1.6 : a.sp === 'boar' ? 1.1 : 0.8) / (10 + Math.hypot(a.x - n.x, a.y - n.y)));
    let tot = 0; for (const w of wts) tot += w; let r = rnd() * tot;
    for (let i = 0; i < c.length; i++) { r -= wts[i]; if (r <= 0) return c[i]; }
    return c[c.length - 1];
  };
  const zgo = (n, x, y) => { const f = W._npc; W._npc = true; try { G.go(n, x, y); } finally { W._npc = f; } };
  const dropSpot = () => { const p = L.pile.lenharia; return [p[0] - 1.25, p[1] + 0.35]; };
  const hunting = (S) => { const hr = S.clock / 60; return hr >= 6 && hr < 17 && !S.mare.active && G.bLvl('lenharia') > 0 && G.bOk('lenharia'); };
  const endHunt = (n, why) => {
    const H = B.hunt; if (!H) return;
    if (H.prey && H.prey.st === 'carried') H.prey.gone = true;
    if (H.prey) { H.prey.hold = 0; }
    B.hunt = null; B.cd = G.S.t + (why === 'miss' ? 35 : 25);
    n._hunt = 0; n._sc = 0; n._wk = 0; n.w = null; n.state = 'stand'; n.act = ''; n.until = 0; n.tThink = 0; n.moving = false; n.path = null; n.crouch = 0; n.inside = false;
  };
  const startHunt = (n, prey) => {
    n._sc = 1; n._wk = 1; n.w = { site: 'lenharia', ph: 'hunt', t: 0 }; n._hunt = 1; n.inside = false; n.carry = null; n.talk = 0; n.say = null; n.sayT = 0; n.moving = false; n.path = null;
    B.hunt = { ph: 'approach', t: 0, prey, re: 0, shootD: rr(4.1, 5.0), pull: 0, aimT: 1.2, hit: false, wait: 0, rew: false, k: 0 };
    zgo(n, prey.x, prey.y);
  };
  const deliver = (n, a) => {
    const rw = REW[a.sp]; if (!rw) return;
    let i = 0, txt = [];
    for (const id in rw) {
      G.addRes(id, rw[id]);
      G.addFx({ t: 'text', x: n.x + 0.15, y: n.y - 1.5 - i * 0.55, s: '+' + rw[id] + ' ' + ((G.RES[id] && G.RES[id].name) || id), c: id === 'couro' ? '#ffd08a' : id === 'presa' ? '#fff2d2' : '#ffe07a' });
      txt.push(rw[id] + ' ' + ((G.RES[id] && G.RES[id].name) || id).toLowerCase()); i++;
    }
    G.log('Zeno entregou ' + NAME[a.sp] + ' na Lenharia (' + txt.join(', ') + ').', 'info');
    B.stats.delivered++;
  };
  const kill = (a) => { a.st = 'dead'; a.hp = 0; a.hold = 0; a.t = 0; a.z = 0; releaseFruit(a); B.stats.hit++; puff(a.x, a.y - 0.2, 5, ['#d8c8a0', '#a89870']); scare(a.x, a.y, 7); a.st = 'dead'; };
  const puff = (x, y, n, cols) => {
    if (low() || R.parts.length > 500) return;
    for (let i = 0; i < n; i++) R.parts.push({ x: x + rr(-0.2, 0.2), y, vx: rr(-0.4, 0.4), vy: rr(-0.5, -0.1), life: rr(0.5, 0.9), max: 0.9, c: pk(cols), size: 2, g: -0.1, kind: 'puff' });
  };
  const huntTick = (n, dt) => {
    const H = B.hunt, S = G.S; H.t += dt;
    const p = H.prey, out = !hunting(S) && !(H.ph === 'fetch' || H.ph === 'lift' || H.ph === 'carry' || H.ph === 'drop');
    if (S.mare.active || G.bLvl('lenharia') <= 0) return endHunt(n, 'abort');
    if (out && H.ph !== 'wait') return endHunt(n, 'late');
    n.crouch = 0;
    const gone = () => !p || !aliveAn(p) || p.st === 'flee' || p.st === 'fly' || p.st === 'hide';
    switch (H.ph) {
      case 'approach': {
        if (!p || !aliveAn(p)) return endHunt(n, 'lost');
        const d = Math.hypot(n.x - p.x, n.y - p.y);
        if (d <= 9.5 && p.st !== 'flee') { H.ph = 'stalk'; H.t = 0; H.re = 0; n.path = null; break; }
        H.re -= dt; if (H.re <= 0 || !n.path || !n.path.length) { H.re = 1.5; zgo(n, p.x, p.y); }
        G.step(n, dt, n.spd * 1.12);
        if (H.t > 90) return endHunt(n, 'lost');
        break;
      }
      case 'stalk': {
        if (gone()) return endHunt(n, 'lost');
        const d = Math.hypot(n.x - p.x, n.y - p.y);
        if (d <= H.shootD + 0.2 && W.los(n.x, n.y - 0.1, p.x, p.y)) { H.ph = 'aim'; H.t = 0; H.aimT = rr(1.1, 1.5); n.moving = false; n.path = null; n.dir = p.x >= n.x ? 1 : -1; p.hold = 1; p.st = 'alert'; p.dir = n.x >= p.x ? 1 : -1; break; }
        H.re -= dt;
        if (H.re <= 0) { H.re = 0.6; if (d <= H.shootD + 0.2) H.shootD = Math.max(2.6, H.shootD - 0.6); const ux = (n.x - p.x) / d, uy = (n.y - p.y) / d; zgo(n, p.x + ux * H.shootD * 0.85, p.y + uy * H.shootD * 0.85); }
        G.step(n, dt, n.spd * 0.5); n.crouch = 1;
        if (H.t > 30) return endHunt(n, 'lost');
        break;
      }
      case 'aim': {
        n.moving = false; n.dir = p.x >= n.x ? 1 : -1; p.hold = 1; p.st = 'alert';
        H.pull = clamp(H.t / H.aimT, 0, 1);
        if (!aliveAn(p) || Math.hypot(n.x - p.x, n.y - p.y) < 2.1) { p.hold = 0; return endHunt(n, 'lost'); }
        if (H.t >= H.aimT) {
          H.hit = rnd() < 0.7; B.stats.shot++;
          const d = Math.hypot(p.x - n.x, p.y - n.y), ex = H.hit ? p.x : p.x + (p.x - n.x) / d * rr(0.5, 1.4) + rr(-0.5, 0.5), ey = H.hit ? p.y : p.y + (p.y - n.y) / d * rr(0.3, 1.0) + rr(-0.4, 0.4);
          B.arrows.push({ x0: n.x + n.dir * 0.55, y0: n.y - 0.02, h0: 1.0, x1: ex, y1: ey, h1: H.hit ? 0.5 : 0.0, t: 0, dur: clamp(d / 17, 0.16, 0.5), hit: H.hit, prey: p, tr: [] });
          H.ph = 'loose'; H.t = 0;
        }
        break;
      }
      case 'loose': {
        n.moving = false; H.pull = 0;
        if (!B.arrows.some((q) => q.prey === p && !q.done)) {
          if (H.hit && aliveAn(p) && p.st === 'dead') { H.ph = 'fetch'; H.t = 0; zgo(n, p.x, p.y + 0.1); }
          else if (p.st === 'dead') { H.ph = 'fetch'; H.t = 0; zgo(n, p.x, p.y + 0.1); }
          else { H.ph = 'wait'; H.t = 0; H.wait = rr(10, 16); H.prey = null; }
        }
        break;
      }
      case 'fetch': {
        if (!p || p.st !== 'dead') return endHunt(n, 'lost');
        if (Math.hypot(n.x - p.x, n.y - p.y) < 0.95) { H.ph = 'lift'; H.t = 0; n.moving = false; n.path = null; n.dir = p.x >= n.x ? 1 : -1; break; }
        if (!n.path || !n.path.length) zgo(n, p.x, p.y + 0.1);
        G.step(n, dt, n.spd * 1.1);
        break;
      }
      case 'lift': {
        n.moving = false;
        if (H.t >= 0.55 && p.st === 'dead') p.st = 'carried';
        if (H.t >= 0.9) { H.ph = 'carry'; H.t = 0; const d = dropSpot(); zgo(n, d[0], d[1]); }
        break;
      }
      case 'carry': {
        if (G.step(n, dt, n.spd * 0.88)) { H.ph = 'drop'; H.t = 0; n.moving = false; n.dir = 1; }
        else if (!n.path || !n.path.length) { const d = dropSpot(); zgo(n, d[0], d[1]); }
        if (H.t > 90) return endHunt(n, 'lost');
        break;
      }
      case 'drop': {
        n.moving = false;
        if (H.t >= 0.4 && !H.rew) { H.rew = true; deliver(n, p); }
        if (H.t >= 1.0) { p.gone = true; H.ph = 'wait'; H.t = 0; H.wait = rr(14, 22); H.prey = null; }
        break;
      }
      case 'wait': {
        n.moving = false;
        if (!hunting(S)) return endHunt(n, 'late');
        if (H.t >= H.wait) {
          const q = pickPrey(n);
          if (q) { H.prey = q; H.ph = 'approach'; H.t = 0; H.re = 0; H.shootD = rr(4.1, 5.0); H.rew = false; zgo(n, q.x, q.y); }
          else if (H.t > H.wait + 50) return endHunt(n, 'none');
        }
        break;
      }
    }
  };
  const arrowTick = (dt) => {
    for (let i = B.arrows.length - 1; i >= 0; i--) {
      const q = B.arrows[i]; q.t += dt;
      const k = clamp(q.t / q.dur, 0, 1); q.x = lerp(q.x0, q.x1, k); q.y = lerp(q.y0, q.y1, k); q.h = lerp(q.h0, q.h1, k) + Math.sin(k * Math.PI) * 0.12;
      if (!low()) { q.tr.push([q.x, q.y, q.h]); if (q.tr.length > 9) q.tr.shift(); }
      if (q.t >= q.dur && !q.done) {
        q.done = true;
        const a = q.prey;
        if (q.hit && a && aliveAn(a)) kill(a);
        else { B.stuck.push({ x: q.x1, y: q.y1, h: 0, dx: q.x1 - q.x0, t: 0 }); if (a) { a.hold = 0; if (aliveAn(a)) startFlee(a, q.x0, q.y0); } scare(q.x1, q.y1, 5.5); }
      }
      if (q.done) B.arrows.splice(i, 1);
    }
    for (let i = B.stuck.length - 1; i >= 0; i--) { B.stuck[i].t += dt; if (B.stuck[i].t > 7) B.stuck.splice(i, 1); }
  };

  /* ================= o tique ================= */
  let sub = 0;
  const step1 = (dt) => {
    const S = G.S;
    B.t += dt;
    for (const tr of B.ft) treeTick(tr, dt);
    /* lenhador derrubando: o susto */
    for (const t of L.trees) { if (t.st === 'fall' && !t._bsScared) { t._bsScared = 1; scare(t.x, t.y, 8); } else if (t.st === 'tree') t._bsScared = 0; }
    fruitTick(dt);
    const ppl = people();
    for (const a of B.an) animalTick(a, dt, ppl);
    for (let i = B.an.length - 1; i >= 0; i--) { const a = B.an[i]; if (a.gone || (a.st === 'dead' && a.hp > 60)) B.an.splice(i, 1); }
    births(dt); arrowTick(dt);
    const n = zeno();
    if (n) {
      if (B.hunt) { n._wk = 1; n._sc = 1; n._hunt = 1; n.inside = false; huntTick(n, dt); }
      else if (hunting(S) && S.t >= B.cd && !n._sc) {
        const q = pickPrey(n); if (q) startHunt(n, q); else B.cd = S.t + 6;
      }
    }
  };
  G.hook('tick', (dt) => {
    if (G.HEADLESS || G.OFFLINE || !G.S) return;
    if (B.S !== G.S || (!mask && W.ready)) reset();
    if (!tiles.length || L.S !== G.S) return;
    if (G.bLvl('lenharia') <= 0) { if (B.hunt) { const n = zeno(); if (n) endHunt(n, 'abort'); } return; }
    dt = Math.min(dt, 1.2); sub = dt;
    const n = Math.max(1, Math.ceil(dt / 0.1)); for (let i = 0; i < n; i++) step1(dt / n);
  }, 150);
  G.hook('newGame', () => { B.S = null; }, 150);
  G.hook('afterLoad', () => { B.S = null; }, 150);

  /* ================= arte ================= */
  const PAL = {
    stag: { main: '#a86e3e', dark: '#74482a', light: '#cc9a62', belly: '#e6cfa6', hoof: '#2a2020', antler: '#eadfc2', antlerD: '#b4a484', nose: '#2e2424', tail: '#f2ead8' },
    doe: { main: '#b98652', dark: '#85583a', light: '#d9ae7a', belly: '#ecd8b2', hoof: '#2a2020', nose: '#2e2424', tail: '#f2ead8' },
    fawn: { main: '#c48e56', dark: '#8c5c38', light: '#e0b682', belly: '#f0dcb8', hoof: '#3a2c28', nose: '#2e2424', tail: '#f6eedc', spot: '#fff2d4' },
    boar: { main: '#5c4a44', dark: '#3a2c2a', light: '#80685c', belly: '#8a7468', hoof: '#201a1a', nose: '#b88a84', tusk: '#f6efd8', mane: '#2a201e', tail: '#3a2c2a' },
    piglet: { main: '#b99264', dark: '#7a5836', light: '#d8b888', belly: '#ecd4aa', hoof: '#3a2a22', nose: '#d4a09a', stripe: '#5a3e26', tail: '#7a5836' },
    rabbit: { main: '#a99172', dark: '#72593c', light: '#d2bf9e', belly: '#f2eee2', ear: '#e6a6a0', nose: '#d68a86' },
    kit: { main: '#bca88a', dark: '#85694a', light: '#dccdae', belly: '#f6f2e8', ear: '#eab0aa', nose: '#d68a86' },
    bird: { back: '#6c7a8e', wing: '#46546a', wingL: '#94a4b8', head: '#586478', breast: '#e2703a', belly: '#f2dcb2', beak: '#f2bc3c' },
  };
  const rot = (vx, vy, th) => [vx * Math.cos(th) - vy * Math.sin(th), vx * Math.sin(th) + vy * Math.cos(th)];

  /* quadrúpedes (cervo, corça, filhote, javali, leitão): unidades do adulto, escala s para filhotes */
  const QUAD = {
    deer: { W: 36, H: 39, gy: 35, body: [13.5, 22.5, 8.6, 4.4], rump: [7.6, 22.5, 4.5, 4.7], chest: [19.5, 22, 4.2, 4.5], hipF: 19.5, hipB: 7.6, hipY: 25, neck: [20.5, 19.5],
      heads: { stand: [26.5, 13, 0.18], stand1: [26.5, 13.8, 0.22], walk: [26.5, 13.6, 0.25], alert: [27.5, 10, -0.1], graze: [27, 31, 1.12], graze1: [27.5, 30.4, 1.0], run: [29, 17.5, 0.5] }, tail: [4.2, 20] },
    boar: { W: 32, H: 25, gy: 22, body: [11.5, 13.5, 8.8, 5.6], rump: [6.6, 14, 4.8, 5.4], chest: [16.6, 13.6, 4.6, 5.4], hipF: 16.8, hipB: 6.8, hipY: 17, neck: [18, 12.5],
      heads: { stand: [22.5, 14.5, 0.1], stand1: [22.5, 15.1, 0.14], walk: [22.8, 15, 0.12], alert: [23, 12.5, -0.1], graze: [24, 20, 0.7], graze1: [24.4, 19.4, 0.62], run: [24, 14.5, 0.2] }, tail: [3, 12] },
  };
  const legSet = (pose) => {
    const m = /^(walk|run|stand|graze|alert)(\d)?$/.exec(pose) || [0, 'stand', '0'], k = +(m[2] || 0);
    if (m[1] === 'walk') { const s = [3, 1, -3, -1][k]; return { fn: [s, k === 3 ? 2 : 0], ff: [-s, k === 1 ? 2 : 0], bn: [-s, k === 1 ? 2 : 0], bf: [s, k === 3 ? 2 : 0], by: k & 1 ? 0 : 0.6 }; }
    if (m[1] === 'run') return k === 0 ? { fn: [5, 3], ff: [3.5, 4.5], bn: [-5.5, 3], bf: [-3.5, 4], by: -1.5 } : { fn: [-1, 4.5], ff: [-2.5, 5], bn: [2, 4.5], bf: [0.5, 5], by: -1.5 };
    if (m[1] === 'graze') return { fn: [2.2, 0], ff: [-1, 0], bn: [-1, 0], bf: [1, 0], by: 0 };
    if (m[1] === 'alert') return { fn: [1, 2], ff: [-1, 0], bn: [-1, 0], bf: [1, 0], by: 0 };
    return { fn: [0.8, 0], ff: [-0.8, 0], bn: [-0.8, 0], bf: [0.8, 0], by: 0 };
  };
  const quadSprite = (kind, vari, pose) => {
    const g = QUAD[kind], juv = vari === 'fawn' || vari === 'piglet', s = juv ? (kind === 'deer' ? 0.64 : 0.56) : 1;
    const pal = PAL[vari], W2 = Math.ceil(g.W * s) + 2, H2 = Math.ceil(g.H * s) + 2, p = new Pix(W2, H2);
    const u = (v) => v * s, E = (cx, cy, rx, ry, c) => p.ell(u(cx), u(cy), Math.max(1.1, u(rx)), Math.max(1.1, u(ry)), c);
    const ls = legSet(pose), hd = g.heads[pose.replace(/^walk\d/, 'walk').replace(/^run\d/, 'run').replace(/^graze(\d)/, (m0, d) => (d === '1' ? 'graze1' : 'graze')).replace(/^stand(\d)/, (m0, d) => (d === '1' ? 'stand1' : 'stand'))] || g.heads.stand;
    const by = ls.by * s, thick = s > 0.7 ? 2 : 1, gy = u(g.gy);
    const leg = (hx, d, col, hoof) => {
      const x0 = u(hx), y0 = u(g.hipY) + by, x1 = x0 + u(d[0]), y1 = gy - u(d[1]) * 1;
      if (kind === 'deer') { const kx = x0 + (x1 - x0) * 0.5 + (hx < 12 ? -u(1.2) : u(0.4)), ky = y0 + (y1 - y0) * 0.5; p.line(x0, y0, kx, ky, col); p.line(kx, ky, x1, y1, col); if (thick > 1) { p.line(x0 + 1, y0, kx + 1, ky, col); p.line(kx + 1, ky, x1 + 1, y1, col); } }
      else { p.line(x0, y0, x1, y1, col); if (thick > 1) p.line(x0 + 1, y0, x1 + 1, y1, col); if (thick > 1) p.line(x0 + 2, y0, x1 + 2, y1, col); }
      p.set(x1, y1, hoof); if (thick > 1) p.set(x1 + 1, y1, hoof); if (kind === 'boar' && thick > 1) p.set(x1 + 2, y1, hoof);
    };
    const dk = sh(pal.main, 0.74);
    leg(g.hipF - 1.6, ls.ff, dk, pal.hoof); leg(g.hipB + 1.4, ls.bf, dk, pal.hoof);
    /* cauda */
    if (kind === 'deer') { const tx = u(g.tail[0]), ty = u(g.tail[1]) + by; p.ell(tx, ty + 1, 1.5, 2.2, pal.tail); p.set(tx + 1, ty + 2, pal.main); }
    else { const tx = u(g.tail[0]), ty = u(g.tail[1]) + by; p.line(tx + 1, ty + 1, tx - 1, ty - 1, pal.dark); p.set(tx - 2, ty - 1, pal.dark); }
    /* corpo */
    E(g.body[0], g.body[1] + ls.by, g.body[2], g.body[3], pal.main); E(g.rump[0], g.rump[1] + ls.by, g.rump[2], g.rump[3], pal.main); E(g.chest[0], g.chest[1] + ls.by, g.chest[2], g.chest[3], pal.main);
    E(g.body[0] + 0.5, g.body[1] + ls.by + g.body[3] * 0.62, g.body[2] * 0.72, g.body[3] * 0.38, pal.belly);
    E(g.body[0], g.body[1] + ls.by - g.body[3] * 0.62, g.body[2] * 0.7, g.body[3] * 0.3, pal.light);
    if (kind === 'deer' && !juv) { E(g.rump[0] - 1.2, g.rump[1] + ls.by - 0.8, 2, 2.4, pal.dark); }
    if (juv && vari === 'fawn') for (const [sx, sy] of [[8, 19], [11, 18.3], [14, 18.8], [17, 19.2], [10, 21], [15, 21]]) p.set(u(sx), u(sy) + by, pal.spot);
    if (vari === 'piglet') for (let i = 0; i < 4; i++) p.line(u(7 + i * 3.2), u(9.4) + by, u(7.6 + i * 3.2), u(15.6) + by, pal.stripe);
    if (kind === 'boar' && !juv) { for (let i = 0; i < 9; i++) { const x = u(6 + i * 1.4), y = u(8.7 - Math.sin(i / 8 * Math.PI) * 0.4) + by; p.set(x, y, pal.mane); p.set(x, y - 1, pal.mane); if (i % 2) p.set(x, y - 2, pal.mane); } }
    leg(g.hipF + 1.0, ls.fn, pal.main, pal.hoof); leg(g.hipB - 1.2, ls.bn, pal.main, pal.hoof);
    /* pescoço e cabeça */
    const hx = u(hd[0]), hy = u(hd[1]) + by * 0.5, th = hd[2];
    if (kind === 'deer') {
      const nx = u(g.neck[0]), ny = u(g.neck[1]) + by; p.line(nx, ny, hx - 1, hy + 1, pal.main); p.line(nx, ny + 1, hx - 1, hy + 2, pal.main); p.line(nx + 1, ny, hx, hy + 1, pal.main); p.line(nx - 1, ny + 1, hx - 2, hy + 2, pal.main); p.line(nx, ny + 2, hx - 1, hy + 3, pal.belly);
      if (vari === 'stag') { p.line(nx + 1, ny - 1, hx - 1, hy - 0.5, pal.dark); p.line(nx, ny - 1, hx - 2, hy, pal.dark); }
    } else { const nx = u(g.neck[0]), ny = u(g.neck[1]) + by; p.ell((nx + hx) / 2 - 1, (ny + hy) / 2, Math.max(2, u(3.8)), Math.max(2, u(4)), pal.main); }
    const part = (vx, vy) => { const r = rot(u(vx), u(vy), th); return [hx + r[0], hy + r[1]]; };
    if (vari === 'stag') {                                                                          // galhada: haste, pontas e a segunda, mais escura, ao fundo
      const A1 = [[-1, -2, -2.6, -6.4], [-2.6, -6.4, -3.4, -10.5], [-1.9, -4.4, 1, -7.4], [-2.9, -8.2, -6, -9.6], [-2.9, -8.2, 0.2, -11.4], [-3.4, -10.5, -3.6, -13]];
      for (const [x0, y0, x1, y1] of A1) { const a0 = part(x0 + 2.4, y0 + 0.4), b0 = part(x1 + 2.4, y1 + 0.4); p.line(a0[0], a0[1], b0[0], b0[1], pal.antlerD); }
      for (const [x0, y0, x1, y1] of A1) { const a0 = part(x0, y0), b0 = part(x1, y1); p.line(a0[0], a0[1], b0[0], b0[1], pal.antler); }
    }
    if (kind === 'deer') {
      const hc = part(0, 0), mz = part(3.2, 0.9), ear = part(-1.2, -1.6), ear2 = part(-3.4, -4.4);
      p.ell(hc[0], hc[1], Math.max(1.5, u(3)), Math.max(1.4, u(2.1)), pal.main); p.ell(mz[0], mz[1], Math.max(1.2, u(2.4)), Math.max(1.1, u(1.5)), pal.light);
      const ns = part(5.2, 1.1); p.set(ns[0], ns[1], pal.nose);
      p.tri(ear[0], ear[1], ear2[0], ear2[1], ear[0] + 1.6, ear[1] + 0.4, pal.main); p.set(ear2[0], ear2[1], pal.dark);
      const ey = part(1.2, -0.6); p.set(ey[0], ey[1], '#1a1218');
    } else {
      const hc = part(0, 0), sn = part(3.6, 1.2), ear = part(-1, -2.8), tk = part(3.4, 2.6);
      p.ell(hc[0], hc[1], Math.max(1.6, u(3.6)), Math.max(1.5, u(3)), pal.main); p.ell(sn[0], sn[1], Math.max(1.3, u(2.5)), Math.max(1.2, u(1.8)), pal.nose);
      p.tri(ear[0] - 1, ear[1] + 1.6, ear[0] + 1.6, ear[1] - 1.8, ear[0] + 2.4, ear[1] + 1.4, pal.dark);
      if (!juv) { p.set(tk[0], tk[1], pal.tusk); p.set(tk[0] + 1, tk[1] - 1, pal.tusk); }
      const ns = part(5.7, 1.0); p.set(ns[0], ns[1], '#2a1a1a'); const ey = part(1.4, -0.9); p.set(ey[0], ey[1], '#f4dca0');
    }
    return { cv: p.outline(INK).canvas(), w: W2, h: H2, ax: Math.round(u((g.hipF + g.hipB) / 2 + 0.5)) + 1, ay: Math.round(gy) + 1 };
  };

  const rabbitSprite = (vari, pose) => {
    const juv = vari === 'kit', s = juv ? 0.72 : 1, pal = PAL[vari], W2 = Math.ceil(18 * s) + 2, H2 = Math.ceil(19 * s) + 2, p = new Pix(W2, H2), u = (v) => v * s;
    const E = (cx, cy, rx, ry, c) => p.ell(u(cx), u(cy), Math.max(1, u(rx)), Math.max(1, u(ry)), c), Ln = (x0, y0, x1, y1, c) => p.line(u(x0), u(y0), u(x1), u(y1), c);
    const eye = (x, y) => p.set(u(x), u(y), '#1a1218');
    const m = /^(sit|hop|eat|alert)(\d)?$/.exec(pose) || [0, 'sit', '0'], k = +(m[2] || 0);
    if (m[1] === 'sit') {
      const nod = k ? 0.6 : 0;
      E(0.9, 15, 1.7, 1.7, pal.belly); E(7, 14, 5, 4.2, pal.main); E(5.2, 14.6, 3.4, 3.2, pal.dark); E(8, 15.5, 3, 1.8, pal.belly);
      E(11, 9.5 + nod, 3, 2.7, pal.main); E(13.3, 10.3 + nod, 1.7, 1.3, pal.light); p.set(u(14.9), u(10 + nod), pal.nose); eye(11.9, 8.6 + nod);
      Ln(9.8, 7.6, 8.4, 1.2, pal.main); Ln(10.8, 7.5, 9.8, 1.2, pal.main); Ln(9.2, 7.2, 8.8, 2.6, pal.ear); Ln(11.4, 7.4, 11.8, 1.6 + (k ? 0.8 : 0), pal.main); Ln(10.8, 7.4, 10.6, 2.4, pal.ear);
      Ln(10, 15.5, 12.6, 15.8, pal.dark);
    } else if (m[1] === 'hop') {
      if (k === 0) {                                                                              // no ar: esticado
        Ln(5.5, 11.5, 0.5, 14.6, pal.dark); Ln(5.5, 12.5, 0.5, 15.6, pal.dark); E(2.3, 10.8, 1.6, 1.5, pal.belly);
        E(8.5, 10.5, 5.8, 2.9, pal.main); E(7.2, 11.8, 3.4, 1.5, pal.belly); E(6.3, 9.3, 3.2, 1.4, pal.light);
        Ln(12, 12, 16.5, 13.8, pal.main); Ln(12, 13, 16.5, 14.8, pal.dark);
        E(14, 8.8, 2.8, 2.5, pal.main); E(16.4, 9.6, 1.7, 1.2, pal.light); p.set(u(17.6), u(9.6), pal.nose); eye(14.8, 8);
        Ln(12.6, 7.4, 7.4, 4.6, pal.main); Ln(12.9, 8, 7.8, 5.6, pal.dark);
      } else {                                                                                    // aterrissando: encolhido
        E(1.6, 14.4, 1.6, 1.6, pal.belly); E(7, 13.8, 5, 4, pal.main); E(5.4, 14.6, 3.4, 3.2, pal.dark); E(8, 15.8, 3, 1.5, pal.belly);
        E(12, 10.6, 2.9, 2.6, pal.main); E(14.4, 11.4, 1.7, 1.3, pal.light); p.set(u(15.8), u(11.4), pal.nose); eye(12.8, 9.8);
        Ln(10.8, 8.8, 7.6, 3.6, pal.main); Ln(11.8, 8.6, 9.8, 3, pal.main); Ln(10.5, 8.2, 8.6, 4.4, pal.ear);
        Ln(11, 15.6, 14, 16.3, pal.dark);
      }
    } else if (m[1] === 'eat') {
      const nib = k ? 0.8 : 0;
      E(1.4, 14.6, 1.7, 1.7, pal.belly); E(7, 13.6, 5, 4.2, pal.main); E(5.2, 14.2, 3.4, 3.2, pal.dark); E(8, 15.4, 3, 1.8, pal.belly);
      E(12, 14 + nib * 0.3, 2.9, 2.5, pal.main); E(14.4, 15 + nib * 0.4, 1.7, 1.3, pal.light); p.set(u(15.8), u(15.2 + nib * 0.4), pal.nose); eye(12.8, 13.2);
      Ln(10.6, 12.6, 6.6, 8.4, pal.main); Ln(11.6, 12.4, 8.4, 7.8, pal.main); Ln(10.4, 12.2, 7.4, 9, pal.ear);
      Ln(10, 16.5, 13, 16.6, pal.dark);
    } else {                                                                                      // em pé, alerta
      E(1.2, 15, 1.6, 1.7, pal.belly); E(6.2, 12.5, 3.8, 5.4, pal.main); E(4.8, 14.8, 2.6, 3, pal.dark); E(7.6, 12.6, 2, 3.6, pal.belly);
      E(9, 6.2, 2.7, 2.5, pal.main); E(11.4, 7, 1.6, 1.2, pal.light); p.set(u(12.8), u(7), pal.nose); eye(9.9, 5.4);
      Ln(7.8, 4.4, 6.8, -0.5, pal.main); Ln(8.8, 4.2, 8.4, -0.5, pal.main); Ln(8.2, 3.8, 7.6, 0.4, pal.ear); Ln(9.2, 3.6, 9, 0.2, pal.main);
      Ln(8, 16.2, 11, 16.6, pal.dark); Ln(9, 10.6, 10.2, 13, pal.main);
    }
    return { cv: p.outline(INK).canvas(), w: W2, h: H2, ax: Math.round(u(7)) + 1, ay: Math.round(u(16.6)) + 2 };
  };

  const birdSprite = (pose) => {
    const pal = PAL.bird, p = new Pix(14, 14), E = (cx, cy, rx, ry, c) => p.ell(cx, cy, rx, ry, c);
    const m = /^(stand|peck|fly)(\d)?$/.exec(pose) || [0, 'stand', '0'], k = +(m[2] || 0);
    if (m[1] === 'fly') {
      E(6, 7, 3.2, 2.2, pal.back); E(7.6, 8, 2.2, 1.4, pal.breast); E(9.6, 5.6, 1.7, 1.6, pal.head); p.set(11.4, 5.8, pal.beak); p.set(11.5, 5.8, pal.beak); p.set(10, 5.2, '#1a1218'); p.line(3, 7, 0, 8, pal.wing);
      if (k === 0) { p.tri(5, 6.5, 2.5, 0.5, 8, 6, pal.wing); p.tri(5, 6.5, 8.2, 1, 8, 6, pal.wingL); } else { p.tri(5, 8, 2.5, 12.5, 8, 8.5, pal.wing); p.tri(5, 8, 8.4, 12, 8, 8.5, pal.wingL); }
    } else {
      const dn = m[1] === 'peck' ? 1 : 0;
      p.line(4, 9, 4, 10.6, '#8a6a4a'); p.line(6.6, 9, 6.6, 10.6, '#8a6a4a');
      p.line(2, 6 + dn * 0.5, 0, 8.4, pal.wing);
      E(5.4, 6.8, 3.4, 2.8, pal.back); E(6.4, 7.9, 2.4, 1.6, pal.breast); E(4.6, 6.5, 2.2, 1.4, pal.wing);
      if (dn) { E(9.4, 8.8, 1.8, 1.6, pal.head); p.set(11.3, 10.2, pal.beak); p.set(11.4, 10.4, pal.beak); p.set(9.8, 8.2, '#1a1218'); }
      else { E(8.6, 4.6, 1.8, 1.7, pal.head); p.set(10.5, 4.9, pal.beak); p.set(10.6, 4.9, pal.beak); p.set(9, 4.1, '#1a1218'); }
    }
    return { cv: p.outline(INK).canvas(), w: 14, h: 14, ax: 6, ay: m[1] === 'fly' ? 8 : 11 };
  };

  const sprCache = new Map();
  const variOf = (a) => (a.sp === 'deer' ? (a.age < ADULT ? 'fawn' : a.sex === 'm' ? 'stag' : 'doe') : a.sp === 'boar' ? (a.age < ADULT ? 'piglet' : 'boar') : a.sp === 'rabbit' ? (a.age < ADULT ? 'kit' : 'rabbit') : 'bird');
  const spr = (a, pose) => {
    const vari = variOf(a), key = vari + '|' + pose; let s = sprCache.get(key);
    if (s) return s;
    if (a.sp === 'deer') s = quadSprite('deer', vari, pose); else if (a.sp === 'boar') s = quadSprite('boar', vari, pose); else if (a.sp === 'rabbit') s = rabbitSprite(vari, pose); else s = birdSprite(pose);
    sprCache.set(key, s); return s;
  };
  const poseOf = (a) => {
    const f = (r) => Math.floor(a.ph * r);
    const q = a.sp === 'deer' || a.sp === 'boar';
    switch (a.st) {
      case 'wander': return q ? 'walk' + (f(calm() ? 4 : 5.5) % 4) : a.sp === 'rabbit' ? (a.hop < 0.6 ? 'hop0' : 'hop1') : 'peck' + (f(5) % 2 === 0 ? 0 : 0);
      case 'seek': return q ? 'walk' + (f(6.5) % 4) : a.sp === 'rabbit' ? (a.hop < 0.6 ? 'hop0' : 'hop1') : 'stand0';
      case 'flee': return q ? 'run' + (f(9) % 2) : a.hop < 0.55 ? 'hop0' : 'hop1';
      case 'fly': return 'fly' + (f(16) % 2);
      case 'graze': case 'eat': return q ? 'graze' + (f(2.6) % 2) : a.sp === 'rabbit' ? 'eat' + (f(5) % 2) : 'peck0';
      case 'peck': return 'peck' + (f(3) % 2 ? 0 : 0);
      case 'alert': return q ? 'alert' : a.sp === 'rabbit' ? 'alert' : 'stand0';
      default: return q ? 'stand' + (f(1.1) % 2) : a.sp === 'rabbit' ? 'sit' + (f(1.3) % 2 && !calm() ? 1 : 0) : 'stand0';
    }
  };
  const shadow = (px, py, r, z, al) => { const ctx = R.ctx; ctx.fillStyle = 'rgba(10,16,30,' + (0.28 * (al == null ? 1 : al)) + ')'; ctx.beginPath(); ctx.ellipse(px, py, r * z, r * 0.42 * z, 0, 0, 6.283); ctx.fill(); };
  const SHR = { deer: 11, boar: 9.5, rabbit: 5, bird: 3.5 };
  const drawAnimal = (a, X, Y, z) => {
    if (a.st === 'carried' || a.gone) return;
    const ctx = R.ctx, px = Math.round(X(a.x)), py = Math.round(Y(a.y));
    if (a.st === 'hide') { ctx.fillStyle = INK; const e = Math.round(2.2 * z); ctx.fillRect(px - e, py - 5 * z, 2 * z, 3 * z); ctx.fillStyle = '#a99172'; ctx.fillRect(px - e + z * 0.5, py - 4.6 * z, z, 2.2 * z); return; }
    const dead = a.st === 'dead', s = spr(a, dead ? 'stand0' : poseOf(a));
    let lift = a.z || 0;
    if (a.sp === 'rabbit' && (a.st === 'wander' || a.st === 'seek' || a.st === 'flee')) lift += Math.sin(clamp(a.hop / 0.6, 0, 1) * Math.PI) * (a.st === 'flee' ? 4 : 3);
    ctx.imageSmoothingEnabled = false;
    shadow(px, py, (SHR[a.sp] * (a.age < ADULT ? 0.65 : 1)), z, lift > 0 ? 1 - Math.min(0.6, lift / 24) : 1);
    ctx.save(); ctx.translate(px, py - Math.round(lift * z));
    if (a.dir < 0) ctx.scale(-1, 1);
    if (dead) {
      const k = clamp(a.hp / 0.55, 0, 1), cy = -s.h * z * 0.38;
      ctx.translate(0, cy * (1 - k) + (-s.h * 0.18 * z) * k); ctx.rotate(Math.PI * k * 0.93); ctx.translate(0, -cy * 0.2);
      ctx.drawImage(s.cv, Math.round(-s.ax * z), Math.round(-s.ay * z + (s.h * 0.4) * z * (k > 0 ? 0 : 0)), s.w * z, s.h * z);
    } else {
      const sq = (a.sp === 'rabbit' || a.sp === 'deer' || a.sp === 'boar') && a.st === 'eat' && !calm() ? 0 : 0;
      ctx.drawImage(s.cv, Math.round(-s.ax * z), Math.round(-s.ay * z + sq), s.w * z, s.h * z);
    }
    ctx.restore();
  };

  /* frutos: maduro (vermelho ou amarelo, 5×5 com brilho), verde e botão (em crescimento) */
  const fruitSp = (col, stage) => {
    const key = 'f' + col + stage; let s = sprCache.get(key); if (s) return s;
    const p = new Pix(7, 7);
    if (stage === 2) {
      const m = col ? '#f2c63a' : '#d8402c', l = col ? '#fff29a' : '#ff9a7e', d = col ? '#b88a1c' : '#8e1e1e';
      p.ell(3.5, 4.4, 2.4, 2.2, m); p.set(2, 3, l); p.set(3, 3, l); p.set(2, 4, l); p.set(4, 6, d); p.set(3, 6, d); p.set(5, 5, d); p.set(5, 4, d); p.set(3, 1, '#5a3a1c'); p.set(4, 1, '#58a848'); p.set(5, 0, '#58a848');
    } else if (stage === 1) { p.ell(3.5, 4.4, 1.7, 1.6, col ? '#c8c04a' : '#b8c24a'); p.set(3, 3, '#e4e68a'); p.set(3, 6, '#8a8a2c'); p.set(3, 2, '#5a3a1c'); }
    else { p.ell(3.5, 4.4, 0.9, 0.9, '#8ac460'); p.set(3, 3, '#b4e088'); }
    s = { cv: p.outline(INK).canvas(), w: 7, h: 7 }; sprCache.set(key, s); return s;
  };
  const bounceH = (f) => { const t = f.t - 0.6; if (t < 0) return 0; if (t < 0.2) return Math.sin(t / 0.2 * Math.PI) * 4; if (t < 0.34) return Math.sin((t - 0.2) / 0.14 * Math.PI) * 1.8; return 0; };
  const drawFruitGround = (f, X, Y, z) => {
    if (f.gone || f.st === 'fall') return;
    const ctx = R.ctx, h = bounceH(f), px = Math.round(X(f.x)), py = Math.round(Y(f.y)), sp = fruitSp(f.col, 2);
    const left = f.life - f.age, al = left < 6 ? Math.max(0, left / 6) : 1;
    ctx.globalAlpha = al; ctx.fillStyle = 'rgba(10,16,30,.25)'; ctx.beginPath(); ctx.ellipse(px, py, 2.6 * z, 1.1 * z, 0, 0, 6.283); ctx.fill();
    ctx.drawImage(sp.cv, Math.round(px - 3.5 * z), Math.round(py - 6 * z - h * z), sp.w * z, sp.h * z); ctx.globalAlpha = 1;
  };
  const drawTreeFruit = (tr, X, Y, z) => {
    const ctx = R.ctx, px = Math.round(X(tr.x)), py = Math.round(Y(tr.y)), src = tr.src, k = src && src.sh > 0 ? src.sh / 0.32 : 0, jx = k > 0 ? Math.round(Math.sin(R.t * 70) * 1.4 * k) * z : 0;
    ctx.imageSmoothingEnabled = false;
    if (tr.on) for (const s of tr.slots) {
      if (s.st !== 'grow' || s.p < 0.12) continue;
      const stage = s.p >= 1 ? 2 : s.p > 0.55 ? 1 : 0; if (low() && stage < 2) continue;
      const sp = fruitSp(s.col, stage), sw = !calm() && s.p >= 1 && s.hold < 2 ? Math.round(Math.sin(R.t * 30) * 0.8) : 0;
      ctx.drawImage(sp.cv, Math.round(px + (s.ox - 3.5 + sw) * z + jx), Math.round(py + (s.oy - 3.5) * z), sp.w * z, sp.h * z);
    }
    for (const f of B.fr) {
      if (f.tr !== tr || f.st !== 'fall' || f.t < 0) continue;
      const k2 = clamp(f.t / 0.6, 0, 1), e = k2 * k2, sp = fruitSp(f.col, 2);
      const fx = lerp(tr.x * 16 + f.ox, f.x * 16, k2), fy = lerp(tr.y * 16 + f.oy, f.y * 16 - 3, e);
      ctx.drawImage(sp.cv, Math.round(X(0) + fx * z - 3.5 * z), Math.round(Y(0) + fy * z - 3.5 * z), sp.w * z, sp.h * z);
    }
  };
  /* flecha: rastro + haste com ponta e penas */
  const drawArrow = (q, X, Y, z) => {
    const ctx = R.ctx, x = X(q.x), y = Y(q.y) - q.h * 16 * z, dx = (q.x1 - q.x0) * 16, dy = ((q.y1 - q.y0) * 16) - (q.h1 - q.h0) * 16, ang = Math.atan2(dy * 0.8, dx);
    if (!low()) for (let i = 0; i < q.tr.length - 1; i++) { const t = q.tr[i], f = (i + 1) / q.tr.length; ctx.fillStyle = 'rgba(255,244,214,' + (0.5 * f) + ')'; ctx.fillRect(Math.round(X(t[0])), Math.round(Y(t[1]) - t[2] * 16 * z), Math.max(1, Math.round(z * (0.6 + f))), Math.max(1, Math.round(z * 0.8))); }
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(ang);
    ctx.fillStyle = INK; ctx.fillRect(-5 * z, -1.3 * z, 10 * z, 2.6 * z);
    ctx.fillStyle = '#c8a870'; ctx.fillRect(-4 * z, -0.5 * z, 7 * z, z);
    ctx.fillStyle = '#e8f0f8'; ctx.fillRect(3 * z, -1 * z, 2 * z, 2 * z);
    ctx.fillStyle = '#d84a3c'; ctx.fillRect(-5 * z, -1 * z, 1.6 * z, z); ctx.fillRect(-5 * z, 0, 1.6 * z, z);
    ctx.restore();
  };
  const drawStuck = (q, X, Y, z) => {
    const ctx = R.ctx, x = Math.round(X(q.x)), y = Math.round(Y(q.y)), al = q.t > 5.5 ? Math.max(0, (7 - q.t) / 1.5) : 1, sd = q.dx >= 0 ? 1 : -1;
    ctx.globalAlpha = al; ctx.fillStyle = INK; ctx.fillRect(x - 1 * z, y - 7 * z, 2 * z, 8 * z); ctx.fillStyle = '#c8a870'; ctx.fillRect(x - 0.5 * z + sd * 0, y - 6.5 * z, z, 7 * z);
    ctx.fillStyle = '#d84a3c'; ctx.fillRect(x - 1.5 * z, y - 7.5 * z, 3 * z, z); ctx.globalAlpha = 1;
  };

  /* ---- Zeno: o desenho próprio (arco, agachado, mira, carga no ombro) ---- */
  const zsheet = (n) => { if (!n._zlook) n._zlook = A.npcLook({ name: n.name, job: n.job, look: n.look, wk: 1 }); return A.charSheet(n._zlook); };
  const HANDS = { idle0: [16.5, 20.5], idle1: [16.5, 21.5], walk0: [16.5, 20.5], walk1: [16.5, 21.5], walk2: [16.5, 20.5], walk3: [16.5, 21.5], atk0: [13.7, 15], atk1: [19.5, 17.8], atk2: [17, 20.5], bend0: [20, 22], bend1: [21, 25] };
  const rect = (ctx, x, y, w, h, c, z) => { ctx.fillStyle = c; ctx.fillRect(Math.round((x - 13) * z), Math.round((y - 27) * z), Math.max(1, Math.round(w * z)), Math.max(1, Math.round(h * z))); };
  const drawBow = (ctx, hx, hy, pull, z, nock) => {
    /* arco vertical na mão; na mira, a corda vem para trás com a flecha encaixada */
    const bx = hx + 1, top = hy - 7, bot = hy + 7, cur = [0, 1, 2, 2, 3, 3, 3, 3, 3, 2, 2, 1, 0, 0];
    for (let i = 0; i < 14; i++) { const x = bx + cur[i] * 0.9, y = top + i; rect(ctx, x - 1, y, 3, 1, INK, z); }
    for (let i = 0; i < 14; i++) { const x = bx + cur[i] * 0.9; rect(ctx, x, y0(top, i), 1, 1, i % 4 === 0 ? '#e0b070' : '#9a6a3c', z); }
    const sx = bx - pull * 4.2 - 0.5; rect(ctx, sx, hy, 1, 1, '#f4ecd8', z);
    for (let i = 0; i < 6; i++) { const k = i / 6; rect(ctx, lerp(bx, sx, k), lerp(top + 0.4, hy, k), 1, 1, 'rgba(244,236,216,.8)', z); rect(ctx, lerp(bx, sx, k), lerp(bot - 0.4, hy, k), 1, 1, 'rgba(244,236,216,.8)', z); }
    if (nock) { rect(ctx, sx - 0.5, hy - 0.5, 11, 1, INK, z); rect(ctx, sx, hy, 10, 1, '#c8a870', z); rect(ctx, sx + 9, hy - 0.5, 2, 2, '#e8f0f8', z); rect(ctx, sx - 0.6, hy - 1, 2, 1, '#d84a3c', z); rect(ctx, sx - 0.6, hy + 0.5, 2, 1, '#d84a3c', z); }
  };
  const y0 = (top, i) => top + i;
  const carcassCv = (a) => spr(a, 'stand0');
  const drawZeno = (n, X, Y, z, over) => {
    const H = B.hunt; if (!H) return false;
    const ctx = R.ctx, px = Math.round(X(n.x)), py = Math.round(Y(n.y)), sheet = zsheet(n);
    if (n._ph == null) n._ph = (G.hash(n.name) % 100) / 25;
    const ph = H.ph, walking = n.moving, wf = 'walk' + (Math.floor(H.k * 8) % 4), idf = 'idle' + (Math.floor(R.t * 2 + n._ph) % 2);
    H.k += 0.016 * (walking ? 1 : 0.0) * (n.crouch ? 0.55 : 1);
    let fr = walking ? wf : idf, dy = 0, bow = 'hold', pull = 0, nock = false, carry = null, drop = 0;
    switch (ph) {
      case 'stalk': fr = walking ? 'bend0' : 'bend0'; dy = walking ? 3.2 + (Math.floor(H.k * 6) % 2 ? 0.8 : 0) : 3.4; bow = 'hold'; break;
      case 'aim': fr = 'atk1'; bow = 'aim'; pull = H.pull; nock = true; break;
      case 'loose': fr = 'atk2'; bow = 'aim'; pull = 0; nock = false; break;
      case 'fetch': bow = 'back'; break;
      case 'lift': fr = H.t < 0.45 ? 'bend1' : 'bend0'; bow = 'back'; dy = 0.4; break;
      case 'carry': fr = wf; bow = 'back'; carry = H.prey; break;
      case 'drop': fr = H.t < 0.45 ? 'bend0' : idf; bow = 'back'; drop = H.t; break;
      default: bow = 'hold';
    }
    if (n.moving && ph === 'approach') bow = 'hold';
    if (sheet.need) sheet.need(fr);
    const fw = sheet.fw || 26, fh = sheet.fh || 30, fs = sheet.scale || 1, ax = sheet.ax == null ? 13 : sheet.ax, ay = sheet.ay == null ? 27 : sheet.ay;
    ctx.imageSmoothingEnabled = false;
    shadow(px, py, 6.5, z);
    ctx.save(); ctx.translate(px, py); if (n.dir < 0) ctx.scale(-1, 1);
    if (bow === 'back') { rect(ctx, 7, 11, 1, 1, INK, z); for (let i = 0; i < 9; i++) { rect(ctx, 6 + i * 0.35, 9 + i * 1.5, 2, 1, i % 2 ? '#9a6a3c' : '#c08a52', z); } }
    ctx.drawImage(sheet.cv, sheet.idx[fr] * fw, 0, fw, fh, Math.round(-ax * fs * z), Math.round((-ay * fs + dy) * z), Math.round(fw * fs * z), Math.round(fh * fs * z));
    if (carry && carry.st === 'carried') {
      const cs = carcassCv(carry);
      ctx.save(); ctx.translate(Math.round(-1 * z), Math.round((-17 + dy + (Math.floor(H.k * 8) % 2)) * z)); ctx.rotate(-1.75); ctx.translate(Math.round(-cs.ax * z * 0.9), Math.round(-cs.ay * z * 0.55)); ctx.drawImage(cs.cv, 0, 0, cs.w * z, cs.h * z); ctx.restore();
      ctx.drawImage(sheet.cv, sheet.idx[fr] * fw, 0, fw, 13, Math.round(-ax * fs * z), Math.round((-ay * fs + dy) * z), Math.round(fw * fs * z), Math.round(13 * fs * z));
    }
    if (drop > 0 && H.prey) {
      const cs = carcassCv(H.prey), k = clamp((drop - 0.1) / 0.7, 0, 1);
      ctx.globalAlpha = 1 - k * 0.9; ctx.save(); ctx.translate(Math.round((6 + k * 6) * z), Math.round((-14 + k * 14) * z)); ctx.rotate(-1.75 + k * 1.7); ctx.translate(Math.round(-cs.ax * z * 0.9), Math.round(-cs.ay * z * 0.55)); ctx.drawImage(cs.cv, 0, 0, cs.w * z, cs.h * z); ctx.restore(); ctx.globalAlpha = 1;
    }
    if (bow !== 'back') { const h = HANDS[fr] || HANDS.idle0; drawBow(ctx, h[0] + (bow === 'aim' ? 1 : 0), h[1] + dy * 0 - (bow === 'aim' ? 0 : 0), pull, z, nock); }
    ctx.restore();
    if (R.sel && R.sel.ref === n) over.push(() => { const c = R.ctx, d = R.dpr || 1; c.font = Math.round(15 * d) + 'px "Aurora Pixel",monospace'; c.textAlign = 'center'; c.lineWidth = Math.max(2, d * 2.2); c.strokeStyle = 'rgba(16,12,24,.9)'; const tx = n.name + ' · caçando'; c.strokeText(tx, px, py - 31 * z); c.fillStyle = '#fff7e0'; c.fillText(tx, px, py - 31 * z); });
    return true;
  };
  const nd0 = R.npcDraw;
  R.npcDraw = (e, X, Y, z, over) => (e._hunt && B.hunt ? drawZeno(e, X, Y, z, over) : nd0 ? nd0(e, X, Y, z, over) : false);

  /* ---- ganchos de desenho ---- */
  const inView = (x, y, v, m) => x > v.x0 - m && x < v.x1 + m && y > v.y0 - m && y < v.y1 + m + 3;
  G.hook('renderItems', (dyn, ctx, v) => {
    if (G.OFFLINE || !G.S || B.S !== G.S) return;
    if (v.x1 < ZB.x0 - 3 || v.x0 > ZB.x1 + 3 || v.y1 < ZB.y0 - 4 || v.y0 > ZB.y1 + 5) return;
    for (const tr of B.ft) if (inView(tr.x, tr.y, v, 2)) dyn.push({ y: tr.y + 0.02, k: 'x', e: tr, f: (e, X, Y, z) => drawTreeFruit(e, X, Y, z) });
    for (const a of B.an) if (inView(a.x, a.y, v, 2) && a.st !== 'carried') dyn.push({ y: a.y + (a.st === 'dead' ? -0.2 : 0), k: 'x', e: a, f: (e, X, Y, z) => drawAnimal(e, X, Y, z) });
    for (const q of B.arrows) dyn.push({ y: q.y + 0.4, k: 'x', e: q, f: (e, X, Y, z) => drawArrow(e, X, Y, z) });
    for (const q of B.stuck) if (inView(q.x, q.y, v, 1)) dyn.push({ y: q.y, k: 'x', e: q, f: (e, X, Y, z) => drawStuck(e, X, Y, z) });
  }, 60);
  G.hook('groundDecor', (ctx, X, Y, z, v) => {
    if (G.OFFLINE || !G.S || B.S !== G.S || !B.fr.length) return;
    ctx.imageSmoothingEnabled = false;
    for (const f of B.fr) if (inView(f.x, f.y, v, 1)) drawFruitGround(f, X, Y, z);
  }, 60);

  /* folha de sprites para conferir a arte (usada por tools/bosque-shots.js) */
  B.sheet = (scale) => {
    const rows = [['deer', 'm', 3, ['stand0', 'stand1', 'walk0', 'walk1', 'walk2', 'walk3', 'graze0', 'graze1', 'alert', 'run0', 'run1']], ['deer', 'f', 3, ['stand0', 'stand1', 'walk0', 'walk1', 'walk2', 'walk3', 'graze0', 'graze1', 'alert', 'run0', 'run1']], ['deer', 'f', 0, ['stand0', 'walk1', 'graze0', 'alert', 'run0']],
      ['boar', 'm', 3, ['stand0', 'stand1', 'walk0', 'walk1', 'walk2', 'walk3', 'graze0', 'graze1', 'alert', 'run0', 'run1']], ['boar', 'f', 0, ['stand0', 'walk1', 'graze0', 'alert', 'run0']],
      ['rabbit', 'm', 3, ['sit0', 'sit1', 'hop0', 'hop1', 'eat0', 'eat1', 'alert']], ['rabbit', 'f', 0, ['sit0', 'hop0', 'hop1', 'eat0', 'alert']], ['bird', 'm', 3, ['stand0', 'peck0', 'fly0', 'fly1']]];
    const cv = document.createElement('canvas'), pad = 4; let W2 = 0, H2 = 0; const items = [];
    for (const [sp, sex, age, poses] of rows) { let x = pad, hh = 0; const row = []; for (const po of poses) { const s = spr({ sp, sex, age }, po); row.push([s, x]); x += s.w + pad; hh = Math.max(hh, s.h); } items.push([row, hh]); W2 = Math.max(W2, x); H2 += hh + pad; }
    cv.width = W2 * scale; cv.height = H2 * scale; const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.fillStyle = '#5c8a48'; c.fillRect(0, 0, cv.width, cv.height);
    let y = 0; for (const [row, hh] of items) { for (const [s, x] of row) c.drawImage(s.cv, x * scale, y * scale, s.w * scale, s.h * scale); y += hh + pad; }
    return cv.toDataURL();
  };
})();
