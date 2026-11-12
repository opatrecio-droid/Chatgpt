/* 3A-lendas: v26 — Livro de Feitos, Títulos, Herói do Dia, Poder do Reino, Recordes e Marcos de poder.
   Só simulação (sem DOM): as telas ficam em 66-ui-lendas.js. Estado: h.feitos em cada herói (salvo junto com o herói) e S.lendas
   (inicialização preguiçosa: saves antigos continuam valendo). Tudo entra por ganchos (wrappers) e eventos; os contadores são O(1) por
   evento, sem laço novo por herói. Eventos novos: 'titulo' { h, t, auto, set }, 'hod' (Herói do Dia), 'recorde' { key, r }, 'pmark' { i, v, rw }. */
'use strict';
(function () {
  /* ajustes de equilíbrio num só lugar */
  G.LENDAS = {
    wHero: 2.3,        // Poder do Reino: peso do poder de cada herói (o mesmo poder usado na Arena)
    wBld: 18,          // ... por nível de construção (a Cidadela vale o triplo)
    wBless: 22,        // ... por nível de bênção
    wWork: 16,         // ... por nível de obra pública
    tl: 40,            // marcos guardados na linha do tempo de cada herói (a ficha mostra os 10 mais recentes)
    hodXp: 0.3,        // prêmio do Herói do Dia: fração do nível atual em experiência
  };

  /* ================= estado ================= */
  const lDef = () => ({ v: 1, rec: {}, ann: {}, annAny: -999, pw: { v: 0, max: 0, n: 0, init: 0, back: 0, at: [] }, gd: 0, hod: null, hh: [], boot: 0, hint: 0, seen: 0 });
  G.lendas = () => {
    const S = G.S, l = S.lendas || (S.lendas = {}), d = lDef();
    for (const k in d) if (l[k] === undefined) l[k] = d[k];
    return l;
  };
  const ftNew = () => ({ v: 1, el: 0, bs: 0, bk: {}, mh: 0, rl: 0, dw: 0, dp: 0, sq: 0, sm: 0, fl: 0, sp: 0, dm: 0, hd: 0, tl: [], ti: {}, ts: '', dia: { n: 0, k0: 0, el: 0, bs: 0, g: 0, dw: 0, bn: '' } });
  const daysOf = (h) => Math.max(1, G.S.day - (h.born || 1) + 1);
  G.heroDays = daysOf;

  /* artigos para os nomes (o jogo fala "derrubou a Hidra da Fenda", "venceu a Liga do Cobre", "diante do Lobo Cinzento") */
  const FEM = { aranha: 1, quimera: 1, vespa: 1, harpia: 1, salamandra: 1, hidra: 1, brumas: 1 };
  const ART_R = { Baronia: 'a', Marca: 'a', Condado: 'o', Ducado: 'o', Senhorio: 'o', Reino: 'o', Ordem: 'a', 'Clã': 'o', Coroa: 'a', Protetorado: 'o', Liga: 'a', Cidadela: 'a', Irmandade: 'a', Principado: 'o', Guilda: 'a' };
  const monArt = (k) => (FEM[k] ? 'a ' : 'o ') + G.MON[k].name;
  const monDe = (k) => (FEM[k] ? 'da ' : 'do ') + G.MON[k].name;
  const monAo = (k) => (FEM[k] ? 'à ' : 'ao ') + G.MON[k].name;
  const rivArt = (n) => (ART_R[String(n).split(' ')[0]] || 'o') + ' ' + n;

  /* linha do tempo: { d: dia, t: texto } */
  const mark = (h, t, f, day) => {
    f = f || G.feitos(h);
    f.tl.push({ d: day || G.S.day, t });
    if (f.tl.length > G.LENDAS.tl) f.tl.splice(0, f.tl.length - G.LENDAS.tl);
  };
  G.heroMark = mark;

  /* ================= títulos ================= */
  const T = (id, name, ev, need, cur, p, d, o) => Object.assign({ id, name, ev, need, cur, p, d }, o || {});
  const bk = (k) => (h, f) => f.bk[k] || 0;
  G.TITLES = [
    T('calejada', 'Mão Calejada', 'k', 100, (h) => h.kills, { atk: 0.02 }, 'Abata 100 monstros.'),
    T('ceifador', 'Ceifador', 'k', 600, (h) => h.kills, { atk: 0.02, aspd: 0.02 }, 'Abata 600 monstros.'),
    T('flagelo', 'Flagelo da Fenda', 'k', 2500, (h) => h.kills, { atk: 0.04, crit: 0.01 }, 'Abata 2.500 monstros.'),
    T('cacaelite', 'Caça-Elites', 'e', 10, (h, f) => f.el, { elite: 0.04 }, 'Abata 10 elites.'),
    T('terror', 'Terror das Elites', 'e', 60, (h, f) => f.el, { elite: 0.05 }, 'Abata 60 elites.'),
    T('hidras', 'Matador de Hidras', 'b', 2, bk('hidra'), { atk: 0.03 }, 'Participe da queda da Hidra da Fenda 2 vezes.'),
    T('lobos', 'Quebra-Matilha', 'b', 3, bk('anciao'), { spd: 0.04 }, 'Participe da queda do Ancião da Matilha 3 vezes.'),
    T('lich', 'Algoz do Lich', 'b', 2, bk('lich'), { cdr: 0.04 }, 'Participe da queda do Lich de Ocre 2 vezes.'),
    T('brumas', 'Domador de Brumas', 'b', 2, bk('brumas'), { eva: 0.03 }, 'Participe da queda da Mãe das Brumas 2 vezes.'),
    T('wyrm', 'Quebra-Gelo', 'b', 2, bk('wyrm'), { def: 0.04 }, 'Participe da queda do Wyrm Glacial 2 vezes.'),
    T('dragao', 'Mata-Dragões', 'b', 2, bk('dragao'), { atk: 0.03, hp: 0.02 }, 'Participe da queda do Dragão das Cinzas 2 vezes.'),
    T('cacachefes', 'Caçador de Chefes', 'b', 12, (h, f) => f.bs, { hp: 0.05 }, 'Participe da queda de 12 chefes.'),
    T('sobrevivente', 'Sobrevivente', 'f', 3, (h) => h.falls, { hp: 0.03 }, 'Caia em combate 3 vezes e volte para a luta.'),
    T('cascagrossa', 'Casca-Grossa', 'f', 12, (h) => h.falls, { def: 0.05 }, 'Caia em combate 12 vezes e volte para a luta.'),
    T('maodeouro', 'Mão de Ouro', 's', 1500, (h, f) => f.sp, { gold: 0.04 }, 'Gaste 1.500 moedas na cidade.'),
    T('fregues', 'Freguês de Honra', 's', 25000, (h, f) => f.sp, { gold: 0.05 }, 'Gaste 25.000 moedas na cidade.'),
    T('lamina', 'Lâmina da Arena', 'd', 5, (h, f) => f.dw, { crit: 0.02 }, 'Vença 5 duelos na Arena das Duas Luas.'),
    T('campeao', 'Campeão das Duas Luas', 'd', 25, (h, f) => f.dw, { atk: 0.03, aspd: 0.02 }, 'Vença 25 duelos na Arena das Duas Luas.'),
    T('imparavel', 'Imparável', 'q', 5, (h, f) => f.sm, { eva: 0.03, aspd: 0.02 }, 'Vença 5 duelos seguidos na Arena, sem uma derrota.'),
    T('andarilho', 'Andarilho da Fenda', 'r', 3, (h, f) => f.fl, { spd: 0.04 }, 'Ajude a vencer o andar 3 da Fenda Infinita.'),
    T('senhor', 'Senhor da Fenda', 'r', 10, (h, f) => f.fl, { hp: 0.03, atk: 0.02 }, 'Ajude a vencer o andar 10 da Fenda Infinita.'),
    T('reliquias', 'Mestre das Relíquias', 'l', 2, (h, f) => f.rl, { drop: 0.05 }, 'Traga 2 relíquias de chefes.'),
    T('veterano', 'Veterano', 't', 8, (h) => daysOf(h), { xp: 0.03 }, 'Sirva a Aurora por 8 dias.'),
    T('decano', 'Decano de Aurora', 't', 40, (h) => daysOf(h), { hp: 0.02, def: 0.03 }, 'Sirva a Aurora por 40 dias.'),
    T('maopesada', 'Mão Pesada', 'm', 600, (h, f) => f.mh, { crit: 0.02, critDmg: 0.03 }, 'Desfira um único golpe de 600 de dano.'),
    T('montanhas', 'Quebra-Montanhas', 'm', 6000, (h, f) => f.mh, { critDmg: 0.05 }, 'Desfira um único golpe de 6.000 de dano.'),
    T('renascido', 'Renascido', 'x', 1, (h) => h.stars || 0, { xp: 0.05 }, 'Renasça sob as Duas Luas.'),
    T('eleito', 'Eleito da Guilda', 'x', 4, (h) => h.rank, { def: 0.03, hp: 0.02 }, 'Alcance o Rank A.'),
    T('estrela', 'Estrela do Dia', 'h', 3, (h, f) => f.hd, { mood: 0.05 }, 'Seja o Herói do Dia 3 vezes.'),
    /* da Arena: concedidos ao fim de uma temporada em Diamante ou Lenda, à equipe que lutou */
    T('arena_diamante', 'Campeão de Diamante', null, 1, () => 0, { atk: 0.03, def: 0.02 }, 'Esteja na equipe da Arena quando a temporada terminar em Diamante.', { manual: 1 }),
    T('arena_lenda', 'Lenda das Duas Luas', null, 1, () => 0, { atk: 0.04, hp: 0.03 }, 'Esteja na equipe da Arena quando a temporada terminar na Lenda das Luas.', { manual: 1 }),
    /* lote 3-B: concedidos por 3D-rivais.js (G.titleGrant) */
    T('vingador', 'Vingador', null, 1, () => 0, { atk: 0.03, crit: 0.01 }, 'Esteja na equipe que vence a revanche contra o seu Nêmesis na Arena.', { manual: 1 }),
    T('irmao', 'Irmão de Armas', null, 1, () => 0, { def: 0.02, hp: 0.02 }, 'Alcance o laço de Irmãos de Armas com outro herói.', { manual: 1 }),
  ];
  const TBY = {}, TBYEV = {};
  for (const t of G.TITLES) { TBY[t.id] = t; if (t.ev) (TBYEV[t.ev] || (TBYEV[t.ev] = [])).push(t); }
  G.titleDef = (id) => TBY[id] || null;
  G.titleOf = (h) => { const f = h.feitos; return f && f.ts ? TBY[f.ts] || null : null; };
  G.titleHas = (h, id) => !!(h.feitos && h.feitos.ti[id]);
  G.titleProgress = (h, t) => { const f = G.feitos(h), have = !!f.ti[t.id], cur = t.manual ? (have ? 1 : 0) : t.cur(h, f); return { have, cur: Math.min(cur, t.need), need: t.need, pct: have ? 100 : Math.floor(100 * Math.min(1, cur / t.need)) }; };
  G.titleSet = (h, id) => {
    const f = G.feitos(h); if (id && !f.ti[id]) return false;
    f.ts = id || ''; h._dirty = true; G.emit('titulo', { h, set: true });
    return true;
  };
  G.titleCount = (h) => Object.keys(G.feitos(h).ti).length;
  const unlock = (h, f, t, silent) => {
    const S = G.S; f.ti[t.id] = S.day; S.stats.titles = (S.stats.titles || 0) + 1;
    const auto = !f.ts; if (auto) { f.ts = t.id; h._dirty = true; }
    if (silent) return;
    mark(h, 'ganhou o título ' + t.name, f);
    G.log(h.name + ' ganhou o título «' + t.name + '».', 'good');
    G.toast(h.name + ' ganhou o título «' + t.name + '»', 'epic', 'trophy'); G.sfx('titulo');
    const L = G.lendas(); if (!L.hint) { L.hint = 1; G.toast('Heróis › Feitos: o Livro de Feitos e a escolha do título.', 'info', 'book'); }
    G.emit('titulo', { h, t, auto });
  };
  /* confere só os títulos do tipo de evento que mudou (kills, elites, chefes…) */
  const titleCheck = (h, ev, silent) => {
    const list = TBYEV[ev]; if (!list) return 0;
    const f = h.feitos; let n = 0;
    for (let i = 0; i < list.length; i++) { const t = list[i]; if (f.ti[t.id]) continue; if (t.cur(h, f) >= t.need) { unlock(h, f, t, silent); n++; } }
    return n;
  };
  G.titleCheck = titleCheck;
  /* concede por código um título manual (lote 3-B: Vingador e Irmão de Armas); devolve false se já tinha */
  G.titleGrant = (h, id) => { const t = TBY[id]; if (!t) return false; const f = G.feitos(h); if (f.ti[t.id]) return false; unlock(h, f, t, false); return true; };

  /* ================= feitos do herói ================= */
  /* herói de save antigo: preenche o que dá com os números que já existiam (abates, quedas, dia em que chegou) */
  const boot = (h, f) => {
    const S = G.S, kills = h.kills || 0, sh = Math.min(1, kills / Math.max(1, S.stats.kills || 0));
    f.el = Math.round((S.stats.elites || 0) * sh);
    f.bs = Math.min(S.stats.bosses || 0, Math.round((S.stats.bosses || 0) * sh * 2));
    f.sp = Math.round(kills * 2.4 * G.PM(Math.max(1, (h.lvl || 1) * 0.7)) * 0.5);   // estimativa: o que a bolsa deixou na cidade
    f.tl.push({ d: h.born || 1, t: 'chegou a Aurora' });
    if (kills >= 20) f.tl.push({ d: S.day, t: 'o Livro de Feitos registrou ' + G.fmt(kills) + ' abates e ' + (h.falls || 0) + (h.falls === 1 ? ' queda' : ' quedas') + ' até aqui' });
  };
  G.feitos = (h) => { let f = h.feitos; if (!f) { f = h.feitos = ftNew(); boot(h, f); } return f; };
  /* contadores do dia (para o Herói do Dia) */
  const dayOf = (h, f) => { let d = f.dia; if (d.n !== G.S.day) d = f.dia = { n: G.S.day, k0: h.kills || 0, el: 0, bs: 0, g: 0, dw: 0, bn: '' }; return d; };

  /* ================= recordes ================= */
  G.RECS = {
    hit:  { name: 'Maior golpe', icon: 'sword', warm: 300, cd: 420, min: 1.10 },
    gd:   { name: 'Mais moedas em um dia', icon: 'coin', warm: 600, cd: 900, min: 1.03 },
    kd:   { name: 'Mais abates em um dia', icon: 'skull', warm: 600, cd: 900, min: 1.03 },
    item: { name: 'Peça mais forte', icon: 'anvil', warm: 420, cd: 600, min: 1.05 },
    rift: { name: 'Maior andar da Fenda', icon: 'portal', warm: 0, cd: 0, min: 1 },
    seq:  { name: 'Maior sequência de duelos', icon: 'trophy', warm: 0, cd: 0, min: 1 },
  };
  G.RECS_ORDER = ['hit', 'kd', 'gd', 'item', 'rift', 'seq'];
  G.recText = (key, r) => {
    if (!r) return '—';
    switch (key) {
      case 'hit': return G.fmt(r.v) + ' de dano';
      case 'gd': return G.fmt(r.v) + ' moedas';
      case 'kd': return G.fmt(r.v) + ' abates';
      case 'item': return r.n || 'Peça';
      case 'rift': return 'Andar ' + r.v;
      case 'seq': return r.v + (r.v === 1 ? ' vitória seguida' : ' vitórias seguidas');
    }
    return String(r.v);
  };
  const recSet = (key, v, who, extra) => {
    const S = G.S, L = G.lendas(), d = G.RECS[key], r = L.rec[key];
    if (!(v > (r ? r.v : 0))) return false;
    const old = r ? r.v : 0;
    L.rec[key] = Object.assign({ v, w: who || '', d: S.day }, extra || {});
    if (old > 0 && v >= old * d.min && S.stats.played >= d.warm && S.t - (L.ann[key] == null ? -1e9 : L.ann[key]) >= d.cd && S.t - L.annAny >= 20) {
      L.ann[key] = L.annAny = S.t;
      const rr = L.rec[key];
      G.log('Novo recorde! ' + d.name + ': ' + G.recText(key, rr) + (rr.w ? ' (' + rr.w + ')' : '') + '.', 'good');
      G.toast('Novo recorde! ' + d.name + ': ' + G.recText(key, rr), 'epic', 'trophy'); G.sfx('recorde');
      G.emit('recorde', { key, r: rr });
    }
    return true;
  };
  G.recSet = recSet;
  /* a peça mais forte do reino (equipada ou no armazém), de tempos em tempos */
  const gearScan = () => {
    const S = G.S; let best = null, bs = 0, who = '';
    for (const h of S.heroes) for (const k in h.gear) { const it = h.gear[k]; if (!it) continue; const s = G.itemScore(it); if (s > bs) { bs = s; best = it; who = h.name; } }
    for (const it of S.inv) { const s = G.itemScore(it); if (s > bs) { bs = s; best = it; who = ''; } }
    if (best) recSet('item', Math.round(bs), who, { n: G.itemName(best), rar: best.rar });
  };

  /* ================= Poder do Reino ================= */
  G.POWER_MARKS = [1000, 2500, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 65000, 80000, 100000, 125000, 150000, 200000, 250000, 300000, 400000, 500000, 650000, 800000, 1000000, 1250000, 1500000, 2000000, 2500000, 3000000, 4000000, 5000000, 7500000, 10000000];
  G.fmtFull = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');   // 20.000 (os marcos aparecem por extenso)
  G.powerMark = (i) => {
    const M = G.POWER_MARKS; if (i < M.length) return M[i];
    let v = M[M.length - 1]; for (let k = M.length; k <= i; k++) v = Math.round(v * 1.6 / 100000) * 100000; return v;
  };
  G.powerPrize = (i) => ({ nucleos: i % 2 === 0 ? 1 + Math.floor(i / 6) : 0, selos: i % 2 === 1 ? 1 + Math.floor(i / 5) : 0, po: 3 + 2 * i });
  let pc = null;
  /* partes do poder: heróis (mesma conta do poder da Arena), construções, bênçãos e obras públicas */
  G.kingPowerParts = (fresh) => {
    const S = G.S, W = G.LENDAS;
    if (!fresh && pc && pc.s === S && Math.abs(S.t - pc.t) < 0.5) return pc.p;
    let hp = 0; for (const h of S.heroes) hp += G.arenaHeroPow ? G.arenaHeroPow(h) : G.heroStats(h).atk;
    let b = 0; for (const id of G.BLD_IDS) b += G.bLvl(id) * (id === 'cidadela' ? 3 : 1);
    let bs = 0; for (const k in S.bless) bs += S.bless[k] || 0;
    let wk = 0; if (S.works) for (const k in S.works) wk += S.works[k] || 0;
    const p = { h: Math.round(hp * W.wHero), b: Math.round(b * W.wBld), s: Math.round(bs * W.wBless), w: Math.round(wk * W.wWork) };
    p.t = p.h + p.b + p.s + p.w;
    pc = { s: S, t: S.t, p };
    return p;
  };
  G.kingPower = (fresh) => G.kingPowerParts(fresh).t;
  /* próximo marco: { i, v, from, pct } */
  G.nextPowerMark = () => {
    const pw = G.lendas().pw, i = pw.n, v = G.powerMark(i), from = i ? G.powerMark(i - 1) : 0, P = G.kingPower();
    return { i, v, from, pct: Math.max(0, Math.min(1, (P - from) / (v - from))), rw: G.powerPrize(i) };
  };
  const powerTick = () => {
    const S = G.S, L = G.lendas(), pw = L.pw, P = G.kingPower(true);
    pw.v = P;
    if (!pw.init) { pw.init = 1; let n = 0; while (P >= G.powerMark(n)) n++; pw.n = pw.back = n; pw.max = P; return; }   // save antigo: marcos já alcançados não repetem a cerimônia
    if (P > pw.max) pw.max = P;
    while (pw.max >= G.powerMark(pw.n)) {
      const i = pw.n, rw = G.powerPrize(i), v = G.powerMark(i);
      pw.n++; pw.at.push([i, S.day]); if (pw.at.length > 60) pw.at.shift();
      if (rw.nucleos) S.nucleos += rw.nucleos; if (rw.selos) S.selos += rw.selos; if (rw.po) G.addRes('po_reforja', rw.po);
      G.log('Poder do Reino chegou a ' + G.fmtFull(v) + '! O reino cresce.', 'good'); G.sfx('marco');
      G.emit('pmark', { i, v, rw });
    }
  };

  /* ================= Herói do Dia ================= */
  const HOD_W = { k: 1.0, g: 1.0, el: 1.7, dw: 2.2, bs: 3.2 };
  const HOD_RARE = { k: 1, g: 1.05, el: 1.15, dw: 1.2, bs: 1.4 };
  const HOD_LINES = {
    k: ['Hoje os monstros me viram chegar de longe.', 'Perdi a conta lá pelo meio da tarde. Que o Livro conte por mim.', 'Cada um tem seu ofício. O meu, hoje, foi barulhento.', 'Se sobrou algum slime, foi por educação.', 'Descansar? Só depois que a segunda lua subir.', 'A estrada ficou mais limpa, e eu mais cansado do que admito.'],
    el: ['Disseram que elite não cai. Caíram.', 'Foi só um brilho diferente no pelo. Eu gosto de brilho.', 'Os grandes me acham pelo cheiro de coragem.', 'Elite é só um monstro com mais opinião.', 'Deixei o bando sem líder. Ele que se arrume.'],
    bs: ['Era enorme. Era. Já não é.', 'Pergunte {b}: o meu nome já não é estranho por lá.', 'Os guardas que contem a história; eu estava ocupado demais.', 'A Fenda tem medo de quem não pisca. Eu pisquei uma vez só.', 'Vou dormir como quem acabou de fechar uma porta grande.'],
    g: ['A bolsa pesou mais que o dia, e o dia foi comprido.', 'Moeda boa é a que gira. A minha girou bastante.', 'A cidade que agradeça: o cofre vai sorrir amanhã.', 'Cada moeda tem uma história. Hoje juntei muitas.', 'Se o Mercado abrir cedo, eu já estou na porta.'],
    dw: ['A Arena tem plateia de duas luas e eu não decepciono.', 'Ecos de luz, mão de verdade.', 'Não ganhei sozinho, mas ganhei com vontade.', 'Do outro lado havia brasão e orgulho. Voltei com os dois.', 'A multidão gritou o nome de Aurora. Foi bonito.'],
  };
  const HOD_CLS = {
    esp: ['A lâmina canta quando eu não falo.', 'Espada é conversa curta.'],
    cav: ['Quem fica na frente aprende a gostar do vento.', 'O escudo levou a fama; eu fico com o cansaço.'],
    arq: ['Mirei na lua e acertei o que estava embaixo.', 'Uma flecha, um recado, nenhuma pressa.'],
    mag: ['A magia obedeceu. Hoje estava de bom humor.', 'Calculei duas vezes e fiz fogo só uma.'],
    pal: ['A luz decidiu quem ia para casa. Eu só segurei a porta.', 'Cuidei de todos. Alguém tem que cuidar do cuidador?'],
    lad: ['Ninguém me viu. Foi proposital.', 'O que eu levo, levo de volta pra Aurora. Quase sempre.'],
  };
  const pickHod = () => {
    const S = G.S, L = G.lendas(), hs = S.heroes; if (!hs.length) return null;
    const rows = hs.map((h) => { const f = G.feitos(h), d = dayOf(h, f); return { h, f, d, k: Math.max(0, (h.kills || 0) - d.k0), el: d.el, bs: d.bs, g: Math.round(d.g), dw: d.dw }; });
    const tot = { k: 0, g: 0, el: 0, dw: 0, bs: 0 };
    for (const r of rows) for (const c in tot) tot[c] += r[c];
    if (tot.k < 6) return null;
    let best = null;
    for (const r of rows) {
      if (r.k < 3 && !r.dw && !r.bs) continue;
      let sc = 0, why = 'k', wv = 0;
      for (const c in HOD_W) { if (!tot[c] || !r[c]) continue; const v = HOD_W[c] * r[c] / tot[c]; sc += v; if (v * HOD_RARE[c] > wv) { wv = v * HOD_RARE[c]; why = c; } }
      sc *= Math.pow(0.82, L.hh.slice(-3).filter((id) => id === r.h.id).length);
      if (!best || sc > best.sc) best = { r, sc, why };
    }
    return best;
  };
  const hodWhy = (why, r) => {
    switch (why) {
      case 'bs': return r.d.bn ? 'derrubou ' + monArt(r.d.bn) : 'ajudou a derrubar um chefe';
      case 'el': return 'abateu ' + r.el + (r.el === 1 ? ' elite' : ' elites');
      case 'dw': return 'venceu ' + r.dw + (r.dw === 1 ? ' duelo' : ' duelos') + ' na Arena';
      case 'g': return 'trouxe ' + G.fmt(r.g) + ' moedas para a bolsa';
      default: return 'foi quem mais abateu monstros: ' + r.k + ' abates';
    }
  };
  const applyHod = (best) => {
    const S = G.S, L = G.lendas(), r = best.r, h = r.h, f = r.f, why = best.why;
    const rng = G.seeded(G.hash('hod|' + S.day + '|' + h.id));
    const pool = HOD_LINES[why].concat(HOD_CLS[h.cls] || []);
    let q = pool[Math.floor(rng() * pool.length)];
    q = q.replace('{b}', r.d.bn ? monAo(r.d.bn) : 'ao chefe');
    const xp = Math.max(1, Math.round(G.xpNeed(h.lvl) * G.LENDAS.hodXp));
    G.giveXp(h, xp); h.animo = 100;
    f.hd++;
    const txt = hodWhy(why, r);
    mark(h, 'foi o Herói do Dia: ' + txt, f, S.day);
    L.hh.push(h.id); if (L.hh.length > 8) L.hh.shift();
    const lk = { cls: h.cls, look: Object.assign({}, h.look), rank: h.rank, gear: { arma: h.gear.arma ? { tier: h.gear.arma.tier } : null, armadura: h.gear.armadura ? { tier: h.gear.armadura.tier } : null }, cos: { traje: h.cos ? h.cos.traje : null } };
    L.hod = { d: S.day, id: h.id, name: h.name, cls: h.cls, rar: h.rar, why, txt, q, xp, st: { k: r.k, el: r.el, bs: r.bs, g: r.g, dw: r.dw }, ti: f.ts || '', lk };
    G.log('Herói do Dia: ' + h.name + ' ' + txt + '.', 'good');
    G.emit('hod', L.hod);
    titleCheck(h, 'h');
  };

  /* ================= ganchos ================= */
  /* abates, elites e chefes */
  const KM = [100, 500, 1000, 2500, 5000, 10000];
  const km0 = G.killMon;
  G.killMon = (m, h) => {
    if (m.dead || !h) return km0(m, h);
    const S = G.S, f = G.feitos(h), d = dayOf(h, f), g0 = h.gold;
    km0(m, h);
    d.g += Math.max(0, h.gold - g0);
    if (m.elite) { f.el++; d.el++; if (f.el === 1) mark(h, 'abateu a primeira elite', f); titleCheck(h, 'e'); }
    if (m.boss) {
      const nm = monArt(m.k), key = m.k;
      for (const hh of S.heroes) {
        if (hh !== h && !(m.hitBy[hh.id] && hh.state !== 'fallen')) continue;
        const ff = G.feitos(hh), dd = dayOf(hh, ff);
        ff.bs++; ff.bk[key] = (ff.bk[key] || 0) + 1; dd.bs++; dd.bn = key;
        mark(hh, (hh === h ? 'derrubou ' : 'ajudou a derrubar ') + nm, ff);
        titleCheck(hh, 'b');
      }
    }
    const k = h.kills;
    if (k >= 100 && KM.indexOf(k) >= 0) mark(h, 'chegou a ' + G.fmt(k) + ' abates', f);
    titleCheck(h, 'k');
    const kd = S.rep.today.kills || 0, r = S.lendas && S.lendas.rec.kd;
    if (kd > (r ? r.v : 0)) recSet('kd', kd, '');
  };

  /* maior golpe */
  const HITM = [250, 1000, 5000, 20000, 100000, 500000];
  let hitBest = 0;
  const dm1 = G.dmgToMon;
  G.dmgToMon = (h, m, mult, forceCrit, o) => {
    const d = dm1(h, m, mult, forceCrit, o);
    if (d > 0) {
      const f = h.feitos || G.feitos(h);
      if (d > f.mh) {
        const old = f.mh; f.mh = d;
        for (let i = 0; i < HITM.length; i++) if (old < HITM[i] && d >= HITM[i]) { mark(h, 'desferiu um golpe de ' + G.fmt(d), f); break; }
        titleCheck(h, 'm');
      }
      if (d > hitBest) { hitBest = d; recSet('hit', d, h.name); }
    }
    return d;
  };

  /* quedas */
  const hf0 = G.heroFall;
  G.heroFall = (h, m) => {
    const r = hf0(h, m);
    if (r) { const f = G.feitos(h); mark(h, 'caiu em combate diante ' + (m && G.MON[m.k] ? monDe(m.k) : 'de um inimigo'), f); titleCheck(h, 'f'); }
    return r;
  };

  /* promoção e renascimento */
  const pr0 = G.promote;
  G.promote = (h) => { const ok = pr0(h); if (ok) { mark(h, 'promovido a Rank ' + G.RANKS[h.rank]); titleCheck(h, 'x'); } return ok; };
  const rb0 = G.rebirth;
  G.rebirth = (h) => { const ok = rb0(h); if (ok) { mark(h, 'renasceu sob as Duas Luas (Estrela ' + h.stars + ')'); titleCheck(h, 'x'); } return ok; };

  /* relíquias de chefes */
  const rr0 = G.relicRoll;
  G.relicRoll = (zoneId, h) => {
    const r = rr0(zoneId, h);
    if (r && h) { const f = G.feitos(h), id = G.COS_IDS.find((k) => G.COS[k].boss === zoneId); f.rl++; mark(h, 'trouxe a relíquia ' + (id ? G.COS[id].name : 'de um chefe'), f); titleCheck(h, 'l'); }
    return r;
  };

  /* Fenda Infinita: quem estava na expedição leva o andar */
  const rw0 = G.riftWin;
  G.riftWin = () => {
    const S = G.S, r = S.rift.run, fl = r ? r.floor : 0, party = r ? S.heroes.filter((h) => r.ids.indexOf(h.id) >= 0 && h.state === 'rift') : [];
    rw0();
    if (!fl) return;
    for (const h of party) { const f = G.feitos(h); if (fl > f.fl) f.fl = fl; mark(h, 'venceu o andar ' + fl + ' da Fenda Infinita', f); titleCheck(h, 'r'); }
    recSet('rift', S.rift.best, party.map((h) => h.name).slice(0, 3).join(', '));
  };

  /* duelos da Arena */
  G.on('duelo', (d) => {
    const S = G.S, rv = d.rival ? rivArt(d.rival.name) : 'o rival';
    for (const id of d.ids) {
      const h = S.heroes.find((x) => x.id === id); if (!h) continue;
      const f = G.feitos(h); f.dp++;
      if (d.win) {
        f.dw++; f.sq++; if (f.sq > f.sm) f.sm = f.sq; dayOf(h, f).dw++;
        if (f.dw === 1) mark(h, 'venceu o primeiro duelo na Arena, contra ' + rv, f);
        else if (d.mvp && d.mvp.name === h.name && f.dm !== S.day) { f.dm = S.day; mark(h, 'venceu ' + rv + ' na Arena', f); }
      } else f.sq = 0;
      titleCheck(h, 'd'); titleCheck(h, 'q');
    }
    if (d.win) recSet('seq', d.streak, '');
  });
  /* títulos exclusivos da Arena: a equipe que lutou os recebe quando a temporada fecha em Diamante ou Lenda */
  G.on('arena', (d) => {
    if (d.t !== 'season' || !d.rec || !d.rec.titulo) return;
    const S = G.S, a = G.arena(), lg = G.ARENA_LEAGUES[d.rec.liga], t = lg && TBY['arena_' + lg.id];
    if (!t) return;
    for (const x of a.team || []) { const h = S.heroes.find((q) => q.id === x.id); if (!h) continue; const f = G.feitos(h); if (!f.ti[t.id]) unlock(h, f, t, false); }
  });

  /* moedas gastas na cidade: toda compra de herói passa por G.earn dentro de updateHero */
  const SPEND = { servicos: 1, forja: 1, pocoes: 1, treino: 1 }, SPM = [1000, 5000, 25000, 100000, 500000];
  let curHero = null;
  const uh1 = G.updateHero;
  G.updateHero = (h, dt, mons) => { curHero = h; uh1(h, dt, mons); curHero = null; };
  const er0 = G.earn;
  G.earn = (n, why) => {
    er0(n, why);
    if (!(n > 0)) return;
    const L = G.S.lendas; if (!L) return;
    n = Math.round(n); L.gd += n;
    const r = L.rec.gd; if (L.gd > (r ? r.v : 0)) recSet('gd', L.gd, '');
    if (curHero && SPEND[why]) {
      const h = curHero, f = G.feitos(h), b = f.sp; f.sp += n;
      for (let i = 0; i < SPM.length; i++) if (b < SPM[i] && f.sp >= SPM[i]) { mark(h, 'gastou ' + G.fmt(SPM[i]) + ' moedas na cidade', f); break; }
      titleCheck(h, 's');
    }
  };

  /* virada do dia: o Herói do Dia sai antes do relatório; depois, dias a serviço */
  const nd0 = G.newDay;
  G.newDay = () => {
    const S = G.S, L = G.lendas();
    try { const best = pickHod(); if (best) applyHod(best); } catch (e) { if (G.DEBUG) console.error('hod', e); }
    nd0();
    const last = S.rep.last; if (last) recSet('gd', Math.max(L.gd, last._in || 0), '');
    L.gd = 0;
    for (const h of S.heroes) if (h.feitos) titleCheck(h, 't');
  };

  /* bônus do título exibido entram na soma do herói (fluxo normal de atributos: cache _dirty) */
  const hb0 = G.heroBonus;
  G.heroBonus = (h) => {
    const b = hb0(h), f = h.feitos, t = f && f.ts ? TBY[f.ts] : null;
    if (t) for (const k in t.p) if (b[k] !== undefined) b[k] += t.p[k];
    return b;
  };

  /* herói novo já nasce com o Livro aberto */
  const hi0 = G.hire;
  G.hire = (c) => { const h = hi0(c); if (h) G.feitos(h); return h; };

  /* relógio: poder uma vez por segundo, peça mais forte a cada 5 s */
  let t1 = 0, t5 = 0;
  const tk0 = G.tick;
  G.tick = (dt) => {
    tk0(dt);
    if (!G.S.lendas) return;
    t1 += dt; if (t1 >= 1) { t1 = 0; powerTick(); }
    t5 += dt; if (t5 >= 5) { t5 = 0; gearScan(); }
  };

  /* jogo novo e save carregado. Herói de save antigo ganha os títulos que já merecia, em silêncio, e um único aviso. */
  const init = (load) => {
    const S = G.S, L = G.lendas(); pc = null; hitBest = L.rec.hit ? L.rec.hit.v : 0; t1 = t5 = 0; curHero = null;
    if (load && !L.seen) {
      for (const h of S.heroes) { G.feitos(h); for (const ev in TBYEV) L.boot += titleCheck(h, ev, true); }
      if (L.boot > 0) G.toast('O Livro de Feitos reconheceu ' + L.boot + (L.boot === 1 ? ' título' : ' títulos') + ' pelos feitos de antes.', 'epic', 'trophy');
    }
    L.seen = 1;
  };
  const al0 = G.afterLoad;
  G.afterLoad = () => { al0(); init(true); };
  const ng0 = G.newGame;
  G.newGame = () => { const r = ng0(); init(false); return r; };
})();

;
