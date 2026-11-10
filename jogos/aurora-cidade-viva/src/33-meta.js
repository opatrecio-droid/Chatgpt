/* 33-meta: Nível do Reino, jornada, contratos, eventos, conquistas, decretos, novo jogo e laço da simulação. */
'use strict';
(function () {
  const Wd = G.W;

  /* ---------- Nível do Reino ---------- */
  G.gainRealm = (n) => {
    const S = G.S, r = S.realm; if (!(n > 0)) return;
    r.xp += n;
    while (r.xp >= G.realmNeed(r.lvl)) {
      r.xp -= G.realmNeed(r.lvl); r.lvl++;
      const selos = r.lvl % 5 === 0 ? 3 : 1, gold = 40 + 25 * r.lvl;
      S.selos += selos; G.earn(gold, 'reino');
      const before = G.threatName(r.lvl - 1), now = G.threatName(r.lvl);
      G.log('Aurora alcançou o Nível de Reino ' + r.lvl + ' (' + now + '). +' + gold + ' moedas, +' + selos + ' Selo(s).', 'epic');
      const unlocked = [];
      for (const z of G.ZONES) if (z.unlock === r.lvl) { unlocked.push(z.name); G.log('Uma nova região pode ser explorada: ' + z.name + '.', 'epic'); }
      if (r.lvl === 5) { unlocked.push('Fenda Infinita'); G.log('A Fenda Infinita se abriu na Cratera, a sudoeste. Desafie-a nas Missões.', 'epic'); }
      G.sfx('realm'); G.emit('realm', { lvl: r.lvl, gold, selos, unlocked, threatUp: before !== now ? now : null });
    }
  };

  /* ---------- jornada (missões guiadas) ---------- */
  const zb = (id) => (S) => S.zones[id].bossKills;
  const rk = (r) => (S) => S.heroes.reduce((a, h) => Math.max(a, h.rank + (h.stars ? 8 : 0)), 0) >= r ? 1 : 0;
  G.QUESTS = [
    { t: 'Contrate um herói no Portal', h: 'Toque no Portal da praça ou abra a aba Heróis.', p: (S) => S.stats.recruits, n: 1, r: { gold: 80 } },
    { t: 'Abata 15 monstros', h: 'Seus heróis caçam sozinhos. Acompanhe pelo mapa.', p: (S) => S.stats.kills, n: 15, r: { gold: 60, pocao: 3 } },
    { t: 'Construa a Enfermaria', h: 'Aba Reino › Construções. Heróis feridos se curam lá.', p: () => G.bLvl('enfermaria'), n: 1, r: { gold: 100, madeira: 20 } },
    { t: 'Construa a Ferraria', h: 'É na Ferraria que o espólio vira equipamento.', p: () => G.bLvl('ferraria'), n: 1, r: { gold: 80, minerio: 12, couro: 6, gosma: 8 } },
    { t: 'Forje 2 equipamentos', h: 'Aba Forja. Os heróis compram o que você produz.', p: (S) => S.stats.crafted, n: 2, r: { gold: 120 } },
    { t: 'Leve um herói ao nível 5', h: 'Equipamento melhor acelera a caçada.', p: (S) => S.stats.maxLvl, n: 5, r: { gold: 100, selos: 1 } },
    { t: 'Construa a Lenharia', h: 'Madeira para as obras, arcos e cajados.', p: () => G.bLvl('lenharia'), n: 1, r: { gold: 80, pedra: 15 } },
    { t: 'Construa a Casa do Alquimista', h: 'Sem poções, heróis recuam cedo — ou caem.', p: () => G.bLvl('alquimista'), n: 1, r: { gold: 120, ervas: 20 } },
    { t: 'Conclua um contrato do dia', h: 'Aba Missões › Contratos.', p: (S) => S.stats.contracts, n: 1, r: { gold: 100, nucleos: 1 } },
    { t: 'Derrote o Ancião da Matilha', h: 'O chefe desperta quando a barra de caça do Bosque enche.', p: zb('bosque'), n: 1, r: { gold: 250, selos: 1 } },
    { t: 'Promova um herói ao Rank D', h: 'Nível 10, um Emblema do Bosque e moedas. Aba Heróis.', p: rk(1), n: 1, r: { gold: 200, nucleos: 1 } },
    { t: 'Melhore a Cidadela para o nível 2', h: 'Abre novos terrenos e eleva o limite das construções.', p: () => G.bLvl('cidadela'), n: 2, r: { gold: 300, selos: 1 } },
    { t: 'Construa a Pedreira', h: 'Pedra e minério sem depender do mercado.', p: () => G.bLvl('pedreira'), n: 1, r: { gold: 150 } },
    { t: 'Construa o Mercado', h: 'Venda excedente e atraia caravanas.', p: () => G.bLvl('mercado'), n: 1, r: { gold: 200, selos: 1 } },
    { t: 'Tenha 6 heróis', h: 'Melhore a Hospedaria para abrigar mais caçadores.', p: (S) => S.heroes.length, n: 6, r: { gold: 300, nucleos: 2 } },
    { t: 'Resista a uma Maré da Fenda', h: 'Mantenha os heróis curados e com poções na noite da Maré.', p: (S) => S.mare.wins, n: 1, r: { gold: 400, selos: 2 } },
    { t: 'Construa a Padaria e Moinho', h: 'Mais refeições, heróis sempre alimentados.', p: () => G.bLvl('padaria'), n: 1, r: { gold: 250 } },
    { t: 'Derrote o Lich de Ocre', h: 'As Ruínas de Ocre abrem no Nível de Reino 3.', p: zb('ruinas'), n: 1, r: { gold: 600, selos: 2 } },
    { t: 'Forje um equipamento Raro ou melhor', h: 'Ferraria de nível alto ou Obra-prima com Núcleo.', p: (S) => S.quest.rare || 0, n: 1, r: { gold: 400, nucleos: 2 } },
    { t: 'Construa o Campo de Treino', h: 'Heróis pagam para treinar: ouro para você, experiência para eles.', p: () => G.bLvl('treino'), n: 1, r: { gold: 500 } },
    { t: 'Promova um herói ao Rank C', h: 'Exige o Emblema de Ocre.', p: rk(2), n: 1, r: { gold: 800, selos: 2 } },
    { t: 'Conquiste o andar 1 da Fenda Infinita', h: 'Aba Missões › Fenda. Abre no Nível de Reino 5.', p: (S) => S.rift.best, n: 1, r: { gold: 800, selos: 2 } },
    { t: 'Construa a Torre de Vigia', h: 'Ajuda na defesa durante a Maré.', p: () => G.bLvl('torre'), n: 1, r: { gold: 800 } },
    { t: 'Construa o Santuário das Duas Luas', h: 'Requer Cidadela nível 4.', p: () => G.bLvl('santuario'), n: 1, r: { gold: 1200, selos: 3 } },
    { t: 'Compre 3 níveis de Bênçãos', h: 'Aba Mais › Bênçãos. Use seus Selos de Renome.', p: (S) => Object.values(S.bless).reduce((a, b) => a + b, 0), n: 3, r: { gold: 1000, nucleos: 2 } },
    { t: 'Derrote a Hidra da Fenda', h: 'Os Ermos abrem no Nível de Reino 7.', p: zb('ermos'), n: 1, r: { gold: 2500, selos: 3 } },
    { t: 'Promova um herói ao Rank B', h: 'Exige o Emblema dos Ermos.', p: rk(3), n: 1, r: { gold: 3000, selos: 3 } },
    { t: 'Conquiste o andar 5 da Fenda Infinita', h: 'Monte a melhor expedição que tiver.', p: (S) => S.rift.best, n: 5, r: { gold: 4000, selos: 4 } },
    { t: 'Derrote a Mãe das Brumas', h: 'O Pântano abre no Nível de Reino 12.', p: zb('pantano'), n: 1, r: { gold: 8000, selos: 4 } },
    { t: 'Promova um herói ao Rank A', h: 'Exige o Emblema das Brumas.', p: rk(4), n: 1, r: { gold: 10000, selos: 5 } },
    { t: 'Derrote o Wyrm Glacial', h: 'O Pico Gélido abre no Nível de Reino 18.', p: zb('pico'), n: 1, r: { gold: 25000, selos: 5 } },
    { t: 'Promova um herói ao Rank S', h: 'Exige o Emblema do Pico.', p: rk(5), n: 1, r: { gold: 40000, selos: 6 } },
    { t: 'Derrote o Dragão das Cinzas', h: 'As Cinzas abrem no Nível de Reino 25.', p: zb('cinzas'), n: 1, r: { gold: 100000, selos: 8 } },
    { t: 'Promova um herói ao Rank SSS', h: 'O topo da Guilda.', p: rk(7), n: 1, r: { gold: 250000, selos: 10 } },
    { t: 'Renasça um herói', h: 'No nível 80 de Rank SSS, o herói pode renascer mais forte.', p: (S) => S.stats.rebirths, n: 1, r: { gold: 500000, selos: 15 } },
  ];
  const DECREE_GEN = [
    (n) => ({ t: 'Alcance o Nível de Reino ' + (G.S.realm.lvl + 2), k: 'realm', n: G.S.realm.lvl + 2 }),
    (n) => ({ t: 'Derrote ' + (3 + n) + ' chefes', k: 'bosses', n: G.S.stats.bosses + 3 + n }),
    (n) => ({ t: 'Conquiste o andar ' + (G.S.rift.best + 2) + ' da Fenda Infinita', k: 'rift', n: G.S.rift.best + 2 }),
    (n) => ({ t: 'Abata ' + G.fmt(500 * (n + 1)) + ' monstros', k: 'kills', n: G.S.stats.kills + 500 * (n + 1) }),
    (n) => ({ t: 'Resista a ' + 2 + ' Marés da Fenda', k: 'mare', n: G.S.mare.wins + 2 }),
  ];
  const decreeVal = (k) => { const S = G.S; return k === 'realm' ? S.realm.lvl : k === 'bosses' ? S.stats.bosses : k === 'rift' ? S.rift.best : k === 'kills' ? S.stats.kills : S.mare.wins; };
  G.questCur = () => {
    const S = G.S, q = S.quest;
    if (q.step < G.QUESTS.length) { const d = G.QUESTS[q.step]; const cur = Math.min(d.n, d.p(S)); return { t: d.t, h: d.h, cur, n: d.n, r: d.r, done: cur >= d.n, idx: q.step + 1 }; }
    if (!q.decree) { const g = DECREE_GEN[q.decreeN % DECREE_GEN.length](Math.floor(q.decreeN / DECREE_GEN.length)); g.base = decreeVal(g.k); q.decree = g; }
    const d = q.decree, cur = decreeVal(d.k);
    return { t: d.t, h: 'Decreto real — a jornada continua sem fim.', cur: Math.min(d.n, cur) - (d.k === 'realm' || d.k === 'rift' ? 0 : d.base), n: d.n - (d.k === 'realm' || d.k === 'rift' ? 0 : d.base), r: { selos: 2 + Math.floor(q.decreeN / 5), gold: Math.round(300 * G.PM(S.realm.lvl * 2)) }, done: cur >= d.n, idx: G.QUESTS.length + q.decreeN + 1, decree: true };
  };
  G.giveReward = (r, why) => {
    const S = G.S; const parts = [];
    for (const k in r) {
      if (k === 'gold') { G.earn(r.gold, why || 'missoes'); parts.push(G.fmt(r.gold) + ' moedas'); }
      else if (k === 'selos') { S.selos += r.selos; parts.push(r.selos + ' Selo(s)'); }
      else if (k === 'nucleos') { S.nucleos += r.nucleos; parts.push(r.nucleos + ' Núcleo(s)'); }
      else if (k === 'xp') G.gainRealm(r.xp);
      else { G.addRes(k, r[k]); parts.push(r[k] + ' ' + G.RES[k].name); }
    }
    return parts.join(', ');
  };
  G.questClaim = () => {
    const S = G.S, c = G.questCur(); if (!c.done) return false;
    const txt = G.giveReward(c.r, 'missoes');
    G.log('Jornada: "' + c.t + '" concluída. Recompensa: ' + txt + '.', 'good');
    if (c.decree) { S.quest.decree = null; S.quest.decreeN++; } else S.quest.step++;
    G.gainRealm(20 + 4 * c.idx); G.sfx('quest'); G.emit('quest');
    return true;
  };

  /* ---------- contratos do dia ---------- */
  const CONTRACT_GEN = [
    () => { const zs = G.ZONES.filter(G.zoneUnlocked); const z = G.pick(zs); return { k: 'kill', z: z.id, n: G.ri(18, 30) + G.S.heroes.length * 3, t: 'Abater {n} monstros em ' + z.name }; },
    () => ({ k: 'elite', n: G.ri(2, 3) + Math.floor(G.S.realm.lvl / 8), t: 'Abater {n} elites' }),
    () => ({ k: 'craft', n: G.ri(2, 3), t: 'Forjar {n} equipamentos', need: 'ferraria' }),
    () => { const zs = G.ZONES.filter(G.zoneUnlocked); const z = G.pick(zs); const m = G.ZMATS[z.n].a; return { k: 'mat', m, n: G.ri(12, 20) + G.S.heroes.length * 2, t: 'Receber {n} de ' + G.RES[m].name }; },
    () => ({ k: 'sold', n: G.ri(1, 2), t: 'Vender {n} equipamento(s) aos heróis', need: 'ferraria' }),
    () => ({ k: 'lvl', n: G.ri(2, 4), t: 'Heróis sobem {n} níveis' }),
    () => ({ k: 'gold', n: Math.round(G.ri(200, 320) * G.PM(G.avgHeroLvl()) * Math.max(1, G.S.heroes.length / 3)), t: 'Arrecadar {n} moedas' }),
  ];
  G.dailyRoll = () => {
    const S = G.S, d = S.daily;
    if (d.day === S.day) return;
    if (d.day && !(d.list.length && d.list.every((c) => c.claimed))) d.streak = 0;
    d.day = S.day; d.claimed = false; d.list = [];
    const gens = G.shuffle(CONTRACT_GEN.slice());
    for (const g of gens) {
      if (d.list.length >= 3) break;
      const c = g(); if (c.need && !G.bOk(c.need)) continue;
      c.p = 0; c.claimed = false; c.t = c.t.replace('{n}', G.fmt(c.n));
      c.gold = Math.round(55 * G.PM(G.avgHeroLvl()) * (1 + 0.05 * S.realm.lvl));
      d.list.push(c);
    }
    G.emit('daily');
  };
  G.questEvent = (k, n, arg) => {
    const S = G.S; if (!S) return;
    if (k === 'craft' && arg >= 2) S.quest.rare = 1;
    for (const c of S.daily.list) {
      if (c.claimed || c.p >= c.n || c.k !== k) continue;
      if (k === 'kill' && c.z !== arg) continue;
      if (k === 'mat' && c.m !== arg) continue;
      c.p = Math.min(c.n, c.p + n);
      if (c.p >= c.n) { G.toast('Contrato cumprido: ' + c.t, 'good', 'scroll'); G.emit('daily'); }
    }
  };
  G.on('gold', (d) => { if (d.n > 0 && d.why !== 'contratos' && d.why !== 'missoes') G.questEvent('gold', d.n); });
  G.contractClaim = (i) => {
    const S = G.S, c = S.daily.list[i]; if (!c || c.claimed || c.p < c.n) return false;
    c.claimed = true; G.earn(c.gold, 'contratos'); G.gainRealm(25 + 5 * S.realm.lvl); S.stats.contracts++;
    G.sfx('quest'); G.emit('daily'); return true;
  };
  G.dailyChest = () => {
    const S = G.S, d = S.daily; if (d.claimed || !d.list.length || !d.list.every((c) => c.claimed)) return null;
    d.claimed = true; d.streak++;
    const r = { selos: 1 + (d.streak % 5 === 0 ? 2 : 0), nucleos: d.streak % 3 === 0 ? 2 : 1 };
    G.giveReward(r); G.log('Baú dos contratos aberto. Sequência: ' + d.streak + ' dia(s).', 'good'); G.sfx('rare'); G.emit('daily');
    return r;
  };

  /* ---------- conquistas ---------- */
  G.achTier = (a) => { const v = G.S.stats[a.stat] || 0; let t = 0; while (t < a.tiers.length && v >= a.tiers[t]) t++; return t; };
  G.achPending = () => { let n = 0; for (const a of G.ACH) if (G.achTier(a) > (G.S.ach[a.id] || 0)) n++; return n; };
  G.checkAch = () => { const n = G.achPending(); if (n !== G._achN) { G._achN = n; G.emit('ach'); } };
  G.achClaim = (id) => { const S = G.S, a = G.ACH.find((x) => x.id === id); const have = S.ach[id] || 0, t = G.achTier(a); if (t <= have) return 0; let selos = 0; for (let i = have; i < t; i++) selos += i + 1; S.ach[id] = t; S.selos += selos; G.sfx('quest'); G.emit('ach'); return selos; };

  /* ---------- bênçãos e decretos ---------- */
  G.buyBless = (id) => { const S = G.S, l = S.bless[id] || 0, c = G.blessCost(l); if (S.selos < c) return false; S.selos -= c; S.bless[id] = l + 1; G.dirtyAll(); G.sfx('rare'); G.emit('bless'); return true; };
  G.decreeReady = (d) => (G.S.decrees[d.id] || 0) <= G.S.t;
  G.useDecree = (id) => {
    const S = G.S, d = G.DECREES.find((x) => x.id === id); if (!d || !G.decreeReady(d)) return false;
    const c = G.decreeCost(d); if (c && !G.spend(c, 'decretos')) return false;
    S.decrees[id] = S.t + d.cd;
    if (id === 'reunir') { for (const h of S.heroes) if (h.state === 'hunt' || h.state === 'travel') G.heroGoHome(h, false); G.log('O sino da Cidadela tocou: todos de volta!', 'info'); }
    if (id === 'aurora') { for (const h of S.heroes) if (h.state !== 'fallen' && h.state !== 'recover') { const st = G.heroStats(h); h.hp = Math.min(st.hp, h.hp + st.hp * 0.4); G.addFx({ t: 'healring', x: h.x, y: h.y - 0.3 }); } G.log('A Luz da Aurora banhou os heróis.', 'good'); }
    if (id === 'furia') { S.ev.buff.furia = S.t + 60; G.log('Chamado às Armas! Os heróis lutam com fúria.', 'good'); }
    if (id === 'banquete') { for (const h of S.heroes) { h.fome = 100; h.animo = 100; } G.log('Banquete Real servido: fome saciada, ânimo nas alturas.', 'good'); }
    G.sfx(id === 'reunir' ? 'horn' : 'heal'); G.emit('decree', id);
    return true;
  };

  /* ---------- eventos aleatórios ---------- */
  G.EVENTS = [
    { id: 'caravana', w: 3, can: () => G.bOk('mercado'), title: 'Caravana do Leste', art: 'caravan',
      text: 'Carroças cobertas de poeira param diante do portão. O mestre da caravana sorri: "Compramos tudo — e pelo dobro, só hoje."',
      opts: [{ l: 'Abrir o mercado para eles', d: 'Vendas no Mercado rendem o dobro até o amanhecer.', f: (S) => { S.ev.caravan = S.day; return 'A caravana montou suas barracas. Venda o que puder hoje.'; } },
        { l: 'Comprar o lote de minério', d: () => 'Paga ' + G.fmt(Math.round(60 * G.PM(G.S.realm.lvl * 2))) + ' moedas por minério, pedra e madeira.', c: () => Math.round(60 * G.PM(G.S.realm.lvl * 2)), f: (S) => { const n = 20 + 6 * S.realm.lvl; G.addRes('minerio', n); G.addRes('pedra', n); G.addRes('madeira', n); return '+' + n + ' de minério, pedra e madeira.'; } }] },
    { id: 'viajante', w: 2, can: () => G.S.heroes.length < G.heroCap(), title: 'Um viajante de outro mundo', art: 'portal',
      text: 'O Portal se abriu sozinho. Dele saiu alguém de roupas estranhas, falando de carruagens sem cavalos e torres de vidro. "Onde… onde eu estou?"',
      opts: [{ l: 'Acolher o Invocado', d: 'Ganha um herói Raro ou melhor com o traço Invocado.', f: () => { const c = G.rollCandidates('nucleo')[0]; c.traits = G.rollTraits(3, ['invocado']); const h = G.hire(c); return h ? h.name + ' agora luta por Aurora.' : 'Não havia cama livre.'; } },
        { l: 'Devolvê-lo ao Portal', d: 'A energia do retorno cristaliza 3 Núcleos.', f: (S) => { S.nucleos += 3; return '+3 Núcleos.'; } }] },
    { id: 'festival', w: 3, can: () => true, title: 'Festival da Colheita', art: 'festival',
      text: 'Os moradores penduraram lanternas pela praça e pedem a sua bênção — e uma ajuda do cofre — para a festa.',
      opts: [{ l: 'Bancar o festival', d: () => 'Custa ' + G.fmt(Math.round(50 * G.PM(G.S.realm.lvl * 2))) + ' moedas. Ânimo cheio, produção +25% e dízimo em dobro por um dia.', c: () => Math.round(50 * G.PM(G.S.realm.lvl * 2)), f: (S) => { S.ev.buff.festival = S.t + G.DAY_SEC; S.happy = Math.min(100, (S.happy || 70) + 15); for (const h of S.heroes) h.animo = 100; return 'A cidade inteira dançou até tarde.'; } },
        { l: 'Só um discurso', d: 'Sem custo. Um pouco de ânimo.', f: (S) => { for (const h of S.heroes) h.animo = Math.min(100, h.animo + 15); return 'Palmas educadas.'; } }] },
    { id: 'luarubra', w: 3, can: () => G.S.day > 3, title: 'Lua Rubra', art: 'redmoon',
      text: 'A lua menor amanheceu vermelha. Os mais velhos dizem que nesta noite os monstros ficam ferozes — e carregados de espólio.',
      opts: [{ l: 'Caçada da Lua Rubra', d: 'Esta noite: monstros +25% de ataque, o dobro de elites e de materiais.', f: (S) => { S.ev.redMoon = S.t + G.DAY_SEC; return 'Os caçadores afiam as lâminas.'; } },
        { l: 'Toque de recolher', d: 'Heróis ficam na cidade até o amanhecer. Ninguém se arrisca.', f: (S) => { S.ev.curfew = S.t + G.DAY_SEC * 0.9; return 'Portões fechados esta noite.'; } }] },
    { id: 'praga', w: 2, can: () => G.bOk('fazenda') && G.S.day > 4, title: 'Praga na lavoura', art: 'blight',
      text: 'Joca chega aflito: manchas escuras tomaram metade do trigal.',
      opts: [{ l: 'Usar ervas para tratar', d: 'Gasta 12 Ervas.', can: (S) => (S.res.ervas || 0) >= 12, f: () => { G.addRes('ervas', -12); return 'A lavoura foi salva.'; } },
        { l: 'Deixar a praga passar', d: 'Produção de trigo pela metade por 2 dias.', f: (S) => { S.ev.blight = S.day + 2; return 'Dias magros pela frente.'; } }] },
    { id: 'inspirado', w: 2, can: () => G.bOk('ferraria'), title: 'O ferreiro sonhou', art: 'forge',
      text: 'Fábio acordou com um desenho na cabeça — uma têmpera que ele nunca tinha tentado.',
      opts: [{ l: 'Deixá-lo tentar', d: 'Os próximos 3 itens forjados saem um grau de raridade acima.', f: (S) => { S.ev.inspired = 3; return 'A bigorna canta diferente hoje.'; } },
        { l: 'Vender a ideia à caravana', d: () => '+' + G.fmt(Math.round(90 * G.PM(G.S.realm.lvl * 2))) + ' moedas.', f: (S) => { G.earn(Math.round(90 * G.PM(S.realm.lvl * 2)), 'eventos'); return 'Negócio fechado.'; } }] },
    { id: 'estrelas', w: 2, can: () => true, title: 'Chuva de estrelas', art: 'stars',
      text: 'Riscos de luz cruzaram o céu entre as Duas Luas. Um deles caiu perto da muralha.',
      opts: [{ l: 'Recolher os fragmentos', d: '+2 Núcleos.', f: (S) => { S.nucleos += 2; return '+2 Núcleos.'; } },
        { l: 'Oferecer ao Santuário', d: '+1 Selo de Renome.', f: (S) => { S.selos += 1; return '+1 Selo de Renome.'; } }] },
    { id: 'torneio', w: 2, can: () => G.S.heroes.length >= 4, title: 'Torneio de Aurora', art: 'tourney',
      text: 'A Guilda propõe um torneio amistoso. Custa caro montar a arena, mas os heróis aprendem muito uns com os outros.',
      opts: [{ l: 'Montar a arena', d: () => 'Custa ' + G.fmt(Math.round(80 * G.PM(G.S.realm.lvl * 2))) + ' moedas. +50% de experiência por um dia.', c: () => Math.round(80 * G.PM(G.S.realm.lvl * 2)), f: (S) => { S.ev.buff.torneio = S.t + G.DAY_SEC; return 'Que vença o melhor!'; } },
        { l: 'Agora não', d: 'Nada acontece.', f: () => 'A Guilda entende.' }] },
  ];
  G.eventRoll = () => {
    const S = G.S; if (S.day < S.ev.next || S.ev.pending) return;
    S.ev.next = S.day + G.ri(2, 4);
    const pool = G.EVENTS.filter((e) => e.can() && e.id !== S.ev.lastId).map((e) => [e, e.w]);
    if (!pool.length) return;
    const e = G.wpick(pool); S.ev.lastId = e.id; S.ev.pending = e.id;
    if (G.HEADLESS || G.AUTO) G.eventChoose(0); else G.emit('event', e);
  };
  G.eventChoose = (i) => {
    const S = G.S, e = G.EVENTS.find((x) => x.id === S.ev.pending); if (!e) return null;
    let o = e.opts[i];
    const cost = o.c ? o.c() : 0;
    if ((o.can && !o.can(S)) || (cost && S.gold < cost)) { o = e.opts[e.opts.length - 1]; if (o.c && S.gold < o.c()) return null; }
    if (o.c) G.spend(o.c(), 'eventos');
    const res = o.f(S); S.ev.pending = null;
    G.log(e.title + ': ' + res, 'info'); G.emit('eventdone', { e, res });
    return res;
  };
  G.mareSchedule = () => {
    const S = G.S, m = S.mare;
    if (S.realm.lvl < 3) { m.next = Math.max(m.next, S.day + 2); return; }
    const lead = G.bOk('torre') ? 2 : 1;
    if (m.next - S.day <= lead && m.next > S.day && m.warned !== m.next) { m.warned = m.next; G.log('Os vigias avistaram a Fenda pulsando. A Maré chega em ' + (m.next - S.day) + ' dia(s), ao anoitecer.', 'boss'); G.toast('A Maré da Fenda se aproxima', 'boss', 'eye'); }
    if (m.next === S.day) { G.log('A Maré da Fenda chega esta noite, às 20h30. Prepare poções e descanse os heróis.', 'boss'); G.toast('A Maré chega esta noite!', 'boss', 'skull'); }
    if (m.next < S.day) m.next = S.day + 1;
  };

  /* ---------- novo jogo ---------- */
  G.newGame = () => {
    const S = (G.S = G.newState());
    S._stGen = 1; S.pop = 12; S.happy = 70;
    for (const id of G.BLD_IDS) if (G.BLD[id].built) S.b[id] = { lvl: 1 };
    for (const z of G.ZONES) S.zones[z.id] = { tier: 0, maxTier: 0, gauge: 0, kills: 0, bossKills: 0, boss: 0, lock: 0 };
    const mk = (name, cls, traits) => { const h = G.makeHero({ name, cls, traits, potions: 2, gold: 15 }); S.heroes.push(h); return h; };
    const k = mk('Kael', 'esp', ['corajoso', 'impulsivo']), m = mk('Mira', 'arq', ['ambicioso', 'focado']), t = mk('Tobo', 'mag', ['medroso', 'sortudo']);
    k.look = { skin: 1, hair: 2, style: 1, seed: 11 }; m.look = { skin: 0, hair: 6, style: 3, seed: 22 }; t.look = { skin: 2, hair: 4, style: 4, seed: 33 };
    [k, m, t].forEach((h, i) => { h.x = 42 + i * 1.6; h.y = 56.2; h.tThink = 1.5 + i * 1.2; });
    G.mons.length = 0; G.npcs.length = 0; G.guards = null;
    G.syncNpcs(); G.dailyRoll(); G.populate();
    G.log('Bem-vindo a Aurora. Sob as Duas Luas, o reino espera por você.', 'epic');
    return S;
  };
  G.afterLoad = () => {
    const S = G.S;
    S._stGen = (S._stGen || 0) + 1; S._training = 0;
    if (S.pop == null) S.pop = 12; if (S.happy == null) S.happy = 70;
    for (const z of G.ZONES) { if (!S.zones[z.id]) S.zones[z.id] = { tier: 0, maxTier: 0, gauge: 0, kills: 0, bossKills: 0, boss: 0, lock: 0 }; S.zones[z.id].boss = 0; }
    S.mare.active = null; S.rift.run = null;
    for (const h of S.heroes) {
      h._dirty = true; h.tgt = null; h.path = null; h.inside = null;
      if (h.state === 'fallen') { h.state = 'recover'; h.reviveAt = S.t + 20; }
      else if (h.state !== 'recover') { h.state = 'town'; if (!Wd.inTown(h.x, h.y)) { h.x = Wd.plaza.cx + G.rnd(-3, 3); h.y = Wd.plaza.cy + G.rnd(2, 4); } }
      if (!Wd.walkable(h.x, h.y)) { const p = Wd.nearestWalk(h.x, h.y); h.x = p[0]; h.y = p[1]; }
      for (const k of ['tAtk', 'tSkill', 'tPot', 'tThink']) if (!(h[k] >= 0)) h[k] = 0;
      if (!h.buff) h.buff = {};
    }
    G.mons.length = 0; G.npcs.length = 0; G.guards = null;
    G.syncNpcs(); if (S.daily.day !== S.day) G.dailyRoll(); G.populate();
  };

  /* ---------- progresso offline (estimado pelo histórico recente) ---------- */
  G.offline = (secs) => {
    const S = G.S; secs = Math.min(secs, 8 * 3600);
    if (secs < 90 || !S.rep.hist.length) return null;
    const hs = S.rep.hist.slice(-3); const n = hs.length;
    const avg = (k) => hs.reduce((a, b) => a + (b[k] || 0), 0) / n;
    const days = (secs / G.DAY_SEC) * 0.4;
    const gold = Math.max(0, Math.round((avg('i') - avg('o')) * days));
    const xp = avg('x') * days, kills = Math.round(avg('k') * days), mats = Math.round(avg('m') * days);
    if (gold > 0) { S.gold += gold; S.stats.goldIn += gold; }
    const alive = S.heroes.filter((h) => h.state !== 'recover');
    for (const h of alive) G.giveXp(h, xp / Math.max(1, alive.length));
    const zs = G.ZONES.filter(G.zoneUnlocked);
    for (let i = 0; i < mats; i++) { const z = G.pick(zs), zm = G.ZMATS[z.n]; G.addRes(Math.random() < 0.5 ? zm.a : zm.b, 1); }
    S.stats.kills += kills;
    for (const h of S.heroes) { h.fome = Math.max(h.fome, 60); h.energia = Math.max(h.energia, 70); h.hp = G.heroStats(h).hp; }
    return { secs, gold, kills, mats, xp: Math.round(xp) };
  };

  /* ---------- laço da simulação ---------- */
  let achT = 0;
  G.tick = (dt) => {
    const S = G.S;
    S.t += dt; S.stats.played += dt;
    G.updateTown(dt);
    G.updateHeroes(dt, G.mons);
    G.updateMons(dt);
    G.updateEncounters(dt);
    G.updateNpcs(dt);
    achT -= dt; if (achT <= 0) { achT = 3; G.checkAch(); }
  };
})();
