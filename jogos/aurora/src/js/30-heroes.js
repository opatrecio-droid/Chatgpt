/* 30-heroes: heróis — atributos, necessidades, decisões, caçada, queda e progressão. */
'use strict';
(function () {
  const Wd = G.W;

  /* ---------- movimento compartilhado ---------- */
  G.step = (e, dt, spd) => {
    const p = e.path; if (!p || !p.length) { e.moving = false; return true; }
    let rem = spd * dt;
    while (rem > 0 && p.length) {
      const dx = p[0][0] - e.x, dy = p[0][1] - e.y, d = Math.hypot(dx, dy);
      if (d <= rem) { e.x = p[0][0]; e.y = p[0][1]; p.shift(); rem -= d; }
      else { e.x += (dx / d) * rem; e.y += (dy / d) * rem; if (Math.abs(dx) > 0.02) e.dir = dx > 0 ? 1 : -1; rem = 0; }
    }
    e.moving = true;
    return !p.length;
  };
  G.go = (e, x, y) => { e.path = Wd.path(e.x, e.y, x, y); e._gx = x; e._gy = y; };
  /* persegue um ponto móvel; devolve true quando está a 'stop' de distância */
  G.chase = (e, tx, ty, dt, spd, stop) => {
    const d = Math.hypot(tx - e.x, ty - e.y);
    if (d <= stop) { e.moving = false; e.path = null; if (Math.abs(tx - e.x) > 0.05) e.dir = tx > e.x ? 1 : -1; return true; }
    e._rp = (e._rp || 0) - dt;
    if (!e.path || !e.path.length || e._rp <= 0 || Math.hypot(tx - (e._gx || 0), ty - (e._gy || 0)) > 1.2) {
      e._rp = 0.45 + Math.random() * 0.2;
      if (Wd.los(e.x, e.y, tx, ty)) { e.path = [[tx, ty]]; e._gx = tx; e._gy = ty; } else G.go(e, tx, ty);
    }
    G.step(e, dt, spd);
    return Math.hypot(tx - e.x, ty - e.y) <= stop;
  };

  /* ---------- criação ---------- */
  G.rollTraits = (n, forced) => {
    const out = forced ? forced.slice() : [];
    const pool = G.TRAIT_POOL.filter((t) => !out.includes(t));
    while (out.length < n && pool.length) {
      const t = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      if ((t === 'corajoso' && out.includes('medroso')) || (t === 'medroso' && out.includes('corajoso'))) continue;
      out.push(t);
    }
    return out;
  };
  G.rankForLevel = (l) => { let r = 0; while (r < 7 && l > G.RANK_CAP[r]) r++; return r; };
  G.makeHero = (o) => {
    const S = G.S;
    const used = new Set(S.heroes.map((h) => h.name));
    let name = o.name;
    if (!name) { const pool = G.HERO_NAMES.filter((n) => !used.has(n)); name = pool.length ? G.pick(pool) : G.pick(G.HERO_NAMES) + ' ' + G.roman(G.ri(2, 9)); }
    const cls = o.cls || G.pick(G.CLASS_IDS);
    const rar = o.rar || 0;
    const lvl = Math.max(1, o.lvl || 1);
    const h = {
      id: G.uid(), name, cls, rar, traits: o.traits || G.rollTraits(rar >= 3 ? 3 : 2), lvl, xp: 0, rank: G.rankForLevel(lvl), stars: 0,
      hp: 1, fome: G.rnd(70, 100), energia: G.rnd(75, 100), animo: 70, gold: o.gold || 0, bag: {}, bagN: 0, potions: o.potions == null ? 2 : o.potions,
      gear: { arma: null, armadura: null, elmo: null, luvas: null, botas: null, cinto: null, acessorio: null, anel: null }, caution: 1, order: 'auto',
      j2: null, j3: null, sk: [1, 1, 1], arts: {}, ap: 0, apB: 0, wake: 0, mount: 0, tS2: 5, tS3: 8, bv: {}, shield: 0,
      cos: { traje: null, asas: null, reliquia: null }, autoArt: 0, pet: 0, pets: [],
      state: 'town', x: Wd.portal.mouth[0], y: Wd.portal.mouth[1], dir: 1, zone: null, kills: 0, falls: 0, born: S.day,
      tAtk: 0, tSkill: 3, tPot: 0, tThink: 0, lastHit: -99, wound: 0, buff: {}, grace: 0,
      look: { skin: G.ri(0, 4), hair: G.ri(0, 9), style: G.ri(0, 5), seed: G.ri(1, 99999) },
    };
    // chega com o equipamento básico da sua faixa de nível (um tier abaixo do ideal)
    let gt = 1; while (gt < 6 && G.TIER_LVL(gt + 1) <= lvl - 4) gt++;
    if (o.weapon !== false) h.gear.arma = { id: G.uid(), type: G.CLASSES[cls].w, tier: gt, rar: 0, plus: 0 };
    if (lvl >= 6) h.gear.armadura = { id: G.uid(), type: G.CLASSES[cls].a, tier: gt, rar: 0, plus: 0 };
    h.hp = G.heroStats(h).hp;
    return h;
  };

  /* ---------- atributos ---------- */
  G.hasTrait = (h, t) => h.traits.indexOf(t) >= 0;
  G.traitSum = (h, key) => { let s = 0; for (const t of h.traits) { const d = G.TRAITS[t]; if (d && d[key]) s += d[key]; } return s; };
  G.heroStats = (h) => {
    const S = G.S;
    if (h._st && !h._dirty && h._stT === S._stGen) return h._st;
    const c = G.CLASSES[h.cls], B = G.heroBonus(h);
    const m = G.HW(h.lvl) * G.RANK_MULT[h.rank] * G.HERO_RAR_MULT[h.rar] * (1 + 0.3 * h.stars);
    let hp = c.hp * m * (1 + G.traitSum(h, 'hp') + B.hp) * G.bless('vigor');
    let atk = c.atk * m * (1 + G.traitSum(h, 'atk') + B.atk) * G.bless('lamina');
    let def = c.def * m * (1 + G.traitSum(h, 'def') + B.def) * G.bless('egide');
    let crit = c.crit + G.traitSum(h, 'crit') + B.crit, eva = c.eva + G.traitSum(h, 'eva') + B.eva, aspd = G.traitSum(h, 'aspd') + B.aspd, critDmg = 1.75 + B.critDmg, mspd = B.spd;
    for (const k in h.gear) { const it = h.gear[k]; if (!it) continue; const s = G.itemStats(it); atk += s.atk || 0; def += s.def || 0; hp += s.hp || 0; crit += s.crit || 0; eva += s.eva || 0; aspd += s.aspd || 0; critDmg += s.critDmg || 0; mspd += s.mspd || 0; }
    const st = { hp: Math.round(hp), atk, def, crit: Math.min(0.75, crit), eva: Math.min(0.6, eva), int: c.int / (1 + Math.max(-0.5, aspd)), rng: c.rng + B.rng, spd: c.spd * G.work('estradas') * (1 + mspd),
      critDmg, cdr: Math.min(0.5, B.cdr), goldF: B.gold, dropF: B.drop, xpF: B.xp, hungerF: B.hunger, tireF: B.tire, moodB: B.mood, healF: B.heal, eliteF: B.elite, thorns: B.thorns, bagB: B.bag, potB: B.pot };
    st.eff = G.effLevel(st);
    h._st = st; h._dirty = false; h._stT = S._stGen;
    return st;
  };
  G.dirtyAll = () => { G.S._stGen = (G.S._stGen || 0) + 1; };
  /* nível efetivo: até que nível de monstro comum o herói aguenta caçar com folga */
  G.effLevel = (st) => {
    let l = 1;
    for (; l < 400; l++) {
      const p = G.PW(l), mhp = 42 * p, matk = 11.5 * p, mdef = 3 * p;
      const dmg = (st.atk * st.atk) / (st.atk + mdef) * (1 + st.crit * ((st.critDmg || 1.75) - 1));
      const ttk = mhp / (dmg / st.int);
      const mdps = ((matk * matk) / (matk + st.def)) / 1.4 * (1 - st.eva);
      if (st.hp / mdps / ttk < 7) break;
    }
    return l - 1;
  };
  /* modificadores momentâneos (ânimo, ferimento, fome, bênçãos temporárias) */
  G.heroMod = (h) => {
    const S = G.S; let a = 1, d = 1;
    if (h.animo < 30) a *= 0.88; else if (h.animo > 80) a *= 1.06;
    if (h.fome <= 0) { a *= 0.8; d *= 0.9; }
    if (h.wound > S.t) { a *= 0.85; d *= 0.85; }
    if (S.ev.buff.furia > S.t) a *= 1.3;
    if (S.ev.buff.festival > S.t) a *= 1.08;
    if (h.buff.atk > S.t) a *= 1 + ((h.bv && h.bv.atk) || 0);
    if (G.isNight(S.clock) && G.decorLvl('lampioes')) a *= 1 + G.decorV('lampioes');
    if (G.hasTrait(h, 'notivago') && G.isNight(S.clock)) a *= 1 + 0.12 * G.traitMul(h, 'notivago');
    return { a, d };
  };
  G.avgHeroLvl = () => { const hs = G.S.heroes; if (!hs.length) return 1; const top = hs.map((h) => h.lvl).sort((a, b) => b - a).slice(0, 5); return top.reduce((a, b) => a + b, 0) / top.length; };
  G.heroCap = () => 3 + G.bLvl('hospedaria');
  G.bagCap = (h) => 14 + 3 * h.rank + G.heroStats(h).bagB;
  G.potCap = (h) => Math.min(8, 2 + Math.ceil(h.rank / 2) + G.heroStats(h).potB);
  G.heroTitle = (h) => (h.j3 && G.JOBS[h.j3] ? G.JOBS[h.j3].name : h.j2 && G.JOBS[h.j2] ? G.JOBS[h.j2].name : G.CLASSES[h.cls].name);
  G.stateLabel = (h) => {
    const z = h.zone && G.ZONE[h.zone];
    switch (h.state) {
      case 'hunt': return h.tgt && h.tgt.boss ? 'Enfrentando ' + G.MON[h.tgt.k].name : 'Caçando em ' + (z ? z.name : 'campo');
      case 'travel': return 'A caminho de ' + (z ? z.name : 'campo');
      case 'return': return 'Voltando para a cidade';
      case 'flee': return 'Recuando!';
      case 'fallen': return 'Caído em combate';
      case 'recover': return 'Em recuperação';
      case 'defend': return 'Defendendo Aurora';
      case 'rift': return 'Na Fenda Infinita';
      case 'colosso': return 'Contra o Colosso';
      case 'inc': return 'Em Incursão';
      case 'goto': return 'Indo: ' + (G.BLD[h.dest] ? G.BLD[h.dest].short : 'praça');
      case 'inside': return ({ eat: 'Comendo na Taverna', rest: 'Descansando', heal: 'Em tratamento', shop: 'Comprando', train: 'Treinando', deliver: 'Entregando espólio', potion: 'Comprando poções' })[h.act] || 'Na cidade';
      case 'idle': return 'Descansando na praça';
      default: return 'Na cidade';
    }
  };
  G.bark = (e, key, p) => { if (G.HEADLESS || G.OFFLINE) return; if (Math.random() > (p == null ? 0.25 : p)) return; e.say = G.pick(G.BARKS[key]); e.sayT = 3.2; };

  /* ---------- experiência ---------- */
  G.giveXp = (h, n) => {
    const S = G.S;
    n *= (1 + G.traitSum(h, 'xp') + G.heroStats(h).xpF) * G.bless('sabedoria') * G.work('academia') * (1 + 0.15 * h.stars);
    if (S.ev.buff.torneio > S.t) n *= 1.5;
    G.xpApply(h, n);
  };
  /* v27 (A1): a parte de G.giveXp depois dos multiplicadores (soma, sobe de nível, respeita o teto do Rank). O avanço do tempo ausente a usa para
     creditar a experiência estimada do trecho que não coube no orçamento: o ritmo medido já traz os multiplicadores dentro. */
  G.xpApply = (h, n) => {
    const S = G.S, cap = G.RANK_CAP[h.rank];
    h.xp += n; S.rep.today.xp = (S.rep.today.xp || 0) + n;
    while (h.lvl < cap && h.xp >= G.xpNeed(h.lvl)) {
      h.xp -= G.xpNeed(h.lvl); h.lvl++; h._dirty = true; G.artGain(h, 1);
      const st = G.heroStats(h); h.hp = Math.min(st.hp, h.hp + st.hp * 0.35);
      h.animo = Math.min(100, h.animo + 8);
      if (h.lvl > S.stats.maxLvl) S.stats.maxLvl = h.lvl;
      G.addFx({ t: 'lvl', x: h.x, y: h.y }); G.sfx('lvl', h.x, h.y); G.bark(h, 'lvl', 0.8);
      G.emit('herolvl', h); G.questEvent('lvl', 1);
      if (h.lvl === cap) { G.log(h.name + ' chegou ao nível ' + cap + ' e está pronto para a promoção de rank.', 'good'); G.toast(h.name + ' pode ser promovido!', 'good', 'star'); }
    }
    if (h.lvl >= cap) h.xp = Math.min(h.xp, G.xpNeed(h.lvl));
  };
  G.promoReq = (h) => {
    const r = h.rank; if (r >= 7) return null;
    const zm = G.ZMATS[Math.min(6, r + 1)];
    const cost = {}; cost[zm.e] = r >= 6 ? 3 : 1; if (r >= 6) cost.essencia = 10;
    return { gold: Math.round(150 * Math.pow(2.5, r)), cost, guilda: r + 1, lvl: G.RANK_CAP[r] };
  };
  G.canPromote = (h) => { const q = G.promoReq(h); return !!q && h.lvl >= q.lvl && G.bLvl('guilda') >= q.guilda && G.S.gold >= q.gold && G.hasRes(q.cost); };
  G.promote = (h) => {
    if (!G.canPromote(h)) return false;
    const q = G.promoReq(h);
    G.spend(q.gold, 'promocao'); G.payRes(q.cost);
    h.rank++; h.xp = 0; h._dirty = true; h.hp = G.heroStats(h).hp; h.animo = 100; G.artGain(h, 3);
    G.S.stats.promos++;
    G.log(h.name + ' foi promovido a Rank ' + G.RANKS[h.rank] + ' — agora é ' + G.heroTitle(h) + '.', 'epic');
    G.addFx({ t: 'promo', x: h.x, y: h.y }); G.sfx('promo');
    G.gainRealm(25 * (h.rank + 1), 'promo'); G.emit('promo', h); G.questEvent('promo', 1);
    return true;
  };
  G.canRebirth = (h) => h.rank >= 7 && h.lvl >= 80;
  G.rebirth = (h) => {
    if (!G.canRebirth(h)) return false;
    h.stars++; h.lvl = 1; h.rank = 0; h.xp = 0; h._dirty = true; h.hp = G.heroStats(h).hp; G.artGain(h, 15);
    G.S.stats.rebirths++;
    G.log(h.name + ' renasceu sob as Duas Luas. Estrela ' + h.stars + ': +30% em todos os atributos.', 'epic');
    G.sfx('promo'); G.gainRealm(400, 'renascer'); G.emit('promo', h);
    return true;
  };

  /* ---------- recrutamento ---------- */
  G.recruitCost = () => Math.round(110 * Math.pow(1.5, Math.max(0, G.S.heroes.length - 3)) * (1 + 0.04 * (G.S.realm.lvl - 1)));
  G.nucleoCost = () => 3 + Math.floor(G.S.heroes.length / 3);
  G.rollCandidates = (kind) => {
    const odds = kind === 'nucleo' ? [[2, 58], [3, 33], [4, 9]] : [[0, 60], [1, 29], [2, 9.4], [3, 1.5], [4, 0.1]];
    const lvl = Math.max(1, Math.floor(G.avgHeroLvl() * 0.6));
    const have = {}; for (const h of G.S.heroes) have[h.cls] = (have[h.cls] || 0) + 1;
    const out = [], usedN = new Set(G.S.heroes.map((h) => h.name));
    for (let i = 0; i < 3; i++) {
      const cls = G.wpick(G.CLASS_IDS.map((c) => [c, 1 / (1 + (have[c] || 0))]));
      const pool = G.HERO_NAMES.filter((n) => !usedN.has(n)); const name = pool.length ? G.pick(pool) : G.pick(G.HERO_NAMES); usedN.add(name);
      const rar = G.wpick(odds);
      out.push({ name, cls, rar, lvl, traits: G.rollTraits(rar >= 3 ? 3 : 2), look: { skin: G.ri(0, 4), hair: G.ri(0, 9), style: G.ri(0, 5), seed: G.ri(1, 99999) } });
    }
    return out;
  };
  G.hire = (c) => {
    const S = G.S;
    if (S.heroes.length >= G.heroCap()) return null;
    const h = G.makeHero(c); if (c.look) h.look = c.look;
    h.gold = Math.round(20 * G.PM(h.lvl));
    S.heroes.push(h); S.stats.recruits++;
    G.log(h.name + ', ' + G.CLASSES[h.cls].name + ' ' + G.RAR[h.rar].toLowerCase() + ', atravessou o Portal e jurou servir Aurora.', 'good');
    G.addFx({ t: 'summon', x: h.x, y: h.y }); G.sfx('summon');
    G.emit('heroes'); G.questEvent('recruit', 1);
    return h;
  };
  G.dismiss = (h) => {
    const S = G.S, i = S.heroes.indexOf(h); if (i < 0) return;
    for (const k in h.gear) if (h.gear[k]) { h.gear[k].forSale = true; S.inv.push(h.gear[k]); }
    if (h.mount) { const mt = G.mountOf(h); if (mt) mt.hero = 0; }
    S.heroes.splice(i, 1); G.log(h.name + ' deixou Aurora.', 'info'); G.emit('heroes');
  };

  /* ---------- preços dos serviços ---------- */
  G.price = (h, kind) => {
    const pm = G.PM(h.lvl) * (1 + G.traitSum(h, 'tip'));
    switch (kind) {
      case 'meal': return Math.round(5 * pm * (1 + 0.06 * G.bLvl('taverna')));
      case 'rest': return Math.round(6 * pm * (1 + 0.06 * G.bLvl('hospedaria')));
      case 'heal': return Math.round(9 * pm * (1 + 0.06 * G.bLvl('enfermaria')));
      case 'potion': return Math.round(7 * pm * (1 + 0.05 * G.bLvl('alquimista')));
      case 'train': return Math.round(26 * pm * (1 + 0.05 * G.bLvl('treino')));
      case 'revive': return Math.round(18 * G.PM(h.lvl));
    }
    return 0;
  };
  const pay = (h, kind, mult) => { let p = Math.round(G.price(h, kind) * (mult || 1)); p = Math.min(p, Math.floor(h.gold)); if (p > 0) { h.gold -= p; G.earn(p, 'servicos'); if (!G.HEADLESS && p >= 1) G.addFx({ t: 'coin', x: h.x, y: h.y - 0.6, n: p }); } return p; };

  /* ---------- escolha de zona ---------- */
  G.zoneUnlocked = (z) => G.S.realm.lvl >= z.unlock;
  G.pickZone = (h) => {
    const S = G.S, st = G.heroStats(h);
    if (h.order !== 'auto' && G.ZONE[h.order] && G.zoneUnlocked(G.ZONE[h.order])) return h.order;
    const brave = G.traitSum(h, 'brave') + (h.caution === 0 ? 1 : h.caution === 2 ? -2 : 0);
    let low = null, lowL = 1e9; const opts = [];
    for (const z of G.ZONES) {
      if (!G.zoneUnlocked(z)) continue;
      const l = G.zoneLvl(z, S.zones[z.id].tier) + G.diffCur().shift;
      if (l < lowL) { lowL = l; low = z.id; }
      // prefere o desafio à altura; zonas com chefe ainda invicto chamam mais atenção
      if (l <= st.eff + brave) opts.push([z.id, Math.exp(-(st.eff + brave - l) / 5) * (S.zones[z.id].bossKills ? 1 : 2.5) + 0.02]);
    }
    return opts.length ? G.wpick(opts) : low;
  };

  /* ---------- lojas: o que o herói quer comprar ---------- */
  G.wantItem = (h) => {
    const S = G.S, c = G.CLASSES[h.cls];
    let best = null, bestGain = 0;
    for (const it of S.inv) {
      if (!it.forSale || it.lock) continue;
      const g = G.GEAR[it.type];
      if (g.kind === 'arma' && it.type !== c.w) continue;
      if (g.kind === 'armadura' && it.type !== c.a) continue;
      if (G.TIER_LVL(it.tier) > h.lvl + 6) continue;
      const price = G.itemPrice(it); if (price > h.gold) continue;
      const cur = h.gear[g.kind]; const gain = G.itemScore(it) - (cur ? G.itemScore(cur) * 1.06 : 0) + (G.resGain ? G.resGain(h, it, cur) : 0);   // v26 (3H): ressonância pesa pouco
      if (gain > bestGain) { bestGain = gain; best = it; }
    }
    return best;
  };
  const buyItem = (h, it) => {
    const S = G.S, i = S.inv.indexOf(it); if (i < 0) return false;
    const price = G.itemPrice(it); if (h.gold < price) return false;
    h.gold -= price; G.earn(price, 'forja'); S.inv.splice(i, 1);
    const k = G.GEAR[it.type].kind; const old = h.gear[k];
    if (old) h.gold += Math.round(G.itemPrice(old) * 0.15);
    h.gear[k] = it; it.forSale = false; h._dirty = true; S.stats.sold++;
    h.animo = Math.min(100, h.animo + 12);
    G.log(h.name + ' comprou ' + G.itemName(it) + ' por ' + G.fmt(price) + ' moedas.', 'gold');
    G.addFx({ t: 'coin', x: h.x, y: h.y - 0.6, n: price }); G.sfx('buy', h.x, h.y);
    G.emit('inv'); G.questEvent('sold', 1);
    return true;
  };
  G.equip = (h, it) => { // presente do jogador
    const S = G.S, i = S.inv.indexOf(it); if (i < 0) return false;
    const c = G.CLASSES[h.cls], g = G.GEAR[it.type];
    if ((g.kind === 'arma' && it.type !== c.w) || (g.kind === 'armadura' && it.type !== c.a)) return false;
    S.inv.splice(i, 1); const old = h.gear[g.kind]; if (old) { old.forSale = true; S.inv.push(old); }
    h.gear[g.kind] = it; it.forSale = false; h._dirty = true; h.animo = Math.min(100, h.animo + 15);
    G.emit('inv'); return true;
  };

  /* ---------- decisão na cidade ---------- */
  const gotoB = (h, bid, act) => { h.state = 'goto'; h.dest = bid; h.act = act; const d = Wd.door(bid); G.go(h, d[0] + G.rnd(-0.3, 0.3), d[1] + G.rnd(0, 0.25)); };
  const enter = (h, act, dur) => { h.state = 'inside'; h.act = act; h.until = G.S.t + dur; h.inside = h.dest; h.moving = false; };
  const leaveTown = (h) => {
    if (G.colossoPick && G.colossoPick(h)) return;   // v25: Colosso da Semana
    const z = G.pickZone(h); if (!z) { h.state = 'idle'; h.until = G.S.t + 6; return; }
    const zd = G.ZONE[z], l = G.zoneLvl(zd, G.S.zones[z].tier) + G.diffCur().shift, st = G.heroStats(h);
    if (l > st.eff + 8 && h.order === 'auto') { // nenhuma zona segura
      h.state = 'idle'; h.until = G.S.t + 10; h.noZone = true; const p = G.pick(Wd.idle); G.go(h, p[0], p[1]); return;
    }
    h.noZone = false; h.zone = z; h.state = 'travel'; h.tgt = null;
    const p = Wd.randIn([Math.max(zd.rect[0], zd.rect[0] + 2), zd.rect[1] + 2, zd.rect[2] - 2, zd.rect[3] - 2]);
    // entra pela borda mais próxima do portão
    const gate = G.GATES[zd.gate];
    const ex = G.clamp(gate.out[0], zd.rect[0] + 2, zd.rect[2] - 2), ey = G.clamp(gate.out[1], zd.rect[1] + 2, zd.rect[3] - 2);
    const q = Wd.nearestWalk(G.lerp(ex, p[0], 0.35), G.lerp(ey, p[1], 0.35));
    G.go(h, q[0], q[1]);
  };
  G.heroDecide = (h) => {
    const S = G.S, st = G.heroStats(h);
    if (S.mare.active && h.hp > st.hp * 0.35) { h.state = 'defend'; h.tgt = null; return; }
    if ((h.bagN > 0 || G.petLoad(h) > 0) && G.bOk('guilda')) return gotoB(h, 'guilda', 'deliver');
    if (h.hp < st.hp * 0.6) { if (G.bOk('enfermaria')) return gotoB(h, 'enfermaria', 'heal'); if (G.bOk('hospedaria')) return gotoB(h, 'hospedaria', 'rest'); }
    if (h.fome < 38 && G.bOk('taverna') && S.res.refeicao >= 1) return gotoB(h, 'taverna', 'eat');
    if (h.fome < 20) { G.bark(h, 'hungry', 0.5); h.animo = Math.max(0, h.animo - 4); }
    if (h.energia < 32 && G.bOk('hospedaria')) return gotoB(h, 'hospedaria', 'rest');
    if (S.ev.curfew > S.t) { h.state = 'idle'; h.until = S.t + 8; const p = G.pick(Wd.idle); G.go(h, p[0], p[1]); return; }
    if (h.potions < G.potCap(h) && G.bOk('alquimista') && S.res.pocao >= 1 && h.gold >= G.price(h, 'potion')) return gotoB(h, 'alquimista', 'potion');
    if (h.potions <= 0 && G.bOk('alquimista') && S.res.pocao < 1) G.bark(h, 'nopotion', 0.4);
    const want = G.wantItem(h);
    if (want) { h.want = want.id; return gotoB(h, G.GEAR[want.type].kind === 'acessorio' && G.bOk('mercado') ? 'mercado' : G.bOk('ferraria') ? 'ferraria' : 'guilda', 'shop'); }
    if (G.bOk('treino') && h.lvl < G.RANK_CAP[h.rank] && h.gold >= G.price(h, 'train') * 1.6 && (S._training || 0) < G.bLvl('treino')) return gotoB(h, 'treino', 'train');
    if (h.animo < 35 && G.bOk('taverna')) return gotoB(h, 'taverna', 'eat');
    // bolsa cheia e nada para comprar: uma noite de luxo na taverna
    if (G.bOk('taverna') && h.gold > G.price(h, 'meal') * 40 && h.animo < 90 && S.res.refeicao >= 1 && Math.random() < 0.5) { h.lux = 1; return gotoB(h, 'taverna', 'eat'); }
    if (h.hp < st.hp * 0.85 && G.bOk('enfermaria') && h.gold >= G.price(h, 'heal')) return gotoB(h, 'enfermaria', 'heal');
    leaveTown(h);
  };

  /* ---------- combate ---------- */
  const findTarget = (h, list, radius) => {
    let best = null, bd = radius;
    const st = G.heroStats(h);
    for (const m of list) {
      if (m.dead || m.inc || m.colosso) continue;
      const d = Math.hypot(m.x - h.x, m.y - h.y); if (d > bd) continue;
      if (m.boss && h.state === 'hunt' && !G.hasTrait(h, 'teimoso')) {
        // chefe é luta de grupo: só entra quem aguenta, ou quem tem companhia
        if (h.caution === 2) continue;
        let allies = 0; for (const a of G.S.heroes) if (a !== h && a.tgt === m) allies++;
        const need = m.lvl + (h.caution === 0 ? -1 : 1) - Math.min(3, allies) + (m.rift ? 0 : G.diffCur().shift);
        if (st.eff < need || h.hp < st.hp * 0.7) continue;
      }
      if (G.engageRisk && G.engageRisk(h, m, st)) continue;
      let score = d - (m.tgt === h ? 3 : 0) - (m.mark ? 6 : 0);
      if (score < bd) { bd = score; best = m; }
    }
    return best;
  };
  G.dmgToMon = (h, m, mult, forceCrit, o) => {
    const S = G.S, st = G.heroStats(h), md = G.heroMod(h);
    const atk = st.atk * md.a;
    if (m.dead) return 0;
    if (m.eva && !(m.stun > S.t) && Math.random() < m.eva) { G.addFx({ t: 'miss', x: m.x, y: m.y - 0.8 }); return 0; }
    let dmg = (atk * atk) / (atk + m.def * (1 - ((o && o.pierce) || 0)) * (m.weak > S.t ? 1 - (m.weakF || 0) : 1)) * G.rnd(0.88, 1.12) * (mult || 1);
    const crit = forceCrit || Math.random() < st.crit; if (crit) dmg *= st.critDmg;
    dmg *= 1 + G.bestBonus(G.MON[m.k].fam);
    if (m.elite || m.boss) dmg *= 1 + G.traitSum(h, 'elite') + st.eliteF;
    if (m.vuln > S.t) dmg *= 1 + (m.vulnF || 0);
    dmg = Math.max(1, Math.round(dmg));
    m.hp -= dmg; m.hitBy[h.id] = 1; m.flash = 0.12;
    if (crit && st.bleed) G.bleedHit(h, m, dmg);     // v26 (3H): Sangria da ressonância da Fúria
    if (!m.tgt || m.tgt.state === 'fallen') { m.tgt = h; if (m.state === 'wander' || m.state === 'return') m.state = 'chase'; }
    G.addFx({ t: 'dmg', x: m.x, y: m.y - 0.7 * (m.size || 1), n: dmg, crit, c: crit ? '#ffd35a' : '#ffffff' });
    G.sfx(crit ? 'crit' : 'hit', m.x, m.y);
    if (m.hp <= 0) G.killMon(m, h);
    return dmg;
  };
  const attack = (h, m) => {
    const c = G.CLASSES[h.cls], st = G.heroStats(h);
    h.tAtk = st.int / (G.S.ev.buff.furia > G.S.t ? 1.3 : 1) / (1 + (h.buff.aspd > G.S.t ? (h.bv && h.bv.aspd) || 0 : 0));
    h.swing = 0.28; h.dir = m.x >= h.x ? 1 : -1;
    if (c.rng > 2) G.addFx({ t: 'proj', x: h.x, y: h.y - 0.55, tx: m.x, ty: m.y - 0.5, k: h.cls === 'mag' ? 'orb' : 'arrow', c: h.cls === 'mag' ? '#b58cf2' : '#f0e0b0' });
    else G.addFx({ t: 'slash', x: (h.x + m.x) / 2, y: (h.y + m.y) / 2 - 0.5, dir: h.dir, c: c.color });
    G.dmgToMon(h, m, 1);
  };
  const skill = (h, m, mons) => {
    const st = G.heroStats(h), S = G.S;
    h.tSkill = G.CLASSES[h.cls].skill.cd * (h.rank >= 4 ? 0.8 : 1) * (1 - st.cdr);
    h.swing = 0.4; h.cast = 0.5;
    const pow = (1 + (h.rank >= 2 ? 0.15 : 0) + (h.rank >= 4 ? 0.2 : 0)) * G.skillPow(h, 0);
    switch (h.cls) {
      case 'esp': G.addFx({ t: 'spin', x: h.x, y: h.y - 0.4, c: '#ffd0c0' }); for (const o of mons) if (!o.dead && G.dist(o, h) < 2.1) G.dmgToMon(h, o, 1.5 * pow); break;
      case 'cav': h.buff.wall = S.t + 5; G.addFx({ t: 'shield', x: h.x, y: h.y - 0.5 }); for (const o of mons) if (!o.dead && G.dist(o, h) < 4.5 && !o.boss) { o.tgt = h; if (o.state !== 'march' || true) o.state = o.state === 'march' ? 'march' : 'chase'; } G.dmgToMon(h, m, 1.1 * pow); break;
      case 'arq': for (let i = 0; i < 3; i++) { if (m.dead) break; G.addFx({ t: 'proj', x: h.x, y: h.y - 0.55, tx: m.x + G.rnd(-0.2, 0.2), ty: m.y - 0.5, k: 'arrow', c: '#fff0a0', d: i * 0.08 }); G.dmgToMon(h, m, 0.9 * pow); } break;
      case 'mag': G.addFx({ t: 'boom', x: m.x, y: m.y - 0.3, c: '#ff9a3a', r: 2.2 }); G.sfx('boom', m.x, m.y); { const cx = m.x, cy = m.y; for (const o of mons) if (!o.dead && Math.hypot(o.x - cx, o.y - cy) < 2.2) G.dmgToMon(h, o, 2.1 * pow); } break;
      case 'pal': G.addFx({ t: 'healring', x: h.x, y: h.y - 0.3 }); G.sfx('heal', h.x, h.y); for (const a of S.heroes) if (a.state !== 'fallen' && a.state !== 'recover' && !a.inside && G.dist(a, h) < 4) { const as = G.heroStats(a); const v = as.hp * 0.24 * pow * (1 + st.healF); a.hp = Math.min(as.hp, a.hp + v); G.addFx({ t: 'dmg', x: a.x, y: a.y - 0.9, n: Math.round(v), c: '#7df09a', heal: 1 }); } break;
      case 'lad': { G.addFx({ t: 'slash', x: m.x, y: m.y - 0.5, dir: h.dir, c: '#c8a0ff', big: 1 }); const g = Math.round(2 * G.PM(m.lvl)); h.gold += g; G.dmgToMon(h, m, 2.6 * pow, true); } break;
    }
  };
  /* dano em herói; devolve true se caiu */
  G.dmgToHero = (m, h, mult) => {
    const S = G.S, st = G.heroStats(h), md = G.heroMod(h);
    if (h.state === 'fallen' || h.state === 'recover' || h.inside) return false;
    if (Math.random() < st.eva + (h.buff.eva > S.t ? (h.bv && h.bv.eva) || 0 : 0)) { G.addFx({ t: 'miss', x: h.x, y: h.y - 0.9 }); return false; }
    const d = G.MON[m.k], def = st.def * md.d * (1 - (d.pierce || 0));
    const ma = m.weak > S.t ? m.atk * (1 - (m.weakF || 0)) : m.atk; // v22: Fraqueza do mascote
    let dmg = (ma * ma) / (ma + def) * G.rnd(0.88, 1.12) * (mult || 1);
    if (h.buff.wall > S.t) dmg *= 0.45;
    if (h.buff.def > S.t) dmg *= 1 - Math.min(0.6, (h.bv && h.bv.def) || 0);
    dmg = Math.max(1, Math.round(dmg));
    /* espinhos devolvem parte do golpe; o escudo sagrado absorve antes da vida */
    const th = st.thorns + (h.buff.thorns > S.t ? (h.bv && h.bv.thorns) || 0 : 0);
    if (th > 0 && !m.dead) { const back = Math.max(1, Math.round(dmg * th)); m.hp -= back; m.hitBy[h.id] = 1; m.flash = 0.12; G.addFx({ t: 'dmg', x: m.x, y: m.y - 0.7 * (m.size || 1), n: back, c: '#c8e0ff' }); if (m.hp <= 0) G.killMon(m, h); }
    if (h.shield > 0 && h.buff.shield > S.t) { const ab = Math.min(h.shield, dmg); h.shield -= ab; dmg -= ab; if (dmg <= 0) { h.lastHit = S.t; G.addFx({ t: 'text', x: h.x, y: h.y - 1.1, s: 'escudo', c: '#8ab8ff' }); return false; } } else h.shield = 0;
    h.hp -= dmg; h.lastHit = S.t; h.flash = 0.12;
    if (d.poison || d.burn) { h.dot = { dps: m.atk * 0.12, until: S.t + 4, c: d.burn ? '#ff8a3a' : '#9be08a' }; }
    G.addFx({ t: 'dmg', x: h.x, y: h.y - 0.95, n: dmg, c: '#ff6b6b' }); G.sfx('hurt', h.x, h.y);
    if (h.hp <= 0) return G.heroFall(h, m);
    return false;
  };
  G.heroFall = (h, m) => {
    const S = G.S, st = G.heroStats(h);
    if (G.bOk('santuario') && h.grace !== S.day && Math.random() < G.bfx.grace()) {
      h.grace = S.day; h.hp = st.hp * 0.3; h.state = h.state === 'rift' || h.state === 'defend' || h.state === 'inc' ? h.state : 'flee'; G.go(h, Wd.plaza.cx, Wd.plaza.cy);
      G.addFx({ t: 'healring', x: h.x, y: h.y - 0.3 }); G.log('A Graça das Duas Luas segurou ' + h.name + ' à beira da morte.', 'good'); return false;
    }
    if ((h.wake || 0) >= 4 && h.wakeDay !== S.day) { // Transcendência: uma vez por dia
      h.wakeDay = S.day; h.hp = st.hp * 0.5; h.dot = null;
      G.addFx({ t: 'promo', x: h.x, y: h.y }); G.log(h.name + ' transcendeu a queda e voltou à luta.', 'epic'); return false;
    }
    h.hp = 0; h.state = 'fallen'; h.until = S.t + 9; h.tgt = null; h.path = null; h.moving = false; h.falls++;
    const lostGold = Math.round(h.gold * 0.25); h.gold -= lostGold;
    const lostBag = h.bagN; h.bag = {}; h.bagN = 0;
    h.xp = Math.max(0, h.xp - G.xpNeed(h.lvl) * 0.12);
    h.animo = Math.max(0, h.animo - 35);
    S.stats.falls++; S.rep.today.falls = (S.rep.today.falls || 0) + 1;
    for (const a of S.heroes) if (a !== h && a.state !== 'fallen' && G.dist(a, h) < 7) a.animo = Math.max(0, a.animo - 8);
    G.log(h.name + ' caiu diante de ' + (m ? G.MON[m.k].name : 'um inimigo') + (lostBag ? ' e perdeu ' + lostBag + ' itens de espólio' : '') + '.', 'bad');
    G.toast(h.name + ' caiu em combate!', 'bad', 'skull');
    G.addFx({ t: 'fall', x: h.x, y: h.y }); G.sfx('fall', h.x, h.y);
    G.emit('herofall', h); G.questEvent('fall', 1);
    return true;
  };
  G.reviveTime = (h) => (70 + 2.5 * h.lvl) / G.bfx.revive() * (G.bOk('enfermaria') ? 1 : 2.4) / (1 + G.decorV('altar'));
  G.reviveNow = (h) => {
    if (h.state !== 'recover' && h.state !== 'fallen') return false;
    const c = G.price(h, 'revive') * 2; if (!G.spend(c, 'cura')) return false;
    wake(h); return true;
  };
  const wake = (h) => {
    const S = G.S, st = G.heroStats(h);
    h.state = 'town'; h.inside = null; h.hp = st.hp * 0.6; h.wound = S.t + 150; h.fome = Math.max(h.fome, 40); h.energia = Math.max(h.energia, 50);
    const d = G.bOk('enfermaria') ? Wd.door('enfermaria') : Wd.plaza ? [Wd.plaza.cx, Wd.plaza.cy + 2] : [44, 56];
    h.x = d[0]; h.y = d[1]; h.path = null;
    G.log(h.name + ' está de pé outra vez, ainda ferido.', 'info'); G.emit('heroes');
  };

  /* ---------- atualização por herói ---------- */
  const SAFE_REGEN = 0.012;
  G.updateHero = (h, dt, mons) => {
    const S = G.S, st = G.heroStats(h);
    if (h.tAtk > 0) h.tAtk -= dt; if (h.tSkill > 0) h.tSkill -= dt; if (h.tPot > 0) h.tPot -= dt; if (h.tS2 > 0) h.tS2 -= dt; if (h.tS3 > 0) h.tS3 -= dt;
    if (h.swing > 0) h.swing -= dt; if (h.flash > 0) h.flash -= dt; if (h.cast > 0) h.cast -= dt; if (h.sayT > 0) h.sayT -= dt;
    if (h.hp > st.hp) h.hp = st.hp;
    const out = h.state === 'hunt' || h.state === 'travel' || h.state === 'flee' || h.state === 'return' || h.state === 'defend' || h.state === 'rift' || h.state === 'inc' || h.state === 'colosso';
    if (h.state !== 'fallen' && h.state !== 'recover') {
      h.fome = Math.max(0, h.fome - dt * (out ? 0.17 : 0.1) * Math.max(0.3, 1 + G.traitSum(h, 'hunger') + st.hungerF));
      h.energia = Math.max(0, h.energia - dt * (out ? 0.27 : 0.05) * Math.max(0.3, 1 + G.traitSum(h, 'tire') + st.tireF));
      h.animo += (Math.min(95, 60 + 60 * st.moodB) - h.animo) * dt * 0.004;
      if (h.buff.regen > S.t && h.hp < st.hp) h.hp = Math.min(st.hp, h.hp + st.hp * ((h.bv && h.bv.regen) || 0) * dt);
      if (h.dot && h.dot.until > S.t) { h.hp -= h.dot.dps * dt; if (h.hp <= 0) { if (G.heroFall(h, null)) return; } }
      if (S.t - h.lastHit > 5 && h.hp < st.hp) h.hp = Math.min(st.hp, h.hp + st.hp * SAFE_REGEN * dt * (out ? 1 : 2.2));
    }
    switch (h.state) {
      case 'town': h.moving = false; h.tThink -= dt; if (h.tThink <= 0) { h.tThink = 0.4 + Math.random() * 0.4; G.heroDecide(h); } break;
      case 'idle': if (G.step(h, dt, st.spd * 0.6) && S.t >= h.until) h.state = 'town'; if (S.mare.active) h.state = 'town'; break;
      case 'goto': if (G.step(h, dt, st.spd * 1.3)) arrive(h); if (S.mare.active && h.hp > st.hp * 0.5 && h.act !== 'heal') h.state = 'town'; break;
      case 'inside': inside(h, dt, st); break;
      case 'travel':
        if (G.step(h, dt, st.spd)) { h.state = 'hunt'; h.tThink = 0; G.bark(h, 'hunt', 0.3); }
        else if (Wd.zoneAt(h.x, h.y) >= 0 && Wd.zoneAt(h.x, h.y) < 7) { const t = findTarget(h, mons, 4.5); if (t) { h.state = 'hunt'; h.tgt = t; } }
        break;
      case 'hunt': hunt(h, dt, st, mons); break;
      case 'flee': case 'return':
        if (h.state === 'flee' && h.hp < st.hp * 0.35 && h.potions > 0 && h.tPot <= 0) drink(h, st);
        if (G.step(h, dt, st.spd * (h.state === 'flee' ? (G.S.t < h.sprint ? 1.5 : 1.2) : 1.1)) || Wd.inTown(h.x, h.y)) { h.state = 'town'; h.tThink = 0; h.tgt = null; }
        break;
      case 'fallen': h.moving = false; if (S.t >= h.until) { h.state = 'recover'; h.reviveAt = S.t + G.reviveTime(h); h.inside = G.bOk('enfermaria') ? 'enfermaria' : null; const d = G.bOk('enfermaria') ? Wd.door('enfermaria') : [Wd.plaza.cx + G.rnd(-2, 2), Wd.plaza.cy + 3]; h.x = d[0]; h.y = d[1]; G.emit('heroes'); } break;
      case 'recover': h.moving = false; if (S.t >= h.reviveAt) wake(h); break;
      case 'defend': defend(h, dt, st, mons); break;
      case 'rift': G.riftHero(h, dt, st, mons); break;
      case 'colosso': G.colossoHero(h, dt, st, mons); break;
      case 'inc': G.incHero(h, dt, st, mons); break;
    }
  };
  const drink = (h, st) => {
    h.potions--; h.tPot = G.DANGER ? G.DANGER.potCd : 9; const v = st.hp * G.bfx.potHeal();
    h.hp = Math.min(st.hp, h.hp + v); G.S.stats.potions++;
    G.addFx({ t: 'dmg', x: h.x, y: h.y - 0.9, n: Math.round(v), c: '#7df09a', heal: 1 }); G.addFx({ t: 'potion', x: h.x, y: h.y - 0.6 }); G.sfx('potion', h.x, h.y);
  };
  G.heroDrink = drink;
  const goHome = (h, flee) => {
    const z = G.ZONE[h.zone], gate = G.GATES[z ? z.gate : 's'];
    h.state = flee ? 'flee' : 'return'; h.tgt = null;
    // entra pelo portão e segue até a praça
    G.go(h, Wd.plaza.cx + G.rnd(-3, 3), Wd.plaza.cy + G.rnd(-3, 3));
    if (flee) {
      G.bark(h, 'flee', 0.7); h.animo = Math.max(0, h.animo - 6); h.sprint = G.S.t + 4;
      // parte dos perseguidores perde o rastro; os outros vêm atrás
      for (const o of G.mons) if (o.tgt === h && !o.raid && !o.rift && Math.random() < (o.boss ? 0.75 : 0.45)) { o.tgt = null; o.state = 'return'; o.path = null; }
    }
    void gate;
  };
  G.heroGoHome = goHome;
  const hunt = (h, dt, st, mons) => {
    const S = G.S;
    const thr = G.retreatThr ? G.retreatThr(h, st, h.tgt) : G.clamp(G.CAUTION[h.caution].thr + G.traitSum(h, 'retreat'), 0.08, 0.7);
    const frac = h.hp / st.hp;
    let m = h.tgt;
    if (m && (m.dead || m.gone)) m = h.tgt = null;
    const bossFight = m && m.boss && G.hasTrait(h, 'teimoso') && !(G.DANGER && G.DANGER.on);
    if (frac < thr && !bossFight) {
      if (h.potions > 0 && h.tPot <= 0) drink(h, st);
      else if (h.tPot <= 0 || frac < thr * (G.DANGER ? G.DANGER.flee : 0.6)) { if (h.potions <= 0) G.bark(h, 'hurt', 0.5); return goHome(h, true); }
    } else if (frac < 0.45 && h.potions > 0 && h.tPot <= 0 && S.t - h.lastHit < 3) drink(h, st);
    h.tThink -= dt;
    if (h.tThink <= 0) {
      h.tThink = 0.5;
      if (h.bagN >= G.bagCap(h) || h.energia < 12 || h.fome < 8) return goHome(h, false);
      if (S.mare.active && !m) return goHome(h, false);
      if (S.ev.curfew > S.t) return goHome(h, false);
      let n = 0; for (const o of mons) if (!o.dead && o.tgt === h) n++;
      if (n >= 4 && frac < 0.6 && !G.hasTrait(h, 'corajoso') && !bossFight) return goHome(h, true);
      if (!m) { m = h.tgt = findTarget(h, mons, 8.5); if (m && m.boss) G.bark(h, 'boss', 0.6); }
    }
    if (m) {
      const reach = st.rng + (m.size || 1) * 0.35;
      // posição de combate: corpo a corpo espalha em volta do alvo
      let tx = m.x, ty = m.y;
      if (st.rng < 2) { const a = ((h.id * 2.399) % 6.283); tx += Math.cos(a) * 0.35; ty += Math.sin(a) * 0.25; }
      if (G.chase(h, tx, ty, dt, st.spd, reach)) {
        G.heroAct(h, m, mons, frac);
      }
    } else {
      if (!h.path || !h.path.length) {
        const z = G.ZONE[h.zone]; if (!z) return goHome(h, false);
        // caminha em direção a monstros distantes, senão vagueia pela zona
        const far = findTarget(h, mons, 30);
        if (far) G.go(h, far.x, far.y); else { const p = Wd.randIn(z.rect); G.go(h, p[0], p[1]); }
      }
      G.step(h, dt, st.spd * 0.85);
    }
  };
  const defend = (h, dt, st, mons) => {
    const S = G.S;
    if (!S.mare.active) { h.state = 'town'; return; }
    const frac = h.hp / st.hp;
    if (frac < 0.4 && h.potions > 0 && h.tPot <= 0) drink(h, st);
    if (frac < 0.14 && !G.hasTrait(h, 'corajoso')) { h.state = 'goto'; h.dest = G.bOk('enfermaria') ? 'enfermaria' : 'hospedaria'; h.act = 'heal'; const d = Wd.door(h.dest); G.go(h, d[0], d[1]); return; }
    let m = h.tgt; if (m && (m.dead || m.gone || !m.raid)) m = h.tgt = null;
    h.tThink -= dt;
    if (!m && h.tThink <= 0) { h.tThink = 0.4; let bd = 1e9; for (const o of mons) { if (o.dead || !o.raid) continue; const d = G.dist(o, h); if (d < bd) { bd = d; m = o; } } h.tgt = m; if (m) G.bark(h, 'mare', 0.2); }
    if (m) {
      if (G.chase(h, m.x, m.y, dt, st.spd, st.rng + 0.3)) G.heroAct(h, m, mons, frac);
    } else {
      const g = G.GATES[S.mare.active.gate]; const px = G.lerp(g.x, Wd.plaza.cx, 0.25), py = G.lerp(g.y, Wd.plaza.cy, 0.25);
      if (Math.hypot(px - h.x, py - h.y) > 2.5) { if (!h.path || !h.path.length) G.go(h, px + G.rnd(-1.5, 1.5), py + G.rnd(-1.5, 1.5)); G.step(h, dt, st.spd); } else h.moving = false;
    }
  };
  G.heroAttack = attack; G.heroSkill = skill;
  /* uma ação por vez: habilidade da classe, habilidades de vocação, golpe comum */
  G.heroAct = (h, m, mons, frac) => {
    if (h.tSkill <= 0 && (h.cls !== 'pal' || frac < 0.7)) { skill(h, m, mons); return true; }
    if ((h.j2 || h.j3) && G.jobSkillTry(h, m, mons, frac)) return true;
    if (h.tAtk <= 0) { attack(h, m); return true; }
    return false;
  };

  const arrive = (h) => {
    const S = G.S, st = G.heroStats(h);
    if (!G.bOk(h.dest)) { h.state = 'town'; return; }
    switch (h.act) {
      case 'deliver': enter(h, 'deliver', 1.6); break;
      case 'eat': if (S.res.refeicao >= 1) { G.addRes('refeicao', -1); S.stats.meals++; pay(h, 'meal'); if (h.lux) { h.lux = 0; const p = Math.round(h.gold * 0.12); h.gold -= p; G.earn(p, 'servicos'); h.animo = 100; } enter(h, 'eat', 5 / G.bfx.eatSpeed()); } else { h.state = 'town'; G.bark(h, 'hungry', 0.6); } break;
      case 'rest': pay(h, 'rest'); enter(h, 'rest', 60); break;
      case 'heal': pay(h, 'heal', 0.4 + 1.2 * (1 - h.hp / st.hp)); enter(h, 'heal', 60); break;
      case 'potion': { let n = 0; while (h.potions < G.potCap(h) && S.res.pocao >= 1 && h.gold >= G.price(h, 'potion')) { h.gold -= G.price(h, 'potion'); G.earn(G.price(h, 'potion'), 'pocoes'); G.addRes('pocao', -1); h.potions++; n++; } if (n) G.sfx('buy', h.x, h.y); enter(h, 'potion', 1.5); } break;
      case 'shop': { const it = S.inv.find((i) => i.id === h.want); if (it) buyItem(h, it); enter(h, 'shop', 2.2); } break;
      case 'train': if (h.gold >= G.price(h, 'train') && (S._training || 0) < G.bLvl('treino')) { const p = G.price(h, 'train'); h.gold -= p; G.earn(p, 'treino'); S._training = (S._training || 0) + 1; enter(h, 'train', 16); } else h.state = 'town'; break;
      default: h.state = 'town';
    }
  };
  const inside = (h, dt, st) => {
    const S = G.S;
    if (h.act === 'rest') {
      h.energia = Math.min(100, h.energia + dt * 3.2 * G.bfx.rest());
      h.hp = Math.min(st.hp, h.hp + st.hp * 0.02 * dt);
      if (G.hasTrait(h, 'preguicoso')) h.animo = Math.min(100, h.animo + dt * 0.8);
      if (h.energia >= 100) h.until = 0;
    } else if (h.act === 'heal') {
      h.hp = Math.min(st.hp, h.hp + st.hp * dt * 0.07 * G.bfx.heal());
      if (h.hp >= st.hp) h.until = 0;
    } else if (h.act === 'eat') {
      h.fome = Math.min(100, h.fome + dt * 22); h.animo = Math.min(100, h.animo + dt * 4 * G.bfx.mood());
    }
    if (S.mare.active && h.act !== 'heal' && h.hp > st.hp * 0.5) h.until = 0;
    if (S.t >= h.until) {
      if (h.act === 'deliver') {
        let n = 0; for (const k in h.bag) { G.addRes(k, h.bag[k]); n += h.bag[k]; S.rep.today.mats = (S.rep.today.mats || 0) + h.bag[k]; G.questEvent('mat', h.bag[k], k); }
        h.bag = {}; h.bagN = 0; n += G.petUnload(h); if (n) { G.addFx({ t: 'text', x: h.x, y: h.y - 1.2, s: '+' + n + ' espólio', c: '#e2b659' }); G.sfx('deliver', h.x, h.y); }
      } else if (h.act === 'train') {
        S._training = Math.max(0, (S._training || 0) - 1);
        G.giveXp(h, G.xpNeed(h.lvl) * G.bfx.trainXp());
        h.energia = Math.max(0, h.energia - 12);
      }
      h.state = 'town'; h.inside = null; h.tThink = 0.2; G.bark(h, 'town', 0.12);
    }
  };

  G.updateHeroes = (dt, mons) => { const hs = G.S.heroes; for (let i = 0; i < hs.length; i++) G.updateHero(hs[i], dt, mons); };
})();

;
