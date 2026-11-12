/* 3L-predios: v27 (A4) — tudo o que o cartão de um prédio mostra, calculado pelas MESMAS funções que a simulação usa (G.prodRates, G.resCap, G.heroCap,
   G.forgeMaxTier, G.bfx, G.price, G.reviveTime, G.towerDamage…). Nada aqui repete uma fórmula do jogo: para saber o que o prédio dá no nível N, o
   prédio é posto temporariamente no nível N (withLvl) e as funções do jogo são chamadas. Só simulação, sem DOM (a tela mora em 6H-ui-predio.js). */
'use strict';
(function () {
  const n0 = (x) => String(Math.round(x));
  const n1 = (x) => (Math.round(x * 10) / 10).toString().replace('.', ',');
  const hours = (k) => G.PROD[k][1] - G.PROD[k][0];
  /* roda fn com o prédio id no nível l e sem dano (e restaura tudo, mesmo se fn falhar) */
  const withLvl = (id, l, fn) => {
    const S = G.S, had = S.b[id], keep = had ? { lvl: had.lvl, dmg: had.dmg } : null;
    if (had) { had.lvl = l; had.dmg = 0; } else S.b[id] = { lvl: l };
    try { return fn(); } finally { if (had) { had.lvl = keep.lvl; if (keep.dmg === undefined) delete had.dmg; else had.dmg = keep.dmg; } else delete S.b[id]; }
  };
  /* F: um fato do cartão. v = número (para a diferença), f formata o número, u = unidade depois do número, low = menor é melhor, fd = texto da diferença */
  const F = (label, v, f, u, o) => { f = f || n1; u = u || ''; o = o || {}; return { label, v, t: (o.pre || '') + f(v) + u, f, u, low: !!o.low, fd: o.fd || null, pre: o.pre || '' }; };
  const stub = () => ({ lvl: Math.max(1, Math.round(G.avgHeroLvl())), traits: [] });      // "herói médio" para preços e tempos
  const maxRank = () => { let m = 0; for (let r = 0; r < 7; r++) { const q = G.promoReq({ rank: r }); if (q && q.guilda <= G.bLvl('guilda')) m = r + 1; } return m; };
  const upkeep = (id) => F('Salário da equipe', G.bWage(id), n1, ' moedas/dia', { low: true });
  const odds = () => { const w = G.rarWeights(false); let t = 0, up = 0; for (let i = 0; i < w.length; i++) { t += w[i]; if (i >= 2) up += w[i]; } return t ? (100 * up) / t : 0; };
  const FACTS = {
    cidadela: () => [
      F('Limite das outras obras', G.bMax('guilda'), n0, '', { pre: 'nível ' }),
      F('Armazém de cada recurso', G.resCap('madeira'), G.fmt),
      F('Moradores (máx.)', G.popCap(), n0),
      F('Peças no Armazém', G.invCap(), n0),
    ],
    guilda: () => [
      F('Promoção autorizada até o Rank', maxRank(), (v) => G.RANKS[v], '', { fd: (d) => '+' + d + (d > 1 ? ' ranks' : ' rank') }),
    ],
    hospedaria: () => [
      F('Camas para heróis', G.heroCap(), n0),
      F('Descanso mais rápido', (G.bfx.rest() - 1) * 100, n0, '%'),
      F('Diária por herói (nível médio)', G.price(stub(), 'rest'), G.fmt, ' moedas'),
    ],
    taverna: () => {
      const a = [F('Estoque de refeições', G.resCap('refeicao'), n0), F('Ânimo ao comer, mais rápido', (G.bfx.mood() - 1) * 100, n0, '%'), F('Refeição por herói (nível médio)', G.price(stub(), 'meal'), G.fmt, ' moedas')];
      if (!G.bOk('padaria')) a.push(F('Cozinha própria', G.prodRates().refeicao * hours('serv'), n1, ' refeições/dia'));
      return a;
    },
    enfermaria: () => [
      F('Cura mais rápida', (G.bfx.heal() - 1) * 100, n0, '%'),
      F('Caídos voltam em', G.reviveTime(stub()), n0, ' s', { low: true }),
      F('Cura por visita (nível médio)', G.price(stub(), 'heal'), G.fmt, ' moedas'),
    ],
    ferraria: () => [
      F('Forja até', G.forgeMaxTier(), (v) => G.tierName(v).replace(/^(de|da|das|do|dos) /, ''), '', { fd: (d) => '+' + d + (d > 1 ? ' graus' : ' grau') }),
      F('Aprimora até', Math.min(15, 4 + G.bLvl('ferraria')), n0, '', { pre: '+' }),
      F('Chance de peça Rara ou melhor', odds(), n1, '%'),
      F('Encomendas automáticas', G.autoForgeN(), n0, ' por hora'),
      F('Peças no Armazém', G.invCap(), n0),
    ],
    alquimista: () => [
      F('Poções por dia', G.prodRates().pocao * hours('serv'), n1),
      F('Estoque de poções', G.resCap('pocao'), n0),
      F('Cura por poção', G.bfx.potHeal() * 100, n0, '% da vida'),
    ],
    mercado: () => [
      F('Paga pelo excedente', G.bfx.sell() * 100, n0, '% do valor'),
      F('Armazém de cada recurso', G.resCap('madeira'), G.fmt),
      F('Dízimo por dia', G.taxEstimate(), G.fmt, ' moedas'),
      F('Peças no Armazém', G.invCap(), n0),
    ],
    padaria: () => [
      F('Refeições por dia', G.prodRates().refeicao * hours('serv'), n1),
      F('Trigo por refeição', G.mealWheat(), n0, '', { low: true }),
    ],
    treino: () => [
      F('Vagas de treino', G.bLvl('treino'), n0),
      F('Experiência por sessão', G.bfx.trainXp() * 100, n0, '% do nível'),
      F('Habilidades treinam até o nível', G.skillCap(), n0),
    ],
    santuario: () => [
      F('Bênçãos mais fortes', (G.bfx.bless() - 1) * 100, n0, '%'),
      F('Graça das Duas Luas num golpe fatal', G.bfx.grace() * 100, n0, '%'),
    ],
    torre: () => [
      F('Dispara a cada', G.bfx.towerGap(), n1, ' s', { low: true }),
      F('Dano por disparo (Maré atual)', G.towerDamage(G.mareLevel()), G.fmt),
      F('Aviso da Maré', G.mareLead(), n0, ' dias antes'),
    ],
    fazenda: () => { const r = G.prodRates(); return [F('Trigo por dia', r.trigo * hours('work'), n1), F('Ervas por dia', r.ervas * hours('work'), n1)]; },
    lenharia: () => [F('Madeira por dia', G.prodRates().madeira * hours('work'), n1)],
    pedreira: () => { const r = G.prodRates(); return [F('Pedra por dia', r.pedra * hours('work'), n1), F('Minério por dia', r.minerio * hours('work'), n1)]; },
    estabulo: () => [
      F('Baias', G.stallCap(), n0),
      F('Ração por dia', G.racaoRate() * hours('serv'), n1),
      F('Estoque de ração', G.resCap('racao'), n0),
      (() => { const l = G.bLvl('estabulo'), ok = G.MOUNT_IDS.filter((k) => G.MOUNTS[k].est <= l); return F('Doma até', ok.length, (v) => (v ? G.MOUNTS[ok[v - 1]].name : '—'), '', { fd: (d) => '+' + d + (d > 1 ? ' montarias' : ' montaria') }); })(),
    ],
  };
  /* fatos do prédio id no nível l (l >= 1). O salário vem sempre por último */
  G.bldFacts = (id, l) => withLvl(id, l, () => { const f = FACTS[id] ? FACTS[id]() : []; f.push(upkeep(id)); return f; });

  /* tudo do cartão: níveis, custo, regras de obra, fatos de agora e do próximo nível */
  G.bldInfo = (id) => {
    const S = G.S, d = G.BLD[id], b = S.b[id], l = b ? b.lvl : 0;
    const o = { id, name: d.name, short: d.short, desc: d.desc, lvl: l, built: l > 0, avail: G.bAvailable(id), dmg: !!(b && b.dmg), site: !!d.site, cid: d.cid || 1 };
    o.max = id === 'cidadela' ? 99 : G.bMax(id);
    o.maxed = id !== 'cidadela' && l + 1 > o.max;
    o.up = G.canUpgrade(id);
    o.cost = G.bCost(id, l + 1);
    o.needRealm = id === 'cidadela' && S.realm.lvl < G.cidReq(l + 1) ? G.cidReq(l + 1) : 0;
    o.repair = o.dmg ? G.repairCost(id) : 0;
    o.now = l > 0 ? G.bldFacts(id, l) : [];
    o.next = o.avail && !o.maxed ? G.bldFacts(id, l + 1) : null;
    o.opens = id === 'cidadela' ? G.BLD_IDS.filter((i) => (G.BLD[i].cid || 1) === l + 1 && G.bLvl(i) === 0).map((i) => G.BLD[i].name) : [];
    const disc = G.pedidoDisc ? G.pedidoDisc(id) : null; o.disc = disc ? disc.pct : 0;
    return o;
  };

  /* quem está no prédio agora: moradores da equipe (com o que fazem) e heróis dentro ou a caminho */
  const npcState = (n) => {
    if (n._sc) return n._sc === 'fire' ? 'na fogueira' : n._sc === 'tav' ? 'à mesa da Taverna' : 'treinando';
    if (n.act === 'hide') return 'abrigado';
    if (n.act === 'work') return n.inside ? 'no balcão' : n.state === 'walk' ? 'a caminho do posto' : 'trabalhando';
    if (n.act === 'lunch') return 'almoçando';
    if (n.act === 'leisure') return 'de folga';
    return n.state === 'walk' ? 'a caminho de casa' : 'em casa';
  };
  G.bldPresence = (id) => {
    const S = G.S, npcs = [], heroes = [];
    for (const n of G.npcs) if (n.at === id && !n.guard) npcs.push({ name: n.name, job: n.job, st: npcState(n) });
    for (const h of S.heroes) {
      if (h.inside === id && (h.state === 'inside' || h.state === 'recover' || h.state === 'fallen')) heroes.push({ id: h.id, name: h.name, st: h.state === 'inside' ? G.stateLabel(h) : G.stateLabel(h) });
      else if (h.state === 'goto' && h.dest === id) heroes.push({ id: h.id, name: h.name, st: 'A caminho' });
    }
    return { npcs, heroes, training: id === 'treino' ? { n: S._training || 0, of: G.bLvl('treino') } : null };
  };
})();

;
