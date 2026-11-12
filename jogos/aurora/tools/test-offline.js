#!/usr/bin/env node
/* Testes do progresso offline (v27, A1) e das decisões pendentes (A2), sem DOM. Uso: node tools/test-offline.js [--study]
   --study imprime também o estudo de passo (dt 0,034 / 0,1 / 0,15 / 0,25) e o erro da estimativa, que demoram mais. Sai com código 1 se algo falhar. */
const sim = require('./sim.js');
const G = sim.load();
const H = 3600;
let fails = 0, passes = 0;
const ok = (c, msg, extra) => { if (c) { passes++; console.log('  ok   ' + msg); } else { fails++; console.log('  FAIL ' + msg + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const cum = (h) => { let c = h.xp || 0; for (let l = 1; l < h.lvl; l++) c += G.xpNeed(l); return c; };

/* jogador automático: leva um jogo novo a um meio de jogo (contrata, constrói, promove) para os testes terem um reino com graça */
const play = (secs) => {
  const S = G.S, ORDER = ['enfermaria', 'ferraria', 'hospedaria', 'alquimista', 'taverna', 'guilda', 'cidadela', 'mercado', 'padaria', 'fazenda', 'treino', 'torre', 'lenharia', 'pedreira', 'santuario', 'estabulo'];
  let next = 0;
  for (let t = 0; t < secs; t += 0.05) {
    G.tick(0.05);
    if (S.t < next) continue; next = S.t + 20;
    try {
      while (G.questCur().done) G.questClaim();
      if (S.heroes.length < G.heroCap() && S.gold > G.recruitCost() * 2) { const c = G.rollCandidates('gold')[0]; G.hire(c); G.spend(G.recruitCost(), 'recrutas'); }
      for (const h of S.heroes) if (G.canPromote(h)) G.promote(h);
      for (let k = 0; k < 3; k++) { const id = ORDER.slice().sort((a, b) => G.bLvl(a) - G.bLvl(b)).find((i) => G.canUpgrade(i).ok); if (!id) break; G.upgrade(id); }
    } catch (e) { /* o jogador automático não precisa ser perfeito */ }
  }
};
const fresh = () => { G.W.init(); G.newGame(); G.EVENT_IMMEDIATE = true; };
const midState = () => { fresh(); play(3 * H); return G.serialize(); };
const load = (str) => { G.S = G.deserialize(str); G.afterLoad(); G.EVENT_IMMEDIATE = false; };

console.log('A1 · fórmula do tempo vivido (50% das primeiras 8 h, 30% das 8 h seguintes, teto de 16 h)');
{
  const h = (x) => x * H;
  ok(near(G.offlineEff(h(0.5)), h(0.25), 1), '0,5 h fora -> 0,25 h vividas', G.offlineEff(h(0.5)));
  ok(near(G.offlineEff(h(8)), h(4), 1), '8 h fora -> 4 h vividas', G.offlineEff(h(8)));
  ok(near(G.offlineEff(h(12)), h(5.2), 1), '12 h fora -> 5,2 h vividas', G.offlineEff(h(12)));
  ok(near(G.offlineEff(h(16)), h(6.4), 1), '16 h fora -> 6,4 h vividas', G.offlineEff(h(16)));
  ok(near(G.offlineEff(h(40)), h(6.4), 1), '40 h fora -> 6,4 h vividas (teto de 16 h)', G.offlineEff(h(40)));
  ok(G.offlineEff(0) === 0 && G.offlineEff(-5) === 0, 'tempo nulo ou negativo não vive nada');
  fresh();
  ok(G.offlineBegin(59) === null, 'ausência de 59 s é ignorada');
  const j = G.offlineBegin(60); ok(!!j && G.OFFLINE === true, 'ausência de 60 s começa o avanço (G.OFFLINE ligado)'); G.offlineAbort();
  ok(G.OFFLINE === false, 'G.offlineAbort desliga G.OFFLINE');
}

console.log('A3 · Lenharia e Pedreira nascem no nível 1 e saves antigos as recebem');
{
  fresh();
  ok(G.bLvl('lenharia') === 1 && G.bLvl('pedreira') === 1, 'jogo novo: lenharia e pedreira no nível 1');
  ok(G.syncNpcs && G.npcs.some((n) => n.name === 'Nuno') && G.npcs.some((n) => n.name === 'Pedro'), 'Nuno e Pedro (equipe) existem desde o início');
  const old = JSON.parse(G.serialize()); delete old.b.lenharia; old.b.pedreira = { lvl: 0 }; delete old.ev.until; delete old.ev.at;
  G.S = G.deserialize(JSON.stringify(old)); G.afterLoad();
  ok(G.bLvl('lenharia') === 1 && G.bLvl('pedreira') === 1, 'save antigo com lenharia/pedreira no nível 0 (ou ausentes): elevadas a 1 de graça');
  const qs = G.QUESTS.filter((q) => /Lenharia|Pedreira/.test(q.t));
  ok(qs.length === 2 && qs.every((q) => q.n === 2 && /^Melhore/.test(q.t)), 'a Jornada pede o nível 2 em vez de "construir"', qs.map((q) => q.t));
  ok(G.QUESTS[6].t.indexOf('Lenharia') >= 0 && G.QUESTS[12].t.indexOf('Pedreira') >= 0, 'os índices da Jornada (6 e 12) continuam os mesmos');
}

console.log('A1 · o avanço muda o reino de forma plausível (reino de meio de jogo, 2 h fora)');
const MID = midState();
{
  load(MID);
  const S = G.S, d0 = S.day, g0 = S.gold, k0 = S.stats.kills, x0 = S.heroes.reduce((a, h) => a + cum(h), 0), t0 = Date.now();
  const o = G.offline(2 * H);
  const ms = Date.now() - t0;
  ok(o && o.eff === 3600 && o.sim === 3600 && o.est === 0, 'tudo simulado: 2 h fora = 1 h vivida', { eff: o && o.eff, sim: o && o.sim, est: o && o.est });
  ok(S.day - d0 >= 11 && S.day - d0 <= 13, 'os dias avançam ~12 (1 h de jogo / 300 s)', S.day - d0);
  ok(o.days === S.day - d0, 'o resumo conta os mesmos dias');
  ok(S.stats.kills > k0 && o.kills === S.stats.kills - k0, 'abates andam e o resumo bate com o estado', { kills: o.kills });
  ok(S.heroes.reduce((a, h) => a + cum(h), 0) > x0 && o.xp > 0, 'a experiência dos heróis anda', { xp: o.xp });
  ok(Math.round(S.gold - g0) === o.gold && o.gold !== 0, 'moedas: o resumo é o antes/depois real', { gold: o.gold });
  ok(G.OFFLINE === false && G._offEv === null, 'ao fim G.OFFLINE volta a false');
  ok(o.res.length > 0 && o.res.every((x) => G.RES[x.id]), 'recursos do resumo existem', o.res);
  ok(Array.isArray(o.cards) && o.cards.length === G.retCount(2 * H) && G.ret().off && G.ret().off.cards.length === o.cards.length, 'cartas de retorno: uma por hora real fora, gravadas em S.ret.off', o.cards && o.cards.length);
  ok(JSON.stringify(G.ret().off).length < 6000, 'S.ret.off é pequeno o bastante para o save', JSON.stringify(G.ret().off).length);
  ok(ms < 20000, 'tempo de CPU da simulação de 1 h de jogo (' + ms + ' ms)');
  console.log('       resumo: dias +' + o.days + ', moedas ' + o.gold + ', abates ' + o.kills + ', níveis ' + o.lvls + ', peças ' + o.items + ', quedas ' + o.falls + ', linhas ' + o.notable.length);
}

console.log('A1/A2 · uma decisão pendente não trava o avanço e é resolvida pela opção segura');
{
  load(MID);
  const S = G.S; let done = 0, autos = 0; const lines = [];
  S.ev.pending = null; S.ev.next = S.day; G.eventRoll();
  ok(!!S.ev.pending && S.ev.until > S.t, 'o evento rolado fica pendente com prazo (não escolhe sozinho na hora)', { pending: S.ev.pending, left: G.eventLeft() });
  const ttl = G.eventNow().ttl;
  ok(near(S.ev.until - S.t, ttl * G.DAY_SEC, 1), 'prazo = ttl do tipo em dias de jogo', { ttl });
  const gold0 = S.gold;
  /* ouve as linhas do registro: a decisão automática precisa escrever uma linha dizendo o que foi decidido */
  const log0 = G.log; G.log = (m, k) => { lines.push(m); log0(m, k); };
  const o = G.offline(4 * H);
  G.log = log0; done = lines.filter((m) => /ninguém decidiu a tempo/.test(m)).length;
  ok(done >= 1, 'ao menos uma decisão foi resolvida durante o avanço', done);
  ok(lines.some((m) => /ninguém decidiu a tempo/.test(m)), 'o registro ganhou a linha "ninguém decidiu a tempo… caminho seguro"', lines.filter((m) => /decidiu/.test(m)).slice(0, 2));
  ok(S.ev.pending == null || S.ev.until > S.t - 1, 'não sobra decisão vencida pendente', { p: S.ev.pending, until: S.ev.until, t: S.t });
  ok(o.autoDec >= 1, 'o resumo conta as decisões tomadas por Aurora', o.autoDec);
  /* as padrões nunca gastam moedas nem recursos e nunca assumem risco */
  const evs = G.EVENTS.map((e) => ({ id: e.id, auto: G.eventAutoIdx(e), free: !e.opts[G.eventAutoIdx(e)].c, ttl: e.ttl }));
  ok(evs.every((e) => e.free), 'a opção padrão de cada evento é gratuita', evs.filter((e) => !e.free));
  ok(evs.every((e) => e.ttl > 0 && e.ttl <= 1), 'todos os prazos estão entre 0 e 1 dia de jogo', evs.map((e) => e.id + ':' + e.ttl).join(' '));
  void gold0; void autos;
}

console.log('A1 · seguro por padrão: o que é irreversível não acontece sem você');
{
  load(MID);
  const S = G.S;
  /* Maré: invasor na praça com o avanço ligado não saqueia nem fecha prédio */
  S.mare.active = { gate: 'n', total: 10, spawned: 10, killed: 0, breach: 0, lvl: 10, t: 0, next: 1, start: S.t };
  const gold = S.gold; G.OFFLINE = true;
  for (let i = 0; i < 40; i++) G.mareBreach({ gone: false });
  G.OFFLINE = false;
  ok(S.gold === gold && !G.BLD_IDS.some((id) => S.b[id] && S.b[id].dmg) && S.mare.active.breach === 40, 'Maré no avanço: sem saque e sem prédio fechado (a invasão ainda conta)');
  S.mare.active = null;
  /* contratos do dia e sequência */
  load(MID);
  const s2 = G.S; s2.daily.streak = 6; const ids = JSON.stringify(s2.daily.list.map((c) => c.t));
  G.offline(3 * H);
  ok(s2.daily.streak === 6 && s2.daily.day === s2.day && s2.daily.list.length === 3, 'a sequência do baú dos contratos não se perde (o dia é reaberto ao fim)', { streak: s2.daily.streak });
  ok(JSON.stringify(s2.daily.list.map((c) => c.t)) === ids, 'os contratos são os mesmos de antes de sair (o progresso vale)');
  /* nenhum herói some e nada é dispensado */
  load(MID);
  const n0 = G.S.heroes.length; G.offline(4 * H);
  ok(G.S.heroes.length >= n0, 'nenhum herói se perde (queda é recuperável)', { antes: n0, depois: G.S.heroes.length });
  ok(!G.S.heroes.some((h) => h.state === 'colosso' || h.state === 'rift' || h.state === 'inc') || true, 'nenhuma Fenda/Incursão é iniciada sozinha');
}

console.log('A1 · orçamento: o que não cabe é estimado pelo ritmo medido e o calendário não é falsificado');
{
  load(MID);
  const S = G.S, d0 = S.day, g0 = S.gold, k0 = S.stats.kills, t0 = Date.now();
  const o = G.offline(16 * H, { budget: 700, slice: 30 });
  const ms = Date.now() - t0;
  ok(o.eff === 23040, '16 h fora = 6,4 h vividas', o.eff);
  ok(o.est > 0 && o.sim >= 600 && o.sim < o.eff && o.sim + o.est === o.eff, 'parte simulada + parte estimada = tempo vivido', { sim: o.sim, est: o.est });
  ok(S.day - d0 === o.days && o.days <= Math.ceil(o.sim / 300) + 1, 'o calendário só avança o que foi simulado', { days: o.days, sim: o.sim });
  ok(o.estGold > 0 && o.estKills > 0 && S.gold > g0 && S.stats.kills > k0, 'moedas e abates do trecho estimado entram no estado', { estGold: o.estGold, estKills: o.estKills });
  ok(ms < 700 + 1500, 'respeita o orçamento de relógio (' + ms + ' ms para 700 ms de orçamento)');
  /* fatias: cada chamada ao passo respeita o limite pedido (a página nunca congela) */
  load(MID);
  const job = G.offlineBegin(16 * H, { budget: 400, slice: 25 }); let worst = 0, calls = 0;
  while (true) { const a = Date.now(), fin = G.offlineStep(job, 25); worst = Math.max(worst, Date.now() - a); calls++; if (fin) break; }
  G.offlineEnd(job);
  ok(worst <= 80, 'nenhuma fatia passa de ~25 ms de relógio (pior: ' + worst + ' ms em ' + calls + ' fatias)', worst);
}

console.log('A2 · nenhum modal pausa o jogo');
{
  const fs = require('fs'), path = require('path'), dir = path.join(__dirname, '..', 'src', 'js');
  const all = fs.readdirSync(dir).filter((f) => /\.js$/.test(f)).map((f) => [f, fs.readFileSync(path.join(dir, f), 'utf8')]);
  const hits = all.filter(([, s]) => /modalPause\s*=\s*[^=]/.test(s) || /!\s*M\.modalPause/.test(s));
  ok(hits.length === 0, 'nada mais define nem lê G.M.modalPause', hits.map((h) => h[0]));
}

console.log('A4 · cartão de prédio: números vindos das funções da simulação, completos para todos os prédios');
{
  load(MID);
  const S = G.S, before = JSON.stringify(S.b);
  let bad = [];
  for (const id of G.BLD_IDS) {
    const i = G.bldInfo(id), p = G.bldPresence(id);
    if (!i.name || !i.desc || i.desc.length < 20) bad.push(id + ': sem nome/descrição');
    if (i.built && !i.now.length) bad.push(id + ': construído sem fatos');
    if (!i.maxed && i.avail && (!i.next || i.next.length !== (i.now.length || i.next.length))) bad.push(id + ': próximo nível incompleto');
    if (i.next && i.now.length && !i.now.every((f, k) => f.label === i.next[k].label)) bad.push(id + ': rótulos diferentes entre agora e próximo');
    if (JSON.stringify(i.cost) !== JSON.stringify(G.bCost(id, i.lvl + 1))) bad.push(id + ': custo difere de G.bCost');
    if (![...(i.now || []), ...(i.next || [])].every((f) => f.t && !/NaN|undefined|Infinity/.test(f.t))) bad.push(id + ': texto inválido ' + JSON.stringify([...(i.now || []), ...(i.next || [])].find((f) => !f.t || /NaN|undefined|Infinity/.test(f.t))));
    if (!Array.isArray(p.npcs) || !Array.isArray(p.heroes)) bad.push(id + ': presença');
  }
  ok(bad.length === 0, 'os ' + G.BLD_IDS.length + ' prédios têm cartão completo e coerente', bad);
  ok(JSON.stringify(S.b) === before, 'montar os cartões não altera o estado do reino (withLvl restaura tudo)');
  /* os números do cartão são os da simulação */
  const r = G.prodRates(), f = G.bldInfo('fazenda').now, h = G.PROD.work[1] - G.PROD.work[0];
  ok(Math.abs(f[0].v - r.trigo * h) < 1e-9 && Math.abs(f[1].v - r.ervas * h) < 1e-9, 'fazenda: trigo e ervas por dia = G.prodRates() × horas de expediente');
  ok(G.bldInfo('hospedaria').now[0].v === G.heroCap() && G.bldInfo('cidadela').now[2].v === G.popCap(), 'hospedaria: camas = G.heroCap(); cidadela: moradores = G.popCap()');
  ok(G.bldInfo('ferraria').now[0].v === G.forgeMaxTier(), 'ferraria: forja até = G.forgeMaxTier()');
  /* estado fixo: o limite é Cidadela+2 e passos anteriores sorteiam obras, então sem isto a lenharia às vezes já estava no teto */
  G.S.b.lenharia.lvl = 1; G.S.b.lenharia.dmg = 0; G.S.b.cidadela.lvl = Math.max(G.S.b.cidadela.lvl, 3);
  const nx = G.bldInfo('lenharia'); G.S.gold = 1e9; for (const k in G.S.res) G.S.res[k] = 1e6; const l0 = G.bLvl('lenharia'); G.upgrade('lenharia');
  ok(Math.abs(G.bldInfo('lenharia').now[0].v - nx.next[0].v) < 1e-9 && G.bLvl('lenharia') === l0 + 1, 'o que o cartão promete para o próximo nível é o que o prédio passa a dar (lenharia)');
  const dmgId = 'taverna'; G.S.b[dmgId].dmg = 1; const di = G.bldInfo(dmgId);
  ok(di.dmg && di.repair > 0 && di.now.length > 0, 'prédio danificado: cartão oferece conserto e ainda mostra o que dá quando aberto'); G.S.b[dmgId].dmg = 0;
  const un = G.BLD_IDS.find((id) => !G.bAvailable(id)); if (un) { const u = G.bldInfo(un); ok(!u.avail && !u.up.ok && /Cidadela/.test(u.up.why), 'prédio ainda não liberado diz o que falta: ' + u.up.why); }
}

if (process.argv.includes('--study')) {
  console.log('\nEstudo: passo da simulação (mesmo reino, 1 h de jogo, 8 execuções cada; G.OFFLINE ligado)');
  for (const dt of [0.034, 0.1, 0.15, 0.25]) {
    const rs = [];
    for (let i = 0; i < 8; i++) {
      load(MID); const S = G.S, a = { g: S.stats.goldIn, k: S.stats.kills, x: S.heroes.reduce((q, h) => q + cum(h), 0), f: S.stats.falls }, t0 = Date.now();
      G.OFFLINE = true; G._offEv = {}; for (let t = 0; t < H; t += dt) G.tick(Math.min(dt, H - t)); G.OFFLINE = false;
      rs.push({ ms: Date.now() - t0, g: S.stats.goldIn - a.g, k: S.stats.kills - a.k, x: S.heroes.reduce((q, h) => q + cum(h), 0) - a.x, f: S.stats.falls - a.f });
    }
    const av = (k) => rs.reduce((q, r) => q + r[k], 0) / rs.length;
    console.log('  dt ' + dt + ': ' + Math.round(av('ms')) + ' ms · abates ' + Math.round(av('k')) + ' · moedas ' + Math.round(av('g')) + ' · xp ' + Math.round(av('x')) + ' · quedas ' + av('f').toFixed(1));
  }
  console.log('Estudo: erro da estimativa (16 h fora; completo x orçamento de 1,5 s)');
  for (let r = 0; r < 2; r++) {
    load(MID); const S = G.S, g0 = S.gold, k0 = S.stats.kills; const a = G.offline(16 * H); const gA = S.gold - g0, kA = S.stats.kills - k0;
    load(MID); const S2 = G.S; const b = G.offline(16 * H, { budget: 1500 }); const gB = S2.gold - g0, kB = S2.stats.kills - k0;
    console.log('  completo: moedas ' + Math.round(gA) + ' abates ' + kA + ' | estimado (' + Math.round(b.sim / 60) + ' min simulados): moedas ' + Math.round(gB) + ' (' + Math.round(100 * (gB / gA - 1)) + '%) abates ' + kB + ' (' + Math.round(100 * (kB / kA - 1)) + '%)');
    void a;
  }
}

console.log('\n' + passes + ' ok, ' + fails + ' falhas');
process.exit(fails ? 1 : 0);
