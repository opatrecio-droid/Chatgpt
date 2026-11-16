/* Aurora 043 · convocação contra o chefe de zona (simulação, sem DOM).

   1. Quando um chefe desperta, os heróis aptos são convocados: reúnem-se a uma distância segura do
      covil e atacam juntos, em vez de esbarrar nele um a um.
   2. Cada investida que termina sem derrubar o chefe conta uma derrota seguida (S.zones[z].bf).
      Na terceira, a companhia para de insistir e passa a "estudar" o chefe.
   3. Em estudo, um avaliador oculto (G.bossOdds) simula a luta com todos os heróis atacando juntos.
      A companhia só volta a investir quando a chance estimada de vitória passa de 80%.
      Se mesmo assim perder, o avaliador fica mais desconfiado daquele chefe (S.zones[z].bb).

   O jogador não vê números: só o motivo do herói ("Reunindo a companhia…") e as linhas da crônica. */
(function () {
  'use strict';
  const W = G.W;
  const CFG = (G.RALLY = {
    study: 3,          // derrotas seguidas até a companhia parar para estudar o chefe
    odds: 0.8,         // chance mínima estimada para investir em modo de estudo
    quorum: 0.6,       // fração dos heróis à altura que precisa estar apta para a convocação comum
    grace: 40,         // s depois do despertar em que a convocação comum espera juntar o quórum
    wait: 14,          // s de espera no ponto de encontro depois que o primeiro chega
    callMax: 70,       // s máximos de reunião
    assaultMax: 240,   // s máximos de investida
    cooldown: 50,      // s entre investidas
    gap: 7,            // heróis mais de `gap` níveis abaixo do chefe ficam de fora
    brave: 0.1,        // quanto a investida reduz o limite de recuo
    uptime: 0.7, bossK: 1.42, splash: 0.9, spread: 0.18, trials: 40,   // calibragem do avaliador (dev/tests/calibra-chefe.js)
  });
  const rallies = {};          // zona -> investida em curso (não é salvo)
  const coolUntil = {};        // zona -> S.t em que outra investida pode começar
  const oddsCache = {};        // zona -> { t, p }

  const live = (h) => h && h.state !== 'fallen' && h.state !== 'recover';
  const zoneBoss = (z) => { const zi = G.ZONES.indexOf(z); for (const m of G.mons) if (m.boss && m.zi === zi && !m.dead && !m.gone && !m.rift && !m.raid && !m.inc && !m.colosso) return m; return null; };
  const bossById = (id) => { for (const m of G.mons) if (m.id === id && !m.dead && !m.gone) return m; return null; };
  const rallyOf = (h) => (h._rally && h._rallyZ && rallies[h._rallyZ] && rallies[h._rallyZ].boss === h._rally ? rallies[h._rallyZ] : null);
  const busy = (h) => h.state === 'rift' || h.state === 'inc' || h.state === 'colosso' || h.state === 'defend' || h._carrying || h.rescuer;
  /* à altura do chefe e livre para ir (ordem manual para outra zona é respeitada) */
  const worthy = (h, b, z) => live(h) && !busy(h) && (h.order === 'auto' || h.order === z.id) && G.heroStats(h).eff >= b.lvl - CFG.gap;
  const outside = (h) => h.state === 'hunt' || h.state === 'travel' || h.state === 'return' || h.state === 'apprentice';
  /* apto agora: vida, fome e vigor para uma luta longa */
  const fit = (h) => {
    const S = G.S, st = G.heroStats(h);
    if (h.hp < st.hp * 0.7 || h.fome < 20 || h.energia < 25 || (h.wound > S.t && h.hp < st.hp * 0.85)) return false;
    /* sem poção, com Alquimista abastecido e moedas no bolso: repõe antes de ir */
    if (h.potions <= 0 && !outside(h) && G.bOk('alquimista') && S.res.pocao >= 1 && h.gold >= G.price(h, 'potion')) return false;
    return true;
  };

  /* ---------- avaliador oculto: chance de vitória com estes heróis atacando juntos ---------- */
  const SKILL = { esp: 1.5, cav: 1.1, arq: 2.7, mag: 2.1, pal: 0, lad: 2.6 };
  G.bossOdds = (b, heroes, trials) => {
    if (!b || !heroes || !heroes.length) return 0;
    const d = G.MON[b.k], z = b.zi >= 0 ? G.ZONES[b.zi] : null, zs = z ? G.S.zones[z.id] : null;
    const wary = Math.max(1, (zs && zs.bb) || 1), def = G.BOSS && G.BOSS[b.k];
    const P = heroes.map((h) => {
      const st = G.heroStats(h), md = G.heroMod(h), a = st.atk * md.a;
      const crit = 1 + Math.min(1, st.crit) * (st.critDmg - 1);
      const hit = (a * a) / (a + b.def) * (1 + G.bestBonus(d.fam)) * (1 + G.traitSum(h, 'elite') + st.eliteF) * (1 - (b.eva || 0));
      const pow = G.skillPower(h, 0), cd = Math.max(2.5, G.skillCooldown(h, 0));
      const sk = h.cls === 'lad' ? SKILL.lad * st.critDmg : (SKILL[h.cls] == null ? 1 : SKILL[h.cls]) * crit;
      const dps = hit * crit / Math.max(0.3, st.int) + sk * pow * hit / cd;
      const hdef = st.def * md.d * (1 - (d.pierce || 0));
      const blow = (b.atk * b.atk) / (b.atk + hdef) * (1 - Math.min(0.6, st.eva || 0));
      const q = G.potionQueue ? G.potionQueue(h) : null;
      return { max: st.hp, hp: Math.min(st.hp, Math.max(1, h.hp)), dps, blow, pots: h.potions | 0, potV: G.potionPower(q && q[0] ? q[0] : 1),
        melee: st.rng < 2, heal: h.cls === 'pal' ? 0.24 * pow * (1 + (st.healF || 0)) : 0, cd, wall: h.cls === 'cav' ? Math.min(0.6, 5 / cd) : 0,
        thr: Math.max(0.12, G.clamp(G.CAUTION[h.caution].thr + G.traitSum(h, 'retreat'), 0.08, 0.7) + 0.14 - CFG.brave) };
    });
    const n = trials || CFG.trials, dt = 0.5; let wins = 0;
    /* ruído determinístico: a estimativa não consome o gerador da simulação */
    let seed = (Math.floor(G.S.t) * 2654435761 + b.id * 40503) >>> 0;
    const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const swing = () => 1 + (rnd() + rnd() - 1) * CFG.spread * 2;
    for (let k = 0; k < n; k++) {
      const A = P.map((p) => ({ p, hp: p.hp, pots: p.pots, potCd: 0, skT: p.cd * rnd(), luck: swing() }));
      let hpB = b.hp, t = 0, special = 4, won = false; const bossLuck = swing() * CFG.bossK * wary;
      while (t < 200 && A.length) {
        t += dt;
        let dmg = 0; for (const a of A) dmg += a.p.dps * a.luck * CFG.uptime * dt;
        hpB -= dmg; if (hpB <= 0) { won = true; break; }
        if (def && def.regen) hpB = Math.min(b.hpMax, hpB + b.hpMax * 0.004 * dt);
        const frac = hpB / b.hpMax;
        let tg = A[0]; for (const a of A) if (a.p.melee) { tg = a; break; }
        tg.hp -= tg.p.blow * bossLuck * (1 - tg.p.wall * 0.55) * dt / Math.max(0.5, b.int);
        special -= dt;
        if (special <= 0) { special = frac <= 0.33 ? 4.5 : 6; for (const a of A) if (rnd() < 0.5) a.hp -= a.p.blow * bossLuck * CFG.splash * (frac <= 0.33 ? 1.25 : 1); }
        for (let i = A.length - 1; i >= 0; i--) {
          const a = A[i]; a.potCd -= dt; a.skT -= dt;
          if (a.p.heal && a.skT <= 0) { a.skT = a.p.cd; for (const o of A) o.hp = Math.min(o.p.max, o.hp + o.p.max * a.p.heal); }
          if (a.hp < a.p.max * 0.45 && a.pots > 0 && a.potCd <= 0) { a.hp = Math.min(a.p.max, a.hp + a.p.potV); a.pots--; a.potCd = 6; }
          if (a.hp <= 0 || (a.hp < a.p.max * a.p.thr && a.pots <= 0)) A.splice(i, 1);
        }
      }
      if (won) wins++;
    }
    return wins / n;
  };
  const oddsFor = (z, b, party) => {
    const c = oddsCache[z.id], key = b.id + ':' + party.map((h) => h.id).join(',');
    if (c && c.key === key && G.S.t - c.t < 4) return c.p;
    const p = G.bossOdds(b, party); oddsCache[z.id] = { t: G.S.t, p, key }; return p;
  };

  /* ---------- ponto de encontro: fora do faro do chefe, do lado da entrada da zona ---------- */
  const stageOf = (r) => {
    if (r.stage) return r.stage;
    const z = G.ZONE[r.z], b = bossById(r.boss), e = G.entryPoint(z), bx = b ? b.hx : z.lair[0], by = b ? b.hy : z.lair[1];
    const dx = e[0] - bx, dy = e[1] - by, len = Math.hypot(dx, dy) || 1;
    r.stage = W.nearestWalk(bx + dx / len * 7.5, by + dy / len * 7.5);
    return r.stage;
  };
  const spot = (r, h) => { const s = stageOf(r), a = (h.id * 2.399) % 6.283, q = W.nearestWalk(s[0] + Math.cos(a) * 1.5, s[1] + Math.sin(a) * 1.1); return q; };

  const bossName = (r) => G.MON[G.ZONE[r.z].boss].name;
  const join = (h, r) => {
    h._rally = r.boss; h._rallyZ = r.z; h._rallyAt = 0;
    if (outside(h) && !h.inside) {
      if (h.tgt && h.tgt.tgt === h && !h.tgt.dead && G.dist(h, h.tgt) < 3) return;      // termina a luta em que já está
      h.zone = r.z; h.edge = false; h.mentor = 0; h.tgt = null; h.state = 'travel';
      const p = spot(r, h); G.go(h, p[0], p[1]);
      G.heroWhy(h, 'Convocado contra ' + bossName(r) + '.', 'Reunir a companhia e atacar juntos.');
    } else if (h.state === 'town' || h.state === 'idle') { h.state = 'town'; h.tThink = Math.min(h.tThink || 0, 0.3); }
  };
  const leave = (h) => { h._rally = 0; h._rallyZ = null; h._rallyAt = 0; };
  const membersOf = (r) => G.S.heroes.filter((h) => h._rally === r.boss && h._rallyZ === r.z && live(h));

  const begin = (z, b, party, studied) => {
    const r = (rallies[z.id] = { z: z.id, boss: b.id, phase: 'call', t0: G.S.t, firstAt: 0, assaultAt: 0, falls: 0, studied: !!studied, hp0: b.hp, stage: null });
    b.until = Math.max(b.until || 0, G.S.t + CFG.callMax + CFG.assaultMax);
    for (const h of party) join(h, r);
    G.log(studied ? 'A companhia sente que agora pode vencer ' + bossName(r) + ' e parte unida.' : 'A companhia foi convocada contra ' + bossName(r) + '.', 'boss');
    G.emit('rally', { z: z.id, phase: 'call', studied: !!studied });
    return r;
  };
  const end = (r, result) => {
    const S = G.S, zs = S.zones[r.z], b = bossById(r.boss);
    for (const h of S.heroes) if (h._rally === r.boss) leave(h);
    delete rallies[r.z];
    coolUntil[r.z] = S.t + CFG.cooldown;
    if (result === 'win') { zs.bf = 0; zs.bb = Math.max(1, (zs.bb || 1) * 0.9); }
    else if (result === 'fail') {
      const fought = r.assaultAt && (r.falls > 0 || (b && b.hp < r.hp0 - 1));
      if (fought) {
        zs.bf = (zs.bf || 0) + 1;
        if (r.studied) zs.bb = Math.min(2.2, (zs.bb || 1) * 1.15);          // a conta estava otimista: desconfia mais deste chefe
        if (zs.bf === CFG.study) G.log('Depois de ' + CFG.study + ' derrotas seguidas, a companhia decidiu estudar ' + bossName(r) + ' antes de tentar de novo.', 'boss');
        else G.log('A investida contra ' + bossName(r) + ' fracassou. A companhia recua para se recompor.', 'bad');
      }
    }
    G.emit('rally', { z: r.z, phase: 'end', result, pred: r.pred, studied: r.studied, falls: r.falls });
  };

  /* ---------- ganchos chamados pelo núcleo (ver 30-chefes.patch.txt) ---------- */
  /* zona que um herói convocado deve escolher ao sair da cidade */
  G.rallyZone = (h) => { const r = rallyOf(h); return r ? r.z : null; };
  /* alvo de um herói convocado: undefined = regra normal; null = não ataca agora */
  G.rallyFind = (h, list) => {
    const r = rallyOf(h); if (!r) { if (h._rally) leave(h); return undefined; }
    const b = bossById(r.boss); if (!b) return undefined;
    if (r.phase === 'assault') return b;
    let best = null, bd = 3.2;
    for (const m of list) { if (m.dead || m.gone || m.boss || m.tgt !== h) continue; const d = G.dist(h, m); if (d < bd) { bd = d; best = m; } }
    return best;
  };
  /* true = este herói não deve puxar o chefe sozinho agora */
  G.bossHold = (h, m) => {
    if (m.rift || m.raid || m.inc || m.colosso || m.zi < 0) return false;
    const z = G.ZONES[m.zi]; if (!z) return false;
    const r = rallies[z.id];
    if (r) return r.phase !== 'assault';                                      // reunião em curso: ninguém ataca antes da hora
    if (m.tgt && live(m.tgt)) return false;                                   // alguém já está na luta: pode ajudar
    return (G.S.zones[z.id].bf || 0) >= CFG.study;                            // em estudo: só com a companhia inteira
  };
  /* movimento de grupo, chamado no começo de cada passo de caça */
  G.groupMove = (h, dt, st) => {
    const r = rallyOf(h); if (!r) { if (h._rally) leave(h); return false; }
    if (r.phase !== 'call') return false;
    if (h.tgt && !h.tgt.dead && !h.tgt.gone && !h.tgt.boss && h.tgt.tgt === h && G.dist(h, h.tgt) < 4) return false;   // defende-se
    h.tgt = null;
    const p = spot(r, h), d = Math.hypot(p[0] - h.x, p[1] - h.y);
    if (d > 1.1) { if (!h.path || !h.path.length || Math.hypot((h._gx || 0) - p[0], (h._gy || 0) - p[1]) > 0.5) G.go(h, p[0], p[1]); G.step(h, dt, st.spd); h._rallyAt = 0; }
    else { h.moving = false; h.path = null; if (!h._rallyAt) h._rallyAt = G.S.t; const b = bossById(r.boss); if (b) h.dir = b.x >= h.x ? 1 : -1; }
    if (h.why == null || h.why.indexOf('Reunindo') !== 0) G.heroWhy(h, 'Reunindo a companhia para enfrentar ' + bossName(r) + '.', 'Atacar todos juntos.');
    return true;
  };
  /* na investida o herói aguenta um pouco mais antes de recuar */
  const thr0 = G.retreatThr;
  G.retreatThr = (h, st, m) => {
    const thr = thr0 ? thr0(h, st, m) : G.clamp(G.CAUTION[h.caution].thr + G.traitSum(h, 'retreat'), 0.08, 0.7);
    const r = rallyOf(h);
    return r && r.phase === 'assault' && m && m.boss ? Math.max(0.12, thr - CFG.brave) : thr;
  };
  /* um chefe com convocação pendente não é "arriscado demais": a decisão já foi tomada em grupo */
  G.hook('heroOptions', (h, opts) => {
    const r = rallyOf(h); if (!r || !fit(h)) return;
    opts.push({ id: 'rally', score: 92, why: 'Convocado contra ' + bossName(r) + '.', next: 'Reunir a companhia e atacar juntos.' });
  }, 500);

  /* ---------- condução das investidas (2×/s) ---------- */
  let acc = 0;
  const conduct = () => {
    const S = G.S;
    for (const z of G.ZONES) {
      if (!G.zoneUnlocked(z)) continue;
      const zs = S.zones[z.id], b = zoneBoss(z); let r = rallies[z.id];
      if (r && (!b || b.id !== r.boss)) { end(r, b ? 'gone' : zs.boss ? 'gone' : 'win'); r = null; }
      if (!b) continue;
      if (!r) {
        if (S.mare.active || S.ev.curfew > S.t || S.t < (coolUntil[z.id] || 0)) continue;
        if (Object.keys(rallies).length) continue;                             // uma investida por vez
        const roster = S.heroes.filter((h) => worthy(h, b, z)); if (!roster.length) continue;
        const ready = roster.filter(fit);
        if ((zs.bf || 0) >= CFG.study) {
          /* estudo: todos prontos e conta acima de 80% */
          if (ready.length < roster.length) continue;
          if (oddsFor(z, b, ready) < CFG.odds) continue;
          begin(z, b, ready, true);
        } else {
          const need = Math.max(1, Math.ceil(roster.length * CFG.quorum));
          if (ready.length < need && S.t - b.born < CFG.grace) continue;
          if (!ready.length) continue;
          begin(z, b, ready, false);
        }
        continue;
      }
      const mem = membersOf(r);
      if (r.phase === 'call') {
        /* quem ficou apto depois da chamada ainda entra */
        for (const h of S.heroes) if (!h._rally && worthy(h, b, z) && fit(h) && (!r.studied || true)) { join(h, r); mem.push(h); }
        if (!mem.length) { end(r, 'empty'); continue; }
        const st = stageOf(r), there = mem.filter((h) => h.state === 'hunt' && Math.hypot(h.x - st[0], h.y - st[1]) < 3.2);
        if (there.length && !r.firstAt) r.firstAt = S.t;
        const pulled = b.tgt && live(b.tgt);
        const all = there.length >= mem.length;
        const timeUp = (r.firstAt && S.t - r.firstAt > CFG.wait && there.length >= Math.ceil(mem.length * 0.5)) || S.t - r.t0 > CFG.callMax;
        if (pulled || all || timeUp) {
          if (!there.length && !pulled) { end(r, 'empty'); continue; }
          r.phase = 'assault'; r.assaultAt = S.t; r.hp0 = b.hp;
          r.pred = G.bossOdds(b, pulled && !there.length ? mem : there.length ? mem.filter((h) => h.state === 'hunt' || h.state === 'travel') : mem);
          b.until = Math.max(b.until || 0, S.t + CFG.assaultMax);
          for (const h of mem) { h.tThink = 0; G.heroWhy(h, 'Investindo contra ' + bossName(r) + ' com a companhia.', 'Derrubar o chefe.'); }
          const lead = there[0] || mem[0]; if (lead && G.bark) G.bark(lead, 'boss', 1);
          G.emit('rally', { z: z.id, phase: 'assault' });
        }
      } else {
        const fighting = mem.filter((h) => (h.state === 'hunt' || h.state === 'travel') && !h.inside);
        /* quem recuou sai da investida; quem ficou segue lutando */
        for (const h of mem) if (h.state === 'flee' || h.state === 'return' || h.state === 'goto' || h.state === 'inside') leave(h);
        if (!fighting.length || S.t - r.assaultAt > CFG.assaultMax) end(r, 'fail');
      }
    }
  };
  G.hook('tick', (dt) => { acc += dt; if (acc < 0.5) return; acc = 0; if (G.S) conduct(); }, 150);
  G.hook('heroFallen', (h, m) => {
    if (!m || !m.boss || m.zi < 0 || m.rift || m.raid || m.inc || m.colosso) return;
    const z = G.ZONES[m.zi]; if (!z) return;
    const r = rallies[z.id];
    if (r) { r.falls++; leave(h); return; }
    /* queda fora de uma investida (herói teimoso, chefe que veio atrás): também é uma derrota para este chefe */
    const zs = G.S.zones[z.id]; zs.bf = (zs.bf || 0) + 1;
    if (zs.bf === CFG.study) G.log('Depois de ' + CFG.study + ' derrotas seguidas, a companhia decidiu estudar ' + G.MON[m.k].name + ' antes de tentar de novo.', 'boss');
  }, 150);
  G.hook('bossDefeated', (zid) => { const r = rallies[zid]; const zs = G.S.zones[zid]; if (r) end(r, 'win'); else if (zs) { zs.bf = 0; zs.bb = Math.max(1, (zs.bb || 1) * 0.9); } }, 150);
  const reset = () => { for (const k in rallies) delete rallies[k]; for (const k in coolUntil) delete coolUntil[k]; for (const k in oddsCache) delete oddsCache[k]; acc = 0; if (G.S) for (const h of G.S.heroes) leave(h); };
  G.hook('newGame', reset, 150); G.hook('afterLoad', reset, 150);

  /* leitura para testes e para a ficha do herói */
  G.rallyState = (zid) => { const r = rallies[zid], zs = G.S.zones[zid]; return { fails: zs.bf || 0, wary: zs.bb || 1, studying: (zs.bf || 0) >= CFG.study, phase: r ? r.phase : null, members: r ? membersOf(r).length : 0, falls: r ? r.falls : 0 }; };
  G.rallyOdds = (zid) => { const z = G.ZONE[zid], b = z && zoneBoss(z); if (!b) return null; return G.bossOdds(b, G.S.heroes.filter((h) => worthy(h, b, z))); };
})();
