/* 3M-vida: v27 (B1) — a cidade trabalha de verdade. Lenhadores, mineradores e lavradores deixam de ser enfeite: andam até uma árvore, rocha ou canteiro,
   trabalham (machado, picareta, enxada, foice, regador), carregam o que tiraram e largam numa pilha ao lado do prédio, e repetem.
   REGRA DE OURO: nada aqui escreve em recursos, ouro, ânimo ou relógio. A produção continua sendo a de 32-town (G.prodRates, uma vez por hora de jogo);
   este módulo só LÊ o que foi produzido (G.onProd, avisado por hourTick) para dar números honestos às entregas: cada pilha mostra "+N madeira" com o
   que foi mesmo produzido desde a entrega anterior (acumulador só de exibição, nunca soma mais do que produziu). Árvores, rochas e canteiros têm estado
   próprio (cresce, cai, quebra, brota) que não influencia nada no jogo. O sorteio dos moradores usa um gerador próprio: ligar ou desligar a vida da
   cidade nunca muda a sequência de Math.random do resto da simulação (testado em tools/test-vida.js).
   Só simulação, sem DOM (a arte e o desenho moram em 54-vida-art.js). No avanço do tempo ausente (G.OFFLINE) nada anda: só o acumulador deixa de contar. */
'use strict';
(function () {
  const Wd = G.W;
  const HOUR = G.DAY_SEC / 24;                     // segundos de jogo por hora do dia (12,5)
  const npcRng = G.seeded(0xA11CE5);
  const SITES = { lenharia: 1, pedreira: 1, fazenda: 1 };
  G.LIFE = {
    treePool: 22,                                  // árvores marcadas para o corte em volta da Lenharia
    treeHits: 4, sawHits: 3, logs: 3,              // golpes para derrubar, cortes do tronco, toras por árvore
    stumpT: 8, sapT: 34, youngT: 42,               // toco -> muda -> árvore jovem -> árvore (s de jogo)
    rockHits: 4, pieces: 3, bareT: 5, smallT: 15,  // golpes para quebrar, pedaços por rocha, rocha: restos -> nova
    grow: [0, 7, 13, 15],                          // canteiro: semente (molhada) -> broto -> crescendo -> maduro (s de jogo)
    wetT: 34,                                      // quanto tempo a terra fica molhada
    pileLife: 48, pileMax: 8,                      // a pilha esvazia (carroça) depois disto; no máximo de peças visíveis
    shiftIn: 5.55, shiftOut: 18.0, shiftHard: 18.8 // horas: chegam um pouco antes do expediente (6 h) e saem ao fim dele
  };
  const LF = G.LIFE;
  const L = (G.life = { S: null, trees: [], rocks: [], tiles: [], pile: {}, piles: { lenharia: [], pedreira: [], fazenda: [] }, acc: {}, made: {}, shown: {}, pops: 0, lastPop: null, log: [], cyc: { lenharia: 14, pedreira: 14, fazenda: 20 }, off: 0, rate: null, rateT: -9 });
  const TREE_TXT = { tree_oak: 'um carvalho', tree_pine: 'um pinheiro' };

  /* ================= o mundo de trabalho (fixo, montado logo depois do mapa) ================= */
  const reachFrom = (sx, sy) => {
    const seen = new Uint8Array(Wd.w * Wd.h), q = [[Math.floor(sx), Math.floor(sy)]]; seen[q[0][1] * Wd.w + q[0][0]] = 1;
    while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= Wd.w || ny >= Wd.h) continue; const i = ny * Wd.w + nx; if (seen[i] || !Wd.walk[i]) continue; seen[i] = 1; q.push([nx, ny]); } }
    return seen;
  };
  /* onde o trabalhador fica para atingir (x, y): ao lado do tronco, virado para ele */
  /* copa de outra árvore na frente do trabalhador (ela é desenhada depois dele e o esconderia): conta como "tampado" */
  let canopies = null;
  const covered = (sx, sy) => { if (!canopies) canopies = Wd.props.filter((q) => q.t.indexOf('tree_') === 0); for (const q of canopies) if (q.y > sy + 0.05 && q.y < sy + 2.8 && Math.abs(q.x - sx) < 1.35) return true; return false; };
  const standFor = (x, y, seen) => {
    let first = null;
    for (const side of [-1, 1]) {
      const sx = x + side * 0.95, sy = y + 0.25;
      if (Wd.walkable(sx, sy) && seen[Math.floor(sy) * Wd.w + Math.floor(sx)]) { const o = { sx, sy, face: -side, cov: covered(sx, sy) ? 1 : 0 }; if (!o.cov) return o; first = first || o; }
    }
    if (first) return first;
    const sx = x, sy = y + 0.95;
    if (Wd.walkable(sx, sy) && seen[Math.floor(sy) * Wd.w + Math.floor(sx)]) return { sx, sy, face: 1, cov: covered(sx, sy) ? 1 : 0 };
    return null;
  };
  const buildSites = () => {
    const trees = [], rocks = [], tiles = [];
    /* árvores do corte: as mais próximas da porta da Lenharia que têm onde pisar (alcançáveis a pé) */
    { const d = Wd.plots.lenharia.door, seen = reachFrom(d[0], d[1]), c = [];
      for (const p of Wd.props) {
        if (p.t !== 'tree_oak' && p.t !== 'tree_pine') continue;
        const dd = Math.hypot(p.x - d[0], p.y - d[1]); if (dd > 12 || dd < 2.6) continue;
        const st = standFor(p.x, p.y, seen); if (!st) continue;
        c.push({ p, dd, st });
      }
      c.sort((a, b) => a.st.cov - b.st.cov || a.dd - b.dd);      // primeiro as árvores em que o trabalhador aparece inteiro, depois as outras
      /* espalha: nunca duas árvores coladas na lista (o corte não abre uma clareira só) */
      for (const o of c) { if (trees.length >= LF.treePool) break; if (trees.some((t) => Math.hypot(t.x - o.p.x, t.y - o.p.y) < 1.7)) continue; trees.push({ i: trees.length, p: o.p, x: o.p.x, y: o.p.y, k: o.p.t, v: o.p.v | 0, sx: o.st.sx, sy: o.st.sy, face: o.st.face, st: 'tree', t: 0, need: LF.treeHits, hit: 0, logs: 0, pend: 0, owner: 0, sh: 0, fd: 1, crown: 0 }); }
    }
    /* rochas do filão: o paredão de ocre fica no pé da muralha, a leste da Pedreira */
    { const d = Wd.plots.pedreira.door, seen = reachFrom(d[0], d[1]);
      const spots = [[28, 68, 'pedra'], [30, 68, 'minerio'], [32, 68, 'pedra'], [34, 68, 'minerio'], [29, 70, 'pedra'], [28, 72, 'minerio'], [30, 72, 'pedra']];
      for (const [tx, ty, kind] of spots) {
        const x = tx + 0.5, y = ty + 0.9, st = standFor(x, y, seen); if (!st) continue;
        Wd.walk[ty * Wd.w + tx] = 0;
        rocks.push({ i: rocks.length, x, y, tx, ty, kind, sx: st.sx, sy: st.sy, face: st.face, st: 'rock', t: 0, hit: 0, stage: 0, pieces: 0, pend: 0, owner: 0, sh: 0, v: rocks.length });
      }
    }
    /* canteiros: cada tile dos quatro campos */
    Wd.fields.forEach((f, fi) => { for (let ty = f.y0; ty <= f.y1; ty++) for (let tx = f.x0; tx <= f.x1; tx++) tiles.push({ i: tiles.length, x: tx, y: ty, f: fi, crop: f.crop, st: 4, t: 0, wet: 0, owner: 0, sh: 0 }); });
    Wd.life = { trees, rocks, tiles, pile: { lenharia: [74.7, 29.35], pedreira: [27.6, 75.5], fazenda: [68.9, 49.7] } };
    if (Wd._pcache) { Wd._pcache.clear(); Wd._pcacheN.clear(); }
  };
  const wi0 = Wd.init;
  Wd.init = () => { wi0(); buildSites(); };

  /* ================= estado de execução (não é salvo: recomeça a cada jogo novo ou carregado) ================= */
  const reset = () => {
    const S = G.S, W = Wd.life; if (!W) return;
    L.S = S; L.off = 0; L.lastT = S.t;
    L.trees = W.trees; L.rocks = W.rocks; L.tiles = W.tiles; L.pile = W.pile;
    for (const t of L.trees) Object.assign(t, { st: 'tree', t: 0, hit: 0, logs: 0, pend: 0, owner: 0, sh: 0, crown: 0 });
    for (const r of L.rocks) Object.assign(r, { st: 'rock', t: 0, hit: 0, stage: 0, pieces: 0, pend: 0, owner: 0, sh: 0 });
    /* os campos começam com um pouco de tudo, a maioria madura (como era a paisagem antes) */
    const rr = G.seeded(S.created ? S.created % 99991 : 7);
    for (const q of L.tiles) { const r = rr(); Object.assign(q, { st: r < 0.55 ? 4 : r < 0.7 ? 3 : r < 0.8 ? 2 : r < 0.9 ? 1 : 0, t: 0, wet: 0, owner: 0, sh: 0 }); if (q.st === 1) q.wet = rr() < 0.5 ? S.t + 20 : 0; }
    L.piles = { lenharia: [], pedreira: [], fazenda: [] };
    for (const k of ['madeira', 'pedra', 'minerio', 'trigo', 'ervas']) { L.acc[k] = 0; L.made[k] = 0; L.shown[k] = 0; }
    L.pops = 0; L.lastPop = null; L.log.length = 0; L.rate = null; L.rateT = -9;
    for (const n of G.npcs) if (n._wk) { n._wk = 0; n.w = null; }
  };
  const ensure = () => { if (L.S !== G.S || L.off) reset(); return !!L.S; };      // outro jogo ou volta de uma ausência: o mundo de trabalho recomeça (o que o acumulador guardava se perde: nada é mostrado do tempo ausente)
  G.lifeReset = reset;

  /* a produção real, avisada por hourTick: o acumulador de exibição (nunca vai além do que a simulação produziu) */
  G.onProd = (id, n) => { if (G.OFFLINE || !G.S || !(n > 0) || !(id in L.acc)) return; L.acc[id] += n; L.made[id] += n; };
  G.lifeOffline = () => { L.off = 1; };

  /* ritmo: taxa real de produção por hora, e quantos viajam juntos (só para dar o compasso do vai-e-vem) */
  const rates = () => { const S = G.S; if (!L.rate || S.t - L.rateT > 2) { L.rate = G.prodRates(); L.rateT = S.t; } return L.rate; };
  const crew = (site) => { let n = 0; for (const m of G.npcs) if (m._wk && m.at === site) n++; return Math.max(1, n); };
  /* >1 quando o prédio rende muito por trabalhador (balança mais rápido); <1 quando rende pouco (anda com calma). Só mexe na animação */
  const pace = (site) => {
    const r = rates(), per = (site === 'lenharia' ? r.madeira : site === 'pedreira' ? r.pedra + r.minerio : r.trigo + r.ervas) / crew(site);
    return G.clamp(0.7 + per / 8, 0.8, 1.45);
  };
  const resName = (k) => G.RES[k].name.split(' ')[0].toLowerCase();
  const POP_COLOR = { madeira: '#f0b878', pedra: '#dfe4ea', minerio: '#ffb866', trigo: '#ffe27a', ervas: '#9ee89a' };

  /* uma entrega: pega do acumulador a fatia que cabe a esta viagem e mostra no pilha. Devolve o que foi mostrado */
  const deliver = (n, site, res, x, y) => {
    const S = G.S, w = n.w, r = rates(), perH = r[res] || 0;
    const trips = Math.max(0.5, crew(site) * HOUR / Math.max(6, L.cyc[site]));      // viagens por hora de jogo, de toda a equipe
    const est = Math.max(1, perH / trips);
    let a = L.acc[res] || 0, take = 0;
    if (a >= 1) take = Math.floor(a >= 2.5 * est ? a : Math.min(a, Math.max(1, Math.round(est))));
    if (take > 0) { L.acc[res] = a - take; L.shown[res] += take; }
    { /* cada entrega ocupa o primeiro lugar livre da pilha (lugar fixo: a pilha não se rearruma quando as peças mais velhas somem) */
      const arr = L.piles[site], used = {}; for (const it of arr) used[it.slot] = 1;
      let slot = 0; while (used[slot] && slot < LF.pileMax) slot++;
      if (slot >= LF.pileMax) slot = arr.shift().slot;
      arr.push({ t: S.t, res, n: take, slot }); }
    if (take > 0) {
      L.pops++; L.lastPop = { t: S.t, site, res, n: take };
      if (L.log.length < 400) L.log.push({ t: S.t, site, res, n: take });
      G.addFx({ t: 'text', x, y: y - 1.15, s: '+' + take + ' ' + resName(res), c: POP_COLOR[res] || '#ffe07a' });
      G.sfx('deliver', x, y);
    }
    if (w) { const c = S.t - (w.cycT || S.t); if (c > 3 && c < 90) L.cyc[site] += (c - L.cyc[site]) * 0.2; w.cycT = S.t; }
    return take;
  };

  /* ================= vida das árvores, rochas e canteiros (só o que se vê) ================= */
  const growTrees = (dt) => {
    for (const t of L.trees) {
      if (t.sh > 0) t.sh -= dt;
      switch (t.st) {
        case 'fall': t.t += dt; if (t.t >= 0.95) { t.st = 'trunk'; t.t = 0; G.addFx({ t: 'timber', x: t.x + t.fd * 1.4, y: t.y, dir: t.fd }); G.sfx('thud', t.x, t.y); } break;
        case 'stump': t.t += dt; if (t.crown > 0) t.crown -= dt; if (t.t >= LF.stumpT) { t.st = 'sap'; t.t = 0; } break;
        case 'sap': t.t += dt; if (t.t >= LF.sapT) { t.st = 'young'; t.t = 0; } break;
        case 'young': t.t += dt; if (t.t >= LF.youngT) { t.st = 'tree'; t.t = 0; t.hit = 0; t.owner = 0; } break;
      }
    }
    for (const r of L.rocks) {
      if (r.sh > 0) r.sh -= dt;
      if (r.st === 'bare') { r.t += dt; if (r.t >= LF.bareT) { r.st = 'small'; r.t = 0; } }
      else if (r.st === 'small') { r.t += dt; if (r.t >= LF.smallT) { r.st = 'rock'; r.t = 0; r.hit = 0; r.stage = 0; } }
    }
    const S = G.S;
    for (const q of L.tiles) {
      if (q.sh > 0) q.sh -= dt;
      if (q.st >= 1 && q.st < 4) {
        if (q.st === 1 && !(q.wet > S.t)) continue;       // a semente só brota com a terra molhada
        q.t += dt; if (q.t >= LF.grow[q.st]) { q.st++; q.t = 0; }
      }
    }
    const piles = L.piles;
    for (const k in piles) { const a = piles[k]; while (a.length && S.t - a[0].t > LF.pileLife) a.shift(); }
  };

  /* ================= o expediente ================= */
  const hourNow = () => G.S.clock / 60;
  const shiftOn = (n) => {
    const hr = hourNow(), s = LF.shiftIn + (n.wk - 1) * 0.07;
    if (hr >= s && hr < LF.shiftOut) return true;
    /* depois das 18 h termina a viagem em curso, sem começar outra */
    if (hr >= LF.shiftOut && hr < LF.shiftHard && n.w && n.w.ph !== 'look' && n.w.ph !== 'rest' && n.w.ph !== 'wait' && n.w.ph !== 'toTree' && n.w.ph !== 'toRock' && n.w.ph !== 'toTile') return true;
    return false;
  };
  const takeOver = (n) => {
    n._wk = 1; n.inside = false; n.act = 'work'; n.state = 'work'; n.until = 0; n.carry = null; n.talk = 0; n.say = null; n.sayT = 0;
    n.w = { site: n.at, ph: 'look', t: 0, tgt: null, carry: null, plan: '', sw: 0, hit: 0, cycT: G.S.t, wait: 0 };
    n.path = null; n.moving = false;
  };
  const release = (n) => {
    const w = n.w;
    if (w && w.tgt) unclaim(w);
    n._wk = 0; n.w = null; n.carry = null; n.state = 'stand'; n.act = ''; n.until = 0; n.tThink = 0; n.moving = false; n.path = null;
  };
  const unclaim = (w) => { const t = w.tgt; if (!t) return; if (t.owner === w.id) t.owner = 0; w.tgt = null; };
  G.lifeNpc = (n, dt) => {
    if (!SITES[n.at] || !n.wk || !ensure()) return false;
    const S = G.S;
    const on = G.bOk(n.at) && !S.mare.active && shiftOn(n);
    if (on) { if (!n._wk) takeOver(n); work(n, dt); return true; }
    if (n._wk) release(n);
    return false;
  };
  /* roda uma vez por tick, depois dos moradores: crescimento do mundo de trabalho */
  G.lifeTick = (dt) => { if (!ensure()) return; growTrees(dt); };

  /* a vida da cidade tem o seu próprio sorteio: nada daqui muda a sequência de Math.random do resto do jogo */
  const un0 = G.updateNpcs;
  G.updateNpcs = (dt) => { const r = Math.random; Math.random = npcRng; Wd._npc = true; try { un0(dt); } finally { Math.random = r; Wd._npc = false; } };

  /* ================= os três laços de trabalho ================= */
  const walkTo = (n, x, y) => { G.go(n, x, y); n.moving = true; };
  const WSPD = (n, w) => n.spd * (w.carry ? 0.9 : 1.08) * G.clamp(pace(w.site), 1, 1.18);
  const go = (n, w, ph, x, y) => { w.ph = ph; w.t = 0; walkTo(n, x, y); };
  const face = (n, d) => { if (d) n.dir = d > 0 ? 1 : -1; };
  /* balanço do braço: sw vai de 0 a 1 a cada golpe; devolve true no instante do impacto (sw cruza 0,5) */
  const swing = (w, dt, period, k) => { const was = w.sw; w.sw = (w.sw + dt / (period / (k || 1))) % 1; return was < 0.5 && w.sw >= 0.5; };

  const work = (n, dt) => {
    const w = n.w; w.t += dt; w.id = n.id;
    if (w.site === 'lenharia') lumber(n, w, dt); else if (w.site === 'pedreira') quarry(n, w, dt); else farm(n, w, dt);
  };

  /* ---------- Lenharia ---------- */
  const pileSpot = (site) => { const p = L.pile[site]; return [p[0] - 0.95, p[1] + 0.12]; };
  const pickTree = (n) => {
    const out = [];
    for (const t of L.trees) { if ((t.st === 'cut' && t.logs - t.pend > 0) || (t.st === 'trunk' && !t.owner)) out.push([t, 0]); }
    if (out.length) { out.sort((a, b) => Math.hypot(a[0].sx - n.x, a[0].sy - n.y) - Math.hypot(b[0].sx - n.x, b[0].sy - n.y)); return out[0][0]; }
    const d = Wd.plots.lenharia.door, free = L.trees.filter((t) => t.st === 'tree' && !t.owner);
    if (!free.length) return null;
    free.sort((a, b) => Math.hypot(a.x - d[0], a.y - d[1]) - Math.hypot(b.x - d[0], b.y - d[1]));
    return free[Math.min(free.length - 1, Math.floor(Math.random() * Math.min(5, free.length)))];
  };
  const lumber = (n, w, dt) => {
    const t = w.tgt;
    switch (w.ph) {
      case 'look': {
        if (G.S.clock / 60 >= LF.shiftOut) { w.ph = 'rest'; w.t = 0; w.wait = 1; break; }
        const tr = pickTree(n);
        if (!tr) { w.ph = 'wait'; w.t = 0; w.wait = 3 + Math.random() * 2; n.moving = false; break; }
        w.tgt = tr; w.sw = 0;
        if (tr.st === 'cut') { tr.pend++; go(n, w, 'toLog', tr.sx, tr.sy); } else { tr.owner = n.id; go(n, w, tr.st === 'trunk' ? 'toLog' : 'toTree', tr.sx, tr.sy); }
        break;
      }
      case 'wait': n.moving = false; if (w.t >= w.wait) { w.ph = 'look'; w.t = 0; } break;
      case 'toTree': case 'toLog':
        if (!t || (w.ph === 'toTree' && t.st !== 'tree') || (w.ph === 'toLog' && t.st !== 'cut' && t.st !== 'trunk')) { unclaim(w); w.ph = 'look'; break; }
        if (G.step(n, dt, WSPD(n, w))) { n.moving = false; face(n, t.face); if (w.ph === 'toTree') { w.ph = 'chop'; w.t = 0; w.sw = 0.1; } else if (t.st === 'trunk') { w.ph = 'saw'; w.t = 0; w.sw = 0.1; t.hit = 0; } else { w.ph = 'pick'; w.t = 0; } }
        break;
      case 'chop':
        if (!t) { w.ph = 'look'; break; }
        if (swing(w, dt, 0.72, pace('lenharia'))) {
          t.hit++; t.sh = 0.32; G.addFx({ t: 'chip', x: t.x - t.face * 0.25, y: t.y - 0.6, dir: -t.face, k: 'wood' }); G.sfx('chop', t.x, t.y);
          if (t.hit >= t.need) { t.st = 'fall'; t.t = 0; t.fd = t.face; w.ph = 'watch'; w.t = 0; w.sw = 0; }
        }
        break;
      case 'watch': n.moving = false; if (t && t.st === 'trunk' && w.t > 0.4) { w.ph = 'saw'; w.t = 0; w.sw = 0.1; t.hit = 0; } else if (w.t > 3) { unclaim(w); w.ph = 'look'; } break;
      case 'saw':
        if (!t) { w.ph = 'look'; break; }
        if (swing(w, dt, 0.62, pace('lenharia'))) {
          t.hit++; t.sh = 0.2; G.addFx({ t: 'chip', x: t.x + t.fd * 0.9, y: t.y - 0.25, dir: t.fd, k: 'wood' }); G.sfx('chop', t.x, t.y);
          if (t.hit >= LF.sawHits) { t.st = 'cut'; t.logs = LF.logs; t.pend = 1; t.hit = 0; w.ph = 'pick'; w.t = 0; w.sw = 0; }
        }
        break;
      case 'pick':
        n.moving = false; if (!t) { w.ph = 'look'; break; }
        if (w.t >= 0.6) {
          if (t.logs <= 0) { t.pend = Math.max(0, t.pend - 1); w.tgt = null; w.ph = 'look'; break; }
          t.logs--; t.pend = Math.max(0, t.pend - 1); w.carry = 'log'; w.src = t;
          if (t.logs <= 0) { t.st = 'stump'; t.t = 0; t.crown = 6; t.owner = 0; }
          const p = pileSpot('lenharia'); go(n, w, 'carry', p[0], p[1]);
        }
        break;
      case 'carry':
        if (G.step(n, dt, WSPD(n, w))) { n.moving = false; face(n, 1); w.ph = 'drop'; w.t = 0; }
        break;
      case 'drop':
        n.moving = false;
        if (w.t >= 0.5 && w.carry) { const p = L.pile.lenharia; deliver(n, 'lenharia', 'madeira', p[0], p[1]); w.carry = null; }
        if (w.t >= 0.85) {
          const s = w.src; w.src = null;
          if (s && s.st === 'cut' && s.logs - s.pend > 0) { s.pend++; w.tgt = s; go(n, w, 'toLog', s.sx, s.sy); }
          else { w.tgt = null; w.ph = 'rest'; w.t = 0; w.wait = rest(w, 'lenharia'); }
        }
        break;
      case 'rest': n.moving = false; if (w.t >= w.wait) { w.ph = 'look'; w.t = 0; } break;
      default: w.ph = 'look';
    }
  };
  /* respiro entre viagens: quanto menos o prédio rende por trabalhador, mais devagar o ritmo */
  const rest = (w, site) => G.clamp((1.45 - pace(site)) * 5.5 + Math.random() * 1.5, 0.3, 6);

  /* ---------- Pedreira ---------- */
  const pickRock = (n) => {
    const a = L.rocks.filter((r) => r.st === 'rubble' && r.pieces - r.pend > 0);
    if (a.length) { a.sort((x, y) => Math.hypot(x.sx - n.x, x.sy - n.y) - Math.hypot(y.sx - n.x, y.sy - n.y)); return a[0]; }
    const free = L.rocks.filter((r) => r.st === 'rock' && !r.owner);
    if (!free.length) return null;
    /* alterna pedra e minério pelo que mais falta mostrar */
    const wantOre = (L.acc.minerio || 0) / Math.max(0.5, rates().minerio || 1) > (L.acc.pedra || 0) / Math.max(0.5, rates().pedra || 1);
    const pref = free.filter((r) => (r.kind === 'minerio') === wantOre); const pool = pref.length ? pref : free;
    return pool[Math.floor(Math.random() * pool.length)];
  };
  const quarry = (n, w, dt) => {
    const r = w.tgt;
    switch (w.ph) {
      case 'look': {
        if (G.S.clock / 60 >= LF.shiftOut) { w.ph = 'rest'; w.t = 0; w.wait = 1; break; }
        const rk = pickRock(n);
        if (!rk) { w.ph = 'wait'; w.t = 0; w.wait = 3 + Math.random() * 2; n.moving = false; break; }
        w.tgt = rk; w.sw = 0;
        if (rk.st === 'rubble') { rk.pend++; go(n, w, 'toRock', rk.sx, rk.sy); w.again = 1; } else { rk.owner = n.id; w.again = 0; go(n, w, 'toRock', rk.sx, rk.sy); }
        break;
      }
      case 'wait': n.moving = false; if (w.t >= w.wait) { w.ph = 'look'; w.t = 0; } break;
      case 'toRock':
        if (!r || (!w.again && r.st !== 'rock')) { unclaim(w); w.ph = 'look'; break; }
        if (G.step(n, dt, WSPD(n, w))) { n.moving = false; face(n, r.face); if (w.again) { w.ph = 'gather'; w.t = 0; } else { w.ph = 'mine'; w.t = 0; w.sw = 0.1; } }
        break;
      case 'mine':
        if (!r) { w.ph = 'look'; break; }
        if (swing(w, dt, 0.78, pace('pedreira'))) {
          r.hit++; r.sh = 0.3; r.stage = r.hit >= LF.rockHits ? 3 : Math.min(2, Math.floor(r.hit * 0.6));
          G.addFx({ t: 'spark', x: r.x - r.face * 0.5, y: r.y - 0.55, dir: -r.face, big: r.hit >= LF.rockHits ? 1 : 0, ore: r.kind === 'minerio' ? 1 : 0 }); G.sfx('mine', r.x, r.y);
          if (r.hit >= LF.rockHits) { r.st = 'rubble'; r.pieces = LF.pieces; r.pend = 1; r.t = 0; r.owner = 0; w.ph = 'gather'; w.t = 0; w.sw = 0; G.addFx({ t: 'rockbreak', x: r.x, y: r.y - 0.3, ore: r.kind === 'minerio' ? 1 : 0 }); G.sfx('crumble', r.x, r.y); }
        }
        break;
      case 'gather':
        n.moving = false; if (!r) { w.ph = 'look'; break; }
        if (w.t >= 0.6) {
          if (r.pieces <= 0) { r.pend = Math.max(0, r.pend - 1); w.tgt = null; w.ph = 'look'; break; }
          r.pieces--; r.pend = Math.max(0, r.pend - 1); w.carry = r.kind === 'minerio' ? 'ore' : 'stone'; w.src = r; w.kind = r.kind;
          if (r.pieces <= 0) { r.st = 'bare'; r.t = 0; }
          const p = pileSpot('pedreira'); go(n, w, 'carry', p[0], p[1]);
        }
        break;
      case 'carry': if (G.step(n, dt, WSPD(n, w))) { n.moving = false; face(n, 1); w.ph = 'drop'; w.t = 0; } break;
      case 'drop':
        n.moving = false;
        if (w.t >= 0.5 && w.carry) { const p = L.pile.pedreira; deliver(n, 'pedreira', w.kind === 'minerio' ? 'minerio' : 'pedra', p[0], p[1]); w.carry = null; }
        if (w.t >= 0.85) {
          const s = w.src; w.src = null;
          if (s && s.st === 'rubble' && s.pieces - s.pend > 0) { s.pend++; w.tgt = s; w.again = 1; go(n, w, 'toRock', s.sx, s.sy); }
          else { w.tgt = null; w.ph = 'rest'; w.t = 0; w.wait = rest(w, 'pedreira'); }
        }
        break;
      case 'rest': n.moving = false; if (w.t >= w.wait) { w.ph = 'look'; w.t = 0; } break;
      default: w.ph = 'look';
    }
  };

  /* ---------- Fazenda ---------- */
  const tilePos = (q) => [q.x + 0.5, q.y + 0.92];
  const nearest = (n, a) => { let b = null, bd = 1e9; for (const q of a) { const d = Math.hypot(q.x + 0.5 - n.x, q.y + 0.5 - n.y) + Math.random() * 2.5; if (d < bd) { bd = d; b = q; } } return b; };
  const farmPlan = (n) => {
    const ripe = L.tiles.filter((q) => q.st === 4 && !q.owner), bare = L.tiles.filter((q) => q.st === 0 && !q.owner), dry = L.tiles.filter((q) => q.st === 1 && !(q.wet > G.S.t) && !q.owner);
    if (dry.length && (Math.random() < 0.55 || (!ripe.length && !bare.length))) return ['water', nearest(n, dry)];
    if (bare.length && (!ripe.length || Math.random() < 0.5)) return ['plant', nearest(n, bare)];
    if (ripe.length) return ['harvest', nearest(n, ripe)];
    return null;
  };
  const farm = (n, w, dt) => {
    const q = w.tgt;
    switch (w.ph) {
      case 'look': {
        if (G.S.clock / 60 >= LF.shiftOut) { w.ph = 'rest'; w.t = 0; w.wait = 1; break; }
        const pl = farmPlan(n);
        if (!pl) { w.ph = 'wait'; w.t = 0; w.wait = 3 + Math.random() * 2; n.moving = false; break; }
        w.plan = pl[0]; w.tgt = pl[1]; pl[1].owner = n.id; w.sw = 0; const p = tilePos(pl[1]); go(n, w, 'toTile', p[0] - 0.55, p[1]);
        break;
      }
      case 'wait': n.moving = false; if (w.t >= w.wait) { w.ph = 'look'; w.t = 0; } break;
      case 'toTile':
        if (!q) { w.ph = 'look'; break; }
        if (G.step(n, dt, WSPD(n, w))) { n.moving = false; face(n, 1); w.t = 0; w.sw = 0.1; w.hit = 0; w.ph = w.plan === 'harvest' ? 'harvest' : w.plan === 'water' ? 'water' : 'till'; }
        break;
      case 'harvest':
        if (!q) { w.ph = 'look'; break; }
        if (swing(w, dt, q.crop === 0 ? 0.6 : 0.8, pace('fazenda'))) {
          w.hit++; q.sh = 0.25; G.addFx({ t: 'chaff', x: q.x + 0.5, y: q.y + 0.55, k: q.crop }); G.sfx('swish', q.x, q.y);
          if (w.hit >= (q.crop === 0 ? 3 : 2)) { q.st = 0; q.t = 0; q.wet = 0; q.owner = 0; w.carry = q.crop === 0 ? 'sack' : 'basket'; w.kind = q.crop === 0 ? 'trigo' : 'ervas'; w.tgt = null; w.ph = 'bundle'; w.t = 0; }
        }
        break;
      case 'bundle': n.moving = false; if (w.t >= 0.55) { const p = pileSpot('fazenda'); go(n, w, 'carry', p[0], p[1]); } break;
      case 'carry': if (G.step(n, dt, WSPD(n, w))) { n.moving = false; face(n, 1); w.ph = 'drop'; w.t = 0; } break;
      case 'drop':
        n.moving = false;
        if (w.t >= 0.5 && w.carry) { const p = L.pile.fazenda; deliver(n, 'fazenda', w.kind, p[0], p[1]); w.carry = null; }
        if (w.t >= 0.85) { w.ph = 'rest'; w.t = 0; w.wait = rest(w, 'fazenda'); }
        break;
      case 'till':
        if (!q) { w.ph = 'look'; break; }
        if (swing(w, dt, 0.7, pace('fazenda'))) { w.hit++; q.sh = 0.25; G.addFx({ t: 'chaff', x: q.x + 0.5, y: q.y + 0.7, k: 2 }); G.sfx('dig', q.x, q.y); if (w.hit >= 2) { w.ph = 'plant'; w.t = 0; w.sw = 0; } }
        break;
      case 'plant':
        n.moving = false; if (!q) { w.ph = 'look'; break; }
        if (w.t >= 0.9) { q.st = 1; q.t = 0; q.wet = 0; w.ph = 'water'; w.t = 0; w.sw = 0.1; w.hit = 0; }
        break;
      case 'water':
        n.moving = false; if (!q) { w.ph = 'look'; break; }
        if (w.t >= 1.7) { q.wet = G.S.t + LF.wetT; q.owner = 0; G.addFx({ t: 'splash', x: q.x + 0.5, y: q.y + 0.6 }); w.tgt = null; w.ph = 'rest'; w.t = 0; w.wait = rest(w, 'fazenda') * 0.5; }
        break;
      case 'rest': n.moving = false; if (w.t >= w.wait) { w.ph = 'look'; w.t = 0; } break;
      default: w.ph = 'look';
    }
  };

  /* ================= o que o cartão do prédio e o inspetor mostram ================= */
  G.workLabel = (n) => {
    if (!n || !n._wk || !n.w) return '';
    const w = n.w, t = w.tgt;
    switch (n.at) {
      case 'lenharia':
        switch (w.ph) {
          case 'toTree': return 'indo até ' + (TREE_TXT[t && t.k] || 'uma árvore');
          case 'toLog': return 'voltando ao tronco';
          case 'chop': return 'cortando ' + (TREE_TXT[t && t.k] || 'uma árvore');
          case 'watch': return 'vendo a árvore cair';
          case 'saw': return 'cortando o tronco em toras';
          case 'pick': return 'erguendo uma tora';
          case 'carry': return 'levando toras';
          case 'drop': return 'empilhando toras';
          case 'wait': return 'esperando as mudas crescerem';
          default: return 'afiando o machado';
        }
      case 'pedreira':
        switch (w.ph) {
          case 'toRock': return w.again ? 'voltando aos entulhos' : 'indo até a rocha';
          case 'mine': return t && t.kind === 'minerio' ? 'picando o veio de minério' : 'picando a rocha';
          case 'gather': return 'juntando os pedaços';
          case 'carry': return w.kind === 'minerio' ? 'levando minério' : 'levando pedra';
          case 'drop': return w.kind === 'minerio' ? 'empilhando minério' : 'empilhando pedra';
          case 'wait': return 'esperando o filão crescer';
          default: return 'secando o suor';
        }
      default:
        switch (w.ph) {
          case 'toTile': return w.plan === 'harvest' ? 'indo colher' : w.plan === 'water' ? 'indo regar' : 'indo plantar';
          case 'harvest': return t && t.crop === 1 ? 'colhendo ervas' : 'ceifando o trigo';
          case 'bundle': return 'amarrando a colheita';
          case 'carry': return w.kind === 'ervas' ? 'levando o cesto de ervas ao celeiro' : 'levando o saco de trigo ao celeiro';
          case 'drop': return 'guardando a colheita no celeiro';
          case 'till': return 'capinando e arando';
          case 'plant': return 'semeando';
          case 'water': return 'regando';
          case 'wait': return 'esperando o trigo crescer';
          default: return 'tomando fôlego';
        }
    }
  };
  /* resumo para testes e para o cartão: o que a equipe de cada prédio está fazendo */
  G.lifeStats = () => ({ pops: L.pops, shown: Object.assign({}, L.shown), made: Object.assign({}, L.made), acc: Object.assign({}, L.acc), workers: G.npcs.filter((n) => n._wk).length });
})();

;
