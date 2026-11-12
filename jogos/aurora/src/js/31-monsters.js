/* 31-monsters: monstros das zonas, elites, chefes, Maré da Fenda e Fenda Infinita. */
'use strict';
(function () {
  const Wd = G.W;
  G.mons = [];            // não é salvo: o mundo repovoa ao carregar
  let spawnT = 0;

  G.makeMon = (k, lvl, x, y, o) => {
    const d = G.MON[k], p = G.PW(lvl), S = G.S;
    o = o || {};
    const el = o.elite ? 1 : 0;
    const night = G.isNight(S.clock) ? 1.12 : 1;
    const red = S.ev.redMoon > S.t ? 1.25 : 1;
    const m = {
      id: G.uid(), k, lvl, x, y, hx: x, hy: y, dir: Math.random() < 0.5 ? 1 : -1, zi: o.zi == null ? -1 : o.zi,
      hpMax: Math.round(42 * p * d.hp * (el ? 3.2 : 1) * (o.hpMult || 1) * (o.rift ? 1 : G.diffCur().hp)), atk: 11.5 * p * d.atk * (el ? 1.45 : 1) * night * red * (o.atkMult || 1) * (o.rift ? 1 : G.diffCur().atk), def: 3 * p * (d.def || 1) * (el ? 1.3 : 1),
      eva: d.eva || 0, spd: d.spd, int: d.int, rng: d.rng, size: (d.size || 1) * (el ? 1.25 : 1), elite: el, boss: d.boss ? 1 : 0,
      state: 'wander', tgt: null, tAtk: G.rnd(0.3, 1), tThink: Math.random(), wT: G.rnd(0, 3), hitBy: {}, raid: o.raid || 0, rift: o.rift || 0, dead: false, born: S.t, tSlam: 6,
    };
    m.hp = m.hpMax;
    return m;
  };

  /* ---------- nascimento nas zonas ---------- */
  const spawnZone = (z, zi) => {
    const S = G.S, zs = S.zones[z.id];
    let n = 0; for (const m of G.mons) if (m.zi === zi && !m.dead && !m.boss) n++;
    if (n >= z.cap) return;
    let pos = null;
    for (let i = 0; i < 8 && !pos; i++) {
      const p = Wd.randIn(z.rect);
      if (Wd.zoneAt(p[0], p[1]) !== zi) continue;
      let ok = true; for (const h of S.heroes) if (!h.inside && Math.hypot(h.x - p[0], h.y - p[1]) < 5.5) { ok = false; break; }
      if (ok) pos = p;
    }
    if (!pos) return;
    const k = G.wpick(z.mons), d = G.MON[k];
    const lvl = Math.max(1, G.zoneLvl(z, zs.tier) + d.lo + G.ri(0, 1));
    const eliteP = Math.min(0.12, 0.025 + 0.003 * S.realm.lvl) * (G.isNight(S.clock) ? 1.6 : 1) * (S.ev.redMoon > S.t ? 2 : 1);
    const m = G.makeMon(k, lvl, pos[0], pos[1], { zi, elite: S.day > 1 && Math.random() < eliteP });
    G.mons.push(m);
    if (d.pack && !m.elite && n + 2 < z.cap) for (let i = 0; i < G.ri(1, 2); i++) { const q = Wd.nearestWalk(pos[0] + G.rnd(-1.4, 1.4), pos[1] + G.rnd(-1.4, 1.4)); G.mons.push(G.makeMon(k, lvl, q[0], q[1], { zi })); }
  };
  G.populate = () => { for (let r = 0; r < 14; r++) G.ZONES.forEach((z, zi) => { if (G.zoneUnlocked(z)) spawnZone(z, zi); }); };

  /* ---------- chefes de zona ---------- */
  G.gaugeNeed = (z) => 45 + 12 * Math.min(10, G.S.zones[z.id].tier);
  G.spawnBoss = (z) => {
    const S = G.S, zs = S.zones[z.id], zi = G.ZONES.indexOf(z);
    const lvl = G.zoneLvl(z, zs.tier) + 3;
    const p = Wd.nearestWalk(z.lair[0], z.lair[1]);
    const m = G.makeMon(z.boss, lvl, p[0], p[1], { zi });
    m.until = S.t + G.DAY_SEC * 1.2; G.mons.push(m); zs.boss = 1;
    G.log(G.MON[z.boss].name + ' despertou em ' + z.name + '! Nível ' + lvl + '.', 'boss');
    G.toast(G.MON[z.boss].name + ' despertou!', 'boss', 'skull'); G.sfx('boss'); G.emit('boss', { z: z.id, m });
  };

  /* ---------- morte e espólio ---------- */
  G.bestTier = (fam) => { const n = G.S.bestiary[fam] || 0; let t = 0; while (t < G.BEST_TIERS.length && n >= G.BEST_TIERS[t]) t++; return t; };
  G.bestBonus = (fam) => G.bestTier(fam) * 0.03;
  const addBag = (h, id, n) => { h.bag[id] = (h.bag[id] || 0) + n; h.bagN += n; };
  G.killMon = (m, h) => {
    if (m.dead) return;
    const S = G.S, d = G.MON[m.k];
    m.dead = true; m.hp = 0;
    const z = m.zi >= 0 && m.zi < G.ZONES.length ? G.ZONES[m.zi] : null;
    const zs = z ? S.zones[z.id] : null;
    const tier = zs ? zs.tier : 0;
    const bossM = m.boss ? 30 : m.elite ? 5 : 1;
    const red = S.ev.redMoon > S.t ? 2 : 1;
    const night = G.isNight(S.clock) ? 1.2 : 1;
    /* experiência: quem bateu divide a glória */
    const xpBase = 7 * Math.pow(1.062, m.lvl - 1) * (d.xp || 1) * (m.boss ? 22 : m.elite ? 4.5 : 1) * night * (m.raid ? 0.7 : 1) * (m.rift ? 1 : G.diffCur().rw);
    for (const hh of S.heroes) {
      if (!m.hitBy[hh.id] || hh.state === 'fallen') continue;
      const diff = hh.lvl - m.lvl;
      const f = diff > 5 ? Math.max(0.15, 1 - 0.13 * (diff - 5)) : diff < 0 ? Math.min(1.6, 1 - 0.06 * diff) : 1;
      G.giveXp(hh, xpBase * f * (hh === h ? 1 : 0.6));
    }
    /* moedas para a bolsa do herói: é o que ele vai gastar na sua cidade */
    const hst = G.heroStats(h);
    const gold = 2.4 * G.PM(m.lvl) * (d.gold || 1) * (m.boss ? 40 : m.elite ? 6 : 1) * G.rnd(0.8, 1.2) * G.bless('fortuna') * night * (1 + hst.goldF) * (m.rift ? 1 : G.diffCur().rw);
    h.gold += gold; h.kills++; S.rep.today.loot = (S.rep.today.loot || 0) + gold;
    if (gold >= 1) G.addFx({ t: 'coin', x: m.x, y: m.y - 0.4, n: Math.round(gold), tx: h.x, ty: h.y });
    /* materiais */
    const dropM = (1 + G.traitSum(h, 'drop') + hst.dropF) * G.bless('colheita') * (1 + G.bestBonus(d.fam)) * red * (m.rift ? 1 : G.diffCur().drop);
    if (z) {
      const zm = G.ZMATS[z.n], addBag = (hh, id, n) => G.lootGive(hh, m, id, n); // v22: metade na bolsa, metade no chão
      if (m.boss) {
        addBag(h, zm.e, 1 + (Math.random() < 0.25 * dropM ? 1 : 0)); addBag(h, zm.r, G.ri(2, 3)); addBag(h, zm.a, G.ri(5, 8)); addBag(h, zm.b, G.ri(5, 8));
        addBag(h, 'alma', 1); addBag(h, 'tomo', G.ri(1, 2)); addBag(h, 'po_estelar', G.ri(1, 3));
        S.nucleos += 2 + Math.floor(tier / 3); G.addFx({ t: 'text', x: m.x, y: m.y - 1.6, s: '+Núcleos', c: '#c8a0ff' });
      } else {
        const mat = d.mat === 'b' ? zm.b : zm.a;
        const p = Math.min(0.95, (0.5 + 0.03 * tier) * dropM);
        let n = (Math.random() < p ? 1 : 0) + (m.elite ? G.ri(2, 4) : 0) + (Math.random() < 0.12 * tier ? 1 : 0);
        if (n) addBag(h, mat, n);
        if (Math.random() < (m.elite ? 0.4 : 0.03) * dropM) addBag(h, zm.r, 1);
        if (m.elite && Math.random() < 0.16 * dropM) addBag(h, 'tomo', 1);
        if (m.elite && Math.random() < 0.15 * dropM) addBag(h, 'po_estelar', 1);
        if (m.elite && Math.random() < 0.12 * dropM) { S.nucleos++; G.addFx({ t: 'text', x: m.x, y: m.y - 1.4, s: '+1 Núcleo', c: '#c8a0ff' }); }
      }
    }
    /* contadores */
    S.stats.kills++; S.rep.today.kills = (S.rep.today.kills || 0) + 1;
    S.bestiary[d.fam] = (S.bestiary[d.fam] || 0) + 1;
    if (m.elite) S.stats.elites++;
    G.gainRealm(Math.pow(1.045, m.lvl) * bossM, 'kill');
    G.questEvent('kill', 1, z ? z.id : null); if (m.elite) G.questEvent('elite', 1);
    if (zs && !m.boss && !m.raid) {
      zs.kills++;
      if (!zs.boss) { zs.gauge += m.elite ? 4 : 1; if (zs.gauge >= G.gaugeNeed(z)) { zs.gauge = 0; G.spawnBoss(z); } }
    }
    if (m.boss && zs && !m.rift) {
      zs.boss = 0; zs.bossKills++; S.stats.bosses++;
      if (S.diff >= 2) S.stats.hardBoss = (S.stats.hardBoss || 0) + 1;
      G.relicRoll(z.id, h);
      S.selos += 1; G.earn(Math.round(60 * G.PM(m.lvl)), 'chefes');
      let up = '';
      if (zs.tier >= zs.maxTier) { zs.maxTier++; if (!zs.lock) { zs.tier = zs.maxTier; up = ' A corrupção da zona subiu para ' + G.roman(zs.tier + 1) + ': monstros mais fortes, espólio melhor.'; } }
      G.log(h.name + ' derrubou ' + d.name + '! +1 Selo de Renome.' + up, 'epic');
      G.toast(d.name + ' foi derrotado!', 'epic', 'crown'); G.sfx('victory'); G.questEvent('boss', 1, z.id); G.emit('bosskill', { z: z.id });
      for (const hh of S.heroes) if (m.hitBy[hh.id]) { hh.animo = Math.min(100, hh.animo + 25); G.artGain(hh, 2); }
      if (up) for (const o of G.mons) if (o.zi === m.zi && !o.dead && !o.tgt) o.gone = true; // repovoa no novo nível
    }
    if (m.raid && S.mare.active) S.mare.active.killed++;
    if (m.rift && S.rift.run) { if (m.boss) G.riftWin(); }
    G.addFx({ t: 'death', x: m.x, y: m.y, k: m.k, size: m.size, boss: m.boss }); G.sfx(m.boss ? 'bossdie' : 'die', m.x, m.y);
    if (m.boss) G.addFx({ t: 'shake', n: 10 });
  };

  /* ---------- IA ---------- */
  const leash = (m) => (m.boss ? 8 : 11);
  const pickHero = (m, r) => {
    let best = null, bd = r;
    for (const h of G.S.heroes) {
      if (h.inside || h.state === 'fallen' || h.state === 'recover') continue;
      if (m.inc && h.state !== 'inc') continue;
      if (!m.raid && Wd.inTown(h.x, h.y)) continue;
      const d = Math.hypot(h.x - m.x, h.y - m.y); if (d < bd) { bd = d; best = h; }
    }
    return best;
  };
  const strike = (m, h) => {
    const d = G.MON[m.k];
    m.tAtk = m.int; m.swing = 0.25; m.dir = h.x >= m.x ? 1 : -1;
    if (d.ranged) G.addFx({ t: 'proj', x: m.x, y: m.y - 0.6 * m.size, tx: h.x, ty: h.y - 0.5, k: 'orb', c: d.ranged });
    G.dmgToHero(m, h, 1);
  };
  const updateMon = (m, dt) => {
    const S = G.S, d = G.MON[m.k];
    if (m.tAtk > 0) m.tAtk -= dt; if (m.swing > 0) m.swing -= dt; if (m.flash > 0) m.flash -= dt;
    if (m.until && S.t > m.until && !m.tgt) { m.gone = true; if (m.boss && m.zi >= 0) { const z = G.ZONES[m.zi]; S.zones[z.id].boss = 0; S.zones[z.id].gauge = Math.round(G.gaugeNeed(z) * 0.4); G.log(d.name + ' voltou para as sombras de ' + z.name + '.', 'info'); } return; }
    /* v20: efeitos das habilidades de vocação — veneno/queimadura, atordoamento e lentidão */
    if (m.dot && m.dot.until > S.t) {
      m.hp -= m.dot.dps * dt; m.dotT = (m.dotT || 0) - dt;
      if (m.dotT <= 0) { m.dotT = 0.7; G.addFx({ t: 'dmg', x: m.x, y: m.y - 0.7 * (m.size || 1), n: Math.max(1, Math.round(m.dot.dps * 0.7)), c: m.dot.c }); }
      if (m.hp <= 0) { const by = S.heroes.find((x) => x.id === m.dot.by) || S.heroes[0]; if (by) { m.hitBy[by.id] = 1; G.killMon(m, by); } else m.gone = true; return; }
    }
    if (m.stun > S.t) { m.moving = false; if (Math.random() < dt * 3) G.addFx({ t: 'text', x: m.x, y: m.y - 1.1 * (m.size || 1), s: '✦', c: '#ffe07a' }); return; }
    const mspd = m.slow > S.t ? m.spd * (m.slowF || 0.5) : m.spd;
    m.tThink -= dt;
    const think = m.tThink <= 0; if (think) m.tThink = 0.3;
    let t = m.tgt;
    if (t && (t.inside || t.state === 'fallen' || t.state === 'recover' || (m.inc && t.state !== 'inc') || (!m.raid && Wd.inTown(t.x, t.y)))) t = m.tgt = null;
    if (m.boss) {
      /* golpe em área telegrafado */
      m.tSlam -= dt;
      if (m.slam) { m.slam.t -= dt; if (m.slam.t <= 0) { for (const h of S.heroes) if (!h.inside && Math.hypot(h.x - m.slam.x, h.y - m.slam.y) < m.slam.r) G.dmgToHero(m, h, 1.5); G.addFx({ t: 'boom', x: m.slam.x, y: m.slam.y, c: d.pal[2], r: m.slam.r }); G.addFx({ t: 'shake', n: 6 }); G.sfx('boom', m.x, m.y); m.slam = null; } }
      else if (m.tSlam <= 0 && t && G.dist(t, m) < 6) { m.tSlam = m.hp < m.hpMax * 0.3 ? 4.5 : 7.5; m.slam = { x: t.x, y: t.y, r: 2.6, t: 1.3 }; G.addFx({ t: 'warn', x: t.x, y: t.y, r: 2.6, d: 1.3 }); }
    }
    switch (m.state) {
      case 'wander': {
        if (think) { const h = pickHero(m, m.boss ? 3.2 : m.elite ? 4.8 : 3.7); if (h) { m.tgt = h; m.state = 'chase'; if (d.pack) for (const o of G.mons) if (o !== m && o.k === m.k && !o.dead && o.state === 'wander' && G.dist(o, m) < 4.5) { o.tgt = h; o.state = 'chase'; } break; } }
        m.wT -= dt;
        if (m.wT <= 0) { m.wT = G.rnd(2.5, 6); const q = Wd.nearestWalk(m.hx + G.rnd(-3.5, 3.5), m.hy + G.rnd(-3.5, 3.5)); if (Wd.los(m.x, m.y, q[0], q[1])) m.path = [q]; }
        G.step(m, dt, m.spd * 0.38);
        break;
      }
      case 'chase': {
        if (!t) { m.state = m.raid ? 'march' : 'return'; m.path = null; break; }
        if (!m.raid && !m.rift && Math.hypot(m.x - m.hx, m.y - m.hy) > leash(m)) { m.tgt = null; m.state = 'return'; m.path = null; break; }
        if (G.chase(m, t.x, t.y, dt, mspd, m.rng + 0.25 * m.size)) { if (m.tAtk <= 0) strike(m, t); }
        break;
      }
      case 'return': {
        if (!m.path || !m.path.length) G.go(m, m.hx, m.hy);
        m.hp = Math.min(m.hpMax, m.hp + m.hpMax * 0.12 * dt);
        if (G.step(m, dt, m.spd)) { m.state = 'wander'; m.hitBy = {}; }
        break;
      }
      case 'march': { // invasores da Maré
        if (think) { const h = pickHero(m, 4.2); if (h) { m.tgt = h; m.state = 'chase'; break; } }
        if (!m.path || !m.path.length) G.go(m, Wd.plaza.cx + G.rnd(-1.5, 1.5), Wd.plaza.cy + G.rnd(1.2, 2.5));
        if (G.step(m, dt, mspd * 0.7) || Math.hypot(m.x - Wd.plaza.cx, m.y - Wd.plaza.cy) < 2.6) G.mareBreach(m);
        break;
      }
    }
  };

  G.updateMons = (dt) => {
    const S = G.S, ms = G.mons;
    spawnT -= dt;
    if (spawnT <= 0) { spawnT = 1.6; G.ZONES.forEach((z, zi) => { if (G.zoneUnlocked(z)) spawnZone(z, zi); }); }
    for (let i = ms.length - 1; i >= 0; i--) {
      const m = ms[i];
      if (m.dead || m.gone) { ms[i] = ms[ms.length - 1]; ms.pop(); continue; }
      updateMon(m, dt);
    }
    void S;
  };

  /* ================= Maré da Fenda ================= */
  G.mareLevel = () => { const S = G.S, a = G.avgHeroLvl(); return Math.max(1, Math.round(G.clamp(1 + S.realm.lvl * 2.2, a - 2, a + 3) * (1 - S.mare.ease))); };
  G.mareStart = () => {
    const S = G.S; if (S.mare.active) return;
    const gate = G.pick(['n', 's', 'w', 'e'].filter((g) => g !== 'e' || S.realm.lvl >= 6));
    const total = Math.round(G.clamp(8 + S.realm.lvl * 2, 9, 80) * (1 - S.mare.ease * 0.6) * (S.mare.wins + S.mare.losses === 0 ? 0.65 : 1));
    S.mare.active = { gate, total, spawned: 0, killed: 0, breach: 0, lvl: G.mareLevel(), t: 0, next: 2, start: S.t };
    G.log('A Maré da Fenda rompeu pelo portão ' + ({ n: 'norte', s: 'sul', w: 'oeste', e: 'leste' })[gate] + '! Todos às armas!', 'boss');
    G.toast('A Maré da Fenda chegou!', 'boss', 'skull'); G.sfx('horn'); G.emit('mare', { on: 1 });
  };
  const RAID_KINDS = [['goblin', 'lobo', 'slime'], ['esqueleto', 'goblin', 'morcego'], ['orc', 'aranha', 'esqueleto'], ['lagarto', 'orc', 'vespa'], ['yeti', 'lobogelo', 'orc'], ['salamandra', 'cao', 'cultista']];
  const mareTick = (dt) => {
    const S = G.S, a = S.mare.active; if (!a) return;
    a.t += dt; a.next -= dt;
    if (a.spawned < a.total && a.next <= 0) {
      a.next = 7.5;
      const g = G.GATES[a.gate];
      const ox = g.out[0] + (a.gate === 'w' ? -7 : a.gate === 'e' ? 7 : 0), oy = g.out[1] + (a.gate === 'n' ? -7 : a.gate === 's' ? 7 : 0);
      const wave = Math.min(a.total - a.spawned, G.ri(3, 5) + Math.floor(a.total / 14));
      const kinds = RAID_KINDS[Math.min(5, Math.floor(a.lvl / 9))];
      for (let i = 0; i < wave; i++) {
        const p = Wd.nearestWalk(ox + G.rnd(-2.5, 2.5), oy + G.rnd(-2.5, 2.5));
        const last = a.spawned === a.total - 1;
        const m = G.makeMon(G.pick(kinds), a.lvl + (last ? 2 : G.ri(-1, 0)), p[0], p[1], { raid: 1, elite: last || (a.spawned > 4 && Math.random() < 0.12), hpMult: last ? 2.5 : 1, atkMult: 1.12 });
        m.state = 'march'; G.mons.push(m); a.spawned++;
      }
    }
    /* a Torre de Vigia dispara */
    if (G.bOk('torre')) { a.tw = (a.tw || 0) - dt; if (a.tw <= 0) { a.tw = Math.max(0.8, 2.6 - 0.15 * G.bLvl('torre')); const cand = G.mons.filter((m) => m.raid && !m.dead); if (cand.length) { const m = G.pick(cand); const dmg = Math.round(26 * G.PW(a.lvl) * (0.6 + 0.3 * G.bLvl('torre')) * G.work('muralhas')); const tw = Wd.plots.torre; G.addFx({ t: 'proj', x: tw.cx, y: tw.y - 1.5, tx: m.x, ty: m.y - 0.5, k: 'arrow', c: '#ffe08a' }); m.hp -= dmg; G.addFx({ t: 'dmg', x: m.x, y: m.y - 0.7, n: dmg, c: '#ffe08a' }); if (m.hp <= 0) { const h = S.heroes.find((x) => x.state === 'defend') || S.heroes[0]; if (h) G.killMon(m, h); else { m.dead = true; a.killed++; } } } } }
    const alive = G.mons.some((m) => m.raid && !m.dead);
    const anyUp = S.heroes.some((h) => h.state === 'defend' || h.state === 'town' || h.state === 'goto' || h.state === 'inside');
    if ((a.spawned >= a.total && !alive) || a.t > 200 || (!anyUp && a.t > 20)) mareEnd();
  };
  G.mareBreach = (m) => {
    const S = G.S, a = S.mare.active; m.gone = true;
    if (!a) return;
    a.breach++;
    const steal = Math.min(Math.round(S.gold * 0.04), Math.round(60 * G.PM(a.lvl)));
    if (steal > 0) { S.gold -= steal; S.rep.today['-saque'] = (S.rep.today['-saque'] || 0) + steal; }
    const cand = G.BLD_IDS.filter((id) => G.bOk(id) && id !== 'cidadela' && !G.BLD[id].site);
    if (cand.length && Math.random() < 0.5) { const id = G.pick(cand); S.b[id].dmg = 1; G.log('Invasores danificaram ' + G.BLD[id].name + '. Ela fica fechada até ser consertada.', 'bad'); G.emit('bld'); }
    G.addFx({ t: 'boom', x: m.x, y: m.y, c: '#b06ae8', r: 1.6 }); G.addFx({ t: 'shake', n: 5 });
  };
  const mareEnd = () => {
    const S = G.S, a = S.mare.active; if (!a) return;
    for (const m of G.mons) if (m.raid) m.gone = true;
    const lost = a.breach >= Math.max(3, a.total * 0.35) || a.killed < a.total * 0.5;
    S.mare.active = null; S.mare.next = S.day + G.ri(5, 7); S.mare.warned = 0;
    if (lost) {
      S.mare.losses++; S.mare.ease = Math.min(0.4, S.mare.ease + 0.12); S.happy = Math.max(10, (S.happy || 70) - 15);
      G.log('A Maré passou por cima de Aurora. ' + a.breach + ' invasores chegaram à praça. A próxima virá um pouco mais fraca.', 'bad');
      G.toast('Aurora sofreu com a Maré…', 'bad', 'skull');
      G.emit('mare', { on: 0, win: 0, a });
    } else {
      S.mare.wins++; S.mare.ease = Math.max(0, S.mare.ease - 0.06); S.happy = Math.min(100, (S.happy || 70) + 10);
      const gold = Math.round(90 * G.PM(a.lvl) * (1 + a.total / 20)), selos = 1 + Math.floor(S.realm.lvl / 10), nuc = 1 + (Math.random() < 0.5 ? 1 : 0);
      G.earn(gold, 'mare'); S.selos += selos; S.nucleos += nuc; G.gainRealm(60 + 12 * S.realm.lvl, 'mare');
      const almas = 1 + Math.floor(S.realm.lvl / 12); G.addRes('alma', almas); G.addRes('tomo', 1);
      G.log('Aurora resistiu à Maré da Fenda! +' + G.fmt(gold) + ' moedas, +' + selos + ' Selo(s), +' + nuc + ' Núcleo(s), +' + almas + ' Cristal(is) de Alma e +1 Tomo de Técnica.', 'epic');
      G.toast('A Maré foi repelida!', 'epic', 'crown'); G.sfx('victory'); G.questEvent('mare', 1);
      G.emit('mare', { on: 0, win: 1, a, gold, selos, nuc });
    }
  };

  /* ================= Fenda Infinita ================= */
  G.riftLvl = (f) => 6 + 3 * f;
  G.riftOpen = () => G.S.realm.lvl >= 5;
  G.riftCanStart = () => { const S = G.S; return G.riftOpen() && !S.rift.run && !S.mare.active && !(S.inc && S.inc.run) && (S.rift.dayDone !== S.day || S.nucleos >= 3); };
  G.riftStart = (ids) => {
    const S = G.S; if (!G.riftCanStart()) return false;
    const party = S.heroes.filter((h) => ids.indexOf(h.id) >= 0 && h.state !== 'fallen' && h.state !== 'recover').slice(0, 5);
    if (!party.length) return false;
    if (S.rift.dayDone === S.day) S.nucleos -= 3;
    S.rift.dayDone = S.day;
    S.rift.run = { floor: S.rift.floor, ids: party.map((h) => h.id), phase: 'walk', t: 0, limit: 150 };
    for (const h of party) { h.state = 'rift'; h.inside = null; h.tgt = null; G.go(h, G.CRATER.center[0] + G.rnd(-2, 2), G.CRATER.center[1] + 3 + G.rnd(-1, 1)); }
    G.log('Uma expedição de ' + party.length + ' heróis partiu para o andar ' + S.rift.floor + ' da Fenda Infinita.', 'boss'); G.emit('rift');
    return true;
  };
  const RIFT_BOSS = ['arauto', 'anciao', 'lich', 'hidra', 'brumas', 'wyrm', 'dragao'];
  const riftTick = (dt) => {
    const S = G.S, r = S.rift.run; if (!r) return;
    r.t += dt;
    const party = S.heroes.filter((h) => r.ids.indexOf(h.id) >= 0);
    const up = party.filter((h) => h.state === 'rift');
    if (r.phase === 'walk') {
      const there = up.filter((h) => Math.hypot(h.x - G.CRATER.center[0], h.y - G.CRATER.center[1]) < 6).length;
      if ((there >= up.length && up.length) || (there > 0 && r.t > 70) || r.t > 110) {
        r.phase = 'fight'; r.t = 0;
        const lvl = G.riftLvl(r.floor), c = G.CRATER.center;
        const boss = G.makeMon(RIFT_BOSS[(r.floor - 1) % RIFT_BOSS.length], lvl + 2, c[0], c[1] - 2, { rift: 1, hpMult: 0.8 + up.length * 0.22 });
        G.mons.push(boss); r.boss = boss.id;
        const kinds = RAID_KINDS[Math.min(5, Math.floor(lvl / 9))];
        for (let i = 0; i < 2 + Math.floor(r.floor / 3); i++) { const p = Wd.nearestWalk(c[0] + G.rnd(-4, 4), c[1] + G.rnd(-4, 2)); G.mons.push(G.makeMon(G.pick(kinds), lvl, p[0], p[1], { rift: 1 })); }
        G.addFx({ t: 'boom', x: c[0], y: c[1] - 2, c: '#d070ff', r: 3.5 }); G.sfx('boss'); G.toast('Guardião do andar ' + r.floor + ' surgiu!', 'boss', 'skull');
      }
      if (!up.length) riftEnd(false);
    } else if (r.phase === 'fight') {
      if (!up.length || r.t > r.limit) riftEnd(false);
    }
  };
  G.riftHero = (h, dt, st, mons) => {
    const S = G.S, r = S.rift.run;
    if (!r) { h.state = 'return'; G.heroGoHome(h, false); return; }
    if (r.phase === 'walk') { G.step(h, dt, st.spd); return; }
    const frac = h.hp / st.hp;
    if (frac < 0.4 && h.potions > 0 && h.tPot <= 0) G.heroDrink(h, st);
    let m = h.tgt; if (m && (m.dead || m.gone || !m.rift)) m = h.tgt = null;
    if (!m) { let bd = 1e9; for (const o of mons) { if (o.dead || !o.rift) continue; const d = G.dist(o, h) + (o.boss ? 3 : 0); if (d < bd) { bd = d; m = o; } } h.tgt = m; }
    if (m && G.chase(h, m.x, m.y, dt, st.spd, st.rng + m.size * 0.35)) G.heroAct(h, m, mons, frac);
  };
  G.riftWin = () => {
    const S = G.S, r = S.rift.run; if (!r) return;
    const f = r.floor;
    const ess = 2 + Math.floor(f / 2), selos = 1 + (f % 5 === 0 ? 2 : 0), gold = Math.round(120 * G.PM(G.riftLvl(f)));
    G.addRes('essencia', ess); S.selos += selos; S.nucleos += 1; G.earn(gold, 'fenda'); G.gainRealm(80 + 20 * f, 'fenda');
    S.rift.best = Math.max(S.rift.best, f); S.rift.floor = f + 1;
    const tomos = 1 + Math.floor(f / 4), almas = f % 5 === 0 ? 2 : 0; G.addRes('tomo', tomos); if (almas) G.addRes('alma', almas);
    G.addRes('po_estelar', 2 + Math.floor(f / 5));
    if (f % 10 === 0) { G.cosGrant('r_arauto'); G.log('A Fenda cedeu uma relíquia: ' + G.COS.r_arauto.name + '.', 'epic'); }
    for (const h of S.heroes) if (h.state === 'rift') G.artGain(h, 1);
    G.log('Andar ' + f + ' da Fenda Infinita conquistado! +' + ess + ' Essência, +' + selos + ' Selo(s), +1 Núcleo, +' + tomos + ' Tomo(s)' + (almas ? ', +' + almas + ' Cristais de Alma' : '') + ', +' + G.fmt(gold) + ' moedas.', 'epic');
    G.toast('Andar ' + f + ' conquistado!', 'epic', 'crown'); G.sfx('victory'); G.questEvent('rift', 1);
    riftEnd(true);
  };
  const riftEnd = (win) => {
    const S = G.S, r = S.rift.run; if (!r) return;
    for (const m of G.mons) if (m.rift) m.gone = true;
    for (const h of S.heroes) if (h.state === 'rift') { h.state = 'return'; G.heroGoHome(h, false); }
    if (!win) { G.log('A expedição ao andar ' + r.floor + ' da Fenda fracassou.', 'bad'); G.toast('A Fenda venceu desta vez.', 'bad', 'skull'); }
    S.rift.run = null; G.emit('rift', { win });
  };

  G.updateEncounters = (dt) => { mareTick(dt); riftTick(dt); };
})();

;
