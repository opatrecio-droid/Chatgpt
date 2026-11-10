/* 32-town: construções, produção, moradores, forja, mercado e a virada do dia. */
'use strict';
(function () {
  const Wd = G.W;

  /* ---------- construções ---------- */
  G.builtCount = () => { let n = 0; for (const id of G.BLD_IDS) if (G.bLvl(id) > 0) n++; return n; };
  G.bAvailable = (id) => G.bLvl(id) > 0 || G.bLvl('cidadela') >= (G.BLD[id].cid || 1);
  G.canUpgrade = (id) => {
    const S = G.S, l = G.bLvl(id) + 1;
    if (!G.bAvailable(id)) return { ok: false, why: 'Requer Cidadela nível ' + G.BLD[id].cid };
    if (S.b[id] && S.b[id].dmg) return { ok: false, why: 'Conserte antes de melhorar' };
    if (id === 'cidadela' && S.realm.lvl < G.cidReq(l)) return { ok: false, why: 'Requer Nível de Reino ' + G.cidReq(l) };
    if (id !== 'cidadela' && l > G.bMax(id)) return { ok: false, why: 'Limite: melhore a Cidadela' };
    const c = G.bCost(id, l);
    if (S.gold < c.gold) return { ok: false, why: 'Faltam moedas', c };
    if (!G.hasRes(c.cost)) return { ok: false, why: 'Faltam materiais', c };
    return { ok: true, c };
  };
  G.upgrade = (id) => {
    const S = G.S, r = G.canUpgrade(id); if (!r.ok) return false;
    G.spend(r.c.gold, 'obras'); G.payRes(r.c.cost);
    const b = S.b[id] || (S.b[id] = { lvl: 0 });
    b.lvl++;
    const d = G.BLD[id], p = Wd.plots[id];
    G.log(b.lvl === 1 ? d.name + ' foi erguida.' : d.name + ' chegou ao nível ' + b.lvl + '.', 'good');
    G.addFx({ t: 'build', x: p.cx, y: p.cy + 1 }); G.sfx('build');
    G.gainRealm(b.lvl === 1 ? 30 : 12 + 6 * b.lvl, 'obra');
    G.dirtyAll(); G.syncNpcs(); G.emit('bld', id); G.questEvent('build', 1, id);
    return true;
  };
  G.buyWork = (id) => { const S = G.S, l = G.workLvl(id), c = G.workCost(l); if (!G.spend(c, 'obras')) return false; S.works[id] = l + 1; G.dirtyAll(); G.log('Obra pública concluída: ' + G.WORKS.find((w) => w.id === id).name + ' nível ' + (l + 1) + '.', 'good'); G.sfx('build'); G.gainRealm(10 + 4 * l, 'obra'); G.emit('works'); return true; };
  G.repairCost = (id) => Math.round(G.bCost(id, Math.max(1, G.bLvl(id))).gold * 0.25);
  G.repair = (id) => { const S = G.S, b = S.b[id]; if (!b || !b.dmg) return false; if (!G.spend(G.repairCost(id), 'obras')) return false; b.dmg = 0; G.log(G.BLD[id].name + ' foi consertada.', 'good'); G.sfx('build'); G.emit('bld', id); return true; };

  /* ---------- armazém e mercado ---------- */
  G.resCap = (id) => {
    if (id === 'refeicao') return 10 + 6 * G.bLvl('taverna');
    if (id === 'pocao') return 6 + 4 * G.bLvl('alquimista');
    if (G.BASE_RES.indexOf(id) >= 0) return Math.round((120 + 80 * G.bLvl('cidadela') + 60 * G.bLvl('mercado')) * G.work('celeiros'));
    return 1e12;
  };
  G.sellPrice = (id) => { const S = G.S; return Math.max(1, Math.round(G.RES[id].base * (0.45 + 0.05 * G.bLvl('mercado')) * G.work('feira') * (S.ev.caravan === S.day ? 2 : 1) * 10) / 10); };
  G.buyPrice = (id) => Math.round(G.RES[id].base * 3.2 * (1 + 0.03 * (G.S.realm.lvl - 1)) * 10) / 10;
  G.BUYABLE = ['madeira', 'pedra', 'minerio', 'trigo', 'ervas'];
  G.sellRes = (id, n) => { const S = G.S; if (!G.bOk('mercado')) return false; n = Math.min(n, Math.floor(S.res[id] || 0)); if (n <= 0) return false; G.addRes(id, -n); G.earn(G.sellPrice(id) * n, 'exportacao'); G.sfx('coin'); return true; };
  G.buyRes = (id, n) => { if (!G.bOk('mercado') || G.BUYABLE.indexOf(id) < 0) return false; const c = Math.ceil(G.buyPrice(id) * n); if (!G.spend(c, 'mercado')) return false; G.addRes(id, n); G.sfx('buy'); return true; };

  /* ---------- produção (a cada hora de jogo) ---------- */
  G.prodRates = () => {
    const S = G.S, of = G.bless('oficio') * (1 + 0.02 * G.workLvl('celeiros')) * (S.ev.buff.festival > S.t ? 1.25 : 1) * (0.6 + 0.4 * (S.happy || 70) / 70);
    const L = (id) => (G.bOk(id) ? G.bLvl(id) : 0);
    return {
      trigo: L('fazenda') ? 2.2 * Math.pow(L('fazenda'), 1.2) * of * (S.ev.blight > S.day ? 0.5 : 1) : 0,
      ervas: L('fazenda') ? 0.9 * Math.pow(L('fazenda'), 1.15) * of : 0,
      madeira: L('lenharia') ? 1.7 * Math.pow(L('lenharia'), 1.2) * of : 0,
      pedra: L('pedreira') ? 1.3 * Math.pow(L('pedreira'), 1.2) * of : 0,
      minerio: L('pedreira') ? 1.0 * Math.pow(L('pedreira'), 1.2) * of : 0,
      refeicao: L('padaria') ? 1.3 * Math.pow(L('padaria'), 1.15) * of : (L('taverna') ? 0.5 : 0),
      pocao: L('alquimista') ? 0.55 * (1 + 0.6 * L('alquimista')) * of : 0,
    };
  };
  const hourTick = () => {
    const S = G.S, h = Math.floor(S.clock / 60), r = G.prodRates();
    const work = h >= 6 && h < 18;
    const add = (id, n) => {
      const cap = G.resCap(id), cur = S.res[id] || 0;
      if (cur + n > cap) { const over = cur + n - cap; n -= over; if (G.bOk('mercado') && S.opts.autoSell && G.BASE_RES.indexOf(id) >= 0 && id !== 'refeicao' && id !== 'pocao') G.earn(G.sellPrice(id) * over * 0.7, 'exportacao'); }
      if (n > 0) { G.addRes(id, n); S.rep.today.prod = (S.rep.today.prod || 0) + n; }
    };
    if (work) { add('trigo', r.trigo); add('ervas', r.ervas); add('madeira', r.madeira); add('pedra', r.pedra); add('minerio', r.minerio); }
    if (h >= 5 && h < 21) {
      const per = G.bOk('padaria') ? 2 : 3;
      let n = Math.min(r.refeicao, (S.res.trigo || 0) / per, G.resCap('refeicao') - (S.res.refeicao || 0));
      if (n > 0) { G.addRes('trigo', -n * per); G.addRes('refeicao', n); }
      n = Math.min(r.pocao, (S.res.ervas || 0) / 2, G.resCap('pocao') - (S.res.pocao || 0));
      if (n > 0) { G.addRes('ervas', -n * 2); G.addRes('pocao', n); }
    }
    if (S.opts.autoForge && G.bLvl('ferraria') >= 3 && work) autoForge();
    G.emit('hour', h);
  };

  /* ---------- forja ---------- */
  G.forgeMaxTier = () => { const l = G.bLvl('ferraria'); return l <= 0 ? 0 : 1 + Math.floor((l - 1) / 2); };
  G.rarWeights = (master) => {
    const S = G.S, L = G.bLvl('ferraria'), insp = S.ev.inspired > 0 ? 1 : 0;
    let w = [100, 28 + 6 * L, 5 + 3 * L, 0.6 + 0.9 * L, 0.04 + 0.22 * L, L >= 8 ? 0.03 * (L - 7) : 0];
    if (master) w = [0, 0, 60, 26 + 2 * L, 6 + L, L >= 6 ? 0.4 * (L - 5) : 0];
    if (insp) w = [0, w[0], w[1], w[2], w[3], w[4] + w[5]];
    return w;
  };
  G.craftCost = (type, tier, master) => { const r = G.recipe(type, tier); if (master) { const c = Object.assign({}, r.cost); c[G.ZMATS[Math.min(6, tier)].r] = (c[G.ZMATS[Math.min(6, tier)].r] || 0) + 1; return { gold: r.gold * 2, cost: c, nucleos: 1 }; } return r; };
  G.canCraft = (type, tier, master) => {
    const S = G.S;
    if (!G.bOk('ferraria')) return { ok: false, why: 'Ferraria fechada' };
    if (tier > G.forgeMaxTier()) return { ok: false, why: 'Requer Ferraria nível ' + ((tier - 1) * 2 + 1) };
    const c = G.craftCost(type, tier, master);
    if (S.gold < c.gold) return { ok: false, why: 'Faltam moedas', c };
    if (!G.hasRes(c.cost)) return { ok: false, why: 'Faltam materiais', c };
    if (c.nucleos && S.nucleos < c.nucleos) return { ok: false, why: 'Falta um Núcleo', c };
    return { ok: true, c };
  };
  G.craft = (type, tier, master, silent) => {
    const S = G.S, r = G.canCraft(type, tier, master); if (!r.ok) return null;
    G.spend(r.c.gold, 'forja'); G.payRes(r.c.cost); if (r.c.nucleos) S.nucleos -= r.c.nucleos;
    const w = G.rarWeights(master);
    const rar = G.wpick(w.map((v, i) => [i, v]));
    if (S.ev.inspired > 0) S.ev.inspired--;
    const it = { id: G.uid(), type, tier, rar, plus: 0, forSale: true };
    S.inv.push(it); S.stats.crafted++;
    if (rar >= 2) G.log('A forja produziu ' + G.itemName(it) + ' — ' + G.RAR[rar] + '!', rar >= 3 ? 'epic' : 'good');
    if (!silent) G.sfx(rar >= 3 ? 'rare' : 'forge');
    const p = Wd.plots.ferraria; G.addFx({ t: 'sparks', x: p.cx, y: p.cy + 1.5 });
    G.gainRealm(4 + tier * 3 + rar * 4, 'forja'); G.emit('inv'); G.questEvent('craft', 1, rar);
    return it;
  };
  const autoForge = () => {
    const S = G.S, mt = G.forgeMaxTier();
    for (const h of S.heroes) {
      const c = G.CLASSES[h.cls];
      for (const [slot, type] of [['arma', c.w], ['armadura', c.a], ['acessorio', 'anel']]) {
        const cur = h.gear[slot];
        for (let t = mt; t >= 1; t--) {
          if (G.TIER_LVL(t) > h.lvl + 6) continue;
          if (cur && cur.tier >= t) break;
          if (S.inv.some((i) => i.forSale && i.type === type && i.tier >= t)) break;
          if (h.gold < G.itemPrice({ type, tier: t, rar: 0, plus: 0 })) continue;
          if (G.canCraft(type, t, false).ok && S.gold > G.recipe(type, t).gold * 3) { G.craft(type, t, false, true); return; }
        }
      }
    }
  };
  G.upgradeItem = (it) => {
    const S = G.S;
    if (!G.bOk('ferraria')) return { ok: false, why: 'Ferraria fechada' };
    if (it.plus >= Math.min(15, 4 + G.bLvl('ferraria'))) return { ok: false, why: 'Limite da Ferraria' };
    const c = G.upgradeCost(it);
    if (S.gold < c.gold || !G.hasRes(c.cost)) return { ok: false, why: 'Faltam recursos' };
    G.spend(c.gold, 'forja'); G.payRes(c.cost);
    const win = Math.random() < c.chance;
    if (win) { it.plus++; G.sfx('rare'); for (const h of S.heroes) for (const k in h.gear) if (h.gear[k] === it) h._dirty = true; } else G.sfx('fail');
    G.emit('inv');
    return { ok: true, win };
  };
  G.sellItem = (it) => { const S = G.S, i = S.inv.indexOf(it); if (i < 0) return false; S.inv.splice(i, 1); G.earn(Math.round(G.itemPrice(it) * (G.bOk('mercado') ? 0.4 : 0.25)), 'exportacao'); G.sfx('coin'); G.emit('inv'); return true; };

  /* ---------- moradores ---------- */
  G.npcs = [];
  const mkNpc = (c, i) => {
    const home = Wd.houses[i % Wd.houses.length];
    return { id: 'n' + i, name: c.name, job: c.job, at: c.at, look: c.look, x: home.door[0], y: home.door[1], dir: 1, home: i % Wd.houses.length, state: 'home', inside: true, off: (G.hash(c.name) % 50) - 25, tThink: Math.random() * 2, act: 'home', spd: 1.5 + (G.hash(c.name) % 5) * 0.08 };
  };
  G.syncNpcs = () => {
    const S = G.S; if (!S) return;
    const want = [];
    G.CAST.forEach((c) => { if (G.bLvl(c.at) > 0) want.push(c); });
    const extra = Math.max(0, Math.min(G.EXTRA_NAMES.length, (S.pop || 12) - want.length));
    for (let i = 0; i < extra; i++) want.push({ name: G.EXTRA_NAMES[i], job: 'Morador', at: null, look: 30 + i });
    const by = {}; for (const n of G.npcs) by[n.name] = n;
    G.npcs = want.map((c, i) => by[c.name] || mkNpc(c, i));
    if (!G.guards) G.guards = ['n', 's', 'w', 'e'].map((g, i) => { const o = G.GATES[g]; return { id: 'g' + i, guard: 1, name: 'Guarda', job: 'Guarda do portão', look: 50 + i, x: o.x + (g === 'n' || g === 's' ? (i % 2 ? 1.3 : -1.3) : 0.6 * (g === 'w' ? 1 : -1)), y: o.y + (g === 'n' ? 1.2 : g === 's' ? -1.0 : -1.2), dir: g === 'e' ? -1 : 1, state: 'post' }; });
  };
  const SITE_SPOTS = {
    fazenda: () => { const f = G.pick(Wd.fields); return [G.rnd(f.x0 + 0.3, f.x1 + 0.7), G.rnd(f.y0 + 0.3, f.y1 + 0.7)]; },
    lenharia: () => Wd.nearestWalk(71 + G.rnd(-4, 5), 29.5 + G.rnd(0, 3)),
    pedreira: () => Wd.nearestWalk(23 + G.rnd(-3, 3.5), 76.6 + G.rnd(0, 1.2)),
  };
  const npcPlan = (n, hr) => {
    const h = (hr + n.off / 60 + 24) % 24;
    if (G.S.mare.active) return 'hide';
    if (h >= 22 || h < 5.5) return 'home';
    if (h >= 12 && h < 13) return 'lunch';
    if (h >= 18) return 'leisure';
    return n.at ? 'work' : 'leisure';
  };
  const updateNpc = (n, dt) => {
    const S = G.S;
    if (n.sayT > 0) n.sayT -= dt;
    n.tThink -= dt;
    if (n.tThink <= 0) {
      n.tThink = 1 + Math.random();
      const plan = npcPlan(n, S.clock / 60);
      if (plan !== n.act || (n.until && S.t > n.until)) {
        n.act = plan; n.until = 0; n.inside = false; n.carry = null;
        let p;
        if (plan === 'home' || plan === 'hide') { p = Wd.houses[n.home].door; n.goal = 'in'; }
        else if (plan === 'work') {
          const d = G.BLD[n.at];
          if (d.site) { p = SITE_SPOTS[n.at](); n.goal = 'toil'; n.until = S.t + G.rnd(10, 22); if (Math.random() < 0.18) { p = Wd.door(G.bOk('mercado') ? 'mercado' : 'guilda'); n.goal = 'in'; n.until = S.t + 40; n.carry = n.at === 'fazenda' ? 'trigo' : n.at === 'lenharia' ? 'madeira' : 'pedra'; } }
          else if (Math.random() < 0.55) { p = Wd.door(n.at); n.goal = 'in'; n.until = S.t + G.rnd(20, 45); }
          else { const dr = Wd.door(n.at); p = Wd.nearestWalk(dr[0] + G.rnd(-2.2, 2.2), dr[1] + G.rnd(0.1, 0.9)); n.goal = 'toil'; n.until = S.t + G.rnd(8, 16); }
        } else if (plan === 'lunch') { if (G.bOk('taverna') && Math.random() < 0.6) { p = Wd.door('taverna'); n.goal = 'in'; } else { p = G.pick(Wd.idle); n.goal = 'stand'; } }
        else { // lazer
          const r = Math.random();
          if (r < 0.25 && G.bOk('taverna')) { p = Wd.door('taverna'); n.goal = 'in'; n.until = S.t + G.rnd(25, 50); }
          else if (r < 0.75) { p = G.pick(Wd.idle); p = [p[0] + G.rnd(-0.5, 0.5), p[1] + G.rnd(-0.4, 0.4)]; n.goal = 'stand'; n.until = S.t + G.rnd(10, 25); }
          else { p = Wd.nearestWalk(G.rnd(30, 57), G.pick([46.5, 53.6, 60.5])); n.goal = 'stand'; n.until = S.t + G.rnd(8, 18); }
        }
        G.go(n, p[0], p[1]); n.state = 'walk';
      }
      if (!G.HEADLESS && n.state !== 'walk' && !n.inside && Math.random() < 0.02) { n.say = G.pick(G.BARKS.npc); n.sayT = 3.5; }
    }
    if (n.state === 'walk') {
      if (G.step(n, dt, n.spd * (n.act === 'hide' ? 1.6 : 1))) { n.state = n.goal === 'in' ? 'in' : n.goal; n.inside = n.goal === 'in'; n.moving = false; if (n.goal === 'toil') n.dir = Math.random() < 0.5 ? 1 : -1; }
    }
  };
  G.updateNpcs = (dt) => { for (const n of G.npcs) updateNpc(n, dt); };

  /* ---------- economia diária ---------- */
  G.wages = () => { let w = 0; for (const id of G.BLD_IDS) { const l = G.bLvl(id); if (l > 0) w += 5 * Math.pow(1.33, l - 1); } return Math.round(w); };
  G.popCap = () => 8 + 4 * G.bLvl('cidadela') + G.builtCount();
  G.taxEstimate = () => { const S = G.S; return Math.round((S.pop || 12) * (1.3 + 0.55 * G.bLvl('mercado')) * (1 + 0.09 * (S.realm.lvl - 1)) * G.work('feira') * ((S.happy || 70) / 70) * (S.ev.buff.festival > S.t ? 2 : 1)); };
  G.newDay = () => {
    const S = G.S;
    /* salários, dízimo e despensa */
    const w = G.wages();
    if (S.gold >= w) { S.gold -= w; S.stats.goldOut += w; S.rep.today['-salarios'] = w; S.happy = Math.min(100, (S.happy || 70) + 1); }
    else { S.rep.today['-salarios'] = S.gold; S.stats.goldOut += S.gold; S.gold = 0; S.happy = Math.max(5, (S.happy || 70) - 12); G.log('O cofre não cobriu os salários. Os moradores estão descontentes.', 'bad'); }
    G.earn(G.taxEstimate(), 'dizimo');
    const eat = (S.pop || 12) * 0.5;
    if ((S.res.trigo || 0) >= eat) { G.addRes('trigo', -eat); S.happy = Math.min(100, (S.happy || 70) + 2); } else { S.res.trigo = 0; S.happy = Math.max(5, (S.happy || 70) - 8); G.log('Faltou trigo para os moradores.', 'bad'); }
    if ((S.pop || 12) < G.popCap() && (S.happy || 70) >= 50) { S.pop = (S.pop || 12) + 1; G.syncNpcs(); }
    /* relatório */
    const t = S.rep.today; let inc = 0, out = 0;
    for (const k in t) { if (k[0] === '-') out += t[k]; else if (['xp', 'kills', 'falls', 'mats', 'loot', 'prod'].indexOf(k) < 0) inc += t[k]; }
    t._in = Math.round(inc); t._out = Math.round(out); t.day = S.day;
    S.rep.last = t; S.rep.hist.push({ d: S.day, i: t._in, o: t._out, k: t.kills || 0, f: t.falls || 0, x: Math.round(t.xp || 0), m: t.mats || 0 });
    if (S.rep.hist.length > 14) S.rep.hist.shift();
    S.rep.today = {};
    S.day++;
    G.dailyRoll(); G.eventRoll(); G.mareSchedule(); G.checkAch();
    G.emit('newday', t);
  };

  /* ---------- relógio do mundo ---------- */
  G.updateTown = (dt) => {
    const S = G.S;
    const before = S.clock;
    S.clock += dt * G.MIN_PER_SEC;
    if (Math.floor(before / 60) !== Math.floor(S.clock / 60)) hourTick();
    if (before < 360 + 1440 * 0 && S.clock >= 360 && S._dawn !== S.day) { /* primeira alvorada do save */ S._dawn = S.day; }
    if (S.clock >= 1440) { S.clock -= 1440; }
    if (before < 360 && S.clock >= 360) G.newDay();
    if (!S.mare.active && S.mare.next === S.day && before < 1230 && S.clock >= 1230) G.mareStart();
  };
})();
